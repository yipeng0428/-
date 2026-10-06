(() => {
  "use strict";
  const BUILD = "v210 · 2026-10-06 14:02 +08:00";
  const SCHEMA = "tianji.time.regression.v1";
  const STORE = "tianjipan.time.v210.mode";
  let MODE = "audit";
  try {
    MODE = localStorage.getItem(STORE) || "audit";
  } catch (_) {}
  if (!["audit", "profile"].includes(MODE)) MODE = "audit";

  const clone = (x) => (x == null ? x : JSON.parse(JSON.stringify(x)));
  const E = (s) =>
    String(s ?? "").replace(
      /[&<>"']/g,
      (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
    );
  const eqCiv = (a, b) =>
    !!a && !!b && ["y", "m", "d", "h", "mi"].every((k) => (+a[k] || 0) === (+b[k] || 0));
  const gz4 = (R0) => R0?.bz?.pill?.map((p) => GAN[p.s] + ZHI[p.b]).join(" ") || "—";
  const qSig = (R0) =>
    R0?.qm
      ? `${R0.qm.yang ? "阳" : "阴"}遁${R0.qm.ju}局 · ${R0.qm.k || ""} · 日${R0.bz?.dayIdx}时${R0.bz?.hourIdx}`
      : "—";
  const zSig = (R0) =>
    R0?.zw
      ? `命${ZHI[R0.zw.ming]} · 身${ZHI[R0.zw.shen]} · ${R0.zw.juName || ""} · ${Object.entries(
          R0.zw.sihua || {},
        )
          .map(([k, v]) => k + "化" + v)
          .join(" ")}`
      : "—";
  const lunarSig = (R0) =>
    R0?.lunar
      ? `${R0.lunar.year}-${R0.lunar.isLeap ? "闰" : ""}${R0.lunar.month}-${R0.lunar.day}`
      : "—";
  const fmtCiv = (c) =>
    c
      ? `${c.y}-${String(c.m).padStart(2, "0")}-${String(c.d).padStart(2, "0")} ${String(c.h || 0).padStart(2, "0")}:${String(c.mi || 0).padStart(2, "0")}`
      : "—";

  const LEGACY_COMPUTE = window.compute;
  if (typeof LEGACY_COMPUTE !== "function") {
    console.warn("[V210] legacy compute unavailable");
  }

  function currentProfileCiv() {
    try {
      return parseDt();
    } catch (_) {
      return null;
    }
  }
  function currentAudit() {
    try {
      return window.TianjiHistoricalTime?.analyzeCurrent?.() || null;
    } catch (_) {
      return null;
    }
  }
  function bridgeCiv(A) {
    if (!A?.available || !A.clocks?.legacyBridgeUTC8) return null;
    const c = A.clocks.legacyBridgeUTC8;
    return { y: +c.y, m: +c.m, d: +c.d, h: +c.h, mi: +c.mi, s: +(c.s || 0) };
  }
  function computeHistoricalProfile(civ, A = null) {
    A = A || currentAudit();
    if (!A?.available) throw new Error(A?.reason || "历史时间尚未解析");
    const b = bridgeCiv(A);
    if (!b) throw new Error("缺少 UTC+8 兼容桥");
    const r = LEGACY_COMPUTE(b);
    const original = clone(civ);
    r.timeAudit = clone(A);
    r.timeMode = "historical-profile-v210";
    r.inputCivil = original;
    if (r.t) {
      r.t.recordedCiv = original;
      r.t.bridgeCiv = clone(b);
      r.t.historicalInstant = clone(A.instant);
      r.t.historicalZone = A.zone;
      r.t.historicalOffsetMinutes = A.offsetMinutes;
    }
    r.civ = original;
    return r;
  }
  function shouldAdopt(civ) {
    if (MODE !== "profile" || typeof LEGACY_COMPUTE !== "function") return false;
    const profile = currentProfileCiv();
    return eqCiv(civ, profile);
  }
  if (typeof LEGACY_COMPUTE === "function") {
    window.compute = function (civ) {
      if (!shouldAdopt(civ)) return LEGACY_COMPUTE(civ);
      const A = currentAudit();
      if (!A?.available) {
        const r = LEGACY_COMPUTE(civ);
        r.timeMode = "legacy-fallback-v210";
        r.timeAudit = A || null;
        return r;
      }
      try {
        return computeHistoricalProfile(civ, A);
      } catch (err) {
        console.warn("[V210 historical compute fallback]", err);
        const r = LEGACY_COMPUTE(civ);
        r.timeMode = "legacy-fallback-v210";
        r.timeAudit = A;
        return r;
      }
    };
  }
  function signatures(R0) {
    return {
      time: {
        jdUT: +(R0?.t?.jdUT ?? NaN),
        sunLongitude: +(R0?.t?.lon ?? NaN),
        calculationCivil: fmtCiv(R0?.t?.loc),
        sourceCivil: fmtCiv(R0?.t?.civ),
      },
      bazi: { pillars: gz4(R0), dayIdx: R0?.bz?.dayIdx, hourIdx: R0?.bz?.hourIdx },
      qimen: { signature: qSig(R0), yang: !!R0?.qm?.yang, ju: R0?.qm?.ju, k: R0?.qm?.k },
      ziwei: {
        signature: zSig(R0),
        ming: R0?.zw?.ming,
        shen: R0?.zw?.shen,
        juName: R0?.zw?.juName,
      },
      lunar: { signature: lunarSig(R0) },
    };
  }
  function valEq(a, b) {
    if (typeof a === "number" && typeof b === "number")
      return Number.isFinite(a) && Number.isFinite(b) ? Math.abs(a - b) < 1e-9 : Object.is(a, b);
    return JSON.stringify(a) === JSON.stringify(b);
  }
  function regression() {
    const civ = currentProfileCiv(),
      A = currentAudit();
    if (!civ)
      return { schema: SCHEMA, build: BUILD, available: false, reason: "当前档案没有有效时间" };
    if (!A?.available)
      return {
        schema: SCHEMA,
        build: BUILD,
        available: false,
        reason: A?.reason || "历史时区尚未唯一解析",
        audit: A,
      };
    if (typeof LEGACY_COMPUTE !== "function")
      return { schema: SCHEMA, build: BUILD, available: false, reason: "legacy compute 不可用" };
    const t0 = performance.now(),
      legacy = LEGACY_COMPUTE(civ),
      t1 = performance.now(),
      hist = computeHistoricalProfile(civ, A),
      t2 = performance.now();
    const L = signatures(legacy),
      H = signatures(hist);
    const rows = [
      {
        id: "instant",
        name: "真实天文瞬间",
        legacy: `JDUT ${L.time.jdUT.toFixed(6)}`,
        historical: `JDUT ${H.time.jdUT.toFixed(6)}`,
        changed: !valEq(L.time.jdUT, H.time.jdUT),
        severity: "high",
      },
      {
        id: "sun",
        name: "太阳黄经",
        legacy: `${L.time.sunLongitude.toFixed(6)}°`,
        historical: `${H.time.sunLongitude.toFixed(6)}°`,
        changed: Math.abs(L.time.sunLongitude - H.time.sunLongitude) > 1e-7,
        severity: "medium",
      },
      {
        id: "bazi",
        name: "八字四柱",
        legacy: L.bazi.pillars,
        historical: H.bazi.pillars,
        changed: L.bazi.pillars !== H.bazi.pillars,
        severity: "high",
      },
      {
        id: "bazi-index",
        name: "日 / 时干支索引",
        legacy: `日${L.bazi.dayIdx} · 时${L.bazi.hourIdx}`,
        historical: `日${H.bazi.dayIdx} · 时${H.bazi.hourIdx}`,
        changed: L.bazi.dayIdx !== H.bazi.dayIdx || L.bazi.hourIdx !== H.bazi.hourIdx,
        severity: "high",
      },
      {
        id: "qimen",
        name: "奇门时家核心",
        legacy: L.qimen.signature,
        historical: H.qimen.signature,
        changed: L.qimen.signature !== H.qimen.signature,
        severity: "high",
      },
      {
        id: "lunar",
        name: "农历日期",
        legacy: L.lunar.signature,
        historical: H.lunar.signature,
        changed: L.lunar.signature !== H.lunar.signature,
        severity: "medium",
      },
      {
        id: "ziwei",
        name: "紫微核心",
        legacy: L.ziwei.signature,
        historical: H.ziwei.signature,
        changed: L.ziwei.signature !== H.ziwei.signature,
        severity: "high",
      },
    ];
    const changed = rows.filter((x) => x.changed),
      high = changed.filter((x) => x.severity === "high");
    const verdict = high.length
      ? "high-impact"
      : changed.length
        ? "time-only-or-medium"
        : "same-chart";
    return {
      schema: SCHEMA,
      build: BUILD,
      available: true,
      mode: MODE,
      audit: A,
      input: {
        recorded: clone(civ),
        bridge: bridgeCiv(A),
        zone: A.zone,
        offsetMinutes: A.offsetMinutes,
        legacyDeltaMinutes: A.correction?.legacyInstantDeltaMinutes,
      },
      legacy: L,
      historical: H,
      rows,
      summary: {
        changed: changed.length,
        highImpact: high.length,
        verdict,
        legacyMs: +(t1 - t0).toFixed(1),
        historicalMs: +(t2 - t1).toFixed(1),
      },
      runtime: { legacy, historical: null },
      boundaries: [
        "比较的是同一出生记录在“旧固定 UTC+8”与“IANA 历史真实瞬间→UTC+8兼容桥”两条链上的结果。",
        "试验接管只对“当前档案出生时刻”生效；现在时刻、搜索候选时刻、其它工具自定义时刻继续走 legacy，避免扩大回归面。",
        "即使差异为 0，也不等于全球历史时区问题已经完成验证；只能说明当前档案在已比较字段上没有变化。",
      ],
    };
  }
  function riskText(RG) {
    if (!RG.available) return { tone: "bad", title: "尚不能回归比较", text: RG.reason };
    const s = RG.summary;
    if (s.verdict === "high-impact")
      return {
        tone: "bad",
        title: "高影响差异",
        text: `有 ${s.highImpact} 个核心盘字段发生变化。正式接管前应重点复核八字、奇门、紫微结果。`,
      };
    if (s.verdict === "time-only-or-medium")
      return {
        tone: "cyan",
        title: "中低影响差异",
        text: `共有 ${s.changed} 个时间/中间字段变化，但当前核心盘签名未全部改变。仍建议保留双轨报告。`,
      };
    return {
      tone: "good",
      title: "当前核心盘一致",
      text: "当前档案在已比较的八字、奇门、紫微核心字段上与 legacy 一致。",
    };
  }
  function rowsHTML(RG) {
    if (!RG.available) return `<div class="tz210-note">${E(RG.reason)}</div>`;
    return `<div class="tbl-wrap"><table class="tz210-table"><thead><tr><th>比较项</th><th>Legacy UTC+8</th><th>IANA 历史时间链</th><th>状态</th></tr></thead><tbody>${RG.rows.map((x) => `<tr><td><b>${E(x.name)}</b></td><td>${E(x.legacy)}</td><td>${E(x.historical)}</td><td><span class="tz210-change ${x.changed ? "diff" : "same"}">${x.changed ? "变化" : "一致"}</span></td></tr>`).join("")}</tbody></table></div>`;
  }
  function adoptStateHTML(RG) {
    const on = MODE === "profile",
      A = RG.audit || currentAudit();
    return `<div class="tz210-list">
    <div class="tz210-item ${on ? "cyan" : "good"}"><b>${on ? "试验接管已启用" : "审计模式 · 默认"}</b><small>${on ? "只有当前档案的出生 civil time 会在 compute() 入口转换为同一真实瞬间对应的 UTC+8 兼容时刻；其它任意 compute(civ) 不接管。" : "主排盘继续使用原 legacy 计算。历史时间核心只用于审计和双轨比较。"}</small></div>
    <div class="tz210-item gold"><b>接管前置条件</b><small>${A?.available ? `当前已解析 ${E(A.zone)}，历史 UTC 偏移 ${A.offsetMinutes} 分钟，兼容桥 ${E(A.clocks?.legacyBridgeUTC8?.text || "—")}。` : "当前历史时区未唯一解析，因此即使选择试验接管也会自动回退 legacy。"}</small></div>
  </div>`;
  }
  function cardHTML() {
    const RG = regression(),
      risk = riskText(RG),
      s = RG.summary || { changed: 0, highImpact: 0, legacyMs: 0, historicalMs: 0 };
    return `<section class="tz210-card" id="tz210Regression">
    <h3>V210 · 双轨回归与可控接管 <span class="tz210-badge ${MODE === "profile" ? "on" : ""}">${MODE === "profile" ? "试验接管 ON" : "AUDIT ONLY"}</span></h3>
    <div class="tz210-toolbar">
      <label>运行模式<select id="tz210Mode"><option value="audit"${MODE === "audit" ? " selected" : ""}>仅审计 · 不改变主盘（推荐）</option><option value="profile"${MODE === "profile" ? " selected" : ""}>试验接管 · 仅当前档案</option></select></label>
      <button class="primary" id="tz210Run" type="button">运行双轨回归</button>
      <button id="tz210Apply" type="button">保存模式并重新推演</button>
      <button id="tz210Copy" type="button">复制回归 Schema</button>
    </div>
    <div class="tz210-kpis">
      <div class="tz210-kpi ${risk.tone}"><small>回归判断</small><b>${E(risk.title)}</b></div>
      <div class="tz210-kpi bad"><small>变化字段</small><b>${s.changed}</b></div>
      <div class="tz210-kpi bad"><small>高影响变化</small><b>${s.highImpact}</b></div>
      <div class="tz210-kpi"><small>Legacy 计算</small><b>${s.legacyMs || 0} ms</b></div>
      <div class="tz210-kpi"><small>历史链计算</small><b>${s.historicalMs || 0} ms</b></div>
      <div class="tz210-kpi cyan"><small>接管范围</small><b>${MODE === "profile" ? "当前档案" : "无"}</b></div>
    </div>
    <div class="tz210-grid" style="margin-top:7px">
      <section><div class="tz210-item ${risk.tone}"><b>${E(risk.title)}</b><small>${E(risk.text)}</small></div>${adoptStateHTML(RG)}</section>
      <aside><div class="tz210-note">V210 不把“打开历史时区”理解成简单改一个小时。它先用真实 UTC 瞬间生成 UTC+8 等价钟表，再复用既有算法，从而尽量把时区制度变化与旧算法本身分离。</div></aside>
    </div>
    <div style="margin-top:7px">${rowsHTML(RG)}</div>
  </section>`;
  }
  function mountCard() {
    const body = document.querySelector("#tz209Modal .tz209-body");
    if (!body) return;
    document.getElementById("tz210Regression")?.remove();
    body.insertAdjacentHTML("beforeend", cardHTML());
    bindCard();
  }
  function bindCard() {
    document.getElementById("tz210Run")?.addEventListener("click", mountCard);
    document.getElementById("tz210Apply")?.addEventListener("click", () => {
      MODE = document.getElementById("tz210Mode")?.value || "audit";
      try {
        localStorage.setItem(STORE, MODE);
      } catch (_) {}
      updateBadge();
      const civ = currentProfileCiv();
      if (civ && typeof deduce === "function") {
        try {
          deduce(civ, "quick");
        } catch (err) {
          console.warn("[V210 re-deduce]", err);
        }
      }
      mountCard();
      try {
        toast(
          MODE === "profile"
            ? "已启用：仅当前档案使用历史时间核心"
            : "已恢复：主排盘使用 legacy 时间链",
        );
      } catch (_) {}
    });
    document.getElementById("tz210Copy")?.addEventListener("click", () => {
      const R = regression();
      navigator.clipboard
        ?.writeText?.(JSON.stringify(R, null, 2))
        .then(() => {
          try {
            toast("已复制时间双轨回归 Schema");
          } catch (_) {}
        })
        .catch(() => {});
    });
  }
  function updateBadge() {
    const mini = document.getElementById("tz209Mini");
    if (!mini) return;
    let b = document.getElementById("tz210MiniBadge");
    if (!b) {
      b = document.createElement("span");
      b.id = "tz210MiniBadge";
      mini.insertAdjacentElement("afterend", b);
    }
    b.className = "tz210-badge " + (MODE === "profile" ? "on" : "");
    b.textContent = MODE === "profile" ? "历史核心·当前档案" : "时间审计";
  }
  document.addEventListener(
    "click",
    (ev) => {
      if (ev.target?.id === "tz209Open" || ev.target?.id === "tz209VerifyOpen")
        setTimeout(() => {
          mountCard();
          updateBadge();
        }, 30);
      if (ev.target?.id === "tz209Run") setTimeout(mountCard, 40);
    },
    true,
  );
  setTimeout(updateBadge, 850);

  /* 自检：验证 1986 中国 DST 时段的兼容桥必须回退 60 分钟；1992 标准时不应移动。 */
  function selfTest() {
    const C = [],
      add = (id, ok, d = "") => C.push({ id, ok: !!ok, d });
    try {
      const a = TianjiHistoricalTime.resolve(
        { y: 1986, m: 6, d: 5, h: 17, mi: 30, s: 0 },
        { zone: "Asia/Shanghai", longitude: 117.8, latitude: 24.5, solar: false },
      );
      add(
        "bridge.1986",
        a.available && a.clocks.legacyBridgeUTC8.h === 16 && a.clocks.legacyBridgeUTC8.mi === 30,
        JSON.stringify(a.clocks?.legacyBridgeUTC8),
      );
      add(
        "bridge.delta1986",
        a.available && Math.abs(a.correction.legacyInstantDeltaMinutes + 60) < 0.01,
        String(a.correction?.legacyInstantDeltaMinutes),
      );
    } catch (err) {
      add("bridge.1986", false, String(err));
    }
    try {
      const a = TianjiHistoricalTime.resolve(
        { y: 1992, m: 6, d: 5, h: 17, mi: 30, s: 0 },
        { zone: "Asia/Shanghai", longitude: 117.8, latitude: 24.5, solar: false },
      );
      add(
        "bridge.1992",
        a.available && a.clocks.legacyBridgeUTC8.h === 17 && a.clocks.legacyBridgeUTC8.mi === 30,
        JSON.stringify(a.clocks?.legacyBridgeUTC8),
      );
      add(
        "bridge.delta1992",
        a.available && Math.abs(a.correction.legacyInstantDeltaMinutes) < 0.01,
        String(a.correction?.legacyInstantDeltaMinutes),
      );
    } catch (err) {
      add("bridge.1992", false, String(err));
    }
    add(
      "compute.wrapper",
      typeof window.compute === "function" && typeof LEGACY_COMPUTE === "function",
      "",
    );
    return { ok: C.every((x) => x.ok), checks: C };
  }
  const TEST = selfTest();

  const TASKS210 = [
    { id: "ai", p: "P0", name: "统一 AI 解释层", state: "done", note: "v171 完成" },
    { id: "mcp", p: "P0", name: "MCP / API 外部调用层", state: "done", note: "v172 完成" },
    {
      id: "kg",
      p: "P0",
      name: "典籍 Evidence / 规则知识图谱",
      state: "done",
      note: "v173 第一阶段完成",
    },
    {
      id: "router",
      p: "P0",
      name: "自然语言问事路由",
      state: "done",
      note: "v196–v197；含寻人 / 寻物路由",
    },
    { id: "consumer", p: "P0", name: "统一消费者结果页 / 报告", state: "done", note: "v198 完成" },
    {
      id: "qimen-evidence",
      p: "P1",
      name: "奇门四家第三方对拍 / 高级 Evidence",
      state: "doing",
      note: "v199 一期验证台完成；日/月/年仍等待真实外部 reference 样本",
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
      note: "v203–v204 完成当前声明流派口径 V1",
    },
    {
      id: "qizheng",
      p: "P1",
      name: "七政四余核心化",
      state: "blocked",
      note: "等待星历、四余口径与许可证方案",
    },
    {
      id: "xk",
      p: "P1",
      name: "玄空完整宅盘",
      state: "done",
      note: "v205–v206 当前声明口径完成；外部逐盘 reference 单独 pending",
    },
    {
      id: "sanhe",
      p: "P1",
      name: "三合水法 Core",
      state: "done",
      note: "v207–v208 当前声明规则包完成；外部逐盘 reference 单独 pending",
    },
    {
      id: "tz",
      p: "P2",
      name: "历史时区 / 夏令时自动校正",
      state: "doing",
      note: "v209–v210：IANA/DST 审计、gap/fold、太阳时间链、UTC+8兼容桥、八字/奇门/紫微双轨回归、当前档案可控试验接管；下一阶段做更完整模块回归与正式接管条件",
    },
    {
      id: "relation",
      p: "P2",
      name: "关系长期时间轴",
      state: "todo",
      note: "人物关系已有，长期阶段待产品化",
    },
    {
      id: "report",
      p: "P2",
      name: "合参 Evidence 正式报告",
      state: "todo",
      note: "与消费者结果页联动推进",
    },
  ];
  const BOARD = {
    schema: "tianji.priority.board.v1",
    build: BUILD,
    total: 14,
    done: 9,
    doing: 2,
    blocked: 1,
    progress: 75,
    next: [
      "历史时间三期：更多模块 golden regression / 正式接管条件",
      "奇门日/月/年真实第三方 reference 样本",
      "关系长期时间轴",
    ],
    tasks: TASKS210,
  };
  function applyBoard() {
    window.TianjiPriorityBoard = Object.freeze({
      schema: BOARD.schema,
      snapshot: () => clone(BOARD),
    });
    const road = window.TianjiRoadmap || {};
    window.TianjiRoadmap = Object.freeze(
      Object.assign({}, road, {
        urgentImportant: clone(BOARD),
        nextMainline: [
          "历史时间三期：更多术数回归与正式接管条件",
          "奇门四家第三方对拍（二期待外部样本）",
          "关系长期时间轴",
          "合参 Evidence 正式报告",
        ],
      }),
    );
  }
  applyBoard();
  window.addEventListener("tianji:lazy-ready", () => setTimeout(applyBoard, 0));

  window.TianjiHistoricalTimeV2 = Object.freeze({
    version: "2.0.0",
    build: BUILD,
    schema: SCHEMA,
    mode: () => MODE,
    setMode: (m) => {
      if (["audit", "profile"].includes(m)) {
        MODE = m;
        try {
          localStorage.setItem(STORE, m);
        } catch (_) {}
        updateBadge();
      }
      return MODE;
    },
    regression: () => {
      const r = regression();
      if (r.runtime) delete r.runtime;
      return clone(r);
    },
    computeHistoricalProfile: (civ) => {
      const r = computeHistoricalProfile(civ, currentAudit());
      return { signature: signatures(r), timeAudit: clone(r.timeAudit) };
    },
    selfTest: () => clone(TEST),
    manifest: () => ({
      module: "Tianji Historical Time V2",
      defaultMode: "audit",
      adoptionScope: "profile-only opt-in",
      comparedModules: ["八字", "奇门时家核心", "紫微核心", "农历日期", "太阳黄经"],
      safety: [
        "非当前档案 compute(civ) 不接管",
        "历史时区无法唯一解析时自动回退 legacy",
        "默认 AUDIT ONLY",
        "试验接管可随时恢复",
      ],
      remaining: [
        "六壬/梅花/西占/吠陀等更多模块 golden regression",
        "批量边界样本",
        "正式接管阈值与迁移报告",
      ],
    }),
  });
  window.TianjiSystemV210 = {
    version: "v210",
    build: BUILD,
    historicalTimeV2: true,
    defaultAuditOnly: true,
    noticeQuietDefault: true,
    baseline: "v209",
  };

  function sync() {
    const b = document.getElementById("buildVersion");
  }
  /* V226: historical delayed version writer disabled */
})();
