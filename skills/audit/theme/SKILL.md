---
name: bydfi-audit-theme
description: 审查项目主题合规性（硬编码颜色、CSS 变量使用、深浅模式覆盖、RTL 兼容），生成整改报告 支持 $ARGUMENTS scope: ssg/ssr/core/components。
disable-model-invocation: true
allowed-tools: Bash, Read, Write, Glob, Grep, Agent
---

按 `$ARGUMENTS` scope 扫描 下所有样式代码，审查是否遵循双主题体系规范，生成整改报告。

**两段式执行**：脚本化部分（硬编码颜色检测）+ 半脚本化部分（RTL / 深浅模式 / 多皮肤 / 未使用 CSS 变量，需 LLM Agent 配合）。脚本化部分跨次跑 byte-byte 一致；半脚本化部分仍受 LLM 注意力影响。

## 调用方式

```bash
mkdir -p reports/$(date +%Y-%m-%d)
node .claude/skills/audit/theme/scripts/audit.mjs \
  > reports/$(date +%Y-%m-%d)/byd-audit-theme-$(date +%Y-%m-%d).md
```

## 输出位置

`reports/YYYY-MM-DD/byd-audit-theme-YYYY-MM-DD.md`（reports/ 已 gitignore）

## 脚本覆盖范围

| 维度                                            | 脚本化 |   半脚本化（LLM Agent）   |
| ----------------------------------------------- | :----: | :-----------------------: |
| 硬编码颜色检测（hex / rgb / rgba / hsl / hsla） |   ✅   |             —             |
| 注释 / SVG 内联 / 第三方品牌色豁免              |   ✅   |             —             |
| 业务违规 Top 文件聚合                           |   ✅   |             —             |
| Cross-check 锚点（system grep 对比）            |   ✅   |             —             |
| RTL 物理属性（margin-left 等）                  |   —    |     ✅（需 Agent B）      |
| 深浅模式覆盖（[data-theme] 选择器）             |   —    |     ✅（需 Agent B）      |
| 多皮肤覆盖（[data-skin] 选择器）                |   —    |     ✅（需 Agent B）      |
| 未使用 CSS 变量                                 |   —    | ✅（需 Agent A 二次确认） |

脚本输出仅包含上半部分；下半部分见下方"执行方式"章节的 Agent A/B 流程。

## Cross-check 锚点

脚本内置 1 个 sanity check：主统计的 hex 颜色命中数 vs `system grep -E` 独立统计。**预期 system grep ≥ 主统计**（system grep 含主题定义文件中的 CSS 变量值，主统计已通过 `SKIP_PATH_FRAGMENTS` 排除）。如果主统计 > grep，说明 walk 逻辑或 regex 有 bug。

## 参数

`$ARGUMENTS` 作为审查 scope，限定扫描范围：

| 参数         | 范围                           |
| ------------ | ------------------------------ |
| 空           | 全量默认范围                   |
| `ssg`        | `apps/byd-ssg`                 |
| `ssr`        | `apps/byd-ssr`                 |
| `core`       | `packages/apps-kit/core`       |
| `components` | `packages/apps-kit/components` |

传入其他值时必须停止执行并提示仅支持 `ssg` / `ssr` / `core` / `components`。后续 Glob / Grep / 脚本 / Agent 审查都必须只基于选定 scope；报告的“检查范围”也必须写明实际 scope。

## 主题系统概要

### 皮肤与模式

4 皮肤 × 2 模式 = 8 种组合：

| 皮肤         | 枚举值    | 主色      | data-skin 值 |
| ------------ | --------- | --------- | ------------ |
| 黄色（默认） | `primary` | `#FFD30F` | `primary`    |
| 蓝色         | `blue`    | `#1772F8` | `blue`       |
| Axiom        | `axiom`   | `#526FFF` | `axiom`      |
| GMGN         | `gmgn`    | `#81D69D` | `gmgn`       |

模式：`dark` / `light`，通过 `document.documentElement.setAttribute('theme', ...)` 切换。

### CSS 变量体系

| 前缀        | 用途                             | 示例                                                                         |
| ----------- | -------------------------------- | ---------------------------------------------------------------------------- |
| `--spec-*`  | 语义色（字体、边框、阴影、背景） | `--spec-font-color-1`、`--spec-border-level-2`、`--spec-shadow-level-1-down` |
| `--skin-*`  | 品牌色（主色、渐变、透明度）     | `--skin-primary-color`、`--skin-primary-bg-linear-1`                         |
| `--color-*` | 涨跌色（动态注入 DOM）           | `--color-red`、`--color-green`、`--color-hover-red`                          |
| `--theme-*` | 旧变量（部分存留）               | `--theme-background-color-13`                                                |

变量定义位置：`packages/apps-kit/core/styles/src/theme/setting/colors/`（4 个皮肤子目录）。

### 样式技术栈

styled-jsx + SCSS，颜色通过 `var(--spec-*)` / `var(--skin-*)` 引用。

## 扫描范围

`apps/*/src/` + `packages/*/src/` 下的 `*.tsx`、`*.ts`、`*.scss`、`*.css` 文件。

### 排除目录

- `node_modules/`、`.next/`、`out/`、`out-rtl/`、`dist/`、`build/`、`.vscode/`
- `packages/apps-kit/core/styles/src/theme/setting/colors/` — CSS 变量定义文件本身
- `packages/apps-kit/core/styles/src/theme/constants.ts` — 主题常量定义
- `packages/apps-kit/core/styles/src/theme/app-setting/` — 主题初始化脚本
- `**/public/static/**/theme.js` — 客户端主题初始化

## 执行方式

使用 Agent 并行派发两个子任务，最后汇总为统一报告。

### 前置步骤：收集变量基准

在派发 Agent 前，先从变量定义目录提取所有 CSS 变量名列表，作为审查基准传给两个 Agent：

```bash
# 提取所有 --spec-* / --skin-* / --color-* 变量名
rg -o "'--(?:spec|skin|color|theme)-[a-zA-Z0-9-]+'" packages/apps-kit/core/styles/src/theme/ --no-filename | sort -u
```

### 阶段 1：并行审查

**Agent A — 颜色合规审查**

扫描所有样式代码，检查以下维度：

1. **硬编码颜色检测**

   grep 模式（在 styled-jsx 模板字符串、SCSS 文件、内联 style 中搜索）：

   ```
   #[0-9a-fA-F]{3,8}\b
   rgb\(
   rgba\(
   hsl\(
   hsla\(
   ```

   **统计方法（必须遵循）**：

   - **先做全目录 grep count**：对每个 app/package 目录用 `grep --count` 获取精确总数，不要只看 top N 文件就估算
   - **排除注释行**：`//` 开头的行和 `/* */` 块注释中的颜色不计为有效违规。统计时先 grep 总数，再 grep 注释中的数量，相减得有效数
   - **SVG 图标组件单独统计**：内联 SVG 的 `fill`/`stroke` 颜色数量大（单个 gift.tsx 就有 86 处），报告中需标注"含内联 SVG 共 X 处"和"排除 SVG 图标后 X 处"两个口径

   对每个命中，判断是否违规：

   | 场景                                                                                                | 判定 | 说明                                        |
   | --------------------------------------------------------------------------------------------------- | ---- | ------------------------------------------- |
   | 组件样式中的固定颜色（含 JS 三元/fallback 中的颜色，如 `?? '#0AA869'`、`isDark ? '#fff' : '#000'`） | 违规 | 应替换为 `var(--spec-*)` 或 `var(--skin-*)` |
   | `rgba(var(--color-active-rgb), 0.1)`                                                                | 合规 | CSS 变量 + 透明度组合                       |
   | `rgba(0,0,0,0)` / `transparent`                                                                     | 合规 | 透明色                                      |
   | 第三方品牌色（Twitter `#1d9bf0`、Telegram 等）                                                      | 豁免 | 标注「品牌色豁免」                          |
   | SVG `fill`/`stroke` 固定色                                                                          | 豁免 | 标注「SVG 图标豁免」                        |
   | Canvas/分享卡生成代码中的颜色                                                                       | 豁免 | 标注「离屏渲染豁免」，但建议从变量取值      |
   | CSS 变量定义文件中的值                                                                              | 排除 | 已在排除目录                                |
   | `currentColor` / `inherit`                                                                          | 合规 | CSS 关键字                                  |

2. **未使用的 CSS 变量**

   用前置步骤收集的变量列表，逐一 grep `var(--变量名)` 是否在 `apps/` 和 `packages/` 的样式代码中被引用（排除变量定义文件自身和 `.vscode/`）。列出从未被引用的变量。

   **二次确认（必须）**：对零引用的变量，执行以下额外检查后再判定"未使用"：

   - **动态拼接**：grep 变量名片段（如 `font-color-` + 模板字符串 `${`），判断是否通过 JS 拼接引用
   - **getComputedStyle**：在变量相关的包中（如 `--spec-kline-*` 对应 `apps-base-kline`）grep `getComputedStyle` + 变量名关键词。有命中 → 标"动态使用"；无命中 → 标"确认未使用"
   - **setProperty vs var()**：部分变量仅通过 `setProperty` 注入但从未被 `var()` 消费（如 `--color-active-rgb`），需区分"已注入但未消费"和"完全未使用"

**Agent B — 主题覆盖与 RTL 审查**

1. **深浅模式覆盖**

   扫描 styled-jsx 和 SCSS 中包含颜色属性的规则块，检查：

   - 使用了 `var(--spec-*)`/`var(--skin-*)` → 合规（变量本身处理了深浅切换）
   - 使用了硬编码颜色且**未**通过 `[data-theme="dark"]`/`[data-theme="light"]` 或 `[theme="dark"]`/`[theme="light"]` 选择器区分 → 违规
   - 只处理了一个模式（有 dark 无 light 或反之） → 违规

2. **多皮肤覆盖**

   扫描使用了 `[data-skin]` 选择器的规则块，检查是否覆盖所有 4 种皮肤（`primary`/`blue`）。只覆盖部分皮肤 → 标记为警告（不是所有组件都需要区分皮肤）。

   **统计口径**：只统计**业务组件**中的 CSS 选择器用法。排除主题定义层（`theme/setting/`、`theme/app-setting/`）和 Storybook（`.storybook/`、`*.stories.tsx`）。报告中注明口径。

   **皮肤 style.tsx 完整性检查（必须）**：读取每个皮肤的 `style.tsx`（路径：`setting/colors/{skin}/style.tsx`），检查 `getThemeColors` 是否同时为 `'dark'` 和 `'light'` 生成了 CSS。已知陷阱：axiom 和 gmgn 的 `style.tsx` 函数签名接受 `'dark' | 'light'`、colorMap 也包含 light 值，但只渲染了 dark 选择器——这种"定义了但未调用"的模式需要读代码才能发现。

3. **RTL 兼容性**

   扫描以下物理属性的使用：

   | 物理属性                                 | 建议替换的逻辑属性                            |
   | ---------------------------------------- | --------------------------------------------- |
   | `margin-left` / `margin-right`           | `margin-inline-start` / `margin-inline-end`   |
   | `padding-left` / `padding-right`         | `padding-inline-start` / `padding-inline-end` |
   | `left` / `right`（position 定位）        | `inset-inline-start` / `inset-inline-end`     |
   | `text-align: left` / `text-align: right` | `text-align: start` / `text-align: end`       |
   | `float: left` / `float: right`           | `float: inline-start` / `float: inline-end`   |
   | `border-left` / `border-right`           | `border-inline-start` / `border-inline-end`   |

   **grep 模式必须包含变体属性**：`border-left` 的 grep 还需覆盖 `border-left-color`、`border-left-width`、`border-left-style`。用 `border-left` 不加 `\b` 限制词尾即可命中变体。其他属性同理（`padding-left-*` 等无变体，可忽略）。

   **不标记为违规的例外**：

   - `transform: translateX()` — 动画/过渡中的物理方向
   - `:global()` 中覆盖第三方组件的样式
   - `direction: rtl` / `direction: ltr` 本身
   - Flexbox 的 `row-reverse` — 已处理 RTL

   **注意**：RTL 违规密度会很高（项目历史上使用物理属性），报告中按组件分组汇总，不逐行列出。给出 top 20 违规最多的文件即可。

### 阶段 2：汇总报告

两个 Agent 返回结果后，汇总为统一报告并写入文件。

## 报告格式

### 概览（表格）

| 维度         | 问题数 | 严重 | 警告 | 建议 | 豁免 |
| ------------ | ------ | ---- | ---- | ---- | ---- |
| 硬编码颜色   | n      | n    | n    | n    | n    |
| 未使用变量   | n      | —    | n    | —    | —    |
| 深浅模式缺失 | n      | n    | n    | —    | —    |
| 多皮肤覆盖   | n      | —    | n    | n    | —    |
| RTL 兼容     | n      | —    | n    | n    | —    |
| **合计**     | n      | n    | n    | n    | n    |

### 硬编码颜色违规清单

按应用/包分组，每组一个表格，按严重程度降序：

| #   | 严重程度 | 文件       | 行号 | 当前值    | 建议替换为                  | 备注                  |
| --- | -------- | ---------- | ---- | --------- | --------------------------- | --------------------- |
| 1   | 严重     | `相对路径` | L42  | `#FFD30F` | `var(--skin-primary-color)` |                       |
| 2   | 豁免     | `相对路径` | L88  | `#1d9bf0` | —                           | 品牌色豁免（Twitter） |

### 未使用 CSS 变量

| #   | 变量名       | 定义位置                       | 所属皮肤 | 可能原因            |
| --- | ------------ | ------------------------------ | -------- | ------------------- |
| 1   | `--spec-xxx` | `colors/default/src/others.ts` | 全部     | 新增未接入 / 已弃用 |

### 深浅模式覆盖缺失

| #   | 文件       | 行号    | 问题                        | 建议                                 |
| --- | ---------- | ------- | --------------------------- | ------------------------------------ |
| 1   | `相对路径` | L15-L30 | 硬编码颜色未区分 dark/light | 改用 CSS 变量或添加 `[theme]` 选择器 |

### RTL 兼容性（Top 20 文件）

| #   | 文件       | 物理属性使用数 | 典型违规                                  | 建议           |
| --- | ---------- | -------------- | ----------------------------------------- | -------------- |
| 1   | `相对路径` | 15             | `margin-left` × 8, `text-align: left` × 7 | 替换为逻辑属性 |

### 优先整改路线图

按投入产出比排序：

- **P0 - 立即修复**：品牌主色硬编码（影响皮肤切换）
- **P1 - 短期优化**：涨跌色/功能色硬编码（影响多皮肤）
- **P2 - 中期改进**：RTL 物理属性迁移（影响阿拉伯语/波斯语用户）
- **P3 - 长期清理**：未使用变量清理、深浅模式补全

## 报告文件输出

写入 `reports/YYYY-MM-DD/byd-audit-theme-YYYY-MM-DD.md`（当天日期），同名文件已存在则覆盖。

文件开头包含：

```markdown
# 主题合规审查报告

> 生成时间：YYYY-MM-DD HH:mm
> 扫描范围：apps/ + packages/（排除变量定义文件）
> 审查维度：硬编码颜色 + 未使用变量 + 深浅模式 + 多皮肤覆盖 + RTL 兼容
> 主题体系：4 皮肤（primary/blue/axiom/gmgn）× 2 模式（dark/light）
```

## 已知陷阱

### 1. styled-jsx 模板字符串中的颜色

styled-jsx 用反引号包裹 CSS，grep 时需注意：

- `color: #fff` 在 JS 模板字符串内，不在 `.css`/`.scss` 文件中
- 需同时搜索 `.tsx`/`.ts` 文件中的硬编码颜色

### 2. 内联 style 中的颜色

```tsx
style={{ color: '#fff' }}
style={{ backgroundColor: 'rgb(0,0,0)' }}
```

这些不在 styled-jsx 中，需单独搜索 `style={{` 或 `style={` 附近的颜色值。

### 3. CSS 变量在 JS 中的引用

```tsx
document.documentElement.style.setProperty('--color-red', `rgb(${value})`);
getComputedStyle(el).getPropertyValue('--spec-font-color-1');
```

这些是合规的变量使用方式，不应标记为违规。

### 4. 涨跌色特殊处理

涨跌色（`--color-red`/`--color-green`）通过 `RootColor.setColorRGB()` 动态注入 DOM，不在 CSS 变量定义文件中。grep 变量引用时要包含这些动态变量。

### 5. JS 表达式中的硬编码颜色

grep `#[0-9a-fA-F]{3,8}` 能匹配到，但计数时容易遗漏以下模式：

```tsx
// fallback 默认值
const color = UP_COLOR_MAP[index] ?? '#0AA869';

// 三元表达式
color={isDark ? '#fff' : '#000'}

// 对象字面量中的颜色映射
const COLORS = { 1: '#0AA869', 2: '#FE445C' };
```

这些都应计入硬编码违规。逐文件检查时必须 Read 文件确认完整数量，不能只看 grep 行数。

### 6. `.vscode/` 是 grep 噪音源

`.vscode/spec-color.code-snippets` 包含所有 CSS 变量名的代码片段定义，会在验证未使用变量时产生假阳性（看起来有引用但其实只是 snippets）。必须排除 `.vscode/` 目录。

### 7. 皮肤 style.tsx 的"定义但未调用"陷阱

axiom 和 gmgn 的 `style.tsx` 中 `getThemeColors` 函数接受 `'dark' | 'light'` 参数，colorMap 也包含 light 值，但实际只调用了 `getThemeColors(map, 'dark')`。仅 grep 选择器看不出这个问题，必须 Read 文件检查函数调用。

### 8. 多皮肤不等于都要处理

并非所有组件都需要区分 4 种皮肤。只有使用了品牌色（`--skin-*`）的组件才需要关注多皮肤覆盖。使用语义色（`--spec-*`）的组件天然兼容所有皮肤。

## 失败降级

- **Agent 速率限制或超时**：在主线程顺序执行两个审查维度（先颜色合规后主题覆盖），不并行
- **变量基准收集失败**：手动读取 `colors/` 目录下的 `*.ts` 文件提取变量名，替代 grep 批量提取

## 注意事项

- 只做研究和分析，不修改任何代码
- 发现问题时必须指出具体文件和行号
- 区分**违规**和**豁免**——豁免项在报告中列出但不计入违规数
- RTL 违规按文件汇总，不逐行列出（预计数量很大）
- 动态拼接变量名（模板字符串）无法被静态 grep 覆盖，在报告末尾标注此局限
- 报告文件输出到 `reports/YYYY-MM-DD/` 日期子目录，输出前先 `mkdir -p reports/YYYY-MM-DD/`，已在 `.gitignore` 中忽略

## 相关 skill

- **关联**：`bydfi-web-code-review` — 含硬编码颜色规则
- **互补**：`bydfi-web-report-i18n` — 多主题国际化

按问题域查询完整 skill 索引：见 `.claude/skills/SKILL_BEST_PRACTICES.md` 的"问题域 → SoT skill 索引"章节。

## 运行后审查（单轮，不循环）

报告生成后，对每条结论做一次精确复核：

1. **数据验证**：抽查硬编码颜色计数、未使用变量数等是否与 grep 原始输出一致
2. **结论复核**：对每条违规，确认文件路径、行号、当前值准确无误
3. **修正报告**：发现错误直接修正报告文件，不生成新版本
4. **陷阱记录**：如果发现新的误判模式，在终端输出提示用户将其补充到本 skill 的「已知陷阱」中

$ARGUMENTS
