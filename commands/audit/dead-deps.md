---
allowed-tools: Skill
argument-hint: ssg|ssr|core|components
description: 扫描未使用依赖并生成死依赖审查报告
---

# 扫描未使用依赖并生成死依赖审查报告

请使用 Skill 工具调用 `.claude/skills/audit/dead-deps/SKILL.md`，并将 `$ARGUMENTS` 原样作为参数传入。

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
- 初筛所有 dependencies / devDependencies 后，对疑似死依赖做精确二次验证。
- peerDependency 关系、入口文件和动态引用需按 skill 规则单独核验。
- 仅把 100% 确认的依赖列为可清理，其余归入需构建验证或人工确认。
