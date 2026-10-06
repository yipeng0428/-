(function () {
  "use strict";
  const V133_BUILD = "v133 · 2026-10-05 00:22 +08:00";
  window.addEventListener("load", function () {
    try {
      const bv = document.getElementById("buildVersion");

      window.TianjiSystemV133 = {
        version: "v133",
        build: V133_BUILD,
        solarDayRing: true,
        solarUiEnhanced: true,
      };
    } catch (_) {}
  });
})();
