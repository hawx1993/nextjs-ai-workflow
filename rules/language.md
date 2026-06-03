---
name: language
description: 文案与 i18n 规则
author: steve
---

# language 规则

## 1. 文案必须走 `LANG`

所有用户可见文本必须使用：

```ts
import { LANG } from '@/core/i18n';
```

示例：

```tsx
<div>{LANG('Hello World')}</div>
```

禁止硬编码：

```tsx
<div>Hello World</div>
<div>{'Hello World'}</div>
```

要求：

- DOM 中用户可见中文 / 英文文案不得硬编码。
- 专有品牌名、交易对、币种、技术标识、URL、埋点标识等非翻译内容可例外。
- JSX 属性中如果最终会展示给用户，也必须走 `LANG`。
- 非 UI 属性、埋点字段、接口枚举等不应为了规则机械包 `LANG`。

---

## 2. `LANG` 不能在组件/函数外直接执行

`LANG` 依赖运行时上下文，禁止在函数外直接调用。

### 2.1 错误写法（函数外直接执行）

```tsx
const texts = [LANG('苹果'), LANG('雪梨')];

const Card = () => {
  return (
    <div>
      {texts.map((text) => (
        <span key={text}>{text}</span>
      ))}
    </div>
  );
};
```

### 2.2 正确写法 A（放到组件内）

```tsx
const Card = () => {
  const texts = [LANG('苹果'), LANG('雪梨')];
  return (
    <div>
      {texts.map((text) => (
        <span key={text}>{text}</span>
      ))}
    </div>
  );
};
```

### 2.3 正确写法 B（必须放组件外时，用函数封装）

```tsx
const getTexts = () => [LANG('苹果'), LANG('雪梨')];

const Card = () => {
  const texts = getTexts();
  return (
    <div>
      {texts.map((text) => (
        <span key={text}>{text}</span>
      ))}
    </div>
  );
};
```

---

## 3. 动态参数必须用占位符 + 参数对象

禁止字符串插值直接拼到 `LANG` 文本里。

### 3.1 错误写法

```tsx
const Card = ({ count }) => {
  return <div>{LANG(`我有${count}个苹果`)}</div>;
};
```

### 3.2 正确写法

```tsx
const Card = ({ count }) => {
  return <div>{LANG('我有{count}个苹果', { count })}</div>;
};
```

---

## 4. 带样式的动态文案

带样式的动态文案优先使用 `renderLangContent`，不要手动拼接多个翻译片段导致语序无法适配多语言。

```tsx
import { LANG, renderLangContent } from '@/core/i18n';

<div>
  {renderLangContent(LANG('当前从{address}过滤了{number}笔交易'), {
    address: <span className='address'>{truncateString(filterAddress)}</span>,
    number: <span className='number'>{dataSource?.length}</span>,
  })}
</div>;
```

要求：

- 动态参数使用 `{placeholder}` + 参数对象。
- 需要插入 ReactNode 时使用项目已有翻译渲染能力，不要拆句拼接。
- 多语言长文本必须考虑按钮、tab、卡片宽度，不得撑破布局。

---

## 5. 禁止事项

- 禁止空 `LANG('')` 或把 `LANG` 当作无意义占位。
- 禁止 `LANG` 在模块顶层直接执行。
- 禁止 `` LANG(`...${x}...`) `` 这类插值写法。
- 禁止把非 UI 的埋点值、接口枚举、业务状态码机械包成翻译。
- 禁止在 styled-jsx 伪元素 `content` 中硬编码用户可见文案；应改为 JSX 文本并走 `LANG`。

---

## 6. 快速检查清单

提交前确认：

1. 是否存在硬编码文案（未使用 `LANG`）。
2. 是否存在函数外直接调用 `LANG`。
3. 是否存在 `` LANG(`...${x}...`) `` 这类插值写法。
4. 动态文案是否使用 `{placeholder}` + 参数对象。
5. 带样式动态文案是否使用 `renderLangContent` 或项目等价能力。
6. 是否避免了空 `LANG('')`。
