---
name: bydfi-audit-shared-apps-kit
description: 审计 packages/apps-kit 各模块在 SSG/SSR 三个 app 的共享情况，识别单 app 独占、死代码、耦合泄漏。生成可分享的 markdown 报告，含 git 分支/commit、关键发现、自检 sanity check 与完整数据表。 支持 $ARGUMENTS scope: ssg/ssr/core/components。
disable-model-invocation: true
allowed-tools: Bash, Read, Write
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

通过静态扫描 import 路径，量化 `packages/apps-kit` 各模块（components/<name>、core/<name>、core/store/src/<\*>）被三个 app 直接引用的分布，输出 markdown 数据报告。所有判定规则、扫描范围、归类逻辑已固化在同目录 `scripts/audit.mjs`，**禁止手工调整数字**——脚本是唯一信息源，避免跨次口径漂移。

## 调用方式

```bash
mkdir -p reports/$(date +%Y-%m-%d)
node .claude/skills/audit/shared/apps-kit/scripts/audit.mjs \
  > reports/$(date +%Y-%m-%d)/byd-audit-shared-apps-kit-$(date +%Y-%m-%d).md
```

报告自动包含：

- 当前 git 分支、commit short hash、工作树状态、最近一次 commit message
- 关键发现（共享率、耦合泄漏锚点、死代码清单、单 app 独占清单）— 全部从扫描数据自动计算
- 准确性核验（脚本内独立 cross-check，与主统计对比 7 个锚点的文件数）
- 完整数据表（Components 104 行、Core 12 行、Core/Store 18 行）
- 汇总（按判定分类的占比）

## 输出位置

`reports/YYYY-MM-DD/byd-web-report-apps-kit-shared-YYYY-MM-DD.md`（reports/ 已 gitignore，可分享给团队但不入库）。

## 判定规则（已固化，勿动）

| 规则                     | 内容                                                                                                |
| ------------------------ | --------------------------------------------------------------------------------------------------- |
| 引用计数                 | 文件级 distinct——一个文件多次 import 同一模块算 1 次                                                |
| 单位粒度                 | components/<name>（含 zendesk.tsx 文件）、core/<name>、core/store/src/<sub>（含顶层 .ts/.tsx 文件） |
| 多目标归类               | 一次 `@/core/store/src/resso` 同时记入 `core/store` 和 `core-store/resso`，两边都计 1 个文件        |
| 死代码判定               | 0 app + 0 内部 + 0 包间 = 全网零引用                                                                |
| 仅内部判定               | 0 app + (内部 > 0 或 包间 > 0)                                                                      |
| 单 app 独占 (确证)       | 1 app + apps-kit 内部 0 引用                                                                        |
| 单 app 独占 (有内部链路) | 1 app + apps-kit 内部 > 0 — 可能通过内部链路被其他 app 间接使用                                     |
| 多 app 共享              | 2 或 3 个 app 直接引用                                                                              |

## 覆盖的 import 形式

| 形式                          | 来源                                                | 归类                                  |
| ----------------------------- | --------------------------------------------------- | ------------------------------------- |
| `@apps/kit/components/<name>` | SSR 显式别名                                        | components/<name>                     |
| `@apps/kit/core/<name>`       | SSR 显式别名                                        | core/<name>                           |
| `@/components/<name>`         | 三 app 共有，SSG/SSR 同名时 webpack 优先 apps-kit   | components/<name>                     |
| `@/core/<name>`               | 三 app 共有                                         | core/<name>                           |
| `@/core/api`、`@/core/api/*`  | 专项 alias → core/network/src/api                   | core/network                          |
| `@/core/resso`                | 专项 alias → core/store/src/resso                   | core/store + core-store/resso         |
| `@/core/local-storage`        | 专项 alias → core/store/src/local-storage           | core/store + core-store/local-storage |
| `@/core/account/utils`        | 专项 alias → core/shared/src/account/utils          | core/shared                           |
| `react-copy-to-clipboard`     | NPM 风格 alias → components/react-copy-to-clipboard | components/react-copy-to-clipboard    |

## 扫描覆盖

- **根目录**:
  - `apps/byd-ssg/` `apps/byd-ssr/` (整个 app 目录，含 middleware.ts、sentry.\*.ts、src/)
  - `packages/apps-ui/` `packages/apps-base-kline/` `packages/apps-icons/` `packages/nex-theme/`
  - `packages/apps-kit/` 自身（用于统计内部链路）
- **跳过目录**: `node_modules` `.next` `out` `out-rtl` `dist` `build` `.git` `.turbo` `scripts` `plugin`
- **跳过文件**: `next.config.*` `postcss.config.*` `pm2-*.config.*` `analyze.js` `server.js` `sentry.*.config.js`
- **扫描扩展名**: `.ts` `.tsx` `.mjs` `.js` `.jsx`（含 trading-view 等 vendored 库）

## 已知陷阱（v1→v3 迭代沉淀）

### 1. 4 类专项 alias 必须独立映射，不能用通用规则

`@/core/api`、`@/core/resso`、`@/core/local-storage`、`@/core/account/utils` 这 4 个 tsconfig path 别名指向的是 apps-kit 内部更深的子目录（`core/network/src/api` 等），不是 `core/api` 这种顶层目录。**不做特殊归类的话这些 import 会被错归到不存在的伪目录后丢弃**——v1 在此漏报了 800+ 个文件级引用。

每个 app 的 tsconfig 的 paths 段都包含这些专项 alias，修改 tsconfig 时需同步更新 `scripts/audit.mjs` 的 `normalize()` 函数。

### 2. NPM 风格 alias 容易完全漏抓

`react-copy-to-clipboard` 这种伪装成 npm 包名的别名（实际指向 `components/react-copy-to-clipboard/index.tsx`）在 `import` 语法上看不出是 alias。脚本必须显式枚举此类别名。**v1 完全没抓到 71 个引用文件**。

如果以后新增此类 NPM 风格 alias（在某个 tsconfig.json 的 `paths` 字段中能看到），必须同步加到 `SCAN_RE` 和 `normalize()`。

### 3. 多目标归类

一个 import 可能对应多个统计目标。例如 `from '@/core/store/src/resso'` 既是 `core/store` 的引用，也是 `core-store/resso` 的引用，**两边都要 +1**。否则 core/store 表会低估、core-store 子模块表会断链。

### 4. 必须扫 .js/.jsx，但跳过根级配置文件

apps-kit 内 vendored TradingView library（`components/chart/k-chart/lib/trading-view/library/*.js`）是真实业务依赖，含 alias import 的 `.js` 文件不能漏扫。但 app 根级 `next.config.js`、`server.js` 等是 build/runtime 配置噪音，需通过 `SKIP_FILE_PATTERNS` 排除。

### 5. SSG/SSR 的 `@/*` 同名歧义

SSG/SSR 的 `@/*` 同时映射到 `apps-kit/*` 和本地 `src/*`。同名时 webpack 按 paths 数组顺序优先 apps-kit。**报告中"同名冲突"列已标注哪些组件名在本地 src/components 也存在**——同名情况下小概率会指向本地，需人工 spot check。

### 6. apps-kit 内部相对路径未抓

apps-kit 内部多用相对路径 (`./foo`、`../bar`) 互相 import，脚本只抓 `@apps/kit/*` 和 `@/*` 形式。**这只影响 `kit-self` 列下限**（实际内部链路可能比统计的更多），对 app 列无影响。判定为"独占（有内部链路）"时是基于已抓到的内部引用，未抓到的相对路径不会让结果从"独占"变成"共享"。

### 7. 未抓: 动态 import / require / 字符串拼接 / 模板字符串

`import('@/foo')`、`require('@/foo')`、`` `@/${name}` `` 形式的引用未抓。这部分通常很少且需人工补查。

## Cross-check 锚点

脚本内置 7 个 sanity check 锚点，每次跑都会用独立 grep 逻辑（与主 SCAN_RE + normalize 路径分开）验证主统计的关键数字。**全部一致才能交付**。任一锚点出现 `✗ 不一致` 表示规则有 regression，必须先修脚本再发报告。

锚点选取原则：

- 覆盖所有归类分支（普通 alias / 专项 alias / NPM 风格 alias / 多目标归类）
- 包括典型的"高引用模块"和"零引用模块"
- 包括"app 直接引用"和"apps-kit 内部引用"两种场景

## 与 git 状态的关系

报告头部记录扫描时的 git 分支、commit short hash、工作树状态。**工作树 dirty 时跑出的报告不可作为团队基线**，因为本地未提交改动会影响扫描结果。建议：

- 干净工作树 + 已合入 main 的 commit 上跑，结果可作为团队基线
- 比对两次跑的报告，应字节级一致（除统计日期）

## 触发场景

- 用户问 "apps-kit 哪些模块单 app 独占" / "apps-kit 共享情况" / "apps-kit 死代码"
- 季度技术债盘点
- 重构规划前的现状调查
- PR review 时怀疑某 alias 漏归

## 注意事项

- 报告内任何数字都必须来自脚本输出，**禁止人工修改表格**——发现数字异常先修脚本（更新 `normalize()` 或 `SCAN_RE`）再重跑
- `reports/` 已 gitignore，发给团队前可考虑导出为 PDF（用 ls-pdf skill）
- 数字解读 (e.g. "为什么 trade-ui-temp 是 SSG 独占") 不属于本 skill 范畴，需另行人工分析

## 相关 skill

- **关联**：`bydfi-audit-dead-code` — apps-kit 内部死代码审查
- **互补**：`bydfi-audit-tree-shaking` — 共享包树摇分析

按问题域查询完整 skill 索引：见 `.claude/skills/SKILL_BEST_PRACTICES.md` 的"问题域 → SoT skill 索引"章节。
