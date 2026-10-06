(() => {
  "use strict";
  const TS = "2026-10-04 00:12:20";
  window.__V68_MAG_READY = 1;
  const SVGNS = "http://www.w3.org/2000/svg";

  /* ---------- 1. 放大 / 全屏：统一为真实 SVG 放大镜+号 ---------- */
  function isMagnifyButton(b) {
    if (!b || b.tagName !== "BUTTON") return false;
    if (b.matches(".zoom-ui,.zbtn,.dz-btn")) return true;
    const id = b.id || "";
    if (/Fs$/.test(id) || id === "stuFsBtn") return true;
    const ttl = (
      (b.getAttribute("title") || "") +
      " " +
      (b.getAttribute("aria-label") || "")
    ).trim();
    const tx = (b.textContent || "").trim();
    if (/关闭放大/.test(ttl) || /^关闭$/.test(tx)) return false;
    return /(放大查看|放大到全屏|整体全屏|^全屏$|退出全屏)/.test(ttl + " " + tx);
  }
  function makeMagSvg() {
    const s = document.createElementNS(SVGNS, "svg");
    s.setAttribute("viewBox", "0 0 20 20");
    s.setAttribute("aria-hidden", "true");
    s.classList.add("v68-mag-svg");
    const g = document.createElementNS(SVGNS, "g");
    g.setAttribute("fill", "none");
    g.setAttribute("stroke", "currentColor");
    g.setAttribute("stroke-width", "1.8");
    g.setAttribute("stroke-linecap", "round");
    g.setAttribute("stroke-linejoin", "round");
    const c = document.createElementNS(SVGNS, "circle");
    c.setAttribute("cx", "8.1");
    c.setAttribute("cy", "8.1");
    c.setAttribute("r", "5.05");
    const h = document.createElementNS(SVGNS, "path");
    h.setAttribute("d", "M11.9 11.9L16.7 16.7");
    const p = document.createElementNS(SVGNS, "path");
    p.setAttribute("d", "M8.1 5.45V10.75M5.45 8.1H10.75");
    g.append(c, h, p);
    s.appendChild(g);
    return s;
  }
  function applyMagButton(b) {
    if (!isMagnifyButton(b)) return;
    const raw = (b.textContent || "").trim();
    const exiting = /退出全屏/.test(raw) || /退出全屏/.test(b.getAttribute("title") || "");
    const label = exiting ? "退出全屏" : "放大查看";
    if (!b.getAttribute("title") || /全屏|放大/.test(b.getAttribute("title"))) b.title = label;
    b.setAttribute("aria-label", label);
    b.classList.add("v68-mag-only");
    if (
      b.children.length === 1 &&
      b.firstElementChild &&
      b.firstElementChild.classList.contains("v68-mag-svg")
    )
      return;
    b.replaceChildren(makeMagSvg());
  }
  function scanMagnify(root = document) {
    if (root.nodeType === 1 && root.tagName === "BUTTON") applyMagButton(root);
    if (root.querySelectorAll) root.querySelectorAll("button").forEach(applyMagButton);
  }
  scanMagnify(document);
  try {
    new MutationObserver((ms) => {
      const set = new Set();
      for (const m of ms) {
        if (m.target && m.target.nodeType === 1 && m.target.tagName === "BUTTON") set.add(m.target);
        for (const n of m.addedNodes || []) {
          if (n.nodeType !== 1) continue;
          if (n.tagName === "BUTTON" || (n.querySelector && n.querySelector("button"))) set.add(n);
        }
      }
      set.forEach(scanMagnify);
    }).observe(document.body, { childList: true, subtree: true });
  } catch (_) {}
  document.addEventListener("fullscreenchange", () =>
    requestAnimationFrame(() => scanMagnify(document)),
  );

  /* ---------- 2. 巨盘：固定基础尺寸 + transform GPU 缩放 ---------- */
  let fitRAF = 0,
    resizeTimer = 0;
  function stuBaseSize68() {
    const sc = document.getElementById("stuScroll");
    if (!sc) return 620;
    const r = sc.getBoundingClientRect();
    return Math.max(
      320,
      Math.floor(Math.min(Math.max(0, r.width - 20), Math.max(0, r.height - 20))),
    );
  }
  function stuApplyBase68(force = false) {
    const sc = document.getElementById("stuScroll"),
      st = document.getElementById("stuStage");
    if (!sc || !st) return;
    const n = stuBaseSize68(),
      old = +(st.dataset.v68Base || 0);
    if (force || Math.abs(n - old) >= 3) {
      st.dataset.v68Base = String(n);
      st.style.setProperty("--stu-base-v68", n + "px");
    }
    if (typeof window.stuPanApply === "function") window.stuPanApply();
  }
  function queueBase68(force = false) {
    cancelAnimationFrame(fitRAF);
    fitRAF = requestAnimationFrame(() => stuApplyBase68(force));
  }

  /* 覆盖巨盘平移绘制：缩放只使用 transform，不再改变元素宽高。 */
  window.stuPanApply = function () {
    const st = document.getElementById("stuStage");
    if (!st || typeof STU === "undefined") return;
    const z = Math.max(1, Math.min(5, Number(STU.zoom) || 1));
    const x = Number(STU.pan && STU.pan.x) || 0,
      y = Number(STU.pan && STU.pan.y) || 0;
    st.style.transform = `translate3d(${x.toFixed(2)}px,${y.toFixed(2)}px,0) scale(${z.toFixed(3)})`;
  };

  /* 覆盖“适应视图”：只复位状态和基础尺寸，不再启动尺寸反馈观察器。 */
  window.stuFitView = function (save = true) {
    if (typeof STU === "undefined") return;
    STU.zoom = 1;
    STU.pan = { x: 0, y: 0 };
    STU.gest = "";
    try {
      if (save && typeof stuSave === "function") stuSave();
    } catch (_) {}
    try {
      if (STU.sync) STU.sync();
    } catch (_) {}
    try {
      if (typeof stuGestSet === "function") stuGestSet("");
    } catch (_) {}
    queueBase68(true);
    requestAnimationFrame(() => {
      try {
        window.stuPanApply();
      } catch (_) {}
      const sc = document.getElementById("stuScroll");
      if (sc) {
        sc.scrollLeft = 0;
        sc.scrollTop = 0;
      }
    });
  };

  /* stuUI 创建巨盘 DOM 后，立即标记禁用旧 v66 自适应安装，并安装稳定尺寸。 */
  try {
    const oldUI = window.stuUI;
    if (typeof oldUI === "function" && !window.__stuUI68) {
      window.__stuUI68 = oldUI;
      window.stuUI = function () {
        const r = window.__stuUI68.apply(this, arguments);
        const st = document.getElementById("stuStage");
        if (st) st.dataset.v66fit = "1";
        queueBase68(true);
        setTimeout(() => queueBase68(true), 80);
        return r;
      };
    }
  } catch (_) {}

  /* 原 studioEnter 可能直接调用全局 stuUI；进入后再做一次稳定尺寸，确保三栏布局已经完成。 */
  try {
    const oldEnter = window.studioEnter;
    if (typeof oldEnter === "function" && !window.__studioEnter68) {
      window.__studioEnter68 = oldEnter;
      window.studioEnter = function () {
        const r = window.__studioEnter68.apply(this, arguments);
        queueBase68(true);
        setTimeout(() => queueBase68(true), 120);
        return r;
      };
    }
  } catch (_) {}

  /* 窗口尺寸只在 resize 结束后更新一次，不使用 ResizeObserver 监听盘体本身。 */
  window.addEventListener(
    "resize",
    () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => queueBase68(true), 120);
    },
    { passive: true },
  );
  document.addEventListener("fullscreenchange", () => setTimeout(() => queueBase68(true), 80));

  /* 如果脚本加载时巨盘已在 DOM（开发/恢复状态），直接接管。 */
  const st0 = document.getElementById("stuStage");
  if (st0) {
    st0.dataset.v66fit = "1";
    queueBase68(true);
  }

  /* 版本 */
  try {
    const b = document.getElementById("buildVersion");
  } catch (_) {}
})();
