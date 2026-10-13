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
  A.ctx.bodies.forEach((e, k) => {
    if (e.state && !e.def.parent) out.push({ k, r: e.state.r, q: e.state.perihelion, Q: e.state.aphelion, v: e.state.speedKmS });
  });
  return out;
});
eph.forEach((b) => check(`${b.k} 日心距在近/远日距之间`, b.r >= b.q - 1e-6 && b.r <= b.Q + 1e-6, b.r.toFixed(4) + ' ∈ [' + b.q.toFixed(3) + ', ' + b.Q.toFixed(3) + ']'));
const earth = eph.find((b) => b.k === 'earth');
check('地球公转速度 ≈ 29.8 km/s', Math.abs(earth.v - 29.8) < 0.5, earth.v.toFixed(3));

// 月球：地心距应落在真实的近/远地点之间，月相自洽
const moon = await page.evaluate(() => {
  const m = window.SolarSystem.App.ctx.bodies.get('moon').state;
  return { km: m.geocentricDistanceKm, lit: m.illuminated, name: m.phaseName, age: m.age, elong: m.elongationFromSun, waxing: m.waxing };
});
check('月球地心距在 356,000–407,000 km 之间', moon.km > 356000 && moon.km < 407000, Math.round(moon.km) + ' km');
check('月相照亮比例在 0–1 之间', moon.lit >= 0 && moon.lit <= 1, (moon.lit * 100).toFixed(1) + '%');
check('月龄与黄经差自洽', Math.abs(moon.age - moon.elong / 360 * 29.530589) < 1e-6, moon.age.toFixed(2) + ' 天 / ' + moon.elong.toFixed(1) + '°');
check('渐盈渐亏与黄经差一致', moon.waxing === (moon.elong < 180), moon.name);

// 视星等：量级应与常识相符
const mags = await page.evaluate(() => {
  const E = window.SolarSystem.Ephemeris, A = window.SolarSystem.App;
  const earth = A.ctx.bodies.get('earth').state;
  const out = {};
  ['venus', 'jupiter', 'saturn', 'uranus', 'neptune'].forEach((k) => {
    const s = A.ctx.bodies.get(k).state;
    const d = E.distance(s.position, earth.position);
    out[k] = E.apparentMagnitude(k, s.r, d, E.phaseAngle(earth.position, s.position));
  });
  return out;
});
check('金星视星等 < −3（全天最亮行星）', mags.venus < -3, mags.venus.toFixed(2));
check('木星视星等 < −1', mags.jupiter < -1, mags.jupiter.toFixed(2));
check('天王星视星等 5–6（肉眼极限附近）', mags.uranus > 5 && mags.uranus < 6.2, mags.uranus.toFixed(2));
check('海王星视星等 7–8（必须用望远镜）', mags.neptune > 7.4 && mags.neptune < 8.2, mags.neptune.toFixed(2));

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

// ---------- 比例模型：三挡，并逐项验证"完全真实"确实是 1:1 ----------
async function setMode(mode) {
  await page.click(`.seg-btn[data-mode="${mode}"]`);
  await page.waitForTimeout(700);
}

await setMode('realDistance');
const spanReal = await page.evaluate(() => {
  const A = window.SolarSystem.App;
  return A.ctx.bodies.get('neptune').scenePos.length() / A.ctx.bodies.get('earth').scenePos.length();
});
check('真实距离下海王星/地球 ≈ 30', Math.abs(spanReal - 30) < 2, spanReal.toFixed(2));

await setMode('schematic');
const spanSchematic = await page.evaluate(() => {
  const A = window.SolarSystem.App;
  return A.ctx.bodies.get('neptune').scenePos.length() / A.ctx.bodies.get('earth').scenePos.length();
});
check('简化示意下该比值 ≈ √30', Math.abs(spanSchematic - Math.sqrt(30)) < 0.4, spanSchematic.toFixed(2));

// 完全真实：直接量场景里的几何，与真实公里数逐项对账
await setMode('real');
const truth = await page.evaluate(() => {
  const A = window.SolarSystem.App, E = window.SolarSystem.Ephemeris;
  const out = { bodies: [], sunCapped: A.state.sunCapped };
  ['mercury', 'venus', 'earth', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune'].forEach((k) => {
    const e = A.ctx.bodies.get(k);
    out.bodies.push({
      k,
      sceneRatio: e.radius / e.scenePos.length(),              // 场景里：半径 / 日心距
      realRatio: e.def.radiusKm / (e.state.r * E.AU_KM),       // 真实：半径 / 日心距
    });
  });
  const sun = A.ctx.bodies.get('sun'), earth = A.ctx.bodies.get('earth');
  out.sunOverEarthOrbit = { scene: sun.radius / earth.scenePos.length(), real: 696340 / (earth.state.r * E.AU_KM) };
  const moon = A.ctx.bodies.get('moon');
  out.moonOverEarthRadius = {
    scene: moon.scenePos.distanceTo(earth.scenePos) / earth.radius,
    real: moon.state.geocentricDistanceKm / 6371,
  };
  return out;
});
truth.bodies.forEach((b) => {
  const rel = Math.abs(b.sceneRatio - b.realRatio) / b.realRatio;
  check(`完全真实：${b.k} 半径/日心距 与真实一致`, rel < 1e-9,
    b.sceneRatio.toExponential(6) + ' vs ' + b.realRatio.toExponential(6));
});
{
  const t = truth.sunOverEarthOrbit;
  const rel = Math.abs(t.scene - t.real) / t.real;
  check('完全真实：太阳半径/地球轨道半径 与真实一致', rel < 1e-9,
    t.scene.toFixed(8) + ' vs ' + t.real.toFixed(8) + '（≈1/107）');
}
{
  const t = truth.moonOverEarthRadius;
  const rel = Math.abs(t.scene - t.real) / t.real;
  check('完全真实：地月距离/地球半径 与真实一致', rel < 1e-6,
    t.scene.toFixed(4) + ' vs ' + t.real.toFixed(4) + '（≈60 倍）');
}
check('完全真实：太阳未触发限幅', truth.sunCapped === false);
const rulerReal = await page.textContent('#ruler-text');
check('完全真实下比例尺标为线性', /真实线性比例|线性/.test(rulerReal), rulerReal);

// 简化示意模式下，半径明确不是真实值（模式语义自洽）
await setMode('schematic');
const schematicRatio = await page.evaluate(() => {
  const A = window.SolarSystem.App, E = window.SolarSystem.Ephemeris;
  const e = A.ctx.bodies.get('earth');
  return { scene: e.radius / e.scenePos.length(), real: e.def.radiusKm / (e.state.r * E.AU_KM) };
});
check('简化示意：半径被明显放大（不是真实比例）',
  schematicRatio.scene > schematicRatio.real * 100,
  '放大约 ' + Math.round(schematicRatio.scene / schematicRatio.real) + ' 倍');

// 月相绘制方向：渐盈亮面在右、渐亏在左（北半球视角），满月对称、新月全暗
const phases = await page.evaluate(() => {
  const c = document.getElementById('moon-phase');
  const cases = [
    ['渐盈蛾眉', 0.08, true, '右'], ['渐盈上弦', 0.5, true, '右'], ['盈凸', 0.85, true, '右'],
    ['满月', 1, true, '均衡'], ['亏凸', 0.85, false, '左'], ['渐亏下弦', 0.5, false, '左'],
    ['残月', 0.08, false, '左'], ['新月', 0, true, '空'],
  ];
  return cases.map(([name, illuminated, waxing, want]) => {
    window.SolarSystem.UI.drawMoonPhase(c, { illuminated, waxing });
    const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
    let L = 0, R = 0;
    for (let y = 0; y < c.height; y += 1) {
      for (let x = 0; x < c.width; x += 1) {
        const i = (y * c.width + x) * 4;
        const lum = (d[i] + d[i + 1] + d[i + 2]) / 3 * (d[i + 3] / 255);
        if (lum > 150) { if (x < c.width / 2) L += 1; else R += 1; }
      }
    }
    const got = (L + R < 50) ? '空' : (L > R * 1.3 ? '左' : (R > L * 1.3 ? '右' : '均衡'));
    return { name, want, got };
  });
});
phases.forEach((ph) => check(`月相绘制方向 ${ph.name}`, ph.got === ph.want, `亮面在${ph.got}`));

// 屏幕比例尺
const ruler = await page.textContent('#ruler-text');
check('比例尺有读数', /100 px ≈/.test(ruler), ruler);

// 星历有效区间越界警告
await page.evaluate(() => {
  const A = window.SolarSystem.App;
  A.state.live = false;
  A.state.jd = window.SolarSystem.Ephemeris.julianDay(new Date('2200-01-01T00:00:00Z'));
});
await page.waitForTimeout(400);
check('超出 2050 年时给出警告', await page.locator('#range-warning').isVisible());
await page.click('#t-now');
await page.waitForTimeout(400);
check('回到现在后警告消失', !(await page.locator('#range-warning').isVisible()));

// 定位标记
check('定位标记默认可见', await page.evaluate(() => {
  const m = window.SolarSystem.App.ctx.bodies.get('neptune').marker;
  return m.visible && m.material.opacity > 0;
}));
await page.uncheck('#v-markers');
await page.waitForTimeout(300);
check('关闭后标记隐藏', await page.evaluate(() => !window.SolarSystem.App.ctx.bodies.get('neptune').marker.visible));
await page.check('#v-markers');

// 键盘可操作性
await page.evaluate(() => document.getElementById('scene').focus());
const az0 = await page.evaluate(() => window.SolarSystem.App.ctx.controls._desired.azimuth);
await page.keyboard.press('ArrowLeft');
await page.waitForTimeout(150);
check('方向键可旋转视角', (await page.evaluate(() => window.SolarSystem.App.ctx.controls._desired.azimuth)) !== az0);
check('读屏状态区有播报', (await page.textContent('#sr-status')).length > 0, await page.textContent('#sr-status'));

// ---------- 右键平移 ----------
await page.keyboard.press('Escape');
await page.waitForTimeout(400);
const panBefore = await page.evaluate(() => window.SolarSystem.App.ctx.controls.panOffset.toArray());
await page.mouse.move(700, 450);
await page.mouse.down({ button: 'right' });
await page.mouse.move(560, 520, { steps: 10 });
await page.mouse.up({ button: 'right' });
await page.waitForTimeout(600);
const panAfter = await page.evaluate(() => window.SolarSystem.App.ctx.controls.panOffset.toArray());
check('右键拖拽产生平移偏移', panAfter.some((v, i) => Math.abs(v - panBefore[i]) > 1e-6),
  panAfter.map((v) => v.toFixed(2)).join(', '));
const panHeld = await page.evaluate(async () => {
  const c = window.SolarSystem.App.ctx.controls;
  const before = c.panOffset.toArray();
  await new Promise((r) => setTimeout(r, 500));
  const after = c.panOffset.toArray();
  return before.every((v, i) => Math.abs(v - after[i]) < 1e-9);
});
check('平移偏移不会被每帧的注视点覆盖', panHeld);

// Shift+左键也平移
const panB2 = await page.evaluate(() => window.SolarSystem.App.ctx.controls.panOffset.toArray());
await page.keyboard.down('Shift');
await page.mouse.move(700, 450); await page.mouse.down(); await page.mouse.move(760, 430, { steps: 6 }); await page.mouse.up();
await page.keyboard.up('Shift');
await page.waitForTimeout(400);
const panA2 = await page.evaluate(() => window.SolarSystem.App.ctx.controls.panOffset.toArray());
check('Shift+左键拖拽也能平移', panA2.some((v, i) => Math.abs(v - panB2[i]) > 1e-6));

// ---------- 单击选中 → 再次单击锁定 ----------
await page.evaluate(() => window.SolarSystem.App.goHome());
await page.waitForTimeout(900);
const mp = await page.evaluate(() => {
  const A = window.SolarSystem.App;
  const v = A.ctx.bodies.get('mars').scenePos.clone().project(A.ctx.camera);
  return { x: (v.x * 0.5 + 0.5) * window.innerWidth, y: (-v.y * 0.5 + 0.5) * window.innerHeight };
});
await page.mouse.click(mp.x, mp.y);
await page.waitForTimeout(400);
check('第一次单击只选中、不锁定', await page.evaluate(() => {
  const s = window.SolarSystem.App.state; return s.selected === 'mars' && s.focus === null;
}));
await page.mouse.move(mp.x, mp.y);
await page.waitForTimeout(250);
const tipText = await page.textContent('#hint-tip');
check('悬浮提示指出"再次单击锁定"', /再次单击|锁定/.test(tipText), tipText);
await page.mouse.click(mp.x, mp.y);
await page.waitForTimeout(900);
check('第二次单击锁定跟随', (await page.evaluate(() => window.SolarSystem.App.state.focus)) === 'mars');
check('锁定按钮显示为已锁定', /已锁定/.test(await page.textContent('#d-focus')));

// 锁定后：相机注视点随天体移动（快进时间，天体会跑）
const follow = await page.evaluate(async () => {
  const A = window.SolarSystem.App;
  A.state.live = false; A.state.paused = false; A.state.speed = 2592000; // 30 天/秒
  const p0 = A.ctx.bodies.get('mars').scenePos.clone();
  await new Promise((r) => setTimeout(r, 1800));
  const p1 = A.ctx.bodies.get('mars').scenePos.clone();
  const t1 = A.ctx.controls.target.clone();
  A.state.speed = 1; A.state.live = true;
  return { moved: p0.distanceTo(p1), gap: t1.distanceTo(p1) };
});
check('锁定后天体确实在移动', follow.moved > 0.2, follow.moved.toFixed(3) + ' 场景单位');
check('锁定后注视点跟住了天体', follow.gap < Math.max(0.35, follow.moved * 0.5),
  '滞后 ' + follow.gap.toFixed(3));

// 锁定状态下仍可旋转与平移
const lockedInteract = await page.evaluate(() => {
  const c = window.SolarSystem.App.ctx.controls;
  return { az: c._desired.azimuth, pan: c.panOffset.toArray() };
});
await page.mouse.move(700, 450); await page.mouse.down(); await page.mouse.move(790, 470, { steps: 8 }); await page.mouse.up();
await page.mouse.move(700, 450); await page.mouse.down({ button: 'right' }); await page.mouse.move(650, 480, { steps: 8 }); await page.mouse.up({ button: 'right' });
await page.waitForTimeout(500);
const afterInteract = await page.evaluate(() => {
  const A = window.SolarSystem.App, c = A.ctx.controls;
  return { az: c._desired.azimuth, pan: c.panOffset.toArray(), focus: A.state.focus };
});
check('锁定状态下仍可旋转', Math.abs(afterInteract.az - lockedInteract.az) > 1e-6);
check('锁定状态下仍可平移', afterInteract.pan.some((v, i) => Math.abs(v - lockedInteract.pan[i]) > 1e-6));
check('旋转平移不会解除锁定', afterInteract.focus === 'mars');

// 第三次单击解除锁定
const mp2 = await page.evaluate(() => {
  const A = window.SolarSystem.App;
  const v = A.ctx.bodies.get('mars').scenePos.clone().project(A.ctx.camera);
  return { x: (v.x * 0.5 + 0.5) * window.innerWidth, y: (-v.y * 0.5 + 0.5) * window.innerHeight };
});
await page.mouse.click(mp2.x, mp2.y);
await page.waitForTimeout(500);
check('再次单击解除锁定', (await page.evaluate(() => window.SolarSystem.App.state.focus)) === null);

check('运行期间无 JS 异常', pageErrors.length === 0, pageErrors.slice(0, 3).join(' | ') || '无');

await browser.close();
console.log(failed ? `\n${failed} 项失败` : '\n全部通过');
process.exit(failed ? 1 : 0);
