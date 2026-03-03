'use client';

import { useState, useEffect } from 'react';
import { ImageUploader } from '@/components/ImageUploader/ImageUploader';
import { OcrResult } from '@/components/OcrResult/OcrResult';
import { ChatDisplay } from '@/components/ChatDisplay/ChatDisplay';
import { recognizeImage } from '@/services/ocr-service';

export function OcrContainer() {
  const [isLoading, setIsLoading] = useState(false);
  const [ocrText, setOcrText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // 清理 Blob URL，防止内存泄漏
  // React 会自动管理：previewUrl 变化时清理旧 URL，组件卸载时清理当前 URL
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleImageSelect = async (base64: string, preview: string) => {
    // 直接设置新的 previewUrl，useEffect 会自动清理旧的
    setPreviewUrl(preview);
    setError(null);
    setOcrText('');
    setIsLoading(true);

    try {
      const text = await recognizeImage(base64);
      setOcrText(text);
    } catch (err) {
      setError(err instanceof Error ? err.message : '识别失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <ImageUploader
        onImageSelect={handleImageSelect}
        isLoading={isLoading}
      />

      <OcrResult
        text={ocrText}
        error={error}
        previewUrl={previewUrl}
      />

      {ocrText && (
        <ChatDisplay
          ocrText={ocrText}
          onConfirm={() => {}}
        />
      )}
    </div>
  );
}
