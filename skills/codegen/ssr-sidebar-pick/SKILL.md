---
name: bydfi-codegen-ssr-sidebar-pick
description: >
  用于在 bydfi-ssr 页面中为右侧 sidebar / aside / `position: 'sidebar'` 槽位选择、规划并接入合适组件。
  当用户询问“侧栏放什么”、要求补齐/调整 sidebar、或需要为 CMS widgetConfigs 决定 sidebar 组件与 SSR 数据接法时触发。
  必须先给方案再落地，只允许处理 bydfi-ssr，不适用于 SSG、Web3 或无侧栏页面。
disable-model-invocation: true
allowed-tools: Read, Glob, Grep, Bash, Edit, Write
---

# BYDFi SSR Sidebar Pick Skill

本 skill 用于规范 `bydfi-ssr` 页面右侧侧栏的组件选择与接入方式，覆盖 `components/content-forge` 与 `components/pseo` 两个组件池。

核心目标只有三个：

- 选型要和页面语义匹配，不把主内容型组件硬塞进侧栏。
- 组件要能稳定适配 `376px` 侧栏宽度和响应式布局。
- SSR 数据流要自洽，首屏需要的数据必须在服务端准备好。

> 核心原则：先出方案，等用户确认，再改文件。

## 适用范围

### 触发场景

- 用户在 `bydfi-ssr` 新建内容页、详情页、落地页时，询问“右侧栏放什么”。
- 页面已有 `<aside>` 或 `sideWidgets`，但内容为空，需要补组件。
- 用户要求调整既有 sidebar 的组件顺序、增删或替换。
- 页面接入 CMS `widgetConfigs` 时，需要决定哪些 `widgetType` 放到 `position: 'sidebar'`。

### 不在范围

- 无 sidebar 的页面或全屏类页面。
- `bydfi-ssg`、Web3 或其他非 `bydfi-ssr` 项目。
- 与右侧栏无关的主内容区组件规划。

## 侧栏写法判断

开始选型前，先判断页面属于哪一类。

### A. 写死式

代表页面：`pages/[locale]/crypto-news/[id]/index.page.tsx`

特征：

- 在 `.page.tsx` 中直接 `import` 侧栏组件并写 JSX。
- `<aside className='sidebar'>` 中直接渲染组件。
- SSR 数据在页面自己的 `getServerSideProps` 中通过 `Http.xxx({ mode: HTTP_MODE.SERVER, context })` 获取。
- 页面通过 props 将服务端结果传入组件的 `serverData`。

适用场景：

- 结构稳定、变更频率低的栏目页。
- 需要精细排布、明确控制展示顺序的页面。

### B. 配置驱动式

代表页面：`pages/[locale]/how-to-buy/[id]/index.page.tsx`、`pages/[locale]/price/[id]/index.page.tsx`

特征：

- 页面通过 `Http.getCfContentPage` 获取 `widgetConfigs`。
- 运行时按 `position` 将组件切分为 `mainWidgets` / `sideWidgets`。
- 渲染依赖 `componentMap[widget.widgetType]`。
- SSR 数据依赖 `serverComponentsMap[widget.widgetType]` 与各组件的 `server.ts` `handleServer`。

适用场景：

- 运营需要在 CMS 后台配置侧栏。
- 页面组件顺序、内容与 topicAlias 需要动态编排。

## 执行流程

## 一、先读页面现状

1. 用 `Read` 打开目标 `.page.tsx`，判断它属于写死式还是配置驱动式。
2. 查找 `<aside>`、`sideWidgets`、`position === 'sidebar'` 等锚点，确认 sidebar 容器与布局。
3. 确认页面当前已有哪些 SSR 请求，避免重复取数。
4. 理解页面主题与用户意图：
   - 页面是币价、教程、新闻、pSEO 落地页还是其他类型。
   - 主区域已经有哪些内容，如 Hero、长文、表格、列表。
   - 侧栏目标更偏转化、行情、推荐阅读还是排行榜。

默认将 sidebar 宽度视为 `376px`，除非页面源码明确不是这个值。

## 二、先选组件，再给方案

必须优先阅读 [references/component-pool.md](references/component-pool.md)，只在白名单内筛选候选组件。

选型要求：

- 只能从“适合 sidebar”的组件里挑 2 到 4 个。
- 先考虑页面语义，再考虑尺寸和 SSR 成本。
- 不在组件池白名单内的组件默认不考虑，除非用户明确指定。

输出时必须使用以下格式，不要自由发挥：

```text
## 侧栏方案

页面: <相对路径>
写法: A 写死式 / B 配置驱动式
sidebar 容器宽度: 376px(项目默认)

### 组件清单

| 顺序 | 组件 | 来源 | 选它的理由 | SSR 依赖 | 备注 |
| --- | --- | --- | --- | --- | --- |
| 1 | Leaderboard | content-forge | 详情页右侧固定推涨跌新热榜,提升停留 | ✅ rankingsSnapshot | 已有页面用过,可直接复用 |
| 2 | conversion/Register | pseo | 未登录用户转化卡 | ❌ | 用 useAppContext 判断 isLogin 后再渲染 |
| ... |

### SSR 数据接入

(只列新增请求; 已存在的写“已具备”)

- `Http.getRankingsSnapshot` —— 写法 A 在 page 的 `getServerSideProps` 里并入 `Promise.all`，塞进 `props.rankingsSnapshot`，组件用 `<Leaderboard serverData={rankingsSnapshot} widgetConfig={{} as any} />`

### 落地后会改动

- `pages/[locale]/<page>/<id>/index.page.tsx`(写死式) 或
- `components/content-forge/component-map.ts` + CMS 配置(配置驱动式)
- 不新增 npm 依赖

请确认是否按此方案执行。
```

输出方案后必须停下，等待用户确认。

## 三、确认后再落地

用户明确回复“OK”“按这个来”“执行”或同等确认后，才允许开始改文件。

## 实现约束

### 写死式实现

1. 在页面顶部按需引入侧栏组件，例如：
   - `import { Leaderboard } from '@/components/content-forge/leaderboard'`
2. 在 `<aside className='sidebar'>` 中按确认后的顺序写 JSX。
3. 如果组件需要 SSR 数据，在当前页面的 `getServerSideProps` 中并入对应 `Http.xxx` 请求。
4. 写死式组件签名若要求 `widgetConfig`，统一传 `widgetConfig={{} as any}`，不要传 `undefined`。
5. 如果组件需要静态 `componentData`，显式构造对象并传入，不要依赖隐式默认值。

### 配置驱动式实现

1. 确认目标 `widgetType` 是否已注册在 `components/content-forge/component-map.ts` 的 `componentMap` 中。
2. 若未注册，补充 `dynamic<any>(() => import(...), { ssr: true })` 映射。
3. 若组件需要 SSR 数据：
   - 在对应组件目录的 `server.ts` 中实现 `handleServer`。
   - 在 `serverComponentsMap` 中注册稳定的 `serverKey` 与 `importer`。
4. CMS 中的 widget `position` 应配置为 `sidebar`，skill 只负责提醒，不直接操作 CMS。
5. 配置驱动式不要在 `.page.tsx` 中手动 import sidebar 组件。

### SSR 数据规则

- 服务端数据统一通过 `Http.xxx({ mode: HTTP_MODE.SERVER, context })` 获取。
- 首屏需要的数据禁止放到组件 `useEffect` 中现拉。
- `serverData` 必须允许为空，并有兜底，例如 `serverData?.list || []`。
- 配置驱动式里，同一 `serverKey` 会参与 dedupe，命名必须稳定。
- 写死式若页面已有同一接口返回值，直接复用，不要重复请求。
- 新增接口请求必须并入已有 `Promise.all`，不要串行 `await`。

## 组件池使用规则

候选白名单详见 [references/component-pool.md](references/component-pool.md)。

阅读组件池时重点关注：

- 组件是否适合 `376px` 侧栏宽度。
- 组件是否依赖 SSR 数据。
- 推荐使用场景是否与当前页面匹配。
- 是否已有写死式接入示例。
- 是否存在已知陷阱或已废弃侧栏用法。

简化决策规则：

- `content-forge` 优先承担需要标准 SSR 通道的侧栏内容。
- `pseo` 只优先考虑纯静态或无需额外服务端预取的窄栏卡片。
- 需要客户端现拉数据的 `pseo` 组件，默认不适合做 sidebar。

## 高风险坑位

- 不要把 K 线、大表格、Hero、长 FAQ、富文本主内容组件塞进 sidebar。
- 不要把 `pseo/conversion/bottom-fixed-banner`、`conversion/modal` 这类 fixed / 浮层组件放进 sidebar。
- 不要在 sidebar 中嵌套 `UniversalLayout` 或自带大宽度容器的组件。
- 不要为了兼容侧栏，临时把原本需要 SSR 的数据流改成客户端请求。
- 不要在配置驱动页面里绕开 `componentMap` / `serverComponentsMap` 手搓新通道。

## 完成自检

落地后至少确认以下事项：

1. `pnpm tsc:all` 无新增报错。
2. 黄色 / 蓝色、深色 / 浅色、RTL、桌面 / 平板 / 移动端下 UI 不破。
3. 样式颜色全部使用 `--spec-*` / `--skin-*` 变量，无硬编码颜色。
4. 用户可见文案走 `LANG()`，没有硬编码字符串。
5. 没有新增 npm 依赖。
6. 写死式新增 SSR 请求已并入 `Promise.all`。

## 交付要求

使用本 skill 规划或落地时，最终回复应包含：

- 页面属于写死式还是配置驱动式。
- 选择了哪些 sidebar 组件，以及为什么。
- 新增了哪些 SSR 请求，哪些数据是复用现有结果。
- 实际改动了哪些文件。
- 是否执行了类型检查；若未执行，需要说明原因。
