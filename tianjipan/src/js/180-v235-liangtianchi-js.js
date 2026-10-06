(() => {
  "use strict";
  const BUILD = "v235 · 2026-10-06 23:12 +08:00";
  const SCHEMA = "tianji.qizheng.liangtianchi.v1";
  const CAL_KEY = "tianjipan.qizheng.tonglimit.v237.by-input";
  const BASE_QZ = window.qzCalc || qzCalc;
  const ORDER = [
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
  const FIXED_YEARS = {
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
  const GOLDENS = [
    {
      id: "xing5-row5",
      text: "命躔星五度，在星盘中午宫第五行上，则是十五岁行限。",
      age: 15,
      status: "exact-text-example",
      warning: "“第五行”依赖原图格，不等于只看宿内5度。",
    },
    {
      id: "xing345-lower",
      text: "命躔三四五度下，则是十一岁行限。",
      age: 11,
      status: "text-ambiguous",
      warning: "“下”与原图格位置有关；脱离图版不可直接把星宿3–5度全部判为11。",
    },
    {
      id: "zhang11-13",
      text: "命躔张十一、十二、十三度，则是二十岁行限。",
      age: 20,
      status: "exact-text-range",
      warning: "是原典明确晚限示例，但仍属于该盘图格口径。",
    },
  ];
  const SOURCES = [
    {
      id: "zhangguo-567-liangtianchi",
      title: "《钦定古今图书集成》艺术典第567卷 · 定限度法 / 行度诀",
      type: "primary-classic",
      url: "https://zh.wikisource.org/zh-hans/%E6%AC%BD%E5%AE%9A%E5%8F%A4%E4%BB%8A%E5%9C%96%E6%9B%B8%E9%9B%86%E6%88%90/%E5%8D%9A%E7%89%A9%E5%BD%99%E7%B7%A8/%E8%97%9D%E8%A1%93%E5%85%B8/%E7%AC%AC567%E5%8D%B7",
      supports: [
        "童限早11、迟20",
        "星五度第五行=15岁示例",
        "张十一至十三度=20岁示例",
        "命宫十五不可拘执",
        "11岁起限→命宫管10年；20岁起限→命宫管19年",
      ],
    },
    {
      id: "zhangguo-569-year-degree",
      title: "《钦定古今图书集成》艺术典第569卷 · 定行限度法",
      type: "primary-classic",
      url: "https://zh.wikisource.org/zh-hans/%E6%AC%BD%E5%AE%9A%E5%8F%A4%E4%BB%8A%E5%9C%96%E6%9B%B8%E9%9B%86%E6%88%90/%E5%8D%9A%E7%89%A9%E5%BD%99%E7%B7%A8/%E8%97%9D%E8%A1%93%E5%85%B8/%E7%AC%AC569%E5%8D%B7",
      supports: [
        "相貌10年/约3度每年",
        "官禄15年/2度每年",
        "福德妻妾11年",
        "迁移8年",
        "疾厄7年",
        "奴仆男女田宅4年半",
        "兄弟财帛5年",
      ],
    },
    {
      id: "liangtianchi-transcription",
      title: "《儒门崇理折衷堪舆完孝录》量天尺转录",
      type: "corroborating-classic",
      url: "https://zh.wikisource.org/zh-hans/%E5%84%92%E9%96%80%E5%B4%87%E7%90%86%E6%8A%98%E8%A1%B7%E5%A0%AA%E8%BC%BF%E5%AE%8C%E5%AD%9D%E9%8C%84",
      supports: [
        "命宫缠度浅深、行限过宫度数名量天尺",
        "量天尺格眼会有一二度误差，需与各宫数法合参",
      ],
    },
  ];

  const clone = (x) => (x == null ? x : JSON.parse(JSON.stringify(x)));
  const E = (s) =>
    String(s ?? "").replace(
      /[&<>"']/g,
      (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
    );
  function calIdentity(r = currentR()) {
    if (!r?.t?.civ) return null;
    return JSON.stringify({
      rule: "liangtianchi-manual-v1",
      civ: r.t.civ,
      opt: r.opt || {},
      jd: r.t.jdUT ?? r.t.jd,
    });
  }
  function calStore() {
    try {
      const x = JSON.parse(localStorage.getItem(CAL_KEY) || "{}");
      return x && typeof x === "object" && !Array.isArray(x) ? x : {};
    } catch (_) {
      return {};
    }
  }
  function loadCal(r = currentR()) {
    const key = calIdentity(r),
      x = key && calStore()[key];
    return x && Number.isInteger(x.startAge) && x.startAge >= 11 && x.startAge <= 20
      ? { ...x, inputKey: key }
      : { startAge: null, source: "unresolved", note: "本次输入尚未校准", inputKey: key };
  }
  const CAL = new Proxy(
    {},
    {
      get: (_, k) => loadCal()[k],
      ownKeys: () => Object.keys(loadCal()),
      getOwnPropertyDescriptor: () => ({ enumerable: true, configurable: true }),
    },
  );
  let TARGET_YEAR = (() => {
    try {
      return nowBJ().y;
    } catch (_) {
      return new Date().getFullYear();
    }
  })();
  function saveCal(x) {
    const key = calIdentity();
    if (!key) throw new Error("请先排盘，再校准当前人物");
    if (!Number.isInteger(x?.startAge) || x.startAge < 11 || x.startAge > 20)
      throw new RangeError("童限校准必须为11至20的整数");
    const store = calStore();
    store[key] = {
      startAge: x.startAge,
      source: x.source || "manual",
      note: String(x.note || "").slice(0, 300),
    };
    localStorage.setItem(CAL_KEY, JSON.stringify(store));
    return loadCal();
  }
  function clearCal() {
    const key = calIdentity(),
      store = calStore();
    if (key) {
      delete store[key];
      localStorage.setItem(CAL_KEY, JSON.stringify(store));
    }
    return loadCal();
  }
  function degreeRates() {
    return ORDER.filter((n) => n !== "命宫").map((name) => {
      const years = FIXED_YEARS[name],
        rate = 30 / years;
      return {
        name,
        years,
        degPerYear: rate,
        monthsPerDegree: 12 / rate,
        totalDegrees: 30,
        status: "derived-from-30deg-house+primary-years",
      };
    });
  }
  function dynamicSchedule(startAge = CAL.startAge) {
    if (!Number.isFinite(startAge)) return [];
    /* 原典给出11→命宫管10、20→命宫管19。V235 对12–19只作线性“源约束插值”，
    明确不是图格金样。传统“岁”按整数岁序，不映射精确生日。 */
    const mingYears = startAge - 1;
    const rows = [];
    let age = startAge;
    rows.push({
      name: "命宫",
      years: mingYears,
      ageStart: age,
      ageEnd: age + mingYears,
      degreeRate: null,
      status:
        startAge === 11 || startAge === 20
          ? "primary-endpoint"
          : "source-constrained-interpolation",
    });
    age += mingYears;
    for (const name of ORDER.slice(1)) {
      const years = FIXED_YEARS[name],
        rate = 30 / years;
      rows.push({
        name,
        years,
        ageStart: age,
        ageEnd: age + years,
        degreeRate: rate,
        status: "primary-years/derived-rate",
      });
      age += years;
    }
    return rows;
  }
  function limitAtSui(sui, startAge = CAL.startAge) {
    if (!Number.isFinite(sui) || !Number.isFinite(startAge)) return null;
    return dynamicSchedule(startAge).find((x) => sui >= x.ageStart && sui < x.ageEnd) || null;
  }
  function currentR() {
    try {
      return typeof R !== "undefined" ? R : null;
    } catch (_) {
      return null;
    }
  }
  function currentQ() {
    const r = currentR();
    return r?.bz ? BASE_QZ(r) : null;
  }
  function currentMingDegree(q = currentQ()) {
    if (!q) return null;
    return {
      xiu: q.mingDuXiu?.name || null,
      du: Number(q.mingDuXiu?.du),
      zhu: q.mingDuZhu || null,
      mingZhi: q.mingZhi || null,
    };
  }
  function hintFromDegree(q = currentQ()) {
    const d = currentMingDegree(q);
    if (!d || !Number.isFinite(d.du)) return { state: "missing", text: "请先排盘" };
    if (d.xiu === "张" && d.du >= 11 && d.du <= 13)
      return {
        state: "hint-20",
        age: 20,
        text: "当前命度落在“张十一至十三度”文字金样范围；可作为20岁候选，但仍建议核对原图。",
      };
    if (d.xiu === "星" && Math.abs(d.du - 5) <= 0.55)
      return {
        state: "ambiguous",
        text: "当前接近“星五度”，原文同时涉及第五行15岁与“三四五度下”11岁措辞；没有原图格不能自动判定。",
      };
    if (d.xiu === "星" && d.du >= 3 && d.du <= 5.5)
      return {
        state: "ambiguous",
        text: "当前处于原文“星三四五度下”相关区间，但“下”依赖原图格；V235拒绝自动映射11岁。",
      };
    return {
      state: "unresolved",
      text: "当前命度没有命中V235三组文字金样。需要原图格/量天尺或外部可靠盘例校准。",
    };
  }
  function birthYear() {
    const r = currentR();
    try {
      return Number(r?.t?.civ?.y) || null;
    } catch (_) {
      return null;
    }
  }
  function suiForYear(year = TARGET_YEAR) {
    const by = birthYear();
    return Number.isFinite(by) ? Number(year) - by + 1 : null;
  }
  function calibratedCurrent() {
    const r = currentR();
    if (!r?.bz) return { available: false, reason: "请先建立档案并排盘" };
    const sui = suiForYear(),
      seg = limitAtSui(sui),
      q = BASE_QZ(r);
    let palace = null;
    if (seg) palace = q.palaces.find((p) => p.name === seg.name) || null;
    let degree = null;
    if (seg && seg.name !== "命宫" && Number.isFinite(seg.degreeRate)) {
      degree = Math.max(0, Math.min(30, (sui - seg.ageStart) * seg.degreeRate));
    }
    return {
      available: true,
      targetYear: TARGET_YEAR,
      sui,
      calibration: clone(CAL),
      hint: hintFromDegree(),
      segment: seg
        ? Object.assign({}, seg, {
            zhi: palace?.zhi || null,
            gongZhu: palace?.zhu || null,
            degreeAtYearStart: degree,
          })
        : null,
      mingDegree: currentMingDegree(),
      caveat: "岁序为传统整数岁近似；命宫逐岁限度未自动化；后续宫度为30°/原典年分的平均进度。",
    };
  }
  function augment(q, R0) {
    if (!q) return q;
    const cal = loadCal(R0),
      sui = (() => {
        try {
          return TARGET_YEAR - Number(R0?.t?.civ?.y) + 1;
        } catch (_) {
          return null;
        }
      })(),
      seg = limitAtSui(sui, cal.startAge);
    q.dongweiV235 = {
      calibration: clone(cal),
      targetYear: TARGET_YEAR,
      sui,
      segment: clone(seg),
      hint: hintFromDegree(q),
      degreeRates: degreeRates(),
      mode: "calibrated-research",
    };
    return q;
  }
  function qzV235(R0) {
    return augment(BASE_QZ(R0), R0);
  }
  function install() {
    try {
      window.qzCalc = qzV235;
      qzCalc = qzV235;
      return true;
    } catch (_) {
      try {
        window.qzCalc = qzV235;
        return true;
      } catch (__) {
        return false;
      }
    }
  }
  install();

  function sourceHTML() {
    return SOURCES.map(
      (s) =>
        `<div class="q235-item ${s.type === "primary-classic" ? "good" : "cyan"}"><b>${E(s.title)}</b><small>${E(s.supports.join("；"))}<br><span class="q235-code">${E(s.url)}</span></small><div class="q235-badges"><span class="q235-badge ${s.type === "primary-classic" ? "good" : "cyan"}">${E(s.type)}</span></div></div>`,
    ).join("");
  }
  function goldenHTML() {
    return GOLDENS.map(
      (g) =>
        `<div class="q235-item ${g.age === 15 ? "cyan" : g.age === 11 ? "warn" : "good"}"><b>${g.age}岁文字金样 · ${E(g.id)}</b><small>${E(g.text)}<br>${E(g.warning)}</small><div class="q235-badges"><span class="q235-badge ${g.status === "exact-text-range" || g.status === "exact-text-example" ? "good" : "gold"}">${E(g.status)}</span></div></div>`,
    ).join("");
  }
  function ratesHTML() {
    return `<div class="q235-tablewrap"><table class="q235-table"><thead><tr><th>宫限</th><th>原典年分</th><th>V235平均宫度</th><th>每度约需</th><th>状态</th></tr></thead><tbody>${degreeRates()
      .map(
        (x) =>
          `<tr><td><b>${E(x.name)}</b></td><td>${x.years} 年</td><td>${x.degPerYear.toFixed(6)}° / 年</td><td>${x.monthsPerDegree.toFixed(3)} 月</td><td><span class="q235-state good">30°÷年分</span></td></tr>`,
      )
      .join("")}</tbody></table></div>`;
  }
  function timelineHTML(A) {
    if (!Number.isFinite(CAL.startAge))
      return '<div class="q235-note">尚未校准童限/首限起岁。V235 不会根据当前命度自动猜一个 11–20 岁数字。</div>';
    const segs = dynamicSchedule(),
      cur = A?.segment?.name;
    return `<div class="q235-scroll"><div class="q235-timeline">${segs.map((x) => `<div class="q235-seg${x.name === cur ? " active" : ""}" style="flex:${Math.max(2, x.years)} 0 0"><span>${E(x.name.replace("宫", ""))}<br>${x.ageStart.toFixed(0)}→${x.ageEnd.toFixed(1)}</span></div>`).join("")}</div></div>`;
  }
  function currentHTML(A) {
    if (!A?.available) return `<div class="q235-note">${E(A?.reason || "暂无当前盘")}</div>`;
    const s = A.segment,
      h = A.hint,
      m = A.mingDegree;
    return `<div class="q235-list">
  <div class="q235-item ${h.state === "hint-20" ? "good" : h.state === "ambiguous" ? "warn" : "cyan"}"><b>当前命度：${E(m?.xiu || "—")}${Number.isFinite(m?.du) ? Number(m.du).toFixed(2) + "°" : "—"} · 命度主 ${E(m?.zhu || "—")}</b><small>${E(h.text)}</small></div>
  <div class="q235-item ${Number.isFinite(CAL.startAge) ? "good" : "warn"}"><b>童限校准：${Number.isFinite(CAL.startAge) ? CAL.startAge + "岁" : "未校准"}</b><small>来源：${E(CAL.source)}${CAL.note ? " · " + E(CAL.note) : ""}。除11/20端点外，12–19的“命宫管年=起限岁-1”只标记为源约束插值，不当作原图金样。</small></div>
  <div class="q235-item ${s ? "cyan" : "warn"}"><b>${TARGET_YEAR} · ${Number.isFinite(A.sui) ? A.sui + "岁" : "—"} · ${s ? E(s.name) : "无法定位"}</b><small>${s ? `${E(s.zhi || "—")}宫 · 宫主 ${E(s.gongZhu || "—")} · 岁区间 ${s.ageStart.toFixed(1)}–${s.ageEnd.toFixed(1)}${Number.isFinite(s.degreeAtYearStart) ? ` · 宫内平均进度约 ${s.degreeAtYearStart.toFixed(2)}°` : ""}` : "需要先校准童限起岁。"}<br>${E(A.caveat)}</small></div>
 </div>`;
  }
  function panel() {
    const A = calibratedCurrent(),
      cal = CAL.startAge;
    return `<section class="q235" id="q235Liangtianchi">
  <section class="q235-hero"><div class="q235-head"><div><h3>V235 · 量天尺 / 童限校准 / 逐年限度一期</h3><p>V234 已有百六宫限和小限；V235 进一步把“童限为什么不能固定15岁”做成可操作的校准层，并把第569卷可直接复算的后续宫限平均行度落地。最关键的纪律仍然是：没有原图格/可靠盘例时，不从单一命度数字自动猜童限。</p></div><span class="q235-schema">${SCHEMA}</span></div>
   <div class="q235-tools"><label>童限起岁 <input id="q235Age" type="number" min="11" max="20" step="1" value="${Number.isFinite(cal) ? cal : ""}" placeholder="11–20"></label><button class="primary" id="q235Cal" type="button">保存人工校准</button><button class="good" data-q235-golden="11" type="button">11岁端点</button><button class="good" data-q235-golden="20" type="button">20岁端点</button><button class="danger" id="q235Clear" type="button"${Number.isFinite(cal) ? "" : " disabled"}>清除校准</button><label>目标年 <input id="q235Year" type="number" min="1" max="9999" value="${TARGET_YEAR}"></label><button id="q235YearGo" type="button">定位</button><button id="q235Export" type="button">导出 V235 Report</button></div>
  </section>
  <div class="q235-kpis">
   <div class="q235-kpi ${Number.isFinite(cal) ? "good" : "gold"}"><small>童限校准</small><b>${Number.isFinite(cal) ? cal + "岁" : "UNRESOLVED"}</b></div>
   <div class="q235-kpi good"><small>原典文字金样</small><b>3组</b></div>
   <div class="q235-kpi good"><small>后续固定宫限</small><b>11宫</b></div>
   <div class="q235-kpi cyan"><small>平均行度</small><b>IMPLEMENTED</b></div>
   <div class="q235-kpi gold"><small>命宫逐岁限度</small><b>PENDING GRID</b></div>
   <div class="q235-kpi"><small>自动猜童限</small><b>NO</b></div>
  </div>
  <div class="q235-grid">
   <section class="q235-card"><h4>一、当前档案 · 命度 / 童限 / 目标年</h4><div id="q235Current">${currentHTML(A)}</div></section>
   <aside class="q235-card"><h4>二、童限文字金样</h4><div class="q235-list">${goldenHTML()}</div></aside>
  </div>
  <section class="q235-card"><h4>三、校准后洞微时间轴</h4>${timelineHTML(A)}<div class="q235-note" style="margin-top:7px">时间轴只在人工/金样校准后生成。命宫时长：11岁端点→10年、20岁端点→19年是原典直接例；12–19之间采用“n→n−1”的源约束插值，仅用于研究时间轴，不标记为独立古籍金样。</div></section>
  <section class="q235-card"><h4>四、第569卷 · 后续宫限平均行度</h4>${ratesHTML()}<div class="q235-note" style="margin-top:7px">这里使用“每宫30° ÷ 原典年分”形成可复算平均速度：相貌3°/年、官禄2°/年、迁移3.75°/年、疾厄约4.2857°/年、兄弟/财帛6°/年等。它适用于V234当前等宫框架；不替代命宫量天尺，也不声称恢复古图所有非线性格眼。</div></section>
  <div class="q235-grid">
   <section class="q235-card"><h4>五、为什么仍不自动算童限</h4><div class="q235-list">
    <div class="q235-item warn"><b>原文判断依赖“第几行 / 格眼”</b><small>“星五度第五行=15岁”已经说明：年龄不是简单由宿内度数单变量决定。原图表的行列关系必须恢复后，才能做全自动映射。</small></div>
    <div class="q235-item warn"><b>量天尺本身允许一二度误差</b><small>同类古籍转录明确说量天尺格眼不能一一加初度，常差一二度，须与各宫数法合参。因此未来自动引擎也应输出边界敏感区，而不是一个绝对单点。</small></div>
    <div class="q235-item good"><b>V235 已把可计算部分和不可计算部分拆开</b><small>后续11宫年分/平均行度可以确定；童限11–20需要原图/可靠金样校准；命宫内部逐岁限度继续 pending。</small></div>
   </div></section>
   <aside class="q235-card"><h4>六、Evidence Sources</h4><div class="q235-list">${sourceHTML()}</div></aside>
  </div>
 </section>`;
  }
  function report() {
    return {
      schema: SCHEMA,
      build: BUILD,
      generatedAt: new Date().toISOString(),
      calibration: clone(CAL),
      targetYear: TARGET_YEAR,
      current: calibratedCurrent(),
      goldens: clone(GOLDENS),
      fixedYears: clone(FIXED_YEARS),
      degreeRates: degreeRates(),
      dynamicSchedule: Number.isFinite(CAL.startAge) ? dynamicSchedule() : [],
      sources: clone(SOURCES),
      decision: {
        autoTongLimit: false,
        reason: "source requires original chart row/grid; text-only degree is insufficient",
        exactTextEndpoints: [11, 20],
        exactTextMiddleExample: 15,
        intermediate12to19: "source-constrained interpolation only",
        postMingPalaceDegree: "30° / primary palace years in current equal-house frame",
        mingDegreeProgression: "pending original grid /量天尺 digitization",
        ageConvention: "traditional integer 岁 sequence; not exact western birthday age",
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
      pane.querySelector("#q234Dongwei") ||
      pane.querySelector("#q233StrengthRulePack") ||
      pane.firstElementChild;
    const old = pane.querySelector("#q235Liangtianchi"),
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
      if (e.target?.id === "q235Cal") {
        const v = Number(document.getElementById("q235Age")?.value);
        if (Number.isFinite(v) && v >= 11 && v <= 20)
          saveCal({
            startAge: Math.trunc(v),
            source: "manual-calibration",
            note: "需由原图格/可靠外部盘例确认",
          });
        mount();
        return;
      }
      const g = e.target?.closest?.("[data-q235-golden]");
      if (g) {
        const v = Number(g.dataset.q235Golden);
        saveCal({
          startAge: v,
          source: "primary-endpoint-demo",
          note: "用于端点演示；不代表当前本人自动命中",
        });
        mount();
        return;
      }
      if (e.target?.id === "q235Clear") {
        clearCal();
        mount();
        return;
      }
      if (e.target?.id === "q235YearGo") {
        const v = Number(document.getElementById("q235Year")?.value);
        if (Number.isFinite(v) && v >= 1 && v <= 9999) TARGET_YEAR = Math.trunc(v);
        mount();
        return;
      }
      if (e.target?.id === "q235Export") {
        save("天机盘_V235_量天尺童限校准Report.json", report());
        return;
      }
    },
    true,
  );

  TianjiPaneScheduler.register("qizheng", "v235-liangtianchi-js", mount);

  try {
    if (window.TianjiCore) {
      TianjiCore.registerSource({
        id: "qizheng-liangtianchi-v235",
        type: "classic",
        title: "张果星宗 · 定限度法 / 定行限度法 / 量天尺",
        version: "图书集成567/569 + 旁证",
        license: "public-domain-classic",
        note: "V235建立11/15/20文字金样、童限校准边界，以及后续11宫30°/年分平均限度。",
      });
      TianjiCore.registerRule({
        id: "qizheng.liangtianchi.calibration.v1",
        system: "qizheng",
        source: "qizheng-liangtianchi-v235",
        title: "量天尺童限校准规则包",
        status: "partial-verified",
        note: "不从命度单变量自动猜童限；原图格缺失时只允许人工/金样校准。后续固定宫限平均度速可复算。",
      });
      TianjiCore.registerEngine(
        {
          id: "qizheng.liangtianchi.v1",
          system: "qizheng",
          name: "Liangtianchi Tong-limit Calibration",
          version: "1.0.0",
          source: "qizheng-liangtianchi-v235",
          doctrine:
            "manual/golden calibration + fixed post-ming palace rates; no fabricated first-limit grid",
          status: "research",
        },
        () => report(),
      );
    }
  } catch (err) {
    console.warn("[V235 registry]", err);
  }

  const TASKS235 = [
    { id: "ai", p: "P0", name: "统一 AI 解释层", state: "done", note: "v171 完成" },
    { id: "mcp", p: "P0", name: "MCP / API 外部调用层", state: "done", note: "v172 完成" },
    {
      id: "kg",
      p: "P0",
      name: "典籍 Evidence / 规则知识图谱",
      state: "done",
      note: "v173 第一阶段；V235新增量天尺/童限/逐年行限度 Evidence",
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
      note: "V224–V234 已完成七政星历、四余Provider、命身、强弱变曜、百六/小限前置。V235 把量天尺拆成可审计校准器：11/15/20文字金样、命宫11→10年与20→19年端点、后续11宫30°/原典年分平均限度已实现；但原始“第几行/格眼”图表尚未数字化，因此不自动猜个人童限。",
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
  const BOARD235 = {
    schema: "tianji.priority.board.v1",
    build: BUILD,
    total: 14,
    done: 12,
    doing: 2,
    blocked: 0,
    progress: 92.9,
    next: [
      "V236 量天尺图格数字化：恢复567/569原图行列，建立11–20岁全区间金样映射",
      "四余第二历史绝对锚点 / 长期相位漂移验证",
      "四季土旺水衰的辰戌丑未 live 时间窗定义",
      "奇门日家完整盘 / 月家逐宫扩样",
    ],
    tasks: TASKS235,
  };
  function applyBoard() {
    window.TianjiPriorityBoard = Object.freeze({
      schema: BOARD235.schema,
      snapshot: () => clone(BOARD235),
    });
    const road = window.TianjiRoadmap || {};
    window.TianjiRoadmap = Object.freeze(
      Object.assign({}, road, {
        urgentImportant: clone(BOARD235),
        nextMainline: clone(BOARD235.next),
      }),
    );
  }
  applyBoard();
  window.addEventListener("tianji:lazy-ready", () => setTimeout(applyBoard, 0));

  function selfTest() {
    const C = [],
      add = (id, ok, d = "") => C.push({ id, ok: !!ok, d });
    add("base.capture", typeof BASE_QZ === "function", "");
    add("goldens", GOLDENS.length === 3, String(GOLDENS.length));
    const R = degreeRates(),
      map = Object.fromEntries(R.map((x) => [x.name, x]));
    add("rate.mao", Math.abs(map["相貌"].degPerYear - 3) < 1e-12, String(map["相貌"].degPerYear));
    add("rate.guan", Math.abs(map["官禄"].degPerYear - 2) < 1e-12, String(map["官禄"].degPerYear));
    add(
      "rate.qian",
      Math.abs(map["迁移"].degPerYear - 3.75) < 1e-12,
      String(map["迁移"].degPerYear),
    );
    add(
      "rate.ji",
      Math.abs(map["疾厄"].degPerYear - 30 / 7) < 1e-12,
      String(map["疾厄"].degPerYear),
    );
    add(
      "rate.nu",
      Math.abs(map["奴仆"].degPerYear - 30 / 4.5) < 1e-12,
      String(map["奴仆"].degPerYear),
    );
    add("rate.cai", Math.abs(map["财帛"].degPerYear - 6) < 1e-12, String(map["财帛"].degPerYear));
    const s11 = dynamicSchedule(11),
      s20 = dynamicSchedule(20);
    add(
      "endpoint.11",
      s11[0].years === 10 && s11[1].ageStart === 21,
      JSON.stringify(s11.slice(0, 2)),
    );
    add(
      "endpoint.20",
      s20[0].years === 19 && s20[1].ageStart === 39,
      JSON.stringify(s20.slice(0, 2)),
    );
    add("no.auto", !Number.isFinite({ startAge: null }.startAge), "");
    add("wrapper.install", window.qzCalc === qzV235, "");
    return { ok: C.every((x) => x.ok), checks: C };
  }
  const TEST = selfTest();

  window.TianjiQizhengLiangtianchiV235 = Object.freeze({
    version: "1.0.0",
    build: BUILD,
    schema: SCHEMA,
    sources: () => clone(SOURCES),
    goldens: () => clone(GOLDENS),
    calibration: () => clone(CAL),
    setCalibration: (age, note) =>
      saveCal({ startAge: Number(age), source: "api-manual", note: note || "" }),
    clearCalibration: () => clearCal(),
    degreeRates: () => clone(degreeRates()),
    schedule: (age) =>
      clone(dynamicSchedule(Number.isFinite(Number(age)) ? Number(age) : CAL.startAge)),
    limitAtSui: (sui, age) =>
      clone(limitAtSui(Number(sui), Number.isFinite(Number(age)) ? Number(age) : CAL.startAge)),
    current: () => clone(calibratedCurrent()),
    report: () => clone(report()),
    selfTest: () => clone(TEST),
    manifest: () => ({
      module: "Qizheng Liangtianchi Calibration V235",
      textGoldens: [11, 15, 20],
      autoTongLimit: false,
      reason: "source grid/row is required; degree-only inference is unsafe",
      exactEndpoints: { 11: "ming years 10", 20: "ming years 19" },
      intermediate: "source-constrained interpolation only",
      postMingRates: "implemented as 30° / primary palace years under current equal-house frame",
      next: "digitize original chart/grid for full 11–20 mapping",
    }),
  });
  window.TianjiSystemV235 = {
    version: "v235",
    build: BUILD,
    qizhengLiangtianchi: true,
    autoTongLimit: false,
    postMingDegreeRates: true,
    baseline: "v234",
  };
})();
