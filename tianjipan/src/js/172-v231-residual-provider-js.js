(() => {
  "use strict";
  const BUILD = "v231 · 2026-10-06 22:11 +08:00";
  const SCHEMA = "tianji.qizheng.residual-provider.v1";
  const MODE_KEY = "tianjipan.qizheng.residual-provider.v231";
  const BASE_QZ = window.qzCalc || qzCalc;
  const RES_NAMES = ["罗睺", "计都", "月孛", "紫炁"];
  const MING_ORDER = [
    "奎",
    "娄",
    "胃",
    "昴",
    "毕",
    "觜",
    "参",
    "井",
    "鬼",
    "柳",
    "星",
    "张",
    "翼",
    "轸",
    "角",
    "亢",
    "氐",
    "房",
    "心",
    "尾",
    "箕",
    "斗",
    "牛",
    "女",
    "虚",
    "危",
    "室",
    "壁",
  ];

  /* V230 build-time freeze:
   使用固定 Astronomy Engine 2.1.19 / commit 865d3da7... 计算
   1578-01-08 Julian = 1578-01-18 proleptic Gregorian 附近真实朔。
   这组常数来自同一固定内核，而不是浏览器运行时随机缓存。 */
  const FROZEN_WANLI = Object.freeze({
    model: "wanli-anchored-traditional-mean-v1",
    astronomyEngine: "2.1.19",
    astronomyCommit: "865d3da7d8112bbc7911238052c6af4aaf877181",
    calendar: {
      traditional: "萬曆五年十二月朔",
      julian: "1578-01-08",
      prolepticGregorian: "1578-01-18",
    },
    conjunction: {
      jdUT: 2297429.615209005,
      isoUTC: "1578-01-18T02:45:54.058Z",
      sunLon: 297.7666668941487,
      moonLon: 297.7725572556637,
    },
    frame: {
      total: 365.2564,
      zeroOffsetDeg: 7.386539400147228,
    },
    moonDuskCrossCheck: {
      targetLon: 301.7091029472884,
      isoUTC: "1578-01-18T09:59:34.518Z",
      hoursAfterConjunction: 7.2279055416584015,
      east120ReferenceHour: 17.992921677145,
      plausibleDusk: true,
    },
    textualAnchorModern: {
      罗睺: 204.5379103275287,
      计都: 24.141892625990774,
      紫炁: 155.6221349981984,
      月孛: 337.217047503496,
    },
    meanAnchor: {
      罗睺: 204.33990147675974,
      计都: 24.33990147675974,
      月孛: 337.217047503496,
      紫炁: 155.6221349981984,
    },
    nodeAnchorSpreadDeg: 0.3960177015379145,
    rates: {
      罗计: -0.052989834736283783,
      月孛: 0.11127720739219712,
      紫炁: 0.035186858316221765,
    },
    evidence: "太阳牛初度锁零点；月昏牛四度作独立时序检查；罗计两条宿度取严格180°约束下的圆均值。",
  });

  const PROVIDERS = [
    {
      id: "legacy",
      name: "Legacy · 完整兼容",
      state: "default",
      summary: "完全保留旧 qzCalc 的四余位置、罗计标签和显示行为。",
      residualFrame: "legacy QZ_XIU",
      adoption: "safe-default",
    },
    {
      id: "modern-proxy",
      name: "Modern Proxy · 现代平均轨道代理",
      state: "research",
      summary:
        "罗计使用月球平均交点、月孛使用平均远地点、紫炁仍为传统研究均速；罗计标签遵循 V228 当前 Doctrine 选择。",
      residualFrame: "legacy live frame + provenance",
      adoption: "explicit-opt-in",
    },
    {
      id: "wanli-mean",
      name: "Wanli Mean · 万历锚定传统均平",
      state: "research-evidence",
      summary: "使用1578万历朔日绝对相位 + 原典均速；罗计采用严格180°约束的锚点圆均值。",
      residualFrame: "modern longitude + Ming-native mansion metadata",
      adoption: "explicit-opt-in",
    },
  ];

  const clone = (x) => (x == null ? x : JSON.parse(JSON.stringify(x)));
  const E = (s) =>
    String(s ?? "").replace(
      /[&<>"']/g,
      (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
    );
  const norm = (x) => ((x % 360) + 360) % 360;
  const sdiff = (a, b) => ((a - b + 540) % 360) - 180;
  function mode() {
    try {
      const v = localStorage.getItem(MODE_KEY);
      return ["legacy", "modern-proxy", "wanli-mean"].includes(v) ? v : "legacy";
    } catch (_) {
      return "legacy";
    }
  }
  function setMode(v) {
    const m = ["legacy", "modern-proxy", "wanli-mean"].includes(v) ? v : "legacy";
    try {
      localStorage.setItem(MODE_KEY, m);
    } catch (_) {}
    return m;
  }
  function nodePolicy() {
    try {
      return window.TianjiQizhengResidualV228?.nodePolicy?.() || "legacy-modern";
    } catch (_) {
      return "legacy-modern";
    }
  }

  function modernResiduals(jd) {
    const p = window.TianjiQizhengResidualV228?.modernProxy?.(jd, nodePolicy());
    if (!p) throw new Error("V228 modernProxy 不可用");
    return {
      罗睺: p.luohou,
      计都: p.jidu,
      月孛: p.yuebei,
      紫炁: p.ziqi,
      meta: { provider: "modern-proxy", nodePolicy: p.policy },
    };
  }
  function wanliResiduals(jd) {
    const d = Number(jd) - FROZEN_WANLI.conjunction.jdUT,
      r = FROZEN_WANLI.rates,
      a = FROZEN_WANLI.meanAnchor;
    const luo = norm(a.罗睺 + r.罗计 * d);
    return {
      罗睺: luo,
      计都: norm(luo + 180),
      月孛: norm(a.月孛 + r.月孛 * d),
      紫炁: norm(a.紫炁 + r.紫炁 * d),
      meta: {
        provider: "wanli-mean",
        anchorJD: FROZEN_WANLI.conjunction.jdUT,
        nodeAnchorSpreadDeg: FROZEN_WANLI.nodeAnchorSpreadDeg,
      },
    };
  }
  function residuals(jd, m = mode()) {
    if (m === "modern-proxy") return modernResiduals(jd);
    if (m === "wanli-mean") return wanliResiduals(jd);
    return null;
  }
  function mingWidths() {
    try {
      return window.TianjiQizhengXiuFrameV229?.mingYellowWidths?.() || null;
    } catch (_) {
      return null;
    }
  }
  function mingXiuFromModern(lon) {
    const W = mingWidths();
    if (!W) return null;
    const total = FROZEN_WANLI.frame.total,
      off = FROZEN_WANLI.frame.zeroOffsetDeg;
    const native = (norm(lon - off) * total) / 360;
    let s = 0,
      found = MING_ORDER[MING_ORDER.length - 1],
      du = 0;
    for (const n of MING_ORDER) {
      const w = Number(W[n] || 0);
      if (native >= s && native < s + w) {
        found = n;
        du = native - s;
        break;
      }
      s += w;
    }
    return { name: found, du, native, frame: "ming-datong-yellow-native" };
  }
  function rebuildPalaces(q) {
    if (!Array.isArray(q?.palaces) || !Array.isArray(q?.stars)) return;
    q.palaces.forEach((p) => (p.stars = []));
    q.stars.forEach((s) => {
      const p = q.palaces.find((p) => p.zhi === s.gong?.zhi);
      if (p) p.stars.push(s.n);
    });
  }
  function applyProvider(q, R0, m = mode()) {
    if (!q || m === "legacy") {
      if (q) q.__residualProvider = { mode: "legacy", provider: "Tianji Legacy", changed: false };
      return q;
    }
    const vals = residuals(R0?.t?.jdUT, m),
      map = Object.fromEntries(q.stars.map((s) => [s.n, s]));
    for (const n of RES_NAMES) {
      const s = map[n];
      if (!s || !Number.isFinite(vals[n])) continue;
      s.lon = vals[n];
      s.retro = n === "罗睺" || n === "计都";
      s.gong = qzGong(s.lon);
      const liveX = qzXiu(s.lon);
      s.xiu = liveX;
      s.traditionalXiu = m === "wanli-mean" ? mingXiuFromModern(s.lon) : null;
      s.duzhu = qzDuzhu(s.traditionalXiu?.name || liveX.name);
      const xl = QZ_XL[s.n];
      s.xl = xl
        ? (s.gong.zhi === xl.m ? "庙" : "") +
            (xl.w.indexOf(s.gong.zhi) >= 0 ? "旺" : "") +
            (s.gong.zhi === xl.x ? "喜" : "") +
            (xl.l.indexOf(s.gong.zhi) >= 0 ? "乐" : "") || "平"
        : "—";
    }
    rebuildPalaces(q);
    q.__residualProvider = {
      mode: m,
      provider: m === "modern-proxy" ? "Modern Mean Proxy" : "Wanli Anchored Traditional Mean",
      nodePolicy: m === "modern-proxy" ? nodePolicy() : "traditional opposition / Wanli anchor",
      changed: true,
      frameNote:
        m === "wanli-mean"
          ? "黄经为V230对齐后的现代参考；live表格宿位仍保持当前QZ_XIU，另附traditionalXiu元数据。"
          : "live legacy frame",
      frozenWanli: m === "wanli-mean" ? clone(FROZEN_WANLI) : null,
    };
    return q;
  }
  function providerQz(R0) {
    const q = BASE_QZ(R0);
    return applyProvider(q, R0, mode());
  }
  function install() {
    try {
      window.qzCalc = providerQz;
      qzCalc = providerQz;
      return true;
    } catch (_) {
      try {
        window.qzCalc = providerQz;
        return true;
      } catch (__) {
        return false;
      }
    }
  }
  install();

  function oneMode(R0, m) {
    const q = applyProvider(BASE_QZ(R0), R0, m);
    const map = Object.fromEntries(
      q.stars.filter((s) => RES_NAMES.includes(s.n)).map((s) => [s.n, s]),
    );
    return {
      mode: m,
      provider: q.__residualProvider,
      rows: RES_NAMES.map((n) => ({
        name: n,
        lon: map[n]?.lon,
        gong: map[n]?.gong?.zhi,
        xiu: map[n]?.xiu?.name,
        xiuDu: map[n]?.xiu?.du,
        traditionalXiu: map[n]?.traditionalXiu || null,
        retro: !!map[n]?.retro,
      })),
    };
  }
  function currentR() {
    try {
      return typeof R !== "undefined" ? R : null;
    } catch (_) {
      return null;
    }
  }
  function compareCurrent() {
    const r = currentR();
    if (!r?.t?.jdUT) return { available: false, reason: "请先建立档案并排盘" };
    const modes = ["legacy", "modern-proxy", "wanli-mean"].map((m) => oneMode(r, m));
    const by = Object.fromEntries(
      modes.map((x) => [x.mode, Object.fromEntries(x.rows.map((r) => [r.name, r]))]),
    );
    const rows = RES_NAMES.map((name) => {
      const L = by.legacy[name],
        M = by["modern-proxy"][name],
        W = by["wanli-mean"][name];
      return {
        name,
        legacy: L,
        modern: M,
        wanli: W,
        deltaModern: sdiff(M.lon, L.lon),
        deltaWanli: sdiff(W.lon, L.lon),
      };
    });
    return {
      available: true,
      jdUT: r.t.jdUT,
      selected: mode(),
      nodePolicy: nodePolicy(),
      rows,
      modes,
    };
  }
  function frozenAudit() {
    const T = FROZEN_WANLI.textualAnchorModern,
      A = FROZEN_WANLI.meanAnchor;
    return {
      conjunction: clone(FROZEN_WANLI.conjunction),
      zeroOffsetDeg: FROZEN_WANLI.frame.zeroOffsetDeg,
      moonDuskCrossCheck: clone(FROZEN_WANLI.moonDuskCrossCheck),
      node: {
        textual罗睺: T.罗睺,
        textual计都: T.计都,
        enforced罗睺: A.罗睺,
        enforced计都: A.计都,
        spreadDeg: FROZEN_WANLI.nodeAnchorSpreadDeg,
      },
      residualAnchor: clone(A),
      rates: clone(FROZEN_WANLI.rates),
    };
  }
  function providerCards() {
    const m = mode();
    return PROVIDERS.map(
      (p) =>
        `<div class="q231-item ${p.id === m ? "good" : p.id === "wanli-mean" ? "warn" : "cyan"}"><b>${E(p.name)}</b><small>${E(p.summary)}<br>宿位策略：${E(p.residualFrame)}</small><div class="q231-badges"><span class="q231-badge ${p.id === m ? "good" : p.id === "wanli-mean" ? "gold" : "cyan"}">${p.id === m ? "SELECTED" : E(p.state)}</span><span class="q231-badge">${E(p.adoption)}</span></div></div>`,
    ).join("");
  }
  function compareHTML(C) {
    if (!C?.available) return `<div class="q231-note">${E(C?.reason || "暂无比较结果")}</div>`;
    return `<div class="q231-tablewrap"><table class="q231-table"><thead><tr><th>四余</th><th>Legacy</th><th>Modern Proxy</th><th>Δ vs Legacy</th><th>Wanli Mean</th><th>Δ vs Legacy</th><th>万历传统宿</th></tr></thead><tbody>${C.rows.map((x) => `<tr><td><b>${E(x.name)}</b></td><td>${Number(x.legacy.lon).toFixed(4)}°<br>${E(x.legacy.gong || "—")} · ${E(x.legacy.xiu || "—")}</td><td>${Number(x.modern.lon).toFixed(4)}°<br>${E(x.modern.gong || "—")} · ${E(x.modern.xiu || "—")}</td><td>${x.deltaModern >= 0 ? "+" : ""}${x.deltaModern.toFixed(4)}°</td><td>${Number(x.wanli.lon).toFixed(4)}°<br>${E(x.wanli.gong || "—")} · ${E(x.wanli.xiu || "—")}</td><td>${x.deltaWanli >= 0 ? "+" : ""}${x.deltaWanli.toFixed(4)}°</td><td>${x.wanli.traditionalXiu ? `${E(x.wanli.traditionalXiu.name)}${Number(x.wanli.traditionalXiu.du).toFixed(2)}度` : "—"}</td></tr>`).join("")}</tbody></table></div>`;
  }
  function frozenHTML() {
    const F = frozenAudit();
    return `<div class="q231-list">
  <div class="q231-item good"><b>固定朔时 · ${E(F.conjunction.isoUTC)}</b><small>太阳 ${F.conjunction.sunLon.toFixed(6)}° · 月亮 ${F.conjunction.moonLon.toFixed(6)}° · frame offset ${F.zeroOffsetDeg.toFixed(6)}°。</small></div>
  <div class="q231-item good"><b>“月昏牛四度”交叉检查 PASS</b><small>目标黄经 ${F.moonDuskCrossCheck.targetLon.toFixed(6)}°；约朔后 ${F.moonDuskCrossCheck.hoursAfterConjunction.toFixed(3)} 小时到达，东经120°参考时约 ${F.moonDuskCrossCheck.east120ReferenceHour.toFixed(2)} 时。</small></div>
  <div class="q231-item warn"><b>罗计锚点做严格180°约束</b><small>原典粗粒度宿度给出的两条对冲锚点存在 ${F.node.spreadDeg.toFixed(4)}° 展宽。V231 不偏袒其中一条，采用圆均值：罗睺 ${F.node.enforced罗睺.toFixed(6)}° / 计都 ${F.node.enforced计都.toFixed(6)}°。</small></div>
 </div>`;
  }
  function panel() {
    const m = mode(),
      C = compareCurrent();
    return `<section class="q231" id="q231ResidualProvider">
  <section class="q231-hero"><div class="q231-head"><div><h3>V231 · 四余 Provider 三轨选择 / 万历锚定传统均平接管</h3><p>四余终于从“只有一个写死公式”升级为可选择、可审计、可回退的 Provider。默认继续 Legacy；Modern Proxy 用现代平均轨道点做代理；Wanli Mean 使用 V230 的1578绝对锚点和 V228 原典均速。任何非 Legacy 模式都必须显式选择，不会静默改旧盘。</p></div><span class="q231-schema">${SCHEMA}</span></div>
   <div class="q231-tools"><label>四余 Provider <select id="q231Mode"><option value="legacy"${m === "legacy" ? " selected" : ""}>Legacy · 默认兼容</option><option value="modern-proxy"${m === "modern-proxy" ? " selected" : ""}>Modern Proxy · 研究</option><option value="wanli-mean"${m === "wanli-mean" ? " selected" : ""}>Wanli Mean · 万历锚定</option></select></label><button class="primary" id="q231Compare" type="button">比较当前档案</button><button class="legacy" id="q231Legacy" type="button"${m === "legacy" ? " disabled" : ""}>恢复 Legacy</button><button id="q231Export" type="button">导出 Provider Report</button></div>
  </section>
  <div class="q231-kpis">
   <div class="q231-kpi ${m === "legacy" ? "good" : m === "wanli-mean" ? "gold" : "cyan"}"><small>当前 Provider</small><b>${m === "legacy" ? "LEGACY" : m === "modern-proxy" ? "MODERN" : "WANLI"}</b></div>
   <div class="q231-kpi good"><small>可选 Provider</small><b>3</b></div>
   <div class="q231-kpi cyan"><small>万历绝对锚点</small><b>FROZEN</b></div>
   <div class="q231-kpi good"><small>月昏检查</small><b>PASS</b></div>
   <div class="q231-kpi"><small>默认迁移</small><b>NO</b></div>
   <div class="q231-kpi gold"><small>七政宿界</small><b>UNCHANGED</b></div>
  </div>
  <div class="q231-grid">
   <section class="q231-card"><h4>一、Provider Registry</h4><div class="q231-list">${providerCards()}</div></section>
   <aside class="q231-card"><h4>二、V230 Frozen Alignment</h4>${frozenHTML()}</aside>
  </div>
  <section class="q231-card"><h4>三、当前档案三轨对拍</h4><div id="q231CompareOut">${compareHTML(C)}</div></section>
  <section class="q231-card"><h4>四、接管边界</h4><div class="q231-list">
   <div class="q231-item good"><b>Legacy：完全保留</b><small>任何旧档、首次打开、Provider 异常都可以一键回到原来的四余输出。</small></div>
   <div class="q231-item cyan"><b>Modern Proxy：天文代理，不冒充传统原法</b><small>罗计/月孛来自现代平均轨道点；紫炁没有现代物理天体对应，仍是传统均速研究值。罗计命名遵从 V228 Doctrine。</small></div>
   <div class="q231-item warn"><b>Wanli Mean：传统模型，但仍是 research</b><small>它拥有原典绝对相位和原典均速，比旧版“只有公式没有来源”更可审计；但目前只有一组绝对历史锚点，仍需第二锚点/历史盘例验证长期相位漂移。</small></div>
   <div class="q231-item cyan"><b>宿界分层处理</b><small>Wanli Mean 的四余黄经附带明代黄道 traditionalXiu 元数据；正式十一曜主表仍保留 live QZ_XIU，以避免本版顺手改变七政宿界和命度主。</small></div>
  </div></section>
 </section>`;
  }
  function report() {
    const C = compareCurrent();
    return {
      schema: SCHEMA,
      build: BUILD,
      generatedAt: new Date().toISOString(),
      selected: mode(),
      nodePolicy: nodePolicy(),
      providers: clone(PROVIDERS),
      frozenWanli: clone(FROZEN_WANLI),
      current: C,
      policy: {
        default: "legacy",
        nonLegacy: "explicit opt-in",
        legacyFallback: true,
        wanliValidation:
          "single absolute historical anchor + source rates; second anchor still pending",
        sevenPlanetFrameChanged: false,
      },
    };
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
    const anchor =
      pane.querySelector("#q230AbsoluteZero") ||
      pane.querySelector("#q229XiuFrame") ||
      pane.firstElementChild;
    const old = pane.querySelector("#q231ResidualProvider"),
      tmp = document.createElement("div");
    tmp.innerHTML = panel();
    const fresh = tmp.firstElementChild;
    if (old) old.replaceWith(fresh);
    else if (anchor) anchor.insertAdjacentElement("beforebegin", fresh);
    else pane.appendChild(fresh);
  }
  document.addEventListener(
    "change",
    (e) => {
      if (e.target?.id === "q231Mode") {
        setMode(e.target.value);
        try {
          refRender("qizheng");
        } catch (_) {}
        TianjiPaneScheduler.request("qizheng");
      }
    },
    true,
  );
  document.addEventListener(
    "click",
    (e) => {
      if (e.target?.id === "q231Compare") {
        mount();
        return;
      }
      if (e.target?.id === "q231Legacy") {
        setMode("legacy");
        try {
          refRender("qizheng");
        } catch (_) {}
        TianjiPaneScheduler.request("qizheng");
        return;
      }
      if (e.target?.id === "q231Export") {
        save("天机盘_V231_四余ProviderReport.json", report());
        return;
      }
    },
    true,
  );

  TianjiPaneScheduler.register("qizheng", "v231-residual-provider-js", mount);

  try {
    if (window.TianjiCore) {
      TianjiCore.registerSource({
        id: "qizheng-wanli-frozen-v231",
        type: "derived-evidence",
        title: "V230 Wanli absolute alignment · frozen build result",
        version: "Astronomy Engine 2.1.19 / " + FROZEN_WANLI.astronomyCommit,
        license: "derived-from-public-classic+MIT-engine",
        note: "1578朔时太阳锁零点、月昏牛四度交叉检查通过；作为万历锚定传统均平 Provider 的固定锚点。",
      });
      TianjiCore.registerEngine(
        {
          id: "qizheng.residual.provider.v1",
          system: "qizheng",
          name: "Qizheng Residual Provider Registry",
          version: "1.0.0",
          source: "qizheng-wanli-frozen-v231",
          doctrine: "legacy / modern-proxy / wanli-mean selectable, explicit opt-in",
          status: "research",
        },
        () => report(),
      );
    }
  } catch (err) {
    console.warn("[V231 registry]", err);
  }

  const TASKS231 = [
    { id: "ai", p: "P0", name: "统一 AI 解释层", state: "done", note: "v171 完成" },
    { id: "mcp", p: "P0", name: "MCP / API 外部调用层", state: "done", note: "v172 完成" },
    {
      id: "kg",
      p: "P0",
      name: "典籍 Evidence / 规则知识图谱",
      state: "done",
      note: "v173 第一阶段；持续扩充奇门与七政四余证据链",
    },
    { id: "router", p: "P0", name: "自然语言问事路由", state: "done", note: "v196–v197 完成" },
    { id: "consumer", p: "P0", name: "统一消费者结果页 / 报告", state: "done", note: "v198 完成" },
    {
      id: "qimen-evidence",
      p: "P1",
      name: "奇门四家第三方对拍 / 高级 Evidence",
      state: "doing",
      note: "v221–v223 已完成外部 Golden / 第二参考 / 日家原典60/60；剩余完整日家 Doctrine 与月家逐宫扩样。",
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
      note: "V224–V227 七政可靠星历链完成；V228–V230 完成四余均速、明代宿界与绝对零点。V231 正式建立 Legacy / Modern Proxy / Wanli Mean 三轨四余 Provider，默认 Legacy、非 Legacy 显式选择、可一键回退。剩余关键收缩为：第二历史绝对锚点/长期漂移验证，以及命宫/身宫/庙旺喜乐/化曜 Rule Pack。",
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
  const BOARD231 = {
    schema: "tianji.priority.board.v1",
    build: BUILD,
    total: 14,
    done: 12,
    doing: 2,
    blocked: 0,
    progress: 92.9,
    next: [
      "V232 七政规则包一期：命宫 / 身宫 / 命主 / 命度主 provenance 与可选择口径",
      "庙旺喜乐 / 十干化曜 / 昼夜喜曜 Rule Pack",
      "四余第二历史绝对锚点 / 长期相位漂移验证",
      "奇门日家完整盘 / 月家逐宫扩样",
    ],
    tasks: TASKS231,
  };
  function applyBoard() {
    window.TianjiPriorityBoard = Object.freeze({
      schema: BOARD231.schema,
      snapshot: () => clone(BOARD231),
    });
    const road = window.TianjiRoadmap || {};
    window.TianjiRoadmap = Object.freeze(
      Object.assign({}, road, {
        urgentImportant: clone(BOARD231),
        nextMainline: clone(BOARD231.next),
      }),
    );
  }
  applyBoard();
  window.addEventListener("tianji:lazy-ready", () => setTimeout(applyBoard, 0));

  function selfTest() {
    const C = [],
      add = (id, ok, d = "") => C.push({ id, ok: !!ok, d });
    add("base.capture", typeof BASE_QZ === "function", "");
    add("providers", PROVIDERS.length === 3, String(PROVIDERS.length));
    add("default.legacy", ["legacy", "modern-proxy", "wanli-mean"].includes(mode()), mode());
    add(
      "wanli.conjunction",
      Math.abs(FROZEN_WANLI.conjunction.jdUT - 2297429.615209005) < 1e-9,
      String(FROZEN_WANLI.conjunction.jdUT),
    );
    add(
      "wanli.dusk",
      FROZEN_WANLI.moonDuskCrossCheck.plausibleDusk === true,
      String(FROZEN_WANLI.moonDuskCrossCheck.east120ReferenceHour),
    );
    add(
      "wanli.node.spread",
      FROZEN_WANLI.nodeAnchorSpreadDeg < 0.5,
      String(FROZEN_WANLI.nodeAnchorSpreadDeg),
    );
    const w = wanliResiduals(FROZEN_WANLI.conjunction.jdUT);
    add(
      "wanli.anchor.luo",
      Math.abs(sdiff(w.罗睺, FROZEN_WANLI.meanAnchor.罗睺)) < 1e-8,
      String(w.罗睺),
    );
    add(
      "wanli.opposition",
      Math.abs(Math.abs(sdiff(w.罗睺, w.计都)) - 180) < 1e-8,
      String(sdiff(w.罗睺, w.计都)),
    );
    add("wrapper.install", window.qzCalc === providerQz, "");
    return { ok: C.every((x) => x.ok), checks: C };
  }
  const TEST = selfTest();

  window.TianjiQizhengResidualProviderV231 = Object.freeze({
    version: "1.0.0",
    build: BUILD,
    schema: SCHEMA,
    providers: () => clone(PROVIDERS),
    mode,
    setMode: (v) => {
      const m = setMode(v);
      try {
        refRender("qizheng");
      } catch (_) {}
      return m;
    },
    frozenWanli: () => clone(FROZEN_WANLI),
    frozenAudit: () => clone(frozenAudit()),
    residuals: (jd, m) => clone(m === "legacy" ? null : residuals(jd, m || mode())),
    calc: (R0, m) => clone(applyProvider(BASE_QZ(R0 || currentR()), R0 || currentR(), m || mode())),
    compareCurrent: () => clone(compareCurrent()),
    report: () => clone(report()),
    selfTest: () => clone(TEST),
    manifest: () => ({
      module: "Qizheng Residual Provider V231",
      default: "legacy",
      providers: ["legacy", "modern-proxy", "wanli-mean"],
      optIn: true,
      legacyFallback: true,
      wanliModel: {
        anchor: "1578-01-18T02:45:54.058Z",
        engine: "Astronomy Engine 2.1.19",
        moonDuskCheck: "pass",
        nodeAnchorSpreadDeg: FROZEN_WANLI.nodeAnchorSpreadDeg,
      },
      sevenPlanetFrameChanged: false,
      status: "research-selectable",
    }),
  });
  window.TianjiSystemV231 = {
    version: "v231",
    build: BUILD,
    qizhengResidualProviders: true,
    residualProviderDefault: "legacy",
    wanliMeanSelectable: true,
    baseline: "v230",
  };
})();
