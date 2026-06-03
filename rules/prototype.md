---
name: prototype rules
description: string 和 number prototype规则
author: nilu
---

# Prototype 规则

本规则适用于 BYDFi Web 中 `Number` / `String` 全局 prototype 扩展的使用，尤其是金额、价格、盈亏、比例、手续费、保证金、爆仓价等金融计算与数字格式化场景。

## 1. 能力来源

项目在 `packages/apps-kit/core/prototype/src` 中维护全局数字能力：

| 文件 | 作用 |
| --- | --- |
| `number.ts` | 扩展 `Number.prototype` 的算术、比较、格式化方法 |
| `string.ts` | 扩展 `String.prototype` 的算术、比较、格式化方法 |
| `prototype.d.ts` | 为全局 `Number` / `String` 声明扩展方法类型 |
| `bn.conf.ts` | 导出 `BN = BigNumber`，并配置 `EXPONENTIAL_AT: 1e9` 避免科学计数法 |

在已加载 `@/core/prototype` 的应用运行环境中，AI 可以直接使用这些链式方法，不需要为了普通金融四则运算额外手写 `new BigNumber(...)`。

```ts
const total = price.mul(quantity);
const nextValue = value.add(fee);
const isEnough = balance.gte(minAmount);
```

## 2. 方法清单

### 2.1 算术方法

| 方法 | 说明 | 返回值 |
| --- | --- | --- |
| `.add(arg)` | 加法 | `string` |
| `.sub(arg)` | 减法 | `string` |
| `.mul(arg)` | 乘法 | `string` |
| `.div(arg)` | 除法 | `string` |

要求：

- `arg` 支持 `number | string`。
- 算术方法返回 `string`，继续计算时可以继续调用链式方法。
- 不要把返回值误当作 `number` 继续用原生 `+ - * /` 计算。

```ts
// ✅ 推荐
const fee = amount.mul(rate);
const total = amount.add(fee);

// ❌ 禁止：返回值转 number 后继续原生浮点计算
const total = Number(amount.mul(rate)) + Number(amount);
```

### 2.2 比较方法

| 方法 | 说明 | 返回值 |
| --- | --- | --- |
| `.gt(arg)` | 大于 | `boolean` |
| `.gte(arg)` | 大于等于 | `boolean` |
| `.lt(arg)` | 小于 | `boolean` |
| `.lte(arg)` | 小于等于 | `boolean` |
| `.eq(arg)` | 等于 | `boolean` |

```ts
// ✅ 推荐
if (minAmount && amount.gte(minAmount)) {
  // ...
}

// ❌ 禁止：金融金额直接转 number 比较
if (Number(amount) >= Number(minAmount)) {
  // ...
}
```

### 2.3 格式化方法

| 方法 | 说明 | 返回值 |
| --- | --- | --- |
| `.toFixed(digit, trimZero?)` | 保留小数位 | `string` |
| `.toFormat(digit, trimZero?)` | 千分位格式化 | `string` |
| `.toRound(digit?)` | 四舍五入 | `string` |
| `.toCeil(digit?)` | 向上取整 | `string` |
| `.toFormatUnit(digit?)` | 千分位并带 `K/M/B/T` 单位 | `string` |

```ts
const displayPrice = price.toFixed(4, true);
const displayAmount = amount.toFormat(2);
const displayVolume = volume.toFormatUnit(2);
```

## 3. 金融计算优先级

1. **应用代码优先使用 prototype 链式方法**：普通金额、价格、数量、手续费、比例等四则运算、比较和展示格式化，优先使用 `.add()` / `.sub()` / `.mul()` / `.div()` / `.gt()` / `.gte()` / `.lt()` / `.lte()` / `.eq()` / `.toFormat()` 等方法。
2. **复杂场景使用 `BN` / `bignumber.js`**：复杂公式、需要 BigNumber 实例连续链式、特殊 rounding mode、极大数或高精度边界、严格金融舍入、独立脚本 / 测试 / 未确认 prototype 加载的入口，使用 `BN` 或项目既有 `bignumber.js` 封装。
3. **禁止原生浮点业务计算**：金额、价格、盈亏、比例、手续费、保证金、爆仓价等金融计算不得使用原生 `+ - * /`。

```ts
// ✅ 普通业务计算：使用 prototype
const margin = cost.div(leverage);
const pnl = closePrice.sub(openPrice).mul(quantity);

// ✅ 复杂公式：使用 BN
const result = new BN(price).times(quantity).div(rate).toFixed(precision);

// ❌ 禁止：原生浮点金融计算
const margin = cost / leverage;
const pnl = (closePrice - openPrice) * quantity;
```

## 4. 加载与边界

- prototype 方法依赖 `@/core/prototype` 的全局副作用加载。
- SSG / SSR / Web3 应用入口已按项目模式加载时，可以直接使用。
- 独立 Node 脚本、测试文件、临时工具、未经过 app root 的 worker 或新入口中，使用前必须确认已加载 `@/core/prototype`；无法确认时优先使用 `BN`。
- 不要为了使用这些方法新增依赖或重复实现平行工具。

## 5. 注意事项

- 非法数字可能返回 `'--'`，比较方法可能返回 `false`，业务上需要区分非法输入时应显式校验。
- `.div(0)` 当前返回 `'0'`，涉及交易、保证金、爆仓价等风险场景时必须显式校验除数。
- `.toRound()` / `.toCeil()` 当前实现中包含 `Math` 逻辑；严格金融舍入、特殊 rounding mode 或高精度边界优先使用 `BN`。
- `.toFixed()` 是项目覆盖后的 prototype 方法，不要按原生 `Number.prototype.toFixed` 的完整语义误判。
- 算术方法返回 `string`，组件 props、API 参数和类型声明要与字符串结果保持一致。

## 6. 检查清单

- [ ] 金融计算是否避免原生 `+ - * /` 浮点运算？
- [ ] 普通算术、比较、格式化是否优先使用项目 `Number` / `String` prototype 链式方法？
- [ ] 复杂公式、严格舍入、未确认 prototype 加载场景是否使用 `BN` / `bignumber.js`？
- [ ] 是否正确处理算术方法返回 `string` 的类型影响？
- [ ] 除数为 0、非法数字、空值等边界是否显式处理？
