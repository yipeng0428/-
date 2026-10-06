(() => {
  "use strict";
  const BUILD = "2026-10-04 09:16:42",
    VERSION = "1.4.0",
    SCHEMA = "tianji.ziwei/1.4",
    CAPABILITY = "enhanced-adjective-batch2";
  const BASE = window.TianjiZiwei;
  if (!BASE || typeof BASE.calculate !== "function") {
    try {
      console.warn("[TianjiZiwei v95] v94 core unavailable");
    } catch (_) {}
    return;
  }
  const ZHIS = "子丑寅卯辰巳午未申酉戌亥".split("");
  const BATCH1 = ["三台", "八座", "恩光", "天贵", "红鸾", "天喜", "天刑", "天姚", "孤辰", "寡宿"];
  const BATCH2 = [
    "龙池",
    "凤阁",
    "天才",
    "天寿",
    "台辅",
    "封诰",
    "天巫",
    "华盖",
    "天官",
    "天福",
    "天厨",
    "天月",
  ];
  const IMPLEMENTED = [...BATCH1, ...BATCH2];
  /* Rule provenance / cross-check:
   SylarLong/iztro v2.6.1, tag commit b78dfe391f65e938d79f2419dddb80f74c6bbb8e, MIT License.
   Cross-checked source files: src/star/location.ts and src/star/adjectiveStar.ts.
   Index conversion is deliberate: iztro arrays are 寅=0; Tianji canonical palace indices are 子=0.
   Rules are implemented locally in Tianji; iztro remains verification/reference only.
*/
  const clone = (o) => {
      try {
        return structuredClone(o);
      } catch (_) {
        return JSON.parse(JSON.stringify(o));
      }
    },
    mod = (a, n) => ((a % n) + n) % n;
  function huagai(yearBranchIndex) {
    if ([2, 6, 10].includes(yearBranchIndex)) return 10;
    if ([8, 0, 4].includes(yearBranchIndex)) return 4;
    if ([5, 9, 1].includes(yearBranchIndex)) return 1;
    return 7;
  }
  function yearly(yearStemIndex, yearBranchIndex, lifeBranchIndex, bodyBranchIndex) {
    const tianguan = [7, 4, 5, 2, 3, 9, 11, 9, 10, 6],
      tianfu = [9, 8, 0, 11, 3, 2, 6, 5, 6, 5],
      tianchu = [5, 6, 0, 5, 6, 8, 2, 6, 9, 11];
    return {
      龙池: mod(4 + yearBranchIndex, 12),
      凤阁: mod(10 - yearBranchIndex, 12),
      天才: mod(lifeBranchIndex + yearBranchIndex, 12),
      天寿: mod(bodyBranchIndex + yearBranchIndex, 12),
      华盖: huagai(yearBranchIndex),
      天官: tianguan[yearStemIndex],
      天福: tianfu[yearStemIndex],
      天厨: tianchu[yearStemIndex],
    };
  }
  function timely(hourBranchIndex) {
    return { 台辅: mod(6 + hourBranchIndex, 12), 封诰: mod(2 + hourBranchIndex, 12) };
  }
  function monthly(effectiveMonth) {
    const mi = mod(Number(effectiveMonth) - 1, 12),
      tianwu = [5, 8, 2, 11][mi % 4],
      tianyue = [10, 5, 4, 2, 7, 3, 11, 7, 2, 6, 10, 2][mi];
    return { 天巫: tianwu, 天月: tianyue };
  }
  function batch2Positions(base) {
    const lunar = base.input.lunar,
      ys = base.yearStem.index,
      yb =
        base.yearBranch && Number.isInteger(base.yearBranch.index)
          ? base.yearBranch.index
          : mod(lunar.year - 4, 12),
      m = base.effectiveLunarMonth || lunar.month,
      hb = base.input.hourBranchIndex;
    return Object.assign(
      {},
      yearly(ys, yb, base.lifePalace.branchIndex, base.bodyPalace.branchIndex),
      timely(hb),
      monthly(m),
    );
  }
  function enhance(input = {}) {
    const base = clone(BASE.calculate(input)),
      pos = batch2Positions(base),
      byBranch = {};
    base.palaces.forEach((p) => (byBranch[p.branchIndex] = p));
    for (const p of base.palaces) {
      if (!Array.isArray(p.adjectiveStars)) p.adjectiveStars = [];
    }
    for (const name of BATCH2) {
      const b = pos[name],
        p = byBranch[b];
      if (!p) continue;
      let s = (p.adjectiveStars || []).find((x) => x.name === name);
      if (!s) {
        s = {
          name,
          type: "adjective",
          category: "adjective",
          nature: "adjective",
          scope: "origin",
        };
        p.adjectiveStars.push(s);
      } else {
        s.category = "adjective";
        s.nature = s.nature || "adjective";
        s.scope = s.scope || "origin";
      }
      if (Array.isArray(p.stars) && !p.stars.some((x) => x.name === name)) p.stars.push(clone(s));
    }
    const oldAdj = base.adjectiveStars || {},
      oldPos = oldAdj.positions || {},
      oldNames = Array.isArray(oldAdj.names) ? oldAdj.names : BATCH1;
    base.schema = SCHEMA;
    base.version = VERSION;
    base.build = BUILD;
    base.capability = CAPABILITY;
    base.adjectiveStars = {
      batch: "v95-batch1+2",
      batches: ["v94-batch1", "v95-batch2"],
      count: IMPLEMENTED.length,
      names: [...new Set([...oldNames, ...BATCH2])],
      positions: Object.assign({}, oldPos, pos),
      batch2: { count: BATCH2.length, names: clone(BATCH2), positions: clone(pos) },
    };
    base.coverage = Object.assign({}, base.coverage || {}, {
      adjectiveStarsBatch2: true,
      adjectiveStarsImplemented: IMPLEMENTED.length,
    });
    base.coverage.remaining = (base.coverage.remaining || []).filter(
      (x) => x !== "杂曜系统第二批及完整38杂曜" && x !== "杂曜系统后续批次及完整38杂曜",
    );
    if (!base.coverage.remaining.includes("杂曜系统后续批次（尚余约16星）"))
      base.coverage.remaining.unshift("杂曜系统后续批次（尚余约16星）");
    base.policy = Object.assign({}, base.policy || {}, {
      adjectiveStarsBatch2: {
        mode: "batch2-default",
        label: "龙池凤阁 / 天才天寿 / 台辅封诰 / 天巫华盖 / 天官天福天厨天月",
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
    const a = Object.assign({}, yearly(0, 0, 6, 10), timely(0), monthly(1));
    const b = Object.assign({}, yearly(9, 3, 2, 5), timely(9), monthly(6));
    return {
      caseA:
        a.龙池 === 4 &&
        a.凤阁 === 10 &&
        a.天才 === 6 &&
        a.天寿 === 10 &&
        a.台辅 === 6 &&
        a.封诰 === 2 &&
        a.天巫 === 5 &&
        a.华盖 === 4 &&
        a.天官 === 7 &&
        a.天福 === 9 &&
        a.天厨 === 5 &&
        a.天月 === 10,
      caseB:
        b.龙池 === 7 &&
        b.凤阁 === 7 &&
        b.天才 === 5 &&
        b.天寿 === 8 &&
        b.台辅 === 3 &&
        b.封诰 === 11 &&
        b.天巫 === 8 &&
        b.华盖 === 7 &&
        b.天官 === 6 &&
        b.天福 === 5 &&
        b.天厨 === 11 &&
        b.天月 === 3,
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
      });
      checks.push({
        id: "v94.fields-preserved",
        ok: JSON.stringify(old.palaces.map(keep)) === JSON.stringify(r.palaces.map(keep)),
      });
      const names = r.palaces
        .flatMap((p) => p.adjectiveStars || [])
        .map((s) => s.name)
        .filter((n) => BATCH2.includes(n));
      checks.push({
        id: "adjective.batch2.count",
        ok: names.length === 12 && new Set(names).size === 12,
      });
      checks.push({
        id: "adjective.batch2.positions",
        ok: BATCH2.every((n) => Number.isInteger(r.adjectiveStars.positions[n])),
      });
      checks.push({
        id: "adjective.total22",
        ok: IMPLEMENTED.every((n) =>
          r.palaces.some((p) => (p.adjectiveStars || []).some((s) => s.name === n)),
        ),
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
      baseline: "v94",
      capability: CAPABILITY,
      selfTest: clone(TEST),
      resolvedGaps: ["杂曜第二批12星"],
      resolvedStars: clone(BATCH2),
      implementedAdjectiveStars: IMPLEMENTED.length,
      remainingGaps: ["杂曜系统后续批次（尚余约16星）", "小限", "晚子时", "中州派算法"],
      reference: {
        name: "SylarLong/iztro",
        version: "2.6.1",
        tagCommit: "b78dfe391f65e938d79f2419dddb80f74c6bbb8e",
        license: "MIT",
        files: ["src/star/location.ts", "src/star/adjectiveStar.ts"],
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
    batch2Positions: (x) => clone(batch2Positions(BASE.calculate(x || {}))),
    yearly: (ys, yb, life, body) => clone(yearly(ys, yb, life, body)),
    timely: (hb) => clone(timely(hb)),
    monthly: (m) => clone(monthly(m)),
    selfTest: () => clone(TEST),
    manifest,
    base: BASE,
  });
  window.TianjiZiwei = API;
  if (TEST.ok) window.calcZiwei = (lunar, hb, gender) => fromLegacy(lunar, hb, gender);
  try {
    if (window.TianjiCore) {
      TianjiCore.registerSource({
        id: "tianji-v95-ziwei-adjective-b2",
        type: "internal",
        title: "Tianji Ziwei Core 1.4 Adjective Batch 2",
        version: VERSION,
        baseline: "v94",
      });
      TianjiCore.registerSource({
        id: "iztro-2.6.1-adjective-b2-reference",
        type: "third-party-reference",
        title: "SylarLong/iztro v2.6.1 adjective-star batch2 rules",
        version: "2.6.1",
        license: "MIT",
        repository: "SylarLong/iztro",
        commit: "b78dfe391f65e938d79f2419dddb80f74c6bbb8e",
        role: "rule-reference",
        note: "v95 交叉核对第二批12颗杂曜；不作为 Tianji 主运行时。",
      });
      TianjiCore.registerEngine(
        {
          id: "ziwei.core.v1.4",
          system: "ziwei",
          name: "Tianji Ziwei Core 1.4",
          version: VERSION,
          source: "tianji-v95-ziwei-adjective-b2",
          doctrine: "default + adjective batch1 + batch2",
          status: "active",
        },
        (input) => enhance(input || {}),
      );
    }
  } catch (e) {
    try {
      console.warn("[TianjiZiwei v95] registry", e);
    } catch (_) {}
  }
  try {
    const old =
      document.getElementById("tjZiweiV4Badge") ||
      document.getElementById("tjZiweiV3Badge") ||
      document.getElementById("buildVersion");
    let b = document.getElementById("tjZiweiV5Badge");
    if (!b && old) {
      b = document.createElement("span");
      b.id = "tjZiweiV5Badge";
      old.insertAdjacentElement("afterend", b);
    }
    if (b) {
      b.textContent = "ZiweiCore 1.4 · 杂曜Ⅱ";
      b.classList.toggle("warn", !TEST.ok);
      b.title = TEST.ok
        ? "v95：第二批12颗杂曜已通过回归"
        : "v95 杂曜第二批自检失败；legacy calcZiwei 保持兼容";
    }
  } catch (_) {}

  /* ---- v95-aware iztro verifier：第二批12杂曜由 GAP 转入真实对拍 ---- */
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
  function compare95(input = {}) {
    if (!(OLDV && OLDV.compare))
      return { available: false, ok: false, reason: "v94 verifier unavailable" };
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
      set = new Set(BATCH2),
      all = new Set(IMPLEMENTED),
      branches = ZHIS;
    const rows = (r.rows || []).filter((x) => x.id !== "gap.adjective.remaining");
    const a = branches.map((z) => [z, namesOf(pm[z], "adjectiveStars", set)]),
      b = branches.map((z) => [z, namesOf(vm[z], "adjectiveStars", set)]);
    rows.push({
      id: "adjective.batch2",
      label: "杂曜第二批12星",
      primary: a,
      verifier: b,
      status: eq(a, b) ? "PASS" : "DIFF",
      note: "比较龙池、凤阁、天才、天寿、台辅、封诰、天巫、华盖、天官、天福、天厨、天月。",
    });
    const extra = [
      ...new Set(
        ((v && v.palaces) || [])
          .flatMap((p) => (p.adjectiveStars || []).map((s) => s.name))
          .filter((n) => n && !all.has(n)),
      ),
    ].sort((x, y) => x.localeCompare(y, "zh-CN"));
    rows.push({
      id: "gap.adjective.remaining",
      label: "其余杂曜",
      primary: "v95 尚未实现",
      verifier: extra,
      status: extra.length ? "GAP" : "N/A",
      note: "v95 已覆盖22颗杂曜；剩余杂曜继续按批次迁移。",
    });
    const counts = { PASS: 0, DIFF: 0, POLICY: 0, GAP: 0, "N/A": 0 };
    rows.forEach((x) => (counts[x.status] = (counts[x.status] || 0) + 1));
    r.rows = rows;
    r.counts = counts;
    r.ok = counts.DIFF === 0;
    return r;
  }
  const CASES = OLDV && OLDV.cases ? OLDV.cases() : [];
  const V5STATE = { lastSuite: null };
  function suite95() {
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
        const r = compare95({ lunar: x.l, hourBranchIndex: x.h, gender: x.g });
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
    V5STATE.lastSuite = o;
    renderV5();
    return o;
  }
  function liveV5() {
    const S = V5STATE.lastSuite,
      sum = (S && S.summary) || { PASS: 0, DIFF: 0, POLICY: 0, GAP: 0, "N/A": 0 };
    return `<div class="panel blk tjzv5-live"><h4>紫微斗数交叉验证 · v95 杂曜第二批</h4><div class="tjzv3-stat"><span class="pass">PASS ${sum.PASS}</span><span class="diff">DIFF ${sum.DIFF}</span><span class="policy">口径 ${sum.POLICY}</span><span class="gap">GAP ${sum.GAP}</span></div><p class="tjzv5-note"><strong>本轮进入实测：</strong>龙池、凤阁、天才、天寿、台辅、封诰、天巫、华盖、天官、天福、天厨、天月。v94 第一批10星继续保留实测。</p><div class="tjzv3-actions"><button class="gbtn sm" id="tjzv5Run" type="button">重新运行 v95 验证</button></div></div>`;
  }
  function patchVerifyUI() {
    try {
      if (!window.REF_PANES || typeof REF_PANES.verify !== "function" || REF_PANES.verify.__v95)
        return;
      const old = REF_PANES.verify,
        oldBind = window.REF_BIND && REF_BIND.verify;
      const fn = () => liveV5() + old();
      fn.__v95 = true;
      REF_PANES.verify = fn;
      if (window.REF_BIND)
        REF_BIND.verify = function () {
          try {
            if (typeof oldBind === "function") oldBind();
          } catch (_) {}
          const b = document.getElementById("tjzv5Run");
          if (b)
            b.onclick = () => {
              if (OLDV && OLDV.hasVendor && OLDV.hasVendor()) suite95();
              else if (OLDV && OLDV.loadVendor) OLDV.loadVendor().then(() => suite95());
            };
        };
    } catch (e) {
      try {
        console.warn("[ZiweiVerify v95 UI]", e);
      } catch (_) {}
    }
  }
  function renderV5() {
    try {
      const p = document.getElementById("pane-verify");
      if (p && p.classList.contains("on") && typeof refRender === "function") refRender("verify");
    } catch (_) {}
  }
  const VERIFY95 = Object.freeze({
    version: "5.0.0",
    build: BUILD,
    state: V5STATE,
    compare: compare95,
    suite: suite95,
    cases: () => clone(CASES),
    loadVendor: OLDV && OLDV.loadVendor ? OLDV.loadVendor : async () => ({ status: "unavailable" }),
    hasVendor: () => !!(OLDV && OLDV.hasVendor && OLDV.hasVendor()),
    manifest: () => ({
      module: "Tianji Ziwei Verification Layer",
      version: "5.0.0",
      build: BUILD,
      baseline: "v95",
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
        "杂曜第一批10星",
        "杂曜第二批12星",
      ],
      remainingGaps: manifest().remainingGaps,
    }),
  });
  window.TianjiZiweiVerifier = VERIFY95;
  patchVerifyUI();
  const prev = window.TianjiSystem || {};
  window.TianjiSystem = Object.freeze({
    version: "v95",
    build: BUILD,
    baseline: "v84",
    core: window.TianjiCore || prev.core || null,
    time: window.TianjiTime || prev.time || null,
    verify: window.TianjiVerifier || prev.verify || null,
    bazi: window.TianjiBazi || prev.bazi || null,
    baziVerify: window.TianjiBaziVerifier || prev.baziVerify || null,
    ziwei: API,
    ziweiVerify: VERIFY95,
    manifest: () => ({
      product: "天机盘",
      version: "v95",
      build: BUILD,
      baseline: "v84",
      ziwei: manifest(),
      ziweiVerify: VERIFY95.manifest(),
    }),
  });
  try {
    const bv = document.getElementById("buildVersion");

    window.dispatchEvent(new CustomEvent("tianji:ziwei-core-v95-ready", { detail: manifest() }));
  } catch (_) {}
})();
