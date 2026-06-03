---
allowed-tools: Read, Write, Edit, MultiEdit, Grep, Glob, Bash, Agent, TodoWrite, TodoRead,TaskCreate,TaskList,TaskUpdate
argument-hint: <文件路径[:行号[-行号]] 或 文件夹路径 + bug 描述[实际行为 vs 期望行为]>
description: 按指定代码行或目录范围定位并修复 BYDFi Next.js / React / TSX bug
author: Nilu
---

# BYDFi Bug 修复

请将 `$ARGUMENTS` 作为本次 bug 修复的唯一输入范围与问题描述。该命令用于让 AI 在用户指定的代码行、文件或文件夹范围内定位并修复 bug，保持最小必要改动，并在修复后执行匹配范围的验证。

## 参数规则

- `$ARGUMENTS` 必填，必须包含以下至少一种范围输入：
  - 指定代码行：`path/to/file.tsx:120`、`path/to/file.tsx:120-160`、`path/to/file.ts:45`。
  - 指定文件路径：`path/to/file.tsx`、`path/to/file.ts`。
  - 指定文件夹路径：`apps/byd-ssg/src/pages/...`、`packages/apps-kit/core/...`。
- `$ARGUMENTS` 可同时包含 bug 描述、复现步骤、错误表现、期望表现或错误日志。
- 如果 `$ARGUMENTS` 为空：停止执行，并提示用户提供代码行、文件路径或文件夹路径。
- 如果无法从 `$ARGUMENTS` 中识别有效范围：停止执行，并提示用户使用 `文件路径[:行号[-行号]]` 或文件夹路径。
- 如果用户提供的是代码行范围：
  - 优先只读取该文件及该行附近上下文。
  - 仅在定位根因需要时读取直接依赖、调用方或同目录相关文件。
- 如果用户提供的是文件夹路径：
  - 只在该目录下定位 bug 相关文件。
  - 不扩大到目录外修改，除非根因明确来自目录外依赖；扩大范围前必须说明原因。

## 适用范围

- Next.js / React / TSX 运行时 bug。
- React hooks、条件渲染、状态更新、事件处理、列表 key、hydration、SSR/SSG/client-only 边界问题。
- TypeScript 类型导致的真实逻辑问题。
- UI 显示、样式、主题、RTL、响应式问题。
- `packages/apps-kit/core` 公共能力相关 bug。
- 代码规范违规导致的可维护性、i18n、theme、组件库使用、API 使用问题。

## 禁止范围

- 禁止无边界全仓扫描并修改。
- 禁止借修 bug 做大规模重构。
- 禁止删除业务逻辑来绕过问题。
- 禁止修改接口字段、路由、埋点、权限判断、交易/金融计算结果，除非 bug 根因明确且用户描述要求修复该逻辑。
- 禁止擅自新增依赖，不修改 `package.json` / lockfile。
- 禁止修改 tsconfig、ESLint、Prettier 配置来绕过问题。
- 禁止使用 `any`、`as any`、`as unknown as`、`ts-ignore` 掩盖问题。
- 金额、价格、盈亏、比例、手续费等金融计算必须继续使用项目安全计算方式：优先使用 `Number` / `String` prototype 链式方法，复杂或未确认加载场景使用 `BN` / `bignumber.js`，禁止引入原生浮点运算。
- 未收到用户明确指令，不得执行 `git commit`、`git push`、`gh pr create`。

## 必读规则

执行前按问题类型读取并遵守：

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

## 条件触发 Skills

根据 bug 类型额外读取并遵守以下 skills：

### 1. UI / 样式 / 设计系统问题

如果 bug 涉及 UI 显示、布局、样式、颜色、字体、间距、响应式、RTL、深浅模式、黄色/蓝色 skin 或 styled-jsx：

- 必须读取：`.claude/skills/codegen/design-system/SKILL.md`
- 修复要求：
  - 样式变量优先使用 skill 中定义的 `--nex-*`，并兼容项目既有 `--spec-*` / `--skin-*` 规则。
  - 禁止新增硬编码颜色、字体大小、行高、字重。
  - 响应式优先使用 `MediaInfo` 断点。
  - UI 修复后必须说明深/浅、黄/蓝、RTL、PC/Tablet/Mobile 的影响和验证情况。

### 2. `packages/apps-kit/core` 公共能力问题

如果 bug 范围或根因涉及 `packages/apps-kit/core`、`@/core/*`、`@apps/kit/core/*`、hooks、network、i18n、store、shared、utils、formulas、events、styles、workers：

- 必须读取：`.claude/knowledge/discovery-core.md`
- 若涉及 hooks 或 app 内疑似重复 hook，必须同时读取：`.claude/knowledge/discovery-hooks.md`
- 修复要求：
  - 先查 core 现有 public export、barrel、调用方和影响范围。
  - 优先复用或修复现有 core 能力，不重复实现平行逻辑。
  - 修改 core 时必须说明 SSG / SSR / Web3 / apps-kit 内部影响。
  - 接口请求优先使用 `useRequestData` 和 `core/network/src/api` 中的 `*Api`。
  - hooks、请求状态、路由、存储、倒计时、响应式、主题、登录态、行情、钱包、WebSocket 等优先复用 `core/hooks`，不新增平行逻辑。
  - 本地存储、路由、格式化、时间、金融计算等优先复用 core 现有能力。

### 3. 代码规范 / Review 违规问题

如果 bug 与代码规范、组件库使用、hooks 依赖、i18n、theme、SSR/SSG 边界、可访问性、性能、未使用代码、any 类型、原生 API 使用有关：

- 必须读取：`.claude/skills/dev/nextjs-review/SKILL.md`
- 修复要求：
  - 按该 skill 的审查维度先定位违规证据。
  - 只修复与本次 bug 相关的阻断项，不做无关风格大清理。
  - 修复后复查同一范围是否仍存在同类违规。

## 执行步骤

1. 校验 `$ARGUMENTS`，识别输入范围：代码行、文件或文件夹。
2. 根据路径判断目标 app/package 和 alias 风险，尤其是 `@/*` 可能解析到 app 本地或 `apps-kit`。
3. 读取指定代码行或指定范围内的相关文件；只在必要时读取直接依赖、调用方、同目录组件或样式。
4. 根据 bug 类型加载对应 skills。
5. 复现或推理 bug 根因，输出简短判断：
   - 问题现象。
   - 根因位置（`path:line`）。
   - 修复边界。
6. 使用最小必要改动修复 bug。
7. 自查以下内容：
   - [ ] 业务行为只修复 bug，未引入无关重构
   - [ ] 修复纯UI问题时，未改变原有业务逻辑。
   - [ ] 响应式优先使用 MediaInfo 断点
   - [ ] 金融计算使用项目 prototype 链式方法或 `BN` / `bignumber.js`，无原生浮点运算
   - [ ] TypeScript 类型安全，无 any / ts-ignore
   - [ ] SSR/SSG/client-only 边界安全
   - [ ] 用户可见文案使用 LANG
   - [ ] 样式颜色使用 CSS 变量
   - [ ] React hooks 依赖完整，并已检查可复用 `core/hooks`
8. 运行与影响范围匹配的验证命令；无法运行时说明原因。

## 推荐验证策略

按实际影响范围选择，不要只运行格式化就声称业务正确：

- SSG app：`pnpm tsc:check:ssg`
- SSR app：`pnpm tsc:check:ssr`
- apps-kit / core：`pnpm -F apps-kit run tsc:check` 或 `pnpm tsc:all`
- 全量类型：`pnpm tsc:all`
- 代码规范：`pnpm eslint:check`、`pnpm prettier:check` 或 `pnpm lint:all`
- UI 问题：补充手动/截图检查矩阵：黄色/蓝色 × 深/浅 × RTL × PC/Tablet/Mobile

## 报错格式

无法识别输入范围时，按以下格式输出并停止：

```text
无法执行 bug 修复：
- `$ARGUMENTS` 未包含有效代码行、文件路径或文件夹路径。

请提供类似 `path/to/file.tsx:120-160`、`path/to/file.tsx` 或 `apps/byd-ssg/src/pages/...` 的范围，并补充 bug 描述。
```

范围不存在时，按以下格式输出并停止：

```text
无法执行 bug 修复：
- `<path>` 不存在或不是可读取的文件/文件夹。

请提供有效的代码行、文件路径或文件夹路径。
```

范围存在但未定位到根因时：

无法执行 bug 修复：
- 已读取 `<path>` 范围内的相关代码，未能定位明确根因。

请补充以下信息之一：
- 错误日志或控制台输出
- 复现步骤
- 期望行为 vs 实际行为

## 完成汇报

完成后必须按 `.claude/CLAUDE.md` 的格式汇报：

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

如果涉及 core，汇报中必须额外包含：

```text
core 查找：
- 已查模块：<core/hooks | core/network | core/shared | ...>
- 可复用能力：<符号/文件路径；如果没有，写“未找到”>
- 处理结论：<复用现有 / 修复现有 / 补导出 / 新增能力，并说明原因>

影响范围：
- <SSG / SSR / Web3 / apps-kit 内部影响>
```
