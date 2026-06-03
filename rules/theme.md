---
name: theme
description: 主题规则
author: steve
---

# Theme Rules

适用于所有 TSX、styled-jsx、SCSS、CSS-in-JS 中的颜色、字体、主题、皮肤、涨跌色、深浅模式。

## 1. 总原则

- 必须使用 CSS 变量表达颜色、主题色、功能色。
- 禁止直接写颜色值，如 `#fff`、`#000`、`rgb(...)`、`rgba(...)`。
- 禁止硬编码字体大小、行高、字重，优先使用项目设计 token 或既有语义 className。
- UI 改动必须考虑黄色 / 蓝色、深色 / 浅色、RTL、PC / Tablet / Mobile。
- 不得引入外部 CSS 框架来绕过项目主题体系。

---

## 2. 旧主题（`--spec-*` / `--skin-*`）

### 2.1 颜色使用规则

- 必须使用 CSS 变量。
- 禁止直接写颜色值。

### 2.2 使用方式

- JS：
  `getComputedStyle(document.documentElement).getPropertyValue('--spec-font-color-2')`
- CSS：
  `color: var(--spec-font-color-2);`

### 2.3 变量来源限制

- 只能使用规范文件中已定义的变量。
- 规范入口：`packages/apps-kit/core/styles/src/theme/setting/colors/index.tsx`
- 变量枚举：`packages/apps-kit/core/styles/src/theme/setting/colors/default/colors.tsx`

---

## 3. Nex 主题变量（`--nex-*`）

> 当前项目仍保留旧主题系统，但部分页面和新样式会使用 `--nex-*` 变量。涉及 Nex 风格样式时，必须使用本节变量规则，不得硬编码对应值。

### 3.1 基础使用约束

- 颜色使用 `var(--nex-color-*)` 变量。
- 字体大小使用 `var(--nex-font-size-*)` 变量。
- 行高使用 `var(--nex-font-height-*)` 变量。
- 字重使用 `var(--nex-font-weight-*)` 变量。
- 字体族统一使用 `var(--nex-font-family-en)`。
- 主题色根据当前 `data-theme` 和 `data-skin` 自动切换，无需硬编码。

### 3.2 字号与行高单位

`--nex-font-size-*` 和 `--nex-font-height-*` 是无单位数值，使用时需要转为 px：

```css
.title {
  font-size: calc(var(--nex-font-size-24) * 1px);
  line-height: calc(var(--nex-font-height-24) * 1px);
  font-weight: var(--nex-font-weight-bold);
}
```

### 3.3 常用颜色变量

#### 主题色

| 变量名                                | 说明             |
| ------------------------------------- | ---------------- |
| `--nex-color-theme-primary`           | 主题主色         |
| `--nex-color-theme-primary-hover`     | 主题色 hover 态  |
| `--nex-color-theme-primary-pressed`   | 主题色 pressed 态 |
| `--nex-color-theme-primary-opacity-1` | 主题色透明度 8%  |
| `--nex-color-theme-primary-opacity-2` | 主题色透明度 12% |
| `--nex-color-theme-primary-opacity-3` | 主题色透明度 16% |

#### 文字 / 图标色

| 变量名                           | 说明                       |
| -------------------------------- | -------------------------- |
| `--nex-color-iconfont-primary`   | 主要文字 / 图标色          |
| `--nex-color-iconfont-secondary` | 次要文字 / 图标色          |
| `--nex-color-iconfont-tertiary`  | 三级文字 / 图标色          |
| `--nex-color-iconfont-disable`   | 禁用状态文字 / 图标色      |
| `--nex-color-iconfont-theme`     | 主题色文字，如链接、高亮   |
| `--nex-color-iconfont-on-theme`  | 主题色背景上的文字色       |

#### 边框色

| 变量名                       | 说明               |
| ---------------------------- | ------------------ |
| `--nex-color-border-1`       | 一级边框，最常用   |
| `--nex-color-border-2`       | 二级边框           |
| `--nex-color-border-3`       | 三级边框，稍重     |
| `--nex-color-border-4`       | 四级边框           |
| `--nex-color-border-tab`     | Tab 选中态边框     |
| `--nex-color-border-tooltip` | Tooltip 边框       |

#### 背景色

| 变量名                              | 说明                    |
| ----------------------------------- | ----------------------- |
| `--nex-color-bg-normal-bg1`         | 最底层页面背景          |
| `--nex-color-bg-normal-bg2`         | 卡片 / 容器背景         |
| `--nex-color-bg-normal-bg3`         | 次级容器背景            |
| `--nex-color-bg-normal-bg4`         | 分割 / 区块背景         |
| `--nex-color-bg-normal-bg-dropdown` | 下拉菜单背景            |
| `--nex-color-bg-normal-bg-tooltip`  | Tooltip 背景            |
| `--nex-color-bg-hover-bg2-hover`    | 卡片 hover 常用背景     |

#### 功能色 / 涨跌色

| 变量名                                | 说明           |
| ------------------------------------- | -------------- |
| `--nex-color-function-up`             | 涨色 / 正向色  |
| `--nex-color-function-up-hover`       | 涨色 hover     |
| `--nex-color-function-up-pressed`     | 涨色 pressed   |
| `--nex-color-function-up-opacity-2`   | 涨色背景透明度 |
| `--nex-color-function-down`           | 跌色 / 负向色  |
| `--nex-color-function-down-hover`     | 跌色 hover     |
| `--nex-color-function-down-pressed`   | 跌色 pressed   |
| `--nex-color-function-down-opacity-2` | 跌色背景透明度 |

#### 状态 / 强调色

| 变量名                     | 说明                   |
| -------------------------- | ---------------------- |
| `--nex-color-tints-tints1` | 强调色 1，链接、标签   |
| `--nex-color-tints-tints2` | 成功 / 正向色          |
| `--nex-color-tints-tints3` | 危险 / 错误色          |
| `--nex-color-tints-tints4` | 警告色                 |

### 3.4 data 属性说明

- `data-theme="dark"`：深色主题。
- `data-theme="light"`：浅色主题。
- `data-skin="primary"`：黄色系。
- `data-skin="blue"`：蓝色系。
- `data-updown="primary"`：绿涨红跌。
- `data-updown="primary-reverse"`：红涨绿跌。
- `data-updown="blue"`：红涨蓝跌。
- `data-updown="blue-reverse"`：蓝涨红跌。
- `data-updown="cvd"` / `cvd-reverse`：色觉无障碍涨跌方案。

---

## 4. 新主题（nex-theme）

### 4.1 颜色使用规则

- 必须使用 CSS 变量。
- 用法与旧主题一致。

### 4.2 变量来源限制

- 只能使用设计令牌文件中已定义的变量。
- 路径：`packages/nex-theme/node_modules/@bydfi-docs/design-tokens-web/dist/colors.css`

### 4.3 字体规范

- 文本大小、字重等必须使用规定的 `className`。
- 示例：`nex-text-title-small`
- 路径：`packages/nex-theme/node_modules/@bydfi-docs/design-tokens-web/dist/typography.css`

---

## 5. 常用场景示例

### 页面 / 卡片

```css
.page {
  background: var(--nex-color-bg-normal-bg1);
}
.card {
  background: var(--nex-color-bg-normal-bg2);
  border: 1px solid var(--nex-color-border-1);
  color: var(--nex-color-iconfont-primary);
}
.card:hover {
  background: var(--nex-color-bg-hover-bg2-hover);
}
```

### 按钮

```css
.btn-primary {
  background: var(--nex-color-theme-primary);
  color: var(--nex-color-iconfont-on-theme);
}
.btn-primary:hover {
  background: var(--nex-color-theme-primary-hover);
}
.btn-primary:active {
  background: var(--nex-color-theme-primary-pressed);
}
```

### 涨跌数值

```css
.up {
  color: var(--nex-color-function-up);
}
.down {
  color: var(--nex-color-function-down);
}
```

---

## 6. 禁止事项

- 禁止直接写颜色值，如 `#fff`、`#000`、`rgb(...)`、`rgba(...)`。
- 禁止硬编码 `font-size`、`line-height`、`font-weight` 数值，除非现有设计 token 无法表达且已说明原因。
- 禁止使用非项目规范字体族。
- 禁止引入 Tailwind、Bootstrap 等外部 CSS 框架绕过项目主题体系。
- 禁止只适配单一主题或单一 skin。
- 禁止用固定颜色表达涨跌，应使用功能色变量。

---

## 7. 检查清单

- [ ] 是否全部使用 `--spec-*` / `--skin-*` / `--nex-*` 等已确认 CSS 变量？
- [ ] 是否没有硬编码颜色？
- [ ] 字体大小、行高、字重是否使用 token 或语义 className？
- [ ] 深色 / 浅色是否可读？
- [ ] 黄色 / 蓝色 skin 是否可用？
- [ ] 涨跌色是否使用功能色变量？
- [ ] RTL 场景是否没有方向性颜色或状态误用？
