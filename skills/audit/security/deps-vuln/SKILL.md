---
name: bydfi-audit-security-deps-vuln
description: bydfi-web 项目依赖安全漏洞扫描。对所有 package.json 运行 npm audit，找出已知漏洞并生成安全报告，输出到 reports/。 支持 $ARGUMENTS scope: ssg/ssr/core/components。
disable-model-invocation: true
allowed-tools: Bash, Read, Write, Glob, Grep
---

审查当前项目所有 package.json 中声明的依赖包是否存在已知安全漏洞，输出报告并保存到文件。**已脚本化**（解析 `pnpm audit --json` 输出；**半 deterministic**，因漏洞数据源自 npm registry 实时数据）。

## 调用方式

```bash
mkdir -p reports/$(date +%Y-%m-%d)
node .claude/skills/audit/security/deps-vuln/scripts/audit.mjs \
  > reports/$(date +%Y-%m-%d)/byd-audit-security-deps-vuln-$(date +%Y-%m-%d).md
```

## 输出位置

`reports/YYYY-MM-DD/byd-audit-security-deps-vuln-YYYY-MM-DD.md`（reports/ 已 gitignore）

## 已固化的脚本逻辑

- 显式 `--registry https://registry.npmjs.org`（绕过项目 `.npmrc` 默认 npmmirror 不支持 audit）
- 解析 npm audit v1 格式：`advisories` + `metadata.vulnerabilities`
- 按严重程度（critical / high / moderate / low）排序展开
- 跨包关联：`findings[*].paths` 首段（`packages__apps-kit>...`）映射回 workspace 名
- 修复建议表（按严重优先级）+ 标注 deps / devDeps 类型

## Cross-check 锚点

`advisories` 条目数 vs `metadata.vulnerabilities` 总和。两者通常相等；若不等说明同一漏洞影响多版本（脚本会在"准确性核验"标注）。

## 半 deterministic 说明

- 输入 = 本地 `package.json` + `pnpm-lock.yaml`（deterministic）+ npm registry 漏洞数据（实时，非 deterministic）
- 同一时刻跑两次结果一致；跨天可能出现新漏洞或既有漏洞补丁更新

下方 SKILL.md 现有"执行方式 / 报告格式 / 失败降级"为脚本逻辑的详细说明。

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

## 执行方式

在使用本命令前，请确保当前工作目录为仓库根目录（包含根 `package.json` 的目录）。

1. **发现所有 package.json**：用 Glob 扫描 `**/package.json`（排除 node_modules）
2. **运行审计**：在项目根目录执行 `pnpm audit --json --registry https://registry.npmjs.org` 获取漏洞数据（必须指定官方 registry，项目默认 npmmirror 不支持 audit 端点）
3. **分析结果**：解析审计输出，按严重程度分类（critical / high / moderate / low）
4. **跨包关联**：遍历 `advisories[*].findings` 的**所有** paths，取每条路径首段作为 workspace 名，汇总去重后标注是 dependencies 还是 devDependencies；不能只取首条 path，否则会漏报 workspace（见「已知陷阱」）
5. **确保输出目录**：执行 `mkdir -p reports` 确保目录存在
6. **输出报告**（终端展示 + 写入文件）；JSON 解析由 Claude 直接读取文本完成，不依赖 `jq`

## 报告格式

### 概览（表格）

使用 **简洁表格** 汇总整体情况，每行一条统计数据，不写长段落说明。例如：

| 项目              | 数量 |
| ----------------- | ---- |
| package.json 数量 | n    |
| 总依赖数          | n    |
| 总漏洞数          | n    |
| critical          | n    |
| high              | n    |
| moderate          | n    |
| low               | n    |

### 漏洞详情（按严重程度降序，表格展示）

按「包 + 严重程度」聚合，用表格记录**简要且精准**的信息，每行一条记录，字段控制在少量关键项，不写冗长描述。示例字段：

| 包名       | 当前版本 | 严重程度 | 修复版本 | 受影响 workspace / 依赖类型 | 建议     |
| ---------- | -------- | -------- | -------- | --------------------------- | -------- |
| <package>  | x.y.z    | high     | >= a.b.c | apps-kit (dependencies)     | 升级     |
| <package2> | x.y.z    | critical | -        | bydfi-ssg (devDependencies) | 手动评估 |

说明：

- 同一包有多个漏洞时，可合并为一行，仅保留「最高严重程度」与「最保守修复版本」。
- 「建议」列用极短语句表达：如「升级」「替换」「手动评估」「暂缓」等。

### 修复建议（表格）

再用一张表格列出具体操作建议，便于复制命令，控制说明长度。例如：

| 优先级 | 包名      | 建议操作           | 命令示例                | 备注       |
| ------ | --------- | ------------------ | ----------------------- | ---------- |
| 高     | express   | 升级到安全版本     | `pnpm update express`   | 影响 SSR   |
| 中     | immutable | 构建链路可一并升级 | `pnpm update immutable` | 仅构建使用 |

devDependencies 中的漏洞可统一在「备注」中标注为低优先级（不直接影响生产运行时）。

## 报告文件输出

写入 `reports/YYYY-MM-DD/byd-audit-security-deps-vuln-YYYY-MM-DD.md`（当天日期），同名文件已存在则覆盖。

文件开头包含：

```markdown
# 依赖漏洞审计报告

> 生成时间：YYYY-MM-DD HH:mm
> 审计工具：pnpm audit
```

## 已知陷阱

- **npmmirror 不支持 audit**：本项目 `.npmrc` 默认使用 `registry.npmmirror.com`，该镜像不支持 audit 端点，会报 `ERR_PNPM_AUDIT_ENDPOINT_NOT_EXISTS`。需加 `--registry https://registry.npmjs.org` 参数绕过，命令改为：`pnpm audit --json --registry https://registry.npmjs.org`
- **pnpm audit 输出为 npm audit v1 格式**：`pnpm audit --json` 输出的是旧版 npm audit 格式，漏洞数据在 `advisories` 字段，汇总数据在 `metadata.vulnerabilities`，**不存在** `vulnerabilities` 顶层字段（v2 格式）。解析时须使用 `advisories` + `metadata.vulnerabilities`，否则会误判为"零漏洞"。
- **受影响 workspace 容易漏报**：`advisories[*].findings[*].paths` 是完整依赖链路（如 `apps__bydfi-ssg>axios`），取首段即为受影响的 workspace。但同一个漏洞可能出现在多个 workspace，必须遍历 **所有** findings 的 **所有** paths，不能只取第一条；否则会漏掉部分 workspace（如只显示 bydfi-ssg 而漏掉 bydfi-ssr）。

## 失败降级

| 情况                                                 | 降级方案                                                          |
| ---------------------------------------------------- | ----------------------------------------------------------------- |
| `pnpm audit --json` 返回非 0 退出码但有 JSON 输出    | 正常解析（pnpm audit 发现漏洞时退出码非 0 是预期行为）            |
| `pnpm audit --json` 输出非 JSON                      | 改用 `pnpm audit`（非 JSON 模式）并手动解析文本输出               |
| `pnpm audit` 报 `ERR_PNPM_AUDIT_ENDPOINT_NOT_EXISTS` | 加 `--registry https://registry.npmjs.org` 重试（见「已知陷阱」） |
| 上述均失败                                           | 回退到 `npm audit --json`，或提示用户检查网络/registry 配置       |

## 注意事项

- 重点关注 dependencies（生产依赖），devDependencies 漏洞单独标注优先级
- 对 monorepo 中的 workspace 内部包（如 apps-kit、apps-ui），在分析 `pnpm audit` 路径时将其视为自身代码，只关注其中引用的第三方包（如 axios、next 等）
- 报告文件输出到 `reports/YYYY-MM-DD/` 日期子目录，输出前先 `mkdir -p reports/YYYY-MM-DD/`，已在 `.gitignore` 中忽略

## 相关 skill

- **关联**：`bydfi-web-report-dead-deps` — 死依赖无须修漏洞，先清再查
- **互补**：`bydfi-web-report-version-inconsistency` — 版本不一致可能影响漏洞修复路径

按问题域查询完整 skill 索引：见 `.claude/skills/SKILL_BEST_PRACTICES.md` 的"问题域 → SoT skill 索引"章节。

## 运行后审查（单轮，不循环）

报告生成后，对每条结论做一次精确复核：

1. **数据验证**：抽查报告中的漏洞数量、严重程度是否与 `pnpm audit` 原始输出一致
2. **结论复核**：对每条修复建议，确认包名、版本号、受影响的 workspace 准确无误
3. **修正报告**：发现错误直接修正报告文件，不生成新版本
4. **陷阱记录**：如果发现新的误判模式，在终端输出提示用户将其补充到本 skill 的「已知陷阱」中
