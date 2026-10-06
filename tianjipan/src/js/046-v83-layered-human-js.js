(() => {
  const TS = "2026-10-04 03:14:26";
  const q = (s, r = document) => r.querySelector(s),
    qa = (s, r = document) => Array.from(r.querySelectorAll(s));
  const WXN83 = ["木", "火", "土", "金", "水"];
  const WXC83 = ["#56a87b", "#d9634f", "#c79a45", "#d8d6ce", "#5b91c8"];
  const JCOLOR = [
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
  const MODEL =
    "https://cdn.jsdelivr.net/gh/kunalkushwaha/vsim@main/packages/assets/library/human.glb";
  const MODEL_FALLBACK =
    "https://cdn.jsdelivr.net/gh/KhronosGroup/glTF-Sample-Assets@main/Models/CesiumMan/glTF-Binary/CesiumMan.glb";

  const S = (window.BD83 = window.BD83 || {
    renderer: null,
    scene: null,
    camera: null,
    controls: null,
    mixer: null,
    clock: null,
    raf: 0,
    host: null,
    model: null,
    groups: {},
    resize: null,
    skinMaterials: [],
    layer: {
      skin: { on: 1, op: 0.72 },
      qijing: { on: 1, op: 0.82 },
      jing12: { on: 1, op: 0.68 },
      organs: { on: 1, op: 0.75 },
      sanjiao: { on: 1, op: 0.72 },
      current: { on: 1, op: 1 },
      fate: { on: 1, op: 0.88 },
    },
    auto: 0,
  });

  function loadScript(url) {
    return new Promise((res, rej) => {
      if ([...document.scripts].some((x) => x.src === url)) {
        res();
        return;
      }
      const s = document.createElement("script");
      s.src = url;
      s.async = true;
      s.crossOrigin = "anonymous";
      s.onload = res;
      s.onerror = () => rej(new Error("load " + url));
      document.head.appendChild(s);
    });
  }
  async function ensure3D() {
    if (window.THREE && THREE.GLTFLoader && THREE.OrbitControls) return;
    const L = [
      "https://cdn.jsdelivr.net/npm/three@0.128.0/build/three.min.js",
      "https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/GLTFLoader.js",
      "https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js",
    ];
    for (const u of L) await loadScript(u);
  }
  function disposeObj(o) {
    if (!o) return;
    o.traverse?.((x) => {
      x.geometry?.dispose?.();
      const ms = x.material ? (Array.isArray(x.material) ? x.material : [x.material]) : [];
      ms.forEach((m) => {
        Object.keys(m).forEach((k) => m[k]?.isTexture && m[k].dispose?.());
        m.dispose?.();
      });
    });
  }
  function dispose() {
    cancelAnimationFrame(S.raf || 0);
    try {
      S.resize?.disconnect();
    } catch (_) {}
    try {
      S.controls?.dispose();
    } catch (_) {}
    try {
      disposeObj(S.scene);
    } catch (_) {}
    try {
      S.renderer?.dispose();
    } catch (_) {}
    if (S.renderer?.domElement?.parentNode) S.renderer.domElement.remove();
    Object.assign(S, {
      renderer: null,
      scene: null,
      camera: null,
      controls: null,
      mixer: null,
      clock: null,
      raf: 0,
      host: null,
      model: null,
      groups: {},
      resize: null,
      skinMaterials: [],
    });
  }
  window.bd83Dispose = dispose;

  function layerRows() {
    const rows = [
      ["skin", "皮肤 / 人体", "真实人物底图"],
      ["qijing", "奇经八脉", "任督冲带等空间示意"],
      ["jing12", "十二正经", "十二经脉双侧示意"],
      ["organs", "五脏六腑", "空间位置示意"],
      ["sanjiao", "三焦 · 丹田", "上中下焦与三丹田"],
      ["current", "当前子午流注", "所选时辰经络高亮"],
      ["fate", "命主五行", "喜用 / 忌与五行结构提示"],
    ];
    return rows
      .map(([k, n, d]) => {
        const L = S.layer[k];
        return `<div class="bd83-layer"><div class="bd83-layer-head"><input type="checkbox" data-bd83-on="${k}"${L.on ? " checked" : ""}><b>${n}</b><small>${d}</small></div><div class="bd83-layer-ctl"><input type="range" min="0.08" max="1" step="0.02" value="${L.op}" data-bd83-op="${k}"><button class="bd83-mini" data-bd83-focus="${k}">聚焦</button><button class="bd83-mini" data-bd83-solo="${k}">独看</button></div></div>`;
      })
      .join("");
  }
  function currentIdx() {
    return JL.sel == null ? JL.now : JL.sel;
  }
  function fateData() {
    if (!window.R || !R.bz) return null;
    try {
      const st = strength(R.bz),
        xy = xiyong(R.bz, st),
        c = wxContrib(R.bz),
        sum = c.tot.reduce((a, b) => a + b, 0) || 1;
      const pct = c.tot.map((x) => x / sum),
        strong = pct.indexOf(Math.max(...pct)),
        weak = pct.indexOf(Math.min(...pct));
      return { st, xy, pct, strong, weak, dm: GAN_WX[R.bz.dm] };
    } catch (_) {
      return null;
    }
  }
  function rightInfo() {
    const idx = currentIdx(),
      m = JL_MER[idx],
      F = fateData(),
      sel = BD.sel;
    let title = "当前空间读数",
      desc =
        "选择经络、脏腑或三焦丹田后，3D 图会同步高亮；子午流注与命主五行也会叠加到同一空间中。";
    if (sel) {
      const a = BD_QJ.find((x) => x.k === sel),
        o = BD_ZF.find((x) => x.k === sel),
        s = BD_SJ.find((x) => x.k === sel) || BD_DT.find((x) => x.k === sel);
      if (a) {
        title = a.n;
        desc = a.plain;
      } else if (o) {
        title = o.n + " · " + o.wx;
        desc = o.zhu + "；" + o.jl;
      } else if (s) {
        title = s.n;
        desc = s.txt;
      }
    }
    const favor = F ? F.xy.favor.map((i) => WXN83[i]).join("、") || "—" : "—";
    const avoid = F ? F.xy.avoid.map((i) => WXN83[i]).join("、") || "—" : "—";
    return `<div class="bd83-read"><h5>${title}</h5><p>${desc}</p><div class="bd83-tags"><span>${m.z}时</span><span>${m.n}</span><span>${m.wx}</span>${sel ? `<span>当前选中 ${sel}</span>` : ""}</div></div>
   <div class="bd83-read"><h5>命主 × 五行</h5><div class="bd83-map"><span>日主</span><b>${F ? GAN[R.bz.dm] + WXN83[F.dm] : "—"}</b><span>喜用</span><b>${favor}</b><span>忌</span><b>${avoid}</b><span>原局最强</span><b>${F ? WXN83[F.strong] + " " + (F.pct[F.strong] * 100).toFixed(0) + "%" : "—"}</b><span>原局最弱</span><b>${F ? WXN83[F.weak] + " " + (F.pct[F.weak] * 100).toFixed(0) + "%" : "—"}</b></div></div>
   <div class="bd83-read"><h5>颜色图例</h5><div class="bd83-legend"><span><i style="background:${WXC83[0]}"></i>木</span><span><i style="background:${WXC83[1]}"></i>火</span><span><i style="background:${WXC83[2]}"></i>土</span><span><i style="background:${WXC83[3]}"></i>金</span><span><i style="background:${WXC83[4]}"></i>水</span><span><i style="background:#d9b25f"></i>喜用 / 当前</span><span><i style="background:#c84a3b"></i>忌 / 冲突提示</span></div><p class="sub">经络、穴位和脏腑位置均为结构化可视化示意，不用于医学取穴、诊断或治疗。</p></div>`;
  }
  function html() {
    return `<div class="bd83-shell">
    <div class="bd83-toolbar">
      <div class="views"><button class="gbtn sm" data-bd83-view="front">正面</button><button class="gbtn sm" data-bd83-view="left">左侧</button><button class="gbtn sm" data-bd83-view="back">背面</button><button class="gbtn sm" data-bd83-view="right">右侧</button><button class="gbtn sm" data-bd83-view="reset">复位</button></div>
      <span class="spacer"></span>
      <label><input type="checkbox" id="bd83Auto"${S.auto ? " checked" : ""}> 自动环视</label>
      <button class="gbtn sm" id="bd83Fs">放大</button>
    </div>
    <div class="bd83-layout">
      <aside class="bd83-panel"><h4>3D 图层</h4><div class="sub">每层都可以独立显示、调透明度、聚焦或单独查看。</div><div class="bd83-layers">${layerRows()}</div><div class="bd83-presets"><button class="gbtn sm" data-bd83-pre="all">全部显示</button><button class="gbtn sm" data-bd83-pre="meridian">只看经络</button><button class="gbtn sm" data-bd83-pre="organ">只看脏腑</button><button class="gbtn sm" data-bd83-pre="now">只看当前</button><button class="gbtn sm" data-bd83-pre="base">恢复默认</button></div></aside>
      <div class="bd83-stage" id="bd83Stage"><span class="bd83-badge">LAYERED REAL 3D · WebGL</span><div class="bd83-axis"><span>拖动：旋转</span><span>滚轮：缩放</span><span>右键：平移</span><span>双击：复位</span></div><div class="bd83-status" id="bd83Status"><b>加载 3D 人体…</b><span>首次打开需要联网获取 CC0 模型。</span></div></div>
      <aside class="bd83-right" id="bd83Right">${rightInfo()}</aside>
    </div>
   </div>`;
  }
  window.bd3dHTML = html;

  function mat(color, op = 0.8, em = 0.18) {
    return new THREE.MeshStandardMaterial({
      color,
      transparent: true,
      opacity: op,
      roughness: 0.46,
      metalness: 0.03,
      emissive: new THREE.Color(color),
      emissiveIntensity: em,
      depthWrite: op > 0.52,
    });
  }
  function lineTube(points, color, r = 0.014, op = 0.7) {
    const c = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)));
    return new THREE.Mesh(new THREE.TubeGeometry(c, 42, r, 7, false), mat(color, op, 0.24));
  }
  function dot(pos, color, r = 0.07, op = 0.82) {
    const m = new THREE.Mesh(new THREE.SphereGeometry(r, 18, 12), mat(color, op, 0.3));
    m.position.set(...pos);
    return m;
  }
  function ellip(pos, scale, color, op = 0.68) {
    const m = dot(pos, color, 1, op);
    m.scale.set(...scale);
    return m;
  }
  function torus(pos, color, R = 0.4, r = 0.012, op = 0.65) {
    const m = new THREE.Mesh(new THREE.TorusGeometry(R, r, 7, 56), mat(color, op, 0.22));
    m.rotation.x = Math.PI / 2;
    m.position.set(...pos);
    return m;
  }
  function clear(g) {
    while (g && g.children.length) {
      const x = g.children.pop();
      disposeObj(x);
    }
  }
  function group(name) {
    return S.groups[name];
  }

  const QJ = [
    [
      "ren",
      "#5aa6c8",
      [
        [0, -0.88, 0.37],
        [0, -0.4, 0.39],
        [0, 0.08, 0.4],
        [0, 0.62, 0.37],
        [0, 1.25, 0.25],
      ],
    ],
    [
      "du",
      "#d9b25f",
      [
        [0, -0.86, -0.34],
        [0, -0.35, -0.39],
        [0, 0.18, -0.41],
        [0, 0.73, -0.36],
        [0, 1.31, -0.16],
      ],
    ],
    [
      "chong",
      "#c8452e",
      [
        [-0.075, -0.72, 0.31],
        [-0.075, -0.18, 0.36],
        [-0.075, 0.42, 0.34],
        [-0.06, 0.9, 0.27],
      ],
    ],
    [
      "chong",
      "#c8452e",
      [
        [0.075, -0.72, 0.31],
        [0.075, -0.18, 0.36],
        [0.075, 0.42, 0.34],
        [0.06, 0.9, 0.27],
      ],
    ],
    [
      "yinq",
      "#9a7ad0",
      [
        [-0.14, -1.72, 0.08],
        [-0.12, -0.98, 0.1],
        [-0.1, -0.2, 0.23],
        [-0.075, 0.62, 0.26],
        [-0.055, 1.27, 0.18],
      ],
    ],
    [
      "yangq",
      "#e0904a",
      [
        [0.23, -1.72, -0.02],
        [0.27, -0.98, -0.03],
        [0.31, -0.16, -0.06],
        [0.34, 0.66, -0.06],
        [0.24, 1.2, -0.1],
      ],
    ],
    [
      "yinw",
      "#6fb7a8",
      [
        [-0.2, -1.34, 0.05],
        [-0.18, -0.58, 0.12],
        [-0.15, 0.12, 0.2],
        [-0.08, 0.9, 0.22],
      ],
    ],
    [
      "yangw",
      "#b9a24f",
      [
        [0.3, -1.42, -0.08],
        [0.34, -0.62, -0.1],
        [0.38, 0.18, -0.12],
        [0.3, 0.94, -0.12],
      ],
    ],
  ];
  function buildQJ() {
    const g = group("qijing");
    clear(g);
    QJ.forEach(([k, c, p]) => {
      const t = lineTube(p, c, k === "ren" || k === "du" ? 0.022 : 0.014, S.layer.qijing.op);
      t.userData = { bd: k };
      g.add(t);
    });
    const d = torus([0, -0.09, 0], "#4fae8f", 0.43, 0.018, S.layer.qijing.op);
    d.userData = { bd: "dai" };
    g.add(d);
  }
  const organPos = {
    xin: [-0.08, 0.55, 0.26],
    gan: [-0.23, 0.22, 0.24],
    pi: [0.24, 0.18, 0.13],
    wei: [0.1, 0.09, 0.24],
    xc: [0, -0.38, 0.22],
    dc: [0, -0.28, 0.16],
    pg: [0, -0.82, 0.2],
    shenL: [-0.2, 0.04, -0.19],
    shenR: [0.2, 0.04, -0.19],
    xb: [-0.06, 0.54, 0.3],
  };
  function buildOrgans() {
    const g = group("organs");
    clear(g);
    const op = S.layer.organs.op;
    const A = [
      ["fei", [-0.22, 0.72, 0.16], [0.17, 0.31, 0.12], WXC83[3]],
      ["fei", [0.22, 0.72, 0.16], [0.17, 0.31, 0.12], WXC83[3]],
      ["xin", organPos.xin, [0.11, 0.15, 0.1], WXC83[1]],
      ["gan", organPos.gan, [0.28, 0.12, 0.16], WXC83[0]],
      ["pi", organPos.pi, [0.09, 0.14, 0.08], WXC83[2]],
      ["wei", organPos.wei, [0.13, 0.18, 0.1], WXC83[2]],
      ["xc", organPos.xc, [0.24, 0.2, 0.11], WXC83[1]],
      ["dc", organPos.dc, [0.31, 0.26, 0.13], WXC83[3]],
      ["pg", organPos.pg, [0.09, 0.1, 0.08], WXC83[4]],
      ["shen", organPos.shenL, [0.08, 0.14, 0.07], WXC83[4]],
      ["shen", organPos.shenR, [0.08, 0.14, 0.07], WXC83[4]],
      ["xb", organPos.xb, [0.12, 0.17, 0.11], "#cc6a50"],
    ];
    A.forEach(([k, p, s, c]) => {
      const m = ellip(p, s, c, op);
      m.userData = { bd: k };
      g.add(m);
    });
  }
  function buildSJ() {
    const g = group("sanjiao");
    clear(g);
    const op = S.layer.sanjiao.op;
    [
      ["sj1", 0.62, WXC83[1]],
      ["sj2", 0.04, WXC83[2]],
      ["sj3", -0.58, WXC83[4]],
    ].forEach(([k, y, c]) => {
      const t = torus([0, y, 0], c, 0.37, 0.014, op);
      t.userData = { bd: k };
      g.add(t);
    });
    [
      ["dt1", [0, 1.33, 0.13]],
      ["dt2", [0, 0.57, 0.27]],
      ["dt3", [0, -0.48, 0.25]],
    ].forEach(([k, p]) => {
      const d = dot(p, "#d9b25f", 0.075, op);
      d.userData = { bd: k };
      g.add(d);
    });
  }
  const JPATH = [
    [
      [0.2, 1.15, 0.02],
      [0.39, 0.86, 0.02],
      [0.46, 0.32, 0.0],
      [0.48, -0.32, -0.02],
      [0.43, -1.05, -0.04],
      [0.36, -1.78, 0.03],
    ] /* 胆 */,
    [
      [0.12, -1.78, 0.12],
      [0.1, -1.05, 0.16],
      [0.08, -0.38, 0.22],
      [-0.02, 0.12, 0.3],
      [-0.14, 0.38, 0.3],
    ] /* 肝 */,
    [
      [0.18, 0.82, 0.24],
      [0.38, 0.74, 0.18],
      [0.66, 0.47, 0.1],
      [0.86, 0.16, 0.04],
      [1.02, -0.05, 0.02],
    ] /* 肺 */,
    [
      [1.04, -0.02, 0.02],
      [0.84, 0.22, 0.02],
      [0.66, 0.52, 0.06],
      [0.45, 0.82, 0.12],
      [0.28, 1.1, 0.18],
    ] /* 大肠 */,
    [
      [0.16, 1.22, 0.2],
      [0.18, 0.76, 0.28],
      [0.2, 0.14, 0.3],
      [0.22, -0.48, 0.2],
      [0.25, -1.18, 0.13],
      [0.28, -1.78, 0.1],
    ] /* 胃 */,
    [
      [0.08, -1.78, 0.12],
      [0.04, -1.12, 0.15],
      [0.0, -0.46, 0.24],
      [-0.12, 0.06, 0.31],
      [-0.14, 0.58, 0.28],
    ] /* 脾 */,
    [
      [-0.08, 0.6, 0.3],
      [-0.28, 0.58, 0.22],
      [-0.55, 0.44, 0.12],
      [-0.78, 0.2, 0.06],
      [-1.0, 0.02, 0.02],
    ] /* 心 */,
    [
      [-1.0, 0.02, 0.02],
      [-0.78, 0.26, -0.02],
      [-0.56, 0.56, -0.08],
      [-0.36, 0.88, -0.12],
      [-0.18, 1.16, -0.08],
    ] /* 小肠 */,
    [
      [-0.08, 1.3, -0.16],
      [-0.14, 0.94, -0.34],
      [-0.18, 0.3, -0.41],
      [-0.22, -0.45, -0.32],
      [-0.26, -1.18, -0.18],
      [-0.3, -1.78, -0.05],
    ] /* 膀胱 */,
    [
      [-0.08, -1.78, 0.1],
      [-0.06, -1.08, 0.13],
      [-0.04, -0.38, 0.22],
      [0.02, 0.2, 0.28],
      [0.06, 0.72, 0.27],
    ] /* 肾 */,
    [
      [0.03, 0.58, 0.32],
      [0.24, 0.52, 0.24],
      [0.48, 0.36, 0.14],
      [0.7, 0.16, 0.05],
      [0.92, -0.02, 0.02],
    ] /* 心包 */,
    [
      [0.92, -0.02, 0.02],
      [0.72, 0.24, -0.02],
      [0.52, 0.52, -0.1],
      [0.34, 0.86, -0.14],
      [0.2, 1.18, -0.1],
    ] /* 三焦 */,
  ];
  function mirrorPath(p) {
    return p.map(([x, y, z]) => [-x, y, z]);
  }
  function buildJing12() {
    const g = group("jing12");
    clear(g);
    JPATH.forEach((p, i) => {
      [p, mirrorPath(p)].forEach((pp, j) => {
        const t = lineTube(pp, JCOLOR[i], 0.011, S.layer.jing12.op);
        t.userData = { idx: i, bd: jl83BodyKey(i), side: j };
        g.add(t);
      });
    });
  }
  function jl83BodyKey(i) {
    return ["dan", "gan", "fei", "dc", "wei", "pi", "xin", "xc", "pg", "shen", "xb", "sj"][i];
  }
  function buildCurrent() {
    const g = group("current");
    clear(g);
    const i = currentIdx(),
      p = JPATH[i],
      op = S.layer.current.op;
    [p, mirrorPath(p)].forEach((pp) => {
      const t = lineTube(pp, "#f1ca72", 0.027, op);
      t.userData = { idx: i };
      g.add(t);
    });
    const end = p[Math.floor(p.length / 2)],
      d = dot(end, "#ffd778", 0.095, op);
    g.add(d);
  }
  function fateElementGroups(F) {
    const map = {
      0: [organPos.gan],
      1: [organPos.xin, organPos.xb],
      2: [organPos.pi, organPos.wei],
      3: [
        [-0.22, 0.72, 0.16],
        [0.22, 0.72, 0.16],
      ],
      4: [organPos.shenL, organPos.shenR, organPos.pg],
    };
    return map;
  }
  function buildFate() {
    const g = group("fate");
    clear(g);
    const F = fateData();
    if (!F) return;
    const mp = fateElementGroups(F),
      op = S.layer.fate.op;
    [0, 1, 2, 3, 4].forEach((i) => {
      const state = F.xy.favor.includes(i) ? "fav" : F.xy.avoid.includes(i) ? "avoid" : "neutral";
      const c = state === "fav" ? "#d9b25f" : state === "avoid" ? "#c64b3c" : WXC83[i];
      (mp[i] || []).forEach((p) => {
        const a = torus(p, c, 0.13, 0.012, op * (state === "neutral" ? 0.45 : 1));
        a.rotation.x = 0;
        a.userData = { wx: i, state };
        g.add(a);
      });
    });
  }
  function buildAll() {
    buildQJ();
    buildJing12();
    buildOrgans();
    buildSJ();
    buildCurrent();
    buildFate();
    applyVisibility();
  }
  function setOpacity(g, op) {
    g?.traverse((x) => {
      if (x.material) {
        const ms = Array.isArray(x.material) ? x.material : [x.material];
        ms.forEach((m) => {
          m.transparent = true;
          m.opacity = op;
          m.depthWrite = op > 0.55;
          m.needsUpdate = true;
        });
      }
    });
  }
  function applySkin() {
    S.skinMaterials.forEach((x) => {
      const o = S.layer.skin.op;
      x.transparent = o < 0.995;
      x.opacity = S.layer.skin.on ? o : 0;
      x.depthWrite = o > 0.55;
      x.needsUpdate = true;
    });
    if (S.model) S.model.visible = !!S.layer.skin.on;
  }
  function applyVisibility() {
    applySkin();
    Object.keys(S.layer).forEach((k) => {
      if (k === "skin") return;
      const g = group(k);
      if (!g) return;
      g.visible = !!S.layer[k].on;
      setOpacity(g, S.layer[k].op);
    });
    updateRight();
  }
  window.bd83Apply = applyVisibility;
  function updateRight() {
    const r = q("#bd83Right");
    if (r) r.innerHTML = rightInfo();
  }

  function fitModel(model) {
    const b0 = new THREE.Box3().setFromObject(model),
      s0 = b0.getSize(new THREE.Vector3()),
      sc = 4 / Math.max(0.001, s0.y);
    model.scale.setScalar(sc);
    model.updateMatrixWorld(true);
    const b = new THREE.Box3().setFromObject(model),
      c = b.getCenter(new THREE.Vector3());
    model.position.sub(c);
    model.updateMatrixWorld(true);
  }
  function status(cls, html) {
    const e = q("#bd83Status");
    if (e) {
      e.className = "bd83-status " + (cls || "");
      e.innerHTML = html;
    }
  }
  function view(k) {
    const c = S.camera,
      ctl = S.controls;
    if (!c || !ctl) return;
    const d = 6.3,
      p = {
        front: [0, 0.1, d],
        back: [0, 0.1, -d],
        left: [-d, 0.1, 0],
        right: [d, 0.1, 0],
        reset: [0, 0.16, d],
      }[k] || [0, 0.1, d];
    c.position.set(...p);
    ctl.target.set(0, 0.03, 0);
    ctl.update();
  }
  function focusLayer(k) {
    if (k === "skin") {
      view("front");
      return;
    }
    const g = group(k);
    if (!g || !g.visible || !g.children.length) return;
    const box = new THREE.Box3().setFromObject(g);
    if (box.isEmpty()) return;
    const ctr = box.getCenter(new THREE.Vector3()),
      size = box.getSize(new THREE.Vector3()),
      m = Math.max(size.x, size.y, size.z, 0.5);
    S.controls.target.copy(ctr);
    const dir = new THREE.Vector3(0, 0.15, 1).normalize();
    S.camera.position.copy(ctr.clone().add(dir.multiplyScalar(Math.max(2.4, m * 3.0))));
    S.controls.update();
  }
  function solo(k) {
    Object.keys(S.layer).forEach((x) => (S.layer[x].on = x === k ? 1 : 0));
    if (k !== "skin") S.layer.skin.on = 0.1; // overwritten below as truthy; keep body faint
    if (k !== "skin") {
      S.layer.skin.on = 1;
      S.layer.skin.op = 0.14;
    }
    syncControls();
    applyVisibility();
    focusLayer(k);
  }
  function preset(k) {
    const set = (arr) =>
      Object.keys(S.layer).forEach((x) => (S.layer[x].on = arr.includes(x) ? 1 : 0));
    if (k === "all") set(Object.keys(S.layer));
    if (k === "meridian") set(["skin", "qijing", "jing12", "current"]);
    if (k === "organ") set(["skin", "organs", "sanjiao", "fate"]);
    if (k === "now") set(["skin", "current", "fate"]);
    if (k === "base") {
      Object.assign(S.layer.skin, { on: 1, op: 0.72 });
      Object.assign(S.layer.qijing, { on: 1, op: 0.82 });
      Object.assign(S.layer.jing12, { on: 1, op: 0.68 });
      Object.assign(S.layer.organs, { on: 1, op: 0.75 });
      Object.assign(S.layer.sanjiao, { on: 1, op: 0.72 });
      Object.assign(S.layer.current, { on: 1, op: 1 });
      Object.assign(S.layer.fate, { on: 1, op: 0.88 });
    }
    syncControls();
    applyVisibility();
  }
  function syncControls() {
    Object.keys(S.layer).forEach((k) => {
      const c = q(`[data-bd83-on="${k}"]`),
        r = q(`[data-bd83-op="${k}"]`);
      if (c) c.checked = !!S.layer[k].on;
      if (r) r.value = S.layer[k].op;
    });
  }
  async function init() {
    const host = q("#bd83Stage");
    if (!host) return;
    if (S.host === host && S.renderer) {
      buildAll();
      return;
    }
    dispose();
    S.host = host;
    try {
      await ensure3D();
      if (!host.isConnected) return;
      const sc = (S.scene = new THREE.Scene());
      sc.fog = new THREE.FogExp2(0x0b1019, 0.035);
      const cam = (S.camera = new THREE.PerspectiveCamera(34, 1, 0.05, 50));
      cam.position.set(0, 0.16, 6.3);
      const ren = (S.renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
      }));
      ren.setPixelRatio(Math.min(2, devicePixelRatio || 1));
      ren.shadowMap.enabled = true;
      ren.shadowMap.type = THREE.PCFSoftShadowMap;
      ren.outputEncoding = THREE.sRGBEncoding;
      ren.toneMapping = THREE.ACESFilmicToneMapping;
      ren.toneMappingExposure = 1.04;
      host.insertBefore(ren.domElement, q("#bd83Status", host));
      const ctl = (S.controls = new THREE.OrbitControls(cam, ren.domElement));
      ctl.enableDamping = true;
      ctl.dampingFactor = 0.065;
      ctl.enablePan = true;
      ctl.minDistance = 2.8;
      ctl.maxDistance = 11;
      ctl.target.set(0, 0.03, 0);
      ctl.autoRotate = !!S.auto;
      ctl.autoRotateSpeed = 0.58;
      sc.add(new THREE.HemisphereLight(0xf5ead2, 0x101b2a, 1.15));
      const key = new THREE.DirectionalLight(0xffedcc, 2.2);
      key.position.set(3.8, 5.5, 4.4);
      key.castShadow = true;
      sc.add(key);
      const fill = new THREE.DirectionalLight(0x8ebeff, 1.0);
      fill.position.set(-4, 2.5, 2.4);
      sc.add(fill);
      const rim = new THREE.DirectionalLight(0xffb867, 1.25);
      rim.position.set(2.2, 3, -5);
      sc.add(rim);
      const grid = new THREE.GridHelper(7, 14, 0x8d7348, 0x2e2b27);
      grid.position.y = -2.03;
      grid.material.opacity = 0.2;
      grid.material.transparent = true;
      sc.add(grid);
      const floor = new THREE.Mesh(
        new THREE.PlaneGeometry(9, 9),
        new THREE.ShadowMaterial({ color: 0x000000, opacity: 0.2 }),
      );
      floor.rotation.x = -Math.PI / 2;
      floor.position.y = -2.04;
      floor.receiveShadow = true;
      sc.add(floor);
      const rg = new THREE.Mesh(
        new THREE.RingGeometry(1.84, 1.88, 96),
        new THREE.MeshBasicMaterial({
          color: 0xb28b4c,
          transparent: true,
          opacity: 0.2,
          side: THREE.DoubleSide,
        }),
      );
      rg.rotation.x = -Math.PI / 2;
      rg.position.y = -2.01;
      sc.add(rg);

      ["qijing", "jing12", "organs", "sanjiao", "current", "fate"].forEach((k) => {
        S.groups[k] = new THREE.Group();
        S.groups[k].name = "v83-" + k;
        sc.add(S.groups[k]);
      });

      const loader = new THREE.GLTFLoader(),
        load = (u) => new Promise((res, rej) => loader.load(u, res, undefined, rej));
      status("", "<b>加载真实人体模型…</b><span>正在获取 GLB 与纹理。</span>");
      let gltf;
      try {
        gltf = await load(MODEL);
      } catch (e) {
        status("", "<b>主模型失败，切换备用模型…</b>");
        gltf = await load(MODEL_FALLBACK);
      }
      if (!host.isConnected) {
        disposeObj(gltf.scene);
        return;
      }
      const model = (S.model = gltf.scene);
      fitModel(model);
      model.traverse((o) => {
        if (o.isMesh) {
          o.castShadow = true;
          o.receiveShadow = true;
          if (o.material) {
            const ms = Array.isArray(o.material) ? o.material : [o.material];
            const clones = ms.map((m) => m.clone());
            o.material = Array.isArray(o.material) ? clones : clones[0];
            clones.forEach((m) => S.skinMaterials.push(m));
          }
        }
      });
      sc.add(model);
      if (gltf.animations?.length) {
        const idle = gltf.animations.find((c) => /idle/i.test(c.name)) || gltf.animations[0];
        S.mixer = new THREE.AnimationMixer(model);
        S.mixer.clipAction(idle).play();
      }
      buildAll();
      status(
        "ok",
        "<b>分层 3D 已加载</b><span>图层可独立控制；当前子午流注和命主五行会同步高亮。</span>",
      );

      const resize = () => {
        if (!ren || !host.isConnected) return;
        const r = host.getBoundingClientRect(),
          w = Math.max(320, r.width),
          h = Math.max(400, r.height);
        ren.setSize(w, h, false);
        cam.aspect = w / h;
        cam.updateProjectionMatrix();
      };
      S.resize = new ResizeObserver(resize);
      S.resize.observe(host);
      resize();
      S.clock = new THREE.Clock();
      const loop = () => {
        if (!S.renderer || !host.isConnected) return;
        S.raf = requestAnimationFrame(loop);
        const dt = Math.min(0.04, S.clock.getDelta());
        S.mixer?.update(dt);
        ctl.autoRotate = !!S.auto;
        ctl.update();
        const g = group("current");
        if (g && S.layer.current.on) {
          const pu = 1 + 0.1 * Math.sin(performance.now() * 0.004);
          g.scale.setScalar(pu);
        }
        ren.render(sc, cam);
      };
      loop();
    } catch (e) {
      console.error(e);
      status("err", "<b>3D 加载失败</b><span>网络或 WebGL 不可用。二维人体图仍可继续使用。</span>");
    }
  }
  window.bd83Init = init;

  function bind() {
    qa("[data-bd83-view]").forEach((b) => (b.onclick = () => view(b.dataset.bd83View)));
    q("#bd83Auto")?.addEventListener("change", (e) => (S.auto = e.target.checked ? 1 : 0));
    q("#bd83Fs")?.addEventListener("click", async () => {
      const s = q("#bd83Stage");
      if (!s) return;
      try {
        if (document.fullscreenElement) await document.exitFullscreen();
        else await s.requestFullscreen();
      } catch (_) {
        if (typeof toast === "function") toast("当前浏览器不允许全屏");
      }
    });
    qa("[data-bd83-on]").forEach(
      (c) =>
        (c.onchange = () => {
          S.layer[c.dataset.bd83On].on = c.checked ? 1 : 0;
          applyVisibility();
        }),
    );
    qa("[data-bd83-op]").forEach(
      (r) =>
        (r.oninput = () => {
          S.layer[r.dataset.bd83Op].op = +r.value;
          applyVisibility();
        }),
    );
    qa("[data-bd83-focus]").forEach((b) => (b.onclick = () => focusLayer(b.dataset.bd83Focus)));
    qa("[data-bd83-solo]").forEach((b) => (b.onclick = () => solo(b.dataset.bd83Solo)));
    qa("[data-bd83-pre]").forEach((b) => (b.onclick = () => preset(b.dataset.bd83Pre)));
    q("#bd83Stage")?.addEventListener("dblclick", (e) => {
      if (e.target.tagName === "CANVAS") view("reset");
    });
  }
  window.bd83Bind = bind;

  /* 经络人体页绑定改为：3D 不随二维对象点击反复重载，只更新高亮。 */
  window.bdBind = function () {
    const rerender = () => {
      dispose();
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
          rerender();
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
          if (S.renderer) buildAll();
          updateRight();
        }),
    );
    bind();
    init();
  };

  /* 子午流注切换时同步当前经络层。 */
  const _jl83 = window.jlSelect;
  window.jlSelect = function (i) {
    _jl83(i);
    if (S.renderer) {
      buildCurrent();
      buildFate();
      applyVisibility();
    }
  };

  /* 退出经络页时释放 WebGL。 */
  document.addEventListener(
    "click",
    (e) => {
      const t = e.target.closest?.(".tab[data-tab]");
      if (t && t.dataset.tab !== "jingluo" && q("#bd83Stage"))
        setTimeout(() => {
          if (!q("#pane-jingluo")?.classList.contains("on")) dispose();
        }, 80);
    },
    true,
  );

  try {
    if (q("#pane-jingluo")?.classList.contains("on") && window.R) jingluoRefresh();
  } catch (_) {}

  try {
    const bv = q("#buildVersion");
  } catch (_) {}
})();
