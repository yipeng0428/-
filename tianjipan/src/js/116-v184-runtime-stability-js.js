(() => {
  "use strict";
  const BUILD = "v184 · 2026-10-05 21:42 +08:00";
  const perf = { boot: performance.now(), globalObserversRemoved: true, leftScroll: "native" };
  function cleanNav() {
    document.querySelectorAll('#topnav [data-go="dial"]').forEach((x) => x.remove());
  }
  function stabilizeDial() {
    const d = document.querySelector(".layout>.dialcol");
    if (!d) return;
    d.style.removeProperty("--v178-left-shift");
    d.style.transform = "";
    d.classList.remove("v178-focus-scroll");
    d.classList.add("v184-focus-scroll");
    try {
      window.TianjiLeftFocusScroll?.bind?.();
    } catch (_) {}
  }
  cleanNav();
  stabilizeDial();
  [400, 1400, 3200].forEach((ms) =>
    setTimeout(() => {
      cleanNav();
      stabilizeDial();
    }, ms),
  );
  window.addEventListener("resize", () => requestAnimationFrame(stabilizeDial), { passive: true });
  window.addEventListener("tianji:layoutchange", () => requestAnimationFrame(stabilizeDial));
  window.TianjiStability = Object.freeze({
    version: "1.0.0",
    build: BUILD,
    status: () => ({
      bodyMutationObserversRemoved: true,
      leftScrollMode: "native-scrollTop",
      navDialRemoved: !document.querySelector('#topnav [data-go="dial"]'),
      settingsTheme: document.documentElement.getAttribute("data-tj-theme") || "auto",
      sincePatchMs: +(performance.now() - perf.boot).toFixed(1),
    }),
  });
  try {
    const bv = document.getElementById("buildVersion");

    window.TianjiSystemV184 = {
      version: "v184",
      build: BUILD,
      startupFreezeFix: true,
      stableLeftScroll: true,
      navSimplified: true,
      fiveThemes: true,
      baseline: "v183",
    };
  } catch (_) {}
})();
