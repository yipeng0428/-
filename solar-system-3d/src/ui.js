/**
 * 界面层：标签、信息面板、时间与显示控制
 * ---------------------------------------------------------------
 * 职责划分：app.js 只管场景与状态，ui.js 只管读状态并写 DOM。
 * 文本更新按 ~9 Hz 节流（人眼读数够用），标签位置每帧更新（否则会"粘滞"）。
 */
(function (global) {
  'use strict';

  const SS = (global.SolarSystem = global.SolarSystem || {});
  const E = SS.Ephemeris;
  const THREE = global.THREE;

  const TEXT_INTERVAL_MS = 110;
  const el = {};
  const labels = new Map();
  const catalogItems = new Map();
  // 数字键 0–9 的绑定顺序（月球另用 M 键）——目录编号也从这里取，二者不会再对不上
  const KEY_ORDER = ['sun', 'mercury', 'venus', 'earth', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto'];
  let lastText = 0;
  let selected = null;
  let hovered = null;
  let lastSelectedRendered = undefined;
  let lastSunCapped = false;

  /* ------------------------- 格式化 ------------------------- */

  const pad = (n, w) => String(n).padStart(w || 2, '0');

  function fmtAU(v, digits) {
    return v.toFixed(digits === undefined ? 4 : digits);
  }

  function fmtKm(km) {
    return Math.round(km).toLocaleString('en-US');
  }

  /** 中文语境下"亿 / 万公里"比九位数字更好读 */
  function fmtKmCN(km) {
    if (km >= 1e8) return (km / 1e8).toFixed(4) + ' 亿 km';
    if (km >= 1e4) return (km / 1e4).toFixed(2) + ' 万 km';
    return Math.round(km).toLocaleString('en-US') + ' km';
  }

  function fmtDeg(d, digits) {
    const v = ((d % 360) + 360) % 360;
    return v.toFixed(digits === undefined ? 2 : digits) + '°';
  }

  function fmtSignedDeg(d, digits) {
    return (d >= 0 ? '+' : '−') + Math.abs(d).toFixed(digits === undefined ? 3 : digits) + '°';
  }

  /** 光行时：秒 → 人类可读 */
  function fmtLightTime(au) {
    const s = au * E.LIGHT_SECONDS_PER_AU;
    if (s < 90) return s.toFixed(1) + ' 秒';
    if (s < 5400) return Math.floor(s / 60) + ' 分 ' + pad(Math.round(s % 60)) + ' 秒';
    const h = Math.floor(s / 3600);
    return h + ' 小时 ' + pad(Math.round((s % 3600) / 60)) + ' 分';
  }

  function fmtLightTimeShort(au) {
    const s = au * E.LIGHT_SECONDS_PER_AU;
    if (s < 90) return s.toFixed(1) + 's';
    if (s < 5400) return Math.floor(s / 60) + 'm' + pad(Math.round(s % 60)) + 's';
    return Math.floor(s / 3600) + 'h' + pad(Math.round((s % 3600) / 60)) + 'm';
  }

  /** 视直径：半径 (km) 与距离 (AU) → 角秒 / 角分 */
  function fmtApparentSize(radiusKm, distanceAU) {
    const d = distanceAU * E.AU_KM;
    if (d <= 0) return '—';
    const arcsec = 2 * Math.atan(radiusKm / d) * (180 / Math.PI) * 3600;
    if (arcsec >= 120) return (arcsec / 60).toFixed(2) + ' 角分';
    return arcsec.toFixed(1) + ' 角秒';
  }

  function fmtMagnitude(v) {
    if (Number.isNaN(v)) return '—';
    return (v >= 0 ? '+' : '−') + Math.abs(v).toFixed(2) + ' 等';
  }

  function fmtInstant(jd) {
    if (Number.isNaN(jd)) return '—';
    const d = E.dateFromJulianDay(jd);
    return d.getUTCFullYear() + '-' + pad(d.getUTCMonth() + 1) + '-' + pad(d.getUTCDate())
      + ' ' + pad(d.getUTCHours()) + ':' + pad(d.getUTCMinutes()) + ' UTC';
  }

  function fmtPeriod(days) {
    if (days < 400) return days.toFixed(2) + ' 天';
    return Math.round(days).toLocaleString('en-US') + ' 天（' + (days / 365.25).toFixed(2) + ' 年）';
  }

  function fmtDays(days) {
    if (days < 90) return days.toFixed(1) + ' 天';
    if (days < 1000) return days.toFixed(0) + ' 天';
    return (days / 365.25).toFixed(1) + ' 年';
  }

  function utcString(date) {
    return date.getUTCFullYear() + '-' + pad(date.getUTCMonth() + 1) + '-' + pad(date.getUTCDate())
      + ' ' + pad(date.getUTCHours()) + ':' + pad(date.getUTCMinutes()) + ':' + pad(date.getUTCSeconds());
  }

  function localString(date) {
    return date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate())
      + ' ' + pad(date.getHours()) + ':' + pad(date.getMinutes()) + ':' + pad(date.getSeconds());
  }

  function dateOnly(date) {
    return date.getUTCFullYear() + '-' + pad(date.getUTCMonth() + 1) + '-' + pad(date.getUTCDate());
  }

  function localInputValue(date) {
    return date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate())
      + 'T' + pad(date.getHours()) + ':' + pad(date.getMinutes());
  }

  const SPEED_LABELS = [
    [1, '实时（1 秒 / 秒）'], [60, '1 分钟 / 秒'], [3600, '1 小时 / 秒'],
    [86400, '1 天 / 秒'], [864000, '10 天 / 秒'], [2592000, '30 天 / 秒'], [31557600, '1 年 / 秒'],
  ];

  function speedLabel(state) {
    if (state.paused) return '已暂停';
    const hit = SPEED_LABELS.find(([v]) => v === state.speed);
    const base = hit ? hit[1] : state.speed + '× 实时';
    return state.live ? '实时同步' : base;
  }

  /* ------------------------- 初始化 ------------------------- */

  function init() {
    [
      'labels', 'panel', 'detail-empty', 'detail-body', 'd-name', 'd-en', 'd-chips', 'd-blurb',
      'd-live', 'd-facts', 'd-note', 'd-stamp', 'd-close', 'd-focus', 'd-unfocus',
      'ov-table', 'clock-utc', 'clock-local', 'clock-jd', 'clock-rate',
      't-live', 't-pause', 't-now', 't-speed', 't-date',
      'v-orbits', 'v-labels', 'v-markers', 'v-realdist', 'v-realsize', 'v-boost', 'v-boost-val',
      'scale-note', 'loading', 'fatal', 'fatal-msg', 'ui-toggle',
      'catalog', 'catalog-list', 'ruler', 'ruler-text', 'range-warning', 'sr-status',
      'd-sources', 'd-moon', 'd-moon-stamp', 'd-moon-name', 'd-moon-lit', 'd-moon-age', 'd-moon-hemi', 'moon-phase',
    ].forEach((id) => { el[id] = document.getElementById(id); });

    buildLabels();
    buildCatalog();
    buildSources();
    bindControls();
    const state = SS.App.state;
    state.sizeBoost = boostFromSlider(Number(el['v-boost'].value));
    el['v-boost-val'].textContent = '×' + state.sizeBoost;
    syncControls();
  }

  function buildLabels() {
    SS.BODIES.forEach((def) => {
      const node = document.createElement('div');
      node.className = 'label';
      node.dataset.key = def.key;
      node.innerHTML = '<span>' + def.name + '</span><span class="en">' + def.en + '</span>';
      node.addEventListener('click', (ev) => {
        ev.stopPropagation();
        SS.App.selectBody(def.key);
      });
      node.addEventListener('dblclick', (ev) => {
        ev.stopPropagation();
        SS.App.selectBody(def.key, { focus: true });
      });
      el.labels.appendChild(node);
      labels.set(def.key, node);
    });
  }

  /** 左侧天体目录：固定顺序的导航锚点（右侧那张表是按实时距离排序的，会跳动） */
  function buildCatalog() {
    const frag = document.createDocumentFragment();
    SS.BODIES.forEach((def) => {
      const li = document.createElement('li');
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'cat-item' + (def.parent ? ' is-satellite' : '');
      btn.dataset.key = def.key;
      btn.setAttribute('aria-current', 'false');
      const hex = '#' + new THREE.Color(def.color).getHexString();
      const slot = KEY_ORDER.indexOf(def.key);
      const badge = def.key === 'moon' ? 'M' : (slot >= 0 ? String(slot) : '·');
      btn.title = '快捷键 ' + badge;
      btn.innerHTML = '<span class="cat-dot" style="background:' + hex + '"></span>'
        + '<span class="cat-name">' + def.name + '</span>'
        + '<span class="cat-idx" aria-hidden="true">' + badge + '</span>';
      btn.addEventListener('click', () => SS.App.selectBody(def.key));
      btn.addEventListener('dblclick', () => SS.App.selectBody(def.key, { focus: true }));
      li.appendChild(btn);
      frag.appendChild(li);
      catalogItems.set(def.key, btn);
    });
    el['catalog-list'].appendChild(frag);
  }

  function buildSources() {
    el['d-sources'].innerHTML = (SS.SOURCES || []).map((src) =>
      '<li><a href="' + src.url + '" target="_blank" rel="noopener noreferrer">' + src.label + '</a></li>'
    ).join('');
  }

  function boostFromSlider(v) {
    // 对数映射：0 → ×1，100 → ×3000
    return Math.max(1, Math.round(Math.pow(10, (v / 100) * 3.4772)));
  }

  function bindControls() {
    const App = SS.App;
    const state = App.state;

    el['ui-toggle'].addEventListener('click', () => {
      const open = document.body.classList.toggle('dock-open');
      el['ui-toggle'].setAttribute('aria-expanded', String(open));
    });

    el['d-close'].addEventListener('click', () => App.selectBody(null));
    el['d-focus'].addEventListener('click', () => { if (selected) App.focusBody(selected); });
    el['d-unfocus'].addEventListener('click', () => App.focusBody(null));

    el['t-live'].addEventListener('click', () => {
      state.live = true; state.paused = false; state.speed = 1;
      el['t-speed'].value = '1';
      syncControls();
    });
    el['t-pause'].addEventListener('click', () => {
      if (state.live) { state.live = false; state.paused = true; }
      else state.paused = !state.paused;
      syncControls();
    });
    el['t-now'].addEventListener('click', () => {
      state.jd = E.julianDay(new Date());
      App.refreshOrbits();
      syncControls();
    });
    el['t-speed'].addEventListener('change', (ev) => {
      const v = Number(ev.target.value);
      state.speed = v;
      state.paused = false;
      state.live = v === 1;    // 1 秒/秒 等价于实时，顺便重新对齐绝对时刻
      syncControls();
    });
    el['t-date'].addEventListener('change', (ev) => {
      const d = new Date(ev.target.value);
      if (Number.isNaN(d.getTime())) return;
      state.live = false;
      state.jd = E.julianDay(d);
      App.refreshOrbits();
      syncControls();
    });
    document.querySelectorAll('.pill.step').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.live = false;
        state.jd += Number(btn.dataset.step);
        App.refreshOrbits();
        syncControls();
      });
    });

    el['v-markers'].addEventListener('change', (ev) => App.setShowMarkers(ev.target.checked));
    el['v-orbits'].addEventListener('change', (ev) => { state.showOrbits = ev.target.checked; });
    el['v-labels'].addEventListener('change', (ev) => { state.showLabels = ev.target.checked; });
    el['v-realdist'].addEventListener('change', (ev) => { App.setRealDistance(ev.target.checked); syncControls(); });
    el['v-realsize'].addEventListener('change', (ev) => { App.setRealSize(ev.target.checked); syncControls(); });
    el['v-boost'].addEventListener('input', (ev) => {
      const boost = boostFromSlider(Number(ev.target.value));
      App.setSizeBoost(boost);
      el['v-boost-val'].textContent = '×' + boost;
      syncControls();
    });

    window.addEventListener('keydown', (ev) => {
      const tag = (document.activeElement && document.activeElement.tagName) || '';
      if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;
      const keys = KEY_ORDER;
      if (ev.key === ' ') { ev.preventDefault(); el['t-pause'].click(); return; }
      if (ev.key === 'Escape') { App.selectBody(null); return; }
      if (ev.key === 'o' || ev.key === 'O') { el['v-orbits'].checked = !el['v-orbits'].checked; state.showOrbits = el['v-orbits'].checked; return; }
      if (ev.key === 'l' || ev.key === 'L') { el['v-labels'].checked = !el['v-labels'].checked; state.showLabels = el['v-labels'].checked; return; }
      if (ev.key === 'f' || ev.key === 'F') { if (selected) App.focusBody(selected); return; }
      if (ev.key === 'r' || ev.key === 'R') { el['t-now'].click(); return; }
      if (/^[0-9]$/.test(ev.key)) { App.selectBody(keys[Number(ev.key)], { focus: false }); return; }
      if (ev.key === 'm' || ev.key === 'M') { App.selectBody('moon'); return; }

      // 键盘镜头控制：不用鼠标也能转动与缩放（WCAG 2.1.1 全键盘可操作）
      const c = App.ctx.controls;
      if (!c) return;
      const step = ev.shiftKey ? 0.22 : 0.07;
      if (ev.key === 'ArrowLeft') { c.nudge(-step, 0); ev.preventDefault(); }
      else if (ev.key === 'ArrowRight') { c.nudge(step, 0); ev.preventDefault(); }
      else if (ev.key === 'ArrowUp') { c.nudge(0, -step); ev.preventDefault(); }
      else if (ev.key === 'ArrowDown') { c.nudge(0, step); ev.preventDefault(); }
      else if (ev.key === '+' || ev.key === '=') { c.setDistance(c.distance / 1.25); ev.preventDefault(); }
      else if (ev.key === '-' || ev.key === '_') { c.setDistance(c.distance * 1.25); ev.preventDefault(); }
    });
  }

  function syncControls() {
    const state = SS.App.state;
    scaleNote(state);
    el['t-live'].classList.toggle('is-on', state.live && !state.paused);
    el['t-pause'].classList.toggle('is-on', state.paused);
    el['t-pause'].textContent = state.paused ? '继续' : '暂停';
    el['v-boost'].disabled = !state.realSize;
  }

  /** 比例说明：把当前用的是哪一套映射、有没有触发限幅，都写清楚 */
  function scaleNote(state) {
    if (!state.realDistance && !state.realSize) {
      el['scale-note'].innerHTML = '当前为示意比例：距离按 √r 压缩，半径按 (R/R⊕)<sup>0.4</sup> 压缩。';
      return;
    }
    let text = (state.realDistance ? '距离：真实线性（1 AU = 10 场景单位）' : '距离：√r 压缩')
      + '；' + (state.realSize ? '半径：真实值 ×' + state.sizeBoost : '半径：(R/R⊕)<sup>0.4</sup> 压缩')
      + '。';
    if (state.realSize) text += '把放大倍数拉到 ×1 即为严格真实比例——行星会小到几乎看不见，这正是太阳系的实况。';
    if (state.sunCapped) text += '<br><b>注意：</b>当前比例下太阳已被限幅在水星轨道半径的 35%，实际显示半径小于上述规则的换算值。';
    el['scale-note'].innerHTML = text;
  }

  /* ------------------------- 面板内容 ------------------------- */

  function setSelected(key) {
    selected = key;
    catalogItems.forEach((btn, k) => btn.setAttribute('aria-current', String(k === key)));
    renderDetail(key);
    announce(key);
  }

  /** 只在"选中项变化"时播报一次；若给整个面板加 aria-live，读屏器会以 9 Hz 念数字 */
  function announce(key) {
    if (!el['sr-status']) return;
    if (!key) { el['sr-status'].textContent = '已取消选择'; return; }
    const def = SS.BODY_BY_KEY[key];
    const entry = SS.App.ctx.bodies.get(key);
    const s2 = entry && entry.state;
    let text = '已选中 ' + def.name;
    if (s2 && key !== 'earth' && key !== 'sun') {
      const earth = SS.App.ctx.bodies.get('earth');
      if (earth && earth.state) {
        const d = key === 'moon' ? s2.geocentricDistance : E.distance(s2.position, earth.state.position);
        text += '，与地球相距 ' + d.toFixed(3) + ' 天文单位，光行时 ' + fmtLightTime(d);
      }
    }
    el['sr-status'].textContent = text;
  }

  function setHovered(key) { hovered = key; }

  function renderDetail(key) {
    lastSelectedRendered = key;
    if (!key) {
      el['detail-empty'].hidden = false;
      el['detail-body'].hidden = true;
      return;
    }
    const def = SS.BODY_BY_KEY[key];
    el['detail-empty'].hidden = true;
    el['detail-body'].hidden = false;
    el['d-name'].textContent = def.name;
    el['d-en'].textContent = def.en;
    el['d-blurb'].textContent = def.blurb || '';

    const typeLabel = { star: '恒星', planet: '行星', dwarf: '矮行星' }[def.type] || def.type;
    const chips = [typeLabel];
    if (def.facts && def.facts['分类']) chips[0] = def.facts['分类'];
    if (def.ring) chips.push('有环系');
    if (def.rotationHours < 0) chips.push('逆行自转');
    el['d-chips'].innerHTML = chips.map((c) => '<span class="chip">' + c + '</span>').join('');

    el['d-facts'].innerHTML = Object.keys(def.facts || {}).map((k) => {
      const v = def.facts[k];
      const prose = /[一-龥]{3,}/.test(v) && !/^\d/.test(v);
      return '<tr><th>' + k + '</th><td' + (prose ? ' class="prose"' : '') + '>' + v + '</td></tr>';
    }).join('');

    if (def.note) { el['d-note'].hidden = false; el['d-note'].textContent = '注：' + def.note; }
    else el['d-note'].hidden = true;
    el['d-moon'].hidden = key !== 'moon';
  }

  /** 月相示意图：亮面 = 半圆 + 一段椭圆，椭圆横半轴 a = R·(2k−1) */
  function drawMoonPhase(canvas, moon) {
    const ctx2d = canvas.getContext('2d');
    const w = canvas.width, h = canvas.height;
    const cx = w / 2, cy = h / 2, R = Math.min(w, h) * 0.42;
    ctx2d.clearRect(0, 0, w, h);

    // 暗面（地照）
    ctx2d.beginPath();
    ctx2d.arc(cx, cy, R, 0, Math.PI * 2);
    ctx2d.fillStyle = '#171c26';
    ctx2d.fill();
    ctx2d.strokeStyle = 'rgba(150,175,215,0.22)';
    ctx2d.lineWidth = 1;
    ctx2d.stroke();

    const k = Math.max(0, Math.min(1, moon.illuminated));
    const a = R * (2 * k - 1);

    ctx2d.save();
    if (!moon.waxing) { ctx2d.translate(cx, cy); ctx2d.scale(-1, 1); ctx2d.translate(-cx, -cy); }
    ctx2d.beginPath();
    ctx2d.arc(cx, cy, R, -Math.PI / 2, Math.PI / 2, false);          // 亮面所在的半圆
    ctx2d.ellipse(cx, cy, Math.abs(a), R, 0, Math.PI / 2, Math.PI * 1.5, a < 0); // 明暗界线
    ctx2d.closePath();
    const grad = ctx2d.createRadialGradient(cx - R * 0.25, cy - R * 0.3, R * 0.1, cx, cy, R * 1.15);
    grad.addColorStop(0, '#fdfaf2');
    grad.addColorStop(0.65, '#ded7c6');
    grad.addColorStop(1, '#a89f8e');
    ctx2d.fillStyle = grad;
    ctx2d.fill();
    ctx2d.restore();
  }

  /** 选中天体的实时数据行 */
  function liveRows(key, states, jd) {
    const def = SS.BODY_BY_KEY[key];
    const earth = states.earth;
    const rows = [];
    const sunRadius = SS.BODY_BY_KEY.sun.radiusKm;

    if (key === 'moon') {
      const m = states.moon;
      rows.push(['与地球距离', fmtKm(m.geocentricDistanceKm) + ' km', true]);
      rows.push(['折合', fmtAU(m.geocentricDistance, 5) + ' AU · ' + (m.geocentricDistanceKm / 6371).toFixed(1) + ' 倍地球半径']);
      rows.push(['光行时（到地球）', (m.geocentricDistance * E.LIGHT_SECONDS_PER_AU).toFixed(2) + ' 秒', true]);
      rows.push(['视直径（地球所见）', fmtApparentSize(E.MOON_MEAN_RADIUS_KM, m.geocentricDistance)]);
      rows.push(['视星等', fmtMagnitude(E.apparentMagnitude('moon', m.r, m.geocentricDistance, m.phaseAngle))]);
      rows.push(['日月地相位角', fmtDeg(m.phaseAngle)]);
      rows.push(['与太阳的黄经差', fmtDeg(m.elongationFromSun) + '（0°朔 · 180°望）']);
      rows.push(['地心黄经 / 黄纬', fmtDeg(m.eclipticLongitude) + ' / ' + fmtSignedDeg(m.eclipticLatitude)]);
      rows.push(['日心距离', fmtAU(m.r) + ' AU']);
      const nextNew = E.nextMoonPhase(jd, 0);
      const nextFull = E.nextMoonPhase(jd, 180);
      rows.push(['下次朔（新月）', fmtInstant(nextNew) + '（' + fmtDays(nextNew - jd) + '后）']);
      rows.push(['下次望（满月）', fmtInstant(nextFull) + '（' + fmtDays(nextFull - jd) + '后）']);
      rows.push(['朔望月 / 恒星月', '29.531 天 / 27.322 天']);
      return rows;
    }

    if (key === 'sun') {
      rows.push(['与地球距离', fmtAU(earth.r) + ' AU', true]);
      rows.push(['换算公里数', fmtKmCN(earth.r * E.AU_KM) + '（' + fmtKm(earth.r * E.AU_KM) + ' km）']);
      rows.push(['光行时（到地球）', fmtLightTime(earth.r), true]);
      rows.push(['视直径（地球所见）', fmtApparentSize(sunRadius, earth.r)]);
      rows.push(['地球日心黄经', fmtDeg(earth.eclipticLongitude)]);
      rows.push(['太阳视黄经（地心）', fmtDeg(earth.eclipticLongitude + 180)]);
      rows.push(['地球公转速度', earth.speedKmS.toFixed(2) + ' km/s']);
      rows.push(['视星等（地球所见）', fmtMagnitude(-26.74 + 5 * Math.log10(earth.r))]);
      rows.push(['下次地球近日点', dateOnly(E.dateFromJulianDay(jd + earth.daysToPerihelion))
        + '（' + fmtDays(earth.daysToPerihelion) + '后）']);
      return rows;
    }

    const s = states[key];
    rows.push(['日心距离', fmtAU(s.r) + ' AU', true]);
    rows.push(['换算公里数', fmtKmCN(s.r * E.AU_KM)]);

    if (key !== 'earth') {
      const delta = E.distance(s.position, earth.position);
      const phase = E.phaseAngle(earth.position, s.position);
      const lit = (1 + Math.cos(phase * Math.PI / 180)) / 2;
      rows.push(['与地球距离', fmtAU(delta) + ' AU（' + fmtKmCN(delta * E.AU_KM) + '）', true]);
      rows.push(['光行时（到地球）', fmtLightTime(delta), true]);
      rows.push(['太阳距角（地心）', fmtDeg(E.elongation(earth.position, s.position))]);
      rows.push(['相位角 / 照亮比例', fmtDeg(phase) + ' / ' + (lit * 100).toFixed(1) + '%']);
      rows.push(['视直径（地球所见）', fmtApparentSize(def.radiusKm, delta)]);
      const mag = E.apparentMagnitude(key, s.r, delta, phase);
      if (!Number.isNaN(mag)) {
        rows.push(['视星等', fmtMagnitude(mag) + (key === 'saturn' ? '（球体，未计环）' : ''), true]);
      }
    } else {
      rows.push(['太阳视黄经（地心）', fmtDeg(s.eclipticLongitude + 180)]);
      rows.push(['太阳视直径', fmtApparentSize(sunRadius, s.r)]);
    }

    rows.push(['日心黄经', fmtDeg(s.eclipticLongitude)]);
    rows.push(['日心黄纬', fmtSignedDeg(s.eclipticLatitude)]);
    rows.push(['轨道速度', s.speedKmS.toFixed(3) + ' km/s', true]);
    rows.push(['平近点角（公转进度）', fmtDeg(s.meanAnomaly) + '（' + (s.meanAnomaly / 3.6).toFixed(1) + '%）']);
    rows.push(['真近点角', fmtDeg(s.trueAnomaly)]);
    rows.push(['上次过近日点', fmtDays(s.daysSincePerihelion) + '前']);
    rows.push(['下次过近日点', dateOnly(E.dateFromJulianDay(jd + s.daysToPerihelion))
      + '（' + fmtDays(s.daysToPerihelion) + '后）']);
    rows.push(['近日 / 远日距', fmtAU(s.perihelion) + ' / ' + fmtAU(s.aphelion) + ' AU']);
    rows.push(['当前轨道偏心率', s.elements.e.toFixed(5)]);
    rows.push(['轨道倾角（对黄道）', fmtSignedDeg(s.elements.I)]);
    rows.push(['公转周期', fmtPeriod(s.periodDays)]);
    return rows;
  }

  // 为避免每秒重建十几次 DOM（会打断文本选择、造成闪烁），
  // 表格结构只建一次，之后仅更新数值单元格的文本。
  const liveCache = { key: null, cells: [] };

  function renderLive(key, states, jd) {
    const rows = liveRows(key, states, jd);
    if (liveCache.key !== key || liveCache.cells.length !== rows.length) {
      el['d-live'].innerHTML = rows.map((r) =>
        '<tr' + (r[2] ? ' class="hi"' : '') + '><th></th><td></td></tr>'
      ).join('');
      const trs = el['d-live'].querySelectorAll('tr');
      liveCache.key = key;
      liveCache.cells = [...trs].map((tr) => ({ th: tr.children[0], td: tr.children[1] }));
      rows.forEach((r, i) => { liveCache.cells[i].th.textContent = r[0]; });
    }
    rows.forEach((r, i) => {
      const cell = liveCache.cells[i];
      if (cell.td.textContent !== r[1]) cell.td.textContent = r[1];
    });
  }

  const ovCache = { built: false, rows: new Map() };

  function buildOverview() {
    const head = '<thead><tr><th>天体</th><th>距地球 AU</th><th>光行时</th><th>视星等</th></tr></thead>';
    const body = SS.BODIES.map((def) => {
      const color = '#' + new THREE.Color(def.color).getHexString();
      return '<tr data-key="' + def.key + '">'
        + '<td><span class="dot" style="background:' + color + '"></span>' + def.name + '</td>'
        + '<td></td><td></td><td></td></tr>';
    }).join('');
    el['ov-table'].innerHTML = head + '<tbody>' + body + '</tbody>';
    el['ov-table'].querySelectorAll('tr[data-key]').forEach((tr) => {
      tr.addEventListener('click', () => SS.App.selectBody(tr.dataset.key));
      ovCache.rows.set(tr.dataset.key, tr);
    });
    ovCache.built = true;
  }

  function renderOverview(states, selectedKey) {
    if (!ovCache.built) buildOverview();
    const earth = states.earth;
    const list = SS.BODIES.map((def) => {
      const s2 = states[def.key];
      let delta, mag;
      if (def.isSun) {
        delta = earth.r;
        mag = -26.74 + 5 * Math.log10(earth.r);
      } else if (def.key === 'earth') {
        delta = NaN; mag = NaN;
      } else if (def.parent) {
        delta = s2 ? s2.geocentricDistance : NaN;
        mag = s2 ? E.apparentMagnitude(def.key, s2.r, delta, s2.phaseAngle) : NaN;
      } else {
        delta = s2 ? E.distance(s2.position, earth.position) : NaN;
        mag = s2 ? E.apparentMagnitude(def.key, s2.r, delta, E.phaseAngle(earth.position, s2.position)) : NaN;
      }
      return { def, delta, mag };
    }).sort((a, b) => {
      if (Number.isNaN(a.delta)) return -1;   // 地球自身固定排最前
      if (Number.isNaN(b.delta)) return 1;
      return a.delta - b.delta;
    });

    const tbody = el['ov-table'].querySelector('tbody');
    list.forEach((row) => {
      const tr = ovCache.rows.get(row.def.key);
      if (!tr) return;
      const cells = tr.children;
      const c1 = Number.isNaN(row.delta) ? '—' : fmtAU(row.delta, row.delta < 0.01 ? 5 : 3);
      const c2 = Number.isNaN(row.delta) ? '—' : fmtLightTimeShort(row.delta);
      const c3 = Number.isNaN(row.mag) ? '—' : (row.mag >= 0 ? '+' : '−') + Math.abs(row.mag).toFixed(1);
      if (cells[1].textContent !== c1) cells[1].textContent = c1;
      if (cells[2].textContent !== c2) cells[2].textContent = c2;
      if (cells[3].textContent !== c3) cells[3].textContent = c3;
      tr.classList.toggle('is-selected', row.def.key === selectedKey);
      tbody.appendChild(tr); // appendChild 会"移动"已有节点，顺序即排序结果
    });
  }

  /* ------------------------- 每帧 ------------------------- */

  const _v = new THREE.Vector3();

  function updateLabels(ctx, state) {
    const rect = ctx.renderer.domElement.getBoundingClientRect();
    // 按"选中项 → 离相机近 → 远"的优先级摆放；后来者若与已摆放者重叠就只留圆点。
    // 这是从参考页学来的做法：内太阳系缩略时四五个标签会叠成一团糊。
    const order = [...ctx.bodies.values()].sort((a, b) => {
      if (a.def.key === selected) return -1;
      if (b.def.key === selected) return 1;
      return ctx.camera.position.distanceTo(a.scenePos) - ctx.camera.position.distanceTo(b.scenePos);
    });
    const placed = [];
    order.forEach((entry) => {
      const key = entry.def.key;
      const node = labels.get(key);
      if (!node) return;
      if (!state.showLabels) { node.style.display = 'none'; return; }
      _v.copy(entry.scenePos).project(ctx.camera);
      const visible = _v.z < 1 && _v.z > -1
        && _v.x > -1.2 && _v.x < 1.2 && _v.y > -1.2 && _v.y < 1.2;
      if (!visible) { node.style.display = 'none'; return; }
      const sx = (_v.x * 0.5 + 0.5) * rect.width;
      const sy = (-_v.y * 0.5 + 0.5) * rect.height;
      const r = SS.App.screenRadius(entry, rect.height);
      const top = sy + Math.max(14, Math.min(r + 14, rect.height * 0.25));
      const crowded = placed.some((p) => Math.abs(p.x - sx) < 68 && Math.abs(p.y - top) < 22);
      node.style.display = 'block';
      node.style.left = sx.toFixed(1) + 'px';
      node.style.top = top.toFixed(1) + 'px';
      node.classList.toggle('is-selected', key === selected);
      node.classList.toggle('is-crowded', crowded && key !== selected);
      node.style.opacity = key === selected || key === hovered ? '1' : '0.82';
      if (!crowded || key === selected) placed.push({ x: sx, y: top });
    });
  }

  function frame(ctx, state) {
    updateLabels(ctx, state);
    const now = performance.now();
    if (now - lastText < TEXT_INTERVAL_MS) return;
    lastText = now;

    const date = E.dateFromJulianDay(state.jd);
    el['clock-utc'].textContent = utcString(date);
    el['clock-local'].textContent = localString(date);
    el['clock-jd'].textContent = state.jd.toFixed(5);
    el['clock-rate'].textContent = speedLabel(state);
    if (state.sunCapped !== lastSunCapped) { lastSunCapped = state.sunCapped; scaleNote(state); }
    if (document.activeElement !== el['t-date']) el['t-date'].value = localInputValue(date);

    const states = {};
    ctx.bodies.forEach((entry, key) => { if (entry.state) states[key] = entry.state; });
    if (!states.earth) return;

    updateRuler(state);
    updateRangeWarning(state);

    if (selected !== lastSelectedRendered) renderDetail(selected);
    if (selected) {
      el['d-stamp'].textContent = 'UTC ' + utcString(date);
      renderLive(selected, states, state.jd);
      if (selected === 'moon' && states.moon) renderMoonBox(states.moon, date);
    }
    renderOverview(states, selected);
  }

  /** 屏幕比例尺：100 px 对应多少 AU（压缩模式下标明是"局部"比例） */
  function updateRuler(state) {
    const au = state.scale.auPer100px;
    if (!(au > 0) || !Number.isFinite(au)) { el['ruler-text'].textContent = '—'; return; }
    const km = au * E.AU_KM;
    const auText = au >= 0.01 ? au.toFixed(2) + ' AU' : (km >= 1e4 ? (km / 1e4).toFixed(1) + ' 万 km' : Math.round(km).toLocaleString('en-US') + ' km');
    const narrow = window.innerWidth < 600;
    const suffix = state.scale.local
      ? (narrow ? ' · 径向' : ' · 日心径向（距离按 √r 压缩）')
      : (narrow ? ' · 线性' : ' · 真实线性比例');
    const text = '100 px ≈ ' + auText + suffix;
    if (el['ruler-text'].textContent !== text) el['ruler-text'].textContent = text;
  }

  /** 超出 Standish 根数表的标称区间时，必须明说结果不可信 */
  function updateRangeWarning(state) {
    const side = state.outOfRange;
    const node = el['range-warning'];
    if (!side) { if (!node.hidden) node.hidden = true; return; }
    const text = side === 'before'
      ? '当前时刻早于 1800 年：已超出所用解析星历的标称适用区间，行星位置仅供示意，误差会随时间迅速增大。'
      : '当前时刻晚于 2050 年：已超出所用解析星历的标称适用区间，行星位置仅供示意，误差会随时间迅速增大。';
    if (node.textContent !== text) node.textContent = text;
    if (node.hidden) node.hidden = false;
  }

  let lastMoonPhaseKey = '';
  function renderMoonBox(moon, date) {
    el['d-moon-stamp'].textContent = 'UTC ' + utcString(date);
    el['d-moon-name'].textContent = moon.phaseName;
    el['d-moon-lit'].textContent = (moon.illuminated * 100).toFixed(1) + '%';
    el['d-moon-age'].textContent = '月龄 ' + moon.age.toFixed(2) + ' 天 · '
      + (moon.waxing ? '渐盈' : '渐亏') + ' · 黄经差 ' + moon.elongationFromSun.toFixed(1) + '°';
    el['d-moon-hemi'].textContent = moon.waxing
      ? '北半球视角：渐盈，亮面在右（南半球所见左右相反）'
      : '北半球视角：渐亏，亮面在左（南半球所见左右相反）';
    // 只有画面真的变了才重绘（照亮比例精确到 0.1% 即可）
    const key = (moon.waxing ? 'w' : 'n') + (moon.illuminated * 1000).toFixed(0);
    if (key !== lastMoonPhaseKey) {
      lastMoonPhaseKey = key;
      drawMoonPhase(el['moon-phase'], moon);
    }
  }

  function hideLoading() {
    if (!el.loading) return;
    el.loading.classList.add('is-hidden');
    setTimeout(() => { if (el.loading) el.loading.style.display = 'none'; }, 600);
  }

  function fatal(message) {
    const box = document.getElementById('fatal');
    const msg = document.getElementById('fatal-msg');
    if (msg) msg.textContent = message;
    if (box) box.hidden = false;
    const loading = document.getElementById('loading');
    if (loading) loading.style.display = 'none';
  }

  // drawMoonPhase 一并导出：自动化测试直接用它逐相位验证亮面方向
  SS.UI = { init, frame, setSelected, setHovered, hideLoading, fatal, drawMoonPhase };
})(typeof window !== 'undefined' ? window : globalThis);
