import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { log, logError } from '@/lib/logger';
import { auth } from '@/auth';
import { newStorage } from '@/lib/storage';
import { getUserCredits, updateUserCredits } from '@/models/credit';
import { supabase } from '@/models/db';

/**
 * Pro 模式 - 使用 Google 官方 AI Studio API
 * 同步模式：直接返回生成的图片
 * 最多支持 14 张参考图片（6物品 + 5人物 + ?）
 * 积分消耗：20 积分
 */
export async function POST(request: NextRequest) {
    try {
        const session = await auth();

        if (!session || !session.user || !session.user.email) {
            return NextResponse.json(
                { code: 401, message: '未登录' },
                { status: 401 }
            );
        }

        const { data: userData } = await supabase
            .from('users')
            .select('uuid')
            .eq('email', session.user.email)
            .single();

        if (!userData) {
            return NextResponse.json(
                { code: 404, message: '用户不存在' },
                { status: 404 }
            );
        }

        const userUuid = userData.uuid;
        const COST = 20;

        // 检查积分余额
        const userCredits = await getUserCredits(userUuid);
        const balance = userCredits?.balance || 0;

        if (balance < COST) {
            return NextResponse.json(
                { code: 403, message: `积分不足，需要 ${COST} 积分` },
                { status: 403 }
            );
        }

        const body = await request.json();
        const { prompt, aspectRatio = '1:1', resolution = '2K', images } = body;

        log('[Fashion Generate Pro] 收到请求:', {
            user: session.user.email,
            prompt: prompt?.substring(0, 50),
            aspectRatio,
            resolution,
            imageCount: images?.length || 0
        });

        // 验证图片数量限制
        if (images && images.length > 14) {
            return NextResponse.json(
                { code: 400, message: 'Pro模式最多支持14张参考图片' },
                { status: 400 }
            );
        }

        const GOOGLE_GENAI_API_KEY = process.env.GOOGLE_GENAI_API_KEY;

        if (!GOOGLE_GENAI_API_KEY) {
            logError('[Fashion Generate Pro] 缺少 GOOGLE_GENAI_API_KEY');
            return NextResponse.json(
                { code: 500, message: '服务配置错误' },
                { status: 500 }
            );
        }

        const ai = new GoogleGenAI({ apiKey: GOOGLE_GENAI_API_KEY });

        // 构建 contents 数组
        const contents: any[] = [{ text: prompt }];

        // 添加参考图片
        if (images && images.length > 0) {
            for (const img of images) {
                // img 格式: { data: base64string, mimeType: 'image/jpeg' }
                contents.push({
                    inlineData: {
                        mimeType: img.mimeType || 'image/jpeg',
                        data: img.data, // 纯 base64 数据
                    }
                });
            }
        }

        log('[Fashion Generate Pro] 调用 Google AI API...', {
            model: 'gemini-3-pro-image-preview',
            contentParts: contents.length,
            aspectRatio,
            resolution
        });

        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-image-preview',
            contents: contents,
            config: {
                responseModalities: ['TEXT', 'IMAGE'],
                imageConfig: {
                    aspectRatio: aspectRatio,
                    imageSize: resolution,
                },
            },
        });

        log('[Fashion Generate Pro] API 响应收到');

        // 解析响应
        let generatedImageBase64: string | null = null;
        let responseText: string | null = null;

        if (response.candidates && response.candidates[0]?.content?.parts) {
            for (const part of response.candidates[0].content.parts) {
                if (part.text) {
                    responseText = part.text;
                    log('[Fashion Generate Pro] 文本响应:', responseText);
                } else if (part.inlineData) {
                    generatedImageBase64 = part.inlineData.data || null;
                    log('[Fashion Generate Pro] 收到图片数据, 大小:',
                        generatedImageBase64 ? `${Math.round(generatedImageBase64.length / 1024)}KB` : 'null');
                }
            }
        }

        if (!generatedImageBase64) {
            logError('[Fashion Generate Pro] 未获取到图片数据');
            return NextResponse.json(
                { code: 500, message: responseText || '生成失败，未获取到图片' },
                { status: 500 }
            );
        }

        // 扣除积分
        await updateUserCredits(
            userUuid,
            -COST,
            'generation',
            'Pro Fashion Gen'
        );

        // 上传到 R2
        try {
            const storage = newStorage();

            const now = new Date();
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const day = String(now.getDate()).padStart(2, '0');
            const timestamp = now.getTime();
            const random = Math.random().toString(36).substring(2, 15);
            const filename = `${timestamp}-${random}.png`;
            const key = `ai-generated/fashion-pro/${year}/${month}/${day}/${filename}`;

            const buffer = Buffer.from(generatedImageBase64, 'base64');

            const uploadResult = await storage.uploadFile({
                key,
                body: buffer,
                contentType: 'image/png',
                disposition: 'inline'
            });

            log('[Fashion Generate Pro] 图片上传 R2 成功:', uploadResult);

            return NextResponse.json({
                code: 1000,
                message: 'success',
                data: {
                    imageUrl: uploadResult.url,
                    text: responseText,
                    cost: COST
                }
            });
        } catch (uploadError: any) {
            logError('[Fashion Generate Pro] R2 上传失败，返回 base64:', uploadError);
            // 上传失败时返回 base64 数据 URI (但积分已扣除，因为图已生成)
            return NextResponse.json({
                code: 1000,
                message: 'success',
                data: {
                    imageUrl: `data:image/png;base64,${generatedImageBase64}`,
                    text: responseText,
                    cost: COST
                }
            });
        }
    } catch (error: any) {
        logError('[Fashion Generate Pro] 错误:', error);

        // 处理 Google API 特定错误
        const errorMsg = error.message || '生成失败';
        const statusCode = error.status || 500;

        return NextResponse.json(
            {
                code: statusCode,
                message: errorMsg
            },
            { status: statusCode > 599 ? 500 : statusCode }
        );
    }
}
