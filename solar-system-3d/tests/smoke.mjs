/**
 * 冒烟测试：用 Playwright 以 file:// 打开页面，验证"能跑起来 + 交互可用 + 数值合理"。
 *
 * 前置：npm i -D playwright && npx playwright install chromium
 *       （若环境已全局安装 playwright，脚本会自动按常见路径解析）
 * 运行：node tests/smoke.mjs                       # 测多文件版 index.html
 *       node tests/smoke.mjs dist/solar-system.html # 测单文件打包版
 * 退出码：0 全部通过；1 有断言失败。
 */
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const require = createRequire(import.meta.url);
function loadPlaywright() {
  const candidates = ['playwright', '/opt/node-tools/node_modules/playwright', 'playwright-core'];
  for (const id of candidates) {
    try { return require(id); } catch (_) { /* 继续尝试下一个 */ }
  }
  throw new Error('未找到 playwright，请先 npm i -D playwright');
}

const { chromium } = loadPlaywright();
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
// 默认测多文件版；传入路径可改测单文件打包版（两者行为应完全一致）
const target = path.resolve(root, process.argv[2] || 'index.html');
const url = 'file://' + target;
console.log('目标页面：' + target + '\n');

let failed = 0;
function check(name, ok, detail) {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail === undefined ? '' : '  → ' + detail}`);
  if (!ok) failed += 1;
}

const browser = await chromium.launch({
  args: ['--enable-unsafe-swiftshader', '--use-gl=angle', '--use-angle=swiftshader'],
});
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const pageErrors = [];
page.on('pageerror', (e) => pageErrors.push(e.message));
page.on('console', (m) => { if (m.type() === 'error') pageErrors.push('[console] ' + m.text()); });

await page.goto(url, { waitUntil: 'load' });
await page.waitForFunction(() => document.getElementById('loading')?.classList.contains('is-hidden'), { timeout: 60000 });
await page.waitForTimeout(1200);

check('页面无致命错误遮罩', !(await page.locator('#fatal').isVisible()));
check('WebGL 场景已渲染', (await page.evaluate(() => window.SolarSystem.App.ctx.renderer.info.render.calls)) > 0);

// 星历合理性：行星日心距应落在各自近/远日距之间
const eph = await page.evaluate(() => {
  const A = window.SolarSystem.App;
  const out = [];
  A.ctx.bodies.forEach((e, k) => { if (e.state) out.push({ k, r: e.state.r, q: e.state.perihelion, Q: e.state.aphelion, v: e.state.speedKmS }); });
  return out;
});
eph.forEach((b) => check(`${b.k} 日心距在近/远日距之间`, b.r >= b.q - 1e-6 && b.r <= b.Q + 1e-6, b.r.toFixed(4) + ' ∈ [' + b.q.toFixed(3) + ', ' + b.Q.toFixed(3) + ']'));
const earth = eph.find((b) => b.k === 'earth');
check('地球公转速度 ≈ 29.8 km/s', Math.abs(earth.v - 29.8) < 0.5, earth.v.toFixed(3));

// 实时模式应与系统时钟一致（< 1 秒）
const drift = await page.evaluate(() => Math.abs(window.SolarSystem.App.state.jd - window.SolarSystem.Ephemeris.julianDay(new Date())) * 86400);
check('实时模式与系统时钟同步', drift < 1, drift.toFixed(3) + ' 秒');

// 画布拾取
const jp = await page.evaluate(() => {
  const A = window.SolarSystem.App;
  const v = A.ctx.bodies.get('jupiter').scenePos.clone().project(A.ctx.camera);
  return { x: (v.x * 0.5 + 0.5) * window.innerWidth, y: (-v.y * 0.5 + 0.5) * window.innerHeight };
});
await page.mouse.click(jp.x, jp.y);
await page.waitForTimeout(300);
check('点击画布可选中木星', (await page.evaluate(() => window.SolarSystem.App.state.selected)) === 'jupiter');
check('信息面板已填充', (await page.textContent('#d-name')) === '木星');
check('实时数据行数 > 8', (await page.locator('#d-live tr').count()) > 8);

// 拖拽不应被误判为点击
await page.keyboard.press('Escape');
await page.mouse.move(700, 300); await page.mouse.down();
await page.mouse.move(820, 360, { steps: 8 }); await page.mouse.up();
await page.waitForTimeout(200);
check('拖拽不触发选择', (await page.evaluate(() => window.SolarSystem.App.state.selected)) === null);

// 时间控制
await page.selectOption('#t-speed', '2592000');
await page.waitForTimeout(1500);
const t1 = await page.evaluate(() => window.SolarSystem.App.state.jd);
await page.waitForTimeout(1000);
const rate = (await page.evaluate(() => window.SolarSystem.App.state.jd)) - t1;
check('30 天/秒 流速近似正确', rate > 20 && rate < 40, rate.toFixed(2) + ' 天/秒');
await page.click('#t-pause');
const p1 = await page.evaluate(() => window.SolarSystem.App.state.jd);
await page.waitForTimeout(500);
check('暂停后时间不再推进', (await page.evaluate(() => window.SolarSystem.App.state.jd)) === p1);
await page.click('#t-live');

// 比例切换
await page.check('#v-realdist');
await page.waitForTimeout(600);
const span = await page.evaluate(() => {
  const A = window.SolarSystem.App;
  return A.ctx.bodies.get('neptune').scenePos.length() / A.ctx.bodies.get('earth').scenePos.length();
});
check('真实距离下海王星/地球 ≈ 30', Math.abs(span - 30) < 2, span.toFixed(2));
await page.uncheck('#v-realdist');
await page.waitForTimeout(600);
const span2 = await page.evaluate(() => {
  const A = window.SolarSystem.App;
  return A.ctx.bodies.get('neptune').scenePos.length() / A.ctx.bodies.get('earth').scenePos.length();
});
check('压缩距离下该比值 ≈ √30', Math.abs(span2 - Math.sqrt(30)) < 0.4, span2.toFixed(2));

check('运行期间无 JS 异常', pageErrors.length === 0, pageErrors.slice(0, 3).join(' | ') || '无');

await browser.close();
console.log(failed ? `\n${failed} 项失败` : '\n全部通过');
process.exit(failed ? 1 : 0);
