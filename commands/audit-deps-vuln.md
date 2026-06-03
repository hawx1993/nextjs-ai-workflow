---
allowed-tools: Skill
argument-hint: ssg|ssr|core|components
description: 扫描依赖安全漏洞并生成漏洞报告
---

# 扫描依赖安全漏洞并生成漏洞报告

请使用 Skill 工具调用 `.claude/skills/audit/security/deps-vuln/SKILL.md`，并将 `$ARGUMENTS` 原样作为参数传入。

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
- 按 `$ARGUMENTS` scope 使用 skill 固化脚本解析依赖漏洞结果。
- 审计 registry 需按 skill 规则使用 npm 官方 registry，避免镜像源不支持 audit。
- 按 critical / high / moderate / low 排序输出漏洞、影响路径、依赖类型和修复建议。
- 漏洞数据来自 npm registry，属于随时间变化的半 deterministic 结果，报告中需如实说明。
