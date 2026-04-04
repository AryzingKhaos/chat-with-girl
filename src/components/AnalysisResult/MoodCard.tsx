'use client';

import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import type { MoodAnalysis } from '@/types/ai-analysis';

interface MoodCardProps {
  mood: MoodAnalysis;
}

/**
 * 心情状态卡片组件
 */
export function MoodCard({ mood }: MoodCardProps) {
  return (
    <Card className="surface-card space-y-4 p-6">
      <h3 className="text-lg font-semibold text-slate-800">1. 对方心情状态</h3>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-slate-700">状态: {mood.status}</span>
          <span className="text-sm text-muted-foreground">置信度 {mood.confidence}%</span>
        </div>
        <Progress value={mood.confidence} className="h-2" />
      </div>

      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">描述:</p>
        <p className="text-sm">{mood.description}</p>
      </div>

      {mood.evidence.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">依据:</p>
          <ul className="space-y-1">
            {mood.evidence.map((item, index) => (
              <li key={index} className="border-l-2 border-cyan-300/60 pl-4 text-sm">
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}
