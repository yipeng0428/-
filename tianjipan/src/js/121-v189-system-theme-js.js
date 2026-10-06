(() => {
  "use strict";
  const BUILD = "v189 · 2026-10-05 23:58 +08:00";

  function systemMode() {
    return window.matchMedia && matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }
  function syncAutoTheme() {
    const root = document.documentElement;
    if (root.getAttribute("data-tj-theme") !== "auto") return;
    const actual = systemMode();
    root.setAttribute("data-theme", actual);
    try {
      localStorage.setItem("tianjipan.theme", actual);
    } catch (_) {}
    const btn = document.getElementById("themeBtn");
    if (btn) {
      btn.dataset.theme = "auto";
      btn.dataset.night = "0";
      btn.title = `跟随系统 · 当前${actual === "dark" ? "纯黑" : "纯白"}模式 · 点击进入玄夜墨青`;
    }
    window.dispatchEvent(new CustomEvent("tianji:system-theme-sync", { detail: { actual } }));
  }

  /* 真实监听操作系统主题变化。 */
  try {
    const mq = matchMedia("(prefers-color-scheme: dark)");
    const cb = () => syncAutoTheme();
    if (mq.addEventListener) mq.addEventListener("change", cb);
    else mq.addListener?.(cb);
  } catch (_) {}

  syncAutoTheme();
  setTimeout(syncAutoTheme, 120);

  window.TianjiSystemTheme = Object.freeze({
    version: "1.0.0",
    build: BUILD,
    actual: systemMode,
    sync: syncAutoTheme,
  });

  try {
    const bv = document.getElementById("buildVersion");

    window.TianjiSystemV189 = {
      version: "v189",
      build: BUILD,
      systemThemeTrueFollow: true,
      autoLight: "pure-white",
      autoDark: "pure-black",
      baseline: "v188",
    };
  } catch (_) {}
})();
