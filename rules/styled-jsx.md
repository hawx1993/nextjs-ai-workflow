---
name: styled-jsx-rules
description: styled-jsx 样式规则
author: nilu
---

# Styled JSX 规则

本规则适用于 BYDFi Web 中所有通过 `<style jsx>`、`<style jsx global>`、`styled-jsx/css` 编写的样式。项目已安装并启用 `postcss`、`postcss-rtlcss`，支持样式嵌套与 RTL 转换；编写时应优先利用现有 PostCSS 能力，不要绕过项目样式体系。

## 1. 基本原则

- 默认使用 `<style jsx>` 编写组件局部样式，避免样式泄漏到其他组件。
- 样式必须遵守 `.claude/rules/theme.md`：颜色使用 CSS 变量，禁止硬编码色值。
- 涉及用户可见文案的伪元素内容不得硬编码；优先在 JSX 中通过 `LANG` 输出文案。
- UI 改动必须考虑黄色 / 蓝色、深色 / 浅色、LTR / RTL、PC / Tablet / Mobile。
- 样式应跟随组件结构组织，保持选择器简单、可读、可维护。
- 禁止为了覆盖样式滥用高权重选择器、`!important`、深层全局选择器。
- 禁止引入 Tailwind、CSS Modules、styled-components、Emotion 等新 CSS 方案替代 styled-jsx。

## 2. Scoped Styles

### 2.1 默认使用局部作用域

组件内部样式优先使用：

```tsx
const Card = () => {
  return (
    <div className='card'>
      <div className='title'>Title</div>
      <style jsx>{`
        .card {
          padding: 16px;
          color: var(--spec-font-color-1);
        }
        .title {
          font-weight: 600;
        }
      `}</style>
    </div>
  );
};
```

要求：

- 根节点建议有明确 className，避免直接依赖 `div`、`section` 等标签选择器。
- className 使用语义化命名，如 `.card`、`.title`、`.action-list`。
- 不要依赖 styled-jsx 自动生成的 className。
- 不要用 scoped style 试图影响子组件内部 DOM；子组件样式应在子组件内维护。

### 2.2 选择器层级控制

推荐：

```tsx
<style jsx>{`
  .panel {
    display: flex;
    flex-direction: column;
    gap: 16px;

    .panel-title {
      color: var(--spec-font-color-1);
    }
  }
`}</style>
```

禁止：

```tsx
<style jsx>{`
  .page .section .panel .content .list .item .title span {
    color: var(--spec-font-color-1);
  }
`}</style>
```

要求：

- 选择器嵌套一般不超过 3 层。
- 能通过新增语义 className 解决的，不通过深层 DOM 结构选择器解决。
- 列表、状态、变体优先使用 className 表达，如 `.is-active`、`.is-disabled`、`.is-loading`。

### 2.3 同一类名块合并

同一 `<style jsx>` 中同一类名不要重复拆散定义，响应式也尽量合并在同一类名块内，便于维护和覆盖顺序判断。

```tsx
<style jsx>{`
  /* ❌ 禁止重复拆散 */
  .name {
    color: var(--spec-font-color-1);
  }
  .name {
    @media ${MediaInfo.mobile} {
      color: var(--spec-font-color-2);
    }
  }

  /* ✅ 合并 */
  .name {
    color: var(--spec-font-color-1);

    @media ${MediaInfo.mobile} {
      color: var(--spec-font-color-2);
    }
  }
`}</style>
```

## 3. Global Styles

### 3.1 谨慎使用 `<style jsx global>`

仅以下场景允许使用全局样式：

- 页面级 reset 或基础布局样式。
- 覆盖第三方组件、外部注入 DOM、无法传入 className 的节点。
- 需要影响 `body`、`html`、全局容器等非组件内部节点。

```tsx
<style jsx global>{`
  body {
    background: var(--spec-background-color-1);
  }
`}</style>
```

要求：

- 全局样式必须尽量限定在页面或模块根 className 下。
- 禁止在普通组件中写大范围全局 reset。
- 禁止使用全局样式覆盖无关页面或无关业务模块。

### 3.2 使用 `:global()` 时必须收窄范围

推荐：

```tsx
<div className='select-wrap'>
  <Select />
  <style jsx>{`
    .select-wrap :global(.ant-select-selector) {
      border-color: var(--spec-border-color-1);
    }
  `}</style>
</div>
```

禁止：

```tsx
<style jsx>{`
  :global(.ant-select-selector) {
    border-color: var(--spec-border-color-1);
  }
`}</style>
```

要求：

- `:global()` 必须绑定在当前组件根 className 或明确容器下。
- 覆盖第三方组件时说明原因，避免影响同页面其他实例。
- 能通过组件 props、主题变量、className 传递解决的，不使用 `:global()`。

## 4. 动态样式

### 4.1 有限状态优先切换 className

推荐：

```tsx
<div className={isActive ? 'tab is-active' : 'tab'}>
  {title}
  <style jsx>{`
    .tab {
      color: var(--spec-font-color-2);
    }
    .tab.is-active {
      color: var(--skin-primary-color);
    }
  `}</style>
</div>
```

要求：

- `active`、`disabled`、`error`、`success`、`up`、`down` 等有限状态优先通过 className 表达。
- 不要为有限状态使用 CSS 模板字符串插值。

### 4.2 高动态数值可使用 inline style

适合场景：

- 动画过程中的 transform、opacity、height。
- 根据运行时测量值计算的宽高、位置。
- 高频变化且不适合重新生成 `<style jsx>` 的样式。

```tsx
<div className='progress' style={{ width: `${percent}%` }} />
```

要求：

- inline style 不得写硬编码颜色。
- 金融涨跌、主题颜色、品牌色仍应使用 CSS class + CSS 变量。

### 4.3 CSS 插值只用于必要场景

允许：

```tsx
<style jsx>{`
  .grid {
    grid-template-columns: repeat(${columns}, minmax(0, 1fr));
  }
`}</style>
```

不推荐：

```tsx
<style jsx>{`
  .button {
    color: ${isActive ? 'var(--skin-primary-color)' : 'var(--spec-font-color-2)'};
  }
`}</style>
```

要求：

- 大部分静态、少量动态时，应拆分静态样式与动态样式。
- 动态插值不得拼接用户输入，避免生成不可控 CSS。
- 颜色、间距、状态样式优先使用 className 和 CSS 变量。

## 5. PostCSS、样式嵌套与 RTL

项目已支持 `postcss`、`postcss-rtlcss`，可在 styled-jsx 中使用样式嵌套。

### 5.1 允许使用嵌套

```tsx
<style jsx>{`
  .card {
    padding: 16px;

    &:hover {
      background: var(--spec-background-color-2);
    }

    .title {
      color: var(--spec-font-color-1);
    }
  }
`}</style>
```

要求：

- 嵌套是为了提升可读性，不是为了增加选择器权重。
- 嵌套后的实际选择器仍需保持简单。
- 不要写 PostCSS 插件无法稳定转换的非常规语法。

### 5.2 RTL 规则

优先使用逻辑属性：

```css
.card {
  padding-inline-start: 16px;
  padding-inline-end: 12px;
  margin-inline-start: auto;
}
```

必须谨慎使用方向性属性：

```css
/* 如必须使用 left/right，应确认 postcss-rtlcss 转换结果 */
.icon {
  inset-inline-start: 0;
}
```

要求：

- 优先使用 `padding-inline-*`、`margin-inline-*`、`border-inline-*`、`inset-inline-*`。
- 文本对齐优先使用 `text-align: start/end`，少用 `left/right`。
- 涉及箭头、图标、位移、绝对定位时必须检查 RTL 表现。
- 不要手写 `[dir='rtl']` 分支，除非自动转换无法覆盖；手写时必须限定范围并说明原因。

## 6. 响应式规则

推荐在 styled-jsx 中使用项目既有断点或 `MediaInfo` 相关媒体规则，保持与现有代码一致。

```tsx
import { MediaInfo } from '@/core/utils/src/media-info';

<style jsx>{`
  .layout {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24px;
  }

  @media ${MediaInfo.mobile} {
    .layout {
      grid-template-columns: 1fr;
      gap: 16px;
    }
  }
`}</style>;
```

要求：

- 纯布局响应式优先使用 CSS media query。
- 禁止在新代码中随意写手工断点值，如 `@media (max-width: 768px)`；应优先使用 `MediaInfo.mobile` / `MediaInfo.tablet` / `MediaInfo.desktop` / `MediaInfo.mobileOrTablet` 等项目断点。
- 只有资源、结构或复杂交互必须切换时，才使用响应式组件或 hook。
- 移动端优先检查内容是否溢出、按钮是否可点击、表格是否可滚动。
- 页面容器桌面端应有合理 `max-width`，移动端避免横向溢出。
- 多语言长文案需考虑 `word-break`、`min-width: 0` 等防溢出处理。

## 7. `styled-jsx/css` 与 `css.resolve`

### 7.1 外部样式片段

可复用样式片段可使用 `styled-jsx/css`，但普通 `css` / `css.global` 不适合依赖组件运行时状态的动态样式。

```tsx
import css from 'styled-jsx/css';

export const cardStyles = css`
  .card {
    color: var(--spec-font-color-1);
  }
`;
```

使用：

```tsx
<style jsx>{cardStyles}</style>
```

要求：

- 可复用样式应语义清晰，不要把页面私有样式抽成共享片段。
- 样式片段仍需遵守 theme、RTL、响应式规则。
- 共享样式影响多个页面或组件时，必须说明影响范围。
- 子渲染函数或提取子组件时，对应 scoped CSS 也要跟随迁移到实际渲染该 DOM 的组件中，否则样式可能不生效。

### 7.2 `css.resolve`

`css.resolve` 适合给支持 `className` 的子组件或第三方组件附加 scoped className。

```tsx
const { className, styles } = css.resolve`
  a {
    color: var(--skin-primary-color);
  }
`;

return (
  <>
    <Link className={className} href='/'>Home</Link>
    {styles}
  </>
);
```

要求：

- 优先让子组件暴露 className 或样式 API；不要强行用全局选择器穿透。
- 使用 `css.resolve` 时必须同时渲染返回的 `styles`。
- 如果样式只属于当前组件 DOM，继续使用普通 `<style jsx>`。

## 8. SSR / Next.js 注意事项

- Next.js 已内置 styled-jsx，普通组件不要重复配置 styled-jsx runtime。
- 不要在组件渲染期间访问 `window`、`document`、`localStorage` 来计算首屏 CSS。
- SSR 首屏必须保持服务端与客户端样式一致，避免 hydration 后样式跳变。
- 不要为了修复样式问题粗暴关闭 SSR。
- CSP、nonce、style registry 等底层配置除非项目已有模式或用户明确要求，否则不要擅自改动。

## 9. 禁止事项

- 禁止硬编码颜色值，如 `#fff`、`#000`、`rgb(...)`、`rgba(...)`。
- 禁止滥用 `!important`；确需使用时必须说明原因并限定范围。
- 禁止用全局样式覆盖整个站点来解决局部问题。
- 禁止通过深层 DOM 选择器依赖不稳定结构。
- 禁止在 styled-jsx 中拼接不可信用户输入。
- 禁止新增未确认的 PostCSS / styled-jsx 插件或依赖。
- 禁止修改 Babel、Next、PostCSS 配置来绕过单个组件样式问题。
- 禁止使用脱离项目主题体系的新 CSS 方案。

## 10. 检查清单

提交前确认：

- [ ] 是否优先使用 `<style jsx>` 局部样式？
- [ ] 是否避免了不必要的 `<style jsx global>` / `:global()`？
- [ ] 颜色是否全部使用 `--spec-*` / `--skin-*` / `--nex-*` 已确认的 CSS 变量？
- [ ] 是否避免硬编码颜色、`!important`、过深选择器？
- [ ] 动态样式是否优先使用 className 或 inline style，而不是不必要的 CSS 插值？
- [ ] 嵌套选择器是否可读且层级受控？
- [ ] 同一类名是否避免重复拆散定义？
- [ ] RTL 是否使用逻辑属性并检查方向性样式？
- [ ] 响应式是否使用 `MediaInfo` 并覆盖 PC / Tablet / Mobile？
- [ ] 深色 / 浅色、黄色 / 蓝色主题下是否可读？
- [ ] SSR 首屏与客户端样式是否一致？
