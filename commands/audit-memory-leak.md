---
allowed-tools: Skill
argument-hint: ssg|ssr|core|components
description: 扫描客户端和服务端内存泄漏风险并生成报告
---

# 扫描客户端和服务端内存泄漏风险并生成报告

请使用 Skill 工具调用 `.claude/skills/audit/memory-leak/SKILL.md`，并将 `$ARGUMENTS` 原样作为参数传入。

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
- 按 `$ARGUMENTS` scope 覆盖事件监听、EventEmitter、全局缓存、定时器、Observer、WebSocket 等泄漏模式。
- 每个风险点需源码验证 add/remove、on/off、创建/销毁是否成对。
- 输出风险等级、位置、泄漏路径和修复建议。
