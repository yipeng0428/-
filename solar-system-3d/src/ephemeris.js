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

  /* ===================== 月球 ===================== */

  /**
   * 截断版 ELP2000-82B（Meeus《Astronomical Algorithms》第 47 章）。
   * 只保留振幅最大的若干项：黄经 ~19 项、黄纬 ~13 项、距离 ~13 项。
   *
   * 精度：黄经/黄纬约 0.05°–0.1°，地心距约数百 km。完整理论有上千项，
   * 但对"月亮此刻在天上哪个方向、是什么相"这个量级，截断版绰绰有余。
   *
   * 坐标说明：ELP 给出的是"当日平分点"的黄道坐标，而行星用的是 J2000。
   * 这里对黄经做一阶总岁差改正（约 1.3972°/世纪）归算到 J2000，
   * 2026 年量级约 −0.37°，不改正会在跨年尺度上肉眼可见。
   */
  const MOON_LON = [ // [D, M, M', F, 系数(1e-6 度)]
    [0, 0, 1, 0, 6288774], [2, 0, -1, 0, 1274027], [2, 0, 0, 0, 658314],
    [0, 0, 2, 0, 213618], [0, 1, 0, 0, -185116], [0, 0, 0, 2, -114332],
    [2, 0, -2, 0, 58793], [2, -1, -1, 0, 57066], [2, 0, 1, 0, 53322],
    [2, -1, 0, 0, 45758], [0, 1, -1, 0, -40923], [1, 0, 0, 0, -34720],
    [0, 1, 1, 0, -30383], [2, 0, 0, -2, 15327], [0, 0, 1, 2, -12528],
    [0, 0, 1, -2, 10980], [4, 0, -1, 0, 10675], [0, 0, 3, 0, 10034],
    [4, 0, -2, 0, 8548],
  ];
  const MOON_LAT = [ // [D, M, M', F, 系数(1e-6 度)]
    [0, 0, 0, 1, 5128122], [0, 0, 1, 1, 280602], [0, 0, 1, -1, 277693],
    [2, 0, 0, -1, 173237], [2, 0, -1, 1, 55413], [2, 0, -1, -1, 46271],
    [2, 0, 0, 1, 32573], [0, 0, 2, 1, 17198], [2, 0, 1, -1, 9266],
    [0, 0, 2, -1, 8822], [2, -1, 0, -1, 8216], [2, 0, -2, -1, 4324],
    [2, 0, 1, 1, 4200],
  ];
  const MOON_DIST = [ // [D, M, M', F, 系数(0.001 km)]
    [0, 0, 1, 0, -20905355], [2, 0, -1, 0, -3699111], [2, 0, 0, 0, -2955968],
    [0, 0, 2, 0, -569925], [0, 1, 0, 0, 48888], [0, 0, 0, 2, -3149],
    [2, 0, -2, 0, 246158], [2, -1, -1, 0, -152138], [2, 0, 1, 0, -170733],
    [2, -1, 0, 0, -204586], [0, 1, -1, 0, -129620], [1, 0, 0, 0, 108743],
    [0, 1, 1, 0, 104755],
  ];

  const MOON_MEAN_RADIUS_KM = 1737.4;
  const SYNODIC_MONTH = 29.530588853;

  /** 月球基本幅角（度） */
  function moonArguments(T) {
    return {
      Lp: 218.3164477 + 481267.88123421 * T - 0.0015786 * T * T
        + (T * T * T) / 538841 - (T * T * T * T) / 65194000,
      D: 297.8501921 + 445267.1114034 * T - 0.0018819 * T * T
        + (T * T * T) / 545868 - (T * T * T * T) / 113065000,
      M: 357.5291092 + 35999.0502909 * T - 0.0001536 * T * T + (T * T * T) / 24490000,
      Mp: 134.9633964 + 477198.8675055 * T + 0.0087414 * T * T
        + (T * T * T) / 69699 - (T * T * T * T) / 14712000,
      F: 93.2720950 + 483202.0175233 * T - 0.0036539 * T * T
        - (T * T * T) / 3526000 + (T * T * T * T) / 863310000,
      // 地球轨道偏心率随时间的修正，作用于含太阳平近点角 M 的项
      E: 1 - 0.002516 * T - 0.0000074 * T * T,
    };
  }

  /**
   * 月球地心黄道坐标。
   * @param {number} jd 儒略日
   * @param {boolean} toJ2000 是否把黄经归算到 J2000（与行星同框架），默认 true
   * @returns {{longitude:number, latitude:number, distanceKm:number}}
   */
  function moonGeocentric(jd, toJ2000) {
    const T = centuriesSinceJ2000(jd);
    const a = moonArguments(T);
    let sumL = 0, sumB = 0, sumR = 0;

    const evaluate = (table, trig, out) => {
      for (let i = 0; i < table.length; i += 1) {
        const [cd, cm, cmp, cf, coeff] = table[i];
        const arg = (cd * a.D + cm * a.M + cmp * a.Mp + cf * a.F) * DEG;
        // 含 M 的项要乘偏心率修正 E（|cm| 次幂）
        const ecc = cm === 0 ? 1 : Math.pow(a.E, Math.abs(cm));
        out(coeff * ecc * trig(arg));
      }
    };
    evaluate(MOON_LON, Math.sin, (v) => { sumL += v; });
    evaluate(MOON_LAT, Math.sin, (v) => { sumB += v; });
    evaluate(MOON_DIST, Math.cos, (v) => { sumR += v; });

    let longitude = a.Lp + sumL / 1e6;
    if (toJ2000 !== false) longitude -= 1.397159 * T; // 一阶总岁差：当日平分点 → J2000
    return {
      longitude: wrapDeg(longitude),
      latitude: sumB / 1e6,
      distanceKm: 385000.56 + sumR / 1000,
    };
  }

  /** 把 (黄经, 黄纬, 距离) 转为直角坐标 (AU) */
  function sphericalToCartesian(lonDeg, latDeg, distAU) {
    const lon = lonDeg * DEG, lat = latDeg * DEG;
    const c = Math.cos(lat);
    return { x: distAU * c * Math.cos(lon), y: distAU * c * Math.sin(lon), z: distAU * Math.sin(lat) };
  }

  /**
   * 月球完整状态：地心向量、日心位置、月相。
   * 月相由"月球与太阳的地心黄经差"定义：0°=朔，90°=上弦，180°=望，270°=下弦。
   */
  function moonState(jd, earthState) {
    const geo = moonGeocentric(jd, true);
    const distAU = geo.distanceKm / AU_KM;
    const geocentric = sphericalToCartesian(geo.longitude, geo.latitude, distAU);
    const earth = earthState || stateAt('earth', jd);
    const position = {
      x: earth.position.x + geocentric.x,
      y: earth.position.y + geocentric.y,
      z: earth.position.z + geocentric.z,
    };
    // 太阳的地心视黄经 = 地球日心黄经 + 180°
    const sunLongitude = wrapDeg(earth.eclipticLongitude + 180);
    const elongation = wrapDeg(geo.longitude - sunLongitude);
    const phaseAngleDeg = phaseAngle(earth.position, position);
    const illuminated = (1 + Math.cos(phaseAngleDeg * DEG)) / 2;
    return {
      key: 'moon', jd,
      geocentric, position,
      geocentricDistanceKm: geo.distanceKm,
      geocentricDistance: distAU,
      r: Math.sqrt(position.x * position.x + position.y * position.y + position.z * position.z),
      eclipticLongitude: geo.longitude,
      eclipticLatitude: geo.latitude,
      sunLongitude,
      elongationFromSun: elongation,   // 相位角位置（0=朔，180=望）
      phaseAngle: phaseAngleDeg,
      illuminated,
      waxing: elongation < 180,        // 渐盈 / 渐亏
      age: (elongation / 360) * SYNODIC_MONTH,
      phaseName: moonPhaseName(elongation),
    };
  }

  /**
   * 相位命名。不按 45° 均分八等份——那样 110° 会被叫成"上弦"，
   * 而此时月亮已明显是凸月（照亮 68%）。朔、望、上下弦是四个"瞬时事件"，
   * 这里给它们各 ±7.5°（约 ±0.6 天）的窄窗口，其余归入蛾眉/凸/残。
   */
  function moonPhaseName(elongationDeg) {
    const e = wrapDeg(elongationDeg);
    if (e < 7.5 || e >= 352.5) return '新月（朔）';
    if (e < 82.5) return '蛾眉月（娥眉月）';
    if (e < 97.5) return '上弦月';
    if (e < 172.5) return '盈凸月';
    if (e < 187.5) return '满月（望）';
    if (e < 262.5) return '亏凸月';
    if (e < 277.5) return '下弦月';
    return '残月（下蛾眉月）';
  }

  /**
   * 下一次指定相位（0=朔，180=望）的时刻，二分法求解。
   * 先按 6 小时步长找符号变化区间，再二分 30 次（精度优于 1 秒）。
   */
  function nextMoonPhase(jd, targetElongationDeg) {
    const f = (t) => {
      const e = moonState(t).elongationFromSun - targetElongationDeg;
      return wrapDegSigned(e); // 映射到 [-180,180)，过零即为目标相位
    };
    const step = 0.25;
    let t0 = jd + 0.01, v0 = f(t0);
    for (let i = 0; i < 160; i += 1) {   // 最多向前搜 40 天，覆盖一个朔望月
      const t1 = t0 + step, v1 = f(t1);
      if (v0 < 0 && v1 >= 0) {           // 只接受由负变正的穿越，避免抓到反向跳变
        let lo = t0, hi = t1;
        for (let k = 0; k < 40; k += 1) {
          const mid = (lo + hi) / 2;
          if (f(mid) < 0) lo = mid; else hi = mid;
        }
        return (lo + hi) / 2;
      }
      t0 = t1; v0 = v1;
    }
    return NaN;
  }

  /* ===================== 视星等 ===================== */

  /**
   * 行星视星等：V = V(1,0) + 5·log₁₀(r·Δ) + 相位改正。
   * V(1,0) 与相位多项式取自《Astronomical Almanac》经典式（Harris 体系）。
   *
   * 已知偏差（诚实声明）：
   *   - 土星只算球体，不含环的贡献；环面张角最大时实际可亮 0.3–1.0 等。
   *   - 金星在 α>163.6° 的极细月牙区间不适用（此时它贴近太阳不可观测）。
   *   - 不含大气消光，给出的是大气外的视星等。
   */
  const MAGNITUDE = {
    mercury: { v0: -0.42, phase: (a) => 0.0380 * a - 0.000273 * a * a + 2.0e-6 * a * a * a },
    venus: { v0: -4.40, phase: (a) => (a < 163.6 ? 0.0009 * a + 0.000239 * a * a - 6.5e-7 * a * a * a : 1.0) },
    mars: { v0: -1.52, phase: (a) => 0.016 * a },
    jupiter: { v0: -9.40, phase: (a) => 0.005 * a },
    saturn: { v0: -8.88, phase: (a) => 0.044 * Math.abs(a) },
    uranus: { v0: -7.19, phase: (a) => 0.0028 * a },
    neptune: { v0: -6.87, phase: () => 0 },
    pluto: { v0: -1.01, phase: () => 0 },
    moon: { v0: 0.21, phase: (a) => 0.026 * a + 4.0e-9 * Math.pow(a, 4) },
  };

  /**
   * @param {string} key 天体
   * @param {number} r 日心距 (AU)
   * @param {number} delta 地心距 (AU)
   * @param {number} alpha 相位角 (度)
   */
  function apparentMagnitude(key, r, delta, alpha) {
    const m = MAGNITUDE[key];
    if (!m || !(r > 0) || !(delta > 0)) return NaN;
    return m.v0 + 5 * Math.log10(r * delta) + m.phase(alpha);
  }

  /* ===================== 模型有效区间 ===================== */

  // Standish 线性要素表的标称适用区间
  const VALID_FROM_JD = julianDay(new Date(Date.UTC(1800, 0, 1)));
  const VALID_TO_JD = julianDay(new Date(Date.UTC(2050, 11, 31)));

  function validity(jd) {
    if (jd < VALID_FROM_JD) return { ok: false, side: 'before' };
    if (jd > VALID_TO_JD) return { ok: false, side: 'after' };
    return { ok: true, side: null };
  }

  SS.Ephemeris = {
    ELEMENTS, AU_KM, LIGHT_SECONDS_PER_AU, GM_SUN, JD_J2000,
    julianDay, dateFromJulianDay, centuriesSinceJ2000,
    elementsAt, stateAt, orbitSamples, solveKepler,
    distance, elongation, phaseAngle, angleBetween, wrapDeg, wrapDegSigned,
    moonGeocentric, moonState, nextMoonPhase, sphericalToCartesian,
    MOON_MEAN_RADIUS_KM, SYNODIC_MONTH,
    apparentMagnitude, MAGNITUDE,
    validity, VALID_FROM_JD, VALID_TO_JD,
    keys: Object.keys(ELEMENTS),
  };
})(typeof window !== 'undefined' ? window : globalThis);
