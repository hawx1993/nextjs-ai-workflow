---
name: design-taste-frontend
description: 面向落地页、作品集和改版项目的反粗糙前端 Skill。Agent 先阅读需求，推断正确设计方向，再交付不模板化的界面；适用时使用真实设计系统，改版先审计，并严格执行交付前检查。
author: nilu
---

# tasteskill：反粗糙前端 Skill

> 适用于落地页、作品集和改版项目。不适用于仪表盘、数据表格或多步骤产品 UI。
> 下方每条规则都是**上下文相关**的，不会自动套用。先读需求，再只抽取适合的部分。

---

## 0. 需求推断（先读懂场景，再做任何事）

在写代码或调整参数前，**先推断用户真正想要什么**。大多数 LLM 设计输出很差，是因为模型直接套默认审美，而不是读懂场景。

### 0.A 先读取这些信号

1. **页面类型** - 落地页（SaaS / 消费品 / 机构 / 活动）、作品集（开发者 / 设计师 / 创意工作室）、改版（保留 vs 大改）、编辑部 / 博客。
2. **用户使用的氛围词** - “minimalist”、“calm”、“Linear-style”、“Awwwards”、“brutalist”、“premium consumer”、“Apple-y”、“playful”、“serious B2B”、“editorial”、“agency-y”、“glassy”、“dark tech”。
3. **参考信号** - 用户提供的 URL、截图、产品名、竞品或品牌。
4. **受众** - B2B 采购委员会、注重设计感的消费者，或快速扫作品集的招聘者。受众决定审美，不是你的个人喜好。
5. **已有品牌资产** - logo、颜色、字体、摄影。对于改版，这些是起点，不是可选输入（见第 11 节）。
6. **隐性约束** - 无障碍优先受众、公共部门、受监管行业、信任优先的商业、儿童产品。这些约束优先于审美偏好。

### 0.B 生成前输出一行“设计解读”

在任何代码前，用一行说明：**“我将其理解为：面向 <受众> 的 <页面类型>，采用 <氛围> 语言，倾向于 <设计系统或审美家族>。”**

示例：

- _“我将其理解为：面向技术购买者的 B2B SaaS 落地页，采用 Linear-style 极简语言，倾向于 Tailwind utilities + Geist + 克制动效。”_
- _“我将其理解为：面向招聘经理的独立设计师作品集，采用编辑部 / 动态字体语言，倾向于原生 CSS + 滚动驱动动画 + 自定义排版。”_
- _“我将其理解为：公共部门服务站点改版，采用信任优先语言，倾向于 GOV.UK Frontend 或 USWDS。”_

### 0.C 如果需求含糊，只问一个问题，不要猜

只问**一个**澄清问题，不要一次丢出多个问题，并且只在设计解读确实会分叉时提问。示例：_“这个页面应该更接近 Linear 式克制清爽，还是 Awwwards 式实验感？”_

如果能从上下文自信推断，**不要问**。直接声明设计解读并继续。

### 0.D 反默认纪律

不要默认使用：AI 紫色渐变、深色网格上居中 Hero、三个等宽功能卡片、到处都是泛用玻璃拟态、无处不在的无限循环微动效、Inter + slate-900。这些都是 LLM 默认套路。必须基于设计解读有意识地跳出默认。

---

## 1. 三个旋钮（核心配置）

完成设计解读后，设置三个旋钮。下面所有布局、动效和密度决策都受它们约束。

- **`DESIGN_VARIANCE: 8`** - 1 = 完美对称，10 = 艺术化混沌
- **`MOTION_INTENSITY: 6`** - 1 = 静态，10 = 电影感 / 物理感
- **`VISUAL_DENSITY: 4`** - 1 = 美术馆 / 空旷，10 = 驾驶舱 / 高密数据

**基线：** `8 / 6 / 4`。除非设计解读要求覆盖，否则使用这些值。不要让用户修改本文件；覆盖应通过对话发生。

### 1.A 旋钮推断（设计解读 → 旋钮值）

| 信号                                                               | VARIANCE | MOTION | DENSITY  |
| ------------------------------------------------------------------ | -------- | ------ | -------- |
| “minimalist / clean / calm / editorial / Linear-style”             | 5-6      | 3-4    | 2-3      |
| “premium consumer / Apple-y / luxury / brand”                      | 7-8      | 5-7    | 3-4      |
| “playful / wild / Dribbble / Awwwards / experimental / agency”     | 9-10     | 8-10   | 3-4      |
| “landing page / portfolio / marketing site（默认）”                | 7-9      | 6-8    | 3-5      |
| “trust-first / public-sector / regulated / accessibility-critical” | 3-4      | 2-3    | 4-5      |
| “redesign - preserve”                                              | 匹配现状 | +1     | 匹配现状 |
| “redesign - overhaul”                                              | +2       | +2     | 匹配现状 |

### 1.B 用例预设

| 用例                      | VARIANCE | MOTION  | DENSITY |
| ------------------------- | -------- | ------- | ------- |
| 落地页（SaaS，主流）      | 7        | 6       | 4       |
| 落地页（机构 / 创意）     | 9        | 8       | 3       |
| 落地页（高端消费品）      | 7        | 6       | 3       |
| 作品集（设计师 / 工作室） | 8        | 7       | 3       |
| 作品集（开发者）          | 6        | 5       | 4       |
| 编辑部 / 博客             | 6        | 4       | 3       |
| 公共部门服务              | 3        | 2       | 5       |
| 改版 - 保留               | match    | match+1 | match   |
| 改版 - 大改               | +2       | +2      | match   |

### 1.C 旋钮如何驱动输出

把这些值（或用户覆盖值）当成全局变量使用。本文档所有交叉引用都指向这些变量名，绝不要发明 `LAYOUT_VARIANCE`、`ANIM_LEVEL` 之类别名。

---

## 2. 需求 → 设计系统映射

有了设计解读（第 0 节）和旋钮（第 1 节）后，选择正确基础。官方包能解决的问题，不要手写 CSS。不要把审美趋势伪装成官方设计系统。

### 2.A 何时使用真实设计系统（使用官方包）

| 需求读起来像…                    | 使用                                                       | 原因                                        |
| -------------------------------- | ---------------------------------------------------------- | ------------------------------------------- |
| Microsoft / 企业 SaaS / 仪表盘   | `@fluentui/react-components` 或 `@fluentui/web-components` | 官方 Fluent UI、Microsoft token、无障碍成熟 |
| Google 风格 UI / Material 味产品 | `@material/web` + Material 3 tokens                        | 官方、可通过 Material Theming 主题化        |
| IBM 风格 B2B / 企业分析          | `@carbon/react` + `@carbon/styles`                         | 官方 Carbon，成熟的数据密度模式             |
| Shopify app 界面                 | `polaris.js` web components / Polaris React                | Shopify admin UI 要求                       |
| Atlassian / Jira 风格产品        | `@atlaskit/*` + `@atlaskit/tokens`                         | 官方 Atlassian DS                           |
| GitHub 风格开发工具 / 社区页     | `@primer/css` 或 `@primer/react-brand`                     | 官方 Primer；Brand 版本用于营销             |
| 英国公共部门服务                 | `govuk-frontend`                                           | 法务 / 监管层面预期                         |
| 美国公共部门 / 信任优先          | `uswds`                                                    | 同上                                        |
| 快速本地商业 / 机构 MVP          | Bootstrap 5.3                                              | 普通、快速、稳定                            |
| 现代无障碍 React 基础            | `@radix-ui/themes`                                         | Primitives + 精致主题                       |
| 你拥有组件代码的现代 SaaS        | shadcn/ui (`npx shadcn@latest add ...`)                    | 你拥有代码，易定制；绝不交付默认状态        |
| Tailwind 型现代 SaaS / AI 营销   | Tailwind v4 utilities + `dark:` variant                    | 独立开发者和小团队默认选择                  |

**诚实规则：** 如果需求符合上表某个系统，安装并使用**官方**包。不要手写复刻它的 CSS。不要导入某系统 token 后又覆盖 90%。

**每个项目只用一个系统。** 不要在同一棵树里混用 Fluent React 和 Carbon。不要把 shadcn/ui 组件塞进 Material 3 应用。

### 2.B 当需求是审美而非系统

这些方向**没有唯一官方包**。用原生 CSS + Tailwind + 维护良好的组件库实现。代码注释里要诚实区分灵感借鉴和官方材料。

| 审美方向                        | 诚实实现方式                                                                                                                                        |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Glassmorphism / “frosted glass” | `backdrop-filter`、分层边框、高光覆盖层。为 `prefers-reduced-transparency` 提供实色兜底。                                                           |
| Bento（Apple 风格瓦片网格）     | 使用不同尺寸单元格的 CSS Grid。没有单一库拥有它。                                                                                                   |
| Brutalism                       | 原生 CSS、等宽字体、粗粝边框。没有库。                                                                                                              |
| Editorial / magazine            | 衬线字体、不对称网格、大留白。没有库。                                                                                                              |
| Dark tech / hacker              | Mono + 霓虹强调、终端母题。没有库。                                                                                                                 |
| Aurora / mesh gradients         | SVG 或分层径向渐变。没有库。                                                                                                                        |
| Kinetic typography              | 原生 CSS 动画、滚动驱动动画、GSAP（用于 scroll hijack）。没有库。                                                                                   |
| **Apple Liquid Glass**          | Apple 只为 Apple 平台记录了该材料。**不存在官方 `liquid-glass.css`。** Web 实现只是 `backdrop-filter` + 分层边框 + 高光的近似。必须明确标注为近似。 |

---

## 3. 默认架构与约定

除非设计解读选择了真实设计系统（第 2.A 节），默认如下：

### 3.A 技术栈

- **框架：** React 或 Next.js。默认使用 Server Components（RSC）。
  - **RSC 安全：** 全局状态只能在 Client Components 中工作。在 Next.js 中，把 providers 包在一个带 `"use client"` 的组件里。
  - **交互隔离：** 任何使用 Motion、滚动监听或指针物理的组件都必须是隔离叶子组件，并在顶部加 `'use client'`。Server Components 只渲染静态布局。
- **样式：** **Tailwind v4**（默认）。只有既有项目要求时才使用 Tailwind v3。
  - v4：不要在 `postcss.config.js` 中使用 `tailwindcss` plugin。使用 `@tailwindcss/postcss` 或 Vite plugin。
- **动画：** **Motion**（Framer Motion 的新库名）。从 `motion/react` 导入（`import { motion } from "motion/react"`）。`framer-motion` 仍可作为旧别名工作，但新代码优先 `motion/react`。
- **字体：** 始终使用 `next/font`（Next.js）或 `@font-face` 自托管 + `font-display: swap`。生产环境不要通过 `<link>` 引 Google Fonts。

### 3.B 状态

- 孤立 UI 使用本地 `useState` / `useReducer`。
- 只有为避免深层 prop drilling 时才用全局状态：Zustand、Jotai 或 React context。
- **绝不要**用 `useState` 跟踪由用户输入连续驱动的值（鼠标位置、滚动进度、指针物理、磁吸 hover）。使用 Motion 的 `useMotionValue` / `useTransform` / `useScroll`。`useState` 会在每次变化时重渲染 React 树，在移动端会崩。

### 3.C 图标

- **允许的库（优先级顺序）：** `@phosphor-icons/react`、`hugeicons-react`、`@radix-ui/react-icons`、`@tabler/icons-react`。
- **不鼓励：** `lucide-react`。只有用户明确要求或项目已有依赖时才可接受。
- **绝不要手写 SVG 图标。** 缺字形就安装第二个库或用 primitives 组合，不要自己画 icon path。
- **每个项目只用一个图标家族。** 不要在同一组件树里混用 Phosphor 和 Lucide。
- **全局统一 `strokeWidth`**（如 `1.5` 或 `2.0`）。

### 3.D Emoji 策略

默认不鼓励在代码、标记和可见文本中使用 emoji。用图标库字形替代。**例外：** 只有用户明确要求 playful / chat-style / social-native 氛围时才允许少量、有意图地使用。

### 3.E 响应式与布局机制

- 统一断点（`sm 640`、`md 768`、`lg 1024`、`xl 1280`、`2xl 1536`）。
- 页面布局使用 `max-w-[1400px] mx-auto` 或 `max-w-7xl` 约束。
- **视口稳定：** 全高 Hero 绝不要使用 `h-screen`。始终使用 `min-h-[100dvh]`，防止移动端（iOS Safari 地址栏）布局跳动。
- **Grid 优先于 Flex 数学：** 绝不要写复杂 flex 百分比数学（`w-[calc(33%-1rem)]`）。始终使用 CSS Grid（`grid grid-cols-1 md:grid-cols-3 gap-6`）。

### 3.F 依赖验证（强制）

导入任何第三方库前，先检查 `package.json`。如果包不存在，先输出安装命令。**永远不要**假设某库已存在。

---

## 4. 设计工程指令（偏差校正）

LLM 默认会滑向套路。主动覆盖这些默认。每条规则都有上下文相关的例外路径。

### 4.1 排版

- **展示 / 标题：** 默认 `text-4xl md:text-6xl tracking-tighter leading-none`。
- **正文 / 段落：** 默认 `text-base text-gray-600 leading-relaxed max-w-[65ch]`。
- **Sans 字体选择：**
  - **不鼓励默认使用：** `Inter`。优先选择 `Geist`、`Outfit`、`Cabinet Grotesk`、`Satoshi` 或适合品牌的衬线字体。
  - **例外：** 当用户明确要求中性 / 标准 / Linear-style，或需求是公共部门 / 无障碍优先站点时，Inter 可接受。
- **应知道的组合：** `Geist` + `Geist Mono`、`Satoshi` + `JetBrains Mono`、`Cabinet Grotesk` + `Inter Tight`、`GT America` + `IBM Plex Mono`。

- **衬线纪律（默认非常不鼓励）：**

  - 对任何项目而言，默认使用衬线字体都**非常不鼓励**。“感觉更有创意 / 更高级 / 更编辑部”不是使用衬线的理由。Agent 的默认心理模型“创意 brief = 衬线”是生产测试中最明显的 AI 痕迹。
  - **只有以下之一明确为真时，衬线才可接受：**
    - 品牌 brief 明确指定了衬线字体，或
    - 审美家族确实是 editorial / luxury / publication / manuscript / heritage / vintage，并且你能说明为什么这个具体衬线适合这个具体品牌。
  - 其他一切场景（创意机构、设计工作室、现代品牌、高端消费、作品集、生活方式），**默认使用无衬线 display**（Geist Display、ABC Diatype、Söhne Breit、Cabinet Grotesk Display、Migra Sans、GT Walsheim、Inter Display、PP Neue Montreal）。无衬线 display 并不“无聊”，就像黑色在时尚中成为默认一样。
  - **强调规则（相关）：** 如果想在标题中强调某个词（例如 kinetic 的 “and `spatial` design”），使用**同一字体的 italic 或 bold**。不要为了视觉兴趣在无衬线标题里随机插入一个衬线词（反之亦然）。混字体强调很业余。同字体的 italic/bold 才正确。
  - **明确禁止作为默认：** `Fraunces` 和 `Instrument_Serif`（两个 LLM 最爱 display serif）。
  - **如果衬线有充分理由**（很少见），从以下池中轮换，不要连续项目复用同一个衬线：PP Editorial New、GT Sectra Display、Cardinal Grotesque、Reckless Neue、Tiempos Headline、Recoleta、Cormorant Garamond、Playfair Display、EB Garamond、IvyPresto、Migra、Editorial Old、Saol Display、Söhne Breit Kursiv、Domaine Display、Canela、Schnyder、Tobias、NB Architekt、ITC Galliard。

- **斜体下伸部留白（强制）：** display 字体使用 italic 且词里含下伸字母（`y g j p q`）时，`leading-[1]` 或 `leading-none` 会裁切下伸部。至少使用 `leading-[1.1]`，并给包裹元素加 `pb-1` 或 `mb-1` 预留。交付前审计每个 display 标题中的斜体词。

### 4.2 色彩校准

- 最多 1 个强调色。默认饱和度 < 80%。
- **LILA 规则：** “AI 紫 / 蓝光”审美不鼓励作为默认。不要自动加紫色按钮 glow，不要随机霓虹渐变。使用中性基底（Zinc / Slate / Stone）+ 高对比单一强调色（Emerald、Electric Blue、Deep Rose、Burnt Orange 等）。
- **例外：** 如果品牌或 brief 明确要求 purple / violet / lila，就拥抱它。但要有意图：一致 palette、协调中性色、克制渐变。不是泛用 AI 渐变垃圾。
- **每个项目一个 palette。** 不要在同一项目里冷灰和暖灰来回跳。
- **色彩一致性锁（强制）：** 一旦为页面选择强调色，就在整个页面使用它。暖灰站点不应在第 7 节突然出现蓝色 CTA。玫瑰强调站点不应在 footer 出现青绿色状态 badge。选一个强调色，锁定它，交付前审计每个组件。

- **高端消费 palette 禁令（强制，第二常见 AI 痕迹）：**
  - 对高端消费 brief（厨具、健康、手工艺、奢侈品、heritage craft、DTC 家居等），LLM 默认会使用**暖米色/奶油色 + 黄铜/陶土/暗红/赭色 + espresso/ink 深色文字**。下面这些十六进制族默认被禁：
    - 背景：`#f5f1ea`、`#f7f5f1`、`#fbf8f1`、`#efeae0`、`#ece6db`、`#faf7f1`、`#e8dfcb`（所有 “warm paper / cream / chalk / bone”）
    - 强调：`#b08947`、`#b6553a`、`#9a2436`、`#9c6e2a`、`#bc7c3a`、`#7d5621`（所有 “brass / clay / oxblood / ochre”）
    - 文字：`#1a1714`、`#1a1814`、`#1b1814`（所有 “espresso / warm near-black”）
  - 这套 palette 被禁止作为高端消费 brief 的默认选择。你过去生成的每个高端消费站都使用这套 palette，导致品牌消失。
  - **默认替代方向（轮换，不要复用）：**
    - **Cold Luxury：** 银灰 + chrome + smoke（想象 Tesla、Apple Watch Hermès 但不带皮革）。
    - **Forest：** 深绿 + bone + amber accent（想象 Filson、Patagonia premium）。
    - **Black and Tan：** 真 off-black + warm tan，强对比，无 beige。
    - **Cobalt + Cream：** 饱和蓝 + 单一中性色，无 brass。
    - **Terracotta + Slate：** 暖 rust + 冷灰，无 brass。
    - **Olive + Brick + Paper：** 低饱和 olive + brick-red accent。
    - **纯黑白 + 单个饱和 pop：** off-white + off-black + 一个亮强调色（electric blue、emerald、hot pink 等）。
  - **Palette 轮换规则：** 如果上一个高端消费项目用了 beige+brass 家族，这个必须使用不同家族。不要连续交付同一 warm-craft palette。
  - **例外：** beige+brass+espresso 只有在品牌 brief 明确指定这些颜色，或品牌身份确实是 vintage / artisan / warm-craft 且你能解释为什么它适合该品牌时才可接受。因为“这是厨具 brief”而默认套用，禁止。

### 4.3 布局多样化

- **反居中偏差：** 当 `DESIGN_VARIANCE > 4` 时，避免居中 Hero / H1。强制使用 “Split Screen”（50/50）、“左对齐内容 / 右对齐资产”、“不对称留白” 或 scroll-pinned 结构。
- **例外：** editorial / manifesto / launch-announcement brief 中，如果信息本身就是设计，居中 hero 可以。

### 4.4 材质、阴影、卡片

- 只有当 elevation 传达真实层级时才使用卡片。否则用 `border-t`、`divide-y` 或负空间组织。
- 使用阴影时，让阴影带背景色相。浅色背景上不要纯黑投影。
- 当 `VISUAL_DENSITY > 7`：禁止泛用卡片容器。数据指标应在平面布局中呼吸。
- **形状一致性锁（强制）：** 为页面选择一个圆角尺度并坚持。选项：全部锐利（radius 0）、全部柔和（radius 12-16px）、全部 pill（交互控件全圆）。只有存在明确规则时才可混用（如“按钮全 pill，卡片 16px，输入框 8px”），且全页面遵守。方形布局里突然圆按钮，或 pill-button 页面里方卡片，都是坏设计。

### 4.5 交互 UI 状态

LLM 默认只做“静态成功状态”。始终实现完整周期：

- **Loading：** 骨架屏匹配最终布局形状。避免泛用圆形 spinner。
- **Empty States：** 构图精致，说明如何填充。
- **Error States：** 清晰、内联（表单）或上下文相关（toast 只用于瞬态）。
- **触感反馈：** `:active` 使用 `-translate-y-[1px]` 或 `scale-[0.98]` 模拟实体按压。
- **按钮对比检查（强制，无障碍）：** 交付前确认按钮文字相对按钮背景可读。白色按钮 + 白字、`bg-white` CTA + `text-white`、透明按钮贴在页面背景且无边框，都禁止。审计每个 CTA：对比度 WCAG AA 最低（正文 4.5:1，大字 18px+ 为 3:1）。摄影背景上的 ghost button 同样适用（使用 backdrop、scrim 或 stroke）。
- **CTA 按钮换行禁令（强制）：** 桌面端按钮文字必须单行。如果 “VIEW SELECTED WORK” 之类标签换成 2 或 3 行，按钮坏了。修复方式：缩短标签（主 CTA 最多 3 个词，最好 1-2 个）或加宽按钮（不要人为限制 CTA 的 `max-width`）。桌面端 CTA 换行是交付前失败。
- **禁止重复 CTA 意图（强制）：** 一个页面不能有两个相同意图的 CTA。例如 “Get in touch” + “Contact us” + “Let's talk” + “Start a project” + “Start something” + “Reach out” 都是 “contact” 意图，只保留一个标签并在页面（nav、hero、footer）统一使用。同理 “Try free” + “Get started” + “Sign up free”（signup）和 “View work” + “See selected work” + “Browse projects”（portfolio）。每个意图一个标签。
- **表单对比检查（强制，无障碍）：** 表单输入、placeholder、focus ring、helper text、error text 相对 section 背景均通过 WCAG AA。近白表单上的浅 placeholder、白表单贴白页面、表单 label 灰到低于 4.5:1，对应全部禁止。交付前审计每个表单。

### 4.6 数据与表单模式

- Label 在输入框上方。Helper text 可选但应在 markup 中存在。Error text 在输入框下方。输入块标准 `gap-2`。
- 永远不要用 placeholder 代替 label。

### 4.7 布局纪律（硬规则。任何一条失败都是交付破损）

- **Hero 必须适配首屏视口。** 桌面标题最多 2 行，副文本最多 **20 个词** 且最多 3-4 行，CTA 无需滚动即可看到。如果文案太长：降低字号或删文案。如果你不能用 20 个词说明价值主张，说明价值主张不清，不是规则太严。永远不要让 Hero 溢出，迫使用户滚动才能找到 CTA。
- **Hero 字号纪律。** 字号和图片尺寸要一起规划。如果 hero 资产很大且标题超过 6 个词，不要从 `text-7xl/text-8xl` 起步。大多数 hero 的合理默认范围是 `text-4xl md:text-5xl lg:text-6xl`；只有标题 3-5 个词时才用 `text-6xl md:text-7xl`。4 行 hero 标题永远是字号错误，不是文案长度错误。
- **Hero 顶部 padding 上限（强制）：** 桌面 hero 顶部 padding 最大 `pt-24`（约 6rem）。超过这个值，内容会像漂在视口半腰，读起来像布局 bug，而不是有意留白。如果 hero 需要更强呼吸感，增大字号或资产尺寸，而不是增加 top padding。
- **Hero 栈纪律（最多 4 个文本元素）。** Hero 是一个单一瞬间，不是功能列表。允许文本元素总数最多 4 个：
  1. Eyebrow（小型大写标签）或 brand strip 或都不用 - 选 0 或 1
  2. Headline（最多 2 行，见上）
  3. Subtext（最多 20 个词，最多 4 行）
  4. CTAs（1 个主按钮 + 最多 1 个次按钮）
  - **Hero 中禁止：** CTA 下方小 tagline、信任微条、pricing teaser、feature bullet list、social-proof avatar row。这些都放到 hero 正下方独立 section。
  - 如果同一个 hero 里有 eyebrow 还有 CTA 下方 tagline，删掉 tagline。如果有 brand strip 和 tagline，删掉 tagline。Hero 最多一个小文本元素。
- **“Used by” / “Trusted by” logo wall 属于 Hero 下方，不在 Hero 内。** Hero 用于价值主张和主 CTA。Logo wall 是紧随其后的独立 section。不要把 trust logos 塞进 hero copy 同一个 flex 行。
- **桌面导航必须单行渲染。** 如果 `lg`（1024px）放不下，缩短标签、删掉次要项或移到 hamburger。桌面两行 nav 是坏设计。
- **导航高度上限：桌面最大 80px，默认 64-72px。** 不要做巨大“机构风”nav，占掉 15% 视口。
- **Bento 网格必须有节奏，不是一边倒重复。** 不要堆 6 个左图右文行。改变构图：交替全宽 feature row、不对称 tile、竖向断点。
- **Bento 单元数量规则（强制）：** Bento grid 的单元数量必须严格等于内容数量。3 个 item → 3 个 cell（1+2 split、2+1 或不对称三联）。5 个 item → 5 个 cell（2+3、3+2、hero+4 等）。如果网格中间或末尾有空 cell，说明规划错了。重塑网格，不要塞空 tile。
- **Section 布局重复禁令。** 某个 section 使用过一种布局家族后（如 3-column-image-cards、full-width-quote、split-text-image），该家族最多再出现一次。"Selected commissions" 不应看起来像 "What we do"。一个 8 section 落地页至少使用 4 种不同布局家族。
- **Zigzag 交替上限（强制）。** “左图右文”再“左文右图”的 zigzag 俗套。最多连续 2 个 image+text split section。第 3 个连续 image+text split 是交付前失败。用 full-width section、vertical-stack section、bento grid、marquee 或其他布局家族打断。
- **Eyebrow 克制（强制，生产测试中 #1 违规）：** Eyebrow 是 section 标题上方的小型大写宽字距标签（如 `FOUR COLORWAYS`、`SELECTED WORK`、`THE HARDWARE`、`Git-native task management`）。典型 CSS：`text-[11px] uppercase tracking-[0.18em]`、`font-mono text-[10.5px] uppercase tracking-[0.22em]`。AI 站点会在每个 section header 上都放 eyebrow，形成模板节奏。硬规则：
  - **每 3 个 section 最多 1 个 eyebrow。** Hero 也算 1 个。因此 9 个 section 的页面最多 3 个 eyebrow。
  - 如果 section A 有 eyebrow，接下来 2 个 section 不能有。
  - **交付前机械检查：** 统计所有组件中 `uppercase tracking`（或类似小型大写 mono 标签在标题上方）的实例。若数量 > ceil(sectionCount / 3)，输出失败。
  - **替代 eyebrow 的做法：** 直接去掉。标题本身就够了。如果需要分类，一个 section 在页面中的位置已经完成分类，不需要标签。
- **Split-header 禁令（强制）。** “左边大标题 + 右边小解释段落”作为 section header 的模式（左 col-span-7/8，右 col-span-4/5，一个小正文漂在右列）**默认禁止**。Section 应该只有一个聚焦信息。如果确实需要标题和解释段落，垂直堆叠（标题在上，正文在下，max-width 65ch）。只有存在真实构图理由时才使用 split-header（例如右列承载视觉或交互元素，而不是填充文本）。
- **Bento 背景多样性（强制）。** Bento 和 feature-grid section 不能是 6 个白底文字卡。任何多单元格网格中，至少 2-3 个 cell 需要真实视觉变化：真实图片、品牌合适渐变（不是 AI 紫）、图案、tinted background。纯 cream-on-cream 且全是文字的 bento 即使其他地方不错，也像无聊 AI 默认。
- **移动端折叠必须逐 section 显式声明。** 每个多列布局都要在同一组件中声明 `< 768px` fallback。不要假设“Tailwind 会处理”。

### 4.8 图片与视觉资产策略

落地页和作品集是**视觉产品**。只有文本和假截图 div 的页面是粗糙输出。

**视觉资产优先级：**

1. **优先使用图像生成工具。** 如果环境中有任何 image-gen 工具（`generate_image`、MCP image tool、IDE 集成生成、OpenAI image tools 等），你必须用它生成 section 专属资产：hero 摄影、产品图、纹理背景、氛围图。按 section 需要生成正确宽高比。不要因为手写 CSS 更快就跳过。
2. **其次使用真实网络图片。** 没有生成工具时，使用真实摄影来源。可接受默认：
   - `https://picsum.photos/seed/{descriptive-seed}/{w}/{h}` 作为占位摄影（seed 应描述 section，例如 `marrow-cookware-kitchen`）
   - brief 提供的真实 stock 或品牌 URL
   - 明确允许时使用开放许可来源（Unsplash direct URL、Pexels）
3. **最后才告知用户。** 如果两者都不可行，不要用手写 SVG 插画或 div 假截图填满页面。留下清晰标注的占位槽（`<!-- TODO: hero product photo, 1600x1200 -->`），并在回复结尾说明：_“此页面需要以下真实图片：[位置列表]。请生成或提供。”_

**即使极简站点也需要真实图片。** 纯文本页面不是极简，而是未完成。即使 editorial Linear-style，也至少需要 2-3 张真实图（hero、一张产品/生活方式图、一张支撑图）。若 brief 克制，可生成黑白极简摄影，不要因为旋钮低就完全跳过图片。

**社交证明使用真实公司 logo。** 当 brief 需要 “Trusted by / Used by / Customers” logo wall 时，不要默认纯文字 wordmark（`<span>Acme Co</span>`）。使用真实 SVG logo：

- **来源：Simple Icons**（`https://cdn.simpleicons.org/{slug}/ffffff` 用于任意颜色，或 `simple-icons` npm 包）。覆盖大多数知名品牌。
- **替代：devicon** 用于 tech-stack logo（`@svgr/cli` 或 CDN）。
- **如果品牌名是虚构的，也要虚构 SVG mark。** 生成简单 monogram（圆内单字母、双字母连字、抽象 glyph），用 inline `<svg>` 渲染并匹配页面风格。虚构品牌使用纯文字 wordmark 很泛。
- **始终**确保 logo 在浅色和深色模式都能渲染（暗底白、亮底黑或单色主题变量）。
- **Logo-only 规则（强制）：** logo wall = 只有 logo。不要在每个 logo 下打印行业 / 类别标签（不要 `Vercel` + `hosting`，不要 `Stripe` + `payments`，不要 `Cloudflare` + `infra`）。Logo 本身就是可信度，标签不增加用户不知道的信息。可选：屏幕阅读器 alt-text 中使用品牌名，可选链接到品牌站。仅此而已。

**手写插画：**

- 图标库中的 SVG 图标：可以（见第 3.C 节）。
- 手写装饰 SVG（自定义插画、logo、mark）：**默认强烈不鼓励**。只在以下情况下接受：
  - brief 明确要求（“帮我画一个 SVG logo”）
  - 它是单个简单几何 mark（方形、圆形、display type wordmark）
  - 你对输出质量有信心

**禁止 div 假截图。** 用 `<div>` 矩形、假任务列表、假 dashboard、假 terminal 拼成“产品预览”是明显痕迹。如果需要展示产品：

- 有真实截图 URL 就用真实截图
- 用图像工具生成
- 使用真实组件预览（页面中嵌入 UI 的迷你版本）
- 或完全跳过预览，使用编辑部摄影

**Hero 需要真实视觉。** 文本 + 渐变 blob 不是 hero，而是占位。

### 4.9 内容密度

落地页靠**第一印象**，不是完整阅读。要狠心删减。

- **每个 section 默认内容形态：** 短标题（≤ 8 个词）+ 短副段（≤ 25 个词）+ 一个视觉资产或一个 CTA。更多内容必须由该 section 的任务证明合理。
- **不要 data-dump section。** 营销页上的 20 行 publication 表、30 行 award 列表、巨大 pricing matrix 都是错误布局。使用：
  - Top 3-5 highlights + “View full list” 链接
  - Marquee / carousel 表达广度
  - 如果数据本身就是产品，做另一个页面
- **长列表需要不同 UI 组件，而不是更长的列表。** 默认 `<ul>` + bullets / `divide-y` 行是懒惰选择。超过 5 项时，改用：
  - 2 列 split 并分组
  - 带图片 + label 的卡片网格
  - 如果项目可分类，用 tabs / accordion
  - 横向 scroll-snap pills
  - 用 carousel 表达广度（testimonials、logos、capabilities）
  - 用 marquee 表达“很多东西但不需要逐个关注”
    一个 10 行 specs + 每行 hairline 的规格表是最差默认。要么把行分成 2-3 组并用稀疏分割线，要么改成每个 spec 一张卡。
- **Spec sheets 特别规则（Marrow-cookware 模式）。** 厨具 / 硬件 / 服饰 / 手工艺品 brief 中，长产品规格表每行 `border-b` 是 AI 默认。禁止。具体替代：

  - **2 列卡片网格：** 每个 spec 一张卡，包含 spec 名称、大号数值和一行 “why it matters”。桌面 2 列，移动 1 列。
  - **Scroll-snap 横向 pills：** 每个 spec 是一个 pill，可滑动浏览。
  - **分组块：** 将 10 个 specs 分成 3 个逻辑组（如 “Materials”、“Cooking”、“Warranty”），每组只有一条柔和分割线和一个组标题。
  - **Featured-vs-rest：** 3-4 个主 specs 用大展示 tile，其余收进 “View full specifications” disclosure。

- **文案自审（交付前强制）：** 在声明完成前，重读页面每个可见字符串（标题、副标题、eyebrow、按钮标签、正文、caption、alt text、footer text、错误消息）。标记任何：
  - **语法错误**（“free on its past”、“two plans but one is honest”、“to put it on the table” 等脱离语境）
  - **指代不清**（没有前文的 “we plan to stay that way”）
  - **像 AI 幻觉**（可爱但错误的双关、强行隐喻、“elegant nothing” 之类）
  - **像 LLM 强装深沉**（被动攻击式谦卑、假工匠标签、mock-poetic micro-meta）
    重写所有被标记字符串。不确定是否合理时，替换成朴素功能句。AI 生成的可爱文案比无聊文案更糟。
- **假精确数字会被标记。** `92%`、`4.1×`、`48k`、`5.8 mm`、`13.4 lb` 等数字必须：
  - 来自真实数据（brief、品牌指南、公开指标）- 可以
  - 明确标为 mock（`<!-- mock -->`、“example”、“sample data”）- 可以
  - AI 编造出的规格美学 - 禁止。不要伪造品牌未声明的工程精度。
- **一个页面一种文案语域。** 不要在同一构图里混合技术 mono（“47 tasks · 0.6 ctx-switches/day”）、编辑部散文和营销 punch，除非品牌声音明确要求。

### 4.10 引语与推荐语

- 引语正文**最多 3 行**。永远不要 6 行。如果原引语更长，裁剪。落地页 quote 是片段，不是完整评论。
- 对非常小字号（如 footer 风 testimonial），行数可稍放宽。原则：一眼读完。
- **引语文本中不要使用 em-dash** 做设计修饰（长停顿、kinetic em-dashes、em-dash bullets）。见第 9.G 节，em-dash 完全禁止。
- 署名：姓名 + 职位 +（可选）公司。不要只有名字（“- Sarah”）。
- 引号：使用真正排版引号（“ ”）或不用。不要 ASCII 直引号。

### 4.11 页面主题锁（Light / Dark Mode 一致性）

页面只有一个主题。Section 之间不要反色。

- 如果页面是 dark mode，所有 section 都是 dark mode。不要在深色 section 中夹一个浅色 warm-paper section（反之亦然）。用户不应在滚动中感觉进入了另一个网站。
- 例外：brief 明确要求 “Color Block Story” 或 “Theme Switch on Scroll”，并且这是有意构图（整页一次强转场，不是随机交替），允许一次。
- 默认行为：在页面级选择 light、dark 或 auto（`prefers-color-scheme`）并锁定。同一主题家族内的 section 背景 tint 可以（`bg-zinc-950` 接 `bg-zinc-900`）；在 `bg-zinc-950` 页面中间翻到 `bg-amber-50` 是坏设计。
- 使用内建主题的设计系统（Radix Themes、shadcn/ui with `<Theme>`）时，在 `layout.tsx` 或 page root 只设置一次主题。不要让各 section 自行覆盖。

---

## 5. 上下文感知的主动性

这些是工具，不是默认项。只有设计解读需要时才用。**它们不会自动触发。**

- **Liquid Glass / Glassmorphism：** 适合高端消费、Apple-adjacent、奢侈品牌或媒体叠层氛围。不适合仪表盘、公共部门或“无聊 B2B”。使用时，不要止步于 `backdrop-blur`：增加 1px 内边框（`border-white/10`）和微妙内阴影（`shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]`）表现物理边缘折射。为 `prefers-reduced-transparency` 提供实色兜底。
- **磁吸微物理：** 当 `MOTION_INTENSITY > 5` 且 brief 读起来 premium / playful / agency 时使用。必须用 Motion 的 `useMotionValue` / `useTransform`，脱离 React render cycle 实现。绝不用 `useState`。见第 3.B 节。
- **持续微交互**（Pulse、Typewriter、Float、Shimmer、Carousel）：当 `MOTION_INTENSITY > 5` 且 section 确实受益于 motion（状态指示、live feeds、AI-feel）时使用。**不是每张卡都需要无限循环。** 信息性 section 保持静止。使用 Spring Physics（`type: "spring", stiffness: 100, damping: 20`），不要 linear easing。
- **“声称有动效，就必须展示动效。”** 如果 `MOTION_INTENSITY > 4`，页面必须实际动起来：hero 入场、关键 section scroll-reveal、CTA hover physics，至少这些。声称 `MOTION_INTENSITY: 7` 却静态，是坏输出。反过来，如果当前范围不能交付可工作的 motion，把旋钮降到 3，交付干净静态页。不要半成品 motion（被截断的 ScrollTriggers、跳动入场、缺 cleanup）。
- **动效必须有动机（强制）。** 加任何动画前问：“这个动画传达什么？” 合法答案：层级（引导注意力）、叙事（按叙事顺序揭示）、反馈（确认用户操作）、状态转场（展示变化）。非法答案：“看起来很酷”。因为 GSAP 可用就到处 GSAP 很业余。每个 ScrollTrigger、每个 marquee、每个 pinned section 都需要理由。说不出一句理由就删掉。
- **每页最多一个 marquee（强制）。** 横向滚动文字 marquee（“logo 无限滚动”、“manifesto 横向滚动”、“kinetic word strip”）每页最多一个。两个或更多 marquee 会像懒惰填充。选择真正服务内容的那个 section，其他用不同布局。
- **GSAP Sticky-Stack 模式（使用 scroll-stack 时）。** “滚动卡片堆叠”必须是真正 sticky-stack，不是顺序 reveal list。见第 5.A 节 canonical skeleton。常见失败：trigger 在滚动中途触发，而不是 pin 在视口顶部。修复：`start: "top top"`，不是 `start: "top center"` 或 `"top 80%"`。
- **GSAP Horizontal-Pan 模式（使用横向 scroll-hijack 时）。** 见第 5.B 节 canonical skeleton。常见失败：section pin 之前动画开始，用户看到半张 slide。同样修复：`start: "top top"`，pin wrapper，scrub inner track。

### 5.A Sticky-Stack - 标准骨架

```tsx
'use client';
import { useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useReducedMotion } from 'motion/react';

gsap.registerPlugin(ScrollTrigger);

export function StickyStack({ cards }: { cards: React.ReactNode[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (reduce || !ref.current) return;
    const ctx = gsap.context(() => {
      const cardEls = gsap.utils.toArray<HTMLElement>('.stack-card');
      cardEls.forEach((card, i) => {
        if (i === cardEls.length - 1) return;
        ScrollTrigger.create({
          trigger: card,
          start: 'top top', // pin at viewport top
          endTrigger: cardEls[cardEls.length - 1],
          end: 'top top',
          pin: true,
          pinSpacing: false,
        });
        gsap.to(card, {
          scale: 0.92,
          opacity: 0.55,
          ease: 'none',
          scrollTrigger: {
            trigger: cardEls[i + 1],
            start: 'top bottom',
            end: 'top top',
            scrub: true,
          },
        });
      });
    }, ref);
    return () => ctx.revert();
  }, [reduce]);

  return (
    <div ref={ref} className='relative'>
      {cards.map((card, i) => (
        <div key={i} className='stack-card sticky top-0 min-h-[100dvh] flex items-center justify-center'>
          {card}
        </div>
      ))}
    </div>
  );
}
```

关键点：`start: "top top"`、`pin: true`、最后一张之外每张卡都 pin，scale/opacity transform 由下一张卡的 scroll trigger 驱动（所以前一张卡在下一张进入时缩小）。

### 5.B Horizontal-Pan - 标准骨架

```tsx
'use client';
import { useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useReducedMotion } from 'motion/react';

gsap.registerPlugin(ScrollTrigger);

export function HorizontalPan({ children }: { children: React.ReactNode }) {
  const wrap = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (reduce || !wrap.current || !track.current) return;
    const ctx = gsap.context(() => {
      const distance = track.current!.scrollWidth - window.innerWidth;
      gsap.to(track.current, {
        x: -distance,
        ease: 'none',
        scrollTrigger: {
          trigger: wrap.current,
          start: 'top top', // pin starts when section top hits viewport top
          end: () => `+=${distance}`, // scroll distance = track width minus viewport
          pin: true,
          scrub: 1,
          invalidateOnRefresh: true,
        },
      });
    }, wrap);
    return () => ctx.revert();
  }, [reduce]);

  return (
    <section ref={wrap} className='relative overflow-hidden'>
      <div ref={track} className='flex h-[100dvh] items-center'>
        {children}
      </div>
    </section>
  );
}
```

关键点：`start: "top top"`、`pin: true`、`end: "+=${distance}"`（滚动长度 = 所需横向位移）、`scrub: 1`。Wrapper 被 pin，inner track 随用户纵向滚动而横向滑动。

### 5.C Scroll-Reveal Stagger - 标准骨架（更轻替代）

简单“进入视口时出现”的场景（不 pin），优先使用 Motion 的 `whileInView`，比 GSAP 更轻，不需要 ScrollTrigger：

```tsx
'use client';
import { motion, useReducedMotion } from 'motion/react';

export function RevealStagger({ items }: { items: string[] }) {
  const reduce = useReducedMotion();
  return (
    <ul className='grid gap-6'>
      {items.map((item, i) => (
        <motion.li
          key={item}
          initial={reduce ? false : { opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{
            duration: 0.6,
            delay: i * 0.06,
            ease: [0.16, 1, 0.3, 1],
          }}
        >
          {item}
        </motion.li>
      ))}
    </ul>
  );
}
```

适用：feature lists、testimonial grids、logo walls，任何只需要“滚动进入”的东西。GSAP 留给真正 pin/scrub 的工作。

### 5.D 禁止的动画模式

- **`window.addEventListener("scroll", ...)`** 禁止。它每个滚动帧都运行，容易卡顿，没有批处理。使用 Motion 的 `useScroll()`、GSAP `ScrollTrigger`、IntersectionObserver 或 CSS `scroll-driven animations`（`animation-timeline: view()`）。
- **用 `window.scrollY` + React state 自定义滚动进度。** 同理。每帧重渲染。
- **触碰 React state 的 `requestAnimationFrame` 循环。** 改用 motion values（`useMotionValue` + `useTransform`）。
- **布局转场：** 使用 Motion 的 `layout` 和 `layoutId` props 处理可见状态变化（列表重排、modal 展开、路由间 shared elements）。不要为了“安全”给静态内容套 `layout` props，它会产生测量开销。
- **交错编排：** 对 reveal moments 使用 `staggerChildren`（Motion）或 CSS 级联（`animation-delay: calc(var(--index) * 100ms)`）。使用 `staggerChildren` 时，父（`variants`）和子必须在同一个 Client Component 树内。

---

## 6. 性能与无障碍护栏

### 6.A 硬件加速

- 只动画 `transform` 和 `opacity`。永远不要动画 `top`、`left`、`width`、`height`。
- 谨慎使用 `will-change: transform`，只用于确实会动画的元素。

### 6.B Reduced Motion（强制）

- **任何 `MOTION_INTENSITY > 3` 的动效都必须尊重 `prefers-reduced-motion`。** 这不可协商。
- Motion：用 `useReducedMotion()` 包裹并降级为静态。
- CSS：将动画放在 `@media (prefers-reduced-motion: no-preference)` 下，或在 `@media (prefers-reduced-motion: reduce)` 中提供禁用覆盖。
- 无限循环、视差、scroll-hijack、magnetic physics 在 reduced motion 下必须折叠为静态 / 瞬时。

### 6.C Dark Mode（任何面向消费者页面都强制）

- 从一开始就为**两种模式**设计。除非用户明确要求，否则不要交付 light-only 或 dark-only。
- 使用 Tailwind `dark:` variant 或 CSS variables token。每个项目只选一种策略。
- **这里不规定具体 dark-mode 颜色。** 由 brief 决定。在两种模式下保持视觉层级、品牌表达和 WCAG AA 对比（正文目标 AAA）。
- 尊重 `prefers-color-scheme: dark`。除非品牌坚持某一种模式，否则默认系统偏好。

### 6.D Core Web Vitals 目标

- **LCP** < 2.5s。Hero image 必须 `next/image priority` 或 preload。
- **INP** < 200ms。重任务离开主线程。
- **CLS** < 0.1。为图片、字体、嵌入内容预留空间。
- 声明页面完成前运行 Lighthouse。

### 6.E DOM 成本

- Grain / noise filter 只能应用在 fixed、`pointer-events-none` 伪元素上（如 `fixed inset-0 z-[60] pointer-events-none`）。绝不要放在滚动容器上，持续 GPU repaint 会毁掉移动端 FPS。
- 注意 bundle size。Motion 不小，Three.js 很大。非首屏内容懒加载。

### 6.F Z-Index 克制

绝不要滥用任意 `z-50` 或 `z-10`。z-index 只用于系统层上下文（sticky navbars、modals、overlays、grain）。在项目 constants 文件中记录 z-index scale。

---

## 7. 旋钮定义（技术参考）

### DESIGN_VARIANCE（1-10 级）

- **1-3（可预测）：** 对称 CSS Grid（12-col、等 fr 单元）、等距 padding、居中对齐。
- **4-7（偏移）：** `margin-top: -2rem` 重叠、不同图片宽高比（4:3 旁边 16:9）、左对齐 header 搭配居中数据。
- **8-10（不对称）：** Masonry 布局、CSS Grid 分数列（`grid-template-columns: 2fr 1fr 1fr`）、巨大空白区域（`padding-left: 20vw`）。
- **移动端覆盖：** 4-10 级中，`md:` 以上不对称布局在 `< 768px` 视口必须折叠成严格单列（`w-full`、`px-4`、`py-8`）。

### MOTION_INTENSITY（1-10 级）

- **1-3（静态）：** 无自动动画。只有 CSS `:hover` 和 `:active` 状态。`prefers-reduced-motion` 本身就是默认模式。
- **4-7（流体 CSS）：** `transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1)`。加载入场用 `animation-delay` 级联。专注 `transform` 和 `opacity`。
- **8-10（高级编排）：** 复杂滚动触发 reveal、视差、滚动驱动动画（CSS `animation-timeline` 或 GSAP ScrollTrigger）。使用 Motion hooks。**永远不要用 `window.addEventListener('scroll')`**，这是硬禁令，不是“尽量不用”。允许替代见第 5.D 节。

### VISUAL_DENSITY（1-10 级）

- **1-3（美术馆）：** 大量留白。巨大 section gap（`py-32` 到 `py-48`）。昂贵、干净。
- **4-7（日常应用）：** 标准 web app 间距（`py-16` 到 `py-24`）。
- **8-10（驾驶舱）：** 紧凑 padding。无卡片盒子；用 1px 线分隔数据。强制所有数字使用 `font-mono`。

---

## 8. Dark Mode 协议

默认双模式。除非 brief 是模拟印刷的 editorial，否则不要假设只做 light。

### 8.A Token 策略（选一种并坚持）

- **Tailwind `dark:` variant**（utility-first 项目默认）：每个颜色 utility 配对 dark variant（`bg-white dark:bg-zinc-950`、`text-gray-900 dark:text-gray-100`）。
- **CSS variables**（shadcn/ui、Radix Themes 或具备主题系统的组件库）：定义语义 token（`--surface`、`--surface-elevated`、`--text-primary`、`--accent`），在 `[data-theme="dark"]` 或 `@media (prefers-color-scheme: dark)` 下切换。

### 8.B 不在这里规定具体颜色

Brief 和品牌决定。此 skill 只强制：

- **对比度** - 正文最低 WCAG AA，hero copy 目标 AAA。
- **层级一致** - light 下成立的视觉层级在 dark 下也成立。CTA 在 light 下突出，在 dark 下也要突出。
- **品牌保真** - 主品牌色保持可识别。不要把品牌色在 dark mode 里去饱和到失去身份。
- **不要纯 `#000000` 和纯 `#ffffff`** - 使用 off-black（zinc-950、near-black warm gray）和 off-white。纯值会杀死深度。

### 8.C 默认模式

除非品牌坚持，否则尊重 `prefers-color-scheme`。如果某种模式会失去关键品牌表达，增加手动切换。

### 8.D 完成前测试两种模式

开发时打开页面测试 light 和 dark。不要交付只看过一种模式的页面。

---

## 9. AI 痕迹（禁止模式）

除非 brief 明确要求，否则避免这些特征。

### 9.A 视觉与 CSS

- 默认**不要 neon / outer glows**。使用内边框或微妙 tinted shadows。
- **不要纯黑（`#000000`）。** 使用 off-black、zinc-950 或 charcoal。
- **不要过饱和强调色。** 降饱和以融入中性色。
- **不要大标题过度渐变文字。**
- **不要自定义鼠标光标。** 过时、无障碍差、性能差。

### 9.B 排版

- **避免默认 Inter。** 见第 4.1 节。存在例外路径。
- **不要为了吼叫而超大 H1。** 用字重 + 颜色控制层级，不靠纯字号。
- **衬线约束：** 衬线用于 editorial / luxury / publication，不用于 dashboards。

### 9.C 布局与间距

- **数学上完美**的 padding 和 margin。不要有带尴尬空隙的漂浮元素。
- **不要 3 列等宽功能卡。** 泛用“三张一样横排功能卡”被禁止。使用 2 列 zig-zag、不对称 grid、scroll-pinned 或 horizontal-scroll 替代。

### 9.D 内容与数据（“Jane Doe” 效应）

- **不要泛用名字。** “John Doe”、“Sarah Chan”、“Jack Su” → 用有创意、真实感、符合地区语境的名字。
- **不要泛用头像。** 不要 SVG “egg” 或 Lucide user icons → 用可信照片占位或具体化样式。
- **不要假完美数字。** 避免 `99.99%`、`50%`、`1234567`。使用有机、带噪声的数据（`47.2%`、`+1 (312) 847-1928`）。
- **不要 startup-slop 品牌名。** “Acme”、“Nexus”、“SmartFlow”、“Cloudly” → 创造符合上下文、听起来真实的高端名字。
- **不要空泛动词。** “Elevate”、“Seamless”、“Unleash”、“Next-Gen”、“Revolutionize” → 只用具体动词。

### 9.E 外部资源与组件

- **不要手写 SVG 图标。** 使用 Phosphor / HugeIcons / Radix / Tabler。Lucide 仅限明确请求。
- **默认强烈不鼓励手写装饰 SVG**（见第 4.8 节）。
- **不要 div 假截图。** 永远不要用 `<div>` 矩形拼假产品 UI 模拟截图。使用真实图片、生成图片或跳过预览。
- **不要坏 Unsplash 链接。** 使用 `https://picsum.photos/seed/{descriptive-string}/{w}/{h}`、生成照片占位或实际资产。
- **shadcn/ui 自定义：** 可以用，但绝不要默认状态。按项目审美定制圆角、颜色、阴影、排版。
- **生产就绪洁净度：** 代码视觉干净、可记忆、精细打磨。

### 9.F 生产测试痕迹（完全禁止）

这些模式来自真实 LLM 生成落地页测试。它们是模型想“看起来被设计过”时的默认签名。除非 brief 明确要求某项，否则视为硬禁。

**Hero 与页面顶部**

- **Hero 中不要版本标签。** `V0.6`、`v2.0`、`BETA`、`INVITE-ONLY PREVIEW`、`EARLY ACCESS`、`ALPHA` 默认禁止作为 eyebrow。只有 brief 明确是产品发布 / preview 状态才可接受。
- **不要 “Brand · No. 01” 风格子 eyebrow。** “Marrow · No. 01 · The 6-quart” 这种 micro-meta 行，跳过。

**Section 编号与微标签**

- **不要 section-number eyebrow。** `00 / INDEX`、`001 · Capabilities`、`002 · Featured commission`、`06 · how it works`、`05 · The honest table` 禁止。Eyebrow 应用朴素语言命名主题，而不是枚举。
- **不要图片或 bento tile 上的 `01 / 4` 分页标签。** 用户会数，不需要标签。
- **不要 `Scroll · 001 Capabilities` 风格 scroll cue。** 简单箭头或 “Scroll” 已足够；不要 section-number 前缀。
- **不要 “Index of Work, 2018 - 2026” 风格范围标签**作为 eyebrow。直接说 section 是什么。

**分隔符与点**

- **中点（`·`）限量。** 每行 metadata strip 最多 1 个。不要把它作为一切默认分隔符（“foo · bar · baz · qux · quux”）。需要分隔家族时，优先换行、hairline 或 columns。
- **不要在每个 list/nav/badge 上放装饰彩色状态点。** 在 “ONE Q4 SLOT OPEN” 前或每个 nav link、task row 前放彩点默认禁止。只有表示真实语义状态（服务器状态、可用性标记）且少量使用才可接受。

**Em-dash 与排版花招**

- **不要把 em-dash（`—`）作为设计元素，或用在任何地方。** 完整禁令见第 9.G 节。em-dash 禁止出现在标题、eyebrow、pill、正文、引语、署名、caption、按钮文本、alt text。使用普通 hyphen（`-`）。
- **不要默认用 `<br>` 断开并斜体化标题**作为“设计动作”。例如 “for thirty<br>_years._”。标题首先要自然可读，只有 brief 要求时才玩花样。
- **不要垂直旋转文字**（“INDEX OF WORK, 2018 - 2026” 旋转 90°）。这是 agency-portfolio 套路。只有 brief 明确 agency / Awwwards / experimental 且服务真实构图时才用。
- **不要用 crosshair / hairline grid lines 做装饰。** 只为了“感觉有设计”而画纵横线，禁止。只有组织真实内容时才用。

**假产品预览**

- **Hero 中不要 div 假产品 UI**（假任务列表、假 terminal、假 dashboard）。这是 #1 LLM 设计痕迹。使用真实截图、生成图片、真实组件预览，或完全不用。
- **假截图里不要假版本 footer**（“v0.6.2-rc.1”、“last sync 4s ago · main”）。没有价值，强烈 AI 味。

**营销文案痕迹**

- **不要 “Quietly in use at” / “Quietly trusted by”** 这类社交证明标题。使用自然语言：“Trusted by”、“Used at”、“Customers include”，或如果 logo 已说明一切就跳过标题。
- **不要 “From the field” / “Field notes” / “Currently on the bench” / “On our desks” / “Loose plates”** 这类诗意标签用于 quote、blog 或 sidebar。像表演式工匠。用朴素功能标签（“Testimonials”、“Latest writing”、“Now working on”）或跳过。
- **不要 “We respect the French ones” 风格** mock-humble 行业引用。可爱但 AI 味。
- **不要天气 / 地点条**（“LIS 14:23 · 18°C”）放在 header/footer，除非 brief 明确关于地点 / 时区分布工作室。
- **不要 eyebrow 下的 micro-meta-sentences。** 例如 _“Each of these is a feature we ship today, not a roadmap promise. The list will stay short on purpose.”_ 挤在 section heading 下。Eyebrow + Headline + Body 足够。
- **不要泛用步骤标签。** “Stage 1 / Stage 2 / Stage 3”、“Step 1 / Step 2 / Step 3”、“Phase 01 / Phase 02 / Phase 03”、“Pass One / Pass Two / Pass Three”。禁止。实际步骤内容就是标签。如果必须展示进度，用动词-名词本身（“Install”、“Configure”、“Ship”），不要 “Stage 1: Install”。

**Pills、标签与版本戳**

- **不要在图片上覆盖 pills/labels/tags。** 不要在照片上放 `<span>` 标签如 `Brand · 02`、`PLATE · BRAND`、`Field notes - journal`。要么让图片自己说话，要么在图片下方（图片外）放 caption。
- **不要把照片署名 caption 当装饰。** `Field study no. 12 · Ines Caetano`、`Plate 03 · House archive`、`Frame XII · 35mm` 这种 stock/picsum 图片下的文字很矫饰。只有真实照片且有真实摄影师授权时才可署名。否则跳过 caption 或用一行功能说明（“The 6-quart, in Sage.”）。
- **营销页 footer 不要版本号。** `v1.4.2`、`Build 0048`、`last sync 4s ago · main` 是 CLI / devtool 物件，不属于 landing page。禁止。
- **不要 “Reservation 412 of 800” 风格实时库存计数**当装饰。只有 brief 明确是限量 waitlist 且有真实数据时才可用。

**装饰文字条**

- **Hero 底部不要装饰文字条。** `BRAND. MOTION. SPATIAL.`、`TYPE / FORM / MOTION`、`DESIGN · BUILD · SHIP`、`ESTD. 2018 · LISBON · BRAND. MOTION. SPATIAL.` 这种 hero 底部小 mono-caps 条是 agency-portfolio 套路。默认禁止。只有当文字条承载真实可导航链接（sticky bottom nav）或真实状态信息（cookie banner、docs site build info）时才可接受。
- **section heading 右上角不要漂浮小文本。** 模式：section 有巨大左对齐标题，同一 header 右上角有一个小解释段落漂着，且和其他元素无清晰对齐。这个 floater 是痕迹。要么把 sub-text 放到标题正下方，要么做干净 2 列 header（左标题，右对齐 body），不要小角落漂浮段落。

**列表、分割线与评分**

- **长列表 / spec table 不要每行同时 `border-t` + `border-b`。** 二选一（行间 bottom-border 或组上方 top-border）并稀疏使用。10 行 spec table 每行 hairline 是最懒布局，替代 UI 见第 4.9 节。
- **不要用带背景轨道的评分 / 进度条做比较视觉。** 需要展示 “X out of Y” 比较时，优先数字 + 小图标，或无背景轨道的 tiny inline bar。大号 `bg-zinc-200` 轨道 + 部分填充是 landing page 上的 dashboard UI 噪音。

**地点、时间、滚动提示**

- **99% brief 禁止地点 / 城市名 / 时间 / 天气条。** “Lisbon, working with founders” 在 hero、“1200-690 Lisbon, Portugal” 在 footer、“Lisbon 14:23 · 18°C” 在 nav。这些是 agency-portfolio 装饰痕迹。仅当 brief 明确描述全球分布式工作室且时区相关，或旅行品牌，或真实线下场馆时允许。Footer 中一个联系地址可以，氛围性地点条不行。
- **禁止滚动提示。** `Scroll`、`↓ scroll`、`Scroll to explore`、`Scroll to walk through it`、动画鼠标滚轮图标。用户还没滚动时正在看 hero，他们知道可以滚动。视口底部不需要标签。
- **默认零装饰状态点。** Nav items、list rows、badges、status labels 前的彩点都是痕迹。只有表达真实语义状态（真实服务器状态、真实可用性标记）且每个 page section 最多少量使用时可接受。

### 9.G EM-DASH 禁令（最常被违反的单项痕迹）

**Em-dash（`—`）完全禁止。** 它是 LLM 的标志性文风拐杖，也是生产测试中的 #1 视觉痕迹。不存在“少量允许”，不存在“自然语言里可以”，不存在“正文可以”。没有。

- **标题中禁止。** 使用句号或逗号。
- **Eyebrow / label / pill / button text / image caption / nav item 中禁止。** 用换行、columns 或 hairlines 替代。
- **正文中禁止。** 重构句子：拆成两个句子，或用逗号、括号、冒号。
- **引语署名中禁止。** 使用普通 hyphen + 空格（`-`）或换行 + 较小字重姓名。
- **用作分隔符时 en-dash（`–`）也禁止。** 日期范围（`2018-2026`）用 hyphen。数字范围（`€40-80k`）用 hyphen。

页面上唯一允许的 dash 字符：

- 普通 hyphen `-`（复合词、范围、markup 中 line dividers）
- 数学中的 minus sign（`-5°C`）

如果输出中任何用户可见位置出现一个 `—` 或 `–`，交付前检查失败，必须重写。

此规则不可协商。Agent 历史上会忽略“少用 em-dash”这种措辞。本规则是二元的：零 em-dash。

---

## 10. 参考词汇表（Agent 应知道的模式名）

这是词汇表，不是库。Agent 应知道这些模式名，以便沟通、设计和在设计解读需要时调用。**实现和代码草图位于 Block Library（第 12 节），后续迭代填充。**

### Hero 范式

- **Asymmetric Split Hero** - 一侧文字，一侧资产，大量留白。
- **Editorial Manifesto Hero** - 大字号，无资产，近似海报。
- **Video / Media Mask Hero** - 字体镂空作为视频背景遮罩。
- **Kinetic-Type Hero** - 动态排版作为主视觉。
- **Curtain-Reveal Hero** - Hero 各部分在滚动时像幕布一样展开。
- **Scroll-Pinned Hero** - Hero 固定，内容从后面滚过。

### 导航与菜单

- **Mac OS Dock Magnification** - 边缘 nav，icon hover 流体放大。
- **Magnetic Button** - 向光标吸附。
- **Gooey Menu** - 子项像黏液一样分离。
- **Dynamic Island** - 用于状态 / 提醒的 morphing pill。
- **Contextual Radial Menu** - 点击处展开圆形菜单。
- **Floating Speed Dial** - FAB 弹簧式展开弧形次级动作。
- **Mega Menu Reveal** - 全屏 dropdown，内容 stagger-fade。

### 布局与网格

- **Bento Grid** - 不对称 tile 分组（Apple Control Center）。
- **Masonry Layout** - 错落网格，无固定行高。
- **Chroma Grid** - 带微妙动画渐变的边框 / tile。
- **Split-Screen Scroll** - 两半以相反方向滑动。
- **Sticky-Stack Sections** - Section 滚动时 pin 并堆叠。

### 卡片与容器

- **Parallax Tilt Card** - 跟随鼠标坐标的 3D 倾斜。
- **Spotlight Border Card** - 边框在光标下点亮。
- **Glassmorphism Panel** - 带内折射的磨砂玻璃。
- **Holographic Foil Card** - hover 时彩虹箔片变化。
- **Tinder Swipe Stack** - 实体卡片堆，可滑走。
- **Morphing Modal** - 按钮扩展成自身 dialog。

### 滚动动画

- **Sticky Scroll Stack** - 卡片 sticky 并物理堆叠。
- **Horizontal Scroll Hijack** - 纵向滚动 → 横向平移。
- **Locomotive / Sequence Scroll** - 视频 / 3D 序列绑定滚动条。
- **Zoom Parallax** - 中央背景图随滚动放大。
- **Scroll Progress Path** - SVG 线条沿滚动绘制。
- **Liquid Swipe Transition** - 页面转场像黏稠液体。

### Gallery 与媒体

- **Dome Gallery** - 3D 全景 gallery。
- **Coverflow Carousel** - 带倾斜边缘的 3D carousel。
- **Drag-to-Pan Grid** - 可拖拽的无限画布。
- **Accordion Image Slider** - 窄条 hover 展开。
- **Hover Image Trail** - 鼠标留下弹出的图片轨迹。
- **Glitch Effect Image** - hover 时 RGB 通道偏移。

### 排版与文本

- **Kinetic Marquee** - 无限文本带，随滚动反向。
- **Text Mask Reveal** - 巨大字体作为透明窗口露出视频。
- **Text Scramble Effect** - 加载 / hover 时矩阵式解码。
- **Circular Text Path** - 文本沿旋转圆形路径。
- **Gradient Stroke Animation** - 带运行渐变的描边文字。
- **Kinetic Typography Grid** - 字母躲避光标。

### 微交互与效果

- **Particle Explosion Button** - CTA 成功时碎成粒子。
- **Liquid Pull-to-Refresh** - 刷新指示器像拉伸水滴。
- **Skeleton Shimmer** - 占位骨架上的流动高光。
- **Directional Hover-Aware Button** - 填充从光标进入方向展开。
- **Ripple Click Effect** - 从点击坐标扩散波纹。
- **Animated SVG Line Drawing** - 矢量线实时绘制。
- **Mesh Gradient Background** - 有机 lava-lamp blobs。
- **Lens Blur Depth** - 背景 UI 模糊以聚焦前景动作。

### 动画库选择

- **Motion (`motion/react`)** - UI / Bento / 状态变化动效默认选择。
- **GSAP + ScrollTrigger** - 用于整页 scrolltelling 和 scroll hijack。隔离在专用叶子组件中并用 `useEffect` cleanup。
- **Three.js / WebGL** - 用于 canvas 背景和 3D 场景。同样要求隔离。
- **永远不要在同一组件树中混用 GSAP / Three.js 与 Motion。** 它们会争抢同一帧。

---

## 11. 改版协议

此 skill 同时处理**从零构建和改版**。误判模式是差改版输出的最大来源。

### 11.A 检测模式（第一动作）

- **Greenfield** - 没有现有站点，或已批准完全大改。旋钮从第 1 节基线推断。
- **Redesign - Preserve** - 现代化但不破坏品牌。先审计，抽取 brand tokens，渐进演化。
- **Redesign - Overhaul** - 在现有内容上使用新视觉语言。视觉按 greenfield 处理，但保留内容和 IA。

如果不明确，只问一次：_“这次改版要保留现有品牌，还是视觉上从零开始？”_

### 11.B 动手前先审计

提出更改前记录当前状态：

- **Brand tokens** - primary / accent colors、type stack、logo treatment、radii。
- **Information architecture** - 页面树、主导航、关键转化路径。
- **Content blocks** - 已有内容、哪些起作用、哪些是 filler。
- **Patterns to preserve** - 标志性交互、可识别 hero、文案声音。
- **Patterns to retire** - AI-slop 痕迹、坏布局、死链、泛用 stock 图、性能陷阱。
- **现有站点旋钮读取** - 推断当前 `DESIGN_VARIANCE` / `MOTION_INTENSITY` / `VISUAL_DENSITY`。这是起点，不是基线。
- **SEO baseline** - 当前排名页面、meta titles、structured data、OG cards。**SEO 迁移是改版第一风险。**

### 11.C 保留规则

- **不要改信息架构**，除非用户要求。保持 page slugs、anchor IDs、主 nav labels 稳定，以保护 SEO 和肌肉记忆。
- **应用第 4.2 节前先抽取品牌色。** 已经是紫色的品牌保持紫色，使用 LILA RULE 的例外路径。
- **除非要求重写，否则保留文案声音。** 视觉现代化 ≠ 内容重写。
- **尊重已有无障碍优点。** 不要回退 focus states、alt text、键盘导航、对比度。
- **尊重已有 analytics events。** 不要重命名下游追踪依赖的按钮、表单字段、section IDs。

### 11.D 现代化杠杆（优先级顺序）

按顺序应用，满足 brief 后停止：

1. **排版刷新** - 单位风险下视觉提升最大。
2. **间距与节奏** - 增加 section padding，修正垂直节奏。
3. **色彩再校准** - 降饱和、统一中性色、保留品牌强调。
4. **动效层** - 给现有组件增加符合 `MOTION_INTENSITY` 的微交互。
5. **Hero 与关键 section 重组** - 使用第 10 节词汇重构顶部漏斗。
6. **完整 block 替换** - 仅当现有 block 无法挽救。

### 11.E 决策树：定向演进 vs 完整改版

- IA、内容和 SEO 健全 → **定向演进**（杠杆 1-4）。约 40% 风险获得 70% 价值。
- 视觉债是结构性的（IA 坏、无设计系统、移动端坏） → **完整改版**，严格保留内容。
- 品牌本身在变化 → **greenfield**。

### 11.F 不可静默改变的东西

未经用户明确批准，永远不要修改：

- URL 结构 / route slugs。
- 主 nav labels。
- 表单字段名或顺序（会破坏 analytics + autofill）。
- 品牌 logo 或 wordmark。
- 现有 legal / consent / cookie 文案。

---

## 12. Block Library（契约 - 实现迭代落在这里）

Reference Vocabulary（第 10 节）命名模式。Block Library 用真实 props、真实 motion spec 和真实代码草图实现它们。

**状态：** 此处定义 schema。Blocks 后续迭代添加。不要不按 schema 自由发挥新 block。

### 12.A 文件位置

```text
skills/taste-skill/blocks/
  hero/
    asymmetric-split.md
    editorial-manifesto.md
    kinetic-type.md
    ...
  feature/
    bento-grid.md
    sticky-scroll-stack.md
    zig-zag.md
    ...
  social-proof/
  pricing/
  cta/
  footer/
  navigation/
  portfolio/
  transition/
```

### 12.B 必需 Frontmatter

```yaml
---
name: asymmetric-split-hero
category: hero
dial_compatibility:
  variance: [6, 10]
  motion: [3, 10]
  density: [2, 5]
when_to_use: 'Landing pages with one strong asset and one strong message. Default hero for SaaS, agency, premium consumer.'
not_for: 'Editorial / manifesto launches where the message IS the design.'
stack: ['react', 'next', 'tailwind', 'motion']
---
```

### 12.C 必需正文小节

1. **Visual sketch** - 简短 ASCII 或布局描述。
2. **Props API** - 组件接口。
3. **Code sketch** - 最小可运行实现（默认 Server Component，motion 用 Client island）。
4. **Mobile fallback** - `< 768px` 显式折叠规则。
5. **Motion variants** - 每个 `MOTION_INTENSITY` 档位一个变体（1-3、4-7、8-10）。Reduced-motion fallback 必须明确。
6. **Dark-mode notes** - 此 block 的 token 策略。
7. **Anti-patterns** - 此 block 常见错误。
8. **References** - 真实生产案例链接。

### 12.D Block-Library 纪律

- 一个文件一个 block。不要多 block 文件。
- 每个 block 必须能独立工作（丢进页面即可渲染）。
- 每个 block 必须通过 Pre-Flight Check（第 14 节）。
- 依赖第 2.A 节设计系统的 blocks 放在 `blocks/<category>/<name>--<system>.md` 下（如 `feature/bento-grid--material.md`）。

---

## 13. 范围外

此 skill 不适用于：

- 仪表盘 / 高密产品 UI / 管理后台（使用第 2.A 节中的 Fluent、Carbon、Atlassian 或 Polaris）。
- 数据表格（使用 TanStack Table 或 AG Grid）。
- 多步骤表单 / 向导（使用 Form-specific patterns；此 skill 不会让它们更好）。
- 代码编辑器（使用 Monaco / CodeMirror 及其官方 skinning）。
- 原生移动端（直接使用 Apple HIG / Material）。
- 实时协作 UI（presence、cursors、OT-aware，是另一类问题）。

如果 brief 属于上述之一，**明确说出来**，指向正确工具，并且只在 marketing-page / about-page / landing-page 相关表面应用此 skill。

---

## 14. 最终交付前检查

输出代码前运行此矩阵。这是最后一道过滤器。

**这不是可选项。每一项都要检查。任何一项失败，输出就未完成。**

- [ ] 是否已声明**需求推断**（第 0.B 节一行）？
- [ ] **旋钮值**是否明确，并基于 brief 推理，而不是静默使用基线？
- [ ] 是否在适用时从第 2 节选择**设计系统**，或诚实标注审美方向？
- [ ] 如果是改版，是否检测**改版模式**并执行审计（第 11 节）？
- [ ] 页面任何位置是否**零 em-dashes（`—`）**？标题、eyebrow、pill、正文、quote、署名、caption、button、alt text 全部为零（第 9.G 节，不可协商）。
- [ ] **页面主题锁**：全页一个主题（light、dark 或 auto）？没有中途 section 反色（第 4.11 节）？
- [ ] **色彩一致性锁**：一个强调色在所有 section 中一致使用（第 4.2 节）？
- [ ] **形状一致性锁**：一个圆角系统一致应用（第 4.4 节）？
- [ ] **按钮对比检查**：每个 CTA 文字相对背景可读（无白底白字，WCAG AA 4.5:1）？
- [ ] **CTA 按钮换行**：桌面端没有 CTA 标签换成 2 行以上？
- [ ] **表单对比检查**：表单输入、placeholder、focus ring、label 相对 section 背景均通过 WCAG AA？
- [ ] **衬线纪律**：如果用了衬线，它不是 Fraunces 或 Instrument_Serif（除非有明确品牌理由）？是否和上一个项目不同？
- [ ] **高端消费 palette 检查**：如果 brief 是高端消费（厨具 / 健康 / artisan / luxury），palette 不是 AI 默认 beige+brass+oxblood+espresso 家族？是否和上一个高端消费项目不同？
- [ ] **斜体下伸部留白**：每个含 `y g j p q` 的斜体词至少 `leading-[1.1]` + `pb-1` 预留？
- [ ] **Hero 适配视口**：标题 ≤ 2 行，subtext ≤ 20 个词且 ≤ 4 行，CTA 无需滚动可见，字号围绕图片规划？
- [ ] **Hero 顶部 padding**：桌面最大 `pt-24`，hero 内容没有漂到视口半腰？
- [ ] **Hero 栈纪律**：hero 最多 4 个文本元素（eyebrow 或 brand strip、headline、subtext、CTAs）？没有 CTA 下方小 tagline，没有 hero 内 trust micro-strip？
- [ ] **Eyebrow 数量（机械）**：统计所有 section headline 上方 `uppercase tracking` 微标签。数量 ≤ ceil(sectionCount / 3)？Hero 算 1。
- [ ] **Split-Header 禁令**：没有“左大标题 + 右小解释段落”作为 section header（改为垂直堆叠）？
- [ ] **Zigzag 交替上限**：没有 3 个以上连续相同 image+text-split 布局？
- [ ] **无重复 CTA 意图**：页面中没有两个同意图 CTA（“Get in touch” + “Let's talk” 同页 = 失败）？
- [ ] **Logo wall = 只有 logo**：没有在 logo 下打印行业 / 类别标签？
- [ ] **Bento 背景多样性**：至少 2-3 个 bento cell 有真实视觉变化（图片、渐变、图案），不是全白底文字卡？
- [ ] **“Used by / Trusted by” logo wall** 位于 hero 下方，而不是 hero 内，且使用真实 SVG logos（Simple Icons / devicon）或生成 SVG marks，不是纯文字 wordmark？
- [ ] **文案自审**：所有可见字符串已重读，没有语法错误或 AI 幻觉短语？
- [ ] **动效有动机**：每个动画都能用一句话说明目的（层级 / 叙事 / 反馈 / 状态转场），没有为了 GSAP 而 GSAP？
- [ ] **每页最多一个 marquee**：同页没有两个横向 marquee？
- [ ] **桌面导航单行**，高度 ≤ 80px？
- [ ] **Section 布局重复**检查：没有两个 section 使用相同布局家族（8 个 section 至少 4 种布局家族）？
- [ ] **Bento 有节奏且数量准确**（N items → N cells，没有中间或末尾空 cell）？
- [ ] **长列表使用正确 UI 组件**（>5 项不使用默认 `<ul>` + `divide-y`，见第 4.9 节替代）？
- [ ] **使用真实图片**（优先 gen-tool，再 Picsum seed，再明确占位槽）？没有 div 假截图，没有手写装饰 SVG，没有纯文本极简？
- [ ] **没有图片上覆盖 pills/labels**（无 `Plate · Brand`、`Field notes - journal`）？
- [ ] **没有把照片署名 caption 当装饰**（`Field study no. 12 · Ines Caetano`）？
- [ ] **营销页没有版本 footer**（`v1.4.2`、`Build 0048`）？
- [ ] **Eyebrow 下无 micro-meta-sentences**（“Each of these is a feature we ship today...”）？
- [ ] **Hero 底部无装饰文字条**（`BRAND. MOTION. SPATIAL.`）？
- [ ] **Section heading 右上角无漂浮小文本**？
- [ ] **没有带背景轨道的评分 / 进度条**作为比较视觉？
- [ ] **无地点 / 城市名 / 时间 / 天气条**，除非 brief 真的与全球分布或地点相关？
- [ ] **无滚动提示**（`Scroll`、`↓ scroll`、`Scroll to explore`）？
- [ ] **Hero 中无版本标签**（V0.6、BETA、INVITE-ONLY），除非 brief 是发布？
- [ ] **无 section-numbering eyebrows**（`00 / INDEX`、`001 · Capabilities`、`06 · how it works`）？
- [ ] **无装饰彩点**（默认零，仅真实语义状态可用）？
- [ ] **长列表 / spec table 没有每行 `border-t` + `border-b`**？
- [ ] **内容密度合理**：无 20 行数据表，无无根据假精确规格，默认 sub-paragraph ≤ 25 个词？
- [ ] **Quote 正文 ≤ 3 行**，署名干净（无 em-dash）？
- [ ] **声称有动效 = 实际展示动效**：如果 `MOTION_INTENSITY > 4`，页面实际有动画，而非只声称？
- [ ] **GSAP sticky-stack / horizontal-pan** 是否按第 5.A / 5.B 标准骨架实现（`start: "top top"`、`pin: true`、正确 scrub）？
- [ ] **没有 `window.addEventListener('scroll')`**，只用 Motion `useScroll()` / ScrollTrigger / IntersectionObserver / CSS scroll-driven animations？
- [ ] **Reduced motion** 是否覆盖所有 `MOTION_INTENSITY > 3` 的动效？
- [ ] **Dark mode** token 已定义并在两种模式测试？
- [ ] **移动端折叠** 对高变化布局显式设置（`w-full`、`px-4`、`max-w-7xl mx-auto`）？
- [ ] **视口稳定**：使用 `min-h-[100dvh]`，绝不 `h-screen`？
- [ ] **`useEffect` 动画**有严格 cleanup？
- [ ] **Empty / loading / error** 状态已提供？
- [ ] 是否尽可能用间距替代卡片？
- [ ] **图标**只来自允许库（Phosphor / HugeIcons / Radix / Tabler），无手写 SVG path？
- [ ] **Motion** 是否隔离在顶部带 `'use client'` 的 client-leaf 组件，并已 memoize？
- [ ] **无第 9 节 AI 痕迹**（默认 Inter、AI-purple、三等卡、Jane Doe、Acme、“Quietly in use at”）？
- [ ] **Core Web Vitals** 合理可达（LCP < 2.5s、INP < 200ms、CLS < 0.1）？
- [ ] **每个项目一个设计系统**（未混用 Material + shadcn）？

如果任何一个 checkbox 不能诚实勾选，页面就没完成。先修复，再交付。

---

# 附录 - 基于真实来源的参考材料

以下章节是 vendored 参考内容。它们提供每个第 2 节命名设计系统的真实安装命令、官方文档链接和可工作的起始片段。用它们把决策锚定在生产现实，而不是训练数据幻觉。

## Appendix A - 各设计系统安装命令

```bash
# Material Web (Material 3)
npm install @material/web

# Fluent UI React (v9)
npm install @fluentui/react-components

# Fluent UI Web Components (framework-free)
npm install @fluentui/web-components @fluentui/tokens

# IBM Carbon
npm install @carbon/react @carbon/styles

# Radix Themes
npm install @radix-ui/themes

# shadcn/ui (open code, owned components)
npx shadcn@latest init
npx shadcn@latest add button card badge separator input

# Primer CSS (GitHub product/devtool UI)
npm install --save @primer/css

# Primer Brand (GitHub marketing UI)
npm install @primer/react-brand

# GOV.UK Frontend
npm install govuk-frontend

# USWDS (US Web Design System)
npm install uswds

# Atlassian Design System (Atlaskit)
yarn add @atlaskit/css-reset @atlaskit/tokens @atlaskit/button @atlaskit/badge @atlaskit/section-message @atlaskit/card

# Bootstrap 5.3
npm install bootstrap

# Shopify Polaris Web Components (Shopify apps only)
# Add this to your app HTML head:
#   <meta name="shopify-api-key" content="%SHOPIFY_API_KEY%" />
#   <script src="https://cdn.shopify.com/shopifycloud/polaris.js"></script>
```

## Appendix B - 官方来源（重造前先读）

### Material Web

- https://github.com/material-components/material-web
- https://material-web.dev/theming/material-theming/
- https://m3.material.io/develop/web

### Fluent UI

- https://fluent2.microsoft.design/get-started/develop
- https://fluent2.microsoft.design/components/web/react/
- https://github.com/microsoft/fluentui
- https://learn.microsoft.com/en-us/fluent-ui/web-components/

### Carbon

- https://carbondesignsystem.com/
- https://github.com/carbon-design-system/carbon
- https://carbondesignsystem.com/developing/react-tutorial/overview/
- https://carbondesignsystem.com/developing/web-components-tutorial/overview/

### Shopify Polaris

- https://shopify.dev/docs/api/app-home/web-components
- https://github.com/Shopify/polaris-react
- https://polaris-react.shopify.com/components

### Atlassian

- https://atlassian.design/get-started/develop
- https://atlassian.design/components/button/examples
- https://atlaskit.atlassian.com/packages/design-system/button/example/disabled
- https://atlassian.design/tokens/design-tokens

### Primer

- https://primer.style/
- https://github.com/primer/css
- https://github.com/primer/brand

### GOV.UK

- https://design-system.service.gov.uk/components/button/
- https://design-system.service.gov.uk/styles/layout/
- https://github.com/alphagov/govuk-frontend

### USWDS

- https://designsystem.digital.gov/documentation/developers/
- https://designsystem.digital.gov/components/button/
- https://designsystem.digital.gov/components/card/
- https://github.com/uswds/uswds

### Bootstrap

- https://getbootstrap.com/docs/5.3/layout/grid/
- https://getbootstrap.com/docs/5.3/components/card/

### Tailwind

- https://tailwindcss.com/docs/dark-mode
- https://tailwindcss.com/blog/tailwindcss-v4

### Radix

- https://www.radix-ui.com/themes/docs/components/theme
- https://www.radix-ui.com/themes/docs/components/card
- https://github.com/radix-ui/themes

### shadcn/ui

- https://ui.shadcn.com/docs
- https://ui.shadcn.com/docs/components/card
- https://github.com/shadcn-ui/ui

### Native CSS / W3C standards

- https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/backdrop-filter
- https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/prefers-color-scheme
- https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/prefers-reduced-motion
- https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Grid_layout
- https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Scroll-driven_animations
- https://drafts.csswg.org/scroll-animations-1/

### Apple Liquid Glass（仅 Apple 平台）

- https://developer.apple.com/design/human-interface-guidelines/materials
- https://developer.apple.com/documentation/TechnologyOverviews/liquid-glass
- https://developer.apple.com/documentation/TechnologyOverviews/adopting-liquid-glass
- https://developer.apple.com/documentation/SwiftUI/Material

---

## Appendix C - Apple Liquid Glass：诚实的 Web 近似

不要把随机 CSS 片段当成官方 Apple Liquid Glass。

### 什么是官方的

Apple 在 Apple Human Interface Guidelines 和 Developer Documentation 中为 **Apple 平台**记录了 Liquid Glass。它是贯穿 Apple 平台 UI 的动态材质。Apple 原生实现属于 Apple 平台 API 和系统组件，**不是公开 Web CSS 包**。

相关官方文档：

- Apple Human Interface Guidelines → Materials
- Apple Developer Documentation → Liquid Glass
- Apple Developer Documentation → Adopting Liquid Glass
- SwiftUI → Material

### 什么不是官方的

不存在 Apple 提供给普通网站的 `liquid-glass.css`。

Web 近似可以使用：

- `backdrop-filter`
- 透明背景
- 分层边框
- 高光覆盖层
- 渐变
- 动效
- 强对比兜底

但这只是 **web glassmorphism / frosted-glass 近似**，不是官方 Apple Liquid Glass。注释中必须如此标注。

### 更安全的 Web 近似骨架

```css
.liquid-glass-web-approx {
  position: relative;
  isolation: isolate;
  overflow: hidden;
  border-radius: 999px;
  border: 1px solid rgb(255 255 255 / 0.32);
  background: linear-gradient(135deg, rgb(255 255 255 / 0.3), rgb(255 255 255 / 0.08)), rgb(255 255 255 / 0.12);
  backdrop-filter: blur(24px) saturate(180%) contrast(1.05);
  -webkit-backdrop-filter: blur(24px) saturate(180%) contrast(1.05);
  box-shadow: inset 0 1px 0 rgb(255 255 255 / 0.48), inset 0 -1px 0 rgb(255 255 255 / 0.12),
    0 18px 60px rgb(0 0 0 / 0.18);
}

.liquid-glass-web-approx::before {
  content: '';
  position: absolute;
  inset: 0;
  z-index: -1;
  border-radius: inherit;
  background: radial-gradient(circle at 20% 0%, rgb(255 255 255 / 0.55), transparent 34%), linear-gradient(90deg, rgb(255
          255 255 / 0.18), transparent 42%, rgb(255 255 255 / 0.14));
  pointer-events: none;
}

.liquid-glass-web-approx::after {
  content: '';
  position: absolute;
  inset: 1px;
  border-radius: inherit;
  border: 1px solid rgb(255 255 255 / 0.14);
  pointer-events: none;
}

@media (prefers-color-scheme: dark) {
  .liquid-glass-web-approx {
    border-color: rgb(255 255 255 / 0.18);
    background: linear-gradient(135deg, rgb(255 255 255 / 0.16), rgb(255 255 255 / 0.04)), rgb(15 23 42 / 0.42);
    box-shadow: inset 0 1px 0 rgb(255 255 255 / 0.22), 0 18px 60px rgb(0 0 0 / 0.42);
  }
}

@media (prefers-reduced-transparency: reduce) {
  .liquid-glass-web-approx {
    background: rgb(255 255 255 / 0.96);
    backdrop-filter: none;
    -webkit-backdrop-filter: none;
  }
}
```

**重要：** `prefers-reduced-transparency` 浏览器支持不均。必须测试。即使没有 blur，也始终提供足够对比。

---

**附录结束。** 上方安装命令是现实锚点。Apple Liquid Glass 骨架是明确标注的近似，不是 Apple 发布的包。每个设计系统的规范文档请查阅其官方文档（第 2 节与 Appendix B 中的链接）。
