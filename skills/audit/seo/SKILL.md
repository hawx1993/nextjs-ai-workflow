---
name: bydfi-audit-seo
description: bydfi-web 项目 SEO 配置检查与报告生成。默认扫描 SSG/SSR 页面；支持 $ARGUMENTS scope: ssg/ssr/core/components。检查 meta 三要素、canonical、x-default、schema 结构化数据、H1 标签等，输出 Markdown 报告到 reports/ 目录。
disable-model-invocation: true
allowed-tools: Bash, Read, Write, Glob, Grep, Agent
---

# SEO 配置检查 Skill

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

## 项目 SEO 架构背景

- **SSG/SSR**：使用 `SeoHead`（`packages/apps-kit/core/i18n/src/seo-head.tsx`），meta 数据来自 `./meta/ssg/{locale}.js`，H1 通过 `HiddenSeoElement` 输出（`pageProps.h1UseMetaTitle` 控制），默认输出 `WebPageJsonLd`，SSG 额外输出 `BreadcrumbJsonLd`

## 检查项

### 1. Meta 三要素

- `title`：`NextSeo title` 是否有值，动态占位符（`{coinName}`、`{coinSymbol}`、`{coinPrice}` 等）是否已替换
- `description`：是否有值，长度建议 50–160 字符
- `keywords`：`additionalMetaTags` 中 `name: 'keywords'` 是否存在

### 2. Canonical

- `SeoHead`：`resolvedCanonical` 去除 hash，保留 query（活动页 `?id=` 保留属预期）
- `canonicalUrl` prop 传入时若与路由 URL 不一致，应回退到路由 URL

### 3. x-default

- `languageAlternates` 末尾必须有 `{ hrefLang: 'x-default', href: getHref('en') }`
- `xDefaultLang` prop 默认 `'en'`，检查是否有页面传入非 `'en'` 值
- `locales`/`hrefLangs` prop 为空时退化为 `Lang.locales`，检查是否导致 hreflang 列表缺失

### 4. Schema 结构化数据

- **WebPageJsonLd**：所有页面默认输出，检查 `description` 和 `id` 是否有值
- **BreadcrumbJsonLd**：SSG 页面通过 `SsgBreadcrumbList` 输出，检查 `itemListElements` 层级
- **schemaData prop**：检查 `ProductJsonLd`、`ArticleJsonLd`、`FAQPageJsonLd`、`QAPageJsonLd`、`HowToJsonLd`、`AggregateRatingJsonLd`、`WebSiteJsonLd`、`DiscussionForumPostingJsonLd`、`ItemListJsonLd` 的必填字段

### 5. H1 标签

- `HiddenSeoElement` 是否存在
- 页面正文中是否存在**可见 H1**（非隐藏样式），若存在则标记 H1 重复风险
- H1 内容是否与 meta title 一致

### 6. Open Graph

- `og:title`、`og:description`、`og:url`、`og:image` 是否有值
- `og:image` 尺寸应为 1200×630，格式 `image/jpg`
- `og:locale` 是否与页面 locale 一致

### 7. Twitter Card

- `twitter:card` 应为 `summary_large_image`
- `twitter:title`（`additionalMetaTags` 中）是否与 meta title 一致

### 8. Robots / noindex

- 标记所有 noindex 页面，确认触发条件：`auth=true`、`env === PAGE_ENV.H5`、`robots=false`、`pageProps.noindex=true`

### 9. 验证码 Meta 标签

检查以下环境变量是否已配置（通过 `additionalMetaTags` 注入）：

- `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION`
- `NEXT_PUBLIC_YANDEX_VERIFICATION`
- `NEXT_PUBLIC_NAVER_SITE_VERIFICATION`
- `NEXT_PUBLIC_ZD_SITE_VERIFICATION`

## 执行步骤

**Step 1：解析 `$ARGUMENTS` 并确定扫描页面文件**

根据 `$ARGUMENTS` 决定扫描范围：

- `$ARGUMENTS` 为空：扫描 SSG 和 SSR 页面，并检查 SEO 共享实现
- `$ARGUMENTS` 为 `ssg`：只扫描 `apps/byd-ssg/src/pages/**/*.page.tsx`
- `$ARGUMENTS` 为 `ssr`：只扫描 `apps/byd-ssr/src/pages/**/*.page.tsx`
- `$ARGUMENTS` 为 `core`：只扫描 `packages/apps-kit/core` 下 SEO / i18n / meta 相关实现
- `$ARGUMENTS` 为 `components`：只扫描 `packages/apps-kit/components` 下 SEO 相关组件引用与实现
- `$ARGUMENTS` 为其他值：停止执行，提示参数仅支持 `ssg` / `ssr` / `core` / `components`

使用 Glob 扫描对应范围：

```
apps/byd-ssg/src/pages/**/*.page.tsx
apps/byd-ssr/src/pages/**/*.page.tsx
packages/apps-kit/core/**/*.{ts,tsx,js,jsx}
packages/apps-kit/components/**/*.{ts,tsx,js,jsx}
```

若指定单一 scope，只使用对应范围；报告中的“检查范围”和“各应用汇总”也只输出被检查的 scope。

**Step 2：统计 SEO 组件使用情况**

使用 Grep 搜索 `SeoHead|NextSeo`，找出未直接使用 SEO 组件的页面后，**必须读取这些页面内容**，判断是否通过以下方式间接注入（属预期行为，不计入 Error）：

- **子路由复用**：文件内容仅为 `import X from './[id]/index.page'; export default X`
- **父组件复用**：`export { default } from '../../[code]/index.page'`
- **共享组件**：通过 `common.tsx` 等共享文件注入（检查共享文件是否含 `SeoHead`）

只有**既无直接 SEO 组件、又无间接注入**的页面才标记为 Error。

间接注入的验证必须追溯到最终实现文件，确认其确实含 SEO 组件（Grep 搜索 `SeoHead|NextSeo`），不能仅凭文件结构推断。

**Step 3：检查 meta 数据源**

**3a. 文件存在性检查**

使用 Glob 扫描 `packages/apps-kit/core/i18n/src/meta/ssg/*.js` ，与活跃语言列表（`constants.ts` 中 `defaultHrefLang`，共 18+ 种）对比，标记缺失的语言文件。

注意：`getFile` 在 locale 无效时回退到 `defaultLang`（`en`），因此缺失的语言文件不会报错，但会导致该语言用户看到英文 meta，标记为 Warning。

**3b. meta key 内容检查**

读取 `meta/ssg/en.js` （英文作为基准），检查各页面对应 metaKey 的 title/description 是否为空。metaKey 来源：

- SSG/SSR 页面：`getStaticProps({ key })` 或 `getFile(locale, key)` 中的 `key` 参数

若 metaKey 在 `en.js` 中不存在（`metaModule.default[metaKey]` 为 `undefined`），`meta` 将为空对象 `{}`，导致 title/description 为空，标记为 Error。

**Step 4：检查 canonical 和 x-default**

- Grep 搜索 `canonicalUrl` prop 的传入位置
- Grep 搜索 `xDefaultLang` prop，确认非 `'en'` 的使用场景
- Grep 搜索 `hrefLangs` prop，检查是否有页面未传入

**Step 5：检查 schema**

Grep 搜索 `schemaData` prop 传入的页面，读取对应 schema 构建函数，验证必填字段

**Step 6：检查 H1**

Grep 搜索 `<h1` 标签（排除 `HiddenSeoElement` 内的隐藏 H1），标记存在多个 H1 或 H1 缺失的页面。

注意：`SeoHead` 中的 `HiddenSeoElement` 受 `process.env.NEXT_PUBLIC_PROJECT_SSG` 控制（`seo-head.tsx:351`）：

- **SSG 项目**：输出隐藏 H1，若页面正文同时有可见 H1，则构成双 H1 风险，标记为 Warning
- **SSR 项目**：不输出隐藏 H1，可见 H1 是唯一 H1，不构成双 H1 冲突，降级为 Info（仅检查内容是否与 meta title 语义一致）

**Step 7：生成报告**

将报告写入 `reports/{YYYY-MM-DD}/byd-web-report-seo-{YYYY-MM-DD}.md`

## 报告格式

```markdown
# SEO 配置检查报告

**检查时间**：{date}
**检查范围**：{bydfi-ssg / bydfi-ssr / bydfi-ssg + bydfi-ssr}

---

## 概览

| 检查项         | 通过 | 警告 | 错误 |
| -------------- | ---- | ---- | ---- |
| Meta 三要素    | -    | -    | -    |
| Canonical      | -    | -    | -    |
| x-default      | -    | -    | -    |
| Schema         | -    | -    | -    |
| H1 标签        | -    | -    | -    |
| Open Graph     | -    | -    | -    |
| Twitter Card   | -    | -    | -    |
| Robots/noindex | -    | -    | -    |

---

## 错误（Error）

> 影响 SEO 效果，需立即修复

- [ ] `{文件路径}:{行号}` — {问题描述}

## 警告（Warning）

> 可能影响 SEO，建议修复

- [ ] `{文件路径}:{行号}` — {问题描述}

## 信息（Info）

> 预期行为或低优先级项

- `{文件路径}` — {说明}

---

## 各应用汇总

### bydfi-ssg

- 页面总数：{n}，使用 SeoHead：{n}，noindex 页面：{n}

### bydfi-ssr

- 页面总数：{n}，使用 SeoHead：{n}，noindex 页面：{n}

## 建议

{根据发现的问题给出优先级建议}
```

## 严重级别

| 级别    | 定义                                                                                              |
| ------- | ------------------------------------------------------------------------------------------------- |
| Error   | title/description 为空、canonical 缺失、x-default 缺失、H1 缺失、页面无 SEO 组件                  |
| Warning | description 过短/过长（<50 或 >160 字符）、H1 与 title 不一致、schema 必填字段为空、OG image 缺失 |
| Info    | noindex 页面（预期行为）、keywords 缺失                                                           |

## 相关 skill

- **关联**：`bydfi-audit-i18n` — 多语言 SEO 一致性

按问题域查询完整 skill 索引：见 `.claude/skills/SKILL_BEST_PRACTICES.md` 的"问题域 → SoT skill 索引"章节。
