import { Card } from '@/components/ui/card';

interface MetadataSectionProps {
  metadata: string[];
}

/**
 * 非对话信息展示组件
 */
export function MetadataSection({ metadata }: MetadataSectionProps) {
  if (metadata.length === 0) {
    return null;
  }

  // 最多展示 50 条
  const displayMetadata = metadata.slice(0, 50);

  return (
    <div className="mt-6">
      <h3 className="mb-2 text-sm font-semibold text-slate-600">
        非对话信息
      </h3>
      <Card className="surface-card bg-white/70 p-4">
        <ul className="space-y-1 text-sm text-slate-600">
          {displayMetadata.map((item, index) => (
            <li key={`metadata-${index}-${item.substring(0, 20)}`}>- {item}</li>
          ))}
        </ul>
        {metadata.length > 50 && (
          <p className="mt-2 text-xs text-slate-500">
            还有 {metadata.length - 50} 条信息未显示
          </p>
        )}
      </Card>
    </div>
  );
}
