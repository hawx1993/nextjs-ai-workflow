# 验证规则

适用于所有 AI 修改后的交付检查和结果汇报。

## 基本原则

- 没有证据，不要声称完成。
- 命令失败必须如实汇报关键错误。
- 未运行验证必须说明原因。
- 文档或 `.claude` 配置改动可以运行轻量验证；业务代码改动必须优先运行 tsc/lint。

## 推荐验证命令

### 全量

```bash
pnpm tsc:all
pnpm lint:all
```

### 按 app

```bash
pnpm tsc:check:ssg
pnpm tsc:check:ssr
pnpm eslint:check
pnpm prettier:check
```

### `.claude` 配置

```bash
node -e "JSON.parse(require('fs').readFileSync('.claude/settings.json','utf8'))"
node --check .claude/hooks/tsx-quality-guard.mjs
node --check .claude/hooks/dependency-guard.mjs
node --check .claude/hooks/dangerous-command-guard.mjs
```

## UI 改动检查矩阵

- 品牌色：黄色 / 蓝色。
- 主题：深色 / 浅色。
- 方向：LTR / RTL。
- 端：PC / Tablet / Mobile。
- 状态：loading / empty / error / success。

## 汇报格式

```text
验证：
- ✅ pnpm tsc:all：通过
- ⚠️ pnpm lint:all：未运行，原因 <reason>
- ❌ pnpm build:ssg：失败，关键错误 <error>
```

## 禁止

- 禁止把“未运行”写成“应该通过”。
- 禁止隐藏失败输出。
- 禁止只运行格式化就声称业务正确。
