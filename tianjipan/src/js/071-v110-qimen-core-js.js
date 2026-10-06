(() => {
  "use strict";
  const VERSION = "1.0.0",
    SCHEMA = "tianji.qimen/1.0",
    BUILD = "2026-10-04 11:35:21";
  const LEGACY_CALC = window.calcQimen;
  if (typeof LEGACY_CALC !== "function") {
    try {
      console.warn("[TianjiQimen v110] legacy calcQimen unavailable");
    } catch (_) {}
    return;
  }
  const clone = (x) => (x == null ? x : JSON.parse(JSON.stringify(x)));
  const modn = (n, m) => ((n % m) + m) % m;
  const WXN_LOCAL = ["木", "火", "土", "金", "水"];
  const METHOD = Object.freeze({
    system: "奇门遁甲",
    family: "时家奇门",
    plate: "转盘",
    juMethod: "拆补法",
    juBasis: "当前节气 + 日柱五日一元符头",
    yinYangBoundary: "冬至后阳遁 / 夏至后阴遁（按二十四节气表）",
    center: "中五宫地盘干寄坤二宫；天禽随天芮",
    gods: "阳遁：白虎/玄武；阴遁：勾陈/朱雀",
    hourXun: "时柱六旬定遁甲；旬首所遁之仪定值符值使起宫",
    status: "formalized-from-v84",
  });
  function validate(input = {}) {
    const lon = Number(input.solarLongitude ?? input.lon),
      dayIdx = Number(input.dayGanzhiIndex ?? input.dayIdx),
      hourIdx = Number(input.hourGanzhiIndex ?? input.hourIdx);
    const lonFu = input.boundarySolarLongitude ?? input.lonFu;
    if (!Number.isFinite(lon)) throw new Error("QimenCore: solarLongitude required");
    if (!Number.isFinite(dayIdx)) throw new Error("QimenCore: dayGanzhiIndex required");
    if (!Number.isFinite(hourIdx)) throw new Error("QimenCore: hourGanzhiIndex required");
    return {
      solarLongitude: modn(lon, 360),
      boundarySolarLongitude: lonFu == null ? null : modn(Number(lonFu), 360),
      dayGanzhiIndex: modn(Math.trunc(dayIdx), 60),
      hourGanzhiIndex: modn(Math.trunc(hourIdx), 60),
    };
  }
  function rawCore(input = {}) {
    const v = validate(input),
      lon = v.solarLongitude,
      dayIdx = v.dayGanzhiIndex,
      hourIdx = v.hourGanzhiIndex,
      lonFu = v.boundarySolarLongitude;
    const kNow = Math.floor(lon / 15) % 24;
    const k = Math.floor((lonFu == null ? lon : lonFu) / 15) % 24,
      term = TERMS[k],
      yang = k >= 18 || k <= 5;
    const fu = dayIdx - (dayIdx % 5),
      yuan = (fu / 5) % 3,
      ju = JU[term][yuan];
    const seq = ["戊", "己", "庚", "辛", "壬", "癸", "丁", "丙", "乙"],
      earth = {};
    for (let i = 0; i < 9; i++) {
      const p = yang ? ((ju - 1 + i) % 9) + 1 : ((((ju - 1 - i) % 9) + 9) % 9) + 1;
      earth[p] = seq[i];
    }
    const xun = Math.floor(hourIdx / 10),
      steps = hourIdx % 10;
    const dun = ["戊", "己", "庚", "辛", "壬", "癸"][xun];
    const p0 = +Object.keys(earth).find((p) => earth[p] === dun),
      p0r = p0 === 5 ? 2 : p0;
    const hs = hourIdx % 10,
      tstem = hs === 0 ? dun : GAN[hs];
    let q = +Object.keys(earth).find((p) => earth[p] === tstem);
    if (q === 5) q = 2;
    const shiftS = (ri(q) - ri(p0r) + 8) % 8,
      heaven = {};
    RING.forEach((op, i) => {
      const np = RING[(i + shiftS) % 8];
      heaven[np] = {
        star: QSTAR[op],
        stem: earth[op],
        extra: op === 2 ? { star: "禽", stem: earth[5] } : null,
      };
    });
    const r = yang ? ((p0 - 1 + steps) % 9) + 1 : ((((p0 - 1 - steps) % 9) + 9) % 9) + 1,
      rr = r === 5 ? 2 : r;
    const shiftD = (ri(rr) - ri(p0r) + 8) % 8,
      doors = {};
    RING.forEach((op, i) => {
      doors[RING[(i + shiftD) % 8]] = QDOOR[op];
    });
    const gl = yang ? GODS_Y : GODS_N,
      dir = yang ? 1 : -1,
      gods = {};
    gl.forEach((g, i) => {
      gods[RING[(((ri(q) + dir * i) % 8) + 8) % 8]] = g;
    });
    const head = (hourIdx - (hourIdx % 10)) % 12,
      kongB = [(head + 10) % 12, (head + 11) % 12];
    const kongP = [...new Set(kongB.map((b) => PAL_ZHI[b]))];
    const hb = hourIdx % 12,
      horseB = [2, 11, 8, 5][hb % 4],
      horseP = PAL_ZHI[horseB];
    const cells = {};
    [1, 2, 3, 4, 6, 7, 8, 9].forEach((p) => {
      const c = {
        p,
        earth: earth[p],
        hs: heaven[p].stem,
        star: heaven[p].star,
        extra: heaven[p].extra,
        door: doors[p],
        god: gods[p],
        tags: [],
        geju: [],
      };
      if (p === 2 && earth[5]) c.center = earth[5];
      GEJU.forEach(([a, b, n, t]) => {
        if (c.hs === a && c.earth === b) c.geju.push({ n, t });
      });
      if ("乙丙丁".includes(c.hs) && DOORTYPE[c.door] === "吉")
        c.geju.push({ n: "奇门吉格", t: "吉" });
      const dw = DOORWX[c.door],
        pw = PWX[p];
      if ((pw - dw + 5) % 5 === 2) c.tags.push({ n: "门迫", t: "凶" });
      if (kongP.includes(p)) c.tags.push({ n: "空亡", t: "空" });
      if (horseP === p) c.tags.push({ n: "驿马", t: "马" });
      if (p === q) c.tags.push({ n: "值符", t: "符" });
      if (p === rr) c.tags.push({ n: "值使", t: "使" });
      let sc = (STAR_SC[c.star] || 0) + DOOR_SC[c.door];
      c.geju.forEach((g) => {
        sc += g.t === "吉" ? 2 : -2;
      });
      c.tags.forEach((g) => {
        if (g.n === "门迫") sc -= 1;
        if (g.n === "空亡") sc -= 1;
      });
      c.score = sc;
      cells[p] = c;
    });
    cells[5] = { p: 5, earth: earth[5], center: true, tags: [], geju: [] };
    const ranked = [1, 2, 3, 4, 6, 7, 8, 9].sort((a, b) => cells[b].score - cells[a].score);
    const zfStar = p0 === 5 ? "禽" : QSTAR[p0];
    return {
      yang,
      ju,
      term,
      k,
      kNow,
      yuan,
      dun,
      p0,
      q,
      rr,
      steps,
      xun,
      zfStar,
      zsDoor: QDOOR[p0r],
      cells,
      earth,
      kongB,
      kongP,
      horseB,
      horseP,
      fuyin: shiftS === 0,
      fanyin: shiftS === 4,
      best: ranked.slice(0, 2),
      worst: ranked.slice(-2).reverse(),
      yuanName: ["上元", "中元", "下元"][yuan],
      hourGZ: gz(hourIdx),
    };
  }
  function palaceObject(raw, p) {
    const c = raw.cells[p] || {};
    const base = {
      number: p,
      name: PNAME[p] + PNUM[p] + "宫",
      direction: PDIR[p],
      elementIndex: PWX[p],
      element: WXN_LOCAL[PWX[p]],
      earthStem: c.earth ?? raw.earth[p] ?? null,
    };
    if (p === 5)
      return Object.assign(base, {
        center: true,
        heavenStem: null,
        star: null,
        door: null,
        god: null,
        score: null,
        tags: [],
        patterns: [],
      });
    return Object.assign(base, {
      center: false,
      heavenStem: c.hs || null,
      star: c.star || null,
      extraStar: c.extra ? clone(c.extra) : null,
      door: c.door || null,
      god: c.god || null,
      score: Number(c.score || 0),
      tags: clone(c.tags || []),
      patterns: clone(c.geju || []),
      flags: {
        chief: (c.tags && c.tags.some((x) => x.n === "值符")) || false,
        chiefDoor: (c.tags && c.tags.some((x) => x.n === "值使")) || false,
        empty: (c.tags && c.tags.some((x) => x.n === "空亡")) || false,
        horse: (c.tags && c.tags.some((x) => x.n === "驿马")) || false,
        doorPressure: (c.tags && c.tags.some((x) => x.n === "门迫")) || false,
      },
    });
  }
  function normalize(raw, input) {
    const palaces = [1, 2, 3, 4, 5, 6, 7, 8, 9].map((p) => palaceObject(raw, p));
    return {
      schema: SCHEMA,
      version: VERSION,
      build: BUILD,
      input: clone(validate(input)),
      method: clone(METHOD),
      calendar: {
        solarTerm: raw.term,
        solarTermIndex: raw.k,
        currentSolarTermIndex: raw.kNow,
        yinYang: raw.yang ? "阳遁" : "阴遁",
        yangDun: !!raw.yang,
        juNumber: raw.ju,
        yuanIndex: raw.yuan,
        yuanName: raw.yuanName,
      },
      hour: {
        ganzhiIndex: validate(input).hourGanzhiIndex,
        ganzhi: raw.hourGZ,
        xunIndex: raw.xun,
        stepsInXun: raw.steps,
        dunStem: raw.dun,
      },
      duty: {
        chiefStar: raw.zfStar,
        chiefStarPalace: raw.q,
        chiefDoor: raw.zsDoor,
        chiefDoorPalace: raw.rr,
        originPalace: raw.p0,
      },
      palaces,
      plates: {
        earth: clone(raw.earth),
        heaven: Object.fromEntries(
          palaces
            .filter((x) => !x.center)
            .map((x) => [x.number, { stem: x.heavenStem, star: x.star, extraStar: x.extraStar }]),
        ),
        doors: Object.fromEntries(palaces.filter((x) => !x.center).map((x) => [x.number, x.door])),
        gods: Object.fromEntries(palaces.filter((x) => !x.center).map((x) => [x.number, x.god])),
      },
      markers: {
        emptyBranches: clone(raw.kongB),
        emptyPalaces: clone(raw.kongP),
        horseBranch: raw.horseB,
        horsePalace: raw.horseP,
      },
      flags: { fuyin: !!raw.fuyin, fanyin: !!raw.fanyin },
      ranking: { best: clone(raw.best), worst: clone(raw.worst) },
      legacy: clone(raw),
    };
  }
  function calculate(input = {}) {
    const v = validate(input),
      raw = rawCore(v);
    return normalize(raw, v);
  }
  function fromLegacy(lon, dayIdx, hourIdx, lonFu) {
    return calculate({
      solarLongitude: lon,
      dayGanzhiIndex: dayIdx,
      hourGanzhiIndex: hourIdx,
      boundarySolarLongitude: lonFu,
    }).legacy;
  }
  function fromTimeContext(ctx, input = {}) {
    if (!ctx || !ctx.astronomy || !Number.isFinite(+ctx.astronomy.solarLongitude))
      throw new Error("QimenCore: invalid TimeContext");
    let bz = input.bazi || null;
    if (!bz && window.TianjiBazi && typeof TianjiBazi.calculate === "function")
      bz = TianjiBazi.calculate(ctx, { gender: input.gender || "M" });
    const leg = bz && bz.legacy;
    if (!leg || !Number.isFinite(+leg.dayIdx) || !Number.isFinite(+leg.hourIdx))
      throw new Error("QimenCore: Bazi day/hour Ganzhi indices unavailable");
    return calculate({
      solarLongitude: +ctx.astronomy.solarLongitude,
      dayGanzhiIndex: +leg.dayIdx,
      hourGanzhiIndex: +leg.hourIdx,
      boundarySolarLongitude: input.boundarySolarLongitude,
    });
  }
  function clean(v) {
    if (Array.isArray(v)) return v.map(clean);
    if (v && typeof v === "object") {
      const o = {};
      Object.keys(v)
        .sort()
        .forEach((k) => (o[k] = clean(v[k])));
      return o;
    }
    return typeof v === "number" ? +v.toFixed(10) : v;
  }
  function diffPaths(a, b, path = "", out = []) {
    if (typeof a === "number" && typeof b === "number") {
      if (Math.abs(a - b) > 1e-9) out.push({ path, a, b });
      return out;
    }
    if (Array.isArray(a) || Array.isArray(b)) {
      if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) {
        out.push({ path, a, b });
        return out;
      }
      for (let i = 0; i < a.length; i++) diffPaths(a[i], b[i], `${path}[${i}]`, out);
      return out;
    }
    if (a && b && typeof a === "object" && typeof b === "object") {
      const ks = [...new Set([...Object.keys(a), ...Object.keys(b)])].sort();
      for (const k of ks) diffPaths(a[k], b[k], path ? path + "." + k : k, out);
      return out;
    }
    if (a !== b) out.push({ path, a, b });
    return out;
  }
  function verifyLegacy(input = {}) {
    const v = validate(input),
      old = LEGACY_CALC(
        v.solarLongitude,
        v.dayGanzhiIndex,
        v.hourGanzhiIndex,
        v.boundarySolarLongitude,
      ),
      neu = rawCore(v),
      diff = diffPaths(clean(old), clean(neu));
    return { ok: diff.length === 0, diff, legacy: clone(old), core: clone(neu), input: clone(v) };
  }
  function selfTest() {
    const checks = [],
      cases = [
        { id: "winter-yang", solarLongitude: 270.1, dayGanzhiIndex: 0, hourGanzhiIndex: 0 },
        { id: "spring", solarLongitude: 315.2, dayGanzhiIndex: 14, hourGanzhiIndex: 23 },
        { id: "equinox", solarLongitude: 0.2, dayGanzhiIndex: 29, hourGanzhiIndex: 37 },
        { id: "summer-yin", solarLongitude: 90.1, dayGanzhiIndex: 44, hourGanzhiIndex: 49 },
        { id: "autumn", solarLongitude: 180.2, dayGanzhiIndex: 57, hourGanzhiIndex: 11 },
        {
          id: "boundary-override",
          solarLongitude: 269.99,
          boundarySolarLongitude: 270.01,
          dayGanzhiIndex: 9,
          hourGanzhiIndex: 59,
        },
      ];
    for (const c of cases) {
      try {
        const v = verifyLegacy(c);
        checks.push({ id: "legacy." + c.id, ok: v.ok, diff: v.diff.slice(0, 3) });
      } catch (e) {
        checks.push({ id: "legacy." + c.id, ok: false, error: String((e && e.message) || e) });
      }
    }
    try {
      const r = calculate(cases[0]);
      checks.push({
        id: "canonical.shape",
        ok:
          r.palaces.length === 9 &&
          r.palaces.filter((x) => !x.center).length === 8 &&
          !!r.duty.chiefStar &&
          !!r.duty.chiefDoor,
        detail: `${r.calendar.yinYang}${r.calendar.juNumber}局 · ${r.duty.chiefStar}/${r.duty.chiefDoor}`,
      });
    } catch (e) {
      checks.push({ id: "canonical.shape", ok: false, error: String((e && e.message) || e) });
    }
    try {
      const r = calculate(cases[3]);
      checks.push({
        id: "markers.shape",
        ok:
          Array.isArray(r.markers.emptyPalaces) &&
          Number.isFinite(r.markers.horsePalace) &&
          r.ranking.best.length === 2 &&
          r.ranking.worst.length === 2,
      });
    } catch (e) {
      checks.push({ id: "markers.shape", ok: false, error: String((e && e.message) || e) });
    }
    return { ok: checks.every((x) => x.ok), checks, version: VERSION, build: BUILD };
  }
  const TEST = selfTest();
  let installed = false;
  function install() {
    if (!TEST.ok) return false;
    if (!window.__TianjiCalcQimenV84) window.__TianjiCalcQimenV84 = LEGACY_CALC;
    window.calcQimen = function (lon, dayIdx, hourIdx, lonFu) {
      return fromLegacy(lon, dayIdx, hourIdx, lonFu);
    };
    installed = true;
    return true;
  }
  function rollback() {
    if (window.__TianjiCalcQimenV84) {
      window.calcQimen = window.__TianjiCalcQimenV84;
      installed = false;
      return true;
    }
    return false;
  }
  function manifest() {
    return {
      module: "Tianji Qimen Core",
      version: VERSION,
      schema: SCHEMA,
      build: BUILD,
      baseline: "v109 / v84 legacy qimen",
      status: TEST.ok ? "active" : "shadow-only",
      installed,
      method: clone(METHOD),
      selfTest: clone(TEST),
      implemented: [
        "时家奇门",
        "转盘",
        "拆补法",
        "阴阳遁",
        "上中下三元定局",
        "地盘三奇六仪",
        "九星",
        "八门",
        "八神",
        "值符值使",
        "空亡",
        "驿马",
        "门迫",
        "基础天地盘格局",
        "伏吟反吟",
        "宫位评分兼容",
      ],
      limitations: [
        "尚未建立独立第三方奇门校验层",
        "尚未实现置闰法/茅山法等定局流派切换",
        "尚未实现飞盘奇门",
        "现有格局识别仍是通行基础子集",
        "问事 qimenPlus/qimenAsk 暂作为上层规则解释层，尚未抽成知识图谱",
      ],
    };
  }
  const API = Object.freeze({
    version: VERSION,
    schema: SCHEMA,
    build: BUILD,
    method: METHOD,
    calculate,
    fromLegacy,
    fromTimeContext,
    verifyLegacy,
    selfTest: () => clone(TEST),
    manifest,
    install,
    rollback,
    get installed() {
      return installed;
    },
  });
  window.TianjiQimen = API;

  /* 主工程路线锚点：防止单一术数模块无限扩张而偏离最初清单 */
  const ROADMAP = Object.freeze({
    product: "天机玄秘 / 天机盘",
    principle: "源码模块化 · 成品独立单文件 HTML；确定性算法与解释层分离；所有流派口径显式可审计",
    architecture: [
      "时间/历法核心",
      "传统术数确定性计算内核",
      "统一 Tianji Schema",
      "流派/规则层",
      "典籍 Evidence / 知识图谱",
      "AI 推理与解读层",
      "可视化工作台",
      "MCP / API",
    ],
    engineRoute: [
      { id: "calendar", name: "时间历法", state: "core+verify", versions: "v86–v87" },
      { id: "bazi", name: "八字", state: "core+verify", versions: "v88–v89" },
      { id: "ziwei", name: "紫微斗数", state: "core+verify+fortune-ui", versions: "v90–v109" },
      {
        id: "qimen",
        name: "奇门遁甲",
        state: "core",
        versions: "v110",
        next: "第三方验证 + 规则层",
      },
      { id: "liuren", name: "大六壬", state: "legacy-present", next: "core+verify" },
      { id: "liuyao", name: "六爻纳甲", state: "legacy-present", next: "core+verify" },
      { id: "meihua", name: "梅花易数", state: "legacy-present", next: "core+verify" },
      { id: "zeri", name: "黄历/择日", state: "legacy-present", next: "统一历法口径+规则证据" },
      {
        id: "qizheng",
        name: "七政四余",
        state: "workbench-present",
        next: "天文历表/许可证方案后再核心化",
      },
    ],
    workbench: [
      "人物档案",
      "关系网络",
      "万年历/择日",
      "八字",
      "紫微",
      "奇门",
      "大六壬",
      "六爻",
      "梅花",
      "七政四余",
      "罗盘/房屋方位/风水",
      "天机总盘/盘库",
      "术语指南",
      "天机书院/古籍",
      "复盘记录",
      "赞赏",
    ],
    interaction: [
      "左右区域独立滚动",
      "圆盘滚轮缩放",
      "按住拖动圆盘",
      "统一放大/全屏交互",
      "右侧即时导航",
      "星空/圆盘动效常开",
      "语音报时与重要时辰播报",
    ],
    afterEngines: [
      "典籍证据层 / 规则知识图谱",
      "AI 解释层",
      "MCP / API",
      "跨术数合参与可解释推导链",
    ],
    nextMainline: [
      "奇门验证/增强",
      "大六壬核心",
      "六爻/梅花核心",
      "择日核心",
      "Evidence",
      "AI",
      "MCP",
    ],
  });
  window.TianjiRoadmap = ROADMAP;

  try {
    if (window.TianjiCore) {
      TianjiCore.registerSource({
        id: "tianji-v110-qimen-core",
        type: "internal",
        title: "Tianji Qimen Core 1.0",
        version: VERSION,
        baseline: "v109",
      });
      TianjiCore.registerEngine(
        {
          id: "qimen.core.v1",
          system: "qimen",
          name: "Tianji Qimen Core 1.0",
          version: VERSION,
          source: "tianji-v110-qimen-core",
          doctrine: "时家奇门 · 转盘 · 拆补法",
          status: TEST.ok ? "active" : "shadow-only",
        },
        (input) => calculate(input || {}),
      );
      TianjiCore.registerEngine(
        {
          id: "qimen.verify.v84.v1",
          system: "qimen",
          name: "Qimen v84 Regression Verifier",
          version: VERSION,
          source: "tianji-v110-qimen-core",
          doctrine: "新核心 vs v84 calcQimen 精确回归",
          status: "verification",
        },
        (input) => verifyLegacy(input || {}),
      );
    }
  } catch (e) {
    try {
      console.warn("[TianjiQimen v110 registry]", e);
    } catch (_) {}
  }
  const INSTALLED = install();
  try {
    const old = document.getElementById("buildVersion");
    let b = document.getElementById("tjQimenV1Badge");
    if (!b && old) {
      b = document.createElement("span");
      b.id = "tjQimenV1Badge";
      old.insertAdjacentElement("afterend", b);
    }
    if (b) {
      b.textContent = "QimenCore 1.0 · 时家转盘拆补";
      b.classList.toggle("warn", !TEST.ok);
      b.title = TEST.ok
        ? "v110：奇门核心抽离 / v84 新旧双轨回归通过"
        : "v110 奇门核心自检失败，仍保留 v84 legacy";
      b.dataset.selftest = TEST.ok ? "PASS" : "FAIL";
      b.dataset.checks =
        String(TEST.checks.filter((x) => x.ok).length) + "/" + String(TEST.checks.length);
    }
  } catch (_) {}
  const prev = window.TianjiSystem || {};
  window.TianjiSystem = Object.freeze({
    version: "v110",
    build: BUILD,
    baseline: "v84",
    core: window.TianjiCore || prev.core || null,
    time: window.TianjiTime || prev.time || null,
    verify: window.TianjiVerifier || prev.verify || null,
    bazi: window.TianjiBazi || prev.bazi || null,
    baziVerify: window.TianjiBaziVerifier || prev.baziVerify || null,
    ziwei: window.TianjiZiwei || prev.ziwei || null,
    ziweiTimelineUI: window.TianjiZiweiTimelineUI || prev.ziweiTimelineUI || null,
    ziweiSnapshotAB: window.TianjiZiweiSnapshotAB || prev.ziweiSnapshotAB || null,
    ziweiVerify: window.TianjiZiweiVerifier || prev.ziweiVerify || null,
    qimen: API,
    roadmap: ROADMAP,
    manifest: () => ({
      product: "天机盘",
      version: "v110",
      build: BUILD,
      baseline: "v84",
      qimen: manifest(),
      roadmap: clone(ROADMAP),
    }),
  });
  try {
    const bv = document.getElementById("buildVersion");

    window.dispatchEvent(new CustomEvent("tianji:qimen-core-v110-ready", { detail: manifest() }));
  } catch (_) {}
})();
