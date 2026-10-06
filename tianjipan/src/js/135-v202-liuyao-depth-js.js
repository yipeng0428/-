(() => {
  "use strict";
  const BUILD = "v202 · 2026-10-06 12:53 +08:00";
  const SCHEMA = "tianji.liuyao.depth.v1";
  const HE6 = [
    [0, 1],
    [2, 11],
    [3, 10],
    [4, 9],
    [5, 8],
    [6, 7],
  ];
  const CHONG = [
    [0, 6],
    [1, 7],
    [2, 8],
    [3, 9],
    [4, 10],
    [5, 11],
  ];
  const HARM = [
    { name: "申子辰三合水局", branches: [8, 0, 4], wx: 4 },
    { name: "亥卯未三合木局", branches: [11, 3, 7], wx: 0 },
    { name: "寅午戌三合火局", branches: [2, 6, 10], wx: 1 },
    { name: "巳酉丑三合金局", branches: [5, 9, 1], wx: 3 },
  ];
  const XING = [
    { name: "寅巳申三刑", branches: [2, 5, 8] },
    { name: "丑戌未三刑", branches: [1, 10, 7] },
    { name: "子卯相刑", branches: [0, 3] },
  ];
  const HAI = [
    [0, 7],
    [1, 6],
    [2, 5],
    [3, 4],
    [8, 11],
    [9, 10],
  ];
  const clone = (x) => (x == null ? x : JSON.parse(JSON.stringify(x)));
  const esc202 = (s) =>
    String(s ?? "").replace(
      /[&<>"']/g,
      (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
    );
  const pair = (arr, a, b) =>
    arr.some((p) => (p[0] === a && p[1] === b) || (p[0] === b && p[1] === a));
  const other = (arr, b) => {
    const p = arr.find((x) => x.includes(b));
    return p ? (p[0] === b ? p[1] : p[0]) : null;
  };
  const toneScore = (s) => (s >= 1 ? "good" : s <= -1 ? "bad" : "mid");

  function currentR() {
    try {
      return typeof R !== "undefined" ? R : null;
    } catch (_) {
      return null;
    }
  }
  function currentL(R0) {
    if (!R0) return null;
    try {
      const x = lyLinesFrom(R0);
      return liuyao(x.lines, x.moving, R0.bz.dayIdx, R0.bz.pill[1].b);
    } catch (_) {
      return null;
    }
  }
  function cfg(topic, R0) {
    let t = topic || (typeof lyTopic !== "undefined" && lyTopic) || "求财";
    const alias = { 感情: "婚姻", 健康: "疾病", 学业: "考试", 置业: "求财" };
    t = alias[t] || t;
    let c = window.LY_TOPIC?.[t] || (typeof LY_TOPIC !== "undefined" ? LY_TOPIC[t] : null);
    if (!c) c = { yong: "世", desc: "未配置专门事项用神，暂以世爻为主体观察。" };
    let y = c.yong;
    if (y === "*") y = R0?.opt?.gender === "M" ? "妻财" : "官鬼";
    return { topic: t, yong: y, desc: c.desc || "" };
  }
  function strengthDetail(r, L) {
    const base = lyStrength(r, L.monthB, L.dayIdx % 12);
    return { score: +base.s.toFixed(2), reasons: base.n.slice(), tone: toneScore(base.s) };
  }
  function selectYong(L, R0, topic) {
    const C = cfg(topic, R0),
      rows = L.rows,
      sts = rows.map((r) => strengthDetail(r, L));
    let idx = null,
      fu = false;
    if (C.yong === "世") idx = L.shi - 1;
    else if (C.yong === "应") idx = L.ying - 1;
    else {
      const list = rows
        .filter((r) => r.rel === C.yong)
        .sort((a, b) => (b.moving ? 1 : 0) - (a.moving ? 1 : 0) || sts[b.i].score - sts[a.i].score);
      if (list.length) idx = list[0].i;
      else {
        const f = rows.find((r) => r.fu && r.fu.rel === C.yong);
        if (f) {
          idx = f.i;
          fu = true;
        }
      }
    }
    const row = idx == null ? null : rows[idx];
    return {
      topic: C.topic,
      name: C.yong,
      idx,
      fu,
      row,
      strength: idx == null ? null : sts[idx],
      desc: C.desc,
      allStrength: sts,
    };
  }
  function patterns(L, Y) {
    const rows = L.rows,
      out = [],
      pairs = [
        [0, 3],
        [1, 4],
        [2, 5],
      ];
    const sixChong = pairs.every(([a, b]) => pair(CHONG, rows[a].b, rows[b].b));
    const sixHe = pairs.every(([a, b]) => pair(HE6, rows[a].b, rows[b].b));
    if (sixChong)
      out.push({
        name: "六冲卦",
        tone: "bad",
        text: "全卦三组内外爻相冲，传统象法偏向变动、分离、反复；聚合类事项不宜只看一时顺利。",
      });
    if (sixHe)
      out.push({
        name: "六合卦",
        tone: "good",
        text: "全卦三组内外爻相合，传统象法偏向聚合、维系与牵绊；病讼类反而可能表示拖延。",
      });
    if (L.pal.order === "游魂")
      out.push({
        name: "游魂",
        tone: "mid",
        text: "八宫游魂，偏动荡、人在外、心意不定或事情难安于一处。",
      });
    if (L.pal.order === "归魂")
      out.push({
        name: "归魂",
        tone: "mid",
        text: "八宫归魂，偏回归、回到原点或事情最终收束到旧处。",
      });
    const active = new Set(L.moving.map((i) => rows[i].b));
    active.add(L.monthB);
    active.add(L.dayIdx % 12);
    HARM.forEach((g) => {
      const hit = g.branches.filter((b) => active.has(b));
      const movingHit = g.branches.filter((b) => L.moving.some((i) => rows[i].b === b));
      if (hit.length === 3 && movingHit.length >= 2)
        out.push({
          name: g.name,
          tone: "cyan",
          text: `动爻与月日共同凑齐 ${g.branches.map((b) => ZHI[b]).join("")}，且至少两支来自动爻；可作为“三合成局倾向”观察，是否真正成局仍要结合用神、化爻与冲破。`,
        });
    });
    const coreBranches = [rows[L.shi - 1].b, rows[L.ying - 1].b, ...L.moving.map((i) => rows[i].b)];
    XING.forEach((g) => {
      if (g.branches.every((b) => coreBranches.includes(b)))
        out.push({
          name: g.name,
          tone: "bad",
          text: "世、应或动爻形成刑象，传统上偏向内耗、别扭、反复约束；这里只作结构提示，不单独定吉凶。",
        });
    });
    const yb = Y.row?.b;
    if (yb != null) {
      const harmful = coreBranches.filter((b) => b !== yb && pair(HAI, yb, b));
      if (harmful.length)
        out.push({
          name: "用神见害",
          tone: "bad",
          text: `用神${ZHI[yb]}与关键爻中的${[...new Set(harmful)].map((b) => ZHI[b]).join("、")}成六害，偏向暗中牵制、误会或不易明说的阻力。`,
        });
    }
    const adv = L.rows.filter((r) => r.moving && r.change === "化进神");
    const ret = L.rows.filter((r) => r.moving && r.change === "化退神");
    if (adv.length)
      out.push({
        name: "化进神",
        tone: "good",
        text: `第${adv.map((r) => r.i + 1).join("、")}爻化进，趋势偏向推进、增加或向前。`,
      });
    if (ret.length)
      out.push({
        name: "化退神",
        tone: "bad",
        text: `第${ret.map((r) => r.i + 1).join("、")}爻化退，趋势偏向收缩、后退或力量渐减。`,
      });
    const backGood = L.rows.filter((r) => r.moving && r.change === "回头生"),
      backBad = L.rows.filter((r) => r.moving && r.change === "回头克");
    if (backGood.length)
      out.push({
        name: "回头生",
        tone: "good",
        text: `第${backGood.map((r) => r.i + 1).join("、")}爻动后得变爻回生，属于较明确的后续增益结构。`,
      });
    if (backBad.length)
      out.push({
        name: "回头克",
        tone: "bad",
        text: `第${backBad.map((r) => r.i + 1).join("、")}爻动后被变爻回克，属于较明确的中途受损结构。`,
      });
    return out;
  }
  function addDays(civ, n) {
    try {
      if (typeof calAddDays === "function") {
        const x = calAddDays(civ.y, civ.m, civ.d, n);
        return { y: x.y, m: x.m, d: x.d };
      }
    } catch (_) {}
    const d = new Date(Date.UTC(civ.y, civ.m - 1, civ.d + n, 12));
    return { y: d.getUTCFullYear(), m: d.getUTCMonth() + 1, d: d.getUTCDate() };
  }
  function dateInfo(c) {
    try {
      if (typeof dayInfo === "function") {
        const x = dayInfo(c.y, c.m, c.d);
        return { idx: x.dayIdx, gz: x.gz || "", b: x.dayIdx % 12 };
      }
    } catch (_) {}
    return null;
  }
  function timingCandidates(L, Y, R0) {
    if (!Y.row || Y.fu) return [];
    const yb = Y.row.b,
      he = other(HE6, yb),
      ch = other(CHONG, yb),
      civ = R0?.t?.civ;
    if (!civ) return [];
    const rows = L.rows;
    const strongJi =
      rows
        .filter((r) => r.i !== Y.idx)
        .map((r) => ({ r, s: strengthDetail(r, L).score }))
        .filter((x) => x.s >= 1.2)
        .sort((a, b) => b.s - a.s)[0]?.r || null;
    const out = [];
    for (let n = 1; n <= 60; n++) {
      const d = addDays(civ, n),
        di = dateInfo(d);
      if (!di) continue;
      let score = 0,
        why = [];
      if (di.b === yb) {
        score += 3;
        why.push(`值用神${ZHI[yb]}`);
      }
      if (he != null && di.b === he) {
        score += 1.6;
        why.push(`六合用神${ZHI[yb]}`);
      }
      if (ch != null && di.b === ch && !Y.row.moving) {
        score += 1.5;
        why.push("冲起静用神");
      }
      if (Y.row.kong && di.b === yb) {
        score += 1.2;
        why.push("旬空填实参考");
      }
      if (strongJi) {
        const jc = other(CHONG, strongJi.b);
        if (jc != null && di.b === jc) {
          score += 0.8;
          why.push(`冲强阻力爻${ZHI[strongJi.b]}`);
        }
      }
      if (score > 0)
        out.push({
          offset: n,
          date: `${d.y}-${String(d.m).padStart(2, "0")}-${String(d.d).padStart(2, "0")}`,
          gz: di.gz || ZHI[di.b],
          branch: di.b,
          score: +score.toFixed(1),
          why,
        });
    }
    return out.sort((a, b) => b.score - a.score || a.offset - b.offset).slice(0, 8);
  }
  function plainText(L, Y, patterns0, reading) {
    const verdict = reading?.verdict?.[0] || "平";
    if (!Y.row)
      return `这卦目前最关键的问题是“用神没有明确落到卦里”，所以不适合硬下结论。先把所问事情缩小、明确，再重新起卦更有价值。`;
    const s = Y.strength?.score || 0;
    const pGood = patterns0.filter((x) => x.tone === "good").length,
      pBad = patterns0.filter((x) => x.tone === "bad").length;
    let first =
      s >= 1.2
        ? "用神有力，事情本身有抓手"
        : s <= -1.2
          ? "用神偏弱，事情的承载力不足"
          : "用神力量中等，成败更依赖后续条件";
    let second =
      pBad > pGood
        ? "。结构里的阻力信号比助力更突出，宜先处理卡点再推进"
        : pGood > pBad
          ? "。卦里有较明确的助力结构，可以顺势推进，但仍需看现实条件是否到位"
          : "。卦里的利与阻比较接近，更适合边验证边推进";
    return `大白话：当前综合判断偏「${verdict}」。${first}${second}。六爻的应期只能当传统时间线索，不应把某一天理解成必然发生。`;
  }
  function build(R0 = currentR(), topic) {
    const L = currentL(R0);
    if (!L)
      return { schema: SCHEMA, build: BUILD, available: false, reason: "当前未取到六爻装卦结果" };
    const Y = selectYong(L, R0, topic),
      reading = liuyaoReading(L, R0, Y.topic),
      P = patterns(L, Y),
      T = timingCandidates(L, Y, R0);
    return {
      schema: SCHEMA,
      build: BUILD,
      available: true,
      topic: Y.topic,
      hexagram: {
        name: L.info.name,
        changed: L.moving.length ? L.info2.name : null,
        palace: L.palName,
        order: L.pal.order,
        shi: L.shi,
        ying: L.ying,
        moving: L.moving.slice(),
        monthBranch: L.monthB,
        dayBranch: L.dayIdx % 12,
        kong: L.kong.slice(),
      },
      yong: {
        name: Y.name,
        index: Y.idx == null ? null : Y.idx + 1,
        fu: Y.fu,
        branch: Y.row?.b ?? null,
        strength: Y.strength,
      },
      lines: L.rows.map((r, i) => ({
        line: i + 1,
        rel: r.rel,
        branch: r.b,
        wx: r.wx,
        moving: !!r.moving,
        shi: !!r.isShi,
        ying: !!r.isYing,
        void: !!r.kong,
        season: r.season,
        dayRel: r.dayRel,
        change: r.change || "",
        strength: Y.allStrength[i],
      })),
      patterns: P,
      timing: T,
      verdict: reading.verdict,
      score: reading.score,
      plain: plainText(L, Y, P, reading),
      boundaries: [
        "旺衰评分是本站确定性规则的相对量表，不是概率。",
        "三合、刑害、应期属于传统象法，不单独决定现实结果。",
        "应期候选只做传统时间线索，现实行动仍应依据真实信息。",
      ],
    };
  }
  function panel() {
    const D = build();
    if (!D.available)
      return `<section class="ly202"><div class="ly202-note">${esc202(D.reason)}</div></section>`;
    const tone = D.yong.strength?.tone || "mid";
    const patGood = D.patterns.filter((x) => x.tone === "good").length,
      patBad = D.patterns.filter((x) => x.tone === "bad").length;
    return `<section class="ly202" id="ly202Depth">
  <section class="ly202-hero"><div class="ly202-head"><div><h3>六爻深度层 · 旺衰 / 卦格 / 应期</h3><p>在原有纳甲、世应、用神、原忌仇神与动变解读之上，把每爻力量、关键结构与传统应期候选统一成可审计数据层。此层不替代现实判断，也不把应期写成“必然发生”。</p></div><span class="ly202-schema">${SCHEMA}</span></div></section>
  <div class="ly202-kpis">
   <div class="ly202-kpi cyan"><small>事项</small><b>${esc202(D.topic)}</b></div>
   <div class="ly202-kpi ${tone}"><small>用神</small><b>${esc202(D.yong.name)}${D.yong.index ? " · " + D.yong.index + "爻" : ""}</b></div>
   <div class="ly202-kpi ${tone}"><small>用神力量</small><b>${D.yong.strength ? D.yong.strength.score.toFixed(1) : "—"}</b></div>
   <div class="ly202-kpi good"><small>助力格</small><b>${patGood}</b></div>
   <div class="ly202-kpi bad"><small>阻力格</small><b>${patBad}</b></div>
  </div>
  <div class="ly202-grid">
   <section class="ly202-card"><h4>六爻逐爻旺衰表</h4><div class="ly202-lines">${D.lines
     .slice()
     .reverse()
     .map(
       (x) =>
         `<div class="ly202-line${x.line === D.yong.index ? " yong" : ""}${x.shi ? " shi" : ""}"><b>${["初", "二", "三", "四", "五", "上"][x.line - 1]}爻</b><span>${esc202(x.rel)} · ${ZHI[x.branch]}${x.moving ? " · 动" : ""}</span><small>${esc202(x.strength.reasons.join("；"))}${x.change ? "；" + esc202(x.change) : ""}</small><span class="ly202-score ${x.strength.tone}">${x.strength.score.toFixed(1)}</span></div>`,
     )
     .join("")}</div></section>
   <aside class="ly202-card"><h4>卦格与组合结构</h4><div class="ly202-patterns">${D.patterns.length ? D.patterns.map((x) => `<div class="ly202-pattern ${x.tone}"><b>${esc202(x.name)}</b><small>${esc202(x.text)}</small></div>`).join("") : '<div class="ly202-note">本卦未识别到需要单列的六合、六冲、游归魂、进退、回头生克、三合或刑害结构；以用神与月日生克为主。</div>'}</div></aside>
  </div>
  <div class="ly202-grid">
   <section class="ly202-card"><h4>应期候选 · 未来 60 日传统取法</h4><div class="ly202-dates">${D.timing.length ? D.timing.map((x) => `<div class="ly202-date"><b>${esc202(x.date)}</b><span>${esc202(x.gz)}</span><small>${esc202(x.why.join(" · "))}</small><strong>${x.score.toFixed(1)}</strong></div>`).join("") : '<div class="ly202-note">当前没有足够稳定的用神条件生成具体候选日期；不强行给日期。</div>'}</div></section>
   <aside class="ly202-card"><h4>大白话摘要</h4><div class="ly202-plain">${esc202(D.plain)}</div><div class="ly202-note" style="margin-top:7px">${D.boundaries.map(esc202).join("<br>")}</div><div class="ly202-actions"><button type="button" id="ly202Refresh">重新计算</button><button type="button" id="ly202Copy">复制深度 Schema</button></div></aside>
  </div>
 </section>`;
  }
  function refresh() {
    const host = document.getElementById("ly202Depth");
    if (host) {
      const tmp = document.createElement("div");
      tmp.innerHTML = panel();
      host.replaceWith(tmp.firstElementChild);
      bind();
    }
  }
  function bind() {
    document.getElementById("ly202Refresh")?.addEventListener("click", refresh);
    document.getElementById("ly202Copy")?.addEventListener("click", () => {
      const txt = JSON.stringify(build(), null, 2);
      navigator.clipboard
        ?.writeText?.(txt)
        .then(() => {
          try {
            toast("已复制六爻深度 Schema");
          } catch (_) {}
        })
        .catch(() => {});
    });
    const tp = document.getElementById("lyTopics");
    if (tp && !tp.dataset.ly202) {
      tp.dataset.ly202 = "1";
      tp.addEventListener("click", () => setTimeout(refresh, 80));
    }
    ["lyTime", "lyCoin", "lyDayan", "lyMan", "lyGo"].forEach((id) => {
      const el = document.getElementById(id);
      if (el && !el.dataset.ly202) {
        el.dataset.ly202 = "1";
        el.addEventListener("click", () => setTimeout(refresh, id === "lyDayan" ? 220 : 100));
      }
    });
  }
  try {
    const oldPage = REF_PANES.liuyao;
    if (oldPage && !oldPage.__v202) {
      const fn = () => oldPage() + panel();
      fn.__v202 = true;
      REF_PANES.liuyao = fn;
    }
    const oldBind = REF_BIND.liuyao;
    REF_BIND.liuyao = () => {
      try {
        oldBind && oldBind();
      } catch (_) {}
      try {
        bind();
      } catch (e) {
        console.warn("[V202 bind]", e);
      }
    };
  } catch (e) {
    console.warn("[V202 patch]", e);
  }

  const TASKS202 = [
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
    {
      id: "consumer",
      p: "P0",
      name: "统一消费者结果页 / 报告",
      state: "done",
      note: "v198：深度解析 + 大白话结果 + 来源回指",
    },
    {
      id: "qimen-evidence",
      p: "P1",
      name: "奇门四家第三方对拍 / 高级 Evidence",
      state: "doing",
      note: "v199 一期已建验证台；日/月/年仍等待真实外部 reference 样本",
    },
    {
      id: "liuyao-depth",
      p: "P1",
      name: "六爻完整旺衰 / 卦格 / 应期层",
      state: "done",
      note: "v202：逐爻旺衰、用神力量、六合六冲/游归魂/进退/回头生克/三合刑害、未来60日应期候选与可审计 Schema",
    },
    {
      id: "ziwei-depth",
      p: "P1",
      name: "紫微完整飞星体系",
      state: "todo",
      note: "继续补向心/离心自化、来因宫与更完整应期",
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
  const BOARD202 = {
    schema: "tianji.priority.board.v1",
    build: BUILD,
    total: 14,
    done: 6,
    doing: 1,
    blocked: 1,
    progress: 46.4,
    next: ["奇门日/月/年真实第三方 reference 样本", "紫微完整飞星体系", "玄空完整宅盘"],
    tasks: TASKS202,
  };
  function applyBoard() {
    window.TianjiPriorityBoard = Object.freeze({
      schema: BOARD202.schema,
      snapshot: () => clone(BOARD202),
    });
    const road = window.TianjiRoadmap || {};
    window.TianjiRoadmap = Object.freeze(
      Object.assign({}, road, {
        urgentImportant: clone(BOARD202),
        nextMainline: [
          "奇门四家第三方对拍（二期待外部样本）",
          "紫微完整飞星体系",
          "玄空完整宅盘",
          "历史时区 / DST",
        ],
      }),
    );
  }
  applyBoard();
  window.addEventListener("tianji:lazy-ready", () => setTimeout(applyBoard, 0));

  window.TianjiLiuyaoDepth = Object.freeze({
    version: "1.0.0",
    build: BUILD,
    schema: SCHEMA,
    build: (runtime, topic) => clone(build(runtime || currentR(), topic)),
    manifest: () => ({
      module: "Tianji Liuyao Depth Layer",
      schema: SCHEMA,
      features: ["逐爻旺衰", "用神强弱", "卦格/组合结构", "传统应期候选", "大白话摘要"],
      boundaries: ["相对评分非概率", "应期非必然日期", "不同六爻流派规则可继续版本化"],
    }),
  });
  window.TianjiSystemV202 = { version: "v202", build: BUILD, liuyaoDepth: true, baseline: "v201" };

  function syncVersion() {
    const b = document.getElementById("buildVersion");
  }
  /* V226: historical delayed version writer disabled */
})();
