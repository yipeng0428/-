(() => {
  "use strict";
  const BUILD = "2026-10-04 10:42:36",
    VERSION = "1.14.0",
    SCHEMA = "tianji.ziwei/1.14",
    CAPABILITY = "target-date-daily-flow-layer";
  const BASE = window.TianjiZiwei;
  if (
    !BASE ||
    typeof BASE.calculate !== "function" ||
    typeof BASE.monthlyAt !== "function" ||
    typeof BASE.horoscopeAt !== "function"
  ) {
    try {
      console.warn("[TianjiZiwei v105] v104 core unavailable");
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
    mod = (a, n) => ((a % n) + n) % n,
    pad = (n) => String(n).padStart(2, "0");
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
      if (!x) throw new Error("ZiweiCore v105: target date must be YYYY-MM-DD");
      y = +x[1];
      m = +x[2];
      d = +x[3];
    } else if (v && typeof v === "object") {
      y = +(v.year ?? v.y);
      m = +(v.month ?? v.m);
      d = +(v.day ?? v.d);
    }
    if (!Number.isInteger(y) || !Number.isInteger(m) || !Number.isInteger(d))
      throw new Error("ZiweiCore v105: invalid target solar date");
    const dt = new Date(Date.UTC(y, m - 1, d));
    if (dt.getUTCFullYear() !== y || dt.getUTCMonth() + 1 !== m || dt.getUTCDate() !== d)
      throw new Error("ZiweiCore v105: invalid Gregorian date");
    return { year: y, month: m, day: d, iso: `${String(y).padStart(4, "0")}-${pad(m)}-${pad(d)}` };
  }
  function targetLunar(s) {
    if (typeof window.solar2lunar !== "function")
      throw new Error("ZiweiCore v105: solar2lunar unavailable");
    const x = window.solar2lunar(s.year, s.month, s.day);
    return { year: +x.year, month: +x.month, day: +x.day, isLeap: !!x.isLeap };
  }
  function normalizeTargetMoment(v, options = {}) {
    const s = normalizeSolarDate(v);
    let h = 0,
      mi = 0,
      hasTime = false;
    if (v instanceof Date) {
      h = v.getHours();
      mi = v.getMinutes();
      hasTime = true;
    } else if (typeof v === "string") {
      const x = v.trim().match(/(?:[T\s])(\d{1,2})(?::(\d{1,2}))?/);
      if (x) {
        h = +x[1];
        mi = +(x[2] || 0);
        hasTime = true;
      }
    } else if (v && typeof v === "object" && (v.hour != null || v.h != null)) {
      h = +(v.hour ?? v.h ?? 0);
      mi = +(v.minute ?? v.mi ?? 0);
      hasTime = true;
    }
    if (!Number.isInteger(h) || h < 0 || h > 23 || !Number.isInteger(mi) || mi < 0 || mi > 59)
      throw new Error("ZiweiCore v105: invalid target clock time");
    let ti = options.timeIndex ?? options.timeIndexOfTarget;
    if (ti == null) ti = hasTime ? (h === 23 ? 12 : Math.floor((h + 1) / 2)) : 0;
    ti = Number(ti);
    if (!Number.isInteger(ti) || ti < 0 || ti > 12)
      throw new Error("ZiweiCore v105: target timeIndex must be 0..12");
    return {
      solar: s,
      hour: h,
      minute: mi,
      hasTime,
      timeIndex: ti,
      text: `${s.iso}${hasTime ? " " + pad(h) + ":" + pad(mi) : ""}`,
      timeSource:
        options.timeIndex != null || options.timeIndexOfTarget != null
          ? "explicit-timeIndex"
          : hasTime
            ? "clock"
            : "date-default-early-rat",
    };
  }
  function getDayDivide(options = {}) {
    const p = (BASE.getPolicy && BASE.getPolicy()) || {};
    return String(options.dayDivide || p.dayDivide || "forward") === "current"
      ? "current"
      : "forward";
  }
  function addSolarDays(s, n) {
    const dt = new Date(Date.UTC(s.year, s.month - 1, s.day + n));
    return {
      year: dt.getUTCFullYear(),
      month: dt.getUTCMonth() + 1,
      day: dt.getUTCDate(),
      iso: `${String(dt.getUTCFullYear()).padStart(4, "0")}-${pad(dt.getUTCMonth() + 1)}-${pad(dt.getUTCDate())}`,
    };
  }
  function effectiveSolarForDay(moment, dayDivide) {
    return moment.timeIndex === 12 && dayDivide === "forward"
      ? addSolarDays(moment.solar, 1)
      : clone(moment.solar);
  }
  function dayGanzhi(s) {
    if (typeof window.jdFromGreg !== "function")
      throw new Error("ZiweiCore v105: jdFromGreg unavailable");
    const jd = window.jdFromGreg(s.year, s.month, s.day, 12, 0, 0),
      dn = Math.floor(jd + 0.5 + 1e-9),
      idx = mod(dn + 49, 60),
      si = idx % 10,
      bi = idx % 12;
    return {
      index: idx,
      stemIndex: si,
      stem: GANS[si],
      branchIndex: bi,
      branch: ZHIS[bi],
      ganzhi: GANS[si] + ZHIS[bi],
      basis: "effective-civil-day",
    };
  }
  function normalizeChart(x) {
    return x && Array.isArray(x.palaces) ? x : BASE.calculate(x || {});
  }
  function flowPalaceName(flowBranch, b) {
    return PALACES[mod(flowBranch - b, 12)];
  }
  function dailyLifeBranch(monthly, lunarDay) {
    return mod(monthly.lifePalace.branchIndex + Number(lunarDay) - 1, 12);
  }
  function dailyStars(stem, branch) {
    const pos = {},
      put = (name, b, type) => {
        pos[name] = {
          name,
          branchIndex: mod(b, 12),
          branch: ZHIS[mod(b, 12)],
          type,
          scope: "daily",
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
    put("日魁", kuiYue[0], "soft");
    put("日钺", kuiYue[1], "soft");
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
    put("日昌", cq[0], "soft");
    put("日曲", cq[1], "soft");
    const lu = { 0: 2, 1: 3, 2: 5, 3: 6, 4: 5, 5: 6, 6: 8, 7: 9, 8: 11, 9: 0 }[stem];
    put("日禄", lu, "lucun");
    put("日羊", lu + 1, "tough");
    put("日陀", lu - 1, "tough");
    let ma;
    if ([2, 6, 10].includes(branch)) ma = 8;
    else if ([8, 0, 4].includes(branch)) ma = 2;
    else if ([5, 9, 1].includes(branch)) ma = 11;
    else ma = 5;
    put("日马", ma, "tianma");
    const luan = mod(3 - branch, 12);
    put("日鸾", luan, "flower");
    put("日喜", luan + 6, "flower");
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
  function dailyTransformations(chart, stem) {
    return SIHUA[stem].map((star, i) => {
      const loc = findStarBranch(chart, star);
      return {
        type: SIHUA_LABEL[i],
        star,
        branchIndex: loc ? loc.branchIndex : null,
        branch: loc ? loc.branch : null,
        natalPalace: loc ? loc.palace : null,
        scope: "daily",
      };
    });
  }
  function dailyAt(chartOrInput, target, options = {}) {
    const chart = normalizeChart(chartOrInput),
      moment = normalizeTargetMoment(target, options),
      dayDivide = getDayDivide(options),
      effectiveSolar = effectiveSolarForDay(moment, dayDivide),
      civilLunar = targetLunar(moment.solar),
      divide =
        String(
          options.horoscopeDivide ||
            (BASE.getHoroscopeDivide && BASE.getHoroscopeDivide()) ||
            "normal",
        ) === "exact"
          ? "exact"
          : "normal",
      monthly = BASE.monthlyAt(chart, moment.solar.iso, { horoscopeDivide: divide }),
      dg = dayGanzhi(effectiveSolar),
      life = dailyLifeBranch(monthly, civilLunar.day),
      stars = dailyStars(dg.stemIndex, dg.branchIndex),
      trans = dailyTransformations(chart, dg.stemIndex),
      byBranch = {};
    (chart.palaces || []).forEach((p) => (byBranch[p.branchIndex] = p));
    const palaces = ZHIS.map((branch, b) => {
      const p = byBranch[b] || {};
      return {
        branchIndex: b,
        branch,
        natalPalaceName: p.name || "",
        dailyPalaceName: flowPalaceName(life, b),
        isDailyLifePalace: b === life,
        flowStars: clone(stars.byBranch[b]),
        transformations: trans.filter((x) => x.branchIndex === b),
      };
    });
    return {
      target: {
        input: moment.text,
        solar: clone(moment.solar),
        effectiveSolar: clone(effectiveSolar),
        lunar: civilLunar,
        hour: moment.hour,
        minute: moment.minute,
        timeIndex: moment.timeIndex,
        timeSource: moment.timeSource,
      },
      scope: "daily",
      parentMonth: { month: clone(monthly.month), lifePalace: clone(monthly.lifePalace) },
      boundary: {
        dayDivide,
        dayDivideLabel: dayDivide === "forward" ? "晚子时归次日" : "晚子时归当日",
        dateShifted: moment.timeIndex === 12 && dayDivide === "forward",
        ganzhiDate: effectiveSolar.iso,
        palaceDate: moment.solar.iso,
        note: "日干支按 dayDivide 处理晚子时；流日命宫按目标民用农历日序从流月命宫推进，与 iztro 运限规则保持同层口径。",
      },
      day: {
        index: dg.index,
        stemIndex: dg.stemIndex,
        stem: dg.stem,
        branchIndex: dg.branchIndex,
        branch: dg.branch,
        ganzhi: dg.ganzhi,
        civilSolarDate: moment.solar.iso,
        effectiveSolarDate: effectiveSolar.iso,
        lunarDay: civilLunar.day,
      },
      lifePalace: { branchIndex: life, branch: ZHIS[life], name: "流日命宫" },
      palaces,
      transformations: trans,
      flowStars: stars,
      doctrine: clone(chart.doctrine || null),
      astroType: clone(chart.astroType || null),
      policy: {
        dayDivide,
        horoscopeDivide: divide,
        dailyPalaceRule: "流月命宫 + 目标农历日 - 1",
        dayGanzhiRule:
          dayDivide === "forward"
            ? "晚子时（timeIndex=12）日干支归次日"
            : "晚子时（timeIndex=12）日干支归当日",
        flowStarRule: "魁钺昌曲禄羊陀马鸾喜",
        fourTransformations: "流日天干四化",
      },
    };
  }
  function horoscopeAt(chartOrInput, target, options = {}) {
    const base = BASE.horoscopeAt(chartOrInput, target, options),
      daily = dailyAt(chartOrInput, target, options),
      flow = Object.assign({}, clone(base.flow || {}), { daily: clone(daily) });
    return Object.assign({}, clone(base), {
      daily,
      flow,
      summary: Object.assign({}, clone(base.summary || {}), {
        dailyGanzhi: daily.day.ganzhi,
        dailyLifePalace: daily.lifePalace.branch,
        dayDivide: daily.boundary.dayDivide,
      }),
    });
  }
  function setDayDivide(mode) {
    mode = String(mode);
    if (mode !== "current" && mode !== "forward")
      throw new Error("ZiweiCore v105: dayDivide must be current or forward");
    if (typeof BASE.setPolicy !== "function")
      throw new Error("ZiweiCore v105: setPolicy unavailable");
    return BASE.setPolicy({ dayDivide: mode });
  }
  function getDayDivideValue() {
    return getDayDivide({});
  }
  function calculate(input = {}) {
    const out = clone(BASE.calculate(input));
    out.schema = SCHEMA;
    out.version = VERSION;
    out.build = BUILD;
    out.capability = CAPABILITY;
    out.coverage = Object.assign({}, out.coverage || {}, {
      dailyFlow: true,
      dailyPalaces: true,
      dailyMutagens: true,
      dailyFlowStars: true,
      dailyLateRatBoundary: true,
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
      dailyFlow: true,
      dailyPalaces: true,
      dailyMutagens: true,
      dailyFlowStars: true,
      dailyLateRatBoundary: true,
    });
    return out;
  }
  function starNamesAt(d, b) {
    return (d.palaces[b].flowStars || [])
      .map((s) => s.name)
      .sort((a, b) => a.localeCompare(b, "zh-CN"));
  }
  function selfTest() {
    const checks = [];
    try {
      const b = BASE.selfTest && BASE.selfTest();
      checks.push({ id: "v104.base", ok: !b || b.ok !== false });
    } catch (e) {
      checks.push({ id: "v104.base", ok: false, error: String((e && e.message) || e) });
    }
    const birth = {
      lunar: { year: 2000, month: 7, day: 17, isLeap: false },
      hourBranchIndex: 2,
      gender: "F",
    };
    try {
      const d = dailyAt(birth, "2023-08-19 03:12", {
        horoscopeDivide: "normal",
        dayDivide: "current",
      });
      checks.push({
        id: "daily.reference-ganzhi-life",
        ok: d.day.ganzhi === "己酉" && d.lifePalace.branch === "申",
      });
      checks.push({
        id: "daily.palace-names",
        ok:
          d.palaces[8].dailyPalaceName === "命宫" &&
          d.palaces[7].dailyPalaceName === "兄弟" &&
          d.palaces[9].dailyPalaceName === "父母",
      });
      checks.push({
        id: "daily.mutagens",
        ok:
          JSON.stringify(d.transformations.map((x) => x.type + ":" + x.star)) ===
          JSON.stringify(["禄:武曲", "权:贪狼", "科:天梁", "忌:文曲"]),
      });
      checks.push({
        id: "daily.flow-stars",
        ok:
          starNamesAt(d, 0).includes("日魁") &&
          starNamesAt(d, 0).includes("日喜") &&
          starNamesAt(d, 5).includes("日曲") &&
          starNamesAt(d, 5).includes("日陀") &&
          starNamesAt(d, 6).includes("日禄") &&
          starNamesAt(d, 6).includes("日鸾") &&
          starNamesAt(d, 7).includes("日羊") &&
          starNamesAt(d, 8).includes("日钺") &&
          starNamesAt(d, 9).includes("日昌") &&
          starNamesAt(d, 11).includes("日马"),
      });
    } catch (e) {
      checks.push({ id: "daily.reference-suite", ok: false, error: String((e && e.message) || e) });
    }
    try {
      const c = dailyAt(birth, "2025-06-10 23:30", { dayDivide: "current" }),
        f = dailyAt(birth, "2025-06-10 23:30", { dayDivide: "forward" });
      checks.push({
        id: "late-rat.current-forward",
        ok:
          c.day.ganzhi === "庚戌" &&
          f.day.ganzhi === "辛亥" &&
          c.boundary.dateShifted === false &&
          f.boundary.dateShifted === true,
      });
      checks.push({
        id: "late-rat.palace-stable",
        ok:
          c.lifePalace.branchIndex === f.lifePalace.branchIndex &&
          c.target.lunar.day === f.target.lunar.day,
      });
    } catch (e) {
      checks.push({ id: "late-rat-suite", ok: false, error: String((e && e.message) || e) });
    }
    try {
      const h = horoscopeAt(birth, "2023-08-19 03:12", { dayDivide: "current" });
      checks.push({
        id: "combined.horoscopeAt",
        ok: !!(
          h.yearly &&
          h.monthly &&
          h.daily &&
          h.flow &&
          h.flow.daily &&
          h.daily.day.ganzhi === "己酉"
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
      baseline: "v104",
      capability: CAPABILITY,
      selfTest: clone(TEST),
      coverage: {
        dailyFlow: true,
        dailyPalaces: true,
        dailyMutagens: true,
        dailyFlowStars: true,
        dailyLateRatBoundary: true,
      },
      remainingGaps: ["流时层", "流日列表 API"],
      references: [
        {
          name: "SylarLong/iztro",
          version: "2.6.1",
          tagCommit: "b78dfe391f65e938d79f2419dddb80f74c6bbb8e",
          license: "MIT",
          files: [
            "src/astro/FunctionalAstrolabe.ts#horoscope-daily",
            "src/star/horoscopeStar.ts",
            "src/utils/index.ts#fixLunarDayIndex",
            "src/__tests__/astro/astro.test.ts#late-rat-hour-day-divider",
          ],
          role: "daily flow deterministic rule cross-check",
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
    monthlyAt: BASE.monthlyAt,
    flowMonthAt: BASE.flowMonthAt || BASE.monthlyAt,
    dailyAt,
    flowDayAt: dailyAt,
    horoscopeAt,
    setDayDivide,
    getDayDivide: getDayDivideValue,
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
        id: "tianji-v105-ziwei-daily-flow",
        type: "internal",
        title: "Tianji Ziwei Core 1.14 Target-Date Daily Flow Layer",
        version: VERSION,
        baseline: "v104",
      });
      TianjiCore.registerSource({
        id: "iztro-2.6.1-daily-flow-reference",
        type: "third-party-reference",
        title: "SylarLong/iztro v2.6.1 daily horoscope reference",
        version: "2.6.1",
        license: "MIT",
        repository: "SylarLong/iztro",
        commit: "b78dfe391f65e938d79f2419dddb80f74c6bbb8e",
        role: "rule-reference",
      });
      TianjiCore.registerEngine(
        {
          id: "ziwei.core.v1.14",
          system: "ziwei",
          name: "Tianji Ziwei Core 1.14",
          version: VERSION,
          source: "tianji-v105-ziwei-daily-flow",
          doctrine: "target-date daily palace/mutagen/flow-star with late-rat day boundary",
          status: "active",
        },
        (input) => calculate(input || {}),
      );
    }
  } catch (e) {
    try {
      console.warn("[TianjiZiwei v105] registry", e);
    } catch (_) {}
  }
  try {
    const old =
      document.getElementById("tjZiweiV14Badge") || document.getElementById("buildVersion");
    let b = document.getElementById("tjZiweiV15Badge");
    if (!b && old) {
      b = document.createElement("span");
      b.id = "tjZiweiV15Badge";
      old.insertAdjacentElement("afterend", b);
    }
    if (b) {
      b.textContent = "ZiweiCore 1.14 · 流日";
      b.classList.toggle("warn", !TEST.ok);
      b.title = TEST.ok
        ? "v105：流日十二宫 / 四化 / 日曜 / 晚子时日界通过回归"
        : "v105 流日层自检失败；v104 保持可回退";
      b.dataset.selftest = TEST.ok ? "PASS" : "FAIL";
      b.dataset.checks =
        String(TEST.checks.filter((x) => x.ok).length) + "/" + String(TEST.checks.length);
    }
  } catch (_) {}
  /* ---- v105-aware iztro daily verifier ---- */
  const OLDV = window.TianjiZiweiVerifier,
    V15STATE = { lastSuite: null };
  function eq(a, b) {
    return JSON.stringify(a) === JSON.stringify(b);
  }
  function vendorDaily(input, target, options = {}) {
    if (!(window.iztro && iztro.astro && iztro.astro.byLunar)) throw new Error("iztro unavailable");
    const astro = iztro.astro,
      l = input.lunar,
      g = input.gender === "F" ? "女" : "男",
      h = Number(input.timeIndex ?? input.hourBranchIndex ?? 0),
      doctrine = input.ziweiDoctrine || {},
      algorithm = doctrine.algorithm || "default",
      horoscopeDivide =
        String(
          options.horoscopeDivide ||
            (BASE.getHoroscopeDivide && BASE.getHoroscopeDivide()) ||
            "normal",
        ) === "exact"
          ? "exact"
          : "normal",
      dayDivide =
        String(options.dayDivide || getDayDivideValue()) === "current" ? "current" : "forward",
      moment = normalizeTargetMoment(target, options),
      old = astro.getConfig ? astro.getConfig() : {};
    try {
      if (astro.config) astro.config({ algorithm, horoscopeDivide, dayDivide });
      const v = astro.byLunar(`${l.year}-${l.month}-${l.day}`, h, g, !!l.isLeap, true, "zh-CN"),
        targetText = moment.hasTime
          ? `${moment.solar.iso} ${pad(moment.hour)}:${pad(moment.minute)}`
          : moment.solar.iso,
        hor = v.horoscope(targetText, moment.timeIndex),
        d = (hor && hor.daily) || {},
        pal = d.palaceNames || [],
        stars = d.stars || [],
        toBranchArray = (a) => {
          const out = Array(12);
          (a || []).forEach((x, i) => (out[mod(i + 2, 12)] = x));
          return out;
        };
      return {
        indexPhysical: mod(Number(d.index) + 2, 12),
        stem: d.heavenlyStem,
        branch: d.earthlyBranch,
        palaceNames: toBranchArray(pal),
        mutagen: (d.mutagen || []).slice(),
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
  function primaryDailySnapshot(d) {
    return {
      indexPhysical: d.lifePalace.branchIndex,
      stem: d.day.stem,
      branch: d.day.branch,
      palaceNames: d.palaces.map((p) => p.dailyPalaceName),
      mutagen: d.transformations.map((x) => x.star),
      stars: d.palaces.map((p) =>
        (p.flowStars || []).map((s) => s.name).sort((a, b) => a.localeCompare(b, "zh-CN")),
      ),
    };
  }
  function compareDaily(input, target, options = {}) {
    if (!(OLDV && OLDV.hasVendor && OLDV.hasVendor()))
      return { available: false, ok: false, reason: "iztro unavailable" };
    const p = dailyAt(input, target, options),
      v = vendorDaily(input, target, options),
      a = primaryDailySnapshot(p),
      rows = [
        {
          id: "day.ganzhi",
          label: "流日干支",
          primary: [a.stem, a.branch],
          verifier: [v.stem, v.branch],
          status: eq([a.stem, a.branch], [v.stem, v.branch]) ? "PASS" : "DIFF",
        },
        {
          id: "day.life",
          label: "流日命宫",
          primary: a.indexPhysical,
          verifier: v.indexPhysical,
          status: a.indexPhysical === v.indexPhysical ? "PASS" : "DIFF",
        },
        {
          id: "day.palaces",
          label: "流日十二宫",
          primary: a.palaceNames,
          verifier: v.palaceNames,
          status: eq(a.palaceNames, v.palaceNames) ? "PASS" : "DIFF",
        },
        {
          id: "day.mutagen",
          label: "流日四化",
          primary: a.mutagen,
          verifier: v.mutagen,
          status: eq(a.mutagen, v.mutagen) ? "PASS" : "DIFF",
        },
        {
          id: "day.flow-stars",
          label: "流日魁钺昌曲禄羊陀马鸾喜",
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
      target: normalizeTargetMoment(target, options),
      dayDivide: getDayDivide(options),
      counts,
      rows,
      raw: { primary: p, verifier: v },
    };
  }
  function suite105() {
    if (!(OLDV && OLDV.hasVendor && OLDV.hasVendor()))
      return { available: false, cases: [], summary: { PASS: 0, DIFF: 0 }, ok: false };
    const input = {
        lunar: { year: 2000, month: 7, day: 17, isLeap: false },
        hourBranchIndex: 2,
        gender: "F",
      },
      cases = [
        ["reference", "2023-08-19 03:12", { dayDivide: "current" }],
        ["late-current", "2025-06-10 23:30", { dayDivide: "current", timeIndex: 12 }],
        ["late-forward", "2025-06-10 23:30", { dayDivide: "forward", timeIndex: 12 }],
      ],
      out = [],
      summary = { PASS: 0, DIFF: 0 };
    for (const [id, t, o] of cases) {
      try {
        const r = compareDaily(input, t, o);
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
    V15STATE.lastSuite = r;
    renderV15();
    return r;
  }
  function liveV15() {
    const s = V15STATE.lastSuite,
      sum = (s && s.summary) || { PASS: 0, DIFF: 0 },
      dd = getDayDivideValue();
    return `<div class="panel blk tjzv15-live"><h4>目标日期流日层 · v105</h4><div class="tjzv3-stat"><span class="pass">PASS ${sum.PASS || 0}</span><span class="diff">DIFF ${sum.DIFF || 0}</span></div><div class="tjzv15-grid"><div class="tjzv15-card"><b>流日宫位</b><br>流月命宫 + 农历日 - 1</div><div class="tjzv15-card"><b>日界口径</b><br>${dd === "forward" ? "forward · 晚子时归次日" : "current · 晚子时归当日"}<br>可通过 setDayDivide() 切换</div><div class="tjzv15-card"><b>已实现</b><br>流日十二宫 · 四化<br>10 日曜</div></div><div class="tjzv15-actions"><button class="gbtn sm" id="tjzv15Run" type="button">验证流日层</button></div></div>`;
  }
  function patchVerifyUI() {
    try {
      if (!window.REF_PANES || typeof REF_PANES.verify !== "function" || REF_PANES.verify.__v105)
        return;
      const old = REF_PANES.verify,
        oldBind = window.REF_BIND && REF_BIND.verify;
      const fn = () => liveV15() + old();
      fn.__v105 = true;
      REF_PANES.verify = fn;
      if (window.REF_BIND)
        REF_BIND.verify = function () {
          try {
            if (typeof oldBind === "function") oldBind();
          } catch (_) {}
          const r = document.getElementById("tjzv15Run");
          if (r)
            r.onclick = () => {
              if (OLDV && OLDV.hasVendor && OLDV.hasVendor()) suite105();
              else if (OLDV && OLDV.loadVendor) OLDV.loadVendor().then(() => suite105());
            };
        };
    } catch (e) {
      try {
        console.warn("[ZiweiVerify v105 UI]", e);
      } catch (_) {}
    }
  }
  function renderV15() {
    try {
      const p = document.getElementById("pane-verify");
      if (p && p.classList.contains("on") && typeof refRender === "function") refRender("verify");
    } catch (_) {}
  }
  const VERIFY105 = Object.freeze({
    version: "15.0.0",
    build: BUILD,
    state: V15STATE,
    compareDaily,
    suite: suite105,
    compareMonthly: OLDV && OLDV.compareMonthly ? OLDV.compareMonthly : null,
    compareYearly: OLDV && OLDV.compareYearly ? OLDV.compareYearly : null,
    loadVendor: OLDV && OLDV.loadVendor ? OLDV.loadVendor : async () => ({ status: "unavailable" }),
    hasVendor: () => !!(OLDV && OLDV.hasVendor && OLDV.hasVendor()),
    manifest: () => ({
      module: "Tianji Ziwei Verification Layer",
      version: "15.0.0",
      build: BUILD,
      baseline: "v105",
      vendor: "iztro 2.6.1",
      resolvedComparison: [
        "daily stem/branch",
        "daily life palace",
        "daily 12 palaces",
        "daily mutagens",
        "daily flow stars",
        "late-rat dayDivide current/forward",
      ],
      remainingGaps: manifest().remainingGaps,
    }),
  });
  window.TianjiZiweiVerifier = VERIFY105;
  patchVerifyUI();
  const prev = window.TianjiSystem || {};
  window.TianjiSystem = Object.freeze({
    version: "v105",
    build: BUILD,
    baseline: "v84",
    core: window.TianjiCore || prev.core || null,
    time: window.TianjiTime || prev.time || null,
    verify: window.TianjiVerifier || prev.verify || null,
    bazi: window.TianjiBazi || prev.bazi || null,
    baziVerify: window.TianjiBaziVerifier || prev.baziVerify || null,
    ziwei: API,
    ziweiVerify: VERIFY105,
    manifest: () => ({
      product: "天机盘",
      version: "v105",
      build: BUILD,
      baseline: "v84",
      ziwei: manifest(),
      ziweiVerify: VERIFY105.manifest(),
    }),
  });
  try {
    const bv = document.getElementById("buildVersion");

    window.dispatchEvent(new CustomEvent("tianji:ziwei-core-v105-ready", { detail: manifest() }));
  } catch (_) {}
})();
