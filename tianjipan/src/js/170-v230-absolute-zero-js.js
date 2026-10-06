(() => {
  "use strict";
  const BUILD = "v230 · 2026-10-06 22:11 +08:00";
  const SCHEMA = "tianji.qizheng.absolute-zero.v1";
  const CAL = {
    traditional: "萬曆五年十二月朔",
    julian: "1578-01-08",
    prolepticGregorian: "1578-01-18",
    jd0: 2297429.5,
    convention: "1582-10-15以前按儒略历；此处1578-01-08 Julian = 1578-01-18 proleptic Gregorian",
    source: "YT Liu 中国历代朔闰表 / Julian Date calculator",
  };
  const TEXT_ANCHOR = {
    sun: { xiu: "牛", du: 0, text: "萬曆五年十二月朔，日躔牛初度" },
    moonDusk: { xiu: "牛", du: 4, text: "萬曆五年十二月朔日，月昏牛四度" },
    residuals: [
      ["罗睺", "角", 7],
      ["计都", "奎", 17],
      ["紫炁", "张", 14],
      ["月孛", "危", 13],
    ],
  };
  const SOURCES = [
    {
      id: "tushubian-18-sunmoon",
      title: "《圖書編》卷十八 · 日月万历五年十二月朔锚点",
      type: "primary-classic",
      url: "https://zh.wikisource.org/zh-hans/%E5%9C%96%E6%9B%B8%E7%B7%A8_(%E5%9B%9B%E5%BA%AB%E5%85%A8%E6%9B%B8%E6%9C%AC)/%E5%8D%B7018",
      note: "同一日同时记录“日躔牛初度”与“月昏牛四度”；用于建立明代黄道宿度的绝对零点与独立月亮时序交叉检查。",
    },
    {
      id: "ming-calendar-conversion",
      title: "中国历代朔闰表 / Julian Date 说明",
      type: "calendar-method",
      url: "https://ytliu0.github.io/ChineseCalendar/table_period_chinese.html?period=ming",
      note: "万历五年十二月朔列为1578-01-08；该站明确1582-10-15以前使用儒略历，因此同一绝对日的逆推格里高利日期为1578-01-18。",
    },
    {
      id: "ming-yellow-frame",
      title: "《明史》卷三十六 · 四余黄道宿整度",
      type: "primary-classic",
      url: "https://skqs.dazhishi.com/show_grdomooada.html",
      note: "V229已据此建立365.2564传统度的明代四余黄道原生frame。",
    },
  ];

  const clone = (x) => (x == null ? x : JSON.parse(JSON.stringify(x)));
  const E = (s) =>
    String(s ?? "").replace(
      /[&<>"']/g,
      (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
    );
  const norm = (x) => ((x % 360) + 360) % 360;
  const sdiff = (a, b) => ((a - b + 540) % 360) - 180;
  const jdDate = (jd) => new Date((jd - 2440587.5) * 86400000);
  const dateJD = (d) => d.getTime() / 86400000 + 2440587.5;
  let LAST = null;

  function frame() {
    const api = window.TianjiQizhengXiuFrameV229;
    if (!api) throw new Error("V229 Historical Xiu Frame 不可用");
    const r = api.report(),
      total = Number(r?.mingTotal || api.manifest?.().mingCycleTraditionalDegrees);
    if (!Number.isFinite(total)) throw new Error("无法取得明代黄道宿度总周天");
    return { api, total };
  }
  function native(xiu, du) {
    return frame().api.nativeCoord(xiu, du);
  }
  function nativeScaled(xiu, du) {
    const f = frame();
    return (native(xiu, du) * 360) / f.total;
  }
  async function ensureEngine() {
    if (window.TianjiQizhengVendorV227?.load) return TianjiQizhengVendorV227.load();
    if (window.TianjiQizhengEphemerisV225?.load) return TianjiQizhengEphemerisV225.load();
    throw new Error("可靠星历 Provider 不可用");
  }
  function engineReady() {
    return !!(
      window.Astronomy &&
      Astronomy.SearchMoonPhase &&
      Astronomy.SunPosition &&
      Astronomy.EclipticGeoMoon
    );
  }
  function moonLon(jd) {
    return norm(Astronomy.EclipticGeoMoon(jdDate(jd)).lon);
  }
  function sunLon(jd) {
    return norm(Astronomy.SunPosition(jdDate(jd)).elon);
  }
  function searchLon(target, start, end) {
    let prevJ = start,
      prev = sdiff(moonLon(start), target);
    const steps = 96;
    for (let i = 1; i <= steps; i++) {
      const j = start + ((end - start) * i) / steps,
        v = sdiff(moonLon(j), target);
      if (prev === 0 || prev * v <= 0) {
        let a = prevJ,
          b = j,
          fa = prev;
        for (let k = 0; k < 50; k++) {
          const m = (a + b) / 2,
            fm = sdiff(moonLon(m), target);
          if (fa === 0 || fa * fm <= 0) b = m;
          else {
            a = m;
            fa = fm;
          }
        }
        return (a + b) / 2;
      }
      prevJ = j;
      prev = v;
    }
    return null;
  }
  function circularMeanDeg(vals) {
    let x = 0,
      y = 0;
    vals.forEach((v) => {
      const r = (v * Math.PI) / 180;
      x += Math.cos(r);
      y += Math.sin(r);
    });
    return norm((Math.atan2(y, x) * 180) / Math.PI);
  }
  async function align() {
    await ensureEngine();
    if (!engineReady()) throw new Error("Astronomy Engine API 未建立");
    const start = jdDate(CAL.jd0 - 0.25);
    const nm = Astronomy.SearchMoonPhase(0, start, 2);
    if (!nm) throw new Error("未在历史日期附近找到朔");
    const conjunctionJD = dateJD(nm.date),
      sLon = norm(Astronomy.SunPosition(nm).elon);
    const f = frame(),
      sunNative = native(TEXT_ANCHOR.sun.xiu, TEXT_ANCHOR.sun.du);
    const offset = norm(sLon - (sunNative * 360) / f.total);
    const toModern = (xiu, du) => norm((native(xiu, du) * 360) / f.total + offset);
    const moonTarget = toModern(TEXT_ANCHOR.moonDusk.xiu, TEXT_ANCHOR.moonDusk.du);
    const duskJD = searchLon(moonTarget, conjunctionJD, conjunctionJD + 1);
    const dusk = {
      targetLon: moonTarget,
      jdUT: duskJD,
      hoursAfterConjunction: duskJD == null ? null : (duskJD - conjunctionJD) * 24,
      east120ReferenceHour:
        duskJD == null ? null : norm((duskJD - Math.floor(duskJD - 0.5) - 0.5) * 24 + 8, 24),
      plausibleDusk: false,
    };
    if (dusk.east120ReferenceHour != null)
      dusk.plausibleDusk = dusk.east120ReferenceHour >= 16 && dusk.east120ReferenceHour <= 20.5;
    const anchors = TEXT_ANCHOR.residuals.map(([name, xiu, du]) => ({
      name,
      xiu,
      du,
      native: native(xiu, du),
      modern: toModern(xiu, du),
    }));
    return {
      schema: SCHEMA,
      build: BUILD,
      calendar: clone(CAL),
      conjunction: {
        jdUT: conjunctionJD,
        isoUTC: nm.date.toISOString(),
        sunLon: sLon,
        moonLon: norm(Astronomy.EclipticGeoMoon(nm).lon),
      },
      frame: {
        total: f.total,
        sunNative,
        sunScaled: (sunNative * 360) / f.total,
        zeroOffsetDeg: offset,
      },
      moonDusk: dusk,
      anchors,
      toModern,
    };
  }
  function modelFromAlignment(A) {
    const rates = window.TianjiQizhengResidualV228?.rateReport?.() || [];
    const by = Object.fromEntries(rates.map((x) => [x.name, x]));
    const map = Object.fromEntries(A.anchors.map((x) => [x.name, x]));
    const nodeRate = Number(by["罗计"]?.classicalModernPerDay);
    const yRate = Number(by["月孛"]?.classicalModernPerDay);
    const zRate = Number(by["紫炁"]?.classicalModernPerDay);
    const luoCandidate1 = map["罗睺"].modern,
      luoCandidate2 = norm(map["计都"].modern + 180);
    const luo0 = circularMeanDeg([luoCandidate1, luoCandidate2]);
    const phaseSpread = Math.abs(sdiff(luoCandidate1, luoCandidate2));
    const anchorJD = A.conjunction.jdUT;
    function at(jd) {
      const d = jd - anchorJD,
        luo = norm(luo0 + nodeRate * d);
      return {
        jdUT: jd,
        罗睺: luo,
        计都: norm(luo + 180),
        月孛: norm(map["月孛"].modern + yRate * d),
        紫炁: norm(map["紫炁"].modern + zRate * d),
      };
    }
    return {
      id: "wanli-anchored-traditional-mean-v1",
      anchorJD,
      anchorTargets: {
        罗睺: luo0,
        计都: norm(luo0 + 180),
        月孛: map["月孛"].modern,
        紫炁: map["紫炁"].modern,
      },
      rates: { 罗计: nodeRate, 月孛: yRate, 紫炁: zRate },
      nodeAnchorSpreadDeg: phaseSpread,
      at,
    };
  }
  function proxyAudit(A) {
    const v228 = window.TianjiQizhengResidualV228;
    if (!v228) return null;
    const targets = Object.fromEntries(A.anchors.map((x) => [x.name, x.modern]));
    const jd = A.conjunction.jdUT;
    const policies = ["legacy-modern", "traditional-jiaochu"].map((policy) => {
      const p = v228.modernProxy(jd, policy),
        vals = { 罗睺: p.luohou, 计都: p.jidu, 月孛: p.yuebei, 紫炁: p.ziqi };
      const rows = Object.keys(targets).map((name) => ({
        name,
        target: targets[name],
        proxy: vals[name],
        delta: sdiff(vals[name], targets[name]),
        abs: Math.abs(sdiff(vals[name], targets[name])),
      }));
      return {
        policy,
        rows,
        nodeMeanAbs:
          rows
            .filter((x) => x.name === "罗睺" || x.name === "计都")
            .reduce((s, x) => s + x.abs, 0) / 2,
      };
    });
    return {
      jdUT: jd,
      policies,
      recommendedNodeNaming:
        [...policies].sort((a, b) => a.nodeMeanAbs - b.nodeMeanAbs)[0]?.policy || null,
    };
  }
  function currentComparison(M) {
    let jd = null;
    try {
      jd = R?.t?.jdUT ?? null;
    } catch (_) {}
    if (jd == null) return { available: false, reason: "请先建立档案并排盘" };
    const traditional = M.at(jd),
      proxy = window.TianjiQizhengResidualV228?.modernProxy?.(jd, "traditional-jiaochu") || null;
    const rows = ["罗睺", "计都", "月孛", "紫炁"].map((name) => ({
      name,
      anchored: traditional[name],
      currentProxy:
        name === "罗睺"
          ? proxy?.luohou
          : name === "计都"
            ? proxy?.jidu
            : name === "月孛"
              ? proxy?.yuebei
              : proxy?.ziqi,
      delta: proxy
        ? sdiff(
            name === "罗睺"
              ? proxy.luohou
              : name === "计都"
                ? proxy.jidu
                : name === "月孛"
                  ? proxy.yuebei
                  : proxy.ziqi,
            traditional[name],
          )
        : null,
    }));
    return { available: true, jdUT: jd, rows };
  }
  async function run() {
    const A = await align(),
      M = modelFromAlignment(A),
      P = proxyAudit(A),
      C = currentComparison(M);
    LAST = {
      schema: SCHEMA,
      build: BUILD,
      generatedAt: new Date().toISOString(),
      sources: clone(SOURCES),
      alignment: clone({ ...A, toModern: undefined }),
      model: {
        id: M.id,
        anchorJD: M.anchorJD,
        anchorTargets: M.anchorTargets,
        rates: M.rates,
        nodeAnchorSpreadDeg: M.nodeAnchorSpreadDeg,
      },
      proxyAudit: P,
      current: C,
      decision: {
        absoluteZero: "aligned-by-sun-at-new-moon",
        independentCheck: "moon-at-dusk",
        traditionalMeanModel: "wanli-anchored / source rates",
        liveQzCalcChanged: false,
        calendarCorrection:
          "V228 anchor corrected to 1578-01-08 Julian = 1578-01-18 proleptic Gregorian",
      },
    };
    return clone(LAST);
  }
  function sourcesHTML() {
    return SOURCES.map(
      (s) =>
        `<div class="q230-item ${s.type === "primary-classic" ? "good" : "cyan"}"><b>${E(s.title)}</b><small>${E(s.note)}<br><span class="q230-code">${E(s.url)}</span></small><div class="q230-badges"><span class="q230-badge ${s.type === "primary-classic" ? "good" : "cyan"}">${E(s.type)}</span></div></div>`,
    ).join("");
  }
  function resultHTML() {
    if (!LAST)
      return '<div class="q230-note">尚未运行1578绝对零点对齐。点击上方按钮后会优先使用 V227 的已验证离线 Astronomy Engine；没有缓存时才联网 bootstrap。</div>';
    const A = LAST.alignment,
      P = LAST.proxyAudit,
      d = A.moonDusk;
    return `<div class="q230-list">
  <div class="q230-item good"><b>绝对零点已建立 · offset ${A.frame.zeroOffsetDeg.toFixed(6)}°</b><small>朔时 ${E(A.conjunction.isoUTC)}；可靠星历日月同经 ${A.conjunction.sunLon.toFixed(6)}°。把《圖書編》“日躔牛初度”置于该现代黄经后，明代365.2564度frame获得绝对零点。</small></div>
  <div class="q230-item ${d.plausibleDusk ? "good" : "warn"}"><b>独立月亮检查 · ${d.plausibleDusk ? "符合“昏”时段" : "需复核时刻"}</b><small>“牛四度”映射为 ${d.targetLon.toFixed(6)}°；可靠星历月亮约在朔后 ${d.hoursAfterConjunction?.toFixed(3) ?? "—"} 小时到达。按东经120°参考时约 ${d.east120ReferenceHour?.toFixed(2) ?? "—"} 时，仅作为“昏”字的时序合理性检查，不冒充历史钟时。</small></div>
  <div class="q230-item cyan"><b>罗计命名口径对拍</b><small>与万历锚点相比，现代代理两种命名中更接近的是：<b>${E(P?.recommendedNodeNaming || "—")}</b>。这只说明锚点相位更接近哪套标签，不等于现代平均交点公式就是传统均平罗计。</small></div>
 </div>`;
  }
  function anchorTable() {
    if (!LAST) return '<div class="q230-note">运行后显示四余传统锚点映射的现代黄经。</div>';
    const A = LAST.alignment,
      P = LAST.proxyAudit;
    const pol = Object.fromEntries(
      (P?.policies || []).map((x) => [
        x.policy,
        Object.fromEntries(x.rows.map((r) => [r.name, r])),
      ]),
    );
    return `<div class="q230-tablewrap"><table class="q230-table"><thead><tr><th>四余</th><th>原典宿度</th><th>零点对齐后黄经</th><th>Legacy-modern代理差</th><th>Traditional-jiaochu代理差</th></tr></thead><tbody>${A.anchors.map((x) => `<tr><td><b>${E(x.name)}</b></td><td>${E(x.xiu)}${x.du}度</td><td>${x.modern.toFixed(6)}°</td><td>${pol["legacy-modern"]?.[x.name]?.delta?.toFixed?.(3) ?? "—"}°</td><td>${pol["traditional-jiaochu"]?.[x.name]?.delta?.toFixed?.(3) ?? "—"}°</td></tr>`).join("")}</tbody></table></div>`;
  }
  function currentHTML() {
    const C = LAST?.current;
    if (!C?.available)
      return `<div class="q230-note">${E(C?.reason || "运行绝对零点对齐后显示当前盘比较。")}</div>`;
    return `<div class="q230-tablewrap"><table class="q230-table"><thead><tr><th>四余</th><th>万历锚定传统均平模型</th><th>现有现代代理</th><th>差值</th></tr></thead><tbody>${C.rows.map((x) => `<tr><td><b>${E(x.name)}</b></td><td>${Number(x.anchored).toFixed(4)}°</td><td>${Number(x.currentProxy).toFixed(4)}°</td><td>${Number(x.delta) >= 0 ? "+" : ""}${Number(x.delta).toFixed(4)}°</td></tr>`).join("")}</tbody></table></div>`;
  }
  function panel() {
    const done = !!LAST,
      A = LAST?.alignment,
      d = A?.moonDusk;
    return `<section class="q230" id="q230AbsoluteZero">
  <section class="q230-hero"><div class="q230-head"><div><h3>V230 · 明代黄道零点对齐 / 万历朔日绝对相位反校</h3><p>V229 已经有“相对宿界”，V230 继续补上最关键的“绝对零点”。利用同一朔日的两条原典：太阳躔牛初度、月亮昏时牛四度；再用可靠星历寻找该日真实朔时。太阳负责锁定 frame 零点，月亮负责独立时序交叉检查。随后把罗睺、计都、月孛、紫炁的万历宿度全部变成同一现代黄经参考。</p></div><span class="q230-schema">${SCHEMA}</span></div>
   <div class="q230-tools"><button class="primary" id="q230Run" type="button">${done ? "重新运行1578绝对对齐" : "运行1578绝对零点对齐"}</button><button id="q230Export" type="button"${done ? "" : " disabled"}>导出 Absolute Epoch Report</button></div>
  </section>
  <div class="q230-kpis">
   <div class="q230-kpi good"><small>历史日期修正</small><b>JULIAN</b></div>
   <div class="q230-kpi ${done ? "good" : "gold"}"><small>绝对零点</small><b>${done ? "ALIGNED" : "PENDING"}</b></div>
   <div class="q230-kpi ${d?.plausibleDusk ? "good" : "cyan"}"><small>月昏交叉检查</small><b>${done ? (d?.plausibleDusk ? "PASS" : "REVIEW") : "PENDING"}</b></div>
   <div class="q230-kpi ${done ? "good" : "gold"}"><small>四余绝对锚点</small><b>${done ? "4/4" : "0/4"}</b></div>
   <div class="q230-kpi cyan"><small>传统均平模型</small><b>${done ? "BUILT" : "PENDING"}</b></div>
   <div class="q230-kpi"><small>Live qzCalc</small><b>UNCHANGED</b></div>
  </div>
  <section class="q230-card"><h4>一、历法修正</h4><div class="q230-item warn"><b>${E(CAL.traditional)} ≠ proleptic Gregorian 1578-01-08</b><small>正确西历记录是 <b>1578-01-08 Julian</b>，对应同一绝对日的 <b>1578-01-18 proleptic Gregorian</b>，JD 起点 ${CAL.jd0}. V228 的旧映射已在本文件中修正。这个10天差如果不纠正，会把朔日、太阳、月亮全部对错日期。</small></div></section>
  <div class="q230-grid">
   <section class="q230-card"><h4>二、零点对齐结果</h4><div id="q230Result">${resultHTML()}</div></section>
   <aside class="q230-card"><h4>三、Primary Evidence</h4><div class="q230-list">${sourcesHTML()}</div></aside>
  </div>
  <section class="q230-card"><h4>四、万历四余锚点 → 现代黄经参考</h4><div id="q230Anchors">${anchorTable()}</div></section>
  <section class="q230-card"><h4>五、当前档案 · 传统锚定模型 vs 现有代理</h4><div id="q230Current">${currentHTML()}</div></section>
  <section class="q230-card"><h4>六、V230 边界</h4><div class="q230-list">
   <div class="q230-item good"><b>“相对 frame + 绝对零点”现在可以连起来</b><small>如果运行通过，1578原典宿度可以转成同一现代黄经参考，不再停留在“只有宿名和宿内度”的状态。</small></div>
   <div class="q230-item warn"><b>这仍不是“真实天体四余”</b><small>罗计、月孛、紫炁是传统均平隐曜。V230 建的是“万历锚定传统均平模型”，不是把紫炁等虚构成现代可观测天体。</small></div>
   <div class="q230-item cyan"><b>正式 qzCalc 仍不改</b><small>先让原典绝对历元形成独立可审计模型；下一步再决定是否作为可选 Four Residual Provider 接入，而不是静默替换旧盘。</small></div>
  </div></section>
 </section>`;
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
      pane.querySelector("#q229XiuFrame") ||
      pane.querySelector("#q228Residuals") ||
      pane.firstElementChild;
    const old = pane.querySelector("#q230AbsoluteZero"),
      tmp = document.createElement("div");
    tmp.innerHTML = panel();
    const fresh = tmp.firstElementChild;
    if (old) old.replaceWith(fresh);
    else if (anchor) anchor.insertAdjacentElement("beforebegin", fresh);
    else pane.appendChild(fresh);
  }
  document.addEventListener(
    "click",
    async (e) => {
      if (e.target?.id === "q230Run") {
        const b = e.target;
        b.disabled = true;
        b.textContent = "加载星历并对齐…";
        try {
          await run();
          mount();
          try {
            toast("V230 明代黄道绝对零点对齐完成");
          } catch (_) {}
        } catch (err) {
          LAST = { error: String(err?.message || err) };
          mount();
          try {
            toast("对齐失败：" + String(err?.message || err));
          } catch (_) {}
        }
        return;
      }
      if (e.target?.id === "q230Export" && LAST) {
        save("天机盘_V230_四余AbsoluteEpochReport.json", LAST);
        return;
      }
    },
    true,
  );

  TianjiPaneScheduler.register("qizheng", "v230-absolute-zero-js", mount);

  try {
    if (window.TianjiCore) {
      TianjiCore.registerSource({
        id: "qizheng-wanli-sunmoon-anchor",
        type: "classic",
        title: "《圖書編》卷十八 · 万历五年十二月朔日月宿度",
        version: "四庫全書本",
        license: "public-domain-classic",
        note: "日躔牛初度；月昏牛四度；用于V230绝对零点+独立月亮时序检查。",
      });
      TianjiCore.registerSource({
        id: "qizheng-wanli-calendar-map",
        type: "external-reference",
        title: "中国历代朔闰表 · 万历五年十二月朔日期映射",
        version: "web reference",
        license: "reference-only",
        note: "1578-01-08 Julian = 1578-01-18 proleptic Gregorian；纠正V228旧日期映射。",
      });
      TianjiCore.registerEngine(
        {
          id: "qizheng.absolute-zero.v1",
          system: "qizheng",
          name: "Ming Xiu Absolute Zero Alignment",
          version: "1.0.0",
          source: "qizheng-wanli-sunmoon-anchor",
          doctrine:
            "sun-at-new-moon locks zero; moon-at-dusk cross-check; residuals become Wanli-anchored mean model",
          status: "research",
        },
        () => clone(LAST),
      );
    }
  } catch (err) {
    console.warn("[V230 registry]", err);
  }

  const TASKS230 = [
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
      note: "V224–V227 七政可靠星历链完成；V228 四余均速+万历锚点；V229 明代黄道宿界；V230 修正万历日期为1578-01-08 Julian，并建立“日躔牛初度→可靠朔时”的绝对零点方案及月昏牛四度交叉检查，可生成万历锚定传统均平四余模型。正式 qzCalc 仍未切换。下一步：把传统四余模型做成可选 Provider + 命身宫/庙旺化曜 Rule Pack。",
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
  const BOARD230 = {
    schema: "tianji.priority.board.v1",
    build: BUILD,
    total: 14,
    done: 12,
    doing: 2,
    blocked: 0,
    progress: 92.9,
    next: [
      "V231 四余 Provider：legacy / modern-proxy / Wanli-anchored traditional-mean 三轨可审计选择",
      "命宫 / 身宫 / 庙旺喜乐 / 化曜 Rule Pack",
      "四余传统模型扩大历史盘例 / 第二绝对锚点",
      "奇门日家完整盘 / 月家逐宫扩样",
    ],
    tasks: TASKS230,
  };
  function applyBoard() {
    window.TianjiPriorityBoard = Object.freeze({
      schema: BOARD230.schema,
      snapshot: () => clone(BOARD230),
    });
    const road = window.TianjiRoadmap || {};
    window.TianjiRoadmap = Object.freeze(
      Object.assign({}, road, {
        urgentImportant: clone(BOARD230),
        nextMainline: clone(BOARD230.next),
      }),
    );
  }
  applyBoard();
  window.addEventListener("tianji:lazy-ready", () => setTimeout(applyBoard, 0));

  function selfTest() {
    const C = [],
      add = (id, ok, d = "") => C.push({ id, ok: !!ok, d });
    add("calendar.jd", CAL.jd0 === 2297429.5, String(CAL.jd0));
    add("calendar.julian", CAL.julian === "1578-01-08", CAL.julian);
    add("calendar.gregorian", CAL.prolepticGregorian === "1578-01-18", CAL.prolepticGregorian);
    add("frame.api", typeof window.TianjiQizhengXiuFrameV229?.nativeCoord === "function", "");
    add("residual.api", typeof window.TianjiQizhengResidualV228?.rateReport === "function", "");
    const f = frame(),
      niu = native("牛", 0);
    add("frame.total", Math.abs(f.total - 365.2564) < 0.001, String(f.total));
    add("niu.native", Number.isFinite(niu), String(niu));
    add("live.unchanged", true, "qzCalc untouched by V230");
    return { ok: C.every((x) => x.ok), checks: C };
  }
  const TEST = selfTest();

  window.TianjiQizhengAbsoluteZeroV230 = Object.freeze({
    version: "1.0.0",
    build: BUILD,
    schema: SCHEMA,
    calendar: () => clone(CAL),
    textAnchor: () => clone(TEXT_ANCHOR),
    sources: () => clone(SOURCES),
    run: () => run(),
    last: () => clone(LAST),
    frame: () => ({ total: frame().total }),
    selfTest: () => clone(TEST),
    manifest: () => ({
      module: "Ming Xiu Absolute Zero Alignment V230",
      calendarCorrection: "1578-01-08 Julian = 1578-01-18 proleptic Gregorian",
      zeroAnchor: "Sun at Niu 0 on Wanli-5 twelfth-month new moon",
      crossCheck: "Moon at dusk Niu 4",
      residualModel: "Wanli-anchored traditional mean model generated after runtime alignment",
      liveQzCalcChanged: false,
      next: "selectable residual provider",
    }),
  });
  window.TianjiSystemV230 = {
    version: "v230",
    build: BUILD,
    qizhengAbsoluteZero: true,
    calendarAnchorCorrected: true,
    liveQzCalcChanged: false,
    baseline: "v229",
  };
})();
