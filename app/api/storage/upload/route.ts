import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { newStorage } from '@/lib/storage';
import { log, logError } from '@/lib/logger';

/**
 * 上传文件到 R2 存储
 * POST /api/storage/upload
 * 
 * 接受 multipart/form-data 格式:
 * - file: 要上传的文件
 * - uploadType: 上传类型 (image | video | audio)
 * - folder: 可选，自定义文件夹路径
 */
export async function POST(request: NextRequest) {
    try {
        // 验证登录状态
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json(
                { code: 401, message: '未登录' },
                { status: 401 }
            );
        }

        // 检查 R2 存储是否配置
        if (!process.env.STORAGE_ENDPOINT || !process.env.STORAGE_BUCKET ||
            !process.env.STORAGE_ACCESS_KEY || !process.env.STORAGE_SECRET_KEY) {
            return NextResponse.json(
                { code: 500, message: 'R2 存储未配置' },
                { status: 500 }
            );
        }

        const formData = await request.formData();
        const file = formData.get('file') as File | null;
        const uploadType = (formData.get('uploadType') as string) || 'image';
        const folder = (formData.get('folder') as string) || '';

        if (!file) {
            return NextResponse.json(
                { code: 400, message: '缺少文件' },
                { status: 400 }
            );
        }

        // 验证文件大小 (最大 50MB)
        const MAX_FILE_SIZE = 50 * 1024 * 1024;
        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json(
                { code: 400, message: '文件大小超过限制 (最大 50MB)' },
                { status: 400 }
            );
        }

        log('[Storage Upload] 开始上传文件:', {
            user: session.user.email,
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type,
            uploadType,
        });

        // 生成存储路径
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const timestamp = now.getTime();
        const random = Math.random().toString(36).substring(2, 15);

        // 获取文件扩展名
        const ext = file.name.split('.').pop() || 'bin';
        const filename = `${timestamp}-${random}.${ext}`;

        // 根据上传类型构建路径
        let basePath = '';
        if (folder) {
            basePath = folder;
        } else {
            switch (uploadType) {
                case 'image':
                    basePath = `uploads/images/${year}/${month}/${day}`;
                    break;
                case 'video':
                    basePath = `uploads/videos/${year}/${month}/${day}`;
                    break;
                case 'audio':
                    basePath = `uploads/audio/${year}/${month}/${day}`;
                    break;
                default:
                    basePath = `uploads/files/${year}/${month}/${day}`;
            }
        }

        const key = `${basePath}/${filename}`;

        // 将 File 转换为 Buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // 上传到 R2
        const storage = newStorage();
        const result = await storage.uploadFile({
            body: buffer,
            key,
            contentType: file.type || 'application/octet-stream',
            disposition: 'inline',
        });

        log('[Storage Upload] 文件上传成功:', result);

        return NextResponse.json({
            code: 1000,
            message: 'success',
            data: {
                url: result.url,
                key: result.key,
                bucket: result.bucket,
                filename: result.filename,
                originalName: file.name,
                size: file.size,
                contentType: file.type,
            },
        });
    } catch (error: any) {
        logError('[Storage Upload] 上传失败:', error);
        return NextResponse.json(
            {
                code: 500,
                message: error.message || '上传失败',
                error: { details: error.message },
            },
            { status: 500 }
        );
    }
}
