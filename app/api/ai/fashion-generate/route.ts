import { NextRequest, NextResponse } from 'next/server';
import { log, logError } from '@/lib/logger';
import { auth } from '@/auth';
import { getUserCredits, updateUserCredits } from '@/models/credit';
import { supabase } from '@/models/db';

/**
 * Standard 模式 - 使用 apimart.ai 第三方API
 * 异步模式：返回 task_id，前端轮询获取结果
 * 最多支持 5 张参考图片
 * 积分消耗：10 积分
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
        const COST = 10;

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
        const { prompt, size = '1:1', resolution = '2K', image_urls } = body;

        log('[Fashion Generate Standard] 收到请求:', {
            user: session.user.email,
            prompt: prompt?.substring(0, 50),
            size,
            resolution,
            imageCount: image_urls?.length || 0
        });

        // 验证图片数量限制
        if (image_urls && image_urls.length > 5) {
            return NextResponse.json(
                { code: 400, message: 'Standard模式最多支持5张参考图片' },
                { status: 400 }
            );
        }

        const APIMART_API_URL = process.env.APIMART_API_URL;
        const APIMART_API_KEY = process.env.APIMART_API_KEY;

        if (!APIMART_API_URL || !APIMART_API_KEY) {
            logError('[Fashion Generate Standard] 缺少 APIMART 配置');
            return NextResponse.json(
                { code: 500, message: '服务配置错误' },
                { status: 500 }
            );
        }

        // 构建请求体
        const requestBody: Record<string, any> = {
            model: 'gemini-3-pro-image-preview',
            prompt,
            size,
            n: 1,
            resolution
        };

        if (image_urls && image_urls.length > 0) {
            requestBody.image_urls = image_urls;
        }

        log('[Fashion Generate Standard] 调用 Apimart API:', {
            url: `${APIMART_API_URL}/v1/images/generations`,
            model: requestBody.model,
            size: requestBody.size,
            imageCount: image_urls?.length || 0
        });

        const response = await fetch(`${APIMART_API_URL}/v1/images/generations`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${APIMART_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        const result = await response.json();
        log('[Fashion Generate Standard] API 响应:', result);

        if (result.code === 200 && result.data && result.data.length > 0) {
            // 扣除积分
            await updateUserCredits(
                userUuid,
                -COST,
                'generation',
                'Standard Fashion Gen'
            );

            const taskId = result.data[0].task_id;
            return NextResponse.json({
                code: 1000,
                message: 'success',
                data: {
                    task_id: taskId,
                    status: 'submitted',
                    cost: COST
                }
            });
        } else {
            logError('[Fashion Generate Standard] API 错误:', result);
            return NextResponse.json(
                {
                    code: result.error?.code || 500,
                    message: result.error?.message || '生成失败',
                    error: result.error
                },
                { status: result.error?.code || 500 }
            );
        }
    } catch (error: any) {
        logError('[Fashion Generate Standard] 错误:', error);
        return NextResponse.json(
            {
                code: 500,
                message: error.message || '生成失败'
            },
            { status: 500 }
        );
    }
}
