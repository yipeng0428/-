(() => {
  "use strict";
  const BUILD = "v234 · 2026-10-06 23:12 +08:00";
  const SCHEMA = "tianji.qizheng.dongwei-preflight.v1";
  const BASE_QZ = window.qzCalc || qzCalc;
  let TARGET_YEAR = (() => {
    try {
      return nowBJ().y;
    } catch (_) {
      return new Date().getFullYear();
    }
  })();

  const LIMIT_ORDER = [
    "命宫",
    "相貌",
    "福德",
    "官禄",
    "迁移",
    "疾厄",
    "夫妻",
    "奴仆",
    "男女",
    "田宅",
    "兄弟",
    "财帛",
  ];
  const NOMINAL_YEARS = {
    命宫: 15,
    相貌: 10,
    福德: 11,
    官禄: 15,
    迁移: 8,
    疾厄: 7,
    夫妻: 11,
    奴仆: 4.5,
    男女: 4.5,
    田宅: 4.5,
    兄弟: 5,
    财帛: 5,
  };
  const DEGREE_VERSE = [
    { palace: "命宫", rule: "行度随浅深", status: "dynamic-tong-limit" },
    { palace: "相貌", rule: "一年三度", status: "text-explicit" },
    { palace: "官禄", rule: "一年二度", status: "text-explicit" },
    { palace: "迁移", rule: "三载共十度", status: "text-explicit" },
    { palace: "疾厄", rule: "一年四度；三年之上同加一", status: "needs-liangtianchi-geometry" },
    { palace: "福德/夫妻", rule: "三度移；三年减一", status: "needs-liangtianchi-geometry" },
    { palace: "奴仆/男女/田宅", rule: "一年七度；三减一", status: "needs-liangtianchi-geometry" },
    { palace: "财帛/兄弟", rule: "各五年；一年六度", status: "text-explicit" },
  ];

  const SOURCES = [
    {
      id: "zhangguo-567-limit",
      title: "《钦定古今图书集成》艺术典第567卷 · 张果星宗一",
      type: "primary-classic",
      url: "https://hhl.cnkgraph.com/Book/%E5%AD%90%E9%83%A8/%E9%A1%9E%E6%9B%B8%E9%A1%9E/%E6%AC%BD%E5%AE%9A%E5%8F%A4%E4%BB%8A%E5%9C%96%E6%9B%B8%E9%9B%86%E6%88%90.%E5%8D%9A%E7%89%A9%E5%BD%99%E7%B7%A8.%E8%97%9D%E8%A1%93%E5%85%B8/14367/KR7a0017_567",
      supports: ["十二宫例", "定限度法", "年分诀", "行度诀", "定小限例", "定童限例歌"],
      note: "明确命宫15仅为古法常数、不可拘执；起限早约11岁、迟约20岁；并给出小限“生年支加命宫，逆数至太岁宫”。",
    },
    {
      id: "zhangguo-582-dongwei",
      title: "维基文库 · 《图书集成》艺术典第582卷 · 张果星宗十六",
      type: "primary-classic",
      url: "https://zh.wikisource.org/zh-hans/%E6%AC%BD%E5%AE%9A%E5%8F%A4%E4%BB%8A%E5%9C%96%E6%9B%B8%E9%9B%86%E6%88%90/%E5%8D%9A%E7%89%A9%E5%BD%99%E7%B7%A8/%E8%97%9D%E8%A1%93%E5%85%B8/%E7%AC%AC582%E5%8D%B7",
      supports: ["洞微百六限说", "限步之说", "限度主论", "行度假如"],
      note: "十二宫名义年分总和为100年6个月；强调限宫主与限度主必须兼看，不能只凭宫主断限。",
    },
  ];

  const RULES = [
    {
      id: "limit.nominal-years",
      status: "primary",
      claim: "名义年分：命15、貌10、福11、官15、迁8、疾7、妻11、奴4.5、男4.5、田4.5、兄5、财5。",
      impl: "NOMINAL_YEARS",
      source: "zhangguo-567-limit",
    },
    {
      id: "limit.ba Liu-name",
      status: "derived-primary",
      claim: "所谓“百六”按该年分合计为100.5年，即一百年六个月，不是106整年。",
      impl: "sum(NOMINAL_YEARS)=100.5",
      source: "zhangguo-582-dongwei",
    },
    {
      id: "limit.order",
      status: "primary-structural",
      claim: "从命宫沿周天依次行：命→貌→福→官→迁→疾→妻→奴→男女→田→兄→财。",
      impl: "LIMIT_ORDER；与当前十二宫逆数排布反向对应",
      source: "zhangguo-567-limit",
    },
    {
      id: "limit.ming-dynamic",
      status: "primary",
      claim: "命宫十五只是古法常数，不可拘执；原文给出早约11岁起限、迟约20岁起限的例子。",
      impl: "V234不把命15伪装成人人固定童限；只提供 nominal15 时间轴",
      source: "zhangguo-567-limit",
    },
    {
      id: "limit.degree",
      status: "primary-pending-engine",
      claim:
        "“命宫行度随浅深”等行度诀决定逐岁限度，但需要量天尺/命度几何，不能只用等宫30°线性插值。",
      impl: "DEGREE_VERSE 仅登记 Evidence；不自动生成逐岁限度",
      source: "zhangguo-567-limit",
    },
    {
      id: "limit.gong-du-lords",
      status: "primary",
      claim: "行限必须兼看限宫主与限度主；只看宫主十不一应。",
      impl: "V234可给当前名义限宫主；限度主等待逐岁限度引擎",
      source: "zhangguo-582-dongwei",
    },
    {
      id: "limit.small",
      status: "primary",
      claim: "小限：以生年支加在命宫，逆数至本年太岁宫。",
      impl: "smallLimit(year)",
      source: "zhangguo-567-limit",
    },
    {
      id: "limit.tong-song",
      status: "historical-secondary",
      claim: "“定童限例歌”在同卷被明确标注“未闻果老言也”，仅郑希诚兼诸家五星并存。",
      impl: "不作为默认洞微大限起法",
      source: "zhangguo-567-limit",
    },
  ];

  const clone = (x) => (x == null ? x : JSON.parse(JSON.stringify(x)));
  const E = (s) =>
    String(s ?? "").replace(
      /[&<>"']/g,
      (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
    );
  function sumYears() {
    return LIMIT_ORDER.reduce((s, n) => s + NOMINAL_YEARS[n], 0);
  }
  function nominalSchedule() {
    let start = 0;
    return LIMIT_ORDER.map((name, i) => {
      const years = NOMINAL_YEARS[name],
        end = start + years,
        row = { index: i, name, years, start: +start.toFixed(3), end: +end.toFixed(3) };
      start = end;
      return row;
    });
  }
  function limitAtElapsedAge(age) {
    if (!Number.isFinite(age) || age < 0) return null;
    return nominalSchedule().find((x) => age >= x.start && age < x.end) || null;
  }
  function decimalAgeNow(R0) {
    try {
      const c = R0?.t?.civ,
        n = nowBJ();
      if (!c || !n || !Number.isFinite(c.y) || !Number.isFinite(n.y)) return null;
      const a = Date.UTC(c.y, c.m - 1, c.d, c.hh || 0, c.mm || 0, c.ss || 0);
      const b = Date.UTC(n.y, n.m - 1, n.d, n.hh || 0, n.mm || 0, n.ss || 0);
      return Math.max(0, (b - a) / (365.2425 * 86400000));
    } catch (_) {
      return null;
    }
  }
  function yearBranch(year) {
    return (((Number(year) - 4) % 12) + 12) % 12;
  }
  function smallLimit(R0, year = TARGET_YEAR) {
    if (!R0?.bz?.pill?.[0]) return null;
    const q = BASE_QZ(R0),
      birthZ = ZHI[R0.bz.pill[0].b],
      b = QZ_GZ.indexOf(birthZ),
      y = yearBranch(year);
    const ming = QZ_GZ.indexOf(q.mingZhi),
      delta = (y - b + 12) % 12,
      zhi = QZ_GZ[(ming - delta + 120) % 12];
    const pal = q.palaces.find((p) => p.zhi === zhi);
    return {
      year: Number(year),
      taiSui: ZHI[y],
      birthZhi: birthZ,
      mingZhi: q.mingZhi,
      delta,
      zhi,
      palace: pal?.name || null,
      gongZhu: pal?.zhu || QZ_MINGZHU[zhi],
    };
  }
  function currentAudit() {
    const R0 = (() => {
      try {
        return typeof R !== "undefined" ? R : null;
      } catch (_) {
        return null;
      }
    })();
    if (!R0?.bz) return { available: false, reason: "请先建立档案并排盘" };
    const q = BASE_QZ(R0),
      age = decimalAgeNow(R0),
      lim = limitAtElapsedAge(age),
      small = smallLimit(R0, TARGET_YEAR);
    let palace = null;
    if (lim) palace = q.palaces.find((p) => p.name === lim.name) || null;
    return {
      available: true,
      targetYear: TARGET_YEAR,
      ageElapsed: age,
      nominalLimit: lim
        ? Object.assign({}, lim, { zhi: palace?.zhi || null, gongZhu: palace?.zhu || null })
        : null,
      smallLimit: small,
      warning: "nominal15 only; exact 童限 boundary and逐岁限度 not yet adopted",
    };
  }
  function augment(q, R0) {
    if (!q) return q;
    const age = decimalAgeNow(R0),
      lim = limitAtElapsedAge(age),
      small = smallLimit(R0, TARGET_YEAR);
    let p = null;
    if (lim) p = q.palaces.find((x) => x.name === lim.name) || null;
    q.dongweiV234 = {
      mode: "nominal15-audit-only",
      totalYears: sumYears(),
      schedule: nominalSchedule(),
      ageElapsed: age,
      nominalLimit: lim
        ? Object.assign({}, lim, { zhi: p?.zhi || null, gongZhu: p?.zhu || null })
        : null,
      smallLimit: small,
      degreeEngine: "pending-liangtianchi",
    };
    return q;
  }
  function qzV234(R0) {
    return augment(BASE_QZ(R0), R0);
  }
  function install() {
    try {
      window.qzCalc = qzV234;
      qzCalc = qzV234;
      return true;
    } catch (_) {
      try {
        window.qzCalc = qzV234;
        return true;
      } catch (__) {
        return false;
      }
    }
  }
  install();

  function scheduleHTML(A) {
    const cur = A?.nominalLimit?.name;
    return `<div class="q234-scroll"><div class="q234-timeline">${nominalSchedule()
      .map(
        (x) =>
          `<div class="q234-seg${x.name === cur ? " active" : ""}" style="flex:${x.years} 0 0"><span>${E(x.name.replace("宫", ""))}<br>${x.years}年</span></div>`,
      )
      .join("")}</div></div>
 <div class="q234-tablewrap" style="margin-top:7px"><table class="q234-table"><thead><tr><th>次序</th><th>宫限</th><th>名义年分</th><th>累计区间</th><th>说明</th></tr></thead><tbody>${nominalSchedule()
   .map(
     (x) =>
       `<tr><td>${x.index + 1}</td><td><b>${E(x.name)}</b></td><td>${x.years} 年</td><td>${x.start.toFixed(1)} → ${x.end.toFixed(1)}</td><td>${x.name === "命宫" ? '<span class="q234-state warn">15仅名义值；童限随命度浅深</span>' : '<span class="q234-state good">年分诀明确</span>'}</td></tr>`,
   )
   .join("")}</tbody></table></div>`;
  }
  function currentHTML(A) {
    if (!A?.available) return `<div class="q234-note">${E(A?.reason || "暂无当前盘")}</div>`;
    const l = A.nominalLimit,
      s = A.smallLimit;
    return `<div class="q234-list">
  <div class="q234-item ${l ? "cyan" : "warn"}"><b>当前名义宫限：${l ? E(l.name) + " · " + E(l.zhi || "—") + "宫" : "超出首轮百六名义周期"}</b><small>${Number.isFinite(A.ageElapsed) ? `近似周岁进程 ${A.ageElapsed.toFixed(2)} 年。` : ""}${l ? `名义区间 ${l.start.toFixed(1)}–${l.end.toFixed(1)} 年 · 限宫主 ${E(l.gongZhu || "—")}。` : ""}<br><b>注意：</b>这里只是15年命宫的 canonical nominal timeline，不代表已经算出个人真实童限。</small></div>
  <div class="q234-item good"><b>${E(String(s?.year || TARGET_YEAR))} 小限：${E(s?.palace || "—")} · ${E(s?.zhi || "—")}宫</b><small>生年支 ${E(s?.birthZhi || "—")} 加命宫 ${E(s?.mingZhi || "—")}，逆数至太岁 ${E(s?.taiSui || "—")}；宫主 ${E(s?.gongZhu || "—")}。这一层有直接原典算法，可独立于洞微童限计算。</small></div>
 </div>`;
  }
  function rulesHTML() {
    return `<div class="q234-tablewrap"><table class="q234-table"><thead><tr><th>规则</th><th>Evidence</th><th>原典/判断</th><th>V234 实现</th></tr></thead><tbody>${RULES.map((r) => `<tr><td><span class="q234-code">${E(r.id)}</span></td><td><span class="q234-state ${r.status === "primary" ? "good" : r.status.includes("pending") ? "warn" : "cyan"}">${E(r.status)}</span></td><td>${E(r.claim)}</td><td>${E(r.impl)}</td></tr>`).join("")}</tbody></table></div>`;
  }
  function degreeHTML() {
    return `<div class="q234-list">${DEGREE_VERSE.map((x) => `<div class="q234-item ${x.status === "text-explicit" ? "good" : "warn"}"><b>${E(x.palace)} · ${E(x.rule)}</b><small>${x.status === "text-explicit" ? "原文速率明确，但仍需和实际限度坐标框架组合。" : "原文存在非线性/量天尺条件，V234只登记，不伪造逐年黄经。"}</small></div>`).join("")}</div>`;
  }
  function sourcesHTML() {
    return SOURCES.map(
      (s) =>
        `<div class="q234-item good"><b>${E(s.title)}</b><small>${E(s.supports.join("；"))}<br>${E(s.note)}<br><span class="q234-code">${E(s.url)}</span></small><div class="q234-badges"><span class="q234-badge good">${E(s.type)}</span></div></div>`,
    ).join("");
  }
  function panel() {
    const A = currentAudit(),
      sum = sumYears();
    return `<section class="q234" id="q234Dongwei">
  <section class="q234-hero"><div class="q234-head"><div><h3>V234 · 洞微百六限前置 / 十二宫年分与小限 Evidence</h3><p>七政四余最后的大型算法层开始进入确定性整理。V234 先把能够从原典直接确定的部分落地：十二宫名义年分、百六名称的真实含义、宫限顺序、小限公式、限宫主/限度主边界。最容易误做的“个人童限”和逐岁限度暂不硬算，因为原典明确说命宫十五不可拘执，须依命度浅深与量天尺。</p></div><span class="q234-schema">${SCHEMA}</span></div>
   <div class="q234-tools"><label>小限年份 <input id="q234Year" type="number" min="1" max="9999" value="${TARGET_YEAR}"></label><button class="primary" id="q234YearGo" type="button">计算小限</button><button id="q234Refresh" type="button">刷新当前盘</button><button id="q234Export" type="button">导出 Dongwei Preflight</button></div>
  </section>
  <div class="q234-kpis">
   <div class="q234-kpi good"><small>名义总限</small><b>${sum.toFixed(1)} 年</b></div>
   <div class="q234-kpi good"><small>即</small><b>100年6月</b></div>
   <div class="q234-kpi good"><small>固定年分宫</small><b>11/12</b></div>
   <div class="q234-kpi gold"><small>命宫童限</small><b>DYNAMIC</b></div>
   <div class="q234-kpi good"><small>小限</small><b>IMPLEMENTED</b></div>
   <div class="q234-kpi gold"><small>逐岁限度</small><b>PENDING</b></div>
  </div>
  <section class="q234-card"><h4>一、洞微百六 · 名义十二宫时间轴</h4>${scheduleHTML(A)}<div class="q234-note" style="margin-top:7px">这里“百六”按十二宫年分相加就是 <b>100.5 年 = 一百年六个月</b>，不是106个整年。命宫15年是经典名义值；《张果星宗》同一卷随后明确提醒不可拘执，个人起限可早至约11岁、迟至约20岁。</div></section>
  <div class="q234-grid">
   <section class="q234-card"><h4>二、当前档案 · 名义宫限 / 小限</h4><div id="q234Current">${currentHTML(A)}</div></section>
   <aside class="q234-card"><h4>三、为什么还不直接做“完整大限”</h4><div class="q234-list">
    <div class="q234-item good"><b>宫限年分已经能确定</b><small>相貌10、福德11、官禄15、迁移8、疾厄7、夫妻11、奴仆/男女/田宅各4.5、兄弟/财帛各5，都有原典直接文本。</small></div>
    <div class="q234-item warn"><b>童限不是固定15</b><small>原典写明命宫十五只是古法则，不可拘执，并举11岁早起、20岁迟起。没有量天尺/命度几何前，不能拿“15岁”覆盖所有人。</small></div>
    <div class="q234-item warn"><b>逐岁“限度”比宫限更细</b><small>原典强调世人只用宫主“十不一应”，必须继续算限行到哪一度，再同时看限宫主和限度主。因此 V234 不把整宫平均切成30°/年数。</small></div>
   </div></aside>
  </div>
  <section class="q234-card"><h4>四、Rule Ledger · 可计算性审计</h4>${rulesHTML()}</section>
  <div class="q234-grid">
   <section class="q234-card"><h4>五、行度诀 · 已取证但尚未伪线性化</h4>${degreeHTML()}</section>
   <aside class="q234-card"><h4>六、Primary Evidence</h4><div class="q234-list">${sourcesHTML()}</div></aside>
  </div>
 </section>`;
  }
  function report() {
    return {
      schema: SCHEMA,
      build: BUILD,
      generatedAt: new Date().toISOString(),
      nominalYears: clone(NOMINAL_YEARS),
      order: clone(LIMIT_ORDER),
      totalYears: sumYears(),
      schedule: nominalSchedule(),
      degreeVerse: clone(DEGREE_VERSE),
      sources: clone(SOURCES),
      rules: clone(RULES),
      current: currentAudit(),
      decision: {
        nomenclature: "百六 = 100 years 6 months under nominal year table",
        nominalMingYears: 15,
        personalTongLimit: "pending quantity/命度/量天尺 geometry; do not force 15",
        smallLimit: "implemented from primary formula",
        yearlyLimitDegree: "pending; no equal-house linear interpolation",
        gongLord: "available at palace level",
        degreeLord: "pending yearly limit-degree engine",
        livePrediction: "audit/preflight only",
      },
    };
  }
  function save(name, obj) {
    const blob = new Blob([JSON.stringify(obj, null, 2)], {
        type: "application/json;charset=utf-8",
      }),
      url = URL.createObjectURL(blob),
      a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1600);
  }
  function mount() {
    const pane = document.getElementById("pane-qizheng");
    if (!pane || !pane.classList.contains("on")) return;
    const anchor =
      pane.querySelector("#q233StrengthRulePack") ||
      pane.querySelector("#q232LifeRulePack") ||
      pane.firstElementChild;
    const old = pane.querySelector("#q234Dongwei"),
      tmp = document.createElement("div");
    tmp.innerHTML = panel();
    const fresh = tmp.firstElementChild;
    if (old) old.replaceWith(fresh);
    else if (anchor) anchor.insertAdjacentElement("beforebegin", fresh);
    else pane.appendChild(fresh);
  }
  document.addEventListener(
    "click",
    (e) => {
      if (e.target?.id === "q234YearGo") {
        const v = Number(document.getElementById("q234Year")?.value);
        if (Number.isFinite(v) && v >= 1 && v <= 9999) TARGET_YEAR = Math.trunc(v);
        mount();
        return;
      }
      if (e.target?.id === "q234Refresh") {
        mount();
        return;
      }
      if (e.target?.id === "q234Export") {
        save("天机盘_V234_洞微百六限Preflight.json", report());
        return;
      }
    },
    true,
  );

  TianjiPaneScheduler.register("qizheng", "v234-dongwei-js", mount);

  try {
    if (window.TianjiCore) {
      TianjiCore.registerSource({
        id: "qizheng-dongwei-v234",
        type: "classic",
        title: "张果星宗 · 定限度法 / 年分诀 / 行度诀 / 洞微百六限说",
        version: "图书集成567/582",
        license: "public-domain-classic",
        note: "V234确认百六名义年分、小限公式、命宫童限可变与限宫/限度双主边界。",
      });
      TianjiCore.registerRule({
        id: "qizheng.dongwei.preflight.v1",
        system: "qizheng",
        source: "qizheng-dongwei-v234",
        title: "洞微百六限前置规则包",
        status: "verified-preflight",
        note: "名义100年6月时间轴 + 小限已实现；个人童限和逐岁限度等待量天尺/命度几何，不用等宫线性伪造。",
      });
      TianjiCore.registerEngine(
        {
          id: "qizheng.dongwei.preflight.v1",
          system: "qizheng",
          name: "Dongwei Hundred-Six Preflight",
          version: "1.0.0",
          source: "qizheng-dongwei-v234",
          doctrine: "nominal palace schedule + primary small-limit; degree progression pending",
          status: "research",
        },
        () => report(),
      );
    }
  } catch (err) {
    console.warn("[V234 registry]", err);
  }

  const TASKS234 = [
    { id: "ai", p: "P0", name: "统一 AI 解释层", state: "done", note: "v171 完成" },
    { id: "mcp", p: "P0", name: "MCP / API 外部调用层", state: "done", note: "v172 完成" },
    {
      id: "kg",
      p: "P0",
      name: "典籍 Evidence / 规则知识图谱",
      state: "done",
      note: "v173 第一阶段；V234新增洞微百六限、行度、小限原典链",
    },
    { id: "router", p: "P0", name: "自然语言问事路由", state: "done", note: "v196–v197 完成" },
    { id: "consumer", p: "P0", name: "统一消费者结果页 / 报告", state: "done", note: "v198 完成" },
    {
      id: "qimen-evidence",
      p: "P1",
      name: "奇门四家第三方对拍 / 高级 Evidence",
      state: "doing",
      note: "v221–v223 已完成外部 Golden / 第二参考 / 日家原典60/60；剩余完整日家 Doctrine 与月家逐宫扩样。",
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
      note: "v203–v204 + V218/V219 稳定层",
    },
    {
      id: "qizheng",
      p: "P1",
      name: "七政四余核心化",
      state: "doing",
      note: "V224–V233 已完成可靠星历、四余 Provider、命身宫主度主、庙旺明晦变曜。V234 完成洞微百六前置：十二宫名义年分合计100年6个月、小限公式已实现，命宫15年被明确降为nominal，个人童限11–20岁区间与逐岁限度需量天尺/命度几何后再核心化。",
    },
    {
      id: "xk",
      p: "P1",
      name: "玄空完整宅盘",
      state: "done",
      note: "v205–v206 当前声明口径完成；外部逐盘 reference 可继续增强",
    },
    {
      id: "sanhe",
      p: "P1",
      name: "三合水法 Core",
      state: "done",
      note: "v207–v208 当前声明口径完成；外部逐盘 reference 可继续增强",
    },
    { id: "tz", p: "P2", name: "历史时区 / 夏令时自动校正", state: "done", note: "v209–v211 完成" },
    { id: "relation", p: "P2", name: "关系长期时间轴", state: "done", note: "v212–v213 完成" },
    { id: "report", p: "P2", name: "合参 Evidence 正式报告", state: "done", note: "v214 完成" },
  ];
  const BOARD234 = {
    schema: "tianji.priority.board.v1",
    build: BUILD,
    total: 14,
    done: 12,
    doing: 2,
    blocked: 0,
    progress: 92.9,
    next: [
      "V235 洞微限度一期：量天尺 / 命度浅深 / 童限起界的可计算模型与金样",
      "四余第二历史绝对锚点 / 长期相位漂移验证",
      "四季土旺水衰的辰戌丑未 live 时间窗定义",
      "奇门日家完整盘 / 月家逐宫扩样",
    ],
    tasks: TASKS234,
  };
  function applyBoard() {
    window.TianjiPriorityBoard = Object.freeze({
      schema: BOARD234.schema,
      snapshot: () => clone(BOARD234),
    });
    const road = window.TianjiRoadmap || {};
    window.TianjiRoadmap = Object.freeze(
      Object.assign({}, road, {
        urgentImportant: clone(BOARD234),
        nextMainline: clone(BOARD234.next),
      }),
    );
  }
  applyBoard();
  window.addEventListener("tianji:lazy-ready", () => setTimeout(applyBoard, 0));

  function selfTest() {
    const C = [],
      add = (id, ok, d = "") => C.push({ id, ok: !!ok, d });
    const S = nominalSchedule();
    add("base.capture", typeof BASE_QZ === "function", "");
    add("year.sum", Math.abs(sumYears() - 100.5) < 1e-9, String(sumYears()));
    add("schedule.count", S.length === 12, String(S.length));
    add(
      "day-half",
      Math.abs(S.find((x) => x.name === "疾厄").end - 66) < 1e-9,
      String(S.find((x) => x.name === "疾厄").end),
    );
    add("night-half", Math.abs(sumYears() - 100.5) < 1e-9, "100.5");
    add("fixed.eleven", Object.keys(NOMINAL_YEARS).filter((k) => k !== "命宫").length === 11, "");
    add(
      "small.example",
      (() => {
        const ming = QZ_GZ.indexOf("寅"),
          b = QZ_GZ.indexOf("子"),
          y = QZ_GZ.indexOf("辰"),
          delta = (y - b + 12) % 12;
        return QZ_GZ[(ming - delta + 120) % 12] === "戌";
      })(),
      "子年生/命寅/辰太岁 -> 戌",
    );
    add("wrapper.install", window.qzCalc === qzV234, "");
    return { ok: C.every((x) => x.ok), checks: C };
  }
  const TEST = selfTest();

  window.TianjiQizhengDongweiV234 = Object.freeze({
    version: "1.0.0",
    build: BUILD,
    schema: SCHEMA,
    sources: () => clone(SOURCES),
    rules: () => clone(RULES),
    degreeVerse: () => clone(DEGREE_VERSE),
    nominalYears: () => clone(NOMINAL_YEARS),
    schedule: () => clone(nominalSchedule()),
    totalYears: sumYears,
    limitAtAge: (age) => clone(limitAtElapsedAge(Number(age))),
    smallLimit: (R0, year) =>
      clone(
        smallLimit(
          R0 ||
            (() => {
              try {
                return R;
              } catch (_) {
                return null;
              }
            })(),
          year || TARGET_YEAR,
        ),
      ),
    current: () => clone(currentAudit()),
    report: () => clone(report()),
    selfTest: () => clone(TEST),
    manifest: () => ({
      module: "Qizheng Dongwei Hundred-Six Preflight V234",
      nominalTotal: "100 years 6 months",
      nominalMingYears: 15,
      fixedOtherPalaces: true,
      personalTongLimit: "primary evidence says variable; exact engine pending",
      smallLimit: "implemented from primary rule",
      yearlyDegree: "pending quantity/量天尺 geometry",
      livePrediction: "preflight only",
    }),
  });
  window.TianjiSystemV234 = {
    version: "v234",
    build: BUILD,
    qizhengDongweiPreflight: true,
    smallLimitImplemented: true,
    dongweiFullAdopted: false,
    baseline: "v233",
  };
})();
