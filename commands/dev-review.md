---
allowed-tools: Read, Grep, Glob, Bash
argument-hint: [默认当前工作区 git diff | 文件路径 | PR说明]
description: 审查 BYDFi React + TSX 改动，覆盖 hooks、类型、i18n、theme、SSR/SSG、性能和验证
author: Nilu
---

# BYDFi React/TSX 代码审查

请按 `.claude/skills/dev/nextjs-review/SKILL.md` 的流程执行。

## 参数规则

- 如果 `$ARGUMENTS` 为空，默认审查当前工作区 `git diff`。
- 如果 `$ARGUMENTS` 不为空，将 `$ARGUMENTS` 作为审查范围输入，可为文件路径、diff 描述或 PR 说明。

## 审查重点

- React hooks 与渲染正确性；新增或修改 hook 是否已查 `packages/apps-kit/core/hooks`，是否误把 app-local `@/hooks` 当共享 hooks，是否重复实现 core hook 已覆盖能力。
- TypeScript 类型安全。
- `LANG` 与硬编码文案。
- CSS 变量与硬编码颜色。
- SSR/SSG/client-only 边界。
- 金融计算是否避免原生浮点运算，并使用项目 `Number` / `String` prototype 链式方法或 `BN` / `bignumber.js`。
- DOM 元素 style 对象禁止含有 padding,margin 等和 RTL 有关的属性，否则无法正确处理 RTL
- tsc/lint/UI 验证覆盖。
- 响应式需要 使用 `@media ${MediaInfo.tablet}` | `@media ${MediaInfo.mobile}` 等样式断点，不要使用 `@media (max-width: 768px)` 等样式断点。
- 禁止出现没有被使用到的样式,例如 DOM 不存在该 className，但 css 中存在该样式，并且该样式不是`:global(.className)` 的样式。
- 禁止出现没有被使用到的变量，组件，types，props，constants 等
