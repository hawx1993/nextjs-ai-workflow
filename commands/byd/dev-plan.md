---
allowed-tools: Read, Grep, Glob
argument-hint: <需求描述>
description: 规划 BYDFi Next.js + React + TSX 需求实现方案，不直接修改代码
author: Nilu
---

# BYDFi Next.js 需求规划

请按 `.claude/skills/dev/nextjs-dev/SKILL.md` 的“规划”流程执行，并将 `$ARGUMENTS` 作为原始需求输入。

# 查找可复用的能力

请按 `.claude/knowledge/discovery-core.md` 的“查找可复用的能力”流程执行。

包括:

- api
- utils
- hooks
- store
- shared
- formulas
- events
- styles
- workers
- i18n

找到后，列出可被复用的方法，接口等，如果没有的话，说明没有可复用的能力，需要新增。

## 目标

在改代码前完成：

- 需求复述
- 影响范围
- 关键文件
- 需要读取的 rules
- 实施步骤
- 验证策略
- 风险与不做事项

## 要求

- 不直接修改代码。
- 只规划 Next.js + React + TSX 相关实现。
- 如需求涉及非前端或新增依赖，先标记为超出默认范围并询问用户。
