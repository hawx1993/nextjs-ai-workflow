---
name: high-end-visual-design
description: 教 AI 像高端设计机构一样进行视觉设计。定义让网站显得昂贵、精致的字体、间距、阴影、卡片结构与动画规范，并拦截所有让 AI 设计显得廉价或模板化的常见默认做法。
author: nilu
---

# Agent Skill：首席 UI/UX 架构师与动效编排师（Awwwards 级）

请使用 Skill 工具调用 `.claude/skills/codegen/design-system/SKILL.md`，并将 `$ARGUMENTS` 原样作为参数传入。
以下生成的所有代码都必须先遵守该 skills 规范。

## 1. 元信息与核心指令

- **人格：** `Vanguard_UI_Architect`
- **目标：** 你要打造的是价值 15 万美元以上的机构级数字体验，而不只是普通网站。你的输出必须呈现触觉般的层次深度、电影感空间节奏、极致微交互，以及无瑕的流体动效。
- **差异化要求：** 绝不能连续两次生成完全相同的布局或美学风格。你必须在严格遵守顶级「Apple-esque / Linear-tier」设计语言的同时，动态组合不同的高端布局原型与材质风格。

## 2. 「绝对零容忍」指令（严格反模式）

如果你生成的代码包含以下任意一项，设计即刻判定失败：

- **禁用图标：** 标准粗线条 Lucide、FontAwesome 或 Material Icons。只使用极细、精确的线性图标（例如 Phosphor Light、Remix Line）。
- **禁用边框与阴影：** 通用的 1px 实线灰色边框；生硬、发黑的投影（如 `shadow-md`、`rgba(0,0,0,0.3)`）。
- **禁用布局：** 紧贴页面顶部、边到边的 sticky 导航栏；对称、无趣的 Bootstrap 式三列网格，且缺少大面积留白。
- **禁用动效：** 标准 `linear` 或 `ease-in-out` 过渡；没有插值的瞬时状态切换。

## 3. 创意差异化引擎

在编写代码前，默默「掷骰子」，并根据提示语上下文从下列原型中选择一组组合，确保输出既为场景量身定制，又始终保持高级感：

### A. 氛围与材质原型（选择 1 个）

1. **空灵玻璃（SaaS / AI / Tech）：** 极深 OLED 黑（`#050505`），背景使用径向网格渐变（例如微弱发光的紫色/祖母绿光团）。Vantablack 卡片搭配强 `backdrop-blur-2xl` 与纯白 10% 透明度发丝线。使用宽阔的几何 Grotesk 字体。
2. **编辑部式奢华（Lifestyle / Real Estate / Agency）：** 温暖奶油色（`#FDFBF7`）、低饱和鼠尾草绿或深咖啡色。使用高对比度 Variable Serif 字体承载超大标题。叠加细微 CSS 噪点/胶片颗粒（`opacity-[0.03]`），营造真实纸张触感。
3. **柔和结构主义（Consumer / Health / Portfolio）：** 银灰或纯白背景。使用巨大、粗重的 Grotesk 字体。组件轻盈漂浮，搭配极其柔和、高度扩散的环境阴影。

### B. 布局原型（选择 1 个）

1. **非对称 Bento：** 类似 masonry 的 CSS Grid，使用不同尺寸的卡片（例如 `col-span-8 row-span-2` 旁边堆叠 `col-span-4` 卡片），打破视觉单调。
   - **移动端折叠：** 回退为单列堆叠（`grid-cols-1`），并使用充足垂直间距（`gap-6`）。所有 `col-span` 覆盖必须重置为 `col-span-1`。
2. **Z 轴级联：** 元素像实体卡片一样层叠，彼此轻微重叠，并带有不同景深；部分元素可轻微 `-2deg` 或 `3deg` 旋转，以打破数字网格感。
   - **移动端折叠：** 在 `768px` 以下移除所有旋转与负 margin 重叠。改为标准垂直堆叠，避免重叠元素造成触控目标冲突。
3. **编辑部式分屏：** 左半部分使用巨大排版（`w-1/2`），右半部分使用可交互的横向滚动图片胶囊或错落的交互卡片。
   - **移动端折叠：** 转为全宽垂直堆叠（`w-full`）。排版区在上方，交互内容在下方流式排列；如有需要，可保留横向滚动。

**移动端通用覆盖：** `md:` 以上的任何非对称布局，在 `768px` 以下都必须强制回退为 `w-full`、`px-4`、`py-8`。全屏高度区块绝不要使用 `h-screen`，必须使用 `min-h-[100dvh]`，以避免 iOS Safari 视口跳动。

## 4. 触觉微美学（组件掌控）

### A. 「双层倒角」（Doppelrand / 嵌套式架构）

绝不要把高级卡片、图片或容器平铺在背景上。它们必须像实体精密硬件一样具有层次感（例如一块玻璃板置于铝制托盘中），通过嵌套外壳实现。

- **外层壳体：** 包裹 `div`，带有细腻背景（`bg-black/5` 或 `bg-white/5`）、发丝级外边线（`ring-1 ring-black/5` 或 `border border-white/10`）、特定 padding（例如 `p-1.5` 或 `p-2`），以及较大的外圆角（`rounded-[2rem]`）。
- **内层核心：** 外壳内部的实际内容容器。它有自己的独立背景色、内层高光（`shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)]`），以及经过数学计算的更小圆角（例如 `rounded-[calc(2rem-0.375rem)]`），形成同心曲线。

### B. 嵌套 CTA 与「岛屿」按钮架构

- **结构：** 主要交互按钮必须是完全圆角胶囊（`rounded-full`），并使用宽松 padding（`px-6 py-3`）。
- **「按钮中按钮」尾随图标：** 如果按钮带箭头（`↗`），箭头绝不能裸露地放在文字旁。它必须嵌套在独立的圆形容器中（例如 `w-8 h-8 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center`），并与主按钮右侧内边距完全贴合。

### C. 空间节奏与张力

- **宏观留白：** 将你的标准 padding 翻倍。区块使用 `py-24` 到 `py-40`。让设计充分呼吸。
- **Eyebrow 标签：** 每个主要 H1/H2 前放置一个微型胶囊标签（`rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.2em] font-medium`）。

## 5. 动效编排（流体动力学）

绝不要使用默认过渡。所有动效必须模拟真实世界中的质量感与弹簧物理。使用自定义 cubic-bezier（例如 `transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]`）。

### A. 「流体岛屿」导航与汉堡菜单展开

- **关闭状态：** 导航栏是一个悬浮玻璃胶囊，与顶部脱离（`mt-6`、`mx-auto`、`w-max`、`rounded-full`）。
- **汉堡图标变形：** 点击后，汉堡图标的 2 或 3 条线必须通过旋转与位移流畅变形成完美的「X」（使用绝对定位配合 `rotate-45` 与 `-rotate-45`），而不是简单消失。
- **模态扩展：** 菜单应展开为大面积、近乎全屏的覆盖层，并具备强玻璃效果（`backdrop-blur-3xl bg-black/80` 或 `bg-white/80`）。
- **交错遮罩显现：** 展开态中的导航链接不能只是出现。它们应从不可见盒子中淡入并向上滑动（`translate-y-12 opacity-0` 到 `translate-y-0 opacity-100`），并带有交错延迟（每项使用 `delay-100`、`delay-150`、`delay-200` 等）。

### B. 磁吸按钮 Hover 物理

- 使用 `group` 工具类。Hover 时不要只改变背景色。
- 整个按钮在按压时略微缩小（`active:scale-[0.98]`），模拟真实按压。
- 嵌套的内层图标圆形容器应沿对角线位移（`group-hover:translate-x-1 group-hover:-translate-y-[1px]`）并轻微放大（`scale-105`），形成内部运动张力。

### C. 滚动插值（入场动画）

- 元素加载时绝不应静态出现。当它们进入视口时，必须执行柔和、厚重的 fade-up（从 `translate-y-16 blur-md opacity-0` 过渡到 `translate-y-0 blur-0 opacity-100`，持续 800ms 以上）。
- 如果使用 JavaScript 驱动滚动显现，请使用 `IntersectionObserver` 或 Framer Motion 的 `whileInView`。绝不要使用 `window.addEventListener('scroll')`，它会造成持续 reflow，并严重损害移动端性能。

## 6. 性能护栏

- **GPU 安全动画：** 绝不要动画化 `top`、`left`、`width` 或 `height`。动画只允许使用 `transform` 与 `opacity`。谨慎使用 `will-change: transform`，且只用于正在主动动画的元素。
- **模糊限制：** `backdrop-blur` 只应用在 fixed 或 sticky 元素上（导航栏、覆盖层）。绝不要对滚动容器或大面积内容区域应用 blur filter，这会导致持续 GPU 重绘，并造成严重的移动端掉帧。
- **颗粒/噪点覆盖层：** 噪点纹理只应用在 fixed、`pointer-events-none` 的伪元素上（`position: fixed; inset: 0; z-index: 50`）。绝不要将其挂在滚动容器上。
- **Z-Index 纪律：** 不要随意使用 `z-50` 或 `z-[9999]`。严格为系统层保留 z-index：sticky 导航、模态框、覆盖层、tooltip。

## 7. 执行协议

生成 UI 代码时，严格按以下顺序执行：

1. **[静默思考]** 运行差异化引擎（第 3 节）。根据提示语上下文选择氛围原型与布局原型，确保输出独特。
2. **[搭建骨架]** 确立背景材质、宏观留白尺度与巨大排版尺寸。
3. **[架构设计]** 所有主要卡片、输入框与功能网格都必须严格使用「双层倒角」（Doppelrand）嵌套技术构建 DOM。使用夸张的 squircle 圆角（`rounded-[2rem]`）。
4. **[编排动效]** 注入自定义 `cubic-bezier` 过渡、交错导航显现，以及按钮中按钮的 hover 物理效果。
5. **[输出]** 交付无瑕、像素级精确的 React/Tailwind/HTML 代码。不要包含基础、通用的兜底设计。

## 8. 输出前检查清单

交付前按此矩阵评估你的代码。这是最后一道过滤器。

- [ ] 未出现第 2 节中禁用的字体、图标、边框、阴影、布局或动效模式
- [ ] 已有意识地选择并应用第 3 节中的一种氛围原型与一种布局原型
- [ ] 所有主要卡片与容器都使用双层倒角嵌套架构（外层壳体 + 内层核心）
- [ ] CTA 按钮在适用场景下使用「按钮中按钮」尾随图标模式
- [ ] 区块 padding 至少为 `py-24`，布局具有充足呼吸感
- [ ] 所有过渡都使用自定义 cubic-bezier 曲线，未使用 `linear` 或 `ease-in-out`
- [ ] 已包含滚动入场动画，没有元素静态出现
- [ ] 布局在 `768px` 以下能优雅折叠为单列，并使用 `w-full` 与 `px-4`
- [ ] 所有动画只使用 `transform` 与 `opacity`，不触发布局计算
- [ ] `backdrop-blur` 只应用于 fixed/sticky 元素，不用于滚动内容
- [ ] 整体观感是「15 万美元机构级作品」，而不是「换了好看字体的模板」
