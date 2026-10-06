(() => {
  "use strict";
  const TS = "2026-10-04 00:17:47";
  const OWNED = new Set([
    "ljSvg",
    "lrpSvg",
    "qtpSvg",
    "typSvg",
    "xapSvg",
    "htdSvg",
    "msgSvg",
    "zlfSvg",
    "lgbSvg",
    "tspSvg",
    "jc12Svg",
    "hhdSvg",
    "jtsSvg",
    "stuSvg",
  ]);
  /* capture 丢失时主动发 pointercancel，确保各盘局部 drag 状态不会残留到下一次操作。 */
  document.addEventListener(
    "lostpointercapture",
    (e) => {
      const svg = e.target && e.target.closest && e.target.closest("svg");
      if (!svg || !OWNED.has(svg.id)) return;
      try {
        svg.dispatchEvent(
          new PointerEvent("pointercancel", { pointerId: e.pointerId, bubbles: false }),
        );
      } catch (_) {}
    },
    true,
  );
  /* 如果旧缓存 DOM 曾经产生顶部个人中心按钮，初始化后也清理。 */
  const clean = () => {
    const b = document.getElementById("tnMe");
    if (b) b.remove();
  };
  clean();
  setTimeout(clean, 0);
  setTimeout(clean, 600);
  try {
    const bv = document.getElementById("buildVersion");
  } catch (_) {}
})();
