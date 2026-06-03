---
name: bydfi-knowledge-discovery-hooks
description: 了解 packages/apps-kit/core/hooks 公共 hooks 能力、查找与复用流程。开发或审查 React hooks 前使用，避免重复创建 app-local hook。
disable-model-invocation: true
allowed-tools: Read, Bash
---

# apps-kit/core/hooks 公共 hooks 发现流程

`packages/apps-kit/core/hooks` 是 BYDFi Web 的共享 React hooks 中心。开发、修复、重构或审查 hooks 前，必须先查这里是否已有能力；只有确认无法复用时，才考虑新增 app-local hook 或沉淀新的 core hook。

## 何时使用

遇到以下场景时先读本 knowledge：

- 新增或修改 `use-*` 自定义 hook。
- 请求、loading、分页、滚动加载、轮询。
- 路由、路径、跳转监听、重定向。
- `localStorage`、`sessionStorage`、IndexedDB、持久化倒计时。
- 倒计时、时间、mounted 保护、防抖、节流。
- 响应式、设备判断、DOM 点击、宽度测量、滚动方向、可见性。
- 主题、skin、Native App 桥接、域名、全局配置。
- 登录态、用户信息、KYC、POA、安全验证、OAuth。
- 行情、钱包、汇率、资产、WebSocket 推送。
- 弹窗可见性、open 状态、组合输入等 UI 行为。

## import 与 alias 约定

- 共享 hooks 源头：`packages/apps-kit/core/hooks`。
- 先查 barrel：`packages/apps-kit/core/hooks/index.ts`。
- 再查源码：`packages/apps-kit/core/hooks/src/use-*.ts(x)`。
- 在应用代码中，优先沿用项目既有共享 hooks 导入方式：

```ts
import { useRouter } from '@/core/hooks';
import { useRequestData } from '@/core/hooks/src/use-request-data';
```

- `@/core/hooks` / `@/core/hooks/src/use-x` 指向 apps-kit 共享 hooks。
- `@/hooks` 可能是 app-local alias，不等同于 apps-kit 共享 hooks；不要默认用 `@/hooks/useXxx` 创建或导入共享能力。
- 如果源码存在但 barrel 未导出：
  - app 内已有具体路径导入习惯时，可评估 `@/core/hooks/src/use-x`；
  - 需要公共出口时，评估补充 `packages/apps-kit/core/hooks/index.ts` 导出，并说明 SSG / SSR / apps-kit 影响范围。

## 查找流程

1. **按问题域定位类别**：先判断需求属于请求、路由、存储、倒计时、响应式、登录态、行情、钱包等哪一类。
2. **查 barrel**：读取 `packages/apps-kit/core/hooks/index.ts`，确认是否已有 public export。
3. **查源码**：读取或搜索 `packages/apps-kit/core/hooks/src/use-*.ts(x)`，确认未导出的实现、参数、返回值和副作用边界。
4. **查调用方**：搜索现有 `useXxx` 调用，复用项目已有 import 和使用方式。
5. **做复用决策**：
   - 已有 hook 完全满足：直接复用。
   - 已有 hook 部分满足：组合或扩展，避免平行实现。
   - 有源码但未导出：评估具体路径导入或补 barrel。
   - 确实没有：app 私有逻辑放 app 内；可跨 SSG/SSR 复用的能力再考虑沉淀到 `core/hooks`。

## hooks 能力地图

> 下表是导航清单，不替代源码事实。实际以 `packages/apps-kit/core/hooks/index.ts` 和 `src` 目录为准。

| 类别 | 优先查找的 hooks |
| --- | --- |
| 请求 / 数据 | `useRequestData`、`useRequest`、`useScrollLoadData`、`useLoadingList` |
| 路由 / 路径 | `useRouter`、`useRouterChange`、`useLastPathname`、`useLastPathSegment`、`useGroupidsDiffRedirect` |
| 存储 | `useLocalStorage`、`useSessionStorage`、`useIndexedDB` |
| 倒计时 / 时间 / 防抖 / 节流 | `useCountdown`、`useCountdownMs`、`useCountdownPoll`、`useCountdownValue`、`useTimeCountdown`、`useLocalCountdown`、`useSendCodeCountdown`、`useDebounce`、`useThrottle`、`useMountedWatch` |
| 响应式 / 设备 / DOM / 滚动 | `useResponsive`、`useDeviceCheck`、`useDeviceDownloadUrl`、`useDocumentClick`、`useElementWidth`、`useScrollDirection`、`useScrollVisibility`、`useTabbarScroll`、`useNetworkLatency` |
| 主题 / Native / 域名 / 全局配置 | `useTheme`、`changeAppTheme`、`useNativeAPP`、`NativeAppMethod`、`NativeAppRoute`、`useDomain`、`useSettingGlobal` |
| 登录 / KYC / 安全 | `useLoginEffect`、`useUserinfoState`、`useKycState`、`usePoaData`、`useGetPoaSupportCountry`、`useSecurityVerify`、`useGoogleLogin`、`useTelegramAuth` |
| 行情 / 钱包 / 汇率 / WebSocket | `useRate`、`useCurrencyScale`、`useAssetsCoinUnit`、`useCalcSwapAssets`、`useMiniChartData`、`useTickersData`、`useTokenCost`、`useWsPush` |
| UI 行为 | `useOpen`、`useModalSortVisible`、`MODAL_KEY`、`useCompositions` |
| 业务辅助 | `useBuyCryptoMenu`、`useCouponState`、`useCountryList`、`useFormatCryptoName`、`useSharedPromoData`、`useZendesk`、`useMoonxAddress`、`useOnlineById` |

## 常见复用建议

### 请求与接口

- 新增接口请求前，先查 `.claude/knowledge/discovery-api.md`。
- 请求状态、loading、轮询、滚动加载优先查 `useRequestData`、`useRequest`、`useScrollLoadData`、`useLoadingList`。
- 不要在页面中平行封装 `fetch` / `axios` 请求 hook。

### 路由

- 项目路由优先使用 `useRouter`，不要直接绕过项目封装使用 `next/router`。
- 路由变化监听先查 `useRouterChange`。
- 路径片段、上一个路径先查 `useLastPathname`、`useLastPathSegment`。

### 存储

- 本地存储优先使用 `useLocalStorage` 或 core store 中的 `localStorageApi`。
- session 存储优先使用 `useSessionStorage` 或 core store 中的 `SessionStorageApi`。
- IndexedDB 优先查 `useIndexedDB` 或 core store 的 `IDB`。
- SSR 首屏不要直接访问浏览器存储。

### 响应式与设备

- 纯样式响应式优先使用 `.claude/rules/responsive.md` 中的 `MediaInfo` CSS media。
- 只有资源、结构或复杂交互必须按设备切换时，再使用 `useResponsive`、`useDeviceCheck` 等 hook。
- 使用浏览器 API 的 hook 必须考虑 SSR / hydration 边界。

### 行情、钱包、交易

- 行情数据先查 `useTickersData`、`useMiniChartData`、`useWsPush`。
- 汇率、币种精度、资产单位先查 `useRate`、`useCurrencyScale`、`useAssetsCoinUnit`。
- swap 资产计算先查 `useCalcSwapAssets`，金融计算同时遵守 `.claude/rules/prototype.md` 和 `.claude/rules/typescript.md`。

## 新增 hook 前必须输出

在计划、实现或审查结论中，涉及新增 hook 时必须包含：

```text
hooks 查找：
- 已查入口：packages/apps-kit/core/hooks/index.ts、packages/apps-kit/core/hooks/src
- 可复用 hook：<useXxx / 未找到>
- 处理结论：<复用现有 / 组合现有 / 补导出 / 新增 app-local hook / 新增 core hook>
- 不复用原因：<如果新增，说明为什么现有 hooks 不满足>
- 影响范围：<SSG / SSR / apps-kit / app-local>
```

## Review 检查清单

- [ ] 新增 `use-*` hook 前是否查过 `packages/apps-kit/core/hooks`？
- [ ] 是否重复实现了请求、路由、存储、倒计时、防抖、节流、响应式、主题、登录态、行情、钱包、WebSocket 等已有 hooks？
- [ ] 是否误把 app-local `@/hooks` 当作 apps-kit 共享 hooks？
- [ ] 是否直接使用 `next/router`、`localStorage`、`sessionStorage` 或自封装请求 hook 绕过项目能力？
- [ ] 使用浏览器 API 的 hooks 是否处理 SSR / hydration 边界？
- [ ] 如果修改 `packages/apps-kit/core/hooks`，是否说明 SSG / SSR / apps-kit 影响并运行对应验证？
