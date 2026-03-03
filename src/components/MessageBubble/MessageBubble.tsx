import type { MessageItem } from '@/types/chat';
import { cn } from '@/lib/utils';

interface MessageBubbleProps {
  message: MessageItem;
}

/**
 * 单条消息气泡组件
 */
export function MessageBubble({ message }: MessageBubbleProps) {
  const isSelf = message.speaker === 'self';
  const isUnknown = message.nickname === '未知';

  return (
    <li
      className={cn(
        'flex flex-col gap-1 max-w-[90%] md:max-w-[60%]',
        isSelf ? 'items-end ml-auto' : 'items-start mr-auto',
      )}
      role="article"
      aria-label={`来自${message.nickname}的消息`}
    >
      {/* 昵称 */}
      <div
        className={cn(
          'text-xs text-muted-foreground px-2',
          isSelf ? 'text-right' : 'text-left',
        )}
      >
        {message.nickname}
      </div>

      {/* 消息气泡 */}
      <div
        className={cn(
          'rounded-lg px-4 py-2 whitespace-pre-wrap break-words min-h-[2.5rem]',
          isSelf && 'bg-primary text-primary-foreground',
          !isSelf && !isUnknown && 'bg-muted',
          isUnknown && 'bg-muted border-2 border-yellow-500',
        )}
      >
        {message.content || '(空消息)'}
      </div>
    </li>
  );
}
