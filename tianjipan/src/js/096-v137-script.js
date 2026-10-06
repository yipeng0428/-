(function () {
  "use strict";
  const V137 = "v137 · 2026-10-05 01:52 +08:00";
  function v137WorldByLon(lonDeg, au) {
    const a = ((lonDeg || 0) * Math.PI) / 180,
      r = au || 1;
    const raw = { x: Math.cos(a) * r, y: Math.sin(a) * r, z: 0 };
    return window.ORR3D && ORR3D.scaleModel === "real"
      ? { x: raw.x * 1000, y: raw.y * 1000, z: 0 }
      : orr3dCompress(raw);
  }
  function v137DrawText(c, txt, x, y, fill, font, align) {
    c.save();
    c.font = font || "10.5px sans-serif";
    c.textAlign = align || "center";
    c.textBaseline = "middle";
    c.lineWidth = 3.2;
    c.strokeStyle = "rgba(7,10,16,.78)";
    c.strokeText(txt, x, y);
    c.fillStyle = fill || "#f3da98";
    c.fillText(txt, x, y);
    c.restore();
  }
  function v137OrbitTimeOverlay() {
    if (!window.ORR3D || ORR3D.mode !== "3d" || ORR3D.selected !== "地球" || !ORR3D.ctx) return;
    const c = ORR3D.ctx;
    const terms = window.TERMS || [],
      months = typeof gregMonthData === "function" ? gregMonthData(ORR3D.jd) : [];
    // orbit outline
    let pts = [];
    for (let a = 0; a <= 360; a += 4) {
      const w = v137WorldByLon(a, 1);
      pts.push(w);
    }
    try {
      orr3dPath(pts, "rgba(245,214,124,.32)", 1.15, [4, 4], 1);
    } catch (_) {
      return;
    }
    // month starts + labels
    months.forEach((m, idx) => {
      const w0 = v137WorldByLon(m.start, 1),
        w1 = v137WorldByLon(m.start, 1.03),
        p0 = orr3dProj(w0.x, w0.y, w0.z),
        p1 = orr3dProj(w1.x, w1.y, w1.z);
      c.save();
      c.strokeStyle = "rgba(248,234,196,.72)";
      c.lineWidth = 1.0;
      c.beginPath();
      c.moveTo(p0.x, p0.y);
      c.lineTo(p1.x, p1.y);
      c.stroke();
      c.restore();
      const wl = v137WorldByLon(m.center, 1.08),
        pl = orr3dProj(wl.x, wl.y, wl.z);
      v137DrawText(c, m.name, pl.x, pl.y, "#f6f2e8", "10.5px sans-serif");
    });
    // solar terms on earth orbit, highlight major 8 + show all smaller
    terms.forEach((t, i) => {
      const lon = (t[1] + 180) % 360;
      const w0 = v137WorldByLon(lon, 1),
        w1 = v137WorldByLon(lon, i % 3 === 0 ? 1.07 : 1.05),
        p0 = orr3dProj(w0.x, w0.y, w0.z),
        p1 = orr3dProj(w1.x, w1.y, w1.z);
      c.save();
      c.strokeStyle = i % 3 === 0 ? "rgba(116,226,212,.88)" : "rgba(124,178,238,.52)";
      c.lineWidth = i % 3 === 0 ? 1.2 : 0.85;
      c.beginPath();
      c.moveTo(p0.x, p0.y);
      c.lineTo(p1.x, p1.y);
      c.stroke();
      c.restore();
      if (i % 3 === 0 || ORR3D.trackLocked) {
        const wl = v137WorldByLon(lon, i % 3 === 0 ? 1.12 : 1.09),
          pl = orr3dProj(wl.x, wl.y, wl.z);
        v137DrawText(
          c,
          t[0],
          pl.x,
          pl.y,
          i % 3 === 0 ? "#78e0d4" : "#b8d1f2",
          i % 3 === 0 ? "10.2px sans-serif" : "9px sans-serif",
        );
      }
    });
    // current earth label on orbit time point
    try {
      const elon = earthLonAt(ORR3D.jd);
      const wp = v137WorldByLon(elon, 1.015),
        pp = orr3dProj(wp.x, wp.y, wp.z);
      c.save();
      c.fillStyle = "rgba(255,214,109,.95)";
      c.beginPath();
      c.arc(pp.x, pp.y, 4.5, 0, Math.PI * 2);
      c.fill();
      c.restore();
      const term = typeof solarTermAtLon === "function" ? solarTermAtLon((elon + 180) % 360) : null;
      const infoTxt =
        (term && term[0] ? term[0] + " · " : "") +
        (months.find((m) => Math.abs(((m.center - elon + 540) % 360) - 180) < 15)?.name || "");
      if (infoTxt.trim()) v137DrawText(c, infoTxt, pp.x, pp.y - 14, "#ffdf9a", "10.5px sans-serif");
    } catch (_) {}
  }
  function v137PatchTooltip() {
    if (typeof window.v118QuickHTML === "function" && !window.v118QuickHTML._v137) {
      const old = window.v118QuickHTML;
      window.v118QuickHTML = function () {
        return old.apply(this, arguments);
      };
      window.v118QuickHTML._v137 = 1;
    }
  }
  function v137PatchHelioWhite() {
    const svg = document.getElementById("orrHelioSvg");
    if (!svg) return;
    svg.querySelectorAll(".oh-p text,[data-planet] text").forEach((t) => {
      t.setAttribute("fill", "#ffffff");
      t.style.fill = "#ffffff";
      t.style.stroke = "rgba(8,10,20,.82)";
      t.style.strokeWidth = "2.2px";
      t.style.paintOrder = "stroke";
    });
    svg.querySelectorAll(".oh-ztext").forEach((t) => {
      t.style.fill = "rgba(245,247,251,.86)";
      t.style.stroke = "rgba(8,10,20,.70)";
      t.style.strokeWidth = "1.6px";
      t.style.paintOrder = "stroke";
    });
  }
  function v137After() {
    try {
      v137PatchHelioWhite();
    } catch (_) {}
  }
  if (typeof window.orr3dDraw === "function" && !window.orr3dDraw._v137) {
    const old = window.orr3dDraw;
    window.orr3dDraw = function () {
      const r = old.apply(this, arguments);
      try {
        v137OrbitTimeOverlay();
      } catch (_) {}
      v137After();
      return r;
    };
    window.orr3dDraw._v137 = 1;
  }
  if (typeof window.orr3dHelioRender === "function" && !window.orr3dHelioRender._v137) {
    const old = window.orr3dHelioRender;
    window.orr3dHelioRender = function () {
      const r = old.apply(this, arguments);
      v137After();
      return r;
    };
    window.orr3dHelioRender._v137 = 1;
  }
  if (typeof window.orr3dInfo === "function" && !window.orr3dInfo._v137) {
    const old = window.orr3dInfo;
    window.orr3dInfo = function () {
      const r = old.apply(this, arguments);
      v137After();
      return r;
    };
    window.orr3dInfo._v137 = 1;
  }
  window.addEventListener("load", function () {
    setTimeout(function () {
      try {
        v137After();
        const bv = document.getElementById("buildVersion");
      } catch (_) {}
    }, 150);
  });
})();
