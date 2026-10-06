(() => {
  const TS = "2026-10-04 03:30:18";
  const q = (s, r = document) => r.querySelector(s),
    qa = (s, r = document) => Array.from(r.querySelectorAll(s));
  const WXN = ["木", "火", "土", "金", "水"];
  const WXCOL = ["#58aa7c", "#dd6752", "#c99d4e", "#d9d7cf", "#6095cb"];
  const JCOL = [
    "#68b78c",
    "#68b78c",
    "#d8d6ce",
    "#d8d6ce",
    "#c9a24d",
    "#c9a24d",
    "#d9634f",
    "#d9634f",
    "#5b91c8",
    "#5b91c8",
    "#cf6d52",
    "#cf6d52",
  ];
  const S = (window.BD84 = window.BD84 || {
    yaw: -0.3,
    pitch: 0.12,
    dist: 720,
    minDist: 360,
    focal: 690,
    tx: 0,
    ty: 0,
    tz: 0,
    cv: null,
    ctx: null,
    cw: 0,
    ch: 0,
    dpr: 1,
    raf: 0,
    ro: null,
    auto: 0,
    last: 0,
    selHit: null,
    layer: {
      body: { on: 1, op: 0.92 },
      qijing: { on: 1, op: 0.78 },
      jing12: { on: 1, op: 0.55 },
      organs: { on: 1, op: 0.78 },
      sanjiao: { on: 1, op: 0.72 },
      current: { on: 1, op: 1 },
      fate: { on: 1, op: 0.9 },
    },
  });

  function currentIdx() {
    return JL.sel == null ? JL.now : JL.sel;
  }
  function fateData() {
    if (!window.R || !R.bz) return null;
    try {
      const st = strength(R.bz),
        xy = xiyong(R.bz, st),
        c = wxContrib(R.bz),
        sum = c.tot.reduce((a, b) => a + b, 0) || 1,
        pct = c.tot.map((x) => x / sum);
      return {
        st,
        xy,
        pct,
        dm: GAN_WX[R.bz.dm],
        strong: pct.indexOf(Math.max(...pct)),
        weak: pct.indexOf(Math.min(...pct)),
      };
    } catch (_) {
      return null;
    }
  }
  function selInfo() {
    if (!BD.sel)
      return {
        t: "空间人体",
        p: "拖动人物查看正面、侧面和背面。点击图中的脏腑热点，或在下方二维图选择经络/脏腑，三维图会同步。",
      };
    const a = BD_QJ.find((x) => x.k === BD.sel);
    if (a) return { t: a.n, p: a.plain };
    const o = BD_ZF.find((x) => x.k === BD.sel);
    if (o) return { t: o.n + " · " + o.wx, p: o.zhu + "；" + o.jl };
    const s = BD_SJ.find((x) => x.k === BD.sel) || BD_DT.find((x) => x.k === BD.sel);
    if (s) return { t: s.n, p: s.txt };
    return { t: "当前选择", p: BD.sel };
  }
  function sideInfo() {
    const F = fateData(),
      m = JL_MER[currentIdx()],
      I = selInfo(),
      fav = F ? F.xy.favor.map((i) => WXN[i]).join("、") || "—" : "—",
      av = F ? F.xy.avoid.map((i) => WXN[i]).join("、") || "—" : "—";
    return `<div class="bd84-info"><h5>${I.t}</h5><p>${I.p}</p></div><div class="bd84-info"><h5>当前子午流注</h5><div class="bd84-map"><span>时辰</span><b>${m.z}时 · ${m.h}</b><span>经络</span><b>${m.n}</b><span>属性</span><b>${m.yy} · ${m.wx}</b></div></div><div class="bd84-info"><h5>命主五行</h5><div class="bd84-map"><span>日主</span><b>${F ? GAN[R.bz.dm] + WXN[F.dm] : "—"}</b><span>喜用</span><b>${fav}</b><span>忌</span><b>${av}</b><span>最强</span><b>${F ? WXN[F.strong] + " " + (F.pct[F.strong] * 100).toFixed(0) + "%" : "—"}</b><span>最弱</span><b>${F ? WXN[F.weak] + " " + (F.pct[F.weak] * 100).toFixed(0) + "%" : "—"}</b></div></div>`;
  }
  function layerRows() {
    const a = [
      ["body", "人体模型"],
      ["qijing", "奇经八脉"],
      ["jing12", "十二正经"],
      ["organs", "五脏六腑"],
      ["sanjiao", "三焦 · 丹田"],
      ["current", "当前子午流注"],
      ["fate", "命主五行"],
    ];
    return a
      .map(
        ([k, n]) =>
          `<div class="bd84-layer"><label><input type="checkbox" data-bd84-on="${k}"${S.layer[k].on ? " checked" : ""}><b>${n}</b></label><div class="row"><input type="range" min=".08" max="1" step=".02" value="${S.layer[k].op}" data-bd84-op="${k}"><button class="bd84-mini" data-bd84-solo="${k}">独看</button></div></div>`,
      )
      .join("");
  }
  function html() {
    return `<div class="bd84-shell"><div class="bd84-toolbar"><div class="views"><button class="gbtn sm" data-bd84-view="front">正面</button><button class="gbtn sm" data-bd84-view="left">左侧</button><button class="gbtn sm" data-bd84-view="back">背面</button><button class="gbtn sm" data-bd84-view="right">右侧</button><button class="gbtn sm" data-bd84-view="reset">复位</button></div><span class="spacer"></span><label><input type="checkbox" id="bd84Auto"${S.auto ? " checked" : ""}> 自动环视</label><button class="gbtn sm" id="bd84Fs">放大</button></div>
   <div class="bd84-grid"><aside class="bd84-side"><h4>空间图层</h4>${layerRows()}<div class="bd84-presets"><button class="gbtn sm" data-bd84-pre="all">全部</button><button class="gbtn sm" data-bd84-pre="mer">经络</button><button class="gbtn sm" data-bd84-pre="org">脏腑</button><button class="gbtn sm" data-bd84-pre="now">当前</button></div></aside>
   <div class="bd84-stage" id="bd84Stage"><canvas id="bd84Cv"></canvas><span class="bd84-badge">INTERNAL 3D · 与太阳系同类空间投影</span><span class="bd84-viewread" id="bd84ViewRead">正面</span><div class="bd84-hint"><b>拖动</b> 环绕 · <b>滚轮</b> 推进/拉远 · <b>Shift/右键拖动</b> 平移 · <b>双击</b> 复位</div></div>
   <aside class="bd84-right" id="bd84Right">${sideInfo()}</aside></div></div>`;
  }
  window.bd3dHTML = html;

  function proj(x, y, z) {
    x -= S.tx;
    y -= S.ty;
    z -= S.tz;
    const cy = Math.cos(S.yaw),
      sy = Math.sin(S.yaw),
      x1 = x * cy - y * sy,
      y1 = x * sy + y * cy,
      z1 = z;
    const cp = Math.cos(S.pitch),
      sp = Math.sin(S.pitch),
      y2 = y1 * cp - z1 * sp,
      z2 = y1 * sp + z1 * cp;
    let depth = S.dist + y2;
    if (depth < 80) depth = 80;
    const sc = S.focal / depth;
    return { x: S.cw / 2 + x1 * sc, y: S.ch / 2 - z2 * sc, s: sc, d: depth };
  }
  function path3(pts, col, lw = 2, alpha = 1, dash = null) {
    const c = S.ctx;
    if (!c || pts.length < 2) return;
    c.save();
    c.strokeStyle = col;
    c.globalAlpha = alpha;
    c.lineWidth = lw;
    c.lineJoin = "round";
    c.lineCap = "round";
    if (dash) c.setLineDash(dash);
    c.beginPath();
    pts.forEach((p, i) => {
      const v = proj(...p);
      i ? c.lineTo(v.x, v.y) : c.moveTo(v.x, v.y);
    });
    c.stroke();
    c.restore();
  }
  function ellipse3(pos, rx, rz, col, alpha = 0.8, outline = "rgba(255,255,255,.16)") {
    const c = S.ctx,
      p = proj(...pos),
      sx = Math.max(1, rx * p.s),
      sy = Math.max(1, rz * p.s),
      ang = -S.yaw * 0.16;
    c.save();
    c.translate(p.x, p.y);
    c.rotate(ang);
    c.globalAlpha = alpha;
    const g = c.createRadialGradient(
      -sx * 0.28,
      -sy * 0.3,
      Math.max(1, sx * 0.08),
      0,
      0,
      Math.max(sx, sy),
    );
    g.addColorStop(0, "rgba(255,247,230,.92)");
    g.addColorStop(0.26, col);
    g.addColorStop(1, "rgba(50,35,28,.9)");
    c.fillStyle = g;
    c.beginPath();
    c.ellipse(0, 0, sx, sy, 0, 0, Math.PI * 2);
    c.fill();
    c.globalAlpha = Math.min(1, alpha + 0.1);
    c.strokeStyle = outline;
    c.lineWidth = 1;
    c.stroke();
    c.restore();
    return p;
  }
  function capsule(a, b, r, col, alpha = 0.9) {
    const c = S.ctx,
      p1 = proj(...a),
      p2 = proj(...b),
      w = Math.max(2, r * (p1.s + p2.s) * 0.5);
    c.save();
    c.lineCap = "round";
    c.globalAlpha = alpha;
    c.strokeStyle = "rgba(22,20,21,.72)";
    c.lineWidth = w + 3;
    c.beginPath();
    c.moveTo(p1.x, p1.y);
    c.lineTo(p2.x, p2.y);
    c.stroke();
    const gr = c.createLinearGradient(p1.x, p1.y, p2.x, p2.y);
    gr.addColorStop(0, "#d2b19c");
    gr.addColorStop(0.48, col);
    gr.addColorStop(1, "#9f7867");
    c.strokeStyle = gr;
    c.lineWidth = w;
    c.stroke();
    c.globalAlpha = alpha * 0.36;
    c.strokeStyle = "rgba(255,244,224,.9)";
    c.lineWidth = Math.max(1, w * 0.16);
    c.beginPath();
    c.moveTo(p1.x - w * 0.08, p1.y - w * 0.08);
    c.lineTo(p2.x - w * 0.08, p2.y - w * 0.08);
    c.stroke();
    c.restore();
  }
  function zDepth(p) {
    return proj(...p).d;
  }
  function bodyParts() {
    const skin = "#b98f79";
    const parts = [
      {
        d: zDepth([0, 0, 145]),
        f: () => ellipse3([0, 0, 145], 27, 34, skin, S.layer.body.op),
      } /* head */,
      {
        d: zDepth([0, 0, 104]),
        f: () => capsule([0, 0, 116], [0, 0, 101], 16, skin, S.layer.body.op),
      },
      {
        d: zDepth([0, 0, 55]),
        f: () => ellipse3([0, 0, 58], 47, 64, skin, S.layer.body.op),
      } /* torso */,
      {
        d: zDepth([0, 0, -18]),
        f: () => ellipse3([0, 0, -17], 39, 29, skin, S.layer.body.op),
      } /* pelvis */,
    ];
    const seg = [
      [[-38, 0, 84], [-70, 4, 42], 16],
      [[-70, 4, 42], [-82, 7, 0], 13],
      [[-82, 7, 0], [-84, 8, -10], 10],
      [[38, 0, 84], [70, 4, 42], 16],
      [[70, 4, 42], [82, 7, 0], 13],
      [[82, 7, 0], [84, 8, -10], 10],
      [[-23, 0, -25], [-27, 2, -94], 19],
      [[-27, 2, -94], [-28, 4, -158], 15],
      [[-28, 4, -158], [-30, -5, -177], 12],
      [[23, 0, -25], [27, 2, -94], 19],
      [[27, 2, -94], [28, 4, -158], 15],
      [[28, 4, -158], [30, -5, -177], 12],
    ];
    seg.forEach((x) =>
      parts.push({
        d: (zDepth(x[0]) + zDepth(x[1])) / 2,
        f: () => capsule(x[0], x[1], x[2], skin, S.layer.body.op),
      }),
    );
    return parts;
  }
  function faceMarks() {
    if (!S.layer.body.on) return;
    const c = S.ctx,
      front = Math.cos(S.yaw),
      p = proj(0, 18, 148);
    if (front > 0.15) {
      c.save();
      c.globalAlpha = S.layer.body.op * 0.72;
      c.fillStyle = "#352b2a";
      const gap = 7 * p.s,
        rr = Math.max(1.1, 1.8 * p.s);
      c.beginPath();
      c.arc(p.x - gap, p.y - 4 * p.s, rr, 0, Math.PI * 2);
      c.arc(p.x + gap, p.y - 4 * p.s, rr, 0, Math.PI * 2);
      c.fill();
      c.strokeStyle = "rgba(80,45,40,.7)";
      c.lineWidth = 1;
      c.beginPath();
      c.moveTo(p.x - 5 * p.s, p.y + 10 * p.s);
      c.quadraticCurveTo(p.x, p.y + 13 * p.s, p.x + 5 * p.s, p.y + 10 * p.s);
      c.stroke();
      c.restore();
    }
  }
  const QJ = [
    [
      "ren",
      "#5aa6c8",
      [
        [0, 20, -45],
        [0, 24, -5],
        [0, 25, 42],
        [0, 22, 92],
        [0, 15, 130],
      ],
    ],
    [
      "du",
      "#d9b25f",
      [
        [0, -18, -45],
        [0, -25, 5],
        [0, -26, 58],
        [0, -20, 108],
        [0, -10, 160],
      ],
    ],
    [
      "chong",
      "#c8452e",
      [
        [-7, 20, -45],
        [-7, 22, 5],
        [-7, 22, 58],
        [-6, 18, 105],
      ],
    ],
    [
      "chong",
      "#c8452e",
      [
        [7, 20, -45],
        [7, 22, 5],
        [7, 22, 58],
        [6, 18, 105],
      ],
    ],
    [
      "yinq",
      "#9a7ad0",
      [
        [-26, 0, -174],
        [-24, 5, -112],
        [-14, 13, -45],
        [-9, 16, 35],
        [-5, 13, 129],
      ],
    ],
    [
      "yangq",
      "#e0904a",
      [
        [29, -4, -174],
        [30, -5, -110],
        [34, -10, -38],
        [37, -11, 45],
        [24, -7, 121],
      ],
    ],
    [
      "yinw",
      "#6fb7a8",
      [
        [-24, 3, -132],
        [-19, 8, -62],
        [-15, 14, 8],
        [-8, 15, 91],
      ],
    ],
    [
      "yangw",
      "#b9a24f",
      [
        [30, -5, -142],
        [34, -8, -70],
        [38, -11, 12],
        [30, -9, 96],
      ],
    ],
  ];
  const JPATH = [
    [
      [24, -5, 120],
      [39, -3, 84],
      [51, -4, 38],
      [61, -3, -18],
      [49, -2, -91],
      [35, 0, -174],
    ],
    [
      [13, 12, -174],
      [10, 17, -105],
      [8, 22, -42],
      [-2, 24, 12],
      [-16, 22, 42],
    ],
    [
      [18, 20, 82],
      [39, 16, 72],
      [66, 10, 50],
      [83, 6, 23],
      [88, 5, -3],
    ],
    [
      [88, 4, -3],
      [79, 4, 24],
      [61, 7, 53],
      [43, 10, 82],
      [24, 12, 115],
    ],
    [
      [18, 21, 126],
      [19, 23, 77],
      [20, 25, 18],
      [24, 22, -43],
      [28, 14, -105],
      [30, 7, -174],
    ],
    [
      [9, 12, -174],
      [5, 16, -111],
      [0, 20, -49],
      [-12, 23, 4],
      [-16, 21, 55],
    ],
    [
      [-8, 22, 57],
      [-30, 18, 55],
      [-56, 10, 42],
      [-77, 6, 21],
      [-87, 4, -2],
    ],
    [
      [-87, 4, -2],
      [-75, 2, 22],
      [-56, -3, 53],
      [-38, -7, 83],
      [-20, -7, 116],
    ],
    [
      [-8, -14, 133],
      [-14, -22, 95],
      [-18, -27, 35],
      [-22, -24, -41],
      [-27, -15, -108],
      [-30, -5, -174],
    ],
    [
      [-9, 12, -174],
      [-6, 17, -106],
      [-4, 21, -44],
      [2, 24, 14],
      [6, 22, 70],
    ],
    [
      [4, 24, 58],
      [25, 19, 53],
      [48, 11, 37],
      [69, 7, 18],
      [84, 4, -3],
    ],
    [
      [84, 4, -3],
      [71, 0, 23],
      [52, -6, 54],
      [35, -10, 86],
      [20, -9, 119],
    ],
  ];
  function mirror(p) {
    return p.map(([x, y, z]) => [-x, y, z]);
  }
  function organDefs() {
    return [
      ["fei", [-20, 8, 70], 18, 28, WXCOL[3]],
      ["fei", [20, 8, 70], 18, 28, WXCOL[3]],
      ["xin", [-6, 20, 50], 12, 16, WXCOL[1]],
      ["gan", [-22, 17, 25], 28, 13, WXCOL[0]],
      ["pi", [23, 8, 20], 10, 15, WXCOL[2]],
      ["wei", [10, 19, 7], 14, 18, WXCOL[2]],
      ["xc", [0, 20, -25], 26, 20, WXCOL[1]],
      ["dc", [0, 7, -19], 33, 27, WXCOL[3]],
      ["pg", [0, 15, -62], 10, 11, WXCOL[4]],
      ["shen", [-18, -14, 5], 9, 15, WXCOL[4]],
      ["shen", [18, -14, 5], 9, 15, WXCOL[4]],
      ["xb", [-4, 23, 51], 14, 19, "#cc6a50"],
    ];
  }
  function draw3DRing(z, r, col, op, lw = 2) {
    const pts = [];
    for (let i = 0; i <= 80; i++) {
      const a = (i / 80) * Math.PI * 2;
      pts.push([r * Math.cos(a), r * Math.sin(a), z]);
    }
    path3(pts, col, lw, op);
  }
  function drawLayers() {
    const c = S.ctx,
      hits = [];
    S.selHit = null;
    if (S.layer.body.on) {
      bodyParts()
        .sort((a, b) => b.d - a.d)
        .forEach((x) => x.f());
      faceMarks();
    }
    if (S.layer.qijing.on) {
      QJ.forEach(([k, col, p]) =>
        path3(
          p,
          col,
          Math.max(1.5, 3.2 * S.layer.qijing.op),
          S.layer.qijing.op,
          k === "du" ? [5, 4] : null,
        ),
      );
      draw3DRing(-10, 42, "#4fae8f", S.layer.qijing.op, 2.5);
    }
    if (S.layer.jing12.on) {
      JPATH.forEach((p, i) => {
        path3(p, JCOL[i], Math.max(1, 2.2 * S.layer.jing12.op), S.layer.jing12.op);
        path3(mirror(p), JCOL[i], Math.max(1, 2.2 * S.layer.jing12.op), S.layer.jing12.op);
      });
    }
    if (S.layer.organs.on) {
      organDefs()
        .map((o) => ({ o, d: proj(...o[1]).d }))
        .sort((a, b) => b.d - a.d)
        .forEach(({ o }) => {
          const [k, p, rx, rz, col] = o,
            v = ellipse3(p, rx, rz, col, S.layer.organs.op);
          hits.push({ k, x: v.x, y: v.y, r: Math.max(8, rx * v.s) });
        });
    }
    if (S.layer.sanjiao.on) {
      draw3DRing(72, 40, WXCOL[1], S.layer.sanjiao.op, 3);
      draw3DRing(18, 40, WXCOL[2], S.layer.sanjiao.op, 3);
      draw3DRing(-48, 40, WXCOL[4], S.layer.sanjiao.op, 3);
      [
        ["dt1", [0, 5, 132]],
        ["dt2", [0, 18, 55]],
        ["dt3", [0, 18, -48]],
      ].forEach(([k, p]) => {
        const v = ellipse3(p, 8, 8, "#d9b25f", S.layer.sanjiao.op);
        hits.push({ k, x: v.x, y: v.y, r: 10 });
      });
    }
    if (S.layer.current.on) {
      const i = currentIdx(),
        p = JPATH[i];
      path3(p, "#ffd678", 6, S.layer.current.op);
      path3(mirror(p), "#ffd678", 6, S.layer.current.op);
    }
    if (S.layer.fate.on) {
      const F = fateData();
      if (F) {
        const map = {
          0: [[-22, 17, 25]],
          1: [
            [-6, 20, 50],
            [-4, 23, 51],
          ],
          2: [
            [23, 8, 20],
            [10, 19, 7],
          ],
          3: [
            [-20, 8, 70],
            [20, 8, 70],
          ],
          4: [
            [-18, -14, 5],
            [18, -14, 5],
            [0, 15, -62],
          ],
        };
        [0, 1, 2, 3, 4].forEach((i) => {
          const col = F.xy.favor.includes(i)
              ? "#e2bc65"
              : F.xy.avoid.includes(i)
                ? "#cb5141"
                : WXCOL[i],
            op =
              F.xy.favor.includes(i) || F.xy.avoid.includes(i)
                ? S.layer.fate.op
                : S.layer.fate.op * 0.35;
          (map[i] || []).forEach((p) => {
            const q = proj(...p);
            c.save();
            c.globalAlpha = op;
            c.strokeStyle = col;
            c.lineWidth = 2;
            c.beginPath();
            c.arc(q.x, q.y, Math.max(8, 16 * q.s), 0, Math.PI * 2);
            c.stroke();
            c.restore();
          });
        });
      }
    }
    return hits;
  }
  function drawGround() {
    const c = S.ctx;
    c.save();
    c.fillStyle = "#0b1018";
    c.fillRect(0, 0, S.cw, S.ch);
    const g = c.createRadialGradient(
      S.cw * 0.5,
      S.ch * 0.42,
      20,
      S.cw * 0.5,
      S.ch * 0.45,
      S.cw * 0.6,
    );
    g.addColorStop(0, "rgba(217,178,95,.10)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    c.fillStyle = g;
    c.fillRect(0, 0, S.cw, S.ch);
    for (let r = 70; r <= 210; r += 45) {
      const pts = [];
      for (let i = 0; i <= 72; i++) {
        const a = (i / 72) * Math.PI * 2;
        pts.push([r * Math.cos(a), r * Math.sin(a), -182]);
      }
      path3(pts, "rgba(217,178,95,.10)", 1, 1);
    }
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      path3(
        [
          [45 * Math.cos(a), 45 * Math.sin(a), -182],
          [220 * Math.cos(a), 220 * Math.sin(a), -182],
        ],
        "rgba(217,178,95,.07)",
        1,
        1,
      );
    }
    c.restore();
  }
  function viewName() {
    const a = ((S.yaw % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2),
      d = (a * 180) / Math.PI;
    return d < 45 || d >= 315 ? "正面" : d < 135 ? "左侧" : d < 225 ? "背面" : "右侧";
  }
  function draw() {
    if (!S.ctx) return;
    S.ctx.setTransform(S.dpr, 0, 0, S.dpr, 0, 0);
    drawGround();
    S.hits = drawLayers();
    const vr = q("#bd84ViewRead");
    if (vr)
      vr.textContent =
        viewName() + " · " + Math.round(((((S.yaw * 180) / Math.PI) % 360) + 360) % 360) + "°";
  }
  function fit() {
    const cv = q("#bd84Cv");
    if (!cv) return;
    const r = cv.getBoundingClientRect();
    if (r.width < 20) return;
    S.cw = r.width;
    S.ch = Math.max(420, r.height);
    S.dpr = Math.min(devicePixelRatio || 1, 1.7);
    cv.width = Math.round(S.cw * S.dpr);
    cv.height = Math.round(S.ch * S.dpr);
    S.ctx = cv.getContext("2d");
    S.focal = Math.max(520, Math.min(860, S.ch * 1.05));
    draw();
  }
  function reset() {
    S.yaw = -0.3;
    S.pitch = 0.12;
    S.dist = 720;
    S.tx = 0;
    S.ty = 0;
    S.tz = 0;
    draw();
  }
  function setView(k) {
    if (k === "front") S.yaw = 0;
    if (k === "left") S.yaw = Math.PI / 2;
    if (k === "back") S.yaw = Math.PI;
    if (k === "right") S.yaw = -Math.PI / 2;
    if (k === "reset") reset();
    S.pitch = 0.1;
    draw();
  }
  function pan(dx, dy) {
    const cy = Math.cos(S.yaw),
      sy = Math.sin(S.yaw),
      sp = Math.sin(S.pitch),
      cp = Math.cos(S.pitch),
      w = S.dist / Math.max(100, S.focal);
    S.tx += (-dx * cy + dy * sy * sp) * w;
    S.ty += (dx * sy + dy * cy * sp) * w;
    S.tz += dy * cp * w;
  }
  function dolly(dy) {
    S.dist *= Math.exp(Math.max(-120, Math.min(120, dy)) * 0.0024);
    S.dist = Math.max(S.minDist, Math.min(1500, S.dist));
  }
  function clickHit(x, y) {
    const h = (S.hits || [])
      .map((o) => ({ ...o, d: Math.hypot(x - o.x, y - o.y) }))
      .filter((o) => o.d < o.r + 8)
      .sort((a, b) => a.d - b.d)[0];
    if (!h) return;
    BD.sel = BD.sel === h.k ? null : h.k;
    const info = q("#bdInfo");
    if (info) info.innerHTML = bdInfo();
    const side = q("#bd84Right");
    if (side) side.innerHTML = sideInfo();
    draw();
  }
  function bindCanvas() {
    const cv = q("#bd84Cv");
    if (!cv) return;
    S.cv = cv;
    let drag = null,
      moved = false;
    cv.addEventListener("contextmenu", (e) => e.preventDefault());
    cv.addEventListener("pointerdown", (e) => {
      if (e.button !== 0 && e.button !== 1 && e.button !== 2) return;
      moved = false;
      drag = {
        id: e.pointerId,
        x: e.clientX,
        y: e.clientY,
        mode: e.shiftKey || e.button === 1 || e.button === 2 ? "pan" : "orbit",
      };
      try {
        cv.setPointerCapture(e.pointerId);
      } catch (_) {}
    });
    cv.addEventListener("pointermove", (e) => {
      if (!drag) return;
      const dx = e.clientX - drag.x,
        dy = e.clientY - drag.y;
      if (Math.abs(dx) + Math.abs(dy) > 3) moved = true;
      if (drag.mode === "pan") pan(dx, dy);
      else {
        S.yaw += dx * 0.006;
        S.pitch = Math.max(-0.45, Math.min(0.8, S.pitch + dy * 0.005));
      }
      drag.x = e.clientX;
      drag.y = e.clientY;
      draw();
    });
    const up = (e) => {
      if (!drag) return;
      const r = cv.getBoundingClientRect(),
        x = e.clientX - r.left,
        y = e.clientY - r.top;
      if (!moved && drag.mode === "orbit") clickHit(x, y);
      drag = null;
    };
    cv.addEventListener("pointerup", up);
    cv.addEventListener("pointercancel", () => (drag = null));
    cv.addEventListener(
      "wheel",
      (e) => {
        e.preventDefault();
        dolly(e.deltaY);
        draw();
      },
      { passive: false },
    );
    cv.addEventListener("dblclick", (e) => {
      e.preventDefault();
      reset();
    });
  }
  function solo(k) {
    Object.keys(S.layer).forEach((x) => (S.layer[x].on = x === k ? 1 : 0));
    if (k !== "body") {
      S.layer.body.on = 1;
      S.layer.body.op = 0.18;
    }
    sync();
    draw();
  }
  function preset(k) {
    const set = (a) => Object.keys(S.layer).forEach((x) => (S.layer[x].on = a.includes(x) ? 1 : 0));
    if (k === "all") set(Object.keys(S.layer));
    if (k === "mer") set(["body", "qijing", "jing12", "current"]);
    if (k === "org") set(["body", "organs", "sanjiao", "fate"]);
    if (k === "now") set(["body", "current", "fate"]);
    sync();
    draw();
  }
  function sync() {
    Object.keys(S.layer).forEach((k) => {
      const a = q(`[data-bd84-on="${k}"]`),
        b = q(`[data-bd84-op="${k}"]`);
      if (a) a.checked = !!S.layer[k].on;
      if (b) b.value = S.layer[k].op;
    });
  }
  function bind() {
    qa("[data-bd84-view]").forEach((b) => (b.onclick = () => setView(b.dataset.bd84View)));
    q("#bd84Auto")?.addEventListener("change", (e) => (S.auto = e.target.checked ? 1 : 0));
    q("#bd84Fs")?.addEventListener("click", async () => {
      const s = q("#bd84Stage");
      try {
        if (document.fullscreenElement) await document.exitFullscreen();
        else await s.requestFullscreen();
      } catch (_) {
        if (typeof toast === "function") toast("当前浏览器不允许全屏");
      }
    });
    qa("[data-bd84-on]").forEach(
      (a) =>
        (a.onchange = () => {
          S.layer[a.dataset.bd84On].on = a.checked ? 1 : 0;
          draw();
        }),
    );
    qa("[data-bd84-op]").forEach(
      (a) =>
        (a.oninput = () => {
          S.layer[a.dataset.bd84Op].op = +a.value;
          draw();
        }),
    );
    qa("[data-bd84-solo]").forEach((b) => (b.onclick = () => solo(b.dataset.bd84Solo)));
    qa("[data-bd84-pre]").forEach((b) => (b.onclick = () => preset(b.dataset.bd84Pre)));
    bindCanvas();
    fit();
    if (S.ro)
      try {
        S.ro.disconnect();
      } catch (_) {}
    if (typeof ResizeObserver !== "undefined") {
      S.ro = new ResizeObserver(() => requestAnimationFrame(fit));
      S.ro.observe(q("#bd84Stage"));
    }
    cancelAnimationFrame(S.raf || 0);
    S.last = performance.now();
    const loop = (t) => {
      S.raf = requestAnimationFrame(loop);
      if (S.auto && q("#bd84Cv")?.isConnected) {
        S.yaw += (t - S.last) * 0.00012;
        draw();
      }
      S.last = t;
    };
    S.raf = requestAnimationFrame(loop);
  }
  window.bd84Bind = bind;

  /* 禁用前两版外部 Three.js 初始化：这版完全内置，不联网也能看。 */
  try {
    if (typeof window.bd83Dispose === "function") window.bd83Dispose();
  } catch (_) {}
  try {
    if (typeof window.bdRealDispose === "function") window.bdRealDispose();
  } catch (_) {}
  window.bd83Init = function () {};
  window.bdRealInit = function () {};

  window.bdBind = function () {
    const re = () => {
      cancelAnimationFrame(S.raf || 0);
      const p = q("#bdBlock");
      if (!p) return;
      const tmp = document.createElement("div");
      tmp.innerHTML = bdHTML();
      p.replaceWith(tmp.firstElementChild);
      bdBind();
      try {
        if (typeof zmScan === "function") zmScan();
      } catch (_) {}
    };
    qa("[data-bdl]").forEach(
      (b) =>
        (b.onclick = () => {
          BD.layer = b.dataset.bdl;
          BD.sel = null;
          re();
        }),
    );
    qa("#bdSvg .bd-hit").forEach(
      (g) =>
        (g.onclick = () => {
          const k = g.dataset.bd;
          if (!k) return;
          BD.sel = BD.sel === k ? null : k;
          const info = q("#bdInfo");
          if (info) info.innerHTML = bdInfo();
          const side = q("#bd84Right");
          if (side) side.innerHTML = sideInfo();
          draw();
        }),
    );
    bind();
  };

  const _jl84 = window.jlSelect;
  window.jlSelect = function (i) {
    _jl84(i);
    if (q("#bd84Cv")) {
      const side = q("#bd84Right");
      if (side) side.innerHTML = sideInfo();
      draw();
    }
  };

  try {
    if (q("#pane-jingluo")?.classList.contains("on") && window.R) jingluoRefresh();
  } catch (_) {}

  try {
    const bv = q("#buildVersion");
  } catch (_) {}
})();
