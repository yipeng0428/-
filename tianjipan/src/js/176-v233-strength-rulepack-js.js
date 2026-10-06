(() => {
  "use strict";
  const BUILD = "v233 · 2026-10-06 23:41 +08:00";
  const SCHEMA = "tianji.qizheng.strength-rulepack.v1";
  const MODE_KEY = "tianjipan.qizheng.strength-rulepack.v233";
  const BASE_QZ = window.qzCalc || qzCalc;
  const clone = (x) => (x == null ? x : JSON.parse(JSON.stringify(x)));
  const E = (s) =>
    String(s ?? "").replace(
      /[&<>"']/g,
      (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
    );

  const SOURCES = [
    {
      id: "zhangguo-581",
      title: "《钦定古今图书集成》艺术典第581卷 · 张果星宗十五",
      type: "primary-classic",
      url: "https://zh.wikisource.org/zh-hans/%E6%AC%BD%E5%AE%9A%E5%8F%A4%E4%BB%8A%E5%9C%96%E6%9B%B8%E9%9B%86%E6%88%90/%E5%8D%9A%E7%89%A9%E5%BD%99%E7%B7%A8/%E8%97%9D%E8%A1%93%E5%85%B8/%E7%AC%AC581%E5%8D%B7",
      supports: ["入庙", "乘旺", "乐宫", "喜宫", "殿垣", "度数"],
      note: "V233 的张果 Primary 庙旺喜乐核心表以此为主；文本本身存在“太阳戌/天尾戌”等抄录异文风险，争议单元不强行静默消解。",
    },
    {
      id: "sanchentongzai",
      title: "《三辰通载》 · 论庙旺克忌",
      type: "classical-transcription",
      url: "https://www.shidianguji.com/mid-page/7592732595278168115",
      supports: ["庙旺乐喜结构", "四余乐宫：罗午、计子、紫戌、孛辰"],
      note: "用于补足《图书集成》节录中未列出的四余乐宫；喜宫仍以七政为主。",
    },
    {
      id: "zhangguo-567",
      title: "《钦定古今图书集成》艺术典第567卷 · 张果星宗一",
      type: "primary-classic",
      url: "https://zh.wikisource.org/zh-hans/%E6%AC%BD%E5%AE%9A%E5%8F%A4%E4%BB%8A%E5%9C%96%E6%9B%B8%E9%9B%86%E6%88%90/%E5%8D%9A%E7%89%A9%E5%BD%99%E7%B7%A8/%E8%97%9D%E8%A1%93%E5%85%B8/%E7%AC%AC567%E5%8D%B7",
      supports: ["明/晦昼夜分组", "四时旺衰"],
      note: "明确：昼生日木土水炁计孛、夜生月火金罗为“向明”；反之为“背曜”。另载春木夏火秋金冬水四季土为旺，春土夏金秋木冬火四季水为衰。",
    },
    {
      id: "zhangguo-568",
      title: "《钦定古今图书集成》艺术典第568卷 · 张果星宗二 · 变曜",
      type: "primary-classic",
      url: "https://zh.wikisource.org/zh-hans/%E6%AC%BD%E5%AE%9A%E5%8F%A4%E4%BB%8A%E5%9C%96%E6%9B%B8%E9%9B%86%E6%88%90/%E5%8D%9A%E7%89%A9%E5%BD%99%E7%B7%A8/%E8%97%9D%E8%A1%93%E5%85%B8/%E7%AC%AC568%E5%8D%B7",
      supports: ["甲火乙孛丙木丁金戊土己月庚水辛炁壬计癸罗", "禄暗福耗荫贵刑印囚权完整十变曜循环"],
      note: "证明旧 QZ_HY 只是“天禄起星”，完整变曜必须展开十曜，而不是只显示一颗“化曜”。",
    },
  ];

  const LEGACY = Object.fromEntries(
    Object.entries(QZ_XL).map(([k, v]) => [
      k,
      {
        m: [v.m].filter(Boolean),
        w: [...(v.w || [])],
        x: [v.x].filter(Boolean),
        l: [...(v.l || [])],
      },
    ]),
  );

  /* 张果 Primary：
   - 七政以《图书集成》581为主；
   - 四余的庙/旺来自同卷，乐宫用《三辰通载》补足；
   - 四余“喜”早期表未形成同等级完整表，故留空，不使用后世网络整合表静默补齐。
   - “旺戌”原文转录有太阳/天尾异文，本严格表暂不采该争议格。 */
  const CLASSIC = {
    日: { m: ["戌"], w: ["巳"], x: ["寅"], l: ["午"] },
    月: { m: ["戌"], w: ["酉"], x: ["卯"], l: ["未"] },
    水: { m: ["午"], w: ["子", "巳"], x: ["辰"], l: ["巳", "申"] },
    金: { m: ["辰"], w: ["午", "亥"], x: ["巳"], l: ["辰", "酉"] },
    火: { m: ["卯"], w: ["丑"], x: ["申"], l: ["卯", "戌"] },
    木: { m: ["亥"], w: ["未", "亥"], x: ["未"], l: ["寅", "亥"] },
    土: { m: ["丑"], w: ["卯", "辰"], x: ["午"], l: ["子", "丑"] },
    紫炁: { m: ["申"], w: ["申"], x: [], l: ["戌"] },
    月孛: { m: ["未"], w: ["寅"], x: [], l: ["辰"] },
    罗睺: { m: ["寅", "午"], w: ["卯"], x: [], l: ["午"] },
    计都: { m: ["巳", "亥"], w: ["卯"], x: [], l: ["子"] },
  };

  const VARIANTS = [
    {
      id: "旺戌",
      topic: "乘旺戌宫",
      primary: "《图书集成》转录作“太阴在酉太阳戌”",
      variant: "大量后世抄本/网页作“太阴在酉天尾戌”；天尾通常指计都。",
      decision: "V233 strict profile 暂不把戌加入日或计的旺表，等待底本影像核校。",
    },
    {
      id: "月喜",
      topic: "太阴喜宫",
      primary: "《图书集成》《三辰通载》作“日寅月卯”",
      variant: "部分后世《星曜喜宫歌》转录作“日寅月亥”。",
      decision: "张果 Primary 取卯；Legacy 继续保留亥。",
    },
    {
      id: "金喜",
      topic: "金星喜宫",
      primary: "《图书集成》《三辰通载》明确“金居巳上”",
      variant: "部分后世转录省去金喜巳并加入罗戌。",
      decision: "张果 Primary 加金喜巳；Legacy 不改。",
    },
    {
      id: "孛阴阳",
      topic: "月孛昼夜属性",
      primary: "“明/晦”操作条把孛列在昼生向明组",
      variant: "同类文献另有段落把孛归阴曜的异文。",
      decision: "V233 明晦计算采用明确的“明/晦”操作条；冲突写入 Evidence，不宣称宇宙本体分类唯一。",
    },
  ];

  const PROFILES = [
    {
      id: "legacy-compatible",
      name: "Legacy Compatible",
      state: "default",
      note: "原 QZ_XL 七政表完全不动；四余仍显示“—”。适合旧档兼容。",
    },
    {
      id: "zhangguo-primary",
      name: "Zhangguo Primary · 严格原典",
      state: "recommended",
      note: "按《张果星宗》+《三辰通载》重建庙旺喜乐；月喜卯、金喜巳；四余补庙旺乐，喜宫不做无证据补齐；争议“旺戌”留空。",
    },
  ];

  const DAY_FAV = ["日", "木", "土", "水", "紫炁", "计都", "月孛"];
  const NIGHT_FAV = ["月", "火", "金", "罗睺"];
  const SEASON = {
    春: { 旺: ["木"], 衰: ["土"] },
    夏: { 旺: ["火"], 衰: ["金"] },
    秋: { 旺: ["金"], 衰: ["木"] },
    冬: { 旺: ["水"], 衰: ["火"] },
    四季: { 旺: ["土"], 衰: ["水"], status: "rule-verified-window-pending" },
  };
  const BIAN_ROLES = ["禄", "暗", "福", "耗", "荫", "贵", "刑", "印", "囚", "权"];
  const BIAN_STARS = ["火", "月孛", "木", "金", "土", "月", "水", "紫炁", "计都", "罗睺"];
  const STEMS = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"];
  const BIAN_PALACE = {
    禄: "官禄",
    暗: "相貌",
    福: "财帛/福德/迁移",
    耗: "兄弟",
    荫: "妻妾",
    贵: "男女",
    刑: "奴仆",
    印: "田宅",
    囚: "疾厄",
    权: "命宫",
  };

  function mode() {
    try {
      return localStorage.getItem(MODE_KEY) === "zhangguo-primary"
        ? "zhangguo-primary"
        : "legacy-compatible";
    } catch (_) {
      return "legacy-compatible";
    }
  }
  function setMode(v) {
    const m = v === "zhangguo-primary" ? "zhangguo-primary" : "legacy-compatible";
    try {
      localStorage.setItem(MODE_KEY, m);
    } catch (_) {}
    return m;
  }
  function tbl(m = mode()) {
    return m === "zhangguo-primary" ? CLASSIC : LEGACY;
  }
  function strength(name, zhi, m = mode()) {
    const t = tbl(m)[name];
    if (!t) return { label: "—", hits: [], profile: m };
    const hits = [];
    if ((t.m || []).includes(zhi)) hits.push("庙");
    if ((t.w || []).includes(zhi)) hits.push("旺");
    if ((t.x || []).includes(zhi)) hits.push("喜");
    if ((t.l || []).includes(zhi)) hits.push("乐");
    return { label: hits.join("") || "平", hits, profile: m };
  }
  function bianYao(stem) {
    const base = STEMS.indexOf(stem);
    if (base < 0) return [];
    return BIAN_ROLES.map((role, i) => ({
      role: "天" + role,
      short: role,
      star: BIAN_STARS[(base + i) % 10],
      palace: BIAN_PALACE[role],
    }));
  }
  function dayNight(q) {
    if (q.isDay === true)
      return {
        status: "day",
        label: "昼生",
        favored: clone(DAY_FAV),
        back: clone(NIGHT_FAV),
        source: "张果星宗·明晦",
      };
    if (q.isDay === false)
      return {
        status: "night",
        label: "夜生",
        favored: clone(NIGHT_FAV),
        back: clone(DAY_FAV),
        source: "张果星宗·明晦",
      };
    return {
      status: "unknown",
      label: "昼夜未定",
      favored: [],
      back: [],
      source: "missing-solar-altitude",
    };
  }
  function augment(q, R0, m = mode()) {
    if (!q) return q;
    q.strengthProfile = m;
    q.stars.forEach((s) => {
      s.xlLegacy = s.xl;
      const v = strength(s.n, s.gong?.zhi, m);
      s.strengthV233 = v;
      if (m === "zhangguo-primary") s.xl = v.label;
    });
    const dn = dayNight(q);
    q.dayNightV233 = dn;
    q.dayFavored = dn.favored;
    q.dayBack = dn.back;
    const season = qzSeason(q.sunLon),
      sr = SEASON[season];
    q.seasonRuleV233 = { season, rule: clone(sr), fourSeason: clone(SEASON["四季"]) };
    q.seasonStrengthText = sr ? `${sr.旺.join("、")}旺，${sr.衰.join("、")}衰` : "—";
    q.bianYao = bianYao(q.yearStem);
    q.tianLuStar = q.bianYao[0]?.star || q.huaYao;
    q.huaYaoLegacy = q.huaYao;
    q.huaYao = q.tianLuStar;
    q.bianYaoText = q.bianYao.map((x) => `${x.role}${x.star}`).join(" · ");
    q.__strengthRulePack = {
      mode: m,
      provider: PROFILES.find((x) => x.id === m)?.name,
      dayNight: clone(dn),
      seasonal: clone(q.seasonRuleV233),
      bianYaoSource: "zhangguo-568",
      legacyCompatible: m === "legacy-compatible",
    };
    return q;
  }
  function strengthQz(R0) {
    return augment(BASE_QZ(R0), R0, mode());
  }
  function install() {
    try {
      window.qzCalc = strengthQz;
      qzCalc = strengthQz;
      return true;
    } catch (_) {
      try {
        window.qzCalc = strengthQz;
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
  function tableRows(table) {
    const names = ["日", "月", "水", "金", "火", "木", "土", "紫炁", "月孛", "罗睺", "计都"];
    return names.map((n) => ({
      name: n,
      m: (table[n]?.m || []).join(" "),
      w: (table[n]?.w || []).join(" "),
      x: (table[n]?.x || []).join(" "),
      l: (table[n]?.l || []).join(" "),
    }));
  }
  function diffAudit() {
    const names = ["日", "月", "水", "金", "火", "木", "土"];
    const diffs = [];
    for (const n of names) {
      for (const k of ["m", "w", "x", "l"]) {
        const a = [...(LEGACY[n]?.[k] || [])].sort().join(""),
          b = [...(CLASSIC[n]?.[k] || [])].sort().join("");
        if (a !== b)
          diffs.push({
            name: n,
            field: { m: "庙", w: "旺", x: "喜", l: "乐" }[k],
            legacy: a || "—",
            classic: b || "—",
          });
      }
    }
    return diffs;
  }
  function currentAudit() {
    const r = currentR();
    if (!r?.bz) return { available: false, reason: "请先建立档案并排盘" };
    const q = strengthQz(r);
    return {
      available: true,
      mode: mode(),
      dayNight: q.dayNightV233,
      season: q.seasonRuleV233,
      yearStem: q.yearStem,
      tianLuStar: q.tianLuStar,
      bianYao: clone(q.bianYao),
      stars: q.stars.map((s) => ({
        name: s.n,
        zhi: s.gong?.zhi,
        label: s.xl,
        legacy: s.xlLegacy,
        profile: s.strengthV233?.profile,
      })),
    };
  }
  function sourceHTML() {
    return SOURCES.map(
      (s) =>
        `<div class="q233-item good"><b>${E(s.title)}</b><small>${E(s.supports.join("；"))}<br>${E(s.note)}<br><span class="q233-code">${E(s.url)}</span></small><div class="q233-badges"><span class="q233-badge good">${E(s.type)}</span></div></div>`,
    ).join("");
  }
  function variantsHTML() {
    return VARIANTS.map(
      (v) =>
        `<div class="q233-item warn"><b>${E(v.topic)}</b><small><strong>主文本：</strong>${E(v.primary)}<br><strong>异文：</strong>${E(v.variant)}<br><strong>V233：</strong>${E(v.decision)}</small></div>`,
    ).join("");
  }
  function profilesHTML() {
    const m = mode();
    return PROFILES.map(
      (p) =>
        `<div class="q233-item ${p.id === m ? "good" : p.state === "recommended" ? "cyan" : "warn"}"><b>${E(p.name)}</b><small>${E(p.note)}</small><div class="q233-badges"><span class="q233-badge ${p.id === m ? "good" : p.state === "recommended" ? "cyan" : "gold"}">${p.id === m ? "SELECTED" : E(p.state)}</span></div></div>`,
    ).join("");
  }
  function strengthTableHTML() {
    const rows = tableRows(CLASSIC);
    return `<div class="q233-tablewrap"><table class="q233-table"><thead><tr><th>曜</th><th>庙</th><th>旺</th><th>喜</th><th>乐</th><th>Evidence 状态</th></tr></thead><tbody>${rows.map((r) => `<tr><td><b>${E(r.name)}</b></td><td>${E(r.m || "—")}</td><td>${E(r.w || "—")}</td><td>${E(r.x || "—")}</td><td>${E(r.l || "—")}</td><td><span class="q233-state ${["紫炁", "月孛", "罗睺", "计都"].includes(r.name) && !r.x ? "warn" : "good"}">${["紫炁", "月孛", "罗睺", "计都"].includes(r.name) && !r.x ? "喜宫未补" : "primary/combined"}</span></td></tr>`).join("")}</tbody></table></div>`;
  }
  function bianHTML(stem) {
    const rows = bianYao(stem || "甲");
    return `<div class="q233-tablewrap"><table class="q233-table"><thead><tr><th>次序</th><th>变曜</th><th>星</th><th>所属宫义</th></tr></thead><tbody>${rows.map((x, i) => `<tr><td>${i + 1}</td><td><b>${E(x.role)}</b></td><td>${E(x.star)}</td><td>${E(x.palace)}</td></tr>`).join("")}</tbody></table></div>`;
  }
  function currentHTML(A) {
    if (!A?.available) return `<div class="q233-note">${E(A?.reason || "暂无当前盘")}</div>`;
    return `<div class="q233-list">
  <div class="q233-item ${A.dayNight.status === "unknown" ? "warn" : "good"}"><b>${E(A.dayNight.label)} · 向明组 ${E(A.dayNight.favored.join(" ") || "—")}</b><small>${A.dayNight.status === "unknown" ? "太阳高度未取到，因此不再像旧版那样把 null 自动当成夜生。" : "背曜组 " + A.dayNight.back.join(" ")}</small></div>
  <div class="q233-item good"><b>${E(A.yearStem)}干 · 天禄${E(A.tianLuStar)}</b><small>${E(A.bianYao.map((x) => x.role + x.star).join(" · "))}</small></div>
  <div class="q233-item cyan"><b>${E(A.season.season)}季 · ${E(A.season.rule?.旺?.join("、") || "—")}旺 / ${E(A.season.rule?.衰?.join("、") || "—")}衰</b><small>“四季土旺、水衰”规则已登记，但辰戌丑未的精确 live 窗口仍 pending。</small></div>
 </div>`;
  }
  function diffHTML() {
    const D = diffAudit();
    return `<div class="q233-tablewrap"><table class="q233-table"><thead><tr><th>曜</th><th>项</th><th>Legacy</th><th>张果 Primary</th><th>处理</th></tr></thead><tbody>${D.map((x) => `<tr><td><b>${E(x.name)}</b></td><td>${E(x.field)}</td><td>${E(x.legacy)}</td><td>${E(x.classic)}</td><td><span class="q233-state warn">不静默迁移</span></td></tr>`).join("")}</tbody></table></div>`;
  }
  function panel() {
    const A = currentAudit(),
      m = mode();
    return `<section class="q233" id="q233StrengthRulePack">
  <section class="q233-hero"><div class="q233-head"><div><h3>V233 · 七政强弱变曜 Rule Pack / 庙旺喜乐明晦 Evidence</h3><p>把七政页面里三个过去“看起来像常量、其实属于流派规则”的层次正式拆出来：庙旺喜乐、昼夜明晦、十干变曜。V233 发现旧 QZ_XL 大体可靠，但月喜、金喜与原典有明确差异；旧 QZ_HY 本身正确，却只是完整十变曜的起点。默认继续兼容旧盘，张果 Primary 必须显式选择。</p></div><span class="q233-schema">${SCHEMA}</span></div>
   <div class="q233-tools"><label>强弱 Rule Pack <select id="q233Mode"><option value="legacy-compatible"${m === "legacy-compatible" ? " selected" : ""}>Legacy Compatible · 默认</option><option value="zhangguo-primary"${m === "zhangguo-primary" ? " selected" : ""}>Zhangguo Primary · 原典</option></select></label><button class="primary" id="q233Refresh" type="button">刷新当前盘</button><button class="legacy" id="q233Legacy" type="button"${m === "legacy-compatible" ? " disabled" : ""}>恢复 Legacy</button><button id="q233Export" type="button">导出 Rule Pack Report</button></div>
  </section>
  <div class="q233-kpis">
   <div class="q233-kpi ${m === "legacy-compatible" ? "good" : "cyan"}"><small>当前强弱表</small><b>${m === "legacy-compatible" ? "LEGACY" : "PRIMARY"}</b></div>
   <div class="q233-kpi good"><small>旧七政一致项</small><b>${28 - diffAudit().length}/28</b></div>
   <div class="q233-kpi gold"><small>旧/原典差异项</small><b>${diffAudit().length}</b></div>
   <div class="q233-kpi good"><small>明晦规则</small><b>PRIMARY</b></div>
   <div class="q233-kpi good"><small>十变曜</small><b>10/10</b></div>
   <div class="q233-kpi gold"><small>文本异文</small><b>${VARIANTS.length}</b></div>
  </div>
  <div class="q233-grid">
   <section class="q233-card"><h4>一、当前档案 · 明晦 / 四时 / 变曜</h4><div id="q233Current">${currentHTML(A)}</div></section>
   <aside class="q233-card"><h4>二、Rule Pack Profiles</h4><div class="q233-list">${profilesHTML()}</div></aside>
  </div>
  <section class="q233-card"><h4>三、张果 Primary · 庙旺喜乐表</h4>${strengthTableHTML()}<div class="q233-note" style="margin-top:7px">“喜宫”早期文本明确列七政，未给出四余同等级完整表；因此 V233 不采用网络常见的“罗喜戌”等补丁。四余乐宫则有《三辰通载》明确补足。</div></section>
  <section class="q233-card"><h4>四、Legacy ↔ Primary 差异审计</h4>${diffHTML()}</section>
  <div class="q233-grid">
   <section class="q233-card"><h4>五、${E(A?.yearStem || "甲")}干完整十变曜</h4>${bianHTML(A?.yearStem || "甲")}<div class="q233-note" style="margin-top:7px">旧 QZ_HY “甲火乙孛……”没有错，但它表示每个年干的 <b>天禄起星</b>。原典随后还要按“禄暗福耗荫贵刑印囚权”旋转十曜，V233 已完整展开。</div></section>
   <aside class="q233-card"><h4>六、文本异文登记</h4><div class="q233-list">${variantsHTML()}</div></aside>
  </div>
  <section class="q233-card"><h4>七、Primary Evidence</h4><div class="q233-list">${sourceHTML()}</div></section>
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
      variants: clone(VARIANTS),
      legacyTable: clone(LEGACY),
      primaryTable: clone(CLASSIC),
      legacyVsPrimary: diffAudit(),
      mingHui: {
        day: clone(DAY_FAV),
        night: clone(NIGHT_FAV),
        policy: "explicit 明/晦 operational text",
      },
      seasonal: clone(SEASON),
      bianYao: {
        roles: clone(BIAN_ROLES),
        stars: clone(BIAN_STARS),
        current: bianYao(currentAudit().yearStem || "甲"),
      },
      current: currentAudit(),
      decision: {
        default: "legacy-compatible",
        recommendedResearch: "zhangguo-primary",
        currentQZHY: "validated as tianlu starting-star mapping, not complete bianyao",
        dayNightNull: "unknown, never auto-night",
        fourSeasonWindow: "pending",
        textualVariants: "preserved, not silently reconciled",
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
      pane.querySelector("#q232LifeRulePack") ||
      pane.querySelector("#q231ResidualProvider") ||
      pane.firstElementChild;
    const old = pane.querySelector("#q233StrengthRulePack"),
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
      if (e.target?.id === "q233Mode") {
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
      if (e.target?.id === "q233Refresh") {
        mount();
        return;
      }
      if (e.target?.id === "q233Legacy") {
        setMode("legacy-compatible");
        try {
          refRender("qizheng");
        } catch (_) {}
        TianjiPaneScheduler.request("qizheng");
        return;
      }
      if (e.target?.id === "q233Export") {
        save("天机盘_V233_七政强弱变曜RulePack.json", report());
        return;
      }
    },
    true,
  );

  TianjiPaneScheduler.register("qizheng", "v233-strength-rulepack-js", mount);

  try {
    if (window.TianjiCore) {
      TianjiCore.registerSource({
        id: "qizheng-strength-primary-v233",
        type: "classic",
        title: "张果星宗 · 庙旺喜乐 / 明晦 / 变曜",
        version: "图书集成567/568/581 + 三辰通载",
        license: "public-domain-classic",
        note: "V233逐表建立庙旺喜乐、明晦、四时旺衰与十变曜 provenance，并保留文本异文。",
      });
      TianjiCore.registerRule({
        id: "qizheng.strength.rulepack.v1",
        system: "qizheng",
        source: "qizheng-strength-primary-v233",
        title: "七政强弱变曜 Rule Pack",
        status: "verified-declared-scope",
        note: "Legacy兼容 + Zhangguo Primary显式切换；QZ_HY校正为天禄起星；明晦null不再误判夜生。",
      });
      TianjiCore.registerEngine(
        {
          id: "qizheng.strength.rulepack.v1",
          system: "qizheng",
          name: "Qizheng Strength & Bianyao Rule Pack",
          version: "1.0.0",
          source: "qizheng-strength-primary-v233",
          doctrine: "legacy-compatible / zhangguo-primary; preserve textual variants",
          status: "active",
        },
        () => report(),
      );
    }
  } catch (err) {
    console.warn("[V233 registry]", err);
  }

  const TASKS233 = [
    { id: "ai", p: "P0", name: "统一 AI 解释层", state: "done", note: "v171 完成" },
    { id: "mcp", p: "P0", name: "MCP / API 外部调用层", state: "done", note: "v172 完成" },
    {
      id: "kg",
      p: "P0",
      name: "典籍 Evidence / 规则知识图谱",
      state: "done",
      note: "v173 第一阶段；V233继续扩充七政强弱、明晦、变曜原典链",
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
      note: "V224–V231 已完成可靠星历与四余三轨 Provider；V232 完成命身宫主度主；V233 完成庙旺喜乐 / 明晦 / 四时旺衰 / 十变曜 Rule Pack，发现并版本化月喜卯↔亥、金喜巳缺失、旺戌等文本异文，并把旧 QZ_HY 校正为完整十变曜的天禄起星。剩余：四余第二历史锚点长期漂移验证、七政行限前置/百六限原典。",
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
  const BOARD233 = {
    schema: "tianji.priority.board.v1",
    build: BUILD,
    total: 14,
    done: 12,
    doing: 2,
    blocked: 0,
    progress: 92.9,
    next: [
      "V234 七政行限前置：十二宫年分 / 洞微大限 / 百六限规则 provenance 与可计算性审计",
      "四余第二历史绝对锚点 / 长期相位漂移验证",
      "四季土旺水衰的辰戌丑未 live 时间窗定义",
      "奇门日家完整盘 / 月家逐宫扩样",
    ],
    tasks: TASKS233,
  };
  function applyBoard() {
    window.TianjiPriorityBoard = Object.freeze({
      schema: BOARD233.schema,
      snapshot: () => clone(BOARD233),
    });
    const road = window.TianjiRoadmap || {};
    window.TianjiRoadmap = Object.freeze(
      Object.assign({}, road, {
        urgentImportant: clone(BOARD233),
        nextMainline: clone(BOARD233.next),
      }),
    );
  }
  applyBoard();
  window.addEventListener("tianji:lazy-ready", () => setTimeout(applyBoard, 0));

  function selfTest() {
    const C = [],
      add = (id, ok, d = "") => C.push({ id, ok: !!ok, d });
    add("base.capture", typeof BASE_QZ === "function", "");
    add("profiles", PROFILES.length === 2, String(PROFILES.length));
    add("legacy.sun", LEGACY["日"].m.includes("戌") && LEGACY["日"].x.includes("寅"), "");
    add(
      "classic.moon.x",
      CLASSIC["月"].x.includes("卯") && !CLASSIC["月"].x.includes("亥"),
      CLASSIC["月"].x.join(","),
    );
    add("classic.venus.x", CLASSIC["金"].x.includes("巳"), CLASSIC["金"].x.join(","));
    add(
      "classic.residuals",
      ["紫炁", "月孛", "罗睺", "计都"].every((x) => CLASSIC[x]),
      "",
    );
    add(
      "minghui",
      DAY_FAV.join("") === "日木土水紫炁计都月孛" && NIGHT_FAV.join("") === "月火金罗睺",
      "",
    );
    add(
      "bianjia",
      bianYao("甲")
        .map((x) => x.star)
        .join("") === BIAN_STARS.join(""),
      "",
    );
    add("bianyi", bianYao("乙")[0].star === "月孛" && bianYao("癸")[0].star === "罗睺", "");
    add("wrapper.install", window.qzCalc === strengthQz, "");
    return { ok: C.every((x) => x.ok), checks: C };
  }
  const TEST = selfTest();

  window.TianjiQizhengStrengthRulePackV233 = Object.freeze({
    version: "1.0.0",
    build: BUILD,
    schema: SCHEMA,
    sources: () => clone(SOURCES),
    profiles: () => clone(PROFILES),
    variants: () => clone(VARIANTS),
    mode,
    setMode: (v) => {
      const m = setMode(v);
      try {
        refRender("qizheng");
      } catch (_) {}
      return m;
    },
    legacyTable: () => clone(LEGACY),
    primaryTable: () => clone(CLASSIC),
    strength: (name, zhi, m) => clone(strength(name, zhi, m || mode())),
    diffAudit: () => clone(diffAudit()),
    mingHui: () => ({ day: clone(DAY_FAV), night: clone(NIGHT_FAV) }),
    seasonal: () => clone(SEASON),
    bianYao: (stem) => clone(bianYao(stem)),
    current: () => clone(currentAudit()),
    report: () => clone(report()),
    selfTest: () => clone(TEST),
    manifest: () => ({
      module: "Qizheng Strength & Bianyao Rule Pack V233",
      default: "legacy-compatible",
      recommendedResearch: "zhangguo-primary",
      verified: [
        "庙旺喜乐核心表",
        "明晦操作集合",
        "春夏秋冬旺衰",
        "甲火乙孛…天禄起星",
        "禄暗福耗荫贵刑印囚权完整循环",
      ],
      preservedVariants: ["旺戌太阳/天尾", "月喜卯/亥", "金喜巳缺失", "孛曜阴阳异文"],
      fixedBehavior: [
        "isDay=null no longer auto-night in UI",
        "QZ_HY interpreted as tianlu starting star, full bianyao expanded",
      ],
      qzCalcWrapped: true,
    }),
  });
  window.TianjiSystemV233 = {
    version: "v233",
    build: BUILD,
    qizhengStrengthRulePack: true,
    bianYaoExpanded: true,
    mingHuiAudited: true,
    defaultStrengthRule: "legacy-compatible",
    baseline: "v232",
  };
})();
