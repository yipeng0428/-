(() => {
  "use strict";
  const BUILD = "v200 · 2026-10-06 10:22 +08:00";

  /* 只删除 body 直属、内容完全由“转义空白 + 实际空白”组成的异常文本。
   不删除任何正常文案，也不做全局 MutationObserver，避免重现早期启动性能问题。 */
  function removeEscapedWhitespaceLeaks() {
    try {
      const removed = [];
      [...document.body.childNodes].forEach((n) => {
        if (n.nodeType !== Node.TEXT_NODE) return;
        const t = n.nodeValue || "";
        if (!/[\\][nrt]/.test(t)) return;
        const rest = t.replace(/\s/g, "").replace(/\\[nrt]/g, "");
        if (rest === "") {
          removed.push(t);
          n.remove();
        }
      });
      return removed.length;
    } catch (_) {
      return 0;
    }
  }

  const SCROLL_OK = (el) =>
    el.matches?.(
      ".tabs,.tbl-wrap,.tgb,.q165-tabs,.layersw,pre,textarea,.q199-json,.q199-cases,.tjs-main",
    ) || ["SVG", "CANVAS"].includes(el.tagName);

  const TEXTUAL = (el) =>
    /^(DIV|SECTION|ARTICLE|ASIDE|MAIN|HEADER|FOOTER|NAV|P|LI|DL|DD|DT|DETAILS|SUMMARY|PRE|CODE)$/.test(
      el.tagName,
    );

  function audit(root = document) {
    const offenders = [],
      guarded = [];
    try {
      const scope = root === document ? document.body : root;
      if (!scope) return { offenders, guarded };
      const nodes = [scope, ...scope.querySelectorAll("*")];
      for (const el of nodes) {
        if (!(el instanceof HTMLElement)) continue;
        if (el.hidden || getComputedStyle(el).display === "none") continue;
        if (el.clientWidth <= 0) continue;
        const over = el.scrollWidth - el.clientWidth;
        if (over <= 3) continue;

        const item = {
          tag: el.tagName.toLowerCase(),
          id: el.id || "",
          cls: String(el.className || "").slice(0, 120),
          overflow: Math.round(over),
        };
        offenders.push(item);

        if (SCROLL_OK(el)) {
          el.classList.add("tj200-overflow-scroll");
          guarded.push(item);
          continue;
        }

        if (TEXTUAL(el)) {
          el.classList.add("tj200-overflow-guard");
          guarded.push(item);
        }
      }
    } catch (e) {
      console.warn("[V200 layout audit]", e);
    }
    return { offenders: offenders.slice(0, 100), guarded: guarded.slice(0, 100) };
  }

  let timer = 0;
  function scheduleAudit(delay = 80) {
    clearTimeout(timer);
    timer = setTimeout(() => audit(document), delay);
  }

  removeEscapedWhitespaceLeaks();
  /* V201：
   全局 CSS 加固继续生效，但不再在首屏和普通点击后遍历 document.querySelectorAll('*')。
   完整 audit 保留为手动诊断 API；页面交互时只在浏览器空闲期检查当前活动 pane。
*/
  function auditActivePaneIdle() {
    const run = () => {
      try {
        const pane = document.querySelector(".pane.on");
        if (pane) audit(pane);
      } catch (_) {}
    };
    if ("requestIdleCallback" in window) requestIdleCallback(run, { timeout: 1800 });
    else setTimeout(run, 700);
  }
  window.addEventListener(
    "resize",
    () => {
      clearTimeout(timer);
      timer = setTimeout(auditActivePaneIdle, 420);
    },
    { passive: true },
  );

  window.TianjiLayoutGuard = Object.freeze({
    version: "1.0.0",
    build: BUILD,
    clean: removeEscapedWhitespaceLeaks,
    audit: () => audit(document),
  });

  window.TianjiSystemV200 = {
    version: "v200",
    build: BUILD,
    layoutHardening: true,
    escapedWhitespaceLeakFixed: true,
    baseline: "v199",
  };

  /* V201：V200 版本号锁停用。布局修复保留，版本号由最终单写者管理。 */
})();
