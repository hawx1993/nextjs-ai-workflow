---
name: bydfi-workflow-git-commit-generator
description: 分析暂存变更并创建规范 commit
disable-model-invocation: true
allowed-tools: Bash, Read
argument-hint: '[--fast] [提交说明或留空]'
author: Lucas & Nilu
---

# Commit 规范

基于 Conventional Commits，与 `.commitlintrc.js` 完全一致。commitlint + husky 自动校验。

> **禁止自动推送**：未收到用户明确的 push 指令时，不得执行 `git push`。

## 模式选择（必须先执行）

在执行任何 git 操作前，必须先判断 `$ARGUMENTS`：

1. **仅当** `$ARGUMENTS` 明确包含独立参数 `--fast` 时，才进入下方 `## 参数：--fast（可选）` 的快速模式。
2. 如果 `$ARGUMENTS` 为空、只包含空白字符，或只包含普通提交说明，必须进入 `## 执行流程（逐步确认）` 的默认 3 步交互流程。
3. `--no-verify` 不是快速模式开关；单独传入 `--no-verify` 时仍必须走默认 3 步交互流程，只在最终用户确认执行 commit 时追加 `--no-verify`。
4. 禁止因为 `$ARGUMENTS` 为空而执行 `git add .`、跳过暂存范围确认或跳过 diff 预览。
5. 禁止使用需要额外权限的 Bash 管道计数命令，例如 `git diff --cached --name-only | grep -E '\\.(tsx|ts)$' | wc -l`；需要判断 TS/TSX 文件时，使用已展示的 `git status --short` 或 `git diff --cached --name-only` 输出人工判断。
6. 对于 200 行以上的大变更，commit body 仍只使用 `修改原因`、`处理方案`、`影响范围` 三段，但每段必须写成多行 bullet 内容，确保 body 至少 4 个非空行；禁止改用 `Context`、`Approach`、`Changes`、`Impact` 标题。

## 参数：--fast（可选）

如果 `$ARGUMENTS` 包含 `--fast`，进入**快速模式**：跳过暂存范围确认和 diff 预览，仅在 commit 前做一次 message 确认。

### 前置检查（不可绕过）

1. 运行 `git rev-parse --abbrev-ref HEAD` 取当前分支
2. 若分支名为 `main` / `master`，**立即拒绝**：

   > `--fast` 禁止在受保护分支（main/master）使用，请切到 feature 分支后重试

   并退出，不执行任何 git 操作

3. 运行 `git status --porcelain`，若输出为空（工作区干净），输出"工作区干净,无可提交内容"并退出

### 执行步骤

1. `git add .`
2. 运行 `git diff --cached --stat` 和 `git diff --cached`，AI 自行分析变更
3. 按下方 `## 格式` / `## Type` / `## Scope` / `## Subject` / `## Body` 规范**自动生成**完整 commit message（含 footer 的 `Co-authored-by` 行），并完整展示给用户

   **→ 停下，等用户确认**

   **默认选项**：

   1. 确认，执行 commit
   2. 修改（用户描述要改的部分）
   3. 取消本次 commit

4. 用户确认后执行 `git commit`
5. commit 结束后，无论是否为快速模式，都必须先展示完整 commit message 和 `git log -1 --oneline` 结果。
6. 然后询问用户是否执行 push 操作，并提供固定数字选项：

   ```text
   请选择：
   1. 执行 push 操作
   2. 取消
   ```

   仅当用户明确回复 `1` 时，才执行 `git push`；用户回复 `2`、取消或未明确选择时，不得执行 push。

7. 如果用户选择 `1` 且 `git push` 成功，必须继续询问下一步操作，并提供固定数字选项：

   ```text
   请选择：
   1. 执行 pnpm dy
   2. 创建 PR
   3. 取消
   ```

   - 用户选择 `1`：执行 `pnpm dy`；命令结束后如实展示结果，不得自动创建 PR。
   - 用户选择 `2`：继续询问目标 base 分支，并明确询问是否使用项目 PR workflow：`.claude/skills/workflow/git/create-pr/SKILL.md`。
   - 目标 base 分支也必须用数字选项确认，例如 `1. 使用 main`、`2. 使用 release/ssr`、`3. 使用 release/ssg`、`4. 自定义 base 分支`、`5. 取消`。
   - 用户确认使用项目 PR workflow 后，调用/遵循 `.claude/skills/workflow/git/create-pr/SKILL.md`，不得跳过其 base 确认、push 状态确认、PR 标题和正文确认、`gh pr create` 确认。
   - 用户选择 `3`、取消或未明确选择时，不得执行 `pnpm dy` 或创建 PR。

### hook 失败处理

若 pre-commit / commit-msg hook 失败：

- **不重试**、**不修改用户代码**、**不加 `--no-verify`**
- 完整展示 hook 错误输出
- 提示用户手动修复后重新执行

### import 清理规则（新增强制要求）

在生成 commit message 前，必须检查本次 commit 涉及的代码文件。

如果存在以下情况，必须先清理后再继续 commit：

- import 了但未使用的变量
- import 了但未使用的组件
- import 了但未使用的 hooks
- import 了但未使用的方法 / utils
- import 了但未使用的类型（TypeScript）
- import 了但未使用的对象 / 常量

包括但不限于：

- React / Next.js 组件
- hooks
- icons
- styled-components
- utils
- types
- enums
- constants
- services
- stores

处理要求：

1. 自动分析 diff 涉及文件中的未使用 import
2. 删除无用 import，避免 eslint / ts 报错
3. 删除后重新检查，确保不存在 unused import
4. 完成清理后，再继续生成 commit message

禁止：

- 为了保留 import 而伪造变量使用
- 使用 `_xxx` 等方式绕过 unused 校验
- 添加无意义代码仅用于消除 lint

> **不传 `--fast`** → 走下方默认 3 步交互流程；即使 `$ARGUMENTS` 为空，也必须先展示当前状态并确认暂存范围。

## 执行流程（逐步确认，默认模式）

触发条件：`$ARGUMENTS` 为空、只包含空白字符、只包含 `--no-verify`，或包含不带 `--fast` 的普通提交说明时，全部进入本流程。

每一步必须展示结果并等待用户确认后才能继续，**禁止自动跳到下一步**。

> **问询规范**：每个问询步骤必须给出编号默认选项供用户快速选择（回复数字即可），同时允许用户自由回复自定义内容。

### 步骤 1：展示当前状态 → 等用户确认暂存范围

运行 `git status --short`，向用户展示：

- 已暂存的文件（`M ` / `A ` / `D `）
- 未暂存的修改（` M` / ` D`）
- 未追踪的文件（`??`）

**→ 停下，问用户**：这些文件哪些要提交？是否需要额外 `git add`？

- staged 为空 → 提示没有暂存的变更
- 有未暂存的修改 → 列出来，问是否一并暂存
- 用户确认后，执行 `git add`（如需要）

**默认选项**：

1. 只提交已暂存的文件
2. `git add -A` 全部暂存后提交
3. 指定文件（请列出文件名）
4. 取消本次 commit

### 步骤 2：展示变更内容 → 等用户确认提交范围

运行 `git diff --cached --stat`、`git diff --cached` 和 `git diff --cached --name-only`，向用户展示将要提交的变更概览、详情和文件列表。禁止再用 `grep | wc -l` 这类管道命令统计 TS/TSX 文件数量；如需判断是否含 TS/TSX，直接根据文件列表人工判断。

### 步骤 3：生成 commit message → 等用户确认或修改

按下方规范生成 commit message，完整展示给用户。

**→ 停下，等用户确认**：message 是否 OK，用户可以要求修改 `type/scope/subject/body` 的任何部分。

**默认选项**：

1. 确认，执行 commit
2. 修改 type
3. 修改 scope
4. 修改 subject
5. 修改 body（原因/方案/范围）
6. 完全重写
7. 取消本次 commit

用户明确确认后才执行 `git commit`。

提交完成后，必须先展示完整 commit message 和 `git log -1 --oneline` 结果。

然后询问用户是否执行 push 操作，并提供固定数字选项：

```text
请选择：
1. 执行 push 操作
2. 取消
```

仅当用户明确回复 `1` 时，才执行 `git push`；用户回复 `2`、取消或未明确选择时，不得执行 push。

如果用户选择 `1` 且 `git push` 成功，必须继续询问下一步操作，并提供固定数字选项：

```text
请选择：
1. 执行 pnpm dy
2. 创建 PR
3. 取消
```

- 用户选择 `1`：执行 `pnpm dy`；命令结束后如实展示结果，不得自动创建 PR。
- 用户选择 `2`：继续询问目标 base 分支，并明确询问是否使用项目 PR workflow：`.claude/skills/workflow/git/create-pr/SKILL.md`。
- 目标 base 分支也必须用数字选项确认，例如 `1. 使用 main`、`2. 使用 release/ssr`、`3. 使用 release/ssg`、`4. 自定义 base 分支`、`5. 取消`。
- 用户确认使用项目 PR workflow 后，调用/遵循 `.claude/skills/workflow/git/create-pr/SKILL.md`，不得跳过其 base 确认、push 状态确认、PR 标题和正文确认、`gh pr create` 确认。
- 用户选择 `3`、取消或未明确选择时，不得执行 `pnpm dy` 或创建 PR。

如果 `pre-commit` hook 失败，必须：

1. 识别报错的文件路径
2. 识别具体的错误行号与列号
3. 提取对应的规则名称或错误类型
4. 清晰总结问题原因
5. 提供可执行的修复建议
6. 以结构化格式输出结果

**默认选项**：

1. 按提示修复后重新提交
2. 取消本次 commit

## 格式

```
<type>(<scope>): <subject>

<body>

<footer>
```

## Type（必填，小写）

| type     | 说明                        |
| -------- | --------------------------- |
| feat     | 新功能                      |
| fix      | 修复缺陷                    |
| docs     | 文档变更                    |
| style    | 代码格式（不影响功能）      |
| refactor | 代码重构（不含新功能/修复） |
| perf     | 性能优化                    |
| test     | 测试相关                    |
| build    | 构建流程或外部依赖变更      |
| ci       | 持续集成流程                |
| chore    | 杂项、工具等非业务代码变更  |
| config   | 配置文件                    |
| script   | 脚本相关                    |
| revert   | 回滚提交                    |

## Scope（必填）

变更影响的模块/目录/包名，小写，多词用连字符连接。

常见 scope 参考（非强制枚举）：

- `bydfi-ssg` / `bydfi-ssr` — 具体 app
- `apps-kit` / `apps-ui` / `apps-icons` / `apps-base-kline` — 共享包
- `config` / `ci` / `build` — 基础设施

## Subject（必填）

- <= 80 字符
- 简明描述变更内容
- 禁止 sentence-case、start-case、PascalCase、UPPER_CASE
- 不以句号结尾

## Body（必填）

body 必须包含以下三个关键词（每个至少出现一个变体）。

对于 200 行以上或 50 个以上文件的大变更，body 仍然只使用以下三段，不新增 `Context`、`Approach`、`Changes`、`Impact` 标题；但每段必须包含足够细节，推荐使用 bullet 分行说明，确保 body 至少 4 个非空行以通过 Commit Quality Check。

| 关键词类别 | 可接受的变体                                       |
| ---------- | -------------------------------------------------- |
| 原因       | `原因`、`修复原因`、`修改原因`、`变更原因`、`背景` |
| 方案       | `方案`、`处理方案`、`解决方案`、`实现方案`         |
| 范围       | `范围`、`影响范围`、`影响模块`、`影响组件`         |

commit-msg hook 会用以下正则检查 body，三个关键词缺任何一个都会被 hook 拒绝：

| 关键词 | 正则                                         |
| ------ | -------------------------------------------- |
| 原因   | `(原因\|修复原因\|修改原因\|变更原因\|背景)` |
| 方案   | `(方案\|处理方案\|解决方案\|实现方案)`       |
| 范围   | `(范围\|影响范围\|影响模块\|影响组件)`       |

**格式要求**：body 的三段之间**不要留空行**（连续写），只在 body 整体和 footer 之间留一个空行。原因是 `conventional-changelog-conventionalcommits` parser 会把空行后的 `关键词：内容` 单行解析为 footer token，导致 commitlint 报 `body-empty`。

## 语言

中文撰写，技术术语保持英文。

## 自动跳过校验

以下 commit 自动跳过所有校验：

- 首行以 `Merge ` 开头的 merge commit
- 首行以 `Revert "` 开头的 revert commit

## 示例

```
fix(apps-kit): 修复弱网环境下登录按钮无响应问题

修改原因：用户在弱网环境下点击登录时，因网络延迟未及时反馈，导致用户重复点击或认为系统卡死。
处理方案：登录请求发起时立即设置按钮为 loading 状态；增加 10s 请求超时处理，超时后自动重置按钮状态。
影响范围：登录页、注册页公用的提交按钮组件。

Co-authored-by: Claude (claude-opus-4-6)
```

$ARGUMENTS
