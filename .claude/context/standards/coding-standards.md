# 项目代码规范

## 技术栈（已确定）

| 类别 | 选型 |
|------|------|
| 框架 | Next.js 15+ (App Router) + React 18+ |
| 语言 | TypeScript 5+ (strict mode) |
| 包管理 | pnpm |
| UI 组件库 | Shadcn UI |
| 样式方案 | Tailwind CSS v4 |
| 状态管理 | Zustand |
| 表单管理 | React Hook Form |
| AI SDK | OpenAI SDK (`openai` npm 包) |
| 测试框架 | Vitest + Testing Library |
| 代码规范 | ESLint + Prettier |
| Git Hooks | Husky + lint-staged |

---

## 1. 核心规则

### 1.1 注释语言 【强制】
**所有代码注释必须使用中文**，包括：单行注释、多行注释、文档注释、TODO/FIXME 标记。

```typescript
// ✅ 正确：计算用户年龄
function calculateAge(birthDate: Date): number {
  return new Date().getFullYear() - birthDate.getFullYear();
}

// ❌ 错误：Calculate user age
function calculateAge(birthDate: Date): number {
  return new Date().getFullYear() - birthDate.getFullYear();
}
```

### 1.2 Server Component vs Client Component 【重要】
Next.js App Router 默认所有组件为 Server Component，需要交互/状态时才加 `'use client'`。

```typescript
// ✅ 正确：只在需要时加 'use client'
'use client';

import { useState } from 'react';

export function Counter() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(count + 1)}>{count}</button>;
}
```

**必须使用 `'use client'` 的场景：**
- 使用 React hooks（useState、useEffect 等）
- 使用浏览器 API（localStorage、window 等）
- 绑定事件监听器
- 使用 Zustand store

---

## 2. 命名规范

### 2.1 文件命名
- **组件文件**：PascalCase，如 `ImageUploader.tsx`、`OcrResult.tsx`
- **工具/服务**：kebab-case，如 `ocr-service.ts`、`image-utils.ts`
- **测试文件**：与源文件同名加 `.test` 或 `.spec`
- **Next.js 约定文件**：全小写，如 `page.tsx`、`layout.tsx`、`loading.tsx`、`error.tsx`

### 2.2 变量命名
- **常量**：UPPER_SNAKE_CASE，如 `MAX_FILE_SIZE`、`API_BASE_URL`
- **普通变量**：camelCase，如 `imageFile`、`ocrResult`
- **布尔值**：is/has/can 前缀，如 `isLoading`、`hasError`、`canSubmit`
- **私有变量**：下划线前缀，如 `_internalState`

### 2.3 函数命名
- 使用 camelCase，动词开头
- `fetchOcrResult()` - 获取数据
- `handleImageUpload()` - 处理事件（事件处理函数用 handle 前缀）
- `validateImageFile()` - 验证
- `convertToBase64()` - 转换

### 2.4 类与接口
- 接口：PascalCase，不使用 `I` 前缀
- 类型别名：PascalCase

```typescript
// ✅ 正确
interface OcrRequest {
  imageBase64: string;
  detail: 'low' | 'high';
}

// ❌ 错误
interface IOcrRequest {
  imageBase64: string;
}
```

### 2.5 Zustand Store 命名
- Store 文件：kebab-case，如 `ocr-store.ts`
- Store hook：`use` + 名称，如 `useOcrStore`

---

## 3. 代码风格

### 3.1 基本规则
- **缩进**：2 个空格（不使用 Tab）
- **引号**：优先使用单引号 `'`，JSX 属性使用双引号，模板字符串用反引号
- **分号**：语句结尾必须加分号
- **行长度**：不超过 100 个字符
- **空行**：函数/逻辑块之间空一行，文件末尾保留一个空行

### 3.2 函数规范
- 单个函数不超过 **50 行**
- 最多 **3-4 个参数**，超过时使用对象参数
- 每个函数只做一件事（单一职责）

```typescript
// ✅ 正确：使用对象参数
async function callOcrApi({
  imageBase64,
  prompt,
  detail = 'high',
}: OcrApiOptions): Promise<string> {
  // ...
}

// ❌ 错误：参数过多
async function callOcrApi(imageBase64: string, prompt: string, detail: string, maxTokens: number) {
  // ...
}
```

### 3.3 React 组件规范
- 组件使用函数式写法，不使用 class component
- Props 类型单独定义为 interface

```typescript
// ✅ 正确
interface ImageUploaderProps {
  onUpload: (file: File) => void;
  maxSizeMB?: number;
}

export function ImageUploader({ onUpload, maxSizeMB = 5 }: ImageUploaderProps) {
  // ...
}
```

---

## 4. 注释规范

### 4.1 文档注释 【强制】
对外暴露的函数、类、接口必须写 JSDoc/TSDoc：

```typescript
/**
 * 将图片文件转换为 base64 字符串
 * @param file - 图片文件对象
 * @returns base64 字符串，格式为 data:image/xxx;base64,...
 */
async function fileToBase64(file: File): Promise<string> {
  // ...
}
```

### 4.2 行内注释
- 复杂逻辑必须添加注释说明
- 注释解释"为什么"而不是"是什么"
- 使用 TODO/FIXME/HACK/NOTE 标记

### 4.3 禁止事项
- ❌ 不写注释掉的代码（使用版本控制）
- ❌ 不写无意义的注释（如 `// 定义变量`）
- ❌ 不写过时的注释

---

## 5. TypeScript 规范

### 5.1 类型定义 【强制】
- 所有函数参数和返回值必须标注类型
- 禁止使用 `any`，使用 `unknown` 代替
- 合理使用联合类型和交叉类型

### 5.2 接口 vs 类型
- 对象形状使用 `interface`
- 联合类型、工具类型使用 `type`
- 避免使用类型断言（`as`），优先使用类型守卫

### 5.3 环境变量类型
- 使用 `process.env.NEXT_PUBLIC_*` 访问客户端环境变量
- 在 `env.d.ts` 中声明类型

---

## 6. 错误处理

### 6.1 异常捕获 【强制】
- 所有异步操作必须有错误处理
- 不允许空 catch 块

```typescript
// ✅ 正确
try {
  const result = await fetchOcrResult(imageBase64);
  setOcrText(result);
} catch (error) {
  console.error('OCR 识别失败:', error);
  setErrorMessage('图片识别失败，请重试');
}

// ❌ 错误：空捕获
try {
  await fetchOcrResult(imageBase64);
} catch (error) {}
```

### 6.2 错误信息
- 使用中文错误信息
- 包含足够的上下文
- 区分用户可见错误和调试信息

---

## 7. 导入导出

### 7.1 导入顺序
按以下顺序组织，组之间空一行：

```typescript
// 1. React 及 Next.js
import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

// 2. 第三方库
import OpenAI from 'openai';
import { useOcrStore } from '@/stores/ocr-store';

// 3. 类型导入
import type { OcrResult } from '@/types/ocr';

// 4. 内部模块（绝对路径）
import { convertToBase64 } from '@/utils/image-utils';

// 5. 相对导入
import { OcrResult } from './OcrResult';
import styles from './styles.module.css';
```

### 7.2 路径别名
- 使用 `@/` 指向 `src/` 目录
- 避免深层相对路径（如 `../../../`）

### 7.3 导出规范
- 优先使用命名导出
- Next.js 约定文件（page、layout 等）使用默认导出
- 避免同时使用 default 和命名导出

---

## 8. 异步编程

### 8.1 Promise 使用
- 优先使用 `async/await` 而不是 `.then()`
- 合理使用 `Promise.all()` 并发请求
- 避免在循环中串行 await

```typescript
// ✅ 正确：并发执行
const [ocrResult, analysisResult] = await Promise.all([
  callOcrApi(imageBase64),
  analyzeConversation(text),
]);

// ❌ 错误：串行执行
const ocrResult = await callOcrApi(imageBase64);
const analysisResult = await analyzeConversation(text);
```

---

## 9. 文件组织

### 9.1 Next.js 项目目录结构

```
/
├── app/                         # Next.js App Router
│   ├── layout.tsx               # 根 layout
│   ├── page.tsx                 # 首页
│   ├── globals.css              # 全局样式（Tailwind 入口）
│   └── (features)/              # 功能路由组
│       └── ocr/
│           └── page.tsx
├── src/
│   ├── components/              # 通用组件
│   │   ├── ui/                  # Shadcn UI 组件（自动生成，不手动修改）
│   │   ├── ImageUploader/
│   │   │   └── ImageUploader.tsx
│   │   └── OcrResult/
│   │       └── OcrResult.tsx
│   ├── services/                # API 服务封装
│   │   └── ocr-service.ts
│   ├── utils/                   # 工具函数
│   │   └── image-utils.ts
│   ├── hooks/                   # 自定义 Hooks
│   ├── types/                   # 类型定义
│   │   └── ocr.ts
│   ├── constants/               # 常量
│   ├── stores/                  # Zustand stores
│   │   └── ocr-store.ts
│   └── styles/                  # 额外全局样式（必要时才使用）
├── public/                      # 静态资源
├── components.json              # Shadcn UI 配置
├── tailwind.config.ts
├── next.config.ts
├── tsconfig.json
└── .env.local                   # 本地环境变量（含 API Key）
```

### 9.2 文件大小
- 单个文件不超过 **500 行**
- 超过时拆分成多个文件

---

## 10. Tailwind CSS 规范

### 10.1 使用原则
- 优先使用 Tailwind 工具类，不另写自定义 CSS
- 复杂样式组合使用 `cn()` 工具函数（Shadcn UI 内置）
- 响应式前缀：`sm:` `md:` `lg:` `xl:`

```typescript
import { cn } from '@/lib/utils';

// ✅ 正确：使用 cn 合并动态类名
<div className={cn(
  'flex items-center gap-2 rounded-lg border p-4',
  isLoading && 'opacity-50 cursor-not-allowed',
  hasError && 'border-red-500',
)} />

// ❌ 错误：字符串拼接类名
<div className={`flex items-center ${isLoading ? 'opacity-50' : ''}`} />
```

### 10.2 禁止事项
- ❌ 不在 Tailwind 项目中使用内联 `style` 属性处理布局（动态颜色值除外）
- ❌ 不为 Tailwind 能覆盖的场景单独写 CSS 文件
- ❌ 不使用魔法数字（使用 Tailwind 配置中的设计 token）

---

## 11. Shadcn UI 规范

### 11.1 组件安装
- 通过 `npx shadcn@latest add <组件名>` 安装
- 安装后的组件文件位于 `src/components/ui/`
- **不直接修改 `ui/` 目录下的组件**，通过封装扩展

### 11.2 组件封装
```typescript
// ✅ 正确：封装 Shadcn 组件添加业务逻辑
import { Button } from '@/components/ui/button';

interface UploadButtonProps {
  onSelect: (file: File) => void;
  isLoading: boolean;
}

export function UploadButton({ onSelect, isLoading }: UploadButtonProps) {
  return (
    <Button disabled={isLoading} variant="outline">
      {isLoading ? '识别中...' : '上传图片'}
    </Button>
  );
}
```

---

## 12. Zustand 规范

### 12.1 Store 结构
- 每个功能模块对应一个 store 文件
- state 和 actions 定义在同一个 interface 中

```typescript
// stores/ocr-store.ts
import { create } from 'zustand';

interface OcrState {
  // state
  ocrText: string;
  isLoading: boolean;
  error: string | null;
  // actions
  setOcrText: (text: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export const useOcrStore = create<OcrState>((set) => ({
  ocrText: '',
  isLoading: false,
  error: null,
  setOcrText: (text) => set({ ocrText: text }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  reset: () => set({ ocrText: '', isLoading: false, error: null }),
}));
```

### 12.2 使用规范
- 在 Client Component 中使用，不在 Server Component 中使用
- 选择性订阅，避免整个 store 订阅导致不必要重渲染

```typescript
// ✅ 正确：只订阅需要的字段
const isLoading = useOcrStore((state) => state.isLoading);
const setLoading = useOcrStore((state) => state.setLoading);

// ❌ 错误：订阅整个 store
const store = useOcrStore();
```

---

## 13. Git 提交规范

### 13.1 提交信息格式
```
<type>(<scope>): <subject>

<body>

<footer>
```

### 13.2 Type 类型
- `feat`: 新功能
- `fix`: 修复 bug
- `docs`: 文档更新
- `style`: 代码格式（不影响功能）
- `refactor`: 重构
- `perf`: 性能优化
- `test`: 测试相关
- `chore`: 构建/工具链更新

### 13.3 示例
```
feat(ocr): 添加图片文字识别功能

- 支持点击上传和拖拽上传
- 调用 GPT-4o-mini 识别中文文字
- 识别结果支持一键复制

Closes #1
```

### 13.4 提交原则
- 一次提交只做一件事
- 提交信息使用中文
- 频繁提交，保持每次改动可控

---

## 14. 代码审查清单

提交前必须自查：

- [ ] 所有注释都是中文
- [ ] 没有 `console.log` 调试代码（可用 `console.error` 记录错误）
- [ ] 没有注释掉的代码
- [ ] 命名清晰且符合规范
- [ ] 函数长度合理（< 50 行）
- [ ] 有适当的错误处理
- [ ] TypeScript 类型定义完整
- [ ] 没有 `any` 类型
- [ ] 代码已格式化（Prettier）
- [ ] Client Component 已加 `'use client'` 指令
- [ ] 环境变量未硬编码在代码中
- [ ] 通过所有测试

---

## 15. 性能要点

- 避免不必要的重渲染（`React.memo`、`useMemo`、`useCallback`）
- 能用 Server Component 就用 Server Component，减少客户端 JS 体积
- 图片上传前压缩（使用 `browser-image-compression`）
- Zustand 选择性订阅，避免全量订阅
- 大列表使用虚拟滚动
- 防抖节流处理高频事件

---

## 16. 安全规范

- 不在代码中硬编码 API Key（使用 `.env.local`，加入 `.gitignore`）
- Next.js 中客户端可访问的环境变量需加 `NEXT_PUBLIC_` 前缀（含 API Key 的变量**不加**此前缀，仅在 Server Action / Route Handler 中使用）
- 用户输入必须验证和转义
- 防止 XSS 攻击
- 敏感信息不打印到控制台

---

## 17. 测试规范

- 核心业务逻辑必须有单元测试
- 测试描述使用中文
- 保持测试简单可维护
- 目标覆盖率：核心模块 > 80%

```typescript
describe('图片工具函数', () => {
  it('应该正确将文件转换为 base64', async () => {
    const file = new File(['test'], 'test.png', { type: 'image/png' });
    const result = await fileToBase64(file);
    expect(result).toMatch(/^data:image\/png;base64,/);
  });
});
```

---

**版本**: v1.1
**更新日期**: 2026-02-19
**适用范围**: 本项目所有代码

本规范是强制性的，所有团队成员必须遵守。
