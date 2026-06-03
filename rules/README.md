# Rules 索引

本目录存放 BYDFi Web 的 AI 开发硬规则。开发时不要只读总入口，应按场景读取对应规则。

| 场景                             | 必读规则          |
| -------------------------------- | ----------------- |
| Next.js 页面、路由、数据流       | `nextjs.md`       |
| React 组件、hooks、TSX、组件库   | `react-tsx.md`    |
| TypeScript 类型、金融计算、alias | `typescript.md`   |
| Number/String 全局扩展、金融链式计算、数字格式化 | `prototype.md`    |
| 跨 app/package 共享代码          | `monorepo.md`     |
| 用户可见文案 / i18n              | `language.md`     |
| 样式颜色、主题、设计 token       | `theme.md`        |
| PC / Tablet / Mobile 响应式      | `responsive.md`   |
| styled-jsx、嵌套、:global、RTL   | `styled-jsx.md`   |
| 分支和合流                       | `branch.md`       |
| 交付前验证                       | `verification.md` |

## rules / skills 职责边界

- `rules`：存放必须遵守的编码规范、禁止事项、组件/API/样式/i18n/类型等硬约束。
- `skills`：存放如何完成某类任务的流程、步骤、搜索方式、输出格式和报告结构。

如果某条内容是“必须 / 禁止 / 优先 / 不得”这类长期有效的编码规范，应优先放在本目录；如果是“如何执行一次审查 / 生成 / 审计 / 提交流程”，才放在 `.claude/skills`。

## 冲突优先级

1. 用户本轮明确要求。
2. `.claude/CLAUDE.md` 的硬性约束。
3. 本目录中更具体的规则。
4. 现有代码风格。

如果规则冲突，必须先向用户说明冲突并请求确认，不要自行选择高风险方案。
