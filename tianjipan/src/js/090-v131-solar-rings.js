(function () {
  "use strict";
  if (typeof ORR3D !== "object") return;
  const BUILD = "v134 · 2026-10-05 00:58 +08:00";
  const TERMS = [
    ["春分", 0],
    ["清明", 15],
    ["谷雨", 30],
    ["立夏", 45],
    ["小满", 60],
    ["芒种", 75],
    ["夏至", 90],
    ["小暑", 105],
    ["大暑", 120],
    ["立秋", 135],
    ["处暑", 150],
    ["白露", 165],
    ["秋分", 180],
    ["寒露", 195],
    ["霜降", 210],
    ["立冬", 225],
    ["小雪", 240],
    ["大雪", 255],
    ["冬至", 270],
    ["小寒", 285],
    ["大寒", 300],
    ["立春", 315],
    ["雨水", 330],
    ["惊蛰", 345],
  ];
  const SOLAR_MONTHS = [
    ["寅月", 315],
    ["卯月", 345],
    ["辰月", 15],
    ["巳月", 45],
    ["午月", 75],
    ["未月", 105],
    ["申月", 135],
    ["酉月", 165],
    ["戌月", 195],
    ["亥月", 225],
    ["子月", 255],
    ["丑月", 285],
  ];
  const SEASONS = [
    ["春", 0, 90],
    ["夏", 90, 180],
    ["秋", 180, 270],
    ["冬", 270, 360],
  ];
  const GREG_MONTHS = "一月 二月 三月 四月 五月 六月 七月 八月 九月 十月 十一月 十二月".split(" ");
  const EARTH_RING_DEFAULTS = {
    terms: true,
    solarMonths: true,
    gregMonths: true,
    dayRing: true,
    seasons: false,
    xiuRing: false,
    yqLayer: false,
  };
  ORR3D.v131 = Object.assign({}, EARTH_RING_DEFAULTS, ORR3D.v131 || {});
  function norm(a) {
    return ((a % 360) + 360) % 360;
  }
  function sunLonAt(jd) {
    try {
      return asPlanets(jd)[0].lon;
    } catch (e) {
      try {
        return sunLon(jd);
      } catch (_) {
        return 0;
      }
    }
  }
  function earthLonAt(jd) {
    return norm(sunLonAt(jd) + 180);
  }
  function yearOfJD(jd) {
    try {
      return fromJD(jd + 8 / 24).y || 2000;
    } catch (_) {
      return 2000;
    }
  }
  function ringPt(lon, r) {
    const a = lon * D2R;
    return { x: r * Math.cos(a), y: r * Math.sin(a), z: 0 };
  }
  function projPt(lon, r) {
    const p = ringPt(lon, r);
    return orr3dProj(p.x, p.y, p.z);
  }
  function arcMid(a, b) {
    const d = (b - a + 360) % 360;
    return norm(a + d / 2);
  }
  function gregMonthData(jd) {
    const y = yearOfJD(jd),
      starts = [];
    for (let m = 1; m <= 12; m++)
      starts.push({ m, earth: norm(sunLonAt(jdFromGreg(y, m, 1, 12) - 8 / 24) + 180) });
    const janNext = norm(sunLonAt(jdFromGreg(y + 1, 1, 1, 12) - 8 / 24) + 180);
    const out = [];
    for (let i = 0; i < 12; i++) {
      const a = starts[i].earth,
        b = i === 11 ? janNext : starts[i + 1].earth;
      out.push({ name: GREG_MONTHS[i], start: a, end: b, center: arcMid(a, b) });
    }
    return out;
  }
  function gregDayTickData(jd) {
    const y = yearOfJD(jd),
      out = [];
    let idx = 1;
    for (let m = 1; m <= 12; m++) {
      const max = new Date(y, m, 0).getDate();
      for (let d = 1; d <= max; d++, idx++) {
        const earth = norm(sunLonAt(jdFromGreg(y, m, d, 12) - 8 / 24) + 180);
        out.push({
          idx,
          m,
          d,
          earth,
          monthStart: d === 1,
          major: d === 1 || d === 15,
          mid5: d % 5 === 0,
        });
      }
    }
    return out;
  }
  function dayOfYearFromJD(jd) {
    const d = fromJD(jd + 8 / 24);
    const s = new Date(d.y, 0, 1),
      n = new Date(d.y, d.m - 1, d.d);
    return Math.floor((n - s) / 86400000) + 1;
  }
  function curTerm(lon) {
    let best = TERMS[0],
      dmin = 999;
    TERMS.forEach((t) => {
      const d = Math.abs(((lon - t[1] + 540) % 360) - 180);
      if (d < dmin) {
        dmin = d;
        best = t;
      }
    });
    return best;
  }
  function solarMonthBySun(lon) {
    const i = Math.floor(norm(lon - 315) / 30);
    return SOLAR_MONTHS[(i + 12) % 12][0];
  }
  function qiAt(jd, lon) {
    try {
      const d = fromJD(jd + 8 / 24),
        gy = d.m <= 2 && lon < 315 ? d.y - 1 : d.y,
        idx = ganzhiIdx((((gy - 4) % 10) + 10) % 10, (((gy - 4) % 12) + 12) % 12);
      return wuyunLiuqi(idx, lon);
    } catch (_) {
      return { step: 0, guest: ["—"] };
    }
  }
  function fillBand3D(r0, r1, color, alpha) {
    const c = ORR3D.ctx;
    if (!c) return;
    const outer = [],
      inner = [];
    for (let a = 0; a <= 360; a += 3) outer.push(projPt(a, r1));
    for (let a = 360; a >= 0; a -= 3) inner.push(projPt(a, r0));
    c.save();
    c.globalAlpha = alpha == null ? 0.12 : alpha;
    c.fillStyle = color;
    c.beginPath();
    outer.concat(inner).forEach((p, i) => {
      if (i === 0) c.moveTo(p.x, p.y);
      else c.lineTo(p.x, p.y);
    });
    c.closePath();
    c.fill();
    c.restore();
  }
  function strokeCircle3D(r, color, w, alpha) {
    const pts = [];
    for (let a = 0; a <= 360; a += 3) pts.push(ringPt(a, r));
    orr3dPath(pts, color, w || 1, null, alpha == null ? 0.75 : alpha);
  }
  function drawTick3D(lon, r0, r1, color, w, alpha) {
    const c = ORR3D.ctx,
      p0 = projPt(lon, r0),
      p1 = projPt(lon, r1);
    c.save();
    c.strokeStyle = color;
    c.lineWidth = w || 1;
    c.globalAlpha = alpha == null ? 0.9 : alpha;
    c.beginPath();
    c.moveTo(p0.x, p0.y);
    c.lineTo(p1.x, p1.y);
    c.stroke();
    c.restore();
    return p1;
  }
  function placeLabels3D(items) {
    const c = ORR3D.ctx;
    if (!c) return;
    const placed = [];
    c.save();
    items.forEach((it) => {
      let pos = null;
      const radii = (it.radii && it.radii.length ? it.radii : [it.r || 320]).slice();
      for (let i = 0; i < radii.length; i++) {
        const p = projPt(it.lon, radii[i]);
        let ok = true;
        for (const q of placed) {
          const dx = p.x - q.x,
            dy = p.y - q.y;
          if (Math.hypot(dx, dy) < (it.minDist || 24)) {
            ok = false;
            break;
          }
        }
        if (ok) {
          pos = { x: p.x, y: p.y, r: radii[i] };
          break;
        }
      }
      if (!pos && it.optional) return;
      if (!pos) {
        const p = projPt(it.lon, radii[0]);
        pos = { x: p.x, y: p.y, r: radii[0] };
      }
      placed.push(pos);
      c.globalAlpha = it.alpha == null ? 0.96 : it.alpha;
      c.fillStyle = it.color || "#e6d6b4";
      c.font = it.font || "11px serif";
      c.textAlign = "center";
      c.textBaseline = "middle";
      c.lineWidth = 3;
      c.strokeStyle = "rgba(8,10,20,.38)";
      const ang = it.lon * D2R;
      const ox = Math.cos(ang) * 0,
        oy = Math.sin(ang) * 0;
      c.strokeText(it.text, pos.x + ox, pos.y + oy);
      c.fillText(it.text, pos.x + ox, pos.y + oy);
    });
    c.restore();
  }
  function drawEarthLayers3D() {
    if (!ORR3D.ctx || ORR3D.mode !== "3d") return;
    const show = ORR3D.v131 || EARTH_RING_DEFAULTS;
    const year = yearOfJD(ORR3D.jd),
      sunLon = sunLonAt(ORR3D.jd),
      earthLon = earthLonAt(ORR3D.jd);
    const c = ORR3D.ctx;
    // ring tracks
    if (show.seasons) {
      SEASONS.forEach((s, i) => {
        fillBand3D(238, 252, ["#557748", "#8c5c44", "#8a7340", "#48678a"][i], 0.08);
      });
    }
    strokeCircle3D(218, "rgba(193,162,92,.55)", 0.9, 0.9); // zodiac / season base
    strokeCircle3D(244, "rgba(196,170,126,.55)", 0.9, 0.88); // terms
    strokeCircle3D(270, "rgba(92,170,160,.45)", 0.85, 0.82); // solar months
    strokeCircle3D(296, "rgba(106,136,196,.38)", 0.8, 0.78); // xiu
    strokeCircle3D(322, "rgba(197,140,96,.32)", 0.8, 0.72); // greg months
    strokeCircle3D(340, "rgba(180,180,180,.22)", 0.7, 0.6); // outer cap

    // season texts by Earth position (opposite sun longitude)
    const labelItems = [];
    if (show.seasons) {
      SEASONS.forEach((s, i) => {
        const lon = norm((s[1] + s[2]) / 2 + 180);
        labelItems.push({
          lon,
          text: s[0],
          radii: [212, 206],
          font: "bold 11.5px serif",
          color: ["#79bb7d", "#dfa67b", "#d9bc73", "#83a7d6"][i],
          minDist: 24,
        });
      });
    }
    if (show.terms) {
      TERMS.forEach((t, i) => {
        const lon = norm(t[1] + 180);
        drawTick3D(
          lon,
          238,
          i % 2 === 0 ? 251 : 248,
          i % 3 === 0 ? "rgba(232,194,108,.95)" : "rgba(203,183,150,.74)",
          i % 3 === 0 ? 1.2 : 0.8,
          i % 3 === 0 ? 0.95 : 0.72,
        );
        labelItems.push({
          lon,
          text: t[0],
          radii: i % 3 === 0 ? [262, 266, 258] : [254, 258, 250],
          font: i % 3 === 0 ? "11px serif" : "9px serif",
          color: i % 3 === 0 ? "#f0d48c" : "rgba(220,205,178,.84)",
          minDist: i % 3 === 0 ? 30 : 26,
          optional: i % 3 !== 0,
        });
      });
    }
    if (show.solarMonths) {
      SOLAR_MONTHS.forEach((m, i) => {
        const lon = norm(m[1] + 180);
        drawTick3D(lon, 264, 274, "rgba(92,195,182,.8)", 0.9, 0.78);
        labelItems.push({
          lon,
          text: m[0],
          radii: [284, 290, 278],
          font: "9.5px serif",
          color: "rgba(106,218,205,.96)",
          minDist: 26,
          optional: true,
        });
      });
    }
    if (show.xiuRing && typeof xiuTable === "function") {
      xiuTable(year).forEach((x) => {
        const lon = norm(x.s + x.w / 2 + 180);
        drawTick3D(lon, 290, 297, "rgba(117,162,220,.56)", 0.8, 0.6);
        labelItems.push({
          lon,
          text: x.n,
          radii: [308, 312, 304],
          font: "8px serif",
          color: "rgba(172,198,240,.92)",
          minDist: 24,
          optional: true,
        });
      });
    }
    if (show.yqLayer) {
      for (let i = 0; i < 6; i++) {
        const lon = norm(300 + i * 60 + 180);
        drawTick3D(lon, 316, 325, "rgba(206,126,94,.82)", 0.9, 0.72);
        labelItems.push({
          lon,
          text: ["初气", "二气", "三气", "四气", "五气", "终气"][i],
          radii: [334, 338, 330],
          font: "9px serif",
          color: "rgba(233,170,138,.96)",
          minDist: 28,
          optional: true,
        });
      }
    }
    if (show.gregMonths) {
      gregMonthData(ORR3D.jd).forEach((m, idx) => {
        drawTick3D(m.start, 332, 340, "rgba(185,156,112,.72)", 0.9, 0.75);
        labelItems.push({
          lon: m.center,
          text: m.name,
          radii: [344, 340, 336],
          font: "9.5px serif",
          color: "rgba(240,226,199,.98)",
          minDist: 24,
          optional: false,
        });
      });
    }
    if (show.dayRing) {
      gregDayTickData(ORR3D.jd).forEach((d) => {
        const inner = d.monthStart ? 324 : d.major ? 328 : d.mid5 ? 331 : 333,
          outer = d.monthStart ? 341 : d.major ? 339 : d.mid5 ? 337 : 336,
          col = d.monthStart
            ? "rgba(246,224,170,.88)"
            : d.major
              ? "rgba(223,206,177,.68)"
              : d.mid5
                ? "rgba(197,182,156,.52)"
                : "rgba(180,172,154,.28)";
        drawTick3D(
          d.earth,
          inner,
          outer,
          col,
          d.monthStart ? 1.1 : d.major ? 0.9 : 0.55,
          d.monthStart ? 0.95 : d.major ? 0.82 : d.mid5 ? 0.56 : 0.28,
        );
      });
    }
    if (ORR3D.show && ORR3D.show.zodiac) {
      const signs =
        typeof A2_SIGN !== "undefined"
          ? A2_SIGN
          : [
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
            ];
      const glyph =
        typeof A2_GLYPH !== "undefined"
          ? A2_GLYPH
          : ["♈", "♉", "♊", "♋", "♌", "♍", "♎", "♏", "♐", "♑", "♒", "♓"];
      for (let i = 0; i < 12; i++) {
        const start = norm(i * 30 + 180),
          mid = norm(i * 30 + 15 + 180);
        drawTick3D(start, 238, 246, "rgba(170,143,102,.45)", 0.8, 0.55);
        labelItems.push({
          lon: mid,
          text: glyph[i] + " " + signs[i],
          radii: [230, 226, 234],
          font: "10.2px serif",
          color: ORR3D.zFocus === i ? "#f3da98" : "rgba(228,210,180,.95)",
          minDist: 34,
          optional: false,
        });
      }
      if (ORR3D.zFocus >= 0) {
        c.save();
        c.strokeStyle = "rgba(240,209,124,.95)";
        c.lineWidth = 3;
        c.globalAlpha = 0.75;
        const pts = [];
        for (let a = ORR3D.zFocus * 30; a <= ORR3D.zFocus * 30 + 30; a += 2)
          pts.push(ringPt(norm(a + 180), 244));
        orr3dPath(pts, "rgba(240,209,124,.95)", 4, null, 0.55);
        c.restore();
      }
    }
    placeLabels3D(labelItems);
    // current Earth radial line
    const a = projPt(earthLon, 208),
      b = projPt(earthLon, 346);
    c.save();
    c.strokeStyle = "rgba(255,205,92,.92)";
    c.lineWidth = 1.35;
    c.setLineDash([4, 3]);
    c.beginPath();
    c.moveTo(a.x, a.y);
    c.lineTo(b.x, b.y);
    c.stroke();
    c.restore();
    updateMeta(sunLon, earthLon);
  }
  function svgPt(lon, r) {
    const C = 310,
      a = lon * D2R;
    return [C + r * Math.cos(a), C - r * Math.sin(a)];
  }
  function placeLabels2D(items) {
    const out = [];
    const placed = [];
    items.forEach((it) => {
      let pos = null;
      for (const r of it.radii || [it.r || 300]) {
        const p = svgPt(it.lon, r);
        let ok = true;
        for (const q of placed) {
          if (Math.hypot(p[0] - q.x, p[1] - q.y) < (it.minDist || 20)) {
            ok = false;
            break;
          }
        }
        if (ok) {
          pos = { x: p[0], y: p[1], r };
          break;
        }
      }
      if (!pos && it.optional) return;
      if (!pos) {
        const p = svgPt(it.lon, (it.radii || [it.r || 300])[0]);
        pos = { x: p[0], y: p[1], r: (it.radii || [it.r || 300])[0] };
      }
      placed.push(pos);
      out.push({ it, pos });
    });
    return out;
  }
  function drawEarthLayersHelio() {
    const svg = document.getElementById("orrHelioSvg");
    if (!svg) return;
    const old = svg.querySelector("#v131HelioLayers");
    if (old) old.remove();
    const show = ORR3D.v131 || EARTH_RING_DEFAULTS,
      year = yearOfJD(ORR3D.jd),
      sunLon = sunLonAt(ORR3D.jd),
      earthLon = earthLonAt(ORR3D.jd);
    let s = '<g id="v131HelioLayers">';
    // ring circles
    [
      [218, "rgba(193,162,92,.50)"],
      [244, "rgba(196,170,126,.50)"],
      [270, "rgba(92,170,160,.42)"],
      [296, "rgba(106,136,196,.36)"],
      [322, "rgba(197,140,96,.30)"],
      [340, "rgba(180,180,180,.18)"],
    ].forEach((r) => {
      s += `<circle cx="310" cy="310" r="${r[0]}" fill="none" stroke="${r[1]}" stroke-width="0.9"/>`;
    });
    const items = [];
    if (show.seasons) {
      SEASONS.forEach((z, i) => {
        items.push({
          lon: norm((z[1] + z[2]) / 2 + 180),
          text: z[0],
          radii: [212, 206],
          font: "12.5",
          color: ["#79bb7d", "#dfa67b", "#d9bc73", "#83a7d6"][i],
          minDist: 24,
        });
      });
    }
    if (show.terms) {
      TERMS.forEach((t, i) => {
        const lon = norm(t[1] + 180),
          a = svgPt(lon, 238),
          b = svgPt(lon, i % 3 === 0 ? 251 : 248);
        s += `<line x1="${a[0].toFixed(1)}" y1="${a[1].toFixed(1)}" x2="${b[0].toFixed(1)}" y2="${b[1].toFixed(1)}" stroke="${i % 3 === 0 ? "rgba(232,194,108,.95)" : "rgba(203,183,150,.74)"}" stroke-width="${i % 3 === 0 ? 1.2 : 0.8}"/>`;
        items.push({
          lon,
          text: t[0],
          radii: i % 3 === 0 ? [262, 266, 258] : [254, 258, 250],
          font: i % 3 === 0 ? "10.0" : "8.6",
          color: i % 3 === 0 ? "#f0d48c" : "rgba(220,205,178,.84)",
          minDist: i % 3 === 0 ? 28 : 24,
          optional: i % 3 !== 0,
        });
      });
    }
    if (show.solarMonths) {
      SOLAR_MONTHS.forEach((m) => {
        const lon = norm(m[1] + 180),
          a = svgPt(lon, 264),
          b = svgPt(lon, 274);
        s += `<line x1="${a[0].toFixed(1)}" y1="${a[1].toFixed(1)}" x2="${b[0].toFixed(1)}" y2="${b[1].toFixed(1)}" stroke="rgba(92,195,182,.8)" stroke-width="0.9"/>`;
        items.push({
          lon,
          text: m[0],
          radii: [284, 290, 278],
          font: "8.6",
          color: "rgba(106,218,205,.96)",
          minDist: 24,
          optional: true,
        });
      });
    }
    if (show.xiuRing && typeof xiuTable === "function")
      xiuTable(year).forEach((x) => {
        const lon = norm(x.s + x.w / 2 + 180),
          a = svgPt(lon, 290),
          b = svgPt(lon, 297);
        s += `<line x1="${a[0].toFixed(1)}" y1="${a[1].toFixed(1)}" x2="${b[0].toFixed(1)}" y2="${b[1].toFixed(1)}" stroke="rgba(117,162,220,.56)" stroke-width="0.8"/>`;
        items.push({
          lon,
          text: x.n,
          radii: [308, 312, 304],
          font: "7.6",
          color: "rgba(172,198,240,.92)",
          minDist: 22,
          optional: true,
        });
      });
    if (show.yqLayer)
      for (let i = 0; i < 6; i++) {
        const lon = norm(300 + i * 60 + 180),
          a = svgPt(lon, 316),
          b = svgPt(lon, 325);
        s += `<line x1="${a[0].toFixed(1)}" y1="${a[1].toFixed(1)}" x2="${b[0].toFixed(1)}" y2="${b[1].toFixed(1)}" stroke="rgba(206,126,94,.82)" stroke-width="0.9"/>`;
        items.push({
          lon,
          text: ["初气", "二气", "三气", "四气", "五气", "终气"][i],
          radii: [334, 338, 330],
          font: "8.4",
          color: "rgba(233,170,138,.96)",
          minDist: 24,
          optional: true,
        });
      }
    if (show.gregMonths)
      gregMonthData(ORR3D.jd).forEach((m, idx) => {
        const a = svgPt(m.start, 332),
          b = svgPt(m.start, 340);
        s += `<line x1="${a[0].toFixed(1)}" y1="${a[1].toFixed(1)}" x2="${b[0].toFixed(1)}" y2="${b[1].toFixed(1)}" stroke="rgba(185,156,112,.72)" stroke-width="0.9"/>`;
        items.push({
          lon: m.center,
          text: m.name,
          radii: [344, 340, 336],
          font: "8.8",
          color: "rgba(240,226,199,.98)",
          minDist: 22,
        });
      });
    if (show.dayRing)
      gregDayTickData(ORR3D.jd).forEach((d) => {
        const inner = d.monthStart ? 324 : d.major ? 328 : d.mid5 ? 331 : 333,
          outer = d.monthStart ? 341 : d.major ? 339 : d.mid5 ? 337 : 336,
          col = d.monthStart
            ? "rgba(246,224,170,.88)"
            : d.major
              ? "rgba(223,206,177,.68)"
              : d.mid5
                ? "rgba(197,182,156,.52)"
                : "rgba(180,172,154,.28)";
        const a = svgPt(d.earth, inner),
          b = svgPt(d.earth, outer);
        s += `<line x1="${a[0].toFixed(1)}" y1="${a[1].toFixed(1)}" x2="${b[0].toFixed(1)}" y2="${b[1].toFixed(1)}" stroke="${col}" stroke-width="${d.monthStart ? 1.1 : d.major ? 0.9 : 0.55}"/>`;
      });
    if (ORR3D.show && ORR3D.show.zodiac) {
      const signs =
        typeof A2_SIGN !== "undefined"
          ? A2_SIGN
          : [
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
            ];
      const glyph =
        typeof A2_GLYPH !== "undefined"
          ? A2_GLYPH
          : ["♈", "♉", "♊", "♋", "♌", "♍", "♎", "♏", "♐", "♑", "♒", "♓"];
      for (let i = 0; i < 12; i++) {
        const start = norm(i * 30 + 180),
          mid = norm(i * 30 + 15 + 180),
          a = svgPt(start, 238),
          b = svgPt(start, 246);
        s += `<line x1="${a[0].toFixed(1)}" y1="${a[1].toFixed(1)}" x2="${b[0].toFixed(1)}" y2="${b[1].toFixed(1)}" stroke="rgba(170,143,102,.45)" stroke-width="0.8"/>`;
        items.push({
          lon: mid,
          text: glyph[i] + " " + signs[i],
          radii: [230, 226, 234],
          font: "8.8",
          color: ORR3D.zFocus === i ? "#f3da98" : "rgba(228,210,180,.95)",
          minDist: 34,
        });
      }
      if (ORR3D.zFocus >= 0) {
        const r = 244;
        s += `<path d="${(() => {
          let d = "";
          for (let a = ORR3D.zFocus * 30; a <= ORR3D.zFocus * 30 + 30; a += 2) {
            const p = svgPt(norm(a + 180), r);
            d +=
              (a === ORR3D.zFocus * 30 ? "M" : "L") + p[0].toFixed(1) + " " + p[1].toFixed(1) + " ";
          }
          return d;
        })()}" fill="none" stroke="rgba(240,209,124,.95)" stroke-width="3" opacity=".75"/>`;
      }
    }
    placeLabels2D(items).forEach(({ it, pos }) => {
      s += `<text x="${pos.x.toFixed(1)}" y="${pos.y.toFixed(1)}" fill="${it.color || "#e6d6b4"}" font-size="${it.font || "8"}" text-anchor="middle" style="paint-order:stroke;stroke:rgba(10,12,24,.56);stroke-width:2.2px;stroke-linejoin:round">${it.text}</text>`;
    });
    const a = svgPt(earthLon, 208),
      b = svgPt(earthLon, 346);
    s += `<line x1="${a[0].toFixed(1)}" y1="${a[1].toFixed(1)}" x2="${b[0].toFixed(1)}" y2="${b[1].toFixed(1)}" stroke="rgba(255,205,92,.92)" stroke-width="1.35" stroke-dasharray="4 3"/>`;
    s += "</g>";
    svg.insertAdjacentHTML("beforeend", s);
    updateMeta(sunLon, earthLon);
  }
  function updateMeta(sunLon, earthLon) {
    const el = document.getElementById("orr129Meta");
    if (!el) return;
    el.hidden = ORR3D.mode === "sem";
    if (el.hidden) return;
    const d = fromJD(ORR3D.jd + 8 / 24),
      term = curTerm(sunLon),
      q = qiAt(ORR3D.jd, sunLon),
      gm = gregMonthData(ORR3D.jd),
      sign = typeof AS_SIGN !== "undefined" ? AS_SIGN[Math.floor(norm(sunLon) / 30)] : null;
    let currentMonth = "—";
    for (let i = 0; i < gm.length; i++) {
      const a = gm[i].start,
        b = gm[i].end,
        dist = (b - a + 360) % 360 || 360,
        delta = (earthLon - a + 360) % 360;
      if (delta < dist) {
        currentMonth = gm[i].name;
        break;
      }
    }
    el.classList.add("v131-note");
    const doy = dayOfYearFromJD(ORR3D.jd);
    el.innerHTML = `<span>太阳黄经 <b>${sunLon.toFixed(2)}°</b></span><span>地球公转位置 <b>${earthLon.toFixed(2)}°</b></span><span>365日刻度 <b>第 ${doy} 天 / ${new Date(d.y, 1, 29).getMonth() === 1 ? 366 : 365} 天</b></span><span>当前节气区 <b>${term[0]} · 太阳黄经 ${term[1]}°</b></span><span>节令月 <b>${solarMonthBySun(sunLon)}</b></span><span>公历月环 <b>${currentMonth}</b></span>${sign ? `<span>黄道宫 <b>${sign[1]} ${sign[0]}座 · ${sign[3]}象</b></span>` : ""}<span>六气 <b>${["初", "二", "三", "四", "五", "终"][q.step]}之气 · ${q.guest[q.step]}</b></span><span>说明 <b>环图层以地球公转位置为基准（太阳黄经 + 180°）</b></span>`;
  }
  function syncFromDom() {
    const S = ORR3D.v131;
    const ids = [
      ["orr3dT_term", "terms"],
      ["orr3dT_month", "solarMonths"],
      ["orr3dT_season", "seasons"],
      ["orr3dT_xiur", "xiuRing"],
      ["orr3dT_yq", "yqLayer"],
      ["orr3dT_gmonth", "gregMonths"],
      ["orr3dT_dayring", "dayRing"],
    ];
    ids.forEach(([id, k]) => {
      const el = document.getElementById(id);
      if (el) S[k] = !!el.checked;
    });
  }
  function ensureControls() {
    const term = document.getElementById("orr3dT_term");
    if (!term) return;
    const month = document.getElementById("orr3dT_month");
    if (month) {
      const tx = month.parentNode;
      if (tx && tx.lastChild && tx.lastChild.nodeType === 3) tx.lastChild.nodeValue = " 节令十二月";
    }
    if (term) {
      const tx = term.parentNode;
      if (tx && tx.lastChild && tx.lastChild.nodeType === 3) tx.lastChild.nodeValue = " 节气24点";
    }
    if (!document.getElementById("orr3dT_gmonth")) {
      const lb = document.createElement("label");
      lb.className = "only-system v131-added";
      lb.innerHTML = '<input type="checkbox" id="orr3dT_gmonth" checked> 公历月份';
      if (month && month.parentNode && month.parentNode.parentNode)
        month.parentNode.parentNode.insertBefore(lb, month.parentNode.nextSibling);
    }
    if (!document.getElementById("orr3dT_dayring")) {
      const lb = document.createElement("label");
      lb.className = "only-system v131-added";
      lb.innerHTML = '<input type="checkbox" id="orr3dT_dayring" checked> 365日刻度';
      const gm = document.getElementById("orr3dT_gmonth");
      if (gm && gm.parentNode && gm.parentNode.parentNode)
        gm.parentNode.parentNode.insertBefore(lb, gm.parentNode.nextSibling);
      else if (month && month.parentNode && month.parentNode.parentNode)
        month.parentNode.parentNode.appendChild(lb);
    }
    [
      ["orr3dT_term", "terms"],
      ["orr3dT_month", "solarMonths"],
      ["orr3dT_season", "seasons"],
      ["orr3dT_xiur", "xiuRing"],
      ["orr3dT_yq", "yqLayer"],
      ["orr3dT_gmonth", "gregMonths"],
      ["orr3dT_dayring", "dayRing"],
    ].forEach(([id, k]) => {
      const el = document.getElementById(id);
      if (!el || el.dataset.v131) return;
      el.dataset.v131 = "1";
      el.checked = !!ORR3D.v131[k];
      el.onchange = function () {
        ORR3D.v131[k] = !!this.checked;
        if (ORR3D.mode === "helio") orr3dHelioRender();
        else if (ORR3D.mode === "3d") orr3dDraw();
      };
    });
  }
  function suppressLegacy() {
    const bak = {};
    ["terms", "solarMonths", "seasons", "xiuRing", "yqLayer"].forEach((k) => {
      bak[k] = ORR3D.show[k];
      ORR3D.show[k] = false;
    });
    return bak;
  }
  function restoreLegacy(bak) {
    Object.keys(bak).forEach((k) => (ORR3D.show[k] = bak[k]));
  }
  const _draw = orr3dDraw;
  orr3dDraw = function () {
    syncFromDom();
    const bak = suppressLegacy();
    try {
      var r = _draw.apply(this, arguments);
    } finally {
      restoreLegacy(bak);
    }
    try {
      drawEarthLayers3D();
    } catch (e) {
      console.error("[v131 3d layers]", e);
    }
    return r;
  };
  window.orr3dDraw = orr3dDraw;
  const _helio = orr3dHelioRender;
  orr3dHelioRender = function () {
    syncFromDom();
    const bak = suppressLegacy();
    try {
      var r = _helio.apply(this, arguments);
    } finally {
      restoreLegacy(bak);
    }
    try {
      drawEarthLayersHelio();
    } catch (e) {
      console.error("[v131 helio layers]", e);
    }
    return r;
  };
  window.orr3dHelioRender = orr3dHelioRender;
  const _bind = bindOrr3d;
  bindOrr3d = function () {
    const r = _bind.apply(this, arguments);
    try {
      ensureControls();
      syncFromDom();
    } catch (e) {
      console.error("[v131 bind]", e);
    }
    return r;
  };
  window.bindOrr3d = bindOrr3d;
  const _mode = orr3dSetMode;
  orr3dSetMode = function (mode) {
    const r = _mode.apply(this, arguments);
    try {
      ensureControls();
      syncFromDom();
      if (mode === "helio") drawEarthLayersHelio();
      else if (mode === "3d") drawEarthLayers3D();
    } catch (e) {
      console.error("[v131 mode]", e);
    }
    return r;
  };
  window.orr3dSetMode = orr3dSetMode;
  window.addEventListener("load", function () {
    try {
      ensureControls();
      const bv = document.getElementById("buildVersion");
    } catch (_) {}
  });
})();
