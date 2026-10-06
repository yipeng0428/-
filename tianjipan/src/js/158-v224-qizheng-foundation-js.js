(() => {
  "use strict";
  const BUILD = "v224 · 2026-10-06 22:08 +08:00";
  const SCHEMA = "tianji.qizheng.foundation.v1";
  const CORE_SCHEMA = "tianji.qizheng.ephemeris-policy.v1";
  const clone = (x) => (x == null ? x : JSON.parse(JSON.stringify(x)));
  const E = (s) =>
    String(s ?? "").replace(
      /[&<>"']/g,
      (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
    );

  const PROVIDERS = [
    {
      id: "astronomy-engine",
      name: "Astronomy Engine",
      role: "recommended-core",
      status: "approved-pending-vendor",
      license: "MIT",
      commit: "865d3da7d8112bbc7911238052c6af4aaf877181",
      licenseBlob: "27f33b2e1ed56f16bacdb0ae75c29d1c94a02cf6",
      browserBlob: "fc5ab5c406c6fd64bdd537772e4cc7c8d438275b",
      size: "约116 KB minified",
      accuracy: "项目声明：相对 NOVAS/JPL 等验证，目标误差始终在 1 arcminute 内",
      browser: "原生浏览器 JavaScript、无运行时依赖",
      decision: "V225 首选：vendor 进单文件，七政位置走它；保留旧内核双轨回归。",
      url: "https://github.com/cosinekitty/astronomy",
    },
    {
      id: "swiss-ephemeris",
      name: "Swiss Ephemeris",
      role: "optional-high-precision",
      status: "license-gated",
      license: "AGPL-3.0 或 Professional License（二选一）",
      commit: "不在 V224 固定",
      size: "库/数据方案显著重于当前单文件需求",
      accuracy: "专业占星/天文软件常用高精度方案",
      browser: "需要额外封装/服务或 WASM 等工程层",
      decision:
        "不作为默认内核；如未来商业闭源/服务使用，先解决专业许可证。若采用 AGPL，则必须按其条件处理整个项目。",
      url: "https://www.astro.com/swisseph/",
    },
    {
      id: "jpl-novas-reference",
      name: "JPL DE / NOVAS",
      role: "validation-reference",
      status: "reference-only",
      license: "按具体软件/数据条款分别核对",
      commit: "—",
      size: "高精度 DE 文件通常不适合当前单 HTML 直接携带",
      accuracy: "验证基准级",
      browser: "不适合作为当前便携单文件默认运行时",
      decision: "用作外部金样/对拍，不直接内嵌为前端默认。",
      url: "https://ssd.jpl.nasa.gov/horizons/",
    },
    {
      id: "tianji-legacy",
      name: "天机现有轻量天文内核",
      role: "legacy-fallback",
      status: "workbench-only",
      license: "项目内部",
      commit: "V223 baseline",
      size: "已内置",
      accuracy:
        "太阳沿用现有太阳黄经；五星为 JPL Approximate Positions 开普勒根数；月球为 Meeus 主要周期项。适合可视化/研究，不作为七政核心金标准。",
      browser: "单文件、离线",
      decision: "V225 后保留为 fallback / regression，不再作为七政核心默认来源。",
      url: "",
    },
  ];

  const PRIMARY = [
    {
      id: "tushubian-21",
      title: "《圖書編》卷二十一 · 四餘總叙",
      type: "primary-classic",
      url: "https://zh.wikisource.org/zh-hant/%E5%9C%96%E6%9B%B8%E7%B7%A8_%28%E5%9B%9B%E5%BA%AB%E5%85%A8%E6%9B%B8%E6%9C%AC%29/%E5%8D%B7021",
      supports: [
        "罗睺=天首/交初",
        "计都=天尾并与罗睺相对",
        "罗计逆行",
        "紫炁二十八年十闰一周",
        "月孛与月行最迟处相关",
        "月孛六十二年七周的传统周期描述",
      ],
    },
    {
      id: "gjin-lvli-64",
      title: "《古今律曆考》卷六十四 · 四餘",
      type: "primary-classic",
      url: "https://zh.wikisource.org/zh-hant/%E5%8F%A4%E4%BB%8A%E5%BE%8B%E5%8E%AF%E8%80%83_%28%E5%9B%9B%E5%BA%AB%E5%85%A8%E6%9B%B8%E6%9C%AC%29/%E5%8D%B764",
      supports: [
        "炁/孛顺行，罗/计逆行",
        "紫炁二十八年一周",
        "月孛六十二日行七度、六十二年七周",
        "罗计约十八年一周",
        "罗计为日月交道首尾",
      ],
    },
  ];

  const RESIDUALS = [
    {
      id: "luohou-jidu",
      name: "罗睺 / 计都",
      current: "罗睺=月球平均升交点；计都=对点 +180°",
      classical: "古籍明确“天首/天尾”“相对”“逆行”，并给出约十八年一周的传统描述。",
      status: "doing",
      decision:
        "定义层可继续：保留“平均交点”作为现代代理，但必须把“传统均平点”与“现代真实/平均月球交点”分开标记。V225 先不使用真交点替换。",
      blocker: "需要确定用于正式七政四余的绝对历元/传统立成口径，并做历史盘金样。",
    },
    {
      id: "yuebei",
      name: "月孛",
      current: "月球平均远地点近似",
      classical: "古籍把孛与月行最迟处关联，记有“六十二日行七度”“六十二年七周”等传统周期描述。",
      status: "doing",
      decision:
        "“月球远地点/拱点”作为现代天文代理是有物理对应的，但不等价于传统历法绝对躔度。保留两层命名。",
      blocker:
        "传统周期文字本身存在单位/历法背景，不能直接拿现代日长硬拟合绝对经度；需要历元金样。",
    },
    {
      id: "ziqi",
      name: "紫炁",
      current: "约28年均速模型，现有公式带一个未独立核验的绝对历元",
      classical: "《圖書編》《古今律曆考》均支持“二十八年十闰而炁一周天”的传统周期框架。",
      status: "pending",
      decision: "周期可进入规则层；绝对经度暂不升级为 verified。现有 qzZiqi 只标 research。",
      blocker: "需要可靠起算历元或至少两个可确认历史躔度样本，才能固定绝对位置。",
    },
  ];

  const CHECKS = [
    {
      id: "ephemeris.provider",
      name: "七政星历提供者",
      state: "done",
      result: "首选 Astronomy Engine MIT；Swiss 退为许可受限可选；JPL/NOVAS 为验证基准。",
    },
    {
      id: "license.strategy",
      name: "许可证策略",
      state: "done",
      result: "默认内核选 MIT 路线，可继续维持便携单文件与未来商业选择；Swiss 不直接嵌入。",
    },
    {
      id: "residual.definition",
      name: "四余概念定义",
      state: "doing",
      result:
        "罗/计=交道首尾、月孛=月行迟处、紫炁=传统均平隐曜已有原典支撑；现代天文代理与传统躔度必须分层。",
    },
    {
      id: "residual.epoch",
      name: "四余绝对历元",
      state: "pending",
      result: "罗计/月孛/紫炁仍缺可审计绝对历元或足够历史躔度金样。",
    },
    {
      id: "xiu.frame",
      name: "二十八宿宿界 / 历元",
      state: "pending",
      result: "当前 QZ_XIU 是固定回归黄道简化表；尚未完成距星制/恒星制/回归制的来源审计与版本化。",
    },
    {
      id: "palace.formula",
      name: "命宫 / 身宫口径",
      state: "pending",
      result: "当前中气法与太阳/太阴两种身宫并列；需补原典规则链与外部盘例。",
    },
    {
      id: "dignity.tables",
      name: "庙旺喜乐 / 化曜表",
      state: "pending",
      result: "现有表能运行，但尚缺逐条 provenance；核心化前必须把表源与流派做成 Rule Pack。",
    },
    {
      id: "dashas",
      name: "行限 / 大限",
      state: "blocked",
      result: "当前明确未实现；待命宫限年数与规则来源核实后再进入。",
    },
  ];

  const PLAN = [
    {
      phase: "A",
      title: "七政可靠星历",
      state: "next",
      work: "把 Astronomy Engine 固定 commit 的 browser build vendor 进单 HTML；建立 provider adapter；只替换七政坐标，不碰四余/宿界/命宫规则。",
    },
    {
      phase: "B",
      title: "双轨回归",
      state: "next",
      work: "同一日期并算 legacy vs Astronomy Engine；比较日/月五星黄经、逆行、宿界/宫界影响；靠近边界时标记 sensitive，不强制归类。",
    },
    {
      phase: "C",
      title: "四余 Doctrine Pack",
      state: "research",
      work: "传统均平躔度与现代轨道代理分开；先解决罗计/月孛历元，再解决紫炁历元；每个口径带 source/rule/golden。",
    },
    {
      phase: "D",
      title: "宿界 / 宫法 / 庙旺",
      state: "research",
      work: "QZ_XIU、命宫身宫、宫主、庙旺喜乐、化曜全部建立可切换 Rule Pack 与 Evidence。",
    },
    {
      phase: "E",
      title: "核心化冻结",
      state: "later",
      work: "完成外部金样、正式 Evidence 报告和旧档迁移说明后，才把“七政四余”从 workbench 升为 core。",
    },
  ];

  function currentAudit() {
    const out = {
      available: typeof qzCalc === "function" && typeof asPlanets === "function",
      source: "tianji-legacy",
      residuals: {},
      limits: [],
    };
    try {
      if (window.R && out.available) {
        const q = qzCalc(window.R);
        const map = Object.fromEntries((q?.stars || []).map((x) => [x.n, x]));
        ["罗睺", "计都", "月孛", "紫炁"].forEach((n) => {
          if (map[n])
            out.residuals[n] = { lon: map[n].lon, gong: map[n].gong?.zhi, xiu: map[n].xiu?.name };
        });
      }
    } catch (err) {
      out.error = String(err?.message || err);
    }
    out.limits = [
      "七政仍来自现有轻量内核，不提升为 core verified",
      "罗计/月孛为现代平均轨道点代理",
      "紫炁绝对历元未独立验证",
      "宿界是固定回归黄道简化表",
    ];
    return out;
  }

  function providerHTML() {
    return `<div class="q224-tablewrap"><table class="q224-table"><thead><tr><th>候选</th><th>角色</th><th>许可</th><th>浏览器 / 体积</th><th>精度 / 验证</th><th>V224 决策</th></tr></thead><tbody>${PROVIDERS.map((p) => `<tr><td><b>${E(p.name)}</b>${p.url ? `<br><a class="q224-link" href="${E(p.url)}" target="_blank" rel="noopener noreferrer">source</a>` : ""}<br><span class="q224-code">${E(p.commit)}</span></td><td><span class="q224-state ${p.status === "approved-pending-vendor" ? "done" : p.status === "workbench-only" ? "pending" : "doing"}">${E(p.role)}</span></td><td>${E(p.license)}</td><td>${E(p.browser)}<br>${E(p.size)}</td><td>${E(p.accuracy)}</td><td>${E(p.decision)}</td></tr>`).join("")}</tbody></table></div>`;
  }
  function residualHTML() {
    return RESIDUALS.map(
      (r) =>
        `<div class="q224-item ${r.status === "pending" ? "warn" : "cyan"}"><b>${E(r.name)} · ${E(r.status)}</b><small><strong>现状：</strong>${E(r.current)}<br><strong>原典支持：</strong>${E(r.classical)}<br><strong>决策：</strong>${E(r.decision)}<br><strong>尚缺：</strong>${E(r.blocker)}</small></div>`,
    ).join("");
  }
  function checkHTML() {
    return `<div class="q224-tablewrap"><table class="q224-table"><thead><tr><th>前置项</th><th>状态</th><th>V224 结论</th></tr></thead><tbody>${CHECKS.map((c) => `<tr><td><b>${E(c.name)}</b><br><span class="q224-code">${E(c.id)}</span></td><td><span class="q224-state ${c.state}">${E(c.state)}</span></td><td>${E(c.result)}</td></tr>`).join("")}</tbody></table></div>`;
  }
  function sourcesHTML() {
    return PRIMARY.map(
      (s) =>
        `<div class="q224-item good"><b>${E(s.title)}</b><small>${E(s.supports.join("；"))}<br><a class="q224-link" href="${E(s.url)}" target="_blank" rel="noopener noreferrer">${E(s.url)}</a></small><div class="q224-badges"><span class="q224-badge good">${E(s.type)}</span><span class="q224-badge">public-domain classic</span></div></div>`,
    ).join("");
  }
  function planHTML() {
    return PLAN.map(
      (p) =>
        `<div class="q224-item ${p.state === "next" ? "good" : p.state === "research" ? "cyan" : "warn"}"><b>${E(p.phase)} · ${E(p.title)}</b><small>${E(p.work)}</small><div class="q224-badges"><span class="q224-badge ${p.state === "next" ? "good" : p.state === "research" ? "cyan" : "gold"}">${E(p.state)}</span></div></div>`,
    ).join("");
  }
  function panel() {
    const A = currentAudit();
    const ready = CHECKS.filter((x) => x.state === "done").length,
      active = CHECKS.filter((x) => x.state === "doing").length,
      pending = CHECKS.filter((x) => x.state === "pending").length,
      blocked = CHECKS.filter((x) => x.state === "blocked").length;
    return `<section class="q224" id="q224Foundation">
  <section class="q224-hero"><div class="q224-head"><div><h3>V224 · 七政四余核心化前置决策台</h3><p>这一步不再把“星历 / 四余 / 许可证”混成一个模糊 blocker。V224 已经完成星历提供者与许可证路线决策，并把真正剩余问题拆成四余绝对历元、宿界坐标系、命身宫规则、庙旺化曜 provenance 与行限规则。当前七政四余仍是 workbench，尚未冒充 core verified。</p></div><span class="q224-schema">${SCHEMA}</span></div>
   <div class="q224-tools"><button class="primary" id="q224Export" type="button">导出 Foundation Report</button><button id="q224Refresh" type="button">刷新当前盘审计</button></div>
  </section>
  <div class="q224-kpis">
   <div class="q224-kpi good"><small>前置已决策</small><b>${ready}</b></div>
   <div class="q224-kpi cyan"><small>进行中</small><b>${active}</b></div>
   <div class="q224-kpi gold"><small>待核验</small><b>${pending}</b></div>
   <div class="q224-kpi bad"><small>真正阻塞</small><b>${blocked}</b></div>
   <div class="q224-kpi good"><small>七政首选内核</small><b>Astronomy Engine</b></div>
   <div class="q224-kpi cyan"><small>任务状态</small><b>blocked → doing</b></div>
  </div>
  <section class="q224-card"><h4>一、星历 / 许可证决策矩阵</h4>${providerHTML()}<div class="q224-note" style="margin-top:7px">许可证工程判断：Astronomy Engine 的固定版本采用 MIT，适合继续保持单文件、离线和未来分发灵活性；Swiss Ephemeris 官方要求在 AGPL 与 Professional License 之间选择，因此不直接作为默认内核。这里是工程许可决策记录，不替代法律意见。</div></section>
  <div class="q224-grid">
   <section class="q224-card"><h4>二、四余 Doctrine Audit</h4><div class="q224-list">${residualHTML()}</div></section>
   <aside class="q224-card"><h4>三、原典 Evidence</h4><div class="q224-list">${sourcesHTML()}</div></aside>
  </div>
  <section class="q224-card"><h4>四、核心化前置清单</h4>${checkHTML()}</section>
  <div class="q224-grid">
   <section class="q224-card"><h4>五、当前运行盘审计</h4>
    <div class="q224-item warn"><b>当前 Provider：${E(A.source)}</b><small>${E(A.available ? "现有 qzCalc / asPlanets 可运行，但仍属于研究工作台。" : "当前运行时未取得 qzCalc/asPlanets。")}</small></div>
    <div class="q224-list">${
      Object.entries(A.residuals || {})
        .map(
          ([n, v]) =>
            `<div class="q224-item"><b>${E(n)} · ${Number(v.lon).toFixed(3)}°</b><small>${E(v.gong || "—")}宫 · ${E(v.xiu || "—")}宿</small></div>`,
        )
        .join("") || '<div class="q224-note">需要先起盘后才显示当前四余快照。</div>'
    }
   </section>
   <aside class="q224-card"><h4>六、实施路线</h4><div class="q224-list">${planHTML()}</div></aside>
  </div>
  <section class="q224-card"><h4>V224 结论</h4><div class="q224-list">
   <div class="q224-item good"><b>七政四余不再维持“未知前置条件”的 blocked 状态</b><small>星历提供者与许可证路线已经明确，因此任务转为 <b>doing</b>。下一版可以直接实施七政可靠星历适配器。</small></div>
   <div class="q224-item warn"><b>但不能现在宣布“七政四余核心化完成”</b><small>四余绝对历元、二十八宿坐标系、命身宫与庙旺化曜来源仍需逐层 Evidence。尤其紫炁只有周期框架得到古籍支持，当前绝对位置公式尚未得到独立金样。</small></div>
   <div class="q224-item cyan"><b>V225 的明确目标</b><small>将固定 commit 的 Astronomy Engine 浏览器构建 vendor 进单 HTML，建立 <span class="q224-code">TianjiQizhengEphemeris</span> adapter，并对 legacy / new provider 做双轨黄经与边界回归。</small></div>
  </div></section>
 </section>`;
  }
  function report() {
    return {
      schema: SCHEMA,
      coreSchema: CORE_SCHEMA,
      build: BUILD,
      generatedAt: new Date().toISOString(),
      providers: clone(PROVIDERS),
      primarySources: clone(PRIMARY),
      residualPolicies: clone(RESIDUALS),
      prerequisites: clone(CHECKS),
      implementationPlan: clone(PLAN),
      current: currentAudit(),
      decision: {
        ephemeris: "Astronomy Engine MIT / pinned commit as default candidate",
        swiss: "optional only; license-gated",
        jpl: "validation reference",
        legacy: "fallback/regression only",
        taskState: "doing",
        notYetCore: [
          "四余绝对历元",
          "二十八宿宿界/历元",
          "命宫/身宫原典链",
          "庙旺喜乐/化曜 provenance",
          "行限",
        ],
      },
    };
  }
  function download(name, obj) {
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
    const old = pane.querySelector("#q224Foundation"),
      tmp = document.createElement("div");
    tmp.innerHTML = panel();
    const fresh = tmp.firstElementChild;
    if (old) old.replaceWith(fresh);
    else pane.insertAdjacentElement("afterbegin", fresh);
  }
  document.addEventListener(
    "click",
    (e) => {
      if (e.target?.id === "q224Export") {
        download("天机盘_V224_七政四余_FoundationReport.json", report());
        return;
      }
      if (e.target?.id === "q224Refresh") {
        mount();
        return;
      }
    },
    true,
  );

  /* 在 qizheng 正常渲染后再挂前置决策台；不新增启动全局扫描。 */
  TianjiPaneScheduler.register("qizheng", "v224-qizheng-foundation-js", mount);

  try {
    if (window.TianjiCore) {
      TianjiCore.registerSource({
        id: "classic-four-residuals-tushubian",
        type: "classic",
        title: "《圖書編》卷二十一·四餘總叙",
        version: "四庫全書本",
        license: "public-domain-classic",
        note: "四余定义、运行方向与传统周期描述。",
      });
      TianjiCore.registerSource({
        id: "classic-four-residuals-lvli",
        type: "classic",
        title: "《古今律曆考》卷六十四·四餘",
        version: "四庫全書本",
        license: "public-domain-classic",
        note: "紫炁/月孛/罗计均平周期与交道定义的旁证。",
      });
      TianjiCore.registerSource({
        id: "astronomy-engine-v224",
        type: "external",
        title: "Astronomy Engine",
        version: PROVIDERS[0].commit,
        license: "MIT",
        note: "V224 选定的七政可靠星历候选；V225 才 vendor 进单文件。",
      });
      TianjiCore.registerEngine(
        {
          id: "qizheng.foundation.v1",
          system: "qizheng",
          name: "Qizheng Foundation Audit",
          version: "1.0.0",
          source: "astronomy-engine-v224",
          doctrine: "ephemeris/license/residual provenance split",
          status: "research",
        },
        () => report(),
      );
    }
  } catch (err) {
    console.warn("[V224 registry]", err);
  }

  const TASKS224 = [
    { id: "ai", p: "P0", name: "统一 AI 解释层", state: "done", note: "v171 完成" },
    { id: "mcp", p: "P0", name: "MCP / API 外部调用层", state: "done", note: "v172 完成" },
    {
      id: "kg",
      p: "P0",
      name: "典籍 Evidence / 规则知识图谱",
      state: "done",
      note: "v173 第一阶段；V223/V224 扩充奇门日家与四余原典链",
    },
    { id: "router", p: "P0", name: "自然语言问事路由", state: "done", note: "v196–v197 完成" },
    { id: "consumer", p: "P0", name: "统一消费者结果页 / 报告", state: "done", note: "v198 完成" },
    {
      id: "qimen-evidence",
      p: "P1",
      name: "奇门四家第三方对拍 / 高级 Evidence",
      state: "doing",
      note: "v221–v223：外部 Golden、第二独立参考与日家古籍 60/60 已推进；剩余完整日家流派包、月家逐宫扩样。",
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
      note: "v203–v204 + V218/V219 渲染稳定层",
    },
    {
      id: "qizheng",
      p: "P1",
      name: "七政四余核心化",
      state: "doing",
      note: "V224 前置决策完成：七政星历首选 Astronomy Engine MIT；Swiss Ephemeris 作为许可受限可选；四余已有原典定义/周期 Evidence。剩余：V225 vendor 星历内核与双轨回归、四余绝对历元、宿界/命身宫/庙旺化曜 provenance。",
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
  const BOARD224 = {
    schema: "tianji.priority.board.v1",
    build: BUILD,
    total: 14,
    done: 12,
    doing: 2,
    blocked: 0,
    progress: 92.9,
    next: [
      "V225 七政星历内核一期：Astronomy Engine vendor + provider adapter + legacy 双轨回归",
      "四余绝对历元：罗计 / 月孛 / 紫炁历史躔度金样",
      "奇门月家逐宫外部扩样 / 日家完整盘 Doctrine",
      "二十八宿宿界 / 命身宫 / 庙旺化曜 Evidence",
    ],
    tasks: TASKS224,
  };
  function applyBoard() {
    window.TianjiPriorityBoard = Object.freeze({
      schema: BOARD224.schema,
      snapshot: () => clone(BOARD224),
    });
    const road = window.TianjiRoadmap || {};
    window.TianjiRoadmap = Object.freeze(
      Object.assign({}, road, {
        urgentImportant: clone(BOARD224),
        nextMainline: clone(BOARD224.next),
        qizhengFoundation: {
          build: BUILD,
          state: "doing",
          ephemeris: "astronomy-engine",
          license: "MIT",
          residualEpoch: "pending",
        },
      }),
    );
  }
  applyBoard();
  window.addEventListener("tianji:lazy-ready", () => setTimeout(applyBoard, 0));

  function selfTest() {
    const C = [],
      add = (id, ok, d = "") => C.push({ id, ok: !!ok, d });
    add(
      "qz.functions",
      typeof qzCalc === "function" &&
        typeof asPlanets === "function" &&
        typeof qzNode === "function" &&
        typeof qzYuebei === "function" &&
        typeof qzZiqi === "function",
      "",
    );
    add("providers", PROVIDERS.length === 4, String(PROVIDERS.length));
    add(
      "astronomy.pinned",
      PROVIDERS[0].commit === "865d3da7d8112bbc7911238052c6af4aaf877181",
      PROVIDERS[0].commit,
    );
    add("astronomy.license", PROVIDERS[0].license === "MIT", PROVIDERS[0].license);
    add("residuals", RESIDUALS.length === 3, String(RESIDUALS.length));
    add("primary", PRIMARY.length === 2, String(PRIMARY.length));
    add("board.qizheng.doing", TASKS224.find((x) => x.id === "qizheng")?.state === "doing", "");
    add("board.no.blocked", TASKS224.filter((x) => x.state === "blocked").length === 0, "");
    return { ok: C.every((x) => x.ok), checks: C };
  }
  const TEST = selfTest();

  window.TianjiQizhengFoundationV224 = Object.freeze({
    version: "1.0.0",
    build: BUILD,
    schema: SCHEMA,
    coreSchema: CORE_SCHEMA,
    providers: () => clone(PROVIDERS),
    primarySources: () => clone(PRIMARY),
    residualPolicies: () => clone(RESIDUALS),
    prerequisites: () => clone(CHECKS),
    plan: () => clone(PLAN),
    currentAudit: () => clone(currentAudit()),
    report: () => clone(report()),
    selfTest: () => clone(TEST),
    manifest: () => ({
      module: "Qizheng Foundation V224",
      taskState: "doing",
      ephemerisDecision: {
        defaultCandidate: "Astronomy Engine",
        license: "MIT",
        commit: PROVIDERS[0].commit,
      },
      swissDecision: "optional-license-gated",
      residualEvidence: "definitions/cycle framework partially closed; absolute epochs pending",
      next: "V225 vendor Astronomy Engine + provider adapter + dual-track regression",
      corePromoted: false,
    }),
  });
  window.TianjiSystemV224 = {
    version: "v224",
    build: BUILD,
    qizhengFoundation: true,
    qizhengTask: "doing",
    ephemerisCandidate: "Astronomy Engine",
    corePromoted: false,
    algorithmChanged: false,
    baseline: "v223",
  };
})();
