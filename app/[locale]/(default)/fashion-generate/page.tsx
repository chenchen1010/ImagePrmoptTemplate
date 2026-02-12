"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { authEventBus } from "@/lib/auth-event";
import { Loader2, Upload, X, Image as ImageIcon, Sparkles, Download, ExternalLink, Heart, MessageCircle, Star, Send } from "lucide-react";
import { cn } from "@/lib/utils";

// 图片分类类型
type ImageCategory = 'clothing' | 'scene' | 'model';

interface UploadedImage {
    id: string;
    file: File;
    preview: string;
    category: ImageCategory;
    base64?: string;
    mimeType?: string;
}

// 档位类型
type Tier = 'standard' | 'pro';

const DEFAULT_PROMPT = "模特在这个场景下穿着这样的服装配饰，生成模特图";

const ASPECT_RATIOS = ['1:1', '3:4', '4:3', '9:16', '16:9'] as const;

const CATEGORY_CONFIG = {
    clothing: { label: '服装', sublabel: 'Clothing', icon: '👗', description: '上传您的服装款式参考图' },
    scene: { label: '场景', sublabel: 'Scene', icon: '🏞️', description: '上传您想要的背景环境参考图' },
    model: { label: '模特', sublabel: 'Model', icon: '👤', description: '上传模特参考或姿势图' },
} as const;

export default function FashionGeneratePage() {
    const { data: session } = useSession();

    // 核心状态
    const [tier, setTier] = useState<Tier>('standard');
    const [prompt, setPrompt] = useState(DEFAULT_PROMPT);
    const [aspectRatio, setAspectRatio] = useState<string>('3:4');
    const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
    const [userPoints, setUserPoints] = useState<number | null>(null);

    // 生成状态
    const [isGenerating, setIsGenerating] = useState(false);
    const [generationProgress, setGenerationProgress] = useState(0);
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const [responseText, setResponseText] = useState<string | null>(null);

    // 文件输入引用
    const fileInputRefs = useRef<Record<ImageCategory, HTMLInputElement | null>>({
        clothing: null,
        scene: null,
        model: null,
    });

    // 获取用户积分
    const fetchPoints = async () => {
        if (!session) return;
        try {
            const res = await fetch('/api/user/account');
            const data = await res.json();
            if (data.code === 1000) {
                setUserPoints(data.data.availablePoints);
            }
        } catch (e) {
            console.error('Fetch points failed', e);
        }
    };

    useEffect(() => {
        fetchPoints();
    }, [session]);

    const maxImagesTotal = tier === 'standard' ? 5 : 14;
    const cost = tier === 'standard' ? 10 : 20;

    // 文件转 base64
    const fileToBase64 = (file: File): Promise<{ data: string; mimeType: string }> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                const result = reader.result as string;
                const [header, data] = result.split(',');
                const mimeType = header.match(/data:(.+);base64/)?.[1] || 'image/jpeg';
                resolve({ data, mimeType });
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    };

    // 处理图片上传
    const handleImageUpload = useCallback(async (
        e: React.ChangeEvent<HTMLInputElement> | React.DragEvent<HTMLDivElement>,
        category: ImageCategory
    ) => {
        let files: File[] = [];

        if ('dataTransfer' in e) {
            e.preventDefault();
            files = Array.from(e.dataTransfer.files);
        } else {
            files = Array.from(e.target.files || []);
        }

        if (files.length === 0) return;

        // 验证逻辑
        const currentCategoryImages = uploadedImages.filter(img => img.category === category);
        const currentTotal = uploadedImages.length;

        // Pro 模式下限制单分类最多 5 张
        if (tier === 'pro' && currentCategoryImages.length + files.length > 5) {
            toast.warning(`Pro 模式下，${CATEGORY_CONFIG[category].label}最多只能上传 5 张`);
            const slots = 5 - currentCategoryImages.length;
            if (slots <= 0) return;
            files = files.slice(0, slots);
        }

        // 总数限制
        if (currentTotal + files.length > maxImagesTotal) {
            toast.warning(`当前模式最多支持 ${maxImagesTotal} 张参考图`);
            const slots = maxImagesTotal - currentTotal;
            if (slots <= 0) return;
            files = files.slice(0, slots);
        }

        const newImages: UploadedImage[] = [];
        for (const file of files) {
            if (file.size > 10 * 1024 * 1024) {
                toast.error(`${file.name} 超过 10MB 限制，已跳过`);
                continue;
            }

            if (!file.type.startsWith('image/')) {
                toast.error(`${file.name} 不是有效图片`);
                continue;
            }

            const { data, mimeType } = await fileToBase64(file);
            newImages.push({
                id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                file,
                preview: URL.createObjectURL(file),
                category,
                base64: data,
                mimeType,
            });
        }

        setUploadedImages(prev => [...prev, ...newImages]);

        if ('target' in e && e.target instanceof HTMLInputElement) {
            e.target.value = '';
        }
    }, [maxImagesTotal, uploadedImages, tier]);

    // 删除图片
    const handleRemoveImage = useCallback((id: string) => {
        setUploadedImages(prev => {
            const img = prev.find(i => i.id === id);
            if (img) URL.revokeObjectURL(img.preview);
            return prev.filter(i => i.id !== id);
        });
    }, []);

    // 切换档位
    const handleTierChange = (newTier: Tier) => {
        setTier(newTier);
        if (newTier === 'standard' && uploadedImages.length > 5) {
            toast.warning('切换到标准版，超出 5 张的图片将被忽略');
        }
    };

    // 生成图片
    const handleGenerate = async () => {
        if (!session) {
            toast.error('请先登录');
            authEventBus.emit({ type: 'login-expired', message: '请先登录' });
            return;
        }

        if (userPoints !== null && userPoints < cost) {
            toast.error('积分不足，请充值');
            return;
        }

        if (!prompt.trim()) {
            toast.error('请输入提示词');
            return;
        }

        setIsGenerating(true);
        setGeneratedImage(null);
        setResponseText(null);
        setGenerationProgress(0);

        try {
            const effectiveImages = uploadedImages.slice(0, tier === 'standard' ? 5 : 14);

            if (tier === 'standard') {
                await generateStandard(effectiveImages);
            } else {
                await generatePro(effectiveImages);
            }

            fetchPoints();

        } catch (error: any) {
            console.error('[FashionGenerate] 错误:', error);
            toast.error(error.message || '生成失败');
        } finally {
            setIsGenerating(false);
        }
    };

    // Standard 模式生成
    const generateStandard = async (images: UploadedImage[]) => {
        const image_urls = images.map(img => ({
            url: `data:${img.mimeType};base64,${img.base64}`
        }));

        const response = await fetch('/api/ai/fashion-generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                prompt,
                size: aspectRatio,
                resolution: '2K',
                image_urls: image_urls.length > 0 ? image_urls : undefined,
            }),
        });

        const result = await response.json();
        if (result.code !== 1000) throw new Error(result.message || '提交失败');

        const taskId = result.data.task_id;
        setGenerationProgress(10);

        const maxAttempts = 120;
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            await new Promise(r => setTimeout(r, 2000));

            const statusRes = await fetch(`/api/ai/fashion-generate/task/${taskId}`);
            const statusResult = await statusRes.json();

            if (statusResult.code !== 1000) throw new Error(statusResult.message || '查询失败');

            const taskData = statusResult.data;
            if (taskData.progress != null) {
                setGenerationProgress(Math.max(10, taskData.progress));
            }

            if (taskData.status === 'completed' && taskData.results?.length > 0) {
                setGenerationProgress(100);
                setGeneratedImage(taskData.results[0]);
                toast.success('生成成功！');
                return;
            }

            if (taskData.status === 'failed') {
                throw new Error(taskData.error || '生成失败');
            }
        }
        throw new Error('生成超时');
    };

    // Pro 模式生成
    const generatePro = async (images: UploadedImage[]) => {
        setGenerationProgress(30);

        const imagePayload = images.map(img => ({
            data: img.base64,
            mimeType: img.mimeType,
        }));

        const response = await fetch('/api/ai/fashion-generate/pro', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                prompt,
                aspectRatio,
                resolution: '2K',
                images: imagePayload.length > 0 ? imagePayload : undefined,
            }),
        });

        setGenerationProgress(80);
        const result = await response.json();
        if (result.code !== 1000) throw new Error(result.message || '生成失败');

        setGenerationProgress(100);
        setGeneratedImage(result.data.imageUrl);
        setResponseText(result.data.text);
        toast.success('生成成功！');
    };

    // 渲染分类上传卡片 (小红书风格大卡片)
    const renderCategoryCard = (category: ImageCategory) => {
        const config = CATEGORY_CONFIG[category];
        const categoryImages = uploadedImages.filter(img => img.category === category);
        const isPro = tier === 'pro';
        const limit = isPro ? 5 : 99;
        const canUpload = isPro ? categoryImages.length < limit : uploadedImages.length < 5;

        return (
            <div key={category} className="bg-white rounded-2xl p-5 shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-gray-100/60">
                {/* 卡片头部 */}
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-[15px] text-gray-800 flex items-center gap-2">
                        <span className="text-lg">{config.icon}</span>
                        {config.label}
                        <span className="text-xs font-normal text-gray-400">({config.sublabel})</span>
                    </h3>
                    {isPro && (
                        <span className="text-[10px] px-2 py-0.5 bg-red-50 text-[#FF2442] rounded-full font-medium">
                            {categoryImages.length}/5
                        </span>
                    )}
                </div>

                {/* 图片网格区域 */}
                <div
                    className={cn(
                        "relative rounded-xl overflow-hidden",
                        categoryImages.length === 0 && "border-2 border-dashed border-gray-200"
                    )}
                    onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                    onDrop={(e) => canUpload && handleImageUpload(e, category)}
                >
                    <input
                        type="file"
                        accept="image/*"
                        multiple
                        ref={el => { fileInputRefs.current[category] = el; }}
                        className="hidden"
                        onChange={(e) => handleImageUpload(e, category)}
                    />

                    {categoryImages.length === 0 ? (
                        /* 空状态 - 大面积上传热区 */
                        <div
                            className="flex flex-col items-center justify-center py-8 cursor-pointer group transition-colors hover:bg-[#FF2442]/[0.02]"
                            onClick={() => canUpload && fileInputRefs.current[category]?.click()}
                        >
                            <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mb-3 group-hover:bg-[#FF2442]/10 transition-colors">
                                <Upload className="w-5 h-5 text-gray-300 group-hover:text-[#FF2442]/60 transition-colors" />
                            </div>
                            <p className="text-sm text-gray-400">{config.description}</p>
                        </div>
                    ) : (
                        /* 已上传图片网格 */
                        <div className="flex items-center gap-3 flex-wrap p-1">
                            {categoryImages.map(img => (
                                <div key={img.id} className="relative w-[72px] h-[72px] rounded-xl overflow-hidden group/thumb shadow-sm">
                                    <img
                                        src={img.preview}
                                        alt=""
                                        className="w-full h-full object-cover"
                                    />
                                    {/* 删除按钮 */}
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleRemoveImage(img.id); }}
                                        className="absolute top-1 right-1 w-[18px] h-[18px] bg-black/40 backdrop-blur-sm text-white rounded-full flex items-center justify-center opacity-0 group-hover/thumb:opacity-100 transition-all duration-200 hover:bg-black/60"
                                    >
                                        <X className="w-2.5 h-2.5" />
                                    </button>
                                </div>
                            ))}
                            {/* + 添加按钮 */}
                            {canUpload && (
                                <div
                                    className="w-[72px] h-[72px] rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center cursor-pointer text-gray-300 hover:text-[#FF2442] hover:border-[#FF2442]/30 transition-all duration-200 bg-gray-50/50 hover:bg-[#FF2442]/[0.03]"
                                    onClick={() => fileInputRefs.current[category]?.click()}
                                >
                                    <span className="text-2xl font-light">+</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const insufficientPoints = userPoints !== null && userPoints < cost;

    return (
        <div className="min-h-screen bg-[#FAFAFA] font-sans">
            <div className="container mx-auto px-4 py-6 lg:py-8 max-w-[1400px]">

                {/* ===== HEADER ===== */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight">
                            <span className="bg-gradient-to-r from-[#FF2442] via-[#FF4D6A] to-[#FF8FA3] bg-clip-text text-transparent">
                                AI 穿搭实验室
                            </span>
                        </h1>
                        <p className="text-gray-400 text-sm mt-1 tracking-wide">小红书同款 · 一键生成时尚大片</p>
                    </div>

                    {/* 积分余额 */}
                    {userPoints !== null && (
                        <div className={cn(
                            "flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium shadow-sm transition-all",
                            insufficientPoints
                                ? "bg-red-50 border-red-200 text-red-500"
                                : "bg-white border-gray-200 text-gray-600"
                        )}>
                            <Sparkles className={cn("w-4 h-4", insufficientPoints ? "text-red-400" : "text-[#FF2442]")} />
                            <span>余额: <strong>{userPoints}</strong></span>
                        </div>
                    )}
                </div>

                {/* ===== MAIN GRID ===== */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-8">

                    {/* ────────── LEFT COLUMN: INPUTS ────────── */}
                    <div className="lg:col-span-5 xl:col-span-4 flex flex-col gap-4">

                        {/* ── Tier Switcher ── */}
                        <div className="flex p-1 bg-gray-100 rounded-2xl relative">
                            <div
                                className={cn(
                                    "absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-xl transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] shadow-sm",
                                    tier === 'pro'
                                        ? "translate-x-[calc(100%+8px)] bg-gradient-to-r from-[#FF2442] to-[#FF6B8B]"
                                        : "translate-x-0 bg-gradient-to-r from-[#FF2442] to-[#FF6B8B]"
                                )}
                            />
                            <button
                                onClick={() => handleTierChange('standard')}
                                className={cn(
                                    "flex-1 relative z-10 py-2.5 text-sm font-semibold transition-colors text-center rounded-xl",
                                    tier === 'standard' ? "text-white" : "text-gray-500"
                                )}
                            >
                                ⚡ 标准版（{10}积分）
                            </button>
                            <button
                                onClick={() => handleTierChange('pro')}
                                className={cn(
                                    "flex-1 relative z-10 py-2.5 text-sm font-semibold transition-colors text-center rounded-xl",
                                    tier === 'pro' ? "text-white" : "text-gray-500"
                                )}
                            >
                                💎 专业版（{20}积分）
                            </button>
                        </div>

                        {/* ── Prompt Input ── */}
                        <div className="bg-white rounded-2xl p-4 shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-gray-100/60">
                            <div className="flex items-center gap-2 mb-2">
                                <Sparkles className="w-4 h-4 text-[#FF2442]" />
                                <span className="text-xs font-semibold text-gray-500 tracking-wide uppercase">Prompt</span>
                            </div>
                            <Textarea
                                value={prompt}
                                onChange={e => setPrompt(e.target.value)}
                                placeholder="描述您想要的时尚风格...（例如：复古街拍、高定礼服）"
                                className="min-h-[72px] border-none shadow-none resize-none p-0 focus-visible:ring-0 text-sm text-gray-700 placeholder:text-gray-300 leading-relaxed"
                            />
                        </div>

                        {/* ── 三分类上传卡片 ── */}
                        <div className="flex flex-col gap-3">
                            {renderCategoryCard('clothing')}
                            {renderCategoryCard('scene')}
                            {renderCategoryCard('model')}
                        </div>

                        {/* ── Aspect Ratio ── */}
                        <div className="bg-white rounded-2xl p-4 shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-gray-100/60">
                            <h3 className="text-xs font-semibold text-gray-500 tracking-wide mb-3 uppercase">画面比例</h3>
                            <div className="flex flex-wrap gap-2">
                                {ASPECT_RATIOS.map(ratio => (
                                    <button
                                        key={ratio}
                                        onClick={() => setAspectRatio(ratio)}
                                        className={cn(
                                            "px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 border",
                                            aspectRatio === ratio
                                                ? "bg-[#FF2442] text-white border-[#FF2442] shadow-[0_2px_8px_rgba(255,36,66,0.3)]"
                                                : "bg-white text-gray-500 border-gray-200 hover:border-[#FF2442]/40 hover:text-[#FF2442]"
                                        )}
                                    >
                                        {ratio}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* ── Generate Button ── */}
                        <Button
                            onClick={handleGenerate}
                            disabled={isGenerating || insufficientPoints}
                            className={cn(
                                "w-full h-12 rounded-2xl text-base font-bold tracking-wide transition-all duration-300",
                                "bg-gradient-to-r from-[#FF2442] to-[#FF6B8B] hover:from-[#E01E3A] hover:to-[#FF5C7F]",
                                "shadow-[0_4px_20px_rgba(255,36,66,0.35)] hover:shadow-[0_6px_24px_rgba(255,36,66,0.45)]",
                                "active:scale-[0.98]",
                                isGenerating && "opacity-80 cursor-wait",
                                insufficientPoints && "opacity-50 cursor-not-allowed"
                            )}
                        >
                            {isGenerating ? (
                                <span className="flex items-center gap-2">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    AI 生成中 {generationProgress}%
                                </span>
                            ) : insufficientPoints ? (
                                <span>积分不足，请充值</span>
                            ) : (
                                <span className="flex items-center gap-2">
                                    <Sparkles className="w-4 h-4" />
                                    ✨ 生成时尚大片（消耗{cost}积分）
                                </span>
                            )}
                        </Button>
                    </div>

                    {/* ────────── RIGHT COLUMN: RESULTS ────────── */}
                    <div className="lg:col-span-7 xl:col-span-8 flex flex-col">
                        <div className="flex-1 bg-white rounded-2xl border border-gray-100/60 shadow-[0_2px_12px_rgba(0,0,0,0.04)] overflow-hidden flex flex-col min-h-[500px] lg:min-h-0 lg:h-[calc(100vh-140px)]">

                            {generatedImage ? (
                                /* ── 生成结果 - 小红书笔记风格 ── */
                                <div className="flex-1 flex flex-col overflow-hidden">
                                    {/* 图片展示区 */}
                                    <div className="flex-1 relative group bg-gray-50/30 flex items-center justify-center p-4 overflow-hidden">
                                        <img
                                            src={generatedImage}
                                            alt="AI Generated Fashion"
                                            className="max-w-full max-h-full object-contain rounded-xl shadow-lg"
                                        />

                                        {/* Hover 操作按钮 */}
                                        <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                            <Button
                                                size="icon"
                                                variant="secondary"
                                                className="h-9 w-9 rounded-full shadow-lg bg-white/90 hover:bg-white backdrop-blur-sm"
                                                onClick={() => window.open(generatedImage!, '_blank')}
                                            >
                                                <ExternalLink className="w-4 h-4 text-gray-600" />
                                            </Button>
                                            <Button
                                                size="icon"
                                                variant="secondary"
                                                className="h-9 w-9 rounded-full shadow-lg bg-white/90 hover:bg-white backdrop-blur-sm"
                                                onClick={() => {
                                                    const link = document.createElement('a');
                                                    link.href = generatedImage!;
                                                    link.download = `fashion-${Date.now()}.png`;
                                                    link.click();
                                                }}
                                            >
                                                <Download className="w-4 h-4 text-gray-600" />
                                            </Button>
                                        </div>
                                    </div>

                                    {/* 底部互动栏 - 小红书风格 */}
                                    <div className="border-t border-gray-100 px-5 py-3">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-5 text-gray-400">
                                                <button className="flex items-center gap-1.5 hover:text-[#FF2442] transition-colors group">
                                                    <Heart className="w-5 h-5 group-hover:fill-[#FF2442]/20" />
                                                    <span className="text-xs">喜欢</span>
                                                </button>
                                                <button className="flex items-center gap-1.5 hover:text-yellow-500 transition-colors">
                                                    <Star className="w-5 h-5" />
                                                    <span className="text-xs">收藏</span>
                                                </button>
                                                <button className="flex items-center gap-1.5 hover:text-blue-500 transition-colors">
                                                    <Send className="w-5 h-5" />
                                                    <span className="text-xs">分享</span>
                                                </button>
                                            </div>
                                            <span className="text-[10px] text-gray-300">Powered by AI ✨</span>
                                        </div>

                                        {/* 生成描述 */}
                                        {responseText && (
                                            <div className="mt-3 pt-3 border-t border-gray-50">
                                                <p className="text-xs text-gray-500 leading-relaxed line-clamp-3">
                                                    <span className="font-semibold text-gray-700 mr-1">AI描述</span>
                                                    {responseText}
                                                </p>
                                            </div>
                                        )}

                                        {/* 标签 */}
                                        <div className="flex flex-wrap gap-1.5 mt-3">
                                            {['#FashionAI', '#OOTD', '#穿搭灵感', '#AI生图'].map(tag => (
                                                <span key={tag} className="text-[11px] text-[#FF2442]/70 font-medium">{tag}</span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                /* ── 空状态 / 生成中 ── */
                                <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-8">
                                    {isGenerating ? (
                                        <div className="text-center">
                                            {/* 进度环 */}
                                            <div className="relative w-24 h-24 mx-auto mb-6">
                                                <svg className="w-full h-full -rotate-90" viewBox="0 0 96 96">
                                                    <circle cx="48" cy="48" r="42" fill="none" stroke="#F3F4F6" strokeWidth="4" />
                                                    <circle
                                                        cx="48" cy="48" r="42" fill="none"
                                                        stroke="url(#progressGradient)"
                                                        strokeWidth="4"
                                                        strokeLinecap="round"
                                                        strokeDasharray={`${2 * Math.PI * 42}`}
                                                        strokeDashoffset={`${2 * Math.PI * 42 * (1 - generationProgress / 100)}`}
                                                        className="transition-all duration-500 ease-out"
                                                    />
                                                    <defs>
                                                        <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                                            <stop offset="0%" stopColor="#FF2442" />
                                                            <stop offset="100%" stopColor="#FF8FA3" />
                                                        </linearGradient>
                                                    </defs>
                                                </svg>
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <span className="text-lg font-bold text-[#FF2442]">{generationProgress}%</span>
                                                </div>
                                            </div>
                                            <h3 className="text-lg font-bold text-gray-700 mb-2">AI 正在创作中...</h3>
                                            <p className="text-sm text-gray-400 max-w-[240px] mx-auto leading-relaxed">
                                                正在为您生成时尚大片，请耐心等待
                                            </p>

                                            {/* 进度条 */}
                                            <div className="mt-6 w-48 mx-auto">
                                                <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-gradient-to-r from-[#FF2442] to-[#FF8FA3] rounded-full transition-all duration-500 ease-out"
                                                        style={{ width: `${generationProgress}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="w-24 h-24 bg-gradient-to-br from-gray-50 to-gray-100 rounded-3xl flex items-center justify-center mb-4 shadow-inner">
                                                <ImageIcon className="w-10 h-10 text-gray-300" />
                                            </div>
                                            <p className="text-base font-semibold text-gray-400 mb-1">生成的时尚大片</p>
                                            <p className="text-sm text-gray-300">将在这里展示</p>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
