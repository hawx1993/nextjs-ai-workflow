---
allowed-tools: Skill
argument-hint: <file-path> [需求说明]
description: 无需设计稿生成符合 BYDFi Nex 设计系统的页面和组件代码
author: Nilu
---

# 无需设计稿生成符合 BYDFi Nex 设计系统的页面和组件代码

请使用 Skill 工具调用 `.claude/skills/codegen/design-system/SKILL.md`，并将 `$ARGUMENTS` 原样作为参数传入。

## 参数

- `[file-path]`：要生成或更新的代码文件路径，例如 `apps/byd-ssg/src/components/example-card/index.tsx`。
- `$ARGUMENTS` 必须包含 `[file-path]`，也可追加需求说明。
- 如果目标文件路径不明确，先询问用户确认。

## 执行要求

- 必须加载并严格遵守对应 skill。
- 适用于无设计稿时生成或调整页面、组件、样式与主题适配。
- 所有样式必须使用 BYDFi Nex 设计系统中定义的 CSS 变量，禁止硬编码颜色、字号、行高、字重。
- 使用 styled-jsx，禁止 Tailwind、Bootstrap、CSS Modules、Emotion 等非项目约定方案。
- 所有用户可见文案必须使用 `LANG` 包裹，除品牌专有名词外不得硬编码。
- 生成代码前先确认目标应用和文件位置；涉及多文件实现时先给出简要方案。
