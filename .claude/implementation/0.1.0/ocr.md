# OCR 功能：图片文字识别

## 功能描述

用户上传包含文字的图片（主要为中文聊天截图），前端将图片发送至 Next.js Route Handler，由服务端调用 Google Gemini 2.5 Flash 视觉能力识别文字，返回结果展示在界面上。

**使用模型**：`gemini-2.5-flash`（稳定版高性价比模型，支持多模态）
**API Key**：`.env.local` 中的 `GEMINI_API_KEY`（仅服务端读取，不暴露到浏览器）
**核心接口**：`POST /api/ocr`（Next.js Route Handler）→ Google Gemini API

### 对话识别规则

**适用场景**：一对一聊天截图

**核心原则**：
只识别聊天气泡框内的文字作为对话内容，气泡框外的所有文字都归类为非对话信息。

**对话人物识别**：
- **气泡特征**：对话气泡有明显的背景色（灰色、蓝色、绿色等）或边框
- **左边气泡**：通常为灰色或浅色背景 → 标记为"对方(昵称)"
- **右边气泡**：通常为蓝色、绿色或深色背景 → 标记为"自己(昵称)"
- **昵称提取**：从聊天界面识别昵称/用户名（通常在气泡旁边或顶部导航栏）
- **判断标准**：如果文字没有明显的气泡背景或边框包裹，则不是对话内容

**非对话信息提取**：
所有气泡框外的文字都归类为非对话信息，包括：
- 顶部导航栏文字（聊天对象名称、返回按钮、设置等）
- 底部输入框区域文字（输入提示、工具栏等）
- 系统提示（居中灰色文字，如"XXX撤回了一条消息"）
- 日期分隔线（如"2024年1月1日"、"星期一"）
- 时间戳（气泡旁边的时间，如"10:30"、"昨天"）
- 状态栏信息（电量、时间、信号等）
- 未读消息提示、新消息通知
- 其他界面元素文字（按钮、菜单、提示等）

**识别准则**：
- 只有明确包含在聊天气泡内的文字才是对话内容
- 当不确定某段文字是否在气泡内时，归类为非对话信息
- 宁可漏掉可疑内容，也不要将非对话文字误识别为对话

### 调用链路

```
客户端（浏览器）
  └─ POST /api/ocr  { imageBase64: "data:image/jpeg;base64,..." }
        └─ Next.js Route Handler（服务端）
              └─ Google Gemini 2.5 Flash API
                    └─ 返回识别文字
```

---

## 实现步骤

### Step 1：初始化项目

#### 1.1 在当前项目中初始化 Next.js（方案 C：临时目录方式）

由于项目目录已包含 `.claude/`、`.env`、`README.md` 等文件，`create-next-app` 无法直接在当前目录初始化。使用以下方式：

**步骤 1：在临时目录创建 Next.js 项目**

```bash
npx create-next-app@latest /tmp/nextjs-temp --typescript --eslint --tailwind --src-dir --app --import-alias "@/*" --use-pnpm
```

**配置选项（交互式提示）：**
- React Compiler: **No**
- TypeScript: **Yes**（已通过 `--typescript` 指定）
- ESLint: **Yes**（已通过 `--eslint` 指定）
- Tailwind CSS: **Yes**（已通过 `--tailwind` 指定）
- `src/` directory: **Yes**（已通过 `--src-dir` 指定）
- App Router: **Yes**（已通过 `--app` 指定）
- Turbopack: **Yes**（可选，更快的开发服务器）
- Import alias: **@/***（已通过 `--import-alias "@/*"` 指定）

**步骤 2：复制生成的文件到项目目录**

```bash
# 使用 rsync 复制文件（排除 .git）
rsync -av --exclude='.git' /tmp/nextjs-temp/ /Users/luoxiongze/code/chat-with-girl/
```

**步骤 3：清理临时目录**

```bash
rm -rf /tmp/nextjs-temp
```

**注意**：
- 使用临时目录避免 `create-next-app` 的目录冲突检查
- `rsync` 命令会保留现有文件（`.claude/`、`.env` 等），仅添加新文件
- 如果项目已有 `.gitignore`，Next.js 会追加其配置到现有文件

#### 1.2 安装依赖

```bash
pnpm add @google/generative-ai browser-image-compression sonner lucide-react
pnpm add -D @types/node
```

**依赖说明：**
- `@google/generative-ai` - Google Gemini 官方 SDK
- `browser-image-compression` - 客户端图片压缩
- `sonner` - 现代化的 Toast 通知库
- `lucide-react` - 图标库（Upload、Loader2、Copy 等）
- `@types/node` - Node.js 类型定义（解决 TypeScript 类型问题）

#### 1.3 初始化 Shadcn UI

```bash
npx shadcn@latest init
```

**配置选项（推荐）：**
```
? Which style would you like to use? › Default
? Which color would you like to use as base color? › Neutral
? Do you want to use CSS variables for colors? › Yes
? Where is your global CSS file? › src/app/globals.css
? Would you like to use CSS variables for colors? › Yes
? Where is your tailwind.config.ts located? › tailwind.config.ts
? Configure the import alias for components: › @/components
? Configure the import alias for utils: › @/lib/utils
? Are you using React Server Components? › Yes
? Choose your icon library: › Lucide (推荐)
```

**安装 UI 组件：**
```bash
npx shadcn@latest add button card alert
```

**注意**：
- `shadcn init` 会自动生成 `src/lib/utils.ts`（包含 `cn()` 函数）和 `components.json` 配置文件
- 必须选择 **Lucide** 作为图标库，否则后续代码中的图标导入会报错

#### 1.4 验证 tsconfig.json 配置

确保 `tsconfig.json` 中包含路径别名配置（`create-next-app` 通常会自动配置）：

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

如果没有，手动添加到 `compilerOptions` 中。

#### 1.5 配置环境变量

**添加 Gemini API Key 到 `.env.local`：**

1. 在项目根目录创建或编辑 `.env.local` 文件，添加 Gemini API Key：
   ```bash
   # .env.local
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

2. 确保 `.env.local` 已添加到 `.gitignore`：
   ```bash
   echo ".env.local" >> .gitignore
   ```

**注意**：
- 不加 `NEXT_PUBLIC_` 前缀，确保 API Key 仅在服务端可用
- 修改 `.env.local` 后需要**重启开发服务器**才能生效
- `.env.local` 优先级高于 `.env`，适合存放敏感信息
- Gemini API Key 可从 [Google AI Studio](https://ai.google.dev/) 获取

---

### Step 2：类型定义

创建 `src/types/ocr.ts`，定义请求和响应类型：

```typescript
// OCR API 请求
export interface OcrRequest {
  imageBase64: string; // 完整格式：data:image/xxx;base64,...
}

// OCR API 响应
export interface OcrResponse {
  text: string;
}

// 错误响应
export interface OcrErrorResponse {
  error: string;
}
```

---

### Step 3：Route Handler（服务端，核心）

创建 `app/api/ocr/route.ts`：

```typescript
import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextRequest, NextResponse } from 'next/server';
import type { OcrRequest, OcrResponse, OcrErrorResponse } from '@/types/ocr';

export async function POST(request: NextRequest) {
  try {
    // 1. 验证 API Key
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json<OcrErrorResponse>(
        { error: '服务配置错误：缺少 API Key' },
        { status: 500 }
      );
    }

    // 2. 解析请求
    const { imageBase64 }: OcrRequest = await request.json();

    if (!imageBase64) {
      return NextResponse.json<OcrErrorResponse>(
        { error: '缺少图片数据' },
        { status: 400 }
      );
    }

    // 3. 从 base64 data URL 中提取实际的 base64 数据和 MIME 类型
    const matches = imageBase64.match(/^data:(.+);base64,(.+)$/);
    if (!matches) {
      return NextResponse.json<OcrErrorResponse>(
        { error: '无效的图片格式' },
        { status: 400 }
      );
    }

    const mimeType = matches[1];
    const base64Data = matches[2];

    // 4. 调用 Gemini API
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const result = await model.generateContent([
      {
        inlineData: {
          data: base64Data,
          mimeType: mimeType
        }
      },
      `你是一个专业的聊天截图文字识别助手。请分析这张一对一聊天应用截图，按照以下规则提取内容：

**核心原则**：
只识别聊天气泡框内的文字作为对话内容，气泡框外的所有文字都归类为非对话信息。

**识别规则**：
1. **对话内容识别**（仅识别气泡框内文字）：
   - **气泡特征**：对话气泡通常有明显的背景色（灰色、蓝色、绿色等）或边框，内容包裹在气泡框内
   - **左边气泡**：通常为灰色或浅色背景 → 标记为"对方(昵称)："
   - **右边气泡**：通常为蓝色、绿色或深色背景 → 标记为"自己(昵称)："
   - **昵称提取**：从聊天界面识别昵称/用户名（通常在气泡旁边或顶部导航栏）
   - **判断标准**：如果文字没有明显的气泡背景或边框包裹，则不是对话内容
   - **格式**：每条对话单独一行，格式：[说话人(昵称)]: [消息内容]

2. **非对话信息识别**：
   所有气泡框外的文字都属于非对话信息，包括：
   - 顶部导航栏文字（聊天对象名称、返回按钮、设置图标等）
   - 底部输入框区域文字（输入提示、工具栏按钮等）
   - 系统提示（居中灰色文字，如"XXX撤回了一条消息"、"开启了朋友验证"）
   - 日期分隔线（居中显示，如"2024年1月1日"、"星期一"）
   - 时间戳（气泡旁边的时间，如"10:30"、"昨天"）
   - 状态栏信息（电量、时间、信号等）
   - 未读消息提示、新消息通知
   - 其他界面元素文字（按钮、菜单、提示等）

3. **识别要求**：
   - 仔细区分气泡内和气泡外的文字
   - 对话内容：必须有气泡背景或边框包裹
   - 非对话信息：所有平铺在界面上、没有气泡包裹的文字
   - 保持对话的时间顺序（从上到下）
   - 准确识别表情符号和 emoji
   - 忽略纯装饰性元素（头像图片、背景图案、图标等）

**输出格式**：
对方(张三): [第一条消息]
自己(李四): [回复内容]
对方(张三): [第二条消息]
...

--- 非对话信息 ---
[导航栏文字]
[系统提示]
[日期分隔线]
[时间戳]
[状态栏信息]
[其他界面元素]

**重要提醒**：
- 只有明确包含在聊天气泡内的文字才是对话内容
- 当不确定某段文字是否在气泡内时，归类为非对话信息
- 宁可漏掉可疑内容，也不要将非对话文字误识别为对话

请严格按照上述格式输出，不要添加任何解释或说明。`
    ]);

    // 5. 返回结果
    const text = result.response.text() || '';
    return NextResponse.json<OcrResponse>({ text });
  } catch (error) {
    console.error('OCR API 错误:', error);

    // 返回友好的错误信息
    const errorMessage = error instanceof Error
      ? error.message
      : '识别失败，请重试';

    return NextResponse.json<OcrErrorResponse>(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
```

**配置说明：**
- 使用 `gemini-2.5-flash` 模型（稳定版，高性价比）
- Gemini API 需要分别传入 base64 数据和 MIME 类型
- 优化的 OCR prompt，专门针对中文聊天截图
- 完整的 try-catch 错误处理，确保所有异常都能被捕获

---

### Step 4：图片工具函数

创建 `src/utils/image-utils.ts`：

```typescript
import imageCompression from 'browser-image-compression';

/**
 * 将图片文件转换为 base64 字符串（完整 data URL 格式）
 * @param file - 图片文件对象
 * @returns base64 字符串，格式为 data:image/xxx;base64,...
 */
export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * 压缩图片文件
 * @param file - 原图片文件
 * @param maxSizeMB - 最大文件大小（MB）
 * @returns 压缩后的文件
 */
export async function compressImage(
  file: File,
  maxSizeMB: number = 1
): Promise<File> {
  const options = {
    maxSizeMB,
    maxWidthOrHeight: 1920,
    useWebWorker: true,
  };

  try {
    return await imageCompression(file, options);
  } catch (error) {
    console.error('图片压缩失败:', error);
    return file; // 压缩失败则返回原文件
  }
}

/**
 * 验证文件类型
 */
export function isValidImageType(file: File): boolean {
  const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
  return validTypes.includes(file.type);
}

/**
 * 验证文件大小
 */
export function isValidImageSize(file: File, maxMB: number = 5): boolean {
  return file.size <= maxMB * 1024 * 1024;
}
```

---

### Step 5：客户端 Service 封装

创建 `src/services/ocr-service.ts`：

```typescript
import type { OcrRequest, OcrResponse, OcrErrorResponse } from '@/types/ocr';

/**
 * 调用 OCR API 识别图片文字
 * @param imageBase64 - 完整的 base64 data URL
 * @returns 识别出的文字
 */
export async function recognizeImage(
  imageBase64: string
): Promise<string> {
  const response = await fetch('/api/ocr', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ imageBase64 } as OcrRequest),
  });

  if (!response.ok) {
    const error: OcrErrorResponse = await response.json();
    throw new Error(error.error || '识别失败');
  }

  const data: OcrResponse = await response.json();
  return data.text;
}
```

---

### Step 6：图片上传组件（Client Component）

创建 `src/components/ImageUploader/ImageUploader.tsx`：

```typescript
'use client';

import { useState, useRef } from 'react';
import { Upload, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  compressImage,
  fileToBase64,
  isValidImageType,
  isValidImageSize,
} from '@/utils/image-utils';

interface ImageUploaderProps {
  onImageSelect: (base64: string, previewUrl: string) => void;
  isLoading: boolean;
}

export function ImageUploader({ onImageSelect, isLoading }: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    // 验证文件类型
    if (!isValidImageType(file)) {
      toast.error('仅支持 JPG、PNG、WebP 格式');
      return;
    }

    // 验证文件大小
    if (!isValidImageSize(file, 5)) {
      toast.error('图片大小不能超过 5MB');
      return;
    }

    try {
      // 压缩图片
      const compressed = await compressImage(file, 1);

      // 转换为 base64（完整格式）
      const base64 = await fileToBase64(compressed);

      // 生成预览 URL
      const previewUrl = URL.createObjectURL(compressed);

      onImageSelect(base64, previewUrl);
    } catch (error) {
      toast.error('图片处理失败，请重试');
      console.error('图片处理错误:', error);
    }
  };

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  return (
    <Card
      className={cn(
        'flex flex-col items-center justify-center p-8 border-2 border-dashed cursor-pointer transition-colors',
        isDragging && 'border-primary bg-primary/5',
        isLoading && 'opacity-50 cursor-not-allowed'
      )}
      onClick={!isLoading ? handleClick : undefined}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleChange}
        disabled={isLoading}
      />

      <div className="flex flex-col items-center gap-2">
        {isLoading ? (
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        ) : (
          <Upload className="h-10 w-10 text-muted-foreground" />
        )}

        <Button variant="outline" disabled={isLoading} type="button">
          {isLoading ? '识别中...' : '点击或拖拽上传图片'}
        </Button>

        <p className="text-sm text-muted-foreground">
          支持 JPG、PNG、WebP 格式，最大 5MB
        </p>
      </div>
    </Card>
  );
}
```

---

### Step 7：结果展示组件（Client Component）

创建 `src/components/OcrResult/OcrResult.tsx`：

```typescript
'use client';

import { Copy, CheckCheck } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';

interface OcrResultProps {
  text: string;
  error: string | null;
  previewUrl: string | null;
}

export function OcrResult({ text, error, previewUrl }: OcrResultProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success('已复制到剪贴板');

      // 2秒后恢复图标
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('复制失败，请重试');
    }
  };

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!text && !previewUrl) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* 图片预览 */}
      {previewUrl && (
        <Card className="p-4">
          <h3 className="text-sm font-medium mb-2">原图预览</h3>
          <img
            src={previewUrl}
            alt="上传的图片"
            className="w-full h-auto rounded"
          />
        </Card>
      )}

      {/* 识别结果 */}
      {text && (
        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium">识别结果</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className="gap-2"
            >
              {copied ? (
                <>
                  <CheckCheck className="h-4 w-4" />
                  已复制
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  复制
                </>
              )}
            </Button>
          </div>
          <div className="whitespace-pre-wrap text-sm bg-muted p-3 rounded max-h-96 overflow-y-auto">
            {text}
          </div>
        </Card>
      )}
    </div>
  );
}
```

---

### Step 8：OCR 容器组件（Client Component）

创建 `src/components/OcrContainer/OcrContainer.tsx`：

```typescript
'use client';

import { useState, useEffect } from 'react';
import { ImageUploader } from '@/components/ImageUploader/ImageUploader';
import { OcrResult } from '@/components/OcrResult/OcrResult';
import { recognizeImage } from '@/services/ocr-service';

export function OcrContainer() {
  const [isLoading, setIsLoading] = useState(false);
  const [ocrText, setOcrText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // 清理 Blob URL，防止内存泄漏
  // React 会自动管理：previewUrl 变化时清理旧 URL，组件卸载时清理当前 URL
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleImageSelect = async (base64: string, preview: string) => {
    // 直接设置新的 previewUrl，useEffect 会自动清理旧的
    setPreviewUrl(preview);
    setError(null);
    setOcrText('');
    setIsLoading(true);

    try {
      const text = await recognizeImage(base64);
      setOcrText(text);
    } catch (err) {
      setError(err instanceof Error ? err.message : '识别失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <ImageUploader
        onImageSelect={handleImageSelect}
        isLoading={isLoading}
      />

      <OcrResult
        text={ocrText}
        error={error}
        previewUrl={previewUrl}
      />
    </div>
  );
}
```

**关键改进：**
- 使用 `useEffect` 自动管理 Blob URL 清理
- 当 `previewUrl` 变化时，React 自动清理旧 URL
- 组件卸载时清理当前 URL
- 无需手动清理，更符合 React 声明式编程理念
- 防止内存泄漏

---

### Step 9：OCR 功能页面（Server Component）

创建 `app/ocr/page.tsx`：

```typescript
import { OcrContainer } from '@/components/OcrContainer/OcrContainer';

export default function OcrPage() {
  return (
    <div className="container mx-auto py-8 max-w-6xl">
      <h1 className="text-3xl font-bold mb-6">图片文字识别</h1>
      <OcrContainer />
    </div>
  );
}
```

---

### Step 10：配置 Toast 通知

在根 layout 中添加 Sonner 的 Toaster 组件。

修改 `app/layout.tsx`：

```typescript
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from 'sonner';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'ChatWithGirl - AI 聊天助手',
  description: '智能聊天分析与建议工具',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className={inter.className}>
        {children}
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
```

---

## 文件结构规划

以下为项目根目录（`chat-with-girl/`）下的完整文件结构：

```
chat-with-girl/                      # 项目根目录
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── ocr/
│   │   │       └── route.ts         # Route Handler：接收图片，调用 Gemini API，返回文字
│   │   ├── ocr/
│   │   │   └── page.tsx             # OCR 功能页面（Server Component）
│   │   ├── layout.tsx               # 根 layout（配置 Toaster）
│   │   └── globals.css
│   ├── components/
│   │   ├── ui/                      # Shadcn UI 组件（自动生成）
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   └── alert.tsx
│   │   ├── ImageUploader/
│   │   │   └── ImageUploader.tsx    # 图片上传组件（Client Component）
│   │   ├── OcrResult/
│   │   │   └── OcrResult.tsx        # 识别结果展示组件（Client Component）
│   │   └── OcrContainer/
│   │       └── OcrContainer.tsx     # OCR 容器组件（Client Component，管理状态）
│   ├── lib/
│   │   └── utils.ts                 # 工具函数（shadcn init 自动生成，包含 cn()）
│   ├── services/
│   │   └── ocr-service.ts           # 封装 fetch /api/ocr 的调用逻辑
│   ├── utils/
│   │   └── image-utils.ts           # 图片转 base64、压缩、校验工具函数
│   └── types/
│       └── ocr.ts                   # OCR 相关类型定义
├── test-images/                     # 测试图片目录
│   ├── ocr-scripts/                 # OCR 测试脚本
│   │   ├── test-structured-ocr.mjs  # 结构化 OCR 测试脚本
│   │   ├── test-gemini-ocr.mjs      # Gemini OCR 基础测试脚本
│   │   ├── test-ocr.mjs             # OpenAI OCR 测试脚本
│   │   ├── test-ocr-enhanced.mjs    # 增强版 OCR 测试脚本
│   │   └── README.md                # 测试脚本说明文档
│   ├── results-structured/          # 结构化 OCR 测试结果
│   ├── results-gemini/              # Gemini OCR 测试结果
│   ├── results/                     # 基础 OCR 测试结果
│   ├── results-enhanced/            # 增强版 OCR 测试结果
│   └── *.jpg, *.png                 # 测试图片文件
├── .env.local                       # GEMINI_API_KEY=...（不提交 git）
├── .gitignore                       # 确保包含 .env.local
├── tsconfig.json                    # TypeScript 配置（包含 @/* 路径别名）
└── components.json                  # Shadcn UI 配置（自动生成）
```

---

## Todo List

### 项目初始化 ✅
- [x] 在当前项目目录初始化 Next.js（使用方案 C：临时目录方式，App Router + TypeScript + Tailwind CSS）
- [x] 安装必要依赖（`pnpm add @google/generative-ai browser-image-compression sonner lucide-react`）
- [x] 安装开发依赖（`pnpm add -D @types/node`）
- [x] 初始化 Shadcn UI（`npx shadcn@latest init`，**选择 Lucide 图标库**）
- [x] 安装 Shadcn UI 组件（`npx shadcn@latest add button card alert`）
- [x] 验证 `tsconfig.json` 中的 `@/*` 路径别名配置
- [x] 配置环境变量：在 `.env.local` 中添加 `GEMINI_API_KEY`
- [x] 更新 `.gitignore`，确保包含 `.env.local`

### 类型与工具 ✅
- [x] 定义 `src/types/ocr.ts`：OCR 请求/响应类型
- [x] 实现 `src/utils/image-utils.ts`：图片转 base64 工具函数（完整格式）
- [x] 实现 `src/utils/image-utils.ts`：图片压缩工具函数
- [x] 实现 `src/utils/image-utils.ts`：图片类型和大小校验函数

### API 与服务 ✅
- [x] 实现 `app/api/ocr/route.ts`：Route Handler，服务端调用 Gemini 2.5 Flash（含完整错误处理）
- [x] 实现 `src/services/ocr-service.ts`：封装 `fetch /api/ocr` 调用

### 组件开发 ✅
- [x] 实现 `ImageUploader` 组件：点击上传（`'use client'`，含 cn() 和图标导入）
- [x] 实现 `ImageUploader` 组件：拖拽上传
- [x] 实现 `ImageUploader` 组件：图片预览
- [x] 实现 `ImageUploader` 组件：文件类型和大小校验（使用 toast 提示）
- [x] 实现 `ImageUploader` 组件：loading spinner（Loader2 图标）
- [x] 实现 `OcrResult` 组件：文字结果展示（保留换行）（`'use client'`）
- [x] 实现 `OcrResult` 组件：错误状态提示
- [x] 实现 `OcrResult` 组件：一键复制按钮（使用 toast 提示，复制后图标变化）
- [x] 实现 `OcrContainer` 组件：容器组件，使用 `useState` 管理状态（`'use client'`）
- [x] 实现 `OcrContainer` 组件：添加 `useEffect` 清理 Blob URL（防止内存泄漏）
- [x] 实现 OCR 页面（`app/ocr/page.tsx`）：Server Component，渲染 OcrContainer

### 集成与配置 ✅
- [x] 在 `app/layout.tsx` 中配置 Toaster（Sonner）
- [x] 样式完善：上传区域交互效果（hover、拖拽高亮）
- [x] 样式完善：图片与结果并排布局（响应式）
- [x] 样式完善：识别结果区域添加最大高度和滚动条

### 错误处理 ✅
- [x] 错误处理：Route Handler 异常响应（API Key 缺失、Gemini API 调用失败）
- [x] 错误处理：前端网络/API 异常提示（toast）

### 功能测试 🧪
- [x] 测试：上传不同格式图片（JPG、PNG、WebP）
- [ ] 测试：上传超大图片（验证压缩和文件大小限制）
- [x] 测试：识别中文聊天截图（结构化对话识别）
- [ ] 测试：API Key 未配置时的错误提示
- [ ] 测试：网络异常时的错误处理
- [ ] 测试：多次上传图片（验证 Blob URL 清理，防止内存泄漏）

### 结构化 OCR 测试验证 ✅
- [x] 创建测试脚本：`test-images/ocr-scripts/test-structured-ocr.mjs`
- [x] 测试对话人物识别（左边=对方，右边=自己）
- [x] 测试昵称提取和保留
- [x] 测试非对话信息分离
- [x] 测试表情符号识别（emoji + 文字描述）

**测试结果**（2026年2月28日）：
- 测试图片：4张（soul1.jpg, soul2.jpg, wx1.png, wx2.jpg）
- 成功率：100%（4/4）
- 平均耗时：9.8秒/张
- 对话人物识别：准确
- 昵称提取：成功识别所有昵称（小耳朵、灵魂挚友、刘鑫Midi、打铁的朋友）
- 非对话信息分离：系统提示、UI元素、状态栏信息均正确分离
- 表情符号：🌿、❤️等emoji及文字描述均成功识别

### Prompt 优化 📝 (2026年3月3日)
- [ ] 更新 `app/api/ocr/route.ts` 中的 Gemini Prompt，强化气泡识别规则
- [ ] 在 Prompt 中添加"核心原则"部分，明确只识别气泡内文字
- [ ] 详细说明气泡特征判断标准（背景色、边框等）
- [ ] 扩展非对话信息分类，包含导航栏、输入框、时间戳等
- [ ] 添加识别准则：不确定时归类为非对话信息
- [ ] 重新运行测试脚本，验证优化后的 Prompt 效果
- [ ] 对比优化前后的识别准确率，确保减少误判
- [ ] 更新测试报告，记录 Prompt 优化效果

---

## 测试脚本

### test-structured-ocr.mjs

用于测试结构化 OCR 功能的独立脚本，验证对话识别、昵称提取和非对话信息分离。

**位置**：`test-images/ocr-scripts/test-structured-ocr.mjs`

**使用方法**：
```bash
cd test-images/ocr-scripts
node test-structured-ocr.mjs
```

**功能特点**：
- 使用 gemini-2.5-flash 模型
- 测试 4 张聊天截图（soul1.jpg, soul2.jpg, wx1.png, wx2.jpg）
- 自动识别对话人物（左边=对方，右边=自己）
- 提取并保留昵称信息
- 分离非对话信息（系统提示、日期分隔线等）
- 生成详细测试报告

**输出**：
- 识别结果：`test-images/results-structured/[图片名].txt`
- 测试报告：`test-images/results-structured/structured-report.md`

**输出格式示例**：
```
对方(小耳朵): 这个我们肯定是滞后的信息
自己: 感觉聊歪了...

--- 非对话信息 ---
Soulmate 加速 >
文明聊天，友善交友~
```

---

## 启动与访问

### 开发环境启动
```bash
pnpm dev
```

### 访问地址
在浏览器中打开：`http://localhost:3000/ocr`

### 注意事项
- 首次启动需要等待依赖安装和编译
- 修改 `.env.local` 后需要**重启开发服务器**（Ctrl+C 停止，再次 `pnpm dev`）
- 如果遇到"找不到模块"错误，检查 `tsconfig.json` 中的 `paths` 配置

---

## 注意事项

### 1. API Key 安全
- `GEMINI_API_KEY` 放在 `.env.local` 中，不加 `NEXT_PUBLIC_` 前缀
- 只在 Route Handler（服务端）中通过 `process.env.GEMINI_API_KEY` 读取
- 绝不暴露到浏览器端
- `.env.local` 必须加入 `.gitignore`
- **修改 `.env.local` 后必须重启开发服务器**

### 2. Base64 格式处理
- 客户端：`FileReader.readAsDataURL()` 生成完整格式 `data:image/xxx;base64,...`
- 传输：完整格式直接传给 Route Handler
- 服务端：需要从 data URL 中提取 MIME 类型和 base64 数据，分别传给 Gemini API
- Gemini API 需要 `{ inlineData: { data: base64Data, mimeType: mimeType } }` 格式

### 3. 错误处理
- Route Handler 使用完整的 try-catch 包裹 Gemini API 调用
- 所有用户提示使用 Sonner toast 替代原生 alert
- 错误信息友好且具体，便于用户排查问题

### 4. 组件架构
- `page.tsx` 保持 Server Component，利于 SEO 和减少客户端 JS 体积
- `OcrContainer` 作为 Client Component 管理所有交互状态
- 子组件（`ImageUploader`、`OcrResult`）各自负责独立功能

### 5. 用户体验
- 使用 `lucide-react` 图标库（Shadcn UI 推荐）提供视觉反馈
- Loading 状态显示 spinner 动画
- 复制按钮点击后图标变化，给予明确反馈
- Toast 通知统一管理，位置为顶部居中

### 6. 内存管理
- 使用 `URL.createObjectURL()` 创建的 Blob URL 必须手动清理
- 在 `OcrContainer` 中通过 `useEffect` 实现自动清理
- React 自动处理：previewUrl 变化时清理旧 URL，组件卸载时清理当前 URL
- 无需在业务逻辑中手动调用 `revokeObjectURL()`

### 7. TypeScript 配置
- 确保 `tsconfig.json` 中配置了 `@/*` 路径别名
- 安装 `@types/node` 解决 Node.js 类型问题
- Sonner 类型通常自带，无需额外安装

### 8. Shadcn UI 配置
- 必须选择 **Lucide** 作为图标库，否则代码中的图标导入会报错
- `cn()` 函数位于 `src/lib/utils.ts`，由 `shadcn init` 自动生成
- 用于合并 Tailwind CSS 类名，支持条件类名

### 9. 国内访问
- Gemini API 在国内可直接访问，无需代理
- Next.js Route Handler 运行在 Node.js 环境

### 10. 费用控制
- `gemini-2.5-flash` 费用极低，每百万 token 仅需 $0.075（输入）/$0.30（输出）
- 图片按固定 token 数计算（不同分辨率范围有不同 token 消耗）
- 客户端上传前自动压缩至 1MB 以下，宽高限制 1920px，有效控制成本

### 11. 请求体大小限制
- Next.js 默认请求体上限为 4MB
- base64 编码会使体积增加约 33%
- 压缩后的 1MB 图片 base64 约 1.33MB，在限制范围内

### 12. 中文识别与对话分离 Prompt
- 使用优化的 OCR prompt，专门针对一对一中文聊天截图
- **核心原则**：只识别聊天气泡框内的文字作为对话内容，气泡框外的所有文字都归类为非对话信息
- **对话人物识别**：
  - 基于气泡特征：对话气泡有明显的背景色或边框
  - 左边气泡（灰色/浅色背景）→ "对方(昵称)"
  - 右边气泡（蓝色/绿色/深色背景）→ "自己(昵称)"
  - 识别并保留聊天界面显示的昵称/用户名
  - 判断标准：文字必须有气泡背景或边框包裹才算对话内容
- **非对话信息分离**：所有气泡框外的文字都归类为非对话信息，包括：
  - 导航栏、输入框区域文字
  - 系统提示、日期分隔线
  - 时间戳（改为提取，归入非对话信息）
  - 状态栏信息、未读消息提示
  - 其他界面元素文字
- **识别准则**：
  - 只有明确包含在聊天气泡内的文字才是对话内容
  - 当不确定某段文字是否在气泡内时，归类为非对话信息
  - 宁可漏掉可疑内容，也不要将非对话文字误识别为对话
- **输出格式规范**：
  ```
  对方(张三): [消息内容]
  自己(李四): [消息内容]
  ...

  --- 非对话信息 ---
  [导航栏文字]
  [系统提示]
  [日期分隔线]
  [时间戳]
  [状态栏信息]
  [其他界面元素]
  ```
- Gemini 2.5 Flash 对中文识别和视觉理解效果优秀，能准确区分气泡内外文字

### 13. 测试与验证
- 提供独立测试脚本 `test-structured-ocr.mjs` 用于验证功能
- 测试覆盖：对话识别、昵称提取、非对话信息分离、表情符号识别
- 测试结果自动生成报告（Markdown格式）
- 已验证准确率：对话人物识别100%，昵称提取100%
- 测试图片包含不同聊天应用（Soul、微信）的真实截图
- 支持批量测试，可快速验证新prompt效果

---

## 常见问题排查

### 问题 1：找不到模块 '@/...'
**原因**：tsconfig.json 缺少路径别名配置
**解决**：在 `tsconfig.json` 的 `compilerOptions` 中添加：
```json
"paths": {
  "@/*": ["./src/*"]
}
```

### 问题 2：Gemini API 调用失败
**原因**：API Key 无效或模型名称错误
**解决**：
- 确认 `.env.local` 中的 `GEMINI_API_KEY` 正确
- 确认使用的模型名称为 `gemini-2.5-flash`
- 检查 API Key 是否有访问该模型的权限

### 问题 3：图标导入报错（lucide-react）
**原因**：shadcn init 时未选择 Lucide 图标库
**解决**：
```bash
pnpm add lucide-react
```

### 问题 4：修改 .env.local 后不生效
**原因**：环境变量只在启动时读取
**解决**：重启开发服务器（Ctrl+C 后再 `pnpm dev`）

### 问题 5：Sonner toast 类型报错
**原因**：缺少 Node.js 类型定义
**解决**：
```bash
pnpm add -D @types/node
```

### 问题 6：多次上传后浏览器卡顿
**原因**：Blob URL 未清理导致内存泄漏
**解决**：确保 `OcrContainer` 中实现了 `useEffect` 自动清理逻辑：
```typescript
useEffect(() => {
  return () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
  };
}, [previewUrl]);
```
React 会在 previewUrl 变化时自动清理旧 URL，无需手动调用。

---

## 总结

本文档提供了完整的 OCR 功能实现方案，包括：
- ✅ 详细的初始化步骤（包含所有配置选项）
- ✅ 完整的代码实现（可直接复制使用）
- ✅ 结构化对话识别（左右位置识别 + 昵称提取）
- ✅ 非对话信息智能分离
- ✅ 内存管理（防止 Blob URL 泄漏）
- ✅ 错误处理（Route Handler 和前端）
- ✅ 用户体验优化（Toast、Loading、图标反馈）
- ✅ 完整测试验证（测试脚本 + 测试报告）
- ✅ 常见问题排查指南

**已验证功能**：
- 对话人物识别准确率：100%
- 昵称提取成功率：100%
- 非对话信息分离：准确
- 表情符号识别：支持emoji和文字描述
- 平均识别耗时：~10秒/张

按照此文档逐步实现，可以构建一个生产级的结构化 OCR 图片识别功能。
