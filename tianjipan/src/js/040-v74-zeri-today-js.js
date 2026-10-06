(() => {
  const TS = "2026-10-04 01:25:13";
  function placeZrToday() {
    const el = document.getElementById("zrStart");
    if (!el) return;
    let b =
      document.querySelector("#pane-zeri .tdy.zr-today") || el.parentElement?.querySelector(".tdy");
    if (!b) return;
    b.classList.add("zr-today");
    const ctl = el.closest(".xkctl");
    if (ctl && b.parentElement !== ctl) ctl.appendChild(b);
  }
  const mo = new MutationObserver(() => requestAnimationFrame(placeZrToday));
  const pane = document.getElementById("pane-zeri");
  if (pane) mo.observe(pane, { childList: true, subtree: true });
  requestAnimationFrame(placeZrToday);
  try {
    const bv = document.getElementById("buildVersion");
  } catch (_) {}
})();
