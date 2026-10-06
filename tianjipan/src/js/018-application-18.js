/* ===== v51 · 十二生肖 / 流年太岁盘 ===== */
const TSP = {
  year: null,
  sel: null,
  play: null,
  gesture: "select",
  view: { x: -440, y: -440, w: 880, h: 880 },
  layers: { relations: 1, directions: 1, sui12: 1, fly: 1, sansha: 1 },
};
function tspNowYear() {
  try {
    return p5NowYear();
  } catch (_) {
    return new Date().getFullYear();
  }
}
function tspPersonBranch() {
  try {
    return R && R.bz && R.bz.pill ? R.bz.pill[0].b : null;
  } catch (_) {
    return null;
  }
}
function tspStop() {
  if (TSP.play) {
    clearInterval(TSP.play);
    TSP.play = null;
  }
  const b = $("#tspPlay");
  if (b) b.textContent = "▶ 十二年演示";
}
const tspPt = (r, a) => {
  const t = (a * Math.PI) / 180;
  return [Math.sin(t) * r, -Math.cos(t) * r];
};
function tspArc(r1, r2, a0, a1) {
  let span = (a1 - a0 + 360) % 360;
  if (span === 0) span = 359.999;
  const p = (r, a) => {
    const q = tspPt(r, a);
    return q[0].toFixed(1) + "," + q[1].toFixed(1);
  };
  return `M${p(r2, a0)} A${r2},${r2} 0 ${span > 180 ? 1 : 0} 1 ${p(r2, a1)} L${p(r1, a1)} A${r1},${r1} 0 ${span > 180 ? 1 : 0} 0 ${p(r1, a0)} Z`;
}
function tspRel(yearZi, b) {
  const r = p5Fan(yearZi, b);
  return r;
}
function tspRelClass(r) {
  if (r.some((x) => x.tone === "xiong")) return "bad";
  if (r.some((x) => x.tone === "ji")) return "good";
  return "";
}
function tspRelShort(r) {
  return r.length ? r.map((x) => x.k).join("·") : "—";
}
function tspFlyGrid(S) {
  const layout = {
    4: [-1, -1],
    9: [0, -1],
    2: [1, -1],
    3: [-1, 0],
    5: [0, 0],
    7: [1, 0],
    8: [-1, 1],
    1: [0, 1],
    6: [1, 1],
  };
  let g = "";
  for (const p in layout) {
    const st = S.fly[p],
      [cx, cy] = layout[p],
      x = cx * 42,
      y = cy * 42,
      hot = st === 5 || st === 2;
    g += `<rect x="${x - 19}" y="${y - 19}" width="38" height="38" rx="2" class="tsp-fly-cell${hot ? " tsp-fly-hot" : ""}"/><text x="${x}" y="${y + 1}" class="tsp-tx tsp-fly-num">${st}</text>`;
  }
  return g;
}
function tspSvg(S) {
  const person = TSP.sel,
    py = tspPersonBranch();
  let g =
    '<defs><marker id="tspArrR" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0L10,5L0,10z" fill="var(--red)"/></marker><marker id="tspArrC" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0L10,5L0,10z" fill="var(--cyan)"/></marker></defs>';
  g +=
    '<circle r="414" class="tsp-ring"/><circle r="370" class="tsp-ring2"/><circle r="292" class="tsp-ring"/><circle r="215" class="tsp-ring2"/>';
  // 十二岁神外环
  if (TSP.layers.sui12)
    for (const x of S.sui12) {
      const p = tspPt(399, x.deg);
      g += `<text x="${p[0]}" y="${p[1]}" class="tsp-tx tsp-sui ${x.t === "吉" ? "ji" : x.t === "凶" ? "xiong" : ""}">${x.n}</text>`;
    }
  // 生肖、地支、关系
  for (let b = 0; b < 12; b++) {
    const a = b * 30,
      rel = tspRel(S.zi, b),
      rc = tspRelClass(rel),
      p = tspPt(334, a),
      pr = tspPt(260, a),
      isY = b === S.zi,
      isP = b === person;
    g += `<g class="tsp-hit${isY ? " year" : ""}${isP ? " person" : ""}" data-tspb="${b}"><path d="${tspArc(294, 368, a - 15, a + 15)}" class="tsp-sec"/><text x="${p[0]}" y="${p[1] - 8}" class="tsp-tx tsp-zhi">${ZHI[b]}</text><text x="${p[0]}" y="${p[1] + 13}" class="tsp-tx tsp-animal">${P5_SHENG[b]}</text>${TSP.layers.relations ? `<text x="${pr[0]}" y="${pr[1]}" class="tsp-tx tsp-rel ${rc}">${tspRelShort(rel)}</text>` : ""}</g>`;
  }
  // 八方
  if (TSP.layers.directions)
    P5_D8.forEach(([n, gua, d]) => {
      const p = tspPt(236, d);
      g += `<path d="${tspArc(216, 252, d - 22.5, d + 22.5)}" fill="rgba(217,178,95,.025)" stroke="var(--line)" stroke-width=".6"/><text x="${p[0]}" y="${p[1] - 5}" class="tsp-tx tsp-dir">${gua}</text><text x="${p[0]}" y="${p[1] + 8}" class="tsp-tx tsp-sm">${n}</text>`;
    });
  // 三煞
  if (TSP.layers.sansha) {
    const [a0, a1] = S.sansha.arc;
    g += `<path d="${tspArc(374, 393, a0, a1)}" class="tsp-sansha"><title>三煞 ${S.sansha.dir}方：${S.sansha.items.map((x) => x.n + x.zhi).join("、")}</title></path>`;
  }
  // 太岁、岁破指向
  const tp = tspPt(282, S.taisui.deg),
    sp = tspPt(282, S.suipo.deg);
  g += `<line x1="0" y1="0" x2="${tp[0]}" y2="${tp[1]}" class="tsp-ts-line" marker-end="url(#tspArrR)"/><circle cx="${tp[0]}" cy="${tp[1]}" r="7" class="tsp-ts-dot"/><line x1="0" y1="0" x2="${sp[0]}" y2="${sp[1]}" class="tsp-sp-line" marker-end="url(#tspArrC)"/><circle cx="${sp[0]}" cy="${sp[1]}" r="6" class="tsp-sp-dot"/>`;
  // 中心
  g += '<circle r="188" class="tsp-center"/>';
  if (TSP.layers.fly)
    g += `<g transform="translate(0,22)">${tspFlyGrid(S)}</g><text x="0" y="-82" class="tsp-tx tsp-sm">年度九星飞泊摘要</text>`;
  else
    g += `<text x="0" y="-30" class="tsp-tx tsp-big">${S.gz}</text><text x="0" y="10" class="tsp-tx tsp-med">${S.sheng}年</text>`;
  g += `<text x="0" y="-145" class="tsp-tx tsp-big">${S.Y}</text><text x="0" y="-112" class="tsp-tx tsp-med">${S.gz} · ${S.sheng}年</text><text x="0" y="154" class="tsp-tx tsp-sm">太岁 ${S.zhi} · 岁破 ${S.suipo.zhi} · 三煞 ${S.sansha.dir}方</text>`;
  return g;
}
function tspViewApply() {
  const s = $("#tspSvg");
  if (!s) return;
  const v = TSP.view;
  s.setAttribute("viewBox", `${v.x} ${v.y} ${v.w} ${v.h}`);
  const z = $("#tspZoom");
  if (z) z.textContent = Math.round((880 / v.w) * 100) + "%";
}
function tspFit() {
  TSP.view = { x: -440, y: -440, w: 880, h: 880 };
  tspViewApply();
}
function tspZoomAt(f, cx, cy) {
  const s = $("#tspSvg");
  if (!s) return;
  const r = s.getBoundingClientRect(),
    v = TSP.view,
    p = { x: v.x + ((cx - r.left) / r.width) * v.w, y: v.y + ((cy - r.top) / r.height) * v.h },
    nw = Math.max(280, Math.min(1900, v.w * f)),
    k = nw / v.w;
  v.x = p.x - (p.x - v.x) * k;
  v.y = p.y - (p.y - v.y) * k;
  v.w = nw;
  v.h = nw;
  tspViewApply();
}
function tspSound() {
  try {
    if (STU.sfx) stuSfxTick(0.42, false, 1, 0.55);
  } catch (_) {}
}
function tspSetYear(y, sound = true) {
  TSP.year = Math.max(1901, Math.min(2099, Math.round(y)));
  tspRender(sound);
}
function tspPlayToggle() {
  if (TSP.play) {
    tspStop();
    return;
  }
  TSP.play = setInterval(() => {
    let y = (TSP.year || tspNowYear()) + 1;
    if (y > 2099) y = 1901;
    tspSetYear(y, true);
  }, 850);
  const b = $("#tspPlay");
  if (b) b.textContent = "■ 停止演示";
}
function tspPersonLabel() {
  const b = tspPersonBranch();
  return b == null ? "未载入人物" : `${ZHI[b]} · ${P5_SHENG[b]}`;
}
function tspInfo(S) {
  const box = $("#tspInfo");
  if (!box) return;
  const b = TSP.sel == null ? S.zi : TSP.sel,
    rels = tspRel(S.zi, b),
    relTxt = rels.length ? rels.map((x) => x.n).join("、") : "与太岁无值冲刑破害合关系";
  const sui = S.sui12.find((x) => ZHI.indexOf(x.zhi) === b);
  box.innerHTML = `<h4>流年读数</h4><div class="tsp-hero"><div><small>流年</small><b>${S.Y} · ${S.gz}</b><span>${S.sheng}年 · 立春为界</span></div><div><small>当前观察</small><b>${ZHI[b]} · ${P5_SHENG[b]}</b><span>${b === tspPersonBranch() ? "当前人物生肖" : b === S.zi ? "流年生肖" : "手动选择"}</span></div></div><div class="tsp-facts"><span>生肖关系</span><b>${relTxt}</b><span>太岁方</span><b>${S.zhi} · ${S.taisui.dir[0]}(${S.taisui.dir[1]})</b><span>岁破方</span><b>${S.suipo.zhi} · ${S.suipo.dir[0]}(${S.suipo.dir[1]})</b><span>三煞</span><b>${S.sansha.dir}方 · ${S.sansha.items.map((x) => x.n + x.zhi).join("、")}</b><span>岁德</span><b>${S.suide.stem}${S.suide.deg == null ? " · 中宫" : " · " + p5Dir8(S.suide.deg)[0]}</b><span>岁德合</span><b>${S.suideHe.stem}${S.suideHe.deg == null ? " · 中宫" : " · " + p5Dir8(S.suideHe.deg)[0]}</b><span>五黄 / 二黑</span><b>${S.wuhuang.dir} / ${S.erhei.dir}</b><span>十二岁神</span><b>${sui ? sui.n + " · " + sui.t : "—"}</b><span>人物生肖</span><b>${tspPersonLabel()}</b></div><div class="tsp-card"><b>观察生肖与流年：</b><div class="tsp-tags">${rels.length ? rels.map((x) => `<span class="${x.tone === "xiong" ? "bad" : "good"}">${x.n}</span>`).join("") : "<span>无主要关系</span>"}</div>这里把值、冲、刑、破、害、六合、三合按传统地支关系机械列出。它们是传统关系标签，不等于现实中一定发生某类事件。</div><div class="tsp-card"><b>年度方位：</b><br>红线指太岁所在岁支，青色虚线指岁破；红色外带标示三煞方。年度九星只作为方位轮值摘要显示，完整飞星分析仍应进入玄空/年度神煞页面。</div><div class="tsp-card"><b>相关模块</b><div class="tsp-links"><button class="gbtn sm" data-tsplink="taisui">犯太岁</button><button class="gbtn sm" data-tsplink="sha">年度神煞方位</button><button class="gbtn sm" data-tsplink="luopan">综合罗盘</button><button class="gbtn sm" data-tsplink="bridge">地支枢纽</button><button class="gbtn sm" data-tsplink="me">个人中心</button></div></div>`;
}
function tspYears(S) {
  const w = $("#tspYears");
  if (!w) return;
  const b = TSP.sel == null ? S.zi : TSP.sel;
  let h = "";
  for (let i = 0; i < 12; i++) {
    const Y = S.Y + i,
      x = p5YearSha(Y),
      r = tspRel(x.zi, b),
      cl = tspRelClass(r);
    h += `<button class="tsp-year ${cl}${Y === S.Y ? " cur" : ""}" data-tspyear="${Y}"><b>${Y} · ${x.gz}</b><span>${x.sheng}年 · ${tspRelShort(r)}</span><small>${r.length ? r.map((q) => q.n).join("、") : "无主要关系"}</small></button>`;
  }
  w.innerHTML = h;
}
function tspRender(sound = false) {
  const S = p5YearSha(TSP.year || tspNowYear());
  TSP.year = S.Y;
  if (TSP.sel == null) {
    const p = tspPersonBranch();
    TSP.sel = p == null ? S.zi : p;
  }
  const svg = $("#tspSvg");
  if (!svg) return;
  svg.innerHTML = tspSvg(S);
  tspInfo(S);
  tspYears(S);
  tspViewApply();
  const y = $("#tspY");
  if (y && document.activeElement !== y) y.value = S.Y;
  const ps = $("#tspPerson");
  if (ps) ps.value = TSP.sel;
  $$("[data-tspl]").forEach((c) => {
    c.checked = !!TSP.layers[c.dataset.tspl];
  });
  if (sound) tspSound();
}
function tspOpen() {
  const pane = $("#pane-studio");
  if (!pane) return;
  if (STU.active) studioLeave();
  ["msgStop", "htdStop", "xapStop", "typStop", "qtpStop", "lrpStop", "zlfStop", "lgbStop"].forEach(
    (n) => {
      try {
        if (typeof window[n] === "function") window[n]();
      } catch (_) {}
    },
  );
  tspStop();
  PANLIB.mode = "taisui-cycle";
  document.body.classList.add("studio-mode");
  delete pane.dataset.ui;
  pane.dataset.built = "1";
  TSP.year = TSP.year || tspNowYear();
  if (TSP.sel == null) TSP.sel = tspPersonBranch();
  pane.innerHTML = `<div class="tsp-shell" id="tspShell"><div class="tsp-top"><button class="gbtn sm" id="tspBack">← 盘库</button><div class="tsp-title"><b>十二生肖 · 流年太岁盘</b><small>十二地支 · 生肖 · 值冲刑破害合 · 太岁岁破 · 三煞 · 十二岁神 · 年度方位</small></div><button class="gbtn sm" id="tspSha">年度神煞详页</button><button class="gbtn sm" id="tspFs">全屏</button></div><div class="tsp-grid"><aside class="panel tsp-side"><h4>流年与生肖</h4><div class="tsp-group"><label>流年（立春为界）<input type="number" id="tspY" min="1901" max="2099" value="${TSP.year}"></label><div class="tsp-row"><button class="gbtn sm" id="tspNow">今年 · 归位</button><button class="gbtn sm" id="tspPrev">← 上一年</button><button class="gbtn sm" id="tspNext">下一年 →</button></div><button class="gbtn sm" id="tspPlay" style="width:100%;margin-top:6px">▶ 十二年演示</button></div><div class="tsp-group"><h4>观察生肖</h4><label>生肖<select id="tspPerson">${P5_SHENG.map((n, i) => `<option value="${i}"${TSP.sel === i ? " selected" : ""}>${ZHI[i]} · ${n}</option>`).join("")}</select></label><button class="gbtn sm" id="tspUsePerson" style="width:100%">读取当前人物生肖</button><p class="note">当前人物：${tspPersonLabel()}。没有载入人物时可直接手动选择生肖。</p></div><div class="tsp-group"><h4>显示层</h4>${[
    ["relations", "冲合刑害", "每个生肖与流年的关系"],
    ["directions", "八方八卦", "太岁/岁破方位参照"],
    ["sui12", "十二岁神", "岁建起顺行十二神"],
    ["sansha", "三煞", "劫煞、灾煞、岁煞方位带"],
    ["fly", "年度九星摘要", "中央九宫飞星简图"],
  ]
    .map(
      ([k, n, d]) =>
        `<label class="tsp-layer"><input type="checkbox" data-tspl="${k}"${TSP.layers[k] ? " checked" : ""}><span>${n}<small>${d}</small></span></label>`,
    )
    .join(
      "",
    )}</div></aside><section class="tsp-main"><div class="tsp-viewbar"><button class="gbtn sm" id="tspSelect">选择生肖</button><button class="gbtn sm" id="tspPan">查看平移</button><span class="hint">点生肖扇区查看关系 · 滚轮缩放 · 查看模式拖动画面</span><button class="gbtn sm" id="tspFit">↙↗ 适应</button><button class="gbtn sm" id="tspZm">−</button><span id="tspZoom">100%</span><button class="gbtn sm" id="tspZp">＋</button></div><div class="tsp-frame" id="tspFrame"><svg id="tspSvg" viewBox="-440 -440 880 880" role="img" aria-label="十二生肖流年太岁盘"></svg></div><div class="panel tsp-timeline"><div class="tsp-timeline-head"><b>未来十二年 · 生肖关系</b><small>以当前观察生肖为参照；点击年份直接切换流年</small></div><div class="tsp-years" id="tspYears"></div></div><details class="panel tsp-guide" open><summary>怎么读这张盘</summary><div class="tsp-guide-grid"><button data-tspteach="year"><b>① 先看流年岁支</b><span>红色生肖扇区是该年的岁支，也是太岁的基本定位。</span></button><button data-tspteach="rel"><b>② 再看冲合刑害</b><span>选择自己的生肖，盘内直接标出与流年的传统地支关系。</span></button><button data-tspteach="dir"><b>③ 看年度方位</b><span>红线太岁、青线岁破，三煞以外圈红带表示。</span></button><button data-tspteach="cycle"><b>④ 看十二年周期</b><span>下方时间轴让同一生肖跨十二年关系变化一目了然。</span></button></div></details></section><aside class="panel tsp-info" id="tspInfo"></aside></div><div class="panel tsp-bottom"><b>口径说明：</b>本盘按立春作为流年边界，生肖关系使用十二地支的值、冲、刑、破、害、六合、三合规则；太岁、岁破、三煞、十二岁神和年飞星复用本站现有年度神煞算法。传统“犯太岁”“神煞吉凶”等属于民俗术数分类，不是事件预测，也不应替代现实决策。六十位值年太岁神名将另做独立盘，不在这里混用。</div></div>`;
  tspBind();
  tspRender(false);
}
function tspBind() {
  const pane = $("#pane-studio"),
    svg = $("#tspSvg"),
    frame = $("#tspFrame");
  if (!pane || !svg) return;
  $("#tspBack").onclick = () => {
    tspStop();
    plHub();
  };
  $("#tspNow").onclick = () => {
    TSP.year = tspNowYear();
    TSP.sel = tspPersonBranch() ?? TSP.sel;
    tspFit();
    tspRender(true);
  };
  $("#tspPrev").onclick = () => tspSetYear((TSP.year || tspNowYear()) - 1);
  $("#tspNext").onclick = () => tspSetYear((TSP.year || tspNowYear()) + 1);
  $("#tspY").onchange = (e) => tspSetYear(+e.target.value || tspNowYear());
  $("#tspPlay").onclick = tspPlayToggle;
  $("#tspPerson").onchange = (e) => {
    TSP.sel = +e.target.value;
    tspRender(false);
  };
  $("#tspUsePerson").onclick = () => {
    const b = tspPersonBranch();
    if (b == null) {
      toast("当前没有载入人物档案");
      return;
    }
    TSP.sel = b;
    tspRender(true);
  };
  $$("[data-tspl]", pane).forEach(
    (c) =>
      (c.onchange = () => {
        TSP.layers[c.dataset.tspl] = c.checked ? 1 : 0;
        tspRender(false);
      }),
  );
  const mode = (m) => {
    TSP.gesture = m;
    frame.classList.toggle("pan", m === "pan");
    $("#tspSelect").classList.toggle("on", m === "select");
    $("#tspPan").classList.toggle("on", m === "pan");
  };
  $("#tspSelect").onclick = () => mode("select");
  $("#tspPan").onclick = () => mode("pan");
  mode(TSP.gesture);
  $("#tspFit").onclick = tspFit;
  $("#tspZm").onclick = () => {
    const r = svg.getBoundingClientRect();
    tspZoomAt(1.18, r.left + r.width / 2, r.top + r.height / 2);
  };
  $("#tspZp").onclick = () => {
    const r = svg.getBoundingClientRect();
    tspZoomAt(0.84, r.left + r.width / 2, r.top + r.height / 2);
  };
  svg.addEventListener(
    "wheel",
    (e) => {
      e.preventDefault();
      tspZoomAt(e.deltaY < 0 ? 0.86 : 1.16, e.clientX, e.clientY);
    },
    { passive: false },
  );
  let drag = null;
  svg.addEventListener("pointerdown", (e) => {
    if (e.button > 0 || TSP.gesture !== "pan") return;
    drag = {
      id: e.pointerId,
      x: e.clientX,
      y: e.clientY,
      vx: TSP.view.x,
      vy: TSP.view.y,
      w: TSP.view.w,
      h: TSP.view.h,
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
    TSP.view.x = drag.vx - (e.clientX - drag.x) * kx;
    TSP.view.y = drag.vy - (e.clientY - drag.y) * ky;
    tspViewApply();
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
    if (TSP.gesture !== "select") return;
    const g = e.target.closest && e.target.closest("[data-tspb]");
    if (g) {
      TSP.sel = +g.dataset.tspb;
      tspRender(false);
    }
  });
  pane.addEventListener("click", (e) => {
    const y = e.target.closest("[data-tspyear]");
    if (y) {
      tspSetYear(+y.dataset.tspyear, true);
      return;
    }
    const t = e.target.closest("[data-tspteach]");
    if (t) {
      if (t.dataset.tspteach === "year") TSP.sel = p5YearSha(TSP.year || tspNowYear()).zi;
      if (t.dataset.tspteach === "rel") {
        const b = tspPersonBranch();
        if (b != null) TSP.sel = b;
      }
      tspRender(false);
      return;
    }
    const l = e.target.closest("[data-tsplink]");
    if (l) {
      tspStop();
      selectTab(l.dataset.tsplink, true);
    }
  });
  $("#tspSha").onclick = () => {
    tspStop();
    try {
      P5.year = TSP.year;
    } catch (_) {}
    selectTab("sha", true);
  };
  $("#tspFs").onclick = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await $("#tspShell").requestFullscreen();
    } catch (e) {
      toast("当前浏览器不允许全屏");
    }
  };
  if (!window.__TSP_FS) {
    window.__TSP_FS = 1;
    document.addEventListener("fullscreenchange", () => {
      const b = $("#tspFs");
      if (b) b.textContent = document.fullscreenElement ? "退出全屏" : "全屏";
    });
  }
}
/* 盘库入口：正式加入第 11 盘。 */
const plHub_v50_tsp = plHub;
plHub = function () {
  tspStop();
  plHub_v50_tsp();
  const pane = $("#pane-studio");
  if (!pane) return;
  const cnt = pane.querySelector(".pl-count b");
  if (cnt) cnt.textContent = "11";
  const f = pane.querySelector(".pl-card.future");
  if (f)
    f.outerHTML = `<article class="panel pl-card" data-pl="taisui-cycle"><span class="num">11 · 流年时空</span><span class="enter">↗</span><h3>十二生肖 · 流年太岁盘</h3><p>把流年岁支、十二生肖、值冲刑破害合、太岁岁破、三煞、十二岁神和年度方位组织成一张可连续演示的年度圆盘。</p><div class="tags"><span>十二生肖</span><span>流年太岁</span><span>冲合刑害</span></div></article><article class="panel pl-card future"><span class="num">NEXT · 神煞流转</span><span class="enter">待建</span><h3>建除十二神 · 月建流转盘</h3><p>下一项进入择日家的转盘体系：以月建为固定参照，让建、除、满、平、定、执、破、危、成、收、开、闭随日支流转。</p><div class="tags"><span>建除十二神</span><span>月建</span><span>择日</span></div></article>`;
  const c = pane.querySelector('[data-pl="taisui-cycle"]');
  if (c) c.onclick = () => tspOpen();
};
const plClose_v51_tsp = plClose;
plClose = function () {
  tspStop();
  return plClose_v51_tsp();
};
try {
  const g = NAV_G.find((x) => x.g === "盘库");
  if (g && g.it && g.it[0]) {
    g.it[0][2] =
      "天机巨盘、罗经三盘、三式、全天星图、浑天仪、十二消息卦、择时养生、流年太岁及后续独立盘";
    g.it[0][3] +=
      " 十二生肖 流年太岁 值太岁 冲太岁 刑太岁 破太岁 害太岁 六合 三合 太岁方 岁破 三煞 十二岁神 年度飞星";
  }
} catch (_) {}
/* v51 version */
try {
  const bv = document.getElementById("buildVersion");

  const ft = document.querySelector("footer");
  if (ft) {
    const t = ft.textContent || "";
    if (/版本\s*·/.test(t));
    else ft.insertAdjacentHTML("beforeend", "<br>版本 · 2026-10-03 20:51:21");
  }
} catch (_) {}
