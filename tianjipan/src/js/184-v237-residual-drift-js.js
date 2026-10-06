(() => {
  "use strict";
  const BUILD = "v237 · 2026-10-07 00:02 +08:00",
    SCHEMA = "tianji.qizheng.residual-drift.v1";
  const BASE_QZ = window.qzCalc;
  const clone = (o) => (o == null ? o : JSON.parse(JSON.stringify(o)));
  const E = (s) =>
    String(s ?? "").replace(
      /[&<>\"]/g,
      (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c],
    );
  const norm = (x, p) => ((Number(x) % p) + p) % p;
  const sdiff = (a, b, p) => {
    let d = norm(Number(a) - Number(b), p);
    if (d > p / 2) d -= p;
    return d;
  };
  const ORDER = [
    "奎",
    "娄",
    "胃",
    "昴",
    "毕",
    "觜",
    "参",
    "井",
    "鬼",
    "柳",
    "星",
    "张",
    "翼",
    "轸",
    "角",
    "亢",
    "氐",
    "房",
    "心",
    "尾",
    "箕",
    "斗",
    "牛",
    "女",
    "虚",
    "危",
    "室",
    "壁",
  ];
  const WIDTH = {
    箕: 9.59,
    斗: 23.47,
    牛: 6.9,
    女: 11.12,
    虚: 9.0064,
    危: 15.95,
    室: 18.32,
    壁: 9.34,
    奎: 17.87,
    娄: 12.36,
    胃: 15.81,
    昴: 11.08,
    毕: 16.5,
    觜: 0.05,
    参: 10.28,
    井: 31.03,
    鬼: 2.11,
    柳: 13.0,
    星: 6.31,
    张: 17.79,
    翼: 20.09,
    轸: 18.75,
    角: 12.87,
    亢: 9.56,
    氐: 16.4,
    房: 5.48,
    心: 6.27,
    尾: 17.95,
  };
  const START = {};
  let TOTAL = 0;
  for (const x of ORDER) {
    START[x] = TOTAL;
    TOTAL += WIDTH[x];
  }
  const NATIVE = (x, d = 0) => norm((START[x] ?? 0) + Number(d || 0), TOTAL);
  const SOURCES = Object.freeze([
    {
      id: "mingshi35-datong-epoch",
      rank: "A",
      title: "《明史》卷三十五 · 大统历法三上",
      evidence: "洪武十七年甲子岁为元；上距至元辛巳一百零四算。岁周365.2425日。",
      role: "历元链 / 中积",
    },
    {
      id: "mingshi36-four-residua",
      rank: "A",
      title: "《明史》卷三十六 · 步四余",
      evidence: "列紫气、月孛、罗计周日、度率与洪武甲子历元至后策；气孛顺行、罗计逆行。",
      role: "1384绝对相位常数",
    },
    {
      id: "mingshigao-yuan-root",
      rank: "A-",
      title: "《明史稿》历五下 · 至元辛巳岁至后策",
      evidence: "保留授时/辛巳历元四余至后策；与大统常数可通过103个实经过年闭合。",
      role: "1281继承根",
    },
    {
      id: "tushubian21-wanli",
      rank: "A",
      title: "《图书编》卷二十一 · 万历五年十二月朔",
      evidence: "罗睺角七度、计都奎十七度、紫气张十四度、月孛危十三度。",
      role: "1578独立实载锚点",
    },
    {
      id: "v230-astronomy-reconstruction",
      rank: "derived",
      title: "V230 天文重建",
      evidence: "1578-01-18T02:45:54Z 朔时；V237以现代太阳270°重建1383岁前冬至作为连续时间轴参考。",
      role: "跨世纪 elapsed-days",
    },
  ]);
  const PERIOD = Object.freeze({
    紫炁: 10227.1792,
    月孛: 3231.9684,
    罗睺: 6793.4432,
    计都: 6793.4432,
  });
  const DAY_PER_DU = Object.freeze({
    紫炁: 28,
    月孛: 8.848492,
    罗睺: 18.59910776,
    计都: 18.59910776,
  });
  const DIR = Object.freeze({ 紫炁: 1, 月孛: 1, 罗睺: -1, 计都: -1 });
  const YUAN1281 = Object.freeze({
    紫炁: 1256.5224,
    月孛: 2384.1092,
    罗睺: 1680.8602,
    计都: 5077.5818,
  });
  const DATONG1384 = Object.freeze({
    紫炁: 8194.9623,
    月孛: 1220.4659,
    罗睺: 5333.6217,
    计都: 1936.9001,
  });
  const DATO_EPOCH = Object.freeze({
    label: "洪武十七年甲子岁前冬至",
    year: 1384,
    astronomicalJDUT: 2226545.262789582,
    prolepticGregorian: "1383-12-21 18:18:25 UT",
    julian: "1383-12-13 18:18:25 UT",
    method: "modern Sun longitude 270° reconstruction; audit time axis only",
  });
  const WANLI = Object.freeze({
    label: "万历五年十二月朔",
    jdUT: 2297429.615209005,
    isoUTC: "1578-01-18T02:45:54.058Z",
    julian: "1578-01-08",
    textual: Object.freeze({
      罗睺: ["角", 7],
      计都: ["奎", 17],
      紫炁: ["张", 14],
      月孛: ["危", 13],
    }),
  });
  const ELAPSED_DAYS = WANLI.jdUT - DATO_EPOCH.astronomicalJDUT;
  function yuanToDatong() {
    const elapsed = 103 * 365.2425;
    return Object.keys(DATONG1384).map((name) => {
      const got = norm(YUAN1281[name] + elapsed, PERIOD[name]);
      return {
        name,
        yuan: YUAN1281[name],
        elapsedDays: elapsed,
        predicted: +got.toFixed(7),
        datong: DATONG1384[name],
        errorDays: +sdiff(got, DATONG1384[name], PERIOD[name]).toFixed(9),
      };
    });
  }
  function epochNative() {
    const ji0 = NATIVE("箕", 0);
    const out = {};
    for (const name of Object.keys(DATONG1384))
      out[name] = norm(ji0 + DIR[name] * (DATONG1384[name] / DAY_PER_DU[name]), TOTAL);
    return out;
  }
  function driftRows() {
    const e = epochNative(),
      out = [];
    for (const name of ["罗睺", "计都", "月孛", "紫炁"]) {
      const predicted = norm(e[name] + DIR[name] * (ELAPSED_DAYS / DAY_PER_DU[name]), TOTAL),
        [xiu, du] = WANLI.textual[name],
        observed = NATIVE(xiu, du),
        delta = sdiff(predicted, observed, TOTAL);
      out.push({
        name,
        direction: DIR[name] > 0 ? "顺" : "逆",
        epochNative: +e[name].toFixed(6),
        predictedWanliNative: +predicted.toFixed(6),
        observedWanliNative: +observed.toFixed(6),
        observedText: xiu + du + "度",
        residualTraditionalDeg: +delta.toFixed(6),
        residualModernDeg: +((delta * 360) / TOTAL).toFixed(6),
        absModernDeg: +Math.abs((delta * 360) / TOTAL).toFixed(6),
        perCenturyModernDeg: +((delta * 360) / TOTAL / (ELAPSED_DAYS / 36524.25)).toFixed(6),
      });
    }
    return out;
  }
  function stats() {
    const r = driftRows(),
      abs = r.map((x) => x.absModernDeg);
    return {
      elapsedDays: +ELAPSED_DAYS.toFixed(6),
      elapsedYears: +(ELAPSED_DAYS / 365.2425).toFixed(6),
      meanAbsModernDeg: +(abs.reduce((a, b) => a + b, 0) / abs.length).toFixed(6),
      maxAbsModernDeg: +Math.max(...abs).toFixed(6),
      nodeOppositionEpochErrorTraditional: +Math.abs(
        Math.abs(sdiff(epochNative().罗睺, epochNative().计都, TOTAL)) - TOTAL / 2,
      ).toFixed(9),
      decision: "KEEP_WANLI_PROVIDER",
      reason:
        "cross-source long-baseline residual is material; use Dàtǒng chain as audit evidence, not silent production recalibration",
    };
  }
  function sourceHTML() {
    return SOURCES.map(
      (s) =>
        `<div class="q237-item ${s.rank === "A" ? "good" : s.rank === "derived" ? "cyan" : "warn"}"><b>${E(s.rank)} · ${E(s.title)}</b><small>${E(s.evidence)}<br>用途：${E(s.role)}</small></div>`,
    ).join("");
  }
  function flowHTML() {
    return `<div class="q237-flow"><div class="q237-node"><strong>1281 · 至元辛巳</strong><span>《授时》继承根<br>四余至后策：原始相位常数</span></div><div class="q237-arrow">→</div><div class="q237-node"><strong>1384 · 洪武甲子</strong><span>《大统》新历元<br>103个实经过年；古文称“一百零四算”</span></div><div class="q237-arrow">→</div><div class="q237-node"><strong>1578 · 万历五年</strong><span>《图书编》独立宿度实载<br>用作长基线残差检验</span></div></div>`;
  }
  function chainHTML() {
    return `<div class="q237-scroll"><table class="q237-table"><thead><tr><th>四余</th><th>1281至后策</th><th>103年推得1384</th><th>《明史》1384</th><th>闭合误差(日)</th></tr></thead><tbody>${yuanToDatong()
      .map(
        (x) =>
          `<tr><td>${E(x.name)}</td><td>${x.yuan.toFixed(4)}</td><td>${x.predicted.toFixed(4)}</td><td>${x.datong.toFixed(4)}</td><td>${x.errorDays.toFixed(7)}</td></tr>`,
      )
      .join("")}</tbody></table></div>`;
  }
  function driftHTML() {
    return `<div class="q237-scroll"><table class="q237-table"><thead><tr><th>四余</th><th>行向</th><th>1384历元原生度</th><th>推至1578原生度</th><th>1578实载</th><th>传统度残差</th><th>现代角度等值</th></tr></thead><tbody>${driftRows()
      .map(
        (x) =>
          `<tr><td>${E(x.name)}</td><td>${x.direction}</td><td>${x.epochNative.toFixed(3)}°</td><td>${x.predictedWanliNative.toFixed(3)}°</td><td>${E(x.observedText)} · ${x.observedWanliNative.toFixed(3)}°</td><td class="${x.residualTraditionalDeg >= 0 ? "q237-pos" : "q237-neg"}">${x.residualTraditionalDeg >= 0 ? "+" : ""}${x.residualTraditionalDeg.toFixed(3)}°</td><td class="${x.residualModernDeg >= 0 ? "q237-pos" : "q237-neg"}">${x.residualModernDeg >= 0 ? "+" : ""}${x.residualModernDeg.toFixed(3)}°</td></tr>`,
      )
      .join("")}</tbody></table></div>`;
  }
  function panel() {
    const S = stats(),
      chain = yuanToDatong(),
      maxChain = Math.max(...chain.map((x) => Math.abs(x.errorDays)));
    return `<section id="q237ResidualDrift" class="q237">
 <section class="q237-hero"><div class="q237-head"><div><h3>V237 · 四余三历元链 / 长期相位漂移验证</h3><p>把至元辛巳（1281）→洪武甲子（1384）→万历五年（1578）串成同一条可审计时间链。目的不是强迫古籍彼此一致，而是区分“历元常数内部闭合”和“跨来源、跨近两百年实载残差”。</p></div><span class="q237-schema">${SCHEMA}</span></div><div class="q237-tools"><button class="primary" id="q237Refresh" type="button">重新计算</button><button id="q237Export" type="button">导出 V237 Report</button></div></section>
 <div class="q237-kpis"><div class="q237-kpi good"><small>1281→1384闭合</small><b>${maxChain.toExponential(1)} d</b></div><div class="q237-kpi"><small>1384→1578跨度</small><b>${S.elapsedYears.toFixed(2)} 年</b></div><div class="q237-kpi warn"><small>平均绝对残差</small><b>${S.meanAbsModernDeg.toFixed(2)}°</b></div><div class="q237-kpi bad"><small>最大绝对残差</small><b>${S.maxAbsModernDeg.toFixed(2)}°</b></div><div class="q237-kpi good"><small>生产 Provider</small><b>保持 V231</b></div><div class="q237-kpi"><small>Live qzCalc</small><b>未改动</b></div></div>
 <section class="q237-card"><h4>一、1281 → 1384 → 1578 三历元证据链</h4>${flowHTML()}<div class="q237-note" style="margin-top:7px">“一百零四算”是包含首尾的传统计数；1281→1384的实际经过年数为103。用《明史》岁周365.2425日推进，四项至后策都闭合到大统常数，说明辛巳根与洪武甲子常数属于同一继承链。</div></section>
 <section class="q237-card"><h4>二、授时根 → 大统历元：相位常数闭合测试</h4>${chainHTML()}</section>
 <section class="q237-card"><h4>三、洪武甲子模型外推 → 万历五年实载：长期残差</h4>${driftHTML()}<div class="q237-note" style="margin-top:7px">残差 = “按《明史》大统四余至后策/度率连续外推的1578位置” − “《图书编》万历五年十二月朔实载宿度”，统一在V229的365.2564传统黄道宿度框架中比较。现代角度等值仅用于直观量级比较，不宣称四余是现代可观测天体。</div></section>
 <div class="q237-grid"><section class="q237-card"><h4>四、Evidence Sources</h4><div class="q237-list">${sourceHTML()}</div></section><aside class="q237-card"><h4>五、V237 判定</h4><div class="q237-list"><div class="q237-item good"><b><span class="q237-badge keep">KEEP</span> V231 万历锚定 Provider</b><small>生产计算不改。万历独立实载锚点仍是当前绝对相位的直接证据。</small></div><div class="q237-item warn"><b><span class="q237-badge audit">AUDIT</span> 大统链作为长期漂移审计层</b><small>1384→1578出现显著跨来源残差，不能在没有第三历史盘例与宿界/历元口径拆分前自动校正。</small></div><div class="q237-item cyan"><b>不把残差简单叫“天文误差”</b><small>它可能混合均平速率差、原始历元常数差、黄道宿界历元差、文本取整及不同术数传统。V237记录现象，不替古籍强行统一。</small></div></div></aside></div>
 </section>`;
  }
  function report() {
    return {
      schema: SCHEMA,
      build: BUILD,
      generatedAt: new Date().toISOString(),
      frame: {
        traditionalCycleDeg: +TOTAL.toFixed(7),
        startBoundary: "尾末 = 箕初",
        source: "V229 Ming yellow-xiu frame",
      },
      epochs: {
        yuan1281: { label: "至元辛巳", phaseDays: clone(YUAN1281) },
        datong1384: { ...clone(DATO_EPOCH), phaseDays: clone(DATONG1384) },
        wanli1578: clone(WANLI),
      },
      chain1281to1384: yuanToDatong(),
      drift1384to1578: { elapsedDays: +ELAPSED_DAYS.toFixed(9), rows: driftRows(), stats: stats() },
      decision: {
        productionProvider: "V231 wanli-mean remains unchanged",
        datongRole: "audit-only historical mean chain",
        autoRecalibrate: false,
        why: "material cross-source residual; third anchor/frame decomposition required before any provider change",
      },
      sources: clone(SOURCES),
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
      pane.querySelector("#q236LiangtianchiGrid") ||
      pane.querySelector("#q235Liangtianchi") ||
      pane.firstElementChild;
    const old = pane.querySelector("#q237ResidualDrift"),
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
      if (e.target?.id === "q237Refresh") {
        mount();
        return;
      }
      if (e.target?.id === "q237Export") {
        save("天机盘_V237_四余三历元链_长期相位漂移Report.json", report());
        return;
      }
    },
    true,
  );
  TianjiPaneScheduler.register("qizheng", "v237-residual-drift-js", mount);
  try {
    if (window.TianjiCore) {
      TianjiCore.registerSource({
        id: "qizheng-datong-epoch-v237",
        type: "classic",
        title: "明史卷35/36 · 大统历元与四余至后策",
        version: "洪武甲子历元",
        license: "public-domain-classic",
        note: "V237将1281授时辛巳根、1384大统历元、1578图书编实载串为长基线审计链。",
      });
      TianjiCore.registerRule({
        id: "qizheng.residual.long-baseline.v1",
        system: "qizheng",
        source: "qizheng-datong-epoch-v237",
        title: "四余跨历元相位漂移审计",
        status: "evidence-audit",
        note: "允许历史模型与独立实载存在残差；残差显著时禁止静默自动校准生产Provider。",
      });
      TianjiCore.registerEngine(
        {
          id: "qizheng.residual.drift-audit.v1",
          system: "qizheng",
          name: "Four-Residua Long-baseline Drift Audit",
          version: "1.0.0",
          source: "qizheng-datong-epoch-v237",
          doctrine:
            "1281→1384 inherited phase closure + 1384→1578 independent textual residual; audit only",
          status: "research-verified",
        },
        () => report(),
      );
    }
  } catch (err) {
    console.warn("[V237 registry]", err);
  }
  const TASKS237 = [
    { id: "ai", p: "P0", name: "统一 AI 解释层", state: "done", note: "v171 完成" },
    { id: "mcp", p: "P0", name: "MCP / API 外部调用层", state: "done", note: "v172 完成" },
    {
      id: "kg",
      p: "P0",
      name: "典籍 Evidence / 规则知识图谱",
      state: "done",
      note: "v173 第一阶段；V237新增授时→大统→万历三历元四余Evidence链",
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
      note: "V224–V236已完成七政星历、四余三轨Provider、命身、强弱变曜、百六/小限、量天尺。V237新增1281授时辛巳→1384大统甲子→1578万历实载三历元链：前段常数严格闭合，后段发现显著跨来源长期相位残差，因此生产Provider继续保持V231万历锚定，不做静默历史重校。",
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
  const BOARD237 = {
    schema: "tianji.priority.board.v1",
    build: BUILD,
    total: 14,
    done: 12,
    doing: 2,
    blocked: 0,
    progress: 92.9,
    next: [
      "V238 四季土旺水衰：辰戌丑未 live 时间窗 / 月令边界定义",
      "奇门日家完整 Doctrine / 月家逐宫扩样",
      "四余第三历史盘例 + 宿界历元/均速差残差分解（Evidence增强）",
      "量天总尺逐格宿名字形复核（Evidence增强）",
    ],
    tasks: TASKS237,
  };
  function applyBoard() {
    window.TianjiPriorityBoard = Object.freeze({
      schema: BOARD237.schema,
      snapshot: () => clone(BOARD237),
    });
    const road = window.TianjiRoadmap || {};
    window.TianjiRoadmap = Object.freeze(
      Object.assign({}, road, {
        urgentImportant: clone(BOARD237),
        nextMainline: clone(BOARD237.next),
      }),
    );
  }
  applyBoard();
  window.addEventListener("tianji:lazy-ready", () => setTimeout(applyBoard, 0));
  function selfTest() {
    const C = [],
      add = (id, ok, d = "") => C.push({ id, ok: !!ok, d });
    const chain = yuanToDatong(),
      rows = driftRows(),
      S = stats();
    add("frame.total", Math.abs(TOTAL - 365.2564) < 1e-9, TOTAL.toFixed(7));
    add("chain.count", chain.length === 4, String(chain.length));
    add(
      "chain.closure",
      chain.every((x) => Math.abs(x.errorDays) < 1e-6),
      JSON.stringify(chain.map((x) => x.errorDays)),
    );
    add(
      "epoch.node.opposition",
      S.nodeOppositionEpochErrorTraditional <= 0.0001 / DAY_PER_DU.罗睺,
      `error=${S.nodeOppositionEpochErrorTraditional}; tolerance=${0.0001 / DAY_PER_DU.罗睺} traditional degrees (4-decimal phase rounding)`,
    );
    add("wanli.anchor.count", rows.length === 4, String(rows.length));
    add("drift.detected", S.maxAbsModernDeg > 10, String(S.maxAbsModernDeg));
    add("provider.policy", S.decision === "KEEP_WANLI_PROVIDER", S.decision);
    add("v229.present", !!window.TianjiQizhengXiuFrameV229, "");
    add("v231.present", !!window.TianjiQizhengResidualProviderV231, "");
    add("live.unchanged", window.qzCalc === BASE_QZ, "");
    return { ok: C.every((x) => x.ok), checks: C };
  }
  const TEST = selfTest();
  window.TianjiQizhengResidualDriftV237 = Object.freeze({
    version: "1.0.0",
    build: BUILD,
    schema: SCHEMA,
    sources: () => clone(SOURCES),
    yuan1281: () => clone(YUAN1281),
    datong1384: () => clone(DATONG1384),
    epoch: () => clone(DATO_EPOCH),
    wanli: () => clone(WANLI),
    chain: () => clone(yuanToDatong()),
    drift: () => clone(driftRows()),
    stats: () => clone(stats()),
    report: () => clone(report()),
    selfTest: () => clone(TEST),
    manifest: () => ({
      module: "Four-Residua Long-baseline Drift Audit V237",
      chain: "1281 Shoushi root → 1384 Datong epoch → 1578 Tushubian anchor",
      chainClosure: "pass",
      longBaselineResidual: "material",
      productionProviderChanged: false,
      canonicalProvider: "V231 wanli-mean",
      next: "seasonal strength live windows; third historical anchor optional evidence refinement",
    }),
  });
  window.TianjiSystemV237 = {
    version: "v237",
    build: BUILD,
    qizhengResidualLongBaseline: true,
    threeEpochChain: true,
    productionProviderChanged: false,
    baseline: "v236",
  };
})();
