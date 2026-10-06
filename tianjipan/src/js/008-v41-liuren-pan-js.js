/* ===== v41 盘库 · 大六壬天地盘 ===== */
const LRP = {
  mode: "calc",
  civ: null,
  hb: null,
  zj: null,
  view: { x: -410, y: -410, w: 820, h: 820 },
  gesture: "turn",
  sel: null,
  play: null,
  lastRot: 0,
  layers: { earth: 1, sky: 1, gen: 1, dun: 1, rel: 1, mark: 1, ke: 1, chu: 1 },
};
const LRP_LAYER = [
  ["earth", "地盘十二支", "固定不动的地盘"],
  ["sky", "天盘十二神", "月将加时后旋转"],
  ["gen", "十二天将", "贵人、螣蛇、朱雀等"],
  ["dun", "遁干", "本旬十干遁于天盘"],
  ["rel", "六亲", "以日干为我"],
  ["mark", "空亡 · 驿马 · 日时", "关键标记"],
  ["ke", "四课标记", "一二三四课上神"],
  ["chu", "三传标记", "初传 · 中传 · 末传"],
];
function lrpNorm(a) {
  return ((+a % 360) + 360) % 360;
}
function lrpCivNow() {
  const n = nowBJ();
  return { y: n.y, m: n.m, d: n.d, h: n.h, mi: n.mi, s: 0 };
}
function lrpDt(c) {
  return `${c.y}-${f2(c.m)}-${f2(c.d)}T${f2(c.h)}:${f2(c.mi)}`;
}
function lrpParse(v) {
  const m = String(v || "").match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  return m ? { y: +m[1], m: +m[2], d: +m[3], h: +m[4], mi: +m[5], s: 0 } : null;
}
function lrpR() {
  if (!LRP.civ) LRP.civ = lrpCivNow();
  let r;
  try {
    r = compute(LRP.civ);
  } catch (e) {
    console.error("lrp compute", e);
    return null;
  }
  if (LRP.mode === "manual") {
    const hb = LRP.hb == null ? r.bz.pill[3].b : LRP.hb,
      zj = LRP.zj == null ? liurenYueJiang(r.t.lon) : LRP.zj;
    try {
      r.lr = liuren(r.bz.dayIdx, hb, zj);
    } catch (e) {
      console.error("lrp manual", e);
    }
  }
  return r;
}
function lrpRot(lr) {
  return lrpNorm((lr.hb - lr.zj) * 30);
}
function lrpArc(r0, r1, a0, a1, cls, attrs = "") {
  return `<path d="${p5Arc(r0, r1, a0, a1)}" class="${cls}" ${attrs}/>`;
}
function lrpText(r, a, t, fs, cls = "") {
  const p = p5Pt(r, a);
  return `<text x="${p[0].toFixed(2)}" y="${p[1].toFixed(2)}" text-anchor="middle" dominant-baseline="central" font-size="${fs}" class="lrp-txt ${cls}">${esc(String(t))}</text>`;
}
function lrpRing(r) {
  return `<circle r="${r}" class="lrp-ring"/>`;
}
function lrpMarker(r, a, txt, cls = "") {
  const p = p5Pt(r, a);
  return `<g><circle cx="${p[0].toFixed(2)}" cy="${p[1].toFixed(2)}" r="9" class="lrp-mark ${cls}"/><text x="${p[0].toFixed(2)}" y="${p[1].toFixed(2)}" text-anchor="middle" dominant-baseline="central" class="lrp-mark-t">${esc(txt)}</text></g>`;
}
function lrpSvg(R) {
  const lr = R.lr,
    rot = lrpRot(lr),
    chu = lr.chu.map((x) => x.z);
  let g = '<g class="lrp-base">';
  g += lrpRing(382) + lrpRing(312) + lrpRing(207) + lrpRing(178);
  if (LRP.layers.earth) {
    for (let p = 0; p < 12; p++) {
      const a0 = 180 + p * 30,
        am = a0 + 15,
        cl = [
          "lrp-earth",
          p % 2 ? "alt" : "",
          p === lr.hb ? "hot" : "",
          lr.kong.includes(p) ? "kong" : "",
        ]
          .filter(Boolean)
          .join(" ");
      g += lrpArc(312, 380, a0, a0 + 30, cl, `data-lrp-earth="${p}"`);
      g += lrpText(349, am, ZHI[p], 18, p === lr.hb ? "gold" : "");
      if (LRP.layers.mark) {
        if (lr.kong.includes(p)) g += lrpText(373, am, "空", 8, "bad");
        if (p === lr.yiMa) g += lrpText(321, am, "马", 8, "gold");
        if (p === lr.dz) g += lrpMarker(332, am, "支", "cyan");
      }
    }
  }
  g += "</g>";
  g += `<g id="lrpHeaven" class="lrp-heaven" style="transform:rotate(${rot}deg)">`;
  for (let z = 0; z < 12; z++) {
    const a0 = 180 + z * 30,
      am = a0 + 15,
      gen = lr.gen[z],
      good = TJ_TONE[gen] === "吉",
      ci = chu.indexOf(z),
      cls = ["lrp-sky", good ? "good" : "bad", ci >= 0 ? "chu" : ""].join(" ");
    if (LRP.layers.sky || LRP.layers.gen || LRP.layers.dun || LRP.layers.rel)
      g += lrpArc(210, 309, a0, a0 + 30, cls, `data-lrp-sky="${z}"`);
    if (LRP.layers.sky) g += lrpText(286, am, ZHI[z], 17, ci >= 0 ? "red" : "");
    if (LRP.layers.gen) g += lrpText(257, am, gen, 10, good ? "good" : "bad");
    if (LRP.layers.dun && lr.dun[z]) g += lrpText(232, am, "遁" + lr.dun[z], 8, "dim");
    if (LRP.layers.rel) g += lrpText(216, am, lr.relOf(z), 7, "dim");
    if (LRP.layers.chu && ci >= 0) g += lrpMarker(198, am, ["初", "中", "末"][ci], "");
  }
  if (LRP.layers.ke) {
    lr.ke.forEach((k, i) => {
      const a = 180 + k.u * 30 + 15;
      g += lrpMarker(187, a, String(i + 1), i < 2 ? "gold" : "cyan");
    });
  }
  g += "</g>";
  g += `<circle r="171" class="lrp-core"/><circle r="151" class="lrp-core2"/><text x="0" y="-28" text-anchor="middle" class="lrp-core-title">${esc(lr.ge)}</text><text x="0" y="-4" text-anchor="middle" class="lrp-core-sub">${esc(ZHI[lr.zj] + "将 · " + lr.jiangName + "　加　" + ZHI[lr.hb] + "时")}</text><text x="0" y="16" text-anchor="middle" class="lrp-core-sub">${esc(GAN[lr.dg] + ZHI[lr.dz] + "日 · " + (lr.day ? "昼贵" : "夜贵") + " · " + (lr.shun ? "顺布" : "逆布"))}</text><text x="0" y="42" text-anchor="middle" class="lrp-txt gold" font-size="12">${esc(lr.chu.map((x, i) => ["初", "中", "末"][i] + ZHI[x.z]).join("　"))}</text>`;
  return g;
}
function lrpInfo(R) {
  const box = $("#lrpInfo");
  if (!box || !R) return;
  const lr = R.lr,
    keN = ["一课", "二课", "三课", "四课"];
  let sel = "";
  if (LRP.sel != null) {
    const z = LRP.sel,
      e = lr.earthOf[z],
      gen = lr.gen[z],
      ci = lr.chu.findIndex((x) => x.z === z);
    sel = `<div class="lrp-sel"><b>天盘 ${ZHI[z]} · ${gen}</b><br>落地盘 ${ZHI[e]}；${lr.dun[z] ? "遁干 " + lr.dun[z] + "；" : ""}六亲 ${lr.relOf(z)}。${ci >= 0 ? `此神为${["初传", "中传", "末传"][ci]}。` : ""}${lr.kong.includes(z) ? "天盘本支逢本旬空亡。" : ""}</div>`;
  }
  box.innerHTML = `<div class="lrp-info-inner"><div><h4>当前课局</h4><div class="lrp-facts"><span>观测时刻</span><b>${lrpDt(LRP.civ).replace("T", " ")}</b><span>日柱</span><b>${GAN[lr.dg]}${ZHI[lr.dz]}</b><span>月将</span><b>${ZHI[lr.zj]} · ${lr.jiangName}</b><span>占时</span><b>${ZHI[lr.hb]}时 · ${lr.day ? "昼占" : "夜占"}</b><span>贵人</span><b>${ZHI[lr.gui]} · ${lr.shun ? "顺布" : "逆布"}</b><span>课体</span><b class="gold">${lr.ge}${lr.fuyin ? " · 伏吟" : ""}${lr.fanyin ? " · 返吟" : ""}</b><span>空亡</span><b>${lr.kong.map((z) => ZHI[z]).join("、")}</b><span>驿马</span><b>${ZHI[lr.yiMa]}</b></div><div class="lrp-formula"><b>月将加时：</b>${ZHI[lr.zj]}将（${lr.jiangName}）加临${ZHI[lr.hb]}时，天盘相对地盘转动 <b>${lrpRot(lr)}°</b>。地盘不动，天盘十二神与十二天将整体移位。</div>${sel}</div>
  <div><h4>四课</h4><div class="lrp-kecards">${lr.ke.map((k, i) => `<div class="lrp-kc"><small>${keN[i]}</small><b>${ZHI[k.u]}</b><em>${k.lIsGan ? GAN[lr.dg] + "寄" + ZHI[LR_JIGONG[lr.dg]] : ZHI[k.l]}之上 · ${k.rel === "贼" ? "下贼上" : k.rel === "克" ? "上克下" : "无克"} · ${k.gen}</em></div>`).join("")}</div></div>
  <div class="lrp-wide"><h4 style="margin-top:11px">三传</h4><div class="lrp-chuan">${lr.chu.map((c, i) => `<div class="lrp-cc"><small>${["初传", "中传", "末传"][i]}</small><b>${ZHI[c.z]}</b><span class="${TJ_TONE[c.gen]}">${c.gen}</span><small>${c.rel}${c.dun ? " · 遁" + c.dun : ""}${c.kong ? " · 空亡" : ""}</small></div>`).join("")}</div><p class="note">取传依据：${esc(lr.sub)}。天地盘与四课采用本系统现有大六壬引擎；伏吟、返吟、八专、别责、涉害等特殊课体存在流派细节差异，仍以「大六壬」详情页的口径说明为准。</p></div></div>`;
}
function lrpViewApply() {
  const svg = $("#lrpSvg");
  if (svg) svg.setAttribute("viewBox", `${LRP.view.x} ${LRP.view.y} ${LRP.view.w} ${LRP.view.h}`);
  const z = $("#lrpZoom");
  if (z) z.textContent = Math.round((820 / LRP.view.w) * 100) + "%";
}
function lrpFit() {
  LRP.view = { x: -410, y: -410, w: 820, h: 820 };
  lrpViewApply();
}
function lrpZoomAt(f, cx, cy) {
  const svg = $("#lrpSvg"),
    v = LRP.view;
  if (!svg) return;
  const r = svg.getBoundingClientRect(),
    px = v.x + ((cx - r.left) / r.width) * v.w,
    py = v.y + ((cy - r.top) / r.height) * v.h,
    nw = Math.max(180, Math.min(1500, v.w * f)),
    rn = nw / v.w;
  v.x = px - (px - v.x) * rn;
  v.y = py - (py - v.y) * rn;
  v.w = nw;
  v.h = nw;
  lrpViewApply();
}
function lrpSoundRun(ms = 700, dense = 0.55) {
  try {
    if (!STU.sfx) return;
    const n = Math.max(5, Math.min(18, Math.round((ms / 55) * dense))),
      gap = ms / n;
    let i = 0;
    const t = setInterval(() => {
      i++;
      stuSfxTick(0.28, false, 1, 0.35 + dense * 0.5);
      if (i >= n) {
        clearInterval(t);
        setTimeout(() => stuSfxClunk(), 35);
      }
    }, gap);
  } catch (_) {}
}
function lrpRender(anim = false, full = false, fromRot = null) {
  const R = lrpR(),
    svg = $("#lrpSvg");
  if (!R || !svg) return;
  const to = lrpRot(R.lr),
    old = fromRot == null ? LRP.lastRot : fromRot;
  svg.innerHTML = lrpSvg(R);
  lrpViewApply();
  lrpInfo(R);
  const g = $("#lrpHeaven");
  if (anim && g && g.animate) {
    let d = ((to - old + 540) % 360) - 180;
    if (full) d += d >= 0 ? 360 : -360;
    const fr = to - d;
    g.animate([{ transform: `rotate(${fr}deg)` }, { transform: `rotate(${to}deg)` }], {
      duration: full ? 1450 : 720,
      easing: "cubic-bezier(.18,.78,.18,1)",
    });
    lrpSoundRun(full ? 1450 : 720, full ? 0.8 : 0.55);
  }
  LRP.lastRot = to;
  const dt = $("#lrpDt");
  if (dt && document.activeElement !== dt) dt.value = lrpDt(LRP.civ);
  const zj = $("#lrpZj"),
    hb = $("#lrpHb");
  if (zj) zj.value = R.lr.zj;
  if (hb) hb.value = R.lr.hb;
}
function lrpSetMode(m) {
  LRP.mode = m;
  const calc = $("#lrpCalc"),
    man = $("#lrpManual"),
    box = $("#lrpManualBox");
  if (calc) calc.classList.toggle("on", m === "calc");
  if (man) man.classList.toggle("on", m === "manual");
  if (box) box.hidden = m !== "manual";
  if (m === "manual") {
    const R = lrpR();
    if (R) {
      LRP.hb = R.lr.hb;
      LRP.zj = R.lr.zj;
    }
  }
  lrpRender(false);
}
function lrpSetNow() {
  LRP.civ = lrpCivNow();
  LRP.mode = "calc";
  LRP.hb = LRP.zj = null;
  lrpSetMode("calc");
  lrpFit();
  lrpRender(true, true);
}
function lrpStep(n) {
  const R = lrpR();
  if (!R) return;
  const old = lrpRot(R.lr);
  if (LRP.mode === "manual") {
    LRP.hb = (((R.lr.hb + n) % 12) + 12) % 12;
  } else {
    const c = LRP.civ,
      jd = jdFromGreg(c.y, c.m, c.d, c.h, c.mi, c.s || 0) + (n * 2) / 24,
      f = fromJD(jd);
    LRP.civ = { y: f.y, m: f.m, d: f.d, h: f.h, mi: f.mi, s: 0 };
  }
  lrpRender(true, false, old);
}
function lrpPlayToggle() {
  const b = $("#lrpPlay");
  if (LRP.play) {
    clearInterval(LRP.play);
    LRP.play = null;
    if (b) {
      b.classList.remove("on");
      b.textContent = "▶ 十二时辰演示";
    }
    return;
  }
  if (b) {
    b.classList.add("on");
    b.textContent = "■ 停止演示";
  }
  LRP.play = setInterval(() => lrpStep(1), 1500);
}
function lrpStop() {
  if (LRP.play) {
    clearInterval(LRP.play);
    LRP.play = null;
  }
}
function lrpOpen() {
  const pane = $("#pane-studio");
  if (!pane) return;
  if (STU.active) studioLeave();
  PANLIB.mode = "liuren";
  document.body.classList.add("studio-mode");
  delete pane.dataset.ui;
  pane.dataset.built = "1";
  LRP.civ = LRP.civ || lrpCivNow();
  const init = lrpR();
  if (init) LRP.lastRot = lrpRot(init.lr);
  pane.innerHTML = `<div class="lrp-shell" id="lrpShell"><div class="lrp-top"><button class="gbtn sm" id="lrpBack">← 盘库</button><div class="lrp-title"><b>大六壬 · 天地盘</b><small>月将加时 · 地盘固定 · 天盘旋转 · 四课三传</small></div><button class="gbtn sm" id="lrpDetail">用此时刻打开大六壬详盘</button><button class="gbtn sm" id="lrpSpin">⟳ 转盘演示</button><button class="gbtn sm" id="lrpFs">全屏</button></div>
  <div class="lrp-grid"><aside class="panel lrp-side"><h4>起课方式</h4><div class="lrp-mode"><button class="gbtn sm" id="lrpCalc">历算</button><button class="gbtn sm" id="lrpManual">手动合盘</button></div><div class="lrp-group"><label>观测时刻（北京时间）<input type="datetime-local" id="lrpDt" value="${lrpDt(LRP.civ)}"></label><div class="lrp-btnrow"><button class="gbtn sm" id="lrpNow">此刻</button><button class="gbtn sm" id="lrpPrev">← 上一时辰</button><button class="gbtn sm" id="lrpNext">下一时辰 →</button></div><button class="gbtn sm lrp-play" id="lrpPlay" style="width:100%;margin-top:6px">▶ 十二时辰演示</button></div>
  <div class="lrp-group lrp-manual" id="lrpManualBox" hidden><label>手动月将<select id="lrpZj">${ZHI.map((z, i) => `<option value="${i}">${z} · ${JIANG_OF_ZHI[i]}</option>`).join("")}</select></label><label>手动占时<select id="lrpHb">${ZHI.map((z, i) => `<option value="${i}">${z}时</option>`).join("")}</select></label><p class="dim sm">手动模式下可直接拖动天盘；松手后自动吸附到 30° 刻度，并反算占时。</p></div>
  <div class="lrp-group"><h4>显示层</h4><div class="lrp-layers">${LRP_LAYER.map(([k, n, d]) => `<label class="lrp-layer"><input type="checkbox" data-lrpl="${k}"${LRP.layers[k] ? " checked" : ""}><span>${n}<small>${d}</small></span></label>`).join("")}</div></div></aside>
  <section class="lrp-main"><div class="lrp-viewbar"><button class="gbtn sm" id="lrpTurn">转天盘</button><button class="gbtn sm" id="lrpPan">查看平移</button><span class="hint">滚轮缩放 · 手动模式拖天盘 · 查看模式拖动画面</span><button class="gbtn sm" id="lrpFit">↙↗ 适应</button><span class="lrp-z"><button class="gbtn sm" id="lrpZm">−</button><span id="lrpZoom">100%</span><button class="gbtn sm" id="lrpZp">＋</button></span></div><div class="lrp-frame turn" id="lrpFrame"><svg id="lrpSvg" viewBox="-410 -410 820 820" role="img" aria-label="大六壬天地盘"></svg></div></section>
  <aside class="panel lrp-info" id="lrpInfo"></aside></div><div class="panel lrp-bottom"><b class="gold">结构说明：</b>这个页面专门表现大六壬最核心的“天地盘转动关系”。地盘十二支固定，月将加临占时以后，天盘十二神整体转位；十二天将依贵人顺逆布在天盘神上，四课与三传再从这一结构中起出。它与巨盘共享同一套六壬计算数据，但交互与视觉完全独立。</div></div>`;
  lrpBind();
  lrpSetMode(LRP.mode);
  lrpRender(false);
}
function lrpBind() {
  const pane = $("#pane-studio"),
    svg = $("#lrpSvg"),
    frame = $("#lrpFrame");
  if (!pane || !svg) return;
  $("#lrpBack").onclick = () => {
    lrpStop();
    plHub();
  };
  $("#lrpCalc").onclick = () => lrpSetMode("calc");
  $("#lrpManual").onclick = () => lrpSetMode("manual");
  $("#lrpNow").onclick = lrpSetNow;
  $("#lrpPrev").onclick = () => lrpStep(-1);
  $("#lrpNext").onclick = () => lrpStep(1);
  $("#lrpPlay").onclick = lrpPlayToggle;
  $("#lrpSpin").onclick = () => {
    const R = lrpR();
    if (R) lrpRender(true, true, lrpRot(R.lr));
  };
  $("#lrpDt").onchange = (e) => {
    const c = lrpParse(e.target.value);
    if (c) {
      const old = lrpR();
      LRP.civ = c;
      if (LRP.mode === "calc") LRP.hb = LRP.zj = null;
      lrpRender(true, false, old ? lrpRot(old.lr) : null);
    }
  };
  $("#lrpZj").onchange = (e) => {
    const old = lrpR();
    LRP.zj = +e.target.value;
    lrpRender(true, false, old ? lrpRot(old.lr) : null);
  };
  $("#lrpHb").onchange = (e) => {
    const old = lrpR();
    LRP.hb = +e.target.value;
    lrpRender(true, false, old ? lrpRot(old.lr) : null);
  };
  $$("[data-lrpl]", pane).forEach(
    (c) =>
      (c.onchange = () => {
        LRP.layers[c.dataset.lrpl] = c.checked ? 1 : 0;
        lrpRender(false);
      }),
  );
  const setG = (m) => {
    LRP.gesture = m;
    frame.classList.toggle("turn", m === "turn");
    frame.classList.toggle("pan", m === "pan");
    $("#lrpTurn").classList.toggle("on", m === "turn");
    $("#lrpPan").classList.toggle("on", m === "pan");
  };
  $("#lrpTurn").onclick = () => setG("turn");
  $("#lrpPan").onclick = () => setG("pan");
  setG(LRP.gesture);
  $("#lrpFit").onclick = lrpFit;
  $("#lrpZm").onclick = () => {
    const r = svg.getBoundingClientRect();
    lrpZoomAt(1.2, r.left + r.width / 2, r.top + r.height / 2);
  };
  $("#lrpZp").onclick = () => {
    const r = svg.getBoundingClientRect();
    lrpZoomAt(0.82, r.left + r.width / 2, r.top + r.height / 2);
  };
  svg.addEventListener(
    "wheel",
    (e) => {
      e.preventDefault();
      lrpZoomAt(e.deltaY < 0 ? 0.86 : 1.16, e.clientX, e.clientY);
    },
    { passive: false },
  );
  const pos = (e) => {
    const r = svg.getBoundingClientRect(),
      v = LRP.view,
      x = v.x + ((e.clientX - r.left) / r.width) * v.w,
      y = v.y + ((e.clientY - r.top) / r.height) * v.h;
    return { x, y, a: lrpNorm((Math.atan2(x, -y) * 180) / Math.PI) };
  };
  let drag = null,
    lastTick = 0;
  svg.addEventListener("pointerdown", (e) => {
    if (e.button > 0) return;
    if (LRP.gesture === "turn") {
      if (LRP.mode !== "manual") {
        toast("先切换到“手动合盘”再直接拖天盘");
        return;
      }
      const R = lrpR(),
        p = pos(e);
      drag = { id: e.pointerId, m: "t", a0: p.a, rot0: lrpRot(R.lr), rot: lrpRot(R.lr) };
      lastTick = drag.rot;
      try {
        svg.setPointerCapture(e.pointerId);
      } catch (_) {}
      frame.classList.add("grab");
    } else {
      drag = {
        id: e.pointerId,
        m: "p",
        x: e.clientX,
        y: e.clientY,
        vx: LRP.view.x,
        vy: LRP.view.y,
        w: LRP.view.w,
        h: LRP.view.h,
        rw: Math.max(1, svg.getBoundingClientRect().width),
        rh: Math.max(1, svg.getBoundingClientRect().height),
      };
      try {
        svg.setPointerCapture(e.pointerId);
      } catch (_) {}
      frame.classList.add("grab");
    }
  });
  svg.addEventListener("pointermove", (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    if (drag.m === "t") {
      const p = pos(e),
        da = ((p.a - drag.a0 + 540) % 360) - 180,
        rot = drag.rot0 + da;
      drag.rot = rot;
      const g = $("#lrpHeaven");
      if (g) g.style.transform = `rotate(${rot}deg)`;
      const d = Math.abs(rot - lastTick);
      if (d > 4) {
        try {
          if (STU.sfx) stuSfxTick(0.24, false, 1, Math.min(1, d / 14));
        } catch (_) {}
        lastTick = rot;
      }
    } else {
      const kx = drag.w / drag.rw,
        ky = drag.h / drag.rh;
      LRP.view.x = drag.vx - (e.clientX - drag.x) * kx;
      LRP.view.y = drag.vy - (e.clientY - drag.y) * ky;
      lrpViewApply();
    }
  });
  const up = (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const d = drag;
    drag = null;
    frame.classList.remove("grab");
    if (d.m === "t") {
      const R = lrpR(),
        step = ((Math.round(d.rot / 30) % 12) + 12) % 12;
      LRP.hb = (R.lr.zj + step) % 12;
      try {
        if (STU.sfx) stuSfxClunk();
      } catch (_) {}
      lrpRender(true, false, d.rot);
    }
  };
  svg.addEventListener("pointerup", up);
  svg.addEventListener("pointercancel", () => {
    drag = null;
    frame.classList.remove("grab");
    lrpRender(false);
  });
  svg.addEventListener("click", (e) => {
    const t = e.target.closest && e.target.closest("[data-lrp-sky]");
    if (t) {
      LRP.sel = +t.dataset.lrpSky;
      lrpInfo(lrpR());
    }
  });
  $("#lrpDetail").onclick = () => {
    const R0 = lrpR();
    if (!R0) return;
    try {
      setLive(false);
      setDt(LRP.civ);
      deduce(LRP.civ, "quick");
      setTimeout(() => selectTab("liuren", true), 260);
    } catch (e) {
      console.error(e);
      toast("无法打开大六壬详盘");
    }
  };
  $("#lrpFs").onclick = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await $("#lrpShell").requestFullscreen();
    } catch (e) {
      toast("当前浏览器不允许全屏");
    }
  };
  document.addEventListener("fullscreenchange", () => {
    const b = $("#lrpFs");
    if (b) b.textContent = document.fullscreenElement ? "退出全屏" : "全屏";
  });
}
/* 离开盘库时停止十二时辰演示 */
const plClose_v40 = plClose;
plClose = function () {
  try {
    lrpStop();
  } catch (_) {}
  return plClose_v40();
};
