---
allowed-tools: Skill
argument-hint: '[默认交互流程 | --fast | --no-verify | 提交说明]'
description: 分析暂存变更并创建符合 BYDFi 规范的 Git Commit
author: Nilu
---

# 分析暂存变更并创建符合 BYDFi 规范的 Git Commit

请使用 Skill 工具调用 `byd:workflow-git-commit`，并将 `$ARGUMENTS` 原样作为参数传入。

如果 `$ARGUMENTS` 为空，仍必须调用 `byd:workflow-git-commit`，并按 `.claude/skills/workflow/git/commit-generator/SKILL.md` 的默认 3 步交互流程执行；默认不启用 `--fast` 模式。只有 `$ARGUMENTS` 明确包含 `--fast` 时，才进入快速模式。

## 参数

- 空参数：默认交互流程，必须展示状态、确认暂存范围、展示 diff、生成 message 并逐步确认；不得按 `--fast` 处理。
- `--fast`：快速模式；仍必须禁止在 `main` / `master` 使用，且 commit 前展示 message 等待确认。
- `--no-verify`：仅在用户明确要求时，最终 commit 命令追加 `--no-verify`。
- 其他文本：作为提交意图或补充说明传给 skill。
- 默认不使用 `--fast` 模式。

## 执行要求

- 必须加载并遵循对应 skill 的完整规则。
- 如果 Commit 文件超过 100 个，则使用泛化描述提交内容，而不是逐个文件描述。
- 如果只更新语言文件`public/static/locales`，则无需执行 tsc 或者 es lint 检查；并且使用泛化描述提交内容，而不是逐个文件描述。
- 未经用户确认，不得执行 `git commit`。
- 未经用户明确指令，不得执行 `git push`。
- `Commit message` 必须符合项目 Conventional Commits 与中文 body 规范。
- `Commit message` 的 body 只需要三段：`修改原因`、`处理方案`、`影响范围`；不要生成或要求 `Context`、`Approach`、`Changes`、`Impact`。
- 完成提交后，需要展示完整的 commit message 给用户查看。
- 无论默认模式或 `--fast` 模式，commit 结束后都必须继续提供数字选项给用户：`1. 执行 push 操作`、`2. 取消`。
- 用户选择执行 push 且 push 成功后，必须继续循环询问是否创建 PR，并提供数字选项；如用户选择创建 PR，需要明确询问目标 base 分支，并询问是否使用项目 PR workflow：`.claude/skills/workflow/git/create-pr/SKILL.md`。
- 如果 commit 文件不含有 tsx 文件，则无需执行 tsc 或者 es lint 检查；
- 如果 commit 文件含有 tsx 或者 ts 文件，提交前按项目要求确保 `pnpm tsc:all` 类型检查通过；若用户选择跳过或当前无法运行，需明确说明。
- 判断是否含有 TS/TSX 文件时，不要运行 `git diff --cached --name-only | grep ... | wc -l` 这类会触发额外授权的 Bash 管道命令；直接根据 `git status --short` 或 `git diff --cached --name-only` 输出人工判断。
