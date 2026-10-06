/* ===== v49 · 盘库 09：子午流注 · 十二经脉时辰盘 ===== */
const ZLF = {
  civ: null,
  follow: 1,
  sel: 0,
  play: null,
  step: "hour2",
  gesture: "select",
  view: { x: -430, y: -430, w: 860, h: 860 },
  layers: { flow: 1, pair: 1, element: 1, yinyang: 1, clock: 1 },
  infoSel: null,
};
const ZLF_ORG = ["胆", "肝", "肺", "大肠", "胃", "脾", "心", "小肠", "膀胱", "肾", "心包", "三焦"];
const ZLF_PAIR = [1, 0, 3, 2, 5, 4, 7, 6, 9, 8, 11, 10];
const ZLF_WX_COLOR = {
  木: "var(--wood)",
  火: "var(--fire)",
  相火: "var(--fire)",
  土: "var(--earth)",
  金: "var(--metal)",
  水: "var(--water)",
};
const zlfNormWx = (w) => (w === "相火" ? "火" : w);
function zlfStop() {
  if (ZLF.play) {
    clearInterval(ZLF.play);
    ZLF.play = null;
  }
  const b = $("#zlfPlay");
  if (b) b.textContent = "▶ 十二时辰演示";
}
function zlfNow() {
  const n = nowBJ();
  return { y: n.y, m: n.m, d: n.d, h: n.h, mi: n.mi || 0, s: 0 };
}
function zlfFmt(c) {
  return `${c.y}-${f2(c.m)}-${f2(c.d)}T${f2(c.h)}:${f2(c.mi || 0)}`;
}
function zlfParse(v) {
  if (!v) return null;
  const m = v.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  return m ? { y: +m[1], m: +m[2], d: +m[3], h: +m[4], mi: +m[5], s: 0 } : null;
}
function zlfIndex(c) {
  return c.h === 23 ? 0 : Math.floor((c.h + 1) / 2) % 12;
}
function zlfElapsed(c, i) {
  const start = (i * 2 - 1 + 24) % 24,
    mins = c.h * 60 + (c.mi || 0),
    sm = start * 60;
  let d = (mins - sm + 1440) % 1440;
  if (d > 120) d = 0;
  return Math.max(0, Math.min(120, d));
}
function zlfPt(r, deg) {
  const a = ((deg - 90) * Math.PI) / 180;
  return [r * Math.cos(a), r * Math.sin(a)];
}
function zlfSector(r0, r1, a0, a1) {
  const p0 = zlfPt(r0, a0),
    p1 = zlfPt(r1, a0),
    p2 = zlfPt(r1, a1),
    p3 = zlfPt(r0, a1),
    large = (a1 - a0 + 360) % 360 > 180 ? 1 : 0;
  return `M${p0[0].toFixed(2)},${p0[1].toFixed(2)}L${p1[0].toFixed(2)},${p1[1].toFixed(2)}A${r1},${r1} 0 ${large} 1 ${p2[0].toFixed(2)},${p2[1].toFixed(2)}L${p3[0].toFixed(2)},${p3[1].toFixed(2)}A${r0},${r0} 0 ${large} 0 ${p0[0].toFixed(2)},${p0[1].toFixed(2)}Z`;
}
function zlfArc(r, a0, a1) {
  const p0 = zlfPt(r, a0),
    p1 = zlfPt(r, a1);
  return `M${p0[0].toFixed(2)},${p0[1].toFixed(2)}A${r},${r} 0 0 1 ${p1[0].toFixed(2)},${p1[1].toFixed(2)}`;
}
function zlfShortName(i) {
  return JL_MER[i].n.replace(/^[手足]/, "").replace(/[经脉]$/, "");
}
function zlfCurrent() {
  const c = ZLF.civ || zlfNow(),
    idx = zlfIndex(c);
  return { c, idx, m: JL_MER[idx], elapsed: zlfElapsed(c, idx) };
}
function zlfViewApply() {
  const s = $("#zlfSvg");
  if (!s) return;
  const v = ZLF.view;
  s.setAttribute("viewBox", `${v.x} ${v.y} ${v.w} ${v.h}`);
  const z = $("#zlfZoom");
  if (z) z.textContent = Math.round((860 / v.w) * 100) + "%";
}
function zlfFit() {
  ZLF.view = { x: -430, y: -430, w: 860, h: 860 };
  zlfViewApply();
}
function zlfZoomAt(k, cx, cy) {
  const s = $("#zlfSvg");
  if (!s) return;
  const r = s.getBoundingClientRect(),
    v = ZLF.view,
    nw = Math.max(260, Math.min(1600, v.w * k)),
    nh = nw,
    px = v.x + ((cx - r.left) / r.width) * v.w,
    py = v.y + ((cy - r.top) / r.height) * v.h,
    q = nw / v.w;
  v.x = px - (px - v.x) * q;
  v.y = py - (py - v.y) * q;
  v.w = nw;
  v.h = nh;
  zlfViewApply();
}
function zlfSound(strong = false) {
  try {
    if (typeof stuSfxTick === "function")
      stuSfxTick(strong ? 0.55 : 0.25, strong, 1, strong ? 0.35 : 0.18);
  } catch (_) {}
}
function zlfSvg(C, sel) {
  let g = `<defs><marker id="zlfArr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0L10,5L0,10z" fill="var(--gold)"/></marker></defs>`;
  for (let i = 0; i < 12; i++) {
    const a = i * 30,
      a0 = a - 15,
      a1 = a + 15,
      m = JL_MER[i],
      col = ZLF_WX_COLOR[m.wx] || "var(--gold)",
      cur = i === C.idx,
      on = i === sel;
    g += `<path d="${zlfSector(250, 354, a0, a1)}" class="zlf-sector${cur ? " current" : ""}${on ? " selected" : ""}" data-zlfi="${i}" style="fill:${col};fill-opacity:${cur ? 0.18 : 0.07}"/>`;
    const pOrg = zlfPt(294, a),
      pMer = zlfPt(224, a),
      pYy = zlfPt(265, a),
      pB = zlfPt(333, a);
    g += `<text x="${pB[0]}" y="${pB[1] + 5}" text-anchor="middle" class="zlf-branch">${m.z}</text><text x="${pOrg[0]}" y="${pOrg[1] + 5}" text-anchor="middle" class="zlf-organ">${ZLF_ORG[i]}</text><text x="${pMer[0]}" y="${pMer[1] + 4}" text-anchor="middle" class="zlf-meridian">${zlfShortName(i)}</text>`;
    if (ZLF.layers.yinyang)
      g += `<text x="${pYy[0]}" y="${pYy[1] + 3}" text-anchor="middle" class="zlf-yy">${m.yy}</text>`;
    if (ZLF.layers.element) {
      const pw = zlfPt(315, a);
      g += `<text x="${pw[0]}" y="${pw[1] + 3}" text-anchor="middle" class="zlf-wx" style="fill:${col}">${m.wx}</text>`;
    }
    const pt = zlfPt(371, a);
    g += `<text x="${pt[0]}" y="${pt[1] + 3}" text-anchor="middle" class="zlf-time">${m.h}</text>`;
  }
  [120, 170, 205, 250, 280, 326, 354, 384].forEach(
    (r, j) => (g += `<circle r="${r}" class="zlf-ring${j === 2 || j === 5 ? " strong" : ""}"/>`),
  );
  for (let i = 0; i < 12; i++) {
    const a = i * 30 - 15,
      p1 = zlfPt(205, a),
      p2 = zlfPt(354, a);
    g += `<line x1="${p1[0]}" y1="${p1[1]}" x2="${p2[0]}" y2="${p2[1]}" class="zlf-sep"/>`;
  }
  if (ZLF.layers.flow) {
    for (let i = 0; i < 12; i++) {
      const a = i * 30,
        g0 = a + 6,
        g1 = a + 24;
      g += `<path d="${zlfArc(178, g0, g1)}" class="zlf-flow" marker-end="url(#zlfArr)"/>`;
    }
  }
  if (ZLF.layers.pair) {
    for (let i = 0; i < 12; i += 2) {
      const j = i + 1,
        p1 = zlfPt(150, i * 30),
        p2 = zlfPt(150, j * 30),
        mid = [(p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2];
      g += `<line x1="${p1[0]}" y1="${p1[1]}" x2="${p2[0]}" y2="${p2[1]}" class="zlf-pair"/><text x="${mid[0]}" y="${mid[1] - 4}" text-anchor="middle" class="zlf-pair-label">表里</text>`;
    }
  }
  if (ZLF.layers.clock) {
    for (let h = 0; h < 24; h++) {
      const a = h * 15,
        p1 = zlfPt(h % 2 === 0 ? 384 : 378, a),
        p2 = zlfPt(392, a);
      g += `<line x1="${p1[0]}" y1="${p1[1]}" x2="${p2[0]}" y2="${p2[1]}" class="zlf-hourtick"/>`;
      if (h % 2 === 0) {
        const p = zlfPt(405, a);
        g += `<text x="${p[0]}" y="${p[1] + 3}" text-anchor="middle" class="zlf-hourtxt">${h}</text>`;
      }
    }
  }
  const frac = (C.c.h + (C.c.mi || 0) / 60) * 15,
    ph = zlfPt(188, frac);
  g += `<line x1="0" y1="0" x2="${ph[0]}" y2="${ph[1]}" class="zlf-hand"/><circle cx="0" cy="0" r="6" class="zlf-hand-dot"/>`;
  const ps = zlfPt(196, sel * 30);
  g += `<line x1="0" y1="0" x2="${ps[0]}" y2="${ps[1]}" class="zlf-selhand"/>`;
  const prog = (C.elapsed / 120) * 30,
    pa0 = C.idx * 30 - 15,
    pa1 = pa0 + prog;
  g += `<path d="${zlfArc(358, pa0, pa1)}" class="zlf-progress"/>`;
  const M = JL_MER[sel];
  g += `<circle r="112" class="zlf-core"/><text x="0" y="-30" text-anchor="middle" class="zlf-core-big">${M.z}时 · ${ZLF_ORG[sel]}</text><text x="0" y="-7" text-anchor="middle" class="zlf-core-mid">${M.n}</text><text x="0" y="14" text-anchor="middle" class="zlf-core-sm">${M.h} · ${M.yy}经 · ${M.wx}</text><text x="0" y="39" text-anchor="middle" class="zlf-core-sm">${sel === C.idx ? "当前当令" : "手动观察"} · 流注第 ${sel + 1}/12 站</text>`;
  return g;
}
function zlfInfo(C, sel) {
  const box = $("#zlfInfo");
  if (!box) return;
  const M = JL_MER[sel],
    cur = JL_MER[C.idx],
    P = JL_MER[ZLF_PAIR[sel]],
    prev = JL_MER[(sel + 11) % 12],
    next = JL_MER[(sel + 1) % 12],
    remain = Math.max(0, 120 - C.elapsed),
    norm = zlfNormWx(M.wx);
  box.innerHTML = `<h4>子午流注读数</h4><div class="zlf-nowbox"><div><small>当前真实时辰</small><b>${cur.z}时 · ${ZLF_ORG[C.idx]}</b></div><div><small>当前观察</small><b>${M.z}时 · ${ZLF_ORG[sel]}</b></div></div><div class="zlf-facts"><span>时段</span><b>${M.h}</b><span>经脉</span><b>${M.n}</b><span>脏腑</span><b>${ZLF_ORG[sel]}</b><span>阴阳</span><b>${M.yy}经</b><span>五行</span><b>${M.wx}</b><span>表里相配</span><b>${P.n}（${ZLF_ORG[ZLF_PAIR[sel]]}）</b><span>前一时辰</span><b>${prev.z} · ${ZLF_ORG[(sel + 11) % 12]}</b><span>后一时辰</span><b>${next.z} · ${ZLF_ORG[(sel + 1) % 12]}</b>${sel === C.idx ? `<span>本时段进度</span><b>约 ${Math.round(C.elapsed)} / 120 分钟 · 距交接约 ${Math.round(remain)} 分钟</b>` : ""}</div><div class="zlf-info-card"><b>传统说明：</b>${M.d}</div><div class="zlf-info-card"><b>读图方法：</b>红色指针表示输入时刻在 24 小时中的真实位置；红框是当令经脉；金框是你正在研究的经脉。金色小箭头表示传统的十二经脉流注次序，青色虚线表示表里配对。</div><div class="zlf-info-card"><b>五行关系：</b>${M.n}在本页归为${M.wx}；用于和已有五行、脏腑、地支模块做传统对应。这里只展示体系内部关系，不把“当令”解释为医学意义上的器官活性测量。</div><div class="zlf-info-card"><b>相关模块联动</b><div class="zlf-links"><button class="gbtn sm" data-zlflink="jingluo">经络详页</button><button class="gbtn sm" data-zlflink="body">人体图谱</button><button class="gbtn sm" data-zlflink="bridge">地支枢纽</button><button class="gbtn sm" data-zlflink="wxflow">五行流通</button><button class="gbtn sm" data-zlflink="now">此刻</button></div></div><div class="zlf-legend"><span style="color:var(--wood)">木</span><span style="color:var(--fire)">火 / 相火</span><span style="color:var(--earth)">土</span><span style="color:var(--metal)">金</span><span style="color:var(--water)">水</span></div>`;
}
function zlfTimeline(C, sel) {
  const w = $("#zlfHours");
  if (!w) return;
  w.innerHTML = JL_MER.map(
    (m, i) =>
      `<button class="zlf-hcell${i === sel ? " on" : ""}${i === C.idx ? " cur" : ""}" data-zlfhour="${i}"><b>${m.z} · ${ZLF_ORG[i]}</b><span>${m.n}</span><small>${m.h} · ${m.yy} · ${m.wx}</small></button>`,
  ).join("");
}
function zlfRender(sound = false) {
  const s = $("#zlfSvg");
  if (!s) return;
  const C = zlfCurrent();
  if (ZLF.follow) ZLF.sel = C.idx;
  const sel = ZLF.sel;
  s.innerHTML = zlfSvg(C, sel);
  zlfInfo(C, sel);
  zlfTimeline(C, sel);
  zlfViewApply();
  const dt = $("#zlfDt");
  if (dt && document.activeElement !== dt) dt.value = zlfFmt(C.c);
  $("#zlfFollow")?.classList.toggle("on", !!ZLF.follow);
  $("#zlfManual")?.classList.toggle("on", !ZLF.follow);
  if (sound) zlfSound(sel === C.idx);
}
function zlfShift(mins) {
  const c = ZLF.civ || zlfNow(),
    d = new Date(Date.UTC(c.y, c.m - 1, c.d, c.h, c.mi || 0));
  d.setUTCMinutes(d.getUTCMinutes() + mins);
  ZLF.civ = {
    y: d.getUTCFullYear(),
    m: d.getUTCMonth() + 1,
    d: d.getUTCDate(),
    h: d.getUTCHours(),
    mi: d.getUTCMinutes(),
    s: 0,
  };
  ZLF.follow = 1;
  zlfRender(true);
}
function zlfStepMinutes() {
  return ZLF.step === "min10" ? 10 : ZLF.step === "min30" ? 30 : 120;
}
function zlfPlayToggle() {
  if (ZLF.play) {
    zlfStop();
    return;
  }
  ZLF.follow = 1;
  ZLF.play = setInterval(() => zlfShift(zlfStepMinutes()), 760);
  const b = $("#zlfPlay");
  if (b) b.textContent = "■ 停止演示";
}
function zlfSelect(i, manual = true) {
  i = ((+i % 12) + 12) % 12;
  ZLF.sel = i;
  if (manual) ZLF.follow = 0;
  zlfRender(true);
}
function zlfOpen() {
  const pane = $("#pane-studio");
  if (!pane) return;
  if (STU.active) studioLeave();
  try {
    msgStop();
    htdStop();
    xapStop();
    typStop();
    qtpStop();
    lrpStop();
  } catch (_) {}
  zlfStop();
  PANLIB.mode = "ziwuliuzhu";
  document.body.classList.add("studio-mode");
  delete pane.dataset.ui;
  pane.dataset.built = "1";
  ZLF.civ = ZLF.civ || zlfNow();
  const C = zlfCurrent();
  if (ZLF.follow) ZLF.sel = C.idx;
  pane.innerHTML = `<div class="zlf-shell" id="zlfShell"><div class="zlf-top"><button class="gbtn sm" id="zlfBack">← 盘库</button><div class="zlf-title"><b>子午流注 · 十二经脉时辰盘</b><small>十二时辰 · 十二经脉 · 阴阳五行 · 表里配对 · 流注次序</small></div><button class="gbtn sm" id="zlfJing">打开经络详页</button><button class="gbtn sm" id="zlfBody">打开人体图谱</button><button class="gbtn sm" id="zlfFs">全屏</button></div><div class="zlf-grid"><aside class="panel zlf-side"><h4>时间与模式</h4><div class="zlf-group"><label>日期时间<input type="datetime-local" id="zlfDt" value="${zlfFmt(ZLF.civ)}"></label><div class="zlf-btnrow"><button class="gbtn sm" id="zlfNow">此刻 · 归位</button><button class="gbtn sm" id="zlfPrev">←</button><button class="gbtn sm" id="zlfNext">→</button></div><label>演示步长<select id="zlfStep"><option value="min10"${ZLF.step === "min10" ? " selected" : ""}>10 分钟</option><option value="min30"${ZLF.step === "min30" ? " selected" : ""}>30 分钟</option><option value="hour2"${ZLF.step === "hour2" ? " selected" : ""}>1 个时辰（2小时）</option></select></label><button class="gbtn sm" id="zlfPlay">▶ 十二时辰演示</button></div><div class="zlf-group"><div class="zlf-mode"><button class="gbtn sm" id="zlfFollow">跟随时辰</button><button class="gbtn sm" id="zlfManual">手动观察</button></div><p class="note">手动观察只切换经脉说明，不修改输入时间；“跟随时辰”会重新锁定真实当令经脉。</p></div><div class="zlf-group"><h4>显示层</h4>${[
    ["flow", "流注次序", "十二经依次传注"],
    ["pair", "表里配对", "六组表里经"],
    ["element", "五行", "木火土金水 / 相火"],
    ["yinyang", "阴阳", "手足三阴三阳"],
    ["clock", "24小时刻度", "外圈现代时钟对照"],
  ]
    .map(
      ([k, n, d]) =>
        `<label class="zlf-layer"><input type="checkbox" data-zlfl="${k}"${ZLF.layers[k] ? " checked" : ""}><span>${n}<small>${d}</small></span></label>`,
    )
    .join(
      "",
    )}</div></aside><section class="zlf-main"><div class="zlf-viewbar"><button class="gbtn sm" id="zlfSelectMode">选择经脉</button><button class="gbtn sm" id="zlfPan">查看平移</button><span class="hint">点扇区选经脉 · 滚轮缩放 · 查看模式拖动画面</span><button class="gbtn sm" id="zlfFit">↙↗ 适应</button><span class="zlf-z"><button class="gbtn sm" id="zlfZm">−</button><span id="zlfZoom">100%</span><button class="gbtn sm" id="zlfZp">＋</button></span></div><div class="zlf-frame" id="zlfFrame"><svg id="zlfSvg" viewBox="-430 -430 860 860" role="img" aria-label="子午流注十二经脉时辰盘"></svg></div><div class="panel zlf-timeline"><div class="zlf-timeline-head"><b>二十四小时 · 十二经脉流注时间轴</b><small>红框=真实当令 · 金框=当前观察</small></div><div class="zlf-hours" id="zlfHours"></div></div><details class="panel zlf-guide" open><summary>如何读这张时辰盘</summary><div class="zlf-guide-grid"><button data-zlfteach="0"><b>① 子时从胆经开始</b><span>23–1 点为子时，圆盘从胆经依次流转。</span></button><button data-zlfteach="2"><b>② 看阴阳与五行</b><span>每条经脉同时标注阴阳属性和五行归类。</span></button><button data-zlfteach="4"><b>③ 看表里配对</b><span>胆肝、肺大肠、胃脾等六组表里经互相对应。</span></button><button data-zlfteach="6"><b>④ 看交接而非开关</b><span>传统模型按两小时分段，本页用进度弧显示时段位置。</span></button></div></details></section><aside class="panel zlf-info" id="zlfInfo"></aside></div><div class="panel zlf-bottom"><b>重要说明：</b>子午流注是传统中医时间理论，把十二时辰与十二经脉按固定次序对应。本页用于传统医学史、经络体系和时间模型的学习与可视化；“某经当令”不是现代医学意义上的器官活性测量，也不能用于诊断、处方或自行取穴治疗。已有经络页中的脏腑、奇经八脉和人体图谱可从右侧联动查看。</div></div>`;
  zlfBind();
  zlfRender(false);
}
function zlfBind() {
  const pane = $("#pane-studio"),
    svg = $("#zlfSvg"),
    frame = $("#zlfFrame");
  if (!pane || !svg) return;
  $("#zlfBack").onclick = () => {
    zlfStop();
    plHub();
  };
  $("#zlfNow").onclick = () => {
    ZLF.civ = zlfNow();
    ZLF.follow = 1;
    zlfFit();
    zlfRender(true);
  };
  $("#zlfPrev").onclick = () => zlfShift(-zlfStepMinutes());
  $("#zlfNext").onclick = () => zlfShift(zlfStepMinutes());
  $("#zlfStep").onchange = (e) => (ZLF.step = e.target.value);
  $("#zlfPlay").onclick = zlfPlayToggle;
  $("#zlfDt").onchange = (e) => {
    const c = zlfParse(e.target.value);
    if (c) {
      ZLF.civ = c;
      ZLF.follow = 1;
      zlfRender(true);
    }
  };
  $("#zlfFollow").onclick = () => {
    ZLF.follow = 1;
    zlfRender(true);
  };
  $("#zlfManual").onclick = () => {
    ZLF.follow = 0;
    zlfRender(false);
  };
  $$("[data-zlfl]", pane).forEach(
    (c) =>
      (c.onchange = () => {
        ZLF.layers[c.dataset.zlfl] = c.checked ? 1 : 0;
        zlfRender(false);
      }),
  );
  const mode = (m) => {
    ZLF.gesture = m;
    frame.classList.toggle("pan", m === "pan");
    $("#zlfSelectMode").classList.toggle("on", m === "select");
    $("#zlfPan").classList.toggle("on", m === "pan");
  };
  $("#zlfSelectMode").onclick = () => mode("select");
  $("#zlfPan").onclick = () => mode("pan");
  mode(ZLF.gesture);
  $("#zlfFit").onclick = zlfFit;
  $("#zlfZm").onclick = () => {
    const r = svg.getBoundingClientRect();
    zlfZoomAt(1.18, r.left + r.width / 2, r.top + r.height / 2);
  };
  $("#zlfZp").onclick = () => {
    const r = svg.getBoundingClientRect();
    zlfZoomAt(0.84, r.left + r.width / 2, r.top + r.height / 2);
  };
  svg.addEventListener(
    "wheel",
    (e) => {
      e.preventDefault();
      zlfZoomAt(e.deltaY < 0 ? 0.86 : 1.16, e.clientX, e.clientY);
    },
    { passive: false },
  );
  let drag = null;
  svg.addEventListener("pointerdown", (e) => {
    if (e.button > 0 || ZLF.gesture !== "pan") return;
    drag = {
      id: e.pointerId,
      x: e.clientX,
      y: e.clientY,
      vx: ZLF.view.x,
      vy: ZLF.view.y,
      w: ZLF.view.w,
      h: ZLF.view.h,
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
    ZLF.view.x = drag.vx - (e.clientX - drag.x) * kx;
    ZLF.view.y = drag.vy - (e.clientY - drag.y) * ky;
    zlfViewApply();
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
    if (ZLF.gesture !== "select") return;
    const sec = e.target.closest && e.target.closest("[data-zlfi]");
    if (sec) zlfSelect(+sec.dataset.zlfi, true);
  });
  pane.addEventListener("click", (e) => {
    const h = e.target.closest("[data-zlfhour]");
    if (h) {
      zlfSelect(+h.dataset.zlfhour, true);
      return;
    }
    const t = e.target.closest("[data-zlfteach]");
    if (t) {
      zlfSelect(+t.dataset.zlfteach, true);
      return;
    }
    const l = e.target.closest("[data-zlflink]");
    if (l) {
      const k = l.dataset.zlflink,
        sel = ZLF.sel;
      zlfStop();
      if (k === "jingluo") {
        selectTab("jingluo", true);
        setTimeout(() => {
          try {
            jlSelect(sel);
          } catch (_) {}
        }, 120);
      } else if (k === "body") {
        try {
          BD.layer = "zf";
          const org = ZLF_ORG[sel],
            o = BD_ZF.find((x) => x.n === org);
          BD.sel = o ? o.k : null;
        } catch (_) {}
        selectTab("jingluo", true);
        setTimeout(() => {
          try {
            jingluoRefresh();
          } catch (_) {}
        }, 100);
      } else if (k === "bridge") {
        try {
          fxSet("zhi", sel, "子午流注");
        } catch (_) {}
        selectTab("bridge", true);
      } else selectTab(k, true);
    }
  });
  $("#zlfJing").onclick = () => {
    const sel = ZLF.sel;
    zlfStop();
    selectTab("jingluo", true);
    setTimeout(() => {
      try {
        jlSelect(sel);
      } catch (_) {}
    }, 120);
  };
  $("#zlfBody").onclick = () => {
    const sel = ZLF.sel;
    try {
      BD.layer = "zf";
      const org = ZLF_ORG[sel],
        o = BD_ZF.find((x) => x.n === org);
      BD.sel = o ? o.k : null;
    } catch (_) {}
    zlfStop();
    selectTab("jingluo", true);
    setTimeout(() => {
      try {
        jingluoRefresh();
      } catch (_) {}
    }, 100);
  };
  $("#zlfFs").onclick = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await $("#zlfShell").requestFullscreen();
    } catch (e) {
      toast("当前浏览器不允许全屏");
    }
  };
  if (!window.__ZLF_FS) {
    window.__ZLF_FS = 1;
    document.addEventListener("fullscreenchange", () => {
      const b = $("#zlfFs");
      if (b) b.textContent = document.fullscreenElement ? "退出全屏" : "全屏";
    });
  }
}
/* 盘库入口：正式加入第 09 盘。 */
const plHub_v48_zlf = plHub;
plHub = function () {
  zlfStop();
  plHub_v48_zlf();
  const pane = $("#pane-studio");
  if (!pane) return;
  const cnt = pane.querySelector(".pl-count b");
  if (cnt) cnt.textContent = "09";
  const f = pane.querySelector(".pl-card.future");
  if (f)
    f.outerHTML = `<article class="panel pl-card" data-pl="ziwuliuzhu"><span class="num">09 · 择时养生</span><span class="enter">↗</span><h3>子午流注 · 十二经脉时辰盘</h3><p>十二时辰与十二经脉顺序环布，叠加阴阳、五行、脏腑、表里配对和流注交接，并与现有经络人体图谱联动。</p><div class="tags"><span>子午流注</span><span>十二经脉</span><span>表里五行</span></div></article><article class="panel pl-card future"><span class="num">NEXT · 择时养生</span><span class="enter">待建</span><h3>灵龟八法 · 飞腾八法时盘</h3><p>下一项研究传统按日时干支推取八脉交会穴的择时系统，以时间算法、八脉对应和开穴结果为核心，并严格标注为历史医籍算法展示。</p><div class="tags"><span>灵龟八法</span><span>飞腾八法</span><span>八脉交会</span></div></article>`;
  const c = pane.querySelector('[data-pl="ziwuliuzhu"]');
  if (c) c.onclick = () => zlfOpen();
};
const plClose_v49_zlf = plClose;
plClose = function () {
  zlfStop();
  return plClose_v49_zlf();
};
try {
  const g = NAV_G.find((x) => x.g === "盘库");
  if (g && g.it && g.it[0]) {
    g.it[0][2] = "天机巨盘、罗经三盘、三式、全天星图、浑天仪、十二消息卦、子午流注及后续独立盘";
    g.it[0][3] +=
      " 子午流注 十二经脉 时辰盘 胆经 肝经 肺经 大肠经 胃经 脾经 心经 小肠经 膀胱经 肾经 心包经 三焦经 表里配对 经络时辰";
  }
} catch (_) {}
