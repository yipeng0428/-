/* ===== v52 人物档案安全另存：身份字段变化时自动新建，显式按钮才允许覆盖当前档案 ===== */
try {
  const bv = document.getElementById("buildVersion");

  const ft = document.querySelector("footer");
  if (ft) {
    const t = ft.textContent || "";
    if (/版本\s*·/.test(t));
    else ft.insertAdjacentHTML("beforeend", "<br>版本 · 2026-10-03 21:06:03");
  }
} catch (_) {}
