---
allowed-tools: Skill
argument-hint: <base-branch> <target-branch>
description: 发版前代码质量检查并生成风险报告
author: Nilu
---

# 发版前代码质量检查并生成风险报告

请使用 Skill 工具调用 `.claude/skills/workflow/pre-release/SKILL.md`，并将 `$ARGUMENTS` 原样作为参数传入。

## 参数

- 建议传入两个分支：`<base-branch> <target-branch>`。
  - 基准分支：上一版本或目标合流基线，例如 `release/ssg`、`release/ssr`。
  - 目标分支：当前待发版分支，例如 `ssg/steve/test0420`，也可以是 `HEAD`。
- 如果 `$ARGUMENTS` 未提供完整对比范围，先询问用户：
  1. 基准分支名称（上一版本）。
  2. 目标分支名称（当前版本，默认 `HEAD`）。

## 执行要求

- 必须加载并遵循对应 skill 的完整规则。
- 仅审查两个分支之间变化的 `.ts` / `.tsx` / `.js` / `.jsx` 相关文件。
- 获取变更文件时按 skill 规则过滤：
  - 生成文件：`*.g.ts`、`*.g.tsx`、`*.d.ts`。
  - 第三方库：`node_modules/`。
  - 静态资源库：`public/static/` 下的第三方库文件，例如 `charting_library`。
  - 构建产物：`.next/`、`out/`。
- 覆盖以下发版风险检查：
  - 文案硬编码与 `LANG()` 国际化缺失。
  - React effect、事件监听、订阅、WebSocket、定时器等内存泄漏风险。
  - TypeScript / React 命名规范。
  - undefined / null 访问与数组越界等空指针风险。
  - 金融金额、价格、数量计算是否避免原生浮点运算，并使用项目 `Number` / `String` prototype 链式方法或 `BN` / `bignumber.js`。
  - SSR / SSG 数据获取、错误处理、`revalidate` 与动态路由覆盖。
  - 组件误用，例如 index key、Image 尺寸、Modal 销毁、表单 name 等。
  - 新增页面路由注册与 `[locale]` 路由结构。
  - 依赖版本精确锁定、新增依赖审批、版本一致性与 lockfile 变化。
  - React Hooks 依赖数组完整性与不稳定引用问题。
- 输出报告到 `reports/YYYY-MM-DD/byd-web-report-pre-release-YYYY-MM-DD.md`。
- 报告必须按严重程度分组：
  - 🚨 阻断问题：必须修复，例如金融计算错误、明确内存泄漏。
  - ⚠️ 警告问题：建议修复，例如 i18n、空指针、Hooks、SSR/SSG、组件使用问题。
  - 📋 信息问题：可选修复，例如命名规范。
  - 📦 需人工审批：依赖变更等。
  - ✅ 通过检查：明确通过的检查项。
- 文件引用使用 Markdown 链接格式，包含路径和行号，便于 IDE 点击跳转。
- 所有结论基于静态分析；无法确认的运行时问题必须标注为需人工复核，不得写成确定问题。
- 执行后如发现误判或漏判场景，需要在报告末尾记录是否需要更新 skill 规则。
