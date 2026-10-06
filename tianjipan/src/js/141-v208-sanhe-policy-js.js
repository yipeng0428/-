(() => {
  "use strict";
  const BUILD = "v208 · 2026-10-06 15:42 +08:00";
  const SCHEMA = "tianji.sanhe.policy.v1";
  const STORE = "tianjipan.sanhe.policy.v208";

  const PLATE = {
    earth: { name: "地盘正针", shift: 0, use: "格龙 / 立向" },
    heaven: { name: "天盘缝针", shift: -7.5, use: "纳水 / 去水" },
    human: { name: "人盘中针", shift: 7.5, use: "消砂" },
  };

  /* 三吉六秀：九星翻卦研究表。
   这里把卦名换成 24 山中心字：震=卯、坎=子、离=午、兑=酉。 */
  const DRAGON_PACKS = [
    {
      id: "qian-jia",
      name: "乾甲来龙",
      dragon: ["乾", "甲"],
      three: ["酉", "卯", "艮"],
      six: ["丁", "庚", "丙"],
    },
    {
      id: "zhen-geng-hai-wei",
      name: "震庚亥未来龙",
      dragon: ["卯", "庚", "亥", "未"],
      three: ["午", "乾", "子"],
      six: ["壬", "甲", "癸"],
    },
    {
      id: "kan-gui-shen-chen",
      name: "坎癸申辰来龙",
      dragon: ["子", "癸", "申", "辰"],
      three: ["巽", "艮", "卯"],
      six: ["辛", "丙", "庚"],
    },
    {
      id: "gen-bing",
      name: "艮丙来龙",
      dragon: ["艮", "丙"],
      three: ["坤", "子", "乾"],
      six: ["乙", "癸", "甲"],
    },
    {
      id: "kun-yi",
      name: "坤乙来龙",
      dragon: ["坤", "乙"],
      three: ["艮", "巽", "酉"],
      six: ["丙", "辛", "丁"],
    },
    {
      id: "xun-xin",
      name: "巽辛来龙",
      dragon: ["巽", "辛"],
      three: ["子", "坤", "午"],
      six: ["癸", "乙", "壬"],
    },
    {
      id: "li-ren-yin-xu",
      name: "离壬寅戌来龙",
      dragon: ["午", "壬", "寅", "戌"],
      three: ["卯", "酉", "巽"],
      six: ["庚", "丁", "辛"],
    },
    {
      id: "dui-ding-si-chou",
      name: "兑丁巳丑来龙",
      dragon: ["酉", "丁", "巳", "丑"],
      three: ["乾", "午", "坤"],
      six: ["甲", "壬", "乙"],
    },
  ];

  /* 经典“庚丁坤、乙丙巽、甲癸艮、辛壬乾”只做方位配对索引。
   来/去水的吉凶采用下方长生黄泉规则单独判断，避免把存在争议的口诀解释混成唯一答案。 */
  const HQ_PAIR = {
    庚: [8],
    丁: [8],
    乙: [5],
    丙: [5],
    甲: [2],
    癸: [2],
    辛: [11],
    壬: [11],
    坤: [9, 7],
    巽: [4, 6],
    艮: [3, 1],
    乾: [10, 0],
  };

  const REF208 = [
    {
      id: "three-plates",
      name: "三合罗盘天地人三盘公开资料交叉核对",
      role: "地盘立向/格龙；天盘收水；人盘消砂；两辅盘相对地盘约±7.5°",
      grade: "secondary-crosscheck",
    },
    {
      id: "sanji-liuxiu",
      name: "三吉六秀九星翻卦表公开资料交叉核对",
      role: "按来龙组推三吉与六秀方",
      grade: "secondary-crosscheck",
    },
    {
      id: "huangquan",
      name: "杀人大黄泉 / 救贫黄泉公开资料交叉核对",
      role: "旺向临官来去、墓向绝位去水等规则",
      grade: "secondary-crosscheck",
    },
  ];

  let S = {
    waterPlate: "heaven",
    sandPlate: "human",
    dragonDeg: null,
    peaks: "",
    showClassicPair: true,
  };
  try {
    const x = JSON.parse(localStorage.getItem(STORE) || "null");
    if (x) S = { ...S, ...x };
  } catch (_) {}
  const save = () => {
    try {
      localStorage.setItem(STORE, JSON.stringify(S));
    } catch (_) {}
  };
  const clone = (x) => (x == null ? x : JSON.parse(JSON.stringify(x)));
  const e = (s) =>
    String(s ?? "").replace(
      /[&<>"']/g,
      (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
    );
  const norm = (d) => ((Number(d) % 360) + 360) % 360;
  const api = () => window.TianjiSanheWaterCore || null;

  function onPlate(deg, plate) {
    const P = PLATE[plate] || PLATE.earth,
      physical = norm(deg),
      effective = norm(physical + P.shift),
      m = p5Mtn(effective);
    return {
      plate,
      plateName: P.name,
      use: P.use,
      physical,
      effective,
      mountain: m.n,
      pal: m.pal,
      gua: m.gua,
      double: api()?.stage?.("火", "yang", effective)?.doubleMountain || "",
    };
  }
  function parsePeaks(txt) {
    return String(txt || "")
      .split(/[，,、\s]+/)
      .map((x) => Number(x))
      .filter(Number.isFinite)
      .map(norm)
      .slice(0, 12);
  }
  function dragonPack(name) {
    return DRAGON_PACKS.find((x) => x.dragon.includes(name)) || null;
  }
  function peakAudit(dragonDeg, peakText) {
    if (!Number.isFinite(dragonDeg))
      return { available: false, reason: "尚未输入来龙方位", dragon: null, pack: null, peaks: [] };
    const D = onPlate(dragonDeg, "earth"),
      pack = dragonPack(D.mountain),
      peaks = parsePeaks(peakText).map((deg) => {
        const P = onPlate(deg, S.sandPlate),
          kind = pack?.three.includes(P.mountain)
            ? "三吉"
            : pack?.six.includes(P.mountain)
              ? "六秀"
              : "普通方位";
        return { ...P, kind, hit: kind !== "普通方位" };
      });
    return {
      available: !!pack,
      dragon: D,
      pack,
      peaks,
      reason: pack ? "" : "当前来龙山未匹配三吉六秀研究表",
    };
  }
  function flowCandidates(base) {
    const A = api();
    if (!A || !base) return [];
    const inP = onPlate(base.state.incoming, S.waterPlate),
      outP = onPlate(base.state.outgoing, S.waterPlate);
    const inferred = A.inferJu(outP.effective);
    const ju = base.state.manualJu !== "auto" ? base.state.manualJu : inferred?.ju || base.ju;
    const pols =
      base.state.flow === "ltr" ? ["yang"] : base.state.flow === "rtl" ? ["yin"] : ["yang", "yin"];
    return pols.map((polarity) => {
      const scheme = A.scheme(ju, polarity);
      return {
        polarity,
        scheme,
        ju,
        incoming: A.stage(ju, polarity, inP.effective),
        outgoing: A.stage(ju, polarity, outP.effective),
        facing: A.stage(ju, polarity, base.face),
        sitting: A.stage(ju, polarity, base.face + 180),
        input: { incoming: inP, outgoing: outP },
      };
    });
  }
  function hqClassic(base, C) {
    const face = p5Mtn(base.face).n,
      target = HQ_PAIR[face] || [],
      inId = C.incoming.group,
      outId = C.outgoing.group;
    if (!target.length) return [];
    const out = [];
    if (target.includes(inId))
      out.push({
        type: "classic-pair",
        tone: "cyan",
        name: "经典黄泉口诀方位配对 · 来水命中",
        text: `${face}向与${C.incoming.doubleMountain}来水构成经典口诀中的方位配对。这里只标记“配对命中”，不单凭口诀判断吉凶。`,
      });
    if (target.includes(outId))
      out.push({
        type: "classic-pair",
        tone: "cyan",
        name: "经典黄泉口诀方位配对 · 去水命中",
        text: `${face}向与${C.outgoing.doubleMountain}去水构成经典口诀中的方位配对。最终仍以当前流向和十二长生阶段判读。`,
      });
    return out;
  }
  function hqRules(base, C) {
    const out = [],
      flow = base.state.flow,
      faceM = p5Mtn(base.face).n;
    const F = C.facing.stage,
      I = C.incoming.stage,
      O = C.outgoing.stage;
    if (flow === "ltr" && F === "帝旺" && I === "临官") {
      out.push({
        type: "rescue",
        tone: "good",
        name: "救贫黄泉 · 旺向临官来水",
        text: `当前为左水倒右；向上为帝旺，来水落临官。按本规则包记为“旺向临官水来”的救贫黄泉结构。`,
      });
    }
    if (flow === "rtl" && F === "帝旺" && O === "临官") {
      out.push({
        type: "killing",
        tone: "bad",
        name: "杀人大黄泉 · 旺向临官去水",
        text: `当前为右水倒左；向上为帝旺，去水落临官。按本规则包记为“冲破临官”的杀人大黄泉结构。`,
      });
    }
    if (flow === "ltr" && ["乙", "辛", "丁", "癸"].includes(faceM) && F === "墓" && O === "绝") {
      out.push({
        type: "rescue",
        tone: "good",
        name: "救贫黄泉 · 墓向绝位去水",
        text: `当前${faceM}向为墓向，左水倒右，去水落绝位；符合本规则包采用的“四阴干墓向出绝位”救贫黄泉条款。`,
      });
    }
    if (flow === "rtl" && F === "墓" && I === "绝" && O.group === C.facing.group) {
      out.push({
        type: "killing",
        tone: "bad",
        name: "杀人大黄泉 · 绝水倒冲墓库",
        text: `当前墓向右水倒左，绝位来水并从向上当面出去；本规则包标记为“绝水倒冲墓库”。`,
      });
    }
    if (flow === "unknown") {
      out.push({
        type: "inactive",
        tone: "cyan",
        name: "黄泉规则暂不激活",
        text: "当前水势方向设置为“不确定”。系统只展示阳/阴两套长生位置，不在缺少流向时强行判“杀人/救贫黄泉”。",
      });
    }
    if (S.showClassicPair) out.push(...hqClassic(base, C));
    return out;
  }
  function plateRows(base) {
    const face = onPlate(base.face, "earth"),
      incoming = onPlate(base.state.incoming, S.waterPlate),
      outgoing = onPlate(base.state.outgoing, S.waterPlate);
    const dragon = Number.isFinite(S.dragonDeg) ? onPlate(S.dragonDeg, "earth") : null;
    return { face, incoming, outgoing, dragon };
  }
  function validationTemplate(D) {
    return {
      schema: "tianji.sanhe.policy.crosscheck.request.v1",
      build: BUILD,
      warning:
        "expected 必须来自独立三合软件、人工金样或另一套独立实现；不要把 Tianji snapshot 复制进 expected。",
      input: {
        facing_degree: D.base.face,
        incoming_degree: D.base.state.incoming,
        outgoing_degree: D.base.state.outgoing,
        flow: D.base.state.flow,
        water_plate: S.waterPlate,
        dragon_degree: Number.isFinite(S.dragonDeg) ? S.dragonDeg : null,
        sand_plate: S.sandPlate,
        peak_degrees: parsePeaks(S.peaks),
      },
      tianji_snapshot: {
        ju: D.candidates.map((x) => x.ju),
        candidates: D.candidates.map((x) => ({
          polarity: x.polarity,
          stem: x.scheme.stem,
          incoming: x.incoming,
          outgoing: x.outgoing,
          facing: x.facing,
        })),
        huangquan: D.huangquan,
        sanji_liuxiu: D.sanji,
      },
      expected: {},
      source: { name: "", version: "", url: "", note: "" },
    };
  }
  function build() {
    const base = api()?.analyze?.();
    if (!base)
      return { schema: SCHEMA, build: BUILD, available: false, reason: "V207 三合 Core 不可用" };
    const candidates = flowCandidates(base),
      hq = candidates.flatMap((C) =>
        hqRules(base, C).map((x) => ({
          ...x,
          polarity: C.polarity,
          stem: C.scheme.stem,
          ju: C.ju,
        })),
      );
    const sanji = peakAudit(Number(S.dragonDeg), S.peaks),
      plates = plateRows(base);
    const evidence = [
      {
        id: "three-plates",
        claim: `立向用${plates.face.plateName}；来去水按${plates.incoming.plateName}解释；砂峰按${PLATE[S.sandPlate].name}解释`,
        formula:
          "地盘=0°；天盘标签相对地盘前移7.5°→物理方位映射时 effective=deg-7.5°；人盘反向半格→effective=deg+7.5°",
        state: "school-policy",
      },
      {
        id: "huangquan.stage",
        claim: "杀人/救贫黄泉按“流向 + 向上十二长生 + 来去水阶段”判断",
        formula:
          "旺向(帝旺)：临官来水→救贫；临官去水→杀人。墓向扩展：绝位去水/绝水倒冲墓库按规则包识别",
        state: "school-policy",
      },
      {
        id: "huangquan.classic",
        claim: "庚丁坤、乙丙巽、甲癸艮、辛壬乾只作为经典口诀方位索引",
        formula: "口诀配对 ≠ 自动吉凶；来/去含义交由长生规则判读",
        state: "school-policy",
      },
      {
        id: "sanji-liuxiu",
        claim: "三吉六秀按来龙组 + 人盘砂峰方位核对",
        formula: "九星翻卦表：贪狼/巨门/武曲为三吉，再取对应纳甲干为六秀",
        state: "school-policy",
      },
      {
        id: "external.validation",
        claim: "V208 流派规则尚未完成独立第三方逐盘对拍",
        formula: "待三合软件 / 师承金样 / 另一独立实现逐字段对拍",
        state: "pending",
      },
    ];
    const D = {
      schema: SCHEMA,
      build: BUILD,
      available: true,
      base,
      state: clone(S),
      plates,
      candidates,
      huangquan: hq,
      sanji,
      evidence,
      references: clone(REF208),
    };
    D.validationTemplate = validationTemplate(D);
    const activeHQ = hq.filter((x) => x.type === "killing" || x.type === "rescue");
    const peakHits = sanji.peaks?.filter((x) => x.hit) || [];
    D.plain = `本页把 V207 的双山十二长生继续拆成三层：先明确罗盘层次，再判断黄泉水法，最后把来龙与砂峰交给三吉六秀规则。当前${S.waterPlate === "heaven" ? "按天盘缝针收水" : "按地盘正针解释水位"}；${base.state.flow === "unknown" ? "水势方向未定，因此黄泉吉凶暂不激活。" : `已识别 ${activeHQ.length} 条黄泉专项结构。`}${sanji.available ? ` 来龙为${sanji.dragon.mountain}，对应${sanji.pack.name}；已输入${sanji.peaks.length}个砂峰，其中${peakHits.length}个命中三吉或六秀。` : " 三吉六秀尚未形成完整输入：需要明确来龙度数，并可选填一个或多个砂峰度数。"}所有“吉/凶”文字都是所选传统规则的标签，不替代现场地形、排水、安全与建筑规范。`;
    return D;
  }
  function hqHTML(D) {
    if (!D.huangquan.length)
      return '<div class="sh208-note">当前没有命中黄泉专项规则或经典口诀配对。</div>';
    return D.huangquan
      .map(
        (x) =>
          `<div class="sh208-hqrow ${x.tone}"><b>${e(x.name)} · ${x.stem}${x.ju}局</b><small>${e(x.text)}</small></div>`,
      )
      .join("");
  }
  function sanjiHTML(D) {
    const A = D.sanji;
    if (!A.available)
      return `<div class="sh208-note">${e(A.reason)}。来龙请按地盘正针实测；砂峰可输入多个物理方位度数，用逗号分隔。</div>`;
    return `<div class="sh208-item gold"><b>${e(A.pack.name)} · 来龙 ${e(A.dragon.mountain)}山</b><small>三吉：${e(A.pack.three.join("、"))}；六秀：${e(A.pack.six.join("、"))}。砂峰默认用${e(PLATE[S.sandPlate].name)}判字。</small></div>
    <div class="sh208-peaks">${A.peaks.length ? A.peaks.map((p) => `<div class="sh208-peak ${p.hit ? "good" : ""}"><b>${p.physical.toFixed(1)}°</b><span>${e(p.mountain)}山</span><small>${e(p.plateName)} · 折算 ${p.effective.toFixed(1)}°</small><strong>${e(p.kind)}</strong></div>`).join("") : '<div class="sh208-note">尚未输入砂峰方位。</div>'}</div>`;
  }
  function plateHTML(D) {
    const P = D.plates;
    const cell = (x) =>
      `<div><b>${e(x.mountain)}山</b><small>物理 ${x.physical.toFixed(1)}° → 盘面 ${x.effective.toFixed(1)}°</small></div>`;
    return `<div class="sh208-plate">
    <div class="hd">对象</div><div class="hd">采用盘层</div><div class="hd">山位</div><div class="hd">用途</div>
    <div><b>坐向</b></div><div>${e(P.face.plateName)}</div>${cell(P.face)}<div><small>${e(P.face.use)}</small></div>
    <div><b>来水</b></div><div>${e(P.incoming.plateName)}</div>${cell(P.incoming)}<div><small>${e(P.incoming.use)}</small></div>
    <div><b>去水</b></div><div>${e(P.outgoing.plateName)}</div>${cell(P.outgoing)}<div><small>${e(P.outgoing.use)}</small></div>
    ${P.dragon ? `<div><b>来龙</b></div><div>${e(P.dragon.plateName)}</div>${cell(P.dragon)}<div><small>${e(P.dragon.use)}</small></div>` : ""}
  </div>`;
  }
  function panel() {
    const D = build();
    if (!D.available)
      return `<section class="sh208"><div class="sh208-note">${e(D.reason)}</div></section>`;
    const activeHQ = D.huangquan.filter((x) => x.type === "killing" || x.type === "rescue");
    const hitPeaks = D.sanji.peaks?.filter((x) => x.hit).length || 0;
    return `<section class="sh208" id="sh208Policy">
    <section class="sh208-hero"><div class="sh208-head"><div><h3>三合水法二期 · 三盘 / 黄泉 / 三吉六秀</h3><p>把流派差异显式拆开：地盘正针负责格龙立向；收水可切换天盘缝针；消砂可切换人盘中针。黄泉不再只靠一句口诀，而是结合水势方向和十二长生阶段；三吉六秀单独作为来龙—砂峰规则，不与水口混算。V208 仍把所有流派规则与第三方验证状态分开。</p></div><span class="sh208-schema">${SCHEMA}</span></div>
    <div class="sh208-tools">
      <label>收水盘<select id="sh208WaterPlate"><option value="heaven"${S.waterPlate === "heaven" ? " selected" : ""}>天盘缝针 · 默认</option><option value="earth"${S.waterPlate === "earth" ? " selected" : ""}>地盘正针</option></select></label>
      <label>消砂盘<select id="sh208SandPlate"><option value="human"${S.sandPlate === "human" ? " selected" : ""}>人盘中针 · 默认</option><option value="earth"${S.sandPlate === "earth" ? " selected" : ""}>地盘正针</option></select></label>
      <label>来龙方位°<input id="sh208Dragon" type="number" min="0" max="359.9" step="0.1" placeholder="留空=未知" value="${Number.isFinite(S.dragonDeg) ? Number(S.dragonDeg).toFixed(1) : ""}"></label>
      <label>砂峰方位°<input id="sh208Peaks" class="wide" type="text" placeholder="如 45, 135, 270" value="${e(S.peaks)}"></label>
      <button id="sh208SitDragon" type="button">用当前坐山临时带入来龙</button>
      <button id="sh208Copy" type="button">复制 V2 Schema</button>
      <button id="sh208Verify" type="button">复制对拍模板</button>
    </div></section>

    <div class="sh208-kpis">
      <div class="sh208-kpi cyan"><small>收水盘</small><b>${e(PLATE[S.waterPlate].name)}</b></div>
      <div class="sh208-kpi"><small>候选局</small><b>${e(
        D.candidates
          .map((x) => x.ju)
          .filter((x, i, a) => a.indexOf(x) === i)
          .join("/"),
      )}局</b></div>
      <div class="sh208-kpi ${activeHQ.some((x) => x.type === "killing") ? "bad" : activeHQ.some((x) => x.type === "rescue") ? "good" : "cyan"}"><small>黄泉专项</small><b>${activeHQ.length || "未激活"}</b></div>
      <div class="sh208-kpi"><small>来龙</small><b>${D.sanji.available ? e(D.sanji.dragon.mountain) + "山" : "未设"}</b></div>
      <div class="sh208-kpi good"><small>三吉六秀命中</small><b>${hitPeaks}</b></div>
      <div class="sh208-kpi bad"><small>外部对拍</small><b>待验证</b></div>
    </div>

    <div class="sh208-grid">
      <section class="sh208-card"><h4>天地人三盘 · 同一物理方位如何换算</h4>${plateHTML(D)}<div class="sh208-note" style="margin-top:7px">这里的 ±7.5° 是“盘面标签相对地盘偏半山”的换算。它不会修改真实罗盘读数，只改变该读数在不同盘层上落到哪一个山字。</div></section>
      <aside class="sh208-card"><h4>黄泉 / 救贫黄泉 · 规则化判断</h4><div class="sh208-hq">${hqHTML(D)}</div></aside>
    </div>

    <div class="sh208-grid">
      <section class="sh208-card"><h4>三吉六秀 · 来龙 × 砂峰</h4>${sanjiHTML(D)}</section>
      <aside class="sh208-card"><h4>黄泉规则为什么不直接用口诀判吉凶</h4><div class="sh208-list">
        <div class="sh208-item cyan"><b>口诀配对层</b><small>“庚丁坤、乙丙巽、甲癸艮、辛壬乾”在不同资料中存在“来水/去水、向/局”的解释差异。V208 只把它作为方位索引显示。</small></div>
        <div class="sh208-item good"><b>长生判读层</b><small>真正的“救贫/杀人”标签要求同时满足水势方向、向上的十二长生状态和来/去水所处阶段；水势未知时不激活。</small></div>
        <div class="sh208-item gold"><b>流派例外层</b><small>四阴干墓向出绝位等规则作为独立条款显示，不与 V207 的一般“生旺来、衰墓去”骨架混为同一个规则。</small></div>
      </div></aside>
    </div>

    <div class="sh208-grid">
      <section class="sh208-card"><h4>大白话</h4><div class="sh208-plain">${e(D.plain)}</div><div class="sh208-note" style="margin-top:7px">“用当前坐山临时带入来龙”只是为了快速试算界面，不等于真实来龙。真正使用三吉六秀前，应另行确定来龙与砂峰方位。</div></section>
      <aside class="sh208-card"><h4>当前声明范围</h4><div class="sh208-list">
        <div class="sh208-item good"><b>三合 V1 当前闭环</b><small>24山双山、四大水局、阳/阴十二长生、天地人三盘换算、来去水、黄泉专项、来龙三吉六秀、坐向联动、Evidence、对拍模板。</small></div>
        <div class="sh208-item cyan"><b>仍不强行并入</b><small>龙上八煞、三吉六秀不同师承变表、十二向完整细断、七十二龙/分金、复杂黄泉异本。后续若加入，会作为独立 rule pack，而不是覆盖本版。</small></div>
      </div></aside>
    </div>

    <section class="sh208-card"><h4>Evidence / 规则状态</h4><div class="sh208-audit">${D.evidence.map((x) => `<div class="sh208-ev"><b>${e(x.id)}</b><small>${e(x.claim)}<br><span class="sh208-formula">${e(x.formula)}</span></small><span class="sh208-state ${x.state === "pending" ? "pending" : ""}">${x.state === "deterministic" ? "确定性字段" : x.state === "school-policy" ? "流派规则" : "待外部验证"}</span></div>`).join("")}</div></section>
  </section>`;
  }
  function bind() {
    document.getElementById("sh208WaterPlate")?.addEventListener("change", (ev) => {
      S.waterPlate = ev.target.value;
      save();
      refRender("luopan");
    });
    document.getElementById("sh208SandPlate")?.addEventListener("change", (ev) => {
      S.sandPlate = ev.target.value;
      save();
      refRender("luopan");
    });
    document.getElementById("sh208Dragon")?.addEventListener("change", (ev) => {
      const v = ev.target.value.trim();
      S.dragonDeg = v === "" ? null : norm(+v || 0);
      save();
      refRender("luopan");
    });
    document.getElementById("sh208Peaks")?.addEventListener("change", (ev) => {
      S.peaks = ev.target.value;
      save();
      refRender("luopan");
    });
    document.getElementById("sh208SitDragon")?.addEventListener("click", () => {
      const B = api()?.analyze?.();
      if (!B) return;
      S.dragonDeg = norm(B.face + 180);
      save();
      refRender("luopan");
    });
    document.getElementById("sh208Copy")?.addEventListener("click", () =>
      navigator.clipboard
        ?.writeText?.(JSON.stringify(build(), null, 2))
        .then(() => {
          try {
            toast("已复制三合水法 V2 Schema");
          } catch (_) {}
        })
        .catch(() => {}),
    );
    document.getElementById("sh208Verify")?.addEventListener("click", () =>
      navigator.clipboard
        ?.writeText?.(JSON.stringify(build().validationTemplate, null, 2))
        .then(() => {
          try {
            toast("已复制三合水法对拍模板");
          } catch (_) {}
        })
        .catch(() => {}),
    );
  }
  try {
    const oldP = REF_PANES.luopan;
    if (oldP && !oldP.__v208) {
      const fn = () => oldP() + panel();
      fn.__v208 = true;
      REF_PANES.luopan = fn;
    }
    const oldB = REF_BIND.luopan;
    const bf = () => {
      try {
        oldB && oldB();
      } catch (err) {
        console.warn("[V208 old luopan bind]", err);
      }
      try {
        bind();
      } catch (err) {
        console.warn("[V208 bind]", err);
      }
    };
    bf.__v208 = true;
    REF_BIND.luopan = bf;
  } catch (err) {
    console.warn("[V208 sanhe patch]", err);
  }

  function selfTest() {
    const C = [],
      add = (id, ok, d = "") => C.push({ id, ok: !!ok, d });
    try {
      add(
        "plate.heaven",
        onPlate(7.5, "heaven").mountain === "子",
        JSON.stringify(onPlate(7.5, "heaven")),
      );
      add(
        "plate.human",
        onPlate(352.5, "human").mountain === "子",
        JSON.stringify(onPlate(352.5, "human")),
      );
      const cover = DRAGON_PACKS.flatMap((x) => x.dragon);
      add(
        "dragon.cover24",
        cover.length === 24 && new Set(cover).size === 24,
        String(cover.length),
      );
      const p = dragonPack("子");
      add(
        "dragon.kan",
        p?.name === "坎癸申辰来龙" && p.three.includes("巽") && p.six.includes("辛"),
        JSON.stringify(p),
      );
      const B = api()?.analyze?.();
      if (B) {
        const cc = flowCandidates(B);
        add("candidate.exists", cc.length >= 1, String(cc.length));
        add(
          "candidate.stages",
          cc.every((x) => x.incoming.stage && x.outgoing.stage && x.facing.stage),
          JSON.stringify(cc.map((x) => [x.incoming.stage, x.outgoing.stage, x.facing.stage])),
        );
        const T = validationTemplate({ base: B, candidates: cc, huangquan: [], sanji: {} });
        add("validation.empty-expected", Object.keys(T.expected).length === 0, T.schema);
      }
    } catch (err) {
      add("exception", false, String((err && err.message) || err));
    }
    return { ok: C.every((x) => x.ok), checks: C };
  }
  const TEST = selfTest();

  const TASKS208 = [
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
      note: "v207–v208：双山四局、阴阳十二长生、天地人三盘、黄泉专项、三吉六秀、坐向与水砂联动、Evidence / 对拍模板；完成当前声明规则包，第三方 reference 仍 pending",
    },
    {
      id: "tz",
      p: "P2",
      name: "历史时区 / 夏令时自动校正",
      state: "todo",
      note: "下一主线：IANA 历史时区、DST/战争时/地方平太阳时边界与可审计时间来源",
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
    doing: 1,
    blocked: 1,
    progress: 67.9,
    next: ["历史时区 / 夏令时自动校正", "奇门日/月/年真实第三方 reference 样本", "关系长期时间轴"],
    tasks: TASKS208,
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
          "历史时区 / DST 自动校正",
          "奇门四家第三方对拍（二期待外部样本）",
          "关系长期时间轴",
          "合参 Evidence 正式报告",
        ],
      }),
    );
  }
  applyBoard();
  window.addEventListener("tianji:lazy-ready", () => setTimeout(applyBoard, 0));

  window.TianjiSanhePolicy = Object.freeze({
    version: "1.0.0",
    build: BUILD,
    schema: SCHEMA,
    analyze: () => clone(build()),
    plate: (deg, plate) => clone(onPlate(deg, plate || "earth")),
    dragonPack: (m) => clone(dragonPack(m)),
    selfTest: () => clone(TEST),
    references: () => clone(REF208),
    manifest: () => ({
      module: "Tianji Sanhe Policy V1",
      completeForDeclaredPolicy: true,
      implemented: [
        "天地人三盘换算",
        "天盘收水/人盘消砂可切换",
        "黄泉长生规则",
        "经典黄泉口诀索引",
        "三吉六秀",
        "来龙/砂峰输入",
        "Evidence",
        "第三方对拍模板",
      ],
      externalValidation: "pending",
      boundaries: [
        "经典口诀存在异解，V208 将方位索引与长生吉凶分离",
        "三吉六秀按九星翻卦研究表实现，不宣称所有师承一致",
        "外部逐盘验证未完成",
      ],
    }),
  });
  window.TianjiSystemV208 = {
    version: "v208",
    build: BUILD,
    sanhePolicy: true,
    noticeQuietDefault: true,
    baseline: "v207",
  };

  function sync() {
    const b = document.getElementById("buildVersion");
  }
  /* V226: historical delayed version writer disabled */
})();
