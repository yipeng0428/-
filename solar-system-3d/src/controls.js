/**
 * 轨道相机控制器（自写，不依赖 three 的 examples/jsm 插件）
 * ---------------------------------------------------------------
 * 自己写而不用 OrbitControls 的两个理由：
 *   1. 避免引入 addons（否则必须用 ES module + 本地服务器，file:// 直接失效）；
 *   2. 需要精确区分"拖拽旋转"与"点击选择"，自己掌握指针状态更干净。
 *
 * 操作：左键拖拽旋转 / 滚轮缩放 / 右键或中键平移 / 单指旋转 / 双指缩放。
 */
(function (global) {
  'use strict';

  const SS = (global.SolarSystem = global.SolarSystem || {});
  const THREE = global.THREE;

  const _v3a = new THREE.Vector3();
  const _v3b = new THREE.Vector3();

  const CLICK_PX = 6;      // 位移阈值：小于此值才算点击
  const CLICK_MS = 450;    // 时长阈值

  class OrbitCamera {
    constructor(camera, domElement, options) {
      const opts = options || {};
      this.camera = camera;
      this.dom = domElement;
      this.target = new THREE.Vector3();
      // 相机注视点 = 基准点（场景给的，可能每帧跟随天体）+ 平移偏移（用户拖出来的）
      // 两者分开是必须的：否则跟随逻辑每帧重设注视点，右键平移会在同一帧被抹掉。
      this.panOffset = new THREE.Vector3();
      this.azimuth = opts.azimuth !== undefined ? opts.azimuth : Math.PI * 0.25;
      this.polar = opts.polar !== undefined ? opts.polar : Math.PI * 0.32;
      this.distance = opts.distance || 60;
      this.minDistance = opts.minDistance || 0.01;
      this.maxDistance = opts.maxDistance || 4000;
      this.minPolar = 0.02;
      this.maxPolar = Math.PI - 0.02;
      this.dampingRate = 9;   // 阻尼速率（1/s），与帧率无关
      this.onClick = null;

      this._desired = { azimuth: this.azimuth, polar: this.polar, distance: this.distance };
      this._base = this.target.clone();
      this._targetDesired = this.target.clone();
      this._pointers = new Map();
      this._mode = null;
      this._downAt = 0;
      this._downPos = { x: 0, y: 0 };
      this._moved = 0;
      this._pinchStart = 0;

      this._bind();
      this.apply(0, true);
    }

    _bind() {
      const dom = this.dom;
      dom.style.touchAction = 'none';
      this._onDown = (e) => this._pointerDown(e);
      this._onMove = (e) => this._pointerMove(e);
      this._onUp = (e) => this._pointerUp(e);
      this._onWheel = (e) => this._wheel(e);
      this._onContext = (e) => e.preventDefault();
      dom.addEventListener('pointerdown', this._onDown);
      window.addEventListener('pointermove', this._onMove, { passive: false });
      window.addEventListener('pointerup', this._onUp);
      window.addEventListener('pointercancel', this._onUp);
      dom.addEventListener('wheel', this._onWheel, { passive: false });
      dom.addEventListener('contextmenu', this._onContext);
    }

    dispose() {
      const dom = this.dom;
      dom.removeEventListener('pointerdown', this._onDown);
      window.removeEventListener('pointermove', this._onMove);
      window.removeEventListener('pointerup', this._onUp);
      window.removeEventListener('pointercancel', this._onUp);
      dom.removeEventListener('wheel', this._onWheel);
      dom.removeEventListener('contextmenu', this._onContext);
    }

    _pointerDown(e) {
      this.dom.setPointerCapture?.(e.pointerId);
      this._pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (this._pointers.size === 1) {
        // 右键 / 中键 / Shift+左键 都是平移（触控板用户常没有右键）
        this._mode = (e.button === 2 || e.button === 1 || (e.button === 0 && e.shiftKey)) ? 'pan' : 'rotate';
        this._downAt = performance.now();
        this._downPos = { x: e.clientX, y: e.clientY };
        this._moved = 0;
      } else if (this._pointers.size === 2) {
        this._mode = 'pinch';
        this._pinchStart = this._pinchDistance();
        this._pinchBase = this._desired.distance;
      }
    }

    _pinchDistance() {
      const [a, b] = [...this._pointers.values()];
      return Math.hypot(a.x - b.x, a.y - b.y);
    }

    _pointerMove(e) {
      if (!this._pointers.has(e.pointerId)) return;
      const prev = this._pointers.get(e.pointerId);
      this._pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

      if (this._mode === 'pinch' && this._pointers.size >= 2) {
        const d = this._pinchDistance();
        if (this._pinchStart > 0) {
          this._desired.distance = this._clampDistance(this._pinchBase * (this._pinchStart / Math.max(1, d)));
        }
        return;
      }

      const dx = e.clientX - prev.x;
      const dy = e.clientY - prev.y;
      // 记录相对按下点的最大位移，用于区分"拖拽"与"点击"
      this._moved = Math.max(this._moved, Math.hypot(e.clientX - this._downPos.x, e.clientY - this._downPos.y));

      if (this._mode === 'rotate') {
        const scale = 0.0045;
        this._desired.azimuth -= dx * scale;
        this._desired.polar = Math.min(this.maxPolar, Math.max(this.minPolar, this._desired.polar - dy * scale));
      } else if (this._mode === 'pan') {
        // 按"目标平面上 1 像素等于多少世界单位"换算，画面才会 1:1 跟着光标走
        const height = this.dom.clientHeight || window.innerHeight;
        const k = (2 * Math.tan((this.camera.fov * Math.PI / 180) / 2) * this._desired.distance) / height;
        const right = _v3a.setFromMatrixColumn(this.camera.matrix, 0);
        const up = _v3b.setFromMatrixColumn(this.camera.matrix, 1);
        this.panOffset.addScaledVector(right, -dx * k);
        this.panOffset.addScaledVector(up, dy * k);
      }
    }

    _pointerUp(e) {
      const had = this._pointers.has(e.pointerId);
      this._pointers.delete(e.pointerId);
      if (!had) return;
      if (this._pointers.size === 0) {
        const dt = performance.now() - this._downAt;
        const isClick = this._mode === 'rotate' && this._moved < CLICK_PX && dt < CLICK_MS;
        this._mode = null;
        if (isClick && this.onClick) this.onClick(e);
      } else if (this._pointers.size === 1) {
        this._mode = 'rotate';
        const p = [...this._pointers.values()][0];
        this._downPos = { x: p.x, y: p.y };
        this._moved = CLICK_PX + 1; // 双指松开一根后不再判定为点击
      }
    }

    _clampDistance(d) {
      return Math.min(this.maxDistance, Math.max(this.minDistance, d));
    }

    _wheel(e) {
      e.preventDefault();
      const step = Math.exp((e.deltaY > 0 ? 1 : -1) * Math.min(0.35, Math.abs(e.deltaY) / 500 + 0.08));
      this._desired.distance = this._clampDistance(this._desired.distance * step);
    }

    /** 键盘微调：方位角 / 天顶角增量（弧度），供全键盘操作使用 */
    nudge(dAzimuth, dPolar) {
      this._desired.azimuth += dAzimuth;
      this._desired.polar = Math.min(this.maxPolar, Math.max(this.minPolar, this._desired.polar + dPolar));
    }

    /** 设置基准注视点（通常每帧由场景调用）；用户的平移偏移会叠加在它之上 */
    setTarget(vec, immediate) {
      this._base.copy(vec);
      this._targetDesired.copy(this._base).add(this.panOffset);
      if (immediate) this.target.copy(this._targetDesired);
    }

    /** 清掉平移偏移：切换聚焦目标或回到总览时调用，否则画面会"歪着"跟随 */
    resetPan(immediate) {
      this.panOffset.set(0, 0, 0);
      this._targetDesired.copy(this._base);
      if (immediate) this.target.copy(this._targetDesired);
    }

    setDistance(d, immediate) {
      this._desired.distance = this._clampDistance(d);
      if (immediate) this.distance = this._desired.distance;
    }

    /**
     * 每帧调用：阻尼插值 + 写回相机变换。
     * 用 1 − e^(−rate·dt) 而不是固定系数，低帧率时才不会"追不上"目标。
     */
    apply(dt, immediate) {
      const k = immediate ? 1 : 1 - Math.exp(-this.dampingRate * Math.max(0, Math.min(0.5, dt || 0)));
      this.azimuth += (this._desired.azimuth - this.azimuth) * k;
      this.polar += (this._desired.polar - this.polar) * k;
      this.distance += (this._desired.distance - this.distance) * k;
      this._targetDesired.copy(this._base).add(this.panOffset);
      this.target.lerp(this._targetDesired, immediate ? 1 : k);

      const sp = Math.sin(this.polar), cp = Math.cos(this.polar);
      const x = this.distance * sp * Math.sin(this.azimuth);
      const y = this.distance * cp;
      const z = this.distance * sp * Math.cos(this.azimuth);
      this.camera.position.set(this.target.x + x, this.target.y + y, this.target.z + z);
      this.camera.lookAt(this.target);
      this.camera.updateMatrixWorld();
    }
  }

  SS.OrbitCamera = OrbitCamera;
})(typeof window !== 'undefined' ? window : globalThis);
