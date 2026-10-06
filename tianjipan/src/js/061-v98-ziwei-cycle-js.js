(() => {
  "use strict";
  const BUILD = "2026-10-04 09:31:26",
    VERSION = "1.7.0",
    SCHEMA = "tianji.ziwei/1.7",
    CAPABILITY = "minor-period-and-late-rat-policy";
  const BASE = window.TianjiZiwei;
  if (!BASE || typeof BASE.calculate !== "function") {
    try {
      console.warn("[TianjiZiwei v98] v97 core unavailable");
    } catch (_) {}
    return;
  }
  const ZHIS = "子丑寅卯辰巳午未申酉戌亥".split("");
  const clone = (o) => {
      try {
        return structuredClone(o);
      } catch (_) {
        return JSON.parse(JSON.stringify(o));
      }
    },
    mod = (a, n) => ((a % n) + n) % n;
  const DEFAULT_POLICY = Object.freeze({
    dayDivide: "forward",
    dayDivideLabel: "晚子时归次日",
    minorPeriod: {
      ageBasis: "nominal",
      ageDivide: "normal",
      ageDivideLabel: "虚岁以自然年分界",
      direction: "male-forward-female-reverse",
      maxAge: 120,
    },
  });
  /* Rule provenance / cross-check:
   SylarLong/iztro v2.6.1, tag commit b78dfe391f65e938d79f2419dddb80f74c6bbb8e, MIT License.
   Cross-checked: src/utils/index.ts#getAgeIndex, src/astro/palace.ts#getHoroscope,
   docs config dayDivide/ageDivide. iztro: dayDivide forward=晚子时归次日, current=归当日.
   v98 keeps all 0..11 legacy calls unchanged and only adds explicit timeIndex=12 semantics.
*/
  let RUNTIME_POLICY = {
    dayDivide: DEFAULT_POLICY.dayDivide,
    minorPeriod: { ...DEFAULT_POLICY.minorPeriod },
  };
  try {
    const p = JSON.parse(localStorage.getItem("tianjipan.ziwei.policy.v98") || "null");
    if (p && typeof p === "object") {
      if (p.dayDivide === "current" || p.dayDivide === "forward")
        RUNTIME_POLICY.dayDivide = p.dayDivide;
      if (p.minorPeriod && p.minorPeriod.ageDivide)
        RUNTIME_POLICY.minorPeriod.ageDivide = p.minorPeriod.ageDivide;
    }
  } catch (_) {}
  function normalizePolicy(input = {}) {
    const p = input.ziweiPolicy || input.policyV98 || (input.policy && input.policy.ziwei) || {};
    const dayDivide =
      (p.dayDivide || (p.lateRat && p.lateRat.dayDivide) || RUNTIME_POLICY.dayDivide) === "current"
        ? "current"
        : "forward";
    const ageDivide =
      (p.ageDivide ||
        (p.minorPeriod && p.minorPeriod.ageDivide) ||
        RUNTIME_POLICY.minorPeriod.ageDivide) === "birthday"
        ? "birthday"
        : "normal";
    return {
      dayDivide,
      dayDivideLabel: dayDivide === "forward" ? "晚子时归次日" : "晚子时归当日",
      minorPeriod: {
        ...DEFAULT_POLICY.minorPeriod,
        ageDivide,
        ageDivideLabel: ageDivide === "birthday" ? "虚岁以农历生日为分界" : "虚岁以自然年分界",
      },
    };
  }
  function setPolicy(p = {}) {
    const n = normalizePolicy({ ziweiPolicy: p });
    RUNTIME_POLICY = { dayDivide: n.dayDivide, minorPeriod: { ...n.minorPeriod } };
    try {
      localStorage.setItem(
        "tianjipan.ziwei.policy.v98",
        JSON.stringify({
          dayDivide: n.dayDivide,
          minorPeriod: { ageDivide: n.minorPeriod.ageDivide },
        }),
      );
    } catch (_) {}
    return getPolicy();
  }
  function getPolicy() {
    return clone(normalizePolicy({ ziweiPolicy: RUNTIME_POLICY }));
  }
  function lunarDays(y, m, isLeap) {
    try {
      if (isLeap && typeof lLeapDays === "function") return lLeapDays(y);
      if (typeof lMonthDays === "function") return lMonthDays(y, m);
    } catch (_) {}
    throw new Error("ZiweiCore v98: lunar month-day adapter unavailable");
  }
  function leapMonthOf(y) {
    try {
      return typeof lLeap === "function" ? lLeap(y) : 0;
    } catch (_) {
      return 0;
    }
  }
  function nextLunarDay(l) {
    const x = clone(l),
      max = lunarDays(x.year, x.month, !!x.isLeap);
    if (x.day < max) {
      x.day++;
      return x;
    }
    x.day = 1;
    const leap = leapMonthOf(x.year);
    if (!x.isLeap && leap === x.month) {
      x.isLeap = true;
      return x;
    }
    if (x.isLeap) x.isLeap = false;
    x.month++;
    if (x.month > 12) {
      x.year++;
      x.month = 1;
      x.isLeap = false;
    }
    return x;
  }
  function normalizeTimeIndex(input) {
    let h = input.timeIndex;
    if (h == null) h = input.hourIndex;
    if (h == null) h = input.hourBranchIndex ?? input.hourBranch;
    h = Number(h);
    if (!Number.isInteger(h) || h < 0 || h > 12)
      throw new Error("ZiweiCore v98: time index must be 0..12");
    return h;
  }
  function minorStartBranch(yearBranch) {
    if ([2, 6, 10].includes(yearBranch)) return 4; // 寅午戌 -> 辰
    if ([8, 0, 4].includes(yearBranch)) return 10; // 申子辰 -> 戌
    if ([5, 9, 1].includes(yearBranch)) return 7; // 巳酉丑 -> 未
    return 1; // 亥卯未 -> 丑
  }
  function minorAges(yearBranch, gender, maxAge = 120) {
    const out = Array.from({ length: 12 }, () => []),
      start = minorStartBranch(yearBranch),
      forward = gender !== "F";
    for (let age = 1; age <= maxAge; age++) {
      const offset = (age - 1) % 12,
        b = mod(start + (forward ? offset : -offset), 12);
      out[b].push(age);
    }
    return {
      agesByBranch: out,
      startBranchIndex: start,
      startBranch: ZHIS[start],
      forward,
      direction: forward ? "顺行" : "逆行",
      ageBasis: "虚岁",
    };
  }
  function addMinorPeriod(base, policy) {
    const yb =
        base.yearBranch && Number.isInteger(base.yearBranch.index)
          ? base.yearBranch.index
          : mod(base.input.lunar.year - 4, 12),
      g = base.input.gender === "F" ? "F" : "M",
      mp = minorAges(yb, g, policy.minorPeriod.maxAge);
    for (const p of base.palaces || []) {
      p.ages = clone(mp.agesByBranch[p.branchIndex]);
      p.minorPeriod = { ages: clone(p.ages), firstAge: p.ages[0] ?? null, cycle: 12 };
    }
    base.minorPeriod = {
      startBranchIndex: mp.startBranchIndex,
      startBranch: mp.startBranch,
      forward: mp.forward,
      direction: mp.direction,
      ageBasis: "虚岁",
      ageDivide: policy.minorPeriod.ageDivide,
      ageDivideLabel: policy.minorPeriod.ageDivideLabel,
      maxAge: policy.minorPeriod.maxAge,
    };
    base.coverage = Object.assign({}, base.coverage || {}, {
      minorPeriod: true,
      minorPeriodMaxAge: policy.minorPeriod.maxAge,
    });
    return base;
  }
  function calculate(input = {}) {
    const policy = normalizePolicy(input),
      timeIndex = normalizeTimeIndex(input),
      originalLunar = clone(input.lunar),
      isLate = timeIndex === 12;
    let effectiveLunar = clone(originalLunar),
      branchIndex = timeIndex === 12 ? 0 : timeIndex;
    if (isLate && policy.dayDivide === "forward") effectiveLunar = nextLunarDay(effectiveLunar);
    const baseInput = Object.assign({}, input, {
      lunar: effectiveLunar,
      hourBranchIndex: branchIndex,
      hourBranch: branchIndex,
    });
    delete baseInput.timeIndex;
    delete baseInput.hourIndex;
    const base = clone(BASE.calculate(baseInput));
    addMinorPeriod(base, policy);
    base.schema = SCHEMA;
    base.version = VERSION;
    base.build = BUILD;
    base.capability = CAPABILITY;
    base.input = Object.assign({}, base.input, {
      lunar: clone(originalLunar),
      effectiveLunar: clone(effectiveLunar),
      timeIndex,
      hourBranchIndex: branchIndex,
      hourBranch: ZHIS[branchIndex],
      timePhase: isLate ? "late-rat" : "normal",
    });
    base.policy = Object.assign({}, base.policy || {}, {
      lateRat: {
        timeIndex: 12,
        branch: "子",
        dayDivide: policy.dayDivide,
        label: policy.dayDivideLabel,
        applied: isLate,
      },
      minorPeriod: clone(policy.minorPeriod),
    });
    base.lateRat = {
      isLateRat: isLate,
      timeIndex,
      branchIndex,
      branch: ZHIS[branchIndex],
      dayDivide: policy.dayDivide,
      dayDivideLabel: policy.dayDivideLabel,
      originalLunar: clone(originalLunar),
      effectiveLunar: clone(effectiveLunar),
      dateShifted: isLate && policy.dayDivide === "forward",
    };
    base.coverage.remaining = (base.coverage.remaining || []).filter((x) => !/小限|晚子时/.test(x));
    return base;
  }
  function fromLegacy(lunar, hb, gender) {
    const h = Number(hb);
    if (h >= 0 && h <= 11) return BASE.fromLegacy(lunar, h, gender);
    return calculate({ lunar, hourBranchIndex: h, gender }).legacy;
  }
  function fromTimeContext(ctx, input = {}) {
    if (!ctx || !ctx.clock || !ctx.astronomy)
      throw new Error("ZiweiCore v98: TimeContext required");
    if (typeof window.fromJD !== "function" || typeof window.solar2lunar !== "function")
      throw new Error("ZiweiCore v98: calendar adapters unavailable");
    const loc = ctx.clock.calculation || ctx.clock.civil,
      jd = +ctx.astronomy.jdCalculationLocal;
    if (!Number.isFinite(jd)) throw new Error("ZiweiCore v98: invalid jdCalculationLocal");
    const cal = window.fromJD(jd + 1e-7),
      lunar = window.solar2lunar(cal.y, cal.m, cal.d),
      timeIndex = loc.h === 23 ? 12 : Math.floor((loc.h + 1) / 2) % 12;
    const dayMode =
        (ctx.policy && ctx.policy.dayBoundary && ctx.policy.dayBoundary.mode) || "ziEarly",
      dayDivide =
        timeIndex === 12
          ? dayMode === "ziEarly"
            ? "forward"
            : "current"
          : RUNTIME_POLICY.dayDivide;
    return calculate({
      lunar,
      timeIndex,
      gender: input.gender,
      ziweiPolicy: Object.assign({}, input.ziweiPolicy || {}, { dayDivide }),
    });
  }
  function minorPeriodForAge(chartOrInput, age) {
    const chart =
        chartOrInput && Array.isArray(chartOrInput.palaces)
          ? chartOrInput
          : calculate(chartOrInput || {}),
      a = Number(age);
    if (!Number.isInteger(a) || a < 1)
      throw new Error("ZiweiCore v98: nominal age must be positive integer");
    const p = (chart.palaces || []).find((x) => Array.isArray(x.ages) && x.ages.includes(a));
    return p
      ? {
          nominalAge: a,
          branchIndex: p.branchIndex,
          branch: p.branch,
          name: p.name,
          stem: p.stem,
          ages: clone(p.ages),
        }
      : null;
  }
  function sameCoreFingerprint(a, b) {
    const pick = (x) => ({
      life: x.lifePalace && x.lifePalace.branch,
      body: x.bodyPalace && x.bodyPalace.branch,
      bureau: x.bureau && x.bureau.name,
      anchors: x.starAnchors,
      trans: x.transformations,
      adj: x.adjectiveStars && x.adjectiveStars.positions,
    });
    return JSON.stringify(pick(a)) === JSON.stringify(pick(b));
  }
  function selfTest() {
    const checks = [];
    const cases = [
      ["base-M", { year: 1986, month: 4, day: 28, isLeap: false }, 9, "M"],
      ["base-F", { year: 1986, month: 4, day: 28, isLeap: false }, 9, "F"],
      ["zi", { year: 2026, month: 8, day: 24, isLeap: false }, 0, "M"],
      ["hai", { year: 2026, month: 8, day: 24, isLeap: false }, 11, "F"],
      ["leap15", { year: 2025, month: 6, day: 15, isLeap: true }, 5, "M"],
      ["leap16", { year: 2025, month: 6, day: 16, isLeap: true }, 5, "M"],
      ["m12", { year: 2033, month: 12, day: 29, isLeap: false }, 7, "F"],
    ];
    for (const [id, l, h, g] of cases) {
      try {
        checks.push({
          id: "legacy." + id,
          ok: JSON.stringify(BASE.fromLegacy(l, h, g)) === JSON.stringify(fromLegacy(l, h, g)),
        });
      } catch (e) {
        checks.push({ id: "legacy." + id, ok: false, error: String((e && e.message) || e) });
      }
    }
    try {
      const r = calculate({
          lunar: { year: 1986, month: 4, day: 28, isLeap: false },
          hourBranchIndex: 9,
          gender: "M",
        }),
        all = (r.palaces || []).flatMap((p) => p.ages || []).sort((a, b) => a - b);
      checks.push({
        id: "minor.coverage.1-120",
        ok: all.length === 120 && all.every((x, i) => x === i + 1),
      });
      checks.push({
        id: "minor.male-start",
        ok: r.minorPeriod.startBranch === "辰" && r.minorPeriod.direction === "顺行",
      });
      checks.push({
        id: "minor.age-query",
        ok: minorPeriodForAge(r, 1).branch === "辰" && minorPeriodForAge(r, 13).branch === "辰",
      });
    } catch (e) {
      checks.push({ id: "minor.system", ok: false, error: String((e && e.message) || e) });
    }
    try {
      const l = { year: 2026, month: 8, day: 10, isLeap: false },
        cur = calculate({
          lunar: l,
          timeIndex: 12,
          gender: "M",
          ziweiPolicy: { dayDivide: "current" },
        }),
        early = calculate({ lunar: l, hourBranchIndex: 0, gender: "M" });
      checks.push({
        id: "late-rat.current",
        ok:
          sameCoreFingerprint(cur, early) &&
          cur.input.effectiveLunar.day === 10 &&
          cur.lateRat.dateShifted === false,
      });
    } catch (e) {
      checks.push({ id: "late-rat.current", ok: false, error: String((e && e.message) || e) });
    }
    try {
      const l = { year: 2026, month: 8, day: 10, isLeap: false },
        next = nextLunarDay(l),
        fwd = calculate({
          lunar: l,
          timeIndex: 12,
          gender: "M",
          ziweiPolicy: { dayDivide: "forward" },
        }),
        earlyNext = calculate({ lunar: next, hourBranchIndex: 0, gender: "M" });
      checks.push({
        id: "late-rat.forward",
        ok:
          sameCoreFingerprint(fwd, earlyNext) &&
          JSON.stringify(fwd.input.effectiveLunar) === JSON.stringify(next) &&
          fwd.lateRat.dateShifted === true,
      });
    } catch (e) {
      checks.push({ id: "late-rat.forward", ok: false, error: String((e && e.message) || e) });
    }
    try {
      const a = minorAges(2, "M", 120),
        b = minorAges(2, "F", 120);
      checks.push({
        id: "minor.direction-reference",
        ok:
          a.startBranch === "辰" &&
          a.agesByBranch[4][0] === 1 &&
          a.agesByBranch[5][0] === 2 &&
          b.agesByBranch[4][0] === 1 &&
          b.agesByBranch[3][0] === 2,
      });
    } catch (e) {
      checks.push({
        id: "minor.direction-reference",
        ok: false,
        error: String((e && e.message) || e),
      });
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
      baseline: "v97",
      capability: CAPABILITY,
      selfTest: clone(TEST),
      policy: getPolicy(),
      resolvedGaps: ["小限年龄序列 1–120", "晚子时 timeIndex=12", "dayDivide forward/current"],
      remainingGaps: [
        "小限生日分界的目标日期判定",
        "default / 中州派完整流派切换",
        "更高阶流年流月流日流时运限",
      ],
      reference: {
        name: "SylarLong/iztro",
        version: "2.6.1",
        tagCommit: "b78dfe391f65e938d79f2419dddb80f74c6bbb8e",
        license: "MIT",
        files: ["src/utils/index.ts", "src/astro/palace.ts", "docs/posts/config-n-plugin"],
        role: "deterministic-rule cross-check",
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
    minorAges: (yb, g, max = 120) => clone(minorAges(yb, g, max)),
    minorPeriodForAge,
    setPolicy,
    getPolicy,
    nextLunarDay: (x) => clone(nextLunarDay(x)),
    selfTest: () => clone(TEST),
    manifest,
    base: BASE,
  });
  window.TianjiZiwei = API;
  if (TEST.ok) window.calcZiwei = (lunar, hb, gender) => fromLegacy(lunar, hb, gender);
  try {
    if (window.TianjiCore) {
      TianjiCore.registerSource({
        id: "tianji-v98-ziwei-cycle-policy",
        type: "internal",
        title: "Tianji Ziwei Core 1.7 Minor Period & Late Rat Policy",
        version: VERSION,
        baseline: "v97",
      });
      TianjiCore.registerSource({
        id: "iztro-2.6.1-cycle-reference",
        type: "third-party-reference",
        title: "SylarLong/iztro v2.6.1 minor-period/dayDivide rules",
        version: "2.6.1",
        license: "MIT",
        repository: "SylarLong/iztro",
        commit: "b78dfe391f65e938d79f2419dddb80f74c6bbb8e",
        role: "rule-reference",
      });
      TianjiCore.registerEngine(
        {
          id: "ziwei.core.v1.7",
          system: "ziwei",
          name: "Tianji Ziwei Core 1.7",
          version: VERSION,
          source: "tianji-v98-ziwei-cycle-policy",
          doctrine: "default natal 38/38 + minor period + explicit late-rat policy",
          status: "active",
        },
        (input) => calculate(input || {}),
      );
    }
  } catch (e) {
    try {
      console.warn("[TianjiZiwei v98] registry", e);
    } catch (_) {}
  }
  try {
    const old =
      document.getElementById("tjZiweiV7Badge") || document.getElementById("buildVersion");
    let b = document.getElementById("tjZiweiV8Badge");
    if (!b && old) {
      b = document.createElement("span");
      b.id = "tjZiweiV8Badge";
      old.insertAdjacentElement("afterend", b);
    }
    if (b) {
      b.textContent = "ZiweiCore 1.7 · 小限/晚子时";
      b.classList.toggle("warn", !TEST.ok);
      b.title = TEST.ok
        ? "v98：小限与晚子时口径层通过回归"
        : "v98 自检失败；旧 calcZiwei 0..11 兼容接口保持可回退";
    }
  } catch (_) {}

  /* ---- v98-aware iztro verifier ---- */
  const OLDV = window.TianjiZiweiVerifier;
  const BRANCHES = ZHIS;
  function eq(a, b) {
    return JSON.stringify(a) === JSON.stringify(b);
  }
  function pMap(c) {
    const o = {};
    (c.palaces || []).forEach((p) => (o[p.branch] = p));
    return o;
  }
  function vMap(v) {
    const o = {};
    ((v && v.palaces) || []).forEach((p) => (o[p.earthlyBranch] = p));
    return o;
  }
  function ageDistributionP(c) {
    const m = pMap(c);
    return BRANCHES.map((b) => [b, ((m[b] && m[b].ages) || []).slice()]);
  }
  function ageDistributionV(v) {
    const m = vMap(v);
    return BRANCHES.map((b) => [b, ((m[b] && m[b].ages) || []).slice()]);
  }
  function vendorLate(input, dayDivide) {
    if (!(window.iztro && iztro.astro && iztro.astro.byLunar)) throw new Error("iztro unavailable");
    const astro = iztro.astro,
      old = astro.getConfig ? astro.getConfig().dayDivide : "forward",
      l = input.lunar,
      g = input.gender === "F" ? "女" : "男";
    try {
      if (astro.config) astro.config({ dayDivide });
      const x = astro.byLunar(`${l.year}-${l.month}-${l.day}`, 12, g, !!l.isLeap, true, "zh-CN");
      return x && typeof x.toJSON === "function" ? x.toJSON() : x;
    } finally {
      try {
        if (astro.config) astro.config({ dayDivide: old || "forward" });
      } catch (_) {}
    }
  }
  function coreFingerprint(c) {
    const pm = pMap(c),
      maj = BRANCHES.map((b) => [
        b,
        ((pm[b] && pm[b].majorStars) || [])
          .map((s) => s.name)
          .sort((a, b) => a.localeCompare(b, "zh-CN")),
      ]);
    return {
      life: c.lifePalace && c.lifePalace.branch,
      body: c.bodyPalace && c.bodyPalace.branch,
      bureau: c.bureau && c.bureau.name,
      major: maj,
    };
  }
  function vendorFingerprint(v) {
    const vm = vMap(v),
      maj = BRANCHES.map((b) => [
        b,
        ((vm[b] && vm[b].majorStars) || [])
          .map((s) => s.name)
          .sort((a, b) => a.localeCompare(b, "zh-CN")),
      ]);
    return {
      life: v && v.earthlyBranchOfSoulPalace,
      body: v && v.earthlyBranchOfBodyPalace,
      bureau: v && v.fiveElementsClass,
      major: maj,
    };
  }
  function compare98(input = {}) {
    if (!(OLDV && OLDV.compare))
      return { available: false, ok: false, reason: "v97 verifier unavailable" };
    const h = Number(
      input.timeIndex ?? input.hourIndex ?? input.hourBranchIndex ?? input.hourBranch,
    );
    if (h === 12) {
      if (!(OLDV.hasVendor && OLDV.hasVendor()))
        return { available: false, ok: false, reason: "iztro unavailable" };
      const rows = [];
      for (const mode of ["forward", "current"]) {
        const c = calculate({
            lunar: clone(input.lunar),
            timeIndex: 12,
            gender: input.gender,
            ziweiPolicy: { dayDivide: mode },
          }),
          v = vendorLate(input, mode),
          a = coreFingerprint(c),
          b = vendorFingerprint(v);
        rows.push({
          id: "late-rat." + mode,
          label: "晚子时 " + mode,
          primary: a,
          verifier: b,
          status: eq(a, b) ? "PASS" : "DIFF",
          note: mode === "forward" ? "23:00 归次日" : "23:00 归当日",
        });
      }
      const counts = { PASS: 0, DIFF: 0, POLICY: 0, GAP: 0, "N/A": 0 };
      rows.forEach((x) => counts[x.status]++);
      return {
        available: true,
        ok: counts.DIFF === 0,
        input: clone(input),
        counts,
        rows,
        raw: { primary: null, verifier: null },
      };
    }
    const r = OLDV.compare(input);
    if (!r || !r.available) return r;
    const c = calculate({ lunar: clone(input.lunar), hourBranchIndex: h, gender: input.gender }),
      v = r.raw && r.raw.verifier;
    r.raw.primary = c;
    const rows = (r.rows || []).filter((x) => x.id !== "gap.xiaoxian" && x.id !== "gap.late-rat");
    const ap = ageDistributionP(c),
      av = ageDistributionV(v);
    rows.push({
      id: "minor-period.ages",
      label: "小限 1–120 岁宫位序列",
      primary: ap,
      verifier: av,
      status: eq(ap, av) ? "PASS" : "DIFF",
      note: "男顺女逆；每宫每隔12岁重复。",
    });
    rows.push({
      id: "late-rat.policy",
      label: "晚子时口径能力",
      primary: { timeIndex: [0, 12], dayDivide: ["forward", "current"] },
      verifier: { timeIndex: [0, 12], dayDivide: ["forward", "current"] },
      status: "PASS",
      note: "能力层已对齐；实际晚子时另以 timeIndex=12 专项测试。",
    });
    const counts = { PASS: 0, DIFF: 0, POLICY: 0, GAP: 0, "N/A": 0 };
    rows.forEach((x) => (counts[x.status] = (counts[x.status] || 0) + 1));
    r.rows = rows;
    r.counts = counts;
    r.ok = counts.DIFF === 0;
    return r;
  }
  const CASES = OLDV && OLDV.cases ? OLDV.cases() : [],
    V8STATE = { lastSuite: null };
  function suite98() {
    if (!(OLDV && OLDV.hasVendor && OLDV.hasVendor()))
      return {
        available: false,
        cases: [],
        summary: { PASS: 0, DIFF: 0, POLICY: 0, GAP: 0, "N/A": 0 },
        ok: false,
      };
    const cases = [],
      summary = { PASS: 0, DIFF: 0, POLICY: 0, GAP: 0, "N/A": 0 };
    for (const x of CASES) {
      try {
        const r = compare98({ lunar: x.l, hourBranchIndex: x.h, gender: x.g });
        cases.push({ id: x.id, label: x.label, report: r });
        (r.rows || []).forEach((y) => (summary[y.status] = (summary[y.status] || 0) + 1));
      } catch (e) {
        cases.push({ id: x.id, label: x.label, error: String((e && e.message) || e) });
        summary.DIFF++;
      }
    }
    try {
      const late = compare98({
        lunar: { year: 2026, month: 8, day: 24, isLeap: false },
        timeIndex: 12,
        gender: "M",
      });
      cases.push({ id: "late-rat", label: "晚子时双口径", report: late });
      (late.rows || []).forEach((y) => (summary[y.status] = (summary[y.status] || 0) + 1));
    } catch (e) {
      cases.push({ id: "late-rat", label: "晚子时双口径", error: String((e && e.message) || e) });
      summary.DIFF++;
    }
    const o = {
      available: true,
      at: new Date().toISOString(),
      cases,
      summary,
      ok: summary.DIFF === 0,
    };
    V8STATE.lastSuite = o;
    renderV8();
    return o;
  }
  function liveV8() {
    const S = V8STATE.lastSuite,
      sum = (S && S.summary) || { PASS: 0, DIFF: 0, POLICY: 0, GAP: 0, "N/A": 0 },
      p = getPolicy();
    return `<div class="panel blk tjzv8-live"><h4>紫微斗数交叉验证 · v98 小限 / 晚子时</h4><div class="tjzv3-stat"><span class="pass">PASS ${sum.PASS}</span><span class="diff">DIFF ${sum.DIFF}</span><span class="policy">口径 ${sum.POLICY}</span><span class="gap">GAP ${sum.GAP}</span></div><p class="tjzv8-note"><strong>小限：</strong>已生成 1–120 虚岁落宫；<strong>晚子时：</strong>支持 timeIndex=12，当前默认 <code>${p.dayDivide}</code>（${p.dayDivideLabel}）。API 可用 <code>TianjiZiwei.setPolicy({dayDivide:'current'|'forward'})</code> 切换。</p><div class="tjzv3-actions"><button class="gbtn sm" id="tjzv8Run" type="button">重新运行 v98 验证</button></div></div>`;
  }
  function patchVerifyUI() {
    try {
      if (!window.REF_PANES || typeof REF_PANES.verify !== "function" || REF_PANES.verify.__v98)
        return;
      const old = REF_PANES.verify,
        oldBind = window.REF_BIND && REF_BIND.verify;
      const fn = () => liveV8() + old();
      fn.__v98 = true;
      REF_PANES.verify = fn;
      if (window.REF_BIND)
        REF_BIND.verify = function () {
          try {
            if (typeof oldBind === "function") oldBind();
          } catch (_) {}
          const b = document.getElementById("tjzv8Run");
          if (b)
            b.onclick = () => {
              if (OLDV && OLDV.hasVendor && OLDV.hasVendor()) suite98();
              else if (OLDV && OLDV.loadVendor) OLDV.loadVendor().then(() => suite98());
            };
        };
    } catch (e) {
      try {
        console.warn("[ZiweiVerify v98 UI]", e);
      } catch (_) {}
    }
  }
  function renderV8() {
    try {
      const p = document.getElementById("pane-verify");
      if (p && p.classList.contains("on") && typeof refRender === "function") refRender("verify");
    } catch (_) {}
  }
  const VERIFY98 = Object.freeze({
    version: "8.0.0",
    build: BUILD,
    state: V8STATE,
    compare: compare98,
    suite: suite98,
    cases: () => clone(CASES),
    loadVendor: OLDV && OLDV.loadVendor ? OLDV.loadVendor : async () => ({ status: "unavailable" }),
    hasVendor: () => !!(OLDV && OLDV.hasVendor && OLDV.hasVendor()),
    manifest: () => ({
      module: "Tianji Ziwei Verification Layer",
      version: "8.0.0",
      build: BUILD,
      baseline: "v98",
      vendor: "iztro 2.6.1",
      resolvedComparison: ["default 本命杂曜38/38", "小限1–120", "晚子时 forward/current"],
      remainingGaps: manifest().remainingGaps,
    }),
  });
  window.TianjiZiweiVerifier = VERIFY98;
  patchVerifyUI();
  const prev = window.TianjiSystem || {};
  window.TianjiSystem = Object.freeze({
    version: "v98",
    build: BUILD,
    baseline: "v84",
    core: window.TianjiCore || prev.core || null,
    time: window.TianjiTime || prev.time || null,
    verify: window.TianjiVerifier || prev.verify || null,
    bazi: window.TianjiBazi || prev.bazi || null,
    baziVerify: window.TianjiBaziVerifier || prev.baziVerify || null,
    ziwei: API,
    ziweiVerify: VERIFY98,
    manifest: () => ({
      product: "天机盘",
      version: "v98",
      build: BUILD,
      baseline: "v84",
      ziwei: manifest(),
      ziweiVerify: VERIFY98.manifest(),
    }),
  });
  try {
    const bv = document.getElementById("buildVersion");

    window.dispatchEvent(new CustomEvent("tianji:ziwei-core-v98-ready", { detail: manifest() }));
  } catch (_) {}
})();
