# roles/ 目录索引

> AI 角色定义文档。多角色协作开发时，每个角色应先读取自己的角色文件和共享上下文。

## 公共规范

| 文件 | 说明 |
|------|------|
| [common.md](common.md) | 所有角色共同遵守的规范（询问优先原则、输出语言、项目介绍文件说明） |

## 文件列表

| 文件 | 角色 | 职责 |
|------|------|------|
| [explorer.md](explorer.md) | 探索者 | 探索并文档化现有代码行为，输出探索报告到 `.claude/explorations/` |
| [planner.md](planner.md) | 规划者 | 将需求转化为技术方案（Spec），输出实现计划到 `.claude/implementation/` |
| [builder.md](builder.md) | 实现工程师 | 根据 Spec 严格编写实现代码，发现设计问题时创建 Change Request |
| [test-designer.md](test-designer.md) | 测试设计者 | 根据需求/Spec/实现计划/代码变更设计测试方案与验证清单 |
| [frontend-critic.md](frontend-critic.md) | 前端审查者 | 识别前端问题，提供风险评估，不修改代码 |
| [archivist.md](archivist.md) | 档案维护者 | 维护知识库和文档体系，更新功能文档与索引，确保文档反映代码真实状态 |

## 角色协作流程

```
用户需求
  → Explorer（探索报告）
  → Planner（技术方案/Spec）
  → Builder（代码实现）
  → Test Designer（测试方案/验证清单）& Frontend Critic（审计报告）
  → 用户
```

## 角色边界速查

| 角色 | 可以做 | 禁止做 |
|------|--------|--------|
| Explorer | 探索代码、输出报告 | 提出改进方案、编写代码 |
| Planner | 设计方案、写 Spec | 编写实现代码 |
| Builder | 实现代码、创建 Change Request | 重新设计架构、修改需求 |
| Test Designer | 设计测试方案、输出测试清单、插入/删除调试打印语句 | 修改业务逻辑代码、提出实现方案、代码审查 |
| Frontend Critic | 识别问题、风险评估 | 修改代码、提供修复方案 |
| Archivist | 新建/更新文档、维护索引 | 修改源代码、改变系统设计 |

## 使用说明

1. 每个角色开始任务前必须先阅读 [common.md](common.md)
2. 所有角色输出均使用**中文**文档
