# Monorepo 规则

适用于 pnpm workspace、`apps/*` 与 `packages/*` 的跨包修改。

## 必须

- 先确认改动层级：app 专属、共享 UI、共享业务逻辑、工具脚本。
- app 专属逻辑优先留在对应 app，不要过早抽到 packages。
- 共享包改动必须说明影响哪些 app。
- 使用根脚本或 `pnpm -F <package>` 执行命令。
- 修改 `packages/apps-ui`、`packages/apps-kit`、`packages/apps-icons` 时考虑 SSG/SSR 同时受影响。
- 修改 `packages/apps-base-kline` 后手动运行其 lint，因为它排除 lint-staged。

## 禁止

- 禁止跨 app 复制粘贴业务逻辑后不抽象。
- 禁止把单 app 临时需求放进共享包。
- 禁止擅自新增 workspace 依赖。
- 禁止修改 lockfile 或依赖版本来绕过本地问题。

## 常用命令

```bash
pnpm -F bydfi-ssg run tsc:check
pnpm -F bydfi-ssr run tsc:check
pnpm -F apps-kit run tsc:check
pnpm -F @apps/base-kline run lint
```

## 检查清单

- [ ] 改动是否应属于 app 还是 package？
- [ ] 共享包改动影响哪些 app？
- [ ] 是否需要同步 SSG/SSR？
- [ ] 是否运行对应 package 的验证命令？
