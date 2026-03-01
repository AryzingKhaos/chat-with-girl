import type { OcrRequest, OcrResponse, OcrErrorResponse } from '@/types/ocr';

/**
 * 调用 OCR API 识别图片文字
 * @param imageBase64 - 完整的 base64 data URL
 * @returns 识别出的文字
 */
export async function recognizeImage(
  imageBase64: string
): Promise<string> {
  const response = await fetch('/api/ocr', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ imageBase64 } as OcrRequest),
  });

  if (!response.ok) {
    const error: OcrErrorResponse = await response.json();
    throw new Error(error.error || '识别失败');
  }

  const data: OcrResponse = await response.json();
  return data.text;
}
