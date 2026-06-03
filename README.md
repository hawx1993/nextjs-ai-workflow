# BYD Next Workflow

`byd-next` 是一个 Claude Code plugin，用于在 BYDFi 风格的 Next.js / React / TSX / TypeScript monorepo 中提供可复用的 AI 开发工作流。

它将本仓库的 commands、agents、skills、rules、knowledge 和 hooks 打包为 Claude Code plugin，安装后通过 plugin namespace 调用。

## 包含内容

- `commands/`：日常开发、代码生成、审计、Git / PR workflow 入口。
- `agents/`：Next.js 架构、React TSX 实现、审查、构建修复、质量验证等角色说明。
- `skills/`：规划、实现、审查、审计、发版前检查、PR Review 等可复用流程。
- `rules/`：Next.js、React TSX、TypeScript、i18n、theme、responsive、verification 等硬规则。
- `knowledge/`：core/API/hooks/icons 等公共能力发现流程。
- `hooks/`：危险命令阻断、新增依赖阻断、TSX 质量提醒。

## 安装

本仓库同时作为 marketplace 仓库和插件仓库使用，根目录的 `.claude-plugin/marketplace.json` 会将 `byd-next` 指向当前仓库根目录。

添加 marketplace：

```text
/plugin marketplace add https://github.com/hawx1993/nextjs-ai-workflow
```

安装插件：

```text
/plugin install byd-next-workflow
```

如果已经添加过旧版本 marketplace，先更新：

```text
/plugin marketplace update byd-next-workflow
```

## 本地测试

在本仓库根目录执行：

```bash
claude --plugin-dir .
```

进入 Claude Code 后可执行：

```text
/reload-plugins
/byd-next:dev-plan 测试：规划一个简单页面改动，不要修改文件
```

## 常用命令

安装为 plugin 后，命令会带上 plugin namespace。常用入口示例：

```text
/byd-next:dev-plan <需求>
/byd-next:dev-implement <路径/需求>
/byd-next:dev-review [文件或范围]
/byd-next:dev-fix-build <错误输出>
/byd-next:dev-fix-bug <范围>
/byd-next:workflow-git-commit
/byd-next:workflow-create-pr <base-branch>
```

> 注意：插件命令名称以 Claude Code 实际发现结果为准；如嵌套目录展示方式变化，请以 `/help` 或 `/plugin` 中显示为准。


# BYDFi Claude 工作流总索引

本文件是 BYDFi Web 的 Claude 工作流索引，覆盖 `.claude/agents`、`.claude/commands`、`.claude/knowledge`、`.claude/skills`、`.claude/rules` 的入口选择。

使用前先遵守仓库总入口 `.claude/CLAUDE.md`；涉及具体场景时，再读取对应 `.claude/rules/*`、`.claude/knowledge/*` 与 `.claude/skills/*`。

## 总原则

- **理解 → 方案确认 → 实现 → 验证**：复杂需求禁止跳过规划直接改代码。
- **日常 Next.js + React + TSX 开发优先使用 `dev-*`**：规划、实现、修 bug、修构建、重构、审查分开处理。
- **代码生成使用现有 `codegen-*` 命令**：只引用命令目录中实际存在的 codegen 入口；SSG/SSR 生成能力是支持性 skill。
- **专项审计使用 `/audit:*`**：i18n、主题、安全、死代码、依赖、SEO、Tree Shaking 等审计通常产出报告或建议，不等于已修复。
- **先查 knowledge 再实现**：涉及 API、core、hooks、icons 时，先读取对应 knowledge，避免重复封装。
- **Git / PR / 外部动作必须明确授权**：未收到用户明确指令，不得执行 `git commit`、`git push`、`gh pr create` 或外部打开动作。
- **验证必须明示**：改完代码必须列出验证命令与结果；未运行必须说明原因。
- **不引入新依赖**：任何新 package 需用户确认。

## 快速选择

### 1. PRD / 需求开发场景

| 场景 | 推荐入口 | 说明 |
| --- | --- | --- |
| 只有需求描述，还没明确技术方案 | `/byd-next:dev-plan <需求描述>` | 先梳理范围、影响面、实现方案、风险与验证策略，不直接改代码 |
| 已确认方案，需要实现功能 | `/byd-next:dev-implement <文件路径或需求说明>` | 按确认方案做最小必要实现，优先复用 core/API/hooks/组件 |
| 需求实现中出现明确 bug | `/byd-next:dev-fix-bug <文件路径[:行号[-行号]] 或 文件夹路径 + bug 描述>` | 按指定范围定位并修复 BYDFi Next.js / React / TSX bug |
| 实现后需要检查改动质量 | `/byd-next:dev-review [文件路径或范围]` | 审查 hooks、类型、i18n、theme、SSR/SSG、性能与验证覆盖 |
| 实现后准备提交或创建 PR | `/byd-next:workflow-git-commit`、`/byd-next:workflow-create-pr` | 必须用户明确授权后才执行 Git / PR 动作 |

### 2. 设计稿 / Figma 开发场景

| 场景 | 推荐入口 | 说明 |
| --- | --- | --- |
| 根据 Figma 设计稿生成 SSG UI | `/byd-next:codegen-figma-ui <figma-url> <file-path>` | Figma URL 必须包含具体 `node-id`，并结合设计系统规则实现 |
| 根据设计稿补齐或调整组件交互 | `/byd-next:dev-implement <文件路径或需求说明>` | 只实现与设计稿相关的最小必要代码改动 |
| 设计稿实现后做 UI 审查 | `/byd-next:dev-review [文件路径或范围]` | 重点检查 i18n、theme、styled-jsx、响应式、RTL、三端表现 |

### 3. 无设计稿 / 自主 UI 生成场景

| 场景 | 推荐入口 | 说明 |
| --- | --- | --- |
| 无设计稿生成 BYDFi Nex 页面或组件 | `/byd-next:codegen-design-system <文件路径> [需求说明]` | 按 BYDFi Nex 设计系统生成页面和组件 |
| 生成高级落地页 / 营销页 | `/byd-next:codegen-designer-landing-ui <需求或目标路径>` | 走 landing-ui 反粗糙设计流程，适合营销页和落地页 |
| 生成高端 Soft UI / Premium UI | `/byd-next:codegen-designer-premium-ui <需求或目标路径>` | 走 premium-ui 设计流程，适合精致高级 UI |
| 自主 UI 生成后审查 | `/byd-next:dev-review [文件路径或范围]` | 检查是否符合 theme、responsive、styled-jsx、i18n 与验证要求 |

### 4. Bug / 构建修复场景

| 场景 | 推荐入口 | 说明 |
| --- | --- | --- |
| 页面、组件、交互或数据 bug | `/byd-next:dev-fix-bug <范围 + bug 描述>` | 适合有明确文件、行号、目录或复现描述的 bug |
| TypeScript / Next build / hydration / alias 报错 | `/byd-next:dev-fix-build <错误输出>` | 最小改动修复构建、类型、SSR/CSR 边界问题 |
| 修复后需要质量复查 | `/byd-next:dev-review [文件路径或范围]` | 确认修复没有引入 hooks、类型、i18n、theme、SSR/SSG 风险 |

### 5. 重构 / 清理场景

| 场景 | 推荐入口 | 说明 |
| --- | --- | --- |
| 重构 React/TSX 组件 | `/byd-next:dev-refactor-component <文件夹路径或 .tsx 组件文件路径>` | 只处理 React/TSX 组件，保持 UI、交互和业务行为不变 |
| 清理死代码、无用变量、无用类型 | `/byd-next:dev-refactor-clean <文件或目录>` | 在指定范围安全识别并移除死代码，每次变更后验证 |
| 重构前不确定影响面 | `/byd-next:dev-plan <需求描述>` | 先评估影响范围、风险和验证策略，再执行重构 |
| 重构后检查质量 | `/byd-next:dev-review [文件路径或范围]` | 检查 hooks 依赖、类型、复用、性能、样式和验证覆盖 |

### 6. 审计 / 专项检查场景

| 场景 | 推荐入口 | 说明 |
| --- | --- | --- |
| i18n / 硬编码文案审计 | `/audit:i18n` | 审计语言常量、翻译覆盖和硬编码文案 |
| 主题 / 硬编码颜色 / RTL 审计 | `/audit:theme` | 审查主题合规性、硬编码颜色和 RTL 兼容 |
| 安全审计 | `/audit:security` | 执行 BYDFi 深度安全审查并生成报告 |
| 死代码审计 | `/audit:dead-code` | 扫描冗余文件、死函数、死类型和死 enum 成员 |
| 依赖 / 漏洞 / 版本审计 | `/audit:dead-deps`、`/audit:deps-vuln`、`/audit:pkg-version` | 检查死依赖、安全漏洞和依赖版本一致性 |
| Tree Shaking / any / SEO / 内存泄漏审计 | `/audit:tree-shaking`、`/audit:any-cleanup`、`/audit:seo`、`/audit:memory-leak` | 输出专项报告；需要修复时再进入 dev 流程 |

### 7. 发布 / PR / 周报 / 经验沉淀场景

| 场景 | 推荐入口 | 说明 |
| --- | --- | --- |
| 发版前风险检查 | `/byd-next:workflow-pre-release <base-branch> <target-branch>` | 生成发版前质量与风险报告 |
| Review GitHub PR | `/byd-next:workflow-review-pr <PR号>` | 输出结构化 PR Review 报告，不自动发布评论 |
| 自动审查并评论 GitHub PR | `/byd-next:workflow-github-pr-reviewer <PR号或 GitHub PR URL>` | 会发布 inline comments 和 summary comment，必须用户明确要求 |
| 生成 Commit | `/byd-next:workflow-git-commit` | 必须用户明确授权；提交信息中文，遵守 commitlint |
| 创建 PR | `/byd-next:workflow-create-pr <base-branch>` | 必须用户明确授权；不得擅自 `gh pr create` |
| 生成周报 | `/byd-next:workflow-weekly-report [时间范围]` | 基于当前 git author 的 commit message 生成 BYDFi 周报 |
| 沉淀当前会话经验 | `/byd-next:workflow-learn` | 提炼为候选 skill 或项目工作指导 |

## 日常开发命令

| 命令 | 参数 | 用途 | 关联规则 / Skill / Knowledge |
| --- | --- | --- | --- |
| `/byd-next:dev-doc` | `[scope 或需求说明]` | 输出 BYDFi Claude 工作流索引与命令路由 | 本文件、`.claude/CLAUDE.md` |
| `/byd-next:dev-plan` | `<需求描述>` | 规划 BYDFi Next.js + React + TSX 需求实现方案，不直接修改代码 | `nextjs.md`、`react-tsx.md`、`typescript.md`、`monorepo.md`、`nextjs-architect` |
| `/byd-next:dev-implement` | `<文件路径或需求说明>` | 按已确认方案实现 BYDFi Next.js + React + TSX 代码改动 | `dev/nextjs-dev`、`discovery-core.md`、`discovery-api.md`、`discovery-hooks.md` |
| `/byd-next:dev-fix-bug` | `<范围或错误描述>` | 按代码行、文件或目录范围定位并修复 bug | `react-tsx.md`、`typescript.md`、`nextjs.md`、`discovery-core.md`、`discovery-hooks.md` |
| `/byd-next:dev-fix-build` | `<构建命令或错误输出>` | 最小改动修复 BYDFi Next.js / React / TypeScript 构建与类型错误 | `nextjs.md`、`typescript.md`、`verification.md`、`nextjs-build-resolver` |
| `/byd-next:dev-refactor-clean` | `<文件或目录>` | 在指定范围安全识别并移除死代码 | `typescript.md`、`monorepo.md`、`verification.md` |
| `/byd-next:dev-refactor-component` | `<文件夹路径或 .tsx 组件文件路径>` | 重构指定 BYDFi React/TSX 组件，遇到非 React 组件时报错提示 | `react-tsx.md`、`typescript.md`、`language.md`、`theme.md`、`discovery-hooks.md` |
| `/byd-next:dev-review` | `[默认当前工作区 git diff \| 文件路径 \| PR说明]` | 审查 BYDFi React + TSX 改动，覆盖 hooks、类型、i18n、theme、SSR/SSG、性能和验证 | `dev/nextjs-review`、`react-tsx-reviewer`、`verification.md` |

## 代码生成命令

| 命令 | 参数 | 用途 | 关联 Skill / Knowledge |
| --- | --- | --- | --- |
| `/byd-next:codegen-design-system` | `<file-path> [需求说明]` | 无需设计稿生成符合 BYDFi Nex 设计系统的页面和组件代码 | `codegen/design-system`、`theme.md`、`styled-jsx.md` |
| `/byd-next:codegen-figma-ui` | `<figma-url> <file-path>` | 根据 Figma 设计稿生成 BYDFi SSG UI 组件 | Figma MCP、`apps-icon.md`、`codegen/design-system` |
| `/byd-next:codegen-designer-landing-ui` | `<需求或目标路径>` | 生成或改造 BYDFi 落地页、作品集与营销页 UI | `designer/landing-ui`、`codegen/design-system` |
| `/byd-next:codegen-designer-premium-ui` | `<需求或目标路径>` | 生成高端、精致、非模板化的 BYDFi Soft UI 页面和组件代码 | `designer/premium-ui`、`codegen/design-system` |

支持性 skill（不是 `/byd-next:*` 命令）：

- `.claude/skills/codegen/ssg-generate/SKILL.md`：SSG 页面 / React 代码生成流程。
- `.claude/skills/codegen/ssr-generate/SKILL.md`：SSR pages router 页面生成流程。
- `.claude/skills/codegen/ssr-sidebar-pick/SKILL.md`：SSR 侧栏组件筛选相关流程。

## 专项审计命令

| 命令 | 用途 | 关联 Skill |
| --- | --- | --- |
| `/audit:any-cleanup` | 扫描 TypeScript 显式 `any` 用法并生成清理建议 | `audit/ts-any-cleanup` |
| `/audit:apps-kit-shared` | 审计 apps-kit 模块在各应用中的共享情况 | `audit/shared/apps-kit` |
| `/audit:dead-code` | 扫描冗余文件、死函数、死类型和死 enum 成员 | `audit/dead-code` |
| `/audit:dead-deps` | 扫描未使用依赖 | `audit/dead-deps` |
| `/audit:deps-vuln` | 扫描依赖安全漏洞 | `audit/security/deps-vuln` |
| `/audit:i18n` | 审计 i18n 语言常量、翻译覆盖和硬编码文案 | `audit/i18n` |
| `/audit:memory-leak` | 扫描客户端和服务端内存泄漏风险 | `audit/memory-leak` |
| `/audit:pkg-version` | 扫描依赖版本不一致问题 | `audit/pkg-version` |
| `/audit:security` | 执行 BYDFi 深度安全审查 | `audit/security` |
| `/audit:seo` | 检查 SEO 配置并生成优化报告 | `audit/seo` |
| `/audit:theme` | 审查主题合规性、硬编码颜色和 RTL 兼容 | `audit/theme` |
| `/audit:tree-shaking` | 扫描并修复影响 Tree Shaking 的 import 违规问题 | `audit/tree-shaking` |
| `/audit:ts-candidates` | 扫描 JS/JSX 文件并生成可 TypeScript 化候选清单 | `audit/ts-candidates` |

审计命令通常产出报告或建议，不等同于已修复问题；若需要落地修复，应再进入 `/byd-next:dev-plan`、`/byd-next:dev-implement`、`/byd-next:dev-fix-bug` 或 `/byd-next:dev-refactor-clean` 流程。

## Workflow 命令：Git / PR / 发布 / 学习 / 周报

| 命令 | 参数 | 用途 | 注意事项 |
| --- | --- | --- | --- |
| `/byd-next:workflow-git-commit` | `[默认交互流程 \| --fast \| --no-verify \| 提交说明]` | 分析暂存变更并创建符合 BYDFi 规范的 Git Commit | 必须用户明确要求；提交信息中文，遵守 commitlint |
| `/byd-next:workflow-create-pr` | `[base-branch]` | 分析分支变更并创建符合 BYDFi 规范的 Pull Request | 必须用户明确要求；不得擅自 `gh pr create` |
| `/byd-next:workflow-github-pr-reviewer` | `<PR号或 GitHub PR URL>` | 自动审查 GitHub PR，并发布 inline comments 与 summary comment | 会对外发布评论，必须用户明确要求 |
| `/byd-next:workflow-learn` | `[当前会话经验或规则]` | 从当前会话提炼可复用经验，保存为候选 skill 或项目指导 | 适合沉淀长期有效规则 |
| `/byd-next:workflow-open-url` | `[链接编号或名称]` | 打开 BYDFi 内网链接；为空输出所有可用链接 | 会调用系统 `open`，属于本地外部动作 |
| `/byd-next:workflow-pre-release` | `<base-branch> <target-branch>` | 发版前代码质量检查并生成风险报告 | 合流前使用 |
| `/byd-next:workflow-review-pr` | `<PR号>` | 按团队规范深度 Review GitHub PR，输出结构化报告 | 读取 `gh pr view/diff/list`，不自动发布评论 |
| `/byd-next:workflow-weekly-report` | `[时间范围]` | 提取当前 git author 的 commit message 并生成 BYDFi 周报 | 仅生成报告，不改业务代码 |

## Hooks

插件通过 `hooks/hooks.json` 注册 hooks：

- `PreToolUse / Bash`
  - `hooks/dangerous-command-guard.mjs`：阻断危险 shell 命令。
  - `hooks/dependency-guard.mjs`：阻断未经明确确认的新增依赖命令。
- `PostToolUse / Write|Edit`
  - `hooks/tsx-quality-guard.mjs`：提醒 TS/TSX 中的硬编码文案、硬编码颜色、`console.log`、可疑 `LANG` 用法。

Hook 命令使用 `${CLAUDE_PLUGIN_ROOT}` 定位插件根目录，不依赖项目中的 `.claude/` 路径。

## 私有 settings 策略

本插件不打包 `settings.local.json`，也不通过插件授予 Bash、git、gh、pnpm 等权限。权限属于用户或项目自己的 Claude Code settings，应由使用者按需配置。

插件也不会自动执行：

- `git commit`
- `git push`
- `gh pr create`

这些动作必须由用户明确授权。

## 验证

开发或发布前建议运行：

```bash
node --check hooks/tsx-quality-guard.mjs
node --check hooks/dependency-guard.mjs
node --check hooks/dangerous-command-guard.mjs
claude plugin validate . --strict
```

手动 smoke check：

1. `claude --plugin-dir .`
2. `/reload-plugins`
3. 执行一个只读规划命令，例如 `/byd-next:dev-plan ...`
4. 在一次性测试项目中确认危险命令 / 新增依赖 hook 能阻断，TSX 质量 hook 能提醒。
