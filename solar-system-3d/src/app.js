/*
 * app.js — 时间模型、交互与信息面板
 *
 * 数据流：真实时钟 → 模拟时刻 simMs（可暂停/倍速/跳转）
 *        → julianCenturies → 每个天体的开普勒状态（AU, km/s）
 *        → Scene.update 渲染 + 面板实时数值。
 * 面板里的「实时」数值全部由当前 simMs 现算，没有任何预存快照。
 */

(function () {
  'use strict';

  /* ───────── 天体清单 ───────── */
  var ORDER = ['sun', 'mercury', 'venus', 'earth', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto'];
  var ELEM = {};
  ORBITAL_ELEMENTS.forEach(function (b) { ELEM[b.id] = b; });

  var SPECS = ORDER.map(function (id) {
    var p = PHYSICAL[id];
    return {
      id: id, name: p.name, en: p.en, type: p.type,
      radiusKm: p.radiusKm, massKg: p.massKg, rotationH: p.rotationH, tilt: p.tilt,
      color: p.color, band: p.band, ring: p.ring,
      isSun: id === 'sun', earthlike: id === 'earth',
      segments: 360, facts: p.facts, note: p.note
    };
  });

  /* ───────── 时间 ───────── */
  var SPEEDS = [
    { label: '实时 1×', dps: 1 / 86400 },
    { label: '1 分/秒', dps: 60 / 86400 },
    { label: '10 分/秒', dps: 600 / 86400 },
    { label: '1 小时/秒', dps: 1 / 24 },
    { label: '1 天/秒', dps: 1 },
    { label: '1 周/秒', dps: 7 },
    { label: '1 月/秒', dps: 30.44 },
    { label: '1 年/秒', dps: 365.25 },
    { label: '10 年/秒', dps: 3652.5 }
  ];
  var MIN_MS = Date.UTC(1800, 0, 1);      // 根数适用区间
  var MAX_MS = Date.UTC(2050, 11, 31);

  var simMs = Date.now();
  var speedIdx = 4;
  var direction = 1;      // +1 正向，−1 倒放
  var paused = false;
  var clamped = false;
  var lastFrame = performance.now();
  var lastOrbitRefreshT = null;

  /* ───────── 状态 ───────── */
  var selected = null;
  var follow = true;
  var states = {};
  var el = {};   // DOM 缓存

  /* ───────── 工具 ───────── */
  function pad(n, w) { return String(Math.floor(Math.abs(n))).padStart(w || 2, '0'); }
  function fmt(v, d) {
    return v.toLocaleString('zh-CN', { minimumFractionDigits: d, maximumFractionDigits: d });
  }
  function fmtAu(au) { return fmt(au, au < 10 ? 4 : 3) + ' AU'; }
  function fmtKm(au) {
    var km = au * AU_KM;
    return km >= 1e6 ? fmt(km / 1e6, 2) + ' ×10⁶ km' : fmt(km, 0) + ' km';
  }
  function fmtLight(sec) {
    if (sec < 60) return fmt(sec, 1) + ' 秒';
    if (sec < 7200) return Math.floor(sec / 60) + ' 分 ' + pad(sec % 60) + ' 秒';
    return fmt(sec / 3600, 2) + ' 小时';
  }
  function fmtDuration(days) {
    if (days < 400) return fmt(days, 2) + ' 天';
    return fmt(days / 365.25, 2) + ' 年（' + fmt(days, 0) + ' 天）';
  }

  /**
   * 由日心状态换算地心观测量：日距角（elongation）、相位角与被照亮比例。
   * 纯几何量，未做光行差与光行时改正——对可视化足够，不能直接用于精密星历。
   */
  function dot(a, b) { return a.x * b.x + a.y * b.y + a.z * b.z; }
  function len(a) { return Math.sqrt(dot(a, a)); }
  function geocentric(s, e) {
    var toSun = { x: -e.x, y: -e.y, z: -e.z };                 // 地球 → 太阳
    var toP   = { x: s.x - e.x, y: s.y - e.y, z: s.z - e.z };  // 地球 → 天体
    var elong = Math.acos(Math.max(-1, Math.min(1, dot(toSun, toP) / (len(toSun) * len(toP))))) * 180 / Math.PI;

    // 相位角：在天体处，太阳方向与地球方向的夹角
    var pSun   = { x: -s.x, y: -s.y, z: -s.z };
    var pEarth = { x: e.x - s.x, y: e.y - s.y, z: e.z - s.z };
    var phase = Math.acos(Math.max(-1, Math.min(1, dot(pSun, pEarth) / (len(pSun) * len(pEarth))))) * 180 / Math.PI;

    // 黄经差定东西：天体视黄经在太阳之东 → 日落后可见
    var lonP = Math.atan2(toP.y, toP.x), lonS = Math.atan2(toSun.y, toSun.x);
    var d = (lonP - lonS) * 180 / Math.PI;
    while (d > 180) d -= 360;
    while (d < -180) d += 360;

    return { elongation: elong, phaseAngle: phase, illum: (1 + Math.cos(phase * Math.PI / 180)) / 2, east: d > 0 };
  }

  function computeStates(date) {
    var T = julianCenturies(date);
    var out = { sun: { x: 0, y: 0, z: 0, r: 0 } };
    for (var i = 0; i < ORDER.length; i++) {
      var id = ORDER[i];
      if (ELEM[id]) out[id] = stateAt(ELEM[id], T);
    }
    return out;
  }

  /* ───────── 信息面板 ───────── */
  function kv(k, v, live, id) {
    return '<div class="kv"><span class="k">' + k + '</span><span class="v' +
      (live ? ' live' : '') + '"' + (id ? ' id="' + id + '"' : '') + '>' + v + '</span></div>';
  }

  function renderOverview() {
    el.dot.style.background = '#9fd0ff';
    el.name.textContent = '太阳系';
    el.en.textContent = 'SOLAR SYSTEM';
    el.type.textContent = '点击任意天体 / 下方名称查看实时数据';

    var rows = ORDER.filter(function (id) { return id !== 'sun'; }).map(function (id) {
      return '<div class="kv"><span class="k" style="color:#' +
        PHYSICAL[id].color.toString(16).padStart(6, '0') + '">' + PHYSICAL[id].name +
        '</span><span class="v live" id="ov-' + id + '">—</span></div>';
    }).join('');

    el.body.innerHTML =
      '<div class="section"><p class="panel-title">实时日心距 / 轨道速度</p>' + rows + '</div>' +
      '<div class="section"><p class="panel-title">模型说明</p>' +
      '<div class="note">位置由 JPL《Approximate Positions of the Planets》的 J2000 平均轨道根数' +
      '解析递推（1800—2050 年适用），精度约数角分。<br><br>' +
      '天体半径与轨道半径使用两套不同缩放：真实比例下地球直径只有日地距离的 1/11700，' +
      '无法同屏显示。方向、相位、倾角与偏心率是真实的。</div></div>' +
      '<div class="section"><p class="panel-title">操作</p><p class="empty">' +
      '<b>拖拽</b> 旋转视角 · <b>滚轮</b> 缩放 · <b>Shift+拖拽</b> 平移<br>' +
      '<b>点击</b> 选中天体 · <b>Esc</b> 取消选中<br>' +
      '<b>空格</b> 暂停 · <b>← →</b> 单步 ±1 天 · <b>F</b> 全景</p></div>';
  }

  function renderBody(id) {
    var p = PHYSICAL[id];
    var hex = '#' + p.color.toString(16).padStart(6, '0');
    el.dot.style.background = hex;
    el.name.textContent = p.name;
    el.en.textContent = p.en.toUpperCase();
    el.type.textContent = p.type;

    var live;
    if (id === 'sun') {
      live = kv('到地球距离', '—', true, 'lv-dist') +
             kv('日地光行时', '—', true, 'lv-light') +
             kv('自转周期（赤道）', '25.38 天') +
             kv('半径', fmt(p.radiusKm, 0) + ' km（109 地球）');
    } else {
      live =
        kv('日心距 r', '—', true, 'lv-r') +
        kv('', '—', true, 'lv-rkm') +
        kv('轨道速度', '—', true, 'lv-v') +
        kv('与地球距离', '—', true, 'lv-dist') +
        kv('光行时（单程）', '—', true, 'lv-light') +
        kv('日心黄经 λ', '—', true, 'lv-lon') +
        kv('日心黄纬 β', '—', true, 'lv-lat') +
        kv('真近点角 ν', '—', true, 'lv-nu') +
        kv('日距角（地心）', '—', true, 'lv-elong') +
        kv('视亮面比例', '—', true, 'lv-phasek') +
        '<div class="kv"><span class="k">本圈公转进度</span>' +
        '<span class="v live" id="lv-phase-t">—</span></div>' +
        '<div class="phase-bar"><i id="lv-phase" style="width:0%"></i></div>';
    }

    var orbital = '';
    if (id !== 'sun') {
      orbital =
        kv('半长轴 a', '—', false, 'st-a') +
        kv('偏心率 e', '—', false, 'st-e') +
        kv('轨道倾角 i', '—', false, 'st-i') +
        kv('公转周期', '—', false, 'st-p') +
        kv('近日点 / 远日点', '—', false, 'st-q');
    }

    el.body.innerHTML =
      '<div class="section"><p class="panel-title">实时状态 · 由当前模拟时刻现算</p>' + live + '</div>' +
      (orbital ? '<div class="section"><p class="panel-title">轨道根数（历元外推值）</p>' + orbital + '</div>' : '') +
      '<div class="section"><p class="panel-title">物理参数</p>' +
      p.facts.map(function (f) { return kv(f[0], f[1]); }).join('') + '</div>' +
      '<div class="note">' + p.note + '</div>';

    // 轨道根数为慢变量，渲染时写一次即可
    if (id !== 'sun') {
      var s = states[id];
      byId('st-a').textContent = fmt(s.a, 5) + ' AU';
      byId('st-e').textContent = fmt(s.e, 5);
      byId('st-i').textContent = fmt(s.inc, 3) + '°';
      byId('st-p').textContent = fmtDuration(s.period);
      byId('st-q').textContent = fmt(s.a * (1 - s.e), 3) + ' / ' + fmt(s.a * (1 + s.e), 3) + ' AU';
    }
  }

  function byId(id) { return document.getElementById(id); }
  function setText(id, t) { var n = byId(id); if (n) n.textContent = t; }

  function updateLive() {
    if (!selected) {
      for (var i = 0; i < ORDER.length; i++) {
        var id = ORDER[i];
        if (id === 'sun') continue;
        var s = states[id];
        setText('ov-' + id, fmt(s.r, 3) + ' AU · ' + fmt(s.speed, 2) + ' km/s');
      }
      return;
    }
    var e = states.earth;
    if (selected === 'sun') {
      setText('lv-dist', fmtAu(e.r) + ' · ' + fmtKm(e.r));
      setText('lv-light', fmtLight(e.r * LIGHT_SEC_PER_AU));
      return;
    }
    var s = states[selected];
    var sep = separation(s, e);
    setText('lv-r', fmtAu(s.r));
    setText('lv-rkm', fmtKm(s.r));
    setText('lv-v', fmt(s.speed, 3) + ' km/s');
    setText('lv-dist', selected === 'earth' ? '0（基准天体）' : fmtAu(sep.au) + ' · ' + fmtKm(sep.au));
    setText('lv-light', selected === 'earth' ? '—' : fmtLight(sep.lightSeconds));
    setText('lv-lon', fmt(s.lon, 3) + '°');
    setText('lv-lat', fmt(s.lat, 4) + '°');
    setText('lv-nu', fmt(s.trueAnomaly, 2) + '°');
    if (selected === 'earth') {
      setText('lv-elong', '—');
      setText('lv-phasek', '1.000（自身）');
    } else {
      var g = geocentric(s, e);
      setText('lv-elong', fmt(g.elongation, 2) + '° ' + (g.east ? '东（昏星侧）' : '西（晨星侧）'));
      setText('lv-phasek', fmt(g.illum, 3) + '（相位角 ' + fmt(g.phaseAngle, 1) + '°）');
    }
    var phase = s.meanAnomaly / 360;
    var bar = byId('lv-phase');
    if (bar) bar.style.width = (phase * 100).toFixed(1) + '%';
    setText('lv-phase-t', (phase * 100).toFixed(1) + '% · 距近日点 ' +
      fmt(phase * s.period, 1) + ' 天');
  }

  /* ───────── HUD ───────── */
  function updateHud() {
    var d = new Date(simMs);
    el.hudDate.textContent = d.getUTCFullYear() + '-' + pad(d.getUTCMonth() + 1) + '-' + pad(d.getUTCDate());
    el.hudTime.textContent = pad(d.getUTCHours()) + ':' + pad(d.getUTCMinutes()) + ':' + pad(d.getUTCSeconds());
    el.hudJd.textContent = 'JD ' + toJulianDay(d).toFixed(4);

    var diff = (simMs - Date.now()) / 86400000;
    var txt;
    if (clamped) txt = '已到根数适用边界';
    else if (Math.abs(diff) < 1 / 48) txt = '与真实时刻同步';
    else if (Math.abs(diff) < 1) txt = (diff > 0 ? '+' : '−') + fmt(Math.abs(diff) * 24, 1) + ' 小时';
    else if (Math.abs(diff) < 400) txt = (diff > 0 ? '+' : '−') + fmt(Math.abs(diff), 1) + ' 天';
    else txt = (diff > 0 ? '+' : '−') + fmt(Math.abs(diff) / 365.25, 2) + ' 年';
    el.hudOffset.textContent = txt;

    var iso = d.toISOString().slice(0, 10);
    if (el.jump.value !== iso) el.jump.value = iso;
  }

  /* ───────── 选中 ───────── */
  function select(id) {
    selected = id || null;
    Scene.setSelected(selected);
    if (selected) {
      renderBody(selected);
      Scene.focusOn(selected, !follow);
    } else {
      renderOverview();
      Scene.frameAll();
    }
    updateLive();
    Array.prototype.forEach.call(document.querySelectorAll('.chip'), function (c) {
      c.classList.toggle('active', c.dataset.bodyId === selected);
    });
  }

  /* ───────── 主循环 ───────── */
  function frame(now) {
    var dtReal = Math.min((now - lastFrame) / 1000, 0.25);
    lastFrame = now;

    var simDays = 0;
    if (!paused) {
      simDays = SPEEDS[speedIdx].dps * dtReal * direction;
      var next = simMs + simDays * 86400000;
      clamped = false;
      if (next < MIN_MS) { next = MIN_MS; clamped = true; paused = true; }
      if (next > MAX_MS) { next = MAX_MS; clamped = true; paused = true; }
      simDays = (next - simMs) / 86400000;
      simMs = next;
      if (clamped) syncPlayButton();
    }

    var date = new Date(simMs);
    states = computeStates(date);

    // 根数随时间缓变：模拟时间每推进 ~1 年重算一次轨道线
    var T = julianCenturies(date);
    if (lastOrbitRefreshT === null || Math.abs(T - lastOrbitRefreshT) > 0.01) {
      refreshOrbits(T);
      lastOrbitRefreshT = T;
    }

    Scene.update(states, simDays, dtReal, follow && selected ? selected : null);
    updateHud();
    liveThrottle += dtReal;
    if (liveThrottle > 0.1) { updateLive(); liveThrottle = 0; }

    requestAnimationFrame(frame);
  }
  var liveThrottle = 0;

  function refreshOrbits(T) {
    Scene.refreshOrbits(function (id) {
      return ELEM[id] ? orbitSamples(ELEM[id], T, 360) : [];
    });
  }

  /* ───────── 初始化 ───────── */
  function boot() {
    if (typeof THREE === 'undefined') {
      byId('boot').innerHTML = '<div>three.js 未能加载。<br>' +
        '请连网后刷新，或把 <code>three.min.js</code> 放到本目录并把 index.html 的脚本地址改为本地路径。</div>';
      return;
    }

    el = {
      body: byId('info-body'), dot: byId('info-dot'), name: byId('info-name'),
      en: byId('info-en'), type: byId('info-type'),
      hudDate: byId('hud-date'), hudTime: byId('hud-time'), hudJd: byId('hud-jd'),
      hudOffset: byId('hud-offset'), jump: byId('jump-date'),
      play: byId('btn-play'), speed: byId('speed'), speedLabel: byId('speed-label')
    };

    Scene.init(byId('canvas-wrap'), SPECS);
    Scene.onPick(function (id) { select(id === selected ? null : id); });

    // 底部天体快捷条
    var chips = byId('chips');
    SPECS.forEach(function (s) {
      var c = document.createElement('button');
      c.className = 'chip';
      c.dataset.bodyId = s.id;
      c.innerHTML = '<i style="background:#' + s.color.toString(16).padStart(6, '0') + '"></i>' + s.name;
      c.addEventListener('click', function () { select(s.id === selected ? null : s.id); });
      chips.appendChild(c);
    });

    // 3D 标签点击
    byId('labels').addEventListener('click', function (e) {
      var id = e.target.dataset && e.target.dataset.bodyId;
      if (id) select(id === selected ? null : id);
    });

    // 时间控制
    el.play.addEventListener('click', togglePause);
    el.speed.addEventListener('input', function () {
      speedIdx = +el.speed.value;
      syncSpeedLabel();
    });
    byId('btn-dir').addEventListener('click', toggleDirection);
    el.jump.addEventListener('change', function () {
      var parts = el.jump.value.split('-');
      if (parts.length !== 3) return;
      var t = Date.UTC(+parts[0], +parts[1] - 1, +parts[2], 12, 0, 0);
      simMs = Math.max(MIN_MS, Math.min(MAX_MS, t));
      clamped = false;
    });
    byId('btn-now').addEventListener('click', function () {
      simMs = Date.now();
      clamped = false;
      paused = false;
      syncPlayButton();
    });

    // 显示开关
    byId('opt-truescale').addEventListener('change', function () {
      Scene.setTrueScale(this.checked);
      refreshOrbits(julianCenturies(new Date(simMs)));
      if (selected) Scene.focusOn(selected, true); else Scene.frameAll();
    });
    byId('opt-orbits').addEventListener('change', function () { Scene.setOrbitsVisible(this.checked); });
    byId('opt-labels').addEventListener('change', function () { Scene.setLabelsVisible(this.checked); });
    byId('opt-pluto').addEventListener('change', function () {
      Scene.setBodyVisible('pluto', this.checked);
      if (!this.checked && selected === 'pluto') select(null);
    });
    byId('opt-follow').addEventListener('change', function () { follow = this.checked; });
    byId('btn-opts').addEventListener('click', function () {
      byId('options').classList.toggle('open');
    });

    // 键盘
    window.addEventListener('keydown', function (e) {
      if (e.target.tagName === 'INPUT') return;
      if (e.code === 'Space') { e.preventDefault(); togglePause(); }
      else if (e.key === 'Escape') select(null);
      else if (e.key === 'ArrowRight') { simMs = Math.min(MAX_MS, simMs + 86400000); }
      else if (e.key === 'ArrowLeft') { simMs = Math.max(MIN_MS, simMs - 86400000); }
      else if (e.key === 'f' || e.key === 'F') { select(null); }
      else if (e.key === 'r' || e.key === 'R') { toggleDirection(); }
    });

    Scene.setBodyVisible('pluto', false);
    Scene.setTrueScale(false);
    Scene.frameAll();
    syncSpeedLabel();
    renderOverview();
    syncPlayButton();

    states = computeStates(new Date(simMs));
    requestAnimationFrame(frame);
    setTimeout(function () { byId('boot').classList.add('hidden'); }, 260);
  }

  function syncSpeedLabel() {
    el.speedLabel.textContent = (direction < 0 ? '− ' : '') + SPEEDS[speedIdx].label;
    byId('btn-dir').textContent = direction < 0 ? '←' : '→';
  }
  function toggleDirection() {
    direction = -direction;
    clamped = false;
    syncSpeedLabel();
  }
  function togglePause() {
    paused = !paused;
    if (!paused) clamped = false;
    syncPlayButton();
  }
  function syncPlayButton() {
    el.play.textContent = paused ? '▶' : '❚❚';
    el.play.title = paused ? '继续（空格）' : '暂停（空格）';
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
