(() => {
  "use strict";
  const BUILD = "v232 · 2026-10-06 23:04 +08:00";
  const SCHEMA = "tianji.qizheng.life-rulepack.v1";
  const MODE_KEY = "tianjipan.qizheng.life-rulepack.v232";
  const BASE_QZ = window.qzCalc || qzCalc;
  const clone = (x) => (x == null ? x : JSON.parse(JSON.stringify(x)));
  const E = (s) =>
    String(s ?? "").replace(
      /[&<>"']/g,
      (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
    );

  const SOURCES = [
    {
      id: "xingxue-dacheng-06",
      title: "《星學大成》卷六 · 安命 / 身宫",
      type: "primary-classic",
      url: "https://zh.wikisource.org/zh-hans/%E6%98%9F%E5%AD%B8%E5%A4%A7%E6%88%90_(%E5%9B%9B%E5%BA%AB%E5%85%A8%E6%9B%B8%E6%9C%AC)/%E5%8D%B706",
      rules: [
        "生时从太阳数至卯为命宫",
        "生时从太阴数至酉为身宫",
        "太阴坐处即身局被列为浅陋异说",
        "另有按实际日出寅/卯/辰修正命宫的精细主张",
      ],
    },
    {
      id: "xingxue-dacheng-04",
      title: "《星學大成》卷四 · 看星节要",
      type: "primary-classic",
      url: "https://zh.wikisource.org/zh-hans/%E6%98%9F%E5%AD%B8%E5%A4%A7%E6%88%90_(%E5%9B%9B%E5%BA%AB%E5%85%A8%E6%9B%B8%E6%9C%AC)/%E5%8D%B704",
      rules: [
        "以生时加在太阳度上数至卯，可定命在何宿何度",
        "度主为要、宫主次之",
        "昼生重命度主，夜生/特定月相重身度主",
      ],
    },
    {
      id: "xingming-suyuan-03",
      title: "《星命溯源》卷三 · 身命为元",
      type: "primary-classic",
      url: "https://zh.wikisource.org/zh-hans/%E6%98%9F%E5%91%BD%E6%BA%AF%E6%BA%90_(%E5%9B%9B%E5%BA%AB%E5%85%A8%E6%9B%B8%E6%9C%AC)/%E5%8D%B73",
      rules: [
        "命主即坐命处二十八宿所属",
        "不可徒以命宫之主为命主",
        "身主即月",
        "太阴所躔之度主亦不可舍",
      ],
    },
    {
      id: "gongdu-mapping",
      title: "宫主 / 度主传统配属表",
      type: "classical-table",
      url: "https://www.chinafengshui.com/portal.php?aid=168&mobile=no&mod=view",
      rules: [
        "子丑土、寅亥木、卯戌火、辰酉金、巳申水、午日、未月",
        "角斗奎井木；亢牛娄鬼金；氐女胃柳土；房虚昴星日；心危毕张月；尾室觜翼火；箕壁参轸水",
      ],
    },
  ];

  const PROFILES = [
    {
      id: "legacy-compatible",
      name: "Legacy Compatible",
      state: "default",
      ming: "命宫公式保持；旧 mingZhu 仍等于宫主，以兼容历史导出",
      shen: "保留 shenA(太阳类比) / shenB(太阴数酉) 双字段",
      terminology: "旧字段不删，但新增古法标准字段",
      recommendation: "兼容旧档",
    },
    {
      id: "guolao-classic",
      name: "Guolao Classic · 推荐研究口径",
      state: "recommended",
      ming: "生时从太阳躔宫数至卯；命度保留太阳宫内度数",
      shen: "生时从太阴躔宫数至酉",
      terminology: "宫主=宫分所属；命主=命度主；身主=月；身度主=太阴所躔宿之度主",
      recommendation: "Evidence 最完整",
    },
    {
      id: "moon-position-alt",
      name: "Moon Position · 历史异说",
      state: "historical-alt",
      ming: "同 Guolao Classic",
      shen: "直接以太阴所坐宫为身宫",
      terminology: "命主仍按命度主；身主仍为月",
      recommendation: "保留用于流派比较，不作默认",
    },
  ];

  const RULES = [
    {
      id: "life.ming-palace",
      status: "primary",
      claim: "生时从太阳数至卯为命宫。",
      impl: "mingIdx = sunSignIndex + 卯(3) - birthHourBranch",
      source: "xingxue-dacheng-06",
    },
    {
      id: "life.ming-degree",
      status: "primary",
      claim: "生时加在太阳“度”上数至卯，因此命宫保留太阳所在宫内度数。",
      impl: "命宫黄道段起点 + sunG.du → qzXiu → 命度",
      source: "xingxue-dacheng-04",
    },
    {
      id: "life.gong-zhu",
      status: "primary",
      claim: "宫主为十二宫宫分所属之七曜。",
      impl: "沿用 QZ_MINGZHU 表，但改称 mingGongZhu",
      source: "gongdu-mapping",
    },
    {
      id: "life.ming-zhu",
      status: "primary",
      claim: "命主不是命宫宫主；命主取坐命处二十八宿所属，实质与命度主同层。",
      impl: "mingZhuClassical = qzDuzhu(mingDuXiu.name)",
      source: "xingming-suyuan-03",
    },
    {
      id: "life.shen-palace",
      status: "primary",
      claim: "生时从太阴数至酉为身宫。",
      impl: "shenIdx = moonSignIndex + 酉(9) - birthHourBranch",
      source: "xingxue-dacheng-06",
    },
    {
      id: "life.shen-zhu",
      status: "primary",
      claim: "身主即月。",
      impl: "shenZhu = '月'",
      source: "xingming-suyuan-03",
    },
    {
      id: "life.shen-du-zhu",
      status: "primary",
      claim: "太阴所躔之度亦为身度关键。",
      impl: "shenDuXiu = qzXiu(月亮黄经); shenDuZhu=qzDuzhu(shenDuXiu)",
      source: "xingming-suyuan-03",
    },
    {
      id: "life.moon-position-alt",
      status: "historical-alt",
      claim: "太阴坐处即身宫为历史流行法，但《星学大成》明确批评其浅陋。",
      impl: "moonPositionZhi = moonG.zhi；只作可选异说",
      source: "xingxue-dacheng-06",
    },
    {
      id: "life.sunrise-correction",
      status: "pending",
      claim: "《星学大成》提出极端季节可按真实日出寅/卯/辰修正立命。",
      impl: "尚未实现；需要地理位置/历史日出定义/流派边界",
      source: "xingxue-dacheng-06",
    },
  ];

  function mode() {
    try {
      const v = localStorage.getItem(MODE_KEY);
      return PROFILES.some((x) => x.id === v) ? v : "legacy-compatible";
    } catch (_) {
      return "legacy-compatible";
    }
  }
  function setMode(v) {
    const m = PROFILES.some((x) => x.id === v) ? v : "legacy-compatible";
    try {
      localStorage.setItem(MODE_KEY, m);
    } catch (_) {}
    return m;
  }
  function idxZhi(z) {
    return QZ_GZ.indexOf(z);
  }
  function core(R0, q) {
    const sun = q?.stars?.find?.((s) => s.n === "日")?.lon ?? q?.sunLon;
    const moon = q?.stars?.find?.((s) => s.n === "月")?.lon;
    if (!Number.isFinite(sun) || !Number.isFinite(moon)) throw new Error("无法取得日月黄经");
    const sunG = qzGong(sun),
      moonG = qzGong(moon);
    const tZhi = QZ_GZ.indexOf(ZHI[R0.bz.pill[3].b]);
    const sIdx = idxZhi(sunG.zhi),
      mIdx = idxZhi(moonG.zhi);
    const mingIdx = (sIdx + 3 - tZhi + 120) % 12,
      mingZhi = QZ_GZ[mingIdx];
    const shenClassicIdx = (mIdx + 9 - tZhi + 120) % 12,
      shenZhiClassical = QZ_GZ[shenClassicIdx];
    const shenZhiMoonPosition = moonG.zhi;
    const shenZhiSolarLegacy = QZ_GZ[(9 + sIdx - tZhi + 120) % 12];
    const mingDegreeLon = norm360(QZ_H.indexOf(mingZhi) * 30 + sunG.du);
    const mingDuXiu = qzXiu(mingDegreeLon),
      mingDuZhu = qzDuzhu(mingDuXiu.name);
    const shenDuXiu = qzXiu(moon),
      shenDuZhu = qzDuzhu(shenDuXiu.name);
    const shenGongDegreeLon = norm360(QZ_H.indexOf(shenZhiClassical) * 30 + moonG.du);
    const shenGongDuXiu = qzXiu(shenGongDegreeLon);
    return {
      sunG,
      moonG,
      tZhi,
      mingZhi,
      mingDegreeLon,
      mingDuXiu,
      mingDuZhu,
      mingGongZhu: QZ_MINGZHU[mingZhi],
      mingZhuClassical: mingDuZhu,
      shenZhiClassical,
      shenZhiMoonPosition,
      shenZhiSolarLegacy,
      shenGongZhu: QZ_MINGZHU[shenZhiClassical],
      shenZhu: "月",
      shenDuXiu,
      shenDuZhu,
      shenGongDegreeLon,
      shenGongDuXiu,
      shenGongDuZhu: qzDuzhu(shenGongDuXiu.name),
    };
  }
  function augment(q, R0, m = mode()) {
    if (!q) return q;
    let c;
    try {
      c = core(R0, q);
    } catch (err) {
      q.__lifeRulePack = { mode: m, error: String(err?.message || err) };
      return q;
    }
    Object.assign(q, c);
    q.mingZhuLegacy = q.mingZhu;
    q.shenLegacySolar = q.shenA;
    q.shenLegacyMoonToYou = q.shenB;
    if (m === "guolao-classic") {
      q.mingZhu = c.mingZhuClassical;
      q.shenZhi = c.shenZhiClassical;
      q.shenSelected = c.shenZhiClassical;
      q.shenPolicy = "moon-to-you";
    } else if (m === "moon-position-alt") {
      q.mingZhu = c.mingZhuClassical;
      q.shenZhi = c.shenZhiMoonPosition;
      q.shenSelected = c.shenZhiMoonPosition;
      q.shenPolicy = "moon-position";
    } else {
      q.shenZhi = c.shenZhiClassical;
      q.shenSelected = c.shenZhiClassical;
      q.shenPolicy = "legacy-display/classic-metadata";
    }
    q.__lifeRulePack = {
      mode: m,
      provider: PROFILES.find((x) => x.id === m)?.name,
      terminology: m === "legacy-compatible" ? "legacy-field-compatible" : "classical-terms",
      mingFormula: "sun-to-mao",
      shenFormula: m === "moon-position-alt" ? "moon-position" : "moon-to-you",
      classical: {
        mingGongZhu: c.mingGongZhu,
        mingZhu: c.mingZhuClassical,
        mingDuZhu: c.mingDuZhu,
        shenZhi: c.shenZhiClassical,
        shenZhu: "月",
        shenDuZhu: c.shenDuZhu,
      },
    };
    return q;
  }
  function lifeQz(R0) {
    return augment(BASE_QZ(R0), R0, mode());
  }
  function install() {
    try {
      window.qzCalc = lifeQz;
      qzCalc = lifeQz;
      return true;
    } catch (_) {
      try {
        window.qzCalc = lifeQz;
        return true;
      } catch (__) {
        return false;
      }
    }
  }
  install();

  function currentR() {
    try {
      return typeof R !== "undefined" ? R : null;
    } catch (_) {
      return null;
    }
  }
  function auditCurrent() {
    const r = currentR();
    if (!r?.bz) return { available: false, reason: "请先建立档案并排盘" };
    const base = BASE_QZ(r),
      c = core(r, base);
    return {
      available: true,
      mode: mode(),
      input: {
        hourBranch: ZHI[r.bz.pill[3].b],
        sunSign: c.sunG.zhi,
        sunDegree: c.sunG.du,
        moonSign: c.moonG.zhi,
        moonDegree: c.moonG.du,
      },
      ming: {
        palace: c.mingZhi,
        degreeLon: c.mingDegreeLon,
        degreeXiu: c.mingDuXiu,
        gongZhu: c.mingGongZhu,
        classicalMingZhu: c.mingZhuClassical,
        legacyMingZhu: base.mingZhu,
      },
      shen: {
        classicalMoonToYou: c.shenZhiClassical,
        historicalMoonPosition: c.shenZhiMoonPosition,
        legacySolarAnalogy: c.shenZhiSolarLegacy,
        shenZhu: "月",
        shenDuXiu: c.shenDuXiu,
        shenDuZhu: c.shenDuZhu,
        shenGongZhu: c.shenGongZhu,
        shenGongDegreeXiu: c.shenGongDuXiu,
        shenGongDegreeZhu: c.shenGongDuZhu,
      },
    };
  }
  function sourceHTML() {
    return SOURCES.map(
      (s) =>
        `<div class="q232-item good"><b>${E(s.title)}</b><small>${E(s.rules.join("；"))}<br><span class="q232-code">${E(s.url)}</span></small><div class="q232-badges"><span class="q232-badge good">${E(s.type)}</span></div></div>`,
    ).join("");
  }
  function profileHTML() {
    const m = mode();
    return PROFILES.map(
      (p) =>
        `<div class="q232-item ${p.id === m ? "good" : p.state === "recommended" ? "cyan" : "warn"}"><b>${E(p.name)}</b><small>命：${E(p.ming)}<br>身：${E(p.shen)}<br>术语：${E(p.terminology)}</small><div class="q232-badges"><span class="q232-badge ${p.id === m ? "good" : p.state === "recommended" ? "cyan" : "gold"}">${p.id === m ? "SELECTED" : E(p.state)}</span><span class="q232-badge">${E(p.recommendation)}</span></div></div>`,
    ).join("");
  }
  function rulesHTML() {
    return `<div class="q232-tablewrap"><table class="q232-table"><thead><tr><th>规则</th><th>Evidence</th><th>原典支持</th><th>实现</th></tr></thead><tbody>${RULES.map((r) => `<tr><td><span class="q232-code">${E(r.id)}</span></td><td><span class="q232-state ${r.status === "primary" ? "good" : r.status === "pending" ? "warn" : "cyan"}">${E(r.status)}</span></td><td>${E(r.claim)}</td><td>${E(r.impl)}</td></tr>`).join("")}</tbody></table></div>`;
  }
  function auditHTML(A) {
    if (!A?.available) return `<div class="q232-note">${E(A?.reason || "暂无当前盘")}</div>`;
    const m = A.ming,
      s = A.shen;
    return `<div class="q232-list">
  <div class="q232-item good"><b>命宫 ${E(m.palace)} · ${E(m.degreeXiu.name)}${Number(m.degreeXiu.du).toFixed(2)}°</b><small>宫主 ${E(m.gongZhu)} · 古法命主/命度主 ${E(m.classicalMingZhu)} · 旧字段 mingZhu=${E(m.legacyMingZhu)}。${m.gongZhu !== m.classicalMingZhu ? "本盘可直接看到“宫主≠命主”，V232 不再混称。" : "本盘恰好宫主与命度主同曜，但概念仍分开。"}</small></div>
  <div class="q232-item good"><b>古法身宫 ${E(s.classicalMoonToYou)} · 身主 月 · 身度主 ${E(s.shenDuZhu)}</b><small>太阴当前躔 ${E(s.shenDuXiu.name)}${Number(s.shenDuXiu.du).toFixed(2)}°；身宫宫主 ${E(s.shenGongZhu)}。</small></div>
  <div class="q232-item cyan"><b>身宫三口径并列</b><small>太阴数酉：${E(s.classicalMoonToYou)} · 太阴坐处：${E(s.historicalMoonPosition)} · 旧版太阳类比：${E(s.legacySolarAnalogy)}。只有第一项目前标为 primary。</small></div>
 </div>`;
  }
  function panel() {
    const A = auditCurrent(),
      m = mode();
    return `<section class="q232" id="q232LifeRulePack">
  <section class="q232-hero"><div class="q232-head"><div><h3>V232 · 命身宫主度主 Rule Pack / 果老术语校正</h3><p>这一步不是加新花样，而是修正七政四余里一个会影响整套解释链的概念混用：古法“命主”并不等于命宫“宫主”。V232 把命宫、命度、宫主、命主、身宫、身主、身度主拆成独立字段，并给身宫保留三套历史/兼容口径。默认仍兼容旧字段，Guolao Classic 作为 Evidence 更完整的可选口径。</p></div><span class="q232-schema">${SCHEMA}</span></div>
   <div class="q232-tools"><label>命身 Rule Pack <select id="q232Mode"><option value="legacy-compatible"${m === "legacy-compatible" ? " selected" : ""}>Legacy Compatible · 默认</option><option value="guolao-classic"${m === "guolao-classic" ? " selected" : ""}>Guolao Classic · 推荐研究</option><option value="moon-position-alt"${m === "moon-position-alt" ? " selected" : ""}>Moon Position · 历史异说</option></select></label><button class="primary" id="q232Refresh" type="button">刷新当前盘</button><button class="legacy" id="q232Legacy" type="button"${m === "legacy-compatible" ? " disabled" : ""}>恢复兼容口径</button><button id="q232Export" type="button">导出 Rule Pack Report</button></div>
  </section>
  <div class="q232-kpis">
   <div class="q232-kpi ${m === "legacy-compatible" ? "good" : "cyan"}"><small>当前口径</small><b>${m === "legacy-compatible" ? "LEGACY" : m === "guolao-classic" ? "GUOLAO" : "MOON POS"}</b></div>
   <div class="q232-kpi good"><small>命宫主公式</small><b>SUN→卯</b></div>
   <div class="q232-kpi good"><small>古法身宫</small><b>MOON→酉</b></div>
   <div class="q232-kpi cyan"><small>宫主/命主</small><b>SEPARATED</b></div>
   <div class="q232-kpi good"><small>身主</small><b>月</b></div>
   <div class="q232-kpi gold"><small>日出修正</small><b>PENDING</b></div>
  </div>
  <div class="q232-grid">
   <section class="q232-card"><h4>一、当前档案术语审计</h4><div id="q232Audit">${auditHTML(A)}</div></section>
   <aside class="q232-card"><h4>二、Rule Pack Profiles</h4><div class="q232-list">${profileHTML()}</div></aside>
  </div>
  <section class="q232-card"><h4>三、规则账本 · 原典 → 字段 → 实现</h4>${rulesHTML()}</section>
  <div class="q232-grid">
   <section class="q232-card"><h4>四、Primary Evidence</h4><div class="q232-list">${sourceHTML()}</div></section>
   <aside class="q232-card"><h4>五、V232 结论</h4><div class="q232-list">
    <div class="q232-item good"><b>命宫算法：当前主公式有原典支持</b><small>现有 mingIdx 本质就是“生时从太阳数至卯”；卯时出生时命宫等于太阳所在宫，午时太阳在酉则命宫在午，公式自洽。</small></div>
    <div class="q232-item bad"><b>旧“命主=宫主”术语：正式判定为不严谨</b><small>QZ_MINGZHU 表本身是传统宫主表，没有错；错在旧 UI 把它叫“命主”。V232 保留字段兼容，同时新增 mingGongZhu 与 mingZhuClassical。</small></div>
    <div class="q232-item good"><b>身宫：太阴数酉升级为 primary</b><small>旧 shenB 实际就是原典主口径；旧 shenA 的太阳类比不再与它并列称“两说”。太阴坐处法保留为历史异说。</small></div>
    <div class="q232-item warn"><b>更精细的“真实日出修正”暂不启用</b><small>《星学大成》卷六确有冬夏日出寅/辰修正主张，但需要把地理纬度、历史日出时刻与传统“卯”定义一起版本化。没有完成前不擅自改主公式。</small></div>
   </div></aside>
  </div>
 </section>`;
  }
  function report() {
    return {
      schema: SCHEMA,
      build: BUILD,
      generatedAt: new Date().toISOString(),
      selected: mode(),
      profiles: clone(PROFILES),
      sources: clone(SOURCES),
      rules: clone(RULES),
      current: auditCurrent(),
      decision: {
        default: "legacy-compatible",
        recommendedResearch: "guolao-classic",
        terminologyMigration: {
          old: "mingZhu=palace ruler",
          classical: "mingGongZhu=palace ruler; mingZhuClassical=mingDuZhu",
        },
        classicalShen: "moon-to-you",
        moonPosition: "historical-alt",
        solarShenLegacy: "compatibility-only",
        sunriseCorrection: "pending",
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
      pane.querySelector("#q231ResidualProvider") ||
      pane.querySelector("#q230AbsoluteZero") ||
      pane.firstElementChild;
    const old = pane.querySelector("#q232LifeRulePack"),
      tmp = document.createElement("div");
    tmp.innerHTML = panel();
    const fresh = tmp.firstElementChild;
    if (old) old.replaceWith(fresh);
    else if (anchor) anchor.insertAdjacentElement("beforebegin", fresh);
    else pane.appendChild(fresh);
  }
  document.addEventListener(
    "change",
    (e) => {
      if (e.target?.id === "q232Mode") {
        setMode(e.target.value);
        try {
          refRender("qizheng");
        } catch (_) {}
        TianjiPaneScheduler.request("qizheng");
      }
    },
    true,
  );
  document.addEventListener(
    "click",
    (e) => {
      if (e.target?.id === "q232Refresh") {
        mount();
        return;
      }
      if (e.target?.id === "q232Legacy") {
        setMode("legacy-compatible");
        try {
          refRender("qizheng");
        } catch (_) {}
        TianjiPaneScheduler.request("qizheng");
        return;
      }
      if (e.target?.id === "q232Export") {
        save("天机盘_V232_命身RulePackReport.json", report());
        return;
      }
    },
    true,
  );

  TianjiPaneScheduler.register("qizheng", "v232-life-rulepack-js", mount);

  try {
    if (window.TianjiCore) {
      TianjiCore.registerSource({
        id: "qizheng-life-primary-v232",
        type: "classic",
        title: "《星學大成》卷四/卷六 + 《星命溯源》卷三",
        version: "四庫全書本",
        license: "public-domain-classic",
        note: "命宫太阳数卯、身宫太阴数酉、命主与宫主区分、身主与身度主。",
      });
      TianjiCore.registerRule({
        id: "qizheng.life.gong-du-zhu.v1",
        system: "qizheng",
        source: "qizheng-life-primary-v232",
        title: "命身宫主度主 Rule Pack",
        status: "verified-declared-scope",
        note: "宫主/命主/命度主/身主/身度主拆分；默认兼容旧字段，Guolao Classic 可显式选择。",
      });
      TianjiCore.registerEngine(
        {
          id: "qizheng.life.rulepack.v1",
          system: "qizheng",
          name: "Qizheng Life Rule Pack",
          version: "1.0.0",
          source: "qizheng-life-primary-v232",
          doctrine: "legacy-compatible / guolao-classic / moon-position-alt",
          status: "active",
        },
        () => report(),
      );
    }
  } catch (err) {
    console.warn("[V232 registry]", err);
  }

  const TASKS232 = [
    { id: "ai", p: "P0", name: "统一 AI 解释层", state: "done", note: "v171 完成" },
    { id: "mcp", p: "P0", name: "MCP / API 外部调用层", state: "done", note: "v172 完成" },
    {
      id: "kg",
      p: "P0",
      name: "典籍 Evidence / 规则知识图谱",
      state: "done",
      note: "v173 第一阶段；持续扩充奇门与七政四余原典链",
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
      note: "V224–V231 已完成可靠星历、四余三轨 Provider、明代宿界与万历绝对锚点。V232 完成命宫/命度/宫主/命主/身宫/身主/身度主 Rule Pack，并修正旧 UI“命主=宫主”的术语混用；古法太阴数酉身宫升级为 primary，太阳类比降为兼容审计。剩余：庙旺喜乐 / 十干化曜 / 昼夜喜曜 Rule Pack，以及四余第二历史锚点长期漂移验证。",
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
  const BOARD232 = {
    schema: "tianji.priority.board.v1",
    build: BUILD,
    total: 14,
    done: 12,
    doing: 2,
    blocked: 0,
    progress: 92.9,
    next: [
      "V233 七政强弱规则包：庙 / 旺 / 喜 / 乐 / 昼夜喜曜 / 十干化曜逐表 provenance",
      "四余第二历史绝对锚点 / 长期相位漂移验证",
      "七政行限前置：命宫限年数与洞微百六限原典",
      "奇门日家完整盘 / 月家逐宫扩样",
    ],
    tasks: TASKS232,
  };
  function applyBoard() {
    window.TianjiPriorityBoard = Object.freeze({
      schema: BOARD232.schema,
      snapshot: () => clone(BOARD232),
    });
    const road = window.TianjiRoadmap || {};
    window.TianjiRoadmap = Object.freeze(
      Object.assign({}, road, {
        urgentImportant: clone(BOARD232),
        nextMainline: clone(BOARD232.next),
      }),
    );
  }
  applyBoard();
  window.addEventListener("tianji:lazy-ready", () => setTimeout(applyBoard, 0));

  function selfTest() {
    const C = [],
      add = (id, ok, d = "") => C.push({ id, ok: !!ok, d });
    add("base.capture", typeof BASE_QZ === "function", "");
    add("profiles", PROFILES.length === 3, String(PROFILES.length));
    add(
      "rules.primary",
      RULES.filter((x) => x.status === "primary").length === 7,
      String(RULES.filter((x) => x.status === "primary").length),
    );
    add(
      "gong.mapping",
      QZ_MINGZHU["子"] === "土" && QZ_MINGZHU["午"] === "日" && QZ_MINGZHU["未"] === "月",
      "",
    );
    add(
      "du.mapping",
      qzDuzhu("角") === "木" &&
        qzDuzhu("亢") === "金" &&
        qzDuzhu("心") === "月" &&
        qzDuzhu("尾") === "火",
      "",
    );
    /* 公式金样：午时(t=午 index6)，太阳在酉(index9) => 命宫午(index6)。 */
    const ming = (9 + 3 - 6 + 120) % 12;
    add("ming.formula.example", QZ_GZ[ming] === "午", QZ_GZ[ming]);
    /* 酉时出生时，太阴数酉 => 身宫等于太阴所在宫。 */
    const shen = (4 + 9 - 9 + 120) % 12;
    add("shen.formula.identity", QZ_GZ[shen] === QZ_GZ[4], `${QZ_GZ[shen]}/${QZ_GZ[4]}`);
    add("wrapper.install", window.qzCalc === lifeQz, "");
    return { ok: C.every((x) => x.ok), checks: C };
  }
  const TEST = selfTest();

  window.TianjiQizhengLifeRulePackV232 = Object.freeze({
    version: "1.0.0",
    build: BUILD,
    schema: SCHEMA,
    sources: () => clone(SOURCES),
    profiles: () => clone(PROFILES),
    rules: () => clone(RULES),
    mode,
    setMode: (v) => {
      const m = setMode(v);
      try {
        refRender("qizheng");
      } catch (_) {}
      return m;
    },
    auditCurrent: () => clone(auditCurrent()),
    calc: (R0, m) => clone(augment(BASE_QZ(R0 || currentR()), R0 || currentR(), m || mode())),
    report: () => clone(report()),
    selfTest: () => clone(TEST),
    manifest: () => ({
      module: "Qizheng Life Rule Pack V232",
      default: "legacy-compatible",
      recommendedResearch: "guolao-classic",
      verified: [
        "sun-to-mao ming palace",
        "sun intra-sign degree -> ming degree",
        "palace ruler table",
        "classical mingzhu=degree ruler",
        "moon-to-you shen palace",
        "shen lord=moon",
        "shen degree ruler from lunar mansion",
      ],
      historicalAlt: "moon-position",
      compatibilityOnly: "legacy solar-to-you body analogy",
      pending: "seasonal/local sunrise correction doctrine",
      qzCalcWrapped: true,
    }),
  });
  window.TianjiSystemV232 = {
    version: "v232",
    build: BUILD,
    qizhengLifeRulePack: true,
    terminologyCorrected: true,
    defaultLifeRule: "legacy-compatible",
    baseline: "v231",
  };
})();
