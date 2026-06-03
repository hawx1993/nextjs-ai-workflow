---
allowed-tools: Bash(gh pr view:*), Bash(gh pr diff:*), Bash(gh pr list:*)
argument-hint: '<PR号，必填，例如: 42>'
description: 按团队规范深度 Review GitHub PR，输出结构化报告
author: Nilu
---

# PR Code Review Task

PR 号为：$ARGUMENTS

请按以下步骤执行：

## Step 1：获取 PR 信息

运行以下命令获取 PR 信息（将 $ARGUMENTS 替换为实际 PR 号）：

- 运行 `gh pr view $ARGUMENTS --json title,body,author,baseRefName,headRefName,additions,deletions,changedFiles`
- 运行 `gh pr diff $ARGUMENTS`
- 运行 `gh pr view $ARGUMENTS --json files`

## Step 2：按规范 Review

拿到上面的数据后，按照以下规范进行 Review：

### 代码质量

- 函数/方法单一职责，不超过 150 行
- 没有重复代码（DRY 原则）
- 变量/函数命名清晰
- 没有硬编码的魔法数字或字符串

### 安全性

- 没有敏感信息（API Key、密码、Token）被提交
- 用户输入有适当的验证和转义
- 没有 SQL 注入风险
- 权限校验逻辑正确

### 性能

- 没有明显的 N+1 查询问题
- 循环内没有不必要的异步请求
- 大数据集有分页处理
- 组件不得出现渲染死循环或者代码死循环

### 需要修改

1. Image 组件使用 `next/image` 组件，而不是 `@/components/image` 组件
2. 文件名必须使用 kebab-case 命名，禁止使用 camelCase 命名
3. 禁止直接使用 img 标签，必须使用`@/components/image` 组件
4. Image 组件禁止 直接 import from 'next/image'，必须使用`@/components/image` 组件
5. LANG 必须用在组件或 hooks 内部，禁止用在其他地方
6. 代码中禁止出现硬编码和文案硬编码
7. 单文件组件禁止出现超出 500 行，需要考虑抽离
8. 颜色尽量不出现硬编码，需要使用`--nex`或者`--spec`或者`--skin`变量开头
9. 禁止出现没有被使用到的样式,例如 DOM 不存在该 className，但 css 中存在该样式

### 不通过

1. 所有的`components` 目录禁止 import `src/pages` 目录下的文件，只允许 pages import 其他目录的文件
2. 禁止发生循环引用
3. DOM 中禁止出现`isMobile`,`isTablet`,`isDesktop`等响应式相关变量, 这些变量只允许在 js 中出现

## Step 3：输出报告

严格按照以下格式输出：

`## 输出位置` — `reports/YYYY-MM-DD/<filename>.md`（reports/ 已 gitignore）

---

# 🔍 PR Review Report

## 📋 PR 概览

- **标题**：[PR 标题]
- **作者**：[作者]
- **改动**：+[新增行数] / -[删除行数]，涉及 [N] 个文件
- **分支**：`[源分支]` → `[目标分支]`

## 🎯 总体评价

[2-3 句总结，给出 ✅ 通过 / ⚠️ 需要修改 / ❌ 不通过]

## 🚨 必须修改（Blocking Issues）

| #   | 文件 | 行号 | 问题描述 | 建议修改 |
| --- | ---- | ---- | -------- | -------- |

## ⚠️ 建议修改（Non-blocking）

| #   | 文件 | 行号 | 问题描述 | 建议修改 |
| --- | ---- | ---- | -------- | -------- |

## ✅ 做得好的地方

- [值得表扬的实践]

## 📊 Checklist

| 维度     | 状态     | 备注 |
| -------- | -------- | ---- |
| 代码质量 | ✅/⚠️/❌ |      |
| 安全性   | ✅/⚠️/❌ |      |
| 性能     | ✅/⚠️/❌ |      |
