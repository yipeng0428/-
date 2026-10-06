(() => {
  "use strict";
  const BUILD = "2026-10-04 10:21:18",
    VERSION = "1.12.0",
    SCHEMA = "tianji.ziwei/1.12",
    CAPABILITY = "target-date-yearly-flow-layer";
  const BASE = window.TianjiZiwei;
  if (!BASE || typeof BASE.calculate !== "function" || typeof BASE.cycleAt !== "function") {
    try {
      console.warn("[TianjiZiwei v103] v102 core unavailable");
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
  const SUI_DEFAULT = [
    "岁建",
    "晦气",
    "丧门",
    "贯索",
    "官符",
    "小耗",
    "大耗",
    "龙德",
    "白虎",
    "天德",
    "吊客",
    "病符",
  ];
  const SUI_ZHONGZHOU = [
    "岁建",
    "晦气",
    "丧门",
    "贯索",
    "官符",
    "小耗",
    "岁破",
    "龙德",
    "白虎",
    "天德",
    "吊客",
    "病符",
  ];
  const JIANG = [
    "将星",
    "攀鞍",
    "岁驿",
    "息神",
    "华盖",
    "劫煞",
    "灾煞",
    "天煞",
    "指背",
    "咸池",
    "月煞",
    "亡神",
  ];
  const clone = (o) => {
      try {
        return structuredClone(o);
      } catch (_) {
        return JSON.parse(JSON.stringify(o));
      }
    },
    mod = (a, n) => ((a % n) + n) % n;
  const STORAGE = "tianjipan.ziwei.flow.v103";
  let FLOW_POLICY = { horoscopeDivide: "normal" };
  try {
    const x = JSON.parse(localStorage.getItem(STORAGE) || "null");
    if (x && (x.horoscopeDivide === "normal" || x.horoscopeDivide === "exact"))
      FLOW_POLICY.horoscopeDivide = x.horoscopeDivide;
  } catch (_) {}
  function normalizeHoroscopeDivide(x) {
    return String(x || FLOW_POLICY.horoscopeDivide) === "exact" ? "exact" : "normal";
  }
  function setHoroscopeDivide(mode) {
    FLOW_POLICY.horoscopeDivide = normalizeHoroscopeDivide(mode);
    try {
      localStorage.setItem(STORAGE, JSON.stringify(FLOW_POLICY));
    } catch (_) {}
    return getHoroscopeDivide();
  }
  function getHoroscopeDivide() {
    return FLOW_POLICY.horoscopeDivide;
  }
  function normalizeSolarDate(v) {
    if (BASE.base && typeof BASE.base.normalizeSolarDate === "function")
      return BASE.base.normalizeSolarDate(v);
    let y, m, d;
    if (v instanceof Date) {
      y = v.getFullYear();
      m = v.getMonth() + 1;
      d = v.getDate();
    } else if (typeof v === "string") {
      const x = v.trim().match(/^(\d{4})[-\/.](\d{1,2})[-\/.](\d{1,2})$/);
      if (!x) throw new Error("ZiweiCore v103: target date must be YYYY-MM-DD");
      y = +x[1];
      m = +x[2];
      d = +x[3];
    } else if (v && typeof v === "object") {
      y = +(v.year ?? v.y);
      m = +(v.month ?? v.m);
      d = +(v.day ?? v.d);
    }
    if (!Number.isInteger(y) || !Number.isInteger(m) || !Number.isInteger(d))
      throw new Error("ZiweiCore v103: invalid target solar date");
    const dt = new Date(Date.UTC(y, m - 1, d));
    if (dt.getUTCFullYear() !== y || dt.getUTCMonth() + 1 !== m || dt.getUTCDate() !== d)
      throw new Error("ZiweiCore v103: invalid Gregorian date");
    return {
      year: y,
      month: m,
      day: d,
      iso: `${String(y).padStart(4, "0")}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
    };
  }
  function targetLunar(s) {
    if (typeof window.solar2lunar !== "function")
      throw new Error("ZiweiCore v103: solar2lunar unavailable");
    const x = window.solar2lunar(s.year, s.month, s.day);
    return { year: +x.year, month: +x.month, day: +x.day, isLeap: !!x.isLeap };
  }
  function effectiveFlowYear(s, lunar, mode) {
    if (mode === "normal")
      return { year: lunar.year, basis: "lunar-new-year", label: "农历正月初一换年" };
    if (!(window.TianjiTime && typeof TianjiTime.createContext === "function"))
      throw new Error("ZiweiCore v103: TianjiTime required for exact / 立春流年分界");
    const c = TianjiTime.createContext(
        { y: s.year, m: s.month, d: s.day, h: 12, mi: 0, s: 0 },
        { yearBoundary: { mode: "lichun" } },
      ),
      y = c && c.boundaries && c.boundaries.year && c.boundaries.year.effectiveYear;
    if (!Number.isInteger(y)) throw new Error("ZiweiCore v103: unable to resolve exact flow year");
    return { year: y, basis: "lichun", label: "立春换年", lichun: clone(c.boundaries.year.lichun) };
  }
  function yearGanzhi(y) {
    return {
      year: y,
      stemIndex: mod(y - 4, 10),
      stem: GANS[mod(y - 4, 10)],
      branchIndex: mod(y - 4, 12),
      branch: ZHIS[mod(y - 4, 12)],
      ganzhi: GANS[mod(y - 4, 10)] + ZHIS[mod(y - 4, 12)],
    };
  }
  function normalizeChart(chartOrInput) {
    return chartOrInput && Array.isArray(chartOrInput.palaces)
      ? chartOrInput
      : calculate(chartOrInput || {});
  }
  function flowPalaceName(flowBranch, b) {
    return PALACES[mod(flowBranch - b, 12)];
  }
  function annualStars(stem, branch) {
    const pos = {},
      put = (name, b, type) => {
        pos[name] = {
          name,
          branchIndex: mod(b, 12),
          branch: ZHIS[mod(b, 12)],
          type,
          scope: "yearly",
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
    put("流魁", kuiYue[0], "soft");
    put("流钺", kuiYue[1], "soft");
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
    put("流昌", cq[0], "soft");
    put("流曲", cq[1], "soft");
    const lu = { 0: 2, 1: 3, 2: 5, 3: 6, 4: 5, 5: 6, 6: 8, 7: 9, 8: 11, 9: 0 }[stem];
    put("流禄", lu, "lucun");
    put("流羊", lu + 1, "tough");
    put("流陀", lu - 1, "tough");
    let ma;
    if ([2, 6, 10].includes(branch)) ma = 8;
    else if ([8, 0, 4].includes(branch)) ma = 2;
    else if ([5, 9, 1].includes(branch)) ma = 11;
    else ma = 5;
    put("流马", ma, "tianma");
    const luan = mod(3 - branch, 12);
    put("流鸾", luan, "flower");
    put("流喜", luan + 6, "flower");
    put("年解", mod(10 - branch, 12), "helper");
    const byBranch = Array.from({ length: 12 }, () => []);
    Object.values(pos).forEach((x) => byBranch[x.branchIndex].push(clone(x)));
    return { count: Object.keys(pos).length, names: Object.keys(pos), positions: pos, byBranch };
  }
  function annualTwelve(branch, algorithm) {
    const sui = Array(12),
      jiang = Array(12),
      suiNames = algorithm === "zhongzhou" ? SUI_ZHONGZHOU : SUI_DEFAULT;
    for (let i = 0; i < 12; i++) sui[mod(branch + i, 12)] = suiNames[i];
    let start;
    if ([2, 6, 10].includes(branch)) start = 6;
    else if ([8, 0, 4].includes(branch)) start = 0;
    else if ([5, 9, 1].includes(branch)) start = 9;
    else start = 3;
    for (let i = 0; i < 12; i++) jiang[mod(start + i, 12)] = JIANG[i];
    return {
      suiqian12: sui,
      jiangqian12: jiang,
      startBranchIndex: start,
      startBranch: ZHIS[start],
    };
  }
  function findStarBranch(chart, name) {
    for (const p of chart.palaces || []) {
      const arr = [...(p.majorStars || []), ...(p.minorStars || []), ...(p.stars || [])];
      if (arr.some((s) => s && s.name === name))
        return { branchIndex: p.branchIndex, branch: p.branch, palace: p.name };
    }
    return null;
  }
  function annualTransformations(chart, stem) {
    return SIHUA[stem].map((star, i) => {
      const loc = findStarBranch(chart, star);
      return {
        type: SIHUA_LABEL[i],
        star,
        branchIndex: loc ? loc.branchIndex : null,
        branch: loc ? loc.branch : null,
        natalPalace: loc ? loc.palace : null,
        scope: "yearly",
      };
    });
  }
  function yearlyAt(chartOrInput, target, options = {}) {
    const chart = normalizeChart(chartOrInput),
      solar = normalizeSolarDate(target),
      lunar = targetLunar(solar),
      divide = normalizeHoroscopeDivide(options.horoscopeDivide || options.yearDivide),
      eff = effectiveFlowYear(solar, lunar, divide),
      gz = yearGanzhi(eff.year),
      algorithm = (chart.doctrine && chart.doctrine.algorithm) || "default",
      flowStars = annualStars(gz.stemIndex, gz.branchIndex),
      decs = annualTwelve(gz.branchIndex, algorithm),
      trans = annualTransformations(chart, gz.stemIndex),
      byBranch = {};
    (chart.palaces || []).forEach((p) => (byBranch[p.branchIndex] = p));
    const palaces = ZHIS.map((branch, b) => {
      const p = byBranch[b] || {};
      return {
        branchIndex: b,
        branch,
        natalPalaceName: p.name || "",
        yearlyPalaceName: flowPalaceName(gz.branchIndex, b),
        isYearlyLifePalace: b === gz.branchIndex,
        flowStars: clone(flowStars.byBranch[b]),
        transformations: trans.filter((x) => x.branchIndex === b),
        suiqian12: decs.suiqian12[b],
        jiangqian12: decs.jiangqian12[b],
      };
    });
    return {
      target: { solar, lunar },
      scope: "yearly",
      boundary: {
        horoscopeDivide: divide,
        label: divide === "exact" ? "立春换年" : "农历正月初一换年",
        effectiveYear: eff.year,
        basis: eff.basis,
        lichun: eff.lichun || null,
      },
      year: { ...gz },
      lifePalace: { branchIndex: gz.branchIndex, branch: gz.branch, name: "流年命宫" },
      palaces,
      transformations: trans,
      flowStars,
      yearly12: decs,
      doctrine: clone(chart.doctrine || null),
      astroType: clone(chart.astroType || null),
      policy: {
        horoscopeDivide: divide,
        yearlyPalaceRule: "流年地支起流年命宫；十二宫按命兄夫子财疾迁友官田福父逆支序展开",
        flowStarRule: "魁钺昌曲禄羊陀马鸾喜 + 年解",
        fourTransformations: "流年天干四化",
        yearly12: "流年地支起岁建；三合局起将星",
      },
    };
  }
  function horoscopeAt(chartOrInput, target, options = {}) {
    const cycle = BASE.cycleAt(chartOrInput, target, options),
      yearly = yearlyAt(chartOrInput, target, options);
    return Object.assign({}, clone(cycle), {
      yearly,
      flow: { yearly: clone(yearly) },
      summary: Object.assign({}, clone(cycle.summary || {}), {
        yearlyGanzhi: yearly.year.ganzhi,
        yearlyLifePalace: yearly.lifePalace.branch,
        horoscopeDivide: yearly.boundary.horoscopeDivide,
      }),
    });
  }
  function calculate(input = {}) {
    const out = clone(BASE.calculate(input));
    out.schema = SCHEMA;
    out.version = VERSION;
    out.build = BUILD;
    out.capability = CAPABILITY;
    out.flowPolicy = {
      horoscopeDivide: normalizeHoroscopeDivide(
        (input && input.ziweiFlowPolicy && input.ziweiFlowPolicy.horoscopeDivide) ||
          getHoroscopeDivide(),
      ),
      horoscopeDivideLabel:
        normalizeHoroscopeDivide(
          (input && input.ziweiFlowPolicy && input.ziweiFlowPolicy.horoscopeDivide) ||
            getHoroscopeDivide(),
        ) === "exact"
          ? "立春换年"
          : "农历正月初一换年",
    };
    out.coverage = Object.assign({}, out.coverage || {}, {
      yearlyFlow: true,
      yearlyPalaces: true,
      yearlyMutagens: true,
      yearlyFlowStars: true,
      yearly12: true,
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
      yearlyFlow: true,
      yearlyPalaces: true,
      yearlyMutagens: true,
      yearlyFlowStars: true,
      yearly12: true,
    });
    return out;
  }
  function fingerprint(x) {
    return JSON.stringify({
      life: x.lifePalace,
      body: x.bodyPalace,
      bureau: x.bureau,
      adj: x.adjectiveStars && x.adjectiveStars.positions,
      minor: x.minorPeriod,
      doctrine: x.doctrine,
      astroType: x.astroType,
    });
  }
  function starNamesAt(y, b) {
    return (y.flowStars.byBranch[b] || [])
      .map((x) => x.name)
      .sort((a, b) => a.localeCompare(b, "zh-CN"));
  }
  function selfTest() {
    const checks = [],
      birth = {
        lunar: { year: 2000, month: 7, day: 17, isLeap: false },
        hourBranchIndex: 2,
        gender: "F",
      };
    try {
      const a = BASE.calculate(birth),
        b = calculate(birth);
      checks.push({ id: "v102.core-preserved", ok: fingerprint(a) === fingerprint(b) });
    } catch (e) {
      checks.push({ id: "v102.core-preserved", ok: false, error: String((e && e.message) || e) });
    }
    try {
      const y = yearlyAt(birth, "2023-08-19", { horoscopeDivide: "normal" });
      checks.push({
        id: "yearly.gui-mao",
        ok: y.year.stem === "癸" && y.year.branch === "卯" && y.lifePalace.branch === "卯",
      });
      checks.push({
        id: "yearly.palace-names",
        ok:
          y.palaces[3].yearlyPalaceName === "命宫" &&
          y.palaces[2].yearlyPalaceName === "兄弟" &&
          y.palaces[4].yearlyPalaceName === "父母",
      });
      checks.push({
        id: "yearly.flow-stars-reference",
        ok:
          JSON.stringify(starNamesAt(y, 3)) ===
            JSON.stringify(["流昌", "流魁"].sort((a, b) => a.localeCompare(b, "zh-CN"))) &&
          JSON.stringify(starNamesAt(y, 5)) ===
            JSON.stringify(["流钺", "流马"].sort((a, b) => a.localeCompare(b, "zh-CN"))) &&
          starNamesAt(y, 6).includes("流喜") &&
          starNamesAt(y, 7).includes("年解") &&
          starNamesAt(y, 11).includes("流曲") &&
          starNamesAt(y, 11).includes("流陀") &&
          starNamesAt(y, 0).includes("流禄") &&
          starNamesAt(y, 0).includes("流鸾") &&
          starNamesAt(y, 1).includes("流羊"),
      });
      checks.push({
        id: "yearly.mutagens",
        ok:
          JSON.stringify(y.transformations.map((x) => x.type + ":" + x.star)) ===
          JSON.stringify(["禄:破军", "权:巨门", "科:太阴", "忌:贪狼"]),
      });
      checks.push({
        id: "yearly.12shen",
        ok: y.palaces[3].suiqian12 === "岁建" && y.palaces[3].jiangqian12 === "将星",
      });
    } catch (e) {
      checks.push({
        id: "yearly.reference-suite",
        ok: false,
        error: String((e && e.message) || e),
      });
    }
    try {
      const n = yearlyAt(birth, "2024-02-05", { horoscopeDivide: "normal" }),
        e = yearlyAt(birth, "2024-02-05", { horoscopeDivide: "exact" });
      checks.push({
        id: "horoscopeDivide.normal-exact",
        ok:
          n.year.year === 2023 &&
          e.year.year === 2024 &&
          n.year.ganzhi === "癸卯" &&
          e.year.ganzhi === "甲辰",
      });
    } catch (e) {
      checks.push({
        id: "horoscopeDivide.normal-exact",
        ok: false,
        error: String((e && e.message) || e),
      });
    }
    try {
      const z = {
          lunar: { year: 1986, month: 4, day: 28, isLeap: false },
          hourBranchIndex: 9,
          gender: "F",
          ziweiDoctrine: { algorithm: "zhongzhou", astroType: "earth" },
        },
        y = yearlyAt(z, "2023-08-19"),
        q = horoscopeAt(z, "2023-08-19");
      checks.push({
        id: "zhongzhou.yearly-suipo",
        ok:
          y.doctrine &&
          y.doctrine.algorithm === "zhongzhou" &&
          y.yearly12.suiqian12.includes("岁破") &&
          !y.yearly12.suiqian12.includes("大耗"),
      });
      checks.push({
        id: "combined.horoscopeAt",
        ok:
          q.yearly &&
          q.yearly.year.ganzhi === "癸卯" &&
          q.majorCycle &&
          q.minorPeriod &&
          q.astroType &&
          q.astroType.id === "earth",
      });
    } catch (e) {
      checks.push({ id: "combined-suite", ok: false, error: String((e && e.message) || e) });
    }
    return { ok: checks.every((x) => x.ok), checks, version: VERSION, build: BUILD };
  }
  const TEST = selfTest();
  function manifest() {
    const prev = BASE.manifest ? BASE.manifest() : {};
    return {
      module: "Tianji Ziwei Core",
      version: VERSION,
      schema: SCHEMA,
      build: BUILD,
      baseline: "v102",
      capability: CAPABILITY,
      selfTest: clone(TEST),
      flowPolicy: { horoscopeDivide: getHoroscopeDivide() },
      resolvedGaps: [
        ...(prev.resolvedGaps || []),
        "目标日期流年干支",
        "流年十二宫",
        "流年四化",
        "流年魁钺昌曲禄羊陀马鸾喜与年解",
        "流年岁前/将前十二神",
        "horoscopeDivide normal/exact",
      ],
      remainingGaps: ["流月层", "流日层", "流时层", "动态流曜叠盘可视化"],
      reference: {
        name: "SylarLong/iztro",
        version: "2.6.1",
        tagCommit: "b78dfe391f65e938d79f2419dddb80f74c6bbb8e",
        license: "MIT",
        files: [
          "src/astro/FunctionalAstrolabe.ts#horoscope-yearly",
          "src/star/horoscopeStar.ts",
          "src/star/decorativeStar.ts#getYearly12",
          "src/star/location.ts",
        ],
        role: "yearly flow deterministic rule cross-check",
      },
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
    yearlyAt,
    flowYearAt: yearlyAt,
    horoscopeAt,
    setHoroscopeDivide,
    getHoroscopeDivide,
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
        id: "tianji-v103-ziwei-yearly-flow",
        type: "internal",
        title: "Tianji Ziwei Core 1.12 Target-Date Yearly Flow Layer",
        version: VERSION,
        baseline: "v102",
      });
      TianjiCore.registerSource({
        id: "iztro-2.6.1-yearly-flow-reference",
        type: "third-party-reference",
        title: "SylarLong/iztro v2.6.1 yearly horoscope reference",
        version: "2.6.1",
        license: "MIT",
        repository: "SylarLong/iztro",
        commit: "b78dfe391f65e938d79f2419dddb80f74c6bbb8e",
        role: "rule-reference",
      });
      TianjiCore.registerEngine(
        {
          id: "ziwei.core.v1.12",
          system: "ziwei",
          name: "Tianji Ziwei Core 1.12",
          version: VERSION,
          source: "tianji-v103-ziwei-yearly-flow",
          doctrine: "target-date yearly palace/mutagen/flow-star/yearly12",
          status: "active",
        },
        (input) => calculate(input || {}),
      );
    }
  } catch (e) {
    try {
      console.warn("[TianjiZiwei v103] registry", e);
    } catch (_) {}
  }
  try {
    const old =
      document.getElementById("tjZiweiV12Badge") || document.getElementById("buildVersion");
    let b = document.getElementById("tjZiweiV13Badge");
    if (!b && old) {
      b = document.createElement("span");
      b.id = "tjZiweiV13Badge";
      old.insertAdjacentElement("afterend", b);
    }
    if (b) {
      b.textContent = "ZiweiCore 1.12 · 流年";
      b.classList.toggle("warn", !TEST.ok);
      b.title = TEST.ok
        ? "v103：流年十二宫 / 四化 / 流曜 / 岁前将前通过回归"
        : "v103 流年层自检失败；v102 保持可回退";
      b.dataset.selftest = TEST.ok ? "PASS" : "FAIL";
      b.dataset.checks =
        String(TEST.checks.filter((x) => x.ok).length) + "/" + String(TEST.checks.length);
    }
  } catch (_) {}
  /* ---- v103-aware iztro yearly verifier ---- */
  const OLDV = window.TianjiZiweiVerifier,
    V13STATE = { lastSuite: null };
  function eq(a, b) {
    return JSON.stringify(a) === JSON.stringify(b);
  }
  function vendorYearly(input, target, horoscopeDivide = "normal") {
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
        y = (hor && hor.yearly) || {},
        pal = y.palaceNames || [],
        stars = y.stars || [],
        dec = y.yearlyDecStar || {},
        toBranchArray = (a) => {
          const out = Array(12);
          (a || []).forEach((x, i) => (out[mod(i + 2, 12)] = x));
          return out;
        };
      return {
        stem: y.heavenlyStem,
        branch: y.earthlyBranch,
        palaceNames: toBranchArray(pal),
        mutagen: (y.mutagen || []).slice(),
        stars: toBranchArray(stars).map((a) =>
          (a || []).map((s) => s.name).sort((a, b) => a.localeCompare(b, "zh-CN")),
        ),
        suiqian12: toBranchArray(dec.suiqian12 || []),
        jiangqian12: toBranchArray(dec.jiangqian12 || []),
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
  function primaryYearlySnapshot(y) {
    return {
      stem: y.year.stem,
      branch: y.year.branch,
      palaceNames: y.palaces.map((p) => p.yearlyPalaceName),
      mutagen: y.transformations.map((x) => x.star),
      stars: y.palaces.map((p) =>
        (p.flowStars || []).map((s) => s.name).sort((a, b) => a.localeCompare(b, "zh-CN")),
      ),
      suiqian12: y.palaces.map((p) => p.suiqian12),
      jiangqian12: y.palaces.map((p) => p.jiangqian12),
    };
  }
  function compareYearly(input, target, horoscopeDivide = "normal") {
    if (!(OLDV && OLDV.hasVendor && OLDV.hasVendor()))
      return { available: false, ok: false, reason: "iztro unavailable" };
    const p = yearlyAt(input, target, { horoscopeDivide }),
      v = vendorYearly(input, target, horoscopeDivide),
      a = primaryYearlySnapshot(p),
      rows = [
        {
          id: "year.ganzhi",
          label: "流年干支",
          primary: [a.stem, a.branch],
          verifier: [v.stem, v.branch],
          status: eq([a.stem, a.branch], [v.stem, v.branch]) ? "PASS" : "DIFF",
        },
        {
          id: "year.palaces",
          label: "流年十二宫",
          primary: a.palaceNames,
          verifier: v.palaceNames,
          status: eq(a.palaceNames, v.palaceNames) ? "PASS" : "DIFF",
        },
        {
          id: "year.mutagen",
          label: "流年四化",
          primary: a.mutagen,
          verifier: v.mutagen,
          status: eq(a.mutagen, v.mutagen) ? "PASS" : "DIFF",
        },
        {
          id: "year.flow-stars",
          label: "流年魁钺昌曲禄羊陀马鸾喜/年解",
          primary: a.stars,
          verifier: v.stars,
          status: eq(a.stars, v.stars) ? "PASS" : "DIFF",
        },
        {
          id: "year.suiqian12",
          label: "流年岁前十二神",
          primary: a.suiqian12,
          verifier: v.suiqian12,
          status: eq(a.suiqian12, v.suiqian12) ? "PASS" : "DIFF",
        },
        {
          id: "year.jiangqian12",
          label: "流年将前十二神",
          primary: a.jiangqian12,
          verifier: v.jiangqian12,
          status: eq(a.jiangqian12, v.jiangqian12) ? "PASS" : "DIFF",
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
  function suite103() {
    if (!(OLDV && OLDV.hasVendor && OLDV.hasVendor()))
      return { available: false, cases: [], summary: { PASS: 0, DIFF: 0 }, ok: false };
    const input = {
        lunar: { year: 2000, month: 7, day: 17, isLeap: false },
        hourBranchIndex: 2,
        gender: "F",
      },
      cases = [
        ["gui-mao", "2023-08-19", "normal"],
        ["boundary-normal", "2024-02-05", "normal"],
        ["boundary-exact", "2024-02-05", "exact"],
      ],
      out = [],
      summary = { PASS: 0, DIFF: 0 };
    for (const [id, t, m] of cases) {
      try {
        const r = compareYearly(input, t, m);
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
    V13STATE.lastSuite = r;
    renderV13();
    return r;
  }
  function liveV13() {
    const mode = getHoroscopeDivide(),
      s = V13STATE.lastSuite,
      sum = (s && s.summary) || { PASS: 0, DIFF: 0 };
    return `<div class="panel blk tjzv13-live"><h4>目标日期流年层 · v103</h4><div class="tjzv3-stat"><span class="pass">PASS ${sum.PASS || 0}</span><span class="diff">DIFF ${sum.DIFF || 0}</span></div><div class="tjzv13-grid"><div class="tjzv13-card"><b>流年分界</b><br>${mode === "exact" ? "exact · 立春换年" : "normal · 农历正月初一换年"}</div><div class="tjzv13-card"><b>已实现</b><br>流年十二宫 · 四化 · 11流曜<br>岁前 / 将前十二神</div><div class="tjzv13-card"><b>API</b><br>yearlyAt(chart, date)<br>horoscopeAt(chart, date)</div></div><div class="tjzv13-actions"><button class="gbtn sm ${mode === "normal" ? "on" : ""}" id="tjzv13Normal" type="button">normal 正月换年</button><button class="gbtn sm ${mode === "exact" ? "on" : ""}" id="tjzv13Exact" type="button">exact 立春换年</button><button class="gbtn sm" id="tjzv13Run" type="button">验证流年层</button></div></div>`;
  }
  function patchVerifyUI() {
    try {
      if (!window.REF_PANES || typeof REF_PANES.verify !== "function" || REF_PANES.verify.__v103)
        return;
      const old = REF_PANES.verify,
        oldBind = window.REF_BIND && REF_BIND.verify;
      const fn = () => liveV13() + old();
      fn.__v103 = true;
      REF_PANES.verify = fn;
      if (window.REF_BIND)
        REF_BIND.verify = function () {
          try {
            if (typeof oldBind === "function") oldBind();
          } catch (_) {}
          const n = document.getElementById("tjzv13Normal"),
            e = document.getElementById("tjzv13Exact"),
            r = document.getElementById("tjzv13Run");
          if (n)
            n.onclick = () => {
              setHoroscopeDivide("normal");
              renderV13();
            };
          if (e)
            e.onclick = () => {
              setHoroscopeDivide("exact");
              renderV13();
            };
          if (r)
            r.onclick = () => {
              if (OLDV && OLDV.hasVendor && OLDV.hasVendor()) suite103();
              else if (OLDV && OLDV.loadVendor) OLDV.loadVendor().then(() => suite103());
            };
        };
    } catch (e) {
      try {
        console.warn("[ZiweiVerify v103 UI]", e);
      } catch (_) {}
    }
  }
  function renderV13() {
    try {
      const p = document.getElementById("pane-verify");
      if (p && p.classList.contains("on") && typeof refRender === "function") refRender("verify");
    } catch (_) {}
  }
  const VERIFY103 = Object.freeze({
    version: "13.0.0",
    build: BUILD,
    state: V13STATE,
    compareYearly,
    suite: suite103,
    loadVendor: OLDV && OLDV.loadVendor ? OLDV.loadVendor : async () => ({ status: "unavailable" }),
    hasVendor: () => !!(OLDV && OLDV.hasVendor && OLDV.hasVendor()),
    manifest: () => ({
      module: "Tianji Ziwei Verification Layer",
      version: "13.0.0",
      build: BUILD,
      baseline: "v103",
      vendor: "iztro 2.6.1",
      resolvedComparison: [
        "yearly stem/branch",
        "yearly 12 palaces",
        "yearly mutagens",
        "yearly flow stars",
        "yearly suiqian12/jiangqian12",
        "horoscopeDivide normal/exact",
      ],
      remainingGaps: manifest().remainingGaps,
    }),
  });
  window.TianjiZiweiVerifier = VERIFY103;
  patchVerifyUI();
  const prev = window.TianjiSystem || {};
  window.TianjiSystem = Object.freeze({
    version: "v103",
    build: BUILD,
    baseline: "v84",
    core: window.TianjiCore || prev.core || null,
    time: window.TianjiTime || prev.time || null,
    verify: window.TianjiVerifier || prev.verify || null,
    bazi: window.TianjiBazi || prev.bazi || null,
    baziVerify: window.TianjiBaziVerifier || prev.baziVerify || null,
    ziwei: API,
    ziweiVerify: VERIFY103,
    manifest: () => ({
      product: "天机盘",
      version: "v103",
      build: BUILD,
      baseline: "v84",
      ziwei: manifest(),
      ziweiVerify: VERIFY103.manifest(),
    }),
  });
  try {
    const bv = document.getElementById("buildVersion");

    window.dispatchEvent(new CustomEvent("tianji:ziwei-core-v103-ready", { detail: manifest() }));
  } catch (_) {}
})();
