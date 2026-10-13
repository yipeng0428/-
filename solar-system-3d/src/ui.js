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
      'v-orbits', 'v-labels', 'v-realdist', 'v-realsize', 'v-boost', 'v-boost-val',
      'scale-note', 'loading', 'fatal', 'fatal-msg', 'ui-toggle',
    ].forEach((id) => { el[id] = document.getElementById(id); });

    buildLabels();
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
      const keys = ['sun', 'mercury', 'venus', 'earth', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto'];
      if (ev.key === ' ') { ev.preventDefault(); el['t-pause'].click(); return; }
      if (ev.key === 'Escape') { App.selectBody(null); return; }
      if (ev.key === 'o' || ev.key === 'O') { el['v-orbits'].checked = !el['v-orbits'].checked; state.showOrbits = el['v-orbits'].checked; return; }
      if (ev.key === 'l' || ev.key === 'L') { el['v-labels'].checked = !el['v-labels'].checked; state.showLabels = el['v-labels'].checked; return; }
      if (ev.key === 'f' || ev.key === 'F') { if (selected) App.focusBody(selected); return; }
      if (ev.key === 'r' || ev.key === 'R') { el['t-now'].click(); return; }
      if (/^[0-9]$/.test(ev.key)) { App.selectBody(keys[Number(ev.key)], { focus: false }); }
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
    renderDetail(key);
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
  }

  /** 选中天体的实时数据行 */
  function liveRows(key, states, jd) {
    const def = SS.BODY_BY_KEY[key];
    const earth = states.earth;
    const rows = [];
    const sunRadius = SS.BODY_BY_KEY.sun.radiusKm;

    if (key === 'sun') {
      rows.push(['与地球距离', fmtAU(earth.r) + ' AU', true]);
      rows.push(['换算公里数', fmtKmCN(earth.r * E.AU_KM) + '（' + fmtKm(earth.r * E.AU_KM) + ' km）']);
      rows.push(['光行时（到地球）', fmtLightTime(earth.r), true]);
      rows.push(['视直径（地球所见）', fmtApparentSize(sunRadius, earth.r)]);
      rows.push(['地球日心黄经', fmtDeg(earth.eclipticLongitude)]);
      rows.push(['太阳视黄经（地心）', fmtDeg(earth.eclipticLongitude + 180)]);
      rows.push(['地球公转速度', earth.speedKmS.toFixed(2) + ' km/s']);
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
    const head = '<thead><tr><th>天体</th><th>日心距</th><th>距地球</th><th>光行时</th></tr></thead>';
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
      const s = def.isSun ? null : states[def.key];
      const pos = def.isSun ? { x: 0, y: 0, z: 0 } : s.position;
      const delta = def.key === 'earth' ? NaN : E.distance(pos, earth.position);
      return { def, r: def.isSun ? NaN : s.r, delta };
    }).sort((a, b) => {
      // 地球自身距离为 0，固定排在最前
      if (Number.isNaN(a.delta)) return -1;
      if (Number.isNaN(b.delta)) return 1;
      return a.delta - b.delta;
    });

    const tbody = el['ov-table'].querySelector('tbody');
    list.forEach((row) => {
      const tr = ovCache.rows.get(row.def.key);
      if (!tr) return;
      const cells = tr.children;
      const c1 = Number.isNaN(row.r) ? '—' : fmtAU(row.r, 3);
      const c2 = Number.isNaN(row.delta) ? '—' : fmtAU(row.delta, 3);
      const c3 = Number.isNaN(row.delta) ? '—' : fmtLightTimeShort(row.delta);
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
    ctx.bodies.forEach((entry, key) => {
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
      node.style.display = 'block';
      node.style.left = sx.toFixed(1) + 'px';
      node.style.top = (sy + Math.max(14, Math.min(r + 14, rect.height * 0.25))).toFixed(1) + 'px';
      node.classList.toggle('is-selected', key === selected);
      node.style.opacity = key === selected || key === hovered ? '1' : '0.82';
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

    if (selected !== lastSelectedRendered) renderDetail(selected);
    if (selected) {
      el['d-stamp'].textContent = 'UTC ' + utcString(date);
      renderLive(selected, states, state.jd);
    }
    renderOverview(states, selected);
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

  SS.UI = { init, frame, setSelected, setHovered, hideLoading, fatal };
})(typeof window !== 'undefined' ? window : globalThis);
