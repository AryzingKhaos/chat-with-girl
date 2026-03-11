import { z } from 'zod';
import type { AnalysisResult } from '@/types/ai-analysis';

/**
 * Zod Schema 定义
 */
export const AnalysisResultSchema = z.object({
  mood: z.object({
    status: z.string(),
    confidence: z.number().min(0).max(100),
    evidence: z.array(z.string()),
    description: z.string(),
  }),
  personality: z.object({
    traits: z.array(z.string()),
    confidence: z.number().min(0).max(100),
    evidence: z.array(z.string()),
    description: z.string(),
    note: z.string().optional(),
  }),
  replyStrategy: z.object({
    context: z.string(),
    strategy: z.string(),
    suggestions: z.array(z.object({
      id: z.string(),
      type: z.enum(['humor', 'caring', 'deep', 'casual', 'flirty']),
      content: z.string(),
      explanation: z.string(),
      riskLevel: z.enum(['low', 'medium', 'high']),
    })),
    warnings: z.array(z.string()),
  }),
});

/**
 * 验证 AI 返回的 JSON 是否符合 Schema
 * @param data - 待验证的数据
 * @returns 验证后的 AnalysisResult
 * @throws 如果验证失败则抛出错误
 */
export function validateAnalysisResult(data: unknown): AnalysisResult {
  return AnalysisResultSchema.parse(data);
}
