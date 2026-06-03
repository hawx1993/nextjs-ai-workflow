---
allowed-tools: Skill
argument-hint: ssg|ssr|core|components
description: 审计 apps-kit 模块在各应用中的共享情况并生成报告
---

# 审计 apps-kit 模块在各应用中的共享情况并生成报告

请使用 Skill 工具调用 `.claude/skills/audit/shared/apps-kit/SKILL.md`，并将 `$ARGUMENTS` 原样作为参数传入。

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
- 按 `$ARGUMENTS` scope 通过静态 import 扫描量化 `packages/apps-kit` 的共享情况。
- 按 `$ARGUMENTS` scope 覆盖 components、core、core/store 模块在 SSG / SSR 等应用中的引用分布。
- 报告必须包含 git 分支、commit、工作树状态、关键发现、sanity check 与完整数据表。
- 所有统计以 skill 脚本输出为唯一信息源，禁止人工调整数字。
