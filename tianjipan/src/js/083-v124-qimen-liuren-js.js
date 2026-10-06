(function () {
  "use strict";
  const V124_BUILD = "v124 · 2026-10-04 20:45 +08:00";
  /* ========================= 奇门 · 普通人一键推演 ========================= */
  const QM124_K = "tianjipan.qimen.easy.v124";
  let QM124 = { mode: "easy", question: "", time: "now", topicManual: false };
  try {
    const s = JSON.parse(localStorage.getItem(QM124_K) || "null");
    if (s && typeof s === "object") QM124 = Object.assign(QM124, s);
  } catch (_) {}
  function qm124Save() {
    try {
      localStorage.setItem(QM124_K, JSON.stringify(QM124));
    } catch (_) {}
  }
  window.TianjiQimenQuestion = Object.freeze({
    set: (ctx) => {
      QM124.question = String(ctx.question || "");
      if (QM_TOPICS[ctx.topic]) {
        qmTopic = ctx.topic;
        QM124.topicManual = true;
      } else QM124.topicManual = false;
      qm124Save();
    },
    get: () => ({ question: QM124.question, topic: qmTopic, manual: QM124.topicManual }),
  });
  const QM124_KEYS = {
    求财: /财|钱|收入|生意|销售|订单|投资|回款|赚钱|客户付款|利润|副业/,
    事业: /工作|事业|升职|晋升|离职|跳槽|换工作|岗位|职位|求职|面试|公司/,
    感情: /感情|恋爱|婚姻|对象|复合|分手|相亲|喜欢|伴侣|桃花/,
    健康: /健康|身体|疾病|生病|病情|治疗|手术|康复|不舒服|医院/,
    出行: /出行|旅行|旅游|出差|搬迁|搬家|远行|启程|回家|航班/,
    学业: /考试|学习|升学|考研|考公|成绩|论文|答辩|录取|学校/,
    官司: /官司|诉讼|起诉|仲裁|纠纷|法院|律师|维权|争议/,
    合作: /合作|合同|签约|项目|合伙|谈判|甲方|乙方|供应商/,
    置业: /买房|卖房|房子|房产|置业|看房|租房|店面|土地/,
  };
  function qm124Detect(s) {
    s = String(s || "").trim();
    if (!s) return qmTopic || "求财";
    for (const k of Object.keys(QM124_KEYS)) if (QM124_KEYS[k].test(s)) return k;
    return qmTopic || "求财";
  }
  function qm124Summary(R0) {
    if (!R0 || !R0.qm) return "";
    const routed = window.TianjiQuestionRouter?.classify?.(QM124.question);
    if (["寻人", "寻物"].includes(routed?.consensusTopic))
      return '<div class="qm124-result">当前未取到该层结果：寻人/寻物专门断法未接入。下方原有问事分析使用其所选类别，不作为本题答案；请查看统一报告的来源与缺失说明。</div>';
    let a;
    try {
      a = qimenAsk(R0, qmTopic);
    } catch (_) {
      return "";
    }
    const q = R0.qm,
      v = a.verdict || ["中平", "mid"];
    const dayYi = qmDayYi(R0),
      hourYi = qmHourYi(R0),
      ps = qmHeavenPal(q, dayYi),
      pe = qmHeavenPal(q, hourYi);
    const self = ps ? `${PNAME[ps]}${PNUM[ps]}宫 · ${PDIR[ps]}` : "未定位",
      ev = pe ? `${PNAME[pe]}${PNUM[pe]}宫 · ${PDIR[pe]}` : "未定位";
    const first = (a.summary && a.summary[0] && a.summary[0].text) || "";
    const flags = [
      q.fuyin ? "伏吟：宜稳、忌催逼" : "",
      q.fanyin ? "反吟：易反复，宜准备备选方案" : "",
      q.wubuyu ? "五不遇时：传统上宜另择时" : "",
    ].filter(Boolean);
    const dirs =
      (q.best || [])
        .slice(0, 2)
        .map((p) => `${PDIR[p]}（${q.cells[p].door}门）`)
        .join("、") || "无特别突出方向";
    return `<div class="qm124-result" id="qm124Result"><div class="qm124-verdict ${v[1] || "mid"}"><small>${qmTopic} · 综合倾向</small><b>${v[0]}</b><span>结构分 ${Number(a.score || 0).toFixed(1)} · 不是吉凶定论</span></div><div class="qm124-sum"><p>${QM124.question ? `你问：<b>${esc(QM124.question)}</b><br>` : ""}${esc(first)}</p><p><b>你（日干）</b>在 ${self}；<b>事情（时干）</b>在 ${ev}。普通使用先看这两个位置，再看所问事项的用神。</p><p><b>较顺方向：</b>${dirs}。${flags.length ? `<br><b>本局提醒：</b>${flags.join("；")}。` : ""}</p></div></div>`;
  }
  function qm124Hero(R0) {
    const det = qm124Detect(QM124.question),
      cur = QM124.topicManual ? qmTopic || det : det;
    return `<div class="panel blk qm124-hero"><div class="qm124-title"><div><h2>奇门遁甲 · 一键问事</h2><p>普通模式只需要三步：选你要问什么 → 写一句具体问题 → 点“一键排盘 · 启动推演”。系统仍使用下面同一套奇门 Core，只是把专业参数收进进阶区。</p></div><div class="qm124-mode"><button type="button" data-qm124-mode="easy" class="${QM124.mode !== "pro" ? "on" : ""}">普通模式</button><button type="button" data-qm124-mode="pro" class="${QM124.mode === "pro" ? "on" : ""}">专业模式</button></div></div>
 <div class="qm124-steps"><section class="qm124-step"><small>① 你要问什么</small><div class="qm124-topics">${Object.keys(
   QM_TOPICS,
 )
   .map(
     (k) =>
       `<button type="button" data-qm124-topic="${k}" class="${k === cur ? "on" : ""}">${QM_TOPICS[k].icon || ""} ${k}</button>`,
   )
   .join("")}</div><p>不知道选哪个也没关系，写完问题后会按关键词自动建议类别。</p></section>
 <section class="qm124-step"><small>② 把问题说具体</small><textarea id="qm124Question" class="qm124-q" placeholder="例如：我现在换工作是否合适？这笔合作下周能不能推进？">${esc(QM124.question || "")}</textarea><div class="qm124-detect" id="qm124Detect">自动识别建议：<b>${det}</b>（只是帮你选择取用类别，不改变排盘算法）</div></section>
 <section class="qm124-step qm124-time"><small>③ 用哪个时刻起局</small><label><input type="radio" name="qm124Time" value="now"${QM124.time !== "input" ? " checked" : ""}> 此刻问事（推荐）</label><label><input type="radio" name="qm124Time" value="input"${QM124.time === "input" ? " checked" : ""}> 使用顶部输入时间</label><p>奇门问事通常以起念 / 问事时刻起局；研究历史事件时可使用指定时间。</p></section></div>
 <div class="qm124-run"><button type="button" class="main" id="qm124Run">一键排盘 · 启动推演</button><span class="sub">会自动：确定起局时间 → 排盘 → 选择问事类别 → 生成重点解读 → 高亮本局结构。</span></div>${qm124Summary(R0)}
 <details class="qm124-guide"><summary>第一次用奇门？先看这 5 个东西就够了</summary><div class="qm124-guide-grid"><div><b>日干 = 你</b>先找“我”落在哪一宫，看自己的状态和力量。</div><div><b>时干 = 事情</b>代表所问事情本身或对方，和日干宫比较。</div><div><b>八门 = 事情怎么发生</b>开、休、生多用于通达、生发；其余门要结合事项，不简单等于好坏。</div><div><b>值符 / 值使</b>值符看主导力量、贵人；值使看事情推进的门路。</div><div><b>用神 = 你问的重点</b>求财看生门等，事业看开门，感情、健康、考试会换不同参照。</div></div></details></div>`;
  }
  const QM124_OLD_RENDER = renderQimen;
  renderQimen = function (R0) {
    let body = QM124_OLD_RENDER(R0);
    /* 把专业口径收进可展开区域；专业模式默认展开 */
    const rx =
      /<div class="panel blk"><div class="tjq112-policy" id="tjq112Policy">[\s\S]*?日盘\/月盘\/年盘尚未在本版开启。<\/p><\/div>/;
    body = body.replace(
      rx,
      (m) =>
        `<details class="qm124-advanced"${QM124.mode === "pro" ? " open" : ""}><summary>专业排盘口径 · 盘式 / 定局 / 八神 / 马星（普通用户可不改）</summary>${m}</details>`,
    );
    body = body.replace(
      /<p class="note">评分只是把星、门、格局、空亡、门迫做机械加减[\s\S]*?<\/p>\s*$/,
      (m) =>
        `<details class="qm124-tech"${QM124.mode === "pro" ? " open" : ""}><summary>算法、评分与流派说明</summary>${m}</details>`,
    );
    return qm124Hero(R0) + body;
  };
  try {
    window.renderQimen = renderQimen;
  } catch (_) {}
  async function qm124Run() {
    if (typeof running !== "undefined" && running) {
      toast("当前正在推演，请稍候");
      return;
    }
    const ta = document.getElementById("qm124Question");
    if (ta) QM124.question = ta.value.trim();
    const suggested = qm124Detect(QM124.question);
    if (!QM124.topicManual && QM124.question && suggested) qmTopic = suggested;
    QM124.time =
      (document.querySelector('input[name="qm124Time"]:checked') || {}).value || QM124.time;
    qm124Save();
    const b = document.getElementById("qm124Run");
    if (b) {
      b.disabled = true;
      b.textContent = "正在起局推演…";
    }
    try {
      STU.pendingSource = "奇门遁甲一键问事";
      if (QM124.time === "now") await startDerive("qimen");
      else {
        const c = parseDt() || nowBJ();
        setLive(false);
        await deduce(c, "full");
      }
      /* deduce 会重建 DOM；保证仍停留奇门并把问题类别应用到新页面 */
      try {
        selectTab("qimen", false);
      } catch (_) {}
      setTimeout(() => {
        try {
          const p = document.getElementById("pane-qimen");
          if (p) {
            p.classList.toggle("qm124-easy", QM124.mode !== "pro");
            const r = document.getElementById("qm124Result");
            if (r) r.scrollIntoView({ behavior: REDUCE ? "auto" : "smooth", block: "center" });
          }
          if (typeof bindReadings === "function") bindReadings();
          if (typeof dvDecorate === "function") dvDecorate();
        } catch (_) {}
      }, 80);
    } catch (e) {
      console.error(e);
      toast("奇门推演失败：" + ((e && e.message) || e));
    } finally {
      const x = document.getElementById("qm124Run");
      if (x) {
        x.disabled = false;
        x.textContent = "一键排盘 · 启动推演";
      }
    }
  }
  function qm124ApplyMode() {
    const p = document.getElementById("pane-qimen");
    if (p) p.classList.toggle("qm124-easy", QM124.mode !== "pro");
  }
  document.addEventListener("input", (e) => {
    if (e.target && e.target.id === "qm124Question") {
      QM124.question = e.target.value;
      qm124Save();
      const d = document.getElementById("qm124Detect");
      if (d)
        d.innerHTML = `自动识别建议：<b>${qm124Detect(QM124.question)}</b>（只是帮你选择取用类别，不改变排盘算法）`;
    }
  });
  document.addEventListener("change", (e) => {
    if (e.target && e.target.name === "qm124Time") {
      QM124.time = e.target.value;
      qm124Save();
    }
  });
  document.addEventListener("click", (e) => {
    const t =
      e.target && e.target.closest
        ? e.target.closest("[data-qm124-mode],[data-qm124-topic],#qm124Run")
        : null;
    if (!t) return;
    if (t.dataset.qm124Mode) {
      QM124.mode = t.dataset.qm124Mode;
      qm124Save();
      try {
        refRender("qimen");
        setTimeout(() => {
          qm124ApplyMode();
          dvDecorate();
          bindReadings();
        }, 0);
      } catch (_) {}
      return;
    }
    if (t.dataset.qm124Topic) {
      qmTopic = t.dataset.qm124Topic;
      QM124.topicManual = true;
      QM124.question = (document.getElementById("qm124Question") || {}).value || QM124.question;
      qm124Save();
      try {
        refRender("qimen");
        setTimeout(() => {
          qm124ApplyMode();
          dvDecorate();
          bindReadings();
        }, 0);
      } catch (_) {}
      return;
    }
    if (t.id === "qm124Run") qm124Run();
  });
  const QM124_OLD_REF_BIND = REF_BIND.qimen;
  REF_BIND.qimen = () => {
    try {
      if (QM124_OLD_REF_BIND) QM124_OLD_REF_BIND();
    } catch (_) {}
    try {
      bindReadings();
    } catch (_) {}
    try {
      dvDecorate();
    } catch (_) {}
    qm124ApplyMode();
  };

  /* ========================= 大六壬 · Evidence 1.0 ========================= */
  const LR124_SRC = {
    ling: "https://libokang.com/guji/liuren/%E5%A4%A7%E5%85%AD%E5%A3%AC%E7%81%B5%E8%A7%89%E7%BB%8F/",
    xun: "https://libokang.com/guji/liuren/%E5%A4%A7%E5%85%AD%E5%A3%AC%E5%AF%BB%E6%BA%90%E5%8D%B7%E4%B8%80/2/",
    tan: "https://orasage.com/zh-CN/daozang/docs/zh-cn/5_5_3",
  };
  function lr124Evidence(R0) {
    const g = R0 && R0.lr ? R0.lr.ge : "—",
      sub = R0 && R0.lr ? R0.lr.sub || "" : "";
    return `<div class="panel blk lr124-ev"><div class="lr124-head"><div><h3>大六壬 Evidence · 古籍规则核对</h3><p>把“程序能跑”与“古法有据”分开。v124 先核九宗门骨架与几类可量化特殊课体；涉害细分、伏吟杜传、返吟有克等继续列为待逐例校验。</p></div><span class="lr124-badge">当前课：${esc(g)}${sub ? " · " + esc(sub) : ""}</span></div><div class="lr124-grid">
 <section class="lr124-card"><h4>九宗门总纲</h4><p>《大六壬灵觉经》明确列贼克、比用、涉害、遥克、昴星、八专、别责、伏吟、返吟。当前 Core 已覆盖这九类分支入口。</p><span class="state ok">骨架已对照</span></section>
 <section class="lr124-card"><h4>别责 / 八专</h4><p>《大六壬寻源》给出刚柔日的别责、八专取用规则。v123 已校正阴日别责；阳日别责与八专继续做代表课例核验。</p><span class="state part">规则已录 · 例课继续核</span></section>
 <section class="lr124-card"><h4>伏吟 / 返吟</h4><p>古法把月将加本时视为伏吟，加冲位视为返吟。返吟“有克照克、无克取驿马”的层级必须与课名显示分开看。</p><span class="state part">结构条件可量化</span></section>
 <section class="lr124-card"><h4>涉害细分</h4><p>《大六壬探原》进一步区分涉害、见机、察微、缀瑕，并列出经典课数。当前程序已有涉害深浅与孟仲季解释，但尚未把全部细分课名逐例对齐。</p><span class="state part">重点未完项</span></section></div>
 <div class="lr124-src">来源：<a href="${LR124_SRC.ling}" target="_blank" rel="noopener">《大六壬灵觉经》九宗门总纲</a> · <a href="${LR124_SRC.xun}" target="_blank" rel="noopener">《大六壬寻源》特殊取传</a> · <a href="${LR124_SRC.tan}" target="_blank" rel="noopener">《大六壬探原》720课与涉害细分</a>。网页来源用于规则核读，后续仍应与影印古籍/不同版本交叉核对。</div>
 <div class="lr124-run"><button type="button" class="gbtn sm" id="lr124Run">运行 Evidence 结构核对</button><span class="dim sm">检查古籍可量化的课数/结构条件，不把“结构通过”冒充完整占断正确。</span></div><div class="lr124-out" id="lr124Out">待运行：别责 9、八专 16、伏吟结构 60、返吟结构 60；并核对程序的伏吟/返吟标志是否覆盖对应结构。</div></div>`;
  }
  const LR124_OLD_RENDER = renderLiuren;
  renderLiuren = function (R0) {
    return LR124_OLD_RENDER(R0) + lr124Evidence(R0);
  };
  try {
    window.renderLiuren = renderLiuren;
  } catch (_) {}
  let LR124_BUSY = false;
  function lr124Run() {
    if (LR124_BUSY) return;
    LR124_BUSY = true;
    const b = document.getElementById("lr124Run"),
      o = document.getElementById("lr124Out");
    if (b) b.disabled = true;
    let idx = 0,
      st = { bieze: 0, bazhuan: 0, fuStruct: 0, fanStruct: 0, fuFlag: 0, fanFlag: 0, bad: 0 };
    function step() {
      for (let n = 0; n < 48 && idx < 720; n++, idx++) {
        const day = Math.floor(idx / 12),
          off = idx % 12;
        let r;
        try {
          r = liuren(day, 0, off, {});
        } catch (_) {
          st.bad++;
          continue;
        }
        if (r.ge === "别责") st.bieze++;
        if (r.ge === "八专") st.bazhuan++;
        if (off === 0) {
          st.fuStruct++;
          if (r.fuyin) st.fuFlag++;
        }
        if (off === 6) {
          st.fanStruct++;
          if (r.fanyin) st.fanFlag++;
        }
      }
      if (idx < 720) {
        if (o) o.textContent = `Evidence 核对 ${Math.round(idx / 7.2)}%…`;
        setTimeout(step, 0);
        return;
      }
      const rows = [
        ["别责课数", st.bieze, 9],
        ["八专课数", st.bazhuan, 16],
        ["伏吟结构", st.fuStruct, 60],
        ["伏吟标志", st.fuFlag, 60],
        ["返吟结构", st.fanStruct, 60],
        ["返吟标志", st.fanFlag, 60],
      ];
      if (o)
        o.innerHTML =
          rows
            .map(
              ([n, v, e]) =>
                `<b>${n}</b>：<span class="${v === e ? "ok" : "bad"}">${v}</span> / 古籍参照 ${e}${v === e ? " ✓" : " △"}`,
            )
            .join(" · ") +
          `<br><span class="mid">说明：</span>“返吟课名”不要求显示 60 次，因为有克返吟仍可按贼克/比用等立传；这里核的是返吟结构标志。涉害/见机/察微/缀瑕尚未纳入硬性通过条件。${st.bad ? ` 运行异常 ${st.bad}。` : ""}`;
      LR124_BUSY = false;
      if (b) b.disabled = false;
    }
    step();
  }
  document.addEventListener("click", (e) => {
    if (e.target && e.target.id === "lr124Run") lr124Run();
  });

  /* 版本 */
  try {
    const bv = document.getElementById("buildVersion");

    window.TianjiSystemV124 = {
      version: "v124",
      build: V124_BUILD,
      qimenEasyMode: true,
      qimenOneClick: true,
      qimenQuestionHelper: true,
      liurenEvidence: true,
    };
  } catch (_) {}
})();
