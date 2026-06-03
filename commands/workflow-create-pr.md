---
allowed-tools: Skill
argument-hint: '[base-branch]'
description: 分析分支变更并创建符合 BYDFi 规范的 Pull Request
---

# 分析分支变更并创建符合 BYDFi 规范的 Pull Request

请使用 Skill 工具调用 `skills/workflow/git/create-pr/SKILL.md`，并将 `$ARGUMENTS` 原样作为参数传入。

## 参数

- `$ARGUMENTS` 可传 base 分支；为空时默认按 skill 流程先展示当前分支与 `main` 的关系，再让用户确认。

## 执行要求

- 必须加载并遵循对应 skill 的完整规则。
- 必须逐步确认：base 分支、变更范围、push 状态、commit 规范、PR 标题和正文。
- 未经用户明确确认，不得执行 `git push`。
- 未经用户明确确认，不得执行 `gh pr create`。
- PR 创建或更新成功后，必须获取 GitHub Pull Request 链接，并按 skill 规则通过 Lark webhook 推送该 PR 链接。
- PR 内容需符合 BYDFi 规范，说明修改原因、处理方案、影响范围和验证结果。
