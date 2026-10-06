/* ===== v39 盘库入口 + 独立罗经三盘 ===== */
const PANLIB = { mode: "hub" };
const LJ = {
  deg: (typeof P5 !== "undefined" && P5.lp ? +P5.lp.deg : 180) || 180,
  ju: "水",
  mode: "bearing",
  zoom: 1,
  view: { x: -430, y: -430, w: 860, h: 860 },
  d72: 337.5,
  d60: 337.5,
  layers: {
    deg: 1,
    xiu: 1,
    tian: 1,
    ren: 1,
    di: 1,
    n24: 1,
    d72: 1,
    d60: 1,
    cs: 1,
    nine: 1,
    hex: 1,
    ht: 1,
    xt: 1,
  },
};
const LJ_LAYERS = [
  ["deg", "周天 365.25 度", "传统周天度参照"],
  ["xiu", "二十八宿天星", "按现有宿度表折算"],
  ["tian", "天盘缝针", "正针前半位 +7.5°"],
  ["ren", "人盘中针", "正针后半位 −7.5°"],
  ["di", "地盘正针", "二十四山正位"],
  ["n24", "二十四山属性", "三元龙 · 阴阳 · 卦宫"],
  ["d72", "穿山七十二龙", "72 格 · 每格 5°"],
  ["d60", "透地六十龙", "60 格 · 每格 6°"],
  ["cs", "三合十二长生", "水木火金四局可切换"],
  ["nine", "九星序列", "贪巨禄文廉武破辅弼"],
  ["hex", "六十四卦易盘", "邵雍先天圆图序"],
  ["ht", "后天八卦", "方位时令常用"],
  ["xt", "先天八卦", "阴阳对待次序"],
];
function plHub() {
  const pane = $("#pane-studio");
  if (!pane) return;
  if (STU.active) studioLeave();
  PANLIB.mode = "hub";
  document.body.classList.add("studio-mode");
  delete pane.dataset.ui;
  pane.dataset.built = "1";
  pane.innerHTML = `<div class="pl-hub"><div class="pl-grid">
   <article class="panel pl-card" data-pl="giant"><span class="num">01 · 综合叠盘</span><span class="enter">↗</span><h3>天机巨盘</h3><p>现有多体系同心演算器。支持手动定盘、环锁定、组合推演、条件搜时、A/B、时间播放与快照。</p><div class="tags"><span>多盘叠合</span><span>时空演算</span><span>条件实验</span></div></article>
   <article class="panel pl-card" data-pl="luojing"><span class="num">02 · 罗经体系</span><span class="enter">↗</span><h3>正宗罗经三盘</h3><p>地盘正针、人盘中针、天盘缝针独立叠显，并扩展二十四山、八卦、六十四卦、二十八宿、穿山透地、长生与周天度。</p><div class="tags"><span>三针三盘</span><span>定向读数</span><span>穿山透地</span></div></article>
   <article class="panel pl-card" data-pl="liuren"><span class="num">03 · 三式</span><span class="enter">↗</span><h3>大六壬 · 天地盘</h3><p>地盘十二支固定，天盘按“月将加占时”整体旋转；十二天将、遁干、四课三传、空亡驿马随课同步显现。</p><div class="tags"><span>月将加时</span><span>天地盘</span><span>十二天将</span></div></article>
   <article class="panel pl-card" data-pl="qimenpan"><span class="num">04 · 三式</span><span class="enter">↗</span><h3>奇门遁甲 · 转盘式盘</h3><p>地盘三奇六仪固定为基座；九星与天盘干、八门、八神分别成环，按时家转盘奇门的定局结果落宫，并可独立拨盘做结构实验。</p><div class="tags"><span>九星天盘</span><span>八门</span><span>八神</span></div></article>
   <article class="panel pl-card" data-pl="taiyipan"><span class="num">05 · 三式</span><span class="enter">↗</span><h3>太乙神数 · 式盘</h3><p>十六神为外盘，九宫为式盘骨架；太乙、文昌、始击、计神、定目、主客定三算五将与八门同盘显现，并可逐年演示。</p><div class="tags"><span>太乙十六神</span><span>三算五将</span><span>九宫八门</span></div></article>
   <article class="panel pl-card future"><span class="num">NEXT · 天文</span><span class="enter">待建</span><h3>二十八宿 · 全天星图</h3><p>下一项建议：做独立的全天二十八宿天区盘，把四象、宿度、黄道、日月七政与十二次分野组织成真正的星野观察图。</p><div class="tags"><span>二十八宿</span><span>四象星野</span><span>黄道天区</span></div></article>
  </div></div>`;
  $$("[data-pl]", pane).forEach(
    (c) =>
      (c.onclick = () => {
        if (c.dataset.pl === "giant") plOpenGiant();
        else if (c.dataset.pl === "luojing") ljOpen();
        else if (c.dataset.pl === "liuren") lrpOpen();
        else if (c.dataset.pl === "qimenpan") qtpOpen();
        else if (c.dataset.pl === "taiyipan") typOpen();
      }),
  );
}
function plOpenGiant() {
  const pane = $("#pane-studio");
  if (!pane) return;
  PANLIB.mode = "giant";
  delete pane.dataset.ui;
  studioEnter();
  const bar = $(".stu-bar", pane);
  if (bar && !$("#plBackG")) {
    const b = document.createElement("button");
    b.type = "button";
    b.id = "plBackG";
    b.className = "gbtn sm";
    b.textContent = "← 盘库";
    b.title = "返回盘库选择";
    b.onclick = () => {
      studioLeave();
      plHub();
    };
    bar.insertBefore(b, bar.firstChild);
  }
}
function plClose() {
  if (STU.active) studioLeave();
  document.body.classList.remove("studio-mode");
  PANLIB.mode = "hub";
}
const studioSync_v38 = studioSync;
studioSync = function (id) {
  if (id === "studio") {
    plHub();
    return;
  }
  plClose();
};

function ljNorm(a) {
  return ((+a % 360) + 360) % 360;
}
function ljMtnAt(deg, off) {
  return p5Mtn(ljNorm(deg - off));
}
function ljAngleText(r, a, t, fs, cls) {
  const p = p5Pt(r, a);
  return `<text x="${p[0].toFixed(2)}" y="${p[1].toFixed(2)}" text-anchor="middle" dominant-baseline="central" font-size="${fs}" class="lj-txt ${cls || ""}">${esc(String(t))}</text>`;
}
function ljLine(r0, r1, a, cls) {
  const p0 = p5Pt(r0, a),
    p1 = p5Pt(r1, a);
  return `<line x1="${p0[0].toFixed(2)}" y1="${p0[1].toFixed(2)}" x2="${p1[0].toFixed(2)}" y2="${p1[1].toFixed(2)}" class="${cls || "lj-tick"}"/>`;
}
function ljSector(r0, r1, a0, a1, cls, deg, ttl) {
  return `<path d="${p5Arc(r0, r1, a0, a1)}" class="lj-ring ${cls || ""}" data-ljdeg="${ljNorm(deg).toFixed(3)}"><title>${esc(ttl || "")}</title></path>`;
}
function ljLayout() {
  const A = LJ_LAYERS.filter((x) => LJ.layers[x[0]]),
    weights = {
      deg: 0.8,
      xiu: 1.15,
      tian: 0.9,
      ren: 0.9,
      di: 1,
      n24: 0.9,
      d72: 1.15,
      d60: 1.1,
      cs: 1,
      nine: 0.9,
      hex: 1.55,
      ht: 1,
      xt: 1,
    },
    outer = 405,
    inner = 78,
    total = A.reduce((s, x) => s + (weights[x[0]] || 1), 0) || 1,
    unit = (outer - inner) / total;
  let r = outer;
  return A.map((x) => {
    const w = unit * (weights[x[0]] || 1),
      o = { k: x[0], n: x[1], r1: r, r0: r - w };
    r -= w;
    return o;
  });
}
function ljNeedleRing(r0, r1, off, kind, label) {
  let g = "";
  P5_N24.forEach((m, i) => {
    const c = ljNorm(m.c + off),
      sel = ljMtnAt(LJ.deg, off).n === m.n;
    g += ljSector(
      r0,
      r1,
      c - 7.5,
      c + 7.5,
      `${kind} ${i % 2 ? "b" : "a"}${sel ? " sel" : ""}`,
      c,
      `${label} · ${m.n}山 · 中心 ${c.toFixed(1)}°`,
    );
    g += ljAngleText(
      (r0 + r1) / 2,
      c,
      m.n,
      Math.max(9, Math.min(16, (r1 - r0) * 0.54)),
      sel ? "gold" : "",
    );
  });
  return g;
}
function ljBagua(r0, r1, M, label) {
  let g = "";
  Object.entries(M).forEach(([ti, a]) => {
    const T = TRI[+ti];
    g += ljSector(r0, r1, a - 22.5, a + 22.5, "b", a, `${label} · ${T.n} ${T.img}`);
    g += ljAngleText((r0 + r1) / 2, a, T.n, Math.max(10, Math.min(16, (r1 - r0) * 0.42)), "gold");
  });
  return g;
}
function lj72() {
  const out = [];
  let n = 0;
  for (let z = 0; z < 12; z++) {
    for (let k = 0; k < 5; k++)
      out.push({ txt: GAN[(z + 2 * k) % 10] + ZHI[z], z, empty: false, n: n++ });
    out.push({ txt: "空", z, empty: true, n: n++ });
  }
  return out;
}
const LJ72 = lj72(),
  LJ9 = ["一贪狼", "二巨门", "三禄存", "四文曲", "五廉贞", "六武曲", "七破军", "八左辅", "九右弼"];
function ljRender() {
  const svg = $("#ljSvg");
  if (!svg) return;
  const lay = ljLayout(),
    year = R && R.t && R.t.civ ? R.t.civ.y : nowBJ().y;
  let g = "";
  lay.forEach((L, li) => {
    const r0 = L.r0,
      r1 = L.r1,
      rm = (r0 + r1) / 2;
    if (L.k === "deg") {
      g += `<circle r="${r0}" fill="none" stroke="var(--line2)"/><circle r="${r1}" fill="none" stroke="var(--line2)"/>`;
      for (let i = 0; i < 365; i++) {
        const a = (i * 360) / 365.25,
          cl = i % 30 === 0 ? "lj-tick big" : i % 5 === 0 ? "lj-tick mid" : "lj-tick";
        g += ljLine(r1 - (i % 30 === 0 ? 10 : i % 5 === 0 ? 6 : 3), r1, a, cl);
        if (i % 30 === 0) g += ljAngleText(r1 - 14, a, i, 8, "dim");
      }
      g += ljAngleText(rm, 180, "周天365¼度", 8, "dim");
    } else if (L.k === "xiu") {
      const X = xiuTable(year);
      X.forEach((x, i) => {
        const c = ljNorm(x.s + x.w / 2);
        g += ljSector(
          r0,
          r1,
          x.s,
          x.s + x.w,
          i % 2 ? "b" : "a",
          c,
          `${x.n}宿 · ${x.full} · ${x.si}`,
        );
        g += ljAngleText(
          rm,
          c,
          x.n,
          Math.max(8, Math.min(13, (r1 - r0) * 0.42)),
          xiuOf(LJ.deg, year).i === x.i ? "gold" : "",
        );
      });
    } else if (L.k === "tian") g += ljNeedleRing(r0, r1, 7.5, "c", "天盘缝针");
    else if (L.k === "ren") g += ljNeedleRing(r0, r1, -7.5, "b", "人盘中针");
    else if (L.k === "di") g += ljNeedleRing(r0, r1, 0, "a", "地盘正针");
    else if (L.k === "n24") {
      P5_N24.forEach((m, i) => {
        const c = m.c;
        g += ljSector(
          r0,
          r1,
          c - 7.5,
          c + 7.5,
          m.yy ? "a" : "b",
          c,
          `${m.n}山 · ${m.yuan} · ${m.yy ? "阳" : "阴"} · ${m.gua}卦`,
        );
        g += ljAngleText(
          rm,
          c,
          m.yuan[0] + (m.yy ? "阳" : "阴"),
          Math.max(7, Math.min(10, (r1 - r0) * 0.34)),
          "dim",
        );
      });
    } else if (L.k === "d72") {
      LJ72.forEach((x, i) => {
        const a0 = LJ.d72 + i * 5,
          c = a0 + 2.5;
        g += ljSector(
          r0,
          r1,
          a0,
          a0 + 5,
          x.empty ? "c" : i % 2 ? "b" : "a",
          c,
          x.empty ? "穿山七十二龙 · 空亡格" : `穿山七十二龙 · ${x.txt}`,
        );
        g += ljAngleText(
          rm,
          c,
          x.txt,
          Math.max(6.5, Math.min(9, (r1 - r0) * 0.31)),
          x.empty ? "dim" : "",
        );
      });
    } else if (L.k === "d60") {
      for (let i = 0; i < 60; i++) {
        const a0 = LJ.d60 + i * 6,
          c = a0 + 3;
        g += ljSector(r0, r1, a0, a0 + 6, i % 2 ? "b" : "a", c, `透地六十龙 · ${gz(i)}`);
        g += ljAngleText(rm, c, gz(i), Math.max(6.5, Math.min(9, (r1 - r0) * 0.31)), "");
      }
    } else if (L.k === "cs") {
      const cs = p5ChangSheng(LJ.ju);
      for (let z = 0; z < 12; z++) {
        const c = z * 30;
        g += ljSector(
          r0,
          r1,
          c - 15,
          c + 15,
          z % 2 ? "b" : "a",
          c,
          `${LJ.ju}局 · ${ZHI[z]} · ${cs[z]}`,
        );
        g += ljAngleText(
          rm,
          c,
          cs[z],
          Math.max(8, Math.min(12, (r1 - r0) * 0.38)),
          cs[z] === "长生" ? "gold" : "",
        );
      }
    } else if (L.k === "nine") {
      LJ9.forEach((n, i) => {
        const a0 = i * 40,
          c = a0 + 20;
        g += ljSector(r0, r1, a0, a0 + 40, i % 2 ? "b" : "a", c, `九星序列参照 · ${n}`);
        g += ljAngleText(
          rm,
          c,
          n.slice(1),
          Math.max(8, Math.min(12, (r1 - r0) * 0.35)),
          i === 4 ? "gold" : "",
        );
      });
    } else if (L.k === "hex") {
      guaRing("xt").forEach(([u, l], i) => {
        const id = hexFromTri(u, l).join(""),
          z = ZY_BY[id],
          a0 = 180 + i * 5.625,
          c = a0 + 2.8125,
          nm = z.name.replace("为", "");
        g += ljSector(r0, r1, a0, a0 + 5.625, i % 2 ? "b" : "a", c, `${z.name} · ${z.gua}`);
        g += ljAngleText(
          rm,
          c,
          nm.length > 3 ? nm.slice(-2) : nm,
          Math.max(6.5, Math.min(9.5, (r1 - r0) * 0.26)),
          "",
        );
      });
    } else if (L.k === "ht") g += ljBagua(r0, r1, GUA_HT, "后天八卦");
    else if (L.k === "xt") g += ljBagua(r0, r1, GUA_XT, "先天八卦");
  });
  const sit = ljNorm(LJ.deg + 180),
    p0 = p5Pt(63, sit),
    p1 = p5Pt(414, LJ.deg),
    tip = p5Pt(414, LJ.deg);
  g += `<line x1="${p0[0]}" y1="${p0[1]}" x2="${p1[0]}" y2="${p1[1]}" class="lj-compass-line"/><circle cx="${tip[0]}" cy="${tip[1]}" r="6" class="lj-compass-tip"/><circle r="68" class="lj-core"/>${ljAngleText(0, 0, "", 1, "")}`;
  g += `<text x="0" y="-9" text-anchor="middle" class="lj-core-main">${LJ.deg.toFixed(1)}°</text><text x="0" y="10" text-anchor="middle" class="lj-core-sub">向 · ${p5Dir8(LJ.deg)[0]}</text><text x="0" y="27" text-anchor="middle" class="lj-core-sub">坐 ${sit.toFixed(1)}°</text>`;
  svg.innerHTML = g;
  ljViewApply();
  ljInfoRender();
}
function ljFindSector(deg, start, step, count) {
  let d = ljNorm(deg - start),
    i = Math.floor(d / step);
  if (i < 0) i = 0;
  if (i >= count) i = count - 1;
  return i;
}
function ljInfoRender() {
  const box = $("#ljInfo");
  if (!box) return;
  const d = ljNorm(LJ.deg),
    sit = ljNorm(d + 180),
    di = ljMtnAt(d, 0),
    ren = ljMtnAt(d, -7.5),
    tian = ljMtnAt(d, 7.5),
    f = p5Facing(d, 3),
    cs = p5ChangSheng(LJ.ju),
    br = p5Branch(d),
    i72 = ljFindSector(d, LJ.d72, 5, 72),
    v72 = LJ72[i72],
    i60 = ljFindSector(d, LJ.d60, 6, 60),
    v60 = gz(i60),
    x = xiuOf(d, R && R.t && R.t.civ ? R.t.civ.y : nowBJ().y);
  box.innerHTML = `<h4>当前定向</h4><div class="lj-trip"><div><small>地盘正针</small><b>${di.n}</b><span>${di.c.toFixed(1)}°中心</span></div><div><small>人盘中针</small><b>${ren.n}</b><span>−7.5°</span></div><div><small>天盘缝针</small><b>${tian.n}</b><span>+7.5°</span></div></div>
  <div class="lj-kv"><span>向</span><b>${d.toFixed(1)}° · ${p5Dir8(d)[0]} · ${f.mtn.n}山${f.zheng ? "正向" : "兼" + f.jian.n}</b><span>坐</span><b>${sit.toFixed(1)}° · ${p5Dir8(sit)[0]} · ${f.sitting.n}山</b><span>地盘属性</span><b>${di.yuan} · ${di.yy ? "阳" : "阴"}山 · ${di.gua}卦</b><span>穿山72龙</span><b>${v72.empty ? "空亡格" : v72.txt} · 第 ${i72 + 1} 格</b><span>透地60龙</span><b>${v60} · 第 ${i60 + 1} 格</b><span>${LJ.ju}局长生</span><b>${ZHI[br]}位「${cs[br]}」</b><span>二十八宿</span><b>${x.n}宿 · ${x.full || ""}</b></div>
  <div class="lj-info-card"><b>三针用途（传统三合罗盘口径）</b><br>地盘正针：主要用于格龙、立向与定坐向。<br>人盘中针：相对地盘退半山位，传统多用于消砂 / 拨砂。<br>天盘缝针：相对地盘进半山位，传统多用于纳水 / 消水。</div>
  <div class="lj-info-card"><b>为什么把它独立于巨盘？</b><br>这里的核心是三针之间的 7.5°错位、分金与定向工作流，属于罗经自身坐标体系；巨盘只保留与其它系统真正共享的八卦、宿度、干支等公共层。</div>
  <p class="note">穿山七十二龙与透地六十龙在不同罗经版本、流派中存在起点与配位差异。本页采用等分研习模型，并允许在左侧自行调整两层的起点角度；不要把一个版本的排列当成所有罗经的唯一标准。</p>`;
}
function ljViewApply() {
  const svg = $("#ljSvg");
  if (svg) svg.setAttribute("viewBox", `${LJ.view.x} ${LJ.view.y} ${LJ.view.w} ${LJ.view.h}`);
  const z = $("#ljZoom");
  if (z) z.textContent = Math.round((860 / LJ.view.w) * 100) + "%";
}
function ljFit() {
  LJ.view = { x: -430, y: -430, w: 860, h: 860 };
  LJ.zoom = 1;
  ljViewApply();
}
function ljZoomAt(f, cx, cy) {
  const svg = $("#ljSvg"),
    v = LJ.view;
  if (!svg) return;
  const r = svg.getBoundingClientRect(),
    px = v.x + ((cx - r.left) / r.width) * v.w,
    py = v.y + ((cy - r.top) / r.height) * v.h,
    nw = Math.max(180, Math.min(1500, v.w * f)),
    nh = nw,
    rn = nw / v.w;
  v.x = px - (px - v.x) * rn;
  v.y = py - (py - v.y) * rn;
  v.w = nw;
  v.h = nh;
  ljViewApply();
}
function ljSetDeg(d, soft = false) {
  LJ.deg = Math.round(ljNorm(d) * 10) / 10;
  const n = $("#ljDeg"),
    r = $("#ljRange");
  if (n) n.value = LJ.deg.toFixed(1);
  if (r) r.value = LJ.deg;
  ljRender();
  try {
    if (STU.sfx && soft) stuSfxTick(0.25, false, 1, 0.22);
  } catch (_) {}
}
function ljOpen() {
  const pane = $("#pane-studio");
  if (!pane) return;
  if (STU.active) studioLeave();
  PANLIB.mode = "luojing";
  document.body.classList.add("studio-mode");
  delete pane.dataset.ui;
  pane.dataset.built = "1";
  pane.innerHTML = `<div class="lj-shell" id="ljShell"><div class="lj-top"><button class="gbtn sm" id="ljBack">← 盘库</button><div class="lj-title"><b>正宗罗经三盘</b><small>地盘正针 · 人盘中针 · 天盘缝针 · 综合层叠研习</small></div><button class="gbtn sm" id="ljSyncIn">读取综合罗盘朝向</button><button class="gbtn sm" id="ljSyncOut">传给综合罗盘</button><button class="gbtn sm" id="ljFs">全屏</button></div>
  <div class="lj-grid"><aside class="panel lj-side"><h4>图层</h4><div class="lj-layers">${LJ_LAYERS.map(([k, n, d]) => `<label class="lj-lay"><input type="checkbox" data-ljl="${k}"${LJ.layers[k] ? " checked" : ""}><span>${n}<small>${d}</small></span></label>`).join("")}</div><div class="lj-ctl"><label>朝向（向）°<input type="number" id="ljDeg" min="0" max="359.9" step="0.1" value="${LJ.deg.toFixed(1)}"></label><input type="range" id="ljRange" min="0" max="359.9" step="0.1" value="${LJ.deg}"><div class="lj-btnrow"><button class="gbtn sm" data-ljd="0">北</button><button class="gbtn sm" data-ljd="90">东</button><button class="gbtn sm" data-ljd="180">南</button><button class="gbtn sm" data-ljd="270">西</button></div><label>三合十二长生<select id="ljJu">${["水", "木", "火", "金"].map((x) => `<option${x === LJ.ju ? " selected" : ""}>${x}</option>`).join("")}</select></label><details class="ph-note"><summary>龙盘校准</summary><label>穿山72龙起点°<input type="number" id="ljD72" min="0" max="359.9" step="0.1" value="${LJ.d72}"></label><label>透地60龙起点°<input type="number" id="ljD60" min="0" max="359.9" step="0.1" value="${LJ.d60}"></label><p class="dim sm">当前默认 337.5°。不同罗经实盘版本可按盘面起甲子位置自行校准。</p></details></div></aside>
  <section class="lj-main"><div class="lj-viewbar"><button class="gbtn sm" id="ljBearing">定向</button><button class="gbtn sm" id="ljPan">查看平移</button><span class="hint">滚轮缩放 · 定向模式拖动红线 · 查看模式拖动画面</span><button class="gbtn sm" id="ljFit">↙↗ 适应</button><span class="lj-z"><button class="gbtn sm" id="ljZm">−</button><span id="ljZoom">100%</span><button class="gbtn sm" id="ljZp">＋</button></span></div><div class="lj-frame bearing" id="ljFrame"><svg id="ljSvg" viewBox="-430 -430 860 860" role="img" aria-label="罗经三盘综合圆盘"></svg></div></section>
  <aside class="panel lj-info" id="ljInfo"></aside></div><div class="panel pl-next"><b class="gold">本页定位：</b>它是独立的“罗经工作台”，不是天机巨盘的子层。三针三盘之间的错位关系、穿山透地与定向读数在这里完整展开；巨盘仍只承担跨体系的同心比较与时空演算。</div></div>`;
  ljBind();
  ljRender();
}
function ljBind() {
  const pane = $("#pane-studio"),
    svg = $("#ljSvg"),
    frame = $("#ljFrame");
  if (!pane || !svg) return;
  $("#ljBack").onclick = () => plHub();
  $("#ljDeg").onchange = (e) => ljSetDeg(e.target.value);
  $("#ljRange").oninput = (e) => ljSetDeg(e.target.value, true);
  $$("[data-ljd]", pane).forEach((b) => (b.onclick = () => ljSetDeg(+b.dataset.ljd)));
  $$("[data-ljl]", pane).forEach(
    (c) =>
      (c.onchange = () => {
        LJ.layers[c.dataset.ljl] = c.checked ? 1 : 0;
        ljRender();
      }),
  );
  $("#ljJu").onchange = (e) => {
    LJ.ju = e.target.value;
    ljRender();
  };
  $("#ljD72").onchange = (e) => {
    LJ.d72 = ljNorm(e.target.value);
    ljRender();
  };
  $("#ljD60").onchange = (e) => {
    LJ.d60 = ljNorm(e.target.value);
    ljRender();
  };
  $("#ljSyncIn").onclick = () => {
    if (typeof P5 !== "undefined" && P5.lp) {
      ljSetDeg(P5.lp.deg);
      toast("已读取综合罗盘朝向");
    }
  };
  $("#ljSyncOut").onclick = () => {
    if (typeof P5 !== "undefined" && P5.lp) {
      P5.lp.deg = LJ.deg;
      toast("已同步到「综合罗盘」");
    }
  };
  const setMode = (m) => {
    LJ.mode = m;
    frame.classList.toggle("bearing", m === "bearing");
    frame.classList.toggle("pan", m === "pan");
    $("#ljBearing").classList.toggle("on", m === "bearing");
    $("#ljPan").classList.toggle("on", m === "pan");
  };
  $("#ljBearing").onclick = () => setMode("bearing");
  $("#ljPan").onclick = () => setMode("pan");
  setMode(LJ.mode);
  $("#ljFit").onclick = ljFit;
  $("#ljZm").onclick = () => {
    const r = svg.getBoundingClientRect();
    ljZoomAt(1.2, r.left + r.width / 2, r.top + r.height / 2);
  };
  $("#ljZp").onclick = () => {
    const r = svg.getBoundingClientRect();
    ljZoomAt(0.82, r.left + r.width / 2, r.top + r.height / 2);
  };
  svg.addEventListener(
    "wheel",
    (e) => {
      e.preventDefault();
      ljZoomAt(e.deltaY < 0 ? 0.86 : 1.16, e.clientX, e.clientY);
    },
    { passive: false },
  );
  const ang = (e) => {
    const r = svg.getBoundingClientRect(),
      v = LJ.view,
      x = v.x + ((e.clientX - r.left) / r.width) * v.w,
      y = v.y + ((e.clientY - r.top) / r.height) * v.h;
    return ljNorm((Math.atan2(x, -y) * 180) / Math.PI);
  };
  let drag = null,
    lastTick = LJ.deg,
    ljDragRAF = 0;
  const ljDragPaint = () => {
    if (ljDragRAF) return;
    ljDragRAF = requestAnimationFrame(() => {
      ljDragRAF = 0;
      ljRender();
    });
  };
  svg.addEventListener("pointerdown", (e) => {
    if (e.button > 0) return;
    if (LJ.mode === "bearing") {
      drag = { id: e.pointerId, m: "b" };
      try {
        svg.setPointerCapture(e.pointerId);
      } catch (_) {}
      ljSetDeg(ang(e));
      lastTick = LJ.deg;
    } else {
      drag = {
        id: e.pointerId,
        m: "p",
        x: e.clientX,
        y: e.clientY,
        vx: LJ.view.x,
        vy: LJ.view.y,
        w: LJ.view.w,
        h: LJ.view.h,
        rw: Math.max(1, svg.getBoundingClientRect().width),
        rh: Math.max(1, svg.getBoundingClientRect().height),
      };
      frame.classList.add("grab");
      try {
        svg.setPointerCapture(e.pointerId);
      } catch (_) {}
    }
  });
  svg.addEventListener("pointermove", (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    if (drag.m === "b") {
      const a = ang(e),
        delta = Math.abs(((a - lastTick + 540) % 360) - 180);
      LJ.deg = Math.round(a * 10) / 10;
      const n = $("#ljDeg"),
        r = $("#ljRange");
      if (n) n.value = LJ.deg.toFixed(1);
      if (r) r.value = LJ.deg;
      ljDragPaint();
      if (delta >= 2.4) {
        try {
          if (STU.sfx) stuSfxTick(0.22, false, 1, Math.min(1, delta / 12));
        } catch (_) {}
        lastTick = a;
      }
    } else {
      const kx = drag.w / drag.rw,
        ky = drag.h / drag.rh;
      LJ.view.x = drag.vx - (e.clientX - drag.x) * kx;
      LJ.view.y = drag.vy - (e.clientY - drag.y) * ky;
      ljViewApply();
    }
  });
  const up = (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    if (drag.m === "b") {
      try {
        if (STU.sfx) stuSfxClunk();
      } catch (_) {}
    }
    drag = null;
    frame.classList.remove("grab");
  };
  svg.addEventListener("pointerup", up);
  svg.addEventListener("pointercancel", () => {
    drag = null;
    frame.classList.remove("grab");
  });
  svg.addEventListener("click", (e) => {
    if (drag) return;
    const p = e.target.closest && e.target.closest("[data-ljdeg]");
    if (p && LJ.mode === "bearing") ljSetDeg(+p.dataset.ljdeg);
  });
  $("#ljFs").onclick = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await $("#ljShell").requestFullscreen();
    } catch (e) {
      toast("当前浏览器不允许全屏");
    }
  };
  document.addEventListener("fullscreenchange", () => {
    const b = $("#ljFs");
    if (b) b.textContent = document.fullscreenElement ? "退出全屏" : "全屏";
  });
}
/* 搜索目录只把盘库描述升级，不新增顶级页签，避免与“独立盘库”的架构冲突。 */
try {
  const g = NAV_G.find((x) => x.g === "盘库");
  if (g && g.it && g.it[0]) {
    g.it[0][1] = "盘库";
    g.it[0][2] = "天机巨盘、正宗罗经三盘、大六壬天地盘、奇门转盘式盘、太乙神数式盘及后续独立盘";
    g.it[0][3] +=
      " 罗经 三盘 地盘正针 人盘中针 天盘缝针 穿山七十二龙 透地六十龙 十二长生 周天度 大六壬 天地盘 月将加时 十二天将 贵人 三传 四课 奇门 转盘 九星 八门 八神 天盘干 地盘干 太乙 神数 十六神 文昌 始击 计神 三算 五将 九宫 八门";
  }
} catch (e) {}
