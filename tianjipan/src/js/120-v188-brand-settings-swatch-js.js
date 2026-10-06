(() => {
  "use strict";
  const BUILD = "v188 · 2026-10-05 23:48 +08:00";

  /* 设置弹窗滚动：若浏览器/布局对 grid+modal 滚动不稳定，则手动接管 wheel。 */
  function wireSettingsScroll() {
    const modal = document.getElementById("tjsModal");
    const main = modal?.querySelector(".tjs-main");
    if (!modal || !main) return;
    if (main.dataset.v188Wheel === "1") return;
    main.dataset.v188Wheel = "1";
    main.setAttribute("tabindex", "0");
    const wheel = (e) => {
      const box = e.target.closest?.(".tjs-main");
      if (!box) return;
      const max = box.scrollHeight - box.clientHeight;
      if (max <= 0) return;
      e.preventDefault();
      e.stopPropagation();
      box.scrollTop += e.deltaY;
    };
    main.addEventListener("wheel", wheel, { passive: false });
    main.addEventListener("touchmove", (e) => e.stopPropagation(), { passive: true });
  }
  function repaintThemeSwatches() {
    document.querySelectorAll(".tjs-theme").forEach((card) => {
      const t = card.getAttribute("data-theme");
      const sw = card.querySelector(".tjs-swatch");
      if (!sw) return;
      sw.setAttribute("aria-label", "主题色板 " + (t || ""));
    });
  }
  function refreshBrandPlates() {
    document.querySelectorAll(".seal,.tn-brand i").forEach((el) => {
      el.setAttribute("aria-hidden", "true");
      if (el.classList.contains("seal")) el.title = "天机盘";
    });
  }
  function hydrate() {
    wireSettingsScroll();
    repaintThemeSwatches();
    refreshBrandPlates();
  }
  hydrate();
  [120, 500, 1400, 3200].forEach((ms) => setTimeout(hydrate, ms));
  document.addEventListener(
    "click",
    (e) => {
      if (e.target.closest?.("#tnSettings,#lbBellSet,#themeBtn,[data-tjs-tab],[data-tjs-theme]")) {
        setTimeout(hydrate, 0);
        setTimeout(hydrate, 120);
      }
    },
    true,
  );
  window.addEventListener("tianji:themechange", repaintThemeSwatches);
  window.addEventListener("tianji:settingschange", () => setTimeout(hydrate, 0));
  window.TianjiVisualFixV188 = Object.freeze({
    version: "1.0.0",
    build: BUILD,
    status: () => ({
      settingsMainScrollable:
        !!document.querySelector("#tjsModal .tjs-main") &&
        getComputedStyle(document.querySelector("#tjsModal .tjs-main")).overflowY === "auto",
      plateIcons: [...document.querySelectorAll(".seal,.tn-brand i")].length,
      swatches: [...document.querySelectorAll(".tjs-swatch")].length,
    }),
    hydrate,
  });
  try {
    const bv = document.getElementById("buildVersion");

    window.TianjiSystemV188 = {
      version: "v188",
      build: BUILD,
      plateIconBrand: true,
      settingsScrollPatched: true,
      themeSwatchVisualized: true,
      baseline: "v187",
    };
  } catch (_) {}
})();
