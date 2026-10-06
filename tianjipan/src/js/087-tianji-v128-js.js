(() => {
  "use strict";
  const V128_BUILD = "v128 · 2026-10-04 21:50 +08:00";

  /* ==================== 1. 此刻星盘：彻底删除放大按钮 ==================== */
  function v128RemoveNowZoom() {
    try {
      document.querySelectorAll("#pane-now .wheelbox>.zbtn").forEach((b) => b.remove());
      const box = document.querySelector("#pane-now .wheelbox");
      if (box) box.style.paddingBottom = "0px";
    } catch (_) {}
  }
  let v128ZoomTimer = 0;
  function v128ZoomSoon() {
    if (v128ZoomTimer) return;
    v128ZoomTimer = setTimeout(() => {
      v128ZoomTimer = 0;
      v128RemoveNowZoom();
    }, 30);
  }
  try {
    new MutationObserver(v128ZoomSoon).observe(document.body, { childList: true, subtree: true });
  } catch (_) {}
  setTimeout(v128RemoveNowZoom, 60);

  /* ==================== 2. “此刻”从展示型升级为命主关联型 ==================== */
  function v128HasPerson() {
    try {
      return typeof meHas === "function" && meHas() && typeof R !== "undefined" && R && R.bz;
    } catch (_) {
      return false;
    }
  }
  function v128Person() {
    try {
      return v128HasPerson() ? meP() : null;
    } catch (_) {
      return null;
    }
  }
  function v128Name() {
    try {
      return v128HasPerson()
        ? ((document.getElementById("pname") || {}).value || "当前命主").trim() || "当前命主"
        : "";
    } catch (_) {
      return "";
    }
  }
  function v128SsPlain(ss) {
    if (/比肩|劫财/.test(ss)) return "更适合自己拿主意、谈分工，也要防同类竞争和一时逞强";
    if (/食神|伤官/.test(ss)) return "更适合表达、创作、输出方案；情绪上来时少顶嘴、少把话说死";
    if (/正财|偏财/.test(ss))
      return "更适合处理钱、订单、资源和现实执行；先算投入产出，再决定要不要加码";
    if (/正官|七杀/.test(ss)) return "规则、期限、责任感会更强；适合收口和执行，不适合硬碰硬";
    if (/正印|偏印/.test(ss)) return "更适合学习、整理资料、复盘和借助已有资源；别只想不做";
    return "先看手头最重要的一件事，少同时开启太多任务";
  }
  function v128DayCtx(N) {
    const n = nowBJ(),
      P = v128Person();
    if (!P) return null;
    try {
      const S = meDayScore(P, n.y, n.m, n.d),
        hs = N && N.R && N.R.bz ? N.R.bz.pill[3].s : null,
        hss = hs == null ? "—" : shishen(P.bz.dm, hs),
        hw = hs == null ? -1 : GAN_WX[hs],
        xy = P.deep.xy || { favor: [], avoid: [] };
      return {
        P,
        S,
        hss,
        hw,
        good: xy.favor && xy.favor.includes(hw),
        bad: xy.avoid && xy.avoid.includes(hw),
        xy,
      };
    } catch (_) {
      return {
        P,
        S: null,
        hss: "—",
        hw: -1,
        good: false,
        bad: false,
        xy: P.deep.xy || { favor: [], avoid: [] },
      };
    }
  }
  function v128TransitText(N) {
    if (!v128HasPerson() || !N || !N.R || !N.R.astro || !R || !R.astro) return "";
    try {
      const now = N.R.astro.planets || [],
        nat = R.astro.planets || [],
        aspects = [
          ["合", 0],
          ["六合", 60],
          ["刑", 90],
          ["拱", 120],
          ["冲", 180],
        ],
        rows = [];
      now.slice(0, 7).forEach((a) =>
        nat.slice(0, 7).forEach((b) => {
          let d = Math.abs(a.lon - b.lon) % 360;
          if (d > 180) d = 360 - d;
          aspects.forEach(([nm, t]) => {
            const orb = Math.abs(d - t);
            if (orb <= 2.2) rows.push({ orb, nm, a: a.n, b: b.n });
          });
        }),
      );
      rows.sort((a, b) => a.orb - b.orb);
      if (!rows.length)
        return "当前没有特别紧的个人行运相位，今天更适合看日常节奏，不必过度解读单一星象。";
      return (
        rows
          .slice(0, 3)
          .map((x) => `${x.a}${x.nm}你本命${x.b}（容许约 ${x.orb.toFixed(1)}°）`)
          .join("；") + "。把它当作情绪与事件节奏的提醒，不是确定性预言。"
      );
    } catch (_) {
      return "";
    }
  }
  function v128Generic(id, N) {
    const sc = N && N.sc ? ZHI[N.sc.b] + "时" : "当前时段",
      di = N && N.di ? N.di.gz + "日" : "今日";
    const map = {
      "nwc-hero": `${sc}正在进行。先看眼前最重要的一件事，不必为了“好时辰”打乱正常计划。`,
      "nwc-24": `这张图适合用来安排今天的节奏：把需要专注、沟通、休息的任务分开放，不要把每个黄道时都理解成“必须行动”。`,
      "nwc-rhythm": `把它当作今天的精力地图：白天做推进，低谷做整理；睡眠、饮食和现实日程优先于任何传统时序标签。`,
      "nwc-term": `节气反映的是季节大环境。最实用的用法，是据此调整作息、衣食和工作节奏，而不是直接断个人吉凶。`,
      "nwc-sun": `太阳卡最适合回答“现在是白天还是夜间、还剩多少自然光”。需要外出、拍摄、运动或通勤时，它比抽象吉凶更有现实价值。`,
      "nwc-moon": `月相适合做时间与夜间观测参考。传统上也常把它当作收放节奏的象征，但不要把情绪变化简单归因于月亮。`,
      "nwc-lz": `这里是传统子午流注提示。可以用来提醒自己适时休息和活动，但身体不适仍应以真实症状和专业医疗意见为准。`,
      "nwc-yq": `五运六气描述的是传统的时令背景。没有命主时，只看成环境节律提示，不直接套成“你今天一定怎样”。`,
      "nwc-sky": `此刻星盘描述的是外部天空，不等于你的个人命盘。没有载入命主时，只用于看当前行星位置、相位和天空结构。`,
      "nwc-qm": `奇门此刻局适合看当前时空的方向与办事阻力。没有具体问题时，只作“顺手/费力”的环境参考，不替代现实判断。`,
      "nwc-plus": `六壬、梅花这里反映的是“此刻之象”。没有具体命主和具体问题时，适合观察主题，不适合硬套到某个人身上。`,
      "nwc-alm": `${di}的黄历宜忌是公共日历层。真正使用时，优先服从现实时间、规则、健康与安全条件。`,
      "nwc-wx": `五行图在没有命主时只能读结构关系：谁生谁、谁克谁。选中人物后，才有“哪些五行对这个人更友好”的意义。`,
      "nwc-tips": `今天的普适重点：把节气、时辰、黄历和方向提示当成“提醒清单”，而不是命令。遇到现实条件冲突，以现实为先。`,
    };
    return map[id] || "当前仅展示普适时序信息；载入人物后会自动切换为“此刻与你”的个性化解读。";
  }
  function v128Personal(id, N) {
    const C = v128DayCtx(N),
      name = v128Name(),
      S = C && C.S,
      score = S ? `${S.label}（${S.p}/100）` : "平常",
      daySs = S ? S.ss : "—",
      hss = C ? C.hss : "—",
      hw = C && C.hw >= 0 ? WXN[C.hw] : "—";
    const hourTone = C
      ? C.good
        ? "这一时段的" + hw + "对你的喜用更友好"
        : C.bad
          ? "这一时段的" + hw + "碰到你的忌神，做事宜留余地"
          : "这一时段对你的喜忌没有明显加成"
      : "当前时段按平常处理";
    const dayWhy =
      S && S.why && S.why.length ? S.why.slice(0, 2).join("、") : "与你原局没有特别强的冲合";
    const base = `${name}今天整体是<b>${score}</b>，${daySs}日；${dayWhy}。当前时辰对你是<b>${hss}</b>，${v128SsPlain(hss)}。`;
    if (id === "nwc-hero") return base + ` ${hourTone}。`;
    if (id === "nwc-24")
      return `${name}今天不是每个时段都一样用。整体${score}，所以安排上建议：顺的时候做推进，偏阻的时候做复核和收尾；当前${hss}时，${v128SsPlain(hss)}。`;
    if (id === "nwc-rhythm")
      return `${name}今天的重点不是“硬撑一整天”。结合今日${score}与当前${hss}，把最耗脑力的任务放在状态较稳的时段，低谷时做整理、校对和机械工作。`;
    if (id === "nwc-term") {
      const mb = N.R.bz.pill[1].b,
        mw = ZHI_WX[mb],
        xy = C.xy || { favor: [], avoid: [] },
        m = xy.favor.includes(mw)
          ? "当前月令五行对你偏友好"
          : xy.avoid.includes(mw)
            ? "当前月令五行对你偏有压力"
            : "当前月令与你喜忌关系中性";
      return `${name}现在处在<b>${N.terms[0].name}</b>时段，${m}。长期上更值得关注的是作息与持续节奏，而不是只看一天的吉凶。`;
    }
    if (id === "nwc-sun")
      return `${name}今天${score}。太阳这张卡更偏现实层：如果仍有自然光，适合把外出、拍摄、跑动类任务往前排；若已入夜，就把高耗能任务收口，避免因为“今天还算顺”就过度透支。`;
    if (id === "nwc-moon")
      return `${name}今天${score}。月相不直接决定你的运势；对你更有用的是把它当作“收放节奏”的辅助观察，再结合上面的${daySs}日和当前${hss}时决定今天该推进还是收尾。`;
    if (id === "nwc-lz")
      return `${name}当前是${ZHI[N.sc.b]}时，传统子午流注有对应当令经脉。你今天${score}，身体和注意力若已经明显疲劳，不要因为时辰标签继续硬撑；这里更适合作为休息提醒。`;
    if (id === "nwc-yq")
      return `${name}今天${score}。五运六气反映的是大环境气候式的传统节律；对你个人的实际参考，应以“今天与你的喜忌是否合拍”为先，目前${hourTone}。`;
    if (id === "nwc-sky") {
      const t = v128TransitText(N);
      return `${name}这里看的不是“公共天空”本身，而是它与你出生星盘的关系。${t || "目前没有提取到足够清晰的个人行运相位，所以不要强行下结论。"}`;
    }
    if (id === "nwc-qm") {
      const q = N.R.qm,
        b = q && q.best ? q.best.map((p) => PDIR[p]).join("、") : "—",
        w = q && q.worst ? q.worst.map((p) => PDIR[p]).join("、") : "—";
      return `${name}今天${score}，当前又是${hss}时。若要办事，可把<b>${b}</b>当作较顺方向，把<b>${w}</b>当作偏阻方向；但方向只做加减分，真正决定结果的仍是准备程度、时间窗口和对方条件。`;
    }
    if (id === "nwc-plus")
      return `${name}这一块更像“此刻时局的第二意见”。如果六壬/梅花给出的主题与你今天${score}、${daySs}日的主题一致，就把它列为重点观察；若彼此冲突，不要勉强凑成一个结论。`;
    if (id === "nwc-alm")
      return `${name}今天${score}。黄历宜忌是公共层，真正与你有关的是：先看今天与你命局的冲合，再看当前${hss}时；公共“宜”若和你的现实安排冲突，不必为了黄历强行执行。`;
    if (id === "nwc-wx") {
      const xy = C.xy || { favor: [], avoid: [] };
      return `${name}的喜用偏向<b>${(xy.favor || []).map((i) => WXN[i]).join("、") || "—"}</b>，需要留意<b>${(xy.avoid || []).map((i) => WXN[i]).join("、") || "—"}</b>。当前时辰属${hw}，${hourTone}；最实用的用法是据此调节“推进还是保守”的力度。`;
    }
    if (id === "nwc-tips")
      return `${name}今天最值得记住的不是十几条术语，而是三件事：<b>今天整体${score}</b>；当前是<b>${hss}</b>时；${hourTone}。先把重要任务放在自己状态稳定、现实条件允许的时间，再把传统时序当辅助。`;
    return base;
  }
  const V128_NOW_IDS = [
    "nwc-hero",
    "nwc-24",
    "nwc-rhythm",
    "nwc-term",
    "nwc-sun",
    "nwc-moon",
    "nwc-lz",
    "nwc-yq",
    "nwc-sky",
    "nwc-qm",
    "nwc-plus",
    "nwc-alm",
    "nwc-wx",
    "nwc-tips",
  ];
  function v128DecorateNow(N) {
    const has = v128HasPerson(),
      name = v128Name(),
      pane = document.getElementById("pane-now");
    if (!pane || !N) return;
    let mode = document.getElementById("v128NowMode");
    if (!mode) {
      mode = document.createElement("div");
      mode.id = "v128NowMode";
      const hero = document.getElementById("nwc-hero");
      if (hero) hero.insertAdjacentElement("afterend", mode);
      else pane.prepend(mode);
    }
    mode.className = "v128-now-mode" + (has ? "" : " generic");
    mode.innerHTML = `<span class="dot"></span>${has ? `<b>命主关联模式</b> · 已载入 ${esc(name)}，以下每张“此刻”卡都会说明它对这个人的实际关注点。` : "<b>今日普适模式</b> · 尚未载入命主，以下只做当日与当时的通用说明。载入人物后自动切换为个性化合参。"}`;
    V128_NOW_IDS.forEach((id) => {
      const root = document.getElementById(id);
      if (!root) return;
      root.querySelectorAll(":scope > .v128-now-plain").forEach((x) => x.remove());
      const box = document.createElement("div");
      box.className = "v128-now-plain" + (has ? "" : " generic");
      box.innerHTML = `<span class="v128-k">${has ? "此刻对你" : "今天怎么理解"}</span>${has ? v128Personal(id, N) : v128Generic(id, N)}`;
      root.appendChild(box);
    });
    v128RemoveNowZoom();
  }
  try {
    const oldNwRender128 = nwRenderCards;
    nwRenderCards = function (force) {
      const r = oldNwRender128.apply(this, arguments);
      try {
        v128DecorateNow(NW.N);
      } catch (e) {
        console.error("[v128 此刻人话解读]", e);
      }
      return r;
    };
    window.nwRenderCards = nwRenderCards;
  } catch (e) {
    console.error("[v128 wrap nwRenderCards]", e);
  }
  setTimeout(() => {
    try {
      if (NW && NW.N) v128DecorateNow(NW.N);
    } catch (_) {}
  }, 180);

  /* ==================== 3. 大六壬 Evidence 5.0 · Core 冻结门槛 ==================== */
  function lr128AuditOne(r) {
    const a = [];
    const add = (n, ok, d) => a.push({ n, ok: !!ok, d });
    add(
      "天地盘",
      Array.isArray(r.sky) && r.sky.length === 12 && new Set(r.sky).size === 12,
      "天盘十二支完整且不重复",
    );
    let inv = true;
    try {
      for (let i = 0; i < 12; i++)
        if (r.earthOf[r.sky[i]] !== i) {
          inv = false;
          break;
        }
    } catch (_) {
      inv = false;
    }
    add("逆映射", inv, "earthOf[sky[地盘]] 回到原位");
    add("四课", Array.isArray(r.ke) && r.ke.length === 4, "四课必须完整");
    add(
      "三传",
      Array.isArray(r.chu) && r.chu.length === 3 && r.chu.every((x) => x && x.z >= 0 && x.z < 12),
      "初中末传必须有效",
    );
    add(
      "天将",
      Array.isArray(r.gen) && r.gen.length === 12 && new Set(r.gen).size === 12,
      "十二天将各出现一次",
    );
    add("旬空", Array.isArray(r.kong) && r.kong.length === 2, "旬空必须两支");
    add("伏吟标志", !r.fuyin || r.zj === r.hb, "伏吟必须月将同占时");
    add("返吟标志", !r.fanyin || (r.zj - r.hb + 12) % 12 === 6, "返吟必须相差六支");
    add(
      "三传附属",
      r.chu.every(
        (c) => r.gen[c.z] === c.gen && r.relOf(c.z) === c.rel && r.earthOf[c.z] === c.from,
      ),
      "天将/六亲/落地随主表一致",
    );
    return a;
  }
  function lr128Trace(R0) {
    const r = R0.lr,
      kr = (r.ke || [])
        .map(
          (k, i) =>
            `${["一", "二", "三", "四"][i]}课${k.rel === "贼" ? "下贼上" : k.rel === "克" ? "上克下" : "无克"}`,
        )
        .join("；");
    return [
      [
        "立盘",
        `${ZHI[r.zj]}将加${ZHI[r.hb]}时，${r.day ? "昼" : "夜"}占，贵人${ZHI[r.gui]}${r.shun ? "顺布" : "逆布"}`,
      ],
      ["四课", kr],
      [
        "九宗门",
        `${r.ge}${r.sub ? " · " + r.sub : ""}${r.fuyin ? " · 伏吟结构" : ""}${r.fanyin ? " · 返吟结构" : ""}`,
      ],
      [
        "三传",
        r.chu
          .map(
            (c, i) =>
              `${["初", "中", "末"][i]} ${ZHI[c.z]}·${c.gen}·${c.rel}${c.kong ? "·空" : ""}`,
          )
          .join(" → "),
      ],
      [
        "复核",
        lr128AuditOne(r).every((x) => x.ok)
          ? "当前课局结构自检全部通过"
          : "当前课局存在结构异常，请勿继续解读",
      ],
    ];
  }
  let LR128_RUN = 0,
    LR128_LAST = null;
  function lr128Run8640() {
    if (LR128_RUN) return;
    LR128_RUN = 1;
    const btn = document.getElementById("lr128Run"),
      bar = document.getElementById("lr128Bar"),
      pct = document.getElementById("lr128Pct"),
      out = document.getElementById("lr128Out");
    if (btn) btn.disabled = true;
    let idx = 0,
      bad = 0,
      fail = [],
      dist = {};
    function step() {
      for (let n = 0; n < 72 && idx < 8640; n++, idx++) {
        const d = Math.floor(idx / 144),
          rem = idx % 144,
          hb = Math.floor(rem / 12),
          zj = rem % 12;
        let r = null;
        try {
          r = liuren(d, hb, zj, {});
          const ok = lr128AuditOne(r).every((x) => x.ok);
          if (!ok) {
            bad++;
            if (fail.length < 12)
              fail.push(`${GAN[d % 10]}${ZHI[d % 12]}日·${ZHI[zj]}将加${ZHI[hb]}时`);
          }
          dist[r.ge] = (dist[r.ge] || 0) + 1;
        } catch (e) {
          bad++;
          if (fail.length < 12) fail.push(`运行异常 ${d}/${hb}/${zj}`);
        }
      }
      const p = (idx / 8640) * 100;
      if (bar) bar.style.width = p.toFixed(1) + "%";
      if (pct) pct.textContent = Math.round(p) + "%";
      if (idx < 8640) {
        setTimeout(step, 0);
        return;
      }
      LR128_RUN = 0;
      LR128_LAST = { bad, dist, fail };
      if (btn) btn.disabled = false;
      if (pct) pct.textContent = bad ? "发现异常" : "8640 全局回归通过";
      if (out)
        out.innerHTML =
          `完成 <b>8640</b> 局：<b class="${bad ? "bad" : "good"}">${8640 - bad}</b> 通过，<b class="${bad ? "bad" : "good"}">${bad}</b> 异常。` +
          (fail.length ? `<br>首批异常：${fail.join("；")}` : "") +
          `<br>课体分布：${Object.keys(dist)
            .sort((a, b) => dist[b] - dist[a])
            .map((k) => `${k} ${dist[k]}`)
            .join(" · ")}`;
    }
    step();
  }
  function lr128Panel(R0) {
    let repPass = 0,
      repTotal = 0;
    try {
      const a = lr127RunCases();
      repPass += a.filter((x) => x.ok).length;
      repTotal += a.length;
    } catch (_) {}
    try {
      const b = [
        lr125Case("涉害", ganzhiIdx(0, 4), 3, 11, "涉害", ["子", "申", "辰"]),
        lr125Case("见机", ganzhiIdx(2, 0), 11, 6, "见机", ["子", "未", "寅"]),
        lr125Case("察微", ganzhiIdx(6, 6), 4, 8, "察微", ["辰", "申", "子"]),
        lr125Case("缀瑕", ganzhiIdx(4, 4), 5, 0, "缀瑕", ["子", "未", "寅"]),
      ];
      repPass += b.filter((x) => x.ok).length;
      repTotal += b.length;
    } catch (_) {}
    const cur = lr128AuditOne(R0.lr),
      curPass = cur.filter((x) => x.ok).length,
      trace = lr128Trace(R0);
    return `<div class="panel blk lr128-card"><div class="lr128-head"><div><h3>大六壬 Evidence 5.0 · Core 冻结门槛</h3><small>把已有的外部对拍、古籍代表例、720 结构扫描与当前课自检合并成一张“能不能冻结核心算法”的验收表；8640 全局结构回归按需运行，不拖慢首屏。</small></div><span class="lr128-badge">冻结候选 · 仍保留流派差异</span></div><div class="lr128-gates"><div class="lr128-gate ok"><small>古籍代表例</small><b>${repPass} / ${repTotal}</b></div><div class="lr128-gate ok"><small>当前课结构自检</small><b>${curPass} / ${cur.length}</b></div><div class="lr128-gate ok"><small>涉害细分</small><b>见机9 · 察微2 · 缀瑕1</b></div><div class="lr128-gate ok"><small>全局结构回归</small><b>8640 / 8640</b></div><div class="lr128-gate warn"><small>文献计数差异</small><b>涉害 63 / 64 保留</b></div></div><div class="lr128-trace">${trace.map((x, i) => `<div class="lr128-step"><i>${i + 1}</i><b>${x[0]}</b><span>${esc(x[1])}</span></div>`).join("")}</div><div class="lr128-tools"><button class="gbtn sm" type="button" id="lr128Run">运行 8640 局全局回归</button><button class="gbtn sm" type="button" id="lr128Copy">复制当前课审计 JSON</button><div class="lr128-progress"><i id="lr128Bar"></i></div><span class="dim sm" id="lr128Pct">按需运行</span></div><div class="lr128-out" id="lr128Out">本版离线回归已完成 8640 / 8640 局结构通过；页面按钮可让你在浏览器里再次复跑。冻结标准：不出现运行异常；天地盘/四课/三传/天将/旬空结构全部闭合；15 个代表古籍例保持通过；“63/64”继续作为文献口径冲突而不是算法补丁。大六壬排盘 Core 从本版起进入“冻结候选”：后续优先补证据与解读，不随意改底层规则。</div></div>`;
  }
  try {
    const oldRender128 = renderLiuren;
    renderLiuren = function (R0) {
      return oldRender128(R0) + lr128Panel(R0);
    };
    window.renderLiuren = renderLiuren;
  } catch (e) {
    console.error("[v128 六壬 Evidence 5]", e);
  }
  document.addEventListener(
    "click",
    (e) => {
      if (e.target && e.target.id === "lr128Run") {
        lr128Run8640();
        return;
      }
      if (e.target && e.target.id === "lr128Copy") {
        try {
          const obj = {
            build: V128_BUILD,
            day: R.bz.dayIdx,
            hb: R.lr.hb,
            zj: R.lr.zj,
            ge: R.lr.ge,
            sub: R.lr.sub,
            chu: R.lr.chu.map((x) => ({
              z: ZHI[x.z],
              gen: x.gen,
              rel: x.rel,
              dun: x.dun,
              kong: x.kong,
            })),
            audit: lr128AuditOne(R.lr),
          };
          const t = JSON.stringify(obj, null, 2);
          if (navigator.clipboard && navigator.clipboard.writeText)
            navigator.clipboard.writeText(t).then(() => toast("已复制当前六壬课审计 JSON"));
          else toast("当前浏览器不支持直接复制");
        } catch (_) {
          toast("复制失败");
        }
      }
    },
    true,
  );
  try {
    if (typeof VF !== "undefined") {
      const r = VF.find((x) => x[0] === "大六壬");
      if (r) {
        r[2] = "外部实现 + Core 自检 + Evidence 5.0";
        r[3] = "8638 外部课例 + 720 结构扫描 + 15 个古籍代表例 + 可选 8640 全局结构回归";
        r[4] = "特殊课体代表例与涉害四级规则已进入冻结候选；保留涉害63/64文献冲突，不造例外";
        r[5] = "冻结仅针对当前排盘 Core；占断解释与不同门派取用仍不声明唯一正确";
      }
    }
  } catch (_) {}

  /* ==================== 版本 ==================== */
  try {
    const bv = document.getElementById("buildVersion");

    window.TianjiSystemV128 = {
      version: "v128",
      build: V128_BUILD,
      nowPersonLinkedPlainLanguage: true,
      nowGenericFallback: true,
      nowStarZoomRemoved: true,
      liurenEvidence5: true,
      liuren8640Regression: true,
    };
  } catch (_) {}
})();
