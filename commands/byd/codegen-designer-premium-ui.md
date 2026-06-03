---
allowed-tools: Read, Write, Edit, Grep, Glob, Bash, Agent, AskUserQuestion, Skill
argument-hint: <file-path> [需求说明]
description: 生成高端、精致、非模板化的 BYDFi Soft UI 页面和组件代码
author: Nilu
---

# BYDFi Soft UI 高端视觉代码生成

请使用 Skill 工具调用 `.claude/skills/designer/premium-ui/SKILL.md`，并将 `$ARGUMENTS` 原样作为参数传入。
同时请按 `.claude/skills/dev/nextjs-dev/SKILL.md` 的“实现”流程执行，并将 `$ARGUMENTS` 按 `<file-path> [需求说明]` 解析为目标文件与需求说明。

## 参数

- `[file-path]`：要生成或更新的代码文件路径，例如 `apps/byd-ssg/src/components/example-card/index.tsx`。
- `$ARGUMENTS` 必须包含 `[file-path]`，也可追加需求说明。
- 如果目标文件路径不明确，先询问用户确认。

## 执行要求

- 必须加载并严格遵守对应 premium-ui skill。
- 必须同步遵守 `.claude/skills/dev/nextjs-dev/SKILL.md` 的 Next.js + React + TSX 实现流程：明确范围、读取规则、必要时先规划、实现、验证与按格式汇报。
- 适用于无设计稿时生成或调整高端 Soft UI 页面、组件、样式与动效。
- 生成代码前先确认目标应用和文件位置；涉及多文件实现或复杂需求时，先按 nextjs-dev 流程输出简要方案。
- 必须遵守 BYDFi 项目规则：Next.js、React/TSX、TypeScript、i18n、theme、verification。
- 所有用户可见文案必须使用 `LANG` 包裹，除品牌专有名词外不得硬编码。
- 样式颜色必须使用项目已定义 CSS 变量，禁止硬编码颜色值。
- 使用 styled-jsx / SCSS 等项目既有样式方案，禁止引入 Tailwind、Bootstrap、CSS Modules、Emotion 等非项目约定方案。
- 动效必须优先使用 `transform` 与 `opacity`，避免动画化 `top`、`left`、`width`、`height`。
- 必须考虑深色 / 浅色、黄色 / 蓝色 skin、RTL 和 PC / Tablet / Mobile 响应式。
- 若目标为 SSR 项目（如 `apps/byd-ssr`、`bydfi-ssr` 或 SSR 页面/组件），必须先读取并遵守 `.claude/skills/codegen/ssr-generate/SKILL.md`。
- 若目标为 SSG 项目（如 `apps/byd-ssg`、`bydfi-ssg` 或 SSG 页面/组件），必须先读取并遵守 `.claude/skills/codegen/ssg-generate/SKILL.md`。
- 完成后必须给出验证结果或未验证原因。
