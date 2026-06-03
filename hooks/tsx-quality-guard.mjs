#!/usr/bin/env node
let input = '';
process.stdin.on('data', (chunk) => {
  input += chunk;
});

const COLOR_RE = /#[0-9a-fA-F]{3,8}\b|\brgba?\s*\(|\bhsla?\s*\(/;
const CONSOLE_RE = /\bconsole\.log\s*\(/;
const CHINESE_TEXT_RE = />\s*[^<{]*[一-鿿][^<{]*\s*</;
const LANG_OUTSIDE_HINT_RE = /^(?:\s*(?:const|let|var)\s+\w+\s*=\s*)?LANG\s*\(/m;
const LANG_TEMPLATE_RE = /LANG\s*\(\s*`[^`]*\$\{/;

process.stdin.on('end', () => {
  let payload;
  try {
    payload = JSON.parse(input || '{}');
  } catch (error) {
    console.log(input);
    return;
  }

  const toolInput = payload.tool_input || {};
  const filePath = toolInput.file_path || '';
  if (!/\.(ts|tsx|js|jsx)$/.test(filePath)) {
    console.log(input);
    return;
  }

  const chunks = [toolInput.content, toolInput.new_string].filter(Boolean).join('\n');
  if (!chunks) {
    console.log(input);
    return;
  }

  const warnings = [];
  if (CONSOLE_RE.test(chunks)) warnings.push('发现 console.log，请确认不要提交调试输出。');
  if (COLOR_RE.test(chunks)) warnings.push('发现疑似硬编码颜色，请优先使用 --spec-* / --skin-* CSS 变量。');
  if (CHINESE_TEXT_RE.test(chunks) && !/LANG\s*\(/.test(chunks)) warnings.push('发现疑似硬编码中文文案，请使用 LANG 包裹。');
  if (LANG_TEMPLATE_RE.test(chunks)) warnings.push('发现 LANG 模板字符串插值，请改用 {placeholder} + 参数对象。');
  if (LANG_OUTSIDE_HINT_RE.test(chunks) && !/function|=>|return|const\s+\w+\s*=\s*\(/.test(chunks)) warnings.push('发现疑似组件/函数外 LANG 调用，请确认运行时上下文。');

  if (warnings.length > 0) {
    console.error('[BYDFi Hook] TSX 质量提醒：');
    warnings.forEach((warning) => console.error(`- ${warning}`));
  }

  console.log(input);
});
