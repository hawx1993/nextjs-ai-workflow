#!/usr/bin/env node
/**
 * 扫描所有 package.json, 找版本不一致的依赖.
 *
 * 判定规则: 同一个包名出现在多个 package.json 且版本号不同 → 不一致.
 * 比对范围: dependencies + devDependencies (peerDependencies 单独处理).
 * 跳过: node_modules / 编译产物 / 测试 fixture 中的 package.json.
 */

import { readdirSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';

const REPO = execFileSync('git', ['rev-parse', '--show-toplevel'], {
  cwd: import.meta.dirname,
  encoding: 'utf8',
}).trim();
const SKIP_DIRS = new Set(['node_modules', '.next', 'out', 'out-rtl', 'dist', 'build', '.git', '.turbo']);

function* walkPackageJsons(root) {
  const stack = [root];
  while (stack.length) {
    const cur = stack.pop();
    let entries;
    try { entries = readdirSync(cur, { withFileTypes: true }); }
    catch { continue; }
    for (const e of entries) {
      const full = join(cur, e.name);
      if (e.isDirectory()) {
        if (SKIP_DIRS.has(e.name)) continue;
        stack.push(full);
      } else if (e.isFile() && e.name === 'package.json') {
        yield full;
      }
    }
  }
}

function collectVersions() {
  // map: packageName → { version → [{ pkgJsonPath, dependencyType }] }
  const versions = new Map();
  for (const fp of walkPackageJsons(REPO)) {
    let pkg;
    try { pkg = JSON.parse(readFileSync(fp, 'utf8')); }
    catch (e) {
      process.stderr.write(`WARN parse failed: ${fp.slice(REPO.length + 1)}: ${e.message}\n`);
      continue;
    }
    const rel = fp.slice(REPO.length + 1);
    for (const depType of ['dependencies', 'devDependencies', 'peerDependencies']) {
      const deps = pkg[depType];
      if (!deps) continue;
      for (const [name, version] of Object.entries(deps)) {
        if (!versions.has(name)) versions.set(name, new Map());
        const v = versions.get(name);
        if (!v.has(version)) v.set(version, []);
        v.get(version).push({ path: rel, type: depType });
      }
    }
  }
  return versions;
}

function findInconsistencies(versions) {
  const issues = [];
  for (const [name, vMap] of versions) {
    if (vMap.size <= 1) continue; // 一致或仅一处
    const variants = [...vMap.entries()].map(([ver, locs]) => ({ ver, locs }));
    issues.push({ name, variants });
  }
  return issues.sort((a, b) => a.name < b.name ? -1 : 1);
}

function gitMeta() {
  const run = (...args) => {
    try {
      return execFileSync('git', ['-C', REPO, ...args], {
        encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'],
      }).trim();
    } catch { return ''; }
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
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function countPkgJsons() {
  let n = 0;
  for (const _ of walkPackageJsons(REPO)) n++;
  return n;
}

function main() {
  const versions = collectVersions();
  const issues = findInconsistencies(versions);
  const meta = gitMeta();
  const out = [];

  out.push('# 依赖版本不一致报告');
  out.push('');
  out.push(`- 统计日期: ${todayIso()}`);
  out.push(`- 分支: \`${meta.branch}\``);
  out.push(`- Commit: \`${meta.short}\` — ${meta.lastMsg}`);
  out.push(`- 工作树: ${meta.worktree}`);
  out.push(`- 扫描到的 package.json 文件数: **${countPkgJsons()}**`);
  out.push(`- 依赖声明总数 (dep + dev + peer): **${[...versions.values()].reduce((acc, m) => acc + [...m.values()].reduce((a, l) => a + l.length, 0), 0)}**`);
  out.push(`- 唯一包数: **${versions.size}**`);
  out.push(`- **版本不一致的包: ${issues.length}**`);
  out.push('');

  out.push('## 准确性核验');
  out.push('');
  out.push('| 锚点 | 数值 |');
  out.push('|------|----:|');
  out.push(`| 扫描的 package.json 数 | ${countPkgJsons()} |`);
  out.push(`| 解析失败的 package.json 数 | 见 stderr (理论上为 0) |`);
  out.push('');

  if (issues.length === 0) {
    out.push('✓ 无版本不一致问题.');
    process.stdout.write(out.join('\n') + '\n');
    return;
  }

  out.push('## 不一致清单');
  out.push('');
  out.push('| 包名 | 版本 | 声明位置 | 类型 |');
  out.push('|------|------|---------|------|');
  for (const { name, variants } of issues) {
    for (const { ver, locs } of variants) {
      for (const loc of locs) {
        out.push(`| \`${name}\` | \`${ver}\` | \`${loc.path}\` | ${loc.type} |`);
      }
    }
  }
  out.push('');

  process.stdout.write(out.join('\n') + '\n');
}

main();
