/*
 * orbital.js — 开普勒轨道递推
 *
 * 流程：UTC 时刻 → 儒略日 → 自 J2000 起的儒略世纪 T
 *      → 线性外推六个轨道根数 → 解开普勒方程 M = E − e·sinE
 *      → 轨道平面坐标 → 三次旋转到 J2000 黄道坐标
 *      → 由活力公式（vis-viva）得瞬时轨道速度。
 *
 * 精度：行星约数角分量级（1800—2050），冥王星更差。
 * 这是解析二体近似，不含行星互扰与相对论修正；
 * 要做任务级星历请用 JPL DE 系列或 SPICE，而非本文件。
 */

var DEG = Math.PI / 180;

function toJulianDay(date) {
  // Unix epoch 1970-01-01T00:00Z == JD 2440587.5
  return date.getTime() / 86400000 + 2440587.5;
}

function julianCenturies(date) {
  return (toJulianDay(date) - J2000_JD) / 36525;
}

/** 解开普勒方程，返回偏近点角 E（弧度）。Newton–Raphson，残差 < 1e-12 rad。*/
function solveKepler(M, e) {
  var E = M + e * Math.sin(M) * (1 + e * Math.cos(M)); // 三阶起步，收敛更快
  for (var i = 0; i < 24; i++) {
    var f = E - e * Math.sin(E) - M;
    var fp = 1 - e * Math.cos(E);
    var dE = f / fp;
    E -= dE;
    if (Math.abs(dE) < 1e-13) break;
  }
  return E;
}

function wrapRad(x) {
  var t = x % (2 * Math.PI);
  return t < 0 ? t + 2 * Math.PI : t;
}

/**
 * 计算某天体在给定时刻的状态。
 * @param {{el:number[], rate:number[]}} body 轨道根数
 * @param {number} T 自 J2000 起的儒略世纪
 * @returns {{x,y,z,r,a,e,inc,speed,trueAnomaly,period}} 黄道坐标(AU)/速度(km/s)
 */
function stateAt(body, T) {
  var a    = body.el[0] + body.rate[0] * T;
  var e    = body.el[1] + body.rate[1] * T;
  var inc  = (body.el[2] + body.rate[2] * T) * DEG;
  var L    = (body.el[3] + body.rate[3] * T) * DEG;
  var peri = (body.el[4] + body.rate[4] * T) * DEG;
  var node = (body.el[5] + body.rate[5] * T) * DEG;

  var argPeri = peri - node;          // ω
  var M = wrapRad(L - peri);          // 平近点角
  var E = solveKepler(M, e);

  // 轨道平面内（近日点方向为 +x'）
  var xp = a * (Math.cos(E) - e);
  var yp = a * Math.sqrt(1 - e * e) * Math.sin(E);

  var cw = Math.cos(argPeri), sw = Math.sin(argPeri);
  var cn = Math.cos(node),    sn = Math.sin(node);
  var ci = Math.cos(inc),     si = Math.sin(inc);

  // R_z(node) · R_x(inc) · R_z(argPeri)
  var x = (cw * cn - sw * sn * ci) * xp + (-sw * cn - cw * sn * ci) * yp;
  var y = (cw * sn + sw * cn * ci) * xp + (-sw * sn + cw * cn * ci) * yp;
  var z = (sw * si) * xp + (cw * si) * yp;

  var r = Math.sqrt(x * x + y * y + z * z);

  // 活力公式：v = sqrt(GM (2/r − 1/a))，长度换算为 km
  var speed = Math.sqrt(GM_SUN * (2 / (r * AU_KM) - 1 / (a * AU_KM)));

  // 真近点角
  var nu = Math.atan2(Math.sqrt(1 - e * e) * Math.sin(E), Math.cos(E) - e);

  return {
    x: x, y: y, z: z, r: r,
    a: a, e: e, inc: inc / DEG,
    speed: speed,
    meanAnomaly: M / DEG,
    trueAnomaly: wrapRad(nu) / DEG,
    lon: wrapRad(Math.atan2(y, x)) / DEG,            // 日心黄经
    lat: Math.asin(z / r) / DEG,                     // 日心黄纬
    period: 365.256363004 * Math.pow(a, 1.5)         // 开普勒第三定律（天）
  };
}

/** 整条轨道的采样点（用于绘制椭圆），按偏近点角均匀取样。*/
function orbitSamples(body, T, segments) {
  var a    = body.el[0] + body.rate[0] * T;
  var e    = body.el[1] + body.rate[1] * T;
  var inc  = (body.el[2] + body.rate[2] * T) * DEG;
  var peri = (body.el[4] + body.rate[4] * T) * DEG;
  var node = (body.el[5] + body.rate[5] * T) * DEG;
  var argPeri = peri - node;

  var cw = Math.cos(argPeri), sw = Math.sin(argPeri);
  var cn = Math.cos(node),    sn = Math.sin(node);
  var ci = Math.cos(inc),     si = Math.sin(inc);

  var pts = [];
  for (var i = 0; i <= segments; i++) {
    var E = (i / segments) * 2 * Math.PI;
    var xp = a * (Math.cos(E) - e);
    var yp = a * Math.sqrt(1 - e * e) * Math.sin(E);
    pts.push({
      x: (cw * cn - sw * sn * ci) * xp + (-sw * cn - cw * sn * ci) * yp,
      y: (cw * sn + sw * cn * ci) * xp + (-sw * sn + cw * cn * ci) * yp,
      z: (sw * si) * xp + (cw * si) * yp
    });
  }
  return pts;
}

/** 两个状态之间的距离（AU）与光行时（秒）。*/
function separation(s1, s2) {
  var dx = s1.x - s2.x, dy = s1.y - s2.y, dz = s1.z - s2.z;
  var d = Math.sqrt(dx * dx + dy * dy + dz * dz);
  return { au: d, lightSeconds: d * LIGHT_SEC_PER_AU };
}

if (typeof module !== 'undefined' && module.exports) {
  var d = require('./data.js');
  AU_KM = d.AU_KM; GM_SUN = d.GM_SUN; LIGHT_SEC_PER_AU = d.LIGHT_SEC_PER_AU; J2000_JD = d.J2000_JD;
  module.exports = { toJulianDay, julianCenturies, solveKepler, stateAt, orbitSamples, separation };
}
