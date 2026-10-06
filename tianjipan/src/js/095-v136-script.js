(function () {
  "use strict";
  const V136 = "v136 · 2026-10-05 01:35 +08:00";
  function v136PlanetWorld(name) {
    try {
      if (typeof planetWorld119 === "function") return planetWorld119(name);
      const T = (ORR3D.jd - 2451545) / 36525,
        h = asHelio(name, T);
      return ORR3D.scaleModel === "real"
        ? { x: h.x * 1000, y: h.y * 1000, z: h.z * 1000 }
        : orr3dCompress(h);
    } catch (_) {
      return null;
    }
  }
  function v136PlanetData(name) {
    try {
      const T = (ORR3D.jd - 2451545) / 36525;
      const h = asHelio(name, T),
        r = Math.hypot(h.x, h.y, h.z),
        lon = norm360(Math.atan2(h.y, h.x) / D2R),
        lat = Math.atan2(h.z, Math.hypot(h.x, h.y)) / D2R;
      const m = ORR3D_PLANETS[name] || {};
      return {
        r,
        lon,
        lat,
        spd: typeof orr3dSpeedDeg === "function" ? orr3dSpeedDeg(name) : 0,
        period: m.period || 0,
      };
    } catch (_) {
      return null;
    }
  }
  function v136ApplyTracking() {
    if (!window.ORR3D || !ORR3D.trackLocked || !ORR3D.trackTarget || ORR3D.mode !== "3d") return;
    const w = v136PlanetWorld(ORR3D.trackTarget);
    if (!w) return;
    ORR3D.tx = w.x;
    ORR3D.ty = w.y;
    ORR3D.tz = w.z;
    const near = {
      水星: 230,
      金星: 220,
      地球: 190,
      火星: 210,
      木星: 250,
      土星: 300,
      天王星: 320,
      海王星: 340,
      冥王星: 320,
    };
    const d = near[ORR3D.trackTarget] || (ORR3D.scaleModel === "real" ? 280 : 240);
    ORR3D.dist = Math.min(ORR3D.dist || 720, d);
  }
  function v136DrawTrackOverlay() {
    if (
      !window.ORR3D ||
      !ORR3D.ctx ||
      !ORR3D.trackLocked ||
      !ORR3D.trackTarget ||
      ORR3D.mode !== "3d"
    )
      return;
    const w = v136PlanetWorld(ORR3D.trackTarget);
    if (!w) return;
    const p = orr3dProj(w.x, w.y, w.z);
    if (!p) return;
    const c = ORR3D.ctx,
      dat = v136PlanetData(ORR3D.trackTarget);
    if (!dat) return;
    const x = Math.max(12, Math.min((ORR3D.cw || 900) - 188, p.x + 18)),
      y = Math.max(18, Math.min((ORR3D.ch || 560) - 76, p.y - 48));
    c.save();
    c.fillStyle = "rgba(12,14,24,.78)";
    c.strokeStyle = "rgba(243,218,152,.46)";
    c.lineWidth = 1;
    const wbox = 176,
      hbox = 64,
      rad = 10;
    c.beginPath();
    c.moveTo(x + rad, y);
    c.lineTo(x + wbox - rad, y);
    c.quadraticCurveTo(x + wbox, y, x + wbox, y + rad);
    c.lineTo(x + wbox, y + hbox - rad);
    c.quadraticCurveTo(x + wbox, y + hbox, x + wbox - rad, y + hbox);
    c.lineTo(x + rad, y + hbox);
    c.quadraticCurveTo(x, y + hbox, x, y + hbox - rad);
    c.lineTo(x, y + rad);
    c.quadraticCurveTo(x, y, x + rad, y);
    c.closePath();
    c.fill();
    c.stroke();
    c.fillStyle = "#f3da98";
    c.font = "600 11px sans-serif";
    c.textAlign = "left";
    c.fillText("🔒 跟踪 " + ORR3D.trackTarget, x + 10, y + 16);
    c.fillStyle = "#e6edf6";
    c.font = "10px sans-serif";
    c.fillText("日心黄经 " + dat.lon.toFixed(2) + "°", x + 10, y + 32);
    c.fillText(
      "黄纬 " + dat.lat.toFixed(2) + "°   距日 " + dat.r.toFixed(3) + " AU",
      x + 10,
      y + 46,
    );
    c.fillText("角速度 " + dat.spd.toFixed(3) + "°/日", x + 10, y + 60);
    c.strokeStyle = "rgba(243,218,152,.55)";
    c.setLineDash([3, 3]);
    c.beginPath();
    c.moveTo(p.x, p.y);
    c.lineTo(x, y + hbox / 2);
    c.stroke();
    c.restore();
  }
  function v136RenderHud() {
    const shell =
      document.getElementById("orr3dStageWrap") ||
      document.querySelector("#as-orr3d .orr3d-stage") ||
      document.getElementById("as-orr3d");
    if (!shell) return;
    if (!document.getElementById("v136Floatbar")) {
      const bar = document.createElement("div");
      bar.id = "v136Floatbar";
      bar.className = "v136-floatbar";
      bar.innerHTML =
        '<button type="button" class="gbtn sm" id="v136PlayPause">⏯ 播放/暂停</button><button type="button" class="gbtn sm" id="v136ZoomIn">＋ 放大</button><button type="button" class="gbtn sm" id="v136ZoomOut">－ 缩小</button><button type="button" class="gbtn sm" id="v136TrackBtn">🔒 跟踪</button><button type="button" class="gbtn sm" id="v136TrackOff">解除</button>';
      shell.appendChild(bar);
      const tag = document.createElement("div");
      tag.id = "v136TrackTag";
      tag.className = "v136-track-tag";
      tag.hidden = true;
      shell.appendChild(tag);
      document.getElementById("v136PlayPause").onclick = function () {
        const p = document.getElementById("orr3dPlay");
        if (p) p.click();
      };
      document.getElementById("v136ZoomIn").onclick = function () {
        if (!window.ORR3D) return;
        if (ORR3D.mode === "3d") {
          camDolly(ORR3D, -140);
          orr3dDraw();
        } else {
          const h = document.getElementById("orrHelioSvg");
          if (h && typeof pzZoomAt === "function") {
            const r = h.getBoundingClientRect();
            pzZoomAt(h, 1.22, r.width / 2, r.height / 2);
          }
        }
      };
      document.getElementById("v136ZoomOut").onclick = function () {
        if (!window.ORR3D) return;
        if (ORR3D.mode === "3d") {
          camDolly(ORR3D, 160);
          orr3dDraw();
        } else {
          const h = document.getElementById("orrHelioSvg");
          if (h && typeof pzZoomAt === "function") {
            const r = h.getBoundingClientRect();
            pzZoomAt(h, 0.82, r.width / 2, r.height / 2);
          }
        }
      };
      document.getElementById("v136TrackBtn").onclick = function () {
        if (!window.ORR3D || !ORR3D.selected) return;
        ORR3D.trackTarget = ORR3D.selected;
        ORR3D.trackLocked = true;
        v136ApplyTracking();
        if (ORR3D.mode === "3d") orr3dDraw();
        else if (ORR3D.mode === "helio") orr3dHelioRender();
        orr3dInfo();
      };
      document.getElementById("v136TrackOff").onclick = function () {
        if (!window.ORR3D) return;
        ORR3D.trackLocked = false;
        ORR3D.trackTarget = "";
        const tag = document.getElementById("v136TrackTag");
        if (tag) tag.hidden = true;
        orr3dInfo();
      };
    }
    v136SyncTrackTag();
  }
  function v136SyncTrackTag() {
    const tag = document.getElementById("v136TrackTag");
    if (!tag || !window.ORR3D) return;
    if (ORR3D.trackLocked && ORR3D.trackTarget) {
      tag.hidden = false;
      tag.innerHTML =
        '<span class="v136-lock">🔒</span> 已锁定跟踪：<b>' +
        ORR3D.trackTarget +
        "</b> · 再次点击该星体可解除";
    } else if (ORR3D.selected) {
      tag.hidden = false;
      tag.textContent = "已选中：" + ORR3D.selected + " · 再点同一星体即可锁定跟踪";
    } else tag.hidden = true;
  }
  function v136Pick3DPlanet(evt) {
    const cv = document.getElementById("orr3dCv");
    if (!cv || !window.ORR3D) return null;
    const rect = cv.getBoundingClientRect(),
      x = evt.clientX - rect.left,
      y = evt.clientY - rect.top;
    let best = null,
      bd = 1e9;
    (ORR3D.hits || []).forEach((h) => {
      const d = Math.hypot(x - h.x, y - h.y);
      if (d < h.r && d < bd) {
        best = h;
        bd = d;
      }
    });
    return best;
  }
  function v136HandlePlanetPick(name) {
    if (!window.ORR3D || !name) return;
    const prev = ORR3D.selected,
      locked = ORR3D.trackLocked && ORR3D.trackTarget === name;
    if (prev === name && !locked) {
      ORR3D.trackTarget = name;
      ORR3D.trackLocked = true;
    } else if (locked) {
      ORR3D.trackLocked = false;
      ORR3D.trackTarget = "";
    }
    ORR3D.selected = name;
    const f = document.getElementById("orr3dFocus");
    if (f) f.value = name;
    v136ApplyTracking();
    if (ORR3D.mode === "3d") orr3dDraw();
    else if (ORR3D.mode === "helio") orr3dHelioRender();
    orr3dInfo();
    v136SyncTrackTag();
  }
  function v136BindPlanetClicks() {
    const cv = document.getElementById("orr3dCv");
    if (cv && !cv.dataset.v136planet) {
      cv.dataset.v136planet = "1";
      cv.addEventListener(
        "click",
        function (e) {
          const hit = v136Pick3DPlanet(e);
          if (hit) {
            v136HandlePlanetPick(hit.name);
          }
        },
        true,
      );
    }
    const hs = document.getElementById("orrHelioSvg");
    if (hs && !hs.dataset.v136planet) {
      hs.dataset.v136planet = "1";
      hs.addEventListener(
        "click",
        function (e) {
          const g = e.target.closest && e.target.closest("[data-planet]");
          if (!g) return;
          v136HandlePlanetPick(g.dataset.planet);
          e.stopPropagation();
        },
        true,
      );
    }
  }
  function v136PatchBirthClick() {
    const oldSet = window.v135SetInfo;
    if (typeof oldSet === "function" && !oldSet._v136) {
      window.v135SetInfo = function (info) {
        if (
          info &&
          info.type === "birth" &&
          typeof v127BirthCiv === "function" &&
          typeof v127SetJD === "function" &&
          typeof v127ToJD === "function"
        ) {
          const c = v127BirthCiv();
          if (c) {
            v127SetJD(
              v127ToJD(c),
              "birth",
              typeof v127BirthName === "function" ? v127BirthName() : "当前命主",
            );
          }
        }
        return oldSet.apply(this, arguments);
      };
      window.v135SetInfo._v136 = 1;
    }
  }
  function v136PatchHelioVisual() {
    const svg = document.getElementById("orrHelioSvg");
    if (!svg) return;
    svg.querySelectorAll(".oh-p text").forEach((t) => {
      t.setAttribute("fill", "#f3da98");
      t.style.fill = "#f3da98";
      t.style.stroke = "rgba(10,12,24,.78)";
      t.style.strokeWidth = "2px";
      t.style.paintOrder = "stroke";
    });
  }
  function v136PatchInfo() {
    if (typeof window.orr3dInfo === "function" && !window.orr3dInfo._v136) {
      const old = window.orr3dInfo;
      window.orr3dInfo = function () {
        const r = old.apply(this, arguments);
        try {
          const el = document.getElementById("orr3dInfo");
          if (el && window.ORR3D) {
            if (ORR3D.trackLocked && ORR3D.trackTarget) {
              const d = v136PlanetData(ORR3D.trackTarget);
              if (d)
                el.insertAdjacentHTML(
                  "beforeend",
                  "<span><b>跟踪模式</b> · 已锁定 <b>" +
                    ORR3D.trackTarget +
                    "</b> · 黄经 " +
                    d.lon.toFixed(2) +
                    "° · 距日 " +
                    d.r.toFixed(3) +
                    " AU · 角速度 " +
                    d.spd.toFixed(3) +
                    "°/日</span>",
                );
            } else if (ORR3D.selected) {
              el.insertAdjacentHTML(
                "beforeend",
                "<span><b>交互提示</b> · 单击为选中，再次点击同一星体可锁定跟踪。</span>",
              );
            }
          }
        } catch (_) {}
        v136SyncTrackTag();
        v136PatchHelioVisual();
        return r;
      };
      window.orr3dInfo._v136 = 1;
    }
  }
  function v136EnsureStageWrap() {
    const stage = document.querySelector("#as-orr3d .orr3d-stage");
    if (stage && !stage.id) stage.id = "orr3dStageWrap";
  }
  function v136PatchRealBirthMarker() {
    if (typeof window.v135BirthMarker === "function" && !window.v135BirthMarker._v136) {
      const old = window.v135BirthMarker;
      window.v135BirthMarker = function (hits) {
        const r = old.apply(this, arguments);
        try {
          if (Array.isArray(hits) && hits.length) {
            const last = hits[hits.length - 1];
            if (last && last.info && last.info.type === "birth") {
              last.info.html +=
                '<div class="dim" style="margin-top:6px">点击此标记会切换到命主出生时刻，并同步刷新太阳系 3D / 日心俯视 / 日地月 3D。</div>';
            }
          }
        } catch (_) {}
        return r;
      };
      window.v135BirthMarker._v136 = 1;
    }
  }
  function v136OnReady() {
    v136EnsureStageWrap();
    v136RenderHud();
    v136BindPlanetClicks();
    v136PatchBirthClick();
    v136PatchInfo();
    v136PatchRealBirthMarker();
    v136PatchHelioVisual();
    v136SyncTrackTag();
  }
  if (typeof window.orr3dDraw === "function" && !window.orr3dDraw._v136) {
    const oldDraw = window.orr3dDraw;
    window.orr3dDraw = function () {
      v136ApplyTracking();
      const r = oldDraw.apply(this, arguments);
      try {
        v136DrawTrackOverlay();
      } catch (_) {}
      v136OnReady();
      return r;
    };
    window.orr3dDraw._v136 = 1;
  }
  if (typeof window.orr3dHelioRender === "function" && !window.orr3dHelioRender._v136) {
    const oldHelio = window.orr3dHelioRender;
    window.orr3dHelioRender = function () {
      const r = oldHelio.apply(this, arguments);
      v136PatchHelioVisual();
      v136OnReady();
      return r;
    };
    window.orr3dHelioRender._v136 = 1;
  }
  if (typeof window.bindOrr3d === "function" && !window.bindOrr3d._v136) {
    const oldBind = window.bindOrr3d;
    window.bindOrr3d = function () {
      const r = oldBind.apply(this, arguments);
      setTimeout(v136OnReady, 0);
      return r;
    };
    window.bindOrr3d._v136 = 1;
  }
  window.addEventListener("load", function () {
    setTimeout(v136OnReady, 120);
    try {
      const bv = document.getElementById("buildVersion");
    } catch (_) {}
  });
})();
