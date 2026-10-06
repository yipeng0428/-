(function () {
  try {
    var w = window.innerWidth || document.documentElement.clientWidth || 1440;
    var mode = w >= 1080 ? "wide" : "compact";
    document.documentElement.setAttribute("data-tj-layout", mode);
    document.documentElement.setAttribute("data-tj-perf", "boot");
    window.__TJ_PERF_BOOT = {
      started: performance.now(),
      build: "v181",
      homepageReady: false,
      lazy: { insight: "deferred" },
    };
  } catch (e) {}
})();
