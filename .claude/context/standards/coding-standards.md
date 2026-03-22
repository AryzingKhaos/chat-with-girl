# 开发规范

> **强制性规范**: 所有代码开发必须严格遵守本文档的规范。详细说明和示例请参考 [project.md](./project.md)。

---

## 1. 语言使用规范 🌍

### 1.1 代码注释（强制英文）
- ✅ **所有代码注释必须使用英文**
- ✅ 包括：函数说明、参数说明、行内注释、TODO、FIXME 等

### 1.2 文档编写（强制中文）
- ✅ **`.claude/` 目录下的所有 `.md` 文档必须使用中文**
- ✅ 包括：项目文档、功能文档、实现计划等

---

## 2. TypeScript 类型规范 📝

### 2.1 强制类型声明
- ✅ **必须明确声明函数参数和返回值类型**
- ❌ **禁止使用 `any` 类型**（使用 `unknown` 或具体类型）
- ⚠️ **最小化 `@ts-ignore` 使用**（必须添加注释说明原因）

### 2.2 类型定义
```typescript
// ✅ Correct
function processData(data: DataType): ResultType { }

// ❌ Wrong
function processData(data: any): any { }
```

---

## 3. 命名规范 🏷️

- **变量/函数**: `camelCase`
- **类/组件**: `PascalCase`
- **常量**: `UPPER_SNAKE_CASE`
- **私有成员**: 前缀 `_`

```typescript
const userName = 'Alice';              // ✅
const MAX_RETRY_COUNT = 3;             // ✅
class UserManager { }                  // ✅
function getUserInfo() { }             // ✅
private _privateMethod() { }           // ✅
```

---

## 4. 错误处理规范 ⚠️

### 4.1 异步错误处理
- ✅ **必须使用 try-catch 处理异步错误**
- ✅ **必须记录错误日志**（`log.error()` 或 `console.error()`）
- ✅ **必须给用户友好的错误提示**
- ❌ **禁止静默失败**

```typescript
// ✅ Required pattern
try {
  await riskyOperation();
} catch (error) {
  log.error('Operation failed:', error);
  Toast.show({ icon: 'fail', content: 'Error message' });
}
```

---

## 5. 安全规范 🔒

### 5.1 私钥安全
- 🔒 **私钥必须使用 `browser-passworder` 加密存储**
- 🔒 **禁止在日志中输出私钥、助记词、密码**
- 🔒 **敏感数据仅存储在 `chrome.storage.local`**

### 5.2 XSS 防护
- ✅ **用户输入必须使用 `dompurify` 清理**
- ❌ **禁止使用 `eval()` 和 `Function()`**

### 5.3 交易安全
- ✅ **交易签名必须用户手动确认**
- ✅ **必须展示完整交易详情**

### 5.4 迁移代码安全
- **涉及到代码迁移的，代码只要有一个字符不一样，都要注释说明这里不一样！！**

---

## 6. Chrome 插件规范 🔌

### 6.1 MV3 要求
- ✅ **Service Worker 无 DOM 访问**（使用 Offscreen Document）
- ❌ **禁止 `eval()` 和动态代码执行**
- ✅ **处理 Service Worker 休眠**（使用 `chrome.alarms`）

### 6.2 消息通信规范
**每个 Service 必须包含两部分**：

```typescript
// Popup 端调用
export const call*Service = async (msgNode: MessageNode, params: Params) => {
  return await msgNode.send(new DuplexMessage(ACTION_NAME, params));
};

// Background 端注册
export const register*Service = (messageHub: MessageHub) => {
  messageHub.registerSourceActionName('popup', ACTION_NAME);
  messageHub.on(ACTION_NAME, async (data, meta) => {
    try {
      const result = await processLogic(data);
      meta.resolve(result);
    } catch (error) {
      log.error('Service failed:', error);
      meta.reject(error);
    }
  });
};
```

- ✅ **新 Service 必须在 `src/service/index.ts` 的 `registerAll` 中注册**

### 6.3 Redux 状态管理规范

**读取状态（Popup 层）**：
- ✅ **使用 `useAppSelector` 读取 Redux 状态**（定义于 `src/store/hooks.ts`）
- ❌ **禁止直接使用 `useSelector`**（无类型检查，无深度比较）
- ✅ **必须配合 selector 函数使用**，不得直接在组件内写 `state => state.xxx`

```typescript
// ✅ Correct
import { useAppSelector } from '../../../store/hooks';
import { selectCurrency } from '../../../store/slices/settings';

const currency = useAppSelector(selectCurrency);

// ❌ Wrong
import { useSelector } from 'react-redux';
const currency = useSelector(state => state.settings.currency);
```

**Selector 命名约定**（定义于各 slice 文件）：
- `select*`：简单取值，直接返回 state 中的字段
- `get*`：计算型，依赖多个字段或有派生逻辑

```typescript
// select* - 简单取值
export const selectCurrency = (state: RootState) => state.settings.currency;

// get* - 有计算逻辑
export const getNodeList = (state: RootState) => ({
  ...TRON_NODES,
  ...state.nodeManagement.nodeList,
});
```

**`useAppSelector` 特性**（相比 `useSelector`）：
- 基于 `TypedUseSelectorHook<RootState>`，自动类型推导
- 使用 `_.isEqual` 深度比较，避免对象引用变化导致的不必要重渲染

**写入状态（全局）**：
- 🔒 **禁止在 Popup/Content Script 中直接 dispatch Redux action**
- ✅ **所有 Redux 状态更新必须通过 Background Service 执行**
- ✅ **使用 Service 模式：Popup 调用 `call*Service()` → Background 执行 `dispatch()`**

**原因**: 架构要求全局状态必须在 Background 维护，确保状态一致性。

---

## 7. AI 辅助开发规范 🤖

**AI 生成的代码必须人工审查**

---

**详细说明、代码示例、最佳实践请参考**: [project.md](./project.md) 第 7、10、11、13 节
