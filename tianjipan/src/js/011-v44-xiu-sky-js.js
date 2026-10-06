/* ===== v44 盘库 · 二十八宿全天星图 ===== */
const XAP = {
  civ: null,
  rot: 0,
  gesture: "rotate",
  view: { x: -450, y: -450, w: 900, h: 900 },
  sel: null,
  play: null,
  step: "day",
  layers: {
    grid: 1,
    stars: 1,
    starname: 1,
    const: 1,
    cname: 1,
    ecl: 1,
    eq: 1,
    horizon: 1,
    planets: 1,
    ci: 1,
    xiu: 1,
    xiang: 1,
  },
};
const XAP_LAYERS = [
  ["grid", "黄道经纬网", "黄纬圈与黄经放射线"],
  ["stars", "亮星星表", "HYG 亮星 514 颗"],
  ["starname", "亮星名称", "仅标注最亮的一部分"],
  ["const", "主要星座骨架", "复用系统现有星座连线"],
  ["cname", "星座名称", "黄道星座金色，其余蓝白"],
  ["ecl", "黄道", "黄纬 0° 圆"],
  ["eq", "天赤道", "由岁差后的赤道面投影"],
  ["horizon", "当前地平圈", "依观测地与时刻实时变化"],
  ["planets", "日月七政", "日月与水金火木土"],
  ["ci", "十二次", "星纪、玄枵、娵訾等"],
  ["xiu", "二十八宿", "按系统现有宿度表"],
  ["xiang", "四象", "青龙玄武白虎朱雀"],
];
function xapNow() {
  const n = nowBJ();
  return { y: n.y, m: n.m, d: n.d, h: n.h, mi: n.mi, s: 0 };
}
function xapDt(c) {
  return `${c.y}-${f2(c.m)}-${f2(c.d)}T${f2(c.h)}:${f2(c.mi || 0)}`;
}
function xapParse(v) {
  const m = String(v || "").match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  return m ? { y: +m[1], m: +m[2], d: +m[3], h: +m[4], mi: +m[5], s: 0 } : null;
}
function xapR() {
  if (!XAP.civ) XAP.civ = xapNow();
  try {
    return compute(XAP.civ);
  } catch (e) {
    console.error("xap compute", e);
    return null;
  }
}
function xapNorm(a) {
  return ((+a % 360) + 360) % 360;
}
function xapEqToEcl(raDeg, decDeg, jd) {
  const eps = (typeof smSun === "function" ? smSun(jd).eps : 23.4393) * D2R,
    a = raDeg * D2R,
    d = decDeg * D2R,
    cd = Math.cos(d),
    x = cd * Math.cos(a),
    y = cd * Math.sin(a),
    z = Math.sin(d),
    yy = y * Math.cos(eps) + z * Math.sin(eps),
    zz = -y * Math.sin(eps) + z * Math.cos(eps);
  return {
    lon: xapNorm(Math.atan2(yy, x) / D2R),
    lat: Math.asin(Math.max(-1, Math.min(1, zz))) / D2R,
  };
}
function xapProj(lon, lat, R = 292) {
  const rr = (R * (90 - Math.max(-90, Math.min(90, lat)))) / 180,
    a = xapNorm(lon + XAP.rot) * D2R;
  return [rr * Math.sin(a), -rr * Math.cos(a)];
}
function xapText(r, a, t, fs, cls = "") {
  const p = p5Pt(r, xapNorm(a + XAP.rot));
  return `<text x="${p[0].toFixed(2)}" y="${p[1].toFixed(2)}" class="xap-ringtxt ${cls}" font-size="${fs}">${esc(String(t))}</text>`;
}
function xapSector(r0, r1, a0, a1, cls, attrs = "") {
  return `<path d="${p5Arc(r0, r1, a0 + XAP.rot, a1 + XAP.rot)}" class="${cls}" ${attrs}/>`;
}
function xapPath(points) {
  return points.map((p, i) => (i ? "L" : "M") + p[0].toFixed(2) + "," + p[1].toFixed(2)).join(" ");
}
function xapEqCircle(jd, R) {
  const P = [];
  for (let a = 0; a <= 360; a += 3) {
    const e = xapEqToEcl(a, 0, jd);
    P.push(xapProj(e.lon, e.lat, R));
  }
  return xapPath(P);
}
function xapHorEq(az, alt, jd, lon, lat) {
  const A = az * D2R,
    h = alt * D2R,
    ph = lat * D2R,
    sd = Math.sin(h) * Math.sin(ph) + Math.cos(h) * Math.cos(ph) * Math.cos(A),
    dec = Math.asin(Math.max(-1, Math.min(1, sd))),
    cd = Math.cos(dec) || 1e-9,
    sH = (-Math.sin(A) * Math.cos(h)) / cd,
    cH = (Math.sin(h) - Math.sin(ph) * Math.sin(dec)) / (Math.cos(ph) * cd || 1e-9),
    H = Math.atan2(sH, cH) / D2R,
    lst = xapNorm((smGMST(jd) + lon / 15) * 15),
    ra = xapNorm(lst - H);
  return { ra, dec: dec / D2R };
}
function xapHorizonPath(jd, lon, lat, R) {
  const P = [];
  for (let az = 0; az <= 360; az += 3) {
    const q = xapHorEq(az, 0, jd, lon, lat),
      e = xapEqToEcl(q.ra, q.dec, jd);
    P.push(xapProj(e.lon, e.lat, R));
  }
  return xapPath(P);
}
function xapConstellationSvg(jd, R) {
  if (!XAP.layers.const && !XAP.layers.cname) return "";
  let s = "";
  for (let ci = 0; ci < XK3_CONST.length; ci++) {
    const co = XK3_CONST[ci],
      pp = co.p.map((p) => {
        const eq = xkPrecess(p[0] / 15, p[1], jd),
          e = xapEqToEcl(eq.ra, eq.dec, jd);
        return xapProj(e.lon, e.lat, R);
      });
    if (XAP.layers.const) {
      for (const path of co.l) {
        let d = "";
        for (let k = 0; k < path.length; k++) {
          const p = pp[path[k]];
          d += (k ? "L" : "M") + p[0].toFixed(1) + "," + p[1].toFixed(1) + " ";
        }
        s += `<path d="${d}" class="xap-const${co.z ? " z" : ""}"/>`;
      }
    }
    if (XAP.layers.cname) {
      const n = pp.length || 1,
        sx = pp.reduce((a, p) => a + p[0], 0) / n,
        sy = pp.reduce((a, p) => a + p[1], 0) / n;
      s += `<text x="${sx.toFixed(1)}" y="${(sy - 6).toFixed(1)}" class="xap-cname${co.z ? " z" : ""}">${esc(co.n)}</text>`;
    }
  }
  return s;
}
function xapStarsSvg(jd, R) {
  if (!XAP.layers.stars) return "";
  let s = "",
    labels = [];
  for (let i = 0; i < XK_STARS.length; i++) {
    const st = XK_STARS[i],
      eq = xkPrecess(st[1], st[2], jd),
      e = xapEqToEcl(eq.ra, eq.dec, jd),
      p = xapProj(e.lon, e.lat, R),
      m = st[3],
      rr = Math.max(0.8, 3.5 - 0.66 * m),
      sel = XAP.sel && XAP.sel.t === "star" && XAP.sel.i === i;
    s += `<circle cx="${p[0].toFixed(2)}" cy="${p[1].toFixed(2)}" r="${rr.toFixed(2)}" fill="${xkStarColor(st[4])}" class="xap-star${sel ? " sel" : ""}" data-xap-star="${i}"><title>${esc(st[0])} · 星等 ${m}</title></circle>`;
    if (XAP.layers.starname && m <= 1.35 && !/^HIP|^[A-Z][a-z]{2}\s/.test(st[0])) {
      let ok = true;
      for (const q of labels)
        if (Math.hypot(q[0] - p[0], q[1] - p[1]) < 38) {
          ok = false;
          break;
        }
      if (ok) {
        labels.push(p);
        s += `<text x="${(p[0] + 5).toFixed(1)}" y="${(p[1] - 5).toFixed(1)}" class="xap-starlab">${esc(st[0])}</text>`;
      }
    }
  }
  return s;
}
function xapPlanetsSvg(R0, R) {
  if (!XAP.layers.planets) return "";
  const P = (R0.astro && R0.astro.planets ? R0.astro.planets : asPlanets(R0.t.jdUT)).filter((p) =>
      ["太阳", "月亮", "水星", "金星", "火星", "木星", "土星"].includes(p.n),
    ),
    cols = {
      太阳: "#ffd36f",
      月亮: "#e8edf7",
      水星: "#88b9d0",
      金星: "#e7c77a",
      火星: "#d86b55",
      木星: "#81bd95",
      土星: "#cdb06c",
    };
  let s = "";
  P.forEach((p, i) => {
    const xy = xapProj(p.lon, p.lat || 0, R),
      sel = XAP.sel && XAP.sel.t === "planet" && XAP.sel.n === p.n,
      r = p.n === "太阳" ? 6.8 : p.n === "月亮" ? 5.8 : 4.8;
    s += `<g class="xap-planet${sel ? " sel" : ""}" data-xap-planet="${p.n}"><circle cx="${xy[0].toFixed(1)}" cy="${xy[1].toFixed(1)}" r="${r}" fill="${cols[p.n]}"><title>${p.n} 黄经 ${p.lon.toFixed(2)}°</title></circle><text x="${(xy[0] + 8).toFixed(1)}" y="${(xy[1] - 7).toFixed(1)}">${p.g || ""}${p.n}</text></g>`;
  });
  return s;
}
function xapRings(R0) {
  const year = R0.t.civ.y,
    tb = xiuTable(year),
    sun = R0.astro.planets[0],
    moon = R0.astro.planets[1],
    sx = xiuOf(sun.lon, year).i,
    mx = xiuOf(moon.lon, year).i;
  let s = "";
  if (XAP.layers.ci) {
    for (let i = 0; i < 12; i++) {
      const a0 = i * 30,
        a1 = a0 + 30,
        sel = XAP.sel && XAP.sel.t === "ci" && XAP.sel.i === i;
      s +=
        xapSector(296, 320, a0, a1, "xap-ci" + (sel ? " sel" : ""), `data-xap-ci="${i}"`) +
        xapText(308, a0 + 15, AS_SIGN[i][2], 9, "");
    }
  }
  if (XAP.layers.xiu) {
    tb.forEach((x, i) => {
      const g = i < 7 ? 0 : i < 14 ? 1 : i < 21 ? 2 : 3,
        cls = `xap-xiu x${g}${i === sx ? " sun" : ""}${i === mx ? " moon" : ""}${XAP.sel && XAP.sel.t === "xiu" && XAP.sel.i === i ? " sel" : ""}`;
      s +=
        xapSector(321, 382, x.s, x.s + x.w, cls, `data-xap-xiu="${i}"`) +
        xapText(
          351,
          x.s + x.w / 2,
          x.n,
          Math.max(8, Math.min(12, x.w * 0.65)),
          i === sx ? "gold" : "",
        );
    });
  }
  if (XAP.layers.xiang) {
    const groups = [
      [0, 7, 0],
      [7, 14, 1],
      [14, 21, 2],
      [21, 28, 3],
    ];
    groups.forEach(([a, b, g]) => {
      const a0 = tb[a].s,
        w = tb.slice(a, b).reduce((n, x) => n + x.w, 0);
      s +=
        xapSector(383, 414, a0, a0 + w, `xap-xiang x${g}`) +
        xapText(398, a0 + w / 2, XIANG[g][0], 10, "gold");
    });
  }
  return s;
}
function xapSvg(R0) {
  const jd = R0.t.jdUT,
    loc = { lon: +R0.opt.lon || 120, lat: +R0.opt.lat || 24.5 },
    Rr = 286;
  let g = "";
  g += `<circle r="414" fill="rgba(5,8,18,.88)" stroke="var(--line2)"/><circle r="${Rr}" fill="rgba(8,13,28,.78)" stroke="rgba(217,178,95,.25)"/>`;
  if (XAP.layers.grid) {
    [-60, -30, 0, 30, 60].forEach((lat) => {
      const rr = (Rr * (90 - lat)) / 180;
      g += `<circle r="${rr.toFixed(1)}" class="xap-gridc${lat === 0 ? " ecl" : ""}"/>`;
    });
    for (let lon = 0; lon < 360; lon += 30) {
      const p0 = xapProj(lon, 89.5, Rr),
        p1 = xapProj(lon, -90, Rr);
      g += `<line x1="${p0[0]}" y1="${p0[1]}" x2="${p1[0]}" y2="${p1[1]}" class="xap-gridline"/>`;
      if (lon % 90 === 0) g += xapText(276, lon, lon + "°", 8, "");
    }
  }
  if (XAP.layers.ecl)
    g += `<circle r="${(Rr / 2).toFixed(1)}" class="xap-gridc ecl"><title>黄道 / 黄纬0°</title></circle>`;
  if (XAP.layers.eq)
    g += `<path d="${xapEqCircle(jd, Rr)}" class="xap-gridc eq"><title>天赤道</title></path>`;
  if (XAP.layers.horizon)
    g += `<path d="${xapHorizonPath(jd, loc.lon, loc.lat, Rr)}" class="xap-horizon"><title>当前观测地地平圈</title></path>`;
  g += xapConstellationSvg(jd, Rr) + xapStarsSvg(jd, Rr) + xapPlanetsSvg(R0, Rr) + xapRings(R0);
  g += `<circle r="48" class="xap-core"/><circle r="3" class="xap-pole"/><text x="0" y="-8" text-anchor="middle" class="xap-core-main">全天星图</text><text x="0" y="11" text-anchor="middle" class="xap-core-sub">黄道北极投影 · 全星空</text><text x="0" y="26" text-anchor="middle" class="xap-core-sub">视图旋转 ${Math.round(XAP.rot)}°</text><line x1="0" y1="-52" x2="0" y2="-78" class="xap-axis"/><text x="0" y="-84" text-anchor="middle" class="xap-note">春分点方向</text>`;
  return g;
}
function xapBrightInXiu(i, R0) {
  const tb = xiuTable(R0.t.civ.y),
    x = tb[i],
    jd = R0.t.jdUT,
    out = [];
  for (let k = 0; k < XK_STARS.length; k++) {
    const st = XK_STARS[k],
      eq = xkPrecess(st[1], st[2], jd),
      e = xapEqToEcl(eq.ra, eq.dec, jd);
    if (xapNorm(e.lon - x.s) < x.w) out.push({ n: st[0], m: st[3] });
  }
  return out.sort((a, b) => a.m - b.m).slice(0, 8);
}
function xapInfo(R0) {
  const box = $("#xapInfo");
  if (!box || !R0) return;
  const A = R0.astro,
    year = R0.t.civ.y,
    sun = A.planets[0],
    moon = A.planets[1],
    sx = xiuOf(sun.lon, year),
    mx = xiuOf(moon.lon, year),
    ph = A.moon || asMoonPhase(sun.lon, moon.lon),
    loc = { lon: +R0.opt.lon || 120, lat: +R0.opt.lat || 24.5 };
  const rows = A.planets
    .filter((p) => ["太阳", "月亮", "水星", "金星", "火星", "木星", "土星"].includes(p.n))
    .map((p) => {
      const x = xiuOf(p.lon, year),
        ci = AS_SIGN[Math.floor(p.lon / 30) % 12][2];
      return `<div class="xap-seven-row"><b>${p.g || ""} ${p.n}</b><span>${x.n}宿 · ${ci}</span><em>${p.lon.toFixed(1)}°</em></div>`;
    })
    .join("");
  let sel = "";
  if (XAP.sel && XAP.sel.t === "xiu") {
    const i = XAP.sel.i,
      tb = xiuTable(year),
      x = tb[i],
      z = XK_XIU[i],
      bs = xapBrightInXiu(i, R0);
    sel = `<div class="xap-selbox"><h5>${z[0]} · ${x.si}</h5><div>宿度模型：${x.w.toFixed(2)}° · 起 ${x.s.toFixed(2)}°</div><div class="tags"><span>${XIANG[z[1]][0]}</span><span>${XIANG[z[1]][1]}方</span><span>${XIANG[z[1]][3]}季</span><span>${z[2]}</span></div><p>${z[3]}。</p><div>本宿范围内亮星：${bs.length ? bs.map((q) => q.n + "(" + q.m.toFixed(1) + ")").join("、") : "当前亮星表无明显亮星"}</div></div>`;
  } else if (XAP.sel && XAP.sel.t === "planet") {
    const p = A.planets.find((q) => q.n === XAP.sel.n);
    if (p) {
      const x = xiuOf(p.lon, year),
        sg = AS_SIGN[Math.floor(p.lon / 30) % 12];
      sel = `<div class="xap-selbox"><h5>${p.g || ""} ${p.n}</h5><div>黄经 ${p.lon.toFixed(3)}° · 黄纬 ${(p.lat || 0).toFixed(3)}°</div><div class="tags"><span>${x.n}宿</span><span>${sg[2]}</span><span>${sg[0]}座</span>${p.retro ? "<span>逆行</span>" : "<span>顺行</span>"}</div></div>`;
    }
  } else if (XAP.sel && XAP.sel.t === "star") {
    const st = XK_STARS[XAP.sel.i];
    if (st) {
      const eq = xkPrecess(st[1], st[2], R0.t.jdUT),
        e = xapEqToEcl(eq.ra, eq.dec, R0.t.jdUT),
        x = xiuOf(e.lon, year);
      sel = `<div class="xap-selbox"><h5>${esc(st[0])}</h5><div>J2000 赤经 ${st[1].toFixed(4)}h · 赤纬 ${st[2].toFixed(3)}°</div><div>星等 ${st[3].toFixed(2)} · B−V ${st[4].toFixed(2)}</div><div class="tags"><span>当前黄经 ${e.lon.toFixed(1)}°</span><span>黄纬 ${e.lat.toFixed(1)}°</span><span>${x.n}宿</span></div></div>`;
    }
  } else if (XAP.sel && XAP.sel.t === "ci") {
    const i = XAP.sel.i;
    sel = `<div class="xap-selbox"><h5>${AS_SIGN[i][2]} · 十二次</h5><div>本图按现有天象模块使用的 30° 等分参照显示，与二十八宿宿界不是同一套边界。</div><div class="tags"><span>${AS_SIGN[i][0]}座区段</span><span>${i * 30}°–${i * 30 + 30}°</span></div></div>`;
  }
  box.innerHTML = `<div class="xap-info-inner"><div><h4>此刻天区</h4><div class="xap-facts"><span>时刻</span><b>${xapDt(R0.t.civ).replace("T", " ")}</b><span>观测地</span><b>${loc.lon.toFixed(2)}°E · ${loc.lat.toFixed(2)}°N</b><span>太阳</span><b>${sun.lon.toFixed(2)}° · ${sx.n}宿 · ${AS_SIGN[Math.floor(sun.lon / 30) % 12][2]}</b><span>月亮</span><b>${moon.lon.toFixed(2)}° · ${mx.n}宿 · ${AS_SIGN[Math.floor(moon.lon / 30) % 12][2]}</b><span>月相</span><b>${ph.name} · 亮面 ${(ph.lit * 100).toFixed(0)}%</b><span>投影</span><b>黄道北极等距投影 · 全星空</b></div></div><div><h4>日月七政</h4><div class="xap-seven">${rows}</div></div>${sel ? `<div class="xap-wide"><h4>当前选中</h4>${sel}</div>` : ""}</div>`;
}
function xapViewApply() {
  const svg = $("#xapSvg");
  if (!svg) return;
  const v = XAP.view;
  svg.setAttribute("viewBox", `${v.x} ${v.y} ${v.w} ${v.h}`);
  const z = $("#xapZoom");
  if (z) z.textContent = Math.round((900 / v.w) * 100) + "%";
}
function xapFit() {
  XAP.view = { x: -450, y: -450, w: 900, h: 900 };
  xapViewApply();
}
function xapZoomAt(k, cx, cy) {
  const svg = $("#xapSvg");
  if (!svg) return;
  const r = svg.getBoundingClientRect(),
    v = XAP.view,
    nw = Math.max(250, Math.min(1900, v.w * k)),
    px = v.x + ((cx - r.left) / r.width) * v.w,
    py = v.y + ((cy - r.top) / r.height) * v.h,
    rr = nw / v.w;
  v.x = px - (px - v.x) * rr;
  v.y = py - (py - v.y) * rr;
  v.w = nw;
  v.h = nw;
  xapViewApply();
}
function xapRender(anim = false) {
  const R0 = xapR(),
    svg = $("#xapSvg");
  if (!R0 || !svg) return;
  svg.innerHTML = xapSvg(R0);
  xapViewApply();
  xapInfo(R0);
  const dt = $("#xapDt");
  if (dt && document.activeElement !== dt) dt.value = xapDt(XAP.civ);
  const rr = $("#xapRot");
  if (rr && document.activeElement !== rr) rr.value = Math.round(XAP.rot);
  const rt = $("#xapRotTxt");
  if (rt) rt.textContent = Math.round(XAP.rot) + "°";
  if (anim) {
    const body = svg.querySelectorAll(".xap-planet,.xap-xiu");
    if (body.length && svg.animate)
      svg.animate([{ opacity: 0.62 }, { opacity: 1 }], { duration: 360, easing: "ease-out" });
    try {
      if (STU.sfx) stuSfxTick(0.26, false, 1, 0.35);
    } catch (_) {}
  }
}
function xapShift(unit, n = 1) {
  const c = XAP.civ || xapNow(),
    mins =
      unit === "hour"
        ? 60 * n
        : unit === "day"
          ? 1440 * n
          : unit === "month"
            ? 43200 * n
            : 525960 * n,
    jd = jdFromGreg(c.y, c.m, c.d, c.h, c.mi || 0, 0) + mins / 1440,
    f = fromJD(jd);
  XAP.civ = { y: f.y, m: f.m, d: f.d, h: f.h, mi: f.mi, s: 0 };
  xapRender(true);
}
function xapPlayToggle() {
  const b = $("#xapPlay");
  if (XAP.play) {
    clearInterval(XAP.play);
    XAP.play = null;
    if (b) {
      b.classList.remove("on");
      b.textContent = "▶ 时间播放";
    }
    return;
  }
  if (b) {
    b.classList.add("on");
    b.textContent = "■ 停止播放";
  }
  XAP.play = setInterval(() => xapShift(XAP.step, 1), 1000);
}
function xapStop() {
  if (XAP.play) {
    clearInterval(XAP.play);
    XAP.play = null;
  }
}
function xapOpen() {
  const pane = $("#pane-studio");
  if (!pane) return;
  if (STU.active) studioLeave();
  try {
    typStop();
    qtpStop();
    lrpStop();
  } catch (_) {}
  xapStop();
  PANLIB.mode = "xiutian";
  document.body.classList.add("studio-mode");
  delete pane.dataset.ui;
  pane.dataset.built = "1";
  if (!XAP.civ) XAP.civ = xapNow();
  pane.innerHTML = `<div class="xap-shell" id="xapShell"><div class="xap-top"><button class="gbtn sm" id="xapBack">← 盘库</button><div class="xap-title"><b>二十八宿 · 全天星图</b><small>盖图式圆形天图 · 四象 · 十二次 · 日月七政 · 真实亮星</small></div><button class="gbtn sm" id="xapSkyPage">打开实时星空</button><button class="gbtn sm" id="xapAstroPage">打开天象详页</button><button class="gbtn sm" id="xapFs">全屏</button></div><div class="xap-grid"><aside class="panel xap-side"><h4>观察时刻</h4><div class="xap-group"><label>日期时间<input type="datetime-local" id="xapDt" value="${xapDt(XAP.civ)}"></label><div class="xap-btnrow"><button class="gbtn sm" id="xapNow">此刻</button><button class="gbtn sm" id="xapPrev">← 上一步</button><button class="gbtn sm" id="xapNext">下一步 →</button></div><label>播放步长<select id="xapStep"><option value="hour"${XAP.step === "hour" ? " selected" : ""}>每步 1 小时</option><option value="day"${XAP.step === "day" ? " selected" : ""}>每步 1 天</option><option value="month"${XAP.step === "month" ? " selected" : ""}>每步约 1 月</option><option value="year"${XAP.step === "year" ? " selected" : ""}>每步约 1 年</option></select></label><button class="gbtn sm xap-play" id="xapPlay" style="width:100%;margin-top:6px">▶ 时间播放</button></div><div class="xap-group"><h4>显示层</h4><div class="xap-layers">${XAP_LAYERS.map(([k, n, d]) => `<label class="xap-layer"><input type="checkbox" data-xapl="${k}"${XAP.layers[k] ? " checked" : ""}><span>${n}<small>${d}</small></span></label>`).join("")}</div></div><div class="xap-group"><label>视图旋转 <span id="xapRotTxt">${Math.round(XAP.rot)}°</span><input type="range" id="xapRot" min="0" max="359" step="1" value="${Math.round(XAP.rot)}"></label><div class="xap-btnrow"><button class="gbtn sm" data-xapr="0">0°</button><button class="gbtn sm" data-xapr="90">90°</button><button class="gbtn sm" data-xapr="180">180°</button><button class="gbtn sm" data-xapr="270">270°</button></div><p class="note">这里的“旋转”只改变天图朝向，不改变真实天体位置。</p></div></aside><section class="xap-main"><div class="xap-viewbar"><button class="gbtn sm on" id="xapRotate">转天图</button><button class="gbtn sm" id="xapPan">查看平移</button><span class="hint">拖动转天图 / 平移 · 滚轮缩放 · 点宿、星、七政查看详情</span><button class="gbtn sm" id="xapFit">↙↗ 适应</button><span class="xap-z"><button class="gbtn sm" id="xapZm">−</button><span id="xapZoom">100%</span><button class="gbtn sm" id="xapZp">＋</button></span></div><div class="xap-frame rotate" id="xapFrame"><svg id="xapSvg" viewBox="-450 -450 900 900" role="img" aria-label="二十八宿全天星图"></svg></div></section><aside class="panel xap-info" id="xapInfo"></aside></div><div class="panel xap-bottom"><b>读图口径：</b>中央星图使用系统现有 HYG 亮星表与 J2000→当日岁差改正，采用黄道北极等距投影，把整个天球压入一个圆内；黄道在半径中圈，北黄极在中心，南黄极在外缘。外围“二十八宿”沿用本项目已有的宿度重建模型；它是传统宿度参照，不等于现代 IAU 星座边界，也不等于黄历里的“值日宿”。十二次采用当前天象模块的 30°参照，和二十八宿边界分开显示。</div></div>`;
  xapBind();
  xapRender(false);
}
function xapBind() {
  const pane = $("#pane-studio"),
    svg = $("#xapSvg"),
    frame = $("#xapFrame");
  if (!pane || !svg) return;
  $("#xapBack").onclick = () => {
    xapStop();
    plHub();
  };
  $("#xapNow").onclick = () => {
    XAP.civ = xapNow();
    xapRender(true);
  };
  $("#xapPrev").onclick = () => xapShift(XAP.step, -1);
  $("#xapNext").onclick = () => xapShift(XAP.step, 1);
  $("#xapStep").onchange = (e) => {
    XAP.step = e.target.value;
  };
  $("#xapPlay").onclick = xapPlayToggle;
  $("#xapDt").onchange = (e) => {
    const c = xapParse(e.target.value);
    if (c) {
      XAP.civ = c;
      xapRender(true);
    }
  };
  $$("[data-xapl]", pane).forEach(
    (c) =>
      (c.onchange = () => {
        XAP.layers[c.dataset.xapl] = c.checked ? 1 : 0;
        xapRender(false);
      }),
  );
  $("#xapRot").oninput = (e) => {
    XAP.rot = +e.target.value || 0;
    xapRender(false);
  };
  $$("[data-xapr]", pane).forEach(
    (b) =>
      (b.onclick = () => {
        XAP.rot = +b.dataset.xapr;
        xapRender(false);
      }),
  );
  const mode = (m) => {
    XAP.gesture = m;
    frame.classList.toggle("rotate", m === "rotate");
    frame.classList.toggle("pan", m === "pan");
    $("#xapRotate").classList.toggle("on", m === "rotate");
    $("#xapPan").classList.toggle("on", m === "pan");
  };
  $("#xapRotate").onclick = () => mode("rotate");
  $("#xapPan").onclick = () => mode("pan");
  $("#xapFit").onclick = xapFit;
  $("#xapZm").onclick = () => {
    const r = svg.getBoundingClientRect();
    xapZoomAt(1.2, r.left + r.width / 2, r.top + r.height / 2);
  };
  $("#xapZp").onclick = () => {
    const r = svg.getBoundingClientRect();
    xapZoomAt(0.82, r.left + r.width / 2, r.top + r.height / 2);
  };
  svg.addEventListener(
    "wheel",
    (e) => {
      e.preventDefault();
      xapZoomAt(e.deltaY < 0 ? 0.86 : 1.16, e.clientX, e.clientY);
    },
    { passive: false },
  );
  let drag = null,
    xapDragRAF = 0;
  const xapDragPaint = () => {
    if (xapDragRAF) return;
    xapDragRAF = requestAnimationFrame(() => {
      xapDragRAF = 0;
      xapRender(false);
    });
  };
  const angle = (e) => {
    const r = svg.getBoundingClientRect(),
      v = XAP.view,
      x = v.x + ((e.clientX - r.left) / r.width) * v.w,
      y = v.y + ((e.clientY - r.top) / r.height) * v.h;
    return Math.atan2(x, -y) / D2R;
  };
  svg.addEventListener("pointerdown", (e) => {
    if (e.button > 0) return;
    if (XAP.gesture === "rotate") drag = { id: e.pointerId, m: "r", a: angle(e), r: XAP.rot };
    else
      drag = {
        id: e.pointerId,
        m: "p",
        x: e.clientX,
        y: e.clientY,
        vx: XAP.view.x,
        vy: XAP.view.y,
        w: XAP.view.w,
        h: XAP.view.h,
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
    if (drag.m === "r") {
      XAP.rot = xapNorm(drag.r + angle(e) - drag.a);
      const q = $("#xapRot");
      if (q) q.value = Math.round(XAP.rot);
      xapDragPaint();
    } else {
      const kx = drag.w / drag.rw,
        ky = drag.h / drag.rh;
      XAP.view.x = drag.vx - (e.clientX - drag.x) * kx;
      XAP.view.y = drag.vy - (e.clientY - drag.y) * ky;
      xapViewApply();
    }
  });
  const up = (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    drag = null;
    frame.classList.remove("grab");
    try {
      if (STU.sfx) stuSfxClunk();
    } catch (_) {}
  };
  svg.addEventListener("pointerup", up);
  svg.addEventListener("pointercancel", () => {
    drag = null;
    frame.classList.remove("grab");
  });
  svg.addEventListener("click", (e) => {
    const st = e.target.closest && e.target.closest("[data-xap-star]"),
      pl = e.target.closest && e.target.closest("[data-xap-planet]"),
      xu = e.target.closest && e.target.closest("[data-xap-xiu]"),
      ci = e.target.closest && e.target.closest("[data-xap-ci]");
    if (st) XAP.sel = { t: "star", i: +st.dataset.xapStar };
    else if (pl) XAP.sel = { t: "planet", n: pl.dataset.xapPlanet };
    else if (xu) XAP.sel = { t: "xiu", i: +xu.dataset.xapXiu };
    else if (ci) XAP.sel = { t: "ci", i: +ci.dataset.xapCi };
    else return;
    xapRender(false);
  });
  $("#xapSkyPage").onclick = () => {
    xapStop();
    selectTab("xingkong", true);
  };
  $("#xapAstroPage").onclick = () => {
    xapStop();
    selectTab("astro", true);
  };
  $("#xapFs").onclick = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await $("#xapShell").requestFullscreen();
    } catch (e) {
      toast("当前浏览器不允许全屏");
    }
  };
  document.addEventListener("fullscreenchange", () => {
    const b = $("#xapFs");
    if (b) b.textContent = document.fullscreenElement ? "退出全屏" : "全屏";
  });
}
/* 盘库入口：把 v43 的“下一项”替换为正式第 06 盘，并继续预留下一项。 */
const plHub_v43_xap = plHub;
plHub = function () {
  xapStop();
  plHub_v43_xap();
  const pane = $("#pane-studio");
  if (!pane) return;
  const cnt = pane.querySelector(".pl-count b");
  if (cnt) cnt.textContent = "06";
  const f = pane.querySelector(".pl-card.future");
  if (f)
    f.outerHTML = `<article class="panel pl-card" data-pl="xiutian"><span class="num">06 · 天文星野</span><span class="enter">↗</span><h3>二十八宿 · 全天星图</h3><p>盖图式全天圆图：真实亮星、主要星座、黄道与天赤道、四象、二十八宿、十二次、当前地平圈以及日月七政同图观察。</p><div class="tags"><span>二十八宿</span><span>全天星图</span><span>日月七政</span></div></article><article class="panel pl-card future"><span class="num">NEXT · 天文仪器</span><span class="enter">待建</span><h3>浑天仪 · 日晷</h3><p>下一项进入天文仪器盘：把赤道圈、黄道圈、子午圈、地平圈与日影时刻关系做成可交互仪器模型。</p><div class="tags"><span>浑天仪</span><span>日晷</span><span>天球坐标</span></div></article>`;
  const c = pane.querySelector('[data-pl="xiutian"]');
  if (c) c.onclick = () => xapOpen();
};
const plClose_v43_xap = plClose;
plClose = function () {
  try {
    xapStop();
  } catch (_) {}
  return plClose_v43_xap();
};
