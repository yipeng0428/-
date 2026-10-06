(() => {
  "use strict";
  const BUILD = "2026-10-04 09:25:48",
    VERSION = "1.6.0",
    SCHEMA = "tianji.ziwei/1.6",
    CAPABILITY = "enhanced-adjective-complete-default";
  const BASE = window.TianjiZiwei;
  if (!BASE || typeof BASE.calculate !== "function") {
    try {
      console.warn("[TianjiZiwei v97] v96 core unavailable");
    } catch (_) {}
    return;
  }
  const ZHIS = "子丑寅卯辰巳午未申酉戌亥".split("");
  const BATCH4 = ["天伤", "天使", "年解"];
  const NATURE = { 天伤: "adjective", 天使: "adjective", 年解: "helper" };
  /* Rule provenance / cross-check:
   SylarLong/iztro v2.6.1, tag commit b78dfe391f65e938d79f2419dddb80f74c6bbb8e, MIT License.
   Cross-checked source files: src/star/location.ts, src/star/adjectiveStar.ts, src/data/constants.ts.
   Default/common algorithm only. Tianji uses 子=0 canonical branch index; iztro uses 寅=0 palace-array index.
   天伤 = 交友/仆役宫；天使 = 疾厄宫。中州派阴男阳女互换规则不在 v97 启用。
*/
  const clone = (o) => {
      try {
        return structuredClone(o);
      } catch (_) {
        return JSON.parse(JSON.stringify(o));
      }
    },
    mod = (a, n) => ((a % n) + n) % n;
  function batch4Positions(base) {
    const life = base.lifePalace.branchIndex,
      yb =
        base.yearBranch && Number.isInteger(base.yearBranch.index)
          ? base.yearBranch.index
          : mod(base.input.lunar.year - 4, 12);
    return { 天伤: mod(life + 5, 12), 天使: mod(life + 7, 12), 年解: mod(10 - yb, 12) };
  }
  function enhance(input = {}) {
    const base = clone(BASE.calculate(input)),
      pos = batch4Positions(base),
      byBranch = {};
    base.palaces.forEach((p) => (byBranch[p.branchIndex] = p));
    for (const p of base.palaces) {
      if (!Array.isArray(p.adjectiveStars)) p.adjectiveStars = [];
    }
    for (const name of BATCH4) {
      const b = pos[name],
        p = byBranch[b];
      if (!p) continue;
      let s = (p.adjectiveStars || []).find((x) => x.name === name);
      if (!s) {
        s = {
          name,
          type: NATURE[name] || "adjective",
          category: "adjective",
          nature: NATURE[name] || "adjective",
          scope: "origin",
        };
        p.adjectiveStars.push(s);
      } else {
        s.category = "adjective";
        s.nature = s.nature || NATURE[name] || "adjective";
        s.scope = s.scope || "origin";
      }
      if (Array.isArray(p.stars) && !p.stars.some((x) => x.name === name)) p.stars.push(clone(s));
    }
    const oldAdj = base.adjectiveStars || {},
      oldPos = oldAdj.positions || {},
      oldNames = Array.isArray(oldAdj.names) ? oldAdj.names : [];
    const names = [...new Set([...oldNames, ...BATCH4])];
    base.schema = SCHEMA;
    base.version = VERSION;
    base.build = BUILD;
    base.capability = CAPABILITY;
    base.adjectiveStars = {
      batch: "v97-default-complete",
      batches: [...(oldAdj.batches || ["v94-batch1", "v95-batch2", "v96-batch3"]), "v97-batch4"],
      count: names.length,
      names,
      positions: Object.assign({}, oldPos, pos),
      batch4: { classCount: 3, starCount: 3, names: clone(BATCH4), positions: clone(pos) },
      defaultComplete: names.length === 38,
    };
    base.coverage = Object.assign({}, base.coverage || {}, {
      adjectiveStarsBatch4: true,
      adjectiveStarsImplemented: names.length,
      adjectiveStarsDefaultComplete: names.length === 38,
    });
    base.coverage.remaining = (base.coverage.remaining || []).filter(
      (x) => !/杂曜系统收尾|天伤\s*\/\s*天使\s*\/\s*年解/.test(x),
    );
    base.policy = Object.assign({}, base.policy || {}, {
      adjectiveStarsBatch4: {
        mode: "batch4-default",
        label: "天伤 / 天使 / 年解",
        note: "default 口径：天伤居交友/仆役宫，天使居疾厄宫；年解按生年支从戌逆数。中州派天伤天使互换规则留给流派层。",
      },
    });
    return base;
  }
  function fromLegacy(lunar, hb, gender) {
    return BASE.fromLegacy(lunar, hb, gender);
  }
  function fromTimeContext(ctx, input = {}) {
    const r = BASE.fromTimeContext(ctx, input);
    return enhance({
      lunar: r.input.lunar,
      hourBranchIndex: r.input.hourBranchIndex,
      gender: r.input.gender,
    });
  }
  function directRulesTest() {
    const mk = (life, yb) =>
      batch4Positions({
        lifePalace: { branchIndex: life },
        yearBranch: { index: yb },
        input: { lunar: { year: 2000 } },
      });
    const a = mk(6, 4),
      b = mk(0, 0),
      c = mk(11, 11);
    return {
      caseA: a.天伤 === 11 && a.天使 === 1 && a.年解 === 6,
      caseB: b.天伤 === 5 && b.天使 === 7 && b.年解 === 10,
      caseC: c.天伤 === 4 && c.天使 === 6 && c.年解 === 11,
      friendsHealthOffset: ZHIS[mod(3 + 5, 12)] === "申" && ZHIS[mod(3 + 7, 12)] === "戌",
    };
  }
  function selfTest() {
    const cases = [
        ["base-M", { year: 1986, month: 4, day: 28, isLeap: false }, 9, "M"],
        ["base-F", { year: 1986, month: 4, day: 28, isLeap: false }, 9, "F"],
        ["zi", { year: 2026, month: 8, day: 24, isLeap: false }, 0, "M"],
        ["hai", { year: 2026, month: 8, day: 24, isLeap: false }, 11, "F"],
        ["leap15", { year: 2025, month: 6, day: 15, isLeap: true }, 5, "M"],
        ["leap16", { year: 2025, month: 6, day: 16, isLeap: true }, 5, "M"],
        ["m12", { year: 2033, month: 12, day: 29, isLeap: false }, 7, "F"],
      ],
      checks = [];
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
      const x = {
          lunar: { year: 1986, month: 4, day: 28, isLeap: false },
          hourBranchIndex: 9,
          gender: "M",
        },
        old = BASE.calculate(x),
        r = enhance(x);
      const keep = (p) => ({
        majorStars: p.majorStars,
        minorStars: p.minorStars,
        changsheng12: p.changsheng12,
        boshi12: p.boshi12,
        jiangqian12: p.jiangqian12,
        suiqian12: p.suiqian12,
        decadal: p.decadal,
        oldAdj: (p.adjectiveStars || []).filter((s) => !BATCH4.includes(s.name)),
      });
      const oldKeep = old.palaces.map((p) => ({
        majorStars: p.majorStars,
        minorStars: p.minorStars,
        changsheng12: p.changsheng12,
        boshi12: p.boshi12,
        jiangqian12: p.jiangqian12,
        suiqian12: p.suiqian12,
        decadal: p.decadal,
        oldAdj: p.adjectiveStars || [],
      }));
      checks.push({
        id: "v96.fields-preserved",
        ok: JSON.stringify(oldKeep) === JSON.stringify(r.palaces.map(keep)),
      });
      const names = r.palaces
        .flatMap((p) => p.adjectiveStars || [])
        .map((s) => s.name)
        .filter((n) => BATCH4.includes(n));
      checks.push({
        id: "adjective.batch4.count",
        ok: names.length === 3 && new Set(names).size === 3,
      });
      checks.push({
        id: "adjective.batch4.positions",
        ok: BATCH4.every((n) => Number.isInteger(r.adjectiveStars.positions[n])),
      });
      checks.push({
        id: "adjective.default38",
        ok:
          r.adjectiveStars.count === 38 &&
          r.adjectiveStars.names.length === 38 &&
          r.adjectiveStars.defaultComplete === true,
      });
    } catch (e) {
      checks.push({ id: "enhanced.shape", ok: false, error: String((e && e.message) || e) });
    }
    const d = directRulesTest();
    Object.entries(d).forEach(([k, v]) => checks.push({ id: "reference." + k, ok: !!v }));
    return { ok: checks.every((x) => x.ok), checks, version: VERSION, build: BUILD };
  }
  const TEST = selfTest();
  function manifest() {
    return {
      module: "Tianji Ziwei Core",
      version: VERSION,
      schema: SCHEMA,
      build: BUILD,
      baseline: "v96",
      capability: CAPABILITY,
      selfTest: clone(TEST),
      resolvedGaps: ["default 本命杂曜收尾：天伤 / 天使 / 年解"],
      resolvedStars: clone(BATCH4),
      implementedAdjectiveStars: 38,
      defaultAdjectiveComplete: true,
      remainingGaps: ["小限", "晚子时", "中州派算法与流派切换"],
      reference: {
        name: "SylarLong/iztro",
        version: "2.6.1",
        tagCommit: "b78dfe391f65e938d79f2419dddb80f74c6bbb8e",
        license: "MIT",
        files: ["src/star/location.ts", "src/star/adjectiveStar.ts", "src/data/constants.ts"],
        role: "deterministic-rule cross-check",
      },
    };
  }
  const API = Object.freeze({
    version: VERSION,
    schema: SCHEMA,
    build: BUILD,
    capability: CAPABILITY,
    calculate: enhance,
    fromLegacy,
    fromTimeContext,
    batch4Positions: (x) => clone(batch4Positions(BASE.calculate(x || {}))),
    selfTest: () => clone(TEST),
    manifest,
    base: BASE,
  });
  window.TianjiZiwei = API;
  if (TEST.ok) window.calcZiwei = (lunar, hb, gender) => fromLegacy(lunar, hb, gender);
  try {
    if (window.TianjiCore) {
      TianjiCore.registerSource({
        id: "tianji-v97-ziwei-adjective-complete",
        type: "internal",
        title: "Tianji Ziwei Core 1.6 Default Adjective Stars Complete",
        version: VERSION,
        baseline: "v96",
      });
      TianjiCore.registerSource({
        id: "iztro-2.6.1-adjective-final-reference",
        type: "third-party-reference",
        title: "SylarLong/iztro v2.6.1 final default adjective-star rules",
        version: "2.6.1",
        license: "MIT",
        repository: "SylarLong/iztro",
        commit: "b78dfe391f65e938d79f2419dddb80f74c6bbb8e",
        role: "rule-reference",
        note: "v97 交叉核对天伤、天使、年解；不作为 Tianji 主运行时。",
      });
      TianjiCore.registerEngine(
        {
          id: "ziwei.core.v1.6",
          system: "ziwei",
          name: "Tianji Ziwei Core 1.6",
          version: VERSION,
          source: "tianji-v97-ziwei-adjective-complete",
          doctrine: "default + natal adjective stars 38/38",
          status: "active",
        },
        (input) => enhance(input || {}),
      );
    }
  } catch (e) {
    try {
      console.warn("[TianjiZiwei v97] registry", e);
    } catch (_) {}
  }
  try {
    const old =
      document.getElementById("tjZiweiV6Badge") || document.getElementById("buildVersion");
    let b = document.getElementById("tjZiweiV7Badge");
    if (!b && old) {
      b = document.createElement("span");
      b.id = "tjZiweiV7Badge";
      old.insertAdjacentElement("afterend", b);
    }
    if (b) {
      b.textContent = "ZiweiCore 1.6 · 杂曜 38/38";
      b.classList.toggle("warn", !TEST.ok);
      b.title = TEST.ok
        ? "v97：default 本命杂曜 38/38 已通过回归"
        : "v97 杂曜收尾自检失败；legacy calcZiwei 保持兼容";
    }
  } catch (_) {}

  /* ---- v97-aware iztro verifier：default 本命杂曜 38/38 ---- */
  const OLDV = window.TianjiZiweiVerifier;
  function eq(a, b) {
    return JSON.stringify(a) === JSON.stringify(b);
  }
  function mapBy(ps, key) {
    const o = {};
    (ps || []).forEach((p) => (o[p[key]] = p));
    return o;
  }
  function namesOf(p, field, filterSet) {
    return ((p && p[field]) || [])
      .map((s) => (s && s.name) || "")
      .filter((n) => n && (!filterSet || filterSet.has(n)))
      .sort((a, b) => a.localeCompare(b, "zh-CN"));
  }
  function compare97(input = {}) {
    if (!(OLDV && OLDV.compare))
      return { available: false, ok: false, reason: "v96 verifier unavailable" };
    const r = OLDV.compare(input);
    if (!r || !r.available) return r;
    const n = {
        lunar: clone(input.lunar),
        hourBranchIndex: Number(input.hourBranchIndex ?? input.hourBranch),
        gender: input.gender === "F" ? "F" : "M",
      },
      c = enhance(n),
      v = r.raw && r.raw.verifier;
    r.raw.primary = c;
    const pm = mapBy(c.palaces, "branch"),
      vm = mapBy(v && v.palaces, "earthlyBranch"),
      set = new Set(BATCH4),
      all = new Set(c.adjectiveStars.names),
      branches = ZHIS;
    const rows = (r.rows || []).filter((x) => x.id !== "gap.adjective.remaining");
    const a = branches.map((z) => [z, namesOf(pm[z], "adjectiveStars", set)]),
      b = branches.map((z) => [z, namesOf(vm[z], "adjectiveStars", set)]);
    rows.push({
      id: "adjective.batch4",
      label: "杂曜收尾：天伤 / 天使 / 年解",
      primary: a,
      verifier: b,
      status: eq(a, b) ? "PASS" : "DIFF",
      note: "default 口径比较；中州派天伤/天使换位不在本轮。",
    });
    const extra = [
      ...new Set(
        ((v && v.palaces) || [])
          .flatMap((p) => (p.adjectiveStars || []).map((s) => s.name))
          .filter((n) => n && !all.has(n)),
      ),
    ].sort((x, y) => x.localeCompare(y, "zh-CN"));
    rows.push({
      id: "adjective.default.complete",
      label: "default 本命杂曜完整度",
      primary: "38 / 38",
      verifier: extra.length ? { uncovered: extra } : { uncovered: [], status: "complete" },
      status: extra.length ? "GAP" : "PASS",
      note: "v97 已完成 Tianji default 本命 38 杂曜；第三方若仍有未覆盖星曜则保留 GAP。",
    });
    const counts = { PASS: 0, DIFF: 0, POLICY: 0, GAP: 0, "N/A": 0 };
    rows.forEach((x) => (counts[x.status] = (counts[x.status] || 0) + 1));
    r.rows = rows;
    r.counts = counts;
    r.ok = counts.DIFF === 0;
    return r;
  }
  const CASES = OLDV && OLDV.cases ? OLDV.cases() : [],
    V7STATE = { lastSuite: null };
  function suite97() {
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
        const r = compare97({ lunar: x.l, hourBranchIndex: x.h, gender: x.g });
        cases.push({ id: x.id, label: x.label, report: r });
        r.rows.forEach((y) => (summary[y.status] = (summary[y.status] || 0) + 1));
      } catch (e) {
        cases.push({ id: x.id, label: x.label, error: String((e && e.message) || e) });
        summary.DIFF++;
      }
    }
    const o = {
      available: true,
      at: new Date().toISOString(),
      cases,
      summary,
      ok: summary.DIFF === 0,
    };
    V7STATE.lastSuite = o;
    renderV7();
    return o;
  }
  function liveV7() {
    const S = V7STATE.lastSuite,
      sum = (S && S.summary) || { PASS: 0, DIFF: 0, POLICY: 0, GAP: 0, "N/A": 0 };
    return `<div class="panel blk tjzv7-live"><h4>紫微斗数交叉验证 · v97 本命杂曜收尾</h4><div class="tjzv3-stat"><span class="pass">PASS ${sum.PASS}</span><span class="diff">DIFF ${sum.DIFF}</span><span class="policy">口径 ${sum.POLICY}</span><span class="gap">GAP ${sum.GAP}</span></div><p class="tjzv7-note"><strong>本轮进入实测：</strong>天伤、天使、年解。Tianji default 本命杂曜现已实现 38/38；后续不再继续堆本命星曜，转向小限、晚子时和流派口径层。</p><div class="tjzv3-actions"><button class="gbtn sm" id="tjzv7Run" type="button">重新运行 v97 验证</button></div></div>`;
  }
  function patchVerifyUI() {
    try {
      if (!window.REF_PANES || typeof REF_PANES.verify !== "function" || REF_PANES.verify.__v97)
        return;
      const old = REF_PANES.verify,
        oldBind = window.REF_BIND && REF_BIND.verify;
      const fn = () => liveV7() + old();
      fn.__v97 = true;
      REF_PANES.verify = fn;
      if (window.REF_BIND)
        REF_BIND.verify = function () {
          try {
            if (typeof oldBind === "function") oldBind();
          } catch (_) {}
          const b = document.getElementById("tjzv7Run");
          if (b)
            b.onclick = () => {
              if (OLDV && OLDV.hasVendor && OLDV.hasVendor()) suite97();
              else if (OLDV && OLDV.loadVendor) OLDV.loadVendor().then(() => suite97());
            };
        };
    } catch (e) {
      try {
        console.warn("[ZiweiVerify v97 UI]", e);
      } catch (_) {}
    }
  }
  function renderV7() {
    try {
      const p = document.getElementById("pane-verify");
      if (p && p.classList.contains("on") && typeof refRender === "function") refRender("verify");
    } catch (_) {}
  }
  const VERIFY97 = Object.freeze({
    version: "7.0.0",
    build: BUILD,
    state: V7STATE,
    compare: compare97,
    suite: suite97,
    cases: () => clone(CASES),
    loadVendor: OLDV && OLDV.loadVendor ? OLDV.loadVendor : async () => ({ status: "unavailable" }),
    hasVendor: () => !!(OLDV && OLDV.hasVendor && OLDV.hasVendor()),
    manifest: () => ({
      module: "Tianji Ziwei Verification Layer",
      version: "7.0.0",
      build: BUILD,
      baseline: "v97",
      vendor: "iztro 2.6.1",
      resolvedComparison: [
        "十四辅星",
        "庙旺",
        "长生十二神",
        "标准化大限",
        "博士十二神",
        "将前十二神",
        "岁前十二神",
        "命主/身主",
        "default 本命杂曜38/38",
      ],
      remainingGaps: manifest().remainingGaps,
    }),
  });
  window.TianjiZiweiVerifier = VERIFY97;
  patchVerifyUI();
  const prev = window.TianjiSystem || {};
  window.TianjiSystem = Object.freeze({
    version: "v97",
    build: BUILD,
    baseline: "v84",
    core: window.TianjiCore || prev.core || null,
    time: window.TianjiTime || prev.time || null,
    verify: window.TianjiVerifier || prev.verify || null,
    bazi: window.TianjiBazi || prev.bazi || null,
    baziVerify: window.TianjiBaziVerifier || prev.baziVerify || null,
    ziwei: API,
    ziweiVerify: VERIFY97,
    manifest: () => ({
      product: "天机盘",
      version: "v97",
      build: BUILD,
      baseline: "v84",
      ziwei: manifest(),
      ziweiVerify: VERIFY97.manifest(),
    }),
  });
  try {
    const bv = document.getElementById("buildVersion");

    window.dispatchEvent(new CustomEvent("tianji:ziwei-core-v97-ready", { detail: manifest() }));
  } catch (_) {}
})();
