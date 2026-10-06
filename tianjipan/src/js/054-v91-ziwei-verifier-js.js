(() => {
  "use strict";
  const VERSION = "1.0.0",
    BUILD = "2026-10-04 08:43:44";
  const VENDOR = {
    sha256: "effb3fa5123125ebc564ba7d80d61d6763e0d6ba96e82fc8a1790f2c156b7d9f",
    id: "iztro",
    version: "2.6.1",
    license: "MIT",
    repository: "SylarLong/iztro",
    tag: "v2.6.1",
    commit: "b78dfe391f65e938d79f2419dddb80f74c6bbb8e",
    role: "verification-only",
    runtime: "pinned-umd-shadow",
    cacheKey: "tianji.vendor.iztro@2.6.1-b78dfe391f65",
    urls: [
      "https://cdn.jsdelivr.net/npm/iztro@2.6.1/dist/iztro-v2.6.1.min.js",
      "https://unpkg.com/iztro@2.6.1/dist/iztro-v2.6.1.min.js",
    ],
  };
  const state = {
    status: "idle",
    source: "",
    error: "",
    vendor: null,
    lastReport: null,
    lastSuite: null,
    loadedAt: null,
  };
  const BRANCHES = "子丑寅卯辰巳午未申酉戌亥".split("");
  const FOUR_ASSIST = new Set(["左辅", "右弼", "文昌", "文曲"]);
  const clone = (o) => {
    try {
      return structuredClone(o);
    } catch (_) {
      try {
        return JSON.parse(JSON.stringify(o));
      } catch (__) {
        return o;
      }
    }
  };
  const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  const hasVendor = () =>
    !!(window.iztro && window.iztro.astro && typeof window.iztro.astro.byLunar === "function");
  function evalVendor(code) {
    if (!code || typeof code !== "string") return false;
    try {
      (0, eval)(code + "\n//# sourceURL=iztro-v2.6.1.tianji.js");
      return hasVendor();
    } catch (e) {
      state.error = String((e && e.message) || e);
      return false;
    }
  }
  function badge(mode, msg) {
    let b = document.getElementById("tjZiweiVerifyBadge");
    const anchor =
      document.getElementById("tjZiweiBadge") ||
      document.getElementById("tjBaziVerifyBadge") ||
      document.getElementById("buildVersion");
    if (!b && anchor) {
      b = document.createElement("span");
      b.id = "tjZiweiVerifyBadge";
      anchor.insertAdjacentElement("afterend", b);
    }
    if (!b) return;
    b.className =
      mode === "ready" ? "ready" : mode === "diff" ? "diff" : mode === "gap" ? "gap" : "";
    b.textContent =
      mode === "ready"
        ? "ZiweiVerify 2.6.1 ✓"
        : mode === "diff"
          ? "ZiweiVerify 2.6.1 !"
          : mode === "gap"
            ? "ZiweiVerify 2.6.1 △"
            : "ZiweiVerify 2.6.1 ·";
    b.title = msg || "";
  }
  async function fetchVendorText(url, ms = 3200) {
    const ac = typeof AbortController !== "undefined" ? new AbortController() : null,
      tm = ac ? setTimeout(() => ac.abort(), ms) : 0;
    try {
      const r = await fetch(url, {
        mode: "cors",
        cache: "force-cache",
        signal: ac ? ac.signal : void 0,
      });
      if (!r.ok) throw new Error("HTTP " + r.status);
      return await r.text();
    } finally {
      if (tm) clearTimeout(tm);
    }
  }
  let vendorPending = null;
  function loadVendor(force = false) {
    if (vendorPending) return vendorPending;
    if (state.status === "unavailable" && !force) return Promise.resolve(state);
    vendorPending = loadVendorOnce(force).finally(() => {
      vendorPending = null;
    });
    return vendorPending;
  }
  async function loadVendorOnce(force = false) {
    if (hasVendor() && !force) {
      state.vendor = window.iztro;
      state.status = "ready";
      state.source = state.source || "preloaded";
      state.loadedAt = Date.now();
      badge("ready", "iztro 2.6.1 已存在于页面环境；仅作紫微影子验证。");
      renderVerifyIfOpen();
      return state;
    }
    state.status = "loading";
    state.error = "";
    badge("", "iztro 2.6.1 校验引擎准备中；Tianji 紫微主结果不受影响。");
    renderVerifyIfOpen();

    for (const url of VENDOR.urls) {
      try {
        const code = await fetchVendorText(url);
        if (!(await TianjiVendorIntegrity.verify(code, VENDOR.sha256)))
          throw new Error("第三方脚本完整性校验失败");
        if (!evalVendor(code)) throw new Error("脚本载入后未发现 iztro.astro.byLunar");
        state.vendor = window.iztro;
        state.status = "ready";
        state.source = url;
        state.loadedAt = Date.now();
        state.error = "";
        badge("ready", "iztro 2.6.1 已按需加载；只验证，不接管 TianjiZiwei。");
        renderVerifyIfOpen();
        return state;
      } catch (e) {
        state.error = String((e && e.message) || e);
      }
    }
    state.status = "unavailable";
    state.vendor = null;
    badge("", "iztro 校验器当前不可用；Tianji Ziwei Core 仍独立正常运行。");
    renderVerifyIfOpen();
    return state;
  }
  function normPalaceName(n) {
    n = String(n || "").replace(/宮/g, "宫");
    if (n === "仆役" || n === "僕役") return "交友";
    return n;
  }
  function sortNames(a) {
    return (a || [])
      .map((x) => (typeof x === "string" ? x : (x && x.name) || ""))
      .filter(Boolean)
      .sort((x, y) => x.localeCompare(y, "zh-CN"));
  }
  function row(id, label, a, b, opt = {}) {
    if (opt.gap)
      return {
        id,
        label,
        primary: a,
        verifier: b,
        status: "GAP",
        comparable: false,
        category: "coverage",
        note: opt.note || "",
      };
    if (opt.comparable === false)
      return {
        id,
        label,
        primary: a,
        verifier: b,
        status: "N/A",
        comparable: false,
        category: opt.category || "deterministic",
        note: opt.note || "",
      };
    const ok = typeof opt.test === "function" ? !!opt.test(a, b) : eq(a, b);
    return {
      id,
      label,
      primary: a,
      verifier: b,
      status: ok ? "PASS" : opt.policyOnDiff ? "POLICY" : "DIFF",
      comparable: true,
      category: opt.category || "deterministic",
      note: opt.note || "",
    };
  }
  function vendorChart(input) {
    if (!hasVendor()) throw new Error("iztro verifier unavailable");
    const l = input.lunar,
      g = input.gender === "F" ? "女" : "男",
      date = `${l.year}-${l.month}-${l.day}`;
    const a = window.iztro.astro.byLunar(date, input.hourBranchIndex, g, !!l.isLeap, true, "zh-CN");
    return a && typeof a.toJSON === "function" ? a.toJSON() : a;
  }
  function pMap(core) {
    const o = {};
    (core.palaces || []).forEach((p) => (o[p.branch] = p));
    return o;
  }
  function vMap(v) {
    const o = {};
    ((v && v.palaces) || []).forEach((p) => (o[p.earthlyBranch] = p));
    return o;
  }
  function palaceNames(map, kind) {
    return BRANCHES.map((b) => [
      b,
      normPalaceName(kind === "p" ? map[b] && map[b].name : map[b] && map[b].name),
    ]);
  }
  function stems(pm, vm) {
    return {
      p: BRANCHES.map((b) => [b, (pm[b] && pm[b].stem) || ""]),
      v: BRANCHES.map((b) => [b, (vm[b] && vm[b].heavenlyStem) || ""]),
    };
  }
  function majorDistribution(pm, vm) {
    return {
      p: BRANCHES.map((b) => [
        b,
        sortNames(((pm[b] && pm[b].stars) || []).filter((s) => s.type === "major")),
      ]),
      v: BRANCHES.map((b) => [b, sortNames(vm[b] && vm[b].majorStars)]),
    };
  }
  function assistDistribution(pm, vm) {
    return {
      p: BRANCHES.map((b) => [
        b,
        sortNames(
          ((pm[b] && pm[b].stars) || []).filter(
            (s) => s.type === "assistant" && FOUR_ASSIST.has(s.name),
          ),
        ),
      ]),
      v: BRANCHES.map((b) => [
        b,
        sortNames(((vm[b] && vm[b].minorStars) || []).filter((s) => FOUR_ASSIST.has(s.name))),
      ]),
    };
  }
  function transformsPrimary(core) {
    return (core.transformations || []).map((x) => `${x.type}:${x.star}`).sort();
  }
  function transformsVendor(v) {
    const a = [];
    ((v && v.palaces) || []).forEach((p) => {
      [...(p.majorStars || []), ...(p.minorStars || []), ...(p.adjectiveStars || [])].forEach(
        (s) => {
          if (s && s.mutagen) a.push(`${s.mutagen}:${s.name}`);
        },
      );
    });
    return [...new Set(a)].sort();
  }
  function decadalSequenceP(core) {
    return (core.palaces || [])
      .slice()
      .sort(
        (a, b) =>
          ((a.majorPeriod && a.majorPeriod.startAge) || 999) -
          ((b.majorPeriod && b.majorPeriod.startAge) || 999),
      )
      .map((p) => p.branch);
  }
  function decadalSequenceV(v) {
    return ((v && v.palaces) || [])
      .filter((p) => p.decadal && Array.isArray(p.decadal.range))
      .slice()
      .sort((a, b) => a.decadal.range[0] - b.decadal.range[0])
      .map((p) => p.earthlyBranch);
  }
  function decadalRangesP(pm) {
    return BRANCHES.map((b) => [
      b,
      pm[b] && pm[b].majorPeriod ? [pm[b].majorPeriod.startAge, pm[b].majorPeriod.endAge] : null,
    ]);
  }
  function decadalRangesV(vm) {
    return BRANCHES.map((b) => [
      b,
      vm[b] && vm[b].decadal && Array.isArray(vm[b].decadal.range)
        ? vm[b].decadal.range.slice(0, 2)
        : null,
    ]);
  }
  function coverage(v) {
    const pal = (v && v.palaces) || [],
      all = pal.flatMap((p) => [
        ...(p.majorStars || []),
        ...(p.minorStars || []),
        ...(p.adjectiveStars || []),
      ]),
      extras = pal.flatMap((p) =>
        (p.minorStars || []).filter((s) => !FOUR_ASSIST.has(s.name)).map((s) => s.name),
      ),
      adj = pal.flatMap((p) => (p.adjectiveStars || []).map((s) => s.name));
    return {
      brightness: all.filter((s) => s && s.brightness).length,
      extraMinor: [...new Set(extras)].sort(),
      adjective: [...new Set(adj)].sort(),
      changsheng: pal.filter((p) => p.changsheng12).length,
      boshi: pal.filter((p) => p.boshi12).length,
      jiangqian: pal.filter((p) => p.jiangqian12).length,
      suiqian: pal.filter((p) => p.suiqian12).length,
      ages: pal.reduce((n, p) => n + (Array.isArray(p.ages) ? p.ages.length : 0), 0),
      soul: (v && v.soul) || "",
      body: (v && v.body) || "",
    };
  }
  function compare(input = {}) {
    if (!hasVendor()) return { available: false, ok: false, reason: "iztro verifier unavailable" };
    if (!window.TianjiZiwei)
      return { available: true, ok: false, reason: "TianjiZiwei unavailable" };
    const normalized = {
      lunar: clone(input.lunar),
      hourBranchIndex: Number(input.hourBranchIndex ?? input.hourBranch),
      gender: input.gender === "F" ? "F" : "M",
    };
    if (normalized.hourBranchIndex < 0 || normalized.hourBranchIndex > 11)
      return {
        available: true,
        ok: false,
        reason: "TianjiZiwei v90 当前只支持 0..11 时支；晚子时 12 属能力缺口",
      };
    const core = TianjiZiwei.calculate(normalized),
      v = vendorChart(normalized),
      pm = pMap(core),
      vm = vMap(v),
      rows = [];
    rows.push(
      row(
        "palace.life",
        "命宫地支",
        core.lifePalace && core.lifePalace.branch,
        v && v.earthlyBranchOfSoulPalace,
      ),
    );
    rows.push(
      row(
        "palace.body",
        "身宫地支",
        core.bodyPalace && core.bodyPalace.branch,
        v && v.earthlyBranchOfBodyPalace,
      ),
    );
    rows.push(row("bureau", "五行局", core.bureau && core.bureau.name, v && v.fiveElementsClass));
    rows.push(
      row("palace.names", "十二宫名按地支", palaceNames(pm, "p"), palaceNames(vm, "v"), {
        note: "双方宫位数组索引不同，因此统一转换为子→亥地支后比较；仆役宫归一为交友。",
      }),
    );
    const st = stems(pm, vm);
    rows.push(row("palace.stems", "十二宫天干", st.p, st.v));
    const md = majorDistribution(pm, vm);
    rows.push(
      row("stars.major14", "十四主星落宫", md.p, md.v, {
        note: "只比较双方共同覆盖的十四主星，不把 iztro 额外星曜混入。",
      }),
    );
    const ad = assistDistribution(pm, vm);
    rows.push(
      row("stars.assist4", "左辅右弼文昌文曲", ad.p, ad.v, {
        note: "Tianji v90 目前只覆盖这四颗辅星；其余辅煞星进入 GAP。",
      }),
    );
    rows.push(
      row("transformations", "生年四化", transformsPrimary(core), transformsVendor(v), {
        note: "比较“化曜类型:星名”，不依赖宫位数组索引。",
      }),
    );
    rows.push(
      row("decadal.sequence", "大限宫位顺逆序列", decadalSequenceP(core), decadalSequenceV(v), {
        note: "只比较大限沿十二宫的运行顺序，年龄口径另行判断。",
      }),
    );
    rows.push(
      row("decadal.ranges", "十二宫大限年龄区间", decadalRangesP(pm), decadalRangesV(vm), {
        policyOnDiff: true,
        note: "年龄区间若不同先归入 POLICY：可能来自虚岁、起限年龄或流派配置；运行顺序若不同才直接列 DIFF。",
      }),
    );
    const cv = coverage(v);
    rows.push(
      row("gap.extra-stars", "完整辅星/煞星覆盖", "仅左辅右弼文昌文曲", cv.extraMinor, {
        gap: cv.extraMinor.length > 0,
        note: "iztro 的 minorStars 还包含更多吉煞辅星；Tianji 简盘尚未实现。",
      }),
    );
    rows.push(
      row("gap.adjective", "杂曜系统", "未实现", cv.adjective, {
        gap: cv.adjective.length > 0,
        note: "iztro 提供 adjectiveStars；Tianji v90 未覆盖。",
      }),
    );
    rows.push(
      row("gap.brightness", "庙旺得利平陷", "未实现", cv.brightness, {
        gap: cv.brightness > 0,
        note: `iztro 当前盘有 ${cv.brightness} 个星曜携带亮度数据。`,
      }),
    );
    rows.push(
      row("gap.changsheng", "长生十二神", "未实现", cv.changsheng, {
        gap: cv.changsheng > 0,
        note: "iztro Palace.changsheng12 已覆盖十二宫。",
      }),
    );
    rows.push(
      row("gap.boshi", "博士十二神", "未实现", cv.boshi, {
        gap: cv.boshi > 0,
        note: "iztro Palace.boshi12 已覆盖。",
      }),
    );
    rows.push(
      row("gap.jiangqian", "将前十二神", "未实现", cv.jiangqian, {
        gap: cv.jiangqian > 0,
        note: "iztro Palace.jiangqian12 已覆盖。",
      }),
    );
    rows.push(
      row("gap.suiqian", "岁前十二神", "未实现", cv.suiqian, {
        gap: cv.suiqian > 0,
        note: "iztro Palace.suiqian12 已覆盖。",
      }),
    );
    rows.push(
      row("gap.xiaoxian", "小限年龄", "未实现", cv.ages, {
        gap: cv.ages > 0,
        note: "iztro Palace.ages 提供小限年龄序列。",
      }),
    );
    rows.push(
      row(
        "gap.soul-body-master",
        "命主/身主",
        "未实现",
        { soul: cv.soul, body: cv.body },
        {
          gap: !!(cv.soul || cv.body),
          note: "iztro Astrolabe 提供命主与身主；Tianji 简盘尚未纳入。",
        },
      ),
    );
    rows.push(
      row("gap.late-rat", "晚子时独立索引", "时支仅 0..11", "iztro timeIndex 0..12", {
        gap: true,
        note: "iztro 区分早子时 0 与晚子时 12，并支持 dayDivide 配置；Tianji v90 尚未区分。",
      }),
    );
    rows.push(
      row(
        "gap.algorithm-variants",
        "完整流派算法切换",
        "单一 legacy-simplified",
        "iztro default / zhongzhou",
        {
          gap: true,
          note: "iztro 2.5+ 支持 default 与 zhongzhou 安星算法；Tianji 当前只有现有简盘口径。",
        },
      ),
    );
    const counts = { PASS: 0, DIFF: 0, POLICY: 0, GAP: 0, "N/A": 0 };
    rows.forEach((r) => (counts[r.status] = (counts[r.status] || 0) + 1));
    const report = {
      available: true,
      ok: counts.DIFF === 0,
      at: new Date().toISOString(),
      input: clone(normalized),
      vendor: {
        id: VENDOR.id,
        version: VENDOR.version,
        license: VENDOR.license,
        tag: VENDOR.tag,
        commit: VENDOR.commit,
        source: state.source,
      },
      counts,
      rows,
      raw: { primary: core, verifier: v },
    };
    state.lastReport = report;
    return report;
  }
  const CASES = [
    {
      id: "base-M",
      label: "1986 闰前常规男命",
      l: { year: 1986, month: 4, day: 28, isLeap: false },
      h: 9,
      g: "M",
    },
    {
      id: "base-F",
      label: "1986 同盘女命",
      l: { year: 1986, month: 4, day: 28, isLeap: false },
      h: 9,
      g: "F",
    },
    {
      id: "zi-hour",
      label: "2026 子时",
      l: { year: 2026, month: 8, day: 24, isLeap: false },
      h: 0,
      g: "M",
    },
    {
      id: "hai-hour",
      label: "2026 亥时",
      l: { year: 2026, month: 8, day: 24, isLeap: false },
      h: 11,
      g: "F",
    },
    {
      id: "leap-15",
      label: "2025 闰六月十五",
      l: { year: 2025, month: 6, day: 15, isLeap: true },
      h: 5,
      g: "M",
    },
    {
      id: "leap-16",
      label: "2025 闰六月十六",
      l: { year: 2025, month: 6, day: 16, isLeap: true },
      h: 5,
      g: "M",
    },
    {
      id: "month12",
      label: "2033 十二月边界",
      l: { year: 2033, month: 12, day: 29, isLeap: false },
      h: 7,
      g: "F",
    },
  ];
  function suite() {
    if (!hasVendor())
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
        const report = compare({ lunar: x.l, hourBranchIndex: x.h, gender: x.g });
        cases.push({ id: x.id, label: x.label, report });
        report.rows.forEach((r) => (summary[r.status] = (summary[r.status] || 0) + 1));
      } catch (e) {
        cases.push({
          id: x.id,
          label: x.label,
          error: String((e && e.message) || e),
          report: null,
        });
        summary.DIFF++;
      }
    }
    const out = {
      available: true,
      at: new Date().toISOString(),
      cases,
      summary,
      ok: summary.DIFF === 0,
    };
    state.lastSuite = out;
    badge(
      !out.ok ? "diff" : summary.GAP ? "gap" : "ready",
      `紫微交叉验证：PASS ${summary.PASS} · DIFF ${summary.DIFF} · POLICY ${summary.POLICY} · GAP ${summary.GAP} · N/A ${summary["N/A"]}`,
    );
    renderVerifyIfOpen();
    return out;
  }
  function esc(s) {
    return String(s == null ? "" : s).replace(
      /[&<>\"]/g,
      (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '\"': "&quot;" })[c],
    );
  }
  function liveHTML() {
    const S = state.lastSuite,
      sum = (S && S.summary) || { PASS: 0, DIFF: 0, POLICY: 0, GAP: 0, "N/A": 0 },
      st = state.status;
    const statusText =
      st === "ready"
        ? "iztro 校验引擎已就绪"
        : st === "loading"
          ? "正在准备 iztro"
          : st === "unavailable"
            ? "iztro 当前不可用"
            : "等待初始化";
    const cases =
      S && S.cases
        ? S.cases
            .map((x) => {
              const c = x.report && x.report.counts;
              return `<div class="tjzv-case"><b>${esc(x.label)}</b><small>${x.error ? esc(x.error) : `PASS ${c.PASS} · DIFF ${c.DIFF} · 口径 ${c.POLICY} · GAP ${c.GAP} · N/A ${c["N/A"]}`}</small></div>`;
            })
            .join("")
        : "";
    return `<div class="panel blk tjzv-live"><div class="tjzv-head"><div><h4>紫微斗数交叉验证 · v91</h4><small>${statusText} · iztro ${VENDOR.version} · MIT · tag ${VENDOR.tag} · verification-only</small></div><div class="tjzv-stat"><span class="pass">PASS ${sum.PASS}</span><span class="diff">DIFF ${sum.DIFF}</span><span class="policy">口径 ${sum.POLICY}</span><span class="gap">GAP ${sum.GAP}</span><span class="na">N/A ${sum["N/A"]}</span></div></div>${state.error && st === "unavailable" ? `<p class="tjzv-note">最近加载错误：${esc(state.error)}</p>` : ""}<div class="tjzv-cases">${cases || '<div class="tjzv-case"><b>尚未运行</b><small>联网载入固定版本 iztro 后自动运行；主紫微盘不依赖它。</small></div>'}</div><div class="tjzv-actions"><button class="gbtn sm" id="tjzvRun" type="button">重新运行验证</button><button class="gbtn sm" id="tjzvReload" type="button">重新加载 iztro</button></div><p class="tjzv-note"><strong>判读：</strong>PASS = 重叠能力一致；DIFF = 同输入同基础规则仍不同；口径 = 年龄/流派等规则可能不同；GAP = iztro 已覆盖而 Tianji 简盘尚未实现；N/A = 当前条件不直接比较。任何第三方结果都不会覆盖 TianjiZiwei。</p></div>`;
  }
  function patchVerifyPage() {
    try {
      if (!window.REF_PANES || typeof REF_PANES.verify !== "function" || REF_PANES.verify.__v91)
        return;
      const base = REF_PANES.verify,
        oldBind = window.REF_BIND && REF_BIND.verify;
      const fn = () => liveHTML() + base();
      fn.__v91 = true;
      REF_PANES.verify = fn;
      if (window.REF_BIND)
        REF_BIND.verify = function () {
          try {
            if (typeof oldBind === "function") oldBind();
          } catch (_) {}
          const a = document.getElementById("tjzvRun"),
            b = document.getElementById("tjzvReload");
          if (a)
            a.onclick = () => {
              try {
                if (hasVendor()) suite();
                else loadVendor().then(() => hasVendor() && suite());
              } catch (e) {
                state.error = String((e && e.message) || e);
              }
            };
          if (b) b.onclick = () => loadVendor(true).then(() => hasVendor() && suite());
        };
    } catch (e) {
      try {
        console.warn("[TianjiZiweiVerifier] patch verify page", e);
      } catch (_) {}
    }
  }
  function renderVerifyIfOpen() {
    try {
      const p = document.getElementById("pane-verify");
      if (p && p.classList.contains("on") && typeof refRender === "function") refRender("verify");
    } catch (_) {}
  }
  function manifest() {
    return {
      module: "Tianji Ziwei Verification Layer",
      version: VERSION,
      build: BUILD,
      baseline: "v90",
      vendor: clone(VENDOR),
      state: { status: state.status, source: state.source, error: state.error },
      mode: "shadow-verification-only",
      comparison: [
        "命宫",
        "身宫",
        "五行局",
        "十二宫名",
        "宫干",
        "十四主星",
        "左辅右弼文昌文曲",
        "生年四化",
        "大限顺序",
        "大限区间",
      ],
      coverageGaps: [
        "完整辅煞星",
        "杂曜",
        "庙旺落陷",
        "长生十二神",
        "博士十二神",
        "将前十二神",
        "岁前十二神",
        "小限",
        "命主身主",
        "晚子时",
        "中州派算法",
      ],
      principle: "iztro 只作为外部参考实现；先识别重叠算法差异，再将未实现能力登记为 GAP。",
    };
  }
  const API = Object.freeze({
    version: VERSION,
    build: BUILD,
    vendor: clone(VENDOR),
    state,
    loadVendor,
    compare,
    suite,
    manifest,
    cases: () => clone(CASES),
    hasVendor,
  });
  window.TianjiZiweiVerifier = API;
  try {
    if (window.TianjiCore) {
      TianjiCore.registerLicense({
        id: "iztro@2.6.1",
        license: "MIT",
        status: "verified-permissive",
        note: "SylarLong/iztro v2.6.1；MIT License。v91 只作为紫微影子验证器，不接管 Tianji 主计算。",
        checkedAt: "2026-10-04",
      });
      TianjiCore.registerSource({
        id: "iztro-2.6.1",
        type: "third-party",
        title: "SylarLong/iztro",
        version: "2.6.1",
        license: "MIT",
        repository: "SylarLong/iztro",
        tag: "v2.6.1",
        commit: VENDOR.commit,
        role: "verification-only",
        note: "固定版本 UMD；byLunar(..., fixLeap=true, zh-CN) 与 Tianji 紫微简盘逐项对拍。",
      });
      TianjiCore.registerSource({
        id: "tianji-v91-ziwei-verification",
        type: "internal",
        title: "Tianji Ziwei Verification Layer",
        version: VERSION,
        baseline: "v90",
      });
      TianjiCore.registerEngine(
        {
          id: "ziwei.verify.iztro.v1",
          system: "ziwei",
          name: "iztro Cross Verifier",
          version: VERSION,
          source: "iztro-2.6.1",
          doctrine: "shadow verify / default algorithm / fixLeap=true / no takeover",
        },
        (input) => compare(input || {}),
      );
    }
  } catch (e) {
    try {
      console.warn("[TianjiZiweiVerifier] registry", e);
    } catch (_) {}
  }
  const prev = window.TianjiSystem || {};
  window.TianjiSystem = Object.freeze({
    version: "v91",
    build: BUILD,
    baseline: "v84",
    core: window.TianjiCore || prev.core || null,
    time: window.TianjiTime || prev.time || null,
    verify: window.TianjiVerifier || prev.verify || null,
    bazi: window.TianjiBazi || prev.bazi || null,
    baziVerify: window.TianjiBaziVerifier || prev.baziVerify || null,
    ziwei: window.TianjiZiwei || prev.ziwei || null,
    ziweiVerify: API,
    manifest: () => ({
      product: "天机盘",
      version: "v91",
      build: BUILD,
      baseline: "v84",
      ziwei: window.TianjiZiwei && TianjiZiwei.manifest ? TianjiZiwei.manifest() : null,
      ziweiVerify: manifest(),
    }),
  });
  try {
    const bv = document.getElementById("buildVersion");
  } catch (_) {}
  patchVerifyPage();
  badge("", "iztro 紫微交叉验证准备中；TianjiZiwei 主计算不受影响。");
})();
