'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Copy, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import type { ReplySuggestion, SuggestionType } from '@/types/ai-analysis';
import { cn } from '@/lib/utils';

interface ReplySuggestionCardProps {
  suggestion: ReplySuggestion;
}

const typeLabels: Record<SuggestionType, string> = {
  humor: '幽默',
  caring: '关心',
  deep: '深度',
  casual: '日常',
  flirty: '调情',
};

const typeColors: Record<SuggestionType, string> = {
  humor: 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-200',
  caring: 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200',
  deep: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200',
  casual: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
  flirty: 'bg-pink-100 text-pink-800 dark:bg-pink-950 dark:text-pink-200',
};

const riskColors = {
  low: 'text-green-600 dark:text-green-400',
  medium: 'text-yellow-600 dark:text-yellow-400',
  high: 'text-red-600 dark:text-red-400',
};

const riskLabels = {
  low: '低风险',
  medium: '中风险',
  high: '高风险',
};

/**
 * 回复建议卡片组件
 */
export function ReplySuggestionCard({ suggestion }: ReplySuggestionCardProps) {
  const handleCopy = () => {
    navigator.clipboard.writeText(suggestion.content);
    toast.success('已复制到剪贴板');
  };

  return (
    <Card className="p-4 space-y-3 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge className={cn('text-xs', typeColors[suggestion.type])}>
            {typeLabels[suggestion.type]}
          </Badge>
          <span className={cn('text-xs font-medium', riskColors[suggestion.riskLevel])}>
            {riskLabels[suggestion.riskLevel]}
          </span>
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleCopy}
          className="h-8 w-8 p-0"
        >
          <Copy className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium leading-relaxed">{suggestion.content}</p>
        <p className="text-xs text-muted-foreground flex items-start gap-1">
          <span className="shrink-0">💭</span>
          <span>{suggestion.explanation}</span>
        </p>
      </div>
    </Card>
  );
}
