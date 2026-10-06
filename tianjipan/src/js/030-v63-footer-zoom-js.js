(() => {
  const TS = "2026-10-03 23:32:52";
  const bv = document.getElementById("buildVersion");

  // 旧版本脚本有些会在运行期重写放大按钮文字；视觉由 CSS 统一，
  // 这里仅补齐无障碍说明，保持原有功能不变。
  const sync = () => {
    document.querySelectorAll(".zoom-ui,.zbtn,.dz-btn").forEach((b) => {
      if (!b.getAttribute("aria-label")) b.setAttribute("aria-label", "放大查看");
      if (!b.getAttribute("title")) b.title = "放大查看";
      b.dataset.zoomIcon = "magnifier-plus";
    });
  };
  sync();
  const mo = new MutationObserver(sync);
  mo.observe(document.body, { childList: true, subtree: true });
})();
