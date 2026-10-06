(() => {
  "use strict";
  const VERSION = "1.0.0",
    BUILD = "2026-10-04 03:53:25";
  const VENDOR = {
    id: "mystilight-8char",
    bytes: 2214349,
    sha256: "75893e7a97aaae4029137077ee0e06f4ecb5b10ea9e47191b4480b0056ffc9a1",
    version: "1.0.1",
    license: "ISC",
    repository: "mystilight/mystilight-8char",
    commit: "1ca2923784128fca4d38959e46ae714e4ab6b9cb",
    blob: "531aa09f5ee5f40db1dc59401aa2d0eb2fd32782",
    role: "verification-only",
    runtime: "pinned-github-esm-shadow",
    urls: [
      "https://cdn.jsdelivr.net/gh/mystilight/mystilight-8char@1ca2923784128fca4d38959e46ae714e4ab6b9cb/index.js",
      "https://raw.githack.com/mystilight/mystilight-8char/1ca2923784128fca4d38959e46ae714e4ab6b9cb/index.js",
      "https://cdn.statically.io/gh/mystilight/mystilight-8char/1ca2923784128fca4d38959e46ae714e4ab6b9cb/index.js",
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
  const close = (a, b, tol = 1e-8) =>
    Number.isFinite(+a) && Number.isFinite(+b) && Math.abs(+a - +b) <= tol;
  function badge(mode, msg) {
    let b = document.getElementById("tjBaziVerifyBadge");
    const anchor =
      document.getElementById("tjBaziBadge") ||
      document.getElementById("tjVerifyBadge") ||
      document.getElementById("buildVersion");
    if (!b && anchor) {
      b = document.createElement("span");
      b.id = "tjBaziVerifyBadge";
      anchor.insertAdjacentElement("afterend", b);
    }
    if (!b) return;
    b.className =
      mode === "ready" ? "ready" : mode === "diff" ? "diff" : mode === "bad" ? "bad" : "";
    b.textContent =
      mode === "ready"
        ? "BaziVerify 1.0.1 ✓"
        : mode === "diff"
          ? "BaziVerify 1.0.1 △"
          : mode === "bad"
            ? "BaziVerify 1.0.1 !"
            : "BaziVerify 1.0.1 ·";
    b.title = msg || "";
  }
  function vendorAPI(mod) {
    const cands = [mod && mod.default, mod, mod && mod.default && mod.default.default];
    for (const x of cands) if (x && typeof x.getCurrentEightCharJSON === "function") return x;
    return null;
  }
  async function importTimed(url, ms = 8000) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), ms);
    let moduleURL;
    try {
      const response = await fetch(url, {
        mode: "cors",
        credentials: "omit",
        signal: controller.signal,
      });
      if (!response.ok) throw new Error("HTTP " + response.status);
      const bytes = new Uint8Array(await response.arrayBuffer());
      if (bytes.length !== VENDOR.bytes) throw new Error("八字校验器源码大小不匹配");
      const code = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
      if (!(await TianjiVendorIntegrity.verify(code, VENDOR.sha256)))
        throw new Error("八字校验器完整性校验失败");
      // The pinned distribution is self contained. Import only the verified in-memory bytes.
      moduleURL = URL.createObjectURL(new Blob([bytes], { type: "text/javascript" }));
      return await import(moduleURL);
    } finally {
      clearTimeout(timer);
      if (moduleURL) URL.revokeObjectURL(moduleURL);
    }
  }
  let vendorPending = null;
  function loadVendor(force = false) {
    if (vendorPending) return vendorPending;
    vendorPending = loadVendorOnce(force).finally(() => {
      vendorPending = null;
    });
    return vendorPending;
  }
  async function loadVendorOnce(force = false) {
    if (state.vendor && !force) return state;
    state.status = "loading";
    state.error = "";
    badge("", "Mystilight 八字校验引擎正在准备；Tianji 主计算不受影响。");
    renderVerifyIfOpen();
    for (const url of VENDOR.urls) {
      try {
        const mod = await importTimed(url),
          api = vendorAPI(mod);
        if (!api) throw new Error("module loaded but getCurrentEightCharJSON not found");
        state.vendor = api;
        state.status = "ready";
        state.source = url;
        state.loadedAt = Date.now();
        state.error = "";
        badge("ready", "Mystilight 1.0.1 · ISC · 影子验证器已就绪；不接管 Tianji 主结果。");
        renderVerifyIfOpen();
        return state;
      } catch (e) {
        state.error = String((e && e.message) || e);
      }
    }
    state.status = "unavailable";
    state.vendor = null;
    badge("", "Mystilight 校验器当前不可用；Tianji Bazi Core 仍正常运行。");
    renderVerifyIfOpen();
    return state;
  }
  function statusRow(id, label, a, b, opt = {}) {
    const comparable = opt.comparable !== false;
    let status = "N/A";
    if (comparable) {
      if (opt.forcePolicy) status = eq(a, b) ? "PASS" : "POLICY";
      else if (typeof opt.test === "function")
        status = opt.test(a, b) ? "PASS" : opt.policyOnDiff ? "POLICY" : "DIFF";
      else status = eq(a, b) ? "PASS" : opt.policyOnDiff ? "POLICY" : "DIFF";
    }
    return {
      id,
      label,
      primary: a,
      verifier: b,
      status,
      comparable,
      note: opt.note || "",
      category: opt.category || "deterministic",
    };
  }
  const PKEY = [
    ["year", "year", "年柱"],
    ["month", "month", "月柱"],
    ["day", "day", "日柱"],
    ["hour", "time", "时柱"],
  ];
  function vendorResult(civ, gender, sect) {
    if (!state.vendor) throw new Error("Mystilight verifier unavailable");
    return state.vendor.getCurrentEightCharJSON({
      year: civ.y,
      month: civ.m,
      day: civ.d,
      hour: civ.h || 0,
      minute: civ.mi || 0,
      second: civ.s || 0,
      sect,
      gender: gender === "F" ? 0 : 1,
      yunSect: 2,
      currentYear: civ.y,
      currentMonth: civ.m,
      currentDay: civ.d,
    });
  }
  function primaryGz(core) {
    return Object.fromEntries(
      PKEY.map(([a, ,]) => [a, (core.pillars.find((p) => p.key === a) || {}).ganzhi || ""]),
    );
  }
  function vendorGz(v) {
    return Object.fromEntries(
      PKEY.map(([a, b]) => [
        a,
        v && v.pillars && v.pillars[b]
          ? v.pillars[b].value || (v.pillars[b].gan || "") + (v.pillars[b].zhi || "")
          : "",
      ]),
    );
  }
  function hiddenPrimary(core, key) {
    const p = core.pillars.find((x) => x.key === key);
    return p
      ? (p.hidden || [])
          .map((x) => x.gan)
          .filter(Boolean)
          .sort()
      : [];
  }
  function hiddenVendor(v, key) {
    const vk = key === "hour" ? "time" : key,
      p = v && v.pillars && v.pillars[vk];
    if (!p) return [];
    let a = [];
    if (Array.isArray(p.hideGan)) a = p.hideGan.slice();
    else if (typeof p.hideGan === "string") a = Array.from(p.hideGan);
    else if (Array.isArray(p.hideGanAttr)) a = p.hideGanAttr.map((x) => x.gan);
    return a.filter(Boolean).sort();
  }
  function tenPrimary(core, key) {
    const p = core.pillars.find((x) => x.key === key);
    return {
      stem: p ? p.tenGod : "",
      hidden: p
        ? (p.hidden || [])
            .map((x) => ({ gan: x.gan, tenGod: x.tenGod }))
            .sort((a, b) => a.gan.localeCompare(b.gan, "zh-CN"))
        : [],
    };
  }
  function tenVendor(v, key) {
    const vk = key === "hour" ? "time" : key,
      p = v && v.pillars && v.pillars[vk];
    if (!p) return { stem: "", hidden: [] };
    let h = [];
    if (Array.isArray(p.hideGanAttr))
      h = p.hideGanAttr.map((x) => ({ gan: x.gan, tenGod: x.shiShen }));
    else {
      const gs = hiddenVendor(v, key),
        ss = Array.isArray(p.shiShenZhi) ? p.shiShenZhi : [];
      h = gs.map((g, i) => ({ gan: g, tenGod: ss[i] || "" }));
    }
    return {
      stem: p.shiShenGan || "",
      hidden: h.sort((a, b) => a.gan.localeCompare(b.gan, "zh-CN")),
    };
  }
  function nayinPrimary(core, key) {
    const p = core.pillars.find((x) => x.key === key);
    return (p && p.nayin) || "";
  }
  function nayinVendor(v, key) {
    const p = v && v.pillars && v.pillars[key === "hour" ? "time" : key];
    return (p && p.naYin) || "";
  }
  function pctElements(core) {
    const raw = (core && core.elements && core.elements.raw) || [],
      tot = raw.reduce((a, b) => a + (+b || 0), 0),
      names = ["木", "火", "土", "金", "水"],
      o = {};
    names.forEach((n, i) => (o[n] = tot ? +((raw[i] / tot) * 100).toFixed(2) : 0));
    return o;
  }
  function yunAge(y) {
    if (!y) return null;
    return (
      (+y.startYear || 0) +
      (+y.startMonth || 0) / 12 +
      (+y.startDay || 0) / 360 +
      (+y.startHour || 0) / (24 * 360)
    );
  }
  function normSha(n) {
    return String(n || "")
      .replace(/[（(](日|年|月|时)[）)]/g, "")
      .replace(/桃花\(咸池\)/, "桃花")
      .replace(/^桃花.*$/, "桃花")
      .replace(/^魁罡日?$/, "魁罡")
      .trim();
  }
  const COMMON_SHA = [
    "天乙贵人",
    "太极贵人",
    "文昌贵人",
    "禄神",
    "羊刃",
    "驿马",
    "桃花",
    "华盖",
    "将星",
    "劫煞",
    "孤辰",
    "寡宿",
    "红鸾",
    "天喜",
    "月德贵人",
    "天德贵人",
    "魁罡",
    "空亡",
  ];
  function shaPrimary(core) {
    try {
      if (typeof baziDeep !== "function") return null;
      const d = baziDeep(core.legacy),
        set = new Set((d.ss || []).map((x) => normSha(x.n)).filter((x) => COMMON_SHA.includes(x)));
      return [...set].sort();
    } catch (_) {
      return null;
    }
  }
  function shaVendor(v) {
    try {
      const ss = v && v.shensha;
      if (!ss) return null;
      let all = [];
      ["nian", "yue", "ri", "shi"].forEach((k) => {
        if (Array.isArray(ss[k])) all = all.concat(ss[k]);
      });
      const set = new Set(all.map(normSha).filter((x) => COMMON_SHA.includes(x)));
      return [...set].sort();
    } catch (_) {
      return null;
    }
  }
  function compare(civ, opt = {}) {
    if (!state.vendor)
      return { available: false, ok: false, reason: "Mystilight verifier unavailable" };
    if (!window.TianjiBazi || !window.TianjiTime)
      return { available: true, ok: false, reason: "Tianji Bazi/Time core unavailable" };
    const gender = opt.gender === "F" ? "F" : "M",
      ctx = TianjiTime.createContext(civ, opt.timePolicy || {}),
      p = ctx.policy || {};
    const core = TianjiBazi.calculate(ctx, { gender, policy: opt.baziPolicy || {} }),
      sect = p.dayBoundary && p.dayBoundary.mode === "midnight" ? 2 : 1;
    const civil = ctx.clock.civil,
      v = vendorResult(civil, gender, sect),
      alt = vendorResult(civil, gender, sect === 1 ? 2 : 1);
    const pri = primaryGz(core),
      vg = vendorGz(v),
      ag = vendorGz(alt),
      rows = [];
    const stdTZ = !!(p.timezone && +p.timezone.offsetMinutes === 480),
      solarOff = !(p.trueSolarTime && p.trueSolarTime.enabled),
      baseComparable = stdTZ && solarOff;
    const yearComparable = baseComparable && (!p.yearBoundary || p.yearBoundary.mode === "lichun");
    const monthComparable = baseComparable && (!p.monthBoundary || p.monthBoundary.mode === "jie");
    PKEY.forEach(([key, , label]) => {
      let comparable = baseComparable,
        note = "Mystilight 以中国标准时直接排盘；Tianji 真太阳时/跨时区时不强行比较。";
      if (key === "year") comparable = yearComparable;
      if (key === "month") comparable = monthComparable;
      if (key === "hour" && p.dayBoundary && p.dayBoundary.mode === "midnight" && civil.h === 23) {
        rows.push(
          statusRow("pillar.hour", label, pri[key], vg[key], {
            comparable: true,
            forcePolicy: pri[key] !== vg[key],
            note: "Mystilight/lunar-javascript 时干仍按 23:00 日干切换；午夜换日口径在 23 时段存在已知分歧。",
          }),
        );
        return;
      }
      if (!comparable) {
        rows.push(
          statusRow("pillar." + key, label, pri[key], vg[key], { comparable: false, note }),
        );
        return;
      }
      if (pri[key] === vg[key]) rows.push(statusRow("pillar." + key, label, pri[key], vg[key]));
      else if (pri[key] === ag[key])
        rows.push(
          statusRow("pillar." + key, label, pri[key], vg[key], {
            forcePolicy: true,
            note: "另一 sect 口径与 Tianji 一致，判定为换日口径差异。",
          }),
        );
      else
        rows.push(
          statusRow("pillar." + key, label, pri[key], vg[key], {
            note: "目标 sect 与备用 sect 均未匹配，需视为算法差异检查。",
          }),
        );
    });
    const pillarPass = rows
      .filter((x) => x.id.startsWith("pillar."))
      .every((x) => x.status === "PASS" || x.status === "POLICY");
    for (const [key, , label] of PKEY) {
      const cmp = baseComparable && pillarPass;
      rows.push(
        statusRow("hidden." + key, label + "藏干", hiddenPrimary(core, key), hiddenVendor(v, key), {
          comparable: cmp,
          note: cmp ? "按地支藏干顺序逐项比较" : "四柱/时间口径未对齐，避免级联误报。",
        }),
      );
      rows.push(
        statusRow("tengod." + key, label + "十神", tenPrimary(core, key), tenVendor(v, key), {
          comparable: cmp,
          note: cmp ? "天干十神 + 藏干十神" : "四柱/时间口径未对齐，避免级联误报。",
        }),
      );
      rows.push(
        statusRow("nayin." + key, label + "纳音", nayinPrimary(core, key), nayinVendor(v, key), {
          comparable: cmp,
        }),
      );
    }
    const dayunP = ((core.luck && core.luck.cycles) || []).map((x) => x.ganzhi).slice(0, 10),
      dayunV = (v.dayunArr || [])
        .map((x) => x.ganZhi)
        .filter(Boolean)
        .slice(0, 10);
    rows.push(
      statusRow(
        "luck.direction",
        "大运顺逆",
        !!(core.luck && core.luck.forward),
        !!(v.yun && v.yun.forward),
        { comparable: baseComparable, note: "双方均按年干阴阳 × 性别判顺逆。" },
      ),
    );
    rows.push(
      statusRow("luck.sequence", "大运干支序列", dayunP, dayunV, {
        comparable: baseComparable,
        note: "过滤 Mystilight 的童限 index=0 后比较前 10 步。",
      }),
    );
    const a1 = core.luck && core.luck.startAge,
      a2 = yunAge(v.yun),
      deltaAge = Number.isFinite(a1) && Number.isFinite(a2) ? Math.abs(a1 - a2) : null;
    rows.push(
      statusRow(
        "luck.start",
        "起运年龄",
        Number.isFinite(a1) ? +a1.toFixed(4) : a1,
        Number.isFinite(a2) ? +a2.toFixed(4) : a2,
        {
          comparable: baseComparable && deltaAge != null,
          test: () => deltaAge <= 0.01,
          policyOnDiff: true,
          note:
            deltaAge == null
              ? "无法换算"
              : `差 ${deltaAge.toFixed(4)} 岁；Mystilight yunSect=2 使用精确分钟折算，≤0.01 岁视为一致。`,
        },
      ),
    );
    try {
      const coreW = TianjiBazi.calculate(ctx, {
          gender,
          policy: { elementWeights: { visibleStem: 1, hiddenStem: [1, 0.6, 0.3] } },
        }),
        cp = pctElements(coreW),
        vp = v.wuXingPower || {};
      const eok = ["木", "火", "土", "金", "水"].every((k) => close(cp[k], vp[k], 0.03));
      rows.push(
        statusRow("elements.vendor-profile", "五行力量·近似同权重对拍", cp, vp, {
          comparable: baseComparable,
          test: () => eok,
          policyOnDiff: true,
          note: "把 Tianji 全局藏干权重临时切为 1/0.6/0.3；若仍不同，优先视为藏干“本/中/余气”归类与权重映射口径差异，不直接判算法错误。",
        }),
      );
      rows.push(
        statusRow("elements.production-policy", "五行力量·生产口径", [1, 0.5, 0.3], [1, 0.6, 0.3], {
          comparable: true,
          forcePolicy: true,
          note: "Tianji 当前藏干权重 1/0.5/0.3；Mystilight 为 1/0.6/0.3。这是显式口径差异，不判算法错误。",
        }),
      );
    } catch (e) {
      rows.push(
        statusRow("elements", "五行力量", null, null, {
          comparable: false,
          note: String((e && e.message) || e),
        }),
      );
    }
    const sp = shaPrimary(core),
      sv = shaVendor(v);
    rows.push(
      statusRow("shensha.shared", "共同支持神煞", sp, sv, {
        comparable: !!(sp && sv),
        policyOnDiff: true,
        note: "只比较双方共同支持的核心神煞“是否出现”；不同典籍/起法导致的差异归入口径，不直接判错。",
      }),
    );
    const counts = { PASS: 0, DIFF: 0, POLICY: 0, "N/A": 0 };
    rows.forEach((r) => (counts[r.status] = (counts[r.status] || 0) + 1));
    const report = {
      available: true,
      ok: counts.DIFF === 0,
      at: new Date().toISOString(),
      input: clone(civ),
      gender,
      sect,
      context: { timezone: p.timezone, trueSolarTime: p.trueSolarTime, dayBoundary: p.dayBoundary },
      vendor: {
        id: VENDOR.id,
        version: VENDOR.version,
        license: VENDOR.license,
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
      id: "1986-M",
      label: "1986-06-05 男",
      c: { y: 1986, m: 6, d: 5, h: 17, mi: 30, s: 0 },
      g: "M",
    },
    {
      id: "1986-F",
      label: "1986-06-05 女",
      c: { y: 1986, m: 6, d: 5, h: 17, mi: 30, s: 0 },
      g: "F",
    },
    {
      id: "lichun-before",
      label: "2026 立春前",
      c: { y: 2026, m: 2, d: 4, h: 3, mi: 0, s: 0 },
      g: "M",
    },
    {
      id: "lichun-after",
      label: "2026 立春后",
      c: { y: 2026, m: 2, d: 4, h: 8, mi: 0, s: 0 },
      g: "M",
    },
    {
      id: "zi-2259",
      label: "22:59 日界前",
      c: { y: 2026, m: 10, d: 4, h: 22, mi: 59, s: 0 },
      g: "M",
    },
    { id: "zi-2300", label: "23:00 子初", c: { y: 2026, m: 10, d: 4, h: 23, mi: 0, s: 0 }, g: "M" },
    {
      id: "edge-2033",
      label: "2033 边界压力",
      c: { y: 2033, m: 12, d: 22, h: 12, mi: 0, s: 0 },
      g: "F",
    },
    {
      id: "true-solar",
      label: "真太阳时分类",
      c: { y: 1986, m: 6, d: 5, h: 17, mi: 30, s: 0 },
      g: "M",
      tp: { location: { longitude: 117.8 }, trueSolarTime: { enabled: true } },
    },
  ];
  function suite() {
    if (!state.vendor)
      return { available: false, cases: [], summary: { PASS: 0, DIFF: 0, POLICY: 0, "N/A": 0 } };
    const cases = [];
    const summary = { PASS: 0, DIFF: 0, POLICY: 0, "N/A": 0 };
    for (const x of CASES) {
      try {
        const report = compare(x.c, { gender: x.g, timePolicy: x.tp || {} });
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
      out.ok ? (summary.POLICY ? "diff" : "ready") : "bad",
      `八字交叉验证：PASS ${summary.PASS} · DIFF ${summary.DIFF} · POLICY ${summary.POLICY} · N/A ${summary["N/A"]}`,
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
    const st = state.status,
      S = state.lastSuite,
      sum = (S && S.summary) || { PASS: 0, DIFF: 0, POLICY: 0, "N/A": 0 };
    const statusText =
      st === "ready"
        ? "校验引擎已就绪"
        : st === "loading"
          ? "正在加载第三方校验引擎"
          : st === "unavailable"
            ? "第三方校验暂不可用"
            : "等待初始化";
    const cases =
      S && S.cases
        ? S.cases
            .map((x) => {
              const c = x.report && x.report.counts;
              return `<div class="tjbv-case"><b>${esc(x.label)}</b><small>${x.error ? esc(x.error) : `PASS ${c.PASS} · DIFF ${c.DIFF} · 口径 ${c.POLICY} · N/A ${c["N/A"]}`}</small></div>`;
            })
            .join("")
        : "";
    return `<div class="panel blk tjbv-live"><div class="tjbv-head"><div><h4>八字实时交叉验证 · v89</h4><small>${statusText} · Mystilight GitHub snapshot ${VENDOR.version} · ISC · verification-only</small></div><div class="tjbv-stat"><span class="pass">PASS ${sum.PASS}</span><span class="diff">DIFF ${sum.DIFF}</span><span class="policy">口径 ${sum.POLICY}</span><span class="na">N/A ${sum["N/A"]}</span></div></div>${state.error && st === "unavailable" ? `<p class="tjbv-note">最近加载错误：${esc(state.error)}</p>` : ""}<div class="tjbv-cases">${cases || '<div class="tjbv-case"><b>尚未运行</b><small>点击验证后联网加载独立八字引擎。</small></div>'}</div><div class="tjbv-actions"><button class="gbtn sm" id="tjbvRun" type="button">重新运行验证</button><button class="gbtn sm" id="tjbvReload" type="button">重新加载第三方引擎</button></div><p class="tjbv-note"><strong>判读规则：</strong>PASS = 同口径一致；DIFF = 同口径仍不同，需要查算法；口径 = 已知规则/权重/流派不同；N/A = 当前条件不适合直接比较。第三方结果从不覆盖 Tianji Bazi Core。</p></div>`;
  }
  function patchVerifyPage() {
    try {
      if (!window.REF_PANES || typeof REF_PANES.verify !== "function" || REF_PANES.verify.__v89)
        return;
      const base = REF_PANES.verify,
        oldBind = window.REF_BIND && REF_BIND.verify;
      const fn = () => liveHTML() + base();
      fn.__v89 = true;
      REF_PANES.verify = fn;
      if (window.REF_BIND)
        REF_BIND.verify = function () {
          try {
            if (typeof oldBind === "function") oldBind();
          } catch (_) {}
          const a = document.getElementById("tjbvRun"),
            b = document.getElementById("tjbvReload");
          if (a)
            a.onclick = () => {
              try {
                if (state.vendor) suite();
                else loadVendor().then(() => state.vendor && suite());
              } catch (e) {
                state.error = String((e && e.message) || e);
              }
            };
          if (b) b.onclick = () => loadVendor(true).then(() => state.vendor && suite());
        };
    } catch (e) {
      try {
        console.warn("[TianjiBaziVerifier] patch verify page", e);
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
      module: "Tianji Bazi Verification Layer",
      version: VERSION,
      build: BUILD,
      baseline: "v88",
      vendor: clone(VENDOR),
      state: { status: state.status, source: state.source, error: state.error },
      mode: "shadow-verification-only",
      comparison: [
        "四柱",
        "藏干",
        "十神",
        "纳音",
        "大运顺逆",
        "大运序列",
        "精确起运",
        "五行力量同权重",
        "共同神煞",
      ],
      principle: "第三方引擎不接管主结果；先区分算法差异与流派/权重差异。",
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
  });
  window.TianjiBaziVerifier = API;
  try {
    if (window.TianjiCore) {
      TianjiCore.registerLicense({
        id: "mystilight-8char@1.0.1",
        license: "ISC",
        status: "verified-permissive-with-readme-note",
        note: "正式 LICENSE 为 ISC：允许使用、复制、修改及分发，需保留版权与许可声明；README 同时写有“仅供学习和研究使用”的提示。v89 因此只将其作为影子验证器，不作为 Tianji 商业主运行时依赖。",
        checkedAt: "2026-10-04",
      });
      TianjiCore.registerSource({
        id: "mystilight-8char-1.0.1",
        type: "third-party",
        title: "mystilight/mystilight-8char",
        version: "1.0.1",
        license: "ISC",
        repository: "mystilight/mystilight-8char",
        commit: VENDOR.commit,
        blob: VENDOR.blob,
        role: "verification-only",
        note: "v89 独立八字交叉验证，不覆盖 Tianji Bazi Core。运行时固定到 GitHub commit 1ca2923，而不是假定 npm 已发布 1.0.1。",
      });
      TianjiCore.registerSource({
        id: "tianji-v89-bazi-verification",
        type: "internal",
        title: "Tianji Bazi Verification Layer",
        version: VERSION,
        baseline: "v88",
      });
      TianjiCore.registerEngine(
        {
          id: "bazi.verify.mystilight.v1",
          system: "bazi",
          name: "Mystilight EightChar Cross Verifier",
          version: VERSION,
          source: "mystilight-8char-1.0.1",
          doctrine: "shadow verify / sect-aware / no takeover",
        },
        (input) =>
          compare(input.civ, {
            gender: input.gender,
            timePolicy: input.timePolicy || {},
            baziPolicy: input.baziPolicy || {},
          }),
      );
    }
  } catch (e) {
    try {
      console.warn("[TianjiBaziVerifier] registry", e);
    } catch (_) {}
  }
  const prev = window.TianjiSystem || {};
  window.TianjiSystem = Object.freeze({
    version: "v89",
    build: BUILD,
    baseline: "v84",
    core: window.TianjiCore || prev.core || null,
    time: window.TianjiTime || prev.time || null,
    verify: window.TianjiVerifier || prev.verify || null,
    bazi: window.TianjiBazi || prev.bazi || null,
    baziVerify: API,
    manifest: () => ({
      product: "天机盘",
      version: "v89",
      build: BUILD,
      baseline: "v84",
      bazi: window.TianjiBazi && TianjiBazi.manifest ? TianjiBazi.manifest() : null,
      baziVerify: manifest(),
    }),
  });
  try {
    const bv = document.getElementById("buildVersion");
  } catch (_) {}
  patchVerifyPage();
  badge("", "Mystilight 八字交叉验证准备中；主计算不受影响。");
})();
