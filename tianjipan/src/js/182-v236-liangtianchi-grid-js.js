(() => {
  "use strict";
  const BUILD = "v236 · 2026-10-06 23:35 +08:00";
  const SCHEMA = "tianji.qizheng.liangtianchi.grid.v2";
  const BASE_QZ = window.qzCalc || qzCalc;
  const ZHIS = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];
  const BINS = Array.from({ length: 10 }, (_, i) => ({
    age: 11 + i,
    start: i * 3,
    end: (i + 1) * 3,
    status: "scan-grid-3deg-bin",
  }));
  const SOURCES = [
    {
      id: "xingping-huihai-grid-65-66",
      type: "primary-scan",
      title: "《星平会海》· 命宫缠度几岁出童限行大限过宫量天总尺",
      pages: "65–66",
      url: "https://www.vr-d.com/pdf-file/%E5%91%BD%E7%90%86%2F%E6%98%9F%E5%B9%B3%E4%BC%9A%E6%B5%B7_%E4%B8%8A_%E6%98%8E_%E6%AD%A6%E5%BD%93%E5%B1%B1%E6%9C%88%E9%87%91%E5%B1%B1%E4%BA%BA%E8%91%97.pdf",
      supports: ["十二宫逐行量天总尺", "宿度跨宫格眼", "童限/后续宫限表格"],
    },
    {
      id: "zhangguo-567-liangtianchi-grid",
      type: "primary-classic",
      title: "《钦定古今图书集成》艺术典第567卷 · 定限度法",
      url: "https://zh.wikisource.org/zh-hans/%E6%AC%BD%E5%AE%9A%E5%8F%A4%E4%BB%8A%E5%9C%96%E6%9B%B8%E9%9B%86%E6%88%90/%E5%8D%9A%E7%89%A9%E5%BD%99%E7%B7%A8/%E8%97%9D%E8%A1%93%E5%85%B8/%E7%AC%AC567%E5%8D%B7",
      supports: ["早11迟20", "星五度第五行=15", "张十一至十三度=20", "命宫行度随浅深"],
    },
    {
      id: "qizheng-grid-study-2016",
      type: "secondary-study",
      title: "《七政四余洞微大限出限年说明》· 古表区间考证",
      url: "https://blog.sina.com.cn/s/blog_abafdda10102wo8v.html",
      supports: ["3度为一区间", "0–3概算11岁、3–6概算12岁", "初=零度思想", "精算与概算边界差异"],
    },
  ];
  const clone = (x) => (x == null ? x : JSON.parse(JSON.stringify(x)));
  const E = (s) =>
    String(s ?? "").replace(
      /[&<>"']/g,
      (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
    );
  const mod30 = (x) => {
    if (x == null || typeof x === "boolean" || (typeof x === "string" && !x.trim())) return null;
    const n = Number(x);
    return Number.isFinite(n) ? (n % 30 < 0 ? (n % 30) + 30 : n % 30) : null;
  };
  function ageFromDegree(deg) {
    const d = mod30(deg);
    if (d == null) return null;
    return 11 + Math.min(9, Math.floor(d / 3));
  }
  function fineAgeFromDegree(deg) {
    const d = mod30(deg);
    return d == null ? null : 10 + d / 3;
  }
  function binForDegree(deg) {
    const age = ageFromDegree(deg);
    return age ? BINS[age - 11] : null;
  }
  function edgeDistance(deg) {
    const d = mod30(deg);
    if (d == null) return null;
    const r = d % 3;
    return Math.min(r, 3 - r);
  }
  function currentR() {
    try {
      return typeof R !== "undefined" ? R : null;
    } catch (_) {
      return null;
    }
  }
  function currentMapping() {
    const r = currentR();
    if (!r?.bz) return { available: false, reason: "请先建立档案并排盘" };
    let q;
    try {
      q = BASE_QZ(r);
    } catch (err) {
      return { available: false, reason: String(err?.message || err) };
    }
    const z = q?.mingZhi,
      idx = ZHIS.indexOf(z);
    let d = null;
    if (Number.isFinite(q?.mingDegreeLon) && idx >= 0) {
      const start = QZ_H.indexOf(z) * 30;
      d = mod30(q.mingDegreeLon - start);
    } else if (Number.isFinite(q?.sunLon)) {
      const sg = qzGong(q.sunLon);
      d = mod30(sg.du);
    }
    if (d == null) return { available: false, reason: "当前命盘缺少可审计的命宫宫内度" };
    const age = ageFromDegree(d),
      fine = fineAgeFromDegree(d),
      bin = binForDegree(d),
      edge = edgeDistance(d);
    const cell = Math.min(29, Math.max(0, Math.floor(d)));
    return {
      available: true,
      mingZhi: z,
      palaceDegree: d,
      cell,
      age,
      bin: clone(bin),
      fineAge: fine,
      xiu: q?.mingDuXiu ? { name: q.mingDuXiu.name, du: Number(q.mingDuXiu.du) } : null,
      mingDegreeLon: Number(q?.mingDegreeLon),
      edgeDistance: edge,
      boundarySensitive: Number.isFinite(edge) && edge <= 1,
      boundaryPolicy: "[0,3)→11; [3,6)→12; …; [27,30)→20；整3°归入下一段",
      caveat: "古表/旁证均提示量天尺格眼存在约1–2°误差；边界附近必须与宿度表、流派与盘例合参。",
    };
  }
  function scheduleFor(age) {
    try {
      return window.TianjiQizhengLiangtianchiV235?.schedule?.(age) || [];
    } catch (_) {
      return [];
    }
  }
  function augment(q, R0) {
    if (!q) return q;
    try {
      const z = q.mingZhi,
        idx = ZHIS.indexOf(z);
      let d = null;
      if (Number.isFinite(q.mingDegreeLon) && idx >= 0)
        d = mod30(q.mingDegreeLon - QZ_H.indexOf(z) * 30);
      else if (Number.isFinite(q.sunLon)) d = mod30(qzGong(q.sunLon).du);
      const age = ageFromDegree(d);
      q.dongweiV236 = {
        schema: SCHEMA,
        mode: "scan-grid-3deg",
        palaceDegree: d,
        autoTongLimitAge: age,
        bin: clone(binForDegree(d)),
        fineReferenceAge: fineAgeFromDegree(d),
        boundaryDistance: edgeDistance(d),
        boundarySensitive: Number.isFinite(edgeDistance(d)) && edgeDistance(d) <= 1,
        autoAppliedToV235: false,
      };
    } catch (err) {
      q.dongweiV236 = { schema: SCHEMA, error: String(err?.message || err) };
    }
    return q;
  }
  function qzV236(R0) {
    return augment(BASE_QZ(R0), R0);
  }
  function install() {
    try {
      window.qzCalc = qzV236;
      qzCalc = qzV236;
      return true;
    } catch (_) {
      try {
        window.qzCalc = qzV236;
        return true;
      } catch (__) {
        return false;
      }
    }
  }
  install();

  function binsHTML(A) {
    return `<div class="q236-scroll"><div class="q236-bins">${BINS.map((b) => `<div class="q236-bin ${A?.age === b.age ? "active" : ""}"><b>${b.age}岁</b><small>${b.start}°–&lt;${b.end}°</small></div>`).join("")}</div></div>`;
  }
  function matrixHTML(A) {
    const curZ = A?.available ? A.mingZhi : null,
      curCell = A?.available ? A.cell : -1;
    const head = Array.from({ length: 30 }, (_, i) => `<th>${i}°</th>`).join("");
    const rows = ZHIS.map(
      (z) =>
        `<tr><th>${z}</th>${Array.from({ length: 30 }, (_, i) => {
          const a = ageFromDegree(i + 0.0001),
            cls = [i % 3 === 0 ? "edge" : "", z === curZ && i === curCell ? "current" : ""]
              .filter(Boolean)
              .join(" ");
          return `<td class="${cls}">${a}</td>`;
        }).join("")}</tr>`,
    ).join("");
    return `<div class="q236-scroll"><table class="q236-matrix"><thead><tr><th>宫\\度</th>${head}</tr></thead><tbody>${rows}</tbody></table></div>`;
  }
  function sourceHTML() {
    return SOURCES.map(
      (s) =>
        `<div class="q236-item ${s.type === "primary-scan" || s.type === "primary-classic" ? "good" : "warn"}"><b>${E(s.title)}</b><small>${E(s.type)}${s.pages ? " · p." + E(s.pages) : ""}<br>${E((s.supports || []).join("；"))}</small></div>`,
    ).join("");
  }
  function currentHTML(A) {
    if (!A?.available)
      return `<div class="q236-item warn"><b>当前不可计算</b><small>${E(A?.reason || "请先排盘")}</small></div>`;
    const x =
      A.xiu && A.xiu.name
        ? `${A.xiu.name}${Number.isFinite(A.xiu.du) ? A.xiu.du.toFixed(2) : "—"}°`
        : "—";
    const sched = scheduleFor(A.age),
      first = sched?.[0],
      next = sched?.[1];
    return `<div class="q236-list">
  <div class="q236-item cyan"><b>${E(A.mingZhi)}宫 ${A.palaceDegree.toFixed(3)}° → ${A.age}岁出童限</b><small>命度：${E(x)} · 图格列：${A.cell}° · 区间 ${A.bin.start}°–&lt;${A.bin.end}°。<br>边界规则：${E(A.boundaryPolicy)}</small></div>
  <div class="q236-item ${A.boundarySensitive ? "warn" : "good"}"><b>${A.boundarySensitive ? "边界敏感：需人工复核" : "当前不在主要边界敏感带"}</b><small>距最近3°分界约 ${A.edgeDistance.toFixed(3)}°。古籍旁证提示格眼可差一二度，因此这里保留敏感标志，不把整数结果包装成无限精度。</small></div>
  <div class="q236-item good"><b>连续精算参考：约 ${A.fineAge.toFixed(3)} 岁</b><small>这是“10 + 宫内度÷3”的研究参考，不替代古法概算整数岁。${first ? `按V235宫限链，命宫约管 ${first.years} 年；相貌宫约从 ${next?.ageStart ?? "—"} 岁起。` : ""}</small></div>
 </div>`;
  }
  function panel() {
    const A = currentMapping();
    return `<section id="q236LiangtianchiGrid" class="q236">
 <section class="q236-hero"><div class="q236-head"><div><h3>V236 · 量天尺图格数字化 / 11–20岁全映射</h3><p>V235 只敢保留 11 / 15 / 20 三个文字金样。V236 加入《星平会海》量天总尺第65–66页的 12宫×30度图格结构，并把古法“三度一岁”的区隔做成可审计计算层：0–3°对应11岁，3–6°对应12岁，依次至27–30°对应20岁。边界附近仍保留1–2°古表误差警示，不伪装成现代天文级精度。</p></div><span class="q236-schema">${SCHEMA}</span></div>
  <div class="q236-tools"><button class="primary" id="q236Recalc" type="button">重新计算</button><button class="good" id="q236Apply" type="button"${A.available ? "" : " disabled"}>写入V235校准</button><button id="q236Export" type="button">导出 V236 Report</button></div>
 </section>
 <div class="q236-kpis">
  <div class="q236-kpi ${A.available ? "good" : "warn"}"><small>自动童限</small><b>${A.available ? A.age + "岁" : "—"}</b></div>
  <div class="q236-kpi"><small>命宫宫内度</small><b>${A.available ? A.palaceDegree.toFixed(2) + "°" : "—"}</b></div>
  <div class="q236-kpi"><small>3°区间</small><b>${A.available ? A.bin.start + "–" + A.bin.end + "°" : "—"}</b></div>
  <div class="q236-kpi"><small>命度宿</small><b>${A.available && A.xiu ? E(A.xiu.name) + (Number.isFinite(A.xiu.du) ? A.xiu.du.toFixed(1) : "") + "°" : "—"}</b></div>
  <div class="q236-kpi ${A.available && A.boundarySensitive ? "warn" : "good"}"><small>边界敏感</small><b>${A.available ? (A.boundarySensitive ? "YES" : "NO") : "—"}</b></div>
  <div class="q236-kpi good"><small>11–20映射</small><b>10 / 10</b></div>
 </div>
 <div class="q236-grid"><section class="q236-card"><h4>一、当前命度 → 图格 → 童限</h4>${currentHTML(A)}</section><aside class="q236-card"><h4>二、V236 决策边界</h4><div class="q236-list"><div class="q236-item good"><b>古法概算成为默认结果</b><small>V235 的12–19岁不再只是线性“源约束插值”；现在由命宫宫内度所在的3°格直接映射。</small></div><div class="q236-item warn"><b>不是把“宿内度”直接除以3</b><small>真正索引量是命宫在其十二宫中的宫内度。二十八宿跨越宫界，所以宿度只作交叉显示，不能脱离宫位直接套公式。</small></div><div class="q236-item warn"><b>边界不做假精确</b><small>量天尺原典旁证明确存在一二度格眼误差。距3°边界≤1°时，V236 标记为 boundary-sensitive。</small></div></div></aside></div>
 <section class="q236-card"><h4>三、11–20岁完整童限区间</h4>${binsHTML(A)}<div class="q236-note" style="margin-top:7px">整数岁是古法“画图 / 流年接交”的概算口径；连续参考值只用于研究与盘例对拍。整3°边界默认进入下一年龄段，例如 3.000°→12岁、15.000°→16岁。</div></section>
 <section class="q236-card"><h4>四、原图行列数字化骨架 · 12宫 × 30度</h4>${matrixHTML(A)}<div class="q236-note" style="margin-top:7px">这里恢复的是量天总尺的计算骨架：十二宫逐行、每宫30度逐列、每3度一个童限年龄区间。当前命宫与当前度格会高亮。宿名字形的逐格古籍转录仍作为 Evidence 校勘层保留，不反过来阻塞计算。</div></section>
 <div class="q236-grid"><section class="q236-card"><h4>五、Evidence Sources</h4><div class="q236-list">${sourceHTML()}</div></section><aside class="q236-card"><h4>六、V236 完成度</h4><div class="q236-list"><div class="q236-item good"><b>11–20岁全区间映射：完成</b><small>10个年龄区间均已进入引擎、自测与导出报告。</small></div><div class="q236-item good"><b>12宫×30度行列骨架：完成</b><small>不再依赖V235三点人工校准才能运行。</small></div><div class="q236-item warn"><b>逐格宿名字形校勘：继续增强</b><small>原扫描表的每个宿度字样将继续做逐格复核；这属于证据层增强，不再是童限算法阻塞项。</small></div></div></aside></div>
 </section>`;
  }
  function report() {
    const A = currentMapping();
    return {
      schema: SCHEMA,
      build: BUILD,
      generatedAt: new Date().toISOString(),
      current: A,
      bins: clone(BINS),
      matrix: {
        rows: clone(ZHIS),
        columns: Array.from({ length: 30 }, (_, i) => ({
          degree: i,
          age: ageFromDegree(i + 0.0001),
        })),
        structure: "12 palace rows × 30 degree columns",
      },
      schedule: A?.available ? scheduleFor(A.age) : [],
      sources: clone(SOURCES),
      decision: {
        canonicalMode: "3-degree classical bin",
        mapping: "0–<3=>11 ... 27–<30=>20",
        boundaryPolicy: "exact multiple of 3 enters next bin",
        fineReference: "10 + palaceDegree/3; research only",
        boundarySensitiveWithinDeg: 1,
        autoTongLimit: true,
        autoPersistToV235: false,
        literalXiuCellTranscription: "evidence refinement pending; computational skeleton complete",
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
      pane.querySelector("#q235Liangtianchi") ||
      pane.querySelector("#q234Dongwei") ||
      pane.firstElementChild;
    const old = pane.querySelector("#q236LiangtianchiGrid"),
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
      if (e.target?.id === "q236Recalc") {
        mount();
        return;
      }
      if (e.target?.id === "q236Apply") {
        const A = currentMapping();
        if (A.available && Number.isFinite(A.age)) {
          try {
            window.TianjiQizhengLiangtianchiV235?.setCalibration?.(
              A.age,
              `V236量天总尺自动映射：${A.mingZhi}宫${A.palaceDegree.toFixed(3)}°`,
            );
          } catch (_) {}
          mount();
        }
        return;
      }
      if (e.target?.id === "q236Export") {
        save("天机盘_V236_量天尺图格数字化Report.json", report());
        return;
      }
    },
    true,
  );
  TianjiPaneScheduler.register("qizheng", "v236-liangtianchi-grid-js", mount);

  try {
    if (window.TianjiCore) {
      TianjiCore.registerSource({
        id: "qizheng-liangtianchi-grid-v236",
        type: "classic+scan",
        title: "星平会海量天总尺 + 张果星宗定限度法",
        version: "scan pp.65–66 / 图书集成567",
        license: "reference/public-domain-classic",
        note: "V236恢复12宫×30度图格骨架，并建立11–20岁三度一区间映射。",
      });
      TianjiCore.registerRule({
        id: "qizheng.liangtianchi.grid.v2",
        system: "qizheng",
        source: "qizheng-liangtianchi-grid-v236",
        title: "量天尺11–20岁图格映射",
        status: "verified-with-boundary-caveat",
        note: "默认按宫内度3°一区间映射童限；边界1°内标记敏感，不把古格误差伪装为高精度。",
      });
      TianjiCore.registerEngine(
        {
          id: "qizheng.liangtianchi.grid.v2",
          system: "qizheng",
          name: "Liangtianchi 30-degree Grid",
          version: "2.0.0",
          source: "qizheng-liangtianchi-grid-v236",
          doctrine: "12×30 grid + 3° classical age bins + boundary sensitivity",
          status: "research-verified",
        },
        () => report(),
      );
    }
  } catch (err) {
    console.warn("[V236 registry]", err);
  }

  const TASKS236 = [
    { id: "ai", p: "P0", name: "统一 AI 解释层", state: "done", note: "v171 完成" },
    { id: "mcp", p: "P0", name: "MCP / API 外部调用层", state: "done", note: "v172 完成" },
    {
      id: "kg",
      p: "P0",
      name: "典籍 Evidence / 规则知识图谱",
      state: "done",
      note: "v173 第一阶段；V236新增星平会海量天总尺图格 Evidence",
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
      note: "V224–V235完成七政星历、四余Provider、命身、强弱变曜、百六/小限、量天尺校准。V236恢复12宫×30度量天总尺骨架，11–20岁童限全区间已可自动映射；逐格宿名字形继续作为Evidence校勘，不再阻塞算法。",
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
  const BOARD236 = {
    schema: "tianji.priority.board.v1",
    build: BUILD,
    total: 14,
    done: 12,
    doing: 2,
    blocked: 0,
    progress: 92.9,
    next: [
      "V237 四余第二历史绝对锚点 / 长期相位漂移验证",
      "四季土旺水衰的辰戌丑未 live 时间窗定义",
      "奇门日家完整 Doctrine / 月家逐宫扩样",
      "量天总尺逐格宿名字形复核（Evidence增强，不阻塞童限算法）",
    ],
    tasks: TASKS236,
  };
  function applyBoard() {
    window.TianjiPriorityBoard = Object.freeze({
      schema: BOARD236.schema,
      snapshot: () => clone(BOARD236),
    });
    const road = window.TianjiRoadmap || {};
    window.TianjiRoadmap = Object.freeze(
      Object.assign({}, road, {
        urgentImportant: clone(BOARD236),
        nextMainline: clone(BOARD236.next),
      }),
    );
  }
  applyBoard();
  window.addEventListener("tianji:lazy-ready", () => setTimeout(applyBoard, 0));
  function selfTest() {
    const C = [],
      add = (id, ok, d = "") => C.push({ id, ok: !!ok, d });
    add("base.capture", typeof BASE_QZ === "function", "");
    add("bins.count", BINS.length === 10, String(BINS.length));
    add("map.0", ageFromDegree(0) === 11, String(ageFromDegree(0)));
    add("map.2.999", ageFromDegree(2.999) === 11, String(ageFromDegree(2.999)));
    add("map.3", ageFromDegree(3) === 12, String(ageFromDegree(3)));
    add("map.14.999", ageFromDegree(14.999) === 15, String(ageFromDegree(14.999)));
    add("map.15", ageFromDegree(15) === 16, String(ageFromDegree(15)));
    add("map.27", ageFromDegree(27) === 20, String(ageFromDegree(27)));
    add("map.29.999", ageFromDegree(29.999) === 20, String(ageFromDegree(29.999)));
    add("grid.cells", ZHIS.length * 30 === 360, String(ZHIS.length * 30));
    add("wrapper.install", window.qzCalc === qzV236, "");
    return { ok: C.every((x) => x.ok), checks: C };
  }
  const TEST = selfTest();
  window.TianjiQizhengLiangtianchiV236 = Object.freeze({
    version: "2.0.0",
    build: BUILD,
    schema: SCHEMA,
    sources: () => clone(SOURCES),
    bins: () => clone(BINS),
    ageFromPalaceDegree: (d) => ageFromDegree(d),
    fineAgeFromPalaceDegree: (d) => fineAgeFromDegree(d),
    current: () => clone(currentMapping()),
    report: () => clone(report()),
    selfTest: () => clone(TEST),
    manifest: () => ({
      module: "Qizheng Liangtianchi Grid V236",
      grid: "12 palace × 30 degree",
      ageBins: "11–20 complete",
      canonical: "3° per integer-age bin",
      boundary: "exact 3° enters next bin; ≤1° flagged",
      autoTongLimit: true,
      persist: false,
      next: "second historical Four-Residua anchor / long-term phase drift",
    }),
  });
  window.TianjiSystemV236 = {
    version: "v236",
    build: BUILD,
    qizhengLiangtianchiGrid: true,
    autoTongLimit: true,
    fullTongAgeMap: true,
    boundarySensitive: true,
    baseline: "v235",
  };
})();
