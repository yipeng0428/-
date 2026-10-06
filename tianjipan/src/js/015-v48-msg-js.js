/* ===== v48 · 盘库 08：十二消息卦 · 阴阳消长圆图 ===== */
const MSG = {
  civ: null,
  follow: 1,
  sel: 0,
  play: null,
  step: "month",
  gesture: "select",
  view: { x: -430, y: -430, w: 860, h: 860 },
  layers: { terms: 1, branch: 1, gua: 1, yao: 1, curve: 1 },
  infoSel: null,
};
const MSG_DATA = [
  {
    b: 0,
    z: "子",
    mo: "十一月",
    n: "复",
    u: "䷗",
    yang: 1,
    bits: [1, 0, 0, 0, 0, 0],
    terms: ["大雪", "冬至"],
    phase: "一阳来复",
    desc: "阳气自下初生；六爻中只有初爻为阳。",
  },
  {
    b: 1,
    z: "丑",
    mo: "十二月",
    n: "临",
    u: "䷒",
    yang: 2,
    bits: [1, 1, 0, 0, 0, 0],
    terms: ["小寒", "大寒"],
    phase: "二阳渐长",
    desc: "阳爻由下继续增长至二爻。",
  },
  {
    b: 2,
    z: "寅",
    mo: "正月",
    n: "泰",
    u: "䷊",
    yang: 3,
    bits: [1, 1, 1, 0, 0, 0],
    terms: ["立春", "雨水"],
    phase: "三阳开泰",
    desc: "下三爻皆阳，上三爻皆阴，阴阳各半。",
  },
  {
    b: 3,
    z: "卯",
    mo: "二月",
    n: "大壮",
    u: "䷡",
    yang: 4,
    bits: [1, 1, 1, 1, 0, 0],
    terms: ["惊蛰", "春分"],
    phase: "四阳盛长",
    desc: "阳势继续上升，四阳二阴。",
  },
  {
    b: 4,
    z: "辰",
    mo: "三月",
    n: "夬",
    u: "䷪",
    yang: 5,
    bits: [1, 1, 1, 1, 1, 0],
    terms: ["清明", "谷雨"],
    phase: "五阳决阴",
    desc: "仅上爻一阴，阳气接近极盛。",
  },
  {
    b: 5,
    z: "巳",
    mo: "四月",
    n: "乾",
    u: "䷀",
    yang: 6,
    bits: [1, 1, 1, 1, 1, 1],
    terms: ["立夏", "小满"],
    phase: "六阳纯乾",
    desc: "六爻皆阳，在消息卦序列中为阳极。",
  },
  {
    b: 6,
    z: "午",
    mo: "五月",
    n: "姤",
    u: "䷫",
    yang: 5,
    bits: [0, 1, 1, 1, 1, 1],
    terms: ["芒种", "夏至"],
    phase: "一阴始生",
    desc: "阴气自下初生，阳气开始消退。",
  },
  {
    b: 7,
    z: "未",
    mo: "六月",
    n: "遁",
    u: "䷠",
    yang: 4,
    bits: [0, 0, 1, 1, 1, 1],
    terms: ["小暑", "大暑"],
    phase: "二阴渐长",
    desc: "下二爻为阴，阴气继续上升。",
  },
  {
    b: 8,
    z: "申",
    mo: "七月",
    n: "否",
    u: "䷋",
    yang: 3,
    bits: [0, 0, 0, 1, 1, 1],
    terms: ["立秋", "处暑"],
    phase: "三阴三阳",
    desc: "下三爻阴、上三爻阳，与泰卦形成对照。",
  },
  {
    b: 9,
    z: "酉",
    mo: "八月",
    n: "观",
    u: "䷓",
    yang: 2,
    bits: [0, 0, 0, 0, 1, 1],
    terms: ["白露", "秋分"],
    phase: "四阴渐盛",
    desc: "四阴二阳，阳气进一步退藏。",
  },
  {
    b: 10,
    z: "戌",
    mo: "九月",
    n: "剥",
    u: "䷖",
    yang: 1,
    bits: [0, 0, 0, 0, 0, 1],
    terms: ["寒露", "霜降"],
    phase: "五阴剥阳",
    desc: "只剩上爻一阳，阳气将尽。",
  },
  {
    b: 11,
    z: "亥",
    mo: "十月",
    n: "坤",
    u: "䷁",
    yang: 0,
    bits: [0, 0, 0, 0, 0, 0],
    terms: ["立冬", "小雪"],
    phase: "六阴纯坤",
    desc: "六爻皆阴，在消息卦序列中为阴极，随后转入复卦。",
  },
];
const MSG_OPP = [6, 7, 8, 9, 10, 11, 0, 1, 2, 3, 4, 5];
const msgNow = () => {
  const n = nowBJ();
  return { y: n.y, m: n.m, d: n.d, h: n.h, mi: n.mi || 0, s: 0 };
};
const msgFmt = (c) => `${c.y}-${f2(c.m)}-${f2(c.d)}T${f2(c.h)}:${f2(c.mi || 0)}`;
function msgParse(s) {
  const m = (s || "").match(/^(\d{4})-(\d\d)-(\d\d)T(\d\d):(\d\d)/);
  return m ? { y: +m[1], m: +m[2], d: +m[3], h: +m[4], mi: +m[5], s: 0 } : null;
}
function msgStop() {
  if (MSG.play) {
    clearInterval(MSG.play);
    MSG.play = null;
  }
  const b = $("#msgPlay");
  if (b) b.textContent = "▶ 年度播放";
}
function msgCalc() {
  const c = MSG.civ || msgNow();
  let rr = null,
    idx = 0;
  try {
    rr = compute(c);
    idx = rr.bz.pill[1].b;
  } catch (e) {
    const jd = jdFromGreg(c.y, c.m, c.d, c.h, c.mi || 0, 0) - 8 / 24,
      lon = smSun(jd).lon;
    idx = ((Math.floor(((lon - 255 + 360) % 360) / 30) % 12) + 12) % 12;
  }
  const jd = jdFromGreg(c.y, c.m, c.d, c.h, c.mi || 0, 0) - 8 / 24,
    sun = smSun(jd),
    term = TERMS[Math.floor((((sun.lon % 360) + 360) % 360) / 15) % 24];
  return { c, rr, idx, sun, term };
}
function msgNextTerm(c) {
  try {
    const cur = jdFromGreg(c.y, c.m, c.d, c.h, c.mi || 0, 0),
      A = calTerms(c.y).concat(calTerms(c.y + 1));
    let best = null;
    for (const t of A) {
      const b = t.bj || {},
        y = b.y || c.y,
        j = jdFromGreg(y, b.m, b.d, b.h || 0, b.mi || 0, 0);
      if (j > cur + 1e-6 && (!best || j < best.j)) best = { t, j, y };
    }
    if (best) return { name: best.t.name, days: best.j - cur, bj: best.t.bj };
  } catch (e) {}
  return null;
}
function msgP(r, a) {
  const p = p5Pt(r, a);
  return [p[0], p[1]];
}
function msgTxt(r, a, txt, fs = 10, cls = "") {
  const p = msgP(r, a);
  return `<text x="${p[0].toFixed(1)}" y="${(p[1] + fs * 0.32).toFixed(1)}" text-anchor="middle" class="${cls}" font-size="${fs}">${esc(String(txt))}</text>`;
}
function msgLine(r0, r1, a, cls = "msg-sep") {
  const p0 = msgP(r0, a),
    p1 = msgP(r1, a);
  return `<line x1="${p0[0].toFixed(1)}" y1="${p0[1].toFixed(1)}" x2="${p1[0].toFixed(1)}" y2="${p1[1].toFixed(1)}" class="${cls}"/>`;
}
function msgSector(r0, r1, a0, a1, cls, i) {
  return `<path d="${p5Arc(r0, r1, a0, a1)}" class="msg-sector ${cls}" data-msgi="${i}"/>`;
}
function msgHexAt(r, a, bits, scale = 1) {
  const p = msgP(r, a),
    rot = a;
  let s = `<g transform="translate(${p[0].toFixed(1)} ${p[1].toFixed(1)}) rotate(${rot})" pointer-events="none">`;
  for (let j = 0; j < 6; j++) {
    const y = (15 - j * 6) * scale,
      w = 28 * scale,
      g = 5 * scale;
    if (bits[j])
      s += `<line x1="${(-w / 2).toFixed(1)}" y1="${y.toFixed(1)}" x2="${(w / 2).toFixed(1)}" y2="${y.toFixed(1)}" class="msg-yao-y"/>`;
    else
      s += `<line x1="${(-w / 2).toFixed(1)}" y1="${y.toFixed(1)}" x2="${(-g / 2).toFixed(1)}" y2="${y.toFixed(1)}" class="msg-yao-n"/><line x1="${(g / 2).toFixed(1)}" y1="${y.toFixed(1)}" x2="${(w / 2).toFixed(1)}" y2="${y.toFixed(1)}" class="msg-yao-n"/>`;
  }
  return s + "</g>";
}
function msgViewApply() {
  const svg = $("#msgSvg");
  if (svg) svg.setAttribute("viewBox", `${MSG.view.x} ${MSG.view.y} ${MSG.view.w} ${MSG.view.h}`);
  const z = $("#msgZoom");
  if (z) z.textContent = Math.round((860 / MSG.view.w) * 100) + "%";
}
function msgFit() {
  MSG.view = { x: -430, y: -430, w: 860, h: 860 };
  msgViewApply();
}
function msgZoomAt(f, cx, cy) {
  const svg = $("#msgSvg"),
    v = MSG.view;
  if (!svg) return;
  const r = svg.getBoundingClientRect(),
    px = v.x + ((cx - r.left) / r.width) * v.w,
    py = v.y + ((cy - r.top) / r.height) * v.h,
    nw = Math.max(220, Math.min(1500, v.w * f)),
    nh = nw,
    q = nw / v.w;
  v.x = px - (px - v.x) * q;
  v.y = py - (py - v.y) * q;
  v.w = nw;
  v.h = nh;
  msgViewApply();
}
function msgRender(sound = false) {
  const svg = $("#msgSvg");
  if (!svg) return;
  const D = msgCalc(),
    cur = D.idx,
    act = MSG.follow ? cur : MSG.sel;
  MSG.sel = act;
  let g = "";
  g += `<circle r="405" class="msg-ring strong"/><circle r="335" class="msg-ring"/><circle r="285" class="msg-ring strong"/><circle r="213" class="msg-ring"/><circle r="122" class="msg-ring strong"/>`;
  for (let i = 0; i < 12; i++) {
    const M = MSG_DATA[i],
      a = i * 30,
      cls =
        (i < 6 ? "wax" : "wane") + (i === cur ? " current" : "") + (i === act ? " selected" : "");
    g += msgSector(213, 405, a - 15, a + 15, cls, i);
    g += msgLine(122, 405, a - 15, i % 3 === 0 ? "msg-sep major" : "msg-sep");
    if (MSG.layers.branch) {
      g += msgTxt(365, a, M.z, 13, "msg-branch") + msgTxt(387, a, M.mo, 8, "msg-month");
    }
    if (MSG.layers.gua) {
      g += msgTxt(306, a, M.n, 20, "msg-name");
    }
    if (MSG.layers.yao) g += msgHexAt(258, a, M.bits, 0.88);
    if (MSG.layers.terms) {
      g +=
        msgTxt(
          397,
          a - 7.5,
          M.terms[0],
          8.5,
          `msg-term${D.term === M.terms[0] ? " current" : ""}`,
        ) +
        msgTxt(397, a + 7.5, M.terms[1], 8.5, `msg-term${D.term === M.terms[1] ? " current" : ""}`);
    }
  }
  if (MSG.layers.curve) {
    const yp = [],
      ip = [];
    for (let i = 0; i < 12; i++) {
      const y = MSG_DATA[i].yang,
        yn = 6 - y;
      yp.push(msgP(128 + y * 12, i * 30));
      ip.push(msgP(128 + yn * 12, i * 30));
    }
    g += `<polygon points="${yp.map((p) => p.map((x) => x.toFixed(1)).join(",")).join(" ")}" class="msg-yang-area"/><polyline points="${ip
      .concat([ip[0]])
      .map((p) => p.map((x) => x.toFixed(1)).join(","))
      .join(" ")}" class="msg-yin-line"/>`;
    yp.forEach(
      (p) =>
        (g += `<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="2.8" class="msg-yang-dot"/>`),
    );
    ip.forEach(
      (p) =>
        (g += `<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="2.3" class="msg-yin-dot"/>`),
    );
  }
  const A = MSG_DATA[act],
    ang = act * 30,
    p0 = msgP(122, ang),
    p1 = msgP(410, ang);
  g += `<line x1="${p0[0].toFixed(1)}" y1="${p0[1].toFixed(1)}" x2="${p1[0].toFixed(1)}" y2="${p1[1].toFixed(1)}" class="msg-pointer"/><circle cx="${p1[0].toFixed(1)}" cy="${p1[1].toFixed(1)}" r="5" class="msg-pointer-dot"/><circle r="112" class="msg-core"/><text x="0" y="-26" text-anchor="middle" class="msg-core-name">${A.u} ${A.n}</text><text x="0" y="0" text-anchor="middle" class="msg-core-num">${A.z}月 · ${A.mo} · ${A.phase}</text><text x="0" y="22" text-anchor="middle" class="msg-core-sub">阳 ${A.yang} · 阴 ${6 - A.yang} · ${MSG.follow ? "跟随真实时令" : "手动观察"}</text><text x="0" y="43" text-anchor="middle" class="msg-core-sub">${A.terms.join(" · ")}</text>`;
  svg.innerHTML = g;
  msgViewApply();
  msgInfo(D, act);
  msgTimeline(D, act);
  const dt = $("#msgDt");
  if (dt && document.activeElement !== dt) dt.value = msgFmt(D.c);
  $("#msgFollow") && $("#msgFollow").classList.toggle("on", MSG.follow);
  $("#msgManual") && $("#msgManual").classList.toggle("on", !MSG.follow);
  if (sound)
    try {
      if (STU.sfx) stuSfxTick(0.22, false, 1, 0.25);
    } catch (_) {}
}
function msgInfo(D, i) {
  const box = $("#msgInfo");
  if (!box) return;
  const M = MSG_DATA[i],
    O = MSG_DATA[MSG_OPP[i]],
    prev = MSG_DATA[(i + 11) % 12],
    next = MSG_DATA[(i + 1) % 12],
    nt = msgNextTerm(D.c),
    cur = MSG_DATA[D.idx],
    status = i === D.idx ? "当前真实时令" : MSG.follow ? "跟随时令" : "手动研究";
  box.innerHTML = `<h4>消息卦读数</h4><div class="msg-balance"><div class="yang"><small>阳爻</small><b>${M.yang}</b></div><div class="yin"><small>阴爻</small><b>${6 - M.yang}</b></div></div><div class="msg-facts"><span>当前选择</span><b>${M.u} ${M.n} · ${M.z}月 · ${M.mo}</b><span>状态</span><b>${status}</b><span>时令实况</span><b>${cur.n}卦 · ${cur.z}月 · ${D.term}</b><span>节气</span><b>${M.terms.join(" / ")}</b><span>消长阶段</span><b>${M.phase}</b><span>六个月对卦</span><b>${O.n} · ${O.z}月</b><span>前一月</span><b>${prev.n} → ${M.n}</b><span>后一月</span><b>${M.n} → ${next.n}</b>${nt ? `<span>下一节气</span><b>${nt.name} · 约 ${nt.days.toFixed(1)} 天后</b>` : ""}</div><div class="msg-info-card"><b>结构：</b>${M.desc}<br>${i < 6 ? "从复到乾，阳爻由下向上逐层增加，表示“息”——增长。" : "从姤到坤，阴爻由下向上逐层增加，阳爻相应消退，表示“消”。"}</div><div class="msg-info-card"><b>月建与节气：</b>消息卦传统上配十二月建；本页按节气月的十二地支跟随当前时令。需要区分“整个月建”与某个节气的标志性说法，例如“冬至一阳生”发生在子月之中，并不意味着复卦只对应冬至当天。</div><div class="msg-info-card"><b>如何使用：</b>跟随时令时用于观察全年阴阳结构；切到手动后可点任意月份，对比前后卦、对卦、阴阳爻数量，不改变真实日期。</div><div class="msg-info-card"><b>相关盘联动</b><div class="msg-links"><button class="gbtn sm" data-msglink="zy">周易原文</button><button class="gbtn sm" data-msglink="season">时令 · 节气</button><button class="gbtn sm" data-msglink="bridge">地支枢纽</button><button class="gbtn sm" data-msglink="huntian">浑天仪</button><button class="gbtn sm" data-msglink="giant">天机巨盘</button></div></div>`;
}
function msgTimeline(D, act) {
  const w = $("#msgMonths");
  if (!w) return;
  w.innerHTML = MSG_DATA.map(
    (M, i) =>
      `<button class="msg-mcell${i === act ? " on" : ""}${i === D.idx ? " cur" : ""}" data-msgmonth="${i}"><b>${M.n}</b><span>${M.z}月 · 阳${M.yang}阴${6 - M.yang}</span><small>${M.terms.join(" · ")}</small></button>`,
  ).join("");
}
function msgShift(kind, dir) {
  const c = MSG.civ || msgNow(),
    d = new Date(Date.UTC(c.y, c.m - 1, c.d, c.h, c.mi || 0));
  if (kind === "day") d.setUTCDate(d.getUTCDate() + dir);
  else if (kind === "year") d.setUTCFullYear(d.getUTCFullYear() + dir);
  else d.setUTCMonth(d.getUTCMonth() + dir);
  MSG.civ = {
    y: d.getUTCFullYear(),
    m: d.getUTCMonth() + 1,
    d: d.getUTCDate(),
    h: d.getUTCHours(),
    mi: d.getUTCMinutes(),
    s: 0,
  };
  MSG.follow = 1;
  msgRender(true);
}
function msgPlayToggle() {
  if (MSG.play) {
    msgStop();
    return;
  }
  MSG.follow = 1;
  MSG.play = setInterval(() => msgShift("month", 1), 900);
  const b = $("#msgPlay");
  if (b) b.textContent = "■ 停止播放";
}
function msgSelect(i, manual = true) {
  i = ((+i % 12) + 12) % 12;
  MSG.sel = i;
  if (manual) MSG.follow = 0;
  msgRender(true);
}
function msgOpen() {
  const pane = $("#pane-studio");
  if (!pane) return;
  if (STU.active) studioLeave();
  try {
    htdStop();
    xapStop();
    typStop();
    qtpStop();
    lrpStop();
  } catch (_) {}
  msgStop();
  PANLIB.mode = "xiaoxigua";
  document.body.classList.add("studio-mode");
  delete pane.dataset.ui;
  pane.dataset.built = "1";
  MSG.civ = MSG.civ || msgNow();
  const D = msgCalc();
  if (MSG.follow) MSG.sel = D.idx;
  pane.innerHTML = `<div class="msg-shell" id="msgShell"><div class="msg-top"><button class="gbtn sm" id="msgBack">← 盘库</button><div class="msg-title"><b>十二消息卦 · 阴阳消长圆图</b><small>月建 · 二十四节气 · 六爻阴阳 · 复临泰大壮夬乾 · 姤遁否观剥坤</small></div><button class="gbtn sm" id="msgZy">打开周易详页</button><button class="gbtn sm" id="msgSeason">打开时令</button><button class="gbtn sm" id="msgFs">全屏</button></div><div class="msg-grid"><aside class="panel msg-side"><h4>时间与模式</h4><div class="msg-group"><label>日期时间<input type="datetime-local" id="msgDt" value="${msgFmt(MSG.civ)}"></label><div class="msg-btnrow"><button class="gbtn sm" id="msgNow">此刻</button><button class="gbtn sm" id="msgPrev">←</button><button class="gbtn sm" id="msgNext">→</button></div><label>步长<select id="msgStep"><option value="day"${MSG.step === "day" ? " selected" : ""}>1 天</option><option value="month"${MSG.step === "month" ? " selected" : ""}>1 月</option><option value="year"${MSG.step === "year" ? " selected" : ""}>1 年</option></select></label><button class="gbtn sm" id="msgPlay">▶ 年度播放</button></div><div class="msg-group"><div class="msg-mode"><button class="gbtn sm" id="msgFollow">跟随时令</button><button class="gbtn sm" id="msgManual">手动观察</button></div><p class="note">手动观察只改变圆图选中项，不改真实日期；重新点“跟随时令”即可回到当前月建。</p></div><div class="msg-group"><h4>显示层</h4>${[
    ["terms", "二十四节气", "每月两节气"],
    ["branch", "十二月建", "子丑寅卯…"],
    ["gua", "消息卦名", "复临泰…"],
    ["yao", "六爻结构", "阴阳爻图形"],
    ["curve", "阴阳消长曲线", "阳气/阴气数量"],
  ]
    .map(
      ([k, n, d]) =>
        `<label class="msg-layer"><input type="checkbox" data-msgl="${k}"${MSG.layers[k] ? " checked" : ""}><span>${n}<small>${d}</small></span></label>`,
    )
    .join(
      "",
    )}</div></aside><section class="msg-main"><div class="msg-viewbar"><button class="gbtn sm" id="msgSelectMode">选择月份</button><button class="gbtn sm" id="msgPan">查看平移</button><span class="hint">点扇区选卦 · 滚轮缩放 · 查看模式拖动画面</span><button class="gbtn sm" id="msgFit">↙↗ 适应</button><span class="msg-z"><button class="gbtn sm" id="msgZm">−</button><span id="msgZoom">100%</span><button class="gbtn sm" id="msgZp">＋</button></span></div><div class="msg-frame" id="msgFrame"><svg id="msgSvg" viewBox="-430 -430 860 860" role="img" aria-label="十二消息卦阴阳消长圆图"></svg></div><div class="panel msg-timeline"><div class="msg-timeline-head"><b>十二月建 · 消息卦时间轴</b><small>红框=真实时令 · 金框=当前观察</small></div><div class="msg-months" id="msgMonths"></div></div><details class="panel msg-guide" open><summary>如何读这张圆图</summary><div class="msg-guide-grid"><button data-msgteach="0"><b>① 从复卦开始</b><span>子月一阳从初爻生，理解“息”的起点。</span></button><button data-msgteach="5"><b>② 到乾为阳极</b><span>巳月六阳皆备，观察阳爻怎样逐层增加。</span></button><button data-msgteach="6"><b>③ 姤卦一阴生</b><span>午月开始转入“消”，阴爻由下而生。</span></button><button data-msgteach="11"><b>④ 坤极而复</b><span>亥月六阴皆备，下一步重新回到复卦。</span></button></div></details></section><aside class="panel msg-info" id="msgInfo"></aside></div><div class="panel msg-bottom"><b>口径说明：</b>十二消息卦以十二月建配卦，展示阴阳爻逐月增减的传统易学模型。本页“真实时令”以现有历法引擎的节气月支为准；二十四节气同时列出用于理解月令内部的位置。它是一种传统时间象数模型，不等同于现代气象、物理意义上的能量测量。</div></div>`;
  msgBind();
  msgRender(false);
}
function msgBind() {
  const pane = $("#pane-studio"),
    svg = $("#msgSvg"),
    frame = $("#msgFrame");
  if (!pane || !svg) return;
  $("#msgBack").onclick = () => {
    msgStop();
    plHub();
  };
  $("#msgNow").onclick = () => {
    MSG.civ = msgNow();
    MSG.follow = 1;
    msgRender(true);
  };
  $("#msgPrev").onclick = () => msgShift(MSG.step, -1);
  $("#msgNext").onclick = () => msgShift(MSG.step, 1);
  $("#msgStep").onchange = (e) => (MSG.step = e.target.value);
  $("#msgPlay").onclick = msgPlayToggle;
  $("#msgDt").onchange = (e) => {
    const c = msgParse(e.target.value);
    if (c) {
      MSG.civ = c;
      MSG.follow = 1;
      msgRender(true);
    }
  };
  $("#msgFollow").onclick = () => {
    MSG.follow = 1;
    msgRender(true);
  };
  $("#msgManual").onclick = () => {
    MSG.follow = 0;
    msgRender(false);
  };
  $$("[data-msgl]", pane).forEach(
    (c) =>
      (c.onchange = () => {
        MSG.layers[c.dataset.msgl] = c.checked ? 1 : 0;
        msgRender(false);
      }),
  );
  const mode = (m) => {
    MSG.gesture = m;
    frame.classList.toggle("pan", m === "pan");
    $("#msgSelectMode").classList.toggle("on", m === "select");
    $("#msgPan").classList.toggle("on", m === "pan");
  };
  $("#msgSelectMode").onclick = () => mode("select");
  $("#msgPan").onclick = () => mode("pan");
  mode(MSG.gesture);
  $("#msgFit").onclick = msgFit;
  $("#msgZm").onclick = () => {
    const r = svg.getBoundingClientRect();
    msgZoomAt(1.18, r.left + r.width / 2, r.top + r.height / 2);
  };
  $("#msgZp").onclick = () => {
    const r = svg.getBoundingClientRect();
    msgZoomAt(0.84, r.left + r.width / 2, r.top + r.height / 2);
  };
  svg.addEventListener(
    "wheel",
    (e) => {
      e.preventDefault();
      msgZoomAt(e.deltaY < 0 ? 0.86 : 1.16, e.clientX, e.clientY);
    },
    { passive: false },
  );
  let drag = null;
  svg.addEventListener("pointerdown", (e) => {
    if (e.button > 0 || MSG.gesture !== "pan") return;
    drag = {
      id: e.pointerId,
      x: e.clientX,
      y: e.clientY,
      vx: MSG.view.x,
      vy: MSG.view.y,
      w: MSG.view.w,
      h: MSG.view.h,
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
    MSG.view.x = drag.vx - (e.clientX - drag.x) * kx;
    MSG.view.y = drag.vy - (e.clientY - drag.y) * ky;
    msgViewApply();
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
    if (MSG.gesture !== "select") return;
    const sec = e.target.closest && e.target.closest("[data-msgi]");
    if (sec) msgSelect(+sec.dataset.msgi, true);
  });
  pane.addEventListener("click", (e) => {
    const m = e.target.closest("[data-msgmonth]");
    if (m) {
      msgSelect(+m.dataset.msgmonth, true);
      return;
    }
    const t = e.target.closest("[data-msgteach]");
    if (t) {
      msgSelect(+t.dataset.msgteach, true);
      return;
    }
    const l = e.target.closest("[data-msglink]");
    if (l) {
      const k = l.dataset.msglink;
      msgStop();
      if (k === "huntian") htdOpen();
      else if (k === "giant") plOpenGiant();
      else selectTab(k, true);
    }
  });
  $("#msgZy").onclick = () => {
    msgStop();
    selectTab("zy", true);
  };
  $("#msgSeason").onclick = () => {
    msgStop();
    selectTab("season", true);
  };
  $("#msgFs").onclick = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await $("#msgShell").requestFullscreen();
    } catch (e) {
      toast("当前浏览器不允许全屏");
    }
  };
  if (!window.__MSG_FS) {
    window.__MSG_FS = 1;
    document.addEventListener("fullscreenchange", () => {
      const b = $("#msgFs");
      if (b) b.textContent = document.fullscreenElement ? "退出全屏" : "全屏";
    });
  }
}
/* 盘库入口：正式加入第 08 盘。 */
const plHub_v47_msg = plHub;
plHub = function () {
  msgStop();
  plHub_v47_msg();
  const pane = $("#pane-studio");
  if (!pane) return;
  const cnt = pane.querySelector(".pl-count b");
  if (cnt) cnt.textContent = "08";
  const f = pane.querySelector(".pl-card.future");
  if (f)
    f.outerHTML = `<article class="panel pl-card" data-pl="xiaoxigua"><span class="num">08 · 易学数理</span><span class="enter">↗</span><h3>十二消息卦 · 阴阳消长圆图</h3><p>复、临、泰、大壮、夬、乾、姤、遁、否、观、剥、坤按十二月建环布，并与节气、地支和六爻阴阳数量联动。</p><div class="tags"><span>十二消息卦</span><span>月建节气</span><span>阴阳消长</span></div></article><article class="panel pl-card future"><span class="num">NEXT · 择时养生</span><span class="enter">待建</span><h3>子午流注 · 十二经脉时辰盘</h3><p>下一项把十二时辰、十二经脉、五行脏腑与当令时间做成可转动的养生时辰圆盘，并与现有经络模块联动。</p><div class="tags"><span>子午流注</span><span>十二经脉</span><span>时辰圆盘</span></div></article>`;
  const c = pane.querySelector('[data-pl="xiaoxigua"]');
  if (c) c.onclick = () => msgOpen();
};
const plClose_v48_msg = plClose;
plClose = function () {
  msgStop();
  return plClose_v48_msg();
};
try {
  const g = NAV_G.find((x) => x.g === "盘库");
  if (g && g.it && g.it[0]) {
    g.it[0][2] = "天机巨盘、罗经三盘、三式、全天星图、浑天仪、十二消息卦及后续独立盘";
    g.it[0][3] +=
      " 十二消息卦 消息卦 复 临 泰 大壮 夬 乾 姤 遁 否 观 剥 坤 月建 阴阳消长 一阳来复 三阳开泰";
  }
} catch (_) {}
