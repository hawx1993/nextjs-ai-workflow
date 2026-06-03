---
allowed-tools: Bash, Write
argument-hint: '<周报署名>'
description: 提取当前 git author 的 commit message 并生成 BYDFi 周报
author: Nilu
---

# 生成当前 git author 周报

根据当前仓库 git author 的 commit message 自动生成一份周报，并保存到项目根目录 `reports/` 目录。

## 参数

- `$ARGUMENTS` 第一个参数为周报署名，必填，例如：`nilu`。
- 不再支持传入 `yyyy-mm-dd` 或 `yyyy-mm-dd..yyyy-mm-dd` 统计周期参数。
- 统计周期固定为当前日期所在周的**周一 00:00:00 到周五 23:59:59**。

示例：

```bash
/byd-next:workflow-weekly-report nilu
```

## 输出要求

- 报告保存到项目根目录 `reports/` 目录。
- 文件名格式：`reports/weekly-report-<署名>-<开始日期>-<结束日期>.md`。
- 报告标题格式：`【MM/DD～MM/DD】周报 - <署名>`，例如：`【05/11～05/15】周报 - nilu`。
- 内容必须基于当前 git author 在统计周期内的 commit message 生成，不得编造 commit 中不存在的工作内容。
- 如果统计周期内没有 commit，仍生成报告，并明确写明本周期未检索到当前 git author 的 commit。

## 执行流程

1. 解析 `$ARGUMENTS`：
   - 如果没有传入署名，先提示用户提供署名，不要继续执行。
   - 忽略统计周期参数，统一使用当前日期所在周的周一到周五。
2. 获取当前 git author：
   - 优先使用 `git config user.email` 作为 `git log --author` 匹配条件。
   - 如果 email 为空，则使用 `git config user.name`。
   - 如果两者都为空，提示用户先配置 git author，不要继续执行。
3. 使用 `git log --all` 提取统计周期内的 commit：
   - 范围：`--since='<start> 00:00:00' --until='<end> 23:59:59'`。
   - 作者：当前 git author。
   - 内容：commit hash、日期、subject、body。
   - 因 `--all` 会遍历所有 refs，同一个 commit 可能被多个分支引用；解析后必须按完整 commit hash 去重。
4. 根据 commit message 归纳周报：
   - 优先按 commit type 或 scope 聚类，例如功能开发、问题修复、工作流/配置、文档/规范、代码优化。
   - 每条工作内容用中文概括，并尽量保留业务名、页面名、工具名、模块名。
   - commit body 中的“修改原因 / 处理方案 / 影响范围”可用于提炼背景和结果。
5. 创建 `reports/` 目录并写入报告文件。
6. 输出报告路径和本次统计摘要。

## 推荐报告结构

# 【MM/DD～MM/DD】周报 - {署名}

## 本周完成

### 功能开发
- {页面/模块名}：{做了什么，一句话结果导向}
- 示例：交易页面：新增限价委托表单，支持数量/价格联动计算

### 问题修复
- {模块}：{修了什么，影响是什么}
- 示例：K线组件：修复深色模式下 tooltip 颜色变量缺失问题

### 优化 / 配置 / 其他
- {内容}
- 示例：更新 SSG 翻译文件，补全 6 处 i18n 遗漏

## 下周计划

- {任务1}：{预期目标}
- {任务2}：{预期目标}

## 周报写作规则

- 每条内容格式：`{模块/页面名}：{动作} + {结果}`，禁止只写动作不写结果
- 用结果导向语言：「完成」「修复」「上线」「优化」，避免「推进」「跟进」「处理」
- 单条字数控制在 30 字以内
- 同类工作合并为一条，不要逐 commit 罗列
- 没有对应工作的分组整体省略，不留空节
- 下周计划每条必须有明确目标，不写「继续推进」之类的模糊表述

## Commit 明细

| 日期 | Commit | 类型 | 内容 |
| ---- | ------ | ---- | ---- |
| YYYY-MM-DD | `<hash>` | feat | <subject> |


## 推荐执行脚本

优先使用下面的 Node 脚本一次性完成日期计算、commit 提取和报告写入，避免 macOS / GNU `date` 差异：

```bash
node <<'NODE'
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const rawArgs = process.env.WEEKLY_REPORT_ARGS || '';
const args = rawArgs.trim().split(/\s+/).filter(Boolean);
const reporter = args[0];

if (!reporter) {
  console.error('请传入周报署名，例如：/byd-next:workflow-weekly-report nilu');
  process.exit(1);
}

const pad = (value) => String(value).padStart(2, '0');
const formatDate = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
const formatTitleDate = (date) => `${pad(date.getMonth() + 1)}/${pad(date.getDate())}`;
const getWeekRange = (baseDate) => {
  const day = baseDate.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const start = new Date(baseDate);
  start.setDate(baseDate.getDate() + diffToMonday);
  const end = new Date(start);
  end.setDate(start.getDate() + 4);
  return { start, end };
};

const { start, end } = getWeekRange(new Date());

const startText = formatDate(start);
const endText = formatDate(end);
const run = (command) => execSync(command, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
const shellQuote = (value) => `'${String(value).replace(/'/g, `'\\''`)}'`;

const gitEmail = run('git config user.email || true');
const gitName = run('git config user.name || true');
const author = gitEmail || gitName;
if (!author) {
  console.error('未读取到 git config user.email 或 user.name，请先配置 git author');
  process.exit(1);
}

const logFormat = '%H%x1f%h%x1f%ad%x1f%s%x1f%b%x1e';
const logCommand = [
  'git log --all',
  `--author=${shellQuote(author)}`,
  `--since=${shellQuote(`${startText} 00:00:00`)}`,
  `--until=${shellQuote(`${endText} 23:59:59`)}`,
  '--date=short',
  '--no-merges',
  `--format=${shellQuote(logFormat)}`,
].join(' ');

const rawLog = run(`${logCommand} || true`);
const parsedCommits = rawLog
  ? rawLog
      .split('\x1e')
      .map((entry) => entry.trim())
      .filter(Boolean)
      .map((entry) => {
        const [hash, shortHash, date, subject, body = ''] = entry.split('\x1f');
        const typeMatch = /^(\w+)(?:\(([^)]+)\))?:\s*(.+)$/.exec(subject || '');
        return {
          hash,
          shortHash,
          date,
          subject,
          body: body.trim(),
          type: typeMatch?.[1] || 'other',
          scope: typeMatch?.[2] || '',
          summary: typeMatch?.[3] || subject,
        };
      })
  : [];

const seenCommitHashes = new Set();
const commits = parsedCommits.filter((commit) => {
  if (!commit.hash || seenCommitHashes.has(commit.hash)) return false;
  seenCommitHashes.add(commit.hash);
  return true;
});

const groups = [
  { title: '功能开发', types: ['feat'] },
  { title: '问题修复', types: ['fix'] },
  { title: '工作流 / 配置 / 文档', types: ['chore', 'config', 'docs', 'build', 'ci', 'script', 'test'] },
  { title: '代码优化 / 重构', types: ['refactor', 'style', 'perf'] },
  { title: '其他', types: ['other', 'revert'] },
];

const renderGroup = (group) => {
  const items = commits.filter((commit) => group.types.includes(commit.type));
  if (!items.length) return '';
  return [`### ${group.title}`, '', ...items.map((commit) => `- ${commit.summary}${commit.scope ? `（${commit.scope}）` : ''}`), ''].join('\n');
};

const title = `【${formatTitleDate(start)}～${formatTitleDate(end)}】周报 - ${reporter}`;
const detailRows = commits.map((commit) => {
  const type = commit.scope ? `${commit.type}(${commit.scope})` : commit.type;
  return `| ${commit.date} | \`${commit.shortHash}\` | ${type} | ${commit.summary.replace(/\|/g, '/')} |`;
});

const report = [
  `# ${title}`,
  '',
  '## 统计范围',
  '',
  `- 时间：${startText} ～ ${endText}`,
  `- Git author：${author}`,
  `- Commit 数量：${commits.length}`,
  '',
  '## 本周工作内容',
  '',
  commits.length ? groups.map(renderGroup).filter(Boolean).join('\n') : '- 本周期未检索到当前 git author 的 commit。\n',
  '## Commit 明细',
  '',
  '| 日期 | Commit | 类型 | 内容 |',
  '| ---- | ------ | ---- | ---- |',
  ...(detailRows.length ? detailRows : ['| - | - | - | 本周期未检索到 commit |']),
  '',
].join('\n');

const reportsDir = path.resolve(process.cwd(), 'reports');
fs.mkdirSync(reportsDir, { recursive: true });
const outputFile = path.join(reportsDir, `weekly-report-${reporter}-${startText}-${endText}.md`);
fs.writeFileSync(outputFile, report, 'utf8');

console.log(`已生成周报：${outputFile}`);
console.log(`标题：${title}`);
console.log(`Commit 数量：${commits.length}`);
NODE
```

执行脚本时，将 `$ARGUMENTS` 透传给环境变量，例如：

```bash
WEEKLY_REPORT_ARGS="$ARGUMENTS" node <<'NODE'
# 使用上方脚本内容
NODE
```

## 注意事项

- 本命令只读取 git log 并生成 Markdown 报告，不应修改业务代码。
- 不得执行 `git commit`、`git push` 或 `gh pr create`。
- 报告内容必须忠实于 commit message；如果 commit message 太笼统，只能做有限概括，不得擅自补充未出现的业务细节。
- 生成后按项目汇报格式说明文件路径、统计范围和是否成功。

