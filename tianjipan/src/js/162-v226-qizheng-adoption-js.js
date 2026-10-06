(() => {
  "use strict";
  const BUILD = "v226 · 2026-10-06 20:48 +08:00";
  const SCHEMA = "tianji.qizheng.adoption.v1";
  const MODE_KEY = "tianjipan.qizheng.ephemeris.mode.v226";
  const SANITY_LIMIT = 1.0; // 仅用于捕获时区/坐标系/单位级灾难性错误，不是“精度置信阈值”
  const LEGACY_QZ = window.qzCalc || qzCalc;
  const CACHE = new Map();
  let LAST_GATE = null,
    LAST_ERROR = null;

  const clone = (x) => (x == null ? x : JSON.parse(JSON.stringify(x)));
  const E = (s) =>
    String(s ?? "").replace(
      /[&<>"']/g,
      (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
    );
  const currentR = () => {
    try {
      return typeof R !== "undefined" ? R : null;
    } catch (_) {
      return null;
    }
  };
  function mode() {
    try {
      return localStorage.getItem(MODE_KEY) === "engine" ? "engine" : "legacy";
    } catch (_) {
      return "legacy";
    }
  }
  function setMode(v) {
    const m = v === "engine" ? "engine" : "legacy";
    try {
      localStorage.setItem(MODE_KEY, m);
    } catch (_) {}
    return m;
  }
  function loaded() {
    return !!window.TianjiQizhengEphemerisV225?.loaded?.();
  }

  async function ensureEngine() {
    if (loaded()) return true;
    const ephemeris = window.TianjiQizhengEphemerisV225;
    if (!ephemeris?.load) throw new Error("完整性校验星历加载器不可用");
    return ephemeris.load();
  }
  function sanity(jd) {
    const key = Number(jd).toFixed(6);
    if (CACHE.has(key)) return CACHE.get(key);
    const cmp = window.TianjiQizhengEphemerisV225.compare(Number(jd));
    const seven = Array.isArray(cmp?.seven) ? cmp.seven : [];
    const finite =
      seven.length === 7 &&
      seven.every(
        (x) =>
          Number.isFinite(x.legacy) && Number.isFinite(x.engine) && Number.isFinite(x.absDelta),
      );
    const catastrophic = finite ? seven.filter((x) => x.absDelta > SANITY_LIMIT) : seven;
    const result = {
      ok: finite && catastrophic.length === 0,
      finite,
      catastrophic: catastrophic.map((x) => ({ name: x.name, absDelta: x.absDelta })),
      compare: cmp,
    };
    CACHE.set(key, result);
    if (CACHE.size > 16) CACHE.delete(CACHE.keys().next().value);
    return result;
  }
  function gate(R0 = currentR()) {
    if (!loaded())
      return {
        state: "blocked",
        tone: "bad",
        label: "接管门禁未满足",
        canAdopt: false,
        reason: "Astronomy Engine 尚未加载。",
      };
    if (!R0?.t?.jdUT)
      return {
        state: "blocked",
        tone: "bad",
        label: "接管门禁未满足",
        canAdopt: false,
        reason: "当前档案没有 jdUT；请先完成推演。",
      };
    let s;
    try {
      s = sanity(R0.t.jdUT);
    } catch (err) {
      return {
        state: "blocked",
        tone: "bad",
        label: "接管门禁异常",
        canAdopt: false,
        reason: String(err?.message || err),
      };
    }
    if (!s.ok)
      return {
        state: "blocked",
        tone: "bad",
        label: "接管门禁阻塞",
        canAdopt: false,
        reason: `发现超过 ${SANITY_LIMIT}° 的灾难性差异或数据不完整；禁止接管。`,
        detail: s,
      };
    const sum = s.compare.summary || {},
      struct = (sum.structural || 0) > 0;
    return struct
      ? {
          state: "migration-required",
          tone: "warn",
          label: "需要迁移确认",
          canAdopt: true,
          reason: `天文数据完整且无灾难性差异，但有 ${sum.structural} 项宫/宿/逆行结构变化。允许显式迁移，不自动切换。`,
          detail: s,
        }
      : {
          state: "ready",
          tone: "good",
          label: "可以可控接管",
          canAdopt: true,
          reason: `七政双轨完整；最大经度差 ${Number(sum.maxAbs || 0).toFixed(4)}°，当前没有宫/宿/逆行结构变化。`,
          detail: s,
        };
  }
  function engineR(R0) {
    const planets = window.TianjiQizhengEphemerisV225.planets(R0.t.jdUT);
    return Object.assign({}, R0, { astro: Object.assign({}, R0.astro || {}, { planets }) });
  }
  function adoptedQz(R0) {
    if (mode() !== "engine") return LEGACY_QZ(R0);
    if (!loaded()) {
      const q = LEGACY_QZ(R0);
      q.__ephemeris = {
        provider: "legacy",
        mode: "engine-requested-fallback",
        reason: "engine-not-loaded",
      };
      return q;
    }
    try {
      const s = sanity(R0?.t?.jdUT);
      if (!s.ok) {
        const q = LEGACY_QZ(R0);
        q.__ephemeris = {
          provider: "legacy",
          mode: "engine-blocked-fallback",
          reason: "sanity-gate",
        };
        return q;
      }
      const q = LEGACY_QZ(engineR(R0));
      q.__ephemeris = {
        provider: "Astronomy Engine 2.1.19",
        mode: "engine",
        maxAbs: s.compare?.summary?.maxAbs ?? null,
        structural: s.compare?.summary?.structural ?? null,
        migrated: true,
      };
      return q;
    } catch (err) {
      LAST_ERROR = String(err?.message || err);
      const q = LEGACY_QZ(R0);
      q.__ephemeris = { provider: "legacy", mode: "engine-error-fallback", reason: LAST_ERROR };
      return q;
    }
  }
  function installWrapper() {
    try {
      window.qzCalc = adoptedQz;
      qzCalc = adoptedQz;
      return true;
    } catch (_) {
      try {
        window.qzCalc = adoptedQz;
        return true;
      } catch (__) {
        return false;
      }
    }
  }
  installWrapper();

  async function ensureIfAdopted() {
    if (mode() !== "engine" || loaded()) return;
    try {
      await ensureEngine();
      try {
        refRender("qizheng");
      } catch (_) {}
    } catch (err) {
      LAST_ERROR = String(err?.message || err);
      mount();
    }
  }
  function gateHTML(G) {
    if (!G)
      return '<div class="q226-gate cyan"><strong>尚未运行当前档案迁移门禁</strong><small>加载可靠星历并运行门禁后，才会开放接管按钮。</small></div>';
    return `<div class="q226-gate ${G.tone}"><strong>${E(G.label)}</strong><small>${E(G.reason)}</small></div>`;
  }
  function detailsHTML(G) {
    if (!G?.detail?.compare?.seven)
      return '<div class="q226-note">暂无当前档案七政差异明细。</div>';
    return `<div class="q226-tablewrap"><table class="q226-table"><thead><tr><th>七政</th><th>Legacy</th><th>Engine</th><th>Δ</th><th>结构影响</th></tr></thead><tbody>${G.detail.compare.seven.map((r) => `<tr><td><b>${E(r.name)}</b></td><td>${Number(r.legacy).toFixed(4)}°</td><td>${Number(r.engine).toFixed(4)}°</td><td>${Number(r.delta) >= 0 ? "+" : ""}${Number(r.delta).toFixed(4)}°</td><td>${r.gongChanged ? '<span class="q226-state bad">宫变</span>' : '<span class="q226-state good">宫同</span>'} ${r.xiuChanged ? '<span class="q226-state bad">宿变</span>' : '<span class="q226-state good">宿同</span>'} ${r.retroChanged ? '<span class="q226-state bad">逆行变</span>' : ""} ${r.boundarySensitive ? '<span class="q226-state warn">边界敏感</span>' : ""}</td></tr>`).join("")}</tbody></table></div>`;
  }
  function panel() {
    const m = mode(),
      G = LAST_GATE,
      on = loaded();
    return `<section class="q226" id="q226Adoption">
  <section class="q226-hero"><div class="q226-head"><div><h3>V226 · 七政星历可控接管 / 迁移门禁</h3><p>把 V225 的双轨审计升级为真正可切换的 Provider，但默认仍保持 Legacy。只有当前档案通过完整性与坐标系 sanity gate 后，接管按钮才开放；若发生宫界、宿界或逆行结构变化，则标记 migration-required，必须由用户显式确认。任何加载/运行异常都会自动回退 Legacy。</p></div><span class="q226-schema">${SCHEMA}</span></div>
   <div class="q226-tools"><button class="primary" id="q226Load" type="button">${on ? "可靠星历已加载" : "加载可靠星历"}</button><button id="q226Gate" type="button"${on ? "" : " disabled"}>运行当前档案门禁</button><button class="adopt" id="q226Adopt" type="button"${G?.canAdopt ? "" : " disabled"}>${G?.state === "migration-required" ? "确认结构变化并接管" : "采用 Astronomy Engine"}</button><button class="legacy" id="q226Legacy" type="button"${m === "legacy" ? " disabled" : ""}>回到 Legacy</button><button id="q226Export" type="button"${G ? "" : " disabled"}>导出迁移报告</button></div>
  </section>
  <div class="q226-kpis">
   <div class="q226-kpi ${m === "engine" ? "good" : "gold"}"><small>当前七政 Provider</small><b>${m === "engine" ? "ENGINE" : "LEGACY"}</b></div>
   <div class="q226-kpi ${on ? "good" : "gold"}"><small>Engine</small><b>${on ? "READY" : "DEFERRED"}</b></div>
   <div class="q226-kpi cyan"><small>接管模式</small><b>显式 opt-in</b></div>
   <div class="q226-kpi"><small>Sanity Hard Gate</small><b>${SANITY_LIMIT.toFixed(1)}°</b></div>
   <div class="q226-kpi"><small>四余</small><b>不变</b></div>
   <div class="q226-kpi ${G?.state === "blocked" ? "bad" : G?.state === "migration-required" ? "gold" : G?.state === "ready" ? "good" : "cyan"}"><small>迁移状态</small><b>${G ? G.state : "NOT RUN"}</b></div>
  </div>
  <div class="q226-grid">
   <section class="q226-card"><h4>当前迁移门禁</h4><div id="q226GateOut">${gateHTML(G)}</div><div class="q226-note" style="margin-top:6px">1° 仅是工程 sanity 上限，用来拦截时区、参考系、单位等灾难性错误，不表示“1°以内都同样准确”。真正的迁移影响仍以宫界、宿界、逆行变化和 Evidence 为准。</div></section>
   <aside class="q226-card"><h4>故障回退策略</h4><div class="q226-list">
    <div class="q226-item good"><b>默认永远 Legacy</b><small>新文件首次打开不会自动改变七政结果。</small></div>
    <div class="q226-item cyan"><b>选择 Engine 后才持久化</b><small>只保存 provider 模式，不保存账号 token、设备 ID 或报告内容。</small></div>
    <div class="q226-item warn"><b>Engine 不可用即自动降级</b><small>CDN 与 GitHub raw 都失败、或 regression sanity 异常时，qzCalc 自动使用旧内核，并在返回对象记录 fallback 原因。</small></div>
   </div></aside>
  </div>
  <section class="q226-card"><h4>当前档案差异</h4><div id="q226Details">${detailsHTML(G)}</div></section>
  <section class="q226-card"><h4>迁移政策</h4><div class="q226-list">
   <div class="q226-item good"><b>ready</b><small>七政完整、无灾难性差异、当前盘没有宫/宿/逆行结构变化；可以直接显式接管。</small></div>
   <div class="q226-item warn"><b>migration-required</b><small>经度差仍在工程合理范围，但结果跨越当前宫界、宿界或逆行判定。允许接管，但必须明确把它视为“算法迁移”，不能伪装成无变化升级。</small></div>
   <div class="q226-item bad"><b>blocked</b><small>Provider 缺失、数据不完整或任何七政差异超过 ${SANITY_LIMIT.toFixed(1)}°。这种情况禁止接管并回退 Legacy。</small></div>
  </div></section>
 </section>`;
  }
  function save(name, obj) {
    const blob = new Blob([JSON.stringify(obj, null, 2)], {
        type: "application/json;charset=utf-8",
      }),
      url = URL.createObjectURL(blob),
      a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1600);
  }
  function mount() {
    const pane = document.getElementById("pane-qizheng");
    if (!pane || !pane.classList.contains("on")) return;
    const anchor = pane.querySelector("#q225Ephemeris") || pane.firstElementChild;
    const old = pane.querySelector("#q226Adoption"),
      tmp = document.createElement("div");
    tmp.innerHTML = panel();
    const fresh = tmp.firstElementChild;
    if (old) old.replaceWith(fresh);
    else if (anchor) anchor.insertAdjacentElement("beforebegin", fresh);
    else pane.appendChild(fresh);
    ensureIfAdopted();
  }
  document.addEventListener(
    "click",
    async (e) => {
      if (e.target?.id === "q226Load") {
        const b = e.target;
        b.disabled = true;
        b.textContent = "加载中…";
        try {
          await ensureEngine();
          LAST_ERROR = null;
          mount();
          try {
            toast("可靠星历已加载");
          } catch (_) {}
        } catch (err) {
          LAST_ERROR = String(err?.message || err);
          mount();
          try {
            toast(LAST_ERROR);
          } catch (_) {}
        }
        return;
      }
      if (e.target?.id === "q226Gate") {
        try {
          LAST_GATE = gate();
          mount();
        } catch (err) {
          LAST_GATE = {
            state: "blocked",
            tone: "bad",
            label: "迁移门禁异常",
            canAdopt: false,
            reason: String(err?.message || err),
          };
          mount();
        }
        return;
      }
      if (e.target?.id === "q226Adopt") {
        const G = LAST_GATE || gate();
        if (!G.canAdopt) {
          try {
            toast("当前迁移门禁未通过，禁止接管");
          } catch (_) {}
          return;
        }
        setMode("engine");
        CACHE.clear();
        try {
          refRender("qizheng");
        } catch (_) {}
        TianjiPaneScheduler.request("qizheng");
        try {
          toast(
            G.state === "migration-required"
              ? "已确认结构变化，七政切换到 Astronomy Engine"
              : "七政已切换到 Astronomy Engine",
          );
        } catch (_) {}
        return;
      }
      if (e.target?.id === "q226Legacy") {
        setMode("legacy");
        CACHE.clear();
        LAST_GATE = null;
        try {
          refRender("qizheng");
        } catch (_) {}
        TianjiPaneScheduler.request("qizheng");
        try {
          toast("七政已恢复 Legacy Provider");
        } catch (_) {}
        return;
      }
      if (e.target?.id === "q226Export") {
        save("天机盘_V226_七政星历迁移报告.json", {
          schema: SCHEMA,
          build: BUILD,
          mode: mode(),
          gate: clone(LAST_GATE),
          engine: window.TianjiQizhengEphemerisV225?.engine?.() || null,
          lastError: LAST_ERROR,
          policy: {
            sanityLimitDeg: SANITY_LIMIT,
            default: "legacy",
            structuralChange: "migration-required",
            failure: "legacy-fallback",
          },
          foundation: window.TianjiQizhengFoundationV224?.report?.() || null,
        });
        return;
      }
    },
    true,
  );

  TianjiPaneScheduler.register("qizheng", "v226-qizheng-adoption-js", mount);

  try {
    if (window.TianjiCore) {
      TianjiCore.registerRule({
        id: "qizheng.ephemeris.adoption.gate.v1",
        system: "qizheng",
        source: "astronomy-engine-2.1.19",
        title: "七政星历可控接管门禁",
        status: "active",
        note: "默认 legacy；显式 opt-in；结构变化标 migration-required；>1° sanity 异常阻塞并 fallback。",
      });
      TianjiCore.registerEngine(
        {
          id: "qizheng.ephemeris.adoption.v1",
          system: "qizheng",
          name: "Qizheng Controlled Ephemeris Adoption",
          version: "1.0.0",
          source: "astronomy-engine-2.1.19",
          doctrine: "explicit opt-in + runtime gate + legacy fallback",
          status: "research",
        },
        () => ({ mode: mode(), gate: clone(LAST_GATE), error: LAST_ERROR }),
      );
    }
  } catch (err) {
    console.warn("[V226 registry]", err);
  }

  const TASKS226 = [
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
      note: "V224 完成前置决策；V225 完成双轨 Provider；V226 完成可控接管与自动 Legacy fallback。首次打开仍为 Legacy，必须运行当前档案门禁后显式采用 Astronomy Engine。下一步：运行真实迁移门禁、vendor 固定星历到单 HTML、继续四余历元 / 宿界 / 命身宫 Evidence。",
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
  const BOARD226 = {
    schema: "tianji.priority.board.v1",
    build: BUILD,
    total: 14,
    done: 12,
    doing: 2,
    blocked: 0,
    progress: 92.9,
    next: [
      "在真实浏览器运行 V226 当前档案迁移门禁，并明确 ready / migration-required / blocked",
      "V227 星历内核离线化：固定 Astronomy Engine 构建 vendor 到单 HTML",
      "四余绝对历元 / 二十八宿宿界 / 命身宫 Evidence",
      "奇门日家完整盘 / 月家逐宫扩样",
    ],
    tasks: TASKS226,
  };
  function applyBoard() {
    window.TianjiPriorityBoard = Object.freeze({
      schema: BOARD226.schema,
      snapshot: () => clone(BOARD226),
    });
    const road = window.TianjiRoadmap || {};
    window.TianjiRoadmap = Object.freeze(
      Object.assign({}, road, {
        urgentImportant: clone(BOARD226),
        nextMainline: clone(BOARD226.next),
      }),
    );
  }
  applyBoard();
  window.addEventListener("tianji:lazy-ready", () => setTimeout(applyBoard, 0));

  function selfTest() {
    const C = [],
      add = (id, ok, d = "") => C.push({ id, ok: !!ok, d });
    add("legacy.capture", typeof LEGACY_QZ === "function", "");
    add("wrapper.install", window.qzCalc === adoptedQz, "");
    add(
      "default.legacy",
      !localStorage.getItem(MODE_KEY) || ["legacy", "engine"].includes(mode()),
      mode(),
    );
    add("sanity.limit", SANITY_LIMIT === 1, String(SANITY_LIMIT));
    add(
      "v225.api",
      typeof window.TianjiQizhengEphemerisV225?.compare === "function" &&
        typeof window.TianjiQizhengEphemerisV225?.planets === "function",
      "",
    );
    add("verified-loader.policy", typeof ensureEngine === "function", "");
    return { ok: C.every((x) => x.ok), checks: C };
  }
  const TEST = selfTest();

  window.TianjiQizhengAdoptionV226 = Object.freeze({
    version: "1.0.0",
    build: BUILD,
    schema: SCHEMA,
    mode,
    setMode: (v) => {
      const m = setMode(v);
      CACHE.clear();
      return m;
    },
    load: () => ensureEngine(),
    gate: (r) => clone(gate(r || currentR())),
    adopt: () => {
      const G = gate();
      if (!G.canAdopt) throw new Error(G.reason);
      setMode("engine");
      CACHE.clear();
      return clone(G);
    },
    legacy: () => {
      setMode("legacy");
      CACHE.clear();
      return true;
    },
    currentProvider: () => (mode() === "engine" ? "Astronomy Engine 2.1.19" : "Tianji Legacy"),
    lastGate: () => clone(LAST_GATE),
    lastError: () => LAST_ERROR,
    selfTest: () => clone(TEST),
    manifest: () => ({
      module: "Qizheng Controlled Adoption V226",
      defaultProvider: "Tianji Legacy",
      optionalProvider: "Astronomy Engine 2.1.19",
      adoption: "explicit opt-in only",
      gate: {
        hardSanityDeg: SANITY_LIMIT,
        structuralChange: "migration-required",
        providerFailure: "legacy-fallback",
      },
      residualsChanged: false,
      coreStatus: "migration-capable, not globally frozen as new default",
    }),
  });
  window.TianjiSystemV226 = {
    version: "v226",
    build: BUILD,
    qizhengControlledAdoption: true,
    qizhengDefaultProvider: "legacy",
    engineOptIn: true,
    baseline: "v225",
  };
})();
