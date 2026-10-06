/** Shared lifecycle for pane extensions. No polling and no retained calculation results. */
(() => {
  "use strict";
  const extensions = new Map();
  const pending = new Set();
  const stats = { flushes: 0, mounts: 0, skipped: 0 };
  let frame = null;
  let installed = false;

  function flush() {
    frame = null;
    const panes = [...pending];
    pending.clear();
    for (const pane of panes) {
      const root = document.getElementById(`pane-${pane}`);
      if (!root?.classList.contains("on") || document.hidden) {
        stats.skipped++;
        continue;
      }
      stats.flushes++;
      // Registration order preserves dependencies between extension panels.
      for (const [name, mount] of extensions.get(pane) || []) {
        try {
          mount();
          stats.mounts++;
        } catch (error) {
          console.warn("[天机盘页面扩展]", name, error);
        }
      }
    }
  }

  function request(pane) {
    if (!extensions.has(pane)) return;
    pending.add(pane);
    if (frame === null) frame = requestAnimationFrame(flush);
  }

  function register(pane, name, mount) {
    if (typeof mount !== "function")
      throw new TypeError("Pane extension requires a mount function");
    if (!extensions.has(pane)) extensions.set(pane, new Map());
    extensions.get(pane).set(name, mount);
  }

  function install() {
    if (installed) return;
    installed = true;
    const render = refRender;
    refRender = function (...args) {
      const result = render.apply(this, args);
      request(args[0]);
      return result;
    };
    // Navigation already renders via refRender. Scheduling on the click as well
    // can mount against the previous DOM before the deferred render completes.
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) {
        for (const pane of extensions.keys()) {
          if (document.getElementById(`pane-${pane}`)?.classList.contains("on")) request(pane);
        }
      }
    });
    for (const pane of extensions.keys()) request(pane);
  }

  window.TianjiPaneScheduler = Object.freeze({
    register,
    request,
    install,
    snapshot: () => ({
      ...stats,
      pending: [...pending],
      extensionCount: [...extensions.values()].reduce((n, m) => n + m.size, 0),
    }),
  });
})();
