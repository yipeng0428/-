(() => {
  "use strict";
  const BUILD = "v215 RC1 · 2026-10-06 15:02 +08:00";
  const SCHEMA = "tianji.release.qa.v1";
  const STATIC = {
    source_baseline: "v237.1-verified-html",
    syntax_errors: 0,
    duplicate_ids: 0,
    escaped_text_leaks: 0,
    notice_quiet: true,
    startup_v201_preserved: true,
    layout_v200_preserved: true,
    formal_report_v214_preserved: true,
  };
  let LAST = null,
    RUNNING = false;
  const clone = (x) => {
    try {
      return structuredClone(x);
    } catch (_) {
      try {
        return JSON.parse(JSON.stringify(x));
      } catch (__) {
        return x;
      }
    }
  };
  const E = (s) =>
    String(s ?? "").replace(
      /[&<>"']/g,
      (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
    );
  const nowISO = () => new Date().toISOString();
  const push = (
    a,
    id,
    name,
    state,
    detail = "",
    group = "runtime",
    severity = "normal",
    meta = {},
  ) => a.push({ id, name, state, detail, group, severity, ...meta });
  const currentR = () => {
    try {
      return typeof R !== "undefined" ? R : null;
    } catch (_) {
      return null;
    }
  };

  const REQUIRED_APIS = [
    ["TianjiCore", ["manifest"]],
    ["TianjiEvidence", ["catalog"]],
    ["TianjiPerformance", ["status", "load", "groups"]],
    ["TianjiLayoutGuard", ["audit"]],
    ["TianjiConsumerReport", ["build", "toText"]],
    ["TianjiQimenCrosscheck", ["status", "report"]],
    ["TianjiLiuyaoDepth", ["build"]],
    ["TianjiZiweiFlyingDepthV2", ["selfTest"]],
    ["TianjiXuankongHouseV2", ["selfTest"]],
    ["TianjiSanhePolicy", ["selfTest"]],
    ["TianjiHistoricalTimeV3", ["selfTest"]],
    ["TianjiRelationTimelineV2", ["selfTest"]],
    ["TianjiFormalEvidenceReport", ["selfTest", "generate"]],
  ];
  const SELFTESTS = [
    ["TianjiQimenPeriod", "奇门日/月/年基础核"],
    ["TianjiQimenVerifier", "奇门时家验证器"],
    ["TianjiLiuyaoDepth", "六爻深度层"],
    ["TianjiZiweiFlyingDepthV2", "紫微飞星 V2"],
    ["TianjiXuankongHouse", "玄空宅盘 V1"],
    ["TianjiXuankongHouseV2", "玄空宅盘 V2"],
    ["TianjiSanheWaterCore", "三合水法 Core"],
    ["TianjiSanhePolicy", "三合水法规则层"],
    ["TianjiHistoricalTime", "历史时间 V1"],
    ["TianjiHistoricalTimeV2", "历史时间 V2"],
    ["TianjiHistoricalTimeV3", "历史时间 V3"],
    ["TianjiRelationTimeline", "关系时间轴 V1"],
    ["TianjiRelationTimelineV2", "关系时间轴 V2"],
    ["TianjiFormalEvidenceReport", "正式 Evidence 报告"],
    ["TianjiQizhengResidualV228", "四余基础"],
    ["TianjiQizhengLiangtianchiV235", "人物校准"],
    ["TianjiQizhengLiangtianchiV236", "量天尺图格"],
    ["TianjiQizhengResidualDriftV237", "长期漂移"],
  ];

  function duplicateIds() {
    const ids = [...document.querySelectorAll("[id]")].map((x) => x.id),
      seen = new Set(),
      dups = [];
    ids.forEach((id) => {
      if (seen.has(id)) dups.push(id);
      else seen.add(id);
    });
    return [...new Set(dups)];
  }
  function escapedBodyLeaks() {
    const out = [];
    [...document.body.childNodes].forEach((n) => {
      if (n.nodeType !== Node.TEXT_NODE) return;
      const raw = n.nodeValue || "";
      if (raw.trim() && /^(?:\s|\\n|\\r|\\t)+$/.test(raw)) out.push(raw.slice(0, 80));
    });
    return out;
  }
  function perfSnapshot() {
    const nav = performance.getEntriesByType?.("navigation")?.[0] || null,
      paint = {};
    (performance.getEntriesByType?.("paint") || []).forEach(
      (x) => (paint[x.name] = +x.startTime.toFixed(1)),
    );
    return {
      nav: nav
        ? {
            type: nav.type,
            domInteractive: +nav.domInteractive.toFixed(1),
            domContentLoaded: +nav.domContentLoadedEventEnd.toFixed(1),
            loadEventEnd: +nav.loadEventEnd.toFixed(1),
            transferSize: nav.transferSize || 0,
            decodedBodySize: nav.decodedBodySize || 0,
          }
        : null,
      paint,
      startup: window.TianjiStartupV201?.state?.() || null,
      lazy: window.TianjiPerformance?.status?.() || null,
      now: +performance.now().toFixed(1),
    };
  }
  function quickChecks(deferred = true) {
    const checks = [];
    push(
      checks,
      "static.syntax",
      "构建期 JavaScript 语法",
      STATIC.syntax_errors === 0 ? "pass" : "fail",
      `错误 ${STATIC.syntax_errors}`,
      "static",
      "critical",
    );
    push(
      checks,
      "static.ids",
      "构建期重复 ID",
      STATIC.duplicate_ids === 0 ? "pass" : "fail",
      `重复 ${STATIC.duplicate_ids}`,
      "static",
      "critical",
    );
    push(
      checks,
      "static.escaped",
      "构建期转义换行泄漏",
      STATIC.escaped_text_leaks === 0 ? "pass" : "fail",
      `泄漏 ${STATIC.escaped_text_leaks}`,
      "static",
      "critical",
    );

    const title = document.title || "",
      bv = document.getElementById("buildVersion")?.textContent || "";
    push(
      checks,
      "runtime.version",
      "版本一致性",
      document.documentElement.dataset.tjBuild === window.TianjiBuild.version &&
        bv.includes(window.TianjiBuild.display)
        ? "pass"
        : "fail",
      `title=${title}；build=${bv}`,
      "runtime",
      "critical",
    );
    const dups = duplicateIds();
    push(
      checks,
      "runtime.ids",
      "运行时重复 ID",
      dups.length ? "fail" : "pass",
      dups.length ? dups.slice(0, 12).join(", ") : "0",
      "runtime",
      "critical",
    );
    const leaks = escapedBodyLeaks();
    push(
      checks,
      "runtime.escaped",
      "body 直属转义文本",
      leaks.length ? "fail" : "pass",
      leaks.length ? leaks.join(" | ") : "0",
      "runtime",
      "critical",
    );

    const vp = document.querySelector('meta[name="viewport"]')?.getAttribute("content") || "";
    push(
      checks,
      "runtime.viewport",
      "移动端 viewport",
      /width=device-width/.test(vp) ? "pass" : "fail",
      vp || "missing",
      "mobile",
      "critical",
    );

    const localCfg = window.TJ_NOTICE_CONFIG || {},
      settings = window.TianjiNotice?.settings?.() || {};
    const noticeOff =
      localCfg.tickerEnabled === false &&
      localCfg.popupEnabled === false &&
      Array.isArray(localCfg.notices) &&
      localCfg.notices.length === 0;
    push(
      checks,
      "runtime.notice-default",
      "升级期通知静默默认值",
      noticeOff ? "pass" : "fail",
      `ticker=${localCfg.tickerEnabled} popup=${localCfg.popupEnabled} notices=${localCfg.notices?.length ?? "?"}`,
      "runtime",
      "critical",
    );
    const ticker = document.getElementById("tjNoticeTicker"),
      tickerVisible = !!ticker && getComputedStyle(ticker).display !== "none";
    push(
      checks,
      "runtime.notice-live",
      "当前跑马灯实际状态",
      !settings.ticker_enabled && !tickerVisible
        ? "pass"
        : settings.ticker_enabled
          ? "warn"
          : "fail",
      `global=${!!settings.ticker_enabled} visible=${tickerVisible}`,
      "runtime",
      "normal",
    );

    REQUIRED_APIS.forEach(([name, methods]) => {
      const obj = window[name],
        missing = !obj ? ["<object>"] : methods.filter((m) => typeof obj[m] !== "function");
      push(
        checks,
        `api.${name}`,
        name,
        missing.length
          ? !obj &&
            deferred &&
            !["TianjiCore", "TianjiPerformance", "TianjiLayoutGuard"].includes(name)
            ? "warn"
            : "fail"
          : "pass",
        missing.length ? `缺少 ${missing.join(", ")}` : methods.join(", "),
        "api",
        "critical",
      );
    });

    const paneKeys = typeof REF_PANES === "object" ? Object.keys(REF_PANES) : [],
      expected = [
        "over",
        "bazi",
        "qimen",
        "liuren",
        "liuyao",
        "yi",
        "ziwei",
        "xk",
        "zeri",
        "hepan",
        "people",
        "verify",
      ],
      missingP = expected.filter((x) => !paneKeys.includes(x));
    push(
      checks,
      "pane.registry",
      "主面板注册",
      missingP.length ? "fail" : "pass",
      missingP.length ? "缺 " + missingP.join(", ") : `${paneKeys.length} panes`,
      "runtime",
      "critical",
    );

    const st = window.TianjiStartupV201?.state?.();
    push(
      checks,
      "startup.v201",
      "V201 启动优化状态",
      st ? "pass" : "fail",
      st
        ? `loaded=${st.windowLoaded} homepage=${st.homepageReady} writes=${st.versionWrites}`
        : "API missing",
      "performance",
      "critical",
    );
    const lazy = window.TianjiPerformance?.status?.();
    push(
      checks,
      "lazy.insight",
      "Insight 懒加载状态",
      lazy ? "pass" : "warn",
      lazy ? JSON.stringify(lazy.lazy || lazy) : "status unavailable",
      "performance",
      "normal",
    );

    const p = perfSnapshot(),
      nav = p.nav;
    if (nav) {
      const dcl = nav.domContentLoaded,
        load = nav.loadEventEnd || p.now;
      push(
        checks,
        "perf.dcl",
        "DOMContentLoaded",
        dcl > 4500 ? "warn" : "pass",
        `${dcl.toFixed(0)} ms`,
        "performance",
        "normal",
      );
      push(
        checks,
        "perf.load",
        "load / 当前加载点",
        load > 8000 ? "warn" : "pass",
        `${load.toFixed(0)} ms`,
        "performance",
        "normal",
      );
    } else
      push(
        checks,
        "perf.nav",
        "Navigation Timing",
        "warn",
        "当前环境没有 navigation entry",
        "performance",
        "normal",
      );
    const fcp = p.paint["first-contentful-paint"];
    if (Number.isFinite(fcp))
      push(
        checks,
        "perf.fcp",
        "First Contentful Paint",
        fcp > 3000 ? "warn" : "pass",
        `${fcp.toFixed(0)} ms`,
        "performance",
        "normal",
      );

    push(
      checks,
      "road.qimen",
      "奇门外部对拍缺口",
      "warn",
      "时家已有基准；日/月/年真实第三方 reference 仍 pending",
      "product",
      "known",
    );
    push(
      checks,
      "road.qizheng",
      "七政四余前置阻塞",
      "warn",
      "星历 / 四余口径 / 许可证方案仍 blocked",
      "product",
      "known",
    );
    return checks;
  }
  function safeSelfTest(name, label) {
    const obj = window[name];
    if (!obj) return { name, label, state: "warn", detail: "API 未加载 / 不存在", raw: null };
    if (typeof obj.selfTest !== "function")
      return { name, label, state: "warn", detail: "没有 selfTest()", raw: null };
    try {
      const r = obj.selfTest(),
        ok = r?.ok === true;
      return {
        name,
        label,
        state: ok ? "pass" : "fail",
        detail: ok
          ? "selfTest PASS"
          : `selfTest FAIL · ${JSON.stringify(r?.checks?.filter?.((x) => !x.ok)?.slice(0, 4) || [])}`,
        raw: clone(r),
      };
    } catch (err) {
      return { name, label, state: "fail", detail: String(err?.message || err), raw: null };
    }
  }
  async function fullRegression() {
    const checks = [];
    try {
      if (window.TianjiPerformance?.load) {
        const t = performance.now();
        await TianjiPerformance.load("insight", true);
        push(
          checks,
          "lazy.insight-load",
          "Insight 懒链完整加载",
          "pass",
          `${(performance.now() - t).toFixed(1)} ms`,
          "regression",
          "critical",
        );
      }
    } catch (err) {
      push(
        checks,
        "lazy.insight-load",
        "Insight 懒链完整加载",
        "fail",
        String(err?.message || err),
        "regression",
        "critical",
      );
    }
    checks.push(...quickChecks(false));
    SELFTESTS.forEach(([name, label]) => {
      const r = safeSelfTest(name, label);
      push(
        checks,
        `selftest.${name}`,
        label,
        r.state,
        r.detail,
        "regression",
        r.state === "fail" ? "critical" : "normal",
        { raw: r.raw },
      );
    });
    const r0 = currentR();
    if (!r0)
      push(
        checks,
        "pane.smoke",
        "所有 pane factory smoke",
        "warn",
        "当前 R 不可用，跳过 pane factory smoke",
        "regression",
        "normal",
      );
    else {
      const failures = [],
        empty = [],
        times = [];
      for (const [id, fn] of Object.entries(REF_PANES || {})) {
        if (typeof fn !== "function") continue;
        const t = performance.now();
        try {
          const h = fn(),
            ms = performance.now() - t;
          times.push({ id, ms: +ms.toFixed(1), size: typeof h === "string" ? h.length : null });
          if (typeof h !== "string") empty.push(`${id}: non-string`);
          else if (!h.trim()) empty.push(`${id}: empty`);
        } catch (err) {
          failures.push(`${id}: ${String(err?.message || err)}`);
        }
      }
      push(
        checks,
        "pane.smoke",
        "所有 pane factory smoke",
        failures.length ? "fail" : empty.length ? "warn" : "pass",
        failures.length
          ? failures.slice(0, 8).join(" | ")
          : empty.length
            ? empty.slice(0, 8).join(" | ")
            : `${times.length} panes rendered in memory`,
        "regression",
        failures.length ? "critical" : "normal",
        { times },
      );
    }
    return checks;
  }
  function visibleOverflowScan(root = document) {
    const offenders = [],
      viewportW = document.documentElement.clientWidth || innerWidth,
      nodes = [...root.querySelectorAll("body *")];
    for (const el of nodes) {
      if (!(el instanceof HTMLElement) || el.hidden) continue;
      const cs = getComputedStyle(el);
      if (cs.display === "none" || cs.visibility === "hidden") continue;
      const rect = el.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) continue;
      let contained = false;
      for (let a = el.parentElement; a && a !== document.body; a = a.parentElement) {
        if (
          getComputedStyle(a).position === "fixed" ||
          /auto|scroll|hidden|clip/.test(getComputedStyle(a).overflowX)
        ) {
          contained = true;
          break;
        }
      }
      const horizontal = el.scrollWidth - el.clientWidth,
        pageRight = rect.right - viewportW;
      const scrollSafe =
        /auto|scroll|hidden|clip/.test(cs.overflowX) ||
        el.classList.contains("tbl-wrap") ||
        el.classList.contains("tj200-overflow-scroll") ||
        /(tabs|layersw|rt212-strip|rc215-tablewrap)/.test(String(el.className));
      if (horizontal > 4 && !scrollSafe)
        offenders.push({
          id: el.id || "",
          tag: el.tagName.toLowerCase(),
          cls: String(el.className || "").slice(0, 80),
          type: "internal",
          overflow: Math.round(horizontal),
        });
      if (pageRight > 4 && cs.position !== "fixed" && !scrollSafe && !contained)
        offenders.push({
          id: el.id || "",
          tag: el.tagName.toLowerCase(),
          cls: String(el.className || "").slice(0, 80),
          type: "viewport-right",
          overflow: Math.round(pageRight),
        });
      if (offenders.length >= 80) break;
    }
    return offenders;
  }
  function mobileCssRisk() {
    const risks = [];
    for (const ss of [...document.styleSheets]) {
      let rules;
      try {
        rules = [...ss.cssRules];
      } catch (_) {
        continue;
      }
      const walk = (rs) =>
        rs.forEach((rule) => {
          if (rule.cssRules) return walk([...rule.cssRules]);
          const txt = rule.cssText || "",
            m = [...txt.matchAll(/min-width\s*:\s*(\d+)px/gi)]
              .map((x) => +x[1])
              .filter((x) => x >= 520);
          if (m.length && !/overflow-x\s*:\s*(auto|scroll)/i.test(txt))
            risks.push({
              selector: rule.selectorText || "@rule",
              minWidth: Math.max(...m),
              sample: txt.slice(0, 180),
            });
        });
      walk(rules);
    }
    return risks.slice(0, 60);
  }
  function layoutAudit() {
    const checks = [];
    let legacy = { offenders: [], guarded: [] };
    try {
      legacy = window.TianjiLayoutGuard?.audit?.() || legacy;
    } catch (err) {
      push(
        checks,
        "layout.v200",
        "V200 LayoutGuard",
        "fail",
        String(err?.message || err),
        "layout",
        "critical",
      );
    }
    const unguarded = visibleOverflowScan(),
      cssRisk = mobileCssRisk(),
      w = innerWidth || document.documentElement.clientWidth || 0;
    push(
      checks,
      "layout.runtime-overflow",
      "当前视口未保护横向溢出",
      unguarded.length ? "fail" : "pass",
      unguarded.length
        ? `${unguarded.length} 个；${unguarded
            .slice(0, 6)
            .map((x) => (x.id || x.tag) + ":" + x.overflow)
            .join(", ")}`
        : "0",
      "layout",
      "critical",
      { offenders: unguarded },
    );
    push(
      checks,
      "layout.guard",
      "V200 全局 overflow audit",
      "info",
      `检测 ${legacy.offenders?.length || 0}，已加固 ${legacy.guarded?.length || 0}`,
      "layout",
      "normal",
      { raw: legacy },
    );
    push(
      checks,
      "mobile.viewport-width",
      "当前 QA 视口宽度",
      w <= 500 ? "pass" : "warn",
      `${w}px${w > 500 ? "；建议在 390–430px 真实视口再运行一次完整 QA" : ""}`,
      "mobile",
      "normal",
    );
    push(
      checks,
      "mobile.css-risk",
      "固定 min-width 风险规则",
      cssRisk.length ? "warn" : "pass",
      cssRisk.length ? `${cssRisk.length} 条启发式风险（表格/图表可能是有意横向滚动）` : "0",
      "mobile",
      "normal",
      { risks: cssRisk },
    );
    const top = document.querySelector(".top");
    if (top) {
      const r = top.getBoundingClientRect();
      push(
        checks,
        "mobile.header",
        "顶部区域视口约束",
        r.right <= w + 4 ? "pass" : "warn",
        `right=${r.right.toFixed(0)} / viewport=${w}`,
        "mobile",
        "normal",
      );
    }
    return checks;
  }
  function summarize(checks) {
    const fail = checks.filter((x) => x.state === "fail"),
      warn = checks.filter((x) => x.state === "warn"),
      critical = fail.filter((x) => x.severity === "critical"),
      known = checks.filter((x) => x.group === "product" && x.state === "warn");
    let gate;
    if (critical.length)
      gate = {
        state: "blocked",
        label: "RC 门禁阻塞",
        tone: "fail",
        reason: `${critical.length} 个关键失败`,
      };
    else if (fail.length)
      gate = {
        state: "blocked",
        label: "RC 门禁阻塞",
        tone: "fail",
        reason: `${fail.length} 个失败`,
      };
    else if (known.length || warn.length)
      gate = {
        state: "conditional",
        label: "RC1 条件通过",
        tone: "warn",
        reason: `运行结构通过；${warn.length} 个警告/已知限制`,
      };
    else
      gate = { state: "pass", label: "RC1 可发布候选", tone: "pass", reason: "当前门禁未发现失败" };
    return {
      total: checks.length,
      pass: checks.filter((x) => x.state === "pass").length,
      warn: warn.length,
      fail: fail.length,
      gate,
    };
  }
  async function run(mode = "quick") {
    if (RUNNING) return LAST;
    RUNNING = true;
    try {
      let checks = mode === "full" ? await fullRegression() : quickChecks();
      if (mode === "layout" || mode === "full") checks = checks.concat(layoutAudit());
      const summary = summarize(checks);
      LAST = {
        schema: SCHEMA,
        build: BUILD,
        mode,
        generatedAt: nowISO(),
        viewport: { width: innerWidth, height: innerHeight, dpr: devicePixelRatio || 1 },
        performance: perfSnapshot(),
        checks,
        summary,
        knownLimitations: [
          "奇门日家/月家/年家尚缺真实独立第三方 reference；不得把验证台框架当成已对拍。",
          "七政四余核心化继续 blocked；当前 workbench 结果不提升验证等级。",
          "移动端最终判断应至少在一个 390–430px 真实视口重新运行布局审计。",
          "本 QA 不自动点击所有交互按钮，不替代人工关键路径验收。",
        ],
        staticBaseline: clone(STATIC),
      };
      return LAST;
    } finally {
      RUNNING = false;
    }
  }
  function gateHTML(RP) {
    if (!RP)
      return '<div class="rc215-gate warn"><strong>尚未运行 QA</strong><small>静态构建检查已通过；浏览器运行时门禁需要手动运行。</small></div>';
    const g = RP.summary.gate;
    return `<div class="rc215-gate ${g.tone}"><strong>${E(g.label)}</strong><small>${E(g.reason)}。PASS ${RP.summary.pass} / WARN ${RP.summary.warn} / FAIL ${RP.summary.fail}</small></div>`;
  }
  function checksHTML(RP) {
    if (!RP) return '<div class="rc215-note">点击“快速门禁”或“完整回归”后显示运行时结果。</div>';
    return `<div class="rc215-tablewrap"><table class="rc215-table"><thead><tr><th>组</th><th>检查项</th><th>状态</th><th>详情</th></tr></thead><tbody>${RP.checks.map((x) => `<tr><td>${E(x.group)}</td><td><b>${E(x.name)}</b><br><span class="rc215-code">${E(x.id)}</span></td><td><span class="rc215-state ${x.state}">${E(x.state.toUpperCase())}</span></td><td>${E(x.detail || "")}</td></tr>`).join("")}</tbody></table></div>`;
  }
  function reportText(RP = LAST) {
    if (!RP) return "V237.1 QA 尚未运行。";
    const L = [
      "天机盘 V237.1 · 发布候选 QA 报告",
      `Build：${RP.build}`,
      `Mode：${RP.mode}`,
      `Generated：${RP.generatedAt}`,
      `Viewport：${RP.viewport.width}×${RP.viewport.height} @${RP.viewport.dpr}`,
      `Gate：${RP.summary.gate.label} · ${RP.summary.gate.reason}`,
      `PASS/WARN/FAIL：${RP.summary.pass}/${RP.summary.warn}/${RP.summary.fail}`,
      "",
    ];
    RP.checks.forEach((x) =>
      L.push(`[${x.state.toUpperCase()}] ${x.group} · ${x.name} · ${x.detail || ""}`),
    );
    L.push("", "已知限制：");
    RP.knownLimitations.forEach((x) => L.push(" - " + x));
    return L.join("\n");
  }
  function refresh() {
    const out = document.getElementById("rc215Out"),
      gate = document.getElementById("rc215Gate"),
      st = document.getElementById("rc215Status");
    if (gate) gate.innerHTML = gateHTML(LAST);
    if (out) out.innerHTML = checksHTML(LAST);
    if (st)
      st.textContent = LAST
        ? `最近运行：${LAST.mode} · ${LAST.generatedAt} · ${LAST.summary.gate.label}`
        : "静态构建基线已通过；运行时 QA 尚未执行。";
    ["rc215JSON", "rc215TXT"].forEach((id) => {
      const b = document.getElementById(id);
      if (b) b.disabled = !LAST;
    });
  }
  function shell() {
    return `<section class="rc215" id="rc215QA">
    <section class="rc215-hero"><div class="rc215-head"><div><h3>V237.1 · 全站回归 / 性能 / 移动端发布门禁</h3><p>这一层只做质量控制，不修改任何术数结果。默认不在首屏运行重测试；完整回归、pane factory smoke 和全 DOM 溢出扫描都必须手动触发。发布门禁把“运行故障”和“已知研究缺口”分开，避免把奇门外部 reference 与七政阻塞误报成网页崩坏。</p></div><span class="rc215-schema">${SCHEMA}</span></div>
      <div class="rc215-tools"><button class="primary" type="button" id="rc215Quick">运行快速门禁</button><button type="button" id="rc215Full">运行完整回归</button><button type="button" id="rc215Layout">布局 / 移动端审计</button><button type="button" id="rc215JSON" disabled>下载 QA JSON</button><button type="button" id="rc215TXT" disabled>下载 QA TXT</button></div>
      <div class="rc215-status" id="rc215Status">静态构建基线已通过；运行时 QA 尚未执行。</div>
    </section>
    <div class="rc215-kpis"><div class="rc215-kpi good"><small>构建期语法</small><b>PASS</b></div><div class="rc215-kpi good"><small>重复 ID</small><b>0</b></div><div class="rc215-kpi good"><small>转义泄漏</small><b>0</b></div><div class="rc215-kpi good"><small>通知静默</small><b>保留</b></div><div class="rc215-kpi cyan"><small>启动策略</small><b>V201</b></div><div class="rc215-kpi gold"><small>候选通道</small><b>RC1</b></div></div>
    <div class="rc215-grid"><section class="rc215-card"><h4>发布门禁</h4><div id="rc215Gate">${gateHTML(LAST)}</div><div class="rc215-note" style="margin-top:6px">性能阈值属于警告而不是硬阻塞，因为本地文件、Surge、不同设备与网络条件会显著影响时序。结构性异常、JS selfTest 失败、缺关键 API、未保护横向溢出会阻塞 RC。</div></section><aside class="rc215-card"><h4>发布前人工关键路径</h4><div class="rc215-list"><div class="rc215-item info"><b>桌面端</b><small>首页 → 建档 → 推演 → 八字 / 奇门 / 紫微 / 关系 → 正式 Evidence 报告。</small></div><div class="rc215-item info"><b>移动端</b><small>390–430px 真实视口重新运行“布局 / 移动端审计”，检查顶栏、横向标签、表格和弹窗。</small></div><div class="rc215-item warn"><b>缓存发布</b><small>等你决定正式推送时，再统一生成 Surge / Cloudflare 缓存覆盖与部署配置；V215 暂不动部署层。</small></div></div></aside></div>
    <section class="rc215-card"><h4>QA 明细</h4><div id="rc215Out">${checksHTML(LAST)}</div></section>
  </section>`;
  }
  function saveBlob(name, text, type) {
    const blob = new Blob([text], { type }),
      url = URL.createObjectURL(blob),
      a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1600);
  }
  function bind() {
    const go = async (mode, btnId) => {
      const b = document.getElementById(btnId),
        old = b?.textContent;
      if (b) {
        b.disabled = true;
        b.textContent = "运行中…";
      }
      try {
        await run(mode);
        refresh();
      } catch (err) {
        console.warn("[V215 QA]", err);
        LAST = {
          schema: SCHEMA,
          build: BUILD,
          mode,
          generatedAt: nowISO(),
          checks: [
            {
              id: "qa.exception",
              name: "QA runner",
              state: "fail",
              detail: String(err?.message || err),
              group: "qa",
              severity: "critical",
            },
          ],
          summary: {
            pass: 0,
            warn: 0,
            fail: 1,
            gate: {
              state: "blocked",
              label: "RC 门禁阻塞",
              tone: "fail",
              reason: "QA runner exception",
            },
          },
          knownLimitations: [],
          staticBaseline: clone(STATIC),
          viewport: { width: innerWidth, height: innerHeight, dpr: devicePixelRatio || 1 },
          performance: perfSnapshot(),
        };
        refresh();
      } finally {
        if (b) {
          b.disabled = false;
          b.textContent = old;
        }
      }
    };
    document
      .getElementById("rc215Quick")
      ?.addEventListener("click", () => go("quick", "rc215Quick"));
    document.getElementById("rc215Full")?.addEventListener("click", () => go("full", "rc215Full"));
    document
      .getElementById("rc215Layout")
      ?.addEventListener("click", () => go("layout", "rc215Layout"));
    document.getElementById("rc215JSON")?.addEventListener("click", () => {
      if (LAST)
        saveBlob(
          `天机盘_V237.1_QA_${Date.now()}.json`,
          JSON.stringify(LAST, null, 2),
          "application/json;charset=utf-8",
        );
    });
    document.getElementById("rc215TXT")?.addEventListener("click", () => {
      if (LAST)
        saveBlob(
          `天机盘_V237.1_QA_${Date.now()}.txt`,
          reportText(LAST),
          "text/plain;charset=utf-8",
        );
    });
  }
  try {
    const old = REF_PANES.verify,
      oldBind = REF_BIND.verify;
    if (old && !old.__v215) {
      const fn = () => shell() + old();
      fn.__v215 = true;
      REF_PANES.verify = fn;
    }
    REF_BIND.verify = () => {
      try {
        oldBind && oldBind();
      } catch (err) {
        console.warn("[V215 old verify bind]", err);
      }
      try {
        bind();
      } catch (err) {
        console.warn("[V215 bind]", err);
      }
    };
  } catch (err) {
    console.warn("[V215 verify patch]", err);
  }

  function selfTest() {
    const C = [],
      add = (id, ok, d = "") => C.push({ id, ok: !!ok, d });
    add("static.syntax", STATIC.syntax_errors === 0, String(STATIC.syntax_errors));
    add("static.ids", STATIC.duplicate_ids === 0, String(STATIC.duplicate_ids));
    add("static.escaped", STATIC.escaped_text_leaks === 0, String(STATIC.escaped_text_leaks));
    add("on-demand", LAST === null && !RUNNING, "no runtime QA at startup");
    add(
      "release-scope",
      typeof run === "function" &&
        typeof layoutAudit === "function" &&
        typeof fullRegression === "function",
      "",
    );
    return { ok: C.every((x) => x.ok), checks: C };
  }
  const TEST = selfTest();

  window.TianjiReleaseQA = Object.freeze({
    version: "1.0.0",
    build: BUILD,
    schema: SCHEMA,
    channel: "RC1",
    quick: () => run("quick"),
    full: () => run("full"),
    layout: () => run("layout"),
    last: () => (LAST ? clone(LAST) : null),
    gate: () =>
      LAST ? clone(LAST.summary?.gate) : { state: "not-run", label: "运行时门禁尚未执行" },
    reportText: () => reportText(LAST),
    selfTest: () => clone(TEST),
    manifest: () => ({
      module: "Tianji Release Candidate QA RC1",
      automaticStartupTests: false,
      buildStaticBaseline: clone(STATIC),
      checks: [
        "关键 API",
        "运行时重复 ID",
        "通知静默",
        "启动/懒加载状态",
        "selfTest 汇总",
        "pane factory smoke",
        "布局横向溢出",
        "移动端 CSS 风险",
        "Navigation/Paint 性能快照",
      ],
      hardBlock: ["JS/runtime failure", "关键 API 缺失", "selfTest FAIL", "未保护横向溢出"],
      warnings: ["网络/设备相关性能", "桌面宽度下的移动端未实测", "研究型外部 reference pending"],
      knownProductLimits: ["奇门日/月/年外部 reference", "七政四余星历/许可证前置"],
    }),
  });
  window.TianjiSystemV215 = {
    version: "v215",
    build: BUILD,
    releaseCandidate: "RC1",
    releaseQA: true,
    defaultRuntimeTests: false,
    noticeQuietDefault: true,
    baseline: "v214",
  };

  try {
    const road = window.TianjiRoadmap || {},
      board = window.TianjiPriorityBoard?.snapshot?.();
    window.TianjiRoadmap = Object.freeze(
      Object.assign({}, road, {
        releaseCandidate: {
          build: BUILD,
          channel: "RC1",
          runtimeGate: "manual",
          staticGate: "pass",
          knownBlockers: ["奇门日/月/年外部 reference", "七政四余前置"],
        },
        urgentImportant: board || road.urgentImportant,
        nextMainline: [
          "在真实浏览器运行 V215 完整 QA 门禁",
          "根据 QA 结果做 RC2 修复/冻结",
          "奇门真实第三方 reference 到位后继续 Evidence",
          "七政四余前置条件到位后继续核心化",
        ],
      }),
    );
  } catch (_) {}
  function sync() {
    const b = document.getElementById("buildVersion");
  } /* V226: historical delayed version writer disabled */
})();
