#!/usr/bin/env node
/**
 * 把整个项目打包成单个 HTML 文件。
 * ---------------------------------------------------------------
 * 做法很直白：按 index.html 里原有的加载顺序，把 <link rel=stylesheet>
 * 与每个 <script src> 替换成内联内容。因为项目本来就不用 ES module、
 * 不请求任何外部资源（three.js 已内置、纹理运行时生成），内联之后
 * 行为与多文件版本完全一致。
 *
 * 用法：node tools/build-single-file.mjs [输出路径]
 * 默认输出：dist/solar-system.html
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outPath = resolve(process.argv[2] || join(root, 'dist', 'solar-system.html'));

const read = (rel) => readFileSync(join(root, rel), 'utf8');

/**
 * 内联文本里若出现字面量 </script>，会提前关闭宿主 script 标签。
 * 当前源码中并不存在，但保留这层防御，避免日后加入字符串时静默炸掉。
 */
const safe = (code) => code.replace(/<\/script/gi, '<\\/script');

let html = read('index.html');

// 1) 样式
const css = read('styles.css');
const linkRe = /[ \t]*<link rel="stylesheet" href="styles\.css"[^>]*>\r?\n?/;
if (!linkRe.test(html)) throw new Error('未找到 styles.css 的 <link> 标签，index.html 结构可能已变化');
html = html.replace(linkRe, `<style>\n${css}\n</style>\n`);

// 2) 脚本：保持 index.html 中的原有顺序，逐个替换为内联
const scriptRe = /[ \t]*<script src="([^"]+)"><\/script>\r?\n?/g;
const inlined = [];
html = html.replace(scriptRe, (_m, src) => {
  const code = read(src);
  inlined.push(`${src} (${(code.length / 1024).toFixed(0)} KB)`);
  return `<script>\n/* ===== ${src} ===== */\n${safe(code)}\n</script>\n`;
});
if (inlined.length === 0) throw new Error('未找到任何外部脚本标签，index.html 结构可能已变化');

// 3) 标注这是生成物
const banner = `<!--
  太阳系 · 实时 3D 模拟 —— 单文件版（由 tools/build-single-file.mjs 自动生成，请勿手工编辑）
  源码仓库结构见 solar-system-3d/；要修改请改源文件后重新生成。
  生成时间：${new Date().toISOString()}
  内含：three.js r169 (MIT, Copyright Three.js Authors) + 本项目源码
  直接双击本文件即可运行，无需联网、无需本地服务器。
-->
`;
html = html.replace(/^<!doctype html>\r?\n/i, (m) => m + banner);

mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, html);

console.log(`已生成 ${outPath}`);
console.log(`  内联样式 styles.css (${(css.length / 1024).toFixed(0)} KB)`);
inlined.forEach((s) => console.log(`  内联脚本 ${s}`));
console.log(`  总大小 ${(html.length / 1024 / 1024).toFixed(2)} MB`);
