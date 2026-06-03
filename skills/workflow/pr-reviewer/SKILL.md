---
name: bydfi-workflow-pr-reviewer
description: 使用项目专属技能规则自动审查 GitHub Pull Request，获取 diff，读取变更文件上下文，基于项目技能执行 AI 审查，并向 GitHub 发布行内评论和汇总评论。
disable-model-invocation: true
allowed-tools: Bash, Read, Glob, Grep, Agent
argument-hint: <PR号，必填，例如: 42>
author: Nilu
---

# GitHub PR 审查器

该技能用于审查 GitHub Pull Request，流程包括：
1. 通过 GitHub API 获取 PR diff
2. 为每个变更文件读取完整文件上下文
3. 根据所有已启用的项目技能（例如 `nextjs-design-system`）审查每个文件
4. 向 GitHub 发布行内审查评论
5. 向 PR 发布整体汇总评论

---

## 前置条件

运行前，确认用户已提供：

- 具备 `repo` scope 的 GitHub Personal Access Token（公开仓库可使用 `pull_requests:write`）
- `owner/repo` 格式的目标仓库
- PR 编号

如果缺少任意信息，先向用户询问，再继续执行。

---

## 步骤 1 — 加载项目技能

读取项目根目录 `.claude/skills/` 下的所有技能文件。该目录中的每个 `.md` 文件都是一组项目规则。将它们的内容拼接成单个 `SKILL_CONTEXT` 字符串，并注入到每个审查 prompt 中。

```
SKILL_CONTEXT = contents of all .claude/skills/*.md files joined with "\n\n---\n\n"
```

如果 `.claude/skills/` 不存在，告知用户，并询问是否只使用通用最佳实践继续审查（不使用项目专属规则）。

---

## 步骤 2 — 获取 PR 元数据

```
GET https://api.github.com/repos/{owner}/{repo}/pulls/{pr_number}
Authorization: token {GITHUB_TOKEN}
```

提取并展示给用户：
- PR 标题、作者、base 分支
- 变更文件数量、总新增/删除行数
- Head commit SHA（行内评论需要使用）

---

## 步骤 3 — 获取变更文件和 diffs

```
GET https://api.github.com/repos/{owner}/{repo}/pulls/{pr_number}/files?per_page=100
```

对每个文件收集：
- `filename` — 相对仓库根目录的路径
- `status` — added / modified / removed / renamed
- `patch` — unified diff（git diff 格式）
- `additions`、`deletions`

跳过以下文件：
- `status` 为 `removed`（无内容可审查）
- 文件名匹配测试文件模式：`*.test.ts`、`*.spec.tsx`、`__tests__/*`、`*.test.js` — 除非用户明确要求审查测试文件

---

## 步骤 4 — 获取完整文件上下文

对每个非删除文件，获取 head commit 下的完整文件内容：

```
GET https://api.github.com/repos/{owner}/{repo}/contents/{filename}?ref={head_sha}
```

响应中包含 base64 编码的内容，需要解码。如果内容超过 4000 字符，则截断（保留文件顶部和包含 diff 的片段）。

这些上下文能让 AI 理解 imports、类型、组件结构和现有模式，而不仅仅是孤立的变更行。

---

## 步骤 5 — 使用 AI 审查每个文件

对每个变更文件，按以下 prompt 结构调用 Anthropic API：

### System prompt

```
你是一名资深代码审查员，负责执行项目特定的规则。


## 项目技能规则
{SKILL_CONTEXT}

## 审查说明
- 仅关注 diff 中显示的变更行（以 + 开头的行）。
- 利用完整文件上下文理解周边代码，但不要对未变更的行发表评论。
- 对于发现的每个问题，需指明：严重级别、具体代码行或模式，以及具体的修复方案。
- 严重级别定义：
    [CRITICAL]   — Bug、安全问题或直接违反强制性技能规则
    [WARNING]    — 潜在问题、风格违规或反模式
    [SUGGESTION] — 可选改进、可读性优化或次要偏好
    [LGTM]       — 未发现问题；简要说明代码为何看起来良好
- 输出格式为 GitHub Markdown 评论。
- 保持简洁。每个文件最多 250 字。优先使用项目符号列表。
- 不要复述 diff 内容。仅通过变量名或函数名引用代码。
- 如果文件中没有值得评论的变更行，请精确输出：SKIP
```

### User message

```
文件: {filename}
语言: {根据扩展名检测}
变更类型: {status}

=== GIT DIFF ===
{patch}

=== 完整文件上下文 (head) ===
{full_file_content, 截断至4000字符}
```

### 解析响应

- 如果响应为 `SKIP` → 不为该文件发布评论
- 如果响应仅包含 `[LGTM]` → 记录为 LGTM，不发布行内评论（仅汇总到 summary）
- 否则 → 作为行内审查评论发布（步骤 6）

---

## 步骤 6 — 向 GitHub 发布行内评论

对每个存在非 SKIP、非 LGTM 审查结果的文件：

```
POST https://api.github.com/repos/{owner}/{repo}/pulls/{pr_number}/comments
Authorization: token {GITHUB_TOKEN}
Content-Type: application/json

{
  "body": "🤖 **AI Code Review**\n\n{review_text}\n\n---\n*Skills applied: {skill_names}*",
  "commit_id": "{head_sha}",
  "path": "{filename}",
  "position": {last_added_line_position}
}
```

### 计算 `position`

`position` 字段是 **diff hunk 内** 的 1-based 行号，不是文件行号。逐行遍历 `patch`：
- 统计每一行（包括 `@@` 头部和上下文行）
- 记录最后一个以 `+` 开头的行的位置（不包括 `+++`）
- 使用该位置作为 `position`

如果 position 计算失败，则回退为发布 PR 级别的 issue 评论：

```
POST https://api.github.com/repos/{owner}/{repo}/issues/{pr_number}/comments
```

---

## 步骤 7 — 发布整体汇总评论

所有文件审查完成后，生成汇总并作为 PR issue 评论发布。

### Summary prompt

```
你正在为 PR 作者总结代码审查结果。请保持直接且富有建设性的语气。


已审查的文件及结果：
{文件名列表 → 每个文件的审查结果}

请撰写一段 3–5 句的总结，涵盖以下内容：

1、总体印象
2、最关键的问题（如有）
3、做得好的地方
4、建议的后续步骤


然后输出一个 Markdown 表格：

| Category | Count |
|---|---|
| ✅ LGTM | N |
| 💡 Suggestions | N |
| ⚠️ Warnings | N |
| 🔴 Critical | N |
```

发布汇总：

```
POST https://api.github.com/repos/{owner}/{repo}/issues/{pr_number}/comments

{
  "body": "## 🤖 AI Code Review Summary\n\n{summary}\n\n---\n*Reviewed with project skills: {skill_names}. Powered by Claude.*"
}
```

---

## 步骤 8 — 向用户汇报

所有评论发布完成后，向用户展示：

```
✅ PR #{pr_number} 审查完成：{pr_title}

已审查文件：     {N}
已发布评论：     {N}
  🔴 Critical:    {N}
  ⚠️  Warnings:   {N}
  💡 Suggestions: {N}
  ✅ LGTM:        {N}

应用的技能：{skill_names}
PR 链接：https://github.com/{owner}/{repo}/pull/{pr_number}
```

---

## 错误处理

| 错误 | 处理方式 |
|---|---|
| 401 Unauthorized | 告知用户 token 无效或缺少 `repo` scope |
| 403 Forbidden | 告知用户 token 缺少 `pull_requests:write` 权限 |
| 404 Not Found | 确认仓库名和 PR 编号是否正确 |
| `position` out of range | 回退为 PR 级别评论（不发行内评论） |
| File content fetch fails | 该文件继续使用 diff-only 审查，并在日志中说明 |
| Rate limit (403 + `X-RateLimit-Remaining: 0`) | 告知用户等待，并展示 `X-RateLimit-Reset` header 中的重置时间 |

---

## 配置选项

开始前可接受以下用户可选输入：

| 选项 | 默认值 | 说明 |
|---|---|---|
| Skip test files | true | 跳过 `*.test.*`、`*.spec.*`、`__tests__/` |
| Post inline comments | true | 向 GitHub 发布逐文件评论 |
| Post summary comment | true | 向 PR 发布整体汇总评论 |
| Read full file context | true | 获取完整文件，而不仅仅是 diff |
| Skills path | `.claude/skills` | 项目技能文件路径 |
| Max files | 30 | 最多审查 N 个文件，避免触发 rate limit |

---

## 行内评论示例

```markdown
🤖 **AI Code Review**

- [CRITICAL] 第 +14 行的 `<img src={src} />` — 必须使用项目自定义 `Image`
  组件：`import Image from '@/components/image'`。原生 `<img>` 会绕过优化。

- [WARNING] 第 +22 行的硬编码颜色 `color: '#333'` — 根据设计系统 token 规则，
  应使用 `var(--spec-font-color-1)`。

- [SUGGESTION] 建议将内联 style 对象抽取到 `styled-jsx` 块中，
  以保持该组件与代码库其他部分一致。

---
*Skills applied: nextjs-design-system*
```

## 汇总评论示例

```markdown
## 🤖 AI Code Review Summary

该 PR 新增了 `UserCard` 组件，并更新了 `ProfilePage` 布局。
整体逻辑合理，但存在两个必须在合并前修复的关键设计系统违规：
一个原生 `<img>` 标签和硬编码颜色值。`fetchUser.ts` 中的 API 集成较清晰，
并遵循了现有模式。

| Category | Count |
|---|---|
| ✅ LGTM | 3 |
| 💡 Suggestions | 2 |
| ⚠️ Warnings | 1 |
| 🔴 Critical | 2 |

---
*Reviewed with project skills: nextjs-design-system. Powered by Claude.*
```
