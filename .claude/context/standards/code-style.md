# 代码风格规范

## 基本原则

- TypeScript 严格模式
- ESLint + Prettier 统一代码风格
- 函数职责单一，避免过度设计
- 错误处理统一使用 try-catch + 日志记录
- 避免阻塞主线程（链上查询使用异步）
- **代码注释**：使用英文（国际化和专业性）
- **文档语言**：`.claude/` 目录下的文档使用中文（便于团队维护）

## TypeScript 类型规范

```typescript
// ✅ 正确：明确类型
interface UserData {
  id: string;
  name: string;
  balance: number;
}

function processUser(user: UserData): string {
  return `${user.name}: ${user.balance}`;
}

// ❌ 错误：使用 any
function processUser(user: any): any {
  return user.name + ': ' + user.balance;
}
```

## 错误处理规范

```typescript
// ✅ 正确：完整的错误处理
async function fetchUserData(userId: string): Promise<UserData | null> {
  try {
    const response = await api.getUser(userId);
    return response.data;
  } catch (error) {
    log.error('Failed to fetch user data:', error);
    Toast.show({
      icon: 'fail',
      content: formatMessage({ id: 'ERROR.FETCH_USER_FAILED' }),
    });
    return null;
  }
}

// ❌ 错误：静默失败
async function fetchUserData(userId: string): Promise<UserData> {
  const response = await api.getUser(userId);
  return response.data; // 异常未处理
}
```
