(() => {
  "use strict";
  const SCHEMA = "tianji.consumer.report.v1",
    MISSING = "当前未取到该层结果";
  const TOPICS = [
    "求财",
    "事业",
    "感情",
    "健康",
    "出行",
    "学业",
    "官司",
    "合作",
    "置业",
    "寻人",
    "寻物",
  ];
  const PANES = [
    "over",
    "router",
    "qimen",
    "liuren",
    "liuyao",
    "yi",
    "bazi",
    "ziwei",
    "zeri",
    "house",
    "xk",
    "jifang",
    "hepan",
    "qizheng",
    "natal",
    "vedic",
    "jinkou",
    "taiyi",
    "cezi",
    "fun",
  ];
  const NAMES = {
    qimen: "奇门遁甲（时家）",
    liuren: "大六壬",
    liuyao: "六爻纳甲",
    meihua: "梅花易数",
    bazi: "四柱八字",
    ziwei: "紫微斗数",
    zeri: "择日",
  };
  const safe = (fn, fb = null) => {
      try {
        return fn();
      } catch (_) {
        return fb;
      }
    },
    clone = (x) => JSON.parse(JSON.stringify(x));
  const E = (s) =>
    String(s ?? "").replace(
      /[&<>"']/g,
      (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
    );
  const arr = (x) => (Array.isArray(x) ? x : []),
    txt = (x) => (typeof x === "string" ? x : ""),
    get = (o, p) => p.split(".").reduce((a, k) => a?.[k], o);
  let context = safe(() => JSON.parse(localStorage.getItem("tianji.v169.consensus") || "null")) || {
    topic: "事业",
    question: "",
    intent: "event",
  };
  let generation = 0,
    lastReport = null,
    timer = null,
    loading = null,
    dirty = false,
    reportArmed = false;
  const armReport = () => {
    if (reportArmed) return;
    reportArmed = true;
    schedule();
  };
  window.addEventListener("pointerdown", armReport, { once: true, passive: true });
  window.addEventListener("keydown", armReport, { once: true });
  const mounted = new WeakMap();
  const glossary = {
    伏吟: "同一结构重复，旧规则把它解释为推进较慢",
    反吟: "结构对冲，旧规则把它解释为容易反复",
    返吟: "结构对冲，旧规则把它解释为容易反复",
    空亡: "传统规则中的待落实标记，不表示现实中不存在",
    用神: "此问题选取的重点参照",
    世爻: "卦中代表问事者的位置",
    应爻: "卦中代表对方或事情的位置",
    体卦: "代表自身的卦",
    用卦: "代表事情的卦",
    生体: "事情对自身有支持信号",
    克体: "事情对自身有压力信号",
    月破: "与月建相冲的传统标记",
    回头生: "变出之爻支持原爻",
    回头克: "变出之爻制约原爻",
  };
  function plain(s) {
    return String(s || "").replace(
      /伏吟|反吟|返吟|空亡|用神|世爻|应爻|体卦|用卦|生体|克体|月破|回头生|回头克/g,
      (w) => `${w}（${glossary[w]}）`,
    );
  }
  function active() {
    return document.querySelector(".pane.on")?.id?.replace("pane-", "") || "over";
  }
  function runtime() {
    return typeof R !== "undefined" ? R : null;
  }
  function normalize(ctx) {
    return {
      topic: txt(ctx?.topic) || "事业",
      question: txt(ctx?.question).trim().slice(0, 300),
      intent: ctx?.intent || "event",
    };
  }
  function setQuestion(ctx) {
    context = normalize(ctx);
    dirty = false;
    generation++;
    lastReport = null;
    safe(() => localStorage.setItem("tianji.v169.consensus", JSON.stringify(context)));
    window.TianjiConsensus?.setContext?.(context);
    window.TianjiQimenQuestion?.set?.(context);
    const mapping = window.TianjiConsensus?.topics?.()?.[context.topic];
    if (mapping) {
      if (mapping.qimen && typeof qmTopic !== "undefined") qmTopic = mapping.qimen;
      if (mapping.liuren && typeof lrTopic !== "undefined") lrTopic = mapping.liuren;
      if (mapping.liuyao && typeof lyTopic !== "undefined") lyTopic = mapping.liuyao;
      if (mapping.meihua && typeof mhTopic !== "undefined") mhTopic = mapping.meihua;
    }
    schedule();
    return clone(context);
  }
  function factsFor(id, r, S) {
    const rows = [],
      add = (label, path, value) => {
        if (
          value !== undefined &&
          value !== null &&
          value !== "" &&
          !(Array.isArray(value) && !value.length)
        )
          rows.push({
            label,
            path,
            value: typeof value === "object" ? JSON.stringify(value) : String(value),
          });
      };
    const field = (label, path) => add(label, "R." + path, get(r, path));
    if (id === "qimen") {
      field("局数", "qm.ju");
      if (typeof r?.qm?.yang === "boolean") add("阴阳遁", "R.qm.yang", r.qm.yang ? "阳遁" : "阴遁");
      field("时柱", "qm.hourGZ");
      field("节气", "qm.term");
      field("值符星", "qm.zfStar");
      field("值使门", "qm.zsDoor");
      for (const k of ["fuyin", "fanyin", "wubuyu"])
        if (typeof r?.qm?.[k] === "boolean")
          add(
            { fuyin: "伏吟标记", fanyin: "反吟标记", wubuyu: "五不遇时标记" }[k],
            "R.qm." + k,
            r.qm[k] ? "是" : "否",
          );
      for (const [p, c] of Object.entries(r?.qm?.cells || {}))
        if (c && ["1", "2", "3", "4", "6", "7", "8", "9"].includes(p))
          for (const k of ["door", "star", "god", "hs", "earth"])
            add(
              `${p}宫 · ${{ door: "门", star: "星", god: "神", hs: "天盘干", earth: "地盘干" }[k]}`,
              "R.qm.cells." + p + "." + k,
              c[k],
            );
    } else if (id === "liuren") {
      field("课体", "lr.ge");
      field("取传规则记录", "lr.sub");
      arr(r?.lr?.chu).forEach((x, i) => {
        add(
          ["初传", "中传", "末传"][i] || "传",
          "R.lr.chu." + i + ".z",
          Number.isInteger(x.z) && typeof ZHI !== "undefined" ? ZHI[x.z] : x.z,
        );
        add("天将", "R.lr.chu." + i + ".gen", x.gen);
      });
    } else if (id === "liuyao") {
      const f = S?.systems?.find((x) => x.id === id)?.result?.facts;
      for (const [k, n] of Object.entries({
        name: "本卦",
        changedName: "变卦",
        shi: "世爻位置",
        ying: "应爻位置",
        moving: "动爻（原接口零起算）",
      }))
        add(n, "Consensus.systems[liuyao].result.facts." + k, f?.[k]);
    } else if (id === "meihua") {
      field("本卦", "mh.ben.name");
      field("互卦", "mh.hu.name");
      field("变卦", "mh.bian.name");
      for (const k of ["ti", "yong"]) {
        const v = r?.mh?.[k];
        add(
          k === "ti" ? "体卦" : "用卦",
          "R.mh." + k,
          Number.isInteger(v) && typeof TRI !== "undefined" ? TRI[v]?.n : undefined,
        );
      }
    } else if (id === "bazi") {
      arr(r?.bz?.pill).forEach((p, i) =>
        add(
          ["年柱", "月柱", "日柱", "时柱"][i],
          "R.bz.pill." + i,
          typeof GAN !== "undefined" && typeof ZHI !== "undefined" && GAN[p.s] && ZHI[p.b]
            ? GAN[p.s] + ZHI[p.b]
            : undefined,
        ),
      );
    } else if (id === "ziwei") {
      for (const k of ["ming", "shen"]) {
        const v = r?.zw?.[k];
        add(
          k === "ming" ? "命宫地支" : "身宫地支",
          "R.zw." + k,
          Number.isInteger(v) && typeof ZHI !== "undefined" ? ZHI[v] : undefined,
        );
      }
      field("五行局", "zw.juName");
      field("生年四化记录", "zw.sihua");
    }
    return rows;
  }
  const ACTIONS = {
    合作: [
      "先核对对方的交付能力、付款条件和责任分工。",
      "先做一笔可退出的小单，再根据真实履约结果决定是否扩大合作。",
    ],
    求财: [
      "列出实际收入、成本、回款日期与能承受的损失。",
      "把判断交给真实成交与回款，不依据盘面提高投资或借贷额度。",
    ],
    事业: [
      "核实岗位、薪资、合同与备选方案，再决定投入。",
      "先用一次沟通、面试或小项目验证条件，保留调整空间。",
    ],
    感情: [
      "把猜测与对方已经表达的事实分开。",
      "通过尊重意愿的沟通确认需求和边界，不用盘面判断对方隐秘想法。",
    ],
    健康: [
      "记录症状、持续时间和已有检查结果，与合格医疗人员沟通。",
      "盘面不能判断病情、疗效或用药，也不能替代及时就医。",
    ],
    出行: [
      "核实目的地、交通、天气和可取消安排。",
      "以实际路况和安全信息决定路线，盘面方向不等于导航位置。",
    ],
    学业: ["用最近的模拟成绩与错题找出薄弱项。", "安排复习和休息，并用下一次测验检验进展。"],
    官司: [
      "整理合同、沟通记录与争议时间线。",
      "向专业法律人员核实证据与期限，不等待所谓吉日再处理时限。",
    ],
    置业: [
      "核对预算、产权、合同、房屋状况与居住需求。",
      "现场调查和专业核验完成后，再决定是否支付不可退费用。",
    ],
    寻人: [
      "优先整理最后可靠联系的时间、地点与已知行程，联系相关亲友或现场管理方。",
      "有走失、失踪或安全风险时及时联系警方；不因盘面方位或等待应期而延误寻找。",
    ],
    寻物: [
      "按最后一次确定见到物品的时间，逐段回溯实际路线。",
      "联系现场人员与失物招领；涉及银行卡、证件或设备时及时采取挂失或账号保护措施。",
    ],
  };
  function boundary(topic) {
    return [
      "“确定性盘面”只表示在当前输入和规则下可复现的计算结果，不表示现实事件已被证实。",
      "评分、吉凶、取用、应期和本报告的大白话都属于解释层；Evidence 是程序与规则验证成熟度，不是预测准确率。",
      ["寻人", "寻物"].includes(topic)
        ? "当前专门寻人/寻物断法未接入，不能据此断定具体位置、距离、人员安全或找回日期。"
        : topic === "健康"
          ? "不能用盘面诊断疾病、判断生死或改变治疗。"
          : topic === "官司"
            ? "不能用盘面预测司法结果或替代法律意见。"
            : ["求财", "置业"].includes(topic)
              ? "不能将盘面当成收益承诺、买卖依据或投资概率。"
              : "传统术数解释仅用于文化研究与反思，行动需要现实证据。",
      "沿用当前排盘和六爻起卦方式；本报告不自动摇卦，不把不同尺度的命局、事项、择日混为同一个答案。",
      "文本由本地规则生成，未调用在线大模型。",
    ];
  }
  function ruleItems(s) {
    return arr(s?.result?.reading?.sections)
      .flatMap((section, si) =>
        arr(section.items).map((item, ii) => ({
          title: txt(item.k),
          text: txt(item.t),
          basis: txt(item.basis),
          tone: item.tone || "mid",
          section: txt(section.title),
          path: `Consensus.systems[${s.id}].result.reading.sections[${si}].items[${ii}]`,
        })),
      )
      .filter((x) => x.text);
  }
  function answerFor(topic, events, intent) {
    if (["寻人", "寻物"].includes(topic))
      return `${MISSING}：现有接口没有${topic}专门断法，因此不能判断${topic === "寻人" ? "人在何处、是否安全或何时找到" : "物品在哪里、能否找回或何时找到"}。请先按现实线索${topic === "寻人" ? "寻找并及时求助" : "排查"}。`;
    if (intent !== "event")
      return "这个问题需要对应的命局、关系、空间或择时结果；下面按层列出已取得的信息，事项的偏顺偏阻不能直接回答这个问题。";
    if (!events.length) return MISSING + "：没有可用于当前问题的事项解读，暂不能回答能否推进。";
    const pos = events.filter((x) => x.result?.polarity > 0),
      neg = events.filter((x) => x.result?.polarity < 0);
    if (pos.length && neg.length)
      return `目前不能给你一个可靠的“可以”或“不可以”：${pos.map((x) => x.name).join("、")}偏顺，${neg.map((x) => x.name).join("、")}偏阻。先核对分歧所对应的现实条件，再决定。`;
    if (pos.length)
      return `按当前传统规则，${topic}这件事有推进信号，可以先做可撤回的小步验证；这不等于事情一定成功。`;
    if (neg.length)
      return `按当前传统规则，${topic}这件事存在阻力，宜先补信息、处理障碍，再决定是否增加投入；这不等于一定失败。`;
    return `目前对${topic}没有明确的方向信号；先核查实际条件，比强行判断成败更有用。`;
  }
  function assemble(r, ctx, scope, S, G, A, errors) {
    const id = scope === "yi" ? "meihua" : scope;
    const all = arr(S?.systems),
      global = scope === "over" || scope === "router";
    const records = global ? all : all.filter((x) => x.id === id);
    const eligible = ctx.intent === "event" || !ctx.intent;
    const ev = eligible ? records.filter((x) => x.role === "event") : [];
    const systemIds = global ? Object.keys(NAMES) : [id];
    const systems = systemIds.map((id) => {
      const s = all.find((x) => x.id === id);
      return {
        id,
        name: NAMES[id] || scope,
        role: s?.role || "unavailable",
        topic: s?.topic || "",
        adapted: s?.role === "event" && !!s?.topicAdapted,
        headline: txt(s?.result?.headline),
        tone: s?.result?.tone || null,
        score: s?.result?.rawScore ?? null,
        facts:
          scope === "qimen" && window.TianjiQimenPeriod?.getMode?.() !== "hour"
            ? []
            : factsFor(id, r, S),
        items: ruleItems(s),
        evidence: s?.evidence || null,
        provenance: s?.provenance || null,
      };
    });
    const positive = ev.filter((x) => x.result?.polarity > 0),
      negative = ev.filter((x) => x.result?.polarity < 0);
    const key = ev.map((s) => ({
      text: `${s.name}：${plain(s.result.headline)}`,
      source: `Consensus.systems[${s.id}].result.headline`,
    }));
    const timing = systems
      .filter((s) => s.role === "event")
      .flatMap((s) =>
        s.items
          .filter((x) => /应期|时机与节奏/.test(x.title))
          .map((x) => ({ text: `${s.name}：${plain(x.text)}`, source: x.path, basis: x.basis })),
      );
    const dates = records
      .filter((x) => x.role === "selection")
      .map((s) => ({
        text: s.result.headline,
        source: `Consensus.systems[${s.id}].result.headline`,
      }));
    const adapted = records
      .filter((x) => x.role === "event" && x.topicAdapted)
      .map((x) => `${x.name}实际使用「${x.topic}」解释「${ctx.topic}」，不是完整同题断法。`);
    const localSignals = (tone) =>
      ev.flatMap((s) =>
        ruleItems(s)
          .filter(
            (x) =>
              x.tone === tone &&
              !/较顺之方|宜避之方|应期|时机/.test(x.title) &&
              !/没有|未见|无明显/.test(x.text),
          )
          .slice(0, 1)
          .map((x) => ({
            text: `${s.name} · ${x.title}【局部规则评价】：${plain(x.text)}`,
            source: x.path,
          })),
      );
    const missing = systems
      .filter((x) => !x.headline)
      .map(
        (x) =>
          `${x.name}：${MISSING}${["寻人", "寻物"].includes(ctx.topic) ? "（该问题的专门解释未接入）" : ""}`,
      );
    const comparison =
      positive.length && negative.length
        ? "存在相反判断；本报告保留分歧，不按多数票裁定现实结果。"
        : ev.length
          ? "当前已有事项解读没有同时出现正负两种方向；这不代表不同体系结论完全一致。"
          : MISSING + "：本页没有匹配的事项解读。";
    return {
      schema: SCHEMA,
      version: "v198",
      generatedAt: new Date().toISOString(),
      scope,
      context: { ...ctx, time: S?.context?.time || r?.t?.civ || null },
      answer: ["bazi", "ziwei"].includes(id)
        ? records.length
          ? `本页是命局背景：${plain(records[0].result.headline)} 它不能单独回答这件事会不会成功。`
          : MISSING + "（本页命局背景）"
        : id === "zeri"
          ? dates.length
            ? `当前日期的择日规则评价为：${dates[0].text} 这不是事情发生的日期，也不保证事情成功。`
            : MISSING + "（本页择日评价）"
          : answerFor(ctx.topic, ev, eligible ? "event" : ctx.intent),
      judgment: comparison,
      favorable: [
        ...positive.map((s) => ({
          text: `${s.name}：${plain(s.result.headline)}`,
          source: `Consensus.systems[${s.id}].result`,
        })),
        ...localSignals("good"),
      ],
      obstacles: [
        ...negative.map((s) => ({
          text: `${s.name}：${plain(s.result.headline)}`,
          source: `Consensus.systems[${s.id}].result`,
        })),
        ...localSignals("bad"),
      ],
      key,
      actions: ACTIONS[ctx.topic] || ["先补充实际条件，再作决定。"],
      timing,
      dates,
      systems,
      adapted,
      missing,
      errors,
      boundary: boundary(ctx.topic),
      upstream: {
        consensus: S?.schema || null,
        graph: G?.schema || null,
        ai: A?.schema || null,
        evidence: window.TianjiEvidence?.schema || null,
      },
      graphDiagnostics: arr(G?.diagnostics),
      aiDraft: A?.sections || null,
      limits: {
        exactTimeWindow:
          MISSING + "：现有接口未提供经核验的起止日期；传统应期提示不等于具体日历窗口。",
        scope: global
          ? "跨术数，按事项/命局/择时分层"
          : "本页只以对应模块作答；其它术数请到总览查看。",
        question: ctx.question
          ? "问题原文用于上下文；现有规则主要按事项分类，不具备逐句理解所有限定条件的能力。"
          : "尚未填写具体问题，目前只按所选事项解释。",
      },
      layers: {
        facts: "直接读取既有排盘字段",
        rules: "原模块规则解释，包含评分与传统象法",
        plain: "v198 本地转述",
        actions: "现实行动建议，不由盘面证明",
      },
    };
  }
  function build(r = runtime(), opts = {}) {
    const ctx = normalize(opts.context || context),
      scope = opts.scope || active(),
      errors = [];
    let S = null,
      G = null,
      A = null;
    if (r && window.TianjiConsensus) {
      try {
        S = window.TianjiConsensus.build(r, ctx);
      } catch (e) {
        errors.push("Consensus：" + String(e.message || e));
      }
      if (
        scope === "qimen" &&
        window.TianjiQimenPeriod &&
        window.TianjiQimenPeriod.getMode() !== "hour"
      ) {
        S = null;
        errors.push(
          "当前为" +
            ({ day: "日家", month: "月家", year: "年家" }[window.TianjiQimenPeriod.getMode()] ||
              "其它尺度") +
            "奇门；统一解释接口只适配时家，" +
            MISSING +
            "。请查看本页原盘，不借用时家结论。",
        );
      }
      if (S && window.TianjiExplainGraph)
        try {
          G = window.TianjiExplainGraph.build(r, { consensus: S });
        } catch (e) {
          errors.push("Explain Graph：" + String(e.message || e));
        }
      if (G && window.TianjiAIExplain)
        try {
          A = window.TianjiAIExplain.build(r, { mode: "pro", graph: G });
        } catch (e) {
          errors.push("AI Explain：" + String(e.message || e));
        }
    }
    for (const [name, value] of [
      ["Consensus", S],
      ["Explain Graph", G],
      ["AI Explain", A],
    ])
      if (!value && !errors.some((x) => x.startsWith(name + "：")))
        errors.push(name + "：" + MISSING);
    return assemble(r, ctx, scope, S, G, A, errors);
  }
  function list(items, empty = MISSING) {
    return items.length
      ? `<ul>${items.map((x) => `<li>${E(typeof x === "string" ? x : x.text)}${x?.source ? `<div class="source">来源：${E(x.source)}${x.basis ? " · 规则：" + E(x.basis) : ""}</div>` : ""}</li>`).join("")}</ul>`
      : `<p class="missing">${E(empty)}</p>`;
  }
  function systemHTML(s) {
    const raw = s.facts.length
      ? `<dl>${s.facts.map((x) => `<dt>${E(x.label)}</dt><dd>${E(x.value)}<div class="source">${E(x.path)}</div></dd>`).join("")}</dl>`
      : `<p class="missing">${MISSING}</p>`;
    return `<details data-system="${E(s.id)}"><summary>${E(s.name)} · ${s.headline ? "已取得解释" : MISSING}</summary><p>${E({ event: "事项解释", background: "命局背景，不参与事件成败投票", selection: "当前日期选择层，不表示事件应期", unavailable: "当前模块尚无统一适配" }[s.role])}${s.topic ? " · 实际取用：" + E(s.topic) : ""}</p>
 <div class="interpretation"><span class="badge">原规则解释 → 大白话转述</span><p>${s.headline ? E(plain(s.headline)) : MISSING}</p>${s.adapted ? '<p class="warn">采用了替代事项映射，不能当成完全同题解释。</p>' : ""}</div>
 <details><summary>确定性盘面 · 查看实际字段</summary><p class="muted">仅指计算可复现；以下不包含本报告推测的字段。</p><div class="facts">${raw}</div></details>
 <details><summary>深度解析 · 逐条规则与依据（${s.items.length} 条）</summary>${s.items.length ? s.items.map((x) => `<article class="section"><h4>${E(x.section)} · ${E(x.title)}</h4><p>${E(plain(x.text))}</p><div class="source">${E(x.path)} · ${E(x.basis || "原模块未提供单条规则出处")}</div><details><summary>原规则文字</summary><div class="rule">${E(x.text)}</div></details></article>`).join("") : `<p class="missing">${MISSING}。请在原排盘模块查看现有内容。</p>`}</details>
 <p class="source">${s.evidence ? `Evidence L${E(s.evidence.level)} · ${E(s.evidence.label)}；${E(s.evidence.verify)}` : MISSING + "（Evidence）"}</p><p class="source">来源：${E(s.provenance?.source || MISSING)}；${E(s.provenance?.note || "")}</p>
 <button type="button" class="gbtn sm" data-tj198-open="${E(s.id === "meihua" ? "yi" : s.id)}">查看原排盘</button></details>`;
  }
  function reportHTML(a) {
    return `<header><small>V198 · 统一消费者结果</small><h2>深度解析 + 大白话结果</h2><p>你问：<b>${E(a.context.question || "尚未填写具体问题")}</b></p><span class="badge">${E(a.context.topic)}</span><span class="badge">${E(a.context.intent)}</span><span class="badge">本地解释 · 非在线 AI</span><p class="source">排盘时刻：${E(a.context.time?.civil || JSON.stringify(a.context.time) || MISSING)} · 报告生成：${E(new Date(a.generatedAt).toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" }))}</p><h3>一句话答案 <span class="badge">解释层</span></h3><p class="answer">${E(a.answer)}</p><p class="muted">${E(a.limits.scope)} ${E(a.limits.question)}</p><div class="toolbar"><button class="gbtn sm" type="button" data-tj198-refresh>按当前问题更新</button><button class="gbtn sm" type="button" data-tj198-copy>复制完整报告</button><button class="gbtn sm" type="button" data-tj198-json>下载报告 JSON</button><button class="gbtn sm" type="button" data-tj198-open="over">各术数合参总览</button></div><div class="status" role="status"></div></header>
 <div class="grid"><section class="section wide"><h3>总体判断 <span class="badge">解释层</span></h3><p>${E(a.judgment)}</p>${list(a.adapted, a.systems.some((x) => x.headline) ? "事项映射说明见各术数详情。" : MISSING)}${a.errors.length ? list(a.errors) : ""}</section>
 <section class="section"><h3>利好因素 <span class="badge">原规则信号</span></h3>${list(a.favorable, a.systems.some((x) => x.role === "event") ? "现有规则未给出偏顺判断；不能据此断言没有现实机会。" : MISSING)}</section>
 <section class="section"><h3>阻力与分歧 <span class="badge">原规则信号</span></h3>${list(a.obstacles, a.systems.some((x) => x.role === "event") ? "现有规则未给出偏阻判断；不能据此断言没有风险。" : MISSING)}${a.adapted.length ? list(a.adapted) : ""}</section>
 <section class="section wide"><h3>关键依据 <span class="badge">解释来源可回指</span></h3>${list(a.key)}<p class="muted">原始字段与每条规则的来源，展开下方各术数即可核对。传统解释和评分不是确定性事实。</p></section>
 <section class="section"><h3>行动建议 <span class="badge">现实建议</span></h3>${list(a.actions)}<p class="muted">这些建议按问题类别整理，不冒充排盘已证明的结论。</p></section>
 <section class="section"><h3>时间窗口 <span class="badge">不推造日期</span></h3><p class="missing">${E(a.limits.exactTimeWindow)}</p>${list(a.dates, "当前未取到该层结果（当前日期择日评价）")}<details><summary>原规则的节奏 / 应期提示</summary>${list(a.timing)}<p class="muted">原规则提示可能存在流派差异，不据此生成日期、期限或定位线索。</p></details></section>
 <section class="section wide"><h3>各术数如何看 · 深度解析</h3><p class="muted">绿色边线为计算字段，金色边线为解释。命局背景和择日单列。</p>${a.systems.map(systemHTML).join("")}</section>
 <section class="section wide"><h3>解释链与 Evidence</h3><p>${Object.entries(a.upstream)
   .map(([k, v]) => `<span class="badge">${E(k)}：${E(v || MISSING)}</span>`)
   .join(
     "",
   )}</p><details><summary>Explain Graph 诊断</summary>${list(a.graphDiagnostics.map((x) => [x.title, x.text].filter(Boolean).join("：")))}</details><details><summary>现有 AI Explain 原始草稿（解释层）</summary>${
   a.aiDraft
     ? Object.entries(a.aiDraft)
         .map(
           ([k, v]) =>
             `<h4>${E({ conclusion: "原结论", why: "理由", conflicts: "分歧", background: "命局背景", timing: "择时", actions: "建议", evidence: "证据成熟度", boundary: "边界" }[k] || k)}</h4>${list(Array.isArray(v) ? v : [v])}`,
         )
         .join("")
     : `<p class="missing">${MISSING}</p>`
 }<p class="muted">原草稿为跨术数规则汇总；不同题、缺失或相反信号以本报告的明确分层说明为准。</p></details><button type="button" class="gbtn sm" data-tj198-open="verify">查看校验与任务看板</button></section>
 <section class="section wide"><h3>风险边界</h3>${list(a.boundary)}${a.missing.length ? `<details><summary>本次缺失清单</summary>${list(a.missing)}</details>` : ""}</section></div>`;
  }
  function textReport(a) {
    return [
      "天机盘 V198 · 深度解析与大白话结果",
      `问题：${a.context.question || "未填写"} / ${a.context.topic}`,
      `排盘时刻：${a.context.time?.civil || JSON.stringify(a.context.time)}`,
      `报告生成：${a.generatedAt}`,
      `一句话答案【解释层】\n${a.answer}`,
      `总体判断【解释层】\n${a.judgment}`,
      ...[
        ["利好", a.favorable],
        ["阻力", a.obstacles],
        ["关键依据", a.key],
        ["行动建议【现实建议】", a.actions],
        ["时间窗口", [a.limits.exactTimeWindow, ...a.dates, ...a.timing]],
      ].map(
        ([k, v]) =>
          k +
          "\n" +
          (v.length
            ? v
                .map((x) =>
                  typeof x === "string" ? x : x.text + (x.source ? " [来源 " + x.source + "]" : ""),
                )
                .join("\n")
            : MISSING),
      ),
      ...a.systems.map(
        (s) =>
          `${s.name}\n确定性盘面：\n${s.facts.map((f) => `${f.label}：${f.value} [${f.path}]`).join("\n") || MISSING}\n原规则解释：${s.headline || MISSING}\n${s.items.map((i) => i.title + "：" + plain(i.text) + " [来源 " + i.path + "；依据 " + i.basis + "]").join("\n")}\nEvidence：${s.evidence ? JSON.stringify(s.evidence) : MISSING}`,
      ),
      "映射与缺失\n" + [...a.adapted, ...a.missing, ...a.errors].join("\n"),
      "风险边界\n" + a.boundary.join("\n"),
    ].join("\n\n");
  }
  function ensure() {
    if (window.TianjiAIExplain) return Promise.resolve();
    if (!loading)
      loading = Promise.resolve(window.TianjiPerformance?.load?.("insight", true))
        .catch((e) => {
          console.warn("[v198 load]", e);
        })
        .finally(() => {
          loading = null;
        });
    return loading;
  }
  function schedule() {
    if (!reportArmed) return;
    clearTimeout(timer);
    timer = setTimeout(mount, 120);
  }
  async function mount() {
    const scope = active();
    if (!PANES.includes(scope)) return;
    const pane = document.getElementById("pane-" + scope);
    if (!pane) return;
    if (dirty) {
      const old = pane.querySelector(".tj198");
      if (old) {
        old.hidden = true;
        let note = pane.querySelector(".tj198-dirty");
        if (!note) {
          note = document.createElement("p");
          note.className = "tj198-dirty";
          pane.prepend(note);
        }
        note.textContent = "问题已修改，请点击“分析并路由”、启动推演或“重新合参”，再查看对应结果。";
      }
      return;
    }
    const revision = generation;
    await ensure();
    if (revision !== generation || active() !== scope) return schedule();
    pane.querySelector(".tj198-dirty")?.remove();
    let host = pane.querySelector(":scope > .tj198");
    if (!host) {
      host = document.createElement("section");
      host.className = "tj198";
      host.setAttribute("aria-label", "深度解析与大白话结果");
      let input =
        scope === "router"
          ? pane.querySelector(".tj196")
          : scope === "qimen"
            ? pane.querySelector(".qm124-hero")
            : null;
      if (input) {
        while (input.parentElement && input.parentElement !== pane) input = input.parentElement;
        input.after(host);
      } else pane.prepend(host);
    }
    host.hidden = false;
    const a = build(runtime(), { scope }),
      signature = JSON.stringify({ ...a, generatedAt: "" });
    if (mounted.get(host) === signature) return;
    mounted.set(host, signature);
    host.innerHTML = reportHTML(a);
    host._report = a;
    lastReport = a;
  }
  function syncFromInput() {
    const scope = active();
    if (scope === "router") {
      const value = document.getElementById("tj196Question")?.value;
      if (value?.trim()) {
        const route = window.TianjiQuestionRouter.route(value);
        setQuestion({
          topic: route.consensusTopic,
          question: route.question,
          intent: route.classification.intent,
        });
      }
    } else if (scope === "over") {
      const topic = document.getElementById("tj169Topic")?.value || context.topic,
        question = document.getElementById("tj169Question")?.value ?? context.question;
      setQuestion({ topic, question, intent: context.intent });
    } else if (scope === "qimen") {
      const question = document.getElementById("qm124Question")?.value ?? context.question;
      const route = window.TianjiQuestionRouter?.classify?.(question);
      const saved = safe(() =>
        JSON.parse(localStorage.getItem("tianjipan.qimen.easy.v124") || "null"),
      );
      const topic =
        saved?.topicManual && typeof qmTopic !== "undefined"
          ? qmTopic
          : route?.consensusTopic || context.topic;
      setQuestion({ question, topic, intent: route?.classification?.intent || context.intent });
    }
  }
  document.addEventListener(
    "input",
    (e) => {
      if (["tj196Question", "tj169Question", "qm124Question"].includes(e.target?.id)) {
        dirty = true;
        schedule();
      }
    },
    true,
  );
  document.addEventListener(
    "click",
    async (e) => {
      const b = e.target?.closest?.("button");
      if (!b) return;
      const host = b.closest(".tj198");
      if (host) {
        if (b.hasAttribute("data-tj198-refresh")) {
          syncFromInput();
          generation++;
          schedule();
        } else if (b.dataset.tj198Open) {
          if (PANES.includes(b.dataset.tj198Open) || b.dataset.tj198Open === "verify")
            selectTab(b.dataset.tj198Open, true);
        } else if (b.hasAttribute("data-tj198-copy")) {
          const value = textReport(host._report);
          try {
            await navigator.clipboard.writeText(value);
            host.querySelector(".status").textContent = "已复制完整报告";
          } catch (_) {
            let ta = host.querySelector("textarea");
            if (!ta) {
              ta = document.createElement("textarea");
              ta.readOnly = true;
              host.append(ta);
            }
            ta.value = value;
            ta.focus();
            ta.select();
            host.querySelector(".status").textContent = "自动复制不可用，请复制已选中的报告文本";
          }
        } else if (b.hasAttribute("data-tj198-json")) {
          const blob = new Blob([JSON.stringify(host._report, null, 2)], {
              type: "application/json;charset=utf-8",
            }),
            url = URL.createObjectURL(blob),
            a = document.createElement("a");
          a.href = url;
          a.download = "天机盘_V198_统一解析报告.json";
          a.click();
          setTimeout(() => URL.revokeObjectURL(url), 2000);
        }
        return;
      }
      if (
        b.id === "tj196Route" ||
        b.hasAttribute("data-tj196-example") ||
        b.hasAttribute("data-tj196-recent")
      ) {
        setTimeout(() => {
          const st = window.TianjiQuestionRouter.state(),
            r = st.result;
          if (r)
            setQuestion({
              topic: r.consensusTopic,
              question: r.question,
              intent: r.classification.intent,
            });
        }, 0);
      }
      if (b.id === "qm124Run" || b.id === "tj169Refresh") syncFromInput();
      const topic = b.dataset.qm124Topic || b.dataset.topic;
      if (topic && b.closest("#asks,#lrTopics,#lyTopics,#mhTopics,.qm124-topics")) {
        const aliases = { 婚姻: "感情", 疾病: "健康", 考试: "学业" };
        const t = aliases[topic] || topic;
        setQuestion({
          topic: t,
          question: context.topic === t ? context.question : "",
          intent: "event",
        });
      }
      if (!b.closest(".tj198")) setTimeout(schedule, 0);
    },
    true,
  );
  document.addEventListener(
    "change",
    (e) => {
      if (e.target?.id === "tj169Topic" || e.target?.id === "tj169Question")
        setTimeout(() => {
          syncFromInput();
          schedule();
        }, 0);
      else if (!e.target?.closest?.(".tj198")) {
        generation++;
        schedule();
      }
    },
    true,
  );
  // Stable global hooks: preserve arguments, return values and exceptions.
  const oldRef = refRender;
  refRender = function (...args) {
    const result = oldRef.apply(this, args);
    schedule();
    return result;
  };
  const oldPanels = renderPanels;
  renderPanels = function (...args) {
    const result = oldPanels.apply(this, args);
    generation++;
    schedule();
    return result;
  };
  const oldTab = selectTab;
  selectTab = function (...args) {
    const result = oldTab.apply(this, args);
    schedule();
    return result;
  };
  window.addEventListener("tianji:lazy-ready", () => {
    window.TianjiConsensus?.setContext?.(context);
    generation++;
    schedule();
  });
  window.TianjiConsumerReport = Object.freeze({
    version: "1.0.0",
    schema: SCHEMA,
    build,
    setQuestion,
    context: () => clone(context),
    refresh: () => {
      reportArmed = true;
      generation++;
      schedule();
    },
    last: () => (lastReport ? clone(lastReport) : null),
    toText: textReport,
  });
  window.TianjiSystemV198 = {
    version: "v198",
    baseline: "v197",
    consumerReport: true,
    schema: SCHEMA,
    localRuleExplanation: true,
  };
  /* V201：V198 不再监听 footer / buildVersion；避免与后续版本形成版本号 Mutation 循环。 */
  /* 首屏不主动 schedule；第一次真实用户交互时 armReport() 再加载深度解析依赖。 */
})();
