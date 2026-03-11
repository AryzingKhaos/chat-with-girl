# 用户引导落地页

## 功能目标

将首页 `/` 从 Next.js 默认模板改造为产品引导落地页，向用户清晰说明网站的使用流程和功能特点，提供明确的入口按钮跳转到核心功能页 `/ocr`。

---

## 输入输出定义

### 输入

无用户输入，纯静态展示页面（Server Component）。

### 输出

#### 页面结构

```
┌──────────────────────────────────────────────────────┐
│  区域 1：Hero（产品定位）                               │
│  标题 + 副标题 + 「开始分析」按钮（链接至 /ocr）          │
├──────────────────────────────────────────────────────┤
│  区域 2：使用步骤（3 步）                               │
│  Step1 上传截图 → Step2 确认对话 → Step3 AI 分析       │
├──────────────────────────────────────────────────────┤
│  区域 3：功能特点（4 项 Grid）                          │
│  自动识别气泡 | 双 AI 支持 | 三维分析 | 隐私安全         │
├──────────────────────────────────────────────────────┤
│  区域 4：底部 CTA                                      │
│  「立即开始」按钮（链接至 /ocr）                         │
└──────────────────────────────────────────────────────┘
```

#### 各区域详细规格

**区域 1：Hero**

| 字段 | 内容 |
|------|------|
| 主标题 | `读懂她的心思，从一张截图开始` |
| 副标题 | `上传聊天截图，AI 自动分析对方心情、性格与最佳回复策略` |
| CTA 按钮 | `开始分析` → `href="/ocr"` |
| 按钮样式 | Shadcn `Button` variant="default"，尺寸 lg |

**区域 2：使用步骤**

| 步骤 | 图标 | 标题 | 描述 |
|------|------|------|------|
| Step 1 | `Upload`（lucide） | 上传聊天截图 | 支持微信、Soul 等 App 的截图，JPG/PNG/WebP |
| Step 2 | `MessageSquare`（lucide） | 确认对话内容 | AI 自动识别气泡中的对话，分离无关界面文字 |
| Step 3 | `Sparkles`（lucide） | 获取分析建议 | 选择 ChatGPT 或 Gemini，分析心情、性格与回复策略 |

步骤间用箭头 `→`（`ChevronRight` 图标）连接，移动端竖向排列，桌面端横向排列。

**区域 3：功能特点**

| 图标 | 标题 | 描述 |
|------|------|------|
| `Scan`（lucide） | 智能气泡识别 | 自动区分聊天气泡内外的文字，过滤导航栏、时间戳等无关内容 |
| `Bot`（lucide） | 双 AI 引擎 | 支持 ChatGPT 和 Gemini，可自由切换对比分析结果 |
| `Brain`（lucide） | 三维深度分析 | 同时分析对方心情状态、性格特征和最佳回复策略 |
| `Lock`（lucide） | 本地隐私保护 | 截图仅在分析时传输，不存储任何聊天数据 |

2×2 Grid 布局，移动端 1 列，桌面端 2 列。

**区域 4：底部 CTA**

| 字段 | 内容 |
|------|------|
| 文案 | `准备好了吗？` |
| 按钮 | `立即开始分析` → `href="/ocr"` |
| 按钮样式 | Shadcn `Button` variant="default"，尺寸 lg |

---

## 状态机 / 流程

```
用户访问 /
    ↓
渲染引导落地页（Server Component，无状态）
    ↓
用户点击「开始分析」或「立即开始分析」按钮
    ↓
Next.js Link 跳转至 /ocr
    ↓
用户进入核心功能页
```

无交互状态，纯展示静态内容。

---

## 约束条件

### 技术约束

- **Server Component**：`page.tsx` 保持 Server Component，不使用 `'use client'`，无 React hooks
- **导航跳转**：使用 Next.js `<Link>` 组件，不使用 `<a>` 标签（避免全页刷新）
- **图标**：使用 `lucide-react`（项目已安装），不引入新图标库
- **样式**：全部使用 Tailwind CSS 工具类 + `cn()` 函数，不写自定义 CSS

### 样式约束

- **响应式**：移动端步骤竖排，桌面端（md:）横排
- **颜色**：使用 Tailwind 语义色变量（`primary`、`muted`、`foreground` 等），适配暗黑模式
- **间距**：区域间垂直间距使用 `py-16`（桌面）/ `py-10`（移动）
- **容器**：最大宽度 `max-w-4xl`，居中 `mx-auto`，水平内边距 `px-4`

### 内容约束

- 不提及任何 AI 费用或 API Key 相关信息
- 不在落地页展示实际截图样本（用户隐私）
- 文案保持积极正向，不暗示操控或欺骗

---

## 边界情况

### 1. 用户直接访问 `/ocr`

**场景**: 用户书签收藏了 `/ocr`，跳过引导页直接使用

**处理**: 不做拦截，`/ocr` 页面正常渲染，无需跳回首页。引导落地页仅作为首次访问的入口，不强制流程。

---

### 2. 移动端屏幕过窄

**场景**: 屏幕宽度 < 375px

**处理**: 步骤和功能卡片强制单列显示，文字使用 `text-sm` 降级，按钮宽度 `w-full`。

---

### 3. 暗黑模式

**场景**: 用户系统设置为 Dark Mode

**处理**: 全部使用 Tailwind 语义色（`bg-background`、`text-foreground` 等），自动适配，不单独写 `dark:` 样式。

---

## 验收标准

### 功能验收

- [ ] 访问 `/` 看到引导落地页，不再显示 Next.js 默认模板
- [ ] 点击「开始分析」按钮，正确跳转至 `/ocr`
- [ ] 点击「立即开始分析」按钮，正确跳转至 `/ocr`
- [ ] 页面 Title 为 "ChatWithGirl - AI 聊天助手"（layout.tsx 已配置）

### 内容验收

- [ ] Hero 区域主标题、副标题、CTA 按钮显示正确
- [ ] 3 个使用步骤内容和图标正确
- [ ] 4 个功能特点内容和图标正确
- [ ] 底部 CTA 区域显示正确

### 视觉验收

- [ ] 移动端（375px）步骤竖向排列，布局无溢出
- [ ] 桌面端（1280px）步骤横向排列，箭头可见
- [ ] 功能特点移动端 1 列、桌面端 2 列
- [ ] 暗黑模式下颜色正确（不出现白底白字）
- [ ] 按钮 hover 状态有样式变化

### 代码质量验收

- [ ] `page.tsx` 保持 Server Component（无 `'use client'`）
- [ ] 使用 Next.js `<Link>` 组件跳转
- [ ] 无 TypeScript `any` 类型
- [ ] 通过 ESLint 检查

---

## 实现提示

### 文件结构

```
src/
└── app/
    └── page.tsx    # 直接修改此文件，替换 Next.js 默认模板内容
```

**无需新建组件**，内容简单，全部在 `page.tsx` 内实现即可。

### 关键代码结构

```typescript
// app/page.tsx（Server Component，不加 'use client'）
import Link from 'next/link';
import { Upload, MessageSquare, Sparkles, ChevronRight,
         Scan, Bot, Brain, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero 区域 */}
      <section className="...">
        <h1>读懂她的心思，从一张截图开始</h1>
        <p>副标题...</p>
        <Button asChild size="lg">
          <Link href="/ocr">开始分析</Link>
        </Button>
      </section>

      {/* 使用步骤 */}
      <section className="...">
        {/* 步骤 1、2、3 + 箭头 */}
      </section>

      {/* 功能特点 */}
      <section className="...">
        {/* 2×2 Grid */}
      </section>

      {/* 底部 CTA */}
      <section className="...">
        <Button asChild size="lg">
          <Link href="/ocr">立即开始分析</Link>
        </Button>
      </section>
    </div>
  );
}
```

### Shadcn Button + Link 组合用法

```typescript
// 使用 asChild 将 Button 的样式应用到 Link 上
<Button asChild size="lg">
  <Link href="/ocr">开始分析</Link>
</Button>
```

---

## 后续扩展

以下功能当前不实现，为后续迭代预留：

1. **使用统计**：展示"已分析 X 条对话"等动态数据
2. **用户评价**：展示用户反馈或使用效果截图（脱敏）
3. **FAQ 模块**：常见问题解答（如"数据安全吗？"）
4. **多语言支持**：英文版本
5. **导航栏**：添加页面顶部导航（首页、关于、反馈）

---

**版本**: 0.1.0
**创建日期**: 2026-03-06
**依赖文档**: 无（纯展示页面，不依赖其他功能模块）

---

## Todo List

### 页面实现
- [ ] 修改 `src/app/page.tsx`，替换 Next.js 默认模板
- [ ] 实现 Hero 区域（主标题、副标题、CTA 按钮）
- [ ] 实现使用步骤区域（3 步 + 步骤间箭头）
- [ ] 实现功能特点区域（4 项 2×2 Grid）
- [ ] 实现底部 CTA 区域
- [ ] 使用 Next.js `<Link>` 组件处理跳转（两处 CTA 均指向 `/ocr`）
- [ ] 使用 `Button asChild` + `Link` 组合实现按钮跳转

### 图标使用
- [ ] Hero 无需图标
- [ ] 步骤图标：`Upload`、`MessageSquare`、`Sparkles`（均来自 lucide-react）
- [ ] 步骤间箭头：`ChevronRight`（lucide-react）
- [ ] 功能特点图标：`Scan`、`Bot`、`Brain`、`Lock`（均来自 lucide-react）

### 响应式样式
- [ ] 步骤区域：移动端竖排（`flex-col`），桌面端横排（`md:flex-row`）
- [ ] 步骤间箭头：移动端隐藏（`hidden md:block`），桌面端显示
- [ ] 功能特点：移动端 1 列（`grid-cols-1`），桌面端 2 列（`md:grid-cols-2`）
- [ ] 按钮：移动端宽度适配，桌面端正常宽度

### 暗黑模式适配
- [ ] 全部使用 Tailwind 语义色（`bg-background`、`text-foreground`、`text-muted-foreground`）
- [ ] 不使用硬编码颜色（如 `text-gray-500`），确保暗黑模式下可读

### 功能测试
- [ ] 测试：访问 `/` 显示引导落地页
- [ ] 测试：点击「开始分析」跳转 `/ocr`，无全页刷新
- [ ] 测试：点击「立即开始分析」跳转 `/ocr`，无全页刷新
- [ ] 测试：移动端（375px）布局无溢出
- [ ] 测试：桌面端（1280px）步骤横排、箭头可见
- [ ] 测试：暗黑模式下颜色正确

### 代码质量
- [ ] `page.tsx` 无 `'use client'` 指令（保持 Server Component）
- [ ] 无 TypeScript `any` 类型
- [ ] 通过 ESLint 检查
