# Claude Code 常见错误记录

本文档记录 Claude Code 在代码辅助过程中犯过的错误，用于防止未来再次发生。

---

## 1. TokenType 枚举值错误

**日期**: 2026-02-10

**问题描述**: 在迁移或修改 `TokenType` 枚举时，错误地将 `TRC721` 的值从 `5` 改成了 `3`。

**正确定义**:
```typescript
export enum TokenType {
  TRX = 0,
  TRC10 = 1,
  TRC20 = 2,
  TRC721 = 5,  // ⚠️ 必须是 5，不能是 3
}
```

**为什么这很重要**:
- `TRC721` 是 TRON 区块链的标准代币类型
- 数值 `5` 是协议规范的一部分
- 修改这个值会破坏与区块链交易的兼容性
- 这个值用于智能合约交互，不能随意更改

**影响文件**:
- `src/constants/contract_type.ts:114-119`

**经验教训**:
- ✅ **必须**在处理 `TokenType` 时保留精确的枚举值
- ✅ 对区块链相关的常量要根据 TRON 规范进行验证
- ❌ **绝不**在没有明确确认的情况下修改枚举值

---

## 2. getCurrentActiveTabInfoNotCareWindow 多窗口处理错误

**日期**: 2026-02-10

**问题描述**: 在实现活跃 tab 检查时，`getCurrentActiveTabInfoNotCareWindow()` 函数使用数组解构 `const [activeTab] = ...` 只取了第一个元素，导致多窗口场景下只检查第一个窗口的活跃 tab。

**正确定义**:
```typescript
// ❌ 错误：只返回第一个活跃 tab
export async function getCurrentActiveTabInfoNotCareWindow(): Promise<TabInfoType> {
  const [activeTab] = await browserTabs.query({ active: true });
  // 只处理了第一个元素，忽略了其他窗口的活跃 tab
  return buildTabInfo(activeTab);
}

// ✅ 正确：返回所有窗口的活跃 tab 数组
export async function getCurrentActiveTabInfoNotCareWindow(): Promise<TabInfoType[]> {
  const activeTabs = await browserTabs.query({ active: true });
  // 使用 map 处理所有活跃 tab
  return activeTabs.map((activeTab) => buildTabInfo(activeTab));
}
```

**为什么这很重要**:
- `chrome.tabs.query({ active: true })` 返回的是所有窗口的活跃 tab 数组
- 如果用户打开了多个 Chrome 窗口，每个窗口都有一个活跃 tab
- 只取第一个元素会导致其他窗口的活跃 tab 被误判为非活跃
- 这会导致正常用户的请求被错误拒绝

**影响文件**:
- `src/lib/extension/tab.ts:41` - `getCurrentActiveTabInfoNotCareWindow()` 函数
- `src/domain/request_accounts_manager.ts:779` - `checkIsActiveTab()` 方法

**经验教训**:
- ✅ **必须**正确理解浏览器 API 的返回值类型
- ✅ `chrome.tabs.query({ active: true })` 返回数组，包含所有窗口的活跃 tab
- ✅ 使用 `query({ active: true, currentWindow: true })` 才能只获取当前窗口
- ✅ 在多窗口场景下，需要检查 requestTabId 是否匹配**任意一个**活跃 tab
- ❌ **绝不**假设只有一个活跃 tab，要考虑多窗口场景

---

## 新增错误记录模板

**日期**: YYYY-MM-DD

**问题描述**: 错误的具体描述

**正确做法**: 应该如何正确处理

**为什么这很重要**: 影响和背景说明

**影响文件**: 相关文件列表

**经验教训**: 防止再次发生的关键要点