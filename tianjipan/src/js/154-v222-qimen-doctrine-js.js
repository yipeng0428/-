(() => {
  "use strict";
  const BUILD = "v222 · 2026-10-06 20:52 +08:00";
  const SCHEMA = "tianji.qimen.doctrine-registry.v1";
  const GOLDEN_SCHEMA = "tianji.qimen.external-golden.v2";
  const YEAR_KEY = "tianjipan.qimen.year-doctrine.v222";
  const clone = (x) => (x == null ? x : JSON.parse(JSON.stringify(x)));
  const E = (s) =>
    String(s ?? "").replace(
      /[&<>"']/g,
      (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
    );
  const civ = (s) => {
    const m = String(s).match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})/);
    return m ? { y: +m[1], m: +m[2], d: +m[3], h: +m[4], mi: +m[5], s: 0 } : null;
  };
  const SOURCE = {
    id: "horosa-qimen-reference",
    name: "星阙 Horosa · DunJiaCalc regression references",
    repo: "https://github.com/Horace-Maxwell/Horosa-Web-App-comprehensively-improved-MacOS",
    commit: "f27c00a93e2529b0d0d0b145a7822baa67853095",
    blob: "967552af1ee307ab31db036db88e3c8b7c02c447",
    license: "AGPL-3.0-only",
    note: "公开测试文件把 2026-06-20 与 2025-11-24 标注为“用户提供标准参考盘”。V222 只摘录最小事实向量（局、值符/值使及其宫位）用于验证，不复制其算法实现。",
  };
  const CASES = [
    {
      id: "horosa-2026-0620-year",
      family: "year",
      civil: "2026-06-20 12:52",
      sourceType: "published-regression-reference",
      expected: {
        yearGZ: "丙午",
        yuan: "下元",
        ju: 7,
        chiefStar: "冲",
        chiefStarPalace: 9,
        chiefDoor: "伤",
        chiefDoorPalace: 1,
      },
    },
    {
      id: "horosa-2026-0620-month",
      family: "month",
      civil: "2026-06-20 12:52",
      sourceType: "published-regression-reference",
      expected: {
        monthGZ: "甲午",
        yuan: "下元",
        ju: 4,
        chiefStar: "蓬",
        chiefStarPalace: 1,
        chiefDoor: "休",
        chiefDoorPalace: 1,
      },
    },
    {
      id: "horosa-2026-0620-day",
      family: "day",
      civil: "2026-06-20 12:52",
      sourceType: "published-regression-reference",
      expected: {
        dayGZ: "乙丑",
        ju: 1,
        chiefStar: "蓬",
        chiefStarPalace: 9,
        chiefDoor: "休",
        chiefDoorPalace: 2,
      },
    },
    {
      id: "horosa-2025-1124-year",
      family: "year",
      civil: "2025-11-24 21:52",
      sourceType: "published-regression-reference",
      expected: {
        yearGZ: "乙巳",
        yuan: "下元",
        ju: 7,
        chiefStar: "冲",
        chiefStarPalace: 8,
        chiefDoor: "伤",
        chiefDoorPalace: 2,
      },
    },
    {
      id: "horosa-2025-1124-month",
      family: "month",
      civil: "2025-11-24 21:52",
      sourceType: "published-regression-reference",
      expected: {
        monthGZ: "丁亥",
        yuan: "下元",
        ju: 4,
        chiefStarPalace: 7,
        chiefDoor: "死",
        chiefDoorPalace: 8,
      },
    },
    {
      id: "horosa-2025-1124-day",
      family: "day",
      civil: "2025-11-24 21:52",
      sourceType: "published-regression-reference",
      expected: {
        dayGZ: "丁酉",
        ju: 6,
        chiefStar: "冲",
        chiefStarPalace: 9,
        chiefDoor: "伤",
        chiefDoorPalace: 9,
      },
    },
  ];
  const PROFILES = [
    {
      id: "tianji-classic",
      name: "天机 · 古籍研究口径",
      state: "active",
      families: {
        year: "三元固定一/四/七（V222 推荐；rolling 可回退）",
        month: "五年符头三元：孟/仲/季→阴一/七/四",
        day: "《遁甲演义》三日移宫八门（当前为门层，不冒充完整盘）",
      },
      evidence: ["内部可审计 Core", "atopx/Horosa 外部对拍"],
    },
    {
      id: "horosa-reference",
      name: "Horosa · 标准参考盘口径",
      state: "reference-only",
      families: {
        year: "三元固定局，皆阴遁",
        month: "年符头定局，皆阴遁",
        day: "节气三元·六十日一局",
      },
      evidence: ["两组公开标准参考盘", "AGPL 项目测试向量；只作事实 reference"],
    },
    {
      id: "atopx-reference",
      name: "atopx/qimen · Golden 口径",
      state: "reference-only",
      families: {
        year: "60 年元固定一/四/七局",
        month: "恒阴遁，年支组定正月起局后逐月逆行",
        day: "与时家共用节气三元局",
      },
      evidence: ["goldenCharts", "MIT"],
    },
    {
      id: "abelard-reference",
      name: "AbelardZ/QiMen · 独立实现",
      state: "reference-only",
      families: {
        year: "1984 下元阴七基准逐年逆推",
        month: "年支定起局基数 + 月支偏移",
        day: "冬/夏至起点按日数顺逆推",
      },
      evidence: ["独立 Python 实现", "用于规则交叉，不冒充 Golden"],
    },
  ];

  function walk(actual, expected, path = "", rows = []) {
    if (expected === null || typeof expected !== "object") {
      const miss = actual === undefined,
        ok = !miss && JSON.stringify(actual) === JSON.stringify(expected);
      rows.push({
        path: path || "(root)",
        status: miss ? "MISSING" : ok ? "PASS" : "DIFF",
        actual,
        reference: expected,
      });
      return rows;
    }
    if (Array.isArray(expected)) {
      const miss = actual === undefined,
        ok = !miss && JSON.stringify(actual) === JSON.stringify(expected);
      rows.push({
        path: path || "(root)",
        status: miss ? "MISSING" : ok ? "PASS" : "DIFF",
        actual,
        reference: expected,
      });
      return rows;
    }
    Object.keys(expected).forEach((k) =>
      walk(actual?.[k], expected[k], path ? path + "." + k : k, rows),
    );
    return rows;
  }
  function runCase(c) {
    let snap = null;
    try {
      snap = window.TianjiQimenCrosscheck?.snapshot?.(c.family, civ(c.civil)) || null;
    } catch (err) {
      return { ...c, status: "ERROR", error: String(err?.message || err), rows: [] };
    }
    const rows = walk(snap?.core, c.expected),
      pass = rows.filter((x) => x.status === "PASS").length,
      diff = rows.filter((x) => x.status === "DIFF").length,
      missing = rows.filter((x) => x.status === "MISSING").length;
    let classification = "implementation-diff";
    if (c.family === "day" && missing >= 4) classification = "model-gap";
    else if (diff && ["year", "day"].includes(c.family)) classification = "doctrine-diff";
    else if (!diff && !missing) classification = "aligned";
    return {
      ...c,
      status: diff || missing ? (classification === "model-gap" ? "MODEL_GAP" : "DIFF") : "PASS",
      classification,
      pass,
      diff,
      missing,
      rows,
      actual: snap?.core || null,
    };
  }
  function report() {
    const rows = CASES.map(runCase);
    return {
      schema: SCHEMA,
      build: BUILD,
      generatedAt: new Date().toISOString(),
      source: clone(SOURCE),
      profiles: clone(PROFILES),
      yearPolicy: yearPolicy(),
      summary: {
        cases: rows.length,
        passCases: rows.filter((x) => x.status === "PASS").length,
        alignedFields: rows.reduce((s, x) => s + x.pass, 0),
        diffFields: rows.reduce((s, x) => s + x.diff, 0),
        missingFields: rows.reduce((s, x) => s + x.missing, 0),
        modelGap: rows.filter((x) => x.classification === "model-gap").length,
      },
      cases: rows,
    };
  }
  function yearPolicy() {
    try {
      return localStorage.getItem(YEAR_KEY) === "rolling" ? "rolling" : "fixed";
    } catch (_) {
      return "fixed";
    }
  }
  function setYearPolicy(v) {
    const p = v === "rolling" ? "rolling" : "fixed";
    try {
      localStorage.setItem(YEAR_KEY, p);
    } catch (_) {}
    return p;
  }
  function combinedPack() {
    const p1 = window.TianjiQimenExternalEvidenceV221?.v199Pack?.() || { cases: [] };
    return {
      schema: "tianji.qimen.crosscheck.reference.v1",
      sourceBundle: {
        name: "Tianji external references v222",
        sources: [
          ...(p1.sourceBundle ? [p1.sourceBundle] : []),
          { name: SOURCE.name, commit: SOURCE.commit, license: SOURCE.license },
        ],
      },
      cases: [
        ...(Array.isArray(p1.cases) ? p1.cases : []),
        ...CASES.map((c) => ({
          id: c.id,
          family: c.family,
          input: { civil: c.civil },
          source: {
            name: SOURCE.name,
            version: SOURCE.commit,
            url: SOURCE.repo,
            note: SOURCE.note,
          },
          expected: clone(c.expected),
        })),
      ],
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

  function rowsHTML(R) {
    return R.cases
      .map((c) => {
        const issues = c.rows.filter((x) => x.status !== "PASS").slice(0, 8);
        return `<div class="q222-item ${c.status === "PASS" ? "good" : c.classification === "model-gap" ? "cyan" : "warn"}"><b>${E(c.family)} · ${E(c.civil)} · ${E(c.status)}</b><small>PASS ${c.pass} / DIFF ${c.diff} / MISSING ${c.missing} · ${E(c.classification)}</small><div class="q222-badges">${issues.map((x) => `<span class="q222-state ${x.status === "DIFF" ? "diff" : "missing"}">${E(x.status)} · ${E(x.path)}</span>`).join("") || '<span class="q222-state pass">全部已登记字段一致</span>'}</div></div>`;
      })
      .join("");
  }
  function profileHTML() {
    return PROFILES.map(
      (p) =>
        `<div class="q222-item ${p.state === "active" ? "good" : "cyan"}"><b>${E(p.name)}</b><small>年：${E(p.families.year)}<br>月：${E(p.families.month)}<br>日：${E(p.families.day)}</small><div class="q222-badges"><span class="q222-badge ${p.state === "active" ? "good" : "cyan"}">${E(p.state)}</span>${p.evidence.map((x) => `<span class="q222-badge">${E(x)}</span>`).join("")}</div></div>`,
    ).join("");
  }
  function panel() {
    const R = report(),
      S = R.summary,
      p = yearPolicy();
    return `<section class="q222" id="q222Doctrine">
  <section class="q222-hero"><div class="q222-head"><div><h3>V222 · 第二独立 Golden / 奇门流派包一期</h3><p>新增 Horosa 第二套公开标准参考盘，与 V221 的 atopx/qimen Golden 形成双外部源。V222 不再把所有 DIFF 混成“算法错”，而是把年/月/日家分别识别为一致、流派差异或模型缺口；年家同时开放“固定三元局 / 旧版逐年逆移”可审计切换。</p></div><span class="q222-schema">${SCHEMA}</span></div>
   <div class="q222-tools"><button class="primary" id="q222Import" type="button">联合导入 V199</button><button id="q222Export" type="button">导出双源 Reference Pack</button><button id="q222Refresh" type="button">刷新对拍</button></div>
  </section>
  <div class="q222-kpis">
   <div class="q222-kpi good"><small>外部 Reference 源</small><b>2+1</b></div>
   <div class="q222-kpi cyan"><small>Horosa 新样本</small><b>${S.cases}</b></div>
   <div class="q222-kpi good"><small>字段一致</small><b>${S.alignedFields}</b></div>
   <div class="q222-kpi bad"><small>字段差异</small><b>${S.diffFields}</b></div>
   <div class="q222-kpi gold"><small>模型缺口</small><b>${S.modelGap}</b></div>
   <div class="q222-kpi ${p === "fixed" ? "good" : "gold"}"><small>年家默认口径</small><b>${p === "fixed" ? "固定局" : "rolling"}</b></div>
  </div>
  <div class="q222-grid">
   <section class="q222-card"><h4>第二独立 Reference</h4><div class="q222-item good"><b>${E(SOURCE.name)}</b><small>${E(SOURCE.note)}<br><span class="q222-code">${E(SOURCE.commit)} · blob ${E(SOURCE.blob)}</span></small><div class="q222-badges"><span class="q222-badge good">公开标准参考盘</span><span class="q222-badge gold">${E(SOURCE.license)}</span><span class="q222-badge">仅摘录最小事实向量</span></div></div><div class="q222-note" style="margin-top:6px">Horosa 的两个标准参考盘覆盖 2026-06-20 与 2025-11-24，每个日期同时给出年家、月家、日家的局、值符/值使和落宫。它不是古籍本身，也不是唯一权威，但足以作为第二独立工程实现的回归参考。</div></section>
   <aside class="q222-card"><h4>当前判断</h4><div class="q222-list">
    <div class="q222-item good"><b>月家：外部证据开始收敛</b><small>Tianji 当前“五年符头三元”在已取得样本的局数层，与 Horosa 的年符头口径同向；2025/2026 均指向下元阴四局。可以继续扩大逐宫对拍。</small></div>
    <div class="q222-item warn"><b>年家：旧 rolling 不再推荐</b><small>atopx 与 Horosa 都把 2024–2026 下元处理为阴七局。V222 因此把“固定一/四/七”设为默认，rolling 仅保留历史兼容。</small></div>
    <div class="q222-item cyan"><b>日家：不是简单修几个字段</b><small>Tianji 当前日家只实现《遁甲演义》三日移宫八门层，而两个现代实现都输出完整盘，但彼此定局规则仍不同。因此标记 MODEL_GAP + DOCTRINE_DIVERGENCE，不硬补。</small></div>
   </div></aside>
  </div>
  <section class="q222-card"><h4>Doctrine Registry · 流派包注册表</h4><div class="q222-list">${profileHTML()}</div></section>
  <section class="q222-card"><h4>Horosa 最小事实向量对拍</h4><div class="q222-list" id="q222Results">${rowsHTML(R)}</div></section>
  <section class="q222-card"><h4>许可证 / Evidence 边界</h4><div class="q222-note">Horosa 仓库是 AGPL-3.0-only。V222 没有复制其计算实现，只记录公开测试中的最小结果事实与固定 commit/blob 作为 provenance。atopx/qimen 继续按 MIT reference 使用。任何第三方参考都只提升“可审计性”，不自动等于古籍唯一正确口径。</div></section>
 </section>`;
  }
  function mount() {
    const pane = document.getElementById("pane-qimen");
    if (!pane || !pane.classList.contains("on")) return;
    const anchor = pane.querySelector("#q221ExternalEvidence") || pane.querySelector("#q199Lab");
    if (!anchor) return;
    const old = pane.querySelector("#q222Doctrine"),
      tmp = document.createElement("div");
    tmp.innerHTML = panel();
    const fresh = tmp.firstElementChild;
    if (old) old.replaceWith(fresh);
    else anchor.insertAdjacentElement("afterend", fresh);
  }
  document.addEventListener(
    "change",
    (e) => {
      if (e.target?.id === "q222YearDoctrine") {
        setYearPolicy(e.target.value);
        try {
          refRender("qimen");
        } catch (_) {}
        TianjiPaneScheduler.request("qimen");
      }
    },
    true,
  );
  document.addEventListener(
    "click",
    (e) => {
      if (e.target?.id === "q222Refresh") {
        mount();
        return;
      }
      if (e.target?.id === "q222Export") {
        download("天机盘_V222_奇门双源ReferencePack.json", {
          schema: GOLDEN_SCHEMA,
          build: BUILD,
          source: SOURCE,
          profiles: PROFILES,
          pack: combinedPack(),
        });
        return;
      }
      if (e.target?.id === "q222Import") {
        try {
          const pack = combinedPack(),
            r = window.TianjiQimenCrosscheck?.importReferences?.(pack);
          try {
            toast(`已联合导入 ${pack.cases.length} 个外部 reference case`);
          } catch (_) {}
          try {
            refRender("qimen");
          } catch (_) {}
          TianjiPaneScheduler.request("qimen");
          console.info("[V222 import]", r);
        } catch (err) {
          try {
            toast("联合导入失败：" + String(err?.message || err));
          } catch (_) {}
        }
      }
    },
    true,
  );

  TianjiPaneScheduler.register("qimen", "v222-qimen-doctrine-js", mount);
  document.addEventListener(
    "click",
    (e) => {
      if (e.target?.closest?.("[data-q165-mode],[data-q165-shift],[data-q165-now]"))
        TianjiPaneScheduler.request("qimen");
    },
    true,
  );

  try {
    if (window.TianjiCore) {
      TianjiCore.registerSource({
        id: "external-horosa-qimen-reference",
        type: "external",
        title: "Horosa DunJiaCalc Standard Reference Charts",
        version: SOURCE.commit,
        license: SOURCE.license,
        note: SOURCE.note,
      });
      TianjiCore.registerEngine(
        {
          id: "qimen.doctrine.registry.v1",
          system: "qimen",
          name: "Qimen Doctrine Registry",
          version: "1.0.0",
          source: "external-horosa-qimen-reference",
          doctrine: "multi-reference / selectable year policy / no forced convergence",
          status: "research",
        },
        () => report(),
      );
    }
  } catch (err) {
    console.warn("[V222 registry]", err);
  }

  const TASKS222 = [
    { id: "ai", p: "P0", name: "统一 AI 解释层", state: "done", note: "v171 完成" },
    { id: "mcp", p: "P0", name: "MCP / API 外部调用层", state: "done", note: "v172 完成" },
    {
      id: "kg",
      p: "P0",
      name: "典籍 Evidence / 规则知识图谱",
      state: "done",
      note: "v173 第一阶段完成",
    },
    { id: "router", p: "P0", name: "自然语言问事路由", state: "done", note: "v196–v197 完成" },
    { id: "consumer", p: "P0", name: "统一消费者结果页 / 报告", state: "done", note: "v198 完成" },
    {
      id: "qimen-evidence",
      p: "P1",
      name: "奇门四家第三方对拍 / 高级 Evidence",
      state: "doing",
      note: "v221–v222：已取得 atopx/qimen Golden + Horosa 两组标准参考盘；月家局数证据开始收敛，年家固定三元局获双外部源支持并成为可回退的推荐口径；日家被明确识别为“完整盘模型缺口 + 流派分歧”。下一步补日家古籍/第三参考，完成日家 Doctrine Pack。",
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
      state: "blocked",
      note: "仍等待可靠星历、四余口径与许可证方案",
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
  const BOARD222 = {
    schema: "tianji.priority.board.v1",
    build: BUILD,
    total: 14,
    done: 12,
    doing: 1,
    blocked: 1,
    progress: 92.9,
    next: [
      "日家奇门：古籍原文 + 第三套独立 Reference / Doctrine Pack",
      "月家逐宫扩大对拍",
      "七政四余：星历与许可证前置调查",
      "玄空 / 三合外部逐盘 reference 增强",
    ],
    tasks: TASKS222,
  };
  function applyBoard() {
    window.TianjiPriorityBoard = Object.freeze({
      schema: BOARD222.schema,
      snapshot: () => clone(BOARD222),
    });
    const road = window.TianjiRoadmap || {};
    window.TianjiRoadmap = Object.freeze(
      Object.assign({}, road, {
        urgentImportant: clone(BOARD222),
        nextMainline: clone(BOARD222.next),
      }),
    );
  }
  applyBoard();
  window.addEventListener("tianji:lazy-ready", () => setTimeout(applyBoard, 0));

  function selfTest() {
    const C = [],
      add = (id, ok, d = "") => C.push({ id, ok: !!ok, d });
    add(
      "horosa.source",
      SOURCE.commit === "f27c00a93e2529b0d0d0b145a7822baa67853095",
      SOURCE.commit,
    );
    add("horosa.blob", SOURCE.blob === "967552af1ee307ab31db036db88e3c8b7c02c447", SOURCE.blob);
    add("cases", CASES.length === 6, String(CASES.length));
    add(
      "families",
      new Set(CASES.map((x) => x.family)).size === 3,
      CASES.map((x) => x.family).join(","),
    );
    add(
      "year.fixed",
      window.TianjiQimenPeriod?.yearMetaByPolicy?.(
        {
          t: { civ: { y: 2024 } },
          bz: {
            pill: [
              { s: 0, b: 4 },
              { s: 0, b: 0 },
            ],
          },
        },
        "fixed",
      )?.ju === 7,
      "2024 => 7",
    );
    add(
      "year.rolling.compat",
      window.TianjiQimenPeriod?.yearMetaByPolicy?.(
        {
          t: { civ: { y: 2024 } },
          bz: {
            pill: [
              { s: 0, b: 4 },
              { s: 0, b: 0 },
            ],
          },
        },
        "rolling",
      )?.ju === 3,
      "2024 => 3",
    );
    return { ok: C.every((x) => x.ok), checks: C };
  }
  const TEST = selfTest();

  window.TianjiQimenDoctrineV222 = Object.freeze({
    version: "1.0.0",
    build: BUILD,
    schema: SCHEMA,
    goldenSchema: GOLDEN_SCHEMA,
    source: () => clone(SOURCE),
    cases: () => clone(CASES),
    profiles: () => clone(PROFILES),
    yearPolicy,
    setYearPolicy: (v) => {
      const p = setYearPolicy(v);
      try {
        refRender("qimen");
      } catch (_) {}
      return p;
    },
    report: () => clone(report()),
    combinedPack: () => clone(combinedPack()),
    importToV199: () => window.TianjiQimenCrosscheck?.importReferences?.(combinedPack()),
    selfTest: () => clone(TEST),
    manifest: () => ({
      module: "Qimen Doctrine Registry V222",
      externalReferenceSets: 2,
      horosaCases: 6,
      yearFamily: {
        recommended: "fixed",
        legacy: "rolling",
        reason: "atopx + Horosa 双外部源对 2024–2026 下元阴七局收敛",
      },
      monthFamily: { status: "evidence-converging" },
      dayFamily: { status: "model-gap+doctrine-divergence" },
      complete: false,
      algorithmChange: "年家默认从 rolling 调整为 fixed；rolling 完整保留可回退",
      copyrightBoundary: "不复制 Horosa AGPL 算法实现，仅记录最小公开结果事实与 provenance",
    }),
  });
  window.TianjiSystemV222 = {
    version: "v222",
    build: BUILD,
    qimenSecondReference: true,
    qimenDoctrineRegistry: true,
    yearDoctrineDefault: "fixed",
    legacyYearRollingAvailable: true,
    baseline: "v221",
  };
})();
