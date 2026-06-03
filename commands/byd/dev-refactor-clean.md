---
description: 在指定文件或目录范围内安全识别并移除 BYDFi Web 死代码，每次变更后都进行验证。
argument-hint: '<文件或目录路径>'
allowed-tools: Read, Glob, Grep, Bash, Edit
author: Nilu
---

# 重构清理

在用户指定的文件或目录范围内，安全识别并移除 BYDFi Web 仓库中的死代码，并在每一步变更后进行验证。

## 参数

必须传入一个明确的文件或目录路径作为清理范围：

```bash
/byd:dev-refactor-clean apps/byd-ssr/src/pages/[locale]/crypto-tools
/byd:dev-refactor-clean packages/apps-kit/core/i18n/src
/byd:dev-refactor-clean .claude/commands/byd
```

如果 `$ARGUMENTS` 为空，必须先停止并要求用户补充路径；不要默认扫描整个仓库。

## 适用范围

本命令只用于 BYDFi Web 仓库内的局部重构清理：

- `apps/byd-ssg/**`：SSG 页面、组件、hooks、store、工具函数。
- `apps/byd-ssr/**`：SSR 页面、组件、hooks、store、工具函数。
- `packages/apps-kit/**`：共享业务逻辑、核心模块和组件，需同时考虑 SSG/SSR 影响。
- `packages/apps-ui/**`：共享 UI 组件库，需考虑多 app 影响。
- `packages/apps-icons/**`：图标 barrel 和图标资源，需注意 tree-shaking。
- `packages/apps-base-kline/**`：公共 K 线包，修改后需手动运行对应 lint。
- `.claude/**`：Claude Code 命令、skills、rules、hooks 等工作流文档和配置。

禁止无边界地扫描或删除整个仓库内容。

## 步骤 1：确认清理范围

先解析 `$ARGUMENTS`：

1. 确认路径存在，且位于当前仓库内。
2. 判断范围类型：apps 专属、共享 package、`.claude` 工作流文件，或根配置文件。
3. 输出简短范围摘要：
   - 输入路径
   - 影响层级
   - 可能影响的 apps 或者 packages
   - 建议验证命令

如果路径包含共享包（`packages/apps-kit`、`packages/apps-ui`、`packages/apps-icons`、`packages/apps-base-kline`），必须提示会影响多个 app。

## 步骤 2：检测死代码

优先使用项目内已有脚本和轻量搜索，避免为了清理临时引入依赖。

### 推荐工具

| 工具     | 可发现的问题             | 使用建议                                 |
| -------- | ------------------------ | ---------------------------------------- |
| Grep     | 未被引用的 export/文件   | 首选，限定 `$ARGUMENTS` 范围和调用方范围 |
| knip     | 未使用的导出、文件、依赖 | 仅在项目已有配置或用户同意时运行         |
| depcheck | 未使用的 npm 依赖        | 仅用于依赖清理，不用于普通代码清理       |
| ts-prune | 未使用的 TypeScript 导出 | 仅在项目已有依赖或用户同意时运行         |

### BYDFi 推荐搜索方式

- 对 React/TSX 组件：搜索组件名、文件名、默认导出名、路由引用、动态 import。
- 对 hooks：搜索 hook 名称和导入路径。
- 对工具函数/类型：搜索导出名、barrel re-export、类型引用和字符串引用。
- 对 `.claude` 命令/skill：搜索命令名、skill 名、文件路径和 README/索引引用。
- 对样式文件：搜索 className、SCSS import、CSS module 引用。

如果无法证明未使用，只能归为「谨慎」或「危险」，不能直接删除。

## 步骤 3：分类发现项

按安全等级对发现项进行分类：

| 等级     | 示例                                                        | 处理方式                                   |
| -------- | ----------------------------------------------------------- | ------------------------------------------ |
| **安全** | 指定范围内的未使用内部函数、局部常量、测试辅助函数          | 可删除，但每次删除后都要验证               |
| **谨慎** | React 组件、hooks、页面内子组件、API 封装、`.claude` 命令   | 需确认无动态引用、无路由引用、无外部消费者 |
| **危险** | 页面入口、路由文件、配置文件、公共类型、barrel export、i18n | 默认不删，除非证据充分且用户明确确认       |

## 步骤 4：安全删除循环

对每个确认可删除的项目执行：

1. **建立基线** —— 先运行与范围匹配的轻量验证，或说明为何暂不运行。
2. **精确删除** —— 使用 Edit 工具进行最小改动，不做顺手重构。
3. **重新验证** —— 删除后立即运行同一组验证。
4. **失败即回滚** —— 如果验证失败，立即恢复该项改动并跳过。
5. **继续下一项** —— 一次只处理一个删除点，避免批量删除导致难以定位问题。

不要使用 `git checkout -- <file>` 回滚用户已有改动；如需回滚，只回滚本轮自己刚做的变更，并先确认不会覆盖用户改动。

## 步骤 5：处理「谨慎」项

删除「谨慎」项前，需要额外检查：

- 动态导入：`import()`、`require()`。
- 字符串引用：路由名、组件名、skill 名、命令名、配置 key。
- barrel 导出：`index.ts`、`index.tsx`、`index.js` 中的 re-export。
- alias 引用：注意 `@/*` 在 SSG/SSR 中可能解析到 `apps-kit` 或本地 `src`。
- Next.js 路由：`pages/**` 下的文件可能由路由系统直接消费，即使没有 import 也不是死代码。
- i18n：`LANG` 文案、语言常量和翻译 key 可能由运行时读取，不可仅凭静态搜索删除。
- `.claude`：命令、skill、rules 可能由 slash command 或 Skill 工具动态加载，不可只按 import 判断。

## 步骤 6：可选合并重复代码

只有在用户明确要求「顺便合并重复代码」时才执行。默认本命令只做死代码清理。

可考虑的重复代码：

- 高度相似的纯函数（相似度 >80%）。
- 冗余的局部类型定义。
- 没有实际价值的包装函数。
- 没有意义的 re-export。

合并重复代码属于重构，不应和死代码删除混在同一次未确认变更中。

## 验证策略

根据 `$ARGUMENTS` 选择最小必要验证：

| 范围                          | 推荐验证                                                           |
| ----------------------------- | ------------------------------------------------------------------ |
| `apps/byd-ssg/**`             | `pnpm tsc:check:ssg`、必要时 `pnpm build:ssg`                      |
| `apps/byd-ssr/**`             | `pnpm tsc:check:ssr`、必要时 `pnpm build:ssr`                      |
| `packages/apps-kit/**`        | `pnpm -F apps-kit run tsc:check` 或 `pnpm tsc:all`                 |
| `packages/apps-ui/**`         | `pnpm tsc:all`，并说明影响 SSG/SSR                                 |
| `packages/apps-icons/**`      | `pnpm tsc:all`，并检查 barrel 导出影响                             |
| `packages/apps-base-kline/**` | `pnpm -F @apps/base-kline run lint`                                |
| `.claude/**`                  | `git diff --check -- <path>`；修改 hooks 时运行对应 `node --check` |
| 仅 Markdown 文档              | `git diff --check -- <path>`                                       |

如果验证命令不存在或失败，必须如实记录关键错误，不能声称通过。

## 总结格式

完成后按以下格式汇报：

```text
死代码清理
──────────────────────────────
范围：     <用户传入路径>
已删除：   <删除项数量和类型>
已跳过：   <跳过项和原因>
影响范围： <受影响 app/package>
验证：     <命令和结果>
──────────────────────────────
```

## 规则

- **必须限定范围** —— 没有 `$ARGUMENTS` 路径就不执行。
- **未验证不删除** —— 至少先建立轻量验证基线；无法验证时先说明风险。
- **一次只删除一项** —— 原子化变更便于定位和回滚。
- **不确定就跳过** —— 保留疑似死代码也好过破坏生产环境。
- **清理时不要同时重构** —— 分离关注点（先清理，后重构）。
- **不新增依赖** —— 不得为了清理临时安装 knip、depcheck、ts-prune 等工具。
- **不删除入口文件** —— Next.js 页面、配置、barrel export、i18n 运行时资源默认视为危险项。
- **保护用户改动** —— 回滚前必须确认不会覆盖用户已有修改。
