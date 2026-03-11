'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { AiProvider } from '@/types/ai-analysis';

interface AiProviderSelectorProps {
  value: AiProvider;
  onChange: (provider: AiProvider) => void;
  disabled?: boolean;
}

/**
 * AI 提供商选择器组件
 */
export function AiProviderSelector({ value, onChange, disabled }: AiProviderSelectorProps) {
  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="选择 AI" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="chatgpt">ChatGPT</SelectItem>
        <SelectItem value="gemini">Gemini</SelectItem>
      </SelectContent>
    </Select>
  );
}
