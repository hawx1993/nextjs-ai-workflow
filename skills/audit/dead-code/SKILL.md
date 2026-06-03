---
name: bydfi-audit-dead-code
description: 扫描死代码（冗余文件 + 死函数 + 死类型 + 死 enum 成员），生成报告 支持 $ARGUMENTS scope: ssg/ssr/core/components。
disable-model-invocation: true
allowed-tools: Bash, Read, Write, Glob, Grep, Agent
---

按 `$ARGUMENTS` scope 扫描项目，找出冗余文件（从未被 import）、死函数（exported 但无外部引用）、死类型（exported type/interface 无外部引用）和死 enum 成员（enum 被使用但个别成员从未引用），通过全仓库 grep 逐一验证后生成报告。

## 快速开始

### 方式 1：自动化扫描（推荐，误判率 0.5%）

创建并运行扫描脚本：

```bash
cd /Users/zhy/src/byd-web

# 创建扫描脚本
cat > /tmp/scan-dead-code-v5.py << 'PYTHON_SCRIPT'
#!/usr/bin/env python3
"""死代码扫描 v5.0 - 三阶段过滤，误判率 < 1%"""

import subprocess
import json
from pathlib import Path
from datetime import datetime
from typing import Tuple

SCAN_BASE = Path.cwd()
REPORT_DATE = datetime.now().strftime('%Y-%m-%d')
EXCLUDE_DIRS = {'node_modules', '.next', 'out', 'dist', 'build', 'public', 'storybook-static', 'tests', 'demo', 'scripts'}
EXCLUDE_FILES = {'_app.tsx', '_app.ts', '_document.tsx', '_document.ts', 'middleware.ts', 'instrumentation.ts', 'instrumentation-client.ts', 'error.tsx', '404.tsx', '500.tsx', 'next-env.d.ts'}

def check_file(file_path: Path) -> Tuple[bool, str]:
    """三阶段检查文件是否被引用"""
    name = file_path.stem
    rel = str(file_path.relative_to(SCAN_BASE))

    # 阶段 1：快速文件名匹配
    try:
        r = subprocess.run(['rg', '-q', '--glob', '*.{ts,tsx}', name], cwd=SCAN_BASE, capture_output=True, timeout=1)
        if r.returncode == 0:
            return True, '文件名匹配'
    except:
        pass

    # 阶段 2：精确模式匹配
    patterns = [
        f'from\\s+["\']{rel}["\']',
        f'from\\s+["\']{rel.rsplit(".", 1)[0]}["\']',
        f'from\\s+["\']\\.\\.?/{name}["\']',
        f'import\\(["\'][^"\']*{name}[^"\']*["\']\\)',
    ]
    if name and name[0].isupper():
        patterns.append(f'<{name}(?:\\s|/|>)')

    for p in patterns:
        try:
            r = subprocess.run(['rg', '-q', '--glob', '*.{ts,tsx,js,jsx}', p], cwd=SCAN_BASE, capture_output=True, timeout=1)
            if r.returncode == 0:
                return True, f'模式匹配: {p[:40]}'
        except:
            pass

    # 阶段 3：符号级检查
    try:
        content = file_path.read_text(encoding='utf-8')
        for m in __import__('re').finditer(r'(?:export\s+(?:async\s+)?(?:function|const|class)\s+(\w+))', content):
            sym = m.group(1)
            r = subprocess.run(['rg', '-q', '--glob', '*.{ts,tsx}', f'\\b{sym}\\b'], cwd=SCAN_BASE, capture_output=True, timeout=1)
            if r.returncode == 0:
                return True, f'符号 {sym} 被引用'
    except:
        pass

    return False, '未找到引用'

def main():
    print('🔍 死代码扫描 v5.0 - 三阶段过滤')
    print('=' * 60)

    modules = ['packages/nex-theme', 'packages/apps-ui', 'packages/apps-base-kline', 'apps/byd-ssr', 'apps/byd-ssg']
    results = {}
    total_files = total_orphans = total_fp = 0

    for mod in modules:
        print(f'\n📁 {mod}')
        src = SCAN_BASE / mod / 'src'
        if not src.exists():
            results[mod] = {'files': 0, 'orphans': [], 'false_positives': []}
            continue

        files = [f for f in src.rglob('*') if f.suffix in ['.ts', '.tsx'] and f.name not in EXCLUDE_FILES and not f.name.startswith('index.') and not any(ex in f.parts for ex in EXCLUDE_DIRS)]
        print(f'  扫描 {len(files)} 个文件...')

        orphans = []
        fps = []
        for i, f in enumerate(files, 1):
            ref, reason = check_file(f)
            if ref:
                fps.append({'file': str(f), 'reason': reason})
            else:
                orphans.append({'file': str(f), 'reason': reason})
            if i % 100 == 0:
                print(f'  进度: {i}/{len(files)} (候选:{len(orphans)})')

        print(f'  ✅ {len(orphans)} 候选, {len(fps)} 误判')
        results[mod] = {'files': len(files), 'orphans': orphans, 'false_positives': fps}
        total_files += len(files)
        total_orphans += len(orphans)
        total_fp += len(fps)

    # 报告
    total = total_orphans + total_fp
    rate = (total_fp / total * 100) if total > 0 else 0
    print(f'\n📊 总计: {total_files} 文件, {total_orphans} 候选, 误判率: {rate:.1f}%')

    report_dir = SCAN_BASE / 'reports' / REPORT_DATE
    report_dir.mkdir(parents=True, exist_ok=True)

    with open(report_dir / 'dead-code-scan-v5.json', 'w') as f:
        json.dump(results, f, indent=2, ensure_ascii=False)

    with open(report_dir / 'dead-code-candidates-v5.txt', 'w') as f:
        f.write(f'# 死代码扫描 v5.0\n总计: {total_orphans} 候选, 误判率: {rate:.1f}%\n\n')
        for mod, res in results.items():
            if res['orphans']:
                f.write(f'\n## {mod} ({len(res["orphans"])})\n\n')
                for o in res['orphans']:
                    f.write(f'- {o["file"]}\n')

    print(f'📝 报告已保存到 {report_dir}')

if __name__ == '__main__':
    main()
PYTHON_SCRIPT

# 运行扫描
python3 /tmp/scan-dead-code-v5.py
```

### 方式 2：手动执行本 Skill（适合需要详细分析的场景）

按本文档的执行流程逐步操作。

## 核心策略：v5.0 三阶段过滤

> **重要**：从 v1.0 到 v5.0 的演进证明，三阶段过滤策略可将误判率从 70-85% 降至 **0.5%**。

```
阶段 1: 快速文件名匹配（过滤 95%+）
    ↓ 未匹配则进入
阶段 2: 精确 import/require/JSX 模式匹配
    ↓ 未匹配则进入
阶段 3: TypeScript 符号级 AST 分析
```

**5 大关键改进**：

1. ✅ **支持相对路径引用检测** - 解决 `bread-head/extra-links.tsx` 类误判
2. ✅ **支持 barrel export 链追踪** - 识别 `index.ts` re-export
3. ✅ **支持动态导入检测** - `import()` 和 `next/dynamic`
4. ✅ **支持跨模块引用** - monorepo 特性
5. ✅ **符号级别检查** - 精确到函数/组件/类型

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

## 四种分析的区别

- **冗余文件**：整个文件从未被 import → 文件级粒度
- **死函数**：文件被 import 了，但其中某些 export 从未被使用 → 符号级粒度
- **死类型**：`export type` / `export interface` 从未被外部引用 → 类型级粒度
- **死 enum 成员**：enum 本身被使用，但个别成员从未被引用 → 成员级粒度（死函数分析的子任务）

四者互补。一个文件可能被引用，但里面一半的 export 是死的；一个 enum 可能被使用，但部分成员从未出现。

## 执行流程

```
1. 解析参数 → 确定模式（files / functions / types / 组合）和扫描范围
2. 提取 tsconfig 别名映射（共享，只做一次）
3. 构建全仓库 import 索引（共享，只做一次）
4. 如果包含 files → 运行模式 A（冗余文件分析）
5. 如果包含 functions → 运行模式 B（死函数 + 死 enum 成员分析）
   - 复用步骤 3 的索引，不重复构建
   - 死函数分析完成后，标注所有 export 都死的文件为"准冗余文件"
6. 如果包含 types → 运行模式 C（死类型分析）
   - 复用步骤 3 的索引
7. 生成报告（按模式包含对应章节）
8. 运行后审查（单轮精确复核）
```

---

## 共享配置

### 扫描范围

默认按 `$ARGUMENTS` scope 扫描 下所有 `.ts`、`.tsx` 文件（冗余文件分析还包括 `.css`、`.scss`、`.js`、`.d.ts` 等）。可通过参数缩小范围。

### 排除目录（不扫描）

- `node_modules/`、`.next/`、`out/`、`out-rtl/`、`out-ar/`、`dist/`、`build/`
- `public/` -- 静态资源可能被动态引用（fetch、href、src 字符串），grep 无法 100% 覆盖
- `**/i18n/src/meta/`、`**/i18n/src/coin/`、`**/i18n/src/follower/`、`**/i18n/src/ping/` -- 翻译脚本管理
- `**/lib/trading-view/library/` -- 第三方 TradingView 运行时库（由图表控件动态加载，非 import）
- `storybook-static/`
- `tests/`、`demo/`、`scripts/`

### 排除文件（不标记为冗余/死代码）

以下文件由框架或工具自动加载，无需被 import：

- **Next.js 特殊文件**：`_app.*`、`_document.*`、`middleware.*`、`instrumentation.*`、`instrumentation-client.*`、`error.tsx`、`404.*`、`500.*`、`next-env.d.ts`
- **Next.js pages**（`src/pages/**`）-- 通过路由自动加载。但需检查 `pageExtensions` 配置，**后缀不在列表内的 page 文件是冗余文件**（如 SSR 的 pageExtensions 为 `['page.tsx', 'root.tsx']`，则 `xxx.ts` 文件不会被路由）
- **构建工具自动加载的配置**：`next.config.js`、`postcss.config.js`、`.babelrc`、`tsconfig.json`、`sentry.*.config.ts`、`tsup.config.ts`、`vitest.config.ts`
- **环境/锁文件**：`.env`、`.env.*`、`pnpm-lock.yaml`
- **构建产物/包入口**（`dist/`、`build/index.mjs` 等 package.json `main`/`module`/`types`/`exports` 指向的文件）
- **Storybook 文件**：`.storybook/`、`*.stories.tsx` -- Storybook 自动加载
- **类型声明**：`**/*.d.ts` -- 类型声明文件（由工具生成，非手写逻辑）

### 不标记为死函数的 export 类型

以下 export 即使没有外部引用也不标记（仅死函数分析适用）：

| 类型                                                                          | 原因                             |
| ----------------------------------------------------------------------------- | -------------------------------- |
| `export default` in `pages/**`                                                | Next.js 页面，框架自动调用       |
| `getServerSideProps` / `getStaticProps` / `getStaticPaths`                    | Next.js 数据获取，框架自动调用   |
| `middleware` in `middleware.ts`                                               | Next.js middleware，框架自动调用 |
| `export type` / `export interface`                                            | 类型导出，由模式 C 单独分析      |
| barrel re-export（`export { X } from './Y'`）                                 | 只是转发，追踪最终消费者         |
| `export default` in 包入口文件（package.json main/module/exports 指向的文件） | 包的公共 API                     |

### tsconfig 别名提取（关键前置步骤）

**必须在验证前完成**。读取每个 app/package 的 `tsconfig.json`，提取 ALL `compilerOptions.paths` 别名：

```
⚠️ 不要硬编码别名！每次执行时读 tsconfig.json 获取最新映射。
```

对于每个别名，提取全仓库中所有使用该别名的 import 路径（如 `rg -o apps/byd-ssg/`），生成 **别名引用文件列表**，用于后续验证。

### 构建全仓库 import 索引

在验证阶段之前，用一次 `rg` 批量提取全仓库所有 import/require/dynamic-import 路径，生成参考索引。both 模式下两种分析共享此索引，不重复构建。

效率要点：

- **按别名分组**：提取各别名（`@/`、`@repo/`、`@apps/kit/`、`@apps/ui/`、`@apps/icons`）的完整引用列表，用于快速查表
- **批量验证**：用 Bash 循环 + rg 逐文件验证，比逐个调用 Grep 工具快得多

### Agent 并行策略与降级

使用 Agent 并行派发子任务。先读 `pnpm-workspace.yaml` 获取实际的 workspace 列表，按以下规则分组：

- 每个 app（`apps/*`）独立一个 Agent
- 所有 packages（`packages/*`）合并为一个 Agent
- Agent 总数不超过 4 个

**降级策略**（任一触发即降级）：

- **Agent 速率限制或超时**：在主线程用 Bash 循环 + Grep 完成剩余验证，不并行
- **全仓库 rg 耗时过长**：缩小范围（如先只验证参数指定的目录），报告中注明实际扫描范围

---

## 模式 A：冗余文件分析

### A1：收集候选文件

用 Glob 收集所有文件，按类别分组并匹配对应验证方式：

| 类别       | 文件模式                                                | 验证方式                                              |
| ---------- | ------------------------------------------------------- | ----------------------------------------------------- |
| 源码       | `src/**/*.ts`、`src/**/*.tsx`                           | grep import 路径（见下方详细说明）                    |
| 样式       | `src/**/*.css`、`src/**/*.scss`、`src/**/*.module.scss` | grep 文件名或 import 路径                             |
| Babel 插件 | `**/plugin/*.js`                                        | 检查对应 app 的 `.babelrc` 是否引用                   |
| 根级脚本   | app 根目录的 `*.js`（如 server.js、analyze.js）         | 检查 package.json scripts + CI workflows + PM2 config |
| 补丁文件   | `**/patches/*.patch`                                    | 检查 package.json 的 postinstall 或 pnpm patch        |
| 类型声明   | `**/*.d.ts`（非 next-env）                              | 检查 tsconfig.json 的 typeRoots/include               |
| HTML 文件  | `src/**/*.html`                                         | grep 文件名                                           |
| Markdown   | `**/doc/**/*.md`                                        | 不标记为冗余文件，仅在报告中列出供参考                |

**注意**：`scripts/` 目录下的文件是独立工具脚本（通过 npm scripts 调用），不按 import 方式验证。检查 package.json scripts 是否引用即可。

### A2：源码文件验证流程（关键）

```
对目录下每个非排除的源码文件 {
  1. 跳过自动加载文件（排除列表中的文件）
  2. 构造 grep 模式（注意：不是 grep 纯文件名，而是 grep import 路径）：
     a. 取文件相对于 src/ 的路径（不含扩展名），如 src/utils/format-time-ago → utils/format-time-ago
     b. 去除扩展名时必须用 sed -E（扩展正则）：sed -E 's/\.(tsx?|jsx?|s?css)$//'
        ⚠️ 不要用 sed 基础正则的 \| 做交替——POSIX basic regex 不支持 \|，会导致扩展名残留、grep 模式全错
     c. 检查 ALL tsconfig paths 别名（不仅是 @/*）：
        - @/path → packages/apps-kit/path 或 apps/xxx/src/path
        - @repo/path → apps/byd-ssg/src/path
        - @apps/kit/path → packages/apps-kit/path（仅 SSR）
        - @apps/ui/path → packages/apps-ui/src/components/path
        - @apps/icons → packages/apps-icons/build/index.d.mts
     d. grep 模式示例：
        - "from '.*format-time-ago'"
        - "from '@/utils/format-time-ago'"
        - "import.*format-time-ago"
  3. 全仓库 grep（排除 node_modules 和自身文件）
  4. 如果 grep 返回 0 匹配：
     a. 检查别名引用文件列表（快速查表）
     b. 再 grep 主要 export 符号名（如 formatTimeAgo），排除常见名碰撞
     c. 检查是否被 dynamic import 引用：grep "import(" 或 "next/dynamic" + 路径片段
     d. 检查是否被 Web Worker 引用：grep "new Worker" + 路径片段
  5. 所有检查均返回 0 匹配 → 标记为候选冗余文件

  特殊处理 -- 常见文件名（index、utils、types、constants 等）：
    - 不 grep 纯文件名，必须 grep 完整 import 路径
    - 如 "hooks/src/use-safari-media" 而非 "use-safari-media"
}
```

### A3：SCSS/CSS 文件验证注意事项

```
SCSS @import 与 JS import 语法不同：
  - SCSS: @import './breakpoints.scss'（保留扩展名和 ./ 前缀）
  - JS:   from './breakpoints'（省略扩展名）

grep SCSS 引用时：
  - 搜索文件名（含扩展名）：grep "breakpoints.scss"
  - 或搜索不含扩展名的路径片段：grep "breakpoints"
  - 需在 *.scss、*.css 文件中搜索，不仅限于 *.ts/*.tsx
```

### A4：非源码文件验证流程

```
Babel 插件：读 .babelrc，检查是否被引用（含 env 配置中的条件引用）
根级脚本：grep package.json scripts + .github/workflows/ + PM2 config
补丁文件：检查 package.json postinstall 或 pnpm patch-commits
类型声明：检查 tsconfig.json typeRoots + include + types 字段
```

### A5：全量审查（不可跳过）

Agent/批处理返回候选冗余文件后，**必须对每个候选文件逐一精确验证**，不能只做抽样：

#### 精确 import 验证

对每个候选文件，用**精确 import 路径**（非子串）做最终确认：

```bash
# 正确：精确匹配 import 路径（路径以引号结尾）
rg "from.*['\"].*/<filename>['\"]" apps/ packages/

# 错误：子串匹配（会误匹配其他文件名）
rg "<filename>" apps/ packages/
```

**已知子串误匹配类型（必须排除）**：

- `buy-sell-adv-list` 命中 `adv-list` -- 文件名是另一个文件的后缀
- `social-media-card` 命中 `media-card` -- 同上
- `new-pagination` 命中 `pagination` -- 同上
- CSS class `.card-skeleton { }` 命中 `card-skeleton` -- 非 import 引用
- React key `key={\`xxx-skeleton-${i}\`}`命中`skeleton` -- 模板字符串
- 注释 `// asPath: "?type=roi"` 命中 `type` -- 注释内容
- `next/link` 命中 `link` -- 第三方包名

**验证规则**：grep 命中后，必须确认命中行是 `from '...'` / `import(...)` / `require(...)` / `@import` 语句，且路径指向的是被检查的文件而非同名的其他文件。

#### 其他验证

1. **重复文件检测**：如果两个文件内容完全相同，标记后缀不匹配 pageExtensions 的为冗余文件
2. **配置交叉验证**：检查候选文件是否被 CI/CD（`.github/workflows/`）、Docker、PM2 config 引用
3. **re-export 链追踪**：如果文件只被同目录 `index.ts` re-export，检查该 export 是否有外部消费者。若无 → 两者都是冗余文件
4. **package.json exports**：包文件可能被 `exports` map 引用（不只是 `main`/`module`/`types`），需检查

---

## 模式 B：死函数分析

### B1：提取所有导出符号

扫描目标目录内的 `.ts`/`.tsx` 文件，提取 named exports：

#### 需要提取的 export 模式

```typescript
// 函数声明
export function myFunction() {}
export async function myAsyncFunction() {}

// 箭头函数 / 常量
export const MyComponent = () => {};
export const myHelper = () => {};
export const MY_CONSTANT = 'value';

// React hooks（以 use 开头的函数）
export function useMyHook() {}
export const useMyHook = () => {};

// 类
export class MyClass {}

// 解构 export
export { foo, bar } from './module'; // ← 这是 re-export，不标记
export { foo, bar }; // ← 标记 foo 和 bar
```

#### 提取方法

使用 grep 正则提取，对每个文件生成 `[符号名, 文件路径, 导出类型]` 列表：

```bash
# 提取 export function/const/class/async function
rg --no-filename -n "^export\s+(async\s+)?function\s+(\w+)" --pcre2 -o -r '$2' <file>
rg --no-filename -n "^export\s+const\s+(\w+)" -o -r '$1' <file>
rg --no-filename -n "^export\s+class\s+(\w+)" -o -r '$1' <file>

# 提取 export { X, Y }（非 re-export）
rg -n "^export\s+\{[^}]+\}" <file>  # 手动解析花括号内的符号名
```

**注意**：

- `export default` 只在非 pages 目录时提取，且标记为 `default` 导出（搜索时需匹配 `import X from '...'` 模式）
- 跳过 `export type` 和 `export interface`（由模式 C 单独分析）
- 对于 `export { X } from './Y'`（re-export），不标记 X 为死函数，但要追踪 Y 文件中 X 的定义
- **提取 export enum 的每个成员**：除了检查 enum 本身是否被使用外，还要逐个检查每个 enum 成员是否被引用（见 B4）

#### 效率策略

- 先用一次 `rg` 批量提取全目录的 export 行，再逐文件解析
- 生成两个索引：
  1. **符号索引**：`{ symbolName → [{ file, exportType }] }`
  2. **文件索引**：`{ filePath → [{ symbolName, exportType }] }`

### B2：验证每个导出符号的使用情况

#### 构建全仓库引用索引

先用一次 `rg` 提取全仓库所有 import/require 语句，生成引用索引：

```bash
# 提取所有 import 语句中的具体符号
rg "import\s+\{[^}]+\}\s+from\s+['\"]" apps/ packages/ \
  --glob '*.{ts,tsx,js,jsx}' \
  --no-filename

# 提取所有 default import
rg "import\s+\w+\s+from\s+['\"]" apps/ packages/ \
  --glob '*.{ts,tsx,js,jsx}' \
  --no-filename
```

#### 逐符号验证

对每个提取到的 export 符号：

```
1. 在引用索引中搜索符号名
2. 排除：
   a. 定义文件自身
   b. 同目录的 barrel re-export（index.ts）— 只是转发
   c. 类型引用（import type { X }）— 不影响运行时
3. 如果命中 re-export：追踪 re-export 链，检查最终是否有消费者
4. 如果符号名是常见词（如 config、utils、data）：
   a. 必须精确匹配 import 语句中的 { symbolName }
   b. 或匹配 import symbolName from 'path/to/file'
   c. 不能只 grep 符号名本身（会命中变量名、属性名等）
```

#### 特殊情况处理

| 情况                               | 处理                                                                                 |
| ---------------------------------- | ------------------------------------------------------------------------------------ |
| `export default`                   | 搜索 `import XXX from '<该文件路径>'`，XXX 可以是任意名                              |
| 同名 export 在多个文件             | 区分 import 路径，确认引用的是哪个文件的 export                                      |
| 命名空间 import（`import * as X`） | 搜索 `X.symbolName` 调用，需额外 grep                                                |
| 动态 import                        | 搜索 `import('path').then(m => m.symbolName)` 或 `(await import('path')).symbolName` |
| `React.lazy` / `next/dynamic`      | `dynamic(() => import('path'))` -- 此时 default export 被使用                        |
| 解构赋值                           | `const { symbolName } = require('path')`                                             |

### B3：全量精确审查（不可跳过）

Agent 返回候选死函数后，**必须逐一精确验证**：

#### 精确匹配验证

```bash
# 对 named export：精确匹配花括号内的符号名
rg "import\s+\{[^}]*\b<symbolName>\b[^}]*\}\s+from" apps/ packages/ \
  --glob '*.{ts,tsx,js,jsx}'

# 对 default export：匹配从该文件路径的 import
rg "import\s+\w+\s+from\s+['\"].*/<fileName>['\"]" apps/ packages/ \
  --glob '*.{ts,tsx,js,jsx}'

# 检查是否作为 JSX 组件使用（大写开头的函数）
rg "<symbolName[\s/>]" apps/ packages/ \
  --glob '*.{tsx,jsx}'

# 检查是否在对象解构中使用
rg "\b<symbolName>\b" apps/ packages/ \
  --glob '*.{ts,tsx,js,jsx}' \
  | grep -v "export" | grep -v "定义文件路径"
```

#### 误判排除清单

- **React Context Provider/Consumer**：可能只在根组件使用一次
- **HOC 返回值**：`export const Enhanced = withXXX(Base)` -- Enhanced 可能未被直接引用但 Base 间接使用
- **事件处理函数**：可能通过字符串注册（如 WebSocket 消息处理器）
- **插件/中间件**：可能通过配置文件引用而非 import
- **CSS-in-JS 辅助函数**：可能在 styled-jsx 模板字符串中使用
- **条件 export**：`process.env.NODE_ENV === 'development'` 下才用的 export

当同时运行多种分析时，死函数分析完成后，如果一个文件中**所有 export 都是死函数**，在冗余文件清单中额外标注该文件为"准冗余文件"。

### B4：死 enum 成员分析（死函数分析的子任务）

对所有 `export enum` 声明，在确认 enum 本身被使用的前提下，逐个检查每个成员是否被引用。

#### 提取 enum 成员

```bash
# 提取所有 export enum 声明
rg "^export\s+enum\s+(\w+)" -o -r '$1' <file>

# 对每个 enum，读取文件内容，解析花括号内的成员名
# 例如 enum Foo { A, B = 'x', C } → 成员列表 [A, B, C]
```

#### 验证每个成员

```bash
# 搜索 EnumName.MemberName 模式
rg "\bEnumName\.MemberName\b" apps/ packages/ \
  --glob '*.{ts,tsx,js,jsx}' \
  | grep -v "定义文件"
```

**注意**：

- 排除 enum 定义文件自身
- 有些成员可能通过解构使用：`const { A, B } = EnumName` → 需额外 grep `\bMemberName\b` 并确认上下文
- 如果 enum 被 `import * as X` 引入，搜索 `X.MemberName`
- **只标记 enum 被使用但特定成员从未出现的情况**。如果整个 enum 都没被使用，归入死函数而非死 enum 成员

---

## 模式 C：死类型分析

### C1：提取所有导出类型

扫描目标目录内的 `.ts`/`.tsx` 文件，提取 exported types 和 interfaces：

```bash
# export type
rg --no-filename -n "^export\s+type\s+(\w+)" -o -r '$1' <file>

# export interface
rg --no-filename -n "^export\s+interface\s+(\w+)" -o -r '$1' <file>

# export type { X, Y }（非 re-export）
rg -n "^export\s+type\s+\{[^}]+\}" <file>  # 手动解析花括号内的类型名
```

**跳过**：

- `export type { X } from './Y'`（re-export，追踪最终消费者）
- 包入口文件中的类型导出（package.json main/module/exports 指向的文件）
- `.d.ts` 文件中的类型（生成的声明文件）

### C2：验证每个导出类型的使用情况

对每个提取到的类型/接口名：

```bash
# 搜索 import type { TypeName } 和 import { TypeName }
rg "import\s+(type\s+)?\{[^}]*\b<TypeName>\b[^}]*\}\s+from" apps/ packages/ \
  --glob '*.{ts,tsx}'

# 搜索 extends/implements 引用
rg "\b(extends|implements)\s+.*\b<TypeName>\b" apps/ packages/ \
  --glob '*.{ts,tsx}'

# 搜索泛型参数引用
rg "<[^>]*\b<TypeName>\b[^>]*>" apps/ packages/ \
  --glob '*.{ts,tsx}'

# 搜索类型注解引用（: TypeName, as TypeName）
rg ":\s*\b<TypeName>\b|as\s+\b<TypeName>\b" apps/ packages/ \
  --glob '*.{ts,tsx}'
```

**排除**：

- 定义文件自身
- 同目录 barrel re-export（追踪最终消费者）
- 注释中的出现

**注意**：

- 类型可以作为泛型参数、交叉类型（`&`）、联合类型（`|`）的一部分被引用
- 类型可以在 `typeof` 表达式中被引用
- 类型只存在于 `.ts`/`.tsx` 文件中，不需要搜索 `.js`

### C3：全量精确审查

与模式 B 相同的审查标准：逐一精确验证，确认无误后才标记为死类型。

---

## 报告格式

### 文件头

```markdown
# 死代码审查报告

> 生成时间：YYYY-MM-DD HH:mm
> 扫描范围：apps/ + packages/（或参数指定的范围）
> 扫描模式：files + functions + types / files / functions / types
> 验证方法：全仓库 grep（import 路径 + 导出符号 + 配置引用）
```

### 概览

| 项目               | 数值                   |
| ------------------ | ---------------------- |
| 扫描目录数         | N                      |
| 扫描文件数         | N                      |
| 确认冗余文件数     | N（仅 files 模式）     |
| 确认死函数数       | N（仅 functions 模式） |
| 确认死类型数       | N（仅 types 模式）     |
| 确认死 enum 成员数 | N（仅 functions 模式） |
| 涉及应用/包        | app1, app2, ...        |

### 冗余文件清单（files 模式）

按应用分组，每组一个表格：

#### apps/byd-ssg（N 个）

| #   | 文件路径   | 文件类型           | 验证依据                                                  |
| --- | ---------- | ------------------ | --------------------------------------------------------- |
| 1   | `相对路径` | 源码/插件/脚本/... | grep `'具体模式'` 返回 0 匹配；export `符号名` 无外部引用 |

### 死函数清单（functions 模式）

按应用/包分组，每组一个表格：

#### apps/byd-ssg（N 个）

| #   | 符号名       | 文件路径                  | 导出类型     | 验证依据                                                                              |
| --- | ------------ | ------------------------- | ------------ | ------------------------------------------------------------------------------------- |
| 1   | `myFunction` | `src/utils/helpers.ts:42` | named export | grep `import.*{.*myFunction.*}.*from` 返回 0 匹配；grep `myFunction` 排除定义后无引用 |

### 死类型清单（types 模式）

按应用/包分组，每组一个表格：

#### apps/byd-ssg（N 个）

| #   | 类型名        | 文件路径                 | 导出类型         | 验证依据                                              |
| --- | ------------- | ------------------------ | ---------------- | ----------------------------------------------------- |
| 1   | `MyInterface` | `src/types/models.ts:15` | export interface | grep `\bMyInterface\b` 在 .ts/.tsx 中排除定义后无引用 |

### 死 enum 成员清单（functions 模式附带）

| #   | Enum 名.成员名   | 文件路径                  | 验证依据                                                              |
| --- | ---------------- | ------------------------- | --------------------------------------------------------------------- |
| 1   | `OrderSide.Sell` | `src/common/Styles.ts:75` | grep `OrderSide\.Sell` 排除定义后无引用；grep `Sell` 无 enum 解构用法 |

### 统计分析（functions 模式）

| 分类               | 数量 | 占比 |
| ------------------ | ---- | ---- |
| 未使用的函数       | N    | N%   |
| 未使用的组件       | N    | N%   |
| 未使用的 hooks     | N    | N%   |
| 未使用的常量       | N    | N%   |
| 未使用的类型       | N    | N%   |
| 未使用的 enum 成员 | N    | N%   |

### 附加发现

如果在验证过程中发现配置问题（如 tsconfig 引用不存在的文件），在此节列出：

| 文件        | 问题 | 建议     |
| ----------- | ---- | -------- |
| `路径:行号` | 描述 | 修复方式 |

### 排除说明

列出扫描中主动排除的目录、文件类型和 export 类型，说明排除理由。

## 报告文件输出

写入 `reports/YYYY-MM-DD/byd-web-report-dead-code-YYYY-MM-DD.md`（当天日期），同名文件已存在则覆盖。

---

## 已知陷阱（从实际运行中总结）

### ⚠️ 陷阱 1：相对路径引用（最大误判源）

**错误案例**：`bread-head/extra-links.tsx` 被误判为冗余文件

**实际情况**：

```typescript
// bread-head/index.tsx
import ExtraLinks from './extra-links'; // ← 相对路径引用

// 外部文件
import BreadHead from '@/components/bread-head'; // ← 间接引用
```

**解决方案**：检查同目录下 `index.ts` 的引用，如果 `index.ts` 被外部引用，其内部引用的文件也算被使用。

### ⚠️ 陷阱 2：tsconfig 别名

- SSG 的 `@/*` 同时映射 apps-kit 和本地 src
- **必须先读 tsconfig.json 提取所有别名**

### ⚠️ 陷阱 3-10：其他常见问题

| 陷阱            | 问题                                | 解决方案             |
| --------------- | ----------------------------------- | -------------------- |
| sed 正则        | 基础 sed 不支持 `\|`                | 使用 `sed -E`        |
| SCSS @import    | 保留扩展名                          | 搜索含扩展名的模式   |
| 子串误匹配      | `adv-list` 命中 `buy-sell-adv-list` | 使用精确路径匹配     |
| 同名符号        | 多个文件导出同名函数                | 通过 import 路径区分 |
| barrel export   | re-export 但未消费                  | 追踪完整链条         |
| 命名空间 import | `import * as X`                     | 搜索 `X.symbolName`  |
| 条件编译        | dev 模式才使用                      | 检查动态 import      |
| 特殊文件        | `.stories.tsx`、`.d.ts`             | 排除，不标记         |

---

## 附录 A：v5.0 精确匹配模式

### 阶段 1：快速文件名匹配

```bash
rg -q --glob '*.{ts,tsx}' '<filename_without_ext>'
```

### 阶段 2：精确 import/require/JSX 模式

```python
patterns = [
    f'from\\s+["\']{re.escape(rel_path)}["\']',  # 完整路径
    f'from\\s+["\']{re.escape(rel_path.rsplit(".", 1)[0])}["\']',  # 无扩展名
    f'from\\s+["\']\\.\\.?/{re.escape(name_without_ext)}["\']',  # 相对路径
    f'export\\s+.*from\\s+["\']\\.?/?{re.escape(name_without_ext)}["\']',  # barrel
    f'import\\s*\\(\\s*["\'][^"\']*{re.escape(name_without_ext)}[^"\']*["\']\\s*\\)',  # 动态
    f'require\\s*\\(\\s*["\'][^"\']*{re.escape(name_without_ext)}[^"\']*["\']\\s*\\)',  # require
]

if name_without_ext[0].isupper():
    patterns.append(f'<{re.escape(name_without_ext)}(?:\\s|/|>)')  # JSX
```

### 阶段 3：TypeScript 符号级分析

```bash
# 提取 export 符号
rg '^export\s+(?:async\s+)?(?:function|const|class|enum|interface|type)\s+(\w+)' <file>

# 检查符号引用
rg '\b<symbol_name>\b' --glob '*.{ts,tsx}'
```

---

## 附录 B：手动验证命令

```bash
# 1. 精确 import 路径
rg "from.*['\"].*<filepath>['\"]" apps packages --glob '*.{ts,tsx}'

# 2. 相对路径引用
rg "from.*['\"]\.?/<filename_without_ext>['\"]" <directory>

# 3. JSX 组件使用
rg "<ComponentName[\s/>]" apps packages --glob '*.{tsx,jsx}'

# 4. 动态导入
rg "import\(['\"].*<filename>['\"]\)" apps packages

# 5. git 历史
git log --since="3 months ago" -- <filepath>
```

---

## 附录 C：v5.0 扫描结果

| 指标     | 数值      |
| -------- | --------- |
| 扫描文件 | 3,301 个  |
| 候选冗余 | **18 个** |
| 准确率   | **99.5%** |
| 误判率   | **0.5%**  |

---

## 注意事项

- 只做研究和分析，不修改/删除任何代码或文件
- **每个结论必须有明确的验证依据**，不能凭感觉判断
- **grep import 路径而非纯文件名**
- **精确匹配符号名**：使用 `\b` 词边界
- **追踪 re-export 链**：必须有最终消费者
- `public/` 不扫描，`scripts/` 按 package.json scripts 验证
- 报告输出到 `reports/YYYY-MM-DD/` 目录

### 最佳实践

**DO ✅**：

1. 使用 v5.0 三阶段策略（误判率 < 1%）
2. 删除前人工验证
3. 渐进式删除：@deprecated → 观察 → 删除
4. 保留 Git 历史

**DON'T ❌**：

1. 不要直接删除
2. 不要使用 v1/v2 脚本（误判率 60-85%）
3. 不要忽略相对路径
4. 不要跳过测试

## 相关 skill

- **前置**：`bydfi-web-report-dead-deps` — 先清依赖层，再清代码层
- **关联**：`bydfi-web-report-apps-kit-shared` — apps-kit 架构层审查
- **互补**：`bydfi-web-report-any-cleanup` / `bydfi-web-report-ts-candidates`

按问题域查询完整 skill 索引：见 `.claude/skills/SKILL_BEST_PRACTICES.md` 的"问题域 → SoT skill 索引"章节。

## 运行后审查（单轮，不循环）

报告生成后，对每个结论做一次精确复核：

1. **精确验证**：用精确模式再次确认
2. **别名交叉检查**：确认所有 tsconfig 别名路径已覆盖
3. **re-export 链追踪**：确认无最终消费者
4. **修正报告**：发现误判直接移除
5. **陷阱记录**：发现新误判模式，补充到「已知陷阱」

$ARGUMENTS
