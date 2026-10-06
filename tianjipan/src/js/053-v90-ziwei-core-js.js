(() => {
  "use strict";
  const BUILD = "2026-10-04 08:35:00";
  const VERSION = "1.0.0";
  const SCHEMA = "tianji.ziwei/1.0";
  const CAPABILITY = "legacy-simplified-chart";
  const LEGACY_CALC = window.calcZiwei;
  const GANS = "甲乙丙丁戊己庚辛壬癸".split("");
  const ZHIS = "子丑寅卯辰巳午未申酉戌亥".split("");
  const PALACES = [
    "命宫",
    "兄弟",
    "夫妻",
    "子女",
    "财帛",
    "疾厄",
    "迁移",
    "交友",
    "官禄",
    "田宅",
    "福德",
    "父母",
  ];
  const BUREAUS = { 2: "水二局", 3: "木三局", 4: "金四局", 5: "土五局", 6: "火六局" };
  const NAYINS = [
    "海中金",
    "炉中火",
    "大林木",
    "路旁土",
    "剑锋金",
    "山头火",
    "涧下水",
    "城头土",
    "白蜡金",
    "杨柳木",
    "泉中水",
    "屋上土",
    "霹雳火",
    "松柏木",
    "长流水",
    "沙中金",
    "山下火",
    "平地木",
    "壁上土",
    "金箔金",
    "覆灯火",
    "天河水",
    "大驿土",
    "钗钏金",
    "桑柘木",
    "大溪水",
    "沙中土",
    "天上火",
    "石榴木",
    "大海水",
  ];
  const SIHUA_TABLE = {
    0: ["廉贞", "破军", "武曲", "太阳"],
    1: ["天机", "天梁", "紫微", "太阴"],
    2: ["天同", "天机", "文昌", "廉贞"],
    3: ["太阴", "天同", "天机", "巨门"],
    4: ["贪狼", "太阴", "右弼", "天机"],
    5: ["武曲", "贪狼", "天梁", "文曲"],
    6: ["太阳", "武曲", "太阴", "天同"],
    7: ["巨门", "太阳", "文曲", "文昌"],
    8: ["天梁", "紫微", "左辅", "武曲"],
    9: ["破军", "巨门", "太阴", "贪狼"],
  };
  const SIHUA_LABEL = ["禄", "权", "科", "忌"];
  const DEFAULT_POLICY = Object.freeze({
    scope: { id: "legacy-simplified", label: "天机现有紫微简盘口径" },
    lunarLeapMonth: { mode: "after-day-15-next-month", label: "闰月十五后按下一月处理" },
    lifeBodyPalace: { mode: "lunar-month-hour-branch", label: "农历月数与时支定命身宫" },
    fiveElementsBureau: { mode: "life-palace-nayin", label: "命宫干支纳音五行定局" },
    majorStars: { mode: "legacy-14-main-stars", label: "现有十四主星简化安星法" },
    assistants: { mode: "zuoyou-changqu", label: "左辅右弼文昌文曲" },
    transformations: { mode: "year-stem-four-transformations", label: "生年干四化" },
    majorPeriod: {
      mode: "bureau-age-10-year",
      direction: "year-stem-yinyang-by-gender",
      label: "阴阳年干 × 性别定顺逆，局数起大限",
    },
    limitations: [
      "当前为简盘，不等同完整紫微斗数排盘",
      "未覆盖完整辅煞星系、庙旺落陷、长生十二神、流耀体系及多流派四化体系",
      "后续由独立验证层与 iztro 等成熟引擎交叉核验",
    ],
  });
  const clone = (o) => {
    try {
      return structuredClone(o);
    } catch (_) {
      return JSON.parse(JSON.stringify(o));
    }
  };
  const mod = (a, n) => ((a % n) + n) % n;
  const genderCode = (g) => (g === "F" ? "F" : "M");
  function ganzhiIndex(stem, branch) {
    for (let n = 0; n < 60; n++) if (n % 10 === stem && n % 12 === branch) return n;
    return 0;
  }
  function ziweiPosition(day, bureau) {
    let x = 0;
    while ((day + x) % bureau !== 0) x++;
    const q = (day + x) / bureau;
    return mod(2 + (x % 2 === 0 ? q + x : q - x) - 1, 12);
  }
  function normalizeLunar(lunar) {
    if (
      !lunar ||
      !Number.isFinite(+lunar.year) ||
      !Number.isFinite(+lunar.month) ||
      !Number.isFinite(+lunar.day)
    )
      throw new Error("ZiweiCore: valid lunar date required");
    const x = { year: +lunar.year, month: +lunar.month, day: +lunar.day, isLeap: !!lunar.isLeap };
    if (x.month < 1 || x.month > 12) throw new Error("ZiweiCore: lunar month out of range");
    if (x.day < 1 || x.day > 30) throw new Error("ZiweiCore: lunar day out of range");
    return x;
  }
  function normalizeHourBranch(hb) {
    hb = Number(hb);
    if (!Number.isInteger(hb) || hb < 0 || hb > 11)
      throw new Error("ZiweiCore: hourBranchIndex must be 0..11");
    return hb;
  }
  function calculate(input = {}) {
    const lunar = normalizeLunar(input.lunar),
      hb = normalizeHourBranch(input.hourBranchIndex ?? input.hourBranch),
      gender = genderCode(input.gender),
      policy = clone(DEFAULT_POLICY);
    const ys = mod(lunar.year - 4, 10);
    let m = lunar.month;
    if (lunar.isLeap && lunar.day > 15) m = (m % 12) + 1;
    const ming = mod(2 + m - 1 - hb, 12),
      shen = mod(2 + m - 1 + hb, 12);
    const start = ((ys % 5) * 2 + 2) % 10,
      stemOf = (b) => (start + mod(b - 2, 12)) % 10;
    const mIdx = ganzhiIndex(stemOf(ming), ming),
      nyName = NAYINS[mIdx >> 1],
      wxc = nyName[nyName.length - 1];
    const bureau = { 水: 2, 木: 3, 金: 4, 土: 5, 火: 6 }[wxc];
    if (!bureau) throw new Error("ZiweiCore: unable to derive five-elements bureau");
    const z = ziweiPosition(lunar.day, bureau),
      tf = mod(4 - z, 12);
    const stars = {};
    const put = (n, b, t) => {
      (stars[mod(b, 12)] = stars[mod(b, 12)] || []).push({ n, t });
    };
    [
      ["紫微", 0],
      ["天机", -1],
      ["太阳", -3],
      ["武曲", -4],
      ["天同", -5],
      ["廉贞", -8],
    ].forEach(([n, o]) => put(n, z + o, "main"));
    [
      ["天府", 0],
      ["太阴", 1],
      ["贪狼", 2],
      ["巨门", 3],
      ["天相", 4],
      ["天梁", 5],
      ["七杀", 6],
      ["破军", 10],
    ].forEach(([n, o]) => put(n, tf + o, "main"));
    put("左辅", 4 + m - 1, "aux");
    put("右弼", 10 - (m - 1), "aux");
    put("文昌", 10 - hb, "aux");
    put("文曲", 4 + hb, "aux");
    const sh = SIHUA_TABLE[ys];
    Object.values(stars).forEach((arr) =>
      arr.forEach((s) => {
        const i = sh.indexOf(s.n);
        if (i >= 0) s.h = SIHUA_LABEL[i];
      }),
    );
    const fwd = (ys % 2 === 0) === (gender === "M");
    const pal = [];
    for (let b = 0; b < 12; b++) {
      const k = fwd ? mod(b - ming, 12) : mod(ming - b, 12);
      pal.push({
        b,
        name: PALACES[mod(ming - b, 12)],
        stem: stemOf(b),
        stars: stars[b] || [],
        isMing: b === ming,
        isShen: b === shen,
        dx: [bureau + 10 * k, bureau + 10 * k + 9],
      });
    }
    const legacy = {
      ys,
      m,
      ming,
      shen,
      ju: bureau,
      juName: BUREAUS[bureau],
      nyName,
      z,
      tf,
      pal,
      fwd,
      sihua: sh.map((n, i) => SIHUA_LABEL[i] + ":" + n),
      lunarYear: lunar.year,
    };
    const canonicalPalaces = pal.map((p) => ({
      branchIndex: p.b,
      branch: ZHIS[p.b],
      name: p.name,
      stemIndex: p.stem,
      stem: GANS[p.stem],
      isLifePalace: p.isMing,
      isBodyPalace: p.isShen,
      majorPeriod: { startAge: p.dx[0], endAge: p.dx[1] },
      stars: p.stars.map((s) => ({
        name: s.n,
        type: s.t === "main" ? "major" : "assistant",
        transformation: s.h || null,
      })),
    }));
    return {
      schema: SCHEMA,
      version: VERSION,
      build: BUILD,
      capability: CAPABILITY,
      input: { lunar: clone(lunar), hourBranchIndex: hb, hourBranch: ZHIS[hb], gender },
      policy,
      yearStem: { index: ys, name: GANS[ys] },
      effectiveLunarMonth: m,
      lifePalace: {
        branchIndex: ming,
        branch: ZHIS[ming],
        stemIndex: stemOf(ming),
        stem: GANS[stemOf(ming)],
        nayin: nyName,
      },
      bodyPalace: {
        branchIndex: shen,
        branch: ZHIS[shen],
        stemIndex: stemOf(shen),
        stem: GANS[stemOf(shen)],
      },
      bureau: { number: bureau, name: BUREAUS[bureau], nayin: nyName },
      starAnchors: {
        ziweiBranchIndex: z,
        ziweiBranch: ZHIS[z],
        tianfuBranchIndex: tf,
        tianfuBranch: ZHIS[tf],
      },
      transformations: sh.map((n, i) => ({ type: SIHUA_LABEL[i], star: n })),
      majorPeriod: { forward: fwd, direction: fwd ? "顺行" : "逆行" },
      palaces: canonicalPalaces,
      legacy,
    };
  }
  function fromLegacy(lunar, hb, gender) {
    return calculate({ lunar, hourBranchIndex: hb, gender }).legacy;
  }
  function fromTimeContext(ctx, input = {}) {
    if (!ctx || !ctx.clock || !ctx.astronomy) throw new Error("ZiweiCore: TimeContext required");
    if (typeof window.fromJD !== "function" || typeof window.solar2lunar !== "function")
      throw new Error("ZiweiCore: calendar adapters unavailable");
    const loc = ctx.clock.calculation || ctx.clock.civil,
      policy = ctx.policy || {},
      dayMode = (policy.dayBoundary && policy.dayBoundary.mode) || "ziEarly";
    let jd = +ctx.astronomy.jdCalculationLocal;
    if (!Number.isFinite(jd)) throw new Error("ZiweiCore: invalid jdCalculationLocal");
    if (dayMode === "ziEarly" && loc.h >= 23) jd += 1;
    const cal = window.fromJD(jd + 1e-7),
      lunar = window.solar2lunar(cal.y, cal.m, cal.d),
      hb = Math.floor((loc.h + 1) / 2) % 12;
    return calculate({ lunar, hourBranchIndex: hb, gender: input.gender });
  }
  function diffPaths(a, b, path = "", out = []) {
    if (typeof a === "number" && typeof b === "number") {
      if (Math.abs(a - b) > 1e-9) out.push({ path, a, b });
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
  function verifyLegacy(lunar, hb, gender = "M") {
    if (typeof LEGACY_CALC !== "function")
      return { ok: false, reason: "v84 calcZiwei snapshot unavailable" };
    const old = LEGACY_CALC(clone(lunar), hb, gender),
      neu = fromLegacy(clone(lunar), hb, gender),
      diff = diffPaths(old, neu);
    return { ok: diff.length === 0, diff, legacy: old, core: neu };
  }
  function selfTest() {
    const cases = [
      ["base-male", { year: 1986, month: 4, day: 28, isLeap: false }, 9, "M"],
      ["base-female", { year: 1986, month: 4, day: 28, isLeap: false }, 9, "F"],
      ["zi-hour", { year: 2026, month: 8, day: 24, isLeap: false }, 0, "M"],
      ["hai-hour", { year: 2026, month: 8, day: 24, isLeap: false }, 11, "F"],
      ["leap-before15", { year: 2025, month: 6, day: 15, isLeap: true }, 5, "M"],
      ["leap-after15", { year: 2025, month: 6, day: 16, isLeap: true }, 5, "M"],
      ["month12-wrap", { year: 2033, month: 12, day: 29, isLeap: true }, 7, "F"],
    ];
    const checks = [];
    if (typeof LEGACY_CALC !== "function")
      return {
        ok: false,
        checks: [{ id: "legacy.snapshot", ok: false, detail: "calcZiwei unavailable" }],
      };
    for (const [id, l, h, g] of cases) {
      try {
        const v = verifyLegacy(l, h, g);
        checks.push({ id, ok: v.ok, diff: v.diff.slice(0, 8) });
      } catch (e) {
        checks.push({ id, ok: false, error: String((e && e.message) || e) });
      }
    }
    try {
      const r = calculate({
        lunar: { year: 1986, month: 4, day: 28, isLeap: false },
        hourBranchIndex: 9,
        gender: "M",
      });
      checks.push({
        id: "canonical.shape",
        ok: !!(r.palaces && r.palaces.length === 12 && r.bureau && r.lifePalace && r.legacy),
        detail: r.bureau.name + " · " + r.lifePalace.branch,
      });
    } catch (e) {
      checks.push({ id: "canonical.shape", ok: false, error: String((e && e.message) || e) });
    }
    return { ok: checks.every((x) => x.ok), checks, version: VERSION, build: BUILD };
  }
  const test = selfTest();
  let installed = false;
  function install() {
    if (!test.ok || typeof LEGACY_CALC !== "function") return false;
    if (!window.__TianjiCalcZiweiV84) window.__TianjiCalcZiweiV84 = LEGACY_CALC;
    window.calcZiwei = function (lunar, hb, gender) {
      return fromLegacy(lunar, hb, gender);
    };
    installed = true;
    return true;
  }
  function rollback() {
    if (typeof LEGACY_CALC === "function") {
      window.calcZiwei = LEGACY_CALC;
      installed = false;
      return true;
    }
    return false;
  }
  install();
  function manifest() {
    return {
      module: "Tianji Ziwei Core",
      version: VERSION,
      schema: SCHEMA,
      build: BUILD,
      baseline: "v89 / legacy source v84",
      capability: CAPABILITY,
      installed,
      selfTest: test,
      policy: clone(DEFAULT_POLICY),
      migration:
        "v84 calcZiwei frozen as snapshot; v90 core installed only after zero-diff regression",
    };
  }
  const API = Object.freeze({
    version: VERSION,
    schema: SCHEMA,
    build: BUILD,
    capability: CAPABILITY,
    policy: () => clone(DEFAULT_POLICY),
    calculate,
    fromLegacy,
    fromTimeContext,
    verifyLegacy,
    selfTest: () => clone(test),
    install,
    rollback,
    manifest,
  });
  window.TianjiZiwei = API;
  try {
    if (window.TianjiCore && TianjiCore.registerEngine) {
      TianjiCore.registerEngine(
        {
          id: "ziwei.core.v1",
          system: "ziwei",
          name: "Tianji Ziwei Core v1",
          version: VERSION,
          source: "tianji-v84-internal",
          doctrine: "现有紫微简盘口径；v90 抽离核心",
          status: "active",
        },
        (input) => calculate(input || {}),
      );
      TianjiCore.registerEngine(
        {
          id: "ziwei.verify.v84.v1",
          system: "ziwei-verification",
          name: "Ziwei Core ↔ v84 snapshot regression",
          version: VERSION,
          source: "tianji-v84-internal",
          status: "verification-only",
        },
        (input) =>
          verifyLegacy(input.lunar, input.hourBranchIndex ?? input.hourBranch, input.gender),
      );
    }
  } catch (_) {}
  try {
    const bv = document.getElementById("buildVersion");

    const anchor =
      document.getElementById("tjBaziVerifyBadge") ||
      document.getElementById("tjBaziBadge") ||
      document.getElementById("tjTimeBadge") ||
      bv;
    let badge = document.getElementById("tjZiweiBadge");
    if (!badge && anchor) {
      badge = document.createElement("span");
      badge.id = "tjZiweiBadge";
      anchor.insertAdjacentElement("afterend", badge);
    }
    if (badge) {
      badge.textContent = "ZiweiCore " + VERSION + " · 简盘";
      badge.classList.toggle("warn", !test.ok);
      badge.title = test.ok
        ? "v90 紫微简盘核心已通过 v84 零差异回归并接管 calcZiwei"
        : "v90 紫微核心回归未通过；继续使用旧 calcZiwei";
    }
  } catch (_) {}
  const prev = window.TianjiSystem || {};
  window.TianjiSystem = Object.freeze({
    version: "v90",
    build: BUILD,
    baseline: "v84",
    core: window.TianjiCore || prev.core || null,
    time: window.TianjiTime || prev.time || null,
    verify: window.TianjiVerifier || prev.verify || null,
    bazi: window.TianjiBazi || prev.bazi || null,
    baziVerify: window.TianjiBaziVerifier || prev.baziVerify || null,
    ziwei: API,
    manifest: () => ({
      product: "天机盘",
      version: "v90",
      build: BUILD,
      baseline: "v84",
      ziwei: manifest(),
      bazi: window.TianjiBazi && TianjiBazi.manifest ? TianjiBazi.manifest() : null,
    }),
  });
  try {
    window.dispatchEvent(new CustomEvent("tianji:ziwei-core-ready", { detail: manifest() }));
  } catch (_) {}
})();
