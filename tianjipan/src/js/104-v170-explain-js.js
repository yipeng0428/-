(() => {
  "use strict";
  const V170_BUILD = "v170 · 2026-10-05 15:20 +08:00";
  const SCHEMA = "tianji.explain.graph.v1";
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
  const E = (s) => {
    try {
      return esc(String(s == null ? "" : s));
    } catch (_) {
      return String(s == null ? "" : s).replace(
        /[&<>"']/g,
        (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[m],
      );
    }
  };
  const ROLE = { event: "事项占测层", background: "命局背景层", selection: "择时选择层" };
  function toneClass(x) {
    return x === "good" ? "good" : x === "bad" ? "bad" : "info";
  }
  function toneText(x) {
    return x === "good" ? "偏顺" : x === "bad" ? "偏阻" : "中平 / 信息";
  }
  function nodeId(id) {
    return String(id).replace(/[^a-z0-9_-]/gi, "_");
  }
  function diagnostics(S) {
    const ev = S.systems.filter((x) => x.role === "event"),
      pos = ev.filter((x) => x.result.polarity > 0),
      neg = ev.filter((x) => x.result.polarity < 0),
      mid = ev.filter((x) => x.result.polarity === 0),
      out = [];
    if (pos.length >= 2)
      out.push({
        type: "good",
        title: "同向支持",
        text: `${pos.map((x) => x.name).join("、")}都给出偏顺方向；但它们使用的规则字段并不相同，所以这里表示“方向一致”，不是“理由相同”。`,
      });
    if (neg.length >= 2)
      out.push({
        type: "bad",
        title: "同向阻力",
        text: `${neg.map((x) => x.name).join("、")}都给出偏阻方向；应分别查看各模块的用神、宫位、三传或动变来源。`,
      });
    if (pos.length && neg.length) {
      for (const a of pos)
        for (const b of neg) {
          const af = (a.provenance.fields || []).slice(0, 4).join(" / ") || "模块规则链",
            bf = (b.provenance.fields || []).slice(0, 4).join(" / ") || "模块规则链";
          out.push({
            type: "bad",
            title: `${a.name} ↔ ${b.name}`,
            text: `方向冲突：${a.name}偏顺，主要读取 ${af}；${b.name}偏阻，主要读取 ${bf}。这类冲突先解释为“观察层和取用规则不同”，不以多数票抹掉。`,
          });
        }
    }
    const adapted = ev.filter((x) => x.topicAdapted);
    if (adapted.length)
      out.push({
        type: "info",
        title: "事项映射差异",
        text: `${adapted.map((x) => `${x.name}→「${x.topic}」`).join("、")} 使用了事项映射，因此可比性低于完全同名事项；v169 已通过权重折减处理。`,
      });
    if (mid.length)
      out.push({
        type: "info",
        title: "中性信息",
        text: `${mid.map((x) => x.name).join("、")}没有给出强方向，只贡献结构性条件；中性不等于无效。`,
      });
    const low = ev.filter((x) => (x.evidence.level || 0) < 4);
    if (low.length)
      out.push({
        type: "info",
        title: "Evidence 边界",
        text: `${low.map((x) => `${x.name} L${x.evidence.level}`).join("、")} 尚未达到 L4；成熟度只控制审慎程度，不参与“算准概率”。`,
      });
    if (!out.length)
      out.push({
        type: "info",
        title: "当前状态",
        text: "当前事项层没有明显冲突，也没有需要特别标注的事项映射差异。",
      });
    return out;
  }
  function steps(S) {
    const v = S.synthesis.eventVote,
      ev = S.systems.filter((x) => x.role === "event");
    return [
      {
        n: "固定上下文",
        d: `人物「${S.context.person.name}」 · ${S.context.time.civil} · 事项「${S.context.question.topic}」${S.context.question.text ? ` · 问题「${S.context.question.text}」` : ""}`,
      },
      {
        n: "分别调用 Core",
        d: `奇门、大六壬、六爻、梅花各自保持原有规则链；八字、紫微和择日只作为不同尺度的背景/选择信息。`,
      },
      {
        n: "规范共同字段",
        d: `事项层统一成 tone / polarity / rawScore / Evidence / provenance；不改写各系统自己的原始排盘。`,
      },
      {
        n: "过滤可比较层",
        d: `只有 ${ev.map((x) => x.name).join("、")} 进入方向合参；命局背景与择日不参加多数票。`,
      },
      {
        n: "Evidence 加权",
        d: `每个事项模块权重由 Evidence L1–L5 归一化；事项映射不是完全同名时再折减。`,
      },
      {
        n: "保留一致与冲突",
        d: `当前方向为「${v.label}」，偏顺 ${v.positive}、中平 ${v.neutral}、偏阻 ${v.negative}；冲突单独保留，不覆盖原模块。`,
      },
      {
        n: "形成可回指结论",
        d: `最终解释必须能回到模块、字段、Evidence 等级和来源函数；AI 后续只能消费这份结构化链。`,
      },
    ];
  }
  function build(runtime, opts = {}) {
    const S = opts.consensus || window.TianjiConsensus?.build?.(runtime || R) || null;
    if (!S) throw new Error("TianjiConsensus 尚不可用");
    const nodes = [],
      edges = [];
    nodes.push({
      id: "ctx",
      kind: "context",
      label: "同一时空上下文",
      sub: `${S.context.person.name} · ${S.context.question.topic}`,
      tone: "info",
      x: 82,
      y: 286,
      w: 148,
      h: 58,
      data: S.context,
    });
    nodes.push({
      id: "evidence",
      kind: "registry",
      label: "Evidence Registry",
      sub: "成熟度 / 校验 / 来源",
      tone: "info",
      x: 470,
      y: 35,
      w: 150,
      h: 52,
      data: { schema: S.provenance.evidenceSchema },
    });
    const ys = [92, 158, 224, 290, 356, 422, 488];
    S.systems.forEach((s, i) => {
      const y = ys[i] || 92 + i * 64,
        id = "sys:" + s.id,
        t = s.role === "event" ? toneClass(s.result.tone) : "info";
      nodes.push({
        id,
        kind: "system",
        label: s.name,
        sub: `${ROLE[s.role]} · L${s.evidence.level} · ${s.role === "event" ? toneText(s.result.tone) : "独立信息"}`,
        tone: t,
        x: 310,
        y,
        w: 200,
        h: 52,
        data: s,
      });
      edges.push({ a: "ctx", b: id, type: "context" });
      edges.push({ a: "evidence", b: id, type: "ev" });
    });
    const agree = {
      id: "syn:agree",
      kind: "synthesis",
      label: "一致点",
      sub: (S.synthesis.agreements || [])[0] || "—",
      tone: "good",
      x: 725,
      y: 160,
      w: 182,
      h: 64,
      data: S.synthesis.agreements,
    };
    const conflict = {
      id: "syn:conflict",
      kind: "synthesis",
      label: "冲突点",
      sub: (S.synthesis.conflicts || [])[0] || "—",
      tone: "bad",
      x: 725,
      y: 286,
      w: 182,
      h: 64,
      data: S.synthesis.conflicts,
    };
    const independent = {
      id: "syn:independent",
      kind: "synthesis",
      label: "独立信息",
      sub: "命局背景 / 择时层",
      tone: "info",
      x: 725,
      y: 412,
      w: 182,
      h: 64,
      data: S.synthesis.independent,
    };
    const final = {
      id: "syn:final",
      kind: "final",
      label: S.synthesis.eventVote.label,
      sub: `内部方向值 ${S.synthesis.eventVote.index > 0 ? "+" : ""}${S.synthesis.eventVote.index}`,
      tone:
        S.synthesis.eventVote.index > 18
          ? "good"
          : S.synthesis.eventVote.index < -18
            ? "bad"
            : "info",
      x: 965,
      y: 286,
      w: 150,
      h: 64,
      data: S.synthesis.eventVote,
    };
    nodes.push(agree, conflict, independent, final);
    const ev = S.systems.filter((x) => x.role === "event"),
      hasPos = ev.some((x) => x.result.polarity > 0),
      hasNeg = ev.some((x) => x.result.polarity < 0);
    S.systems.forEach((s) => {
      const id = "sys:" + s.id;
      if (s.role !== "event") {
        edges.push({ a: id, b: "syn:independent", type: "info" });
        return;
      }
      if (s.result.polarity > 0) edges.push({ a: id, b: "syn:agree", type: "good" });
      else if (s.result.polarity < 0)
        edges.push({ a: id, b: hasPos ? "syn:conflict" : "syn:agree", type: "bad" });
      else edges.push({ a: id, b: "syn:independent", type: "info" });
      if (hasPos && hasNeg && s.result.polarity > 0)
        edges.push({ a: id, b: "syn:conflict", type: "bad" });
    });
    edges.push({ a: "syn:agree", b: "syn:final", type: "good" });
    edges.push({ a: "syn:conflict", b: "syn:final", type: "bad" });
    edges.push({ a: "syn:independent", b: "syn:final", type: "info" });
    const obj = {
      schema: SCHEMA,
      build: V170_BUILD,
      generatedAt: new Date().toISOString(),
      consensus: S,
      nodes,
      edges,
      steps: steps(S),
      diagnostics: diagnostics(S),
      principles: [
        "解释链不替代原始 Core",
        "冲突必须可见",
        "Evidence 是成熟度不是概率",
        "不同时间尺度不混票",
        "每个结论必须回指模块与字段",
      ],
    };
    return clone(obj);
  }
  function path(a, b) {
    const x1 = a.x + a.w / 2,
      y1 = a.y + a.h / 2,
      x2 = b.x - b.w / 2,
      y2 = b.y + b.h / 2,
      m = (x1 + x2) / 2;
    return `M${x1},${y1} C${m},${y1} ${m},${y2} ${x2},${y2}`;
  }
  function textCut(s, n = 18) {
    s = String(s || "");
    return s.length > n ? s.slice(0, n - 1) + "…" : s;
  }
  function svg(G) {
    const M = Object.fromEntries(G.nodes.map((n) => [n.id, n]));
    return `<svg class="tj170-svg" id="tj170Svg" viewBox="0 0 1140 570" role="img" aria-label="跨术数合参 Evidence 关系图"><g>${G.edges
      .map((e) => {
        const a = M[e.a],
          b = M[e.b];
        return a && b ? `<path class="tj170-edge ${e.type || ""}" d="${path(a, b)}"/>` : "";
      })
      .join(
        "",
      )}</g><g>${G.nodes.map((n) => `<g class="tj170-node ${n.tone || ""}" data-tj170-node="${E(n.id)}" transform="translate(${n.x - n.w / 2} ${n.y - n.h / 2})"><rect width="${n.w}" height="${n.h}"/><text x="10" y="20">${E(textCut(n.label, 20))}</text><text class="tag" x="10" y="35">${E(textCut(n.sub, 28))}</text>${n.kind === "system" ? `<text class="sub" x="${n.w - 10}" y="16" text-anchor="end">${E(n.data.id)}</text>` : ""}</g>`).join("")}</g></svg>`;
  }
  function detail(n) {
    if (!n)
      return `<h4>证据节点</h4><span class="kind">点击左侧节点</span><p>点击任意模块、Evidence 或合参结果，查看它在解释链中的角色、来源字段和回指位置。</p>`;
    if (n.kind === "system") {
      const s = n.data;
      return `<h4>${E(s.name)}</h4><span class="kind">${E(ROLE[s.role] || s.role)}</span><p>${E(s.result.headline)}</p><dl><dt>事项</dt><dd>${E(s.topic || "—")}${s.topicAdapted ? "（映射）" : ""}</dd><dt>方向</dt><dd>${E(s.role === "event" ? toneText(s.result.tone) : "不参与事项投票")}</dd><dt>Evidence</dt><dd>L${E(s.evidence.level)} · ${E(s.evidence.label || s.evidence.state)}</dd><dt>权重</dt><dd>${s.role === "event" ? E(s.result.weight) : "—"}</dd><dt>来源函数</dt><dd>${E(s.provenance.source)}</dd><dt>读取字段</dt><dd>${E((s.provenance.fields || []).join(" / ") || "—")}</dd></dl><div class="source">${E(s.provenance.note || "该节点只汇总结构化结果，原始盘面仍以对应模块为准。")}</div><button class="gbtn sm" data-tj170-open="${E(s.tab)}">打开 ${E(s.name)}</button>`;
    }
    if (n.kind === "context") {
      const c = n.data;
      return `<h4>同一时空上下文</h4><span class="kind">Context</span><p>所有系统必须尽量使用同一个人物、同一个观察时刻与同一个事项语义，才允许进入合参。</p><dl><dt>人物</dt><dd>${E(c.person.name)}</dd><dt>四柱</dt><dd>${E((c.person.pillars || []).join(" "))}</dd><dt>时刻</dt><dd>${E(c.time.civil)}</dd><dt>地点</dt><dd>${E(c.time.longitude)} / ${E(c.time.latitude)}</dd><dt>事项</dt><dd>${E(c.question.topic)}</dd><dt>问题</dt><dd>${E(c.question.text || "—")}</dd></dl>`;
    }
    if (n.kind === "registry")
      return `<h4>Evidence Registry</h4><span class="kind">成熟度总控</span><p>Evidence 记录各 Core 的自检、回归、古籍证据与外部对拍成熟度。它用于控制解释审慎程度，不表示预测准确率。</p><dl><dt>Schema</dt><dd>${E(n.data.schema || "tianji.evidence.snapshot.v1")}</dd><dt>等级</dt><dd>L1 结构 → L2 回归 → L3 对拍 → L4 古籍/规则 → L5 冻结候选</dd></dl>`;
    if (n.kind === "final") {
      return `<h4>事项层合参结果</h4><span class="kind">Aggregate</span><p>${E(n.label)}。这是可比较事项层的内部方向汇总，不覆盖八字、紫微或择日的独立信息。</p><dl><dt>方向值</dt><dd>${E(n.data.index)}</dd><dt>偏顺</dt><dd>${E(n.data.positive)}</dd><dt>中平</dt><dd>${E(n.data.neutral)}</dd><dt>偏阻</dt><dd>${E(n.data.negative)}</dd><dt>投票系统</dt><dd>${E((n.data.voters || []).join(" / "))}</dd></dl>`;
    }
    return `<h4>${E(n.label)}</h4><span class="kind">Synthesis</span><p>${E(Array.isArray(n.data) ? n.data.join(" ") : n.sub)}</p><div class="source">该节点由 v169 合参 Schema 自动生成；点击上游模块可查看具体来源与 Evidence。</div>`;
  }
  function panel(G) {
    const S = G.consensus,
      v = S.synthesis.eventVote,
      ev = S.systems.filter((x) => x.role === "event"),
      avg = ev.length ? ev.reduce((a, x) => a + (x.evidence.level || 0), 0) / ev.length : 0,
      exact = ev.filter((x) => !x.topicAdapted).length,
      conf = G.diagnostics.filter((x) => x.type === "bad").length;
    return `<div class="tj170"><section class="tj170-headbox"><div class="tj170-head"><div><h3>合参解释链 · Evidence 关系图</h3><p>把 v169 的“结果”展开成可检查的推导路径：上下文 → 各 Core → Evidence 成熟度 → 一致 / 冲突 / 独立信息 → 最终事项层方向。点击图中任意节点可查看来源字段与回指位置。</p></div><div class="tj170-tools"><button class="gbtn sm" id="tj170Copy">复制解释链 JSON</button><button class="gbtn sm" id="tj170Evidence">打开 Evidence 总控</button></div></div><div class="tj170-summary"><div class="tj170-sum"><small>事项模块覆盖</small><b>${ev.length} / 4</b></div><div class="tj170-sum"><small>完全同题映射</small><b>${exact} / ${ev.length}</b></div><div class="tj170-sum"><small>平均 Evidence</small><b>L${avg.toFixed(1)}</b></div><div class="tj170-sum ${conf ? "bad" : "good"}"><small>需解释冲突</small><b>${conf}</b></div></div></section><div class="tj170-work"><section class="tj170-graphbox"><div class="tj170-graphbar"><b>证据关系图</b><div class="tj170-legend"><span><i class="g"></i>偏顺</span><span><i class="b"></i>冲突/偏阻</span><span><i class="c"></i>独立信息</span><span><i class="d"></i>上下文</span></div></div>${svg(G)}</section><aside class="tj170-detail" id="tj170Detail">${detail(G.nodes.find((x) => x.id === "syn:final"))}</aside></div><div class="tj170-lower"><section class="tj170-chain"><h4>七步解释链</h4><div class="tj170-steps">${G.steps.map((x, i) => `<div class="tj170-step"><i>${i + 1}</i><b>${E(x.n)}</b><span>${E(x.d)}</span></div>`).join("")}</div></section><section class="tj170-diag"><h4>冲突与可比性诊断</h4><div class="tj170-diaglist">${G.diagnostics.map((x) => `<div class="tj170-diagitem ${x.type}"><b>${E(x.title)}</b><br>${E(x.text)}</div>`).join("")}</div></section></div><div class="tj170-boundary"><b>解释原则：</b>${G.principles.map(E).join(" · ")}。本图表示“推导关系和证据成熟度”，不是概率图，也不把传统术数结论包装成科学因果。</div></div>`;
  }
  function mount() {
    const a = document.querySelector(".tj169");
    if (!a || document.querySelector(".tj170")) return;
    let G;
    try {
      G = build(typeof R !== "undefined" ? R : null);
    } catch (e) {
      a.insertAdjacentHTML(
        "afterend",
        `<div class="tj170"><div class="tj170-boundary"><b>解释链暂不可用：</b>${E(e.message || e)}</div></div>`,
      );
      return;
    }
    a.insertAdjacentHTML("afterend", panel(G));
    const d = document.getElementById("tj170Detail"),
      sv = document.getElementById("tj170Svg");
    if (sv)
      sv.addEventListener("click", (e) => {
        const g = e.target.closest && e.target.closest("[data-tj170-node]");
        if (!g) return;
        sv.querySelectorAll(".tj170-node").forEach((x) => x.classList.toggle("on", x === g));
        const n = G.nodes.find((x) => x.id === g.dataset.tj170Node);
        if (d) d.innerHTML = detail(n);
      });
    if (!window.__TJ170_OPEN_BIND) {
      window.__TJ170_OPEN_BIND = 1;
      document.addEventListener("click", onClick);
    }
    const cp = document.getElementById("tj170Copy");
    if (cp)
      cp.onclick = () => {
        try {
          const s = JSON.stringify(G, null, 2);
          if (navigator.clipboard?.writeText)
            navigator.clipboard.writeText(s).then(() => toast("已复制合参解释链 JSON"));
          else toast("当前浏览器不支持直接复制");
        } catch (_) {}
      };
    const ev = document.getElementById("tj170Evidence");
    if (ev)
      ev.onclick = () => {
        try {
          selectTab("verify", true);
        } catch (_) {}
      };
  }
  function onClick(e) {
    const b = e.target.closest && e.target.closest("[data-tj170-open]");
    if (!b) return;
    try {
      selectTab(b.dataset.tj170Open, true);
    } catch (_) {}
  }
  function selfTest() {
    const c = [];
    const add = (n, ok, d = "") => c.push({ n, ok: !!ok, d });
    try {
      if (typeof R !== "undefined" && R) {
        const G = build(R),
          ids = new Set(G.nodes.map((x) => x.id));
        add("Schema", G.schema === SCHEMA, G.schema);
        add(
          "系统节点完整",
          G.nodes.filter((x) => x.kind === "system").length >= 7,
          String(G.nodes.filter((x) => x.kind === "system").length),
        );
        add(
          "Evidence 边覆盖",
          G.edges.filter((x) => x.type === "ev").length ===
            G.nodes.filter((x) => x.kind === "system").length,
          String(G.edges.filter((x) => x.type === "ev").length),
        );
        add("解释七步", G.steps.length === 7, String(G.steps.length));
        add(
          "边端点闭合",
          G.edges.every((x) => ids.has(x.a) && ids.has(x.b)),
          String(G.edges.length),
        );
        add("诊断存在", G.diagnostics.length > 0, String(G.diagnostics.length));
      } else add("运行上下文", true, "R 尚未建立，延迟验证");
    } catch (e) {
      add("exception", false, e.message || String(e));
    }
    return {
      ok: c.every((x) => x.ok),
      checks: c,
      pass: c.filter((x) => x.ok).length,
      total: c.length,
    };
  }
  try {
    const old = REF_BIND.over;
    REF_BIND.over = () => {
      try {
        old && old();
      } catch (_) {}
      try {
        mount();
      } catch (e) {
        console.warn("[v170 mount]", e);
      }
    };
  } catch (_) {}
  setTimeout(() => {
    try {
      if (document.querySelector(".tj169")) mount();
    } catch (_) {}
  }, 0);
  const API = Object.freeze({
    version: "1.0.0",
    build: V170_BUILD,
    schema: SCHEMA,
    build: (runtime, opts) => build(runtime || R, opts || {}),
    selfTest,
    manifest: () => ({
      module: "Tianji Consensus Explanation Graph",
      version: "1.0.0",
      build: V170_BUILD,
      schema: SCHEMA,
      features: ["七步解释链", "Evidence 关系图", "冲突诊断", "事项映射诊断", "来源字段回指"],
      principles: ["不覆盖原始 Core", "不抹平冲突", "Evidence 非概率", "不同尺度不混票"],
    }),
  });
  window.TianjiExplainGraph = API;
  try {
    if (window.TianjiCore) {
      TianjiCore.registerSource({
        id: "tianji-v170-explain-graph",
        type: "internal",
        title: "Tianji Consensus Explanation Graph 1.0",
        version: "1.0.0",
        baseline: "v169",
      });
      TianjiCore.registerEngine(
        {
          id: "consensus.explain.graph.v1",
          system: "aggregate",
          name: "Consensus Explanation Graph 1.0",
          version: "1.0.0",
          source: "tianji-v170-explain-graph",
          doctrine: "Schema → Evidence → agreement/conflict → traceable explanation",
          status: "active",
        },
        (input) => API.build(input?.runtime || R),
      );
    }
  } catch (e) {
    console.warn("[v170 registry]", e);
  }
  try {
    const road = window.TianjiRoadmap || {};
    window.TianjiRoadmap = Object.freeze(
      Object.assign({}, road, {
        nextMainline: [
          "AI 解释层（只消费 Consensus / Explain Schema）",
          "MCP / API",
          "奇门第三方对拍与高级 Evidence",
          "七政四余核心化前置：星历/许可证",
          "玄空山向宅盘 / 三合水法",
        ],
      }),
    );
  } catch (_) {}
  try {
    const T = selfTest(),
      bv = document.getElementById("buildVersion");

    window.TianjiSystemV170 = {
      version: "v170",
      build: V170_BUILD,
      explainSchema: SCHEMA,
      selfTest: T,
    };
  } catch (_) {}
})();
