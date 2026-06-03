---
name: bydfi-knowledge-discovery-core
description: 了解 packages/apps-kit/core 公共能力中心是什么、如何查找与复用。开发功能前需要判断是否应复用 core 时使用；硬性复用规则见 .claude/rules/nextjs.md 与 monorepo.md。
disable-model-invocation: true
allowed-tools: Read, Bash
---

# apps-kit/core 公共能力发现流程

`packages/apps-kit/core` 是 BYDFi Web 的公共能力中心：沉淀 SSG / SSR 可复用的 hooks、网络 API、i18n、store、业务领域模型、工具函数、样式主题、WebSocket、事件、公式和 worker。

本 skill 描述“如何查找与评估 core 能力”。必须遵守的 core 复用约束已迁移到：

- `.claude/rules/nextjs.md`：core 复用优先级、禁止重复封装请求/路由/存储等。
- `.claude/rules/monorepo.md`：共享包改动影响范围与验证。
- `.claude/rules/typescript.md`：类型安全、金融计算、工具复用。
- `.claude/rules/react-tsx.md`：hooks、接口请求、组件层约束。

## 执行流程

1. **判断需求是否属于公共能力**
   - 涉及请求、路由、本地存储、倒计时、设备/响应式、登录态、主题、语言、行情、订单、钱包、交易、金融计算、WebSocket、事件通信等，优先查 `packages/apps-kit/core`。
   - 单 app 私有 UI 或页面编排逻辑可以留在 apps 内；如果可被 SSG / SSR 复用，应评估 core 现有能力或是否沉淀。

2. **先查再写**
   - 先查目录与 barrel：`packages/apps-kit/core/index.ts` 以及对应子模块 `index.ts`。
   - 再按关键词查实现：导出名、业务名、API 名、hook 名、store 名。
   - 最后查调用方，确认现有用法和边界。

3. **评估复用方式**
   - 现有 public export：直接复用。
   - 有实现但未导出：评估是否补 barrel 导出。
   - 能组合已有能力：组合 hook / util / shared model。
   - 确实不存在：按 rules 说明查找范围、影响范围和新增原因。

## core 模块地图

| 模块                   | 主要职责                                     | 典型查找关键词 / 能力                                                                                                                      |
| ---------------------- | -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `core/hooks`           | React hooks 公共封装                         | `useRequestData`、`useRouter`、`useResponsive`、`useTheme`、`useLocalStorage`、`useDebounce`、`useThrottle`、倒计时、登录态、行情、Zendesk；详细地图见 `.claude/knowledge/discovery-hooks.md` |
| `core/network`         | 网络层、API、HTTP、WebSocket                 | `*Api`、`paths`、`useWs`、`WS3001`、`WS4001`、`WS`、订阅、推送、Axios 返回类型                                                             |
| `core/network/src/api` | 业务 API 统一出口                            | 详细接口地图请读取 `.claude/knowledge/discovery-api.md`；该 knowledge 覆盖除 moonx、polymarkets 目录外的接口模块与 API 函数定位。             |
| `core/i18n`            | 多语言、SEO、语言路径、翻译组件              | `LANG`、`serverLANG`、`useLANG`、`TrLink`、`TradeLink`、`getStaticPaths`、`getStaticProps`、语言 meta                                      |
| `core/store`           | 全局/跨页面状态与存储                        | `AppProvider`、`useAppContext`、`localStorageApi`、`SessionStorageApi`、`resso`、`useResso`、`IDB`、`SKIN`、`THEME`                        |
| `core/shared`          | 业务领域模型与服务                           | `Account`、`UserInfo`、`Assets`、`Wallet`、`Markets`、`Spot`、`Swap`、`SwapCopy`、`Rate`、`Favors`、`EventCenter`、`SearchSymbols`         |
| `core/utils`           | 通用工具函数                                 | format、number、date/time、device、cookie、regexp、RTL transform、message、media info、polling、debounce/throttle                          |
| `core/formulas`        | 金融/交易/现货/永续合约/网格相关计算公式     | markets、orderbook、spot、swap、spot-grid、spot-martin、swap-grid；金融计算相关公式                                                        |
| `core/events`          | 跨模块事件通信                               | favor、k-chart、orderbook、swap-order、notification、header search 等事件                                                                  |
| `core/styles`          | 主题与全局样式                               | `--spec-*`、`--skin-*` 旧主题变量、CSS 基础样式                                                                                            |
| `core/sensorsdata`     | 埋点与 sensorsdata                           | sensorsdata 事件、MoonX 埋点类型                                                                                                           |
| `core/workers`         | Web Worker 能力                              | swap worker、proto、CPU 密集计算                                                                                                           |
| `core/prototype`       | 原型扩展/兼容层                              | 修改前必须确认全局副作用和影响范围                                                                                                         |

## 查找方法

### 1. 从 barrel 出口开始

优先读取这些文件确认已有导出：

```text
packages/apps-kit/core/index.ts
packages/apps-kit/core/hooks/index.ts
packages/apps-kit/core/network/index.ts
packages/apps-kit/core/network/src/api/index.ts
packages/apps-kit/core/i18n/index.ts
packages/apps-kit/core/store/index.ts
packages/apps-kit/core/shared/index.ts
packages/apps-kit/core/utils/index.ts
packages/apps-kit/core/formulas/index.ts
```

### 2. 按问题域定位目录

- 请求接口：先读 `.claude/knowledge/discovery-api.md` 判断业务模块，再查 `packages/apps-kit/core/network/src/api/**/index.ts` 和 `types.ts`。
- React 交互逻辑：先读 `.claude/knowledge/discovery-hooks.md`，再查 `packages/apps-kit/core/hooks/index.ts` 和 `packages/apps-kit/core/hooks/src/use-*.ts(x)`。
- 用户、钱包、交易、行情等业务对象：先查 `packages/apps-kit/core/shared/src/<domain>`。
- 格式化、校验、设备、时间、cookie、RTL：先查 `packages/apps-kit/core/utils/src`。
- 语言文案/SEO/多语言路由：先查 `packages/apps-kit/core/i18n/src`。
- 全局状态/本地存储/SSR 信息：先查 `packages/apps-kit/core/store/src`。
- 交易或金额计算：先查 `packages/apps-kit/core/formulas/src`。

### 3. 使用 CodeGraph / 搜索确认复用

推荐查询顺序：

```text
1. codegraph_context：用需求描述查 core 是否已有相关符号
2. codegraph_explore：查看候选符号源码和同文件导出
3. codegraph_callers / codegraph_impact：确认现有调用方式和影响范围
```

没有 CodeGraph 时，用只读搜索：

```bash
find packages/apps-kit/core -maxdepth 3 -type d | sort
rg "关键词|Api|useXxx|XxxManager|XxxStore" packages/apps-kit/core
rg "from ['\"](@/core|@apps/kit/core)" apps packages/apps-kit -g '*.{ts,tsx,js,jsx}'
```

## 输出要求

使用本 skill 做规划、实现或审查时，结论必须包含：

```text
core 查找：
- 已查模块：<core/hooks | core/network | core/shared | ...>
- 可复用能力：<符号/文件路径；如果没有，写“未找到”>
- 处理结论：<复用现有 / 补导出 / 新增能力，并说明原因>

影响范围：
- <SSG / SSR  / apps-kit 内部影响>

验证：
- <运行的 tsc/lint/专项检查；未运行需说明原因>
```

## 触发场景

- 开发新功能、页面、组件、hook、API 请求、WebSocket 订阅、交易/钱包/行情逻辑前；涉及新增或重构自定义 hook 时必须先读 `.claude/knowledge/discovery-hooks.md` 并输出 hooks 查找结论。
- 用户要求“先找已有能力”“不要重复实现”“复用 core”“apps-kit/core 是什么”。
- Review 时发现 app 内出现疑似通用 hook、工具函数、请求封装、格式化/校验、业务模型重复实现。
- 重构时需要判断逻辑应保留在 app 还是沉淀到 `packages/apps-kit/core`。
