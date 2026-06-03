---
name: responsive-rules
description: PC / Tablet / Mobile 响应式规则
figma: nilu
---

# Responsive 规则

本规则适用于 BYDFi Web 中所有 PC、平板、手机端响应式布局，尤其是 styled-jsx 中的 `@media ${MediaInfo.*}` 写法。

本规则基于 `packages/apps-kit/core/utils/src/media-info.ts` 的断点定义，以及 `apps/bydfi-ssg/src/pages/[locale]` 中大量页面的实际写法总结。

## 必读 rules

按改动范围读取：

- `.claude/rules/styled-jsx.md`：styled-jsx、`:global()`、重复类名、手写断点、RTL。

## 1. 断点来源

响应式断点必须优先使用项目封装的 `MediaInfo`，不要在新代码中随意手写断点。

```ts
import { MediaInfo } from '@/core/utils/src/media-info';
```

`MediaInfo` 当前断点：

| 名称 | 范围 | CSS 写法 | 适用场景 |
| --- | --- | --- | --- |
| `mobile` | `< 768px` | `@media ${MediaInfo.mobile}` | 手机端专项样式 |
| `tablet` | `768px ~ 1024px` | `@media ${MediaInfo.tablet}` | 平板端专项样式 |
| `desktop` | `> 1024px` | `@media ${MediaInfo.desktop}` | PC 端专项样式 |
| `mobileOrTablet` | `<= 1024px` | `@media ${MediaInfo.mobileOrTablet}` | 移动端 + 平板统一降级 |
| `desktopOrTablet` | `>= 768px` | `@media ${MediaInfo.desktopOrTablet}` | 非手机端样式 |
| `smallDesktop` | `1024px ~ 1200px` | `@media ${MediaInfo.smallDesktop}` | 小桌面适配 |
| `middleDesktop` | `>= 1440px` | `@media ${MediaInfo.middleDesktop}` | 大屏增强 |
| `notMiddleDesktop` | `< 1440px` | `@media ${MediaInfo.notMiddleDesktop}` | 中小屏收敛 |

注意：

- `tablet` 包含 `1024px`，`desktop` 从 `1025px` 开始。
- `smallDesktop` 从 `1024px` 开始，与 `tablet` 在 `1024px` 有边界重叠，使用时必须确认覆盖顺序。
- `MediaInfo.windowWidth` / `isMobile` / `isTablet` / `isDesktop` 依赖 `window`，SSR 首屏中不要直接用它决定首屏 DOM。

## 2. 基本原则

- 纯布局、间距、字号、显示隐藏优先使用 CSS media query。
- 只有资源路径、组件结构、复杂交互逻辑必须按设备切换时，才使用响应式组件或 hook。
- 默认先写 PC / 通用样式，再用 `tablet`、`mobile` 或 `mobileOrTablet` 逐步降级。
- 页面容器 PC 端必须有合理最大宽度，常见写法是 `max-width: var(--const-max-page-width); margin: 0 auto; width: 100%;`。
- 平板端通常降低左右 padding、减少 gap、从多列降为 2 列。
- 手机端通常降低 padding、字号、gap，并将横向布局改为纵向布局或单列。
- 移动端必须检查 375px 宽度下是否横向溢出。
- 多语言长文案必须考虑换行、按钮宽度、tab 横向滚动、`min-width: 0`、`word-break`、省略号。
- RTL 场景优先使用逻辑属性：`padding-inline-*`、`margin-inline-*`、`inset-inline-*`、`text-align: start/end`。

## 3. PC / Tablet / Mobile 分层策略

### 3.1 PC 端

PC 端用于建立完整布局：最大宽度、多列、较大留白、完整图片或插画展示。

推荐：

```tsx
<style jsx>{`
  .section {
    width: 100%;
    padding: 80px 24px;
  }
  .inner {
    max-width: var(--const-max-page-width);
    margin: 0 auto;
    width: 100%;
  }

  @media ${MediaInfo.desktop} {
    .grid {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
  }
`}</style>
```

原则：

- 内容不要无限拉伸，必须有最大宽度。
- PC 端可展示完整插画、侧栏、多列卡片、复杂表格。
- 大屏增强用 `middleDesktop`，不要用随机 `@media (min-width: 1920px)`，除非设计稿明确要求并说明原因。

### 3.2 Tablet 端

平板端通常不是简单放大手机，也不是压缩 PC；需要独立考虑 768px ~ 1024px 的空间。

常见处理：

```tsx
@media ${MediaInfo.tablet} {
  .content {
    padding: 0 20px;
  }
  .grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
```

原则：

- 多列布局一般从 3 / 4 列降为 2 列。
- 左右 padding 常见为 20px / 24px / 32px，按页面已有风格决定。
- 表格可保留表格结构，但要检查横向滚动、固定列、操作按钮数量。
- 平板端常与手机共享部分降级样式，可用 `mobileOrTablet`；但字号、列数、展示隐藏经常需要单独 `tablet` 处理。

### 3.3 Mobile 端

手机端优先保证不溢出、可读、可点击、关键信息优先。

常见处理：

```tsx
@media ${MediaInfo.mobile} {
  .section {
    padding: 48px 16px;
  }
  .title {
    font-size: 24px;
    line-height: 32px;
  }
  .grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }
  .actions {
    flex-direction: column;
  }
}
```

原则：

- 页面左右 padding 常见为 15px / 16px / 20px，按页面已有风格决定。
- 多列网格降为单列。
- 横向 flex 必要时改为 `flex-direction: column`。
- 大标题必须降级，避免 32px+ 标题挤压或换行异常。
- 按钮区域可改为整行按钮或纵向堆叠。
- 表格优先改卡片式、横向滚动或隐藏低优先级列。
- Tab、分类、标签等可横向滚动，并隐藏 scrollbar，但必须保留可访问的滚动体验。

## 4. 常见模式

### 4.1 容器 padding 降级

来自 `apps/bydfi-ssg/src/pages/[locale]/vip/index.page.tsx` 的常见模式：PC 使用页面默认间距，tablet / mobile 分别降低 padding 与 gap。

```tsx
.content {
  width: 100%;
  margin-top: 48px;
  gap: 68px;

  @media ${MediaInfo.tablet} {
    padding: 0 20px;
  }

  @media ${MediaInfo.mobile} {
    padding: 0 16px;
    gap: 24px;
  }
}
```

### 4.2 移动端与平板统一降级

来自 `apps/bydfi-ssg/src/pages/[locale]/account-control/index.page.tsx` 的常见模式：PC 居中最大宽度，`mobileOrTablet` 统一改为紧凑纵向布局。

```tsx
.wrapper {
  max-width: 1144px;
  width: 100%;
  margin: 0 auto;
  padding: 40px 0;

  @media ${MediaInfo.mobileOrTablet} {
    padding: 24px 15px;
    display: flex;
    flex-direction: column;
    gap: 40px;
  }
}
```

适用：移动端和平板都需要从 PC 布局降级，且差异不大。

### 4.3 PC / Tablet / Mobile 分别处理

来自 `apps/bydfi-ssg/src/pages/[locale]/about/components/banner.tsx` 的常见模式：PC 显示插画，tablet 保持较大高度与 padding，mobile 降字号、降高度、隐藏图片。

```tsx
.banner {
  @media ${MediaInfo.desktop} {
    height: 450px;
  }

  @media ${MediaInfo.tablet} {
    height: 450px;
  }

  @media ${MediaInfo.mobile} {
    .box {
      min-height: 280px;
      padding: 40px 16px;
    }
    .title {
      font-size: 22px;
    }
    .text {
      font-size: 14px;
    }
  }
}
```

适用：营销 banner、首屏、图文分栏等 PC 与移动端差异较大的模块。

### 4.4 网格列数降级

来自 `apps/bydfi-ssg/src/pages/[locale]/community/index.page.tsx` 的常见模式：PC 三列，tablet 两列，mobile 单列。

```tsx
.community-list {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 68px;

  @media ${MediaInfo.tablet} {
    grid-template-columns: repeat(2, 1fr);
    width: 100%;
  }

  @media ${MediaInfo.mobile} {
    grid-template-columns: repeat(1, 1fr);
    width: 100%;
  }
}
```

适用：卡片、社区入口、功能列表、资产列表等。

### 4.5 设备展示隐藏

常见写法：同一个模块在不同端展示不同位置或不同形态。

```tsx
.tablet-only {
  display: flex;

  @media ${MediaInfo.desktop} {
    display: none;
  }

  @media ${MediaInfo.mobile} {
    display: none;
  }
}
```

原则：

- 展示隐藏优先用 CSS；避免 SSR 首屏因 JS 设备判断导致 hydration 不一致。
- 如果不同端结构完全不同，再考虑响应式组件或 `useResponsive`。
- 隐藏内容不能导致 SEO 关键内容或可访问性关键路径缺失。

### 4.6 表格移动端卡片化

来自 `apps/bydfi-ssg/src/pages/[locale]/futures-copy-trading/table-style.tsx` 的常见模式：PC / tablet 保留表格，mobile 下定制卡片式行。

```tsx
@media ${MediaInfo.mobile} {
  :global(.mobile-table-card) {
    background-color: var(--spec-background-color-2);
    padding: 16px;
    border-bottom: none !important;
    border-radius: 8px;
    margin-top: 12px !important;
  }
}
```

原则：

- 金融表格在 mobile 下优先保证核心字段可读。
- 操作按钮、金额、状态、时间等信息要重新排序，避免横向挤压。
- 如果保留横向滚动，必须确保滚动容器明确、固定列不遮挡、操作区可触达。

## 5. CSS media 与 JS 响应式判断

### 5.1 优先使用 CSS media

适用：

- padding、margin、gap。
- font-size、line-height。
- grid / flex 布局。
- display none / block。
- 图片尺寸、卡片宽度。

### 5.2 谨慎使用 JS 判断

`MediaInfo.isMobile`、`MediaInfo.isTablet`、`useResponsive` 等适用于：

- 不同端请求不同资源。
- 不同端渲染完全不同组件结构。
- 表格列配置、fixed 列、滚动高度、弹窗挂载容器等确实需要 JS 参与。
- 交互行为在不同端不同。

禁止：

- 为普通 CSS 样式切换引入 JS 判断。
- SSR 首屏直接用 `window` 相关值决定结构，导致服务端和客户端不一致。

## 6. 禁止事项

- 禁止新代码随意手写断点，如 `@media (max-width: 768px)`、`@media (min-width: 1024px)`；优先使用 `MediaInfo`。
- 禁止只写 PC 样式，不处理 tablet / mobile。
- 禁止 mobile 下固定大宽度导致横向溢出。
- 禁止用 JS 响应式判断处理纯样式问题。
- 禁止为修移动端布局粗暴隐藏核心内容。
- 禁止忽略 RTL 下的左右间距、箭头、绝对定位。
- 禁止在响应式中新增硬编码颜色；样式仍需遵守 `theme.md`。

## 7. 检查清单

提交前确认：

- [ ] 是否使用 `MediaInfo` 而不是手写断点？
- [ ] PC 是否有最大宽度与合理留白？
- [ ] Tablet 是否独立检查 768px ~ 1024px？
- [ ] Mobile 是否检查 375px 宽度无横向溢出？
- [ ] 多列布局是否在 tablet / mobile 合理降级？
- [ ] 表格 / 列表在 mobile 是否可读、可滚动、可操作？
- [ ] 按钮和点击区域在 mobile 是否足够大？
- [ ] 多语言长文案是否不会撑破容器？
- [ ] RTL 下左右方向、箭头、定位是否正确？
- [ ] 是否避免了 SSR hydration 风险？
