(function () {
  "use strict";
  var BUILD = "v118 · 2026-10-04 13:45 +08:00";

  /* 1. 全天球第一次点击就显示：修正 #xkSky3d 的 display:block 覆盖 hidden 的问题，并在显隐完成后的下一帧重绘。 */
  function v118FixXkMode(m) {
    m = m === "3d" ? "3d" : "2d";
    try {
      XK3D.mode = m;
    } catch (_) {}
    document.querySelectorAll("[data-xk-mode]").forEach(function (q) {
      q.classList.toggle("on", q.dataset.xkMode === m);
    });
    var a = document.getElementById("xkSky"),
      d = document.getElementById("xkSky3d"),
      t = document.getElementById("xk3Tools"),
      c = document.getElementById("xk3Cap");
    if (a) a.hidden = m !== "2d";
    if (d) d.hidden = m !== "3d";
    if (t) t.hidden = m !== "3d";
    if (c) c.hidden = m !== "3d";
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        try {
          m === "3d" ? xkSky3dDraw() : xkSkyDraw();
        } catch (e) {
          if (window.console) console.warn("v118 xk mode", e);
        }
      });
    });
  }
  document.addEventListener(
    "click",
    function (e) {
      var b = e.target && e.target.closest ? e.target.closest("[data-xk-mode]") : null;
      if (b)
        setTimeout(function () {
          v118FixXkMode(b.dataset.xkMode);
        }, 0);
    },
    false,
  );

  /* 2. 太阳系鼠标旁只做“速览”，下面原有 v115 详细信息面板继续保留。 */
  var TIP = { name: "", x: 0, y: 0, timer: 0 };
  function v118TipEl() {
    var stage = document.querySelector("#orrMode3d .orr3d-stage");
    if (!stage) return null;
    var el = document.getElementById("v118PlanetTip");
    if (!el) {
      el = document.createElement("div");
      el.id = "v118PlanetTip";
      el.className = "v118-planet-tip";
      stage.appendChild(el);
    }
    return el;
  }
  function v118Dir(a) {
    try {
      return typeof sk68DirName === "function"
        ? sk68DirName(a)
        : ["北", "东北", "东", "东南", "南", "西南", "西", "西北"][
            Math.round((((a % 360) + 360) % 360) / 45) % 8
          ];
    } catch (_) {
      return "";
    }
  }
  function v118QuickHTML(name) {
    var jd = (window.ORR3D && ORR3D.jd) || 2451545,
      d = null;
    try {
      d = typeof v115BodySnapshot === "function" ? v115BodySnapshot(name, jd) : null;
    } catch (_) {}
    var trad = "";
    try {
      trad = typeof v114Trad === "function" ? v114Trad(name) : "";
    } catch (_) {}
    if (name === "地球")
      return (
        '<b>⊕ 地球 <span class="trad">· 地</span></b><br><span class="dim">模拟时刻 ' +
        (typeof orr3dFmt === "function" ? orr3dFmt(jd) : "") +
        "</span><br>太阳系第三颗行星 · 当前模型观测基准<br>天然卫星：月亮（太阴）"
      );
    if (!d || !d.p)
      return "<b>" + name + (trad ? ' <span class="trad">· ' + trad + "</span>" : "") + "</b>";
    var obs = "";
    try {
      var loc = nwLoc(),
        eps = smSun(jd).eps,
        eq = smEqFromEcl(d.lon, d.lat || 0, eps),
        hz = nwHorizon(eq.ra * 15, eq.dec * D2R, jd, +loc.lon, +loc.lat);
      obs =
        "<br>当地天空：" +
        v118Dir(hz.az) +
        " " +
        hz.az.toFixed(0) +
        "° · 高度 " +
        hz.alt.toFixed(0) +
        "°" +
        (hz.alt < 0 ? "（地平线下）" : "");
    } catch (_) {}
    var xi = d.xi && d.xi.name ? d.xi.name + "宿" : "—",
      ci = d.sign && d.sign[2] ? d.sign[2] : "—";
    return (
      "<b>" +
      name +
      (trad ? ' <span class="trad">· ' + trad + "</span>" : "") +
      '</b><br><span class="dim">模拟时刻 ' +
      (typeof orr3dFmt === "function" ? orr3dFmt(jd) : "") +
      "</span><br>地心黄经 " +
      Number(d.lon).toFixed(2) +
      "° · " +
      xi +
      " · 十二次 " +
      ci +
      "<br>距离 " +
      (d.dist || "—") +
      obs
    );
  }
  function v118ShowTip(name, e) {
    var el = v118TipEl(),
      stage = el && el.parentElement;
    if (!el || !stage) return;
    TIP.name = name;
    var r = stage.getBoundingClientRect(),
      x = e.clientX - r.left + 14,
      y = e.clientY - r.top + 14;
    el.innerHTML = v118QuickHTML(name);
    el.classList.add("on");
    requestAnimationFrame(function () {
      var w = el.offsetWidth || 220,
        h = el.offsetHeight || 90;
      el.style.left = Math.max(6, Math.min(r.width - w - 6, x)) + "px";
      el.style.top = Math.max(6, Math.min(r.height - h - 6, y)) + "px";
    });
    clearTimeout(TIP.timer);
    TIP.timer = setTimeout(v118HideTip, 6500);
  }
  function v118HideTip() {
    var el = document.getElementById("v118PlanetTip");
    if (el) el.classList.remove("on");
    TIP.name = "";
  }
  function v118NearestHit(cv, e, pad) {
    if (!window.ORR3D || !ORR3D.hits) return null;
    var r = cv.getBoundingClientRect(),
      x = e.clientX - r.left,
      y = e.clientY - r.top,
      best = null,
      bd = 1e9;
    ORR3D.hits.forEach(function (h) {
      var d = Math.hypot(x - h.x, y - h.y),
        rr = (h.r || 12) + (pad || 0);
      if (d <= rr && d < bd) {
        best = h;
        bd = d;
      }
    });
    return best;
  }
  function v118World(name) {
    try {
      var T = (ORR3D.jd - 2451545) / 36525,
        h = asHelio(name, T);
      if (ORR3D.scaleModel === "real") return { x: h.x * 1000, y: h.y * 1000, z: h.z * 1000 };
      return orr3dCompress(h);
    } catch (_) {
      return null;
    }
  }
  function v118BindSolar() {
    var cv = document.getElementById("orr3dCv");
    if (!cv || cv.dataset.v118) return;
    cv.dataset.v118 = "1";
    var down = null;
    cv.addEventListener(
      "pointerdown",
      function (e) {
        down = { x: e.clientX, y: e.clientY };
        v118HideTip();
      },
      true,
    );
    cv.addEventListener(
      "pointerup",
      function (e) {
        if (!down) return;
        var moved = Math.hypot(e.clientX - down.x, e.clientY - down.y) > 5;
        down = null;
        if (moved) return;
        setTimeout(function () {
          var h = v118NearestHit(cv, e, 4);
          if (h) {
            try {
              ORR3D.selected = h.name;
              var f = document.getElementById("orr3dFocus");
              if (f) f.value = h.name;
              orr3dInfo();
              if (typeof tianjiAstroSelect === "function")
                tianjiAstroSelect({ name: h.name, jd: ORR3D.jd, source: "orr3d", kind: "planet" });
            } catch (_) {}
            v118ShowTip(h.name, e);
          } else v118HideTip();
        }, 0);
      },
      false,
    );
    /* 向内滚轮时，若鼠标正指着行星，观察中心逐步向该天体靠近；无需额外“聚焦”按钮即可继续放大到附近。 */
    cv.addEventListener(
      "wheel",
      function (e) {
        if (e.deltaY >= 0) return;
        var h = v118NearestHit(cv, e, 18);
        if (!h) return;
        var w = v118World(h.name);
        if (!w) return;
        var a = ORR3D.scaleModel === "real" ? 0.32 : 0.22;
        ORR3D.tx += (w.x - ORR3D.tx) * a;
        ORR3D.ty += (w.y - ORR3D.ty) * a;
        ORR3D.tz += (w.z - ORR3D.tz) * a;
        ORR3D.selected = h.name;
        var f = document.getElementById("orr3dFocus");
        if (f) f.value = h.name;
      },
      { capture: true, passive: true },
    );
  }
  var OLD_BIND = window.bindOrr3d;
  if (typeof OLD_BIND === "function")
    window.bindOrr3d = function () {
      var r = OLD_BIND.apply(this, arguments);
      setTimeout(v118BindSolar, 0);
      return r;
    };
  try {
    v118BindSolar();
  } catch (_) {}

  /* 详细面板随模拟时间刷新时，若速览仍开着，也同步刷新内容，但位置不跳。 */
  var OLD_INFO = window.orr3dInfo;
  if (typeof OLD_INFO === "function")
    window.orr3dInfo = function () {
      var r = OLD_INFO.apply(this, arguments);
      var el = document.getElementById("v118PlanetTip");
      if (el && el.classList.contains("on") && TIP.name) el.innerHTML = v118QuickHTML(TIP.name);
      return r;
    };

  /* 提示文字同步。 */
  function v118Copy() {
    var h = document.getElementById("orrModeHint");
    if (h && ORR3D && ORR3D.mode === "3d")
      h.textContent =
        "拖动环绕 · 拖动时星座半透明保留 · 滚轮可深度推进至天体附近 · 长按左键 / Shift / 右键平移";
    var n = document.getElementById("orrModeNote");
    if (n && ORR3D && ORR3D.mode === "3d" && ORR3D.scaleModel !== "real")
      n.textContent =
        "精简模型现支持深度推进：鼠标对准行星向内滚动会逐步把观察中心吸附到该天体；拖动旋转时星座背景保持半透明，松手恢复完整显示。";
  }
  setTimeout(v118Copy, 0);
  document.addEventListener(
    "click",
    function (e) {
      if (
        e.target &&
        e.target.closest &&
        e.target.closest("#as-orr3d [data-orr-mode],[data-orr-scale]")
      )
        setTimeout(v118Copy, 30);
    },
    false,
  );

  try {
    var bv = document.getElementById("buildVersion");

    window.TianjiSystemV118 = {
      version: "v118",
      build: BUILD,
      fullSphereFirstClickFix: true,
      deepSolarZoom: true,
      motionConstellationFade: true,
      planetQuickTip: true,
    };
  } catch (_) {}
})();
