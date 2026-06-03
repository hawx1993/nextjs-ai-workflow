---
name: bydfi-audit-i18n
description: Use when auditing i18n health in bydfi-web, including language constant sync, translation coverage, missing LANG keys, and UI hardcoded Chinese detection. 支持 $ARGUMENTS scope: ssg/ssr/core/components。
disable-model-invocation: true
allowed-tools: Bash, Read, Write, Glob, Grep, Agent
---

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

扫描项目 i18n 体系的健康度，检查语言常量同步、翻译覆盖率、未使用 key 和硬编码字符串，生成报告。

## ⚠️ 核心避坑指南（必读）

过去多次尝试中总结的血泪教训，执行前必须牢记：

### 1. 绝对不要用 `rg` / `grep` 查找硬编码中文

- **原因**：正则无法可靠排除注释（`//`、`/* */`）、无法识别该字符串是用于 UI 还是纯逻辑变量、也无法排除组件库的干扰。实测误报率高达 96%（11,764 处 → 真实仅不到 100 处）。
- **正确做法**：必须使用 **Babel AST** 解析（见 Agent B 脚本），通过 `JSXText`、`JSXAttribute` 节点精准抓取 UI 渲染的文本，并配合属性黑名单过滤。

### 2. 翻译匹配：严格提防“假缺失”

- **空格陷阱**：代码写了 `LANG(' 立即领取')`，AST 提取带空格，但翻译文件恰好也有前导空格。**错误逻辑**：先 trim 代码 key 去匹配翻译 → 找不到报空格问题。**正确逻辑**：先用原始代码 key 原样去匹配，匹配中即为合规。
- **符号陷阱**：AST 提取字符串字面量时，不要把包围字符串的**引号**一起带入 key。
- **撇号丢失**：英文翻译中常有 `cryptocurrency's`，但由于脚本/人工导出翻译时的 bug，实际文件里成了 `cryptocurrencys`（撇号丢失），导致代码 `LANG` 匹配失败。这属于真缺失（运行时确实找不到翻译），需在报告注明。

### 3. 硬编码扫描必须过滤的噪音

- **非 UI 属性**：作为 JSX 属性传递，但实际用于埋点或逻辑的中文（如 `<Component source_module="动态" />` 或 `EVENT_TRACK('中文')`），不算硬编码违规。图片 `alt` 属性也忽略（SEO/无障碍文本，走独立流程）。
  _黑名单：`firstTagName`, `secondTagName`, `activityTypeName`, `cardKey`, `cardText`, `trade_entry`, `source_module`, `trade_mode`, `sourceModule`, `source`, `type`, `alt`_
- **特定基础包**：必须从扫描中排除 `packages/apps-ui`、`packages/apps-base-kline`、`packages/apps-icons`、`packages/nex-theme` 以及 `charting_library`，这些通常有内部字符串设计，不参与全局 i18n。
- **额外忽略文件**：`packages/apps-kit/components/image-preview-modal/index.tsx`（该文件文案按独立流程维护，不纳入本技能硬编码违规统计）。

### 4. 执行与数据源一致性注意事项

- **LANG key 数据源必须是项目 AST 脚本输出**：统一使用 `node scripts/extract-lang-keys.js` 结果作为代码 key 基线，避免手写正则导致漏提取或误提取。
- **翻译文件解析必须兼容 `commonAppLang` 变量模式**：locale 文件常见形态为 `var commonAppLang = {...}`，提取脚本需显式读取该变量，否则会出现“翻译 key 总数=0”的假结果。
- **报告中的“真正缺失翻译”必须可运行时复现**：仅当 `rawKey` 与 `rawKey.trim()` 都无法命中翻译 key 时才计入缺失；若只在 trim 后命中，归类为空格问题，不得混报。

---

## 体系与范围设定

### i18n 体系概要

- 翻译引用：`LANG('中文key')` / `LANG('中文key', { param })`
- **主翻译源**（必须遍历所有这些路径进行匹配）：
  - SSG: `apps/byd-ssg/public/static/locales/{lang}/`
  - SSR: `apps/byd-ssr/public/static/locales/{lang}/`
- 语言常量：`packages/apps-kit/core/i18n/src/constants.ts`（活跃语言 23 种，`ko` 注释禁用）

### 扫描范围与排除项

- **包含**：`apps/` + `packages/` 下的 `.ts`, `.tsx`, `.js`
- **完全排除目录**：
  - 构建及依赖：`node_modules/`, `.next/`, `out/`, `out-rtl/`, `dist/`, `build/`
  - i18n 数据本身：`apps/*/public/static/locales/`, `core/i18n/src/meta/`, `coin/`, `follower/`, `ping/`, `scripts/src/language/`
  - 图表与组件包：`charting_library/`, `apps-ui/`, `apps-base-kline/`, `apps-icons/`, `nex-theme/`
- **排除特定文件**：所有 `**/*-langs/` 目录和 `**/*langs.{ts,tsx}`（这些是 key 集中注册文件，无需检测硬编码）

---

## 执行流程

### 阶段 1：收集基准数据（主线程）

1. **提取代码中所有 LANG() key**
   运行项目内置 AST 提取脚本，保留所有原始字符（含空格、标点）：
   ```bash
   node scripts/extract-lang-keys.js > /tmp/code_keys_ast.txt 2>/dev/null
   ```
2. **检查 6 处语言常量同步**（比对 `LANGUAGE` 与 `ACCEPT_LANG`、`defaultHrefLang`、`getLanguageMap` 等）
3. **检查各 app 翻译文件覆盖率**（是否有某个 lang.js 缺失）

### 阶段 2：执行深度分析（并行 Agent）

#### Agent A：翻译 key 分析

职责：对比代码 key 和翻译文件 key。

1. 使用 Node.js `vm` 模块，安全遍历 SSG/SSR 下所有 `en.js`（不嵌套），合并提取全部翻译 key 到 `/tmp/trans_keys_all.txt`。
2. 比对逻辑（必须严格执行）：
   ```javascript
   for (const rawKey of codeKeys) {
     if (transKeys.has(rawKey)) {
       continue; // 完全一致，合规
     } else if (transKeys.has(rawKey.trim())) {
       spaceIssueKeys.push(rawKey); // 规范问题：代码有多余空格
     } else {
       missingKeys.push(rawKey); // 真正缺失
     }
   }
   ```

#### Agent B：硬编码 UI 中文分析

职责：用 Babel AST 抓取漏翻译的中文，并**只抓取前端 UI 展示文本**。
脚本核心逻辑：

```javascript
const chineseRe = /[\u4e00-\u9fff]/;
const ignoreAttrs = new Set([
  'firstTagName',
  'secondTagName',
  'activityTypeName',
  'cardKey',
  'cardText',
  'trade_entry',
  'source_module',
  'trade_mode',
  'sourceModule',
  'source',
  'type',
  'alt',
]);

traverse(ast, {
  JSXText(p) {
    if (chineseRe.test(p.node.value.trim())) results.push({ type: 'JSXText', value: p.node.value.trim() });
  },
  JSXAttribute(p) {
    if (ignoreAttrs.has(p.node.name.name)) return;
    if (p.node.value?.type === 'StringLiteral' && chineseRe.test(p.node.value.value)) {
      results.push({ type: 'JSXAttr', value: p.node.value.value });
    }
  },
  StringLiteral(p) {
    if (!chineseRe.test(p.node.value)) return;
    // 仅捕获用于 JSX 表达式的字符串 <div>{'中文'}</div>
    if (p.parent && p.parent.type === 'JSXExpressionContainer') {
      if (p.parentPath.parent.type === 'JSXAttribute' && ignoreAttrs.has(p.parentPath.parent.name.name)) return;
      results.push({ type: 'JSXAttr', value: p.node.value });
    }
  },
});
```

### 阶段 3：生成并输出报告

在主线程用 JS 脚本汇总 Agent A、Agent B 结果，生成 Markdown，写入 `reports/YYYY-MM-DD/byd-web-report-i18n-YYYY-MM-DD.md`。

## 报告结构标准模板

报告需包含以下部分，清晰传达修复优先级：

1. **概览**：表格展示各维度指标数量。
2. **语言常量同步检查**：指出缺失或多余的语言。
3. **未使用的翻译 key**：Top 30。
4. **代码引用但缺失翻译**：
   - 4.1 真正缺失翻译（重点标注撇号丢失 `cryptocurrencys` 或直接写了英文长句的原因）
   - 4.2 空格问题（须去代码删空格）
5. **硬编码中文字符串**：Top 30 文件及违规样本。重点声明“已过滤逻辑层与埋点”。
6. **优先整改路线图**：
   - **P0** - 真正缺失翻译 / 空格问题（直接导致线上白板或原文暴露）
   - **P1** - 常量不同步
   - **P2** - 硬编码中文重构
   - **P3** - 清理未使用的 key
