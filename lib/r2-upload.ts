/**
 * R2 上传服务（前端）
 * 通过服务端 API (/api/storage/upload) 将文件上传到 Cloudflare R2
 * 
 * 替代原先的 COS 上传方案，无需在前端引入 COS SDK
 */

// 上传类型定义
type UploadType = 'image' | 'video' | 'audio' | 'file';

// 上传选项接口
interface UploadOptions {
    onProgress?: (progress: number) => void;
    onError?: (error: Error) => void;
    folder?: string;
}

// 上传结果接口
interface UploadResult {
    url: string;
    key: string;
    bucket: string;
    filename: string;
    originalName: string;
    size: number;
    contentType: string;
}

class R2UploadService {
    /**
     * 上传文件到 R2（通过服务端 API）
     */
    async uploadFile(
        file: File,
        uploadType: UploadType = 'image',
        options?: UploadOptions
    ): Promise<string> {
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('uploadType', uploadType);
            if (options?.folder) {
                formData.append('folder', options.folder);
            }

            // 使用 XMLHttpRequest 以支持进度回调
            return new Promise((resolve, reject) => {
                const xhr = new XMLHttpRequest();

                // 上传进度
                xhr.upload.addEventListener('progress', (event) => {
                    if (event.lengthComputable) {
                        const progress = Math.round((event.loaded / event.total) * 100);
                        options?.onProgress?.(progress);
                    }
                });

                // 完成
                xhr.addEventListener('load', () => {
                    try {
                        const result = JSON.parse(xhr.responseText);
                        if (xhr.status === 200 && result.code === 1000 && result.data?.url) {
                            resolve(result.data.url);
                        } else {
                            const error = new Error(result.message || '上传失败');
                            options?.onError?.(error);
                            reject(error);
                        }
                    } catch (parseError) {
                        const error = new Error('解析上传结果失败');
                        options?.onError?.(error);
                        reject(error);
                    }
                });

                // 错误
                xhr.addEventListener('error', () => {
                    const error = new Error('网络错误，上传失败');
                    options?.onError?.(error);
                    reject(error);
                });

                // 超时
                xhr.addEventListener('timeout', () => {
                    const error = new Error('上传超时');
                    options?.onError?.(error);
                    reject(error);
                });

                xhr.open('POST', '/api/storage/upload');
                xhr.timeout = 120000; // 2分钟超时
                xhr.send(formData);
            });
        } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            options?.onError?.(err);
            throw err;
        }
    }

    /**
     * 带重试机制的上传
     */
    async uploadFileWithRetry(
        file: File,
        uploadType: UploadType = 'image',
        options?: UploadOptions,
        maxRetries: number = 3
    ): Promise<string> {
        let lastError: Error | null = null;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                return await this.uploadFile(file, uploadType, options);
            } catch (error) {
                lastError = error as Error;
                console.warn(`[R2Upload] 上传失败，第 ${attempt}/${maxRetries} 次尝试:`, lastError.message);

                if (attempt === maxRetries) {
                    throw new Error(`上传失败，已重试 ${maxRetries} 次。最后错误: ${lastError?.message}`);
                }

                // 等待后重试（递增延迟）
                await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
            }
        }

        throw lastError || new Error('上传失败');
    }

    /**
     * 批量上传文件
     */
    async uploadFiles(
        files: File[],
        uploadType: UploadType = 'image',
        options?: UploadOptions
    ): Promise<string[]> {
        const urls: string[] = [];
        let totalProgress = 0;

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const url = await this.uploadFileWithRetry(file, uploadType, {
                ...options,
                onProgress: (progress) => {
                    totalProgress = ((i * 100) + progress) / files.length;
                    options?.onProgress?.(Math.round(totalProgress));
                },
            });
            urls.push(url);
        }

        return urls;
    }
}

// 导出单例实例
export const r2UploadService = new R2UploadService();

// 默认导出
export default r2UploadService;

// 导出类和类型
export { R2UploadService };
export type { UploadType, UploadOptions, UploadResult };
