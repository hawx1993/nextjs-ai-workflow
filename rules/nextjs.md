# Next.js 规则

适用于 `apps/byd-ssg`、`apps/byd-ssr`、`@/core`、`@/components`、`@apps/ui` 以及其他 Next.js 应用中的页面、路由、数据流和构建边界。

## 必须

- 先确认目标 app：SSG、SSR、Web3，避免把 app 专属逻辑写到共享包。
- 页面级改动先检查现有目录结构和命名习惯。
- SSR 中访问 `window`、`document`、`localStorage`、`navigator` 等浏览器 API 前必须放到客户端安全位置。
- SSG 页面要考虑 static export 和 CDN 场景，不引入运行时服务端依赖。
- SSR 页面要考虑 Express + PM2 部署和服务端渲染成本。
- 修改数据获取逻辑时，说明缓存、错误处理、loading、空状态影响。
- 使用 alias 前确认实际解析路径，尤其是 `@/*`。
- 公开 SEO 页面应提供对应 SEO / schema 能力，并说明结构化数据影响。

## SSG / Next.js 代码生成规则

- 路由必须使用项目封装 hook：`import { useRouter } from '@/core/hooks';`，不要直接绕过现有路由封装。
- 接口请求优先使用 `useRequestData`：`import { useRequestData } from '@/core/hooks/src/use-request-data';`，复用其加载、错误和轮询处理能力。
- 本地存储优先使用项目封装：`useLocalStorage` 或 `localStorageApi`；涉及 SSR 时不得在服务端渲染阶段直接访问浏览器存储。
- 页面级文件组织优先在页面目录下按需建立 `components/`、`hooks/`、`store/`、`types/`、`context/`。
- 可复用模块优先提取到 `src/components`、`src/hooks`、`src/store` 等共享位置，并说明影响范围。
- `src/components` / `src/hooks` 等复用层禁止 import `pages/[locale]` 下的页面实现，避免反向依赖和循环引用。
- API 定义统一在 `packages/apps-kit/core/network/src/api/index.ts` 管理，接口方法名必须以 `Api` 结尾。
- 纯布局响应式优先使用 `MediaInfo` CSS media；只有资源、结构或复杂交互必须按设备切换时，才使用响应式组件或 hook。

## SSR 页面规则

- SSR 项目使用 Next.js 14 `pages router`，禁止引入 `app/` 目录或 app router 写法。
- 页面文件命名必须遵守项目 `pageExtensions`：页面主文件使用 `index.page.tsx` 或 `*.page.tsx`，根文件使用 `*.root.tsx`。
- 标准页面目录优先按需组织：

```text
src/pages/[locale]/your-page/
├── index.page.tsx
├── schema.ts
├── service.ts
├── styles.tsx
└── components/
```

- 页面专属组件放当前页面 `components/`；可复用组件放 `src/components/`；不要把仅页面内部使用的小组件提升为全局公共组件。
- 首屏核心数据应优先在 SSR 阶段准备；禁止把公开页面首屏核心数据全部放客户端 `useEffect` 请求。
- 公开访问页面应保留或补充 `schema.ts` / `SchemaConfig`，除非明确说明该页面不需要 SEO 结构化数据。
- SSR 页面生成或改造时优先复用已有 layout、SEO、i18n、网络层和工具能力，例如 `UniversalLayout`、`Lang.SeoHead(...)`、`getFile`、`cache`、`cacheMeta`、`cacheLocale`。

## Image 组件规则

Image 组件必须使用项目封装组件，禁止直接使用 `next/image` 或原生 `<img>`。详见 `react-tsx.md`。

```tsx
// ✅ 必须使用封装组件
import Image from '@/components/image';
<Image src='/path/to/img.png' alt='icon' />;

// ❌ 禁止
import Image from 'next/image';
<Image src='/path/to/img.png' alt='icon' />;
```

## core 复用规则

`packages/apps-kit/core` 是 SSG / SSR 可复用能力中心。开发新功能、修复或重构前，如涉及以下能力，必须优先查找并复用 core：

- 请求、HTTP、WebSocket、API 类型。
- 路由、本地存储、sessionStorage。
- 倒计时、设备/响应式、登录态、主题、语言。
- 行情、订单、钱包、交易、金融计算。
- 事件通信、格式化、校验、时间、脱敏、RTL transform。

复用优先级：

1. 优先从现有 public export / barrel 引入，例如 `@/core/<module>`、`@apps/kit/core/<module>`。
2. 有实现但未导出时，评估是否应补充 barrel 导出；不要复制实现。
3. 现有能力可组合时，组合 hook / util / shared model，避免新增平行实现。
4. 确实不存在时才新增公共能力，并同步类型、导出、验证和影响说明。

新增 core 能力时：

- 放到职责最匹配的 core 子模块，不要创建含糊目录。
- 新增前必须说明查过哪些 core 模块、为什么现有能力不满足。
- 修改共享能力必须说明 SSG / SSR / Web3 / apps-kit 内部影响范围。

## 高风险文件改动

如果实现过程中发现必须修改以下高风险文件，不能直接扩散修改，必须先说明原因、影响范围和是否存在更小方案：

- `apps/byd-ssr/next.config.js`
- `apps/byd-ssr/.babelrc`
- `apps/byd-ssr/plugin/`
- `packages/apps-kit`、`packages/apps-ui`、`packages/apps-icons`
- 根目录 `package.json`
- 全量语言资源目录

## 禁止

- 禁止假设 `@/foo` 一定来自当前 app 的 `src`。
- 禁止把服务端-only 逻辑引入客户端 bundle。
- 禁止为了修 hydration 问题粗暴关闭 SSR，除非用户明确接受。
- 禁止引入新依赖解决框架问题。
- 禁止引入新 CSS 方案（Tailwind、CSS Modules、styled-components、Emotion）替代项目既有 styled-jsx 体系。
- 禁止引入新请求库或重新封装网络层。
- 禁止手写 API path、请求封装、localStorage/sessionStorage 封装、路由封装来绕过 core。
- 禁止为了单 app 临时需求污染 core；单 app 私有逻辑应留在对应 app。

## 检查清单

- [ ] 是否确认 app 和路由类型？
- [ ] 是否确认 SSG/SSR/client-only 边界？
- [ ] 是否有 hydration 风险？
- [ ] 是否使用了正确 alias？
- [ ] 页面文件命名是否符合 `pageExtensions`？
- [ ] 是否按页面级 / 复用级放置文件？
- [ ] 复用层是否避免反向依赖 `pages/[locale]`？
- [ ] 数据请求、本地存储、路由是否优先复用项目封装？
- [ ] 是否查找并复用 core 能力？
- [ ] 是否影响 shared packages？
- [ ] 是否有错误/空状态？
- [ ] 公开页面是否有 SEO / schema 处理？
- [ ] 是否有对应 tsc/build 验证？
