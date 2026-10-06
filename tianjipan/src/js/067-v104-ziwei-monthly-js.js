(() => {
  "use strict";
  const BUILD = "2026-10-04 10:32:52",
    VERSION = "1.13.0",
    SCHEMA = "tianji.ziwei/1.13",
    CAPABILITY = "target-date-monthly-flow-layer";
  const BASE = window.TianjiZiwei;
  if (
    !BASE ||
    typeof BASE.calculate !== "function" ||
    typeof BASE.yearlyAt !== "function" ||
    typeof BASE.horoscopeAt !== "function"
  ) {
    try {
      console.warn("[TianjiZiwei v104] v103 core unavailable");
    } catch (_) {}
    return;
  }
  const GANS = "甲乙丙丁戊己庚辛壬癸".split(""),
    ZHIS = "子丑寅卯辰巳午未申酉戌亥".split("");
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
  const SIHUA = {
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
  const clone = (o) => {
      try {
        return structuredClone(o);
      } catch (_) {
        return JSON.parse(JSON.stringify(o));
      }
    },
    mod = (a, n) => ((a % n) + n) % n;
  function normalizeSolarDate(v) {
    if (BASE.base && typeof BASE.base.normalizeSolarDate === "function")
      return BASE.base.normalizeSolarDate(v);
    let y, m, d;
    if (v instanceof Date) {
      y = v.getFullYear();
      m = v.getMonth() + 1;
      d = v.getDate();
    } else if (typeof v === "string") {
      const x = v.trim().match(/^(\d{4})[-\/.](\d{1,2})[-\/.](\d{1,2})/);
      if (!x) throw new Error("ZiweiCore v104: target date must be YYYY-MM-DD");
      y = +x[1];
      m = +x[2];
      d = +x[3];
    } else if (v && typeof v === "object") {
      y = +(v.year ?? v.y);
      m = +(v.month ?? v.m);
      d = +(v.day ?? v.d);
    }
    if (!Number.isInteger(y) || !Number.isInteger(m) || !Number.isInteger(d))
      throw new Error("ZiweiCore v104: invalid target solar date");
    const dt = new Date(Date.UTC(y, m - 1, d));
    if (dt.getUTCFullYear() !== y || dt.getUTCMonth() + 1 !== m || dt.getUTCDate() !== d)
      throw new Error("ZiweiCore v104: invalid Gregorian date");
    return {
      year: y,
      month: m,
      day: d,
      iso: `${String(y).padStart(4, "0")}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
    };
  }
  function targetLunar(s) {
    if (typeof window.solar2lunar !== "function")
      throw new Error("ZiweiCore v104: solar2lunar unavailable");
    const x = window.solar2lunar(s.year, s.month, s.day);
    return { year: +x.year, month: +x.month, day: +x.day, isLeap: !!x.isLeap };
  }
  function effectiveLunarMonth(l) {
    return mod(+l.month + (l.isLeap && +l.day > 15 ? 1 : 0) - 1, 12) + 1;
  }
  function normalizeChart(x) {
    return x && Array.isArray(x.palaces) ? x : BASE.calculate(x || {});
  }
  function flowPalaceName(flowBranch, b) {
    return PALACES[mod(flowBranch - b, 12)];
  }
  function yearStemTiger(stemIndex) {
    return mod(mod(stemIndex, 5) * 2 + 2, 10);
  }
  function monthGanzhiNormal(yearly, lunar) {
    const m = effectiveLunarMonth(lunar),
      si = mod(yearStemTiger(yearly.year.stemIndex) + (m - 1), 10),
      bi = mod(m + 1, 12);
    return {
      mode: "normal",
      stemIndex: si,
      stem: GANS[si],
      branchIndex: bi,
      branch: ZHIS[bi],
      ganzhi: GANS[si] + ZHIS[bi],
      effectiveMonth: m,
      basis: "lunar-month",
      label: "农历月换月",
    };
  }
  function monthGanzhiExact(solar) {
    if (!(window.TianjiTime && typeof TianjiTime.createContext === "function"))
      throw new Error("ZiweiCore v104: TianjiTime required for exact month boundary");
    const c = TianjiTime.createContext(
        { y: solar.year, m: solar.month, d: solar.day, h: 12, mi: 0, s: 0 },
        { yearBoundary: { mode: "lichun" }, monthBoundary: { mode: "jie" } },
      ),
      mi = c && c.boundaries && c.boundaries.month && c.boundaries.month.solarMonthIndex,
      year = c && c.boundaries && c.boundaries.year && c.boundaries.year.effectiveYear;
    if (!Number.isInteger(mi) || !Number.isInteger(year))
      throw new Error("ZiweiCore v104: unable to resolve exact month ganzhi");
    const ys = mod(year - 4, 10),
      si = mod(yearStemTiger(ys) + mi, 10),
      bi = mod(2 + mi, 12);
    return {
      mode: "exact",
      stemIndex: si,
      stem: GANS[si],
      branchIndex: bi,
      branch: ZHIS[bi],
      ganzhi: GANS[si] + ZHIS[bi],
      solarMonthIndex: mi,
      effectiveYear: year,
      basis: "jie",
      label: "十二节交节换月",
      startLocal: clone(c.boundaries.month.startLocal),
      nextLocal: clone(c.boundaries.month.nextLocal),
    };
  }
  function monthGanzhi(yearly, solar, lunar, divide) {
    return divide === "exact" ? monthGanzhiExact(solar) : monthGanzhiNormal(yearly, lunar);
  }
  function monthlyLifeBranch(chart, yearBranch, targetLunarMonth) {
    const bm = Number(
        chart.effectiveLunarMonth ||
          (chart.input && chart.input.lunar && chart.input.lunar.month) ||
          1,
      ),
      hb = Number((chart.input && chart.input.hourBranchIndex) || 0);
    return mod(yearBranch - bm + hb + targetLunarMonth, 12);
  }
  function monthlyStars(stem, branch) {
    const pos = {},
      put = (name, b, type) => {
        pos[name] = {
          name,
          branchIndex: mod(b, 12),
          branch: ZHIS[mod(b, 12)],
          type,
          scope: "monthly",
        };
      };
    const kuiYue = {
      0: [1, 7],
      1: [0, 8],
      2: [11, 9],
      3: [11, 9],
      4: [1, 7],
      5: [0, 8],
      6: [1, 7],
      7: [6, 2],
      8: [3, 5],
      9: [3, 5],
    }[stem];
    put("月魁", kuiYue[0], "soft");
    put("月钺", kuiYue[1], "soft");
    const cq = {
      0: [5, 9],
      1: [6, 8],
      2: [8, 6],
      3: [9, 5],
      4: [8, 6],
      5: [9, 5],
      6: [11, 3],
      7: [0, 2],
      8: [2, 0],
      9: [3, 11],
    }[stem];
    put("月昌", cq[0], "soft");
    put("月曲", cq[1], "soft");
    const lu = { 0: 2, 1: 3, 2: 5, 3: 6, 4: 5, 5: 6, 6: 8, 7: 9, 8: 11, 9: 0 }[stem];
    put("月禄", lu, "lucun");
    put("月羊", lu + 1, "tough");
    put("月陀", lu - 1, "tough");
    let ma;
    if ([2, 6, 10].includes(branch)) ma = 8;
    else if ([8, 0, 4].includes(branch)) ma = 2;
    else if ([5, 9, 1].includes(branch)) ma = 11;
    else ma = 5;
    put("月马", ma, "tianma");
    const luan = mod(3 - branch, 12);
    put("月鸾", luan, "flower");
    put("月喜", luan + 6, "flower");
    const byBranch = Array.from({ length: 12 }, () => []);
    Object.values(pos).forEach((x) => byBranch[x.branchIndex].push(clone(x)));
    return { count: Object.keys(pos).length, names: Object.keys(pos), positions: pos, byBranch };
  }
  function findStarBranch(chart, name) {
    for (const p of chart.palaces || []) {
      const arr = [...(p.majorStars || []), ...(p.minorStars || []), ...(p.stars || [])];
      if (arr.some((s) => s && s.name === name))
        return { branchIndex: p.branchIndex, branch: p.branch, palace: p.name };
    }
    return null;
  }
  function monthlyTransformations(chart, stem) {
    return SIHUA[stem].map((star, i) => {
      const loc = findStarBranch(chart, star);
      return {
        type: SIHUA_LABEL[i],
        star,
        branchIndex: loc ? loc.branchIndex : null,
        branch: loc ? loc.branch : null,
        natalPalace: loc ? loc.palace : null,
        scope: "monthly",
      };
    });
  }
  function monthlyAt(chartOrInput, target, options = {}) {
    const chart = normalizeChart(chartOrInput),
      solar = normalizeSolarDate(target),
      lunar = targetLunar(solar),
      divide =
        String(
          options.horoscopeDivide ||
            (BASE.getHoroscopeDivide && BASE.getHoroscopeDivide()) ||
            "normal",
        ) === "exact"
          ? "exact"
          : "normal",
      yearly = BASE.yearlyAt(chart, solar.iso, { horoscopeDivide: divide }),
      effMonth = effectiveLunarMonth(lunar),
      mg = monthGanzhi(yearly, solar, lunar, divide),
      life = monthlyLifeBranch(chart, yearly.year.branchIndex, effMonth),
      stars = monthlyStars(mg.stemIndex, mg.branchIndex),
      trans = monthlyTransformations(chart, mg.stemIndex),
      byBranch = {};
    (chart.palaces || []).forEach((p) => (byBranch[p.branchIndex] = p));
    const palaces = ZHIS.map((branch, b) => {
      const p = byBranch[b] || {};
      return {
        branchIndex: b,
        branch,
        natalPalaceName: p.name || "",
        monthlyPalaceName: flowPalaceName(life, b),
        isMonthlyLifePalace: b === life,
        flowStars: clone(stars.byBranch[b]),
        transformations: trans.filter((x) => x.branchIndex === b),
      };
    });
    return {
      target: { solar, lunar },
      scope: "monthly",
      parentYear: { year: clone(yearly.year), horoscopeDivide: yearly.boundary.horoscopeDivide },
      boundary: {
        horoscopeDivide: divide,
        ganzhiMonthBoundary: mg.label,
        palaceMonthBoundary: "农历月推进",
        leapRule: "闰月初一至十五按本月；十六日起按下一月",
      },
      month: {
        lunarMonth: lunar.month,
        isLeapMonth: lunar.isLeap,
        lunarDay: lunar.day,
        effectiveLunarMonth: effMonth,
        part: lunar.isLeap ? (lunar.day > 15 ? "second" : "first") : "normal",
        stemIndex: mg.stemIndex,
        stem: mg.stem,
        branchIndex: mg.branchIndex,
        branch: mg.branch,
        ganzhi: mg.ganzhi,
        basis: mg.basis,
        solarMonthIndex: Number.isInteger(mg.solarMonthIndex) ? mg.solarMonthIndex : null,
        effectiveYear: Number.isInteger(mg.effectiveYear) ? mg.effectiveYear : yearly.year.year,
        startLocal: mg.startLocal || null,
        nextLocal: mg.nextLocal || null,
      },
      lifePalace: { branchIndex: life, branch: ZHIS[life], name: "流月命宫" },
      palaces,
      transformations: trans,
      flowStars: stars,
      doctrine: clone(chart.doctrine || null),
      astroType: clone(chart.astroType || null),
      policy: {
        horoscopeDivide: divide,
        monthlyPalaceRule: "流年地支逆数生月，再顺数生时为正月；随目标农历月顺推",
        leapMonthRule: "闰月十六日起视作下一月",
        monthGanzhiRule: divide === "exact" ? "十二节交节定月干支" : "农历月份定月干支",
        flowStarRule: "魁钺昌曲禄羊陀马鸾喜",
        fourTransformations: "流月天干四化",
      },
    };
  }
  function horoscopeAt(chartOrInput, target, options = {}) {
    const base = BASE.horoscopeAt(chartOrInput, target, options),
      monthly = monthlyAt(chartOrInput, target, options),
      flow = Object.assign({}, clone(base.flow || {}), { monthly: clone(monthly) });
    return Object.assign({}, clone(base), {
      monthly,
      flow,
      summary: Object.assign({}, clone(base.summary || {}), {
        monthlyGanzhi: monthly.month.ganzhi,
        monthlyLifePalace: monthly.lifePalace.branch,
        effectiveLunarMonth: monthly.month.effectiveLunarMonth,
      }),
    });
  }
  function calculate(input = {}) {
    const out = clone(BASE.calculate(input));
    out.schema = SCHEMA;
    out.version = VERSION;
    out.build = BUILD;
    out.capability = CAPABILITY;
    out.coverage = Object.assign({}, out.coverage || {}, {
      monthlyFlow: true,
      monthlyPalaces: true,
      monthlyMutagens: true,
      monthlyFlowStars: true,
      monthlyLeapSegmentation: true,
    });
    return out;
  }
  function fromLegacy(lunar, hb, gender) {
    return BASE.fromLegacy(lunar, hb, gender);
  }
  function fromTimeContext(ctx, input = {}) {
    const out = clone(BASE.fromTimeContext(ctx, input));
    out.schema = SCHEMA;
    out.version = VERSION;
    out.build = BUILD;
    out.capability = CAPABILITY;
    out.coverage = Object.assign({}, out.coverage || {}, {
      monthlyFlow: true,
      monthlyPalaces: true,
      monthlyMutagens: true,
      monthlyFlowStars: true,
      monthlyLeapSegmentation: true,
    });
    return out;
  }
  function starNamesAt(m, b) {
    return (m.palaces[b].flowStars || [])
      .map((s) => s.name)
      .sort((a, b) => a.localeCompare(b, "zh-CN"));
  }
  function selfTest() {
    const checks = [];
    try {
      const b = BASE.selfTest && BASE.selfTest();
      checks.push({ id: "v103.base", ok: !b || b.ok !== false });
    } catch (e) {
      checks.push({ id: "v103.base", ok: false, error: String((e && e.message) || e) });
    }
    const birth = {
      lunar: { year: 2000, month: 7, day: 17, isLeap: false },
      hourBranchIndex: 2,
      gender: "F",
    };
    try {
      const m = monthlyAt(birth, "2023-08-19", { horoscopeDivide: "normal" });
      checks.push({
        id: "monthly.reference-ganzhi-life",
        ok: m.month.ganzhi === "庚申" && m.lifePalace.branch === "巳",
      });
      checks.push({
        id: "monthly.palace-names",
        ok:
          m.palaces[5].monthlyPalaceName === "命宫" &&
          m.palaces[4].monthlyPalaceName === "兄弟" &&
          m.palaces[6].monthlyPalaceName === "父母",
      });
      checks.push({
        id: "monthly.mutagens",
        ok:
          JSON.stringify(m.transformations.map((x) => x.type + ":" + x.star)) ===
          JSON.stringify(["禄:太阳", "权:武曲", "科:太阴", "忌:天同"]),
      });
      checks.push({
        id: "monthly.flow-stars",
        ok:
          starNamesAt(m, 1).includes("月魁") &&
          starNamesAt(m, 1).includes("月喜") &&
          starNamesAt(m, 2).includes("月马") &&
          starNamesAt(m, 3).includes("月曲") &&
          starNamesAt(m, 7).includes("月钺") &&
          starNamesAt(m, 7).includes("月陀") &&
          starNamesAt(m, 7).includes("月鸾") &&
          starNamesAt(m, 8).includes("月禄") &&
          starNamesAt(m, 9).includes("月羊") &&
          starNamesAt(m, 11).includes("月昌"),
      });
    } catch (e) {
      checks.push({
        id: "monthly.reference-suite",
        ok: false,
        error: String((e && e.message) || e),
      });
    }
    try {
      const a = monthlyAt(birth, "2023-04-05"),
        b = monthlyAt(birth, "2023-04-06");
      checks.push({
        id: "leap.split-day16",
        ok:
          a.target.lunar.isLeap &&
          b.target.lunar.isLeap &&
          a.month.effectiveLunarMonth === 2 &&
          b.month.effectiveLunarMonth === 3 &&
          a.month.part === "first" &&
          b.month.part === "second",
      });
    } catch (e) {
      checks.push({ id: "leap.split-day16", ok: false, error: String((e && e.message) || e) });
    }
    try {
      const n = monthlyAt(birth, "2025-02-02", { horoscopeDivide: "normal" }),
        e = monthlyAt(birth, "2025-02-02", { horoscopeDivide: "exact" });
      checks.push({
        id: "month-boundary.normal-exact",
        ok: n.month.ganzhi === "戊寅" && e.month.ganzhi === "丁丑",
      });
    } catch (e) {
      checks.push({
        id: "month-boundary.normal-exact",
        ok: false,
        error: String((e && e.message) || e),
      });
    }
    try {
      const h = horoscopeAt(birth, "2023-08-19");
      checks.push({
        id: "combined.horoscopeAt",
        ok: !!(
          h.yearly &&
          h.monthly &&
          h.majorCycle &&
          h.minorPeriod &&
          h.flow &&
          h.flow.monthly &&
          h.monthly.month.ganzhi === "庚申"
        ),
      });
    } catch (e) {
      checks.push({ id: "combined.horoscopeAt", ok: false, error: String((e && e.message) || e) });
    }
    return { ok: checks.every((x) => x.ok), checks, version: VERSION, build: BUILD };
  }
  const TEST = selfTest();
  function manifest() {
    return {
      module: "Tianji Ziwei Core",
      version: VERSION,
      schema: SCHEMA,
      build: BUILD,
      baseline: "v103",
      capability: CAPABILITY,
      selfTest: clone(TEST),
      coverage: {
        monthlyFlow: true,
        monthlyPalaces: true,
        monthlyMutagens: true,
        monthlyFlowStars: true,
        monthlyLeapSegmentation: true,
      },
      remainingGaps: ["流日层", "流时层", "流月列表 monthlyList API（目标日期流月已完成）"],
      references: [
        {
          name: "SylarLong/iztro",
          version: "2.6.1",
          tagCommit: "b78dfe391f65e938d79f2419dddb80f74c6bbb8e",
          license: "MIT",
          files: [
            "src/astro/FunctionalAstrolabe.ts#horoscope-monthly",
            "src/astro/FunctionalAstrolabe.ts#monthlyList",
            "src/star/horoscopeStar.ts",
            "src/star/location.ts",
          ],
          role: "monthly flow deterministic rule cross-check",
        },
      ],
    };
  }
  const API = Object.freeze({
    version: VERSION,
    schema: SCHEMA,
    build: BUILD,
    capability: CAPABILITY,
    calculate,
    fromLegacy,
    fromTimeContext,
    cycleAt: BASE.cycleAt,
    fortuneAt: BASE.fortuneAt || BASE.cycleAt,
    majorCycleAt: BASE.majorCycleAt || BASE.cycleAt,
    majorCycleForAge: BASE.majorCycleForAge,
    minorPeriodAt: BASE.minorPeriodAt,
    minorPeriodForDate: BASE.minorPeriodForDate || BASE.minorPeriodAt,
    nominalAgeAt: BASE.nominalAgeAt,
    yearlyAt: BASE.yearlyAt,
    flowYearAt: BASE.flowYearAt || BASE.yearlyAt,
    monthlyAt,
    flowMonthAt: monthlyAt,
    horoscopeAt,
    setHoroscopeDivide: BASE.setHoroscopeDivide,
    getHoroscopeDivide: BASE.getHoroscopeDivide,
    setAgeDivide: BASE.setAgeDivide,
    getAgeDivide: BASE.getAgeDivide,
    setPolicy: BASE.setPolicy,
    getPolicy: BASE.getPolicy,
    setDoctrine: BASE.setDoctrine,
    getDoctrine: BASE.getDoctrine,
    selfTest: () => clone(TEST),
    manifest,
    base: BASE,
  });
  window.TianjiZiwei = API;
  if (TEST.ok) window.calcZiwei = (lunar, hb, gender) => fromLegacy(lunar, hb, gender);
  try {
    if (window.TianjiCore) {
      TianjiCore.registerSource({
        id: "tianji-v104-ziwei-monthly-flow",
        type: "internal",
        title: "Tianji Ziwei Core 1.13 Target-Date Monthly Flow Layer",
        version: VERSION,
        baseline: "v103",
      });
      TianjiCore.registerSource({
        id: "iztro-2.6.1-monthly-flow-reference",
        type: "third-party-reference",
        title: "SylarLong/iztro v2.6.1 monthly horoscope reference",
        version: "2.6.1",
        license: "MIT",
        repository: "SylarLong/iztro",
        commit: "b78dfe391f65e938d79f2419dddb80f74c6bbb8e",
        role: "rule-reference",
      });
      TianjiCore.registerEngine(
        {
          id: "ziwei.core.v1.13",
          system: "ziwei",
          name: "Tianji Ziwei Core 1.13",
          version: VERSION,
          source: "tianji-v104-ziwei-monthly-flow",
          doctrine: "target-date monthly palace/mutagen/flow-star with leap-month segmentation",
          status: "active",
        },
        (input) => calculate(input || {}),
      );
    }
  } catch (e) {
    try {
      console.warn("[TianjiZiwei v104] registry", e);
    } catch (_) {}
  }
  try {
    const old =
      document.getElementById("tjZiweiV13Badge") || document.getElementById("buildVersion");
    let b = document.getElementById("tjZiweiV14Badge");
    if (!b && old) {
      b = document.createElement("span");
      b.id = "tjZiweiV14Badge";
      old.insertAdjacentElement("afterend", b);
    }
    if (b) {
      b.textContent = "ZiweiCore 1.13 · 流月";
      b.classList.toggle("warn", !TEST.ok);
      b.title = TEST.ok
        ? "v104：流月十二宫 / 四化 / 月曜 / 闰月分段通过回归"
        : "v104 流月层自检失败；v103 保持可回退";
      b.dataset.selftest = TEST.ok ? "PASS" : "FAIL";
      b.dataset.checks =
        String(TEST.checks.filter((x) => x.ok).length) + "/" + String(TEST.checks.length);
    }
  } catch (_) {}
  /* ---- v104-aware iztro monthly verifier ---- */
  const OLDV = window.TianjiZiweiVerifier,
    V14STATE = { lastSuite: null };
  function eq(a, b) {
    return JSON.stringify(a) === JSON.stringify(b);
  }
  function vendorMonthly(input, target, horoscopeDivide = "normal") {
    if (!(window.iztro && iztro.astro && iztro.astro.byLunar)) throw new Error("iztro unavailable");
    const astro = iztro.astro,
      l = input.lunar,
      g = input.gender === "F" ? "女" : "男",
      h = Number(input.timeIndex ?? input.hourBranchIndex ?? 0),
      d = input.ziweiDoctrine || {},
      algorithm = d.algorithm || "default",
      old = astro.getConfig ? astro.getConfig() : {};
    try {
      if (astro.config) astro.config({ algorithm, horoscopeDivide });
      const v = astro.byLunar(`${l.year}-${l.month}-${l.day}`, h, g, !!l.isLeap, true, "zh-CN"),
        hor = v.horoscope(normalizeSolarDate(target).iso),
        m = (hor && hor.monthly) || {},
        pal = m.palaceNames || [],
        stars = m.stars || [],
        toBranchArray = (a) => {
          const out = Array(12);
          (a || []).forEach((x, i) => (out[mod(i + 2, 12)] = x));
          return out;
        };
      return {
        indexPhysical: mod(Number(m.index) + 2, 12),
        stem: m.heavenlyStem,
        branch: m.earthlyBranch,
        palaceNames: toBranchArray(pal),
        mutagen: (m.mutagen || []).slice(),
        stars: toBranchArray(stars).map((a) =>
          (a || []).map((s) => s.name).sort((a, b) => a.localeCompare(b, "zh-CN")),
        ),
      };
    } finally {
      try {
        if (astro.config)
          astro.config({
            algorithm: old.algorithm || "default",
            horoscopeDivide: old.horoscopeDivide || "normal",
            ageDivide: old.ageDivide || "normal",
            dayDivide: old.dayDivide || "forward",
            yearDivide: old.yearDivide || "normal",
          });
      } catch (_) {}
    }
  }
  function primaryMonthlySnapshot(m) {
    return {
      indexPhysical: m.lifePalace.branchIndex,
      stem: m.month.stem,
      branch: m.month.branch,
      palaceNames: m.palaces.map((p) => p.monthlyPalaceName),
      mutagen: m.transformations.map((x) => x.star),
      stars: m.palaces.map((p) =>
        (p.flowStars || []).map((s) => s.name).sort((a, b) => a.localeCompare(b, "zh-CN")),
      ),
    };
  }
  function compareMonthly(input, target, horoscopeDivide = "normal") {
    if (!(OLDV && OLDV.hasVendor && OLDV.hasVendor()))
      return { available: false, ok: false, reason: "iztro unavailable" };
    const p = monthlyAt(input, target, { horoscopeDivide }),
      v = vendorMonthly(input, target, horoscopeDivide),
      a = primaryMonthlySnapshot(p),
      rows = [
        {
          id: "month.ganzhi",
          label: "流月干支",
          primary: [a.stem, a.branch],
          verifier: [v.stem, v.branch],
          status: eq([a.stem, a.branch], [v.stem, v.branch]) ? "PASS" : "DIFF",
        },
        {
          id: "month.life",
          label: "流月命宫",
          primary: a.indexPhysical,
          verifier: v.indexPhysical,
          status: a.indexPhysical === v.indexPhysical ? "PASS" : "DIFF",
        },
        {
          id: "month.palaces",
          label: "流月十二宫",
          primary: a.palaceNames,
          verifier: v.palaceNames,
          status: eq(a.palaceNames, v.palaceNames) ? "PASS" : "DIFF",
        },
        {
          id: "month.mutagen",
          label: "流月四化",
          primary: a.mutagen,
          verifier: v.mutagen,
          status: eq(a.mutagen, v.mutagen) ? "PASS" : "DIFF",
        },
        {
          id: "month.flow-stars",
          label: "流月魁钺昌曲禄羊陀马鸾喜",
          primary: a.stars,
          verifier: v.stars,
          status: eq(a.stars, v.stars) ? "PASS" : "DIFF",
        },
      ],
      counts = { PASS: 0, DIFF: 0 };
    rows.forEach((x) => counts[x.status]++);
    return {
      available: true,
      ok: counts.DIFF === 0,
      target: normalizeSolarDate(target),
      horoscopeDivide,
      counts,
      rows,
      raw: { primary: p, verifier: v },
    };
  }
  function suite104() {
    if (!(OLDV && OLDV.hasVendor && OLDV.hasVendor()))
      return { available: false, cases: [], summary: { PASS: 0, DIFF: 0 }, ok: false };
    const input = {
        lunar: { year: 2000, month: 7, day: 17, isLeap: false },
        hourBranchIndex: 2,
        gender: "F",
      },
      cases = [
        ["reference", "2023-08-19", "normal"],
        ["boundary-normal", "2025-02-02", "normal"],
        ["boundary-exact", "2025-02-02", "exact"],
        ["leap-first", "2023-04-05", "normal"],
        ["leap-second", "2023-04-06", "normal"],
      ],
      out = [],
      summary = { PASS: 0, DIFF: 0 };
    for (const [id, t, m] of cases) {
      try {
        const r = compareMonthly(input, t, m);
        out.push({ id, report: r });
        r.rows.forEach((x) => summary[x.status]++);
      } catch (e) {
        out.push({ id, error: String((e && e.message) || e) });
        summary.DIFF++;
      }
    }
    const r = {
      available: true,
      at: new Date().toISOString(),
      cases: out,
      summary,
      ok: summary.DIFF === 0,
    };
    V14STATE.lastSuite = r;
    renderV14();
    return r;
  }
  function liveV14() {
    const s = V14STATE.lastSuite,
      sum = (s && s.summary) || { PASS: 0, DIFF: 0 };
    return `<div class="panel blk tjzv14-live"><h4>目标日期流月层 · v104</h4><div class="tjzv3-stat"><span class="pass">PASS ${sum.PASS || 0}</span><span class="diff">DIFF ${sum.DIFF || 0}</span></div><div class="tjzv14-grid"><div class="tjzv14-card"><b>宫位基准</b><br>农历月推进<br>闰月十六日起视作下一月</div><div class="tjzv14-card"><b>月干支分界</b><br>normal · 农历月<br>exact · 十二节交节</div><div class="tjzv14-card"><b>已实现</b><br>流月十二宫 · 四化<br>10 月曜</div></div><div class="tjzv14-actions"><button class="gbtn sm" id="tjzv14Run" type="button">验证流月层</button></div></div>`;
  }
  function patchVerifyUI() {
    try {
      if (!window.REF_PANES || typeof REF_PANES.verify !== "function" || REF_PANES.verify.__v104)
        return;
      const old = REF_PANES.verify,
        oldBind = window.REF_BIND && REF_BIND.verify;
      const fn = () => liveV14() + old();
      fn.__v104 = true;
      REF_PANES.verify = fn;
      if (window.REF_BIND)
        REF_BIND.verify = function () {
          try {
            if (typeof oldBind === "function") oldBind();
          } catch (_) {}
          const r = document.getElementById("tjzv14Run");
          if (r)
            r.onclick = () => {
              if (OLDV && OLDV.hasVendor && OLDV.hasVendor()) suite104();
              else if (OLDV && OLDV.loadVendor) OLDV.loadVendor().then(() => suite104());
            };
        };
    } catch (e) {
      try {
        console.warn("[ZiweiVerify v104 UI]", e);
      } catch (_) {}
    }
  }
  function renderV14() {
    try {
      const p = document.getElementById("pane-verify");
      if (p && p.classList.contains("on") && typeof refRender === "function") refRender("verify");
    } catch (_) {}
  }
  const VERIFY104 = Object.freeze({
    version: "14.0.0",
    build: BUILD,
    state: V14STATE,
    compareMonthly,
    suite: suite104,
    compareYearly: OLDV && OLDV.compareYearly ? OLDV.compareYearly : null,
    loadVendor: OLDV && OLDV.loadVendor ? OLDV.loadVendor : async () => ({ status: "unavailable" }),
    hasVendor: () => !!(OLDV && OLDV.hasVendor && OLDV.hasVendor()),
    manifest: () => ({
      module: "Tianji Ziwei Verification Layer",
      version: "14.0.0",
      build: BUILD,
      baseline: "v104",
      vendor: "iztro 2.6.1",
      resolvedComparison: [
        "monthly stem/branch",
        "monthly life palace",
        "monthly 12 palaces",
        "monthly mutagens",
        "monthly flow stars",
        "leap-month day16 segmentation",
        "horoscopeDivide normal/exact",
      ],
      remainingGaps: manifest().remainingGaps,
    }),
  });
  window.TianjiZiweiVerifier = VERIFY104;
  patchVerifyUI();
  const prev = window.TianjiSystem || {};
  window.TianjiSystem = Object.freeze({
    version: "v104",
    build: BUILD,
    baseline: "v84",
    core: window.TianjiCore || prev.core || null,
    time: window.TianjiTime || prev.time || null,
    verify: window.TianjiVerifier || prev.verify || null,
    bazi: window.TianjiBazi || prev.bazi || null,
    baziVerify: window.TianjiBaziVerifier || prev.baziVerify || null,
    ziwei: API,
    ziweiVerify: VERIFY104,
    manifest: () => ({
      product: "天机盘",
      version: "v104",
      build: BUILD,
      baseline: "v84",
      ziwei: manifest(),
      ziweiVerify: VERIFY104.manifest(),
    }),
  });
  try {
    const bv = document.getElementById("buildVersion");

    window.dispatchEvent(new CustomEvent("tianji:ziwei-core-v104-ready", { detail: manifest() }));
  } catch (_) {}
})();
