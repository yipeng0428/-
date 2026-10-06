(() => {
  "use strict";
  const BUILD = "2026-10-04 03:26:49";
  const VERSION = "1.0.0";
  const SCHEMA = "tianji.time-context/1.0";
  const DAY_MS = 86400000;
  const norm360 = (x) => ((x % 360) + 360) % 360;
  const n2 = (x) => String(x).padStart(2, "0");
  const deepClone = (v) => {
    try {
      return structuredClone(v);
    } catch (_) {
      return JSON.parse(JSON.stringify(v));
    }
  };
  const addCivilMinutes = (c, min) =>
    fromJD(jdFromGreg(c.y, c.m, c.d, c.h || 0, c.mi || 0, c.s || 0) + min / 1440);
  const addCivilDays = (c, days) => fromJD(jdFromGreg(c.y, c.m, c.d, 0, 0, 0) + days);
  const fmt = (c) =>
    `${c.y}-${n2(c.m)}-${n2(c.d)} ${n2(c.h || 0)}:${n2(c.mi || 0)}:${n2(Math.floor(c.s || 0))}`;

  const DEFAULT_POLICY = Object.freeze({
    timezone: {
      name: "Asia/Shanghai",
      offsetMinutes: 480,
      standardMeridian: 120,
      mode: "fixed-offset",
      historicalDST: false,
    },
    location: { longitude: 120, latitude: null, label: "" },
    trueSolarTime: { enabled: false },
    dayBoundary: { mode: "ziEarly", hour: 23, label: "23:00 子初换日" },
    yearBoundary: { mode: "lichun", label: "立春交节换年" },
    monthBoundary: { mode: "jie", label: "十二节交节换月" },
    lunarDate: { mode: "civil", label: "民用日期对应农历" },
    range: { startYear: 1900, endYear: 2100 },
  });

  function corePolicy() {
    try {
      const c = window.TianjiCore && TianjiCore.getConfig ? TianjiCore.getConfig() : null,
        t = (c && c.time) || {};
      return {
        timezone: {
          name: t.timezone || "Asia/Shanghai",
          offsetMinutes: 480,
          standardMeridian: 120,
          mode: "fixed-offset",
          historicalDST: false,
        },
        location: {
          longitude: Number(t.trueSolarTime && t.trueSolarTime.longitude) || 120,
          latitude: null,
          label: "",
        },
        trueSolarTime: { enabled: !!(t.trueSolarTime && t.trueSolarTime.enabled) },
        dayBoundary: deepClone(t.dayBoundary || DEFAULT_POLICY.dayBoundary),
        yearBoundary: deepClone(t.yearBoundary || DEFAULT_POLICY.yearBoundary),
        monthBoundary: deepClone(t.monthBoundary || DEFAULT_POLICY.monthBoundary),
      };
    } catch (_) {
      return {};
    }
  }
  function merge(a, b) {
    for (const [k, v] of Object.entries(b || {})) {
      if (v && typeof v === "object" && !Array.isArray(v)) {
        a[k] = a[k] && typeof a[k] === "object" ? a[k] : {};
        merge(a[k], v);
      } else a[k] = v;
    }
    return a;
  }
  function normalizePolicy(patch = {}) {
    const p = merge(merge(deepClone(DEFAULT_POLICY), corePolicy()), patch);
    p.timezone.offsetMinutes = Number.isFinite(+p.timezone.offsetMinutes)
      ? +p.timezone.offsetMinutes
      : 480;
    p.timezone.standardMeridian = Number.isFinite(+p.timezone.standardMeridian)
      ? +p.timezone.standardMeridian
      : p.timezone.offsetMinutes / 4;
    p.location.longitude = Number.isFinite(+p.location.longitude)
      ? +p.location.longitude
      : p.timezone.standardMeridian;
    if (p.location.latitude !== null && !Number.isFinite(+p.location.latitude))
      p.location.latitude = null;
    p.trueSolarTime.enabled = !!p.trueSolarTime.enabled;
    if (!["ziEarly", "midnight"].includes(p.dayBoundary.mode)) p.dayBoundary.mode = "ziEarly";
    p.dayBoundary.hour = p.dayBoundary.mode === "ziEarly" ? 23 : 0;
    if (!["lichun", "civilYear"].includes(p.yearBoundary.mode)) p.yearBoundary.mode = "lichun";
    if (!["jie", "civilMonth"].includes(p.monthBoundary.mode)) p.monthBoundary.mode = "jie";
    return p;
  }
  function validateCivil(c) {
    if (!c || ![c.y, c.m, c.d].every(Number.isInteger))
      throw new TypeError("TimeContext: y/m/d must be integers");
    const { y, m, d } = c,
      h = c.h ?? 0,
      mi = c.mi ?? 0,
      sec = c.s ?? 0;
    const leap = y % 4 === 0 && (y % 100 !== 0 || y % 400 === 0),
      days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    if (
      y < 1800 ||
      y > 2200 ||
      m < 1 ||
      m > 12 ||
      d < 1 ||
      d > days[m - 1] ||
      !Number.isInteger(h) ||
      h < 0 ||
      h > 23 ||
      !Number.isInteger(mi) ||
      mi < 0 ||
      mi > 59 ||
      !Number.isFinite(sec) ||
      sec < 0 ||
      sec >= 60
    )
      throw new RangeError("TimeContext: invalid civil date or time");
    return { y, m, d, h, mi, s: sec };
  }
  function termAt(jdUT, longitude) {
    const lon = longitude == null ? sunLon(jdUT) : longitude;
    const k = Math.floor(norm360(lon) / 15) % 24,
      target = (k * 15) % 360,
      nextK = (k + 1) % 24,
      nextTarget = (nextK * 15) % 360;
    const back = norm360(lon - target) / 0.9856,
      ahead = norm360(nextTarget - lon) / 0.9856;
    const startJD = termJD(target, jdUT - back),
      nextJD = termJD(nextTarget, jdUT + ahead);
    return {
      index: k,
      name: TERMS[k],
      type: k % 2 ? "节" : "中气",
      longitude: target,
      startJD,
      next: {
        index: nextK,
        name: TERMS[nextK],
        type: nextK % 2 ? "节" : "中气",
        longitude: nextTarget,
        jd: nextJD,
      },
    };
  }
  function localFromUT(jdUT, offsetMinutes) {
    return fromJD(jdUT + offsetMinutes / 1440);
  }
  function resolveDayDate(localTime, policy) {
    const d = { y: localTime.y, m: localTime.m, d: localTime.d };
    if (policy.dayBoundary.mode === "ziEarly" && (localTime.h || 0) >= 23) {
      const n = addCivilDays({ ...localTime, h: 0, mi: 0, s: 0 }, 1);
      return { y: n.y, m: n.m, d: n.d, shifted: true };
    }
    return { ...d, shifted: false };
  }
  function lichunOfYear(year, offsetMinutes) {
    const guess = jdFromGreg(year, 2, 4, 12, 0, 0) - offsetMinutes / 1440;
    const jd = termJD(315, guess);
    return { jdUT: jd, local: localFromUT(jd, offsetMinutes) };
  }
  function jieMonth(jdUT, solarLongitude, offsetMinutes) {
    const i = Math.floor(norm360(solarLongitude - 315) / 30) % 12,
      target = norm360(315 + i * 30),
      back = norm360(solarLongitude - target) / 0.9856;
    const start = termJD(target, jdUT - back),
      nextTarget = norm360(target + 30),
      ahead = norm360(nextTarget - solarLongitude) / 0.9856,
      next = termJD(nextTarget, jdUT + ahead);
    return {
      index: i,
      monthBranch: (2 + i) % 12,
      startLongitude: target,
      startJDUT: start,
      startLocal: localFromUT(start, offsetMinutes),
      nextJDUT: next,
      nextLocal: localFromUT(next, offsetMinutes),
    };
  }
  function createContext(civ, patch = {}) {
    civ = validateCivil(civ);
    const policy = normalizePolicy(patch),
      off = policy.timezone.offsetMinutes,
      mer = policy.timezone.standardMeridian,
      lon = policy.location.longitude;
    const jdCivil = jdFromGreg(civ.y, civ.m, civ.d, civ.h, civ.mi, civ.s),
      jdUT = jdCivil - off / 1440,
      solarLongitude = sunLon(jdUT),
      eq = eot(jdUT);
    const meanShift = (lon - mer) * 4,
      apparentShift = meanShift + eq;
    const meanSolar = addCivilMinutes(civ, meanShift),
      apparentSolar = addCivilMinutes(civ, apparentShift),
      calcLocal = policy.trueSolarTime.enabled ? apparentSolar : civ;
    const calcJDLocal = jdFromGreg(
      calcLocal.y,
      calcLocal.m,
      calcLocal.d,
      calcLocal.h,
      calcLocal.mi,
      calcLocal.s || 0,
    );
    const dayDate = resolveDayDate(calcLocal, policy),
      civilLunar =
        typeof solar2lunar === "function" && civ.y >= 1900 && civ.y <= 2100
          ? solar2lunar(civ.y, civ.m, civ.d)
          : null;
    const effectiveLunar =
      typeof solar2lunar === "function" && dayDate.y >= 1900 && dayDate.y <= 2100
        ? solar2lunar(dayDate.y, dayDate.m, dayDate.d)
        : null;
    const term = termAt(jdUT, solarLongitude);
    term.startLocal = localFromUT(term.startJD, off);
    term.next.local = localFromUT(term.next.jd, off);
    const lc = lichunOfYear(civ.y, off),
      calYear =
        policy.yearBoundary.mode === "lichun" ? (jdUT < lc.jdUT ? civ.y - 1 : civ.y) : civ.y;
    const jm = jieMonth(jdUT, solarLongitude, off);
    const warnings = [];
    if (policy.timezone.mode === "fixed-offset")
      warnings.push("当前时区按固定 UTC 偏移计算；历史夏令时/历史时区制度尚未自动校正。");
    if (civ.y < 1900 || civ.y > 2100)
      warnings.push("农历与节气校准主验证范围为 1900–2100；范围外仅保留基础天文时间计算。");
    if (policy.trueSolarTime.enabled)
      warnings.push("真太阳时 = 时区经度修正 + 均时差；日界按校正后的排盘口径时间判断。");
    return {
      schema: SCHEMA,
      version: VERSION,
      build: BUILD,
      input: { civil: deepClone(civ), location: deepClone(policy.location) },
      policy,
      clock: {
        civil: { ...deepClone(civ), text: fmt(civ) },
        meanSolar: { ...meanSolar, text: fmt(meanSolar), shiftMinutes: +meanShift.toFixed(4) },
        apparentSolar: {
          ...apparentSolar,
          text: fmt(apparentSolar),
          shiftMinutes: +apparentShift.toFixed(4),
        },
        calculation: {
          ...deepClone(calcLocal),
          text: fmt(calcLocal),
          mode: policy.trueSolarTime.enabled ? "apparent-solar" : "civil-standard",
        },
        equationOfTimeMinutes: +eq.toFixed(4),
        longitudeCorrectionMinutes: +meanShift.toFixed(4),
        totalSolarCorrectionMinutes: +apparentShift.toFixed(4),
      },
      astronomy: {
        jdCivil,
        jdUT,
        jdCalculationLocal: calcJDLocal,
        solarLongitude: +solarLongitude.toFixed(8),
      },
      boundaries: {
        day: { ...deepClone(policy.dayBoundary), effectiveDate: dayDate },
        year: {
          ...deepClone(policy.yearBoundary),
          effectiveYear: calYear,
          lichun: { jdUT: lc.jdUT, local: lc.local },
        },
        month: {
          ...deepClone(policy.monthBoundary),
          solarMonthIndex: jm.index,
          monthBranch: jm.monthBranch,
          startLongitude: jm.startLongitude,
          startJDUT: jm.startJDUT,
          startLocal: jm.startLocal,
          nextJDUT: jm.nextJDUT,
          nextLocal: jm.nextLocal,
        },
      },
      solarTerm: term,
      lunar: { civil: civilLunar, effectiveDay: effectiveLunar },
      capabilities: {
        historicalTimezone: false,
        historicalDST: false,
        trueSolarTime: true,
        preciseSolarTerms: true,
        lunar1900to2100: true,
      },
      warnings,
    };
  }
  function legacyCompare(civ, patch = {}) {
    const p = normalizePolicy(patch);
    if (p.timezone.offsetMinutes !== 480 || p.timezone.standardMeridian !== 120)
      return { comparable: false, reason: "v84 legacy calcTime 固定按 UTC+8 / 120°E 标准经线" };
    const ctx = createContext(civ, p);
    if (typeof calcTime !== "function")
      return { comparable: false, reason: "legacy calcTime unavailable" };
    const old = calcTime(validateCivil(civ), {
      solar: p.trueSolarTime.enabled,
      lon: p.location.longitude,
    });
    const diff = {
      jdCivil: ctx.astronomy.jdCivil - old.jdCivil,
      jdUT: ctx.astronomy.jdUT - old.jdUT,
      solarLongitude: ctx.astronomy.solarLongitude - old.lon,
      solarShiftMinutes: ctx.clock.totalSolarCorrectionMinutes - old.shift,
    };
    const ok =
      Math.abs(diff.jdCivil) < 1e-9 &&
      Math.abs(diff.jdUT) < 1e-9 &&
      Math.abs(diff.solarLongitude) < 1e-6 &&
      Math.abs(diff.solarShiftMinutes) < 1e-3;
    return { comparable: true, ok, diff, legacy: old, context: ctx };
  }
  function selfTest() {
    const checks = [];
    const add = (id, ok, detail = "") => checks.push({ id, ok: !!ok, detail });
    try {
      const a = resolveDayDate(
        { y: 2026, m: 10, d: 4, h: 22, mi: 59, s: 0 },
        normalizePolicy({ dayBoundary: { mode: "ziEarly" } }),
      );
      add("day.2259", a.d === 4 && !a.shifted, JSON.stringify(a));
    } catch (e) {
      add("day.2259", false, e.message);
    }
    try {
      const a = resolveDayDate(
        { y: 2026, m: 10, d: 4, h: 23, mi: 0, s: 0 },
        normalizePolicy({ dayBoundary: { mode: "ziEarly" } }),
      );
      add("day.2300", a.d === 5 && a.shifted, JSON.stringify(a));
    } catch (e) {
      add("day.2300", false, e.message);
    }
    try {
      const a = createContext(
        { y: 2026, m: 10, d: 4, h: 12, mi: 0, s: 0 },
        { location: { longitude: 120 }, trueSolarTime: { enabled: false } },
      );
      add(
        "context.shape",
        !!(a.solarTerm && a.boundaries && a.clock && a.astronomy),
        a.solarTerm && a.solarTerm.name,
      );
      add(
        "term.interval",
        a.solarTerm.startJD <= a.astronomy.jdUT && a.solarTerm.next.jd > a.astronomy.jdUT,
        a.solarTerm.name,
      );
    } catch (e) {
      add("context.shape", false, e.message);
      add("term.interval", false, e.message);
    }
    try {
      const x = legacyCompare(
        { y: 2026, m: 10, d: 4, h: 12, mi: 0, s: 0 },
        { location: { longitude: 117.8 }, trueSolarTime: { enabled: true } },
      );
      add("legacy.compat", x.comparable && x.ok, x.comparable ? JSON.stringify(x.diff) : x.reason);
    } catch (e) {
      add("legacy.compat", false, e.message);
    }
    try {
      const a = createContext({ y: 2026, m: 2, d: 10, h: 12, mi: 0, s: 0 });
      add(
        "jie.month",
        a.boundaries.month.solarMonthIndex === 0,
        "index=" + a.boundaries.month.solarMonthIndex,
      );
    } catch (e) {
      add("jie.month", false, e.message);
    }
    return { ok: checks.every((x) => x.ok), checks, version: VERSION, build: BUILD };
  }
  function manifest() {
    return {
      module: "Tianji Time & Calendar Core",
      version: VERSION,
      schema: SCHEMA,
      build: BUILD,
      policy: normalizePolicy(),
      selfTest: selfTest(),
      dependencies: ["v84 jdFromGreg/fromJD", "v84 sunLon/termJD/eot", "v84 solar2lunar"],
    };
  }

  const API = Object.freeze({
    version: VERSION,
    schema: SCHEMA,
    build: BUILD,
    defaultPolicy: () => deepClone(DEFAULT_POLICY),
    normalizePolicy,
    createContext,
    termAt,
    resolveDayDate,
    lichunOfYear,
    jieMonth,
    legacyCompare,
    selfTest,
    manifest,
  });
  window.TianjiTime = API;

  /* 注册进 v85 的 TianjiCore，但不替换任何 v84 现有调用链。 */
  try {
    if (window.TianjiCore) {
      TianjiCore.registerSource({
        id: "tianji-v86-time-core",
        type: "internal",
        title: "Tianji Time & Calendar Core",
        version: VERSION,
        baseline: "v84",
        note: "统一时间上下文；v86 阶段只旁路接入，不改变现有排盘结果。",
      });
      TianjiCore.registerEngine(
        {
          id: "time.context.v1",
          system: "calendar",
          name: "Tianji TimeContext",
          version: VERSION,
          source: "tianji-v86-time-core",
          doctrine: "固定时区偏移 + 可选真太阳时 + 显式日/年/月边界",
        },
        (input) => createContext(input.civ, input.policy || {}),
      );
      TianjiCore.registerEngine(
        {
          id: "calendar.solar-term.v1",
          system: "calendar",
          name: "Tianji 节气上下文",
          version: VERSION,
          source: "tianji-v86-time-core",
          doctrine: "v84 校准太阳黄经 / 精确交节",
        },
        (input) => {
          const p = normalizePolicy(input.policy || {}),
            c = createContext(input.civ, p);
          return c.solarTerm;
        },
      );
    }
  } catch (e) {
    try {
      console.warn("[TianjiTime] registry", e);
    } catch (_) {}
  }

  window.TianjiSystem = Object.freeze({
    version: "v86",
    build: BUILD,
    baseline: "v84",
    core: window.TianjiCore || null,
    time: API,
    manifest: () => ({
      product: "天机盘",
      version: "v86",
      build: BUILD,
      baseline: "v84",
      core: window.TianjiCore && TianjiCore.manifest ? TianjiCore.manifest() : null,
      time: manifest(),
    }),
  });

  try {
    const t = selfTest(),
      bv = document.getElementById("buildVersion");
    if (bv) {
      const old = document.getElementById("tjCoreBadge");
      if (old) old.textContent = "Core 1.0.0 · Schema 1.0.0";
      let b = document.getElementById("tjTimeBadge");
      if (!b) {
        b = document.createElement("span");
        b.id = "tjTimeBadge";
        (old || bv).insertAdjacentElement("afterend", b);
      }
      b.textContent = "Time " + VERSION;
      b.classList.toggle("warn", !t.ok);
      b.title = t.ok
        ? "v86 时间与历法核心自检通过 · 不改变 v84 现有排盘结果"
        : "v86 时间与历法核心存在未通过自检项";
    }
  } catch (_) {}
  try {
    window.dispatchEvent(new CustomEvent("tianji:time-ready", { detail: manifest() }));
  } catch (_) {}
})();
