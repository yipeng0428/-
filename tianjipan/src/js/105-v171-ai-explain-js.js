(() => {
  "use strict";
  const V171_BUILD = "v171 · 2026-10-05 15:46 +08:00";
  const SCHEMA = "tianji.ai.explain.v1";
  const TASK_SCHEMA = "tianji.priority.board.v1";
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
  const STATE = { mode: "plain" };
  try {
    const x = localStorage.getItem("tianji.v171.mode");
    if (x === "plain" || x === "pro") STATE.mode = x;
  } catch (_) {}
  const PRIORITY = [
    {
      id: "ai",
      p: "P0",
      name: "统一 AI 解释层",
      state: "done",
      note: "v171：只消费 Consensus / Explain Schema；本地确定性解释 + AI-ready 数据包。",
    },
    {
      id: "mcp",
      p: "P0",
      name: "MCP / API 外部调用层",
      state: "todo",
      note: "下一主线：把 Core、Evidence、Consensus、Explain、AI Packet 暴露为稳定接口。",
    },
    {
      id: "kg",
      p: "P0",
      name: "典籍 Evidence / 规则知识图谱",
      state: "doing",
      note: "已有 Evidence Registry 与解释图；仍缺“原文→规则→算法→字段→结论”的完整图谱。",
    },
    {
      id: "router",
      p: "P0",
      name: "自然语言问事路由",
      state: "todo",
      note: "用户直接描述问题，自动分类事项并选择奇门/六壬/六爻/梅花/择日组合。",
    },
    {
      id: "consumer",
      p: "P0",
      name: "统一消费者结果页 / 报告",
      state: "todo",
      note: "固定为结论→依据→利阻→行动→时间窗→专业证据。",
    },
    {
      id: "qimen-evidence",
      p: "P1",
      name: "奇门四家第三方对拍 / 高级 Evidence",
      state: "todo",
      note: "日家/月家/年家已有古籍口径，第三方逐盘对拍仍欠。",
    },
    {
      id: "liuyao-depth",
      p: "P1",
      name: "六爻完整旺衰 / 卦格 / 应期层",
      state: "todo",
      note: "Core 已成型，完整占断规则尚未封顶。",
    },
    {
      id: "ziwei-depth",
      p: "P1",
      name: "紫微完整飞星体系",
      state: "todo",
      note: "继续补向心/离心自化、来因宫与更完整应期流派。",
    },
    {
      id: "qizheng",
      p: "P1",
      name: "七政四余核心化",
      state: "blocked",
      note: "前置是可靠星历、四余口径与许可证方案。",
    },
    {
      id: "xk",
      p: "P1",
      name: "玄空完整宅盘",
      state: "todo",
      note: "运盘、山星、向星、替卦等尚未形成统一 Core。",
    },
    {
      id: "sanhe",
      p: "P1",
      name: "三合水法 Core",
      state: "todo",
      note: "罗盘已有，水法确定性规则链尚未核心化。",
    },
    {
      id: "tz",
      p: "P2",
      name: "历史时区 / 夏令时自动校正",
      state: "todo",
      note: "真太阳时已有；历史时区数据库仍欠。",
    },
    {
      id: "relation",
      p: "P2",
      name: "关系长期时间轴",
      state: "todo",
      note: "人物库/关系图已有，关系随年份阶段变化尚未产品化。",
    },
    {
      id: "report",
      p: "P2",
      name: "合参 Evidence 正式报告",
      state: "todo",
      note: "将 v169–v171 的 Schema、解释链和边界统一成导出模板。",
    },
  ];
  function taskSnapshot() {
    const arr = clone(PRIORITY),
      done = arr.filter((x) => x.state === "done").length,
      doing = arr.filter((x) => x.state === "doing").length,
      total = arr.length;
    return {
      schema: TASK_SCHEMA,
      build: V171_BUILD,
      total,
      done,
      doing,
      progress: +(((done + doing * 0.5) / total) * 100).toFixed(1),
      tasks: arr,
      next: [
        "MCP / API 外部调用层",
        "Evidence 规则知识图谱深化",
        "自然语言问事路由",
        "统一消费者结果页 / 报告",
      ],
    };
  }
  function riskText(topic) {
    if (topic === "健康")
      return "健康问题只可作为传统文化参考；症状、诊断、治疗与用药应依据合格医疗专业意见。";
    if (topic === "官司")
      return "法律事项只可作为传统文化参考；诉讼、合同与权利义务应依据律师或正式法律意见。";
    if (topic === "求财" || topic === "置业")
      return "财务与置业事项只可作为传统文化参考；不要据此替代现金流、合同、估值、风险承受能力等现实分析。";
    return "传统术数输出用于文化研究、反思与辅助整理，不应替代现实证据或专业判断。";
  }
  function maturity(S) {
    const ev = S.systems.filter((x) => x.role === "event"),
      coverage = ev.length / 4,
      avg = ev.length ? ev.reduce((a, x) => a + (+x.evidence.level || 0), 0) / ev.length : 0,
      exact = ev.length ? ev.filter((x) => !x.topicAdapted).length / ev.length : 0,
      conf = S.synthesis.eventVote.positive > 0 && S.synthesis.eventVote.negative > 0 ? 1 : 0;
    let score = coverage * 0.35 + (avg / 5) * 0.35 + exact * 0.2 + (1 - conf) * 0.1;
    score = Math.max(0, Math.min(1, score));
    return {
      score: +(score * 100).toFixed(0),
      label: score >= 0.82 ? "较成熟" : score >= 0.62 ? "中等" : "谨慎",
      coverage: +(coverage * 100).toFixed(0),
      avgEvidence: +avg.toFixed(1),
      exact: +(exact * 100).toFixed(0),
      conflict: !!conf,
    };
  }
  function toneSentence(v) {
    if (v.index >= 55) return "事项层的可比较模块整体呈现较明确的偏顺信号。";
    if (v.index >= 18) return "事项层整体略偏顺，但仍应结合现实条件推进。";
    if (v.index <= -55) return "事项层的可比较模块整体呈现较明确的偏阻信号。";
    if (v.index <= -18) return "事项层整体略偏阻，宜先处理阻力与不确定条件。";
    if (v.positive && v.negative) return "事项层存在明显分歧，目前不适合把结果压成单一“吉/凶”。";
    return "事项层当前方向性不强，更适合把它当作条件清单而不是结论。";
  }
  function actions(S, M) {
    const v = S.synthesis.eventVote,
      out = [];
    if (v.index >= 18) {
      out.push("优先采用可逆、小步、可验证的推进方式，把“偏顺”转化为现实试验，而不是一次性重注。");
      out.push("先确认合参中重复出现的有利条件在现实里是否成立，再决定扩大投入。");
    } else if (v.index <= -18) {
      out.push("先降低不可逆投入，优先解决反复出现的阻力、信息缺口或对手方条件。");
      out.push("如果必须行动，使用分阶段、可退出的方案，并设置明确止损/复核节点。");
    } else {
      out.push("先补现实信息，不以当前合参结果替代事实调查；可以用小规模试探获得新证据。");
      out.push("把冲突模块对应的关键字段列为下一轮核查清单，再决定是否推进。");
    }
    if (M.conflict)
      out.push(
        "由于事项层存在“偏顺 vs 偏阻”冲突，优先比较各模块冲突来源，不使用简单多数票做最终裁决。",
      );
    return out;
  }
  function promptPacket(S, G, report) {
    return {
      schema: "tianji.ai.packet.v1",
      build: V171_BUILD,
      instructions: [
        "只解释提供的 Tianji Consensus / Explain Graph，不重新排盘，不自行发明缺失规则。",
        "必须区分：事项占测层、命局背景层、择时选择层；不同尺度不得混票。",
        "Evidence 等级表示验证成熟度，不得写成准确率、概率或科学证据。",
        "必须保留冲突，不能为了给出明确答案而抹平相反信号。",
        "所有重要结论应能回指 systems[].provenance / evidence / explain diagnostics。",
        "对健康、法律、财务等高风险事项必须明确提醒现实专业判断优先。",
        "语言应清楚、克制，不使用宿命化、恐吓性或绝对化表述。",
      ],
      desiredOutput: [
        "结论",
        "为什么",
        "一致证据",
        "冲突证据",
        "命局背景",
        "择时信息",
        "行动建议",
        "Evidence/边界",
        "原模块回指",
      ],
      input: {
        consensus: S,
        explainGraph: { schema: G.schema, steps: G.steps, diagnostics: G.diagnostics },
        deterministicDraft: report,
      },
    };
  }
  function build(runtime, opts = {}) {
    const G = opts.graph || window.TianjiExplainGraph?.build?.(runtime || R);
    if (!G) throw new Error("Explain Graph 尚不可用");
    const S = G.consensus,
      M = maturity(S),
      v = S.synthesis.eventVote,
      ev = S.systems.filter((x) => x.role === "event"),
      bg = S.systems.filter((x) => x.role === "background"),
      sel = S.systems.filter((x) => x.role === "selection");
    const top = ev
      .slice()
      .sort((a, b) => b.evidence.level * b.result.weight - a.evidence.level * a.result.weight);
    const report = {
      schema: SCHEMA,
      build: V171_BUILD,
      generatedAt: new Date().toISOString(),
      mode: opts.mode || STATE.mode,
      context: S.context,
      maturity: M,
      sections: {
        conclusion: toneSentence(v),
        why: [
          ...(S.synthesis.agreements || []),
          ...top.slice(0, 2).map((x) => `${x.name}：${x.result.headline}`),
        ],
        conflicts: S.synthesis.conflicts || [],
        background: bg.map((x) => `${x.name}：${x.result.headline}`),
        timing: sel.map((x) => `${x.name}：${x.result.headline}`),
        actions: actions(S, M),
        evidence: [
          `事项模块覆盖 ${ev.length}/4；平均 Evidence L${M.avgEvidence}；完全同题映射 ${M.exact}%。`,
          ...ev
            .filter((x) => (x.evidence.level || 0) < 4)
            .map((x) => `${x.name} 当前 Evidence L${x.evidence.level}，解释时应降低确定性措辞。`),
        ],
        boundary: [
          riskText(S.context.question.topic),
          "本地解释器只消费已经生成的结构化 Schema，不重新计算术数结果。",
          "当前 v171 的文本由确定性规则生成；真正大模型接入留给后续 MCP / API，避免静态 HTML 冒充在线 AI。",
        ],
      },
      provenance: {
        consensusSchema: S.schema,
        explainSchema: G.schema,
        systems: ev.map((x) => ({
          id: x.id,
          source: x.provenance.source,
          fields: x.provenance.fields,
          evidence: x.evidence,
        })),
      },
    };
    report.aiPacket = promptPacket(S, G, report);
    return clone(report);
  }
  function ul(a) {
    return `<ul class="tj171-list">${(a && a.length ? a : ["—"]).map((x) => `<li>${E(x)}</li>`).join("")}</ul>`;
  }
  function reportHTML(A) {
    const s = A.sections,
      pro = A.mode === "pro";
    return `<section class="tj171-report"><div class="tj171-section"><h4>结论</h4><p>${E(s.conclusion)}</p></div><div class="tj171-section"><h4>为什么</h4>${ul(s.why)}</div><div class="tj171-section"><h4>一致 / 冲突证据</h4>${ul(s.conflicts)}</div>${pro ? `<div class="tj171-section"><h4>命局背景（不参与事项投票）</h4>${ul(s.background)}</div><div class="tj171-section"><h4>择时信息（独立选择层）</h4>${ul(s.timing)}</div><div class="tj171-section"><h4>Evidence 与来源边界</h4>${ul(s.evidence)}</div>` : ""}<div class="tj171-section"><h4>现实行动建议</h4>${ul(s.actions)}</div><div class="tj171-section"><h4>边界</h4>${ul(s.boundary)}</div></section>`;
  }
  function panel(A) {
    const M = A.maturity,
      S = safe(() => window.TianjiConsensus.build(R), null),
      v = S?.synthesis?.eventVote || { label: "—", positive: 0, neutral: 0, negative: 0 };
    return `<div class="tj171"><section class="tj171-hero"><div class="tj171-head"><div><h3>天机 AI 解释层 1.0</h3><p>这一层不重新“算盘”，只消费 v169 Consensus 与 v170 Explain Graph，把结构化结果转换为普通人可读的解释。当前先使用确定性本地解释器作为守门层，同时生成标准 AI Packet，等后续 MCP/API 接入真实模型。</p></div><div class="tj171-badges"><span class="tj171-badge">${SCHEMA}</span><span class="tj171-badge cyan">Schema-only · 不重算</span></div></div><div class="tj171-toolbar"><button class="gbtn sm ${A.mode === "plain" ? "on" : ""}" data-tj171-mode="plain">简洁解读</button><button class="gbtn sm ${A.mode === "pro" ? "on" : ""}" data-tj171-mode="pro">专业解读</button><button class="gbtn sm" id="tj171Refresh">重新生成</button><button class="gbtn sm" id="tj171CopyReport">复制解释报告</button><button class="gbtn sm" id="tj171CopyPacket">复制 AI Packet</button></div></section><div class="tj171-kpis"><div class="tj171-kpi ${M.score >= 70 ? "good" : ""}"><small>解释成熟度</small><b>${M.label} · ${M.score}</b></div><div class="tj171-kpi"><small>事项层方向</small><b>${E(v.label)}</b></div><div class="tj171-kpi"><small>Evidence 均值</small><b>L${M.avgEvidence}</b></div><div class="tj171-kpi"><small>同题映射</small><b>${M.exact}%</b></div><div class="tj171-kpi ${M.conflict ? "bad" : "good"}"><small>方向冲突</small><b>${M.conflict ? "存在" : "未见直接冲突"}</b></div></div><div class="tj171-grid">${reportHTML(A)}<aside class="tj171-side"><h4>AI 输入守门</h4><dl class="tj171-meta"><dt>输入 1</dt><dd>tianji.consensus.v1</dd><dt>输入 2</dt><dd>tianji.explain.graph.v1</dd><dt>输出</dt><dd>${SCHEMA}</dd><dt>重算排盘</dt><dd>禁止</dd><dt>冲突处理</dt><dd>保留，不强制裁决</dd><dt>Evidence</dt><dd>成熟度，不是准确率</dd></dl><div class="tj171-modelbox"><b>为什么先做本地解释器：</b><br>真正 AI 接入前，先固定输出结构、证据边界和禁止事项。以后无论换哪家模型，都只能在这个边界内解释，避免模型越权重算、编规则或把 Evidence 说成概率。</div><div class="tj171-warning ${["健康", "官司", "求财", "置业"].includes(A.context.question.topic) ? "high" : ""}" style="margin-top:10px"><b>现实优先：</b>${E(riskText(A.context.question.topic))}</div></aside></div></div>`;
  }
  function mount() {
    const anchor = document.querySelector(".tj170") || document.querySelector(".tj169");
    if (!anchor || document.querySelector(".tj171")) return;
    let A;
    try {
      A = build(typeof R !== "undefined" ? R : null);
    } catch (e) {
      anchor.insertAdjacentHTML(
        "afterend",
        `<div class="tj171"><div class="tj171-warning"><b>AI 解释层暂不可用：</b>${E(e.message || e)}</div></div>`,
      );
      return;
    }
    anchor.insertAdjacentHTML("afterend", panel(A));
    bind(A);
  }
  function bind(A) {
    document.querySelectorAll("[data-tj171-mode]").forEach(
      (b) =>
        (b.onclick = () => {
          STATE.mode = b.dataset.tj171Mode;
          try {
            localStorage.setItem("tianji.v171.mode", STATE.mode);
          } catch (_) {}
          rerender();
        }),
    );
    const rr = document.getElementById("tj171Refresh");
    if (rr) rr.onclick = rerender;
    const cr = document.getElementById("tj171CopyReport");
    if (cr)
      cr.onclick = () =>
        copyText(
          JSON.stringify(build(R, { mode: STATE.mode }), null, 2),
          "已复制 AI 解释报告 JSON",
        );
    const cp = document.getElementById("tj171CopyPacket");
    if (cp)
      cp.onclick = () =>
        copyText(
          JSON.stringify(build(R, { mode: STATE.mode }).aiPacket, null, 2),
          "已复制 AI Packet",
        );
  }
  function copyText(t, msg) {
    try {
      if (navigator.clipboard?.writeText) navigator.clipboard.writeText(t).then(() => toast(msg));
      else toast("当前浏览器不支持直接复制");
    } catch (_) {}
  }
  function rerender() {
    const old = document.querySelector(".tj171");
    if (old) old.remove();
    mount();
  }
  function taskHTML() {
    const S = taskSnapshot(),
      grp = (p) => S.tasks.filter((x) => x.p === p),
      label = { done: "完成", doing: "进行中", todo: "待办", blocked: "前置阻塞" };
    return `<div class="tj171-taskboard"><section class="tj171-taskhero"><div class="tj171-taskhead"><div><h3>近期紧急重要任务清单</h3><p>从 v171 起固定作为主工程检查表。每次大版本推进前后都应回看，避免再次被单一圆盘或视觉细节带离主线。</p></div><div class="tj171-progress"><div class="tj171-progressbar"><i style="width:${S.progress}%"></i></div><small>主清单进度 ${S.progress}% · 完成 ${S.done}/${S.total} · 进行中 ${S.doing}</small></div></div></section><div class="tj171-taskgrid">${[
      "P0",
      "P1",
      "P2",
    ]
      .map(
        (p) =>
          `<section class="tj171-taskcol"><h4>${p} · ${p === "P0" ? "紧急重要" : p === "P1" ? "重要主线" : "后续完善"}</h4>${grp(
            p,
          )
            .map(
              (x) =>
                `<div class="tj171-task ${x.state}"><span class="st">${label[x.state]}</span><div><b>${E(x.name)}</b><small>${E(x.note)}</small></div></div>`,
            )
            .join("")}</section>`,
      )
      .join("")}</div></div>`;
  }
  function patchVerify() {
    try {
      if (!window.REF_PANES || typeof REF_PANES.verify !== "function" || REF_PANES.verify.__v171)
        return;
      const old = REF_PANES.verify;
      const fn = () => taskHTML() + old();
      fn.__v171 = true;
      REF_PANES.verify = fn;
    } catch (e) {
      console.warn("[v171 task board]", e);
    }
  }
  function selfTest() {
    const c = [];
    const add = (n, ok, d = "") => c.push({ n, ok: !!ok, d });
    try {
      const T = taskSnapshot();
      add("任务看板 Schema", T.schema === TASK_SCHEMA, T.schema);
      add(
        "P0 主线存在",
        T.tasks.filter((x) => x.p === "P0").length >= 5,
        String(T.tasks.filter((x) => x.p === "P0").length),
      );
      if (typeof R !== "undefined" && R) {
        const A = build(R, { mode: "pro" });
        add("解释 Schema", A.schema === SCHEMA, A.schema);
        add(
          "只消费上游 Schema",
          A.provenance.consensusSchema === "tianji.consensus.v1" &&
            A.provenance.explainSchema === "tianji.explain.graph.v1",
          A.provenance.consensusSchema + " / " + A.provenance.explainSchema,
        );
        add("报告分区", Object.keys(A.sections).length >= 8, Object.keys(A.sections).join(","));
        add("AI Packet", A.aiPacket?.schema === "tianji.ai.packet.v1", A.aiPacket?.schema || "—");
        add("边界存在", A.sections.boundary.length >= 3, String(A.sections.boundary.length));
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
        console.warn("[v171 mount]", e);
      }
    };
  } catch (_) {}
  patchVerify();
  setTimeout(() => {
    try {
      if (document.querySelector(".tj170") || document.querySelector(".tj169")) mount();
    } catch (_) {}
  }, 0);
  const API = Object.freeze({
    version: "1.0.0",
    build: V171_BUILD,
    schema: SCHEMA,
    build: (runtime, opts) => build(runtime || R, opts || {}),
    taskSnapshot,
    selfTest,
    manifest: () => ({
      module: "Tianji AI Explanation Layer",
      version: "1.0.0",
      build: V171_BUILD,
      schema: SCHEMA,
      input: ["tianji.consensus.v1", "tianji.explain.graph.v1"],
      output: ["deterministic explanation", "tianji.ai.packet.v1"],
      guardrails: ["不重算", "不抹平冲突", "Evidence 非准确率", "高风险事项现实专业判断优先"],
    }),
  });
  window.TianjiAIExplain = API;
  window.TianjiPriorityBoard = Object.freeze({ schema: TASK_SCHEMA, snapshot: taskSnapshot });
  try {
    if (window.TianjiCore) {
      TianjiCore.registerSource({
        id: "tianji-v171-ai-explain",
        type: "internal",
        title: "Tianji AI Explanation Guard Layer 1.0",
        version: "1.0.0",
        baseline: "v170",
      });
      TianjiCore.registerEngine(
        {
          id: "ai.explain.guard.v1",
          system: "aggregate",
          name: "Tianji AI Explain Guard 1.0",
          version: "1.0.0",
          source: "tianji-v171-ai-explain",
          doctrine: "Consensus/Explain Schema only · deterministic guard · AI-ready packet",
          status: "active",
        },
        (input) => API.build(input?.runtime || R, input || {}),
      );
    }
  } catch (e) {
    console.warn("[v171 registry]", e);
  }
  try {
    const road = window.TianjiRoadmap || {};
    window.TianjiRoadmap = Object.freeze(
      Object.assign({}, road, {
        urgentImportant: taskSnapshot(),
        nextMainline: [
          "MCP / API 外部调用层",
          "Evidence 规则知识图谱深化",
          "自然语言问事路由",
          "统一消费者结果页 / 报告",
          "奇门四家第三方对拍与高级 Evidence",
        ],
      }),
    );
  } catch (_) {}
  try {
    const T = selfTest(),
      bv = document.getElementById("buildVersion");

    window.TianjiSystemV171 = {
      version: "v171",
      build: V171_BUILD,
      aiExplainSchema: SCHEMA,
      priorityBoard: TASK_SCHEMA,
      selfTest: T,
    };
  } catch (_) {}
})();
