(() => {
  "use strict";
  const BUILD = "2026-10-04 09:59:42",
    VERSION = "1.10.0",
    SCHEMA = "tianji.ziwei/1.10",
    CAPABILITY = "minor-period-target-date-age-divide";
  const BASE = window.TianjiZiwei;
  if (!BASE || typeof BASE.calculate !== "function") {
    try {
      console.warn("[TianjiZiwei v101] v100 core unavailable");
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
  };
  function findHelper(name) {
    let x = BASE,
      n = 0;
    while (x && n++ < 30) {
      if (typeof x[name] === "function") return x[name];
      x = x.base;
    }
    return null;
  }
  const GET_POLICY = findHelper("getPolicy"),
    SET_POLICY = findHelper("setPolicy"),
    MINOR_BY_AGE = findHelper("minorPeriodForAge");
  function normalizeAgeDivide(x) {
    return String(x || "normal") === "birthday" ? "birthday" : "normal";
  }
  function getPolicy() {
    try {
      const p = GET_POLICY ? GET_POLICY() : {};
      return clone(p || {});
    } catch (_) {
      return { minorPeriod: { ageDivide: "normal" } };
    }
  }
  function getAgeDivide() {
    const p = getPolicy();
    return normalizeAgeDivide(
      (p && p.minorPeriod && p.minorPeriod.ageDivide) || (p && p.ageDivide) || "normal",
    );
  }
  function setPolicy(p = {}) {
    if (!SET_POLICY) throw new Error("ZiweiCore v101: v98 policy adapter unavailable");
    return SET_POLICY(p);
  }
  function setAgeDivide(mode) {
    mode = normalizeAgeDivide(mode);
    setPolicy({ ageDivide: mode, minorPeriod: { ageDivide: mode } });
    return getAgeDivide();
  }
  function normalizeSolarDate(v) {
    let y, m, d;
    if (v instanceof Date) {
      y = v.getFullYear();
      m = v.getMonth() + 1;
      d = v.getDate();
    } else if (typeof v === "string") {
      const x = v.trim().match(/^(\d{4})[-\/.](\d{1,2})[-\/.](\d{1,2})/);
      if (!x) throw new Error("ZiweiCore v101: target date must begin with YYYY-MM-DD");
      y = +x[1];
      m = +x[2];
      d = +x[3];
    } else if (v && typeof v === "object") {
      y = +(v.year ?? v.y);
      m = +(v.month ?? v.m);
      d = +(v.day ?? v.d);
    }
    if (!Number.isInteger(y) || !Number.isInteger(m) || !Number.isInteger(d))
      throw new Error("ZiweiCore v101: invalid target solar date");
    if (y < 1900 || y > 2100)
      throw new Error("ZiweiCore v101: target date outside built-in lunar range 1900-2100");
    const dt = new Date(Date.UTC(y, m - 1, d));
    if (dt.getUTCFullYear() !== y || dt.getUTCMonth() + 1 !== m || dt.getUTCDate() !== d)
      throw new Error("ZiweiCore v101: invalid Gregorian date");
    return {
      year: y,
      month: m,
      day: d,
      iso: `${String(y).padStart(4, "0")}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
    };
  }
  function targetLunar(solar) {
    if (typeof window.solar2lunar !== "function")
      throw new Error("ZiweiCore v101: solar2lunar adapter unavailable");
    const x = window.solar2lunar(solar.year, solar.month, solar.day);
    return { year: +x.year, month: +x.month, day: +x.day, isLeap: !!x.isLeap };
  }
  function birthLunar(chart) {
    const l = chart && chart.input && chart.input.lunar;
    if (!l) throw new Error("ZiweiCore v101: birth lunar date unavailable");
    return { year: +l.year, month: +l.month, day: +l.day, isLeap: !!l.isLeap };
  }
  function birthdayState(birth, target) {
    const same = target.month === birth.month && target.day === birth.day,
      after =
        target.month > birth.month || (target.month === birth.month && target.day > birth.day);
    return {
      sameMonthDay: same,
      afterMonthDay: after,
      boundary: same ? "on-birthday" : after ? "after-birthday" : "before-birthday",
      note: same
        ? "生日当日仍属前一虚岁；次日起进一岁"
        : after
          ? "已过农历生日，birthday 模式进一岁"
          : "尚未越过农历生日",
    };
  }
  function nominalAgeFromLunar(birth, target, ageDivide) {
    const mode = normalizeAgeDivide(ageDivide),
      years = target.year - birth.year;
    if (years < 0) throw new Error("ZiweiCore v101: target date precedes birth year");
    const b = birthdayState(birth, target);
    let age = years;
    if (mode === "normal") age += 1;
    else if (b.afterMonthDay) age += 1;
    return {
      nominalAge: age,
      ageDivide: mode,
      ageDivideLabel: mode === "birthday" ? "农历生日分界" : "自然年分界",
      yearDifference: years,
      birthday: b,
      birthdayLeapHandling: "month-day-ignore-leap-flag",
    };
  }
  function normalizeChart(chartOrInput, ageDivide) {
    if (chartOrInput && Array.isArray(chartOrInput.palaces)) return chartOrInput;
    const input = Object.assign({}, chartOrInput || {}),
      zp = Object.assign({}, input.ziweiPolicy || {}, {
        ageDivide,
        minorPeriod: Object.assign({}, (input.ziweiPolicy && input.ziweiPolicy.minorPeriod) || {}, {
          ageDivide,
        }),
      });
    input.ziweiPolicy = zp;
    return calculate(input);
  }
  function periodForAge(chart, age) {
    if (MINOR_BY_AGE) {
      try {
        return MINOR_BY_AGE(chart, age);
      } catch (_) {}
    }
    const a = Number(age),
      p = (chart.palaces || []).find((x) => Array.isArray(x.ages) && x.ages.includes(a));
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
  function minorPeriodAt(chartOrInput, target, options = {}) {
    const mode = normalizeAgeDivide(options.ageDivide || options.mode || getAgeDivide()),
      chart = normalizeChart(chartOrInput, mode),
      solar = normalizeSolarDate(target),
      lunar = targetLunar(solar),
      birth = birthLunar(chart),
      age = nominalAgeFromLunar(birth, lunar, mode),
      period = age.nominalAge >= 1 ? periodForAge(chart, age.nominalAge) : null,
      max = (chart.minorPeriod && chart.minorPeriod.maxAge) || 120;
    return {
      target: { solar, lunar },
      birth: { lunar: birth },
      age,
      minorPeriod: period,
      withinCoverage: age.nominalAge >= 1 && age.nominalAge <= max,
      maxAge: max,
      policy: {
        ageDivide: mode,
        boundaryRule: mode === "birthday" ? "农历生日次日起进一虚岁" : "农历年份变化即进一虚岁",
        leapBirthdayComparison: "仅比较农历月/日，不以闰月标志另分生日",
      },
      doctrine: clone(chart.doctrine || null),
      astroType: clone(chart.astroType || null),
    };
  }
  function nominalAgeAt(chartOrInput, target, options = {}) {
    return clone(minorPeriodAt(chartOrInput, target, options).age);
  }
  function calculate(input = {}) {
    const out = clone(BASE.calculate(input));
    out.schema = SCHEMA;
    out.version = VERSION;
    out.build = BUILD;
    out.capability = CAPABILITY;
    const mode = normalizeAgeDivide(
      (input &&
        input.ziweiPolicy &&
        (input.ziweiPolicy.ageDivide ||
          (input.ziweiPolicy.minorPeriod && input.ziweiPolicy.minorPeriod.ageDivide))) ||
        (out.minorPeriod && out.minorPeriod.ageDivide) ||
        getAgeDivide(),
    );
    out.minorPeriod = Object.assign({}, out.minorPeriod || {}, {
      ageDivide: mode,
      ageDivideLabel: mode === "birthday" ? "虚岁以农历生日为分界" : "虚岁以自然年分界",
      targetDateQuery: true,
      birthdayBoundary: "strictly-after-birthday",
    });
    out.policy = Object.assign({}, out.policy || {}, {
      minorPeriod: Object.assign({}, (out.policy && out.policy.minorPeriod) || {}, out.minorPeriod),
    });
    out.coverage = Object.assign({}, out.coverage || {}, {
      minorPeriodTargetDate: true,
      ageDivideNormal: true,
      ageDivideBirthday: true,
    });
    return out;
  }
  function fromTimeContext(ctx, input = {}) {
    const out = clone(BASE.fromTimeContext(ctx, input));
    out.schema = SCHEMA;
    out.version = VERSION;
    out.build = BUILD;
    out.capability = CAPABILITY;
    out.coverage = Object.assign({}, out.coverage || {}, {
      minorPeriodTargetDate: true,
      ageDivideNormal: true,
      ageDivideBirthday: true,
    });
    return out;
  }
  function fromLegacy(lunar, hb, gender) {
    return BASE.fromLegacy(lunar, hb, gender);
  }
  function selfTest() {
    const checks = [],
      birth = {
        lunar: { year: 2000, month: 7, day: 17, isLeap: false },
        hourBranchIndex: 2,
        gender: "F",
      };
    try {
      const a = BASE.calculate(
          Object.assign({}, birth, {
            ziweiDoctrine: { algorithm: "default", astroType: "heaven" },
          }),
        ),
        b = calculate(
          Object.assign({}, birth, {
            ziweiDoctrine: { algorithm: "default", astroType: "heaven" },
          }),
        );
      const fp = (x) =>
        JSON.stringify({
          life: x.lifePalace,
          body: x.bodyPalace,
          bureau: x.bureau,
          major: (x.palaces || []).map((p) => [p.branch, (p.majorStars || []).map((s) => s.name)]),
          adj: x.adjectiveStars && x.adjectiveStars.positions,
        });
      checks.push({ id: "v100.core-preserved", ok: fp(a) === fp(b) });
    } catch (e) {
      checks.push({ id: "v100.core-preserved", ok: false, error: String((e && e.message) || e) });
    }
    try {
      const q1 = minorPeriodAt(birth, "2023-08-31", { ageDivide: "normal" }),
        q2 = minorPeriodAt(birth, "2023-08-31", { ageDivide: "birthday" }),
        q3 = minorPeriodAt(birth, "2023-09-01", { ageDivide: "birthday" }),
        q4 = minorPeriodAt(birth, "2023-09-02", { ageDivide: "birthday" });
      checks.push({ id: "age.normal.year-boundary", ok: q1.age.nominalAge === 24 });
      checks.push({
        id: "age.birthday.before",
        ok: q2.age.nominalAge === 23 && q2.target.lunar.month === 7 && q2.target.lunar.day === 16,
      });
      checks.push({
        id: "age.birthday.on",
        ok: q3.age.nominalAge === 23 && q3.age.birthday.boundary === "on-birthday",
      });
      checks.push({
        id: "age.birthday.after",
        ok: q4.age.nominalAge === 24 && q4.age.birthday.boundary === "after-birthday",
      });
      checks.push({
        id: "minor.period-query",
        ok: !!q4.minorPeriod && q4.minorPeriod.nominalAge === 24,
      });
    } catch (e) {
      checks.push({ id: "age-boundary-suite", ok: false, error: String((e && e.message) || e) });
    }
    try {
      const q = minorPeriodAt(
        {
          lunar: { year: 1986, month: 4, day: 28, isLeap: false },
          hourBranchIndex: 9,
          gender: "M",
        },
        "2026-10-04",
        { ageDivide: "normal" },
      );
      checks.push({
        id: "target.structure",
        ok:
          !!q.target.solar.iso &&
          !!q.target.lunar &&
          q.withinCoverage === true &&
          q.age.nominalAge > 0,
      });
    } catch (e) {
      checks.push({ id: "target.structure", ok: false, error: String((e && e.message) || e) });
    }
    try {
      const h = calculate({
          lunar: { year: 1986, month: 4, day: 28, isLeap: false },
          hourBranchIndex: 9,
          gender: "M",
          ziweiDoctrine: { algorithm: "zhongzhou", astroType: "earth" },
        }),
        q = minorPeriodAt(h, "2026-10-04", { ageDivide: "normal" });
      checks.push({
        id: "zhongzhou.earth-compatible",
        ok:
          q.doctrine &&
          q.doctrine.algorithm === "zhongzhou" &&
          q.astroType &&
          q.astroType.id === "earth" &&
          !!q.minorPeriod,
      });
    } catch (e) {
      checks.push({
        id: "zhongzhou.earth-compatible",
        ok: false,
        error: String((e && e.message) || e),
      });
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
      baseline: "v100",
      capability: CAPABILITY,
      selfTest: clone(TEST),
      doctrine: BASE.getDoctrine ? BASE.getDoctrine() : null,
      resolvedGaps: [
        ...(prev.resolvedGaps || []),
        "小限 normal 目标日期判定",
        "小限 birthday 农历生日分界",
        "目标日期→虚岁→小限宫查询",
      ],
      remainingGaps: [
        "大限/小限目标日期联合查询",
        "流年/流月/流日/流时完整运限层",
        "闰月生日更细流派口径",
      ],
      reference: {
        name: "SylarLong/iztro",
        version: "2.6.1",
        tagCommit: "b78dfe391f65e938d79f2419dddb80f74c6bbb8e",
        license: "MIT",
        files: [
          "src/astro/FunctionalAstrolabe.ts#horoscope",
          "src/astro/palace.ts#getHoroscope",
          "src/__tests__/astro/astro.test.ts#nominalAge",
        ],
        role: "ageDivide deterministic rule cross-check",
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
    minorPeriodAt,
    minorPeriodForDate: minorPeriodAt,
    nominalAgeAt,
    setAgeDivide,
    getAgeDivide,
    setPolicy,
    getPolicy,
    normalizeSolarDate,
    targetLunar: (self) => clone(targetLunar(normalizeSolarDate(self))),
    selfTest: () => clone(TEST),
    manifest,
    base: BASE,
  });
  window.TianjiZiwei = API;
  if (TEST.ok) window.calcZiwei = (lunar, hb, gender) => fromLegacy(lunar, hb, gender);
  try {
    if (window.TianjiCore) {
      TianjiCore.registerSource({
        id: "tianji-v101-ziwei-age-divide",
        type: "internal",
        title: "Tianji Ziwei Core 1.10 Minor Period Target-Date / ageDivide",
        version: VERSION,
        baseline: "v100",
      });
      TianjiCore.registerSource({
        id: "iztro-2.6.1-age-divide-reference",
        type: "third-party-reference",
        title: "SylarLong/iztro v2.6.1 ageDivide reference",
        version: "2.6.1",
        license: "MIT",
        repository: "SylarLong/iztro",
        commit: "b78dfe391f65e938d79f2419dddb80f74c6bbb8e",
        role: "rule-reference",
      });
      TianjiCore.registerEngine(
        {
          id: "ziwei.core.v1.10",
          system: "ziwei",
          name: "Tianji Ziwei Core 1.10",
          version: VERSION,
          source: "tianji-v101-ziwei-age-divide",
          doctrine: "minor period target-date normal/birthday",
          status: "active",
        },
        (input) => calculate(input || {}),
      );
    }
  } catch (e) {
    try {
      console.warn("[TianjiZiwei v101] registry", e);
    } catch (_) {}
  }
  try {
    const old =
      document.getElementById("tjZiweiV10Badge") || document.getElementById("buildVersion");
    let b = document.getElementById("tjZiweiV11Badge");
    if (!b && old) {
      b = document.createElement("span");
      b.id = "tjZiweiV11Badge";
      old.insertAdjacentElement("afterend", b);
    }
    if (b) {
      b.textContent = "ZiweiCore 1.10 · 小限日期";
      b.classList.toggle("warn", !TEST.ok);
      b.title = TEST.ok
        ? "v101：normal/birthday 目标日期小限判定已通过回归"
        : "v101 小限日期层自检失败；v100 核心保持兼容";
    }
  } catch (_) {}
  /* ---- v101-aware iztro ageDivide verifier ---- */
  const OLDV = window.TianjiZiweiVerifier,
    V11STATE = { lastSuite: null };
  function eq(a, b) {
    return JSON.stringify(a) === JSON.stringify(b);
  }
  function vendorAge(input, target, ageDivide) {
    if (!(window.iztro && iztro.astro && iztro.astro.byLunar)) throw new Error("iztro unavailable");
    const astro = iztro.astro,
      l = input.lunar,
      g = input.gender === "F" ? "女" : "男",
      h = Number(input.timeIndex ?? input.hourBranchIndex ?? 0),
      old = astro.getConfig ? astro.getConfig() : {};
    try {
      if (astro.config) astro.config({ ageDivide });
      const v = astro.byLunar(`${l.year}-${l.month}-${l.day}`, h, g, !!l.isLeap, true, "zh-CN"),
        hor = v.horoscope(normalizeSolarDate(target).iso),
        pj = typeof v.toJSON === "function" ? v.toJSON() : v,
        idx = hor && hor.age && hor.age.index,
        p = ((pj && pj.palaces) || [])[idx];
      return {
        nominalAge: hor && hor.age && hor.age.nominalAge,
        branch: (hor && hor.age && hor.age.earthlyBranch) || (p && p.earthlyBranch),
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
  function compareAgeDivide(input, target, ageDivide) {
    if (!(OLDV && OLDV.hasVendor && OLDV.hasVendor()))
      return { available: false, ok: false, reason: "iztro unavailable" };
    const p = minorPeriodAt(input, target, { ageDivide }),
      v = vendorAge(input, target, ageDivide),
      rows = [
        {
          id: "age.nominal",
          label: "目标日期虚岁",
          primary: p.age.nominalAge,
          verifier: v.nominalAge,
          status: eq(p.age.nominalAge, v.nominalAge) ? "PASS" : "DIFF",
        },
        {
          id: "age.palace",
          label: "目标日期小限宫",
          primary: p.minorPeriod && p.minorPeriod.branch,
          verifier: v.branch,
          status: eq(p.minorPeriod && p.minorPeriod.branch, v.branch) ? "PASS" : "DIFF",
        },
      ],
      counts = { PASS: 0, DIFF: 0 };
    rows.forEach((x) => counts[x.status]++);
    return {
      available: true,
      ok: counts.DIFF === 0,
      target: normalizeSolarDate(target),
      ageDivide,
      counts,
      rows,
      raw: { primary: p, verifier: v },
    };
  }
  function suite101() {
    if (!(OLDV && OLDV.hasVendor && OLDV.hasVendor()))
      return { available: false, cases: [], summary: { PASS: 0, DIFF: 0 }, ok: false };
    const birth = {
        lunar: { year: 2000, month: 7, day: 17, isLeap: false },
        hourBranchIndex: 2,
        gender: "F",
      },
      cases = [
        ["normal-before", "2023-08-31", "normal"],
        ["birthday-before", "2023-08-31", "birthday"],
        ["birthday-on", "2023-09-01", "birthday"],
        ["birthday-after", "2023-09-02", "birthday"],
      ],
      out = [],
      summary = { PASS: 0, DIFF: 0 };
    for (const [id, t, m] of cases) {
      try {
        const r = compareAgeDivide(birth, t, m);
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
    V11STATE.lastSuite = r;
    renderV11();
    return r;
  }
  function liveV11() {
    const mode = getAgeDivide(),
      s = V11STATE.lastSuite,
      sum = (s && s.summary) || { PASS: 0, DIFF: 0 };
    return `<div class="panel blk tjzv11-live"><h4>小限目标日期 · v101</h4><div class="tjzv3-stat"><span class="pass">PASS ${sum.PASS || 0}</span><span class="diff">DIFF ${sum.DIFF || 0}</span></div><div class="tjzv11-grid"><div class="tjzv11-card"><b>当前 ageDivide</b><br>${mode === "birthday" ? "birthday · 农历生日分界" : "normal · 自然年分界"}</div><div class="tjzv11-card"><b>birthday 边界</b><br>生日当天仍属前一虚岁<br>生日次日起进一岁</div><div class="tjzv11-card"><b>API</b><br>minorPeriodAt(chart, date)<br>nominalAgeAt(chart, date)</div></div><div class="tjzv11-actions"><button class="gbtn sm ${mode === "normal" ? "on" : ""}" id="tjzv11Normal" type="button">自然年 normal</button><button class="gbtn sm ${mode === "birthday" ? "on" : ""}" id="tjzv11Birthday" type="button">农历生日 birthday</button><button class="gbtn sm" id="tjzv11Run" type="button">验证日期边界</button></div></div>`;
  }
  function patchVerifyUI() {
    try {
      if (!window.REF_PANES || typeof REF_PANES.verify !== "function" || REF_PANES.verify.__v101)
        return;
      const old = REF_PANES.verify,
        oldBind = window.REF_BIND && REF_BIND.verify;
      const fn = () => liveV11() + old();
      fn.__v101 = true;
      REF_PANES.verify = fn;
      if (window.REF_BIND)
        REF_BIND.verify = function () {
          try {
            if (typeof oldBind === "function") oldBind();
          } catch (_) {}
          const n = document.getElementById("tjzv11Normal"),
            b = document.getElementById("tjzv11Birthday"),
            r = document.getElementById("tjzv11Run");
          if (n)
            n.onclick = () => {
              setAgeDivide("normal");
              renderV11();
            };
          if (b)
            b.onclick = () => {
              setAgeDivide("birthday");
              renderV11();
            };
          if (r)
            r.onclick = () => {
              if (OLDV && OLDV.hasVendor && OLDV.hasVendor()) suite101();
              else if (OLDV && OLDV.loadVendor) OLDV.loadVendor().then(() => suite101());
            };
        };
    } catch (e) {
      try {
        console.warn("[ZiweiVerify v101 UI]", e);
      } catch (_) {}
    }
  }
  function renderV11() {
    try {
      const p = document.getElementById("pane-verify");
      if (p && p.classList.contains("on") && typeof refRender === "function") refRender("verify");
    } catch (_) {}
  }
  const VERIFY101 = Object.freeze({
    version: "11.0.0",
    build: BUILD,
    state: V11STATE,
    compareAgeDivide,
    suite: suite101,
    loadVendor: OLDV && OLDV.loadVendor ? OLDV.loadVendor : async () => ({ status: "unavailable" }),
    hasVendor: () => !!(OLDV && OLDV.hasVendor && OLDV.hasVendor()),
    manifest: () => ({
      module: "Tianji Ziwei Verification Layer",
      version: "11.0.0",
      build: BUILD,
      baseline: "v101",
      vendor: "iztro 2.6.1",
      resolvedComparison: ["minor period target date", "ageDivide normal/birthday"],
      remainingGaps: manifest().remainingGaps,
    }),
  });
  window.TianjiZiweiVerifier = VERIFY101;
  patchVerifyUI();
  const prev = window.TianjiSystem || {};
  window.TianjiSystem = Object.freeze({
    version: "v101",
    build: BUILD,
    baseline: "v84",
    core: window.TianjiCore || prev.core || null,
    time: window.TianjiTime || prev.time || null,
    verify: window.TianjiVerifier || prev.verify || null,
    bazi: window.TianjiBazi || prev.bazi || null,
    baziVerify: window.TianjiBaziVerifier || prev.baziVerify || null,
    ziwei: API,
    ziweiVerify: VERIFY101,
    manifest: () => ({
      product: "天机盘",
      version: "v101",
      build: BUILD,
      baseline: "v84",
      ziwei: manifest(),
      ziweiVerify: VERIFY101.manifest(),
    }),
  });
  try {
    const bv = document.getElementById("buildVersion");

    window.dispatchEvent(new CustomEvent("tianji:ziwei-core-v101-ready", { detail: manifest() }));
  } catch (_) {}
})();
