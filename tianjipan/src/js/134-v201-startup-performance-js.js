(() => {
  "use strict";
  const BUILD = "v201 · 2026-10-06 10:22 +08:00";
  const started = performance.now();
  const state = {
    versionWrites: 0,
    homepageReady: false,
    windowLoaded: document.readyState === "complete",
    firstInteraction: false,
    idleDone: false,
  };

  /* 只允许当前版本写 buildVersion。
   不使用 MutationObserver：旧版本脚本已停止版本号监听，避免 V198↔V199↔V200 无限互写。 */
  function writeVersion() {
    window.TianjiRelease?.publish();
  }

  /* 首帧先让浏览器把 UI 画出来。 */
  document.documentElement.classList.add("tj201-booting");
  requestAnimationFrame(() =>
    requestAnimationFrame(() => {
      document.documentElement.classList.remove("tj201-booting");
    }),
  );

  window.addEventListener(
    "tianji:homepage-ready",
    () => {
      state.homepageReady = true;
    },
    { once: true },
  );

  window.addEventListener(
    "load",
    () => {
      state.windowLoaded = true;
    },
    { once: true },
  );

  /* 旧模块若在 4.2s 左右还有一次性版本写入，只在其后补一次最终值。
   这是 one-shot，不监听 DOM。 */

  /* 第一次真实交互只记录状态；V198 自己会在 pointerdown/keydown 后按需加载深度解析。 */
  const onFirst = () => {
    state.firstInteraction = true;
    window.removeEventListener("pointerdown", onFirst, true);
    window.removeEventListener("keydown", onFirst, true);
  };
  window.addEventListener("pointerdown", onFirst, { capture: true, passive: true });
  window.addEventListener("keydown", onFirst, true);

  /* 空闲期只做轻量清理，不自动执行全局布局 audit。 */
  const idle = () => {
    if (state.idleDone) return;
    state.idleDone = true;
    try {
      window.TianjiLayoutGuard?.clean?.();
    } catch (_) {}
  };
  if ("requestIdleCallback" in window) requestIdleCallback(idle, { timeout: 6500 });
  else setTimeout(idle, 5000);

  window.TianjiStartupV201 = Object.freeze({
    version: "1.0.0",
    build: BUILD,
    state: () => ({
      ...state,
      elapsedMs: +(performance.now() - started).toFixed(1),
      consumerReportDeferred: true,
      qimenCrosscheckDeferred: true,
      globalLayoutAutoScan: false,
      versionMutationLocks: false,
    }),
    writeVersion,
  });
  window.TianjiSystemV201 = {
    version: "v201",
    build: BUILD,
    startupPerformanceRecovery: true,
    singleVersionWriter: true,
    consumerReportDeferred: true,
    qimenCrosscheckDeferred: true,
    baseline: "v200",
  };
})();
