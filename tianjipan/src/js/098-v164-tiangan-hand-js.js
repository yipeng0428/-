(() => {
  "use strict";
  const V164_BUILD = "v164 · 2026-10-05 14:01 +08:00";
  const TG_GAN = "甲乙丙丁戊己庚辛壬癸".split(""),
    TG_ZHI = "子丑寅卯辰巳午未申酉戌亥".split("");
  const TG_WXI = [0, 0, 1, 1, 2, 2, 3, 3, 4, 4],
    TG_WX = "木火土金水".split(""),
    TG_YY = ["阳", "阴", "阳", "阴", "阳", "阴", "阳", "阴", "阳", "阴"];
  const TG_POS = [
    [344, 452],
    [246, 452],
    [150, 452],
    [150, 340],
    [150, 235],
    [150, 136],
    [292, 92],
    [428, 136],
    [494, 240],
    [494, 340],
    [494, 438],
    [394, 452],
  ];
  const TG_XUN = [
    { n: "甲子旬", start: 0, xk: "戌亥" },
    { n: "甲戌旬", start: 10, xk: "申酉" },
    { n: "甲申旬", start: 8, xk: "午未" },
    { n: "甲午旬", start: 6, xk: "辰巳" },
    { n: "甲辰旬", start: 4, xk: "寅卯" },
    { n: "甲寅旬", start: 2, xk: "子丑" },
  ];
  const TG_HE = [
      [0, 5, "土"],
      [1, 6, "金"],
      [2, 7, "水"],
      [3, 8, "木"],
      [4, 9, "火"],
    ],
    TG_CHONG = [
      [0, 6],
      [1, 7],
      [2, 8],
      [3, 9],
    ];
  const TG = {
    sel: 0,
    xun: 0,
    gesture: "select",
    view: { x: 70, y: -6, w: 520, h: 760 },
    play: null,
    layers: { branch: 1, he: 1, chong: 1, wx: 1 },
    quiz: { q: null, score: 0, total: 0, msg: "" },
  };
  const $t = (s) => document.querySelector(s),
    $$t = (s) => Array.from(document.querySelectorAll(s));
  const escT = (s) =>
    String(s).replace(
      /[&<>\"]/g,
      (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '\"': "&quot;" })[m] || m,
    );
  function tgMap() {
    const x = TG_XUN[TG.xun],
      m = Array(12).fill(null);
    for (let i = 0; i < 10; i++) m[(x.start + i) % 12] = i;
    return m;
  }
  function tgZhiOf(g) {
    const x = TG_XUN[TG.xun];
    return (x.start + g) % 12;
  }
  function tgHe(g) {
    const a = TG_HE.find((p) => p[0] === g || p[1] === g);
    return a ? { g: a[0] === g ? a[1] : a[0], hua: a[2] } : null;
  }
  function tgChong(g) {
    const a = TG_CHONG.find((p) => p[0] === g || p[1] === g);
    return a ? (a[0] === g ? a[1] : a[0]) : null;
  }
  function tgRel(a, b) {
    const d = (TG_WXI[b] - TG_WXI[a] + 5) % 5;
    return ["同气", "我生", "我克", "克我", "生我"][d];
  }
  function tgJiaziIndex(g, z) {
    for (let i = 0; i < 60; i++) if (i % 10 === g && i % 12 === z) return i;
    return -1;
  }
  function tgPoint(z) {
    return TG_POS[((z % 12) + 12) % 12];
  }
  function tgView() {
    const s = $t("#tg164Svg");
    if (s) s.setAttribute("viewBox", `${TG.view.x} ${TG.view.y} ${TG.view.w} ${TG.view.h}`);
    const z = $t("#tg164Zoom");
    if (z) z.textContent = Math.round((760 / TG.view.w) * 100) + "%";
  }
  function tgFit() {
    TG.view = { x: 70, y: -6, w: 520, h: 760 };
    tgView();
  }
  function tgZoom(k, cx, cy) {
    const s = $t("#tg164Svg");
    if (!s) return;
    const r = s.getBoundingClientRect(),
      v = TG.view,
      nw = Math.max(300, Math.min(980, v.w * k)),
      nh = nw * (v.h / v.w),
      fx = (cx - r.left) / Math.max(1, r.width),
      fy = (cy - r.top) / Math.max(1, r.height);
    TG.view = { x: v.x + (v.w - nw) * fx, y: v.y + (v.h - nh) * fy, w: nw, h: nh };
    tgView();
  }
  function tgHand() {
    return `<g aria-hidden="true"><rect class="tg164-hand-panel" x="126" y="96" width="390" height="392" rx="40"/><rect class="tg164-hand" x="132" y="124" width="84" height="352" rx="40"/><rect class="tg164-hand" x="248" y="78" width="88" height="398" rx="42"/><rect class="tg164-hand" x="382" y="124" width="84" height="352" rx="40"/><rect class="tg164-hand" x="466" y="208" width="68" height="268" rx="34"/><path class="tg164-hand" d="M122 402 Q118 368 156 368 H496 Q536 368 546 406 Q560 400 576 414 Q597 432 589 462 Q579 491 552 506 L530 520 V644 Q530 706 460 724 H224 Q146 718 126 646 Z"/><path class="tg164-crease" d="M144 448H208M144 340H208M144 234H208M270 448H328M402 448H458M482 438H528M482 340H528M482 242H528M176 510Q334 542 500 510M170 580Q334 614 508 580"/></g>`;
  }
  function tgRoute() {
    const pts = [];
    for (let i = 0; i < 12; i++) pts.push(tgPoint(i).join(","));
    pts.push(tgPoint(0).join(","));
    return `<polyline class="tg164-route" points="${pts.join(" ")}"/>`;
  }
  function tgLine(g1, g2, cls, label) {
    const a = tgPoint(tgZhiOf(g1)),
      b = tgPoint(tgZhiOf(g2)),
      mx = (a[0] + b[0]) / 2,
      my = (a[1] + b[1]) / 2;
    return `<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" class="tg164-rel ${cls}"/><text x="${mx}" y="${my - 6}" class="tg164-rel-label">${label}</text>`;
  }
  function tgSvg() {
    const map = tgMap(),
      x = TG_XUN[TG.xun],
      sel = TG.sel;
    let o = `<rect class="tg164-titlebar" x="152" y="8" width="356" height="38" rx="19"/><text class="tg164-titletext" x="330" y="23" text-anchor="middle">十天干掌 · 游干盘</text><text class="tg164-subtext" x="330" y="37" text-anchor="middle">${x.n} · 从${TG_ZHI[x.start]}位起甲 · 旬空 ${x.xk}</text>${tgHand()}${tgRoute()}`;
    if (TG.layers.he) {
      const h = tgHe(sel);
      if (h) o += tgLine(sel, h.g, "he", `五合·化${h.hua}`);
    }
    if (TG.layers.chong) {
      const c = tgChong(sel);
      if (c != null) o += tgLine(sel, c, "chong", "四冲");
    }
    for (let z = 0; z < 12; z++) {
      const p = tgPoint(z),
        g = map[z];
      if (g == null) {
        o += `<circle class="tg164-empty" cx="${p[0]}" cy="${p[1]}" r="22"/><text class="tg164-empty-t" x="${p[0]}" y="${p[1] + 3}">${TG_ZHI[z]}·空</text>`;
        continue;
      }
      const on = g === sel;
      o += `<g class="tg164-stem${on ? " on" : ""}" data-tg164-g="${g}"><circle class="halo" cx="${p[0]}" cy="${p[1]}" r="29"/><circle class="core" cx="${p[0]}" cy="${p[1]}" r="21"/><text class="g" x="${p[0]}" y="${p[1] - 4}">${TG_GAN[g]}</text><text class="z" x="${p[0]}" y="${p[1] + 18}">${TG.layers.branch ? TG_ZHI[z] : ""}</text>${TG.layers.wx ? `<text class="wx" x="${p[0]}" y="${p[1] - 33}">${TG_WX[TG_WXI[g]]}·${TG_YY[g]}</text>` : ""}</g>`;
    }
    const p = tgPoint(tgZhiOf(sel));
    o += `<circle class="tg164-center" cx="330" cy="585" r="76"/><text class="tg164-center-big" x="330" y="565">${TG_GAN[sel]}</text><text class="tg164-center-sm" x="330" y="590">${TG_WX[TG_WXI[sel]]} · ${TG_YY[sel]} · 临${TG_ZHI[tgZhiOf(sel)]}</text><text class="tg164-center-sm" x="330" y="608">五合 ${tgHe(sel) ? TG_GAN[tgHe(sel).g] : "—"} · 四冲 ${tgChong(sel) != null ? TG_GAN[tgChong(sel)] : "—"}</text><line x1="330" y1="510" x2="${p[0]}" y2="${p[1] + 30}" stroke="rgba(98,205,195,.32)" stroke-dasharray="3 4"/>`;
    return o;
  }
  function tgInfo() {
    const g = TG.sel,
      h = tgHe(g),
      c = tgChong(g),
      z = tgZhiOf(g),
      same = TG_GAN.filter((_, i) => i !== g && TG_WXI[i] === TG_WXI[g]).join("、"),
      gen = TG_GAN.filter((_, i) => tgRel(g, i) === "我生").join("、"),
      ke = TG_GAN.filter((_, i) => tgRel(g, i) === "我克").join("、");
    const box = $t("#tg164Info");
    if (!box) return;
    box.innerHTML = `<h4>${TG_GAN[g]} · ${TG_WX[TG_WXI[g]]}${TG_YY[g]}</h4><div class="tg164-hero"><div class="tg164-kpi"><small>本旬掌位</small><b>${TG_ZHI[z]}位</b></div><div class="tg164-kpi"><small>五合</small><b>${h ? TG_GAN[h.g] + " · 化" + h.hua : "—"}</b></div><div class="tg164-kpi"><small>四冲</small><b>${c != null ? TG_GAN[c] : "—"}</b></div><div class="tg164-kpi"><small>同五行</small><b>${same || "—"}</b></div></div><div class="tg164-facts"><span>天干</span><b>${TG_GAN[g]}</b><span>五行 / 阴阳</span><b>${TG_WX[TG_WXI[g]]} · ${TG_YY[g]}</b><span>所在旬</span><b>${TG_XUN[TG.xun].n}</b><span>掌位地支</span><b>${TG_ZHI[z]}</b><span>我生</span><b>${gen || "—"}</b><span>我克</span><b>${ke || "—"}</b><span>旬空</span><b>${TG_XUN[TG.xun].xk}</b></div><div class="tg164-card"><b>游干读法</b><br>选定六甲旬后，从旬首地支起甲，沿十二地支掌顺排甲乙丙丁戊己庚辛壬癸；十干排完后余下两支为空亡。切换“六甲旬”即可观察十干在掌位上的整体游移。</div><div class="tg164-card"><b>关系提示</b><div class="tg164-pills"><span>五合：${h ? TG_GAN[g] + TG_GAN[h.g] + "化" + h.hua : "—"}</span><span>四冲：${c != null ? TG_GAN[g] + TG_GAN[c] : "无直接四冲"}</span><span>五行：${TG_WX[TG_WXI[g]]}</span></div></div>`;
  }
  function tgStrip() {
    const box = $t("#tg164Strip");
    if (!box) return;
    box.innerHTML = TG_GAN.map(
      (n, g) =>
        `<button class="tg164-chip${g === TG.sel ? " on" : ""}" data-tg164-g="${g}"><b>${n}</b><span>${TG_WX[TG_WXI[g]]}·${TG_YY[g]}</span><small>${TG_ZHI[tgZhiOf(g)]}位</small></button>`,
    ).join("");
  }
  function tgPair() {
    const a = +$t("#tg164PairG")?.value || 0,
      z = +$t("#tg164PairZ")?.value || 0,
      i = tgJiaziIndex(a, z),
      out = $t("#tg164PairOut");
    if (!out) return;
    out.innerHTML =
      i >= 0
        ? `<b style="color:var(--gold2)">${TG_GAN[a]}${TG_ZHI[z]}</b> 是六十甲子中的第 <b>${i + 1}</b> 位（${TG_YY[a]}干配${z % 2 === 0 ? "阳" : "阴"}支）。`
        : `<b style="color:var(--red)">${TG_GAN[a]}${TG_ZHI[z]}</b> 不属于六十甲子的合法干支配对；天干与地支需要阴阳同类配合。`;
  }
  function tgQuizNew() {
    const typ = Math.floor(Math.random() * 3),
      g = Math.floor(Math.random() * 10),
      h = tgHe(g),
      c = tgChong(g);
    let text = "",
      ans = g;
    if (typ === 0) {
      text = `请点出「${TG_GAN[g]}」在当前 ${TG_XUN[TG.xun].n} 的掌位`;
      ans = g;
    } else if (typ === 1) {
      text = `「${TG_GAN[g]}」五合的是哪一干？`;
      ans = h ? h.g : g;
    } else {
      text = `哪一干与「${TG_GAN[g]}」同属${TG_WX[TG_WXI[g]]}？`;
      ans = g % 2 === 0 ? g + 1 : g - 1;
    }
    TG.quiz.q = { text, ans };
    TG.quiz.msg = "";
    tgQuizRender();
  }
  function tgQuizRender() {
    const box = $t("#tg164Quiz");
    if (!box) return;
    box.innerHTML = TG.quiz.q
      ? `<div><p>${escT(TG.quiz.q.text)}</p><small>${TG.quiz.msg || `得分 ${TG.quiz.score}/${TG.quiz.total}`}</small></div><button class="gbtn sm" id="tg164NextQ">下一题</button>`
      : `<div><p>用掌位、五合和五行关系训练十天干。</p><small>点击开始后，直接在掌图或下方十干卡片作答。</small></div><button class="gbtn sm" id="tg164NextQ">开始练习</button>`;
    const b = $t("#tg164NextQ");
    if (b) b.onclick = tgQuizNew;
  }
  function tgAnswer(g) {
    if (!TG.quiz.q) return;
    TG.quiz.total++;
    const ok = g === TG.quiz.q.ans;
    if (ok) TG.quiz.score++;
    TG.quiz.msg = ok ? "答对了。" : "不对，正确答案是 " + TG_GAN[TG.quiz.q.ans] + "。";
    tgQuizRender();
  }
  function tgRender() {
    const s = $t("#tg164Svg");
    if (s) s.innerHTML = tgSvg();
    tgView();
    tgInfo();
    tgStrip();
    tgQuizRender();
    $$t("[data-tg164-layer]").forEach((c) => (c.checked = !!TG.layers[c.dataset.tg164Layer]));
    const x = $t("#tg164Xun");
    if (x) x.value = String(TG.xun);
    tgPair();
  }
  function tgStop() {
    if (TG.play) {
      clearInterval(TG.play);
      TG.play = null;
    }
    const b = $t("#tg164Play");
    if (b) b.textContent = "▶ 游干演示";
  }
  function tgPlay() {
    if (TG.play) {
      tgStop();
      return;
    }
    const b = $t("#tg164Play");
    if (b) b.textContent = "■ 停止演示";
    TG.play = setInterval(() => {
      TG.sel = (TG.sel + 1) % 10;
      tgRender();
    }, 800);
  }
  function tgOpen() {
    const pane = $t("#pane-studio");
    if (!pane) return;
    try {
      if (window.STU && STU.active) studioLeave();
    } catch (_) {}
    [
      "dzhStop",
      "jtsStop",
      "hhdStop",
      "jc12Stop",
      "msgStop",
      "htdStop",
      "xapStop",
      "typStop",
      "qtpStop",
      "lrpStop",
      "zlfStop",
      "lgbStop",
      "tspStop",
    ].forEach((n) => {
      try {
        if (typeof window[n] === "function") window[n]();
      } catch (_) {}
    });
    tgStop();
    try {
      PANLIB.mode = "tiangan-hand";
    } catch (_) {}
    document.body.classList.add("studio-mode");
    delete pane.dataset.ui;
    pane.dataset.built = "1";
    pane.innerHTML = `<div class="tg164-shell" id="tg164Shell"><div class="tg164-top"><button class="gbtn sm" id="tg164Back">← 盘库</button><div class="tg164-title"><b>十天干掌 · 游干盘</b><small>第 16 盘 · 六甲旬首 × 十干游移 × 五合四冲 × 五行生克 × 干支快速配对</small></div><button class="gbtn sm" id="tg164Dizhi">十二地支掌</button><button class="gbtn sm" id="tg164Fs">全屏</button></div><div class="tg164-grid"><aside class="panel tg164-side"><h4>游干设置</h4><div class="tg164-group"><label>六甲旬<select id="tg164Xun">${TG_XUN.map((x, i) => `<option value="${i}"${i === TG.xun ? " selected" : ""}>${x.n} · 空${x.xk}</option>`).join("")}</select></label><div class="tg164-row"><button class="gbtn sm" id="tg164Prev">← 前一旬</button><button class="gbtn sm" id="tg164Next">后一旬 →</button></div><button class="gbtn sm" id="tg164Play" style="width:100%;margin-top:7px">▶ 游干演示</button></div><div class="tg164-group"><h4>显示层</h4><label class="tg164-layer"><input type="checkbox" data-tg164-layer="branch"${TG.layers.branch ? " checked" : ""}><span>掌位地支<small>显示十干当前所临地支</small></span></label><label class="tg164-layer"><input type="checkbox" data-tg164-layer="wx"${TG.layers.wx ? " checked" : ""}><span>五行阴阳<small>显示每一干的五行与阴阳</small></span></label><label class="tg164-layer"><input type="checkbox" data-tg164-layer="he"${TG.layers.he ? " checked" : ""}><span>五合连线<small>甲己、乙庚、丙辛、丁壬、戊癸</small></span></label><label class="tg164-layer"><input type="checkbox" data-tg164-layer="chong"${TG.layers.chong ? " checked" : ""}><span>四冲连线<small>甲庚、乙辛、丙壬、丁癸</small></span></label></div></aside><section class="tg164-main"><div class="tg164-viewbar"><button class="gbtn sm" id="tg164Select">选择</button><button class="gbtn sm" id="tg164Pan">平移</button><span class="hint">点击天干查看关系 · 滚轮缩放 · 平移模式拖动 · 切旬观察整体游移</span><button class="gbtn sm" id="tg164Fit">↙↗ 适应</button><button class="gbtn sm" id="tg164Zm">−</button><span id="tg164Zoom">100%</span><button class="gbtn sm" id="tg164Zp">＋</button></div><div class="tg164-frame" id="tg164Frame"><svg id="tg164Svg" viewBox="70 -6 520 760" role="img" aria-label="十天干掌游干盘"></svg></div><div class="panel tg164-board"><div class="tg164-board-head"><b>十干速查</b><small>点任一干与掌图同步</small></div><div class="tg164-strip" id="tg164Strip"></div></div><div class="panel tg164-board"><div class="tg164-board-head"><b>干支快速配对</b><small>检查某一干支是否属于六十甲子</small></div><div class="tg164-pair"><label>天干<select id="tg164PairG">${TG_GAN.map((n, i) => `<option value="${i}">${n}</option>`).join("")}</select></label><label>地支<select id="tg164PairZ">${TG_ZHI.map((n, i) => `<option value="${i}">${n}</option>`).join("")}</select></label><button class="gbtn sm" id="tg164PairCheck">校验</button></div><div class="tg164-pairout" id="tg164PairOut"></div></div><div class="panel tg164-board"><div class="tg164-board-head"><b>掌诀练习</b><small>掌位 / 五合 / 五行</small></div><div class="tg164-quiz" id="tg164Quiz"></div></div></section><aside class="panel tg164-info" id="tg164Info"></aside></div><div class="panel tg164-bottom"><b>口径说明：</b>本盘把“六甲旬首起甲、十干顺排、两支旬空”做成掌上可视化，用于训练干支定位与快速配对。天干五合采用甲己合土、乙庚合金、丙辛合水、丁壬合木、戊癸合火；四冲按本站既有关系表展示甲庚、乙辛、丙壬、丁癸。不同掌诀传承可能存在不同手势或记忆路径，本盘把算法口径显式写出，不将掌诀本身解释为现实事件因果。</div></div>`;
    tgBind();
    tgRender();
  }
  function tgBind() {
    const pane = $t("#pane-studio"),
      svg = $t("#tg164Svg"),
      frame = $t("#tg164Frame");
    if (!pane || !svg) return;
    $t("#tg164Back").onclick = () => {
      tgStop();
      plHub();
    };
    $t("#tg164Dizhi").onclick = () => {
      tgStop();
      if (typeof window.dzhOpen === "function") window.dzhOpen();
    };
    $t("#tg164Xun").onchange = (e) => {
      TG.xun = +e.target.value || 0;
      tgRender();
    };
    $t("#tg164Prev").onclick = () => {
      TG.xun = (TG.xun + 5) % 6;
      tgRender();
    };
    $t("#tg164Next").onclick = () => {
      TG.xun = (TG.xun + 1) % 6;
      tgRender();
    };
    $t("#tg164Play").onclick = tgPlay;
    $$t("[data-tg164-layer]").forEach(
      (c) =>
        (c.onchange = () => {
          TG.layers[c.dataset.tg164Layer] = c.checked ? 1 : 0;
          tgRender();
        }),
    );
    const mode = (m) => {
      TG.gesture = m;
      frame.classList.toggle("pan", m === "pan");
      $t("#tg164Select").classList.toggle("on", m === "select");
      $t("#tg164Pan").classList.toggle("on", m === "pan");
    };
    $t("#tg164Select").onclick = () => mode("select");
    $t("#tg164Pan").onclick = () => mode("pan");
    mode(TG.gesture);
    $t("#tg164Fit").onclick = tgFit;
    $t("#tg164Zm").onclick = () => {
      const r = svg.getBoundingClientRect();
      tgZoom(1.18, r.left + r.width / 2, r.top + r.height / 2);
    };
    $t("#tg164Zp").onclick = () => {
      const r = svg.getBoundingClientRect();
      tgZoom(0.84, r.left + r.width / 2, r.top + r.height / 2);
    };
    svg.addEventListener(
      "wheel",
      (e) => {
        e.preventDefault();
        tgZoom(e.deltaY < 0 ? 0.86 : 1.16, e.clientX, e.clientY);
      },
      { passive: false },
    );
    let drag = null;
    svg.addEventListener("pointerdown", (e) => {
      if (e.button > 0 || TG.gesture !== "pan") return;
      const r = svg.getBoundingClientRect();
      drag = {
        id: e.pointerId,
        x: e.clientX,
        y: e.clientY,
        v: { ...TG.view },
        rw: Math.max(1, r.width),
        rh: Math.max(1, r.height),
      };
      try {
        svg.setPointerCapture(e.pointerId);
      } catch (_) {}
      frame.classList.add("grab");
    });
    svg.addEventListener("pointermove", (e) => {
      if (!drag || e.pointerId !== drag.id) return;
      TG.view.x = drag.v.x - ((e.clientX - drag.x) * drag.v.w) / drag.rw;
      TG.view.y = drag.v.y - ((e.clientY - drag.y) * drag.v.h) / drag.rh;
      tgView();
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
    pane.addEventListener("click", (e) => {
      const n = e.target.closest && e.target.closest("[data-tg164-g]");
      if (n) {
        const g = +n.dataset.tg164G;
        if (TG.quiz.q) tgAnswer(g);
        TG.sel = g;
        tgRender();
        return;
      }
    });
    $t("#tg164PairCheck").onclick = tgPair;
    $t("#tg164PairG").onchange = tgPair;
    $t("#tg164PairZ").onchange = tgPair;
    $t("#tg164Fs").onclick = async () => {
      try {
        if (document.fullscreenElement) await document.exitFullscreen();
        else await $t("#tg164Shell").requestFullscreen();
      } catch (_) {
        try {
          toast("当前浏览器不允许全屏");
        } catch (__) {}
      }
    };
  }
  window.tg164Open = tgOpen;
  window.tg164Stop = tgStop;
  /* 盘库入口：正式完成原任务清单中的第 16 盘。 */
  const plHub_v164_tg = plHub;
  plHub = function () {
    try {
      tgStop();
    } catch (_) {}
    plHub_v164_tg();
    const pane = $t("#pane-studio");
    if (!pane) return;
    const cnt = pane.querySelector(".pl-count b");
    if (cnt) cnt.textContent = "16";
    const f = pane.querySelector(".pl-card.future");
    if (f)
      f.outerHTML = `<article class="panel pl-card" data-pl="tiangan-hand"><span class="num">16 · 掌诀</span><span class="enter">↗</span><h3>十天干掌 · 游干盘</h3><p>按六甲旬首把十天干游移到十二地支掌位，联动五合、四冲、五行生克、旬空与六十甲子干支配对训练。</p><div class="tags"><span>十天干</span><span>六甲旬首</span><span>干支配对</span></div></article>`;
    const c = pane.querySelector('[data-pl="tiangan-hand"]');
    if (c) c.onclick = () => tgOpen();
  };
  try {
    const oldClose = typeof plClose === "function" ? plClose : null;
    if (oldClose && !window.__TG164_CLOSE) {
      window.__TG164_CLOSE = 1;
      plClose = function () {
        tgStop();
        return oldClose.apply(this, arguments);
      };
    }
  } catch (_) {}
  try {
    const g = window.NAV_G && NAV_G.find((x) => x.g === "盘库");
    if (g && g.it && g.it[0]) {
      g.it[0][2] =
        "天机巨盘、罗经三盘、三式、全天星图、浑天仪、易学数理、择时养生、流年太岁、神煞流转、六十甲子太岁、十二地支掌、十天干掌等独立盘";
      g.it[0][3] += " 十天干掌 游干盘 天干五合 天干四冲 六甲旬首 旬空 干支配对";
    }
  } catch (_) {}
  try {
    const bv = document.getElementById("buildVersion");
  } catch (_) {}
})();
