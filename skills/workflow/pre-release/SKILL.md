---
name: bydfi-workflow-pre-release
description: bydfi-web 项目发版前代码质量检查，对比两个分支的变更，识别内存泄漏、金融精度、i18n 漏译、Hooks 依赖、空指针、组件误用、SSR/SSG 配置、依赖版本等问题，输出报告到 reports/。
disable-model-invocation: true
allowed-tools: Bash, Read, Write, Glob, Grep, Agent
author: Steve
---

发版前代码质量检查，对比两个分支的变更，识别潜在问题。

## 触发条件

用户明确要求"发版前检查"、"pre-release check"或类似表述。

## 执行流程

### 1. 确定对比范围

**必须由用户提供两个分支名**：

- 基准分支（如 `release/ssg`）
- 目标分支（如 `ssg/steve/test0420`）

如果用户未提供，使用 AskUserQuestion 询问：

- 问题 1：基准分支名称（上一版本）
- 问题 2：目标分支名称（当前版本，默认为 HEAD）

### 2. 获取变更文件列表

```bash
git diff --name-only <base-branch>..<target-branch> -- '*.{ts,tsx,js,jsx}'
```

过滤掉：

- 生成文件：`*.g.ts`、`*.g.tsx`、`*.d.ts`
- 第三方库：`node_modules/` 目录
- 静态资源：`public/static/` 目录中的库文件（如 charting_library）
- 构建产物：`.next/`、`out/` 目录

### 3. 逐项检查

#### 3.1 文案硬编码检查

**目标**：中文文案未使用 `LANG()` 函数进行国际化

**扫描模式**：

- 在变更的 `.tsx`/`.ts` 文件中搜索中文字符（排除注释和字符串键名）
- 检查是否包裹在 `LANG()` 函数中
- 排除：`LANG()` 函数定义文件、语言配置文件、注释中的中文

**检查逻辑**：

```typescript
// ❌ 错误示例
<div>提交订单</div>
<Button>确认</Button>

// ✅ 正确示例
<div>{LANG('提交订单')}</div>
<Button>{LANG('确认')}</Button>
```

**严重程度**：⚠️ 警告

---

#### 3.2 内存泄漏检查

**目标**：React 组件中 useEffect、事件监听、订阅等未正确清理

**扫描模式**：

- `useEffect` 中创建的事件监听、定时器、订阅等缺少 cleanup 函数
- `useEffect` 返回函数中未清理资源
- WebSocket、EventSource 等长连接未关闭

**检查逻辑**：

```typescript
// ❌ 错误示例
useEffect(() => {
  const timer = setInterval(() => {}, 1000);
  // 缺少 cleanup
}, []);

useEffect(() => {
  window.addEventListener('resize', handler);
  // 缺少 cleanup
}, []);

// ✅ 正确示例
useEffect(() => {
  const timer = setInterval(() => {}, 1000);
  return () => clearInterval(timer);
}, []);

useEffect(() => {
  window.addEventListener('resize', handler);
  return () => window.removeEventListener('resize', handler);
}, []);
```

**豁免规则**：

- 空依赖数组且明确不需要清理的场景（如一次性数据请求）
- 已在自定义 hook 内部处理清理的情况

**严重程度**：🚨 阻断

---

#### 3.3 命名规范检查

**目标**：不符合 TypeScript React 命名约定

**扫描模式**：

- 组件名应为 PascalCase（如 `TradeForm`）
- 文件名应与组件名一致（如 `TradeForm.tsx`）
- Hook 函数应以 `use` 开头（如 `useTradeForm`）
- 常量应为 UPPER_SNAKE_CASE
- 变量/函数应为 camelCase

**检查逻辑**：

```typescript
// ❌ 错误示例
const tradeForm = () => <div>...</div>; // 组件名应为 PascalCase
export default trade_form; // 导出名不规范

const getData = () => {}; // Hook 应以 use 开头

// ✅ 正确示例
const TradeForm = () => <div>...</div>;
export default TradeForm;

const useGetData = () => {};
```

**豁免规则**：

- 第三方库导出的命名
- 与后端 API 字段保持一致的命名
- 历史遗留代码（需标注）

**严重程度**：📋 信息

---

#### 3.4 空指针风险检查

**目标**：可能存在的 undefined/null 访问导致运行时错误

**扫描模式**：

- 链式调用中未使用可选链（`?.`）
- 对象属性访问前未做空值判断
- 数组访问未检查边界
- 函数参数未做空值处理

**检查逻辑**：

```typescript
// ❌ 错误示例
const name = user.profile.name; // user 或 profile 可能为 undefined
const first = list[0].id; // list 可能为空数组
const length = str.length; // str 可能为 null/undefined

// ✅ 正确示例
const name = user?.profile?.name;
const first = list[0]?.id;
const length = str?.length ?? 0;
```

**豁免规则**：

- TypeScript 已明确类型为非空的场景
- 已有前置条件保证非空的场景
- 使用断言操作符（`!`）且逻辑上保证安全的场景

**严重程度**：⚠️ 警告

---

#### 3.5 金融计算合规检查

**目标**：浮点运算精度问题（必须使用项目安全数字计算方式：`Number` / `String` prototype 链式方法、`BN` 或 `bignumber.js`）

**扫描模式**：

- 直接使用 JavaScript 原生运算符（`+`, `-`, `*`, `/`）进行金额、价格、数量等计算
- 使用格式化结果后进行字符串拼接或二次原生浮点计算
- 未使用项目 prototype 链式方法、`BN` 或 `bignumber.js` 进行金融计算

**检查逻辑**：

```typescript
import { BN } from '@/core/prototype/src/bn.conf';

// ❌ 错误示例
const total = price * quantity; // 浮点精度问题
const result = (0.1 + 0.2).toFixed(2); // 0.30000000000000004
const discount = amount * 0.95;

// ✅ 正确示例：优先使用项目 Number/String prototype 链式方法
const total = price.mul(quantity);
const ok = amount.gte(minAmount);
const display = value.toFormat(2);

// ✅ 复杂公式、严格舍入、未确认 prototype 加载场景使用 BN / bignumber.js
const result = new BN(price).times(quantity).div(rate).toFixed(precision);
```

**豁免规则**：

- 已使用项目 prototype 链式方法（如 `.add/.sub/.mul/.div/.gt/.gte/.lt/.lte/.eq/.toFormat`）的金融计算或格式化
- UI 布局、计数器、索引等非金融计算场景
- 性能敏感的批量数据处理（需有明确注释说明，并说明为何不用 prototype / BN）

**严重程度**：🚨 阻断

---

#### 3.6 SSR/SSG 数据获取检查

**目标**：Next.js 数据获取方法使用不当

**扫描模式**：

- 在客户端组件中使用 `getServerSideProps`/`getStaticProps`
- `getStaticProps` 中未正确处理 revalidate
- 缺少错误处理的异步数据获取
- 未在 `getStaticPaths` 中覆盖所有动态路由

**检查逻辑**：

```typescript
// ❌ 错误示例
// 客户端组件中使用了服务端方法
export const getServerSideProps = async () => {}; // 在 'use client' 组件中

// getStaticProps 未处理错误
export const getStaticProps = async () => {
  const data = await fetchData(); // 未 try-catch
  return { props: { data } };
};

// ✅ 正确示例
export const getStaticProps = async () => {
  try {
    const data = await fetchData();
    return { props: { data }, revalidate: 60 };
  } catch (error) {
    return { notFound: true };
  }
};
```

**严重程度**：⚠️ 警告

---

#### 3.7 组件使用错误检查

**目标**：不适合的场景使用了错误的组件或 API

**扫描模式**：

- Ant Design 组件使用不当（如 Modal 未使用 `destroyOnClose`）
- Next.js `Image` 组件未指定 `width`/`height` 或 `fill`
- 在列表渲染中使用索引作为 `key`
- 表单组件未正确使用 `Form.Item` 的 `name` 属性

**检查逻辑**：

```typescript
// ❌ 错误示例
{list.map((item, index) => <div key={index}>{item.name}</div>)}

<Image src="/avatar.jpg" />  // 缺少 width/height

<Modal title="Title">  // 缺少 destroyOnClose
  <Content />
</Modal>

// ✅ 正确示例
{list.map(item => <div key={item.id}>{item.name}</div>)}

<Image src="/avatar.jpg" width={100} height={100} />

<Modal title="Title" destroyOnClose>
  <Content />
</Modal>
```

**豁免规则**：

- 静态列表且顺序不变的场景可用 index 作为 key
- Next.js Image 使用 `fill` 模式时不需要 width/height
- 特殊业务场景需有明确注释说明

**严重程度**：⚠️ 警告

---

#### 3.8 路由注册检查

**目标**：新增页面未在 Next.js 文件系统中正确注册

**扫描模式**：

- 新增的 `.page.tsx` 文件未在正确的目录结构中
- 动态路由参数未在 `getStaticPaths` 中定义
- 缺少 locale 路由支持（应在 `[locale]/` 下）

**检查逻辑**：

```typescript
// ✅ 正确的文件结构
apps / bydfi - ssg / src / pages / [locale] / trade / index.page.tsx;
apps / bydfi - ssg / src / pages / [locale] / trade / [id].page.tsx;

// ❌ 错误示例
// 缺少 [locale] 目录
apps / bydfi - ssg / src / pages / trade / index.page.tsx;

// 动态路由未实现 getStaticPaths
export const getStaticPaths = async () => {
  return { paths: [], fallback: false }; // 未覆盖所有路径
};
```

**严重程度**：⚠️ 警告

---

#### 3.9 依赖变更审查

**目标**：依赖版本管理不规范，可能引入破坏性更新

**扫描模式**：

- `package.json` 中使用了 `^` 或 `~` 前缀（主应用应使用精确版本）
- 新增未审批的第三方依赖
- 相同依赖在不同应用中的版本不一致
- 使用了已知的安全漏洞版本

**检查逻辑**：

```json
// ❌ 错误示例 - 主应用 package.json
{
  "dependencies": {
    "axios": "^1.13.5",    // 不应使用 ^
    "lodash": "~4.17.21"   // 不应使用 ~
  }
}

// ✅ 正确示例 - 使用精确版本
{
  "dependencies": {
    "axios": "1.13.5",
    "lodash": "4.17.21"
  }
}
```

**检查规则**：

1. `apps/` 下的主应用必须使用精确版本号（不带 `^` 或 `~`）
2. `packages/` 下的共享库可以使用 `^`（便于内部更新）
3. 新增依赖需说明使用场景和必要性
4. 检查 `pnpm-lock.yaml` 确保版本锁定

**严重程度**：📦 需人工审批

---

#### 3.10 Hooks 依赖数组检查

**目标**：React Hooks 的依赖数组不完整或错误

**扫描模式**：

- `useEffect`、`useCallback`、`useMemo` 的依赖数组不完整
- 使用了不稳定的引用（如对象字面量、箭头函数）作为依赖
- 缺少 `eslint-plugin-react-hooks` 警告的处理

**检查逻辑**：

```typescript
// ❌ 错误示例
useEffect(() => {
  fetchData(userId); // userId 变化时未重新执行
}, []);

const memoizedValue = useMemo(() => {
  return { data, loading }; // 每次渲染都创建新对象
}, [data, loading]);

// ✅ 正确示例
useEffect(() => {
  fetchData(userId);
}, [userId]);

const memoizedValue = useMemo(
  () => ({
    data,
    loading,
  }),
  [data, loading]
);
```

**豁免规则**：

- 明确只需要执行一次的效果（组件挂载时）
- 已在注释中说明不使用某些依赖的原因
- 使用 ref 存储不需要触发重渲染的值

**严重程度**：⚠️ 警告

---

---

### 4. 生成报告

**输出路径**：`reports/YYYY-MM-DD/byd-web-report-pre-release-YYYY-MM-DD.md`

**报告结构**：

```markdown
# 发版前检查报告

**检查时间**：YYYY-MM-DD HH:mm:ss
**基准分支**：release/ssg
**目标分支**：ssg/feature/new-trade
**变更文件数**：45 个 TypeScript/React 文件

---

## 🚨 阻断问题（必须修复）

### 1. 金融计算浮点运算（2 处）

| 文件                                                                                                                  | 行号 | 代码                              | 建议                                               |
| --------------------------------------------------------------------------------------------------------------------- | ---- | --------------------------------- | -------------------------------------------------- |
| [apps/byd-ssg/src/pages/[locale]/trade/order-form.tsx:156](apps/byd-ssg/src/pages/[locale]/trade/order-form.tsx#L156) | 156  | `const total = price * quantity;` | 改用 `new BigNumber(price).multipliedBy(quantity)` |
| [apps/byd-ssg/src/components/price-display.tsx:89](apps/byd-ssg/src/components/price-display.tsx#L89)                 | 89   | `const discount = amount * 0.95;` | 改用 `new BigNumber(amount).multipliedBy(0.95)`    |

### 2. 内存泄漏风险（1 处）

| 文件                                                                                      | 问题                                                   | 建议                            |
| ----------------------------------------------------------------------------------------- | ------------------------------------------------------ | ------------------------------- |
| [apps/byd-ssg/src/hooks/use-websocket.ts:34](apps/byd-ssg/src/hooks/use-websocket.ts#L34) | `useEffect` 中创建 WebSocket 连接但未在 cleanup 中关闭 | 添加 `return () => ws.close();` |

---

## ⚠️ 警告问题（建议修复）

### 3. 国际化缺失（3 处）

| 文件                                                                                                                | 行号 | 硬编码文案   | 建议                    |
| ------------------------------------------------------------------------------------------------------------------- | ---- | ------------ | ----------------------- |
| [apps/byd-ssg/src/components/trade-form.tsx:67](apps/byd-ssg/src/components/trade-form.tsx#L67)                     | 67   | `"确认下单"` | 改用 `LANG('确认下单')` |
| [apps/byd-ssg/src/pages/[locale]/assets/withdraw.tsx:123](apps/byd-ssg/src/pages/[locale]/assets/withdraw.tsx#L123) | 123  | `"提现成功"` | 改用 `LANG('提现成功')` |

### 4. 空指针风险（2 处）

| 文件                                                                                                | 行号 | 代码                              | 建议                       |
| --------------------------------------------------------------------------------------------------- | ---- | --------------------------------- | -------------------------- |
| [apps/byd-ssg/src/components/user-profile.tsx:45](apps/byd-ssg/src/components/user-profile.tsx#L45) | 45   | `const name = user.profile.name;` | 改用 `user?.profile?.name` |
| [apps/byd-ssg/src/hooks/use-trade-data.ts:78](apps/byd-ssg/src/hooks/use-trade-data.ts#L78)         | 78   | `const first = list[0].id;`       | 改用 `list[0]?.id`         |

### 5. Hooks 依赖数组不完整（2 处）

| 文件                                                                                        | 行号 | 问题                                         | 建议                       |
| ------------------------------------------------------------------------------------------- | ---- | -------------------------------------------- | -------------------------- |
| [apps/byd-ssg/src/hooks/use-fetch-data.ts:23](apps/byd-ssg/src/hooks/use-fetch-data.ts#L23) | 23   | `useEffect` 使用了 `userId` 但未加入依赖数组 | 添加 `[userId]` 到依赖数组 |

### 6. 组件使用错误（1 处）

| 文件                                                                                            | 行号 | 错误用法            | 建议                    |
| ----------------------------------------------------------------------------------------------- | ---- | ------------------- | ----------------------- |
| [apps/byd-ssg/src/components/trade-list.tsx:56](apps/byd-ssg/src/components/trade-list.tsx#L56) | 56   | 使用 index 作为 key | 改用 `item.id` 作为 key |

### 7. SSR/SSG 数据获取问题（1 处）

| 文件                                                                                                              | 问题                            | 建议                                   |
| ----------------------------------------------------------------------------------------------------------------- | ------------------------------- | -------------------------------------- |
| [apps/byd-ssg/src/pages/[locale]/trade/[id].page.tsx:89](apps/byd-ssg/src/pages/[locale]/trade/[id].page.tsx#L89) | `getStaticProps` 未处理错误情况 | 添加 try-catch 并返回 `notFound: true` |

---

## 📋 信息问题（可选修复）

### 8. 命名不规范（2 处）

| 文件                                       | 问题                  | 建议                          |
| ------------------------------------------ | --------------------- | ----------------------------- |
| apps/byd-ssg/src/components/trade_form.tsx | 文件名应为 PascalCase | 重命名为 `TradeForm.tsx`      |
| apps/byd-ssg/src/hooks/getTradeData.ts     | Hook 应以 use 开头    | 重命名为 `useGetTradeData.ts` |

---

## ✅ 通过检查

- [x] 路由注册（所有新页面都在 `[locale]/` 下）

---

## 📦 需人工审批

### 依赖变更

| 文件                      | 变更                       | 说明                   |
| ------------------------- | -------------------------- | ---------------------- |
| apps/byd-ssg/package.json | 新增 `qrcode.react: 3.1.0` | 用于生成二维码分享链接 |

---

## 📊 统计

| 检查项     | 阻断 | 警告 | 信息 | 通过   |
| ---------- | ---- | ---- | ---- | ------ |
| 金融计算   | 2    | -    | -    | -      |
| 内存泄漏   | 1    | -    | -    | -      |
| 国际化     | -    | 3    | -    | -      |
| 空指针     | -    | 2    | -    | -      |
| Hooks 依赖 | -    | 2    | -    | -      |
| 组件使用   | -    | 1    | -    | -      |
| SSR/SSG    | -    | 1    | -    | -      |
| 命名规范   | -    | -    | 2    | -      |
| 路由注册   | -    | -    | -    | ✓      |
| 依赖变更   | -    | -    | -    | 需审批 |

**总计**：3 个阻断问题，9 个警告问题，2 个信息问题

---

## 建议

1. **优先修复阻断问题**（金融计算、内存泄漏），否则可能导致资金计算错误或内存泄漏
2. **建议修复警告问题**（国际化、空指针、Hooks 依赖、组件使用、SSR/SSG），提升用户体验和稳定性
3. **依赖变更需 Tech Lead 审批**后再合并
4. 命名规范问题可在后续重构中统一处理

---

## Skill 进化记录

本次执行未发现需要更新的规则。
```

---

## 自我进化协议

遵循项目规范，每次执行后：

1. 回顾误判/漏判场景
2. 更新 SKILL.md 中的扫描模式/豁免规则
3. 在报告末尾记录变更

---

## 注意事项

- 所有检查基于**静态分析**，无法覆盖运行时问题（需配合测试）
- 金融计算检查可能误判 UI 布局计算，需人工复核
- 内存泄漏检查仅覆盖常见模式，复杂场景需 React DevTools 分析
- 组件使用错误检查基于常见反模式，特殊场景可能需要豁免
- 报告输出到 `reports/` 目录，不会被提交到 Git
- 文件引用使用 markdown 链接格式，可在 IDE 中点击跳转
- 本项目使用 Next.js 14 + React 18 + TypeScript 4.9.5
- 国际化使用自定义 `LANG()` 函数，位于 `@apps/kit/core/i18n`
- 金融计算使用项目 `Number` / `String` prototype 链式方法或 `BN` / `bignumber.js`，禁止原生浮点运算
- 主应用依赖版本必须精确锁定（不使用 `^` 或 `~`）
- 项目采用 pnpm monorepo 架构，包含三个应用：
  - `apps/byd-ssg`: 主站（静态站点生成）
  - `apps/byd-ssr`: SEO 服务（服务端渲染）

## 相关 skill

- **前置**：所有 SoT report-\* skill（聚合源）— 各专项 report skill 是本 skill 检查规则的信息来源

按问题域查询完整 skill 索引：见 `.claude/skills/SKILL_BEST_PRACTICES.md` 的"问题域 → SoT skill 索引"章节。
