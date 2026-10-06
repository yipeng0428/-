(() => {
  "use strict";
  const BUILD = "v207 · 2026-10-06 15:06 +08:00";
  const SCHEMA = "tianji.sanhe.water.v1";
  const STORE = "tianjipan.sanhe.water.v207";
  const DS = [
    { id: 0, name: "壬子", mountains: ["壬", "子"], center: 0 },
    { id: 1, name: "癸丑", mountains: ["癸", "丑"], center: 22.5 },
    { id: 2, name: "艮寅", mountains: ["艮", "寅"], center: 52.5 },
    { id: 3, name: "甲卯", mountains: ["甲", "卯"], center: 82.5 },
    { id: 4, name: "乙辰", mountains: ["乙", "辰"], center: 112.5 },
    { id: 5, name: "巽巳", mountains: ["巽", "巳"], center: 142.5 },
    { id: 6, name: "丙午", mountains: ["丙", "午"], center: 172.5 },
    { id: 7, name: "丁未", mountains: ["丁", "未"], center: 202.5 },
    { id: 8, name: "坤申", mountains: ["坤", "申"], center: 232.5 },
    { id: 9, name: "庚酉", mountains: ["庚", "酉"], center: 262.5 },
    { id: 10, name: "辛戌", mountains: ["辛", "戌"], center: 292.5 },
    { id: 11, name: "乾亥", mountains: ["乾", "亥"], center: 322.5 },
  ];
  const CS = ["长生", "沐浴", "冠带", "临官", "帝旺", "衰", "病", "死", "墓", "绝", "胎", "养"];
  const JU = {
    火: {
      tomb: 10,
      waterMouth: [10, 11, 0],
      yang: { stem: "丙", start: 2, dir: 1 },
      yin: { stem: "乙", start: 6, dir: -1 },
      tri: "寅午戌",
    },
    水: {
      tomb: 4,
      waterMouth: [4, 5, 6],
      yang: { stem: "壬", start: 8, dir: 1 },
      yin: { stem: "辛", start: 0, dir: -1 },
      tri: "申子辰",
    },
    金: {
      tomb: 1,
      waterMouth: [1, 2, 3],
      yang: { stem: "庚", start: 5, dir: 1 },
      yin: { stem: "丁", start: 9, dir: -1 },
      tri: "巳酉丑",
    },
    木: {
      tomb: 7,
      waterMouth: [7, 8, 9],
      yang: { stem: "甲", start: 11, dir: 1 },
      yin: { stem: "癸", start: 3, dir: -1 },
      tri: "亥卯未",
    },
  };
  const IN_FAV = new Set(["长生", "冠带", "临官", "帝旺"]);
  const OUT_FAV = new Set(["衰", "病", "死", "墓"]);
  let state = { incoming: 60, outgoing: 300, flow: "unknown", manualJu: "auto" };
  try {
    const x = JSON.parse(localStorage.getItem(STORE) || "null");
    if (x) state = { ...state, ...x };
  } catch (_) {}
  const save = () => {
    try {
      localStorage.setItem(STORE, JSON.stringify(state));
    } catch (_) {}
  };
  const clone = (x) => (x == null ? x : JSON.parse(JSON.stringify(x)));
  const e = (s) =>
    String(s ?? "").replace(
      /[&<>"']/g,
      (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
    );
  const norm = (d) => ((Number(d) % 360) + 360) % 360;

  function mtn(deg) {
    return p5Mtn(norm(deg));
  }
  function groupByMountain(name) {
    return DS.find((x) => x.mountains.includes(name)) || null;
  }
  function dsAt(deg) {
    return groupByMountain(mtn(deg).n);
  }
  function inferJu(outDeg) {
    const g = dsAt(outDeg);
    const hits = Object.entries(JU)
      .filter(([, v]) => v.waterMouth.includes(g.id))
      .map(([k, v]) => ({
        ju: k,
        group: g,
        strict: v.tomb === g.id,
        tomb: DS[v.tomb].name,
        tri: v.tri,
      }));
    return hits[0] || null;
  }
  function scheme(ju, polarity) {
    const j = JU[ju],
      meta = j[polarity],
      stages = new Array(12);
    for (let i = 0; i < 12; i++) stages[(meta.start + meta.dir * i + 120) % 12] = CS[i];
    return {
      ju,
      polarity,
      stem: meta.stem,
      start: meta.start,
      dir: meta.dir,
      stages,
      startGroup: DS[meta.start].name,
      tombGroup: DS[j.tomb].name,
      tri: j.tri,
    };
  }
  function locStage(s, deg) {
    const g = dsAt(deg);
    return {
      deg: norm(deg),
      mountain: mtn(deg).n,
      doubleMountain: g.name,
      group: g.id,
      stage: s.stages[g.id],
    };
  }
  function classifyWater(stage, type) {
    if (type === "incoming") {
      if (IN_FAV.has(stage))
        return { tone: "good", label: "生旺来水", text: "属于本页当前口径优先观察的来水阶段。" };
      if (["沐浴", "衰", "养"].includes(stage))
        return {
          tone: "cyan",
          label: "中间阶段",
          text: "不纳入本页“生旺来水”核心集合，需结合具体流派再看。",
        };
      return {
        tone: "bad",
        label: "非生旺来水",
        text: "在本页简化核对规则里不属于长生、冠带、临官、帝旺四类。",
      };
    }
    if (OUT_FAV.has(stage))
      return { tone: "good", label: "衰墓去水", text: "属于本页当前口径优先观察的去水阶段。" };
    if (["绝", "胎", "养"].includes(stage))
      return {
        tone: "cyan",
        label: "墓外水口段",
        text: "常见水口归局资料会把墓、绝、胎附近作为同一局候选区；本页不因此直接判吉。",
      };
    return {
      tone: "bad",
      label: "非衰墓去水",
      text: "在本页简化核对规则里不属于衰、病、死、墓四类。",
    };
  }
  function fit(s, inDeg, outDeg, faceDeg) {
    const incoming = locStage(s, inDeg),
      outgoing = locStage(s, outDeg),
      facing = locStage(s, faceDeg),
      sitting = locStage(s, faceDeg + 180);
    const I = classifyWater(incoming.stage, "incoming"),
      O = classifyWater(outgoing.stage, "outgoing");
    let grade =
      I.tone === "good" && O.tone === "good"
        ? "结构匹配"
        : I.tone === "good" || O.tone === "good"
          ? "部分匹配"
          : "需复核";
    let score =
      (I.tone === "good" ? 2 : I.tone === "cyan" ? 1 : 0) +
      (O.tone === "good" ? 2 : O.tone === "cyan" ? 1 : 0) +
      (outgoing.group === JU[s.ju].tomb ? 1 : 0);
    return {
      scheme: s,
      incoming: { ...incoming, assessment: I },
      outgoing: { ...outgoing, assessment: O },
      facing,
      sitting,
      grade,
      score,
    };
  }
  function chosenJu() {
    if (state.manualJu !== "auto" && JU[state.manualJu])
      return { ju: state.manualJu, source: "manual", inferred: inferJu(state.outgoing) };
    const x = inferJu(state.outgoing);
    return { ju: x?.ju || "火", source: "water-mouth", inferred: x };
  }
  function build() {
    const face = P5.lp?.deg ?? 180,
      choice = chosenJu(),
      ju = choice.ju;
    const candidates = [];
    if (state.flow === "ltr" || state.flow === "unknown")
      candidates.push(fit(scheme(ju, "yang"), state.incoming, state.outgoing, face));
    if (state.flow === "rtl" || state.flow === "unknown")
      candidates.push(fit(scheme(ju, "yin"), state.incoming, state.outgoing, face));
    const inf = choice.inferred,
      kwIn = p5Kongwang(state.incoming, P5.lp?.kw || 1.5),
      kwOut = p5Kongwang(state.outgoing, P5.lp?.kw || 1.5);
    const evidence = [
      {
        id: "input.face",
        claim: `向度 ${norm(face).toFixed(1)}° · ${mtn(face).n}山`,
        formula: "复用综合罗盘当前向度",
        state: "deterministic",
      },
      {
        id: "input.water",
        claim: `来水 ${norm(state.incoming).toFixed(1)}° / 去水口 ${norm(state.outgoing).toFixed(1)}°`,
        formula: "度数 → 24山 → 双山",
        state: "deterministic",
      },
      {
        id: "ju.infer",
        claim: `${inf ? `水口落${inf.group.name}，候选${inf.ju}局${inf.strict ? "（墓口）" : "（墓绝胎段）"}` : "未归局"}`,
        formula: "辛戌/乾亥/壬子→火；乙辰/巽巳/丙午→水；癸丑/艮寅/甲卯→金；丁未/坤申/庚酉→木",
        state: "school-policy",
      },
      {
        id: "double.mountain",
        claim: "24山归并为12组双山",
        formula: "壬子、癸丑、艮寅、甲卯、乙辰、巽巳、丙午、丁未、坤申、庚酉、辛戌、乾亥",
        state: "school-policy",
      },
      {
        id: "changsheng",
        claim: `${ju}局十二长生按${state.flow === "rtl" ? "阴干逆布" : state.flow === "ltr" ? "阳干顺布" : "阳干顺布 / 阴干逆布双列"}核对`,
        formula: "长生→沐浴→冠带→临官→帝旺→衰→病→死→墓→绝→胎→养",
        state: "school-policy",
      },
      {
        id: "external.validation",
        claim: "三合水法尚未做独立第三方软件逐盘对拍",
        formula: "后续以独立软件 / 人工金样逐字段验证",
        state: "pending",
      },
    ];
    return {
      schema: SCHEMA,
      build: BUILD,
      face: norm(face),
      state: clone(state),
      ju,
      juSource: choice.source,
      inference: inf,
      candidates,
      waterWarnings: { incoming: kwIn, outgoing: kwOut },
      evidence,
      policy: {
        waterMouth: "四大局候选采用常见“墓、绝、胎水口段”归局法；墓口为最强识别点。",
        flow: "左水倒右→阳干顺布；右水倒左→阴干逆布。流向不确定时双列，不强行选一盘。",
        incoming: "核心来水集合：长生、冠带、临官、帝旺。",
        outgoing: "核心去水集合：衰、病、死、墓。",
        scope:
          "这里只实现三合双山十二长生水法的确定性骨架；三吉六秀、黄泉、救贫黄泉、十二向细法等未在 Evidence 完成前强行并入。",
      },
    };
  }
  function stageGrid(C) {
    const s = C.scheme,
      faceG = C.facing.group,
      inG = C.incoming.group,
      outG = C.outgoing.group;
    return `<div class="sh207-12">${DS.map((g) => `<div class="sh207-ds${g.id === inG ? " in" : ""}${g.id === outG ? " out" : ""}${g.id === faceG ? " face" : ""}"><strong>${e(g.name)}</strong><span>${e(s.stages[g.id])}</span><small>${g.id === inG ? "来水 " : ""}${g.id === outG ? "去水 " : ""}${g.id === faceG ? "向 " : ""}</small></div>`).join("")}</div>`;
  }
  function candidateHTML(C) {
    const s = C.scheme,
      I = C.incoming,
      O = C.outgoing,
      F = C.facing,
      S = C.sitting;
    return `<div class="sh207-item ${C.grade === "结构匹配" ? "good" : C.grade === "部分匹配" ? "cyan" : "bad"}">
    <b>${e(s.ju)}局 · ${s.polarity === "yang" ? "阳干" : "阴干"} ${s.stem} · ${s.dir === 1 ? "顺布" : "逆布"} · ${e(C.grade)}</b>
    <small>${e(s.stem)}${s.ju}：长生起 ${e(s.startGroup)}，墓在 ${e(s.tombGroup)}，三合 ${e(s.tri)}。结构指数 ${C.score}（只用于当前规则核对，不是概率）。</small>
    <div class="sh207-stage" style="margin-top:6px">
      <div class="${I.assessment.tone}"><small>来水 ${I.doubleMountain}</small><b>${I.stage}</b></div>
      <div class="${O.assessment.tone}"><small>去水 ${O.doubleMountain}</small><b>${O.stage}</b></div>
      <div class="cyan"><small>向 ${F.doubleMountain}</small><b>${F.stage}</b></div>
      <div><small>坐 ${S.doubleMountain}</small><b>${S.stage}</b></div>
    </div>
    <div class="sh207-note" style="margin-top:6px">来水：${e(I.assessment.label)}；去水：${e(O.assessment.label)}。${e(I.assessment.text)} ${e(O.assessment.text)}</div>
    <div style="margin-top:6px">${stageGrid(C)}</div>
  </div>`;
  }
  function plain(D) {
    const inf = D.inference,
      c = D.candidates;
    const base = `当前综合罗盘向度为 ${D.face.toFixed(1)}°，来水 ${D.state.incoming.toFixed(1)}°，去水口 ${D.state.outgoing.toFixed(1)}°。${inf ? `去水落在${inf.group.name}，按当前水口归局规则先列为${inf.ju}局${inf.strict ? "墓口" : "候选段"}。` : ""}`;
    if (D.state.flow === "unknown")
      return (
        base +
        `水势左右尚未确定，所以系统同时列出阳干顺布与阴干逆布两套十二长生，不替用户猜流向。两套结果只是传统水法的结构核对，不能替代现场测水、地形、排水安全与建筑规范。`
      );
    const x = c[0];
    return (
      base +
      `按${D.state.flow === "ltr" ? "左水倒右→阳干顺布" : "右水倒左→阴干逆布"}，来水处于${x.incoming.stage}，去水处于${x.outgoing.stage}，当前机械判断为“${x.grade}”。这不是现实吉凶结论，只说明来去水是否落进本页声明的生旺/衰墓集合。`
    );
  }
  function panel() {
    const D = build(),
      inf = D.inference;
    return `<section class="sh207" id="sh207Core">
    <section class="sh207-hero"><div class="sh207-head"><div><h3>三合水法 Core · 双山 / 四大水局 / 十二长生</h3><p>从实际方位开始：输入来水和去水口度数，先归二十四山与双山，再由水口候选四大局；水势明确时按“左水倒右→阳干顺布、右水倒左→阴干逆布”排十二长生。流向不确定时双列两套结果，不替用户猜。不同三合派别另有天盘/地盘、龙法、向法和黄泉等细则，本页只做当前声明的水法骨架。</p></div><span class="sh207-schema">${SCHEMA}</span></div>
    <div class="sh207-tools">
      <label>来水方位°<input id="sh207In" type="number" min="0" max="359.9" step="0.1" value="${D.state.incoming.toFixed(1)}"></label>
      <label>去水口°<input id="sh207Out" type="number" min="0" max="359.9" step="0.1" value="${D.state.outgoing.toFixed(1)}"></label>
      <label>水势<select id="sh207Flow"><option value="unknown"${D.state.flow === "unknown" ? " selected" : ""}>不确定 · 双列</option><option value="ltr"${D.state.flow === "ltr" ? " selected" : ""}>左水倒右 · 阳干</option><option value="rtl"${D.state.flow === "rtl" ? " selected" : ""}>右水倒左 · 阴干</option></select></label>
      <label>四大局<select id="sh207Ju"><option value="auto"${D.state.manualJu === "auto" ? " selected" : ""}>按水口自动</option>${["水", "木", "火", "金"].map((j) => `<option value="${j}"${D.state.manualJu === j ? " selected" : ""}>${j}局</option>`).join("")}</select></label>
      <button id="sh207FaceIn" type="button">用当前向度作来水</button><button id="sh207FaceOut" type="button">用当前向度作去水</button><button id="sh207Copy" type="button">复制 Core Schema</button>
    </div></section>

    <div class="sh207-kpis">
      <div class="sh207-kpi cyan"><small>候选水局</small><b>${e(D.ju)}局</b></div>
      <div class="sh207-kpi"><small>水口双山</small><b>${e(dsAt(D.state.outgoing).name)}</b></div>
      <div class="sh207-kpi ${inf?.strict ? "good" : "cyan"}"><small>归局强度</small><b>${inf?.strict ? "墓口" : "墓绝胎段"}</b></div>
      <div class="sh207-kpi"><small>来水双山</small><b>${e(dsAt(D.state.incoming).name)}</b></div>
      <div class="sh207-kpi"><small>当前向</small><b>${e(mtn(D.face).n)}山</b></div>
      <div class="sh207-kpi bad"><small>外部对拍</small><b>待验证</b></div>
    </div>

    <div class="sh207-grid">
      <section class="sh207-card"><h4>十二长生 · 当前候选</h4><div class="sh207-list">${D.candidates.map(candidateHTML).join("")}</div></section>
      <aside class="sh207-card"><h4>水口与坐向联动</h4><div class="sh207-list">
        <div class="sh207-item cyan"><b>去水口：${e(mtn(D.state.outgoing).n)}山 · ${e(dsAt(D.state.outgoing).name)}</b><small>${inf ? `自动归为 ${inf.ju}局 ${inf.strict ? "墓口" : "墓/绝/胎候选段"}，该局三合 ${inf.tri}，墓库 ${e(inf.tomb)}。` : "未能自动归局。"}</small></div>
        <div class="sh207-item good"><b>来水：${e(mtn(D.state.incoming).n)}山 · ${e(dsAt(D.state.incoming).name)}</b><small>具体“生、旺、墓、绝”必须随当前阳/阴干水法而变化，所以不脱离所选水势单独判断。</small></div>
        <div class="sh207-item gold"><b>向：${e(mtn(D.face).n)}山 · 坐：${e(mtn(D.face + 180).n)}山</b><small>只显示它们在当前十二长生盘的位置，V207 不把某一个“向上长生名”直接写成吉凶立向结论。</small></div>
        ${D.waterWarnings.incoming ? `<div class="sh207-item bad"><b>来水接近 ${e(D.waterWarnings.incoming.type)}</b><small>距分界约 ${D.waterWarnings.incoming.dist.toFixed(1)}°，建议现场复测。</small></div>` : ""}
        ${D.waterWarnings.outgoing ? `<div class="sh207-item bad"><b>去水口接近 ${e(D.waterWarnings.outgoing.type)}</b><small>距分界约 ${D.waterWarnings.outgoing.dist.toFixed(1)}°，水口归山可能受测量误差影响。</small></div>` : ""}
      </div></aside>
    </div>

    <div class="sh207-grid">
      <section class="sh207-card"><h4>大白话</h4><div class="sh207-plain">${e(plain(D))}</div><div class="sh207-note" style="margin-top:7px">现实中的“来水/去水”必须先由现场地形或真实排水路径确认。城市住宅里的道路、下水管、泳池、景观水体不能自动等同传统阴宅水口。本模块只负责把用户确认过的方位代入所声明的传统规则。</div></section>
      <aside class="sh207-card"><h4>当前范围</h4><div class="sh207-list">
        <div class="sh207-item good"><b>已实现</b><small>二十四山→双山、四大水局候选、阳/阴八局十二长生、来水/去水阶段、坐向联动、分界复测、Evidence Schema。</small></div>
        <div class="sh207-item cyan"><b>暂不强行纳入</b><small>三吉六秀、黄泉/救贫黄泉、龙法、分金、十二向细法、不同派别的天盘缝针取水等，需要继续建立来源和交叉验证后再进入核心。</small></div>
      </div></aside>
    </div>

    <section class="sh207-card"><h4>Evidence / 流派口径</h4><div class="sh207-audit">${D.evidence.map((x) => `<div class="sh207-ev"><b>${e(x.id)}</b><small>${e(x.claim)}<br><span class="sh207-formula">${e(x.formula)}</span></small><span class="sh207-state ${x.state === "pending" ? "pending" : ""}">${x.state === "deterministic" ? "确定性字段" : x.state === "school-policy" ? "流派规则" : "待外部验证"}</span></div>`).join("")}</div></section>
  </section>`;
  }
  function bind() {
    document.getElementById("sh207In")?.addEventListener("change", (ev) => {
      state.incoming = norm(+ev.target.value || 0);
      save();
      refRender("luopan");
    });
    document.getElementById("sh207Out")?.addEventListener("change", (ev) => {
      state.outgoing = norm(+ev.target.value || 0);
      save();
      refRender("luopan");
    });
    document.getElementById("sh207Flow")?.addEventListener("change", (ev) => {
      state.flow = ev.target.value;
      save();
      refRender("luopan");
    });
    document.getElementById("sh207Ju")?.addEventListener("change", (ev) => {
      state.manualJu = ev.target.value;
      save();
      refRender("luopan");
    });
    document.getElementById("sh207FaceIn")?.addEventListener("click", () => {
      state.incoming = norm(P5.lp?.deg || 0);
      save();
      refRender("luopan");
    });
    document.getElementById("sh207FaceOut")?.addEventListener("click", () => {
      state.outgoing = norm(P5.lp?.deg || 0);
      save();
      refRender("luopan");
    });
    document.getElementById("sh207Copy")?.addEventListener("click", () =>
      navigator.clipboard
        ?.writeText?.(JSON.stringify(build(), null, 2))
        .then(() => {
          try {
            toast("已复制三合水法 Core Schema");
          } catch (_) {}
        })
        .catch(() => {}),
    );
  }
  try {
    const oldP = REF_PANES.luopan;
    if (oldP && !oldP.__v207) {
      const fn = () => oldP() + panel();
      fn.__v207 = true;
      REF_PANES.luopan = fn;
    }
    const oldB = REF_BIND.luopan;
    const bf = () => {
      try {
        oldB && oldB();
      } catch (err) {
        console.warn("[V207 old luopan bind]", err);
      }
      try {
        bind();
      } catch (err) {
        console.warn("[V207 sanhe bind]", err);
      }
    };
    bf.__v207 = true;
    REF_BIND.luopan = bf;
  } catch (err) {
    console.warn("[V207 sanhe patch]", err);
  }

  function selfTest() {
    const C = [],
      add = (id, ok, d = "") => C.push({ id, ok: !!ok, d });
    try {
      add("double-mountain.count", DS.length === 12, String(DS.length));
      add(
        "mountain.partition",
        DS.flatMap((x) => x.mountains).length === 24,
        String(DS.flatMap((x) => x.mountains).length),
      );
      add("ju.partition", new Set(Object.values(JU).flatMap((x) => x.waterMouth)).size === 12, "");
      const fireY = scheme("火", "yang"),
        fireN = scheme("火", "yin");
      add(
        "fire.yang",
        fireY.stages[2] === "长生" && fireY.stages[6] === "帝旺" && fireY.stages[10] === "墓",
        JSON.stringify(fireY.stages),
      );
      add(
        "fire.yin",
        fireN.stages[6] === "长生" && fireN.stages[2] === "帝旺" && fireN.stages[10] === "墓",
        JSON.stringify(fireN.stages),
      );
      const waterY = scheme("水", "yang");
      add(
        "water.yang",
        waterY.stages[8] === "长生" && waterY.stages[0] === "帝旺" && waterY.stages[4] === "墓",
        JSON.stringify(waterY.stages),
      );
      add(
        "mouth.infer",
        inferJu(300)?.ju === "火" &&
          inferJu(120)?.ju === "水" &&
          inferJu(30)?.ju === "金" &&
          inferJu(210)?.ju === "木",
        "",
      );
    } catch (err) {
      add("exception", false, String((err && err.message) || err));
    }
    return { ok: C.every((x) => x.ok), checks: C };
  }
  const TEST = selfTest();

  const TASKS207 = [
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
      state: "doing",
      note: "v207 一期：二十四山双山、四大水局候选、阳/阴八局十二长生、来去水、坐向联动与 Evidence；后续补三吉六秀/黄泉等流派层与第三方对拍",
    },
    {
      id: "tz",
      p: "P2",
      name: "历史时区 / 夏令时自动校正",
      state: "todo",
      note: "历史时区数据库待接入",
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
    done: 8,
    doing: 2,
    blocked: 1,
    progress: 64.3,
    next: [
      "三合水法二期：流派规则 / 对拍 Evidence",
      "奇门日/月/年真实第三方 reference 样本",
      "历史时区 / DST",
    ],
    tasks: TASKS207,
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
          "三合水法二期：三吉六秀 / 黄泉等流派规则与 Evidence",
          "奇门四家第三方对拍（二期待外部样本）",
          "历史时区 / DST",
          "关系长期时间轴",
        ],
      }),
    );
  }
  applyBoard();
  window.addEventListener("tianji:lazy-ready", () => setTimeout(applyBoard, 0));

  window.TianjiSanheWaterCore = Object.freeze({
    version: "1.0.0",
    build: BUILD,
    schema: SCHEMA,
    analyze: () => clone(build()),
    inferJu: (d) => clone(inferJu(d)),
    scheme: (ju, polarity) => clone(scheme(ju, polarity)),
    stage: (ju, polarity, d) => clone(locStage(scheme(ju, polarity), d)),
    selfTest: () => clone(TEST),
    manifest: () => ({
      module: "Tianji Sanhe Water Core",
      implemented: [
        "二十四山→双山",
        "四大水局候选",
        "阳干顺布/阴干逆布",
        "十二长生",
        "来水/去水",
        "坐向联动",
        "分界复测",
        "Evidence",
      ],
      schoolPolicy:
        "双山三合十二长生水法；左水倒右用阳干顺布，右水倒左用阴干逆布；水口按墓绝胎段候选四局。",
      remaining: ["三吉六秀", "黄泉/救贫黄泉", "龙法/向法细层", "天盘缝针版本化", "第三方逐盘对拍"],
    }),
  });
  window.TianjiSystemV207 = {
    version: "v207",
    build: BUILD,
    sanheWaterCore: true,
    noticeQuietDefault: true,
    baseline: "v206",
  };

  function sync() {
    const b = document.getElementById("buildVersion");
  }
  /* V226: historical delayed version writer disabled */
})();
