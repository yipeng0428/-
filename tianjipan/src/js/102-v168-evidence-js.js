(() => {
  "use strict";
  const V168_BUILD = "v168 · 2026-10-05 16:20 +08:00";
  const clone = (x) => {
    try {
      return structuredClone(x);
    } catch (_) {
      try {
        return JSON.parse(JSON.stringify(x));
      } catch (__) {
        return x;
      }
    }
  };
  const EV168 = { filter: "all", tests: {} };
  const safe = (fn, fb = null) => {
    try {
      return fn();
    } catch (_) {
      return fb;
    }
  };
  function coreManifest() {
    return safe(
      () => (window.TianjiCore && TianjiCore.manifest ? TianjiCore.manifest() : null),
      null,
    );
  }
  function apiManifest(api) {
    return safe(() => (api && api.manifest ? api.manifest() : null), null);
  }
  function apiTest(api) {
    return safe(() => (api && api.selfTest ? api.selfTest() : null), null);
  }
  function statusOf(id) {
    if (id === "calendar") return { state: "freeze", label: "稳定核心", level: 4 };
    if (id === "bazi") return { state: "freeze", label: "稳定核心", level: 5 };
    if (id === "ziwei") return { state: "freeze", label: "成熟核心", level: 5 };
    if (id === "qimen") return { state: "active", label: "核心 + 多口径", level: 4 };
    if (id === "liuren") return { state: "freeze", label: "冻结候选", level: 5 };
    if (id === "liuyao") return { state: "active", label: "核心 + Evidence", level: 4 };
    if (id === "meihua") return { state: "active", label: "Core + 古籍金样", level: 4 };
    if (id === "zeri") return { state: "active", label: "Core + Policy", level: 4 };
    return { state: "watch", label: "待补", level: 1 };
  }
  function catalog() {
    const cm = coreManifest(),
      eng = cm?.engines || [],
      src = cm?.sources || [];
    const countSys = (id) => eng.filter((x) => x.system === id).length;
    return [
      {
        id: "calendar",
        name: "时间 / 历法",
        tab: "verify",
        api: window.TianjiTime,
        source: "Tianji Time Core + lunar-javascript 校验层",
        verify: "Core self-test + legacy 时间回归",
        sample: "边界金样 + 历法随机对拍",
        gap: "历史时区 / DST 仍未进入统一历史时间库",
        engines: countSys("calendar"),
      },
      {
        id: "bazi",
        name: "四柱八字",
        tab: "bazi",
        api: window.TianjiBazi,
        source: "v84 snapshot + mystilight 独立交叉校验",
        verify: "Core 回归 + 第三方影子验证",
        sample: "多边界金样 / 外部对拍",
        gap: "最终格局、喜用与多流派裁决仍属于上层规则",
        engines: countSys("bazi"),
      },
      {
        id: "ziwei",
        name: "紫微斗数",
        tab: "ziwei",
        api: window.TianjiZiwei,
        source: "iztro 2.6.1 固定版本规则参照",
        verify: "多轮 Core / Verify / 运限 UI 回归",
        sample: "主辅煞杂曜 + 大限流年流月流日",
        gap: "完整飞星流派与全部应期规则不声明唯一口径",
        engines: countSys("ziwei"),
      },
      {
        id: "qimen",
        name: "奇门遁甲",
        tab: "qimen",
        api: window.TianjiQimen,
        source: "Mingpan 0.1.8 + 《遁甲演义》日/月/年家口径",
        verify: "时家第三方验证 + 四家自检",
        sample: "30局外部对拍 + 日/月/年家金样",
        gap: "日/月/年家仍缺独立现代软件逐盘交叉验证；格局知识层未齐",
        engines: countSys("qimen"),
      },
      {
        id: "liuren",
        name: "大六壬",
        tab: "liuren",
        api: null,
        source: "外部实现 + 古籍代表例 + Evidence 5.0",
        verify: "8638外部课例 + 720/8640结构回归",
        sample: "九宗门 / 特殊课体 / 涉害审计",
        gap: "冻结仅针对排盘 Core；占断解释与门派取用继续分层",
        engines: countSys("liuren"),
      },
      {
        id: "liuyao",
        name: "六爻纳甲",
        tab: "liuyao",
        api: null,
        source: "《增删卜易》结构规则 + legacy Core",
        verify: "64卦结构 / 装卦 / 用神规则审计",
        sample: "Core 1.0 + Evidence 1.0",
        gap: "完整旺衰、应期与不同断法仍应留在解释层",
        engines: countSys("liuyao"),
      },
      {
        id: "meihua",
        name: "梅花易数",
        tab: "yi",
        api: window.TianjiMeihua,
        source: "《梅花易数》卷一/卷二古籍金样",
        verify: "3古例 + 384结构回归 + 51,840 legacy 可复跑",
        sample: "观梅 / 牡丹 / 夜扣门",
        gap: "外应、十应、应期、旺衰与类象尚未结构化",
        engines: countSys("meihua"),
      },
      {
        id: "zeri",
        name: "黄历 / 择日",
        tab: "zeri",
        api: window.TianjiZeri,
        source: "历法事实层 + 显式评分 Policy",
        verify: "20,454日事项 + 10,080时事项可复跑",
        sample: "事实 / 事项 / 个体生肖 / 时辰四层",
        gap: "完整四柱、宅向、方位与不同择日门派尚未进入高级规则层",
        engines: countSys("zeri"),
      },
    ].map((x) => Object.assign(x, statusOf(x.id), { manifest: apiManifest(x.api) }));
  }
  function quickTestOne(x) {
    let r = null;
    if (x.api && typeof x.api.selfTest === "function") r = apiTest(x.api);
    else if (x.id === "liuren")
      r = {
        ok: !!window.TianjiSystemV128?.liurenEvidence5,
        checks: [
          { id: "evidence5", ok: !!window.TianjiSystemV128?.liurenEvidence5 },
          { id: "8640", ok: !!window.TianjiSystemV128?.liuren8640Regression },
        ],
      };
    else if (x.id === "liuyao")
      r = {
        ok: !!window.TianjiSystemV130,
        checks: [
          { id: "v129-core", ok: !!window.TianjiSystemV129 },
          { id: "v130-evidence", ok: !!window.TianjiSystemV130 },
        ],
      };
    EV168.tests[x.id] = r || { ok: false, checks: [], note: "未暴露轻量 selfTest API" };
    return EV168.tests[x.id];
  }
  function runAll() {
    const list = catalog();
    let pass = 0;
    list.forEach((x) => {
      const r = quickTestOne(x);
      if (r?.ok) pass++;
    });
    render();
    const o = document.getElementById("ev168Out");
    if (o)
      o.innerHTML = `快速自检完成：<b>${pass} / ${list.length}</b> 模块通过。此按钮只运行轻量 self-test / 状态检查，不自动执行 20,000～50,000 级的大型回归。`;
    try {
      toast(`Evidence 快速自检 ${pass}/${list.length}`);
    } catch (_) {}
  }
  function levelHTML(x) {
    let h = "";
    for (let i = 1; i <= 5; i++)
      h += `<i class="${i <= x.level ? (x.state === "freeze" ? "good" : "on") : ""}" title="Evidence L${i}"></i>`;
    return h;
  }
  function testHTML(x) {
    const r = EV168.tests[x.id];
    if (!r) return '<div class="ev168-test">尚未运行本次会话轻量自检。</div>';
    const n = (r.checks || []).length,
      p = (r.checks || []).filter((c) => c.ok).length;
    return `<div class="ev168-test ${r.ok ? "ok" : "bad"}"><b>${r.ok ? "PASS" : "CHECK"}</b> · ${p}/${n || "?"} 项${r.note ? " · " + r.note : ""}</div>`;
  }
  function card(x) {
    return `<article class="ev168-card ${x.state}" data-ev168-id="${x.id}"><div class="ev168-card-head"><h4>${x.name}<small>${x.manifest?.module || x.source}</small></h4><span class="ev168-state ${x.state}">${x.label}</span></div><div class="ev168-level">${levelHTML(x)}</div><div class="ev168-meta"><span>证据来源</span><b>${x.source}</b><span>验证方式</span><b>${x.verify}</b><span>样本 / 范围</span><b>${x.sample}</b><span>注册引擎</span><b>${x.engines || 0} 个</b></div><div class="ev168-gaps"><b>仍需补：</b>${x.gap}</div>${testHTML(x)}<div class="ev168-card-actions"><button class="gbtn sm" data-ev168-test="${x.id}">轻量自检</button><button class="gbtn sm" data-ev168-open="${x.tab}">${x.tab === "verify" ? "查看原校验表" : "打开模块"}</button></div></article>`;
  }
  function snapshot() {
    const cm = coreManifest(),
      mods = catalog().map((x) => ({
        id: x.id,
        name: x.name,
        state: x.state,
        label: x.label,
        level: x.level,
        engines: x.engines,
        source: x.source,
        verify: x.verify,
        gap: x.gap,
        selfTest: EV168.tests[x.id] || apiTest(x.api),
        manifest: x.manifest,
      }));
    return {
      schema: "tianji.evidence.snapshot.v1",
      build: V168_BUILD,
      generatedAt: new Date().toISOString(),
      core: {
        version: cm?.coreVersion,
        schema: cm?.schemaVersion,
        engineCount: cm?.engines?.length || 0,
        sourceCount: cm?.sources?.length || 0,
        licenseCount: cm?.licenses?.length || 0,
      },
      modules: mods,
      roadmap: clone(window.TianjiRoadmap || {}),
    };
  }
  function page() {
    const list = catalog(),
      f = EV168.filter === "all" ? list : list.filter((x) => x.state === EV168.filter),
      cm = coreManifest(),
      freeze = list.filter((x) => x.state === "freeze").length,
      active = list.filter((x) => x.state === "active").length,
      tests = Object.values(EV168.tests),
      tp = tests.filter((x) => x?.ok).length;
    return `<div class="ev168"><section class="ev168-hero"><div class="ev168-head"><div><h3>Evidence 总控 · 统一证据与成熟度面板</h3><p>把“能运行、结构自洽、legacy 回归、第三方对拍、古籍金样、冻结候选”分层管理。这里不替代各模块自己的 Evidence 页面，而是给整个天机盘一个统一的可信度视图与缺口清单。</p></div><span class="ev168-badge">Evidence Registry · v168</span></div><div class="ev168-kpis"><div class="ev168-kpi"><small>核心模块</small><b>${list.length}</b><em>统一纳入总控</em></div><div class="ev168-kpi"><small>冻结 / 成熟</small><b>${freeze}</b><em>底层规则优先稳定</em></div><div class="ev168-kpi"><small>继续验证</small><b>${active}</b><em>Core 已有，Evidence 继续加深</em></div><div class="ev168-kpi"><small>Core 注册引擎</small><b>${cm?.engines?.length || 0}</b><em>${cm?.sources?.length || 0} 个来源</em></div><div class="ev168-kpi"><small>本次轻量自检</small><b>${tests.length ? tp + "/" + tests.length : "—"}</b><em>大型回归按需运行</em></div></div></section><section class="ev168-toolbar"><label>成熟度 <select id="ev168Filter"><option value="all"${EV168.filter === "all" ? " selected" : ""}>全部</option><option value="freeze"${EV168.filter === "freeze" ? " selected" : ""}>冻结 / 成熟</option><option value="active"${EV168.filter === "active" ? " selected" : ""}>继续验证</option><option value="watch"${EV168.filter === "watch" ? " selected" : ""}>待补</option></select></label><button class="gbtn sm" id="ev168RunAll">运行全部轻量自检</button><button class="gbtn sm" id="ev168Copy">复制 Evidence 快照 JSON</button><span class="sp"></span><span class="dim sm">L1结构 → L2回归 → L3外部对拍 → L4古籍/规则证据 → L5冻结候选</span></section><div class="ev168-grid">${f.map(card).join("")}</div><section class="panel blk"><h4 class="gl" style="margin-top:0">统一证据链</h4><div class="ev168-chain"><div><b>事实输入</b><small>时间 / 历法 / 人物</small></div><div><b>确定性 Core</b><small>只算可复现事实</small></div><div><b>Rule / Doctrine</b><small>门派与口径显式</small></div><div><b>Evidence</b><small>金样 / 回归 / 对拍</small></div><div><b>解释层</b><small>结论必须可回指证据</small></div><div><b>AI / MCP</b><small>后续只消费结构化结果</small></div></div><div class="ev168-out" id="ev168Out" style="margin-top:10px">本版先完成 Evidence 总控。下一主线是“跨术数合参”：让同一人物、同一时刻、同一问题的多个 Core 输出进入统一 Schema，再做一致点、冲突点与证据回指。</div></section></div>`;
  }
  const oldPage = REF_PANES.verify,
    oldBind = REF_BIND.verify;
  function render() {
    try {
      refRender("verify");
    } catch (_) {
      const p = document.getElementById("pane-verify");
      if (p) p.innerHTML = page() + (oldPage ? oldPage() : "");
    }
  }
  REF_PANES.verify = () => page() + (oldPage ? oldPage() : "");
  REF_BIND.verify = () => {
    try {
      oldBind && oldBind();
    } catch (_) {}
    const f = document.getElementById("ev168Filter");
    if (f)
      f.onchange = () => {
        EV168.filter = f.value;
        render();
      };
    const all = document.getElementById("ev168RunAll");
    if (all) all.onclick = runAll;
    const cp = document.getElementById("ev168Copy");
    if (cp)
      cp.onclick = () => {
        try {
          const s = JSON.stringify(snapshot(), null, 2);
          if (navigator.clipboard?.writeText)
            navigator.clipboard.writeText(s).then(() => toast("已复制 Evidence 快照 JSON"));
          else toast("当前浏览器不支持直接复制");
        } catch (_) {
          try {
            toast("复制失败");
          } catch (__) {}
        }
      };
    document.querySelectorAll("[data-ev168-test]").forEach(
      (b) =>
        (b.onclick = () => {
          const x = catalog().find((z) => z.id === b.dataset.ev168Test);
          if (!x) return;
          const r = quickTestOne(x);
          render();
          try {
            toast(`${x.name} ${r?.ok ? "自检通过" : "需要检查"}`);
          } catch (_) {}
        }),
    );
    document.querySelectorAll("[data-ev168-open]").forEach(
      (b) =>
        (b.onclick = () => {
          const t = b.dataset.ev168Open;
          if (t === "verify") {
            const el = document.querySelector(".vf-t");
            el?.scrollIntoView({ behavior: "smooth", block: "start" });
            return;
          }
          try {
            selectTab(t, true);
          } catch (_) {}
        }),
    );
  };
  const API = Object.freeze({
    version: "1.0.0",
    build: V168_BUILD,
    schema: "tianji.evidence.snapshot.v1",
    catalog: () =>
      clone(
        catalog().map((x) => ({
          id: x.id,
          name: x.name,
          state: x.state,
          label: x.label,
          level: x.level,
          source: x.source,
          verify: x.verify,
          sample: x.sample,
          gap: x.gap,
          engines: x.engines,
        })),
      ),
    snapshot,
    runQuick: () => {
      catalog().forEach(quickTestOne);
      return clone(EV168.tests);
    },
    manifest: () => ({
      module: "Tianji Evidence Registry",
      version: "1.0.0",
      build: V168_BUILD,
      schema: "tianji.evidence.snapshot.v1",
      modules: catalog().length,
      levels: {
        L1: "结构自检",
        L2: "legacy/确定性回归",
        L3: "第三方独立对拍",
        L4: "古籍/规则证据",
        L5: "冻结候选",
      },
      next: "跨术数合参与证据回指",
    }),
  });
  window.TianjiEvidence = API;
  try {
    if (window.TianjiCore)
      TianjiCore.registerSource({
        id: "tianji-v168-evidence-registry",
        type: "internal",
        title: "Tianji Evidence Registry 1.0",
        version: "1.0.0",
        baseline: "v167",
        note: "统一汇总各核心模块的自检、回归、外部对拍、古籍金样与已知缺口；不修改各 Core 计算结果。",
      });
  } catch (e) {
    console.warn("[v168 registry]", e);
  }
  try {
    const road = window.TianjiRoadmap || {};
    window.TianjiRoadmap = Object.freeze(
      Object.assign({}, road, {
        nextMainline: [
          "跨术数合参 Schema",
          "一致点/冲突点解释链",
          "AI 解释层",
          "MCP / API",
          "奇门四家与择日高级 Evidence",
        ],
      }),
    );
  } catch (_) {}
  try {
    const bv = document.getElementById("buildVersion");

    window.TianjiSystemV168 = {
      version: "v168",
      build: V168_BUILD,
      evidenceRegistry: true,
      schema: "tianji.evidence.snapshot.v1",
    };
  } catch (_) {}
})();
