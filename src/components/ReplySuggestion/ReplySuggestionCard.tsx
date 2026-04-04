'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Copy } from 'lucide-react';
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
  humor: 'border border-amber-200 bg-amber-50 text-amber-800',
  caring: 'border border-emerald-200 bg-emerald-50 text-emerald-800',
  deep: 'border border-sky-200 bg-sky-50 text-sky-800',
  casual: 'border border-slate-200 bg-slate-100 text-slate-700',
  flirty: 'border border-rose-200 bg-rose-50 text-rose-800',
};

const riskColors = {
  low: 'text-emerald-600',
  medium: 'text-amber-600',
  high: 'text-red-600',
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
    <Card className="surface-card space-y-3 p-4 transition-shadow hover:shadow-[0_20px_40px_-30px_rgba(14,116,144,0.8)]">
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
        <p className="text-sm font-medium leading-relaxed text-slate-700">{suggestion.content}</p>
        <p className="flex items-start gap-1 text-xs text-muted-foreground">
          <span className="mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-500" />
          <span>{suggestion.explanation}</span>
        </p>
      </div>
    </Card>
  );
}
