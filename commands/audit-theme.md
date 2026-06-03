---
allowed-tools: Skill
argument-hint: ssg|ssr|core|components
description: 审查主题合规性、硬编码颜色和 RTL 兼容并生成报告
---

# 审查主题合规性、硬编码颜色和 RTL 兼容并生成报告

请使用 Skill 工具调用 `.claude/skills/audit/theme/SKILL.md`，并将 `$ARGUMENTS` 原样作为参数传入。

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
- 按 `$ARGUMENTS` scope 脚本化扫描硬编码颜色、CSS 变量使用等主题合规问题。
- 半脚本化审查 RTL、深浅模式、多皮肤覆盖与未使用变量风险。
- 必须遵守项目主题规则：颜色使用 `--spec-*` / `--skin-*` 或已定义设计 token，禁止硬编码颜色。
- 输出整改报告，区分可自动定位项与需人工复核项。
