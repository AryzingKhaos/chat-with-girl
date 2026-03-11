# Git 工作流

## 分支管理

- **主分支**：`master`（生产版本）
- **开发分支**：`feature/*`、`fix/*`

## 分支命名规范

| 类型 | 命名格式 | 示例 |
|------|---------|------|
| 新功能 | `feature/{version}-{feature-name}` | `feature/4.8.0-gasfree` |
| Bug 修复 | `fix/{issue-id}-{description}` | `fix/123-login-crash` |
| 重构 | `refactor/{module-name}` | `refactor/message-hub` |
| 文档 | `docs/{topic}` | `docs/api-guide` |

## 提交规范

格式：`type(scope): subject`（英文）

| type | 含义 |
|------|------|
| `feat` | 新功能 |
| `fix` | Bug 修复 |
| `refactor` | 重构 |
| `docs` | 文档 |
| `test` | 测试 |
| `chore` | 构建/工具变动 |

## 工作流程

1. 从 `master` 创建功能分支
2. 在功能分支上开发和测试
3. 提交前运行 `pnpm lint` 检查
4. 提交信息符合规范（英文，`type(scope): subject`）
5. 推送到远程仓库
6. 创建 Pull Request 进行 Code Review
7. 合并到 `master` 分支
