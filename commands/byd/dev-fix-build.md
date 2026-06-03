---
allowed-tools: Read, Write, Edit, Grep, Glob, Bash
argument-hint: <构建命令或错误输出>
description: 最小改动修复 BYDFi Next.js / React / TypeScript 构建与类型错误
author: Nilu
---

# BYDFi Next.js 构建修复

请按 `skills/dev/nextjs-dev/SKILL.md` 的“构建修复”流程执行，并将 `$ARGUMENTS` 作为错误输入。

## 执行要求

- 只修复构建、类型、hydration、server/client boundary、alias 等错误。
- 最小改动，不借机重构。
- 不修改 tsconfig / ESLint 规则来绕过问题。
- 不使用 `any` 掩盖真实类型错误。
- 修复后运行对应 tsc/build 命令或说明未运行原因。
