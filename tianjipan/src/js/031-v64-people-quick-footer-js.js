(() => {
  const TS = "2026-10-03 23:39:00";
  const mount = () => {
    const qz = document.getElementById("quickZiwei");
    let qp = document.getElementById("quickPeople");
    if (qz && !qp) {
      qp = document.createElement("button");
      qp.type = "button";
      qp.className = "pr-quick-btn";
      qp.id = "quickPeople";
      qp.textContent = "人物关系册";
      qz.insertAdjacentElement("afterend", qp);
    }
    if (qp && !qp.dataset.v64Bound && typeof qp.onclick !== "function") {
      qp.dataset.v64Bound = "1";
      qp.addEventListener("click", () => {
        try {
          if (typeof selectTab === "function") selectTab("people", true);
          setTimeout(() => {
            const p = document.getElementById("pane-people");
            if (p)
              p.scrollIntoView({
                behavior: typeof REDUCE !== "undefined" && REDUCE ? "auto" : "smooth",
                block: "start",
              });
          }, 80);
        } catch (e) {
          console.error("[v64 人物关系册快捷入口]", e);
        }
      });
    }
  };
  mount();
  try {
    new MutationObserver(mount).observe(document.body, { childList: true, subtree: true });
  } catch (_) {}
  const bv = document.getElementById("buildVersion");
})();
