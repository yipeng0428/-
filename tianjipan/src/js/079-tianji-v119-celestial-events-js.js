(function () {
  "use strict";
  var BUILD = "v120 · 2026-10-04 13:47 +08:00";
  var AU_KM119 = 149597870.7,
    LD_KM119 = 384400,
    ER_KM119 = 6378.14;
  function q119(s, r) {
    return (r || document).querySelector(s);
  }
  function qa119(s, r) {
    return Array.from((r || document).querySelectorAll(s));
  }
  function esc119(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function n2(n) {
    return String(n).padStart(2, "0");
  }
  function dateUTC(iso) {
    var d = new Date(iso);
    return isNaN(d) ? null : d;
  }
  function fmtUTC(iso) {
    var d = dateUTC(iso);
    return d
      ? d.getUTCFullYear() +
          "-" +
          n2(d.getUTCMonth() + 1) +
          "-" +
          n2(d.getUTCDate()) +
          " " +
          n2(d.getUTCHours()) +
          ":" +
          n2(d.getUTCMinutes()) +
          " UTC"
      : "—";
  }
  function fmtLocal(iso) {
    var d = dateUTC(iso);
    if (!d) return "—";
    try {
      return new Intl.DateTimeFormat("zh-CN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }).format(d);
    } catch (_) {
      return d.toLocaleString();
    }
  }
  function countdown(t) {
    var ms = (t instanceof Date ? t.getTime() : +t) - Date.now(),
      sg = ms < 0 ? -1 : 1,
      a = Math.abs(ms),
      d = Math.floor(a / 864e5),
      h = Math.floor((a % 864e5) / 36e5),
      m = Math.floor((a % 36e5) / 6e4);
    return (sg < 0 ? "已过 " : "还有 ") + (d ? d + "天 " : "") + h + "时 " + m + "分";
  }
  function loc119() {
    var lo = parseFloat((q119("#lon") || {}).value),
      la = parseFloat((q119("#lat") || {}).value);
    return { lon: isFinite(lo) ? lo : 117.8, lat: isFinite(la) ? la : 24.5 };
  }
  function toast119(s) {
    try {
      if (typeof toast === "function") toast(s);
      else console.info(s);
    } catch (_) {}
  }

  /* NASA GSFC 2026–2030 食表：最大食时刻均为 UTC/TD 近似显示；地理区域为摘要。 */
  var ECL_EVENTS = [
    {
      id: "S20260217",
      kind: "solar",
      iso: "2026-02-17T12:13:05Z",
      type: "日环食",
      mag: 0.963,
      dur: "2分20秒",
      region: "南阿根廷、南智利、南部非洲、南极洲；环食带位于南极洲",
    },
    {
      id: "L20260303",
      kind: "lunar",
      iso: "2026-03-03T11:34:52Z",
      type: "月全食",
      mag: 1.151,
      dur: "全食58分",
      region: "东亚、澳大利亚、太平洋、美洲",
    },
    {
      id: "S20260812",
      kind: "solar",
      iso: "2026-08-12T17:47:05Z",
      type: "日全食",
      mag: 1.039,
      dur: "2分18秒",
      region: "格陵兰、冰岛、西班牙、俄罗斯；北美/欧洲/西北非洲多地可见偏食",
    },
    {
      id: "L20260828",
      kind: "lunar",
      iso: "2026-08-28T04:14:04Z",
      type: "月偏食",
      mag: 0.93,
      dur: "3时18分",
      region: "东太平洋、美洲、欧洲、非洲",
    },
    {
      id: "S20270206",
      kind: "solar",
      iso: "2027-02-06T16:00:47Z",
      type: "日环食",
      mag: 0.928,
      dur: "7分51秒",
      region: "智利、阿根廷、大西洋；南美、南极洲、西部和南部非洲可见偏食",
    },
    {
      id: "L20270220",
      kind: "lunar",
      iso: "2027-02-20T23:14:06Z",
      type: "半影月食",
      mag: null,
      dur: "—",
      region: "美洲、欧洲、非洲、亚洲、澳大利亚西部",
    },
    {
      id: "L20270718",
      kind: "lunar",
      iso: "2027-07-18T16:04:09Z",
      type: "半影月食",
      mag: null,
      dur: "—",
      region: "东非、亚洲、澳大利亚、太平洋",
    },
    {
      id: "S20270802",
      kind: "solar",
      iso: "2027-08-02T10:07:49Z",
      type: "日全食",
      mag: 1.079,
      dur: "6分23秒",
      region: "西班牙、北非、中东；非洲、欧洲、西亚多地可见偏食",
    },
    {
      id: "L20270817",
      kind: "lunar",
      iso: "2027-08-17T07:14:59Z",
      type: "半影月食",
      mag: null,
      dur: "—",
      region: "太平洋、美洲、西非、新西兰、澳大利亚等",
    },
    {
      id: "L20280112",
      kind: "lunar",
      iso: "2028-01-12T04:14:13Z",
      type: "月偏食",
      mag: 0.066,
      dur: "56分",
      region: "美洲、欧洲、非洲",
    },
    {
      id: "S20280126",
      kind: "solar",
      iso: "2028-01-26T15:08:58Z",
      type: "日环食",
      mag: 0.921,
      dur: "10分27秒",
      region: "厄瓜多尔、秘鲁、巴西、苏里南、西班牙、葡萄牙等",
    },
    {
      id: "L20280706",
      kind: "lunar",
      iso: "2028-07-06T18:20:57Z",
      type: "月偏食",
      mag: 0.389,
      dur: "2时21分",
      region: "欧洲、非洲、亚洲、澳大利亚",
    },
    {
      id: "S20280722",
      kind: "solar",
      iso: "2028-07-22T02:56:39Z",
      type: "日全食",
      mag: 1.056,
      dur: "5分10秒",
      region: "澳大利亚、新西兰；东南亚、东印度群岛等可见偏食",
    },
    {
      id: "L20281231",
      kind: "lunar",
      iso: "2028-12-31T16:53:15Z",
      type: "月全食",
      mag: 1.246,
      dur: "全食1时11分",
      region: "欧洲、非洲、亚洲、澳大利亚、太平洋",
    },
    {
      id: "S20290114",
      kind: "solar",
      iso: "2029-01-14T17:13:47Z",
      type: "日偏食",
      mag: 0.871,
      dur: "—",
      region: "北美、中美洲",
    },
    {
      id: "S20290612",
      kind: "solar",
      iso: "2029-06-12T04:06:13Z",
      type: "日偏食",
      mag: 0.458,
      dur: "—",
      region: "北极、斯堪的纳维亚、阿拉斯加、北亚、加拿大北部",
    },
    {
      id: "L20290626",
      kind: "lunar",
      iso: "2029-06-26T03:23:22Z",
      type: "月全食",
      mag: 1.844,
      dur: "全食1时42分",
      region: "美洲、欧洲、非洲、中东",
    },
    {
      id: "S20290711",
      kind: "solar",
      iso: "2029-07-11T15:37:18Z",
      type: "日偏食",
      mag: 0.23,
      dur: "—",
      region: "智利南部、阿根廷南部",
    },
    {
      id: "S20291205",
      kind: "solar",
      iso: "2029-12-05T15:03:57Z",
      type: "日偏食",
      mag: 0.891,
      dur: "—",
      region: "阿根廷南部、智利南部、南极洲",
    },
    {
      id: "L20291220",
      kind: "lunar",
      iso: "2029-12-20T22:43:12Z",
      type: "月全食",
      mag: 1.117,
      dur: "全食54分",
      region: "美洲、欧洲、非洲、亚洲",
    },
    {
      id: "S20300601",
      kind: "solar",
      iso: "2030-06-01T06:29:13Z",
      type: "日环食",
      mag: 0.944,
      dur: "5分21秒",
      region: "北非、南欧、俄罗斯、中国北部、日本等",
    },
    {
      id: "L20300615",
      kind: "lunar",
      iso: "2030-06-15T18:34:34Z",
      type: "月偏食",
      mag: 0.502,
      dur: "2时24分",
      region: "欧洲、非洲、亚洲、澳大利亚",
    },
    {
      id: "S20301125",
      kind: "solar",
      iso: "2030-11-25T06:51:37Z",
      type: "日全食",
      mag: 1.047,
      dur: "3分44秒",
      region: "博茨瓦纳、南非、澳大利亚；南部非洲、印度洋、东印度群岛等",
    },
    {
      id: "L20301209",
      kind: "lunar",
      iso: "2030-12-09T22:28:51Z",
      type: "半影月食",
      mag: null,
      dur: "—",
      region: "美洲、欧洲、非洲、亚洲",
    },
  ];
  var ECL = {
    idx: 0,
    jd: 0,
    center: 0,
    playing: false,
    speed: 5 / 1440,
    yaw: -0.55,
    pitch: 0.26,
    dist: 440,
    cv: null,
    ctx: null,
    w: 0,
    h: 0,
    raf: 0,
    last: 0,
    tab: "solar",
    rem: [],
    installed: false,
    boundCv: null,
    loopStarted: false,
    remLoaded: false,
  };
  function eclNextIndex() {
    for (var i = 0; i < ECL_EVENTS.length; i++)
      if (dateUTC(ECL_EVENTS[i].iso).getTime() > Date.now()) return i;
    return ECL_EVENTS.length - 1;
  }
  function eclEvent() {
    return ECL_EVENTS[ECL.idx] || ECL_EVENTS[0];
  }
  function eclJD(ev) {
    return smJD(new Date(ev.iso));
  }
  function eclTypeClass(ev) {
    return ev.kind === "solar" ? "☉" : "☽";
  }
  function eclModeHTML() {
    return (
      '<section class="orr-mode-panel" id="orrModeEclipse" data-mode="eclipse" hidden>' +
      '<div class="ecl-head"><div><h4>日月食 · 动态 3D 模拟</h4><div class="dim sm">太阳—地球—月球几何 · 最大食时刻 · 可见性辅助 · 时间表与提醒</div></div><div class="ecl-tools"><button class="gbtn sm" id="eclPrev">← 上一次</button><label>事件 <select id="eclSelect"></select></label><button class="gbtn sm" id="eclNext">下一次 →</button><button class="gbtn sm" id="eclPlay">▶ 播放</button><label>速度 <select id="eclSpeed"><option value="1">1分/秒</option><option value="5" selected>5分/秒</option><option value="20">20分/秒</option><option value="60">1时/秒</option></select></label><button class="gbtn sm" id="eclMax">回到最大食</button></div></div>' +
      '<div class="ecl-stage"><canvas id="ecl3dCv"></canvas><div class="ecl-badge">交互 3D · 拖动旋转 · 滚轮缩放 · 双击复位</div><div class="ecl-viewlegend"><span>空间几何</span><span>观测视图</span><span>影锥</span></div></div>' +
      '<div class="ecl-statusline"><span>动画采用<b>压缩距离</b>保证日—地—月同时可见</span><span>天体尺寸与阴影锥为<b>视觉增强</b>，不按真实比例</span></div>' +
      '<div class="ecl-timeline"><span class="dim sm">最大食前 8h</span><input id="eclSlider" type="range" min="-480" max="480" step="1" value="0"><span class="ecl-off" id="eclOff">+0分</span></div>' +
      '<div class="ecl-summary" id="eclSummary"></div>' +
      '<div class="ecl-subtabs"><button class="on" data-ecl-tab="solar">日食详情</button><button data-ecl-tab="lunar">月食详情</button><button data-ecl-tab="schedule">日食 / 月食时间表</button><button data-ecl-tab="remind">提醒通知</button></div>' +
      '<div class="ecl-pane on" data-ecl-pane="solar" id="eclSolar"></div><div class="ecl-pane" data-ecl-pane="lunar" id="eclLunar"></div><div class="ecl-pane" data-ecl-pane="schedule" id="eclSchedule"></div><div class="ecl-pane" data-ecl-pane="remind" id="eclRemind"></div>' +
      "</section>"
    );
  }
  function eclProj(p) {
    var cy = Math.cos(ECL.yaw),
      sy = Math.sin(ECL.yaw),
      x = p.x * cy - p.y * sy,
      y = p.x * sy + p.y * cy,
      z = p.z,
      cp = Math.cos(ECL.pitch),
      sp = Math.sin(ECL.pitch),
      yy = y * cp - z * sp,
      zz = y * sp + z * cp;
    /* v120：世界坐标是“可视化压缩距离”，不再把天体半径乘上天文距离比例。 */
    var zoom = 440 / Math.max(180, ECL.dist),
      base = ((Math.min(ECL.w, ECL.h) * 0.76) / 420) * zoom,
      persp = Math.max(0.58, Math.min(1.55, 440 / (440 + yy * 0.7)));
    var sc = base * persp;
    return { x: ECL.w / 2 + x * sc, y: ECL.h / 2 - zz * sc, d: 440 + yy, s: sc };
  }
  function eclLine(a, b, col, w, dash, alpha) {
    var c = ECL.ctx,
      A = eclProj(a),
      B = eclProj(b);
    c.save();
    c.strokeStyle = col;
    c.lineWidth = w || 1;
    c.globalAlpha = alpha == null ? 1 : alpha;
    if (dash) c.setLineDash(dash);
    c.beginPath();
    c.moveTo(A.x, A.y);
    c.lineTo(B.x, B.y);
    c.stroke();
    c.restore();
  }
  function eclCircle(center, r, tilt, node, col, alpha) {
    var pts = [],
      i = ((tilt || 0) * Math.PI) / 180,
      N = ((node || 0) * Math.PI) / 180;
    for (var k = 0; k <= 100; k++) {
      var u = (k / 100) * Math.PI * 2,
        cu = Math.cos(u),
        su = Math.sin(u),
        x = r * (Math.cos(N) * cu - Math.sin(N) * su * Math.cos(i)),
        y = r * (Math.sin(N) * cu + Math.cos(N) * su * Math.cos(i)),
        z = r * su * Math.sin(i);
      pts.push({ x: center.x + x, y: center.y + y, z: center.z + z });
    }
    var c = ECL.ctx;
    c.save();
    c.strokeStyle = col;
    c.globalAlpha = alpha == null ? 1 : alpha;
    c.lineWidth = 1;
    c.beginPath();
    pts.forEach(function (p, j) {
      var q = eclProj(p);
      j ? c.lineTo(q.x, q.y) : c.moveTo(q.x, q.y);
    });
    c.stroke();
    c.restore();
  }
  function eclBall(p, r, c1, c2, label, glow) {
    var c = ECL.ctx,
      q = eclProj(p),
      rr = Math.max(4, r * q.s),
      g = c.createRadialGradient(
        q.x - rr * 0.3,
        q.y - rr * 0.32,
        Math.max(1, rr * 0.06),
        q.x,
        q.y,
        rr,
      );
    if (glow) {
      c.save();
      c.shadowBlur = 22 * glow;
      c.shadowColor = c1;
    }
    g.addColorStop(0, c1);
    g.addColorStop(0.7, c1);
    g.addColorStop(1, c2);
    c.fillStyle = g;
    c.beginPath();
    c.arc(q.x, q.y, rr, 0, Math.PI * 2);
    c.fill();
    if (glow) c.restore();
    if (label) {
      c.fillStyle = "#eee7d6";
      c.font = "11px sans-serif";
      c.textAlign = "center";
      c.fillText(label, q.x, q.y - rr - 8);
    }
    return { q: q, r: rr };
  }
  function eclShadow(origin, from, rEnd, len, col, pen) {
    var vx = origin.x - from.x,
      vy = origin.y - from.y,
      vz = origin.z - from.z,
      L = Math.hypot(vx, vy, vz) || 1;
    vx /= L;
    vy /= L;
    vz /= L;
    var end = { x: origin.x + vx * len, y: origin.y + vy * len, z: origin.z + vz * len },
      up = Math.abs(vz) < 0.8 ? { x: 0, y: 0, z: 1 } : { x: 0, y: 1, z: 0 },
      ux = vy * up.z - vz * up.y,
      uy = vz * up.x - vx * up.z,
      uz = vx * up.y - vy * up.x,
      UL = Math.hypot(ux, uy, uz) || 1;
    ux /= UL;
    uy /= UL;
    uz /= UL;
    var c = ECL.ctx,
      O = eclProj(origin),
      E = eclProj(end),
      rad = rEnd * (pen ? 1.85 : 1),
      A = eclProj({ x: end.x + ux * rad, y: end.y + uy * rad, z: end.z + uz * rad }),
      B = eclProj({ x: end.x - ux * rad, y: end.y - uy * rad, z: end.z - uz * rad });
    c.save();
    var g = c.createLinearGradient(O.x, O.y, E.x, E.y);
    g.addColorStop(0, col.replace("ALPHA", pen ? "0.08" : "0.32"));
    g.addColorStop(1, col.replace("ALPHA", "0.01"));
    c.fillStyle = g;
    c.beginPath();
    c.moveTo(O.x, O.y);
    c.lineTo(A.x, A.y);
    c.lineTo(B.x, B.y);
    c.closePath();
    c.fill();
    c.restore();
  }
  function eclGeom(jd) {
    var sun = smSun(jd),
      moon = smMoon(jd),
      ph = smPhase(moon.lon, sun.lon);
    return { sun: sun, moon: moon, ph: ph };
  }
  function eclImpact(ev) {
    if (ev.kind === "solar") {
      var m = ev.mag == null ? 0.5 : ev.mag;
      if (/全食/.test(ev.type)) return 0;
      if (/环食/.test(ev.type)) return Math.max(3, (1 - m) * 70);
      return 18 + Math.max(0, 1 - m) * 62;
    }
    var lm = ev.mag;
    if (/月全食/.test(ev.type)) return 0;
    if (/月偏食/.test(ev.type)) return 14 + Math.max(0, 1 - (lm || 0)) * 28;
    return 38;
  }
  function eclScene(jd) {
    var ev = eclEvent(),
      off = (jd - ECL.center) * 1440,
      t = Math.max(-1.25, Math.min(1.25, off / 300)),
      impact = eclImpact(ev),
      D = eclGeom(jd),
      lat = Math.max(-5, Math.min(5, D.moon.lat || 0)),
      S,
      E,
      M;
    if (ev.kind === "solar") {
      S = { x: -250, y: 0, z: 0 };
      E = { x: 145, y: 0, z: 0 };
      M = { x: 78, y: impact + t * 76, z: lat * 2.8 + t * 9 };
    } else {
      S = { x: -250, y: 0, z: 0 };
      E = { x: -5, y: 0, z: 0 };
      M = { x: 128, y: impact + t * 82, z: lat * 2.4 + t * 8 };
    }
    return { S: S, E: E, M: M, raw: D, off: off, t: t, impact: impact, ev: ev };
  }
  function eclStars(c, W, H) {
    c.save();
    for (var i = 0; i < 90; i++) {
      var x = (((i * 137) % 997) / 997) * W,
        y = (((i * 83) % 991) / 991) * H,
        a = 0.12 + (i % 7) * 0.035;
      c.globalAlpha = a;
      c.fillStyle = i % 9 === 0 ? "#f4deb0" : "#d9e5f0";
      var r = i % 11 === 0 ? 1.2 : 0.65;
      c.beginPath();
      c.arc(x, y, r, 0, Math.PI * 2);
      c.fill();
    }
    c.restore();
  }
  function eclObserverInset(scene) {
    var c = ECL.ctx,
      W = ECL.w,
      H = ECL.h,
      box = Math.max(126, Math.min(174, W * 0.23)),
      x = W - box - 14,
      y = 46,
      r = box * 0.235,
      t = Math.max(-1.15, Math.min(1.15, scene.off / 180)),
      ev = scene.ev;
    c.save();
    c.fillStyle = "rgba(2,5,10,.78)";
    c.strokeStyle = "rgba(217,178,95,.35)";
    c.lineWidth = 1;
    c.beginPath();
    c.roundRect(x, y, box, box * 0.82, 7);
    c.fill();
    c.stroke();
    c.fillStyle = "rgba(235,229,214,.72)";
    c.font = "10px sans-serif";
    c.fillText("观测者视图 · " + (ev.kind === "solar" ? "太阳盘面" : "月面"), x + 9, y + 15);
    var cx = x + box * 0.5,
      cy = y + box * 0.49;
    if (ev.kind === "solar") {
      c.save();
      c.shadowBlur = 18;
      c.shadowColor = "#e7a92d";
      c.fillStyle = "#ffd85c";
      c.beginPath();
      c.arc(cx, cy, r, 0, Math.PI * 2);
      c.fill();
      c.restore();
      var mr = /环食/.test(ev.type) ? r * 0.88 : /全食/.test(ev.type) ? r * 1.045 : r * 0.98,
        imp = Math.min(r * 1.5, eclImpact(ev) * 0.55),
        mx = cx + t * r * 2.1,
        my = cy + imp * 0.72;
      c.fillStyle = "#08101a";
      c.beginPath();
      c.arc(mx, my, mr, 0, Math.PI * 2);
      c.fill();
      c.strokeStyle = "rgba(230,235,240,.35)";
      c.stroke();
    } else {
      c.fillStyle = "#d8d5cd";
      c.beginPath();
      c.arc(cx, cy, r, 0, Math.PI * 2);
      c.fill();
      var sr = r * 1.42,
        imp = Math.min(r * 1.5, eclImpact(ev) * 0.42),
        sx = cx - t * r * 2.0,
        sy = cy + imp * 0.55;
      var g = c.createRadialGradient(sx, sy, r * 0.15, sx, sy, sr);
      g.addColorStop(0, "rgba(75,12,8,.88)");
      g.addColorStop(0.67, "rgba(95,25,18,.70)");
      g.addColorStop(1, "rgba(25,28,35,.18)");
      c.fillStyle = g;
      c.beginPath();
      c.arc(sx, sy, sr, 0, Math.PI * 2);
      c.fill();
      c.strokeStyle = "rgba(255,255,255,.12)";
      c.stroke();
    }
    c.fillStyle = "rgba(217,178,95,.82)";
    c.font = "9px sans-serif";
    c.textAlign = "center";
    c.fillText(
      scene.off >= 0
        ? "最大食后 " + Math.round(scene.off) + " 分"
        : "最大食前 " + Math.abs(Math.round(scene.off)) + " 分",
      cx,
      y + box * 0.76,
    );
    c.restore();
  }
  function eclDraw() {
    if (!ECL.ctx || !q119("#orrModeEclipse") || q119("#orrModeEclipse").hidden) return;
    var c = ECL.ctx,
      W = ECL.w,
      H = ECL.h,
      sc = eclScene(ECL.jd),
      ev = sc.ev;
    c.clearRect(0, 0, W, H);
    var bg = c.createRadialGradient(
      W * 0.48,
      H * 0.42,
      10,
      W * 0.5,
      H * 0.5,
      Math.max(W, H) * 0.74,
    );
    bg.addColorStop(0, "#13233b");
    bg.addColorStop(0.52, "#07101d");
    bg.addColorStop(1, "#020409");
    c.fillStyle = bg;
    c.fillRect(0, 0, W, H);
    eclStars(c, W, H);
    /* 黄道/轨迹与日光轴 */
    eclLine(sc.S, sc.E, "rgba(246,210,111,.26)", 1, [6, 5], 1);
    var trA = { x: sc.M.x, y: sc.M.y - 110, z: sc.M.z - 12 },
      trB = { x: sc.M.x, y: sc.M.y + 110, z: sc.M.z + 12 };
    eclLine(trA, trB, "rgba(98,205,195,.26)", 1, [3, 4], 1);
    if (ev.kind === "solar") {
      eclShadow(sc.M, sc.S, 12, 150, "rgba(0,0,0,ALPHA)", true);
      eclShadow(sc.M, sc.S, 5.5, 150, "rgba(0,0,0,ALPHA)", false);
    } else {
      eclShadow(sc.E, sc.S, 26, 178, "rgba(0,0,0,ALPHA)", true);
      eclShadow(sc.E, sc.S, 14, 178, "rgba(0,0,0,ALPHA)", false);
    }
    /* 光线边界，增强食的几何关系 */
    c.save();
    c.globalAlpha = 0.16;
    for (var k = -1; k <= 1; k++) {
      eclLine(
        { x: sc.S.x, y: k * 18, z: k * 6 },
        { x: sc.E.x + 155, y: k * 32, z: k * 10 },
        "#ffd978",
        0.8,
        null,
        1,
      );
    }
    c.restore();
    var objs = [
      { p: sc.S, r: 30, a: "#fff4a8", b: "#d68d1d", n: "太阳", g: 1 },
      { p: sc.E, r: 18, a: "#9ed7ff", b: "#1f4f86", n: "地球", g: 0 },
      { p: sc.M, r: 10, a: "#efede5", b: "#626a78", n: "月亮", g: 0 },
    ]
      .map(function (o) {
        o.z = eclProj(o.p).d;
        return o;
      })
      .sort(function (a, b) {
        return b.z - a.z;
      });
    objs.forEach(function (o) {
      var hit = eclBall(o.p, o.r, o.a, o.b, o.n, o.g);
      if (o.n === "地球") {
        var q = hit.q,
          rr = hit.r;
        c.save();
        c.beginPath();
        c.arc(q.x, q.y, rr, 0, Math.PI * 2);
        c.clip();
        var gg = c.createLinearGradient(q.x - rr, q.y, q.x + rr, q.y);
        gg.addColorStop(0, "rgba(4,10,18,.72)");
        gg.addColorStop(0.52, "rgba(5,13,23,.20)");
        gg.addColorStop(0.56, "rgba(255,255,255,.03)");
        gg.addColorStop(1, "rgba(255,255,255,.08)");
        c.fillStyle = gg;
        c.fillRect(q.x - rr, q.y - rr, rr * 2, rr * 2);
        c.restore();
      }
    });
    eclObserverInset(sc);
    c.save();
    c.fillStyle = "rgba(235,229,214,.88)";
    c.font = "11px sans-serif";
    c.textAlign = "left";
    c.fillText(ev.type + " · " + fmtUTC(ev.iso), 12, H - 48);
    c.fillStyle = "rgba(210,220,232,.78)";
    c.fillText(
      "模拟偏移 " +
        Math.round(sc.off) +
        " 分 · 日月距角 " +
        sc.raw.ph.e2.toFixed(2) +
        "° · 月球黄纬 " +
        sc.raw.moon.lat.toFixed(2) +
        "°",
      12,
      H - 30,
    );
    c.fillStyle = "rgba(217,178,95,.86)";
    c.fillText(
      ev.kind === "solar" ? "月球横穿日地连线，月影扫过地球" : "月球横穿地球影锥，进入半影 / 本影",
      12,
      H - 13,
    );
    c.restore();
  }
  function eclFit() {
    var cv = q119("#ecl3dCv");
    if (!cv) return;
    var r = cv.getBoundingClientRect();
    if (r.width < 20) return;
    var h = Math.max(300, Math.min(520, r.width * 0.58)),
      dpr = Math.min(1.6, window.devicePixelRatio || 1);
    ECL.cv = cv;
    ECL.w = r.width;
    ECL.h = h;
    cv.style.height = h + "px";
    cv.width = Math.round(r.width * dpr);
    cv.height = Math.round(h * dpr);
    ECL.ctx = cv.getContext("2d");
    ECL.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    eclDraw();
  }
  function eclVis(ev) {
    var l = loc119(),
      jd = eclJD(ev),
      su = smSun(jd),
      mo = smMoon(jd),
      sa = smAltAz(su.eq.ra, su.eq.dec, jd, l.lon, l.lat),
      ma = smAltAz(mo.eq.ra, mo.eq.dec, jd, l.lon, l.lat);
    if (ev.kind === "lunar")
      return {
        text:
          ma.alt > 0
            ? "最大食时月亮在当地地平线上方，可尝试观测"
            : "最大食时月亮在当地地平线下；完整食甚不可见",
        alt: ma.alt,
        az: ma.az,
      };
    return {
      text:
        "最大食时当地太阳高度 " +
        sa.alt.toFixed(1) +
        "°；是否实际发生偏食/全食仍取决于是否位于 NASA 食带内",
      alt: sa.alt,
      az: sa.az,
    };
  }
  function eclSummary() {
    var ev = eclEvent(),
      v = eclVis(ev),
      dt = dateUTC(ev.iso),
      off = Math.round((ECL.jd - ECL.center) * 1440),
      D = eclGeom(ECL.jd),
      sum = q119("#eclSummary");
    if (!sum) return;
    sum.innerHTML =
      '<div class="ecl-kv"><small>当前事件</small><b class="gold">' +
      eclTypeClass(ev) +
      " " +
      ev.type +
      '</b></div><div class="ecl-kv"><small>最大食 UTC</small><b>' +
      fmtUTC(ev.iso) +
      '</b></div><div class="ecl-kv"><small>本机时间</small><b>' +
      fmtLocal(ev.iso) +
      '</b></div><div class="ecl-kv"><small>倒计时</small><b>' +
      countdown(dt) +
      '</b></div><div class="ecl-kv"><small>当前模拟</small><b>' +
      (off >= 0 ? "+" : "") +
      off +
      " 分 · 距角 " +
      D.ph.e2.toFixed(2) +
      '°</b></div><div class="ecl-kv"><small>本地辅助判断</small><b>' +
      esc119(v.text) +
      "</b></div>";
  }
  function eclDetail() {
    var ev = eclEvent(),
      v = eclVis(ev),
      D = eclGeom(ECL.center),
      solar = q119("#eclSolar"),
      lunar = q119("#eclLunar");
    if (!solar || !lunar) return;
    var common =
      "<p>最大食：<b>" +
      fmtUTC(ev.iso) +
      "</b> / 本机 <b>" +
      fmtLocal(ev.iso) +
      "</b></p><p>全球可见区域：" +
      esc119(ev.region) +
      "</p><p>本页观测点：东经 " +
      loc119().lon.toFixed(2) +
      "°，北纬 " +
      loc119().lat.toFixed(2) +
      "°</p>";
    solar.innerHTML =
      '<div class="ecl-detail-grid"><div class="ecl-card"><h5>☉ 日食详情</h5>' +
      (ev.kind === "solar"
        ? '<div class="big">' +
          ev.type +
          "</div>" +
          common +
          "<p>食分：" +
          (ev.mag == null ? "—" : ev.mag.toFixed(3)) +
          " · 中心持续：" +
          esc119(ev.dur) +
          "</p><p>最大食时当地太阳高度：" +
          v.alt.toFixed(1) +
          "°，方位 " +
          v.az.toFixed(1) +
          "°。</p>"
        : '<p class="dim">当前选中的是月食。可在时间表中选择任一日食，或点“下一次”。</p>') +
      '</div><div class="ecl-card"><h5>几何关系</h5><p>日食发生在朔附近：月球位于太阳与地球之间。是否形成全食、环食或偏食，还取决于月球离黄白交点的距离、月地距离与影锥落点。</p><p>当前事件最大食附近：日月距角 ' +
      D.ph.e2.toFixed(3) +
      "°；月球黄纬 " +
      D.moon.lat.toFixed(3) +
      "°。</p></div></div>";
    lunar.innerHTML =
      '<div class="ecl-detail-grid"><div class="ecl-card"><h5>☽ 月食详情</h5>' +
      (ev.kind === "lunar"
        ? '<div class="big">' +
          ev.type +
          "</div>" +
          common +
          "<p>本影食分：" +
          (ev.mag == null ? "半影食不以此值概括" : ev.mag.toFixed(3)) +
          " · 持续：" +
          esc119(ev.dur) +
          "</p><p>最大食时当地月亮高度：" +
          v.alt.toFixed(1) +
          "°，方位 " +
          v.az.toFixed(1) +
          "°。</p>"
        : '<p class="dim">当前选中的是日食。可在时间表中选择任一月食。</p>') +
      '</div><div class="ecl-card"><h5>几何关系</h5><p>月食发生在望附近：地球位于太阳与月球之间。月球穿过地球半影或本影，形成半影月食、月偏食或月全食。</p><p>月食通常可从夜半球的大范围区域看到；本页用最大食时月亮高度辅助判断当地是否有机会观测。</p></div></div>';
  }
  function eclSchedule() {
    var box = q119("#eclSchedule");
    if (!box) return;
    var now = Date.now();
    function one(kind, title, icon) {
      var list = ECL_EVENTS.map(function (e, i) {
        return { e: e, i: i };
      }).filter(function (x) {
        return x.e.kind === kind;
      });
      var future = list.filter(function (x) {
        return dateUTC(x.e.iso).getTime() >= now;
      }).length;
      var rows = list
        .map(function (x) {
          var e = x.e,
            i = x.i,
            d = dateUTC(e.iso),
            past = d.getTime() < now;
          return (
            '<tr class="' +
            (i === ECL.idx ? "sel" : "") +
            '"><td>' +
            esc119(e.type) +
            "</td><td>" +
            fmtUTC(e.iso).replace(" UTC", "") +
            "</td><td>" +
            (e.mag == null ? "—" : e.mag.toFixed(3)) +
            "</td><td>" +
            esc119(e.region) +
            "</td><td>" +
            (past ? "已过" : countdown(d)) +
            '</td><td><button class="gbtn sm" data-ecl-pick="' +
            i +
            '">查看</button></td></tr>'
          );
        })
        .join("");
      return (
        '<section class="ecl-schedule-card"><h5>' +
        icon +
        " " +
        title +
        "<small>未来 " +
        future +
        " 次 · 共 " +
        list.length +
        ' 条</small></h5><div class="tbl-wrap"><table class="ecl-table"><thead><tr><th>类型</th><th>最大食 UTC</th><th>食分</th><th>可见区域</th><th>状态</th><th></th></tr></thead><tbody>' +
        rows +
        "</tbody></table></div></section>"
      );
    }
    box.innerHTML =
      '<div class="ecl-schedule-grid">' +
      one("solar", "日食时间表", "☉") +
      one("lunar", "月食时间表", "☽") +
      '</div><p class="ecl-source">日食与月食已分开排列。事件表采用 NASA/GSFC 2026–2030 食表；3D 为本站低精度日月位置算法的几何可视化，不能替代专业食带/接触时刻计算。</p>';
    qa119("[data-ecl-pick]", box).forEach(function (b) {
      b.onclick = function () {
        eclSelect(+b.dataset.eclPick, true);
        eclTab(ECL_EVENTS[+b.dataset.eclPick].kind === "solar" ? "solar" : "lunar");
      };
    });
  }
  function eclLoadRem() {
    try {
      ECL.rem = JSON.parse(localStorage.getItem("tianji.ecl.rem.v119") || "[]");
      if (!Array.isArray(ECL.rem)) ECL.rem = [];
    } catch (_) {
      ECL.rem = [];
    }
  }
  function eclSaveRem() {
    try {
      localStorage.setItem("tianji.ecl.rem.v119", JSON.stringify(ECL.rem));
    } catch (_) {}
  }
  function eclRemindPane() {
    var box = q119("#eclRemind");
    if (!box) return;
    var ev = eclEvent(),
      list = ECL.rem
        .map(function (r, i) {
          return (
            '<div class="ecl-rem"><span><b>' +
            esc119(r.label) +
            '</b><br><small class="dim">' +
            fmtLocal(r.iso) +
            " · 提前 " +
            r.lead +
            ' 分钟</small></span><button class="gbtn sm" data-rem-del="' +
            i +
            '">删除</button></div>'
          );
        })
        .join("");
    box.innerHTML =
      '<div class="ecl-card"><h5>为当前事件设置提醒</h5><p><b>' +
      ev.type +
      "</b> · " +
      fmtLocal(ev.iso) +
      '</p><div class="ecl-tools"><label>提前 <select id="eclLead"><option value="4320">3天</option><option value="1440" selected>1天</option><option value="360">6小时</option><option value="60">1小时</option><option value="15">15分钟</option></select></label><button class="gbtn sm" id="eclAddRem">本页提醒</button><button class="gbtn sm" id="eclIcs">加入日历 .ics</button></div><p class="note">本页提醒只在页面打开时检查；若浏览器允许系统通知，会尝试发送系统通知。关闭页面后要可靠提醒，建议同时导出 .ics 加入系统日历。</p></div><div class="ecl-rem-list">' +
      (list || '<p class="dim sm">尚未设置提醒。</p>') +
      "</div>";
    var add = q119("#eclAddRem");
    if (add)
      add.onclick = function () {
        var lead = +(q119("#eclLead") || {}).value || 1440;
        ECL.rem.push({ id: ev.id, iso: ev.iso, label: ev.type, lead: lead, done: false });
        eclSaveRem();
        try {
          if ("Notification" in window && Notification.permission === "default")
            Notification.requestPermission();
        } catch (_) {}
        eclRemindPane();
        toast119("已加入本页提醒");
      };
    var ics = q119("#eclIcs");
    if (ics)
      ics.onclick = function () {
        downloadIcs119(ev.type, ev.iso, "天机盘：" + ev.type + " · " + ev.region);
      };
    qa119("[data-rem-del]", box).forEach(function (b) {
      b.onclick = function () {
        ECL.rem.splice(+b.dataset.remDel, 1);
        eclSaveRem();
        eclRemindPane();
      };
    });
  }
  function downloadIcs119(title, iso, desc) {
    var d = new Date(iso),
      st = d
        .toISOString()
        .replace(/[-:]/g, "")
        .replace(/\.\d{3}Z$/, "Z"),
      en = new Date(d.getTime() + 2 * 3600e3)
        .toISOString()
        .replace(/[-:]/g, "")
        .replace(/\.\d{3}Z$/, "Z"),
      txt =
        "BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//Tianji//CN\r\nBEGIN:VEVENT\r\nUID:" +
        Date.now() +
        "@tianji\r\nDTSTAMP:" +
        new Date()
          .toISOString()
          .replace(/[-:]/g, "")
          .replace(/\.\d{3}Z$/, "Z") +
        "\r\nDTSTART:" +
        st +
        "\r\nDTEND:" +
        en +
        "\r\nSUMMARY:" +
        title +
        "\r\nDESCRIPTION:" +
        desc.replace(/[\r\n]/g, " ") +
        "\r\nEND:VEVENT\r\nEND:VCALENDAR";
    var a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([txt], { type: "text/calendar;charset=utf-8" }));
    a.download = title.replace(/\s+/g, "_") + ".ics";
    a.click();
    setTimeout(function () {
      URL.revokeObjectURL(a.href);
    }, 1500);
  }
  function eclNotifyCheck() {
    var now = Date.now(),
      dirty = false;
    ECL.rem.forEach(function (r) {
      if (r.done) return;
      var t = dateUTC(r.iso).getTime() - r.lead * 60000;
      if (now >= t && now < t + 120000) {
        r.done = true;
        dirty = true;
        var msg =
          r.label +
          " 将在 " +
          (r.lead >= 1440
            ? Math.round(r.lead / 1440) + " 天"
            : r.lead >= 60
              ? Math.round(r.lead / 60) + " 小时"
              : r.lead + " 分钟") +
          "后达到最大食";
        try {
          if ("Notification" in window && Notification.permission === "granted")
            new Notification("天机盘 · 日月食提醒", { body: msg });
        } catch (_) {}
        toast119(msg);
      }
    });
    if (dirty) eclSaveRem();
  }
  function eclTab(k) {
    ECL.tab = k;
    qa119("[data-ecl-tab]").forEach(function (b) {
      b.classList.toggle("on", b.dataset.eclTab === k);
    });
    qa119("[data-ecl-pane]").forEach(function (p) {
      p.classList.toggle("on", p.dataset.eclPane === k);
    });
  }
  function eclSelect(i, fromUser) {
    ECL.idx = Math.max(0, Math.min(ECL_EVENTS.length - 1, i));
    ECL.center = eclJD(eclEvent());
    ECL.jd = ECL.center;
    ECL.playing = false;
    var sel = q119("#eclSelect");
    if (sel) sel.value = String(ECL.idx);
    var sl = q119("#eclSlider");
    if (sl) sl.value = "0";
    var off = q119("#eclOff");
    if (off) off.textContent = "+0分";
    var pb = q119("#eclPlay");
    if (pb) pb.textContent = "▶ 播放";
    eclSummary();
    eclDetail();
    eclSchedule();
    eclRemindPane();
    eclDraw();
    if (fromUser && window.ORR3D) {
      ORR3D.jd = ECL.center;
      ORR3D.orbitCache = { key: null, data: {} };
    }
  }
  function eclBind() {
    var cv = q119("#ecl3dCv");
    if (!cv) return;
    /* v120：绑定以“当前 canvas DOM 节点”为准。天象页重建后必须重新绑定，不能只看旧的全局 installed。 */
    if (!ECL.remLoaded) {
      eclLoadRem();
      ECL.remLoaded = true;
    }
    if (!ECL.center || !isFinite(ECL.center)) {
      ECL.idx = eclNextIndex();
      ECL.center = eclJD(eclEvent());
      ECL.jd = ECL.center;
    }
    if (ECL.boundCv === cv && cv.dataset.eclBound === "1") {
      eclFit();
      eclSummary();
      eclDetail();
      eclSchedule();
      eclRemindPane();
      return;
    }
    ECL.boundCv = cv;
    ECL.cv = cv;
    ECL.installed = true;
    cv.dataset.eclBound = "1";
    var sel = q119("#eclSelect");
    if (sel) {
      sel.innerHTML = ECL_EVENTS.map(function (e, i) {
        return (
          '<option value="' +
          i +
          '">' +
          eclTypeClass(e) +
          " " +
          e.type +
          " · " +
          e.iso.slice(0, 10) +
          "</option>"
        );
      }).join("");
      sel.value = String(ECL.idx);
      sel.onchange = function () {
        eclSelect(+sel.value, true);
      };
    }
    var pv = q119("#eclPrev");
    if (pv)
      pv.onclick = function () {
        eclSelect(ECL.idx - 1, true);
      };
    var nx = q119("#eclNext");
    if (nx)
      nx.onclick = function () {
        eclSelect(ECL.idx + 1, true);
      };
    var pl = q119("#eclPlay");
    if (pl) {
      pl.textContent = ECL.playing ? "⏸ 暂停" : "▶ 播放";
      pl.onclick = function () {
        ECL.playing = !ECL.playing;
        this.textContent = ECL.playing ? "⏸ 暂停" : "▶ 播放";
      };
    }
    var sp = q119("#eclSpeed");
    if (sp) {
      sp.value = String(Math.round(ECL.speed * 1440) || 5);
      sp.onchange = function () {
        ECL.speed = (+this.value || 5) / 1440;
      };
    }
    var mx = q119("#eclMax");
    if (mx)
      mx.onclick = function () {
        ECL.jd = ECL.center;
        ECL.playing = false;
        var sl = q119("#eclSlider");
        if (sl) sl.value = 0;
        var pb = q119("#eclPlay");
        if (pb) pb.textContent = "▶ 播放";
        eclRefresh();
      };
    var sl = q119("#eclSlider");
    if (sl) {
      sl.value = String(Math.round((ECL.jd - ECL.center) * 1440) || 0);
      sl.oninput = function () {
        ECL.jd = ECL.center + +this.value / 1440;
        ECL.playing = false;
        var pb = q119("#eclPlay");
        if (pb) pb.textContent = "▶ 播放";
        eclRefresh();
      };
    }
    qa119("[data-ecl-tab]").forEach(function (b) {
      b.onclick = function () {
        eclTab(b.dataset.eclTab);
      };
    });
    cv.style.touchAction = "none";
    var drag = null;
    cv.onpointerdown = function (e) {
      drag = { x: e.clientX, y: e.clientY, yaw: ECL.yaw, pitch: ECL.pitch };
      try {
        cv.setPointerCapture(e.pointerId);
      } catch (_) {}
    };
    cv.onpointermove = function (e) {
      if (!drag) return;
      ECL.yaw = drag.yaw + (e.clientX - drag.x) * 0.006;
      ECL.pitch = Math.max(-1.15, Math.min(1.15, drag.pitch + (e.clientY - drag.y) * 0.006));
      eclDraw();
    };
    cv.onpointerup = cv.onpointercancel = function () {
      drag = null;
    };
    cv.onwheel = function (e) {
      e.preventDefault();
      ECL.dist = Math.max(180, Math.min(920, ECL.dist * Math.exp(e.deltaY * 0.0018)));
      eclDraw();
    };
    cv.ondblclick = function () {
      ECL.yaw = -0.55;
      ECL.pitch = 0.26;
      ECL.dist = 440;
      eclDraw();
    };
    if (window.ResizeObserver) {
      if (ECL.ro)
        try {
          ECL.ro.disconnect();
        } catch (_) {}
      ECL.ro = new ResizeObserver(function () {
        eclFit();
      });
      ECL.ro.observe(cv.parentElement);
    } else window.addEventListener("resize", eclFit, { passive: true });
    eclFit();
    eclSelect(ECL.idx, false);
    eclTab(ECL.tab || "solar");
    if (!ECL.loopStarted) {
      ECL.loopStarted = true;
      eclLoop(performance.now());
    }
    if (!window.__eclRem119) {
      window.__eclRem119 = setInterval(eclNotifyCheck, 60000);
    }
    eclNotifyCheck();
  }
  function eclRefresh() {
    var off = Math.round((ECL.jd - ECL.center) * 1440),
      sl = q119("#eclSlider");
    if (sl) sl.value = String(Math.max(-480, Math.min(480, off)));
    var o = q119("#eclOff");
    if (o) o.textContent = (off >= 0 ? "+" : "") + off + "分";
    eclSummary();
    eclDraw();
  }
  function eclLoop(ts) {
    var panel = q119("#orrModeEclipse");
    if (!panel || panel.hidden || document.hidden) {
      ECL.last = ts;
      ECL.raf = 0;
      return;
    }
    ECL.raf = requestAnimationFrame(eclLoop);
    if (ts - (ECL._ft || 0) < 34) return;
    ECL._ft = ts;
    var dt = Math.min(0.12, (ts - (ECL.last || ts)) / 1000);
    ECL.last = ts;
    if (ECL.playing) {
      ECL.jd += ECL.speed * dt;
      var off = (ECL.jd - ECL.center) * 1440;
      if (off > 480) ECL.jd = ECL.center - 480 / 1440;
      eclRefresh();
    } else eclDraw();
  }

  /* ---------- 行星近景：地球昼夜面 + 地轴；木星四颗伽利略卫星 ---------- */
  var JMOONS = [
    ["木卫一 Io", 421700, 1.769, "#e9d18a"],
    ["木卫二 Europa", 671100, 3.551, "#d9c8aa"],
    ["木卫三 Ganymede", 1070400, 7.155, "#b6aca3"],
    ["木卫四 Callisto", 1882700, 16.689, "#8f857c"],
  ];
  function planetWorld119(n) {
    var T = (ORR3D.jd - 2451545) / 36525,
      h = asHelio(n, T);
    return ORR3D.scaleModel === "real"
      ? { x: h.x * 1000, y: h.y * 1000, z: h.z * 1000 }
      : orr3dCompress(h);
  }
  function earthNear119() {
    if (!window.ORR3D || ORR3D.mode !== "3d" || ORR3D.selected !== "地球") return;
    var O = ORR3D,
      c = O.ctx,
      w = planetWorld119("地球"),
      p = orr3dProj(w.x, w.y, w.z);
    if (!p || p.x < -80 || p.x > O.cw + 80 || p.y < -80 || p.y > O.ch + 80) return;
    var sun = orr3dProj(0, 0, 0),
      dx = sun.x - p.x,
      dy = sun.y - p.y,
      L = Math.hypot(dx, dy) || 1,
      rr = Math.max(8, Math.min(34, 16 * p.s));
    c.save();
    c.beginPath();
    c.arc(p.x, p.y, rr, 0, Math.PI * 2);
    c.clip();
    var g = c.createLinearGradient(
      p.x - (dx / L) * rr,
      p.y - (dy / L) * rr,
      p.x + (dx / L) * rr,
      p.y + (dy / L) * rr,
    );
    g.addColorStop(0, "rgba(2,6,12,.74)");
    g.addColorStop(0.48, "rgba(2,6,12,.28)");
    g.addColorStop(0.55, "rgba(255,255,255,0)");
    g.addColorStop(1, "rgba(255,255,255,.04)");
    c.fillStyle = g;
    c.fillRect(p.x - rr, p.y - rr, rr * 2, rr * 2);
    c.restore();
    var tilt = (23.44 * Math.PI) / 180,
      len = rr * 1.7;
    c.save();
    c.strokeStyle = "rgba(225,235,245,.72)";
    c.lineWidth = 1.2;
    c.beginPath();
    c.moveTo(p.x - Math.sin(tilt) * len, p.y + Math.cos(tilt) * len);
    c.lineTo(p.x + Math.sin(tilt) * len, p.y - Math.cos(tilt) * len);
    c.stroke();
    c.fillStyle = "#d6e5f2";
    c.font = "9px sans-serif";
    c.fillText("地轴 23.44°", p.x + rr + 5, p.y + rr);
    c.restore();
  }
  function jupiterMoons119() {
    if (!window.ORR3D || ORR3D.mode !== "3d" || ORR3D.selected !== "木星") return;
    var O = ORR3D,
      c = O.ctx,
      jw = planetWorld119("木星"),
      jp = orr3dProj(jw.x, jw.y, jw.z);
    if (!jp) return;
    var compact = O.scaleModel !== "real",
      maxWorld = compact ? Math.max(28, 55 / Math.max(0.25, jp.s)) : (1882700 / AU_KM119) * 1000,
      tilt = (3.1 * Math.PI) / 180;
    c.save();
    JMOONS.forEach(function (m, i) {
      var rad = maxWorld * (m[1] / 1882700),
        phase = (O.jd / m[2]) * Math.PI * 2 + i * 0.9,
        x = rad * Math.cos(phase),
        y = rad * Math.sin(phase) * Math.cos(tilt),
        z = rad * Math.sin(phase) * Math.sin(tilt),
        pts = [];
      for (var k = 0; k <= 64; k++) {
        var a = (k / 64) * Math.PI * 2;
        pts.push({
          x: jw.x + rad * Math.cos(a),
          y: jw.y + rad * Math.sin(a) * Math.cos(tilt),
          z: jw.z + rad * Math.sin(a) * Math.sin(tilt),
        });
      }
      orr3dPath(pts, "rgba(160,190,215,.24)", 0.8, [2, 3], 1);
      var q = orr3dProj(jw.x + x, jw.y + y, jw.z + z),
        rr = compact ? 2.3 : Math.max(1.8, (i + 1) * 0.5);
      c.fillStyle = m[3];
      c.beginPath();
      c.arc(q.x, q.y, rr, 0, Math.PI * 2);
      c.fill();
      if (O.show.labels) {
        c.fillStyle = "rgba(220,230,238,.78)";
        c.font = "9px sans-serif";
        c.textAlign = "left";
        c.fillText(m[0], q.x + 4, q.y - 3);
      }
    });
    c.restore();
  }
  var OLD_DRAW119 = window.orr3dDraw;
  if (typeof OLD_DRAW119 === "function")
    window.orr3dDraw = function () {
      OLD_DRAW119.apply(this, arguments);
      try {
        earthNear119();
        jupiterMoons119();
      } catch (e) {
        console.warn("v119 near planet", e);
      }
    };
  var OLD_INFO119 = window.orr3dInfo;
  if (typeof OLD_INFO119 === "function")
    window.orr3dInfo = function () {
      OLD_INFO119.apply(this, arguments);
      var el = q119("#orr3dInfo");
      if (!el || !window.ORR3D) return;
      if (ORR3D.selected === "木星" && ORR3D.mode === "3d")
        el.insertAdjacentHTML(
          "beforeend",
          '<span><b>伽利略卫星</b> · 木卫一 Io · 木卫二 Europa · 木卫三 Ganymede · 木卫四 Callisto <span class="v119-near-note">已在近景显示轨道</span></span>',
        );
      if (ORR3D.selected === "地球" && ORR3D.mode === "3d")
        el.insertAdjacentHTML(
          "beforeend",
          "<span><b>近景增强</b> · 昼夜面方向 · 地轴 23.44° · 月球轨道与太阴位置</span>",
        );
      if (ORR3D.mode === "eclipse") {
        var ev = eclEvent();
        el.innerHTML =
          "<span><b>" +
          ev.type +
          "</b> · " +
          fmtUTC(ev.iso) +
          " · " +
          countdown(dateUTC(ev.iso)) +
          "</span><span>" +
          esc119(ev.region) +
          "</span>";
      }
    };

  /* ---------- 流星雨 / 近地天体 ---------- */
  var SHOWERS = [
    {
      id: "QUA",
      n: "象限仪座流星雨",
      code: "QUA",
      m: 1,
      d: 3,
      ut: 20,
      ra: 230,
      dec: 49,
      v: 41,
      zhr: 120,
      active: "12/28–01/12",
      parent: "2003 EH1",
    },
    {
      id: "LYR",
      n: "天琴座流星雨",
      code: "LYR",
      m: 4,
      d: 22,
      ut: 13,
      ra: 271,
      dec: 34,
      v: 49,
      zhr: 18,
      active: "04/14–04/30",
      parent: "C/1861 G1 Thatcher",
    },
    {
      id: "ETA",
      n: "宝瓶座η流星雨",
      code: "ETA",
      m: 5,
      d: 6,
      ut: 4,
      ra: 338,
      dec: -1,
      v: 66,
      zhr: 50,
      active: "04/19–05/28",
      parent: "1P/Halley 哈雷彗星",
    },
    {
      id: "SDA",
      n: "南宝瓶座δ流星雨",
      code: "SDA",
      m: 7,
      d: 31,
      ut: 0,
      ra: 340,
      dec: -16,
      v: 41,
      zhr: 25,
      active: "07/12–08/23",
      parent: "96P/Machholz 相关流星体群",
    },
    {
      id: "PER",
      n: "英仙座流星雨",
      code: "PER",
      m: 8,
      d: 13,
      ut: 0,
      ra: 48,
      dec: 58,
      v: 59,
      zhr: 100,
      active: "07/17–08/24",
      parent: "109P/Swift–Tuttle",
    },
    {
      id: "DRA",
      n: "天龙座流星雨",
      code: "DRA",
      m: 10,
      d: 9,
      ut: 1,
      ra: 263,
      dec: 56,
      v: 20,
      zhr: 5,
      active: "10/06–10/10",
      parent: "21P/Giacobini–Zinner",
      note: "2026 IMO：预计极大 10月9日 01:00 UT，ZHR≈5（不确定）；活动年际变化大，历史上曾出现爆发",
    },
    {
      id: "ORI",
      n: "猎户座流星雨",
      code: "ORI",
      m: 10,
      d: 21,
      ut: 0,
      ra: 95,
      dec: 16,
      v: 66,
      zhr: 20,
      active: "10/02–11/07",
      parent: "1P/Halley 哈雷彗星",
    },
    {
      id: "STA",
      n: "南金牛座流星雨",
      code: "STA",
      m: 11,
      d: 5,
      ut: 0,
      ra: 52,
      dec: 15,
      v: 27,
      zhr: 5,
      active: "09/20–11/20",
      parent: "2P/Encke / 金牛座复合流星体群",
    },
    {
      id: "NTA",
      n: "北金牛座流星雨",
      code: "NTA",
      m: 11,
      d: 12,
      ut: 0,
      ra: 58,
      dec: 22,
      v: 29,
      zhr: 5,
      active: "10/20–12/10",
      parent: "金牛座复合流星体群",
    },
    {
      id: "LEO",
      n: "狮子座流星雨",
      code: "LEO",
      m: 11,
      d: 17,
      ut: 23.75,
      ra: 152,
      dec: 22,
      v: 71,
      zhr: 15,
      active: "11/06–11/30",
      parent: "55P/Tempel–Tuttle",
      note: "2026 常规极大约 11月17日 23:45 UT；模型还给出若干弱尘埃尾迹相遇",
    },
    {
      id: "GEM",
      n: "双子座流星雨",
      code: "GEM",
      m: 12,
      d: 14,
      ut: 8,
      ra: 112,
      dec: 33,
      v: 35,
      zhr: 150,
      active: "12/04–12/20",
      parent: "3200 Phaethon",
    },
    {
      id: "URS",
      n: "小熊座流星雨",
      code: "URS",
      m: 12,
      d: 22,
      ut: 8,
      ra: 217,
      dec: 76,
      v: 33,
      zhr: 10,
      active: "12/17–12/26",
      parent: "8P/Tuttle",
    },
  ];
  var MET = {
    sel: "ORI",
    tab: "shower",
    cv: null,
    ctx: null,
    w: 0,
    h: 0,
    yaw: -0.65,
    pitch: 0.35,
    zoom: 1,
    phase: 0,
    last: 0,
    raf: 0,
    neo: [],
    neoSel: null,
    neoLoading: false,
    visible: true,
    loopStarted: false,
    ro: null,
  };
  function showerPeak(sh, year) {
    var h = Math.floor(sh.ut || 0),
      mi = Math.round(((sh.ut || 0) - h) * 60);
    return new Date(Date.UTC(year, sh.m - 1, sh.d, h, mi, 0));
  }
  function showerNext(sh) {
    var y = new Date().getUTCFullYear(),
      d = showerPeak(sh, y);
    if (d.getTime() < Date.now() - 2 * 864e5) d = showerPeak(sh, y + 1);
    return d;
  }
  function showerSelected() {
    return (
      SHOWERS.find(function (s) {
        return s.id === MET.sel;
      }) || SHOWERS[0]
    );
  }
  function showerBest(sh) {
    var peak = showerNext(sh),
      l = loc119(),
      best = null;
    for (var h = -8; h <= 8; h += 0.5) {
      var d = new Date(peak.getTime() + h * 3600e3),
        jd = smJD(d),
        sun = smSun(jd),
        sa = smAltAz(sun.eq.ra, sun.eq.dec, jd, l.lon, l.lat).alt,
        ra = smAltAz(sh.ra / 15, sh.dec, jd, l.lon, l.lat);
      if (sa < -9 && (!best || ra.alt > best.alt))
        best = { d: d, jd: jd, alt: ra.alt, az: ra.az, sun: sa };
    }
    if (!best) {
      var jd0 = smJD(peak),
        a = smAltAz(sh.ra / 15, sh.dec, jd0, l.lon, l.lat);
      best = {
        d: peak,
        jd: jd0,
        alt: a.alt,
        az: a.az,
        sun: smAltAz(smSun(jd0).eq.ra, smSun(jd0).eq.dec, jd0, l.lon, l.lat).alt,
      };
    }
    var mo = smMoon(best.jd),
      su = smSun(best.jd),
      ph = smPhase(mo.lon, su.lon);
    return Object.assign(best, { moon: ph.k });
  }
  function dir119(a) {
    var N = ["北", "东北", "东", "东南", "南", "西南", "西", "西北"];
    return N[Math.round(smN360(a) / 45) % 8];
  }
  function metClamp(v, a, b) {
    return Math.max(a, Math.min(b, v));
  }
  function metGmst(jd) {
    var T = (jd - 2451545) / 36525;
    return smN360(
      280.46061837 +
        360.98564736629 * (jd - 2451545) +
        0.000387933 * T * T -
        (T * T * T) / 38710000,
    );
  }
  function metZones(sh) {
    var d = +sh.dec,
      lat = loc119().lat,
      r0 = metClamp(d - 90, -90, 90),
      r1 = metClamp(d + 90, -90, 90),
      g0 = metClamp(d - 60, -90, 90),
      g1 = metClamp(d + 60, -90, 90),
      z0 = metClamp(d - 20, -90, 90),
      z1 = metClamp(d + 20, -90, 90),
      maxAlt = 90 - Math.abs(lat - d);
    return { rise: [r0, r1], good: [g0, g1], zen: [z0, z1], lat: lat, maxAlt: maxAlt };
  }
  function metLat(v) {
    var a = Math.abs(v),
      s = v < 0 ? "南纬" : "北纬";
    return a < 0.05 ? "赤道" : s + a.toFixed(0) + "°";
  }
  function metZoneHTML(sh, b) {
    var z = metZones(sh),
      pct = function (v) {
        return ((v + 90) / 180) * 100;
      },
      local = b.alt > 30 ? "较适合" : b.alt > 10 ? "条件一般" : "不理想";
    return (
      '<div class="met-zone"><div class="met-zone-head"><b>全球可观测纬度带</b><span>当前地点 ' +
      metLat(z.lat) +
      " · " +
      local +
      '</span></div><div class="met-zonebar"><i class="rise" style="left:' +
      pct(z.rise[0]) +
      "%;width:" +
      (pct(z.rise[1]) - pct(z.rise[0])) +
      '%"></i><i class="good" style="left:' +
      pct(z.good[0]) +
      "%;width:" +
      (pct(z.good[1]) - pct(z.good[0])) +
      '%"></i><i class="zen" style="left:' +
      pct(sh.dec) +
      '%" title="辐射点过天顶纬度"></i><i class="here" style="left:' +
      pct(z.lat) +
      '%" title="当前地点纬度"></i></div><div class="met-zone-scale"><span>90°S</span><span>赤道</span><span>90°N</span></div><div class="met-zone-note">青色=辐射点理论可升起；绿色=辐射点最高高度可超过约30°；金线=最接近天顶的纬度（约 ' +
      metLat(sh.dec) +
      "）；红线=当前地点。理论可升起约 <b>" +
      metLat(z.rise[0]) +
      " 至 " +
      metLat(z.rise[1]) +
      "</b>，较优约 <b>" +
      metLat(z.good[0]) +
      " 至 " +
      metLat(z.good[1]) +
      "</b>。实际还受当地昼夜、天气、月光和光污染影响。</div></div>"
    );
  }
  function metBasis(n) {
    var a = Math.abs(n.z) < 0.85 ? { x: 0, y: 0, z: 1 } : { x: 0, y: 1, z: 0 },
      u = { x: n.y * a.z - n.z * a.y, y: n.z * a.x - n.x * a.z, z: n.x * a.y - n.y * a.x },
      L = Math.hypot(u.x, u.y, u.z) || 1;
    u.x /= L;
    u.y /= L;
    u.z /= L;
    var v = { x: n.y * u.z - n.z * u.y, y: n.z * u.x - n.x * u.z, z: n.x * u.y - n.y * u.x };
    return { u: u, v: v };
  }
  function metPath3(c, pts, col, w, dash, alpha) {
    c.save();
    c.strokeStyle = col;
    c.lineWidth = w || 1;
    c.globalAlpha = alpha == null ? 1 : alpha;
    if (dash) c.setLineDash(dash);
    c.beginPath();
    var pen = false;
    pts.forEach(function (p) {
      var q = metP(p);
      if (!isFinite(q.x) || !isFinite(q.y)) {
        pen = false;
        return;
      }
      if (!pen) {
        c.moveTo(q.x, q.y);
        pen = true;
      } else c.lineTo(q.x, q.y);
    });
    c.stroke();
    c.restore();
  }
  function metCirclePlane(n, r, steps) {
    var B = metBasis(n),
      a = [];
    for (var i = 0; i <= steps; i++) {
      var t = (i / steps) * Math.PI * 2;
      a.push({
        x: (B.u.x * Math.cos(t) + B.v.x * Math.sin(t)) * r,
        y: (B.u.y * Math.cos(t) + B.v.y * Math.sin(t)) * r,
        z: (B.u.z * Math.cos(t) + B.v.z * Math.sin(t)) * r,
      });
    }
    return a;
  }

  function meteorHTML() {
    return '<div class="panel blk met-lab" id="meteorPanel"><div class="met-head"><div><h3>流星 · 流星雨 · 近地天体</h3><div class="dim sm">流星雨峰值 / 辐射点 / 全球可观测纬度带 · NASA NeoWs 实时近地天体 · 专业化 3D 空间示意</div></div><div class="met-tabs"><button class="on" data-met-tab="shower">流星雨</button><button data-met-tab="neo">近地天体 · 实时</button></div></div><div class="met-grid"><div class="met-main"><div data-met-pane="shower"><div id="metHero" class="met-hero"></div><div class="met-list" id="metList"></div><div class="met-detail" id="metDetail"></div></div><div data-met-pane="neo" hidden><div class="met-actions"><button class="gbtn sm" id="neoLoad">刷新实时数据</button><label>未来 <select id="neoDays"><option value="7" selected>7天</option><option value="14">14天</option><option value="30">30天</option></select></label><input class="neo-key" id="neoApiKey" type="password" autocomplete="off" placeholder="NASA API Key（可选）"><span class="met-live-badge">NASA NeoWs</span></div><div class="neo-status" id="neoStatus">进入本页后自动请求 NASA Open APIs NeoWs；数据来自 NASA/JPL 小行星团队。默认使用 DEMO_KEY，也可填自己的 NASA API Key。</div><div class="neo-table-wrap"><table class="met-table"><thead><tr><th>天体</th><th>最近接近</th><th>距离</th><th>速度</th><th>倒计时</th></tr></thead><tbody id="neoBody"><tr><td colspan="5" class="dim">等待实时同步。</td></tr></tbody></table></div><p class="neo-note">这里展示的是已知近地小行星在所选时间窗内的<b>最近接近</b>。PHA（潜在危险小行星）是轨道/尺寸分类，不等于“将撞击地球”。JPL SSD 原 CAD API 不允许直接嵌入网页，因此本单文件实时层改用 NASA Open APIs NeoWs；若网络失败，会优先显示最近一次成功缓存。</p></div></div><aside class="met-view"><div class="met-stage"><canvas id="met3dCv"></canvas><div class="tag" id="met3dTag">辐射点 · 天球参照 · 大气入射 · 本地地平线</div></div><div class="met-detail" id="metViewInfo"></div><p class="met-source">流星雨参数为年度/周期性参考，具体峰值以对应年度 IMO 日历为准；可观测区按辐射点赤纬与当地地平几何估算。近地天体实时层使用 NASA Open APIs NeoWs（数据源自 NASA/JPL Asteroid Team）。3D 是方向与空间关系可视化，不是精密轨道积分。</p></aside></div></div>';
  }
  function metHero() {
    var arr = SHOWERS.map(function (s) {
        return { s: s, d: showerNext(s) };
      }).sort(function (a, b) {
        return a.d - b.d;
      }),
      x = arr[0],
      sh = x.s,
      b = showerBest(sh),
      z = metZones(sh),
      el = q119("#metHero");
    if (!el) return;
    el.innerHTML =
      "<h4>最近峰值 · " +
      sh.n +
      ' <small class="dim">' +
      sh.code +
      '</small></h4><div class="count">' +
      countdown(x.d) +
      "</div><p>预计峰值 " +
      fmtUTC(x.d.toISOString()) +
      " · ZHR ≈ " +
      sh.zhr +
      " · 速度 " +
      sh.v +
      " km/s · 母体 " +
      esc119(sh.parent) +
      "</p><p>当前地点较合适时段：<b>" +
      dir119(b.az) +
      "</b> 方，高度 <b>" +
      b.alt.toFixed(0) +
      "°</b>；月面照亮约 " +
      (b.moon * 100).toFixed(0) +
      "%。全球较优纬度约 " +
      metLat(z.good[0]) +
      " 至 " +
      metLat(z.good[1]) +
      "。</p>";
  }
  function metList() {
    var box = q119("#metList");
    if (!box) return;
    var y = new Date().getUTCFullYear(),
      rows = SHOWERS.map(function (s) {
        var d = showerPeak(s, y);
        if (d.getTime() < Date.now() - 2 * 864e5) d = showerPeak(s, y + 1);
        return (
          '<button class="row ' +
          (s.id === MET.sel ? "on" : "") +
          '" data-sh="' +
          s.id +
          '"><span><b>' +
          s.n +
          "</b><br><small>" +
          s.active +
          "</small></span><span>" +
          n2(d.getUTCMonth() + 1) +
          "-" +
          n2(d.getUTCDate()) +
          " " +
          n2(d.getUTCHours()) +
          ":" +
          n2(d.getUTCMinutes()) +
          "Z</span><span>ZHR " +
          s.zhr +
          "</span><span>" +
          s.v +
          " km/s</span></button>"
        );
      }).join("");
    box.innerHTML = rows;
    qa119("[data-sh]", box).forEach(function (b) {
      b.onclick = function () {
        MET.sel = b.dataset.sh;
        MET.tab = "shower";
        metRender();
      };
    });
  }
  function metDetail() {
    var sh = showerSelected(),
      peak = showerNext(sh),
      b = showerBest(sh),
      el = q119("#metDetail");
    if (!el) return;
    var vis =
      b.alt > 30
        ? "辐射点高度较好"
        : b.alt > 10
          ? "辐射点较低，仍可尝试"
          : "辐射点很低 / 可能不适合此地";
    el.innerHTML =
      "<h5>" +
      sh.n +
      " · " +
      sh.code +
      "</h5><p><b>峰值：</b>" +
      fmtUTC(peak.toISOString()) +
      " · " +
      countdown(peak) +
      "</p><p><b>辐射点：</b>RA " +
      sh.ra +
      "° · Dec " +
      (sh.dec >= 0 ? "+" : "") +
      sh.dec +
      "°；最佳辅助时段约在 " +
      fmtLocal(b.d.toISOString()) +
      "，方向 " +
      dir119(b.az) +
      " " +
      b.az.toFixed(0) +
      "°，高度 " +
      b.alt.toFixed(0) +
      "°（" +
      vis +
      "）。</p><p><b>活动：</b>" +
      sh.active +
      " · ZHR≈" +
      sh.zhr +
      " · 入射速度 " +
      sh.v +
      " km/s · 母体 " +
      esc119(sh.parent) +
      "</p>" +
      metZoneHTML(sh, b) +
      "<p><b>月光：</b>该辅助时段月面照亮约 " +
      (b.moon * 100).toFixed(0) +
      "%。实际可见数量还取决于云量、光污染、月光、辐射点高度与暗适应。</p><p><b>怎么看：</b>不要死盯辐射点，通常把视线放在辐射点外约 30–60°、天空较暗的区域，裸眼视野更大。</p>" +
      (sh.note ? '<p class="met-warn">' + esc119(sh.note) + "</p>" : "") +
      '<div class="met-actions"><button class="gbtn sm" id="metIcs">加入峰值日历 .ics</button></div>';
    var ic = q119("#metIcs");
    if (ic)
      ic.onclick = function () {
        downloadIcs119(sh.n + " 峰值", peak.toISOString(), "ZHR≈" + sh.zhr + "；母体 " + sh.parent);
      };
  }
  function metRender() {
    metHero();
    metList();
    metDetail();
    metInfo();
    metDraw();
  }
  function metTab(k) {
    MET.tab = k;
    qa119("[data-met-tab]").forEach(function (b) {
      b.classList.toggle("on", b.dataset.metTab === k);
    });
    qa119("[data-met-pane]").forEach(function (p) {
      p.hidden = p.dataset.metPane !== k;
    });
    var tag = q119("#met3dTag");
    if (tag)
      tag.textContent =
        k === "shower"
          ? "辐射点 · 天球参照 · 大气入射 · 本地地平线"
          : "近地天体 · 地球最近接近轨迹示意";
    metInfo();
    metDraw();
    if (k === "neo" && !MET.neo.length && !MET.neoLoading)
      setTimeout(function () {
        neoLoad(false);
      }, 30);
  }
  function vecFromRaDec(ra, dec) {
    var a = (ra * Math.PI) / 180,
      d = (dec * Math.PI) / 180,
      cd = Math.cos(d);
    return { x: cd * Math.cos(a), y: cd * Math.sin(a), z: Math.sin(d) };
  }
  function metRot(p) {
    var cy = Math.cos(MET.yaw),
      sy = Math.sin(MET.yaw),
      x = p.x * cy - p.y * sy,
      y = p.x * sy + p.y * cy,
      z = p.z,
      cp = Math.cos(MET.pitch),
      sp = Math.sin(MET.pitch);
    return { x: x, y: y * cp - z * sp, z: y * sp + z * cp };
  }
  function metP(p) {
    var q = metRot(p),
      s = Math.min(MET.w, MET.h) * 0.36 * MET.zoom;
    return { x: MET.w / 2 + q.x * s, y: MET.h / 2 - q.z * s, d: q.y };
  }
  function metSphere(c) {
    var C = { x: 0, y: 0, z: 0 },
      p = metP(C),
      r = Math.min(MET.w, MET.h) * 0.11 * MET.zoom,
      g = c.createRadialGradient(p.x - r * 0.35, p.y - r * 0.35, 2, p.x, p.y, r);
    g.addColorStop(0, "#aee0ff");
    g.addColorStop(0.55, "#3479ae");
    g.addColorStop(1, "#102946");
    c.fillStyle = g;
    c.beginPath();
    c.arc(p.x, p.y, r, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = "rgba(180,220,245,.35)";
    c.lineWidth = 1;
    c.beginPath();
    c.ellipse(p.x, p.y, r, r * 0.35, 0, 0, Math.PI * 2);
    c.stroke();
    return { p: p, r: r };
  }
  function metDraw() {
    var c = MET.ctx;
    if (!c) return;
    var W = MET.w,
      H = MET.h;
    c.clearRect(0, 0, W, H);
    var g = c.createRadialGradient(W * 0.48, H * 0.42, 8, W * 0.5, H * 0.52, Math.max(W, H) * 0.72);
    g.addColorStop(0, "#142943");
    g.addColorStop(0.52, "#07111d");
    g.addColorStop(1, "#020408");
    c.fillStyle = g;
    c.fillRect(0, 0, W, H);
    /* 稳定星野 */ for (var i = 0; i < 125; i++) {
      var x = (((i * 149) % 997) / 997) * W,
        y = (((i * 83) % 991) / 991) * H;
      c.globalAlpha = 0.12 + (i % 7) * 0.055;
      c.fillStyle = i % 13 === 0 ? "#f2ddb2" : "#d9e6f4";
      c.beginPath();
      c.arc(x, y, i % 17 === 0 ? 1.15 : 0.55, 0, Math.PI * 2);
      c.fill();
    }
    c.globalAlpha = 1;
    if (MET.tab === "shower") {
      var sh = showerSelected(),
        best = showerBest(sh),
        rv = vecFromRaDec(sh.ra, sh.dec),
        er = 0.31,
        celR = 1.42,
        z = metZones(sh),
        loc = loc119(),
        lst = smN360(metGmst(best.jd) + loc.lon),
        obs = vecFromRaDec(lst, loc.lat),
        B = metBasis(rv);
      /* 天球参考：赤道、黄道、本地地平 */
      var eq = [];
      for (var k = 0; k <= 120; k++) {
        var a = (k / 120) * Math.PI * 2;
        eq.push({ x: 1.28 * Math.cos(a), y: 1.28 * Math.sin(a), z: 0 });
      }
      metPath3(c, eq, "rgba(105,150,205,.28)", 1, [4, 5], 1);
      var ecl = [];
      var eps = (23.44 * Math.PI) / 180;
      for (k = 0; k <= 120; k++) {
        a = (k / 120) * Math.PI * 2;
        ecl.push({
          x: 1.34 * Math.cos(a),
          y: 1.34 * Math.sin(a) * Math.cos(eps),
          z: 1.34 * Math.sin(a) * Math.sin(eps),
        });
      }
      metPath3(c, ecl, "rgba(217,178,95,.28)", 1, [6, 5], 1);
      metPath3(c, metCirclePlane(obs, 1.18, 120), "rgba(98,205,195,.42)", 1.2, [5, 4], 1);
      /* 地球 */ var earth = metSphere(c),
        p0 = earth.p,
        rr = earth.r;
      c.save();
      c.beginPath();
      c.arc(p0.x, p0.y, rr, 0, Math.PI * 2);
      c.clip();
      c.strokeStyle = "rgba(205,229,245,.17)";
      c.lineWidth = 0.7;
      [-60, -30, 0, 30, 60].forEach(function (lat) {
        var pts = [];
        var ph = (lat * Math.PI) / 180;
        for (var q = 0; q <= 72; q++) {
          var lm = (q / 72) * Math.PI * 2;
          pts.push(
            metP({
              x: er * Math.cos(ph) * Math.cos(lm),
              y: er * Math.cos(ph) * Math.sin(lm),
              z: er * Math.sin(ph),
            }),
          );
        }
        c.beginPath();
        pts.forEach(function (P, j) {
          j ? c.lineTo(P.x, P.y) : c.moveTo(P.x, P.y);
        });
        c.stroke();
      });
      for (var lo = 0; lo < 360; lo += 30) {
        var pts2 = [];
        var lm = (lo * Math.PI) / 180;
        for (var la = -90; la <= 90; la += 5) {
          var ph = (la * Math.PI) / 180;
          pts2.push(
            metP({
              x: er * Math.cos(ph) * Math.cos(lm),
              y: er * Math.cos(ph) * Math.sin(lm),
              z: er * Math.sin(ph),
            }),
          );
        }
        c.beginPath();
        pts2.forEach(function (P, j) {
          j ? c.lineTo(P.x, P.y) : c.moveTo(P.x, P.y);
        });
        c.stroke();
      }
      c.restore();
      /* 观测者 */ var op = metP({
        x: obs.x * er * 1.04,
        y: obs.y * er * 1.04,
        z: obs.z * er * 1.04,
      });
      c.save();
      c.shadowBlur = 10;
      c.shadowColor = "#f0c86c";
      c.fillStyle = "#f0c86c";
      c.beginPath();
      c.arc(op.x, op.y, 3.4, 0, Math.PI * 2);
      c.fill();
      c.restore();
      c.fillStyle = "rgba(240,225,190,.84)";
      c.font = "9px sans-serif";
      c.fillText("观测点", op.x + 6, op.y - 5);
      /* 辐射点 + 视线 */ var rp = metP({ x: rv.x * 1.42, y: rv.y * 1.42, z: rv.z * 1.42 });
      c.save();
      c.setLineDash([5, 4]);
      c.strokeStyle = "rgba(240,201,105,.55)";
      c.beginPath();
      c.moveTo(op.x, op.y);
      c.lineTo(rp.x, rp.y);
      c.stroke();
      c.restore();
      c.save();
      c.shadowBlur = 14;
      c.shadowColor = "#ffd77a";
      c.fillStyle = "#ffd77a";
      c.beginPath();
      c.arc(rp.x, rp.y, 4.3, 0, Math.PI * 2);
      c.fill();
      c.restore();
      c.fillStyle = "#f0d58e";
      c.font = "10px sans-serif";
      c.fillText("辐射点 " + sh.code, rp.x + 7, rp.y - 5);
      /* 流星体流：平行入射 + 大气层亮迹 */ for (k = 0; k < 46; k++) {
        var phs = (MET.phase * (0.1 + sh.v / 900) + k * 0.137) % 1,
          ang = k * 2.399,
          rad = 0.04 + (0.18 * ((k * 47) % 19)) / 18,
          ox = (B.u.x * Math.cos(ang) + B.v.x * Math.sin(ang)) * rad,
          oy = (B.u.y * Math.cos(ang) + B.v.y * Math.sin(ang)) * rad,
          oz = (B.u.z * Math.cos(ang) + B.v.z * Math.sin(ang)) * rad,
          far = 1.82 - phs * 1.58,
          near = Math.max(0.34, far - 0.13),
          A = metP({ x: rv.x * far + ox, y: rv.y * far + oy, z: rv.z * far + oz }),
          C = metP({
            x: rv.x * near + ox * 0.72,
            y: rv.y * near + oy * 0.72,
            z: rv.z * near + oz * 0.72,
          });
        c.save();
        c.globalAlpha = 0.18 + 0.68 * phs;
        c.strokeStyle = k % 7 === 0 ? "#ffe0a0" : "#cfe6f6";
        c.lineWidth = k % 7 === 0 ? 1.45 : 0.75;
        c.beginPath();
        c.moveTo(A.x, A.y);
        c.lineTo(C.x, C.y);
        c.stroke();
        if (near < 0.52) {
          c.shadowBlur = 9;
          c.shadowColor = "#ffd08a";
          c.strokeStyle = "#fff1c4";
          c.lineWidth = 1.7;
          c.beginPath();
          c.moveTo(A.x, A.y);
          c.lineTo(C.x, C.y);
          c.stroke();
        }
        c.restore();
      }
      c.fillStyle = "rgba(215,224,235,.58)";
      c.font = "9px sans-serif";
      c.fillText("天赤道", 12, H - 42);
      c.fillStyle = "rgba(217,178,95,.67)";
      c.fillText("黄道", 12, H - 29);
      c.fillStyle = "rgba(98,205,195,.72)";
      c.fillText("本地地平圈", 12, H - 16);
      c.fillStyle = "rgba(230,230,224,.72)";
      c.textAlign = "right";
      c.fillText("较优纬度 " + metLat(z.good[0]) + " → " + metLat(z.good[1]), W - 12, H - 16);
      c.textAlign = "left";
    } else {
      var earth = metSphere(c);
      if (MET.neoSel) {
        var n = MET.neoSel,
          md = Math.min(1.2, Math.max(0.18, n.ld / 18)),
          phase = (MET.phase * 0.07) % 1,
          pts = [];
        for (var j = 0; j <= 110; j++) {
          var t = (j / 110) * 2 - 1,
            x = t * 1.8,
            y = md * (0.65 + 0.12 * Math.sin(t * 2)),
            zz = 0.22 * Math.sin(t * 1.8);
          pts.push({ x: x, y: y, z: zz });
        }
        metPath3(c, pts, "rgba(98,205,195,.62)", 1.4, null, 1);
        var tt = phase * 2 - 1,
          pp = metP({
            x: tt * 1.8,
            y: md * (0.65 + 0.12 * Math.sin(tt * 2)),
            z: 0.22 * Math.sin(tt * 1.8),
          });
        c.save();
        c.shadowBlur = 12;
        c.shadowColor = "#f0d089";
        c.fillStyle = "#f0d089";
        c.beginPath();
        c.arc(pp.x, pp.y, 4, 0, Math.PI * 2);
        c.fill();
        c.restore();
        c.fillStyle = "#dfe9ee";
        c.font = "10px sans-serif";
        c.fillText(n.name, pp.x + 7, pp.y - 5);
        c.fillStyle = "rgba(98,205,195,.7)";
        c.fillText("最近接近 " + n.ld.toFixed(2) + " LD", 12, H - 15);
      }
    }
    c.globalAlpha = 1;
  }
  function metFit() {
    var cv = q119("#met3dCv");
    if (!cv) return;
    var r = cv.getBoundingClientRect();
    if (r.width < 20) return;
    var h = Math.max(290, Math.min(430, r.width * 0.72)),
      dpr = Math.min(1.5, window.devicePixelRatio || 1);
    MET.cv = cv;
    MET.w = r.width;
    MET.h = h;
    cv.style.height = h + "px";
    cv.width = Math.round(r.width * dpr);
    cv.height = Math.round(h * dpr);
    MET.ctx = cv.getContext("2d");
    MET.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    metDraw();
  }
  function metInfo() {
    var el = q119("#metViewInfo");
    if (!el) return;
    if (MET.tab === "shower") {
      var s = showerSelected(),
        b = showerBest(s);
      el.innerHTML =
        "<h5>" +
        s.n +
        "</h5><p><b>辐射点</b> " +
        dir119(b.az) +
        " · 高度 " +
        b.alt.toFixed(0) +
        "° · 入射速度 " +
        s.v +
        " km/s</p><p>3D 同时显示天球赤道、黄道参考、本地地平圈、观测者位置与从辐射点方向进入大气的流星体流。亮起的短迹表示进入高层大气后的可见流星段。</p>" +
        metZoneHTML(s, b);
    } else if (MET.neoSel) {
      var n = MET.neoSel;
      el.innerHTML =
        "<h5>" +
        esc119(n.name) +
        (n.pha ? ' <span class="v122-pha">PHA</span>' : "") +
        ' <span class="v122-source">LIVE</span></h5><p>最近接近：' +
        esc119(n.cd) +
        " · " +
        countdown(n.date) +
        "</p><p>标称距离 " +
        n.ld.toFixed(2) +
        " 月距（" +
        n.au.toFixed(5) +
        " AU） · 相对速度 " +
        n.v.toFixed(1) +
        " km/s" +
        (n.diam ? " · 估计直径 " + n.diam : "") +
        '</p><p class="met-warn">PHA 仅表示“潜在危险小行星”分类条件，不代表本次接近会撞击地球。</p>';
    } else
      el.innerHTML =
        "<h5>近地天体 · 实时</h5><p>切到本页会自动同步 NASA NeoWs；若离线或达到 API 限额，则显示最近成功缓存，并标注更新时间。</p>";
  }
  function neoParseDate(s) {
    var m = /^(\d{4})-([A-Za-z]{3})-(\d{2})\s+(\d{2}):(\d{2})/.exec(s || "");
    if (!m) return new Date(s);
    var mon = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ].indexOf(m[2]);
    return new Date(Date.UTC(+m[1], mon, +m[3], +m[4], +m[5]));
  }
  function neoCacheRead() {
    try {
      var x = JSON.parse(localStorage.getItem("tianji.neo.v122") || "null");
      if (x && Array.isArray(x.data)) return x;
    } catch (_) {}
    return null;
  }
  function neoCacheSave(days, data) {
    try {
      localStorage.setItem(
        "tianji.neo.v122",
        JSON.stringify({ ts: Date.now(), days: days, data: data }),
      );
    } catch (_) {}
  }
  function neoFmtDiam(o) {
    try {
      var d = o.estimated_diameter && o.estimated_diameter.kilometers;
      if (!d) return null;
      var a = +d.estimated_diameter_min,
        b = +d.estimated_diameter_max;
      if (!isFinite(a) || !isFinite(b)) return null;
      if (b < 0.1) return Math.round(((a + b) / 2) * 1000) + " m";
      return ((a + b) / 2).toFixed(2) + " km";
    } catch (_) {
      return null;
    }
  }
  function neoRender(data, status, cls) {
    var st = q119("#neoStatus"),
      body = q119("#neoBody");
    MET.neo = data || [];
    MET.neoSel = MET.neo[0] || null;
    if (st) {
      st.className = "neo-status " + (cls || "");
      st.textContent = status || "";
    }
    if (body)
      body.innerHTML = MET.neo.length
        ? MET.neo
            .map(function (n, i) {
              return (
                '<tr data-neo="' +
                i +
                '"><td><b>' +
                esc119(n.name) +
                "</b>" +
                (n.pha ? '<span class="v122-pha">PHA</span>' : "") +
                '<br><small class="dim">NASA/JPL ID ' +
                esc119(n.id || "—") +
                "</small></td><td>" +
                esc119(n.cd) +
                "</td><td>" +
                n.ld.toFixed(2) +
                ' LD<br><small class="dim">' +
                n.au.toFixed(5) +
                " AU</small></td><td>" +
                n.v.toFixed(1) +
                " km/s</td><td>" +
                countdown(n.date) +
                "</td></tr>"
              );
            })
            .join("")
        : '<tr><td colspan="5">当前时间窗无已知近地天体接近记录。</td></tr>';
    qa119("[data-neo]", body).forEach(function (tr) {
      tr.onclick = function () {
        MET.neoSel = MET.neo[+tr.dataset.neo];
        qa119("[data-neo]", body).forEach(function (x) {
          x.classList.toggle("sel", x === tr);
        });
        metInfo();
        metDraw();
      };
    });
    if (body && MET.neo.length) {
      var first = body.querySelector("[data-neo]");
      if (first) first.classList.add("sel");
    }
    metInfo();
    metDraw();
  }
  function neoYmd(d) {
    return d.getUTCFullYear() + "-" + n2(d.getUTCMonth() + 1) + "-" + n2(d.getUTCDate());
  }
  async function neoLoad(force) {
    if (MET.neoLoading) return;
    var days = +(q119("#neoDays") || {}).value || 7,
      key = (q119("#neoApiKey") || {}).value || "";
    key = String(key).trim();
    if (key) {
      try {
        localStorage.setItem("tianji.nasa.key", key);
      } catch (_) {}
    } else {
      try {
        key = localStorage.getItem("tianji.nasa.key") || "";
      } catch (_) {}
    }
    if (!key) key = "DEMO_KEY";
    var cache = neoCacheRead();
    if (!force && cache && Date.now() - cache.ts < 10 * 60e3 && cache.days === days) {
      neoRender(
        cache.data,
        "缓存仍在10分钟有效期内 · 上次实时同步 " +
          new Date(cache.ts).toLocaleString() +
          " · " +
          cache.data.length +
          " 条",
        "good",
      );
      return;
    }
    MET.neoLoading = true;
    var st = q119("#neoStatus"),
      body = q119("#neoBody");
    if (st) {
      st.className = "neo-status warn";
      st.textContent = "正在同步 NASA NeoWs 实时数据…";
    }
    if (body) body.innerHTML = '<tr><td colspan="5">联网加载中…</td></tr>';
    try {
      var start0 = new Date(),
        all = [];
      start0 = new Date(
        Date.UTC(start0.getUTCFullYear(), start0.getUTCMonth(), start0.getUTCDate()),
      );
      for (var off = 0; off < days; off += 7) {
        var a = new Date(start0.getTime() + off * 864e5),
          b = new Date(start0.getTime() + Math.min(days - 1, off + 6) * 864e5),
          url =
            "https://api.nasa.gov/neo/rest/v1/feed?start_date=" +
            neoYmd(a) +
            "&end_date=" +
            neoYmd(b) +
            "&api_key=" +
            encodeURIComponent(key),
          ctl = new AbortController(),
          tm = setTimeout(function () {
            try {
              ctl.abort();
            } catch (_) {}
          }, 12000),
          res = await fetch(url, { signal: ctl.signal });
        clearTimeout(tm);
        if (!res.ok) throw new Error("NASA HTTP " + res.status);
        var j = await res.json(),
          daysObj = j.near_earth_objects || {};
        Object.keys(daysObj).forEach(function (day) {
          (daysObj[day] || []).forEach(function (o) {
            var ca =
              (o.close_approach_data || []).find(function (x) {
                return !x.orbiting_body || x.orbiting_body === "Earth";
              }) || (o.close_approach_data || [])[0];
            if (!ca) return;
            var ms = +ca.epoch_date_close_approach,
              date = isFinite(ms)
                ? new Date(ms)
                : new Date((ca.close_approach_date_full || ca.close_approach_date || "") + " UTC"),
              miss = ca.miss_distance || {},
              vel = ca.relative_velocity || {},
              au = +miss.astronomical,
              ld = +miss.lunar;
            if (!isFinite(au) && isFinite(ld)) au = (ld * LD_KM119) / AU_KM119;
            if (!isFinite(ld) && isFinite(au)) ld = (au * AU_KM119) / LD_KM119;
            all.push({
              id: String(o.neo_reference_id || o.id || ""),
              name: String(o.name || o.designation || "").replace(/^\(|\)$/g, ""),
              cd: fmtUTC(date.toISOString()).replace(" UTC", ""),
              date: date,
              au: au,
              ld: ld,
              v: +vel.kilometers_per_second || 0,
              diam: neoFmtDiam(o),
              h: null,
              pha: !!o.is_potentially_hazardous_asteroid,
              source: "NASA NeoWs",
            });
          });
        });
      }
      var seen = {};
      all = all
        .filter(function (n) {
          var k = n.id + "|" + n.date.getTime();
          if (seen[k]) return false;
          seen[k] = 1;
          return isFinite(n.date.getTime()) && isFinite(n.ld);
        })
        .sort(function (a, b) {
          return a.date - b.date;
        });
      var serial = all.map(function (n) {
        var x = Object.assign({}, n);
        x.date = n.date.toISOString();
        return x;
      });
      neoCacheSave(days, serial);
      all.forEach(function (n) {
        if (!(n.date instanceof Date)) n.date = new Date(n.date);
      });
      neoRender(
        all,
        "实时同步完成 · NASA NeoWs · 未来 " +
          days +
          " 天 · " +
          all.length +
          " 条 · 更新 " +
          new Date().toLocaleTimeString(),
        "good",
      );
    } catch (e) {
      if (cache && cache.data && cache.data.length) {
        var data = cache.data.map(function (n) {
          n = Object.assign({}, n);
          n.date = new Date(n.date);
          return n;
        });
        neoRender(
          data,
          "实时联网失败（" +
            String(e.message || e) +
            "），已显示最近成功缓存：" +
            new Date(cache.ts).toLocaleString(),
          "warn",
        );
      } else {
        neoRender(
          [],
          "实时联网失败：" +
            String(e.message || e) +
            "。可检查网络/API限额，或填写自己的 NASA API Key 后重试。",
          "bad",
        );
      }
    } finally {
      MET.neoLoading = false;
    }
  }
  function metBind() {
    var root = q119("#meteorPanel");
    if (!root) return;
    var cv = q119("#met3dCv", root);
    if (!cv) return;
    if (root.dataset.bound === "1" && MET.cv === cv) {
      metFit();
      metRender();
      return;
    }
    root.dataset.bound = "1";
    MET.cv = cv;
    qa119("[data-met-tab]", root).forEach(function (b) {
      b.onclick = function () {
        metTab(b.dataset.metTab);
      };
    });
    var nl = q119("#neoLoad", root);
    if (nl)
      nl.onclick = function () {
        neoLoad(true);
      };
    var nd = q119("#neoDays", root);
    if (nd)
      nd.onchange = function () {
        MET.neo = [];
        MET.neoSel = null;
        var st = q119("#neoStatus");
        if (st) {
          st.className = "neo-status";
          st.textContent = "时间窗已改变，将自动重新同步。";
        }
        setTimeout(function () {
          neoLoad(true);
        }, 20);
      };
    var nk = q119("#neoApiKey", root);
    if (nk) {
      try {
        var sv = localStorage.getItem("tianji.nasa.key");
        if (sv) nk.value = sv;
      } catch (_) {}
      nk.onchange = function () {
        try {
          localStorage.setItem("tianji.nasa.key", nk.value.trim());
        } catch (_) {}
      };
    }
    var drag = null;
    cv.onpointerdown = function (e) {
      drag = { x: e.clientX, y: e.clientY, yaw: MET.yaw, pitch: MET.pitch };
      try {
        cv.setPointerCapture(e.pointerId);
      } catch (_) {}
    };
    cv.onpointermove = function (e) {
      if (!drag) return;
      MET.yaw = drag.yaw + (e.clientX - drag.x) * 0.006;
      MET.pitch = Math.max(-1.2, Math.min(1.2, drag.pitch + (e.clientY - drag.y) * 0.006));
      metDraw();
    };
    cv.onpointerup = cv.onpointercancel = function () {
      drag = null;
    };
    cv.onwheel = function (e) {
      e.preventDefault();
      MET.zoom = Math.max(0.55, Math.min(2.2, MET.zoom * Math.exp(-e.deltaY * 0.0015)));
      metDraw();
    };
    if (window.ResizeObserver) {
      if (MET.ro)
        try {
          MET.ro.disconnect();
        } catch (_) {}
      MET.ro = new ResizeObserver(metFit);
      MET.ro.observe(cv.parentElement);
    } else window.addEventListener("resize", metFit, { passive: true });
    metFit();
    metRender();
    if (!MET.loopStarted) {
      MET.loopStarted = true;
      metLoop(performance.now());
    }
  }
  function metLoop(ts) {
    MET.raf = requestAnimationFrame(metLoop);
    var p = q119("#meteorPanel");
    if (!p || document.hidden) {
      MET.last = ts;
      return;
    }
    var r = p.getBoundingClientRect();
    if (r.bottom < 0 || r.top > innerHeight) {
      MET.last = ts;
      return;
    }
    if (ts - (MET._ft || 0) < 42) return;
    MET._ft = ts;
    var dt = Math.min(0.12, (ts - (MET.last || ts)) / 1000);
    MET.last = ts;
    MET.phase += dt;
    metDraw();
  }

  /* ---------- 将日月食作为日地月旁边的第四模式；流星作为天象页独立模块 ---------- */
  function install119() {
    var root = q119("#as-orr3d");
    if (!root) return false;
    var fresh = !root.dataset.v119;
    root.dataset.v119 = "1";
    var bar = q119(".orr-modebar", root),
      semBtn = bar && q119('[data-orr-mode="sem"]', bar);
    if (bar && !q119('[data-orr-mode="eclipse"]', bar)) {
      var b = document.createElement("button");
      b.type = "button";
      b.dataset.orrMode = "eclipse";
      b.textContent = "日月食";
      if (semBtn && semBtn.nextSibling) bar.insertBefore(b, semBtn.nextSibling);
      else bar.appendChild(b);
    }
    var sem = q119("#orrModeSem", root);
    if (sem && !q119("#orrModeEclipse", root)) sem.insertAdjacentHTML("afterend", eclModeHTML());
    if (!q119("#meteorPanel")) root.insertAdjacentHTML("afterend", meteorHTML());
    try {
      eclBind();
    } catch (e) {
      console.error("[日月食初始化]", e);
    }
    try {
      metBind();
    } catch (e) {
      console.error("[流星雨初始化]", e);
    }
    qa119("#as-orr3d [data-orr-mode]").forEach(function (b) {
      if (!b.dataset.v119bind) {
        b.dataset.v119bind = "1";
        b.onclick = function () {
          orr3dSetMode(b.dataset.orrMode);
        };
      }
    });
    return true;
  }
  var OLD_MODE119 = window.orr3dSetMode;
  if (typeof OLD_MODE119 === "function")
    window.orr3dSetMode = function (mode) {
      if (mode !== "eclipse") return OLD_MODE119.apply(this, arguments);
      install119();
      ORR3D.mode = "eclipse";
      qa119("#as-orr3d [data-orr-mode]").forEach(function (b) {
        b.classList.toggle("on", b.dataset.orrMode === "eclipse");
      });
      ["orrMode3d", "orrModeHelio", "orrModeSem"].forEach(function (id) {
        var x = q119("#" + id);
        if (x) x.hidden = true;
      });
      var ep = q119("#orrModeEclipse");
      if (ep) ep.hidden = false;
      var tg = q119("#orr3dTog");
      if (tg) tg.dataset.mode = "eclipse";
      var f = q119("#as-orr3d .orr-focus-wrap");
      if (f) f.style.display = "none";
      var h = q119("#orrModeHint");
      if (h)
        h.textContent =
          "日月食 3D：拖动旋转 · 滚轮缩放 · 时间轴查看食前食后 · 下方可切日食/月食详情";
      var n = q119("#orrModeNote");
      if (n)
        n.textContent =
          "食的日期/最大食采用 NASA/GSFC 事件表；3D 使用本站日月低精度算法作几何示意。日食的精确食带、接触时刻与当地食分仍应以 NASA 等专业食表为准。";
      var rb = q119("#orr3dReset");
      if (rb) {
        rb.style.display = "none";
      }
      eclFit();
      eclDraw();
      eclSummary();
      eclDetail();
      eclSchedule();
      eclRemindPane();
      try {
        orr3dInfo();
      } catch (_) {}
    };
  /* 回到其它模式时恢复复位按钮 / 聚焦显示。 */
  if (typeof OLD_MODE119 === "function") {
    var WRAPPED_MODE119 = window.orr3dSetMode;
    window.orr3dSetMode = function (mode) {
      var r = WRAPPED_MODE119.apply(this, arguments);
      if (mode !== "eclipse") {
        var rb = q119("#orr3dReset");
        if (rb) rb.style.display = "";
        var f = q119("#as-orr3d .orr-focus-wrap");
        if (f) f.style.display = mode === "sem" ? "none" : "";
      }
      return r;
    };
  }
  /* bindOrr3d 可能在天象页第一次懒加载时才执行。 */
  var OLD_BIND119 = window.bindOrr3d;
  if (typeof OLD_BIND119 === "function")
    window.bindOrr3d = function () {
      var r = OLD_BIND119.apply(this, arguments);
      setTimeout(function () {
        install119();
        qa119("#as-orr3d [data-orr-mode]").forEach(function (b) {
          if (!b.dataset.v119bind) {
            b.dataset.v119bind = "1";
            b.onclick = function () {
              orr3dSetMode(b.dataset.orrMode);
            };
          }
        });
      }, 0);
      return r;
    };
  try {
    if (typeof REF_BIND !== "undefined") {
      var oldAst = REF_BIND.astro;
      REF_BIND.astro = function () {
        if (oldAst) oldAst();
        setTimeout(install119, 0);
      };
    }
  } catch (_) {}
  document.addEventListener(
    "click",
    function (e) {
      var t = e.target && e.target.closest ? e.target.closest('[data-tab="astro"]') : null;
      if (t) setTimeout(install119, 60);
    },
    false,
  );
  setTimeout(install119, 0);
  /* v120：任何天象/模式切换后的下一帧都做一次轻量 ensure，解决动态 DOM 被重建后“按钮看得到但点不了”。 */
  document.addEventListener(
    "click",
    function (e) {
      var x =
        e.target && e.target.closest
          ? e.target.closest(
              '[data-tab="astro"],[data-orr-mode],#eclPrev,#eclNext,#eclPlay,#eclMax,[data-ecl-tab],[data-met-tab]',
            )
          : null;
      if (x)
        setTimeout(function () {
          try {
            install119();
          } catch (_) {}
        }, 0);
    },
    true,
  );

  /* 版本更新 */
  try {
    var bv = q119("#buildVersion");

    qa119("footer").forEach(function (ft) {
      if (/版本\s*·/.test(ft.textContent || ""));
      else ft.insertAdjacentHTML("beforeend", "<br>版本 · " + BUILD);
    });
    window.TianjiSystemV120 = {
      version: "v120",
      build: BUILD,
      eclipse3DVisual: true,
      eclipseLifecycleFix: true,
      eclipseSchedule: true,
      eclipseReminder: true,
      meteorShowers: true,
      jplCloseApproach: true,
      jupiterGalilean: true,
      earthNearView: true,
    };
  } catch (_) {}
})();
