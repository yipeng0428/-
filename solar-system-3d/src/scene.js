/*
 * scene.js — three.js 渲染层
 *
 * 尺度说明（刻意的失真，必须说清楚）：
 *  · 天体半径与轨道半径使用两套独立缩放，否则在同一张图里：
 *    真实比例下地球直径只有日地距离的 1/11700，屏幕上不足一个像素。
 *  · 轨道距离默认按 sqrt(r) 压缩，使水星到海王星同屏可读；
 *    打开「真实距离比例」后改为线性，可直观感受内外太阳系的空旷程度。
 *  · 方向、相位、倾角、偏心率是真实的——被压缩的只有半径标度。
 */

var Scene = (function () {
  // 压缩模式用对数映射 d = K·ln(1 + r/r0)：幂函数会把金星—地球挤在一起，
  // 对数映射在内太阳系保留间距，同时把外行星收进同一屏。
  var COMP_K = 18.0;
  var COMP_R0 = 0.2;
  var TRUE_K = 8.0;    // 真实模式：d = TRUE_K * r_AU（线性，用于直观感受空旷程度）
  var SUN_RADIUS = 2.2;

  var renderer, scene, camera, raycaster, labelLayer;
  var bodies = {};          // id -> { group, tilt, mesh, pick, orbit, label, spec, visualRadius }
  var pickList = [];
  var marker;
  var pendingFocus = null;
  var trueScale = false;
  var selectedId = null, hoveredId = null;
  var pointer = new THREE.Vector2(-10, -10);
  var hasPointer = false;
  var onPickCb = null;
  var cam;                  // 相机控制器
  var tmpV = new THREE.Vector3();

  /* ───────── 距离映射 ───────── */
  function distScale(rAU) {
    return trueScale ? TRUE_K * rAU : COMP_K * Math.log(1 + rAU / COMP_R0);
  }

  /** 黄道坐标(AU, z 指向黄北极) → three 世界坐标(y 向上)，并施加距离压缩。*/
  function toWorld(st, out) {
    var r = st.r || Math.sqrt(st.x * st.x + st.y * st.y + st.z * st.z) || 1e-9;
    var k = distScale(r) / r;
    return out.set(st.x * k, st.z * k, -st.y * k);
  }

  function visualRadius(radiusKm) {
    var rel = radiusKm / 6371;
    return Math.min(3.0, Math.max(0.26, 0.8 * Math.pow(rel, 0.4)));
  }

  /* ───────── 程序化纹理（不依赖外部贴图，离线可用） ───────── */
  function hash(x, y) {
    var h = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
    return h - Math.floor(h);
  }
  function noise(x, y) {
    var xi = Math.floor(x), yi = Math.floor(y);
    var xf = x - xi, yf = y - yi;
    var u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
    return (hash(xi, yi) * (1 - u) + hash(xi + 1, yi) * u) * (1 - v) +
           (hash(xi, yi + 1) * (1 - u) + hash(xi + 1, yi + 1) * u) * v;
  }
  function fbm(x, y, oct) {
    var s = 0, amp = 0.5, f = 1;
    for (var i = 0; i < oct; i++) { s += amp * noise(x * f, y * f); amp *= 0.5; f *= 2; }
    return s;
  }

  function makeBodyTexture(spec) {
    var W = 512, H = 256;
    var cv = document.createElement('canvas');
    cv.width = W; cv.height = H;
    var ctx = cv.getContext('2d');
    var img = ctx.createImageData(W, H);
    var base = new THREE.Color(spec.color);
    var seed = (spec.en || 'x').charCodeAt(0) * 7.31;
    var band = spec.band || 0.2;

    for (var y = 0; y < H; y++) {
      var lat = (y / H) * 2 - 1;                       // −1..1
      for (var x = 0; x < W; x++) {
        var u = x / W * 10 + seed, v = y / H * 6 + seed;
        var n = fbm(u, v, 4);
        var shade;
        if (spec.earthlike) {
          var land = fbm(u * 0.9, v * 1.5, 5);
          var ice = Math.abs(lat) > 0.76 + 0.06 * n;
          var cloud = Math.max(0, fbm(u * 1.6 + 40, v * 2.4, 3) - 0.56) * 2.6;
          var c;
          if (ice) c = [0.92, 0.95, 0.99];
          else if (land > 0.53) {
            var dry = Math.abs(lat) < 0.28 && land > 0.61;
            c = dry ? [0.52, 0.44, 0.28] : [0.20, 0.42, 0.24];
            c = [c[0] * (0.8 + 0.4 * n), c[1] * (0.8 + 0.4 * n), c[2] * (0.8 + 0.4 * n)];
          } else {
            c = [0.05 + 0.08 * n, 0.19 + 0.12 * n, 0.46 + 0.16 * n];
          }
          var cw = Math.min(1, cloud);
          img.data[(y * W + x) * 4]     = 255 * (c[0] * (1 - cw) + 0.95 * cw);
          img.data[(y * W + x) * 4 + 1] = 255 * (c[1] * (1 - cw) + 0.96 * cw);
          img.data[(y * W + x) * 4 + 2] = 255 * (c[2] * (1 - cw) + 0.98 * cw);
          img.data[(y * W + x) * 4 + 3] = 255;
          continue;
        }
        // 气体巨行星：纬向条纹 + 湍流；岩石天体：各向同性颗粒
        var stripes = Math.sin(lat * 14 + n * 2.6 + seed) * 0.5 + 0.5;
        shade = 1 + band * (stripes - 0.5) * 0.9 + (n - 0.5) * (0.42 - band * 0.22);
        if (spec.isSun) {
          var gran = fbm(u * 3.2, v * 3.2, 3);
          shade = 1 + (gran - 0.5) * 0.3;
        }
        shade *= 1 - 0.18 * Math.pow(Math.abs(lat), 3);   // 极区稍暗，增强球体感
        var i4 = (y * W + x) * 4;
        img.data[i4]     = Math.min(255, 255 * base.r * shade);
        img.data[i4 + 1] = Math.min(255, 255 * base.g * shade);
        img.data[i4 + 2] = Math.min(255, 255 * base.b * shade);
        img.data[i4 + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
    var tex = new THREE.CanvasTexture(cv);
    if ('colorSpace' in tex && THREE.SRGBColorSpace) tex.colorSpace = THREE.SRGBColorSpace;
    else if ('encoding' in tex && THREE.sRGBEncoding) tex.encoding = THREE.sRGBEncoding;
    tex.anisotropy = 4;
    return tex;
  }

  function makeGlowTexture(inner) {
    var S = 128;
    var cv = document.createElement('canvas');
    cv.width = cv.height = S;
    var ctx = cv.getContext('2d');
    var g = ctx.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
    g.addColorStop(0, 'rgba(255,255,255,' + (inner ? 0.95 : 0.5) + ')');
    g.addColorStop(0.16, 'rgba(255,228,170,' + (inner ? 0.55 : 0.28) + ')');
    g.addColorStop(0.45, 'rgba(255,170,70,0.12)');
    g.addColorStop(1, 'rgba(255,140,40,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, S, S);
    return new THREE.CanvasTexture(cv);
  }

  function makeRingTexture(color) {
    var W = 256;
    var cv = document.createElement('canvas');
    cv.width = W; cv.height = 4;
    var ctx = cv.getContext('2d');
    var c = new THREE.Color(color);
    for (var x = 0; x < W; x++) {
      var t = x / W;
      var gap = (t > 0.46 && t < 0.52) ? 0.15 : 1;        // 类卡西尼环缝
      var a = (0.25 + 0.6 * Math.abs(Math.sin(t * 34)) * (1 - Math.pow(Math.abs(t - 0.5) * 2, 2))) * gap;
      ctx.fillStyle = 'rgba(' + Math.round(c.r * 255) + ',' + Math.round(c.g * 255) + ',' +
        Math.round(c.b * 255) + ',' + a.toFixed(3) + ')';
      ctx.fillRect(x, 0, 1, 4);
    }
    return new THREE.CanvasTexture(cv);
  }

  /* ───────── 相机控制（自写，避免依赖 examples/jsm） ───────── */
  function CameraRig(cameraRef, dom) {
    this.cam = cameraRef;
    this.dom = dom;
    this.target = new THREE.Vector3(0, 0, 0);
    this.goal = new THREE.Vector3(0, 0, 0);   // 目标点的期望值（阻尼跟随）
    this.dist = 230;
    this.desired = 230;
    this.theta = Math.PI * 0.32;   // 方位角
    this.phi = 0.92;               // 极角（0 = 正上方俯视）
    this.minDist = 1.0;
    this.maxDist = 1400;
    this.dragging = false;
    this.panning = false;
    this.pointers = {};
    this.lastPinch = 0;
    this.moved = 0;
    var self = this;

    dom.addEventListener('pointerdown', function (e) {
      dom.setPointerCapture(e.pointerId);
      self.pointers[e.pointerId] = { x: e.clientX, y: e.clientY };
      var n = Object.keys(self.pointers).length;
      if (n === 1) {
        self.dragging = true;
        self.panning = e.shiftKey || e.button === 1 || e.button === 2;
        self.moved = 0;
        dom.classList.add('dragging');
      }
      if (n === 2) self.lastPinch = self.pinchDist();
    });

    dom.addEventListener('pointermove', function (e) {
      var p = self.pointers[e.pointerId];
      if (!p) return;
      var dx = e.clientX - p.x, dy = e.clientY - p.y;
      p.x = e.clientX; p.y = e.clientY;
      var n = Object.keys(self.pointers).length;
      if (n >= 2) {
        var d = self.pinchDist();
        if (self.lastPinch > 0) self.zoom(self.lastPinch / d);
        self.lastPinch = d;
        return;
      }
      if (!self.dragging) return;
      self.moved += Math.abs(dx) + Math.abs(dy);
      if (self.panning) self.pan(dx, dy);
      else {
        self.theta -= dx * 0.005;
        self.phi = Math.max(0.04, Math.min(Math.PI - 0.04, self.phi - dy * 0.005));
      }
    });

    function release(e) {
      delete self.pointers[e.pointerId];
      if (Object.keys(self.pointers).length === 0) {
        self.dragging = false; self.panning = false;
        dom.classList.remove('dragging');
      }
      self.lastPinch = 0;
    }
    dom.addEventListener('pointerup', release);
    dom.addEventListener('pointercancel', release);
    dom.addEventListener('contextmenu', function (e) { e.preventDefault(); });

    dom.addEventListener('wheel', function (e) {
      e.preventDefault();
      self.zoom(Math.pow(1.0013, e.deltaY));
    }, { passive: false });
  }
  CameraRig.prototype.pinchDist = function () {
    var ks = Object.keys(this.pointers);
    if (ks.length < 2) return 0;
    var a = this.pointers[ks[0]], b = this.pointers[ks[1]];
    return Math.hypot(a.x - b.x, a.y - b.y);
  };
  CameraRig.prototype.zoom = function (f) {
    this.desired = Math.max(this.minDist, Math.min(this.maxDist, this.desired * f));
  };
  CameraRig.prototype.pan = function (dx, dy) {
    var s = this.dist * 0.0016;
    var right = new THREE.Vector3().setFromMatrixColumn(this.cam.matrix, 0);
    var up = new THREE.Vector3().setFromMatrixColumn(this.cam.matrix, 1);
    this.target.addScaledVector(right, -dx * s).addScaledVector(up, dy * s);
    this.goal.copy(this.target);
  };
  /** 阻尼系数与帧率无关：k = 1 − e^(−dt/τ)，低帧率下也能在同样的时间内收敛 */
  CameraRig.prototype.damp = function (dt) {
    var k = 1 - Math.exp(-dt * 5.0);
    this.target.lerp(this.goal, k);
    this.dist += (this.desired - this.dist) * k;
  };
  CameraRig.prototype.update = function () {
    var sp = Math.sin(this.phi), cp = Math.cos(this.phi);
    this.cam.position.set(
      this.target.x + this.dist * sp * Math.sin(this.theta),
      this.target.y + this.dist * cp,
      this.target.z + this.dist * sp * Math.cos(this.theta)
    );
    this.cam.lookAt(this.target);
  };

  /* ───────── 构建 ───────── */
  function init(container, list) {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x04060a);

    camera = new THREE.PerspectiveCamera(46, window.innerWidth / window.innerHeight, 0.05, 6000);

    renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    if ('outputColorSpace' in renderer && THREE.SRGBColorSpace) renderer.outputColorSpace = THREE.SRGBColorSpace;
    else if ('outputEncoding' in renderer && THREE.sRGBEncoding) renderer.outputEncoding = THREE.sRGBEncoding;
    container.appendChild(renderer.domElement);

    labelLayer = document.getElementById('labels');
    raycaster = new THREE.Raycaster();
    cam = new CameraRig(camera, renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 0.14));
    var sunLight = new THREE.PointLight(0xfff2dd, 2.4, 0, 0);   // decay 0：日照强度不随距离衰减
    scene.add(sunLight);

    buildStars();

    for (var i = 0; i < list.length; i++) buildBody(list[i]);

    // 选中标记：始终面向相机的细圆环
    var ringGeo = new THREE.RingGeometry(1.0, 1.016, 96);
    marker = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({
      color: 0xbfe2ff, transparent: true, opacity: 0.5, side: THREE.DoubleSide, depthWrite: false
    }));
    marker.visible = false;
    scene.add(marker);

    window.addEventListener('resize', onResize);
    renderer.domElement.addEventListener('pointermove', function (e) {
      pointer.set((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1);
      hasPointer = true;
    });
    renderer.domElement.addEventListener('pointerleave', function () { hasPointer = false; });
    renderer.domElement.addEventListener('click', function () {
      if (cam.moved > 6) return;           // 拖拽结束不算点击
      onPickCb && onPickCb(hoveredId);
    });
    return { camera: camera, renderer: renderer, rig: cam };
  }

  function buildStars() {
    var N = 3600;
    var pos = new Float32Array(N * 3), col = new Float32Array(N * 3);
    for (var i = 0; i < N; i++) {
      var u = Math.random() * 2 - 1, a = Math.random() * Math.PI * 2;
      var s = Math.sqrt(1 - u * u), R = 1600 + Math.random() * 600;
      pos[i * 3] = R * s * Math.cos(a);
      pos[i * 3 + 1] = R * u;
      pos[i * 3 + 2] = R * s * Math.sin(a);
      var t = Math.random();
      var warm = t > 0.82, cool = t < 0.14;
      var b = 0.45 + Math.pow(Math.random(), 2.2) * 0.55;
      col[i * 3]     = b * (warm ? 1 : cool ? 0.78 : 0.95);
      col[i * 3 + 1] = b * (warm ? 0.88 : 0.95);
      col[i * 3 + 2] = b * (warm ? 0.7 : 1);
    }
    var g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    scene.add(new THREE.Points(g, new THREE.PointsMaterial({
      size: 1.7, sizeAttenuation: false, vertexColors: true, transparent: true, opacity: 0.95
    })));
  }

  function buildBody(spec) {
    var group = new THREE.Group();
    scene.add(group);

    var vr = spec.isSun ? SUN_RADIUS : visualRadius(spec.radiusKm);
    var tex = makeBodyTexture(spec);
    var mat = spec.isSun
      ? new THREE.MeshBasicMaterial({ map: tex })
      : new THREE.MeshStandardMaterial({ map: tex, roughness: 0.88, metalness: 0.0 });

    var tilt = new THREE.Group();
    tilt.rotation.z = (spec.tilt || 0) * Math.PI / 180;
    group.add(tilt);

    var mesh = new THREE.Mesh(new THREE.SphereGeometry(vr, 48, 32), mat);
    tilt.add(mesh);

    if (spec.isSun) {
      var glow = new THREE.Sprite(new THREE.SpriteMaterial({
        map: makeGlowTexture(true), color: 0xffffff, transparent: true,
        blending: THREE.AdditiveBlending, depthWrite: false, depthTest: false
      }));
      glow.scale.setScalar(vr * 5.6);
      group.add(glow);
    } else {
      // 大气辉光：略大的背面球，加法混合 → 边缘出现一圈薄光
      var atmo = new THREE.Mesh(
        new THREE.SphereGeometry(vr * 1.1, 32, 20),
        new THREE.MeshBasicMaterial({
          color: spec.color, transparent: true, opacity: spec.earthlike ? 0.16 : 0.1,
          side: THREE.BackSide, blending: THREE.AdditiveBlending, depthWrite: false
        })
      );
      tilt.add(atmo);
    }

    if (spec.ring) {
      var rg = new THREE.RingGeometry(vr * spec.ring[0], vr * spec.ring[1], 128, 1);
      // 把 UV 的 u 重映射为「沿半径的归一化位置」，否则环纹会沿方位角铺开
      var p = rg.attributes.position, uv = rg.attributes.uv;
      var inner = vr * spec.ring[0], outer = vr * spec.ring[1];
      for (var i = 0; i < p.count; i++) {
        var d = Math.hypot(p.getX(i), p.getY(i));
        uv.setXY(i, (d - inner) / (outer - inner), 0.5);
      }
      uv.needsUpdate = true;
      var ring = new THREE.Mesh(rg, new THREE.MeshBasicMaterial({
        map: makeRingTexture(spec.color), transparent: true, side: THREE.DoubleSide,
        depthWrite: false, opacity: 0.9
      }));
      ring.rotation.x = Math.PI / 2;    // 环位于天体赤道面
      tilt.add(ring);
    }

    // 拾取用的放大球（材质全透明，但保持 visible 以便 raycast）
    var pick = new THREE.Mesh(
      new THREE.SphereGeometry(Math.max(vr * 2.4, 1.1), 16, 12),
      new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })
    );
    pick.userData.bodyId = spec.id;
    group.add(pick);
    pickList.push(pick);

    // 轨道线
    var orbit = null;
    if (!spec.isSun) {
      var geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array((spec.segments + 1) * 3), 3));
      orbit = new THREE.Line(geo, new THREE.LineBasicMaterial({
        color: spec.color, transparent: true, opacity: 0.26
      }));
      scene.add(orbit);
    }

    // 标签
    var label = document.createElement('div');
    label.className = 'label';
    label.textContent = spec.name;
    label.dataset.bodyId = spec.id;
    labelLayer.appendChild(label);

    bodies[spec.id] = {
      spec: spec, group: group, tilt: tilt, mesh: mesh, pick: pick,
      orbit: orbit, label: label, visualRadius: vr, spin: 0
    };
  }

  /* ───────── 每帧更新 ───────── */

  /**
   * @param states        id -> 轨道状态（AU 黄道坐标）
   * @param simDaysDelta  本帧推进的模拟天数（用于自转）
   * @param dtReal        本帧真实秒数（用于与帧率无关的相机阻尼）
   * @param followId      需要跟随的天体 id
   */
  function update(states, simDaysDelta, dtReal, followId) {
    for (var id in bodies) {
      var b = bodies[id];
      var st = states[id];
      if (!st) continue;
      toWorld(st, tmpV);
      b.group.position.copy(tmpV);

      // 自转：高倍速下限制单帧转角，避免频闪
      var rotH = b.spec.rotationH || 24;
      var dRot = (simDaysDelta * 24 / rotH) * Math.PI * 2;
      if (Math.abs(dRot) > 0.3) dRot = 0.3 * Math.sign(dRot);
      b.spin = (b.spin + dRot) % (Math.PI * 2);
      b.mesh.rotation.y = b.spin;
    }

    // 对焦请求要等到位置更新之后才能落点（否则切换比例尺时会对到旧坐标）
    if (pendingFocus) {
      var pb = bodies[pendingFocus.id];
      if (pb) {
        cam.goal.copy(pb.group.position);
        cam.desired = pendingFocus.dist;
        if (pendingFocus.instant) { cam.target.copy(cam.goal); cam.dist = cam.desired; }
      }
      pendingFocus = null;
    }

    if (followId && bodies[followId]) cam.goal.copy(bodies[followId].group.position);

    cam.damp(dtReal || 0.016);
    cam.update();
    updateHover();
    updateMarker();
    updateLabels();
    renderer.render(scene, camera);
  }

  /** 重算轨道线顶点（根数随时间缓变，低频调用即可） */
  function refreshOrbits(sampleFn) {
    for (var id in bodies) {
      var b = bodies[id];
      if (!b.orbit) continue;
      var pts = sampleFn(id);
      var arr = b.orbit.geometry.attributes.position.array;
      for (var i = 0; i < pts.length; i++) {
        toWorld(pts[i], tmpV);
        arr[i * 3] = tmpV.x; arr[i * 3 + 1] = tmpV.y; arr[i * 3 + 2] = tmpV.z;
      }
      b.orbit.geometry.attributes.position.needsUpdate = true;
      b.orbit.geometry.computeBoundingSphere();
    }
  }

  function updateHover() {
    if (!hasPointer) { setHovered(null); return; }
    raycaster.setFromCamera(pointer, camera);
    var visible = pickList.filter(function (p) { return bodies[p.userData.bodyId].group.visible; });
    var hits = raycaster.intersectObjects(visible, false);
    setHovered(hits.length ? hits[0].object.userData.bodyId : null);
  }

  function setHovered(id) {
    if (id === hoveredId) return;
    hoveredId = id;
    renderer.domElement.classList.toggle('over-body', !!id);
  }

  function updateMarker() {
    var b = selectedId && bodies[selectedId];
    if (!b || !b.group.visible) { marker.visible = false; return; }
    marker.visible = true;
    marker.position.copy(b.group.position);
    marker.quaternion.copy(camera.quaternion);
    // 标记随距离放大，保持屏幕尺寸大致恒定
    var d = camera.position.distanceTo(b.group.position);
    marker.scale.setScalar(Math.max(b.visualRadius * 1.55, d * 0.03));
  }

  function updateLabels() {
    for (var id in bodies) {
      var b = bodies[id];
      if (!b.group.visible || !labelsOn) { b.label.style.display = 'none'; continue; }
      tmpV.copy(b.group.position).project(camera);
      if (tmpV.z > 1 || Math.abs(tmpV.x) > 1.2 || Math.abs(tmpV.y) > 1.2) {
        b.label.style.display = 'none';
        continue;
      }
      var x = (tmpV.x * 0.5 + 0.5) * window.innerWidth;
      var y = (-tmpV.y * 0.5 + 0.5) * window.innerHeight;
      var d = camera.position.distanceTo(b.group.position);
      var px = b.visualRadius / Math.max(d, 0.1) * window.innerHeight * 0.9;
      b.label.style.display = 'block';
      b.label.style.left = x + 'px';
      b.label.style.top = (y + Math.min(Math.max(px, 9), 70) + 10) + 'px';
      b.label.classList.toggle('active', id === selectedId || id === hoveredId);
    }
  }

  /* ───────── 外部接口 ───────── */
  var labelsOn = true;

  function onResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }

  function setSelected(id) {
    selectedId = id;
    for (var k in bodies) {
      var b = bodies[k];
      if (b.orbit) b.orbit.material.opacity = (k === id) ? 0.75 : 0.26;
      b.label.classList.toggle('active', k === id);
    }
  }

  function focusOn(id, instant) {
    if (!bodies[id]) return;
    pendingFocus = {
      id: id,
      dist: bodies[id].spec.isSun ? 46 : Math.max(bodies[id].visualRadius * 9, 7),
      instant: !!instant
    };
  }

  function frameAll() {
    pendingFocus = null;
    cam.goal.set(0, 0, 0);
    // 竖屏时水平视场更窄，需要退得更远才能把海王星轨道收进画面
    var aspect = window.innerWidth / Math.max(window.innerHeight, 1);
    var fit = aspect < 1.25 ? 1.25 / aspect : 1;
    cam.desired = (trueScale ? 560 : 268) * fit;
  }

  return {
    init: init,
    update: update,
    refreshOrbits: refreshOrbits,
    setSelected: setSelected,
    focusOn: focusOn,
    frameAll: frameAll,
    getHovered: function () { return hoveredId; },
    onPick: function (cb) { onPickCb = cb; },
    setOrbitsVisible: function (v) {
      for (var k in bodies) if (bodies[k].orbit) bodies[k].orbit.visible = v;
    },
    setLabelsVisible: function (v) { labelsOn = v; },
    setBodyVisible: function (id, v) {
      if (!bodies[id]) return;
      bodies[id].group.visible = v;
      if (bodies[id].orbit) bodies[id].orbit.visible = v && orbitsOnRef();
      bodies[id].label.style.display = v ? 'block' : 'none';
    },
    setTrueScale: function (v) { trueScale = v; },
    isTrueScale: function () { return trueScale; },
    labelElements: function () { return labelLayer.querySelectorAll('.label'); },
    rig: function () { return cam; }
  };

  function orbitsOnRef() {
    var any = null;
    for (var k in bodies) if (bodies[k].orbit) { any = bodies[k].orbit.visible; break; }
    return any === null ? true : any;
  }
})();
