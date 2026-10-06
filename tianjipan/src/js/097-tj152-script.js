(function () {
  "use strict";
  const BUILD = "v163 · 2026-10-05 15:02 +08:00";
  const C = 500;
  const PLANETS = ["水星", "金星", "地球", "火星", "木星", "土星", "天王星", "海王星"];
  const GLYPH = {
    太阳: "☉",
    水星: "☿",
    金星: "♀",
    地球: "⊕",
    火星: "♂",
    木星: "♃",
    土星: "♄",
    天王星: "♅",
    海王星: "♆",
  };
  const COLOR = {
    太阳: "#ffd54f",
    水星: "#d9e3ee",
    金星: "#ffd166",
    地球: "#4da3ff",
    火星: "#ff704f",
    木星: "#ffb35f",
    土星: "#ffe08a",
    天王星: "#52e0df",
    海王星: "#718cff",
  };
  const ORBIT = [64, 88, 116, 148, 184, 224, 264, 304];
  const ZN = [
    "白羊",
    "金牛",
    "双子",
    "巨蟹",
    "狮子",
    "处女",
    "天秤",
    "天蝎",
    "射手",
    "摩羯",
    "水瓶",
    "双鱼",
  ];
  const ZG = ["♈", "♉", "♊", "♋", "♌", "♍", "♎", "♏", "♐", "♑", "♒", "♓"];
  const BR = "子 丑 寅 卯 辰 巳 午 未 申 酉 戌 亥".split(" ");
  const TERM_FALLBACK = [
    ["春分", 0],
    ["清明", 15],
    ["谷雨", 30],
    ["立夏", 45],
    ["小满", 60],
    ["芒种", 75],
    ["夏至", 90],
    ["小暑", 105],
    ["大暑", 120],
    ["立秋", 135],
    ["处暑", 150],
    ["白露", 165],
    ["秋分", 180],
    ["寒露", 195],
    ["霜降", 210],
    ["立冬", 225],
    ["小雪", 240],
    ["大雪", 255],
    ["冬至", 270],
    ["小寒", 285],
    ["大寒", 300],
    ["立春", 315],
    ["雨水", 330],
    ["惊蛰", 345],
  ];
  const TJ153_RING_COLOR = {
    month: "#63c7ff",
    term: "#f5c85f",
    zodiac: "#c39aff",
    xiu: "#86aef1",
    wuxing: "#7ad6a1",
    stem: "#ffad74",
    branch: "#ead17f",
    bagua: "#74d8cc",
    hex64: "#d89bef",
    yq: "#ef8c82",
    lz: "#78d9e1",
  };
  const TJ153_WX = ["木", "火", "土", "金", "水"];
  const TJ153_WX_COLOR = {
    木: "#66d28f",
    火: "#ff756b",
    土: "#d7ad65",
    金: "#e8edf5",
    水: "#5fa8ff",
  };
  const TJ153_GAN = "甲乙丙丁戊己庚辛壬癸".split("");
  const TJ153_GAN_WX = [0, 0, 1, 1, 2, 2, 3, 3, 4, 4];
  const TJ153_ZHI_WX = [4, 2, 0, 0, 2, 1, 1, 2, 3, 3, 2, 4];
  const TJ153_TERM_CACHE = new Map();
  const ST = {
    mode: "observe",
    jd: NaN,
    selected: { kind: "planet", name: "地球" },
    playing: false,
    timer: 0,
    step: 7,
    layers: {
      planet: 1,
      month: 1,
      term: 1,
      zodiac: 1,
      xiu: 0,
      wuxing: 1,
      stem: 1,
      branch: 1,
      bagua: 1,
      hex64: 0,
      yq: 0,
      lz: 0,
    },
    view: { x: 0, y: 0, w: 1000, h: 1000, min: 260, max: 1550 },
    big: false,
    inverseTargets: {},
    inverseResults: [],
    inverseSearching: false,
    inverseFrom: 1900,
    inverseTo: 2100,
    inverseExtra: {
      termOn: false,
      term: "冬至",
      phaseOn: false,
      phase: 180,
      angleOn: false,
      angle: 180,
    },
    uiMode: "pro",
    inverseView: "pro",
    layerTab: "all",
    inverseStep: 1,
    temporalEngine: "condition",
    similarRefJD: NaN,
    similarResults: [],
    similarSearching: false,
    similarFrom: 1900,
    similarTo: 2100,
    similarExclude: 45,
    similarFeatures: { inner: 1, outer: 1, moon: 1, season: 0 },
  };
  const INV_PHASES = [
    { v: 0, n: "朔 · 新月" },
    { v: 45, n: "蛾眉 / 上弦前" },
    { v: 90, n: "上弦" },
    { v: 135, n: "盈凸" },
    { v: 180, n: "望 · 满月" },
    { v: 225, n: "亏凸" },
    { v: 270, n: "下弦" },
    { v: 315, n: "残月" },
  ];
  const MODE_META = {
    observe: {
      title: "观象：看此刻的时空结构",
      desc: "用于观察当前或指定时刻的天体、节气、月份、卦象等盘层分布。点击盘上的行星、节气、卦象或盘层名称，可查看对应说明。",
      tag: "适合先看格局",
    },
    compare: {
      title: "出生 × 时空：对照本命与当前",
      desc: "用于把“出生时刻”与“当前/指定时刻”放在同一个天机式里比较。会显示当前射线与出生射线，也可比较行星出生位置与当前位置。",
      tag: "适合对照变化",
    },
    simulate: {
      title: "推演：沿时间轴前后推移",
      desc: "用于把时间往前或往后推进，观察盘面如何变化。可拖动时间轴、切换步长，或点击播放来做连续推演。",
      tag: "适合看过程",
    },
    inverse: {
      title: "时空搜索：从条件或状态反查时间",
      desc: "把天机式从“看时间”升级为“搜时间”：可以按行星、节气、月相等条件寻找日期，也可以寻找历史/未来与某一时刻最相似的时空状态；手动拖星仍作为高级输入方式保留。",
      tag: "条件搜索 · 相似时刻 · 手排反演",
    },
  };
  const LAYER_GROUP_HELP = {
    天体: "真实天体与轨道骨架",
    天时: "对应月份与节令节气",
    天象: "黄道与宿度参照层",
    五行: "五行、天干、地支符号层",
    易象: "八卦与六十四卦语义层",
    传统: "五运六气与子午流注",
  };
  let TJ152_TOAST_TIMER = 0;
  function q(s, r) {
    return (r || document).querySelector(s);
  }
  function qa(s, r) {
    return Array.from((r || document).querySelectorAll(s));
  }
  function norm(a) {
    return ((a % 360) + 360) % 360;
  }
  function esc(x) {
    return String(x == null ? "" : x).replace(
      /[&<>\"]/g,
      (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '\"': "&quot;" })[c],
    );
  }
  function nowJD() {
    return Date.now() / 86400000 + 2440587.5;
  }
  function jdDate(jd) {
    return new Date((jd - 2440587.5) * 86400000);
  }
  function fmtJD(jd) {
    try {
      if (typeof orr3dFmt === "function") return orr3dFmt(jd);
    } catch (_) {}
    const d = jdDate(jd);
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")} ${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`;
  }
  function dateJD(y, m, d, h) {
    try {
      if (typeof jdFromGreg === "function") return jdFromGreg(y, m, d, h || 0) - 8 / 24;
    } catch (_) {}
    return Date.UTC(y, m - 1, d, h || 0) / 86400000 + 2440587.5;
  }
  function birthJD() {
    try {
      if (typeof v127BirthCiv === "function" && typeof v127ToJD === "function") {
        const c = v127BirthCiv();
        if (c) {
          const j = v127ToJD(c);
          if (Number.isFinite(j)) return j;
        }
      }
    } catch (_) {}
    return NaN;
  }
  function activeJD() {
    if (!Number.isFinite(ST.jd))
      ST.jd = window.ORR3D && Number.isFinite(ORR3D.jd) ? ORR3D.jd : nowJD();
    return ST.jd;
  }
  function syncJD(jd, heavy) {
    ST.jd = jd;
    if (window.ORR3D) ORR3D.jd = jd;
    if (heavy && typeof v127SetJD === "function") {
      try {
        v127SetJD(jd, "custom", "天机式");
      } catch (_) {}
    }
  }
  function helio(name, jd) {
    if (typeof asHelio !== "function") return null;
    try {
      const h = asHelio(name, (jd - 2451545) / 36525);
      if (!h || ![h.x, h.y, h.z].every(Number.isFinite)) return null;
      return { lon: norm((Math.atan2(h.y, h.x) * 180) / Math.PI), r: Math.hypot(h.x, h.y, h.z) };
    } catch (_) {
      return null;
    }
  }
  function circErr(a, b) {
    let d = Math.abs(norm(a) - norm(b));
    return d > 180 ? 360 - d : d;
  }
  function invTargetNames() {
    return PLANETS.filter((n) => Number.isFinite(ST.inverseTargets[n]));
  }
  function invActualLon(name, jd) {
    const h = helio(name, jd);
    return h ? norm(h.lon) : NaN;
  }
  function invSetTarget(name, lon, rerender) {
    if (!PLANETS.includes(name) || !Number.isFinite(lon)) return;
    ST.inverseTargets[name] = norm(lon);
    ST.selected = { kind: "planet", name };
    syncInverseInputs(name);
    if (rerender !== false) render();
  }
  function invClearTarget(name) {
    delete ST.inverseTargets[name];
    syncInverseInputs(name);
    render();
  }
  function moonElongAt(jd) {
    try {
      if (typeof nwElong === "function") return norm(nwElong(jd));
    } catch (_) {}
    try {
      if (typeof asMoonLon === "function")
        return norm(asMoonLon((jd - 2451545) / 36525) - sunLon(jd));
    } catch (_) {}
    return NaN;
  }
  function moonSepAt(jd) {
    const e = moonElongAt(jd);
    return Number.isFinite(e) ? Math.min(e, 360 - e) : NaN;
  }
  function phaseNameAt(jd) {
    const e = moonElongAt(jd);
    if (!Number.isFinite(e)) return "—";
    const i = Math.floor(((e + 22.5) % 360) / 45);
    return INV_PHASES[i].n;
  }
  function termDegByName(name) {
    const x = TERM_FALLBACK.find((t) => t[0] === name);
    if (x) return Number(x[1]);
    try {
      const y = terms().find((t) => t[0] === name);
      return y ? Number(y[1]) : NaN;
    } catch (_) {
      return NaN;
    }
  }
  function nearestTermNameAt(jd) {
    const sl = sunLon(jd);
    let best = TERM_FALLBACK[0],
      err = 999;
    for (const t of TERM_FALLBACK) {
      const e = circErr(sl, t[1]);
      if (e < err) {
        err = e;
        best = t;
      }
    }
    return best[0];
  }
  function invExtraList() {
    const a = [],
      x = ST.inverseExtra || {};
    if (x.termOn) a.push(`节气 ${x.term}`);
    if (x.phaseOn) {
      const p = INV_PHASES.find((v) => v.v === +x.phase);
      a.push(`月相 ${p ? p.n : x.phase + "°"}`);
    }
    if (x.angleOn) a.push(`日月角距 ${(+x.angle).toFixed(1)}°`);
    return a;
  }
  function invConstraintCount() {
    return invTargetNames().length + invExtraList().length;
  }
  function invEffectiveConstraintCount() {
    const x = ST.inverseExtra || {};
    return (
      invTargetNames().length +
      (x.termOn ? 1 : 0) +
      (x.phaseOn ? 1 : 0) +
      (x.angleOn ? (x.phaseOn ? 0.35 : 1) : 0)
    );
  }
  function invScore(jd, names) {
    let sum = 0,
      wSum = 0,
      max = 0,
      n = 0;
    const parts = [];
    const add = (label, e, w) => {
      if (!Number.isFinite(e)) return;
      sum += e * e * w;
      wSum += w;
      if (e > max) max = e;
      n++;
      parts.push(`${label} ${e.toFixed(2)}°`);
    };
    for (const name of names) {
      const h = helio(name, jd);
      if (!h) continue;
      add(name, circErr(h.lon, ST.inverseTargets[name]), 1);
    }
    const x = ST.inverseExtra || {};
    if (x.termOn) {
      const td = termDegByName(x.term);
      if (Number.isFinite(td)) add("节气", circErr(sunLon(jd), td), 1.35);
    }
    if (x.phaseOn) {
      const e = moonElongAt(jd);
      if (Number.isFinite(e)) add("月相", circErr(e, +x.phase), 1.35);
    }
    if (x.angleOn) {
      const a = moonSepAt(jd);
      if (Number.isFinite(a)) add("日月角距", Math.abs(a - +x.angle), x.phaseOn ? 0.45 : 1.15);
    }
    return n
      ? { rms: Math.sqrt(sum / wSum), max, n, parts }
      : { rms: 999, max: 999, n: 0, parts: [] };
  }
  function invFitLabel(r) {
    return r <= 0.5 ? "极高" : r <= 2 ? "高" : r <= 5 ? "较高" : r <= 10 ? "近似" : "低";
  }
  function invPartsText(r) {
    return r && Array.isArray(r.parts) && r.parts.length ? r.parts.slice(0, 5).join(" · ") : "—";
  }
  function clientToSvgPos(svg, cx, cy) {
    const r = svg.getBoundingClientRect();
    if (!r.width || !r.height) return null;
    return {
      x: ST.view.x + ((cx - r.left) / r.width) * ST.view.w,
      y: ST.view.y + ((cy - r.top) / r.height) * ST.view.h,
    };
  }
  function pointToLon(pt) {
    return norm((Math.atan2(pt.y - C, pt.x - C) * 180) / Math.PI + 90);
  }
  function syncInverseInputs(name) {
    const row = q(`[data-inv-row="${name}"]`),
      val = ST.inverseTargets[name],
      actual = invActualLon(name, activeJD());
    if (!row) return;
    row.classList.toggle("on", Number.isFinite(val));
    const ck = q("[data-inv-check]", row),
      inp = q("[data-inv-angle]", row);
    if (ck) ck.checked = Number.isFinite(val);
    if (inp && document.activeElement !== inp)
      inp.value = (Number.isFinite(val) ? val : actual).toFixed(1);
  }
  function renderInverseExtras() {
    const x = ST.inverseExtra || {};
    const termOn = q("#tj157TermOn"),
      term = q("#tj157Term"),
      phaseOn = q("#tj157PhaseOn"),
      phase = q("#tj157Phase"),
      angleOn = q("#tj157AngleOn"),
      angle = q("#tj157Angle"),
      sum = q("#tj157ExtraSummary");
    if (termOn) termOn.checked = !!x.termOn;
    if (term && document.activeElement !== term) term.value = x.term || "冬至";
    if (phaseOn) phaseOn.checked = !!x.phaseOn;
    if (phase && document.activeElement !== phase)
      phase.value = String(Number.isFinite(+x.phase) ? +x.phase : 180);
    if (angleOn) angleOn.checked = !!x.angleOn;
    if (angle && document.activeElement !== angle)
      angle.value = Number.isFinite(+x.angle) ? (+x.angle).toFixed(1) : "180.0";
    if (sum) {
      const a = invExtraList(),
        corr =
          x.phaseOn && x.angleOn
            ? " <b>注意：月相与日月角距高度相关，不应视作两份独立证据；系统已自动降低角距的重复权重。</b>"
            : "";
      sum.innerHTML = a.length
        ? `附加时空约束：<b>${a.join(" · ")}</b>。月相保留盈亏方向（0–360°）；日月角距只看几何分离度（0–180°）。${corr}`
        : "尚未启用附加时空约束。可只用行星，也可把节气、月相、日月角距一起加入反演。";
    }
  }
  function renderInversePanel() {
    const box = q("#tj155Inverse");
    if (!box) return;
    box.classList.toggle("on", ST.mode === "inverse");
    box.dataset.view = ST.inverseView || "pro";
    if (ST.mode !== "inverse") {
      syncViewButtons();
      if (typeof syncInverseWizard === "function") syncInverseWizard();
      return;
    }
    const list = q("#tj155Targets"),
      res = q("#tj155Results"),
      status = q("#tj155Status");
    const ordered = PLANETS.slice().sort(
      (a, b) =>
        (Number.isFinite(ST.inverseTargets[b]) ? 1 : 0) -
        (Number.isFinite(ST.inverseTargets[a]) ? 1 : 0),
    );
    if (list) {
      list.innerHTML = ordered
        .map((n) => {
          const v = ST.inverseTargets[n],
            a = invActualLon(n, activeJD()),
            on = Number.isFinite(v);
          return `<div class="tj155-target${on ? " on" : ""}" data-inv-row="${n}" style="--pc:${COLOR[n]}"><input type="checkbox" data-inv-check="${n}" ${on ? "checked" : ""} aria-label="纳入${n}反演"><span class="dot"></span><b>${GLYPH[n] || ""} ${n}</b><input type="number" min="0" max="359.9" step="0.1" data-inv-angle="${n}" value="${(on ? v : a).toFixed(1)}" aria-label="${n}目标黄经"><button type="button" data-inv-clear="${n}" title="清除${n}约束">×</button></div>`;
        })
        .join("");
    }
    renderInverseExtras();
    if (status) {
      const names = invTargetNames(),
        extra = invExtraList(),
        total = names.length + extra.length;
      status.innerHTML = total
        ? `当前共 <b>${total}</b> 项反演约束：${names.length ? `行星 ${names.join("、")}` : ""}${names.length && extra.length ? "；" : ""}${extra.length ? extra.join("、") : ""}。约束越多、越独立，反推出的时间辨识度通常越高。`
        : "尚未设置反演条件。可拖动行星，或启用节气 / 月相 / 日月角距。";
    }
    if (res) {
      res.innerHTML = ST.inverseResults.length
        ? ST.inverseResults
            .map(
              (r, i) =>
                `<div class="tj155-result"><div><b>${i + 1}. ${fmtJD(r.jd)}</b><small>匹配度 ${invFitLabel(r.rms)} · 最大误差 ${r.max.toFixed(2)}°<br>${esc(invPartsText(r))}</small></div><span class="err">综合均方误差 ${r.rms.toFixed(2)}°</span><button type="button" data-inv-apply="${r.jd}">应用此时刻</button></div>`,
            )
            .join("")
        : "";
    }
    syncViewButtons();
    if (typeof syncInverseWizard === "function") syncInverseWizard();
  }
  async function inverseSolve() {
    if (ST.inverseSearching) return;
    const names = invTargetNames(),
      extra = invExtraList(),
      constraintCount = names.length + extra.length,
      status = q("#tj155Status");
    if (!constraintCount) {
      toast("请至少设置一项反演约束：行星、节气、月相或日月角距");
      return;
    }
    let y1 = parseInt(q("#tj155From")?.value || ST.inverseFrom, 10),
      y2 = parseInt(q("#tj155To")?.value || ST.inverseTo, 10);
    y1 = Math.max(1600, Math.min(2400, Number.isFinite(y1) ? y1 : 1900));
    y2 = Math.max(1600, Math.min(2400, Number.isFinite(y2) ? y2 : 2100));
    if (y1 > y2) [y1, y2] = [y2, y1];
    if (y2 - y1 > 500) {
      y2 = y1 + 500;
      toast("单次反演范围已限制为500年");
    }
    ST.inverseFrom = y1;
    ST.inverseTo = y2;
    const start = dateJD(y1, 1, 1, 0),
      end = dateJD(y2, 12, 31, 23),
      hasInner = names.some((n) => n === "水星" || n === "金星"),
      hasMid = names.some((n) => n === "地球" || n === "火星"),
      x = ST.inverseExtra || {};
    let coarse = hasInner ? 3 : hasMid ? 5 : 10;
    if (x.termOn) coarse = Math.min(coarse, 2);
    if (x.phaseOn || x.angleOn) coarse = Math.min(coarse, 1.5);
    const best = [],
      cap = 48;
    function pack(j, s) {
      return { jd: j, rms: s.rms, max: s.max, parts: s.parts };
    }
    function push(j, s) {
      best.push(pack(j, s));
      best.sort((a, b) => a.rms - b.rms);
      if (best.length > cap) best.length = cap;
    }
    ST.inverseSearching = true;
    ST.inverseResults = [];
    renderInversePanel();
    const solveBtn = q("#tj155Solve");
    if (solveBtn) {
      solveBtn.disabled = true;
      solveBtn.textContent = "反演中…";
    }
    let i = 0,
      total = Math.max(1, Math.ceil((end - start) / coarse));
    for (let jd = start; jd <= end; jd += coarse) {
      push(jd, invScore(jd, names));
      if (++i % 700 === 0) {
        if (status)
          status.textContent = `正在粗搜 ${y1}–${y2}：${Math.min(99, Math.round((i / total) * 100))}% · ${constraintCount}项约束`;
        await new Promise((r) => setTimeout(r, 0));
      }
    }
    const seeds = [];
    for (const b of best) {
      if (!seeds.some((x) => Math.abs(x.jd - b.jd) < coarse * 2)) {
        seeds.push(b);
        if (seeds.length >= 22) break;
      }
    }
    const refined = [];
    for (let si = 0; si < seeds.length; si++) {
      let center = seeds[si].jd,
        span = coarse,
        step = coarse / 4,
        bestLocal = seeds[si];
      for (let stage = 0; stage < 5; stage++) {
        let local = bestLocal;
        for (let jd = center - span; jd <= center + span + 1e-9; jd += step) {
          const s = invScore(jd, names);
          if (s.rms < local.rms) local = pack(jd, s);
        }
        bestLocal = local;
        center = local.jd;
        span = step * 2;
        step = Math.max(0.01, step / 5);
      }
      refined.push(bestLocal);
      if (status) status.textContent = `正在精修候选 ${si + 1}/${seeds.length}…`;
      await new Promise((r) => setTimeout(r, 0));
    }
    refined.sort((a, b) => a.rms - b.rms);
    const uniq = [];
    for (const r of refined) {
      if (!uniq.some((x) => Math.abs(x.jd - r.jd) < 1.2)) {
        uniq.push(r);
        if (uniq.length >= 8) break;
      }
    }
    ST.inverseResults = uniq;
    ST.inverseSearching = false;
    if (solveBtn) {
      solveBtn.disabled = false;
      solveBtn.textContent = "反推时间";
    }
    renderInversePanel();
    if (status && uniq.length) {
      const b = uniq[0],
        weak = invEffectiveConstraintCount() < 1.7;
      status.innerHTML = `反演完成。最佳候选 <b>${fmtJD(b.jd)}</b>，综合均方误差 <b>${b.rms.toFixed(2)}°</b>，最大误差 <b>${b.max.toFixed(2)}°</b>。${weak ? "当前约束较少，通常会存在大量等价时间；建议再增加至少一项独立条件。" : b.rms > 10 ? "当前组合很可能没有精确对应的真实时刻，只能给出最近似解。" : "可应用候选时刻，再观察模型位置与目标状态的贴合程度。"}`;
    }
    if (ST.inverseView === "simple") {
      ST.inverseStep = 4;
      syncInverseWizard();
    }
    toast("多条件时空反演完成");
  }

  function sunLon(jd) {
    try {
      if (typeof sunLonAt === "function") return norm(sunLonAt(jd));
    } catch (_) {}
    const e = helio("地球", jd);
    return e ? norm(e.lon + 180) : 0;
  }
  function terms() {
    if (Array.isArray(window.TERMS) && TERMS.length >= 24)
      return TERMS.map((t) => [t[0], Number(t[1])]);
    return TERM_FALLBACK;
  }
  function yearBJ(jd) {
    try {
      if (typeof fromJD === "function") return fromJD(jd + 8 / 24).y;
    } catch (_) {}
    return jdDate(jd + 8 / 24).getUTCFullYear();
  }
  function months(jd) {
    const y = yearBJ(jd),
      names = "一月 二月 三月 四月 五月 六月 七月 八月 九月 十月 十一月 十二月".split(" "),
      st = [];
    for (let m = 1; m <= 12; m++) {
      const j = dateJD(y, m, 1, 12);
      st.push({ m, jd: j, earth: norm(sunLon(j) + 180) });
    }
    const jn = dateJD(y + 1, 1, 1, 12),
      next = norm(sunLon(jn) + 180),
      out = [];
    for (let i = 0; i < 12; i++) {
      const a = st[i].earth,
        b = i === 11 ? next : st[i + 1].earth,
        d = norm(b - a);
      out.push({
        name: names[i],
        m: i + 1,
        start: a,
        end: b,
        center: norm(a + d / 2),
        jd: st[i].jd,
        nextJD: i === 11 ? jn : st[i + 1].jd,
      });
    }
    return out;
  }
  function signedAng(a) {
    return ((a + 540) % 360) - 180;
  }
  function termData(jd) {
    const y = yearBJ(jd);
    if (TJ153_TERM_CACHE.has(y)) return TJ153_TERM_CACHE.get(y);
    const base = dateJD(y, 3, 20, 12),
      arr = terms().map((t) => {
        const target = norm(t[1]),
          delta = target > 270 ? target - 360 : target,
          guess = base + (delta / 360) * 365.2422;
        let x = guess;
        for (let k = 0; k < 7; k++) {
          const d = signedAng(sunLon(x) - target);
          x -= d / 0.98564736;
        }
        return { name: t[0], sun: target, jd: x, earth: norm(sunLon(x) + 180) };
      });
    TJ153_TERM_CACHE.set(y, arr);
    return arr;
  }
  function termDateText(name, jd) {
    const a = termData(jd).find((x) => x.name === name);
    if (!a) return "—";
    try {
      const d = typeof fromJD === "function" ? fromJD(a.jd + 8 / 24) : null;
      if (d)
        return `${d.y}-${String(d.m).padStart(2, "0")}-${String(d.d).padStart(2, "0")} ${String(d.hh || 0).padStart(2, "0")}:${String(d.mi || 0).padStart(2, "0")}`;
    } catch (_) {}
    return fmtJD(a.jd);
  }
  function xius(jd) {
    try {
      const y =
        (typeof fromJD === "function" ? fromJD(jd + 8 / 24) : null)?.y ||
        jdDate(jd).getUTCFullYear();
      if (typeof xiuTable === "function") {
        const a = xiuTable(y);
        if (Array.isArray(a)) return a;
      }
    } catch (_) {}
    return [];
  }
  function branchIndex(jd) {
    try {
      if (typeof fromJD === "function") {
        const d = fromJD(jd + 8 / 24),
          h = (d.hh || 0) + (d.mi || 0) / 60;
        return Math.floor(((h + 1) % 24) / 2) % 12;
      }
    } catch (_) {}
    const d = jdDate(jd + 8 / 24),
      h = d.getUTCHours() + d.getUTCMinutes() / 60;
    return Math.floor(((h + 1) % 24) / 2) % 12;
  }
  function qiData(jd) {
    try {
      const sl = sunLon(jd),
        d = typeof fromJD === "function" ? fromJD(jd + 8 / 24) : null;
      if (d && typeof ganzhiIdx === "function" && typeof wuyunLiuqi === "function") {
        const gy = d.m <= 2 && sl < 315 ? d.y - 1 : d.y,
          idx = ganzhiIdx((((gy - 4) % 10) + 10) % 10, (((gy - 4) % 12) + 12) % 12);
        return wuyunLiuqi(idx, sl);
      }
    } catch (_) {}
    const sl = sunLon(jd),
      step = Math.min(5, Math.floor(norm(sl - 300) / 60));
    return {
      step,
      guest: ["初气", "二气", "三气", "四气", "五气", "终气"],
      yunName: "—",
      siTian: "—",
      zaiQuan: "—",
    };
  }
  function lzData(jd) {
    const i = branchIndex(jd);
    try {
      if (Array.isArray(window.ZW_LZ) && ZW_LZ[i]) return { i, row: ZW_LZ[i] };
    } catch (_) {}
    return { i, row: [BR[i], "—", "—", "—", 0, "—"] };
  }
  function P(r, a) {
    const t = ((a - 90) * Math.PI) / 180;
    return [C + r * Math.cos(t), C + r * Math.sin(t)];
  }
  function line(r1, r2, a, cls) {
    const A = P(r1, a),
      B = P(r2, a);
    return `<line x1="${A[0].toFixed(1)}" y1="${A[1].toFixed(1)}" x2="${B[0].toFixed(1)}" y2="${B[1].toFixed(1)}" class="${cls || "tj152-gridline"}"/>`;
  }
  function arcSector(r1, r2, a1, a2, fill, opacity) {
    const A = P(r2, a1),
      B = P(r2, a2),
      C1 = P(r1, a2),
      D = P(r1, a1),
      da = (((a2 - a1) % 360) + 360) % 360,
      lg = da > 180 ? 1 : 0;
    return `<path d="M${A[0].toFixed(1)},${A[1].toFixed(1)} A${r2},${r2} 0 ${lg} 1 ${B[0].toFixed(1)},${B[1].toFixed(1)} L${C1[0].toFixed(1)},${C1[1].toFixed(1)} A${r1},${r1} 0 ${lg} 0 ${D[0].toFixed(1)},${D[1].toFixed(1)} Z" fill="${fill}" opacity="${opacity}"/>`;
  }
  function hitSector(r1, r2, a1, a2, color, op, kind, name, title) {
    const A = P(r2, a1),
      B = P(r2, a2),
      C1 = P(r1, a2),
      D = P(r1, a1),
      da = norm(a2 - a1),
      lg = da > 180 ? 1 : 0,
      sel = ST.selected.kind === kind && ST.selected.name === name;
    return `<path d="M${A[0].toFixed(1)},${A[1].toFixed(1)} A${r2},${r2} 0 ${lg} 1 ${B[0].toFixed(1)},${B[1].toFixed(1)} L${C1[0].toFixed(1)},${C1[1].toFixed(1)} A${r1},${r1} 0 ${lg} 0 ${D[0].toFixed(1)},${D[1].toFixed(1)} Z" fill="${color}" stroke="${color}" opacity="${op}" class="tj153-sector tj152-hit${sel ? " sel" : ""}" data-kind="${kind}" data-name="${esc(name)}"><title>${esc(title || name)}</title></path>`;
  }
  function ringColor(k) {
    return TJ153_RING_COLOR[k] || "#d9c697";
  }
  function triByIndex(i) {
    try {
      return typeof TRI !== "undefined" && TRI[i] ? TRI[i] : null;
    } catch (_) {
      return null;
    }
  }
  function hex64Data() {
    try {
      if (
        typeof guaRing === "function" &&
        typeof hexFromTri === "function" &&
        typeof ZY_BY !== "undefined"
      ) {
        return guaRing("xt").map(([u, l], i) => {
          const lines = hexFromTri(u, l),
            id = lines.join(""),
            z = ZY_BY[id] || {},
            kw = typeof hexInfo === "function" ? hexInfo(lines).kw : i + 1;
          return {
            id,
            name: z.name || "第" + (i + 1) + "卦",
            kw: kw || i + 1,
            u,
            l,
            gua: z.gua || "",
            xiang: z.xiang || "",
          };
        });
      }
    } catch (_) {}
    return Array.from({ length: 64 }, (_, i) => ({
      id: String(i),
      name: "第" + (i + 1) + "卦",
      kw: i + 1,
      u: 0,
      l: 0,
      gua: "",
      xiang: "",
    }));
  }

  function label(txt, r, a, size, color, kind, name, weight) {
    const p = P(r, a),
      aa = norm(a),
      rot = aa > 90 && aa < 270 ? a + 180 : a;
    return `<text x="${p[0].toFixed(1)}" y="${p[1].toFixed(1)}" transform="rotate(${rot.toFixed(1)} ${p[0].toFixed(1)} ${p[1].toFixed(1)})" text-anchor="middle" dominant-baseline="central" font-size="${size}" font-weight="${weight || 500}" fill="${color}" class="tj152-label${kind ? " tj152-hit" : ""}"${kind ? ` data-kind="${kind}" data-name="${esc(name)}"` : ""}>${esc(txt)}</text>`;
  }
  function laneLabel(txt, r, w, a, size, color, kind, name, weight, lane, count) {
    count = Math.max(1, count || 1);
    lane = Math.max(0, Math.min(count - 1, lane || 0));
    const frac = count === 1 ? 0.52 : 0.24 + lane * (0.52 / Math.max(1, count - 1)),
      rr = r + w * frac,
      sz = Math.max(5.2, size * (ST.uiMode === "simple" ? 0.94 : 1));
    return label(txt, rr, a, sz, color, kind, name, weight);
  }
  function band(out, r, w) {
    out.push(
      `<circle cx="${C}" cy="${C}" r="${r}" class="tj152-bandline"/><circle cx="${C}" cy="${C}" r="${r + w}" class="tj152-bandline"/>`,
    );
  }
  function renderRing(out, key, r, w, jd) {
    const col = ringColor(key),
      fs = Math.max(6.4, Math.min(11.5, w * 0.36));
    band(out, r, w);
    if (key === "month") {
      months(jd).forEach((m) => {
        out.push(
          hitSector(r, r + w, m.start, m.end, col, 0.1, "month", m.name, `${m.name} · 公历月`),
        );
        out.push(line(r, r + w, m.start));
        out.push(
          label(m.name, r + w * 0.52, m.center, Math.max(8.5, fs), col, "month", m.name, 600),
        );
      });
      return;
    }
    if (key === "term") {
      const td = termData(jd);
      td.forEach((t, i) => {
        const a = t.earth;
        out.push(
          hitSector(
            r,
            r + w,
            a - 7.5,
            a + 7.5,
            col,
            0.09,
            "term",
            t.name,
            `${t.name} · ${termDateText(t.name, jd)}`,
          ),
        );
        out.push(line(r, r + w, a));
        out.push(
          laneLabel(
            t.name,
            r,
            w,
            a,
            Math.max(7.1, fs * 0.88),
            col,
            "term",
            t.name,
            i % 3 === 0 ? 700 : 500,
            i % 2,
            2,
          ),
        );
      });
      return;
    }
    if (key === "zodiac") {
      for (let i = 0; i < 12; i++) {
        const a = norm(i * 30 + 180),
          name = ZN[i];
        out.push(
          hitSector(
            r,
            r + w,
            a,
            a + 30,
            col,
            0.085,
            "zodiac",
            name,
            `${ZG[i]} ${name}座 · 太阳黄经 ${i * 30}°–${i * 30 + 30}°`,
          ),
        );
        out.push(line(r, r + w, a));
        out.push(
          label(
            `${ZG[i]} ${name}`,
            r + w * 0.52,
            a + 15,
            Math.max(8, fs),
            col,
            "zodiac",
            name,
            600,
          ),
        );
      }
      return;
    }
    if (key === "xiu") {
      const xs = xius(jd);
      if (xs.length) {
        xs.forEach((x, i) => {
          const a0 = norm(x.s + 180),
            a1 = norm(x.s + x.w + 180),
            c = norm(x.s + x.w / 2 + 180);
          out.push(
            hitSector(
              r,
              r + w,
              a0,
              a1,
              col,
              0.08,
              "xiu",
              x.n,
              `${x.n}宿 · 宿度约 ${x.w.toFixed(2)}°`,
            ),
          );
          out.push(line(r, r + w, a0));
          out.push(
            laneLabel(x.n, r, w, c, Math.max(6.1, fs * 0.78), col, "xiu", x.n, 500, i % 3, 3),
          );
        });
      }
      return;
    }
    if (key === "wuxing") {
      TJ153_WX.forEach((n, i) => {
        const a = i * 72,
          c = TJ153_WX_COLOR[n];
        out.push(hitSector(r, r + w, a, a + 72, c, 0.16, "wuxing", n, `${n} · 五行符号分类层`));
        out.push(line(r, r + w, a));
        out.push(label(n, r + w * 0.52, a + 36, Math.max(10, fs * 1.1), c, "wuxing", n, 700));
      });
      return;
    }
    if (key === "stem") {
      for (let i = 0; i < 10; i++) {
        const n = TJ153_GAN[i],
          wx = TJ153_WX[TJ153_GAN_WX[i]],
          c = TJ153_WX_COLOR[wx],
          a = i * 36;
        out.push(hitSector(r, r + w, a, a + 36, c, 0.12, "stem", n, `${n} · ${wx}`));
        out.push(line(r, r + w, a));
        out.push(label(n, r + w * 0.52, a + 18, Math.max(9, fs), c, "stem", n, 700));
      }
      return;
    }
    if (key === "branch") {
      for (let i = 0; i < 12; i++) {
        const n = BR[i],
          wx = TJ153_WX[TJ153_ZHI_WX[i]],
          c = TJ153_WX_COLOR[wx],
          a = i * 30;
        out.push(hitSector(r, r + w, a, a + 30, c, 0.105, "branch", n, `${n} · ${wx}`));
        out.push(line(r, r + w, a));
        out.push(label(n, r + w * 0.52, a + 15, Math.max(9, fs), c, "branch", n, 700));
      }
      return;
    }
    if (key === "bagua") {
      const M =
        typeof GUA_HT !== "undefined"
          ? GUA_HT
          : { 3: 0, 8: 45, 2: 90, 1: 135, 6: 180, 7: 225, 4: 270, 5: 315 };
      Object.entries(M).forEach(([ti, a]) => {
        const T = triByIndex(+ti),
          n = T ? T.n : String(ti),
          img = T && T.img ? T.img : "",
          wx = T && Number.isFinite(T.wx) ? TJ153_WX[T.wx] : "—",
          c = wx !== "—" ? TJ153_WX_COLOR[wx] : col;
        out.push(
          hitSector(
            r,
            r + w,
            a - 22.5,
            a + 22.5,
            c,
            0.13,
            "bagua",
            n,
            `后天八卦 · ${n}${img ? " " + img : ""} · ${wx}`,
          ),
        );
        out.push(line(r, r + w, a - 22.5));
        out.push(label(`${img} ${n}`.trim(), r + w * 0.52, a, Math.max(8, fs), c, "bagua", n, 700));
      });
      return;
    }
    if (key === "hex64") {
      const hs = hex64Data();
      hs.forEach((h, i) => {
        const a = 180 + i * 5.625,
          mid = a + 2.8125,
          sym = String.fromCodePoint(0x4dc0 + Math.max(0, Math.min(63, (h.kw || i + 1) - 1)));
        out.push(
          hitSector(
            r,
            r + w,
            a,
            a + 5.625,
            col,
            i % 2 ? 0.075 : 0.11,
            "hex64",
            h.name,
            `${sym} ${h.name} · 第 ${h.kw} 卦`,
          ),
        );
        out.push(line(r, r + w, a));
        out.push(
          laneLabel(sym, r, w, mid, Math.max(6.2, fs * 0.68), col, "hex64", h.name, 600, i % 3, 3),
        );
        if (ST.uiMode === "pro" && w > 32 && i % 2 === 0)
          out.push(
            laneLabel(
              (h.name || "").replace("为", ""),
              r,
              w,
              mid,
              Math.max(5.2, fs * 0.5),
              "#e6d5ed",
              "hex64",
              h.name,
              500,
              (i + 1) % 3,
              3,
            ),
          );
      });
      return;
    }
    if (key === "yq") {
      const qd = qiData(jd),
        names = ["初气", "二气", "三气", "四气", "五气", "终气"];
      for (let i = 0; i < 6; i++) {
        const a = i * 60,
          on = i === qd.step,
          c = on ? "#ff9b90" : col;
        out.push(
          hitSector(
            r,
            r + w,
            a,
            a + 60,
            c,
            on ? 0.28 : 0.075,
            "yq",
            names[i],
            `${names[i]} · 五运六气`,
          ),
        );
        out.push(line(r, r + w, a));
        out.push(
          label(names[i], r + w * 0.52, a + 30, Math.max(8, fs), c, "yq", names[i], on ? 700 : 500),
        );
      }
      return;
    }
    if (key === "lz") {
      const ld = lzData(jd);
      for (let i = 0; i < 12; i++) {
        const a = i * 30,
          on = i === ld.i,
          nm = Array.isArray(window.ZW_LZ) && ZW_LZ[i] ? `${BR[i]}·${ZW_LZ[i][1]}` : `${BR[i]}时`,
          c = on ? "#8ce8f1" : col;
        out.push(hitSector(r, r + w, a, a + 30, c, on ? 0.3 : 0.075, "lz", nm, `${nm} · 子午流注`));
        out.push(line(r, r + w, a));
        out.push(
          label(nm, r + w * 0.52, a + 15, Math.max(6.8, fs * 0.78), c, "lz", nm, on ? 700 : 500),
        );
      }
      return;
    }
  }
  function outerBands() {
    const order = [
        "month",
        "term",
        "zodiac",
        "xiu",
        "wuxing",
        "stem",
        "branch",
        "bagua",
        "hex64",
        "yq",
        "lz",
      ],
      weights = {
        month: 1,
        term: 1,
        zodiac: 1,
        xiu: 0.9,
        wuxing: 1,
        stem: 1,
        branch: 1,
        bagua: 1.08,
        hex64: 1.3,
        yq: 1,
        lz: 1,
      },
      active = order.filter((k) => ST.layers[k]);
    if (!active.length) return [];
    const inner = 334,
      outer = 482,
      gap = 1.4,
      totalW = active.reduce((a, k) => a + (weights[k] || 1), 0),
      unit = (outer - inner - gap * (active.length - 1)) / totalW;
    let r = inner;
    return active.map((k) => {
      const w = Math.max(13, unit * (weights[k] || 1)),
        o = { k, r, w };
      r += w + gap;
      return o;
    });
  }
  function selectedPlanet() {
    return ST.selected.kind === "planet" ? ST.selected.name : "地球";
  }
  function render() {
    const svg = q("#tj152Svg"),
      err = q("#tj152Error");
    if (!svg) return;
    try {
      if (typeof asHelio !== "function") throw new Error("太阳系星历函数尚未载入");
      if (err) err.classList.remove("on");
      const jd = activeJD(),
        out = [];
      out.push(
        `<defs><filter id="tj152Glow"><feGaussianBlur stdDeviation="3.2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter><radialGradient id="tj152Sun" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#fff6b0"/><stop offset=".52" stop-color="#ffd75a"/><stop offset="1" stop-color="#c97812"/></radialGradient></defs>`,
      );
      out.push(
        `<circle cx="${C}" cy="${C}" r="488" fill="none" stroke="rgba(221,192,126,.35)" stroke-width="1.2"/>`,
      );
      for (let i = 0; i < 72; i++)
        out.push(line(479, i % 3 === 0 ? 467 : 473, i * 5, "tj152-gridline"));
      if (ST.layers.planet) {
        PLANETS.forEach((n, i) =>
          out.push(`<circle cx="${C}" cy="${C}" r="${ORBIT[i]}" class="tj152-orbit"/>`),
        );
      }
      const bands = outerBands();
      bands.forEach((b) => renderRing(out, b.k, b.r, b.w, jd));
      if (ST.layers.month && ST.layers.term) {
        const bm = bands.find((b) => b.k === "month"),
          bt = bands.find((b) => b.k === "term");
        if (bm && bt)
          termData(jd).forEach((t) =>
            out.push(
              line(
                Math.min(bm.r, bt.r),
                Math.max(bm.r + bm.w, bt.r + bt.w),
                t.earth,
                "tj153-term-guide",
              ),
            ),
          );
      }
      const maxR = bands.length ? bands[bands.length - 1].r + bands[bands.length - 1].w : 330;
      const earth = helio("地球", jd);
      if (earth) {
        const A = P(40, earth.lon),
          B = P(Math.min(484, maxR + 8), earth.lon);
        out.push(
          `<line x1="${A[0]}" y1="${A[1]}" x2="${B[0]}" y2="${B[1]}" class="tj152-current-ray"/>`,
        );
      }
      const bj = birthJD();
      if (ST.mode === "compare" && Number.isFinite(bj)) {
        const be = helio("地球", bj);
        if (be) {
          const A = P(40, be.lon),
            B = P(Math.min(484, maxR + 8), be.lon);
          out.push(
            `<line x1="${A[0]}" y1="${A[1]}" x2="${B[0]}" y2="${B[1]}" class="tj152-birth-ray"/>`,
          );
        }
      }
      if (ST.layers.planet) {
        const labelLayout = planetLabelLayout(jd);
        PLANETS.forEach((n, i) => {
          const h = helio(n, jd);
          if (!h) return;
          const col = COLOR[n],
            manual = ST.mode === "inverse" && Number.isFinite(ST.inverseTargets[n]),
            showLon = manual ? ST.inverseTargets[n] : h.lon,
            p = P(ORBIT[i], showLon),
            actualP = P(ORBIT[i], h.lon),
            sel = ST.selected.kind === "planet" && ST.selected.name === n,
            dragCls = ST.mode === "inverse" ? " tj155-draggable" : "",
            li = labelLayout[n] || {
              x: P(ORBIT[i] + 18, showLon)[0],
              y: P(ORBIT[i] + 18, showLon)[1],
              anchor: "middle",
            };
          if (manual) {
            out.push(
              `<line x1="${actualP[0]}" y1="${actualP[1]}" x2="${p[0]}" y2="${p[1]}" stroke="${col}" class="tj155-link"/><circle cx="${actualP[0]}" cy="${actualP[1]}" r="${n === "木星" || n === "土星" ? 6.2 : 5.3}" stroke="${col}" class="tj155-actual"/>`,
            );
          }
          out.push(
            `<circle cx="${p[0]}" cy="${p[1]}" r="17" fill="transparent" class="tj152-hit${dragCls}" data-kind="planet" data-name="${n}"/>`,
          );
          if (sel) out.push(`<circle cx="${p[0]}" cy="${p[1]}" r="10.5" class="tj152-selection"/>`);
          out.push(
            `<circle cx="${p[0]}" cy="${p[1]}" r="${n === "木星" || n === "土星" ? 7.2 : 6.2}" fill="${col}" stroke="#fff" stroke-width=".9" filter="url(#tj152Glow)" class="tj152-hit${dragCls}" data-kind="planet" data-name="${n}"/>`,
          );
          if (li.leader)
            out.push(
              `<line x1="${p[0]}" y1="${p[1]}" x2="${li.x}" y2="${li.y}" class="tj161-leader"/>`,
            );
          out.push(
            `<text x="${li.x}" y="${li.y}" text-anchor="${li.anchor}" dominant-baseline="central" font-size="11.5" font-weight="700" fill="${col}" class="tj152-label tj152-hit${dragCls}" data-kind="planet" data-name="${n}">${GLYPH[n]} ${n}</text>`,
          );
          if (ST.mode === "compare" && Number.isFinite(bj)) {
            const hb = helio(n, bj);
            if (hb) {
              const pb = P(ORBIT[i], hb.lon);
              out.push(
                `<line x1="${pb[0]}" y1="${pb[1]}" x2="${p[0]}" y2="${p[1]}" stroke="#e9ca79" stroke-width=".8" stroke-dasharray="3 3" opacity=".32"/><circle cx="${pb[0]}" cy="${pb[1]}" r="${n === "木星" || n === "土星" ? 6.2 : 5.3}" fill="none" stroke="#f1d58b" stroke-width="1.4" class="tj152-hit" data-kind="planetBirth" data-name="${n}"/>`,
              );
            }
          }
        });
      }
      out.push(
        `<circle cx="${C}" cy="${C}" r="18" fill="url(#tj152Sun)" stroke="#fff0a9" stroke-width="1.3" filter="url(#tj152Glow)" class="tj152-hit" data-kind="planet" data-name="太阳"/><circle cx="${C}" cy="${C}" r="28" fill="transparent" class="tj152-hit" data-kind="planet" data-name="太阳"/><text x="${C}" y="${C + 36}" text-anchor="middle" font-size="12" font-weight="700" fill="#ffd85c" class="tj152-label tj152-hit" data-kind="planet" data-name="太阳">☉ 太阳</text>`,
      );
      svg.innerHTML = out.join("");
      applyView();
      updateDetail();
      updateTimeUI();
      updateLegend();
      updateSnapshot();
    } catch (e) {
      console.error("[tj152 render]", e);
      if (err) {
        err.textContent = "天机式渲染失败：" + (e && e.message ? e.message : String(e));
        err.classList.add("on");
      }
    }
  }
  function angDiff(a, b) {
    let d = Math.abs(norm(a) - norm(b));
    return d > 180 ? 360 - d : d;
  }
  function zodiacAt(lon) {
    const i = Math.floor(norm(lon) / 30) % 12;
    return `${ZG[i]} ${ZN[i]}`;
  }
  function nearestTerm(jd) {
    const y = yearBJ(jd),
      all = [];
    [y - 1, y, y + 1].forEach((yy) => {
      try {
        all.push(...termData(dateJD(yy, 6, 1, 12)));
      } catch (_) {}
    });
    let b = null,
      bd = 1e9;
    all.forEach((t) => {
      const d = Math.abs(t.jd - jd);
      if (d < bd) {
        bd = d;
        b = t;
      }
    });
    return b ? `${b.name} · ${termDateText(b.name, b.jd)}` : "—";
  }
  function monthAt(jd) {
    try {
      if (typeof fromJD === "function") {
        const d = fromJD(jd + 8 / 24);
        return (
          "一月 二月 三月 四月 五月 六月 七月 八月 九月 十月 十一月 十二月".split(" ")[d.m - 1] ||
          "—"
        );
      }
    } catch (_) {}
    const d = jdDate(jd + 8 / 24);
    return (
      "一月 二月 三月 四月 五月 六月 七月 八月 九月 十月 十一月 十二月".split(" ")[
        d.getUTCMonth()
      ] || "—"
    );
  }
  function detailRows(rows) {
    return `<div class="tj152-detail">${rows.map((r) => `<span>${esc(r[0])}</span><b${r[2] ? ` style="color:${r[2]}"` : ""}>${esc(r[1])}</b>`).join("")}</div>`;
  }
  function toast(msg) {
    const el = q("#tj152Toast");
    if (!el) return;
    el.textContent = msg;
    el.classList.add("on");
    clearTimeout(TJ152_TOAST_TIMER);
    TJ152_TOAST_TIMER = setTimeout(() => el.classList.remove("on"), 2400);
  }
  function updateModeHelp() {
    const box = q("#tj152ModeHelp");
    if (!box) return;
    const m = MODE_META[ST.mode] || MODE_META.observe;
    box.innerHTML = `<div><b>${m.title}</b><p>${m.desc}</p></div><span class="tj152-mode-tag">${m.tag}</span>`;
  }
  function syncViewButtons() {
    const root = q("#tj152Panel");
    if (root) root.dataset.uiMode = ST.uiMode || "pro";
    qa("[data-tj160-ui]").forEach((b) =>
      b.classList.toggle("on", b.dataset.tj160Ui === (ST.uiMode || "pro")),
    );
    const inv = q("#tj155Inverse");
    if (inv) inv.dataset.view = ST.inverseView || "pro";
    qa("[data-tj160-inv-view]").forEach((b) =>
      b.classList.toggle("on", b.dataset.tj160InvView === (ST.inverseView || "pro")),
    );
  }
  function setUiMode(mode) {
    ST.uiMode = mode === "simple" ? "simple" : "pro";
    syncViewButtons();
    toast(ST.uiMode === "simple" ? "已切换到【简洁模式】" : "已切换到【专业模式】");
  }
  function setInverseView(mode) {
    ST.inverseView = mode === "simple" ? "simple" : "pro";
    syncViewButtons();
    renderInversePanel();
    syncInverseWizard();
    toast(ST.inverseView === "simple" ? "反演区已切到【简洁向导】" : "反演区已切到【专业】");
  }
  function enhanceTopTools() {
    const top = q("#tj152Panel .tj152-top");
    if (!top || q("#tj160TopTools", top)) return;
    const box = document.createElement("div");
    box.className = "tj160-toptools";
    box.id = "tj160TopTools";
    box.innerHTML = `<div class="tj160-toolgroup"><span>界面</span><div class="tj160-seg"><button type="button" data-tj160-ui="simple">简洁</button><button type="button" data-tj160-ui="pro">专业</button></div></div><div class="tj160-toolgroup"><span>反演区</span><div class="tj160-seg"><button type="button" data-tj160-inv-view="simple">简洁</button><button type="button" data-tj160-inv-view="pro">专业</button></div></div>`;
    top.appendChild(box);
    box.addEventListener("click", (e) => {
      const u = e.target.closest && e.target.closest("[data-tj160-ui]"),
        v = e.target.closest && e.target.closest("[data-tj160-inv-view]");
      if (u) setUiMode(u.dataset.tj160Ui);
      if (v) setInverseView(v.dataset.tj160InvView);
    });
    syncViewButtons();
  }
  function enhanceLayerPanel() {
    const card = q("#tj155ControlSide .tj152-card");
    if (!card) return;
    card.id = "tj160LayerCard";
    const rows = qa(".tj152-layer-row", card);
    const famByIdx = ["astro", "astro", "astro", "yi", "yi", "trad"];
    rows.forEach((row, i) => {
      row.dataset.family = famByIdx[i] || "all";
      const head = q("b", row);
      if (head && !head.classList.contains("tj160-layer-head")) {
        head.classList.add("tj160-layer-head");
        if (!q(".tj160-fold", head)) {
          const fold = document.createElement("span");
          fold.className = "tj160-fold";
          fold.textContent = "▾";
          head.appendChild(fold);
        }
        head.onclick = () => row.classList.toggle("collapsed");
      }
    });
    let tabs = q(".tj160-layer-tabs", card);
    if (!tabs) {
      tabs = document.createElement("div");
      tabs.className = "tj160-layer-tabs";
      tabs.innerHTML =
        '<button type="button" data-layer-tab="all">全部</button><button type="button" data-layer-tab="astro">天文</button><button type="button" data-layer-tab="yi">易学</button><button type="button" data-layer-tab="trad">传统</button>';
      const help = q(".tj152-layer-help", card);
      (help || card.firstElementChild).insertAdjacentElement("afterend", tabs);
      tabs.addEventListener("click", (e) => {
        const b = e.target.closest && e.target.closest("[data-layer-tab]");
        if (!b) return;
        ST.layerTab = b.dataset.layerTab || "all";
        updateLayerPanel();
      });
    }
    updateLayerPanel();
  }
  function updateLayerPanel() {
    const card = q("#tj160LayerCard");
    if (!card) return;
    qa("[data-layer-tab]", card).forEach((b) =>
      b.classList.toggle("on", b.dataset.layerTab === (ST.layerTab || "all")),
    );
    qa(".tj152-layer-row", card).forEach((row) => {
      const fam = row.dataset.family || "all";
      row.hidden = ST.layerTab && ST.layerTab !== "all" && fam !== ST.layerTab;
    });
  }
  function enhanceInversePanel() {
    const box = q("#tj155Inverse");
    if (!box) return;
    let bar = q(".tj160-inv-toolbar", box);
    if (!bar) {
      bar = document.createElement("div");
      bar.className = "tj160-inv-toolbar";
      bar.innerHTML = `<div class="tj160-note">专业模式一次展开全部参数；简洁模式改为四步向导，减少一次看到过多控件。</div><div class="tj160-seg"><button type="button" data-tj160-inv-view="simple">简洁</button><button type="button" data-tj160-inv-view="pro">专业</button></div>`;
      const head = q(".tj155-inverse-head", box);
      if (head) head.insertAdjacentElement("afterend", bar);
      bar.addEventListener("click", (e) => {
        const v = e.target.closest && e.target.closest("[data-tj160-inv-view]");
        if (v) setInverseView(v.dataset.tj160InvView);
      });
    }
    let wiz = q("#tj161Wizard", box);
    if (!wiz) {
      wiz = document.createElement("div");
      wiz.className = "tj161-wizard";
      wiz.id = "tj161Wizard";
      wiz.innerHTML = `<button type="button" data-tj161-step="1"><i>1</i>设定约束</button><button type="button" data-tj161-step="2"><i>2</i>搜索范围</button><button type="button" data-tj161-step="3"><i>3</i>执行反推</button><button type="button" data-tj161-step="4"><i>4</i>候选结果</button><span class="tj161-wiz-spacer"></span><div class="tj161-wiz-nav"><button type="button" data-tj161-prev>上一步</button><button type="button" data-tj161-next>下一步</button></div>`;
      bar.insertAdjacentElement("afterend", wiz);
      wiz.addEventListener("click", (e) => {
        const s = e.target.closest && e.target.closest("[data-tj161-step]");
        if (s) {
          ST.inverseStep = Math.max(1, Math.min(4, +s.dataset.tj161Step || 1));
          syncInverseWizard();
          return;
        }
        if (e.target.closest && e.target.closest("[data-tj161-prev]")) {
          ST.inverseStep = Math.max(1, (ST.inverseStep || 1) - 1);
          syncInverseWizard();
        }
        if (e.target.closest && e.target.closest("[data-tj161-next]")) {
          ST.inverseStep = Math.min(4, (ST.inverseStep || 1) + 1);
          syncInverseWizard();
        }
      });
    }
    const search = q(".tj155-searchbar", box),
      targets = q("#tj155Targets", box),
      extra = q(".tj157-extra", box),
      status = q("#tj155Status", box),
      results = q("#tj155Results", box);
    if (search) {
      search.classList.add("tj160-inv-card");
      search.dataset.cardTitle = "搜索范围与执行";
      search.dataset.step = "2";
    }
    if (targets) {
      targets.classList.add("tj160-inv-card");
      targets.dataset.cardTitle = "行星约束";
      targets.dataset.step = "1";
    }
    if (extra) {
      extra.classList.add("tj160-inv-card");
      extra.dataset.cardTitle = "附加时空约束";
      extra.dataset.step = "1";
    }
    let s1 = q("#tj161Step1Tools", box);
    if (!s1) {
      s1 = document.createElement("div");
      s1.className = "tj161-step1-tools";
      s1.id = "tj161Step1Tools";
      s1.innerHTML =
        '<button type="button" data-tj161-capture>锁定当前全部星位</button><button type="button" data-tj161-clear>清空行星约束</button><span class="tj161-ring-note">也可以直接在盘面拖动行星，拖到目标位置后会自动加入反演约束。</span>';
      if (targets) targets.insertAdjacentElement("beforebegin", s1);
      s1.addEventListener("click", (e) => {
        if (e.target.closest && e.target.closest("[data-tj161-capture]"))
          q("#tj155Capture")?.click();
        if (e.target.closest && e.target.closest("[data-tj161-clear]")) q("#tj155Clear")?.click();
      });
    }
    let run = q("#tj161RunCard", box);
    if (!run) {
      run = document.createElement("section");
      run.className = "tj160-inv-card";
      run.id = "tj161RunCard";
      run.dataset.cardTitle = "执行反推";
      run.dataset.step = "3";
      run.innerHTML =
        '<div class="tj161-run-summary" id="tj161RunSummary"></div><button type="button" id="tj161RunBtn">开始反推时间</button>';
      const before = q("#tj160ResultCard", box);
      if (before) box.insertBefore(run, before);
      else box.appendChild(run);
      q("#tj161RunBtn", run).onclick = () => inverseSolve();
    }
    let res = q("#tj160ResultCard", box);
    if (!res) {
      res = document.createElement("section");
      res.className = "tj160-inv-card tj160-res-card";
      res.id = "tj160ResultCard";
      res.dataset.cardTitle = "候选结果";
      if (status) res.appendChild(status);
      if (results) res.appendChild(results);
      box.appendChild(res);
    }
    res.dataset.step = "4";
    syncViewButtons();
    syncInverseWizard();
  }
  function syncInverseWizard() {
    const box = q("#tj155Inverse");
    if (!box) return;
    const step = Math.max(1, Math.min(4, ST.inverseStep || 1));
    box.dataset.wizardStep = String(step);
    qa("[data-tj161-step]", box).forEach((b) =>
      b.classList.toggle("on", +b.dataset.tj161Step === step),
    );
    const prev = q("[data-tj161-prev]", box),
      next = q("[data-tj161-next]", box);
    if (prev) prev.disabled = step <= 1;
    if (next) next.disabled = step >= 4;
    const sum = q("#tj161RunSummary", box);
    if (sum) {
      const names = invTargetNames(),
        extra = invExtraList(),
        from = q("#tj155From")?.value || ST.inverseFrom,
        to = q("#tj155To")?.value || ST.inverseTo;
      sum.innerHTML = `<div><small>反演约束</small><b>${names.length + extra.length} 项</b></div><div><small>行星</small><b>${names.length ? esc(names.join("、")) : "未设置"}</b></div><div><small>搜索范围</small><b>${esc(from)}–${esc(to)}</b></div>`;
    }
    syncViewButtons();
  }

  function temporalYear(jd) {
    return yearBJ(Number.isFinite(jd) ? jd : activeJD());
  }
  function setTemporalEngine(mode) {
    ST.temporalEngine = mode === "similar" ? "similar" : "condition";
    const box = q("#tj155Inverse");
    if (box) box.dataset.engine = ST.temporalEngine;
    qa("[data-tj162-engine]").forEach((b) =>
      b.classList.toggle("on", b.dataset.tj162Engine === ST.temporalEngine),
    );
    if (ST.temporalEngine === "similar") {
      if (!Number.isFinite(ST.similarRefJD)) ST.similarRefJD = activeJD();
      syncSimilarPanel();
    } else {
      syncInverseWizard();
      renderInversePanel();
    }
    toast(ST.temporalEngine === "similar" ? "已切换到【相似时刻搜索】" : "已切换到【条件搜索】");
  }
  function similarFeatureNames() {
    const f = ST.similarFeatures || {},
      a = [];
    if (f.inner) a.push("内行星");
    if (f.outer) a.push("外行星");
    if (f.moon) a.push("月相");
    if (f.season) a.push("季节位置");
    return a;
  }
  function similarScoreAt(jd, ref) {
    const f = ST.similarFeatures || {},
      parts = [];
    let sum = 0,
      ws = 0,
      max = 0;
    const add = (label, e, w) => {
      if (!Number.isFinite(e)) return;
      sum += e * e * w;
      ws += w;
      max = Math.max(max, e);
      parts.push({ label, e, w });
    };
    const addPlanet = (n, w) => {
      const a = helio(n, jd),
        b = helio(n, ref);
      if (a && b) add(n, circErr(a.lon, b.lon), w);
    };
    if (f.inner) {
      addPlanet("水星", 0.55);
      addPlanet("金星", 0.7);
      addPlanet("地球", 1);
      addPlanet("火星", 1);
    }
    if (f.outer) {
      addPlanet("木星", 1.25);
      addPlanet("土星", 1.25);
      addPlanet("天王星", 1.05);
      addPlanet("海王星", 1.05);
    }
    if (f.moon) {
      const a = moonElongAt(jd),
        b = moonElongAt(ref);
      if (Number.isFinite(a) && Number.isFinite(b)) add("月相", circErr(a, b), 0.8);
    }
    if (f.season) add("太阳季节位", circErr(sunLon(jd), sunLon(ref)), 0.45);
    if (!ws) return { rms: 999, max: 999, parts: [] };
    return { rms: Math.sqrt(sum / ws), max, parts };
  }
  function similarIndex(rms) {
    return Math.max(0, Math.min(100, 100 * Math.exp(-Math.max(0, rms) / 28)));
  }
  function similarWhy(r) {
    if (!r || !r.parts || !r.parts.length) return "—";
    const a = r.parts.slice().sort((x, y) => x.e - y.e),
      best = a
        .slice(0, 2)
        .map((x) => `${x.label} ${x.e.toFixed(1)}°`)
        .join("、"),
      worst = a[a.length - 1];
    return `最接近：${best}；主要差异：${worst.label} ${worst.e.toFixed(1)}°`;
  }
  function similarDeltaText(jd, ref) {
    const dy = (jd - ref) / 365.2422;
    return `${dy >= 0 ? "+" : ""}${dy.toFixed(1)} 年`;
  }
  function setSimilarPreset(kind) {
    const ref = Number.isFinite(ST.similarRefJD) ? ST.similarRefJD : activeJD(),
      y = temporalYear(ref);
    if (kind === "past100") {
      ST.similarFrom = Math.max(1600, y - 100);
      ST.similarTo = Math.max(1600, y - 1);
    } else if (kind === "past500") {
      ST.similarFrom = Math.max(1600, y - 500);
      ST.similarTo = Math.max(1600, y - 1);
    } else if (kind === "future100") {
      ST.similarFrom = Math.min(2400, y + 1);
      ST.similarTo = Math.min(2400, y + 100);
    } else if (kind === "both200") {
      ST.similarFrom = Math.max(1600, y - 100);
      ST.similarTo = Math.min(2400, y + 100);
    }
    syncSimilarPanel();
  }
  function syncSimilarPanel() {
    const box = q("#tj162Similar");
    if (!box) return;
    const ref = Number.isFinite(ST.similarRefJD) ? ST.similarRefJD : activeJD();
    const t = q("#tj162RefText");
    if (t) t.textContent = fmtJD(ref);
    const yf = q("#tj162SimFrom"),
      yt = q("#tj162SimTo"),
      ex = q("#tj162Exclude");
    if (yf && document.activeElement !== yf) yf.value = String(ST.similarFrom);
    if (yt && document.activeElement !== yt) yt.value = String(ST.similarTo);
    if (ex && document.activeElement !== ex) ex.value = String(ST.similarExclude);
    qa("[data-tj162-feature]", box).forEach(
      (c) => (c.checked = !!ST.similarFeatures[c.dataset.tj162Feature]),
    );
    const stat = q("#tj162SimilarStatus");
    if (stat) {
      const names = similarFeatureNames();
      stat.innerHTML = `基准：<b>${esc(fmtJD(ref))}</b> · 特征：<b>${esc(names.join(" + ") || "未选择")}</b>。相似度是本工具内部的归一化指数，不代表统计概率或因果关系。`;
    }
    renderSimilarResults();
  }
  function renderSimilarResults() {
    const box = q("#tj162SimilarResults");
    if (!box) return;
    box.innerHTML = ST.similarResults.length
      ? ST.similarResults
          .map(
            (r, i) =>
              `<div class="tj162-sim-result"><div><h6>${i + 1}. ${esc(fmtJD(r.jd))} <span style="color:rgba(237,229,214,.45);font-weight:400">${esc(similarDeltaText(r.jd, ST.similarRefJD))}</span></h6><div class="meta">综合角差 ${r.rms.toFixed(2)}° · 最大单项差异 ${r.max.toFixed(2)}°</div><div class="why">${esc(similarWhy(r))}</div></div><div class="tj162-score"><b>${r.index.toFixed(1)}</b><small>相似指数 / 100</small><button type="button" data-tj162-apply="${r.jd}">查看此时刻</button></div></div>`,
          )
          .join("")
      : '<div class="tj162-note">尚无相似时刻结果。先选择基准、时间范围与特征，然后开始搜索。</div>';
  }
  function buildSimilarPanel() {
    const box = q("#tj155Inverse");
    if (!box || q("#tj162Similar", box)) return;
    const pane = document.createElement("section");
    pane.className = "tj162-similar";
    pane.id = "tj162Similar";
    pane.innerHTML = `<div class="tj162-grid2"><div class="tj162-card"><h5>① 基准时间 · 时间指纹</h5><div class="tj162-ref"><div><p>把当前观察时刻记录为参照。</p><b id="tj162RefText">—</b></div><div class="tj162-actions"><button type="button" id="tj162UseActive">使用当前观察时刻</button><button type="button" id="tj162UseNow">使用此刻</button></div></div></div><div class="tj162-card"><h5>② 比较哪些特征</h5><div class="tj162-feature-list"><label class="tj162-feature"><input type="checkbox" data-tj162-feature="inner"><span><b>内行星</b><small>水星、金星、地球、火星</small></span></label><label class="tj162-feature"><input type="checkbox" data-tj162-feature="outer"><span><b>外行星</b><small>木星、土星、天王星、海王星</small></span></label><label class="tj162-feature"><input type="checkbox" data-tj162-feature="moon"><span><b>月相</b><small>比较日月黄经差</small></span></label><label class="tj162-feature"><input type="checkbox" data-tj162-feature="season"><span><b>季节位置</b><small>比较太阳黄经；与地球位置相关</small></span></label></div></div></div><div class="tj162-card" style="margin-top:10px"><h5>③ 搜索范围</h5><div class="tj162-presets"><button type="button" data-tj162-preset="past100">过去100年</button><button type="button" data-tj162-preset="past500">过去500年</button><button type="button" data-tj162-preset="future100">未来100年</button><button type="button" data-tj162-preset="both200">前后各100年</button></div><div class="tj162-range"><label>起始年<input id="tj162SimFrom" type="number" min="1600" max="2400"></label><label>结束年<input id="tj162SimTo" type="number" min="1600" max="2400"></label><label>排除基准附近（天）<input id="tj162Exclude" type="number" min="0" max="3650" step="1"></label></div><button type="button" id="tj162SimilarRun">寻找最相似时刻</button><div class="tj162-note" id="tj162SimilarStatus"></div></div><div class="tj162-card" style="margin-top:10px"><h5>④ TOP 相似时刻</h5><div class="tj162-sim-results" id="tj162SimilarResults"></div></div>`;
    box.appendChild(pane);
    pane.addEventListener("change", (e) => {
      const f = e.target.closest && e.target.closest("[data-tj162-feature]");
      if (f) {
        ST.similarFeatures[f.dataset.tj162Feature] = f.checked ? 1 : 0;
        ST.similarResults = [];
        syncSimilarPanel();
      } else if (e.target.id === "tj162SimFrom") {
        ST.similarFrom = parseInt(e.target.value, 10) || ST.similarFrom;
      } else if (e.target.id === "tj162SimTo") {
        ST.similarTo = parseInt(e.target.value, 10) || ST.similarTo;
      } else if (e.target.id === "tj162Exclude") {
        ST.similarExclude = Math.max(0, parseInt(e.target.value, 10) || 0);
      }
    });
    pane.addEventListener("click", (e) => {
      const p = e.target.closest && e.target.closest("[data-tj162-preset]"),
        a = e.target.closest && e.target.closest("[data-tj162-apply]");
      if (p) {
        setSimilarPreset(p.dataset.tj162Preset);
        return;
      }
      if (a) {
        const jd = parseFloat(a.dataset.tj162Apply);
        if (Number.isFinite(jd)) {
          syncJD(jd, true);
          render();
          updateSnapshot();
          toast("已切换到相似候选时刻");
        }
      }
    });
    q("#tj162UseActive", pane).onclick = () => {
      ST.similarRefJD = activeJD();
      ST.similarResults = [];
      const y = temporalYear(ST.similarRefJD);
      ST.similarFrom = Math.max(1600, y - 100);
      ST.similarTo = Math.max(1600, y - 1);
      syncSimilarPanel();
      toast("已把当前观察时刻设为相似搜索基准");
    };
    q("#tj162UseNow", pane).onclick = () => {
      ST.similarRefJD = nowJD();
      ST.similarResults = [];
      const y = temporalYear(ST.similarRefJD);
      ST.similarFrom = Math.max(1600, y - 100);
      ST.similarTo = Math.max(1600, y - 1);
      syncSimilarPanel();
      toast("已把此刻设为相似搜索基准");
    };
    q("#tj162SimilarRun", pane).onclick = () => similarSearch();
    syncSimilarPanel();
  }
  function enhanceTemporalEngine() {
    const box = q("#tj155Inverse");
    if (!box) return;
    const head = q(".tj155-inverse-head", box);
    if (head) {
      const h = q("h4", head),
        p = q("p", head),
        badge = q(".tj155-inverse-badge", head);
      if (h) h.textContent = "天机 · 时空搜索引擎";
      if (p)
        p.textContent =
          "条件搜索：给定状态找时间；相似时刻：给定一个时间指纹，寻找历史或未来最相似的状态。手动拖动行星继续作为条件搜索的高级输入。";
      if (badge) badge.textContent = "Temporal State Search";
    }
    let tabs = q("#tj162EngineTabs", box);
    if (!tabs) {
      tabs = document.createElement("div");
      tabs.className = "tj162-engine-tabs";
      tabs.id = "tj162EngineTabs";
      tabs.innerHTML =
        '<button type="button" data-tj162-engine="condition">条件搜索<small>条件 → 时间</small></button><button type="button" data-tj162-engine="similar">相似时刻<small>时间指纹 → 相似时间</small></button>';
      if (head) head.insertAdjacentElement("afterend", tabs);
      tabs.addEventListener("click", (e) => {
        const b = e.target.closest && e.target.closest("[data-tj162-engine]");
        if (b) setTemporalEngine(b.dataset.tj162Engine);
      });
    }
    buildSimilarPanel();
    box.dataset.engine = ST.temporalEngine || "condition";
    qa("[data-tj162-engine]", box).forEach((b) =>
      b.classList.toggle("on", b.dataset.tj162Engine === (ST.temporalEngine || "condition")),
    );
    const s = q("#tj155Solve");
    if (s && !ST.inverseSearching) s.textContent = "搜索时间";
    const r = q("#tj161RunBtn");
    if (r) r.textContent = "开始条件搜索";
    syncSimilarPanel();
  }
  async function similarSearch() {
    if (ST.similarSearching) return;
    const f = ST.similarFeatures || {};
    if (!f.inner && !f.outer && !f.moon && !f.season) {
      toast("请至少选择一种相似特征");
      return;
    }
    const ref = Number.isFinite(ST.similarRefJD) ? ST.similarRefJD : activeJD();
    ST.similarRefJD = ref;
    let y1 = parseInt(q("#tj162SimFrom")?.value || ST.similarFrom, 10),
      y2 = parseInt(q("#tj162SimTo")?.value || ST.similarTo, 10);
    y1 = Math.max(1600, Math.min(2400, Number.isFinite(y1) ? y1 : 1900));
    y2 = Math.max(1600, Math.min(2400, Number.isFinite(y2) ? y2 : 2100));
    if (y1 > y2) [y1, y2] = [y2, y1];
    if (y2 - y1 > 500) {
      y2 = y1 + 500;
      toast("单次相似搜索范围限制为500年");
    }
    ST.similarFrom = y1;
    ST.similarTo = y2;
    ST.similarExclude = Math.max(
      0,
      parseInt(q("#tj162Exclude")?.value || ST.similarExclude, 10) || 0,
    );
    const start = dateJD(y1, 1, 1, 0),
      end = dateJD(y2, 12, 31, 23),
      coarse = f.inner || f.moon ? 3 : f.outer ? 8 : 5,
      best = [],
      cap = 72,
      run = q("#tj162SimilarRun"),
      stat = q("#tj162SimilarStatus");
    ST.similarSearching = true;
    ST.similarResults = [];
    if (run) {
      run.disabled = true;
      run.textContent = "搜索中…";
    }
    const push = (jd, s) => {
      best.push({ jd, rms: s.rms, max: s.max, parts: s.parts });
      best.sort((a, b) => a.rms - b.rms);
      if (best.length > cap) best.length = cap;
    };
    let i = 0,
      total = Math.max(1, Math.ceil((end - start) / coarse));
    for (let jd = start; jd <= end; jd += coarse) {
      if (Math.abs(jd - ref) > ST.similarExclude) {
        const s = similarScoreAt(jd, ref);
        if (Number.isFinite(s.rms)) push(jd, s);
      }
      if (++i % 800 === 0) {
        if (stat)
          stat.textContent = `正在搜索 ${y1}–${y2}：${Math.min(99, Math.round((i / total) * 100))}%`;
        await new Promise((r) => setTimeout(r, 0));
      }
    }
    const seeds = [];
    for (const b of best) {
      if (!seeds.some((x) => Math.abs(x.jd - b.jd) < coarse * 3)) {
        seeds.push(b);
        if (seeds.length >= 28) break;
      }
    }
    const refined = [];
    for (let si = 0; si < seeds.length; si++) {
      let center = seeds[si].jd,
        span = coarse,
        step = coarse / 4,
        bestLocal = seeds[si];
      for (let stage = 0; stage < 5; stage++) {
        let local = bestLocal;
        for (let jd = center - span; jd <= center + span + 1e-9; jd += step) {
          if (Math.abs(jd - ref) <= ST.similarExclude) continue;
          const s = similarScoreAt(jd, ref);
          if (s.rms < local.rms) local = { jd, rms: s.rms, max: s.max, parts: s.parts };
        }
        bestLocal = local;
        center = local.jd;
        span = step * 2;
        step = Math.max(0.02, step / 5);
      }
      refined.push(bestLocal);
      if (stat) stat.textContent = `正在精修候选 ${si + 1}/${seeds.length}…`;
      await new Promise((r) => setTimeout(r, 0));
    }
    refined.sort((a, b) => a.rms - b.rms);
    const uniq = [];
    for (const r of refined) {
      if (!uniq.some((x) => Math.abs(x.jd - r.jd) < 20)) {
        r.index = similarIndex(r.rms);
        uniq.push(r);
        if (uniq.length >= 12) break;
      }
    }
    ST.similarResults = uniq;
    ST.similarSearching = false;
    if (run) {
      run.disabled = false;
      run.textContent = "寻找最相似时刻";
    }
    renderSimilarResults();
    if (stat) {
      const b = uniq[0];
      stat.innerHTML = b
        ? `搜索完成。最佳候选 <b>${esc(fmtJD(b.jd))}</b>，相似指数 <b>${b.index.toFixed(1)}/100</b>，综合角差 <b>${b.rms.toFixed(2)}°</b>。指数用于本工具内部排序，不代表“历史会重复”或因果关系。`
        : "没有找到有效候选。";
    }
    toast("相似时刻搜索完成");
  }
  function planetLabelLayout(jd) {
    const placed = [],
      layout = {},
      rad = Math.PI / 180,
      candidates = [
        [20, 0],
        [30, 0],
        [22, 18],
        [22, -18],
        [34, 22],
        [34, -22],
        [46, 0],
        [46, 28],
        [46, -28],
        [58, 0],
      ];
    PLANETS.forEach((n, i) => {
      const h = helio(n, jd);
      if (!h) return;
      const manual = ST.mode === "inverse" && Number.isFinite(ST.inverseTargets[n]),
        showLon = manual ? ST.inverseTargets[n] : h.lon,
        theta = (showLon - 90) * rad,
        p = P(ORBIT[i], showLon),
        tw = 44 + (n.length > 2 ? 8 : 0),
        th = 18;
      let best = null,
        bestPenalty = 1e9;
      for (const [ro, to] of candidates) {
        const base = P(ORBIT[i] + ro, showLon),
          side = base[0] > C + 20 ? "start" : base[0] < C - 20 ? "end" : "middle",
          dx = (side === "start" ? 8 : side === "end" ? -8 : 0) + -Math.sin(theta) * to,
          dy = Math.cos(theta) * to,
          x = base[0] + dx,
          y = base[1] + dy,
          box = {
            x1: x - (side === "start" ? 0 : side === "end" ? tw : tw / 2),
            x2: x + (side === "start" ? tw : side === "end" ? 0 : tw / 2),
            y1: y - th / 2,
            y2: y + th / 2,
          },
          over = placed.reduce(
            (s, v) =>
              s +
              (box.x1 < v.x2 + 5 && box.x2 + 5 > v.x1 && box.y1 < v.y2 + 4 && box.y2 + 4 > v.y1
                ? 1
                : 0),
            0,
          ),
          edge =
            Math.max(0, 8 - box.x1) +
            Math.max(0, box.x2 - (2 * C - 8)) +
            Math.max(0, 8 - box.y1) +
            Math.max(0, box.y2 - (2 * C - 8)),
          pen = over * 1000 + edge * 20 + ro + Math.abs(to) * 0.2;
        if (pen < bestPenalty) {
          bestPenalty = pen;
          best = { x, y, anchor: side, box, leader: Math.hypot(x - p[0], y - p[1]) > 30 };
        }
        if (over === 0 && edge === 0) break;
      }
      layout[n] = best || { x: p[0], y: p[1], anchor: "middle", leader: false };
      if (best) placed.push(best.box);
    });
    return layout;
  }
  function ensureValueCard() {
    const side = q("#tj155ControlSide");
    if (!side || q("#tj156ValueCard", side)) return;
    const value = document.createElement("section");
    value.className = "tj152-card tj156-value";
    value.id = "tj156ValueCard";
    value.innerHTML = `<h4><span>天机式的价值</span><small>把“时间”做成可观察、可推演、可反推的对象</small></h4><p>天机式不是单纯的圆盘装饰，它正在变成一个<strong>时空操作台</strong>：把天体、节气、月份、易象与传统时空符号放在同一张动态图上，让时间可以被观察、比较、推演，也可以从目标状态反向搜索。</p><div class="tj156-value-now" id="tj156ValueNow"></div><div class="tj156-quick"><button type="button" data-tj156-quick="observe-astro">观时格局</button><button type="button" data-tj156-quick="compare-birth">出生对照</button><button type="button" data-tj156-quick="simulate-year">一年推演</button><button type="button" data-tj156-quick="inverse-verify">时空搜索验证</button></div><div class="tj156-tags"><span>时间可视化</span><span>天文 × 历法 × 易象</span><span>事件定位</span><span>教学演示</span><span>实验验证</span></div>`;
    const roadmap = document.createElement("section");
    roadmap.className = "tj152-card tj156-roadmap";
    roadmap.id = "tj156Roadmap";
    roadmap.innerHTML = `<h4><span>下一阶段升级</span><small>已提前接入路线图</small></h4><p>后续我建议把天机式继续往“时空操作台”推进，而不是只做一个好看的盘。</p><ul><li><b>时空搜索引擎</b><span class="tj157-implemented">v162 双引擎</span>：条件搜索 + 相似时刻已经并列；手排星位作为高级条件输入继续保留。</li><li><b>事件锚点</b>：为某一时间点打标签，建立“事件 → 时间 → 盘面”的回看链路。</li><li><b>合参报告</b>：把天机式当前时刻同步给八字、紫微、奇门等模块，形成统一的解释输出。</li><li><b>教学模式</b>：点击盘层时弹出“这层在看什么、为什么有用、该怎么解读”。</li></ul>`;
    side.append(value, roadmap);
    side.addEventListener("click", (e) => {
      const btn = e.target.closest && e.target.closest("[data-tj156-quick]");
      if (!btn) return;
      const k = btn.dataset.tj156Quick;
      if (k === "observe-astro") {
        setMode("observe", true);
        setPreset("astro");
        render();
        toast("已切换到【观象 + 天文】");
      } else if (k === "compare-birth") {
        setMode("compare", true);
        const j = birthJD();
        if (Number.isFinite(j)) syncJD(j, true);
        render();
        toast(
          Number.isFinite(j)
            ? "已切换到【出生 × 时空】并定位出生时刻"
            : "已切换到【出生 × 时空】；当前尚未载入命主资料",
        );
      } else if (k === "simulate-year") {
        setMode("simulate", true);
        ST.step = 30;
        const step = q("#tj152Step");
        if (step) step.value = "30";
        syncJD(nowJD(), true);
        render();
        toast("已准备按【30天/步】进行一年推演");
      } else if (k === "inverse-verify") {
        setMode("inverse", true);
        PLANETS.forEach((n) => {
          const a = invActualLon(n, activeJD());
          if (Number.isFinite(a)) ST.inverseTargets[n] = a;
        });
        ST.inverseResults = [];
        renderInversePanel();
        render();
        toast("已锁定当前星位，可直接点【反推时间】验证反演精度");
      }
    });
    updateValueCard();
  }
  function updateValueCard() {
    const box = q("#tj156ValueNow");
    if (!box) return;
    const mp = {
      observe:
        "当前处于【观象】模式：适合看“这个时刻的结构长什么样”，例如节气到了哪里、行星分布如何、易象落在哪些区段。",
      compare:
        "当前处于【出生 × 时空】模式：适合把“本命”和“此刻”放在同一个坐标系里对照，看先天与后天之间的差异。",
      simulate:
        "当前处于【推演】模式：适合拖时间轴、设步长、做连续播放，用来观察结构如何随时间演化。",
      inverse:
        "当前处于【星位反演】模式：适合把你手排出来的星位，当作“目标状态”，再去反推出最接近的历史 / 未来时间点。",
    };
    box.textContent = mp[ST.mode] || mp.observe;
  }
  function updateSnapshot() {
    const box = q("#tj157Snapshot");
    if (!box) return;
    const jd = activeJD(),
      sl = sunLon(jd),
      el = moonElongAt(jd),
      sep = moonSepAt(jd),
      layers = Object.values(ST.layers).filter(Boolean).length;
    box.innerHTML = `<div><small>观察时刻</small><b>${esc(fmtJD(jd))}</b></div><div><small>最近节气</small><b>${esc(nearestTermNameAt(jd))} · ${sl.toFixed(1)}°</b></div><div><small>月相</small><b>${esc(phaseNameAt(jd))}</b></div><div><small>日月角距</small><b>${Number.isFinite(sep) ? sep.toFixed(1) + "°" : "—"}</b></div><div><small>当前盘层</small><b>${layers} 层 · ${esc(ST.mode)}</b></div>`;
  }
  function modeToast(m) {
    const mp = {
      observe: "已切换到【观象】。现在适合点盘查看结构；若要看时间变化，请切到【推演】。",
      compare:
        "已切换到【出生 × 时空】。当前会拿出生时刻与当前/指定时刻做对照；若未建立档案，则只能显示基础盘。",
      simulate: "已切换到【推演】。现在可拖动时间轴、改步长，或点击“播放”连续推演。",
      inverse: "已切换到【时空搜索】。可用条件搜索，也可寻找与当前观察时刻最相似的历史/未来时间。",
    };
    toast(mp[m] || "模式已切换");
  }
  function updateDetail() {
    const box = q("#tj152Detail");
    if (!box) return;
    const jd = activeJD(),
      s = ST.selected;
    let rows = [];
    if (s.kind === "planet" || s.kind === "planetBirth") {
      const name = s.name;
      if (name === "太阳") {
        rows = [
          ["对象", "太阳", COLOR.太阳],
          ["位置", "日心原点"],
          ["观察时刻", fmtJD(jd)],
          ["公历月份", monthAt(jd)],
          ["最近节气", nearestTerm(jd)],
        ];
      } else {
        const h = helio(name, jd),
          bj = birthJD(),
          hb = Number.isFinite(bj) ? helio(name, bj) : null;
        rows = [
          ["对象", `${GLYPH[name] || ""} ${name}`, COLOR[name]],
          ["观察时刻", fmtJD(jd)],
          ["日心黄经", h ? `${h.lon.toFixed(2)}°` : "—"],
          ["距日", h ? `${h.r.toFixed(3)} AU` : "—"],
          ["坐标区段", h ? zodiacAt(h.lon) : "—"],
        ];
        if (ST.mode === "compare") {
          rows.push(["出生黄经", hb ? `${hb.lon.toFixed(2)}°` : "未载入"]);
          rows.push(["角距", h && hb ? `${angDiff(h.lon, hb.lon).toFixed(2)}°` : "—"]);
        }
        if (ST.mode === "inverse") {
          const tv = ST.inverseTargets[name];
          rows.push(["手排目标", Number.isFinite(tv) ? `${tv.toFixed(2)}°` : "未设定"]);
          rows.push(["当前模型", h ? `${h.lon.toFixed(2)}°` : "—"]);
          rows.push([
            "当前偏差",
            Number.isFinite(tv) && h ? `${circErr(tv, h.lon).toFixed(2)}°` : "拖动后纳入反演",
          ]);
        }
      }
    } else if (s.kind === "term") {
      const t = termData(jd).find((x) => x.name === s.name);
      rows = [
        ["图层", "二十四节气"],
        ["对象", s.name, TJ153_RING_COLOR.term],
        ["太阳黄经", t ? `${t.sun.toFixed(0)}°` : "—"],
        ["地球公转方向", t ? `${t.earth.toFixed(2)}°` : "—"],
        ["本年交节", termDateText(s.name, jd)],
      ];
    } else if (s.kind === "month") {
      const m = months(jd).find((x) => x.name === s.name);
      rows = [
        ["图层", "公历月份"],
        ["对象", s.name, TJ153_RING_COLOR.month],
        ["月初地球方向", m ? `${m.start.toFixed(2)}°` : "—"],
        ["月末地球方向", m ? `${m.end.toFixed(2)}°` : "—"],
        ["口径", "按本年每月1日真实地球公转方向映射"],
      ];
    } else if (s.kind === "zodiac")
      rows = [
        ["图层", "黄道十二宫"],
        ["对象", s.name, TJ153_RING_COLOR.zodiac],
        ["口径", "太阳黄经30°等分，再换算为地球公转方向（+180°）"],
      ];
    else if (s.kind === "xiu")
      rows = [
        ["图层", "二十八宿"],
        ["对象", s.name, TJ153_RING_COLOR.xiu],
        ["口径", "传统宿度参照，换算到地球公转方向显示"],
      ];
    else if (s.kind === "wuxing")
      rows = [
        ["图层", "五行"],
        ["对象", s.name, TJ153_WX_COLOR[s.name]],
        ["性质", "传统符号分类层"],
        ["说明", "五等分仅为视觉分类，不代表天文学角度"],
      ];
    else if (s.kind === "stem") {
      const i = TJ153_GAN.indexOf(s.name),
        wx = i >= 0 ? TJ153_WX[TJ153_GAN_WX[i]] : "—";
      rows = [
        ["图层", "十天干"],
        ["对象", s.name, TJ153_WX_COLOR[wx]],
        ["五行", wx],
        ["性质", "传统符号时序层"],
      ];
    } else if (s.kind === "branch") {
      const i = BR.indexOf(s.name),
        wx = i >= 0 ? TJ153_WX[TJ153_ZHI_WX[i]] : "—";
      rows = [
        ["图层", "十二地支"],
        ["对象", s.name, TJ153_WX_COLOR[wx]],
        ["五行", wx],
        ["性质", "传统方位 / 时序参考层"],
      ];
    } else if (s.kind === "bagua") {
      let T = null;
      try {
        if (typeof TRI !== "undefined") T = TRI.find((x) => x && x.n === s.name);
      } catch (_) {}
      const wx = T && Number.isFinite(T.wx) ? TJ153_WX[T.wx] : "—";
      rows = [
        ["图层", "后天八卦"],
        [
          "对象",
          `${T && T.img ? T.img + " " : ""}${s.name}`,
          wx !== "—" ? TJ153_WX_COLOR[wx] : TJ153_RING_COLOR.bagua,
        ],
        ["五行", wx],
        ["性质", "后天方位时令参照"],
      ];
    } else if (s.kind === "hex64") {
      let z = null;
      try {
        if (typeof ZY_DATA !== "undefined") z = ZY_DATA.find((r) => r[1] === s.name);
      } catch (_) {}
      rows = [
        ["图层", "六十四卦"],
        ["对象", s.name, TJ153_RING_COLOR.hex64],
        ["卦象", z && z[0] ? z[0] : "—"],
        ["性质", "先天六十四卦圆图次序"],
      ];
    } else if (s.kind === "yq") {
      const d = qiData(jd);
      rows = [
        ["图层", "五运六气"],
        ["对象", s.name, TJ153_RING_COLOR.yq],
        ["岁运", d.yunName || "—"],
        ["司天", d.siTian || "—"],
        ["在泉", d.zaiQuan || "—"],
      ];
    } else if (s.kind === "lz") {
      const d = lzData(jd),
        r = d.row || [];
      rows = [
        ["图层", "子午流注"],
        ["时辰", r[0] || s.name, TJ153_RING_COLOR.lz],
        ["脏腑", r[1] || "—"],
        ["经脉", r[2] || "—"],
      ];
    } else
      rows = [
        ["观察时刻", fmtJD(jd)],
        ["公历月份", monthAt(jd)],
        ["最近节气", nearestTerm(jd)],
      ];
    box.innerHTML = detailRows(rows);
  }
  function updateLegend() {
    const lg = q("#tj152Legend");
    if (!lg) return;
    if (ST.mode === "compare")
      lg.innerHTML =
        '<span class="tj152-chip"><i class="solid"></i>当前</span><span class="tj152-chip"><i class="hollow"></i>出生</span>';
    else if (ST.mode === "inverse")
      lg.innerHTML =
        '<span class="tj152-chip"><i class="solid"></i>手排目标</span><span class="tj152-chip"><i class="hollow"></i>当前模型位置</span>';
    else lg.innerHTML = '<span class="tj152-chip"><i class="solid"></i>当前观察时刻</span>';
  }
  function updateModeUI() {
    qa("[data-tj152-mode]").forEach((b) =>
      b.classList.toggle("on", b.dataset.tj152Mode === ST.mode),
    );
    const river = q("#tj152River");
    if (river) river.classList.toggle("on", ST.mode === "simulate" || ST.mode === "compare");
    if (ST.mode === "observe") {
      stopPlay();
      syncJD(nowJD(), false);
    }
    updateModeHelp();
    renderInversePanel();
    enhanceTemporalEngine();
    syncViewButtons();
  }
  function updateLayerUI() {
    qa("[data-tj152-layer]").forEach((b) =>
      b.classList.toggle("on", !!ST.layers[b.dataset.tj152Layer]),
    );
  }
  function updateTimeUI() {
    const d = q("#tj152Date");
    if (d) d.textContent = fmtJD(activeJD());
    const r = q("#tj152Range");
    if (r && document.activeElement !== r) r.value = String(activeJD());
    const z = q("#tj152ZoomRead");
    if (z) z.textContent = Math.round((1000 / ST.view.w) * 100) + "%";
    const bm = q("#tj152BirthMark"),
      nm = q("#tj152NowMark");
    if (r) {
      const mn = +r.min,
        mx = +r.max,
        den = mx - mn;
      const pos = (j) => Math.max(0, Math.min(100, ((j - mn) / den) * 100));
      const bj = birthJD();
      if (bm) {
        bm.hidden = !Number.isFinite(bj);
        if (Number.isFinite(bj)) bm.style.left = pos(bj) + "%";
      }
      if (nm) nm.style.left = pos(nowJD()) + "%";
    }
  }
  function applyView() {
    const svg = q("#tj152Svg");
    if (svg) svg.setAttribute("viewBox", `${ST.view.x} ${ST.view.y} ${ST.view.w} ${ST.view.h}`);
    updateTimeUI();
  }
  function fit() {
    ST.view = { x: 0, y: 0, w: 1000, h: 1000, min: 260, max: 1550 };
    applyView();
  }
  function zoom(f, cx, cy) {
    const svg = q("#tj152Svg");
    if (!svg) return;
    const old = ST.view.w,
      nw = Math.max(ST.view.min, Math.min(ST.view.max, old / f)),
      ratio = nw / old;
    let px = 500,
      py = 500;
    if (Number.isFinite(cx) && Number.isFinite(cy)) {
      const rect = svg.getBoundingClientRect();
      if (rect.width && rect.height) {
        px = ST.view.x + ((cx - rect.left) / rect.width) * ST.view.w;
        py = ST.view.y + ((cy - rect.top) / rect.height) * ST.view.h;
      }
    }
    ST.view.x = px - (px - ST.view.x) * ratio;
    ST.view.y = py - (py - ST.view.y) * ratio;
    ST.view.w = nw;
    ST.view.h = nw;
    applyView();
  }
  function stopPlay() {
    ST.playing = false;
    if (ST.timer) {
      clearInterval(ST.timer);
      ST.timer = 0;
    }
    const b = q("#tj152Play");
    if (b) b.textContent = "▶ 播放";
  }
  function togglePlay() {
    if (ST.playing) {
      stopPlay();
      return;
    }
    ST.playing = true;
    const b = q("#tj152Play");
    if (b) b.textContent = "Ⅱ 暂停";
    ST.timer = setInterval(() => {
      ST.jd = activeJD() + ST.step;
      if (window.ORR3D) ORR3D.jd = ST.jd;
      render();
    }, 700);
  }
  function setMode(m, silent) {
    if (!["observe", "compare", "simulate", "inverse"].includes(m)) return;
    ST.mode = m;
    stopPlay();
    if (m === "observe") syncJD(nowJD(), false);
    if (m === "inverse") {
      ST.layers.planet = 1;
      if (!invConstraintCount() && !ST.inverseResults.length) ST.inverseStep = 1;
      if (!ST.temporalEngine) ST.temporalEngine = "condition";
    }
    updateModeUI();
    updateLayerUI();
    render();
    if (!silent) modeToast(m);
  }
  function select(kind, name) {
    ST.selected = { kind, name };
    if ((kind === "planet" || kind === "planetBirth") && window.ORR3D && name !== "太阳")
      ORR3D.selected = name;
    render();
    toast(
      ST.mode === "inverse" && kind === "planet" && name !== "太阳"
        ? `已选中【${name}】；按住它沿轨道拖动即可设置目标位置`
        : `已选中【${name}】`,
    );
  }
  function setPreset(name) {
    const all = {
      planet: 0,
      month: 0,
      term: 0,
      zodiac: 0,
      xiu: 0,
      wuxing: 0,
      stem: 0,
      branch: 0,
      bagua: 0,
      hex64: 0,
      yq: 0,
      lz: 0,
    };
    if (name === "simple") Object.assign(all, { planet: 1, month: 1, term: 1, zodiac: 1 });
    if (name === "astro") Object.assign(all, { planet: 1, month: 1, term: 1, zodiac: 1, xiu: 1 });
    if (name === "yi")
      Object.assign(all, { planet: 1, wuxing: 1, stem: 1, branch: 1, bagua: 1, hex64: 1 });
    if (name === "trad")
      Object.assign(all, {
        planet: 1,
        term: 1,
        xiu: 1,
        wuxing: 1,
        stem: 1,
        branch: 1,
        bagua: 1,
        hex64: 1,
        yq: 1,
        lz: 1,
      });
    if (name === "all") Object.keys(all).forEach((k) => (all[k] = 1));
    ST.layers = all;
    updateLayerUI();
    render();
  }
  function openBig() {
    const p = q("#tj152Panel"),
      top = q(".tj152-top", p),
      modeHelp = q("#tj152ModeHelp", p),
      ws = q(".tj155-workspace"),
      big = q("#tj152Big"),
      topAnchor = q("#tj157TopAnchor"),
      wsAnchor = q("#tj156WorkspaceAnchor"),
      guide = q("#tj156Guide"),
      side = q("#tj155ControlSide");
    if (!p || !top || !modeHelp || !ws || !big || !topAnchor || !wsAnchor) return;
    ST.big = true;
    document.body.classList.add("tj156-big-open");
    big.classList.add("on");
    let ctl = q("#tj157BigControls", big);
    if (!ctl) {
      ctl = document.createElement("div");
      ctl.id = "tj157BigControls";
      ctl.className = "tj157-big-controls";
      const note = document.createElement("div");
      note.className = "tj156-big-note";
      note.textContent =
        "放大态已重构为三段式工作台：上方统一控制、左侧盘层与说明、中间主盘、右侧反演与结果。";
      ctl.appendChild(note);
      big.appendChild(ctl);
    }
    const note = q(".tj156-big-note", ctl);
    ctl.insertBefore(top, note);
    ctl.insertBefore(modeHelp, note);
    if (guide && side) side.insertBefore(guide, side.firstChild);
    big.appendChild(ws);
    setTimeout(() => {
      fit();
      renderInversePanel();
      updateSnapshot();
      toast("已进入放大工作台：布局已按“控制—主盘—反演”重构");
    }, 30);
  }
  function closeBig() {
    const p = q("#tj152Panel"),
      top = q(".tj152-top"),
      modeHelp = q("#tj152ModeHelp"),
      ws = q(".tj155-workspace"),
      big = q("#tj152Big"),
      topAnchor = q("#tj157TopAnchor"),
      wsAnchor = q("#tj156WorkspaceAnchor"),
      guide = q("#tj156Guide"),
      main = q(".tj155-main"),
      stageHome = q("#tj152StageHome");
    if (!p || !top || !modeHelp || !ws || !big || !topAnchor || !wsAnchor) return;
    ST.big = false;
    topAnchor.insertAdjacentElement("beforebegin", top);
    wsAnchor.insertAdjacentElement("beforebegin", modeHelp);
    wsAnchor.insertAdjacentElement("afterend", ws);
    if (guide && main && stageHome) main.insertBefore(guide, stageHome);
    big.classList.remove("on");
    document.body.classList.remove("tj156-big-open");
    setTimeout(() => {
      fit();
      renderInversePanel();
      updateSnapshot();
    }, 30);
  }
  function wireStage() {
    const svg = q("#tj152Svg"),
      stage = q("#tj152Stage");
    if (!svg || svg.dataset.tj152wired) return;
    svg.dataset.tj152wired = "1";
    let drag = null,
      suppress = 0,
      raf = 0;
    svg.addEventListener(
      "wheel",
      (e) => {
        e.preventDefault();
        zoom(e.deltaY < 0 ? 1.14 : 1 / 1.14, e.clientX, e.clientY);
      },
      { passive: false },
    );
    svg.addEventListener("pointerdown", (e) => {
      if (e.button !== 0) return;
      const hit = e.target.closest && e.target.closest(".tj152-hit");
      if (
        ST.mode === "inverse" &&
        hit &&
        hit.dataset.kind === "planet" &&
        hit.dataset.name &&
        hit.dataset.name !== "太阳"
      ) {
        const name = hit.dataset.name,
          h = helio(name, activeJD());
        if (h && !Number.isFinite(ST.inverseTargets[name])) ST.inverseTargets[name] = h.lon;
        drag = { type: "planet", id: e.pointerId, name, x: e.clientX, y: e.clientY, m: false };
        ST.selected = { kind: "planet", name };
        syncInverseInputs(name);
        try {
          svg.setPointerCapture(e.pointerId);
        } catch (_) {}
        stage.classList.add("dragging");
        svg.classList.add("tj155-dragging");
        e.preventDefault();
        return;
      }
      drag = { type: "pan", id: e.pointerId, x: e.clientX, y: e.clientY, m: false };
      try {
        svg.setPointerCapture(e.pointerId);
      } catch (_) {}
      stage.classList.add("dragging");
    });
    svg.addEventListener("pointermove", (e) => {
      if (!drag || e.pointerId !== drag.id) return;
      if (drag.type === "planet") {
        const pt = clientToSvgPos(svg, e.clientX, e.clientY);
        if (!pt) return;
        drag.m = true;
        ST.inverseTargets[drag.name] = pointToLon(pt);
        if (!raf)
          raf = requestAnimationFrame(() => {
            raf = 0;
            render();
            syncInverseInputs(drag && drag.name ? drag.name : "");
          });
        e.preventDefault();
        return;
      }
      const dx = e.clientX - drag.x,
        dy = e.clientY - drag.y;
      if (Math.abs(dx) + Math.abs(dy) > 3) drag.m = true;
      drag.x = e.clientX;
      drag.y = e.clientY;
      const r = svg.getBoundingClientRect();
      if (!r.width || !r.height) return;
      ST.view.x -= (dx * ST.view.w) / r.width;
      ST.view.y -= (dy * ST.view.h) / r.height;
      applyView();
      e.preventDefault();
    });
    const end = (e) => {
      if (!drag || e.pointerId !== drag.id) return;
      const d = drag;
      if (d.m) suppress = Date.now() + 260;
      drag = null;
      stage.classList.remove("dragging");
      svg.classList.remove("tj155-dragging");
      try {
        svg.releasePointerCapture(e.pointerId);
      } catch (_) {}
      if (d.type === "planet") {
        renderInversePanel();
        toast(`已把【${d.name}】设为反演约束：${ST.inverseTargets[d.name].toFixed(1)}°`);
      }
    };
    svg.addEventListener("pointerup", end);
    svg.addEventListener("pointercancel", end);
    svg.addEventListener("click", (e) => {
      if (Date.now() < suppress) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      const h = e.target.closest && e.target.closest(".tj152-hit");
      if (h) select(h.dataset.kind, h.dataset.name);
    });
    svg.addEventListener("dblclick", (e) => {
      e.preventDefault();
      fit();
    });
  }
  function arrangeWorkspace() {
    const p = q("#tj152Panel");
    if (!p || q(".tj155-workspace", p)) return;
    const modeHelp = q("#tj152ModeHelp", p),
      inv = q("#tj155Inverse", p),
      home = q("#tj152StageHome", p),
      stage = q("#tj152StageShell", p),
      river = q("#tj152River", p),
      bottom = q(".tj152-bottom", p);
    if (!home || !stage || !bottom) return;
    const cards = qa(".tj152-card", bottom),
      layer = cards[0],
      detail = cards[1];
    const anchor = document.createElement("div");
    anchor.id = "tj156WorkspaceAnchor";
    if (modeHelp) modeHelp.insertAdjacentElement("afterend", anchor);
    const ws = document.createElement("div");
    ws.className = "tj155-workspace";
    const side = document.createElement("aside");
    side.className = "tj155-control";
    side.id = "tj155ControlSide";
    const main = document.createElement("div");
    main.className = "tj155-main";
    anchor.insertAdjacentElement("afterend", ws);
    ws.append(side, main);
    if (layer) {
      const s = layer.querySelector("h4 small");
      if (s) s.textContent = "点击开关图层";
      side.appendChild(layer);
    }
    if (inv) main.appendChild(inv);
    const guide = document.createElement("section");
    guide.className = "tj156-guide on";
    guide.id = "tj156Guide";
    guide.innerHTML =
      '<h4>怎么用这张天机式</h4><ul><li>先用【观象】看当前时刻的整体结构。</li><li>想看本命与当下关系，用【出生 × 时空】。</li><li>想看变化过程，用【推演】配合时间轴与步长。</li><li>想从目标状态倒找时间，用【星位反演】；v157 已支持行星 + 节气 + 月相 + 日月角距联合约束。</li></ul><div class="tj157-snapshot" id="tj157Snapshot"></div>';
    main.appendChild(guide);
    main.appendChild(home);
    main.appendChild(stage);
    if (river) main.appendChild(river);
    if (detail) main.appendChild(detail);
    bottom.remove();
    ensureValueCard();
    updateSnapshot();
  }
  function build() {
    const p = q("#tj152Panel");
    if (!p || p.dataset.built) return;
    p.dataset.built = "1";
    const mn = dateJD(1800, 1, 1, 0),
      mx = dateJD(2200, 12, 31, 23);
    p.innerHTML = `<div class="tj152-shell"><div class="tj152-top"><div class="tj152-seg"><button class="tj152-btn on" data-tj152-mode="observe" title="观察此刻或指定时刻的盘层结构">观象</button><button class="tj152-btn" data-tj152-mode="compare" title="把出生时刻与当前/指定时刻放在一起对照">出生 × 时空</button><button class="tj152-btn" data-tj152-mode="simulate" title="沿时间轴前后推移，查看盘面变化">推演</button><button class="tj152-btn" data-tj152-mode="inverse" title="按条件、相似状态或手排星位搜索时间">时空搜索</button></div><div class="tj152-timebar"><button class="tj152-btn" id="tj152Now">此刻</button><button class="tj152-btn" id="tj152Birth">出生</button><button class="tj152-btn" id="tj152Play">▶ 播放</button><select id="tj152Step" title="推演步长"><option value="1">1天/步</option><option value="7" selected>7天/步</option><option value="30">30天/步</option><option value="365.2422">1年/步</option></select></div></div><div id="tj157TopAnchor"></div><div class="tj152-mode-help" id="tj152ModeHelp"></div><div class="tj155-inverse" id="tj155Inverse"><div class="tj155-inverse-head"><div><h4>天机 · 时空搜索引擎</h4><p>用两种方式寻找时间：① 条件搜索——给定行星、节气、月相、日月角距等约束；② 相似时刻——以当前观察时刻为“时间指纹”，寻找历史或未来最相似的状态。手动拖星继续作为条件搜索的高级输入方式。</p></div><span class="tj155-inverse-badge">基于当前星历模型</span></div><div class="tj155-searchbar"><label>起始年<input id="tj155From" type="number" min="1600" max="2400" value="1900"></label><label>结束年<input id="tj155To" type="number" min="1600" max="2400" value="2100"></label><button class="tj152-btn" id="tj155Capture" type="button">锁定当前全部星位</button><button class="tj152-btn" id="tj155Clear" type="button">清除手排</button><button class="tj152-btn on" id="tj155Solve" type="button">反推时间</button></div><div class="tj155-targets" id="tj155Targets"></div><div class="tj157-extra"><div class="tj157-extra-head"><div><b>多条件时空反演 <span class="tj157-implemented">v157</span></b><br><small>可与手排星位同时使用，也可单独作为时间搜索条件。</small></div><div><button class="tj152-btn" id="tj157CaptureConditions" type="button">读取当前三项</button><button class="tj152-btn" id="tj157ClearConditions" type="button">清除附加条件</button></div></div><div class="tj157-extra-grid"><div class="tj157-cond"><input type="checkbox" id="tj157TermOn"><label for="tj157TermOn">节气约束</label><select id="tj157Term">${TERM_FALLBACK.map((t) => `<option value="${t[0]}">${t[0]} · ${t[1]}°</option>`).join("")}</select><small>以太阳黄经匹配指定节气节点。</small></div><div class="tj157-cond"><input type="checkbox" id="tj157PhaseOn"><label for="tj157PhaseOn">月相约束</label><select id="tj157Phase">${INV_PHASES.map((p) => `<option value="${p.v}">${p.n} · ${p.v}°</option>`).join("")}</select><small>保留盈亏方向，所以同样90°的上弦与下弦不会混为一谈。</small></div><div class="tj157-cond"><input type="checkbox" id="tj157AngleOn"><label for="tj157AngleOn">日月角距</label><input id="tj157Angle" type="number" min="0" max="180" step="0.1" value="180.0"><div class="tj157-angle-presets"><button type="button" data-tj157-angle="0">合 0°</button><button type="button" data-tj157-angle="60">60°</button><button type="button" data-tj157-angle="90">90°</button><button type="button" data-tj157-angle="120">120°</button><button type="button" data-tj157-angle="180">冲 180°</button></div><small>只看几何分离角，不区分盈亏方向。</small></div></div><div class="tj157-extra-summary" id="tj157ExtraSummary"></div></div><div class="tj155-status" id="tj155Status"></div><div class="tj155-results" id="tj155Results"></div></div><div class="tj152-error" id="tj152Error"></div><div class="tj152-stage-home" id="tj152StageHome"></div><div class="tj152-stage-shell" id="tj152StageShell"><div class="tj152-stage" id="tj152Stage"><svg id="tj152Svg" viewBox="0 0 1000 1000" role="img" aria-label="天机式太阳系时空观象盘"></svg><i class="tj152-corner tl"></i><i class="tj152-corner tr"></i><i class="tj152-corner bl"></i><i class="tj152-corner br"></i><div class="tj152-legend" id="tj152Legend"></div><div class="tj152-floating"><button id="tj152Minus" title="缩小">−</button><span class="read" id="tj152ZoomRead">100%</span><button id="tj152Plus" title="放大">＋</button><button id="tj152Fit" title="自适应">◎</button><button id="tj152BigBtn" title="大图">⛶</button></div></div></div><div class="tj152-river" id="tj152River"><div class="tj152-river-head"><span>时间轴</span><b id="tj152Date"></b></div><div class="tj152-river-track"><span class="tj152-marker" id="tj152BirthMark">出生</span><span class="tj152-marker" id="tj152NowMark">今天</span><input id="tj152Range" type="range" min="${mn}" max="${mx}" step="1"></div><div class="tj152-river-actions"><button class="tj152-btn" id="tj152PrevY">−1年</button><button class="tj152-btn" id="tj152GoBirth">出生</button><button class="tj152-btn" id="tj152GoNow">今天</button><button class="tj152-btn" id="tj152NextY">+1年</button></div></div><div class="tj152-bottom"><div class="tj152-card"><h4><span>盘层</span><small>重新分组排版</small></h4><p class="tj152-layer-help">盘层相当于这张“天机式”的信息图层。你可以按类别开关，逐层看天体、天时、易象与传统时空信息。</p><div class="tj152-layer-groups"><div class="tj152-layer-row"><b>天体 <small>${LAYER_GROUP_HELP.天体}</small></b><div class="tj152-layer-chipset"><button class="on" data-tj152-layer="planet" style="--lc:#ffd54f">行星轨道</button></div></div><div class="tj152-layer-row"><b>天时 <small>${LAYER_GROUP_HELP.天时}</small></b><div class="tj152-layer-chipset"><button class="on" data-tj152-layer="month" style="--lc:#63c7ff">月份</button><button class="on" data-tj152-layer="term" style="--lc:#f5c85f">节气</button></div></div><div class="tj152-layer-row"><b>天象 <small>${LAYER_GROUP_HELP.天象}</small></b><div class="tj152-layer-chipset"><button class="on" data-tj152-layer="zodiac" style="--lc:#c39aff">十二宫</button><button data-tj152-layer="xiu" style="--lc:#86aef1">二十八宿</button></div></div><div class="tj152-layer-row"><b>五行 <small>${LAYER_GROUP_HELP.五行}</small></b><div class="tj152-layer-chipset"><button class="on" data-tj152-layer="wuxing" style="--lc:#7ad6a1">五行</button><button class="on" data-tj152-layer="stem" style="--lc:#ffad74">十天干</button><button class="on" data-tj152-layer="branch" style="--lc:#ead17f">十二地支</button></div></div><div class="tj152-layer-row"><b>易象 <small>${LAYER_GROUP_HELP.易象}</small></b><div class="tj152-layer-chipset"><button class="on" data-tj152-layer="bagua" style="--lc:#74d8cc">八卦</button><button data-tj152-layer="hex64" style="--lc:#d89bef">六十四卦</button></div></div><div class="tj152-layer-row"><b>传统 <small>${LAYER_GROUP_HELP.传统}</small></b><div class="tj152-layer-chipset"><button data-tj152-layer="yq" style="--lc:#ef8c82">五运六气</button><button data-tj152-layer="lz" style="--lc:#78d9e1">子午流注</button></div></div></div><div class="tj152-presets"><button class="tj152-btn" data-tj152-preset="simple">简</button><button class="tj152-btn" data-tj152-preset="astro">天文</button><button class="tj152-btn" data-tj152-preset="yi">易学</button><button class="tj152-btn" data-tj152-preset="trad">传统</button><button class="tj152-btn" data-tj152-preset="all">全部</button></div><div class="tj152-hintline"><span><i>观象</i> 看结构</span><span><i>出生 × 时空</i> 做对照</span><span><i>推演</i> 看变化</span><span><i>时空搜索</i> 条件 / 相似 / 手排</span></div></div><div class="tj152-card"><h4><span>详情</span><small>点盘查看说明</small></h4><div id="tj152Detail"></div></div></div></div><div class="tj152-toast" id="tj152Toast"></div>`;
    arrangeWorkspace();
    ensureValueCard();
    enhanceTopTools();
    enhanceLayerPanel();
    enhanceInversePanel();
    enhanceTemporalEngine();
    syncViewButtons();
    qa("[data-tj152-mode]", p).forEach((b) => (b.onclick = () => setMode(b.dataset.tj152Mode)));
    qa("[data-tj152-layer]", p).forEach(
      (b) =>
        (b.onclick = () => {
          const k = b.dataset.tj152Layer;
          ST.layers[k] = ST.layers[k] ? 0 : 1;
          updateLayerUI();
          render();
          toast(`盘层【${b.textContent.trim()}】已${ST.layers[k] ? "开启" : "关闭"}`);
        }),
    );
    qa("[data-tj152-preset]", p).forEach(
      (b) =>
        (b.onclick = () => {
          setPreset(b.dataset.tj152Preset);
          toast(`已切换到【${b.textContent.trim()}】预设`);
        }),
    );
    const inv = q("#tj155Inverse", p);
    if (inv && !inv.dataset.wired) {
      inv.dataset.wired = "1";
      inv.addEventListener("change", (e) => {
        const ck = e.target.closest && e.target.closest("[data-inv-check]"),
          inp = e.target.closest && e.target.closest("[data-inv-angle]");
        if (ck) {
          const n = ck.dataset.invCheck;
          if (ck.checked) {
            const a = invActualLon(n, activeJD());
            if (Number.isFinite(a)) ST.inverseTargets[n] = a;
          } else delete ST.inverseTargets[n];
          ST.inverseResults = [];
          renderInversePanel();
          render();
        } else if (inp) {
          const n = inp.dataset.invAngle,
            v = parseFloat(inp.value);
          if (Number.isFinite(v)) {
            ST.inverseTargets[n] = norm(v);
            ST.inverseResults = [];
            renderInversePanel();
            render();
          }
        } else if (e.target.id === "tj157TermOn") {
          ST.inverseExtra.termOn = e.target.checked;
          ST.inverseResults = [];
          renderInversePanel();
        } else if (e.target.id === "tj157Term") {
          ST.inverseExtra.term = e.target.value;
          ST.inverseExtra.termOn = true;
          ST.inverseResults = [];
          renderInversePanel();
        } else if (e.target.id === "tj157PhaseOn") {
          ST.inverseExtra.phaseOn = e.target.checked;
          ST.inverseResults = [];
          renderInversePanel();
        } else if (e.target.id === "tj157Phase") {
          ST.inverseExtra.phase = +e.target.value;
          ST.inverseExtra.phaseOn = true;
          ST.inverseResults = [];
          renderInversePanel();
        } else if (e.target.id === "tj157AngleOn") {
          ST.inverseExtra.angleOn = e.target.checked;
          ST.inverseResults = [];
          renderInversePanel();
        } else if (e.target.id === "tj157Angle") {
          ST.inverseExtra.angle = Math.max(0, Math.min(180, parseFloat(e.target.value) || 0));
          ST.inverseExtra.angleOn = true;
          ST.inverseResults = [];
          renderInversePanel();
        }
      });
      inv.addEventListener("click", (e) => {
        const clr = e.target.closest && e.target.closest("[data-inv-clear]"),
          app = e.target.closest && e.target.closest("[data-inv-apply]"),
          ap = e.target.closest && e.target.closest("[data-tj157-angle]");
        if (clr) {
          const n = clr.dataset.invClear;
          delete ST.inverseTargets[n];
          ST.inverseResults = [];
          renderInversePanel();
          render();
          toast(`已清除【${n}】约束`);
        }
        if (app) {
          const jd = parseFloat(app.dataset.invApply);
          if (Number.isFinite(jd)) {
            syncJD(jd, true);
            render();
            renderInversePanel();
            updateSnapshot();
            toast("已应用反演候选时刻");
          }
        }
        if (ap) {
          ST.inverseExtra.angle = +ap.dataset.tj157Angle;
          ST.inverseExtra.angleOn = true;
          ST.inverseResults = [];
          renderInversePanel();
        }
      });
    }
    q("#tj155Capture", p).onclick = () => {
      PLANETS.forEach((n) => {
        const a = invActualLon(n, activeJD());
        if (Number.isFinite(a)) ST.inverseTargets[n] = a;
      });
      ST.inverseResults = [];
      renderInversePanel();
      render();
      toast("已锁定当前8颗行星位置，可先用它验证反演精度");
    };
    q("#tj155Clear", p).onclick = () => {
      ST.inverseTargets = {};
      ST.inverseResults = [];
      renderInversePanel();
      render();
      toast("已清除全部手排星位");
    };
    q("#tj155Solve", p).onclick = () => inverseSolve();
    q("#tj157CaptureConditions", p).onclick = () => {
      const jd = activeJD(),
        el = moonElongAt(jd),
        sep = moonSepAt(jd);
      ST.inverseExtra.term = nearestTermNameAt(jd);
      ST.inverseExtra.termOn = true;
      if (Number.isFinite(el)) {
        ST.inverseExtra.phase = (Math.round(el / 45) % 8) * 45;
        ST.inverseExtra.phaseOn = true;
      }
      if (Number.isFinite(sep)) {
        ST.inverseExtra.angle = Math.round(sep * 10) / 10;
        ST.inverseExtra.angleOn = true;
      }
      ST.inverseResults = [];
      renderInversePanel();
      toast("已读取当前节气节点、月相与日月角距");
    };
    q("#tj157ClearConditions", p).onclick = () => {
      ST.inverseExtra = {
        termOn: false,
        term: "冬至",
        phaseOn: false,
        phase: 180,
        angleOn: false,
        angle: 180,
      };
      ST.inverseResults = [];
      renderInversePanel();
      toast("已清除附加时空约束");
    };
    q("#tj152Now", p).onclick = () => {
      ST.mode = ST.mode === "observe" ? "observe" : ST.mode;
      syncJD(nowJD(), true);
      render();
      toast("已定位到【此刻】");
    };
    q("#tj152Birth", p).onclick = () => {
      const j = birthJD();
      if (Number.isFinite(j)) {
        if (ST.mode === "observe") setMode("simulate", true);
        syncJD(j, true);
        updateModeUI();
        render();
        toast("已定位到【出生时刻】");
      } else {
        ST.selected = { kind: "planet", name: "地球" };
        const d = q("#tj152Detail");
        if (d)
          d.innerHTML = detailRows([
            ["出生时刻", "未载入命主"],
            ["提示", "请先建立档案或载入出生资料"],
          ]);
        toast("当前还没有载入命主出生资料");
      }
    };
    q("#tj152Play", p).onclick = () => {
      if (ST.mode !== "simulate") setMode("simulate", true);
      togglePlay();
      toast(ST.playing ? "开始连续推演" : "已暂停连续推演");
    };
    q("#tj152Step", p).onchange = (e) => {
      ST.step = parseFloat(e.target.value) || 7;
    };
    q("#tj152Minus", p).onclick = () => zoom(1 / 1.18);
    q("#tj152Plus", p).onclick = () => zoom(1.18);
    q("#tj152Fit", p).onclick = fit;
    q("#tj152BigBtn", p).onclick = openBig;
    const range = q("#tj152Range", p);
    range.value = String(activeJD());
    let throttle = 0;
    range.addEventListener("input", () => {
      ST.jd = +range.value;
      clearTimeout(throttle);
      throttle = setTimeout(render, 18);
    });
    range.addEventListener("change", () => {
      syncJD(+range.value, true);
      render();
    });
    q("#tj152PrevY", p).onclick = () => {
      syncJD(activeJD() - 365.2422, true);
      render();
    };
    q("#tj152NextY", p).onclick = () => {
      syncJD(activeJD() + 365.2422, true);
      render();
    };
    q("#tj152GoNow", p).onclick = () => {
      syncJD(nowJD(), true);
      render();
    };
    q("#tj152GoBirth", p).onclick = () => {
      const j = birthJD();
      if (Number.isFinite(j)) {
        syncJD(j, true);
        render();
      }
    };
    wireStage();
    updateModeUI();
    updateLayerUI();
    render();
    updateValueCard();
    renderInverseExtras();
    updateSnapshot();
    syncViewButtons();
    let big = q("#tj152Big");
    if (!big) {
      big = document.createElement("div");
      big.id = "tj152Big";
      big.innerHTML = '<button class="tj152-big-close" id="tj152BigClose">关闭</button>';
      document.body.appendChild(big);
      q("#tj152BigClose").onclick = closeBig;
      big.addEventListener("click", (e) => {
        if (e.target === big) closeBig();
      });
      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && ST.big) closeBig();
      });
    }
  }
  function hide() {
    const root = q("#as-orr3d"),
      p = q("#tj152Panel", root),
      btn = q("#tj152Btn", root);
    if (p) p.classList.remove("on");
    if (btn) btn.classList.remove("on");
    stopPlay();
    if (ST.big) closeBig();
    if (root) {
      const ctl = q(".orr3d-ctl", root);
      if (ctl) ctl.style.display = "";
      const hint = q("#orrModeHint", root);
      if (hint) hint.style.display = "";
    }
  }
  function show() {
    const root = q("#as-orr3d"),
      p = q("#tj152Panel", root),
      btn = q("#tj152Btn", root);
    if (!root || !p) return;
    arrangeWorkspace();
    ensureValueCard();
    enhanceTopTools();
    enhanceLayerPanel();
    enhanceInversePanel();
    enhanceTemporalEngine();
    syncViewButtons();
    qa(".orr-mode-panel", root).forEach((x) => (x.hidden = true));
    p.classList.add("on");
    qa(".orr-modebar button", root).forEach((b) => b.classList.remove("on"));
    if (btn) btn.classList.add("on");
    const ctl = q(".orr3d-ctl", root);
    if (ctl) ctl.style.display = "none";
    const hint = q("#orrModeHint", root);
    if (hint) hint.style.display = "none";
    if (ST.mode === "observe") syncJD(nowJD(), false);
    render();
    updateValueCard();
    updateSnapshot();
    setTimeout(fit, 20);
  }
  function ensure() {
    const root = q("#as-orr3d");
    if (!root) return false;
    const bar = q(".orr-modebar", root);
    if (!bar) return false;
    qa("button", bar)
      .filter((b) => (b.textContent || "").trim() === "天机式" && b.id !== "tj152Btn")
      .forEach((b) => b.remove());
    let btn = q("#tj152Btn", bar);
    if (!btn) {
      btn = document.createElement("button");
      btn.type = "button";
      btn.id = "tj152Btn";
      btn.textContent = "天机式";
      const ecl = q('[data-orr-mode="eclipse"]', bar);
      if (ecl) ecl.insertAdjacentElement("afterend", btn);
      else bar.appendChild(btn);
      btn.onclick = show;
    }
    let p = q("#tj152Panel", root);
    if (!p) {
      p = document.createElement("section");
      p.id = "tj152Panel";
      const panels = qa(".orr-mode-panel", root),
        last = panels[panels.length - 1];
      if (last) last.insertAdjacentElement("afterend", p);
      else root.appendChild(p);
      build();
    }
    if (!bar.dataset.tj152wired) {
      bar.dataset.tj152wired = "1";
      bar.addEventListener("click", (e) => {
        const b = e.target.closest && e.target.closest("[data-orr-mode]");
        if (b) hide();
      });
    }
    ensureValueCard();
    const bv = q("#buildVersion");

    return true;
  }
  function boot() {
    try {
      ensure();
    } catch (e) {
      console.error("[tj152 boot]", e);
    }
  }
  TianjiPaneScheduler.register("astro", "astronomy-workspace", boot);
  window.addEventListener("tianjipan:peoplechange", () => {
    if (q("#tj152Panel.on")) render();
  });
  window.tj152 = { show, hide, render, fit, setMode };
})();
