/**
 * 行星位置计算（低精度解析星历）
 * ---------------------------------------------------------------
 * 数据来源：JPL / E.M. Standish, "Keplerian Elements for Approximate
 * Positions of the Major Planets"（适用区间 1800 AD – 2050 AD）。
 * 每个要素写成 element = element0 + rate * T，T 为自 J2000.0 起的儒略世纪数。
 *
 * 精度说明（诚实版）：
 *   - 这是解析近似，不是 DE440 数值积分星历。
 *   - 内行星日心黄经误差约 10 角秒量级，木星/土星可到数角分，
 *     冥王星更差。用于可视化与“现在行星大致在哪”完全够用，
 *     不可用于掩星、历表级计算。
 *   - 未做 TT–UTC 修正（约 69 秒），对位置的影响远小于模型本身误差。
 *   - 输出为 J2000 黄道坐标系（heliocentric ecliptic），单位 AU。
 */
(function (global) {
  'use strict';

  const SS = (global.SolarSystem = global.SolarSystem || {});
  const DEG = Math.PI / 180;
  const TWO_PI = Math.PI * 2;

  // [初值, 每儒略世纪变化率]，角度单位为度，a 为 AU
  // a, e, I(倾角), L(平黄经), peri(近日点黄经 ϖ), node(升节点黄经 Ω)
  const ELEMENTS = {
    mercury: {
      a: [0.38709927, 0.00000037], e: [0.20563593, 0.00001906], I: [7.00497902, -0.00594749],
      L: [252.25032350, 149472.67411175], peri: [77.45779628, 0.16047689], node: [48.33076593, -0.12534081],
    },
    venus: {
      a: [0.72333566, 0.00000390], e: [0.00677672, -0.00004107], I: [3.39467605, -0.00078890],
      L: [181.97909950, 58517.81538729], peri: [131.60246718, 0.00268329], node: [76.67984255, -0.27769418],
    },
    earth: { // 严格说是地月质心 (EM Bary)
      a: [1.00000261, 0.00000562], e: [0.01671123, -0.00004392], I: [-0.00001531, -0.01294668],
      L: [100.46457166, 35999.37244981], peri: [102.93768193, 0.32327364], node: [0.0, 0.0],
    },
    mars: {
      a: [1.52371034, 0.00001847], e: [0.09339410, 0.00007882], I: [1.84969142, -0.00813131],
      L: [-4.55343205, 19140.30268499], peri: [-23.94362959, 0.44441088], node: [49.55953891, -0.29257343],
    },
    jupiter: {
      a: [5.20288700, -0.00011607], e: [0.04838624, -0.00013253], I: [1.30439695, -0.00183714],
      L: [34.39644051, 3034.74612775], peri: [14.72847983, 0.21252668], node: [100.47390909, 0.20469106],
    },
    saturn: {
      a: [9.53667594, -0.00125060], e: [0.05386179, -0.00050991], I: [2.48599187, 0.00193609],
      L: [49.95424423, 1222.49362201], peri: [92.59887831, -0.41897216], node: [113.66242448, -0.28867794],
    },
    uranus: {
      a: [19.18916464, -0.00196176], e: [0.04725744, -0.00004397], I: [0.77263783, -0.00242939],
      L: [313.23810451, 428.48202785], peri: [170.95427630, 0.40805281], node: [74.01692503, 0.04240589],
    },
    neptune: {
      a: [30.06992276, 0.00026291], e: [0.00859048, 0.00005105], I: [1.77004347, 0.00035372],
      L: [-55.12002969, 218.45945325], peri: [44.96476227, -0.32241464], node: [131.78422574, -0.00508664],
    },
    pluto: {
      a: [39.48211675, -0.00031596], e: [0.24882730, 0.00005170], I: [17.14001206, 0.00004818],
      L: [238.92903833, 145.20780515], peri: [224.06891629, -0.04062942], node: [110.30393684, -0.01183482],
    },
  };

  const AU_KM = 149597870.7;            // 天文单位 (km)
  const LIGHT_SECONDS_PER_AU = 499.004784; // 光走 1 AU 所需秒数
  const GM_SUN = 1.32712440018e11;      // 太阳引力常数 km^3/s^2
  const JD_J2000 = 2451545.0;

  function julianDay(date) {
    return date.getTime() / 86400000 + 2440587.5;
  }

  function dateFromJulianDay(jd) {
    return new Date((jd - 2440587.5) * 86400000);
  }

  function centuriesSinceJ2000(jd) {
    return (jd - JD_J2000) / 36525;
  }

  function wrapDeg(x) {
    return ((x % 360) + 360) % 360;
  }

  /** 把角度规约到 [-180, 180)，开普勒迭代初值更稳 */
  function wrapDegSigned(x) {
    const v = wrapDeg(x);
    return v >= 180 ? v - 360 : v;
  }

  /** 牛顿迭代解开普勒方程 E - e·sinE = M（弧度制） */
  function solveKepler(M, e) {
    let E = M + e * Math.sin(M); // 一阶近似初值，收敛更快
    for (let i = 0; i < 24; i += 1) {
      const dM = M - (E - e * Math.sin(E));
      const dE = dM / (1 - e * Math.cos(E));
      E += dE;
      if (Math.abs(dE) < 1e-13) break;
    }
    return E;
  }

  /** 取某时刻的轨道要素（度 / AU） */
  function elementsAt(key, T) {
    const el = ELEMENTS[key];
    if (!el) throw new Error('未知天体: ' + key);
    return {
      a: el.a[0] + el.a[1] * T,
      e: el.e[0] + el.e[1] * T,
      I: el.I[0] + el.I[1] * T,
      L: el.L[0] + el.L[1] * T,
      peri: el.peri[0] + el.peri[1] * T,
      node: el.node[0] + el.node[1] * T,
    };
  }

  /**
   * 由轨道要素 + 偏近点角 E 求日心黄道直角坐标 (AU)。
   * 轨道面内：x' = a(cosE - e), y' = a√(1-e²)·sinE
   * 再依次绕 近日点角距 ω → 倾角 I → 升节点 Ω 旋转。
   */
  function orbitalToEcliptic(el, E) {
    const aRad = el.a;
    const e = el.e;
    const xp = aRad * (Math.cos(E) - e);
    const yp = aRad * Math.sqrt(Math.max(0, 1 - e * e)) * Math.sin(E);

    const omega = (el.peri - el.node) * DEG; // 近日点角距 ω = ϖ − Ω
    const inc = el.I * DEG;
    const node = el.node * DEG;

    const cw = Math.cos(omega), sw = Math.sin(omega);
    const ci = Math.cos(inc), si = Math.sin(inc);
    const cn = Math.cos(node), sn = Math.sin(node);

    return {
      x: (cw * cn - sw * sn * ci) * xp + (-sw * cn - cw * sn * ci) * yp,
      y: (cw * sn + sw * cn * ci) * xp + (-sw * sn + cw * cn * ci) * yp,
      z: (sw * si) * xp + (cw * si) * yp,
    };
  }

  /** 核心接口：某天体在儒略日 jd 的日心状态 */
  function stateAt(key, jd) {
    const T = centuriesSinceJ2000(jd);
    const el = elementsAt(key, T);
    const Mdeg = wrapDegSigned(el.L - el.peri);
    const E = solveKepler(Mdeg * DEG, el.e);
    const pos = orbitalToEcliptic(el, E);

    const r = Math.sqrt(pos.x * pos.x + pos.y * pos.y + pos.z * pos.z);
    // 真近点角
    const nu = Math.atan2(
      Math.sqrt(Math.max(0, 1 - el.e * el.e)) * Math.sin(E),
      Math.cos(E) - el.e
    );
    const periodDays = 365.256898 * Math.pow(el.a, 1.5); // 开普勒第三定律（忽略行星质量）
    const meanMotion = 360 / periodDays;                  // 度/天
    const Mpos = wrapDeg(Mdeg);
    const daysToPerihelion = (360 - Mpos) / meanMotion;
    const daysSincePerihelion = Mpos / meanMotion;
    // 活力公式 v = √(GM(2/r − 1/a))
    const speedKmS = Math.sqrt(GM_SUN * (2 / (r * AU_KM) - 1 / (el.a * AU_KM)));

    return {
      key, jd, position: pos, r, elements: el,
      meanAnomaly: Mpos,
      trueAnomaly: wrapDeg(nu / DEG),
      eccentricAnomaly: wrapDeg(E / DEG),
      eclipticLongitude: wrapDeg(Math.atan2(pos.y, pos.x) / DEG),
      eclipticLatitude: Math.asin(r === 0 ? 0 : pos.z / r) / DEG,
      periodDays, speedKmS, daysToPerihelion, daysSincePerihelion,
      perihelion: el.a * (1 - el.e),
      aphelion: el.a * (1 + el.e),
    };
  }

  /** 轨道曲线采样（要素冻结在 jd 时刻），返回 AU 坐标数组 */
  function orbitSamples(key, jd, segments) {
    const n = segments || 256;
    const el = elementsAt(key, centuriesSinceJ2000(jd));
    const out = new Array(n);
    for (let i = 0; i < n; i += 1) {
      out[i] = orbitalToEcliptic(el, (i / n) * TWO_PI);
    }
    return out;
  }

  /** 两点间距离 (AU) */
  function distance(p, q) {
    const dx = p.x - q.x, dy = p.y - q.y, dz = p.z - q.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  /** 以 observer 为顶点，target 与 sun(原点) 的张角（太阳距角，度） */
  function elongation(observer, target) {
    const toSun = { x: -observer.x, y: -observer.y, z: -observer.z };
    const toTarget = { x: target.x - observer.x, y: target.y - observer.y, z: target.z - observer.z };
    return angleBetween(toSun, toTarget);
  }

  /** 相位角：在 target 处，太阳方向与观测者方向的夹角（度） */
  function phaseAngle(observer, target) {
    const toSun = { x: -target.x, y: -target.y, z: -target.z };
    const toObs = { x: observer.x - target.x, y: observer.y - target.y, z: observer.z - target.z };
    return angleBetween(toSun, toObs);
  }

  function angleBetween(u, v) {
    const lu = Math.sqrt(u.x * u.x + u.y * u.y + u.z * u.z);
    const lv = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
    if (lu === 0 || lv === 0) return NaN;
    const c = (u.x * v.x + u.y * v.y + u.z * v.z) / (lu * lv);
    return Math.acos(Math.min(1, Math.max(-1, c))) / DEG;
  }

  SS.Ephemeris = {
    ELEMENTS, AU_KM, LIGHT_SECONDS_PER_AU, GM_SUN, JD_J2000,
    julianDay, dateFromJulianDay, centuriesSinceJ2000,
    elementsAt, stateAt, orbitSamples, solveKepler,
    distance, elongation, phaseAngle, angleBetween, wrapDeg,
    keys: Object.keys(ELEMENTS),
  };
})(typeof window !== 'undefined' ? window : globalThis);
