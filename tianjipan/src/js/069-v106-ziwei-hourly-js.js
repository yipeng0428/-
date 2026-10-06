(() => {
  "use strict";
  const BUILD = "2026-10-04 10:54:00",
    VERSION = "1.15.0",
    SCHEMA = "tianji.ziwei/1.15",
    CAPABILITY = "target-date-hourly-flow-layer";
  const BASE = window.TianjiZiwei;
  if (
    !BASE ||
    typeof BASE.calculate !== "function" ||
    typeof BASE.dailyAt !== "function" ||
    typeof BASE.horoscopeAt !== "function"
  ) {
    try {
      console.warn("[TianjiZiwei v106] v105 core unavailable");
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
  function normalizeChart(x) {
    return x && Array.isArray(x.palaces) ? x : BASE.calculate(x || {});
  }
  function normalizeTargetMoment(v, options = {}) {
    let y,
      m,
      d,
      h = 0,
      mi = 0,
      hasTime = false;
    if (v instanceof Date) {
      y = v.getFullYear();
      m = v.getMonth() + 1;
      d = v.getDate();
      h = v.getHours();
      mi = v.getMinutes();
      hasTime = true;
    } else if (typeof v === "string") {
      const s = v.trim(),
        x = s.match(/^(\d{4})[-\/.](\d{1,2})[-\/.](\d{1,2})/);
      if (!x) throw new Error("ZiweiCore v106: target date must be YYYY-MM-DD");
      y = +x[1];
      m = +x[2];
      d = +x[3];
      const t = s.match(/(?:[T\s])(\d{1,2})(?::(\d{1,2}))?/);
      if (t) {
        h = +t[1];
        mi = +(t[2] || 0);
        hasTime = true;
      }
    } else if (v && typeof v === "object") {
      y = +(v.year ?? v.y);
      m = +(v.month ?? v.m);
      d = +(v.day ?? v.d);
      if (v.hour != null || v.h != null) {
        h = +(v.hour ?? v.h ?? 0);
        mi = +(v.minute ?? v.mi ?? 0);
        hasTime = true;
      }
    }
    if (!Number.isInteger(y) || !Number.isInteger(m) || !Number.isInteger(d))
      throw new Error("ZiweiCore v106: invalid target solar date");
    const dt = new Date(Date.UTC(y, m - 1, d));
    if (dt.getUTCFullYear() !== y || dt.getUTCMonth() + 1 !== m || dt.getUTCDate() !== d)
      throw new Error("ZiweiCore v106: invalid Gregorian date");
    if (!Number.isInteger(h) || h < 0 || h > 23 || !Number.isInteger(mi) || mi < 0 || mi > 59)
      throw new Error("ZiweiCore v106: invalid target clock time");
    let ti = options.timeIndex ?? options.timeIndexOfTarget;
    if (ti == null) ti = hasTime ? (h === 23 ? 12 : Math.floor((h + 1) / 2)) : 0;
    ti = Number(ti);
    if (!Number.isInteger(ti) || ti < 0 || ti > 12)
      throw new Error("ZiweiCore v106: target timeIndex must be 0..12");
    const iso = `${String(y).padStart(4, "0")}-${pad(m)}-${pad(d)}`;
    return {
      solar: { year: y, month: m, day: d, iso },
      hour: h,
      minute: mi,
      hasTime,
      timeIndex: ti,
      text: `${iso}${hasTime ? " " + pad(h) + ":" + pad(mi) : ""}`,
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
    return String(
      options.dayDivide || (BASE.getDayDivide && BASE.getDayDivide()) || p.dayDivide || "forward",
    ) === "current"
      ? "current"
      : "forward";
  }
  function flowPalaceName(flowBranch, b) {
    return PALACES[mod(flowBranch - b, 12)];
  }
  function hourGanzhi(dayStemIndex, timeIndex) {
    const branchIndex = mod(Number(timeIndex), 12),
      stemIndex = mod(Number(dayStemIndex) * 2 + branchIndex, 10);
    return {
      stemIndex,
      stem: GANS[stemIndex],
      branchIndex,
      branch: ZHIS[branchIndex],
      ganzhi: GANS[stemIndex] + ZHIS[branchIndex],
      rule: "五鼠遁：时干=(日干序×2+时支序) mod 10",
    };
  }
  function hourlyLifeBranch(daily, timeIndex) {
    return mod(daily.lifePalace.branchIndex + mod(Number(timeIndex), 12), 12);
  }
  function hourlyStars(stem, branch) {
    const pos = {},
      put = (name, b, type) => {
        pos[name] = {
          name,
          branchIndex: mod(b, 12),
          branch: ZHIS[mod(b, 12)],
          type,
          scope: "hourly",
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
    put("时魁", kuiYue[0], "soft");
    put("时钺", kuiYue[1], "soft");
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
    put("时昌", cq[0], "soft");
    put("时曲", cq[1], "soft");
    const lu = { 0: 2, 1: 3, 2: 5, 3: 6, 4: 5, 5: 6, 6: 8, 7: 9, 8: 11, 9: 0 }[stem];
    put("时禄", lu, "lucun");
    put("时羊", lu + 1, "tough");
    put("时陀", lu - 1, "tough");
    let ma;
    if ([2, 6, 10].includes(branch)) ma = 8;
    else if ([8, 0, 4].includes(branch)) ma = 2;
    else if ([5, 9, 1].includes(branch)) ma = 11;
    else ma = 5;
    put("时马", ma, "tianma");
    const luan = mod(3 - branch, 12);
    put("时鸾", luan, "flower");
    put("时喜", luan + 6, "flower");
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
  function hourlyTransformations(chart, stem) {
    return SIHUA[stem].map((star, i) => {
      const loc = findStarBranch(chart, star);
      return {
        type: SIHUA_LABEL[i],
        star,
        branchIndex: loc ? loc.branchIndex : null,
        branch: loc ? loc.branch : null,
        natalPalace: loc ? loc.palace : null,
        scope: "hourly",
      };
    });
  }
  function hourlyAt(chartOrInput, target, options = {}) {
    const chart = normalizeChart(chartOrInput),
      moment = normalizeTargetMoment(target, options),
      dayDivide = getDayDivide(options),
      daily = BASE.dailyAt(
        chart,
        target,
        Object.assign({}, options, { timeIndex: moment.timeIndex, dayDivide }),
      ),
      hg = hourGanzhi(daily.day.stemIndex, moment.timeIndex),
      life = hourlyLifeBranch(daily, moment.timeIndex),
      stars = hourlyStars(hg.stemIndex, hg.branchIndex),
      trans = hourlyTransformations(chart, hg.stemIndex),
      byBranch = {};
    (chart.palaces || []).forEach((p) => (byBranch[p.branchIndex] = p));
    const palaces = ZHIS.map((branch, b) => {
      const p = byBranch[b] || {};
      return {
        branchIndex: b,
        branch,
        natalPalaceName: p.name || "",
        hourlyPalaceName: flowPalaceName(life, b),
        isHourlyLifePalace: b === life,
        flowStars: clone(stars.byBranch[b]),
        transformations: trans.filter((x) => x.branchIndex === b),
      };
    });
    return {
      target: {
        input: moment.text,
        solar: clone(moment.solar),
        hour: moment.hour,
        minute: moment.minute,
        timeIndex: moment.timeIndex,
        timeSource: moment.timeSource,
      },
      scope: "hourly",
      parentDay: {
        day: clone(daily.day),
        lifePalace: clone(daily.lifePalace),
        boundary: clone(daily.boundary),
      },
      boundary: {
        dayDivide,
        lateRat: moment.timeIndex === 12,
        dateBasis:
          daily.day.effectiveSolarDate ||
          (daily.boundary && daily.boundary.ganzhiDate) ||
          moment.solar.iso,
        note:
          moment.timeIndex === 12
            ? dayDivide === "forward"
              ? "晚子时先按次日日干，再以子时起时干；流时命宫仍以流日命宫 + 子支序(0)定位。"
              : "晚子时保留当日日干，以子时起时干；流时命宫以流日命宫 + 子支序(0)定位。"
            : "普通时辰以当前流日日干配当前时支。",
      },
      hour: {
        stemIndex: hg.stemIndex,
        stem: hg.stem,
        branchIndex: hg.branchIndex,
        branch: hg.branch,
        ganzhi: hg.ganzhi,
        timeIndex: moment.timeIndex,
        rule: hg.rule,
      },
      lifePalace: { branchIndex: life, branch: ZHIS[life], name: "流时命宫" },
      palaces,
      transformations: trans,
      flowStars: stars,
      doctrine: clone(chart.doctrine || null),
      astroType: clone(chart.astroType || null),
      policy: {
        dayDivide,
        hourlyPalaceRule: "流日命宫 + 目标时支序号",
        hourGanzhiRule: "五鼠遁；晚子时先按 dayDivide 确定所用日干",
        flowStarRule: "魁钺昌曲禄羊陀马鸾喜",
        fourTransformations: "流时天干四化",
      },
    };
  }
  function horoscopeAt(chartOrInput, target, options = {}) {
    const base = BASE.horoscopeAt(chartOrInput, target, options),
      hourly = hourlyAt(chartOrInput, target, options),
      flow = Object.assign({}, clone(base.flow || {}), { hourly: clone(hourly) });
    return Object.assign({}, clone(base), {
      hourly,
      flow,
      summary: Object.assign({}, clone(base.summary || {}), {
        hourlyGanzhi: hourly.hour.ganzhi,
        hourlyLifePalace: hourly.lifePalace.branch,
        hourTimeIndex: hourly.hour.timeIndex,
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
      hourlyFlow: true,
      hourlyPalaces: true,
      hourlyMutagens: true,
      hourlyFlowStars: true,
      hourlyLateRatLink: true,
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
      hourlyFlow: true,
      hourlyPalaces: true,
      hourlyMutagens: true,
      hourlyFlowStars: true,
      hourlyLateRatLink: true,
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
      checks.push({ id: "v105.base", ok: !b || b.ok !== false });
    } catch (e) {
      checks.push({ id: "v105.base", ok: false, error: String((e && e.message) || e) });
    }
    const birth = {
      lunar: { year: 2000, month: 7, day: 17, isLeap: false },
      hourBranchIndex: 2,
      gender: "F",
    };
    try {
      const h = hourlyAt(birth, "2023-08-19 03:12", { dayDivide: "current" });
      checks.push({
        id: "hourly.reference-ganzhi-life",
        ok: h.hour.ganzhi === "丙寅" && h.lifePalace.branch === "戌",
      });
      checks.push({
        id: "hourly.palace-names",
        ok:
          h.palaces[10].hourlyPalaceName === "命宫" &&
          h.palaces[9].hourlyPalaceName === "兄弟" &&
          h.palaces[11].hourlyPalaceName === "父母",
      });
      checks.push({
        id: "hourly.mutagens",
        ok:
          JSON.stringify(h.transformations.map((x) => x.type + ":" + x.star)) ===
          JSON.stringify(["禄:天同", "权:天机", "科:文昌", "忌:廉贞"]),
      });
      checks.push({
        id: "hourly.flow-stars",
        ok:
          starNamesAt(h, 11).includes("时魁") &&
          starNamesAt(h, 9).includes("时钺") &&
          starNamesAt(h, 8).includes("时昌") &&
          starNamesAt(h, 8).includes("时马") &&
          starNamesAt(h, 6).includes("时曲") &&
          starNamesAt(h, 6).includes("时羊") &&
          starNamesAt(h, 5).includes("时禄") &&
          starNamesAt(h, 4).includes("时陀") &&
          starNamesAt(h, 1).includes("时鸾") &&
          starNamesAt(h, 7).includes("时喜"),
      });
    } catch (e) {
      checks.push({
        id: "hourly.reference-suite",
        ok: false,
        error: String((e && e.message) || e),
      });
    }
    try {
      const c = hourlyAt(birth, "2025-06-10 23:30", { dayDivide: "current", timeIndex: 12 }),
        f = hourlyAt(birth, "2025-06-10 23:30", { dayDivide: "forward", timeIndex: 12 });
      checks.push({
        id: "late-rat.hour-stem-link",
        ok:
          c.parentDay.day.ganzhi === "庚戌" &&
          f.parentDay.day.ganzhi === "辛亥" &&
          c.hour.ganzhi === "丙子" &&
          f.hour.ganzhi === "戊子",
      });
      checks.push({
        id: "late-rat.hour-life-stable",
        ok:
          c.lifePalace.branchIndex === f.lifePalace.branchIndex &&
          c.hour.branch === "子" &&
          f.hour.branch === "子",
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
          h.hourly &&
          h.flow &&
          h.flow.hourly &&
          h.hourly.hour.ganzhi === "丙寅"
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
      baseline: "v105",
      capability: CAPABILITY,
      selfTest: clone(TEST),
      coverage: {
        hourlyFlow: true,
        hourlyPalaces: true,
        hourlyMutagens: true,
        hourlyFlowStars: true,
        hourlyLateRatLink: true,
      },
      remainingGaps: ["流日/流时列表 API", "流分/流秒（暂不实现）"],
      references: [
        {
          name: "SylarLong/iztro",
          version: "2.6.1",
          tagCommit: "b78dfe391f65e938d79f2419dddb80f74c6bbb8e",
          license: "MIT",
          files: [
            "src/astro/FunctionalAstrolabe.ts#hourlyIndex",
            "src/star/horoscopeStar.ts#hourly",
            "src/__tests__/astro/astro.test.ts#hourly-and-late-rat",
          ],
          role: "hourly flow deterministic rule cross-check",
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
    dailyAt: BASE.dailyAt,
    flowDayAt: BASE.flowDayAt || BASE.dailyAt,
    hourlyAt,
    flowHourAt: hourlyAt,
    horoscopeAt,
    setDayDivide: BASE.setDayDivide,
    getDayDivide: BASE.getDayDivide,
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
        id: "tianji-v106-ziwei-hourly-flow",
        type: "internal",
        title: "Tianji Ziwei Core 1.15 Target-Date Hourly Flow Layer",
        version: VERSION,
        baseline: "v105",
      });
      TianjiCore.registerSource({
        id: "iztro-2.6.1-hourly-flow-reference",
        type: "third-party-reference",
        title: "SylarLong/iztro v2.6.1 hourly horoscope reference",
        version: "2.6.1",
        license: "MIT",
        repository: "SylarLong/iztro",
        commit: "b78dfe391f65e938d79f2419dddb80f74c6bbb8e",
        role: "rule-reference",
      });
      TianjiCore.registerEngine(
        {
          id: "ziwei.core.v1.15",
          system: "ziwei",
          name: "Tianji Ziwei Core 1.15",
          version: VERSION,
          source: "tianji-v106-ziwei-hourly-flow",
          doctrine:
            "target-date hourly palace/mutagen/flow-star with late-rat day boundary linkage",
          status: "active",
        },
        (input) => calculate(input || {}),
      );
    }
  } catch (e) {
    try {
      console.warn("[TianjiZiwei v106] registry", e);
    } catch (_) {}
  }
  try {
    const old =
      document.getElementById("tjZiweiV15Badge") || document.getElementById("buildVersion");
    let b = document.getElementById("tjZiweiV16Badge");
    if (!b && old) {
      b = document.createElement("span");
      b.id = "tjZiweiV16Badge";
      old.insertAdjacentElement("afterend", b);
    }
    if (b) {
      b.textContent = "ZiweiCore 1.15 · 流时";
      b.classList.toggle("warn", !TEST.ok);
      b.title = TEST.ok
        ? "v106：流时十二宫 / 四化 / 时曜 / 晚子时联动通过回归"
        : "v106 流时层自检失败；v105 保持可回退";
      b.dataset.selftest = TEST.ok ? "PASS" : "FAIL";
      b.dataset.checks =
        String(TEST.checks.filter((x) => x.ok).length) + "/" + String(TEST.checks.length);
    }
  } catch (_) {}
  /* ---- v106-aware iztro hourly verifier ---- */
  const OLDV = window.TianjiZiweiVerifier,
    V16STATE = { lastSuite: null };
  function eq(a, b) {
    return JSON.stringify(a) === JSON.stringify(b);
  }
  function vendorHourly(input, target, options = {}) {
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
        String(options.dayDivide || (BASE.getDayDivide && BASE.getDayDivide()) || "forward") ===
        "current"
          ? "current"
          : "forward",
      moment = normalizeTargetMoment(target, options),
      old = astro.getConfig ? astro.getConfig() : {};
    try {
      if (astro.config) astro.config({ algorithm, horoscopeDivide, dayDivide });
      const v = astro.byLunar(`${l.year}-${l.month}-${l.day}`, h, g, !!l.isLeap, true, "zh-CN"),
        targetText = moment.hasTime
          ? `${moment.solar.iso} ${pad(moment.hour)}:${pad(moment.minute)}`
          : moment.solar.iso,
        hor = v.horoscope(targetText, moment.timeIndex),
        d = (hor && hor.hourly) || {},
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
  function primaryHourlySnapshot(h) {
    return {
      indexPhysical: h.lifePalace.branchIndex,
      stem: h.hour.stem,
      branch: h.hour.branch,
      palaceNames: h.palaces.map((p) => p.hourlyPalaceName),
      mutagen: h.transformations.map((x) => x.star),
      stars: h.palaces.map((p) =>
        (p.flowStars || []).map((s) => s.name).sort((a, b) => a.localeCompare(b, "zh-CN")),
      ),
    };
  }
  function compareHourly(input, target, options = {}) {
    if (!(OLDV && OLDV.hasVendor && OLDV.hasVendor()))
      return { available: false, ok: false, reason: "iztro unavailable" };
    const p = hourlyAt(input, target, options),
      v = vendorHourly(input, target, options),
      a = primaryHourlySnapshot(p),
      rows = [
        {
          id: "hour.ganzhi",
          label: "流时干支",
          primary: [a.stem, a.branch],
          verifier: [v.stem, v.branch],
          status: eq([a.stem, a.branch], [v.stem, v.branch]) ? "PASS" : "DIFF",
        },
        {
          id: "hour.life",
          label: "流时命宫",
          primary: a.indexPhysical,
          verifier: v.indexPhysical,
          status: a.indexPhysical === v.indexPhysical ? "PASS" : "DIFF",
        },
        {
          id: "hour.palaces",
          label: "流时十二宫",
          primary: a.palaceNames,
          verifier: v.palaceNames,
          status: eq(a.palaceNames, v.palaceNames) ? "PASS" : "DIFF",
        },
        {
          id: "hour.mutagen",
          label: "流时四化",
          primary: a.mutagen,
          verifier: v.mutagen,
          status: eq(a.mutagen, v.mutagen) ? "PASS" : "DIFF",
        },
        {
          id: "hour.flow-stars",
          label: "流时魁钺昌曲禄羊陀马鸾喜",
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
  function suite106() {
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
        const r = compareHourly(input, t, o);
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
    V16STATE.lastSuite = r;
    renderV16();
    return r;
  }
  function liveV16() {
    const s = V16STATE.lastSuite,
      sum = (s && s.summary) || { PASS: 0, DIFF: 0 },
      dd = (BASE.getDayDivide && BASE.getDayDivide()) || "forward";
    return `<div class="panel blk tjzv16-live"><h4>目标日期流时层 · v106</h4><div class="tjzv3-stat"><span class="pass">PASS ${sum.PASS || 0}</span><span class="diff">DIFF ${sum.DIFF || 0}</span></div><div class="tjzv16-grid"><div class="tjzv16-card"><b>流时宫位</b><br>流日命宫 + 当前时支序号</div><div class="tjzv16-card"><b>时干口径</b><br>五鼠遁 · ${dd === "forward" ? "晚子时先换次日日干" : "晚子时沿用当日日干"}</div><div class="tjzv16-card"><b>动态链已补齐</b><br>大限 → 小限 → 流年 → 流月 → 流日 → 流时</div></div><div class="tjzv16-actions"><button class="gbtn sm" id="tjzv16Run" type="button">验证流时层</button></div></div>`;
  }
  function patchVerifyUI() {
    try {
      if (!window.REF_PANES || typeof REF_PANES.verify !== "function" || REF_PANES.verify.__v106)
        return;
      const old = REF_PANES.verify,
        oldBind = window.REF_BIND && REF_BIND.verify;
      const fn = () => liveV16() + old();
      fn.__v106 = true;
      REF_PANES.verify = fn;
      if (window.REF_BIND)
        REF_BIND.verify = function () {
          try {
            if (typeof oldBind === "function") oldBind();
          } catch (_) {}
          const r = document.getElementById("tjzv16Run");
          if (r)
            r.onclick = () => {
              if (OLDV && OLDV.hasVendor && OLDV.hasVendor()) suite106();
              else if (OLDV && OLDV.loadVendor) OLDV.loadVendor().then(() => suite106());
            };
        };
    } catch (e) {
      try {
        console.warn("[ZiweiVerify v106 UI]", e);
      } catch (_) {}
    }
  }
  function renderV16() {
    try {
      const p = document.getElementById("pane-verify");
      if (p && p.classList.contains("on") && typeof refRender === "function") refRender("verify");
    } catch (_) {}
  }
  const VERIFY106 = Object.freeze({
    version: "16.0.0",
    build: BUILD,
    state: V16STATE,
    compareHourly,
    suite: suite106,
    compareDaily: OLDV && OLDV.compareDaily ? OLDV.compareDaily : null,
    compareMonthly: OLDV && OLDV.compareMonthly ? OLDV.compareMonthly : null,
    compareYearly: OLDV && OLDV.compareYearly ? OLDV.compareYearly : null,
    loadVendor: OLDV && OLDV.loadVendor ? OLDV.loadVendor : async () => ({ status: "unavailable" }),
    hasVendor: () => !!(OLDV && OLDV.hasVendor && OLDV.hasVendor()),
    manifest: () => ({
      module: "Tianji Ziwei Verification Layer",
      version: "16.0.0",
      build: BUILD,
      baseline: "v106",
      vendor: "iztro 2.6.1",
      resolvedComparison: [
        "hourly stem/branch",
        "hourly life palace",
        "hourly 12 palaces",
        "hourly mutagens",
        "hourly flow stars",
        "late-rat hour stem linkage",
      ],
      remainingGaps: manifest().remainingGaps,
    }),
  });
  window.TianjiZiweiVerifier = VERIFY106;
  patchVerifyUI();
  const prev = window.TianjiSystem || {};
  window.TianjiSystem = Object.freeze({
    version: "v106",
    build: BUILD,
    baseline: "v84",
    core: window.TianjiCore || prev.core || null,
    time: window.TianjiTime || prev.time || null,
    verify: window.TianjiVerifier || prev.verify || null,
    bazi: window.TianjiBazi || prev.bazi || null,
    baziVerify: window.TianjiBaziVerifier || prev.baziVerify || null,
    ziwei: API,
    ziweiVerify: VERIFY106,
    manifest: () => ({
      product: "天机盘",
      version: "v106",
      build: BUILD,
      baseline: "v84",
      ziwei: manifest(),
      ziweiVerify: VERIFY106.manifest(),
    }),
  });
  try {
    const bv = document.getElementById("buildVersion");

    window.dispatchEvent(new CustomEvent("tianji:ziwei-core-v106-ready", { detail: manifest() }));
  } catch (_) {}
})();
