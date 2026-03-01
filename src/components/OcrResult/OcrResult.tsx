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
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* 图片预览 */}
      {previewUrl && (
        <Card className="p-4">
          <h3 className="text-sm font-medium mb-2">原图预览</h3>
          <img
            src={previewUrl}
            alt="上传的图片"
            className="w-full h-auto rounded"
          />
        </Card>
      )}

      {/* 识别结果 */}
      {text && (
        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium">识别结果</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className="gap-2"
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
          <div className="whitespace-pre-wrap text-sm bg-muted p-3 rounded max-h-96 overflow-y-auto">
            {text}
          </div>
        </Card>
      )}
    </div>
  );
}
