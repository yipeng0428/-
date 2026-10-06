(() => {
  "use strict";
  const DZH_TS = "2026-10-04 01:53:42";
  const DZH_POS = [
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
  const DZH_XUN = [
    { n: "甲子旬", start: 0, xk: "戌亥" },
    { n: "甲戌旬", start: 10, xk: "申酉" },
    { n: "甲申旬", start: 8, xk: "午未" },
    { n: "甲午旬", start: 6, xk: "辰巳" },
    { n: "甲辰旬", start: 4, xk: "寅卯" },
    { n: "甲寅旬", start: 2, xk: "子丑" },
  ];
  const DZH = {
    sel: null,
    mode: "basic",
    xun: 0,
    gesture: "select",
    view: { x: 70, y: -6, w: 520, h: 760 },
    play: null,
    demo: -1,
    layers: { meta: 1, person: 1, chong: 1, he: 1, sanhe: 1, sanhui: 1, xhp: 0 },
    quiz: { on: 0, q: null, score: 0, total: 0, msg: "", ok: null },
  };
  function dzhNowZ() {
    try {
      const n = nowBJ();
      return ((n.h + 1) >> 1) % 12;
    } catch (_) {
      return ((new Date().getHours() + 1) >> 1) % 12;
    }
  }
  function dzhEsc(s) {
    try {
      return esc(String(s));
    } catch (_) {
      return String(s).replace(
        /[&<>\"]/g,
        (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '\"': "&quot;" })[m],
      );
    }
  }
  function dzhPoint(z) {
    return DZH_POS[((+z % 12) + 12) % 12];
  }
  function dzhPair(T, z) {
    const p = T.find((a) => a.includes(z));
    return p ? p.find((x) => x !== z) : null;
  }
  function dzhPersonMarks() {
    try {
      return typeof brMarks === "function" ? brMarks() : Array.from({ length: 12 }, () => []);
    } catch (_) {
      return Array.from({ length: 12 }, () => []);
    }
  }
  function dzhLiujiaMap() {
    const x = DZH_XUN[DZH.xun] || DZH_XUN[0],
      m = Array(12).fill(null);
    for (let i = 0; i < 10; i++) m[(x.start + i) % 12] = { stem: i, step: i };
    return m;
  }
  function dzhRoute() {
    let d = "";
    for (let i = 0; i < 12; i++) {
      const p = dzhPoint(i);
      d += (i ? "L" : "M") + p[0] + " " + p[1];
    }
    const p0 = dzhPoint(0);
    return d + "L" + p0[0] + " " + p0[1];
  }
  function dzhRouteDots() {
    let g = "";
    for (let i = 0; i < 12; i++) {
      const p = dzhPoint(i);
      g += `<circle class="dzh-route-dot" cx="${p[0]}" cy="${p[1]}" r="2.1"/>`;
    }
    return g;
  }
  function dzhAxisLabels() {
    const fingers = [
      [150, "食指"],
      [292, "中指"],
      [392, "无名指"],
      [492, "小指"],
    ];
    const rows = [
      [138, "指尖"],
      [236, "上节"],
      [338, "中节"],
      [448, "根部"],
    ];
    return `<g aria-hidden="true">${fingers.map(([x, n]) => `<text class="dzh-finger-label" x="${x}" y="78" text-anchor="middle">${n}</text>`).join("")}${rows.map(([y, n]) => `<text class="dzh-zone-label" x="102" y="${y + 4}" text-anchor="middle">${n}</text>`).join("")}</g>`;
  }
  function dzhHeadTag() {
    const z = DZH.sel == null ? dzhNowZ() : DZH.sel;
    return `<g aria-hidden="true"><rect class="dzh-titlebar" x="152" y="8" width="356" height="36" rx="18"/><text class="dzh-titletext" x="330" y="22" text-anchor="middle">左手十二地支掌 · 顺时针定位图</text><text class="dzh-subtext" x="330" y="35" text-anchor="middle">起点 子位（无名指根） → 终点 亥位（小指根） · 当前焦点：${ZHI[z]}</text></g>`;
  }
  function dzhLine(a, b, cls, label) {
    const A = dzhPoint(a),
      B = dzhPoint(b),
      mx = (A[0] + B[0]) / 2,
      my = (A[1] + B[1]) / 2;
    return `<line class="dzh-rel ${cls}" x1="${A[0]}" y1="${A[1]}" x2="${B[0]}" y2="${B[1]}"/>${label ? `<text class="dzh-rel-label" x="${mx}" y="${my - 5}">${label}</text>` : ""}`;
  }
  function dzhPoly(arr, cls, label) {
    const pts = arr.map((z) => dzhPoint(z).join(",")).join(" "),
      c = arr.reduce(
        (o, z) => {
          const p = dzhPoint(z);
          o[0] += p[0] / arr.length;
          o[1] += p[1] / arr.length;
          return o;
        },
        [0, 0],
      );
    return `<polygon class="dzh-rel ${cls}" points="${pts}"/>${label ? `<text class="dzh-rel-label" x="${c[0]}" y="${c[1]}">${label}</text>` : ""}`;
  }
  function dzhRelSvg() {
    const z = DZH.sel == null ? dzhNowZ() : DZH.sel;
    let g = "";
    if (DZH.layers.chong) g += dzhLine(z, (z + 6) % 12, "chong", "冲");
    if (DZH.layers.he) {
      const o = dzhPair(P5_HE6, z);
      if (o != null) g += dzhLine(z, o, "he", "合");
    }
    if (DZH.layers.sanhe) {
      const a = Z_SANHE.find((x) => x.slice(0, 3).includes(z));
      if (a) g += dzhPoly(a.slice(0, 3), "sanhe", a[3] + "局");
    }
    if (DZH.layers.sanhui) {
      const a = Z_SANHUI.find((x) => x.slice(0, 3).includes(z));
      if (a) g += dzhPoly(a.slice(0, 3), "sanhui", a[3] + "方");
    }
    if (DZH.layers.xhp) {
      const hai = dzhPair(P5_HAI, z),
        po = dzhPair(P5_PO, z);
      if (hai != null) g += dzhLine(z, hai, "xhp", "害");
      if (po != null) g += dzhLine(z, po, "xhp", "破");
      const rr = [];
      try {
        for (let i = 0; i < 12; i++) {
          if (i !== z && pplZhiRel(z, i).some((r) => r.t === "刑")) rr.push(i);
        }
      } catch (_) {}
      rr.slice(0, 3).forEach((i) => (g += dzhLine(z, i, "xhp", "刑")));
    }
    return g;
  }
  function dzhHandShape() {
    return `
  <g aria-hidden="true">
    <rect class="dzh-hand-panel" x="126" y="96" width="390" height="392" rx="40"/>
    <rect class="dzh-hand" x="132" y="124" width="84" height="352" rx="40"/>
    <rect class="dzh-hand" x="248" y="78" width="88" height="398" rx="42"/>
    <rect class="dzh-hand" x="382" y="124" width="84" height="352" rx="40"/>
    <rect class="dzh-hand" x="466" y="208" width="68" height="268" rx="34"/>
    <path class="dzh-hand" d="M122 402 Q118 368 156 368 H496 Q536 368 546 406 Q560 400 576 414 Q597 432 589 462 Q579 491 552 506 L530 520 V644 Q530 706 460 724 H224 Q146 718 126 646 Z"/>
    <path class="dzh-crease" d="M144 448H208M144 340H208M144 234H208M270 448H328M402 448H458M482 438H528M482 340H528M482 242H528"/>
    <path class="dzh-crease" d="M176 510Q334 542 500 510M170 580Q334 614 508 580M188 650Q338 680 494 650" opacity=".55"/>
    ${dzhAxisLabels()}
    <text x="330" y="690" text-anchor="middle" class="dzh-meta">左手 · 掌心向己 · 大拇指在右侧</text>
  </g>`;
  }
  function dzhMetaText(z) {
    const p = dzhPoint(z);
    let x = p[0],
      y = p[1],
      a = "middle",
      cls = "dzh-meta";
    if (z >= 2 && z <= 5) {
      x -= 72;
      y -= 4;
      a = "end";
    } else if (z >= 8 && z <= 11) {
      x += 72;
      y -= 4;
      a = "start";
    } else if (z === 6 || z === 7) {
      y += 56;
      cls = "dzh-meta-strong";
    } else {
      y += 58;
      cls = "dzh-meta-strong";
    }
    return `<text class="${cls}" x="${x}" y="${y}" text-anchor="${a}"><tspan x="${x}" dy="0">${BR_YUEJIAN[z]}</tspan><tspan x="${x}" dy="11">${BR_HOUR[z]}</tspan></text>`;
  }
  function dzhShortMark(t) {
    t = String(t || "");
    if (/^年/.test(t)) return "年";
    if (/^月/.test(t)) return "月";
    if (/^日/.test(t)) return "日";
    if (/^时/.test(t)) return "时";
    if (/^命/.test(t)) return "命";
    if (/^身/.test(t)) return "身";
    if (/^神/.test(t)) return "神";
    return t.slice(0, 1) || "•";
  }
  function dzhPersonBadges(p, arr) {
    const ms = (arr || []).slice(0, 4).map(dzhShortMark),
      pts = [
        [-33, -16],
        [33, -16],
        [33, 16],
        [-33, 16],
      ];
    let g = "";
    ms.forEach((m, i) => {
      const o = pts[i] || pts[0];
      const x = p[0] + o[0],
        y = p[1] + o[1];
      g += `<circle class="dzh-markdot" cx="${x}" cy="${y}" r="9"/><text class="dzh-marktxt" x="${x}" y="${y + 3}">${dzhEsc(m)}</text>`;
    });
    return g;
  }
  function dzhNode(z, map, marks) {
    const p = dzhPoint(z),
      sel = DZH.sel === z,
      now = dzhNowZ() === z,
      person = marks[z] && marks[z].length,
      demo = DZH.demo === z,
      li = DZH.mode === "liujia" ? map[z] : null,
      wx = ZHI_WX[z],
      ord = z + 1;
    let badges = "";
    if (DZH.layers.person && person) badges = dzhPersonBadges(p, marks[z]);
    let lm = "";
    if (DZH.mode === "liujia") {
      if (li) lm = `<text class="stem" x="${p[0]}" y="${p[1] - 43}">${GAN[li.stem]}</text>`;
      else lm = `<text class="kong" x="${p[0]}" y="${p[1] - 43}">空</text>`;
    }
    const ox = p[0] - 22,
      oy = p[1] - 22;
    return `<g class="dzh-node dzh-wx${wx}${sel ? " selected" : ""}${now ? " now" : ""}${person ? " person" : ""}${demo ? " demo" : ""}" data-dzh-z="${z}" role="button" aria-label="${ZHI[z]} ${P5_SHENG[z]}"><circle class="halo" cx="${p[0]}" cy="${p[1]}" r="28"/><circle class="core" cx="${p[0]}" cy="${p[1]}" r="19"/><circle class="order-ring" cx="${ox}" cy="${oy}" r="8"/><text class="order-txt" x="${ox}" y="${oy + 3}">${ord}</text><text class="zhi" x="${p[0]}" y="${p[1] - 4}">${ZHI[z]}</text><text class="zod" x="${p[0]}" y="${p[1] + 18}">${P5_SHENG[z]}</text>${lm}${badges}</g>${DZH.layers.meta ? dzhMetaText(z) : ""}`;
  }
  function dzhSvg() {
    const map = dzhLiujiaMap(),
      marks = dzhPersonMarks();
    let g = `<defs><filter id="dzhGlow"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>${dzhHeadTag()}${dzhHandShape()}<path class="dzh-route" d="${dzhRoute()}"/>${dzhRouteDots()}${dzhRelSvg()}`;
    for (let z = 0; z < 12; z++) g += dzhNode(z, map, marks);
    const cur = dzhNowZ(),
      pc = dzhPoint(cur);
    g += `<text x="${pc[0]}" y="${pc[1] - 56}" text-anchor="middle" class="dzh-rel-label" style="fill:var(--red)">此刻</text>`;
    if (DZH.mode === "liujia") {
      const x = DZH_XUN[DZH.xun],
        p = dzhPoint(x.start);
      g += `<text x="330" y="56" text-anchor="middle" class="dzh-meta" style="font-size:10px;fill:var(--gold2)">${x.n} · 从${ZHI[x.start]}位起甲，顺排十干 · 旬空 ${x.xk}</text><line x1="330" y1="62" x2="${p[0]}" y2="${p[1] - 54}" class="dzh-rel sanhui"/>`;
    }
    return g;
  }
  function dzhXing(z) {
    const a = [];
    try {
      Z_XING3.forEach((g) => {
        if (g.slice(0, 3).includes(z))
          a.push(
            g
              .slice(0, 3)
              .map((i) => ZHI[i])
              .join("") +
              " · " +
              g[3],
          );
      });
      Z_XING2.forEach((g) => {
        if (g.slice(0, 2).includes(z))
          a.push(
            g
              .slice(0, 2)
              .map((i) => ZHI[i])
              .join("") +
              " · " +
              g[2],
          );
      });
      if (Z_ZIXING.includes(z)) a.push(ZHI[z] + "自刑");
    } catch (_) {}
    return a.join("；") || "—";
  }
  function dzhInfo(z) {
    z = z == null ? dzhNowZ() : z;
    const wx = "木火土金水"[ZHI_WX[z]],
      yy = z % 2 === 0 ? "阳" : "阴",
      he = dzhPair(P5_HE6, z),
      hai = dzhPair(P5_HAI, z),
      po = dzhPair(P5_PO, z),
      san = Z_SANHE.find((g) => g.slice(0, 3).includes(z)),
      hui = Z_SANHUI.find((g) => g.slice(0, 3).includes(z));
    let dir = "—",
      shan = "—";
    try {
      const d = p5Dir8(z * 30),
        m = P5_N24.find((x) => x.n === ZHI[z]);
      dir = d ? `${d[0]} · ${d[1]}卦` : "—";
      shan = m ? `${m.n}山 ${m.c}° · ${m.yuan} · ${m.yy ? "阳" : "阴"}` : "—";
    } catch (_) {}
    const cang = (CANG[z] || []).map((i) => GAN[i]).join("、") || "—",
      map = dzhLiujiaMap(),
      li = DZH.mode === "liujia" ? map[z] : null,
      x = DZH_XUN[DZH.xun];
    const marks = dzhPersonMarks()[z] || [],
      relPerson = marks.length
        ? `当前人物四柱落在此位：${marks.join("、")}`
        : "当前人物四柱未落在此位";
    return `<h4>${ZHI[z]} · ${P5_SHENG[z]}</h4><div class="dzh-hero"><div class="dzh-kpi"><small>五行 · 阴阳</small><b>${wx} · ${yy}</b></div><div class="dzh-kpi"><small>月建 · 时辰</small><b>${BR_YUEJIAN[z]}</b><small>${ZHI[z]}时 ${BR_HOUR[z]}</small></div><div class="dzh-kpi"><small>六合 / 六冲</small><b>${he != null ? ZHI[he] : "—"} / ${ZHI[(z + 6) % 12]}</b></div><div class="dzh-kpi"><small>藏干</small><b>${cang}</b></div></div>
  <div class="dzh-facts"><span>掌上位置</span><b>${dzhHandPosText(z)}</b><span>方位</span><b>${dir}</b><span>24山</span><b>${shan}</b><span>三合</span><b>${
    san
      ? san
          .slice(0, 3)
          .map((i) => ZHI[i])
          .join("") +
        " · " +
        san[3] +
        "局"
      : "—"
  }</b><span>三会</span><b>${
    hui
      ? hui
          .slice(0, 3)
          .map((i) => ZHI[i])
          .join("") +
        " · " +
        hui[3] +
        "方"
      : "—"
  }</b><span>刑</span><b>${dzhXing(z)}</b><span>害 / 破</span><b>${hai != null ? ZHI[hai] : "—"} / ${po != null ? ZHI[po] : "—"}</b><span>月将 / 辟卦</span><b>${BR_YUEJIANG[z]} / ${BR_BIGUA[z]}卦</b><span>星次 / 经络</span><b>${BR_XINGCI[z]} / ${brMeridian(z)}</b>${DZH.mode === "liujia" ? `<span>${x.n}</span><b>${li ? GAN[li.stem] + "临" + ZHI[z] : "旬空 " + ZHI[z]}</b>` : ""}</div>
  <div class="dzh-card"><b>当前人物</b><br>${dzhEsc(relPerson)}${dzhNowZ() === z ? "；此位同时是当前真实时辰。" : ""}</div>
  <div class="dzh-card"><b>读掌提示</b><br>从无名指根部“子”起，向中指根、食指根后沿食指上行，再越过四指尖，最后沿小指下行至“亥”，构成十二支顺时针掌上环。</div>
  <div class="dzh-links"><button class="gbtn sm" data-dzhlink="focus">设为全站地支焦点</button><button class="gbtn sm" data-dzhlink="bridge">地支枢纽</button><button class="gbtn sm" data-dzhlink="bazi">八字详盘</button><button class="gbtn sm" data-dzhlink="now">此刻</button></div>`;
  }
  function dzhHandPosText(z) {
    return (
      [
        "无名指根部横纹（起点）",
        "中指根部横纹",
        "食指根部横纹",
        "食指下节横纹",
        "食指上节横纹",
        "食指尖",
        "中指尖",
        "无名指尖",
        "小指尖",
        "小指上节横纹",
        "小指下节横纹",
        "小指根部横纹（终点）",
      ][z] || "—"
    );
  }
  function dzhView() {
    const s = document.getElementById("dzhSvg");
    if (s) s.setAttribute("viewBox", `${DZH.view.x} ${DZH.view.y} ${DZH.view.w} ${DZH.view.h}`);
    const z = document.getElementById("dzhZoom");
    if (z) z.textContent = Math.round((760 / DZH.view.w) * 100) + "%";
  }
  function dzhFit() {
    DZH.view = { x: 70, y: -6, w: 520, h: 760 };
    dzhView();
  }
  function dzhZoomAt(k, cx, cy) {
    const s = document.getElementById("dzhSvg");
    if (!s) return;
    const r = s.getBoundingClientRect(),
      V = DZH.view,
      nw = Math.max(300, Math.min(980, V.w * k)),
      nh = nw * (V.h / V.w),
      fx = (cx - r.left) / Math.max(1, r.width),
      fy = (cy - r.top) / Math.max(1, r.height);
    DZH.view = { x: V.x + (V.w - nw) * fx, y: V.y + (V.h - nh) * fy, w: nw, h: nh };
    dzhView();
  }
  function dzhStrip() {
    const w = document.getElementById("dzhStrip");
    if (!w) return;
    const now = dzhNowZ();
    w.innerHTML = ZHI.map(
      (n, z) =>
        `<button class="dzh-chip${DZH.sel === z ? " on" : ""}${now === z ? " now" : ""}" data-dzh-z="${z}"><b>${n}</b><span>${P5_SHENG[z]} · ${"木火土金水"[ZHI_WX[z]]}</span><small>${BR_HOUR[z]} · ${BR_YUEJIAN[z]}</small></button>`,
    ).join("");
  }
  function dzhQuizNew() {
    const typ = Math.floor(Math.random() * 4),
      z = Math.floor(Math.random() * 12);
    let ans = z,
      txt = "";
    if (typ === 0) txt = `请点出「${ZHI[z]}」在左手掌上的位置`;
    else if (typ === 1) txt = `${BR_HOUR[z]} 对应哪一个地支？`;
    else if (typ === 2) {
      ans = (z + 6) % 12;
      txt = `「${ZHI[z]}」的六冲是哪一支？`;
    } else {
      ans = dzhPair(P5_HE6, z);
      txt = `「${ZHI[z]}」的六合是哪一支？`;
    }
    DZH.quiz.q = { txt, ans };
    DZH.quiz.msg = "";
    DZH.quiz.ok = null;
    DZH.quiz.on = 1;
  }
  function dzhQuizAnswer(z) {
    if (!DZH.quiz.on || !DZH.quiz.q) return;
    DZH.quiz.total++;
    const ok = z === DZH.quiz.q.ans;
    DZH.quiz.ok = ok;
    if (ok) {
      DZH.quiz.score++;
      DZH.quiz.msg = "答对了。点“下一题”继续。";
    } else DZH.quiz.msg = `不对，再找一次；当前答案是「${ZHI[z]}」。`;
    dzhQuizRender();
  }
  function dzhQuizRender() {
    const w = document.getElementById("dzhQuiz");
    if (!w) return;
    const Q = DZH.quiz;
    if (!Q.on || !Q.q) {
      w.innerHTML = `<div class="dzh-q"><small>掌诀练习</small><b>随机练习定位、时辰、六冲与六合</b><em>点“开始练习”，然后直接在手掌上作答。</em></div><div><button class="gbtn sm" id="dzhQuizStart">开始练习</button></div>`;
      const b = document.getElementById("dzhQuizStart");
      if (b)
        b.onclick = () => {
          dzhQuizNew();
          dzhQuizRender();
        };
      return;
    }
    w.innerHTML = `<div class="dzh-q"><small>当前题目</small><b>${dzhEsc(Q.q.txt)}</b><em class="${Q.ok == null ? "" : Q.ok ? "ok" : "bad"}">${dzhEsc(Q.msg || "请直接点击掌上的地支作答。")}</em></div><div class="dzh-score"><small>答对 / 作答</small><b>${Q.score} / ${Q.total}</b><button class="gbtn sm" id="dzhQuizNext">下一题</button></div>`;
    document.getElementById("dzhQuizNext").onclick = () => {
      dzhQuizNew();
      dzhQuizRender();
    };
  }
  function dzhRender() {
    const s = document.getElementById("dzhSvg");
    if (!s) return;
    s.innerHTML = dzhSvg();
    dzhView();
    const info = document.getElementById("dzhInfo");
    if (info) info.innerHTML = dzhInfo(DZH.sel == null ? dzhNowZ() : DZH.sel);
    dzhStrip();
    dzhQuizRender();
    document
      .querySelectorAll("[data-dzhl]")
      .forEach((c) => (c.checked = !!DZH.layers[c.dataset.dzhl]));
    const m = document.getElementById("dzhMode");
    if (m) m.value = DZH.mode;
    const x = document.getElementById("dzhXun");
    if (x) x.value = String(DZH.xun);
    const p = document.getElementById("dzhPlay");
    if (p) p.textContent = DZH.play ? "■ 停止排干演示" : "▶ 六甲排干演示";
  }
  function dzhStop() {
    if (DZH.play) {
      clearInterval(DZH.play);
      DZH.play = null;
    }
    DZH.demo = -1;
  }
  function dzhPlay() {
    if (DZH.play) {
      dzhStop();
      dzhRender();
      return;
    }
    DZH.mode = "liujia";
    DZH.demo = -1;
    let k = -1;
    DZH.play = setInterval(() => {
      k++;
      if (k >= 12) {
        dzhStop();
        dzhRender();
        return;
      }
      DZH.demo = (DZH_XUN[DZH.xun].start + k) % 12;
      DZH.sel = DZH.demo;
      dzhRender();
    }, 620);
    dzhRender();
  }
  function dzhOpen() {
    const pane = document.getElementById("pane-studio");
    if (!pane) return;
    try {
      if (STU && STU.active && typeof studioLeave === "function") studioLeave();
    } catch (_) {}
    [
      "jtsStop",
      "hhdStop",
      "jc12Stop",
      "tspStop",
      "lgbStop",
      "zlfStop",
      "msgStop",
      "htdStop",
      "xapStop",
      "typStop",
      "qtpStop",
      "lrpStop",
    ].forEach((n) => {
      try {
        if (typeof window[n] === "function") window[n]();
      } catch (_) {}
    });
    dzhStop();
    PANLIB.mode = "dizhi-hand";
    document.body.classList.add("studio-mode");
    delete pane.dataset.ui;
    pane.dataset.built = "1";
    if (DZH.sel == null) DZH.sel = dzhNowZ();
    pane.innerHTML = `<div class="dzh-shell" id="dzhShell"><div class="dzh-top"><button class="gbtn sm" id="dzhBack">← 盘库</button><div class="dzh-title"><b>十二地支掌 · 掌诀盘</b><small>标题上移留白 · 手指名称就位 · 更大掌图 · 月时生肖五行 · 刑冲会合</small></div><button class="gbtn sm" id="dzhBridge">地支枢纽</button><button class="gbtn sm" id="dzhFs">全屏</button></div>
  <div class="dzh-grid"><aside class="panel dzh-side"><h4>掌诀模式</h4><div class="dzh-group"><label>显示方式<select id="dzhMode"><option value="basic">基础地支掌</option><option value="liujia">六甲排干</option></select></label><label style="margin-top:7px">六甲旬首<select id="dzhXun">${DZH_XUN.map((x, i) => `<option value="${i}">${x.n} · 旬空${x.xk}</option>`).join("")}</select></label><button class="gbtn sm" id="dzhPlay" style="width:100%;margin-top:7px">▶ 六甲排干演示</button></div>
  <div class="dzh-group"><h4>关系层</h4><label class="dzh-layer"><input type="checkbox" data-dzhl="chong"><span>六冲<small>子午、丑未、寅申、卯酉、辰戌、巳亥</small></span></label><label class="dzh-layer"><input type="checkbox" data-dzhl="he"><span>六合<small>子丑、寅亥、卯戌、辰酉、巳申、午未</small></span></label><label class="dzh-layer"><input type="checkbox" data-dzhl="sanhe"><span>三合<small>申子辰、寅午戌、巳酉丑、亥卯未</small></span></label><label class="dzh-layer"><input type="checkbox" data-dzhl="sanhui"><span>三会<small>寅卯辰、巳午未、申酉戌、亥子丑</small></span></label><label class="dzh-layer"><input type="checkbox" data-dzhl="xhp"><span>刑 · 害 · 破<small>选中某支时显示相关支</small></span></label></div>
  <div class="dzh-group"><h4>辅助标记</h4><label class="dzh-layer"><input type="checkbox" data-dzhl="meta"><span>月建 / 时辰<small>掌位旁显示传统月建与两小时区间</small></span></label><label class="dzh-layer"><input type="checkbox" data-dzhl="person"><span>当前人物四柱<small>把年、月、日、时支落点叠到掌上</small></span></label></div></aside>
  <section class="dzh-main"><div class="dzh-viewbar"><button class="gbtn sm" id="dzhSelect">选择地支</button><button class="gbtn sm" id="dzhPan">查看平移</button><span class="hint">点掌位选择 · 先看顺序 1→12，再看手指上方名称与左右月建/时辰 · 红框=当前时辰</span><button class="gbtn sm" id="dzhFit">适应</button><button class="gbtn sm" id="dzhZm">−</button><span id="dzhZoom">100%</span><button class="gbtn sm" id="dzhZp">＋</button></div><div class="dzh-frame" id="dzhFrame"><svg id="dzhSvg" viewBox="70 20 460 600" role="img" aria-label="十二地支掌诀图"></svg></div><div class="dzh-legend"><span><i class="c"></i>六冲</span><span><i class="h"></i>六合</span><span><i class="s"></i>三合</span><span><i class="v"></i>三会</span><span>红框=当前时辰 · 金框=当前选中</span></div>
  <div class="panel dzh-board"><div class="dzh-board-head"><b>十二地支速查</b><small>点任一格与掌图同步</small></div><div class="dzh-strip" id="dzhStrip"></div></div><div class="panel dzh-board"><div class="dzh-board-head"><b>掐指练习</b><small>训练掌位、时辰与基本关系</small></div><div class="dzh-quiz" id="dzhQuiz"></div></div><details class="panel dzh-guide" open><summary>四步读懂十二地支掌</summary><div class="dzh-guide-grid"><div><b>① 从子位起</b><span>先记住起点：无名指根部横纹是“子”，掌图上也标了顺序 1。</span></div><div><b>② 顺时针走一圈</b><span>顺着虚线路线走：子→丑→寅，沿食指上行到巳，再跨指尖转向小指一路下行到亥。</span></div><div><b>③ 用关系记空间</b><span>先用红线看对冲，再用蓝虚线看三合、金虚线看三会，空间关系会更容易记。</span></div><div><b>④ 六甲游干</b><span>切到“六甲排干”后，看旬首从哪一支起甲，顺排十干，剩余两支就是旬空。</span></div></div></details></section><aside class="panel dzh-info" id="dzhInfo"></aside></div>
  <div class="panel dzh-bottom"><b>口径说明：</b>本盘采用常见左手十二地支掌诀：子在无名指根、丑在中指根、寅在食指根，沿食指上行为卯辰巳，四指尖依次巳午未申，再沿小指下行为酉戌亥。六冲、六合、三合、三会、刑害破与本站“地支枢纽/犯太岁”共用同一套关系表。“六甲排干”用于展示传统掌上快速排干思路；掌诀是记忆与推算坐标工具，不代表现实事件的因果判断。</div></div>`;
    dzhBind();
    dzhRender();
  }
  function dzhBind() {
    const pane = document.getElementById("pane-studio"),
      svg = document.getElementById("dzhSvg"),
      frame = document.getElementById("dzhFrame");
    if (!pane || !svg) return;
    document.getElementById("dzhBack").onclick = () => {
      dzhStop();
      plHub();
    };
    document.getElementById("dzhBridge").onclick = () => {
      dzhStop();
      selectTab("bridge", true);
    };
    document.getElementById("dzhMode").onchange = (e) => {
      DZH.mode = e.target.value;
      dzhRender();
    };
    document.getElementById("dzhXun").onchange = (e) => {
      DZH.xun = +e.target.value || 0;
      DZH.demo = -1;
      dzhRender();
    };
    document.getElementById("dzhPlay").onclick = dzhPlay;
    pane.querySelectorAll("[data-dzhl]").forEach(
      (c) =>
        (c.onchange = () => {
          DZH.layers[c.dataset.dzhl] = c.checked ? 1 : 0;
          dzhRender();
        }),
    );
    const mode = (m) => {
      DZH.gesture = m;
      frame.classList.toggle("pan", m === "pan");
      document.getElementById("dzhSelect").classList.toggle("on", m === "select");
      document.getElementById("dzhPan").classList.toggle("on", m === "pan");
    };
    document.getElementById("dzhSelect").onclick = () => mode("select");
    document.getElementById("dzhPan").onclick = () => mode("pan");
    mode(DZH.gesture);
    document.getElementById("dzhFit").onclick = dzhFit;
    document.getElementById("dzhZm").onclick = () => {
      const r = svg.getBoundingClientRect();
      dzhZoomAt(1.18, r.left + r.width / 2, r.top + r.height / 2);
    };
    document.getElementById("dzhZp").onclick = () => {
      const r = svg.getBoundingClientRect();
      dzhZoomAt(0.84, r.left + r.width / 2, r.top + r.height / 2);
    };
    svg.addEventListener(
      "wheel",
      (e) => {
        e.preventDefault();
        dzhZoomAt(e.deltaY < 0 ? 0.86 : 1.16, e.clientX, e.clientY);
      },
      { passive: false },
    );
    let drag = null;
    svg.addEventListener("pointerdown", (e) => {
      if (e.button > 0 || DZH.gesture !== "pan") return;
      drag = {
        id: e.pointerId,
        x: e.clientX,
        y: e.clientY,
        v: { ...DZH.view },
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
      DZH.view.x = drag.v.x - ((e.clientX - drag.x) * drag.v.w) / drag.rw;
      DZH.view.y = drag.v.y - ((e.clientY - drag.y) * drag.v.h) / drag.rh;
      dzhView();
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
      const n = e.target.closest("[data-dzh-z]");
      if (n) {
        const z = +n.dataset.dzhZ;
        if (DZH.quiz.on) dzhQuizAnswer(z);
        DZH.sel = z;
        dzhRender();
        return;
      }
      const l = e.target.closest("[data-dzhlink]");
      if (!l) return;
      const k = l.dataset.dzhlink;
      if (k === "focus") {
        try {
          fxSet("zhi", DZH.sel == null ? dzhNowZ() : DZH.sel, "十二地支掌", {
            x: e.clientX,
            y: e.clientY,
          });
          toast("已设为全站地支联动焦点");
        } catch (_) {}
        return;
      }
      dzhStop();
      selectTab(k, true);
    });
    document.getElementById("dzhFs").onclick = async () => {
      try {
        if (document.fullscreenElement) await document.exitFullscreen();
        else await document.getElementById("dzhShell").requestFullscreen();
      } catch (_) {
        toast("当前浏览器不允许全屏");
      }
    };
  }
  window.dzhOpen = dzhOpen;
  window.dzhStop = dzhStop;

  const _plHub71 = plHub;
  plHub = function () {
    dzhStop();
    _plHub71();
    const pane = document.getElementById("pane-studio");
    if (!pane) return;
    const cnt = pane.querySelector(".pl-count b");
    if (cnt) cnt.textContent = "15";
    const f = pane.querySelector(".pl-card.future");
    if (f)
      f.outerHTML = `<article class="panel pl-card" data-pl="dizhi-hand"><span class="num">15 · 掌诀</span><span class="enter">↗</span><h3>十二地支掌 · 掌诀盘</h3><p>把十二地支固定到左手十二掌位，叠加月份、时辰、五行生肖、刑冲会合、当前人物四柱，并提供六甲排干与掐指练习。</p><div class="tags"><span>十二地支掌</span><span>六甲排干</span><span>掐指练习</span></div></article><article class="panel pl-card future"><span class="num">NEXT · 掌诀</span><span class="enter">待建</span><h3>十天干掌 · 游干盘</h3><p>下一盘继续掌诀系列，研究十天干在掌上的游移、五合五冲、生克、六甲旬首与干支快速配对。</p><div class="tags"><span>十天干</span><span>掌上游干</span><span>干支配对</span></div></article>`;
    const c = pane.querySelector('[data-pl="dizhi-hand"]');
    if (c) c.onclick = () => dzhOpen();
  };
  try {
    const g = NAV_G.find((x) => x.g === "盘库");
    if (g && g.it && g.it[0]) {
      g.it[0][2] =
        "天机巨盘、罗经三盘、三式、全天星图、浑天仪、易学数理、择时养生、流年太岁、神煞流转、六十甲子太岁、十二地支掌及后续独立盘";
      g.it[0][3] +=
        " 十二地支掌 地支掌诀 掐指 子丑寅卯辰巳午未申酉戌亥 六冲 六合 三合 三会 六甲排干 掌上起局";
    }
  } catch (_) {}
  try {
    const oldClose = typeof plClose === "function" ? plClose : null;
    if (oldClose && !window.__DZH_CLOSE_WRAP) {
      window.__DZH_CLOSE_WRAP = 1;
      plClose = function () {
        dzhStop();
        return oldClose.apply(this, arguments);
      };
    }
  } catch (_) {}
  try {
    const bv = document.getElementById("buildVersion");
  } catch (_) {}
})();
