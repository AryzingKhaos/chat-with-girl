'use client';

import { useState, useRef } from 'react';
import { Upload, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  compressImage,
  fileToBase64,
  isValidImageType,
  isValidImageSize,
} from '@/utils/image-utils';

interface ImageUploaderProps {
  onImageSelect: (base64: string, previewUrl: string) => void;
  isLoading: boolean;
}

export function ImageUploader({ onImageSelect, isLoading }: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    // 验证文件类型
    if (!isValidImageType(file)) {
      toast.error('仅支持 JPG、PNG、WebP 格式');
      return;
    }

    // 验证文件大小
    if (!isValidImageSize(file, 5)) {
      toast.error('图片大小不能超过 5MB');
      return;
    }

    try {
      // 压缩图片
      const compressed = await compressImage(file, 1);

      // 转换为 base64（完整格式）
      const base64 = await fileToBase64(compressed);

      // 生成预览 URL
      const previewUrl = URL.createObjectURL(compressed);

      onImageSelect(base64, previewUrl);
    } catch (error) {
      toast.error('图片处理失败，请重试');
      console.error('图片处理错误:', error);
    }
  };

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  return (
    <Card
      className={cn(
        'surface-card flex cursor-pointer flex-col items-center justify-center border-2 border-dashed border-cyan-200/80 p-8 transition-all duration-200',
        isDragging && 'border-cyan-500 bg-cyan-50/70 shadow-[0_24px_48px_-32px_rgba(6,182,212,0.8)]',
        isLoading && 'cursor-not-allowed opacity-65'
      )}
      onClick={!isLoading ? handleClick : undefined}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleChange}
        disabled={isLoading}
      />

      <div className="flex flex-col items-center gap-3">
        {isLoading ? (
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        ) : (
          <Upload className="h-10 w-10 text-cyan-600" />
        )}

        <Button variant="outline" disabled={isLoading} type="button" className="font-semibold">
          {isLoading ? '识别中...' : '点击或拖拽上传图片'}
        </Button>

        <p className="text-sm text-slate-500">
          支持 JPG、PNG、WebP 格式，最大 5MB
        </p>
      </div>
    </Card>
  );
}
