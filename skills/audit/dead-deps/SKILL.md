---
name: bydfi-audit-dead-deps
description: 扫描所有 package.json 中未使用的死依赖（declared but never imported），生成审查报告 支持 $ARGUMENTS scope: ssg/ssr/core/components。
disable-model-invocation: true
allowed-tools: Bash, Read, Write, Glob, Grep, Agent
---

扫描 monorepo 中所有 package.json 的 dependencies 和 devDependencies，逐个验证是否有实际代码引用，找出死依赖（声明了但从未使用的包），生成报告。

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

## 执行流程

```
1. 发现所有 package.json（排除 node_modules、.next、out、charting_library、vendored）
2. 按 package 分组，用并行 Agent 初筛每个 package 的依赖使用情况
3. 收集初筛结果，对每个疑似死依赖做精确二次验证（grep 纯包名，不是 from 'pkg'）
4. 对有 peerDependency 关系的包做链路验证
5. 只保留 100% 确认的死依赖，其余归入「需构建验证」
6. package.json 入口文件校验（main/module/types/exports 指向的文件是否存在）
7. 生成报告
8. 运行后审查（单轮精确复核）
```

### 关于 Agent 初筛结果的信任度

**对 Agent 初筛结果零信任。** 实测中 Agent 初筛的误判率约 10-15%，常见错误包括：

- 声称全仓库零引用，但漏掉了 `next/dynamic(() => import('pkg'))` 动态加载
- 声称某包是死依赖，但该包是其他活跃包的 peerDependency
- 声称某 babel 插件未配置，但漏掉了 .babelrc 中的简写形式
- 声称某包在 apps-kit 中未使用，但 apps-kit 有动态 import

因此第三步的二次验证是**必须步骤**，不能因为 Agent 给出了详细的搜索说明就跳过。

---

## 第一步：发现 package.json

```bash
find <repo-root> -name "package.json" \
  -not -path "*/node_modules/*" \
  -not -path "*/.next/*" \
  -not -path "*/out/*" \
  -not -path "*/out-rtl/*" \
  -not -path "*/charting_library/*" \
  | sort
```

排除以下 package.json（不审查）：

- `charting_library/package.json` — 第三方 vendored 库
- 非 workspace 成员的独立 package.json（如 `scripts/lang/package.json`）— 有自己的依赖隔离

## 第二步：并行 Agent 初筛

按以下规则分组派发 Agent：

| Agent    | 扫描范围                               |
| -------- | -------------------------------------- |
| 1        | 根 package.json + scripts/package.json |
| 2-N      | 每个 app 一个 Agent                    |
| 最后一个 | 所有 packages/\* 合并                  |

Agent 总数不超过 6 个。

### Agent prompt 要点

每个 Agent 执行：

1. 读取 package.json，提取 dependencies + devDependencies 的所有包名
2. 跳过 `workspace:*` 协议的内部包引用（不算死依赖）
3. 对每个包名，在对应源码目录搜索引用：
   - `import ... from 'pkg'` 或 `import 'pkg'`（含子路径如 `pkg/sub`）
   - `require('pkg')` 或 `require('pkg/sub')`
   - 动态 import：`import('pkg')`
   - 配置文件引用（详见「配置文件检查清单」）
   - npm scripts 中的 CLI 工具引用
4. 输出疑似死依赖列表，每个标注搜索范围和未找到引用的说明

### 配置文件检查清单

| 包类型                                                   | 检查位置                                                                                                                   |
| -------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `eslint-*` / `@typescript-eslint/*`                      | `.eslintrc*`、`eslint.config.*`                                                                                            |
| `prettier-*`                                             | `.prettierrc*`                                                                                                             |
| `babel-plugin-*` / `@babel/plugin-*` / `@babel/preset-*` | `.babelrc`、`babel.config.*`。**注意 babel 简写**：`babel-plugin-inline-react-svg` 在 .babelrc 中写成 `"inline-react-svg"` |
| `postcss-*`                                              | `postcss.config.*`                                                                                                         |
| `@sentry/*`                                              | `sentry.*.config.*`、`next.config.js`                                                                                      |
| `@styled-jsx/*`                                          | `.babelrc` 的 styled-jsx plugins 配置                                                                                      |
| `commitlint-*` / `@commitlint/*`                         | `commitlint.config.*`、package.json 的 `commitlint` 字段                                                                   |
| `cz-*`                                                   | package.json 的 `config.commitizen` 字段                                                                                   |
| `husky`                                                  | `.husky/` 目录是否存在                                                                                                     |
| `lint-staged`                                            | package.json 的 `lint-staged` 字段                                                                                         |
| `cross-env`                                              | package.json scripts 字段                                                                                                  |
| `typescript`                                             | tsc 命令                                                                                                                   |
| `rollup-plugin-*` / `@rollup/*`                          | `rollup.config.*`、构建脚本                                                                                                |
| `vitepress` / `vite-*`                                   | `vite.config.*`、`docs/` 目录                                                                                              |
| `@svgr/*`                                                | 构建脚本中 `svgr.transform()` 的 plugins 参数                                                                              |
| `tslib`                                                  | tsconfig.json 的 `importHelpers: true`                                                                                     |
| `*-polyfill`                                             | 可能是副作用 import（`import 'pkg'`），也可能在 babel 配置中                                                               |

### 搜索范围规则

- app 级依赖（apps/xxx）：搜索该 app 的 `src/`、配置文件，以及所有共享包 `packages/*/`
- 共享包依赖（packages/xxx）：**仅搜索该包自身目录**，不搜索 app 层
- 根级依赖：搜索全仓库（排除 node_modules）
- scripts 依赖：搜索 `scripts/src/` 目录

---

## 第三步：精确二次验证（关键步骤，不可跳过）

Agent 初筛结果常有误判。**必须对每个疑似死依赖逐一亲自验证**。

### 验证方法

对每个疑似死依赖包名 `pkg`：

```bash
# 在全仓库（排除 node_modules 和 pnpm-lock.yaml）搜索所有引用
# ⚠️ 必须 grep 纯包名，不要用 "from 'pkg'" 模式！
# "from 'pkg'" 会漏掉 dynamic(() => import('pkg')) 和 import('pkg').then() 等动态 import
Grep pattern="pkg" path=<repo-root> glob="!{node_modules,pnpm-lock.yaml}/**" output_mode=content
```

### 判断规则

| grep 结果                                         | 判断                          |
| ------------------------------------------------- | ----------------------------- |
| 仅出现在 package.json + pnpm-lock.yaml            | ✅ 确认死依赖                 |
| 出现在 import/require 语句中                      | ❌ 非死依赖                   |
| 仅出现在注释中（`//` 或 `/* */`）                 | ✅ 确认死依赖（注释不算使用） |
| 出现在 next.config.js 的 `optimizePackageImports` | ⚠️ 需进一步检查（见下方说明） |
| 出现在 `.babelrc` plugins 中（注意简写形式）      | ❌ 非死依赖                   |

### `optimizePackageImports` 不算实际使用

`optimizePackageImports` 是 Next.js 的构建优化提示，告诉 webpack 如何优化某个包的 barrel import。它：

- 不产生实际的 import
- 不要求包在 package.json 中声明
- 如果包没有被任何代码 import，该条目是 no-op

因此，仅出现在 `optimizePackageImports` 中的包**可以判定为死依赖**。

---

## 第四步：peerDependency 链路验证（关键步骤）

这是最容易误判的地方。一个包看起来没有被代码 import，但如果它是某个被使用的包的 **peerDependency**，删除它会导致该包运行时失败。

### 验证方法

对每个初步确认的"死依赖"，检查它是否被同 package.json 中其他依赖作为 peerDependency 引用：

```bash
# 读取使用该包的第三方库的 package.json，检查 peerDependencies
python3 -c "
import json
with open('<path-to-node_modules/.pnpm/pkg@version/.../package.json>') as f:
    d = json.load(f)
print('peerDependencies:', d.get('peerDependencies', {}))
"
```

### 已知的 peerDependency 陷阱

| 死依赖候选                                | 实际是谁的 peerDep            | 结论                                            |
| ----------------------------------------- | ----------------------------- | ----------------------------------------------- |
| `lodash.isequal`                          | `@wangeditor/core` 的 peerDep | 如果该 package.json 使用 wangeditor，**不能删** |
| `lodash.camelcase`、`lodash.clonedeep` 等 | 同上                          | 同上                                            |

### 区分 regular dependency vs peerDependency

| 类型               | pnpm 行为                             | 我们是否需要声明       |
| ------------------ | ------------------------------------- | ---------------------- |
| regular dependency | pnpm 安装在该包自己的 node_modules 中 | 不需要（该包自行解决） |
| peerDependency     | pnpm 不自动安装，需要消费者提供       | **需要声明**           |

例如：`@sentry/react` 是 `@sentry/nextjs` 的 **regular dependency**（不是 peer），所以 pnpm 会自动安装它。我们 package.json 中的声明是冗余的，可以安全删除。

---

## 第五步：transpilePackages 上下文检查

本项目使用 `transpilePackages` 将共享包（如 apps-kit）在 app 构建时编译。这意味着：

- apps-kit 中的 `import('some-pkg')` 在构建时由 app 的 webpack 处理
- 模块解析使用 **app 的 node_modules**，不是 apps-kit 的
- 如果 apps-kit 代码 import 了某个包，那么**每个使用 apps-kit 的 app 都需要声明该包**

### 检查规则

1. 找到 apps-kit（或其他 transpilePackages 的共享包）中所有 import 的第三方包
2. 确认每个 app 的 package.json 中声明了这些包
3. apps-kit 自身 package.json 中的声明**可能是冗余的**（因为构建在 app 上下文运行），但由于 pnpm strict 模式下模块解析链路不确定，**只有满足以下全部条件才可判定为冗余**：
   - apps-kit 源码中零 import 该包（包括动态 import）
   - 该包仅在某个特定 app 中使用（非所有 app 共用）
   - 该 app 已自行声明该包
   - 该包不通过 apps-kit 的 barrel export 被间接引用

### 典型案例

`@sentry/browser` 在 `apps-kit/components/error/error-boundary.tsx` 中有动态 import。因此：

- apps-kit 的声明：有意义（明确依赖关系）
- 每个 app 的声明：**必须保留**（构建时模块解析需要）

---

## 第六步：package.json 入口文件校验

检查每个 package.json 的 `main`、`module`、`types`、`exports` 字段指向的文件是否真实存在。

### 检查方法

```bash
# 对每个 package.json，提取入口字段并验证文件是否存在
python3 -c "
import json, os, sys
pkg_path = sys.argv[1]
pkg_dir = os.path.dirname(pkg_path)
with open(pkg_path) as f:
    pkg = json.load(f)
for field in ['main', 'module', 'types']:
    if field in pkg:
        target = os.path.join(pkg_dir, pkg[field])
        if not os.path.exists(target):
            print(f'MISSING: {field} -> {pkg[field]}')
# 递归检查 exports map
if 'exports' in pkg:
    def check_exports(obj, path='exports'):
        if isinstance(obj, str):
            target = os.path.join(pkg_dir, obj)
            if not os.path.exists(target):
                print(f'MISSING: {path} -> {obj}')
        elif isinstance(obj, dict):
            for k, v in obj.items():
                check_exports(v, f'{path}.{k}')
    check_exports(pkg['exports'])
" <package.json-path>
```

### 判断规则

| 情况                                               | 判断                                                  |
| -------------------------------------------------- | ----------------------------------------------------- |
| 入口文件不存在，包需要构建（如 `dist/`、`build/`） | ⚠️ 构建产物缺失，记录但不标记为错误（可能只是未构建） |
| 入口文件不存在，路径非构建目录                     | ❌ package.json 配置错误                              |
| `exports` map 中某个条件路径不存在                 | ⚠️ 需确认该条件是否会被触发                           |

### 报告中的呈现

在报告末尾增加「package.json 入口校验」章节：

| #   | package.json             | 字段 | 声明路径         | 状态                 |
| --- | ------------------------ | ---- | ---------------- | -------------------- |
| 1   | packages/apps-base-kline | main | ./dist/index.cjs | 文件不存在（需构建） |

---

## 第七步：分类与报告

### 分类标准

| 分类           | 标准                                                                                    | 能否安全删除                             |
| -------------- | --------------------------------------------------------------------------------------- | ---------------------------------------- |
| **确认死依赖** | 全仓库零代码引用（import/require/配置），且非任何使用包的 peerDep                       | ✅ 可安全删除                            |
| **冗余声明**   | 代码引用在其他 package 中，当前 package 自身不 import，且使用方已自行声明               | ✅ 可安全删除（但建议逐个删 + 构建验证） |
| **需构建验证** | 有间接引用（optimizePackageImports、transpilePackages context），或可能被 auto-discover | ⚠️ 需删除后跑构建验证                    |

### 报告格式

```markdown
# 死依赖审查报告

> 审查日期：YYYY-MM-DD
> 审查范围：monorepo 全部 N 个 package.json
> 审查方法：逐个依赖在全仓库搜索 import/require/配置引用，交叉验证 peerDependency 链和 pnpm strict 模式解析
```

#### 确认死依赖（表格）

按子类分组（全仓库未使用 / 声明冗余 / 注释残留 / 工具类型包对应主包未使用 / 构建工具未引用 / 上游残留），每组一个表格：

| #   | 包名       | 所在 package.json | 类型 | 验证依据                |
| --- | ---------- | ----------------- | ---- | ----------------------- |
| 1   | `pkg-name` | apps/byd-ssg      | dep  | 全仓库零 import/require |

**验证依据必须具体**：说明 grep 了什么、在哪里搜索、结果是什么。不能写"未使用"这样模糊的结论。

#### 冗余声明（表格）

| #   | 包名 | 所在 package.json（冗余） | 实际使用位置 | 使用方是否自行声明 |
| --- | ---- | ------------------------- | ------------ | ------------------ |

#### 需构建验证（表格）

| 包名 | 所在 package.json | 不确定原因 |
| ---- | ----------------- | ---------- |

#### 统计汇总

| 分类       | 数量 |
| ---------- | ---- |
| 确认死依赖 | N 条 |
| 冗余声明   | N 条 |
| 需构建验证 | N 条 |

#### 建议操作步骤

1. 先删确认死依赖 → `pnpm install` → `pnpm tsc:all` → 构建验证
2. 再删冗余声明 → 逐批构建验证
3. 最后处理需构建验证项

### 报告文件输出

写入 `reports/YYYY-MM-DD/byd-web-report-dead-deps-YYYY-MM-DD.md`（当天日期），同名文件已存在则覆盖。

---

## 已知陷阱（从实际运行中总结）

### 1. Babel 插件简写名

Babel 插件在 `.babelrc` 中可以使用简写：

- `babel-plugin-inline-react-svg` → `"inline-react-svg"`
- `babel-plugin-transform-remove-console` → `"transform-remove-console"`
- `@babel/plugin-proposal-decorators` → `"@babel/proposal-decorators"`

grep 包名时如果只搜全名，会漏掉 .babelrc 中的简写引用，导致误判为死依赖。**必须同时搜索简写形式**。

### 2. peerDependency 是最大误判源

`lodash.isequal` 在代码中从未被 import（代码用的是 `import { isEqual } from 'lodash'`），但它是 `@wangeditor/core` 的 peerDependency。删除它会导致 wangeditor 运行时失败。

**对每个死依赖候选，必须检查同 package.json 中其他包是否将其列为 peerDependency。**

### 3. 动态 import 是最危险的漏网之鱼

有两种动态 import 模式：

```typescript
// 模式 A：直接动态 import（grep 包名能搜到）
import('@sentry/browser').then((Sentry) => { ... })

// 模式 B：next/dynamic 包裹（grep 包名也能搜到，但 grep "from 'pkg'" 搜不到！）
const Tour = dynamic(() => import('reactour'), { ssr: false })
```

**关键陷阱**：如果验证时用的是 `from ['"]pkg['"]` 模式（只匹配 `import X from 'pkg'`），会漏掉 `dynamic(() => import('pkg'))` 这种 Next.js 常见的懒加载方式。

**解决方案**：二次验证时直接 grep 包名本身（不加 `from` 前缀），这样无论是静态 import、动态 import 还是 next/dynamic 都能覆盖到。

### 4. transpilePackages 导致 import 在非预期的 package 上下文解析

apps-kit 代码中的 `import('@sentry/browser')` 在构建时由 app 的 webpack 处理。如果 app 的 package.json 没声明 `@sentry/browser`，构建会失败。

**共享包通过 transpilePackages 编译时，其 import 的包需要在每个消费 app 中声明。**

### 5. `@types/*` 包的判断

- 对应主包在当前 package 中有 `.ts/.tsx` 文件 import → 保留
- 对应主包仅在 `.js` 文件中使用 → 类型包无效，可删
- 对应主包未使用 → 类型包也是死依赖
- 对应主包在其他 package 中使用，且该 package 已声明 `@types/*` → 当前声明冗余

### 6. `optimizePackageImports` 不代表使用

`next.config.js` 中的 `optimizePackageImports` 数组仅是构建优化提示。如果没有代码 import 该包，条目是 no-op。不能因为包名出现在这个数组中就认为它被使用。

### 7. regular dep vs peerDep 决定是否冗余

如果包 A 声明了包 B 作为 regular dependency，pnpm 会在 A 的 node_modules 中安装 B。我们不需要再声明 B。

如果包 A 声明了包 B 作为 peerDependency，pnpm 不会自动安装 B，需要消费者声明。我们必须保留 B。

**不检查这个区别是初筛 Agent 最常犯的错误。**

### 8. apps-kit 冗余声明比想象中更难判定

apps-kit 中声明了很多包，但 apps-kit 自身不 import。看起来像冗余声明，但实际情况复杂：

- apps-kit 通过 `transpilePackages` 在 app 上下文编译，模块解析依赖 app 的 node_modules
- 某些包虽然 apps-kit 不直接 import，但可能被 apps-kit 的依赖间接需要
- pnpm strict 模式下移除声明可能导致构建时模块解析失败

**安全判定冗余的条件**：包仅在某个特定 app 中使用（如 `@wangeditor/editor` 仅在 bydfi-ssr），该 app 已自行声明，且 apps-kit 源码零 import。

**不安全**：包在多个 app 中通过 apps-kit 的 barrel export 间接使用（如 `react-dnd`），此时不要轻易判定 apps-kit 中的声明为冗余。

### 9. 上游 fork 残留

fork 的第三方库（如 KLineChart）可能带有 docs 站、测试框架等开发依赖，但本项目已删除对应目录（如 `docs/`）。这些依赖全部是死的，可以批量清理。

---

## 注意事项

- 只做研究和分析，不修改任何 package.json 或删除任何依赖
- **每个结论必须有明确的验证依据**，不能凭感觉判断
- **全仓库 grep 包名**（排除 node_modules 和 pnpm-lock.yaml）是最可靠的验证手段
- 对 Agent 的初筛结果**零信任**，必须亲自逐条验证
- peerDependency 检查不可跳过
- 报告文件输出到 `reports/YYYY-MM-DD/` 日期子目录，输出前先 `mkdir -p reports/YYYY-MM-DD/`，已在 `.gitignore` 中忽略
- 大型 monorepo 建议先扫某个子 package（通过参数指定），确认流程正确后再全量扫描

## 相关 skill

- **前置**：`bydfi-audit-pkg-version` — 先校版本一致再清依赖
- **关联**：`bydfi-audit-security-deps-vuln` — 死依赖与漏洞同时排查
- **互补**：`bydfi-web-report-dead-code` — 代码层死代码

按问题域查询完整 skill 索引：见 `.claude/skills/SKILL_BEST_PRACTICES.md` 的"问题域 → SoT skill 索引"章节。

## 运行后审查（单轮，不循环）

报告生成后，对每条结论做一次精确复核：

1. **grep 验证**：对每个确认死依赖，在全仓库 grep 包名确认仅出现在 package.json + lock 文件中
2. **peerDep 验证**：对每个确认死依赖，检查是否是同 package.json 中其他活跃依赖的 peerDependency
3. **babel 简写验证**：对 babel 插件类依赖，同时搜索全名和简写名
4. **修正报告**：发现误判直接修正报告文件
5. **陷阱记录**：如果发现新的误判模式，在终端输出提示用户将其补充到本 skill 的「已知陷阱」中

$ARGUMENTS
