'use client';

import { useMemo } from 'react';
import { parseChatText } from '@/utils/chat-parser';
import { MessageBubble } from '@/components/MessageBubble/MessageBubble';
import { MetadataSection } from '@/components/MetadataSection/MetadataSection';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

interface ChatDisplayProps {
  ocrText: string;
  onConfirm: () => void;
}

/**
 * 对话展示组件
 */
export function ChatDisplay({ ocrText, onConfirm }: ChatDisplayProps) {
  // 解析 OCR 文本
  const parseResult = useMemo(() => parseChatText(ocrText), [ocrText]);

  if (!parseResult.success || !parseResult.data) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {parseResult.error || '解析失败'}
        </AlertDescription>
      </Alert>
    );
  }

  const { messages, metadata } = parseResult.data;

  // 边界情况: 空输入
  if (messages.length === 0 && metadata.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        暂无对话内容
      </div>
    );
  }

  // 边界情况: 无有效对话
  if (messages.length === 0) {
    return (
      <div className="space-y-4">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            未识别到有效对话,请检查截图内容
          </AlertDescription>
        </Alert>
        <MetadataSection metadata={metadata} />
      </div>
    );
  }

  // 边界情况: 对话数量超限
  const showWarning = messages.length > 200;

  return (
    <div className="space-y-4">
      {/* 警告提示 */}
      {showWarning && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            消息数量过多({messages.length} 条),可能影响性能
          </AlertDescription>
        </Alert>
      )}

      {/* 对话内容区域 */}
      <div className="space-y-4 p-4 border rounded-lg bg-background">
        <h3 className="text-sm font-medium mb-4">对话内容</h3>

        {/* 消息列表 */}
        <ul
          className="space-y-3 max-h-[600px] overflow-y-auto"
          role="list"
          aria-label="聊天消息列表"
        >
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}
        </ul>

        {/* 确认按钮 */}
        <div className="flex justify-end pt-4 border-t">
          <Button onClick={onConfirm}>
            确认聊天内容
          </Button>
        </div>
      </div>

      {/* 非对话信息区域 */}
      <MetadataSection metadata={metadata} />
    </div>
  );
}
