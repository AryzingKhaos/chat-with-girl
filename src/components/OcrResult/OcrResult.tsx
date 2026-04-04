'use client';

import { Copy, CheckCheck } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';

interface OcrResultProps {
  text: string;
  error: string | null;
  previewUrl: string | null;
}

export function OcrResult({ text, error, previewUrl }: OcrResultProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success('已复制到剪贴板');

      // 2秒后恢复图标
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('复制失败，请重试');
    }
  };

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!text && !previewUrl) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {/* 图片预览 */}
      {previewUrl && (
        <Card className="surface-card p-4">
          <h3 className="mb-2 text-sm font-semibold text-slate-700">原图预览</h3>
          <img
            src={previewUrl}
            alt="上传的图片"
            className="h-auto w-full rounded-xl border border-white/70"
          />
        </Card>
      )}

      {/* 识别结果 */}
      {text && (
        <Card className="surface-card p-4">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-700">识别结果</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className="gap-2 font-semibold"
            >
              {copied ? (
                <>
                  <CheckCheck className="h-4 w-4" />
                  已复制
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  复制
                </>
              )}
            </Button>
          </div>
          <div className="max-h-96 overflow-y-auto rounded-xl border border-cyan-100 bg-white/80 p-3 font-mono text-sm leading-6 whitespace-pre-wrap">
            {text}
          </div>
        </Card>
      )}
    </div>
  );
}
