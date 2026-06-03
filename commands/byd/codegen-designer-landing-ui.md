---
allowed-tools: Read, Write, Edit, Grep, Glob, Bash, Agent, AskUserQuestion, Skill
argument-hint: <file-path> [页面类型/品牌/受众/氛围/需求说明]
description: 按 landing-ui 反粗糙设计 Skill 生成或改造 BYDFi 落地页、作品集与营销页 UI，先做设计解读与审美约束，再实现高级、非模板化的 Next.js + React + TSX 代码。
author: Nilu
---

# BYDFi Designer Landing UI 代码生成

请使用 Skill 工具调用 `.claude/skills/designer/landing-ui/SKILL.md`，并将 `$ARGUMENTS` 原样作为参数传入。
同时请按 `.claude/skills/dev/nextjs-dev/SKILL.md` 的“实现”流程执行，并将 `$ARGUMENTS` 按 `<file-path> [页面类型/品牌/受众/氛围/需求说明]` 解析为目标文件与需求说明。

## 适用范围

- 适用于：落地页、营销页、品牌页、作品集、官网改版、活动页、产品介绍页等视觉表达优先的页面或组件。
- 不适用于：仪表盘、管理后台、数据表格、多步骤表单、代码编辑器、实时协作产品 UI；如果需求落在这些范围外，先说明不适用，并建议改用更合适的 BYDFi dev / design-system 流程。
- 可用于从零生成，也可用于改版；改版时必须先判断是 `Greenfield`、`Redesign - Preserve` 还是 `Redesign - Overhaul`。

## 参数

- `<file-path>`：要生成或更新的代码文件路径，例如 `apps/byd-ssg/src/components/example-landing/index.tsx`。
- `[页面类型/品牌/受众/氛围/需求说明]`：可选但推荐提供，例如：`B2B SaaS 落地页，面向机构用户，冷静可信，高级科技感`。
- `$ARGUMENTS` 必须包含 `<file-path>`；如果目标文件路径不明确，先询问用户确认。
- 如果页面类型、受众或改版边界会显著影响设计方向，只问一个最关键的澄清问题；能从上下文判断时不要反复提问。

## 执行流程

1. **加载并遵守 landing-ui skill**

   - 必须严格遵守 `.claude/skills/designer/landing-ui/SKILL.md`。
   - 在写代码前先输出一行设计解读：`我将其理解为：面向 <受众> 的 <页面类型>，采用 <氛围> 语言，倾向于 <设计系统或审美家族>。`
   - 明确 `DESIGN_VARIANCE`、`MOTION_INTENSITY`、`VISUAL_DENSITY` 三个旋钮值，并说明依据。

2. **遵守 BYDFi Next.js 实现流程**

   - 同步遵守 `.claude/skills/dev/nextjs-dev/SKILL.md` 的实现流程：明确范围、读取规则、必要时先规划、实现、验证与按格式汇报。
   - 必须遵守 BYDFi 项目规则：Next.js、React/TSX、TypeScript、monorepo、i18n、theme、verification。
   - 生成代码前确认目标 app、目标文件位置、复用边界和 alias 解析风险；复杂或多文件需求先输出简要方案。

3. **设计系统与依赖纪律**

   - 优先复用项目现有组件、样式变量和封装能力，不擅自新增依赖。
   - 如果 skill 中建议的第三方设计系统、动画库或图标库在当前项目未安装，必须先检查 `package.json`，并向用户说明需要安装，未经确认不得修改依赖。
   - 本仓库样式颜色必须使用 `--spec-*` / `--skin-*` /`--nex-*` 等既有 CSS 变量，不得硬编码色值。
   - 用户可见文案必须使用 `LANG`，除品牌名、交易对等专有名词外不得硬编码。

4. **反粗糙设计要求**

   - 不要套用默认 AI 视觉：紫色渐变、居中深色网格 Hero、三等宽功能卡、泛用玻璃拟态、无意义发光、Jane Doe / Acme 等占位痕迹。
   - Hero 必须适配首屏：标题最多 2 行，副文本克制，CTA 无需滚动可见，桌面导航单行且高度不超过 80px。
   - 页面保持一个主题家族、一个强调色、一个圆角系统；避免 section 间随机反色或风格跳变。
   - 视觉页面必须有真实视觉资产策略：优先使用可用图片/项目资产/明确占位槽，禁止 div 假截图和无意义手写装饰 SVG。
   - 动效必须有动机，尊重 `prefers-reduced-motion`；禁止用 `window.addEventListener('scroll')` + React state 做滚动动画。
   - 页面可见文案中禁止 em-dash `—` 和 en-dash `–`，使用普通 hyphen `-` 或重写句子。

5. **改版协议**
   - 改版前必须审计现状：品牌 token、信息架构、内容块、关键转化路径、需要保留和淘汰的模式。
   - 未经用户明确批准，不得静默修改 URL 结构、主导航标签、表单字段、品牌 logo、legal / consent / cookie 文案或 analytics 依赖字段。
   - 优先通过排版、间距、色彩校准、动效层和关键 section 重组提升质感，不要为了“高级感”破坏已有业务逻辑。

## 最终交付前检查

完成代码前必须至少检查并在汇报中体现：

- 是否已声明设计解读与三个旋钮值。
- 是否符合 landing-ui 的最终交付前检查中与当前需求相关的硬规则。
- 是否无 AI 设计痕迹：无泛用三卡片、无默认 AI 紫、无 div 假截图、无 section 编号 eyebrow、无滚动提示、无重复 CTA 意图、无 em-dash / en-dash。
- 是否满足 BYDFi i18n：用户可见文案使用 `LANG`，且未在组件/函数外直接执行 `LANG`。
- 是否满足 BYDFi theme：颜色使用既有 CSS 变量，兼顾深浅模式、品牌色、RTL 和三端响应式。
- 是否满足 TypeScript / React：无 `any` 扩散，无 `ts-ignore`，hooks 依赖完整，复杂动效隔离在 client leaf。
- 是否运行了必要验证；未运行必须说明原因。

## 汇报格式

完成后按 BYDFi 规范汇报：

```text
已完成：
- <改动 1>
- <改动 2>

验证：
- ✅ <命令/检查>：通过
- ⚠️ <命令/检查>：未运行，原因 <reason>
- ❌ <命令/检查>：失败，关键错误 <error>

使用方式 / 后续建议：
- <如何使用>
```
