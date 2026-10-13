/**
 * 场景搭建与主循环
 * ---------------------------------------------------------------
 * 坐标系约定：
 *   星历输出为 J2000 日心黄道坐标 (x, y, z)，右手系，z 指向黄北极。
 *   three.js 场景用 y 轴朝上，因此映射为 (x, z, −y)，行列式为 +1，
 *   手性保持不变 —— 从黄北极俯视时行星逆时针公转，与真实一致。
 *
 * 比例问题（可视化绕不开的取舍）：
 *   真实比例下，如果太阳画成 1 像素，海王星在 2.4 米外，行星全部不可见。
 *   因此默认用两套压缩：距离取 √r（保持次序与相对疏密），
 *   半径取 (R/R⊕)^0.4（小天体仍可见、大天体不至于霸屏）。
 *   面板里可一键切回真实比例，直观感受"太阳系有多空"。
 */
(function (global) {
  'use strict';

  const SS = (global.SolarSystem = global.SolarSystem || {});
  const THREE = global.THREE;
  const E = SS.Ephemeris;

  const AU_UNITS = 10;        // 真实距离模式下 1 AU = 10 场景单位
  const DEG = Math.PI / 180;

  const state = {
    jd: E.julianDay(new Date()),
    live: true,               // 跟随真实时间（"实时"模式）
    speed: 1,                 // 模拟秒 / 真实秒
    paused: false,
    // 比例模型三选一（取代原来的两个复选框 + 尺寸放大滑杆）：
    //   schematic    距离 √r 压缩 + 半径 (R/R⊕)^0.4 压缩
    //   realDistance 距离线性真实 + 半径仍为示意值
    //   real         距离与半径都按同一公里换算，1:1 真实比例，无任何放大
    scaleMode: 'schematic',
    realDistance: false,   // 由 scaleMode 派生，供下面的映射函数直接使用
    realSize: false,
    showOrbits: true,
    showLabels: true,
    showMarkers: true,        // 定位标记：固定像素大小，真实比例下靠它找到行星
    selected: null,
    focus: null,
    sunCapped: false,
    moonCompressed: false,    // 地月间距是否被压缩显示
    scale: { auPer100px: NaN, local: true },  // 屏幕比例尺（UI 读取）
    outOfRange: null,         // 超出星历有效区间时的提示
  };

  const ctx = {
    renderer: null, scene: null, camera: null, controls: null,
    bodies: new Map(),        // key -> { def, group, spin, mesh, ring, halo, orbit, state, scenePos, radius }
    sunLight: null,
    hovered: null,
    pointer: { x: 0, y: 0 },
    clock: null,
  };

  /* ------------------------- 比例映射 ------------------------- */

  function distanceScale(rAU) {
    return state.realDistance ? AU_UNITS * rAU : AU_UNITS * Math.sqrt(rAU);
  }

  function schematicRadius(body) {
    // 以地球为 1 做 0.4 次幂压缩：109 倍的太阳只被放大到 6.5 倍
    if (body.parent) {
      // 卫星改为相对母星压缩，否则 0.4 次幂会把月球画成地球的 6 成大（真实只有 27%）
      const parent = SS.BODY_BY_KEY[body.parent];
      return 0.38 * Math.pow(parent.radiusKm / 6371, 0.4) * Math.pow(body.radiusKm / parent.radiusKm, 0.75);
    }
    return 0.38 * Math.pow(body.radiusKm / 6371, 0.4);
  }

  function trueRadius(body) {
    return (body.radiusKm / E.AU_KM) * AU_UNITS;
  }

  function displayRadius(body) {
    const raw = state.realSize ? trueRadius(body) : schematicRadius(body);
    // 防御性上限：任何天体都不得大于自身轨道半径的 0.45（太阳以水星轨道为参照），
    // 否则"真实尺寸 + 大放大倍数"会让太阳吞掉内行星、场景直接失去可读性。
    // 限幅一旦生效就在界面上标注出来，避免把"被截断的尺寸"误读成真实比例。
    const refAU = body.isSun ? 0.387 : (body.key && ctx.bodies.get(body.key)?.state?.r) || 1;
    // 0.42：刚好让默认的示意比例不触发限幅（示意太阳半径 ≈ 水星轨道的 0.397），
    // 同时仍能挡住"真实距离 + 示意半径"这类会让太阳盖住水星轨道的组合
    const cap = distanceScale(refAU) * (body.isSun ? 0.42 : 0.45);
    if (body.isSun) state.sunCapped = raw > cap;
    return Math.min(raw, cap);
  }

  function auToScene(p, out) {
    const r = Math.sqrt(p.x * p.x + p.y * p.y + p.z * p.z);
    const k = r > 0 ? distanceScale(r) / r : 0;
    return out.set(p.x * k, p.z * k, -p.y * k);
  }

  /* ------------------------- 场景构建 ------------------------- */

  function buildStarfield() {
    const count = 7000;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const R = 2600;
    let seed = 1337;
    const rnd = () => {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      return seed / 4294967296;
    };
    for (let i = 0; i < count; i += 1) {
      // 球面均匀采样
      const u = rnd() * 2 - 1;
      const t = rnd() * Math.PI * 2;
      const s = Math.sqrt(1 - u * u);
      positions[i * 3] = R * s * Math.cos(t);
      positions[i * 3 + 1] = R * u;
      positions[i * 3 + 2] = R * s * Math.sin(t);
      // 恒星色温：偏蓝到偏橙，大多数偏暗
      const warm = rnd();
      const lum = 0.35 + Math.pow(rnd(), 2.2) * 0.65;
      colors[i * 3] = (0.78 + warm * 0.22) * lum;
      colors[i * 3 + 1] = (0.82 + warm * 0.10) * lum;
      colors[i * 3 + 2] = (1.0 - warm * 0.18) * lum;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    const sprite = new THREE.CanvasTexture(SS.Textures.starSpriteTexture(32));
    sprite.colorSpace = THREE.SRGBColorSpace;
    const mat = new THREE.PointsMaterial({
      size: 2.4, sizeAttenuation: false, map: sprite, transparent: true,
      depthWrite: false, vertexColors: true, blending: THREE.AdditiveBlending,
    });
    const points = new THREE.Points(geo, mat);
    points.frustumCulled = false;
    return points;
  }

  function makeTexture(canvas) {
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    tex.wrapS = THREE.RepeatWrapping;
    return tex;
  }

  function buildBody(def) {
    const group = new THREE.Group();
    const spin = new THREE.Group();
    group.add(spin);

    const size = def.isSun || def.radiusKm > 20000 ? 1024 : 512;
    const tex = makeTexture(SS.Textures.surfaceCanvasFor(def, size));
    const segments = def.isSun || def.radiusKm > 20000 ? 64 : 48;
    const geo = new THREE.SphereGeometry(1, segments, segments / 2);

    let mat;
    if (def.isSun) {
      mat = new THREE.MeshBasicMaterial({ map: tex });
    } else {
      mat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.92, metalness: 0.0 });
    }
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = def.key;
    spin.add(mesh);

    // 转轴倾角：绕场景 x 轴倾斜（忽略倾角节点的方位，属示意性简化）
    spin.rotation.z = def.tiltDeg * DEG;

    let ring = null;
    if (def.ring) {
      const ringGeo = new THREE.RingGeometry(def.ring.inner, def.ring.outer, 180, 1);
      // RingGeometry 默认是平面 UV，这里改写成"沿半径 0→1"，才能用一维剖面贴图
      const pos = ringGeo.attributes.position;
      const uv = ringGeo.attributes.uv;
      for (let i = 0; i < pos.count; i += 1) {
        const r = Math.hypot(pos.getX(i), pos.getY(i));
        uv.setXY(i, (r - def.ring.inner) / (def.ring.outer - def.ring.inner), 0.5);
      }
      const ringTex = makeTexture(SS.Textures.ringTexture());
      ringTex.wrapS = THREE.ClampToEdgeWrapping;
      ring = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({
        map: ringTex, transparent: true, side: THREE.DoubleSide,
        depthWrite: false, opacity: 0.95,
      }));
      ring.rotation.x = Math.PI / 2;   // 环面与赤道面重合
      spin.add(ring);
    }

    if (def.isSun) {
      const glowTex = makeTexture(SS.Textures.glowTexture(256, [255, 240, 200], [255, 150, 40], 2.6));
      const inner = new THREE.Sprite(new THREE.SpriteMaterial({
        map: glowTex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.85,
      }));
      inner.name = 'sunGlowInner';
      const outer = new THREE.Sprite(new THREE.SpriteMaterial({
        map: glowTex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.32,
      }));
      outer.name = 'sunGlowOuter';
      group.add(inner, outer);
      group.userData.glow = [inner, outer];
    }

    // 定位标记：恒定屏幕尺寸的空心圆环
    const markerTex = makeTexture(SS.Textures.ringSpriteTexture(96, 0.16));
    const marker = new THREE.Sprite(new THREE.SpriteMaterial({
      map: markerTex, color: new THREE.Color(def.color).lerp(new THREE.Color(0xffffff), 0.45),
      transparent: true, depthWrite: false, depthTest: false, opacity: 0.32,
    }));
    marker.renderOrder = 5;
    group.add(marker);

    // 选中指示环（始终面向相机）
    const haloTex = makeTexture(SS.Textures.glowTexture(128, [255, 255, 255], [120, 200, 255], 1.1));
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({
      map: haloTex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.0,
    }));
    group.add(halo);

    return { def, group, spin, mesh, ring, halo, marker, scenePos: new THREE.Vector3(), state: null, radius: 1 };
  }

  function buildOrbit(def) {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(256 * 3), 3));
    const mat = new THREE.LineBasicMaterial({
      color: new THREE.Color(def.color).lerp(new THREE.Color(0xffffff), 0.25),
      transparent: true, opacity: 0.38, depthWrite: false,
    });
    const line = new THREE.LineLoop(geo, mat);
    line.frustumCulled = false;
    return line;
  }

  function refreshOrbits() {
    const tmp = new THREE.Vector3();
    SS.ORBITING.forEach((def) => {
      const entry = ctx.bodies.get(def.key);
      if (!entry || !entry.orbit) return;
      const samples = E.orbitSamples(def.key, state.jd, 256);
      const attr = entry.orbit.geometry.attributes.position;
      for (let i = 0; i < samples.length; i += 1) {
        auToScene(samples[i], tmp);
        attr.setXYZ(i, tmp.x, tmp.y, tmp.z);
      }
      attr.needsUpdate = true;
      entry.orbit.geometry.computeBoundingSphere();
    });
  }

  /* ------------------------- 初始化 ------------------------- */

  function init() {
    const canvas = document.getElementById('scene');
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas, antialias: true, powerPreference: 'high-performance',
        // 真实比例下场景跨越约 5 个数量级，线性深度缓冲会严重 z-fighting
        logarithmicDepthBuffer: true,
      });
    } catch (err) {
      SS.UI.fatal('浏览器未能创建 WebGL 上下文，无法渲染 3D 场景。请更新浏览器或开启硬件加速。');
      throw err;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(window.innerWidth, window.innerHeight, false);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x03050c);

    const camera = new THREE.PerspectiveCamera(46, window.innerWidth / window.innerHeight, 0.002, 12000);

    scene.add(buildStarfield());
    scene.add(new THREE.AmbientLight(0x8095b8, 0.16));

    const sunLight = new THREE.PointLight(0xfff4e0, 2.6, 0, 0); // decay=0：让外行星也可见
    scene.add(sunLight);

    SS.BODIES.forEach((def) => {
      const entry = buildBody(def);
      scene.add(entry.group);
      if (!def.isSun && !def.parent) {
        entry.orbit = buildOrbit(def);
        scene.add(entry.orbit);
      }
      ctx.bodies.set(def.key, entry);
    });

    const controls = new SS.OrbitCamera(camera, renderer.domElement, {
      distance: 105, polar: Math.PI * 0.30, azimuth: Math.PI * 0.18,
      // 完全真实比例下地球半径仅 4.3e-4 场景单位，最小距离必须足够小才能贴近观察
      minDistance: 0.0003, maxDistance: 2200,
    });
    controls.onClick = (ev) => {
      const hit = pickAt(ev.clientX, ev.clientY);
      if (!hit) { selectBody(null); return; }
      if (state.selected === hit) {
        // 点已选中的天体 = 切换锁定跟随（第一次点选中，再点一次锁定）
        toggleLock(hit);
      } else {
        selectBody(hit);
      }
    };

    ctx.renderer = renderer;
    ctx.scene = scene;
    ctx.camera = camera;
    ctx.controls = controls;
    ctx.sunLight = sunLight;
    ctx.clock = new THREE.Clock();

    window.addEventListener('resize', onResize);
    renderer.domElement.addEventListener('pointermove', onHover);
    renderer.domElement.addEventListener('dblclick', (ev) => {
      const hit = pickAt(ev.clientX, ev.clientY);
      if (hit) selectBody(hit, { focus: true });
    });

    refreshOrbits();
    updateBodies();      // 先算一遍位置，frameAll 才有参照
    frameAll(true);
    tick();
  }

  function onResize() {
    const w = window.innerWidth, h = window.innerHeight;
    ctx.camera.aspect = w / h;
    ctx.camera.updateProjectionMatrix();
    ctx.renderer.setSize(w, h, false);
  }

  /* ------------------------- 拾取（屏幕空间） ------------------------- */

  /**
   * 不用 Raycaster 对球体求交，而是把天体中心投影到屏幕再比较像素距离。
   * 原因：压缩比例下行星只有几个像素，射线求交几乎点不中；
   * 屏幕空间判定对"小目标"更宽容，也更符合用户预期。
   */
  const _proj = new THREE.Vector3();
  function pickAt(clientX, clientY) {
    const rect = ctx.renderer.domElement.getBoundingClientRect();
    const px = clientX - rect.left;
    const py = clientY - rect.top;
    let best = null, bestDist = Infinity;
    ctx.bodies.forEach((entry, key) => {
      _proj.copy(entry.scenePos).project(ctx.camera);
      if (_proj.z > 1 || _proj.z < -1) return;
      const sx = (_proj.x * 0.5 + 0.5) * rect.width;
      const sy = (-_proj.y * 0.5 + 0.5) * rect.height;
      const d = Math.hypot(sx - px, sy - py);
      const screenR = screenRadius(entry, rect.height);
      const tolerance = Math.max(16, screenR + 10);
      if (d < tolerance && d < bestDist) { bestDist = d; best = key; }
    });
    return best;
  }

  function screenRadius(entry, viewportHeight) {
    const dist = ctx.camera.position.distanceTo(entry.scenePos);
    if (dist <= 0) return 0;
    const worldPerPixel = (2 * Math.tan((ctx.camera.fov * DEG) / 2) * dist) / viewportHeight;
    return entry.radius / worldPerPixel;
  }

  function onHover(ev) {
    ctx.pointer.x = ev.clientX;
    ctx.pointer.y = ev.clientY;
    const hit = pickAt(ev.clientX, ev.clientY);
    if (hit !== ctx.hovered) {
      ctx.hovered = hit;
      ctx.renderer.domElement.style.cursor = hit ? 'pointer' : 'default';
      SS.UI.setHovered(hit);
    }
  }

  /** 聚焦某天体时的合适机位：带环的要留出环的余量 */
  function focusDistance(entry) {
    const factor = entry.def.ring ? 14 : 8;
    return Math.max(entry.radius * factor, 0.3);
  }

  /**
   * 把整个系统收进视野。参照取海王星（八大行星的外边界，冥王星轨道允许出画）。
   * 需要同时考虑画幅宽高比与相机俯角：俯角越小，黄道面在屏幕上的纵向投影压缩越多。
   */
  function frameAll(immediate) {
    const neptune = ctx.bodies.get('neptune');
    const ref = distanceScale(neptune && neptune.state ? neptune.state.r : 30) * 1.15;
    const t = Math.tan((ctx.camera.fov * DEG) / 2);
    const elevation = Math.abs(Math.PI / 2 - ctx.controls.polar);
    const dV = (ref * Math.max(0.3, Math.sin(elevation))) / t;
    const dH = ref / (t * Math.max(0.3, ctx.camera.aspect));
    ctx.controls.setDistance(Math.max(dV, dH), immediate);
  }

  function selectBody(key, opts) {
    const options = opts || {};
    if (key && state.focus && state.focus !== key) {
      // 选中了别的天体：解除旧锁定，但不要把镜头拉回太阳（用户只是想看另一个的数据）
      releaseLock(true);
    }
    state.selected = key;
    if (options.focus && key) focusBody(key);
    else if (!key) releaseLock(true);
    SS.UI.setSelected(key);
  }

  /** 锁定 / 解除锁定：锁定后相机注视点每帧跟随该天体，旋转与平移照常可用 */
  function toggleLock(key) {
    if (state.focus === key) releaseLock(true);
    else focusBody(key);
    SS.UI.setSelected(state.selected);
  }

  /**
   * 解除锁定。keepView=true 时画面原地不动：把当前注视点转存进平移偏移，
   * 基准点回到原点后两者相加仍是同一个点，因此不会出现"镜头被吸回太阳"的突兀滑动。
   */
  function releaseLock(keepView) {
    if (!state.focus && !keepView) return;
    state.focus = null;
    if (keepView) ctx.controls.panOffset.copy(ctx.controls.target);
    else { ctx.controls.resetPan(false); frameAll(false); }
  }

  /** 回到太阳总览：清平移、重新取景 */
  function goHome() {
    state.focus = null;
    ctx.controls.resetPan(false);
    ctx.controls.setTarget(_tmpVec.set(0, 0, 0));
    frameAll(false);
  }

  function focusBody(key) {
    if (!key) { goHome(); return; }
    state.focus = key;
    const entry = ctx.bodies.get(key);
    if (entry) {
      ctx.controls.resetPan(false);          // 换目标时复位平移，避免叠加上一个目标的偏移
      ctx.controls.setDistance(focusDistance(entry));
    }
  }

  /**
   * 切换比例模型。realDistance / realSize 只是派生标志，
   * 单一事实来源是 scaleMode，避免出现"真实尺寸但压缩距离"这类自相矛盾的组合。
   */
  function setScaleMode(mode) {
    if (mode !== 'schematic' && mode !== 'realDistance' && mode !== 'real') return;
    state.scaleMode = mode;
    state.realDistance = mode !== 'schematic';
    state.realSize = mode === 'real';
    refreshOrbits();
    updateBodies();
    rescaleView();
  }

  /** 比例模式切换后，机位要跟着重新换算，否则视野会突然失真 */
  function rescaleView() {
    if (state.focus && ctx.bodies.has(state.focus)) {
      ctx.controls.setDistance(focusDistance(ctx.bodies.get(state.focus)));
    } else {
      frameAll(false);
    }
  }

  /* ------------------------- 主循环 ------------------------- */

  const _tmpVec = new THREE.Vector3();
  const _dir = new THREE.Vector3();

  function advanceTime(dtSeconds) {
    if (state.live) {
      state.jd = E.julianDay(new Date());
    } else if (!state.paused) {
      state.jd += (dtSeconds * state.speed) / 86400;
    }
    // 越界不阻止推进（看"几千年后行星在哪"本身是有趣的），但必须明确标注结果不可信
    const v = E.validity(state.jd);
    state.outOfRange = v.ok ? null : v.side;
  }

  function updateBodies() {
    const sunEntry = ctx.bodies.get('sun');
    sunEntry.scenePos.set(0, 0, 0);
    sunEntry.group.position.set(0, 0, 0);

    SS.ORBITING.forEach((def) => {
      const entry = ctx.bodies.get(def.key);
      entry.state = E.stateAt(def.key, state.jd);
      auToScene(entry.state.position, entry.scenePos);
      entry.group.position.copy(entry.scenePos);
    });

    // 卫星：方向用真实星历，间距按"显示放大倍数"反向压缩
    state.moonCompressed = false;
    SS.SATELLITES.forEach((def) => {
      const entry = ctx.bodies.get(def.key);
      const parent = ctx.bodies.get(def.parent);
      if (!parent || !parent.state) return;
      entry.state = E.moonState(state.jd, parent.state);
      entry.parentEntry = parent;
    });

    // 半径依赖 state.r（上限保护），因此放在位置更新之后
    ctx.bodies.forEach((entry) => {
      const r = displayRadius(entry.def);
      entry.radius = r;
      entry.mesh.scale.setScalar(r);
      if (entry.ring) entry.ring.scale.setScalar(r);
      if (entry.def.isSun && entry.group.userData.glow) {
        entry.group.userData.glow[0].scale.setScalar(r * 4.2);
        entry.group.userData.glow[1].scale.setScalar(r * 11);
      }
      // 自转：以 J2000 为零点，保证时间来回拖动时相位可复现
      const hours = entry.def.rotationHours;
      if (hours) {
        const days = Math.abs(hours) / 24;
        const sign = hours < 0 ? -1 : 1;
        entry.spin.rotation.y = sign * ((state.jd - E.JD_J2000) / days) * Math.PI * 2 % (Math.PI * 2);
      }
      const selected = state.selected === entry.def.key;
      const hovered = ctx.hovered === entry.def.key;
      entry.halo.material.opacity = selected ? 0.55 : (hovered ? 0.28 : 0);
      entry.halo.scale.setScalar(Math.max(r * 3.2, cameraRelativeSize(entry, 26)));
      if (entry.orbit) {
        entry.orbit.visible = state.showOrbits;
        entry.orbit.material.opacity = selected ? 0.8 : 0.34;
      }
    });

    // 卫星定位：必须等母星与自身的显示半径算完
    SS.SATELLITES.forEach((def) => {
      const entry = ctx.bodies.get(def.key);
      const parent = entry.parentEntry;
      if (!parent || !entry.state) return;
      placeSatellite(entry, parent);
    });

    updateMarkers();
  }

  /**
   * 卫星定位：方向取真实地心向量，距离按"母星被放大了多少倍"反向压缩。
   *   显示间距 = clamp(真实间距, 2.6·R母, 真实比值·R母)
   * 当没有任何尺寸夸张（真实尺寸 ×1）时，上限不生效，呈现真实的 60 倍地球半径间距；
   * 一旦把母星画大，间距就会被压到 2.6 倍半径，否则卫星会被母星吞掉。
   */
  function placeSatellite(entry, parent) {
    const geo = entry.state.geocentric;                    // AU，真实地心向量
    const trueSep = Math.sqrt(geo.x * geo.x + geo.y * geo.y + geo.z * geo.z) * AU_UNITS;
    const trueParentR = trueRadius(parent.def);
    const trueRatio = trueSep / trueParentR;               // 真实的"多少倍母星半径"≈60
    const minSep = parent.radius * 2.6;
    const maxSep = parent.radius * trueRatio;
    const sep = Math.max(minSep, Math.min(maxSep, trueSep));
    if (sep > trueSep * 1.0001 || sep < trueSep * 0.9999) state.moonCompressed = true;

    _dir.set(geo.x, geo.z, -geo.y);                        // 黄道 → 场景
    if (_dir.lengthSq() > 0) _dir.normalize();
    entry.scenePos.copy(parent.scenePos).addScaledVector(_dir, sep);
    entry.group.position.copy(entry.scenePos);

    if (entry.def.tidallyLocked) {
      // 潮汐锁定：纹理中心（u=0.5，即 +X 面）始终朝向母星
      const dx = parent.scenePos.x - entry.scenePos.x;
      const dz = parent.scenePos.z - entry.scenePos.z;
      entry.spin.rotation.y = -Math.atan2(dz, dx);
    }
  }

  /** 定位标记：恒定屏幕尺寸的空心环，天体本身够大时自动淡出 */
  function updateMarkers() {
    ctx.bodies.forEach((entry) => {
      const marker = entry.marker;
      if (!marker) return;
      if (!state.showMarkers) { marker.visible = false; return; }
      const screenR = screenRadius(entry, window.innerHeight);
      // 天体在屏幕上小于 9 px 才需要标记；大于 16 px 完全隐藏
      const fade = 1 - Math.min(1, Math.max(0, (screenR - 9) / 7));
      marker.visible = fade > 0.02;
      if (!marker.visible) return;
      marker.material.opacity = 0.32 * fade + (state.selected === entry.def.key ? 0.35 : 0);
      marker.scale.setScalar(cameraRelativeSize(entry, 26));
    });
  }

  function cameraRelativeSize(entry, pixels) {
    const dist = ctx.camera.position.distanceTo(entry.scenePos);
    const worldPerPixel = (2 * Math.tan((ctx.camera.fov * DEG) / 2) * dist) / window.innerHeight;
    return worldPerPixel * pixels;
  }

  /**
   * 屏幕比例尺：相机目标平面上横跨 100 px 相当于多少 AU。
   *
   * 压缩模式下映射是非线性的（d = 10√r），因此不能取导数——在太阳处
   * dr/dd → 0，会给出"100 px ≈ 33 km"这种荒谬读数。正确做法是取**割线**：
   * 把屏幕上相距 100 px 的两点各自逆映射回 AU 再求差。
   * 这个式子对线性模式同样成立（割线=切线），所以两种模式共用。
   *
   * 另需注意：压缩映射只作用于径向，切向比例并不相同，所以界面上标明"径向"。
   */
  function sceneToAU(sceneR) {
    const u = sceneR / AU_UNITS;
    return state.realDistance ? u : u * u;
  }

  function updateScaleBar() {
    const dist = ctx.controls.distance;
    const worldPerPixel = (2 * Math.tan((ctx.camera.fov * DEG) / 2) * dist) / window.innerHeight;
    const centerR = ctx.controls.target.length();
    const au = sceneToAU(centerR + worldPerPixel * 100) - sceneToAU(centerR);
    state.scale.auPer100px = au;
    state.scale.local = !state.realDistance;
  }

  function tick() {
    // 上限 0.5 s：后台标签页 rAF 停摆后 delta 会累积，不设限会在切回时瞬间跳过大段时间；
    // 设得太小又会让低帧率机器上的"X 天/秒"名不副实（0.1 s 时 4 fps 只能跑到四成速度）。
    const dt = Math.min(0.5, ctx.clock.getDelta());
    advanceTime(dt);
    updateBodies();

    if (state.focus && ctx.bodies.has(state.focus)) {
      ctx.controls.setTarget(ctx.bodies.get(state.focus).scenePos);
    } else {
      ctx.controls.setTarget(_tmpVec.set(0, 0, 0));
    }
    ctx.controls.apply(dt, false);

    // 相机进入内太阳系时缩小近裁剪面，避免贴近行星时被裁掉
    const near = Math.max(0.0008, ctx.controls.distance * 0.002);
    if (Math.abs(ctx.camera.near - near) / near > 0.2) {
      ctx.camera.near = near;
      ctx.camera.far = Math.max(4000, ctx.controls.distance * 60);
      ctx.camera.updateProjectionMatrix();
    }

    updateScaleBar();
    ctx.renderer.render(ctx.scene, ctx.camera);
    SS.UI.frame(ctx, state);
    requestAnimationFrame(tick);
  }

  SS.App = {
    state, ctx, init, selectBody, focusBody, toggleLock, releaseLock, goHome, refreshOrbits,
    distanceScale, displayRadius, screenRadius,
    setShowMarkers(v) { state.showMarkers = v; },
    setScaleMode,
    frameAll,
  };
})(typeof window !== 'undefined' ? window : globalThis);
