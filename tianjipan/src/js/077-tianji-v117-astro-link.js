(function () {
  "use strict";
  var BUILD = "v117 · 2026-10-04 13:44 +08:00";
  var SG117 = [
    "降娄",
    "大梁",
    "实沈",
    "鹑首",
    "鹑火",
    "鹑尾",
    "寿星",
    "大火",
    "析木",
    "星纪",
    "玄枵",
    "娵訾",
  ];
  var LINK = (window.TianjiAstroLink = {
    name: "",
    trad: "",
    lon: null,
    lat: null,
    xiu: "",
    xiuIndex: -1,
    ci: "",
    ciIndex: -1,
    jd: null,
    source: "",
    kind: "",
    stamp: 0,
  });
  function n360(x) {
    return ((+x % 360) + 360) % 360;
  }
  function finite(v) {
    return v !== null && v !== "" && Number.isFinite(Number(v));
  }
  function linkYear(jd) {
    try {
      return fromJD(jd + 8 / 24).y;
    } catch (_) {
      return new Date().getFullYear();
    }
  }
  function buildLink(o) {
    o = o || {};
    var jd = finite(o.jd)
        ? +o.jd
        : typeof ORR3D !== "undefined" && finite(ORR3D.jd)
          ? ORR3D.jd
          : typeof sk68JD === "function"
            ? sk68JD()
            : 2451545,
      lon = finite(o.lon) ? n360(o.lon) : null,
      lat = finite(o.lat) ? +o.lat : null,
      name = o.name || "",
      trad = "";
    if (name && typeof v114Trad === "function") trad = v114Trad(name) || "";
    if (lon == null && name && typeof v115BodySnapshot === "function") {
      try {
        var d = v115BodySnapshot(name, jd);
        if (d && finite(d.lon)) {
          lon = n360(d.lon);
          lat = finite(d.lat) ? d.lat : lat;
          trad = (d.meta && d.meta.trad) || trad;
        }
      } catch (_) {}
    }
    var xi = null,
      yi = -1,
      ci = -1,
      cin = "";
    if (lon != null) {
      try {
        var tb = xiuTable(linkYear(jd));
        xi = xiuOf(lon, linkYear(jd));
        yi =
          xi && finite(xi.i)
            ? xi.i
            : tb.findIndex(function (x) {
                return x.n === xi.n;
              });
      } catch (_) {}
      ci = Math.floor(lon / 30) % 12;
      try {
        cin = AS_SIGN[ci][2];
      } catch (_) {
        cin = SG117[ci] || "";
      }
    }
    if (o.xiu) {
      xi = xi || {};
      xi.n = String(o.xiu).replace(/宿$/, "");
      if (finite(o.xiuIndex)) yi = +o.xiuIndex;
    }
    if (o.ci) {
      cin = o.ci;
      if (finite(o.ciIndex)) ci = +o.ciIndex;
    }
    return {
      name: name,
      trad: trad,
      lon: lon,
      lat: lat,
      xiu: xi && xi.n ? xi.n : "",
      xiuIndex: yi,
      ci: cin || "",
      ciIndex: ci,
      jd: jd,
      source: o.source || "",
      kind: o.kind || "",
      stamp: Date.now(),
    };
  }
  function badge() {
    if (!LINK.stamp) return "";
    var n = LINK.name || "天区",
      t = LINK.trad && LINK.trad !== n ? " · " + LINK.trad : "",
      lon = finite(LINK.lon) ? LINK.lon.toFixed(2) + "°" : "—";
    return (
      '<div class="tj117-linkbar"><b>跨盘联动</b> · <span class="trad">' +
      n +
      t +
      "</span> · 黄经 <b>" +
      lon +
      "</b> · <b>" +
      (LINK.xiu ? LINK.xiu + "宿" : "—") +
      "</b> · 十二次 <b>" +
      (LINK.ci || "—") +
      "</b><br><span>选中状态会在实景星空、太阳系、传统历象盘与二十八宿全天图之间同步。</span></div>"
    );
  }
  function markTexts(root, sel, cls) {
    if (!root || !sel) return;
    root.querySelectorAll(cls).forEach(function (e) {
      e.classList.toggle(
        "v117-link",
        (e.textContent || "").trim() === sel || (e.textContent || "").indexOf(sel) >= 0,
      );
    });
  }
  function applyTrad() {
    var svg = document.getElementById("tradAstroSvg");
    if (svg) {
      markTexts(svg, LINK.xiu, ".ta-xiu");
      markTexts(svg, LINK.ci, ".ta-ci");
      svg.querySelectorAll(".ta-planet").forEach(function (c) {
        var t = c.querySelector("title"),
          n = t ? (t.textContent || "").split(/\s+/)[0] : "";
        c.classList.toggle("v117-link", !!LINK.name && n === LINK.name);
      });
    }
    var info = document.getElementById("tradAstroInfo");
    if (info) {
      var old = info.querySelector(".tj117-linkbar");
      if (old) old.remove();
      if (LINK.stamp) info.insertAdjacentHTML("afterbegin", badge());
    }
  }
  function applyStudio() {
    if (typeof STU === "undefined" || !STU.active) return;
    var pane = document.getElementById("pane-studio");
    if (!pane) return;
    markTexts(pane, LINK.xiu, ".stu-t");
    markTexts(pane, LINK.ci, ".stu-t");
    if (LINK.xiu) {
      pane.querySelectorAll(".stu-t").forEach(function (t) {
        if ((t.textContent || "").trim() === LINK.xiu) {
          var p = t.previousElementSibling;
          if (p && p.classList.contains("stu-sec")) p.classList.add("v117-link");
        }
      });
    }
  }
  function applyXap() {
    if (typeof XAP === "undefined" || !document.getElementById("xapSvg")) return;
    try {
      if (
        LINK.name &&
        ["太阳", "月亮", "水星", "金星", "火星", "木星", "土星"].indexOf(LINK.name) >= 0
      )
        XAP.sel = { t: "planet", n: LINK.name };
      else if (LINK.xiuIndex >= 0) XAP.sel = { t: "xiu", i: LINK.xiuIndex };
      if (typeof xapRender === "function") xapRender(false);
    } catch (_) {}
  }
  function applySky(source) {
    if (source === "sky68" || typeof SKY68 === "undefined" || !document.getElementById("sky68Cv"))
      return;
    if (
      LINK.name &&
      ["太阳", "月亮", "水星", "金星", "火星", "木星", "土星"].indexOf(LINK.name) >= 0
    ) {
      SKY68.sel = { type: "planet", name: LINK.name };
      try {
        sk68Draw();
        sk68Info();
      } catch (_) {}
    }
  }
  function applyOrr(source) {
    if (source === "orr3d" || typeof ORR3D === "undefined" || !document.getElementById("orr3dCv"))
      return;
    if (LINK.name && ORR3D_PLANETS && ORR3D_PLANETS[LINK.name]) {
      ORR3D.selected = LINK.name;
      var f = document.getElementById("orr3dFocus");
      if (f) f.value = LINK.name;
      try {
        orr3dDraw();
        orr3dInfo();
      } catch (_) {}
    }
  }
  function applyAll(source) {
    applyTrad();
    applyStudio();
    applyXap();
    applySky(source);
    applyOrr(source);
    var s = document.getElementById("sky68Info");
    if (s && LINK.stamp && !s.querySelector(".tj117-linkbar"))
      s.insertAdjacentHTML("afterbegin", badge());
  }
  function setLink(o) {
    var n = buildLink(o),
      key = [n.name, n.lon != null ? n.lon.toFixed(4) : "", n.xiu, n.ci, n.kind].join("|"),
      old = [
        LINK.name,
        LINK.lon != null ? LINK.lon.toFixed(4) : "",
        LINK.xiu,
        LINK.ci,
        LINK.kind,
      ].join("|");
    Object.assign(LINK, n);
    if (key !== old || o.force) applyAll(n.source);
    else applyTrad();
    return LINK;
  }
  window.tianjiAstroSelect = setLink;

  function fromSky() {
    if (typeof SKY68 === "undefined" || !SKY68.sel) return;
    var s = SKY68.sel,
      D = SKY68.cache,
      jd = D && D.F ? D.F.jd : typeof sk68JD === "function" ? sk68JD() : 2451545;
    if (s.type === "planet") {
      var p =
        D &&
        D.pl &&
        D.pl.find(function (x) {
          return x.n === s.name;
        });
      setLink({
        name: s.name,
        lon: p && p.raw ? p.raw.lon : null,
        lat: p && p.raw ? p.raw.lat : null,
        jd: jd,
        source: "sky68",
        kind: "planet",
      });
      return;
    }
    if (s.type === "star") {
      try {
        var st = V114_SKY_STARS[s.index],
          F = D.F,
          q = sk68Prec(st[0], st[1], F.T),
          a = q[0],
          d = q[1],
          eps = (23.4393 - 0.013 * F.T) * SK68_D,
          x = Math.cos(d) * Math.cos(a),
          y = Math.cos(d) * Math.sin(a),
          z = Math.sin(d),
          ye = y * Math.cos(eps) + z * Math.sin(eps),
          ze = -y * Math.sin(eps) + z * Math.cos(eps),
          lon = n360(Math.atan2(ye, x) / SK68_D),
          lat = Math.asin(Math.max(-1, Math.min(1, ze))) / SK68_D;
        setLink({
          name: V114_SKY_STARNAME[s.index] || "恒星 #" + (s.index + 1),
          lon: lon,
          lat: lat,
          jd: jd,
          source: "sky68",
          kind: "star",
        });
      } catch (_) {}
      return;
    }
    if (s.type === "cn" && /宿$/.test(s.name)) {
      try {
        var name = s.name.replace(/宿$/, ""),
          tb = xiuTable(linkYear(jd)),
          i = tb.findIndex(function (x) {
            return x.n === name;
          });
        if (i >= 0)
          setLink({
            name: s.name,
            lon: n360(tb[i].s + tb[i].w / 2),
            xiu: name,
            xiuIndex: i,
            jd: jd,
            source: "sky68",
            kind: "xiu",
          });
      } catch (_) {}
    }
  }
  /* 6.8 星空：目标元素自己的 pointerup 已先完成命中，再在 document 层读取结果。 */
  document.addEventListener(
    "pointerup",
    function (e) {
      if (e.target && e.target.id === "sky68Cv") setTimeout(fromSky, 0);
      if (e.target && e.target.id === "orr3dCv")
        setTimeout(function () {
          try {
            setLink({ name: ORR3D.selected, jd: ORR3D.jd, source: "orr3d", kind: "planet" });
          } catch (_) {}
        }, 0);
    },
    false,
  );
  document.addEventListener(
    "change",
    function (e) {
      if (e.target && e.target.id === "orr3dFocus")
        setTimeout(function () {
          try {
            setLink({ name: ORR3D.selected, jd: ORR3D.jd, source: "orr3d", kind: "planet" });
          } catch (_) {}
        }, 0);
    },
    false,
  );
  document.addEventListener(
    "click",
    function (e) {
      var pl = e.target.closest && e.target.closest("[data-xap-planet]"),
        xu = e.target.closest && e.target.closest("[data-xap-xiu]"),
        ci = e.target.closest && e.target.closest("[data-xap-ci]"),
        tx = e.target.closest && e.target.closest("[data-v117-xiu],[data-v117-ci],.ta-planet");
      if (pl) {
        setTimeout(function () {
          setLink({
            name: pl.dataset.xapPlanet,
            jd: typeof R !== "undefined" && R && R.t ? R.t.jdUT : null,
            source: "xap",
            kind: "planet",
          });
        }, 0);
        return;
      }
      if (xu) {
        try {
          var i = +xu.dataset.xapXiu,
            tb = xiuTable(R.t.civ.y),
            x = tb[i];
          setLink({
            name: x.n + "宿",
            lon: n360(x.s + x.w / 2),
            xiu: x.n,
            xiuIndex: i,
            jd: R.t.jdUT,
            source: "xap",
            kind: "xiu",
          });
        } catch (_) {}
        return;
      }
      if (ci) {
        var ii = +ci.dataset.xapCi;
        setLink({
          name: AS_SIGN[ii][2],
          lon: ii * 30 + 15,
          ci: AS_SIGN[ii][2],
          ciIndex: ii,
          jd: R.t.jdUT,
          source: "xap",
          kind: "ci",
        });
        return;
      }
      if (tx) {
        if (tx.classList.contains("ta-planet")) {
          var ti = tx.querySelector("title"),
            pn = ti ? (ti.textContent || "").split(/\s+/)[0] : "";
          if (pn) setLink({ name: pn, jd: ORR3D.jd, source: "trad", kind: "planet" });
        } else if (tx.dataset.v117Xiu) {
          var yi = +tx.dataset.v117Xiu,
            tt = xiuTable(linkYear(ORR3D.jd))[yi];
          setLink({
            name: tt.n + "宿",
            lon: n360(tt.s + tt.w / 2),
            xiu: tt.n,
            xiuIndex: yi,
            jd: ORR3D.jd,
            source: "trad",
            kind: "xiu",
          });
        } else if (tx.dataset.v117Ci) {
          var jj = +tx.dataset.v117Ci;
          setLink({
            name: AS_SIGN[jj][2],
            lon: jj * 30 + 15,
            ci: AS_SIGN[jj][2],
            ciIndex: jj,
            jd: ORR3D.jd,
            source: "trad",
            kind: "ci",
          });
        }
      }
    },
    false,
  );

  /* 传统历象盘每次随时间重绘后重新挂载可点击索引和联动高亮。 */
  if (typeof window.tradAstroRender === "function") {
    var OLD_TRAD = window.tradAstroRender;
    window.tradAstroRender = function () {
      var r = OLD_TRAD.apply(this, arguments),
        svg = document.getElementById("tradAstroSvg");
      if (svg) {
        var ys = svg.querySelectorAll(".ta-xiu");
        ys.forEach(function (t, i) {
          t.dataset.v117Xiu = i;
          t.style.cursor = "pointer";
        });
        var cs = svg.querySelectorAll(".ta-ci");
        cs.forEach(function (t, i) {
          t.dataset.v117Ci = i;
          t.style.cursor = "pointer";
        });
        svg.querySelectorAll(".ta-planet").forEach(function (t) {
          t.style.cursor = "pointer";
        });
      }
      applyTrad();
      return r;
    };
  }
  /* 6.8 信息重绘后保留联动摘要。 */
  if (typeof window.sk68Info === "function") {
    var OLD_SKINFO = window.sk68Info;
    window.sk68Info = function () {
      var r = OLD_SKINFO.apply(this, arguments),
        box = document.getElementById("sky68Info");
      if (box && LINK.stamp && !box.querySelector(".tj117-linkbar"))
        box.insertAdjacentHTML("afterbegin", badge());
      return r;
    };
  }
  /* 天机总盘“二十八宿·七政”层在渲染时直接标出联动宿 / 十二次。 */
  try {
    if (typeof STU_REND !== "undefined" && STU_REND.xiu) {
      var OLD_STUX = STU_REND.xiu;
      STU_REND.xiu = function (g, r0, r1, C) {
        var r = OLD_STUX.apply(this, arguments);
        if (LINK.stamp) {
          markTexts(g, LINK.xiu, ".stu-t");
          markTexts(g, LINK.ci, ".stu-t");
          if (LINK.xiu)
            g.querySelectorAll(".stu-t").forEach(function (t) {
              if ((t.textContent || "").trim() === LINK.xiu) {
                var p = t.previousElementSibling;
                if (p && p.classList.contains("stu-sec")) p.classList.add("v117-link");
              }
            });
        }
        return r;
      };
    }
  } catch (_) {}

  try {
    var bv = document.getElementById("buildVersion");

    window.TianjiSystemV117 = {
      version: "v117",
      build: BUILD,
      crossAstroLink: true,
      performanceBase: "v116",
    };
  } catch (_) {}
})();
