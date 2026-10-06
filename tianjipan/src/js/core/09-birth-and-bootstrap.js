function natalPage() {
  if (!R || !R.t) return '<div class="panel blk"><p class="note">请先排盘。</p></div>';
  const B = ntBuild(),
    people = (PPL.people || []).filter((p) => pplParse(p.dt) && p.id !== PPL.meId);
  const y = NT.year || ntNowYear(),
    tg =
      NT.target ||
      (() => {
        const n = nowBJ();
        return `${n.y}-${f2(n.m)}-${f2(n.d)}`;
      })();
  return `<div class="panel blk p5"><div class="mod-head"><h3>星盘</h3><p>本命 · 太阳回归 · 次限 · 组合盘 · 多种宫位制 · 阿拉伯点</p></div>
  <div class="p5-ctl"><label>盘型 <select id="ntK">${[
    ["natal", "本命盘"],
    ["return", "太阳回归盘"],
    ["prog", "次限盘(一日一年)"],
    ["comp", "组合盘(与另一人)"],
  ]
    .map(([k, n]) => `<option value="${k}"${NT.kind === k ? " selected" : ""}>${n}</option>`)
    .join("")}</select></label>
   <label>宫位制 <select id="ntS">${[
     ["placidus", "普拉西德"],
     ["whole", "整宫制"],
     ["equal", "等宫制"],
     ["porphyry", "波菲利"],
   ]
     .map(([k, n]) => `<option value="${k}"${NT.sys === k ? " selected" : ""}>${n}</option>`)
     .join("")}</select></label>
   ${NT.kind === "return" ? `<label>年份 <input type="number" id="ntY" min="1902" max="2098" value="${y}"></label><label>地点经度 <input type="number" id="ntRL" step="0.01" placeholder="默认出生地" value="${NT.relon}"></label><label>纬度 <input type="number" id="ntRA" step="0.01" placeholder="默认出生地" value="${NT.relat}"></label>` : ""}
   ${NT.kind === "prog" ? `<label>目标日 <input type="date" id="ntT" value="${tg}"></label>` : ""}
   ${NT.kind === "comp" ? `<label>另一人 <select id="ntP"><option value="">选择…</option>${people.map((p) => `<option value="${esc(p.id)}"${NT.partner === p.id ? " selected" : ""}>${esc(p.name || "未命名")}</option>`).join("")}</select></label>${people.length ? "" : '<span class="dim sm">人物册里没有其他带完整出生信息的人</span>'}` : ""}</div>
  ${
    B
      ? `<div class="kv"><span><b class="gold">${B.title}</b></span><span class="dim sm">${B.sub}</span></div>
  <div class="nt-wrap"><div class="nt-fig">${ntWheel(B)}</div><div class="nt-side">${ntTables(B)}</div></div>
  <p class="note">${B.chart.note || ""}${B.prog ? " 次限法:出生后第 N 天的星象对应 N 岁。" : ""}${NT.kind === "return" ? " 蓝点为本命位置。" : ""}${B.comp ? " 组合盘的相位与宫位仅作关系趣味参考。" : ""}<span class="dim"> 图中星座与主要天体同时保留符号和中文小字，便于快速识别。</span></p>`
      : '<p class="note">无法生成,请检查输入。</p>'
  }
  ${P5_NOTE}${p5Audit(["行星黄经取自本站算法,已与 Astronomy Engine 对拍(月亮与水金火 ≤0.05°,木星 ≤0.15°,土星 ≤0.35°)。", "上升点、中天点:由恒星时计算,恒星时与 Astronomy Engine 对拍 200 组最大差 0.005°;与本站圆盘页的上升点一致。", "普拉西德宫头:按半弧三分求解;验证:赤道处第 11、12、2 宫头等于赤经 30°、60°、120° 的黄经点;600 组多纬度多时刻宫头均闭合;纬度高于 66.5° 时自动改用波菲利制。", "太阳回归:太阳黄经回到本命值的时刻,与 Astronomy Engine 的 SearchSunLongitude 对拍 15 组,最大差 2.3 分钟。", "次限:一日一年,按 365.2422 日为一年。组合盘:各点取两人黄经短弧中点,宫位按组合上升点等宫制(简化)。", "阿拉伯点:福点(昼:上升+月−日;夜:上升+日−月),精神点反之。未收录的:Koch 宫位制、赤经/赤纬相位、恒星日回归等。"])}</div>`;
}
function natalBind() {
  const re = () => refRender("natal");
  $("#ntK").onchange = (e) => {
    NT.kind = e.target.value;
    re();
  };
  $("#ntS").onchange = (e) => {
    NT.sys = e.target.value;
    re();
  };
  const y = $("#ntY");
  if (y)
    y.onchange = () => {
      NT.year = Math.max(1902, Math.min(2098, +y.value || ntNowYear()));
      re();
    };
  const rl = $("#ntRL"),
    ra = $("#ntRA");
  if (rl)
    rl.onchange = () => {
      NT.relon = rl.value;
      re();
    };
  if (ra)
    ra.onchange = () => {
      NT.relat = ra.value;
      re();
    };
  const t = $("#ntT");
  if (t)
    t.onchange = () => {
      NT.target = t.value;
      re();
    };
  const pp = $("#ntP");
  if (pp)
    pp.onchange = () => {
      NT.partner = pp.value;
      re();
    };
}
REF_PANES.natal = natalPage;
REF_BIND.natal = natalBind;

/* ================= 吠陀占星 ================= */
const VD = { style: "south", dashaOpen: null };
const V2_SIGN_SKT = [
  "Mesha",
  "Vrishabha",
  "Mithuna",
  "Karka",
  "Simha",
  "Kanya",
  "Tula",
  "Vrischika",
  "Dhanu",
  "Makara",
  "Kumbha",
  "Meena",
];
function vdSouth(items, lagnaSign, title) {
  const grid = [
    [11, 0, 1, 2],
    [10, null, null, 3],
    [9, null, null, 4],
    [8, 7, 6, 5],
  ]; // 南印度式:固定星座位置
  let cells = "";
  for (let r = 0; r < 4; r++)
    for (let c = 0; c < 4; c++) {
      const s = grid[r][c];
      if (s == null) {
        if (r === 1 && c === 1)
          cells += `<div class="vd-mid" style="grid-column:2/4;grid-row:2/4"><b>${title}</b><small>恒星黄道</small></div>`;
        continue;
      }
      const here = items.filter((x) => x.sign === s);
      cells += `<div class="vd-c${s === lagnaSign ? " lag" : ""}" style="grid-column:${c + 1};grid-row:${r + 1}"><i>${A2_SIGN[s]}</i>${s === lagnaSign ? "<em>Lg</em>" : ""}<div>${here.map((x) => `<span class="${x.retro ? "rt" : ""}" title="${x.title || ""}">${x.k}</span>`).join(" ")}</div></div>`;
    }
  return `<div class="vd-grid">${cells}</div>`;
}
function vdNorth(items, lagnaSign, title) {
  // 北印度式:菱形,宫位固定、星座轮转
  const H = [
    [200, 70, "M200,0L300,100L200,200L100,100Z"],
    [100, 32, "M100,0L200,0L150,50Z"],
    [34, 100, "M0,0L100,0L50,50Z"],
    [70, 150, "M0,0L50,50L0,100L-50,50Z"],
    [34, 225, "M0,100L50,150L0,200L-50,150Z"],
    [100, 270, "M0,200L50,150L100,200Z"],
    [200, 330, "M100,200L200,200L150,250Z"],
  ];
  // 简化:用 12 个三角/菱形区域的标准布局
  const polys = [
    "200,200 300,100 200,0 100,100",
    "100,100 200,0 0,0",
    "0,0 100,100 0,200",
    "0,200 100,100 200,200 100,300".replace(
      "0,200 100,100 200,200 100,300",
      "100,100 0,200 100,300 200,200",
    ),
    "0,200 100,300 0,400",
    "100,300 200,400 0,400",
    "200,200 100,300 200,400 300,300",
    "300,300 200,400 400,400",
    "400,200 300,300 400,400",
    "300,100 400,200 300,300 200,200",
    "400,0 300,100 400,200",
    "200,0 400,0 300,100",
  ];
  const cen = [
    [200, 100],
    [100, 40],
    [40, 100],
    [100, 200],
    [40, 300],
    [100, 360],
    [200, 300],
    [300, 360],
    [360, 300],
    [300, 200],
    [360, 100],
    [300, 40],
  ];
  let s = "";
  for (let h = 0; h < 12; h++) {
    const sign = (lagnaSign + h) % 12,
      here = items.filter((x) => x.sign === sign);
    s += `<polygon points="${polys[h]}" class="vd-n${h === 0 ? " lag" : ""}"/><text x="${cen[h][0]}" y="${cen[h][1] - (here.length ? 12 : 0)}" class="vd-ns" text-anchor="middle" dominant-baseline="central">${sign + 1}</text>${here.length ? `<text x="${cen[h][0]}" y="${cen[h][1] + 8}" class="vd-np" text-anchor="middle" dominant-baseline="central">${here.map((x) => x.k).join(" ")}</text>` : ""}`;
  }
  return `<svg viewBox="-4 -4 408 408" class="vd-nsvg" role="img" aria-label="${title} 北印度式">${s}<text x="200" y="205" text-anchor="middle" class="vd-nt">${title}</text></svg>`;
}
function vedicPage() {
  if (!R || !R.t) return '<div class="panel blk"><p class="note">请先排盘。</p></div>';
  const jd = R.t.jdUT,
    L = ntLoc(),
    V = v2Chart(jd, L.lon, L.lat),
    moon = V.planets.find((p) => p.n === "月亮"),
    D = v2Dasha(jd, moon.sid);
  const nowJD = jdFromGreg(nowBJ().y, nowBJ().m, nowBJ().d, nowBJ().h, nowBJ().mi, 0) - 8 / 24;
  const cur = D.list.find((m) => nowJD >= m.start && nowJD < m.end),
    curSub = cur && cur.sub.find((s) => nowJD >= s.start && nowJD < s.end);
  const d1 = V.planets.map((p) => ({
      k: V2_ABBR[p.k] || p.k,
      sign: p.sign,
      retro: p.retro && p.k !== "Ra" && p.k !== "Ke",
      title: `${p.n} ${Math.floor(p.deg)}° ${A2_SIGN[p.sign]} · ${p.nak.name} 第${p.nak.pada}足`,
    })),
    d9 = V.planets.map((p) => ({ k: V2_ABBR[p.k] || p.k, sign: p.nv, retro: false, title: p.n }));
  d1.push({ k: "Lg", sign: V.lagna.sign, title: "上升" });
  d9.push({ k: "Lg", sign: V.lagna.nv, title: "上升(D9)" });
  const draw = VD.style === "south" ? vdSouth : vdNorth;
  const fm = (x) => `${Math.floor(x.deg)}°${f2(Math.round((x.deg % 1) * 60) % 60)}′`;
  const rows = [
    ...V.planets.map(
      (p) =>
        `<tr><th>${p.n}</th><td>${A2_SIGN[p.sign]}(${V2_SIGN_SKT[p.sign]}) ${fm(p)}</td><td>${p.nak.name} · ${p.nak.cn}宿 第${p.nak.pada}足</td><td>${V2_LORDCN[p.nak.lord]}</td><td>${A2_SIGN[p.nv]}</td><td>${p.retro && p.k !== "Ra" && p.k !== "Ke" ? "逆行" : ""}</td></tr>`,
    ),
    `<tr class="tot"><th>上升 Lagna</th><td>${A2_SIGN[V.lagna.sign]} ${fm(V.lagna)}</td><td>${V.lagna.nak.name} 第${V.lagna.nak.pada}足</td><td>${V2_LORDCN[V.lagna.nak.lord]}</td><td>${A2_SIGN[V.lagna.nv]}</td><td></td></tr>`,
  ].join("");
  const dl = D.list
    .map(
      (m, i) =>
        `<tr class="${cur === m ? "on" : ""}" data-md="${i}"><th>${V2_LORDCN[m.lord]}(${["Ketu", "Venus", "Sun", "Moon", "Mars", "Rahu", "Jupiter", "Saturn", "Mercury"][m.lord]})</th><td>${ntFmt(m.start).slice(0, 10)}</td><td>${ntFmt(m.end).slice(0, 10)}</td><td>${V2_YRS[m.lord]} 年</td></tr>${VD.dashaOpen === i || (cur === m && VD.dashaOpen == null) ? `<tr class="sub"><td colspan="4">${m.sub.map((s) => `<span class="pill${curSub === s ? " g" : ""}">${V2_LORDCN[s.lord]} ${ntFmt(s.start).slice(0, 7)}→${ntFmt(s.end).slice(0, 7)}</span>`).join(" ")}</td></tr>` : ""}`,
    )
    .join("");
  const pb = v2Panchanga(
    jd,
    V.planets[0].trop,
    V.planets[1].trop,
    (((Math.floor(jd + 8 / 24 + 0.5) + 1) % 7) + 7) % 7,
  );
  const sd = asPlanets(nowJD),
    pn = v2Panchanga(
      nowJD,
      sd[0].lon,
      sd[1].lon,
      (((Math.floor(nowJD + 8 / 24 + 0.5) + 1) % 7) + 7) % 7,
    );
  return `<div class="panel blk p5"><h3 class="sec">吠陀占星 <small class="dim">恒星黄道 · 27 宿 · Vimshottari 大运 · D1/D9 · 五支历</small></h3>
  <div class="p5-ctl"><label>星盘样式 <select id="vdS"><option value="south"${VD.style === "south" ? " selected" : ""}>南印度式(星座固定)</option><option value="north"${VD.style === "north" ? " selected" : ""}>北印度式(宫位固定)</option></select></label></div>
  <div class="kv"><span>岁差(拉希里近似) <b>${V.ay.toFixed(3)}°</b></span><span>上升 <b>${A2_SIGN[V.lagna.sign]}</b></span><span>月宿 <b>${moon.nak.name} 第${moon.nak.pada}足</b></span><span>当前大运 <b>${cur ? V2_LORDCN[cur.lord] + (curSub ? " / " + V2_LORDCN[curSub.lord] : "") : "—"}</b></span></div>
  <div class="vd-pair"><div><h4 class="gl">D1 · 本命盘(Rashi)</h4>${draw(d1, V.lagna.sign, "D1")}</div><div><h4 class="gl">D9 · 九分盘(Navamsa)</h4>${draw(d9, V.lagna.nv, "D9")}</div></div>
  <div class="tbl-wrap"><table class="tbl"><thead><tr><th>天体</th><th>恒星黄道位置</th><th>月宿 · 足</th><th>宿主</th><th>D9 星座</th><th></th></tr></thead><tbody>${rows}</tbody></table></div>
  <h4 class="gl" style="margin-top:12px">Vimshottari 大运 <small class="dim">出生时 ${V2_LORDCN[D.nak.lord]}运余 ${D.balance.toFixed(2)} 年 · 点一行展开小运</small></h4>
  <div class="tbl-wrap"><table class="tbl vd-dt"><thead><tr><th>大运</th><th>起</th><th>止</th><th>长度</th></tr></thead><tbody>${dl}</tbody></table></div>
  <div class="p5-wrap" style="margin-top:10px"><div class="tbl-wrap"><h4 class="gl">出生五支历(Panchanga)</h4><table class="tbl"><tbody><tr><th>Vara 曜日</th><td>${pb.vara}</td></tr><tr><th>Tithi 月日</th><td>${pb.tithi} · ${pb.tithiName} · ${pb.paksha}</td></tr><tr><th>Nakshatra</th><td>${pb.nak.name} 第${pb.nak.pada}足(${pb.nak.cn}宿)</td></tr><tr><th>Yoga</th><td>${pb.yoga} · ${pb.yogaName}</td></tr><tr><th>Karana</th><td>${pb.karanaName}</td></tr></tbody></table></div>
  <div class="tbl-wrap"><h4 class="gl">此刻五支历</h4><table class="tbl"><tbody><tr><th>Vara</th><td>${pn.vara}</td></tr><tr><th>Tithi</th><td>${pn.tithi} · ${pn.tithiName} · ${pn.paksha}</td></tr><tr><th>Nakshatra</th><td>${pn.nak.name} 第${pn.nak.pada}足</td></tr><tr><th>Yoga</th><td>${pn.yoga} · ${pn.yogaName}</td></tr><tr><th>Karana</th><td>${pn.karanaName}</td></tr></tbody></table></div></div>
  <p class="note">吠陀占星使用<b>恒星黄道</b>,与西方的回归黄道相差约 ${v2Ayanamsa(jd).toFixed(1)}°,所以同一个人的“太阳星座”常会不同。罗睺、计都为平均交点。宫位本页只给星座盘(整宫);十二宫内容、行星庄严与吉凶等判断规则本站未收录。</p>
  ${P5_NOTE}${p5Audit(["岁差:拉希里(Chitrapaksha)近似式 23.857°+1.397°/世纪;J2000 为 23.857°,与通行值差 <0.01°。其他岁差(Krishnamurti、Raman 等)相差约 0.1–1°,可能改变月宿或星座边界。", "27 宿:每宿 13°20′,每宿 4 足(pada);宿主按 Ketu、金星、太阳、月亮、火星、罗睺、木星、土星、水星循环。", "Vimshottari:120 年周期(7、20、6、10、7、18、16、19、17);出生时月亮在宿内已行比例决定首个大运已过多少;验证:九大运总长恰为 120 年,每个大运的九个小运之和等于该大运。", "D9 九分盘:每个星座分 9 份(各 3°20′);动宫起自本宫、固定宫起自第 9 宫、双体宫起自第 5 宫。", "五支历:Tithi=日月黄经差/12°;Karana=半个 Tithi;Yoga=日月恒星黄经之和/13°20′;验证:Astronomy Engine 的新月、满月时刻的日月黄经差偏离 ≤0.017°。", "此刻五支历按北京时间当前时刻;Tithi 在不同经度当地日出时的值可能不同,本页不按日出计。"])}</div>`;
}
const V2_ABBR = {
  Su: "Su",
  Mo: "Mo",
  Ma: "Ma",
  Me: "Me",
  Ju: "Ju",
  Ve: "Ve",
  Sa: "Sa",
  Ra: "Ra",
  Ke: "Ke",
};
function vedicBind() {
  const s = $("#vdS");
  if (s)
    s.onchange = () => {
      VD.style = s.value;
      refRender("vedic");
    };
  $$("[data-md]", $("#pane-vedic")).forEach(
    (r) =>
      (r.onclick = () => {
        const i = +r.dataset.md;
        VD.dashaOpen = VD.dashaOpen === i ? -1 : i;
        refRender("vedic");
      }),
  );
}
REF_PANES.vedic = vedicPage;
REF_BIND.vedic = vedicBind;

/* =====================================================================
   联动总线 · 全局放大 · 回到今天
   1) 放大:每个较大的圆盘/图表右上角只保留一个 ↗↙ 双箭头按钮,点击进入全屏(Esc 退出);盘库整个容器可全屏。
   2) 回到今天:凡是有日期/年份输入的页面,输入框旁自动带“回到今天/今年”。
   3) 联动总线 FX:在任何盘上点中一个地支/节气/卦/宿/干支,就成为“联动焦点”:
      首页观象盘上相关的环同时高亮(例如点“午”,亮出午时、芒种夏至、姤卦),并给出对应卡片。
   ===================================================================== */
/* ------------------------- 放大 ------------------------- */
const ZM_SKIP = new Set(["dial", "dialFix", "stuSvg"]);
let ZM_FB = null;
const zmFS = () => document.fullscreenElement || document.webkitFullscreenElement || null;
function stuFsIsOn() {
  const s = $(".stu");
  return !!(s && (zmFS() === s || ZM_FB === s || s.classList.contains("zmx")));
}
function stuFsSync() {
  const s = $(".stu"),
    b = $("#stuFsBtn"),
    on = stuFsIsOn();
  document.body.classList.toggle("stu-fs", on);
  if (b) {
    b.textContent = on ? "退出全屏" : "全屏";
    b.classList.toggle("fs-on", on);
    b.setAttribute("aria-pressed", on ? "true" : "false");
    b.title = on ? "退出盘库全屏" : "盘库整体全屏；全屏后保留全部盘库操作";
  }
  const x = $("#zmxClose");
  if (x && on) x.hidden = true;
}
function zmFallbackOn(el) {
  el.classList.add("zmx");
  document.body.classList.add("zm-max");
  ZM_FB = el;
  let b = $("#zmxClose");
  if (!b) {
    b = document.createElement("button");
    b.id = "zmxClose";
    b.type = "button";
    b.className = "gbtn";
    b.textContent = "✕ 退出全屏";
    b.onclick = zmExit;
    document.body.appendChild(b);
  }
  b.hidden = !!(el && el.classList && el.classList.contains("stu"));
  if (el && el.classList && el.classList.contains("stu")) document.body.classList.add("stu-fs");
  try {
    stuFsSync();
  } catch (_) {}
  setTimeout(() => window.dispatchEvent(new Event("resize")), 60);
}
function zmEnter(el) {
  const fn = el.requestFullscreen || el.webkitRequestFullscreen;
  if (!fn) {
    zmFallbackOn(el);
    return;
  }
  try {
    const p = fn.call(el);
    if (p && p.catch) p.catch(() => zmFallbackOn(el));
  } catch (e) {
    zmFallbackOn(el);
  }
}
function zmExit() {
  if (zmFS()) {
    try {
      (document.exitFullscreen || document.webkitExitFullscreen).call(document);
    } catch (e) {}
  }
  if (ZM_FB) {
    ZM_FB.classList.remove("zmx");
    ZM_FB = null;
    document.body.classList.remove("zm-max");
    document.body.classList.remove("stu-fs");
    const b = $("#zmxClose");
    if (b) b.hidden = true;
    try {
      stuFsSync();
    } catch (_) {}
    setTimeout(() => window.dispatchEvent(new Event("resize")), 60);
  }
}
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && ZM_FB) zmExit();
});
["fullscreenchange", "webkitfullscreenchange"].forEach((ev) =>
  document.addEventListener(ev, () => {
    try {
      stuFsSync();
    } catch (_) {}
    setTimeout(() => window.dispatchEvent(new Event("resize")), 80);
  }),
);
const TAZ = { host: null, parent: null, next: null, modal: null };
function taZoomEnsure() {
  let m = $("#taZoomModal");
  if (m) return m;
  m = document.createElement("div");
  m.id = "taZoomModal";
  m.hidden = true;
  m.setAttribute("role", "dialog");
  m.setAttribute("aria-modal", "true");
  m.setAttribute("aria-label", "传统历象放大查看");
  m.innerHTML =
    '<div class="ta-zoom-shell"><button type="button" id="taZoomClose" aria-label="关闭放大查看" title="关闭">×</button></div>';
  document.body.appendChild(m);
  m.addEventListener("pointerdown", (e) => {
    if (e.target === m) taZoomClose();
  });
  $("#taZoomClose").onclick = taZoomClose;
  return m;
}
function taZoomOpen(host, svg) {
  if (TAZ.host === host) {
    taZoomClose();
    return;
  }
  if (TAZ.host) taZoomClose();
  const m = taZoomEnsure(),
    shell = m.querySelector(".ta-zoom-shell");
  TAZ.host = host;
  TAZ.parent = host.parentNode;
  TAZ.next = host.nextSibling;
  TAZ.modal = m;
  try {
    pzReset(svg);
  } catch (_) {}
  host.classList.add("ta-pop");
  shell.appendChild(host);
  m.hidden = false;
  document.body.classList.add("ta-zoom-open");
  const b = host.querySelector(".zbtn");
  if (b) {
    b.title = "关闭放大查看";
    b.setAttribute("aria-label", "关闭放大查看");
  }
  requestAnimationFrame(() => {
    window.dispatchEvent(new Event("resize"));
    try {
      zmPlace(svg);
    } catch (_) {}
  });
}
function taZoomClose() {
  if (!TAZ.host) return;
  const { host, parent, next, modal } = TAZ;
  const svg = host.querySelector("#tradAstroSvg");
  host.classList.remove("ta-pop");
  if (parent) {
    if (next && next.parentNode === parent) parent.insertBefore(host, next);
    else parent.appendChild(host);
  }
  if (modal) modal.hidden = true;
  document.body.classList.remove("ta-zoom-open");
  const b = host.querySelector(".zbtn");
  if (b) {
    b.title = "放大到画面中央";
    b.setAttribute("aria-label", "放大查看");
  }
  try {
    if (svg) {
      pzReset(svg);
      zmPlace(svg);
    }
  } catch (_) {}
  TAZ.host = TAZ.parent = TAZ.next = TAZ.modal = null;
  window.dispatchEvent(new Event("resize"));
}
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && TAZ.host) taZoomClose();
});

/* 太阳系 / 日地月 3D：居中弹层放大，移动原 stage 而非克隆 canvas，保留全部交互 */
const ORRZ = { stage: null, parent: null, next: null, modal: null, canvas: null };
function orrZoomEnsure() {
  let m = $("#orrZoomModal");
  if (m) return m;
  m = document.createElement("div");
  m.id = "orrZoomModal";
  m.hidden = true;
  m.setAttribute("role", "dialog");
  m.setAttribute("aria-modal", "true");
  m.setAttribute("aria-label", "3D 天文模拟放大查看");
  m.innerHTML =
    '<div class="orr-zoom-shell"><div class="orr-zoom-bar"><span class="orr-zoom-title" id="orrZoomTitle">3D 天文模拟</span><span class="orr-zoom-tip">滚轮推进 / 拉远 · 拖动环绕 · Shift / 右键拖动平移 · 双击复位</span><span class="orr-zoom-sp"></span><button type="button" id="orrZoomReset">视图复位</button><button type="button" class="orr-zoom-close" id="orrZoomClose" aria-label="关闭">×</button></div><div class="orr-zoom-body" id="orrZoomBody"></div></div>';
  document.body.appendChild(m);
  m.addEventListener("pointerdown", (e) => {
    if (e.target === m) orrZoomClose();
  });
  $("#orrZoomClose").onclick = orrZoomClose;
  $("#orrZoomReset").onclick = () => {
    if (!ORRZ.canvas) return;
    if (ORRZ.canvas.id === "orr3dCv") {
      ORR3D.yaw = -0.62;
      ORR3D.pitch = 0.82;
      ORR3D.dist = 720;
      ORR3D.tx = ORR3D.ty = ORR3D.tz = 0;
      try {
        orr3dDraw();
      } catch (_) {}
    } else if (ORRZ.canvas.id === "sem3dCv") {
      try {
        sem3dReset();
      } catch (_) {}
    }
  };
  return m;
}
function orrZoomOpen(canvas) {
  if (!canvas) return;
  const stage = canvas.closest(".orr3d-stage,.sem3d-stage");
  if (!stage) return;
  if (ORRZ.stage === stage) {
    orrZoomClose();
    return;
  }
  if (ORRZ.stage) orrZoomClose();
  const m = orrZoomEnsure(),
    body = $("#orrZoomBody");
  ORRZ.stage = stage;
  ORRZ.parent = stage.parentNode;
  ORRZ.next = stage.nextSibling;
  ORRZ.modal = m;
  ORRZ.canvas = canvas;
  const title = $("#orrZoomTitle");
  if (title)
    title.textContent =
      canvas.id === "sem3dCv" ? "日 · 地 · 月 3D · 放大查看" : "太阳系 3D · 放大查看";
  stage.classList.add("orr-pop");
  body.appendChild(stage);
  m.hidden = false;
  document.body.classList.add("orr-zoom-open");
  const b = stage.querySelector(".zbtn");
  if (b) {
    b.title = "关闭放大查看";
    b.setAttribute("aria-label", "关闭放大查看");
  }
  requestAnimationFrame(() => {
    window.dispatchEvent(new Event("resize"));
    try {
      if (canvas.id === "sem3dCv") sem3dFit();
    } catch (_) {}
  });
}
function orrZoomClose() {
  if (!ORRZ.stage) return;
  const { stage, parent, next, modal, canvas } = ORRZ;
  stage.classList.remove("orr-pop");
  if (parent) {
    if (next && next.parentNode === parent) parent.insertBefore(stage, next);
    else parent.appendChild(stage);
  }
  if (modal) modal.hidden = true;
  document.body.classList.remove("orr-zoom-open");
  const b = stage.querySelector(".zbtn");
  if (b) {
    b.title = "放大到画面中央";
    b.setAttribute("aria-label", "放大查看");
  }
  ORRZ.stage = ORRZ.parent = ORRZ.next = ORRZ.modal = ORRZ.canvas = null;
  requestAnimationFrame(() => {
    window.dispatchEvent(new Event("resize"));
    try {
      if (canvas && canvas.id === "sem3dCv") sem3dFit();
    } catch (_) {}
  });
}
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && ORRZ.stage) orrZoomClose();
});
function zmPlace(el) {
  const b = el._zb;
  if (!b || !b.isConnected || !el.offsetWidth) return;
  if (el.id === "tradAstroSvg") {
    b.style.left = "auto";
    b.style.right = "8px";
    b.style.top = "8px";
    return;
  }
  b.style.right = "auto";
  b.style.left = el.offsetLeft + el.offsetWidth - 36 + "px";
  b.style.top = el.offsetTop + 6 + "px";
}
function zmAttach(el) {
  if (el._zb && el._zb.isConnected) return;
  const host = el.parentElement;
  if (!host) return;
  if (getComputedStyle(host).position === "static") host.style.position = "relative";
  const b = document.createElement("button");
  b.type = "button";
  b.className = "zbtn";
  b.title = "放大到全屏(Esc 退出)";
  b.setAttribute("aria-label", "放大查看");
  b.textContent = "↗↙";
  b._for = el;
  b.onclick = (ev) => {
    ev.stopPropagation();
    ev.preventDefault();
    const isTrad = el.id === "tradAstroSvg";
    if (isTrad) {
      taZoomOpen(host, el);
      return;
    }
    if (el.id === "orr3dCv" || el.id === "sem3dCv") {
      orrZoomOpen(el);
      return;
    }
    zmEnter(el);
  };
  host.appendChild(b);
  el._zb = b;
  zmPlace(el);
  if (window.ResizeObserver) {
    if (el._ro) el._ro.disconnect();
    el._ro = new ResizeObserver(() => zmPlace(el));
    el._ro.observe(el);
  }
}
function zmScan() {
  $$(".zbtn").forEach((b) => {
    if (!b._for || !b._for.isConnected) b.remove();
  });
  $$(".pane.on svg, .pane.on canvas").forEach((el) => {
    if (
      ZM_SKIP.has(el.id) ||
      el.closest(".stu") ||
      el.closest("#tnPanel") ||
      el.closest(".zbtn") ||
      el.hasAttribute("data-nozoom")
    )
      return;
    const r = el.getBoundingClientRect();
    if (r.width < 180 || r.height < 110) return;
    zmAttach(el);
  });
  $$(".pane.on .zbtn").forEach((b) => {
    if (b._for) zmPlace(b._for);
  });
  /* 盘库:整个容器全屏 */
  const bar = $(".stu-bar");
  if (bar && !$("#stuFsBtn")) {
    const b = document.createElement("button");
    b.type = "button";
    b.id = "stuFsBtn";
    b.className = "gbtn sm";
    b.setAttribute("aria-pressed", "false");
    b.textContent = "全屏";
    b.title = "盘库整体全屏；全屏后保留全部盘库操作";
    b.onclick = () => {
      if (stuFsIsOn()) zmExit();
      else zmEnter($(".stu"));
    };
    bar.appendChild(b);
    stuFsSync();
    [
      ["stuCtlBtn", "☰ 设置", "show-ctl"],
      ["stuInfoBtn", "ⓘ 详情", "show-info"],
    ].forEach(([id, tx, cl]) => {
      const x = document.createElement("button");
      x.type = "button";
      x.id = id;
      x.className = "gbtn sm only-fs";
      x.textContent = tx;
      x.onclick = () => $(".stu").classList.toggle(cl);
      bar.appendChild(x);
    });
    const sv = $("#stuSvg");
    if (sv)
      sv.addEventListener("click", () => {
        if (zmFS() || ZM_FB) $(".stu").classList.add("show-info");
      });
  }
}
/* 节流而非防抖:页面上有持续的细小变动,防抖会被一直推迟 */
let ZM_T = 0;
const zmSoon = (ms) => {
  if (ZM_T) return;
  ZM_T = setTimeout(() => {
    ZM_T = 0;
    try {
      zmScan();
    } catch (e) {
      console.error("zmScan", e);
    }
  }, ms);
};
new MutationObserver((ms) => {
  if (
    ms.every((m) => {
      const t = m.target && m.target.nodeType === 1 ? m.target : null;
      return t && t.closest && t.closest("#orr3dInfo,#tradAstroSvg,#tradAstroInfo,#clock,#log");
    })
  )
    return;
  zmSoon(500);
}).observe(document.body, { childList: true, subtree: true });
window.addEventListener("resize", () => zmSoon(150));

/* ------------------------- 回到今天 ------------------------- */
const TD_MAP = {
  zrStart: "date",
  nwViewD: "date",
  cvS: "date",
  ntT: "date",
  stuObsD: "stu",
  rv_date: "date",
  shY: "year",
  tsY: "year",
  seaY: "year",
  ntY: "year",
  liuYear: "year",
  ziYear: "year",
  flY: "year",
  fdY: "year",
  cY: "cal",
};
function tdScan() {
  Object.keys(TD_MAP).forEach((id) => {
    const el = document.getElementById(id);
    if (!el || el.dataset.tdy) return;
    el.dataset.tdy = "1";
    const kind = TD_MAP[id];
    if (kind === "cal") return; /* 万年历自带按钮,见 calRender */
    const b = document.createElement("button");
    b.type = "button";
    b.className = "gbtn sm tdy";
    b.textContent = kind === "year" ? "回到今年" : "回到今天";
    b.title = "跳到北京时间的今天";
    if (id === "zrStart") b.classList.add("zr-today");
    b.onclick = () => {
      const n = nowBJ();
      if (kind === "year") el.value = n.y;
      else if (kind === "stu") {
        el.value = `${n.y}-${f2(n.m)}-${f2(n.d)}`;
        const t = $("#stuObsT");
        if (t) t.value = `${f2(n.h)}:${f2(n.mi)}`;
        stuRestoreToday(true);
        return;
      } else el.value = `${n.y}-${f2(n.m)}-${f2(n.d)}`;
      el.dispatchEvent(new Event("change", { bubbles: true }));
    };
    if (id === "zrStart") {
      const ctl = el.closest(".xkctl");
      if (ctl) ctl.appendChild(b);
      else el.insertAdjacentElement("afterend", b);
    } else el.insertAdjacentElement("afterend", b);
  });
}
let TD_T = 0;
new MutationObserver((ms) => {
  if (
    ms.every((m) => {
      const t = m.target && m.target.nodeType === 1 ? m.target : null;
      return t && t.closest && t.closest("#orr3dInfo,#tradAstroSvg,#tradAstroInfo,#clock,#log");
    })
  )
    return;
  if (TD_T) return;
  TD_T = setTimeout(() => {
    TD_T = 0;
    try {
      tdScan();
    } catch (e) {
      console.error("tdScan", e);
    }
  }, 350);
}).observe(document.body, { childList: true, subtree: true });

/* ------------------------- 联动总线 ------------------------- */
const FX = { kind: null, id: null, src: "" };
const KWL = Array.isArray(KW) ? KW : String(KW).split(" ");
const fxShort = (full) => {
  const i = KWL.indexOf(full);
  return i >= 0 && ZY_DATA[i] ? ZY_DATA[i][1] : full;
};
const fxFull = (short) => {
  const i = ZY_DATA.findIndex((r) => r[1] === short);
  return i >= 0 ? KWL[i] : short;
};
const FX_KIND = { term: "节气", zhi: "地支", gua: "卦", xiu: "二十八宿", gz: "干支" };
const FX_DICT = (() => {
  const m = new Map();
  TERMS.forEach((n, k) => m.set(n, ["term", k]));
  for (let i = 0; i < 60; i++) m.set(gz(i), ["gz", i]);
  ZY_DATA.forEach((r, i) => {
    m.set(r[1], ["gua", r[1]]);
    if (KWL[i]) m.set(KWL[i], ["gua", r[1]]);
  });
  ZHI.forEach((n, i) => {
    if (!m.has(n)) m.set(n, ["zhi", i]);
  });
  return m;
})();
const FX_XIU = new Map(XIU_NAME.map((n, i) => [n, ["xiu", i]]));
function fxGuess(text, xiuFirst) {
  if (!text) return null;
  text = String(text).replace(/\s+/g, " ").trim();
  if (!text) return null;
  const look = (t) => {
    if (xiuFirst && FX_XIU.has(t)) return FX_XIU.get(t);
    if (FX_DICT.has(t)) return FX_DICT.get(t);
    if (FX_XIU.has(t)) return FX_XIU.get(t);
    return null;
  };
  let r = look(text);
  if (r) return r;
  const s = text.slice(0, 14);
  for (let n = 3; n >= 2; n--)
    for (let i = 0; i + n <= s.length; i++) {
      r = look(s.slice(i, i + n));
      if (r && n >= 2) return r;
    }
  for (let i = 0; i < Math.min(s.length, 8); i++) {
    r = look(s[i]);
    if (r) return r;
  }
  return null;
}
function fxLinks(kind, id) {
  const o = { kind, id, zhi: null, terms: null, gua: null, xiu: null, gz: null };
  if (kind === "zhi") o.zhi = id;
  else if (kind === "term") {
    const lam = id * 15,
      idx = Math.floor(((lam - 315 + 360) % 360) / 30);
    o.zhi = (idx + 2) % 12;
  } else if (kind === "gua") {
    o.gua = id;
    const bg = BG_LIST.find((x) => x[1] === id);
    if (bg) o.zhi = bg[0];
  } else if (kind === "gz") {
    o.gz = id;
    o.zhi = id % 12;
  } else if (kind === "xiu") o.xiu = id;
  if (o.zhi != null) {
    const lam = (315 + 30 * ((o.zhi - 2 + 12) % 12)) % 360;
    o.terms = [(lam / 15) % 24, (lam / 15 + 1) % 24];
  }
  return o;
}
function fxTermDate(k) {
  try {
    const y = nowBJ().y,
      t = calTerms(y).find((x) => x.name === TERMS[k]);
    if (t) return `${t.bj.m}月${t.bj.d}日 ${f2(t.bj.h)}:${f2(t.bj.mi)}`;
  } catch (e) {}
  return "";
}
function fxTitle(kind, id) {
  if (kind === "term") return `节气 · ${TERMS[id]}`;
  if (kind === "zhi") return `地支 · ${ZHI[id]}(${P5_SHENG[id]})`;
  if (kind === "gz") return `干支 · ${gz(id)}`;
  if (kind === "xiu") return `二十八宿 · ${XIU_NAME[id]}宿`;
  if (kind === "gua") return `卦 · ${fxFull(id)}`;
  return "";
}
function fxCard(kind, id) {
  const L = fxLinks(kind, id),
    rows = [],
    chips = [];
  let note = "";
  if (kind === "xiu") {
    const yr = nowBJ().y,
      tb = xiuTable(yr)[id];
    rows.push(
      ["宿名", `${XIU_NAME[id]}宿(${(tb && tb.full) || ""})`],
      ["四象", XIU_SI[id] || ""],
      ["古度", `${XIU_DEG[id]} 度`],
    );
    try {
      if (R && R.astro) {
        const inn = R.astro.planets.slice(0, 7).filter((p) => xiuOf(p.lon, R.t.civ.y).i === id);
        rows.push([
          "盘上七政",
          inn.length ? inn.map((p) => p.n).join("、") + " 在此宿" : "此宿内没有七政",
        ]);
      }
    } catch (e) {}
    chips.push(["xingkong", "星空图"], ["astro", "天象"]);
    note = "二十八宿按宿度划分,与十二地支、十二次不是同一套边界,所以这里不推算对应的地支。";
  } else if (kind === "gua" && L.zhi == null) {
    const r = ZY_DATA.find((x) => x[1] === id);
    if (r) {
      const ul = guaIdToUL(r[0]);
      rows.push(
        ["卦名", `${fxFull(id)}(第 ${ZY_DATA.findIndex((x) => x[1] === id) + 1} 卦)`],
        ["上下卦", `${TRI[ul[0]].n}上 ${TRI[ul[1]].n}下`],
        ["卦辞", r[2]],
      );
      chips.push(["zyopen:" + r[0], "周易原文"]);
    }
    note = "这个卦不属于十二辟卦,因此不和月令挂钩。";
  } else {
    const z = L.zhi;
    if (kind === "gz") {
      rows.push(
        ["干支", `${gz(id)} · 第 ${id + 1} 位`],
        ["纳音", NAYIN[id >> 1]],
        [
          "天干 / 地支",
          `${GAN[id % 10]}(${"木火土金水"[GAN_WX[id % 10]]}) / ${ZHI[z]}(${"木火土金水"[ZHI_WX[z]]})`,
        ],
      );
    }
    if (kind === "term") {
      rows.push(["节气", `${TERMS[id]} · 约 ${fxTermDate(id)}(今年)`]);
      const h = NW_HOU.find((x) => x[0] === TERMS[id]);
      if (h) rows.push(["三候", h[1].join(" → ")]);
      const tip = NW_TERM_TIPS[TERMS[id]];
      if (tip) rows.push(["节令", tip]);
    }
    if (kind === "gua") {
      const bg = BG_LIST.find((x) => x[1] === id);
      rows.push(["十二辟卦", `${id}卦 · ${bg[3]} · 节气 ${bg[4]}`]);
    }
    rows.push(
      ["地支 / 生肖", `${ZHI[z]} / ${P5_SHENG[z]} · ${"木火土金水"[ZHI_WX[z]]}`],
      ["时辰", `${ZHI[z]}时 ${BR_HOUR[z]}`],
      ["月建", `${BR_YUEJIAN[z]}(节气月)`],
      [
        "当月节气",
        L.terms
          .map((k) => `${TERMS[k]}${fxTermDate(k) ? "(" + fxTermDate(k).split(" ")[0] + ")" : ""}`)
          .join("、"),
      ],
      ["月将(六壬)", BR_YUEJIANG[z]],
      ["十二辟卦", BR_BIGUA[z] + "卦"],
      ["十二星次", BR_XINGCI[z]],
      ["经络(子午流注)", brMeridian(z)],
    );
    try {
      const mk = brMarks()[z];
      if (mk.length) rows.push(["在你的盘上", mk.join("、")]);
    } catch (e) {}
    chips.push(
      ["bridge", "地支枢纽"],
      ["sha", "神煞方位"],
      ["jingluo", "经络"],
      kind === "term" ? ["season", "时令"] : ["luopan", "综合罗盘"],
    );
  }
  return `<h4 class="gl">${fxTitle(kind, id)}</h4><div class="tbl-wrap"><table class="tbl"><tbody>${rows.map((r) => `<tr><th>${r[0]}</th><td>${esc(r[1])}</td></tr>`).join("")}</tbody></table></div>${note ? `<p class="note">${note}</p>` : ""}<div class="fx-chips">${chips.map((c) => `<button type="button" class="chip" data-fxgo="${c[0]}">${c[1]}</button>`).join("")}</div>`;
}
function fxGo(code) {
  if (code.startsWith("zyopen:")) {
    try {
      zyOpen(code.slice(7).split("").map(Number), [], "联动");
    } catch (e) {
      selectTab("zy");
    }
    return;
  }
  if (code === "bridge" && FX.kind) {
    const z = fxLinks(FX.kind, FX.id).zhi;
    if (z != null) {
      BR.sel = z;
    }
  }
  selectTab(code, true);
  setTimeout(() => {
    try {
      if (REF_PANES[code]) refRender(code);
    } catch (e) {}
  }, 120);
}
/* ---- 首页圆盘高亮 ---- */
function fxDialClear() {
  if (!dial || !dial.termTx) return;
  [...dial.termTx, ...dial.zhiTx].forEach((t) => t.classList.remove("fx", "fx2"));
  Object.values(dial.hex || {}).forEach((g) => g.classList.remove("fx", "fx2"));
  if (dial.x && dial.x.xiu)
    dial.x.xiu.forEach((x) => {
      x.tx.classList.remove("fx");
      x.sec.classList.remove("fx");
    });
  ["fxT", "fxZ"].forEach((k) => {
    if (dial[k]) dial[k].setAttribute("d", "");
  });
}
function fxDialApply() {
  try {
    fxDialClear();
    if (!FX.kind || !dial || !dial.termTx) return;
    const L = fxLinks(FX.kind, FX.id);
    if (!dial.fxT) {
      dial.fxT = E("path", { class: "fx-sec", d: "" }, dial.termSec.parentNode);
      dial.fxZ = E("path", { class: "fx-sec", d: "" }, dial.hourSec.parentNode);
    }
    const strong = FX.kind;
    if (L.terms)
      L.terms.forEach((k) =>
        dial.termTx[k].classList.add(strong === "term" && k === FX.id ? "fx" : "fx2"),
      );
    if (strong === "term") {
      dial.fxT.setAttribute("d", sector(252, 284, FX.id * 15 - 90, FX.id * 15 - 75));
    }
    if (L.zhi != null) {
      dial.zhiTx[L.zhi].classList.add(strong === "zhi" || strong === "gz" ? "fx" : "fx2");
      dial.fxZ.setAttribute("d", sector(218, 250, 180 + 30 * L.zhi - 15, 180 + 30 * L.zhi + 15));
      const bg = BG_LIST.find((x) => x[0] === L.zhi),
        hf = bg && dial.hex[fxFull(bg[1])];
      if (hf) hf.classList.add(strong === "gua" ? "fx" : "fx2");
    }
    if (strong === "gua" && dial.hex[fxFull(FX.id)]) dial.hex[fxFull(FX.id)].classList.add("fx");
    if (strong === "xiu" && dial.x && dial.x.xiu[FX.id]) {
      const x = dial.x.xiu[FX.id];
      x.tx.classList.add("fx");
      x.sec.classList.add("fx");
    }
  } catch (e) {
    console.error("fxDial", e);
  }
}
/* ---- 焦点条 ---- */
function fxBarRender() {
  let bar = $("#fxBar");
  if (!FX.kind) {
    if (bar) bar.hidden = true;
    return;
  }
  if (!bar) {
    bar = document.createElement("div");
    bar.id = "fxBar";
    bar.setAttribute("role", "status");
    document.body.appendChild(bar);
    bar.addEventListener("click", (e) => {
      const b = e.target.closest("[data-fxa]");
      if (!b) return;
      const a = b.dataset.fxa;
      if (a === "clear") fxClear();
      else if (a === "card") fxPopup(null, null, true);
      else if (a === "dial") {
        const d = $("#dial");
        if (d) {
          if (!STU.active) selectTab("over", false);
          d.scrollIntoView({ behavior: REDUCE ? "auto" : "smooth", block: "center" });
        }
      }
    });
  }
  const L = fxLinks(FX.kind, FX.id),
    bits = [];
  if (L.zhi != null && FX.kind !== "zhi") bits.push(`${ZHI[L.zhi]}`);
  if (L.terms && FX.kind !== "term") bits.push(L.terms.map((k) => TERMS[k]).join("·"));
  if (L.zhi != null) bits.push(`${BR_YUEJIAN[L.zhi]} ${BR_BIGUA[L.zhi]}卦`);
  bar.hidden = false;
  bar.innerHTML = `<b>联动</b><span class="fx-t">${fxTitle(FX.kind, FX.id)}</span><span class="dim sm">${bits.join(" · ")}</span><button type="button" data-fxa="card">详情</button><button type="button" data-fxa="dial">圆盘</button><button type="button" data-fxa="clear" aria-label="清除联动">✕</button>`;
}
function fxPopup(x, y, keep) {
  let p = $("#fxPop");
  if (!FX.kind) {
    if (p) p.hidden = true;
    return;
  }
  if (!p) {
    p = document.createElement("div");
    p.id = "fxPop";
    p.setAttribute("role", "dialog");
    document.body.appendChild(p);
    p.addEventListener("click", (e) => {
      const c = e.target.closest("[data-fxgo]");
      if (c) {
        fxGo(c.dataset.fxgo);
        p.hidden = true;
        return;
      }
      if (e.target.closest(".fx-x")) p.hidden = true;
    });
  }
  p.innerHTML = `<button type="button" class="fx-x" aria-label="关闭">✕</button>${fxCard(FX.kind, FX.id)}`;
  p.hidden = false;
  const w = Math.min(380, innerWidth - 16);
  p.style.width = w + "px";
  if (x == null || keep) {
    p.style.left = Math.max(8, innerWidth - w - 16) + "px";
    p.style.top = "64px";
  } else {
    p.style.left = Math.max(8, Math.min(innerWidth - w - 8, x + 14)) + "px";
    p.style.top = Math.max(56, Math.min(innerHeight - 340, y - 30)) + "px";
  }
}
function fxSet(kind, id, src, pop) {
  if (kind == null) return fxClear();
  FX.kind = kind;
  FX.id = id;
  FX.src = src || "";
  fxDialApply();
  fxBarRender();
  try {
    const dn = $("#bridgeNote");
  } catch (e) {}
  if (pop) fxPopup(pop.x, pop.y);
  else {
    const p = $("#fxPop");
    if (p && !p.hidden) fxPopup(null, null, true);
  }
}
function fxClear() {
  FX.kind = null;
  FX.id = null;
  fxDialApply();
  fxBarRender();
  const p = $("#fxPop");
  if (p) p.hidden = true;
}
document.addEventListener("keydown", (e) => {
  if (
    e.key === "Escape" &&
    !ZM_FB &&
    FX.kind &&
    !(e.target && /INPUT|SELECT|TEXTAREA/.test(e.target.tagName))
  ) {
    const p = $("#fxPop");
    if (p && !p.hidden) p.hidden = true;
  }
});
/* ---- 圆盘点击:按半径定环、按角度定扇区 ---- */
function fxDialHit(e) {
  const svg = $("#dial");
  if (!svg || !dial.termTx) return null;
  const m = svg.getScreenCTM();
  if (!m) return null;
  const pt = svg.createSVGPoint();
  pt.x = e.clientX;
  pt.y = e.clientY;
  const p = pt.matrixTransform(m.inverse()),
    x = p.x - 300,
    y = p.y - 300,
    r = Math.hypot(x, y),
    th = ((Math.atan2(x, -y) * 180) / Math.PI + 360) % 360;
  const t = e.target;
  if (dial.x && dial.x.xiu) {
    const i = dial.x.xiu.findIndex((q) => q.sec === t || q.tx === t);
    if (i >= 0) return ["xiu", i];
  }
  if (r >= 252 && r <= 290) return ["term", Math.floor(((th + 90) % 360) / 15) % 24];
  if (r >= 218 && r < 252) return ["zhi", Math.floor(((((th - 165) % 360) + 360) % 360) / 30) % 12];
  if (r >= 184 && r < 218) {
    const i = th < 180 ? 32 + Math.floor(th / 5.625) : Math.floor((360 - th) / 5.625),
      v = 63 - Math.max(0, Math.min(63, i)),
      ln = [];
    for (let k = 1; k <= 6; k++) ln.push((v >> (6 - k)) & 1);
    return ["gua", fxShort(hexInfo(ln).name)];
  }
  if (r >= 134 && r < 184) {
    let best = null,
      bd = 999;
    Object.keys(PAL_ANG).forEach((pp) => {
      let d = Math.abs(((th - PAL_ANG[pp] + 540) % 360) - 180);
      if (d < bd) {
        bd = d;
        best = pp;
      }
    });
    const nm = TRI[PAL_TRI[best]].n;
    return ZY_DATA.some((q) => q[1] === nm) ? ["gua", nm] : null;
  }
  return null;
}
(function () {
  const svg = document.getElementById("dial");
  if (svg)
    svg.addEventListener("click", (e) => {
      if (STU.active && STU.gest) return;
      const h = fxDialHit(e);
      if (h) fxSet(h[0], h[1], "dial", { x: e.clientX, y: e.clientY });
    });
  /* 其它页面里的盘:点中可识别的文字或 <title>,就设为联动焦点(不弹卡,只亮首页圆盘并出现焦点条) */
  document.addEventListener(
    "click",
    (e) => {
      const t = e.target;
      if (!t || !t.closest) return;
      if (t.closest("#dial,#fxBar,#fxPop,#tnPanel,.zbtn")) return;
      const root = t.closest(".pane svg, #stuSvg");
      if (!root) return;
      const pane = t.closest(".pane"),
        xf = !!(pane && /xingkong|astro/.test(pane.id));
      let hit = null;
      const dk = t.closest("[data-fk]");
      if (dk) hit = [dk.dataset.fk, isNaN(dk.dataset.fid) ? dk.dataset.fid : +dk.dataset.fid];
      const grab = (el) => {
        if (!el || hit) return;
        const ti = [...el.children].find((c) => c.tagName === "title");
        let s = ti ? ti.textContent : "";
        s = s.includes(":")
          ? s.split(":").slice(1).join(":")
          : s.includes("：")
            ? s.split("：").slice(1).join("：")
            : s;
        hit = fxGuess(s, xf);
        if (!hit && el.tagName === "text") hit = fxGuess(el.textContent, xf);
      };
      let el = t;
      for (let i = 0; i < 4 && el && el !== root && !hit; i++) {
        grab(el);
        el = el.parentElement;
      }
      if (!hit && t.closest("#stuSvg"))
        setTimeout(() => {
          const h4 = $("#stuInfo h4");
          if (h4) {
            const g = fxGuess(h4.textContent, false);
            if (g) fxSet(g[0], g[1], "盘库");
          }
        }, 30);
      if (hit) fxSet(hit[0], hit[1], "盘");
    },
    true,
  );
})();

/* =====================================================================
   全站搜索(命令面板):Ctrl/⌘+K 或按 / 打开,顶栏也有“搜索”按钮。
   搜得到:功能与页面、节气 / 地支 / 生肖 / 干支 / 六十四卦 / 二十八宿(直接设为联动焦点)、书目、概念辨析。
   ===================================================================== */
const SR = { open: false, sel: 0, items: [], ent: null };
function srEntities() {
  if (SR.ent) return SR.ent;
  const E2 = [];
  TERMS.forEach((n, k) =>
    E2.push({
      kind: "term",
      id: k,
      t: n,
      s: "节气",
      h: `${n} 节气 ${(NW_HOU.find((x) => x[0] === n) || [0, []])[1].join(" ")}`,
    }),
  );
  ZHI.forEach((n, i) =>
    E2.push({
      kind: "zhi",
      id: i,
      t: `${n}(${P5_SHENG[i]})`,
      s: "地支",
      h: `${n} ${P5_SHENG[i]} ${n}时 地支 生肖 ${BR_YUEJIAN[i]} ${BR_YUEJIANG[i]} ${BR_BIGUA[i]}卦 ${BR_XINGCI[i]} 月将 月建`,
    }),
  );
  for (let i = 0; i < 60; i++)
    E2.push({
      kind: "gz",
      id: i,
      t: gz(i),
      s: "干支",
      h: `${gz(i)} 干支 甲子 ${NAYIN[i >> 1]} 纳音`,
    });
  ZY_DATA.forEach((r, i) =>
    E2.push({
      kind: "gua",
      id: r[1],
      t: fxFull(r[1]),
      s: "卦",
      h: `${r[1]} ${KWL[i]} 卦 周易 六十四卦 ${r[2]}`,
    }),
  );
  XIU_NAME.forEach((n, i) =>
    E2.push({
      kind: "xiu",
      id: i,
      t: n + "宿",
      s: "二十八宿",
      h: `${n} ${n}宿 二十八宿 ${XIU_SI[i] || ""} 星宿`,
    }),
  );
  return (SR.ent = E2);
}
function srRank(q, title, hay) {
  const ts = q.toLowerCase().split(/\s+/).filter(Boolean);
  if (!ts.length) return -1;
  const h = (title + " " + hay).toLowerCase(),
    t = title.toLowerCase();
  if (!ts.every((w) => h.includes(w))) return -1;
  return ts.reduce((a, w) => a + (t === w ? 12 : t.startsWith(w) ? 7 : t.includes(w) ? 4 : 1), 0);
}
function srSearch(q) {
  q = String(q || "").trim();
  const out = [];
  if (!q) return out;
  const add = (sec, arr) =>
    arr.slice(0, sec === "功能" ? 7 : 6).forEach((x) => out.push(Object.assign({ sec }, x)));
  /* 功能 */
  add(
    "功能",
    navSearch(q).map((r) => ({ t: r.n, d: `${r.g} · ${r.d}`, go: () => navGo(r.id) })),
  );
  /* 实体 */
  add(
    "联动",
    srEntities()
      .map((e) => ({ e, r: srRank(q, e.t, e.h) }))
      .filter((x) => x.r >= 0)
      .sort((a, b) => b.r - a.r)
      .map(({ e }) => ({
        t: e.t,
        d: `${e.s} · 设为联动焦点,圆盘同步高亮`,
        go: () => {
          fxSet(e.kind, e.id, "搜索");
          fxPopup(null, null, true);
        },
      })),
  );
  /* 书目 */
  try {
    add(
      "书目",
      LB_BOOKS.map((b) => ({ b, r: srRank(q, b[1], b[2] + " " + b[3] + " " + b[6]) }))
        .filter((x) => x.r >= 0)
        .sort((a, b) => b.r - a.r)
        .map(({ b }) => ({
          t: b[1],
          d: `${b[2]} · ${b[3]}`,
          go: () => {
            selectTab("lib", false);
            LB.q = b[1];
            try {
              renderLib();
            } catch (e) {}
          },
        })),
    );
  } catch (e) {}
  /* 概念辨析 */
  try {
    add(
      "概念",
      KN.map((k) => ({ k, r: srRank(q, k[1], k[0] + " " + k[2] + " " + k[3]) }))
        .filter((x) => x.r >= 0)
        .sort((a, b) => b.r - a.r)
        .map(({ k }) => ({
          t: k[1],
          d: `概念辨析 · ${k[0]}`,
          go: () => {
            selectTab("lib", false);
            KNS.q = k[1];
            KNS.cat = "";
            try {
              renderLib();
            } catch (e) {}
            setTimeout(() => {
              const b = $("#knBox");
              if (b) b.scrollIntoView({ behavior: REDUCE ? "auto" : "smooth", block: "start" });
            }, 200);
          },
        })),
    );
  } catch (e) {}
  return out;
}
function srRender() {
  const box = $("#srList");
  if (!box) return;
  const q = $("#srQ").value;
  SR.items = srSearch(q);
  if (!q.trim()) {
    box.innerHTML = `<div class="sr-hint"><p>输入关键词,直达功能或查对应关系:</p><p class="dim sm">起名 · 结婚 · 风水 · 称骨 · 合婚 · 夏至 · 午 · 甲午 · 姤 · 角宿 · 概念辨析 · 周易</p><p class="dim sm">↑↓ 选择,Enter 打开,Esc 关闭。搜到节气、地支、卦、干支、宿后,首页观象盘会一起高亮。</p></div>`;
    return;
  }
  if (!SR.items.length) {
    box.innerHTML =
      '<div class="sr-hint"><p>没有找到。可以换个关键词,或到“目录”里按类别浏览。</p></div>';
    return;
  }
  SR.sel = Math.min(SR.sel, SR.items.length - 1);
  let last = "";
  box.innerHTML = SR.items
    .map(
      (x, i) =>
        `${x.sec !== last ? `<div class="sr-sec">${(last = x.sec)}</div>` : ""}<button type="button" class="sr-it${i === SR.sel ? " on" : ""}" data-i="${i}"><b>${esc(x.t)}</b><span>${esc(x.d)}</span></button>`,
    )
    .join("");
  const on = box.querySelector(".on");
  if (on && on.scrollIntoView) on.scrollIntoView({ block: "nearest" });
}
function srOpen(init) {
  let m = $("#srBox");
  if (!m) {
    m = document.createElement("div");
    m.id = "srBox";
    m.innerHTML = `<div class="sr-back" data-sr="close"></div><div class="sr-card" role="dialog" aria-label="全站搜索"><input type="search" id="srQ" placeholder="搜索功能、节气、地支、卦、干支、书目、概念…" autocomplete="off" spellcheck="false"><div id="srList"></div></div>`;
    document.body.appendChild(m);
    m.addEventListener("click", (e) => {
      if (e.target.dataset.sr === "close") srClose();
      const b = e.target.closest(".sr-it");
      if (b) srPick(+b.dataset.i);
    });
    $("#srQ").addEventListener("input", () => {
      SR.sel = 0;
      srRender();
    });
    $("#srQ").addEventListener("keydown", (e) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        SR.sel = Math.min(SR.items.length - 1, SR.sel + 1);
        srRender();
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        SR.sel = Math.max(0, SR.sel - 1);
        srRender();
      } else if (e.key === "Enter") {
        e.preventDefault();
        srPick(SR.sel);
      } else if (e.key === "Escape") {
        e.preventDefault();
        srClose();
      }
    });
  }
  m.hidden = false;
  SR.open = true;
  SR.sel = 0;
  const q = $("#srQ");
  q.value = init || "";
  srRender();
  setTimeout(() => q.focus(), 0);
}
function srClose() {
  const m = $("#srBox");
  if (m) m.hidden = true;
  SR.open = false;
}
function srPick(i) {
  const x = SR.items[i];
  if (!x) return;
  srClose();
  try {
    x.go();
  } catch (e) {
    console.error("search go", e);
  }
}
document.addEventListener("keydown", (e) => {
  const typing =
    (e.target && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) ||
    (e.target && e.target.isContentEditable);
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
    e.preventDefault();
    SR.open ? srClose() : srOpen();
  } else if (e.key === "/" && !typing && !SR.open) {
    e.preventDefault();
    srOpen();
  }
});
(function mount(n) {
  const right = document.querySelector("#topnav .tn-right");
  if (!right) {
    if (n < 40) setTimeout(() => mount(n + 1), 250);
    return;
  }
  if ($("#tnSearch")) return;
  const b = document.createElement("button");
  b.type = "button";
  b.className = "tn-b";
  b.id = "tnSearch";
  b.title = "全站搜索（Ctrl/⌘+K 或 /）";
  b.textContent = "搜索";
  b.onclick = () => srOpen();
  right.insertBefore(b, right.querySelector("#tnAll") || right.firstChild);
})(0);

/* =====================================================================
   个人中心(me):资料输入 · 今日建议 · 运势(今日/本周/本月/今年)· 命盘速览 · 报告入口
   所有数字都来自站内已对拍的引擎:四柱 / 十神 / 喜用 / 流年流月 / 黄历 / 紫微 / 星盘 / 吠陀。
   “今日建议”和“运势”是按命主喜忌与日支关系的传统规则启发式,用来提醒自己,不作决定依据。
   ===================================================================== */
const ME = { tab: null };
const ME_TABS = [
  ["today", "今日"],
  ["luck", "运势"],
  ["remind", "提醒"],
  ["chart", "命盘"],
  ["report", "报告"],
  ["data", "资料"],
];
const ME_SS_HINT = {
  比肩: "与人平等、自我主张强。宜独立推进自己的事;忌与人硬争、合伙谈钱。",
  劫财: "竞争与分利的气氛。宜守成、控制开支;忌冲动消费、替人担保。",
  食神: "思路顺、表达好。宜创作、沟通、学新东西;忌过度松懈。",
  伤官: "话多锋利、点子多。宜创意与表达;忌顶撞上级、带情绪写文字。",
  偏财: "机会与人脉流动快。宜社交、拓展、短线事务;忌贪多、冲动投入。",
  正财: "务实稳定。宜对账、谈判落实、守时守约;忌拖延结算。",
  七杀: "压力与挑战感强。宜处理棘手事务、运动;忌硬扛、与强势者正面冲突。",
  正官: "规则与责任感增强。宜见上级、办手续、守规矩;忌违规取巧。",
  偏印: "偏内省、想法独特。宜钻研、独处、整理思路;忌胡思乱想、拖延行动。",
  正印: "受助与学习的日子。宜请教前辈、考试、读书、休养;忌过度依赖。",
};
const MEK = "tianjipan.me.v1";
let MEPROF = null;
try {
  MEPROF = JSON.parse(localStorage.getItem(MEK) || "null");
} catch (e) {}
const meSaveProf = () => {
  try {
    localStorage.setItem(MEK, JSON.stringify(MEPROF));
  } catch (e) {}
};
/* 默认打开时的盘是“此刻盘”,不是任何人的命盘:有姓名、选了人物、出生时刻离现在 >1.5 天,或与已保存的“我”一致,才算个人命盘 */
function meIsPerson() {
  if (!(R && R.bz && R.deep)) return false;
  if (!live && !meSame())
    return false; /* 输入框与盘面不一致(正在载入或没点推演)时,不把盘面当作个人命盘 */
  if (($("#pname") && $("#pname").value.trim()) || PPL.cur) return true;
  if (MEPROF && MEPROF.dt && $("#dt") && $("#dt").value === MEPROF.dt) return true;
  const n = nowBJ(),
    nj = jdFromGreg(n.y, n.m, n.d, n.h, n.mi, 0) - 8 / 24;
  return Math.abs(nj - R.t.jdUT) > 1.5;
}
const meHas = meIsPerson;
function meProfFromInputs() {
  return {
    name: ($("#pname") || {}).value || "",
    gender: $("#gender").value,
    dt: $("#dt").value,
    solar: !!($("#solarChk") && $("#solarChk").checked),
    prov: ($("#pprov") || {}).value || "",
    cty: ($("#pcty") || {}).value || "",
    dis: ($("#pdis") || {}).value || "",
    auto: MEPROF ? MEPROF.auto !== false : true,
  };
}
/* 把资料写回首页输入区并触发起盘;省市区需逐级触发 */
async function meWaitIdle(ms) {
  const t0 = Date.now();
  while (running && Date.now() - t0 < (ms || 15000)) await sleep(100);
}
const meSame = () => {
  const c = parseDt();
  return !!(
    c &&
    R &&
    R.t &&
    R.t.civ.y === c.y &&
    R.t.civ.m === c.m &&
    R.t.civ.d === c.d &&
    R.t.civ.h === c.h &&
    R.t.civ.mi === c.mi
  );
};
async function meApplyProfile(p) {
  const set = (id, v) => {
    const e = $("#" + id);
    if (!e || v == null || v === "") return;
    e.value = v;
    e.dispatchEvent(new Event("change", { bubbles: true }));
  };
  await meWaitIdle(); /* 启动时的首次推演约 3 秒,期间 deduce 会直接丢弃新请求 */
  $("#pname").value = p.name || "";
  $("#gender").value = p.gender;
  if ($("#solarChk")) $("#solarChk").checked = !!p.solar;
  const dt = $("#dt");
  dt.value = p.dt;
  dt.dispatchEvent(new Event("input", { bubbles: true })); /* 只关闭实时流转;不会重算 */
  if (p.prov) {
    set("pprov", p.prov);
    await sleep(80);
  }
  if (p.cty) {
    set("pcty", p.cty);
    await sleep(80);
  }
  if (p.dis) {
    set("pdis", p.dis);
    await sleep(80);
  }
  for (let k = 0; k < 3 && !meSame(); k++) {
    await meWaitIdle();
    const c = parseDt();
    if (!c) break;
    setLive(false);
    await deduce(c, "quick");
  }
  return meSame();
} /* 打开网页时自动载入“我的命盘”(可在资料页关闭);只在用户没动过输入区时执行 */
function meAutoLoad(n) {
  try {
    if (!MEPROF || !MEPROF.auto || !MEPROF.dt) return;
    if (!R || !$("#dt") || !$("#pname")) throw new Error("wait");
    if ($("#pname").value.trim() || PPL.cur) return;
    meApplyProfile(MEPROF);
  } catch (e) {
    if (n < 40) setTimeout(() => meAutoLoad(n + 1), 300);
  }
}
setTimeout(() => meAutoLoad(0), 800);
function meP() {
  const nm = (($("#pname") && $("#pname").value) || "").trim();
  return {
    name: nm || "我",
    gender: R.opt.gender === "M" ? "1" : "0",
    bz: R.bz,
    deep: R.deep || baziDeep(R.bz),
  };
}
const meCmp = (a, b) =>
  a.y - b.y || a.m - b.m || a.d - b.d || (a.h || 0) - (b.h || 0) || (a.mi || 0) - (b.mi || 0);
function meDayScore(P, y, m, d) {
  const di = dayInfo(y, m, d),
    b = scoreGZ(P.bz, P.deep, di.dayIdx, 0.6, 0.4);
  let adj = { adj: 0, why: [] };
  try {
    adj = fateDayAdj(P, di) || adj;
  } catch (e) {}
  const v = b.sc * 0.6 + (adj.adj || 0),
    p = fatePct(v);
  return {
    di,
    ss: shishen(P.bz.dm, di.dayIdx % 10),
    v,
    p,
    label: fateLabel(p),
    why: [...(b.notes || []), ...(adj.why || [])],
  };
}
function meWhyWx(P, idx) {
  const xy = P.deep.xy,
    st = idx % 10,
    br = idx % 12,
    hz = CANG[br][0],
    f = (x) => (xy.favor.includes(x) ? "合喜用" : xy.avoid.includes(x) ? "犯忌神" : "");
  const a = f(GAN_WX[st]),
    b = f(GAN_WX[hz]),
    part = [];
  if (a) part.push(`天干${GAN[st]}(${WXN[GAN_WX[st]]})${a}`);
  if (b) part.push(`地支${ZHI[br]}(${WXN[GAN_WX[hz]]})${b}`);
  return part.join("、");
}
const meWhy = (P, idx, notes) =>
  [meWhyWx(P, idx), ...(notes || [])].filter(Boolean).join("、") || "与命局无明显冲合";
const meCls = (l) => (l === "顺" || l === "偏顺" ? "good" : l === "平" ? "mid" : "bad");
const meBar = (p) => `<span class="mebar"><i style="width:${p}%"></i></span>`;
const meFx = (kind, id, txt) =>
  `<button type="button" class="chip" data-mefx="${kind}:${id}" title="设为联动焦点,首页观象盘同步高亮">${txt}</button>`;
function meHead() {
  const c = R.t.civ,
    lu = R.lunar,
    bz = R.bz,
    nm = (($("#pname") && $("#pname").value) || "").trim() || "我";
  const gz4 = bz.pill.map((p) => GAN[p.s] + ZHI[p.b]).join(" ");
  return `<div class="me-head"><div class="me-av">${esc(nm.slice(0, 1))}</div><div><h3 class="sec" style="margin:0">${esc(nm)} <small class="dim">${R.opt.gender === "M" ? "乾造" : "坤造"} · 属${P5_SHENG[bz.pill[0].b]}</small></h3>
   <div class="kv"><span>${c.y}-${f2(c.m)}-${f2(c.d)} ${f2(c.h)}:${f2(c.mi)}</span><span>四柱 <b>${gz4}</b></span><span>日主 <b>${GAN[bz.dm]}${WXN[GAN_WX[bz.dm]]}</b> · ${R.deep.st.level}</span></div></div></div>`;
}
/* ---------------- 今日 ---------------- */
function meToday() {
  const n = nowBJ(),
    P = meP(),
    bz = P.bz,
    S = meDayScore(P, n.y, n.m, n.d),
    di = S.di,
    db = di.dayIdx % 12,
    hb = ((n.h + 1) >> 1) % 12;
  const rel = [
    ["日支", bz.pill[2].b],
    ["年支(生肖)", bz.pill[0].b],
    ["月支", bz.pill[1].b],
  ]
    .map(([nm, b]) => ({
      nm,
      rs: pplZhiRel(b, db).filter((r) =>
        ["冲", "六合", "半合", "刑", "自刑", "害", "破"].includes(r.t),
      ),
    }))
    .filter((x) => x.rs.length);
  const cd = calDay(n.y, n.m, n.d),
    hrs = hoursOfDay(n.y, n.m, n.d),
    birthZ = bz.pill[0].b,
    dayZ = bz.pill[2].b;
  const good = hrs.filter((h) => h.huang && h.chongZ !== birthZ && h.chongZ !== dayZ),
    avoid = hrs.filter((h) => !h.huang || h.chongZ === birthZ || h.chongZ === dayZ);
  const hr = (h) =>
    `<span class="pill${h.b === hb ? " g" : ""}" title="${h.ts}${h.chongZ === birthZ ? " · 冲你的生肖" : h.chongZ === dayZ ? " · 冲你的日支" : ""}">${h.gz} ${BR_HOUR[h.b]}</span>`;
  return `<div class="panel blk"><h3 class="sec">今日 · ${n.y}.${n.m}.${n.d} <small class="dim">${di.gz}日 · ${di.nayin} · 农历${di.lunar ? (typeof calLM === "function" ? calLM(di.lunar.month, di.lunar.isLeap) + calLD(di.lunar.day) : "") : ""}</small></h3>
   <div class="me-score"><div><span class="big ${meCls(S.label)}">${S.label}</span><small class="dim">今日对你</small></div><div style="flex:1">${meBar(S.p)}<p class="dim sm" style="margin:2px 0 0">倾向指数 ${S.p} / 100(8–96)· 依据:日干 ${GAN[di.dayIdx % 10]} 对你是「${S.ss}」,${S.why.length ? S.why.join("、") : "与命局无明显冲合"}</p></div></div>
   <p class="rt"><b>${S.ss}日</b> · ${ME_SS_HINT[S.ss]}</p>
   ${rel.length ? `<h4 class="gl">地支关系</h4><div class="kv">${rel.map((x) => `<span>${x.nm}:${x.rs.map((r) => `<b class="${r.tone < 0 ? "bad" : "good"}">${esc(r.txt)}</b>`).join(" ")}</span>`).join("")}</div>` : '<p class="dim sm">今日日支与你的年、月、日支没有冲合刑害。</p>'}
   <div class="p5-wrap" style="grid-template-columns:repeat(auto-fit,minmax(260px,1fr))"><div><h4 class="gl">宜</h4><p class="rt">${(di.yi || []).slice(0, 10).join("、") || "—"}</p><h4 class="gl">忌</h4><p class="rt">${(di.ji || []).slice(0, 10).join("、") || "—"}</p><p class="dim sm">黄历宜忌是通用的,不分人;上面的评分才结合了你的八字。</p></div>
   <div><h4 class="gl">用时参考(黄道时辰,已避开冲你生肖/日支)</h4><div class="chips">${good.map(hr).join(" ") || "—"}</div><h4 class="gl" style="margin-top:8px">少用</h4><div class="chips">${avoid.map(hr).join(" ") || "—"}</div><p class="dim sm">金色为此刻所在时辰。</p></div></div>
   <div class="kv"><span>财神 <b>${cd.pos.cai}</b></span><span>喜神 <b>${cd.pos.xi}</b></span><span>福神 <b>${cd.pos.fu}</b></span><span>冲 <b>${di.chong}</b>(${ZHI[(db + 6) % 12]})</span><span>煞 <b>${di.sha}</b></span></div>
   <div class="fx-chips">${meFx("gz", di.dayIdx, "今日 " + di.gz + " → 联动")}${meFx("zhi", db, "日支 " + ZHI[db] + " → 联动")}${meFx("zhi", di.mz, "月建 " + ZHI[di.mz] + " → 联动")}</div></div>`;
}
/* ---------------- 运势 ---------------- */
function meLuck() {
  const n = nowBJ(),
    P = meP(),
    bz = P.bz,
    days = [];
  for (let i = 0; i < 7; i++) {
    const t = calAddDays(n.y, n.m, n.d, i);
    days.push({
      t,
      S: meDayScore(P, t.y, t.m, t.d),
      w: "日一二三四五六"[new Date(t.y, t.m - 1, t.d).getDay()],
    });
  }
  const mons = [...liuyue(bz, P.deep, n.y - 1), ...liuyue(bz, P.deep, n.y)].filter(
      (m) => meCmp(m.from, n) <= 0,
    ),
    cur = mons[mons.length - 1];
  const cycY = (function () {
    const a = liuyue(bz, P.deep, n.y)[0];
    return meCmp(a.from, n) <= 0 ? n.y : n.y - 1;
  })();
  const ml = liuyue(bz, P.deep, cycY),
    ly = liunian(bz, P.deep, cycY, 1)[0],
    ts = fateTaisui(P, cycY),
    dyT = dayunTable(bz, P.deep),
    dyI = dayunNow(R),
    dy = dyI >= 0 ? dyT[dyI] : null;
  const lp = (sc) => fatePct(sc * 0.6);
  return `<div class="panel blk"><h3 class="sec">运势 <small class="dim">按你的喜忌与干支关系的传统规则算出,仅作自我提醒</small></h3>
   <h4 class="gl">本周(7 天)</h4><div class="tbl-wrap"><table class="tbl"><thead><tr><th>日期</th><th>干支</th><th>十神</th><th>倾向</th><th></th><th>依据</th></tr></thead><tbody>${days.map((x, i) => `<tr${i === 0 ? ' class="on"' : ""}><th>${x.t.m}/${x.t.d} 周${x.w}${i === 0 ? " · 今" : ""}</th><td>${x.S.di.gz}</td><td>${x.S.ss}</td><td class="${meCls(x.S.label)}">${x.S.label}</td><td style="width:90px">${meBar(x.S.p)}</td><td class="dim sm">${x.S.why.slice(0, 3).join("、") || "—"}</td></tr>`).join("")}</tbody></table></div>
   <h4 class="gl">本月 · ${cur.name}月 ${cur.gz}(${cur.ss}) <small class="dim">${cur.from.m}月${cur.from.d}日起</small></h4>
   <p class="rt"><b class="${LVC(cur.lv)}">${cur.lv}</b> · ${meWhy(P, ganzhiIdxOf(cur.gz), cur.notes)}。${ME_SS_HINT[cur.ss] || ""}</p>
   <div class="me-mon">${ml.map((m) => `<div class="${m.name === cur.name && meCmp(m.from, cur.from) === 0 ? "on " : ""}${LVC(m.lv)}" title="${m.name}月 ${m.gz} · ${meWhy(P, ganzhiIdxOf(m.gz), m.notes)}"><b>${m.name}</b><span>${m.gz}</span>${meBar(lp(m.sc))}<em>${m.lv}</em></div>`).join("")}</div>
   <h4 class="gl">今年 · ${cycY} 年 ${ly.gz}(${ly.ss}) <small class="dim">立春换年</small></h4>
   <p class="rt"><b class="${LVC(ly.lv)}">${ly.lv}</b> · ${meWhy(P, ly.idx, ly.notes)}。${ts.items.length ? `<br>太岁关系:${ts.items.map((x) => `<b class="${x.v < 0 ? "bad" : "good"}">${x.name}</b>(${esc(x.raw)})`).join("、")}` : "<br>与太岁无冲刑破害合。"}</p>
   ${dy ? `<h4 class="gl">当前大运 · ${dy.gz}(${dy.ss}) <small class="dim">${dy.age ? dy.age + "岁起" : ""}</small></h4><p class="rt"><b class="${LVC(dy.lv)}">${dy.lv}</b> · ${meWhy(P, dy.idx, dy.notes)}。</p>` : ""}
   <div class="fx-chips">${meFx("gz", ly.idx, cycY + " " + ly.gz + " → 联动")}${meFx("zhi", ly.idx % 12, "太岁 " + ZHI[ly.idx % 12] + " → 联动")}</div>
   <p class="note">倾向分的来源:天干地支与命主“喜用/忌神”五行的契合,加上与日支、月支、年支的冲合刑害。与八字页的流年流月使用同一套 scoreGZ,与事项运势页的日期加减同源。它回答“这段时间的气氛对我顺不顺”,不回答“会发生什么”。</p></div>`;
}
/* ---------------- 命盘速览 ---------------- */
function meChart() {
  const P = meP(),
    bz = P.bz,
    D = P.deep,
    dm = bz.dm,
    L = ["年", "月", "日", "时"];
  const pil = bz.pill
    .map(
      (p, i) =>
        `<div class="me-pil${i === 2 ? " me" : ""}"><small>${L[i]}柱</small><b>${GAN[p.s]}</b><b>${ZHI[p.b]}</b><small>${i === 2 ? "日主" : shishen(dm, p.s)}</small><small class="dim">${CANG[p.b].map((g) => GAN[g] + shishen(dm, g)).join(" ")}</small><small class="dim">${NAYIN[ganzhiIdx(p.s, p.b) >> 1]}</small></div>`,
    )
    .join("");
  const xy = D.xy,
    wn = (a) => a.map((x) => WXN[x]).join("、"),
    zm = R.zw && R.zw.pal ? R.zw.pal.find((p) => p.isMing) : null;
  let ast = "",
    ved = "",
    mg = "";
  try {
    const C = a2Chart(R.t.jdUT, +R.opt.lon || 120, +R.opt.lat || 24.5, "placidus"),
      sun = C.planets.find((p) => p.n === "太阳"),
      mo = C.planets.find((p) => p.n === "月亮");
    ast = `<span>太阳 <b>${A2_SIGN[sun.sign]}</b></span><span>月亮 <b>${A2_SIGN[mo.sign]}</b></span><span>上升 <b>${A2_SIGN[Math.floor(C.A.asc / 30)]}</b></span>`;
  } catch (e) {}
  try {
    const V = v2Chart(R.t.jdUT, +R.opt.lon || 120, +R.opt.lat || 24.5),
      m = V.planets.find((p) => p.n === "月亮"),
      Dd = v2Dasha(R.t.jdUT, m.sid),
      nj = jdFromGreg(nowBJ().y, nowBJ().m, nowBJ().d, 12, 0, 0) - 8 / 24,
      cur = Dd.list.find((x) => nj >= x.start && nj < x.end);
    ved = `<span>月宿 <b>${m.nak.name} 第${m.nak.pada}足</b></span><span>当前大运 <b>${cur ? V2_LORDCN[cur.lord] : "—"}</b></span>`;
  } catch (e) {}
  try {
    const g = mingGuaOf(bz.yearNum, R.opt.gender);
    mg = `<span>命卦 <b>${g.name}(${g.east ? "东" : "西"}四命)</b></span>`;
  } catch (e) {}
  return `<div class="panel blk"><h3 class="sec">命盘速览</h3><div class="me-pils">${pil}</div>
   <div class="kv"><span>日主 <b>${GAN[dm]}${WXN[GAN_WX[dm]]}</b>(${D.st.level})</span><span>喜用 <b class="good">${wn(xy.favor)}</b></span><span>忌 <b class="bad">${wn(xy.avoid)}</b></span><span>格局 <b>${(D.gj && D.gj.name) || "—"}</b></span><span>空亡 <b>${D.kong ? D.kong.map((z) => ZHI[z]).join("") : "—"}</b></span></div>
   <div class="kv">${zm ? `<span>紫微命宫 <b>${ZHI[zm.b]}</b> · ${zm.stars.map((s) => s.n).join(" ") || "空宫"}</span>` : ""}${mg}</div>
   <div class="kv">${ast}</div><div class="kv">${ved}</div>
   <div class="fx-chips">${[
     ["bazi", "八字详盘"],
     ["ziwei", "紫微斗数"],
     ["natal", "西方星盘"],
     ["vedic", "吠陀占星"],
     ["qizheng", "七政四余"],
     ["guide", "个人指南"],
   ]
     .map(([k, n]) => `<button type="button" class="chip" data-mego="${k}">${n}</button>`)
     .join("")}</div></div>`;
}
/* ---------------- 报告 ---------------- */
function meSummaryText() {
  const n = nowBJ(),
    P = meP(),
    bz = P.bz,
    D = P.deep,
    c = R.t.civ,
    S = meDayScore(P, n.y, n.m, n.d),
    xy = D.xy,
    wn = (a) => a.map((x) => WXN[x]).join("、");
  const cycY = (function () {
      const a = liuyue(bz, D, n.y)[0];
      return meCmp(a.from, n) <= 0 ? n.y : n.y - 1;
    })(),
    ly = liunian(bz, D, cycY, 1)[0];
  return [
    `【${P.name} 的命盘摘要】`,
    `出生:${c.y}-${f2(c.m)}-${f2(c.d)} ${f2(c.h)}:${f2(c.mi)}(${R.opt.gender === "M" ? "乾造" : "坤造"})`,
    `四柱:${bz.pill.map((p) => GAN[p.s] + ZHI[p.b]).join(" ")}`,
    `日主:${GAN[bz.dm]}${WXN[GAN_WX[bz.dm]]}(${D.st.level}),喜用 ${wn(xy.favor)},忌 ${wn(xy.avoid)}`,
    `今日(${n.y}-${f2(n.m)}-${f2(n.d)} ${S.di.gz}日):${S.ss},对你${S.label}。${ME_SS_HINT[S.ss]}`,
    `今年(${cycY} ${ly.gz}):${ly.lv}。${meWhy(P, ly.idx, ly.notes)}`,
    "(来源:天机盘,传统规则,仅供自我参考)",
  ].join("\n");
}
function meReport() {
  const cards = [
    ["guide", "个人指南", "优势、短板、近期节奏"],
    ["bazi", "八字详盘", "四柱、十神、大运流年、互动细盘"],
    ["ziwei", "紫微斗数", "十二宫、四化、大限流年"],
    ["over", "总览 · AI 解读 · PDF", "综合方位、AI 解读、详细文字报告、导出 PDF"],
    ["fate", "事项运势", "结婚、事业、看房等八类"],
    ["hepan", "合盘 · 合婚", "与另一人的契合度"],
    ["net", "关系网", "人物册与关系"],
  ];
  return `<div class="panel blk"><h3 class="sec">报告与导出</h3><div class="me-cards">${cards.map(([k, n, d]) => `<button type="button" class="me-card" data-mego="${k}"><b>${n}</b><span>${d}</span></button>`).join("")}</div>
   <div class="p5-ctl" style="margin-top:10px"><button type="button" class="gbtn" id="meCopy">复制命盘摘要</button><button type="button" class="gbtn" id="meRep">生成详细文字报告</button><button type="button" class="gbtn" id="mePdf">去导出 PDF</button></div>
   <pre class="me-pre" id="mePre" hidden></pre><p class="note">“详细文字报告”和“导出 PDF”沿用总览页的同一套生成逻辑,这里只是入口。</p></div>`;
}
/* ---------------- 资料 ---------------- */
function meData() {
  const g = $("#gender"),
    goptions = [...g.options]
      .map(
        (o) =>
          `<option value="${o.value}"${o.value === g.value ? " selected" : ""}>${esc(o.textContent)}</option>`,
      )
      .join("");
  const place = ["#pprov", "#pcty", "#pdis"]
    .map((q) => {
      const s = $(q);
      return s && s.selectedOptions[0] ? s.selectedOptions[0].textContent : "";
    })
    .filter(Boolean)
    .join(" · ");
  return `<div class="panel blk"><h3 class="sec">我的资料 <small class="dim">填写后自动起盘,本页和全站同步</small></h3>
   <div class="p5-ctl"><label>称呼 <input type="text" id="meN" value="${esc(($("#pname") || {}).value || "")}" placeholder="我"></label><label>性别 <select id="meG">${goptions}</select></label><label>出生日期时间 <input type="datetime-local" id="meD" value="${esc(($("#dt") || {}).value || "")}" min="1901-01-01T00:00" max="2099-12-31T23:59"></label>
   <label class="chk"><input type="checkbox" id="meS"${$("#solarChk") && $("#solarChk").checked ? " checked" : ""}> 真太阳时校正</label></div>
   <label class="chk"><input type="checkbox" id="meAuto"${!MEPROF || MEPROF.auto !== false ? " checked" : ""}> 下次打开网页时自动载入我的命盘</label>
   <p class="dim sm">出生地:<b>${esc(place || "未选择")}</b> <button type="button" class="lnk" id="mePlace">修改出生地…</button>(省市区在页面顶部「人物 · 起局」里选,真太阳时与节气边界都会用到)</p>
   <div class="p5-ctl"><button type="button" class="gbtn" id="meGo">按此资料起盘</button><button type="button" class="gbtn" id="meSave">保存到人物册</button><button type="button" class="gbtn" id="meForget">清除我的资料</button></div>
   <p class="note">资料只保存在本机浏览器里,不会上传。需要保存多个人(家人、朋友)并建立关系,请用「关系网」。</p></div>`;
}
function mePage() {
  if (!ME.tab) ME.tab = meHas() ? "today" : "data";
  const nav = `<div class="me-tabs" role="tablist">${ME_TABS.map(([k, n]) => `<button type="button" role="tab" class="chip${ME.tab === k ? " on" : ""}" data-metab="${k}"${!meHas() && k !== "data" ? " disabled" : ""}>${n}</button>`).join("")}</div>`;
  if (!meHas())
    return `<div class="panel blk"><h3 class="sec">个人中心</h3><p class="note">现在页面上的盘是“此刻盘”(按当前时间排的),还不是你自己的命盘。填写下面的出生信息,就能看到你的今日建议、运势、命盘速览和报告;资料会保存在本机,下次打开自动载入。</p></div>${meData()}`;
  const body = {
    today: meToday,
    luck: meLuck,
    remind: meRemind,
    chart: meChart,
    report: meReport,
    data: meData,
  }[ME.tab]();
  return `<div class="panel blk me-top">${meHead()}${nav}</div>${body}`;
}
function meBind() {
  $$("[data-metab]").forEach(
    (b) =>
      (b.onclick = () => {
        ME.tab = b.dataset.metab;
        refRender("me");
      }),
  );
  $$("[data-mego]").forEach(
    (b) =>
      (b.onclick = () => {
        selectTab(b.dataset.mego, true);
      }),
  );
  $$("[data-mefx]").forEach(
    (b) =>
      (b.onclick = (e) => {
        const [k, i] = b.dataset.mefx.split(":");
        fxSet(k, +i, "个人中心", { x: e.clientX, y: e.clientY });
      }),
  );
  const go = $("#meGo");
  if (go)
    go.onclick = () => {
      const d = $("#meD").value;
      if (!d) {
        toast("请填写出生日期时间");
        return;
      }
      const pr = Object.assign(meProfFromInputs(), {
        name: $("#meN").value.trim(),
        gender: $("#meG").value,
        dt: d,
        solar: $("#meS").checked,
        auto: $("#meAuto").checked,
      });
      MEPROF = pr;
      meSaveProf();
      meApplyProfile(pr);
      toast("正在起盘,资料已保存在本机");
      ME.tab = "today";
      setTimeout(() => {
        if (R) refRender("me");
      }, 2500);
    };
  const au = $("#meAuto");
  if (au)
    au.onchange = () => {
      if (MEPROF) {
        MEPROF.auto = au.checked;
        meSaveProf();
      }
    };
  const fg = $("#meForget");
  if (fg)
    fg.onclick = () => {
      MEPROF = null;
      try {
        localStorage.removeItem(MEK);
      } catch (e) {}
      toast("已清除本机保存的个人资料(不影响人物册)");
      refRender("me");
    };
  const sv = $("#meSave");
  if (sv)
    sv.onclick = () => {
      const b = $("#saveP");
      if (b) {
        b.click();
        toast("已提交到人物册(见关系网)");
      }
    };
  const pl = $("#mePlace");
  if (pl)
    pl.onclick = () => {
      const t = $("#pprov");
      if (t) {
        t.scrollIntoView({ behavior: REDUCE ? "auto" : "smooth", block: "center" });
        t.focus();
      }
    };
  const cp = $("#meCopy");
  if (cp)
    cp.onclick = () => {
      const t = meSummaryText(),
        pre = $("#mePre");
      pre.hidden = false;
      pre.textContent = t;
      (navigator.clipboard && navigator.clipboard.writeText
        ? navigator.clipboard.writeText(t).then(
            () => toast("已复制"),
            () => toast("请手动复制下方文字"),
          )
        : Promise.reject()
      ).catch?.(() => toast("请手动复制下方文字"));
    };
  const rp = $("#meRep");
  if (rp)
    rp.onclick = () => {
      selectTab("over", true);
      setTimeout(() => {
        const b = $("#repBtn");
        if (b) {
          b.scrollIntoView({ block: "center" });
          b.click();
        }
      }, 500);
    };
  const pd = $("#mePdf");
  if (pd)
    pd.onclick = () => {
      selectTab("over", true);
      setTimeout(() => {
        const b = $$("#pane-over button").find((x) => /导出 PDF/.test(x.textContent));
        if (b) {
          b.scrollIntoView({ block: "center" });
          b.focus();
          toast("点这里导出 PDF");
        }
      }, 500);
    };
}
REF_PANES.me = mePage;
REF_BIND.me = meBind;
/* v69：顶部导航不再挂载“个人中心”直达按钮；人物相关入口保留人物关系册 / 八字 / 紫微等。 */

/* ================= 事项运势 ================= */
const FT = { who: "cur", scn: "结婚", inv: {}, cache: {} };
const FT_WD = "日一二三四五六";
function ftPersons() {
  const out = [];
  try {
    if (R && R.bz) {
      const nm = (($("#pname") && $("#pname").value) || "").trim();
      out.push({
        id: "cur",
        label: "当前命盘" + (nm ? "(" + nm + ")" : ""),
        P: {
          name: nm || "当前命盘",
          gender: R.opt.gender === "M" ? "1" : "0",
          bz: R.bz,
          deep: baziDeep(R.bz),
        },
      });
    }
  } catch (e) {}
  PPL.people.forEach((p) => {
    const e = pplEng(p);
    if (e) out.push({ id: p.id, label: p.name + (p.tag ? "(" + p.tag + ")" : ""), P: e });
  });
  return out;
}
function ftBar(p, cls) {
  return p === null
    ? ""
    : `<div class="ftbar ${cls || ""}"><i style="width:${p}%"></i><b>${p}</b></div>`;
}
function renderFate() {
  const pane = $("#pane-fate");
  if (!pane) return;
  pane.dataset.built = "1";
  const list = ftPersons();
  if (!list.length) {
    pane.innerHTML =
      '<div class="panel blk"><h3 class="sec">事项运势</h3><p class="rt">请先在首页填写出生信息并推演,或在人物册里保存人物,这里才能按个人八字给出提示。</p></div>';
    return;
  }
  if (!list.some((x) => x.id === FT.who)) FT.who = list[0].id;
  const cur = list.find((x) => x.id === FT.who),
    P = cur.P,
    n = nowBJ(),
    year = n.y;
  const people = list.filter((x) => x.id !== "cur" || list.length === 1).map((x) => x.P);
  const involved = list
    .filter((x) => x.id !== FT.who && FT.inv[x.id] !== false && x.id !== "cur")
    .map((x) => x.P)
    .concat([P]);
  const key = [
    FT.who,
    FT.scn,
    year,
    n.m,
    n.d,
    involved.map((x) => x.name + x.bz.dayIdx).join(","),
  ].join("|");
  const rep = FT.cache[key] || (FT.cache[key] = fateReport(P, FT.scn, year, n, involved));
  const all = FATE_ORDER.map((s) => ({ s, y: fateYear(P, s, year) }));
  const S = rep.S,
    y = rep.year,
    ts = y.ts;
  const liveWarn =
    typeof live !== "undefined" && live && FT.who === "cur"
      ? '<p class="note bad">当前是“实时流转”的盘,并非出生命盘。请先关闭实时流转,或在首页填写出生信息后再看。</p>'
      : "";
  const ov = `<div class="ftgrid">${all.map(({ s, y: r }) => `<button type="button" class="ftcard${s === FT.scn ? " on" : ""}${FATE_SCN[s].grave ? " grave" : ""}" data-s="${s}"><span class="ftseal">${FATE_SCN[s].icon}</span><b>${s}</b>${FATE_SCN[s].grave ? "<small>只看避忌</small>" : `<small>${year}年 ${r.label}</small>${ftBar(r.p)}`}</button>`).join("")}</div>`;
  const tsHtml = ts.items.length
    ? ts.items
        .map(
          (x) => `<li class="${x.v > 0 ? "good" : "bad"}"><b>${x.name}</b> ${x.raw}:${x.txt}</li>`,
        )
        .join("")
    : `<li>${year}年(${gz((((year - 4) % 60) + 60) % 60)})与本命年支${ZHI[P.bz.pill[0].b]}(${ZODIAC[P.bz.pill[0].b]})无冲、刑、害、破、合,不犯太岁,无额外加减。</li>`;
  const mths = rep.months
    .map((m, i) => {
      const key = (x) => x.y * 10000 + x.m * 100 + x.d,
        tk = key(n),
        nowI = rep.months.reduce((a, mm, k) => (key(mm.from) <= tk ? k : a), -1),
        isNow = i === nowI,
        hide = S.grave;
      return hide
        ? ""
        : `<div class="ftm${isNow ? " now" : ""}" title="${m.gz}月 · ${m.notes.join("、") || "无明显加减"}"><div class="ftmb"><i style="height:${m.p}%"></i></div><b>${m.name}</b><small>${m.p}</small></div>`;
    })
    .join("");
  const invBox =
    (S.grave || ["结婚", "进新房", "看房", "办公"].includes(FT.scn)) && list.length > 1
      ? `<div class="ftinv"><span class="dim sm">涉及人员(核对冲煞):</span>${
          list
            .filter((x) => x.id !== FT.who && x.id !== "cur")
            .map(
              (x) =>
                `<label class="chk sm"><input type="checkbox" data-inv="${x.id}"${FT.inv[x.id] !== false ? " checked" : ""}> ${esc(x.P.name)}</label>`,
            )
            .join("") || '<span class="dim sm">人物册里还没有其他人</span>'
        }</div>`
      : "";
  const pickList = invBox && rep.clean.length ? rep.clean : rep.pick;
  const dates =
    pickList
      .map((d) => {
        const i = d.info,
          wd = FT_WD[new Date(Date.UTC(i.y, i.m - 1, i.d)).getUTCDay()];
        const tierN = ["忌", "慎", "平", "宜", "吉"][d.tier] || "";
        return `<li class="ftd"><div class="ftdh"><b>${i.m}月${i.d}日 周${wd}</b><span class="dim">${i.gz}日 · ${i.zx}日 · ${i.ts}${i.huang ? "(黄道)" : ""}</span><span class="pill tierp t${d.tier}">${tierN}</span>${d.conflicts.length ? d.conflicts.map((c) => `<span class="pill bad">${esc(c.who)}${c.t}</span>`).join("") : invBox ? '<span class="pill good">无人相冲</span>' : ""}<button class="gbtn sm" data-cal="${i.y}-${i.m}-${i.d}">万年历</button></div><div class="dim sm">${d.why.join(";")} ⇒ 个人增强分 ${d.sc.toFixed(1)}</div></li>`;
      })
      .join("") ||
    '<li class="dim">未来 90 天内没有同时满足条件的日期,可放宽条件或改看更远的日子。</li>';
  const D = rep.dirs,
    kindTxt = {
      居: "房屋的朝向/入户门、床头与书桌朝向",
      喜: "迎亲出发与婚床朝向",
      财: "办公桌朝向、主要座位与财位",
      行: "出行的方向",
    }[D.kind];
  const dirs = S.grave
    ? `<p class="rt">出殡、入土时避开当日“煞”所在方向;怀孕者与生肖相冲者可不到场。<b>这里不给方位吉凶。</b></p>`
    : `<p class="rt">命卦 <b>${D.mg.name}</b>。${kindTxt}可取:${D.good.map((d) => `<b class="good">${d.n}</b>(${d.dir})`).join("、")};宜避:${D.bad.map((d) => `${d.n}(${d.dir})`).join("、")}。</p><p class="rt">命主喜用五行:${D.favWx.map((f) => `<span class="pill wxp wx${f.wx}">${NM_WXN[f.wx]}</span> 方位${f.dir}、色系${f.color}`).join(";")}。</p>`;
  const who = `<select id="ftWho" aria-label="为谁看">${list.map((x) => `<option value="${x.id}"${x.id === FT.who ? " selected" : ""}>${esc(x.label)}</option>`).join("")}</select>`;
  pane.innerHTML = `<div class="panel blk"><h3 class="sec">事项运势 · 个人提示</h3>
    <div class="row3"><label class="sm dim">为谁看 ${who}</label><span class="dim sm">${ZHI[P.bz.pill[0].b]}${ZODIAC[P.bz.pill[0].b]}年生 · 日主${GAN[P.bz.dm]}${NM_WXN[GAN_WX[P.bz.dm]]} · ${P.deep.st.level} · 喜用 ${P.deep.xy.favor.map((e) => NM_WXN[e]).join("")}</span></div>${liveWarn}
    <p class="note">按个人八字的喜忌、十神、犯太岁,结合择日与八宅方位,对八类事项给出提示。分数只表示“顺遂倾向”,不是结论;大事请结合实际条件与专业意见。</p>${ov}</div>
    <div class="panel blk"><h3 class="sec">${FT.scn} · ${S.desc}</h3>
    ${S.grave ? `<p class="rt">丧葬事宜以<b>尊重、从简、合乎家族与当地习俗</b>为先。下面只列传统历书的避忌与可参考日期,不做“运势”判断。</p>` : `<div class="ftyear"><div><small>${year}年 流年${y.gz}(${y.ss})</small><div class="ftbig ${y.p >= 60 ? "good" : y.p < 45 ? "bad" : ""}">${y.label}<em>${y.p}</em></div>${ftBar(y.p)}<div class="dim sm">${y.notes.join("、") || "无明显加减"}</div></div><div><small>${year + 1}年 流年${rep.next.gz}(${rep.next.ss})</small><div class="ftbig ${rep.next.p >= 60 ? "good" : rep.next.p < 45 ? "bad" : ""}">${rep.next.label}<em>${rep.next.p}</em></div>${ftBar(rep.next.p)}<div class="dim sm">${rep.next.notes.join("、") || "无明显加减"}</div></div></div>`}
    <h4 class="gl">犯太岁 · ${year}年</h4><ul class="cul pl">${tsHtml}</ul>
    ${S.grave ? "" : `<h4 class="gl">${year}年逐月(交节为界)</h4><div class="ftmonths">${mths}</div><p class="note">条高代表该月对「${FT.scn}」的顺遂倾向较高。当前月已标出。</p>`}
    <h4 class="gl">${S.grave ? "可参考的日期(未来 90 天)" : "择吉日(未来 90 天 · 已按个人八字加减)"}</h4>${invBox}<ul class="ftdates">${dates}</ul>
    <p class="note">基础分来自历书(建除、黄黑道、宜忌),再按你的喜忌与日支关系加减;冲本命生肖、历书忌该事项、月破的日子已剔除。细看某天的十二时辰,可点“万年历”。</p>
    <h4 class="gl">方位与五行</h4>${dirs}
    <h4 class="gl">注意</h4><ul class="cul">${rep.caution.map((c) => `<li>${c}</li>`).join("")}${ts.items.some((x) => x.k === "冲") && !S.grave ? `<li>今年冲太岁:${FT.scn}相关的重大变动,尽量安排在流月较顺的月份,并做好备案。</li>` : ""}</ul></div>`;
  $$(".ftcard", pane).forEach(
    (b) =>
      (b.onclick = () => {
        FT.scn = b.dataset.s;
        renderFate();
      }),
  );
  $("#ftWho").onchange = (e) => {
    FT.who = e.target.value;
    renderFate();
  };
  $$("[data-inv]", pane).forEach(
    (c) =>
      (c.onchange = () => {
        FT.inv[c.dataset.inv] = c.checked;
        renderFate();
      }),
  );
  $$("[data-cal]", pane).forEach(
    (b) =>
      (b.onclick = () => {
        const [yy, mm, dd] = b.dataset.cal.split("-").map(Number);
        try {
          calOpenFromZeri({ y: yy, m: mm, d: dd, h: 12, mi: 0, s: 0 }, S.ev);
        } catch (e) {
          try {
            calOpen({ y: yy, m: mm, d: dd, h: 12, mi: 0, s: 0 });
          } catch (e2) {
            toast("请点顶栏“万年历”查看");
          }
        }
      }),
  );
}

/* ================= 姓名 · 文字五行 · 开店取名 ================= */
const NM = { ov: {}, ind: "茶饮咖啡", who: "cur", sel: null, gen: null };
function nmFav(who) {
  const l = ftPersons().find((x) => x.id === who);
  if (!l) return null;
  const xy = l.P.deep.xy;
  return { favor: xy.favor, avoid: xy.avoid, name: l.P.name };
}
function nmShareBar(sh) {
  return `<div class="wxbar big">${sh.map((v, e) => `<i class="wx${e}" style="flex:${Math.max(v, 0.001)}"><span>${v >= 0.06 ? NM_WXN[e] + " " + Math.round(v * 100) + "%" : ""}</span></i>`).join("")}</div>`;
}
function nmRing(score, rating) {
  const c = score >= 85 ? "good" : score >= 58 ? "mid" : "bad";
  return `<div class="nmring ${c}"><b>${score}</b><small>${rating}</small></div>`;
}
function nmPartsHTML(parts) {
  return `<table class="tbl sm"><tbody>${parts.map((p) => `<tr><th>${p.k}</th><td><div class="barx"><i style="width:${p.s}%"></i></div></td><td><b>${p.s}</b></td><td class="dim">权重${p.w} · ${esc(p.t)}</td></tr>`).join("")}</tbody></table>`;
}
function nmPersonHTML() {
  const v = (($("#nmName") && $("#nmName").value) || "").trim(),
    sl = +(($("#nmSl") && $("#nmSl").value) || 0),
    fa = nmFav(NM.who);
  if (!v)
    return '<p class="dim">输入姓名(如“王海洋”“欧阳修”),即可看到笔画、五格、三才、五行与综合评分。</p>';
  const r = nmScore(v, { sLen: sl || 0, ov: NM.ov, favor: fa && fa.favor, avoid: fa && fa.avoid });
  if (!r) return '<p class="dim">请输入至少两个字。</p>';
  if (r.incomplete)
    return `<p class="note bad">「${r.unk.join("、")}」不在常用字库(约 6700 字)内,无法自动取笔画。可换字,或在下表手动填入康熙笔画。</p>${nmCharTable(r.S.concat(r.G), true)}`;
  const w = r.w,
    gcards = ["tian", "ren", "di", "wai", "zong"]
      .map(
        (k) =>
          `<div class="nmg ${w[k].sl.t === "吉" ? "good" : w[k].sl.t === "凶" ? "bad" : "mid"}"><small>${w[k].name}</small><b>${w[k].n}</b><span class="wxp wx${w[k].wx}">${NM_WXN[w[k].wx]}</span><em>${w[k].sl.t}</em></div>`,
      )
      .join("");
  return `<div class="nmtop">${nmRing(r.total, r.rating)}<div><div class="nmname">${r.S.map((x) => x.c).join("")}<span class="dim">|</span>${r.G.map((x) => x.c).join("")}</div><div class="dim sm">${fa ? `按「${esc(fa.name)}」的八字喜用(${fa.favor.map((e) => NM_WXN[e]).join("")})评估` : "未选命主,只按姓名本身评分"}</div></div></div>
  ${nmCharTable(r.S.concat(r.G), false)}<h4 class="gl">五格</h4><div class="nmgrid">${gcards}</div>
  <p class="rt">三才配置 <b>${r.sc.txt}</b>(${r.sc.label})。读音:${r.tn.txt}。</p><h4 class="gl">名字整体五行</h4>${nmShareBar(r.share)}${r.bazi ? `<p class="rt">与命主喜用匹配度 <b>${r.bazi.score}</b>。${r.bazi.score >= 65 ? "名字五行补到了喜用。" : r.bazi.score < 45 ? "名字五行与喜用不太合,可考虑调整用字。" : "名字五行对喜用影响不大。"}</p>` : ""}
  <h4 class="gl">评分构成</h4>${nmPartsHTML(r.parts)}`;
}
function nmCharTable(cs, edit) {
  return `<div class="tbl-wrap"><table class="tbl sm"><thead><tr><th>字</th><th>拼音声调</th><th>康熙笔画${edit ? "(可改)" : ""}</th><th>字形五行</th><th>来源</th></tr></thead><tbody>${cs.map((x) => `<tr><th>${x.c}</th><td>${x.tone ? ["", "阴平", "阳平", "上声", "去声", "轻声"][x.tone] : "—"}</td><td>${x.k === null ? "" : ""}<input type="number" class="nmk" data-c="${x.c}" min="1" max="60" value="${x.k === null ? "" : x.k}" placeholder="?"></td><td>${x.wx >= 0 ? `<span class="pill wxp wx${x.wx}">${NM_WXN[x.wx]}</span>` : '<span class="dim">未定</span>'}</td><td class="dim">${x.src || "—"}${x.ov ? " · 已手动" : ""}</td></tr>`).join("")}</tbody></table></div>`;
}
function nmShopHTML() {
  const fa = nmFav(NM.who),
    list = NM.gen || [];
  const cards = list
    .map(
      (x, i) =>
        `<button type="button" class="nmcand${NM.sel === x.name ? " on" : ""}" data-n="${x.name}"><b>${x.name}</b><em>${x.r.score}</em><small>总格${x.r.total}${x.r.sl.t}</small></button>`,
    )
    .join("");
  let detail = "";
  const cs = NM.sel || ($("#nmShopIn") && $("#nmShopIn").value.trim());
  if (cs) {
    const r = nmShopScore(cs, { ind: NM.ind, favor: fa && fa.favor, avoid: fa && fa.avoid });
    if (r && r.incomplete)
      detail = `<p class="note bad">「${r.unk.join("、")}」不在字库内,无法评分。</p>`;
    else if (r)
      detail = `<div class="nmtop">${nmRing(r.score, r.rating)}<div><div class="nmname">${esc(cs)}</div><div class="dim sm">总格 ${r.total}(${r.sl.t}) · ${r.cs.map((x) => x.c + x.k).join(" ")}</div></div></div>${nmShareBar(r.share)}${nmPartsHTML(r.parts)}`;
  }
  return `${cards ? `<div class="nmcands">${cards}</div>` : '<p class="dim">选好行业,点“生成候选”。</p>'}${detail}`;
}
function renderName() {
  const pane = $("#pane-name");
  if (!pane) return;
  pane.dataset.built = "1";
  const list = ftPersons(),
    ind = Object.keys(NM_IND);
  if (!list.some((x) => x.id === NM.who)) NM.who = list.length ? list[0].id : "";
  const who = `<select id="nmWho"><option value="">不指定命主</option>${list.map((x) => `<option value="${x.id}"${x.id === NM.who ? " selected" : ""}>${esc(x.label)}</option>`).join("")}</select>`;
  pane.innerHTML = `<div class="panel blk"><h3 class="sec">姓名 · 文字五行与评分</h3>
   <div class="nmform"><label>姓名<input type="text" id="nmName" maxlength="6" placeholder="如 王海洋" autocomplete="off"></label><label>姓氏字数<select id="nmSl"><option value="0">自动</option><option value="1">单姓</option><option value="2">复姓</option></select></label><label>命主(看八字喜用)${who}</label></div>
   <div id="nmPerson">${nmPersonHTML()}</div>
   <p class="note">笔画按《康熙字典》口径并对常见部首变体(氵忄扌犭艹辶阝礻衤王)做了换算,个别生僻字可能有出入,可手动改。五格数理为熊崎式“五格剖象法”通行表;字形五行按部首与字义归类。这些是传统姓名学的规则化计算,不是命运判定,请当作取名时的参考之一。</p></div>
  <div class="panel blk"><h3 class="sec">开店 · 品牌取名</h3>
   <div class="nmform"><label>行业<select id="nmInd">${ind.map((k) => `<option${k === NM.ind ? " selected" : ""}>${k}</option>`).join("")}</select></label><label>店主(取八字喜用)<select id="nmWho2">${who.replace('id="nmWho"', 'id="nmWho2"')}</select></label><label>必含字(可空)<input type="text" id="nmMust" maxlength="1"></label><label>后缀(可空)<input type="text" id="nmSuf" maxlength="4" placeholder="如 茶坊"></label><button class="gbtn" id="nmGen">生成候选</button></div>
   <p class="dim sm" id="nmIndNote"></p><div id="nmShop">${nmShopHTML()}</div>
   <div class="nmform" style="margin-top:10px"><label>自拟店名评分<input type="text" id="nmShopIn" maxlength="8" placeholder="如 润泽茶坊"></label><button class="gbtn" id="nmShopGo">评分</button></div>
   <p class="note">行业五行依传统“业分五行”归类(如餐饮属火土、饮品属水、金融属金),再结合店主八字喜用取字;候选名来自人工整理的吉祥词库与行业后缀,评分含总格数理、读音、行业与店主五行契合。取名也请核对商标注册与是否已被使用。</p></div>`;
  const refresh = () => {
    $("#nmPerson").innerHTML = nmPersonHTML();
    bindNmInputs();
  };
  const bindNmInputs = () => {
    $$(".nmk", pane).forEach(
      (i) =>
        (i.onchange = () => {
          const v = parseInt(i.value);
          if (v > 0) NM.ov[i.dataset.c] = v;
          else delete NM.ov[i.dataset.c];
          refresh();
        }),
    );
  };
  $("#nmName").oninput = refresh;
  $("#nmSl").onchange = refresh;
  $("#nmWho").onchange = (e) => {
    NM.who = e.target.value;
    NM.gen = null;
    renderName();
  };
  $("#nmWho2").onchange = (e) => {
    NM.who = e.target.value;
    NM.gen = null;
    renderName();
  };
  $("#nmInd").onchange = (e) => {
    NM.ind = e.target.value;
    NM.gen = null;
    NM.sel = null;
    renderName();
  };
  const indNote = () => {
    const d = NM_IND[NM.ind];
    $("#nmIndNote").textContent =
      `${NM.ind}:${d.note};行业取字偏${d.wx.map((e) => NM_WXN[e]).join("、")},常用后缀 ${d.suf.slice(0, 6).join("、")}`;
  };
  indNote();
  $("#nmGen").onclick = () => {
    const fa = nmFav(NM.who);
    NM.gen = nmShopGen({
      ind: NM.ind,
      favor: fa && fa.favor,
      avoid: fa && fa.avoid,
      must: $("#nmMust").value.trim(),
      suffix: $("#nmSuf").value.trim(),
      n: 18,
    });
    NM.sel = NM.gen[0] ? NM.gen[0].name : null;
    $("#nmShop").innerHTML = nmShopHTML();
    bindShop();
    if (!NM.gen.length) toast("没有符合条件的候选,请放宽“必含字/后缀”");
  };
  const bindShop = () => {
    $$(".nmcand", pane).forEach(
      (b) =>
        (b.onclick = () => {
          NM.sel = b.dataset.n;
          $("#nmShop").innerHTML = nmShopHTML();
          bindShop();
        }),
    );
  };
  $("#nmShopGo").onclick = () => {
    NM.sel = null;
    $("#nmShop").innerHTML = nmShopHTML();
    bindShop();
  };
  bindShop();
  bindNmInputs();
}

/* ================= 测字 ================= */
const CZ = { a: null, q: "", ch: "" };
const CZ_STRUCT_TXT = {
  左右结构: "左为主(自己、先到者),右为客(对方、后来者);两部相依,主合作、对待与相互影响。",
  左中右结构: "左中右三部并立:中为枢纽,左右为两端,主居中调停、三方关系。",
  上下结构: "上为前、为尊、为天,下为后、为卑、为地;事有先后层级,上部看源头,下部看落点。",
  上中下结构: "上中下三层:上为源头、中为过程、下为结果。",
  全包围结构: "内为所谋之事,外为环境;四面被围,主受限、受护,也主“事在其中、难出其外”。",
  独体字: "独体之字,气专而不分:事情单一、主体明确,成败多取决于自身。",
  交叠结构: "部件相互交叠:事中有事,牵连盘结,宜先理清头绪。",
};
function czStructTxt(s) {
  return (
    CZ_STRUCT_TXT[s] ||
    (s.includes("包围")
      ? "包围之象:外为环境与约束,内为所谋之事;有被围受限的一面,也有受庇护的一面。"
      : "")
  );
}
function czTreeHTML(t, top) {
  if (t.kids) {
    const dir = { "⿰": "row", "⿲": "row", "⿱": "col", "⿳": "col" }[t.op];
    if (dir)
      return `<div class="cz-n ${dir}${top ? " top" : ""}">${t.kids.map((k) => czTreeHTML(k)).join("")}</div>`;
    return `<div class="cz-n enc${top ? " top" : ""}"><div class="enc-o">${czTreeHTML(t.kids[0])}</div><div class="enc-i">${czTreeHTML(t.kids[1])}</div></div>`;
  }
  const w = czCompWx(t.c),
    m = (CZ_COMP[t.c] || [""])[0].split(";")[0];
  return `<div class="cz-l${w >= 0 ? " wx" + w : ""}"><b>${esc(t.c)}</b>${m ? `<small>${esc(m)}</small>` : ""}</div>`;
}
function czGrid(a) {
  const q = a.qm,
    mark = {};
  const put = (c, tag) => {
    if (c) (mark[c.p] = mark[c.p] || []).push(tag);
  };
  put(q.zi, "字");
  if (a.qm.ziViaMid) put({ p: 5 }, "字");
  put(q.dir, "方位");
  put(q.self, "我");
  put(q.event, "事");
  const R0 = CZ.R,
    cells = R0.qm.cells,
    order = [4, 9, 2, 3, 5, 7, 8, 1, 6];
  return `<div class="czgrid">${order
    .map((p) => {
      const c = cells[p],
        tags = mark[p] || [];
      if (p === 5)
        return `<div class="czc mid${tags.length ? " hit" : ""}"><span class="czp">中五</span>${tags.length ? `<em>${tags.join("·")}</em>` : '<small class="dim">寄坤二</small>'}</div>`;
      return `<div class="czc wx${PWX[p]}${tags.length ? " hit" : ""}"><span class="czp">${PNAME[p]}${PNUM[p]} · ${PDIR[p]}</span><b>${c.door}门 · ${c.star}</b><small>${c.god} · 天${c.hs}/地${c.earth}</small>${tags.length ? `<em>${tags.join("·")}</em>` : ""}</div>`;
    })
    .join("")}</div>`;
}
const CZ_ADVICE = {
  求财: [
    "宜稳健小额试探,看清对方信用与账期后再加码。",
    "若求财遇阻,先降低预期、缩短周期,不做高杠杆的事。",
  ],
  感情: ["宜坦诚沟通、主动表达,少猜测、少试探。", "感情之事重在双方的意愿,不宜只凭一字定断。"],
  健康: [
    "身体之事以就医检查为准,测字只作心理参考,不可替代诊疗。",
    "宜及早检查、规律作息,遇急症直接就医。",
  ],
  官司: ["宜留存书面证据、按程序办事,能协商则先协商。", "牵涉法律的事,请以律师意见为准。"],
  学业: [
    "宜稳扎稳打、按计划复习,临场保持平常心。",
    "升学考试的结果取决于准备,字象只作鼓励或提醒。",
  ],
  置业: ["房产大事宜多看多比、核查权属与资金,不急于一时。", "入手前留出冷静期,并与家人商量。"],
  合作: ["宜先小范围合作、白纸黑字,再谈深入。", "留意对方的履约记录与分工边界。"],
  出行: ["出行先看天气路况与行程安排,预留机动时间。", "远行前做好保险与备份,重要事项提前确认。"],
  事业: ["宜顺势而为、先做试点,用结果说话。", "重大变动前,多与前辈、同行交换意见。"],
  "": ["问事较泛时,建议把问题说具体(时间、对象、期望),再重新起字。"],
};
function czNarrative(a, q) {
  const e = a.env,
    m = a.mh,
    Q = a.qm,
    L = [];
  if (a.via)
    L.push(`「${esc(a.ch)}」为繁体字,按对应简体「${a.via}」取笔顺与部件;康熙笔画仍按字库口径。`);
  L.push(
    `所问${q ? `「${esc(q)}」` : "之事"}${a.topic ? `(按「${a.topic}」论)` : ""},所书之字为「${a.ch}」(${a.py}),${a.struct}${a.tree.kids ? `,由${a.parts.map((x) => "「" + x + "」").join("、")}构成` : ""}。${czStructTxt(a.struct)}`,
  );
  const cm = a.compInfo.filter((c) => c.mean).slice(0, 4);
  if (cm.length)
    L.push(`部件取象:${cm.map((c) => `「${c.c}」${c.mean.replace(";", "——")}`).join(";")}。`);
  const w = a.wx;
  L.push(
    `五行:字形${w.xing >= 0 ? "属" + NM_WXN[w.xing] : "无明确五行"}${w.yi >= 0 ? ",字义属" + NM_WXN[w.yi] : ""},字音(${a.ini.name || "零声母"})属${NM_WXN[w.yin]},笔画(康熙${a.kx})之数属${NM_WXN[w.shu]};合观以 <b>${NM_WXN[w.main]}</b> 为主。笔画${a.modern}为${a.yinyang}${a.modern % 2 ? ",主动、外显、速" : ",主静、内敛、缓"}。`,
  );
  L.push(
    `梅花取卦:${m.how}。本卦「${m.ben.name}」、互卦「${m.hu.name}」、变卦「${m.bian.name}」,第${m.mv}爻动;体为${TRI[m.ti].n}(${NM_WXN[TRI[m.ti].wx]})、用为${TRI[m.yong].n}(${NM_WXN[TRI[m.yong].wx]}),${m.tiyong[0]}——${m.tiyong[2]}`,
  );
  L.push(
    `当下奇门为${Q.ju},时柱${Q.hourGZ};${Q.zf},${Q.zs}。字之笔画${Q.strokeNo}落${Q.zi.name}(${Q.zi.dir}),见${Q.zi.door}门、天${Q.zi.star}、${Q.zi.god}${Q.zi.geju.length ? ",格局:" + Q.zi.geju.join("、") : ""}${Q.zi.tags.length ? "," + Q.zi.tags.join("、") : ""},字与该宫五行${Q.zi.rel[0]}。${Q.ask ? `以「${a.topic}」取用神,盘面${Q.ask.verdict[0]}。` : ""}${Q.dir ? `起念方位${Q.dir.dir}落${Q.dir.name}(${Q.dir.door}门、${Q.dir.god})。` : ""}`,
  );
  L.push(
    `时空:时值${e.term}之后,${ZHI[e.mb]}月令,字五行在月令为「${e.season.s}」${e.season.s === "旺" || e.season.s === "相" ? "(得令,气足)" : e.season.s === "死" || e.season.s === "囚" ? "(失令,气弱)" : "(气平)"};此刻为${ZHI[e.hb]}时(${NM_WXN[e.hourWx]}),对字${e.hr[0]};日干${GAN[CZ.R.bz.dm]}(${NM_WXN[e.dayWx]})对字${e.me[0]}。${e.weather ? `天气${e.weather[1]},对字${e.wr[0]}。` : ""}月相${e.moon};${e.night ? "夜间起念,事多在暗处进行,宜静观" : "白昼起念,事多明朗可见"}。`,
  );
  const top = a.items
    .slice()
    .sort((x, y) => Math.abs(y.v) - Math.abs(x.v))
    .slice(0, 3);
  L.push(
    `综合:倾向「<b class="${a.tier[1]}">${a.tier[0]}</b>」(${a.score > 0 ? "+" : ""}${a.score})。主要依据:${top.map((x) => `${x.k}${x.v > 0 ? "利" : x.v < 0 ? "阻" : "平"}`).join("、")}。应期参考:${a.yingqi.speed};数与时偏向${a.yingqi.text}。`,
  );
  return L;
}
function czResultHTML(a, q) {
  if (a.unknown)
    return `<p class="note bad">「${esc(a.ch)}」不在字库(约 6700 常用字)中。请换一个字,或用通行简体/繁体常用字。</p>`;
  const tier = a.tier;
  const L = czNarrative(a, q),
    adv = CZ_ADVICE[a.topic] || CZ_ADVICE[""];
  const ord = a.order.length
    ? `<div class="czord">${a.order.map((s, i) => `<span class="czst"><i>${i + 1}</i>${s}</span>`).join("")}</div><p class="dim sm">起笔「${a.order[0]}」${czStkNote(a.order[0]) ? "(" + czStkNote(a.order[0]) + ")" : ""};收笔「${a.order[a.order.length - 1]}」${czStkNote(a.order[a.order.length - 1]) ? "(" + czStkNote(a.order[a.order.length - 1]) + ")" : ""}。笔画象义仅供参考。</p>`
    : '<p class="dim sm">该字无笔顺数据。</p>';
  const sw = a.wx.share;
  return `<div class="cz-head"><div class="cz-glyph ${a.wx.main >= 0 ? "wx" + a.wx.main : ""}">${esc(a.ch)}</div><div class="cz-meta"><div class="cz-py">${a.py} · ${a.struct} · 现代 ${a.modern} 画 · 康熙 ${a.kx} 画 · ${a.yinyang}</div><div class="cz-verdict ${tier[1]}"><b>${tier[0]}</b><span>综合倾向 ${a.score > 0 ? "+" : ""}${a.score}</span></div><div class="dim sm">起字时刻 ${CZ.stamp}</div></div></div>
  <h4 class="gl">断语</h4><div class="cz-read">${L.map((t) => `<p>${t}</p>`).join("")}<p class="cz-adv"><b>建议:</b>${adv.join("")}${a.score < -1.5 ? "时机未到时宜缓、宜备,不宜硬推。" : a.score > 2 ? "顺势时也要留余地,不把话说满。" : ""}</p></div>
  <h4 class="gl">拆字 · 部件</h4><div class="cz-tree">${czTreeHTML(a.tree, true)}</div>${a.compInfo.length ? `<table class="tbl sm"><thead><tr><th>部件</th><th>象义</th><th>五行</th><th>笔画</th></tr></thead><tbody>${a.compInfo.map((c) => `<tr><th>${esc(c.c)}</th><td>${esc(c.mean.replace(";", "——") || "—")}</td><td>${c.wx >= 0 ? `<span class="pill wxp wx${c.wx}">${NM_WXN[c.wx]}</span>` : "—"}</td><td>${c.k || "—"}</td></tr>`).join("")}</tbody></table>` : ""}
  <h4 class="gl">笔顺</h4>${ord}
  <h4 class="gl">五行属性</h4><div class="cz-wx"><span class="pill">形 ${a.wx.xing >= 0 ? NM_WXN[a.wx.xing] : "—"}</span><span class="pill">义 ${a.wx.yi >= 0 ? NM_WXN[a.wx.yi] : "—"}</span><span class="pill">音 ${NM_WXN[a.wx.yin]}(${a.ini.name || "零"})</span><span class="pill">数 ${NM_WXN[a.wx.shu]}(${a.kx})</span></div>${nmShareBar(sw)}
  <h4 class="gl">梅花测字 · 三卦</h4><div class="cz-hex"><div><small>本卦</small><b>${a.mh.ben.name}</b></div><div><small>互卦</small><b>${a.mh.hu.name}</b></div><div><small>变卦</small><b>${a.mh.bian.name}</b></div><div><small>体用</small><b>${a.mh.tiyong[0]}</b><em>${a.mh.tiyong[1]}</em></div></div><p class="dim sm">取卦:${a.mh.how}(用现代通行笔画,动爻=(总笔画+时辰数)除6的余数)。</p>
  <h4 class="gl">当下奇门 · 落宫</h4>${czGrid(a)}<p class="dim sm">高亮宫位:字(笔画取宫)、方位(起念方位)、我(日干)、事(时干)。</p>
  <h4 class="gl">判断依据明细</h4><table class="tbl sm"><tbody>${a.items.map((x) => `<tr><th>${x.k}</th><td><b class="${x.v > 0 ? "good" : x.v < 0 ? "bad" : ""}">${x.v > 0 ? "+" : ""}${x.v}</b></td><td class="dim">${esc(x.t)}</td></tr>`).join("")}</tbody></table>
  <p class="note">测字是传统占断方法之一。这里把字形、笔画、五行、梅花取卦与当下的奇门盘、时令、时辰、天气、方位按固定规则合并为倾向提示;规则来自通行口径并经过整理,没有外部标准可以验证吉凶。请当作思考与提醒的参考,重大决定请以现实条件和专业意见为准。</p>`;
}
function czRun() {
  const raw = ($("#czCh").value || "").trim(),
    ch = [...raw].find((c) => /[\u3400-\u9fff]/.test(c));
  if (!ch) {
    toast("请输入一个汉字");
    return;
  }
  if ([...raw].filter((c) => /[\u3400-\u9fff]/.test(c)).length > 1)
    toast(`测字取单字,已取第一个字「${ch}」`);
  const n = nowBJ(),
    opt = {
      gender: $("#gender").value === "1" ? "M" : "F",
      solar: $("#solarChk").checked,
      lon: parseFloat($("#lon").value) || 120,
      lat: parseFloat($("#lat").value) || 24.5,
    };
  CZ.R = computeAll({ y: n.y, m: n.m, d: n.d, h: n.h, mi: n.mi, s: n.s }, opt);
  CZ.stamp = `${n.y}-${f2(n.m)}-${f2(n.d)} ${f2(n.h)}:${f2(n.mi)}(北京时间)`;
  CZ.q = ($("#czQ").value || "").trim();
  CZ.ch = ch;
  const a = czAnalyze(ch, {
    R: CZ.R,
    question: CZ.q,
    topic: $("#czTopic").value,
    dir: $("#czDir").value,
    weather: $("#czWx").value,
  });
  CZ.a = a;
  $("#czOut").innerHTML = a ? czResultHTML(a, CZ.q) : "";
  $("#czOut").scrollIntoView({ behavior: "smooth", block: "start" });
}
function renderCezi() {
  const pane = $("#pane-cezi");
  if (!pane) return;
  if (pane.dataset.built) {
    return;
  }
  pane.dataset.built = "1";
  pane.innerHTML = `<div class="panel blk"><h3 class="sec">测字</h3>
   <p class="rt">心中想着要问的事,写下或想起一个字,再提交。系统会拆解这个字的笔画、部首、部件、笔顺与结构,推算五行,用梅花取卦,并结合<b>提交这一刻</b>的奇门盘、时辰、节令、月相,以及你选的方位与天气,给出综合的倾向提示。</p>
   <div class="czform"><label class="czf-ch">字<input type="text" id="czCh" maxlength="2" placeholder="问" autocomplete="off"></label>
    <label class="czf-q">所问之事(可空)<input type="text" id="czQ" maxlength="60" placeholder="如:今年生意能否转好?"></label>
    <label>事类<select id="czTopic"><option value="">自动识别</option>${Object.keys(QM_TOPICS)
      .map((k) => `<option>${k}</option>`)
      .join("")}</select></label>
    <label>起念/写字的方位<select id="czDir"><option value="">不选</option>${Object.keys(CZ_DIR)
      .map((k) => `<option>${k}</option>`)
      .join("")}</select></label>
    <label>此刻天气<select id="czWx"><option value="">不选</option>${Object.keys(CZ_WEATHER)
      .map((k) => `<option>${k}</option>`)
      .join("")}</select></label>
    <button class="primary gbtn" id="czGo">起字测算</button></div>
   <p class="dim sm">时间与地点:使用当下的北京时间,经纬度与真太阳时设置取自首页“人物 · 起局”中的出生地栏(出生地栏即当前所在地)。测字只取单字。</p></div><div class="panel blk" id="czOut" hidden></div>`;
  $("#czGo").onclick = () => {
    $("#czOut").hidden = false;
    czRun();
  };
  $("#czCh").addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      $("#czOut").hidden = false;
      czRun();
    }
  });
}

/* ================= UI · 状态与事件 ================= */
let live = true,
  running = false,
  lastKey = "",
  R = null;
function nowBJ() {
  const n = new Date(Date.now() + 8 * 3600e3);
  return {
    y: n.getUTCFullYear(),
    m: n.getUTCMonth() + 1,
    d: n.getUTCDate(),
    h: n.getUTCHours(),
    mi: n.getUTCMinutes(),
    s: n.getUTCSeconds(),
  };
}
function setDt(c) {
  $("#dt").value = `${String(c.y).padStart(4, "0")}-${f2(c.m)}-${f2(c.d)}T${f2(c.h)}:${f2(c.mi)}`;
}
function parseDt() {
  return pplParse($("#dt").value || "");
}
function readOpts() {
  const lon = parseFloat($("#lon").value),
    lat = parseFloat($("#lat").value);
  return {
    gender: $("#gender").value === "1" ? "M" : "F",
    solar: $("#solarChk").checked,
    lon: Number.isFinite(lon) ? Math.max(-180, Math.min(180, lon)) : 120,
    lat: Number.isFinite(lat) ? Math.max(-66, Math.min(66, lat)) : 24.5,
  };
}
function keyOf(R) {
  return [
    R.bz.dayIdx,
    R.bz.hourIdx,
    R.qm.k,
    R.bz.pill[1].s,
    R.bz.pill[1].b,
    R.opt.gender,
    R.opt.solar,
    R.opt.lon,
    R.opt.lat,
  ].join("|");
}
function compute(civ) {
  const o = readOpts(),
    r = computeAll(civ, o);
  qimenPlus(r.qm, r);
  r.deep = baziDeep(r.bz);
  ziweiPlus(r.zw, r.lunar, r.bz.pill[3].b, o.gender);
  r.lr = liuren(r.bz.dayIdx, r.bz.pill[3].b, liurenYueJiang(r.t.lon));
  ziweiAdj(r.zw, r.lunar, r.bz.pill[3].b, o.gender);
  const pl = asPlanets(r.t.jdUT);
  r.astro = {
    planets: pl,
    aspects: asAspects(pl),
    angles: asAngles(r.t.jdUT, o.lon, o.lat),
    moon: asMoonPhase(pl[0].lon, pl[1].lon),
    helio: asHelioAll(r.t.jdUT),
    yq: wuyunLiuqi(ganzhiIdx(r.bz.pill[0].s, r.bz.pill[0].b), r.t.lon),
  };
  return r;
}
function toast(msg) {
  const t = $("#toast");
  t.textContent = msg;
  t.classList.add("on");
  clearTimeout(toast._t);
  toast._t = setTimeout(() => t.classList.remove("on"), 2600);
}
function selectTab(id, scroll) {
  try {
    studioSync(id);
  } catch (e) {
    console.error(e);
  }
  try {
    navSync(id);
  } catch (e) {}
  if (id === "now")
    setTimeout(() => {
      try {
        nwTick(true);
      } catch (e) {
        console.error(e);
      }
    }, 0);
  if (id !== "xingkong") {
    try {
      xkStop();
    } catch (e) {}
  }
  if (REF_PANES[id]) setTimeout(() => refRender(id), 0);
  if (id === "zy")
    setTimeout(() => {
      try {
        renderZy();
      } catch (e) {
        console.error(e);
      }
    }, 0);
  if (id === "lib")
    setTimeout(() => {
      try {
        renderLib();
      } catch (e) {
        console.error(e);
      }
    }, 0);
  if (id === "tools")
    setTimeout(() => {
      try {
        renderTools();
      } catch (e) {
        console.error(e);
      }
    }, 0);
  if (id === "fate")
    setTimeout(() => {
      try {
        renderFate();
      } catch (e) {
        console.error(e);
      }
    }, 0);
  if (id === "name")
    setTimeout(() => {
      try {
        renderName();
      } catch (e) {
        console.error(e);
      }
    }, 0);
  if (id === "cezi")
    setTimeout(() => {
      try {
        renderCezi();
      } catch (e) {
        console.error(e);
      }
    }, 0);
  if (id === "net")
    setTimeout(() => {
      try {
        renderNet();
      } catch (e) {
        console.error(e);
      }
    }, 0);
  if (id === "zeri")
    setTimeout(() => {
      try {
        zrSyncUI();
      } catch (e) {
        console.error(e);
      }
    }, 0);
  if (id === "season")
    setTimeout(() => {
      try {
        seasonRefresh();
      } catch (e) {
        console.error(e);
      }
    }, 0);
  $$(".tab").forEach((t) => {
    const on = t.dataset.tab === id;
    t.classList.toggle("on", on);
    t.setAttribute("aria-selected", on);
  });
  $$(".pane").forEach((p) => p.classList.toggle("on", p.id === "pane-" + id));
  const on = $(".tab.on");
  if (on && on.scrollIntoView)
    on.scrollIntoView({ block: "nearest", inline: "center", behavior: REDUCE ? "auto" : "smooth" });
  if (scroll && window.innerWidth < 1080)
    $("#tabs").scrollIntoView({ behavior: REDUCE ? "auto" : "smooth", block: "start" });
}
function logClear() {
  $("#log").innerHTML = "";
}
function logLine(s) {
  const d = document.createElement("div");
  d.textContent = s;
  const L = $("#log");
  L.appendChild(d);
  while (L.children.length > 5) L.removeChild(L.firstChild);
}

/* ---- 面板 ---- */
const VIS_RUNTIME = { items: [], lastToast: 0, lastSig: "", lastAt: 0 };
function visRuntimeReport(source, e) {
  const msg = typeof e === "string" ? e : (e && e.message) || String(e || "未知错误");
  const sig = source + "|" + msg,
    now = Date.now();
  if (sig === VIS_RUNTIME.lastSig && now - VIS_RUNTIME.lastAt < 3000) return;
  VIS_RUNTIME.lastSig = sig;
  VIS_RUNTIME.lastAt = now;
  VIS_RUNTIME.items.push({
    t: new Date().toISOString(),
    source: source,
    msg: msg,
    stack: e && e.stack ? String(e.stack).slice(0, 900) : "",
  });
  if (VIS_RUNTIME.items.length > 24) VIS_RUNTIME.items.shift();
  console.error("[可视化运行:" + source + "]", e);
}
function paneBusy(id) {
  const a = document.activeElement,
    p = $("#pane-" + id);
  return !!(
    a &&
    p &&
    p.contains(a) &&
    /INPUT|SELECT|TEXTAREA/.test(a.tagName) &&
    a.type !== "button"
  );
}
function visFallback(id, label, e) {
  const pane = $("#pane-" + id);
  if (!pane) return;
  visRuntimeReport(label || id, e);
  const msg = e && e.message ? String(e.message).replace(/[<>]/g, "").slice(0, 160) : "未知异常";
  pane.innerHTML = `<div class="panel blk vis-error"><h3 class="sec">${label || "可视化模块"}</h3><p class="note">本模块本次渲染未完成，其它模块仍可继续使用。</p><details class="note"><summary>诊断信息</summary><code>${msg}</code></details></div>`;
}
function safePane(id, label, fn) {
  try {
    const pane = $("#pane-" + id);
    if (pane) pane.innerHTML = fn();
    return true;
  } catch (e) {
    visFallback(id, label, e);
    return false;
  }
}
function safeBind(label, fn) {
  try {
    fn();
  } catch (e) {
    console.error("[天机盘绑定:" + label + "]", e);
  }
}
function renderPanels(R, full) {
  /* v116：只刷新用户当前正在看的页面。其它页面保留为空，进入时再由 refRender 按需生成。 */
  try {
    refRefresh();
  } catch (e) {
    console.error("[按需渲染]", e);
  }
  const active = document.querySelector(".pane.on");
  const activeId = active && active.id ? active.id.replace(/^pane-/, "") : "";
  /* 老模块装饰器也改成“相关页可见才运行”，避免首页给隐藏 DOM 做昂贵工作。 */
  if (activeId === "astro")
    try {
      refDecorate();
    } catch (e) {
      console.error(e);
    }
  if (activeId === "tools")
    try {
      toolsDecorate();
    } catch (e) {
      console.error(e);
    }
  if (["qimen", "liuren", "liuyao", "yi", "ziwei"].includes(activeId))
    try {
      dvDecorate();
    } catch (e) {
      console.error(e);
    }
  const rb = $("#repBtn");
  if (rb) rb.onclick = openReport;
  if (full && active) {
    try {
      scramble(active);
    } catch (e) {
      console.error("[动效]", e);
    }
  }
  try {
    if (STU.active) {
      studioRender();
    }
  } catch (e) {
    console.error(e);
  }
  /* v181：AI 设置只在真正进入相关专业页时初始化。 */
  if (
    [
      "over",
      "guide",
      "bazi",
      "ziwei",
      "qimen",
      "liuren",
      "liuyao",
      "yi",
      "zeri",
      "hepan",
      "verify",
    ].includes(activeId)
  ) {
    try {
      initAI();
    } catch (e) {
      console.error("[AI模块]", e);
    }
  }
}
function openReport() {
  const m = $("#modal");
  repEnsureLevel();
  $("#repTxt").value = buildReport(R, RP.lv);
  m.hidden = false;
  $("#repTxt").focus();
  $("#repTxt").select();
}
function updateChips(R) {
  const { bz, qm, mh, zw, lunar, t, lr } = R,
    gzs = bz.pill.map((p) => GAN[p.s] + ZHI[p.b]),
    D = R.deep;
  const chips = [
    [
      "bazi",
      "四柱 · " + D.gj.name,
      gzs.join("　"),
      `${lunarText(lunar)} · 日主${GAN[bz.dm]}${D.st.level}`,
    ],
    [
      "bazi",
      "节令 · 太阳黄经",
      `${TERMS[Math.floor(t.lon / 15) % 24]}后 ${t.lon.toFixed(2)}°`,
      `${bz.jie.prev} → ${bz.jie.next} ${fmtT(bz.jie.nextT)}`,
    ],
    [
      "qimen",
      "奇门遁甲",
      `${qm.yang ? "阳" : "阴"}遁${PNUM[qm.ju]}局 · 值符天${qm.zfStar} · 值使${qm.zsDoor}门`,
      `${qm.term}${qm.yuanName} · 时柱${qm.hourGZ}${qm.fuyin ? " · 伏吟" : ""}${qm.fanyin ? " · 反吟" : ""}`,
    ],
    [
      "liuren",
      "大六壬",
      `${lr.ge} · ${lr.chu.map((c) => ZHI[c.z]).join("")}`,
      `${ZHI[lr.zj]}将加${ZHI[lr.hb]}时 · 初传${lr.chu[0].gen}`,
    ],
    [
      "yi",
      "梅花易数",
      `${mh.ben.name} → ${mh.bian.name}`,
      `互卦 ${mh.hu.name} · 动爻第${mh.mv}爻 · ${mh.verdict[0]}`,
    ],
    [
      "astro",
      "天象 · 五运六气",
      `${AS_SIGN[Math.floor(R.astro.planets[0].lon / 30)][0]}座 · ${R.astro.moon.name}`,
      `${R.astro.yq.gz}年 ${R.astro.yq.yunName} · 司天${R.astro.yq.siTian}`,
    ],
    [
      "ziwei",
      "紫微斗数",
      `命宫${ZHI[zw.ming]} · ${zw.juName} · 紫微在${ZHI[zw.z]}`,
      `身宫${ZHI[zw.shen]} · 命主${zw.mingStar} · 生年四化 ${zw.sihua[3]}`,
    ],
  ];
  $("#chips").innerHTML = chips
    .map(
      (c) =>
        `<button class="chip" data-tab="${c[0]}"><small>${c[1]}</small><b>${c[2]}</b><small>${c[3]}</small></button>`,
    )
    .join("");
  $$(".chip").forEach((b) => (b.onclick = () => selectTab(b.dataset.tab, true)));
}
function buildLog(R) {
  const { bz, qm, mh, zw, t, lr } = R;
  return [
    `☯ 观天象 · 太阳黄经 ${t.lon.toFixed(2)}° · ${TERMS[Math.floor(t.lon / 15) % 24]}后`,
    `☰ 排四柱 · ${bz.pill.map((p) => GAN[p.s] + ZHI[p.b]).join(" ")} · 日主${GAN[bz.dm]}${WXK[GAN_WX[bz.dm]]}${R.deep.st.level}`,
    `☲ 布奇门 · ${qm.yang ? "阳" : "阴"}遁${PNUM[qm.ju]}局 · 值符天${qm.zfStar} · 值使${qm.zsDoor}门`,
    `☱ 起六壬 · ${lr.ge} · 三传 ${lr.chu.map((c) => ZHI[c.z]).join("→")}`,
    `☵ 演梅花 · ${mh.ben.name} → ${mh.hu.name} → ${mh.bian.name}`,
    `☶ 安紫微 · 命宫${ZHI[zw.ming]} · ${zw.juName} · 紫微在${ZHI[zw.z]}`,
    `✦ 察天象 · ${R.astro.planets
      .slice(0, 2)
      .map((p) => p.n + AS_SIGN[Math.floor(p.lon / 30)][0])
      .join(" ")} · ${R.astro.moon.name} · ${R.astro.yq.gz}年${R.astro.yq.yunName}`,
    `☷ 天机已成`,
  ];
}
async function deduce(civ, mode) {
  if (running) return;
  running = true;
  const full = mode === "full";
  try {
    R = compute(civ);
    lastKey = keyOf(R);
    updateDial(R);
    updateChips(R);
    spinStart(full ? 3000 : 1200, full);
    const gb = $("#goBtn");
    if (gb) gb.disabled = true;
    document.body.classList.add("busy");
    if (full) {
      logClear();
      for (const L of buildLog(R)) {
        logLine(L);
        if (!REDUCE) await sleep(360);
      }
    } else {
      logLine(
        `☯ 时辰流转 · ${R.bz.pill.map((p) => GAN[p.s] + ZHI[p.b]).join(" ")} · ${R.qm.yang ? "阳" : "阴"}遁${PNUM[R.qm.ju]}局`,
      );
    }
    renderPanels(R, full);
    try {
      stuDeriveInfo(R, STU.pendingSource || (full ? "综合推演" : "时辰流转"));
    } catch (e) {}
    STU.pendingSource = "";
  } catch (e) {
    visRuntimeReport("推演主流程", e);
    try {
      const now = Date.now();
      if (now - VIS_RUNTIME.lastToast > 12000) {
        VIS_RUNTIME.lastToast = now;
        toast("有一个模块本次未完成渲染；其它功能可继续使用");
      }
    } catch (_) {}
  } finally {
    document.body.classList.remove("busy");
    const gb = $("#goBtn");
    if (gb) gb.disabled = false;
    running = false;
  }
}
function setLive(on) {
  live = on;
  const b = $("#liveBtn");
  if (b) {
    b.classList.toggle("on", on);
    b.setAttribute("aria-pressed", on);
  }
}
let __tjTickCalcKey = "";
function tick() {
  try {
    nwTick();
  } catch (e) {
    console.error(e);
  }
  const n = nowBJ();
  $("#clock").innerHTML =
    `<b>${f2(n.h)}:${f2(n.mi)}:${f2(n.s)}</b>北京时间 ${n.y}-${f2(n.m)}-${f2(n.d)}`;
  if (!live || running) return;
  if (n.s === 0 || !R) setDt(n);
  const o = readOpts(),
    mk = [n.y, n.m, n.d, n.h, n.mi, o.gender, o.solar ? 1 : 0, o.lon, o.lat].join("|");
  /* v181: seconds update the clock; full aggregate only needs minute/settings cadence. */
  if (R && mk === __tjTickCalcKey) return;
  __tjTickCalcKey = mk;
  const cur = computeAll(n, o);
  if (keyOf(cur) !== lastKey) {
    setDt(n);
    deduce(n, "quick");
  } else {
    setSun(cur.t.lon);
  }
}

function bindModal() {
  const m = $("#modal"),
    close = () => {
      m.hidden = true;
    };
  $("#repClose").onclick = close;
  m.addEventListener("click", (e) => {
    if (e.target === m) close();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !m.hidden) close();
  });
  $("#repCopy").onclick = async () => {
    const ta = $("#repTxt");
    ta.select();
    try {
      await navigator.clipboard.writeText(ta.value);
      toast("已复制到剪贴板");
    } catch (e) {
      try {
        document.execCommand("copy");
        toast("已复制");
      } catch (e2) {
        toast("请手动 Ctrl/⌘+C 复制");
      }
    }
  };
}
window.addEventListener("error", (e) => {
  const m = String(e.message || "");
  if (/ResizeObserver loop (limit exceeded|completed with undelivered notifications)/i.test(m)) {
    e.preventDefault();
    return;
  }
  visRuntimeReport("页面运行", e.error || m);
});
window.addEventListener("unhandledrejection", (e) => {
  visRuntimeReport("异步运行", e.reason);
});
function init() {
  $("#persona").innerHTML = personaHTML();
  buildDial();
  $$(".tab").forEach((t) => (t.onclick = () => selectTab(t.dataset.tab)));
  const n = nowBJ();
  setDt(n);
  $("#goBtn").onclick = () => {
    const c = parseDt();
    if (!c) {
      toast("请填写 1901–2099 年内的有效时间");
      return;
    }
    STU.pendingSource = "人物命盘";
    setLive(false);
    deduce(c, "full");
  };
  $("#nowBtn").onclick = () => {
    const c = nowBJ();
    STU.pendingSource = "此刻推演";
    setDt(c);
    deduce(c, "full");
    requestAnimationFrame(() => {
      try {
        if (!STU.active) pzReset($("#dial"));
      } catch (_) {}
    });
  };
  $("#dt").addEventListener("input", () => setLive(false));
  ["gender", "solarChk", "lon", "lat"].forEach((id) =>
    $("#" + id).addEventListener("change", () => {
      const c = live ? nowBJ() : parseDt();
      if (c) deduce(c, "quick");
    }),
  );
  $("#themeBtn").onclick = () => {
    const r = document.documentElement,
      cur =
        r.getAttribute("data-theme") ||
        (matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark");
    const nx = cur === "dark" ? "light" : "dark";
    r.setAttribute("data-theme", nx);
    try {
      localStorage.setItem("tianjipan.theme", nx);
    } catch (e) {}
  };
  $$("#layerSw button").forEach((b) => (b.onclick = () => setDialLayer(b.dataset.layer)));
  navBuild();
  pdfWatch();
  bindProfiles();
  bindModal();
  bindHelp();
  initExport();
  bindZoom();
  bindTip();
  bindCal();
  bindFab();
  pzBind();
  $("#compassMount").innerHTML = cpPanelHTML();
  bindCompass();
  nwSetBell(NW.bell);
  $("#lbBellSet").onclick = bellOpen;
  $("#lbBell").onclick = () => {
    nwSetBell(!NW.bell);
    if (NW.bell) {
      nwChime("hour");
      if (BELL.speech) bellSpeak("天机盘报时已开启。", { cancel: true });
      try {
        if (typeof Notification !== "undefined" && Notification.permission === "default")
          Notification.requestPermission();
      } catch (e) {}
      toast("已开启提示音与语音报时（需保持本页打开）");
    }
  };
  /* v181：先生成唯一主结果，再让首页复用，避免启动时重复完整计算。 */
  deduce(n, "quick");
  try {
    nwTick(true);
  } catch (e) {
    console.error(e);
  }
  /* v116：首屏轻启动。完整推演动画只在用户主动点击“推演/此刻”时执行。 */
  setInterval(tick, 1000);
}
init();

/* ===== V219 融合 · unified visibility resume bridge =====
   由 Runtime Lite 统一监听 visibilitychange；这里仅登记旧核心动画的恢复动作。
   关键修复：dial 在后台停止时写入 _raf=0，因此恢复条件必须使用 !dial._raf，而不是 == null。 */
try {
  const resumeLegacyLoops = function () {
    try {
      if (typeof dial !== "undefined" && dial && !dial._raf && typeof frame === "function")
        dial._raf = requestAnimationFrame(frame);
    } catch (_) {}
    try {
      if (
        typeof CP !== "undefined" &&
        CP.mode === "auto" &&
        CP.visible &&
        !CP.raf &&
        typeof cpFrame === "function"
      ) {
        CP.last = performance.now();
        CP.raf = requestAnimationFrame(cpFrame);
      }
    } catch (_) {}
    try {
      if (
        typeof ORR3D !== "undefined" &&
        ORR3D.visible &&
        !ORR3D.visHidden &&
        !ORR3D.raf &&
        typeof orr3dLoop === "function"
      ) {
        var tok = ORR3D.token;
        ORR3D.last = performance.now();
        ORR3D.raf = requestAnimationFrame(function (ts) {
          orr3dLoop(tok, ts);
        });
      }
    } catch (_) {}
    try {
      if (
        typeof ECL !== "undefined" &&
        ECL.loopStarted &&
        !ECL.raf &&
        typeof eclLoop === "function"
      )
        ECL.raf = requestAnimationFrame(eclLoop);
    } catch (_) {}
  };
  if (window.TianjiRuntime?.scheduler?.registerResume)
    window.TianjiRuntime.scheduler.registerResume("legacy-core-loops", resumeLegacyLoops);
  else
    document.addEventListener(
      "visibilitychange",
      function () {
        if (!document.hidden) requestAnimationFrame(resumeLegacyLoops);
      },
      { passive: true },
    );
} catch (_) {}
