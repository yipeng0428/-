(() => {
  const TS = "2026-10-03 23:29:46";
  /* 旧版出生天数监听仍可能触发：无论何时都不再把它放回首页。 */
  const purge = () => {
    const e = document.getElementById("bornDays");
    if (e) {
      e.hidden = true;
      e.remove();
    }
  };
  purge();
  try {
    const mo = new MutationObserver((ms) => {
      for (const m of ms) {
        for (const n of m.addedNodes || []) {
          if (
            n.nodeType === 1 &&
            (n.id === "bornDays" || (n.querySelector && n.querySelector("#bornDays")))
          ) {
            purge();
            return;
          }
        }
      }
    });
    const p = document.getElementById("persona");
    if (p) mo.observe(p, { subtree: true, childList: true });
  } catch (_) {}
  try {
    const bv = document.getElementById("buildVersion");

    const ft = document.querySelector("footer");
    if (ft) {
      const t = ft.textContent || "";
      if (/版本\s*·/.test(t));
      else ft.insertAdjacentHTML("beforeend", "<br>版本 · " + TS);
    }
  } catch (_) {}
})();
