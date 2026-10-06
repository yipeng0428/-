(function () {
  "use strict";
  const V135_BUILD = "v135 · 2026-10-04 23:09 +08:00";
  function v135Esc(s) {
    return String(s == null ? "" : s).replace(
      /[&<>"']/g,
      (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[m],
    );
  }
  function v135SignInfo(i) {
    const s = AS_SIGN[i],
      desc =
        typeof V129_SIGN_DESC !== "undefined" && V129_SIGN_DESC[i]
          ? V129_SIGN_DESC[i]
          : [s[0], s[3], "黄道十二宫"];
    return {
      type: "zodiac",
      name: s[0],
      html: `<div class="v135-layer-detail"><b>${s[1]} ${s[0]}座</b> · ${s[3]}象<br>黄经区间：<b>${i * 30}°–${i * 30 + 30}°</b>；传统象征关键词：${v135Esc(desc[2] || "—")}。<br><span class="dim">这里的“黄道宫”是按太阳黄经等分的 12 个 30° 区段；与 IAU 星座实际边界不是同一概念。</span></div>`,
    };
  }
  function v135GregMonthInfo(m, idx) {
    return {
      type: "gregmonth",
      name: m.name,
      html: `<div class="v135-layer-detail"><b>公历月份 · ${m.name}</b><br>本环不是把 360°机械平均分成 12 份，而是把当年每月 1 日对应的真实地球公转方向投到环上；因此月份扇区宽度会随地球公转速度变化而略有不同。<br><span class="dim">当前月份环的角位置来自本站太阳黄经计算，再换算为地球公转方向（+180°）。</span></div>`,
    };
  }
  function v135DayInfo(d, jd) {
    const dt = fromJD(jd + 8 / 24),
      leap = new Date(dt.y, 1, 29).getMonth() === 1;
    return {
      type: "day",
      name: `${dt.y}年第${d.idx}天`,
      html: `<div class="v135-layer-detail"><b>${dt.y} 年 · 第 ${d.idx} 天</b>（${d.m}月${d.d}日）<br>地球公转方向：<b>${d.earth.toFixed(2)}°</b>。这一刻度按该自然日中午对应的太阳黄经计算，并不是把轨道简单切成 ${leap ? 366 : 365} 个等角扇区。<br><span class="dim">因此近日点附近的日刻度角距会略大，远日点附近略小，更符合真实公转速度变化。</span></div>`,
    };
  }
  function v135SolarMonthInfo(m) {
    return {
      type: "solarmonth",
      name: m[0],
      html: `<div class="v135-layer-detail"><b>节令月 · ${m[0]}</b><br>以节气黄经为界的传统节令月参照。它与公历月不是同一套边界；八字月柱等传统历法模块使用的是节令月概念。</div>`,
    };
  }
  function v135SetInfo(obj) {
    ORR3D.layerInfo = obj || null;
    try {
      updateMeta(sunLonAt(ORR3D.jd), earthLonAt(ORR3D.jd));
    } catch (_) {}
  }

  /* ---------- 真实1:1模型：信息环改为“屏幕UI参照层”，不扭曲真实天体尺度 ---------- */
  function v135UiProj(lon, pxR) {
    const O = ORR3D,
      c0 = orr3dProj(0, 0, 0),
      wr = (O.dist / Math.max(1, O.focal)) * pxR,
      a = lon * D2R,
      p = orr3dProj(wr * Math.cos(a), wr * Math.sin(a), 0);
    return { x: p.x, y: p.y, cx: c0.x, cy: c0.y };
  }
  function v135UiPath(pxR, col, w, alpha) {
    const c = ORR3D.ctx;
    c.save();
    c.strokeStyle = col;
    c.lineWidth = w || 1;
    c.globalAlpha = alpha == null ? 1 : alpha;
    c.beginPath();
    for (let a = 0; a <= 360; a += 3) {
      const p = v135UiProj(a, pxR);
      if (a === 0) c.moveTo(p.x, p.y);
      else c.lineTo(p.x, p.y);
    }
    c.stroke();
    c.restore();
  }
  function v135UiTick(lon, r0, r1, col, w, alpha) {
    const c = ORR3D.ctx,
      p0 = v135UiProj(lon, r0),
      p1 = v135UiProj(lon, r1);
    c.save();
    c.strokeStyle = col;
    c.lineWidth = w || 1;
    c.globalAlpha = alpha == null ? 1 : alpha;
    c.beginPath();
    c.moveTo(p0.x, p0.y);
    c.lineTo(p1.x, p1.y);
    c.stroke();
    c.restore();
    return p1;
  }
  function v135UiLabel(lon, r, text, font, col, info, hits) {
    const c = ORR3D.ctx,
      p = v135UiProj(lon, r);
    c.save();
    c.font = font;
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.lineWidth = 3.2;
    c.strokeStyle = "rgba(5,7,13,.58)";
    c.fillStyle = col;
    c.strokeText(text, p.x, p.y);
    c.fillText(text, p.x, p.y);
    c.restore();
    if (info) hits.push({ x: p.x, y: p.y, r: 15, info });
  }
  function v135BirthMarker(hits) {
    try {
      if (typeof v127BirthCiv !== "function" || typeof v127ToJD !== "function") return null;
      const civ = v127BirthCiv();
      if (!civ) return null;
      const jd = v127ToJD(civ),
        lon = earthLonAt(jd),
        p = v135UiProj(lon, 246),
        c = ORR3D.ctx;
      c.save();
      c.fillStyle = "#ef756c";
      c.strokeStyle = "rgba(255,240,230,.86)";
      c.lineWidth = 1.1;
      c.beginPath();
      c.arc(p.x, p.y, 4.8, 0, Math.PI * 2);
      c.fill();
      c.stroke();
      c.font = "10.5px serif";
      c.textAlign = "center";
      c.fillStyle = "#ffb3aa";
      c.lineWidth = 3;
      c.strokeStyle = "rgba(4,7,12,.62)";
      c.strokeText("命主出生", p.x, p.y - 11);
      c.fillText("命主出生", p.x, p.y - 11);
      c.restore();
      hits.push({
        x: p.x,
        y: p.y - 6,
        r: 18,
        info: {
          type: "birth",
          name: "命主出生",
          html: `<div class="v135-layer-detail"><b>命主出生时刻定位</b><br>${v135Esc(v127BirthName ? v127BirthName() : "当前命主")} · ${civ.y}-${String(civ.m).padStart(2, "0")}-${String(civ.d).padStart(2, "0")} ${String(civ.h).padStart(2, "0")}:${String(civ.mi || 0).padStart(2, "0")}。<br>红点表示出生当天对应的地球公转方向，可与当前模拟日、节气、月份及黄道宫一起比较。</div>`,
        },
      });
      return lon;
    } catch (_) {
      return null;
    }
  }
  function v135DrawRealLayers() {
    const O = ORR3D,
      c = O.ctx;
    if (!c || O.mode !== "3d") return;
    const min = Math.min(O.cw, O.ch),
      base = Math.max(100, Math.min(150, min * 0.24)),
      gap = Math.max(25, Math.min(34, min * 0.052)),
      R = {
        z: base,
        t: base + gap,
        sm: base + gap * 2,
        x: base + gap * 3,
        gm: base + gap * 4,
        out: base + gap * 5,
      };
    const year = yearOfJD(O.jd),
      sunLon = sunLonAt(O.jd),
      earthLon = earthLonAt(O.jd),
      show = O.v131 || EARTH_RING_DEFAULTS,
      hits = [];
    O.layerHits = hits;
    v135UiPath(R.z, "rgba(193,162,92,.58)", 1, 0.92);
    v135UiPath(R.t, "rgba(205,181,127,.60)", 1, 0.92);
    v135UiPath(R.sm, "rgba(92,190,178,.50)", 1, 0.86);
    v135UiPath(R.x, "rgba(112,158,220,.44)", 1, 0.82);
    v135UiPath(R.gm, "rgba(197,140,96,.38)", 1, 0.78);
    v135UiPath(R.out, "rgba(220,214,197,.26)", 0.8, 0.68);
    if (O.show && O.show.zodiac) {
      for (let i = 0; i < 12; i++) {
        const lon = norm(i * 30 + 180),
          mid = norm(i * 30 + 15 + 180);
        v135UiTick(lon, R.z - 5, R.z + 5, "rgba(181,151,105,.62)", 0.9, 0.72);
        v135UiLabel(
          mid,
          R.z - 10,
          (typeof A2_GLYPH !== "undefined" ? A2_GLYPH[i] : "") + " " + AS_SIGN[i][0],
          "11.5px serif",
          O.zFocus === i ? "#f3da98" : "rgba(235,219,188,.96)",
          v135SignInfo(i),
          hits,
        );
      }
    }
    if (show.terms) {
      TERMS.forEach((t, i) => {
        const lon = norm(t[1] + 180);
        v135UiTick(
          lon,
          R.t - 6,
          R.t + (i % 3 === 0 ? 8 : 5),
          i % 3 === 0 ? "rgba(235,199,112,.96)" : "rgba(212,194,158,.76)",
          i % 3 === 0 ? 1.25 : 0.8,
          0.9,
        );
        if (i % 3 === 0 || min > 650)
          v135UiLabel(
            lon,
            R.t + 14,
            t[0],
            i % 3 === 0 ? "12px serif" : "10px serif",
            i % 3 === 0 ? "#f3da98" : "rgba(236,220,192,.92)",
            {
              type: "term",
              name: t[0],
              html: `<div class="v135-layer-detail"><b>节气 · ${t[0]}</b><br>太阳黄经 ${t[1]}°；在本 1:1 模型中，节气环是<b>屏幕 UI 参照层</b>，不参与真实空间比例。</div>`,
            },
            hits,
          );
      });
    }
    if (show.solarMonths) {
      SOLAR_MONTHS.forEach((m) => {
        const lon = norm(m[1] + 180);
        v135UiTick(lon, R.sm - 5, R.sm + 5, "rgba(92,195,182,.82)", 0.9, 0.82);
        v135UiLabel(
          lon,
          R.sm + 13,
          m[0],
          "10.5px serif",
          "rgba(120,231,218,.98)",
          v135SolarMonthInfo(m),
          hits,
        );
      });
    }
    if (show.xiuRing && typeof xiuTable === "function") {
      xiuTable(year).forEach((x) => {
        const lon = norm(x.s + x.w / 2 + 180);
        v135UiTick(lon, R.x - 4, R.x + 4, "rgba(124,167,225,.64)", 0.8, 0.72);
        v135UiLabel(
          lon,
          R.x + 12,
          x.n,
          "9.8px serif",
          "rgba(184,210,248,.98)",
          {
            type: "xiu",
            name: x.n,
            html: `<div class="v135-layer-detail"><b>二十八宿 · ${x.n}宿</b><br>当前版本按本页宿度表绘制，宿区中心约 ${norm(x.s + x.w / 2).toFixed(2)}°，宽度约 ${x.w.toFixed(2)}°。<br><span class="dim">宿度属于传统天文/星命参照，与现代 IAU 星座边界不是同一坐标分区。</span></div>`,
          },
          hits,
        );
      });
    }
    if (show.gregMonths) {
      gregMonthData(O.jd).forEach((m, i) => {
        v135UiTick(m.start, R.gm - 6, R.gm + 7, "rgba(190,160,116,.78)", 1, 0.78);
        v135UiLabel(
          m.center,
          R.gm + 14,
          m.name,
          "10.5px serif",
          "rgba(242,229,204,.98)",
          v135GregMonthInfo(m, i),
          hits,
        );
      });
    }
    if (show.dayRing) {
      gregDayTickData(O.jd).forEach((d) => {
        const a = d.monthStart ? R.out - 13 : d.major ? R.out - 9 : d.mid5 ? R.out - 6 : R.out - 3,
          b = R.out + (d.monthStart ? 4 : 1),
          col = d.monthStart
            ? "rgba(246,224,170,.92)"
            : d.major
              ? "rgba(224,208,181,.72)"
              : d.mid5
                ? "rgba(197,184,160,.55)"
                : "rgba(185,178,161,.27)";
        const p = v135UiTick(d.earth, a, b, col, d.monthStart ? 1.2 : d.major ? 0.9 : 0.5, 0.9);
        hits.push({ x: p.x, y: p.y, r: d.monthStart ? 6 : 4, info: v135DayInfo(d, O.jd) });
      });
    }
    const ep = v135UiProj(earthLon, R.out + 7);
    c.save();
    c.fillStyle = "#ffd56d";
    c.beginPath();
    c.arc(ep.x, ep.y, 5.3, 0, Math.PI * 2);
    c.fill();
    c.font = "11px serif";
    c.textAlign = "center";
    c.fillStyle = "#ffe4a0";
    c.lineWidth = 3;
    c.strokeStyle = "rgba(5,7,13,.62)";
    c.strokeText("当前地球", ep.x, ep.y - 12);
    c.fillText("当前地球", ep.x, ep.y - 12);
    c.restore();
    v135BirthMarker(hits);
    let note = document.getElementById("v135RealNote");
    const stage = document.querySelector("#orrMode3d .orr3d-stage");
    if (stage && !note) {
      note = document.createElement("div");
      note.id = "v135RealNote";
      note.className = "v135-real-note";
      stage.appendChild(note);
    }
    if (note)
      note.textContent =
        "真实1:1天体尺度保持不变 · 外围节气/月份/宿度/365日为屏幕 UI 参照层，不计入空间比例";
    updateMeta(sunLon, earthLon);
  }
  const _v135DrawLayers = window.drawEarthLayers3D;
  window.drawEarthLayers3D = function () {
    if (ORR3D.scaleModel === "real") return v135DrawRealLayers();
    return _v135DrawLayers.apply(this, arguments);
  };

  /* ---------- 所有主要环层均可点击：精简3D + 日心俯视 ---------- */
  function v135CompactHit(x, y) {
    let best = null,
      bd = 1e9;
    const year = yearOfJD(ORR3D.jd);
    function chk(lon, r, info, rad) {
      const p = projPt(lon, r),
        d = Math.hypot(x - p.x, y - p.y);
      if (d < (rad || 13) && d < bd) {
        bd = d;
        best = info;
      }
    }
    TERMS.forEach((t, i) =>
      chk(
        norm(t[1] + 180),
        i % 3 === 0 ? 248 : 242,
        {
          type: "term",
          name: t[0],
          html: `<div class="v135-layer-detail"><b>节气 · ${t[0]}</b><br>太阳黄经 ${t[1]}°；黄色径线表示该节气在地球公转参照环上的方向。</div>`,
        },
        15,
      ),
    );
    SOLAR_MONTHS.forEach((m) => chk(norm(m[1] + 180), 276, v135SolarMonthInfo(m), 14));
    gregMonthData(ORR3D.jd).forEach((m, i) => chk(m.center, 368, v135GregMonthInfo(m, i), 15));
    for (let i = 0; i < 12; i++) chk(norm(i * 30 + 15 + 180), 214, v135SignInfo(i), 16);
    if (typeof xiuTable === "function")
      xiuTable(year).forEach((x) =>
        chk(
          norm(x.s + x.w / 2 + 180),
          306,
          {
            type: "xiu",
            name: x.n,
            html: `<div class="v135-layer-detail"><b>二十八宿 · ${x.n}宿</b><br>宿区中心约 ${norm(x.s + x.w / 2).toFixed(2)}°，宽度约 ${x.w.toFixed(2)}°。</div>`,
          },
          13,
        ),
      );
    gregDayTickData(ORR3D.jd).forEach((d) => chk(d.earth, 356, v135DayInfo(d, ORR3D.jd), 4.8));
    return best;
  }
  function v135BindLayerClicks() {
    const cv = document.getElementById("orr3dCv");
    if (cv && !cv.dataset.v135click) {
      cv.dataset.v135click = "1";
      cv.addEventListener(
        "click",
        function (e) {
          const r = cv.getBoundingClientRect(),
            x = e.clientX - r.left,
            y = e.clientY - r.top;
          let info = null;
          if (ORR3D.scaleModel === "real") {
            let bd = 1e9;
            (ORR3D.layerHits || []).forEach((h) => {
              const d = Math.hypot(x - h.x, y - h.y);
              if (d < h.r && d < bd) {
                bd = d;
                info = h.info;
              }
            });
          } else info = v135CompactHit(x, y);
          if (info) {
            v135SetInfo(info);
            e.stopPropagation();
          }
        },
        true,
      );
    }
    const svg = document.getElementById("orrHelioSvg");
    if (svg && !svg.dataset.v135click) {
      svg.dataset.v135click = "1";
      svg.addEventListener(
        "click",
        function (e) {
          if (e.target.closest && e.target.closest("[data-planet]")) return;
          const rc = svg.getBoundingClientRect(),
            sx = ((e.clientX - rc.left) * 620) / rc.width,
            sy = ((e.clientY - rc.top) * 620) / rc.height,
            dx = sx - 310,
            dy = 310 - sy,
            rr = Math.hypot(dx, dy),
            lon = norm(Math.atan2(dy, dx) / D2R),
            year = yearOfJD(ORR3D.jd);
          let info = null;
          if (rr > 188 && rr < 212) {
            const i = ((Math.round((norm(lon - 180) - 15) / 30) % 12) + 12) % 12;
            info = v135SignInfo(i);
          } else if (rr >= 212 && rr < 236) {
            let b = TERMS[0],
              bd = 999;
            TERMS.forEach((t) => {
              const d = Math.abs(((norm(t[1] + 180) - lon + 540) % 360) - 180);
              if (d < bd) {
                bd = d;
                b = t;
              }
            });
            info = {
              type: "term",
              name: b[0],
              html: `<div class="v135-layer-detail"><b>节气 · ${b[0]}</b><br>太阳黄经 ${b[1]}°。</div>`,
            };
          } else if (rr >= 236 && rr < 252) {
            let b = SOLAR_MONTHS[0],
              bd = 999;
            SOLAR_MONTHS.forEach((m) => {
              const d = Math.abs(((norm(m[1] + 180) - lon + 540) % 360) - 180);
              if (d < bd) {
                bd = d;
                b = m;
              }
            });
            info = v135SolarMonthInfo(b);
          } else if (rr >= 252 && rr < 270 && typeof xiuTable === "function") {
            let b = null,
              bd = 999;
            xiuTable(year).forEach((x) => {
              const L = norm(x.s + x.w / 2 + 180),
                d = Math.abs(((L - lon + 540) % 360) - 180);
              if (d < bd) {
                bd = d;
                b = x;
              }
            });
            if (b)
              info = {
                type: "xiu",
                name: b.n,
                html: `<div class="v135-layer-detail"><b>二十八宿 · ${b.n}宿</b><br>宿区中心约 ${norm(b.s + b.w / 2).toFixed(2)}°。</div>`,
              };
          } else if (rr >= 270 && rr < 292) {
            let all = gregDayTickData(ORR3D.jd),
              b = all[0],
              bd = 999;
            all.forEach((d) => {
              const q = Math.abs(((d.earth - lon + 540) % 360) - 180);
              if (q < bd) {
                bd = q;
                b = d;
              }
            });
            info = v135DayInfo(b, ORR3D.jd);
          } else if (rr >= 292) {
            let gm = gregMonthData(ORR3D.jd),
              b = gm[0],
              bi = 0,
              bd = 999;
            gm.forEach((m, i) => {
              const q = Math.abs(((m.center - lon + 540) % 360) - 180);
              if (q < bd) {
                bd = q;
                b = m;
                bi = i;
              }
            });
            info = v135GregMonthInfo(b, bi);
          }
          if (info) {
            v135SetInfo(info);
            e.stopPropagation();
          }
        },
        true,
      );
    }
  }
  const _v135Bind = window.bindOrr3d;
  window.bindOrr3d = function () {
    const r = _v135Bind.apply(this, arguments);
    setTimeout(v135BindLayerClicks, 0);
    return r;
  };
  const _v135Mode = window.orr3dSetMode;
  window.orr3dSetMode = function (m) {
    const r = _v135Mode.apply(this, arguments);
    setTimeout(v135BindLayerClicks, 0);
    return r;
  };

  /* ---------- 星空精度专项说明 ---------- */
  function v135PrecisionPanel() {
    const ns = typeof XK_STARS !== "undefined" ? XK_STARS.length : 0,
      nc = typeof XK3_CONST !== "undefined" ? XK3_CONST.length : 0;
    return `<div class="v135-precision"><h3>星空 / 星座精度说明</h3><div class="v135-precision-grid"><div><b class="good">恒星位置 · 可作为当前星空定位依据</b>当前内置亮星表 ${ns} 颗，使用 J2000 赤经/赤纬坐标，并通过页面的岁差函数换算到模拟日期；再结合观测经纬度和恒星时转为地平坐标。</div><div><b class="part">星座连线 · 识别骨架，不是官方边界</b>当前 3D 全天球绘制 ${nc} 组主要星座识别线，其中含黄道十二星座与若干常见星座。IAU 官方定义的是 88 个“天空区域边界”，星座连线本身并没有唯一官方画法。</div><div><b>精度边界</b>亮星方向与时空旋转属于天文坐标层；“把哪些星连成什么形状”属于图示层。后续若加入完整 IAU 88 星座边界，应作为独立边界图层，而不替换现有识别线。</div></div><p class="note">校核参考：IAU《The Constellations》使用 J2000 边界坐标定义 88 星座；Hipparcos / Tycho 星表提供高精度恒星位置与自行资料。当前单文件版没有伪装成“完整 IAU 边界图”。</p></div>`;
  }
  try {
    const _rx = renderXingkong;
    renderXingkong = function (R0) {
      return _rx(R0) + v135PrecisionPanel();
    };
    window.renderXingkong = renderXingkong;
  } catch (_) {}

  /* 更新时间与版本 */
  window.addEventListener("load", function () {
    try {
      v135BindLayerClicks();
      const bv = document.getElementById("buildVersion");

      window.TianjiSystemV135 = {
        version: "v135",
        build: V135_BUILD,
        realScaleUiRings: true,
        allLayerClicks: true,
        skyAccuracyAudit: true,
        birthOrbitMarker: true,
      };
    } catch (_) {}
  });
})();
