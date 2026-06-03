#!/usr/bin/env node
/**
 * apps-kit 共享性审计 — 团队报告生成脚本.
 *
 * 判定规则与已知陷阱见同目录 SKILL.md.
 *
 * 输出: stdout (调用方重定向到 reports/YYYY-MM-DD/bydfi-web-apps-kit-shared-audit.md).
 *
 * 设计原则:
 * - Deterministic: 同 git state 下两次执行输出完全一致 (除 git 工作树脏改动 metadata).
 * - 文件级 distinct 计数: 一个文件多次 import 同一模块算 1 次.
 * - 一个 import path 可同时归到多个 target (如 @/core/store/src/resso 同时记入 core/store + core-store/resso).
 *
 * 判定规则锚点:
 * - 单位: components/<name>, core/<name>, core/store/src/<name>
 * - 引用形式覆盖:
 *   - @apps/kit/<kind>/<name> (SSR 显式别名)
 *   - @/<kind>/<name> (三 app 共有, SSG/SSR 同名时 webpack 优先 apps-kit)
 *   - 专项 alias: @/core/api → core/network, @/core/resso → core/store + core-store/resso,
 *     @/core/local-storage → core/store + core-store/local-storage,
 *     @/core/account/utils → core/shared
 *   - NPM 风格 alias: react-copy-to-clipboard → components/react-copy-to-clipboard
 * - 扫描根: apps/<app>/ 整个目录 + packages/{apps-ui,apps-base-kline,apps-icons,nex-theme,apps-kit}/
 * - 跳过目录: node_modules, .next, out, out-rtl, dist, build, .git, .turbo, scripts, plugin
 * - 跳过配置文件: next.config.*, postcss.config.*, pm2-*.config.*, analyze.js, server.js, sentry.*.config.js
 * - 扫描扩展名: .ts, .tsx, .mjs, .js, .jsx (含 trading-view 等 vendored 库)
 * - 未抓取: 动态 import / require / 字符串拼接 / 相对路径
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';

const REPO = execFileSync('git', ['rev-parse', '--show-toplevel'], {
  cwd: import.meta.dirname,
  encoding: 'utf8',
}).trim();
const APPS_KIT = `${REPO}/packages/apps-kit`;

const DIRS = {
  ssg: `${REPO}/apps/bydfi-ssg`,
  ssr: `${REPO}/apps/bydfi-ssr`,
  'apps-ui': `${REPO}/packages/apps-ui`,
  'apps-base-kline': `${REPO}/packages/apps-base-kline`,
  'apps-icons': `${REPO}/packages/apps-icons`,
  'nex-theme': `${REPO}/packages/nex-theme`,
  'apps-kit-self': `${REPO}/packages/apps-kit`,
};
const DIR_ORDER = Object.keys(DIRS);

const SKIP_DIRS = new Set([
  'node_modules', '.next', 'out', 'out-rtl', 'dist', 'build',
  '.git', '.turbo', 'scripts', 'plugin',
]);
const SKIP_FILE_PATTERNS = [
  /^next\.config\.(js|mjs|ts)$/,
  /^postcss\.config\.(js|mjs|ts)$/,
  /^pm2.*\.config\.js$/,
  /^analyze\.js$/,
  /^server\.js$/,
  /^sentry\.(client|server|edge)\.config\.js$/,
];
const EXTS = ['.ts', '.tsx', '.mjs', '.js', '.jsx'];

const SCAN_RE = /['"`]((?:@apps\/kit|@)\/(?:components|core)\/[a-zA-Z0-9_/.-]+|react-copy-to-clipboard)['"`]/g;

function normalize(path) {
  if (path === 'react-copy-to-clipboard') {
    return [['components', 'react-copy-to-clipboard']];
  }
  if (/^@\/core\/api(\/|$)/.test(path)) {
    return [['core', 'network']];
  }
  if (/^@\/core\/resso(\/|$)/.test(path)) {
    return [['core', 'store'], ['core-store', 'resso']];
  }
  if (/^@\/core\/local-storage(\/|$)/.test(path)) {
    return [['core', 'store'], ['core-store', 'local-storage']];
  }
  if (/^@\/core\/account\/utils(\/|$)/.test(path)) {
    return [['core', 'shared']];
  }
  let m = path.match(/^(?:@apps\/kit|@)\/components\/([a-zA-Z0-9_-]+)/);
  if (m) return [['components', m[1]]];
  m = path.match(/^(?:@apps\/kit|@)\/core\/store\/src\/([a-zA-Z0-9_-]+)/);
  if (m) return [['core', 'store'], ['core-store', m[1]]];
  m = path.match(/^(?:@apps\/kit|@)\/core\/([a-zA-Z0-9_-]+)/);
  if (m) return [['core', m[1]]];
  return [];
}

function listDirs(p) {
  try {
    return readdirSync(p)
      .filter((f) => statSync(join(p, f)).isDirectory())
      .sort();
  } catch {
    return [];
  }
}

function listDirsAndFiles(p) {
  try {
    const out = new Set();
    for (const f of readdirSync(p)) {
      const full = join(p, f);
      const st = statSync(full);
      if (st.isDirectory()) {
        out.add(f);
      } else if (st.isFile()) {
        for (const ext of ['.tsx', '.ts']) {
          if (f.endsWith(ext)) {
            out.add(f.slice(0, -ext.length));
            break;
          }
        }
      }
    }
    return [...out].sort();
  } catch {
    return [];
  }
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
    // 与 Python os.walk 兼容: 按字母序处理子目录, 但 stack pop 顺序无关——
    // 文件级 distinct 计数对遍历顺序不敏感, 输出时另行排序.
    for (const e of entries) {
      const full = join(cur, e.name);
      if (e.isDirectory()) {
        if (SKIP_DIRS.has(e.name)) continue;
        stack.push(full);
      } else if (e.isFile()) {
        if (!EXTS.some((x) => e.name.endsWith(x))) continue;
        if (SKIP_FILE_PATTERNS.some((p) => p.test(e.name))) continue;
        yield full;
      }
    }
  }
}

function collectRefs() {
  // refs: Map<"kind|name", Map<dir-label, Set<filepath>>>
  const refs = new Map();
  function record(kind, name, label, fp) {
    const k = `${kind}|${name}`;
    let inner = refs.get(k);
    if (!inner) {
      inner = new Map();
      refs.set(k, inner);
    }
    let s = inner.get(label);
    if (!s) {
      s = new Set();
      inner.set(label, s);
    }
    s.add(fp);
  }
  for (const [label, root] of Object.entries(DIRS)) {
    for (const fp of walkFiles(root)) {
      let content;
      try {
        content = readFileSync(fp, 'utf8');
      } catch {
        continue;
      }
      SCAN_RE.lastIndex = 0;
      let m;
      while ((m = SCAN_RE.exec(content)) !== null) {
        for (const [kind, name] of normalize(m[1])) {
          record(kind, name, label, fp);
        }
      }
    }
  }
  return refs;
}

function refCount(refs, kind, name, label) {
  const inner = refs.get(`${kind}|${name}`);
  if (!inner) return 0;
  const s = inner.get(label);
  return s ? s.size : 0;
}

function makeRow(refs, kind, name) {
  const r = {};
  for (const label of DIR_ORDER) {
    r[label] = refCount(refs, kind, name, label);
  }
  return r;
}

function verdict(row) {
  const { ssg, ssr,  } = row;
  const pkgTotal = row['apps-ui'] + row['apps-base-kline'] + row['apps-icons'] + row['nex-theme'];
  const selfRef = row['apps-kit-self'];
  const appCount = [ssg, ssr].filter((x) => x > 0).length;
  if (appCount === 0 && pkgTotal === 0 && selfRef === 0) return '**死代码**';
  if (appCount === 0 && (pkgTotal > 0 || selfRef > 0)) return '仅内部/包间引用';
  if (appCount === 1) {
    const who = ssg > 0 ? 'SSG' : ssr > 0 ? 'SSR' : 'SSG';
    if (selfRef > 0) return `${who} 独占 (有内部链路, 可能间接共享)`;
    return `**${who} 独占**`;
  }
  if (appCount >= 2) return `${appCount} app 共享`;
  return '';
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
  const branch = run('branch', '--show-current') || '?';
  const commit = run('rev-parse', 'HEAD') || '?';
  const short = run('rev-parse', '--short=10', 'HEAD') || commit.slice(0, 10);
  const status = run('status', '--porcelain');
  const worktree = !status
    ? 'clean'
    : `dirty (${status.split('\n').length} 个文件)`;
  const lastMsg = run('log', '-1', '--pretty=%s');
  return { branch, commit, short, worktree, lastMsg };
}

function emitTable(out, title, items, kind, refs, localComponents) {
  out.push(`## ${title}`);
  out.push('');
  out.push('| 名称 | SSG | SSR  | apps-ui | base-kline | icons | nex-theme | kit-self | 同名冲突 | 判定 |');
  out.push('|------|----:|----:|-----:|--------:|-----------:|------:|----------:|---------:|---------|------|');
  const rows = [];
  for (const name of items) {
    const r = makeRow(refs, kind, name);
    const conflicts = [];
    if (kind === 'components') {
      for (const app of ['ssg', 'ssr', ]) {
        if (localComponents[app].has(name)) conflicts.push(app);
      }
    }
    rows.push({ name, r, conflicts, v: verdict(r) });
  }
  const sortKey = (x) => {
    if (x.v.includes('独占') && !x.v.includes('可能')) return 0;
    if (x.v.includes('独占')) return 1;
    if (x.v.includes('死代码')) return 2;
    if (x.v.includes('内部')) return 3;
    return 4;
  };
  rows.sort((a, b) => {
    const ka = sortKey(a);
    const kb = sortKey(b);
    if (ka !== kb) return ka - kb;
    return a.name < b.name ? -1 : a.name > b.name ? 1 : 0;
  });
  for (const { name, r, conflicts, v } of rows) {
    const conf = conflicts.length ? conflicts.join(',') : '—';
    out.push(
      `| \`${name}\` | ${r.ssg} | ${r.ssr} | ` +
      `${r['apps-ui']} | ${r['apps-base-kline']} | ${r['apps-icons']} | ` +
      `${r['nex-theme']} | ${r['apps-kit-self']} | ${conf} | ${v} |`
    );
  }
  out.push('');
}

function summarize(items, kind, refs) {
  const counts = new Map();
  for (const name of items) {
    const v = verdict(makeRow(refs, kind, name));
    counts.set(v, (counts.get(v) || 0) + 1);
  }
  return counts;
}

function autoFindings(out, refs, components, coreDirs, coreStoreAll) {
  const compSums = summarize(components, 'components', refs);
  const get = (k) => compSums.get(k) || 0;
  const multiApp = get('3 app 共享') + get('2 app 共享');
  let singleApp = 0;
  for (const [k, v] of compSums) if (k.includes('独占')) singleApp += v;
  const deadCount = get('**死代码**');
  const internalOnly = get('仅内部/包间引用');
  const totalComp = [...compSums.values()].reduce((a, b) => a + b, 0);
  const pct = (n) => ((n / totalComp) * 100).toFixed(1);

  const deadComponents = components
    .filter((n) => verdict(makeRow(refs, 'components', n)) === '**死代码**')
    .sort();

  const csOwners = { SSG: [], SSR: [] };
  for (const n of coreStoreAll) {
    const v = verdict(makeRow(refs, 'core-store', n));
    for (const app of ['SSG', 'SSR']) {
      if (v.startsWith(`**${app} 独占**`) || v.startsWith(`${app} 独占`)) {
        csOwners[app].push(n);
      }
    }
  }
  const coreNoApp = coreDirs
    .filter((n) => verdict(makeRow(refs, 'core', n)) === '仅内部/包间引用')
    .sort();

  out.push('## 关键发现');
  out.push('');
  out.push(
    `1. **components 多 app 共享率仅 ${pct(multiApp)}%**: ${totalComp} 个组件中仅 **${multiApp}** 个真正被多 app 复用 ` +
    `(${get('3 app 共享')} 个 3-app + ${get('2 app 共享')} 个 2-app); ` +
    `单 app 独占 **${singleApp}** 个 + 死代码 **${deadCount}** 个 + 仅内部 **${internalOnly}** 个 = ` +
    `**${singleApp + deadCount + internalOnly}** 个 (${pct(singleApp + deadCount + internalOnly)}%) 不属于多 app 复用.`
  );
  if (deadComponents.length) {
    out.push(
      `2. **死代码** (零引用 ${deadComponents.length} 个): ` +
      `\`components/{${deadComponents.join(', ')}}\` 全网无引用, 可直接删除.`
    );
  }
  if (coreNoApp.length) {
    out.push(
      `3. **core 顶层 12 目录中无 app 直接引用**: ` +
      `\`core/{${coreNoApp.join(', ')}}\` (${coreNoApp.length} 个), 仅通过其他 core 子模块间接服务.`
    );
  }
  const parts = [];
  for (const app of ['SSG', 'SSR']) {
    if (csOwners[app].length) {
      parts.push(`${app} 独占 ${csOwners[app].length} 个 (\`${csOwners[app].join(', ')}\`)`);
    }
  }
  if (parts.length) {
    out.push(`5. **core/store/src 单 app 独占**: ${parts.join('; ')}.`);
  }
  out.push('');
}

function grepCount(pattern, root) {
  const re = new RegExp(pattern);
  const files = new Set();
  for (const fp of walkFiles(root)) {
    let content;
    try {
      content = readFileSync(fp, 'utf8');
    } catch {
      continue;
    }
    if (re.test(content)) files.add(fp);
  }
  return files.size;
}

function grepCountApps(pattern) {
  return ['ssg', 'ssr']
    .map((app) => grepCount(pattern, DIRS[app]))
    .reduce((a, b) => a + b, 0);
}

function grepLocalStorage(root) {
  const re = /['"](@\/core\/local-storage|(@apps\/kit|@)\/core\/store\/src\/local-storage)['"\\/]/;
  const files = new Set();
  for (const fp of walkFiles(root)) {
    let content;
    try {
      content = readFileSync(fp, 'utf8');
    } catch {
      continue;
    }
    if (re.test(content)) files.add(fp);
  }
  return files.size;
}

function emitSanityCheck(out, refs) {
  const anchors = [
    [
      'core/workers apps-kit 内部引用',
      refCount(refs, 'core', 'workers', 'apps-kit-self'),
      grepCount('(@apps/kit/|@/)core/workers', APPS_KIT),
    ],
    [
      'components/footer 三 app 直接引用',
      ['ssg', 'ssr']
        .map((a) => refCount(refs, 'components', 'footer', a))
        .reduce((a, b) => a + b, 0),
      grepCountApps('(@apps/kit/|@/)components/footer'),
    ],
    [
      'components/trade-ui-temp SSG 引用',
      refCount(refs, 'components', 'trade-ui-temp', 'ssg'),
      grepCount('(@apps/kit/|@/)components/trade-ui-temp', DIRS.ssg),
    ],
    [
      'core/network SSG 引用 (含 @/core/api alias)',
      refCount(refs, 'core', 'network', 'ssg'),
      grepCount('(@apps/kit/|@/)core/(api|network)', DIRS.ssg),
    ],
    [
      'core/store/src/local-storage SSG 引用 (含 @/core/local-storage alias)',
      refCount(refs, 'core-store', 'local-storage', 'ssg'),
      grepLocalStorage(DIRS.ssg),
    ],
  ];
  out.push('## 准确性核验');
  out.push('');
  out.push('脚本内独立 cross-check (用文件级 distinct grep 与主统计对比):');
  out.push('');
  out.push('| 锚点 | 主统计 | grep 验证 | 一致 |');
  out.push('|------|------:|---------:|:----:|');
  for (const [title, main, ver] of anchors) {
    const ok = main === ver ? '✓' : '**✗ 不一致**';
    out.push(`| ${title} | ${main} | ${ver} | ${ok} |`);
  }
  out.push('');
}

function todayIso() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function main() {
  const components = listDirsAndFiles(`${APPS_KIT}/components`);
  const coreDirs = listDirs(`${APPS_KIT}/core`);
  const coreStoreAll = listDirsAndFiles(`${APPS_KIT}/core/store/src`);
  const localComponents = {};
  for (const app of ['ssg', 'ssr']) {
    localComponents[app] = new Set(listDirs(`${DIRS[app]}/src/components`));
  }
  const refs = collectRefs();
  const meta = gitMeta();

  const out = [];
  out.push('# apps-kit 共享性审计报告');
  out.push('');
  out.push(`- 统计日期: ${todayIso()}`);
  out.push(`- 分支: \`${meta.branch}\``);
  out.push(`- Commit: \`${meta.short}\` — ${meta.lastMsg}`);
  out.push(`- 工作树: ${meta.worktree}`);
  out.push(
    `- apps-kit/components 顶层条目: **${components.length}** ` +
    `(${components.length - 1} 目录 + 1 文件 zendesk)`
  );
  out.push(`- apps-kit/core 子目录: **${coreDirs.length}**`);
  out.push(`- apps-kit/core/store/src 顶层条目: **${coreStoreAll.length}**`);
  out.push('');

  autoFindings(out, refs, components, coreDirs, coreStoreAll);
  emitSanityCheck(out, refs);

  out.push('## 判定规则');
  out.push('');
  out.push('- **引用计数**: 文件级 distinct (一个文件多次 import 同一模块算 1)');
  out.push('- **覆盖的 import 形式**: `@apps/kit/<kind>/<name>` / `@/<kind>/<name>` / 4 类专项 alias / NPM 风格 `react-copy-to-clipboard`');
  out.push('- **多目标归类**: 一次 `@/core/store/src/resso` 同时记入 `core/store` 和 `core-store/resso`');
  out.push('- **扫描根**: `apps/<app>/` 整个目录 + 5 个 packages');
  out.push('- **跳过目录**: ' + [...SKIP_DIRS].sort().join(', '));
  out.push('- **跳过配置文件**: next.config.* / postcss.config.* / pm2-*.config.* / analyze.js / server.js / sentry.*.config.js');
  out.push('- **扫描扩展名**: ' + EXTS.join(', '));
  out.push('- **判定**: 0 app + 0 内部 + 0 包间 → 死代码; 1 app + 0 内部 → 该 app 独占 (确证); 1 app + 内部 > 0 → 该 app 独占 (有内部链路); 2/3 app → 多 app 共享');
  out.push('- **未覆盖**: 动态 import / require() / 字符串拼接 import / 相对路径 (apps-kit 内部多用相对路径)');
  out.push('');

  emitTable(out, `Components (${components.length} 顶层条目)`, components, 'components', refs, localComponents);
  emitTable(out, `Core (${coreDirs.length} 子目录)`, coreDirs, 'core', refs, localComponents);
  emitTable(out, `Core/Store 顶层条目 (${coreStoreAll.length})`, coreStoreAll, 'core-store', refs, localComponents);

  out.push('## 汇总');
  out.push('');
  for (const [label, items, kind] of [
    [`Components (${components.length})`, components, 'components'],
    [`Core (${coreDirs.length})`, coreDirs, 'core'],
    [`Core/Store (${coreStoreAll.length})`, coreStoreAll, 'core-store'],
  ]) {
    out.push(`### ${label}`);
    const sums = summarize(items, kind, refs);
    const total = [...sums.values()].reduce((a, b) => a + b, 0);
    const sorted = [...sums.entries()].sort((a, b) => {
      if (a[1] !== b[1]) return b[1] - a[1];
      return a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0;
    });
    for (const [k, v] of sorted) {
      const pct = total ? `${((v / total) * 100).toFixed(1)}%` : '—';
      out.push(`- ${k}: **${v}** (${pct})`);
    }
    out.push('');
  }

  process.stdout.write(out.join('\n') + '\n');
}

main();
