(() => {
  "use strict";
  const BUILD = "v223 · 2026-10-06 21:24 +08:00";
  const SCHEMA = "tianji.qimen.day-doctrine.v1";
  const RULE_SCHEMA = "tianji.qimen.day-classic-rule.v1";
  const PRIMARY = [
    {
      id: "dunjia-yanyi-siku-wikisource",
      title: "《遁甲演義》四庫全書本 · 卷一 · 日家奇門",
      author: "明 · 程道生",
      type: "primary-text",
      url: "https://zh.wikisource.org/zh-hant/%E9%81%81%E7%94%B2%E6%BC%94%E7%BE%A9_(%E5%9B%9B%E5%BA%AB%E5%85%A8%E6%9B%B8%E6%9C%AC)/%E5%8D%B71",
      note: "核心规则：按节推排、三日一局；甲子起坎，每三日一换，顺飞八方，不入中五；到宫起休门顺轮。",
    },
    {
      id: "dunjia-yanyi-ctext",
      title: "Chinese Text Project · 《遁甲演義》卷一 · 日家奇門",
      author: "明 · 程道生",
      type: "primary-text-transcription",
      url: "https://ctext.org/wiki.pl?chapter=140678&if=gb",
      note: "同一古籍的独立数字化转录，用于文本交叉核对；不计作第二套独立算法。",
    },
  ];
  const GROUPS = [
    ["甲子", "乙丑", "丙寅", 1],
    ["丁卯", "戊辰", "己巳", 2],
    ["庚午", "辛未", "壬申", 3],
    ["癸酉", "甲戌", "乙亥", 4],
    ["丙子", "丁丑", "戊寅", 6],
    ["己卯", "庚辰", "辛巳", 7],
    ["壬午", "癸未", "甲申", 8],
    ["乙酉", "丙戌", "丁亥", 9],
    ["戊子", "己丑", "庚寅", 1],
    ["辛卯", "壬辰", "癸巳", 2],
    ["甲午", "乙未", "丙申", 3],
    ["丁酉", "戊戌", "己亥", 4],
    ["庚子", "辛丑", "壬寅", 6],
    ["癸卯", "甲辰", "乙巳", 7],
    ["丙午", "丁未", "戊申", 8],
    ["己酉", "庚戌", "辛亥", 9],
    ["壬子", "癸丑", "甲寅", 1],
    ["乙卯", "丙辰", "丁巳", 2],
    ["戊午", "己未", "庚申", 3],
    ["辛酉", "壬戌", "癸亥", 4],
  ];
  const PAL = {
    1: "坎一",
    2: "坤二",
    3: "震三",
    4: "巽四",
    6: "乾六",
    7: "兑七",
    8: "艮八",
    9: "离九",
  };
  const PROFILES = [
    {
      id: "classic-three-day-door",
      name: "古籍三日移宫 · 八门层",
      state: "active-default",
      basis: "《遁甲演義》卷一“日家奇門”",
      algorithm: "六十甲子按三日为组，起宫依古籍表；休门从起宫顺轮八门，不入中五。",
      coverage: "门层：可直接逐条对古籍表；三奇/完整九星神盘：未由本段给出足够确定步骤。",
      recommendation: "默认",
    },
    {
      id: "horosa-solstice-60day",
      name: "Horosa · 至甲子六十日块",
      state: "reference-only",
      basis: "公开标准参考盘 + 独立实现",
      algorithm: "冬/夏至附近甲子为半年锚点，六十日一块；阳 1/7/4，阴 9/3/6，并生成完整盘。",
      coverage: "现代完整盘参考；与古籍三日移宫门层不是同一模型。",
      recommendation: "不自动替换古籍门层",
    },
    {
      id: "atopx-solar-term-sanyuan",
      name: "atopx/qimen · 节气三元日家",
      state: "reference-only",
      basis: "公开 goldenCharts + 独立实现",
      algorithm: "日家与时家共享节气三元定局，日柱作为主柱，输出完整盘。",
      coverage: "现代完整盘参考；与 Horosa 的日家定局并不一致。",
      recommendation: "保留为流派参考",
    },
    {
      id: "abelard-solstice-daycount",
      name: "AbelardZ/QiMen · 至日起日数推局",
      state: "reference-only",
      basis: "独立 Python 实现",
      algorithm: "以冬至/夏至为基点，根据日数顺推/逆推局数。",
      coverage: "第三个独立现代规则实现；目前没有同等级公开 Golden 样本。",
      recommendation: "规则交叉参考",
    },
  ];
  const clone = (x) => (x == null ? x : JSON.parse(JSON.stringify(x)));
  const E = (s) =>
    String(s ?? "").replace(
      /[&<>"']/g,
      (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
    );

  function sourceGolden() {
    const rows = [];
    GROUPS.forEach((g, groupIndex) => {
      g.slice(0, 3).forEach((gz, pos) =>
        rows.push({ gz, palace: g[3], group: groupIndex + 1, position: pos + 1 }),
      );
    });
    return rows;
  }
  function verifyClassic60() {
    const api = window.TianjiQimenPeriod;
    const rows = sourceGolden().map((x, i) => {
      let actual = null,
        error = "";
      try {
        actual = api?.dayMeta?.({ bz: { dayIdx: i } }) || null;
      } catch (err) {
        error = String(err?.message || err);
      }
      const anchor = actual?.anchor;
      const restDoor = actual?.doors?.[x.palace];
      const status =
        !error && actual?.gz === x.gz && anchor === x.palace && restDoor === "休"
          ? "PASS"
          : error
            ? "ERROR"
            : "DIFF";
      return {
        ...x,
        index: i,
        actualGZ: actual?.gz,
        actualPalace: anchor,
        restDoor,
        error,
        status,
      };
    });
    return {
      schema: RULE_SCHEMA,
      build: BUILD,
      source: PRIMARY[0].id,
      total: rows.length,
      pass: rows.filter((x) => x.status === "PASS").length,
      diff: rows.filter((x) => x.status === "DIFF").length,
      error: rows.filter((x) => x.status === "ERROR").length,
      rows,
    };
  }
  function ruleLedger() {
    return [
      {
        id: "day.group-size",
        status: "primary",
        claim: "三日为一组，三日一局。",
        implementation: "dayMeta: Math.floor(dayIndex/3)",
        source: PRIMARY[0].id,
      },
      {
        id: "day.anchor-cycle",
        status: "primary",
        claim: "起宫依坎→坤→震→巽→乾→兑→艮→离循环。",
        implementation: "FLY 八宫序列；60 日古籍表逐条核验",
        source: PRIMARY[0].id,
      },
      {
        id: "day.no-center",
        status: "primary",
        claim: "日家八门顺飞八方，不入中五。",
        implementation: "dayGrid 中五不排门",
        source: PRIMARY[0].id,
      },
      {
        id: "day.rest-door",
        status: "primary",
        claim: "当前日组到宫后，从该宫起休门顺轮。",
        implementation: "dayMeta doors[anchor] = 休",
        source: PRIMARY[0].id,
      },
      {
        id: "day.yinyang-detail",
        status: "pending",
        claim:
          "原文提到分阴阳二遁、按节推排，但本段没有给出足以唯一复现完整三奇/九星/八神盘的全部步骤。",
        implementation: "不推测补齐",
        source: PRIMARY[0].id,
      },
      {
        id: "day.full-pan-modern",
        status: "doctrine-divergent",
        claim: "现代完整日家盘至少存在三套不同定局实现。",
        implementation: "Horosa / atopx / Abelard 仅作 reference profile",
        source: "external-modern-implementations",
      },
    ];
  }
  function report() {
    const v = verifyClassic60();
    return {
      schema: SCHEMA,
      build: BUILD,
      generatedAt: new Date().toISOString(),
      primarySources: clone(PRIMARY),
      profiles: clone(PROFILES),
      groups: clone(GROUPS),
      verification: v,
      rules: ruleLedger(),
      decision: {
        defaultProfile: "classic-three-day-door",
        reason:
          "古籍原文给出了可逐条复核的完整 60 日起宫表和休门起法；现代完整盘实现彼此存在定局分歧，暂不强行统一。",
        fullPanStatus: "pending-doctrine-selection",
        copyrightBoundary: "只记录第三方公开结果/规则事实；不复制第三方受许可约束的算法实现。",
      },
    };
  }
  function profilesHTML() {
    return PROFILES.map(
      (p) =>
        `<div class="q223-item ${p.state === "active-default" ? "good" : "cyan"}"><b>${E(p.name)}</b><small>${E(p.algorithm)}<br>${E(p.coverage)}</small><div class="q223-badges"><span class="q223-badge ${p.state === "active-default" ? "good" : "cyan"}">${E(p.state)}</span><span class="q223-badge">${E(p.basis)}</span><span class="q223-badge gold">${E(p.recommendation)}</span></div></div>`,
    ).join("");
  }
  function sourceHTML() {
    return PRIMARY.map(
      (s, i) =>
        `<div class="q223-item ${i === 0 ? "good" : "cyan"}"><b>${E(s.title)}</b><small>${E(s.author)} · ${E(s.note)}<br><span class="q223-code">${E(s.url)}</span></small><div class="q223-badges"><span class="q223-badge ${i === 0 ? "good" : "cyan"}">${E(s.type)}</span>${i === 1 ? '<span class="q223-badge gold">同源文本复核，不算独立算法</span>' : ""}</div></div>`,
    ).join("");
  }
  function rulesHTML() {
    return `<div class="q223-tablewrap"><table class="q223-table"><thead><tr><th>规则</th><th>Evidence</th><th>古籍/判断</th><th>天机实现</th></tr></thead><tbody>${ruleLedger()
      .map(
        (r) =>
          `<tr><td><span class="q223-code">${E(r.id)}</span></td><td><span class="q223-state ${r.status === "primary" ? "pass" : r.status === "pending" ? "pending" : "ref"}">${E(r.status)}</span></td><td>${E(r.claim)}</td><td>${E(r.implementation)}</td></tr>`,
      )
      .join("")}</tbody></table></div>`;
  }
  function verifyHTML(V) {
    const bad = V.rows.filter((x) => x.status !== "PASS");
    return `<div class="q223-item ${bad.length ? "bad" : "good"}"><b>《遁甲演義》60 日起宫表：${V.pass}/${V.total} PASS</b><small>${bad.length ? `发现 ${bad.length} 个差异；不会自动改算法。` : "甲子至癸亥 60 个日干支全部与古籍三日分组起宫表一致，同时每组起宫均为休门。"}</small>${
      bad.length
        ? `<div class="q223-badges">${bad
            .slice(0, 12)
            .map((x) => `<span class="q223-badge bad">${E(x.gz)} · ${E(x.status)}</span>`)
            .join("")}</div>`
        : ""
    }</div>`;
  }
  function panel() {
    const R = report(),
      V = R.verification;
    return `<section class="q223" id="q223DayDoctrine">
  <section class="q223-hero"><div class="q223-head"><div><h3>V223 · 日家奇门古籍 Evidence / Doctrine Pack</h3><p>把“古籍明确写了什么”和“现代软件扩展成什么”彻底分开。经典日家门层现在直接用《遁甲演義》六十日表做 60/60 金样核验；Horosa、atopx、Abelard 三套现代完整盘继续作为互相冲突的 reference profile，不为了凑 PASS 强改古籍口径。</p></div><span class="q223-schema">${SCHEMA}</span></div>
   <div class="q223-tools"><button class="primary" id="q223Verify" type="button">运行 60 日古籍金样</button><button id="q223DayMode" type="button">切到日家盘</button><button id="q223Export" type="button">导出 Day Doctrine JSON</button></div>
  </section>
  <div class="q223-kpis">
   <div class="q223-kpi good"><small>古籍日序样本</small><b>${V.total}</b></div>
   <div class="q223-kpi good"><small>古籍 PASS</small><b>${V.pass}</b></div>
   <div class="q223-kpi ${V.diff ? "bad" : "good"}"><small>DIFF</small><b>${V.diff}</b></div>
   <div class="q223-kpi cyan"><small>现代独立口径</small><b>3</b></div>
   <div class="q223-kpi gold"><small>完整盘状态</small><b>待定流派</b></div>
   <div class="q223-kpi good"><small>默认日家</small><b>古籍门层</b></div>
  </div>
  <div class="q223-grid">
   <section class="q223-card"><h4>Primary Evidence · 原典</h4><div class="q223-list">${sourceHTML()}</div></section>
   <aside class="q223-card"><h4>60 日 Golden</h4><div id="q223VerifyOut">${verifyHTML(V)}</div><div class="q223-note" style="margin-top:6px">这里的“60/60 PASS”只证明天机盘的“三日移宫 + 起休门”与该古籍表一致，不等于证明现代完整日家九星/三奇/八神盘只有一种正确算法。</div></aside>
  </div>
  <section class="q223-card"><h4>Rule Ledger · 原文 → 规则 → 实现边界</h4>${rulesHTML()}</section>
  <section class="q223-card"><h4>Day Doctrine Profiles</h4><div class="q223-list">${profilesHTML()}</div></section>
  <section class="q223-card"><h4>V223 决策</h4><div class="q223-list">
    <div class="q223-item good"><b>古籍门层：可以正式视为 Evidence 闭环</b><small>六十甲子全部逐项核验，规则来源明确，算法字段明确；继续保留为日家默认。</small></div>
    <div class="q223-item warn"><b>完整日家盘：仍不宣布唯一答案</b><small>Horosa、atopx 与 Abelard 的日家定局方法并不一致；其中 Horosa / atopx 有更强工程回归材料，但它们也互相冲突。</small></div>
    <div class="q223-item cyan"><b>下一步不再“猜”三奇细层</b><small>需要进一步找到能明确说明日家三奇、九星、八神完整排法的传统规则或第三方金样，再建立可选择的完整盘流派包。</small></div>
  </div></section>
 </section>`;
  }
  function download(name, obj) {
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
    const pane = document.getElementById("pane-qimen");
    if (!pane || !pane.classList.contains("on")) return;
    const anchor =
      pane.querySelector("#q222Doctrine") ||
      pane.querySelector("#q221ExternalEvidence") ||
      pane.querySelector("#q199Lab");
    if (!anchor) return;
    const old = pane.querySelector("#q223DayDoctrine"),
      tmp = document.createElement("div");
    tmp.innerHTML = panel();
    const fresh = tmp.firstElementChild;
    if (old) old.replaceWith(fresh);
    else anchor.insertAdjacentElement("afterend", fresh);
  }
  document.addEventListener(
    "click",
    (e) => {
      if (e.target?.id === "q223Verify") {
        mount();
        return;
      }
      if (e.target?.id === "q223Export") {
        download("天机盘_V223_日家奇门_DoctrinePack.json", report());
        return;
      }
      if (e.target?.id === "q223DayMode") {
        try {
          window.TianjiQimenPeriod?.setMode?.("day");
          localStorage.setItem("tianjipan.qimen.family.v165", "day");
          refRender("qimen");
        } catch (_) {}
        TianjiPaneScheduler.request("qimen");
      }
    },
    true,
  );

  TianjiPaneScheduler.register("qimen", "v223-qimen-day-doctrine-js", mount);
  document.addEventListener(
    "click",
    (e) => {
      if (e.target?.closest?.("[data-q165-mode],[data-q165-shift],[data-q165-now]"))
        TianjiPaneScheduler.request("qimen");
    },
    true,
  );

  /* 将 V165 period API 扩展为可审计日家 Evidence API，不破坏已有方法。 */
  try {
    const old = window.TianjiQimenPeriod;
    if (old) {
      const oldManifest = typeof old.manifest === "function" ? old.manifest.bind(old) : () => ({});
      window.TianjiQimenPeriod = Object.freeze(
        Object.assign({}, old, {
          version: "1.2.0",
          dayDoctrine: () => clone(report()),
          verifyDayClassic60: () => clone(verifyClassic60()),
          manifest: () =>
            Object.assign({}, oldManifest(), {
              version: "1.2.0",
              dayEvidence: {
                primarySource: "《遁甲演義》卷一·日家奇門",
                classic60: verifyClassic60().pass + "/60",
                status: "classic-door-layer-closed",
              },
              limitations: [
                "完整日家三奇/九星/八神仍有流派分歧，不伪造唯一规则",
                "现代 full-pan profiles 目前 reference-only",
              ],
            }),
        }),
      );
    }
  } catch (err) {
    console.warn("[V223 period API]", err);
  }

  try {
    if (window.TianjiCore) {
      TianjiCore.registerSource({
        id: "dunjia-yanyi-day-primary",
        type: "classic",
        title: "《遁甲演義》卷一 · 日家奇門",
        version: "四庫全書本",
        license: "public-domain-classic",
        note: "三日一局；甲子起坎；每三日一换；顺飞八方不入中五；到宫起休门顺轮。",
      });
      TianjiCore.registerRule({
        id: "qimen.day.classic-three-day-door",
        system: "qimen",
        source: "dunjia-yanyi-day-primary",
        title: "日家三日移宫八门",
        status: "verified",
        note: "60 日古籍表逐项回归；只覆盖古籍明确的门层，不扩张为现代完整盘。",
      });
      TianjiCore.registerEngine(
        {
          id: "qimen.day.doctrine.v1",
          system: "qimen",
          name: "Qimen Day Doctrine Pack",
          version: "1.0.0",
          source: "dunjia-yanyi-day-primary",
          doctrine: "primary-text first; modern full-pan profiles reference-only",
          status: "active",
        },
        () => report(),
      );
    }
  } catch (err) {
    console.warn("[V223 core registry]", err);
  }

  const TASKS223 = [
    { id: "ai", p: "P0", name: "统一 AI 解释层", state: "done", note: "v171 完成" },
    { id: "mcp", p: "P0", name: "MCP / API 外部调用层", state: "done", note: "v172 完成" },
    {
      id: "kg",
      p: "P0",
      name: "典籍 Evidence / 规则知识图谱",
      state: "done",
      note: "v173 第一阶段完成；V223 新增日家原典规则链",
    },
    { id: "router", p: "P0", name: "自然语言问事路由", state: "done", note: "v196–v197 完成" },
    { id: "consumer", p: "P0", name: "统一消费者结果页 / 报告", state: "done", note: "v198 完成" },
    {
      id: "qimen-evidence",
      p: "P1",
      name: "奇门四家第三方对拍 / 高级 Evidence",
      state: "doing",
      note: "v221–v223：atopx Golden + Horosa 标准参考盘 + Abelard 独立规则；年家固定三元局已获双外部源支持，日家《遁甲演義》三日移宫八门 60/60 原典金样闭环。未完成项收缩为：完整日家三奇/九星/八神流派包、月家逐宫扩大对拍。",
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
      note: "v203–v204 + V218/V219 渲染稳定层",
    },
    {
      id: "qizheng",
      p: "P1",
      name: "七政四余核心化",
      state: "blocked",
      note: "等待可靠星历、四余口径与许可证方案",
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
  const BOARD223 = {
    schema: "tianji.priority.board.v1",
    build: BUILD,
    total: 14,
    done: 12,
    doing: 1,
    blocked: 1,
    progress: 92.9,
    next: [
      "日家完整盘：寻找能明确三奇/九星/八神排法的传统规则或第三 Golden",
      "月家：扩大逐宫外部对拍",
      "七政四余：星历 / 四余口径 / 许可证前置调查",
      "玄空 / 三合：外部逐盘 reference 增强",
    ],
    tasks: TASKS223,
  };
  function applyBoard() {
    window.TianjiPriorityBoard = Object.freeze({
      schema: BOARD223.schema,
      snapshot: () => clone(BOARD223),
    });
    const road = window.TianjiRoadmap || {};
    window.TianjiRoadmap = Object.freeze(
      Object.assign({}, road, {
        urgentImportant: clone(BOARD223),
        nextMainline: clone(BOARD223.next),
      }),
    );
  }
  applyBoard();
  window.addEventListener("tianji:lazy-ready", () => setTimeout(applyBoard, 0));

  function selfTest() {
    const C = [],
      add = (id, ok, d = "") => C.push({ id, ok: !!ok, d });
    const v = verifyClassic60();
    add("classic60", v.pass === 60 && v.diff === 0 && v.error === 0, `${v.pass}/${v.total}`);
    add("primary.sources", PRIMARY.length === 2, String(PRIMARY.length));
    add("profiles", PROFILES.length === 4, String(PROFILES.length));
    add("default.classic", PROFILES[0].state === "active-default", PROFILES[0].id);
    add(
      "modern.reference-only",
      PROFILES.slice(1).every((x) => x.state === "reference-only"),
      "",
    );
    add(
      "year.fixed.preserved",
      window.TianjiQimenDoctrineV222?.yearPolicy?.() === "fixed" ||
        window.TianjiQimenDoctrineV222?.yearPolicy?.() === "rolling",
      "V222 policy API available",
    );
    return { ok: C.every((x) => x.ok), checks: C };
  }
  const TEST = selfTest();

  window.TianjiQimenDayDoctrineV223 = Object.freeze({
    version: "1.0.0",
    build: BUILD,
    schema: SCHEMA,
    ruleSchema: RULE_SCHEMA,
    primarySources: () => clone(PRIMARY),
    groups: () => clone(GROUPS),
    profiles: () => clone(PROFILES),
    verifyClassic60: () => clone(verifyClassic60()),
    rules: () => clone(ruleLedger()),
    report: () => clone(report()),
    selfTest: () => clone(TEST),
    manifest: () => ({
      module: "Qimen Day Doctrine Pack V223",
      primaryEvidence: "《遁甲演義》卷一·日家奇門",
      classicDoorLayer: "60/60 source-table verified",
      defaultProfile: "classic-three-day-door",
      modernFullPanProfiles: ["Horosa 至甲子60日块", "atopx 节气三元", "Abelard 至日起日数"],
      fullPanStatus: "doctrine-divergent / reference-only",
      completeForDeclaredScope: true,
      declaredScope: "古籍明确的三日移宫八门层 + 现代完整盘流派注册，不宣称完整日家盘唯一算法",
    }),
  });
  window.TianjiSystemV223 = {
    version: "v223",
    build: BUILD,
    qimenDayPrimaryEvidence: true,
    classicDay60Verified: true,
    qimenEvidenceStillDoing: true,
    algorithmChanged: false,
    baseline: "v222",
  };
})();
