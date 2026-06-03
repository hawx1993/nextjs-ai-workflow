---
name: bydfi-audit-tree-shaking
description: bydfi-web 项目 tree-shaking 违规扫描与修复。诊断第三方库整体导入、内部库根路径导入、未使用 import，并按项目规范改成按需导入。用于构建体积优化和 import 规范化场景。 支持 $ARGUMENTS scope: ssg/ssr/core/components。
disable-model-invocation: true
allowed-tools: Bash, Read, Write, Edit, Glob, Grep, Agent
---

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

# 操作指南:修复错误引用导致的 Tree Shaking 失效

## 角色

你是一名前端构建优化专家,擅长通过修复导入路径和清理无用代码来提升 Tree Shaking 效果,减少最终打包体积。

## 目标

1. 识别并修复项目中不规范的导入语句,确保构建工具能够正确进行死代码消除
2. 删除所有未使用的 import 语句,减少不必要的模块加载
3. 优化打包体积,提升应用加载性能

## 背景知识

### 什么是 Tree Shaking?

Tree Shaking 是一种通过静态分析移除 JavaScript 中未使用代码的技术。它依赖于 ES Module 的静态结构(import/export),在打包阶段识别并删除永远不会被执行的代码。

### 为什么错误的导入会影响 Tree Shaking?

1. **整体导入 vs 按需导入**: `import { Button } from 'antd'` 会导致整个 antd 库被引入,因为构建工具无法确定模块的 sideEffects
2. **根路径导入**: `import { Icon } from '@apps/icons'` 会引入整个图标库(build/index.mjs 约 75KB),而单个图标通常只有 1-5KB
3. **未使用的导入**: 即使导入了但未使用的模块也会被打包,浪费带宽和加载时间
4. **构建工具限制**: Next.js/Webpack 对于没有正确配置 exports 字段的包,无法智能地进行按需加载

## 执行流程

### 第一步:诊断扫描

扫描项目代码,查找以下问题:

#### 问题 1:第三方库整体导入

**检测正则**:

```regex
import\s+\{[^}]+\}\s+from\s+['"]antd['"]
import\s+\w+\s+from\s+['"]crypto-js['"]
import\s+_?\s+from\s+['"]lodash['"]
import\s+moment\s+from\s+['"]moment['"]
```

**重点库及影响**:

| 库        | 完整导入体积 | 说明                        |
| --------- | ------------ | --------------------------- |
| antd      | 300KB+       | UI 组件库                   |
| crypto-js | 120KB        | 加密库                      |
| lodash    | 70KB         | 工具库                      |
| moment    | 250KB        | 时间库(含语言包),已停止维护 |

#### 问题 2:内部库通过根路径导入

**检测正则**:

```regex
/from\s+['"]@\/core['"]|from\s+['"]@\/core\/(shared|api|hooks|store)['"]|from\s+['"]@apps\/ui['"]|from\s+['"]@apps\/icons['"]/
```

**详细说明**:

| 错误导入               | 影响                                      | 导出路径                                        |
| ---------------------- | ----------------------------------------- | ----------------------------------------------- |
| `from '@/core'`        | 引入所有核心模块,可能导致循环依赖         |                                                 |
| `from '@/core/shared'` | 引入所有共享模块(account、swap、trade 等) | packages/apps-kit/core/shared/index.ts          |
| `from '@/core/api'`    | 引入所有 API 接口定义                     | packages/apps-kit/core/network/src/api/index.ts |
| `from '@/core/hooks'`  | 引入所有 React Hooks                      | packages/apps-kit/core/hooks/index.ts           |
| `from '@/core/store'`  | 引入所有状态管理模块                      | packages/apps-kit/core/store/index.ts           |
| `from '@apps/ui'`      | 完整导入所有组件,体积增加 60-80%          | 无                                              |
| `from '@apps/icons'`   | 完整导入约 75KB,单个图标仅 1-5KB          | packages/apps-icons/build/index.d.mts           |

**修改与验证说明**

非常重要: 必须确保修改路径在上述详细说明表的对应导出路径，否则不应该修改

#### 问题 3:未使用的 import

**检测方法**:

使用 TypeScript 编译器或 ESLint 检测:

```bash
# TypeScript 会报告未使用的变量
pnpm tsc --noEmit

# ESLint 规则
"no-unused-vars": "error"
"@typescript-eslint/no-unused-vars": "error"
```

**常见场景**:

- 重构后遗留的旧导入
- 复制粘贴带来的多余导入
- 测试代码中导入但未使用

### 第二步:修复规则

#### 规则 A:第三方库按需导入

| 库        | ❌ 错误写法                         | ✅ 正确写法                              | 说明                |
| --------- | ----------------------------------- | ---------------------------------------- | ------------------- |
| antd      | `import { Button } from 'antd';`    | `import Button from 'antd/es/button';`   | 使用 ES Module 路径 |
| crypto-js | `import CryptoJS from 'crypto-js';` | `import SHA256 from 'crypto-js/sha256';` | 按需引入具体算法    |
| lodash    | `import _ from 'lodash';`           | `import get from 'lodash/get';`          | 按需引入具体函数    |
| moment    | `import moment from 'moment';`      | 考虑使用 `dayjs` 替代                    | moment 已停止维护   |

**路径映射示例**:

```typescript
// antd 组件: antd/es/{component-name-lowercase}
Button → antd/es/button
Modal → antd/es/modal
Form → antd/es/form

// crypto-js 算法
SHA256 → crypto-js/sha256
MD5 → crypto-js/md5
AES → crypto-js/aes

// lodash 函数
get → lodash/get
set → lodash/set
debounce → lodash/debounce
```

#### 规则 B:内部库具体路径导入

##### B1: @apps/icons 图标库

**错误写法**:

```typescript
import { XIconoutlineShare01, XIconsolidSol } from '@apps/icons';
```

**正确写法**:

```typescript
import XIconoutlineShare01 from '@apps/icons/build/icon-outline-share-01.mjs';
import XIconsolidSol from '@apps/icons/build/icon-solid-sol.mjs';
```

**命名转换规则**:

1. 从 `XIcon` 前缀后开始提取名称
2. 驼峰转短横线:
   - `outlineShare01` → `outline-share-01`
   - `solidSol` → `solid-sol`
   - `statusArrowInto` → `status-arrow-into`
3. 完整路径: `@apps/icons/build/icon-{converted-name}.mjs`

**驼峰转短横线算法**:

```
outlineShare01 → outline-share-01
- 在大写字母前插入短横线(首字母除外)
- 转换为小写
- 连续大写字母视为一个词组

示例:
XIconsolidSol → solid-sol
XIconstatusDown → status-down
XIconoutlineSettings01 → outline-settings-01
```

**验证**: 检查 `packages/apps-icons/build/` 目录下是否存在对应的 `.mjs` 文件

##### B2: @apps/ui 组件库

**错误写法**:

```typescript
import { Button, Input } from '@apps/ui';
```

**正确写法**:

```typescript
import Button from '@apps/ui/button';
import Input from '@apps/ui/input';
```

**可用组件** (基于 `packages/apps-ui/src/components/`):

button, input, select, checkbox, radio, switch, tabs, tag, badge, dropdown, menu, popover, tooltips, segmented, date-picker, message, apps-ui-context

**注意**: 根据实际导出方式决定是否需要花括号

##### B3: @/core 核心模块

**错误写法**:

```typescript
import { LANG, useRouter } from '@/core';
import { Account } from '@/core/shared';
import { getAssetsListApi } from '@/core/api';
```

**正确写法**:

```typescript
// 必须导入到最底层具体文件
import { LANG } from '@/core/i18n';
import { useRouter } from '@/core/hooks/src/use-router';
import { Account } from '@/core/shared/src/account';
import { getAssetsListApi } from '@/core/api/account';
```

**核心模块路径结构** (基于 `packages/apps-kit/core/`):

```
@/core/
├── hooks/src/          # React Hooks
│   ├── use-router.ts
│   ├── use-theme.ts
│   └── use-responsive.ts
├── shared/src/         # 共享模块
│   ├── account/
│   ├── swap/
│   └── trade/
├── api/                # API 接口
│   ├── account.ts
│   └── common.ts
├── store/src/          # 状态管理
│   ├── app-context.ts
│   └── local-storage.ts
└── utils/src/          # 工具函数
    ├── pathname.ts
    └── media-info.ts
```

**原则**: 不能直接引用 `@/core` 或一级目录`@/core/xxxx`,必须导入到具体文件

#### 规则 C:删除未使用的 import

**检测与清理**:

1. **TypeScript 自动检测**:

```typescript
// ❌ 错误:Button 未使用
import { Button, Input } from 'antd/es';
const App = () => <Input />;

// ✅ 正确:只导入使用的
import { Input } from 'antd/es';
const App = () => <Input />;
```

2. **清理步骤**:

```bash
# 1. 运行 TypeScript 检查,查找未使用变量
pnpm tsc --noEmit

# 2. 查看报错信息中的 "is declared but its value is never read"
# 3. 删除对应的 import 语句
```

3. **常见清理场景**:

```typescript
// 场景 1:重构后遗留
import { Account, UserInfo } from '@/core/shared/src/account';
// 如果只用了 UserInfo,删除 Account

// 场景 2:复制粘贴带来
import { useTheme, useRouter, useResponsive } from '@/core/hooks';
// 如果只用了 useRouter,删除其他两个

// 场景 3:测试代码
import { someTestUtil } from '@/core/test-utils';
// 如果是正式代码,删除测试工具导入
```

### 第三步:验证构建

修复完成后,**依次**运行以下命令:

```bash
# 1. 代码检查
pnpm lint:all

# 2. 构建验证(SSR)
pnpm build:ssr

# 4. 构建验证(SSG)
pnpm build:ssg
```

**验证标准**:

- ✅ 所有命令执行成功(exit code 0)
- ✅ 无 TypeScript 类型错误
- ✅ 无 ESLint 错误
- ✅ 构建产物体积减小(对比构建日志)

**失败处理**:

1. 检查错误日志,定位问题文件
2. 常见错误及解决:
   - 文件路径不存在 → 检查文件名拼写和路径
   - 导出类型不匹配 → 检查默认导出 vs 命名导出
   - 类型定义缺失 → 检查 `.d.mts` 文件是否存在
   - 模块未找到 → 确认导入路径是否正确

## 注意事项与最佳实践

### 0. 本次执行发现的常见陷阱（重要！）

#### 陷阱 1: isLogin 函数的错误使用

**问题描述**: `isLogin` 是一个函数，不是 Account 的属性

**错误写法**:

```typescript
import * as AccountUtils from '@/core/shared/src/account';
const isLogin = AccountUtils.isLogin(); // ❌ isLogin 不存在于 AccountUtils
```

**正确写法**:

```typescript
import * as AccountUtils from '@/core/shared/src/account';
import { isLogin } from '@/core/shared/src/account/utils/is-login';
const isLoginResult = isLogin(); // ✅ 从具体路径导入，并重命名避免冲突
```

**关键注意**:

- `isLogin` 是函数，使用时必须加括号: `isLogin()`
- 变量名不要与函数名冲突，建议用 `isLoginResult` 或 `isLoggedIn`
- 条件判断时: `if (isLoginResult)` 而不是 `if (isLogin)`

#### 陷阱 2: SwapCopy 和 Swap 的正确导入方式

**问题描述**: SwapCopy 和 Swap 都从 swap 模块导出，不是独立路径

**错误写法**:

```typescript
import { SwapCopy } from '@/core/shared/src/swap-copy'; // ❌ 路径不存在
const supportSymbols = SwapCopy.Info.store.supportSymbols; // ❌ SwapCopy 未定义
```

**正确写法**:

```typescript
import { SwapCopy } from '@/core/shared/src/swap';
const supportSymbols = SwapCopy.Info.store.supportSymbols; // ✅ 直接从 swap 导入
```

**关键注意**:

- SwapCopy、Swap 等都从 `@/core/shared/src/swap` 导出
- 使用方式: `SwapCopy.Info.store.supportSymbols`、`Swap.Trade.base`
- SwapLogic 是 Swap 的别名: `import { Swap as SwapLogic } from '@/core/shared/src/swap'`
- 验证方法: `grep -r "export.*SwapCopy" packages/apps-kit/core/shared/src/swap/`

#### 陷阱 3: 批量脚本产生的重复导入

**问题描述**: 使用脚本批量修复时可能产生重复导入

**常见场景**:

```typescript
import { SwapDemo } from '@/core/shared/src/swap-demo';
import { SwapDemo } from '@/core/shared/src/swap-demo'; // ❌ 重复
```

**解决方案**:

- 批量修复后立即运行 `pnpm tsc:all`
- 查找 TS2300 错误（Duplicate identifier）
- 手动删除重复的导入行

#### 陷阱 4: 路径映射必须验证

**问题描述**: 不确认路径就盲目修改会导致更多错误

**错误示例**:

```typescript
// 错误：假设路径是 /types
import { SpotTabType } from '@/core/shared/src/spot/types'; // ❌ 实际在 /position/types

// 正确：先 grep 查找真实导出路径
import { SpotTabType } from '@/core/shared/src/spot/position/types'; // ✅
```

**验证方法**:

```bash
# 查找模块的正确导出路径
grep -r "export.*SpotTabType" packages/apps-kit/core/shared/src/
```

#### 陷阱 5: 多导入语句的拆分

**问题描述**: 一个 import 语句导入多个模块时，需要拆分到不同路径

**错误写法**:

```typescript
import { useRequestData, useRouter, useTheme } from '@/core/hooks'; // ❌ 根路径
```

**正确写法**:

```typescript
import { useRequestData } from '@/core/hooks/src/use-request-data';
import { useRouter } from '@/core/hooks/src/use-router';
import { useTheme } from '@/core/hooks/src/use-theme';
```

**关键注意**:

- 每个导入必须来自具体的文件路径
- 不要混合不同路径的导入到一个语句

### 1. 安全性原则

- **小批量修改**: 每次修改一个文件或一个模块,验证通过后再继续
- **不要提交**: 修改完不要提交

### 2. 优先级策略

**高优先级** (影响大,修复简单):

- `@apps/icons` 根路径导入 → 直接影响打包体积
- `@/core` 根路径导入 → 可能引入大量无用代码
- 未使用的 import → 直接减少加载体积

**中优先级** (影响中等):

- `@/core/shared`, `@/core/api` 等一级目录导入
- `@apps/ui` 根路径导入

**低优先级** (影响较小):

- 第三方库(antd, lodash 等)如已配置 sideEffects 可暂缓

### 2.5. 批量修复策略（重要！）

**推荐流程**:

```bash
# 第1步：扫描所有违规导入
grep -r "from '@/core/\(shared\|hooks\|store\|api\)'" apps/byd-ssg/src --include="*.ts" --include="*.tsx" | wc -l

# 第2步：使用脚本批量修复（谨慎！）
python3 fix_imports.py

# 第3步：立即验证 TypeScript 编译
pnpm tsc:all 2>&1 | grep "error TS" | wc -l

# 第4步：如果有错误，查看错误类型分布
pnpm tsc:all 2>&1 | grep "error TS" | grep -oP "TS\d+" | sort | uniq -c | sort -rn

# 第5步：针对性修复错误
# - TS2304: 缺少导入 → 添加缺失的 import
# - TS2300: 重复标识符 → 删除重复导入
# - TS2307: 模块路径错误 → 查找正确路径
# - TS2774: 函数未调用 → 添加括号 isLogin()

# 第6步：循环执行第3-5步，直到 0 错误
```

**批量脚本注意事项**:

1. **必须备份**: 执行前 commit 当前代码
2. **小批量执行**: 每次处理 50 个文件，验证后再继续
3. **检查重复**: 脚本容易产生重复导入
4. **路径验证**: 不确定路径时用 grep 查找
5. **特殊处理**: isLogin、SwapDemo 等需要特殊逻辑

**常见错误类型及修复**:

| 错误码 | 数量 | 原因       | 修复方法                        |
| ------ | ---- | ---------- | ------------------------------- |
| TS2304 | 最多 | 缺少导入   | 添加 `import { X } from 'path'` |
| TS2300 | 较多 | 重复导入   | 删除重复的 import 行            |
| TS2307 | 中等 | 路径错误   | 用 grep 查找正确路径            |
| TS2774 | 中等 | 函数未调用 | `isLogin` → `isLogin()`         |
| TS2339 | 较少 | 属性不存在 | 检查对象结构                    |

### 3. 代码质量原则

- **保持一致性**: 同一文件内的导入风格保持一致
- **命名清晰**: 确保导入后的变量名语义清晰
- **按字母排序**: import 语句按模块路径字母排序(可选)
- **分组管理**: 第三方库、内部库、相对路径分组

### 4. 验证流程（严格执行）

**每修复 10-20 个文件后必须验证**:

```bash
# 快速验证 TypeScript 编译
pnpm tsc:all 2>&1 | grep -E "(Done|Failed)"

# 查看错误数量
pnpm tsc:all 2>&1 | grep "error TS" | wc -l

# 查看错误类型分布
pnpm tsc:all 2>&1 | grep "error TS" | python3 -c "
import sys, re
from collections import Counter
errors = [re.search(r'error TS(\d+)', line).group(1) for line in sys.stdin if re.search(r'error TS(\d+)', line)]
for err, count in Counter(errors).most_common(10):
    print(f'{count:4d} x TS{err}')
"
```

**最终验证（全部修复完成后）**:

```bash
# 1. 完整 lint 检查
pnpm lint:all

# 2. 检查违规导入是否清零
grep -r "from '@/core/\(shared\|hooks\|store\|api\)'" apps/byd-ssg/src --include="*.ts" --include="*.tsx" | wc -l
# 应该输出 0

# 3. 构建验证
pnpm build:ssg  # 或 pnpm build:ssr
```

### 5. 团队协作原则

- **Code Review**: 将导入规范纳入审查清单
- **自动化检查**: 使用 ESLint 规则自动检测不规范导入
- **文档同步**: 修改规范后及时更新开发文档

## 常见问题 FAQ

### Q0: 批量修复后错误反而增多了怎么办？

A: 这是正常现象，常见原因：

1. **重复导入**: 脚本可能产生重复的 import 语句
   - 解决: `pnpm tsc:all | grep TS2300` 查找并删除重复行
2. **路径错误**: 假设的路径不正确
   - 解决: 用 `grep -r "export.*XXX" packages/` 查找真实路径
3. **变量名冲突**: 如 `const isLogin = isLogin()`
   - 解决: 重命名变量为 `isLoginResult`

**应急方案**: `git diff` 查看修改，回退有问题的文件

### Q1: 为什么 `@apps/icons` 不能从根路径导入?

A: `build/index.mjs`(约 75KB)导出了所有图标。即使只用一个图标,也会导致整个文件被打包。直接引用 `build/icon-xxx.mjs`(1-5KB)可大幅减小体积。

### Q2: 如何判断导入是否影响 Tree Shaking?

A:

1. 运行 `ANALYZE=true pnpm build:ssg`
2. 在分析报告中搜索模块名
3. 如果看到整个库被打包,说明 Tree Shaking 未生效

### Q3: 修改后 TypeScript 报错怎么办?

A:

1. 检查对应的 `.d.mts` 类型文件是否存在
2. 确认导入路径(注意短横线、大小写)
3. 检查导出方式(默认导出 vs 命名导出)

### Q4: 未使用的 import 一定要删除吗?

A: 是的,原因:

- 增加不必要的模块加载
- 影响代码可读性
- 可能导致循环依赖
- 增加维护成本

### Q5: 能否自动化批量修复?

A: 可以但需谨慎:

- 使用 `eslint --fix` 自动删除未使用导入
- 图标路径转换可写脚本,但需人工验证
- 建议优先手动修复高频模块

### Q6: isLogin 函数为什么不能从 AccountUtils 调用？

A: `isLogin` 是独立导出的函数，不在 Account 对象上。

```typescript
// 错误
import * as AccountUtils from '@/core/shared/src/account';
AccountUtils.isLogin(); // ❌ isLogin 不存在

// 正确
import { isLogin } from '@/core/shared/src/account/utils/is-login';
isLogin(); // ✅
```

### Q7: SwapCopy 应该从哪里导入？

A: SwapCopy 从 `@/core/shared/src/swap` 导出，不是独立的 swap-copy 路径。

```typescript
// 错误
import { SwapCopy } from '@/core/shared/src/swap-copy'; // ❌ 路径不存在

// 正确
import { SwapCopy } from '@/core/shared/src/swap';
SwapCopy.Info.store.supportSymbols; // ✅
```

### Q8: 如何高效处理 100+ 文件的批量修复？

A: 推荐流程：

1. **分轮次修复**: 每轮 30-50 个文件
2. **立即验证**: 每轮运行 `pnpm tsc:all`
3. **错误分类**: 按 TS 错误码分类处理
4. **循环迭代**: 修复 → 验证 → 再修复
5. **记录进度**: 记录每轮修复数量和剩余错误

**示例进度**:

```
初始: ~500 个错误
第1轮: 165 个错误 (修复 335 个)
第2轮: 86 个错误  (修复 79 个)
第3轮: 60 个错误  (修复 26 个)
...
第10轮: 0 个错误  (完成)
```

### Q9: 修复过程中如何避免引入新错误？

A: 关键原则：

1. **路径必须验证**: 不确定时用 grep 查找
2. **避免重复导入**: 修改后检查文件顶部
3. **函数必须调用**: `isLogin()` 不是 `isLogin`
4. **变量名不冲突**: `isLoginResult` 不是 `isLogin`
5. **小批量验证**: 每 10-20 个文件验证一次

## 参考资料

- [Webpack Tree Shaking 官方文档](https://webpack.js.org/guides/tree-shaking/)
- [Next.js Bundle Analysis](https://nextjs.org/docs/app/building-your-application/optimizing/analyzing-bundles)
- [ES Modules 规范](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules)
- [package.json exports 字段](https://nodejs.org/api/packages.html#exports-sugar)
