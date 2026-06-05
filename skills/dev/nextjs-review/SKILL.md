---
name: bydfi-nextjs-review
description: BYDFi React + TSX 审查流程，覆盖 hooks、类型、i18n、theme、styled-jsx、Next.js SSR/SSG 边界、组件库规范、代码风格、性能、可访问性和验证缺口。
disable-model-invocation: true
allowed-tools: Read, Grep, Glob, Bash, Agent
author: nilu
---

# BYDFi React/TSX 审查流程

用于审查本地 diff、指定文件或 PR 相关改动。本 skill 描述“如何审查”；具体硬性编码规范统一放在 `.claude/rules`。

## 审查步骤

1. 获取改动范围。
2. 按场景读取相关 rules。
3. 按高风险优先审查。
4. 输出有文件、行号和证据的问题与建议。

## 必读 rules

按场景读取：

- `.claude/CLAUDE.md`
- `.claude/rules/nextjs.md`（涉及 Next.js 页面、路由、SSG/SSR、server/client boundary 时）
- `.claude/rules/react-tsx.md`（涉及 React 组件、hooks、props、状态、可访问性时）
- `.claude/rules/typescript.md`（涉及类型、alias、金融计算、工具函数时）
- `.claude/rules/language.md`（涉及用户可见文案、i18n、`LANG` 时）
- `.claude/rules/theme.md`（涉及样式、颜色、主题、RTL、深浅模式时）
- `.claude/rules/monorepo.md`（涉及 `packages/*` 或跨 app 共享代码时）
- `.claude/rules/verification.md`（所有代码修改后必须遵守）
- `.claude/rules/styled-jsx.md`（涉及 styled-jsx 样式时 必须遵守）
- `.claude/rules/prototype.md`（涉及金融计算时 必须遵守）
- `.claude/rules/responsive.md`（涉及响应式时 必须遵守, 修复响应式问题可查阅）
- `.claude/knowledge/discovery-hooks.md`（涉及新增/修改 hook，或请求、路由、存储、倒计时、响应式、登录态、行情、钱包等可复用 hooks 时必须读取）
- `.claude/knowledge/discovery-components.md`（涉及 UI 组件、表单、弹窗、表格、图片、选择器、Tooltip、Drawer、Empty 或组件库使用规范时必须读取）

条件触发 Skills：
- `.claude/skills/codegen/design-system/SKILL.md`（设计系统规范遵守，涉及 CSS / styled-jsx / 样式生成或调整时必须读取并遵守）


## 审查维度

- React hooks 与渲染正确性。
- TypeScript 类型安全。
- `LANG`、动态文案、硬编码文案。
- CSS 变量、深浅模式、品牌色、RTL。
- styled-jsx scoped/global、`:global()`、响应式断点、嵌套写法。
- Next.js SSR/SSG/client-only 边界。
- core 能力复用与重复实现，尤其是新增 `use-*`、手写请求 loading、router/storage/timer/debounce/responsive/theme/auth/market/ws 逻辑时，是否已查 `.claude/knowledge/discovery-hooks.md` 并优先复用 `core/hooks`。
- 金融计算安全性：避免原生浮点，识别项目 prototype 链式方法和 `BN` / `bignumber.js` 为合规实现。
- 组件库封装使用；涉及表单、弹窗、表格、图片、选择器等 UI 组件时，是否已查 `.claude/knowledge/discovery-components.md` 并优先复用 `packages/apps-kit/components`。
- 可访问性。
- 性能与复杂度。
- 验证覆盖。

## 快速 grep 核查

> `<范围>` 替换为指定目录或文件；无范围时按当前审查目标选择。grep 结果只作为线索，最终结论必须 Read 源码并给出文件行号证据。

```bash
# 原生 img 标签
rg -n '<img ' <范围> -g '*.{tsx,jsx}'

# next/image 直接引用
rg -n "from ['\"]next/image['\"]" <范围> -g '*.{tsx,ts,jsx,js}'

# next/router 直接引用
rg -n "from ['\"]next/router['\"]" <范围> -g '*.{tsx,ts}'

# antd Tooltip / Modal / Input 直接引用线索
rg -n "Tooltip|Modal|Input" <范围> -g '*.{tsx,ts}'

# 原生 a 标签
rg -n '<a ' <范围> -g '*.{tsx,jsx}'

# 硬编码颜色
rg -n "#[0-9a-fA-F]{3,8}|rgba\(|rgb\(" <范围> -g '*.{tsx,ts,scss,css}'

# 手写媒体查询断点
rg -n "max-width:|min-width:" <范围> -g '*.{tsx,ts,scss,css}'

# any 类型
rg -n ": any\b|as any\b|as unknown as|ts-ignore" <范围> -g '*.{tsx,ts}'

# localStorage 直接调用
rg -n "localStorage\." <范围> -g '*.{tsx,ts}'

# app-local hooks 或新增 hook 线索（需结合 discovery-hooks 判断是否重复 core/hooks）
rg -n "from ['\"]@/hooks|function use[A-Z]|const use[A-Z]" <范围> -g '*.{tsx,ts}'

# 定时器 / 事件监听 hook 线索（优先查 useCountdown/useThrottle/useDebounce/useDocumentClick 等）
rg -n "setInterval|setTimeout|addEventListener|removeEventListener" <范围> -g '*.{tsx,ts}'

# 可能的原生数学运算（需人工复核；`.add/.sub/.mul/.div/.gt/.gte/.lt/.lte/.eq/.toFormat` 等 prototype 方法属于合规候选）
rg -n "\+value|\+amount|\+price|\*|\/" <范围> -g '*.{tsx,ts}'
```

## 问题分级

- **必须修改**：违反 rules 的硬性禁止项、可能导致运行时错误、类型安全问题、SSR/hydration 风险、金融计算风险、安全风险。
- **建议优化**：可维护性、复杂度、性能、复用不足，但不阻断当前交付。
- **验证缺口**：改动可能正确，但缺少 tsc/lint/UI 矩阵/手动验证证据。

## 输出格式

```text
结论：通过 / 需修改

必须修改：
- `path:line` 问题、影响、建议

建议优化：
- `path:line` 问题、建议

验证缺口：
- <缺口>
```

## 注意事项

- 没有文件和行号证据的问题不要作为阻断。
- 不要求无关重构。
- 不建议新增依赖。
- 代码风格问题按严重度区分：严禁项必须修改，警告项强烈建议，建议项可选优化。
- rules 中已有的硬性规范不要复制到本 skill；如发现新长期规则，应迁移到 `.claude/rules`。
