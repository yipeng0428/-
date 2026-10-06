(() => {
  "use strict";
  const BUILD = "2026-10-04 09:39:00",
    VERSION = "1.8.0",
    SCHEMA = "tianji.ziwei/1.8",
    CAPABILITY = "doctrine-layer-default-zhongzhou";
  const BASE = window.TianjiZiwei;
  if (!BASE || typeof BASE.calculate !== "function") {
    try {
      console.warn("[TianjiZiwei v99] v98 core unavailable");
    } catch (_) {}
    return;
  }
  const ZHIS = "子丑寅卯辰巳午未申酉戌亥".split("");
  const SOUL_BY_BRANCH = [
    "贪狼",
    "巨门",
    "禄存",
    "文曲",
    "廉贞",
    "武曲",
    "破军",
    "武曲",
    "廉贞",
    "文曲",
    "禄存",
    "巨门",
  ];
  const clone = (o) => {
      try {
        return structuredClone(o);
      } catch (_) {
        return JSON.parse(JSON.stringify(o));
      }
    },
    mod = (a, n) => ((a % n) + n) % n;
  const STORAGE = "tianjipan.ziwei.doctrine.v99";
  const DOCTRINES = Object.freeze({
    default: {
      id: "default",
      label: "通行派 / default",
      implemented: true,
      astroTypes: ["heaven"],
      description: "以现有 Tianji / 紫微斗数全书通行安星法为主。",
    },
    zhongzhou: {
      id: "zhongzhou",
      label: "中州派 / zhongzhou",
      implemented: true,
      astroTypes: ["heaven"],
      description: "已实现 v99 已核验的中州派差异；地盘/人盘留待后续版本。",
    },
  });
  let RUNTIME = { algorithm: "default", astroType: "heaven" };
  try {
    const x = JSON.parse(localStorage.getItem(STORAGE) || "null");
    if (x && DOCTRINES[x.algorithm] && x.astroType === "heaven")
      RUNTIME = { algorithm: x.algorithm, astroType: "heaven" };
  } catch (_) {}
  function normalizeDoctrine(input = {}) {
    const d = input.ziweiDoctrine || input.doctrine || {},
      algorithm = DOCTRINES[d.algorithm || input.algorithm]
        ? String(d.algorithm || input.algorithm)
        : RUNTIME.algorithm;
    const astroType = String(d.astroType || input.astroType || RUNTIME.astroType || "heaven");
    if (astroType !== "heaven")
      throw new Error(
        "ZiweiCore v99: astroType " + astroType + " 尚未实现；当前仅支持 heaven 天盘",
      );
    return {
      algorithm,
      algorithmLabel: DOCTRINES[algorithm].label,
      astroType,
      astroTypeLabel: "天盘",
      implemented: true,
    };
  }
  function setDoctrine(p = {}) {
    const algorithm = String(p.algorithm || RUNTIME.algorithm);
    if (!DOCTRINES[algorithm])
      throw new Error("ZiweiCore v99: algorithm must be default or zhongzhou");
    const astroType = String(p.astroType || RUNTIME.astroType || "heaven");
    if (astroType !== "heaven") throw new Error("ZiweiCore v99: v99 暂只实现 heaven 天盘");
    RUNTIME = { algorithm, astroType };
    try {
      localStorage.setItem(STORAGE, JSON.stringify(RUNTIME));
    } catch (_) {}
    return getDoctrine();
  }
  function getDoctrine() {
    return clone({
      ...RUNTIME,
      label: DOCTRINES[RUNTIME.algorithm].label,
      supportedAstroTypes: ["heaven"],
      plannedAstroTypes: RUNTIME.algorithm === "zhongzhou" ? ["earth", "human"] : [],
    });
  }
  function listDoctrines() {
    return clone(DOCTRINES);
  }
  function yearBranchIndex(base) {
    return base.yearBranch && Number.isInteger(base.yearBranch.index)
      ? base.yearBranch.index
      : mod(base.input.lunar.year - 4, 12);
  }
  function genderIndex(base) {
    return base.input && base.input.gender === "F" ? 1 : 0;
  }
  function byBranch(base) {
    const o = {};
    (base.palaces || []).forEach((p) => (o[p.branchIndex] = p));
    return o;
  }
  function removeAdj(base, names) {
    const set = new Set(names);
    for (const p of base.palaces || []) {
      if (Array.isArray(p.adjectiveStars))
        p.adjectiveStars = p.adjectiveStars.filter((s) => !set.has(s && s.name));
      if (Array.isArray(p.stars)) p.stars = p.stars.filter((s) => !set.has(s && s.name));
    }
  }
  function addAdj(base, name, branchIndex, nature = "adjective") {
    const p = byBranch(base)[branchIndex];
    if (!p) return;
    const star = { name, type: nature, category: "adjective", nature, scope: "origin" };
    if (!Array.isArray(p.adjectiveStars)) p.adjectiveStars = [];
    if (!p.adjectiveStars.some((s) => s && s.name === name)) p.adjectiveStars.push(clone(star));
    if (Array.isArray(p.stars) && !p.stars.some((s) => s && s.name === name))
      p.stars.push(clone(star));
  }
  function zhongzhouPositions(base) {
    const yb = yearBranchIndex(base),
      pos = (base.adjectiveStars && base.adjectiveStars.positions) || {};
    const jiekong = yb % 2 === 0 ? pos["截路"] : pos["空亡"];
    let jiesha;
    if ([8, 0, 4].includes(yb)) jiesha = 5;
    else if ([11, 3, 7].includes(yb)) jiesha = 8;
    else if ([2, 6, 10].includes(yb)) jiesha = 11;
    else jiesha = 2;
    const dahao = [7, 6, 9, 8, 11, 10, 1, 0, 3, 2, 5, 4][yb],
      longde = mod(yb + 7, 12);
    let tianshang = pos["天伤"],
      tianshi = pos["天使"];
    if (yb % 2 !== genderIndex(base)) [tianshang, tianshi] = [tianshi, tianshang];
    return {
      截空: jiekong,
      劫杀: jiesha,
      大耗: dahao,
      龙德: longde,
      天伤: tianshang,
      天使: tianshi,
    };
  }
  function applyZhongzhou(base) {
    const yb = yearBranchIndex(base),
      zp = zhongzhouPositions(base),
      life = base.lifePalace && base.lifePalace.branchIndex;
    removeAdj(base, ["截路", "空亡", "天伤", "天使", "截空", "劫杀", "大耗", "龙德"]);
    for (const n of ["截空", "劫杀", "大耗", "龙德", "天伤", "天使"])
      addAdj(base, n, zp[n], n === "大耗" ? "adjective" : "adjective");
    for (const p of base.palaces || []) {
      if (p.suiqian12 === "大耗") p.suiqian12 = "岁破";
    }
    if (base.decorative && Array.isArray(base.decorative.suiqian12))
      base.decorative.suiqian12 = base.decorative.suiqian12.map((x) =>
        x && x.name === "大耗" ? Object.assign({}, x, { name: "岁破" }) : x,
      );
    const body = base.body || (base.masters && base.masters.body) || null,
      soul = SOUL_BY_BRANCH[yb];
    base.soul = soul;
    base.body = body;
    base.masters = {
      soul,
      body,
      policy: "zhongzhou",
      soulBasis: "year-branch",
      bodyBasis: "year-branch",
    };
    const old = base.adjectiveStars || {},
      positions = Object.assign({}, old.positions || {});
    delete positions["截路"];
    delete positions["空亡"];
    Object.assign(positions, zp);
    const names = [
      ...new Set(
        (old.names || [])
          .filter((n) => !["截路", "空亡"].includes(n))
          .concat(["截空", "劫杀", "大耗", "龙德"]),
      ),
    ];
    base.adjectiveStars = Object.assign({}, old, {
      algorithm: "zhongzhou",
      batch: "v99-zhongzhou-doctrine",
      count: names.length,
      names,
      positions,
      defaultComplete: false,
      doctrineComplete: true,
      doctrineAdditions: ["截空", "劫杀", "大耗", "龙德"],
      doctrineRemovals: ["截路", "空亡"],
    });
    base.coverage = Object.assign({}, base.coverage || {}, {
      algorithm: "zhongzhou",
      zhongzhouCoreDifferences: true,
      zhongzhouHeavenChart: true,
    });
    base.policy = Object.assign({}, base.policy || {}, {
      masters: { mode: "zhongzhou", label: "命主按生年地支；身主按生年地支" },
      suiqian12: { mode: "zhongzhou", label: "岁前十二神中大耗改称岁破" },
      voidStars: { mode: "zhongzhou", label: "不安截路/空亡，改安截空" },
      tianshiTianshang: { mode: "zhongzhou", label: "阴男阳女时天伤/天使互换" },
    });
    base.doctrine = {
      algorithm: "zhongzhou",
      label: DOCTRINES.zhongzhou.label,
      astroType: "heaven",
      astroTypeLabel: "天盘",
      differencesApplied: [
        "命主按生年支",
        "岁前大耗→岁破",
        "截路/空亡→截空",
        "增加劫杀/大耗/龙德",
        "阴男阳女天伤天使互换",
      ],
      reference: "iztro 2.6.1 rule cross-check",
    };
    return base;
  }
  function annotateDefault(base) {
    base.doctrine = {
      algorithm: "default",
      label: DOCTRINES.default.label,
      astroType: "heaven",
      astroTypeLabel: "天盘",
      differencesApplied: [],
    };
    base.policy = Object.assign({}, base.policy || {}, {
      doctrine: { mode: "default", label: "通行派 / default" },
    });
    return base;
  }
  function calculate(input = {}) {
    const d = normalizeDoctrine(input),
      clean = Object.assign({}, input);
    delete clean.algorithm;
    delete clean.doctrine;
    delete clean.ziweiDoctrine;
    delete clean.astroType;
    const base = clone(BASE.calculate(clean)),
      out = d.algorithm === "zhongzhou" ? applyZhongzhou(base) : annotateDefault(base);
    out.schema = SCHEMA;
    out.version = VERSION;
    out.build = BUILD;
    out.capability = CAPABILITY;
    out.doctrine = Object.assign({}, out.doctrine, d);
    return out;
  }
  function fromLegacy(lunar, hb, gender) {
    return BASE.fromLegacy(lunar, hb, gender);
  }
  function fromLegacyWithDoctrine(lunar, hb, gender, doctrine = {}) {
    return calculate({
      lunar: clone(lunar),
      hourBranchIndex: Number(hb),
      gender: gender === "女" || gender === "F" ? "F" : "M",
      ziweiDoctrine: doctrine,
    });
  }
  function fromTimeContext(ctx, input = {}) {
    const r = BASE.fromTimeContext(ctx, input),
      d = normalizeDoctrine(input);
    const out = d.algorithm === "zhongzhou" ? applyZhongzhou(clone(r)) : annotateDefault(clone(r));
    out.schema = SCHEMA;
    out.version = VERSION;
    out.build = BUILD;
    out.capability = CAPABILITY;
    out.doctrine = Object.assign({}, out.doctrine, d);
    return out;
  }
  function coreFingerprint(x) {
    return {
      life: x.lifePalace && x.lifePalace.branch,
      body: x.bodyPalace && x.bodyPalace.branch,
      bureau: x.bureau && x.bureau.name,
      major: (x.palaces || []).map((p) => [p.branch, (p.majorStars || []).map((s) => s.name)]),
    };
  }
  function selfTest() {
    const checks = [],
      sample = {
        lunar: { year: 1986, month: 4, day: 28, isLeap: false },
        hourBranchIndex: 9,
        gender: "M",
      };
    try {
      const a = BASE.calculate(sample),
        b = calculate(Object.assign({}, sample, { ziweiDoctrine: { algorithm: "default" } }));
      checks.push({
        id: "default.core-preserved",
        ok: JSON.stringify(coreFingerprint(a)) === JSON.stringify(coreFingerprint(b)),
      });
      checks.push({
        id: "default.adjective38",
        ok: b.adjectiveStars && b.adjectiveStars.count === 38,
      });
    } catch (e) {
      checks.push({ id: "default.compat", ok: false, error: String((e && e.message) || e) });
    }
    try {
      const z = calculate(Object.assign({}, sample, { ziweiDoctrine: { algorithm: "zhongzhou" } })),
        p = z.adjectiveStars.positions,
        n = z.adjectiveStars.names;
      checks.push({
        id: "zhongzhou.master",
        ok: z.soul === SOUL_BY_BRANCH[yearBranchIndex(z)] && z.masters.policy === "zhongzhou",
      });
      checks.push({
        id: "zhongzhou.sui-po",
        ok:
          (z.palaces || []).filter((x) => x.suiqian12 === "岁破").length === 1 &&
          (z.palaces || []).filter((x) => x.suiqian12 === "大耗").length === 0,
      });
      checks.push({
        id: "zhongzhou.void-stars",
        ok:
          !n.includes("截路") &&
          !n.includes("空亡") &&
          n.includes("截空") &&
          Number.isInteger(p["截空"]),
      });
      checks.push({
        id: "zhongzhou.extras",
        ok: ["劫杀", "大耗", "龙德"].every((x) => n.includes(x) && Number.isInteger(p[x])),
      });
      checks.push({ id: "zhongzhou.count", ok: z.adjectiveStars.count === 40 });
    } catch (e) {
      checks.push({ id: "zhongzhou.shape", ok: false, error: String((e && e.message) || e) });
    }
    try {
      const f = {
          lunar: { year: 1986, month: 4, day: 28, isLeap: false },
          hourBranchIndex: 9,
          gender: "F",
        },
        d = BASE.calculate(f),
        z = calculate(Object.assign({}, f, { ziweiDoctrine: { algorithm: "zhongzhou" } }));
      checks.push({
        id: "zhongzhou.tianshang-tianshi-swap",
        ok:
          d.adjectiveStars.positions["天伤"] === z.adjectiveStars.positions["天使"] &&
          d.adjectiveStars.positions["天使"] === z.adjectiveStars.positions["天伤"],
      });
    } catch (e) {
      checks.push({ id: "zhongzhou.swap", ok: false, error: String((e && e.message) || e) });
    }
    try {
      let threw = false;
      try {
        calculate(
          Object.assign({}, sample, {
            ziweiDoctrine: { algorithm: "zhongzhou", astroType: "earth" },
          }),
        );
      } catch (_) {
        threw = true;
      }
      checks.push({ id: "astrotype.gated", ok: threw });
    } catch (e) {
      checks.push({ id: "astrotype.gated", ok: false, error: String((e && e.message) || e) });
    }
    try {
      const cases = [
        [1986, 4, 28, 9, "M"],
        [2026, 8, 24, 0, "M"],
        [2025, 6, 16, 5, "F"],
      ];
      for (const [y, m, d, h, g] of cases) {
        const l = { year: y, month: m, day: d, isLeap: false };
        checks.push({
          id: "legacy." + [y, m, d, h, g].join("-"),
          ok: JSON.stringify(BASE.fromLegacy(l, h, g)) === JSON.stringify(fromLegacy(l, h, g)),
        });
      }
    } catch (e) {
      checks.push({ id: "legacy.compat", ok: false, error: String((e && e.message) || e) });
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
      baseline: "v98",
      capability: CAPABILITY,
      selfTest: clone(TEST),
      doctrine: getDoctrine(),
      supportedAlgorithms: ["default", "zhongzhou"],
      supportedAstroTypes: ["heaven"],
      resolvedGaps: [
        "default / 中州派流派切换基础层",
        "中州派命主",
        "岁破命名",
        "截空/劫杀/大耗/龙德",
        "中州派天伤天使换位",
      ],
      remainingGaps: [
        "中州派地盘 earth",
        "中州派人盘 human",
        "小限 birthday 目标日期分界",
        "更高阶流年流月流日流时运限",
      ],
      reference: {
        name: "SylarLong/iztro",
        version: "2.6.1",
        tagCommit: "b78dfe391f65e938d79f2419dddb80f74c6bbb8e",
        license: "MIT",
        files: [
          "src/astro/astro.ts",
          "src/star/decorativeStar.ts",
          "src/star/adjectiveStar.ts",
          "src/star/location.ts",
          "docs/posts/config-n-plugin",
        ],
        role: "deterministic doctrine cross-check",
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
    fromLegacyWithDoctrine,
    fromTimeContext,
    setDoctrine,
    getDoctrine,
    listDoctrines,
    zhongzhouPositions: (x) => clone(zhongzhouPositions(BASE.calculate(x || {}))),
    selfTest: () => clone(TEST),
    manifest,
    base: BASE,
  });
  window.TianjiZiwei = API;
  if (TEST.ok) window.calcZiwei = (lunar, hb, gender) => fromLegacy(lunar, hb, gender);
  try {
    if (window.TianjiCore) {
      TianjiCore.registerSource({
        id: "tianji-v99-ziwei-doctrine-layer",
        type: "internal",
        title: "Tianji Ziwei Core 1.8 Doctrine Layer",
        version: VERSION,
        baseline: "v98",
      });
      TianjiCore.registerSource({
        id: "iztro-2.6.1-doctrine-reference",
        type: "third-party-reference",
        title: "SylarLong/iztro v2.6.1 default/zhongzhou doctrine rules",
        version: "2.6.1",
        license: "MIT",
        repository: "SylarLong/iztro",
        commit: "b78dfe391f65e938d79f2419dddb80f74c6bbb8e",
        role: "rule-reference",
      });
      TianjiCore.registerEngine(
        {
          id: "ziwei.core.v1.8",
          system: "ziwei",
          name: "Tianji Ziwei Core 1.8",
          version: VERSION,
          source: "tianji-v99-ziwei-doctrine-layer",
          doctrine: "configurable: default | zhongzhou (heaven chart)",
          status: "active",
        },
        (input) => calculate(input || {}),
      );
    }
  } catch (e) {
    try {
      console.warn("[TianjiZiwei v99] registry", e);
    } catch (_) {}
  }
  try {
    const old =
      document.getElementById("tjZiweiV8Badge") || document.getElementById("buildVersion");
    let b = document.getElementById("tjZiweiV9Badge");
    if (!b && old) {
      b = document.createElement("span");
      b.id = "tjZiweiV9Badge";
      old.insertAdjacentElement("afterend", b);
    }
    if (b) {
      b.textContent = "ZiweiCore 1.8 · 流派层";
      b.classList.toggle("warn", !TEST.ok);
      b.title = TEST.ok
        ? "v99：default / 中州派流派口径层通过回归"
        : "v99 流派层自检失败；旧 calcZiwei 默认口径保持兼容";
    }
  } catch (_) {}

  /* ---- v99-aware iztro verifier: doctrine comparison ---- */
  const OLDV = window.TianjiZiweiVerifier,
    V9STATE = { lastSuite: null };
  function eq(a, b) {
    return JSON.stringify(a) === JSON.stringify(b);
  }
  function mapP(ps, key) {
    const o = {};
    (ps || []).forEach((p) => (o[p[key]] = p));
    return o;
  }
  function selectedAdjPrimary(c) {
    const names = new Set(["截路", "空亡", "截空", "劫杀", "大耗", "龙德", "天伤", "天使"]),
      m = mapP(c.palaces, "branch");
    return ZHIS.map((b) => [
      b,
      ((m[b] && m[b].adjectiveStars) || [])
        .map((s) => s.name)
        .filter((n) => names.has(n))
        .sort((a, b) => a.localeCompare(b, "zh-CN")),
    ]);
  }
  function selectedAdjVendor(v) {
    const names = new Set(["截路", "空亡", "截空", "劫杀", "大耗", "龙德", "天伤", "天使"]),
      m = mapP(v && v.palaces, "earthlyBranch");
    return ZHIS.map((b) => [
      b,
      ((m[b] && m[b].adjectiveStars) || [])
        .map((s) => s.name)
        .filter((n) => names.has(n))
        .sort((a, b) => a.localeCompare(b, "zh-CN")),
    ]);
  }
  function suiqianP(c) {
    const m = mapP(c.palaces, "branch");
    return ZHIS.map((b) => [b, m[b] && m[b].suiqian12]);
  }
  function suiqianV(v) {
    const m = mapP(v && v.palaces, "earthlyBranch");
    return ZHIS.map((b) => [b, m[b] && m[b].suiqian12]);
  }
  function vendorZhongzhou(input) {
    if (!(window.iztro && iztro.astro && iztro.astro.byLunar)) throw new Error("iztro unavailable");
    const astro = iztro.astro,
      l = input.lunar,
      g = input.gender === "F" ? "女" : "男",
      h = Number(input.timeIndex ?? input.hourBranchIndex ?? input.hourBranch ?? 0),
      old = astro.getConfig ? astro.getConfig() : {};
    try {
      if (astro.config)
        astro.config({
          algorithm: "zhongzhou",
          dayDivide: input.dayDivide || old.dayDivide || "forward",
        });
      const x = astro.byLunar(`${l.year}-${l.month}-${l.day}`, h, g, !!l.isLeap, true, "zh-CN");
      return x && typeof x.toJSON === "function" ? x.toJSON() : x;
    } finally {
      try {
        if (astro.config)
          astro.config({
            algorithm: old.algorithm || "default",
            dayDivide: old.dayDivide || "forward",
          });
      } catch (_) {}
    }
  }
  function compareZhongzhou(input = {}) {
    if (!(OLDV && OLDV.hasVendor && OLDV.hasVendor()))
      return { available: false, ok: false, reason: "iztro unavailable" };
    const c = calculate(Object.assign({}, input, { ziweiDoctrine: { algorithm: "zhongzhou" } })),
      v = vendorZhongzhou(input),
      rows = [];
    const mastersP = { soul: c.soul, body: c.body },
      mastersV = { soul: v && v.soul, body: v && v.body };
    rows.push({
      id: "doctrine.masters",
      label: "中州派命主 / 身主",
      primary: mastersP,
      verifier: mastersV,
      status: eq(mastersP, mastersV) ? "PASS" : "DIFF",
    });
    const sp = suiqianP(c),
      sv = suiqianV(v);
    rows.push({
      id: "doctrine.suiqian",
      label: "中州派岁前十二神（岁破）",
      primary: sp,
      verifier: sv,
      status: eq(sp, sv) ? "PASS" : "DIFF",
    });
    const ap = selectedAdjPrimary(c),
      av = selectedAdjVendor(v);
    rows.push({
      id: "doctrine.adjective-diff",
      label: "中州派差异杂曜",
      primary: ap,
      verifier: av,
      status: eq(ap, av) ? "PASS" : "DIFF",
      note: "截空 / 劫杀 / 大耗 / 龙德 + 天伤天使换位",
    });
    rows.push({
      id: "doctrine.astrotype",
      label: "中州派盘型",
      primary: "heaven 已实现；earth/human 待实现",
      verifier: "heaven/earth/human",
      status: "GAP",
      note: "v99 刻意只启用天盘，防止未实现盘型被误用。",
    });
    const counts = { PASS: 0, DIFF: 0, POLICY: 0, GAP: 0, "N/A": 0 };
    rows.forEach((x) => (counts[x.status] = (counts[x.status] || 0) + 1));
    return {
      available: true,
      ok: counts.DIFF === 0,
      input: clone(input),
      counts,
      rows,
      raw: { primary: c, verifier: v },
    };
  }
  function suite99() {
    if (!(OLDV && OLDV.hasVendor && OLDV.hasVendor()))
      return {
        available: false,
        cases: [],
        summary: { PASS: 0, DIFF: 0, POLICY: 0, GAP: 0, "N/A": 0 },
        ok: false,
      };
    const cases = [
        { id: "zz-male", l: { year: 2001, month: 6, day: 27, isLeap: false }, h: 2, g: "M" },
        { id: "zz-female", l: { year: 1986, month: 4, day: 28, isLeap: false }, h: 9, g: "F" },
      ],
      out = [],
      summary = { PASS: 0, DIFF: 0, POLICY: 0, GAP: 0, "N/A": 0 };
    for (const x of cases) {
      try {
        const r = compareZhongzhou({ lunar: x.l, hourBranchIndex: x.h, gender: x.g });
        out.push({ id: x.id, report: r });
        r.rows.forEach((y) => (summary[y.status] = (summary[y.status] || 0) + 1));
      } catch (e) {
        out.push({ id: x.id, error: String((e && e.message) || e) });
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
    V9STATE.lastSuite = r;
    renderV9();
    return r;
  }
  function liveV9() {
    const d = getDoctrine(),
      s = V9STATE.lastSuite,
      sum = (s && s.summary) || { PASS: 0, DIFF: 0, POLICY: 0, GAP: 0 };
    return `<div class="panel blk tjzv9-live"><h4>紫微流派口径层 · v99</h4><div class="tjzv3-stat"><span class="pass">PASS ${sum.PASS || 0}</span><span class="diff">DIFF ${sum.DIFF || 0}</span><span class="gap">GAP ${sum.GAP || 0}</span></div><div class="tjzv9-grid"><div class="tjzv9-card"><b>当前流派</b><br>${d.label}<br>盘型：${d.astroType === "heaven" ? "天盘" : "-"}</div><div class="tjzv9-card"><b>已隔离差异</b><br>命主、岁破、截空、劫杀/大耗/龙德、天伤天使</div><div class="tjzv9-card"><b>下一缺口</b><br>中州派地盘 / 人盘；小限生日分界</div></div><div class="tjzv9-actions"><button class="gbtn sm ${d.algorithm === "default" ? "on" : ""}" id="tjzv9Default" type="button">通行派 default</button><button class="gbtn sm ${d.algorithm === "zhongzhou" ? "on" : ""}" id="tjzv9ZZ" type="button">中州派 zhongzhou</button><button class="gbtn sm" id="tjzv9Run" type="button">验证中州派</button></div></div>`;
  }
  function patchVerifyUI() {
    try {
      if (!window.REF_PANES || typeof REF_PANES.verify !== "function" || REF_PANES.verify.__v99)
        return;
      const old = REF_PANES.verify,
        oldBind = window.REF_BIND && REF_BIND.verify;
      const fn = () => liveV9() + old();
      fn.__v99 = true;
      REF_PANES.verify = fn;
      if (window.REF_BIND)
        REF_BIND.verify = function () {
          try {
            if (typeof oldBind === "function") oldBind();
          } catch (_) {}
          const a = document.getElementById("tjzv9Default"),
            z = document.getElementById("tjzv9ZZ"),
            r = document.getElementById("tjzv9Run");
          if (a)
            a.onclick = () => {
              setDoctrine({ algorithm: "default" });
              renderV9();
            };
          if (z)
            z.onclick = () => {
              setDoctrine({ algorithm: "zhongzhou" });
              renderV9();
            };
          if (r)
            r.onclick = () => {
              if (OLDV && OLDV.hasVendor && OLDV.hasVendor()) suite99();
              else if (OLDV && OLDV.loadVendor) OLDV.loadVendor().then(() => suite99());
            };
        };
    } catch (e) {
      try {
        console.warn("[ZiweiVerify v99 UI]", e);
      } catch (_) {}
    }
  }
  function renderV9() {
    try {
      const p = document.getElementById("pane-verify");
      if (p && p.classList.contains("on") && typeof refRender === "function") refRender("verify");
    } catch (_) {}
  }
  const VERIFY99 = Object.freeze({
    version: "9.0.0",
    build: BUILD,
    state: V9STATE,
    compareZhongzhou,
    suite: suite99,
    loadVendor: OLDV && OLDV.loadVendor ? OLDV.loadVendor : async () => ({ status: "unavailable" }),
    hasVendor: () => !!(OLDV && OLDV.hasVendor && OLDV.hasVendor()),
    manifest: () => ({
      module: "Tianji Ziwei Verification Layer",
      version: "9.0.0",
      build: BUILD,
      baseline: "v99",
      vendor: "iztro 2.6.1",
      resolvedComparison: ["default / zhongzhou doctrine differences"],
      remainingGaps: manifest().remainingGaps,
    }),
  });
  window.TianjiZiweiVerifier = VERIFY99;
  patchVerifyUI();
  const prev = window.TianjiSystem || {};
  window.TianjiSystem = Object.freeze({
    version: "v99",
    build: BUILD,
    baseline: "v84",
    core: window.TianjiCore || prev.core || null,
    time: window.TianjiTime || prev.time || null,
    verify: window.TianjiVerifier || prev.verify || null,
    bazi: window.TianjiBazi || prev.bazi || null,
    baziVerify: window.TianjiBaziVerifier || prev.baziVerify || null,
    ziwei: API,
    ziweiVerify: VERIFY99,
    manifest: () => ({
      product: "天机盘",
      version: "v99",
      build: BUILD,
      baseline: "v84",
      ziwei: manifest(),
      ziweiVerify: VERIFY99.manifest(),
    }),
  });
  try {
    const bv = document.getElementById("buildVersion");

    window.dispatchEvent(new CustomEvent("tianji:ziwei-core-v99-ready", { detail: manifest() }));
  } catch (_) {}
})();
