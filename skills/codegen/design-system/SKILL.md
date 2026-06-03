---
name: bydfi-codegen-design-system
description: >
  BYDFi Nex 设计系统样式生成工作流。用于在 Next.js + styled-jsx 项目中生成符合设计约束的页面和组件样式。
  当用户需要编写页面样式、组件样式、使用颜色变量、排版变量、间距、主题适配时，必须触发此 skill。
author: nilu
---

# BYDFi Nex 设计系统 Skill

本 skill 描述“如何按 BYDFi Nex 设计系统生成 UI / 样式”。CSS 变量、字体、颜色、styled-jsx、响应式、RTL 等硬性规范已迁移到 `.claude/rules` 中维护。

## 执行前必须读取的 rules

- `.claude/rules/theme.md`：`--spec-*` / `--skin-*` / `--nex-*` 变量、颜色、字体、涨跌色、主题与 skin。
- `.claude/rules/styled-jsx.md`：`<style jsx>`、`:global()`、样式嵌套、动态样式、RTL、响应式。
- `.claude/rules/language.md`：用户可见文案与 `LANG`。
- `.claude/rules/react-tsx.md`：组件结构、封装组件、状态与代码质量。
- `.claude/rules/nextjs.md`：页面级样式组织、SSR/SSG 边界。
- `.claude/rules/verification.md`：验证与汇报。

## 生成流程

1. **理解 UI 目标**
   - 明确页面 / 组件类型、业务目标、状态（loading / empty / error / success）。
   - 判断是旧主题 `--spec-*` / `--skin-*`，还是 Nex 风格 `--nex-*`。

2. **确定布局结构**
   - 先设计 DOM 层级和组件职责，再写样式。
   - 页面容器、卡片、表单、列表、按钮区、图标区都应有语义 className。
   - 避免不必要的深层嵌套和全局穿透。

3. **应用设计 token**
   - 颜色、字体、行高、字重、涨跌色、边框、背景按 `theme.md` 选择变量。
   - 不硬编码颜色值、字体大小、行高、字重。
   - `--nex-font-size-*` / `--nex-font-height-*` 按 `theme.md` 使用 `calc(var(...) * 1px)`。

4. **补齐响应式与 RTL**
   - 使用 `MediaInfo` 断点。
   - PC / Tablet / Mobile 至少覆盖基础布局。
   - RTL 优先使用逻辑属性或确认 `postcss-rtlcss` 可转换。

5. **处理多语言与可访问性**
   - 用户可见文本走 `LANG`。
   - 多语言长文本检查换行、溢出、按钮宽度。
   - 可点击元素有清晰交互态。

6. **验证矩阵**
   - 黄色 / 蓝色 skin。
   - 深色 / 浅色主题。
   - LTR / RTL。
   - PC / Tablet / Mobile。
   - loading / empty / error / success 状态。

## 常用变量速查入口

变量详情以 `.claude/rules/theme.md` 为准，常用类别：

- 页面背景：`--nex-color-bg-normal-bg1`
- 卡片 / 容器背景：`--nex-color-bg-normal-bg2`
- 主要文字：`--nex-color-iconfont-primary`
- 次要文字：`--nex-color-iconfont-secondary`
- 一级边框：`--nex-color-border-1`
- 主题色：`--nex-color-theme-primary`
- 涨色：`--nex-color-function-up`
- 跌色：`--nex-color-function-down`
- 字体族：`--nex-font-family-en`
- 字号：`--nex-font-size-*`
- 行高：`--nex-font-height-*`
- 字重：`--nex-font-weight-*`

## 输出前检查

```text
样式检查：
- [ ] 是否遵守 theme.md 的 CSS 变量规则？
- [ ] 是否遵守 styled-jsx.md 的局部样式、:global、嵌套和 RTL 规则？
- [ ] 是否没有硬编码颜色、字体大小、行高、字重？
- [ ] 是否覆盖 PC / Tablet / Mobile？
- [ ] 是否考虑深浅主题、黄蓝 skin、RTL？
- [ ] 用户可见文案是否走 LANG？
```

## 交付说明

交付 UI / 样式改动时，必须说明：

- 使用了哪些设计 token 类别。
- 是否涉及 styled-jsx / `:global()` / RTL / 响应式。
- 已验证或未验证的 UI 矩阵项。
- 未运行自动验证的原因。
