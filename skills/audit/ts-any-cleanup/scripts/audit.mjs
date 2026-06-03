#!/usr/bin/env node
/**
 * any-cleanup 扫描脚本.
 *
 * 7 类机械模式分类 .ts/.tsx 中的显式 any 用法.
 * 详细规则见同目录 SKILL.md.
 */

import { readdirSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';

const REPO = execFileSync('git', ['rev-parse', '--show-toplevel'], {
  cwd: import.meta.dirname,
  encoding: 'utf8',
}).trim();

const SCAN_ROOTS = [
  `${REPO}/apps/bydfi-ssg`,
  `${REPO}/apps/bydfi-ssr`,
  `${REPO}/apps/bydfi-web3`,
  `${REPO}/packages/apps-kit`,
  `${REPO}/packages/apps-ui`,
  `${REPO}/packages/apps-icons`,
  `${REPO}/packages/apps-base-kline`,
  `${REPO}/packages/nex-theme`,
];

const SKIP_DIRS = new Set([
  'node_modules', '.next', 'out', 'out-rtl', 'dist', 'build',
  '.git', '.turbo', 'charting_library',
]);

const SKIP_PATH_FRAGMENTS = ['/public/static/'];

const EXTS = ['.ts', '.tsx'];

// 7 类规则
// re: JS RegExp，主统计用
// erePattern: POSIX ERE 字符串，system grep 交叉验证用（手写等价；\s → [[:space:]]，\w → [A-Za-z0-9_]，\b → (^|[^A-Za-z0-9_]) / ($|[^A-Za-z0-9_])）
const PATTERNS = [
  { code: 'A', name: 'catch (xxx: any)',     re: /catch\s*\(\s*\w+\s*:\s*any\s*\)/g, erePattern: 'catch[[:space:]]*\\([[:space:]]*[A-Za-z0-9_]+[[:space:]]*:[[:space:]]*any[[:space:]]*\\)', confidence: '100% 多余', advice: 'TS 4.4+ catch 默认 unknown; 删 : any, 块内补 type guard' },
  { code: 'B', name: 'useState<any>',         re: /useState<any>/g,                   erePattern: 'useState<any>',                                                                                              confidence: '高 (95%+)', advice: '看初始值: 字面量直接推断; undefined 改 useState<T>()' },
  { code: 'C', name: 'useRef<any>',           re: /useRef<any>/g,                     erePattern: 'useRef<any>',                                                                                                confidence: '高 (95%+)', advice: 'DOM ref 改 useRef<HTMLXxxElement>(null); 非 DOM 写明可变值类型' },
  { code: 'D', name: 'Promise<any>',          re: /Promise<any>/g,                    erePattern: 'Promise<any>',                                                                                               confidence: '中高',     advice: '看返回路径: 业务函数改具体; 网络层可改 Promise<unknown> 调用点 narrow' },
  { code: 'E', name: 'Record<string, any>',   re: /Record<string,\s*any>/g,           erePattern: 'Record<string,[[:space:]]*any>',                                                                              confidence: '中',       advice: '已知键 → interface; 未知键值类型已知 → Record<string, T>; 都未知 → Record<string, unknown>' },
  { code: 'F', name: 'as any 类型断言',       re: /\bas any\b/g,                      erePattern: '(^|[^A-Za-z0-9_])as any($|[^A-Za-z0-9_])',                                                                   confidence: '中',       advice: '优先定义/导入正确类型; 次之 as unknown as T 双断言' },
  { code: 'G', name: ': any[]',                re: /:\s*any\[\]/g,                     erePattern: ':[[:space:]]*any\\[\\]',                                                                                     confidence: '中',       advice: '已知 → T[]; 异构 → union/tuple; 完全动态 → unknown[]' },
];

function* walkFiles(root) {
  const stack = [root];
  while (stack.length) {
    const cur = stack.pop();
    let entries;
    try {
      entries = readdirSync(cur, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const e of entries) {
      const full = join(cur, e.name);
      if (e.isDirectory()) {
        if (SKIP_DIRS.has(e.name)) continue;
        if (SKIP_PATH_FRAGMENTS.some((f) => full.includes(f))) continue;
        stack.push(full);
      } else if (e.isFile()) {
        if (full.endsWith('.d.ts')) continue;
        if (!EXTS.some((x) => e.name.endsWith(x))) continue;
        yield full;
      }
    }
  }
}

function gitMeta() {
  const run = (...args) => {
    try {
      return execFileSync('git', ['-C', REPO, ...args], {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
      }).trim();
    } catch {
      return '';
    }
  };
  return {
    branch: run('branch', '--show-current') || '?',
    short: run('rev-parse', '--short=10', 'HEAD') || '?',
    worktree: !run('status', '--porcelain') ? 'clean' : 'dirty',
    lastMsg: run('log', '-1', '--pretty=%s'),
  };
}

function todayIso() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function main() {
  const counts = Object.fromEntries(PATTERNS.map((p) => [p.code, 0]));
  const fileHits = Object.fromEntries(PATTERNS.map((p) => [p.code, new Map()]));
  let fileTotal = 0;

  for (const root of SCAN_ROOTS) {
    for (const fp of walkFiles(root)) {
      fileTotal++;
      let content;
      try {
        content = readFileSync(fp, 'utf8');
      } catch {
        continue;
      }
      const rel = fp.slice(REPO.length + 1);
      for (const p of PATTERNS) {
        // 重置 lastIndex (g flag)
        p.re.lastIndex = 0;
        const matches = content.match(p.re);
        if (matches && matches.length > 0) {
          counts[p.code] += matches.length;
          const m = fileHits[p.code];
          m.set(rel, (m.get(rel) || 0) + matches.length);
        }
      }
    }
  }

  // Top files (per 类)
  const topPerCategory = {};
  for (const p of PATTERNS) {
    const sorted = [...fileHits[p.code].entries()]
      .sort((a, b) => {
        if (b[1] !== a[1]) return b[1] - a[1];
        return a[0] < b[0] ? -1 : 1;
      })
      .slice(0, 10);
    topPerCategory[p.code] = sorted;
  }

  const meta = gitMeta();
  const totalABC = counts.A + counts.B + counts.C;

  const out = [];
  out.push('# `any` 类型可消除清单');
  out.push('');
  out.push(`- 统计日期: ${todayIso()}`);
  out.push(`- 分支: \`${meta.branch}\``);
  out.push(`- Commit: \`${meta.short}\` — ${meta.lastMsg}`);
  out.push(`- 工作树: ${meta.worktree}`);
  out.push(`- 扫描的 .ts/.tsx 总数: **${fileTotal}**`);
  out.push('');

  out.push('## 概览');
  out.push('');
  out.push('| 类别 | 数量 | 把握度 | 改造方向 |');
  out.push('|------|----:|--------|---------|');
  for (const p of PATTERNS) {
    out.push(`| **${p.code}** \`${p.name}\` | ${counts[p.code]} | ${p.confidence} | ${p.advice} |`);
  }
  out.push('');
  out.push(`> A、B、C 三类合计 **${totalABC}** 处, 风险最低收益最直接, 建议优先处理.`);
  out.push('');

  out.push('## 准确性核验');
  out.push('');
  out.push('每类的命中数用 system grep 独立验证:');
  out.push('');
  out.push('| 类别 | 主统计 | system grep | 一致 |');
  out.push('|------|------:|-----------:|:----:|');
  for (const p of PATTERNS) {
    const grepCount = systemGrepCount(p.erePattern);
    const ok = counts[p.code] === grepCount ? '✓' : `~${grepCount}`;
    out.push(`| ${p.code} | ${counts[p.code]} | ${grepCount} | ${ok} |`);
  }
  out.push('');
  out.push('> 注: system grep 用每条规则的 `erePattern`（POSIX ERE 等价手写）独立计数；F 类用 `(^|[^A-Za-z0-9_])` 模拟 `\\b`，常见空白分隔场景与 JS 数字一致.');
  out.push('');

  for (const p of PATTERNS) {
    out.push(`## ${p.code} 类: \`${p.name}\` — ${counts[p.code]} 处`);
    out.push('');
    out.push(`**改造建议**: ${p.advice}`);
    out.push('');
    const top = topPerCategory[p.code];
    if (top.length === 0) {
      out.push('（无命中）');
    } else {
      out.push('**Top 10 热点文件**:');
      out.push('');
      out.push('| # | 命中数 | 文件 |');
      out.push('|--:|------:|------|');
      top.forEach(([file, n], i) => {
        out.push(`| ${i + 1} | ${n} | \`${file}\` |`);
      });
    }
    out.push('');
  }

  out.push('## 推荐改造顺序');
  out.push('');
  out.push('| 阶段 | 类别 | 数量 | 风险 | 价值 |');
  out.push('|------|------|----:|------|------|');
  out.push(`| 1 | A | ${counts.A} | 低 | 对齐 TS 4.4+ 默认 |`);
  out.push(`| 2 | C | ${counts.C} | 低 | DOM ref 类型可批量推断 |`);
  out.push(`| 3 | B | ${counts.B} | 低 | 字面量初始值直接推断 |`);
  out.push(`| 4 | E | ${counts.E} | 中 | 网络层先收敛 |`);
  out.push(`| 5 | D | ${counts.D} | 中 | 与 E 类联动 |`);
  out.push(`| 6 | G | ${counts.G} | 中 | 按 store/types 分批 |`);
  out.push(`| 7 | F | ${counts.F} | 高 | 最难, 逐个判断 |`);
  out.push('');
  out.push('最终建议: 全部改造完成后将 `@typescript-eslint/no-explicit-any` 加入 `.eslintrc.json` 锁住增量.');
  out.push('');

  process.stdout.write(out.join('\n') + '\n');
}

function systemGrepCount(erePattern) {
  // 用 system grep -E 独立计数, 与 JS regex 主统计交叉验证
  // 输入是 PATTERNS[].erePattern (POSIX ERE 等价); 不再做正则字符串转换
  // 边界:
  //   - F 类用 (^|[^A-Za-z0-9_])...($|[^A-Za-z0-9_]) 模拟 \b, 每次匹配会吃掉前后 1 字符,
  //     连续命中时第一个边界字符已被消耗, 下一次从消耗位置继续——常见场景 (空格/换行分隔) 计数与 JS 一致
  //   - 跨行匹配不支持, 单匹配跨多行时会漏报 (主统计同样基于行级正则, 此处一致)
  const args = ['-rEoh', '--include=*.ts', '--include=*.tsx'];
  for (const dir of SKIP_DIRS) args.push(`--exclude-dir=${dir}`);
  args.push('--exclude=*.d.ts');
  args.push(erePattern);
  args.push(...SCAN_ROOTS);
  try {
    const r = execFileSync('grep', args, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
      maxBuffer: 50 * 1024 * 1024,
    });
    return r.split('\n').filter((l) => l).length;
  } catch (e) {
    if (e.status === 1) return 0;
    return -1;
  }
}

main();
