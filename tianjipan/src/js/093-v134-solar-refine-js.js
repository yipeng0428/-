(function () {
  "use strict";
  const V134_BUILD = "v134 · 2026-10-05 00:58 +08:00";
  const TERM_BRIEF = {
    春分: "昼夜几乎平分，是春季气机展开的中点，适合启动、播种与外出。",
    清明: "清气上升、万物明净，传统上重扫墓与踏青，也提醒情绪疏通。",
    谷雨: "雨生百谷，偏重滋养与蓄势，适合稳步推进长期事务。",
    立夏: "夏气初起，外向活动明显增加，宜顺势行动但避免躁进。",
    小满: "将满未满，强调留有余地，适合扩张中的节制与校准。",
    芒种: "忙种忙收，效率与执行感强，适合集中处理关键节点。",
    夏至: "阳极而转，白昼最长，提醒劳逸平衡与防止过度消耗。",
    小暑: "暑气渐盛，节律开始加快，宜防心火与急躁。",
    大暑: "一年炎热高点，适合收束、避耗、做重要恢复。",
    立秋: "暑去凉来，适合从外放转向整顿与收拢。",
    处暑: "暑气渐止，事务进入沉淀期，适合复盘与整理。",
    白露: "露凝而白，昼夜温差加大，强调收敛与保养。",
    秋分: "昼夜再平分，是秋季中点，适合平衡收获、清理与定调。",
    寒露: "凉意明显加深，宜养阴防燥，也适合把计划做实。",
    霜降: "秋收近尾，气机肃降，适合减负、收尾、去繁就简。",
    立冬: "冬气伊始，适合储藏、养精、减少无谓消耗。",
    小雪: "收藏渐深，提醒补给与节律稳定。",
    大雪: "阴气更盛，适合慢下来、守成与深度准备。",
    冬至: "阴极阳生，是重要转折点，适合定心、修整与重新布局。",
    小寒: "寒意渐强，重在固本与蓄能。",
    大寒: "岁末寒极，适合收官、内守、储备来年资源。",
    立春: "新周期开启，适合立愿、开题、破冰。",
    雨水: "阳和上升、冰雪解散，适合沟通、连接与恢复流动。",
    惊蛰: "万物始动，适合破局、行动与唤醒迟滞状态。",
  };
  const XIU_WX = ["木", "金", "土", "日", "月", "火", "水"];
  function v134TermInfo(name, lon) {
    return {
      type: "term",
      name,
      html: `<div class="v134-layer-card"><b>节气 · ${name}</b><br>黄经定位：<b>${lon}°</b>。${TERM_BRIEF[name] || "此节气用于划定太阳黄经节律，是天时分段的重要节点。"}<br><span class="dim">点击其他节气 / 星宿标签可继续查看。</span></div>`,
    };
  }
  function v134XiuInfo(x) {
    var wx = typeof WXK !== "undefined" && WXK[x.wx] ? WXK[x.wx] : XIU_WX[x.wx] || "";
    return {
      type: "xiu",
      name: x.n,
      html: `<div class="v134-layer-card"><b>二十八宿 · ${x.n}宿</b><br>宿度中心：<b>${norm(x.s + x.w / 2).toFixed(2)}°</b>；宿区宽度约 <b>${x.w.toFixed(2)}°</b>。${x.si ? `所属四象/序列：<b>${x.si}</b>。` : ""}${wx ? `五行归类：<b>${wx}</b>。` : ""}<br><span class="dim">本页用于传统天文与命理参照，不同流派宿度口径可再分别校核。</span></div>`,
    };
  }
  function v134SetLayerInfo(obj) {
    ORR3D.layerInfo = obj || null;
    try {
      updateMeta(sunLonAt(ORR3D.jd), earthLonAt(ORR3D.jd));
    } catch (_) {}
  }
  window.v134SetLayerInfo = v134SetLayerInfo;

  // 让精简太阳系与日心俯视的轨道更疏朗
  orr3dDispR = function (r) {
    return 42 + 123 * Math.log10(1 + 2.45 * Math.max(0, r));
  };
  function v134HelioDispR(name, r) {
    var i = Math.max(0, ORR3D_NAMES.indexOf(name));
    var slots = [58, 84, 112, 142, 176, 210, 244, 276, 296];
    return slots[i] || 54 + 28 * i;
  }

  function v134PlaceLabels3D(items) {
    const c = ORR3D.ctx;
    if (!c) return [];
    const placed = [],
      hits = [];
    c.save();
    items.forEach((it) => {
      let pos = null;
      const radii = (it.radii && it.radii.length ? it.radii : [it.r || 320]).slice();
      for (let i = 0; i < radii.length; i++) {
        const p = projPt(it.lon, radii[i]);
        let ok = true;
        for (const q of placed) {
          if (Math.hypot(p.x - q.x, p.y - q.y) < (it.minDist || 26)) {
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
      c.globalAlpha = it.alpha == null ? 0.98 : it.alpha;
      c.fillStyle = it.color || "#e6d6b4";
      c.font = it.font || "11px serif";
      c.textAlign = "center";
      c.textBaseline = "middle";
      c.lineWidth = 3.4;
      c.strokeStyle = "rgba(8,10,20,.44)";
      c.strokeText(it.text, pos.x, pos.y);
      c.fillText(it.text, pos.x, pos.y);
      if (it.info)
        hits.push({
          x: pos.x,
          y: pos.y,
          r: Math.max(14, (it.fontSize || 11) * 1.15),
          info: it.info,
        });
    });
    c.restore();
    return hits;
  }
  function v134PlaceLabels2D(items) {
    const out = [],
      placed = [];
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

  // 覆盖 3D 环图层：更大的层间距 / 更大的字 / 可点击信息
  window.drawEarthLayers3D = function () {
    if (!ORR3D.ctx || ORR3D.mode !== "3d") return;
    const show = ORR3D.v131 || EARTH_RING_DEFAULTS;
    const year = yearOfJD(ORR3D.jd),
      sunLon = sunLonAt(ORR3D.jd),
      earthLon = earthLonAt(ORR3D.jd);
    const c = ORR3D.ctx;
    ORR3D.layerHits = [];
    strokeCircle3D(198, "rgba(193,162,92,.56)", 1.0, 0.92);
    strokeCircle3D(228, "rgba(196,170,126,.58)", 1.0, 0.9);
    strokeCircle3D(260, "rgba(92,170,160,.48)", 0.95, 0.86);
    strokeCircle3D(292, "rgba(106,136,196,.40)", 0.9, 0.82);
    strokeCircle3D(324, "rgba(197,140,96,.34)", 0.85, 0.76);
    strokeCircle3D(356, "rgba(180,180,180,.25)", 0.8, 0.64);
    const items = [];
    if (show.seasons) {
      SEASONS.forEach((s, i) => {
        items.push({
          lon: norm((s[1] + s[2]) / 2 + 180),
          text: s[0],
          radii: [188, 182],
          font: "bold 12px serif",
          fontSize: 12,
          color: ["#79bb7d", "#dfa67b", "#d9bc73", "#83a7d6"][i],
          minDist: 26,
        });
      });
    }
    if (show.terms) {
      TERMS.forEach((t, i) => {
        const lon = norm(t[1] + 180);
        drawTick3D(
          lon,
          222,
          i % 3 === 0 ? 238 : 234,
          i % 3 === 0 ? "rgba(232,194,108,.95)" : "rgba(203,183,150,.78)",
          i % 3 === 0 ? 1.25 : 0.95,
          i % 3 === 0 ? 0.96 : 0.82,
        );
        items.push({
          lon,
          text: t[0],
          radii: i % 3 === 0 ? [248, 254, 242] : [242, 248, 236],
          font: i % 3 === 0 ? "12.5px serif" : "10.5px serif",
          fontSize: i % 3 === 0 ? 12.5 : 10.5,
          color: i % 3 === 0 ? "#f3da98" : "rgba(232,217,190,.90)",
          minDist: i % 3 === 0 ? 34 : 30,
          optional: i % 3 !== 0,
          info: v134TermInfo(t[0], t[1]),
        });
      });
    }
    if (show.solarMonths) {
      SOLAR_MONTHS.forEach((m, i) => {
        const lon = norm(m[1] + 180);
        drawTick3D(lon, 254, 264, "rgba(92,195,182,.82)", 0.95, 0.82);
        items.push({
          lon,
          text: m[0],
          radii: [276, 282, 270],
          font: "10.8px serif",
          fontSize: 10.8,
          color: "rgba(118,227,214,.98)",
          minDist: 28,
          optional: true,
        });
      });
    }
    if (show.xiuRing && typeof xiuTable === "function") {
      xiuTable(year).forEach((x) => {
        const lon = norm(x.s + x.w / 2 + 180);
        drawTick3D(lon, 286, 295, "rgba(117,162,220,.60)", 0.85, 0.66);
        items.push({
          lon,
          text: x.n,
          radii: [306, 312, 300],
          font: "10px serif",
          fontSize: 10,
          color: "rgba(178,205,246,.96)",
          minDist: 28,
          optional: true,
          info: v134XiuInfo(x),
        });
      });
    }
    if (show.yqLayer) {
      for (let i = 0; i < 6; i++) {
        const lon = norm(300 + i * 60 + 180);
        drawTick3D(lon, 318, 328, "rgba(206,126,94,.84)", 0.95, 0.76);
        items.push({
          lon,
          text: ["初气", "二气", "三气", "四气", "五气", "终气"][i],
          radii: [340, 346, 334],
          font: "10.4px serif",
          fontSize: 10.4,
          color: "rgba(233,170,138,.96)",
          minDist: 30,
          optional: true,
        });
      }
    }
    if (show.gregMonths) {
      gregMonthData(ORR3D.jd).forEach((m) => {
        drawTick3D(m.start, 346, 356, "rgba(185,156,112,.72)", 0.9, 0.74);
        items.push({
          lon: m.center,
          text: m.name,
          radii: [368, 362, 356],
          font: "10.8px serif",
          fontSize: 10.8,
          color: "rgba(240,226,199,.98)",
          minDist: 26,
          optional: false,
        });
      });
    }
    if (show.dayRing) {
      gregDayTickData(ORR3D.jd).forEach((d) => {
        const inner = d.monthStart ? 336 : d.major ? 340 : d.mid5 ? 343 : 345,
          outer = d.monthStart ? 356 : d.major ? 354 : d.mid5 ? 351 : 349,
          col = d.monthStart
            ? "rgba(246,224,170,.90)"
            : d.major
              ? "rgba(223,206,177,.70)"
              : d.mid5
                ? "rgba(197,182,156,.54)"
                : "rgba(180,172,154,.28)";
        drawTick3D(
          d.earth,
          inner,
          outer,
          col,
          d.monthStart ? 1.2 : d.major ? 1.0 : 0.55,
          d.monthStart ? 0.96 : d.major ? 0.84 : d.mid5 ? 0.58 : 0.28,
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
        drawTick3D(start, 198, 206, "rgba(170,143,102,.48)", 0.85, 0.6);
        items.push({
          lon: mid,
          text: glyph[i] + " " + signs[i],
          radii: [214, 210, 218],
          font: "11.4px serif",
          fontSize: 11.4,
          color: ORR3D.zFocus === i ? "#f3da98" : "rgba(232,214,183,.94)",
          minDist: 38,
        });
      }
      if (ORR3D.zFocus >= 0) {
        orr3dPath(
          Array.from({ length: 16 }, (_, k) => ringPt(norm(ORR3D.zFocus * 30 + 180 + k * 2), 204)),
          "rgba(240,209,124,.95)",
          4,
          null,
          0.56,
        );
      }
    }
    ORR3D.layerHits = v134PlaceLabels3D(items);
    const a = projPt(earthLon, 190),
      b = projPt(earthLon, 370);
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
  };

  window.drawEarthLayersHelio = function () {
    const svg = document.getElementById("orrHelioSvg");
    if (!svg) return;
    const old = svg.querySelector("#v131HelioLayers");
    if (old) old.remove();
    const show = ORR3D.v131 || EARTH_RING_DEFAULTS,
      year = yearOfJD(ORR3D.jd),
      sunLon = sunLonAt(ORR3D.jd),
      earthLon = earthLonAt(ORR3D.jd);
    let s = '<g id="v131HelioLayers">';
    [
      [186, "rgba(193,162,92,.52)"],
      [206, "rgba(196,170,126,.52)"],
      [226, "rgba(92,170,160,.44)"],
      [246, "rgba(106,136,196,.36)"],
      [266, "rgba(197,140,96,.30)"],
      [286, "rgba(180,180,180,.18)"],
    ].forEach((r) => {
      s += `<circle cx="310" cy="310" r="${r[0]}" fill="none" stroke="${r[1]}" stroke-width="0.95"/>`;
    });
    const items = [];
    if (show.seasons) {
      SEASONS.forEach((z, i) =>
        items.push({
          lon: norm((z[1] + z[2]) / 2 + 180),
          text: z[0],
          radii: [176, 172],
          font: "12.5",
          fontSize: 12.5,
          color: ["#79bb7d", "#dfa67b", "#d9bc73", "#83a7d6"][i],
          minDist: 24,
        }),
      );
    }
    if (show.terms) {
      TERMS.forEach((t, i) => {
        const lon = norm(t[1] + 180),
          a = svgPt(lon, 200),
          b = svgPt(lon, i % 3 === 0 ? 214 : 211);
        s += `<line x1="${a[0].toFixed(1)}" y1="${a[1].toFixed(1)}" x2="${b[0].toFixed(1)}" y2="${b[1].toFixed(1)}" stroke="${i % 3 === 0 ? "rgba(232,194,108,.95)" : "rgba(203,183,150,.78)"}" stroke-width="${i % 3 === 0 ? 1.25 : 0.95}"/>`;
        items.push({
          lon,
          text: t[0],
          radii: i % 3 === 0 ? [224, 230, 218] : [219, 225, 214],
          font: i % 3 === 0 ? "11.4" : "9.8",
          fontSize: i % 3 === 0 ? 11.4 : 9.8,
          color: i % 3 === 0 ? "#f3da98" : "rgba(232,217,190,.90)",
          minDist: i % 3 === 0 ? 28 : 24,
          optional: i % 3 !== 0,
          info: v134TermInfo(t[0], t[1]),
        });
      });
    }
    if (show.solarMonths) {
      SOLAR_MONTHS.forEach((m) => {
        const lon = norm(m[1] + 180),
          a = svgPt(lon, 222),
          b = svgPt(lon, 232);
        s += `<line x1="${a[0].toFixed(1)}" y1="${a[1].toFixed(1)}" x2="${b[0].toFixed(1)}" y2="${b[1].toFixed(1)}" stroke="rgba(92,195,182,.82)" stroke-width="0.95"/>`;
        items.push({
          lon,
          text: m[0],
          radii: [242, 248, 236],
          font: "9.8",
          fontSize: 9.8,
          color: "rgba(118,227,214,.98)",
          minDist: 24,
          optional: true,
        });
      });
    }
    if (show.xiuRing && typeof xiuTable === "function")
      xiuTable(year).forEach((x) => {
        const lon = norm(x.s + x.w / 2 + 180),
          a = svgPt(lon, 242),
          b = svgPt(lon, 250);
        s += `<line x1="${a[0].toFixed(1)}" y1="${a[1].toFixed(1)}" x2="${b[0].toFixed(1)}" y2="${b[1].toFixed(1)}" stroke="rgba(117,162,220,.60)" stroke-width="0.85"/>`;
        items.push({
          lon,
          text: x.n,
          radii: [260, 266, 255],
          font: "9.2",
          fontSize: 9.2,
          color: "rgba(178,205,246,.96)",
          minDist: 22,
          optional: true,
          info: v134XiuInfo(x),
        });
      });
    if (show.yqLayer)
      for (let i = 0; i < 6; i++) {
        const lon = norm(300 + i * 60 + 180),
          a = svgPt(lon, 262),
          b = svgPt(lon, 270);
        s += `<line x1="${a[0].toFixed(1)}" y1="${a[1].toFixed(1)}" x2="${b[0].toFixed(1)}" y2="${b[1].toFixed(1)}" stroke="rgba(206,126,94,.84)" stroke-width="0.95"/>`;
        items.push({
          lon,
          text: ["初气", "二气", "三气", "四气", "五气", "终气"][i],
          radii: [279, 284, 274],
          font: "9.2",
          fontSize: 9.2,
          color: "rgba(233,170,138,.96)",
          minDist: 22,
          optional: true,
        });
      }
    if (show.gregMonths)
      gregMonthData(ORR3D.jd).forEach((m) => {
        const a = svgPt(m.start, 274),
          b = svgPt(m.start, 286);
        s += `<line x1="${a[0].toFixed(1)}" y1="${a[1].toFixed(1)}" x2="${b[0].toFixed(1)}" y2="${b[1].toFixed(1)}" stroke="rgba(185,156,112,.72)" stroke-width="0.9"/>`;
        items.push({
          lon: m.center,
          text: m.name,
          radii: [295, 290, 285],
          font: "9.2",
          fontSize: 9.2,
          color: "rgba(240,226,199,.98)",
          minDist: 20,
        });
      });
    if (show.dayRing)
      gregDayTickData(ORR3D.jd).forEach((d) => {
        const inner = d.monthStart ? 268 : d.major ? 272 : d.mid5 ? 275 : 277,
          outer = d.monthStart ? 286 : d.major ? 284 : d.mid5 ? 282 : 280,
          col = d.monthStart
            ? "rgba(246,224,170,.90)"
            : d.major
              ? "rgba(223,206,177,.70)"
              : d.mid5
                ? "rgba(197,182,156,.54)"
                : "rgba(180,172,154,.28)";
        const a = svgPt(d.earth, inner),
          b = svgPt(d.earth, outer);
        s += `<line x1="${a[0].toFixed(1)}" y1="${a[1].toFixed(1)}" x2="${b[0].toFixed(1)}" y2="${b[1].toFixed(1)}" stroke="${col}" stroke-width="${d.monthStart ? 1.2 : d.major ? 1.0 : 0.55}"/>`;
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
          a = svgPt(start, 186),
          b = svgPt(start, 194);
        s += `<line x1="${a[0].toFixed(1)}" y1="${a[1].toFixed(1)}" x2="${b[0].toFixed(1)}" y2="${b[1].toFixed(1)}" stroke="rgba(170,143,102,.48)" stroke-width="0.85"/>`;
        items.push({
          lon: mid,
          text: glyph[i] + " " + signs[i],
          radii: [202, 198, 206],
          font: "10.0",
          fontSize: 10,
          color: ORR3D.zFocus === i ? "#f3da98" : "rgba(232,214,183,.94)",
          minDist: 30,
        });
      }
      if (ORR3D.zFocus >= 0) {
        const r = 194;
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
    v134PlaceLabels2D(items).forEach(({ it, pos }) => {
      s += `<text x="${pos.x.toFixed(1)}" y="${pos.y.toFixed(1)}" fill="${it.color || "#e6d6b4"}" font-size="${it.font || "8"}" text-anchor="middle" class="${it.info ? "v134-clickable" : ""}" ${it.info ? `data-v134-layer="${it.info.type}" data-v134-name="${it.info.name}"` : ""} style="paint-order:stroke;stroke:rgba(10,12,24,.60);stroke-width:2.2px;stroke-linejoin:round">${it.text}</text>`;
    });
    const a = svgPt(earthLon, 178),
      b = svgPt(earthLon, 298);
    s += `<line x1="${a[0].toFixed(1)}" y1="${a[1].toFixed(1)}" x2="${b[0].toFixed(1)}" y2="${b[1].toFixed(1)}" stroke="rgba(255,205,92,.92)" stroke-width="1.35" stroke-dasharray="4 3"/>`;
    s += "</g>";
    svg.insertAdjacentHTML("beforeend", s);
    updateMeta(sunLon, earthLon);
  };

  // 日心俯视重绘：行星名称使用行星同色，轨道间距更大
  window.orr3dHelioRender = function () {
    var O = ORR3D,
      svg = document.getElementById("orrHelioSvg"),
      side = document.getElementById("orrHelioInfo");
    if (!svg || !side) return;
    var T = (O.jd - 2451545) / 36525,
      C = 310,
      names = O.show.pluto ? ORR3D_NAMES : ORR3D_NAMES.slice(0, 8),
      zNames = [
        "白羊",
        "金牛",
        "双子",
        "巨蟹",
        "狮子",
        "室女",
        "天秤",
        "天蝎",
        "人马",
        "摩羯",
        "宝瓶",
        "双鱼",
      ];
    function Q(a, r) {
      var x = (a || 0) * D2R;
      return [C + r * Math.cos(x), C - r * Math.sin(x)];
    }
    var s =
      '<rect width="620" height="620" fill="transparent"/><circle cx="' +
      C +
      '" cy="' +
      C +
      '" r="194" class="oh-zring"/>';
    if (O.show.zodiac) {
      for (var k = 0; k < 12; k++) {
        var p1 = Q(k * 30, 186),
          p2 = Q(k * 30, 194),
          pl = Q(k * 30 + 15, 204);
        s +=
          '<line x1="' +
          p1[0].toFixed(1) +
          '" y1="' +
          p1[1].toFixed(1) +
          '" x2="' +
          p2[0].toFixed(1) +
          '" y2="' +
          p2[1].toFixed(1) +
          '" class="oh-zline"/><text x="' +
          pl[0].toFixed(1) +
          '" y="' +
          (pl[1] + 3).toFixed(1) +
          '" class="oh-ztext" style="fill:rgba(235,222,195,.84);font-size:10.5px">' +
          zNames[k] +
          "</text>";
      }
    }
    s +=
      '<line x1="' +
      C +
      '" y1="' +
      C +
      '" x2="592" y2="' +
      C +
      '" class="oh-axis"/><text x="588" y="' +
      (C - 7) +
      '" class="oh-ztext" text-anchor="end">春分点 0°</text>';
    for (var i = 0; i < names.length; i++) {
      var n = names[i],
        h = asHelio(n, T),
        r = Math.hypot(h.x, h.y, h.z),
        rr = v134HelioDispR(n, r),
        lon = norm360(Math.atan2(h.y, h.x) / D2R);
      if (O.show.orbits)
        s += '<circle cx="' + C + '" cy="' + C + '" r="' + rr.toFixed(1) + '" class="oh-orbit"/>';
      var p = Q(lon, rr),
        m = ORR3D_PLANETS[n],
        rad = n === "地球" ? 6.8 : 5.4;
      s +=
        '<g class="oh-p' +
        (n === O.selected ? " sel" : "") +
        '" tabindex="0" data-planet="' +
        n +
        '"><circle cx="' +
        p[0].toFixed(1) +
        '" cy="' +
        p[1].toFixed(1) +
        '" r="' +
        rad +
        '" fill="' +
        m.c1 +
        '"/><text x="' +
        (p[0] + 10).toFixed(1) +
        '" y="' +
        (p[1] - 8).toFixed(1) +
        '" fill="' +
        m.c1 +
        '">' +
        m.g +
        " " +
        n +
        "</text></g>";
    }
    s +=
      '<circle cx="' +
      C +
      '" cy="' +
      C +
      '" r="10" class="oh-sun"/><text x="' +
      C +
      '" y="' +
      (C + 26) +
      '" class="oh-ztext">☉ 太阳</text>';
    svg.innerHTML = s;
    drawEarthLayersHelio();
    var h = asHelio(O.selected, T),
      r = Math.hypot(h.x, h.y, h.z),
      lon = norm360(Math.atan2(h.y, h.x) / D2R),
      lat = Math.atan2(h.z, Math.hypot(h.x, h.y)) / D2R,
      m = ORR3D_PLANETS[O.selected],
      spd = orr3dSpeedDeg(O.selected);
    var rows = names
      .map(function (n) {
        var q = asHelio(n, T),
          qr = Math.hypot(q.x, q.y, q.z),
          ql = norm360(Math.atan2(q.y, q.x) / D2R),
          m2 = ORR3D_PLANETS[n];
        return (
          '<div class="orr-helio-row' +
          (n === O.selected ? " sel" : "") +
          '"><b style="color:' +
          m2.c1 +
          '">' +
          m2.g +
          " " +
          n +
          "</b><em>" +
          qr.toFixed(2) +
          " AU</em><span>日心黄经 " +
          ql.toFixed(1) +
          "°</span></div>"
        );
      })
      .join("");
    side.innerHTML =
      "<h4>" +
      m.g +
      " " +
      O.selected +
      ' · 日心参数</h4><div class="orr-helio-kv"><span>模拟时刻</span><b>' +
      orr3dFmt(O.jd) +
      "</b><span>日心黄经</span><b>" +
      lon.toFixed(2) +
      "°</b><span>黄纬</span><b>" +
      lat.toFixed(2) +
      "°</b><span>距日</span><b>" +
      r.toFixed(3) +
      " AU</b><span>角速度</span><b>" +
      spd.toFixed(3) +
      "°/日</b><span>公转周期</span><b>" +
      m.period.toLocaleString("zh-CN", { maximumFractionDigits: 1 }) +
      ' 日</b><span>参考平面</span><b>J2000 黄道面</b><span>黄赤交角</span><b>约 23.44°</b></div><div class="orr-helio-table-title">行星当前日心位置</div><div class="orr-helio-table">' +
      rows +
      "</div>";
  };

  // updateMeta 扩展：显示点击得到的节气/星宿说明
  const _v134UpdateMeta = window.updateMeta;
  window.updateMeta = function (sunLon, earthLon) {
    _v134UpdateMeta(sunLon, earthLon);
    const el = document.getElementById("orr129Meta");
    if (!el) return;
    if (ORR3D.layerInfo && ORR3D.layerInfo.html)
      el.insertAdjacentHTML("beforeend", ORR3D.layerInfo.html);
  };

  // 绑定点击：Canvas 图层 / SVG 图层
  function v134BindExtras() {
    const cv = document.getElementById("orr3dCv");
    if (cv && !cv.dataset.v134layer) {
      cv.dataset.v134layer = "1";
      cv.addEventListener("click", function (e) {
        const rect = cv.getBoundingClientRect(),
          x = e.clientX - rect.left,
          y = e.clientY - rect.top,
          h = (ORR3D.layerHits || []).find((it) => Math.hypot(x - it.x, y - it.y) <= it.r);
        if (h) {
          v134SetLayerInfo(h.info);
          e.stopPropagation();
        }
      });
    }
    const svg = document.getElementById("orrHelioSvg");
    if (svg && !svg.dataset.v134layer) {
      svg.dataset.v134layer = "1";
      svg.addEventListener("click", function (e) {
        const t = e.target.closest && e.target.closest("[data-v134-layer]");
        if (!t) return;
        const ty = t.getAttribute("data-v134-layer"),
          nm = t.getAttribute("data-v134-name");
        if (ty === "term") {
          const it = TERMS.find((a) => a[0] === nm);
          if (it) v134SetLayerInfo(v134TermInfo(it[0], it[1]));
        } else if (ty === "xiu" && typeof xiuTable === "function") {
          const y = yearOfJD(ORR3D.jd),
            x = xiuTable(y).find((v) => v.n === nm);
          if (x) v134SetLayerInfo(v134XiuInfo(x));
        }
        e.stopPropagation();
      });
    }
  }
  const _bind134 = window.bindOrr3d;
  window.bindOrr3d = function () {
    const r = _bind134.apply(this, arguments);
    setTimeout(v134BindExtras, 0);
    return r;
  };
  const _mode134 = window.orr3dSetMode;
  window.orr3dSetMode = function (mode) {
    const r = _mode134.apply(this, arguments);
    setTimeout(v134BindExtras, 0);
    return r;
  };
  window.addEventListener("load", function () {
    try {
      v134BindExtras();
      const bv = document.getElementById("buildVersion");
    } catch (_) {}
  });
})();
