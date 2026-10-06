(() => {
  "use strict";
  const BUILD = "2026-10-04 10:09:28",
    VERSION = "1.11.0",
    SCHEMA = "tianji.ziwei/1.11",
    CAPABILITY = "target-date-major-minor-childhood-cycle-query";
  const BASE = window.TianjiZiwei;
  if (!BASE || typeof BASE.calculate !== "function" || typeof BASE.minorPeriodAt !== "function") {
    try {
      console.warn("[TianjiZiwei v102] v101 core unavailable");
    } catch (_) {}
    return;
  }
  const clone = (o) => {
    try {
      return structuredClone(o);
    } catch (_) {
      return JSON.parse(JSON.stringify(o));
    }
  };
  const CHILDHOOD = ["命宫", "财帛", "疾厄", "夫妻", "福德", "官禄"];
  function normalizeChart(chartOrInput) {
    return chartOrInput && Array.isArray(chartOrInput.palaces)
      ? chartOrInput
      : BASE.calculate(chartOrInput || {});
  }
  function normalizeRange(p) {
    const r =
      p && p.decadal && Array.isArray(p.decadal.range)
        ? p.decadal.range
        : p && p.majorPeriod
          ? [p.majorPeriod.startAge, p.majorPeriod.endAge]
          : null;
    return r && r.length >= 2 ? [Number(r[0]), Number(r[1])] : null;
  }
  function palaceSnapshot(p) {
    if (!p) return null;
    const r = normalizeRange(p);
    return {
      index: Number.isInteger(p.branchIndex) ? p.branchIndex : null,
      name: p.name || "",
      branchIndex: Number.isInteger(p.branchIndex) ? p.branchIndex : null,
      branch: p.branch || "",
      stem: p.stem || p.heavenlyStem || "",
      range: r,
      decadal: p.decadal ? clone(p.decadal) : null,
    };
  }
  function decadalForAge(chart, age) {
    const a = Number(age);
    if (!Number.isInteger(a) || a < 1) return null;
    for (const p of chart.palaces || []) {
      const r = normalizeRange(p);
      if (r && a >= r[0] && a <= r[1])
        return Object.assign(
          {
            type: "decadal",
            label: "大限",
            nominalAge: a,
            startAge: r[0],
            endAge: r[1],
            isChildhood: false,
          },
          palaceSnapshot(p),
        );
    }
    return null;
  }
  function childhoodForAge(chart, age) {
    const a = Number(age);
    if (!Number.isInteger(a) || a < 1 || a > 6) return null;
    const name = CHILDHOOD[a - 1],
      p = (chart.palaces || []).find((x) => x && x.name === name);
    if (!p) return null;
    return Object.assign({}, palaceSnapshot(p), {
      type: "childhood",
      label: "童限",
      nominalAge: a,
      startAge: a,
      endAge: a,
      isChildhood: true,
      range: [a, a],
      decadal: null,
      rule: "一命二财三疾厄，四岁夫妻五福德，六岁事业",
    });
  }
  function majorCycleForAge(chartOrInput, age) {
    const chart = normalizeChart(chartOrInput),
      a = Number(age);
    if (!Number.isInteger(a) || a < 1)
      throw new Error("ZiweiCore v102: nominal age must be positive integer");
    const dec = decadalForAge(chart, a);
    if (dec) return dec;
    const child = childhoodForAge(chart, a);
    if (child) return child;
    return {
      type: "uncovered",
      label: "未覆盖",
      nominalAge: a,
      isChildhood: false,
      startAge: null,
      endAge: null,
      index: null,
      name: "",
      branchIndex: null,
      branch: "",
      stem: "",
      range: null,
      decadal: null,
    };
  }
  function cycleAt(chartOrInput, target, options = {}) {
    const chart = normalizeChart(chartOrInput),
      minor = BASE.minorPeriodAt(chart, target, options),
      age = minor && minor.age && Number(minor.age.nominalAge),
      active =
        Number.isInteger(age) && age >= 1
          ? majorCycleForAge(chart, age)
          : { type: "uncovered", label: "未覆盖", nominalAge: age, isChildhood: false };
    const dec = active.type === "decadal" ? clone(active) : null,
      child = active.type === "childhood" ? clone(active) : null;
    return {
      target: clone(minor.target),
      birth: clone(minor.birth),
      age: clone(minor.age),
      minorPeriod: clone(minor.minorPeriod),
      withinMinorCoverage: minor.withinCoverage,
      majorCycle: clone(active),
      decadal: dec,
      childhood: { active: !!child, cycle: child },
      policy: Object.assign({}, clone(minor.policy || {}), {
        majorCycleRule: "先查大限；未进入第一大限时才使用童限",
      }),
      doctrine: clone(minor.doctrine || chart.doctrine || null),
      astroType: clone(minor.astroType || chart.astroType || null),
      summary: {
        nominalAge: age,
        minorPalace: (minor.minorPeriod && minor.minorPeriod.name) || "",
        majorType: active.type,
        majorPalace: active.name || "",
        majorRange: active.range || null,
        isChildhood: active.type === "childhood",
      },
    };
  }
  function calculate(input = {}) {
    const out = clone(BASE.calculate(input));
    out.schema = SCHEMA;
    out.version = VERSION;
    out.build = BUILD;
    out.capability = CAPABILITY;
    out.coverage = Object.assign({}, out.coverage || {}, {
      targetDateMajorCycle: true,
      targetDateMinorCycle: true,
      childhoodCycle: true,
    });
    out.policy = Object.assign({}, out.policy || {}, {
      cycleQuery: {
        major: "十二宫 decadal.range",
        minor: "v101 ageDivide + ages",
        childhood: "一命二财三疾厄，四夫妻五福德六官禄；仅在尚未进入第一大限时启用",
      },
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
      targetDateMajorCycle: true,
      targetDateMinorCycle: true,
      childhoodCycle: true,
    });
    return out;
  }
  function selfTest() {
    const checks = [];
    try {
      const input = {
          lunar: { year: 1986, month: 4, day: 28, isLeap: false },
          hourBranchIndex: 9,
          gender: "M",
        },
        a = BASE.calculate(input),
        b = calculate(input);
      const fp = (x) =>
        JSON.stringify({
          life: x.lifePalace,
          body: x.bodyPalace,
          bureau: x.bureau,
          major: (x.palaces || []).map((p) => [p.branch, (p.majorStars || []).map((s) => s.name)]),
          adj: x.adjectiveStars && x.adjectiveStars.positions,
        });
      checks.push({ id: "v101.core-preserved", ok: fp(a) === fp(b) });
    } catch (e) {
      checks.push({ id: "v101.core-preserved", ok: false, error: String((e && e.message) || e) });
    }
    try {
      const h = calculate({
          lunar: { year: 1986, month: 4, day: 28, isLeap: false },
          hourBranchIndex: 9,
          gender: "M",
        }),
        c1 = majorCycleForAge(h, 1),
        c5 = majorCycleForAge(h, 5),
        c6 = majorCycleForAge(h, 6);
      checks.push({ id: "childhood.age1", ok: c1.type === "childhood" && c1.name === "命宫" });
      checks.push({ id: "childhood.age5", ok: c5.type === "childhood" && c5.name === "福德" });
      checks.push({
        id: "first-decadal.age6",
        ok: c6.type === "decadal" && Array.isArray(c6.range) && c6.range[0] === 6,
      });
    } catch (e) {
      checks.push({ id: "childhood-suite", ok: false, error: String((e && e.message) || e) });
    }
    try {
      const input = {
          lunar: { year: 1986, month: 4, day: 28, isLeap: false },
          hourBranchIndex: 9,
          gender: "M",
        },
        q = cycleAt(input, "2026-10-04", { ageDivide: "normal" });
      checks.push({
        id: "target.combined-query",
        ok:
          q.age.nominalAge === 41 &&
          !!q.minorPeriod &&
          q.majorCycle.type === "decadal" &&
          q.majorCycle.range[0] <= 41 &&
          q.majorCycle.range[1] >= 41,
      });
      checks.push({
        id: "target.summary",
        ok:
          q.summary.nominalAge === 41 &&
          q.summary.majorType === "decadal" &&
          typeof q.summary.minorPalace === "string",
      });
    } catch (e) {
      checks.push({ id: "target.combined-query", ok: false, error: String((e && e.message) || e) });
    }
    try {
      const input = {
          lunar: { year: 2000, month: 7, day: 17, isLeap: false },
          hourBranchIndex: 2,
          gender: "F",
        },
        q1 = cycleAt(input, "2023-08-31", { ageDivide: "normal" }),
        q2 = cycleAt(input, "2023-08-31", { ageDivide: "birthday" });
      checks.push({
        id: "ageDivide.propagates",
        ok:
          q1.age.nominalAge === 24 &&
          q2.age.nominalAge === 23 &&
          q1.minorPeriod.branch !== q2.minorPeriod.branch,
      });
    } catch (e) {
      checks.push({ id: "ageDivide.propagates", ok: false, error: String((e && e.message) || e) });
    }
    try {
      const h = calculate({
          lunar: { year: 1986, month: 4, day: 28, isLeap: false },
          hourBranchIndex: 9,
          gender: "M",
          ziweiDoctrine: { algorithm: "zhongzhou", astroType: "earth" },
        }),
        q = cycleAt(h, "2026-10-04", { ageDivide: "normal" });
      checks.push({
        id: "zhongzhou.earth-compatible",
        ok:
          q.doctrine &&
          q.doctrine.algorithm === "zhongzhou" &&
          q.astroType &&
          q.astroType.id === "earth" &&
          !!q.majorCycle &&
          !!q.minorPeriod,
      });
    } catch (e) {
      checks.push({
        id: "zhongzhou.earth-compatible",
        ok: false,
        error: String((e && e.message) || e),
      });
    }
    try {
      const h = calculate({
          lunar: { year: 1986, month: 4, day: 28, isLeap: false },
          hourBranchIndex: 9,
          gender: "M",
        }),
        all = [1, 5, 6, 41, 120].map((a) => majorCycleForAge(h, a));
      checks.push({
        id: "cycle.shape",
        ok: all.every((x) => x && typeof x.type === "string" && "nominalAge" in x),
      });
    } catch (e) {
      checks.push({ id: "cycle.shape", ok: false, error: String((e && e.message) || e) });
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
      baseline: "v101",
      capability: CAPABILITY,
      selfTest: clone(TEST),
      doctrine: BASE.getDoctrine ? BASE.getDoctrine() : null,
      resolvedGaps: [
        ...(prev.resolvedGaps || []),
        "目标日期→虚岁→小限→大限联合查询",
        "童限目标日期判定",
        "当前大限宫/起止年龄/干支查询",
      ],
      remainingGaps: ["流年完整运限层", "流月/流日/流时完整运限层", "大限/流年流曜叠盘与四化"],
      reference: {
        name: "SylarLong/iztro",
        version: "2.6.1",
        tagCommit: "b78dfe391f65e938d79f2419dddb80f74c6bbb8e",
        license: "MIT",
        files: [
          "src/astro/FunctionalAstrolabe.ts#horoscope",
          "src/astro/palace.ts#getHoroscope",
          "src/__tests__/astro/astro.test.ts#childhood",
        ],
        role: "target-date major/minor cycle deterministic rule cross-check",
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
    cycleAt,
    fortuneAt: cycleAt,
    horoscopeAt: cycleAt,
    majorCycleAt: cycleAt,
    majorCycleForAge,
    decadalForAge: (chartOrInput, age) => {
      const c = normalizeChart(chartOrInput);
      return clone(decadalForAge(c, age));
    },
    childhoodForAge: (chartOrInput, age) => {
      const c = normalizeChart(chartOrInput);
      return clone(childhoodForAge(c, age));
    },
    minorPeriodAt: BASE.minorPeriodAt,
    minorPeriodForDate: BASE.minorPeriodForDate || BASE.minorPeriodAt,
    nominalAgeAt: BASE.nominalAgeAt,
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
        id: "tianji-v102-ziwei-target-cycle-query",
        type: "internal",
        title: "Tianji Ziwei Core 1.11 Target-Date Major/Minor Cycle Query",
        version: VERSION,
        baseline: "v101",
      });
      TianjiCore.registerSource({
        id: "iztro-2.6.1-target-cycle-reference",
        type: "third-party-reference",
        title: "SylarLong/iztro v2.6.1 horoscope/childhood reference",
        version: "2.6.1",
        license: "MIT",
        repository: "SylarLong/iztro",
        commit: "b78dfe391f65e938d79f2419dddb80f74c6bbb8e",
        role: "rule-reference",
      });
      TianjiCore.registerEngine(
        {
          id: "ziwei.core.v1.11",
          system: "ziwei",
          name: "Tianji Ziwei Core 1.11",
          version: VERSION,
          source: "tianji-v102-ziwei-target-cycle-query",
          doctrine: "target-date major/minor/childhood joint query",
          status: "active",
        },
        (input) => calculate(input || {}),
      );
    }
  } catch (e) {
    try {
      console.warn("[TianjiZiwei v102] registry", e);
    } catch (_) {}
  }
  try {
    const old =
      document.getElementById("tjZiweiV11Badge") || document.getElementById("buildVersion");
    let b = document.getElementById("tjZiweiV12Badge");
    if (!b && old) {
      b = document.createElement("span");
      b.id = "tjZiweiV12Badge";
      old.insertAdjacentElement("afterend", b);
    }
    if (b) {
      b.textContent = "ZiweiCore 1.11 · 运限日期";
      b.classList.toggle("warn", !TEST.ok);
      b.title = TEST.ok
        ? "v102：目标日期大限/小限/童限联合查询通过回归"
        : "v102 运限日期层自检失败；v101 保持可回退";
      b.dataset.selftest = TEST.ok ? "PASS" : "FAIL";
      b.dataset.checks =
        String(TEST.checks.filter((x) => x.ok).length) + "/" + String(TEST.checks.length);
    }
  } catch (_) {}
  /* ---- v102-aware iztro target-cycle verifier ---- */
  const OLDV = window.TianjiZiweiVerifier,
    V12STATE = { lastSuite: null };
  function eq(a, b) {
    return JSON.stringify(a) === JSON.stringify(b);
  }
  function vendorCycle(input, target, ageDivide) {
    if (!(window.iztro && iztro.astro)) throw new Error("iztro unavailable");
    const astro = iztro.astro,
      l = input.lunar,
      g = input.gender === "F" ? "女" : "男",
      h = Number(input.timeIndex ?? input.hourBranchIndex ?? 0),
      old = astro.getConfig ? astro.getConfig() : {};
    try {
      if (astro.config) astro.config({ ageDivide });
      const v = astro.byLunar(`${l.year}-${l.month}-${l.day}`, h, g, !!l.isLeap, true, "zh-CN"),
        hor = v.horoscope(
          BASE.normalizeSolarDate ? BASE.normalizeSolarDate(target).iso : String(target),
        ),
        pj = typeof v.toJSON === "function" ? v.toJSON() : v,
        pi = hor && hor.age && hor.age.index,
        mi = hor && hor.decadal && hor.decadal.index,
        pp = ((pj && pj.palaces) || [])[pi],
        mp = ((pj && pj.palaces) || [])[mi];
      return {
        nominalAge: hor && hor.age && hor.age.nominalAge,
        minorBranch: hor && hor.age && (hor.age.earthlyBranch || (pp && pp.earthlyBranch)),
        majorName: hor && hor.decadal && hor.decadal.name,
        majorBranch: hor && hor.decadal && (hor.decadal.earthlyBranch || (mp && mp.earthlyBranch)),
        majorIndex: mi,
        majorRange: (mp && mp.decadal && mp.decadal.range) || null,
      };
    } finally {
      try {
        if (astro.config)
          astro.config({
            ageDivide: old.ageDivide || "normal",
            algorithm: old.algorithm || "default",
            dayDivide: old.dayDivide || "forward",
            yearDivide: old.yearDivide || "normal",
            horoscopeDivide: old.horoscopeDivide || "normal",
          });
      } catch (_) {}
    }
  }
  function compareCycle(input, target, ageDivide) {
    if (!(OLDV && OLDV.hasVendor && OLDV.hasVendor()))
      return { available: false, ok: false, reason: "iztro unavailable" };
    const p = cycleAt(input, target, { ageDivide }),
      v = vendorCycle(input, target, ageDivide),
      majorBranch = (p.majorCycle && p.majorCycle.branch) || "",
      rows = [
        {
          id: "age.nominal",
          label: "目标日期虚岁",
          primary: p.age.nominalAge,
          verifier: v.nominalAge,
          status: eq(p.age.nominalAge, v.nominalAge) ? "PASS" : "DIFF",
        },
        {
          id: "minor.branch",
          label: "目标日期小限宫",
          primary: p.minorPeriod && p.minorPeriod.branch,
          verifier: v.minorBranch,
          status: eq(p.minorPeriod && p.minorPeriod.branch, v.minorBranch) ? "PASS" : "DIFF",
        },
        {
          id: "major.branch",
          label: "目标日期大限/童限宫",
          primary: majorBranch,
          verifier: v.majorBranch,
          status: eq(majorBranch, v.majorBranch) ? "PASS" : "DIFF",
        },
        {
          id: "major.range",
          label: "大限年龄区间",
          primary: p.majorCycle.type === "decadal" ? p.majorCycle.range : null,
          verifier: v.majorRange,
          status:
            p.majorCycle.type === "childhood"
              ? "N/A"
              : eq(p.majorCycle.range, v.majorRange)
                ? "PASS"
                : "DIFF",
        },
      ],
      counts = { PASS: 0, DIFF: 0, "N/A": 0 };
    rows.forEach((x) => (counts[x.status] = (counts[x.status] || 0) + 1));
    return {
      available: true,
      ok: counts.DIFF === 0,
      target,
      ageDivide,
      counts,
      rows,
      raw: { primary: p, verifier: v },
    };
  }
  function suite102() {
    if (!(OLDV && OLDV.hasVendor && OLDV.hasVendor()))
      return { available: false, cases: [], summary: { PASS: 0, DIFF: 0, "N/A": 0 }, ok: false };
    const input = {
        lunar: { year: 2000, month: 7, day: 17, isLeap: false },
        hourBranchIndex: 2,
        gender: "F",
      },
      cases = [
        ["normal", "2023-08-31", "normal"],
        ["birthday-before", "2023-08-31", "birthday"],
        ["birthday-after", "2023-09-02", "birthday"],
      ],
      out = [],
      summary = { PASS: 0, DIFF: 0, "N/A": 0 };
    for (const [id, t, m] of cases) {
      try {
        const r = compareCycle(input, t, m);
        out.push({ id, report: r });
        r.rows.forEach((x) => (summary[x.status] = (summary[x.status] || 0) + 1));
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
    V12STATE.lastSuite = r;
    renderV12();
    return r;
  }
  function liveV12() {
    const s = V12STATE.lastSuite,
      sum = (s && s.summary) || { PASS: 0, DIFF: 0, "N/A": 0 };
    return `<div class="panel blk tjzv12-live"><h4>目标日期运限 · v102</h4><div class="tjzv3-stat"><span class="pass">PASS ${sum.PASS || 0}</span><span class="diff">DIFF ${sum.DIFF || 0}</span><span>N/A ${sum["N/A"] || 0}</span></div><div class="tjzv12-grid"><div class="tjzv12-card"><b>联合查询</b><br>虚岁 → 小限 → 大限 / 童限</div><div class="tjzv12-card"><b>童限规则</b><br>一命 · 二财 · 三疾 · 四夫妻 · 五福德 · 六官禄</div><div class="tjzv12-card"><b>API</b><br>cycleAt(chart, date)<br>majorCycleForAge(chart, age)</div></div><div class="tjzv12-actions"><button class="gbtn sm" id="tjzv12Run" type="button">验证联合运限</button></div></div>`;
  }
  function patchVerifyUI() {
    try {
      if (!window.REF_PANES || typeof REF_PANES.verify !== "function" || REF_PANES.verify.__v102)
        return;
      const old = REF_PANES.verify,
        oldBind = window.REF_BIND && REF_BIND.verify;
      const fn = () => liveV12() + old();
      fn.__v102 = true;
      REF_PANES.verify = fn;
      if (window.REF_BIND)
        REF_BIND.verify = function () {
          try {
            if (typeof oldBind === "function") oldBind();
          } catch (_) {}
          const r = document.getElementById("tjzv12Run");
          if (r)
            r.onclick = () => {
              if (OLDV && OLDV.hasVendor && OLDV.hasVendor()) suite102();
              else if (OLDV && OLDV.loadVendor) OLDV.loadVendor().then(() => suite102());
            };
        };
    } catch (e) {
      try {
        console.warn("[ZiweiVerify v102 UI]", e);
      } catch (_) {}
    }
  }
  function renderV12() {
    try {
      const p = document.getElementById("pane-verify");
      if (p && p.classList.contains("on") && typeof refRender === "function") refRender("verify");
    } catch (_) {}
  }
  const VERIFY102 = Object.freeze({
    version: "12.0.0",
    build: BUILD,
    state: V12STATE,
    compareCycle,
    suite: suite102,
    loadVendor: OLDV && OLDV.loadVendor ? OLDV.loadVendor : async () => ({ status: "unavailable" }),
    hasVendor: () => !!(OLDV && OLDV.hasVendor && OLDV.hasVendor()),
    manifest: () => ({
      module: "Tianji Ziwei Verification Layer",
      version: "12.0.0",
      build: BUILD,
      baseline: "v102",
      vendor: "iztro 2.6.1",
      resolvedComparison: [
        "target nominal age",
        "target minor period",
        "target decadal/childhood palace",
        "decadal age range",
      ],
      remainingGaps: manifest().remainingGaps,
    }),
  });
  window.TianjiZiweiVerifier = VERIFY102;
  patchVerifyUI();
  const prev = window.TianjiSystem || {};
  window.TianjiSystem = Object.freeze({
    version: "v102",
    build: BUILD,
    baseline: "v84",
    core: window.TianjiCore || prev.core || null,
    time: window.TianjiTime || prev.time || null,
    verify: window.TianjiVerifier || prev.verify || null,
    bazi: window.TianjiBazi || prev.bazi || null,
    baziVerify: window.TianjiBaziVerifier || prev.baziVerify || null,
    ziwei: API,
    ziweiVerify: VERIFY102,
    manifest: () => ({
      product: "天机盘",
      version: "v102",
      build: BUILD,
      baseline: "v84",
      ziwei: manifest(),
      ziweiVerify: VERIFY102.manifest(),
    }),
  });
  try {
    const bv = document.getElementById("buildVersion");

    window.dispatchEvent(new CustomEvent("tianji:ziwei-core-v102-ready", { detail: manifest() }));
  } catch (_) {}
})();
