(() => {
  "use strict";
  const BUILD = "2026-10-04 09:20:59",
    VERSION = "1.5.0",
    SCHEMA = "tianji.ziwei/1.5",
    CAPABILITY = "enhanced-adjective-batch3";
  const BASE = window.TianjiZiwei;
  if (!BASE || typeof BASE.calculate !== "function") {
    try {
      console.warn("[TianjiZiwei v96] v95 core unavailable");
    } catch (_) {}
    return;
  }
  const ZHIS = "子丑寅卯辰巳午未申酉戌亥".split("");
  const BATCH3 = [
    "解神",
    "咸池",
    "天德",
    "月德",
    "天空",
    "旬空",
    "截路",
    "空亡",
    "破碎",
    "蜚廉",
    "天哭",
    "天虚",
    "阴煞",
  ];
  const NATURE = {
    解神: "helper",
    咸池: "flower",
    天德: "adjective",
    月德: "adjective",
    天空: "adjective",
    旬空: "adjective",
    截路: "adjective",
    空亡: "adjective",
    破碎: "adjective",
    蜚廉: "adjective",
    天哭: "adjective",
    天虚: "adjective",
    阴煞: "adjective",
  };
  /* Rule provenance / cross-check:
   SylarLong/iztro v2.6.1, tag commit b78dfe391f65e938d79f2419dddb80f74c6bbb8e, MIT License.
   Cross-checked source files: src/star/location.ts, src/star/adjectiveStar.ts, src/i18n/locales/zh-CN/star.ts.
   Tianji canonical palace index is 子=0; formulas below are converted from iztro's 寅=0 palace array where necessary.
   Default/common algorithm only: 截路 + 空亡 are retained as two stars; Zhongzhou's single 截空 is intentionally not mixed into this version.
*/
  const clone = (o) => {
      try {
        return structuredClone(o);
      } catch (_) {
        return JSON.parse(JSON.stringify(o));
      }
    },
    mod = (a, n) => ((a % n) + n) % n;
  function xianchi(yb) {
    if ([2, 6, 10].includes(yb)) return 3;
    if ([8, 0, 4].includes(yb)) return 9;
    if ([5, 9, 1].includes(yb)) return 6;
    return 0;
  }
  function xunkong(ys, yb) {
    let x = mod(yb + 10 - ys, 12);
    if ((yb & 1) !== (x & 1)) x = mod(x + 1, 12);
    return x;
  }
  function yearly(ys, yb) {
    const jielu = [8, 6, 4, 2, 0][mod(ys, 5)],
      kongwang = [9, 7, 5, 3, 1][mod(ys, 5)];
    const posui = [5, 1, 9][mod(yb, 3)],
      feilian = [8, 9, 10, 5, 6, 7, 2, 3, 4, 11, 0, 1][yb];
    return {
      咸池: xianchi(yb),
      天德: mod(9 + yb, 12),
      月德: mod(5 + yb, 12),
      天空: mod(yb + 1, 12),
      旬空: xunkong(ys, yb),
      截路: jielu,
      空亡: kongwang,
      破碎: posui,
      蜚廉: feilian,
      天哭: mod(6 - yb, 12),
      天虚: mod(6 + yb, 12),
    };
  }
  function monthly(effectiveMonth) {
    const mi = mod(Number(effectiveMonth) - 1, 12);
    return { 解神: [8, 8, 10, 10, 0, 0, 2, 2, 4, 4, 6, 6][mi], 阴煞: [2, 0, 10, 8, 6, 4][mi % 6] };
  }
  function batch3Positions(base) {
    const lunar = base.input.lunar,
      ys = base.yearStem.index,
      yb =
        base.yearBranch && Number.isInteger(base.yearBranch.index)
          ? base.yearBranch.index
          : mod(lunar.year - 4, 12),
      m = base.effectiveLunarMonth || lunar.month;
    return Object.assign({}, yearly(ys, yb), monthly(m));
  }
  function enhance(input = {}) {
    const base = clone(BASE.calculate(input)),
      pos = batch3Positions(base),
      byBranch = {};
    base.palaces.forEach((p) => (byBranch[p.branchIndex] = p));
    for (const p of base.palaces) {
      if (!Array.isArray(p.adjectiveStars)) p.adjectiveStars = [];
    }
    for (const name of BATCH3) {
      const b = pos[name],
        p = byBranch[b];
      if (!p) continue;
      let s = (p.adjectiveStars || []).find((x) => x.name === name);
      if (!s) {
        s = {
          name,
          type: "adjective",
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
    const names = [...new Set([...oldNames, ...BATCH3])];
    base.schema = SCHEMA;
    base.version = VERSION;
    base.build = BUILD;
    base.capability = CAPABILITY;
    base.adjectiveStars = {
      batch: "v96-batch1+2+3",
      batches: [...(oldAdj.batches || ["v94-batch1", "v95-batch2"]), "v96-batch3"],
      count: names.length,
      names,
      positions: Object.assign({}, oldPos, pos),
      batch3: {
        classCount: 12,
        starCount: BATCH3.length,
        names: clone(BATCH3),
        positions: clone(pos),
      },
    };
    base.coverage = Object.assign({}, base.coverage || {}, {
      adjectiveStarsBatch3: true,
      adjectiveStarsImplemented: names.length,
    });
    base.coverage.remaining = (base.coverage.remaining || []).filter(
      (x) => !/杂曜系统后续批次/.test(x),
    );
    if (!base.coverage.remaining.includes("杂曜系统收尾（天伤 / 天使 / 年解）"))
      base.coverage.remaining.unshift("杂曜系统收尾（天伤 / 天使 / 年解）");
    base.policy = Object.assign({}, base.policy || {}, {
      adjectiveStarsBatch3: {
        mode: "batch3-default",
        label: "解神 / 咸池 / 天德月德 / 天空旬空 / 截路空亡 / 破碎蜚廉 / 天哭天虚 / 阴煞",
        note: "截路与空亡按通行 default 口径为两颗星；中州派截空另行实现",
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
    const a = Object.assign({}, yearly(0, 0), monthly(1));
    const b = Object.assign({}, yearly(5, 7), monthly(12));
    const c = Object.assign({}, yearly(6, 8), monthly(6));
    return {
      caseA:
        a.解神 === 8 &&
        a.咸池 === 9 &&
        a.天德 === 9 &&
        a.月德 === 5 &&
        a.天空 === 1 &&
        a.旬空 === 10 &&
        a.截路 === 8 &&
        a.空亡 === 9 &&
        a.破碎 === 5 &&
        a.蜚廉 === 8 &&
        a.天哭 === 6 &&
        a.天虚 === 6 &&
        a.阴煞 === 2,
      caseB:
        b.解神 === 6 &&
        b.咸池 === 0 &&
        b.天德 === 4 &&
        b.月德 === 0 &&
        b.天空 === 8 &&
        b.旬空 === 1 &&
        b.截路 === 8 &&
        b.空亡 === 9 &&
        b.破碎 === 1 &&
        b.蜚廉 === 3 &&
        b.天哭 === 11 &&
        b.天虚 === 1 &&
        b.阴煞 === 4,
      caseC:
        c.解神 === 0 &&
        c.咸池 === 9 &&
        c.天德 === 5 &&
        c.月德 === 1 &&
        c.天空 === 9 &&
        c.旬空 === 0 &&
        c.截路 === 6 &&
        c.空亡 === 7 &&
        c.破碎 === 9 &&
        c.蜚廉 === 4 &&
        c.天哭 === 10 &&
        c.天虚 === 2 &&
        c.阴煞 === 4,
      xunkong1979: xunkong(5, 7) === 1,
      xunkong1980: xunkong(6, 8) === 0,
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
        oldAdj: (p.adjectiveStars || []).filter((s) => !BATCH3.includes(s.name)),
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
        id: "v95.fields-preserved",
        ok: JSON.stringify(oldKeep) === JSON.stringify(r.palaces.map(keep)),
      });
      const names = r.palaces
        .flatMap((p) => p.adjectiveStars || [])
        .map((s) => s.name)
        .filter((n) => BATCH3.includes(n));
      checks.push({
        id: "adjective.batch3.count",
        ok: names.length === 13 && new Set(names).size === 13,
      });
      checks.push({
        id: "adjective.batch3.positions",
        ok: BATCH3.every((n) => Number.isInteger(r.adjectiveStars.positions[n])),
      });
      checks.push({
        id: "adjective.total35",
        ok: r.adjectiveStars.count === 35 && r.adjectiveStars.names.length === 35,
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
      baseline: "v95",
      capability: CAPABILITY,
      selfTest: clone(TEST),
      resolvedGaps: ["杂曜第三批12类13星"],
      resolvedStars: clone(BATCH3),
      implementedAdjectiveStars: 35,
      remainingGaps: ["杂曜系统收尾（天伤 / 天使 / 年解）", "小限", "晚子时", "中州派算法"],
      reference: {
        name: "SylarLong/iztro",
        version: "2.6.1",
        tagCommit: "b78dfe391f65e938d79f2419dddb80f74c6bbb8e",
        license: "MIT",
        files: [
          "src/star/location.ts",
          "src/star/adjectiveStar.ts",
          "src/i18n/locales/zh-CN/star.ts",
        ],
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
    batch3Positions: (x) => clone(batch3Positions(BASE.calculate(x || {}))),
    yearly: (ys, yb) => clone(yearly(ys, yb)),
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
        id: "tianji-v96-ziwei-adjective-b3",
        type: "internal",
        title: "Tianji Ziwei Core 1.5 Adjective Batch 3",
        version: VERSION,
        baseline: "v95",
      });
      TianjiCore.registerSource({
        id: "iztro-2.6.1-adjective-b3-reference",
        type: "third-party-reference",
        title: "SylarLong/iztro v2.6.1 adjective-star batch3 rules",
        version: "2.6.1",
        license: "MIT",
        repository: "SylarLong/iztro",
        commit: "b78dfe391f65e938d79f2419dddb80f74c6bbb8e",
        role: "rule-reference",
        note: "v96 交叉核对第三批12类13颗杂曜；不作为 Tianji 主运行时。",
      });
      TianjiCore.registerEngine(
        {
          id: "ziwei.core.v1.5",
          system: "ziwei",
          name: "Tianji Ziwei Core 1.5",
          version: VERSION,
          source: "tianji-v96-ziwei-adjective-b3",
          doctrine: "default + adjective batch1 + batch2 + batch3",
          status: "active",
        },
        (input) => enhance(input || {}),
      );
    }
  } catch (e) {
    try {
      console.warn("[TianjiZiwei v96] registry", e);
    } catch (_) {}
  }
  try {
    const old =
      document.getElementById("tjZiweiV5Badge") || document.getElementById("buildVersion");
    let b = document.getElementById("tjZiweiV6Badge");
    if (!b && old) {
      b = document.createElement("span");
      b.id = "tjZiweiV6Badge";
      old.insertAdjacentElement("afterend", b);
    }
    if (b) {
      b.textContent = "ZiweiCore 1.5 · 杂曜Ⅲ";
      b.classList.toggle("warn", !TEST.ok);
      b.title = TEST.ok
        ? "v96：第三批12类13星已通过回归"
        : "v96 杂曜第三批自检失败；legacy calcZiwei 保持兼容";
    }
  } catch (_) {}

  /* ---- v96-aware iztro verifier：第三批由 GAP 转入真实对拍 ---- */
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
  function compare96(input = {}) {
    if (!(OLDV && OLDV.compare))
      return { available: false, ok: false, reason: "v95 verifier unavailable" };
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
      set = new Set(BATCH3),
      all = new Set(c.adjectiveStars.names),
      branches = ZHIS;
    const rows = (r.rows || []).filter((x) => x.id !== "gap.adjective.remaining");
    const a = branches.map((z) => [z, namesOf(pm[z], "adjectiveStars", set)]),
      b = branches.map((z) => [z, namesOf(vm[z], "adjectiveStars", set)]);
    rows.push({
      id: "adjective.batch3",
      label: "杂曜第三批12类13星",
      primary: a,
      verifier: b,
      status: eq(a, b) ? "PASS" : "DIFF",
      note: "比较解神、咸池、天德、月德、天空、旬空、截路、空亡、破碎、蜚廉、天哭、天虚、阴煞。",
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
      primary: "v96 尚余天伤 / 天使 / 年解",
      verifier: extra,
      status: extra.length ? "GAP" : "N/A",
      note: "v96 已覆盖默认口径38杂曜中的35星；剩余3星留给收尾批次。",
    });
    const counts = { PASS: 0, DIFF: 0, POLICY: 0, GAP: 0, "N/A": 0 };
    rows.forEach((x) => (counts[x.status] = (counts[x.status] || 0) + 1));
    r.rows = rows;
    r.counts = counts;
    r.ok = counts.DIFF === 0;
    return r;
  }
  const CASES = OLDV && OLDV.cases ? OLDV.cases() : [],
    V6STATE = { lastSuite: null };
  function suite96() {
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
        const r = compare96({ lunar: x.l, hourBranchIndex: x.h, gender: x.g });
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
    V6STATE.lastSuite = o;
    renderV6();
    return o;
  }
  function liveV6() {
    const S = V6STATE.lastSuite,
      sum = (S && S.summary) || { PASS: 0, DIFF: 0, POLICY: 0, GAP: 0, "N/A": 0 };
    return `<div class="panel blk tjzv6-live"><h4>紫微斗数交叉验证 · v96 杂曜第三批</h4><div class="tjzv3-stat"><span class="pass">PASS ${sum.PASS}</span><span class="diff">DIFF ${sum.DIFF}</span><span class="policy">口径 ${sum.POLICY}</span><span class="gap">GAP ${sum.GAP}</span></div><p class="tjzv6-note"><strong>本轮进入实测：</strong>解神、咸池、天德、月德、天空、旬空、截路、空亡、破碎、蜚廉、天哭、天虚、阴煞。当前默认口径杂曜已实现35/38。</p><div class="tjzv3-actions"><button class="gbtn sm" id="tjzv6Run" type="button">重新运行 v96 验证</button></div></div>`;
  }
  function patchVerifyUI() {
    try {
      if (!window.REF_PANES || typeof REF_PANES.verify !== "function" || REF_PANES.verify.__v96)
        return;
      const old = REF_PANES.verify,
        oldBind = window.REF_BIND && REF_BIND.verify;
      const fn = () => liveV6() + old();
      fn.__v96 = true;
      REF_PANES.verify = fn;
      if (window.REF_BIND)
        REF_BIND.verify = function () {
          try {
            if (typeof oldBind === "function") oldBind();
          } catch (_) {}
          const b = document.getElementById("tjzv6Run");
          if (b)
            b.onclick = () => {
              if (OLDV && OLDV.hasVendor && OLDV.hasVendor()) suite96();
              else if (OLDV && OLDV.loadVendor) OLDV.loadVendor().then(() => suite96());
            };
        };
    } catch (e) {
      try {
        console.warn("[ZiweiVerify v96 UI]", e);
      } catch (_) {}
    }
  }
  function renderV6() {
    try {
      const p = document.getElementById("pane-verify");
      if (p && p.classList.contains("on") && typeof refRender === "function") refRender("verify");
    } catch (_) {}
  }
  const VERIFY96 = Object.freeze({
    version: "6.0.0",
    build: BUILD,
    state: V6STATE,
    compare: compare96,
    suite: suite96,
    cases: () => clone(CASES),
    loadVendor: OLDV && OLDV.loadVendor ? OLDV.loadVendor : async () => ({ status: "unavailable" }),
    hasVendor: () => !!(OLDV && OLDV.hasVendor && OLDV.hasVendor()),
    manifest: () => ({
      module: "Tianji Ziwei Verification Layer",
      version: "6.0.0",
      build: BUILD,
      baseline: "v96",
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
        "杂曜第三批12类13星",
      ],
      remainingGaps: manifest().remainingGaps,
    }),
  });
  window.TianjiZiweiVerifier = VERIFY96;
  patchVerifyUI();
  const prev = window.TianjiSystem || {};
  window.TianjiSystem = Object.freeze({
    version: "v96",
    build: BUILD,
    baseline: "v84",
    core: window.TianjiCore || prev.core || null,
    time: window.TianjiTime || prev.time || null,
    verify: window.TianjiVerifier || prev.verify || null,
    bazi: window.TianjiBazi || prev.bazi || null,
    baziVerify: window.TianjiBaziVerifier || prev.baziVerify || null,
    ziwei: API,
    ziweiVerify: VERIFY96,
    manifest: () => ({
      product: "天机盘",
      version: "v96",
      build: BUILD,
      baseline: "v84",
      ziwei: manifest(),
      ziweiVerify: VERIFY96.manifest(),
    }),
  });
  try {
    const bv = document.getElementById("buildVersion");

    window.dispatchEvent(new CustomEvent("tianji:ziwei-core-v96-ready", { detail: manifest() }));
  } catch (_) {}
})();
