(() => {
  "use strict";
  const BUILD = "v184 · 2026-10-05 21:42 +08:00";
  const S = {
    left: null,
    layout: null,
    rail: null,
    thumb: null,
    dragging: false,
    dragY: 0,
    dragScroll: 0,
    over: false,
    timer: 0,
    raf: 0,
    ro: null,
    bound: false,
  };
  const q = (s, r = document) => r.querySelector(s);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  function desktop() {
    return innerWidth >= 1080 && !document.body.classList.contains("studio-mode");
  }
  function blocked() {
    if (!desktop() || document.fullscreenElement) return true;
    const big = q("#tj152Big");
    return !!(big && big.classList.contains("on"));
  }
  function activate(ms = 2400) {
    document.body.classList.add("v184-left-engaged");
    clearTimeout(S.timer);
    S.timer = setTimeout(() => {
      if (!S.over && !S.dragging) document.body.classList.remove("v184-left-engaged");
    }, ms);
  }
  function ensureRail() {
    if (S.rail && S.rail.isConnected) return;
    const rail = document.createElement("div");
    rail.id = "v184LeftRail";
    rail.hidden = true;
    rail.title = "观象区浏览：鼠标在左侧时原生滚动；到顶/到底后自动接回整页；拖动此细轨可快速浏览";
    rail.innerHTML =
      '<span class="v184-rail-dot"></span><div id="v184LeftThumb"></div><span class="v184-rail-tip">观象区 · 上下拖动</span>';
    document.body.appendChild(rail);
    S.rail = rail;
    S.thumb = rail.querySelector("#v184LeftThumb");
    rail.addEventListener("pointerdown", (e) => {
      if (blocked() || e.button !== 0) return;
      e.preventDefault();
      S.dragging = true;
      rail.classList.add("dragging");
      S.dragY = e.clientY;
      S.dragScroll = S.left?.scrollTop || 0;
      try {
        rail.setPointerCapture(e.pointerId);
      } catch (_) {}
      activate(6000);
    });
    rail.addEventListener("pointermove", (e) => {
      if (!S.dragging || !S.left || !S.thumb) return;
      e.preventDefault();
      const rr = rail.getBoundingClientRect(),
        th = S.thumb.getBoundingClientRect();
      const track = Math.max(1, rr.height - th.height),
        max = Math.max(0, S.left.scrollHeight - S.left.clientHeight);
      S.left.scrollTop = clamp(S.dragScroll + (e.clientY - S.dragY) * (max / track), 0, max);
    });
    const end = (e) => {
      if (!S.dragging) return;
      S.dragging = false;
      rail.classList.remove("dragging");
      try {
        rail.releasePointerCapture(e.pointerId);
      } catch (_) {}
      activate(1200);
    };
    rail.addEventListener("pointerup", end);
    rail.addEventListener("pointercancel", end);
    rail.addEventListener("dblclick", (e) => {
      e.preventDefault();
      if (S.left) S.left.scrollTo({ top: 0, behavior: "smooth" });
      activate(1000);
    });
    rail.addEventListener("click", (e) => {
      if (S.dragging || !S.left || !S.thumb || e.target === S.thumb) return;
      const rr = rail.getBoundingClientRect(),
        th = S.thumb.getBoundingClientRect(),
        max = Math.max(0, S.left.scrollHeight - S.left.clientHeight);
      const track = Math.max(1, rr.height - th.height),
        y = clamp(e.clientY - rr.top - th.height / 2, 0, track);
      S.left.scrollTop = (max * y) / track;
    });
  }
  function measure() {
    if (!S.left || !S.layout) {
      return;
    }
    if (blocked()) {
      if (S.rail) S.rail.hidden = true;
      S.left.classList.remove("v184-focus-scroll");
      return;
    }
    S.left.classList.add("v184-focus-scroll");
    ensureRail();
    const cr = S.left.getBoundingClientRect(),
      lr = S.layout.getBoundingClientRect();
    const top = clamp(cr.top, 14, Math.max(14, innerHeight - 100));
    const vh = Math.max(100, Math.min(S.left.clientHeight, innerHeight - top - 14));
    const max = Math.max(0, S.left.scrollHeight - S.left.clientHeight);
    S.rail.style.left = Math.min(innerWidth - 14, Math.max(4, cr.right + 5)) + "px";
    S.rail.style.top = top + "px";
    S.rail.style.height = vh + "px";
    S.rail.hidden = max < 6 || lr.bottom < 20 || lr.top > innerHeight - 20;
    if (S.thumb && !S.rail.hidden) {
      const ratio = clamp(
        S.left.clientHeight / Math.max(S.left.clientHeight, S.left.scrollHeight),
        0.06,
        1,
      );
      const h = Math.max(34, vh * ratio),
        track = Math.max(0, vh - h),
        y = max ? track * (S.left.scrollTop / max) : 0;
      S.thumb.style.height = h + "px";
      S.thumb.style.transform = `translate3d(0,${y}px,0)`;
    }
  }
  function bind() {
    const left = q(".layout>.dialcol"),
      layout = q(".layout");
    if (!left || !layout) return false;
    if (S.bound && S.left === left) {
      measure();
      return true;
    }
    S.left = left;
    S.layout = layout;
    S.bound = true;
    /* remove all transform remnants left by older v178 builds */
    left.style.removeProperty("--v178-left-shift");
    left.style.transform = "";
    left.classList.remove("v178-focus-scroll");
    left.classList.add("v184-focus-scroll");
    ensureRail();
    left.addEventListener(
      "scroll",
      () => {
        activate(900);
        if (!S.raf)
          S.raf = requestAnimationFrame(() => {
            S.raf = 0;
            measure();
          });
      },
      { passive: true },
    );
    left.addEventListener("pointerenter", () => {
      S.over = true;
      activate(999999);
    });
    left.addEventListener("pointerleave", () => {
      S.over = false;
      activate(650);
    });
    window.addEventListener("resize", () => requestAnimationFrame(measure), { passive: true });
    window.addEventListener(
      "scroll",
      () => {
        if (!S.raf)
          S.raf = requestAnimationFrame(() => {
            S.raf = 0;
            measure();
          });
      },
      { passive: true },
    );
    if (typeof ResizeObserver !== "undefined") {
      S.ro = new ResizeObserver(() => requestAnimationFrame(measure));
      S.ro.observe(left);
      S.ro.observe(layout);
    }
    setTimeout(measure, 0);
    return true;
  }
  function reset() {
    if (S.left) S.left.scrollTop = 0;
    measure();
  }
  function status() {
    return {
      schema: "tianji.ui.left-focus-scroll.v2",
      build: BUILD,
      enabled: desktop(),
      scrollTop: Math.round(S.left?.scrollTop || 0),
      max: Math.max(0, Math.round((S.left?.scrollHeight || 0) - (S.left?.clientHeight || 0))),
      nativeScroll: true,
    };
  }
  window.TianjiLeftFocusScroll = Object.freeze({
    version: "2.0.0",
    build: BUILD,
    bind,
    reset,
    status,
    scrollBy: (px) => {
      if (S.left) S.left.scrollBy({ top: Number(px) || 0, behavior: "auto" });
    },
  });
  bind();
})();
