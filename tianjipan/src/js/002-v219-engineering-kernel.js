(() => {
  "use strict";
  /* V219 融合工程核：以原 V219 为主体，吸收 V218 的稳定修复与 V220 的成熟架构思想。
   刻意不引入 V220 的独立 Store / Worker，避免在当前单文件产品里形成第二套数据与计算通道。 */
  const BUILD = Object.freeze({
    version: "v237.2",
    display: "V237.2 · 代码整理与性能优化版",
    build: "v237.2-cleanup · 2026-10-07",
    baseline: "v237.1",
    edition: "cleanup",
    stableFallback: "v218",
    architecture: "runtime-lite",
  });
  window.TianjiBuild = BUILD;

  window.TianjiVendorIntegrity = Object.freeze({
    async verify(code, expected) {
      if (typeof code !== "string" || !code || code.length > 3000000 || !globalThis.crypto?.subtle)
        return false;
      const bytes = new TextEncoder().encode(code),
        digest = await crypto.subtle.digest("SHA-256", bytes);
      return (
        [...new Uint8Array(digest)].map((x) => x.toString(16).padStart(2, "0")).join("") ===
        expected
      );
    },
  });

  const ALLOW_TAGS = new Set([
    "A",
    "ARTICLE",
    "B",
    "BLOCKQUOTE",
    "BR",
    "CITE",
    "CODE",
    "DD",
    "DEL",
    "DIV",
    "DL",
    "DT",
    "EM",
    "H3",
    "H4",
    "H5",
    "HEADER",
    "HR",
    "I",
    "IMG",
    "INS",
    "LI",
    "MARK",
    "OL",
    "P",
    "PRE",
    "Q",
    "SECTION",
    "SMALL",
    "SPAN",
    "STRONG",
    "SUB",
    "SUP",
    "TABLE",
    "TBODY",
    "TD",
    "TH",
    "THEAD",
    "TR",
    "U",
    "UL",
  ]);
  const URL_ATTRS = new Set(["href", "src"]);
  const ALLOW_ATTRS = new Set([
    "class",
    "title",
    "aria-label",
    "aria-hidden",
    "target",
    "rel",
    "download",
    "href",
    "src",
    "alt",
  ]);
  const DROP_TAGS = new Set([
    "SCRIPT",
    "STYLE",
    "IFRAME",
    "OBJECT",
    "EMBED",
    "META",
    "LINK",
    "BASE",
    "FORM",
  ]);
  function safeHref(raw) {
    raw = String(raw || "").trim();
    if (!raw) return false;
    const low = raw.toLowerCase();
    if (
      low.startsWith("#") ||
      low.startsWith("/") ||
      low.startsWith("./") ||
      low.startsWith("../") ||
      low.startsWith("?")
    )
      return true;
    try {
      const u = new URL(raw, location.href);
      return ["http:", "https:", "mailto:", "tel:"].includes(u.protocol);
    } catch (_) {
      return false;
    }
  }
  function safeSrc(raw) {
    raw = String(raw || "").trim();
    if (!raw) return false;
    const low = raw.toLowerCase();
    if (/^data:image\/(png|jpeg|gif|webp);base64,/.test(low)) return true;
    try {
      const u = new URL(raw, location.href);
      return u.protocol === "http:" || u.protocol === "https:";
    } catch (_) {
      return false;
    }
  }
  function sanitizeHTML(input) {
    if (input == null || input === "") return "";
    const tpl = document.createElement("template");
    tpl.innerHTML = String(input);
    for (const el of [...tpl.content.querySelectorAll("*")]) {
      const tag = el.tagName,
        parent = el.parentNode;
      if (!parent) continue;
      if (!ALLOW_TAGS.has(tag)) {
        if (DROP_TAGS.has(tag)) {
          el.remove();
          continue;
        }
        while (el.firstChild) parent.insertBefore(el.firstChild, el);
        el.remove();
        continue;
      }
      for (const attr of [...el.attributes]) {
        const name = attr.name.toLowerCase();
        if (
          name.startsWith("on") ||
          name === "style" ||
          name === "id" ||
          name === "srcset" ||
          name === "formaction" ||
          !ALLOW_ATTRS.has(name)
        ) {
          el.removeAttribute(attr.name);
          continue;
        }
        if (URL_ATTRS.has(name)) {
          const ok = name === "href" ? safeHref(attr.value) : safeSrc(attr.value);
          if (!ok) el.removeAttribute(attr.name);
        }
      }
      if (tag === "A" && el.getAttribute("target") === "_blank")
        el.setAttribute("rel", "noopener noreferrer");
      if (tag === "IMG" && !el.getAttribute("alt")) el.setAttribute("alt", "");
    }
    return tpl.innerHTML;
  }
  function safeSetHTML(el, markup) {
    if (el) el.innerHTML = sanitizeHTML(markup);
    return el;
  }
  function idle(cb, timeout = 1200) {
    if (typeof requestIdleCallback === "function") return requestIdleCallback(cb, { timeout });
    return setTimeout(
      () => cb({ didTimeout: true, timeRemaining: () => 0 }),
      Math.min(50, timeout),
    );
  }
  function mark(name) {
    try {
      performance.mark("tj219:" + name);
    } catch (_) {}
  }

  /* V220 思路的低风险版本：统一清理作用域，但修正其 RAF handle Set 会持续增长的问题。 */
  class Scope {
    constructor(name = "scope") {
      this.name = name;
      this.cleanups = [];
      this.disposed = false;
      this.abortController = typeof AbortController === "function" ? new AbortController() : null;
      this.rafIds = new Set();
    }
    _push(fn) {
      if (this.disposed) {
        try {
          fn();
        } catch (_) {}
      } else this.cleanups.push(fn);
      return fn;
    }
    on(target, type, fn, opts) {
      if (!target?.addEventListener) return () => {};
      target.addEventListener(type, fn, opts);
      return this._push(() => {
        try {
          target.removeEventListener(type, fn, opts);
        } catch (_) {}
      });
    }
    timeout(fn, ms) {
      const id = setTimeout(() => {
        if (!this.disposed) fn();
      }, ms);
      return this._push(() => clearTimeout(id));
    }
    interval(fn, ms) {
      const id = setInterval(() => {
        if (!this.disposed) fn();
      }, ms);
      return this._push(() => clearInterval(id));
    }
    raf(fn) {
      let id = 0;
      const loop = (t) => {
        if (this.disposed) return;
        if (id) this.rafIds.delete(id);
        try {
          fn(t);
        } catch (err) {
          setTimeout(() => {
            throw err;
          }, 0);
        }
        if (this.disposed) return;
        id = requestAnimationFrame(loop);
        this.rafIds.add(id);
      };
      id = requestAnimationFrame(loop);
      this.rafIds.add(id);
      return this._push(() => {
        if (id) {
          cancelAnimationFrame(id);
          this.rafIds.delete(id);
          id = 0;
        }
      });
    }
    abort() {
      try {
        this.abortController?.abort();
      } catch (_) {}
    }
    dispose() {
      if (this.disposed) return;
      this.disposed = true;
      this.abort();
      for (const id of this.rafIds) {
        try {
          cancelAnimationFrame(id);
        } catch (_) {}
      }
      this.rafIds.clear();
      for (let i = this.cleanups.length - 1; i >= 0; i--) {
        try {
          this.cleanups[i]();
        } catch (_) {}
      }
      this.cleanups.length = 0;
    }
  }

  /* 轻量模块登记：只管理生命周期，不另建第二套业务状态。 */
  const modules = new Map();
  function registerModule(name, definition = {}) {
    if (!name) return null;
    const prev = modules.get(name);
    if (prev?.scope) prev.scope.dispose();
    const rec = { name, definition, state: "registered", scope: null };
    modules.set(name, rec);
    return definition;
  }
  async function mountModule(name, ctx = {}) {
    const rec = modules.get(name);
    if (!rec) return null;
    if (rec.state === "mounted") return rec.scope;
    const scope = new Scope(name);
    rec.scope = scope;
    rec.state = "mounting";
    try {
      await rec.definition.mount?.({ ctx, scope, runtime: Runtime });
      rec.state = "mounted";
      return scope;
    } catch (err) {
      rec.state = "error";
      scope.dispose();
      rec.scope = null;
      throw err;
    }
  }
  async function unmountModule(name) {
    const rec = modules.get(name);
    if (!rec) return false;
    try {
      await rec.definition.destroy?.({ scope: rec.scope, runtime: Runtime });
    } catch (_) {}
    rec.scope?.dispose();
    rec.scope = null;
    rec.state = "registered";
    return true;
  }
  function moduleSnapshot() {
    return [...modules.values()].map((x) => ({ name: x.name, state: x.state }));
  }

  /* 单一可见性调度器：旧模块只注册“恢复动作”；隐藏时仍由各自 loop 现有逻辑停止。 */
  const resumeHooks = new Map();
  const runtimeScope = new Scope("runtime-lite");
  function registerResume(name, fn) {
    if (!name || typeof fn !== "function") return () => {};
    resumeHooks.set(name, fn);
    return () => resumeHooks.delete(name);
  }
  function resumeAll() {
    if (document.hidden) return;
    requestAnimationFrame(() => {
      for (const [name, fn] of resumeHooks) {
        try {
          fn();
        } catch (err) {
          console.warn("[V219 resume]", name, err);
        }
      }
    });
  }
  const state = {
    version: BUILD.version,
    build: BUILD.build,
    hidden: document.hidden,
    started: performance.now(),
    metrics: { longTasks: 0 },
    modules,
  };
  mark("boot");
  runtimeScope.on(
    document,
    "visibilitychange",
    () => {
      state.hidden = document.hidden;
      mark(document.hidden ? "hidden" : "visible");
      window.dispatchEvent(
        new CustomEvent("tianji:v219-visibility", { detail: { hidden: document.hidden } }),
      );
      if (!document.hidden) resumeAll();
    },
    { passive: true },
  );
  runtimeScope.on(
    window,
    "pagehide",
    () => {
      state.hidden = true;
      mark("pagehide");
    },
    { passive: true },
  );
  if ("PerformanceObserver" in window) {
    try {
      const po = new PerformanceObserver((list) => {
        state.metrics.longTasks += list.getEntries().length;
      });
      po.observe({ type: "longtask", buffered: true });
      runtimeScope._push(() => po.disconnect());
    } catch (_) {}
  }

  const Runtime = Object.freeze({
    version: BUILD.version,
    build: BUILD.build,
    architecture: "runtime-lite",
    sanitizeHTML,
    safeSetHTML,
    idle,
    mark,
    Scope,
    register: registerModule,
    mount: mountModule,
    unmount: unmountModule,
    modules: moduleSnapshot,
    scheduler: Object.freeze({ registerResume, resumeAll, size: () => resumeHooks.size }),
    state,
    manifest: () => ({
      edition: BUILD.display,
      absorbed: [
        "V218 紫微飞星渲染稳定修复",
        "V219 安全/XSS/可见性/调度优化",
        "V220 Scope/模块生命周期/长任务观测思想",
      ],
      intentionallyOmitted: [
        "V220 独立 Store：避免与现有 localStorage 体系双轨",
        "V220 Web Worker：当前 JSON/SHA/sum 工作量不足以抵消线程复杂度",
      ],
      algorithmChanged: false,
    }),
  });
  window.TianjiRuntime = Runtime;
  window.TianjiRuntimeLite = Runtime;
  window.__TJ_V219 = Object.freeze({
    version: BUILD.version,
    build: BUILD.build,
    sanitizeHTML,
    safeSetHTML,
    idle,
    mark,
    Scope,
    runtime: Runtime,
    state,
  });
  document.documentElement.dataset.tjArchitecture = "v219-fusion";
})();
