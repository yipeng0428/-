(() => {
  "use strict";
  const BUILD = "v206 · 2026-10-06 14:25 +08:00";
  const SCHEMA = "tianji.xuankong.house.v2";
  let focusPal = 9,
    spaceType = "living";
  const SPACE = {
    entrance: {
      name: "大门 / 入口",
      shan: 0.25,
      xiang: 0.75,
      desc: "入口与动线以向星权重更高，只表示本页的阅读权重。",
    },
    living: {
      name: "客厅 / 公共区",
      shan: 0.35,
      xiang: 0.65,
      desc: "公共活动区偏向向星，同时兼看山星。",
    },
    bedroom: {
      name: "主卧 / 卧室",
      shan: 0.7,
      xiang: 0.3,
      desc: "静态长期停留空间偏向山星，同时兼看向星。",
    },
    study: {
      name: "书房 / 办公",
      shan: 0.55,
      xiang: 0.45,
      desc: "兼顾长期停留与活动，山向权重接近。",
    },
    kitchen: {
      name: "厨房",
      shan: 0.45,
      xiang: 0.55,
      desc: "这里只做星盘结构阅读，不替代消防、燃气、排烟与动线设计。",
    },
    custom: { name: "自定义空间", shan: 0.5, xiang: 0.5, desc: "山、向星等权阅读。" },
  };
  const clone = (x) => (x == null ? x : JSON.parse(JSON.stringify(x)));
  const e = (s) =>
    String(s ?? "").replace(
      /[&<>"']/g,
      (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
    );
  const palName = (p) => `${XK_PAL_NAME[p]}${p === 5 ? "中宫" : "·" + XK_PAL_DIR[p]}`;
  const outer = [1, 2, 3, 4, 6, 7, 8, 9];
  const opposite = { 1: 9, 9: 1, 3: 7, 7: 3, 2: 8, 8: 2, 4: 6, 6: 4 };

  function currentBase() {
    try {
      return window.TianjiXuankongHouse?.analyze?.() || null;
    } catch (err) {
      return null;
    }
  }
  function allEq(arr, fn) {
    return arr.every(fn);
  }
  function fullHeshi(D) {
    const C = D.chart.cells,
      out = [];
    const types = [
      {
        id: "shan-xiang",
        name: "全局山向合十",
        ok: allEq(outer, (p) => C[p].shan + C[p].xiang === 10),
        formula: "∀八宫: 山星 + 向星 = 10",
      },
      {
        id: "shan-yun",
        name: "全局山运合十",
        ok: allEq(outer, (p) => C[p].shan + C[p].yun === 10),
        formula: "∀八宫: 山星 + 运星 = 10",
      },
      {
        id: "xiang-yun",
        name: "全局向运合十",
        ok: allEq(outer, (p) => C[p].xiang + C[p].yun === 10),
        formula: "∀八宫: 向星 + 运星 = 10",
      },
    ];
    types
      .filter((x) => x.ok)
      .forEach((x) =>
        out.push({
          ...x,
          tone: "good",
          text: "八个方宫全部满足对应两盘相加为十；这里只记录机械格局，不据此越过当令、形势和实际空间条件直接判结果。",
        }),
      );
    return out;
  }
  function resonance(D, plate, key) {
    const C = D.chart.cells;
    const fuyin = allEq(outer, (p) => C[p][plate] === p);
    const fanyin = allEq(outer, (p) => C[p][plate] === opposite[p]);
    const out = [];
    if (fuyin)
      out.push({
        id: `${key}.fuyin`,
        name: `${key}伏吟`,
        tone: "bad",
        formula: `∀八宫: ${key}星数 = 洛书宫数`,
        text: `${key}盘回到原洛书宫位。本项目把这种完全回原位的机械状态记作“伏吟”，仅作为研究标签。`,
      });
    if (fanyin)
      out.push({
        id: `${key}.fanyin`,
        name: `${key}反吟`,
        tone: "bad",
        formula: `∀八宫: ${key}星数 = 对宫洛书宫数`,
        text: `${key}盘全部落到原洛书对宫。本项目把这种完整对宫状态记作“反吟”，仅作为研究标签。`,
      });
    return out;
  }
  function doubleStars(D) {
    const C = D.chart.cells,
      out = [];
    for (let p = 1; p <= 9; p++) {
      const c = C[p];
      if (c.shan === c.xiang)
        out.push({
          id: `double.${p}`,
          name: `${palName(p)} · 山向双星 ${c.shan}`,
          tone: c.shan === D.chart.yun ? "good" : "cyan",
          formula: `shan[${p}] = xiang[${p}] = ${c.shan}`,
          text: `山星与向星同数聚于同宫${c.shan === D.chart.yun ? "，且正是当运星" : "。"}。实际用法仍需结合该宫是动区还是静区。`,
        });
      if (c.shan === D.chart.yun && c.xiang === D.chart.yun)
        out.push({
          id: `double-wang.${p}`,
          name: `${palName(p)} · 双旺星`,
          tone: "good",
          formula: `shan[${p}] = xiang[${p}] = 运星 ${D.chart.yun}`,
          text: "当运山星与向星同时聚于一宫，属于“当旺双到”的机械结构。",
        });
    }
    return out;
  }
  function pairPatterns(D) {
    const out = [],
      C = D.chart.cells;
    for (let p = 1; p <= 9; p++) {
      const c = C[p],
        pair = xkPairInfo(c.shan, c.xiang);
      if (pair.n !== "相生" && pair.n !== "相克" && pair.n !== "比和") {
        out.push({
          id: `pair.${p}`,
          name: `${palName(p)} · ${pair.n}`,
          tone: pair.t === "吉" ? "good" : pair.t === "凶" ? "bad" : "cyan",
          formula: `pair(${c.shan},${c.xiang})`,
          text: pair.d,
          pal: p,
        });
      }
    }
    return out;
  }
  function timeOverlayPatterns(D) {
    const out = [];
    for (const H of D.hotspots || []) {
      const risky = H.flags.filter((x) => /五黄|二黑|二五/.test(x));
      const useful = H.flags.filter((x) => /九紫|当运/.test(x));
      if (risky.length)
        out.push({
          id: `time.risk.${H.pal}`,
          name: `${palName(H.pal)} · 时间叠层`,
          tone: "bad",
          formula: `year=${H.year}, month=${H.month}, natal(shan=${H.shan},xiang=${H.xiang})`,
          text: `${risky.join("、")}。这里只表示传统紫白标签在该方位重叠，不代表疾病、事故或损失必然发生。`,
        });
      if (useful.length)
        out.push({
          id: `time.good.${H.pal}`,
          name: `${palName(H.pal)} · 时间活跃`,
          tone: "good",
          formula: `year=${H.year}, month=${H.month}`,
          text: `${useful.join("、")}。可作为“值得进一步看”的方位，而不是自动判吉。`,
        });
    }
    return out;
  }
  function auditPatterns(D) {
    return [
      ...fullHeshi(D),
      ...resonance(D, "shan", "山盘"),
      ...resonance(D, "xiang", "向盘"),
      ...doubleStars(D),
      ...pairPatterns(D),
      ...timeOverlayPatterns(D),
    ];
  }
  function focusScore(D, p, space) {
    const S = SPACE[space] || SPACE.custom,
      C = D.chart.cells[p],
      F = D.flows;
    const qiS = xkQi(C.shan, D.chart.yun),
      qiX = xkQi(C.xiang, D.chart.yun);
    const base = (XK_QI_SC[qiS] || 0) * S.shan + (XK_QI_SC[qiX] || 0) * S.xiang;
    const pair = xkPairInfo(C.shan, C.xiang);
    let score = base + (pair.sc || 0) * 0.8,
      why = [
        `山星${C.shan}·${qiS} × ${(S.shan * 100).toFixed(0)}%`,
        `向星${C.xiang}·${qiX} × ${(S.xiang * 100).toFixed(0)}%`,
        `山向组合：${pair.n}`,
      ];
    const year = F.year[p],
      month = F.month[p];
    if (year === 5) {
      score -= 1.2;
      why.push("流年五黄标签");
    }
    if (month === 5) {
      score -= 0.8;
      why.push("流月五黄标签");
    }
    if (year === 2) {
      score -= 0.55;
      why.push("流年二黑标签");
    }
    if (month === 2) {
      score -= 0.35;
      why.push("流月二黑标签");
    }
    if (year === D.chart.yun) {
      score += 0.45;
      why.push("流年星与当运星同数");
    }
    if (month === D.chart.yun) {
      score += 0.25;
      why.push("流月星与当运星同数");
    }
    if (year === month) {
      score += 0.15;
      why.push("年月同星叠临");
    }
    const grade =
      score >= 2
        ? "强"
        : score >= 0.7
          ? "偏强"
          : score > -0.7
            ? "中性"
            : score > -2
              ? "偏弱"
              : "弱";
    return {
      pal: p,
      name: palName(p),
      space: S,
      shan: C.shan,
      xiang: C.xiang,
      yun: C.yun,
      year,
      month,
      qiS,
      qiX,
      pair,
      score: +score.toFixed(2),
      grade,
      why,
    };
  }
  function focusPlain(F) {
    const mode =
      F.score >= 0.7
        ? "这一方位在当前量表里偏顺"
        : F.score <= -0.7
          ? "这一方位在当前量表里阻力标签偏多"
          : "这一方位当前更接近中性";
    return `${F.space.name}设在${F.name}时，${mode}。山星${F.shan}为${F.qiS}，向星${F.xiang}为${F.qiX}，山向组合是“${F.pair.n}”；当前年星${F.year}、月星${F.month}。这个分数只是把当前声明规则压成便于比较的“结构指数”，不是概率，也不能替代采光、通风、消防、噪音、真实动线和建筑结构。`;
  }
  function evidence(D, patterns, F) {
    const ev = [
      {
        id: "input.orientation",
        claim: `坐${D.chart.zuo}向${D.chart.xiang} · ${D.chart.orientation.facing.degree.toFixed(1)}° · ${D.chart.mode}`,
        formula: "精确向度 → 二十四山 → 下卦/替卦",
        state: "deterministic",
      },
      {
        id: "plate.3x9",
        claim: "九宫山星 / 运星 / 向星已生成",
        formula: "运盘 + 坐向宫取入中星 + 顺逆飞布",
        state: "deterministic",
      },
      {
        id: "time.year-month",
        claim: `${D.flowYear}年 / ${JIE[D.monthIndex]}月紫白叠层`,
        formula: "yearCenter → 顺飞；monthCenter → 顺飞",
        state: "deterministic",
      },
      {
        id: "external.validation",
        claim: "玄空二期尚未导入独立第三方逐盘 reference",
        formula: "待外部软件 / 金样逐字段对拍",
        state: "pending",
      },
    ];
    patterns.forEach((x, i) =>
      ev.push({ id: `pattern.${i}`, claim: x.name, formula: x.formula, state: "derived" }),
    );
    ev.push({
      id: "focus.score",
      claim: `${F.name} · ${F.space.name} · 结构指数 ${F.score}`,
      formula: F.why.join(" + "),
      state: "derived",
    });
    return ev;
  }
  function validationTemplate(D) {
    return {
      schema: "tianji.xuankong.crosscheck.request.v1",
      build: BUILD,
      warning:
        "expected 必须来自独立第三方软件、人工金样或另一个独立实现；不要把 Tianji snapshot 原样复制进 expected。",
      input: {
        facing_degree: D.chart.orientation.facing.degree,
        build_year: D.buildYear,
        flow_year: D.flowYear,
        month_index: D.monthIndex,
        mode: D.chart.mode,
      },
      tianji_snapshot: {
        zuo: D.chart.zuo,
        xiang: D.chart.xiang,
        yun: D.chart.yun,
        cells: D.chart.cells,
        year: D.flows.year,
        month: D.flows.month,
      },
      expected: {},
      source: { name: "", version: "", url: "", note: "" },
    };
  }
  function build() {
    const D = currentBase();
    if (!D?.available)
      return { schema: SCHEMA, build: BUILD, available: false, reason: "V205 玄空宅盘不可用" };
    if (!D.chart.cells[focusPal]) focusPal = D.chart.xPal || 9;
    const P = auditPatterns(D),
      F = focusScore(D, focusPal, spaceType);
    const out = {
      schema: SCHEMA,
      build: BUILD,
      available: true,
      base: D,
      patterns: P,
      focus: F,
      evidence: evidence(D, P, F),
      validation: "pending-external",
    };
    out.plain = `当前宅盘内部规则已形成闭环：精确向度、下卦/替卦、山运向三盘、主要格局、年月紫白和重点空间都能追溯到具体字段。共识别 ${P.length} 个可列出的结构标签。${focusPlain(F)} 当前仍缺独立第三方逐盘 reference，因此“算法结构完成”与“外部验证完成”分开标记。`;
    out.validationTemplate = validationTemplate(D);
    return out;
  }
  function patternHTML(D) {
    if (!D.patterns.length)
      return '<div class="xk206-note">当前未识别到本版本格局库需要单列的全局合十、反吟伏吟、双星或特殊星数组合。</div>';
    return D.patterns
      .map(
        (x) =>
          `<div class="xk206-item ${x.tone}"><b>${e(x.name)}</b><small>${e(x.text)}</small><div class="xk206-formula">${e(x.formula)}</div></div>`,
      )
      .join("");
  }
  function focusHTML(D) {
    const F = D.focus;
    return `<div class="xk206-score"><strong>${F.score.toFixed(2)}</strong><span>结构指数 · ${e(F.grade)} · 非概率</span></div>
   <div class="xk206-focus"><div><small>山星</small><b>${F.shan}</b></div><div><small>运星</small><b>${F.yun}</b></div><div><small>向星</small><b>${F.xiang}</b></div><div><small>流年</small><b>${F.year}</b></div><div><small>流月</small><b>${F.month}</b></div></div>
   <div class="xk206-list" style="margin-top:7px">
    <div class="xk206-item cyan"><b>${e(F.name)} · ${e(F.space.name)}</b><small>${e(F.space.desc)}</small></div>
    <div class="xk206-item ${F.pair.t === "吉" ? "good" : F.pair.t === "凶" ? "bad" : "cyan"}"><b>山向组合 · ${e(F.pair.n)}</b><small>${e(F.pair.d)}</small></div>
   </div>`;
  }
  function panel() {
    const D = build();
    if (!D.available)
      return `<section class="xk206"><div class="xk206-note">${e(D.reason)}</div></section>`;
    return `<section class="xk206" id="xk206Depth">
    <section class="xk206-hero"><div class="xk206-head"><div><h3>玄空宅盘二期 · 格局审计 / 空间焦点 / Evidence</h3><p>这一层不再重复画九宫，而是审计 V205 宅盘：识别全局合十、山/向盘反吟伏吟、同宫双星、当旺双到、特殊星数组合与年月叠层；同时允许指定实际空间方位与用途，形成可解释的“结构指数”。第三方逐盘对拍仍明确标为待验证。</p></div><span class="xk206-schema">${SCHEMA}</span></div>
    <div class="xk206-tools"><label>重点方位<select id="xk206Pal">${[1, 8, 3, 4, 9, 2, 7, 6, 5].map((p) => `<option value="${p}"${focusPal === p ? " selected" : ""}>${e(palName(p))}</option>`).join("")}</select></label><label>空间用途<select id="xk206Space">${Object.entries(
      SPACE,
    )
      .map(
        ([k, v]) =>
          `<option value="${k}"${spaceType === k ? " selected" : ""}>${e(v.name)}</option>`,
      )
      .join(
        "",
      )}</select></label><button id="xk206Copy" type="button">复制 V2 Schema</button><button id="xk206VerifyTpl" type="button">复制第三方对拍模板</button></div></section>

    <div class="xk206-kpis">
      <div class="xk206-kpi cyan"><small>格局标签</small><b>${D.patterns.length}</b></div>
      <div class="xk206-kpi"><small>重点方位</small><b>${e(D.focus.name)}</b></div>
      <div class="xk206-kpi ${D.focus.score >= 0.7 ? "good" : D.focus.score <= -0.7 ? "bad" : "cyan"}"><small>结构指数</small><b>${D.focus.score.toFixed(2)}</b></div>
      <div class="xk206-kpi"><small>宅盘盘式</small><b>${e(D.base.chart.mode)}</b></div>
      <div class="xk206-kpi"><small>元运</small><b>${NUMC[D.base.chart.yun]}运</b></div>
      <div class="xk206-kpi bad"><small>外部对拍</small><b>待验证</b></div>
    </div>

    <div class="xk206-grid">
      <section class="xk206-card"><h4>宅盘格局库 · 自动审计</h4><div class="xk206-list">${patternHTML(D)}</div></section>
      <aside class="xk206-card"><h4>实际空间焦点</h4>${focusHTML(D)}<div class="xk206-plain" style="margin-top:7px">${e(focusPlain(D.focus))}</div></aside>
    </div>

    <div class="xk206-grid">
      <section class="xk206-card"><h4>九宫结构表</h4><div class="tbl-wrap"><table class="xk206-table"><thead><tr><th>宫位</th><th>山/运/向</th><th>年月</th><th>山向组合</th><th>气势</th></tr></thead><tbody>${[
        1, 2, 3, 4, 5, 6, 7, 8, 9,
      ]
        .map((p) => {
          const c = D.base.chart.cells[p],
            pair = xkPairInfo(c.shan, c.xiang);
          return `<tr${p === D.focus.pal ? ' style="background:var(--wash)"' : ""}><td><b>${e(palName(p))}</b></td><td>${c.shan} / ${c.yun} / ${c.xiang}</td><td>${D.base.flows.year[p]} / ${D.base.flows.month[p]}</td><td>${e(pair.n)}</td><td>山${e(xkQi(c.shan, D.base.chart.yun))} · 向${e(xkQi(c.xiang, D.base.chart.yun))}</td></tr>`;
        })
        .join("")}</tbody></table></div></section>
      <aside class="xk206-card"><h4>大白话</h4><div class="xk206-plain">${e(D.plain)}</div><div class="xk206-note" style="margin-top:7px">空间焦点只是把不同用途的阅读权重明确化，不是“自动风水布局建议”。涉及卧室、大门、厨房或装修时，结构安全、消防、燃气、采光、通风、噪音和真实动线优先。</div></aside>
    </div>

    <section class="xk206-card"><h4>Evidence / 验证状态</h4><div class="xk206-audit">${D.evidence.map((x) => `<div class="xk206-ev"><b>${e(x.id)}</b><small>${e(x.claim)}<br><span class="xk206-formula">${e(x.formula)}</span></small><span class="xk206-state ${x.state === "pending" ? "pending" : ""}">${x.state === "deterministic" ? "确定性字段" : x.state === "derived" ? "可追溯派生" : "待外部验证"}</span></div>`).join("")}</div></section>
  </section>`;
  }
  function bind() {
    document.getElementById("xk206Pal")?.addEventListener("change", (ev) => {
      focusPal = +ev.target.value || 9;
      refRender("xk");
    });
    document.getElementById("xk206Space")?.addEventListener("change", (ev) => {
      spaceType = ev.target.value || "custom";
      refRender("xk");
    });
    document.getElementById("xk206Copy")?.addEventListener("click", () =>
      navigator.clipboard
        ?.writeText?.(JSON.stringify(build(), null, 2))
        .then(() => {
          try {
            toast("已复制玄空 V2 Schema");
          } catch (_) {}
        })
        .catch(() => {}),
    );
    document.getElementById("xk206VerifyTpl")?.addEventListener("click", () =>
      navigator.clipboard
        ?.writeText?.(JSON.stringify(build().validationTemplate, null, 2))
        .then(() => {
          try {
            toast("已复制玄空第三方对拍模板");
          } catch (_) {}
        })
        .catch(() => {}),
    );
  }
  try {
    const oldP = REF_PANES.xk;
    if (oldP && !oldP.__v206) {
      const fn = () => oldP() + panel();
      fn.__v206 = true;
      REF_PANES.xk = fn;
    }
    const oldB = REF_BIND.xk;
    const bf = () => {
      try {
        oldB && oldB();
      } catch (err) {
        console.warn("[V206 old xk bind]", err);
      }
      try {
        bind();
      } catch (err) {
        console.warn("[V206 xk bind]", err);
      }
    };
    bf.__v206 = true;
    REF_BIND.xk = bf;
  } catch (err) {
    console.warn("[V206 xk patch]", err);
  }

  function selfTest() {
    const checks = [],
      add = (id, ok, d = "") => checks.push({ id, ok: !!ok, d });
    try {
      const D = currentBase();
      if (!D?.available) {
        add("base.available", true, "无当前宅盘，跳过运行时测试");
        return { ok: true, checks };
      }
      const P = auditPatterns(D),
        F = focusScore(D, D.chart.xPal || 9, "entrance"),
        T = validationTemplate(D);
      add("patterns.array", Array.isArray(P), String(P.length));
      add("focus.finite", Number.isFinite(F.score), String(F.score));
      add(
        "focus.fields",
        [F.shan, F.xiang, F.yun, F.year, F.month].every(Number.isFinite),
        JSON.stringify(F),
      );
      add("validation.pending", T.expected && Object.keys(T.expected).length === 0, T.schema);
      add("validation.warning", /独立第三方/.test(T.warning), T.warning);
    } catch (err) {
      add("exception", false, String((err && err.message) || err));
    }
    return { ok: checks.every((x) => x.ok), checks };
  }
  const TEST = selfTest();

  const TASKS206 = [
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
      note: "v205–v206：精确向度、下卦/替卦、山运向、空亡线、年月叠层、格局审计、空间焦点、Evidence 与第三方对拍模板；当前声明口径已闭环，外部逐盘 reference 仍单独标记 pending",
    },
    {
      id: "sanhe",
      p: "P1",
      name: "三合水法 Core",
      state: "todo",
      note: "下一主线：二十四山 / 十二长生 / 水口 / 来去水 / 三合局确定性规则",
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
    doing: 1,
    blocked: 1,
    progress: 60.7,
    next: ["三合水法 Core", "奇门日/月/年真实第三方 reference 样本", "历史时区 / DST"],
    tasks: TASKS206,
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
          "三合水法 Core",
          "奇门四家第三方对拍（二期待外部样本）",
          "历史时区 / DST",
          "关系长期时间轴",
        ],
      }),
    );
  }
  applyBoard();
  window.addEventListener("tianji:lazy-ready", () => setTimeout(applyBoard, 0));

  window.TianjiXuankongHouseV2 = Object.freeze({
    version: "2.0.0",
    build: BUILD,
    schema: SCHEMA,
    analyze: () => clone(build()),
    patternAudit: () => clone(auditPatterns(currentBase())),
    focus: (pal, space) => clone(focusScore(currentBase(), +pal || 9, space || "custom")),
    validationTemplate: () => clone(build().validationTemplate),
    selfTest: () => clone(TEST),
    manifest: () => ({
      module: "Tianji Xuankong House V2",
      completeForDeclaredPolicy: true,
      features: [
        "全局合十审计",
        "山/向盘反吟伏吟",
        "同宫双星/双旺星",
        "特殊星数组合",
        "年月叠层",
        "实际空间焦点",
        "结构指数",
        "Evidence",
        "第三方对拍模板",
      ],
      externalValidation: "pending",
      notImplementedByDesign: [
        "七星打劫等高度流派化格局不在未完成 Evidence 前强行纳入",
        "复杂户型多立极/多入口策略仍需单独产品化",
      ],
    }),
  });
  window.TianjiSystemV206 = {
    version: "v206",
    build: BUILD,
    xuankongHouseV2: true,
    noticeQuietDefault: true,
    baseline: "v205",
  };

  function sync() {
    const b = document.getElementById("buildVersion");
  }
  /* V226: historical delayed version writer disabled */
})();
