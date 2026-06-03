---
allowed-tools: Skill
argument-hint: ssg|ssr|core|components
description: 扫描依赖版本不一致问题并生成报告
---

# 扫描依赖版本不一致问题并生成报告

请使用 Skill 工具调用 `.claude/skills/audit/pkg-version/SKILL.md`，并将 `$ARGUMENTS` 原样作为参数传入。

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
- 按 `$ARGUMENTS` scope 扫描对应范围内 package.json 的 dependencies、devDependencies、peerDependencies。
- 找出同一依赖在不同位置声明多个版本的情况。
- 按 skill 规则排除构建目录、输出目录和内部 workspace 协议干扰。
- 报告输出到 `reports/YYYY-MM-DD/byd-audit-pkg-version-YYYY-MM-DD.md`。
