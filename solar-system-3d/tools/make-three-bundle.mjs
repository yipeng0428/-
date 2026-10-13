#!/usr/bin/env node
/**
 * 把官方 three.js ESM 构建转换成可被普通 <script> 直接加载的全局包 (window.THREE)。
 *
 * 为什么需要这一步：
 *   浏览器在 file:// 协议下禁止加载 ES module（CORS 限制），但允许加载普通脚本。
 *   为了让 index.html 双击即可运行（不必起本地服务器），这里把 ESM 的
 *   `export{内部名 as 公开名, ...}` 结尾语句改写成 `window.THREE = { 公开名: 内部名, ... }`，
 *   并整体包进 IIFE，避免污染全局作用域。只做这一处纯文本改写，不触碰 three.js 其余代码。
 *
 * 用法：
 *   curl -L -o /tmp/three.module.min.js \
 *     https://cdn.jsdelivr.net/npm/three@0.169.0/build/three.module.min.js
 *   node tools/make-three-bundle.mjs /tmp/three.module.min.js vendor/three.bundle.js
 */
import { readFileSync, writeFileSync } from 'node:fs';

const [input, output = 'vendor/three.bundle.js'] = process.argv.slice(2);
if (!input) {
  console.error('用法: node tools/make-three-bundle.mjs <three.module.min.js> [输出路径]');
  process.exit(1);
}

const source = readFileSync(input, 'utf8');

const matches = [...source.matchAll(/\bexport\s*\{/g)];
if (matches.length !== 1) {
  throw new Error(`期望恰好 1 条 export 语句，实际找到 ${matches.length} 条；three.js 构建格式可能已变化。`);
}

const start = matches[0].index;
const open = source.indexOf('{', start);
const close = source.indexOf('}', open);
if (close < 0) throw new Error('无法定位 export 语句的结束花括号。');

const body = source.slice(open + 1, close);
const tail = source.slice(close + 1).trim();
if (tail !== ';' && tail !== '') {
  throw new Error(`export 语句之后存在未处理的代码: ${tail.slice(0, 80)}`);
}

const pairs = body
  .split(',')
  .map((entry) => entry.trim())
  .filter(Boolean)
  .map((entry) => {
    const m = /^([A-Za-z_$][\w$]*)\s+as\s+([A-Za-z_$][\w$]*)$/.exec(entry) || /^([A-Za-z_$][\w$]*)$/.exec(entry);
    if (!m) throw new Error(`无法解析导出项: ${entry}`);
    const local = m[1];
    const exported = m[2] ?? m[1];
    return [exported, local];
  });

const version = /const\s+[A-Za-z_$][\w$]*\s*=\s*"(\d+)"/.exec(source)?.[1] ?? 'unknown';

const bundle = [
  '/**',
  ' * three.js —— 由 tools/make-three-bundle.mjs 从官方 ESM 构建自动生成，请勿手工编辑。',
  ` * 版本: r${version}  许可证: MIT (Copyright Three.js Authors, SPDX-License-Identifier: MIT)`,
  ' * 来源: https://cdn.jsdelivr.net/npm/three@0.169.0/build/three.module.min.js',
  ' */',
  '(function () {',
  source.slice(0, start),
  `\nvar __THREE_EXPORTS__ = {${pairs.map(([exported, local]) => `${JSON.stringify(exported)}:${local}`).join(',')}};`,
  'if (typeof window !== "undefined") { window.THREE = __THREE_EXPORTS__; }',
  'else if (typeof globalThis !== "undefined") { globalThis.THREE = __THREE_EXPORTS__; }',
  '})();',
  '',
].join('\n');

writeFileSync(output, bundle);
console.log(`已写出 ${output}：three r${version}，导出 ${pairs.length} 个符号，${(bundle.length / 1024).toFixed(0)} KB`);
