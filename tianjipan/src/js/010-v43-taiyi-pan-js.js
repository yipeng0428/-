/* ===== v43 盘库 · 太乙神数式盘 ===== */
const TYP = {
  year: null,
  play: null,
  sel: null,
  view: { x: -430, y: -430, w: 860, h: 860 },
  layers: { gods: 1, pal: 1, roles: 1, doors: 1, suan: 1, rays: 1 },
};
const TYP_LAYER = [
  ["gods", "十六神外盘", "地主、阳德、和德……大义"],
  ["pal", "九宫式盘", "乾离艮震中兑坤坎巽"],
  ["roles", "五将要位", "太乙、文昌、始击、计神、定目、主客定将"],
  ["doors", "八门", "开休生伤杜景死惊"],
  ["suan", "三算", "主算、客算、定算与大参将"],
  ["rays", "定位线", "主要神位至宫位的连线"],
];
const TYP_ANG = { 8: 0, 3: 45, 4: 90, 9: 135, 2: 180, 7: 225, 6: 270, 1: 315, 5: 0 };
const TYP_DIR = {
  8: "北",
  3: "东北",
  4: "东",
  9: "东南",
  2: "南",
  7: "西南",
  6: "西",
  1: "西北",
  5: "中",
};
function typNowYear() {
  try {
    return fsLichunYear();
  } catch (_) {
    return nowBJ().y;
  }
}
function typYear() {
  return TYP.year || typNowYear();
}
function typCalc() {
  try {
    return taiyiCalc(typYear());
  } catch (e) {
    console.error("typCalc", e);
    return null;
  }
}
function typPt(r, a) {
  const p = p5Pt(r, a);
  return [p[0], p[1]];
}
function typSector(r0, r1, a0, a1, cls, data, title) {
  return `<path d="${p5Arc(r0, r1, a0, a1)}" class="${cls}" ${data || ""}><title>${esc(title || "")}</title></path>`;
}
function typText(r, a, txt, fs, cls = "typ-t") {
  const p = typPt(r, a);
  return `<text x="${p[0].toFixed(1)}" y="${p[1].toFixed(1)}" text-anchor="middle" dominant-baseline="central" font-size="${fs}" class="${cls}">${esc(String(txt))}</text>`;
}
function typRolePal(T) {
  return {
    ty: T.tyPal,
    wc: TY_G2P[T.tianmu],
    sj: TY_G2P[T.sj],
    js: TY_G2P[T.jishenG],
    dm: TY_G2P[T.dm],
    zj: T.zj[0],
    kj: T.kj[0],
    dj: T.dj[0],
  };
}
function typRoleMeta(T) {
  return [
    ["ty", "太乙", T.tyPal, `${TY_PNAME[T.tyPal]} · ${T.li3}`],
    ["wc", "文昌", TY_G2P[T.tianmu], tyGodName(T.tianmu)],
    ["sj", "始击", TY_G2P[T.sj], tyGodName(T.sj)],
    ["js", "计神", TY_G2P[T.jishenG], tyGodName(T.jishenG)],
    ["dm", "定目", TY_G2P[T.dm], tyGodName(T.dm)],
    ["zj", "主将", T.zj[0], `大将 ${TY_PNAME[T.zj[0]]} · 参将 ${TY_PNAME[T.zj[1]]}`],
    ["kj", "客将", T.kj[0], `大将 ${TY_PNAME[T.kj[0]]} · 参将 ${TY_PNAME[T.kj[1]]}`],
    ["dj", "定将", T.dj[0], `大将 ${TY_PNAME[T.dj[0]]} · 参将 ${TY_PNAME[T.dj[1]]}`],
  ];
}
function typSvg(T) {
  if (!T) return "";
  let g =
    '<defs><filter id="typGlow"><feGaussianBlur stdDeviation="2.2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>';
  g += `<circle r="408" fill="none" stroke="var(--line2)"/><circle r="92" class="typ-center"/>`;
  if (TYP.layers.gods) {
    for (let i = 0; i < 16; i++) {
      const a0 = i * 22.5 - 11.25,
        a = i * 22.5,
        gd = TY_GODS[i],
        sel = TYP.sel && TYP.sel.type === "god" && TYP.sel.id === i + 1;
      g += typSector(
        344,
        405,
        a0,
        a0 + 22.5,
        `typ-godsec ${i % 2 ? "alt" : ""}${sel ? " on" : ""}`,
        `data-typ-god="${i + 1}"`,
        `第${i + 1}位 · ${gd[0]} · ${gd[1]} · 入${TY_PNAME[TY_G2P[i + 1]]}`,
      );
      g += typText(374, a, gd[1], 10, sel ? "typ-g" : "typ-t");
      g += typText(397, a, gd[0], 9, "typ-d");
    }
  }
  if (TYP.layers.pal) {
    const pals = [8, 3, 4, 9, 2, 7, 6, 1];
    pals.forEach((pal, i) => {
      const a = TYP_ANG[pal],
        sel = TYP.sel && TYP.sel.type === "pal" && TYP.sel.id === pal;
      g += typSector(
        178,
        338,
        a - 22.5,
        a + 22.5,
        `typ-sec ${i % 2 ? "alt" : ""}${sel ? " on" : ""}`,
        `data-typ-pal="${pal}"`,
        `${TY_PNAME[pal]} · ${TYP_DIR[pal]} · 点击查看`,
      );
      g += typText(316, a, TY_PNAME[pal].replace(/\d/g, ""), 14, "typ-palname");
      g += typText(294, a, TYP_DIR[pal], 9, "typ-d");
    });
    g += `<circle r="174" class="typ-sec${TYP.sel && TYP.sel.type === "pal" && TYP.sel.id === 5 ? " on" : ""}" data-typ-pal="5"><title>${TY_PNAME[5]}</title></circle>`;
    g += `<text x="0" y="148" text-anchor="middle" class="typ-palname">中五宫</text>`;
  }
  if (TYP.layers.doors) {
    Object.entries(T.doorMap).forEach(([d, pal]) => {
      const a = TYP_ANG[pal],
        p = typPt(258, a);
      g += `<g data-typ-pal="${pal}" class="typ-role"><circle cx="${p[0]}" cy="${p[1]}" r="17" fill="var(--panel2)" stroke="var(--line2)"/><text x="${p[0]}" y="${p[1]}" text-anchor="middle" dominant-baseline="central" class="typ-door">${d}门</text></g>`;
    });
  }
  const roles = typRoleMeta(T);
  if (TYP.layers.rays) {
    roles.slice(0, 5).forEach(([k, n, pal]) => {
      if (pal === 5) return;
      const p = typPt(174, TYP_ANG[pal]);
      g += `<line x1="0" y1="0" x2="${p[0]}" y2="${p[1]}" class="typ-ray"/>`;
    });
  }
  if (TYP.layers.roles) {
    const by = {};
    roles.forEach((x) => (by[x[2]] = by[x[2]] || []).push(x));
    Object.entries(by).forEach(([pk, arr]) => {
      const pal = +pk;
      if (pal === 5) {
        arr.forEach((x, i) => {
          const p = typPt(54, (i * 360) / arr.length);
          g += `<g class="typ-role ${x[0]}" data-typ-role="${x[0]}"><circle cx="${p[0]}" cy="${p[1]}" r="16"/><text x="${p[0]}" y="${p[1]}" text-anchor="middle" dominant-baseline="central">${x[1].slice(0, 2)}</text><title>${x[1]} · ${x[3]}</title></g>`;
        });
        return;
      }
      const a = TYP_ANG[pal],
        base = 211,
        spread = arr.length > 1 ? 20 : 0;
      arr.forEach((x, i) => {
        const rr = base + (i - (arr.length - 1) / 2) * spread,
          p = typPt(rr, a);
        g += `<g class="typ-role ${x[0]}" data-typ-role="${x[0]}"><circle cx="${p[0]}" cy="${p[1]}" r="15"/><text x="${p[0]}" y="${p[1]}" text-anchor="middle" dominant-baseline="central">${x[1].slice(0, 2)}</text><title>${x[1]} · ${x[3]}</title></g>`;
      });
    });
  }
  if (TYP.layers.suan) {
    const ss = [
      ["主", T.zs, T.zj],
      ["客", T.ks, T.kj],
      ["定", T.ds, T.dj],
    ];
    ss.forEach((x, i) => {
      const a = 135 + i * 45,
        p = typPt(120, a),
        nt = tySuanNote(x[1].v);
      g += `<g data-typ-suan="${x[0]}"><circle cx="${p[0]}" cy="${p[1]}" r="23" fill="var(--panel2)" stroke="var(--line2)"/><text x="${p[0]}" y="${p[1] - 5}" text-anchor="middle" class="typ-g" font-size="13">${x[0]}${x[1].v}</text><text x="${p[0]}" y="${p[1] + 10}" text-anchor="middle" class="typ-d" font-size="8">${nt.cs}${nt.he ? "·" + nt.he : ""}${nt.du ? "·塞" : ""}</text></g>`;
    });
  }
  g += `<text x="0" y="-25" text-anchor="middle" class="typ-center-main">太乙式盘</text><text x="0" y="-3" text-anchor="middle" class="typ-center-sub">${T.gz}年 · ${T.yang ? "阳遁" : "阴遁"} · ${TY_YUAN[T.M]}元第${T.L}局</text><text x="0" y="16" text-anchor="middle" class="typ-center-sub">太乙数 ${T.T} · ${T.li3}</text><g id="typSweep"><line x1="0" y1="-90" x2="0" y2="-338" class="typ-sweep"/><circle cx="0" cy="-338" r="3" class="typ-sweepdot"/></g>`;
  return g;
}
function typViewApply() {
  const svg = $("#typSvg");
  if (!svg) return;
  const v = TYP.view;
  svg.setAttribute("viewBox", `${v.x} ${v.y} ${v.w} ${v.h}`);
  const z = $("#typZoom");
  if (z) z.textContent = Math.round((860 / v.w) * 100) + "%";
}
function typFit() {
  TYP.view = { x: -430, y: -430, w: 860, h: 860 };
  typViewApply();
}
function typZoomAt(k, cx, cy) {
  const svg = $("#typSvg");
  if (!svg) return;
  const r = svg.getBoundingClientRect(),
    v = TYP.view,
    nw = Math.max(250, Math.min(1800, v.w * k)),
    nh = nw,
    px = v.x + ((cx - r.left) / r.width) * v.w,
    py = v.y + ((cy - r.top) / r.height) * v.h,
    rr = nw / v.w;
  v.x = px - (px - v.x) * rr;
  v.y = py - (py - v.y) * rr;
  v.w = nw;
  v.h = nh;
  typViewApply();
}
function typCmp(T) {
  const a = T.zs.v,
    b = T.ks.v;
  if (a > b) return `主算 ${a} 长于客算 ${b}，按本页既有规则显示“主强客弱”结构。`;
  if (a < b) return `客算 ${b} 长于主算 ${a}，按本页既有规则显示“客强主弱”结构。`;
  return `主客算同为 ${a}，结构上势均。`;
}
function typInfo(T) {
  const box = $("#typInfo");
  if (!box || !T) return;
  const zn = tySuanNote(T.zs.v),
    kn = tySuanNote(T.ks.v),
    dn = tySuanNote(T.ds.v);
  let sel = "";
  if (TYP.sel) {
    if (TYP.sel.type === "god") {
      const i = TYP.sel.id,
        gd = TY_GODS[i - 1];
      sel = `<div class="typ-rolelist"><div><span>十六神</span><b>${gd[0]} · ${gd[1]}</b></div><div><span>位置序</span><b>第 ${i} 位</b></div><div><span>所入九宫</span><b>${TY_PNAME[TY_G2P[i]]}</b></div></div>`;
    } else if (TYP.sel.type === "pal") {
      const p = TYP.sel.id,
        here = typRoleMeta(T)
          .filter((x) => x[2] === p)
          .map((x) => x[1]),
        doors = Object.entries(T.doorMap)
          .filter((x) => x[1] === p)
          .map((x) => x[0] + "门");
      sel = `<div class="typ-rolelist"><div><span>宫位</span><b>${TY_PNAME[p]} · ${TYP_DIR[p]}</b></div><div><span>神将</span><b>${here.join("、") || "—"}</b></div><div><span>八门</span><b>${doors.join("、") || "—"}</b></div></div>`;
    } else if (TYP.sel.type === "role") {
      const x = typRoleMeta(T).find((a) => a[0] === TYP.sel.id);
      if (x)
        sel = `<div class="typ-rolelist"><div><span>角色</span><b>${x[1]}</b></div><div><span>所在</span><b>${TY_PNAME[x[2]]}</b></div><div><span>来源</span><b>${x[3]}</b></div></div>`;
    }
  }
  box.innerHTML = `<h4>年家定局</h4><div class="typ-facts"><span>年份</span><b>${T.Y} · ${T.gz}年</b><span>积年数</span><b>${T.J}</b><span>太乙数</span><b>${T.T}</b><span>局</span><b>${TY_YUAN[T.M]}元 · 第${T.L}局</b><span>遁</span><b>${T.yang ? "阳遁" : "阴遁"} · ${T.li3}</b><span>太乙</span><b>${TY_PNAME[T.tyPal]}</b><span>文昌</span><b>${tyGodName(T.tianmu)} → ${TY_PNAME[TY_G2P[T.tianmu]]}</b><span>始击</span><b>${tyGodName(T.sj)} → ${TY_PNAME[TY_G2P[T.sj]]}</b><span>计神</span><b>${tyGodName(T.jishenG)}</b><span>定目</span><b>${tyGodName(T.dm)}</b></div>
  <div class="typ-suan"><div><small>主算</small><b>${T.zs.v}</b><span>${zn.cs}${zn.he ? " · " + zn.he : ""}${zn.du ? " · 杜塞" : ""}</span></div><div><small>客算</small><b>${T.ks.v}</b><span>${kn.cs}${kn.he ? " · " + kn.he : ""}${kn.du ? " · 杜塞" : ""}</span></div><div><small>定算</small><b>${T.ds.v}</b><span>${dn.cs}${dn.he ? " · " + dn.he : ""}${dn.du ? " · 杜塞" : ""}</span></div></div>
  <div class="typ-rolelist"><div><span>主将</span><b>${TY_PNAME[T.zj[0]]} · 参 ${TY_PNAME[T.zj[1]]}</b></div><div><span>客将</span><b>${TY_PNAME[T.kj[0]]} · 参 ${TY_PNAME[T.kj[1]]}</b></div><div><span>定将</span><b>${TY_PNAME[T.dj[0]]} · 参 ${TY_PNAME[T.dj[1]]}</b></div><div><span>三门</span><b>${["开", "休", "生"].map((d) => d + "→" + TY_PNAME[T.doorMap[d]]).join("　")}</b></div></div>
  <p class="note">${typCmp(T)}</p>${sel ? `<h4 style="margin-top:13px">当前选中</h4>${sel}` : ""}<div class="typ-legend"><i>金 · 太乙</i><i>青 · 文昌</i><i>朱 · 始击</i><i>绿 · 计神</i><i>土 · 定目</i></div>`;
}
function typSoundRun(ms = 650, d = 0.65) {
  try {
    if (!STU.sfx) return;
    const n = Math.max(6, Math.round(ms / 65)),
      gap = ms / n;
    let i = 0;
    const t = setInterval(() => {
      i++;
      stuSfxTick(0.25, false, 1, 0.35 + d * 0.45);
      if (i >= n) {
        clearInterval(t);
        setTimeout(() => stuSfxClunk(), 20);
      }
    }, gap);
  } catch (_) {}
}
function typRender(anim = false) {
  const T = typCalc(),
    svg = $("#typSvg");
  if (!T || !svg) return;
  svg.innerHTML = typSvg(T);
  typViewApply();
  typInfo(T);
  const y = $("#typYear");
  if (y && document.activeElement !== y) y.value = typYear();
  if (anim) {
    const sw = $("#typSweep");
    if (sw && sw.animate)
      sw.animate(
        [
          { transform: "rotate(-100deg)", opacity: 0.18 },
          { transform: "rotate(0deg)", opacity: 0.85 },
        ],
        { duration: 720, easing: "cubic-bezier(.18,.78,.18,1)" },
      );
    typSoundRun(720, 0.72);
  }
}
function typSetYear(y, anim = true) {
  y = Math.max(1900, Math.min(2100, Math.round(+y || typNowYear())));
  TYP.year = y;
  TYP.sel = null;
  typRender(anim);
}
function typPlayToggle() {
  const b = $("#typPlay");
  if (TYP.play) {
    clearInterval(TYP.play);
    TYP.play = null;
    if (b) {
      b.classList.remove("on");
      b.textContent = "▶ 六十年演示";
    }
    return;
  }
  if (b) {
    b.classList.add("on");
    b.textContent = "■ 停止演示";
  }
  TYP.play = setInterval(() => {
    let y = typYear() + 1;
    if (y > 2100) y = 1900;
    typSetYear(y, true);
  }, 1250);
}
function typStop() {
  if (TYP.play) {
    clearInterval(TYP.play);
    TYP.play = null;
  }
}
function typDemo() {
  const svg = $("#typSvg");
  if (!svg) return;
  const outer = Array.from(svg.querySelectorAll(".typ-godsec,.typ-t,.typ-d"));
  const sweep = $("#typSweep");
  if (sweep && sweep.animate)
    sweep.animate([{ transform: "rotate(0deg)" }, { transform: "rotate(360deg)" }], {
      duration: 1900,
      easing: "cubic-bezier(.2,.7,.2,1)",
    });
  typSoundRun(1900, 0.9);
}
function typOpen() {
  const pane = $("#pane-studio");
  if (!pane) return;
  if (STU.active) studioLeave();
  try {
    qtpStop();
    lrpStop();
  } catch (_) {}
  typStop();
  PANLIB.mode = "taiyipan";
  document.body.classList.add("studio-mode");
  delete pane.dataset.ui;
  pane.dataset.built = "1";
  TYP.year = TYP.year || typNowYear();
  pane.innerHTML = `<div class="typ-shell" id="typShell"><div class="typ-top"><button class="gbtn sm" id="typBack">← 盘库</button><div class="typ-title"><b>太乙神数 · 式盘</b><small>十六神外盘 · 九宫式盘 · 太乙文昌始击 · 三算五将</small></div><button class="gbtn sm" id="typDetail">打开太乙年家详盘</button><button class="gbtn sm" id="typDemo">⟳ 式盘演示</button><button class="gbtn sm" id="typFs">全屏</button></div>
  <div class="typ-grid"><aside class="panel typ-side"><h4>年家定局</h4><div class="typ-group"><label>观察年份<input type="number" id="typYear" min="1900" max="2100" value="${typYear()}"></label><div class="typ-btnrow"><button class="gbtn sm" id="typNow">今年</button><button class="gbtn sm" id="typPrev">← 上一年</button><button class="gbtn sm" id="typNext">下一年 →</button></div><button class="gbtn sm typ-play" id="typPlay" style="width:100%;margin-top:6px">▶ 六十年演示</button></div>
  <div class="typ-group"><h4>显示层</h4><div class="typ-layers">${TYP_LAYER.map(([k, n, d]) => `<label class="typ-layer"><input type="checkbox" data-typl="${k}"${TYP.layers[k] ? " checked" : ""}><span>${n}<small>${d}</small></span></label>`).join("")}</div></div>
  <div class="typ-group"><p class="note">本盘使用系统现有“年家太乙”算法。年份按立春换年；这里重点把十六神、九宫、太乙/文昌/始击、三算五将和八门的落位关系可视化。</p></div></aside>
  <section class="typ-main"><div class="typ-viewbar"><span class="hint">滚轮缩放 · 按住拖动查看 · 点击十六神/宫位/神将看详情</span><button class="gbtn sm" id="typFit">↙↗ 适应</button><span class="typ-z"><button class="gbtn sm" id="typZm">−</button><span id="typZoom">100%</span><button class="gbtn sm" id="typZp">＋</button></span></div><div class="typ-frame" id="typFrame"><svg id="typSvg" viewBox="-430 -430 860 860" role="img" aria-label="太乙神数式盘"></svg></div></section><aside class="panel typ-info" id="typInfo"></aside></div>
  <div class="panel typ-bottom"><b class="gold">结构说明：</b>外圈十六神是固定参照序列；内层九宫承载太乙、文昌（天目）、始击（客目）、计神、定目、主客定大将参将与八门。年份变化时，系统重新计算年家太乙局并更新落宫。这里把“式盘结构”与原有“太乙年家详情”分开：式盘负责看位置关系和流转，详情页负责看三算、五将与断语。</div></div>`;
  typBind();
  typRender(false);
}
function typBind() {
  const pane = $("#pane-studio"),
    svg = $("#typSvg"),
    frame = $("#typFrame");
  if (!pane || !svg) return;
  $("#typBack").onclick = () => {
    typStop();
    plHub();
  };
  $("#typNow").onclick = () => typSetYear(typNowYear());
  $("#typPrev").onclick = () => typSetYear(typYear() - 1);
  $("#typNext").onclick = () => typSetYear(typYear() + 1);
  $("#typPlay").onclick = typPlayToggle;
  $("#typDemo").onclick = typDemo;
  $("#typYear").onchange = (e) => typSetYear(e.target.value);
  $$("[data-typl]", pane).forEach(
    (c) =>
      (c.onchange = () => {
        TYP.layers[c.dataset.typl] = c.checked ? 1 : 0;
        typRender(false);
      }),
  );
  $("#typFit").onclick = typFit;
  $("#typZm").onclick = () => {
    const r = svg.getBoundingClientRect();
    typZoomAt(1.2, r.left + r.width / 2, r.top + r.height / 2);
  };
  $("#typZp").onclick = () => {
    const r = svg.getBoundingClientRect();
    typZoomAt(0.82, r.left + r.width / 2, r.top + r.height / 2);
  };
  svg.addEventListener(
    "wheel",
    (e) => {
      e.preventDefault();
      typZoomAt(e.deltaY < 0 ? 0.86 : 1.16, e.clientX, e.clientY);
    },
    { passive: false },
  );
  let drag = null;
  svg.addEventListener("pointerdown", (e) => {
    if (e.button > 0) return;
    drag = {
      id: e.pointerId,
      x: e.clientX,
      y: e.clientY,
      vx: TYP.view.x,
      vy: TYP.view.y,
      w: TYP.view.w,
      h: TYP.view.h,
      rw: Math.max(1, svg.getBoundingClientRect().width),
      rh: Math.max(1, svg.getBoundingClientRect().height),
    };
    try {
      svg.setPointerCapture(e.pointerId);
    } catch (_) {}
    frame.classList.add("grab");
  });
  svg.addEventListener("pointermove", (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const kx = drag.w / drag.rw,
      ky = drag.h / drag.rh;
    TYP.view.x = drag.vx - (e.clientX - drag.x) * kx;
    TYP.view.y = drag.vy - (e.clientY - drag.y) * ky;
    typViewApply();
  });
  const up = (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    drag = null;
    frame.classList.remove("grab");
  };
  svg.addEventListener("pointerup", up);
  svg.addEventListener("pointercancel", () => {
    drag = null;
    frame.classList.remove("grab");
  });
  svg.addEventListener("click", (e) => {
    const g = e.target.closest && e.target.closest("[data-typ-god],[data-typ-pal],[data-typ-role]");
    if (!g) return;
    if (g.dataset.typGod) TYP.sel = { type: "god", id: +g.dataset.typGod };
    else if (g.dataset.typPal) TYP.sel = { type: "pal", id: +g.dataset.typPal };
    else if (g.dataset.typRole) TYP.sel = { type: "role", id: g.dataset.typRole };
    typInfo(typCalc());
  });
  $("#typDetail").onclick = () => {
    try {
      tyYear = typYear();
      selectTab("taiyi", true);
      setTimeout(() => {
        const p = $("#pane-taiyi");
        if (p) {
          p.innerHTML = renderTaiyi(R);
          bindTaiyi();
        }
      }, 80);
    } catch (e) {
      console.error(e);
      toast("无法打开太乙详盘");
    }
  };
  $("#typFs").onclick = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await $("#typShell").requestFullscreen();
    } catch (e) {
      toast("当前浏览器不允许全屏");
    }
  };
  document.addEventListener("fullscreenchange", () => {
    const b = $("#typFs");
    if (b) b.textContent = document.fullscreenElement ? "退出全屏" : "全屏";
  });
}
const plClose_v42 = plClose;
plClose = function () {
  try {
    typStop();
  } catch (_) {}
  return plClose_v42();
};
