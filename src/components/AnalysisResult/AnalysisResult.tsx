'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { MoodCard } from './MoodCard';
import { PersonalityCard } from './PersonalityCard';
import { ReplyStrategyCard } from './ReplyStrategyCard';
import type { AnalysisResult } from '@/types/ai-analysis';

interface AnalysisResultProps {
  result: AnalysisResult | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * 分析结果展示容器组件
 */
export function AnalysisResult({ result, isLoading, error }: AnalysisResultProps) {
  if (isLoading) {
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-bold">AI 分析结果</h2>
        <div className="space-y-4">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!result) {
    return null;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">AI 分析结果</h2>
      <div className="space-y-4">
        <MoodCard mood={result.mood} />
        <PersonalityCard personality={result.personality} />
        <ReplyStrategyCard replyStrategy={result.replyStrategy} />
      </div>
    </div>
  );
}
