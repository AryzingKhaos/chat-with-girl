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
          'px-2 text-xs text-slate-500',
          isSelf ? 'text-right' : 'text-left',
        )}
      >
        {message.nickname}
      </div>

      {/* 消息气泡 */}
      <div
        className={cn(
          'min-h-[2.5rem] break-words rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap shadow-[0_10px_20px_-18px_rgba(15,23,42,0.45)]',
          isSelf && 'bg-linear-to-r from-cyan-500 via-sky-500 to-emerald-500 text-primary-foreground',
          !isSelf && !isUnknown && 'border border-white/70 bg-white/90 text-slate-700',
          isUnknown && 'border-2 border-amber-300 bg-amber-50 text-amber-900',
        )}
      >
        {message.content || '(空消息)'}
      </div>
    </li>
  );
}
