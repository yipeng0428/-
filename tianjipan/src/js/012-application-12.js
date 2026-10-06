/* ===== v45 · 盘库 07：浑天仪 · 日晷 ===== */
const HTD = {
  civ: null,
  lon: null,
  lat: null,
  play: null,
  step: "hour",
  gesture: "rotate",
  yaw: -28,
  pitch: 18,
  zoom: 1,
  panX: 0,
  panY: 0,
  layers: { eq: 1, ecl: 1, hor: 1, mer: 1, trop: 1, axis: 1, day: 1, labels: 1 },
  sel: null,
};
const HTD_LAYERS = [
  ["eq", "天赤道", "地球赤道平面投影到天球"],
  ["ecl", "黄道", "太阳周年视运动的基准大圆"],
  ["hor", "地平圈", "随观测地与恒星时改变"],
  ["mer", "子午圈", "北点—天顶—南点的大圆"],
  ["trop", "南北回归圈", "太阳赤纬的周年极限"],
  ["axis", "天轴", "南北天极与地球自转轴"],
  ["day", "太阳日周弧", "按当前太阳赤纬画全天路径"],
  ["labels", "标注", "天极、天顶、方位与圈名"],
];
const htdNorm = (a) => ((a % 360) + 360) % 360;
const htdNow = () => {
  const n = nowBJ();
  return { y: n.y, m: n.m, d: n.d, h: n.h, mi: n.mi || 0, s: 0 };
};
const htdFmt = (c) => `${c.y}-${f2(c.m)}-${f2(c.d)}T${f2(c.h)}:${f2(c.mi || 0)}`;
function htdParse(s) {
  if (!s) return null;
  const m = s.match(/^(\d{4})-(\d\d)-(\d\d)T(\d\d):(\d\d)/);
  return m ? { y: +m[1], m: +m[2], d: +m[3], h: +m[4], mi: +m[5], s: 0 } : null;
}
function htdReadLoc() {
  let lon = parseFloat($("#lon") && $("#lon").value),
    lat = parseFloat($("#lat") && $("#lat").value);
  if (!isFinite(lon)) lon = 117.8;
  if (!isFinite(lat)) lat = 24.5;
  return { lon, lat };
}
function htdData() {
  const c = HTD.civ || htdNow(),
    lon = isFinite(HTD.lon) ? HTD.lon : htdReadLoc().lon,
    lat = isFinite(HTD.lat) ? HTD.lat : htdReadLoc().lat,
    jd = jdFromGreg(c.y, c.m, c.d, c.h, c.mi || 0, 0) - 8 / 24,
    sun = smSun(jd),
    aa = smAltAz(sun.eq.ra, sun.eq.dec, jd, lon, lat),
    lst = (((smGMST(jd) + lon / 15) % 24) + 24) % 24,
    ha = smN180((lst - sun.eq.ra) * 15),
    ast = (((12 + ha / 15) % 24) + 24) % 24,
    rs = smRiseSet("sun", c.y, c.m, c.d, lon, lat),
    phi = Math.abs(lat) * SM_D2R,
    sgn = lat >= 0 ? 1 : -1;
  return { c, lon, lat, jd, sun, aa, lst, ha, ast, rs, phi, sgn };
}
function htdV(x, y, z) {
  const ya = HTD.yaw * D2R,
    pi = HTD.pitch * D2R,
    cy = Math.cos(ya),
    sy = Math.sin(ya),
    cp = Math.cos(pi),
    sp = Math.sin(pi),
    x1 = x * cy - y * sy,
    y1 = x * sy + y * cy,
    z1 = z,
    y2 = y1 * cp - z1 * sp,
    z2 = y1 * sp + z1 * cp,
    S = 286 * HTD.zoom;
  return { x: x1 * S + HTD.panX, y: -y2 * S + HTD.panY, z: z2 };
}
const htdVec = (raDeg, decDeg) => {
  const r = raDeg * D2R,
    d = decDeg * D2R,
    cd = Math.cos(d);
  return [cd * Math.cos(r), cd * Math.sin(r), Math.sin(d)];
};
function htdPath(points, front = true) {
  let d = "",
    open = false,
    last = null;
  for (const p of points) {
    const q = htdV(p[0], p[1], p[2]),
      ok = front ? q.z >= 0 : q.z < 0;
    if (ok) {
      d += (open ? "L" : "M") + q.x.toFixed(2) + " " + q.y.toFixed(2) + " ";
      open = true;
    } else open = false;
    last = q;
  }
  return d;
}
function htdRingPoints(fn, n = 180) {
  const a = [];
  for (let i = 0; i <= n; i++) {
    const t = (i / n) * Math.PI * 2;
    a.push(fn(t));
  }
  return a;
}
function htdRing(points, cls) {
  return `<path d="${htdPath(points, false)}" class="htd-ring ${cls} back"/><path d="${htdPath(points, true)}" class="htd-ring ${cls}"/>`;
}
function htdBasis(D) {
  const th = D.lst * 15 * D2R,
    ph = D.lat * D2R,
    zen = [Math.cos(ph) * Math.cos(th), Math.cos(ph) * Math.sin(th), Math.sin(ph)],
    east = [-Math.sin(th), Math.cos(th), 0],
    north = [-Math.sin(ph) * Math.cos(th), -Math.sin(ph) * Math.sin(th), Math.cos(ph)];
  return { zen, east, north };
}
function htdDaySegments(dec, basis) {
  const up = [],
    dn = [],
    r = Math.cos(dec * D2R),
    z = Math.sin(dec * D2R);
  let pu = "",
    pd = "",
    ou = false,
    od = false;
  for (let i = 0; i <= 240; i++) {
    const a = (i / 240) * Math.PI * 2,
      v = [r * Math.cos(a), r * Math.sin(a), z],
      q = htdV(...v),
      vis = v[0] * basis.zen[0] + v[1] * basis.zen[1] + v[2] * basis.zen[2] > 0;
    if (vis) {
      pu += (ou ? "L" : "M") + q.x.toFixed(2) + " " + q.y.toFixed(2) + " ";
      ou = true;
      od = false;
    } else {
      pd += (od ? "L" : "M") + q.x.toFixed(2) + " " + q.y.toFixed(2) + " ";
      od = true;
      ou = false;
    }
  }
  return `<path d="${pd}" class="htd-day-down"/><path d="${pu}" class="htd-day-up"/>`;
}
function htdLabel(v, txt, cls = "") {
  const q = htdV(...v);
  return `<text x="${q.x.toFixed(1)}" y="${(q.y - 7).toFixed(1)}" text-anchor="middle" class="htd-lab ${cls}">${txt}</text>`;
}
function htdArmillarySVG(D) {
  const B = htdBasis(D),
    eps = D.sun.eps * D2R,
    eq = htdRingPoints((t) => [Math.cos(t), Math.sin(t), 0]),
    ecl = htdRingPoints((t) => [
      Math.cos(t),
      Math.sin(t) * Math.cos(eps),
      Math.sin(t) * Math.sin(eps),
    ]),
    hor = htdRingPoints((t) => [
      B.east[0] * Math.cos(t) + B.north[0] * Math.sin(t),
      B.east[1] * Math.cos(t) + B.north[1] * Math.sin(t),
      B.east[2] * Math.cos(t) + B.north[2] * Math.sin(t),
    ]),
    mer = htdRingPoints((t) => [
      B.zen[0] * Math.cos(t) + B.north[0] * Math.sin(t),
      B.zen[1] * Math.cos(t) + B.north[1] * Math.sin(t),
      B.zen[2] * Math.cos(t) + B.north[2] * Math.sin(t),
    ]),
    tp = (d) =>
      htdRingPoints((t) => {
        const z = Math.sin(d * D2R),
          r = Math.cos(d * D2R);
        return [r * Math.cos(t), r * Math.sin(t), z];
      });
  let s = `<circle cx="${HTD.panX}" cy="${HTD.panY}" r="${(286 * HTD.zoom).toFixed(1)}" class="htd-sphere"/>`;
  if (HTD.layers.trop) {
    s += htdRing(tp(23.4393), "htd-tropic") + htdRing(tp(-23.4393), "htd-tropic");
  }
  if (HTD.layers.eq) s += htdRing(eq, "htd-eq");
  if (HTD.layers.ecl) s += htdRing(ecl, "htd-ecl");
  if (HTD.layers.hor) s += htdRing(hor, "htd-hor");
  if (HTD.layers.mer) s += htdRing(mer, "htd-mer");
  if (HTD.layers.day) s += htdDaySegments(D.sun.eq.dec, B);
  const O = htdV(0, 0, 0);
  s += `<circle cx="${O.x}" cy="${O.y}" r="${(27 * HTD.zoom).toFixed(1)}" class="htd-earth"/>`;
  if (HTD.layers.axis) {
    const n = htdV(0, 0, 1.18),
      p = htdV(0, 0, -1.18);
    s += `<line x1="${p.x}" y1="${p.y}" x2="${n.x}" y2="${n.y}" class="htd-axis"/>`;
  }
  const sv = htdVec(D.sun.eq.ra * 15, D.sun.eq.dec),
    sp = htdV(...sv),
    zp = htdV(...B.zen),
    ncp = htdV(0, 0, 1),
    scp = htdV(0, 0, -1);
  s += `<g class="htd-pt" data-htd="sun"><circle cx="${sp.x}" cy="${sp.y}" r="8" class="htd-sun"/></g><circle cx="${zp.x}" cy="${zp.y}" r="4" class="htd-zen"/><circle cx="${ncp.x}" cy="${ncp.y}" r="4" class="htd-pole"/><circle cx="${scp.x}" cy="${scp.y}" r="4" class="htd-pole"/>`;
  if (HTD.layers.labels) {
    s +=
      htdLabel(sv, "太阳", "key") +
      htdLabel(B.zen, "天顶", "") +
      htdLabel([0, 0, 1], "北天极", "red") +
      htdLabel([0, 0, -1], "南天极", "red");
    const E = B.east,
      N = B.north,
      S = [-N[0], -N[1], -N[2]],
      W = [-E[0], -E[1], -E[2]];
    s += htdLabel(N, "北") + htdLabel(E, "东") + htdLabel(S, "南") + htdLabel(W, "西");
  }
  return s;
}
function htdDialSVG(D) {
  const C = 170,
    R = 145,
    lat = D.lat,
    abs = Math.max(0.01, Math.abs(lat)) * D2R;
  let s = `<circle cx="${C}" cy="${C}" r="${R}" class="sd-ring"/><line x1="${C}" y1="${C - R + 10}" x2="${C}" y2="${C + R - 10}" class="sd-noon"/>`;
  for (let h = 5; h <= 19; h++) {
    const H = (h - 12) * 15 * D2R,
      x = Math.sin(H),
      y = Math.tan(abs) * Math.cos(H) * (lat >= 0 ? 1 : -1),
      L = Math.hypot(x, y) || 1,
      ux = x / L,
      uy = y / L,
      r1 = 22,
      r2 = 132,
      x1 = C + ux * r1,
      y1 = C - uy * r1,
      x2 = C + ux * r2,
      y2 = C - uy * r2,
      maj = h % 3 === 0 || h === 12;
    s += `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" class="sd-hour${maj ? " major" : ""}"/><text x="${(C + ux * 141).toFixed(1)}" y="${(C - uy * 141 + 3).toFixed(1)}" text-anchor="middle" class="sd-t${h === 12 ? " key" : ""}">${h}</text>`;
  }
  [
    ["北", 0, -154],
    ["东", 154, 0],
    ["南", 0, 160],
    ["西", -154, 0],
  ].forEach(
    (q) =>
      (s += `<text x="${C + q[1]}" y="${C + q[2] + 4}" text-anchor="middle" class="sd-t key">${q[0]}</text>`),
  );
  const a = D.aa.alt * D2R,
    az = D.aa.az * D2R,
    sx = Math.cos(a) * Math.sin(az),
    sy = Math.cos(a) * Math.cos(az),
    sz = Math.sin(a),
    gl = 72,
    gx = 0,
    gy = D.sgn * Math.cos(D.phi) * gl,
    gz = Math.sin(D.phi) * gl;
  let shadow = "太阳在地平线下";
  if (sz > 0.001) {
    const t = gz / sz,
      px = gx - t * sx,
      py = gy - t * sy,
      rr = Math.hypot(px, py),
      cl = Math.min(128, rr),
      ux = rr ? px / rr : 0,
      uy = rr ? py / rr : 1,
      ex = C + ux * cl,
      ey = C - uy * cl;
    s += `<line x1="${C}" y1="${C}" x2="${ex.toFixed(1)}" y2="${ey.toFixed(1)}" class="sd-shadow"/><circle cx="${ex.toFixed(1)}" cy="${ey.toFixed(1)}" r="4" class="sd-gnomon"/>`;
    shadow = rr > 128 ? "影长超过盘面" : "当前日影";
  }
  const sr = 136,
    spx = C + sr * Math.sin(az),
    spy = C - sr * Math.cos(az);
  s += `<circle cx="${spx.toFixed(1)}" cy="${spy.toFixed(1)}" r="5" class="sd-sun"/><circle cx="${C}" cy="${C}" r="5" class="sd-gnomon"/><text x="${C}" y="${C + 16}" text-anchor="middle" class="sd-t">晷针根</text><text x="16" y="324" class="sd-t">${shadow}</text>`;
  return s;
}
function htdEqDialSVG(D) {
  const C = 170,
    R = 140,
    H = (D.ast - 12) * 15,
    ang = H * D2R;
  let s = `<circle cx="${C}" cy="${C}" r="${R}" class="sd-ring"/>`;
  for (let h = 0; h < 24; h++) {
    const a = (h - 12) * 15 * D2R,
      x = C + Math.sin(a) * R,
      y = C - Math.cos(a) * R,
      x2 = C + Math.sin(a) * (h % 3 === 0 ? 115 : 125),
      y2 = C - Math.cos(a) * (h % 3 === 0 ? 115 : 125);
    s += `<line x1="${x2.toFixed(1)}" y1="${y2.toFixed(1)}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" class="sd-hour${h % 3 === 0 ? " major" : ""}"/>`;
    if (h % 2 === 0)
      s += `<text x="${(C + Math.sin(a) * 103).toFixed(1)}" y="${(C - Math.cos(a) * 103 + 3).toFixed(1)}" text-anchor="middle" class="sd-t">${h}</text>`;
  }
  const px = C + Math.sin(ang) * 112,
    py = C - Math.cos(ang) * 112;
  s += `<line x1="${C}" y1="${C}" x2="${px.toFixed(1)}" y2="${py.toFixed(1)}" class="sd-eq-pointer"/><circle cx="${C}" cy="${C}" r="5" class="sd-gnomon"/><text x="${C}" y="${C + 4}" text-anchor="middle" class="sd-t key">轴</text><text x="${C}" y="24" text-anchor="middle" class="sd-t key">12</text>`;
  return s;
}
function htdInfo(D) {
  const box = $("#htdInfo");
  if (!box) return;
  const xiu = (() => {
      try {
        return xiuOf(D.sun.lon, D.c.y).n + "宿";
      } catch (_) {
        return "—";
      }
    })(),
    term = TERMS[Math.floor(htdNorm(D.sun.lon) / 15) % 24],
    astH = Math.floor(D.ast),
    astM = Math.round((D.ast - astH) * 60) % 60,
    ha = `${D.ha >= 0 ? "+" : ""}${D.ha.toFixed(1)}°`;
  box.innerHTML = `<div class="htd-info-inner"><h4>仪器读数</h4><div><div class="htd-facts"><span>时刻</span><b>${htdFmt(D.c).replace("T", " ")}</b><span>地点</span><b>${D.lon.toFixed(2)}°E · ${D.lat.toFixed(2)}°N</b><span>恒星时</span><b>${D.lst.toFixed(3)} h</b><span>太阳赤经</span><b>${D.sun.eq.ra.toFixed(3)} h</b><span>太阳赤纬</span><b>${D.sun.eq.dec.toFixed(2)}°</b><span>太阳高度</span><b>${D.aa.alt.toFixed(2)}°</b><span>太阳方位</span><b>${D.aa.az.toFixed(2)}°</b><span>太阳时角</span><b>${ha}</b><span>视太阳时</span><b>${f2(astH)}:${f2(astM)}</b><span>日出 / 日落</span><b>${D.rs.rise} / ${D.rs.set}</b></div></div><div class="htd-card"><h5>黄道与时令</h5><p>太阳黄经 <b>${D.sun.lon.toFixed(2)}°</b> · ${term} · ${xiu}</p><p>黄赤交角 ${D.sun.eps.toFixed(3)}°。赤道圈与黄道圈的夹角就是这一数值。</p></div><div class="htd-card"><h5>浑天仪怎么读</h5><p><b>天赤道</b>固定于地球赤道延伸面；<b>黄道</b>相对它倾斜约 23.44°；<b>地平圈</b>和<b>子午圈</b>由观测地点与当下恒星时决定。</p><p>金色日周弧按当前太阳赤纬画出，实线段位于当前地平线上方，灰虚线在地平线下。</p></div><div class="htd-card"><h5>日晷</h5><p>左下为地平日晷：晷针按本地纬度指向天极，日影位置由当前太阳高度和方位直接计算。</p><p>右下为赤道日晷：时刻线每 15° 等分，可以直接看到视太阳时在 24 小时圈上的位置。</p></div></div>`;
}
function htdRender(sound = false) {
  const D = htdData(),
    svg = $("#htdSvg");
  if (!svg) return;
  svg.innerHTML = htdArmillarySVG(D);
  const a = $("#htdDial"),
    e = $("#htdEqDial");
  if (a) a.innerHTML = htdDialSVG(D);
  if (e) e.innerHTML = htdEqDialSVG(D);
  htdInfo(D);
  const dt = $("#htdDt");
  if (dt && document.activeElement !== dt) dt.value = htdFmt(D.c);
  const lo = $("#htdLon"),
    la = $("#htdLat");
  if (lo && document.activeElement !== lo) lo.value = D.lon.toFixed(3);
  if (la && document.activeElement !== la) la.value = D.lat.toFixed(3);
  const z = $("#htdZoom");
  if (z) z.textContent = Math.round(HTD.zoom * 100) + "%";
  if (sound)
    try {
      if (STU.sfx) stuSfxTick(0.24, false, 1, 0.32);
    } catch (_) {}
}
function htdShift(mins) {
  const c = HTD.civ || htdNow(),
    j = jdFromGreg(c.y, c.m, c.d, c.h, c.mi || 0, 0) + mins / 1440,
    f = fromJD(j);
  HTD.civ = { y: f.y, m: f.m, d: f.d, h: f.h, mi: f.mi, s: 0 };
  htdRender(true);
}
function htdPlayToggle() {
  const b = $("#htdPlay");
  if (HTD.play) {
    clearInterval(HTD.play);
    HTD.play = null;
    if (b) {
      b.classList.remove("on");
      b.textContent = "▶ 日影演示";
    }
    return;
  }
  if (b) {
    b.classList.add("on");
    b.textContent = "■ 停止演示";
  }
  HTD.play = setInterval(
    () => htdShift(HTD.step === "min10" ? 10 : HTD.step === "day" ? 1440 : 60),
    760,
  );
}
function htdStop() {
  if (HTD.play) {
    clearInterval(HTD.play);
    HTD.play = null;
  }
}
function htdFit() {
  HTD.zoom = 1;
  HTD.panX = 0;
  HTD.panY = 0;
  HTD.yaw = -28;
  HTD.pitch = 18;
  htdRender(false);
}
function htdOpen() {
  const pane = $("#pane-studio");
  if (!pane) return;
  if (STU.active) studioLeave();
  try {
    xapStop();
    typStop();
    qtpStop();
    lrpStop();
  } catch (_) {}
  htdStop();
  PANLIB.mode = "huntian";
  document.body.classList.add("studio-mode");
  delete pane.dataset.ui;
  pane.dataset.built = "1";
  if (!HTD.civ) HTD.civ = htdNow();
  if (
    typeof HTD.lon !== "number" ||
    !Number.isFinite(HTD.lon) ||
    typeof HTD.lat !== "number" ||
    !Number.isFinite(HTD.lat)
  ) {
    const L = htdReadLoc();
    HTD.lon = L.lon;
    HTD.lat = L.lat;
  }
  pane.innerHTML = `<div class="htd-shell" id="htdShell"><div class="htd-top"><button class="gbtn sm" id="htdBack">← 盘库</button><div class="htd-title"><b>浑天仪 · 日晷</b><small>天轴 · 赤道 · 黄道 · 子午 · 地平 · 日周弧 · 视太阳时 · 日影</small></div><button class="gbtn sm" id="htdAstro">打开天象详页</button><button class="gbtn sm" id="htdSky">打开实时星空</button><button class="gbtn sm" id="htdFs">全屏</button></div><div class="htd-grid"><aside class="panel htd-side"><h4>时空输入</h4><div class="htd-group"><label>日期时间<input type="datetime-local" id="htdDt" value="${htdFmt(HTD.civ)}"></label><div class="htd-btnrow"><button class="gbtn sm" id="htdNow">此刻</button><button class="gbtn sm" id="htdPrev">←</button><button class="gbtn sm" id="htdNext">→</button></div><label>演示步长<select id="htdStep"><option value="min10"${HTD.step === "min10" ? " selected" : ""}>10 分钟</option><option value="hour"${HTD.step === "hour" ? " selected" : ""}>1 小时</option><option value="day"${HTD.step === "day" ? " selected" : ""}>1 天</option></select></label><button class="gbtn sm" id="htdPlay" style="width:100%">▶ 日影演示</button></div><div class="htd-group"><h4>观测地点</h4><label>经度（东正西负）<input type="number" id="htdLon" min="-180" max="180" step="0.001" value="${HTD.lon}"></label><label>纬度（北正南负）<input type="number" id="htdLat" min="-89.9" max="89.9" step="0.001" value="${HTD.lat}"></label><button class="gbtn sm" id="htdLoc" style="width:100%">读取当前页面地点</button></div><div class="htd-group"><h4>浑天仪层</h4>${HTD_LAYERS.map(([k, n, d]) => `<label class="htd-layer"><input type="checkbox" data-htdl="${k}"${HTD.layers[k] ? " checked" : ""}><span>${n}<small>${d}</small></span></label>`).join("")}</div></aside><section class="htd-main"><div class="htd-viewbar"><button class="gbtn sm on" id="htdRotate">旋转仪器</button><button class="gbtn sm" id="htdPan">查看平移</button><span class="hint">拖动旋转 / 平移 · 滚轮缩放 · 时间变化会带动地平圈、太阳与日影</span><button class="gbtn sm" id="htdFit">↙↗ 适应</button><span class="htd-z"><button class="gbtn sm" id="htdZm">−</button><span id="htdZoom">100%</span><button class="gbtn sm" id="htdZp">＋</button></span></div><div class="htd-frame rotate" id="htdFrame"><svg id="htdSvg" viewBox="-420 -420 840 840" role="img" aria-label="浑天仪三维示意"></svg></div><div class="htd-instruments"><div class="htd-inst"><div class="htd-inst-head"><b>地平日晷</b><small>晷针指向天极 · 日影按高度方位实时计算</small></div><svg id="htdDial" viewBox="0 0 340 340" role="img" aria-label="地平日晷"></svg></div><div class="htd-inst"><div class="htd-inst-head"><b>赤道日晷</b><small>24 时等分 · 红针为当前视太阳时</small></div><svg id="htdEqDial" viewBox="0 0 340 340" role="img" aria-label="赤道日晷"></svg></div></div></section><aside class="panel htd-info" id="htdInfo"></aside></div><div class="panel htd-bottom"><b>读图口径：</b>浑天仪部分按现代天球坐标重建：天赤道、黄道、地平圈、子午圈和天轴属于几何坐标圈；太阳位置使用页面现有低精度太阳算法。地平日晷的晷针按当地纬度对准天极，日影由太阳地平坐标直接投影到水平面；赤道日晷以 15° 对应一太阳时小时。这里展示的是天文几何与仪器原理，不把古代浑仪各历史型号的所有实体环件混为同一种结构。</div></div>`;
  htdBind();
  htdRender(false);
}
function htdBind() {
  const pane = $("#pane-studio"),
    svg = $("#htdSvg"),
    frame = $("#htdFrame");
  if (!pane || !svg) return;
  $("#htdBack").onclick = () => {
    htdStop();
    plHub();
  };
  $("#htdNow").onclick = () => {
    HTD.civ = htdNow();
    htdRender(true);
  };
  $("#htdPrev").onclick = () =>
    htdShift(HTD.step === "min10" ? -10 : HTD.step === "day" ? -1440 : -60);
  $("#htdNext").onclick = () =>
    htdShift(HTD.step === "min10" ? 10 : HTD.step === "day" ? 1440 : 60);
  $("#htdStep").onchange = (e) => (HTD.step = e.target.value);
  $("#htdPlay").onclick = htdPlayToggle;
  $("#htdDt").onchange = (e) => {
    const c = htdParse(e.target.value);
    if (c) {
      HTD.civ = c;
      htdRender(true);
    }
  };
  const locChange = () => {
    HTD.lon = Math.max(-180, Math.min(180, +$("#htdLon").value || 0));
    HTD.lat = Math.max(-89.9, Math.min(89.9, +$("#htdLat").value || 0));
    htdRender(true);
  };
  $("#htdLon").onchange = locChange;
  $("#htdLat").onchange = locChange;
  $("#htdLoc").onclick = () => {
    const L = htdReadLoc();
    HTD.lon = L.lon;
    HTD.lat = L.lat;
    htdRender(true);
  };
  $$("[data-htdl]", pane).forEach(
    (c) =>
      (c.onchange = () => {
        HTD.layers[c.dataset.htdl] = c.checked ? 1 : 0;
        htdRender(false);
      }),
  );
  const mode = (m) => {
    HTD.gesture = m;
    frame.classList.toggle("pan", m === "pan");
    $("#htdRotate").classList.toggle("on", m === "rotate");
    $("#htdPan").classList.toggle("on", m === "pan");
  };
  $("#htdRotate").onclick = () => mode("rotate");
  $("#htdPan").onclick = () => mode("pan");
  $("#htdFit").onclick = htdFit;
  const zm = (k) => {
    HTD.zoom = Math.max(0.45, Math.min(2.4, HTD.zoom * k));
    htdRender(false);
  };
  $("#htdZm").onclick = () => zm(0.86);
  $("#htdZp").onclick = () => zm(1.16);
  svg.addEventListener(
    "wheel",
    (e) => {
      e.preventDefault();
      zm(e.deltaY < 0 ? 1.08 : 0.92);
    },
    { passive: false },
  );
  let drag = null,
    htdDragRAF = 0;
  const htdDragPaint = () => {
    if (htdDragRAF) return;
    htdDragRAF = requestAnimationFrame(() => {
      htdDragRAF = 0;
      htdRender(false);
    });
  };
  svg.addEventListener("pointerdown", (e) => {
    if (e.button > 0) return;
    drag = {
      id: e.pointerId,
      x: e.clientX,
      y: e.clientY,
      yaw: HTD.yaw,
      pitch: HTD.pitch,
      px: HTD.panX,
      py: HTD.panY,
    };
    try {
      svg.setPointerCapture(e.pointerId);
    } catch (_) {}
    frame.classList.add("grab");
  });
  svg.addEventListener("pointermove", (e) => {
    if (!drag || drag.id !== e.pointerId) return;
    const dx = e.clientX - drag.x,
      dy = e.clientY - drag.y;
    if (HTD.gesture === "rotate") {
      HTD.yaw = drag.yaw + dx * 0.35;
      HTD.pitch = Math.max(-80, Math.min(80, drag.pitch - dy * 0.28));
    } else {
      HTD.panX = drag.px + dx;
      HTD.panY = drag.py + dy;
    }
    htdDragPaint();
  });
  const up = (e) => {
    if (!drag || drag.id !== e.pointerId) return;
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
  $("#htdAstro").onclick = () => {
    htdStop();
    selectTab("astro", true);
  };
  $("#htdSky").onclick = () => {
    htdStop();
    selectTab("xingkong", true);
  };
  $("#htdFs").onclick = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await $("#htdShell").requestFullscreen();
    } catch (e) {
      toast("当前浏览器不允许全屏");
    }
  };
  document.addEventListener("fullscreenchange", () => {
    const b = $("#htdFs");
    if (b) b.textContent = document.fullscreenElement ? "退出全屏" : "全屏";
  });
}
/* 盘库入口：正式加入第 07 盘。 */
const plHub_v44_htd = plHub;
plHub = function () {
  htdStop();
  plHub_v44_htd();
  const pane = $("#pane-studio");
  if (!pane) return;
  const cnt = pane.querySelector(".pl-count b");
  if (cnt) cnt.textContent = "07";
  const f = pane.querySelector(".pl-card.future");
  if (f)
    f.outerHTML = `<article class="panel pl-card" data-pl="huntian"><span class="num">07 · 天文仪器</span><span class="enter">↗</span><h3>浑天仪 · 日晷</h3><p>把天轴、天赤道、黄道、子午圈、地平圈与太阳日周弧组成可旋转浑天仪，并联动地平日晷和赤道日晷实时显示日影。</p><div class="tags"><span>浑天仪</span><span>地平日晷</span><span>视太阳时</span></div></article><article class="panel pl-card future"><span class="num">NEXT · 易学数理</span><span class="enter">待建</span><h3>十二消息卦 · 阴阳消长圆图</h3><p>下一项进入易学数理圆图：复、临、泰、大壮、夬、乾、姤、遁、否、观、剥、坤按月令环布，表现阴阳爻的生长消退。</p><div class="tags"><span>十二消息卦</span><span>月令</span><span>阴阳消长</span></div></article>`;
  const c = pane.querySelector('[data-pl="huntian"]');
  if (c) c.onclick = () => htdOpen();
};
const plClose_v44_htd = plClose;
plClose = function () {
  try {
    htdStop();
  } catch (_) {}
  return plClose_v44_htd();
};
try {
  const g = NAV_G.find((x) => x.g === "盘库");
  if (g && g.it && g.it[0]) {
    g.it[0][2] =
      "天机巨盘、罗经三盘、大六壬天地盘、奇门转盘式盘、太乙式盘、二十八宿全天星图、浑天仪日晷及后续独立盘";
    g.it[0][3] +=
      " 浑天仪 日晷 天轴 天赤道 黄道 地平圈 子午圈 天极 视太阳时 日影 晷针 赤道日晷 天文仪器";
  }
} catch (e) {}
