---
name: bydfi-audit-security-deep-security
description: bydfi-web 深度安全审查。按固定 scope + 判定规则扫描凭据泄露、XSS、postMessage、CSP/安全头、依赖漏洞等 13 个维度，仅输出 100% 确认结论，附可利用性实测与误判防护清单，输出到 reports/YYYY-MM-DD/。 支持 $ARGUMENTS scope: ssg/ssr/core/components。
disable-model-invocation: true
allowed-tools: Bash, Read, Write, Glob, Grep
---

## 规则版本

- **version**: 1.0.0（2026-04-22 首版，基线报告 `reports/2026-04-21/security-review.md`）
- **判定原则**：只输出 100% 确认结论。**事实 100% + 影响 100%** 才列入；影响依赖外部信息的用"最坏情况 + 需核实" 限定，不假设。
- **禁止**："疑似 / 建议检查 / 可能 / 或许" 等模糊词；数据流推断不完整的不列入。

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

## Scope Manifest（受 $ARGUMENTS 限定，禁止 agent 自由伸缩）

### 包含

- `apps/byd-ssg/{src,plugin,scripts,middleware.ts,next.config.js,server.js,.env,.env.development,.babelrc}`
- `apps/byd-ssr/{src,plugin,middleware.ts,next.config.js,server.js,.env,.babelrc}`
- `packages/{apps-kit,apps-ui,apps-icons,apps-base-kline,nex-theme}/{src,components,core}`
- 根目录：`.npmrc`、`package.json`、`pnpm-lock.yaml`、`.gitignore`

### 排除（glob）

```
!**/node_modules/**
!**/.next/**
!**/out/**
!**/out-rtl/**
!**/dist/**
!**/build/**
!**/coverage/**
!**/storybook-static/**
!**/lib/**
!**/charting_library/**
!**/sensorsdata*.min.js
!**/shence*.min.js
!**/twitter-widgets.js
!**/telegram.js
!**/*.min.js
!**/*.svg
```

## 扫描维度（13 项，每项独立）

每项包含 4 段：**grep pattern** / **判定规则** / **必须独立验证的点** / **常见误判**。

### D1. 硬编码凭据（CRITICAL 若确认）

**pattern**：

```
rg -n 'ghp_[A-Za-z0-9]{30,}|gho_[A-Za-z0-9]{30,}|ghu_[A-Za-z0-9]{30,}|ghs_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{70,}'
rg -n 'AKIA[0-9A-Z]{16}|ASIA[0-9A-Z]{16}'
rg -n 'sk-ant-[A-Za-z0-9\-]{20,}|sk-[A-Za-z0-9]{40,}'
rg -n 'sk_live_[A-Za-z0-9]{20,}|rk_live_[A-Za-z0-9]{20,}'
rg -n 'xox[baprs]-[A-Za-z0-9\-]+'
rg -n -- '-----BEGIN [A-Z ]*PRIVATE KEY-----'
rg -n 'sntrys_[A-Za-z0-9_]+|sntryu_[A-Za-z0-9_]+'
# 通用：.env / .npmrc 中 token/auth/secret 且值长度 >= 20 的
git ls-files | grep -E '\.(env|npmrc)($|\.)' | xargs -I{} sh -c 'echo === {} ===; cat {}'
```

**判定**：

- 匹配已知服务的 token 前缀 + 格式长度校验 → **CRITICAL 事实层**
- `.env` / `.npmrc` 中变量名含 `TOKEN|SECRET|AUTH|KEY` 且 value 非 `NEXT_PUBLIC_*` 公开常量 → **CRITICAL**
- `NEXT_PUBLIC_*` 变量值（OAuth client id、site verification 等）→ 公开设计，不列入

**必须独立验证**：

- `git ls-files <file>` 确认是否被跟踪
- `git log -- <file>` 确认首次提交
- Token 格式长度与前缀匹配对应服务（如 ghp\_ 后必须 36 字符）

**常见误判**：

- Firebase `apiKey: AIzaSy...`：Google 官方文档明确 Web apiKey 是公开识别符，非秘密。**不列入**。
- 第三方带域名限制的 publishable key（如 FingerprintJS、Kakao JavaScript key）：不列入，但需记录防复审重复发现。

### D2. eval / new Function 动态执行（HIGH 若执行本地内容）

**pattern**：

```
rg -n '\beval\s*\(|new Function\s*\(' --type-add 'code:*.{ts,tsx,js,jsx,mjs,cjs}' -tcode \
  --glob '!**/charting_library/**' --glob '!**/*.min.js'
```

**判定**：

- 对 `fs.readFileSync` / 网络响应 / postMessage / URL 参数等内容调用 `eval` / `new Function` → **HIGH（供应链/动态 RCE 风险）**
- 对字面量常量调用（罕见）→ 不列入

**必须独立验证**：读完整函数上下文，确认输入来源。

### D3. dangerouslySetInnerHTML XSS 完整链（CRITICAL 若完整链路成立）

**pattern**：

```
rg -n 'dangerouslySetInnerHTML' --type-add 'code:*.{ts,tsx}' -tcode \
  --glob '!**/charting_library/**'
```

**判定**（必须 100% 追溯完整链才列入）：

1. 找 `dangerouslySetInnerHTML={{ __html: X }}`
2. 追溯 `X` 的数据来源
3. 如果来源是：**URL 参数 / postMessage / localStorage / 未清洁的后端 API 响应 / 未清洁的第三方数据** → 可疑
4. 检查是否有 sanitize（DOMPurify、自定义过滤）——**必须读 sanitize 函数实现**，确认不是空操作
5. 数据流完整闭合 + sanitize 确认无效 → **CRITICAL**

**必须独立验证**：

- 打开每个 sanitize 函数读实现（常见陷阱：函数名叫 sanitize 但内部是 `return input` 或所有过滤被注释）
- 对 postMessage 来源的 XSS，还需验证 message handler 是否有 `event.origin` 校验

**常见误判**：

- 来源是常量（i18n 字符串、schemaData JSON.stringify 等）→ **不列入**
- `stripHTMLTags(item.content)` 等：必须读函数实现确认是否真做 HTML 清洁

### D4. postMessage handler origin 校验（按 sink 严重度定级）

**pattern**：

```
rg -n "addEventListener\s*\(\s*['\"\`]message['\"\`]" --type-add 'code:*.{ts,tsx,js,jsx}' -tcode \
  --glob '!**/charting_library/**'
```

**判定**（必须**逐个 handler** 读代码，禁止批量断言）：

- handler 入口有 `event.origin === ...` / `e.origin !== ...` / `evt.origin !== ...` → 有校验，不列入
- 仅 `e.source === window` 过滤 → 无 origin 校验（只过滤同窗口消息，不过滤跨源）
- 无任何 origin 校验 + handler 内有 **危险 sink**（`location.href=`、`open(`、`innerHTML=`、`dangerouslySetInnerHTML` 下游、`eval`）→ **CRITICAL**
- 无 origin 校验 + handler 仅改本地 UI 状态（setState 布尔值/字符串）→ **LOW**

**必须独立验证**：

- 读每一处 handler 完整实现
- 追溯 sink 的下游（state 是否流向 dangerouslySetInnerHTML 等）

**常见误判**：

- `event.data.text` 看起来无害，但下游可能被 `dangerouslySetInnerHTML` 渲染（本项目就有这种 case）

### D5. Next.js API 路由认证（需验证 pageExtensions）

**pattern**：

```
# 先查 pageExtensions 配置
rg -n 'pageExtensions' apps/*/next.config.js

# 再找 pages/api/ 下匹配 pageExtensions 的文件
find apps/*/src/pages/api -type f
```

**判定**：

- **必须先核对 `pageExtensions` 是否匹配文件后缀**，否则文件不会被 Next.js 注册为路由
- 只对 **实际注册为路由** 的文件做认证检查
- 路由文件中扫 `secret|token|bearer|api-key` 校验；缺失 → **HIGH（公开 API DoS/滥用风险）**

**已知陷阱（本项目）**：

- 三个 app 的 `pageExtensions: ['page.tsx', 'root.tsx']`，`xxx.ts` / `xxx.page.ts` / `xxx.js` **都不会** 注册为 API 路由
- Next.js 的 `find-page-file.js` 正则：`\.(?:page.tsx|root.tsx)$`

### D6. 安全响应头（代码层 + CDN 层实测）

**pattern**：

```
rg -n 'helmet|Content-Security-Policy|X-Frame-Options|Strict-Transport-Security|X-Content-Type-Options|Permissions-Policy|Referrer-Policy' \
  --glob '!**/node_modules/**' --glob '!**/charting_library/**'
```

**判定 + 实测**：

1. 代码层扫完记录缺失项
2. **对生产域名实测**（必须做，否则结论不完整）：
   ```
   curl -sI -A "Mozilla/5.0 security-audit" --max-time 15 https://www.bydfi.com/
   curl -sI -A "Mozilla/5.0 security-audit" --max-time 15 https://www.bydfi.com/en/affiliate   # SSG iframe 页
   curl -sI -A "Mozilla/5.0 security-audit" --max-time 15 https://www.bydfi.com/en/support/faq  # SSR 页
   ```
3. 列表对比：
   - HSTS、X-Frame-Options/frame-ancestors、X-Content-Type-Options、CSP script-src/default-src、Referrer-Policy、Permissions-Policy
4. 代码无 + CDN 无 → 列入 HIGH
5. 代码无 + CDN 有 → 不列入，但记录"依赖 CDN 配置"
6. 代码无 + CDN 部分有 → HIGH，聚焦 CDN 仍缺失项

**已知陷阱**：

- SSG 用 `output: 'export'`，Next.js `headers()` 对静态导出无效
- SSR `server.js` 用 Express，需 helmet 或 CDN 前置

### D7. Cookie 属性正确性（实测验证）

**pattern**：

```
rg -n 'document\.cookie\s*=|Cookies?\.set\s*\(' --type-add 'code:*.{ts,tsx,js,jsx}' -tcode
```

**判定**：

- `SameSite=None` 不配合 Secure 的 cookie（浏览器会拒绝）→ HIGH
- 无 SameSite（默认 Lax）→ 不列入
- 缺 Secure 在 HTTPS 环境的 session cookie → MEDIUM

**常见误判（必须实测）**：

- **`Secure=true` 写法不是漏洞**：RFC 6265 §5.2.5 规定 parser 忽略 Secure attribute 的 value，Chromium/Firefox 符合规范。实测方式（Playwright）：
  ```js
  document.cookie = 'a=1; path=/; SameSite=None; Secure=true';
  const cookies = await cookieStore.getAll();
  // cookies 中 a.secure === true 说明 flag 生效
  ```
- 若不确定，跑一次 Playwright 实测后再定级。**不要仅凭"看起来不标准"就定级**。

### D8. 敏感信息日志（需验证 babel 是否移除）

**pattern**：

```
rg -n "console\.(log|info|debug|warn|error)\s*\([^)]*(password|token|secret|apikey|private|mnemonic|idtoken)" \
  --type-add 'code:*.{ts,tsx,js,jsx}' -tcode -i \
  --glob '!**/charting_library/**'
```

**判定 + 必须独立验证**：

1. 代码扫命中点
2. **读 `.babelrc` env.production.plugins**，查 `transform-remove-console` 是否启用、`exclude` 列表包含哪些
3. 若 `transform-remove-console` 生产启用且 `console.log` 不在 exclude：
   - **读 `.next/static/chunks/` 构建产物验证**：`grep -l 'console\.log.*<关键字>' .next/static/chunks/*.js`
   - 若产物中无命中 → 仅 dev 影响，降级 LOW
   - 若产物中有命中 → 生产泄露，HIGH
4. `console.error` / `console.warn` 在 exclude 列表中 → 生产仍会输出，按严重度定级

**已知陷阱**：

- 本项目三个 app `.babelrc` 都有 `["transform-remove-console", { "exclude": ["error", "info", "warn"] }]`——`console.log` / `console.debug` 生产移除；`console.info` / `console.warn` / `console.error` 保留

### D9. 依赖漏洞

**pattern**：

```
pnpm audit --prod --json --registry https://registry.npmjs.org > reports/<date>/pnpm-audit.json
```

**判定**：

- pnpm audit 输出的 severity 为基础分级，按原始 severity 列入报告。
- **可独立核查的触达验证** 可做并在报告中标注：
  - 漏洞涉及某 API（如 `lodash.template`）：grep 项目业务代码是否使用该 API
  - 漏洞依赖特定运行模式（如 Next App Router）：查项目用 `pages/` 还是 `app/`
- **不可独立核查的触达推测**（如 axios 内部对 user input 的处理路径）→ **不写入报告**，仅按原始 severity 保留。

**已知陷阱**：

- npmmirror 不支持 audit 端点，必须加 `--registry https://registry.npmjs.org`
- pnpm audit 输出的是 npm audit v1 格式，数据在 `advisories` 字段

### D10. 开发/生产配置差异（LOW）

**pattern**：

```
rg -n "if\s*\(\s*dev\s*\)|if\s*\(\s*isDev" apps/*/server.js apps/*/next.config.js
rg -n "\.replace\s*\(\s*['\"]HttpOnly['\"]|secure:\s*false" apps/*/server.js
```

**判定**：

- dev 分支剥离 HttpOnly / 关闭 SSL 验证 → LOW（仅影响 dev，不影响生产）
- 若 dev 分支"泄漏"到生产（如条件判断错误）→ HIGH

### D11. Git 跟踪敏感文件（LOW）

**pattern**：

```
git ls-files | grep -E '\.(env|npmrc)($|\.)|\.pem$|credentials|secret'
```

**判定**：

- `.env` / `.npmrc` 被跟踪 → LOW（违反 12-factor，易引入 D1）
- 内容含 D1 命中的 token → 升级为 D1 的 CRITICAL

### D12. i18n / 翻译动态执行（D2 的特殊场景）

**pattern**：已在 D2 中覆盖。单独列维度因为 bydfi 项目有 `new Function('return ' + string)()` 解析本地翻译 JS。

**判定**：

- `fs.readFileSync(langPath)` + `new Function` / `eval` → HIGH（供应链 RCE 风险）

### D13. 危险 URL 协议处理（XSS 入口）

**pattern**：

```
rg -n "window\.location\.href\s*=|location\.href\s*=\s*[^'\"]" --type-add 'code:*.{ts,tsx,js,jsx}' -tcode
rg -n "window\.open\s*\(" --type-add 'code:*.{ts,tsx,js,jsx}' -tcode
```

**判定**：

- `location.href = X` 或 `window.open(X)` 且 X 来自不可信源 且 无 `/^https?:\/\//` 协议白名单校验 → **CRITICAL**（javascript:/data: URL 可触发 XSS）
- 有 `/^https?/i.test(X)`（未锁 `://`）：对 XSS 仍有效（`javascript:` 不匹配 http 前缀），但误导性分流
- 有 `/^https?:\/\//` 或更严格校验 → 不列入

## 独立验证流程（每条结论强制）

生成报告前，**每条结论** 必须走完：

1. **事实验证**：grep 结果 + 读文件完整上下文 + git 状态（`git ls-files` / `git log`）
2. **触达验证**：漏洞点数据流是否真的闭合（XSS 看 sink、依赖漏洞看 API 使用）
3. **可利用性验证**：CDN 头、浏览器实际行为、pageExtensions 匹配等——**能实测就实测**
4. **误判防护**：比对本文件「已知陷阱」清单，命中者必须走对应验证步骤

不满足这 4 步不写入报告，列入"未达 100% 确定"的附录 B。

## 输出 Schema（固定）

### 概览表

| 维度                           | Critical | High  | Medium | Low   |
| ------------------------------ | -------- | ----- | ------ | ----- |
| D1 凭据泄露                    | n        | n     | n      | n     |
| D2 eval / new Function         | n        | n     | n      | n     |
| D3 dangerouslySetInnerHTML XSS | n        | n     | n      | n     |
| D4 postMessage origin          | n        | n     | n      | n     |
| D5 API 认证                    | n        | n     | n      | n     |
| D6 安全响应头                  | n        | n     | n      | n     |
| D7 Cookie 属性                 | n        | n     | n      | n     |
| D8 敏感日志                    | n        | n     | n      | n     |
| D9 依赖漏洞                    | n        | n     | n      | n     |
| D10 dev/prod 差异              | n        | n     | n      | n     |
| D11 git 跟踪                   | n        | n     | n      | n     |
| D12 i18n 动态执行              | n        | n     | n      | n     |
| D13 危险 URL                   | n        | n     | n      | n     |
| **合计**                       | **n**    | **n** | **n**  | **n** |

### 每条结论的固定字段

````markdown
### <序号> <标题>

**证据**：`<file:line>` 列表

```<code block>
<关键代码片段>
```
````

**事实**：

- 客观陈述（grep 输出 / 文件内容 / 命令结果）

**可利用性**：

- 攻击路径 + CDN / 浏览器实测结果（若适用）

**风险**：

- 按事实 + 可利用性综合描述；依赖外部信息的用"最坏情况 + 需 X 核实"

**建议**：

- 具体步骤（命令、配置、代码修改点）

````

### 必要区块

1. **概览表**（见上）
2. **严重度分层正文**（CRITICAL / HIGH / MEDIUM / LOW）
3. **扫描方法与复现**（固定列出本 skill 的 scope manifest + 复现命令）
4. **附录 A：自检修正记录**——第二轮自检发现的误判/降级，列表格
5. **附录 B：未列入维度**——达不到 100% 确定的项，说明原因
6. **附录 C：与上次对比**——新增/保留/消失各列 10 条样本（首次跑时留空）

## 报告文件输出

写入 `reports/YYYY-MM-DD/byd-web-report-security-YYYY-MM-DD.md`（当天日期），同名文件已存在则覆盖。

同目录保存 `pnpm-audit.json`（原始审计输出）。

文件开头：

```markdown
# bydfi-web 深度安全审查报告

> 生成时间：YYYY-MM-DD HH:mm
> skill 版本：bydfi-web-report-security v1.0.0
> 基线报告：reports/2026-04-21/security-review.md
````

## 与上次对比（强制）

每次跑完后，diff 当前报告与上次报告：

- 新增（上次没有本次有）
- 保留（两次都有）
- 消失（上次有本次没有——可能已修复或误判）

在附录 C 列 3 张表，每张最多 10 条样本 + 总数。

## 已知陷阱清单（历史累积，禁止再犯）

| #   | 陷阱                                                                              | 正确做法                                                                                                           |
| --- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| T1  | Next.js `pageExtensions: ['page.tsx', 'root.tsx']` 下 `api/xxx.ts` 不会注册为路由 | 先核对 `pageExtensions`，再判断 API 是否真暴露                                                                     |
| T2  | Cookie `Secure=true` 写法实际有效（RFC 6265 §5.2.5 parser 忽略 value）            | 用 Playwright `cookieStore.getAll()` 实测，不凭"不标准" 断定失效                                                   |
| T3  | `transform-remove-console` 生产移除 `console.log`（三个 app 都启用）              | 读 `.next/static/chunks/` 构建产物验证是否真的被移除                                                               |
| T4  | postMessage handler 批量断言"无 origin 校验"                                      | 逐个 handler 读代码；有校验的常见形式：`event.origin === ...` / `e.origin !== ...` / `evt.origin !== parentOrigin` |
| T5  | `dangerouslySetInnerHTML` 批量列为 XSS                                            | 追溯数据流到 100% 不可信源；检查所有 sanitize 函数实现（常见被注释掉）                                             |
| T6  | 假设代码层无安全头 = 用户实际无防护                                               | 必须 `curl -I` 生产域名看 CDN/反代实际响应                                                                         |
| T7  | Firebase `apiKey: AIzaSy...` 计为凭据泄露                                         | Firebase Web apiKey 官方公开设计，不列入                                                                           |
| T8  | 对无法独立核查的影响做"最坏情况"推测                                              | 只陈述可验证事实（"凭据硬编码并被 git 跟踪"），不推测 token 能调什么 API、后端是否信任                             |
| T9  | 对无法独立核查的触达做"可能 / 若-则"推测                                          | 只陈述 pnpm audit 原始 severity；仅对可 grep / 可 curl / 可实测的触达验证写入报告                                  |
| T10 | pnpm audit 漏洞直接等同于"可利用"                                                 | 验证业务代码是否使用该 API / 使用该运行模式；lodash `_.template` 本项目 0 调用                                     |

## 失败降级

| 情况                                                 | 降级方案                                           |
| ---------------------------------------------------- | -------------------------------------------------- |
| `pnpm audit --json` 返回非 0 但有 JSON 输出          | 正常解析（pnpm audit 发现漏洞时非 0 是预期）       |
| `pnpm audit` 报 `ERR_PNPM_AUDIT_ENDPOINT_NOT_EXISTS` | 加 `--registry https://registry.npmjs.org`         |
| `curl -I` 生产域名失败（网络受限）                   | 记录"无法实测 CDN 头"，D6 结论降级为"代码层分析"   |
| Playwright 不可用（Cookie 实测）                     | 引用 RFC 6265 §5.2.5 + MDN，加注"未实测但基于规范" |

## 运行后审查（单轮，不循环）

报告生成后，对每条结论做一次精确复核：

1. **数据验证**：grep 命中数与报告数一致
2. **结论复核**：每条"事实"句能追溯到 file:line
3. **陷阱自检**：对照 T1–T10 清单，确保每条命中都走了对应验证
4. **修正报告**：发现错误直接修正原文件
5. **新陷阱登记**：发现新误判模式，终端提示补入本 skill 的「已知陷阱清单」并更新 version

## 相关 skill

- **关联**：`bydfi-web-code-review` — 规范层安全检查
- **互补**：`bydfi-web-report-deps-vuln` — 依赖层漏洞检查

按问题域查询完整 skill 索引：见 `.claude/skills/SKILL_BEST_PRACTICES.md` 的"问题域 → SoT skill 索引"章节。
