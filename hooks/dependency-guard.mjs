#!/usr/bin/env node
let input = '';
process.stdin.on('data', (chunk) => {
  input += chunk;
});

process.stdin.on('end', () => {
  let payload;
  try {
    payload = JSON.parse(input || '{}');
  } catch (error) {
    console.log(input);
    return;
  }

  const command = payload.tool_input?.command || '';
  const dependencyPatterns = [
    /\bpnpm\s+add\b/,
    /\bnpm\s+install\b/,
    /\bnpm\s+i\b/,
    /\byarn\s+add\b/,
    /\bbun\s+add\b/,
  ];

  if (dependencyPatterns.some((pattern) => pattern.test(command))) {
    console.error('[BYDFi Hook] 已阻断新增依赖命令。项目规则要求不得擅自引入新依赖，请先获得用户明确确认。');
    process.exit(2);
  }

  console.log(input);
});
