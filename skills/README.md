# Skills 索引

本目录存放 BYDFi Web 的可复用 AI 工作流。日常 Next.js + React + TSX 开发优先使用 `dev/nextjs-*`，专项审计按需使用 `audit/*`。

## 日常开发 dev skills

| Skill                    | 入口命令                                                    | 用途                 |
| ------------------------ | ----------------------------------------------------------- | -------------------- |
| `dev/nextjs-dev`    | `/byd-next:dev-plan`、`/byd-next:dev-implement`、`/byd-next:dev-fix-build` | 规划、实现、构建修复 |
| `dev/nextjs-review` | `/byd-next:dev-review`                                           | React/TSX 审查       |
| `workflow/nextjs-verify` | `/byd-next:dev-verify`                                           | 验证与交付结论       |

## 专项审计

| 目录                | 用途                                |
| ------------------- | ----------------------------------- |
| `audit/i18n`        | i18n 语言常量、翻译覆盖、硬编码文案 |
| `audit/theme`       | 主题变量、硬编码颜色、RTL           |
| `audit/security`    | 安全审查                            |
| `audit/dead-code`   | 死代码                              |
| `audit/dead-deps`   | 死依赖                              |
| `audit/pre-release` | 发版前综合检查                      |

## 代码生成

| 目录                    | 用途                    |
| ----------------------- | ----------------------- |
| `codegen/ssg-generate`  | SSG 页面/组件生成       |
| `codegen/ssr-generate`  | SSR 页面/组件生成       |
| `codegen/ssr-sidebar-pick` | SSR 页面侧栏组件选型与接入 |
| `codegen/design-system` | 无设计稿生成设计系统 UI |

## 公共能力发现

| 目录             | 用途                                                  |
| ---------------- | ----------------------------------------------------- |
| `knowledge/discovery-core` | 说明 apps-kit/core 公共能力中心，开发前查找与复用规则 |

## Git / PR workflow skills

| 目录 | 入口命令 | 用途 |
| --- | --- | --- |
| `workflow/pr-reviewer` | `/byd-next:workflow-pr-reviewer` | GitHub PR 自动审查、发布行内评论和汇总评论 |
| `workflow/pre-release` | `/byd-next:workflow-pre-release` | 发版前代码质量检查并生成风险报告 |

## 编写和维护规范

- 新增 skill 前先读 `SKILL_BEST_PRACTICES.md`。
- 机械扫描型优先脚本化，语义判断型保留 markdown 流程。
- SKILL.md 控制在 500 行以内，长规则拆 `reference.md`。
- 只为明确可复用的流程新增 skill，不为一次性任务新增 skill。
