(function () {
  "use strict";
  var BUILD = "v116 · 2026-10-04 13:28 +08:00";
  /* 页面进入后台时暂停不必要的动画标志；现有 3D 循环本身也会检查 document.hidden。 */
  document.addEventListener(
    "visibilitychange",
    function () {
      try {
        document.documentElement.classList.toggle("v116-hidden", document.hidden);
      } catch (_) {}
    },
    { passive: true },
  );
  /* 页面级轻量诊断，便于后续继续定位性能回归。 */
  window.TianjiPerformance = {
    version: "v116",
    build: BUILD,
    offlineFonts: true,
    lazyCorePanes: true,
    lightBoot: true,
    mutationLoopGuard: true,
    bootAt: performance && performance.now ? performance.now() : 0,
  };
  try {
    var bv = document.getElementById("buildVersion");

    var prev = window.TianjiSystemV115 || window.TianjiSystem || {};
    window.TianjiSystemV116 = {
      version: "v116",
      build: BUILD,
      performance: {
        offlineFonts: true,
        lazyCorePanes: true,
        lightBoot: true,
        mutationLoopGuard: true,
      },
    };
  } catch (_) {}
})();
