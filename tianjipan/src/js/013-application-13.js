/* ===== v46 · 浑天仪 / 日晷 / 太阳时工作台完整增强 ===== */
HTD.ref = HTD.ref || "celestial";
HTD.anaHour = HTD.anaHour == null ? 12 : HTD.anaHour;
Object.assign(HTD.layers, {
  grid: HTD.layers.grid == null ? 1 : HTD.layers.grid,
  terms: HTD.layers.terms == null ? 1 : HTD.layers.terms,
  season: HTD.layers.season == null ? 1 : HTD.layers.season,
});
if (!HTD_LAYERS.some((x) => x[0] === "grid"))
  HTD_LAYERS.splice(
    5,
    0,
    ["grid", "天球坐标网", "赤经大圆与赤纬平行圈"],
    ["terms", "二十四节气刻度", "在黄道圈上标出二十四节气"],
    ["season", "二至二分轨迹", "春秋分、夏至、冬至太阳日周弧"],
  );
const HTD_MAJOR_TERMS = new Set(["春分", "立夏", "夏至", "立秋", "秋分", "立冬", "冬至", "立春"]);
function htdMinNorm(m) {
  m %= 1440;
  if (m < 0) m += 1440;
  return m;
}
function htdMinDiff(a, b) {
  let d = a - b;
  while (d > 720) d -= 1440;
  while (d < -720) d += 1440;
  return d;
}
function htdMinFmt(m) {
  if (m == null || !isFinite(m)) return "—";
  m = htdMinNorm(m);
  let h = Math.floor(m / 60),
    mi = Math.round(m - h * 60);
  if (mi >= 60) {
    h = (h + 1) % 24;
    mi = 0;
  }
  return f2(h) + ":" + f2(mi);
}
function htdDurFmt(m) {
  if (!isFinite(m)) return "—";
  m = Math.max(0, Math.round(m));
  return Math.floor(m / 60) + "h " + f2(m % 60) + "m";
}
function htdRaFmt(h) {
  h = ((h % 24) + 24) % 24;
  const H = Math.floor(h),
    M = Math.floor((h - H) * 60),
    S = Math.round(((h - H) * 60 - M) * 60);
  return `${f2(H)}h ${f2(M)}m ${f2(S)}s`;
}
function htdDegFmt(d) {
  return `${d >= 0 ? "+" : ""}${d.toFixed(2)}°`;
}
function htdAstrAt(c, lon, lat) {
  const jd = jdFromGreg(c.y, c.m, c.d, c.h, c.mi || 0, 0) - 8 / 24,
    sun = smSun(jd),
    aa = smAltAz(sun.eq.ra, sun.eq.dec, jd, lon, lat),
    lst = (((smGMST(jd) + lon / 15) % 24) + 24) % 24,
    ha = smN180((lst - sun.eq.ra) * 15),
    ast = (((12 + ha / 15) % 24) + 24) % 24;
  return { c, lon, lat, jd, sun, aa, lst, ha, ast };
}
function htdSolarEvents(D) {
  const std = D.c.h * 60 + (D.c.mi || 0),
    lonCorr = 4 * (D.lon - 120),
    mean = htdMinNorm(std + lonCorr),
    app = htdMinNorm(D.ast * 60),
    eot = htdMinDiff(app, mean),
    noon = htdMinNorm(720 - lonCorr - eot),
    phi = D.lat * D2R,
    dec = D.sun.eq.dec * D2R;
  const ev = (h0) => {
    const q =
      (Math.sin(h0 * D2R) - Math.sin(phi) * Math.sin(dec)) / (Math.cos(phi) * Math.cos(dec));
    if (q > 1) return { rise: null, set: null, len: 0, polar: "night" };
    if (q < -1) return { rise: null, set: null, len: 1440, polar: "day" };
    const H = Math.acos(Math.max(-1, Math.min(1, q))) / D2R;
    return {
      rise: htdMinNorm(noon - 4 * H),
      set: htdMinNorm(noon + 4 * H),
      len: 8 * H,
      polar: null,
    };
  };
  const sun = ev(-0.833),
    civil = ev(-6),
    naut = ev(-12),
    astro = ev(-18),
    a = D.aa.alt;
  let state =
    a >= 0
      ? "昼间"
      : a >= -6
        ? "民用曙暮光"
        : a >= -12
          ? "航海曙暮光"
          : a >= -18
            ? "天文曙暮光"
            : "夜间";
  return { std, lonCorr, mean, app, eot, noon, sun, civil, naut, astro, state };
}
const htdData_v45 = htdData;
htdData = function () {
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
  const D = htdData_v45();
  D.sol = htdSolarEvents(D);
  D.zodiac = [
    "白羊",
    "金牛",
    "双子",
    "巨蟹",
    "狮子",
    "处女",
    "天秤",
    "天蝎",
    "射手",
    "摩羯",
    "水瓶",
    "双鱼",
  ][Math.floor(htdNorm(D.sun.lon) / 30) % 12];
  D.term = TERMS[Math.floor(htdNorm(D.sun.lon) / 15) % 24];
  const nextI = (Math.floor(htdNorm(D.sun.lon) / 15) + 1) % 24,
    nextLon = nextI * 15,
    delta = htdNorm(nextLon - D.sun.lon);
  D.nextTerm = { name: TERMS[nextI], days: delta / 0.985647 };
  return D;
};
function htdRotZ(v, deg) {
  const a = deg * D2R,
    c = Math.cos(a),
    s = Math.sin(a);
  return [v[0] * c - v[1] * s, v[0] * s + v[1] * c, v[2]];
}
function htdBasisAt(lat, lst) {
  const th = lst * 15 * D2R,
    ph = lat * D2R;
  return {
    zen: [Math.cos(ph) * Math.cos(th), Math.cos(ph) * Math.sin(th), Math.sin(ph)],
    east: [-Math.sin(th), Math.cos(th), 0],
    north: [-Math.sin(ph) * Math.cos(th), -Math.sin(ph) * Math.sin(th), Math.cos(ph)],
  };
}
function htdArmillarySVG46(D) {
  const ground = HTD.ref === "ground",
    B = ground ? htdBasisAt(D.lat, 0) : htdBasisAt(D.lat, D.lst),
    skyRot = ground ? -D.lst * 15 : 0,
    eps = D.sun.eps * D2R;
  const sky = (v) => (ground ? htdRotZ(v, skyRot) : v),
    proj = (v) => htdV(...v),
    path = (pts, front, asSky = true) => {
      let d = "",
        open = false;
      for (let v of pts) {
        if (asSky) v = sky(v);
        const q = proj(v),
          ok = front ? q.z >= 0 : q.z < 0;
        if (ok) {
          d += (open ? "L" : "M") + q.x.toFixed(2) + " " + q.y.toFixed(2) + " ";
          open = true;
        } else open = false;
      }
      return d;
    },
    ring = (pts, cls, asSky = true) =>
      `<path d="${path(pts, false, asSky)}" class="htd-ring ${cls} back"/><path d="${path(pts, true, asSky)}" class="htd-ring ${cls}"/>`,
    rr = (fn, n = 240) => {
      const a = [];
      for (let i = 0; i <= n; i++) {
        const t = (i / n) * Math.PI * 2;
        a.push(fn(t));
      }
      return a;
    },
    eq = rr((t) => [Math.cos(t), Math.sin(t), 0]),
    ecl = rr((t) => [Math.cos(t), Math.sin(t) * Math.cos(eps), Math.sin(t) * Math.sin(eps)]),
    hor = rr((t) => [
      B.east[0] * Math.cos(t) + B.north[0] * Math.sin(t),
      B.east[1] * Math.cos(t) + B.north[1] * Math.sin(t),
      B.east[2] * Math.cos(t) + B.north[2] * Math.sin(t),
    ]),
    mer = rr((t) => [
      B.zen[0] * Math.cos(t) + B.north[0] * Math.sin(t),
      B.zen[1] * Math.cos(t) + B.north[1] * Math.sin(t),
      B.zen[2] * Math.cos(t) + B.north[2] * Math.sin(t),
    ]),
    par = (d) =>
      rr((t) => {
        const z = Math.sin(d * D2R),
          r = Math.cos(d * D2R);
        return [r * Math.cos(t), r * Math.sin(t), z];
      });
  let s = `<circle cx="${HTD.panX}" cy="${HTD.panY}" r="${(286 * HTD.zoom).toFixed(1)}" class="htd-sphere"/>`;
  if (HTD.layers.grid) {
    for (let dec of [-60, -30, 30, 60]) {
      const p = par(dec);
      s += `<path d="${path(p, true, true)}" class="htd-gridline"/><path d="${path(p, false, true)}" class="htd-gridline"/>`;
    }
    for (let ra = 0; ra < 180; ra += 30) {
      const p = rr((t) => [
        Math.cos(t) * Math.cos(ra * D2R),
        Math.cos(t) * Math.sin(ra * D2R),
        Math.sin(t),
      ]);
      s += `<path d="${path(p, true, true)}" class="htd-gridline"/><path d="${path(p, false, true)}" class="htd-gridline"/>`;
    }
  }
  if (HTD.layers.trop) {
    s += ring(par(23.4393), "htd-tropic") + ring(par(-23.4393), "htd-tropic");
  }
  if (HTD.layers.eq) s += ring(eq, "htd-eq");
  if (HTD.layers.ecl) s += ring(ecl, "htd-ecl");
  if (HTD.layers.hor) s += ring(hor, "htd-hor", false);
  if (HTD.layers.mer) s += ring(mer, "htd-mer", false);
  const dayArc = (dec, cls) => {
    const pts = par(dec);
    let up = "",
      dn = "",
      ou = false,
      od = false;
    for (let v of pts) {
      const vv = sky(v),
        q = proj(v),
        vis = v[0] * B.zen[0] + v[1] * B.zen[1] + v[2] * B.zen[2] > 0;
      if (vis) {
        up += (ou ? "L" : "M") + q.x.toFixed(2) + " " + q.y.toFixed(2) + " ";
        ou = true;
        od = false;
      } else {
        dn += (od ? "L" : "M") + q.x.toFixed(2) + " " + q.y.toFixed(2) + " ";
        od = true;
        ou = false;
      }
    }
    return `<path d="${dn}" class="htd-day-down ${cls}"/><path d="${up}" class="${cls || "htd-day-up"}"/>`;
  };
  if (HTD.layers.season) {
    s +=
      dayArc(0, "htd-season-eq") +
      dayArc(23.4393, "htd-season-summer") +
      dayArc(-23.4393, "htd-season-winter");
  }
  if (HTD.layers.day) s += dayArc(D.sun.eq.dec, "htd-day-up");
  if (HTD.layers.terms && HTD.layers.ecl) {
    for (let i = 0; i < 24; i++) {
      const lon = i * 15,
        E = smEqFromEcl(lon, 0, D.sun.eps),
        v = htdVec(E.ra * 15, E.dec),
        v2 = v.map((x) => x * 1.045),
        v3 = v.map((x) => x * 1.095),
        p = proj(sky(v)),
        q = proj(sky(v2)),
        r = proj(sky(v3)),
        nm = TERMS[i],
        maj = HTD_MAJOR_TERMS.has(nm);
      s += `<line x1="${p.x.toFixed(1)}" y1="${p.y.toFixed(1)}" x2="${q.x.toFixed(1)}" y2="${q.y.toFixed(1)}" class="htd-term-tick"/><text x="${r.x.toFixed(1)}" y="${(r.y + 3).toFixed(1)}" text-anchor="middle" class="htd-term-label${maj ? " major" : ""}">${nm}</text>`;
    }
  }
  const O = proj([0, 0, 0]);
  s += `<circle cx="${O.x}" cy="${O.y}" r="${(27 * HTD.zoom).toFixed(1)}" class="htd-earth"/>`;
  if (HTD.layers.axis) {
    const n = proj(sky([0, 0, 1.18])),
      p = proj(sky([0, 0, -1.18]));
    s += `<line x1="${p.x}" y1="${p.y}" x2="${n.x}" y2="${n.y}" class="htd-axis"/>`;
  }
  const sv = sky(htdVec(D.sun.eq.ra * 15, D.sun.eq.dec)),
    sp = proj(sv),
    zp = proj(B.zen),
    ncp = proj(sky([0, 0, 1])),
    scp = proj(sky([0, 0, -1]));
  s += `<g class="htd-pt" data-htd="sun"><circle cx="${sp.x}" cy="${sp.y}" r="8" class="htd-sun"/></g><circle cx="${zp.x}" cy="${zp.y}" r="4" class="htd-zen"/><circle cx="${ncp.x}" cy="${ncp.y}" r="4" class="htd-pole"/><circle cx="${scp.x}" cy="${scp.y}" r="4" class="htd-pole"/>`;
  const lab = (v, txt, cls = "", asSky = true) => {
    if (asSky) v = sky(v);
    const q = proj(v);
    return `<text x="${q.x.toFixed(1)}" y="${(q.y - 7).toFixed(1)}" text-anchor="middle" class="htd-lab ${cls}">${txt}</text>`;
  };
  if (HTD.layers.labels) {
    s +=
      lab(htdVec(D.sun.eq.ra * 15, D.sun.eq.dec), "太阳", "key") +
      lab(B.zen, "天顶", "", false) +
      lab([0, 0, 1], "北天极", "red") +
      lab([0, 0, -1], "南天极", "red");
    const E = B.east,
      N = B.north,
      S = [-N[0], -N[1], -N[2]],
      W = [-E[0], -E[1], -E[2]];
    s +=
      lab(N, "北", "", false) +
      lab(E, "东", "", false) +
      lab(S, "南", "", false) +
      lab(W, "西", "", false);
    for (const [lon, nm] of [
      [0, "春分点"],
      [90, "夏至点"],
      [180, "秋分点"],
      [270, "冬至点"],
    ]) {
      const E2 = smEqFromEcl(lon, 0, D.sun.eps);
      s += lab(htdVec(E2.ra * 15, E2.dec), nm, "key");
    }
  }
  return s;
}
htdArmillarySVG = htdArmillarySVG46;
function htdDialSVG46(D) {
  const C = 170,
    R = 145,
    phi = Math.abs(D.lat) * D2R,
    sgn = D.lat >= 0 ? 1 : -1;
  let s = `<circle cx="${C}" cy="${C}" r="${R}" class="sd-ring"/><line x1="${C}" y1="${C - R + 8}" x2="${C}" y2="${C + R - 8}" class="sd-noon"/>`;
  for (let h = 4; h <= 20; h++) {
    const H = (h - 12) * 15 * D2R,
      dx = Math.sin(phi) * Math.sin(H),
      dy = sgn * Math.cos(H),
      L = Math.hypot(dx, dy) || 1,
      ux = dx / L,
      uy = dy / L,
      r1 = 18,
      r2 = 132,
      maj = h % 3 === 0 || h === 12;
    s += `<line x1="${(C + ux * r1).toFixed(1)}" y1="${(C - uy * r1).toFixed(1)}" x2="${(C + ux * r2).toFixed(1)}" y2="${(C - uy * r2).toFixed(1)}" class="sd-hour${maj ? " major" : ""}"/><text x="${(C + ux * 141).toFixed(1)}" y="${(C - uy * 141 + 3).toFixed(1)}" text-anchor="middle" class="sd-t${h === 12 ? " key" : ""}">${h}</text>`;
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
    gnH = 70,
    gTipN = sgn * Math.cos(phi) * gnH,
    gTipZ = Math.sin(phi) * gnH;
  let shadow = "太阳在地平线下",
    shadowLen = null;
  if (Math.sin(a) > 0.001) {
    const sx = Math.cos(a) * Math.sin(az),
      sy = Math.cos(a) * Math.cos(az),
      sz = Math.sin(a),
      t = gTipZ / sz,
      px = -t * sx,
      py = gTipN - t * sy,
      rr = Math.hypot(px, py),
      cl = Math.min(128, rr),
      ux = rr ? px / rr : 0,
      uy = rr ? py / rr : 1,
      ex = C + ux * cl,
      ey = C - uy * cl;
    shadowLen = rr;
    s += `<line x1="${C}" y1="${C}" x2="${ex.toFixed(1)}" y2="${ey.toFixed(1)}" class="sd-shadow"/><circle cx="${ex.toFixed(1)}" cy="${ey.toFixed(1)}" r="4" class="sd-gnomon"/>`;
    shadow = rr > 128 ? "日影超出盘面" : "当前日影";
  }
  const sunR = 136,
    spx = C + sunR * Math.sin(az),
    spy = C - sunR * Math.cos(az);
  s += `<circle cx="${spx.toFixed(1)}" cy="${spy.toFixed(1)}" r="5" class="sd-sun"/><circle cx="${C}" cy="${C}" r="5" class="sd-gnomon"/><line x1="${C}" y1="${C}" x2="${C}" y2="${(C - sgn * 58 * Math.cos(phi)).toFixed(1)}" class="sd-gnomon-line"/><text x="${C}" y="${C + 17}" text-anchor="middle" class="sd-t">晷针倾角 ${Math.abs(D.lat).toFixed(1)}°</text><text x="14" y="322" class="sd-note">${shadow}${shadowLen != null ? " · 相对影长 " + shadowLen.toFixed(1) : ""}</text>`;
  return s;
}
htdDialSVG = htdDialSVG46;
function htdEqDialSVG46(D) {
  const C = 170,
    R = 140,
    H = (D.sol.app / 60 - 12) * 15,
    ang = H * D2R;
  let s = `<circle cx="${C}" cy="${C}" r="${R}" class="sd-ring"/>`;
  for (let h = 0; h < 24; h++) {
    const a = (h - 12) * 15 * D2R,
      x = C + Math.sin(a) * R,
      y = C - Math.cos(a) * R,
      x2 = C + Math.sin(a) * (h % 3 === 0 ? 114 : 125),
      y2 = C - Math.cos(a) * (h % 3 === 0 ? 114 : 125);
    s += `<line x1="${x2.toFixed(1)}" y1="${y2.toFixed(1)}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" class="sd-hour${h % 3 === 0 ? " major" : ""}"/>`;
    if (h % 2 === 0)
      s += `<text x="${(C + Math.sin(a) * 102).toFixed(1)}" y="${(C - Math.cos(a) * 102 + 3).toFixed(1)}" text-anchor="middle" class="sd-t">${h}</text>`;
  }
  const px = C + Math.sin(ang) * 112,
    py = C - Math.cos(ang) * 112,
    face = D.sun.eq.dec >= 0 ? "北面受光" : "南面受光";
  s += `<line x1="${C}" y1="${C}" x2="${px.toFixed(1)}" y2="${py.toFixed(1)}" class="sd-eq-pointer"/><circle cx="${C}" cy="${C}" r="5" class="sd-gnomon"/><text x="${C}" y="${C + 4}" text-anchor="middle" class="sd-t key">轴</text><text x="${C}" y="25" text-anchor="middle" class="sd-t key">12</text><text x="${C}" y="${C + 28}" text-anchor="middle" class="sd-face">${face}</text><text x="${C}" y="${C + 42}" text-anchor="middle" class="sd-note">太阳赤纬 ${htdDegFmt(D.sun.eq.dec)}</text>`;
  return s;
}
htdEqDialSVG = htdEqDialSVG46;
function htdAnalemmaData(D) {
  const y = D.c.y,
    pts = [];
  for (let day = 1; day <= 366; day += 4) {
    const dt = new Date(Date.UTC(y, 0, day, 12, 0, 0));
    if (dt.getUTCFullYear() !== y) break;
    const c = { y, m: dt.getUTCMonth() + 1, d: dt.getUTCDate(), h: 12, mi: 0, s: 0 },
      A = htdAstrAt(c, D.lon, D.lat),
      mean = 720 + 4 * (D.lon - 120),
      eot = htdMinDiff(A.ast * 60, mean);
    pts.push({ c, eot, dec: A.sun.eq.dec });
  }
  return pts;
}
function htdAnalemmaSVG(D) {
  const W = 600,
    H = 360,
    L = 58,
    R = 22,
    T = 24,
    B = 42,
    x0 = L,
    y0 = T,
    w = W - L - R,
    h = H - T - B,
    x = (e) => x0 + ((e + 20) / 40) * w,
    y = (d) => y0 + ((26 - d) / 52) * h,
    pts = htdAnalemmaData(D);
  let s = `<line x1="${x(0)}" y1="${y0}" x2="${x(0)}" y2="${y0 + h}" class="ana-axis"/><line x1="${x0}" y1="${y(0)}" x2="${x0 + w}" y2="${y(0)}" class="ana-axis"/>`;
  for (let e = -20; e <= 20; e += 10)
    s += `<line x1="${x(e)}" y1="${y0}" x2="${x(e)}" y2="${y0 + h}" class="ana-grid"/><text x="${x(e)}" y="${H - 16}" text-anchor="middle" class="ana-lab">${e > 0 ? "+" : ""}${e}m</text>`;
  for (let d = -20; d <= 20; d += 10)
    s += `<line x1="${x0}" y1="${y(d)}" x2="${x0 + w}" y2="${y(d)}" class="ana-grid"/><text x="${L - 8}" y="${y(d) + 3}" text-anchor="end" class="ana-lab">${d > 0 ? "+" : ""}${d}°</text>`;
  s += `<path d="${pts.map((p, i) => (i ? "L" : "M") + x(p.eot).toFixed(1) + " " + y(p.dec).toFixed(1)).join(" ")}" class="ana-curve"/>`;
  try {
    const ts = calTerms(D.c.y).filter((t) => HTD_MAJOR_TERMS.has(t.name));
    for (const t of ts) {
      const c = { y: t.bj.y || D.c.y, m: t.bj.m, d: t.bj.d, h: 12, mi: 0, s: 0 },
        A = htdAstrAt(c, D.lon, D.lat),
        e = htdMinDiff(A.ast * 60, 720 + 4 * (D.lon - 120)),
        xx = x(e),
        yy = y(A.sun.eq.dec);
      s += `<circle cx="${xx.toFixed(1)}" cy="${yy.toFixed(1)}" r="3" class="ana-dot"/><text x="${(xx + 5).toFixed(1)}" y="${(yy - 5).toFixed(1)}" class="ana-term">${t.name}</text>`;
    }
  } catch (_) {}
  const curE = D.sol.eot,
    curX = x(curE),
    curY = y(D.sun.eq.dec);
  s += `<circle cx="${curX.toFixed(1)}" cy="${curY.toFixed(1)}" r="5" class="ana-now"/><text x="${(curX + 7).toFixed(1)}" y="${(curY + 4).toFixed(1)}" class="ana-term">当前</text><text x="${W / 2}" y="${H - 2}" text-anchor="middle" class="ana-lab">均时差 / 视太阳时 − 地方平太阳时（分钟）</text><text transform="translate(13 ${H / 2}) rotate(-90)" text-anchor="middle" class="ana-lab">太阳赤纬</text>`;
  return s;
}
function htdTimeChainHTML(D) {
  const S = D.sol,
    sg = (v) => `${v >= 0 ? "+" : ""}${v.toFixed(1)} 分`;
  return `<div class="htd-lower-head"><b>标准时 → 地方太阳时</b><small>统一按页面 UTC+8 / 东经120° 标准子午线换算</small></div><div class="htd-timechain"><div class="htd-timebox"><small>北京时间 / 页面标准时</small><b>${htdMinFmt(S.std)}</b><em>UTC+8</em></div><div class="htd-arrow">→</div><div class="htd-timebox"><small>地方平太阳时</small><b>${htdMinFmt(S.mean)}</b><em>经度修正 ${sg(S.lonCorr)}</em></div><div class="htd-arrow">→</div><div class="htd-timebox"><small>地方视太阳时</small><b>${htdMinFmt(S.app)}</b><em>均时差 ${sg(S.eot)}</em></div></div><table class="htd-daytable" style="margin-top:10px"><tbody><tr><th>太阳中天</th><td>${htdMinFmt(S.noon)}</td><th>昼长</th><td>${htdDurFmt(S.sun.len)}</td></tr><tr><th>日出</th><td>${htdMinFmt(S.sun.rise)}</td><th>日落</th><td>${htdMinFmt(S.sun.set)}</td></tr><tr><th>民用曙光</th><td>${htdMinFmt(S.civil.rise)}</td><th>民用暮光</th><td>${htdMinFmt(S.civil.set)}</td></tr><tr><th>航海曙光</th><td>${htdMinFmt(S.naut.rise)}</td><th>航海暮光</th><td>${htdMinFmt(S.naut.set)}</td></tr><tr><th>天文曙光</th><td>${htdMinFmt(S.astro.rise)}</td><th>天文暮光</th><td>${htdMinFmt(S.astro.set)}</td></tr></tbody></table>`;
}
function htdInfo46(D) {
  const box = $("#htdInfo");
  if (!box) return;
  const xiu = (() => {
      try {
        return xiuOf(D.sun.lon, D.c.y).n + "宿";
      } catch (_) {
        return "—";
      }
    })(),
    S = D.sol,
    stateCls = D.aa.alt >= 0 ? "day" : D.aa.alt >= -18 ? "twilight" : "night";
  box.innerHTML = `<div class="htd-info-inner"><h4>此刻天象读数</h4><div class="htd-facts-wrap"><div class="htd-facts"><span>时刻</span><b>${htdFmt(D.c).replace("T", " ")}</b><span>地点</span><b>${D.lon.toFixed(2)}°E · ${D.lat.toFixed(2)}°N</b><span>昼夜状态</span><b><i class="htd-status ${stateCls}">${S.state}</i></b><span>太阳高度</span><b>${htdDegFmt(D.aa.alt)}</b><span>太阳方位</span><b>${D.aa.az.toFixed(2)}°</b><span>太阳时角</span><b>${htdDegFmt(D.ha)}</b><span>所在宿</span><b>${xiu}</b><span>黄道宫</span><b>${D.zodiac}</b><span>当前节气段</span><b>${D.term}</b><span>下一节气</span><b>${D.nextTerm.name} · 约 ${D.nextTerm.days.toFixed(1)} 天</b></div></div><div class="htd-coord3"><div class="htd-coord"><h5>赤道坐标</h5><p>赤经 α <b>${htdRaFmt(D.sun.eq.ra)}</b></p><p>赤纬 δ <b>${htdDegFmt(D.sun.eq.dec)}</b></p><p>地方恒星时 <b>${D.lst.toFixed(3)} h</b></p></div><div class="htd-coord"><h5>黄道坐标</h5><p>黄经 λ <b>${D.sun.lon.toFixed(2)}°</b></p><p>黄纬 β <b>0.00°</b></p><p>黄赤交角 ε <b>${D.sun.eps.toFixed(3)}°</b></p></div><div class="htd-coord"><h5>地平坐标</h5><p>方位角 A <b>${D.aa.az.toFixed(2)}°</b></p><p>高度角 h <b>${htdDegFmt(D.aa.alt)}</b></p><p>参考系 <b>${HTD.ref === "ground" ? "地面跟随" : "天球跟随"}</b></p></div></div><div class="htd-card"><h5>太阳时</h5><p>地方平太阳时 <b>${htdMinFmt(S.mean)}</b>；视太阳时 <b>${htdMinFmt(S.app)}</b>。</p><p>经度修正 <b>${S.lonCorr >= 0 ? "+" : ""}${S.lonCorr.toFixed(1)} 分</b>；均时差 <b>${S.eot >= 0 ? "+" : ""}${S.eot.toFixed(1)} 分</b>。</p></div><div class="htd-card"><h5>昼夜</h5><p>日出 <b>${htdMinFmt(S.sun.rise)}</b> · 中天 <b>${htdMinFmt(S.noon)}</b> · 日落 <b>${htdMinFmt(S.sun.set)}</b></p><p>昼长 <b>${htdDurFmt(S.sun.len)}</b> · 夜长 <b>${htdDurFmt(1440 - S.sun.len)}</b></p></div><div class="htd-card"><h5>轨迹图例</h5><div class="htd-season-key"><span class="now">今日</span><span class="eq">二分</span><span class="su">夏至</span><span class="wi">冬至</span></div><p>季节轨迹用于比较太阳在不同赤纬下的日周高度变化；真实日期轨迹会随地点纬度与时刻改变。</p></div></div>`;
}
htdInfo = htdInfo46;
const htdRender_v45 = htdRender;
htdRender = function (sound = false) {
  const D = htdData(),
    svg = $("#htdSvg");
  if (!svg) return;
  svg.innerHTML = htdArmillarySVG(D);
  const a = $("#htdDial"),
    e = $("#htdEqDial"),
    an = $("#htdAnalemma"),
    tc = $("#htdTimeChain");
  if (a) a.innerHTML = htdDialSVG(D);
  if (e) e.innerHTML = htdEqDialSVG(D);
  if (an) an.innerHTML = htdAnalemmaSVG(D);
  if (tc) tc.innerHTML = htdTimeChainHTML(D);
  htdInfo(D);
  const dt = $("#htdDt");
  if (dt && document.activeElement !== dt) dt.value = htdFmt(D.c);
  const lo = $("#htdLon"),
    la = $("#htdLat");
  if (lo && document.activeElement !== lo) lo.value = D.lon.toFixed(3);
  if (la && document.activeElement !== la) la.value = D.lat.toFixed(3);
  const z = $("#htdZoom");
  if (z) z.textContent = Math.round(HTD.zoom * 100) + "%";
  const rc = $("#htdRefCel"),
    rg = $("#htdRefGround");
  if (rc) rc.classList.toggle("on", HTD.ref === "celestial");
  if (rg) rg.classList.toggle("on", HTD.ref === "ground");
  if (sound)
    try {
      if (STU.sfx) stuSfxTick(0.24, false, 1, 0.32);
    } catch (_) {}
};
function htdGoTerm(name) {
  try {
    const t = calTerms((HTD.civ || htdNow()).y).find((x) => x.name === name);
    if (t) {
      HTD.civ = {
        y: t.bj.y || (HTD.civ || htdNow()).y,
        m: t.bj.m,
        d: t.bj.d,
        h: t.bj.h,
        mi: t.bj.mi,
        s: 0,
      };
      htdRender(true);
      return;
    }
  } catch (_) {}
  const map = { 春分: [3, 20], 夏至: [6, 21], 秋分: [9, 22], 冬至: [12, 21] },
    q = map[name];
  if (q) {
    const c = HTD.civ || htdNow();
    HTD.civ = { y: c.y, m: q[0], d: q[1], h: 12, mi: 0, s: 0 };
    htdRender(true);
  }
}
function htdOpen46() {
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
  pane.innerHTML = `<div class="htd-shell" id="htdShell"><div class="htd-top"><button class="gbtn sm" id="htdBack">← 盘库</button><div class="htd-title"><b>浑天仪 · 日晷 · 太阳时工作台</b><small>天球坐标 · 二十四节气 · 太阳轨迹 · 地方太阳时 · 地平/赤道日晷 · Analemma</small></div><button class="gbtn sm" id="htdAstro">打开天象详页</button><button class="gbtn sm" id="htdSky">打开实时星空</button><button class="gbtn sm" id="htdFs">全屏</button></div><div class="htd-grid"><aside class="panel htd-side"><h4>时空输入</h4><div class="htd-group"><label>日期时间<input type="datetime-local" id="htdDt" value="${htdFmt(HTD.civ)}"></label><div class="htd-btnrow"><button class="gbtn sm" id="htdNow">此刻</button><button class="gbtn sm" id="htdPrev">←</button><button class="gbtn sm" id="htdNext">→</button></div><label>演示步长<select id="htdStep"><option value="min10"${HTD.step === "min10" ? " selected" : ""}>10 分钟</option><option value="hour"${HTD.step === "hour" ? " selected" : ""}>1 小时</option><option value="day"${HTD.step === "day" ? " selected" : ""}>1 天</option></select></label><button class="gbtn sm" id="htdPlay" style="width:100%">▶ 日影演示</button></div><div class="htd-group"><h4>二至二分对比</h4><div class="htd-quick"><button class="gbtn sm" data-htdterm="春分">春分</button><button class="gbtn sm" data-htdterm="夏至">夏至</button><button class="gbtn sm" data-htdterm="秋分">秋分</button><button class="gbtn sm" data-htdterm="冬至">冬至</button></div></div><div class="htd-group"><h4>观测地点</h4><label>经度（东正西负）<input type="number" id="htdLon" min="-180" max="180" step="0.001" value="${HTD.lon}"></label><label>纬度（北正南负）<input type="number" id="htdLat" min="-89.9" max="89.9" step="0.001" value="${HTD.lat}"></label><button class="gbtn sm" id="htdLoc" style="width:100%">读取当前页面地点</button></div><div class="htd-group"><h4>浑天仪层</h4>${HTD_LAYERS.map(([k, n, d]) => `<label class="htd-layer"><input type="checkbox" data-htdl="${k}"${HTD.layers[k] ? " checked" : ""}><span>${n}<small>${d}</small></span></label>`).join("")}</div></aside><section class="htd-main"><div class="htd-viewbar"><button class="gbtn sm on" id="htdRotate">旋转仪器</button><button class="gbtn sm" id="htdPan">查看平移</button><span class="htd-refbar"><button class="gbtn sm" id="htdRefCel">天球跟随</button><button class="gbtn sm" id="htdRefGround">地面跟随</button></span><span class="hint">天球跟随：天球固定、地平圈转；地面跟随：地平圈固定、天球转</span><button class="gbtn sm" id="htdFit">↙↗ 适应</button><span class="htd-z"><button class="gbtn sm" id="htdZm">−</button><span id="htdZoom">100%</span><button class="gbtn sm" id="htdZp">＋</button></span></div><div class="htd-frame rotate" id="htdFrame"><svg id="htdSvg" viewBox="-420 -420 840 840" role="img" aria-label="浑天仪三维示意"></svg></div><div class="htd-season-key"><span class="now">今日太阳轨迹</span><span class="eq">春秋分轨迹</span><span class="su">夏至轨迹</span><span class="wi">冬至轨迹</span></div><div class="htd-instruments"><div class="htd-inst"><div class="htd-inst-head"><b>地平日晷</b><small>真实小时线 · 晷针倾角=当地纬度 · 当前日影</small></div><svg id="htdDial" viewBox="0 0 340 340" role="img" aria-label="地平日晷"></svg></div><div class="htd-inst"><div class="htd-inst-head"><b>赤道日晷</b><small>24 时等分 · 当前视太阳时 · 受光盘面</small></div><svg id="htdEqDial" viewBox="0 0 340 340" role="img" aria-label="赤道日晷"></svg></div></div><div class="htd-lower"><div class="htd-lower-card"><div class="htd-lower-head"><b>全年太阳 Analemma</b><small>同一地点 · 每日 12:00 · 均时差 × 赤纬形成 8 字轨迹</small></div><svg id="htdAnalemma" viewBox="0 0 600 360" role="img" aria-label="太阳全年8字轨迹"></svg></div><div class="htd-lower-card" id="htdTimeChain"></div></div></section><aside class="panel htd-info" id="htdInfo"></aside></div><div class="panel htd-bottom"><b>计算口径：</b>本页按现代天球几何组织浑天仪：赤道坐标、黄道坐标与地平坐标是同一太阳位置的三种表达。页面时间按 UTC+8 作为标准时，经度修正到地方平太阳时，再由太阳赤经/恒星时反推出均时差与地方视太阳时。日出、暮光等以当前太阳赤纬作几何近似；地平日晷小时线按水平日晷公式绘制，晷针指向天极。Analemma 用同一年每日中午的均时差与太阳赤纬构成。此页用于天文几何与仪器原理研究，不代替高精度天文台星历。</div></div>`;
  htdBind46();
  htdRender(false);
}
htdOpen = htdOpen46;
function htdBind46() {
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
  const stepMin = () => (HTD.step === "min10" ? 10 : HTD.step === "day" ? 1440 : 60);
  $("#htdPrev").onclick = () => htdShift(-stepMin());
  $("#htdNext").onclick = () => htdShift(stepMin());
  $("#htdStep").onchange = (e) => (HTD.step = e.target.value);
  $("#htdPlay").onclick = htdPlayToggle;
  $("#htdDt").onchange = (e) => {
    const c = htdParse(e.target.value);
    if (c) {
      HTD.civ = c;
      htdRender(true);
    }
  };
  $$("[data-htdterm]", pane).forEach((b) => (b.onclick = () => htdGoTerm(b.dataset.htdterm)));
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
  $("#htdRefCel").onclick = () => {
    HTD.ref = "celestial";
    htdRender(false);
  };
  $("#htdRefGround").onclick = () => {
    HTD.ref = "ground";
    htdRender(false);
  };
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
    htdDragRAF46 = 0;
  const htdDragPaint46 = () => {
    if (htdDragRAF46) return;
    htdDragRAF46 = requestAnimationFrame(() => {
      htdDragRAF46 = 0;
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
    htdDragPaint46();
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
  if (!window.__HTD_FS46) {
    window.__HTD_FS46 = 1;
    document.addEventListener("fullscreenchange", () => {
      const b = $("#htdFs");
      if (b) b.textContent = document.fullscreenElement ? "退出全屏" : "全屏";
    });
  }
}
htdBind = htdBind46;
try {
  const g = NAV_G.find((x) => x.g === "盘库");
  if (g && g.it && g.it[0])
    g.it[0][3] +=
      " 太阳时 地方平太阳时 均时差 日出 日落 曙暮光 Analemma 太阳8字轨迹 二十四节气 天球坐标 赤道坐标 黄道坐标 地平坐标";
} catch (_) {}
