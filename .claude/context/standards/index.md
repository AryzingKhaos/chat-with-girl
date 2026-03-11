# standards/ 目录索引

> 编码规范与开发标准文档。编写或修改任何代码前必须查阅 `coding-standards.md`。

## 文件列表

| 文件 | 内容 | 关键主题 |
|------|------|---------|
| [coding-standards.md](coding-standards.md) | ⚠️ 强制性编码规范 | TypeScript 规范、命名规范、错误处理、安全规范、Git 提交格式 |
| [code-style.md](code-style.md) | 代码风格规范 | TypeScript 类型示例、错误处理模式、注释语言规范 |
| [git-workflow.md](git-workflow.md) | Git 工作流 | 分支命名规范、提交格式（type(scope): subject）、工作流程 |
| [common-mistakes.md](common-mistakes.md) | AI 常见错误记录 | 已知错误模式、正确做法、避免重复犯错 |

## 快速查阅指引

| 场景 | 查阅文件 |
|------|---------|
| 开始编写任何代码 | `coding-standards.md`（必读） |
| 代码风格 / TypeScript 类型写法 | `code-style.md` |
| 提交代码 / 创建分支 | `git-workflow.md` |
| 编码前排查常见错误 | `common-mistakes.md` |

## 强制性规范摘要

- **代码注释**：英文
- **`.claude/` 文档**：中文
- **禁止 `any` 类型**：使用明确 interface / type
- **错误必须处理**：try-catch + log + 用户提示
- **提交格式**：`type(scope): subject`（英文）
