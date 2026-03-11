# AI 聊天分析功能

## 功能目标

用户点击"确认聊天内容"按钮后,将结构化的对话数据发送给 AI 进行分析。用户可选择使用 ChatGPT 或 Gemini 作为分析引擎。AI 返回 JSON 格式的分析结果,包含对方心情、性格特征和回复策略,分区域展示给用户。

---

## 输入输出定义

### 输入

**来源**: `ChatDisplay` 组件的 `ChatData` 数据

**数据结构**:
```typescript
interface ChatData {
  messages: MessageItem[];       // 对话消息列表
  metadata: string[];            // 非对话信息
}

interface MessageItem {
  id: string;
  speaker: 'self' | 'other';
  nickname: string;
  content: string;
}
```

**用户选择**:
- AI 提供商: `'chatgpt' | 'gemini'`
- 可通过下拉选择器或单选按钮选择

---

### 中间数据结构

#### AI API 请求

**类型定义路径**: `src/types/ai-analysis.ts`

```typescript
// AI 提供商类型
type AiProvider = 'chatgpt' | 'gemini';

// AI 分析请求
interface AiAnalysisRequest {
  messages: MessageItem[];       // 对话消息列表
  provider: AiProvider;          // AI 提供商
}

// AI 分析响应
interface AiAnalysisResponse {
  success: boolean;              // 分析是否成功
  data: AnalysisResult | null;  // 分析结果
  error: string | null;          // 错误信息
}

// 分析结果数据结构
interface AnalysisResult {
  mood: MoodAnalysis;            // 心情状态分析
  personality: PersonalityAnalysis;  // 性格分析
  replyStrategy: ReplyStrategy;  // 回复策略
}

// 心情状态分析
interface MoodAnalysis {
  status: string;                // 心情状态(如:"开心"、"平淡"、"有些生气")
  confidence: number;            // 置信度(0-100)
  evidence: string[];            // 依据(具体对话内容引用)
  description: string;           // 详细描述
}

// 性格分析
interface PersonalityAnalysis {
  traits: string[];              // 性格特征列表(如:["活泼开朗","善于表达"])
  confidence: number;            // 置信度(0-100)
  evidence: string[];            // 依据(具体对话内容引用)
  description: string;           // 详细描述
  note?: string;                 // 备注(如:"聊天内容较少,分析仅供参考")
}

// 回复策略
interface ReplyStrategy {
  context: string;               // 对方最后一句话的内容
  strategy: string;              // 核心策略(如:"顺着她的话题,表达认同")
  suggestions: ReplySuggestion[]; // 具体回复建议(3-5 条)
  warnings: string[];            // 注意事项(如:"避免说教","不要转移话题")
}

// 单条回复建议
interface ReplySuggestion {
  id: string;                    // 建议 ID(UUID)
  type: SuggestionType;          // 建议类型
  content: string;               // 建议内容(具体回复文案)
  explanation: string;           // 解释(为什么这样回复)
  riskLevel: 'low' | 'medium' | 'high'; // 风险等级
}

// 建议类型
type SuggestionType =
  | 'humor'        // 幽默风趣
  | 'caring'       // 关心体贴
  | 'deep'         // 深度交流
  | 'casual'       // 轻松日常
  | 'flirty';      // 轻微调情(暧昧期适用)
```

---

### 输出

#### UI 布局

```
┌─────────────────────────────────────────────┐
│  AI 分析结果                                  │
│                                             │
│  ┌─── 1. 对方心情状态 ───────────────────┐  │
│  │  状态: 😊 开心(置信度 85%)              │  │
│  │  描述: 从她连续使用感叹号和表情符号...   │  │
│  │  依据:                                  │  │
│  │    • "哈哈哈太好玩了!"                  │  │
│  │    • "我也超喜欢这个!"                  │  │
│  └────────────────────────────────────────┘  │
│                                             │
│  ┌─── 2. 对方性格特征 ───────────────────┐  │
│  │  特征: 活泼开朗 • 善于表达 • 兴趣广泛   │  │
│  │  描述: 她的表达方式直接热情...          │  │
│  │  依据:                                  │  │
│  │    • "我超喜欢..."(多次使用"超"字)     │  │
│  │    • 主动分享个人经历                   │  │
│  │  ⚠️ 注: 聊天内容较少,分析仅供参考       │  │
│  └────────────────────────────────────────┘  │
│                                             │
│  ┌─── 3. 回复策略 ────────────────────────┐ │
│  │  对方最后说: "你觉得怎么样?"             │  │
│  │  核心策略: 表达认同并分享个人感受        │  │
│  │                                         │  │
│  │  💡 建议回复(点击复制):                  │  │
│  │  ┌─────────────────────────────────┐   │  │
│  │  │ [幽默] 低风险                     │   │  │
│  │  │ "哈哈我也觉得!咱俩想一块去了~"     │   │  │
│  │  │ 💭 解释: 轻松回应,表达共鸣...      │   │  │
│  │  │ [复制]                            │   │  │
│  │  └─────────────────────────────────┘   │  │
│  │  ┌─────────────────────────────────┐   │  │
│  │  │ [关心] 低风险                     │   │  │
│  │  │ "我觉得挺好的!你喜欢就行~"         │   │  │
│  │  │ 💭 解释: 表达支持,以她为中心...    │   │  │
│  │  │ [复制]                            │   │  │
│  │  └─────────────────────────────────┘   │  │
│  │  ... (共 3-5 条建议)                   │  │
│  │                                         │  │
│  │  ⚠️ 注意事项:                           │  │
│  │    • 避免敷衍性回复                     │  │
│  │    • 不要立即转移话题                   │  │
│  └────────────────────────────────────────┘ │
│                                             │
│  [重新分析] [切换 AI: ChatGPT ▼]             │
└─────────────────────────────────────────────┘
```

#### 交互说明

1. **AI 提供商选择**: 确认按钮旁边的下拉选择器,默认 ChatGPT
2. **加载状态**: 分析中显示骨架屏(Skeleton)或加载动画
3. **结果展示**: 三个独立卡片区域,可折叠/展开
4. **建议复制**: 点击建议卡片的"复制"按钮,复制回复文案到剪贴板
5. **重新分析**: 切换 AI 提供商后可重新分析

---

## 状态机 / 流程

### 主流程

```
用户点击"确认聊天内容"
    ↓
检查消息列表是否为空 ──Yes→ Toast 提示"暂无对话内容"
    ↓ No
获取用户选择的 AI 提供商
    ↓
显示加载状态(Skeleton)
    ↓
调用 POST /api/analyze
    ├─ Body: { messages, provider }
    └─ Headers: Content-Type: application/json
    ↓
Route Handler (服务端)
    ├─ 读取对应的 API Key (ChatGPT/Gemini)
    ├─ 构建 AI Prompt
    ├─ 调用 AI API
    └─ 解析 JSON 响应
    ↓
返回 AnalysisResult
    ↓
前端接收并展示结果
    ├─ 心情状态卡片
    ├─ 性格特征卡片
    └─ 回复策略卡片
    ↓
用户交互
    ├─ 复制回复建议
    ├─ 折叠/展开卡片
    └─ 切换 AI 重新分析
```

### AI Prompt 构建流程

```
接收 MessageItem[]
    ↓
⚠️ 服务端预处理：找到对方最后一条消息
    ├─ 从消息列表末尾向前遍历
    ├─ 找到第一条 speaker === 'other' 且 content 非空的消息
    └─ 记为 lastOtherMessage
    ↓
转换为对话文本格式
    ↓
示例:
"对方(小红): 今天天气真好!
自己: 是啊,要不要出去走走?
对方(小红): 好啊,你觉得去哪好?
自己: 我觉得去公园不错!"
    ↓
构建 System Prompt
    ↓
System:
"你是专业的聊天分析助手。分析以下聊天记录,
返回 JSON 格式结果,包含:
1. mood: 对方心情状态
2. personality: 对方性格特征
3. replyStrategy: 针对对方最后一句话的回复策略
   注意: replyStrategy.context 必须使用 User Prompt 中
   明确标注的「对方最后一句话」,不是对话末尾的最后一条消息"
    ↓
构建 User Prompt（携带预处理结果）
    ↓
User:
"请分析以下聊天记录:

[对话文本]

⚠️ 重要提示：对方最后一句话是：
「[lastOtherMessage.content]」
（这是对方发送的最后一条消息，对话末尾可能还有"自己"发出的消息，请忽略那些）

请严格按照 JSON Schema 返回分析结果。
其中 replyStrategy.context 请直接使用上方标注的「对方最后一句话」内容。"
    ↓
发送给 AI API
```

---

## 约束条件

### 安全约束

- **API Key 保护**: ChatGPT 和 Gemini 的 API Key 必须存储在 `.env.local`,仅服务端可访问
  - `OPENAI_API_KEY` (ChatGPT)
  - `GEMINI_API_KEY` (Gemini)
- **输入验证**: 检查 `messages` 数组非空,消息内容非空
- **输出验证**: 验证 AI 返回的 JSON 格式是否符合 Schema,防止解析错误
- **XSS 防护**: AI 返回的文本内容必须转义后展示,不使用 `dangerouslySetInnerHTML`

### 性能约束

- **超时时间**: AI API 调用超时时间设置为 **30 秒**
- **消息数量限制**: 单次分析最多支持 **100 条消息**,超出提示用户分段分析
- **Token 控制**:
  - ChatGPT: 使用 `gpt-4o-mini` 模型,Token 限制 16k
  - Gemini: 使用 `gemini-2.0-flash-exp` 模型,Token 限制 1M
- **并发控制**: 同一时刻只允许一个分析请求,重复点击时忽略

### 费用约束

- **ChatGPT**:
  - 模型: `gpt-4o-mini`
  - 费用: 约 $0.15 / 1M input tokens, $0.60 / 1M output tokens
- **Gemini**:
  - 模型: `gemini-2.0-flash-exp`
  - 费用: 免费(实验版),正式版约 $0.075 / 1M input tokens
- **成本预估**: 单次分析约消耗 1000-2000 tokens,成本 < $0.001

### 数据约束

- **对话文本长度**: 拼接后的对话文本不超过 **10,000 字符**
- **建议数量**: 回复建议固定 **3-5 条**
- **依据数量**: 心情和性格分析的依据各不超过 **5 条**

---

## 边界情况

### 1. 消息列表为空

**场景**: 用户点击确认时,`messages` 数组为空

**处理**:
- 按钮置灰,不可点击
- 点击时 Toast 提示:"暂无对话内容,无法分析"

---

### 2. API Key 未配置

**场景**: `.env.local` 中缺少对应的 API Key

**处理**:
- Route Handler 返回 500 错误,错误信息:"服务配置错误:缺少 [ChatGPT/Gemini] API Key"
- 前端显示错误 Toast

---

### 3. AI API 调用失败

**场景**: 网络错误、API 限流、超时等

**处理**:
- 捕获异常,返回错误响应
- 前端显示错误 Alert:"分析失败:[错误原因],请稍后重试"
- 提供"重新分析"按钮

---

### 4. AI 返回格式不符合 Schema

**场景**: AI 返回的 JSON 缺少字段或格式错误

**处理**:
- 服务端使用 Zod 验证 JSON Schema
- 验证失败时记录原始响应到 console.error
- 返回错误:"AI 返回格式异常,请重新分析或切换 AI"

---

### 5. 聊天内容过少(< 5 条消息)

**场景**: 对话消息数量过少,分析准确度低

**处理**:
- 正常分析,但在 `personality.note` 中标注:"聊天内容较少,分析仅供参考"
- UI 显示警告图标和提示

---

### 6. 对话仅包含自己的消息

**场景**: `messages` 中所有 `speaker` 均为 `'self'`

**处理**:
- Toast 提示:"对话中缺少对方的消息,无法分析"
- 不发送 API 请求

---

### 7. 对话末尾是"自己"的消息

**场景**: 聊天记录最后几条消息均由"自己"发出，对方最后一条消息不在末尾

**处理**:
- 服务端预处理阶段，从消息列表末尾向前遍历
- 找到第一条 `speaker === 'other'` 且 `content` 非空的消息
- 将其作为 `lastOtherMessage`，在 User Prompt 中明确标注
- 示例：
  ```
  对方(小红): 好啊,你觉得去哪好?   ← 这是 lastOtherMessage
  自己: 我觉得去公园不错!
  自己: 你觉得呢?                 ← 对话末尾是"自己"发的
  ```

---

### 8. 对方最后一句话为空

**场景**: 从末尾向前遍历，找到的对方消息 `content` 为空字符串

**处理**:
- 继续向前查找，直到找到 `content` 非空的对方消息
- 如果所有对方消息均为空，`replyStrategy.context` 设置为"(对方未发送有效消息)"，`strategy` 和 `suggestions` 返回默认提示

---

### 9. AI 返回的建议数量不足

**场景**: AI 仅返回 1-2 条建议,少于预期的 3-5 条

**处理**:
- 接受实际数量,正常展示
- 不做补充生成(避免二次调用)

---

## 验收标准

### 功能验收

- [ ] 用户可选择 ChatGPT 或 Gemini 进行分析
- [ ] 点击"确认聊天内容"后触发分析流程
- [ ] AI 返回的 JSON 数据正确解析为 `AnalysisResult`
- [ ] 心情、性格、回复策略三个部分独立展示
- [ ] 回复建议可点击复制到剪贴板
- [ ] 处理所有边界情况,无崩溃

### 视觉验收

- [ ] 三个分析卡片样式统一,层次清晰
- [ ] 置信度以百分比和进度条形式显示
- [ ] 建议类型使用不同颜色标签区分(幽默/关心/深度等)
- [ ] 风险等级使用颜色标识(绿/黄/红)
- [ ] 加载状态使用骨架屏,体验流畅

### 测试验收

- [ ] 测试脚本成功运行,验证 ChatGPT 和 Gemini 返回格式
- [ ] 测试用例覆盖短对话、长对话、单方对话等场景
- [ ] 测试 API Key 未配置、网络错误等异常情况
- [ ] 测试 JSON Schema 验证功能

### 代码质量验收

- [ ] 所有类型定义在 `src/types/ai-analysis.ts` 中
- [ ] Route Handler 实现在 `app/api/analyze/route.ts`
- [ ] 使用 Zod 验证 AI 返回的 JSON 格式
- [ ] 组件注释使用中文
- [ ] 无 TypeScript `any` 类型
- [ ] 通过 ESLint 检查

---

## 实现步骤

### Step 1: 测试脚本开发

**目标**: 验证 ChatGPT 和 Gemini 的分析能力和返回格式

#### 1.1 创建测试目录

```bash
mkdir -p test-chat/scripts
mkdir -p test-chat/data
mkdir -p test-chat/results
```

#### 1.2 准备测试数据

**路径**: `test-chat/data/sample-chat.json`

**格式**:
```json
{
  "messages": [
    {
      "id": "1",
      "speaker": "other",
      "nickname": "小红",
      "content": "今天天气真好!"
    },
    {
      "id": "2",
      "speaker": "self",
      "nickname": "自己",
      "content": "是啊,要不要出去走走?"
    },
    {
      "id": "3",
      "speaker": "other",
      "nickname": "小红",
      "content": "好啊,你觉得去哪好?"
    }
  ]
}
```

**数据来源**:
1. 从 `test-images/results-structured/*.txt` 中提取对话内容
2. 转换为 `MessageItem[]` 格式
3. 手动创建 2-3 个不同长度的测试样本

#### 1.3 创建 ChatGPT 测试脚本

**路径**: `test-chat/scripts/test-chatgpt.mjs`

**功能**:
- 读取 `test-chat/data/*.json` 测试数据
- 调用 ChatGPT API (使用 `gpt-4o-mini`)
- 验证返回的 JSON 格式
- 保存结果到 `test-chat/results/chatgpt-*.json`
- 生成测试报告 `test-chat/results/chatgpt-report.md`

#### 1.4 创建 Gemini 测试脚本

**路径**: `test-chat/scripts/test-gemini.mjs`

**功能**:
- 读取 `test-chat/data/*.json` 测试数据
- 调用 Gemini API (使用 `gemini-2.0-flash-exp`)
- 验证返回的 JSON 格式
- 保存结果到 `test-chat/results/gemini-*.json`
- 生成测试报告 `test-chat/results/gemini-report.md`

#### 1.5 Prompt 模板设计

**System Prompt**:
```
你是一位专业的聊天心理分析师,擅长通过文字对话分析人的情绪、性格和沟通模式。

你的任务是分析一段男性用户与女性的聊天记录,从男性视角提供分析和建议。

分析要求:
1. 客观准确:基于对话内容,不做过度推测
2. 实用性强:建议具体可操作,贴近真实聊天场景
3. 风险意识:标注建议的风险等级,避免误导

输出要求:
严格按照以下 JSON Schema 返回,不要添加任何额外文字:
{
  "mood": {
    "status": "对方当前心情(如:开心、平淡、有点生气)",
    "confidence": 85,
    "evidence": ["引用的对话片段1", "引用的对话片段2"],
    "description": "详细描述心情判断依据"
  },
  "personality": {
    "traits": ["性格特征1", "性格特征2"],
    "confidence": 70,
    "evidence": ["引用的对话片段1"],
    "description": "性格特征详细分析",
    "note": "如果对话少于10条,添加:聊天内容较少,分析仅供参考"
  },
  "replyStrategy": {
    "context": "对方最后一句话的内容",
    "strategy": "核心回复策略(一句话)",
    "suggestions": [
      {
        "id": "uuid",
        "type": "humor",
        "content": "具体回复文案",
        "explanation": "为什么这样回复",
        "riskLevel": "low"
      }
    ],
    "warnings": ["注意事项1", "注意事项2"]
  }
}
```

**User Prompt**:
```
请分析以下聊天记录:

{对话文本}

请严格按照 JSON Schema 返回分析结果。
```

#### 1.6 测试脚本运行

```bash
cd test-chat/scripts
node test-chatgpt.mjs
node test-gemini.mjs
```

#### 1.7 测试报告内容

**报告包含**:
- 测试样本数量
- 成功率(JSON 格式正确的比例)
- 平均耗时
- 平均 Token 消耗
- 分析质量评估(人工检查)
- 问题记录(格式错误、内容不合理等)

---

### Step 2: 类型定义

**路径**: `src/types/ai-analysis.ts`

**内容**: 定义所有上述接口(`AiProvider`, `AiAnalysisRequest`, `AiAnalysisResponse`, `AnalysisResult` 等)

---

### Step 3: Route Handler 实现

**路径**: `app/api/analyze/route.ts`

**功能**:
1. 接收 `POST` 请求,参数为 `{ messages, provider }`
2. 验证输入(消息非空、包含对方消息等)
3. 根据 `provider` 选择对应的 API Key
4. 构建 AI Prompt
5. 调用 AI API (ChatGPT 或 Gemini)
6. 使用 Zod 验证返回的 JSON Schema
7. 返回 `AiAnalysisResponse`

**依赖**:
- `openai`: ChatGPT SDK
- `@google/generative-ai`: Gemini SDK (已安装)
- `zod`: JSON Schema 验证

**安装依赖**:
```bash
pnpm add openai zod
```

---

### Step 4: 工具函数

#### 4.1 消息格式化函数

**路径**: `src/utils/message-formatter.ts`

**功能**: 将 `MessageItem[]` 转换为对话文本

```typescript
/**
 * 将消息列表转换为对话文本
 * @param messages - 消息列表
 * @returns 格式化的对话文本
 */
export function formatMessagesForAi(messages: MessageItem[]): string;
```

#### 4.2 JSON Schema 验证

**路径**: `src/utils/analysis-validator.ts`

**功能**: 使用 Zod 验证 AI 返回的 JSON

```typescript
import { z } from 'zod';

// 定义 Zod Schema
export const AnalysisResultSchema = z.object({
  mood: z.object({
    status: z.string(),
    confidence: z.number().min(0).max(100),
    evidence: z.array(z.string()),
    description: z.string(),
  }),
  personality: z.object({
    traits: z.array(z.string()),
    confidence: z.number().min(0).max(100),
    evidence: z.array(z.string()),
    description: z.string(),
    note: z.string().optional(),
  }),
  replyStrategy: z.object({
    context: z.string(),
    strategy: z.string(),
    suggestions: z.array(z.object({
      id: z.string(),
      type: z.enum(['humor', 'caring', 'deep', 'casual', 'flirty']),
      content: z.string(),
      explanation: z.string(),
      riskLevel: z.enum(['low', 'medium', 'high']),
    })),
    warnings: z.array(z.string()),
  }),
});

/**
 * 验证 AI 返回的 JSON 是否符合 Schema
 */
export function validateAnalysisResult(data: unknown): AnalysisResult;
```

---

### Step 5: 前端服务层

**路径**: `src/services/ai-analysis-service.ts`

**功能**: 封装调用 `/api/analyze` 的逻辑

```typescript
/**
 * 调用 AI 分析 API
 * @param messages - 消息列表
 * @param provider - AI 提供商
 * @returns 分析结果
 */
export async function analyzeChat(
  messages: MessageItem[],
  provider: AiProvider
): Promise<AnalysisResult>;
```

---

### Step 6: UI 组件实现

#### 6.1 AI 提供商选择器

**路径**: `src/components/AiProviderSelector/AiProviderSelector.tsx`

**功能**: 下拉选择 ChatGPT 或 Gemini

**Props**:
```typescript
interface AiProviderSelectorProps {
  value: AiProvider;
  onChange: (provider: AiProvider) => void;
  disabled?: boolean;
}
```

#### 6.2 分析结果展示组件

**路径**: `src/components/AnalysisResult/AnalysisResult.tsx`

**功能**: 展示三个分析卡片

**子组件**:
- `MoodCard`: 心情状态卡片
- `PersonalityCard`: 性格特征卡片
- `ReplyStrategyCard`: 回复策略卡片

#### 6.3 回复建议卡片

**路径**: `src/components/ReplySuggestion/ReplySuggestion.tsx`

**功能**: 单条回复建议,支持复制

**Props**:
```typescript
interface ReplySuggestionProps {
  suggestion: ReplySuggestion;
  onCopy: (content: string) => void;
}
```

---

### Step 7: 集成到 ChatDisplay

**修改**: `src/components/ChatDisplay/ChatDisplay.tsx`

**新增**:
1. AI 提供商选择器(初始值为 `'chatgpt'`)
2. "确认聊天内容"按钮的点击事件处理
3. 调用 `analyzeChat()` 服务
4. 展示 `AnalysisResult` 组件

---

### Step 8: Zustand Store (可选)

**路径**: `src/stores/analysis-store.ts`

**功能**: 管理分析状态(loading、result、error)

**State**:
```typescript
interface AnalysisState {
  isAnalyzing: boolean;
  result: AnalysisResult | null;
  error: string | null;
  provider: AiProvider;
  setProvider: (provider: AiProvider) => void;
  analyze: (messages: MessageItem[]) => Promise<void>;
  reset: () => void;
}
```

---

## 依赖关系

### 新增依赖

```bash
pnpm add openai zod
```

### 环境变量

在 `.env.local` 中添加:
```bash
# ChatGPT API Key
OPENAI_API_KEY=your_openai_api_key_here

# Gemini API Key (已有)
GEMINI_API_KEY=your_gemini_api_key_here
```

### 依赖组件

- `Select` (Shadcn UI): AI 提供商选择器
- `Progress` (Shadcn UI): 置信度进度条
- `Badge` (Shadcn UI): 建议类型标签
- `Skeleton` (Shadcn UI): 加载骨架屏

**安装 Shadcn UI 组件**:
```bash
npx shadcn@latest add select progress badge skeleton
```

---

## 文件结构

```
test-chat/                              # 测试目录
├── scripts/
│   ├── test-chatgpt.mjs                # ChatGPT 测试脚本
│   ├── test-gemini.mjs                 # Gemini 测试脚本
│   └── README.md                       # 测试脚本说明
├── data/
│   ├── sample-chat-short.json          # 短对话测试数据
│   ├── sample-chat-medium.json         # 中等对话测试数据
│   └── sample-chat-long.json           # 长对话测试数据
└── results/
    ├── chatgpt-*.json                  # ChatGPT 测试结果
    ├── gemini-*.json                   # Gemini 测试结果
    ├── chatgpt-report.md               # ChatGPT 测试报告
    └── gemini-report.md                # Gemini 测试报告

src/
├── types/
│   └── ai-analysis.ts                  # AI 分析类型定义
├── utils/
│   ├── message-formatter.ts            # 消息格式化工具
│   └── analysis-validator.ts           # JSON Schema 验证
├── services/
│   └── ai-analysis-service.ts          # AI 分析服务
├── stores/
│   └── analysis-store.ts               # 分析状态管理(可选)
├── components/
│   ├── AiProviderSelector/
│   │   └── AiProviderSelector.tsx      # AI 选择器
│   ├── AnalysisResult/
│   │   ├── AnalysisResult.tsx          # 分析结果容器
│   │   ├── MoodCard.tsx                # 心情卡片
│   │   ├── PersonalityCard.tsx         # 性格卡片
│   │   └── ReplyStrategyCard.tsx       # 策略卡片
│   └── ReplySuggestion/
│       └── ReplySuggestion.tsx         # 回复建议卡片

app/api/analyze/
└── route.ts                            # AI 分析 Route Handler
```

---

## 后续扩展

以下功能当前不实现,为后续迭代预留:

1. **历史分析记录**: 保存分析结果到 IndexedDB,支持查看历史
2. **自定义 Prompt**: 用户可编辑 System Prompt,调整分析风格
3. **建议评分**: 用户可对建议评分,优化 AI 生成质量
4. **多轮对话分析**: 支持追问和深度分析
5. **导出报告**: 将分析结果导出为 PDF 或图片

---

## 测试优先原则

**重要**: 在实现前端和 Route Handler 之前,必须先完成 Step 1(测试脚本开发),验证:
1. ChatGPT 和 Gemini 是否能稳定返回符合 Schema 的 JSON
2. Prompt 设计是否合理,分析结果是否准确
3. Token 消耗和费用是否在可接受范围
4. 边界情况(短对话、单方对话)的处理效果

只有测试脚本通过后,才能开始正式开发。

---

**版本**: 0.1.0
**创建日期**: 2026-03-03
**依赖文档**:
- @.claude/implementation/0.1.0/chat-display.md
- @.claude/implementation/0.1.0/ocr.md

---

## Todo List

### ⚠️ Step 1: 测试脚本开发（最优先）✅

#### 1.1 测试目录和数据准备
- [x] 创建测试目录结构（`test-chat/scripts`, `test-chat/data`, `test-chat/results`）
- [x] 从 `test-images/results-structured/*.txt` 提取对话内容
- [x] 创建 `test-chat/data/sample-chat-short.json`（3-5 条消息）
- [x] 创建 `test-chat/data/sample-chat-medium.json`（10-15 条消息）
- [x] 创建 `test-chat/data/sample-chat-long.json`（30-50 条消息）
- [x] 创建 `test-chat/scripts/README.md` 测试脚本说明文档

#### 1.2 ChatGPT 测试脚本
- [x] 创建 `test-chat/scripts/test-chatgpt.mjs`
- [x] 实现读取测试数据（`*.json`）
- [x] 实现调用 ChatGPT API（`gpt-4o-mini` 模型）
- [x] 实现构建 System Prompt 和 User Prompt
- [x] 实现 JSON Schema 验证（使用 Zod）
- [x] 实现保存结果到 `test-chat/results/chatgpt-*.json`
- [x] 实现生成测试报告 `test-chat/results/chatgpt-report.md`
- [x] 记录成功率、耗时、Token 消耗、分析质量评估

#### 1.3 Gemini 测试脚本
- [x] 创建 `test-chat/scripts/test-gemini.mjs`
- [x] 实现读取测试数据（`*.json`）
- [x] 实现调用 Gemini API（使用 `gemini-2.5-flash` 模型）
- [x] 实现构建 System Prompt 和 User Prompt
- [x] 实现 JSON Schema 验证（使用 Zod）
- [x] 实现保存结果到 `test-chat/results/gemini-*.json`
- [x] 实现生成测试报告 `test-chat/results/gemini-report.md`
- [x] 记录成功率、耗时、Token 消耗、分析质量评估

#### 1.4 测试执行和验证
- [x] 运行 `node test-gemini.mjs`，验证 Gemini 返回格式
- [x] 人工检查分析结果的准确性和实用性
- [x] 验证 JSON Schema 格式完全符合预期
- [x] 记录边界情况（短对话、单方对话）的处理效果
- [x] 确认 Token 消耗和费用在可接受范围
- [x] Prompt 已优化（明确 type 字段枚举值）

---

### Step 2: 类型定义 ✅
- [x] 创建 `src/types/ai-analysis.ts`
- [x] 定义 `AiProvider` 类型（`'chatgpt' | 'gemini'`）
- [x] 定义 `AiAnalysisRequest` 接口
- [x] 定义 `AiAnalysisResponse` 接口
- [x] 定义 `AnalysisResult` 接口
- [x] 定义 `MoodAnalysis` 接口（status、confidence、evidence、description）
- [x] 定义 `PersonalityAnalysis` 接口（traits、confidence、evidence、description、note）
- [x] 定义 `ReplyStrategy` 接口（context、strategy、suggestions、warnings）
- [x] 定义 `ReplySuggestion` 接口（id、type、content、explanation、riskLevel）
- [x] 定义 `SuggestionType` 类型（humor、caring、deep、casual、flirty）

---

### Step 3: 依赖安装 ✅
- [x] 安装 OpenAI SDK（`pnpm add openai`）
- [x] 安装 Zod（`pnpm add zod`）
- [x] 安装 Shadcn UI 组件（`npx shadcn@latest add select progress badge skeleton`）
- [x] 配置环境变量：在 `.env.local` 中添加 `OPENAI_API_KEY`（可选）

---

### Step 4: 工具函数 ✅

#### 4.1 消息格式化
- [x] 创建 `src/utils/message-formatter.ts`
- [x] 实现 `formatMessagesForAi()` 函数
- [x] 将 `MessageItem[]` 转换为对话文本格式
- [x] 测试格式化输出是否正确

#### 4.2 JSON Schema 验证
- [x] 创建 `src/utils/analysis-validator.ts`
- [x] 使用 Zod 定义 `AnalysisResultSchema`
- [x] 实现 `validateAnalysisResult()` 函数
- [x] 测试验证功能（正常数据、异常数据）

---

### Step 5: Route Handler 实现 ✅
- [x] 创建 `app/api/analyze/route.ts`
- [x] 实现 `POST` 请求处理函数
- [x] 验证输入：检查 `messages` 非空、包含对方消息
- [x] 实现 API Key 验证（ChatGPT/Gemini）
- [x] 实现根据 `provider` 选择 API
- [x] 实现 ChatGPT 调用逻辑（使用 `gpt-4o-mini`）
- [x] 实现 Gemini 调用逻辑（使用 `gemini-2.5-flash`）
- [x] 实现 Prompt 构建（System + User）
- [x] 实现 JSON 响应解析
- [x] 使用 Zod 验证 AI 返回的 JSON
- [x] 实现错误处理（API Key 缺失、调用失败、格式错误等）
- [x] 实现超时控制（30 秒）

---

### Step 6: 前端服务层 ✅
- [x] 创建 `src/services/ai-analysis-service.ts`
- [x] 实现 `analyzeChat()` 函数
- [x] 封装 `fetch /api/analyze` 调用
- [x] 实现错误处理和类型转换

---

### Step 7: UI 组件开发 ✅

#### 7.1 AI 提供商选择器
- [x] 创建 `src/components/AiProviderSelector/AiProviderSelector.tsx`
- [x] 实现下拉选择器（使用 Shadcn `Select`）
- [x] 支持 ChatGPT 和 Gemini 选择
- [x] 实现 `value` 和 `onChange` props
- [x] 实现 `disabled` 状态

#### 7.2 分析结果卡片组件
- [x] 创建 `src/components/AnalysisResult/MoodCard.tsx`
- [x] 实现心情状态展示（状态、置信度进度条、依据、描述）
- [x] 创建 `src/components/AnalysisResult/PersonalityCard.tsx`
- [x] 实现性格特征展示（特征标签、置信度、依据、描述、备注）
- [x] 创建 `src/components/AnalysisResult/ReplyStrategyCard.tsx`
- [x] 实现回复策略展示（核心策略、建议列表、注意事项）

#### 7.3 回复建议卡片
- [x] 创建 `src/components/ReplySuggestion/ReplySuggestionCard.tsx`
- [x] 实现单条建议展示（类型标签、内容、解释、风险等级）
- [x] 实现复制按钮（点击复制回复文案）
- [x] 实现类型标签颜色区分（humor、caring、deep 等）
- [x] 实现风险等级颜色标识（low 绿色、medium 黄色、high 红色）

#### 7.4 分析结果容器
- [x] 创建 `src/components/AnalysisResult/AnalysisResult.tsx`
- [x] 实现主容器组件，渲染三个卡片
- [x] 实现加载状态（骨架屏 Skeleton）
- [x] 实现错误状态展示

---

### Step 8: 集成到 ChatDisplay ✅
- [x] 修改 `src/components/ChatDisplay/ChatDisplay.tsx`
- [x] 添加 `AiProviderSelector` 组件（初始值 `'chatgpt'`）
- [x] 实现"确认聊天内容"按钮点击事件
- [x] 调用 `analyzeChat()` 服务
- [x] 管理分析状态（loading、result、error）
- [x] 在"确认聊天内容"下方渲染 `AnalysisResult`
- [x] 实现 `analyzeChat()` 函数
- [x] 封装 `fetch /api/analyze` 调用
- [x] 实现错误处理和类型转换
- [x] 测试服务层调用

---

### Step 9: Zustand Store（可选）
- [ ] 创建 `src/stores/analysis-store.ts`
- [ ] 定义 `AnalysisState` 接口
- [ ] 实现状态管理（isAnalyzing、result、error、provider）
- [ ] 实现 `analyze()` action
- [ ] 实现 `setProvider()` action
- [ ] 实现 `reset()` action
- [ ] 在组件中使用 store 替代 useState

---

### Step 10: 边界情况处理
- [ ] 消息列表为空：按钮置灰，Toast 提示
- [ ] API Key 未配置：返回 500 错误，前端显示 Toast
- [ ] AI API 调用失败：显示错误 Alert，提供重新分析按钮
- [ ] AI 返回格式错误：Zod 验证失败，显示错误提示
- [ ] 聊天内容过少（< 5 条）：正常分析，`personality.note` 标注
- [ ] 仅包含自己消息：Toast 提示，不发送请求
- [ ] 对方最后一句话为空：向前查找非空消息
- [ ] 建议数量不足：接受实际数量，正常展示

---

### Step 11: 样式实现
- [ ] 三个分析卡片样式统一，层次清晰
- [ ] 置信度以百分比和进度条形式显示（使用 Shadcn `Progress`）
- [ ] 建议类型标签：humor（橙色）、caring（绿色）、deep（蓝色）、casual（灰色）、flirty（粉色）
- [ ] 风险等级标识：low（绿色）、medium（黄色）、high（红色）
- [ ] 加载状态使用骨架屏（`Skeleton`）
- [ ] 响应式布局（移动端和桌面端）
- [ ] 复制按钮 hover 效果

---

### Step 12: 功能测试

#### 12.1 基础功能测试
- [ ] 测试：选择 ChatGPT 进行分析，返回正确结果
- [ ] 测试：选择 Gemini 进行分析，返回正确结果
- [ ] 测试：切换 AI 提供商，重新分析
- [ ] 测试：心情、性格、回复策略三部分正确展示
- [ ] 测试：回复建议点击复制，Toast 提示成功
- [ ] 测试：置信度进度条正确显示
- [ ] 测试：建议类型标签颜色正确
- [ ] 测试：风险等级颜色标识正确

#### 12.2 边界情况测试
- [ ] 测试：消息列表为空，按钮置灰
- [ ] 测试：API Key 未配置，错误提示
- [ ] 测试：网络错误，错误 Alert 和重新分析按钮
- [ ] 测试：AI 返回格式错误，Zod 验证失败提示
- [ ] 测试：短对话（< 5 条），显示"分析仅供参考"备注
- [ ] 测试：仅包含自己消息，Toast 提示
- [ ] 测试：对方最后一句话为空，正确处理
- [ ] 测试：建议数量不足，正常展示

#### 12.3 性能测试
- [ ] 测试：分析 50 条消息，30 秒内返回结果
- [ ] 测试：并发控制，重复点击只发送一个请求
- [ ] 测试：Token 消耗在预期范围（1000-2000 tokens）

#### 12.4 集成测试
- [ ] 测试：完整流程（上传截图 → OCR → 解析对话 → AI 分析 → 展示结果）
- [ ] 测试：响应式布局（移动端和桌面端）
- [ ] 测试：多次分析，状态正确更新

---

### Step 13: 代码质量
- [ ] 所有注释使用中文
- [ ] 无 TypeScript `any` 类型
- [ ] 无 `console.log` 调试代码（可保留 `console.error`）
- [ ] 通过 ESLint 检查
- [ ] 组件 Props 类型单独定义为 interface
- [ ] Route Handler 完整错误处理
- [ ] 前端服务层完整类型标注

---

### Step 14: 文档更新
- [ ] 更新测试报告，记录 ChatGPT 和 Gemini 测试结果
- [ ] 记录 Prompt 优化过程（如有）
- [ ] 记录已知问题和限制
- [ ] 更新 README（如有项目 README）

---

### Bug 修复：replyStrategy 分析对象错误 📝 (2026-03-06)

**问题根源**：`app/api/analyze/route.ts` 中的 `SYSTEM_PROMPT` 只描述了"对方最后一句话"，但未说明如何处理对话末尾是"自己"消息的情况。AI 可能直接取整个对话的最后一条消息，若最后几条都是"自己"发的，则 `context` 和 `strategy` 的分析对象错误。

**修复方案：服务端预处理 + 明确写入 User Prompt**

不依赖 AI 自行判断，在 Route Handler 中主动找到正确的消息，再通过 User Prompt 明确传给 AI。

#### 修复 1：Route Handler 中添加预处理（`app/api/analyze/route.ts`）

- [x] 在格式化消息之前，添加查找"对方最后一条消息"的逻辑
  ```typescript
  // 从末尾向前遍历，找到第一条对方发送且内容非空的消息
  const lastOtherMessage = [...messages]
    .reverse()
    .find(msg => msg.speaker === 'other' && msg.content.trim().length > 0);
  ```
- [x] 处理边界情况：`lastOtherMessage` 为 `undefined` 时，设置默认文本"(对方未发送有效消息)"
- [x] 将 `lastOtherMessage.content` 传入 User Prompt 构建函数

#### 修复 2：修改 User Prompt 模板（同文件 `callChatGPT` 和 `callGemini`）

- [x] 在 User Prompt 中明确标注对方最后一句话：
  ```
  请分析以下聊天记录:

  [对话文本]

  ⚠️ 重要提示：对方最后一句话是：
  「[lastOtherMessage.content]」
  （这是对方发送的最后一条消息，对话末尾可能还有"自己"发出的消息，请忽略那些）

  请严格按照 JSON Schema 返回分析结果。
  其中 replyStrategy.context 请直接使用上方标注的「对方最后一句话」内容。
  ```
- [x] `callChatGPT` 和 `callGemini` 两处 User Prompt 均需同步更新

#### 修复 3：修改 SYSTEM_PROMPT（同文件第 8 行起）

- [x] 在 `replyStrategy` 的说明中补充：
  ```
  "replyStrategy": {
    "context": "必须使用 User Prompt 中明确标注的「对方最后一句话」，不是对话末尾的最后一条消息",
    ...
  }
  ```

#### 修复后回归测试

- [ ] 测试：对话末尾是"自己"发的消息时，`context` 正确取对方最后一句话
- [ ] 测试：对话末尾连续 3 条都是"自己"发的，`context` 依然正确
- [ ] 测试：对方最后一句话就在末尾（正常情况），`context` 不受影响
- [ ] 测试：所有对方消息均为空时，`context` 返回默认文本
- [ ] 测试：ChatGPT 和 Gemini 两个 provider 都能正确处理

---

## 实施顺序

**必须按照以下顺序执行**：

1. ✅ **Step 1（测试脚本开发）** - 验证 AI 功能可行性
2. ✅ **Step 2-4（类型、依赖、工具）** - 基础设施
3. ✅ **Step 5（Route Handler）** - 后端核心逻辑
4. ✅ **Step 6-7（服务层和组件）** - 前端实现
5. ✅ **Step 8（集成）** - 功能整合
6. ⚪ **Step 9（Zustand）** - 可选优化
7. ✅ **Step 10-13（测试和质量）** - 验收

**关键检查点**：
- Step 1 完成前，不开始 Step 2-8
- 测试脚本验证通过后，才能确认 Prompt 设计合理
- Route Handler 实现后，先进行单元测试再集成到前端

