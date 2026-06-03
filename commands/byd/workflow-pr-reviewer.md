---
allowed-tools: Skill
argument-hint: <PR号，必填，例如: 42>
description: 使用项目专属技能规则自动审查 GitHub Pull Request
---

# GitHub PR 审查器

请使用 Skill 工具调用 `.claude/skills/workflow/pr-reviewer/SKILL.md`，并将 `$ARGUMENTS` 原样作为参数传入。

## 参数

- `$ARGUMENTS` 必须包含 PR 编号，例如 `3209`。
- 如果 `$ARGUMENTS` 为空，先询问用户要审查的 PR 编号。
- 如果用户提供 GitHub PR URL，从 URL 中提取 PR 编号后继续执行。

## 执行要求

- 必须加载并遵循对应 skill 的完整规则。
- 必须确认 GitHub 认证、目标仓库和 PR 编号可用。
- 必须获取 PR 元数据、变更文件 diff 和完整文件上下文。
- 必须基于项目技能规则审查变更行，不评论无关未变更代码。
- 默认跳过删除文件和测试文件，除非用户明确要求审查测试文件。
- 默认向 GitHub 发布行内评论和整体汇总评论。
- 如果行内评论 position 计算失败，按 skill 规则回退为 PR 级别评论。
- 完成后必须向用户汇报审查文件数、评论数、问题等级统计、应用技能和 PR 链接。
