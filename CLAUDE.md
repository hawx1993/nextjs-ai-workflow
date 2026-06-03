# CLAUDE.md

本文件是 BYDFi Web 仓库的 Claude Code 总入口。所有 AI 开发、审查、修复、验证都必须先遵守本文件，再按需读取 `.claude/commands/*`、`.claude/skills/*`、`.claude/rules/*`、`.claude/knowledge/*`。

- `.claude/commands/*`：Slash command 入口与任务路由。
- `.claude/skills/*`：可复用执行流程。
- `.claude/rules/*`：不可违反的硬性规则。
- `.claude/knowledge/*`：项目知识库体系，用于开发前查找和复用已有公共能力，避免重复实现。

## 0. AI Workflow 核心约束（每次响应前必读）

1. **范围**：仅处理 `apps/*`、`packages/*` 中的 Next.js / React / TSX 代码
2. **顺序**：理解 → 读取命令/规则/知识库 → 方案确认 → 实现 → 验证，复杂需求禁止跳步
3. **先查知识库再实现**：涉及 API、utils、hooks、store、shared、formulas、events、styles、workers、i18n 等能力时，必须先按 `.claude/knowledge/discovery-core.md` 查找可复用能力；涉及新增或修改 hooks 时，必须同时按 `.claude/knowledge/discovery-hooks.md` 查找
4. **禁止自动外发**：未收到用户明确指令，不得执行 git commit / push / pr
5. **验证必须明示**：改完代码必须列出运行了哪些验证，未运行须说明原因
6. **不引入新依赖**：任何新 package 需用户确认

## 1. 日常开发推荐入口

| 场景               | 推荐命令                         | 作用                                           |
| ------------------ | -------------------------------- | ---------------------------------------------- |
| 新需求 / 重构规划  | `/byd:dev-plan <需求>`           | 梳理范围、影响面、方案和验证策略，不直接改代码 |
| 已确认方案后实现   | `/byd:dev-implement <路径/需求>` | 仅实现 Next.js + React + TSX 相关改动          |
| 本地改动审查       | `/byd:dev-review [文件或范围]`   | 按 React/TSX/i18n/theme/类型/性能维度审查      |
| 构建或类型报错修复 | `/byd:dev-fix-build <错误输出>`  | 最小改动修复 Next/TS/React 构建问题            |
| 修复bug            | `/byd:dev-fix-bug <范围>`        | 按指定代码行或目录范围定位并修复 BYDFi Next.js / React / TSX bug |

专项入口继续使用：

- 代码生成：`/byd:dev-implement`、`/byd:dev-refactor-component`、`/byd:codegen-design-system`、`/byd:codegen-figma-ui`、`/byd:codegen-designer-landing-ui`、`/byd:codegen-designer-premium-ui`
- 审计：`/byd:audit-i18n`、`/byd:audit-theme`、`/byd:audit-security`、`/byd:audit-dead-code` 等
- Git/PR：`/byd:workflow-git-commit`、`/byd:workflow-create-pr`（必须用户明确授权）

更多说明见 `.claude/AI_WORKFLOW.md` 与 `.claude/commands/byd/dev-doc.md`。

## 2. Claude 工作流资料索引

| 目录 | 定位 | 使用方式 |
| --- | --- | --- |
| `.claude/commands/` | Slash command 入口 | 用户触发 `/byd:*` 或专项命令时优先读取 |
| `.claude/skills/` | 可复用执行流程 | 按任务类型加载规划、实现、审查、验证、审计流程 |
| `.claude/rules/` | 硬性规则 | 按改动范围读取并遵守，不被 skills / knowledge 覆盖 |
| `.claude/knowledge/` | 项目知识库体系 | 开发前查找 API、hooks、store、utils、i18n 等公共能力，避免重复实现 |

## 3. Knowledge 知识库索引

`knowledge` 指导“先查哪里、如何复用”，`rules` 约束“必须怎么做”。knowledge 不能覆盖 rules 的硬性约束。

| Knowledge 文件 | 何时读取 | 输出要求 |
| --- | --- | --- |
| `.claude/knowledge/discovery-core.md` | 开发新功能、页面、组件、hook、API 请求、WebSocket、交易/钱包/行情逻辑前 | 输出 core 查找结论：已查模块、可复用能力、处理结论、影响范围、验证 |
| `.claude/knowledge/discovery-hooks.md` | 新增或修改自定义 hook，或涉及请求、路由、存储、倒计时、响应式、登录态、行情、钱包等交互逻辑 | 输出 hooks 查找结论：已查入口、可复用 hook、处理结论、不复用原因、影响范围 |
| `.claude/knowledge/discovery-api.md` | 新增或修改接口请求、API 类型、接口路径、接口封装前 | 输出接口查找结论：已有 API、类型、路径、是否需要新增 |
| `.claude/knowledge/discovery-apps-icon.md` | 涉及图标选型、`@apps/icons` 导入、图标命名或图标复用时 | 输出图标查找结论：候选图标、导入路径、使用方式 |

## 4. 关键规则索引

| 规则文件                        | 何时读取                                                      | 何时不用读取                                      |
| ------------------------------- | ------------------------------------------------------------- | ------------------------------------------------- |
| `.claude/rules/nextjs.md`       | 修改 Next.js 页面、路由、SSG/SSR 数据流、服务端/客户端边界    | 纯样式、纯文案、非 Next.js 相关配置改动不需要读   |
| `.claude/rules/react-tsx.md`    | 修改 React 组件、hooks、props、状态、可访问性                 | 纯脚本、纯配置、非 React/TSX 文件改动不需要读     |
| `.claude/rules/typescript.md`   | 修改 TS 类型、工具函数、金融计算、import alias                | 纯样式、纯 Markdown 文档、无 TS 类型影响不需要读  |
| `.claude/rules/prototype.md`    | 使用 Number/String 全局扩展、金融链式计算、数字格式化          | 不涉及数字计算、比较、格式化时不需要读            |
| `.claude/rules/monorepo.md`     | 修改跨 app/package 共享代码、pnpm workspace、apps-kit/apps-ui | 单 app 内部私有且不影响 workspace 结构不需要读    |
| `.claude/rules/language.md`     | 任何用户可见文案、i18n、`LANG` 使用                           | 无用户可见文案、无 i18n / `LANG` 改动不需要读     |
| `.claude/rules/theme.md`        | 任何样式、颜色、主题、RTL、深浅模式                           | 纯逻辑/类型改动不需要读                           |
| `.claude/rules/responsive.md`   | PC / Tablet / Mobile 响应式、`MediaInfo` 断点使用              | 不涉及布局、断点、设备适配的改动不需要读          |
| `.claude/rules/styled-jsx.md`   | 修改 styled-jsx、`:global()`、样式嵌套、响应式、RTL 样式       | 不涉及 styled-jsx / CSS-in-JS 样式改动不需要读    |
| `.claude/rules/verification.md` | 任何代码改动后的验证与结果汇报                                | 仅咨询、只读分析且没有修改文件时不需要读          |
| `.claude/rules/branch.md`       | 分支命名、合流、PR 目标分支                                   | 不涉及建分支、合流、PR / commit 流程不需要读      |

## 5. 项目硬性约束

- **禁止自动操作**：未收到用户明确指令时，不得执行 `git commit`、`git push`、`gh pr create`。
- 不得擅自引入新依赖；依赖版本精确锁定（`save-prefix=""`）。
- 提交前必须 `pnpm tsc:all` 类型检查通过。
- AI 改完tsx代码后，必须检查 tsc 和 eslint 规范是否通过；未通过则根据提示修改或说明阻塞原因。
- UI 变更测试：黄色/蓝色 × 深/浅 × RTL × 三端响应式。
- 金融计算禁止原生浮点运算；优先使用项目 `Number` / `String` prototype 链式方法，复杂或未确认加载场景使用 `BN` / `bignumber.js`。
- 所有用户可见文案必须使用 `LANG`，除品牌名/交易对等专有名词外，不得硬编码文案。
- 样式颜色必须使用 CSS 变量 `--spec-*` / `--skin-*`/`--nex-*`，不得硬编码色值。
- 不要开启 `react-hooks/exhaustive-deps`；该规则全局关闭是已知技术债，新 hooks 应主动补全依赖。

## 6. 环境

- Node.js 20.18.0
- pnpm 9.15.0
- TypeScript 4.9.5
- Next.js 14
- Prettier：printWidth 120、singleQuote、jsxSingleQuote、semi、tabWidth 2

## 7. 架构

pnpm monorepo，核心为多个 Next.js 应用 + 共享包：

```text
bydfi-ssg ──┐
bydfi-ssr ──┼── apps-kit ──┬── apps-ui
            ├── apps-icons
                           └── apps-base-kline
```

| App | 输出                | 服务器        | 状态管理 |
| --- | ------------------- | ------------- | -------- |
| SSG | static export → CDN | —             | Immer    |
| SSR | 服务端渲染          | Express + PM2 | Immer    |

构建链路：源码 → Babel (`.babelrc`) → Next.js Build → Sentry Source Map 上传。

### tsconfig paths 别名映射

| 别名          | SSG 解析到                       | SSR 解析到                       |
| ------------- | -------------------------------- | -------------------------------- |
| `@/*`         | `apps-kit/*` **或** 本地 `src/*` | `apps-kit/*` **或** 本地 `src/*` |
| `@apps/kit/*` | —                                | `apps-kit/*`                     |
| `@repo/*`     | 本地 `src/*`                     | —                                |
| `@apps/icons` | apps-icons barrel                | apps-icons barrel                |
| `@apps/ui/*`  | apps-ui/src/components/\*        | apps-ui/src/components/\*        |

**注意**：不要假设 `@/foo` 一定解析到本地 `src`；在 SSG/SSR 中它可能优先解析到 `apps-kit`。

## 8. 常用命令

```bash
pnpm dev:ssg          # SSG 开发，端口 9999
pnpm dev:ssr          # SSR 开发，端口 8888
pnpm build:ssg        # SSG 构建
pnpm build:ssr        # SSR 构建
pnpm tsc:all          # 全量类型检查：SSG + SSR + apps-kit
pnpm lint:all         # Prettier + ESLint + TypeScript
pnpm eslint:fix       # ESLint 自动修复
pnpm prettier:fix     # Prettier 自动修复
pnpm update-lang:ssg  # 更新 SSG 翻译
pnpm update-lang:ssr  # 更新 SSR 翻译
```

## 9. 编码规范摘要

### 页面目录结构

页面级文件组织优先在页面目录下按需建立 `components/`、`hooks/`、`store/`、`types.ts`、`constants.ts`。简单页面不需要为了满足结构而创建空目录或空文件。

```text
your-page/
├── index.page.tsx
├── components/
├── hooks/
├── store/
├── types.ts
└── constants.ts
```

- `index.page.tsx`：页面主入口，遵守对应 app 的 `pageExtensions`。
- `components/`：当前页面抽取出去的页面专属组件；可跨页面复用的组件应放到 app 级 `src/components` 或合适共享包，并说明影响范围。
- `hooks/`：当前页面私有交互逻辑；新增前必须先查 `.claude/knowledge/discovery-hooks.md` 与 `packages/apps-kit/core/hooks`。
- `store/`：当前页面跨组件状态传递；组件内部简单状态不应过早抽 store。
- `types.ts`：页面私有类型；API 请求和响应类型优先复用 `packages/apps-kit/core/network/src/api` 中已有类型。
- `constants.ts`：页面私有常量；跨页面通用常量应评估放到 app 级或 shared/core。

### React / TSX

- 组件尽量保持单一职责，复杂逻辑拆 hook 或纯函数。
- 新 hooks 即使全局关闭 `react-hooks/exhaustive-deps`，也要主动写全依赖。
- 不在 render 中做昂贵计算；必要时使用 `useMemo`，但不要滥用。
- props 类型优先显式声明；避免 `any` 扩散。

### 状态管理

- 简单组件状态：`useState`。
- 组件级复杂状态：Immer / use-immer。
- 页面级跨组件状态：放在当前页面 `store/`；优先沿用目标 app / 模块既有状态模式。若项目已具备 zustand 依赖且目标模块已有 zustand 使用方式，推荐使用 zustand 组织页面私有 store。
- 全局上下文：React Context（主题、i18n、用户认证）或项目既有全局状态方案。
- 不新增状态管理库；禁止为单个页面需求单独引入 zustand 或其他状态依赖。

### 样式系统

- Styled JSX + SCSS；styled-jsx 具体写法遵守 `.claude/rules/styled-jsx.md`。
- 响应式遵守 `.claude/rules/responsive.md`，优先使用 `MediaInfo` 覆盖 PC / Tablet / Mobile。
- 颜色使用 CSS 变量：`--spec-*` / `--skin-*` / 已确认的 `--nex-*`。
- UI 改动必须考虑品牌色、深浅模式、RTL、三端响应式。

### 网络层

- HTTP：Axios 封装，统一错误处理和 token 刷新。
- WebSocket：实时行情、订单簿、交易推送。
- Web Workers：K 线计算等 CPU 密集任务。

## 10. i18n

- 24 种语言，Google Sheets 为翻译源。
- JS 格式文件，客户端通过 `window.appLang` / `commonAppLang` 全局变量注入。
- 关键路径：`packages/apps-kit/core/i18n/src/`。
- 新增语言需检查 6 处独立维护的语言常量。
- `LANG` 不能在组件/函数外直接执行；动态参数必须使用 `{placeholder}` + 参数对象。

## 11. Commit / PR 规范

- Commit 格式：`type(scope): subject` + body（修改原因/处理方案/影响范围），中文撰写。
- commitlint + husky 强制校验。
- 分支策略：feature → release/\* → main。
- `main` 只接受 `release/*` 合并；项目分支规则详见 `.claude/rules/branch.md`。

## 12. 已知技术债

- `react-hooks/exhaustive-deps` 全局关闭。
- `@types/react` 锁在 18.0.27（React 实际 18.2.0）。
- `@/*` alias 在 SSG/SSR 中同时映射 apps-kit 和本地 src。
- i18n 语言常量 6 处独立维护。
- dev/prod transpilePackages 不一致。
- 仅旧主题系统（`--spec-*` / `--skin-*`），新主题（nex-theme）已移除但迁移未完成。
- apps-base-kline 排除 lint-staged，修改时需手动 `pnpm -F apps-base-kline run lint`。

## 13. AI 修改后的汇报格式

完成任意修改后，按以下格式汇报：

```text
已完成：
- <改动 1>
- <改动 2>

验证：
- ✅ <命令/检查>：通过
- ⚠️ <命令/检查>：未运行，原因 <reason>
- ❌ <命令/检查>：失败，关键错误 <error>
- ❓ <命令/检查>：无法判断，原因 <reason>，建议人工确认


使用方式 / 后续建议：
- <如何使用>
```
