# apps-icons 图标发现知识库

本文用于帮助 AI 在开发 BYDFi Web 功能时，快速定位和使用图标组件。图标来自 `packages/apps-icons`，通过 `@apps/icons` 别名引用。

---

## 使用方式

### 引入

```tsx
import { XIconoutlineSearch, XIconsolidDeposit } from '@apps/icons';
```

### 支持的 Props

```tsx
<XIconoutlineSearch
  size={24}           // 尺寸，number，单位 px，默认通常为 24
  color="#fff"        // 图标颜色（填充色），string，CSS 颜色值或 CSS 变量
  hoverColor="#aaa"   // hover 时的颜色，string
  style={{}}          // 内联样式，React.CSSProperties
  className=""        // 自定义 CSS 类名，string
/>
```

### 最佳实践

- 颜色优先使用 CSS 变量，禁止硬编码色值：
  ```tsx
  // ✅ 正确
  <XIconsolidWallet color="var(--spec-font-color-1)" />

  // ❌ 错误
  <XIconsolidWallet color="#333333" />
  ```
- 尺寸统一使用设计规范值：12 / 14 / 16 / 20 / 24 / 32 / 48。
- RTL 场景下方向性图标（left / right / up / down / arrow）需要在父级做 CSS 翻转，图标本身不处理 RTL。
- 不要用 `style` 覆盖 `color`；两者同时传入时 `color` prop 优先级更高。

---

## 命名规则

图标名称由前缀 `XIcon` + 风格分类 + 语义名称组成：

```
XIcon{分类}{语义名}
```

例如：`XIconoutlineSearch`、`XIconsolidDeposit`、`XIconcolorDepositDark01`

### 分类前缀速查

| 前缀 | 含义 | 使用场景 |
| --- | --- | --- |
| `outline` | 线框风格 | 通用 UI 操作图标，支持 color 自定义 |
| `solid` | 实心风格 | 强调状态、导航、功能入口 |
| `color` | 双色 / 彩色 | 深浅模式配对图标（Dark/Light 后缀） |
| `shortcut` | 快捷入口 | 首页快捷功能入口，含 Dark/Light 变体 |
| `status` | 状态图标 | 涨跌、选中、K 线类型、orderbook 方向等 |
| `signal` | 信号标签 | Web3 链上信号标签（鲸鱼、狙击手等） |
| `tabbar` | 底部 tab | App 底部导航栏，含选中状态变体 |
| `tradingview` | TradingView 工具 | K 线图工具栏专用图标 |
| `payment` | 支付方式 | 充值/付款渠道 Logo |
| `navbar` | 顶部导航 | 顶部导航栏活动入口 |
| `link` | 外链平台 | 社交媒体、区块链浏览器外链图标 |
| `media` | 媒体平台 | 社交媒体图标，含 On/Off 状态 |
| `launchpad` | Launchpad | Moonshot / Pump 平台图标 |
| `a-outline` | 特殊线框 | 少量特殊线框图标（emptystate / clock / giftbox）|
| `a-solid` | 特殊实心 | 少量特殊实心图标（fire / mpc-wallet 等）|
| `a-color` | 特殊彩色 | 少量特殊彩色图标（polygon / disable 等）|

---

## color / shortcut 图标的 Dark/Light 使用规范

`color` 和 `shortcut` 分类的图标通常成对出现，后缀区分深浅模式：

```tsx
// 根据当前主题动态选择
import { XIconcolorDepositDark01, XIconcolorDepositLight01 } from '@apps/icons';

const DepositIcon = ({ isDark }: { isDark: boolean }) => {
  const Icon = isDark ? XIconcolorDepositDark01 : XIconcolorDepositLight01;
  return <Icon size={24} />;
};
```

> color / shortcut 图标内部已内置颜色，通常不需要传 `color` prop。

---

## 模块速查表

### outline — 线框图标（高频使用）

常用图标速查：

| 语义 | 组件名 |
| --- | --- |
| 搜索 | `XIconoutlineSearch` / `XIconoutlineSearchx` |
| 关闭 | `XIconoutlineClose01` / `XIconoutlineClose02` |
| 复制 | `XIconoutlineCopy` / `XIconoutlineCopy02` |
| 下载 | `XIconoutlineDownload` |
| 刷新 | `XIconoutlineRefresh` |
| 筛选 | `XIconoutlineFilter` / `XIconoutlineFilter2` |
| 排序 | `XIconoutlineSort01` / `XIconoutlineSort02` / `XIconoutlineSort03` |
| 设置 | `XIconoutlineSettings01` / `XIconoutlineSettings02` / `XIconoutlineSettings03` |
| 编辑 | `XIconoutlineEdit01` / `XIconoutlineEdit02` |
| 删除 | `XIconoutlineDelete` |
| 分享 | `XIconoutlineShare` / `XIconoutlineShare01` / `XIconoutlineShare02` |
| 加号 | `XIconoutlinePlus` |
| 减号 | `XIconoutlineMinus` |
| 上 | `XIconoutlineUp` |
| 下 | `XIconoutlineDown` |
| 左 | `XIconoutlineLeft` |
| 右 | `XIconoutlineRight` |
| 问号提示 | `XIconoutlineQuestion` |
| 感叹号 | `XIconoutlineExclamation` |
| 警告 | `XIconoutlineWarn` |
| 钱包 | `XIconoutlineWallet` |
| 充值 | `XIconoutlineDeposit` |
| 提现 | `XIconoutlineWithdraw` |
| 转账 | `XIconoutlineTransfer01` / `XIconoutlineTransfer02` / `XIconoutlineTransfer03` |
| 历史 | `XIconoutlineHistory` |
| 邮件 | `XIconoutlineMail` |
| 手机 | `XIconoutlinePhone` / `XIconoutlinePhone01` |
| 锁 | `XIconoutlineLock` |
| 安全 | `XIconoutlineSafety` |
| 二维码 | `XIconoutlineQrcode` |
| 扫码 | `XIconoutlineScan` |
| 语言 | `XIconoutlineLanguage` |
| 主题 | `XIconoutlineDark` / `XIconoutlineLight` |
| K线 | `XIconoutlineKline` |
| 现货 | `XIconoutlineSpot` |
| 合约 | `XIconoutlineFutures` |
| 跟单 | `XIconoutlineCopytrade` |
| 机器人 | `XIconoutlineRobot` |
| 地球 | `XIconoutlineEarth` |
| 通知 | `XIconoutlineBell` |
| 日历 | `XIconoutlineCalendar` |
| 时钟 | `XIconoutlineTime` |
| 人物 | `XIconoutlinePeople` / `XIconoutlinePersonal01` / `XIconoutlinePersonal02` |
| 头像 | `XIconoutlineAvatar` |
| 相机 | `XIconoutlineCamera` |
| 文件 | `XIconoutlineFile` |
| 链接 | `XIconoutlineLink` |
| 更多 | `XIconoutlineMore01` / `XIconoutlineMore02` / `XIconoutlineMore03` |
| 退出 | `XIconoutlineExit` / `XIconoutlineQuit01` / `XIconoutlineQuit02` |
| 加载 | `XIconoutlineLoading` |

完整列表见 barrel 文件：`packages/apps-icons/src/index.ts`

---

### solid — 实心图标

常用图标速查：

| 语义 | 组件名 |
| --- | --- |
| 充值 | `XIconsolidDeposit` |
| 提现 | `XIconsolidWithdraw` / `XIconsolidWithdraw02` / `XIconsolidWithdraw03` |
| 转账 | `XIconsolidTransfer` / `XIconsolidTransfer01` |
| 钱包 | `XIconsolidWallet` |
| 现货 | `XIconsolidSpot` |
| 合约 | `XIconsolidFutures` |
| 跟单 | `XIconsolidCopytrade` |
| 机器人 | `XIconsolidTradingbots` |
| 警告 | `XIconsolidWarn` |
| 感叹号 | `XIconsolidExclamation` |
| 对话框-成功 | `XIconsolidDialogFinish` |
| 对话框-错误 | `XIconsolidDialogError` |
| 对话框-等待 | `XIconsolidDialogWait` |
| 对话框-警告 | `XIconsolidDialogWarn` |
| 通知 | `XIconsolidBell` |
| 头像 | `XIconsolidAvatar` / `XIconsolidAvatar01` |
| 锁 | `XIconsolidLock` |
| 邮件 | `XIconsolidMail` / `XIconsolidMail02` |
| 手机 | `XIconsolidPhone` |
| K线 | `XIconsolidKline` |
| 语言 | `XIconsolidLanguage` |
| 主题 | `XIconsolidDark` / `XIconsolidLight` |
| 复制 | `XIconsolidCopy` |
| 分享 | `XIconsolidShare` |
| 下载 | `XIconsolidDownload` |
| 搜索 | `XIconsolidSearch` |
| 设置 | `XIconsolidSettings` |
| 编辑 | `XIconsolidEdit` |
| 加号 | `XIconsolidPlus` |
| 减号 | `XIconsolidMinus` |
| 上 | `XIconsolidUp` / `XIconsolidUp2` |
| 下 | `XIconsolidDown` / `XIconsolidDown2` |
| 礼物 | `XIconsolidGift` |
| 活动 | `XIconsolidActivity` / `XIconsolidActivitycenter` |
| 安全 | `XIconsolidSafety` |

---

### status — 状态图标

主要用于 K 线、涨跌、orderbook、选择器、仓位方向。

```tsx
// 涨跌颜色
<XIconstatusUp />    // 上涨箭头
<XIconstatusDown />  // 下跌箭头

// 选择器
<XIconstatusSelectCircle00 />  // 未选中圆形
<XIconstatusSelectCircle01 />  // 选中圆形
<XIconstatusSelectCircle02 />  // 禁用圆形
<XIconstatusSelectSqure00 />   // 未选中方形（checkbox）
<XIconstatusSelectSqure01 />   // 选中方形
<XIconstatusSelectSqure02 />   // 禁用方形

// 收藏
<XIconstatusFavoritesOutline1 />  // 未收藏
<XIconstatusFavoritesSolid />     // 已收藏

// 关注
<XIconstatusFollowOutline />  // 未关注
<XIconstatusFollowSolid />    // 已关注

// 仓位方向
<XIconstatusPositionOneway />  // 单向持仓
<XIconstatusPositionTwoway />  // 双向持仓
```

K 线风格图标命名规律：`XIconstatusKline{颜色}{主题}[序号]`

```tsx
// 例：绿色上涨 K 线，深色模式
<XIconstatusKlineGreenDark />
<XIconstatusKlineGreenDark01 />

// 红色下跌 K 线，浅色模式
<XIconstatusKlineRedLight />
```

---

### signal — 链上信号标签

用于 Web3 / MoonX 页面展示链上地址特征标签，不支持 color 自定义（内置彩色）：

```tsx
<XIconsignalWhale />          // 鲸鱼
<XIconsignalSmartPump />      // 聪明钱拉盘
<XIconsignalEarlySniper />    // 早期狙击手
<XIconsignalKol />            // KOL
<XIconsignalDev />            // 项目方
<XIconsignalBot />            // 机器人
<XIconsignalFresh />          // 新钱包
<XIconsignalBurn />           // 销毁
<XIconsignalLock />           // 锁仓
```

---

### payment — 支付渠道

```tsx
<XIconpaymentVisa />
<XIconpaymentMaster />
<XIconpaymentVisaMaster />
<XIconpaymentApple />
<XIconpaymentGoogle />
<XIconpaymentPix />
<XIconpaymentSepa />
<XIconpaymentWire />
<XIconpaymentFiat />
<XIconpaymentThird />
<XIconpaymentSelected />
<XIconpaymentTips />
```

---

### tradingview — K 线图工具栏

```tsx
<XIcontradingviewBrush />    // 画笔
<XIcontradingviewCross />    // 十字
<XIcontradingviewDrawing />  // 绘图
<XIcontradingviewFib />      // 斐波那契
<XIcontradingviewMagnet />   // 磁铁
<XIcontradingviewMeasure />  // 测量
<XIcontradingviewZoom />     // 缩放
<XIcontradingviewLock />     // 锁定
<XIcontradingviewHide />     // 隐藏
<XIcontradingviewRemove />   // 删除
<XIcontradingviewText />     // 文字
<XIcontradingviewTrend />    // 趋势线
<XIcontradingviewPosition /> // 仓位线
<XIcontradingviewPatterns /> // 形态
<XIcontradingviewObject />   // 对象
<XIcontradingviewIcon />     // 图标
```

---

### tabbar — 底部导航

```tsx
// 默认（未选中）
<XIcontabbarHome />
<XIcontabbarMarket />
<XIcontabbarSpot />
<XIcontabbarFutures />
<XIcontabbarAssets />

// 选中状态（含主题/品牌变体）
// 命名规律：XIcontabbar{Tab}Selected{Kor|Main}{Dark|Light}
<XIcontabbarHomeSelectedMainDark />
<XIcontabbarHomeSelectedMainLight />
<XIcontabbarHomeSelectedKorDark />
<XIcontabbarHomeSelectedKorLight />
```

---

## AI 查找建议

```text
1. 先按风格分类确定前缀（outline / solid / color / shortcut / status）。
2. 在本文速查表里找对应语义。
3. 找不到时，在 barrel 文件里搜索关键词：
   rg "XIcon.*{关键词}" packages/apps-icons/src/index.ts --ignore-case
4. color / shortcut 类图标注意选对 Dark/Light 变体。
5. 确认引入路径使用 @apps/icons，不要直接引用子路径。
```

常用搜索命令：

```bash
# 搜索特定语义图标
rg "XIcon.*deposit" packages/apps-icons/src/index.ts --ignore-case

# 搜索某分类所有图标
rg "XIconoutline" packages/apps-icons/src/index.ts

# 确认图标在业务代码中的用法
rg "XIconoutlineSearch" apps packages --include="*.tsx" -l
```

---

## 新增图标规范

> 图标由设计统一出，开发不得手动新增 SVG；如需新图标，走设计提交 icons 更新流程。

新图标合入后需确认：

```text
1. packages/apps-icons/src/index.ts 已新增对应 export
2. 组件文件路径符合 icon-{分类}-{语义}.tsx 命名约定
3. 不得修改 @apps/icons 之外的 package.json 或引入新依赖
```
