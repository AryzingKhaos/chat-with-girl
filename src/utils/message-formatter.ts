import type { MessageItem } from '@/types/chat';

/**
 * 将消息列表转换为对话文本
 * @param messages - 消息列表
 * @returns 格式化的对话文本
 */
export function formatMessagesForAi(messages: MessageItem[]): string {
  return messages.map(msg => {
    const speaker = msg.speaker === 'self' ? '自己' : `对方(${msg.nickname})`;
    return `${speaker}: ${msg.content}`;
  }).join('\n');
}
