(() => {
  "use strict";
  const VERSION = "1.0.0",
    BUILD = "2026-10-04 03:36:03",
    VENDOR_VERSION = "1.7.7";
  const VENDOR = {
    sha256: "9750324bfe1aa63c146f8c72b1143df924466c11c8a5277d7d9225c541a18aaa",
    id: "lunar-javascript",
    version: VENDOR_VERSION,
    license: "MIT",
    gitBlob: "355b7bcd6fcc773b79e8bd179f0df3c5fb73a4f1",
    packageIntegrity:
      "sha512-u/KYiwPIBo/0bT+WWfU7qO1d+aqeB90Tuy4ErXenr2Gam0QcWeezUvtiOIyXR7HbVnW2I1DKfU0NBvzMZhbVQw==",
    cacheKey: "tianji.vendor.lunar-javascript@1.7.7",
    urls: [
      "https://cdn.jsdelivr.net/npm/lunar-javascript@1.7.7/lunar.js",
      "https://unpkg.com/lunar-javascript@1.7.7/lunar.js",
    ],
  };
  const state = { status: "idle", source: "", error: "", lastReport: null, loadedAt: null };
  const clone = (o) => {
    try {
      return JSON.parse(JSON.stringify(o));
    } catch (_) {
      return o;
    }
  };
  const hasVendor = () => !!(window.Solar && typeof window.Solar.fromYmdHms === "function");
  function evalVendor(code) {
    if (!code || typeof code !== "string") return false;
    try {
      (0, eval)(code + "\n//# sourceURL=lunar-javascript-1.7.7.tianji.js");
      return hasVendor();
    } catch (e) {
      state.error = String((e && e.message) || e);
      return false;
    }
  }
  function badge(status, msg) {
    let b = document.getElementById("tjVerifyBadge");
    const anchor =
      document.getElementById("tjTimeBadge") ||
      document.getElementById("tjCoreBadge") ||
      document.getElementById("buildVersion");
    if (!b && anchor) {
      b = document.createElement("span");
      b.id = "tjVerifyBadge";
      anchor.insertAdjacentElement("afterend", b);
    }
    if (!b) return;
    b.className = status === "ready" ? "ready" : status === "diff" ? "diff" : "offline";
    b.textContent =
      status === "ready"
        ? "Verify 1.7.7 ✓"
        : status === "diff"
          ? "Verify 1.7.7 △"
          : "Verify 1.7.7 ·";
    b.title = msg || "";
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
  async function loadVendorOnce() {
    if (hasVendor()) {
      state.status = "ready";
      state.source = "preloaded";
      state.loadedAt = Date.now();
      badge("ready", "lunar-javascript 1.7.7 已存在于页面环境");
      return state;
    }
    state.status = "loading";
    async function fetchVendorText(url, ms = 2200) {
      const ac = typeof AbortController !== "undefined" ? new AbortController() : null;
      const tm = ac ? setTimeout(() => ac.abort(), ms) : 0;
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
    for (const url of VENDOR.urls) {
      try {
        const code = await fetchVendorText(url);
        if (!(await TianjiVendorIntegrity.verify(code, VENDOR.sha256)))
          throw new Error("第三方脚本完整性校验失败");
        if (!evalVendor(code)) throw new Error("第三方脚本载入后未发现 Solar API");
        state.status = "ready";
        state.source = url;
        state.loadedAt = Date.now();
        state.error = "";
        badge("ready", "lunar-javascript 1.7.7 已按需加载；仅作交叉校验");
        return state;
      } catch (e) {
        state.error = String((e && e.message) || e);
      }
    }
    state.status = "unavailable";
    badge("offline", "校验引擎当前不可用；天机主引擎不受影响。联网后可在校验页重新加载。");
    return state;
  }
  function partsSolar(x) {
    return {
      y: x.getYear(),
      m: x.getMonth(),
      d: x.getDay(),
      h: x.getHour(),
      mi: x.getMinute(),
      s: x.getSecond(),
    };
  }
  function lunarParts(l) {
    const m = l.getMonth();
    return { year: l.getYear(), month: Math.abs(m), day: l.getDay(), isLeap: m < 0 };
  }
  function eq(a, b) {
    return JSON.stringify(a) === JSON.stringify(b);
  }
  function item(id, label, a, b, comparable = true, note = "") {
    return {
      id,
      label,
      primary: a,
      verifier: b,
      comparable,
      status: !comparable ? "N/A" : eq(a, b) ? "PASS" : "DIFF",
      note,
    };
  }
  function ganzhiPrimary(civ, policy) {
    try {
      if (typeof calcTime !== "function" || typeof calcBazi !== "function") return null;
      const p = window.TianjiTime ? TianjiTime.normalizePolicy(policy || {}) : null;
      if (p && p.timezone && p.timezone.offsetMinutes !== 480) return null;
      const t = calcTime(civ, {
        solar: !!(p && p.trueSolarTime && p.trueSolarTime.enabled),
        lon: p && p.location ? p.location.longitude : 120,
      });
      const b = calcBazi(t, "M");
      return (b.pill || []).map((x) => GAN[x.s] + ZHI[x.b]);
    } catch (_) {
      return null;
    }
  }
  function termJDFromSolar(sol) {
    try {
      return (
        jdFromGreg(
          sol.getYear(),
          sol.getMonth(),
          sol.getDay(),
          sol.getHour(),
          sol.getMinute(),
          sol.getSecond(),
        ) -
        8 / 24
      );
    } catch (_) {
      return null;
    }
  }
  function compare(civ, policy = {}) {
    if (!hasVendor())
      return { ok: false, available: false, reason: "lunar-javascript verifier unavailable" };
    if (!window.TianjiTime) return { ok: false, available: true, reason: "TianjiTime unavailable" };
    const ctx = TianjiTime.createContext(civ, policy),
      p = ctx.policy,
      rows = [];
    const cv = ctx.clock.civil,
      cc = ctx.clock.calculation,
      ed = ctx.boundaries.day.effectiveDate;
    const civilL = Solar.fromYmdHms(cv.y, cv.m, cv.d, cv.h, cv.mi, cv.s || 0).getLunar();
    const effL = Solar.fromYmdHms(ed.y, ed.m, ed.d, 12, 0, 0).getLunar();
    rows.push(
      item(
        "lunar.civil",
        "民用日期→农历",
        ctx.lunar.civil,
        lunarParts(civilL),
        !!ctx.lunar.civil,
        "仅比较年/月/日/闰月",
      ),
    );
    rows.push(
      item(
        "lunar.effective",
        "术数日界→农历",
        ctx.lunar.effectiveDay,
        lunarParts(effL),
        !!ctx.lunar.effectiveDay,
        "按天机日界规则先得到有效日期，再转换农历",
      ),
    );
    const libCalc = Solar.fromYmdHms(cc.y, cc.m, cc.d, cc.h, cc.mi, cc.s || 0).getLunar();
    const libP = [
      libCalc.getYearInGanZhiExact(),
      libCalc.getMonthInGanZhiExact(),
      p.dayBoundary.mode === "midnight"
        ? libCalc.getDayInGanZhiExact2()
        : libCalc.getDayInGanZhiExact(),
      libCalc.getTimeInGanZhi(),
    ];
    const priP = ganzhiPrimary(civ, policy);
    const timeComparable = !(p.dayBoundary.mode === "midnight" && cc.h === 23);
    if (priP) {
      rows.push(
        item("pillars.year", "年柱", priP[0], libP[0], true, "双方均采用立春/精确时刻口径"),
      );
      rows.push(item("pillars.month", "月柱", priP[1], libP[1], true, "双方均按节切月"));
      rows.push(
        item(
          "pillars.day",
          "日柱",
          priP[2],
          libP[2],
          true,
          p.dayBoundary.mode === "midnight" ? "午夜换日" : "23:00 子初换日",
        ),
      );
      rows.push(
        item(
          "pillars.hour",
          "时柱",
          priP[3],
          libP[3],
          timeComparable,
          timeComparable
            ? ""
            : "lunar-javascript 时干默认随 23:00 日干切换；午夜换日且处于23时段时口径不同",
        ),
      );
    } else
      rows.push(
        item(
          "pillars",
          "四柱",
          null,
          libP,
          false,
          "当前非 UTC+8 主链，v84 Legacy 八字不做跨时区强行比较",
        ),
      );
    try {
      if (p.timezone.offsetMinutes === 480) {
        const prev = libCalc.getPrevJieQi(false),
          next = libCalc.getNextJieQi(false),
          ps = prev && prev.getSolar(),
          ns = next && next.getSolar();
        const pjd = ps ? termJDFromSolar(ps) : null,
          njd = ns ? termJDFromSolar(ns) : null;
        rows.push(
          item(
            "term.name",
            "当前节气",
            ctx.solarTerm.name,
            prev ? prev.getName() : null,
            !!prev,
            "lunar-javascript 的上一精确节气视作当前所处节气",
          ),
        );
        rows.push({
          id: "term.start",
          label: "当前节气交节点",
          primary: ctx.solarTerm.startJD,
          verifier: pjd,
          comparable: pjd != null,
          status:
            pjd == null
              ? "N/A"
              : Math.abs(ctx.solarTerm.startJD - pjd) * 1440 <= 2
                ? "PASS"
                : "DIFF",
          deltaMinutes: pjd == null ? null : +((ctx.solarTerm.startJD - pjd) * 1440).toFixed(3),
          note: "≤2 分钟视为一致",
        });
        rows.push({
          id: "term.next",
          label: "下一节气交节点",
          primary: ctx.solarTerm.next.jd,
          verifier: njd,
          comparable: njd != null,
          status:
            njd == null
              ? "N/A"
              : Math.abs(ctx.solarTerm.next.jd - njd) * 1440 <= 2
                ? "PASS"
                : "DIFF",
          deltaMinutes: njd == null ? null : +((ctx.solarTerm.next.jd - njd) * 1440).toFixed(3),
          note: "≤2 分钟视为一致",
        });
      } else
        rows.push(
          item(
            "term",
            "节气交节点",
            ctx.solarTerm.name,
            null,
            false,
            "lunar-javascript 节气时刻按中国标准时输出；跨时区阶段暂不强比",
          ),
        );
    } catch (e) {
      rows.push(
        item(
          "term",
          "节气交节点",
          ctx.solarTerm.name,
          null,
          false,
          "校验异常: " + String((e && e.message) || e),
        ),
      );
    }
    const counts = { PASS: 0, DIFF: 0, "N/A": 0 };
    rows.forEach((x) => (counts[x.status] = (counts[x.status] || 0) + 1));
    const report = {
      ok: counts.DIFF === 0,
      available: true,
      at: new Date().toISOString(),
      input: clone(civ),
      policy: clone(p),
      vendor: {
        id: VENDOR.id,
        version: VENDOR.version,
        license: VENDOR.license,
        source: state.source,
      },
      counts,
      rows,
    };
    state.lastReport = report;
    badge(
      report.ok ? "ready" : "diff",
      `双引擎校验：PASS ${counts.PASS} · DIFF ${counts.DIFF} · N/A ${counts["N/A"]}。差异不自动等于错误，需结合口径判断。`,
    );
    return report;
  }
  function suite() {
    if (!hasVendor())
      return { available: false, cases: [], summary: { PASS: 0, DIFF: 0, "N/A": 0 } };
    const cases = [
      { id: "doc-19860529", c: { y: 1986, m: 5, d: 29, h: 0, mi: 0, s: 0 } },
      { id: "user-era-19860605", c: { y: 1986, m: 6, d: 5, h: 17, mi: 30, s: 0 } },
      { id: "lichun-2026", c: { y: 2026, m: 2, d: 4, h: 4, mi: 0, s: 0 } },
      { id: "zi-2259", c: { y: 2026, m: 10, d: 4, h: 22, mi: 59, s: 0 } },
      { id: "zi-2300", c: { y: 2026, m: 10, d: 4, h: 23, mi: 0, s: 0 } },
      { id: "edge-2033", c: { y: 2033, m: 12, d: 22, h: 12, mi: 0, s: 0 } },
    ];
    const rs = cases.map((x) => ({ id: x.id, report: compare(x.c, {}) })),
      summary = { PASS: 0, DIFF: 0, "N/A": 0 };
    rs.forEach((x) =>
      x.report.rows.forEach((r) => (summary[r.status] = (summary[r.status] || 0) + 1)),
    );
    return { available: true, cases: rs, summary };
  }
  function manifest() {
    return {
      module: "Tianji Verification Layer",
      version: VERSION,
      build: BUILD,
      baseline: "v86",
      vendor: clone(VENDOR),
      state: { status: state.status, source: state.source, error: state.error },
      mode: "shadow-verify-only",
      principle: "第三方引擎只校验，不接管主结果；DIFF 需先判断口径差异。",
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
    hasVendor,
  });
  window.TianjiVerifier = API;
  try {
    if (window.TianjiCore) {
      TianjiCore.registerSource({
        id: "lunar-javascript-1.7.7",
        type: "third-party",
        title: "6tail/lunar-javascript",
        version: "1.7.7",
        license: "MIT",
        repository: "6tail/lunar-javascript",
        role: "verification-only",
        note: "v87 仅作为独立校验引擎，不替换天机主计算链。",
      });
      TianjiCore.registerSource({
        id: "tianji-v87-verification",
        type: "internal",
        title: "Tianji Verification Layer",
        version: VERSION,
        baseline: "v86",
      });
      TianjiCore.registerEngine(
        {
          id: "calendar.verify.lunar-js.v1",
          system: "calendar",
          name: "lunar-javascript Cross Verifier",
          version: VERSION,
          source: "lunar-javascript-1.7.7",
          doctrine: "shadow verify / no takeover",
        },
        (input) => compare(input.civ, input.policy || {}),
      );
    }
  } catch (e) {
    try {
      console.warn("[TianjiVerifier] registry", e);
    } catch (_) {}
  }
  const prev = window.TianjiSystem || {};
  window.TianjiSystem = Object.freeze({
    version: "v87",
    build: BUILD,
    baseline: "v84",
    core: window.TianjiCore || prev.core || null,
    time: window.TianjiTime || prev.time || null,
    verify: API,
    manifest: () => ({
      product: "天机盘",
      version: "v87",
      build: BUILD,
      baseline: "v84",
      time: TianjiTime && TianjiTime.manifest ? TianjiTime.manifest() : null,
      verify: manifest(),
    }),
  });
  try {
    const bv = document.getElementById("buildVersion");
  } catch (_) {}
  badge("offline", "校验引擎按需加载；主计算独立运行");
})();
