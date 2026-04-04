import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { OcrContainer } from '@/components/OcrContainer/OcrContainer';

export default function OcrPage() {
  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-10 sm:px-10 sm:py-12">
      <div className="surface-panel space-y-8 p-6 sm:p-10">
        <div className="space-y-4">
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-sm font-medium text-slate-600 transition-colors hover:text-slate-800"
          >
            <ChevronLeft className="h-4 w-4" />
            返回首页
          </Link>

          <header className="space-y-3">
            <span className="inline-flex rounded-full border border-white/80 bg-white/75 px-3 py-1 text-xs font-semibold text-cyan-700">
              全页面视觉统一
            </span>
            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
              <span className="gradient-title">图片文字识别</span>
            </h1>
            <p className="text-sm leading-relaxed text-slate-600 sm:text-base">
              上传聊天截图，系统会提取文本并自动展示可分析的对话结构。
            </p>
          </header>
        </div>

        <OcrContainer />
      </div>
    </main>
  );
}
