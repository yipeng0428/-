(() => {
  const TS = "2026-10-04 02:49:18";
  const q = (s, r = document) => r.querySelector(s),
    qa = (s, r = document) => Array.from(r.querySelectorAll(s));
  const MODEL =
    "https://cdn.jsdelivr.net/gh/kunalkushwaha/vsim@main/packages/assets/library/human.glb";
  const MODEL_FALLBACK =
    "https://cdn.jsdelivr.net/gh/KhronosGroup/glTF-Sample-Assets@main/Models/CesiumMan/glTF-Binary/CesiumMan.glb";
  const LIBS = [
    "https://cdn.jsdelivr.net/npm/three@0.128.0/build/three.min.js",
    "https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/GLTFLoader.js",
    "https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js",
  ];
  const BDREAL = (window.BDREAL = window.BDREAL || {
    renderer: null,
    scene: null,
    camera: null,
    controls: null,
    mixer: null,
    clock: null,
    raf: 0,
    host: null,
    model: null,
    overlay: null,
    markers: null,
    meridians: null,
    current: null,
    resize: null,
    opts: { meridian: 1, organs: 1, current: 1, auto: 0 },
  });

  function loadScript(url) {
    return new Promise((resolve, reject) => {
      if ([...document.scripts].some((s) => s.src === url)) {
        resolve();
        return;
      }
      const s = document.createElement("script");
      s.src = url;
      s.async = true;
      s.crossOrigin = "anonymous";
      s.onload = resolve;
      s.onerror = () => reject(new Error("无法加载 " + url));
      document.head.appendChild(s);
    });
  }
  async function ensure3D() {
    if (window.THREE && THREE.GLTFLoader && THREE.OrbitControls) return;
    for (const u of LIBS) await loadScript(u);
  }
  function disposeObj(o) {
    if (!o) return;
    o.traverse?.((x) => {
      if (x.geometry) x.geometry.dispose?.();
      if (x.material) {
        const ms = Array.isArray(x.material) ? x.material : [x.material];
        ms.forEach((m) => {
          Object.keys(m).forEach((k) => {
            const v = m[k];
            if (v && v.isTexture) v.dispose?.();
          });
          m.dispose?.();
        });
      }
    });
  }
  function disposeReal() {
    cancelAnimationFrame(BDREAL.raf || 0);
    try {
      BDREAL.resize?.disconnect();
    } catch (_) {}
    try {
      BDREAL.controls?.dispose();
    } catch (_) {}
    try {
      disposeObj(BDREAL.scene);
    } catch (_) {}
    try {
      BDREAL.renderer?.dispose();
    } catch (_) {}
    if (BDREAL.renderer?.domElement?.parentNode) BDREAL.renderer.domElement.remove();
    Object.assign(BDREAL, {
      renderer: null,
      scene: null,
      camera: null,
      controls: null,
      mixer: null,
      clock: null,
      raf: 0,
      host: null,
      model: null,
      overlay: null,
      markers: null,
      meridians: null,
      current: null,
      resize: null,
    });
  }
  window.bdRealDispose = disposeReal;

  function real3DInfo() {
    if (!BD.sel)
      return `<h4>空间图层</h4><p>真实 3D 人体作为空间底图。切换“奇经八脉 / 五脏六腑 / 三焦·丹田”后，会叠加对应的三维线条或点位。点击下方二维图或子午流注联动，也会把当前对象同步到 3D 高亮。</p>`;
    const a = BD_QJ.find((x) => x.k === BD.sel);
    if (a) return `<h4>${a.n} · 3D 高亮</h4><p>${a.plain}</p>`;
    const o = BD_ZF.find((x) => x.k === BD.sel);
    if (o) return `<h4>${o.n} · ${o.wx}</h4><p>${o.zhu}。${o.jl}，传统当令为 ${o.sc}时。</p>`;
    const s = BD_SJ.find((x) => x.k === BD.sel) || BD_DT.find((x) => x.k === BD.sel);
    if (s) return `<h4>${s.n}</h4><p>${s.txt}</p>`;
    return "";
  }
  function real3DHTML() {
    const O = BDREAL.opts;
    return `<div class="bdreal-shell">
    <div class="bdreal-toolbar">
      <div class="group" aria-label="标准视角">
        <button type="button" class="gbtn sm" data-bdreal-view="front">正面</button>
        <button type="button" class="gbtn sm" data-bdreal-view="left">左侧</button>
        <button type="button" class="gbtn sm" data-bdreal-view="back">背面</button>
        <button type="button" class="gbtn sm" data-bdreal-view="right">右侧</button>
        <button type="button" class="gbtn sm" data-bdreal-view="reset">复位</button>
      </div>
      <span class="spacer"></span>
      <label><input type="checkbox" id="bdRealMer"${O.meridian ? " checked" : ""}> 经络线</label>
      <label><input type="checkbox" id="bdRealOrg"${O.organs ? " checked" : ""}> 脏腑点</label>
      <label><input type="checkbox" id="bdRealCur"${O.current ? " checked" : ""}> 当前高亮</label>
      <label><input type="checkbox" id="bdRealAuto"${O.auto ? " checked" : ""}> 自动环视</label>
      <button type="button" class="gbtn sm" id="bdRealFs">放大</button>
    </div>
    <div class="bdreal-stage" id="bdRealStage">
      <span class="bdreal-badge">REAL 3D · WebGL</span>
      <div class="bdreal-status" id="bdRealStatus"><b>加载 3D 人体…</b><span>首次打开需要联网获取开源模型。</span></div>
    </div>
    <div class="bdreal-cardgrid">
      <div class="bdreal-info" id="bdRealInfo">${real3DInfo()}</div>
      <div class="bdreal-info"><h4>操作</h4><p>左键拖动旋转 · 滚轮缩放 · 右键拖动平移。标准视角可以快速切到正、背、左右侧；开启自动环视后，人物会像太阳系 3D 模块一样缓慢展示空间关系。</p>
        <div class="bdreal-legend"><span><i style="background:#d9b25f"></i>当前选中</span><span><i style="background:#5aa6c8"></i>经络</span><span><i style="background:#e0655a"></i>脏腑</span><span><i style="background:#4fae8f"></i>三焦 / 丹田</span></div>
        <p class="bdreal-credit">主 3D 人体模型使用 MakeHuman / MPFB 生成的 CC0 示例资产，经 vsim 项目分发；若主模型加载失败则使用 Khronos glTF Sample Assets 的 CesiumMan 备用模型（© Cesium，CC BY 4.0）。Three.js 负责实时渲染。模型只作为结构与空间关系的教学底图，不用于医学定位。</p>
      </div>
    </div>
   </div>`;
  }

  /* 替换上一版的“伪3D卡片”为真正的 WebGL 3D，二维精读图继续保留。 */
  window.bd3dHTML = real3DHTML;

  function mat(color, opacity = 0.82, em = 0.18) {
    return new THREE.MeshStandardMaterial({
      color,
      transparent: opacity < 1,
      opacity,
      roughness: 0.48,
      metalness: 0.04,
      emissive: new THREE.Color(color),
      emissiveIntensity: em,
      depthWrite: opacity > 0.6,
    });
  }
  function tube(points, color, r = 0.018, opacity = 0.78) {
    const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)));
    return new THREE.Mesh(
      new THREE.TubeGeometry(curve, 42, r, 8, false),
      mat(color, opacity, 0.22),
    );
  }
  function sphere(pos, color, r = 0.075, opacity = 0.86) {
    const m = new THREE.Mesh(new THREE.SphereGeometry(r, 20, 14), mat(color, opacity, 0.3));
    m.position.set(...pos);
    return m;
  }
  function torus(pos, color, major = 0.38, minor = 0.015) {
    const m = new THREE.Mesh(new THREE.TorusGeometry(major, minor, 8, 64), mat(color, 0.72, 0.2));
    m.rotation.x = Math.PI / 2;
    m.position.set(...pos);
    return m;
  }
  function clearGroup(g) {
    while (g && g.children.length) {
      const x = g.children.pop();
      disposeObj(x);
    }
  }

  const organPos = {
    xin: [-0.1, 0.55, 0.28],
    feiL: [-0.24, 0.76, 0.22],
    feiR: [0.24, 0.76, 0.22],
    gan: [-0.24, 0.22, 0.24],
    pi: [0.25, 0.18, 0.14],
    wei: [0.1, 0.09, 0.25],
    xc: [0, -0.36, 0.23],
    dc: [0, -0.28, 0.18],
    pg: [0, -0.78, 0.22],
    shenL: [-0.2, 0.06, -0.2],
    shenR: [0.2, 0.06, -0.2],
    xb: [-0.08, 0.55, 0.31],
  };
  function addOrgans() {
    const g = BDREAL.markers;
    if (!g) return;
    const items = [
      ["fei", "#d8d6ce", organPos.feiL],
      ["fei", "#d8d6ce", organPos.feiR],
      ["xin", "#e0655a", organPos.xin],
      ["gan", "#4fae8f", organPos.gan],
      ["pi", "#d9b25f", organPos.pi],
      ["wei", "#d9b25f", organPos.wei],
      ["xc", "#e0655a", organPos.xc],
      ["dc", "#d8d6ce", organPos.dc],
      ["pg", "#5a91c8", organPos.pg],
      ["shen", "#5a91c8", organPos.shenL],
      ["shen", "#5a91c8", organPos.shenR],
      ["xb", "#c8452e", organPos.xb],
    ];
    items.forEach(([k, c, p]) => {
      const s = sphere(p, c, k === "fei" ? 0.13 : 0.09, 0.76);
      s.userData.bd = k;
      g.add(s);
    });
  }
  function addMeridians() {
    const g = BDREAL.meridians;
    if (!g) return;
    const lines = [
      [
        "ren",
        "#5aa6c8",
        [
          [0, -0.86, 0.36],
          [0, -0.45, 0.38],
          [0, 0.1, 0.4],
          [0, 0.66, 0.37],
          [0, 1.23, 0.26],
        ],
      ],
      [
        "du",
        "#d9b25f",
        [
          [0, -0.85, -0.34],
          [0, -0.35, -0.38],
          [0, 0.15, -0.4],
          [0, 0.74, -0.36],
          [0, 1.3, -0.16],
        ],
      ],
      [
        "chong",
        "#c8452e",
        [
          [-0.08, -0.72, 0.31],
          [-0.08, -0.22, 0.35],
          [-0.08, 0.35, 0.34],
          [-0.07, 0.82, 0.29],
        ],
      ],
      [
        "chong",
        "#c8452e",
        [
          [0.08, -0.72, 0.31],
          [0.08, -0.22, 0.35],
          [0.08, 0.35, 0.34],
          [0.07, 0.82, 0.29],
        ],
      ],
      [
        "yinq",
        "#9a7ad0",
        [
          [-0.13, -1.72, 0.08],
          [-0.12, -0.95, 0.1],
          [-0.09, -0.15, 0.22],
          [-0.07, 0.63, 0.26],
          [-0.06, 1.28, 0.18],
        ],
      ],
      [
        "yangq",
        "#e0904a",
        [
          [0.23, -1.72, -0.01],
          [0.27, -0.95, -0.02],
          [0.3, -0.15, -0.06],
          [0.33, 0.68, -0.06],
          [0.23, 1.2, -0.1],
        ],
      ],
      [
        "yinw",
        "#6fb7a8",
        [
          [-0.2, -1.32, 0.05],
          [-0.18, -0.55, 0.12],
          [-0.15, 0.1, 0.2],
          [-0.08, 0.88, 0.22],
        ],
      ],
      [
        "yangw",
        "#b9a24f",
        [
          [0.3, -1.42, -0.08],
          [0.34, -0.62, -0.1],
          [0.38, 0.18, -0.12],
          [0.3, 0.92, -0.12],
        ],
      ],
    ];
    lines.forEach(([k, c, p]) => {
      const t = tube(p, c, k === "ren" || k === "du" ? 0.022 : 0.014, 0.72);
      t.userData.bd = k;
      g.add(t);
    });
    const d = torus([0, -0.08, 0], "#4fae8f", 0.43, 0.018);
    d.userData.bd = "dai";
    g.add(d);
  }
  function addSJ() {
    const g = BDREAL.markers;
    if (!g) return;
    [
      ["sj1", 0.66, "#e0655a"],
      ["sj2,.0", "#d9b25f"],
    ].forEach(() => {});
    const bands = [
      ["sj1", 0.62, "#e0655a"],
      ["sj2", 0.04, "#d9b25f"],
      ["sj3", -0.58, "#5aa6c8"],
    ];
    bands.forEach(([k, y, c]) => {
      const t = torus([0, y, 0], c, 0.36, 0.012);
      t.userData.bd = k;
      g.add(t);
    });
    [
      ["dt1", [0, 1.34, 0.12]],
      ["dt2", [0, 0.58, 0.26]],
      ["dt3", [0, -0.48, 0.25]],
    ].forEach(([k, p]) => {
      const s = sphere(p, "#d9b25f", 0.07, 0.9);
      s.userData.bd = k;
      g.add(s);
    });
  }
  function applyOverlay() {
    if (!BDREAL.overlay) return;
    clearGroup(BDREAL.markers);
    clearGroup(BDREAL.meridians);
    if (BDREAL.opts.meridian && (BD.layer === "qj" || BD.layer === "zf")) addMeridians();
    if (BDREAL.opts.organs && BD.layer === "zf") addOrgans();
    if (BD.layer === "sj") addSJ();
    [...(BDREAL.markers?.children || []), ...(BDREAL.meridians?.children || [])].forEach((x) => {
      const on = BD.sel && x.userData.bd === BD.sel;
      x.userData.baseScale = x.scale.x || 1;
      if (on) x.scale.setScalar(1.32);
      if (x.material && on) {
        x.material.emissiveIntensity = 0.85;
        x.material.opacity = 1;
      }
    });
    const info = q("#bdRealInfo");
    if (info) info.innerHTML = real3DInfo();
  }
  window.bdRealApplyOverlay = applyOverlay;

  function fitModel(model) {
    const box0 = new THREE.Box3().setFromObject(model),
      size0 = box0.getSize(new THREE.Vector3());
    const s = 4.0 / Math.max(0.001, size0.y);
    model.scale.setScalar(s);
    model.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(model),
      center = box.getCenter(new THREE.Vector3());
    model.position.sub(center);
    model.updateMatrixWorld(true);
  }
  function setStatus(cls, html) {
    const s = q("#bdRealStatus");
    if (!s) return;
    s.className = "bdreal-status " + (cls || "");
    s.innerHTML = html;
  }
  function cameraView(k) {
    const c = BDREAL.camera,
      ctl = BDREAL.controls;
    if (!c || !ctl) return;
    const d = 6.4,
      y = 0.05;
    const pos = {
      front: [0, y, d],
      back: [0, y, -d],
      left: [-d, y, 0],
      right: [d, y, 0],
      reset: [0, 0.15, 6.4],
    }[k] || [0, y, d];
    c.position.set(...pos);
    ctl.target.set(0, 0.05, 0);
    ctl.update();
  }
  function addSceneDecor(scene) {
    const grid = new THREE.GridHelper(7, 14, 0x78633e, 0x342e24);
    grid.position.y = -2.03;
    grid.material.opacity = 0.22;
    grid.material.transparent = true;
    scene.add(grid);
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(1.85, 1.88, 96),
      new THREE.MeshBasicMaterial({
        color: 0xa88645,
        transparent: true,
        opacity: 0.22,
        side: THREE.DoubleSide,
      }),
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = -2.01;
    scene.add(ring);
    const geo = new THREE.BufferGeometry(),
      pts = [];
    for (let i = 0; i < 160; i++) {
      const a = i * 0.754,
        r = 2.8 + (i % 11) * 0.08,
        yy = (((i * 37) % 100) / 100) * 4 - 2;
      pts.push(Math.cos(a) * r, yy, Math.sin(a) * r);
    }
    geo.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
    scene.add(
      new THREE.Points(
        geo,
        new THREE.PointsMaterial({
          color: 0xd9b25f,
          size: 0.018,
          transparent: true,
          opacity: 0.28,
        }),
      ),
    );
  }
  async function initReal3D() {
    const host = q("#bdRealStage");
    if (!host) return;
    if (BDREAL.host === host && BDREAL.renderer) {
      applyOverlay();
      return;
    }
    disposeReal();
    BDREAL.host = host;
    try {
      await ensure3D();
      if (!document.body.contains(host)) return;
      const scene = (BDREAL.scene = new THREE.Scene());
      scene.fog = new THREE.FogExp2(0x101621, 0.035);
      const camera = (BDREAL.camera = new THREE.PerspectiveCamera(34, 1, 0.05, 50));
      camera.position.set(0, 0.15, 6.4);
      const renderer = (BDREAL.renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
      }));
      renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.outputEncoding = THREE.sRGBEncoding;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.05;
      host.insertBefore(renderer.domElement, q("#bdRealStatus", host));
      const ctl = (BDREAL.controls = new THREE.OrbitControls(camera, renderer.domElement));
      ctl.enableDamping = true;
      ctl.dampingFactor = 0.065;
      ctl.enablePan = true;
      ctl.minDistance = 3.0;
      ctl.maxDistance = 11;
      ctl.target.set(0, 0.05, 0);
      ctl.autoRotate = !!BDREAL.opts.auto;
      ctl.autoRotateSpeed = 0.65;
      scene.add(new THREE.HemisphereLight(0xf4e8cf, 0x182033, 1.15));
      const key = new THREE.DirectionalLight(0xffefd2, 2.15);
      key.position.set(3.6, 5.2, 4.5);
      key.castShadow = true;
      scene.add(key);
      const fill = new THREE.DirectionalLight(0x9fc7ff, 1.05);
      fill.position.set(-4, 2.5, 2);
      scene.add(fill);
      const rim = new THREE.DirectionalLight(0xffc36a, 1.3);
      rim.position.set(2.2, 3.2, -5);
      scene.add(rim);
      addSceneDecor(scene);
      const overlay = (BDREAL.overlay = new THREE.Group()),
        markers = (BDREAL.markers = new THREE.Group()),
        mer = (BDREAL.meridians = new THREE.Group());
      overlay.add(markers);
      overlay.add(mer);
      scene.add(overlay);
      const floor = new THREE.Mesh(
        new THREE.PlaneGeometry(9, 9),
        new THREE.ShadowMaterial({ color: 0x000000, opacity: 0.18 }),
      );
      floor.rotation.x = -Math.PI / 2;
      floor.position.y = -2.04;
      floor.receiveShadow = true;
      scene.add(floor);

      const loader = new THREE.GLTFLoader();
      const load = (url) => new Promise((res, rej) => loader.load(url, res, undefined, rej));
      setStatus("", "<b>加载真实人体模型…</b><span>正在获取 CC0 GLB 与纹理。</span>");
      let gltf;
      try {
        gltf = await load(MODEL);
      } catch (e) {
        setStatus("", "<b>主模型加载失败，切换备用模型…</b>");
        gltf = await load(MODEL_FALLBACK);
      }
      if (!document.body.contains(host)) {
        disposeObj(gltf.scene);
        return;
      }
      const model = (BDREAL.model = gltf.scene);
      fitModel(model);
      model.traverse((o) => {
        if (o.isMesh) {
          o.castShadow = true;
          o.receiveShadow = true;
          if (o.material) {
            o.material.side = THREE.FrontSide;
            o.material.needsUpdate = true;
          }
        }
      });
      scene.add(model);
      if (gltf.animations && gltf.animations.length) {
        const idle = gltf.animations.find((c) => /idle/i.test(c.name)) || gltf.animations[0];
        const mixer = (BDREAL.mixer = new THREE.AnimationMixer(model));
        const action = mixer.clipAction(idle);
        action.play();
      }
      applyOverlay();
      setStatus(
        "ok",
        "<b>真实 3D 已加载</b><span>拖动旋转 · 滚轮缩放 · 右键平移；经络/脏腑图层可联动当前选择。</span>",
      );

      const resize = () => {
        if (!renderer || !host.isConnected) return;
        const r = host.getBoundingClientRect(),
          w = Math.max(320, r.width),
          h = Math.max(360, r.height);
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
      };
      BDREAL.resize = new ResizeObserver(resize);
      BDREAL.resize.observe(host);
      resize();
      BDREAL.clock = new THREE.Clock();
      const loop = () => {
        if (!BDREAL.renderer || !host.isConnected) return;
        BDREAL.raf = requestAnimationFrame(loop);
        const dt = Math.min(0.04, BDREAL.clock.getDelta());
        BDREAL.mixer?.update(dt);
        ctl.autoRotate = !!BDREAL.opts.auto;
        ctl.update();
        const pulse = 1 + 0.1 * Math.sin(performance.now() * 0.004);
        if (BDREAL.opts.current && BD.sel) {
          [...(markers.children || []), ...(mer.children || [])].forEach((x) => {
            if (x.userData.bd === BD.sel) x.scale.setScalar(1.25 * pulse);
          });
        }
        renderer.render(scene, camera);
      };
      loop();
    } catch (err) {
      console.error(err);
      setStatus(
        "err",
        "<b>真实 3D 加载失败</b><span>当前浏览器或网络未能取得 WebGL 模型。下方二维人体图仍可正常使用。</span>",
      );
    }
  }
  window.bdRealInit = initReal3D;

  function bindRealControls() {
    qa("[data-bdreal-view]").forEach((b) => (b.onclick = () => cameraView(b.dataset.bdrealView)));
    const set = (id, k, fn) => {
      const e = q(id);
      if (e)
        e.onchange = () => {
          BDREAL.opts[k] = e.checked ? 1 : 0;
          fn?.();
        };
    };
    set("#bdRealMer", "meridian", applyOverlay);
    set("#bdRealOrg", "organs", applyOverlay);
    set("#bdRealCur", "current", applyOverlay);
    set("#bdRealAuto", "auto");
    q("#bdRealFs")?.addEventListener("click", async () => {
      const s = q("#bdRealStage");
      if (!s) return;
      try {
        if (document.fullscreenElement) await document.exitFullscreen();
        else await s.requestFullscreen();
      } catch (_) {
        if (typeof toast === "function") toast("当前浏览器不允许全屏");
      }
    });
  }

  /* 重建经络人体绑定：真实 3D + 原二维图共同联动。 */
  window.bdBind = function () {
    const re = () => {
      disposeReal();
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
          re();
        }),
    );
    bindRealControls();
    initReal3D();
  };

  /* 子午流注“人体图谱定位”会触发 bdHTML 重绘；真实 3D 自动显示对应脏腑。 */
  try {
    if (q("#pane-jingluo")?.classList.contains("on") && window.R) jingluoRefresh();
  } catch (_) {}

  /* 离开经络页时释放 GPU；回到经络页后由 bdBind 重新初始化。 */
  document.addEventListener(
    "click",
    (e) => {
      const tab = e.target.closest?.(".tab[data-tab]");
      if (tab && tab.dataset.tab !== "jingluo" && q("#bdRealStage"))
        setTimeout(() => {
          if (!q("#pane-jingluo")?.classList.contains("on")) disposeReal();
        }, 80);
    },
    true,
  );

  try {
    const bv = q("#buildVersion");
  } catch (_) {}
})();
