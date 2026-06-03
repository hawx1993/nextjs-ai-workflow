#!/usr/bin/env node
/**
 * theme 硬编码颜色扫描脚本.
 *
 * 范围: apps/<app>/src/ + packages/<pkg>/ 的 .ts/.tsx/.scss/.css
 * 检测: hex / rgb / rgba / hsl / hsla 硬编码颜色
 * 分类: 业务违规 / SVG 内联 / 注释 / 第三方品牌 / 透明关键字
 *
 * 不在范围: RTL / 深浅模式 / 多皮肤 / 未使用 CSS 变量(留给半脚本化阶段).
 *
 * Cross-check: 用 system grep + execFileSync 独立统计 hex 命中数, 与主统计对比.
 */

import { readdirSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';

const REPO = execFileSync('git', ['rev-parse', '--show-toplevel'], {
  cwd: import.meta.dirname,
  encoding: 'utf8',
}).trim();

const SCAN_ROOTS = [
  `${REPO}/apps/bydfi-ssg/src`,
  `${REPO}/apps/bydfi-ssr/src`,
  `${REPO}/packages/apps-kit`,
  `${REPO}/packages/apps-ui`,
  `${REPO}/packages/apps-base-kline`,
  `${REPO}/packages/nex-theme`,
];

const SKIP_DIRS = new Set([
  'node_modules', '.next', 'out', 'out-rtl', 'dist', 'build',
  '.git', '.turbo', '.vscode', 'scripts', 'plugin', 'storybook-static',
]);

// 主题定义文件本身不算违规（变量定义在这里）
const SKIP_PATH_FRAGMENTS = [
  '/packages/apps-kit/core/styles/src/theme/setting/colors/',
  '/packages/apps-kit/core/styles/src/theme/constants.ts',
  '/packages/apps-kit/core/styles/src/theme/app-setting/',
  '/public/static/',
  '/charting_library/',
];

const EXTS = ['.ts', '.tsx', '.scss', '.css'];

// 第三方品牌色白名单（豁免）
const BRAND_COLORS = new Set(
  [
    '#1d9bf0', '#1da1f2',  // Twitter
    '#0088cc', '#26a5e4',  // Telegram
    '#1877f2',             // Facebook
    '#5865f2',             // Discord
    '#ff0000',             // YouTube
    '#0a66c2',             // LinkedIn
    '#25d366',             // WhatsApp
    '#ff8400',             // (custom brand)
    '#0adcff',             // Apple Wallet
  ].map((c) => c.toLowerCase())
);

// 颜色匹配 regex: hex (3/4/6/8 位) / rgb / rgba / hsl / hsla
const COLOR_RE = /(#[0-9a-fA-F]{3,8}\b|rgba?\([^)]*\)|hsla?\([^)]*\))/g;

// SVG 上下文检测: 行内含 SVG 标签或 fill/stroke 属性
const SVG_CTX_RE = /<svg|<path|<circle|<rect|<line|<polygon|<polyline|<g\s|<defs|<animate|<use|fill="|fill='|stroke="|stroke='/;

function isComment(line) {
  return /^\s*(?:\/\/|\*|\/\*)/.test(line);
}

function isWhiteBlackTransparent(color) {
  const c = color.toLowerCase().replace(/\s/g, '');
  if (c === '#fff' || c === '#ffffff' || c === '#000' || c === '#000000') return true;
  if (c === 'rgba(0,0,0,0)' || c === 'rgb(0,0,0)' || c === 'rgb(255,255,255)') return true;
  if (c === 'rgba(255,255,255,1)' || c === 'rgba(0,0,0,1)') return true;
  if (c === 'rgba(0,0,0,0.0)') return true;
  return false;
}

function isBrand(color) {
  return BRAND_COLORS.has(color.toLowerCase());
}

function classify(line) {
  if (isComment(line)) return 'comment';
  if (SVG_CTX_RE.test(line)) return 'svg';
  return 'business';
}

function shouldSkipPath(fp) {
  return SKIP_PATH_FRAGMENTS.some((frag) => fp.includes(frag));
}

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
        stack.push(full);
      } else if (e.isFile()) {
        if (!EXTS.some((x) => e.name.endsWith(x))) continue;
        if (shouldSkipPath(full)) continue;
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

function collectFindings() {
  const findings = []; // { file, line, color, category, brand }
  const fileSet = new Set();

  for (const root of SCAN_ROOTS) {
    for (const fp of walkFiles(root)) {
      fileSet.add(fp);
      let content;
      try {
        content = readFileSync(fp, 'utf8');
      } catch {
        continue;
      }
      const lines = content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const matches = line.matchAll(COLOR_RE);
        for (const m of matches) {
          const color = m[0];
          if (isWhiteBlackTransparent(color)) continue;
          findings.push({
            file: fp.slice(REPO.length + 1),
            line: i + 1,
            color,
            category: classify(line),
            brand: isBrand(color),
          });
        }
      }
    }
  }
  return { findings, fileCount: fileSet.size };
}

function crossCheckHexBySystemGrep() {
  // 独立 cross-check: 用 system grep -E 跑 hex 颜色, 与主统计的 hex 命中数对比
  const args = [
    '-rEh',  // recursive, extended-regex, no filename in output
    '--include=*.ts',
    '--include=*.tsx',
    '--include=*.scss',
    '--include=*.css',
  ];
  for (const dir of SKIP_DIRS) {
    args.push(`--exclude-dir=${dir}`);
  }
  args.push('#[0-9a-fA-F]{3,8}');
  args.push(...SCAN_ROOTS);

  let raw;
  try {
    raw = execFileSync('grep', args, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
      maxBuffer: 200 * 1024 * 1024,
    });
  } catch (e) {
    // grep 退出码 1 = 无匹配, 不是错误
    if (e.status === 1) return 0;
    raw = e.stdout || '';
  }

  let count = 0;
  const re = /#[0-9a-fA-F]{3,8}\b/g;
  for (const line of raw.split('\n')) {
    if (!line) continue;
    // 路径过滤: 因为 grep -h 不输出文件名, 这里只能按颜色排除
    // 但 SKIP_PATH_FRAGMENTS 的过滤主要是路径级, system grep 没法精确对应
    // 故 cross-check 可能略高于主统计 (含主题定义文件中的 hex)
    for (const m of line.matchAll(re)) {
      if (isWhiteBlackTransparent(m[0])) continue;
      count++;
    }
  }
  return count;
}

function main() {
  const { findings, fileCount } = collectFindings();

  // 分类计数
  const byCategory = { comment: 0, svg: 0, business: 0 };
  let brandCount = 0;
  const violations = []; // 业务违规 = business 且非 brand
  const hexCount = { total: 0 };
  for (const f of findings) {
    byCategory[f.category]++;
    if (f.brand) brandCount++;
    if (f.color.startsWith('#')) hexCount.total++;
    if (f.category === 'business' && !f.brand) {
      violations.push(f);
    }
  }

  // Top files
  const fileViolationCount = new Map();
  for (const v of violations) {
    fileViolationCount.set(v.file, (fileViolationCount.get(v.file) || 0) + 1);
  }
  const topFiles = [...fileViolationCount.entries()]
    .sort((a, b) => {
      if (b[1] !== a[1]) return b[1] - a[1];
      return a[0] < b[0] ? -1 : 1;
    })
    .slice(0, 20);

  const meta = gitMeta();
  const grepHexCount = crossCheckHexBySystemGrep();

  const out = [];
  out.push('# 硬编码颜色审查报告');
  out.push('');
  out.push(`- 统计日期: ${todayIso()}`);
  out.push(`- 分支: \`${meta.branch}\``);
  out.push(`- Commit: \`${meta.short}\` — ${meta.lastMsg}`);
  out.push(`- 工作树: ${meta.worktree}`);
  out.push(`- 扫描文件总数: **${fileCount}**`);
  out.push(`- 颜色命中总数 (含豁免): **${findings.length}**`);
  out.push('');

  out.push('## 概览');
  out.push('');
  out.push('| 类别 | 数量 | 严重程度 |');
  out.push('|------|----:|---------|');
  out.push(`| **业务样式违规**（应改 \`var(--spec-*)\` / \`var(--skin-*)\`） | **${violations.length}** | 严重 |`);
  out.push(`| SVG 内联 | ${byCategory.svg} | 豁免 |`);
  out.push(`| 注释 | ${byCategory.comment} | 豁免 |`);
  out.push(`| 第三方品牌色 | ${brandCount} | 豁免 |`);
  out.push('');

  out.push('## 准确性核验');
  out.push('');
  out.push('脚本内独立 cross-check (主统计 walkFiles + regex vs system grep):');
  out.push('');
  out.push('| 锚点 | 主统计 | system grep | 一致 |');
  out.push('|------|------:|------------:|:----:|');
  // 主统计的 hex 数 vs system grep 的 hex 数
  // 注: system grep 不应用 SKIP_PATH_FRAGMENTS 过滤, 故略高于主统计
  // 这里 cross-check 的语义: 两者数字应在合理范围内（system grep ≥ 主统计）
  const ok = grepHexCount >= hexCount.total ? '✓ (system grep 含主题定义)' : '**✗ 异常**';
  out.push(`| hex 颜色命中数 (#xxx) | ${hexCount.total} | ${grepHexCount} | ${ok} |`);
  out.push(`| 扫描的文件总数 | ${fileCount} | — | — |`);
  out.push('');

  out.push('## 业务违规 Top 20 文件');
  out.push('');
  if (topFiles.length === 0) {
    out.push('（无违规）');
  } else {
    out.push('| # | 违规数 | 文件 |');
    out.push('|--:|------:|------|');
    topFiles.forEach((entry, idx) => {
      out.push(`| ${idx + 1} | ${entry[1]} | \`${entry[0]}\` |`);
    });
  }
  out.push('');

  out.push('## 业务违规明细 (前 100 行)');
  out.push('');
  if (violations.length === 0) {
    out.push('（无违规）');
  } else {
    out.push('| # | 文件 | 行号 | 颜色 |');
    out.push('|--:|------|----:|------|');
    violations.slice(0, 100).forEach((v, idx) => {
      out.push(`| ${idx + 1} | \`${v.file}\` | ${v.line} | \`${v.color}\` |`);
    });
    if (violations.length > 100) {
      out.push('');
      out.push(`> 完整违规共 ${violations.length} 条, 仅展示前 100 条. 全量请按 Top 文件依次处理.`);
    }
  }
  out.push('');

  out.push('## 不在本脚本范围');
  out.push('');
  out.push('- **RTL 物理属性** (`margin-left` 等): 留给半脚本化阶段');
  out.push('- **深浅模式覆盖** (`[data-theme]` 选择器): 留给半脚本化阶段');
  out.push('- **多皮肤覆盖** (`[data-skin]` 选择器): 留给半脚本化阶段');
  out.push('- **未使用 CSS 变量**: 需要先收集变量定义再反查, 留给半脚本化阶段');
  out.push('');
  out.push('完整审查请配合上述维度的人工核查 (见 SKILL.md `不脚本化部分`).');
  out.push('');

  process.stdout.write(out.join('\n') + '\n');
}

main();
