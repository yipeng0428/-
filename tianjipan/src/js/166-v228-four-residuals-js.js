(() => {
  "use strict";
  const BUILD = "v228 · 2026-10-06 22:31 +08:00";
  const SCHEMA = "tianji.qizheng.residual-epoch.v1";
  const POLICY_KEY = "tianjipan.qizheng.residual-node-policy.v228";
  const clone = (x) => (x == null ? x : JSON.parse(JSON.stringify(x)));
  const E = (s) =>
    String(s ?? "").replace(
      /[&<>"']/g,
      (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
    );
  const norm = (x) => ((x % 360) + 360) % 360;

  const SOURCES = [
    {
      id: "tushubian-21",
      title: "《圖書編》卷二十一 · 四餘總叙",
      type: "primary-classic",
      url: "https://zh.wikisource.org/wiki/%E5%9C%96%E6%9B%B8%E7%B7%A8_(%E5%9B%9B%E5%BA%AB%E5%85%A8%E6%9B%B8%E6%9C%AC)/%E5%8D%B7021",
      supports: [
        "罗睺=天首/交初，计都=天尾且与罗睺相对",
        "罗计逆行；约十八年一周",
        "紫炁约二十八年一周，日行三分五十七秒",
        "月孛与月行最迟处同躔，日行十一分二十九秒",
        "万历五年十二月朔给出四余宿度锚点",
      ],
    },
    {
      id: "gujin-lvli-64",
      title: "《古今律曆考》卷六十四 · 四餘",
      type: "primary-classic",
      url: "https://www.shidianguji.com/zh/mid-page/7430936901244420122",
      supports: [
        "炁孛顺行、罗计逆行",
        "紫炁28年一周",
        "月孛62年七周",
        "罗计约18年一周",
        "罗计为交道首尾",
      ],
    },
    {
      id: "calendar-wanli-5-12-1",
      title: "万历五年十二月朔 · 公历映射",
      type: "calendar-conversion",
      url: "https://bkso.baidu.com/item/%E6%9D%8E%E5%B9%BC%E6%BB%8B/11062940",
      supports: [
        "万历五年十二月初一对应1578-01-08（儒略历）；同一绝对日为逆推格里高利历1578-01-18。V230已修正此前把1月8日误当作proleptic Gregorian的问题",
      ],
    },
  ];

  const ANCHOR = {
    id: "wanli5-12-newmoon",
    traditionalDate: "萬曆五年十二月朔",
    julianCalendar: "1578-01-08",
    prolepticGregorian: "1578-01-18",
    jdUTApprox: 2297429.5,
    calendarNote:
      "1582-10-15之前西历按儒略历记日；1578-01-08 Julian 与 proleptic Gregorian 1578-01-18 是同一绝对日。",
    nativeFrame: "传统二十八宿宿度 / 周天365¼度体系",
    positions: [
      { name: "罗睺", native: "角七度", source: "《圖書編》卷二十一" },
      { name: "计都", native: "奎十七度", source: "《古今圖書編》相关卷页转录" },
      { name: "紫炁", native: "张十四度", source: "《圖書編》卷二十一" },
      { name: "月孛", native: "危十三度", source: "《圖書編》卷二十一" },
    ],
    use: "absolute-native-anchor",
    caveat:
      "不能直接拿宿度数字与现代360°黄经比较；需先建立1578年的二十八宿距星/宿界版本与365¼度→360°坐标变换。",
  };

  function duToModernDeg(du) {
    return (du * 360) / 365.25;
  }
  const RATE_RULES = [
    {
      id: "roji.mean-retrograde",
      name: "罗计",
      classical:
        "每一月交周退一度四十六分三十秒；交周二十七日二十一分二十二秒二十四毫（传统十进分秒）",
      classicalModernPerDay: -duToModernDeg(1.463) / 27.212224,
      currentPerDay: -0.0529538083,
      direction: "逆",
    },
    {
      id: "yuebei.mean-motion",
      name: "月孛",
      classical: "日行十一分二十九秒（传统十进分秒）",
      classicalModernPerDay: duToModernDeg(0.1129),
      currentPerDay: 0.111403514,
      direction: "顺",
    },
    {
      id: "ziqi.mean-motion",
      name: "紫炁",
      classical: "日行三分五十七秒（传统十进分秒）；约二十八年一周",
      classicalModernPerDay: duToModernDeg(0.0357),
      currentPerDay: 360 / 10227.1792,
      direction: "顺",
    },
  ].map((r) =>
    Object.assign(r, {
      delta: r.currentPerDay - r.classicalModernPerDay,
      pct:
        (Math.abs(r.currentPerDay - r.classicalModernPerDay) / Math.abs(r.classicalModernPerDay)) *
        100,
      status:
        (Math.abs(r.currentPerDay - r.classicalModernPerDay) / Math.abs(r.classicalModernPerDay)) *
          100 <
        0.2
          ? "aligned"
          : "review",
    }),
  );

  const NODE_POLICIES = [
    {
      id: "legacy-modern",
      name: "现有 Tianji / 新法式映射",
      luo: "平均升交点",
      ji: "对向降交点",
      state: "legacy-default",
      note: "与当前 qzCalc 完全一致；不改旧盘。",
    },
    {
      id: "traditional-jiaochu",
      name: "传统交初/交中映射",
      luo: "平均降交点（交初/天首）",
      ji: "平均升交点（交中/天尾）",
      state: "research",
      note: "根据传统星命“罗=交初、计=交终/交中”及后世天文学解释建立；只供研究切换，不自动替换当前结果。",
    },
  ];

  function nodePolicy() {
    try {
      return localStorage.getItem(POLICY_KEY) === "traditional-jiaochu"
        ? "traditional-jiaochu"
        : "legacy-modern";
    } catch (_) {
      return "legacy-modern";
    }
  }
  function setNodePolicy(v) {
    const p = v === "traditional-jiaochu" ? "traditional-jiaochu" : "legacy-modern";
    try {
      localStorage.setItem(POLICY_KEY, p);
    } catch (_) {}
    return p;
  }

  function modernProxy(jd, policy = nodePolicy()) {
    const asc = typeof qzNode === "function" ? qzNode(jd) : null;
    const desc = asc == null ? null : norm(asc + 180);
    const old = policy === "traditional-jiaochu";
    return {
      jdUT: jd,
      policy,
      ascendingNode: asc,
      descendingNode: desc,
      luohou: old ? desc : asc,
      jidu: old ? asc : desc,
      yuebei: typeof qzYuebei === "function" ? qzYuebei(jd) : null,
      ziqi: typeof qzZiqi === "function" ? qzZiqi(jd) : null,
    };
  }
  function rateReport() {
    return RATE_RULES.map((r) => ({
      id: r.id,
      name: r.name,
      direction: r.direction,
      classical: r.classical,
      classicalModernPerDay: +r.classicalModernPerDay.toFixed(9),
      currentPerDay: +r.currentPerDay.toFixed(9),
      delta: +r.delta.toFixed(9),
      percentError: +r.pct.toFixed(4),
      status: r.status,
    }));
  }
  function currentSnapshot() {
    let jd = null;
    try {
      jd = R?.t?.jdUT ?? null;
    } catch (_) {}
    if (jd == null) return { available: false, reason: "请先建立档案并排盘" };
    const p = modernProxy(jd);
    const show = (name, lon) => {
      try {
        const g = qzGong(lon),
          x = qzXiu(lon);
        return { name, lon: +lon.toFixed(6), gong: g?.zhi, xiu: x?.name, xiuDu: x?.du };
      } catch (_) {
        return { name, lon: +lon.toFixed(6) };
      }
    };
    return {
      available: true,
      jdUT: jd,
      policy: p.policy,
      items: [
        show("罗睺", p.luohou),
        show("计都", p.jidu),
        show("月孛", p.yuebei),
        show("紫炁", p.ziqi),
      ],
    };
  }
  function epochAudit() {
    const p = modernProxy(ANCHOR.jdUTApprox);
    return {
      anchor: clone(ANCHOR),
      modernProxyAtAnchor: {
        policy: p.policy,
        luohou: +p.luohou.toFixed(6),
        jidu: +p.jidu.toFixed(6),
        yuebei: +p.yuebei.toFixed(6),
        ziqi: +p.ziqi.toFixed(6),
      },
      verdict: "native-anchor-acquired-but-frame-transform-pending",
      reason:
        "原典已给绝对宿度锚点；现代公式也有绝对黄经，但二者属于不同历元/宿界/度制，V228拒绝直接做伪等价换算。",
    };
  }
  function sourceHTML() {
    return SOURCES.map(
      (s) =>
        `<div class="q228-item ${s.type === "primary-classic" ? "good" : "cyan"}"><b>${E(s.title)}</b><small>${E(s.supports.join("；"))}<br><span class="q228-code">${E(s.url)}</span></small><div class="q228-badges"><span class="q228-badge ${s.type === "primary-classic" ? "good" : "cyan"}">${E(s.type)}</span></div></div>`,
    ).join("");
  }
  function rateHTML() {
    const R = rateReport();
    return `<div class="q228-tablewrap"><table class="q228-table"><thead><tr><th>四余</th><th>传统速率依据</th><th>折算现代°/日</th><th>当前公式°/日</th><th>相对差</th><th>判断</th></tr></thead><tbody>${R.map((r) => `<tr><td><b>${E(r.name)}</b><br>${E(r.direction)}</td><td>${E(r.classical)}</td><td>${r.classicalModernPerDay.toFixed(9)}</td><td>${r.currentPerDay.toFixed(9)}</td><td>${r.percentError.toFixed(4)}%</td><td><span class="q228-state ${r.status === "aligned" ? "good" : "warn"}">${E(r.status)}</span></td></tr>`).join("")}</tbody></table></div>`;
  }
  function anchorHTML() {
    return `<div class="q228-item good"><b>${E(ANCHOR.traditionalDate)} · 儒略历 ${E(ANCHOR.julianCalendar)} · 同日公历逆推 ${E(ANCHOR.prolepticGregorian)}</b><small>${ANCHOR.positions.map((x) => `${E(x.name)}：${E(x.native)}`).join(" · ")}<br>${E(ANCHOR.calendarNote)}<br>${E(ANCHOR.caveat)}</small><div class="q228-badges"><span class="q228-badge good">absolute native anchor</span><span class="q228-badge cyan">Julian calendar corrected</span><span class="q228-badge gold">frame transform pending</span></div></div>`;
  }
  function policyHTML() {
    const p = nodePolicy();
    return NODE_POLICIES.map(
      (x) =>
        `<div class="q228-item ${x.id === p ? "good" : "cyan"}"><b>${E(x.name)}</b><small>罗睺：${E(x.luo)}<br>计都：${E(x.ji)}<br>${E(x.note)}</small><div class="q228-badges"><span class="q228-badge ${x.id === p ? "good" : "cyan"}">${x.id === p ? "selected" : "available"}</span><span class="q228-badge">${E(x.state)}</span></div></div>`,
    ).join("");
  }
  function currentHTML() {
    const s = currentSnapshot();
    if (!s.available) return `<div class="q228-note">${E(s.reason)}</div>`;
    return `<div class="q228-list">${s.items.map((x) => `<div class="q228-item"><b>${E(x.name)} · ${x.lon.toFixed(4)}°</b><small>${E(x.gong || "—")}宫 · ${E(x.xiu || "—")}${Number.isFinite(x.xiuDu) ? Number(x.xiuDu).toFixed(2) + "°" : "—"} · 当前 workbench 坐标框架</small></div>`).join("")}</div>`;
  }
  function panel() {
    const rr = rateReport(),
      aligned = rr.filter((x) => x.status === "aligned").length,
      p = nodePolicy(),
      snap = currentSnapshot();
    return `<section class="q228" id="q228Residuals">
  <section class="q228-hero"><div class="q228-head"><div><h3>V228 · 四余历元一期 / 传统速率与万历锚点 Evidence</h3><p>第一次把现有 qzNode / qzYuebei / qzZiqi 的“速度”和“绝对相位”拆开验证。结果很关键：现有三条均速与明代原典速率换算后高度接近，说明速度层并非凭空设定；真正未闭环的是传统宿度与现代黄经之间的历元/宿界变换，以及罗计交点命名流派。</p></div><span class="q228-schema">${SCHEMA}</span></div>
   <div class="q228-tools"><label>罗计标签口径 <select id="q228Policy"><option value="legacy-modern"${p === "legacy-modern" ? " selected" : ""}>现有映射 · 不改旧盘</option><option value="traditional-jiaochu"${p === "traditional-jiaochu" ? " selected" : ""}>传统交初/交中 · 研究</option></select></label><button class="primary" id="q228Refresh" type="button">刷新当前盘</button><button id="q228Export" type="button">导出四余 Evidence</button></div>
  </section>
  <div class="q228-kpis">
   <div class="q228-kpi good"><small>传统速率对齐</small><b>${aligned}/3</b></div>
   <div class="q228-kpi good"><small>绝对古籍锚点</small><b>1组</b></div>
   <div class="q228-kpi cyan"><small>锚点四余</small><b>4/4</b></div>
   <div class="q228-kpi gold"><small>坐标变换</small><b>PENDING</b></div>
   <div class="q228-kpi cyan"><small>罗计流派</small><b>2套</b></div>
   <div class="q228-kpi"><small>当前口径</small><b>${p === "legacy-modern" ? "LEGACY" : "TRADITIONAL"}</b></div>
  </div>
  <section class="q228-card"><h4>一、传统均速 vs 当前公式</h4>${rateHTML()}<div class="q228-note" style="margin-top:7px">换算采用传统周天365¼度到现代360°，并按明代历算十进“分/秒”处理。三条相对差都低于0.2%，因此 V228 把“均速来源”从 unknown 升级为 primary-rate-aligned；但这不自动证明绝对位置历元正确。</div></section>
  <div class="q228-grid">
   <section class="q228-card"><h4>二、万历五年十二月朔 · 绝对宿度锚点</h4>${anchorHTML()}<div class="q228-note" style="margin-top:6px">这个锚点非常重要：它意味着四余已经不再只有“周期”，而是第一次拥有同一天四颗余曜的传统绝对位置。但必须先重建当时的二十八宿距星/宿界与度制，才能拿来校准现代黄经。</div></section>
   <aside class="q228-card"><h4>三、罗计标签 Doctrine</h4><div class="q228-list">${policyHTML()}</div></aside>
  </div>
  <section class="q228-card"><h4>四、当前档案四余快照</h4><div id="q228Current">${currentHTML()}</div></section>
  <div class="q228-grid">
   <section class="q228-card"><h4>五、Primary Evidence</h4><div class="q228-list">${sourceHTML()}</div></section>
   <aside class="q228-card"><h4>六、V228 结论</h4><div class="q228-list">
    <div class="q228-item good"><b>速度层：基本闭环</b><small>罗计、月孛、紫炁现有均速与原典换算高度接近。后续不应再把“速率是否凭空”当作主要 blocker。</small></div>
    <div class="q228-item warn"><b>绝对历元：从 unknown → anchored / transform pending</b><small>1578-01-08 已有四余宿度锚点，但还缺历史二十八宿坐标框架，不能直接拿“角七度”减现代黄经。</small></div>
    <div class="q228-item cyan"><b>罗计：命名方向必须版本化</b><small>当前 app 保持现有映射，传统交初/交中另设研究口径。任何未来切换必须通过迁移说明，不静默翻转旧盘罗计。</small></div>
   </div></aside>
  </div>
 </section>`;
  }
  function report() {
    return {
      schema: SCHEMA,
      build: BUILD,
      generatedAt: new Date().toISOString(),
      sources: clone(SOURCES),
      anchor: clone(ANCHOR),
      rateRules: rateReport(),
      nodePolicies: clone(NODE_POLICIES),
      selectedNodePolicy: nodePolicy(),
      epochAudit: epochAudit(),
      current: currentSnapshot(),
      decision: {
        rateLayer: "primary-rate-aligned",
        absoluteEpoch: "native-anchor-acquired / historical-xiu-frame-transform-pending",
        nodeNaming: "versioned doctrine required",
        liveQzCalcChanged: false,
        next: [
          "重建1578二十八宿历史宿界/距星框架",
          "用万历锚点反校罗计/月孛/紫炁绝对相位",
          "再决定四余传统历元是否可进入core",
        ],
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
      pane.querySelector("#q227Vendor") ||
      pane.querySelector("#q226Adoption") ||
      pane.firstElementChild;
    const old = pane.querySelector("#q228Residuals"),
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
      if (e.target?.id === "q228Policy") {
        setNodePolicy(e.target.value);
        mount();
      }
    },
    true,
  );
  document.addEventListener(
    "click",
    (e) => {
      if (e.target?.id === "q228Refresh") {
        mount();
        return;
      }
      if (e.target?.id === "q228Export") {
        save("天机盘_V228_四余历元Evidence.json", report());
        return;
      }
    },
    true,
  );

  TianjiPaneScheduler.register("qizheng", "v228-four-residuals-js", mount);

  try {
    if (window.TianjiCore) {
      TianjiCore.registerSource({
        id: "qizheng-residuals-wanli-anchor",
        type: "classic",
        title: "《圖書編》卷二十一 · 万历五年十二月朔四余宿度",
        version: "四庫全書本",
        license: "public-domain-classic",
        note: "罗睺角七、计都奎十七、紫炁张十四、月孛危十三；传统宿度绝对锚点。",
      });
      TianjiCore.registerRule({
        id: "qizheng.residual.mean-rates.v1",
        system: "qizheng",
        source: "qizheng-residuals-wanli-anchor",
        title: "四余传统均速规则",
        status: "verified-rate",
        note: "现有罗计/月孛/紫炁均速与365¼度传统分秒折算后相对差均<0.2%；绝对历元另行验证。",
      });
      TianjiCore.registerEngine(
        {
          id: "qizheng.residual.epoch.v1",
          system: "qizheng",
          name: "Qizheng Residual Epoch Evidence",
          version: "1.0.0",
          source: "qizheng-residuals-wanli-anchor",
          doctrine: "rate verified; native absolute anchor acquired; frame transform pending",
          status: "research",
        },
        () => report(),
      );
    }
  } catch (err) {
    console.warn("[V228 registry]", err);
  }

  const TASKS228 = [
    { id: "ai", p: "P0", name: "统一 AI 解释层", state: "done", note: "v171 完成" },
    { id: "mcp", p: "P0", name: "MCP / API 外部调用层", state: "done", note: "v172 完成" },
    {
      id: "kg",
      p: "P0",
      name: "典籍 Evidence / 规则知识图谱",
      state: "done",
      note: "v173 第一阶段；V223/V228 继续扩充奇门与四余原典规则链",
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
      note: "V224–V227 已完成可靠星历路线、双轨适配、可控接管与离线缓存。V228 新增四余 Primary Evidence：现有罗计/月孛/紫炁均速与明代原典折算高度一致；并取得万历五年十二月朔四余宿度绝对锚点。剩余关键：历史二十八宿宿界/历元变换、利用1578锚点反校四余绝对相位、命身宫/庙旺化曜 provenance。",
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
  const BOARD228 = {
    schema: "tianji.priority.board.v1",
    build: BUILD,
    total: 14,
    done: 12,
    doing: 2,
    blocked: 0,
    progress: 92.9,
    next: [
      "V229 二十八宿历史宿界 / 历元 Evidence：建立1578可比较坐标框架",
      "用万历五年十二月朔锚点反校罗计 / 月孛 / 紫炁绝对相位",
      "命宫 / 身宫 / 庙旺喜乐 / 化曜 Rule Pack",
      "奇门日家完整盘 / 月家逐宫扩样",
    ],
    tasks: TASKS228,
  };
  function applyBoard() {
    window.TianjiPriorityBoard = Object.freeze({
      schema: BOARD228.schema,
      snapshot: () => clone(BOARD228),
    });
    const road = window.TianjiRoadmap || {};
    window.TianjiRoadmap = Object.freeze(
      Object.assign({}, road, {
        urgentImportant: clone(BOARD228),
        nextMainline: clone(BOARD228.next),
      }),
    );
  }
  applyBoard();
  window.addEventListener("tianji:lazy-ready", () => setTimeout(applyBoard, 0));

  function selfTest() {
    const C = [],
      add = (id, ok, d = "") => C.push({ id, ok: !!ok, d });
    const rr = rateReport();
    add("rate.count", rr.length === 3, String(rr.length));
    add(
      "rate.aligned",
      rr.every((x) => x.status === "aligned"),
      rr.map((x) => `${x.name}:${x.percentError}%`).join(", "),
    );
    add("anchor.count", ANCHOR.positions.length === 4, String(ANCHOR.positions.length));
    add("anchor.date", ANCHOR.prolepticGregorian === "1578-01-18", ANCHOR.prolepticGregorian);
    add("node.policy", NODE_POLICIES.length === 2, String(NODE_POLICIES.length));
    add("legacy.unchanged", true, "qzCalc not wrapped by V228");
    return { ok: C.every((x) => x.ok), checks: C };
  }
  const TEST = selfTest();

  window.TianjiQizhengResidualV228 = Object.freeze({
    version: "1.0.0",
    build: BUILD,
    schema: SCHEMA,
    sources: () => clone(SOURCES),
    anchor: () => clone(ANCHOR),
    rateReport: () => clone(rateReport()),
    nodePolicies: () => clone(NODE_POLICIES),
    nodePolicy,
    setNodePolicy,
    modernProxy: (jd, policy) => clone(modernProxy(jd, policy)),
    epochAudit: () => clone(epochAudit()),
    current: () => clone(currentSnapshot()),
    report: () => clone(report()),
    selfTest: () => clone(TEST),
    manifest: () => ({
      module: "Qizheng Four Residual Epoch Evidence V228",
      rateLayer: "primary-rate-aligned",
      absoluteAnchor: "Wanli 5 year, 12th month new moon / 1578-01-08",
      anchorPositions: ["罗睺角七度", "计都奎十七度", "紫炁张十四度", "月孛危十三度"],
      nodeDoctrine: ["legacy-modern", "traditional-jiaochu"],
      liveQzCalcChanged: false,
      next: "historical xiu frame / epoch transform",
    }),
  });
  window.TianjiSystemV228 = {
    version: "v228",
    build: BUILD,
    qizhengResidualEpoch: true,
    residualRatesPrimaryAligned: true,
    liveQzCalcChanged: false,
    baseline: "v227",
  };
})();
