'use client';

import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { AlertCircle } from 'lucide-react';
import type { PersonalityAnalysis } from '@/types/ai-analysis';

interface PersonalityCardProps {
  personality: PersonalityAnalysis;
}

/**
 * 性格特征卡片组件
 */
export function PersonalityCard({ personality }: PersonalityCardProps) {
  return (
    <Card className="surface-card space-y-4 p-6">
      <h3 className="text-lg font-semibold text-slate-800">2. 对方性格特征</h3>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">特征:</p>
          <span className="text-sm text-muted-foreground">置信度 {personality.confidence}%</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {personality.traits.map((trait, index) => (
            <Badge key={index} variant="secondary">{trait}</Badge>
          ))}
        </div>
        <Progress value={personality.confidence} className="h-2" />
      </div>

      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">描述:</p>
        <p className="text-sm">{personality.description}</p>
      </div>

      {personality.evidence.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">依据:</p>
          <ul className="space-y-1">
            {personality.evidence.map((item, index) => (
              <li key={index} className="border-l-2 border-cyan-300/60 pl-4 text-sm">
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      {personality.note && (
        <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <p className="text-sm text-amber-800">{personality.note}</p>
        </div>
      )}
    </Card>
  );
}
