---
allowed-tools: Skill
argument-hint: ssg|ssr|core|components
description: 扫描 JS/JSX 文件并生成可 TypeScript 化候选清单
---

# 扫描 JS/JSX 文件并生成可 TypeScript 化候选清单

请使用 Skill 工具调用 `.claude/skills/audit/ts-candidates/SKILL.md`，并将 `$ARGUMENTS` 原样作为参数传入。

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
- 按 `$ARGUMENTS` scope 扫描 `.js` / `.jsx` / `.mjs` / `.cjs` 源文件，排除构建产物、静态资源、reports 等目录。
- 按 skill 固化规则输出建议转、不应转、灰色地带三类候选。
- 主统计需通过 skill 的 sanity check，保证同一仓库快照结果稳定。
- 报告输出到 `reports/YYYY-MM-DD/`。
