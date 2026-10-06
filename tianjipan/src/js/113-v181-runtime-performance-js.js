(() => {
  "use strict";
  const BUILD = "v181 · 2026-10-05 22:18 +08:00";
  const P =
    window.__TJ_PERF_BOOT ||
    (window.__TJ_PERF_BOOT = { started: performance.now(), homepageReady: false, lazy: {} });
  const GROUPS = {
    insight: [
      "v168-evidence-js",
      "v169-consensus-js",
      "v170-explain-js",
      "v171-ai-explain-js",
      "v172-api-gateway-js",
      "v173-evidence-kg-js",
    ],
  };
  const ST = { insight: "deferred" };
  const promises = {};
  let resizeTimer = 0,
    lastMode = "";

  function applyLayout() {
    const mode =
      (innerWidth || document.documentElement.clientWidth || 1440) >= 1080 ? "wide" : "compact";
    if (mode !== lastMode || document.documentElement.getAttribute("data-tj-layout") !== mode) {
      lastMode = mode;
      document.documentElement.setAttribute("data-tj-layout", mode);
      window.dispatchEvent(
        new CustomEvent("tianji:layoutchange", { detail: { mode, width: innerWidth } }),
      );
    }
  }
  window.addEventListener(
    "resize",
    () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(applyLayout, 80);
    },
    { passive: true },
  );
  window.addEventListener("orientationchange", () => setTimeout(applyLayout, 120), {
    passive: true,
  });
  applyLayout();

  function idle(cb, timeout = 1500) {
    if (typeof requestIdleCallback === "function") return requestIdleCallback(cb, { timeout });
    return setTimeout(() => cb({ didTimeout: true, timeRemaining: () => 0 }), 28);
  }
  function executeStored(id) {
    const src = document.getElementById(id);
    if (!src || src.dataset.tjLoaded === "1") return true;
    const run = document.createElement("script");
    run.setAttribute("data-tj-lazy-exec", id);
    run.textContent = src.textContent || "";
    src.dataset.tjLoaded = "1";
    document.body.appendChild(run);
    run.remove();
    return true;
  }
  function loadGroup(name, opt = {}) {
    if (ST[name] === "ready") return Promise.resolve(true);
    if (promises[name]) return promises[name];
    const ids = GROUPS[name] || [];
    ST[name] = "loading";
    P.lazy[name] = "loading";
    promises[name] = new Promise((resolve, reject) => {
      let i = 0;
      const next = () => {
        if (i >= ids.length) {
          ST[name] = "ready";
          P.lazy[name] = "ready";
          window.dispatchEvent(
            new CustomEvent("tianji:lazy-ready", { detail: { group: name, build: BUILD } }),
          );
          resolve(true);
          return;
        }
        const id = ids[i++];
        const run = () => {
          try {
            executeStored(id);
            setTimeout(next, 0);
          } catch (e) {
            ST[name] = "error";
            P.lazy[name] = "error";
            reject(e);
          }
        };
        opt.immediate ? run() : idle(run, 1800);
      };
      next();
    });
    return promises[name];
  }
  function refreshCurrent() {
    try {
      const pane = document.querySelector(".pane.on");
      const id = pane?.id?.replace(/^pane-/, "");
      if (id && typeof refRender === "function" && window.REF_PANES?.[id]) refRender(id);
    } catch (_) {}
  }

  /* Enhance only when user visits the pages that need this chain. */
  try {
    const prev = selectTab;
    if (typeof prev === "function" && !prev.__v181) {
      const wrapped = function (id, scroll) {
        const ret = prev(id, scroll);
        if (id === "over" || id === "verify") {
          loadGroup("insight", { immediate: true })
            .then(() => setTimeout(refreshCurrent, 0))
            .catch(() => {});
        }
        if (
          [
            "over",
            "guide",
            "bazi",
            "ziwei",
            "qimen",
            "liuren",
            "liuyao",
            "yi",
            "zeri",
            "hepan",
            "verify",
          ].includes(id)
        ) {
          setTimeout(() => {
            try {
              typeof initAI === "function" && initAI();
            } catch (_) {}
          }, 0);
        }
        return ret;
      };
      wrapped.__v181 = true;
      selectTab = wrapped;
    }
  } catch (e) {
    console.warn("[v181 tab hook]", e);
  }

  /* Only after the homepage paints twice may background prewarming begin. */
  requestAnimationFrame(() =>
    requestAnimationFrame(() => {
      P.homepageReady = true;
      document.documentElement.setAttribute("data-tj-perf", "ready");
      const save = !!(navigator.connection && navigator.connection.saveData);
      const low = (navigator.hardwareConcurrency || 4) <= 2;
      if (!save && !low) {
        setTimeout(
          () => idle(() => loadGroup("insight", { immediate: false }).catch(() => {}), 3500),
          12000,
        );
      }
    }),
  );

  function status() {
    return {
      schema: "tianji.performance.v2",
      build: BUILD,
      mode: document.documentElement.getAttribute("data-tj-layout"),
      sinceBootMs: +(performance.now() - P.started).toFixed(1),
      homepageReady: !!P.homepageReady,
      lazy: { ...ST },
      optimizations: [
        "critical wide/compact CSS before all legacy CSS",
        "single initial main compute",
        "aggregate compute throttled to minute/settings cadence",
        "AI initialization deferred off homepage",
        "Evidence/Consensus/Explain/AI/API/KnowledgeGraph deferred",
        "inactive panes excluded from first layout",
      ],
    };
  }

  window.TianjiLayout = Object.freeze({
    version: "2.0.0",
    build: BUILD,
    breakpoint: 1080,
    mode: () => document.documentElement.getAttribute("data-tj-layout"),
    apply: applyLayout,
  });
  window.TianjiPerformance = Object.freeze({
    version: "2.0.0",
    build: BUILD,
    status,
    load: (name = "insight", immediate = true) => loadGroup(name, { immediate }),
    groups: () => Object.keys(GROUPS),
  });

  try {
    const bv = document.getElementById("buildVersion");

    window.TianjiSystemV181 = {
      version: "v181",
      build: BUILD,
      headIntegrityRebuilt: true,
      firstPaintWide: true,
      startupPerformance: true,
      compactFoundation: true,
    };
  } catch (_) {}
})();
