/**
 * 单条消息数据结构
 */
export interface MessageItem {
  id: string;
  speaker: 'self' | 'other';
  nickname: string;
  content: string;
  timestamp?: number;
}

/**
 * 解析后的完整对话数据
 */
export interface ChatData {
  messages: MessageItem[];
  metadata: string[];
}

/**
 * 解析结果
 */
export interface ParseResult {
  success: boolean;
  data: ChatData | null;
  error: string | null;
}
