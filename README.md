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
/plugin install byd-next@byd-next-marketplace
```

如果已经添加过旧版本 marketplace，先更新：

```text
/plugin marketplace update byd-next-marketplace
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
