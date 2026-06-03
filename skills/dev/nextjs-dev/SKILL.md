---
name: bydfi-nextjs-dev
description: BYDFi Next.js + React + TSX 日常开发主流程。用于规划、实现、构建修复，统一遵守 i18n、theme、TypeScript、monorepo 和验证规则。
disable-model-invocation: true
allowed-tools: Read, Write, Edit, Grep, Glob, Bash, Agent, AskUserQuestion
author: nilu
---

# BYDFi Next.js 开发流程

本 skill 是日常 Next.js + React + TSX 开发的主入口，覆盖规划、实现和构建修复。

## 执行流程

### 1. 明确范围

当从 `/byd:dev-implement` 进入实现流程时，必须接收并解析两个参数：

```bash
/byd:dev-implement <文件路径> | <需求说明>
```

- `<文件路径>`：要生成或修改代码的目标文件路径，作为实现落点和影响范围判断依据。
- `<需求说明>`：本次实现的具体需求说明，作为业务目标和验收依据。
- 如果缺少 `<文件路径>` 或 `<需求说明>` 任一参数，先停止实现并提示用户按 `<文件路径> | <需求说明>` 补充完整。

先确认：

- 目标 app：`apps/byd-ssg` / `apps/byd-ssr` / `packages/apps-kit` / `packages/apps-ui` / `packages/apps-icons` / `packages/apps-base-kline`等
- 目标文件或模块，优先以 `<文件路径>` 为准。
- 需求说明与验收目标，优先以 `<需求说明>` 为准。
- 是否涉及共享包：`apps-kit` / `apps-ui` / `apps-icons` / `apps-base-kline`。
- 是否涉及 UI、i18n、theme、金融计算。
- 是否涉及 React hook、新增 hook、请求/路由/存储/倒计时/响应式/登录态/行情/钱包逻辑；如涉及，必须读取 `.claude/knowledge/discovery-hooks.md` 并优先复用 `packages/apps-kit/core/hooks`。

需求不清晰时，先询问用户。

### 2. 读取规则

按场景读取：

- `.claude/CLAUDE.md`
- `.claude/rules/nextjs.md`（涉及 Next.js 页面、路由、SSG/SSR、server/client boundary 时）
- `.claude/rules/react-tsx.md`（涉及 React 组件、hooks、props、状态、可访问性时）
- `.claude/rules/typescript.md`（涉及类型、alias、金融计算、工具函数时）
- `.claude/rules/language.md`（涉及用户可见文案、i18n、`LANG` 时）
- `.claude/rules/theme.md`（涉及样式、颜色、主题、RTL、深浅模式时）
- `.claude/rules/monorepo.md`（涉及 `packages/*` 或跨 app 共享代码时）
- `.claude/rules/verification.md`（所有代码修改后必须遵守）
- `.claude/rules/styled-jsx.md`（涉及 styled-jsx 样式时 必须遵守）
- `.claude/rules/prototype.md`（涉及金融计算时 必须遵守）
- `.claude/rules/responsive.md`（涉及响应式时 必须遵守, 修复响应式问题可查阅）

条件触发 Skills：
- `.claude/skills/codegen/design-system/SKILL.md`（设计系统规范遵守，涉及 CSS / styled-jsx / 样式生成或调整时必须读取并遵守）

### 3. 规划

复杂需求先输出计划，不直接改代码。计划包含：

- 需求复述
- 影响范围
- 文件列表
- 实施步骤
- 验证策略
- 风险与不做事项
- core/hooks 查找结论（涉及 hook 或可复用交互逻辑时）

### 4. 实现

实现时必须：

- 复用现有组件、工具、API 与 `core/hooks`；新增 app-local hook 前必须先查 `.claude/knowledge/discovery-hooks.md`。
- 文案走 `LANG`。
- 颜色走 CSS 变量。
- 涉及 CSS / styled-jsx / 样式生成或调整时，必须遵守 `.claude/skills/codegen/design-system/SKILL.md` 的 Nex 设计系统样式规则。
- 金融计算遵守 `.claude/rules/prototype.md` 和 `.claude/rules/typescript.md`：优先使用项目 `Number` / `String` prototype 链式方法，复杂或未确认加载场景使用 `BN` / `bignumber.js`。
- hooks 依赖主动补全。
- 不新增依赖。

### 5. 验证

根据改动范围选择：

```bash
pnpm tsc:all
pnpm lint:all
pnpm tsc:check:ssg
pnpm tsc:check:ssr
pnpm eslint:check
```

未运行必须说明原因。

## 输出格式

```text
已完成：
- <改动>

验证：
- ✅/⚠️/❌ <命令>: <结果>

风险：
- <风险>

下一步：
- <建议>
```
