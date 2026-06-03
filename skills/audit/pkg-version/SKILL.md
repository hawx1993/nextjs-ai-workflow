---
name: bydfi-audit-pkg-version
description: 扫描所有 package.json，找出相同依赖但版本不一致的包，生成报告 支持 $ARGUMENTS scope: ssg/ssr/core/components。
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

扫描 monorepo 中所有 package.json 的 dependencies、devDependencies 和 peerDependencies，找出同一个包在不同位置声明了不同版本的情况，生成 Markdown 报告到 `reports/YYYY-MM-DD/`。

## 调用方式

```bash
mkdir -p reports/$(date +%Y-%m-%d)
node .claude/skills/audit/pkg-version/scripts/audit.mjs \
  > reports/$(date +%Y-%m-%d)/byd-audit-pkg-version-$(date +%Y-%m-%d).md
```

## 输出位置

`reports/YYYY-MM-DD/byd-audit-pkg-version-YYYY-MM-DD.md`（reports/ 已 gitignore）

## 判定规则（已固化，勿动）

- 扫描所有 package.json（排除 node_modules / .next / out / out-rtl / dist / build / .git / .turbo）
- 包名分组：`{ 包名 → { 版本 → [{ 声明位置, dep 类型 }] } }`
- 跳过 `workspace:*` 协议的内部包（不影响本脚本，因为 workspace 包版本不会跨文件重复）
- 同一包名出现两个及以上不同版本 → 版本不一致
- 按 dependencies / devDependencies / peerDependencies 分类报告

## 扫描覆盖

| 项       | 配置                                                                                  |
| -------- | ------------------------------------------------------------------------------------- |
| 扫描根   | `<repo-root>`（脚本启动时由 `git rev-parse --show-toplevel` 自动定位，整个 monorepo） |
| 跳过目录 | node_modules / .next / out / out-rtl / dist / build / .git / .turbo                   |
| 目标文件 | `package.json`（精确匹配文件名）                                                      |

## 已知陷阱

### 1. `^X.Y.Z` vs `X.Y.A` 分类必须程序化判断，不能凭直觉

`^8.0.3` 看起来像是 `8.0.0` 的范围写法，但实际上 `^8.0.3` 最低版本是 8.0.3 > 8.0.0，这是**真实版本冲突**而非写法不一致。人工分类容易在这里犯错，必须用代码比较去掉前缀后的版本号大小。

### 2. `^` 不等于精确版本

`^10.4.20` 和 `10.4.20` 虽然范围包含精确值，但下次 `pnpm install` 时 `^` 版本可能升级到 10.4.21+。必须用 `pnpm ls` 确认当前实际解析版本。

### 3. save-prefix 规范

本项目 `.npmrc` 设了 `save-prefix=""`（精确版本锁定）。使用 `^` 前缀的声明违反此规范，通常来自上游 fork（apps-base-kline）或独立 demo 项目。

### 4. 死依赖中的版本冲突不重要

如果某个版本冲突的包已被确认为死依赖（参见 `bydfi-web-report-dead-deps` skill），标注为低风险即可。

### 5. peerDependency 版本约束

某些包的版本被其他包的 peerDependency 约束。例如 `apexcharts` 的版本必须满足 `react-apexcharts` 的 peer 要求。升级时需检查 peer 约束。

### 6. React/Next.js 版本分裂是最高风险

React 和 Next.js 如果存在多个版本实例，会导致 hooks 报错（"Invalid hook call"）、Context 丢失等难以排查的运行时 bug。发现此类冲突必须标注为高风险。

## Cross-check 锚点

脚本内置 1 个 sanity check，每次跑都验证主统计的关键数字。任一锚点不一致表示规则有 regression，必须先修脚本再发报告。

| 锚点                   | 验证方式                                                                     |
| ---------------------- | ---------------------------------------------------------------------------- |
| 扫描的 package.json 数 | `countPkgJsons()` 与 `find ... -name "package.json" \| wc -l` 对比，期望相同 |

独立验证命令（在仓库根目录执行）：

```bash
find "$(git rev-parse --show-toplevel)" -name "package.json" \
  -not -path "*/node_modules/*" -not -path "*/.next/*" \
  -not -path "*/out*/*" -not -path "*/dist/*" \
  -not -path "*/build/*" -not -path "*/.git/*" \
  -not -path "*/.turbo/*" | wc -l
```

## 触发场景

- 新增/升级依赖后（`pnpm add`/`pnpm up`）检查版本一致性
- PR 合并前确认跨 workspace 无版本分裂
- 定期审查（建议每月一次）

## 注意事项

- 只做分析，不修改任何文件
- 每个结论必须有明确依据
- 报告文件输出到 `reports/YYYY-MM-DD/` 日期子目录，输出前先 `mkdir -p reports/YYYY-MM-DD/`
- 脚本是唯一信息源，禁止手工调整数字

## 相关 skill

- **关联**：`bydfi-web-report-dead-deps` — 清完死依赖再校验版本一致性
- **互补**：`bydfi-audit-security-deps-vuln` — 版本一致后检查已知漏洞

按问题域查询完整 skill 索引：见 `.claude/skills/SKILL_BEST_PRACTICES.md` 的"问题域 → SoT skill 索引"章节。

$ARGUMENTS
