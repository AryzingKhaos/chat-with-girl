import type { MessageItem } from '@/types/chat';
import type { AiProvider, AnalysisResult } from '@/types/ai-analysis';

/**
 * 调用 AI 分析 API
 * @param messages - 消息列表
 * @param provider - AI 提供商
 * @returns 分析结果
 */
export async function analyzeChat(
  messages: MessageItem[],
  provider: AiProvider
): Promise<AnalysisResult> {
  const response = await fetch('/api/analyze', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messages,
      provider,
    }),
  });

  const data = await response.json();

  if (!data.success) {
    throw new Error(data.error || '分析失败');
  }

  return data.data;
}
