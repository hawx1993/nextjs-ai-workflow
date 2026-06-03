---
allowed-tools: Read, Write, Edit, Grep, Glob, Bash
argument-hint: <文件夹路径或 .tsx 组件文件路径>
description: 重构指定 BYDFi React/TSX 组件，遇到非 React 组件时报错提示
author: Nilu
---

# BYDFi React/TSX 组件重构

请将 `$ARGUMENTS` 作为唯一重构范围输入。该命令只允许重构 React 组件，不处理非组件逻辑、接口、状态库、构建配置、脚本或样式体系迁移。

## 参数规则

- `$ARGUMENTS` 必填，必须是一个已存在的文件夹路径或 `.tsx` 文件路径。
- 如果 `$ARGUMENTS` 为空：停止执行，并提示用户提供文件夹路径或 `.tsx` 组件文件路径。
- 如果 `$ARGUMENTS` 是文件：
  - 仅允许 `.tsx` 文件。
  - 必须确认该文件导出或定义 React 组件。
  - 如果不是 `.tsx` 或不是 React 组件：停止执行，并明确报错说明该文件不是可重构的 React/TSX 组件。
- 如果 `$ARGUMENTS` 是文件夹：
  - 只扫描该目录下的 `.tsx` 文件。
  - 对每个 `.tsx` 文件先判断是否为 React 组件。
  - 遇到非 React 组件文件时，必须停止执行并报错列出文件路径，不得继续重构。
  - 不修改 `.ts`、`.js`、`.jsx`、样式、配置、语言包、接口定义等非组件文件，除非它们是组件文件的同目录局部样式且属于组件结构重构的必要最小改动。

## React 组件判定

满足以下特征之一，才可视为 React 组件：

- 文件中存在 PascalCase 组件函数、箭头函数或 `React.FC`，且返回 JSX。
- 文件中存在 `forwardRef`、`memo`、`React.memo` 包裹的组件。
- 文件默认导出或命名导出的是 React 组件。

以下情况视为非 React 组件，必须报错提示：

- 仅包含工具函数、常量、类型、hooks、接口请求、store、context provider 工厂或样式对象。
- `.tsx` 文件中没有 JSX 返回或没有组件导出。
- 组件文件之外的脚本、配置、语言包、API、类型定义文件。

## 重构边界

- 只能做组件内部结构重构：拆分子组件、抽取纯函数、整理 props 类型、消除重复 JSX、优化条件渲染、清理未使用变量/样式、补全 hooks 依赖。
- 不改变业务行为、接口字段、路由、埋点、权限判断、交易/金融计算结果。
- 不擅自新增依赖，不修改 package.json / lockfile。
- 不把 app 专属组件抽到共享包，除非用户明确要求并先说明影响范围。
- 不用删除逻辑的方式绕过 TypeScript 或 lint 问题。
- 金额、价格、盈亏、比例、手续费等金融计算必须继续使用项目安全计算方式：优先使用 `Number` / `String` prototype 链式方法，复杂或未确认加载场景使用 `BN` / `bignumber.js`，禁止引入原生浮点运算。

## 必读规则

执行前按改动内容读取并遵守：

- `.claude/CLAUDE.md`
- `.claude/rules/react-tsx.md`
- `.claude/rules/typescript.md`
- `.claude/rules/language.md`
- `.claude/rules/theme.md`
- `.claude/rules/nextjs.md`
- `.claude/commands/byd/codegen-design-system.md` 读取 ui 规范和风格
- `.claude/rules/monorepo.md`（涉及 `packages/*` 或跨 app 共享组件时）
- `.claude/rules/verification.md`
- `.claude/knowledge/discovery-hooks.md`（抽取或新增自定义 hook、涉及可复用 hook 逻辑时必须读取）

## 重构要求

- 保持现有 UI、交互、DOM 语义和响应式行为不变。
- 组件尽可能拆分更细，颗粒度更小，避免单个组件过于复杂。
- 提取出去的组件也需要考虑是否需要加上`memo`。
- 用户可见文案必须使用 `LANG`，不得新增硬编码文案。
- `LANG` 不得在组件/函数外直接执行。
- 组件单独提取出去后，该组件用到的所有样式也都要一起提取出去， 需要嵌入`<style jsx> 标签`。例如：

```tsx
const DirectionTabs = ({ isBuy, onChange, LANG }: DirectionTabsProps) => (
  <div className='direction-tabs'>
    <button className={clsx('direction-button', isBuy && 'active-buy')} onClick={() => onChange(true)}>
      <span suppressHydrationWarning>{LANG('买多')}</span>
    </button>
    <button className={clsx('direction-button', !isBuy && 'active-sell')} onClick={() => onChange(false)}>
      <span suppressHydrationWarning>{LANG('卖空')}</span>
    </button>
    <style jsx>{`
      .direction-tabs {
        display: flex;
        gap: 8px;
      }
    `}</style>
  </div>
);
```

- 样式颜色必须使用 CSS 变量 `--spec-*` / `--skin-*`/ `--nex-*`，不得新增硬编码颜色。
- DOM 元素 `style` 对象中不得新增 `padding`、`margin` 等影响 RTL 的属性。
- 响应式样式优先使用项目已有 `MediaInfo` 断点，不新增裸写 `@media (max-width: ...)`。
- hooks 必须在组件或自定义 hook 顶层调用，新 hooks 主动补全依赖。
- 抽取自定义 hook 前先查 `.claude/knowledge/discovery-hooks.md`；请求、路由、存储、时间、设备、主题、登录态、行情、钱包等通用能力优先复用 `core/hooks`。
- 列表渲染必须使用稳定 key，不使用随机数或频繁变化值。
- props 类型必须清晰表达业务含义，避免 `any`、`as any`、`as unknown as` 扩散。
- 删除无用变量、无用组件、无用类型、无用 props 和无用样式；删除前确认确实未被使用。
- 组件重构完成后，检查所有引用的地方，确保所有引用的地方都正确引用了提取出去的组件。并且 UI 样式不能发生变化

## 执行步骤

1. 校验 `$ARGUMENTS` 是否存在，且是文件夹或 `.tsx` 文件。
2. 识别目标 app/package 和 alias 解析风险，尤其是 `@/*`。
3. 读取目标组件和必要的直接依赖，判断是否全部为 React 组件。
4. 如发现非 React 组件目标，立即停止并输出错误提示，不做代码修改。
5. 说明重构范围和不改变的行为边界。
6. 按最小必要改动重构组件。
7. 自查 React hooks、core/hooks 复用、类型、i18n、theme、RTL、响应式、未使用代码。
8. 运行与影响范围匹配的 tsc/lint 验证；无法运行时说明原因。

## 报错格式

遇到非 React 组件时，按以下格式输出并停止：

```text
无法执行组件重构：
- <path> 不是 React/TSX 组件，原因：<原因>

请提供文件夹路径或 .tsx React 组件文件路径。
```

目标：

- 降低代码复杂度

- 提升代码可读性

- 提取可复用逻辑和组件

- 保持业务逻辑与功能行为不变

检查项：

1. 组件体积是否过大

2. JSX 嵌套层级是否过深

3. 状态管理是否过于复杂

4. 是否存在重复代码

5. 是否存在渲染性能问题

## 完成汇报

完成后必须按 `.claude/CLAUDE.md` 的格式汇报：

```text
已完成：
- <改动 1>
- <改动 2>

验证：
- ✅ <命令/检查>：通过
- ⚠️ <命令/检查>：未运行，原因 <reason>
- ❌ <命令/检查>：失败，关键错误 <error>

使用方式 / 后续建议：
- <如何使用>
```
