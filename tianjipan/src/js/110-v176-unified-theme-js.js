(() => {
  "use strict";
  const BUILD = "v176 · 2026-10-05 20:08 +08:00";

  function cleanAstroHints() {
    try {
      const root = document.getElementById("as-orr3d");
      if (!root) return;
      const h = root.querySelector("#orrModeHint");
      if (h) {
        h.hidden = true;
        h.setAttribute("aria-hidden", "true");
      }
      root.querySelectorAll(".cam-help,.astro-gesture-hint").forEach((el) => {
        el.hidden = true;
        el.setAttribute("aria-hidden", "true");
      });
    } catch (_) {}
  }

  /* 某些旧版本切换模式时会重新写入 hint 文案，因此用观察器持续保证不再出现。 */
  let obs = null;
  function install() {
    cleanAstroHints();
    const root = document.getElementById("as-orr3d");
    if (root && !obs) {
      obs = new MutationObserver(cleanAstroHints);
      obs.observe(root, {
        subtree: true,
        childList: true,
        characterData: true,
        attributes: true,
        attributeFilter: ["style", "hidden", "class"],
      });
    }
  }
  document.addEventListener(
    "click",
    (e) => {
      const t =
        e.target && e.target.closest
          ? e.target.closest("#as-orr3d [data-orr-mode],#tj152BigBtn")
          : null;
      if (t) setTimeout(cleanAstroHints, 0);
    },
    true,
  );
  setTimeout(install, 0);

  try {
    const bv = document.getElementById("buildVersion");

    window.TianjiSystemV176 = {
      version: "v176",
      build: BUILD,
      changes: {
        tianjiTheme: "inherit global site theme",
        bigView: "full viewport container",
        astroOperationHints: "removed",
      },
      preserved: {
        tianjiChartRenderer: true,
        tianjiAlgorithms: true,
        solar3dInteractions: true,
        eclipseInteractions: true,
      },
    };
  } catch (_) {}
})();
