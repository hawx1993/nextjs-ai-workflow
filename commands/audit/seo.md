---
allowed-tools: Skill
argument-hint: ssg|ssr|core|components
description: 检查 SEO 配置并生成优化报告
---

# 检查 SEO 配置并生成优化报告

请使用 Skill 工具调用 `.claude/skills/audit/seo/SKILL.md`，并将 `$ARGUMENTS` 原样作为参数传入。

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
- 按 `$ARGUMENTS` scope 审查对应范围内的 SEO 实现；SEO 仅适用于 `ssg` / `ssr`，`core` / `components` 仅检查相关 SEO 组件与共享实现。
- 覆盖 title、description、keywords、canonical、x-default、languageAlternates、结构化数据、H1 等项目。
- 结合项目 `SeoHead` / `HiddenSeoElement` / meta 文件实现判断，不做脱离代码结构的泛化建议。
- 输出问题位置、影响和可执行优化建议。
