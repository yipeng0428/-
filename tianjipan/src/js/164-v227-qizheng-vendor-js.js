(() => {
  "use strict";
  const BUILD = "v227 · 2026-10-06 21:36 +08:00";
  const SCHEMA = "tianji.qizheng.vendor-cache.v1";
  const VERSION = "2.1.19";
  const COMMIT = "865d3da7d8112bbc7911238052c6af4aaf877181";
  const BLOB_SHA1 = "fc5ab5c406c6fd64bdd537772e4cc7c8d438275b";
  const EXPECTED_BYTES = 116485;
  const SRC_KEY = "tianjipan.vendor.astronomy-engine.2.1.19.source.v227";
  const META_KEY = "tianjipan.vendor.astronomy-engine.2.1.19.meta.v227";
  const URLS = [
    "https://cdn.jsdelivr.net/npm/astronomy-engine@2.1.19/astronomy.browser.min.js",
    "https://raw.githubusercontent.com/cosinekitty/astronomy/865d3da7d8112bbc7911238052c6af4aaf877181/source/js/astronomy.browser.min.js",
  ];
  let BUSY = null,
    LAST = null;

  const clone = (x) => (x == null ? x : JSON.parse(JSON.stringify(x)));
  const E = (s) =>
    String(s ?? "").replace(
      /[&<>"']/g,
      (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
    );
  function apiReady() {
    return !!(
      window.Astronomy &&
      Astronomy.Body &&
      Astronomy.GeoVector &&
      Astronomy.Ecliptic &&
      Astronomy.SunPosition
    );
  }
  function utf8(s) {
    if (window.TextEncoder) return new TextEncoder().encode(s);
    const x = unescape(encodeURIComponent(s)),
      a = new Uint8Array(x.length);
    for (let i = 0; i < x.length; i++) a[i] = x.charCodeAt(i);
    return a;
  }
  function sha1Fallback(bytes) {
    const bitLen = bytes.length * 8,
      withOne = bytes.length + 1,
      pad = (56 - (withOne % 64) + 64) % 64,
      total = withOne + pad + 8;
    const buf = new Uint8Array(total);
    buf.set(bytes);
    buf[bytes.length] = 0x80;
    const dv = new DataView(buf.buffer),
      hi = Math.floor(bitLen / 0x100000000),
      lo = bitLen >>> 0;
    dv.setUint32(total - 8, hi);
    dv.setUint32(total - 4, lo);
    let h0 = 0x67452301,
      h1 = 0xefcdab89,
      h2 = 0x98badcfe,
      h3 = 0x10325476,
      h4 = 0xc3d2e1f0;
    const w = new Uint32Array(80),
      rol = (x, n) => ((x << n) | (x >>> (32 - n))) >>> 0;
    for (let off = 0; off < total; off += 64) {
      for (let i = 0; i < 16; i++) w[i] = dv.getUint32(off + i * 4);
      for (let i = 16; i < 80; i++) w[i] = rol(w[i - 3] ^ w[i - 8] ^ w[i - 14] ^ w[i - 16], 1);
      let a = h0,
        b = h1,
        c = h2,
        d = h3,
        e = h4;
      for (let i = 0; i < 80; i++) {
        let f, k;
        if (i < 20) {
          f = (b & c) | (~b & d);
          k = 0x5a827999;
        } else if (i < 40) {
          f = b ^ c ^ d;
          k = 0x6ed9eba1;
        } else if (i < 60) {
          f = (b & c) | (b & d) | (c & d);
          k = 0x8f1bbcdc;
        } else {
          f = b ^ c ^ d;
          k = 0xca62c1d6;
        }
        const t = (rol(a, 5) + f + e + k + w[i]) >>> 0;
        e = d;
        d = c;
        c = rol(b, 30);
        b = a;
        a = t;
      }
      h0 = (h0 + a) >>> 0;
      h1 = (h1 + b) >>> 0;
      h2 = (h2 + c) >>> 0;
      h3 = (h3 + d) >>> 0;
      h4 = (h4 + e) >>> 0;
    }
    return [h0, h1, h2, h3, h4].map((x) => x.toString(16).padStart(8, "0")).join("");
  }
  async function sha1(bytes) {
    try {
      if (crypto?.subtle) {
        const h = await crypto.subtle.digest("SHA-1", bytes);
        return [...new Uint8Array(h)].map((x) => x.toString(16).padStart(2, "0")).join("");
      }
    } catch (_) {}
    return sha1Fallback(bytes);
  }
  async function gitBlobSha(text) {
    const body = utf8(text),
      head = utf8(`blob ${body.length}\0`),
      all = new Uint8Array(head.length + body.length);
    all.set(head);
    all.set(body, head.length);
    return { bytes: body.length, sha1: await sha1(all) };
  }
  async function verifySource(text) {
    if (typeof text !== "string" || !text.length)
      return { ok: false, reason: "source-empty", bytes: 0, sha1: null };
    const g = await gitBlobSha(text),
      ok = g.bytes === EXPECTED_BYTES && g.sha1 === BLOB_SHA1;
    return {
      ok,
      reason: ok ? "verified" : `expected ${EXPECTED_BYTES}/${BLOB_SHA1}, got ${g.bytes}/${g.sha1}`,
      bytes: g.bytes,
      sha1: g.sha1,
    };
  }
  function readCache() {
    try {
      const src = localStorage.getItem(SRC_KEY),
        meta = JSON.parse(localStorage.getItem(META_KEY) || "null");
      return src ? { source: src, meta } : null;
    } catch (_) {
      return null;
    }
  }
  function writeCache(source, verify, url) {
    const meta = {
      schema: SCHEMA,
      version: VERSION,
      commit: COMMIT,
      blobSha1: BLOB_SHA1,
      bytes: verify.bytes,
      verifiedAt: new Date().toISOString(),
      sourceUrl: url,
    };
    try {
      localStorage.setItem(SRC_KEY, source);
      localStorage.setItem(META_KEY, JSON.stringify(meta));
      return { ok: true, meta };
    } catch (err) {
      return { ok: false, error: String(err?.message || err), meta };
    }
  }
  function clearCache() {
    try {
      localStorage.removeItem(SRC_KEY);
      localStorage.removeItem(META_KEY);
    } catch (_) {}
    LAST = null;
    return true;
  }
  async function fetchPinned() {
    let lastError = null;
    for (const url of URLS) {
      const controller = new AbortController(),
        timer = setTimeout(() => controller.abort(), 8000);
      try {
        const res = await fetch(url, {
          cache: "no-cache",
          credentials: "omit",
          signal: controller.signal,
        });
        if (!res.ok) throw new Error("HTTP " + res.status);
        const length = Number(res.headers.get("content-length"));
        if (length > EXPECTED_BYTES * 2) throw new Error("星历响应超过大小限制");
        const text = await res.text(),
          verify = await verifySource(text);
        if (!verify.ok) throw new Error("完整性验证失败：" + verify.reason);
        return { source: text, verify, url };
      } catch (error) {
        lastError = error;
      } finally {
        clearTimeout(timer);
      }
    }
    throw new Error("固定来源均不可用或完整性不匹配：" + String(lastError?.message || lastError));
  }
  async function cachePinned() {
    if (BUSY) return BUSY;
    BUSY = (async () => {
      const f = await fetchPinned(),
        w = writeCache(f.source, f.verify, f.url);
      if (!w.ok) throw new Error("源码已下载并验证，但浏览器本地存储失败：" + w.error);
      LAST = { action: "cache", ok: true, verify: f.verify, meta: w.meta };
      return clone(LAST);
    })().finally(() => (BUSY = null));
    return BUSY;
  }
  async function verifyCache() {
    const c = readCache();
    if (!c) {
      LAST = { action: "verify", ok: false, reason: "cache-missing" };
      return clone(LAST);
    }
    const v = await verifySource(c.source);
    if (!v.ok) {
      clearCache();
      LAST = { action: "verify", ok: false, reason: v.reason, verify: v };
      return clone(LAST);
    }
    LAST = { action: "verify", ok: true, verify: v, meta: c.meta };
    return clone(LAST);
  }
  async function evalVerified(text) {
    const v = await verifySource(text);
    if (!v.ok) throw new Error("拒绝执行未通过 Git blob 校验的星历源码：" + v.reason);
    if (apiReady()) return { ok: true, already: true, verify: v };
    (0, eval)(text + "\n//# sourceURL=astronomy-engine-2.1.19.vendor-v227.js");
    if (!apiReady()) throw new Error("固定源码已执行，但 Astronomy API 未建立");
    return { ok: true, already: false, verify: v };
  }
  async function load() {
    if (apiReady()) {
      LAST = { action: "load", ok: true, from: "already-loaded" };
      return true;
    }
    if (BUSY) {
      await BUSY;
      return apiReady() ? true : load();
    }
    BUSY = (async () => {
      const c = readCache();
      if (c) {
        const v = await verifySource(c.source);
        if (v.ok) {
          await evalVerified(c.source);
          LAST = {
            action: "load",
            ok: true,
            from: "verified-local-cache",
            verify: v,
            meta: c.meta,
          };
          return true;
        }
        clearCache();
      }
      const f = await fetchPinned(),
        w = writeCache(f.source, f.verify, f.url);
      if (!w.ok) console.warn("[V227 cache write]", w.error);
      await evalVerified(f.source);
      LAST = {
        action: "load",
        ok: true,
        from: w.ok ? "network+cache" : "network-memory-only",
        verify: f.verify,
        meta: w.meta,
      };
      return true;
    })().finally(() => (BUSY = null));
    return BUSY;
  }
  function status() {
    const c = readCache(),
      m = c?.meta || null;
    return {
      schema: SCHEMA,
      build: BUILD,
      version: VERSION,
      commit: COMMIT,
      expectedBlobSha1: BLOB_SHA1,
      expectedBytes: EXPECTED_BYTES,
      apiReady: apiReady(),
      cachePresent: !!c,
      cacheMeta: clone(m),
      last: clone(LAST),
      mode: window.TianjiQizhengAdoptionV226?.mode?.() || "legacy",
    };
  }
  function stateHTML() {
    const s = status(),
      c = s.cachePresent;
    return `<div class="q227-item ${c ? "good" : "warn"}"><b>${c ? "固定源码已保存到浏览器" : "尚未建立离线源码缓存"}</b><small>${c ? `版本 ${E(s.cacheMeta?.version || VERSION)} · ${E(s.cacheMeta?.verifiedAt || "—")}<br>以后即使网络不可用，七政 Engine 模式也会优先从本地已验证源码启动。` : "第一次需要联网下载固定版本；成功后会保存约 116 KB 源码。以后优先离线加载，不再依赖 CDN。"}</small><div class="q227-badges"><span class="q227-badge ${c ? "good" : "gold"}">${c ? "OFFLINE READY" : "BOOTSTRAP REQUIRED"}</span><span class="q227-badge cyan">Git blob verified</span><span class="q227-badge">2.1.19</span></div></div>`;
  }
  function metaHTML() {
    const s = status();
    return `<dl class="q227-meta"><dt>npm 版本</dt><dd>${VERSION}</dd><dt>Git commit</dt><dd class="q227-code">${COMMIT}</dd><dt>Git blob SHA-1</dt><dd class="q227-code">${BLOB_SHA1}</dd><dt>固定源码字节</dt><dd>${EXPECTED_BYTES.toLocaleString()} bytes</dd><dt>缓存状态</dt><dd>${s.cachePresent ? "present" : "missing"}</dd><dt>运行 API</dt><dd>${s.apiReady ? "ready" : "not loaded"}</dd><dt>七政模式</dt><dd>${E(s.mode)}</dd></dl>`;
  }
  function panel() {
    const s = status();
    return `<section class="q227" id="q227Vendor">
  <section class="q227-hero"><div class="q227-head"><div><h3>V227 · 七政星历离线缓存 / 固定源码完整性验证</h3><p>解决 V225–V226 仍依赖网络加载 Astronomy Engine 的最后一层工程问题。第一次联网时下载固定 2.1.19 构建，按 Git blob SHA-1 和字节长度做完整性验证后保存到浏览器；之后 Engine 模式优先从本地缓存启动。它不会进入首屏自动执行，也不会改变默认 Legacy。</p></div><span class="q227-schema">${SCHEMA}</span></div>
   <div class="q227-tools"><button class="primary" id="q227Cache" type="button">${s.cachePresent ? "重新验证 / 更新固定缓存" : "安装离线星历内核"}</button><button class="good" id="q227Load" type="button"${s.cachePresent || s.apiReady ? "" : " disabled"}>从离线内核加载</button><button id="q227Verify" type="button"${s.cachePresent ? "" : " disabled"}>验证缓存完整性</button><button class="danger" id="q227Clear" type="button"${s.cachePresent ? "" : " disabled"}>清除离线缓存</button></div>
  </section>
  <div class="q227-kpis">
   <div class="q227-kpi ${s.cachePresent ? "good" : "gold"}"><small>离线源码</small><b>${s.cachePresent ? "READY" : "MISSING"}</b></div>
   <div class="q227-kpi ${s.apiReady ? "good" : "cyan"}"><small>Astronomy API</small><b>${s.apiReady ? "LOADED" : "DEFERRED"}</b></div>
   <div class="q227-kpi good"><small>完整性</small><b>Git blob</b></div>
   <div class="q227-kpi cyan"><small>源码体积</small><b>116,485 B</b></div>
   <div class="q227-kpi"><small>首屏联网</small><b>NO</b></div>
   <div class="q227-kpi"><small>默认 Provider</small><b>LEGACY</b></div>
  </div>
  <div class="q227-grid">
   <section class="q227-card"><h4>离线状态</h4><div id="q227State">${stateHTML()}</div><div class="q227-note" style="margin-top:6px">这是“持久 vendor cache”，不是把第三方 116 KB 源码直接写死进 HTML。优点是主 HTML 不增大、不增加首屏解析成本，同时第一次安装后仍能离线运行。若浏览器清除站点数据，需要重新安装缓存。</div></section>
   <aside class="q227-card"><h4>固定构建身份</h4>${metaHTML()}</aside>
  </div>
  <section class="q227-card"><h4>完整性与回退策略</h4><div class="q227-list">
   <div class="q227-item good"><b>执行前必须完整性通过</b><small>浏览器重新计算 Git blob SHA-1：<span class="q227-code">${BLOB_SHA1}</span>，同时核对 ${EXPECTED_BYTES.toLocaleString()} 字节；任何不一致都会清除缓存并拒绝 eval。</small></div>
   <div class="q227-item cyan"><b>V225 / V226 自动复用</b><small>原“加载可靠星历”和“迁移门禁”已经改成优先调用 V227。缓存存在时不需要访问 CDN；缓存缺失时才联网 bootstrap。</small></div>
   <div class="q227-item warn"><b>存储失败不会破坏天机盘</b><small>如果浏览器禁止 localStorage，源码仍可当次联网加载；如果连网络也不可用，则 V226 继续自动回退 Tianji Legacy。</small></div>
  </div></section>
 </section>`;
  }
  function mount() {
    const pane = document.getElementById("pane-qizheng");
    if (!pane || !pane.classList.contains("on")) return;
    const anchor =
      pane.querySelector("#q226Adoption") ||
      pane.querySelector("#q225Ephemeris") ||
      pane.firstElementChild;
    const old = pane.querySelector("#q227Vendor"),
      tmp = document.createElement("div");
    tmp.innerHTML = panel();
    const fresh = tmp.firstElementChild;
    if (old) old.replaceWith(fresh);
    else if (anchor) anchor.insertAdjacentElement("beforebegin", fresh);
    else pane.appendChild(fresh);
  }
  document.addEventListener(
    "click",
    async (e) => {
      if (e.target?.id === "q227Cache") {
        const b = e.target;
        b.disabled = true;
        b.textContent = "下载并验证中…";
        try {
          await cachePinned();
          mount();
          try {
            toast("固定 Astronomy Engine 已验证并保存，可离线使用");
          } catch (_) {}
        } catch (err) {
          LAST = { action: "cache", ok: false, reason: String(err?.message || err) };
          mount();
          try {
            toast(String(err?.message || err));
          } catch (_) {}
        }
        return;
      }
      if (e.target?.id === "q227Load") {
        try {
          await load();
          mount();
          try {
            toast("已从固定星历内核建立 Astronomy API");
          } catch (_) {}
        } catch (err) {
          LAST = { action: "load", ok: false, reason: String(err?.message || err) };
          mount();
          try {
            toast(String(err?.message || err));
          } catch (_) {}
        }
        return;
      }
      if (e.target?.id === "q227Verify") {
        const r = await verifyCache();
        mount();
        try {
          toast(r.ok ? "离线缓存完整性通过" : "缓存验证失败，已清除");
        } catch (_) {}
        return;
      }
      if (e.target?.id === "q227Clear") {
        clearCache();
        mount();
        try {
          toast("已清除 Astronomy Engine 离线缓存");
        } catch (_) {}
        return;
      }
    },
    true,
  );

  TianjiPaneScheduler.register("qizheng", "v227-qizheng-vendor-js", mount);

  try {
    if (window.TianjiCore) {
      TianjiCore.registerSource({
        id: "astronomy-engine-v227-cache",
        type: "external-vendor-cache",
        title: "Astronomy Engine 2.1.19 verified persistent cache",
        version: COMMIT,
        license: "MIT",
        note: `Pinned browser build; expected Git blob ${BLOB_SHA1}; ${EXPECTED_BYTES} bytes; localStorage persistent source cache after first verified bootstrap.`,
      });
      TianjiCore.registerEngine(
        {
          id: "qizheng.vendor-cache.v1",
          system: "qizheng",
          name: "Qizheng Verified Vendor Cache",
          version: "1.0.0",
          source: "astronomy-engine-v227-cache",
          doctrine: "verify-before-eval; local cache first; network bootstrap only",
          status: "active",
        },
        () => status(),
      );
    }
  } catch (err) {
    console.warn("[V227 registry]", err);
  }

  const TASKS227 = [
    { id: "ai", p: "P0", name: "统一 AI 解释层", state: "done", note: "v171 完成" },
    { id: "mcp", p: "P0", name: "MCP / API 外部调用层", state: "done", note: "v172 完成" },
    {
      id: "kg",
      p: "P0",
      name: "典籍 Evidence / 规则知识图谱",
      state: "done",
      note: "v173 第一阶段；持续扩充奇门与四余证据链",
    },
    { id: "router", p: "P0", name: "自然语言问事路由", state: "done", note: "v196–v197 完成" },
    { id: "consumer", p: "P0", name: "统一消费者结果页 / 报告", state: "done", note: "v198 完成" },
    {
      id: "qimen-evidence",
      p: "P1",
      name: "奇门四家第三方对拍 / 高级 Evidence",
      state: "doing",
      note: "v221–v223 已完成外部 Golden / 第二参考 / 日家原典 60/60；剩余完整日家 Doctrine 与月家逐宫扩样。",
    },
    {
      id: "liuyao-depth",
      p: "P1",
      name: "六爻完整旺衰 / 卦格 / 应期层",
      state: "done",
      note: "v202 完成",
    },
    {
      id: "ziwei-depth",
      p: "P1",
      name: "紫微完整飞星体系",
      state: "done",
      note: "v203–v204 + V218/V219 稳定层",
    },
    {
      id: "qizheng",
      p: "P1",
      name: "七政四余核心化",
      state: "doing",
      note: "V224 Provider/许可决策；V225 双轨 Adapter；V226 可控接管；V227 增加固定 Astronomy Engine 2.1.19 源码的完整性验证 + 浏览器持久离线缓存，首次安装后 Engine 可离线启动。剩余核心问题已收缩为四余绝对历元、二十八宿宿界/历元、命身宫与庙旺化曜 Evidence。",
    },
    {
      id: "xk",
      p: "P1",
      name: "玄空完整宅盘",
      state: "done",
      note: "v205–v206 当前声明口径完成；外部逐盘 reference 可继续增强",
    },
    {
      id: "sanhe",
      p: "P1",
      name: "三合水法 Core",
      state: "done",
      note: "v207–v208 当前声明口径完成；外部逐盘 reference 可继续增强",
    },
    { id: "tz", p: "P2", name: "历史时区 / 夏令时自动校正", state: "done", note: "v209–v211 完成" },
    { id: "relation", p: "P2", name: "关系长期时间轴", state: "done", note: "v212–v213 完成" },
    { id: "report", p: "P2", name: "合参 Evidence 正式报告", state: "done", note: "v214 完成" },
  ];
  const BOARD227 = {
    schema: "tianji.priority.board.v1",
    build: BUILD,
    total: 14,
    done: 12,
    doing: 2,
    blocked: 0,
    progress: 92.9,
    next: [
      "V228 四余历元一期：罗睺/计都与月孛传统历元、现代轨道代理、历史金样分层",
      "二十八宿宿界 / 历元 Evidence 与边界版本化",
      "命宫 / 身宫 / 庙旺喜乐 / 化曜 Rule Pack",
      "奇门日家完整盘 / 月家逐宫扩样",
    ],
    tasks: TASKS227,
  };
  function applyBoard() {
    window.TianjiPriorityBoard = Object.freeze({
      schema: BOARD227.schema,
      snapshot: () => clone(BOARD227),
    });
    const road = window.TianjiRoadmap || {};
    window.TianjiRoadmap = Object.freeze(
      Object.assign({}, road, {
        urgentImportant: clone(BOARD227),
        nextMainline: clone(BOARD227.next),
      }),
    );
  }
  applyBoard();
  window.addEventListener("tianji:lazy-ready", () => setTimeout(applyBoard, 0));

  function selfTest() {
    const C = [],
      add = (id, ok, d = "") => C.push({ id, ok: !!ok, d });
    add(
      "identity",
      VERSION === "2.1.19" && COMMIT === "865d3da7d8112bbc7911238052c6af4aaf877181",
      COMMIT,
    );
    add("blob", BLOB_SHA1 === "fc5ab5c406c6fd64bdd537772e4cc7c8d438275b", BLOB_SHA1);
    add("bytes", EXPECTED_BYTES === 116485, String(EXPECTED_BYTES));
    add(
      "sha1.fallback",
      sha1Fallback(utf8("abc")) === "a9993e364706816aba3e25717850c26c9cd0d89d",
      "abc",
    );
    add("v225.integration", typeof window.TianjiQizhengEphemerisV225?.load === "function", "");
    add("v226.integration", typeof window.TianjiQizhengAdoptionV226?.gate === "function", "");
    return { ok: C.every((x) => x.ok), checks: C };
  }
  const TEST = selfTest();

  window.TianjiQizhengVendorV227 = Object.freeze({
    version: "1.0.0",
    build: BUILD,
    schema: SCHEMA,
    identity: () => ({
      version: VERSION,
      commit: COMMIT,
      blobSha1: BLOB_SHA1,
      bytes: EXPECTED_BYTES,
      urls: clone(URLS),
    }),
    status: () => clone(status()),
    cache: () => cachePinned(),
    verify: () => verifyCache(),
    load: () => load(),
    clear: () => clearCache(),
    selfTest: () => clone(TEST),
    manifest: () => ({
      module: "Qizheng Verified Offline Vendor Cache V227",
      provider: "Astronomy Engine 2.1.19",
      persistence: "localStorage source cache after first verified bootstrap",
      integrity: { gitBlobSha1: BLOB_SHA1, expectedBytes: EXPECTED_BYTES, verifyBeforeEval: true },
      startup: "no network / no eval on first paint",
      offline: "available after one successful cache installation",
      fallback: "V226 legacy fallback remains active",
      coreAdoption: "still explicit opt-in",
    }),
  });
  window.TianjiSystemV227 = {
    version: "v227",
    build: BUILD,
    qizhengOfflineVendorCache: true,
    offlineAfterBootstrap: true,
    qizhengDefaultProvider: "legacy",
    baseline: "v226",
  };
})();
