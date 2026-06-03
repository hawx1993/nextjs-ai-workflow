# Hooks 说明

本目录存放 BYDFi Web 的 Claude Code hooks。策略参考 ECC：PreToolUse 用于高风险阻断或提醒，PostToolUse 用于质量检查；本项目默认“提醒优先”。

## 默认策略

| Hook                          | 类型                     | 行为                                                                         |
| ----------------------------- | ------------------------ | ---------------------------------------------------------------------------- |
| `dangerous-command-guard.mjs` | PreToolUse / Bash        | 阻断危险 shell 命令，如 `rm -rf`、`sudo`、权限破坏等                         |
| `dependency-guard.mjs`        | PreToolUse / Bash        | 阻断未经明确确认的新增依赖命令，如 `pnpm add`、`npm install`、`yarn add`     |
| `tsx-quality-guard.mjs`       | PostToolUse / Write/Edit | 对 TS/TSX 新增内容提醒硬编码文案、硬编码颜色、`console.log`、`LANG` 可疑用法 |

## 为什么质量问题只提醒

TSX 质量扫描可能存在误报，例如：

- 品牌名、交易对、专有名词。
- 注释或文档示例。
- 第三方代码片段。

因此默认不阻断，由 AI 在最终汇报中说明是否需要处理。

## 本地调试

```bash
node --check hooks/tsx-quality-guard.mjs
node --check hooks/dependency-guard.mjs
node --check hooks/dangerous-command-guard.mjs
```

模拟 Bash 输入：

```bash
echo '{"tool_name":"Bash","tool_input":{"command":"pnpm add lodash"}}' | node hooks/dependency-guard.mjs
```

模拟 Write/Edit 输入：

```bash
echo '{"tool_name":"Write","tool_input":{"file_path":"demo.tsx","content":"<div>提交</div>"}}' | node hooks/tsx-quality-guard.mjs
```

## 误报处理

- 单次误报：在回复中说明原因，不需要改 hook。
- 高频误报：调整 hook 脚本中的 allowlist。
- 临时关闭：从 用户或项目的 Claude Code settings 中移除对应 plugin hook，或禁用 `byd-next-workflow` plugin。

## 注意

- hooks 不能替代 `pnpm tsc:all` 和 `pnpm lint:all`。
- hooks 不会自动修复业务代码。
- hooks 只提供早期提醒和安全护栏。
