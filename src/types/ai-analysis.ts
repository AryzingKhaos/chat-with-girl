/**
 * AI 提供商类型
 */
export type AiProvider = 'chatgpt' | 'gemini';

/**
 * 建议类型
 */
export type SuggestionType =
  | 'humor'    // 幽默风趣
  | 'caring'   // 关心体贴
  | 'deep'     // 深度交流
  | 'casual'   // 轻松日常
  | 'flirty';  // 轻微调情

/**
 * 单条回复建议
 */
export interface ReplySuggestion {
  id: string;
  type: SuggestionType;
  content: string;
  explanation: string;
  riskLevel: 'low' | 'medium' | 'high';
}

/**
 * 回复策略
 */
export interface ReplyStrategy {
  context: string;
  strategy: string;
  suggestions: ReplySuggestion[];
  warnings: string[];
}

/**
 * 心情状态分析
 */
export interface MoodAnalysis {
  status: string;
  confidence: number;
  evidence: string[];
  description: string;
}

/**
 * 性格分析
 */
export interface PersonalityAnalysis {
  traits: string[];
  confidence: number;
  evidence: string[];
  description: string;
  note?: string;
}

/**
 * 分析结果数据结构
 */
export interface AnalysisResult {
  mood: MoodAnalysis;
  personality: PersonalityAnalysis;
  replyStrategy: ReplyStrategy;
}

/**
 * AI 分析请求
 */
export interface AiAnalysisRequest {
  messages: Array<{
    id: string;
    speaker: 'self' | 'other';
    nickname: string;
    content: string;
  }>;
  provider: AiProvider;
}

/**
 * AI 分析响应
 */
export interface AiAnalysisResponse {
  success: boolean;
  data: AnalysisResult | null;
  error: string | null;
}
