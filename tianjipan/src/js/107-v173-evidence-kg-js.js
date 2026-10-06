(() => {
  "use strict";
  const V173_BUILD = "v173 · 2026-10-05 16:52 +08:00";
  const SCHEMA = "tianji.evidence.graph.v1";
  const TRACE_SCHEMA = "tianji.evidence.trace.v1";
  const RULE_SCHEMA = "tianji.rule.catalog.v1";
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
  const esc2 = (s) => {
    try {
      return esc(String(s == null ? "" : s));
    } catch (_) {
      return String(s == null ? "" : s).replace(
        /[&<>"']/g,
        (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[m],
      );
    }
  };
  const SYSTEMS = {
    calendar: { name: "时间/历法", tab: "verify" },
    bazi: { name: "八字", tab: "bazi" },
    ziwei: { name: "紫微", tab: "ziwei" },
    qimen: { name: "奇门", tab: "qimen" },
    liuren: { name: "六壬", tab: "liuren" },
    liuyao: { name: "六爻", tab: "liuyao" },
    meihua: { name: "梅花", tab: "yi" },
    zeri: { name: "择日", tab: "zeri" },
    aggregate: { name: "合参", tab: "overview" },
    explain: { name: "解释", tab: "overview" },
    ai: { name: "AI解释", tab: "overview" },
    system: { name: "系统", tab: "verify" },
  };
  /* 规则目录只登记已经在工程中存在或已明确声明的口径；不凭空补术数规则。 */
  const RULES = [
    {
      id: "calendar.year.lichun",
      system: "calendar",
      name: "立春换年",
      layer: "calendar",
      statement: "年界按立春切换；与民用公历1月1日分离。",
      sources: ["tianji-v86-time-core"],
      outputs: ["time.yearBoundary", "bazi.yearPillar"],
    },
    {
      id: "calendar.month.jie",
      system: "calendar",
      name: "以节换月",
      layer: "calendar",
      statement: "月界按节气“节”切换；月柱不是按农历初一切换。",
      sources: ["tianji-v86-time-core"],
      outputs: ["time.monthBoundary", "bazi.monthPillar"],
    },
    {
      id: "calendar.day.zi",
      system: "calendar",
      name: "子初换日",
      layer: "calendar",
      statement: "核心配置显式记录23:00子初换日口径。",
      sources: ["tianji-v86-time-core"],
      outputs: ["time.dayBoundary", "bazi.dayPillar"],
    },
    {
      id: "bazi.four-pillars",
      system: "bazi",
      name: "四柱确定性排盘",
      layer: "core",
      statement: "将统一时间上下文转为年、月、日、时四柱；结果先于格局、喜用等解释。",
      sources: ["tianji-v88-bazi-core", "tianji-v89-bazi-verification"],
      outputs: ["bazi.year", "bazi.month", "bazi.day", "bazi.hour"],
    },
    {
      id: "bazi.verify.shadow",
      system: "bazi",
      name: "第三方影子交叉验证",
      layer: "evidence",
      statement: "主 Core 与固定第三方实现做影子校验；第三方不接管主计算。",
      sources: ["mystilight-8char-1.0.1", "tianji-v89-bazi-verification"],
      outputs: ["evidence.bazi"],
    },
    {
      id: "ziwei.core.layout",
      system: "ziwei",
      name: "命宫/星曜安置核心",
      layer: "core",
      statement: "紫微主盘使用确定性 Core 安宫安星，并分批扩展辅煞杂曜。",
      sources: ["tianji-v90-ziwei-core", "iztro-2.6.1"],
      outputs: ["ziwei.palaces", "ziwei.stars"],
    },
    {
      id: "ziwei.flow.layers",
      system: "ziwei",
      name: "大限/流年/月/日运限层",
      layer: "rule",
      statement: "目标日期运限拆为大限、流年、流月、流日等层，不与本命盘混成单一字段。",
      sources: ["tianji-v103-ziwei-yearly-flow", "tianji-v104-ziwei-monthly-flow"],
      outputs: ["ziwei.flow.year", "ziwei.flow.month", "ziwei.flow.day"],
    },
    {
      id: "qimen.shijia",
      system: "qimen",
      name: "时家奇门 · 转盘拆补",
      layer: "core",
      statement: "时家奇门主 Core 显式采用转盘/拆补等既定口径，并把门派选项放在 doctrine 层。",
      sources: ["tianji-v110-qimen-core", "tianji-v112-qimen-doctrine"],
      outputs: ["qimen.palaces", "qimen.doors", "qimen.stars", "qimen.gods"],
    },
    {
      id: "qimen.period",
      system: "qimen",
      name: "日/月/年家研究口径",
      layer: "rule",
      statement: "日家、月家、年家作为独立时间尺度进入奇门四家，不混写成时家奇门。",
      sources: ["tianji-v165-qimen-period"],
      outputs: ["qimen.period.day", "qimen.period.month", "qimen.period.year"],
    },
    {
      id: "liuren.sike.sanchuan",
      system: "liuren",
      name: "四课三传规则链",
      layer: "core",
      statement: "六壬以天地盘、四课、九宗门取三传形成确定性排盘链；特殊课体单独审计。",
      sources: ["virtual:liuren-core"],
      outputs: ["liuren.heavenPlate", "liuren.fourLessons", "liuren.threeTransmissions"],
    },
    {
      id: "liuren.shehai",
      system: "liuren",
      name: "涉害四级审计",
      layer: "evidence",
      statement: "涉害、见机、察微、缀瑕等分支保留规则轨迹，并保留文献63/64差异。",
      sources: ["virtual:liuren-evidence5"],
      outputs: ["liuren.ruleTrace", "evidence.liuren"],
    },
    {
      id: "liuyao.najia",
      system: "liuyao",
      name: "纳甲装卦与世应六亲",
      layer: "core",
      statement: "六爻把卦结构、纳甲、六亲、世应、旬空、动变作为可复现结构；占断另置上层。",
      sources: ["virtual:liuyao-core"],
      outputs: ["liuyao.lines", "liuyao.relatives", "liuyao.hostGuest", "liuyao.changes"],
    },
    {
      id: "liuyao.yongshen",
      system: "liuyao",
      name: "按事项取用神",
      layer: "rule",
      statement: "求财、事业、婚姻等事项映射不同用神；属于显式规则，不让解释层临时改口径。",
      sources: ["virtual:liuyao-evidence1"],
      outputs: ["liuyao.yongshen", "consensus.liuyao"],
    },
    {
      id: "meihua.time",
      system: "meihua",
      name: "年月日时起卦",
      layer: "core",
      statement: "按《梅花易数》既定先天数和年月日时规则得到上下卦与动爻。",
      sources: ["tianji-v166-meihua-core"],
      outputs: ["meihua.original", "meihua.movingLine"],
    },
    {
      id: "meihua.tiyong",
      system: "meihua",
      name: "体用互变结构",
      layer: "rule",
      statement: "本卦、互卦、变卦及体用关系结构化输出；类象与应期不伪装成唯一确定算法。",
      sources: ["tianji-v166-meihua-core"],
      outputs: ["meihua.mutual", "meihua.changed", "meihua.tiyong"],
    },
    {
      id: "zeri.fact-layer",
      system: "zeri",
      name: "择日事实层",
      layer: "core",
      statement: "日柱、节令月支、建除、宿、黄黑道、冲煞、宜忌先作为事实层生成。",
      sources: ["tianji-v167-zeri-core"],
      outputs: ["zeri.facts"],
    },
    {
      id: "zeri.policy",
      system: "zeri",
      name: "显式评分 Policy",
      layer: "policy",
      statement: "事项宜忌、冲命、破日等按公开权重评分；评分策略不是传统唯一法。",
      sources: ["tianji-v167-zeri-core"],
      outputs: ["zeri.score", "zeri.auditSteps"],
    },
    {
      id: "consensus.comparable",
      system: "aggregate",
      name: "只在可比较层合参",
      layer: "aggregate",
      statement:
        "奇门、六壬、六爻、梅花参与事项层方向合参；八字/紫微作为命局背景，择日作为时间选择层。",
      sources: ["tianji-v169-consensus-schema"],
      outputs: ["consensus.eventVote", "consensus.agreements", "consensus.conflicts"],
    },
    {
      id: "consensus.keep-conflict",
      system: "aggregate",
      name: "冲突不抹平",
      layer: "aggregate",
      statement: "不同体系结果相反时保留冲突，不用简单多数票强制覆盖差异。",
      sources: ["tianji-v169-consensus-schema", "tianji-v170-explain-graph"],
      outputs: ["consensus.conflicts", "explain.conflictDiagnosis"],
    },
    {
      id: "explain.provenance",
      system: "explain",
      name: "结论必须可回指",
      layer: "explain",
      statement: "解释必须回到模块、Evidence等级、字段和来源函数；图谱只解释已有计算链。",
      sources: ["tianji-v170-explain-graph"],
      outputs: ["explain.nodes", "explain.edges", "explain.trace"],
    },
    {
      id: "ai.schema-only",
      system: "ai",
      name: "AI只消费结构化结果",
      layer: "ai-guard",
      statement: "AI不重新排盘、不发明规则，只消费 Consensus / Explain / Evidence 等结构化结果。",
      sources: ["tianji-v171-ai-explain"],
      outputs: ["ai.report", "ai.packet"],
    },
    {
      id: "api.external-contract",
      system: "system",
      name: "外部调用保持同一 Schema",
      layer: "api",
      statement: "TianjiAPI / JSON-RPC / MCP 适配器只转发同一 Core 与 Schema，不复制另一套算法。",
      sources: ["tianji-v172-api-gateway"],
      outputs: ["api.response", "mcp.tools"],
    },
  ];
  const FIELD_GROUPS = {
    calendar: ["time.yearBoundary", "time.monthBoundary", "time.dayBoundary"],
    bazi: ["bazi.year", "bazi.month", "bazi.day", "bazi.hour"],
    ziwei: ["ziwei.palaces", "ziwei.stars", "ziwei.flow.year"],
    qimen: ["qimen.palaces", "qimen.doors", "qimen.stars", "qimen.gods"],
    liuren: ["liuren.heavenPlate", "liuren.fourLessons", "liuren.threeTransmissions"],
    liuyao: ["liuyao.lines", "liuyao.yongshen", "liuyao.changes"],
    meihua: ["meihua.original", "meihua.movingLine", "meihua.changed"],
    zeri: ["zeri.facts", "zeri.score", "zeri.auditSteps"],
    aggregate: ["consensus.eventVote", "consensus.agreements", "consensus.conflicts"],
    explain: ["explain.trace", "explain.conflictDiagnosis"],
    ai: ["ai.report", "ai.packet"],
    system: ["api.response", "mcp.tools"],
  };
  const ST = { system: "all", layer: "all", selected: null, lastGraph: null };
  function sourceCatalog() {
    const reg = safe(() => window.TianjiCore?.listSources?.(), []) || [];
    const ev = safe(() => window.TianjiEvidence?.catalog?.(), []) || [];
    const out = reg.map((x) => ({
      id: "source:" + x.id,
      sourceId: x.id,
      type: "source",
      system: guessSystem(x.id + " " + (x.title || "")),
      title: x.title || x.id,
      subtitle: [x.type, x.version, x.role].filter(Boolean).join(" · "),
      meta: clone(x),
    }));
    const have = new Set(out.map((x) => x.sourceId));
    const virtual = [
      {
        id: "virtual:liuren-core",
        system: "liuren",
        title: "大六壬 Core 规则链",
        subtitle: "v121–v128 · 四课三传 / 九宗门",
      },
      {
        id: "virtual:liuren-evidence5",
        system: "liuren",
        title: "大六壬 Evidence 5.0",
        subtitle: "古籍代表例 · 720/8640 回归 · 8638外部课例",
      },
      {
        id: "virtual:liuyao-core",
        system: "liuyao",
        title: "六爻 Core 1.0",
        subtitle: "v129 · 纳甲 / 六亲 / 世应 / 动变",
      },
      {
        id: "virtual:liuyao-evidence1",
        system: "liuyao",
        title: "六爻 Evidence 1.0",
        subtitle: "v130 · 结构/用神规则审计",
      },
    ];
    virtual.forEach((v) => {
      if (!have.has(v.id))
        out.push({
          id: "source:" + v.id,
          sourceId: v.id,
          type: "source",
          system: v.system,
          title: v.title,
          subtitle: v.subtitle,
          meta: { type: "internal-evidence-bridge" },
        });
    });
    ev.forEach((x) =>
      out.push({
        id: "evidence:" + x.id,
        type: "evidence",
        system: x.id,
        title: `${x.name} · Evidence L${x.level}`,
        subtitle: `${x.label} · ${x.verify}`,
        meta: clone(x),
      }),
    );
    return out;
  }
  function guessSystem(s) {
    s = String(s).toLowerCase();
    for (const k of ["bazi", "ziwei", "qimen", "liuren", "liuyao", "meihua", "zeri"])
      if (s.includes(k)) return k;
    if (s.includes("time") || s.includes("calendar") || s.includes("lunar")) return "calendar";
    if (s.includes("consensus")) return "aggregate";
    if (s.includes("explain")) return "explain";
    if (s.includes("ai-") || s.includes("ai ")) return "ai";
    return "system";
  }
  function graph() {
    const nodes = [],
      edges = [],
      seen = new Set(),
      add = (n) => {
        if (!seen.has(n.id)) {
          seen.add(n.id);
          nodes.push(n);
        }
        return n.id;
      },
      edge = (a, b, kind, label = "") => {
        if (seen.has(a) && seen.has(b)) edges.push({ from: a, to: b, kind, label });
      };
    sourceCatalog().forEach(add);
    RULES.forEach((r) =>
      add({
        id: "rule:" + r.id,
        type: "rule",
        system: r.system,
        title: r.name,
        subtitle: r.layer,
        meta: clone(r),
      }),
    );
    const engines = safe(() => window.TianjiCore?.listEngines?.(), []) || [];
    engines.forEach((e) =>
      add({
        id: "engine:" + e.id,
        type: "engine",
        system: e.system || guessSystem(e.id),
        title: e.name || e.id,
        subtitle: [e.version, e.doctrine, e.status].filter(Boolean).join(" · "),
        meta: clone(e),
      }),
    );
    Object.entries(FIELD_GROUPS).forEach(([sys, arr]) =>
      arr.forEach((f) =>
        add({
          id: "field:" + f,
          type: "field",
          system: sys,
          title: f,
          subtitle: "结构化输出字段",
          meta: { path: f },
        }),
      ),
    );
    add({
      id: "conclusion:consensus",
      type: "conclusion",
      system: "aggregate",
      title: "跨术数合参结论",
      subtitle: "一致点 / 冲突点 / 独立信息",
      meta: { schema: "tianji.consensus.v1" },
    });
    add({
      id: "conclusion:explain",
      type: "explain",
      system: "explain",
      title: "解释链 / 冲突诊断",
      subtitle: "tianji.explain.graph.v1",
      meta: { schema: "tianji.explain.graph.v1" },
    });
    add({
      id: "conclusion:ai",
      type: "explain",
      system: "ai",
      title: "AI 守门解释",
      subtitle: "tianji.ai.explain.v1",
      meta: { schema: "tianji.ai.explain.v1" },
    });
    add({
      id: "conclusion:external",
      type: "explain",
      system: "system",
      title: "MCP / API 输出",
      subtitle: "同一 Schema 对外暴露",
      meta: { schema: "tianji.api.v1" },
    });
    /* 来源/证据 -> 规则 */
    RULES.forEach((r) => {
      r.sources.forEach((s) => {
        const a = "source:" + s;
        if (seen.has(a)) edge(a, "rule:" + r.id, "support", "支持/出处");
      });
      const evid = "evidence:" + r.system;
      if (seen.has(evid)) edge(evid, "rule:" + r.id, "verify", "Evidence");
    });
    /* 规则 -> 同系统引擎；若引擎不存在则仍通过字段连接体现规则链 */
    RULES.forEach((r) => {
      const es = engines.filter((e) => (e.system || guessSystem(e.id)) === r.system);
      es.slice(-4).forEach((e) => edge("rule:" + r.id, "engine:" + e.id, "verify", "实现/验证"));
      (r.outputs || []).forEach((f) => {
        const fid = "field:" + f;
        if (seen.has(fid)) {
          if (es.length) es.slice(-2).forEach((e) => edge("engine:" + e.id, fid, "feed", "输出"));
          else edge("rule:" + r.id, fid, "feed", "输出");
        }
      });
    });
    /* 字段 -> 合参 / 解释 / AI / API */
    ["qimen", "liuren", "liuyao", "meihua"].forEach((sys) =>
      (FIELD_GROUPS[sys] || []).forEach((f) =>
        edge("field:" + f, "conclusion:consensus", "feed", "事项层输入"),
      ),
    );
    ["bazi", "ziwei", "zeri"].forEach((sys) =>
      (FIELD_GROUPS[sys] || []).forEach((f) =>
        edge("field:" + f, "conclusion:consensus", "support", "独立信息"),
      ),
    );
    edge("conclusion:consensus", "conclusion:explain", "feed", "规范化解释");
    edge("conclusion:explain", "conclusion:ai", "feed", "结构化输入");
    edge("conclusion:ai", "conclusion:external", "feed", "标准输出");
    const obj = {
      schema: SCHEMA,
      build: V173_BUILD,
      generatedAt: new Date().toISOString(),
      nodes,
      edges,
      stats: {
        nodes: nodes.length,
        edges: edges.length,
        sources: nodes.filter((x) => x.type === "source").length,
        evidence: nodes.filter((x) => x.type === "evidence").length,
        rules: nodes.filter((x) => x.type === "rule").length,
        engines: nodes.filter((x) => x.type === "engine").length,
        fields: nodes.filter((x) => x.type === "field").length,
      },
    };
    ST.lastGraph = obj;
    return clone(obj);
  }
  function ruleCatalog(system = "all") {
    return clone(RULES.filter((r) => system === "all" || r.system === system));
  }
  function trace(target) {
    const G = ST.lastGraph || graph(),
      id = String(target || "conclusion:ai").includes(":")
        ? String(target)
        : "field:" + String(target);
    if (!G.nodes.some((x) => x.id === id))
      return { schema: TRACE_SCHEMA, build: V173_BUILD, target: id, found: false, paths: [] };
    const rev = new Map();
    G.edges.forEach((e) => {
      if (!rev.has(e.to)) rev.set(e.to, []);
      rev.get(e.to).push(e);
    });
    const paths = [];
    const walk = (cur, path, seen2, depth) => {
      if (depth > 8) return;
      const incoming = rev.get(cur) || [];
      if (!incoming.length) {
        paths.push(path.slice().reverse());
        return;
      }
      for (const e of incoming) {
        if (seen2.has(e.from)) continue;
        const ns = new Set(seen2);
        ns.add(e.from);
        walk(e.from, [...path, e], ns, depth + 1);
      }
    };
    walk(id, [], new Set([id]), 0);
    const norm = paths
      .slice(0, 30)
      .map((p) => p.map((e) => ({ from: e.from, to: e.to, kind: e.kind, label: e.label })));
    return {
      schema: TRACE_SCHEMA,
      build: V173_BUILD,
      target: id,
      found: true,
      paths: norm,
      node: G.nodes.find((x) => x.id === id),
    };
  }
  function nodeDetail(id) {
    const G = ST.lastGraph || graph();
    return clone(G.nodes.find((x) => x.id === id) || null);
  }
  function filteredGraph() {
    const G = graph(),
      sys = ST.system,
      lay = ST.layer;
    let nodes = G.nodes.filter(
      (n) =>
        sys === "all" ||
        n.system === sys ||
        ["aggregate", "explain", "ai", "system"].includes(n.system),
    );
    if (lay !== "all")
      nodes = nodes.filter((n) => n.type === lay || ["conclusion", "explain"].includes(n.type));
    const ids = new Set(nodes.map((n) => n.id)),
      edges = G.edges.filter((e) => ids.has(e.from) && ids.has(e.to));
    return { ...G, nodes, edges };
  }
  const COLS = [
    ["source", "来源 / Evidence"],
    ["rule", "Rule / Doctrine"],
    ["engine", "确定性 Engine"],
    ["field", "输出 Field"],
    ["conclusion", "合参 Conclusion"],
    ["explain", "Explain / AI / API"],
  ];
  function svgHTML() {
    const G = filteredGraph(),
      W = 1120,
      H = 590,
      pad = 18,
      colW = (W - pad * 2) / COLS.length;
    const groups = COLS.map(([type, title], ci) => {
      const arr = G.nodes.filter((n) =>
          type === "source" ? n.type === "source" || n.type === "evidence" : n.type === type,
        ),
        gap = Math.max(48, Math.min(76, (H - 70) / Math.max(1, arr.length))),
        start = 56;
      return {
        type,
        title,
        ci,
        arr: arr.map((n, i) => ({
          ...n,
          x: pad + ci * colW + 8,
          y: start + i * gap,
          w: colW - 18,
          h: 40,
        })),
      };
    });
    const pos = new Map();
    groups.forEach((g) => g.arr.forEach((n) => pos.set(n.id, n)));
    const edgeSvg = G.edges
      .map((e) => {
        const a = pos.get(e.from),
          b = pos.get(e.to);
        if (!a || !b) return "";
        const x1 = a.x + a.w,
          y1 = a.y + a.h / 2,
          x2 = b.x,
          y2 = b.y + b.h / 2,
          c1 = x1 + (x2 - x1) * 0.45,
          c2 = x2 - (x2 - x1) * 0.45;
        return `<path class="kg173-edge ${e.kind === "verify" ? "verify" : e.kind === "feed" ? "feed" : ""}" d="M${x1},${y1} C${c1},${y1} ${c2},${y2} ${x2},${y2}"><title>${esc2(e.label || e.kind)}</title></path>`;
      })
      .join("");
    const nodeSvg = groups
      .map((g) =>
        g.arr
          .map(
            (n) =>
              `<g class="kg173-node ${n.type}${ST.selected === n.id ? " on" : ""}" data-kg173-node="${esc2(n.id)}"><rect x="${n.x}" y="${n.y}" rx="7" ry="7" width="${n.w}" height="${n.h}"/><text class="title" x="${n.x + 8}" y="${n.y + 16}">${esc2(short(n.title, 24))}</text><text class="sub" x="${n.x + 8}" y="${n.y + 31}">${esc2(short(n.subtitle || SYSTEMS[n.system]?.name || n.system, 30))}</text></g>`,
          )
          .join(""),
      )
      .join("");
    const titles = groups
      .map(
        (g) =>
          `<text class="kg173-coltitle" x="${pad + g.ci * colW + 10}" y="26">${esc2(g.title.toUpperCase())}</text>`,
      )
      .join("");
    return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Evidence 规则知识图谱">${titles}${edgeSvg}${nodeSvg}</svg>`;
  }
  function short(s, n) {
    s = String(s || "");
    return s.length > n ? s.slice(0, n - 1) + "…" : s;
  }
  function detailHTML() {
    const G = ST.lastGraph || graph(),
      n = ST.selected ? G.nodes.find((x) => x.id === ST.selected) : null;
    if (!n)
      return `<p>点击图中的节点，查看它在“来源 → 规则 → Engine → 字段 → 合参 → 解释”链上的位置。</p>`;
    const tr = trace(n.id),
      m = n.meta || {},
      paths = tr.paths || [],
      best = paths[0] || [];
    return `<div class="kg173-detail"><span>节点</span><b>${esc2(n.title)}</b><span>类型</span><b>${esc2(n.type)}</b><span>系统</span><b>${esc2(SYSTEMS[n.system]?.name || n.system)}</b><span>ID / Path</span><code>${esc2(n.id)}</code><span>说明</span><b>${esc2(n.subtitle || m.statement || m.note || "—")}</b></div><h4 style="margin-top:11px">反向追溯</h4><div class="kg173-trace">${
      best.length
        ? best
            .map((e, i) => {
              const x = G.nodes.find((z) => z.id === e.from);
              return `<div class="kg173-trace-step"><i>${i + 1}</i><div><b>${esc2(x?.title || e.from)}</b><small>${esc2(e.label || e.kind)} → ${esc2(G.nodes.find((z) => z.id === e.to)?.title || e.to)}</small></div></div>`;
            })
            .join("")
        : "<p>当前节点已是链路源头，或没有更上游的登记关系。</p>"
    }</div>`;
  }
  function rulesHTML() {
    const a = ruleCatalog(ST.system);
    return a
      .map(
        (r) =>
          `<article class="kg173-rule"><h5>${esc2(r.name)}</h5><p>${esc2(r.statement)}</p><div class="meta"><span>${esc2(SYSTEMS[r.system]?.name || r.system)}</span><span>${esc2(r.layer)}</span><span>${r.outputs.length} outputs</span></div></article>`,
      )
      .join("");
  }
  function sourceHTML() {
    const a = sourceCatalog().filter(
      (x) => ST.system === "all" || x.system === ST.system || x.type === "evidence",
    );
    return a
      .slice(0, 80)
      .map(
        (x) =>
          `<div class="kg173-source-row"><b>${esc2(x.title)}</b><small>${esc2(x.sourceId || x.id)} · ${esc2(x.subtitle || x.system)}</small></div>`,
      )
      .join("");
  }
  function page() {
    const G = graph(),
      S = G.stats,
      systems = [
        "all",
        ...Object.keys(SYSTEMS).filter((x) => !["explain", "ai", "system"].includes(x)),
      ];
    return `<div class="kg173"><section class="kg173-hero"><div class="kg173-head"><div><h3>Evidence 规则知识图谱 · 原文/来源 → 规则 → 算法 → 字段 → 结论</h3><p>把此前“有 Evidence”升级为可追溯关系图。图谱不会重新计算术数，而是登记：某条规则依据什么来源、由哪个 Engine 实现、输出到哪个字段，以及这些字段如何进入合参、解释与 AI。对无法核实为古籍原式的内容，只登记为内部规则或 Evidence bridge，不伪造古籍出处。</p></div><div class="kg173-badges"><span class="kg173-badge">${SCHEMA}</span><span class="kg173-badge">${RULE_SCHEMA}</span><span class="kg173-badge">${TRACE_SCHEMA}</span></div></div><div class="kg173-kpis"><div class="kg173-kpi"><small>图谱节点</small><b>${S.nodes}</b></div><div class="kg173-kpi"><small>关系边</small><b>${S.edges}</b></div><div class="kg173-kpi"><small>来源节点</small><b>${S.sources}</b></div><div class="kg173-kpi"><small>Evidence</small><b>${S.evidence}</b></div><div class="kg173-kpi"><small>显式规则</small><b>${S.rules}</b></div><div class="kg173-kpi"><small>结构化字段</small><b>${S.fields}</b></div></div></section><section class="kg173-toolbar"><label>系统<select id="kg173System">${systems.map((x) => `<option value="${x}"${ST.system === x ? " selected" : ""}>${x === "all" ? "全部" : SYSTEMS[x]?.name || x}</option>`).join("")}</select></label><label>层<select id="kg173Layer"><option value="all"${ST.layer === "all" ? " selected" : ""}>全部层</option><option value="source"${ST.layer === "source" ? " selected" : ""}>来源/Evidence</option><option value="rule"${ST.layer === "rule" ? " selected" : ""}>Rule</option><option value="engine"${ST.layer === "engine" ? " selected" : ""}>Engine</option><option value="field"${ST.layer === "field" ? " selected" : ""}>Field</option></select></label><button class="gbtn sm" id="kg173Reset">重置视图</button><button class="gbtn sm" id="kg173Copy">复制完整图谱 JSON</button><button class="gbtn sm" id="kg173TraceAI">追溯到 AI 解释</button><span class="sp"></span><span class="dim sm">点击任意节点查看反向证据链</span></section><div class="kg173-main"><section class="kg173-graph" id="kg173Graph">${svgHTML()}</section><aside class="kg173-side"><section class="kg173-card"><h4>节点详情 / Trace</h4><div id="kg173Detail">${detailHTML()}</div></section><section class="kg173-card"><h4>图谱边界</h4><p>“Evidence L”等级表示验证成熟度，不等于命中率。古籍、第三方代码、内部规则与评分 Policy 分开标识；缺少明确外部文献节点的六壬/六爻旧模块使用 Evidence bridge，避免虚构书名或伪造原文。</p></section></aside></div><section class="kg173-card"><h4>当前筛选规则目录</h4><div class="kg173-rules" id="kg173Rules">${rulesHTML()}</div></section><section class="kg173-card"><h4>已登记来源 / Evidence 节点</h4><div class="kg173-source-list" id="kg173Sources">${sourceHTML()}</div></section><div class="kg173-boundary"><b>v173 完成范围：</b>第一阶段已经把来源、Evidence、规则、注册 Engine、输出字段、Consensus、Explain、AI、API 串成统一图谱，并提供程序化 Trace。下一阶段自然进入“自然语言问事路由”：先识别用户问题属于什么事项、需要哪些 Core，再通过本图谱限制允许调用的规则和输出链。</div></div>`;
  }
  function taskBoard() {
    const tasks = [
      ["P0", "统一 AI 解释层", "done", "v171 完成第一阶段：确定性解释 + AI Packet。"],
      ["P0", "MCP / API 外部调用层", "done", "v172：TianjiAPI + JSON-RPC + MCP/OpenAPI 适配契约。"],
      [
        "P0",
        "Evidence / 规则知识图谱",
        "done",
        "v173 第一阶段完成：Source/Evidence → Rule → Engine → Field → Consensus → Explain → AI/API 可追溯。",
      ],
      [
        "P0",
        "自然语言问事路由",
        "doing",
        "下一主线：问题分类、模块选择、事项映射、路由依据与回指。",
      ],
      ["P0", "统一消费者结果页 / 报告", "todo", "统一成结论→依据→利阻→行动→时间窗→专业证据。"],
      ["P1", "奇门四家第三方对拍 / 高级 Evidence", "todo", "日/月/年家仍需现代软件逐盘交叉验证。"],
      ["P1", "六爻完整旺衰 / 卦格 / 应期", "todo", "Core 已有，完整占断规则尚未封顶。"],
      ["P1", "紫微完整飞星体系", "todo", "向心/离心自化、来因宫与应期流派仍待补。"],
      ["P1", "七政四余核心化", "blocked", "前置：可靠星历、四余口径与许可证方案。"],
      ["P1", "玄空完整宅盘", "todo", "运盘、山星、向星、替卦等未成统一 Core。"],
      ["P1", "三合水法 Core", "todo", "罗盘已有，水法规则链仍待核心化。"],
      ["P2", "历史时区 / DST", "todo", "真太阳时已有；历史时区数据库仍欠。"],
      ["P2", "关系长期时间轴", "todo", "关系随年份阶段变化尚未产品化。"],
      [
        "P2",
        "合参 Evidence 正式报告",
        "todo",
        "把 v169–v173 的 Schema/Trace/API provenance 统一导出。",
      ],
    ];
    const done = tasks.filter((x) => x[2] === "done").length,
      doing = tasks.filter((x) => x[2] === "doing").length,
      p = Math.round(((done + doing * 0.5) / tasks.length) * 100);
    const labels = { done: "完成", doing: "进行中", todo: "待办", blocked: "前置阻塞" };
    return `<div class="tj172-taskboard" style="display:grid!important"><section class="tj172-taskhero"><div class="tj172-taskhead"><div><h3>近期紧急重要任务清单 · v173</h3><p>v173 已把 Evidence 从“模块成熟度表”推进到可追溯规则知识图谱。下一紧急主线切换到自然语言问事路由。</p></div><div class="tj172-progress"><div class="tj172-progressbar"><i style="width:${p}%"></i></div><small>进度 ${p}% · 完成 ${done}/${tasks.length} · 进行中 ${doing}</small></div></div></section><div class="tj172-taskgrid">${[
      "P0",
      "P1",
      "P2",
    ]
      .map(
        (P) =>
          `<section class="tj172-taskcol"><h4>${P} · ${P === "P0" ? "紧急重要" : P === "P1" ? "重要主线" : "后续完善"}</h4>${tasks
            .filter((x) => x[0] === P)
            .map(
              (x) =>
                `<div class="tj172-task ${x[2]}"><span class="st">${labels[x[2]]}</span><div><b>${esc2(x[1])}</b><small>${esc2(x[3])}</small></div></div>`,
            )
            .join("")}</section>`,
      )
      .join("")}</div></div>`;
  }
  function bind() {
    const sy = document.getElementById("kg173System");
    if (sy)
      sy.onchange = () => {
        ST.system = sy.value;
        ST.selected = null;
        rerender();
      };
    const la = document.getElementById("kg173Layer");
    if (la)
      la.onchange = () => {
        ST.layer = la.value;
        ST.selected = null;
        rerender();
      };
    const rs = document.getElementById("kg173Reset");
    if (rs)
      rs.onclick = () => {
        ST.system = "all";
        ST.layer = "all";
        ST.selected = null;
        rerender();
      };
    const cp = document.getElementById("kg173Copy");
    if (cp) cp.onclick = () => copy(JSON.stringify(graph(), null, 2), "已复制 Evidence 图谱 JSON");
    const ta = document.getElementById("kg173TraceAI");
    if (ta)
      ta.onclick = () => {
        ST.selected = "conclusion:ai";
        rerenderDetail();
      };
    document.querySelectorAll("[data-kg173-node]").forEach(
      (n) =>
        (n.onclick = () => {
          ST.selected = n.dataset.kg173Node;
          rerenderGraph();
          rerenderDetail();
        }),
    );
  }
  function copy(t, msg) {
    try {
      if (navigator.clipboard?.writeText) navigator.clipboard.writeText(t).then(() => toast(msg));
      else toast("当前浏览器不支持直接复制");
    } catch (_) {}
  }
  function rerender() {
    const p = document.querySelector(".kg173");
    if (!p) return;
    p.outerHTML = page();
    bind();
  }
  function rerenderGraph() {
    const g = document.getElementById("kg173Graph");
    if (g) g.innerHTML = svgHTML();
    document.querySelectorAll("[data-kg173-node]").forEach(
      (n) =>
        (n.onclick = () => {
          ST.selected = n.dataset.kg173Node;
          rerenderGraph();
          rerenderDetail();
        }),
    );
  }
  function rerenderDetail() {
    const d = document.getElementById("kg173Detail");
    if (d) d.innerHTML = detailHTML();
  }
  function patchVerify() {
    try {
      const oldPage = REF_PANES.verify,
        oldBind = REF_BIND.verify;
      if (oldPage && !oldPage.__v173) {
        const fn = () => taskBoard() + page() + oldPage();
        fn.__v173 = true;
        REF_PANES.verify = fn;
      }
      REF_BIND.verify = () => {
        try {
          oldBind && oldBind();
        } catch (_) {}
        bind();
      };
    } catch (e) {
      console.warn("[v173 verify patch]", e);
    }
  }
  function selfTest() {
    const c = [],
      add = (n, ok, d = "") => c.push({ n, ok: !!ok, d });
    try {
      const G = graph();
      add("Schema", G.schema === SCHEMA, G.schema);
      add("规则登记", G.stats.rules >= 20, String(G.stats.rules));
      add(
        "节点关系",
        G.stats.nodes > G.stats.rules && G.stats.edges > 30,
        `${G.stats.nodes}/${G.stats.edges}`,
      );
      add("字段层", G.stats.fields >= 25, String(G.stats.fields));
      const t = trace("conclusion:ai");
      add("AI 可回溯", t.found && t.paths.length > 0, String(t.paths.length));
      const z = trace("field:zeri.score");
      add("字段可回溯", z.found && z.paths.length > 0, String(z.paths.length));
      const fake = RULES.some((r) => r.sources.some((s) => s.startsWith("virtual:")));
      add("Legacy Evidence bridge 显式", fake, "virtual source explicit");
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
  const API = Object.freeze({
    version: "1.0.0",
    build: V173_BUILD,
    schema: SCHEMA,
    graph,
    trace,
    node: nodeDetail,
    rules: ruleCatalog,
    sources: () => clone(sourceCatalog()),
    selfTest,
    manifest: () => ({
      module: "Tianji Evidence Rule Knowledge Graph",
      version: "1.0.0",
      build: V173_BUILD,
      schema: SCHEMA,
      traceSchema: TRACE_SCHEMA,
      ruleSchema: RULE_SCHEMA,
      principles: [
        "不伪造古籍来源",
        "规则与解释分层",
        "Evidence 等级不是准确率",
        "所有合参结论可回指字段与规则",
        "AI 只消费结构化链",
      ],
    }),
  });
  window.TianjiEvidenceGraph = API;
  /* 扩展 v172 TianjiAPI，而不改旧调用语义 */
  try {
    const old = window.TianjiAPI;
    if (old && !old.__v173) {
      const extra = [
        {
          name: "evidence.graph.snapshot",
          title: "Evidence 规则图谱",
          sensitive: false,
          desc: "返回 Source/Evidence → Rule → Engine → Field → Conclusion 全图。",
        },
        {
          name: "evidence.graph.trace",
          title: "Evidence Trace",
          sensitive: false,
          desc: "按 node id 或 field path 反向追溯来源与规则。",
        },
        {
          name: "evidence.rules",
          title: "Rule Catalog",
          sensitive: false,
          desc: "返回显式登记规则目录，可按 system 过滤。",
        },
      ];
      const oldList = old.listMethods.bind(old),
        oldCall = old.call.bind(old),
        oldRpc = old.rpc.bind(old);
      const call = (name, params = {}) => {
        const t0 = performance.now();
        let data;
        if (name === "evidence.graph.snapshot") data = API.graph();
        else if (name === "evidence.graph.trace")
          data = API.trace(params.target || params.path || "conclusion:ai");
        else if (name === "evidence.rules")
          data = {
            schema: RULE_SCHEMA,
            build: V173_BUILD,
            rules: API.rules(params.system || "all"),
          };
        else return oldCall(name, params);
        return {
          schema: "tianji.api.response.v1",
          build: V173_BUILD,
          method: name,
          generatedAt: new Date().toISOString(),
          data,
          audit: { elapsedMs: +(performance.now() - t0).toFixed(3) },
        };
      };
      const rpc = (req, opt = {}) => {
        if (req?.method && extra.some((x) => x.name === req.method)) {
          try {
            return {
              jsonrpc: "2.0",
              id: req.id ?? null,
              result: call(req.method, req.params || {}),
            };
          } catch (e) {
            return {
              jsonrpc: "2.0",
              id: req.id ?? null,
              error: { code: -32603, message: e.message || String(e) },
            };
          }
        }
        return oldRpc(req, opt);
      };
      const mcpManifest = () => {
        const m = clone(old.mcpManifest());
        m.build = V173_BUILD;
        m.tools = m.tools || [];
        m.tools.push(
          {
            name: "tianji_evidence_graph",
            description: "读取 Evidence 规则知识图谱。",
            apiMethod: "evidence.graph.snapshot",
            sensitive: false,
            inputSchema: { type: "object", properties: {}, additionalProperties: false },
          },
          {
            name: "tianji_evidence_trace",
            description: "反向追溯某节点或字段的 Evidence 来源与规则链。",
            apiMethod: "evidence.graph.trace",
            sensitive: false,
            inputSchema: {
              type: "object",
              required: ["target"],
              properties: { target: { type: "string" } },
              additionalProperties: false,
            },
          },
        );
        return m;
      };
      const ext = Object.freeze({
        version: "1.1.0",
        build: V173_BUILD,
        schema: old.schema,
        __v173: true,
        listMethods: () => [...oldList(), ...clone(extra)],
        call,
        rpc,
        systemManifest: old.systemManifest,
        health: old.health,
        schemas: () => [
          ...old.schemas(),
          { id: SCHEMA, layer: "knowledge-graph", owner: "TianjiEvidenceGraph" },
          { id: TRACE_SCHEMA, layer: "provenance", owner: "TianjiEvidenceGraph" },
        ],
        mcpManifest,
        openApiSpec: old.openApiSpec,
        contract: old.contract,
        selfTest: () => ({ base: old.selfTest(), graph: API.selfTest() }),
      });
      window.TianjiAPI = ext;
    }
  } catch (e) {
    console.warn("[v173 API extension]", e);
  }
  try {
    if (window.TianjiCore) {
      TianjiCore.registerSource({
        id: "tianji-v173-evidence-knowledge-graph",
        type: "internal",
        title: "Tianji Evidence Rule Knowledge Graph 1.0",
        version: "1.0.0",
        baseline: "v172",
        note: "把已存在 Evidence、规则、Engine、输出字段、合参与解释层串成可追溯图谱；不新增或修改术数计算规则。",
      });
      TianjiCore.registerEngine(
        {
          id: "evidence.graph.v1",
          system: "system",
          name: "Tianji Evidence Knowledge Graph",
          version: "1.0.0",
          source: "tianji-v173-evidence-knowledge-graph",
          doctrine: "source/evidence → rule → engine → field → consensus → explain → ai/api",
          status: "active",
        },
        () => API.graph(),
      );
    }
  } catch (e) {
    console.warn("[v173 registry]", e);
  }
  patchVerify();
  try {
    const board = {
      schema: "tianji.priority.board.v1",
      build: V173_BUILD,
      total: 14,
      done: 3,
      doing: 1,
      progress: 25,
      next: ["自然语言问事路由", "统一消费者结果页 / 报告", "奇门四家第三方对拍 / 高级 Evidence"],
    };
    window.TianjiPriorityBoard = Object.freeze({
      schema: board.schema,
      snapshot: () => clone(board),
    });
    const road = window.TianjiRoadmap || {};
    window.TianjiRoadmap = Object.freeze(
      Object.assign({}, road, {
        urgentImportant: board,
        nextMainline: [
          "自然语言问事路由",
          "统一消费者结果页 / 报告",
          "奇门四家第三方对拍与高级 Evidence",
          "六爻/紫微解释层深化",
        ],
      }),
    );
  } catch (_) {}
  try {
    const T = selfTest(),
      bv = document.getElementById("buildVersion");

    window.TianjiSystemV173 = {
      version: "v173",
      build: V173_BUILD,
      evidenceKnowledgeGraph: true,
      schema: SCHEMA,
      selfTest: T,
    };
  } catch (_) {}
})();
