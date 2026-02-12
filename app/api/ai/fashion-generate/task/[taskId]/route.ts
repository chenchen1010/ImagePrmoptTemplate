import { NextRequest, NextResponse } from 'next/server';
import { log, logError } from '@/lib/logger';
import { auth } from '@/auth';
import { newStorage } from '@/lib/storage';

/**
 * Standard 模式 - 轮询 apimart.ai 任务状态
 * 任务完成后自动上传结果到 R2
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ taskId: string }> }
) {
    try {
        const session = await auth();

        if (!session || !session.user) {
            return NextResponse.json(
                { code: 401, message: '未登录' },
                { status: 401 }
            );
        }

        const { taskId } = await params;

        const APIMART_API_URL = process.env.APIMART_API_URL;
        const APIMART_API_KEY = process.env.APIMART_API_KEY;

        if (!APIMART_API_URL || !APIMART_API_KEY) {
            return NextResponse.json(
                { code: 500, message: '服务配置错误' },
                { status: 500 }
            );
        }

        log('[Fashion Task] 查询任务状态:', { taskId });

        const response = await fetch(`${APIMART_API_URL}/v1/tasks/${taskId}`, {
            headers: {
                'Authorization': `Bearer ${APIMART_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        const rawResponse = await response.json();
        log('[Fashion Task] 任务状态:', rawResponse);

        // API 返回格式: { code: 200, data: { status, progress, result: { images: [...] } } }
        // 解包取出实际任务数据
        const taskData = rawResponse.data || rawResponse;
        const rawImages = taskData.result?.images || taskData.results || [];

        // images 数组元素可能是嵌套数组、字符串 URL 或对象 { url: '...' }
        // 先展平，再统一提取为字符串
        const flatImages = rawImages.flat(Infinity);
        const imageResults: string[] = flatImages.map((item: any) => {
            if (typeof item === 'string') return item;
            if (item?.url) return item.url;
            if (item?.src) return item.src;
            return String(item);
        }).filter((url: string) => url && url.startsWith('http'));

        log('[Fashion Task] 提取到图片 URL:', imageResults);

        // 如果任务已完成且有结果
        if (taskData.status === 'completed' && imageResults.length > 0) {
            // 如果没有配置公开存储域名，直接返回原始图片 URL，跳过 R2 上传
            if (!process.env.STORAGE_DOMAIN) {
                log('[Fashion Task] 任务完成，STORAGE_DOMAIN 未配置，直接返回原始 URL');
                return NextResponse.json({
                    code: 1000,
                    message: 'success',
                    data: {
                        ...taskData,
                        status: taskData.status,
                        progress: taskData.progress,
                        results: imageResults,
                    }
                });
            }

            log('[Fashion Task] 任务完成，开始上传到 R2, 图片数量:', imageResults.length);

            try {
                const storage = newStorage();

                const uploadedResults = await Promise.all(
                    imageResults.map(async (resultUrl: string, index: number) => {
                        try {
                            const urlPath = new URL(resultUrl).pathname;
                            const extMatch = urlPath.match(/\.(\w+)$/);
                            const extension = extMatch ? extMatch[1] : 'png';

                            const now = new Date();
                            const year = now.getFullYear();
                            const month = String(now.getMonth() + 1).padStart(2, '0');
                            const day = String(now.getDate()).padStart(2, '0');
                            const timestamp = now.getTime();
                            const random = Math.random().toString(36).substring(2, 15);
                            const filename = `${timestamp}-${random}.${extension}`;
                            const key = `ai-generated/fashion/${year}/${month}/${day}/${filename}`;

                            const uploadResult = await storage.downloadAndUpload({
                                url: resultUrl,
                                key,
                                contentType: `image/${extension}`,
                                disposition: 'inline'
                            });

                            log('[Fashion Task] 图片上传成功:', uploadResult);
                            return uploadResult.url;
                        } catch (uploadError: any) {
                            logError('[Fashion Task] 图片上传失败:', uploadError);
                            return resultUrl;
                        }
                    })
                );

                return NextResponse.json({
                    code: 1000,
                    message: 'success',
                    data: {
                        ...taskData,
                        status: taskData.status,
                        progress: taskData.progress,
                        results: uploadedResults,
                        original_results: imageResults,
                    }
                });
            } catch (uploadError: any) {
                logError('[Fashion Task] 批量上传失败:', uploadError);
                return NextResponse.json({
                    code: 1000,
                    message: 'success',
                    data: {
                        ...taskData,
                        results: imageResults,
                    }
                });
            }
        }

        return NextResponse.json({
            code: 1000,
            message: 'success',
            data: {
                ...taskData,
                results: imageResults,
            }
        });
    } catch (error: any) {
        logError('[Fashion Task] 查询失败:', error);
        return NextResponse.json(
            {
                code: 500,
                message: error.message || '查询失败'
            },
            { status: 500 }
        );
    }
}
