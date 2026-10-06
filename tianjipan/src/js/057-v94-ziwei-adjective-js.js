(() => {
  "use strict";
  const BUILD = "2026-10-04 09:07:59",
    VERSION = "1.3.0",
    SCHEMA = "tianji.ziwei/1.3",
    CAPABILITY = "enhanced-adjective-batch1";
  const BASE = window.TianjiZiwei;
  if (!BASE || typeof BASE.calculate !== "function") {
    try {
      console.warn("[TianjiZiwei v94] v93 core unavailable");
    } catch (_) {}
    return;
  }
  const ZHIS = "子丑寅卯辰巳午未申酉戌亥".split("");
  const BATCH1 = ["三台", "八座", "恩光", "天贵", "红鸾", "天喜", "天刑", "天姚", "孤辰", "寡宿"];
  const NATURE = {
    三台: "adjective",
    八座: "adjective",
    恩光: "adjective",
    天贵: "adjective",
    红鸾: "flower",
    天喜: "flower",
    天刑: "adjective",
    天姚: "flower",
    孤辰: "adjective",
    寡宿: "adjective",
  };
  /* Rule provenance / cross-check:
   SylarLong/iztro v2.6.1, tag commit b78dfe391f65e938d79f2419dddb80f74c6bbb8e, MIT License.
   Cross-checked source files: src/star/location.ts and src/star/adjectiveStar.ts.
   Rules are implemented locally in Tianji; iztro remains a verifier/reference only.
*/
  const clone = (o) => {
      try {
        return structuredClone(o);
      } catch (_) {
        return JSON.parse(JSON.stringify(o));
      }
    },
    mod = (a, n) => ((a % n) + n) % n;
  function luanXi(yearBranchIndex) {
    const hong = mod(3 - yearBranchIndex, 12);
    return { 红鸾: hong, 天喜: mod(hong + 6, 12) };
  }
  function guGua(yearBranchIndex) {
    if ([2, 3, 4].includes(yearBranchIndex)) return { 孤辰: 5, 寡宿: 1 };
    if ([5, 6, 7].includes(yearBranchIndex)) return { 孤辰: 8, 寡宿: 4 };
    if ([8, 9, 10].includes(yearBranchIndex)) return { 孤辰: 11, 寡宿: 7 };
    return { 孤辰: 2, 寡宿: 10 };
  }
  function monthly(effectiveMonth) {
    const mi = mod(effectiveMonth - 1, 12);
    return { 天刑: mod(9 + mi, 12), 天姚: mod(1 + mi, 12) };
  }
  function daily(day, minorPositions) {
    const di = Number(day) - 1,
      p = minorPositions || {};
    return {
      三台: mod(p.左辅 + di, 12),
      八座: mod(p.右弼 - di, 12),
      恩光: mod(p.文昌 + di - 1, 12),
      天贵: mod(p.文曲 + di - 1, 12),
    };
  }
  function adjectivePositions(base) {
    const lunar = base.input.lunar,
      yb =
        base.yearBranch && Number.isInteger(base.yearBranch.index)
          ? base.yearBranch.index
          : mod(lunar.year - 4, 12),
      m = base.effectiveLunarMonth || lunar.month;
    return Object.assign(
      {},
      daily(lunar.day, base.minorStars && base.minorStars.positions),
      luanXi(yb),
      monthly(m),
      guGua(yb),
    );
  }
  function enhance(input = {}) {
    const base = clone(BASE.calculate(input)),
      pos = adjectivePositions(base),
      byBranch = {};
    base.palaces.forEach((p) => (byBranch[p.branchIndex] = p));
    for (const p of base.palaces) {
      if (!Array.isArray(p.adjectiveStars)) p.adjectiveStars = [];
    }
    for (const name of BATCH1) {
      const b = pos[name],
        p = byBranch[b];
      if (!p) continue;
      let s = (p.adjectiveStars || []).find((x) => x.name === name);
      if (!s) {
        s = {
          name,
          type: "adjective",
          category: "adjective",
          nature: NATURE[name],
          scope: "origin",
        };
        p.adjectiveStars.push(s);
      } else {
        s.category = "adjective";
        s.nature = s.nature || NATURE[name];
        s.scope = s.scope || "origin";
      }
      if (Array.isArray(p.stars) && !p.stars.some((x) => x.name === name)) p.stars.push(clone(s));
    }
    base.schema = SCHEMA;
    base.version = VERSION;
    base.build = BUILD;
    base.capability = CAPABILITY;
    base.adjectiveStars = {
      batch: "v94-batch1",
      count: BATCH1.length,
      names: clone(BATCH1),
      positions: clone(pos),
    };
    base.coverage = Object.assign({}, base.coverage || {}, { adjectiveStarsBatch1: true });
    base.coverage.remaining = (base.coverage.remaining || []).filter((x) => x !== "杂曜系统");
    if (!base.coverage.remaining.includes("杂曜系统第二批及完整38杂曜"))
      base.coverage.remaining.unshift("杂曜系统第二批及完整38杂曜");
    base.policy = Object.assign({}, base.policy || {}, {
      adjectiveStars: {
        mode: "batch1-default",
        label: "三台八座恩光天贵 / 红鸾天喜 / 天刑天姚 / 孤辰寡宿",
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
    const minor = { 左辅: 4, 右弼: 10, 文昌: 10, 文曲: 4 },
      d = daily(1, minor),
      lx = luanXi(0),
      mo = monthly(1),
      gg = guGua(0);
    return {
      daily: d.三台 === 4 && d.八座 === 10 && d.恩光 === 9 && d.天贵 === 3,
      luanxi: lx.红鸾 === 3 && lx.天喜 === 9,
      monthly: mo.天刑 === 9 && mo.天姚 === 1,
      gugua: gg.孤辰 === 2 && gg.寡宿 === 10,
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
      checks.push({
        id: "v93.fields-preserved",
        ok:
          JSON.stringify(
            old.palaces.map((p) => ({
              majorStars: p.majorStars,
              minorStars: p.minorStars,
              changsheng12: p.changsheng12,
              boshi12: p.boshi12,
              jiangqian12: p.jiangqian12,
              suiqian12: p.suiqian12,
              decadal: p.decadal,
            })),
          ) ===
          JSON.stringify(
            r.palaces.map((p) => ({
              majorStars: p.majorStars,
              minorStars: p.minorStars,
              changsheng12: p.changsheng12,
              boshi12: p.boshi12,
              jiangqian12: p.jiangqian12,
              suiqian12: p.suiqian12,
              decadal: p.decadal,
            })),
          ),
      });
      const names = r.palaces
        .flatMap((p) => p.adjectiveStars || [])
        .map((s) => s.name)
        .filter((n) => BATCH1.includes(n));
      checks.push({
        id: "adjective.batch1.count",
        ok: names.length === 10 && new Set(names).size === 10,
      });
      checks.push({
        id: "adjective.positions.complete",
        ok: BATCH1.every((n) => Number.isInteger(r.adjectiveStars.positions[n])),
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
      baseline: "v93",
      capability: CAPABILITY,
      selfTest: clone(TEST),
      resolvedGaps: ["杂曜第一批10星"],
      resolvedStars: clone(BATCH1),
      remainingGaps: ["杂曜系统第二批及完整38杂曜", "小限", "晚子时", "中州派算法"],
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
    adjectivePositions: (x) => clone(adjectivePositions(BASE.calculate(x || {}))),
    daily: (day, p) => clone(daily(day, p)),
    luanXi: (yb) => clone(luanXi(yb)),
    monthly: (m) => clone(monthly(m)),
    guGua: (yb) => clone(guGua(yb)),
    selfTest: () => clone(TEST),
    manifest,
    base: BASE,
  });
  window.TianjiZiwei = API;
  if (TEST.ok) window.calcZiwei = (lunar, hb, gender) => fromLegacy(lunar, hb, gender);
  try {
    if (window.TianjiCore) {
      TianjiCore.registerSource({
        id: "tianji-v94-ziwei-adjective-b1",
        type: "internal",
        title: "Tianji Ziwei Core 1.3 Adjective Batch 1",
        version: VERSION,
        baseline: "v93",
      });
      TianjiCore.registerSource({
        id: "iztro-2.6.1-adjective-b1-reference",
        type: "third-party-reference",
        title: "SylarLong/iztro v2.6.1 adjective-star rules",
        version: "2.6.1",
        license: "MIT",
        repository: "SylarLong/iztro",
        commit: "b78dfe391f65e938d79f2419dddb80f74c6bbb8e",
        role: "rule-reference",
        note: "v94 交叉核对首批10颗杂曜安法；不作为 Tianji 主运行时。",
      });
      TianjiCore.registerEngine(
        {
          id: "ziwei.core.v1.3",
          system: "ziwei",
          name: "Tianji Ziwei Core 1.3",
          version: VERSION,
          source: "tianji-v94-ziwei-adjective-b1",
          doctrine: "default + adjective batch1",
          status: "active",
        },
        (input) => enhance(input || {}),
      );
    }
  } catch (e) {
    try {
      console.warn("[TianjiZiwei v94] registry", e);
    } catch (_) {}
  }
  try {
    const old =
      document.getElementById("tjZiweiV3Badge") ||
      document.getElementById("tjZiweiV2Badge") ||
      document.getElementById("buildVersion");
    let b = document.getElementById("tjZiweiV4Badge");
    if (!b && old) {
      b = document.createElement("span");
      b.id = "tjZiweiV4Badge";
      old.insertAdjacentElement("afterend", b);
    }
    if (b) {
      b.textContent = "ZiweiCore 1.3 · 杂曜Ⅰ";
      b.classList.toggle("warn", !TEST.ok);
      b.title = TEST.ok
        ? "v94：首批10颗高价值杂曜已通过回归"
        : "v94 杂曜增强层自检失败；legacy calcZiwei 保持兼容";
    }
  } catch (_) {}

  /* ---- v94-aware iztro verifier：首批10杂曜由 GAP 转入真实对拍 ---- */
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
  function compare94(input = {}) {
    if (!(OLDV && OLDV.compare))
      return { available: false, ok: false, reason: "v93 verifier unavailable" };
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
      set = new Set(BATCH1),
      branches = ZHIS;
    const rows = (r.rows || []).filter((x) => x.id !== "gap.adjective");
    const a = branches.map((b) => [b, namesOf(pm[b], "adjectiveStars", set)]),
      b = branches.map((z) => [z, namesOf(vm[z], "adjectiveStars", set)]);
    rows.push({
      id: "adjective.batch1",
      label: "杂曜第一批10星",
      primary: a,
      verifier: b,
      status: eq(a, b) ? "PASS" : "DIFF",
      note: "只比较 v94 已实现的10星；其它 iztro 杂曜继续列为 GAP。",
    });
    const extra = [
      ...new Set(
        ((v && v.palaces) || [])
          .flatMap((p) => (p.adjectiveStars || []).map((s) => s.name))
          .filter((n) => n && !set.has(n)),
      ),
    ].sort((x, y) => x.localeCompare(y, "zh-CN"));
    rows.push({
      id: "gap.adjective.remaining",
      label: "其余杂曜",
      primary: "v94 尚未实现",
      verifier: extra,
      status: extra.length ? "GAP" : "N/A",
      note: "后续批次继续迁移；不把未实现能力误判为算法错误。",
    });
    const counts = { PASS: 0, DIFF: 0, POLICY: 0, GAP: 0, "N/A": 0 };
    rows.forEach((x) => (counts[x.status] = (counts[x.status] || 0) + 1));
    r.rows = rows;
    r.counts = counts;
    r.ok = counts.DIFF === 0;
    return r;
  }
  const CASES = OLDV && OLDV.cases ? OLDV.cases() : [];
  const V4STATE = { lastSuite: null };
  function suite94() {
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
        const r = compare94({ lunar: x.l, hourBranchIndex: x.h, gender: x.g });
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
    V4STATE.lastSuite = o;
    renderV4();
    return o;
  }
  function liveV4() {
    const S = V4STATE.lastSuite,
      sum = (S && S.summary) || { PASS: 0, DIFF: 0, POLICY: 0, GAP: 0, "N/A": 0 };
    return `<div class="panel blk tjzv4-live"><h4>紫微斗数交叉验证 · v94 杂曜第一批</h4><div class="tjzv3-stat"><span class="pass">PASS ${sum.PASS}</span><span class="diff">DIFF ${sum.DIFF}</span><span class="policy">口径 ${sum.POLICY}</span><span class="gap">GAP ${sum.GAP}</span></div><p class="tjzv4-note"><strong>本轮进入实测：</strong>三台、八座、恩光、天贵、红鸾、天喜、天刑、天姚、孤辰、寡宿。其余杂曜仍作为能力缺口保留。</p><div class="tjzv3-actions"><button class="gbtn sm" id="tjzv4Run" type="button">重新运行 v94 验证</button></div></div>`;
  }
  function patchVerifyUI() {
    try {
      if (!window.REF_PANES || typeof REF_PANES.verify !== "function" || REF_PANES.verify.__v94)
        return;
      const old = REF_PANES.verify,
        oldBind = window.REF_BIND && REF_BIND.verify;
      const fn = () => liveV4() + old();
      fn.__v94 = true;
      REF_PANES.verify = fn;
      if (window.REF_BIND)
        REF_BIND.verify = function () {
          try {
            if (typeof oldBind === "function") oldBind();
          } catch (_) {}
          const b = document.getElementById("tjzv4Run");
          if (b)
            b.onclick = () => {
              if (OLDV && OLDV.hasVendor && OLDV.hasVendor()) suite94();
              else if (OLDV && OLDV.loadVendor) OLDV.loadVendor().then(() => suite94());
            };
        };
    } catch (e) {
      try {
        console.warn("[ZiweiVerify v94 UI]", e);
      } catch (_) {}
    }
  }
  function renderV4() {
    try {
      const p = document.getElementById("pane-verify");
      if (p && p.classList.contains("on") && typeof refRender === "function") refRender("verify");
    } catch (_) {}
  }
  const VERIFY94 = Object.freeze({
    version: "4.0.0",
    build: BUILD,
    state: V4STATE,
    compare: compare94,
    suite: suite94,
    cases: () => clone(CASES),
    loadVendor: OLDV && OLDV.loadVendor ? OLDV.loadVendor : async () => ({ status: "unavailable" }),
    hasVendor: () => !!(OLDV && OLDV.hasVendor && OLDV.hasVendor()),
    manifest: () => ({
      module: "Tianji Ziwei Verification Layer",
      version: "4.0.0",
      build: BUILD,
      baseline: "v94",
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
      ],
      remainingGaps: manifest().remainingGaps,
    }),
  });
  window.TianjiZiweiVerifier = VERIFY94;
  patchVerifyUI();
  const prev = window.TianjiSystem || {};
  window.TianjiSystem = Object.freeze({
    version: "v94",
    build: BUILD,
    baseline: "v84",
    core: window.TianjiCore || prev.core || null,
    time: window.TianjiTime || prev.time || null,
    verify: window.TianjiVerifier || prev.verify || null,
    bazi: window.TianjiBazi || prev.bazi || null,
    baziVerify: window.TianjiBaziVerifier || prev.baziVerify || null,
    ziwei: API,
    ziweiVerify: VERIFY94,
    manifest: () => ({
      product: "天机盘",
      version: "v94",
      build: BUILD,
      baseline: "v84",
      ziwei: manifest(),
      ziweiVerify: VERIFY94.manifest(),
    }),
  });
  try {
    const bv = document.getElementById("buildVersion");

    window.dispatchEvent(new CustomEvent("tianji:ziwei-core-v94-ready", { detail: manifest() }));
  } catch (_) {}
})();
