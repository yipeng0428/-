(() => {
  "use strict";
  const TS = "2026-10-03 23:57:58";

  /* 旧 v63 曾把反斜杠+n 当成可见文本写进 head；这里只清理纯转义换行文本节点。 */
  function cleanEscapedNewlineText(root = document.body) {
    try {
      const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT),
        del = [];
      while (w.nextNode()) {
        const n = w.currentNode,
          t = (n.nodeValue || "").replace(/\s/g, "");
        if (t && /^(?:\\n|\\r)+$/.test(t)) del.push(n);
      }
      del.forEach((n) => n.remove());
    } catch (_) {}
  }

  function magButtons(root = document) {
    if (window.__V68_MAG_READY) return;
    const btns = root.querySelectorAll ? root.querySelectorAll("button") : [];
    btns.forEach((b) => {
      const id = b.id || "",
        ttl = (b.getAttribute("title") || "") + " " + (b.getAttribute("aria-label") || ""),
        tx = (b.textContent || "").trim();
      const generic = b.matches(".zoom-ui,.zbtn,.dz-btn");
      const fs =
        /Fs$/.test(id) ||
        id === "stuFsBtn" ||
        /(放大查看|放大到全屏|整体全屏|全屏)/.test(ttl) ||
        /(?:^|\s)(全屏|退出全屏)$/.test(tx);
      if (!generic && !fs) return;
      b.classList.add("v66-mag");
      if (generic) {
        b.classList.add("icon-only");
        return;
      }
      let nt = (b.textContent || "")
        .replace(/[↗↙⛶⤢]+/g, "")
        .replace(/\s+/g, " ")
        .trim();
      if (/退出全屏/.test(nt)) nt = "退出全屏";
      else if (/全屏/.test(nt) || fs) nt = "全屏";
      if (b.textContent !== nt) b.textContent = nt;
    });
  }

  let fitRAF = 0,
    fitRO = null,
    fitMO = null;
  function stuApplyFit66(center = false) {}
  function queueFit66(center = false) {
    cancelAnimationFrame(fitRAF);
    fitRAF = requestAnimationFrame(() => stuApplyFit66(center));
  }
  function installStuFit66() {}

  try {
    if (typeof window.stuFitView === "function" && !window.__stuFit66) {
      window.__stuFit66 = window.stuFitView;
      window.stuFitView = function (save = true) {
        const r = window.__stuFit66.apply(this, arguments);
        setTimeout(() => {
          installStuFit66();
          stuApplyFit66(true);
        }, 0);
        return r;
      };
    }
  } catch (_) {}

  function boot() {
    cleanEscapedNewlineText();
    magButtons();
    installStuFit66();
    try {
      const bv = document.getElementById("buildVersion");
    } catch (_) {}
  }
  boot();
  try {
    new MutationObserver((ms) => {
      if (window.__V68_MAG_READY) return;
      if (ms.some((m) => m.type === "childList" || m.type === "characterData")) {
        cleanEscapedNewlineText();
        magButtons();
        installStuFit66();
      }
    }).observe(document.body, { childList: true, subtree: true, characterData: true });
  } catch (_) {}
  window.addEventListener("resize", () => queueFit66(false), { passive: true });
  document.addEventListener("fullscreenchange", () =>
    setTimeout(() => {
      magButtons();
      queueFit66(true);
    }, 60),
  );
})();
