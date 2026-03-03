import { v4 as uuidv4 } from 'uuid';
import type { ParseResult, MessageItem } from '@/types/chat';

const MAX_NICKNAME_LENGTH = 20;

/**
 * 安全截断字符串,避免截断 Unicode 代理对
 */
function safeTruncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) {
    return str;
  }

  let truncated = str.substring(0, maxLength);
  const lastChar = truncated.charCodeAt(truncated.length - 1);

  // 检查最后一个字符是否为高代理项(emoji 的前半部分)
  if (lastChar >= 0xd800 && lastChar <= 0xdbff) {
    truncated = truncated.substring(0, maxLength - 1);
  }

  return truncated + '...';
}

/**
 * 解析 OCR 文本为结构化对话数据
 * @param ocrText - OCR 识别返回的纯文本
 * @returns 解析结果,包含成功标识、数据和错误信息
 */
export function parseChatText(ocrText: string): ParseResult {
  try {
    // 文本非空检查
    if (!ocrText || ocrText.trim().length === 0) {
      return {
        success: true,
        data: {
          messages: [],
          metadata: [],
        },
        error: null,
      };
    }

    const messages: MessageItem[] = [];
    const metadata: string[] = [];
    let isInMetadataSection = false;

    // 正则表达式
    const messageRegex = /^(对方|自己|未知)\((.+?)\):\s*(.*)$/;
    const separatorRegex = /^---\s*非对话信息\s*---$/;

    // 按行分割文本
    const lines = ocrText.split('\n');

    for (const line of lines) {
      const trimmedLine = line.trim();

      // 检查是否为空行
      if (trimmedLine.length === 0) {
        continue;
      }

      // 检查是否为分隔符
      if (separatorRegex.test(trimmedLine)) {
        isInMetadataSection = true;
        continue;
      }

      // 如果已进入非对话区域,归类为非对话信息
      if (isInMetadataSection) {
        metadata.push(trimmedLine);
        continue;
      }

      // 正则匹配对话格式
      const match = trimmedLine.match(messageRegex);
      if (match) {
        const [, speakerType, nickname, content] = match;

        // 确定说话人角色
        let speaker: 'self' | 'other';
        if (speakerType === '自己') {
          speaker = 'self';
        } else {
          speaker = 'other';
        }

        // 昵称长度限制,安全截断
        const truncatedNickname = safeTruncate(nickname, MAX_NICKNAME_LENGTH);

        // 生成 MessageItem
        messages.push({
          id: uuidv4(),
          speaker,
          nickname: speaker === 'self' ? '自己' : truncatedNickname,
          content: content || '',
        });
      } else {
        // 无法匹配对话格式
        // 如果之前已有消息,追加到最后一条消息的内容(处理多行消息)
        // 否则归类为非对话信息
        if (messages.length > 0) {
          const lastMessage = messages[messages.length - 1];
          lastMessage.content += '\n' + trimmedLine;
        } else {
          metadata.push(trimmedLine);
        }
      }
    }

    return {
      success: true,
      data: {
        messages,
        metadata,
      },
      error: null,
    };
  } catch (error) {
    return {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : '解析失败',
    };
  }
}
