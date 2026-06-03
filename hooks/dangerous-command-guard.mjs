#!/usr/bin/env node
const fs = require('fs');

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
  const dangerousPatterns = [
    /\brm\s+-rf\s+(\/|~|\.|\.\.)/,
    /\bsudo\b/,
    /\bchmod\s+-R\s+777\b/,
    /\bchown\s+-R\b/,
    />\s*\/dev\/disk/,
    /\bdd\s+.*\bof=/,
  ];

  const matched = dangerousPatterns.find((pattern) => pattern.test(command));
  if (matched) {
    console.error('[BYDFi Hook] 已阻断危险命令。请说明必要性并让用户明确授权后再执行。');
    process.exit(2);
  }

  console.log(input);
});
