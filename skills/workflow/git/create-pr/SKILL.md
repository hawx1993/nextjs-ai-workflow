---
name: bydfi-workflow-create-pr
description: 分析分支变更并创建规范 PR
disable-model-invocation: true
allowed-tools: Bash, Read, Glob, Grep
argument-hint: '[base 分支或留空]'
author: Nilu
---

# PR 规范

> **禁止自动创建**：未收到用户明确的 PR 指令时，不得执行 `gh pr create`。
> **禁止自动推送**：未收到用户明确的 push 指令时，不得执行 `git push`。
> **交互必须精简**：完整流程只允许 2 次用户确认，且每次都必须提供数字选项；用户只需输入数字即可继续。

## 执行流程（仅 2 步）

### 步骤 1：确认 base 分支

先根据 `$ARGUMENTS` 确认候选 base 分支：

- `$ARGUMENTS` 非空：候选 base = `$ARGUMENTS`
- `$ARGUMENTS` 为空：候选 base = `main`

运行以下命令收集信息，并用**简短摘要**展示给用户：

```bash
git rev-parse --abbrev-ref HEAD
git log --oneline <base>..HEAD
git diff <base>..HEAD --stat
git log --oneline HEAD..<base>
```

展示内容只保留：

- 当前分支
- 候选 base 分支
- ahead commit 数量和简要 commit 列表
- diff stat 摘要
- 是否落后 base（如 `git log HEAD..<base>` 非空，需要提示用户考虑 rebase）
- 是否有未提交变更（`git status --short`）

**不要在此步骤生成 PR body。**

然后停下，只提供数字选项：

```text
请选择：
1. 使用 <base> 继续（如果 `$ARGUMENTS` 非空，这里必须显示用户输入的参数名，例如：使用 ssr/nilu/tools 继续）
2. 改用其他 base 分支（请回复：2 <base-branch>）
3. 取消
```

处理规则：

- 用户选择 `1`：使用选项中显示的 `<base>` 进入步骤 2。
- 用户回复 `2 <base-branch>`：将 `<base-branch>` 作为新的 base，重新执行步骤 1 的检查并再次显示这 3 个数字选项。
- 用户选择 `3`：停止，不创建 PR。
- 如果 `<base>..HEAD` 无 commit：提示当前分支相对 base 无变更，不创建 PR。

### 步骤 2：内部生成 PR 内容 → 数字确认是否创建 PR

确认 base 后，内部完成以下检查和生成，**不要把完整 PR body 输出给用户**：

```bash
git rev-parse --abbrev-ref --symbolic-full-name @{u} 2>/dev/null
git rev-list --left-right --count @{u}...HEAD 2>/dev/null
gh auth status
gh pr view HEAD --json url 2>/dev/null
git log --format='%H%n%s%n%b%n---END---' <base>..HEAD
git diff --name-status <base>..HEAD
git diff --stat <base>..HEAD
git diff <base>..HEAD | grep "^+" | grep -E "(eslint-disable|@ts-ignore)" | grep -v "^+.*//"
```

根据检查结果内部生成：

- PR 标题
- PR body（按 `.github/PULL_REQUEST_TEMPLATE.md` 结构填写）
- 如当前分支未推送或本地领先远程，记录需要先执行的 push 命令：`git push -u origin HEAD`
- 如当前分支已有 open PR，记录 PR URL，并准备更新描述而不是重复创建
- Lark 通知 webhook：`https://open.larksuite.com/open-apis/bot/v2/hook/0ff5ffb6-ed5a-486e-aaec-3113655d3e18`，仅在 PR 创建或更新成功、已获得 GitHub PR 链接后调用

对用户只展示**最小摘要**：

- PR 标题
- base / head
- push 状态：已同步 / 需要 push / 无 upstream
- 已有 PR：有 / 无
- 验证摘要：只列已运行的轻量检查结果；未运行 `pnpm tsc:all`、`pnpm lint:all`、UI 矩阵时如实标注「未运行」
- 如有新增 `eslint-disable` 或 `@ts-ignore`、gh 未登录、分支落后 base 等阻塞/风险，必须在摘要中提示

**禁止输出完整 PR body**，除非用户后续明确要求查看或修改。

然后停下，只提供数字选项：

```text
请选择：
1. 创建 PR（如需要 push，选择 1 表示同意先执行 git push -u origin HEAD；如已有 PR，则更新 PR 描述）
2. 只生成内容，不创建 PR
3. 取消
```

处理规则：

- 用户选择 `1`：
  - 若需要 push，先执行 `git push -u origin HEAD`。
  - 若已有 open PR，执行 `gh pr edit` 更新标题和 body，然后获取并输出 PR URL。
  - 若没有 open PR，执行 `gh pr create --base <base> --head <head> --title <title> --body-file <tmpfile>`，创建后获取并输出 PR URL。
  - PR 创建或更新成功且获得 PR URL 后，按「Lark PR 通知规则」向 Lark webhook 推送 PR 链接。
- 用户选择 `2`：不创建 PR；只输出 PR 标题和 body 临时文件路径（或说明已生成但未创建），不要输出完整 body。
- 用户选择 `3`：停止，不创建 PR。
- 如果 `gh auth status` 失败：不要创建 PR，提示用户运行 `! gh auth login` 后重试。

## Lark PR 通知规则

PR 创建或更新成功后，通过 Lark 自定义机器人 webhook 推送通知到群。

**Webhook：**

```text
https://open.larksuite.com/open-apis/bot/v2/hook/0ff5ffb6-ed5a-486e-aaec-3113655d3e18
```

**触发时机：**


- 仅在 gh pr create 创建成功并获得 GitHub PR URL 后触发。
- 如果当前分支已有 open PR 且 gh pr edit 更新成功，也必须触发。
- 用户选择「只生成内容，不创建 PR」或「取消」时，不触发。
- 失败、未获得 PR URL 时，如实汇报，不得声称已通知。

**消息格式：富文本 post（推荐）**

使用 `post` 类型消息，支持可点击的超链接，在 Lark 群里直接点击跳转 PR 页面：

```json
# 变量（从前面步骤收集）：
# PR_TITLE  = PR 标题
# BASE      = base 分支名
# HEAD      = head 分支名
# PR_URL    = GitHub PR 完整链接，例如 https://github.com/org/repo/pull/42
# PR_NUMBER = PR 编号，例如 42（从 PR_URL 末尾提取）
# AUTHOR    = git config user.name 或 gh api /user --jq .login

curl -s -X POST \
  'https://open.larksuite.com/open-apis/bot/v2/hook/0ff5ffb6-ed5a-486e-aaec-3113655d3e18' \
  -H 'Content-Type: application/json' \
  -d "{
    \"msg_type\": \"post\",
    \"content\": {
      \"post\": {
        \"zh_cn\": {
          \"title\": \"🔀 BYDFi PR #${PR_NUMBER} 已创建\",
          \"content\": [
            [
              {\"tag\": \"text\", \"text\": \"标题：${PR_TITLE}\"}
            ],
            [
              {\"tag\": \"text\", \"text\": \"分支：${BASE} ← ${HEAD}\"}
            ],
            [
              {\"tag\": \"text\", \"text\": \"作者：${AUTHOR}\"}
            ],
            [
              {\"tag\": \"a\", \"text\": \"👉 查看 PR #${PR_NUMBER}\", \"href\": \"${PR_URL}\"}
            ]
          ]
        }
      }
    }
  }"
```

更新已有 PR 时，将标题改为 🔁 BYDFi PR #${PR_NUMBER} 已更新，其余字段不变。

** 简化备用格式：纯文本 text **

如果 post 格式调用失败（返回非 0 错误码），自动降级为纯文本重试一次：
```bash
curl -s -X POST \
  'https://open.larksuite.com/open-apis/bot/v2/hook/0ff5ffb6-ed5a-486e-aaec-3113655d3e18' \
  -H 'Content-Type: application/json' \
  -d "{
    \"msg_type\": \"text\",
    \"content\": {
      \"text\": \"🔀 BYDFi PR 已创建/更新\n标题：${PR_TITLE}\n分支：${BASE} ← ${HEAD}\n作者：${AUTHOR}\n链接：${PR_URL}\"
    }
  }"
```

## PR 内容生成规则

分析 `git log <base>..HEAD` 和 `git diff <base>...HEAD`，按 `.github/PULL_REQUEST_TEMPLATE.md` 结构生成完整 PR 内容。

**标题**：`type(scope): 简要描述`（70 字符以内，中文撰写，技术术语保持英文）

**Body** 逐段填写：

- **PR 类型**：根据变更内容勾选匹配的 type（与 commit type 对应）
- **修改范围**：根据 `git diff --stat` 涉及的目录勾选（与 PR 模板 `.github/PULL_REQUEST_TEMPLATE.md` 完全一致）：

  - 根目录文件（README、.gitignore 等）→ `repo - 仓库级维护`
  - 配置文件（.env、next.config.js、tsconfig.json 等）→ `config - 配置文件修改`
  - `.github/` → `ci - 持续集成配置`
  - `public/static/` → `static - 静态资源`
  - 构建脚本（scripts/）→ `build - 构建脚本或流程`
  - `scripts/` 工具 → `node - node/ 目录工具`
  - `apps/byd-ssg/` → `bydfi-ssg - 主站项目`
  - `apps/byd-ssr/` → `bydfi-ssr - SSR项目`
  - `packages/apps-kit/components/` → `apps-kit/components - 公用组件`
  - `packages/apps-kit/core/` → `apps-kit/core - 公用核心模块`
  - `packages/apps-base-kline/` → `apps-base-kline - 公共K线包`
  - `packages/apps-icons/` → `apps-icons - 公共icon包`
  - `packages/apps-ui/` → `apps-ui - 公用组件库`

  **注意**：PR 模板中的 Scope 名称不包含 `packages/` 前缀，映射时需去掉路径前缀

- **修改背景**：从 commit messages 的 body 中提取修改原因，合并为一段简要说明
- **主要变动**：逐条列出关键改动，每条一句话。从 `git log --oneline` 和 diff 中提炼，不要直接复制 commit message
- **影响范围**：根据改动的文件和逻辑判断影响的模块与功能，不生成「可能的影响」复选项
- **测试说明**：列出验证用的域名或本地端口、测试步骤（1-3 步）、测试结果。如未实际测试则如实说明「待测试」

**检查清单**：

逐项自查（与 `.github/PULL_REQUEST_TEMPLATE.md` 第 100-112 行保持一致）：

| 检查项                                  | 何时必须勾选            | 如何验证                 |
| --------------------------------------- | ----------------------- | ------------------------ |
| 黄色版本 & 深色/浅色模式                | UI 变更                 | 切换皮肤和模式查看       |
| 蓝色版本 & 深色/浅色模式                | UI 变更                 | 同上                     |
| 中东语言版本（RTL 布局）                | UI 变更                 | 切换到阿拉伯语查看       |
| 桌面端 / 平板端 / 移动端响应式          | UI 变更                 | 缩放浏览器窗口           |
| 三端页面抖动问题                        | UI 变更                 | 快速切换页面观察         |
| 接口请求次数（无多余请求）              | 涉及 API 调用           | DevTools Network 面板    |
| 页面 title 和 meta 元素                 | 涉及页面路由/SEO        | 查看 `<head>`            |
| 页面 CPU 占用                           | 涉及动画/轮询/WebSocket | DevTools Performance     |
| 页面 localStorage 内存占用              | 涉及本地存储            | DevTools Application     |
| `pnpm tsc:all` 类型检查通过             | **所有 PR**             | 运行 `pnpm tsc:all` 确认 |
| 共享包改动已检查所有 app 影响           | 改了 packages/          | 确认三个 app 不受影响    |
| 无新增 `eslint-disable` 或 `@ts-ignore` | **所有 PR**             | 见轻量检查命令           |
| CodeReview 检查清单已完成               | **所有 PR**             | 自查代码质量             |

**如果任何检查失败**：

- 在步骤 2 的最小摘要中提示用户存在错误或风险
- 如果用户仍选择 `1` 创建 PR，需要在对应检查项或测试结果中标注失败/未通过信息

**多 commit 类型选择指导**：

- 如果分支包含多个不同类型的 commit（如 feat + fix），以**主要变更类型**为准（按代码变更量或业务重要性判断）
- 如果无法确定主次，在 PR 标题中使用最主要的类型，并在「主要变动」中明确说明包含多种类型的变更
- **禁止**使用「涵盖范围最广的类型」这种模糊做法，必须明确主次

## 分支命名规范

创建 PR 时，**先检查当前分支名是否合规**，不合规要在步骤 2 最小摘要中提示用户。

| 类型           | 格式                           | 示例                     |
| -------------- | ------------------------------ | ------------------------ |
| 主分支         | `main`                         | `main`                   |
| 主分支修改分支 | `main/{人名}/{需求简述}`       | `main/steve/aaaaa`       |
| 项目同步分支   | `release/ssg` \| `release/ssr` |
| 版本发布分支   | `{项目}/{版本标识}`            | `ssg/04.20`、`ssr/2.1.0` |
| 个人功能分支   | `{项目}/{人名}/{需求简述}`     | `ssg/steve/swap-spsl`    |

**有效项目前缀**：`main`、`release`、`ssg`、`ssr`、`ui`

**分支命名验证规则**：

- `main/*` → 第二段必须是人名，第三段是需求简述
- `release/*` → 第二段只允许 `ssg`、`ssr`
- `{ssg|ssr|ui}/*` → 第二段是人名或版本号

**不合规模式**（已发现，创建 PR 时遇到需提示）：

| 不合规分支                                                 | 违规原因                                                              |
| ---------------------------------------------------------- | --------------------------------------------------------------------- |
| `main-*`（如 `main-claude`、`main-nex-theme`）             | 应使用 `main/{人名}/{需求}` 格式，`main-` 连字符变体不合规            |
| `{人名}/{需求}`（如 `steve/sdijsod`）                      | 缺少项目前缀，应为 `{项目}/{人名}/{需求}`                             |
| `release/{非标准}`（如 `release/ssr-new`、`release/main`） | `release/` 后只允许 `ssg`、`ssr`                                      |
| `{非项目前缀}/*`                                           | 前缀必须是 `main`/`release`/`ssg`/`ui`，第二段若非人名/版本则格式模糊 |

## 语言

中文撰写，技术术语保持英文。

## 破坏性变更处理

如果 commit 包含破坏性变更（BREAKING CHANGE）：

1. **标题格式**：`type(scope)!: 简要描述`（注意 `!` 标记）
2. **PR 标题**：在标题末尾添加 `[BREAKING CHANGE]` 前缀
3. **PR Body**：在「修改背景」后添加独立章节：

```markdown
## ⚠️ 破坏性变更

**受影响的功能/接口：**

- **迁移指南：**

- **回滚方案：**

-
```

## 边界情况

- **无 commit**：`git log <base>..HEAD` 为空 → 提示用户当前分支无变更，不创建 PR
- **分支落后 base**：`git log HEAD..<base>` 有 commit → 在步骤 1 和步骤 2 摘要中提示用户考虑 rebase
- **gh CLI 未登录**：`gh auth status` 失败 → 提示用户运行 `! gh auth login`
- **已有 PR**：当前分支已有 open PR → 步骤 2 中提示将更新而非重复创建

$ARGUMENTS
