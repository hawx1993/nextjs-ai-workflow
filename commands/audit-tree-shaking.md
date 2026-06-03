---
allowed-tools: Skill
argument-hint: ssg|ssr|core|components
description: 扫描并修复影响 Tree Shaking 的 import 违规问题
---

# 扫描并修复影响 Tree Shaking 的 import 违规问题

请使用 Skill 工具调用 `.claude/skills/audit/tree-shaking/SKILL.md`，并将 `$ARGUMENTS` 原样作为参数传入。

## 参数

`$ARGUMENTS` 作为审查 scope，限定扫描范围：

| 参数         | 范围                           |
| ------------ | ------------------------------ |
| 空           | 全量默认范围                   |
| `ssg`        | `apps/byd-ssg`                 |
| `ssr`        | `apps/byd-ssr`                 |
| `core`       | `packages/apps-kit/core`       |
| `components` | `packages/apps-kit/components` |

传入其他值时必须停止执行并提示仅支持 `ssg` / `ssr` / `core` / `components`。

## 执行要求

- 必须加载并遵循对应 skill 的完整规则。
- 按 `$ARGUMENTS` scope 诊断第三方库整体导入、内部库根路径导入、未使用 import 等问题。
- 对可安全修复的 import 按项目规范改为按需导入；涉及行为不确定或大范围修改时先向用户确认。
- 修复后按项目要求运行相应 TypeScript / lint 校验；若跳过需说明原因。
- 输出扫描结果、修改清单和验证结果。
