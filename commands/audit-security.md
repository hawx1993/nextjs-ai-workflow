---
allowed-tools: Skill
argument-hint: ssg|ssr|core|components
description: 执行 BYDFi 深度安全审查并生成安全报告
---

# 执行 BYDFi 深度安全审查并生成安全报告

请使用 Skill 工具调用 `.claude/skills/audit/security/deep-security/SKILL.md`，并将 `$ARGUMENTS` 原样作为参数传入。

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
- 按 `$ARGUMENTS` scope 扫描凭据泄露、XSS、postMessage、CSP/安全头、依赖风险等安全维度。
- 只输出 100% 确认结论；事实和影响都确认前，不得写成确定漏洞。
- 对可利用性、影响范围和误判防护清单需按 skill 规则说明。
- 只接受参数章节定义的 scope；如需其他范围，先向用户确认。
