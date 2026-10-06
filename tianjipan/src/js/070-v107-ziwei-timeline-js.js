(() => {
  "use strict";
  const BUILD = "2026-10-04 10:59:14",
    VERSION = "1.16.0",
    SCHEMA = "tianji.ziwei/1.16",
    CAPABILITY = "unified-fortune-timeline-api";
  const BASE = window.TianjiZiwei;
  if (
    !BASE ||
    typeof BASE.calculate !== "function" ||
    typeof BASE.horoscopeAt !== "function" ||
    typeof BASE.hourlyAt !== "function"
  ) {
    try {
      console.warn("[TianjiZiwei v107] v106 core unavailable");
    } catch (_) {}
    return;
  }
  const clone = (o) => {
      try {
        return structuredClone(o);
      } catch (_) {
        return o == null ? o : JSON.parse(JSON.stringify(o));
      }
    },
    pad = (n) => String(n).padStart(2, "0");
  function normalizeChart(x) {
    return x && Array.isArray(x.palaces) ? x : BASE.calculate(x || {});
  }
  function daysInMonth(y, m) {
    return new Date(Date.UTC(y, m, 0)).getUTCDate();
  }
  function normalizeUnit(u) {
    u = String(u || "day").toLowerCase();
    const map = {
      shi: "hour",
      时: "hour",
      hourly: "hour",
      hours: "hour",
      日: "day",
      daily: "day",
      days: "day",
      月: "month",
      monthly: "month",
      months: "month",
      年: "year",
      yearly: "year",
      years: "year",
      大限: "decadal",
      decade: "decadal",
      decades: "decadal",
    };
    u = map[u] || u;
    if (!["hour", "day", "month", "year", "decadal"].includes(u))
      throw new Error("ZiweiCore v107: timeline unit must be hour/day/month/year/decadal");
    return u;
  }
  function parseTarget(v, options = {}) {
    let y,
      m,
      d,
      h = 0,
      mi = 0,
      hasTime = false;
    if (v instanceof Date) {
      y = v.getFullYear();
      m = v.getMonth() + 1;
      d = v.getDate();
      h = v.getHours();
      mi = v.getMinutes();
      hasTime = true;
    } else if (typeof v === "string") {
      const s = v.trim(),
        x = s.match(/^(\d{4})[-\/.](\d{1,2})[-\/.](\d{1,2})/);
      if (!x) throw new Error("ZiweiCore v107: target must be YYYY-MM-DD");
      y = +x[1];
      m = +x[2];
      d = +x[3];
      const t = s.match(/(?:[T\s])(\d{1,2})(?::(\d{1,2}))?/);
      if (t) {
        h = +t[1];
        mi = +(t[2] || 0);
        hasTime = true;
      }
    } else if (v && typeof v === "object") {
      y = +(v.year ?? v.y);
      m = +(v.month ?? v.m);
      d = +(v.day ?? v.d);
      if (v.hour != null || v.h != null) {
        h = +(v.hour ?? v.h ?? 0);
        mi = +(v.minute ?? v.mi ?? 0);
        hasTime = true;
      }
    }
    if (!Number.isInteger(y) || !Number.isInteger(m) || !Number.isInteger(d))
      throw new Error("ZiweiCore v107: invalid target date");
    const dt = new Date(Date.UTC(y, m - 1, d));
    if (dt.getUTCFullYear() !== y || dt.getUTCMonth() + 1 !== m || dt.getUTCDate() !== d)
      throw new Error("ZiweiCore v107: invalid Gregorian date");
    if (!Number.isInteger(h) || h < 0 || h > 23 || !Number.isInteger(mi) || mi < 0 || mi > 59)
      throw new Error("ZiweiCore v107: invalid clock time");
    const iso = `${String(y).padStart(4, "0")}-${pad(m)}-${pad(d)}`,
      text = `${iso}${hasTime ? " " + pad(h) + ":" + pad(mi) : ""}`;
    let ti = options.timeIndex ?? options.timeIndexOfTarget;
    if (ti == null) ti = hasTime ? (h === 23 ? 12 : Math.floor((h + 1) / 2)) : 0;
    ti = Number(ti);
    if (!Number.isInteger(ti) || ti < 0 || ti > 12)
      throw new Error("ZiweiCore v107: timeIndex must be 0..12");
    return { year: y, month: m, day: d, hour: h, minute: mi, hasTime, iso, text, timeIndex: ti };
  }
  function targetText(t, forceTime = false) {
    return `${String(t.year).padStart(4, "0")}-${pad(t.month)}-${pad(t.day)}${t.hasTime || forceTime ? " " + pad(t.hour) + ":" + pad(t.minute) : ""}`;
  }
  function shiftTarget(target, unit = "day", delta = 1, options = {}) {
    const t = parseTarget(target, options),
      u = normalizeUnit(unit);
    delta = Number(delta);
    if (!Number.isInteger(delta)) throw new Error("ZiweiCore v107: delta must be integer");
    if (delta === 0) return targetText(t, t.hasTime);
    let y = t.year,
      m = t.month,
      d = t.day,
      h = t.hour,
      mi = t.minute,
      forceTime = t.hasTime || u === "hour";
    if (u === "hour" || u === "day") {
      const ms = Date.UTC(y, m - 1, d, h, mi) + (u === "hour" ? 2 * 3600000 : 86400000) * delta,
        dt = new Date(ms);
      y = dt.getUTCFullYear();
      m = dt.getUTCMonth() + 1;
      d = dt.getUTCDate();
      h = dt.getUTCHours();
      mi = dt.getUTCMinutes();
    } else if (u === "month") {
      const total = y * 12 + (m - 1) + delta;
      y = Math.floor(total / 12);
      m = (((total % 12) + 12) % 12) + 1;
      d = Math.min(d, daysInMonth(y, m));
    } else {
      const add = (u === "decadal" ? 10 : 1) * delta;
      y += add;
      d = Math.min(d, daysInMonth(y, m));
    }
    return targetText(
      { year: y, month: m, day: d, hour: h, minute: mi, hasTime: forceTime },
      forceTime,
    );
  }
  function compactCycle(x) {
    if (!x) return null;
    return {
      type: x.type || "",
      label: x.label || "",
      name: x.name || x.palaceName || "",
      branch: x.branch || x.earthlyBranch || "",
      stem: x.stem || x.heavenlyStem || "",
      range: clone(x.range || x.ageRange || null),
      nominalAge: x.nominalAge ?? null,
      isChildhood: !!x.isChildhood,
    };
  }
  function compactFlow(x, scope) {
    if (!x) return null;
    const k =
        scope === "yearly"
          ? "year"
          : scope === "monthly"
            ? "month"
            : scope === "daily"
              ? "day"
              : "hour",
      g = x[k] || {};
    return {
      scope,
      ganzhi: g.ganzhi || (g.stem || "") + (g.branch || ""),
      stem: g.stem || g.heavenlyStem || "",
      branch: g.branch || g.earthlyBranch || "",
      lifePalace: (x.lifePalace && x.lifePalace.branch) || "",
      lifePalaceIndex: x.lifePalace && x.lifePalace.branchIndex,
      transformations: (x.transformations || []).map((v) => ({ type: v.type, star: v.star })),
      flowStarCount: (x.flowStars && x.flowStars.count) || 0,
    };
  }
  function timelineAt(chartOrInput, target, options = {}) {
    const chart = normalizeChart(chartOrInput),
      t = parseTarget(target, options),
      query = targetText(t, t.hasTime),
      h = BASE.horoscopeAt(chart, query, Object.assign({}, options, { timeIndex: t.timeIndex })),
      yearly = compactFlow(h.yearly, "yearly"),
      monthly = compactFlow(h.monthly, "monthly"),
      daily = compactFlow(h.daily, "daily"),
      hourly = compactFlow(h.hourly, "hourly"),
      major = compactCycle(h.majorCycle),
      minor = h.minorPeriod
        ? {
            name: h.minorPeriod.name || "",
            branch: h.minorPeriod.branch || "",
            branchIndex: h.minorPeriod.branchIndex,
            nominalAge: h.age && h.age.nominalAge,
          }
        : null;
    const path = [
      {
        scope: "major",
        label: major && major.type === "childhood" ? "童限" : "大限",
        value: (major && major.name) || "",
        detail: major,
      },
      { scope: "minor", label: "小限", value: (minor && minor.name) || "", detail: minor },
      { scope: "yearly", label: "流年", value: (yearly && yearly.ganzhi) || "", detail: yearly },
      {
        scope: "monthly",
        label: "流月",
        value: (monthly && monthly.ganzhi) || "",
        detail: monthly,
      },
      { scope: "daily", label: "流日", value: (daily && daily.ganzhi) || "", detail: daily },
      { scope: "hourly", label: "流时", value: (hourly && hourly.ganzhi) || "", detail: hourly },
    ];
    return {
      schema: "tianji.ziwei.timeline/1.0",
      version: VERSION,
      target: {
        text: query,
        solar: { year: t.year, month: t.month, day: t.day, iso: t.iso },
        clock: { hour: t.hour, minute: t.minute, timeIndex: t.timeIndex, hasTime: t.hasTime },
      },
      age: { nominalAge: (h.age && h.age.nominalAge) ?? null },
      majorCycle: major,
      minorPeriod: minor,
      yearly,
      monthly,
      daily,
      hourly,
      path,
      policies: {
        ageDivide:
          (BASE.getAgeDivide && BASE.getAgeDivide()) ||
          (h.policy && h.policy.ageDivide) ||
          "normal",
        horoscopeDivide:
          (BASE.getHoroscopeDivide && BASE.getHoroscopeDivide()) ||
          (h.yearly && h.yearly.boundary && h.yearly.boundary.horoscopeDivide) ||
          "normal",
        dayDivide:
          (BASE.getDayDivide && BASE.getDayDivide()) ||
          (h.daily && h.daily.boundary && h.daily.boundary.dayDivide) ||
          "forward",
        algorithm: (chart.doctrine && chart.doctrine.algorithm) || "default",
        astroType: (chart.astroType && chart.astroType.id) || "heaven",
      },
      doctrine: clone(chart.doctrine || null),
      astroType: clone(chart.astroType || null),
      raw: options.includeRaw ? clone(h) : undefined,
    };
  }
  function timelineSummary(node) {
    return {
      target: node.target.text,
      nominalAge: node.age.nominalAge,
      major: node.majorCycle
        ? { type: node.majorCycle.type, name: node.majorCycle.name, range: node.majorCycle.range }
        : null,
      minor: node.minorPeriod ? node.minorPeriod.name : "",
      yearly: (node.yearly && node.yearly.ganzhi) || "",
      monthly: (node.monthly && node.monthly.ganzhi) || "",
      daily: (node.daily && node.daily.ganzhi) || "",
      hourly: (node.hourly && node.hourly.ganzhi) || "",
      lifePalaces: {
        yearly: (node.yearly && node.yearly.lifePalace) || "",
        monthly: (node.monthly && node.monthly.lifePalace) || "",
        daily: (node.daily && node.daily.lifePalace) || "",
        hourly: (node.hourly && node.hourly.lifePalace) || "",
      },
      policies: clone(node.policies),
    };
  }
  function timelineNavigate(chartOrInput, target, unit, delta, options = {}) {
    const shifted = shiftTarget(target, unit, delta, options);
    return timelineAt(chartOrInput, shifted, options);
  }
  function timelineRange(chartOrInput, config = {}) {
    const start = config.start ?? config.target;
    if (!start) throw new Error("ZiweiCore v107: timelineRange requires start");
    const unit = normalizeUnit(config.unit || "day"),
      step = Math.max(1, Math.abs(Number(config.step) || 1)),
      detail = config.detail === "full" ? "full" : "summary",
      max = Math.min(500, Math.max(1, Number(config.maxItems) || 120));
    let count = config.count != null ? Number(config.count) : null;
    if (count != null && (!Number.isInteger(count) || count < 1))
      throw new Error("ZiweiCore v107: count must be positive integer");
    const end = config.end ? parseTarget(config.end, config) : null,
      startObj = parseTarget(start, config);
    let direction = config.direction === "backward" ? -1 : 1;
    if (end) {
      const a = Date.UTC(
          startObj.year,
          startObj.month - 1,
          startObj.day,
          startObj.hour,
          startObj.minute,
        ),
        b = Date.UTC(end.year, end.month - 1, end.day, end.hour, end.minute);
      direction = b < a ? -1 : 1;
    }
    if (count == null && !end) count = 7;
    const items = [];
    let cursor = targetText(startObj, startObj.hasTime || unit === "hour"),
      guard = 0;
    while (guard++ < max) {
      const n = timelineAt(chartOrInput, cursor, config),
        entry = detail === "full" ? n : timelineSummary(n);
      items.push(entry);
      if (count != null && items.length >= count) break;
      if (end) {
        const c = parseTarget(cursor, config),
          cm = Date.UTC(c.year, c.month - 1, c.day, c.hour, c.minute),
          em = Date.UTC(end.year, end.month - 1, end.day, end.hour, end.minute);
        if ((direction > 0 && cm >= em) || (direction < 0 && cm <= em)) break;
      }
      cursor = shiftTarget(cursor, unit, direction * step, config);
    }
    return {
      unit,
      step,
      direction: direction > 0 ? "forward" : "backward",
      detail,
      count: items.length,
      truncated: guard >= max && (count == null || items.length < count),
      items,
    };
  }
  function timelineWindow(chartOrInput, target, config = {}) {
    const unit = normalizeUnit(config.unit || "day"),
      before = Math.max(0, Number(config.before ?? 3) | 0),
      after = Math.max(0, Number(config.after ?? 3) | 0),
      start = shiftTarget(target, unit, -before, config),
      range = timelineRange(
        chartOrInput,
        Object.assign({}, config, { start, unit, count: before + after + 1, direction: "forward" }),
      );
    return Object.assign({}, range, {
      centerIndex: before,
      centerTarget: timelineSummary(timelineAt(chartOrInput, target, config)).target,
    });
  }
  function decadalTimeline(chartOrInput) {
    const chart = normalizeChart(chartOrInput);
    return (chart.palaces || [])
      .filter((p) => p.decadal && Array.isArray(p.decadal.range))
      .map((p) => ({
        palaceName: p.name,
        branch: p.branch,
        branchIndex: p.branchIndex,
        heavenlyStem: p.decadal.heavenlyStem || "",
        earthlyBranch: p.decadal.earthlyBranch || p.branch || "",
        ageRange: clone(p.decadal.range),
        direction: p.decadal.direction || chart.direction || "",
      }))
      .sort((a, b) => a.ageRange[0] - b.ageRange[0])
      .map((x, i) => Object.assign({ index: i }, x));
  }
  function timelineDiff(a, b) {
    const A = a && a.yearly ? a : timelineAt(a.chart || a, a.target || a),
      B = b && b.yearly ? b : timelineAt(b.chart || b, b.target || b),
      scopes = ["majorCycle", "minorPeriod", "yearly", "monthly", "daily", "hourly"],
      changed = [];
    for (const s of scopes) {
      if (JSON.stringify(A[s]) !== JSON.stringify(B[s])) changed.push(s);
    }
    return {
      from: (A.target && A.target.text) || "",
      to: (B.target && B.target.text) || "",
      changedScopes: changed,
      count: changed.length,
    };
  }
  function calculate(input = {}) {
    const out = clone(BASE.calculate(input));
    out.schema = SCHEMA;
    out.version = VERSION;
    out.build = BUILD;
    out.capability = CAPABILITY;
    out.coverage = Object.assign({}, out.coverage || {}, {
      unifiedTimeline: true,
      timelineNavigate: true,
      timelineRange: true,
      timelineWindow: true,
      decadalTimeline: true,
    });
    return out;
  }
  function fromLegacy(lunar, hb, gender) {
    return BASE.fromLegacy(lunar, hb, gender);
  }
  function fromTimeContext(ctx, input = {}) {
    const out = clone(BASE.fromTimeContext(ctx, input));
    out.schema = SCHEMA;
    out.version = VERSION;
    out.build = BUILD;
    out.capability = CAPABILITY;
    out.coverage = Object.assign({}, out.coverage || {}, {
      unifiedTimeline: true,
      timelineNavigate: true,
      timelineRange: true,
      timelineWindow: true,
      decadalTimeline: true,
    });
    return out;
  }
  function selfTest() {
    const checks = [],
      birth = {
        lunar: { year: 2000, month: 7, day: 17, isLeap: false },
        hourBranchIndex: 2,
        gender: "F",
      };
    try {
      const b = BASE.selfTest && BASE.selfTest();
      checks.push({ id: "v106.base", ok: !b || b.ok !== false });
    } catch (e) {
      checks.push({ id: "v106.base", ok: false, error: String((e && e.message) || e) });
    }
    try {
      const n = timelineAt(birth, "2023-08-19 03:12", { dayDivide: "current" });
      checks.push({
        id: "timeline.reference-stack",
        ok:
          n.yearly.ganzhi === "癸卯" &&
          n.monthly.ganzhi === "庚申" &&
          n.daily.ganzhi === "己酉" &&
          n.hourly.ganzhi === "丙寅" &&
          !!n.majorCycle &&
          !!n.minorPeriod,
      });
      checks.push({
        id: "timeline.path",
        ok: n.path.length === 6 && n.path[2].value === "癸卯" && n.path[5].value === "丙寅",
      });
    } catch (e) {
      checks.push({
        id: "timeline.reference-stack",
        ok: false,
        error: String((e && e.message) || e),
      });
    }
    try {
      checks.push({
        id: "shift.day",
        ok: shiftTarget("2023-08-19 03:12", "day", 1) === "2023-08-20 03:12",
      });
      checks.push({
        id: "shift.month-clamp",
        ok: shiftTarget("2023-01-31", "month", 1) === "2023-02-28",
      });
      checks.push({
        id: "shift.year-leap-clamp",
        ok: shiftTarget("2024-02-29", "year", 1) === "2025-02-28",
      });
      checks.push({
        id: "shift.chinese-hour",
        ok: shiftTarget("2025-06-10 23:30", "hour", 1) === "2025-06-11 01:30",
      });
    } catch (e) {
      checks.push({ id: "shift-suite", ok: false, error: String((e && e.message) || e) });
    }
    try {
      const r = timelineRange(birth, {
        start: "2023-08-19 03:12",
        unit: "day",
        count: 3,
        dayDivide: "current",
      });
      checks.push({
        id: "range.three-days",
        ok:
          r.count === 3 &&
          r.items[0].target === "2023-08-19 03:12" &&
          r.items[1].target === "2023-08-20 03:12" &&
          r.items[0].daily !== r.items[1].daily,
      });
    } catch (e) {
      checks.push({ id: "range.three-days", ok: false, error: String((e && e.message) || e) });
    }
    try {
      const w = timelineWindow(birth, "2023-08-19 03:12", {
        unit: "day",
        before: 2,
        after: 2,
        dayDivide: "current",
      });
      checks.push({
        id: "window.centered",
        ok: w.count === 5 && w.centerIndex === 2 && w.items[2].target === "2023-08-19 03:12",
      });
    } catch (e) {
      checks.push({ id: "window.centered", ok: false, error: String((e && e.message) || e) });
    }
    try {
      const d = decadalTimeline(birth);
      checks.push({
        id: "decadal.timeline",
        ok:
          d.length === 12 &&
          d.every(
            (x, i) =>
              Array.isArray(x.ageRange) &&
              x.ageRange[1] - x.ageRange[0] === 9 &&
              (i === 0 || x.ageRange[0] >= d[i - 1].ageRange[0]),
          ),
      });
    } catch (e) {
      checks.push({ id: "decadal.timeline", ok: false, error: String((e && e.message) || e) });
    }
    try {
      const a = timelineAt(birth, "2023-08-19 03:12", { dayDivide: "current" }),
        b = timelineAt(birth, "2023-08-20 03:12", { dayDivide: "current" }),
        d = timelineDiff(a, b);
      checks.push({
        id: "diff.scopes",
        ok: d.changedScopes.includes("daily") && d.changedScopes.includes("hourly"),
      });
    } catch (e) {
      checks.push({ id: "diff.scopes", ok: false, error: String((e && e.message) || e) });
    }
    return { ok: checks.every((x) => x.ok), checks, version: VERSION, build: BUILD };
  }
  const TEST = selfTest();
  function manifest() {
    const prev = BASE.manifest ? BASE.manifest() : {};
    return {
      module: "Tianji Ziwei Core",
      version: VERSION,
      schema: SCHEMA,
      build: BUILD,
      baseline: "v106",
      capability: CAPABILITY,
      selfTest: clone(TEST),
      timeline: {
        units: ["hour(2h)", "day", "month", "year", "decadal(10y)"],
        maxBatch: 500,
        defaultDetail: "summary",
        apis: [
          "timelineAt",
          "timelineNavigate",
          "timelineRange",
          "timelineWindow",
          "decadalTimeline",
          "timelineDiff",
        ],
      },
      resolvedGaps: [
        ...(prev.resolvedGaps || []),
        "统一运限时间轴快照",
        "前后跳转",
        "批量区间查询",
        "时间窗口浏览",
        "大限顺序列表",
        "时间轴差异检测",
      ],
      remainingGaps: [
        "基于真实流月/节气边界的 nextBoundary 精确跳转",
        "时间轴可视化播放/拖动条",
        "跨层变化高亮与 AI 连续解读",
      ],
      reference: {
        name: "SylarLong/iztro",
        version: "2.6.1",
        license: "MIT",
        role: "list-API design reference",
        apis: ["decadalList", "yearlyList", "monthlyList", "horoscope"],
      },
    };
  }
  const API = Object.freeze({
    version: VERSION,
    schema: SCHEMA,
    build: BUILD,
    capability: CAPABILITY,
    calculate,
    fromLegacy,
    fromTimeContext,
    cycleAt: BASE.cycleAt,
    fortuneAt: BASE.fortuneAt || BASE.cycleAt,
    majorCycleAt: BASE.majorCycleAt || BASE.cycleAt,
    majorCycleForAge: BASE.majorCycleForAge,
    minorPeriodAt: BASE.minorPeriodAt,
    minorPeriodForDate: BASE.minorPeriodForDate || BASE.minorPeriodAt,
    nominalAgeAt: BASE.nominalAgeAt,
    yearlyAt: BASE.yearlyAt,
    flowYearAt: BASE.flowYearAt || BASE.yearlyAt,
    monthlyAt: BASE.monthlyAt,
    flowMonthAt: BASE.flowMonthAt || BASE.monthlyAt,
    dailyAt: BASE.dailyAt,
    flowDayAt: BASE.flowDayAt || BASE.dailyAt,
    hourlyAt: BASE.hourlyAt,
    flowHourAt: BASE.flowHourAt || BASE.hourlyAt,
    horoscopeAt: BASE.horoscopeAt,
    timelineAt,
    timelineNavigate,
    timelineRange,
    timelineWindow,
    decadalTimeline,
    timelineDiff,
    shiftTarget,
    setDayDivide: BASE.setDayDivide,
    getDayDivide: BASE.getDayDivide,
    setHoroscopeDivide: BASE.setHoroscopeDivide,
    getHoroscopeDivide: BASE.getHoroscopeDivide,
    setAgeDivide: BASE.setAgeDivide,
    getAgeDivide: BASE.getAgeDivide,
    setPolicy: BASE.setPolicy,
    getPolicy: BASE.getPolicy,
    setDoctrine: BASE.setDoctrine,
    getDoctrine: BASE.getDoctrine,
    selfTest: () => clone(TEST),
    manifest,
    base: BASE,
  });
  window.TianjiZiwei = API;
  if (TEST.ok) window.calcZiwei = (lunar, hb, gender) => fromLegacy(lunar, hb, gender);
  try {
    if (window.TianjiCore) {
      TianjiCore.registerSource({
        id: "tianji-v107-ziwei-timeline",
        type: "internal",
        title: "Tianji Ziwei Core 1.16 Unified Fortune Timeline API",
        version: VERSION,
        baseline: "v106",
      });
      TianjiCore.registerSource({
        id: "iztro-2.6.1-timeline-list-reference",
        type: "third-party-reference",
        title: "SylarLong/iztro v2.6.1 horoscope/list API reference",
        version: "2.6.1",
        license: "MIT",
        repository: "SylarLong/iztro",
        commit: "b78dfe391f65e938d79f2419dddb80f74c6bbb8e",
        role: "API-shape-reference",
      });
      TianjiCore.registerEngine(
        {
          id: "ziwei.core.v1.16",
          system: "ziwei",
          name: "Tianji Ziwei Core 1.16",
          version: VERSION,
          source: "tianji-v107-ziwei-timeline",
          doctrine:
            "unified timeline orchestration over decadal/minor/yearly/monthly/daily/hourly layers",
          status: "active",
        },
        (input) => calculate(input || {}),
      );
    }
  } catch (e) {
    try {
      console.warn("[TianjiZiwei v107] registry", e);
    } catch (_) {}
  }
  try {
    const old =
      document.getElementById("tjZiweiV16Badge") || document.getElementById("buildVersion");
    let b = document.getElementById("tjZiweiV17Badge");
    if (!b && old) {
      b = document.createElement("span");
      b.id = "tjZiweiV17Badge";
      old.insertAdjacentElement("afterend", b);
    }
    if (b) {
      b.textContent = "ZiweiCore 1.16 · 时间轴";
      b.classList.toggle("warn", !TEST.ok);
      b.title = TEST.ok
        ? "v107：统一运限时间轴 / 跳转 / 批量 / 窗口通过回归"
        : "v107 时间轴自检失败；v106 保持可回退";
      b.dataset.selftest = TEST.ok ? "PASS" : "FAIL";
      b.dataset.checks =
        String(TEST.checks.filter((x) => x.ok).length) + "/" + String(TEST.checks.length);
    }
  } catch (_) {}
  /* ---- v107 small timeline UI on verify pane ---- */
  const V17STATE = { cursor: "2023-08-19 03:12", unit: "day" };
  function currentDemo() {
    try {
      const birth = {
          lunar: { year: 2000, month: 7, day: 17, isLeap: false },
          hourBranchIndex: 2,
          gender: "F",
        },
        n = timelineAt(birth, V17STATE.cursor, { dayDivide: "current" });
      return timelineSummary(n);
    } catch (e) {
      return { target: V17STATE.cursor, error: String((e && e.message) || e) };
    }
  }
  function liveV17() {
    const n = currentDemo(),
      ok = TEST.ok ? "PASS" : "FAIL";
    return `<div class="panel blk tjzv17-live"><h4>统一运限时间轴 · v107</h4><div class="tjzv3-stat"><span class="pass">${ok} ${TEST.checks.filter((x) => x.ok).length}/${TEST.checks.length}</span></div><div class="tjzv17-grid"><div class="tjzv17-card"><b>统一快照</b><br>大限 / 小限 / 流年 / 流月 / 流日 / 流时一次返回</div><div class="tjzv17-card"><b>导航单位</b><br>时(2h) · 日 · 月 · 年 · 大限(10y)</div><div class="tjzv17-card"><b>批量保护</b><br>默认摘要 · 单次最多 500 个节点</div></div><div class="tjzv17-cursor"><code>${n.target || ""}</code><br>${n.error ? n.error : `${(n.major && n.major.name) || ""} · 小限 ${n.minor || ""} · ${n.yearly || ""} / ${n.monthly || ""} / ${n.daily || ""} / ${n.hourly || ""}`}</div><div class="tjzv17-actions"><button class="gbtn sm" id="tjzv17Prev" type="button">← 前一日</button><button class="gbtn sm" id="tjzv17Next" type="button">后一日 →</button><button class="gbtn sm" id="tjzv17Window" type="button">7日窗口</button></div></div>`;
  }
  function patchVerifyUI() {
    try {
      if (!window.REF_PANES || typeof REF_PANES.verify !== "function" || REF_PANES.verify.__v107)
        return;
      const old = REF_PANES.verify,
        oldBind = window.REF_BIND && REF_BIND.verify;
      const fn = () => liveV17() + old();
      fn.__v107 = true;
      REF_PANES.verify = fn;
      if (window.REF_BIND)
        REF_BIND.verify = function () {
          try {
            if (typeof oldBind === "function") oldBind();
          } catch (_) {}
          const rer = () => {
            try {
              if (typeof refRender === "function") refRender("verify");
            } catch (_) {}
          };
          const p = document.getElementById("tjzv17Prev"),
            n = document.getElementById("tjzv17Next"),
            w = document.getElementById("tjzv17Window");
          if (p)
            p.onclick = () => {
              V17STATE.cursor = shiftTarget(V17STATE.cursor, "day", -1);
              rer();
            };
          if (n)
            n.onclick = () => {
              V17STATE.cursor = shiftTarget(V17STATE.cursor, "day", 1);
              rer();
            };
          if (w)
            w.onclick = () => {
              try {
                const birth = {
                  lunar: { year: 2000, month: 7, day: 17, isLeap: false },
                  hourBranchIndex: 2,
                  gender: "F",
                };
                console.table(
                  timelineWindow(birth, V17STATE.cursor, {
                    unit: "day",
                    before: 3,
                    after: 3,
                    dayDivide: "current",
                  }).items,
                );
              } catch (e) {
                console.warn(e);
              }
            };
        };
    } catch (e) {
      try {
        console.warn("[Ziwei v107 timeline UI]", e);
      } catch (_) {}
    }
  }
  patchVerifyUI();
  const prev = window.TianjiSystem || {};
  window.TianjiSystem = Object.freeze({
    version: "v107",
    build: BUILD,
    baseline: "v84",
    core: window.TianjiCore || prev.core || null,
    time: window.TianjiTime || prev.time || null,
    verify: window.TianjiVerifier || prev.verify || null,
    bazi: window.TianjiBazi || prev.bazi || null,
    baziVerify: window.TianjiBaziVerifier || prev.baziVerify || null,
    ziwei: API,
    ziweiVerify: window.TianjiZiweiVerifier || prev.ziweiVerify || null,
    manifest: () => ({
      product: "天机盘",
      version: "v107",
      build: BUILD,
      baseline: "v84",
      ziwei: manifest(),
      ziweiVerify:
        window.TianjiZiweiVerifier && window.TianjiZiweiVerifier.manifest
          ? window.TianjiZiweiVerifier.manifest()
          : null,
    }),
  });
  try {
    const bv = document.getElementById("buildVersion");

    window.dispatchEvent(new CustomEvent("tianji:ziwei-core-v107-ready", { detail: manifest() }));
  } catch (_) {}
})();
