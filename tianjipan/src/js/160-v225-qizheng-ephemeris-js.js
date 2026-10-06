(() => {
  "use strict";
  const BUILD = "v225 · 2026-10-06 22:46 +08:00";
  const SCHEMA = "tianji.qizheng.ephemeris.v1";
  const REPORT_SCHEMA = "tianji.qizheng.ephemeris-regression.v1";
  const ENGINE = {
    id: "astronomy-engine",
    version: "2.1.19",
    commit: "865d3da7d8112bbc7911238052c6af4aaf877181",
    sourceBlob: "fc5ab5c406c6fd64bdd537772e4cc7c8d438275b",
    license: "MIT",
    url: "https://cdn.jsdelivr.net/npm/astronomy-engine@2.1.19/astronomy.browser.min.js",
    repo: "https://github.com/cosinekitty/astronomy",
  };
  const BODY_MAP = {
    太阳: "Sun",
    月亮: "Moon",
    水星: "Mercury",
    金星: "Venus",
    火星: "Mars",
    木星: "Jupiter",
    土星: "Saturn",
    天王星: "Uranus",
    海王星: "Neptune",
    冥王星: "Pluto",
  };
  const ORDER = [
    "太阳",
    "月亮",
    "水星",
    "金星",
    "火星",
    "木星",
    "土星",
    "天王星",
    "海王星",
    "冥王星",
  ];
  const clone = (x) => (x == null ? x : JSON.parse(JSON.stringify(x)));
  const E = (s) =>
    String(s ?? "").replace(
      /[&<>"']/g,
      (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
    );
  const norm = (x) => ((x % 360) + 360) % 360;
  const dlon = (a, b) => ((a - b + 540) % 360) - 180;
  const jdDate = (jd) => new Date((Number(jd) - 2440587.5) * 86400000);
  let LOAD_PROMISE = null,
    LAST = null,
    BATCH = null;

  function loaded() {
    return !!(
      window.Astronomy &&
      Astronomy.Body &&
      Astronomy.GeoVector &&
      Astronomy.Ecliptic &&
      Astronomy.SunPosition
    );
  }
  function loadEngine() {
    if (loaded()) return Promise.resolve(true);
    if (LOAD_PROMISE) return LOAD_PROMISE;
    const loader = window.TianjiQizhengVendorV227;
    if (!loader?.load) return Promise.reject(new Error("完整性校验加载器不可用；保留 Legacy 星历"));
    LOAD_PROMISE = loader
      .load()
      .then(() => {
        if (!loaded()) throw new Error("星历校验后未建立 Astronomy API");
        return true;
      })
      .catch((error) => {
        LOAD_PROMISE = null;
        throw error;
      });
    return LOAD_PROMISE;
  }
  function oneLon(name, jd) {
    if (!loaded()) throw new Error("Astronomy Engine 未加载");
    const A = window.Astronomy,
      date = jdDate(jd);
    if (name === "太阳") {
      const x = A.SunPosition(date);
      return {
        lon: norm(x.elon),
        lat: Number(x.elat) || 0,
        dist: Math.hypot(x.vec?.x || 0, x.vec?.y || 0, x.vec?.z || 0) || 1,
      };
    }
    if (name === "月亮") {
      const x = A.EclipticGeoMoon(date);
      return { lon: norm(x.lon), lat: Number(x.lat) || 0, dist: Number(x.dist) || 0 };
    }
    const body = A.Body[BODY_MAP[name]],
      vec = A.GeoVector(body, date, true),
      x = A.Ecliptic(vec);
    return { lon: norm(x.elon), lat: Number(x.elat) || 0, dist: Math.hypot(vec.x, vec.y, vec.z) };
  }
  function enginePlanets(jd) {
    const out = [],
      half = 0.5;
    ORDER.forEach((name) => {
      const a = oneLon(name, jd),
        n = oneLon(name, jd + half),
        p = oneLon(name, jd - half),
        speed = dlon(n.lon, p.lon);
      const info = typeof AS_INFO !== "undefined" ? AS_INFO[name] : null;
      const signs = typeof AS_SIGN !== "undefined" ? AS_SIGN : null;
      const si = Math.floor(a.lon / 30) % 12;
      out.push({
        n: name,
        lon: a.lon,
        lat: a.lat,
        dist: a.dist,
        speed,
        retro: speed < 0,
        sign: signs ? signs[si] : null,
        deg: a.lon - si * 30,
        g: info?.g || "",
        wx: info?.wx ?? null,
        zh: info?.zh || "",
      });
    });
    return out;
  }
  function legacyPlanets(jd) {
    return typeof asPlanets === "function" ? asPlanets(jd) : [];
  }
  function boundaryDistance(lon, bounds) {
    let best = 180;
    bounds.forEach((b) => {
      const d = Math.abs(dlon(lon, b));
      if (d < best) best = d;
    });
    return best;
  }
  function xiuStartBounds() {
    try {
      return QZ_XIU.map((x) => Number(x[1])).filter(Number.isFinite);
    } catch (_) {
      return [];
    }
  }
  function classifyRow(a, b) {
    const delta = dlon(b.lon, a.lon),
      abs = Math.abs(delta);
    const legacyG = typeof qzGong === "function" ? qzGong(a.lon) : null;
    const engineG = typeof qzGong === "function" ? qzGong(b.lon) : null;
    const legacyX = typeof qzXiu === "function" ? qzXiu(a.lon) : null;
    const engineX = typeof qzXiu === "function" ? qzXiu(b.lon) : null;
    const gongChanged = legacyG?.zhi !== engineG?.zhi,
      xiuChanged = legacyX?.name !== engineX?.name,
      retroChanged = !!a.retro !== !!b.retro;
    const gongDist = boundaryDistance(
      a.lon,
      [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330],
    );
    const xb = xiuStartBounds(),
      xiuDist = xb.length ? boundaryDistance(a.lon, xb) : null;
    let level = "minor";
    if (gongChanged || xiuChanged || retroChanged) level = "structural";
    else if (abs >= 0.5) level = "material";
    else if (abs >= 0.1) level = "noticeable";
    const sensitive = gongDist <= abs + 0.03 || (xiuDist != null && xiuDist <= abs + 0.03);
    return {
      name: a.n,
      legacy: +a.lon.toFixed(6),
      engine: +b.lon.toFixed(6),
      delta: +delta.toFixed(6),
      absDelta: +abs.toFixed(6),
      legacyRetro: !!a.retro,
      engineRetro: !!b.retro,
      legacyGong: legacyG?.zhi || null,
      engineGong: engineG?.zhi || null,
      legacyXiu: legacyX?.name || null,
      engineXiu: engineX?.name || null,
      gongChanged,
      xiuChanged,
      retroChanged,
      boundarySensitive: sensitive,
      boundary: { gong: +gongDist.toFixed(6), xiu: xiuDist == null ? null : +xiuDist.toFixed(6) },
      level,
    };
  }
  function compare(jd) {
    const l = legacyPlanets(jd),
      e = enginePlanets(jd),
      emap = Object.fromEntries(e.map((x) => [x.n, x]));
    const rows = l.filter((x) => emap[x.n]).map((x) => classifyRow(x, emap[x.n]));
    const seven = rows.filter((x) =>
      ["太阳", "月亮", "水星", "金星", "火星", "木星", "土星"].includes(x.name),
    );
    return {
      schema: REPORT_SCHEMA,
      build: BUILD,
      jdUT: jd,
      dateUTC: jdDate(jd).toISOString(),
      engine: clone(ENGINE),
      rows,
      seven,
      summary: {
        maxAbs: +Math.max(...seven.map((x) => x.absDelta), 0).toFixed(6),
        meanAbs: +(seven.reduce((s, x) => s + x.absDelta, 0) / (seven.length || 1)).toFixed(6),
        structural: seven.filter((x) => x.level === "structural").length,
        material: seven.filter((x) => x.level === "material").length,
        boundarySensitive: seven.filter((x) => x.boundarySensitive).length,
        gongChanged: seven.filter((x) => x.gongChanged).length,
        xiuChanged: seven.filter((x) => x.xiuChanged).length,
        retroChanged: seven.filter((x) => x.retroChanged).length,
      },
    };
  }
  function qizhengWithEngine(R0) {
    if (!R0?.t?.jdUT) throw new Error("当前档案没有 jdUT");
    if (typeof qzCalc !== "function") throw new Error("qzCalc 不可用");
    const planets = enginePlanets(R0.t.jdUT);
    const rr = Object.assign({}, R0, { astro: Object.assign({}, R0.astro || {}, { planets }) });
    return qzCalc(rr);
  }
  function currentR() {
    try {
      return typeof R !== "undefined" ? R : null;
    } catch (_) {
      return null;
    }
  }
  function currentCompare() {
    const r = currentR();
    if (!r?.t?.jdUT) throw new Error("请先建立档案并完成一次推演");
    const cmp = compare(r.t.jdUT);
    let qLegacy = null,
      qEngine = null;
    try {
      qLegacy = qzCalc(r);
    } catch (err) {
      qLegacy = { error: String(err?.message || err) };
    }
    try {
      qEngine = qizhengWithEngine(r);
    } catch (err) {
      qEngine = { error: String(err?.message || err) };
    }
    return Object.assign(cmp, {
      qizheng: {
        legacy: summaryQz(qLegacy),
        engine: summaryQz(qEngine),
        residualPolicy: "罗计/月孛/紫炁仍沿用 Tianji 四余 research 口径；V225 只替换七政星历输入。",
      },
    });
  }
  function summaryQz(q) {
    if (!q || q.error) return q;
    return {
      mingZhi: q.mingZhi,
      shenSun: q.shenSun,
      shenMoon: q.shenMoon,
      seven: (q.stars || [])
        .filter((x) => ["日", "月", "水", "金", "火", "木", "土"].includes(x.n))
        .map((x) => ({
          n: x.n,
          lon: +x.lon.toFixed(6),
          gong: x.gong?.zhi,
          xiu: x.xiu?.name,
          retro: !!x.retro,
        })),
    };
  }
  function suite() {
    const dates = [
      ["1900-01-01T12:00:00Z", 2415021.0],
      ["1950-01-01T12:00:00Z", 2433283.0],
      ["2000-01-01T12:00:00Z", 2451545.0],
      ["2024-06-20T12:00:00Z", 2460482.0],
      ["2026-10-06T12:00:00Z", 2461320.0],
    ];
    const cases = dates.map(([label, jd]) => Object.assign({ label }, compare(jd)));
    return {
      schema: "tianji.qizheng.ephemeris-suite.v1",
      build: BUILD,
      engine: clone(ENGINE),
      cases,
      summary: {
        cases: cases.length,
        maxAbs: +Math.max(...cases.map((x) => x.summary.maxAbs)).toFixed(6),
        structural: cases.reduce((s, x) => s + x.summary.structural, 0),
        boundarySensitive: cases.reduce((s, x) => s + x.summary.boundarySensitive, 0),
      },
    };
  }
  function rowTone(r) {
    return r.level === "structural"
      ? "bad"
      : r.level === "material"
        ? "warn"
        : r.level === "noticeable"
          ? "cyan"
          : "good";
  }
  function rowsHTML(R) {
    return `<div class="q225-tablewrap"><table class="q225-table"><thead><tr><th>七政</th><th>Legacy</th><th>Astronomy Engine</th><th>Δ 经度</th><th>宫 / 宿</th><th>边界</th><th>判断</th></tr></thead><tbody>${R.seven.map((r) => `<tr><td><b>${E(r.name)}</b></td><td>${r.legacy.toFixed(4)}°${r.legacyRetro ? " ℞" : ""}<br>${E(r.legacyGong || "—")} · ${E(r.legacyXiu || "—")}</td><td>${r.engine.toFixed(4)}°${r.engineRetro ? " ℞" : ""}<br>${E(r.engineGong || "—")} · ${E(r.engineXiu || "—")}</td><td>${r.delta >= 0 ? "+" : ""}${r.delta.toFixed(4)}°</td><td>${r.gongChanged ? '<span class="q225-state bad">宫变</span>' : '<span class="q225-state good">宫同</span>'} ${r.xiuChanged ? '<span class="q225-state bad">宿变</span>' : '<span class="q225-state good">宿同</span>'}${r.retroChanged ? ' <span class="q225-state bad">逆行判定变</span>' : ""}</td><td>${r.boundarySensitive ? '<span class="q225-state warn">敏感</span>' : '<span class="q225-state good">稳定</span>'}<br><small>宫 ${r.boundary.gong.toFixed(3)}° · 宿 ${r.boundary.xiu == null ? "—" : r.boundary.xiu.toFixed(3) + "°"}</small></td><td><span class="q225-state ${rowTone(r)}">${E(r.level)}</span></td></tr>`).join("")}</tbody></table></div>`;
  }
  function statusHTML() {
    const on = loaded();
    return `<div class="q225-item ${on ? "good" : "warn"}"><b>${on ? "Astronomy Engine 已加载" : "Astronomy Engine 尚未加载"}</b><small>${on ? "当前浏览器已经可以运行双轨星历。" : "V225 不在首屏自动联网。点击“加载可靠星历”后才从固定版本 CDN 加载；离线或加载失败时，legacy 继续可用。"}</small><div class="q225-badges"><span class="q225-badge ${on ? "good" : "gold"}">${on ? "READY" : "ON DEMAND"}</span><span class="q225-badge">v${ENGINE.version}</span><span class="q225-badge cyan">${ENGINE.license}</span><span class="q225-badge">${ENGINE.commit.slice(0, 10)}</span></div></div>`;
  }
  function resultHTML(R) {
    if (!R) return '<div class="q225-note">尚未运行当前档案双轨回归。</div>';
    const s = R.summary;
    return `<div class="q225-kpis" style="margin-bottom:7px"><div class="q225-kpi"><small>七政最大 Δ</small><b>${s.maxAbs.toFixed(4)}°</b></div><div class="q225-kpi"><small>平均 Δ</small><b>${s.meanAbs.toFixed(4)}°</b></div><div class="q225-kpi ${s.structural ? "bad" : "good"}"><small>结构变化</small><b>${s.structural}</b></div><div class="q225-kpi ${s.gongChanged ? "bad" : "good"}"><small>宫位变化</small><b>${s.gongChanged}</b></div><div class="q225-kpi ${s.xiuChanged ? "bad" : "good"}"><small>宿界变化</small><b>${s.xiuChanged}</b></div><div class="q225-kpi ${s.boundarySensitive ? "gold" : "good"}"><small>边界敏感</small><b>${s.boundarySensitive}</b></div></div>${rowsHTML(R)}`;
  }
  function batchHTML(S) {
    if (!S) return '<div class="q225-note">尚未运行批量回归。</div>';
    return `<div class="q225-list">${S.cases.map((c) => `<div class="q225-item ${c.summary.structural ? "warn" : "good"}"><b>${E(c.label)} · max Δ ${c.summary.maxAbs.toFixed(4)}°</b><small>结构变化 ${c.summary.structural} · 宫变化 ${c.summary.gongChanged} · 宿变化 ${c.summary.xiuChanged} · 边界敏感 ${c.summary.boundarySensitive}</small></div>`).join("")}</div>`;
  }
  function panel() {
    return `<section class="q225" id="q225Ephemeris">
  <section class="q225-hero"><div class="q225-head"><div><h3>V225 · 七政星历适配器一期 / Astronomy Engine 双轨回归</h3><p>七政核心迁移开始。V225 先把可靠星历接成独立 Provider，并与旧轻量内核同时间双算；默认仍是 AUDIT ONLY，不静默改变七政四余正式结果。四余、宿界、命宫、庙旺规则全部保持不动，因此任何差异都能明确归因到“七政天文位置输入”。</p></div><span class="q225-schema">${SCHEMA}</span></div>
   <div class="q225-tools"><button class="primary" id="q225Load" type="button">${loaded() ? "星历已加载" : "加载可靠星历"}</button><button id="q225Current" type="button"${loaded() ? "" : " disabled"}>当前档案双轨回归</button><button id="q225Batch" type="button"${loaded() ? "" : " disabled"}>运行 5 时点回归</button><button id="q225Export" type="button"${LAST || BATCH ? "" : " disabled"}>导出回归报告</button></div>
  </section>
  <div class="q225-kpis">
   <div class="q225-kpi ${loaded() ? "good" : "gold"}"><small>新 Provider</small><b>${loaded() ? "READY" : "DEFERRED"}</b></div>
   <div class="q225-kpi cyan"><small>固定版本</small><b>2.1.19</b></div>
   <div class="q225-kpi good"><small>许可证</small><b>MIT</b></div>
   <div class="q225-kpi"><small>运行模式</small><b>AUDIT ONLY</b></div>
   <div class="q225-kpi"><small>四余</small><b>未改</b></div>
   <div class="q225-kpi gold"><small>Core 切换</small><b>尚未</b></div>
  </div>
  <div class="q225-grid">
   <section class="q225-card"><h4>Provider 状态</h4><div id="q225Status">${statusHTML()}</div><div class="q225-note" style="margin-top:6px">固定源：astronomy-engine@2.1.19；Git commit <span class="q225-code">${ENGINE.commit}</span>；源码 blob <span class="q225-code">${ENGINE.sourceBlob}</span>。V225 采用按需固定版本加载，避免首屏联网和启动性能回退；后续若正式切换为 Core，再决定是否把固定构建直接 vendor 到单 HTML。</div></section>
   <aside class="q225-card"><h4>迁移边界</h4><div class="q225-list">
    <div class="q225-item good"><b>只替换七政位置</b><small>日、月、水、金、火、木、土使用新的地心真黄道日期坐标；旧内核继续作为 regression 基准。</small></div>
    <div class="q225-item warn"><b>四余绝不跟着偷换</b><small>罗睺/计都、月孛、紫炁继续走当前 research policy，避免把“星历升级”和“四余流派选择”混成一次不可审计的大改。</small></div>
    <div class="q225-item cyan"><b>宫界 / 宿界敏感单独标记</b><small>即使经度差很小，只要跨过当前宫界或宿界，也标成 structural；这比只看小数点差值更符合七政实际影响。</small></div>
   </div></aside>
  </div>
  <section class="q225-card"><h4>当前档案 · Legacy vs Astronomy Engine</h4><div id="q225Result">${resultHTML(LAST)}</div></section>
  <section class="q225-card"><h4>固定时点回归</h4><div id="q225BatchOut">${batchHTML(BATCH)}</div></section>
  <section class="q225-card"><h4>V225 Gate</h4><div class="q225-list">
   <div class="q225-item good"><b>Provider Adapter：完成</b><small>统一输出与现有 asPlanets() 兼容的 lon / speed / retro / lat / dist 数据结构。</small></div>
   <div class="q225-item good"><b>双轨 Regression：完成</b><small>七政经度、逆行、宫位、宿位、边界敏感全部逐项比较；支持当前档案和固定 5 时点套件。</small></div>
   <div class="q225-item warn"><b>Core Adoption：未放行</b><small>V225 不重写全局 qzCalc 默认输入。必须先看真实回归结果，再决定 V226 是否做“可控接管”。</small></div>
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
    const old = pane.querySelector("#q225Ephemeris"),
      tmp = document.createElement("div");
    tmp.innerHTML = panel();
    const fresh = tmp.firstElementChild;
    if (old) old.replaceWith(fresh);
    else pane.insertAdjacentElement("afterbegin", fresh);
  }
  async function doLoad() {
    const b = document.getElementById("q225Load");
    if (b) {
      b.disabled = true;
      b.textContent = "加载中…";
    }
    try {
      await loadEngine();
      mount();
      try {
        toast("Astronomy Engine 已加载，七政双轨回归可用");
      } catch (_) {}
    } catch (err) {
      try {
        toast(String(err?.message || err));
      } catch (_) {}
    } finally {
      const bb = document.getElementById("q225Load");
      if (bb) {
        bb.disabled = false;
        bb.textContent = loaded() ? "星历已加载" : "加载可靠星历";
      }
    }
  }
  document.addEventListener(
    "click",
    async (e) => {
      if (e.target?.id === "q225Load") {
        await doLoad();
        return;
      }
      if (e.target?.id === "q225Current") {
        try {
          LAST = currentCompare();
          mount();
        } catch (err) {
          try {
            toast("回归失败：" + String(err?.message || err));
          } catch (_) {}
        }
        return;
      }
      if (e.target?.id === "q225Batch") {
        try {
          BATCH = suite();
          mount();
        } catch (err) {
          try {
            toast("批量回归失败：" + String(err?.message || err));
          } catch (_) {}
        }
        return;
      }
      if (e.target?.id === "q225Export") {
        save("天机盘_V225_七政星历双轨回归.json", {
          schema: REPORT_SCHEMA,
          build: BUILD,
          engine: ENGINE,
          current: LAST,
          batch: BATCH,
          foundation: window.TianjiQizhengFoundationV224?.report?.() || null,
        });
        return;
      }
    },
    true,
  );

  TianjiPaneScheduler.register("qizheng", "v225-qizheng-ephemeris-js", mount);

  try {
    if (window.TianjiCore) {
      TianjiCore.registerSource({
        id: "astronomy-engine-2.1.19",
        type: "external",
        title: "Astronomy Engine 2.1.19",
        version: ENGINE.commit,
        license: "MIT",
        note: "V225 按需加载固定 npm 版本；七政 Provider Adapter 与 legacy 双轨回归。",
      });
      TianjiCore.registerEngine(
        {
          id: "qizheng.ephemeris.astronomy-engine.v1",
          system: "qizheng",
          name: "Qizheng Astronomy Engine Adapter",
          version: "1.0.0",
          source: "astronomy-engine-2.1.19",
          doctrine: "apparent geocentric true ecliptic of date for Sun/Moon/planets; audit-only",
          status: "research",
        },
        () => ({ loaded: loaded(), engine: clone(ENGINE), last: clone(LAST), batch: clone(BATCH) }),
      );
    }
  } catch (err) {
    console.warn("[V225 registry]", err);
  }

  const TASKS225 = [
    { id: "ai", p: "P0", name: "统一 AI 解释层", state: "done", note: "v171 完成" },
    { id: "mcp", p: "P0", name: "MCP / API 外部调用层", state: "done", note: "v172 完成" },
    {
      id: "kg",
      p: "P0",
      name: "典籍 Evidence / 规则知识图谱",
      state: "done",
      note: "v173 第一阶段；持续扩充奇门与四余证据链",
    },
    { id: "router", p: "P0", name: "自然语言问事路由", state: "done", note: "v196–v197 完成" },
    { id: "consumer", p: "P0", name: "统一消费者结果页 / 报告", state: "done", note: "v198 完成" },
    {
      id: "qimen-evidence",
      p: "P1",
      name: "奇门四家第三方对拍 / 高级 Evidence",
      state: "doing",
      note: "v221–v223 已完成第一阶段外部 Golden / 日家原典；剩余日家完整盘 Doctrine 与月家逐宫扩样。",
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
      note: "V224 完成 Provider/许可证决策；V225 完成 Astronomy Engine 2.1.19 按需 Provider Adapter 与 legacy 双轨回归。默认仍 AUDIT ONLY。下一步依据真实回归结果做可控接管，并继续四余历元 / 宿界 / 命身宫 Evidence。",
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
  const BOARD225 = {
    schema: "tianji.priority.board.v1",
    build: BUILD,
    total: 14,
    done: 12,
    doing: 2,
    blocked: 0,
    progress: 92.9,
    next: [
      "在真实浏览器加载 Astronomy Engine 并运行当前档案 + 5 时点双轨回归",
      "V226 七政星历可控接管：仅在回归门禁通过后切换",
      "四余绝对历元 / 二十八宿宿界 / 命身宫 Evidence",
      "奇门日家完整盘 / 月家逐宫扩样",
    ],
    tasks: TASKS225,
  };
  function applyBoard() {
    window.TianjiPriorityBoard = Object.freeze({
      schema: BOARD225.schema,
      snapshot: () => clone(BOARD225),
    });
    const road = window.TianjiRoadmap || {};
    window.TianjiRoadmap = Object.freeze(
      Object.assign({}, road, {
        urgentImportant: clone(BOARD225),
        nextMainline: clone(BOARD225.next),
      }),
    );
  }
  applyBoard();
  window.addEventListener("tianji:lazy-ready", () => setTimeout(applyBoard, 0));

  function selfTest() {
    const C = [],
      add = (id, ok, d = "") => C.push({ id, ok: !!ok, d });
    add("legacy", typeof asPlanets === "function" && typeof qzCalc === "function", "");
    add(
      "adapter",
      typeof enginePlanets === "function" &&
        typeof compare === "function" &&
        typeof qizhengWithEngine === "function",
      "",
    );
    add(
      "pinned",
      ENGINE.version === "2.1.19" && ENGINE.commit === "865d3da7d8112bbc7911238052c6af4aaf877181",
      ENGINE.commit,
    );
    add("audit-only", true, "qzCalc default untouched");
    add("task.doing", TASKS225.find((x) => x.id === "qizheng")?.state === "doing", "");
    return { ok: C.every((x) => x.ok), checks: C };
  }
  const TEST = selfTest();

  window.TianjiQizhengEphemerisV225 = Object.freeze({
    version: "1.0.0",
    build: BUILD,
    schema: SCHEMA,
    reportSchema: REPORT_SCHEMA,
    engine: () => clone(ENGINE),
    loaded,
    load: () => loadEngine(),
    planets: (jd) => clone(enginePlanets(jd)),
    legacy: (jd) => clone(legacyPlanets(jd)),
    compare: (jd) => clone(compare(jd)),
    current: () => clone(currentCompare()),
    suite: () => clone(suite()),
    qizhengWithEngine: (r) => clone(qizhengWithEngine(r || currentR())),
    last: () => ({ current: clone(LAST), batch: clone(BATCH) }),
    selfTest: () => clone(TEST),
    manifest: () => ({
      module: "Qizheng Ephemeris Adapter V225",
      provider: "Astronomy Engine 2.1.19",
      providerMode: "on-demand verified local cache first; pinned remote bootstrap",
      coreAdoption: "AUDIT ONLY",
      legacyPreserved: true,
      residualsChanged: false,
      regression: [
        "seven-longitude",
        "retrograde",
        "gong-boundary",
        "xiu-boundary",
        "current-profile",
        "five-date-suite",
      ],
      next: "V226 controlled adoption + V227 verified persistent offline cache",
    }),
  });
  window.TianjiSystemV225 = {
    version: "v225",
    build: BUILD,
    qizhengEphemerisAdapter: true,
    qizhengCoreAdopted: false,
    provider: "Astronomy Engine 2.1.19",
    baseline: "v224",
  };
})();
