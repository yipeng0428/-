/*
 * verify.js — 轨道解算自检（Node，零依赖）
 *   node verify.js
 *
 * 做法：用与模型无关的独立参考量来反查，而不是自己跟自己比对。
 */
const D = require('./src/data.js');
const O = require('./src/orbital.js');

const el = id => D.ORBITAL_ELEMENTS.find(b => b.id === id);
const st = (id, d) => O.stateAt(el(id), O.julianCenturies(d));
const dot = (a, b) => a.x * b.x + a.y * b.y + a.z * b.z;
const len = a => Math.sqrt(dot(a, a));

function geocentric(s, e) {
  const toSun = { x: -e.x, y: -e.y, z: -e.z };
  const toP = { x: s.x - e.x, y: s.y - e.y, z: s.z - e.z };
  const elong = Math.acos(Math.max(-1, Math.min(1, dot(toSun, toP) / (len(toSun) * len(toP))))) * 180 / Math.PI;
  const pSun = { x: -s.x, y: -s.y, z: -s.z };
  const pE = { x: e.x - s.x, y: e.y - s.y, z: e.z - s.z };
  const ph = Math.acos(Math.max(-1, Math.min(1, dot(pSun, pE) / (len(pSun) * len(pE))))) * 180 / Math.PI;
  return { elong, ph, k: (1 + Math.cos(ph * Math.PI / 180)) / 2 };
}

/** 独立参考：天文年历低精度太阳视黄经公式（当日平春分点，±0.01°） */
function sunApparentLon(date) {
  const n = O.toJulianDay(date) - 2451545.0;
  const L = 280.460 + 0.9856474 * n;
  const g = (357.528 + 0.9856003 * n) * Math.PI / 180;
  return (((L + 1.915 * Math.sin(g) + 0.020 * Math.sin(2 * g)) % 360) + 360) % 360;
}

let fails = 0;
const check = (name, ok, got, want) => {
  if (!ok) fails++;
  console.log((ok ? '  ok   ' : '  FAIL ') + name.padEnd(30) + String(got).padStart(26) + '   期望 ' + want);
};

console.log('\n[1] 地球日心黄经 vs 太阳视黄经 − 180°（差值应等于岁差，≈0.0139°/年）');
for (const iso of ['2000-01-01T12:00:00Z', '2010-06-21T00:00:00Z', '2026-10-13T00:00:00Z', '2045-03-01T00:00:00Z']) {
  const d = new Date(iso);
  let diff = st('earth', d).lon - (sunApparentLon(d) + 180) % 360;
  if (diff > 180) diff -= 360; if (diff < -180) diff += 360;
  const yrs = (d - new Date('2000-01-01T12:00:00Z')) / (365.25 * 864e5);
  const expected = -0.013972 * yrs;
  check(iso.slice(0, 10), Math.abs(diff - expected) < 0.05, diff.toFixed(4) + '°', expected.toFixed(4) + '° ±0.05');
}

console.log('\n[2] 公转周期：开普勒第三定律 vs 实测值');
const P = { mercury: 87.969, venus: 224.701, earth: 365.256, mars: 686.980, jupiter: 4332.59,
            saturn: 10759.22, uranus: 30685.4, neptune: 60189, pluto: 90560 };
const now = new Date();
for (const id in P) {
  const p = st(id, now).period;
  const err = Math.abs(p - P[id]) / P[id] * 100;
  check(id, err < 0.1, p.toFixed(2) + ' d (' + err.toFixed(3) + '%)', P[id] + ' d');
}

console.log('\n[3] 开普勒方程求解残差');
let res = 0;
for (let i = 0; i < 5000; i++) {
  const M = i / 5000 * 2 * Math.PI, e = 0.95;
  const E = O.solveKepler(M, e);
  res = Math.max(res, Math.abs(E - e * Math.sin(E) - M));
}
check('e = 0.95 最大残差', res < 1e-12, res.toExponential(2) + ' rad', '< 1e-12 rad');

console.log('\n[4] 地球轨道：近日点与速度区间');
let peri = null, vmin = 1e9, vmax = 0;
for (let i = 0; i < 366 * 24; i++) {
  const d = new Date(Date.UTC(2026, 0, 1) + i * 36e5);
  const s = st('earth', d);
  if (!peri || s.r < peri.r) peri = { d, r: s.r };
  vmin = Math.min(vmin, s.speed); vmax = Math.max(vmax, s.speed);
}
check('2026 近日点日期', peri.d.toISOString().slice(0, 10) === '2026-01-03', peri.d.toISOString().slice(0, 10), '2026-01-03');
check('2026 近日距', Math.abs(peri.r - 0.98330) < 2e-4, peri.r.toFixed(6) + ' AU', '0.98330 AU');
check('轨道速度下限', Math.abs(vmin - 29.29) < 0.05, vmin.toFixed(3) + ' km/s', '29.29 km/s');
check('轨道速度上限', Math.abs(vmax - 30.29) < 0.05, vmax.toFixed(3) + ' km/s', '30.29 km/s');

console.log('\n[5] 地心观测量：最大日距角与此时的亮面比例（2026—2028 扫描）');
const EL = { mercury: [18, 28], venus: [45, 47.5], mars: [170, 180], jupiter: [175, 180], saturn: [175, 180] };
for (const id in EL) {
  let mx = 0, k = 0;
  for (let i = 0; i < 1100; i++) {
    const d = new Date(Date.UTC(2026, 0, 1) + i * 864e5);
    const g = geocentric(st(id, d), st('earth', d));
    if (g.elong > mx) { mx = g.elong; k = g.k; }
  }
  const [lo, hi] = EL[id];
  check(id + ' 最大距角', mx >= lo && mx <= hi, mx.toFixed(2) + '° (亮面 ' + k.toFixed(3) + ')', lo + '–' + hi + '°');
}
let kv = 0, mx = 0;
for (let i = 0; i < 1100; i++) {
  const d = new Date(Date.UTC(2026, 0, 1) + i * 864e5);
  const g = geocentric(st('venus', d), st('earth', d));
  if (g.elong > mx) { mx = g.elong; kv = g.k; }
}
check('金星二分点（理论 0.5）', Math.abs(kv - 0.5) < 0.02, kv.toFixed(3), '0.500 ±0.02');

console.log('\n[6] 2027 年火星冲：最近距离');
let opp = null;
for (let i = 0; i < 700; i++) {
  const d = new Date(Date.UTC(2026, 9, 1) + i * 864e5);
  const sep = O.separation(st('mars', d), st('earth', d));
  if (!opp || sep.au < opp.au) opp = { d, au: sep.au };
}
check('地火最近', Math.abs(opp.au - 0.678) < 0.01, opp.d.toISOString().slice(0, 10) + '  ' + opp.au.toFixed(4) + ' AU', '2027-02 中旬 ≈0.68 AU');

console.log('\n' + (fails ? '✗ ' + fails + ' 项未通过' : '✓ 全部通过') + '\n');
process.exit(fails ? 1 : 0);
