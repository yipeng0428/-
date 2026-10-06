/* ===== v50 · 灵龟八法 / 飞腾八法时盘 ===== */
const LGB = {
  civ: null,
  gender: "M",
  mode: "both",
  step: "hour2",
  play: null,
  sel: null,
  gesture: "select",
  view: { x: -430, y: -430, w: 860, h: 860 },
  layers: { hour: 1, stem: 1, gua: 1, pair: 1 },
};
const LGB_GUA = [
  { n: "坎", num: 1, pt: "申脉", code: "BL62", v: "阳跷脉", pair: "后溪", ang: 0 },
  { n: "艮", num: 8, pt: "内关", code: "PC6", v: "阴维脉", pair: "公孙", ang: 45 },
  { n: "震", num: 3, pt: "外关", code: "SJ5", v: "阳维脉", pair: "足临泣", ang: 90 },
  { n: "巽", num: 4, pt: "足临泣", code: "GB41", v: "带脉", pair: "外关", ang: 135 },
  { n: "离", num: 9, pt: "列缺", code: "LU7", v: "任脉", pair: "照海", ang: 180 },
  { n: "坤", num: 2, pt: "照海", code: "KI6", v: "阴跷脉", pair: "列缺", ang: 225 },
  { n: "兑", num: 7, pt: "后溪", code: "SI3", v: "督脉", pair: "申脉", ang: 270 },
  { n: "乾", num: 6, pt: "公孙", code: "SP4", v: "冲脉", pair: "内关", ang: 315 },
];
const LGB_PT = {
  申脉: LGB_GUA[0],
  内关: LGB_GUA[1],
  外关: LGB_GUA[2],
  足临泣: LGB_GUA[3],
  列缺: LGB_GUA[4],
  照海: LGB_GUA[5],
  后溪: LGB_GUA[6],
  公孙: LGB_GUA[7],
};
const LGB_NUM_PT = {
  1: "申脉",
  2: "照海",
  3: "外关",
  4: "足临泣",
  6: "公孙",
  7: "后溪",
  8: "内关",
  9: "列缺",
};
const LGB_FLY = {
  0: "公孙",
  1: "申脉",
  2: "内关",
  3: "照海",
  4: "足临泣",
  5: "列缺",
  6: "外关",
  7: "后溪",
  8: "公孙",
  9: "申脉",
}; // 甲乙丙丁戊己庚辛壬癸
const LGB_DAY_STEM = [10, 9, 7, 8, 7, 10, 9, 7, 8, 7];
const LGB_DAY_BRANCH = [7, 10, 8, 8, 10, 7, 7, 9, 9, 10, 7, 10]; // 子丑寅卯辰巳午未申酉戌亥
const LGB_HOUR_STEM = [9, 8, 7, 6, 5, 9, 8, 7, 6, 5];
const LGB_HOUR_BRANCH = [9, 8, 7, 6, 5, 4, 9, 8, 7, 6, 5, 4];
const LGB_FLY_GUA = {
  公孙: "乾",
  内关: "艮",
  足临泣: "坎",
  外关: "震",
  后溪: "巽",
  申脉: "坤",
  列缺: "离",
  照海: "兑",
};
function lgbNow() {
  try {
    return nowBJ();
  } catch (_) {
    const d = new Date();
    return {
      y: d.getFullYear(),
      m: d.getMonth() + 1,
      d: d.getDate(),
      h: d.getHours(),
      mi: d.getMinutes(),
      s: 0,
    };
  }
}
const lgbFmt = (c) =>
  `${c.y}-${String(c.m).padStart(2, "0")}-${String(c.d).padStart(2, "0")}T${String(c.h).padStart(2, "0")}:${String(c.mi || 0).padStart(2, "0")}`;
function lgbParse(v) {
  if (!v) return null;
  const m = v.match(/(\d+)-(\d+)-(\d+)T(\d+):(\d+)/);
  return m ? { y: +m[1], m: +m[2], d: +m[3], h: +m[4], mi: +m[5], s: 0 } : null;
}
function lgbStop() {
  if (LGB.play) {
    clearInterval(LGB.play);
    LGB.play = null;
  }
  const b = $("#lgbPlay");
  if (b) b.textContent = "▶ 十二时辰演示";
}
function lgbCalc(c) {
  let R0;
  try {
    R0 = compute(c);
  } catch (e) {
    return null;
  }
  const d = R0.bz.pill[2],
    h = R0.bz.pill[3],
    ds = d.s,
    db = d.b,
    hs = h.s,
    hb = h.b;
  const vals = {
    ds: LGB_DAY_STEM[ds],
    db: LGB_DAY_BRANCH[db],
    hs: LGB_HOUR_STEM[hs],
    hb: LGB_HOUR_BRANCH[hb],
  };
  const total = vals.ds + vals.db + vals.hs + vals.hb,
    yang = ds % 2 === 0,
    div = yang ? 9 : 6;
  let rem = total % div;
  if (rem === 0) rem = div;
  let lingPt = rem === 5 ? (LGB.gender === "F" ? "内关" : "照海") : LGB_NUM_PT[rem];
  const flyPt = LGB_FLY[hs];
  return {
    c,
    R: R0,
    day: d,
    hour: h,
    ds,
    db,
    hs,
    hb,
    vals,
    total,
    yang,
    div,
    rem,
    lingPt,
    flyPt,
    ling: LGB_PT[lingPt],
    fly: LGB_PT[flyPt],
    same: lingPt === flyPt,
  };
}
function lgbShift(mins) {
  const c = LGB.civ || lgbNow(),
    d = new Date(Date.UTC(c.y, c.m - 1, c.d, c.h, c.mi || 0));
  d.setUTCMinutes(d.getUTCMinutes() + mins);
  LGB.civ = {
    y: d.getUTCFullYear(),
    m: d.getUTCMonth() + 1,
    d: d.getUTCDate(),
    h: d.getUTCHours(),
    mi: d.getUTCMinutes(),
    s: 0,
  };
  LGB.sel = null;
  lgbRender(true);
}
function lgbStepMin() {
  return LGB.step === "min30" ? 30 : LGB.step === "day" ? 1440 : 120;
}
function lgbPlayToggle() {
  if (LGB.play) {
    lgbStop();
    return;
  }
  LGB.play = setInterval(() => lgbShift(120), 820);
  const b = $("#lgbPlay");
  if (b) b.textContent = "■ 停止演示";
}
const lgbPt = (r, a) => {
  const t = (a * Math.PI) / 180;
  return [Math.sin(t) * r, -Math.cos(t) * r];
};
const lgbArc = (r1, r2, a0, a1) => {
  const p = (r, a) => {
      const q = lgbPt(r, a);
      return q[0].toFixed(1) + "," + q[1].toFixed(1);
    },
    large = (a1 - a0 + 360) % 360 > 180 ? 1 : 0;
  return `M${p(r2, a0)} A${r2},${r2} 0 ${large} 1 ${p(r2, a1)} L${p(r1, a1)} A${r1},${r1} 0 ${large} 0 ${p(r1, a0)} Z`;
};
function lgbSvg(D) {
  let g =
    '<circle r="392" class="lgb-ring"/><circle r="350" class="lgb-ring2"/><circle r="285" class="lgb-ring"/><circle r="185" class="lgb-ring"/>';
  // 12时辰外环
  if (LGB.layers.hour) {
    for (let i = 0; i < 12; i++) {
      const a = i * 30,
        br = D.hb === i,
        p = lgbPt(371, a);
      g += `<line x1="${lgbPt(350, a - 15)[0]}" y1="${lgbPt(350, a - 15)[1]}" x2="${lgbPt(392, a - 15)[0]}" y2="${lgbPt(392, a - 15)[1]}" class="lgb-spoke"/><text x="${p[0]}" y="${p[1]}" class="lgb-tx lgb-med ${br ? "lgb-outer-cur" : ""}">${ZHI[i]}时</text>`;
    }
  }
  // 10时干环
  if (LGB.layers.stem) {
    for (let i = 0; i < 10; i++) {
      const a = i * 36 + 18,
        p = lgbPt(326, a),
        on = D.hs === i;
      g += `<text x="${p[0]}" y="${p[1]}" class="lgb-tx ${on ? "lgb-outer-cur" : "lgb-small"}">${GAN[i]}</text>`;
    }
  }
  // 八卦八穴环
  for (const q of LGB_GUA) {
    const a = q.ang,
      a0 = a - 22.5,
      a1 = a + 22.5,
      ling = LGB.mode !== "fly" && D.lingPt === q.pt,
      fly = LGB.mode !== "ling" && D.flyPt === q.pt,
      cls = ling && fly ? "both" : ling ? "ling" : fly ? "fly" : "";
    const p = lgbPt(238, a),
      p2 = lgbPt(205, a);
    g += `<g class="lgb-hit" data-lgbpt="${q.pt}"><path d="${lgbArc(188, 282, a0, a1)}" class="lgb-sec ${cls}"/><text x="${p[0]}" y="${p[1] - 12}" class="lgb-tx lgb-gua">${q.n}</text><text x="${p[0]}" y="${p[1] + 12}" class="lgb-tx lgb-med">${q.pt}</text><text x="${p2[0]}" y="${p2[1] + 14}" class="lgb-tx lgb-small">${q.v} · ${q.num}</text></g>`;
  }
  if (LGB.layers.pair) {
    [
      ["公孙", "内关"],
      ["后溪", "申脉"],
      ["足临泣", "外关"],
      ["列缺", "照海"],
    ].forEach((ab, k) => {
      const a = LGB_PT[ab[0]].ang,
        b = LGB_PT[ab[1]].ang,
        p1 = lgbPt(170, a),
        p2 = lgbPt(170, b);
      g += `<path d="M${p1[0]},${p1[1]} Q0,0 ${p2[0]},${p2[1]}" fill="none" stroke="var(--cyan)" stroke-opacity=".24" stroke-dasharray="4 5"/>`;
    });
  }
  const lp = lgbPt(300, D.ling.ang),
    fp = lgbPt(300, D.fly.ang);
  if (LGB.mode !== "fly") g += `<circle cx="${lp[0]}" cy="${lp[1]}" r="5" class="lgb-mark-l"/>`;
  if (LGB.mode !== "ling") g += `<circle cx="${fp[0]}" cy="${fp[1]}" r="4" class="lgb-mark-f"/>`;
  // 中心
  g += `<circle r="158" class="lgb-center"/><text x="0" y="-68" class="lgb-tx lgb-center-sub">${GAN[D.ds]}${ZHI[D.db]}日 · ${GAN[D.hs]}${ZHI[D.hb]}时</text><text x="0" y="-34" class="lgb-tx lgb-center-main">${D.total} ÷ ${D.div}</text><text x="0" y="0" class="lgb-tx lgb-big">余 ${D.rem}</text><text x="0" y="34" class="lgb-tx lgb-med"><tspan fill="var(--gold2)">灵龟 ${D.lingPt}</tspan><tspan fill="var(--dim)"> · </tspan><tspan fill="var(--cyan)">飞腾 ${D.flyPt}</tspan></text><text x="0" y="62" class="lgb-tx lgb-small">${D.yang ? "阳日除九" : "阴日除六"}${D.rem === 5 ? " · 五宫按性别寄穴" : ""}</text>`;
  return g;
}
function lgbViewApply() {
  const s = $("#lgbSvg");
  if (!s) return;
  const v = LGB.view;
  s.setAttribute("viewBox", `${v.x} ${v.y} ${v.w} ${v.h}`);
  const z = $("#lgbZoom");
  if (z) z.textContent = Math.round((860 / v.w) * 100) + "%";
}
function lgbFit() {
  LGB.view = { x: -430, y: -430, w: 860, h: 860 };
  lgbViewApply();
}
function lgbZoomAt(f, cx, cy) {
  const s = $("#lgbSvg");
  if (!s) return;
  const r = s.getBoundingClientRect(),
    v = LGB.view,
    p = { x: v.x + ((cx - r.left) / r.width) * v.w, y: v.y + ((cy - r.top) / r.height) * v.h },
    nw = Math.max(250, Math.min(1800, v.w * f)),
    k = nw / v.w;
  v.x = p.x - (p.x - v.x) * k;
  v.y = p.y - (p.y - v.y) * k;
  v.w = nw;
  v.h = nw;
  lgbViewApply();
}
function lgbSound() {
  try {
    if (STU.sfx) stuSfxTick(0.38, false, 1, 0.5);
  } catch (_) {}
}
function lgbInfo(D) {
  const box = $("#lgbInfo");
  if (!box) return;
  const sel = LGB.sel ? LGB_PT[LGB.sel] : null;
  box.innerHTML = `<h4>双法结果</h4><div class="lgb-result"><div><small>灵龟八法</small><b>${D.lingPt}</b><span>${D.ling.v} · ${D.ling.n}${D.ling.num}宫</span></div><div class="fly"><small>飞腾八法</small><b>${D.flyPt}</b><span>${D.fly.v} · ${LGB_FLY_GUA[D.flyPt]}卦</span></div>${D.same ? `<div class="same"><small>两法同穴</small><b>${D.lingPt}</b><span>同一时刻两种传统算法落在同一八脉交会穴。</span></div>` : ""}</div><div class="lgb-facts"><span>日柱</span><b>${GAN[D.ds]}${ZHI[D.db]} · ${D.yang ? "阳日" : "阴日"}</b><span>时柱</span><b>${GAN[D.hs]}${ZHI[D.hb]}</b><span>日干 / 日支数</span><b>${D.vals.ds} + ${D.vals.db}</b><span>时干 / 时支数</span><b>${D.vals.hs} + ${D.vals.hb}</b><span>合计</span><b>${D.total}</b><span>除数 / 余数</span><b>${D.div} / ${D.rem}</b><span>飞腾取法</span><b>按时干 ${GAN[D.hs]} → ${D.flyPt}</b></div>${sel ? `<div class="lgb-card"><b>${sel.pt} · ${sel.code}</b><br>${sel.n}${sel.num}宫 · 通${sel.v} · 经典配对：${sel.pair}。<br>当前这里只展示八脉交会关系与传统配属，不提供针刺位置、深度或操作方法。</div>` : ""}<div class="lgb-card"><b>灵龟八法怎么得到结果：</b>日干、日支使用“逐日干支基数”，时干、时支使用“临时干支基数”，四数相加；阳日除九、阴日除六，取余数落九宫。整除时阳日作 9、阴日作 6。五宫在传统表中有“寄宫”处理，本页提供男/女切换。</div><div class="lgb-card"><b>飞腾八法怎么得到结果：</b>不走余数法，而是只看当前时干：甲/壬→公孙，丙→内关，戊→足临泣，庚→外关，辛→后溪，乙/癸→申脉，己→列缺，丁→照海。</div><div class="lgb-card"><b>相关模块</b><div class="lgb-links"><button class="gbtn sm" data-lgblink="ziwuliuzhu">子午流注时盘</button><button class="gbtn sm" data-lgblink="jingluo">经络 / 人体图谱</button><button class="gbtn sm" data-lgblink="hetu">河图洛书</button><button class="gbtn sm" data-lgblink="bridge">地支枢纽</button><button class="gbtn sm" data-lgblink="zy">周易</button></div></div>`;
}
function lgbTimeline(D) {
  const w = $("#lgbHours");
  if (!w) return;
  const base = D.c,
    rows = [];
  for (let i = 0; i < 12; i++) {
    const h = (i * 2 + 23) % 24,
      c = { y: base.y, m: base.m, d: base.d, h, mi: 30, s: 0 };
    const x = lgbCalc(c);
    if (!x) continue;
    rows.push(
      `<button class="lgb-hour${x.hb === D.hb ? " cur" : ""}" data-lgbtime="${h}"><b>${ZHI[x.hb]}时 · ${GAN[x.hs]}${ZHI[x.hb]}</b><span>灵龟 ${x.lingPt} · 飞腾 ${x.flyPt}</span><small>${String(h).padStart(2, "0")}:00 附近</small></button>`,
    );
  }
  w.innerHTML = rows.join("");
}
function lgbAudit(D) {
  const a = $("#lgbAudit");
  if (!a) return;
  a.innerHTML = `<div class="lgb-audit-grid"><div><small>日干 ${GAN[D.ds]}</small><b>${D.vals.ds}</b></div><div><small>日支 ${ZHI[D.db]}</small><b>${D.vals.db}</b></div><div><small>时干 ${GAN[D.hs]}</small><b>${D.vals.hs}</b></div><div><small>时支 ${ZHI[D.hb]}</small><b>${D.vals.hb}</b></div><div><small>总数</small><b>${D.total}</b></div><div><small>${D.yang ? "除九" : "除六"}</small><b>余 ${D.rem}</b></div></div>`;
}
function lgbEight(D) {
  const w = $("#lgbEight");
  if (!w) return;
  w.innerHTML = LGB_GUA.map(
    (q) =>
      `<button data-lgbcard="${q.pt}" class="${LGB.sel === q.pt ? "on" : ""}"><b>${q.n}${q.num} · ${q.pt}</b><small>${q.code} · ${q.v}<br>配 ${q.pair}</small></button>`,
  ).join("");
}
function lgbRender(sound = false) {
  const D = lgbCalc(LGB.civ || lgbNow());
  if (!D) return;
  const s = $("#lgbSvg");
  if (!s) return;
  s.innerHTML = lgbSvg(D);
  lgbInfo(D);
  lgbTimeline(D);
  lgbAudit(D);
  lgbEight(D);
  lgbViewApply();
  const dt = $("#lgbDt");
  if (dt && document.activeElement !== dt) dt.value = lgbFmt(D.c);
  $$("[data-lgbmode]").forEach((b) => b.classList.toggle("on", b.dataset.lgbmode === LGB.mode));
  if (sound) lgbSound();
}
function lgbOpen() {
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
    zlfStop();
  } catch (_) {}
  lgbStop();
  PANLIB.mode = "linggui";
  document.body.classList.add("studio-mode");
  delete pane.dataset.ui;
  pane.dataset.built = "1";
  LGB.civ = LGB.civ || lgbNow();
  pane.innerHTML = `<div class="lgb-shell" id="lgbShell"><div class="lgb-top"><button class="gbtn sm" id="lgbBack">← 盘库</button><div class="lgb-title"><b>灵龟八法 · 飞腾八法时盘</b><small>日时干支 · 九宫余数 · 八卦八穴 · 八脉交会 · 双法对照</small></div><button class="gbtn sm" id="lgbZlf">打开子午流注</button><button class="gbtn sm" id="lgbJing">打开经络</button><button class="gbtn sm" id="lgbFs">全屏</button></div><div class="lgb-grid"><aside class="panel lgb-side"><h4>时间与算法</h4><div class="lgb-group"><label>日期时间<input type="datetime-local" id="lgbDt" value="${lgbFmt(LGB.civ)}"></label><div class="lgb-row"><button class="gbtn sm" id="lgbNow">此刻 · 归位</button><button class="gbtn sm" id="lgbPrev">←</button><button class="gbtn sm" id="lgbNext">→</button></div><label>演示步长<select id="lgbStep"><option value="min30"${LGB.step === "min30" ? " selected" : ""}>30 分钟</option><option value="hour2"${LGB.step === "hour2" ? " selected" : ""}>1 个时辰</option><option value="day"${LGB.step === "day" ? " selected" : ""}>1 天</option></select></label><button class="gbtn sm" id="lgbPlay" style="width:100%">▶ 十二时辰演示</button></div><div class="lgb-group"><h4>显示模式</h4><div class="lgb-modes"><button class="gbtn sm" data-lgbmode="both">双法</button><button class="gbtn sm" data-lgbmode="ling">灵龟</button><button class="gbtn sm" data-lgbmode="fly">飞腾</button></div><label>五宫寄穴口径<select id="lgbGender"><option value="M"${LGB.gender === "M" ? " selected" : ""}>男：五宫寄照海</option><option value="F"${LGB.gender === "F" ? " selected" : ""}>女：五宫寄内关</option></select></label><p class="note">五宫寄穴存在传统口径说明，本页采用常见“男照海、女内关”表，并把它显式做成可见设置。</p></div><div class="lgb-group"><h4>显示层</h4>${[
    ["hour", "十二时辰", "地支外环"],
    ["stem", "十天干", "时干外环"],
    ["gua", "八卦八穴", "主体圆环"],
    ["pair", "经典配对", "四组八脉交会配对"],
  ]
    .map(
      ([k, n, d]) =>
        `<label class="zlf-layer"><input type="checkbox" data-lgbl="${k}"${LGB.layers[k] ? " checked" : ""}><span>${n}<small>${d}</small></span></label>`,
    )
    .join(
      "",
    )}</div></aside><section class="lgb-main"><div class="lgb-viewbar"><button class="gbtn sm" id="lgbSelect">选择穴位</button><button class="gbtn sm" id="lgbPan">查看平移</button><span class="hint">点八卦扇区看配属 · 滚轮缩放 · 查看模式拖动画面</span><button class="gbtn sm" id="lgbFit">↙↗ 适应</button><button class="gbtn sm" id="lgbZm">−</button><span id="lgbZoom">100%</span><button class="gbtn sm" id="lgbZp">＋</button></div><div class="lgb-frame" id="lgbFrame"><svg id="lgbSvg" viewBox="-430 -430 860 860" role="img" aria-label="灵龟八法飞腾八法时盘"></svg></div><div class="lgb-legend"><span class="lg">灵龟八法结果</span><span class="ft">飞腾八法结果</span><span class="bo">两法同穴</span></div><div class="panel lgb-audit"><div class="lgb-timeline-head"><b>灵龟八法 · 本时算法拆解</b><small>逐日数 + 临时数 → 阴阳日除数 → 余数</small></div><div id="lgbAudit"></div></div><div class="panel lgb-timeline"><div class="lgb-timeline-head"><b>本日十二时辰 · 双法对照</b><small>点击任一时辰直接切换观察</small></div><div class="lgb-hours" id="lgbHours"></div></div><div class="panel lgb-timeline"><div class="lgb-timeline-head"><b>八脉交会 · 八穴总览</b><small>点击卡片查看当前配属</small></div><div class="lgb-eight" id="lgbEight"></div></div><details class="panel lgb-guide" open><summary>怎么读这张盘</summary><div class="lgb-guide-grid"><button data-lgbteach="calc"><b>① 先看日时干支</b><span>灵龟八法把日干支与时干支分别换成基数。</span></button><button data-lgbteach="ling"><b>② 再看灵龟余数</b><span>阳日除九、阴日除六，余数落九宫再映射八穴。</span></button><button data-lgbteach="fly"><b>③ 飞腾只看时干</b><span>飞腾八法不走余数，直接由当前时干映射八穴。</span></button><button data-lgbteach="pair"><b>④ 看八脉配对</b><span>八穴两两配为四组，连接冲、带、任、督与阴阳维跷脉。</span></button></div></details></section><aside class="panel lgb-info" id="lgbInfo"></aside></div><div class="panel lgb-bottom"><b>重要说明：</b>灵龟八法与飞腾八法属于传统时间针灸的历史算法体系。本页只展示干支、九宫、八卦与八脉交会穴之间的传统对应关系，用于医学史、经络文化与算法研究；不提供取穴定位、针刺深度、针法、适应证处方，也不能据此自行针刺或替代医疗诊断。不同文献对“时辰”边界、五宫寄穴及某些配法存在口径差异，本页明确显示采用规则而不把它当作唯一标准。</div></div>`;
  lgbBind();
  lgbRender(false);
}
function lgbBind() {
  const pane = $("#pane-studio"),
    svg = $("#lgbSvg"),
    frame = $("#lgbFrame");
  if (!pane || !svg) return;
  $("#lgbBack").onclick = () => {
    lgbStop();
    plHub();
  };
  $("#lgbNow").onclick = () => {
    LGB.civ = lgbNow();
    LGB.sel = null;
    lgbFit();
    lgbRender(true);
  };
  $("#lgbPrev").onclick = () => lgbShift(-lgbStepMin());
  $("#lgbNext").onclick = () => lgbShift(lgbStepMin());
  $("#lgbStep").onchange = (e) => (LGB.step = e.target.value);
  $("#lgbPlay").onclick = lgbPlayToggle;
  $("#lgbDt").onchange = (e) => {
    const c = lgbParse(e.target.value);
    if (c) {
      LGB.civ = c;
      LGB.sel = null;
      lgbRender(true);
    }
  };
  $("#lgbGender").onchange = (e) => {
    LGB.gender = e.target.value;
    lgbRender(true);
  };
  $$("[data-lgbmode]", pane).forEach(
    (b) =>
      (b.onclick = () => {
        LGB.mode = b.dataset.lgbmode;
        lgbRender(false);
      }),
  );
  $$("[data-lgbl]", pane).forEach(
    (c) =>
      (c.onchange = () => {
        LGB.layers[c.dataset.lgbl] = c.checked ? 1 : 0;
        lgbRender(false);
      }),
  );
  const mode = (m) => {
    LGB.gesture = m;
    frame.classList.toggle("pan", m === "pan");
    $("#lgbSelect").classList.toggle("on", m === "select");
    $("#lgbPan").classList.toggle("on", m === "pan");
  };
  $("#lgbSelect").onclick = () => mode("select");
  $("#lgbPan").onclick = () => mode("pan");
  mode(LGB.gesture);
  $("#lgbFit").onclick = lgbFit;
  $("#lgbZm").onclick = () => {
    const r = svg.getBoundingClientRect();
    lgbZoomAt(1.18, r.left + r.width / 2, r.top + r.height / 2);
  };
  $("#lgbZp").onclick = () => {
    const r = svg.getBoundingClientRect();
    lgbZoomAt(0.84, r.left + r.width / 2, r.top + r.height / 2);
  };
  svg.addEventListener(
    "wheel",
    (e) => {
      e.preventDefault();
      lgbZoomAt(e.deltaY < 0 ? 0.86 : 1.16, e.clientX, e.clientY);
    },
    { passive: false },
  );
  let drag = null;
  svg.addEventListener("pointerdown", (e) => {
    if (e.button > 0 || LGB.gesture !== "pan") return;
    drag = {
      id: e.pointerId,
      x: e.clientX,
      y: e.clientY,
      vx: LGB.view.x,
      vy: LGB.view.y,
      w: LGB.view.w,
      h: LGB.view.h,
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
    LGB.view.x = drag.vx - (e.clientX - drag.x) * kx;
    LGB.view.y = drag.vy - (e.clientY - drag.y) * ky;
    lgbViewApply();
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
    if (LGB.gesture !== "select") return;
    const g = e.target.closest && e.target.closest("[data-lgbpt]");
    if (g) {
      LGB.sel = LGB.sel === g.dataset.lgbpt ? null : g.dataset.lgbpt;
      lgbRender(false);
    }
  });
  pane.addEventListener("click", (e) => {
    const h = e.target.closest("[data-lgbtime]");
    if (h) {
      const hour = +h.dataset.lgbtime,
        c = LGB.civ || lgbNow();
      LGB.civ = { y: c.y, m: c.m, d: c.d, h, mi: 30, s: 0 };
      LGB.sel = null;
      lgbRender(true);
      return;
    }
    const c = e.target.closest("[data-lgbcard]");
    if (c) {
      LGB.sel = c.dataset.lgbcard;
      lgbRender(false);
      return;
    }
    const t = e.target.closest("[data-lgbteach]");
    if (t) {
      if (t.dataset.lgbteach === "ling") LGB.sel = lgbCalc(LGB.civ || lgbNow()).lingPt;
      else if (t.dataset.lgbteach === "fly") LGB.sel = lgbCalc(LGB.civ || lgbNow()).flyPt;
      else if (t.dataset.lgbteach === "pair") LGB.sel = "公孙";
      lgbRender(false);
      return;
    }
    const l = e.target.closest("[data-lgblink]");
    if (l) {
      const k = l.dataset.lgblink;
      lgbStop();
      if (k === "ziwuliuzhu") zlfOpen();
      else selectTab(k, true);
    }
  });
  $("#lgbZlf").onclick = () => {
    lgbStop();
    zlfOpen();
  };
  $("#lgbJing").onclick = () => {
    lgbStop();
    selectTab("jingluo", true);
  };
  $("#lgbFs").onclick = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await $("#lgbShell").requestFullscreen();
    } catch (e) {
      toast("当前浏览器不允许全屏");
    }
  };
  if (!window.__LGB_FS) {
    window.__LGB_FS = 1;
    document.addEventListener("fullscreenchange", () => {
      const b = $("#lgbFs");
      if (b) b.textContent = document.fullscreenElement ? "退出全屏" : "全屏";
    });
  }
}
/* 盘库入口：正式加入第 10 盘。 */
const plHub_v49_lgb = plHub;
plHub = function () {
  lgbStop();
  plHub_v49_lgb();
  const pane = $("#pane-studio");
  if (!pane) return;
  const cnt = pane.querySelector(".pl-count b");
  if (cnt) cnt.textContent = "10";
  const f = pane.querySelector(".pl-card.future");
  if (f)
    f.outerHTML = `<article class="panel pl-card" data-pl="linggui"><span class="num">10 · 择时养生</span><span class="enter">↗</span><h3>灵龟八法 · 飞腾八法时盘</h3><p>把日时干支、九宫余数、八卦八穴与八脉交会做成双法对照盘；既可看灵龟八法的余数算法，也可看飞腾八法的时干直配。</p><div class="tags"><span>灵龟八法</span><span>飞腾八法</span><span>八脉交会</span></div></article><article class="panel pl-card future"><span class="num">NEXT · 流年时空</span><span class="enter">待建</span><h3>十二生肖 · 流年太岁盘</h3><p>下一项把生肖、流年地支、太岁、岁破、三合六合、冲刑害破与方位组织成年度流转圆盘。</p><div class="tags"><span>十二生肖</span><span>流年太岁</span><span>冲合刑害</span></div></article>`;
  const c = pane.querySelector('[data-pl="linggui"]');
  if (c) c.onclick = () => lgbOpen();
};
const plClose_v50_lgb = plClose;
plClose = function () {
  lgbStop();
  return plClose_v50_lgb();
};
try {
  const g = NAV_G.find((x) => x.g === "盘库");
  if (g && g.it && g.it[0]) {
    g.it[0][2] =
      "天机巨盘、罗经三盘、三式、全天星图、浑天仪、十二消息卦、子午流注、灵龟飞腾及后续独立盘";
    g.it[0][3] +=
      " 灵龟八法 飞腾八法 八脉交会 九宫 开穴时序 公孙 内关 后溪 申脉 足临泣 外关 列缺 照海 冲脉 带脉 任脉 督脉 阴维 阳维 阴跷 阳跷";
  }
} catch (_) {}
/* v50 version */
try {
  const ft = document.querySelector("footer");
  if (ft) {
    const t = ft.textContent || "";
    if (/版本\s*·/.test(t));
    else ft.insertAdjacentHTML("beforeend", "<br>版本 · 2026-10-03 20:47:31");
  }
} catch (_) {}
