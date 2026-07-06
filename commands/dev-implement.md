---
allowed-tools: Read, Write, Edit, Grep, Glob, Bash
argument-hint: <文件路径> | <需求说明>
description: 先执行 /byd-next:dev-plan 规划，再按已确认方案实现ssg页面或ssr页面的nextjs代码
---

# BYDFi Next.js 代码实现

请按 `skills/dev/nextjs-dev/SKILL.md` 的“实现”流程执行，并将 `$ARGUMENTS` 按 `<文件路径> | <需求说明>` 解析为两个输入：

- `<文件路径>`：要生成或修改代码的目标文件路径。
- `<需求说明>`：本次实现的具体需求说明。

# 查找可复用的能力

请按 `knowledge/discovery-core.md` 的“查找可复用的能力”流程执行。

包括:

- api
- utilsc
- hooks（涉及 hooks 时必须按 `knowledge/discovery-hooks.md` 执行，优先复用 `packages/apps-kit/core/hooks`）
- store
- shared
- formulas
- events
- styles
- workers
- i18n
- components（涉及 UI 组件、表单、弹窗、表格、图片、选择器等时必须按 `knowledge/discovery-components.md` 执行，优先复用 `packages/apps-kit/components`）

找到后， 列出可被复用的方法，接口等，如果没有的话，说明没有可复用的能力，需要新增。

## 接口查找

请按 `knowledge/discovery-api.md` 的“查找可复用的接口”流程执行。

## 执行要求

- 仅处理 Next.js + React + TSX 相关代码。
- 修改前确认目标 apps/packages 和相关 rules。
- 若目标为 SSR 项目（如 `apps/byd-ssr`、`bydfi-ssr` 或 SSR 页面/组件），必须先读取并遵守 `skills/codegen/ssr-generate/SKILL.md`。
- 若目标为 SSG 项目（如 `apps/byd-ssg`、`bydfi-ssg` 或 SSG 页面/组件），必须先读取并遵守 `skills/codegen/ssg-generate/SKILL.md`。
- 用户可见文案必须使用 `LANG`。
- 样式颜色必须使用 CSS 变量。
- 金融计算禁止原生浮点运算，优先使用项目 `Number` / `String` prototype 链式方法，复杂或未确认加载场景使用 `BN` / `bignumber.js`。
- 新增 hook 前必须说明已查 `knowledge/discovery-hooks.md` 与 `packages/apps-kit/core/hooks`；已有能力优先复用。
- 不擅自新增依赖。
- 完成后必须给出验证结果或未验证原因。
