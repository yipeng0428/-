(() => {
  "use strict";
  const BUILD = "v186 · 2026-10-05 22:42 +08:00";
  function refreshQuick() {
    const b = document.getElementById("themeBtn");
    if (!b) return;
    /* installEntry from settings owns the actual onclick. This late pass only guarantees visual state. */
    const night = document.documentElement.getAttribute("data-tj-theme") === "xuanye";
    b.dataset.night = night ? "1" : "0";
    if (!b.querySelector(".tj-taiji-icon"))
      b.innerHTML = '<span class="tj-taiji-icon" aria-hidden="true"></span>';
  }
  refreshQuick();
  [120, 600, 1800].forEach((ms) => setTimeout(refreshQuick, ms));
  window.addEventListener("tianji:settingschange", refreshQuick);
  window.TianjiTypography = Object.freeze({
    version: "1.0.0",
    build: BUILD,
    status: () => ({
      font: document.documentElement.getAttribute("data-tj-font") || "serif",
      fontScale: getComputedStyle(document.documentElement)
        .getPropertyValue("--tj-font-scale")
        .trim(),
      letterSpacing: getComputedStyle(document.documentElement)
        .getPropertyValue("--tj-letter-spacing")
        .trim(),
      theme: document.documentElement.getAttribute("data-tj-theme") || "auto",
    }),
  });
  try {
    const bv = document.getElementById("buildVersion");

    window.TianjiSystemV186 = {
      version: "v186",
      build: BUILD,
      typographySettings: true,
      quickXuanyeToggle: true,
      fiveThemes: true,
      baseline: "v185",
    };
  } catch (_) {}
})();
