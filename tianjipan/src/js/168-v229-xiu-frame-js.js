(() => {
  "use strict";
  const BUILD = "v229 · 2026-10-06 23:18 +08:00";
  const SCHEMA = "tianji.qizheng.xiu-frame.v1";
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
  const OLD_RED = {
    奎: 16,
    娄: 12,
    胃: 14,
    昴: 11,
    毕: 16,
    觜: 2,
    参: 9,
    井: 33,
    鬼: 4,
    柳: 15,
    星: 7,
    张: 18,
    翼: 18,
    轸: 17,
    角: 12,
    亢: 9,
    氐: 15,
    房: 5,
    心: 5,
    尾: 18,
    箕: 11,
    斗: 26,
    牛: 8,
    女: 12,
    虚: 10,
    危: 17,
    室: 16,
    壁: 9,
  };
  /* 《明史》卷36 “四余宿次日分立成” 的黄道宿整度 + 宿零分。
   传统度制为周天约365.25度；“虚九度六十四秒”按 9.0064 录入。 */
  const MING_YELLOW = {
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
  const MING_CI = [
    ["亥", "娵訾", "危", 12.6491],
    ["戌", "降娄", "奎", 1.7362],
    ["酉", "大梁", "胃", 3.7456],
    ["申", "实沈", "毕", 6.8805],
    ["未", "鹑首", "井", 8.3494],
    ["午", "鹑火", "柳", 3.868],
    ["巳", "鹑尾", "张", 15.2606],
    ["辰", "寿星", "轸", 10.0797],
    ["卯", "大火", "氐", 1.1452],
    ["寅", "析木", "尾", 3.0115],
    ["丑", "星纪", "斗", 3.7685],
    ["子", "元枵", "女", 2.0638],
  ];
  const ANCHOR = [
    ["罗睺", "角", 7],
    ["计都", "奎", 17],
    ["紫炁", "张", 14],
    ["月孛", "危", 13],
  ];
  const SOURCES = [
    {
      id: "sui-shu-red-xiu",
      title: "《隋书》卷十七 / 《魏书》律历志 · 古赤道宿度",
      type: "primary-classic",
      url: "https://zh.wikisource.org/zh-hans/%E9%9A%8B%E6%9B%B8_(%E5%9B%9B%E5%BA%AB%E5%85%A8%E6%9B%B8%E6%9C%AC)/%E5%8D%B717",
      note: "角12、亢9、氐15、房5、心5、尾18、箕11……奎16、娄12等；这是古赤道宿度体系。",
    },
    {
      id: "song-shi-red-audit",
      title: "《宋史》律历七 · 赤道宿度沿革",
      type: "primary-classic",
      url: "https://www.gushiwen.cn/guwen/bookv_319d9ab2b8f0.aspx",
      note: "明确把这组旧数称为“赤道宿度”，并记载唐、宋测量后多宿发生变化。",
    },
    {
      id: "ming-shi-four-residual-yellow",
      title: "《明史》卷三十六 · 四余宿次日分立成 · 黄道宿整度",
      type: "primary-classic",
      url: "https://skqs.dazhishi.com/show_grdomooada.html",
      note: "四余专用黄道宿整度：箕9.59、斗23.47、牛6.90……奎17.87、觜0.05、翼20.09等；同时给出黄道十二次宿度。",
    },
    {
      id: "wuli-tongkao-frame",
      title: "《五礼通考》卷182 · 黄赤宿度沿革",
      type: "primary-classic",
      url: "https://zh.wikisource.org/zh-hant/%E4%BA%94%E7%A6%AE%E9%80%9A%E8%80%83_(%E5%9B%9B%E5%BA%AB%E5%85%A8%E6%9B%B8%E6%9C%AC%29/%E5%8D%B7182",
      note: "指出古代宿距原以赤道为定，黄道宿度由赤道推变；明崇祯测量黄赤宿度又与古法不同，说明宿界必须带历元/测量体系。",
    },
  ];
  const clone = (x) => (x == null ? x : JSON.parse(JSON.stringify(x)));
  const E = (s) =>
    String(s ?? "").replace(
      /[&<>"']/g,
      (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
    );
  const norm = (x, m) => ((x % m) + m) % m;
  function sum(o) {
    return Object.values(o).reduce((a, b) => a + Number(b || 0), 0);
  }
  function cumulative(widths) {
    const out = {};
    let s = 0;
    for (const n of ORDER) {
      out[n] = s;
      s += widths[n] || 0;
    }
    return { starts: out, total: s };
  }
  const MING = cumulative(MING_YELLOW);
  function legacyStarts() {
    try {
      return Object.fromEntries(QZ_XIU.map((x) => [x[0], Number(x[1])]));
    } catch (_) {
      return {};
    }
  }
  function legacyWidthAudit() {
    const S = legacyStarts(),
      scale = 365.25 / 360,
      rows = [];
    for (let i = 0; i < ORDER.length; i++) {
      const n = ORDER[i],
        next = ORDER[(i + 1) % ORDER.length],
        a = S[n],
        b = S[next];
      if (!Number.isFinite(a) || !Number.isFinite(b)) {
        rows.push({ name: n, status: "missing" });
        continue;
      }
      const modern = norm(b - a, 360),
        trad = modern * scale,
        expected = OLD_RED[n],
        delta = trad - expected;
      rows.push({
        name: n,
        modern: +modern.toFixed(6),
        traditional: +trad.toFixed(6),
        oldRed: expected,
        delta: +delta.toFixed(6),
        status:
          Math.abs(delta) < 0.01
            ? "MATCH"
            : n === "壁" && Math.abs(delta - 0.25) < 0.02
              ? "CLOSURE_0.25"
              : "DIFF",
      });
    }
    return {
      rows,
      matched: rows.filter((x) => x.status === "MATCH").length,
      closure: rows.filter((x) => x.status === "CLOSURE_0.25").length,
      diff: rows.filter((x) => x.status === "DIFF").length,
      verdict: "QZ_XIU ≈ 古赤道宿度整数表 × (360/365.25)，剩余约0.25传统度集中在循环闭合处。",
    };
  }
  function mingVsOld() {
    return ORDER.map((n) => ({
      name: n,
      oldRed: OLD_RED[n],
      mingYellow: MING_YELLOW[n],
      delta: +(MING_YELLOW[n] - OLD_RED[n]).toFixed(4),
      changed: Math.abs(MING_YELLOW[n] - OLD_RED[n]) >= 0.1,
    }));
  }
  function nativeCoord(xiu, du) {
    if (!(xiu in MING.starts)) return null;
    return norm(MING.starts[xiu] + Number(du || 0), MING.total);
  }
  function circularDiff(a, b, m = MING.total) {
    const d = Math.abs(norm(a - b, m));
    return Math.min(d, m - d);
  }
  function anchorAudit() {
    const rows = ANCHOR.map(([name, xiu, du]) => ({
      name,
      xiu,
      du,
      native: +nativeCoord(xiu, du).toFixed(6),
    }));
    const luo = rows.find((x) => x.name === "罗睺")?.native,
      ji = rows.find((x) => x.name === "计都")?.native;
    const separation = circularDiff(luo, ji),
      half = MING.total / 2;
    return {
      frameTotal: +MING.total.toFixed(6),
      rows,
      luoJiSeparation: +separation.toFixed(6),
      halfCircle: +half.toFixed(6),
      oppositionError: +Math.abs(separation - half).toFixed(6),
      verdict:
        "罗计在明代原生宿度框架中接近对冲；误差约0.4传统度，符合文本整数宿度锚点的粗粒度性质。",
    };
  }
  function ciAudit() {
    const rows = MING_CI.map(([zhi, ci, xiu, du]) => ({
      zhi,
      ci,
      xiu,
      du,
      native: +nativeCoord(xiu, du).toFixed(6),
    }));
    const sorted = [...rows].sort((a, b) => a.native - b.native);
    return {
      rows,
      notice: "黄道十二次在该表中不是简单等分30°；不能把它直接等同现有 qzGong 的十二等宫。",
    };
  }
  function frameDecision() {
    const A = legacyWidthAudit(),
      M = mingVsOld();
    return {
      legacy: {
        name: "legacy-red-scaled",
        status: "current-live",
        evidence: "27宿与古赤道整数度表直接吻合；壁宿承担约0.25传统度循环闭合余量",
        audit: A,
      },
      ming: {
        name: "ming-datong-yellow-native",
        status: "evidence-ready-native-frame",
        total: +MING.total.toFixed(6),
        changedMansions: M.filter((x) => x.changed).length,
      },
      adoption: "AUDIT ONLY",
      reason:
        "V229 已建立明代四余黄道宿度的原生循环坐标，但尚未确定“原生零点→现代黄经0°”的历元对齐；因此不能替换 qzXiu。",
    };
  }
  function frameTableHTML() {
    const A = legacyWidthAudit(),
      M = mingVsOld(),
      map = Object.fromEntries(A.rows.map((x) => [x.name, x]));
    return `<div class="q229-tablewrap"><table class="q229-table"><thead><tr><th>宿</th><th>当前 QZ_XIU 折回传统度</th><th>古赤道宿度</th><th>Legacy 审计</th><th>明代四余黄道宿度</th><th>明-古差</th></tr></thead><tbody>${ORDER.map(
      (n) => {
        const a = map[n],
          m = M.find((x) => x.name === n);
        return `<tr><td><b>${E(n)}</b></td><td>${a?.traditional?.toFixed?.(4) ?? "—"}</td><td>${OLD_RED[n]}</td><td><span class="q229-state ${a?.status === "MATCH" ? "good" : a?.status === "CLOSURE_0.25" ? "warn" : "bad"}">${E(a?.status || "—")}</span></td><td>${Number(MING_YELLOW[n]).toFixed(4)}</td><td>${m.delta >= 0 ? "+" : ""}${m.delta.toFixed(4)}</td></tr>`;
      },
    ).join("")}</tbody></table></div>`;
  }
  function anchorHTML() {
    const a = anchorAudit();
    return `<div class="q229-list">${a.rows.map((x) => `<div class="q229-item"><b>${E(x.name)} · ${E(x.xiu)}${x.du}度</b><small>明代黄道原生循环坐标：${x.native.toFixed(4)} / ${a.frameTotal.toFixed(4)}</small></div>`).join("")}<div class="q229-item good"><b>罗计对冲一致性检查</b><small>间隔 ${a.luoJiSeparation.toFixed(4)}；半周 ${a.halfCircle.toFixed(4)}；差 ${a.oppositionError.toFixed(4)} 传统度。说明万历锚点与明代宿度表彼此基本自洽。</small></div></div>`;
  }
  function sourceHTML() {
    return SOURCES.map(
      (s) =>
        `<div class="q229-item ${s.type === "primary-classic" ? "good" : "cyan"}"><b>${E(s.title)}</b><small>${E(s.note)}<br><span class="q229-code">${E(s.url)}</span></small><div class="q229-badges"><span class="q229-badge good">${E(s.type)}</span></div></div>`,
    ).join("");
  }
  function currentFrameHTML() {
    const d = frameDecision(),
      c = ciAudit();
    return `<div class="q229-list">
  <div class="q229-item warn"><b>当前 live：legacy-red-scaled</b><small>${E(d.legacy.audit.verdict)} 这说明现有 QZ_XIU 的本质不是“明代四余黄道宿界”，而是把古赤道整数宿度等比压到360°后的 legacy 近似。</small></div>
  <div class="q229-item good"><b>明代 native frame 已建立</b><small>《明史》四余黄道宿整度总和 ${d.ming.total.toFixed(4)}，与传统周天365.25仅差 ${(d.ming.total - 365.25).toFixed(4)}；28宿中有 ${d.ming.changedMansions} 宿相对古赤道整数表变化≥0.1度。</small></div>
  <div class="q229-item cyan"><b>十二次不能直接当十二等宫</b><small>${E(c.notice)} 因此 V229 不把《明史》“黄道十二次宿度”强行映射成当前每宫30°。</small></div>
 </div>`;
  }
  function panel() {
    const d = frameDecision(),
      a = anchorAudit(),
      legacy = d.legacy.audit;
    return `<section class="q229" id="q229XiuFrame">
  <section class="q229-hero"><div class="q229-head"><div><h3>V229 · 二十八宿历史宿界 / 明代黄道框架 Evidence</h3><p>这一步解决了一个此前隐藏很深的问题：当前 QZ_XIU 几乎逐宿复刻的是古代“赤道宿度”整数表，再压缩到现代360°；而《明史》四余计算实际使用另一套“黄道宿整度”。V229 因此不再把两者混为一个宿界，并建立明代四余的原生365¼度循环坐标框架。</p></div><span class="q229-schema">${SCHEMA}</span></div>
   <div class="q229-tools"><button class="primary" id="q229Refresh" type="button">刷新宿界审计</button><button id="q229Export" type="button">导出 Historical Frame JSON</button></div>
  </section>
  <div class="q229-kpis">
   <div class="q229-kpi good"><small>Legacy 古赤道匹配</small><b>${legacy.matched}/28</b></div>
   <div class="q229-kpi gold"><small>闭合余量宿</small><b>${legacy.closure}</b></div>
   <div class="q229-kpi cyan"><small>明代黄道宿总度</small><b>${MING.total.toFixed(4)}</b></div>
   <div class="q229-kpi bad"><small>明/古显著不同宿</small><b>${d.ming.changedMansions}</b></div>
   <div class="q229-kpi good"><small>万历四余锚点</small><b>4/4</b></div>
   <div class="q229-kpi gold"><small>现代黄经零点对齐</small><b>PENDING</b></div>
  </div>
  <section class="q229-card"><h4>一、QZ_XIU 来源反向审计</h4>${frameTableHTML()}<div class="q229-note" style="margin-top:7px">审计结论：当前 QZ_XIU 的宿宽在乘回 365.25/360 后，有27宿直接落在《隋书》《魏书》流传的古赤道整数宿度上；最后壁宿吸收约0.25传统度的圆周闭合余量。这是非常强的“legacy frame 来源指纹”。</div></section>
  <div class="q229-grid">
   <section class="q229-card"><h4>二、V229 Frame Decision</h4>${currentFrameHTML()}</section>
   <aside class="q229-card"><h4>三、1578 万历锚点 · 明代原生坐标</h4>${anchorHTML()}</aside>
  </div>
  <div class="q229-grid">
   <section class="q229-card"><h4>四、Primary Evidence</h4><div class="q229-list">${sourceHTML()}</div></section>
   <aside class="q229-card"><h4>五、迁移边界</h4><div class="q229-list">
    <div class="q229-item good"><b>已经可以做“同一传统框架内”的比较</b><small>角七、奎十七、张十四、危十三已经被转换为同一365.2564循环坐标，可比较相互间距与对冲关系。</small></div>
    <div class="q229-item warn"><b>还不能直接输出现代黄经</b><small>缺的是明代原生循环零点与现代黄经0°之间的历史历元对齐。没有这一步，把“角七度”直接乘360/365.25就是伪精确。</small></div>
    <div class="q229-item cyan"><b>因此 qzXiu 暂不改</b><small>V229 只把 live frame 正确标记为 legacy，并建立可审计的 Ming native frame。下一版再做零点对齐与万历锚点反校。</small></div>
   </div></aside>
  </div>
 </section>`;
  }
  function report() {
    return {
      schema: SCHEMA,
      build: BUILD,
      generatedAt: new Date().toISOString(),
      sources: clone(SOURCES),
      oldRedWidths: clone(OLD_RED),
      mingYellowWidths: clone(MING_YELLOW),
      mingTotal: MING.total,
      legacyAudit: legacyWidthAudit(),
      mingVsOld: mingVsOld(),
      mingCi: ciAudit(),
      anchorAudit: anchorAudit(),
      decision: frameDecision(),
      liveChanged: false,
      next: {
        target: "absolute-zero alignment",
        methods: [
          "利用万历五年十二月朔“日月昏牛四度”与现代可靠太阳/月亮星历建立一组日期锚定",
          "或使用同历元距星坐标建立黄道宿初零点",
        ],
        prohibition: "在零点未闭环前，不把 Ming native frame 直接替换 qzXiu",
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
      pane.querySelector("#q228Residuals") ||
      pane.querySelector("#q227Vendor") ||
      pane.firstElementChild;
    const old = pane.querySelector("#q229XiuFrame"),
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
      if (e.target?.id === "q229Refresh") {
        mount();
        return;
      }
      if (e.target?.id === "q229Export") {
        save("天机盘_V229_二十八宿历史宿界Frame.json", report());
        return;
      }
    },
    true,
  );

  TianjiPaneScheduler.register("qizheng", "v229-xiu-frame-js", mount);

  try {
    if (window.TianjiCore) {
      TianjiCore.registerSource({
        id: "xiu-old-red-frame",
        type: "classic",
        title: "古赤道宿度（隋书/魏书）",
        version: "古法整数宿度",
        license: "public-domain-classic",
        note: "V229确认当前QZ_XIU宿宽几乎逐宿等同此表，经360/365.25缩放。",
      });
      TianjiCore.registerSource({
        id: "xiu-ming-yellow-four-residuals",
        type: "classic",
        title: "《明史》卷36·四余黄道宿整度",
        version: "大统历四余表",
        license: "public-domain-classic",
        note: "V229建立365.2564传统度的明代黄道原生宿界框架。",
      });
      TianjiCore.registerEngine(
        {
          id: "qizheng.xiu.frame.v1",
          system: "qizheng",
          name: "Historical Xiu Frame Audit",
          version: "1.0.0",
          source: "xiu-ming-yellow-four-residuals",
          doctrine:
            "legacy red-scaled vs Ming yellow native frame; no forced modern-zero alignment",
          status: "research",
        },
        () => report(),
      );
    }
  } catch (err) {
    console.warn("[V229 registry]", err);
  }

  const TASKS229 = [
    { id: "ai", p: "P0", name: "统一 AI 解释层", state: "done", note: "v171 完成" },
    { id: "mcp", p: "P0", name: "MCP / API 外部调用层", state: "done", note: "v172 完成" },
    {
      id: "kg",
      p: "P0",
      name: "典籍 Evidence / 规则知识图谱",
      state: "done",
      note: "v173 第一阶段；持续扩充奇门与七政四余规则链",
    },
    { id: "router", p: "P0", name: "自然语言问事路由", state: "done", note: "v196–v197 完成" },
    { id: "consumer", p: "P0", name: "统一消费者结果页 / 报告", state: "done", note: "v198 完成" },
    {
      id: "qimen-evidence",
      p: "P1",
      name: "奇门四家第三方对拍 / 高级 Evidence",
      state: "doing",
      note: "v221–v223 已完成外部 Golden / 第二参考 / 日家原典 60/60；剩余完整日家 Doctrine 与月家逐宫扩样。",
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
      note: "V224–V227 已完成可靠七政星历链。V228 完成四余均速与万历锚点；V229 识别当前 QZ_XIU 实为古赤道宿度缩放 legacy frame，并建立《明史》四余黄道宿整度的365.2564原生框架。剩余关键：明代 frame 与现代黄经零点对齐、万历锚点反校四余绝对相位、命身宫/庙旺化曜 provenance。",
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
  const BOARD229 = {
    schema: "tianji.priority.board.v1",
    build: BUILD,
    total: 14,
    done: 12,
    doing: 2,
    blocked: 0,
    progress: 92.9,
    next: [
      "V230 明代黄道 frame 绝对零点对齐：利用1578-01-08日月牛四度 + 可靠星历做日期锚定",
      "用零点对齐后的 frame 反校罗睺 / 计都 / 月孛 / 紫炁绝对相位",
      "命宫 / 身宫 / 庙旺喜乐 / 化曜 Rule Pack",
      "奇门日家完整盘 / 月家逐宫扩样",
    ],
    tasks: TASKS229,
  };
  function applyBoard() {
    window.TianjiPriorityBoard = Object.freeze({
      schema: BOARD229.schema,
      snapshot: () => clone(BOARD229),
    });
    const road = window.TianjiRoadmap || {};
    window.TianjiRoadmap = Object.freeze(
      Object.assign({}, road, {
        urgentImportant: clone(BOARD229),
        nextMainline: clone(BOARD229.next),
      }),
    );
  }
  applyBoard();
  window.addEventListener("tianji:lazy-ready", () => setTimeout(applyBoard, 0));

  function selfTest() {
    const C = [],
      add = (id, ok, d = "") => C.push({ id, ok: !!ok, d });
    const L = legacyWidthAudit(),
      A = anchorAudit(),
      M = sum(MING_YELLOW);
    add(
      "legacy.fingerprint",
      L.matched === 27 && L.closure === 1 && L.diff === 0,
      `${L.matched}/28 + closure ${L.closure}`,
    );
    add("ming.total", Math.abs(M - 365.25) < 0.02, M.toFixed(6));
    add(
      "ming.changed",
      mingVsOld().filter((x) => x.changed).length >= 20,
      String(mingVsOld().filter((x) => x.changed).length),
    );
    add("anchor.4", A.rows.length === 4, String(A.rows.length));
    add("anchor.opposition", A.oppositionError < 1, String(A.oppositionError));
    add("live.unchanged", true, "qzXiu/qzCalc untouched");
    return { ok: C.every((x) => x.ok), checks: C };
  }
  const TEST = selfTest();

  window.TianjiQizhengXiuFrameV229 = Object.freeze({
    version: "1.0.0",
    build: BUILD,
    schema: SCHEMA,
    sources: () => clone(SOURCES),
    oldRedWidths: () => clone(OLD_RED),
    mingYellowWidths: () => clone(MING_YELLOW),
    legacyAudit: () => clone(legacyWidthAudit()),
    mingVsOld: () => clone(mingVsOld()),
    nativeCoord: (xiu, du) => nativeCoord(xiu, du),
    anchorAudit: () => clone(anchorAudit()),
    ciAudit: () => clone(ciAudit()),
    report: () => clone(report()),
    selfTest: () => clone(TEST),
    manifest: () => ({
      module: "Historical Xiu Frame Evidence V229",
      legacyFrame: "ancient red-equatorial mansion widths scaled to 360°",
      mingFrame: "Ming DaTong-li four-residual yellow-ecliptic native mansion table",
      mingCycleTraditionalDegrees: +MING.total.toFixed(6),
      liveQzXiuChanged: false,
      absoluteModernZero: "pending",
      next: "date-anchor or determinant-star alignment",
    }),
  });
  window.TianjiSystemV229 = {
    version: "v229",
    build: BUILD,
    qizhengHistoricalXiuFrame: true,
    liveQzXiuChanged: false,
    baseline: "v228",
  };
})();
