---
name: bydfi-web-report-<NAME>
description: <一句话功能描述, 含主要触发关键词. 上限 1536 字符 (含 when_to_use).>
disable-model-invocation: true
allowed-tools: Bash, Read, Write
---

<引言段 1-3 句: 这个 skill 做什么, 输出到哪>

## 调用方式

```bash
mkdir -p reports/$(date +%Y-%m-%d)
node .claude/skills/<SKILL-NAME>/scripts/audit.mjs \
  > reports/$(date +%Y-%m-%d)/<FILENAME>.md
```

## 输出位置

`reports/YYYY-MM-DD/<FILENAME>.md`（reports/ 已 gitignore）

## 判定规则（已固化, 勿动）

- <规则 1>
- <规则 2>

## 扫描覆盖

| 项         | 配置                             |
| ---------- | -------------------------------- |
| 扫描根     | <paths>                          |
| 跳过目录   | node_modules / .next / out / ... |
| 扫描扩展名 | .ts / .tsx / .mjs / ...          |

## 已知陷阱

- <陷阱 1, 含历史背景>

## Cross-check 锚点

脚本内置 N 个 sanity check, 每次跑都验证主统计的关键数字. 任一锚点不一致表示规则有 regression, 必须先修脚本再发报告.

## 触发场景

- <场景 1>

## 注意事项

- 报告内任何数字都必须来自脚本输出, 禁止手工修改表格
- reports/ 已 gitignore, 发给团队前可考虑用 ls-pdf skill PDF 化
