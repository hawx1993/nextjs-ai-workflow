---
name: react-tsx rules
description: React / TSX 规则
author: nilu
---

# React / TSX 规则

适用于所有 React 组件、hooks、TSX 页面、交互和 UI 状态。

## 必须

- 组件保持单一职责；复杂逻辑拆成 hook、纯函数或子组件。
- props 类型显式声明，避免隐式 any。
- hooks 必须在组件或自定义 hook 顶层调用。
- 新 hooks 主动补全依赖，即使项目全局关闭 `react-hooks/exhaustive-deps`。
- 列表渲染使用稳定 key，不使用随机数、数组 index 或会频繁变化的值。
- 表单、弹窗、按钮、链接优先复用项目封装组件。
- 用户可见文案遵守 `language.md`。
- 样式颜色遵守 `theme.md`。
- styled-jsx 写法遵守 `styled-jsx.md`。
- UI 改动考虑 RTL、深浅模式、品牌色、PC/Tablet/Mobile。

## 禁止

- 禁止在 render 中执行明显昂贵计算或产生副作用。
- 禁止滥用 `useMemo` / `useCallback` 掩盖结构问题。
- 禁止在组件外直接执行 `LANG`。
- 禁止硬编码文案和颜色。
- 禁止新增状态管理库。
- 禁止用删除逻辑方式绕过类型或 lint 问题。
- 禁止关键列表使用不稳定 key。

## 推荐模式

- 简单状态：`useState`。
- 复杂局部状态：Immer / use-immer；复杂对象状态优先使用 `useImmer`。
- 跨树上下文：React Context；项目既有 resso 状态按现有模块模式使用，不新增状态库。
- 复杂计算：纯函数 + 单元可验证输入输出。
- 复杂逻辑：抽离为自定义 hook，且 hook 只做一件事。
- 深层条件分支：优先 Guard Clause（early return）。

## 组件库使用规则

### 图片

必须使用项目封装 Image 组件，禁止原生 `<img>` 和 `next/image`。

```tsx
// ✅ 必须使用项目封装
import Image from '@/components/image';
<Image src='/path/to/img.png' alt='icon' />;

// ❌ 禁止
import Image from 'next/image';
<img src='/path/to/img.png' alt='icon' />;
```

### 图标

图标必须统一从 `@apps/icons` 导入，避免手写 SVG 或跨库混用。

```tsx
import { XIconoutlineWallet } from '@apps/icons';
<XIconoutlineWallet size={16} />;
```

### 输入框

输入框优先使用项目封装组件；不符合业务需求时再评估是否新增组件。

```tsx
import { BasicInput, INPUT_TYPE } from '@/components/basic-input';
```

### 弹窗

弹窗优先使用项目封装组件，避免直接使用 `antd/Modal`。

```tsx
import { BasicModal } from '@/components/modal';
```

### Tooltip

Tooltip 必须使用项目封装组件，禁止直接使用 `antd/Tooltip`。

```tsx
import ProTooltip from '@/components/tooltip';
<ProTooltip title={LANG('提示内容')}>{LANG('悬浮我')}</ProTooltip>;
```

### 链接

内部路由使用 `TrLink`，外部链接使用 `ExternalLink`，禁止用原生 `<a>` 处理项目路由跳转。

```tsx
import { TrLink } from '@/core/i18n';
import { ExternalLink } from '@/components/link';

<TrLink href='/moonx/trade'>Trade</TrLink>;
<ExternalLink href='https://example.com'>Example</ExternalLink>;
```

### 空状态

空状态优先使用项目封装组件。

```tsx
import { EmptyComponent } from '@/components/empty';

{isEmpty && <EmptyComponent style={{ height: '100%', margin: 0 }} text={LANG('暂无数据')} />}
```

### 错误边界

关键模块、业务逻辑复杂模块应使用错误边界，防止局部异常导致整页崩溃。

```tsx
import ErrorBoundary from '@/components/error/error-boundary';

<ErrorBoundary showEmptyUi={false}>
  <YourComponent />
</ErrorBoundary>;
```

### 响应式组件

纯布局响应式优先使用 `MediaInfo` CSS media。只有资源、结构或复杂交互必须按设备切换时，才使用响应式组件或 hook。

```tsx
import { Mobile, Desktop, Tablet } from '@/components/responsive';
```

## 接口

- 所有 api 从 `packages/apps-kit/core/network/src/api` 读取，不要自己写请求路径或重复封装请求。
- 所有 api 路径定义在 `packages/apps-kit/core/network/src/api/paths.ts`，不要自己写。
- API 方法名必须以 `Api` 结尾。

接口请求使用 `useRequestData` 封装：

```tsx
import { useRequestData } from '@/core/hooks/src/use-request-data';
import { getXxxApi } from '@/core/network/src/api';

const [data, fetchData, response, isLoading] = useRequestData(getXxxApi, {
  params: { id: 1 },
});
```

- 接口请求参数和返回值类型在 `packages/apps-kit/core/network/src/api/types.ts` 或对应 API 模块类型文件中定义，不要在页面中平行自定义。

```ts
export interface GetXxxApiParams {
  id: number;
}

export interface GetXxxApiResponse {
  data: string;
}
```

## 代码质量约束

- 单组件文件超过 **400 行** 时应拆分组件或提取 hook。
- 单组件 JSX 超过 **100 行** 时应提取子组件。
- 单组件 `useState` / `useImmer` 状态超过 **10 个** 时应拆分组件或提取 hook。
- 复杂内联条件超过 2 个 `&&` 或多层三元时，应提取为变量或函数。
- 大列表必须考虑虚拟化，优先使用项目已有虚拟列表方案或 `react-virtualized`。
- 注释不应替代函数抽象；复杂逻辑优先提取函数，函数名表达意图。
- 未使用的 import、变量、函数必须清除。

## 检查清单

- [ ] hooks 依赖是否完整？
- [ ] props 类型是否清晰？
- [ ] 是否复用已有组件？
- [ ] 图片、图标、Tooltip、Modal、Input、Link、Empty、ErrorBoundary 是否遵守项目封装规则？
- [ ] 文案是否走 `LANG`？
- [ ] 颜色是否走 CSS 变量？
- [ ] styled-jsx 是否遵守 `styled-jsx.md`？
- [ ] RTL 是否可用？
- [ ] 移动端布局是否可用？
- [ ] key 是否稳定？
- [ ] 复杂状态、长组件、大 JSX 是否已拆分？
