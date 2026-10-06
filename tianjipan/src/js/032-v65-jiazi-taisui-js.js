(() => {
  "use strict";
  const JTS_TS = "2026-10-03 23:44:38";
  const JTS_NAMES = [
    "金辨",
    "陈林",
    "耿章",
    "沈兴",
    "赵达",
    "郭灿",
    "王清",
    "李素",
    "刘旺",
    "康志",
    "施广",
    "任保",
    "郭嘉",
    "汪文",
    "曾光",
    "龙仲",
    "董德",
    "郑但",
    "陆明",
    "魏仁",
    "方查",
    "蒋崇",
    "白敏",
    "封济",
    "邹镗",
    "潘佐",
    "邬桓",
    "范宁",
    "彭泰",
    "徐单",
    "章词",
    "杨仙",
    "管仲",
    "唐查",
    "姜武",
    "谢太",
    "卢秘",
    "杨信",
    "贺谔",
    "皮时",
    "李诚",
    "吴遂",
    "文哲",
    "缪丙",
    "徐浩",
    "程宝",
    "倪秘",
    "叶坚",
    "丘德",
    "朱得",
    "张朝",
    "万清",
    "辛亚",
    "杨彦",
    "黎卿",
    "傅赏",
    "毛梓",
    "石政",
    "洪充",
    "虞程",
  ];
  const JTS_XUN = ["甲子旬", "甲戌旬", "甲申旬", "甲午旬", "甲辰旬", "甲寅旬"];
  const JTS_XK = ["戌亥", "申酉", "午未", "辰巳", "寅卯", "子丑"];
  const JTS_WX = {
    木: "var(--sem-good)",
    火: "var(--sem-bad)",
    土: "var(--sem-neutral)",
    金: "var(--gold2)",
    水: "var(--cyan)",
  };
  const JTS = {
    year: null,
    sel: null,
    play: null,
    gesture: "select",
    view: { x: -440, y: -440, w: 880, h: 880 },
    layers: { xun: 1, nayin: 1, zodiac: 1, relations: 1 },
  };
  function jtsNowYear() {
    try {
      return typeof p5NowYear === "function" ? p5NowYear() : new Date().getFullYear();
    } catch (_) {
      return new Date().getFullYear();
    }
  }
  function jtsYearIdx(y) {
    return (((y - 4) % 60) + 60) % 60;
  }
  function jtsGz(i) {
    return GAN[i % 10] + ZHI[i % 12];
  }
  function jtsYearForIdx(idx, near) {
    let y = near == null ? jtsNowYear() : near,
      cy = jtsYearIdx(y),
      d = (idx - cy + 60) % 60;
    if (d > 30) d -= 60;
    return y + d;
  }
  function jtsInfoOf(y) {
    const idx = jtsYearIdx(y),
      gi = idx % 10,
      zi = idx % 12,
      xun = Math.floor(idx / 10),
      ny = NAYIN[idx >> 1],
      wx = ny.slice(-1),
      sha = typeof p5YearSha === "function" ? p5YearSha(y) : null;
    return {
      y,
      idx,
      gi,
      zi,
      gz: jtsGz(idx),
      gan: GAN[gi],
      zhi: ZHI[zi],
      sheng:
        typeof P5_SHENG !== "undefined"
          ? P5_SHENG[zi]
          : typeof ZODIAC !== "undefined"
            ? ZODIAC[zi]
            : "",
      ny,
      wx,
      xun,
      xunName: JTS_XUN[xun],
      xk: JTS_XK[xun],
      name: JTS_NAMES[idx],
      sha,
    };
  }
  function jtsPt(r, a) {
    const q = ((a - 90) * Math.PI) / 180;
    return [r * Math.cos(q), r * Math.sin(q)];
  }
  function jtsArc(r1, r2, a0, a1) {
    let span = (a1 - a0 + 360) % 360;
    if (span === 0) span = 359.999;
    const p = (r, a) => {
      const q = jtsPt(r, a);
      return q[0].toFixed(2) + "," + q[1].toFixed(2);
    };
    return `M${p(r2, a0)} A${r2},${r2} 0 ${span > 180 ? 1 : 0} 1 ${p(r2, a1)} L${p(r1, a1)} A${r1},${r1} 0 ${span > 180 ? 1 : 0} 0 ${p(r1, a0)} Z`;
  }
  function jtsTxt(r, a, txt, cls, rot = true) {
    const p = jtsPt(r, a),
      rr = rot ? ` transform="rotate(${a} ${p[0].toFixed(1)} ${p[1].toFixed(1)})"` : "";
    return `<text x="${p[0].toFixed(1)}" y="${p[1].toFixed(1)}" class="jts-tx ${cls || ""}"${rr}>${txt}</text>`;
  }
  function jtsPerson() {
    try {
      if (typeof R !== "undefined" && R && R.bz && R.bz.pill) {
        const p = R.bz.pill[0],
          idx = ganzhiIdx(p.s, p.b);
        return { idx, zi: p.b, gz: jtsGz(idx), name: JTS_NAMES[idx], ny: NAYIN[idx >> 1] };
      }
    } catch (_) {}
    return null;
  }
  function jtsRel(S) {
    const p = jtsPerson();
    if (!p || typeof p5Fan !== "function") return [];
    try {
      return p5Fan(S.zi, p.zi) || [];
    } catch (_) {
      return [];
    }
  }
  function jtsRelCls(r) {
    if (!r || !r.length) return "mid";
    if (r.some((x) => x.tone === "xiong")) return "bad";
    if (r.some((x) => x.tone === "ji")) return "good";
    return "mid";
  }
  function jtsStop() {
    if (JTS.play) {
      clearInterval(JTS.play);
      JTS.play = null;
    }
    const b = document.getElementById("jtsPlay");
    if (b) b.textContent = "▶ 六十年演示";
  }
  function jtsSvg(S) {
    let h = "<g>";
    const sel = JTS.sel == null ? S.idx : JTS.sel;
    // 六旬外圈
    if (JTS.layers.xun) {
      for (let x = 0; x < 6; x++) {
        const a0 = x * 60,
          a1 = a0 + 60;
        h += `<path d="${jtsArc(402, 414, a0 + 0.5, a1 - 0.5)}" class="jts-xun"/>`;
        h += jtsTxt(408, a0 + 30, `${JTS_XUN[x]} · 空${JTS_XK[x]}`, "jts-xunlab", true);
      }
    }
    // 六十甲子
    for (let i = 0; i < 60; i++) {
      const a0 = i * 6,
        a1 = a0 + 6,
        cur = i === S.idx,
        on = i === sel,
        wx = "木火土金水"[GAN_WX[i % 10]];
      h += `<path d="${jtsArc(320, 394, a0 + 0.15, a1 - 0.15)}" data-jtsidx="${i}" class="jts-sec${cur ? " current" : ""}${on ? " selected" : ""}" style="fill:${JTS_WX[wx] || "var(--panel2)"};fill-opacity:${cur || on ? ".16" : ".045"}"/>`;
      h += jtsTxt(
        356,
        a0 + 3,
        jtsGz(i),
        `jts-gz${cur ? " current" : ""}${on ? " selected" : ""}`,
        true,
      );
    }
    // 纳音三十组
    if (JTS.layers.nayin) {
      for (let k = 0; k < 30; k++) {
        const a0 = k * 12,
          a1 = a0 + 12,
          ny = NAYIN[k],
          wx = ny.slice(-1);
        h += `<path d="${jtsArc(246, 316, a0 + 0.25, a1 - 0.25)}" class="jts-nayin" style="fill:${JTS_WX[wx] || "var(--panel2)"};fill-opacity:.08"/>`;
        h += jtsTxt(281, a0 + 6, ny, "jts-ny", true);
      }
    }
    // 十二生肖地支
    if (JTS.layers.zodiac) {
      for (let z = 0; z < 12; z++) {
        const a0 = z * 30,
          a1 = a0 + 30,
          active = z === S.zi;
        h += `<path d="${jtsArc(178, 242, a0 + 0.4, a1 - 0.4)}" class="jts-zodiac" style="fill:${active ? "rgba(185,45,38,.12)" : "rgba(217,178,95,.03)"}"/>`;
        h += jtsTxt(205, a0 + 15, ZHI[z], "jts-zhi", false);
        h += jtsTxt(
          228,
          a0 + 15,
          typeof P5_SHENG !== "undefined"
            ? P5_SHENG[z]
            : typeof ZODIAC !== "undefined"
              ? ZODIAC[z]
              : "",
          "jts-sheng",
          false,
        );
      }
    }
    // 指针
    const cp = jtsPt(394, S.idx * 6 + 3);
    h += `<line x1="0" y1="0" x2="${cp[0]}" y2="${cp[1]}" class="jts-pointer"/>`;
    if (sel !== S.idx) {
      const sp = jtsPt(394, sel * 6 + 3);
      h += `<line x1="0" y1="0" x2="${sp[0]}" y2="${sp[1]}" class="jts-pointer sel"/>`;
    }
    // 中心
    const O = jtsInfoOf(jtsYearForIdx(sel, S.y));
    h += `<circle r="158" class="jts-center"/><text x="0" y="-76" class="jts-tx jts-center-year">${O.y}</text><text x="0" y="-38" class="jts-tx jts-center-gz">${O.gz}</text><text x="0" y="-4" class="jts-tx jts-center-name">${O.name}大将军</text><text x="0" y="27" class="jts-tx jts-center-sm">${O.sheng} · ${O.ny} · ${O.xunName}</text><text x="0" y="47" class="jts-tx jts-center-sm">旬空 ${O.xk} · 第 ${O.idx + 1} 位</text><text x="0" y="72" class="jts-tx jts-center-sm">${sel === S.idx ? "当前流年" : "当前选中甲子"} · 太岁名录采用常见版本</text>`;
    return h + "</g>";
  }
  function jtsView() {
    const s = document.getElementById("jtsSvg");
    if (!s) return;
    const v = JTS.view;
    s.setAttribute("viewBox", `${v.x} ${v.y} ${v.w} ${v.h}`);
    const z = document.getElementById("jtsZoom");
    if (z) z.textContent = Math.round((880 / v.w) * 100) + "%";
  }
  function jtsFit() {
    JTS.view = { x: -440, y: -440, w: 880, h: 880 };
    jtsView();
  }
  function jtsZoomAt(f, cx, cy) {
    const s = document.getElementById("jtsSvg");
    if (!s) return;
    const r = s.getBoundingClientRect(),
      v = JTS.view,
      p = { x: v.x + ((cx - r.left) / r.width) * v.w, y: v.y + ((cy - r.top) / r.height) * v.h },
      nw = Math.max(270, Math.min(1900, v.w * f)),
      k = nw / v.w;
    v.x = p.x - (p.x - v.x) * k;
    v.y = p.y - (p.y - v.y) * k;
    v.w = nw;
    v.h = nw;
    jtsView();
  }
  function jtsSound() {
    try {
      if (typeof STU !== "undefined" && STU.sfx && typeof stuSfxTick === "function")
        stuSfxTick(0.38, false, 1, 0.5);
    } catch (_) {}
  }
  function jtsSetYear(y, sound = true) {
    JTS.year = Math.max(1804, Math.min(2203, Math.round(+y || jtsNowYear())));
    JTS.sel = jtsYearIdx(JTS.year);
    jtsRender(sound);
  }
  function jtsPlay() {
    if (JTS.play) {
      jtsStop();
      return;
    }
    JTS.play = setInterval(() => {
      let y = (JTS.year || jtsNowYear()) + 1;
      if (y > 2203) y = 1804;
      jtsSetYear(y, true);
    }, 650);
    const b = document.getElementById("jtsPlay");
    if (b) b.textContent = "■ 停止演示";
  }
  function jtsInfo(S) {
    const box = document.getElementById("jtsInfo");
    if (!box) return;
    const sel = JTS.sel == null ? S.idx : JTS.sel,
      O = jtsInfoOf(jtsYearForIdx(sel, S.y)),
      P = jtsPerson(),
      rels = JTS.layers.relations ? jtsRel(S) : [],
      rcls = jtsRelCls(rels);
    const sha = S.sha;
    box.innerHTML = `<h4>值年读数</h4>
  <div class="jts-hero">
    <div class="jts-kpi"><small>流年</small><b class="red">${S.y} · ${S.gz}</b></div>
    <div class="jts-kpi"><small>值年太岁</small><b>${S.name}</b></div>
    <div class="jts-kpi"><small>纳音</small><b>${S.ny}</b></div>
    <div class="jts-kpi"><small>旬 / 空亡</small><b>${S.xunName} · ${S.xk}</b></div>
  </div>
  <div class="jts-facts">
    <span>六十甲子序位</span><b>第 ${S.idx + 1} 位</b>
    <span>天干 / 地支</span><b>${S.gan} · ${S.zhi}</b>
    <span>干支五行</span><b>${"木火土金水"[GAN_WX[S.gi]]} / ${"木火土金水"[ZHI_WX[S.zi]]}</b>
    <span>生肖</span><b>${S.sheng}</b>
    <span>太岁方</span><b>${sha ? `${sha.taisui.dir[0]} · ${sha.zhi}` : "—"}</b>
    <span>岁破方</span><b>${sha ? `${sha.suipo.dir[0]} · ${sha.suipo.zhi}` : "—"}</b>
    <span>当前人物</span><b>${P ? `${P.gz} · ${P.name}` : "未载入人物"}</b>
  </div>
  <div class="jts-card"><b>当前流年与人物生肖</b><div class="jts-tags">${!JTS.layers.relations ? '<span class="mid">人物关系层已关闭</span>' : P ? (rels.length ? rels.map((x) => `<span class="${x.tone === "xiong" ? "bad" : "good"}">${x.n}</span>`).join("") : `<span class="${rcls}">无主要值冲刑破害合关系</span>`) : '<span class="mid">载入人物后可比较本命生肖</span>'}</div>${JTS.layers.relations ? "这里仅机械展示传统地支关系，不把“值、冲、刑、破、害、合”直接解释成现实事件结果。" : "可在左侧重新开启“人物关系”。"}</div>
  ${sel !== S.idx ? `<div class="jts-card"><b>选中甲子：</b>${O.y} · ${O.gz} · ${O.name}大将军 · ${O.ny} · ${O.xunName}，旬空${O.xk}。点击“切到该年”可把它设为当前观察流年。<div class="jts-links"><button class="gbtn sm" id="jtsUseSel">切到该年</button></div></div>` : ""}
  <div class="jts-card"><b>值年太岁名录</b><br>本盘采用道教宫观资料中“六十甲子太岁星君名称”的常用名录作为显示版本。不同宫观、图集与文献存在异名、异字，不能把这一栏当成唯一无异文的历史定本。</div>
  <div class="jts-card"><b>相关盘联动</b><div class="jts-links"><button class="gbtn sm" data-jtslink="taisui-cycle">生肖流年太岁</button><button class="gbtn sm" data-jtslink="taisui">犯太岁</button><button class="gbtn sm" data-jtslink="sha">年度神煞</button><button class="gbtn sm" data-jtslink="jiazi">甲子查表</button><button class="gbtn sm" data-jtslink="bridge">地支枢纽</button></div></div>`;
    const use = document.getElementById("jtsUseSel");
    if (use) use.onclick = () => jtsSetYear(O.y, true);
  }
  function jtsYears(S) {
    const w = document.getElementById("jtsYears");
    if (!w) return;
    let h = "";
    for (let d = -5; d <= 6; d++) {
      const y = S.y + d,
        O = jtsInfoOf(y),
        cur = y === S.y,
        now = y === jtsNowYear();
      h += `<button class="jts-ycard${cur ? " on" : ""}${now ? " current" : ""}" data-jtsyear="${y}"><b>${y}</b><span>${O.gz}</span><small>${O.name} · ${O.sheng}</small></button>`;
    }
    w.innerHTML = h;
  }
  function jtsTable(S) {
    const w = document.getElementById("jtsTable");
    if (!w) return;
    let h = "";
    for (let i = 0; i < 60; i++)
      h += `<button class="jts-cell${i === (JTS.sel == null ? S.idx : JTS.sel) ? " on" : ""}" data-jtsidx="${i}"><b>${String(i + 1).padStart(2, "0")} · ${jtsGz(i)}</b><span>${JTS_NAMES[i]} · ${NAYIN[i >> 1]}</span></button>`;
    w.innerHTML = h;
  }
  function jtsRender(sound = false) {
    const S = jtsInfoOf(JTS.year || jtsNowYear());
    JTS.year = S.y;
    if (JTS.sel == null) JTS.sel = S.idx;
    const svg = document.getElementById("jtsSvg");
    if (!svg) return;
    svg.innerHTML = jtsSvg(S);
    jtsInfo(S);
    jtsYears(S);
    jtsTable(S);
    jtsView();
    const y = document.getElementById("jtsY");
    if (y && document.activeElement !== y) y.value = S.y;
    document
      .querySelectorAll("[data-jtsl]")
      .forEach((c) => (c.checked = !!JTS.layers[c.dataset.jtsl]));
    if (sound) jtsSound();
  }
  function jtsOpen() {
    const pane = document.getElementById("pane-studio");
    if (!pane) return;
    try {
      if (STU && STU.active && typeof studioLeave === "function") studioLeave();
    } catch (_) {}
    [
      "hhdStop",
      "jc12Stop",
      "tspStop",
      "lgbStop",
      "zlfStop",
      "msgStop",
      "htdStop",
      "xapStop",
      "typStop",
      "qtpStop",
      "lrpStop",
    ].forEach((n) => {
      try {
        if (typeof window[n] === "function") window[n]();
      } catch (_) {}
    });
    jtsStop();
    PANLIB.mode = "jiazi-taisui";
    document.body.classList.add("studio-mode");
    delete pane.dataset.ui;
    pane.dataset.built = "1";
    JTS.year = JTS.year || jtsNowYear();
    JTS.sel = jtsYearIdx(JTS.year);
    pane.innerHTML = `<div class="jts-shell" id="jtsShell">
    <div class="jts-top"><button class="gbtn sm" id="jtsBack">← 盘库</button><div class="jts-title"><b>六十甲子太岁 · 值年神盘</b><small>六十花甲 · 三十纳音 · 六旬空亡 · 十二生肖 · 值年太岁 · 年度循环</small></div><button class="gbtn sm" id="jtsTsp">生肖太岁盘</button><button class="gbtn sm" id="jtsFs">全屏</button></div>
    <div class="jts-grid">
      <aside class="panel jts-side"><h4>六十年时间轴</h4>
        <div class="jts-group"><label>观察年份（立春为界）<input id="jtsY" type="number" min="1804" max="2203" value="${JTS.year}"></label>
          <div class="jts-row"><button class="gbtn sm" id="jtsNow">今年 · 归位</button><button class="gbtn sm" id="jtsPrev">← 上一年</button><button class="gbtn sm" id="jtsNext">下一年 →</button></div>
          <button class="gbtn sm" id="jtsPlay" style="width:100%;margin-top:6px">▶ 六十年演示</button>
        </div>
        <div class="jts-group"><h4>显示层</h4>
          <label class="jts-layer"><input type="checkbox" data-jtsl="xun" checked><span>六旬分区<small>甲子旬至甲寅旬，并标旬空</small></span></label>
          <label class="jts-layer"><input type="checkbox" data-jtsl="nayin" checked><span>三十纳音<small>每两个相邻甲子共用一组纳音</small></span></label>
          <label class="jts-layer"><input type="checkbox" data-jtsl="zodiac" checked><span>十二生肖<small>地支生肖作为六十年的十二年骨架</small></span></label>
          <label class="jts-layer"><input type="checkbox" data-jtsl="relations" checked><span>人物关系<small>载入人物后显示本命生肖与流年关系</small></span></label>
        </div>
        <div class="jts-group"><p class="note">红色为当前流年，金色虚线为手动选中的甲子。点击任一甲子只做研究选择；“切到该年”才改变观察年份。</p></div>
      </aside>
      <section class="jts-main">
        <div class="jts-viewbar"><button class="gbtn sm" id="jtsSelect">选择甲子</button><button class="gbtn sm" id="jtsPan">查看平移</button><span class="hint">点六十甲子扇区 · 滚轮缩放 · 平移模式拖动</span><button class="gbtn sm" id="jtsFit">适应</button><button class="gbtn sm" id="jtsZm">−</button><span id="jtsZoom">100%</span><button class="gbtn sm" id="jtsZp">＋</button></div>
        <div class="jts-frame" id="jtsFrame"><svg id="jtsSvg" viewBox="-440 -440 880 880" role="img" aria-label="六十甲子太岁值年神盘"></svg></div>
        <div class="jts-legend"><span><i class="cur"></i>当前流年</span><span><i class="sel"></i>选中甲子</span><span><i class="ny"></i>三十纳音</span><span><i class="pos"></i>合 / 正向关系</span><span><i class="neg"></i>冲刑破害 / 警示关系</span></div>
        <div class="panel jts-board"><div class="jts-board-head"><b>前后十二年</b><small>点击年份直接切换；红框标记真实当前流年</small></div><div class="jts-years" id="jtsYears"></div></div>
        <div class="panel jts-board"><div class="jts-board-head"><b>六十甲子快速索引</b><small>共六旬，每旬十位；点选只改变研究焦点</small></div><div class="jts-table" id="jtsTable"></div></div>
        <details class="panel jts-guide" open><summary>四步读懂六十甲子值年盘</summary><div class="jts-guide-grid">
          <div><b>① 六十甲子</b><span>十天干与十二地支同阴阳相配，最小公倍数形成六十组，六十年循环一次。</span></div>
          <div><b>② 六旬与旬空</b><span>六十甲子分成六旬，每旬十组；余下两个地支构成该旬的传统旬空。</span></div>
          <div><b>③ 三十纳音</b><span>每两个相邻甲子共用一组纳音。纳音五行与天干、地支本气五行并不是同一个概念。</span></div>
          <div><b>④ 值年太岁</b><span>传统信仰把六十甲子分别配以值年太岁神名。不同宫观和文献存在异名，本盘采用一套常用表展示。</span></div>
        </div></details>
      </section>
      <aside class="panel jts-info" id="jtsInfo"></aside>
    </div>
    <div class="panel jts-bottom"><b>口径说明：</b>本盘以六十甲子本身作为确定的干支循环骨架；观察年份按本站流年体系以立春为界。纳音、旬空、生肖与干支五行均为传统历法/术数关系。六十位值年太岁神名存在多个宫观、图集和文献版本，本盘采用常见名录用于文化与结构研习，不将神名差异或“犯太岁”标签解释为确定现实事件。</div>
  </div>`;
    jtsBind();
    jtsRender(false);
  }
  function jtsBind() {
    const pane = document.getElementById("pane-studio"),
      svg = document.getElementById("jtsSvg"),
      frame = document.getElementById("jtsFrame");
    if (!pane || !svg) return;
    document.getElementById("jtsBack").onclick = () => {
      jtsStop();
      plHub();
    };
    document.getElementById("jtsNow").onclick = () => {
      JTS.year = jtsNowYear();
      JTS.sel = jtsYearIdx(JTS.year);
      jtsFit();
      jtsRender(true);
    };
    document.getElementById("jtsPrev").onclick = () => jtsSetYear((JTS.year || jtsNowYear()) - 1);
    document.getElementById("jtsNext").onclick = () => jtsSetYear((JTS.year || jtsNowYear()) + 1);
    document.getElementById("jtsY").onchange = (e) => jtsSetYear(e.target.value);
    document.getElementById("jtsPlay").onclick = jtsPlay;
    pane.querySelectorAll("[data-jtsl]").forEach(
      (c) =>
        (c.onchange = () => {
          JTS.layers[c.dataset.jtsl] = c.checked ? 1 : 0;
          jtsRender(false);
        }),
    );
    const mode = (m) => {
      JTS.gesture = m;
      frame.classList.toggle("pan", m === "pan");
      document.getElementById("jtsSelect").classList.toggle("on", m === "select");
      document.getElementById("jtsPan").classList.toggle("on", m === "pan");
    };
    document.getElementById("jtsSelect").onclick = () => mode("select");
    document.getElementById("jtsPan").onclick = () => mode("pan");
    mode(JTS.gesture);
    document.getElementById("jtsFit").onclick = jtsFit;
    document.getElementById("jtsZm").onclick = () => {
      const r = svg.getBoundingClientRect();
      jtsZoomAt(1.18, r.left + r.width / 2, r.top + r.height / 2);
    };
    document.getElementById("jtsZp").onclick = () => {
      const r = svg.getBoundingClientRect();
      jtsZoomAt(0.84, r.left + r.width / 2, r.top + r.height / 2);
    };
    svg.addEventListener(
      "wheel",
      (e) => {
        e.preventDefault();
        jtsZoomAt(e.deltaY < 0 ? 0.86 : 1.16, e.clientX, e.clientY);
      },
      { passive: false },
    );
    let drag = null;
    svg.addEventListener("pointerdown", (e) => {
      if (e.button > 0 || JTS.gesture !== "pan") return;
      drag = {
        id: e.pointerId,
        x: e.clientX,
        y: e.clientY,
        vx: JTS.view.x,
        vy: JTS.view.y,
        w: JTS.view.w,
        h: JTS.view.h,
        rw: Math.max(1, svg.getBoundingClientRect().width),
        rh: Math.max(1, svg.getBoundingClientRect().height),
      };
      try {
        svg.setPointerCapture(e.pointerId);
      } catch (_) {}
      frame.classList.add("grab");
    });
    svg.addEventListener("pointermove", (e) => {
      if (!drag || e.pointerId !== drag.id) return;
      const kx = drag.w / drag.rw,
        ky = drag.h / drag.rh;
      JTS.view.x = drag.vx - (e.clientX - drag.x) * kx;
      JTS.view.y = drag.vy - (e.clientY - drag.y) * ky;
      jtsView();
    });
    const up = (e) => {
      if (!drag || e.pointerId !== drag.id) return;
      drag = null;
      frame.classList.remove("grab");
    };
    svg.addEventListener("pointerup", up);
    svg.addEventListener("pointercancel", () => {
      drag = null;
      frame.classList.remove("grab");
    });
    svg.addEventListener("click", (e) => {
      if (JTS.gesture !== "select") return;
      const g = e.target.closest && e.target.closest("[data-jtsidx]");
      if (g) {
        JTS.sel = +g.dataset.jtsidx;
        jtsRender(false);
      }
    });
    pane.addEventListener("click", (e) => {
      const y = e.target.closest("[data-jtsyear]");
      if (y) {
        jtsSetYear(+y.dataset.jtsyear, true);
        return;
      }
      const c = e.target.closest("[data-jtsidx]");
      if (c && !c.closest("#jtsSvg")) {
        JTS.sel = +c.dataset.jtsidx;
        jtsRender(false);
        return;
      }
      const l = e.target.closest("[data-jtslink]");
      if (!l) return;
      const k = l.dataset.jtslink;
      jtsStop();
      if (k === "taisui-cycle") {
        try {
          if (typeof tspOpen === "function") {
            TSP.year = JTS.year;
            tspOpen();
            return;
          }
        } catch (_) {}
        plHub();
        return;
      }
      selectTab(k, true);
    });
    document.getElementById("jtsTsp").onclick = () => {
      jtsStop();
      try {
        if (typeof tspOpen === "function") {
          TSP.year = JTS.year;
          tspOpen();
          return;
        }
      } catch (_) {}
      selectTab("taisui", true);
    };
    document.getElementById("jtsFs").onclick = async () => {
      try {
        if (document.fullscreenElement) await document.exitFullscreen();
        else await document.getElementById("jtsShell").requestFullscreen();
      } catch (_) {
        toast("当前浏览器不允许全屏");
      }
    };
  }
  window.jtsOpen = jtsOpen;
  window.jtsStop = jtsStop;

  const _plHub65 = plHub;
  plHub = function () {
    jtsStop();
    _plHub65();
    const pane = document.getElementById("pane-studio");
    if (!pane) return;
    const cnt = pane.querySelector(".pl-count b");
    if (cnt) cnt.textContent = "14";
    const f = pane.querySelector(".pl-card.future");
    if (f)
      f.outerHTML = `<article class="panel pl-card" data-pl="jiazi-taisui"><span class="num">14 · 神煞流转</span><span class="enter">↗</span><h3>六十甲子太岁 · 值年神盘</h3><p>六十甲子、六旬空亡、三十纳音、生肖与六十位值年太岁同盘，按年份连续观察完整六十年周期。</p><div class="tags"><span>六十甲子</span><span>值年太岁</span><span>三十纳音</span></div></article><article class="panel pl-card future"><span class="num">NEXT · 掌诀</span><span class="enter">待建</span><h3>十二地支掌 · 掌诀盘</h3><p>下一盘进入掌诀系列，把十二地支、月份、时辰与常用掌上定位组织成可点击、可练习的掌诀图。</p><div class="tags"><span>十二地支掌</span><span>掌上定位</span><span>传统速查</span></div></article>`;
    const c = pane.querySelector('[data-pl="jiazi-taisui"]');
    if (c) c.onclick = () => jtsOpen();
  };

  try {
    const g = NAV_G.find((x) => x.g === "盘库");
    if (g && g.it && g.it[0]) {
      g.it[0][2] =
        "天机巨盘、罗经三盘、三式、全天星图、浑天仪、易学数理、择时养生、流年太岁、神煞流转、六十甲子太岁及后续独立盘";
      g.it[0][3] += " 六十甲子太岁 值年太岁 太岁星君 三十纳音 六旬空亡 六十年循环";
    }
  } catch (_) {}

  try {
    const oldClose = typeof plClose === "function" ? plClose : null;
    if (oldClose && !window.__JTS_CLOSE_WRAP) {
      window.__JTS_CLOSE_WRAP = 1;
      plClose = function () {
        jtsStop();
        return oldClose.apply(this, arguments);
      };
    }
  } catch (_) {}

  try {
    const bv = document.getElementById("buildVersion");

    const ft = document.querySelector("footer");
    if (ft) {
      const t = ft.textContent || "";
      if (/版本\s*·/.test(t));
      else ft.insertAdjacentHTML("beforeend", "<br>版本 · " + JTS_TS);
    }
  } catch (_) {}
})();
