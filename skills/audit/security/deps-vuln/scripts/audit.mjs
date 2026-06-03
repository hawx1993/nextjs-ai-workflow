#!/usr/bin/env node
/**
 * deps-vuln 依赖漏洞扫描脚本.
 *
 * 流程:
 *   1. pnpm audit --json --registry https://registry.npmjs.org
 *      (项目 .npmrc 默认 npmmirror 不支持 audit, 必须显式指定官方 registry)
 *   2. 解析 JSON: advisories + metadata.vulnerabilities (npm audit v1 格式)
 *   3. 按严重程度分类 (critical / high / moderate / low)
 *   4. 跨包关联: findings[*].paths 首段为受影响的 workspace
 *
 * 半 deterministic:
 *   - 输入 = package.json + pnpm-lock.yaml (本地, deterministic)
 *           + npm registry 漏洞数据 (实时, 非 deterministic)
 *   - 同一时刻跑两次结果一致, 跨天可能有新漏洞数据.
 */

import { execFileSync } from 'node:child_process';

const REPO = execFileSync('git', ['rev-parse', '--show-toplevel'], {
  cwd: import.meta.dirname,
  encoding: 'utf8',
}).trim();

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
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function runPnpmAudit() {
  // pnpm audit 在有漏洞时退出码非 0, 但 stdout 仍是 JSON
  const args = ['audit', '--json', '--registry', 'https://registry.npmjs.org'];
  try {
    const r = execFileSync('pnpm', args, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      maxBuffer: 200 * 1024 * 1024,
      cwd: REPO,
      timeout: 90000,
    });
    return { ok: true, raw: r };
  } catch (e) {
    if (e.stdout && e.stdout.length > 0) {
      return { ok: true, raw: e.stdout, exitCode: e.status };
    }
    return { ok: false, error: e.message || 'unknown', stderr: e.stderr || '' };
  }
}

function parseAudit(raw) {
  try {
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

function workspacesFromPaths(paths) {
  // paths 形如 ["apps__bydfi-ssg>axios>...", ...]
  // 取首段 (双下划线分隔的 workspace 名)
  const set = new Set();
  for (const p of paths || []) {
    const head = p.split('>')[0].replace(/^[.]/, '').replace(/_+/g, '/');
    if (head) set.add(head);
  }
  return [...set].sort();
}

function severityRank(sev) {
  return { critical: 4, high: 3, moderate: 2, low: 1, info: 0 }[sev] ?? -1;
}

function main() {
  const meta = gitMeta();
  const auditResult = runPnpmAudit();
  const out = [];

  out.push('# 依赖漏洞审计报告');
  out.push('');
  out.push(`- 统计日期: ${todayIso()}`);
  out.push(`- 分支: \`${meta.branch}\``);
  out.push(`- Commit: \`${meta.short}\` — ${meta.lastMsg}`);
  out.push(`- 工作树: ${meta.worktree}`);
  out.push('- 审计工具: `pnpm audit --json --registry https://registry.npmjs.org`');
  out.push('- **半 deterministic**: 漏洞数据源自 npm registry 实时, 跨天可能有新漏洞');
  out.push('');

  if (!auditResult.ok) {
    out.push('## ❌ 审计失败');
    out.push('');
    out.push('```');
    out.push(auditResult.error);
    if (auditResult.stderr) {
      out.push('---stderr---');
      out.push(auditResult.stderr.toString().slice(0, 2000));
    }
    out.push('```');
    out.push('');
    out.push('排查建议: 检查网络 / registry 配置 / pnpm 版本.');
    process.stdout.write(out.join('\n') + '\n');
    process.exit(1);
  }

  const data = parseAudit(auditResult.raw);
  if (!data) {
    out.push('## ❌ JSON 解析失败');
    out.push('');
    out.push('```');
    out.push(auditResult.raw.slice(0, 2000));
    out.push('```');
    process.stdout.write(out.join('\n') + '\n');
    process.exit(1);
  }

  const advisories = data.advisories || {};
  const summary = data.metadata?.vulnerabilities || {};
  const total = (summary.critical || 0) + (summary.high || 0) + (summary.moderate || 0) + (summary.low || 0);

  out.push('## 概览');
  out.push('');
  out.push('| 项 | 数量 |');
  out.push('|------|----:|');
  out.push(`| 总漏洞数 | **${total}** |`);
  out.push(`| critical | ${summary.critical || 0} |`);
  out.push(`| high | ${summary.high || 0} |`);
  out.push(`| moderate | ${summary.moderate || 0} |`);
  out.push(`| low | ${summary.low || 0} |`);
  out.push(`| info | ${summary.info || 0} |`);
  out.push(`| 总依赖数 (含 transitives) | ${data.metadata?.totalDependencies || '?'} |`);
  out.push('');

  if (total === 0) {
    out.push('✓ 无已知漏洞.');
    out.push('');
    process.stdout.write(out.join('\n') + '\n');
    return;
  }

  // 按严重程度排序展开
  const advList = Object.values(advisories).sort((a, b) => {
    const sr = severityRank(b.severity) - severityRank(a.severity);
    if (sr !== 0) return sr;
    return a.module_name.localeCompare(b.module_name);
  });

  out.push('## 漏洞详情');
  out.push('');
  out.push('| 包名 | 严重 | 当前版本范围 | 修复版本 | 受影响 workspace | 类型 | 漏洞标题 |');
  out.push('|------|------|------|------|------|------|------|');
  for (const adv of advList) {
    const findings = adv.findings || [];
    const allPaths = findings.flatMap((f) => f.paths || []);
    const workspaces = workspacesFromPaths(allPaths);
    const types = new Set();
    for (const f of findings) {
      const dev = (f.dev !== undefined ? f.dev : (f.paths || []).some((p) => p.includes('devDependencies')));
      types.add(dev ? 'devDeps' : 'deps');
    }
    out.push(
      `| \`${adv.module_name}\` | ${adv.severity} | ${adv.vulnerable_versions || '—'} | ${adv.patched_versions || '—'} | ${workspaces.slice(0, 3).join(', ')}${workspaces.length > 3 ? ` (+${workspaces.length - 3})` : ''} | ${[...types].join('/') || '—'} | ${(adv.title || '').replace(/\|/g, '\\|')} |`
    );
  }
  out.push('');

  out.push('## 修复建议 (按严重程度优先级)');
  out.push('');
  out.push('| 优先级 | 包名 | 建议操作 |');
  out.push('|------|------|------|');
  const priorityOrder = { critical: 1, high: 2, moderate: 3, low: 4 };
  const sorted = advList
    .filter((a) => priorityOrder[a.severity])
    .sort((a, b) => priorityOrder[a.severity] - priorityOrder[b.severity]);
  for (const adv of sorted) {
    const fix = adv.patched_versions && adv.patched_versions !== '<0.0.0'
      ? `升级到 \`${adv.patched_versions}\``
      : '手动评估 (无修复版本)';
    out.push(`| ${adv.severity} | \`${adv.module_name}\` | ${fix} |`);
  }
  out.push('');

  out.push('## 准确性核验');
  out.push('');
  out.push('| 锚点 | 数值 |');
  out.push('|------|----:|');
  out.push(`| advisories 条目数 | ${Object.keys(advisories).length} |`);
  out.push(`| metadata.vulnerabilities 总和 | ${total} |`);
  out.push(`| advisories 与 metadata 一致 | ${Object.keys(advisories).length === total ? '✓' : `~ (advisory ${Object.keys(advisories).length} vs metadata ${total})`} |`);
  out.push('');
  out.push('> 注: advisories 是漏洞清单, metadata.vulnerabilities 是按严重程度的计数. 两者数量通常相等; 若不等可能是同一漏洞影响多版本.');
  out.push('');

  out.push('## 已知陷阱');
  out.push('');
  out.push('- **npmmirror 不支持 audit**: 项目 `.npmrc` 默认 `registry.npmmirror.com` 不支持 audit 端点. 脚本已显式 `--registry https://registry.npmjs.org` 绕过.');
  out.push('- **退出码非 0 是预期**: 有漏洞时 pnpm audit 退出码非 0, 但 stdout 仍是有效 JSON. 脚本已处理.');
  out.push('- **devDeps 优先级**: devDependencies 漏洞不直接影响生产, 修复优先级低于 dependencies (见上方"修复建议"标注的 类型 列).');
  out.push('');

  process.stdout.write(out.join('\n') + '\n');
}

main();
