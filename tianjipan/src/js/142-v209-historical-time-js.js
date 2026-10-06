(() => {
  "use strict";
  const BUILD = "v209 · 2026-10-06 14:02 +08:00";
  const SCHEMA = "tianji.time.historical.v1";
  const STORE = "tianjipan.time.historical.v209";
  const DAY = 86400000;
  const COMMON_ZONES = [
    "Asia/Shanghai",
    "Asia/Hong_Kong",
    "Asia/Macau",
    "Asia/Taipei",
    "Asia/Tokyo",
    "Asia/Seoul",
    "Asia/Singapore",
    "Asia/Bangkok",
    "Asia/Kolkata",
    "Asia/Dubai",
    "Europe/London",
    "Europe/Paris",
    "Europe/Berlin",
    "Europe/Moscow",
    "America/New_York",
    "America/Chicago",
    "America/Denver",
    "America/Los_Angeles",
    "America/Toronto",
    "America/Vancouver",
    "Australia/Sydney",
    "Pacific/Auckland",
    "UTC",
  ];
  let ST = { zone: "", choice: "earlier", mode: "audit" };
  try {
    const x = JSON.parse(localStorage.getItem(STORE) || "null");
    if (x && typeof x === "object") ST = { ...ST, ...x };
  } catch (_) {}
  const save = () => {
    try {
      localStorage.setItem(STORE, JSON.stringify(ST));
    } catch (_) {}
  };
  const clone = (x) => (x == null ? x : JSON.parse(JSON.stringify(x)));
  const E = (s) =>
    String(s ?? "").replace(
      /[&<>"']/g,
      (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
    );
  const n2 = (x) => String(x).padStart(2, "0");
  const fmt = (c) =>
    `${c.y}-${n2(c.m)}-${n2(c.d)} ${n2(c.h || 0)}:${n2(c.mi || 0)}:${n2(Math.floor(c.s || 0))}`;
  const normLon = (x) => Math.max(-180, Math.min(180, Number(x) || 0));

  function civilFromShiftedMs(ms, offsetMinutes) {
    const d = new Date(ms + offsetMinutes * 60000);
    return {
      y: d.getUTCFullYear(),
      m: d.getUTCMonth() + 1,
      d: d.getUTCDate(),
      h: d.getUTCHours(),
      mi: d.getUTCMinutes(),
      s: d.getUTCSeconds(),
    };
  }
  function civEq(a, b) {
    return (
      !!a &&
      !!b &&
      a.y === b.y &&
      a.m === b.m &&
      a.d === b.d &&
      (a.h || 0) === (b.h || 0) &&
      (a.mi || 0) === (b.mi || 0) &&
      Math.floor(a.s || 0) === Math.floor(b.s || 0)
    );
  }
  function localNaiveMs(c) {
    return Date.UTC(c.y, c.m - 1, c.d, c.h || 0, c.mi || 0, c.s || 0);
  }
  function validZone(zone) {
    try {
      new Intl.DateTimeFormat("en-US", { timeZone: zone }).format(new Date(0));
      return true;
    } catch (_) {
      return false;
    }
  }
  const fmtCache = new Map();
  function zfmt(zone) {
    if (!fmtCache.has(zone))
      fmtCache.set(
        zone,
        new Intl.DateTimeFormat("en-CA", {
          timeZone: zone,
          calendar: "gregory",
          numberingSystem: "latn",
          hourCycle: "h23",
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
      );
    return fmtCache.get(zone);
  }
  function zoneParts(ms, zone) {
    const o = {};
    zfmt(zone)
      .formatToParts(new Date(ms))
      .forEach((p) => {
        if (p.type !== "literal") o[p.type] = p.value;
      });
    return { y: +o.year, m: +o.month, d: +o.day, h: +o.hour, mi: +o.minute, s: +o.second };
  }
  function offsetAt(ms, zone) {
    const p = zoneParts(ms, zone);
    return (Date.UTC(p.y, p.m - 1, p.d, p.h, p.mi, p.s) - Math.floor(ms / 1000) * 1000) / 60000;
  }
  function possibleInstants(civ, zone) {
    if (!validZone(zone)) return [];
    const naive = localNaiveMs(civ),
      offs = new Set();
    [-370, -180, -30, -1, 0, 1, 30, 180, 370].forEach((d) => {
      try {
        offs.add(offsetAt(naive + d * DAY, zone));
      } catch (_) {}
    });
    const out = [];
    for (const off of offs) {
      const ms = naive - off * 60000;
      try {
        if (civEq(zoneParts(ms, zone), civ)) out.push({ ms, offsetMinutes: +off.toFixed(4) });
      } catch (_) {}
    }
    return out
      .sort((a, b) => a.ms - b.ms)
      .filter((x, i, a) => i === 0 || Math.abs(x.ms - a[i - 1].ms) > 500);
  }
  function yearOffsets(zone, year) {
    const arr = [];
    for (let m = 0; m < 12; m++) {
      const ms = Date.UTC(year, m, 15, 12, 0, 0);
      try {
        arr.push(offsetAt(ms, zone));
      } catch (_) {}
    }
    return [...new Set(arr.map((x) => +x.toFixed(4)))].sort((a, b) => a - b);
  }
  function inferDST(zone, year, offset) {
    const offsets = yearOffsets(zone, year);
    if (!offsets.length)
      return { known: false, dstMinutes: null, standardOffset: null, yearOffsets: [] };
    const standard = offsets[0],
      delta = offset - standard;
    const plausible = delta >= 0 && delta <= 180;
    return {
      known: plausible,
      dstMinutes: plausible ? +delta.toFixed(2) : null,
      standardOffset: standard,
      yearOffsets: offsets,
      method: "same-year-minimum-offset-heuristic",
    };
  }
  function inferZone(lon, lat) {
    lon = +lon;
    lat = +lat;
    if (!Number.isFinite(lon) || !Number.isFinite(lat))
      return { zone: null, confidence: "none", note: "缺少经纬度" };
    if (lon >= 113.75 && lon <= 114.55 && lat >= 22.05 && lat <= 22.65)
      return { zone: "Asia/Hong_Kong", confidence: "high", note: "经纬度落香港范围" };
    if (lon >= 113.48 && lon <= 113.68 && lat >= 22.08 && lat <= 22.25)
      return { zone: "Asia/Macau", confidence: "high", note: "经纬度落澳门范围" };
    if (lon >= 119.2 && lon <= 122.2 && lat >= 21.7 && lat <= 25.6)
      return { zone: "Asia/Taipei", confidence: "medium", note: "经纬度落台湾岛主要范围" };
    if (lon >= 73 && lon <= 135.2 && lat >= 18 && lat <= 54)
      return {
        zone: "Asia/Shanghai",
        confidence: "medium",
        note: "经纬度落中国大陆主要范围；按法定北京时间时区处理，新疆民间时间不自动采用",
      };
    return {
      zone: null,
      confidence: "manual",
      note: "当前单文件未内置全球经纬度→IANA 多边形数据库，请手动确认时区",
    };
  }
  function currentInput() {
    let civ = null;
    try {
      civ = parseDt();
    } catch (_) {}
    if (!civ) {
      const v = document.getElementById("dt")?.value || "";
      const m = v.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
      if (m) civ = { y: +m[1], m: +m[2], d: +m[3], h: +m[4], mi: +m[5], s: 0 };
    }
    const o = (() => {
      try {
        return readOpts();
      } catch (_) {
        return {};
      }
    })();
    return {
      civ,
      longitude: Number(o.lon ?? document.getElementById("lon")?.value ?? 120),
      latitude: Number(o.lat ?? document.getElementById("lat")?.value ?? null),
      solar: !!(o.solar ?? document.getElementById("solarChk")?.checked),
    };
  }
  function jdFromUnix(ms) {
    return ms / DAY + 2440587.5;
  }
  function branchIndex(c) {
    return Math.floor(((c.h || 0) + 1) / 2) % 12;
  }
  function dayKey(c) {
    return `${c.y}-${c.m}-${c.d}`;
  }
  function resolve(civ, opt = {}) {
    if (!civ)
      return {
        schema: SCHEMA,
        build: BUILD,
        available: false,
        status: "invalid",
        reason: "没有有效的出生日期时间",
      };
    const lon = normLon(opt.longitude ?? 120),
      lat = Number.isFinite(+opt.latitude) ? +opt.latitude : null;
    const inferred = inferZone(lon, lat),
      zone = (opt.zone || ST.zone || inferred.zone || "").trim();
    if (!zone)
      return {
        schema: SCHEMA,
        build: BUILD,
        available: false,
        status: "needs-zone",
        reason: inferred.note,
        input: { civil: clone(civ), longitude: lon, latitude: lat },
        zoneInference: inferred,
      };
    if (!validZone(zone))
      return {
        schema: SCHEMA,
        build: BUILD,
        available: false,
        status: "invalid-zone",
        reason: "浏览器 Intl 不识别该 IANA 时区：" + zone,
        input: { civil: clone(civ), longitude: lon, latitude: lat },
        zoneInference: inferred,
      };
    const candidates = possibleInstants(civ, zone);
    if (!candidates.length) {
      return {
        schema: SCHEMA,
        build: BUILD,
        available: false,
        status: "nonexistent-local-time",
        reason:
          "该当地钟表时间在此 IANA 时区中不存在，常见于夏令时跳时。请核对出生记录，不自动平移到下一小时。",
        zone,
        input: { civil: clone(civ), longitude: lon, latitude: lat },
        zoneInference: inferred,
      };
    }
    const ambiguous = candidates.length > 1,
      idx = ambiguous && opt.choice === "later" ? candidates.length - 1 : 0,
      chosen = candidates[idx],
      ms = chosen.ms,
      off = chosen.offsetMinutes;
    const dst = inferDST(zone, civ.y, off),
      jdUT = jdFromUnix(ms),
      eq = typeof eot === "function" ? eot(jdUT) : 0;
    const legal = zoneParts(ms, zone);
    const utc = civilFromShiftedMs(ms, 0);
    const meanOffset = lon * 4,
      mean = civilFromShiftedMs(ms, meanOffset);
    const apparent = civilFromShiftedMs(ms, meanOffset + eq);
    const bridge = civilFromShiftedMs(ms, 480);
    const legacyMs = localNaiveMs(civ) - 480 * 60000,
      legacyDelta = (ms - legacyMs) / 60000;
    const currentCalc = opt.solar ? apparent : legal;
    const warnings = [];
    if (ambiguous)
      warnings.push(
        `当地时间重复出现（DST 回拨 / fold），存在 ${candidates.length} 个合法瞬间；当前采用${idx ? "较晚" : "较早"}候选。`,
      );
    if (dst.known && dst.dstMinutes > 0)
      warnings.push(
        `运行时 IANA 数据显示当时偏移为 UTC${off >= 0 ? "+" : ""}${(off / 60).toFixed(2)}，同年较低基准偏移约 UTC${dst.standardOffset >= 0 ? "+" : ""}${(dst.standardOffset / 60).toFixed(2)}；推断含约 ${dst.dstMinutes} 分钟夏令/季节性偏移。`,
      );
    if (Math.abs(legacyDelta) > 0.1)
      warnings.push(
        `现有旧排盘链固定把输入当 UTC+8；与 IANA 解析的真实瞬间相差 ${legacyDelta > 0 ? "+" : ""}${legacyDelta.toFixed(1)} 分钟。V209 默认只审计，不静默改写主盘。`,
      );
    if (dayKey(legal) !== dayKey(apparent)) warnings.push("法定钟表时间与真太阳时跨越了日期边界。");
    if (branchIndex(legal) !== branchIndex(apparent))
      warnings.push("法定钟表时间与真太阳时落在不同传统时辰。");
    const legacyLon = typeof sunLon === "function" ? sunLon(jdFromUnix(legacyMs)) : null,
      correctLon = typeof sunLon === "function" ? sunLon(jdUT) : null;
    if (legacyLon != null && correctLon != null) {
      const mi = (a) => Math.floor(((((a - 315) % 360) + 360) % 360) / 30);
      if (mi(legacyLon) !== mi(correctLon))
        warnings.push("旧固定 UTC+8 瞬间与 IANA 正确瞬间跨越八字节气月边界，属于高优先级复核。");
    }
    let compatContext = null;
    try {
      if (window.TianjiTime?.createContext)
        compatContext = TianjiTime.createContext(bridge, {
          timezone: {
            name: "Asia/Shanghai-bridge",
            offsetMinutes: 480,
            standardMeridian: 120,
            mode: "fixed-offset",
          },
          location: { longitude: lon, latitude: lat, label: zone },
          trueSolarTime: { enabled: !!opt.solar },
        });
    } catch (_) {}
    const evidence = [
      {
        id: "tz.zone",
        claim: `IANA zone = ${zone}`,
        source: "browser Intl.DateTimeFormat runtime tzdb",
        state: "runtime",
        formula: "local civil ↔ IANA historical offset",
      },
      {
        id: "tz.offset",
        claim: `历史 UTC 偏移 = ${off} min`,
        source: "Intl formatToParts round-trip",
        state: "derived",
        formula: "Date.UTC(zoned parts) - instant",
      },
      {
        id: "tz.dst",
        claim: dst.known
          ? `同年基准偏移 ${dst.standardOffset} min；DST/季节性差额 ${dst.dstMinutes} min`
          : "无法稳定推断 DST 差额",
        source: "same-year offset samples",
        state: "heuristic",
        formula: "current offset - min(monthly offsets)",
      },
      {
        id: "solar.mean",
        claim: `地方平太阳时经度偏移 = ${meanOffset.toFixed(2)} min from UTC`,
        source: "longitude",
        state: "deterministic",
        formula: "longitude × 4 min/degree",
      },
      {
        id: "solar.apparent",
        claim: `均时差 = ${(+eq).toFixed(2)} min`,
        source: "existing Tianji eot(jdUT)",
        state: "deterministic",
        formula: "apparent solar = mean solar + EoT",
      },
      {
        id: "engine.bridge",
        claim: `旧引擎 UTC+8 等价钟表 = ${fmt(bridge)}`,
        source: "compatibility bridge",
        state: "bridge",
        formula: "resolved instant + 480 min",
      },
    ];
    return {
      schema: SCHEMA,
      build: BUILD,
      available: true,
      status: ambiguous ? "ambiguous" : "resolved",
      input: { civil: clone(civ), longitude: lon, latitude: lat, solar: !!opt.solar },
      zone,
      zoneInference: inferred,
      offsetMinutes: off,
      dst,
      ambiguous,
      candidates: candidates.map((x) => ({
        utc: new Date(x.ms).toISOString(),
        offsetMinutes: x.offsetMinutes,
      })),
      choice: idx ? "later" : "earlier",
      instant: { epochMs: ms, utcISO: new Date(ms).toISOString(), jdUT },
      clocks: {
        recorded: { ...clone(civ), text: fmt(civ), label: "原始出生记录 / 当地钟表" },
        legal: { ...legal, text: fmt(legal), label: `法定时区 ${zone}` },
        utc: { ...utc, text: fmt(utc), label: "UTC" },
        meanSolar: {
          ...mean,
          text: fmt(mean),
          label: "地方平太阳时",
          shiftFromRecordedMinutes: +((localNaiveMs(mean) - localNaiveMs(civ)) / 60000).toFixed(2),
        },
        apparentSolar: {
          ...apparent,
          text: fmt(apparent),
          label: "地方真太阳时",
          shiftFromRecordedMinutes: +((localNaiveMs(apparent) - localNaiveMs(civ)) / 60000).toFixed(
            2,
          ),
        },
        legacyBridgeUTC8: { ...bridge, text: fmt(bridge), label: "旧引擎 UTC+8 等价瞬间" },
        calculation: {
          ...currentCalc,
          text: fmt(currentCalc),
          mode: opt.solar ? "apparent-solar" : "legal-civil",
        },
      },
      correction: {
        equationOfTimeMinutes: +(+eq).toFixed(4),
        longitudeFromUTCMinutes: +meanOffset.toFixed(4),
        legacyInstantDeltaMinutes: +legacyDelta.toFixed(2),
      },
      compatContext,
      warnings,
      evidence,
      capabilities: {
        ianaRuntime: true,
        ambiguousFoldDetection: true,
        gapDetection: true,
        dstInference: true,
        globalCoordinateToZone: false,
        automaticMainEngineReplacement: false,
      },
    };
  }
  function analyzeCurrent() {
    const x = currentInput(),
      inf = inferZone(x.longitude, x.latitude);
    if (!ST.zone && inf.zone) {
      ST.zone = inf.zone;
      save();
    }
    return resolve(x.civ, {
      zone: ST.zone || inf.zone || "",
      choice: ST.choice,
      longitude: x.longitude,
      latitude: x.latitude,
      solar: x.solar,
    });
  }
  function tzListOptions() {
    let zones = COMMON_ZONES.slice();
    try {
      if (Intl.supportedValuesOf) {
        const all = Intl.supportedValuesOf("timeZone");
        const prefer = all.filter((x) => /^(Asia|America|Europe|Australia|Pacific)\//.test(x));
        zones = [...new Set([...zones, ...prefer])].slice(0, 520);
      }
    } catch (_) {}
    return zones.map((x) => `<option value="${E(x)}"></option>`).join("");
  }
  function chainHTML(A) {
    if (!A.available) return `<div class="tz209-note">${E(A.reason)}</div>`;
    const cards = [
      A.clocks.recorded,
      A.clocks.legal,
      A.clocks.utc,
      A.clocks.meanSolar,
      A.clocks.apparentSolar,
    ];
    return `<div class="tz209-chain">${cards.map((x, i) => `<div class="tz209-time${i === 4 && A.input.solar ? " calc" : ""}"><small>${E(x.label)}</small><b>${E(x.text)}</b><em>${i === 3 || i === 4 ? `相对记录 ${x.shiftFromRecordedMinutes >= 0 ? "+" : ""}${x.shiftFromRecordedMinutes.toFixed(1)} min` : i === 1 ? `UTC${A.offsetMinutes >= 0 ? "+" : ""}${(A.offsetMinutes / 60).toFixed(2)}` : i === 2 ? "绝对瞬间基准" : ""}</em></div>`).join("")}</div>`;
  }
  function warningsHTML(A) {
    if (!A.available)
      return `<div class="tz209-item bad"><b>尚未形成唯一时刻</b><small>${E(A.reason)}</small></div>`;
    if (!A.warnings.length)
      return '<div class="tz209-item good"><b>未发现明显边界冲突</b><small>当前 IANA 时区解析、地方太阳时与旧引擎兼容检查没有产生额外警报。</small></div>';
    return A.warnings
      .map((x) => `<div class="tz209-item bad"><b>时间边界提示</b><small>${E(x)}</small></div>`)
      .join("");
  }
  function resultPanel(A) {
    if (!A.available)
      return `<div class="tz209-card"><h3>解析状态</h3><div class="tz209-note">${E(A.reason)}</div></div>`;
    const dstTxt = A.dst.known
      ? A.dst.dstMinutes > 0
        ? `${A.dst.dstMinutes} min`
        : "0 min"
      : "待确认";
    return `
   <div class="tz209-kpis">
    <div class="tz209-kpi cyan"><small>IANA 时区</small><b>${E(A.zone)}</b></div>
    <div class="tz209-kpi"><small>历史偏移</small><b>UTC${A.offsetMinutes >= 0 ? "+" : ""}${(A.offsetMinutes / 60).toFixed(2)}</b></div>
    <div class="tz209-kpi ${A.dst.dstMinutes > 0 ? "bad" : "good"}"><small>DST / 季节偏移</small><b>${E(dstTxt)}</b></div>
    <div class="tz209-kpi ${Math.abs(A.correction.legacyInstantDeltaMinutes) > 0.1 ? "bad" : "good"}"><small>旧引擎瞬间误差</small><b>${A.correction.legacyInstantDeltaMinutes >= 0 ? "+" : ""}${A.correction.legacyInstantDeltaMinutes.toFixed(0)} min</b></div>
    <div class="tz209-kpi"><small>经度</small><b>${A.input.longitude.toFixed(2)}°</b></div>
    <div class="tz209-kpi ${A.ambiguous ? "bad" : "good"}"><small>当地钟表唯一性</small><b>${A.ambiguous ? "重复时刻" : "唯一"}</b></div>
   </div>
   <div class="tz209-card"><h3>五层时间链</h3>${chainHTML(A)}</div>
   <div class="tz209-grid">
    <section class="tz209-card"><h3>边界与兼容性</h3><div class="tz209-list">${warningsHTML(A)}</div></section>
    <aside class="tz209-card"><h3>当前页面实际采用什么时间？</h3>
      <div class="tz209-item cyan"><b>${A.input.solar ? "当前勾选真太阳时" : "当前未勾选真太阳时"}</b><small>V209 审计层建议的计算读数为：${E(A.clocks.calculation.text)}（${E(A.clocks.calculation.mode)}）。</small></div>
      <div class="tz209-item gold"><b>兼容桥 · ${E(A.clocks.legacyBridgeUTC8.text)}</b><small>这是与真实瞬间等价的 UTC+8 钟表值，可供现有固定 UTC+8 天文链做兼容计算。V209 不会自动把它写进出生输入框，避免静默改变旧盘。</small></div>
      <div class="tz209-note">当前主排盘的 legacy <code>calcTime()</code> 仍固定按 UTC+8。V209 已建立可审计的 IANA 历史时区上下文和兼容桥，但“全站所有术数自动切换到新时间核心”留到下一阶段做逐模块回归后再启用。</div>
    </aside>
   </div>
   <div class="tz209-card"><h3>Evidence</h3><div class="tz209-ev">${A.evidence.map((x) => `<div class="tz209-evrow"><b>${E(x.id)}</b><small>${E(x.claim)}<br><span class="tz209-code">${E(x.formula)}</span><br>${E(x.source)}</small><span>${x.state === "runtime" ? "运行时 tzdb" : x.state === "heuristic" ? "启发式" : x.state === "bridge" ? "兼容桥" : "确定性派生"}</span></div>`).join("")}</div></div>`;
  }
  function formHTML(A) {
    const I = currentInput(),
      zone = ST.zone || A.zone || inferZone(I.longitude, I.latitude).zone || "";
    return `<div class="tz209-card"><h3>历史时间输入与来源</h3>
   <div class="tz209-form">
    <label>出生记录<input id="tz209Civil" type="datetime-local" value="${I.civ ? `${I.civ.y}-${n2(I.civ.m)}-${n2(I.civ.d)}T${n2(I.civ.h)}:${n2(I.civ.mi)}` : ""}"></label>
    <label>IANA 时区<input id="tz209Zone" list="tz209Zones" value="${E(zone)}" placeholder="如 Asia/Shanghai"><datalist id="tz209Zones">${tzListOptions()}</datalist></label>
    <label>经度<input id="tz209Lon" type="number" min="-180" max="180" step="0.01" value="${Number.isFinite(I.longitude) ? I.longitude.toFixed(2) : "120.00"}"></label>
    <label>纬度<input id="tz209Lat" type="number" min="-90" max="90" step="0.01" value="${Number.isFinite(I.latitude) ? I.latitude.toFixed(2) : ""}"></label>
    <label>重复时刻选择<select id="tz209Choice"><option value="earlier"${ST.choice === "earlier" ? " selected" : ""}>较早瞬间</option><option value="later"${ST.choice === "later" ? " selected" : ""}>较晚瞬间</option></select></label>
   </div>
   <div class="tz209-actions"><button class="primary" id="tz209Run">重新解析</button><button id="tz209AutoZone">按当前经纬度建议时区</button><button id="tz209Copy">复制时间审计 Schema</button><button id="tz209CopyBridge">复制旧引擎 UTC+8 等价时刻</button></div>
   <div class="tz209-note" style="margin-top:7px">全球“经纬度→IANA 时区”需要真实时区边界数据库。V209 单文件仅对中国大陆、香港、澳门、台湾做有限自动建议；其它地区必须手动确认 IANA 时区，不按经度粗猜。</div>
  </div>`;
  }
  function modalHTML() {
    const A = analyzeCurrent();
    return `<div class="tz209-shell"><header class="tz209-head"><div><h2>历史时区 · DST · 太阳时校正</h2><p>原始记录 → IANA 法定时区 → UTC 瞬间 → 地方平太阳时 → 真太阳时。先确定“当时钟表到底代表哪个瞬间”，再谈经度和均时差。</p></div><button class="tz209-close" id="tz209Close">关闭 ✕</button></header><div class="tz209-body">${formHTML(A)}<div id="tz209Result">${resultPanel(A)}</div></div></div>`;
  }
  function ensureModal() {
    let m = document.getElementById("tz209Modal");
    if (!m) {
      m = document.createElement("div");
      m.id = "tz209Modal";
      m.className = "tz209-modal";
      m.hidden = true;
      document.body.appendChild(m);
    }
    return m;
  }
  function openModal() {
    const m = ensureModal();
    m.innerHTML = modalHTML();
    m.hidden = false;
    bindModal();
  }
  function closeModal() {
    const m = document.getElementById("tz209Modal");
    if (m) m.hidden = true;
  }
  function civFromInput(v) {
    const m = String(v || "").match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
    return m ? { y: +m[1], m: +m[2], d: +m[3], h: +m[4], mi: +m[5], s: 0 } : null;
  }
  function runModal() {
    const civ = civFromInput(document.getElementById("tz209Civil")?.value);
    const zone = (document.getElementById("tz209Zone")?.value || "").trim();
    const lon = +document.getElementById("tz209Lon")?.value,
      lat = +document.getElementById("tz209Lat")?.value;
    ST.zone = zone;
    ST.choice = document.getElementById("tz209Choice")?.value || "earlier";
    save();
    const A = resolve(civ, {
      zone,
      choice: ST.choice,
      longitude: lon,
      latitude: lat,
      solar: !!document.getElementById("solarChk")?.checked,
    });
    const box = document.getElementById("tz209Result");
    if (box) box.innerHTML = resultPanel(A);
    updateMini(A);
  }
  function bindModal() {
    document.getElementById("tz209Close")?.addEventListener("click", closeModal);
    document.getElementById("tz209Run")?.addEventListener("click", runModal);
    document.getElementById("tz209AutoZone")?.addEventListener("click", () => {
      const lon = +document.getElementById("tz209Lon")?.value,
        lat = +document.getElementById("tz209Lat")?.value,
        z = inferZone(lon, lat);
      if (z.zone) {
        const el = document.getElementById("tz209Zone");
        if (el) el.value = z.zone;
        ST.zone = z.zone;
        save();
        runModal();
      } else {
        try {
          toast(z.note);
        } catch (_) {}
      }
    });
    document.getElementById("tz209Copy")?.addEventListener("click", () => {
      const A = analyzeCurrent();
      navigator.clipboard
        ?.writeText?.(JSON.stringify(A, null, 2))
        .then(() => {
          try {
            toast("已复制历史时间审计 Schema");
          } catch (_) {}
        })
        .catch(() => {});
    });
    document.getElementById("tz209CopyBridge")?.addEventListener("click", () => {
      const A = analyzeCurrent();
      if (!A.available) return;
      navigator.clipboard
        ?.writeText?.(A.clocks.legacyBridgeUTC8.text)
        .then(() => {
          try {
            toast("已复制 UTC+8 等价时刻");
          } catch (_) {}
        })
        .catch(() => {});
    });
  }
  function updateMini(A = analyzeCurrent()) {
    const s = document.getElementById("tz209Mini");
    if (!s) return;
    if (!A.available) {
      s.textContent = "历史时区：待确认";
      s.className = "tz209-mini warn";
      return;
    }
    const dst = A.dst.known && A.dst.dstMinutes > 0 ? ` · DST ${A.dst.dstMinutes}m` : "";
    const delta =
      Math.abs(A.correction.legacyInstantDeltaMinutes) > 0.1
        ? ` · 旧链差 ${A.correction.legacyInstantDeltaMinutes >= 0 ? "+" : ""}${A.correction.legacyInstantDeltaMinutes.toFixed(0)}m`
        : "";
    s.textContent = `${A.zone} · UTC${A.offsetMinutes >= 0 ? "+" : ""}${(A.offsetMinutes / 60).toFixed(2)}${dst}${delta}`;
    s.className =
      "tz209-mini " + (Math.abs(A.correction.legacyInstantDeltaMinutes) > 0.1 ? "warn" : "good");
  }
  function ensurePersonaButton() {
    const row = document.querySelector("#personaFold .pr-subrow");
    if (!row || document.getElementById("tz209Open")) return;
    const b = document.createElement("button");
    b.type = "button";
    b.id = "tz209Open";
    b.className = "tz209-btn";
    b.textContent = "历史时区 / DST 校正";
    b.addEventListener("click", openModal);
    const s = document.createElement("span");
    s.id = "tz209Mini";
    s.className = "tz209-mini";
    row.appendChild(b);
    row.appendChild(s);
    updateMini();
  }
  function verifyPanel() {
    const A = analyzeCurrent();
    return `<section class="tz209-verify"><div class="tz209-card"><h3>历史时区 / DST · V209 一期</h3><div class="tz209-list">
   <div class="tz209-item ${A.available ? "good" : "bad"}"><b>${A.available ? `${E(A.zone)} · UTC${A.offsetMinutes >= 0 ? "+" : ""}${(A.offsetMinutes / 60).toFixed(2)}` : "时区尚未唯一解析"}</b><small>${A.available ? `原始记录 ${E(A.clocks.recorded.text)} → UTC ${E(A.clocks.utc.text)} → 真太阳时 ${E(A.clocks.apparentSolar.text)}。` : `${E(A.reason)}。`}</small></div>
   <div class="tz209-item cyan"><b>全球接管状态 · Phase 1</b><small>历史时区上下文、DST/fold/gap 检测和旧引擎 UTC+8 兼容桥已建立；尚未自动替换全站 legacy calcTime，避免在八字/奇门/紫微未回归前静默改变结果。</small></div>
  </div><div class="tz209-actions"><button type="button" id="tz209VerifyOpen">打开时间校正台</button></div></div></section>`;
  }
  function patchVerify() {
    try {
      if (
        typeof REF_PANES === "undefined" ||
        typeof REF_PANES.verify !== "function" ||
        REF_PANES.verify.__v209
      )
        return;
      const old = REF_PANES.verify,
        oldBind = REF_BIND.verify;
      const fn = () => verifyPanel() + old();
      fn.__v209 = true;
      REF_PANES.verify = fn;
      REF_BIND.verify = () => {
        try {
          oldBind && oldBind();
        } catch (_) {}
        document.getElementById("tz209VerifyOpen")?.addEventListener("click", openModal);
      };
    } catch (err) {
      console.warn("[V209 verify patch]", err);
    }
  }
  function legacyBridge(civ, opt = {}) {
    const A = resolve(civ, opt);
    return A.available
      ? { civil: clone(A.clocks.legacyBridgeUTC8), context: A.compatContext, audit: A }
      : A;
  }
  function selfTest() {
    const C = [],
      add = (id, ok, d = "") => C.push({ id, ok: !!ok, d });
    try {
      add("iana.shanghai", validZone("Asia/Shanghai"), "");
    } catch (err) {
      add("iana.shanghai", false, String(err));
    }
    try {
      const a = resolve(
        { y: 1986, m: 6, d: 5, h: 17, mi: 30, s: 0 },
        { zone: "Asia/Shanghai", longitude: 117.8, latitude: 24.5, solar: false },
      );
      add(
        "china.1986.resolved",
        a.available && a.offsetMinutes === 540,
        JSON.stringify({
          off: a.offsetMinutes,
          dst: a.dst,
          bridge: a.clocks?.legacyBridgeUTC8?.text,
        }),
      );
      add(
        "china.1986.dst",
        a.available && a.dst.known && a.dst.dstMinutes === 60,
        JSON.stringify(a.dst),
      );
      add(
        "china.1986.legacy-delta",
        a.available && Math.abs(a.correction.legacyInstantDeltaMinutes + 60) < 0.01,
        String(a.correction?.legacyInstantDeltaMinutes),
      );
    } catch (err) {
      add("china.1986", false, String(err));
    }
    try {
      const a = resolve(
        { y: 1992, m: 6, d: 5, h: 17, mi: 30, s: 0 },
        { zone: "Asia/Shanghai", longitude: 117.8, latitude: 24.5 },
      );
      add(
        "china.1992.standard",
        a.available && a.offsetMinutes === 480,
        JSON.stringify({ off: a.offsetMinutes, dst: a.dst }),
      );
    } catch (err) {
      add("china.1992.standard", false, String(err));
    }
    try {
      const gap = resolve(
        { y: 2024, m: 3, d: 10, h: 2, mi: 30, s: 0 },
        { zone: "America/New_York", longitude: -74, latitude: 40.7 },
      );
      add("dst.gap", !gap.available && gap.status === "nonexistent-local-time", gap.status);
      const fold = resolve(
        { y: 2024, m: 11, d: 3, h: 1, mi: 30, s: 0 },
        { zone: "America/New_York", longitude: -74, latitude: 40.7, choice: "earlier" },
      );
      add(
        "dst.fold",
        fold.available && fold.ambiguous && fold.candidates.length === 2,
        JSON.stringify(fold.candidates),
      );
    } catch (err) {
      add("dst.edge", false, String(err));
    }
    return { ok: C.every((x) => x.ok), checks: C };
  }
  const TEST = selfTest();

  /* Core 注册：只增加 v2 历史时间引擎，不覆盖 v86 TianjiTime。 */
  try {
    if (window.TianjiCore) {
      TianjiCore.registerSource({
        id: "runtime-intl-tzdb-v209",
        type: "runtime",
        title: "Browser Intl / IANA timezone runtime",
        version: "runtime-dependent",
        baseline: "v209",
        note: "时区转换由当前浏览器 Intl.DateTimeFormat 所携带的 IANA/tzdb 数据提供；浏览器不暴露具体 tzdb 版本，因此 Evidence 保存 zone、offset、候选 instant 与解析方法。",
      });
      TianjiCore.registerEngine(
        {
          id: "time.historical.v2",
          system: "calendar",
          name: "Tianji Historical Time Resolver",
          version: "1.0.0",
          source: "runtime-intl-tzdb-v209",
          doctrine: "IANA 历史时区/DST → UTC 瞬间 → 地方平太阳时/真太阳时；不自动覆盖 legacy 排盘",
        },
        (input) => resolve(input.civ, input.policy || {}),
      );
    }
  } catch (err) {
    console.warn("[V209 core registry]", err);
  }

  const TASKS209 = [
    { id: "ai", p: "P0", name: "统一 AI 解释层", state: "done", note: "v171 完成" },
    { id: "mcp", p: "P0", name: "MCP / API 外部调用层", state: "done", note: "v172 完成" },
    {
      id: "kg",
      p: "P0",
      name: "典籍 Evidence / 规则知识图谱",
      state: "done",
      note: "v173 第一阶段完成",
    },
    {
      id: "router",
      p: "P0",
      name: "自然语言问事路由",
      state: "done",
      note: "v196–v197；含寻人 / 寻物路由",
    },
    { id: "consumer", p: "P0", name: "统一消费者结果页 / 报告", state: "done", note: "v198 完成" },
    {
      id: "qimen-evidence",
      p: "P1",
      name: "奇门四家第三方对拍 / 高级 Evidence",
      state: "doing",
      note: "v199 一期验证台完成；日/月/年仍等待真实外部 reference 样本",
    },
    {
      id: "liuyao-depth",
      p: "P1",
      name: "六爻完整旺衰 / 卦格 / 应期层",
      state: "done",
      note: "v202 完成",
    },
    {
      id: "ziwei-depth",
      p: "P1",
      name: "紫微完整飞星体系",
      state: "done",
      note: "v203–v204 完成当前声明流派口径 V1",
    },
    {
      id: "qizheng",
      p: "P1",
      name: "七政四余核心化",
      state: "blocked",
      note: "等待星历、四余口径与许可证方案",
    },
    {
      id: "xk",
      p: "P1",
      name: "玄空完整宅盘",
      state: "done",
      note: "v205–v206 当前声明口径完成；外部逐盘 reference 单独 pending",
    },
    {
      id: "sanhe",
      p: "P1",
      name: "三合水法 Core",
      state: "done",
      note: "v207–v208 当前声明规则包完成；外部逐盘 reference 单独 pending",
    },
    {
      id: "tz",
      p: "P2",
      name: "历史时区 / 夏令时自动校正",
      state: "doing",
      note: "v209 一期：IANA 运行时历史偏移、DST 推断、跳时/重复时刻检测、标准/平太阳/真太阳时间链、旧 UTC+8 引擎兼容桥与 Evidence；全站自动接管待逐模块回归",
    },
    {
      id: "relation",
      p: "P2",
      name: "关系长期时间轴",
      state: "todo",
      note: "人物关系已有，长期阶段待产品化",
    },
    {
      id: "report",
      p: "P2",
      name: "合参 Evidence 正式报告",
      state: "todo",
      note: "与消费者结果页联动推进",
    },
  ];
  const BOARD = {
    schema: "tianji.priority.board.v1",
    build: BUILD,
    total: 14,
    done: 9,
    doing: 2,
    blocked: 1,
    progress: 71.4,
    next: [
      "历史时间二期：逐模块回归 / 可控接管",
      "奇门日/月/年真实第三方 reference 样本",
      "关系长期时间轴",
    ],
    tasks: TASKS209,
  };
  function applyBoard() {
    window.TianjiPriorityBoard = Object.freeze({
      schema: BOARD.schema,
      snapshot: () => clone(BOARD),
    });
    const road = window.TianjiRoadmap || {};
    window.TianjiRoadmap = Object.freeze(
      Object.assign({}, road, {
        urgentImportant: clone(BOARD),
        nextMainline: [
          "历史时间二期：八字/奇门/紫微逐模块回归与可控接管",
          "奇门四家第三方对拍（二期待外部样本）",
          "关系长期时间轴",
          "合参 Evidence 正式报告",
        ],
      }),
    );
  }
  applyBoard();
  window.addEventListener("tianji:lazy-ready", () => setTimeout(applyBoard, 0));

  window.TianjiHistoricalTime = Object.freeze({
    version: "1.0.0",
    build: BUILD,
    schema: SCHEMA,
    resolve: (civ, opt) => clone(resolve(civ, opt || {})),
    analyzeCurrent: () => clone(analyzeCurrent()),
    inferZone: (lon, lat) => clone(inferZone(lon, lat)),
    possibleInstants: (civ, zone) => clone(possibleInstants(civ, zone)),
    legacyBridge: (civ, opt) => clone(legacyBridge(civ, opt || {})),
    selfTest: () => clone(TEST),
    manifest: () => ({
      module: "Tianji Historical Time V1",
      runtimeSource: "Intl.DateTimeFormat / IANA timezone data bundled by browser",
      implemented: [
        "历史 UTC offset",
        "DST/季节偏移审计",
        "gap/fold 检测",
        "UTC 瞬间",
        "地方平太阳时",
        "真太阳时",
        "旧引擎 UTC+8 等价桥",
        "Evidence",
      ],
      limitations: [
        "浏览器不暴露具体 tzdb 版本",
        "全球经纬度→IANA 时区多边形数据库未内置",
        "DST 标记采用同年最低 offset 启发式，政治性标准时调整需人工复核",
        "尚未自动覆盖全站 legacy calcTime",
      ],
    }),
  });
  window.TianjiSystemV209 = {
    version: "v209",
    build: BUILD,
    historicalTime: true,
    noticeQuietDefault: true,
    baseline: "v208",
  };

  patchVerify();
  ensurePersonaButton();
  setTimeout(ensurePersonaButton, 700);
  document.addEventListener("click", (ev) => {
    if (ev.target?.id === "tz209Modal") closeModal();
  });
  function sync() {
    const b = document.getElementById("buildVersion");
  }
  /* V226: historical delayed version writer disabled */
})();
