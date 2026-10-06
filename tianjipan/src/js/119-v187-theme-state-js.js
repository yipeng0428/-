(() => {
  "use strict";
  const BUILD = "v187 · 2026-10-05 23:18 +08:00";
  const INDICATOR = {
    auto: "system",
    xuanpaper: "#b07a27",
    xuanye: "#62d3c7",
    cinnabar: "#b43b2d",
    jade: "#338c78",
    ziwei: "#927bd7",
  };
  function sync() {
    const root = document.documentElement,
      t = root.getAttribute("data-tj-theme") || "auto",
      b = document.getElementById("themeBtn");
    if (b) {
      b.dataset.theme = t;
      b.dataset.night = t === "xuanye" ? "1" : "0";
      b.title =
        t === "xuanye"
          ? "返回上一浅色主题"
          : `当前：${window.TianjiTheme?.themes?.[t]?.name || t} · 点击进入玄夜墨青`;
    }
  }
  window.addEventListener("tianji:themechange", sync);
  window.addEventListener("tianji:settingschange", sync);
  sync();
  [120, 600, 1600].forEach((ms) => setTimeout(sync, ms));
  window.TianjiThemeStatus = Object.freeze({
    version: "1.0.0",
    build: BUILD,
    indicator: () => INDICATOR[document.documentElement.getAttribute("data-tj-theme") || "auto"],
    current: () => document.documentElement.getAttribute("data-tj-theme") || "auto",
  });
  try {
    const bv = document.getElementById("buildVersion");

    window.TianjiSystemV187 = {
      version: "v187",
      build: BUILD,
      fiveRealThemes: true,
      themeCascadeFixed: true,
      themeIndicatorDot: true,
      baseline: "v186",
    };
  } catch (_) {}
})();
