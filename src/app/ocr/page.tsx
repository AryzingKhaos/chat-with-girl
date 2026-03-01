import { OcrContainer } from '@/components/OcrContainer/OcrContainer';

export default function OcrPage() {
  return (
    <div className="container mx-auto py-8 max-w-6xl">
      <h1 className="text-3xl font-bold mb-6">图片文字识别</h1>
      <OcrContainer />
    </div>
  );
}
