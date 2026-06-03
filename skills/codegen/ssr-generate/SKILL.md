---
name: bydfi-codegen-ssr-generate
description: >
  用于在 BYDFi SSR 项目（apps/byd-ssr）中新增、修改或调试 Next.js SSR 页面的专项工作流。
  当用户提到“新增页面”、“生成 SSR 页面”、“BYDFi 页面”、“bydfi-ssr”、“Next.js pages router 页面”，
  或需要在现有 BYDFi 项目结构中生成路由、补充 schema、修复页面样式或 SSR 数据流时，必须触发此 skill。
---

# BYDFi SSR 页面生成 Skill

本 skill 描述“如何完成一次 SSR 页面生成 / 修改”。技术栈、页面命名、组件库、i18n、theme、styled-jsx、验证等硬性规范统一放在 `.claude/rules` 中维护。

> 核心原则：首要目标不是“写得新”，而是“写得像这个项目原本就会这样写”。

## 执行前必须读取的 rules

- `.claude/rules/nextjs.md`：SSR pages router、页面命名、目录组织、SSR/client-only 边界、SEO/schema、core 复用。
- `.claude/rules/react-tsx.md`：组件、hooks、组件库封装、状态与代码质量。
- `.claude/rules/typescript.md`：类型、命名、金融计算、alias。
- `.claude/rules/prototype.md`：涉及 `Number` / `String` 全局扩展、金融链式计算、数字格式化时读取。
- `.claude/rules/language.md`：`LANG` 与多语言文案。
- `.claude/rules/theme.md`：主题变量、skin、深浅模式。
- `.claude/rules/styled-jsx.md`：styled-jsx、`:global()`、嵌套、响应式、RTL。
- `.claude/rules/monorepo.md`：共享包影响。
- `.claude/rules/verification.md`：验证与汇报。

## 页面生成流程

1. **确认路由落点**
   - 路由目录应在 `src/pages/[locale]/...` 体系内。
   - 页面文件、根文件、schema、service、styles、components 的组织按 `nextjs.md` 执行。

2. **判断数据与 SEO**
   - 判断是否需要 SSR 首屏数据。
   - 判断是否需要 `schema.ts` / `SchemaConfig`。
   - 公开页面优先保留 SEO 与结构化数据能力。

3. **查找参考页面**

| 页面类型       | 参考目录                                              |
| -------------- | ----------------------------------------------------- |
| 列表/聚合页    | `src/pages/[locale]/[code]/`                          |
| 价格详情页     | `src/pages/[locale]/price/[id]/`                      |
| 内容详情页     | `src/pages/[locale]/cointalk/[title]/`                |
| 支持中心页     | `src/pages/[locale]/support/`                         |
| 可配置组件渲染 | `src/components/content-forge/` 与 `component-map.ts` |

4. **复用现有能力**
   - 优先复用已有 layout、组件、网络请求、工具函数。
   - 涉及请求、路由、本地存储、格式化、金融计算等，按 `nextjs.md` 的 core 复用规则先查 `packages/apps-kit/core`。
   - 涉及 hooks、请求状态、路由、存储、倒计时、响应式、设备、主题、登录态、行情、钱包、WebSocket 时，先读 `.claude/knowledge/discovery-hooks.md`，不要默认生成 app-local `@/hooks/useXxx`。

5. **实现页面**
   - 先保证 SSR 首屏数据可用，再补交互。
   - 使用浏览器 API 的 hooks 必须确认 client-only / hydration 边界。
   - 样式较少时可直接写 `<style jsx>`；样式较多时按现有页面习惯拆 `styles.tsx`。
   - 不扩大到构建配置、公共包或其他 app，除非根因明确且已说明影响范围。

6. **验证**
   - 小范围 SSR 改动优先运行 `pnpm tsc:check:ssr`。
   - 涉及路由 / SSR / 构建链路时考虑 `pnpm build:ssr`。
   - 未运行验证必须说明原因。

## 最小 SSR 页面骨架（仅在无更具体参考页时使用）

有现成参考页时，优先参考真实页面，不要机械套模板。

```tsx
import React from 'react';
import { GetServerSidePropsContext } from 'next';
import { UniversalLayout } from '@/components/layouts/universal';
import { cache, Lang } from '@/core/i18n';
import { cacheLocale, cacheMeta } from '@/core/i18n/src/cache';
import { defaultLang } from '@/core/i18n/src/constants';
import { getFile } from '@/core/i18n/src/get-static-props';
import { buildDemoPageSchema } from './schema';

interface IDemoPageProps {
  locale: string;
  pageTitle: string;
  pageDescription: string;
}

const DemoPage = (props: [IDemoPageProps]) => {
  const pageProps = props[0];

  return (
    <UniversalLayout bgColor='var(--spec-background-color-1)'>
      <section className='page-container'>
        <h1>{pageProps.pageTitle}</h1>
        <p>{pageProps.pageDescription}</p>
      </section>

      <style jsx>{`
        .page-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 24px 16px;
        }
      `}</style>
    </UniversalLayout>
  );
};

export default Lang.SeoHead(DemoPage);

export const getServerSideProps = async (context: GetServerSidePropsContext) => {
  const locale = (context.params?.locale as string) || defaultLang;
  const { lang, meta } = await getFile(locale, 'common-lang');

  cache.lang = lang;
  cacheMeta.cache = meta;
  cacheLocale.cache = locale;

  const pageTitle = meta.title || 'Demo Page';
  const pageDescription = meta.description || 'Demo page description';

  return {
    props: {
      locale,
      pageTitle,
      pageDescription,
      schema: buildDemoPageSchema({
        locale,
        title: pageTitle,
        description: pageDescription,
      }),
    },
  };
};
```

## 高风险改动处理

如果实现过程中发现必须修改高风险文件，先按 `nextjs.md` 的高风险文件规则说明：

1. 为什么现有结构无法满足需求。
2. 需要修改哪个高风险文件。
3. 修改会影响什么范围。
4. 是否可以先用更小范围方案落地。

## 交付说明要求

完成页面后，回复中必须说明：

1. 新增或修改了哪些文件（含完整路径）。
2. 页面路由是什么。
3. 是否包含 SSR（`getServerSideProps`）。
4. 是否包含 `schema.ts`。
5. 使用了哪些现有组件、网络层或工具能力。
6. 是否执行了检查命令；若没有执行，说明原因。
7. 当前仍有哪些待补信息（接口、语言包、埋点、SEO 数据等）。
