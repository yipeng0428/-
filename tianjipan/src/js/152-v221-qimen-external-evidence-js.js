(() => {
  "use strict";
  const BUILD = "v221 · 2026-10-06 20:18 +08:00";
  const SCHEMA = "tianji.qimen.external-evidence.v2";
  const GOLDEN_SCHEMA = "tianji.qimen.external-golden.v1";

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

  const SOURCES = [
    {
      id: "atopx-qimen",
      name: "atopx/qimen",
      type: "golden+independent-implementation",
      repo: "https://github.com/atopx/qimen",
      commit: "8eb06d007d4a5fcc5352d9054f81469e5f023f45",
      goldenBlob: "5e45b050dc898883824e1f315029fbc21ddd2807",
      license: "MIT",
      note: "qimen_golden_test.go 声明 goldenCharts 来自参考排盘软件输出，并包含日家、月家、年家真实样本；本版只摘录必要字段用于对拍，不复制整个第三方代码。",
    },
    {
      id: "abelardz-qimen",
      name: "AbelardZ/QiMen",
      type: "independent-doctrine",
      repo: "https://github.com/AbelardZ/QiMen",
      commit: "ce22cffc23d79cbf6487affb632b7230bd03f8de",
      license: "MIT（README 声明）",
      note: "独立 Python/Flask 四家实现，用于流派/规则交叉核对；本版不把其算法说明冒充 golden 输出。",
    },
  ];

  function palaceMaps(p) {
    const earth = {},
      heaven = {},
      stars = {},
      doors = {};
    Object.entries(p).forEach(([k, v]) => {
      const a = [...v];
      if (a.length < 5) return;
      const n = +k;
      heaven[n] = a[0];
      earth[n] = a[1];
      if (a[3] && a[3] !== "-") stars[n] = a[3];
      if (a[4] && a[4] !== "-") doors[n] = a[4];
    });
    return { earth, heaven, stars, doors };
  }
  function normalExpected(raw) {
    const P = palaceMaps(raw.palaces || {});
    const x = {
      ju: raw.ju,
      dun: raw.xunStem,
      chiefStar: String(raw.zhiFu || "")
        .replace(/^天/, "")
        .replace(/^禽芮$/, "芮"),
      chiefStarPalace: raw.zfLand,
      chiefDoor: String(raw.zhiShi || "").replace(/门$/, ""),
      chiefDoorPalace: raw.zsLand,
      earth: P.earth,
      heaven: P.heaven,
      stars: P.stars,
      doors: P.doors,
    };
    if (raw.family === "month") x.monthGZ = raw.monthGZ;
    if (raw.family === "year") x.yearGZ = raw.yearGZ;
    if (raw.family === "day") x.dayGZ = raw.dayGZ;
    return x;
  }

  const GOLDENS = [
    {
      id: "atopx-day-2024-12-26-1200",
      family: "day",
      civil: "2024-12-26 12:00",
      compatibility: "doctrine-divergent",
      doctrine: "atopx MethodDay + rotate + 拆补；日家与时家共用节气三元局",
      raw: {
        family: "day",
        pillars: "甲辰 丙子 甲子 庚午",
        dayGZ: "甲子",
        yinYang: "阳",
        ju: 1,
        xun: "甲子",
        xunStem: "戊",
        zhiFu: "天蓬",
        zfLand: 1,
        zhiShi: "休",
        zsLand: 1,
        palaces: {
          1: "戊戊戊蓬休符",
          2: "己己己芮死玄",
          3: "庚庚庚冲伤阴",
          4: "辛辛辛辅杜合",
          5: "壬壬壬---",
          6: "癸癸癸心开天",
          7: "丁丁丁柱惊地",
          8: "丙丙丙任生蛇",
          9: "乙乙乙英景虎",
        },
      },
    },
    {
      id: "atopx-day-2024-12-25-1200",
      family: "day",
      civil: "2024-12-25 12:00",
      compatibility: "doctrine-divergent",
      doctrine: "atopx MethodDay + rotate + 拆补；冬至下元阳四",
      raw: {
        family: "day",
        pillars: "甲辰 丙子 癸亥 戊午",
        dayGZ: "癸亥",
        yinYang: "阳",
        ju: 4,
        xun: "甲寅",
        xunStem: "癸",
        zhiFu: "天英",
        zfLand: 9,
        zhiShi: "景",
        zsLand: 9,
        palaces: {
          1: "丁丁丁蓬休虎",
          2: "丙丙丙芮死蛇",
          3: "乙乙乙冲伤地",
          4: "戊戊戊辅杜天",
          5: "己己己---",
          6: "庚庚庚心开合",
          7: "辛辛辛柱惊阴",
          8: "壬壬壬任生玄",
          9: "癸癸癸英景符",
        },
      },
    },
    {
      id: "atopx-month-2024-12-25-1200",
      family: "month",
      civil: "2024-12-25 12:00",
      compatibility: "doctrine-divergent",
      doctrine: "atopx MethodMonth；恒阴遁，按年支组定寅月起局后逐月逆行",
      raw: {
        family: "month",
        pillars: "甲辰 丙子 癸亥 戊午",
        monthGZ: "丙子",
        yinYang: "阴",
        ju: 4,
        xun: "甲戌",
        xunStem: "己",
        zhiFu: "天冲",
        zfLand: 6,
        zhiShi: "伤",
        zsLand: 1,
        palaces: {
          1: "戊辛己辅伤天",
          2: "辛庚丙蓬开阴",
          3: "庚己壬芮景玄",
          4: "丁戊庚柱死虎",
          5: "乙乙乙---",
          6: "己丙癸冲生符",
          7: "癸丁辛任休蛇",
          8: "壬癸戊英杜地",
          9: "丙壬丁心惊合",
        },
      },
    },
    {
      id: "atopx-year-2024-12-25-1200",
      family: "year",
      civil: "2024-12-25 12:00",
      compatibility: "doctrine-divergent",
      doctrine: "atopx MethodYear；60 年元固定局（上/中/下元一/四/七），立春换年",
      raw: {
        family: "year",
        pillars: "甲辰 丙子 癸亥 戊午",
        yearGZ: "甲辰",
        yinYang: "阴",
        ju: 7,
        xun: "甲辰",
        xunStem: "壬",
        zhiFu: "天冲",
        zfLand: 3,
        zhiShi: "伤",
        zsLand: 3,
        palaces: {
          1: "丁丁丁蓬休阴",
          2: "癸癸癸芮死玄",
          3: "壬壬壬冲伤符",
          4: "辛辛辛辅杜天",
          5: "庚庚庚---",
          6: "己己己心开合",
          7: "戊戊戊柱惊虎",
          8: "乙乙乙任生蛇",
          9: "丙丙丙英景地",
        },
      },
    },
  ];
  GOLDENS.forEach((g) => (g.expected = normalExpected(g.raw)));

  const DOCTRINES = [
    {
      family: "day",
      tianji: "《遁甲演义》研究口径：甲子起坎、三日一移八宫、八门顺轮；未硬造三奇细层",
      atopx: "日家与时家共用节气三元局，完整转盘/飞盘；支持置闰/拆补",
      abelard: "以最近冬至/夏至为基点，按日数顺/逆推局",
      verdict: "明显分歧",
    },
    {
      family: "month",
      tianji: "五年一元；上/中/下元取阴遁一/七/四局；月建复用节令月柱",
      atopx: "恒阴遁；按年支组定寅月起局 8/5/2，再逐月逆行",
      abelard: "年支定起局基数（孟/仲/季），再按月支偏移",
      verdict: "明显分歧",
    },
    {
      family: "year",
      tianji: "1864 三元基准一/四/七，并在本元内逐年递减局数",
      atopx: "60 年元固定一/四/七局，立春换年",
      abelard: "1984 甲子下元阴七局为基准，逐年逆推",
      verdict: "存在两类主流实现",
    },
  ];

  function walk(actual, expected, path = "", rows = []) {
    if (expected == null || typeof expected !== "object") {
      const missing = actual === undefined,
        ok = !missing && JSON.stringify(actual) === JSON.stringify(expected);
      rows.push({
        path: path || "(root)",
        status: missing ? "MISSING" : ok ? "PASS" : "DIFF",
        actual,
        reference: expected,
      });
      return rows;
    }
    if (Array.isArray(expected)) {
      const missing = actual === undefined,
        ok = !missing && JSON.stringify(actual) === JSON.stringify(expected);
      rows.push({
        path: path || "(root)",
        status: missing ? "MISSING" : ok ? "PASS" : "DIFF",
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
  function actualFor(g) {
    try {
      const s = window.TianjiQimenCrosscheck?.snapshot?.(g.family, civ(g.civil));
      return s?.core || null;
    } catch (err) {
      return { __error: String(err?.message || err) };
    }
  }
  function compareOne(g) {
    const a = actualFor(g),
      rows = walk(a, g.expected),
      pass = rows.filter((x) => x.status === "PASS").length,
      diff = rows.filter((x) => x.status === "DIFF").length,
      missing = rows.filter((x) => x.status === "MISSING").length;
    return {
      id: g.id,
      family: g.family,
      civil: g.civil,
      compatibility: g.compatibility,
      doctrine: g.doctrine,
      source: "atopx/qimen",
      sourceCommit: SOURCES[0].commit,
      status:
        g.compatibility === "same" ? (diff || missing ? "DIFF" : "PASS") : "DOCTRINE_MISMATCH",
      compared: rows.length,
      pass,
      diff,
      missing,
      rows,
      actual: a,
      reference: clone(g.raw),
    };
  }
  function compareAll() {
    const cases = GOLDENS.map(compareOne);
    return {
      schema: SCHEMA,
      build: BUILD,
      generatedAt: new Date().toISOString(),
      sources: clone(SOURCES),
      doctrines: clone(DOCTRINES),
      summary: {
        cases: cases.length,
        passFields: cases.reduce((s, x) => s + x.pass, 0),
        diffFields: cases.reduce((s, x) => s + x.diff, 0),
        missingFields: cases.reduce((s, x) => s + x.missing, 0),
        doctrineMismatch: cases.filter((x) => x.status === "DOCTRINE_MISMATCH").length,
      },
      cases,
    };
  }
  function v199Pack() {
    return {
      schema: "tianji.qimen.crosscheck.reference.v1",
      sourceBundle: { name: "atopx/qimen goldenCharts", commit: SOURCES[0].commit, license: "MIT" },
      cases: GOLDENS.map((g) => ({
        id: g.id,
        family: g.family,
        input: { civil: g.civil },
        source: {
          name: "atopx/qimen goldenCharts",
          version: SOURCES[0].commit,
          url: "https://github.com/atopx/qimen/blob/8eb06d007d4a5fcc5352d9054f81469e5f023f45/qimen_golden_test.go",
          note: "第三方仓库声明该 goldenChart 来自参考排盘软件输出；当前与 Tianji 流派口径不完全一致。",
        },
        expected: clone(g.expected),
      })),
    };
  }
  function sourceHTML() {
    return SOURCES.map(
      (s, i) =>
        `<div class="q221-item ${i === 0 ? "good" : "cyan"}"><b>${E(s.name)}</b><small>${E(s.type)} · ${E(s.license)}<br><span class="q221-code">${E(s.commit)}</span><br>${E(s.note)}</small><div class="q221-badges"><span class="q221-badge ${i === 0 ? "good" : "cyan"}">${i === 0 ? "真实 Golden" : "独立规则实现"}</span><span class="q221-badge">commit pinned</span></div></div>`,
    ).join("");
  }
  function doctrineHTML() {
    return `<div class="q221-tablewrap"><table class="q221-table"><thead><tr><th>家法</th><th>Tianji 当前口径</th><th>atopx/qimen</th><th>AbelardZ/QiMen</th><th>判断</th></tr></thead><tbody>${DOCTRINES.map((d) => `<tr><td><b>${E(d.family)}</b></td><td>${E(d.tianji)}</td><td>${E(d.atopx)}</td><td>${E(d.abelard)}</td><td><span class="q221-state doctrine">${E(d.verdict)}</span></td></tr>`).join("")}</tbody></table></div>`;
  }
  function resultsHTML(R) {
    return R.cases
      .map((c) => {
        const bad = c.rows.filter((x) => x.status !== "PASS").slice(0, 10);
        return `<div class="q221-case"><h5>${E(c.family)} · ${E(c.civil)}</h5><small>${E(c.status)} · fields ${c.compared} · PASS ${c.pass} / DIFF ${c.diff} / MISSING ${c.missing}</small><div class="q221-badges"><span class="q221-badge cyan">第三方 Golden</span><span class="q221-badge gold">流派分歧优先解释</span></div>${bad.length ? `<div class="q221-diffs">${bad.map((x) => `<span class="q221-state ${x.status === "DIFF" ? "diff" : "missing"}">${E(x.status)} · ${E(x.path)}</span>`).join("")}</div>` : '<div class="q221-diffs"><span class="q221-state pass">字段全部一致</span></div>'}</div>`;
      })
      .join("");
  }
  function panel() {
    const R = compareAll(),
      S = R.summary;
    return `<section class="q221" id="q221ExternalEvidence">
  <section class="q221-hero"><div class="q221-head"><div><h3>V221 · 奇门外部 Golden 对拍 / 流派分歧审计</h3><p>第一次把日家、月家、年家的真实第三方 Golden 样本直接带进天机盘。重点不是强行追求 PASS，而是区分“实现错误”和“流派规则本来就不同”。atopx/qimen 的 Golden 来自其公开测试文件；AbelardZ/QiMen 作为第二独立实现用于规则交叉核对。</p></div><span class="q221-schema">${SCHEMA}</span></div>
   <div class="q221-tools"><button class="primary" type="button" id="q221Run">重新对拍</button><button type="button" id="q221Import">导入 V199 对拍台</button><button type="button" id="q221Export">导出 Golden Pack</button></div>
  </section>
  <div class="q221-kpis">
   <div class="q221-kpi good"><small>真实外部源</small><b>${SOURCES.length}</b></div>
   <div class="q221-kpi cyan"><small>Golden 样本</small><b>${GOLDENS.length}</b></div>
   <div class="q221-kpi"><small>覆盖家法</small><b>日/月/年</b></div>
   <div class="q221-kpi good"><small>一致字段</small><b>${S.passFields}</b></div>
   <div class="q221-kpi bad"><small>差异字段</small><b>${S.diffFields}</b></div>
   <div class="q221-kpi gold"><small>流派分歧样本</small><b>${S.doctrineMismatch}</b></div>
  </div>
  <div class="q221-grid">
   <section class="q221-card"><h4>独立来源</h4><div class="q221-list">${sourceHTML()}</div></section>
   <aside class="q221-card"><h4>审计结论</h4>
    <div class="q221-item warn"><b>不能把 DIFF 直接等同于算法错误</b><small>当前三家规则在“日家如何定局、月家三元/起局、年家是否本元内逐年换局”上存在公开实现分歧。因此 V221 先把差异标为 doctrine mismatch，再决定是否需要新增流派包。</small></div>
    <div class="q221-item cyan"><b>任务仍保持进行中</b><small>已经取得第一套真实日/月/年 Golden，但还需要至少第二套独立 Golden 或人工金样，才能决定哪一套规则应作为默认口径、哪一套作为可选流派。</small></div>
   </aside>
  </div>
  <section class="q221-card"><h4>流派 / 实现规则矩阵</h4>${doctrineHTML()}</section>
  <section class="q221-card"><h4>内置 Golden 对拍结果</h4><div class="q221-result" id="q221Result">${resultsHTML(R)}</div></section>
  <section class="q221-card"><h4>Evidence 边界</h4><div class="q221-note">本版把 atopx/qimen 的公开 goldenCharts 作为“第三方 reference 数据源”，但不把该项目当作唯一权威。其测试文件声称样本转录自参考排盘软件输出；由于参考软件身份未在测试文件中明示，因此 Evidence 等级仍应视作独立外部对拍材料，而不是最终古籍金标准。AbelardZ/QiMen 当前只作为第二独立算法口径，不冒充 Golden。</div></section>
 </section>`;
  }
  function mount() {
    const pane = document.getElementById("pane-qimen");
    if (!pane || !pane.classList.contains("on")) return;
    const anchor = pane.querySelector("#q199Lab");
    if (!anchor) return;
    const old = pane.querySelector("#q221ExternalEvidence");
    const tmp = document.createElement("div");
    tmp.innerHTML = panel();
    const fresh = tmp.firstElementChild;
    if (old) old.replaceWith(fresh);
    else anchor.insertAdjacentElement("afterend", fresh);
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
  document.addEventListener(
    "click",
    (e) => {
      if (e.target?.id === "q221Run") {
        mount();
        return;
      }
      if (e.target?.id === "q221Export") {
        download("天机盘_V221_奇门外部Golden_Pack.json", {
          schema: GOLDEN_SCHEMA,
          build: BUILD,
          sources: SOURCES,
          cases: GOLDENS,
        });
        return;
      }
      if (e.target?.id === "q221Import") {
        try {
          const r = window.TianjiQimenCrosscheck?.importReferences?.(v199Pack());
          try {
            toast(`已把 ${GOLDENS.length} 个真实外部样本导入 V199 对拍台`);
          } catch (_) {}
          try {
            refRender("qimen");
          } catch (_) {}
          TianjiPaneScheduler.request("qimen");
          console.info("[V221 import]", r);
        } catch (err) {
          try {
            toast("导入失败：" + String(err?.message || err));
          } catch (_) {}
        }
      }
    },
    true,
  );

  TianjiPaneScheduler.register("qimen", "v221-qimen-external-evidence-js", mount);
  document.addEventListener(
    "click",
    (e) => {
      if (e.target?.closest?.("[data-q165-mode],[data-q165-shift],[data-q165-now],#qm124Run"))
        TianjiPaneScheduler.request("qimen");
    },
    true,
  );

  /* Core provenance：只登记真实来源与验证层，不提升算法成熟度。 */
  try {
    if (window.TianjiCore) {
      TianjiCore.registerSource({
        id: "external-atopx-qimen-golden",
        type: "external",
        title: "atopx/qimen goldenCharts",
        version: SOURCES[0].commit,
        license: "MIT",
        note: SOURCES[0].note,
      });
      TianjiCore.registerSource({
        id: "external-abelardz-qimen",
        type: "external",
        title: "AbelardZ/QiMen four-family implementation",
        version: SOURCES[1].commit,
        license: "MIT",
        note: SOURCES[1].note,
      });
      TianjiCore.registerEngine(
        {
          id: "qimen.external.evidence.v2",
          system: "qimen",
          name: "Qimen External Golden Evidence V2",
          version: "2.0.0",
          source: "external-atopx-qimen-golden",
          doctrine: "external cross-check + doctrine divergence audit",
          status: "research",
        },
        () => compareAll(),
      );
    }
  } catch (err) {
    console.warn("[V221 registry]", err);
  }

  const TASKS221 = [
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
      note: "v221 已取得 atopx/qimen 日/月/年真实 Golden，并引入 AbelardZ/QiMen 独立规则口径；发现三家在日家定局、月家起局、年家换局上存在明确流派分歧。下一步：补第二套独立 Golden / 人工金样，并建立可选择流派包，不能为了 PASS 强改现有算法。",
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
      note: "v203–v204 完成当前声明流派口径；V218/V219 修复渲染",
    },
    {
      id: "qizheng",
      p: "P1",
      name: "七政四余核心化",
      state: "blocked",
      note: "等待可靠星历、四余口径与许可证方案",
    },
    {
      id: "xk",
      p: "P1",
      name: "玄空完整宅盘",
      state: "done",
      note: "v205–v206 当前声明口径完成；外部逐盘 reference 仍可继续增强",
    },
    {
      id: "sanhe",
      p: "P1",
      name: "三合水法 Core",
      state: "done",
      note: "v207–v208 当前声明口径完成；外部逐盘 reference 仍可继续增强",
    },
    { id: "tz", p: "P2", name: "历史时区 / 夏令时自动校正", state: "done", note: "v209–v211 完成" },
    { id: "relation", p: "P2", name: "关系长期时间轴", state: "done", note: "v212–v213 完成" },
    { id: "report", p: "P2", name: "合参 Evidence 正式报告", state: "done", note: "v214 完成" },
  ];
  const BOARD221 = {
    schema: "tianji.priority.board.v1",
    build: BUILD,
    total: 14,
    done: 12,
    doing: 1,
    blocked: 1,
    progress: 92.9,
    next: [
      "奇门第二套独立 Golden / 人工金样",
      "奇门流派包：日/月/年规则可选择且可审计",
      "七政四余可靠星历 / 许可证前置",
      "玄空 / 三合外部逐盘 reference 增强",
    ],
    tasks: TASKS221,
  };
  function applyBoard() {
    window.TianjiPriorityBoard = Object.freeze({
      schema: BOARD221.schema,
      snapshot: () => clone(BOARD221),
    });
    const road = window.TianjiRoadmap || {};
    window.TianjiRoadmap = Object.freeze(
      Object.assign({}, road, {
        urgentImportant: clone(BOARD221),
        nextMainline: clone(BOARD221.next),
      }),
    );
  }
  applyBoard();
  window.addEventListener("tianji:lazy-ready", () => setTimeout(applyBoard, 0));

  function selfTest() {
    const C = [],
      add = (id, ok, d = "") => C.push({ id, ok: !!ok, d });
    add("sources", SOURCES.length === 2, String(SOURCES.length));
    add("goldens", GOLDENS.length === 4, String(GOLDENS.length));
    add(
      "families",
      new Set(GOLDENS.map((x) => x.family)).size === 3,
      GOLDENS.map((x) => x.family).join(","),
    );
    add(
      "atopx.commit",
      SOURCES[0].commit === "8eb06d007d4a5fcc5352d9054f81469e5f023f45",
      SOURCES[0].commit,
    );
    add(
      "no.fake.pass",
      GOLDENS.every((x) => x.compatibility === "doctrine-divergent"),
      "",
    );
    add("v199.api", typeof window.TianjiQimenCrosscheck?.snapshot === "function", "");
    return { ok: C.every((x) => x.ok), checks: C };
  }
  const TEST = selfTest();

  window.TianjiQimenExternalEvidenceV221 = Object.freeze({
    version: "2.0.0",
    build: BUILD,
    schema: SCHEMA,
    goldenSchema: GOLDEN_SCHEMA,
    sources: () => clone(SOURCES),
    goldens: () => clone(GOLDENS),
    doctrines: () => clone(DOCTRINES),
    compare: () => clone(compareAll()),
    v199Pack: () => clone(v199Pack()),
    importToV199: () => window.TianjiQimenCrosscheck?.importReferences?.(v199Pack()),
    selfTest: () => clone(TEST),
    manifest: () => ({
      module: "Qimen External Golden Evidence V2",
      phase: "real external reference acquired",
      goldenProvider: "atopx/qimen",
      secondIndependentImplementation: "AbelardZ/QiMen",
      complete: false,
      reason:
        "日/月/年家公开实现存在明显流派差异；仍需第二套独立 Golden / 人工金样后才能决定默认流派口径",
      algorithmChanged: false,
    }),
  });
  window.TianjiSystemV221 = {
    version: "v221",
    build: BUILD,
    qimenExternalGolden: true,
    qimenEvidenceStillDoing: true,
    algorithmChanged: false,
    baseline: "v219-fusion",
  };
})();
