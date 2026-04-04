import Link from 'next/link';
import { ArrowRight, Sparkles, ScanText } from 'lucide-react';
import { Button } from '@/components/ui/button';

const highlights = [
  {
    title: '截图识别',
    description: '上传聊天截图后自动提取有效对话与元信息。',
    icon: ScanText,
  },
  {
    title: '语气洞察',
    description: '识别对方情绪、性格倾向和潜在沟通风险。',
    icon: Sparkles,
  },
];

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl items-center px-6 py-12 sm:px-10">
      <section className="surface-panel relative w-full overflow-hidden p-8 sm:p-12">
        <div className="pointer-events-none absolute -right-14 -top-16 h-48 w-48 rounded-full bg-cyan-300/35 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 left-24 h-60 w-60 rounded-full bg-amber-300/30 blur-3xl" />

        <div className="relative grid gap-10 lg:grid-cols-[1.25fr_1fr] lg:items-end">
          <div className="space-y-6">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/75 px-3 py-1 text-xs font-semibold text-cyan-700">
              <span className="status-dot" />
              Bright Gradient UI · Chrome Latest
            </span>

            <h1 className="text-4xl font-extrabold tracking-tight text-balance sm:text-5xl">
              把聊天截图变成
              <span className="gradient-title ml-2">可执行回复策略</span>
            </h1>

            <p className="max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg">
              保持你的操作路径不变，统一为明亮渐变视觉体系。上传截图后即可完成 OCR、对话解析与 AI 分析。
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Button asChild size="lg">
                <Link href="/ocr">
                  进入识别页面
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <span className="text-sm text-slate-500">支持 JPG / PNG / WebP，最大 5MB</span>
            </div>
          </div>

          <div className="grid gap-4">
            {highlights.map((item) => {
              const Icon = item.icon;
              return (
                <article key={item.title} className="surface-card p-5">
                  <div className="mb-3 inline-flex rounded-xl bg-cyan-100/80 p-2 text-cyan-700">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h2 className="text-base font-bold text-slate-800">{item.title}</h2>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.description}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}
