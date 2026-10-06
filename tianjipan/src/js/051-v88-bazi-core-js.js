(() => {
  "use strict";
  const BUILD = "2026-10-04 03:44:24";
  const VERSION = "1.0.0";
  const SCHEMA = "tianji.bazi/1.0";
  const WXN = ["木", "火", "土", "金", "水"];
  const LEGACY_CALC = window.calcBazi;
  const LEGACY_TIME = window.calcTime;
  const round = (n, p = 10) => (typeof n === "number" && Number.isFinite(n) ? +n.toFixed(p) : n);
  const clone = (o) => {
    try {
      return structuredClone(o);
    } catch (_) {
      return JSON.parse(JSON.stringify(o));
    }
  };
  const mod = (a, n) => ((a % n) + n) % n;

  const DEFAULT_POLICY = Object.freeze({
    yearBoundary: { mode: "lichun", label: "立春交节换年" },
    monthBoundary: { mode: "jie", label: "十二节交节换月" },
    dayBoundary: { mode: "ziEarly", hour: 23, label: "23:00 子初换日" },
    hourBoundary: { mode: "double-hour", label: "子时 23:00–00:59，余时辰每两小时" },
    fortune: {
      direction: "yearYinYangByGender",
      daysPerYear: 3,
      yearLengthDays: 365.2422,
      cycles: 10,
    },
    elementWeights: { visibleStem: 1, hiddenStem: [1, 0.5, 0.3] },
  });
  function merge(a, b) {
    for (const [k, v] of Object.entries(b || {})) {
      if (v && typeof v === "object" && !Array.isArray(v)) {
        a[k] = a[k] && typeof a[k] === "object" ? a[k] : {};
        merge(a[k], v);
      } else a[k] = v;
    }
    return a;
  }
  function normalizePolicy(ctx, patch = {}) {
    const p = merge(clone(DEFAULT_POLICY), {
      yearBoundary: ctx && ctx.policy && ctx.policy.yearBoundary,
      monthBoundary: ctx && ctx.policy && ctx.policy.monthBoundary,
      dayBoundary: ctx && ctx.policy && ctx.policy.dayBoundary,
    });
    merge(p, patch || {});
    if (!["lichun", "civilYear"].includes(p.yearBoundary.mode)) p.yearBoundary.mode = "lichun";
    if (p.monthBoundary.mode !== "jie") p.monthBoundary.mode = "jie";
    if (!["ziEarly", "midnight"].includes(p.dayBoundary.mode)) p.dayBoundary.mode = "ziEarly";
    p.dayBoundary.hour = p.dayBoundary.mode === "ziEarly" ? 23 : 0;
    return p;
  }
  function genderCode(g) {
    return g === "F" ? "F" : "M";
  }
  function contextFromLegacyTime(t) {
    if (!t || !t.civ) throw new Error("BaziCore: legacy time object required");
    const solarEnabled = Math.abs(+t.shift || 0) > 1e-10;
    let longitude = 120;
    try {
      if (solarEnabled) longitude = 120 + ((+t.shift || 0) - eot(t.jdUT)) / 4;
    } catch (_) {}
    const base = window.TianjiTime
      ? TianjiTime.normalizePolicy({
          timezone: {
            name: "Asia/Shanghai",
            offsetMinutes: 480,
            standardMeridian: 120,
            mode: "fixed-offset",
            historicalDST: false,
          },
          location: { longitude },
          trueSolarTime: { enabled: solarEnabled },
        })
      : clone(DEFAULT_POLICY);
    return {
      schema: "tianji.time-context/legacy-adapter",
      version: "v88-adapter",
      input: { civil: clone(t.civ), location: { longitude } },
      policy: base,
      clock: { civil: clone(t.civ), calculation: clone(t.loc || t.civ) },
      astronomy: {
        jdCivil: +t.jdCivil,
        jdUT: +t.jdUT,
        jdCalculationLocal: +t.jdLoc,
        solarLongitude: +t.lon,
      },
      warnings: ["由 v84 calcTime 结果适配为 TimeContext；用于兼容旧调用签名。"],
    };
  }
  function requireContext(ctx) {
    if (!ctx || !ctx.clock || !ctx.astronomy) throw new Error("BaziCore: TimeContext required");
    const a = ctx.astronomy,
      c = ctx.clock.civil,
      l = ctx.clock.calculation;
    if (
      ![a.jdCivil, a.jdUT, a.jdCalculationLocal, a.solarLongitude, c.y, c.m, c.d, l.h].every(
        Number.isFinite,
      )
    )
      throw new Error("BaziCore: incomplete TimeContext");
    return ctx;
  }
  function pillarObject(key, label, p, dm) {
    const idx = ganzhiIdx(p.s, p.b),
      hidden = (CANG[p.b] || []).map((g, i) => ({
        ganIndex: g,
        gan: GAN[g],
        elementIndex: GAN_WX[g],
        element: WXN[GAN_WX[g]],
        weight: [1, 0.5, 0.3][i] || 0,
        tenGod: shishen(dm, g),
      }));
    return {
      key,
      label,
      index: idx,
      ganIndex: p.s,
      zhiIndex: p.b,
      gan: GAN[p.s],
      zhi: ZHI[p.b],
      ganzhi: GAN[p.s] + ZHI[p.b],
      elementIndex: GAN_WX[p.s],
      element: WXN[GAN_WX[p.s]],
      tenGod: key === "day" ? "日主" : shishen(dm, p.s),
      hidden,
      nayin: (typeof NAYIN !== "undefined" && NAYIN[idx >> 1]) || "",
    };
  }
  function calculate(ctx, input = {}) {
    ctx = requireContext(ctx);
    const policy = normalizePolicy(ctx, input.policy || {}),
      gender = genderCode(input.gender);
    const civ = ctx.clock.civil,
      loc = ctx.clock.calculation,
      lon = ctx.astronomy.solarLongitude,
      jdUT = ctx.astronomy.jdUT,
      jdLoc = ctx.astronomy.jdCalculationLocal;
    let yy = civ.y;
    if (policy.yearBoundary.mode === "lichun") {
      if (civ.m <= 2 && lon < 315 && lon > 180) yy -= 1;
    }
    const ys = mod(yy - 4, 10),
      yb = mod(yy - 4, 12);
    const mi = Math.floor(mod(lon - 315, 360) / 30);
    const mb = (2 + mi) % 12,
      ms = ((ys % 5) * 2 + 2 + mi) % 10;
    const dn = Math.floor(jdLoc + 0.5 + 1e-9);
    const dayShift = policy.dayBoundary.mode === "ziEarly" && loc.h >= 23 ? 1 : 0;
    const dayIdx = mod(dn + dayShift + 49, 60),
      ds = dayIdx % 10,
      db = dayIdx % 12;
    const hb = Math.floor((loc.h + 1) / 2) % 12,
      hs = ((ds % 5) * 2 + hb) % 10,
      hourIdx = ganzhiIdx(hs, hb);
    const pill = [
      { s: ys, b: yb },
      { s: ms, b: mb },
      { s: ds, b: db },
      { s: hs, b: hb },
    ];
    const wx = [0, 0, 0, 0, 0],
      hsw = policy.elementWeights.hiddenStem || [1, 0.5, 0.3],
      vsw = +policy.elementWeights.visibleStem || 1;
    pill.forEach((p) => {
      wx[GAN_WX[p.s]] += vsw;
      (CANG[p.b] || []).forEach((g, i) => {
        wx[GAN_WX[g]] += Number(hsw[i] ?? 0);
      });
    });
    const dmw = GAN_WX[ds],
      supp = wx[dmw] + wx[(dmw + 4) % 5],
      total = wx.reduce((a, b) => a + b, 0);
    const prevT = (315 + 30 * mi) % 360,
      nextT = (prevT + 30) % 360;
    const jdPrev = termJD(prevT, jdUT - mod(lon - prevT, 360) / 0.9856);
    const jdNext = termJD(nextT, jdUT + mod(nextT - lon, 360) / 0.9856);
    const fwd = (ys % 2 === 0) === (gender === "M");
    const age = (fwd ? jdNext - jdUT : jdUT - jdPrev) / (+policy.fortune.daysPerYear || 3);
    const mIdx = ganzhiIdx(ms, mb),
      dayun = [],
      cycles = Math.max(1, Math.min(20, +policy.fortune.cycles || 10));
    const offsetMinutes =
      ctx.policy && ctx.policy.timezone && Number.isFinite(+ctx.policy.timezone.offsetMinutes)
        ? +ctx.policy.timezone.offsetMinutes
        : 480;
    for (let i = 1; i <= cycles; i++) {
      const idx = mod(mIdx + (fwd ? i : -i), 60),
        sa = age + (i - 1) * 10;
      dayun.push({
        idx,
        startAge: sa,
        yr: fromJD(jdUT + sa * (+policy.fortune.yearLengthDays || 365.2422) + offsetMinutes / 1440)
          .y,
      });
    }
    const localFromUT = (jd) => fromJD(jd + offsetMinutes / 1440);
    const legacy = {
      pill,
      yearNum: yy,
      dayIdx,
      hourIdx,
      dm: ds,
      wx,
      supp,
      total,
      fwd,
      age,
      dayun,
      jie: {
        prev: JIE[mi],
        prevT: localFromUT(jdPrev),
        next: JIE[(mi + 1) % 12],
        nextT: localFromUT(jdNext),
        mi,
      },
    };
    const pillars = [
      pillarObject("year", "年柱", pill[0], ds),
      pillarObject("month", "月柱", pill[1], ds),
      pillarObject("day", "日柱", pill[2], ds),
      pillarObject("hour", "时柱", pill[3], ds),
    ];
    return {
      schema: SCHEMA,
      version: VERSION,
      build: BUILD,
      input: { gender, civil: clone(civ), calculationTime: clone(loc) },
      policy: clone(policy),
      pillars,
      dayMaster: { ganIndex: ds, gan: GAN[ds], elementIndex: dmw, element: WXN[dmw] },
      elements: {
        scores: Object.fromEntries(WXN.map((n, i) => [n, wx[i]])),
        raw: wx.slice(),
        support: supp,
        total,
      },
      luck: {
        forward: fwd,
        startAge: age,
        cycles: dayun.map((x) => ({
          index: x.idx,
          ganzhi: gz(x.idx),
          startAge: x.startAge,
          startYear: x.yr,
        })),
      },
      solarTerms: {
        monthIndex: mi,
        previous: { name: JIE[mi], jdUT: jdPrev, local: legacy.jie.prevT },
        next: { name: JIE[(mi + 1) % 12], jdUT: jdNext, local: legacy.jie.nextT },
      },
      legacy,
    };
  }
  function fromCivil(civ, input = {}) {
    if (!window.TianjiTime) throw new Error("BaziCore: TianjiTime unavailable");
    const ctx = TianjiTime.createContext(civ, input.timePolicy || {});
    return calculate(ctx, input);
  }
  function fromLegacyTime(t, gender, patch = {}) {
    return calculate(contextFromLegacyTime(t), { gender, policy: patch }).legacy;
  }
  function cleanForCompare(v) {
    if (Array.isArray(v)) return v.map(cleanForCompare);
    if (v && typeof v === "object") {
      const o = {};
      for (const k of Object.keys(v)) o[k] = cleanForCompare(v[k]);
      return o;
    }
    return typeof v === "number" ? round(v, 8) : v;
  }
  function diffPaths(a, b, path = "", out = []) {
    if (typeof a === "number" && typeof b === "number") {
      if (Math.abs(a - b) > 1e-7) out.push({ path, a, b });
      return out;
    }
    if (Array.isArray(a) || Array.isArray(b)) {
      if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) {
        out.push({ path, a, b });
        return out;
      }
      for (let i = 0; i < a.length; i++) diffPaths(a[i], b[i], `${path}[${i}]`, out);
      return out;
    }
    if (a && b && typeof a === "object" && typeof b === "object") {
      const ks = new Set([...Object.keys(a), ...Object.keys(b)]);
      for (const k of ks) diffPaths(a[k], b[k], path ? path + "." + k : k, out);
      return out;
    }
    if (a !== b) out.push({ path, a, b });
    return out;
  }
  function verifyLegacyTime(t, gender = "M") {
    if (typeof LEGACY_CALC !== "function")
      return { ok: false, reason: "v84 calcBazi snapshot unavailable" };
    const old = LEGACY_CALC(t, gender),
      neu = fromLegacyTime(t, gender),
      diff = diffPaths(cleanForCompare(old), cleanForCompare(neu));
    return { ok: diff.length === 0, diff, legacy: old, core: neu };
  }
  function selfTest() {
    const cases = [
      [
        "1986-base",
        { y: 1986, m: 6, d: 5, h: 17, mi: 30, s: 0 },
        { solar: false, lon: 117.8 },
        "M",
      ],
      [
        "1986-solar",
        { y: 1986, m: 6, d: 5, h: 17, mi: 30, s: 0 },
        { solar: true, lon: 117.8 },
        "M",
      ],
      [
        "lichun-before",
        { y: 2026, m: 2, d: 4, h: 3, mi: 0, s: 0 },
        { solar: false, lon: 120 },
        "F",
      ],
      ["lichun-after", { y: 2026, m: 2, d: 4, h: 8, mi: 0, s: 0 }, { solar: false, lon: 120 }, "F"],
      ["zi-2259", { y: 2026, m: 10, d: 4, h: 22, mi: 59, s: 0 }, { solar: false, lon: 120 }, "M"],
      ["zi-2300", { y: 2026, m: 10, d: 4, h: 23, mi: 0, s: 0 }, { solar: false, lon: 120 }, "M"],
      ["edge-2033", { y: 2033, m: 12, d: 22, h: 12, mi: 0, s: 0 }, { solar: false, lon: 120 }, "F"],
    ];
    const checks = [];
    if (typeof LEGACY_CALC !== "function" || typeof LEGACY_TIME !== "function")
      return {
        ok: false,
        checks: [{ id: "legacy.snapshot", ok: false, detail: "legacy functions unavailable" }],
      };
    for (const [id, civ, opt, g] of cases) {
      try {
        const t = LEGACY_TIME(civ, opt),
          v = verifyLegacyTime(t, g);
        checks.push({ id, ok: v.ok, diff: v.diff.slice(0, 8) });
      } catch (e) {
        checks.push({ id, ok: false, error: String((e && e.message) || e) });
      }
    }
    try {
      if (window.TianjiTime) {
        const ctx = TianjiTime.createContext(
            { y: 2026, m: 10, d: 4, h: 23, mi: 0, s: 0 },
            { location: { longitude: 120 } },
          ),
          r = calculate(ctx, { gender: "M" });
        checks.push({
          id: "canonical.shape",
          ok: !!(r.pillars && r.pillars.length === 4 && r.legacy && r.luck && r.elements),
          detail: r.pillars.map((x) => x.ganzhi).join(" "),
        });
      }
    } catch (e) {
      checks.push({ id: "canonical.shape", ok: false, error: String((e && e.message) || e) });
    }
    return { ok: checks.every((x) => x.ok), checks, version: VERSION, build: BUILD };
  }
  const test = selfTest();
  let installed = false;
  function install() {
    if (!test.ok || typeof LEGACY_CALC !== "function") return false;
    if (!window.__TianjiCalcBaziV84) window.__TianjiCalcBaziV84 = LEGACY_CALC;
    window.calcBazi = function (t, gender) {
      return fromLegacyTime(t, gender);
    };
    installed = true;
    return true;
  }
  function rollback() {
    if (typeof LEGACY_CALC === "function") {
      window.calcBazi = LEGACY_CALC;
      installed = false;
      return true;
    }
    return false;
  }
  install();
  function manifest() {
    return {
      module: "Tianji Bazi Core",
      version: VERSION,
      schema: SCHEMA,
      build: BUILD,
      baseline: "v87",
      installed,
      selfTest: test,
      policy: clone(DEFAULT_POLICY),
      migration:
        "v84 calcBazi frozen snapshot → v88 core adapter; auto rollback when regression test fails",
    };
  }
  const API = Object.freeze({
    version: VERSION,
    schema: SCHEMA,
    build: BUILD,
    defaultPolicy: () => clone(DEFAULT_POLICY),
    normalizePolicy,
    contextFromLegacyTime,
    calculate,
    fromCivil,
    fromLegacyTime,
    verifyLegacyTime,
    selfTest: () => clone(test),
    manifest,
    install,
    rollback,
    legacySnapshot: LEGACY_CALC,
  });
  window.TianjiBazi = API;

  try {
    if (window.TianjiCore) {
      TianjiCore.registerSource({
        id: "tianji-v88-bazi-core",
        type: "internal",
        title: "Tianji Bazi Core",
        version: VERSION,
        baseline: "v87",
        note: "八字确定性计算内核；通过 v84 snapshot 回归后接管 calcBazi，失败则保持旧引擎。",
      });
      TianjiCore.registerEngine(
        {
          id: "bazi.legacy",
          system: "bazi",
          name: "v84 八字排盘冻结快照",
          version: "v84-snapshot",
          source: "tianji-v84-internal",
          doctrine: "23:00 子初换日 / 原始函数冻结",
        },
        (input) => LEGACY_CALC(input.time, input.gender),
      );
      TianjiCore.registerEngine(
        {
          id: "bazi.core.v1",
          system: "bazi",
          name: "Tianji Bazi Core",
          version: VERSION,
          source: "tianji-v88-bazi-core",
          doctrine: "TimeContext + 显式年/月/日界 + 大运规则",
        },
        (input) => {
          const ctx =
            input.timeContext ||
            (input.time
              ? contextFromLegacyTime(input.time)
              : TianjiTime.createContext(input.civ, input.timePolicy || {}));
          return calculate(ctx, input);
        },
      );
      TianjiCore.registerEngine(
        {
          id: "bazi.verify.v84.v1",
          system: "bazi",
          name: "Bazi Core ↔ v84 Snapshot Regression",
          version: VERSION,
          source: "tianji-v88-bazi-core",
          doctrine: "deterministic regression",
        },
        (input) => verifyLegacyTime(input.time, input.gender),
      );
      if (test.ok && TianjiCore.setConfig)
        TianjiCore.setConfig({
          doctrine: {
            bazi: { id: "tianji-bazi-core-v1", label: "Tianji Bazi Core · 子平基础排盘" },
          },
        });
    }
  } catch (e) {
    try {
      console.warn("[TianjiBazi] registry", e);
    } catch (_) {}
  }

  const prev = window.TianjiSystem || {};
  window.TianjiSystem = Object.freeze({
    version: "v88",
    build: BUILD,
    baseline: "v84",
    core: window.TianjiCore || prev.core || null,
    time: window.TianjiTime || prev.time || null,
    verify: window.TianjiVerifier || prev.verify || null,
    bazi: API,
    manifest: () => ({
      product: "天机盘",
      version: "v88",
      build: BUILD,
      baseline: "v84",
      bazi: manifest(),
      time: window.TianjiTime && TianjiTime.manifest ? TianjiTime.manifest() : null,
      verify: window.TianjiVerifier && TianjiVerifier.manifest ? TianjiVerifier.manifest() : null,
    }),
  });
  try {
    document.documentElement.dataset.tjBaziTest = test.ok ? "pass" : "fail";
    document.documentElement.dataset.tjBaziInstalled = installed ? "true" : "false";
    const bv = document.getElementById("buildVersion");

    const anchor =
      document.getElementById("tjVerifyBadge") ||
      document.getElementById("tjTimeBadge") ||
      document.getElementById("tjCoreBadge") ||
      bv;
    let b = document.getElementById("tjBaziBadge");
    if (!b && anchor) {
      b = document.createElement("span");
      b.id = "tjBaziBadge";
      anchor.insertAdjacentElement("afterend", b);
    }
    if (b) {
      b.textContent = "Bazi " + VERSION + (installed ? " ✓" : " ·");
      b.classList.toggle("warn", !test.ok || !installed);
      b.title = test.ok
        ? `v88 八字核心回归通过：${test.checks.length} 项；已接管 calcBazi，可随时 rollback`
        : "v88 八字核心回归未通过，已保持 v84 旧引擎";
    }
  } catch (_) {}
})();
