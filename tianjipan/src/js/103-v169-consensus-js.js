(() => {
  "use strict";
  const V169_BUILD = "v169 · 2026-10-05 14:48 +08:00";
  const SCHEMA = "tianji.consensus.v1";
  const clone = (x) => {
    try {
      return structuredClone(x);
    } catch (_) {
      try {
        return JSON.parse(JSON.stringify(x));
      } catch (__) {
        return x;
      }
    }
  };
  const safe = (fn, fb = null) => {
    try {
      return fn();
    } catch (_) {
      return fb;
    }
  };
  const TOPICS = {
    求财: { qimen: "求财", liuren: "求财", liuyao: "求财", meihua: "求财", zeri: "开业" },
    事业: { qimen: "事业", liuren: "事业", liuyao: "事业", meihua: "事业", zeri: "办公" },
    感情: { qimen: "感情", liuren: "婚姻", liuyao: "婚姻", meihua: "综合", zeri: "嫁娶" },
    健康: { qimen: "健康", liuren: "疾病", liuyao: "疾病", meihua: "综合", zeri: "求医" },
    出行: { qimen: "出行", liuren: "出行", liuyao: "出行", meihua: "综合", zeri: "出行" },
    学业: { qimen: "学业", liuren: "学业", liuyao: "考试", meihua: "事业", zeri: "入学" },
    官司: { qimen: "官司", liuren: "官司", liuyao: "官司", meihua: "综合", zeri: null },
    合作: { qimen: "合作", liuren: "综合", liuyao: "合作", meihua: "综合", zeri: "签约" },
    置业: { qimen: "置业", liuren: "综合", liuyao: "合作", meihua: "综合", zeri: "看房" },
    寻人: { qimen: null, liuren: null, liuyao: null, meihua: null, zeri: null },
    寻物: { qimen: null, liuren: null, liuyao: null, meihua: null, zeri: null },
  };
  const ST = { topic: "事业", question: "", last: null };
  try {
    const x = JSON.parse(localStorage.getItem("tianji.v169.consensus") || "null");
    if (x && TOPICS[x.topic]) {
      ST.topic = x.topic;
      ST.question = String(x.question || "").slice(0, 160);
    }
  } catch (_) {}
  function save() {
    try {
      localStorage.setItem(
        "tianji.v169.consensus",
        JSON.stringify({ topic: ST.topic, question: ST.question }),
      );
    } catch (_) {}
  }
  function evidence(id) {
    const a = safe(() => window.TianjiEvidence?.catalog?.(), []) || [],
      x = a.find((z) => z.id === id);
    return x
      ? {
          level: x.level || 0,
          state: x.state || "unknown",
          label: x.label || "",
          source: x.source || "",
          verify: x.verify || "",
        }
      : { level: 0, state: "unknown", label: "未登记", source: "", verify: "" };
  }
  function tonePol(t) {
    return t === "good" ? 1 : t === "bad" ? -1 : 0;
  }
  function toneLabel(t) {
    return t === "good" ? "偏顺" : t === "bad" ? "偏阻" : "中平/信息";
  }
  function summaryText(rd) {
    return (
      safe(
        () =>
          rd.summary
            .map((x) => x.text)
            .filter(Boolean)
            .slice(0, 2)
            .join(" "),
        "",
      ) || ""
    );
  }
  function moduleRecord(id, name, role, tab, actualTopic, rd, extra = {}) {
    const ev = evidence(id),
      tone =
        (rd?.verdict && rd.verdict[1]) ||
        (rd?.summary && rd.summary[0] && rd.summary[0].tone) ||
        "mid",
      pol = role === "event" ? tonePol(tone) : 0;
    const adapter = extra.adapter === false ? false : true,
      baseW = Math.min(1, Math.max(0.2, (ev.level || 1) / 5)),
      weight = role === "event" ? baseW * (adapter ? 1 : 0.68) : 0;
    return {
      id,
      name,
      role,
      tab,
      requestedTopic: ST.topic,
      topic: actualTopic || "",
      topicAdapted: !!actualTopic && actualTopic !== ST.topic,
      evidence: ev,
      result: {
        tone,
        polarity: pol,
        rawScore: Number.isFinite(rd?.score) ? rd.score : null,
        headline: extra.headline || summaryText(rd) || "—",
        facts: extra.facts || {},
        reading: rd ? clone(rd) : null,
        method: extra.method || "",
        weight: +weight.toFixed(3),
      },
      provenance: {
        source: extra.source || id,
        fields: extra.fields || [],
        note: extra.note || "",
      },
    };
  }
  function eventRecords(R0) {
    const m = TOPICS[ST.topic] || {},
      out = [];
    if (!m.qimen && !m.liuren && !m.liuyao && !m.meihua) return out;
    const qr = safe(() => qimenAsk(R0, m.qimen), null);
    if (qr)
      out.push(
        moduleRecord("qimen", "奇门遁甲", "event", "qimen", m.qimen, qr, {
          source: "qimenAsk()",
          fields: ["score", "verdict", "summary", "宫位/星门神格局"],
          headline: summaryText(qr),
        }),
      );
    const lr = safe(() => liurenReading(R0, m.liuren), null);
    if (lr)
      out.push(
        moduleRecord("liuren", "大六壬", "event", "liuren", m.liuren, lr, {
          source: "liurenReading()",
          fields: ["课体", "三传", "天将", "score", "summary"],
          headline: summaryText(lr),
          adapter:
            m.liuren === ST.topic ||
            ["求财", "事业", "婚姻", "疾病", "官司", "学业", "出行"].includes(ST.topic),
        }),
      );
    let currentL = null;
    const ly = safe(() => {
      currentL = lyRowsNow(R0);
      return liuyaoReading(currentL, R0, m.liuyao);
    }, null);
    if (ly)
      out.push(
        moduleRecord("liuyao", "六爻纳甲", "event", "liuyao", m.liuyao, ly, {
          facts: currentL
            ? {
                name: currentL.info?.name,
                changedName: currentL.info2?.name,
                moving: currentL.moving,
                shi: currentL.shi,
                ying: currentL.ying,
                rows: currentL.rows,
              }
            : {},
          source: "liuyaoReading()",
          fields: ["用神", "世应", "日月旺衰", "动变", "score"],
          headline: summaryText(ly),
          method: safe(() => LYS.mode, "time"),
          adapter:
            m.liuyao === ST.topic ||
            ["求财", "事业", "婚姻", "疾病", "官司", "出行", "合作"].includes(ST.topic),
          note: "六爻沿用当前页面已有起卦结果；切换合参事项不会自动重新摇卦。",
        }),
      );
    const mh = safe(() => meihuaReading(R0, m.meihua), null);
    if (mh)
      out.push(
        moduleRecord("meihua", "梅花易数", "event", "yi", m.meihua, mh, {
          source: "meihuaReading()",
          fields: ["体用", "互卦", "变卦", "月令旺衰", "score"],
          headline: summaryText(mh),
          adapter: ["求财", "事业"].includes(ST.topic),
        }),
      );
    return out;
  }
  function backgroundRecords(R0) {
    const out = [],
      bz = R0.bz,
      D = R0.deep;
    if (bz && D) {
      const headline = `四柱 ${bz.pill.map((p) => GAN[p.s] + ZHI[p.b]).join(" ")}；日主${GAN[bz.dm]}${WXK[GAN_WX[bz.dm]]} · ${D.st?.level || ""}；格局${D.gj?.name || "—"}；取用${(D.xy?.favor || []).map((x) => WXK[x]).join("") || "—"}。`;
      out.push(
        moduleRecord(
          "bazi",
          "四柱八字",
          "background",
          "bazi",
          "命局背景",
          safe(() => bzReading(R0.bz, R0.deep, R0.opt.gender, R0.lunar, nowBJ().y), null),
          { headline, source: "R.bz + R.deep", fields: ["pill", "日主", "旺衰", "格局", "喜用"] },
        ),
      );
    }
    const z = R0.zw;
    if (z) {
      let mingStars = [];
      try {
        const p = z.pal.find((x) => x.b === z.ming);
        mingStars = (p?.stars || []).filter((x) => x.t === "main").map((x) => x.n);
      } catch (_) {}
      const headline = `命宫${ZHI[z.ming]}，身宫${ZHI[z.shen]}，${z.juName || ""}${mingStars.length ? "；命宫主星 " + mingStars.join("、") : ""}；生年四化 ${(z.sihua || []).join(" ")}。`;
      out.push(
        moduleRecord(
          "ziwei",
          "紫微斗数",
          "background",
          "ziwei",
          "命局背景",
          safe(() => ziweiReading(R0.zw, R0.lunar, R0.opt.gender, nowBJ().y), null),
          { headline, source: "R.zw", fields: ["命宫", "身宫", "主星", "生年四化"] },
        ),
      );
    }
    return out;
  }
  function selectionRecords(R0) {
    const m = TOPICS[ST.topic] || TOPICS.事业,
      ev = m.zeri;
    if (!ev || !window.TianjiZeri) return [];
    const exists = safe(() => typeof ZERI_EVENTS === "object" && !!ZERI_EVENTS[ev], false);
    if (!exists) return [];
    const c = R0.t.civ,
      birth = safe(() => R0.bz.pill[0].b, -1),
      z = safe(() => TianjiZeri.evaluateDate(c.y, c.m, c.d, ev, birth), null);
    if (!z) return [];
    const tone = z.score >= 1.5 ? "good" : z.score <= -1.5 ? "bad" : "mid",
      headline = `${c.y}-${String(c.m).padStart(2, "0")}-${String(c.d).padStart(2, "0")} 按「${ev}」评分 ${z.score.toFixed(1)}；${
        (z.audit || [])
          .slice(0, 3)
          .map((x) => `${x.label}${x.value > 0 ? "+" : ""}${x.value}`)
          .join("，") || "无显著加减项"
      }。`;
    return [
      moduleRecord(
        "zeri",
        "黄历 / 择日",
        "selection",
        "zeri",
        ev,
        { verdict: ["", tone], score: z.score, summary: [{ tone, text: headline }] },
        {
          headline,
          source: "TianjiZeri.evaluateDate()",
          fields: ["facts", "event", "score", "audit"],
          note: "择日是“当前日期是否适合事项”的选择层，不与占测模块强行投票。",
        },
      ),
    ];
  }
  function contextOf(R0) {
    const c = R0.t.civ,
      name = (document.getElementById("pname")?.value || "").trim() || "当前命盘";
    return {
      person: {
        name,
        gender: R0.opt.gender,
        loaded: safe(() => typeof meHas === "function" && meHas(), false),
        pillars: R0.bz.pill.map((p) => GAN[p.s] + ZHI[p.b]),
      },
      time: {
        civil: `${c.y}-${String(c.m).padStart(2, "0")}-${String(c.d).padStart(2, "0")} ${String(c.h).padStart(2, "0")}:${String(c.mi).padStart(2, "0")}`,
        jdUT: R0.t.jdUT,
        solarLongitude: R0.t.lon,
        longitude: R0.opt.lon,
        latitude: R0.opt.lat,
      },
      question: {
        topic: ST.topic,
        text: ST.question || "",
        mapping: clone(TOPICS[ST.topic] || {}),
      },
    };
  }
  function synthesize(systems) {
    const votes = systems.filter((x) => x.role === "event"),
      nz = votes.filter((x) => x.result.polarity !== 0),
      pos = nz.filter((x) => x.result.polarity > 0),
      neg = nz.filter((x) => x.result.polarity < 0),
      mid = votes.filter((x) => x.result.polarity === 0),
      ws = nz.reduce((s, x) => s + x.result.weight, 0),
      idx = ws ? nz.reduce((s, x) => s + x.result.polarity * x.result.weight, 0) / ws : 0;
    let label = "中性 / 信息不足";
    if (idx >= 0.55) label = "多数偏顺";
    else if (idx >= 0.18) label = "略偏顺";
    else if (idx <= -0.55) label = "多数偏阻";
    else if (idx <= -0.18) label = "略偏阻";
    else if (pos.length && neg.length) label = "分歧明显";
    const agreements = [];
    if (pos.length >= 2)
      agreements.push(`${pos.map((x) => x.name).join("、")}在当前事项上同时给出偏顺信号。`);
    if (neg.length >= 2)
      agreements.push(`${neg.map((x) => x.name).join("、")}在当前事项上同时给出偏阻信号。`);
    if (mid.length >= 2)
      agreements.push(
        `${mid.map((x) => x.name).join("、")}均未给出强方向性判断，更多呈现条件与结构。`,
      );
    if (!agreements.length) agreements.push("当前没有形成至少两个同方向的强一致点。");
    const conflicts = [];
    if (pos.length && neg.length)
      conflicts.push(
        `${pos.map((x) => x.name).join("、")}偏顺，而 ${neg.map((x) => x.name).join("、")}偏阻；应回到各自规则链查看分歧来自用神、时局还是动变。`,
      );
    if (!conflicts.length)
      conflicts.push("当前未发现“偏顺 vs 偏阻”的直接方向冲突；这不代表各体系结论完全相同。");
    const independent = systems
      .filter((x) => x.role !== "event")
      .map((x) => `${x.name}：${x.result.headline}`);
    return {
      eventVote: {
        positive: pos.length,
        neutral: mid.length,
        negative: neg.length,
        index: +(idx * 100).toFixed(1),
        label,
        voters: votes.map((x) => x.id),
      },
      agreements,
      conflicts,
      independent,
      cautions: [
        "只比较同一“事项/事件层”的方向性结果；命局背景与择日层不参与多数投票。",
        "Evidence 等级是验证成熟度，不是“准确率”或概率。",
        "不同体系观察尺度不同；出现分歧时保留分歧，不以简单多数强行裁决。",
      ],
    };
  }
  function build(R0, ctx = {}) {
    if (!R0) throw new Error("当前尚无可用推演结果 R");
    if (ctx.topic && !TOPICS[ctx.topic]) throw new Error("当前事项尚无合参映射：" + ctx.topic);
    if (ctx.topic && TOPICS[ctx.topic]) ST.topic = ctx.topic;
    if (ctx.question !== undefined) ST.question = String(ctx.question || "").slice(0, 160);
    const systems = [...eventRecords(R0), ...backgroundRecords(R0), ...selectionRecords(R0)],
      syn = synthesize(systems),
      obj = {
        schema: SCHEMA,
        build: V169_BUILD,
        generatedAt: new Date().toISOString(),
        context: contextOf(R0),
        systems,
        synthesis: syn,
        provenance: {
          evidenceSchema: window.TianjiEvidence?.schema || "tianji.evidence.snapshot.v1",
          runtime: "current R",
          rule: "只在 event role 内做方向合参",
        },
      };
    ST.last = obj;
    return clone(obj);
  }
  function li(a) {
    return `<ul>${a.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>`;
  }
  function sysCard(x) {
    const t = x.role === "event" ? x.result.tone : "info",
      role =
        x.role === "event" ? "参与事项合参" : x.role === "background" ? "命局背景" : "择时选择层",
      score = x.result.rawScore == null ? "" : ` · 原始分 ${Number(x.result.rawScore).toFixed(2)}`;
    return `<article class="tj169-sys ${x.role} ${x.role === "event" ? "vote " + t : ""}"><div class="tj169-sys-head"><h4>${x.name}<small>${role}${x.topicAdapted ? ` · 映射为「${x.topic}」` : x.topic ? ` · ${x.topic}` : ""}</small></h4><span class="tj169-tone ${t}">${x.role === "event" ? toneLabel(t) : role}</span></div><div class="tj169-statement">${esc(x.result.headline)}</div><div class="tj169-meta"><span>Evidence L${x.evidence.level}</span><span>${esc(x.evidence.label || x.evidence.state)}</span>${x.result.method ? `<span>起卦:${esc(x.result.method)}</span>` : ""}${x.role === "event" ? `<span>合参权重 ${x.result.weight.toFixed(2)}</span>` : ""}${score ? `<span>${score.slice(3)}</span>` : ""}</div><div class="tj169-sys-foot"><span>来源：${esc(x.provenance.source)}</span><button class="gbtn sm" data-tj169-open="${x.tab}">打开模块</button></div></article>`;
  }
  function panel(R0) {
    let S;
    try {
      S = build(R0);
    } catch (e) {
      return `<div class="panel blk"><h3 class="sec">跨术数合参</h3><p class="note bad">合参 Schema 暂无法生成：${esc(String(e.message || e))}</p></div>`;
    }
    const v = S.synthesis.eventVote,
      levels = S.systems.filter((x) => x.role === "event").map((x) => x.evidence.level || 0),
      avg = levels.length ? levels.reduce((a, b) => a + b, 0) / levels.length : 0;
    return `<div class="tj169"><section class="tj169-hero"><div class="tj169-head"><div><h3>跨术数合参 · 同一时空统一 Schema</h3><p>把同一人物、同一时刻、同一事项下的奇门、大六壬、六爻、梅花先规范成共同结构，再区分“一致点、冲突点、独立信息”。八字与紫微只做命局背景，择日只做时间选择层，不把不同尺度硬凑成一个吉凶票数。</p></div><span class="tj169-badge">${SCHEMA}</span></div><div class="tj169-form"><label>合参事项<select id="tj169Topic">${Object.keys(
      TOPICS,
    )
      .map((x) => `<option${x === ST.topic ? " selected" : ""}>${x}</option>`)
      .join(
        "",
      )}</select></label><label>具体问题（作为上下文，不替代排盘规则）<input id="tj169Question" maxlength="160" value="${esc(ST.question)}" placeholder="例如：这个合作现在适合继续推进吗？"></label><button class="gbtn" id="tj169Refresh">重新合参</button><button class="gbtn" id="tj169Copy">复制 Schema JSON</button></div></section><div class="tj169-kpis"><div class="tj169-kpi ${v.index > 18 ? "good" : v.index < -18 ? "bad" : ""}"><small>事项层方向</small><b>${v.label}</b><em>内部方向值 ${v.index > 0 ? "+" : ""}${v.index}</em></div><div class="tj169-kpi good"><small>偏顺</small><b>${v.positive}</b><em>仅事项占测层</em></div><div class="tj169-kpi"><small>中平 / 信息</small><b>${v.neutral}</b><em>不强制转吉凶</em></div><div class="tj169-kpi bad"><small>偏阻</small><b>${v.negative}</b><em>保留冲突</em></div><div class="tj169-kpi"><small>平均 Evidence</small><b>L${avg.toFixed(1)}</b><em>成熟度，不是准确率</em></div></div><div class="tj169-systems">${S.systems.map(sysCard).join("")}</div><div class="tj169-three"><section class="tj169-box agree"><h4>一致点</h4>${li(S.synthesis.agreements)}</section><section class="tj169-box conflict"><h4>冲突点</h4>${li(S.synthesis.conflicts)}</section><section class="tj169-box independent"><h4>独立信息</h4>${li(S.synthesis.independent)}</section></div><div class="tj169-boundary"><b>合参边界：</b>${S.synthesis.cautions.map(esc).join(" · ")} 六爻如果当前使用铜钱/揲蓍/手动卦，则沿用该卦；切换合参事项不会自动重新起卦，避免为了得到一致答案而重复随机。</div></div>`;
  }
  function bind() {
    const t = document.getElementById("tj169Topic"),
      q = document.getElementById("tj169Question"),
      r = document.getElementById("tj169Refresh"),
      c = document.getElementById("tj169Copy");
    const sync = () => {
      if (t && TOPICS[t.value]) ST.topic = t.value;
      if (q) ST.question = q.value.trim().slice(0, 160);
      save();
    };
    if (t)
      t.onchange = () => {
        sync();
        try {
          refRender("over");
        } catch (_) {}
      };
    if (q) q.onchange = sync;
    if (r)
      r.onclick = () => {
        sync();
        try {
          refRender("over");
          toast("已按统一 Schema 重新合参");
        } catch (_) {}
      };
    if (c)
      c.onclick = () => {
        sync();
        try {
          const s = JSON.stringify(build(R), null, 2);
          if (navigator.clipboard?.writeText)
            navigator.clipboard.writeText(s).then(() => toast("已复制跨术数合参 Schema JSON"));
          else toast("当前浏览器不支持直接复制");
        } catch (_) {
          try {
            toast("复制失败");
          } catch (__) {}
        }
      };
    document.querySelectorAll("[data-tj169-open]").forEach(
      (b) =>
        (b.onclick = () => {
          try {
            selectTab(b.dataset.tj169Open, true);
          } catch (_) {}
        }),
    );
  }
  function selfTest() {
    const checks = [];
    const add = (n, ok, d = "") => checks.push({ n, ok: !!ok, d });
    try {
      if (typeof R !== "undefined" && R) {
        const s = build(R);
        add("Schema 标识", s.schema === SCHEMA, s.schema);
        add(
          "事项层四系统",
          s.systems.filter((x) => x.role === "event").length === 4,
          String(s.systems.filter((x) => x.role === "event").length),
        );
        add(
          "不同尺度不混投",
          s.synthesis.eventVote.voters.every((id) =>
            ["qimen", "liuren", "liuyao", "meihua"].includes(id),
          ),
          s.synthesis.eventVote.voters.join(","),
        );
        add(
          "Evidence 回指",
          s.systems.every((x) => x.evidence && Number.isFinite(+x.evidence.level)),
          "all systems",
        );
        add(
          "极性闭合",
          s.systems
            .filter((x) => x.role === "event")
            .every((x) => [-1, 0, 1].includes(x.result.polarity)),
          "-1/0/1",
        );
      } else add("运行上下文", true, "R 尚未建立，延迟到首轮推演后验证");
    } catch (e) {
      add("exception", false, e.message || String(e));
    }
    return {
      ok: checks.every((x) => x.ok),
      checks,
      pass: checks.filter((x) => x.ok).length,
      total: checks.length,
    };
  }
  const OLD_OVER = renderOverview;
  renderOverview = function (R0) {
    return panel(R0) + OLD_OVER(R0);
  };
  try {
    window.renderOverview = renderOverview;
  } catch (_) {}
  try {
    const oldBind = REF_BIND.over;
    REF_BIND.over = () => {
      try {
        oldBind && oldBind();
      } catch (_) {}
      bind();
    };
  } catch (_) {}
  const API = Object.freeze({
    version: "1.0.0",
    build: V169_BUILD,
    schema: SCHEMA,
    topics: () => clone(TOPICS),
    setContext: (ctx) => {
      if (ctx?.topic && TOPICS[ctx.topic]) ST.topic = ctx.topic;
      if (ctx?.question !== undefined) ST.question = String(ctx.question || "").slice(0, 300);
      save();
      return clone({ topic: ST.topic, question: ST.question });
    },
    build: (runtime, ctx) => build(runtime || R, ctx || {}),
    selfTest,
    manifest: () => ({
      module: "Tianji Cross-System Synthesis",
      version: "1.0.0",
      build: V169_BUILD,
      schema: SCHEMA,
      roles: {
        event: ["qimen", "liuren", "liuyao", "meihua"],
        background: ["bazi", "ziwei"],
        selection: ["zeri"],
      },
      principles: [
        "同人物同时间同事项",
        "只在可比较层内做方向合参",
        "保留冲突",
        "Evidence 只表成熟度不表概率",
        "所有结论可回指来源",
      ],
    }),
  });
  window.TianjiConsensus = API;
  try {
    if (window.TianjiCore) {
      TianjiCore.registerSource({
        id: "tianji-v169-consensus-schema",
        type: "internal",
        title: "Tianji Cross-System Synthesis 1.0",
        version: "1.0.0",
        baseline: "v168",
        note: "统一奇门/六壬/六爻/梅花的事项层结果，并把八字/紫微/择日保留为不同尺度的独立信息。",
      });
      TianjiCore.registerEngine(
        {
          id: "consensus.aggregate.v1",
          system: "aggregate",
          name: "Tianji Consensus Aggregate 1.0",
          version: "1.0.0",
          source: "tianji-v169-consensus-schema",
          doctrine: "同人物 × 同时刻 × 同事项 · 分层合参 · 冲突保留 · Evidence 回指",
          status: "active",
        },
        (input) => API.build(input?.runtime || R, input?.context || input || {}),
      );
    }
  } catch (e) {
    console.warn("[v169 registry]", e);
  }
  try {
    const road = window.TianjiRoadmap || {};
    window.TianjiRoadmap = Object.freeze(
      Object.assign({}, road, {
        nextMainline: [
          "合参解释链 / 可视化证据图",
          "AI 解释层（只消费 Schema）",
          "MCP / API",
          "奇门四家与择日高级 Evidence",
        ],
      }),
    );
  } catch (_) {}
  try {
    const T = selfTest(),
      bv = document.getElementById("buildVersion");

    window.TianjiSystemV169 = {
      version: "v169",
      build: V169_BUILD,
      consensusSchema: SCHEMA,
      selfTest: T,
    };
  } catch (_) {}
})();
