---
name: bydfi-knowledge-discovery-components
description: 了解 packages/apps-kit/components 公共组件能力、导入路径、组件分类与复用流程。开发、修复或审查 React/TSX UI 前使用，避免重复实现已有组件。
disable-model-invocation: true
allowed-tools: Read, Bash, Grep, Glob
---

# apps-kit/components 公共组件发现流程

`packages/apps-kit/components` 是 BYDFi Web 的共享 React 组件池，主要服务 SSG / SSR 应用的页面组件、业务组件和基础 UI 封装。开发、修复、重构或审查 React/TSX UI 时，先查这里是否已有可复用组件；只有确认无法复用时，才考虑新增 app-local 组件或沉淀新的共享组件。

## 何时使用

遇到以下场景时先读本 knowledge：

- 新增页面、区块、表单、弹窗、表格、图表、空状态、图片、按钮、选择器、输入框、Tooltip、Drawer、响应式结构。
- 修复或审查“组件库使用规范”问题，例如原生 `<img>`、`<select>`、`<a>`、直接使用 antd Modal/Input/Tooltip/Table。
- 需要查找账号登录/注册/安全验证、header/footer、活动、客服机器人、钱包头像、币种选择等业务组件。
- 修改 `packages/apps-kit/components` 内组件，或计划把 app-local 组件沉淀为共享组件。

## import 与 alias 约定

- 源码目录：`packages/apps-kit/components/<component>`。
- 应用内常见导入：

```ts
import Image from '@/components/image';
import { BasicInput, INPUT_TYPE } from '@/components/basic-input';
import { BasicModal } from '@/components/modal';
import ProTooltip from '@/components/tooltip';
import Table, { Pagination } from '@/components/table';
import { Desktop, Mobile, Tablet } from '@/components/responsive';
```

- SSR/SSG 中 `@/components/*` 通常映射到 `packages/apps-kit/components/*` 或 app 本地 `src/components/*`。写 import 前必须结合当前 app 的 alias 和已有调用确认实际解析路径。
- 可显式使用 `@apps/kit/components/*` 时，优先沿用同目录既有 import 风格，避免同一模块混用 alias。
- `packages/apps-ui` 另有一套基础 UI（如 `@apps/ui/select`）。本文件只覆盖 `packages/apps-kit/components`；若需求明确是 apps-ui 组件，应另查 `packages/apps-ui/src/components`。

## 查找流程

1. **按 UI 类型定位组件目录**：表单查 `basic-input` / `numeric-input` / `select`；弹窗查 `modal` / `mobile-modal` / `drawer`；数据展示查 `table` / `empty` / `new-pagination`；图片查 `image` / `coin-logo`。
2. **先查入口文件**：读取 `packages/apps-kit/components/<name>/index.ts(x)`，确认 public export、默认导出、动态导出和类型导出。
3. **查内部实现与类型**：再读取同目录 `types.ts`、`styled.tsx`、子组件和示例文档（如 `account/index.md`、`chart/k-chart/doc.md`）。
4. **查调用方**：搜索现有 import 和 JSX 用法，复用项目已有 props、className、弹窗挂载、SSR 动态导入等模式。
5. **做复用决策**：
   - 现有组件满足：直接复用。
   - 现有组件部分满足：通过 props / 组合 / 样式覆盖实现，避免平行造轮子。
   - 组件存在但入口未导出：评估是否补 barrel 或使用具体路径，并说明影响范围。
   - 确实没有：app 私有 UI 留在 app；跨 SSG/SSR 可复用再考虑新增到 `packages/apps-kit/components`。

## 组件能力地图

> 下表是导航清单，不替代源码事实。实际以 `packages/apps-kit/components/**/index.ts(x)` 和调用方为准。

| 类别 | 目录 / 入口 | 主要导出 / 用途 | 优先场景与注意事项 |
| --- | --- | --- | --- |
| 账号与安全 | `account/index.tsx` | `EntryPoint` 及 login/register/forget/security/verify 子模块 | 登录、注册、找回密码、安全验证、第三方绑定。强业务组件，修改需关注登录态、验证码、风控和 i18n。 |
| 活动组件 | `activity/*` | `activity2888`、`common-activity`、`missions-activity` | 活动页复用组件，通常带业务配置和活动状态。 |
| Alert | `alert/index.tsx` | 默认导出 Alert 视图 | 轻量提示展示；函数式弹窗优先查 `modal/alert-function`。 |
| Antd Provider | `antd-config-provider/index.tsx` | `AntdLanguageConfigProvider`、`AntdThemeConfigProvider` | 配置 antd 语言与主题；不要在页面私自重复包 provider。 |
| 滚动条 | `auto-hide-scrollbar/index.tsx` | `AutoHideScrollBar` | 自动隐藏滚动条容器。 |
| 头像 | `avatar/index.tsx` | default `Avatar`、`getDefaultAvatarPath` | 用户头像展示。钱包头像查 `wallet-avatar`。 |
| 输入框 | `basic-input/index.ts` | `BasicInput`、`AmountInput`、`PasswordInput`、`PinInput`、`SearchInput`、`SearchInputV2`、`INPUT_TYPE` | 表单输入优先使用，避免原生 input 或 antd Input。金额输入涉及金融规则，需避免原生浮点计算。 |
| 按钮 | `button/index.tsx` | `Button`、`ButtonProps` | 通用按钮。若页面已有 app 专用按钮风格，先复用现有风格。 |
| Checkbox | `checkbox-v2/index.tsx`、`checkbox-v3/index.tsx` | `CheckboxV2`、`CheckboxV3` | 优先使用项目封装，不直接用 antd Checkbox。按调用方选择 v2/v3。 |
| 关闭图标 | `close-icon/index.tsx` | default `CloseIcon` | 弹窗、Drawer 等关闭按钮。图标规范仍优先 `@apps/icons`，此组件适合已有封装场景。 |
| 币种 Logo | `coin-logo/index.tsx` | default `CoinLogo` | 币种、法币、交易对 logo 展示。选择币种弹窗查 `select-coin`。 |
| 通用图标 | `common-icon/index.tsx` | default `CommonIcon`、`AssetValueToggle` | 常见业务图标；新增图标仍优先查 `@apps/icons`。 |
| 组合图标 | `compose-icon/index.tsx` | `ComposeIcon` | 深浅图标组合展示。 |
| Cookie | `cookie/index.ts` | `Cookie` dynamic ssr false | Cookie 弹窗/组件，已做 client-only 动态加载。 |
| 倒计时 | `count-down/index.tsx` | `CountDown` | 展示倒计时；倒计时逻辑 hook 先查 `.claude/knowledge/discovery-hooks.md`。 |
| 日期选择 | `date-picker/index.tsx` | `DatePicker` | 日期选择器。范围选择查 `date-range-picker`。 |
| 日期范围 | `date-range-picker/index.tsx` | `DateRangePicker`、`DATE_TODAY` | 日期范围选择，移动端子组件在 `mobile-range-picker.tsx`。 |
| Drawer | `drawer/index.tsx` | `MobileDrawer`、`BottomDrawer` dynamic ssr false | 移动端抽屉/底部抽屉，避免直接使用 antd Drawer。 |
| 登录态动态组件 | `dynamic-by-login/index.tsx` | `DynamicByLogin` | 按登录状态动态加载组件。 |
| ECharts | `echarts/index.tsx` | `echarts`、ECharts 类型 | 图表底层能力。具体图表优先查 `chart/*`。 |
| Empty | `empty/index.tsx` | `EmptyComponent` dynamic ssr false | 空状态优先使用，避免手写空数据块。 |
| Error | `error/index.tsx`、`error/error-boundary.tsx` | default `Error`、`ErrorBoundary` | 页面错误展示和关键模块错误边界。 |
| Footer | `footer/index.tsx` | `Footer` | 站点 footer。 |
| 底部 TabBar | `footer-tab-bar/index.tsx` | default `FooterTabBar` | 移动端底部导航。 |
| 横向渐隐滚动 | `gradien-scroll-row/index.tsx` | `GradienScrollRow` | 横向滚动行，两侧渐隐效果。 |
| Header | `header/index.tsx` | `Header`、`HeaderComponentProps` | 站点 header、移动 header、菜单、下载入口等。修改需关注 SSR/SSG、多语言、登录态。 |
| SEO 隐藏元素 | `hidden-seo-element/index.tsx` | `HiddenSeoElement` | SEO H1 等隐藏内容。 |
| 本地 Icon | `icon/index.ts` | `CloseIcon`、`StarIcon` | 少量本地 icon；新增图标优先查 `@apps/icons`。 |
| 内嵌 iframe | `iframe-internal/index.tsx` | `IframeInternal` | 内部 iframe，含主题消息监听。注意 client-only 边界。 |
| Image | `image/index.tsx` | default `Image` | 图片必须优先使用项目封装，禁止原生 `<img>` 与直接 `next/image`。 |
| 图片预览 | `image-preview-modal/index.tsx` | default `ImagePreviewModal` | 图片预览弹窗。 |
| 自动填充防护 | `input-hide-auto-complete/index.tsx` | `InputHideAutoComplete`、`InputHideAutoCompleteInputs` | 处理浏览器 autocomplete 干扰。 |
| Layouts | `layouts/*` | login/register/sidebar/third-part/universal 布局 | 账号、侧边栏、第三方等布局组件，无统一 index，按文件查。 |
| 懒加载组件 | `lazy-component/index.tsx` | `BLC` | 构建懒加载组件。 |
| Link | `link/index.tsx` | `ExternalLink`、`linkClassName`、`linkStyles` | 外链使用 `ExternalLink`；内部路由优先 `TrLink`。禁止原生 `<a>` 处理项目路由。 |
| Loading | `loading/index.tsx` | `Loading` class | 全局/局部 loading 能力；视图组件在 `loading-view.tsx`。 |
| Menu/Nav | `menu/index.tsx`、`nav/index.tsx` | default `Menu`、default `Nav` | 菜单和导航展示。 |
| 移动端 Modal | `mobile-modal/index.tsx` | `MobileModal`、`BottomModal`、`ButtonModal`、`DefaultModal`、`DrawerModal`、`ModalClose` | 移动端弹窗场景优先使用。 |
| Modal | `modal/index.tsx` | `BasicModal`、`AlertModal`、`confirmModal`、`controlAlertModal`、`TipModal`、`TransferModal`、`MobileShare`、`IdentityVerificationModal` 等 | 弹窗优先使用项目封装，避免直接 antd Modal。大量组件 dynamic `ssr:false`，注意只在客户端交互中打开。 |
| Pagination | `new-pagination/index.tsx`、`table/pagination.tsx` | default `NewPagination`、`Pagination` | 分页组件；表格分页优先随 `Table` 使用。 |
| 数字输入 | `numeric-input/index.tsx` | `NumericInput`、`DecimalInput` | 数值输入，金额/价格输入优先查；金融计算仍遵守 prototype / BN 规则。 |
| QR Code | `qr-code-refresh/index.tsx` | `QRCodeRefresh` | 可刷新二维码。 |
| 汇率文字 | `rate-text/index.tsx` | `RateText` | 汇率/换算文本展示。 |
| 复制 | `react-copy-to-clipboard/index.tsx` | `CopyToClipboard` | 复制到剪贴板封装。 |
| 响应式组件 | `responsive/index.tsx` | `Desktop`、`SmallDesktop`、`DesktopOrTablet`、`Mobile`、`MobileOrTablet`、`Tablet`、`MiddleDesktop`、`XlDesktop`、`XllDesktop` | 结构必须按设备拆分时使用；纯样式响应式优先 `MediaInfo` CSS media。 |
| 响应式容器 | `responsive-container/index.tsx` | default `ResponsiveContainer` | 监听容器尺寸/自适应渲染。 |
| 富文本图片预览 | `rich-text-with-image-preview/index.tsx` | default `RichTextWithImagePreview` | 富文本内容中图片预览。 |
| 滚动处理 | `scroll-handle/index.tsx`、`scroll-x-wrap/index.tsx` | `handleInitAppScroll`、`ScrollXWrap` | App 滚动初始化与横向滚动容器。 |
| Select | `select/index.tsx` | `Select` | apps-kit 的下拉选择封装（基于 `react-dropdown-select`）。若项目要求 apps-ui Select，则用 `@apps/ui/select`。禁止原生 `<select>`。 |
| 选择币种 | `select-coin/index.tsx` | default `SelectCoin` | 币种选择。涉及转账/弹窗也查 `modal/select-coin-model`、`modal/transfer`。 |
| 选择国家 | `select-country/index.tsx` | default `SelectCountry`、`SelectCountryMultiple`、`SelectItem` | 国家/区号选择。 |
| 客服机器人 | `service-robot/index.tsx` | default `ServiceRobot` | Zendesk/客服机器人入口与搜索、常见问题。 |
| 分享弹窗 | `share-pop/index.tsx` | default `SharePop`、`SHARE_MEDIA` | 社媒分享弹窗/菜单。 |
| Slider | `slider/index.tsx` | `AppSlider` | 滑块输入/区间。 |
| Svg | `svg/index.tsx` | `Svg` | SVG 渲染封装。新增图标仍优先 `@apps/icons`。 |
| Switch | `switch/index.tsx` | `Switch` | 开关组件，避免直接用 antd Switch。 |
| TabBar | `tab-bar/index.tsx` | default `TabBar` | Tab 导航组件。 |
| Table | `table/index.tsx` | default `Table`、`Table`、`Pagination` | 表格优先使用项目封装；支持 Desktop/Mobile/Tablet 切换和空状态封装。 |
| Tags | `tags/index.tsx` | default `Tags` | 标签展示。 |
| Tooltip | `tooltip/index.tsx` | default `ProTooltip`、`TOOLTIP_THEME_TYPE` | Tooltip 必须优先用项目封装，避免直接 antd Tooltip。 |
| 钱包头像 | `wallet-avatar/index.tsx` | `WalletAvatar`、`WalletAvatarColors`、`WalletAvatarDefaultAvatar` 等 | 钱包/账户头像生成与展示。 |
| Lottie | `with-lottie/index.tsx` | default `WithLottie` | Lottie 动画封装。 |
| Zendesk | `zendesk.tsx` | 单文件组件 | Zendesk 客服入口，未在目录 index 中导出。 |

## 强规则关联组件

以下组件与 `.claude/rules/react-tsx.md` 的组件库规则直接相关：

- 图片：`@/components/image`，禁止原生 `<img>` 和直接 `next/image`。
- 输入框：`@/components/basic-input`，优先 `BasicInput` / `AmountInput` / `PasswordInput` / `SearchInputV2`。
- 下拉：`@/components/select` 或 `@apps/ui/select`（按当前项目要求与现有调用选择），禁止原生 `<select>`。
- 弹窗：`@/components/modal`、`@/components/mobile-modal`、`@/components/drawer`，避免直接 antd Modal/Drawer。
- Tooltip：`@/components/tooltip`，禁止直接 antd Tooltip。
- 表格：`@/components/table`，优先项目封装 Table 与 Pagination。
- 空状态：`@/components/empty`。
- 链接：外链 `@/components/link` 的 `ExternalLink`；内链用 `@/core/i18n` 的 `TrLink`。
- 响应式结构：`@/components/responsive`；纯样式仍优先 `MediaInfo`。
- 日期：`@/components/date-picker`、`@/components/date-range-picker`。
- 按钮/勾选/开关：`@/components/button`、`@/components/checkbox-v2|checkbox-v3`、`@/components/switch`。
- 图标：业务封装查 `common-icon` / `coin-logo`；通用 icon 仍优先 `@apps/icons`。

## 新增或修改组件前必须输出

涉及 UI 组件复用、新增共享组件、或修复组件库使用规范时，在计划、实现或审查结论中包含：

```text
components 查找：
- 已查入口：packages/apps-kit/components/<目录>/index.ts(x)；<调用方搜索范围>
- 可复用组件：<组件名 / 未找到>
- 导入方式：<@/components/x / @apps/kit/components/x / 其他既有路径>
- 处理结论：<复用现有 / 组合现有 / 补导出 / 新增 app-local 组件 / 新增 apps-kit 组件>
- 不复用原因：<如果新增，说明为什么现有组件不满足>
- 影响范围：<SSG / SSR / apps-kit / app-local>
```

## Review 检查清单

- 是否直接使用了原生 `<img>`、`<select>`、项目路由 `<a>`，或直接使用 antd Modal/Input/Tooltip/Table/Drawer？
- 是否先查了 `packages/apps-kit/components` 和现有调用方？
- 是否误把 app-local `src/components` 当作共享组件？
- 组件是否已有 dynamic `ssr:false` 约束，新增调用是否符合 SSR/SSG 边界？
- 是否为 UI 改动补充深/浅、黄/蓝、RTL、PC/Tablet/Mobile 影响说明？
- 修改共享组件时是否说明 SSG / SSR / apps-kit 内部影响，并运行对应验证？
