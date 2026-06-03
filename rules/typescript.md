---
name: typescript rules
description: TypeScript 规则
author: nilu
---

# TypeScript 规则

适用于 Next.js + React + TypeScript + Monorepo 项目。

核心原则：

- 优先保证类型安全，而非开发便利性。
- 优先使用 TypeScript 类型系统解决问题，而非运行时判断。
- 禁止为通过编译而牺牲类型安全。
- 保持类型定义简洁、可维护、可复用。

## 必须

- 类型要表达业务含义，不要只追求“编译通过”。
- 共享类型放在现有共享位置，先查找再新增。
- 金额、价格、盈亏、比例、手续费等金融计算必须遵守 `prototype.md`：禁止原生浮点运算，优先使用项目 `Number` / `String` prototype 链式方法，复杂或未确认加载场景使用 `BN` / `bignumber.js`。
- import alias 必须确认实际解析路径。
- 修改 public API 类型时说明影响范围。
- 异步函数必须处理失败路径。
- 保持严格类型安全。
- 不得引入 any。
- 不得引入 ts-ignore。
- 不得降低 tsconfig 严格级别。
- 优先复用现有类型。
- 优先提取公共类型。
- 优先使用 type-only imports。
- 保证 TypeScript 编译通过。

重构代码时必须：

- 保持类型兼容。
- 不修改业务逻辑。
- 不破坏公共 API。
- 不增加类型债务。

## 禁止

- 禁止用 `any`、`as any`、`as unknown as` 掩盖问题。
- 禁止使用浮点数处理金融计算。
- 禁止在类型错误时修改 tsconfig 或 ESLint 规则绕过。
- 禁止新增全局类型污染。
- 禁止把运行时校验误认为 TypeScript 静态类型已保证。
- 禁止循环引用。
- 禁止未使用的 import、变量、函数长期保留。

## 文件、目录与类型命名

- 文件和目录统一使用 kebab-case（小写 + 连字符）。
  - ✅ `my-component.tsx`、`trade-setting/`
  - ❌ `MyComponent.tsx`、`tradeSetting/`
- Interface 使用 `I` + PascalCase。
- Type 使用 `T` + PascalCase。
- Enum 使用 PascalCase。
- 可复用类型优先放到现有共享类型位置；组件私有类型可以放在组件文件内。
- 可复用类型文件可使用 `types.ts`，避免散落在页面实现中。

```ts
interface IUserInfo {
  id: string;
}

type TStatus = 'active' | 'inactive';

enum WalletFilterType {
  ALL = 'ALL',
}
```

## 代码质量与可维护性

- 变量名必须表达业务含义，禁止使用 `d`、`tmp`、`data2` 等模糊命名；循环 index 例外。
- 魔法数字应提取为命名常量。
- 复杂表达式应提取为变量或函数。
- 深层 if-else 嵌套超过 2 层时，优先使用 Guard Clause（early return）。
- 注释不应替代抽象；复杂逻辑优先提取函数，让函数名表达意图。
- 时间处理优先复用 `packages/apps-kit/core/utils/src/time.ts`；现有能力不满足时再评估 `dayjs`。
- 数据脱敏优先复用 `packages/apps-kit/core/utils/src/mask-string.ts`。
- 数字格式化、金额处理优先查找并复用：
  - `packages/apps-kit/core/utils/src/number.ts`
  - `packages/apps-kit/core/prototype/src/number.ts`
  - `packages/apps-kit/core/formulas/src/**`

## 金融计算

金融计算必须同时遵守 `.claude/rules/prototype.md`。

- 金额、价格、盈亏、比例、手续费、保证金、爆仓价等金融计算禁止使用原生浮点运算。
- 普通算术、比较、格式化优先使用项目 `Number` / `String` prototype 链式方法：`.add()` / `.sub()` / `.mul()` / `.div()` / `.gt()` / `.gte()` / `.lt()` / `.lte()` / `.eq()` / `.toFormat()` 等。
- 复杂公式、需要 BigNumber 实例连续链式、特殊 rounding mode、极大数或高精度边界、独立脚本 / 测试 / 未确认 prototype 加载的入口，使用 `BN` 或 `bignumber.js`。
- 禁止使用 `+value`、`Number(value)` 后直接 `+` / `-` / `*` / `/` 做业务计算。
- prototype 算术方法返回 `string`，比较方法返回 `boolean`，类型声明和后续计算必须匹配。

```ts
// ✅ 使用项目 Number/String prototype 链式方法
if (minAmount && amount.gte(minAmount)) {
  const total = amount.add(fee).mul(rate);
  return total.toFormat(2);
}
```

## Alias 注意事项

| Alias         | 注意点                                                 |
| ------------- | ------------------------------------------------------ |
| `@/*`         | SSG/SSR 中可能解析到 `apps-kit` 或本地 `src`，必须确认 |
| `@apps/ui/*`  | apps-ui 组件路径，修改会影响多个 app                   |
| `@apps/icons` | apps-icons barrel，注意 tree-shaking                   |

## 类型声明

- 接口参数以及返回值类型声明在 `packages/apps-kit/core/network/src/api/**/types.ts`，也有的直接声明在 `packages/apps-kit/core/network/src/api/**/index.ts` 中。
- API 方法命名必须以 `Api` 结尾，相关规则见 `nextjs.md` / `react-tsx.md`。

## 检查清单

- [ ] 是否避免了 `any` 扩散？
- [ ] 是否没有 `ts-ignore` / `as any` / `as unknown as`？
- [ ] 金融计算是否使用项目 prototype 链式方法或 `BN` / `bignumber.js`，并避免原生浮点运算？
- [ ] alias 是否确认？
- [ ] 类型是否表达不变量？
- [ ] 异步错误是否处理？
- [ ] 文件、目录、类型命名是否符合规范？
- [ ] 是否避免循环引用？
- [ ] 是否复用时间、脱敏、数字处理工具？
- [ ] 是否运行对应 tsc？
