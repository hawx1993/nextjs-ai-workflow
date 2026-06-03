---
name: bydfi-codegen-ssg
description: bydfi-web 项目的 SSG/React/Next.js 代码生成工作流。用于新建组件、编写功能代码时组织实现步骤；硬性编码规范统一引用 .claude/rules。
allowed-tools: Bash, Read, Write, Glob, Grep, Agent
---

# BYDFi SSG / React 代码生成 Skill

本 skill 描述“如何完成一次代码生成 / 功能实现”。必须遵守的编码规范已迁移到 `.claude/rules`，不要在本 skill 中重复维护规则。

## 参数

通过 `$ARGUMENTS` 可指定目标生成目录或需求说明，例如：

```bash
/byd-next:codegen-ssg apps/byd-ssg/src/pages/xxx 新增某功能
```

## 执行前必须读取的 rules

按场景读取并遵守：

- `.claude/rules/nextjs.md`：页面、路由、数据流、SSG/SSR/client-only 边界、API、本地存储、core 复用。
- `.claude/rules/react-tsx.md`：组件、hooks、组件库封装、状态、列表 key、代码质量。
- `.claude/rules/typescript.md`：类型、安全计算、命名、alias、金融计算。
- `.claude/rules/prototype.md`：涉及 `Number` / `String` 全局扩展、金融链式计算、数字格式化时读取。
- `.claude/rules/monorepo.md`：共享包影响、workspace 验证。
- `.claude/rules/verification.md`：验证命令与交付格式。

## 执行流程

1. **明确目标**
   - 确认目标 app / package。
   - 确认目标目录、路由、组件层级。
   - 判断是否涉及 UI、i18n、theme、金融计算、共享包、React hooks 或可复用交互逻辑。

2. **查找可复用能力**
   - 先查同目录或相似页面实现。
   - 涉及请求、路由、本地存储、格式化、时间、脱敏、交易/金融计算时，按 `nextjs.md` 的 core 复用规则先查 `packages/apps-kit/core`。
   - 涉及 hooks、请求状态、路由、存储、倒计时、响应式、设备、主题、登录态、行情、钱包、WebSocket 时，先读 `.claude/knowledge/discovery-hooks.md`，不要默认生成 app-local `@/hooks/useXxx`。
   - 优先复用已有组件、hooks、utils、API，不重复实现平行逻辑。

3. **制定实现方案**
   - 复杂需求先说明实施步骤和影响范围。
   - 明确哪些文件会新增 / 修改。
   - 明确不做事项，如不改构建配置、不新增依赖、不扩大共享包改动。

4. **实现**
   - 按 rules 写代码。
   - 保持改动最小且贴合现有代码风格。
   - UI 样式使用 styled-jsx 与项目 CSS 变量。
   - 用户可见文案走 `LANG`。

5. **验证**
   - 按改动范围优先运行对应 tsc / lint。
   - 修改 TS/TSX 业务代码时优先运行：`pnpm tsc:all` 或对应 package tsc。
   - 未运行验证必须说明原因。

## 输出要求

```text
已完成：
- <改动 1>
- <改动 2>

验证：
- ✅/⚠️/❌ <命令或检查>：<结果或未运行原因>

影响范围 / 风险：
- <影响说明>

后续建议：
- <建议>
```
