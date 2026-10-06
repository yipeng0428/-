/* ===== v42 盘库 · 奇门遁甲转盘式盘 ===== */
const QTP = {
  mode: "calc",
  civ: null,
  view: { x: -420, y: -420, w: 840, h: 840 },
  gesture: "turn",
  ring: "star",
  sel: null,
  play: null,
  off: { star: 0, door: 0, god: 0 },
  layers: { pal: 1, earth: 1, star: 1, door: 1, god: 1, mark: 1 },
};
const QTP_PALS = [9, 2, 7, 6, 1, 8, 3, 4];
const QTP_LAYER = [
  ["pal", "八宫方位", "固定宫位与五行底图"],
  ["earth", "地盘三奇六仪", "按阴阳遁局数排布"],
  ["star", "九星 · 天盘干", "九星转宫，天禽寄芮"],
  ["door", "八门", "休生伤杜景死惊开"],
  ["god", "八神", "值符、螣蛇/勾陈、太阴等"],
  ["mark", "关键标记", "值符值使、空亡、驿马"],
];
const QTP_HAN = { 9: "离", 2: "坤", 7: "兑", 6: "乾", 1: "坎", 8: "艮", 3: "震", 4: "巽" };
function qtpNorm(a) {
  return ((+a % 360) + 360) % 360;
}
function qtpCivNow() {
  const n = nowBJ();
  return { y: n.y, m: n.m, d: n.d, h: n.h, mi: n.mi, s: 0 };
}
function qtpDt(c) {
  return `${c.y}-${f2(c.m)}-${f2(c.d)}T${f2(c.h)}:${f2(c.mi)}`;
}
function qtpParse(v) {
  const m = String(v || "").match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  return m ? { y: +m[1], m: +m[2], d: +m[3], h: +m[4], mi: +m[5], s: 0 } : null;
}
function qtpR() {
  if (!QTP.civ) QTP.civ = qtpCivNow();
  try {
    return compute(QTP.civ);
  } catch (e) {
    console.error("qtp compute", e);
    return null;
  }
}
function qtpArc(r0, r1, a0, a1, cls, attrs = "") {
  return `<path d="${p5Arc(r0, r1, a0, a1)}" class="${cls}" ${attrs}/>`;
}
function qtpText(r, a, t, fs, cls = "") {
  const p = p5Pt(r, a);
  return `<text x="${p[0].toFixed(2)}" y="${p[1].toFixed(2)}" text-anchor="middle" dominant-baseline="central" font-size="${fs}" class="qtp-txt ${cls}">${esc(String(t))}</text>`;
}
function qtpRing(r) {
  return `<circle r="${r}" class="qtp-ring"/>`;
}
function qtpMarker(r, a, txt, cls = "") {
  const p = p5Pt(r, a);
  return `<g><circle cx="${p[0].toFixed(2)}" cy="${p[1].toFixed(2)}" r="9" class="qtp-mark ${cls}"/><text x="${p[0].toFixed(2)}" y="${p[1].toFixed(2)}" text-anchor="middle" dominant-baseline="central" class="qtp-mark-t">${esc(txt)}</text></g>`;
}
function qtpFind(q, k, v) {
  return QTP_PALS.find((p) => q.cells[p] && q.cells[p][k] === v) || null;
}
function qtpAnchor(q, k) {
  if (k === "star") {
    const p = qtpFind(q, "star", "蓬");
    return p == null ? 0 : QM_ANG[p];
  }
  if (k === "door") {
    const p = qtpFind(q, "door", "休");
    return p == null ? 0 : QM_ANG[p];
  }
  return QM_ANG[q.q] || 0;
}
function qtpAnchors(R) {
  const q = R.qm;
  return { star: qtpAnchor(q, "star"), door: qtpAnchor(q, "door"), god: qtpAnchor(q, "god") };
}
function qtpDelta(a, b) {
  return ((a - b + 540) % 360) - 180;
}
function qtpShiftPal(p, deg) {
  const i = QTP_PALS.indexOf(+p),
    n = ((Math.round(deg / 45) % 8) + 8) % 8;
  return i < 0 ? p : QTP_PALS[(i + n) % 8];
}
function qtpRingGroup(R, k, r0, r1) {
  const q = R.qm,
    off = QTP.mode === "manual" ? QTP.off[k] : 0;
  let g = `<g id="qtp${k[0].toUpperCase() + k.slice(1)}" class="qtp-turn" style="transform:rotate(${off}deg)">`;
  QTP_PALS.forEach((p) => {
    const c = q.cells[p],
      a = QM_ANG[p],
      a0 = a - 22.5,
      a1 = a + 22.5;
    if (k === "star") {
      const tp = STARTYPE[c.star],
        cl = `qtp-starsec ${tp === "吉" ? "good" : "bad"}`;
      g +=
        qtpArc(r0, r1, a0, a1, cl, `data-qtp-pal="${p}" data-qtp-kind="star"`) +
        qtpText((r0 + r1) / 2 + 8, a, "天" + c.star, 13, tp === "吉" ? "good" : "bad") +
        qtpText((r0 + r1) / 2 - 12, a, "天盘 " + c.hs, 8, "dim");
      if (c.extra) g += qtpText(r0 + 8, a, "禽", 7, "gold");
      if (QTP.layers.mark && p === q.q) g += qtpMarker(r1 - 9, a, "符", "");
    } else if (k === "door") {
      const tp = DOORTYPE[c.door],
        cl = `qtp-doorsec ${tp === "吉" ? "good" : tp === "凶" ? "bad" : ""}`;
      g +=
        qtpArc(r0, r1, a0, a1, cl, `data-qtp-pal="${p}" data-qtp-kind="door"`) +
        qtpText(
          (r0 + r1) / 2,
          a,
          c.door + "门",
          13,
          tp === "吉" ? "good" : tp === "凶" ? "bad" : "",
        );
      if (QTP.layers.mark && p === q.rr) g += qtpMarker(r1 - 9, a, "使", "cyan");
    } else {
      const sc = QM_GOD_SC[c.god] || 0,
        cl = `qtp-godsec ${sc > 0 ? "good" : sc < 0 ? "bad" : ""}`;
      g +=
        qtpArc(r0, r1, a0, a1, cl, `data-qtp-pal="${p}" data-qtp-kind="god"`) +
        qtpText((r0 + r1) / 2, a, c.god, 11, sc > 0 ? "good" : sc < 0 ? "bad" : "");
    }
  });
  return g + "</g>";
}
function qtpSvg(R) {
  const q = R.qm;
  let g = "";
  g += qtpRing(399) + qtpRing(343) + qtpRing(278) + qtpRing(207) + qtpRing(143) + qtpRing(94);
  if (QTP.layers.pal) {
    QTP_PALS.forEach((p) => {
      const a = QM_ANG[p],
        a0 = a - 22.5,
        a1 = a + 22.5;
      g += qtpArc(344, 398, a0, a1, `qtp-sector w${PWX[p]}`, `data-qtp-base="${p}"`);
      g +=
        qtpText(375, a, `${QTP_HAN[p]}${PNUM[p]}`, 14, "gold") +
        qtpText(352, a, PDIR[p] + " · " + WXK[PWX[p]], 8, "dim");
      const t = p5Pt(96, a);
      const u = p5Pt(398, a);
      g += `<line x1="${t[0]}" y1="${t[1]}" x2="${u[0]}" y2="${u[1]}" class="qtp-sep"/>`;
      if (QTP.layers.mark) {
        if (q.kongP.includes(p)) g += qtpMarker(388, a, "空", "bad");
        if (q.horseP === p) g += qtpMarker(365, a, "马", "gold");
      }
    });
  }
  if (QTP.layers.god) g += qtpRingGroup(R, "god", 280, 341);
  if (QTP.layers.star) g += qtpRingGroup(R, "star", 210, 276);
  if (QTP.layers.door) g += qtpRingGroup(R, "door", 146, 205);
  if (QTP.layers.earth) {
    QTP_PALS.forEach((p) => {
      const a = QM_ANG[p],
        a0 = a - 22.5,
        a1 = a + 22.5,
        c = q.cells[p];
      g +=
        qtpArc(96, 141, a0, a1, "qtp-earthsec", `data-qtp-pal="${p}" data-qtp-kind="earth"`) +
        qtpText(119, a, c.earth || "—", 14, "gold");
    });
  }
  g += `<circle r="90" class="qtp-core"/><circle r="73" class="qtp-core2"/><text x="0" y="-25" text-anchor="middle" class="qtp-core-title">${q.yang ? "阳" : "阴"}遁${PNUM[q.ju]}局</text><text x="0" y="-3" text-anchor="middle" class="qtp-core-sub">${esc(q.term + q.yuanName + " · " + q.hourGZ)}</text><text x="0" y="15" text-anchor="middle" class="qtp-core-sub">值符 天${esc(q.zfStar)} · 值使 ${esc(q.zsDoor)}门</text><text x="0" y="32" text-anchor="middle" class="qtp-core-sub">旬首遁 ${esc(q.dun)}${q.fuyin ? " · 伏吟" : ""}${q.fanyin ? " · 反吟" : ""}</text>`;
  return g;
}
function qtpOffsetText(k) {
  const d = QTP.off[k] || 0,
    n = Math.round(d / 45);
  return `${n > 0 ? "+" : ""}${n} 宫 (${d > 0 ? "+" : ""}${d}°)`;
}
function qtpInfo(R) {
  const box = $("#qtpInfo");
  if (!box || !R) return;
  const q = R.qm,
    A = qtpAnchors(R),
    sel = QTP.sel;
  let det = "";
  if (sel) {
    const p = sel.p,
      c = q.cells[p],
      target =
        QTP.mode === "manual" && sel.kind !== "earth" ? qtpShiftPal(p, QTP.off[sel.kind] || 0) : p,
      ge = (c.geju || []).concat(c.extra2 || []),
      tags = (c.tags || []).map((x) => x.n);
    det = `<div class="qtp-sel"><b>${PNAME[p]}${PNUM[p]}宫 · ${PDIR[p]}</b>${target !== p ? ` → 实验转到 <b>${PNAME[target]}${PNUM[target]}宫</b>` : ""}<br>八神 ${c.god} · 天${c.star} / 天盘${c.hs} · ${c.door}门 · 地盘${c.earth}<div class="tags">${ge.map((x) => `<span>${x.n}</span>`).join("")}${tags.map((x) => `<span>${x}</span>`).join("") || "<span>无特殊标记</span>"}</div></div>`;
  }
  box.innerHTML = `<div class="qtp-info-inner"><div><h4>当前定局</h4><div class="qtp-facts"><span>局式</span><b>${q.yang ? "阳" : "阴"}遁${PNUM[q.ju]}局 · ${q.term}${q.yuanName}</b><span>时柱</span><b>${q.hourGZ}</b><span>值符</span><b>天${q.zfStar} · ${PNAME[q.q]}${PNUM[q.q]}宫</b><span>值使</span><b>${q.zsDoor}门 · ${PNAME[q.rr]}${PNUM[q.rr]}宫</b><span>旬首遁仪</span><b>${q.dun}</b><span>空亡</span><b>${q.kongB.map((b) => ZHI[b]).join("")} · ${q.kongP.map((p) => PNAME[p] + PNUM[p]).join("、")}宫</b><span>驿马</span><b>${ZHI[q.horseB]} · ${PNAME[q.horseP]}${PNUM[q.horseP]}宫</b><span>特殊</span><b>${[q.fuyin ? "伏吟" : "", q.fanyin ? "反吟" : "", q.wubuyu ? "五不遇时" : ""].filter(Boolean).join(" · ") || "—"}</b></div>
  <div class="qtp-formula"><b>转盘关系：</b><br>① 节气 + 符头定阴阳遁与局数 → 地盘三奇六仪固定。<br>② 旬首所遁之仪定位值符星，时干定位值符所落 → 九星与天盘干转宫。<br>③ 值使门按时辰步数转宫 → 八门另成一层。<br>④ 八神从值符宫起，阳遁顺布、阴遁逆布。</div></div><div><h4>环层状态</h4><div class="qtp-facts"><span>九星锚点</span><b>天蓬位 ${A.star}°</b><span>八门锚点</span><b>休门位 ${A.door}°</b><span>八神锚点</span><b>值符位 ${A.god}°</b><span>星盘实验偏移</span><b>${qtpOffsetText("star")}</b><span>门盘实验偏移</span><b>${qtpOffsetText("door")}</b><span>神盘实验偏移</span><b>${qtpOffsetText("god")}</b></div>${det || '<p class="note">点圆盘任一宫位或转层，可查看该宫星、门、神、天地盘干与格局标记。</p>'}</div><div class="qtp-wide"><p class="note">本页采用现有系统的“时家转盘奇门 · 拆补法”计算结果。手动实验只改变三个转层的视觉落宫，用于理解结构，不会把任意手拨组合伪装成传统上真实成立的奇门局；回到“历算”即恢复计算结果。</p></div></div>`;
}
function qtpViewApply() {
  const svg = $("#qtpSvg");
  if (svg) svg.setAttribute("viewBox", `${QTP.view.x} ${QTP.view.y} ${QTP.view.w} ${QTP.view.h}`);
  const z = $("#qtpZoom");
  if (z) z.textContent = Math.round((840 / QTP.view.w) * 100) + "%";
}
function qtpFit() {
  QTP.view = { x: -420, y: -420, w: 840, h: 840 };
  qtpViewApply();
}
function qtpZoomAt(f, cx, cy) {
  const svg = $("#qtpSvg"),
    v = QTP.view;
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
  qtpViewApply();
}
function qtpSoundRun(ms = 720, dense = 0.6) {
  try {
    if (!STU.sfx) return;
    const n = Math.max(5, Math.min(20, Math.round((ms / 55) * dense))),
      gap = ms / n;
    let i = 0;
    const t = setInterval(() => {
      i++;
      stuSfxTick(0.25, false, 1, 0.35 + dense * 0.55);
      if (i >= n) {
        clearInterval(t);
        setTimeout(() => stuSfxClunk(), 30);
      }
    }, gap);
  } catch (_) {}
}
function qtpRender(anim = false, oldA = null) {
  const R = qtpR(),
    svg = $("#qtpSvg");
  if (!R || !svg) return;
  const A = qtpAnchors(R);
  svg.innerHTML = qtpSvg(R);
  qtpViewApply();
  qtpInfo(R);
  if (anim && oldA) {
    ["star", "door", "god"].forEach((k) => {
      const el = $("#qtp" + k[0].toUpperCase() + k.slice(1));
      if (!el || !el.animate) return;
      const off = QTP.mode === "manual" ? QTP.off[k] : 0,
        d = qtpDelta(A[k], oldA[k]);
      el.animate([{ transform: `rotate(${off - d}deg)` }, { transform: `rotate(${off}deg)` }], {
        duration: 760,
        easing: "cubic-bezier(.18,.78,.18,1)",
      });
    });
    qtpSoundRun(760, 0.7);
  }
  const dt = $("#qtpDt");
  if (dt && document.activeElement !== dt) dt.value = qtpDt(QTP.civ);
  qtpSyncUI();
}
function qtpSyncUI() {
  const man = QTP.mode === "manual";
  const a = $("#qtpCalc"),
    b = $("#qtpManual");
  if (a) a.classList.toggle("on", !man);
  if (b) b.classList.toggle("on", man);
  const box = $("#qtpManualBox");
  if (box) box.hidden = !man;
  $$("[data-qtpring]").forEach((x) => x.classList.toggle("on", x.dataset.qtpring === QTP.ring));
  const os = $("#qtpOffsets");
  if (os)
    os.innerHTML = `<span>九星</span><b>${qtpOffsetText("star")}</b><span>八门</span><b>${qtpOffsetText("door")}</b><span>八神</span><b>${qtpOffsetText("god")}</b>`;
}
function qtpSetMode(m) {
  QTP.mode = m;
  if (m === "calc") QTP.off = { star: 0, door: 0, god: 0 };
  qtpRender(false);
}
function qtpStep(n) {
  const old = qtpR(),
    oldA = old ? qtpAnchors(old) : null,
    c = QTP.civ,
    jd = jdFromGreg(c.y, c.m, c.d, c.h, c.mi, c.s || 0) + (n * 2) / 24,
    f = fromJD(jd);
  QTP.civ = { y: f.y, m: f.m, d: f.d, h: f.h, mi: f.mi, s: 0 };
  if (QTP.mode === "calc") QTP.off = { star: 0, door: 0, god: 0 };
  qtpRender(true, oldA);
}
function qtpNow() {
  const old = qtpR(),
    oldA = old ? qtpAnchors(old) : null;
  QTP.civ = qtpCivNow();
  QTP.mode = "calc";
  QTP.off = { star: 0, door: 0, god: 0 };
  qtpFit();
  qtpRender(true, oldA);
}
function qtpPlayToggle() {
  const b = $("#qtpPlay");
  if (QTP.play) {
    clearInterval(QTP.play);
    QTP.play = null;
    if (b) {
      b.classList.remove("on");
      b.textContent = "▶ 十二时辰演示";
    }
    return;
  }
  if (QTP.mode !== "calc") qtpSetMode("calc");
  if (b) {
    b.classList.add("on");
    b.textContent = "■ 停止演示";
  }
  QTP.play = setInterval(() => qtpStep(1), 1500);
}
function qtpStop() {
  if (QTP.play) {
    clearInterval(QTP.play);
    QTP.play = null;
  }
}
function qtpNudge(n) {
  if (QTP.mode !== "manual") {
    toast("先切换到“手动实验”");
    return;
  }
  QTP.off[QTP.ring] = qtpNorm((QTP.off[QTP.ring] || 0) + n * 45);
  if (QTP.off[QTP.ring] > 180) QTP.off[QTP.ring] -= 360;
  try {
    if (STU.sfx) stuSfxClunk();
  } catch (_) {}
  qtpRender(false);
}
function qtpDemo() {
  const ids = ["qtpStar", "qtpDoor", "qtpGod"],
    els = ids.map((id) => document.getElementById(id)).filter(Boolean);
  if (!els.length) return;
  els.forEach((el, i) => {
    const base = QTP.mode === "manual" ? QTP.off[["star", "door", "god"][i]] : 0;
    el.animate(
      [
        { transform: `rotate(${base}deg)` },
        { transform: `rotate(${base + (i % 2 ? 360 : -360)}deg)` },
        { transform: `rotate(${base}deg)` },
      ],
      { duration: 1700 + i * 180, easing: "cubic-bezier(.2,.7,.2,1)" },
    );
  });
  qtpSoundRun(1900, 0.85);
}
function qtpOpen() {
  const pane = $("#pane-studio");
  if (!pane) return;
  if (STU.active) studioLeave();
  qtpStop();
  PANLIB.mode = "qimenpan";
  document.body.classList.add("studio-mode");
  delete pane.dataset.ui;
  pane.dataset.built = "1";
  QTP.civ = QTP.civ || qtpCivNow();
  pane.innerHTML = `<div class="qtp-shell" id="qtpShell"><div class="qtp-top"><button class="gbtn sm" id="qtpBack">← 盘库</button><div class="qtp-title"><b>奇门遁甲 · 转盘式盘</b><small>地盘固定 · 九星天盘干 · 八门 · 八神独立转层</small></div><button class="gbtn sm" id="qtpDetail">用此时刻打开奇门详盘</button><button class="gbtn sm" id="qtpDemo">⟳ 三层转盘演示</button><button class="gbtn sm" id="qtpFs">全屏</button></div>
  <div class="qtp-grid"><aside class="panel qtp-side"><h4>排盘方式</h4><div class="qtp-mode"><button class="gbtn sm" id="qtpCalc">历算</button><button class="gbtn sm" id="qtpManual">手动实验</button></div><div class="qtp-group"><label>观测时刻（北京时间）<input type="datetime-local" id="qtpDt" value="${qtpDt(QTP.civ)}"></label><div class="qtp-btnrow"><button class="gbtn sm" id="qtpNow">此刻</button><button class="gbtn sm" id="qtpPrev">← 上一时辰</button><button class="gbtn sm" id="qtpNext">下一时辰 →</button></div><button class="gbtn sm qtp-play" id="qtpPlay" style="width:100%;margin-top:6px">▶ 十二时辰演示</button></div>
  <div class="qtp-group" id="qtpManualBox" hidden><h4>手动拨层</h4><div class="qtp-ringpick"><button class="gbtn sm" data-qtpring="star">九星</button><button class="gbtn sm" data-qtpring="door">八门</button><button class="gbtn sm" data-qtpring="god">八神</button></div><div class="qtp-btnrow"><button class="gbtn sm" id="qtpLeft">← 一宫</button><button class="gbtn sm" id="qtpZero">本层归位</button><button class="gbtn sm" id="qtpRight">一宫 →</button></div><div class="qtp-offsets" id="qtpOffsets"></div><div class="qtp-manwarn">手动实验只移动选中的转层，并吸附到 45° / 一宫；不会重新生成传统局数，也不会把任意组合当作有效奇门局。</div></div>
  <div class="qtp-group"><h4>显示层</h4><div class="qtp-layers">${QTP_LAYER.map(([k, n, d]) => `<label class="qtp-layer"><input type="checkbox" data-qtpl="${k}"${QTP.layers[k] ? " checked" : ""}><span>${n}<small>${d}</small></span></label>`).join("")}</div></div></aside>
  <section class="qtp-main"><div class="qtp-viewbar"><button class="gbtn sm" id="qtpTurn">拨转层</button><button class="gbtn sm" id="qtpPan">查看平移</button><span class="hint">滚轮缩放 · 手动实验拖选中层 · 查看模式拖动画面</span><button class="gbtn sm" id="qtpFit">↙↗ 适应</button><span class="qtp-z"><button class="gbtn sm" id="qtpZm">−</button><span id="qtpZoom">100%</span><button class="gbtn sm" id="qtpZp">＋</button></span></div><div class="qtp-frame turn" id="qtpFrame"><svg id="qtpSvg" viewBox="-420 -420 840 840" role="img" aria-label="奇门遁甲转盘式盘"></svg></div></section>
  <aside class="panel qtp-info" id="qtpInfo"></aside></div><div class="panel qtp-bottom"><b class="gold">结构说明：</b>这个页面专门表现“转盘奇门”的层级关系：地盘三奇六仪作为基座；九星与天盘干形成一层，八门另成一层，八神再成一层。自动模式完全读取现有奇门计算引擎；手动模式只用于拆开观察各层怎样相对转位。它与九宫格详情页互补，而不是替代。</div></div>`;
  qtpBind();
  qtpSyncUI();
  qtpRender(false);
}
function qtpBind() {
  const pane = $("#pane-studio"),
    svg = $("#qtpSvg"),
    frame = $("#qtpFrame");
  if (!pane || !svg) return;
  $("#qtpBack").onclick = () => {
    qtpStop();
    plHub();
  };
  $("#qtpCalc").onclick = () => qtpSetMode("calc");
  $("#qtpManual").onclick = () => qtpSetMode("manual");
  $("#qtpNow").onclick = qtpNow;
  $("#qtpPrev").onclick = () => qtpStep(-1);
  $("#qtpNext").onclick = () => qtpStep(1);
  $("#qtpPlay").onclick = qtpPlayToggle;
  $("#qtpDemo").onclick = qtpDemo;
  $("#qtpDt").onchange = (e) => {
    const c = qtpParse(e.target.value);
    if (c) {
      const old = qtpR(),
        oldA = old ? qtpAnchors(old) : null;
      QTP.civ = c;
      if (QTP.mode === "calc") QTP.off = { star: 0, door: 0, god: 0 };
      qtpRender(true, oldA);
    }
  };
  $$("[data-qtpl]", pane).forEach(
    (c) =>
      (c.onchange = () => {
        QTP.layers[c.dataset.qtpl] = c.checked ? 1 : 0;
        qtpRender(false);
      }),
  );
  $$("[data-qtpring]", pane).forEach(
    (b) =>
      (b.onclick = () => {
        QTP.ring = b.dataset.qtpring;
        qtpSyncUI();
      }),
  );
  $("#qtpLeft").onclick = () => qtpNudge(-1);
  $("#qtpRight").onclick = () => qtpNudge(1);
  $("#qtpZero").onclick = () => {
    if (QTP.mode !== "manual") return;
    QTP.off[QTP.ring] = 0;
    try {
      if (STU.sfx) stuSfxClunk();
    } catch (_) {}
    qtpRender(false);
  };
  const setG = (m) => {
    QTP.gesture = m;
    frame.classList.toggle("turn", m === "turn");
    frame.classList.toggle("pan", m === "pan");
    $("#qtpTurn").classList.toggle("on", m === "turn");
    $("#qtpPan").classList.toggle("on", m === "pan");
  };
  $("#qtpTurn").onclick = () => setG("turn");
  $("#qtpPan").onclick = () => setG("pan");
  setG(QTP.gesture);
  $("#qtpFit").onclick = qtpFit;
  $("#qtpZm").onclick = () => {
    const r = svg.getBoundingClientRect();
    qtpZoomAt(1.2, r.left + r.width / 2, r.top + r.height / 2);
  };
  $("#qtpZp").onclick = () => {
    const r = svg.getBoundingClientRect();
    qtpZoomAt(0.82, r.left + r.width / 2, r.top + r.height / 2);
  };
  svg.addEventListener(
    "wheel",
    (e) => {
      e.preventDefault();
      qtpZoomAt(e.deltaY < 0 ? 0.86 : 1.16, e.clientX, e.clientY);
    },
    { passive: false },
  );
  const pos = (e) => {
    const r = svg.getBoundingClientRect(),
      v = QTP.view,
      x = v.x + ((e.clientX - r.left) / r.width) * v.w,
      y = v.y + ((e.clientY - r.top) / r.height) * v.h;
    return { x, y, a: qtpNorm((Math.atan2(x, -y) * 180) / Math.PI) };
  };
  let drag = null,
    lastTick = 0;
  svg.addEventListener("pointerdown", (e) => {
    if (e.button > 0) return;
    if (QTP.gesture === "turn") {
      if (QTP.mode !== "manual") {
        toast("先切换到“手动实验”再拨动转层");
        return;
      }
      const p = pos(e),
        off = QTP.off[QTP.ring] || 0;
      drag = { id: e.pointerId, m: "t", a0: p.a, off0: off, off };
      lastTick = off;
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
        vx: QTP.view.x,
        vy: QTP.view.y,
        w: QTP.view.w,
        h: QTP.view.h,
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
        off = drag.off0 + da;
      drag.off = off;
      const el = $("#qtp" + QTP.ring[0].toUpperCase() + QTP.ring.slice(1));
      if (el) el.style.transform = `rotate(${off}deg)`;
      const d = Math.abs(off - lastTick);
      if (d > 4) {
        try {
          if (STU.sfx) stuSfxTick(0.24, false, 1, Math.min(1, d / 15));
        } catch (_) {}
        lastTick = off;
      }
    } else {
      const kx = drag.w / drag.rw,
        ky = drag.h / drag.rh;
      QTP.view.x = drag.vx - (e.clientX - drag.x) * kx;
      QTP.view.y = drag.vy - (e.clientY - drag.y) * ky;
      qtpViewApply();
    }
  });
  const up = (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const d = drag;
    drag = null;
    frame.classList.remove("grab");
    if (d.m === "t") {
      let v = Math.round(d.off / 45) * 45;
      v = ((((v + 180) % 360) + 360) % 360) - 180;
      QTP.off[QTP.ring] = v;
      try {
        if (STU.sfx) stuSfxClunk();
      } catch (_) {}
      qtpRender(false);
    }
  };
  svg.addEventListener("pointerup", up);
  svg.addEventListener("pointercancel", () => {
    drag = null;
    frame.classList.remove("grab");
    qtpRender(false);
  });
  svg.addEventListener("click", (e) => {
    const t = e.target.closest && e.target.closest("[data-qtp-pal],[data-qtp-base]");
    if (!t) return;
    const p = +(t.dataset.qtpPal || t.dataset.qtpBase),
      kind = t.dataset.qtpKind || "earth";
    QTP.sel = { p, kind };
    qtpInfo(qtpR());
  });
  $("#qtpDetail").onclick = () => {
    const R0 = qtpR();
    if (!R0) return;
    try {
      setLive(false);
      setDt(QTP.civ);
      deduce(QTP.civ, "quick");
      setTimeout(() => selectTab("qimen", true), 260);
    } catch (e) {
      console.error(e);
      toast("无法打开奇门详盘");
    }
  };
  $("#qtpFs").onclick = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await $("#qtpShell").requestFullscreen();
    } catch (e) {
      toast("当前浏览器不允许全屏");
    }
  };
  document.addEventListener("fullscreenchange", () => {
    const b = $("#qtpFs");
    if (b) b.textContent = document.fullscreenElement ? "退出全屏" : "全屏";
  });
}
const plClose_v41 = plClose;
plClose = function () {
  try {
    qtpStop();
  } catch (_) {}
  return plClose_v41();
};
