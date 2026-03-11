'use client';

import { Card } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';
import { ReplySuggestionCard } from '@/components/ReplySuggestion/ReplySuggestionCard';
import type { ReplyStrategy } from '@/types/ai-analysis';

interface ReplyStrategyCardProps {
  replyStrategy: ReplyStrategy;
}

/**
 * 回复策略卡片组件
 */
export function ReplyStrategyCard({ replyStrategy }: ReplyStrategyCardProps) {
  return (
    <Card className="p-6 space-y-4">
      <h3 className="text-lg font-semibold">3. 回复策略</h3>

      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">对方最后说:</p>
        <p className="text-sm font-medium pl-4 border-l-2 border-primary">
          {replyStrategy.context}
        </p>
      </div>

      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">核心策略:</p>
        <p className="text-sm">{replyStrategy.strategy}</p>
      </div>

      <div className="space-y-3">
        <p className="text-sm font-medium">💡 建议回复 (点击复制):</p>
        <div className="space-y-3">
          {replyStrategy.suggestions.map((suggestion) => (
            <ReplySuggestionCard key={suggestion.id} suggestion={suggestion} />
          ))}
        </div>
      </div>

      {replyStrategy.warnings.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <p className="text-sm font-medium text-yellow-600">注意事项:</p>
          </div>
          <ul className="space-y-1">
            {replyStrategy.warnings.map((warning, index) => (
              <li key={index} className="text-sm text-muted-foreground pl-4">
                • {warning}
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}
