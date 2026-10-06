(() => {
  "use strict";
  const BUILD = "2026-10-04 09:01:38",
    VERSION = "1.2.0",
    SCHEMA = "tianji.ziwei/1.2",
    CAPABILITY = "enhanced-decorative-foundation";
  const BASE = window.TianjiZiwei;
  if (!BASE || typeof BASE.calculate !== "function") {
    try {
      console.warn("[TianjiZiwei v93] v92 core unavailable");
    } catch (_) {}
    return;
  }
  const ZHIS = "子丑寅卯辰巳午未申酉戌亥".split("");
  const BOSHI = [
    "博士",
    "力士",
    "青龙",
    "小耗",
    "将军",
    "奏书",
    "飞廉",
    "喜神",
    "病符",
    "大耗",
    "伏兵",
    "官府",
  ];
  const JIANGQIAN = [
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
  const SUIQIAN = [
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
  /* Rule provenance (verification/reference only):
   SylarLong/iztro v2.6.1, tag commit b78dfe391f65e938d79f2419dddb80f74c6bbb8e, MIT License.
   Cross-checked source files: src/star/decorativeStar.ts, src/data/earthlyBranches.ts, src/astro/astro.ts.
   Tianji remains the primary runtime; these deterministic rules are implemented locally and independently.
*/
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
  const BODY_BY_YEAR_BRANCH = [
    "火星",
    "天相",
    "天梁",
    "天同",
    "文昌",
    "天机",
    "火星",
    "天相",
    "天梁",
    "天同",
    "文昌",
    "天机",
  ];
  const clone = (o) => {
      try {
        return structuredClone(o);
      } catch (_) {
        return JSON.parse(JSON.stringify(o));
      }
    },
    mod = (a, n) => ((a % n) + n) % n;
  function boshiMap(yearStemIndex, yearBranchIndex, forward) {
    const lu = [2, 3, 5, 6, 5, 6, 8, 9, 11, 0][yearStemIndex],
      out = {};
    BOSHI.forEach((name, i) => {
      out[mod(lu + (forward ? i : -i), 12)] = name;
    });
    return out;
  }
  function jiangqianMap(yearBranchIndex) {
    let start = 0;
    if ([2, 6, 10].includes(yearBranchIndex)) start = 6;
    else if ([8, 0, 4].includes(yearBranchIndex)) start = 0;
    else if ([5, 9, 1].includes(yearBranchIndex)) start = 9;
    else start = 3;
    const out = {};
    JIANGQIAN.forEach((name, i) => {
      out[mod(start + i, 12)] = name;
    });
    return out;
  }
  function suiqianMap(yearBranchIndex) {
    const out = {};
    SUIQIAN.forEach((name, i) => {
      out[mod(yearBranchIndex + i, 12)] = name;
    });
    return out;
  }
  function masters(lifeBranchIndex, yearBranchIndex) {
    return { soul: SOUL_BY_BRANCH[lifeBranchIndex], body: BODY_BY_YEAR_BRANCH[yearBranchIndex] };
  }
  function enhance(input = {}) {
    const base = clone(BASE.calculate(input));
    const ys = base.yearStem.index,
      yb =
        base.yearBranch && Number.isInteger(base.yearBranch.index)
          ? base.yearBranch.index
          : mod(base.input.lunar.year - 4, 12),
      forward = !!base.majorPeriod.forward;
    const bo = boshiMap(ys, yb, forward),
      ji = jiangqianMap(yb),
      su = suiqianMap(yb),
      ms = masters(base.lifePalace.branchIndex, yb);
    for (const p of base.palaces) {
      p.boshi12 = bo[p.branchIndex];
      p.jiangqian12 = ji[p.branchIndex];
      p.suiqian12 = su[p.branchIndex];
    }
    base.soul = ms.soul;
    base.body = ms.body;
    base.masters = { soul: ms.soul, body: ms.body, policy: "default" };
    base.decorative = Object.assign({}, base.decorative || {}, {
      boshi12: ZHIS.map((branch, i) => ({ branch, name: bo[i] })),
      jiangqian12: ZHIS.map((branch, i) => ({ branch, name: ji[i] })),
      suiqian12: ZHIS.map((branch, i) => ({ branch, name: su[i] })),
    });
    base.schema = SCHEMA;
    base.version = VERSION;
    base.build = BUILD;
    base.capability = CAPABILITY;
    base.coverage = Object.assign({}, base.coverage || {}, {
      boshi12: true,
      jiangqian12: true,
      suiqian12: true,
      soulBodyMaster: true,
    });
    base.coverage.remaining = (base.coverage.remaining || []).filter(
      (x) => !["博士十二神", "将前十二神", "岁前十二神", "命主身主"].includes(x),
    );
    base.policy = Object.assign({}, base.policy || {}, {
      boshi12: { mode: "lucun-and-yinyang-direction", label: "禄存起博士，阳男阴女顺、阴男阳女逆" },
      jiangqian12: { mode: "year-branch-trine", label: "生年支三合局定将星，顺布十二神" },
      suiqian12: { mode: "year-branch-suijian", label: "生年支起岁建，顺布十二神" },
      masters: { mode: "default", label: "命主按命宫地支；身主按生年地支" },
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
    const bo = boshiMap(9, 3, true),
      su = suiqianMap(5),
      ji = jiangqianMap(5),
      m = masters(6, 4);
    const expBo = [
      "博士",
      "力士",
      "青龙",
      "小耗",
      "将军",
      "奏书",
      "飞廉",
      "喜神",
      "病符",
      "大耗",
      "伏兵",
      "官府",
    ];
    return {
      boshi: ZHIS.every((_, i) => bo[i] === expBo[i]),
      suiqian:
        [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 0, 1].map((i) => su[i]).join("|") ===
        "天德|吊客|病符|岁建|晦气|丧门|贯索|官符|小耗|大耗|龙德|白虎",
      jiangqian:
        [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 0, 1].map((i) => ji[i]).join("|") ===
        "劫煞|灾煞|天煞|指背|咸池|月煞|亡神|将星|攀鞍|岁驿|息神|华盖",
      masters: m.soul === "破军" && m.body === "文昌",
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
        const a = BASE.fromLegacy(l, h, g),
          b = fromLegacy(l, h, g);
        checks.push({ id: "legacy." + id, ok: JSON.stringify(a) === JSON.stringify(b) });
      } catch (e) {
        checks.push({ id: "legacy." + id, ok: false, error: String((e && e.message) || e) });
      }
    }
    try {
      const old = BASE.calculate({
          lunar: { year: 1986, month: 4, day: 28, isLeap: false },
          hourBranchIndex: 9,
          gender: "M",
        }),
        r = enhance({
          lunar: { year: 1986, month: 4, day: 28, isLeap: false },
          hourBranchIndex: 9,
          gender: "M",
        });
      checks.push({
        id: "v92.fields-preserved",
        ok:
          JSON.stringify(
            old.palaces.map((p) => ({
              majorStars: p.majorStars,
              minorStars: p.minorStars,
              changsheng12: p.changsheng12,
              decadal: p.decadal,
            })),
          ) ===
          JSON.stringify(
            r.palaces.map((p) => ({
              majorStars: p.majorStars,
              minorStars: p.minorStars,
              changsheng12: p.changsheng12,
              decadal: p.decadal,
            })),
          ),
      });
      checks.push({
        id: "boshi12.unique",
        ok: new Set(r.palaces.map((p) => p.boshi12)).size === 12,
      });
      checks.push({
        id: "jiangqian12.unique",
        ok: new Set(r.palaces.map((p) => p.jiangqian12)).size === 12,
      });
      checks.push({
        id: "suiqian12.unique",
        ok: new Set(r.palaces.map((p) => p.suiqian12)).size === 12,
      });
      checks.push({
        id: "masters.present",
        ok: !!r.soul && !!r.body && r.masters.soul === r.soul && r.masters.body === r.body,
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
      baseline: "v92",
      capability: CAPABILITY,
      selfTest: clone(TEST),
      resolvedGaps: ["博士十二神", "将前十二神", "岁前十二神", "命主/身主"],
      remainingGaps: ["杂曜系统", "小限", "晚子时", "中州派算法"],
      reference: {
        name: "SylarLong/iztro",
        version: "2.6.1",
        tagCommit: "b78dfe391f65e938d79f2419dddb80f74c6bbb8e",
        license: "MIT",
        files: ["src/star/decorativeStar.ts", "src/data/earthlyBranches.ts", "src/astro/astro.ts"],
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
    boshiMap: (ys, yb, f) => clone(boshiMap(ys, yb, f)),
    jiangqianMap: (yb) => clone(jiangqianMap(yb)),
    suiqianMap: (yb) => clone(suiqianMap(yb)),
    masters: (lb, yb) => clone(masters(lb, yb)),
    selfTest: () => clone(TEST),
    manifest,
    base: BASE,
  });
  window.TianjiZiwei = API;
  if (TEST.ok) window.calcZiwei = (lunar, hb, gender) => fromLegacy(lunar, hb, gender);
  try {
    if (window.TianjiCore) {
      TianjiCore.registerSource({
        id: "tianji-v93-ziwei-decorative",
        type: "internal",
        title: "Tianji Ziwei Core 1.2 Decorative Foundation",
        version: VERSION,
        baseline: "v92",
      });
      TianjiCore.registerSource({
        id: "iztro-2.6.1-decorative-reference",
        type: "third-party-reference",
        title: "SylarLong/iztro v2.6.1 decorative/master rules",
        version: "2.6.1",
        license: "MIT",
        repository: "SylarLong/iztro",
        commit: "b78dfe391f65e938d79f2419dddb80f74c6bbb8e",
        role: "rule-reference",
        note: "v93 交叉核对博士/将前/岁前十二神与命主身主；不作为 Tianji 主运行时。",
      });
      TianjiCore.registerEngine(
        {
          id: "ziwei.core.v1.2",
          system: "ziwei",
          name: "Tianji Ziwei Core 1.2",
          version: VERSION,
          source: "tianji-v93-ziwei-decorative",
          doctrine: "default + decorative12 + soul/body masters",
          status: "active",
        },
        (input) => enhance(input || {}),
      );
    }
  } catch (e) {
    try {
      console.warn("[TianjiZiwei v93] registry", e);
    } catch (_) {}
  }
  try {
    const old =
      document.getElementById("tjZiweiV2Badge") ||
      document.getElementById("tjZiweiVerifyBadge") ||
      document.getElementById("buildVersion");
    let b = document.getElementById("tjZiweiV3Badge");
    if (!b && old) {
      b = document.createElement("span");
      b.id = "tjZiweiV3Badge";
      old.insertAdjacentElement("afterend", b);
    }
    if (b) {
      b.textContent = "ZiweiCore 1.2 · 十二神系";
      b.classList.toggle("warn", !TEST.ok);
      b.title = TEST.ok
        ? "v93：博士/将前/岁前十二神 + 命主身主已通过回归"
        : "v93 增强层自检失败；legacy calcZiwei 保持兼容";
    }
  } catch (_) {}

  /* ---- v93-aware iztro verifier：把四个 GAP 转为实际对拍 ---- */
  const OLDV = window.TianjiZiweiVerifier;
  function eq(a, b) {
    return JSON.stringify(a) === JSON.stringify(b);
  }
  function mapBy(ps, key) {
    const o = {};
    (ps || []).forEach((p) => (o[p[key]] = p));
    return o;
  }
  function compare93(input = {}) {
    if (!(OLDV && OLDV.compare))
      return { available: false, ok: false, reason: "v92 verifier unavailable" };
    const r = OLDV.compare(input);
    if (!r || !r.available) return r;
    const c = enhance({
        lunar: clone(input.lunar),
        hourBranchIndex: Number(input.hourBranchIndex ?? input.hourBranch),
        gender: input.gender === "F" ? "F" : "M",
      }),
      v = r.raw && r.raw.verifier;
    r.raw.primary = c;
    const pm = mapBy(c.palaces, "branch"),
      vm = mapBy(v && v.palaces, "earthlyBranch"),
      branches = ZHIS;
    const rows = (r.rows || []).filter(
      (x) => !["gap.boshi", "gap.jiang", "gap.sui", "gap.master"].includes(x.id),
    );
    const add = (id, label, a, b, note = "") =>
      rows.push({ id, label, primary: a, verifier: b, status: eq(a, b) ? "PASS" : "DIFF", note });
    add(
      "boshi12",
      "博士十二神",
      branches.map((b) => [b, pm[b] && pm[b].boshi12]),
      branches.map((b) => [b, vm[b] && vm[b].boshi12]),
      "v93 已按禄存起博士并依阴阳男女顺逆。",
    );
    add(
      "jiangqian12",
      "将前十二神",
      branches.map((b) => [b, pm[b] && pm[b].jiangqian12]),
      branches.map((b) => [b, vm[b] && vm[b].jiangqian12]),
      "按生年地支三合局定将星。",
    );
    add(
      "suiqian12",
      "岁前十二神",
      branches.map((b) => [b, pm[b] && pm[b].suiqian12]),
      branches.map((b) => [b, vm[b] && vm[b].suiqian12]),
      "按生年地支起岁建。",
    );
    add(
      "masters",
      "命主/身主",
      { soul: c.soul, body: c.body },
      { soul: (v && v.soul) || "", body: (v && v.body) || "" },
      "default 口径：命主按命宫地支，身主按生年地支。",
    );
    const counts = { PASS: 0, DIFF: 0, POLICY: 0, GAP: 0, "N/A": 0 };
    rows.forEach((x) => (counts[x.status] = (counts[x.status] || 0) + 1));
    r.rows = rows;
    r.counts = counts;
    r.ok = counts.DIFF === 0;
    return r;
  }
  const CASES = OLDV && OLDV.cases ? OLDV.cases() : [];
  const V3STATE = { lastSuite: null };
  function suite93() {
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
        const r = compare93({ lunar: x.l, hourBranchIndex: x.h, gender: x.g });
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
    V3STATE.lastSuite = o;
    renderV3();
    return o;
  }
  function esc(s) {
    return String(s == null ? "" : s).replace(
      /[&<>\"]/g,
      (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '\"': "&quot;" })[c],
    );
  }
  function liveV3() {
    const S = V3STATE.lastSuite,
      sum = (S && S.summary) || { PASS: 0, DIFF: 0, POLICY: 0, GAP: 0, "N/A": 0 },
      ready = OLDV && OLDV.hasVendor && OLDV.hasVendor(),
      cases =
        S && S.cases
          ? S.cases
              .map((x) => {
                const c = x.report && x.report.counts;
                return `<div class="tjzv3-case"><b>${esc(x.label)}</b><small>${x.error ? esc(x.error) : `PASS ${c.PASS} · DIFF ${c.DIFF} · 口径 ${c.POLICY} · GAP ${c.GAP}`}</small></div>`;
              })
              .join("")
          : "";
    return `<div class="panel blk tjzv3-live"><div class="tjzv3-head"><div><h4>紫微斗数交叉验证 · v93 十二神系</h4><small>${ready ? "iztro 2.6.1 已就绪" : "等待 iztro 2.6.1"} · 博士 / 将前 / 岁前 / 命主身主已进入重叠验证</small></div><div class="tjzv3-stat"><span class="pass">PASS ${sum.PASS}</span><span class="diff">DIFF ${sum.DIFF}</span><span class="policy">口径 ${sum.POLICY}</span><span class="gap">GAP ${sum.GAP}</span></div></div><div class="tjzv3-cases">${cases || '<div class="tjzv3-case"><b>尚未运行</b><small>iztro 就绪后自动验证；主紫微盘不依赖第三方运行时。</small></div>'}</div><div class="tjzv3-actions"><button class="gbtn sm" id="tjzv3Run" type="button">重新运行 v93 验证</button></div><p class="tjzv3-note"><strong>v93 新消除 GAP：</strong>博士十二神、将前十二神、岁前十二神、命主/身主。剩余重点：杂曜系统、小限、晚子时、流派算法。</p></div>`;
  }
  function patchVerifyUI() {
    try {
      if (!window.REF_PANES || typeof REF_PANES.verify !== "function" || REF_PANES.verify.__v93)
        return;
      const old = REF_PANES.verify,
        oldBind = window.REF_BIND && REF_BIND.verify;
      const fn = () => liveV3() + old();
      fn.__v93 = true;
      REF_PANES.verify = fn;
      if (window.REF_BIND)
        REF_BIND.verify = function () {
          try {
            if (typeof oldBind === "function") oldBind();
          } catch (_) {}
          const b = document.getElementById("tjzv3Run");
          if (b)
            b.onclick = () => {
              if (OLDV && OLDV.hasVendor && OLDV.hasVendor()) suite93();
              else if (OLDV && OLDV.loadVendor) OLDV.loadVendor().then(() => suite93());
            };
        };
    } catch (e) {
      try {
        console.warn("[ZiweiVerify v93 UI]", e);
      } catch (_) {}
    }
  }
  function renderV3() {
    try {
      const p = document.getElementById("pane-verify");
      if (p && p.classList.contains("on") && typeof refRender === "function") refRender("verify");
    } catch (_) {}
  }
  const VERIFY93 = Object.freeze({
    version: "3.0.0",
    build: BUILD,
    state: V3STATE,
    compare: compare93,
    suite: suite93,
    cases: () => clone(CASES),
    loadVendor: OLDV && OLDV.loadVendor ? OLDV.loadVendor : async () => ({ status: "unavailable" }),
    hasVendor: () => !!(OLDV && OLDV.hasVendor && OLDV.hasVendor()),
    manifest: () => ({
      module: "Tianji Ziwei Verification Layer",
      version: "3.0.0",
      build: BUILD,
      baseline: "v93",
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
      ],
      remainingGaps: manifest().remainingGaps,
    }),
  });
  window.TianjiZiweiVerifier = VERIFY93;
  patchVerifyUI();
  const prev = window.TianjiSystem || {};
  window.TianjiSystem = Object.freeze({
    version: "v93",
    build: BUILD,
    baseline: "v84",
    core: window.TianjiCore || prev.core || null,
    time: window.TianjiTime || prev.time || null,
    verify: window.TianjiVerifier || prev.verify || null,
    bazi: window.TianjiBazi || prev.bazi || null,
    baziVerify: window.TianjiBaziVerifier || prev.baziVerify || null,
    ziwei: API,
    ziweiVerify: VERIFY93,
    manifest: () => ({
      product: "天机盘",
      version: "v93",
      build: BUILD,
      baseline: "v84",
      ziwei: manifest(),
      ziweiVerify: VERIFY93.manifest(),
    }),
  });
  try {
    const bv = document.getElementById("buildVersion");

    window.dispatchEvent(new CustomEvent("tianji:ziwei-core-v93-ready", { detail: manifest() }));
  } catch (_) {}
})();
