---
allowed-tools: Skill
argument-hint: ssg|ssr|core|components
description: 审计 i18n 语言常量、翻译覆盖和硬编码文案并生成报告
---

# 审计 i18n 语言常量、翻译覆盖和硬编码文案并生成报告

请使用 Skill 工具调用 `.claude/skills/audit/i18n/SKILL.md`，并将 `$ARGUMENTS` 原样作为参数传入。

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
- 按 `$ARGUMENTS` scope 检查语言常量同步、翻译覆盖率、未使用 key、缺失 LANG key 与 UI 硬编码文案。
- 硬编码中文扫描必须遵循 skill 的 AST 方案，禁止只用 `rg` / `grep` 下结论。
- LANG key 匹配需保留原始空格和符号，避免 trim、引号、撇号导致假缺失。
- 输出报告时区分真实问题、噪音过滤、需人工复核项。
