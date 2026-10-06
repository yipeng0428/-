(() => {
  "use strict";
  const BUILD = "v198 · 2026-10-06 +08:00";
  const SCHEMA = "tianji.question.router.v1";
  const STORE = "tianji.router.v1";
  const CONSENSUS_STORE = "tianji.v169.consensus";

  const SYS = {
    qimen: { name: "奇门遁甲", tab: "qimen", why: "看当下态势、时机、方位与推进条件。" },
    liuren: { name: "大六壬", tab: "liuren", why: "看事件链、人事关系、来去成败与过程。" },
    liuyao: { name: "六爻纳甲", tab: "liuyao", why: "适合单一明确问题，强调用神、世应与动变。" },
    meihua: { name: "梅花易数", tab: "yi", why: "适合快速结构性参考与时间/数字起卦。" },
    zeri: { name: "择日", tab: "zeri", why: "用于筛选日期、时机与事项适配，不替代事件占测。" },
    bazi: { name: "八字", tab: "bazi", why: "用于长期命局背景、阶段趋势与个人底层结构。" },
    ziwei: { name: "紫微斗数", tab: "ziwei", why: "用于长期人生主题、宫位结构与运限背景。" },
    hepan: { name: "合盘", tab: "hepan", why: "用于两人关系与长期互动结构。" },
    house: { name: "房屋方位", tab: "house", why: "用于户型、坐向、财位等空间问题。" },
    xk: { name: "玄空飞星", tab: "xk", why: "用于宅盘、山向与流年空间层。" },
    jifang: { name: "吉方共识", tab: "jifang", why: "用于出行、办事、搬迁等方位选择。" },
  };
  const TOPIC_RULES = [
    {
      topic: "求财",
      words: [
        "钱",
        "财",
        "赚钱",
        "收入",
        "生意",
        "投资",
        "回款",
        "客户",
        "订单",
        "利润",
        "涨价",
        "融资",
        "借钱",
        "贷款",
        "买卖",
        "交易",
        "开店",
        "开业",
      ],
    },
    {
      topic: "事业",
      words: [
        "工作",
        "事业",
        "职业",
        "职位",
        "升职",
        "跳槽",
        "面试",
        "公司",
        "老板",
        "项目",
        "岗位",
        "辞职",
        "创业",
        "发展",
        "晋升",
        "职场",
      ],
    },
    {
      topic: "感情",
      words: [
        "感情",
        "恋爱",
        "对象",
        "婚姻",
        "结婚",
        "复合",
        "分手",
        "伴侣",
        "夫妻",
        "男友",
        "女友",
        "喜欢",
        "缘分",
        "相亲",
      ],
    },
    {
      topic: "健康",
      words: [
        "健康",
        "身体",
        "生病",
        "疾病",
        "病情",
        "手术",
        "治疗",
        "医院",
        "医生",
        "症状",
        "恢复",
        "求医",
      ],
    },
    {
      topic: "出行",
      words: [
        "出行",
        "旅行",
        "出差",
        "远行",
        "航班",
        "开车",
        "路上",
        "迁移",
        "搬迁",
        "去哪里",
        "方向",
        "方位",
      ],
    },
    {
      topic: "学业",
      words: [
        "学习",
        "学业",
        "考试",
        "考研",
        "考公",
        "成绩",
        "学校",
        "录取",
        "升学",
        "论文",
        "答辩",
        "证书",
      ],
    },
    {
      topic: "官司",
      words: [
        "官司",
        "诉讼",
        "法院",
        "律师",
        "仲裁",
        "纠纷",
        "合同纠纷",
        "起诉",
        "法律",
        "判决",
        "维权",
      ],
    },
    {
      topic: "合作",
      words: [
        "合作",
        "合伙",
        "签约",
        "合同",
        "伙伴",
        "供应商",
        "代理",
        "加盟",
        "联合",
        "谈判",
        "协议",
      ],
    },
    {
      topic: "置业",
      words: [
        "房子",
        "买房",
        "卖房",
        "看房",
        "置业",
        "楼盘",
        "房产",
        "租房",
        "入宅",
        "装修",
        "户型",
        "住宅",
      ],
    },
    {
      topic: "寻人",
      words: [
        "寻人",
        "找人",
        "人在哪里",
        "他在哪里",
        "她在哪里",
        "失联",
        "联系不上",
        "走失",
        "失踪",
        "失散",
        "离家",
        "去向",
        "下落",
        "能不能找到人",
        "什么时候找到人",
      ],
    },
    {
      topic: "寻物",
      words: [
        "寻物",
        "找东西",
        "东西丢了",
        "丢东西",
        "遗失",
        "失物",
        "丢失",
        "不见了",
        "物品在哪里",
        "东西在哪里",
        "能不能找到",
        "钥匙丢了",
        "手机丢了",
        "钱包丢了",
        "证件丢了",
      ],
    },
  ];
  const INTENT_RULES = [
    {
      id: "selection",
      name: "择时 / 选日",
      words: [
        "什么时候",
        "哪天",
        "哪几天",
        "几号",
        "吉日",
        "日期",
        "择日",
        "日子",
        "哪一天",
        "时机",
        "几点",
        "哪个时间",
        "适合什么时候",
      ],
    },
    {
      id: "relationship",
      name: "两人关系",
      words: [
        "我和",
        "两个人",
        "双方",
        "合婚",
        "合盘",
        "夫妻",
        "伴侣",
        "对象",
        "关系如何",
        "适不适合结婚",
      ],
    },
    {
      id: "space",
      name: "空间 / 方位",
      words: [
        "风水",
        "户型",
        "坐向",
        "朝向",
        "财位",
        "方位",
        "哪个方向",
        "搬到哪里",
        "房屋",
        "住宅",
      ],
    },
    {
      id: "profile",
      name: "长期命局",
      words: [
        "一生",
        "长期",
        "未来几年",
        "这几年",
        "命格",
        "命局",
        "大运",
        "流年",
        "人生",
        "性格",
        "天赋",
        "适合什么职业",
        "今年运势",
      ],
    },
    { id: "event", name: "具体事项", words: [] },
  ];
  const EXAMPLES = [
    "这个合作现在适合继续推进吗？",
    "我什么时候适合换工作？",
    "这套房子现在适合买下来吗？",
    "我和这个对象适不适合长期发展？",
    "下个月哪几天适合签约？",
    "这次考试结果和临场状态如何？",
    "联系不上这个人，他大概会往什么方向去？",
    "我丢的东西还有机会找到吗，可能落在哪一带？",
  ];
  const HIGH_RISK = {
    健康: "健康问题应以真实症状、检查与专业医疗意见为主；这里仅做传统术数信息整理。",
    官司: "法律问题应以合同、证据和专业法律意见为主；这里不能替代律师判断。",
    求财: "投资、借贷和重大财务决定应以真实现金流、风险承受能力与专业财务信息为主。",
  };
  let state = { question: "", result: null, recent: [] };
  try {
    const x = JSON.parse(localStorage.getItem(STORE) || "null");
    if (x) {
      state.question = String(x.question || "").slice(0, 300);
      state.recent = Array.isArray(x.recent) ? x.recent.slice(0, 8) : [];
    }
  } catch (_) {}

  function save() {
    try {
      localStorage.setItem(
        STORE,
        JSON.stringify({ question: state.question, recent: state.recent.slice(0, 8) }),
      );
    } catch (_) {}
  }
  function norm(s) {
    return String(s || "")
      .replace(/\s+/g, " ")
      .trim();
  }
  function countHits(text, words) {
    let score = 0,
      hits = [];
    for (const w of words) {
      if (text.includes(w)) {
        score += Math.max(1, Math.min(3, w.length / 2));
        hits.push(w);
      }
    }
    return { score, hits };
  }
  function classifyTopic(text) {
    let best = { topic: "事业", score: 0, hits: [] },
      second = null;
    for (const r of TOPIC_RULES) {
      const h = countHits(text, r.words),
        x = { topic: r.topic, score: h.score, hits: h.hits };
      if (x.score > best.score) {
        second = best;
        best = x;
      } else if (!second || x.score > second.score) second = x;
    }
    if (best.score === 0) {
      if (/房|宅|楼盘|户型/.test(text)) best = { topic: "置业", score: 1, hits: ["空间词"] };
      else best = { topic: "事业", score: 0.25, hits: [] };
    }
    const lexical = Math.min(100, Math.round(42 + best.score * 13 - (second?.score || 0) * 3));
    return { ...best, match: lexical };
  }
  function classifyIntent(text) {
    for (const r of INTENT_RULES.slice(0, -1)) {
      const h = countHits(text, r.words);
      if (h.score > 0) return { id: r.id, name: r.name, hits: h.hits };
    }
    return { id: "event", name: "具体事项", hits: [] };
  }
  function recommend(topic, intent, text) {
    let ids = [];
    if (topic === "寻人" || topic === "寻物") ids = ["qimen", "liuren", "liuyao", "meihua"];
    else if (intent === "profile") ids = ["bazi", "ziwei"];
    else if (intent === "relationship") ids = ["hepan", "bazi", "ziwei", "qimen"];
    else if (intent === "space")
      ids = topic === "置业" ? ["house", "xk", "qimen", "zeri"] : ["jifang", "qimen", "xk"];
    else if (intent === "selection") {
      if (topic === "置业") ids = ["zeri", "qimen", "house", "xk"];
      else if (topic === "出行") ids = ["zeri", "qimen", "jifang", "liuren"];
      else ids = ["zeri", "qimen", "liuyao"];
    } else {
      const map = {
        求财: ["qimen", "liuyao", "liuren", "meihua"],
        事业: ["qimen", "liuren", "liuyao", "meihua"],
        感情: ["liuyao", "qimen", "liuren", "hepan"],
        健康: ["qimen", "liuyao", "liuren"],
        出行: ["qimen", "liuren", "zeri", "jifang"],
        学业: ["qimen", "liuyao", "liuren", "meihua"],
        官司: ["liuren", "qimen", "liuyao"],
        合作: ["qimen", "liuyao", "liuren", "zeri"],
        置业: ["qimen", "zeri", "house", "xk"],
        寻人: ["qimen", "liuren", "liuyao", "meihua"],
        寻物: ["qimen", "liuren", "liuyao", "meihua"],
      };
      ids = map[topic] || ["qimen", "liuren", "liuyao"];
    }
    return [...new Set(ids)].map((id, i) => ({
      id,
      ...SYS[id],
      rank: i + 1,
      role: i === 0 ? "primary" : "support",
    }));
  }
  function build(question) {
    const q = norm(question),
      T = classifyTopic(q),
      I = classifyIntent(q),
      routes = recommend(T.topic, I.id, q);
    let caution =
      HIGH_RISK[T.topic] ||
      "路由只决定“先看哪个工具”，不是吉凶结论，也不代表任何准确率或科学概率。";
    if (T.topic === "寻人")
      caution =
        "寻人类仅作为传统术数信息整理与线索辅助，不替代报警、联系亲友、查看监控、通信记录或其它现实寻人手段。";
    if (T.topic === "寻物")
      caution =
        "寻物类仅作为传统术数信息整理与线索辅助，应同时优先回溯行动路径、询问现场人员、查看监控与失物招领。";
    const reasons = [
      `事项识别为「${T.topic}」，依据：${T.hits.length ? T.hits.join("、") : "未命中强关键词，采用默认事项层"}`,
      `问题形态识别为「${I.name}」${I.hits.length ? "，触发：" + I.hits.join("、") : ""}`,
      `优先使用 ${routes
        .slice(0, 2)
        .map((x) => x.name)
        .join(" + ")}，其它工具作为不同观察层补充。`,
    ];
    return {
      schema: SCHEMA,
      build: BUILD,
      question: q,
      classification: {
        topic: T.topic,
        intent: I.id,
        intentLabel: I.name,
        lexicalMatch: T.match,
        keywordHits: T.hits,
      },
      routes,
      consensusTopic: T.topic,
      reasons,
      caution,
      boundary: "匹配度仅表示本地关键词/句式规则的路由匹配程度，不表示占断可信度、概率或科学证据。",
    };
  }
  function remember(q, R) {
    const item = {
      q: q.slice(0, 80),
      topic: R.classification.topic,
      intent: R.classification.intentLabel,
      at: Date.now(),
    };
    state.recent = [item, ...state.recent.filter((x) => x.q !== item.q)].slice(0, 8);
    save();
  }
  function syncConsensus(R) {
    const ctx = { topic: R.consensusTopic, question: R.question, intent: R.classification.intent };
    try {
      localStorage.setItem(CONSENSUS_STORE, JSON.stringify(ctx));
    } catch (_) {}
    window.TianjiConsensus?.setContext?.(ctx);
    window.TianjiQimenQuestion?.set?.(ctx);
    window.TianjiConsumerReport?.setQuestion?.(ctx);
  }
  function E(s) {
    try {
      return esc(String(s == null ? "" : s));
    } catch (_) {
      return String(s ?? "").replace(
        /[&<>"']/g,
        (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[m],
      );
    }
  }
  function recentHTML() {
    if (!state.recent.length)
      return '<div class="tj196-boundary">还没有最近问事记录。这里只保存问题文本与路由分类，不保存占断结论。</div>';
    return `<div class="tj196-recent">${state.recent.map((x, i) => `<button type="button" data-tj196-recent="${i}"><b>${E(x.q)}</b><small>${E(x.topic)} · ${E(x.intent)}</small></button>`).join("")}</div>`;
  }
  function resultHTML(R) {
    if (!R)
      return `<div class="tj196-box"><h4>路由结果</h4><div class="tj196-boundary">输入一个自然语言问题，系统会先判断“你在问什么”，再决定应该优先进入哪个确定性工具。它不直接替你排一个新的“AI盘”。</div></div>`;
    const c = R.classification;
    return `<div class="tj196-box">
    <div class="tj196-kpis">
      <div class="tj196-kpi cyan"><small>事项</small><b>${E(c.topic)}</b></div>
      <div class="tj196-kpi"><small>问题形态</small><b>${E(c.intentLabel)}</b></div>
      <div class="tj196-kpi"><small>路由匹配</small><b>${c.lexicalMatch}</b></div>
      <div class="tj196-kpi good"><small>首选工具</small><b>${E(R.routes[0]?.name || "—")}</b></div>
    </div>
    <h4>建议路线</h4>
    <div class="tj196-route-list">${R.routes.map((x) => `<div class="tj196-route ${x.role === "primary" ? "primary" : ""}"><span class="tj196-rank">${x.rank}</span><div><b>${E(x.name)}</b><small>${E(x.why)}</small></div><button type="button" data-tj196-go="${x.tab}">进入</button></div>`).join("")}</div>
    <div class="tj196-reason">${R.reasons.map(E).join("<br>")}</div>
    <div class="tj196-actions"><button class="primary" id="tj196GoPrimary">按首选开始</button><button id="tj196Consensus">进入合参</button><button id="tj196Copy">复制路由 Schema</button></div>
  </div>`;
  }
  function render() {
    const R0 = state.result || (state.question ? build(state.question) : null);
    if (R0 && !state.result) state.result = R0;
    return `<div class="tj196">
    <section class="tj196-hero"><div class="tj196-head"><div class="tj196-head-main"><h3>自然语言问事路由</h3><p>先说人话，再选工具。这里负责把“我到底应该看奇门、六壬、六爻、梅花、择日，还是命局/空间工具？”自动整理出来；现在也支持 <b>寻人</b> 与 <b>寻物</b> 两类问事。确定性排盘仍由各 Core 负责。</p></div><span class="tj196-schema">${SCHEMA}</span></div>
      <div class="tj196-ask"><textarea id="tj196Question" maxlength="300" placeholder="例如：这个合作现在适合继续推进吗？">${E(state.question)}</textarea><button id="tj196Route">分析并路由</button></div>
      <div class="tj196-examples">${EXAMPLES.map((x, i) => `<button type="button" data-tj196-example="${i}">${E(x)}</button>`).join("")}</div>
    </section>
    <div class="tj196-grid">
      <div>${resultHTML(R0)}</div>
      <aside class="tj196-box"><h4>最近问事</h4>${recentHTML()}<h4 style="margin-top:11px">路由原则</h4><div class="tj196-tags"><span class="tj196-tag on">事项先分类</span><span class="tj196-tag">事件 ≠ 命局</span><span class="tj196-tag">择时独立</span><span class="tj196-tag">寻人 / 寻物</span><span class="tj196-tag">冲突不抹平</span></div><div class="tj196-boundary" style="margin-top:8px">${E(R0?.caution || "工具路由不是占断结果。")}</div></aside>
    </div>
    <div class="tj196-boundary"><b>边界：</b>${E(R0?.boundary || "匹配度只表示路由规则匹配，不表示准确率。")} 对健康、法律、财务等高风险事项，现实证据与专业判断优先。</div>
  </div>`;
  }
  function rerender() {
    try {
      const p = document.getElementById("pane-router");
      if (p) p.innerHTML = render();
      bind();
    } catch (e) {
      console.error("[v196 router render]", e);
    }
  }
  function bind() {
    const q = document.getElementById("tj196Question"),
      go = document.getElementById("tj196Route");
    const run = () => {
      const text = norm(q?.value || "");
      if (!text) {
        toast?.("请先输入你想问的事情");
        return;
      }
      state.question = text;
      state.result = build(text);
      remember(text, state.result);
      rerender();
    };
    if (go) go.onclick = run;
    if (q)
      q.addEventListener("keydown", (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
          e.preventDefault();
          run();
        }
      });
    document.querySelectorAll("[data-tj196-example]").forEach(
      (b) =>
        (b.onclick = () => {
          const x = EXAMPLES[+b.dataset.tj196Example];
          if (q) {
            q.value = x;
            state.question = x;
          }
          state.result = build(x);
          remember(x, state.result);
          rerender();
        }),
    );
    document.querySelectorAll("[data-tj196-recent]").forEach(
      (b) =>
        (b.onclick = () => {
          const x = state.recent[+b.dataset.tj196Recent];
          if (!x) return;
          state.question = x.q;
          state.result = build(x.q);
          rerender();
        }),
    );
    document.querySelectorAll("[data-tj196-go]").forEach(
      (b) =>
        (b.onclick = () => {
          if (state.result) syncConsensus(state.result);
          selectTab(b.dataset.tj196Go, true);
        }),
    );
    const p = document.getElementById("tj196GoPrimary");
    if (p)
      p.onclick = () => {
        if (!state.result) return;
        syncConsensus(state.result);
        selectTab(state.result.routes[0]?.tab || "qimen", true);
      };
    const c = document.getElementById("tj196Consensus");
    if (c)
      c.onclick = () => {
        if (!state.result) return;
        syncConsensus(state.result);
        selectTab("over", true);
        toast?.("已把问事主题同步到跨术数合参");
      };
    const cp = document.getElementById("tj196Copy");
    if (cp)
      cp.onclick = () => {
        if (!state.result) return;
        const txt = JSON.stringify(state.result, null, 2);
        navigator.clipboard
          ?.writeText?.(txt)
          .then(() => toast?.("已复制路由 Schema"))
          .catch(() => {});
      };
  }

  /* Add the new pane to the existing lazy renderer. */
  try {
    REF_PANES.router = () => render();
    REF_BIND.router = () => bind();
  } catch (e) {
    console.warn("[v196 router register]", e);
  }

  /* -------- Task board update -------- */
  const TASKS = [
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
      note: "v196–v197 完成：自然语言分类 → 工具组合 → 合参主题；新增寻人 / 寻物",
    },
    {
      id: "consumer",
      p: "P0",
      name: "统一消费者结果页 / 报告",
      state: "done",
      note: "v198：统一深度解析与大白话报告；盘面/解释分层、缺失提示、来源回指；专门断法仍按各模块成熟度保留缺口",
    },
    {
      id: "qimen-evidence",
      p: "P1",
      name: "奇门四家第三方对拍 / 高级 Evidence",
      state: "todo",
      note: "待逐盘对拍",
    },
    {
      id: "liuyao-depth",
      p: "P1",
      name: "六爻完整旺衰 / 卦格 / 应期层",
      state: "todo",
      note: "Core 已成型，解释层继续深化",
    },
    {
      id: "ziwei-depth",
      p: "P1",
      name: "紫微完整飞星体系",
      state: "todo",
      note: "继续补飞星/自化/应期",
    },
    {
      id: "qizheng",
      p: "P1",
      name: "七政四余核心化",
      state: "blocked",
      note: "等待星历、四余口径与许可证方案",
    },
    { id: "xk", p: "P1", name: "玄空完整宅盘", state: "todo", note: "运盘/山星/向星/替卦" },
    {
      id: "sanhe",
      p: "P1",
      name: "三合水法 Core",
      state: "todo",
      note: "罗盘已有，确定性规则链待核心化",
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
    done: 5,
    doing: 0,
    blocked: 1,
    progress: 35.7,
    next: [
      "寻人/寻物专门规则待验证（现有模块解释层缺口）",
      "奇门四家第三方对拍 / 高级 Evidence",
      "六爻 / 紫微解释层深化",
    ],
    tasks: TASKS,
  };
  const PRODUCT_INFRA = [
    { name: "首屏宽屏与启动性能", state: "done", v: "v181" },
    { name: "账号 / 云端档案 Bearer", state: "done", v: "v193" },
    { name: "全站设置 / 五套主题", state: "done", v: "v183–v192" },
    { name: "道长通知 / 云端发布控制台", state: "done", v: "v194–v195" },
  ];
  function roadmapHTML() {
    const core = TASKS.filter((x) => x.p === "P0");
    return `<section class="tj196-roadmap"><div class="tj196-roadmap-head"><h4>紧急重要任务 · P0 主线</h4><span class="progress">${BOARD.done} 已完成 · ${BOARD.doing} 进行中 · 总进度 ${BOARD.progress}%</span></div><div class="tj196-roadmap-grid">${core.map((x) => `<div class="tj196-roadmap-item ${x.state}"><b>${E(x.name)}</b>${x.state === "done" ? "已完成" : x.state === "doing" ? "进行中" : "待办"} · ${E(x.note)}</div>`).join("")}</div></section>`;
  }
  function patchVerify() {
    try {
      if (
        typeof REF_PANES === "undefined" ||
        typeof REF_PANES.verify !== "function" ||
        REF_PANES.verify.__v196
      )
        return;
      const old = REF_PANES.verify;
      const fn = () => roadmapHTML() + old();
      fn.__v196 = true;
      REF_PANES.verify = fn;
    } catch (e) {
      console.warn("[v196 board patch]", e);
    }
  }
  function applyBoard() {
    window.TianjiPriorityBoard = Object.freeze({
      schema: BOARD.schema,
      snapshot: () => JSON.parse(JSON.stringify(BOARD)),
    });
    const road = window.TianjiRoadmap || {};
    window.TianjiRoadmap = Object.freeze(
      Object.assign({}, road, {
        urgentImportant: JSON.parse(JSON.stringify(BOARD)),
        productInfrastructure: JSON.parse(JSON.stringify(PRODUCT_INFRA)),
        nextMainline: [
          "奇门四家第三方对拍与高级 Evidence",
          "六爻/紫微解释层深化",
          "历史时区 / DST",
        ],
      }),
    );
    patchVerify();
  }
  applyBoard();
  window.addEventListener("tianji:lazy-ready", () => {
    setTimeout(applyBoard, 0);
  });
  setTimeout(applyBoard, 1200);

  window.TianjiQuestionRouter = Object.freeze({
    version: "1.0.0",
    build: BUILD,
    schema: SCHEMA,
    classify: (q) => build(q),
    route: (q) => {
      const R = build(q);
      state.question = R.question;
      state.result = R;
      remember(R.question, R);
      syncConsensus(R);
      return R;
    },
    state: () => JSON.parse(JSON.stringify(state)),
    board: () => JSON.parse(JSON.stringify(BOARD)),
    manifest: () => ({
      module: "Tianji Natural Language Question Router",
      schema: SCHEMA,
      input: "natural language question",
      output: ["topic", "intent", "route list", "consensus topic"],
      principle: "router only; deterministic engines remain authoritative",
    }),
  });

  try {
    const bv = document.getElementById("buildVersion");

    window.TianjiSystemV197 = {
      version: "v197",
      build: BUILD,
      questionRouter: true,
      searchPeopleAndObjects: true,
      taskBoardUpdated: true,
      baseline: "v196",
    };
  } catch (_) {}
})();
