# BYDFi Next.js + React + TSX AI Workflow 最佳实践

本文档参考 ECC 的分层思想：**agents 负责角色分工，commands 负责入口编排，skills 负责可复用流程，rules 负责硬约束，hooks 负责自动提醒与安全护栏**。本项目只落地 Next.js + React + TSX 相关开发工作流。

## 1. 分层模型

```text
用户需求
  ↓
commands/byd/dev-*        # 日常入口，降低选择成本
  ↓
skills/workflow/nextjs-*    # 可复用流程，统一输出格式
  ↓
agents/*.md                 # 专职角色：架构、实现、审查、构建修复、验证
  ↓
rules/*.md                  # 技术规则：Next、React、TS、monorepo、i18n、theme、verification
  ↓
hooks/*.mjs                 # 自动护栏：危险命令阻断，TSX 质量提醒
```

## 2. 日常开发主流程

### 2.1 新需求

```text
/byd-next:dev-plan 说明需求、目标页面、期望交互、涉及 app
```

AI 应输出：

- 需求复述
- 影响范围
- 涉及文件
- 需要遵守的 rules
- 实施步骤
- 验证策略

确认方案后再执行：

```text
/byd-next:dev-implement apps/byd-ssg/src/pages/xxx/index.page.tsx 按已确认方案实现
```

完成后执行：

```text
/byd-next:dev-review apps/byd-ssg/src/pages/xxx/index.page.tsx
/byd-next:dev-verify apps/byd-ssg/src/pages/xxx/index.page.tsx
```

### 2.2 Bug 修复

```text
/byd-next:dev-plan 修复 xxx 页面在 RTL 下按钮错位的问题，范围限定 apps/byd-ssg
/byd-next:dev-implement <确认后的文件路径和修复说明>
/byd-next:dev-review <文件路径>
/byd-next:dev-verify <范围>
```

Bug 修复必须说明：

- 根因
- 修复点
- 为什么不会影响其他主题/语言/端
- 运行了哪些验证

### 2.3 构建 / 类型错误

```text
/byd-next:dev-fix-build 粘贴 tsc 或 build 错误输出
```

规则：

- 只做最小修复，不借机重构。
- 优先修类型、import、server/client boundary、alias 解析。
- 修复后至少运行对应 tsc 命令；如果耗时或环境阻塞，必须说明。

### 2.4 代码审查

```text
/byd-next:dev-review 当前 diff
/byd-next:dev-review apps/byd-ssr/src/pages/xxx/index.page.tsx
```

审查维度：

- React hooks 与渲染性能
- TS 类型与 `any` 扩散
- `LANG` 与硬编码文案
- 主题变量与硬编码颜色
- SSR/SSG 边界
- 金融计算 BigNumber
- 可访问性与 RTL
- 验证覆盖

### 2.5 最终验证

```text
/byd-next:dev-verify 当前改动
```

默认验证建议：

```bash
pnpm tsc:all
pnpm lint:all
```

如只改某个 app，可使用更小范围：

```bash
pnpm tsc:check:ssg
pnpm tsc:check:ssr
pnpm eslint:check
```

UI 改动还需要人工或浏览器验证：

- 黄色 / 蓝色
- 深色 / 浅色
- RTL / LTR
- PC / Tablet / Mobile

## 3. Commands：入口最少化

日常只记 5 个：

| 命令                 | 用途                    |
| -------------------- | ----------------------- |
| `/byd-next:dev-plan`      | 规划，不改代码          |
| `/byd-next:dev-implement` | 实现，限 Next/React/TSX |
| `/byd-next:dev-review`    | 审查 diff 或文件        |
| `/byd-next:dev-fix-build` | 修构建/类型错误         |
| `/byd-next:dev-verify`    | 验证与汇报              |

专项命令继续保留：

- 审计类：`/byd-next:audit-*`
- 代码生成类：`/byd-next:codegen-*`
- Git/PR 类：`/byd-next:workflow-git-*`
- 发布前类：`/byd-next:workflow-pre-release`

## 4. Agents：角色分工

| Agent                        | 何时使用                                                    |
| ---------------------------- | ----------------------------------------------------------- |
| `nextjs-architect`           | 需求涉及页面结构、SSG/SSR、跨 app/package 影响              |
| `react-tsx-implementer`      | 实现 React/TSX 组件、页面、交互                             |
| `react-tsx-reviewer`         | 审查 React hooks、TSX、i18n、theme、性能                    |
| `nextjs-build-resolver`      | 修复 Next/TS 构建、hydration、alias、server/client 边界错误 |
| `frontend-quality-validator` | 最终验证与风险汇总                                          |

Agent 是“角色说明书”，不是替代规则。执行时仍必须遵守 `rules/*`。

## 5. Skills：可复用流程

| Skill                    | 用途               |
| ------------------------ | ------------------ |
| `dev/nextjs-dev`    | 日常开发主流程     |
| `dev/nextjs-review` | React/TSX 审查流程 |
| `workflow/nextjs-verify` | 验证与汇报流程     |

既有审计 skill 仍作为专项能力：

- `audit/i18n`
- `audit/theme`
- `audit/security`
- `audit/dead-code`
- `audit/dead-deps`
- `audit/pre-release`

## 6. Rules：不可违反的项目约束

开发前按场景读取：

- 页面/路由/数据流：`rules/nextjs.md`
- 组件/hooks：`rules/react-tsx.md`
- 类型/计算/import：`rules/typescript.md`
- 跨包共享：`rules/monorepo.md`
- 文案：`rules/language.md`
- 样式：`rules/theme.md`
- 验证：`rules/verification.md`

## 7. Hooks：提醒优先的自动护栏

默认策略：

- **阻断**：危险命令、未经确认的新增依赖。
- **提醒**：TSX 硬编码文案、硬编码颜色、`console.log`、`LANG` 可疑用法。

这样做的原因：

- 危险命令/新增依赖影响大，应立即阻断。
- TSX 质量问题可能存在误报，默认提醒更适合日常开发。

## 8. 输出与汇报规范

完成任何任务后，必须给出：

```text
已完成：
- 修改了哪些文件
- 做了什么取舍

验证：
- ✅ 已运行并通过的命令
- ⚠️ 未运行的命令及原因
- ❌ 失败命令的关键错误

怎么用：
- 给用户下一步命令或操作
```

## 9. 最佳实践清单

- [ ] 是否先明确 app：SSG / SSR / Web3？
- [ ] 是否确认 `@/*` alias 实际解析位置？
- [ ] 用户可见文案是否全部使用 `LANG`？
- [ ] `LANG` 是否只在组件/函数内部执行？
- [ ] 动态文案是否使用 `{placeholder}` 参数对象？
- [ ] 样式是否只使用 CSS 变量？
- [ ] 金融计算是否使用 `bignumber.js`？
- [ ] hooks 依赖是否主动补全？
- [ ] 是否考虑 RTL、深浅模式、品牌色、响应式？
- [ ] 是否运行了 tsc/lint 或说明未运行原因？

## 10. 推荐协作方式

给 AI 的需求描述建议包含：

```text
目标：
范围：apps/byd-ssg 或 apps/byd-ssr 或 packages/apps-ui
文件：如已知请列出
交互：
文案：
主题/RTL/响应式要求：
验证期望：
```

示例：

```text
/byd-next:dev-plan
目标：给合约交易页新增风险提示卡片
范围：apps/byd-ssg
要求：文案走 LANG，颜色走主题变量，移动端单列，RTL 可用
验证：至少跑 tsc:check:ssg，并说明 UI 检查点
```
