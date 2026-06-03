---
allowed-tools: Skill
argument-hint: ssg|ssr|core|components
description: 扫描 TypeScript 显式 any 用法并生成清理建议报告
---

# 扫描 TypeScript 显式 any 用法并生成清理建议报告

请使用 Skill 工具调用 `.claude/skills/audit/ts-any-cleanup/SKILL.md`，并将 `$ARGUMENTS` 原样作为参数传入。

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
- 按 `$ARGUMENTS` scope 扫描对应目录下 `.ts` / `.tsx` 中的显式 `any`。
- 按 skill 固化的 7 类机械模式分类：catch、useState、useRef、Promise、Record、`as any`、`any[]`。
- 报告数字必须来自 skill 脚本输出和 cross-check，禁止手工改表。
- 输出到 skill 规定的 `reports/YYYY-MM-DD/` 路径。
