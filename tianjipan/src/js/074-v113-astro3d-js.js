(function () {
  "use strict";
  var BUILD = "2026-10-04 12:33:14";
  if (
    typeof ORR3D === "undefined" ||
    typeof SEM3D === "undefined" ||
    typeof orr3dHTML !== "function" ||
    typeof asHelio !== "function"
  ) {
    try {
      console.warn("[v113 Astro3D] base 3D module unavailable");
    } catch (_) {}
    return;
  }

  /* ------------------------------------------------------------------
   v6.8 的流畅核心沿用思路：
   Canvas 2D + 自写透视投影，不引入 Three.js / WebGL。
   v113 增加：
   1) 精简模型：对数距离，天体可视增强，运动时轻量星空；
   2) 真实模型：线性真实距离 + 同比例天体半径，定位环仅为 UI；
   3) 静止时真实星空做离屏缓存；拖动/自动旋转时退化到轻量星点；
   4) 主循环恢复到约 60fps，而不是 v112 的 30/24fps 主动限帧。
   ------------------------------------------------------------------ */
  var AU_KM = 149597870.7;
  var REAL_AU_UNIT = 1000; // 1 AU -> 1000 world units（只定义画布世界单位；比例仍为线性）
  var SEM_KM_UNIT = 1 / 100000; // 100,000 km -> 1 world unit
  var SUN_R_KM = 695700;
  var MOON_R_KM = 1737.4;
  var BODY_R_KM = {
    水星: 2439.7,
    金星: 6051.8,
    地球: 6371.0,
    火星: 3389.5,
    木星: 69911,
    土星: 58232,
    天王星: 25362,
    海王星: 24622,
    冥王星: 1188.3,
  };
  var OLD113 = {
    html: orr3dHTML,
    bind: bindOrr3d,
    setMode: orr3dSetMode,
    info: orr3dInfo,
    draw: orr3dDraw,
    semDraw: sem3dDraw,
    semReset: sem3dReset,
    camDolly: camDolly,
    orbitData: orr3dOrbitData,
    grid: orr3dGrid,
    axes: orr3dAxes,
    zodiac: orr3dZodiac,
  };

  /* 真实比例需要更小的近裁剪面；精简模型仍沿用旧投影。 */
  var OLD_ORR3D_PROJ = orr3dProj,
    OLD_SEM3D_PROJ = sem3dProj;
  orr3dProj = function (x, y, z) {
    if (ORR3D.scaleModel !== "real") return OLD_ORR3D_PROJ(x, y, z);
    var O = ORR3D;
    x -= O.tx;
    y -= O.ty;
    z -= O.tz;
    var cy = Math.cos(O.yaw),
      sy = Math.sin(O.yaw),
      x1 = x * cy - y * sy,
      y1 = x * sy + y * cy,
      z1 = z,
      cp = Math.cos(O.pitch),
      sp = Math.sin(O.pitch),
      y2 = y1 * cp - z1 * sp,
      z2 = y1 * sp + z1 * cp,
      depth = O.dist + y2;
    if (depth < 0.018) depth = 0.018;
    var sc = O.focal / depth;
    return { x: O.cw / 2 + x1 * sc, y: O.ch / 2 - z2 * sc, s: sc, depth: depth };
  };
  sem3dProj = function (x, y, z) {
    if (ORR3D.scaleModel !== "real") return OLD_SEM3D_PROJ(x, y, z);
    var O = SEM3D;
    x -= O.tx;
    y -= O.ty;
    z -= O.tz;
    var cy = Math.cos(O.yaw),
      sy = Math.sin(O.yaw),
      x1 = x * cy - y * sy,
      y1 = x * sy + y * cy,
      z1 = z,
      cp = Math.cos(O.pitch),
      sp = Math.sin(O.pitch),
      y2 = y1 * cp - z1 * sp,
      z2 = y1 * sp + z1 * cp,
      depth = O.dist + y2;
    if (depth < 0.025) depth = 0.025;
    var sc = O.focal / depth;
    return { x: O.cw / 2 + x1 * sc, y: O.ch / 2 - z2 * sc, s: sc, d: depth };
  };

  ORR3D.scaleModel = ORR3D.scaleModel || "compact";
  ORR3D.show.locator = ORR3D.show.locator !== false;
  ORR3D._interacting = false;
  ORR3D._motionUntil = 0;
  ORR3D._skyLayer = null;
  ORR3D._skyKey = "";
  SEM3D.scaleModel = ORR3D.scaleModel;
  SEM3D.realView = SEM3D.realView || "full";
  SEM3D._interacting = false;
  SEM3D._motionUntil = 0;
  SEM3D._skyLayer = null;
  SEM3D._skyKey = "";

  /* ---------- UI 注入 ---------- */
  orr3dHTML = function () {
    var h = OLD113.html.apply(this, arguments);
    var bar =
      '<div class="orr-scale-bar" id="orrScaleBar"><span class="lab">空间模型</span>' +
      '<button type="button" class="chip" data-orr-scale="compact">精简模型</button>' +
      '<button type="button" class="chip" data-orr-scale="real">真实模型 · 1:1</button>' +
      '<label class="orr-real-only" id="orrLocatorWrap"><input type="checkbox" id="orr3dLocator" checked> 定位标记</label>' +
      '<span class="orr-scale-read" id="orrScaleRead"></span></div>';
    h = h.replace('<div class="orr3d-ctl">', bar + '<div class="orr3d-ctl">');
    h = h.replace(
      '<div class="sem3d-tools">',
      '<div class="sem3d-tools"><span class="sem-real-ctl orr-real-only" id="semRealCtl"><label>真实视野 <select id="semRealView"><option value="full">日地全景</option><option value="earthmoon">地月系统</option><option value="earth">地球近景</option></select></label></span>',
    );
    h = h.replace(
      "J2000 黄道坐标 · 真相机推进 / 拉远 · 恒星天球 / 星座 / 二十八宿",
      "J2000 黄道坐标 · 精简/真实 1:1 双模型 · Canvas 轻量透视",
    );
    h = h.replace(
      "同源联动 · 恒星天球背景 · 星座 / 二十八宿 · 与下方“日月天象图解”共享数据",
      "同源联动 · 精简/真实 1:1 双模型 · 与下方“日月天象图解”共享数据",
    );
    return h;
  };

  /* ---------- 通用绘图 / 星空缓存 ---------- */
  function v113Bg(O) {
    var c = O.ctx,
      W = O.cw,
      H = O.ch;
    if (!c) return;
    var g = c.createRadialGradient(W * 0.5, H * 0.46, 10, W * 0.5, H * 0.5, Math.max(W, H) * 0.72);
    g.addColorStop(0, "#151321");
    g.addColorStop(1, "#05060a");
    c.fillStyle = g;
    c.fillRect(0, 0, W, H);
  }
  function v113SimpleStars(O) {
    var c = O.ctx,
      W = O.cw,
      H = O.ch;
    if (!c) return;
    if (!O._v113Stars || O._v113StarsW !== W || O._v113StarsH !== H) {
      O._v113Stars = [];
      O._v113StarsW = W;
      O._v113StarsH = H;
      var seed = 2166136261 >>> 0;
      function rnd() {
        seed ^= seed << 13;
        seed ^= seed >>> 17;
        seed ^= seed << 5;
        return ((seed >>> 0) % 100000) / 100000;
      }
      for (var i = 0; i < 260; i++)
        O._v113Stars.push([rnd() * W, rnd() * H, 0.16 + rnd() * 0.58, rnd() < 0.08 ? 1.7 : 1]);
    }
    c.save();
    c.fillStyle = "#e6edf8";
    for (var j = 0; j < O._v113Stars.length; j++) {
      var s = O._v113Stars[j];
      c.globalAlpha = s[2];
      c.fillRect(s[0], s[1], s[3], s[3]);
    }
    c.restore();
  }
  function v113SkyOptions(O) {
    return {
      stars: !!O.show.skyStars,
      constell: !!O.show.skyConst,
      constName: !!O.show.skyConstName,
      xiu: !!O.show.skyXiu,
      labels: !!O.show.skyLabels,
    };
  }
  function v113Sky(O, jd) {
    var opt = v113SkyOptions(O),
      moving = O._interacting || O.autoRot || performance.now() < (O._motionUntil || 0);
    if (moving) {
      /* v118：交互时不再把星座背景完全隐藏。恒星保留轻量星点，星座/二十八宿用低分辨率半透明层持续跟随旋转。 */
      if (opt.stars) v113SimpleStars(O);
      if ((opt.constell || opt.constName || opt.xiu) && typeof astroSkyDraw === "function") {
        try {
          var sc = 0.56,
            mw = Math.max(1, Math.round(O.cw * sc)),
            mh = Math.max(1, Math.round(O.ch * sc));
          if (
            !O._v118MotionSky ||
            O._v118MotionSky.width !== mw ||
            O._v118MotionSky.height !== mh
          ) {
            O._v118MotionSky = document.createElement("canvas");
            O._v118MotionSky.width = mw;
            O._v118MotionSky.height = mh;
          }
          var mx = O._v118MotionSky.getContext("2d");
          if (mx) {
            mx.setTransform(1, 0, 0, 1, 0, 0);
            mx.clearRect(0, 0, mw, mh);
            mx.setTransform(sc, 0, 0, sc, 0, 0);
            var sh = Object.create(O);
            sh.ctx = mx;
            sh.cw = O.cw;
            sh.ch = O.ch;
            astroSkyDraw(sh, jd, {
              stars: false,
              constell: opt.constell,
              constName: opt.constName,
              xiu: opt.xiu,
              labels: false,
            });
            O.ctx.save();
            O.ctx.globalAlpha = 0.3;
            O.ctx.drawImage(O._v118MotionSky, 0, 0, mw, mh, 0, 0, O.cw, O.ch);
            O.ctx.restore();
          }
        } catch (e) {}
      }
      return;
    }
    if (!opt.stars && !opt.constell && !opt.constName && !opt.xiu) return;
    if (typeof astroSkyDraw !== "function") {
      if (opt.stars) v113SimpleStars(O);
      return;
    }
    var dpr = Math.max(1, Math.min(2, O.cv && O.cw ? O.cv.width / O.cw : 1));
    var key = [
      Math.round(O.cw),
      Math.round(O.ch),
      Math.round(O.yaw * 300),
      Math.round(O.pitch * 300),
      Math.floor(jd / 30),
      opt.stars ? 1 : 0,
      opt.constell ? 1 : 0,
      opt.constName ? 1 : 0,
      opt.xiu ? 1 : 0,
      opt.labels ? 1 : 0,
    ].join("|");
    if (!O._skyLayer || O._skyKey !== key) {
      var off = document.createElement("canvas");
      off.width = Math.max(1, Math.round(O.cw * dpr));
      off.height = Math.max(1, Math.round(O.ch * dpr));
      var x = off.getContext("2d");
      if (!x) {
        if (opt.stars) v113SimpleStars(O);
        return;
      }
      x.setTransform(dpr, 0, 0, dpr, 0, 0);
      var shadow = Object.create(O);
      shadow.ctx = x;
      shadow.cw = O.cw;
      shadow.ch = O.ch;
      try {
        astroSkyDraw(shadow, jd, opt);
        O._skyLayer = off;
        O._skyKey = key;
      } catch (e) {
        O._skyLayer = null;
        O._skyKey = "";
        if (opt.stars) v113SimpleStars(O);
        return;
      }
    }
    if (O._skyLayer)
      O.ctx.drawImage(O._skyLayer, 0, 0, O._skyLayer.width, O._skyLayer.height, 0, 0, O.cw, O.ch);
  }
  function v113InvalidateSky(O) {
    O._skyKey = "";
    O._skyLayer = null;
  }

  /* ---------- 太阳系坐标与真实尺寸 ---------- */
  function v113WorldPos(name, T) {
    var h = asHelio(name, T);
    if (ORR3D.scaleModel === "real")
      return {
        x: h.x * REAL_AU_UNIT,
        y: h.y * REAL_AU_UNIT,
        z: h.z * REAL_AU_UNIT,
        r: Math.hypot(h.x, h.y, h.z),
        raw: h,
      };
    var q = orr3dCompress(h);
    q.raw = h;
    return q;
  }
  function v113WorldRadiusKm(km) {
    return (km / AU_KM) * REAL_AU_UNIT;
  }
  function v113TrueBall(c, p, r, lit, mid, dark) {
    if (!isFinite(r) || r < 0.08) return;
    var rr = Math.max(0.08, r),
      g = c.createRadialGradient(
        p.x - rr * 0.35,
        p.y - rr * 0.38,
        Math.max(0.01, rr * 0.12),
        p.x,
        p.y,
        rr,
      );
    g.addColorStop(0, lit);
    g.addColorStop(0.58, mid);
    g.addColorStop(1, dark);
    c.fillStyle = g;
    c.beginPath();
    c.arc(p.x, p.y, rr, 0, Math.PI * 2);
    c.fill();
  }
  function v113Locator(c, p, name, sel, col) {
    if (!ORR3D.show.locator) return;
    c.save();
    c.strokeStyle = sel ? "rgba(246,220,148,.95)" : col || "rgba(220,225,235,.52)";
    c.lineWidth = sel ? 1.6 : 1;
    c.setLineDash(sel ? [4, 3] : [2, 3]);
    c.beginPath();
    c.arc(p.x, p.y, sel ? 8 : 5, 0, Math.PI * 2);
    c.stroke();
    c.beginPath();
    c.moveTo(p.x - 3, p.y);
    c.lineTo(p.x + 3, p.y);
    c.moveTo(p.x, p.y - 3);
    c.lineTo(p.x, p.y + 3);
    c.stroke();
    c.restore();
  }
  function v113FocusSolar(name, keepAngles) {
    var O = ORR3D,
      T = (O.jd - 2451545) / 36525,
      h = asHelio(name, T),
      rkm = BODY_R_KM[name] || 6371;
    O.selected = name;
    O.tx = h.x * REAL_AU_UNIT;
    O.ty = h.y * REAL_AU_UNIT;
    O.tz = h.z * REAL_AU_UNIT;
    O.dist = Math.max(0.18, v113WorldRadiusKm(rkm) * 42);
    O.minDist = 0.03;
    if (!keepAngles) {
      O.yaw = -0.62;
      O.pitch = 0.82;
    }
    v113InvalidateSky(O);
    try {
      orr3dDraw();
      orr3dInfo();
    } catch (_) {}
  }
  function v113ResetSolar() {
    var O = ORR3D;
    if (O.scaleModel === "real") {
      O.yaw = -0.62;
      O.pitch = 0.82;
      O.dist = 56000;
      O.minDist = 0.03;
      O.tx = O.ty = O.tz = 0;
    } else {
      O.yaw = -0.62;
      O.pitch = 0.82;
      O.dist = 720;
      O.minDist = 310;
      O.tx = O.ty = O.tz = 0;
    }
    v113InvalidateSky(O);
    orr3dDraw();
  }

  /* 轨道：真实模型直接用 asHelio() 的 AU 坐标线性映射；精简模型维持原对数压缩 */
  orr3dOrbitData = function (name, T) {
    var O = ORR3D,
      yr = Math.floor((O.jd - 2451545) / 365.25),
      key = O.scaleModel + "|" + yr,
      cache = O.orbitCache;
    if (cache.key !== key) {
      cache.key = key;
      cache.data = {};
    }
    if (cache.data[name]) return cache.data[name];
    var P = ORR3D_PLANETS[name],
      N = O.scaleModel === "real" ? (P.period > 20000 ? 260 : P.period > 3000 ? 220 : 170) : 112,
      a = [];
    for (var i = 0; i <= N; i++) {
      var tt = T + (P.period * (i / N)) / 36525,
        h = asHelio(name, tt);
      if (O.scaleModel === "real")
        a.push({ x: h.x * REAL_AU_UNIT, y: h.y * REAL_AU_UNIT, z: h.z * REAL_AU_UNIT });
      else a.push(orr3dCompress(h));
    }
    return (cache.data[name] = a);
  };

  /* ---------- 网格 / 轴 / 黄道 ---------- */
  orr3dGrid = function () {
    var O = ORR3D,
      c = O.ctx;
    if (!O.show.grid) return;
    if (O.scaleModel !== "real") return OLD113.grid();
    var rings = [0.4, 0.7, 1, 1.5, 5, 10, 20, 30, 40];
    c.save();
    c.font = "10px sans-serif";
    c.fillStyle = "rgba(190,178,145,.55)";
    c.textAlign = "left";
    for (var ri = 0; ri < rings.length; ri++) {
      var au = rings[ri],
        rr = au * REAL_AU_UNIT,
        pts = [];
      for (var i = 0; i <= 120; i++) {
        var a = (i / 120) * Math.PI * 2;
        pts.push({ x: rr * Math.cos(a), y: rr * Math.sin(a), z: 0 });
      }
      orr3dPath(pts, "rgba(210,205,190,.12)", 1, null, 1);
      var lp = orr3dProj(rr * Math.cos(0.25), rr * Math.sin(0.25), 0);
      if (lp.depth > 0) c.fillText(au + " AU", lp.x + 3, lp.y - 2);
    }
    c.restore();
  };
  orr3dAxes = function () {
    var O = ORR3D;
    if (O.scaleModel !== "real") return OLD113.axes();
    if (!O.show.axes) return;
    var c = O.ctx,
      L = 45 * REAL_AU_UNIT;
    c.save();
    c.lineWidth = 1;
    c.setLineDash([5, 5]);
    var a = orr3dProj(-L, 0, 0),
      b = orr3dProj(L, 0, 0);
    c.strokeStyle = "rgba(208,80,59,.48)";
    c.beginPath();
    c.moveTo(a.x, a.y);
    c.lineTo(b.x, b.y);
    c.stroke();
    var c1 = orr3dProj(0, -L, 0),
      d = orr3dProj(0, L, 0);
    c.strokeStyle = "rgba(95,169,234,.38)";
    c.beginPath();
    c.moveTo(c1.x, c1.y);
    c.lineTo(d.x, d.y);
    c.stroke();
    c.restore();
  };
  orr3dZodiac = function () {
    var O = ORR3D;
    if (O.scaleModel !== "real") return OLD113.zodiac();
    if (!O.show.zodiac) return;
    var c = O.ctx,
      names = [
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
      ],
      R = 43 * REAL_AU_UNIT;
    c.save();
    c.font = "10px sans-serif";
    c.textAlign = "center";
    c.fillStyle = "rgba(228,220,198,.58)";
    for (var k = 0; k < 12; k++) {
      var a = (k * 30 + 15) * D2R,
        p = orr3dProj(R * Math.cos(a), R * Math.sin(a), 0);
      if (p.depth > 0) c.fillText(names[k], p.x, p.y);
    }
    c.restore();
  };

  /* ---------- 太阳系主绘制：60fps 友好 ---------- */
  orr3dDraw = function () {
    var O = ORR3D,
      c = O.ctx,
      W = O.cw,
      H = O.ch;
    if (!c || !W || !H) return;
    c.clearRect(0, 0, W, H);
    v113Bg(O);
    v113Sky(O, O.jd);
    orr3dGrid();
    orr3dAxes();
    orr3dZodiac();
    var T = (O.jd - 2451545) / 36525,
      names = O.show.pluto ? ORR3D_NAMES : ORR3D_NAMES.slice(0, 8);
    if (O.show.orbits) {
      for (var oi = 0; oi < names.length; oi++) {
        var n = names[oi],
          sel = n === O.selected;
        orr3dPath(
          orr3dOrbitData(n, T),
          sel ? "rgba(228,199,127,.74)" : "rgba(210,205,190,.19)",
          sel ? 1.6 : 1,
          null,
          1,
        );
      }
    }
    var sun = orr3dProj(0, 0, 0);
    if (O.scaleModel === "real") {
      var sr = v113WorldRadiusKm(SUN_R_KM) * sun.s;
      if (sr > 0.08) {
        var glow = c.createRadialGradient(sun.x, sun.y, 0, sun.x, sun.y, Math.max(sr * 5, 2));
        glow.addColorStop(0, "rgba(255,220,115,.48)");
        glow.addColorStop(1, "rgba(255,190,70,0)");
        c.fillStyle = glow;
        c.beginPath();
        c.arc(sun.x, sun.y, Math.max(sr * 5, 2), 0, Math.PI * 2);
        c.fill();
      }
      v113TrueBall(c, sun, sr, "#fff8ce", "#f6cd5b", "#d58d20");
      v113Locator(c, sun, "太阳", false, "rgba(246,210,100,.7)");
    } else {
      var gl = c.createRadialGradient(sun.x, sun.y, 5, sun.x, sun.y, 54);
      gl.addColorStop(0, "rgba(255,220,115,.45)");
      gl.addColorStop(1, "rgba(255,200,80,0)");
      c.fillStyle = gl;
      c.beginPath();
      c.arc(sun.x, sun.y, 54, 0, Math.PI * 2);
      c.fill();
      orr3dBall(sun.x, sun.y, 12 * sun.s, "#fff8ce", "#f6cd5b", "#d58d20");
    }
    var list = [];
    for (var i = 0; i < names.length; i++) {
      var name = names[i],
        h = asHelio(name, T),
        r = Math.hypot(h.x, h.y, h.z),
        v = v113WorldPos(name, T),
        p = orr3dProj(v.x, v.y, v.z);
      list.push({ name: name, h: h, r: r, v: v, p: p, m: ORR3D_PLANETS[name] });
    }
    list.sort(function (a, b) {
      return b.p.depth - a.p.depth;
    });
    O.hits = [];
    for (var pi = 0; pi < list.length; pi++) {
      var q = list[pi],
        selected = q.name === O.selected,
        rr;
      if (O.scaleModel === "real") {
        rr = v113WorldRadiusKm(BODY_R_KM[q.name] || 3000) * q.p.s;
        v113TrueBall(c, q.p, rr, "#fff", q.m.c1, q.m.c2);
        if (q.name === "土星" && rr > 0.22) {
          c.save();
          c.strokeStyle = "rgba(236,219,178,.64)";
          c.lineWidth = Math.max(0.35, rr * 0.18);
          c.beginPath();
          c.ellipse(q.p.x, q.p.y, rr * 2.05, rr * 0.72, -0.25, 0, Math.PI * 2);
          c.stroke();
          c.restore();
        }
        v113Locator(c, q.p, q.name, selected, q.m.c1);
      } else {
        /* v118：近距离缩放时让天体随透视真实放大，仍限制上限避免覆盖整幅画面。 */
        rr = q.m.size * Math.max(0.72, Math.min(10, q.p.s));
        if (selected) {
          c.save();
          c.strokeStyle = "rgba(246,220,148,.8)";
          c.lineWidth = 1.4;
          c.setLineDash([4, 4]);
          c.beginPath();
          c.arc(q.p.x, q.p.y, rr + 8, 0, Math.PI * 2);
          c.stroke();
          c.restore();
        }
        orr3dBall(q.p.x, q.p.y, rr, "#fff", q.m.c1, q.m.c2);
        if (q.name === "土星") {
          c.save();
          c.strokeStyle = "rgba(236,219,178,.62)";
          c.lineWidth = 1.2;
          c.beginPath();
          c.ellipse(q.p.x, q.p.y, rr * 1.9, rr * 0.56, -0.25, 0, Math.PI * 2);
          c.stroke();
          c.restore();
        }
      }
      if (O.show.labels) {
        c.save();
        c.font = (selected ? "600 " : "") + "11px sans-serif";
        c.textAlign = "center";
        c.fillStyle = selected ? "#f3dc9a" : "#d8d5cc";
        c.fillText(q.m.g + " " + q.name, q.p.x, q.p.y - Math.max(8, rr) - 7);
        c.restore();
      }
      O.hits.push({
        name: q.name,
        x: q.p.x,
        y: q.p.y,
        r: Math.max(10, (isFinite(rr) ? rr : 0) + 7),
      });
    }
    if (O.show.labels) {
      c.save();
      c.font = "11px sans-serif";
      c.textAlign = "center";
      c.fillStyle = "#efd178";
      c.fillText("☉ 太阳", sun.x, sun.y + 28);
      c.restore();
    }
  };

  /* ---------- 日 · 地 · 月真实比例 ---------- */
  function v113SemData(jd) {
    var sun = smSun(jd),
      moon = smMoon(jd),
      T = (jd - 2451545) / 36525,
      eh = asHelio("地球", T),
      sunAU = Math.hypot(eh.x, eh.y, eh.z);
    var skm = sunAU * AU_KM,
      sa = sun.lon * D2R,
      S = { x: skm * Math.cos(sa) * SEM_KM_UNIT, y: skm * Math.sin(sa) * SEM_KM_UNIT, z: 0 };
    var mkm = moon.dist * 6378.14,
      ml = moon.lon * D2R,
      mb = moon.lat * D2R,
      cb = Math.cos(mb),
      M = {
        x: mkm * cb * Math.cos(ml) * SEM_KM_UNIT,
        y: mkm * cb * Math.sin(ml) * SEM_KM_UNIT,
        z: mkm * Math.sin(mb) * SEM_KM_UNIT,
      };
    return {
      sun: sun,
      moon: moon,
      S: S,
      E: { x: 0, y: 0, z: 0 },
      M: M,
      sunKm: skm,
      moonKm: mkm,
      phase: smPhase(moon.lon, sun.lon),
    };
  }
  function v113SemLocator(c, p, label, col) {
    if (!ORR3D.show.locator) return;
    c.save();
    c.strokeStyle = col;
    c.lineWidth = 1;
    c.setLineDash([3, 3]);
    c.beginPath();
    c.arc(p.x, p.y, 6, 0, Math.PI * 2);
    c.stroke();
    c.beginPath();
    c.moveTo(p.x - 3, p.y);
    c.lineTo(p.x + 3, p.y);
    c.moveTo(p.x, p.y - 3);
    c.lineTo(p.x, p.y + 3);
    c.stroke();
    c.restore();
  }
  function v113SemSetView(view) {
    var O = SEM3D,
      D = v113SemData((ORR3D && ORR3D.jd) || smJD(new Date()));
    O.realView = view || "full";
    O.yaw = -0.62;
    O.pitch = 0.58;
    if (O.realView === "earthmoon") {
      O.tx = O.ty = O.tz = 0;
      O.dist = Math.max(7, D.moonKm * SEM_KM_UNIT * 2.2);
      O.minDist = 0.25;
    } else if (O.realView === "earth") {
      O.tx = O.ty = O.tz = 0;
      O.dist = 1.8;
      O.minDist = 0.08;
    } else {
      O.tx = D.S.x * 0.5;
      O.ty = D.S.y * 0.5;
      O.tz = D.S.z * 0.5;
      O.dist = Math.max(2200, D.sunKm * SEM_KM_UNIT * 1.75);
      O.minDist = 0.25;
    }
    v113InvalidateSky(O);
    try {
      sem3dDraw();
    } catch (_) {}
  }
  sem3dReset = function () {
    if (ORR3D.scaleModel === "real") return v113SemSetView(SEM3D.realView || "full");
    SEM3D.yaw = -0.62;
    SEM3D.pitch = 0.58;
    SEM3D.dist = 660;
    SEM3D.minDist = 285;
    SEM3D.tx = SEM3D.ty = SEM3D.tz = 0;
    v113InvalidateSky(SEM3D);
    sem3dDraw();
  };
  function v113SemRealDraw() {
    var O = SEM3D,
      c = O.ctx;
    if (!c || !O.cw) return;
    var W = O.cw,
      H = O.ch,
      jd = (ORR3D && ORR3D.jd) || smJD(new Date()),
      D = v113SemData(jd);
    c.clearRect(0, 0, W, H);
    v113Bg(O);
    v113Sky(O, jd);
    var sun = D.sun,
      moon = D.moon,
      E = D.E,
      S = D.S,
      M = D.M,
      eps = sun.eps,
      d = jd - 2451543.5,
      node = smN360(125.1228 - 0.0529538083 * d);
    var view = O.realView || "full",
      refR = view === "full" ? D.sunKm * SEM_KM_UNIT : Math.max(5, D.moonKm * SEM_KM_UNIT * 1.25);
    if (O.show.ecl) {
      var ring = sem3dCircle(refR, 0, 0);
      sem3dPath(ring, "rgba(210,170,85,.50)", 1.2, null, 0.78);
    }
    if (O.show.lun) {
      var mr = D.moonKm * SEM_KM_UNIT,
        pts = [],
        inc = 5.145 * D2R,
        N = node * D2R;
      for (var k = 0; k <= 120; k++) {
        var u = (k / 120) * Math.PI * 2,
          cu = Math.cos(u),
          su = Math.sin(u),
          x = mr * (Math.cos(N) * cu - Math.sin(N) * su * Math.cos(inc)),
          y = mr * (Math.sin(N) * cu + Math.cos(N) * su * Math.cos(inc)),
          z = mr * su * Math.sin(inc);
        pts.push({ x: x, y: y, z: z });
      }
      sem3dPath(pts, "rgba(98,205,195,.72)", 1.2, [5, 4], 1);
    }
    if (O.show.eq) {
      var eqR = view === "full" ? Math.min(refR * 0.7, D.sunKm * SEM_KM_UNIT * 0.7) : refR * 0.92;
      sem3dPath(sem3dCircle(eqR, eps, 0), "rgba(95,127,190,.52)", 1, [6, 4], 1);
    }
    if (O.show.vec) {
      sem3dPath([E, S], "rgba(242,183,60,.48)", 1.15, [4, 4], 1);
      sem3dPath([E, M], "rgba(230,232,239,.58)", 1.2, null, 1);
    }
    if (O.show.axis) {
      var axL =
        view === "earth"
          ? 0.8
          : view === "earthmoon"
            ? D.moonKm * SEM_KM_UNIT * 0.45
            : D.sunKm * SEM_KM_UNIT * 0.12;
      var ax = { x: 0, y: -Math.sin(eps * D2R) * axL, z: Math.cos(eps * D2R) * axL };
      sem3dPath([{ x: 0, y: 0, z: 0 }, ax], "rgba(220,225,235,.72)", 1.4, null, 1);
    }
    var bodies = [
      { n: "太阳", p: S, km: SUN_R_KM, c1: "#fff0a5", c2: "#d89020", col: "rgba(246,200,80,.75)" },
      { n: "地球", p: E, km: 6371, c1: "#8dc8ff", c2: "#285e91", col: "rgba(105,180,240,.8)" },
      {
        n: "月亮",
        p: M,
        km: MOON_R_KM,
        c1: "#f0eee7",
        c2: "#737b8d",
        col: "rgba(220,225,235,.75)",
      },
    ]
      .map(function (o) {
        o.v = sem3dProj(o.p.x, o.p.y, o.p.z);
        return o;
      })
      .sort(function (a, b) {
        return b.v.d - a.v.d;
      });
    var labelItems = [];
    for (var i = 0; i < bodies.length; i++) {
      var o = bodies[i],
        rr = o.km * SEM_KM_UNIT * o.v.s;
      v113TrueBall(c, o.v, rr, o.c1, o.c1, o.c2);
      v113SemLocator(c, o.v, o.n, o.col);
      if (O.show.lab)
        labelItems.push({
          n: o.n,
          bx: o.v.x,
          by: o.v.y,
          rr: rr,
          x: o.v.x,
          y: o.v.y - Math.max(8, rr) - 9,
        });
    }
    if (O.show.lab) {
      /* v122：真实模型标签碰撞避让。地球/月亮靠得很近时，标签分向两侧并用引线指回天体。 */
      for (var li = 0; li < labelItems.length; li++)
        for (var lj = li + 1; lj < labelItems.length; lj++) {
          var A = labelItems[li],
            B = labelItems[lj];
          if (Math.abs(A.x - B.x) < 72 && Math.abs(A.y - B.y) < 22) {
            var left = A.bx <= B.bx ? A : B,
              right = A.bx <= B.bx ? B : A;
            left.x -= 32;
            left.y -= 10;
            right.x += 32;
            right.y += 11;
          }
        }
      c.save();
      c.font = "11px sans-serif";
      c.textAlign = "center";
      c.textBaseline = "middle";
      labelItems.forEach(function (L) {
        L.x = Math.max(34, Math.min(W - 34, L.x));
        L.y = Math.max(14, Math.min(H - 14, L.y));
        var tw = c.measureText(L.n).width + 10;
        c.strokeStyle = "rgba(220,225,235,.34)";
        c.lineWidth = 0.8;
        c.beginPath();
        c.moveTo(L.bx, L.by - Math.max(5, L.rr));
        c.lineTo(L.x, L.y + 7);
        c.stroke();
        c.fillStyle = "rgba(4,8,14,.72)";
        c.beginPath();
        if (c.roundRect) c.roundRect(L.x - tw / 2, L.y - 8, tw, 16, 4);
        else c.rect(L.x - tw / 2, L.y - 8, tw, 16);
        c.fill();
        c.fillStyle = "#e7e1d3";
        c.fillText(L.n, L.x, L.y);
      });
      c.restore();
    }
    if (O.show.lab) {
      c.save();
      c.font = "10px sans-serif";
      c.fillStyle = "rgba(230,220,195,.72)";
      c.textAlign = "left";
      c.fillText("真实线性距离 · 天体半径同尺度", 12, H - 27);
      c.fillText(
        "日地 " +
          (D.sunKm / 1e6).toFixed(2) +
          " 百万km · 地月 " +
          Math.round(D.moonKm).toLocaleString("zh-CN") +
          " km",
        12,
        H - 12,
      );
      c.restore();
    }
  }
  sem3dDraw = function () {
    if (ORR3D.scaleModel === "real") return v113SemRealDraw();
    return OLD113.semDraw.apply(this, arguments);
  };

  /* ---------- 相机：真实模型支持跨数量级缩放 ---------- */
  camDolly = function (O, dy) {
    if ((O === ORR3D || O === SEM3D) && ORR3D.scaleModel === "real") {
      O.dist *= Math.exp(Math.max(-160, Math.min(160, dy)) * 0.0034);
      var mn = O === ORR3D ? 0.03 : 0.06,
        mx = O === ORR3D ? 180000 : 12000;
      O.dist = Math.max(mn, Math.min(mx, O.dist));
      return;
    }
    /* v118：精简太阳系也允许继续推进到天体近旁；日地月精简视图仍保持原安全范围。 */
    if (O === ORR3D) {
      O.dist *= Math.exp(Math.max(-160, Math.min(160, dy)) * 0.0031);
      O.dist = Math.max(48, Math.min(2400, O.dist));
      O.minDist = 48;
      return;
    }
    return OLD113.camDolly.apply(this, arguments);
  };

  /* ---------- 模型切换 ---------- */
  function v113SetScale(mode) {
    mode = mode === "real" ? "real" : "compact";
    ORR3D.scaleModel = mode;
    SEM3D.scaleModel = mode;
    ORR3D.orbitCache = { key: null, data: {} };
    v113InvalidateSky(ORR3D);
    v113InvalidateSky(SEM3D);
    if (mode === "real") {
      v113ResetSolar();
      v113SemSetView(SEM3D.realView || "full");
    } else {
      ORR3D.minDist = 310;
      v113ResetSolar();
      SEM3D.realView = "full";
      sem3dReset();
    }
    v113ScaleUI();
    try {
      orr3dInfo();
    } catch (_) {}
  }
  function v113ScaleUI() {
    var real = ORR3D.scaleModel === "real";
    document.querySelectorAll("#as-orr3d [data-orr-scale]").forEach(function (b) {
      b.classList.toggle("on", b.dataset.orrScale === ORR3D.scaleModel);
    });
    document.querySelectorAll("#as-orr3d .orr-real-only").forEach(function (e) {
      e.hidden = !real;
    });
    var rd = document.getElementById("orrScaleRead");
    if (rd)
      rd.textContent = real
        ? "线性真实距离 + 同比例天体半径；定位环不计入比例"
        : "对数距离压缩 + 天体尺寸增强；优先流畅与可读性";
    var a = document.querySelector("#orrMode3d .orr3d-badge"),
      b = document.querySelector("#orrModeSem .sem3d-badge");
    [a, b].forEach(function (x) {
      if (!x) return;
      x.classList.toggle("real", real);
      x.classList.toggle("compact", !real);
    });
    var loc = document.getElementById("orr3dLocator");
    if (loc) loc.checked = !!ORR3D.show.locator;
    var sv = document.getElementById("semRealView");
    if (sv) sv.value = SEM3D.realView || "full";
    var note = document.getElementById("orrModeNote");
    if (note && ORR3D.mode === "3d")
      note.textContent = real
        ? "真实模型：行星轨道/空间距离按 AU 线性等比，太阳与行星半径使用同一比例。全景下多数行星肉眼不可见是正确结果；虚线定位环只是 UI 标记。"
        : "精简模型：沿用 6.8 的轻量 Canvas 思路，轨道方向与倾角保留，距离作对数压缩、天体尺寸增强；拖动时自动降级星空以提高流畅度。";
  }
  orr3dSetMode = function (mode) {
    OLD113.setMode.apply(this, arguments);
    setTimeout(v113ScaleUI, 0);
  };

  /* ---------- 绑定扩展 ---------- */
  bindOrr3d = function () {
    OLD113.bind.apply(this, arguments);
    var root = document.getElementById("as-orr3d");
    if (!root || root.dataset.v113) return;
    root.dataset.v113 = "1";
    root.querySelectorAll("[data-orr-scale]").forEach(function (b) {
      b.onclick = function () {
        v113SetScale(b.dataset.orrScale);
      };
    });
    var loc = document.getElementById("orr3dLocator");
    if (loc)
      loc.onchange = function () {
        ORR3D.show.locator = !!loc.checked;
        orr3dDraw();
        if (ORR3D.mode === "sem") sem3dDraw();
      };
    var sv = document.getElementById("semRealView");
    if (sv)
      sv.onchange = function () {
        SEM3D.realView = sv.value;
        if (ORR3D.scaleModel === "real") v113SemSetView(sv.value);
      };
    var focus = document.getElementById("orr3dFocus");
    if (focus)
      focus.onchange = function (e) {
        ORR3D.selected = e.target.value;
        if (ORR3D.scaleModel === "real") v113FocusSolar(ORR3D.selected, true);
        else orr3dInfo();
      };
    var reset = document.getElementById("orr3dReset");
    if (reset)
      reset.onclick = function () {
        if (ORR3D.mode === "3d") v113ResetSolar();
        else if (ORR3D.mode === "helio") {
          var h = document.getElementById("orrHelioSvg");
          if (h && typeof pzReset === "function") pzReset(h);
          orr3dHelioRender();
        } else sem3dReset();
      };
    var cv = document.getElementById("orr3dCv"),
      scv = document.getElementById("sem3dCv");
    function motionOn(O) {
      O._interacting = true;
      O._motionUntil = performance.now() + 160;
      v113InvalidateSky(O);
    }
    function motionOff(O) {
      O._interacting = false;
      O._motionUntil = performance.now() + 130;
      setTimeout(function () {
        v113InvalidateSky(O);
        try {
          O === ORR3D ? orr3dDraw() : sem3dDraw();
        } catch (_) {}
      }, 150);
    }
    if (cv && !cv.dataset.v113m) {
      cv.dataset.v113m = "1";
      cv.addEventListener(
        "pointerdown",
        function () {
          motionOn(ORR3D);
        },
        true,
      );
      ["pointerup", "pointercancel"].forEach(function (ev) {
        cv.addEventListener(
          ev,
          function () {
            motionOff(ORR3D);
          },
          true,
        );
      });
      cv.addEventListener(
        "wheel",
        function () {
          ORR3D._motionUntil = performance.now() + 150;
        },
        true,
      );
      cv.addEventListener(
        "dblclick",
        function (e) {
          if (ORR3D.scaleModel === "real") {
            e.preventDefault();
            e.stopImmediatePropagation();
            v113ResetSolar();
          }
        },
        true,
      );
    }
    if (scv && !scv.dataset.v113m) {
      scv.dataset.v113m = "1";
      scv.addEventListener(
        "pointerdown",
        function () {
          motionOn(SEM3D);
        },
        true,
      );
      ["pointerup", "pointercancel"].forEach(function (ev) {
        scv.addEventListener(
          ev,
          function () {
            motionOff(SEM3D);
          },
          true,
        );
      });
      scv.addEventListener(
        "wheel",
        function () {
          SEM3D._motionUntil = performance.now() + 150;
        },
        true,
      );
      scv.addEventListener(
        "dblclick",
        function () {
          if (ORR3D.scaleModel === "real")
            setTimeout(function () {
              v113SemSetView(SEM3D.realView || "full");
            }, 0);
        },
        true,
      );
    }
    v113ScaleUI();
  };

  /* 已经先被旧版本创建过的面板，也可原地补上 v113 控件 */
  function v113DecorateExisting() {
    var root = document.getElementById("as-orr3d");
    if (!root) return;
    if (!document.getElementById("orrScaleBar")) {
      var ctl = root.querySelector(".orr3d-ctl");
      if (ctl) {
        var d = document.createElement("div");
        d.className = "orr-scale-bar";
        d.id = "orrScaleBar";
        d.innerHTML =
          '<span class="lab">空间模型</span><button type="button" class="chip" data-orr-scale="compact">精简模型</button><button type="button" class="chip" data-orr-scale="real">真实模型 · 1:1</button><label class="orr-real-only" id="orrLocatorWrap"><input type="checkbox" id="orr3dLocator" checked> 定位标记</label><span class="orr-scale-read" id="orrScaleRead"></span>';
        ctl.parentNode.insertBefore(d, ctl);
      }
    }
    var st = root.querySelector(".sem3d-tools");
    if (st && !document.getElementById("semRealCtl")) {
      var s = document.createElement("span");
      s.className = "sem-real-ctl orr-real-only";
      s.id = "semRealCtl";
      s.innerHTML =
        '<label>真实视野 <select id="semRealView"><option value="full">日地全景</option><option value="earthmoon">地月系统</option><option value="earth">地球近景</option></select></label>';
      st.insertBefore(s, st.firstChild);
    }
    if (root.dataset.v113) delete root.dataset.v113;
    try {
      bindOrr3d();
    } catch (e) {
      console.error("v113 bind", e);
    }
  }

  /* ---------- 信息栏补充模型说明 ---------- */
  orr3dInfo = function () {
    OLD113.info.apply(this, arguments);
    var el = document.getElementById("orr3dInfo");
    if (!el) return;
    if (ORR3D.scaleModel === "real") {
      var extra = "";
      if (ORR3D.mode === "3d") {
        var r = BODY_R_KM[ORR3D.selected] || 0;
        extra =
          "<span><b>真实比例</b> · 1 AU = 149,597,870.7 km · " +
          ORR3D.selected +
          "参考半径 " +
          Math.round(r).toLocaleString("zh-CN") +
          " km · 虚线定位环不计入比例</span>";
      } else if (ORR3D.mode === "sem") {
        extra =
          "<span><b>日地月真实比例</b> · 日地距离与地月距离、三天体半径使用同一线性比例；切“地月系统/地球近景”可跨数量级观察。</span>";
      }
      el.insertAdjacentHTML("beforeend", extra);
    }
  };

  /* ---------- 60fps 主循环 ---------- */
  orr3dLoop = function (tok, ts) {
    var O = ORR3D;
    if (tok !== O.token) {
      O.raf = 0;
      return;
    }
    if (!O.visible || O.visHidden || document.hidden) {
      O.last = ts;
      O.raf = 0;
      return;
    }
    O.raf = requestAnimationFrame(function (t2) {
      orr3dLoop(tok, t2);
    });
    var step = 16.2;
    if (O._frameT && ts - O._frameT < step) return;
    O._frameT = ts;
    if (O._faultUntil && ts < O._faultUntil) return;
    try {
      var dt = Math.min(0.1, (ts - O.last) / 1000);
      O.last = ts;
      if (O.playing) {
        O.jd += O.speed * dt;
        var min = jdFromGreg(1800, 1, 1, 0) - 8 / 24,
          max = jdFromGreg(2050, 12, 31, 23, 59) - 8 / 24;
        if (O.jd > max) O.jd = min;
        if (O.jd < min) O.jd = max;
      }
      if (O.autoRot && O.mode === "3d") {
        O.yaw += dt * 0.1;
        O._motionUntil = performance.now() + 80;
      }
      if (ts - O.colT > 1800) {
        O.colT = ts;
        orr3dCols();
      }
      if (O.mode === "3d") orr3dDraw();
      else if (O.mode === "sem") sem3dDraw();
      if (ts - O.infoT > 550) {
        O.infoT = ts;
        if (O.mode === "sem" && O.playing) orr3dSyncSem();
        orr3dInfo();
      }
      O._faultN = 0;
    } catch (e) {
      O._faultN = (O._faultN || 0) + 1;
      O._faultUntil = ts + Math.min(3000, 350 * O._faultN);
      if (typeof visRuntimeReport === "function")
        visRuntimeReport(O.mode === "sem" ? "日地月3D" : "太阳系3D", e);
    }
  };

  /* ---------- 自检 ---------- */
  function v113SelfTest() {
    var checks = [];
    function add(id, ok, detail) {
      checks.push({ id: id, ok: !!ok, detail: detail || "" });
    }
    try {
      var T = 0,
        earth = asHelio("地球", T),
        nep = asHelio("海王星", T),
        er = Math.hypot(earth.x, earth.y, earth.z),
        nr = Math.hypot(nep.x, nep.y, nep.z);
      add(
        "real.linear-distance",
        Math.abs((nr * REAL_AU_UNIT) / (er * REAL_AU_UNIT) - nr / er) < 1e-12,
        "linear AU ratio preserved",
      );
      var wr = v113WorldRadiusKm(6371),
        sr = v113WorldRadiusKm(SUN_R_KM);
      add(
        "real.radius-ratio",
        Math.abs(sr / wr - SUN_R_KM / 6371) < 1e-10,
        "body radii share same scale",
      );
      var D = v113SemData(2451545),
        ratio = (D.sunKm * SEM_KM_UNIT) / (D.moonKm * SEM_KM_UNIT);
      add(
        "sem.linear-distance",
        Math.abs(ratio - D.sunKm / D.moonKm) < 1e-12,
        "Sun-Earth / Earth-Moon ratio preserved",
      );
      add("canvas-engine", !!document.createElement("canvas").getContext, "Canvas 2D");
      add("dual-model", ORR3D.scaleModel === "compact" || ORR3D.scaleModel === "real");
      add("locator-overlay", typeof ORR3D.show.locator === "boolean");
    } catch (e) {
      add("runtime", false, String((e && e.message) || e));
    }
    return {
      ok: checks.every(function (x) {
        return x.ok;
      }),
      checks: checks,
      build: BUILD,
      version: "v113",
    };
  }
  var TEST = v113SelfTest();

  var API = Object.freeze({
    version: "1.0.0",
    build: BUILD,
    engine: "Canvas 2D custom perspective",
    setModel: v113SetScale,
    getModel: function () {
      return ORR3D.scaleModel;
    },
    focusPlanet: function (name) {
      if (ORR3D.scaleModel === "real") v113FocusSolar(name);
      else {
        ORR3D.selected = name;
        orr3dInfo();
      }
    },
    setSunEarthMoonView: function (v) {
      SEM3D.realView = v;
      if (ORR3D.scaleModel === "real") v113SemSetView(v);
    },
    constants: Object.freeze({
      AU_KM: AU_KM,
      REAL_AU_UNIT: REAL_AU_UNIT,
      SEM_KM_UNIT: SEM_KM_UNIT,
      SUN_R_KM: SUN_R_KM,
      MOON_R_KM: MOON_R_KM,
      bodyRadiusKm: Object.freeze(BODY_R_KM),
    }),
    selfTest: function () {
      return JSON.parse(JSON.stringify(TEST));
    },
  });
  window.TianjiAstro3D = API;

  /* 初始化 / 延迟页面 */
  try {
    v113DecorateExisting();
  } catch (e) {}
  var V113T = 0;
  new MutationObserver(function (ms) {
    if (document.getElementById("as-orr3d") && !document.getElementById("orrScaleBar") && !V113T) {
      V113T = setTimeout(function () {
        V113T = 0;
        try {
          v113DecorateExisting();
        } catch (e) {
          console.error("v113 decorate", e);
        }
      }, 80);
    }
  }).observe(document.body, { childList: true, subtree: true });

  /* 版本与系统清单 */
  try {
    var prev = window.TianjiSystem || {};
    window.TianjiSystem = Object.freeze(
      Object.assign({}, prev, { version: "v113", build: BUILD, astro3d: API }),
    );
    var bv = document.getElementById("buildVersion");
  } catch (_) {}
})();
