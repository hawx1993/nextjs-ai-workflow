---
allowed-tools: Skill
argument-hint: ssg|ssr|core|components
description: 扫描冗余文件、死函数、死类型和死 enum 成员并生成报告
---

# 扫描冗余文件、死函数、死类型和死 enum 成员并生成报告

请使用 Skill 工具调用 `.claude/skills/audit/dead-code/SKILL.md`，并将 `$ARGUMENTS` 原样作为参数传入。

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
- 按 `$ARGUMENTS` scope 扫描对应目录中的冗余文件、死函数、死类型、死 enum 成员。
- 对疑似结果必须按 skill 要求做全仓库引用验证，避免仅凭单次 grep 下结论。
- 排除 Next.js 约定文件、脚本入口、生成文件、测试/构建产物等 skill 中定义的例外。
- 输出带置信度和清理建议的 Markdown 报告。
