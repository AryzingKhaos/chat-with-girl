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
    <Card className="surface-card space-y-4 p-6">
      <h3 className="text-lg font-semibold text-slate-800">3. 回复策略</h3>

      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">对方最后说:</p>
        <p className="border-l-2 border-cyan-300 pl-4 text-sm font-medium text-slate-700">
          {replyStrategy.context}
        </p>
      </div>

      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">核心策略:</p>
        <p className="text-sm">{replyStrategy.strategy}</p>
      </div>

      <div className="space-y-3">
        <p className="text-sm font-medium text-slate-700">建议回复 (点击复制):</p>
        <div className="space-y-3">
          {replyStrategy.suggestions.map((suggestion) => (
            <ReplySuggestionCard key={suggestion.id} suggestion={suggestion} />
          ))}
        </div>
      </div>

      {replyStrategy.warnings.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <p className="text-sm font-medium text-amber-700">注意事项:</p>
          </div>
          <ul className="space-y-1">
            {replyStrategy.warnings.map((warning, index) => (
              <li key={index} className="pl-4 text-sm text-muted-foreground">
                • {warning}
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}
