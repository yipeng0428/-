(() => {
  "use strict";
  const BUILD = "2026-10-04 12:00:25";

  /* ---------- Qimen 2.0: explicit doctrine/style layer ---------- */
  const QB = window.TianjiQimen;
  const QV = window.TianjiQimenVerifier;
  const qclone = (x) => (x == null ? x : JSON.parse(JSON.stringify(x)));
  const qmod = (n, m) => ((n % m) + m) % m;
  const QPOL_DEFAULT = Object.freeze({
    panType: "时盘",
    panStyle: "转盘",
    zhiRunMethod: "chaibu",
    yinGodSystem: "gouque",
    horseSource: "hour",
  });
  let QPOL = qclone(QPOL_DEFAULT);
  const QTERMS = [
    "春分",
    "清明",
    "谷雨",
    "立夏",
    "小满",
    "芒种",
    "夏至",
    "小暑",
    "大暑",
    "立秋",
    "处暑",
    "白露",
    "秋分",
    "寒露",
    "霜降",
    "立冬",
    "小雪",
    "大雪",
    "冬至",
    "小寒",
    "大寒",
    "立春",
    "雨水",
    "惊蛰",
  ];
  const QJU = {
    冬至: [1, 7, 4],
    小寒: [2, 8, 5],
    大寒: [3, 9, 6],
    立春: [8, 5, 2],
    雨水: [9, 6, 3],
    惊蛰: [1, 7, 4],
    春分: [3, 9, 6],
    清明: [4, 1, 7],
    谷雨: [5, 2, 8],
    立夏: [4, 1, 7],
    小满: [5, 2, 8],
    芒种: [6, 3, 9],
    夏至: [9, 3, 6],
    小暑: [8, 2, 5],
    大暑: [7, 1, 4],
    立秋: [2, 5, 8],
    处暑: [1, 4, 7],
    白露: [9, 3, 6],
    秋分: [7, 1, 4],
    寒露: [6, 9, 3],
    霜降: [5, 8, 2],
    立冬: [6, 9, 3],
    小雪: [5, 8, 2],
    大雪: [4, 7, 1],
  };
  const QRING = [1, 8, 3, 4, 9, 2, 7, 6],
    QRING_CCW = [1, 6, 7, 2, 9, 4, 3, 8],
    QSTEMS = ["戊", "己", "庚", "辛", "壬", "癸", "丁", "丙", "乙"];
  const QSTAR_RING = ["蓬", "任", "冲", "辅", "英", "芮", "柱", "心"],
    QSTAR_FLY = ["蓬", "芮", "冲", "辅", "禽", "心", "柱", "任", "英"];
  const QDOOR_RING = ["休", "生", "伤", "杜", "景", "死", "惊", "开"],
    QFLY_PALS = [1, 2, 3, 4, 6, 7, 8, 9];
  const QHOME_STAR = {
      1: "蓬",
      2: "芮",
      3: "冲",
      4: "辅",
      5: "禽",
      6: "心",
      7: "柱",
      8: "任",
      9: "英",
    },
    QHOME_DOOR = { 1: "休", 8: "生", 3: "伤", 4: "杜", 9: "景", 2: "死", 7: "惊", 6: "开" };
  const QGODS_STD = ["值符", "腾蛇", "太阴", "六合", "白虎", "玄武", "九地", "九天"],
    QGODS_ALT = ["值符", "腾蛇", "太阴", "六合", "勾陈", "朱雀", "九地", "九天"];
  const QZHI = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"],
    QGAN = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"];
  const QJZ = Array.from({ length: 60 }, (_, i) => QGAN[i % 10] + QZHI[i % 12]);
  const QXUN = ["甲子", "甲戌", "甲申", "甲午", "甲辰", "甲寅"],
    QLIUYI = ["戊", "己", "庚", "辛", "壬", "癸"];
  const QPALZ = [1, 8, 8, 3, 4, 4, 9, 2, 2, 7, 6, 6];
  function qPolicy(p = {}) {
    const x = Object.assign({}, QPOL, p || {});
    if (x.panType !== "时盘") throw new Error("v112 当前只实现时盘；日盘/月盘/年盘留待下一阶段");
    if (!["转盘", "飞盘"].includes(x.panStyle)) throw new Error("panStyle must be 转盘 or 飞盘");
    if (!["chaibu", "maoshan"].includes(x.zhiRunMethod))
      throw new Error("zhiRunMethod must be chaibu or maoshan");
    if (!["gouque", "huwu"].includes(x.yinGodSystem))
      throw new Error("yinGodSystem must be gouque or huwu");
    if (!["hour", "day"].includes(x.horseSource))
      throw new Error("horseSource must be hour or day");
    return x;
  }
  function qValidate(input = {}) {
    const lon = Number(input.solarLongitude ?? input.lon),
      day = Number(input.dayGanzhiIndex ?? input.dayIdx),
      hour = Number(input.hourGanzhiIndex ?? input.hourIdx),
      lonFu = input.boundarySolarLongitude ?? input.lonFu;
    if (!Number.isFinite(lon) || !Number.isFinite(day) || !Number.isFinite(hour))
      throw new Error("Qimen v112: solarLongitude/dayGanzhiIndex/hourGanzhiIndex required");
    return {
      solarLongitude: qmod(lon, 360),
      boundarySolarLongitude: lonFu == null ? null : qmod(Number(lonFu), 360),
      dayGanzhiIndex: qmod(Math.trunc(day), 60),
      hourGanzhiIndex: qmod(Math.trunc(hour), 60),
      termDayIndex: input.termDayIndex == null ? null : Number(input.termDayIndex),
    };
  }
  function qri(p) {
    return QRING.indexOf(p === 5 ? 2 : p);
  }
  function qrotate(p, steps, yang) {
    const o = yang ? QRING : QRING_CCW,
      at = o.indexOf(p === 5 ? 2 : p);
    return o[qmod(at + steps, 8)];
  }
  function qsteps(a, b, yang) {
    const o = yang ? QRING : QRING_CCW;
    return qmod(o.indexOf(b === 5 ? 2 : b) - o.indexOf(a === 5 ? 2 : a), 8);
  }
  function qYuanChaibu(dayIdx) {
    const fu = dayIdx - (dayIdx % 5),
      b = QZHI[fu % 12];
    return "子午卯酉".includes(b) ? 0 : "寅申巳亥".includes(b) ? 1 : 2;
  }
  function qYuanMaoshan(n) {
    if (!Number.isFinite(n) || n < 1) throw new Error("茅山法需要 termDayIndex（交节当天=1）");
    return n <= 5 ? 0 : n <= 10 ? 1 : 2;
  }
  function qTermDay(ctx) {
    const a = ctx && ctx.solarTerm && ctx.solarTerm.startLocal,
      b = ctx && ctx.clock && ctx.clock.calculation;
    if (!a || !b) return null;
    const A = Date.UTC(a.y, a.m - 1, a.d),
      B = Date.UTC(b.y, b.m - 1, b.d);
    return Math.floor((B - A) / 86400000) + 1;
  }
  function qCellScore(c) {
    try {
      c.geju = [];
      if (typeof GEJU !== "undefined")
        GEJU.forEach(([a, b, n, t]) => {
          if (c.hs === a && c.earth === b) c.geju.push({ n, t });
        });
      if (typeof DOORTYPE !== "undefined" && "乙丙丁".includes(c.hs) && DOORTYPE[c.door] === "吉")
        c.geju.push({ n: "奇门吉格", t: "吉" });
      c.tags = c.tags || [];
      if (typeof DOORWX !== "undefined" && typeof PWX !== "undefined") {
        const dw = DOORWX[c.door],
          pw = PWX[c.p];
        if ((pw - dw + 5) % 5 === 2) c.tags.push({ n: "门迫", t: "凶" });
      }
      let sc =
        (typeof STAR_SC !== "undefined" ? STAR_SC[c.star] || 0 : 0) +
        (typeof DOOR_SC !== "undefined" ? DOOR_SC[c.door] || 0 : 0);
      c.geju.forEach((g) => (sc += g.t === "吉" ? 2 : -2));
      c.tags.forEach((g) => {
        if (g.n === "门迫" || g.n === "空亡") sc -= 1;
      });
      c.score = sc;
    } catch (_) {
      c.score = 0;
      c.geju = c.geju || [];
    }
    return c;
  }
  function qGeneric(input = {}, policy = {}) {
    const v = qValidate(input),
      p = qPolicy(policy),
      lon = v.boundarySolarLongitude == null ? v.solarLongitude : v.boundarySolarLongitude,
      k = Math.floor(lon / 15) % 24,
      term = QTERMS[k],
      yang = k >= 18 || k <= 5;
    const yuan =
        p.zhiRunMethod === "chaibu" ? qYuanChaibu(v.dayGanzhiIndex) : qYuanMaoshan(v.termDayIndex),
      ju = QJU[term][yuan],
      earth = {},
      ganPal = {};
    QSTEMS.forEach((g, i) => {
      const pal = qmod(ju - 1 + (yang ? i : -i), 9) + 1;
      earth[pal] = g;
      ganPal[g] = pal;
    });
    const xun = Math.floor(v.hourGanzhiIndex / 10),
      steps = v.hourGanzhiIndex % 10,
      dun = QLIUYI[xun],
      hourGZ = QJZ[v.hourGanzhiIndex],
      hg = hourGZ[0],
      ref = hg === "甲" ? dun : hg;
    let p0 = ganPal[dun],
      p0r = p0 === 5 ? 2 : p0,
      q = ganPal[ref];
    if (q === 5) q = 2;
    const doorAnchor = p.panStyle === "转盘" ? p0 : p0r;
    let rr = qmod(doorAnchor - 1 + (yang ? steps : -steps), 9) + 1;
    if (rr === 5) rr = 2;
    const heaven = {},
      stars = {},
      doors = {};
    const zfStar = QHOME_STAR[p0] || "禽",
      zsDoor = QHOME_DOOR[p0r] || "死";
    if (p.panStyle === "转盘") {
      const sh = qmod(qri(q) - qri(p0r), 8);
      QRING.forEach((home, i) => {
        const dst = QRING[qmod(i + sh, 8)];
        heaven[dst] = earth[home];
        stars[dst] = QSTAR_RING[i];
      });
      const sd = qmod(qri(rr) - qri(p0r), 8);
      QRING.forEach((home, i) => {
        doors[QRING[qmod(i + sd, 8)]] = QDOOR_RING[i];
      });
    } else {
      const start = q,
        fi = QSTEMS.indexOf(dun),
        fo = QSTEMS.slice(fi).concat(QSTEMS.slice(0, fi));
      fo.forEach((g, i) => {
        heaven[qmod(start - 1 + (yang ? i : -i), 9) + 1] = g;
      });
      const si = QSTAR_FLY.indexOf(zfStar),
        so = QSTAR_FLY.slice(si).concat(QSTAR_FLY.slice(0, si));
      so.forEach((st, i) => {
        stars[qmod(q - 1 + (yang ? i : -i), 9) + 1] = st;
      });
      const di = QDOOR_RING.indexOf(zsDoor),
        doo = QDOOR_RING.slice(di).concat(QDOOR_RING.slice(0, di)),
        startIdx = QFLY_PALS.indexOf(rr);
      doo.forEach((d, i) => {
        doors[QFLY_PALS[qmod(startIdx + (yang ? i : -i), 8)]] = d;
      });
      doors[5] = doors[2];
    }
    const gl = !yang && p.yinGodSystem === "gouque" ? QGODS_ALT : QGODS_STD,
      gods = {},
      go = yang ? QRING : QRING_CCW,
      gi = go.indexOf(q);
    gl.forEach((g, i) => (gods[go[qmod(gi + i, 8)]] = g));
    gods[5] = gods[2];
    const kongB = [qmod(xun * 10 + 10, 12), qmod(xun * 10 + 11, 12)],
      kongP = [...new Set(kongB.map((b) => QPALZ[b]))];
    const hb = (p.horseSource === "day" ? v.dayGanzhiIndex : v.hourGanzhiIndex) % 12,
      horseB = [2, 11, 8, 5][hb % 4],
      horseP = QPALZ[horseB];
    const cells = {};
    [1, 2, 3, 4, 6, 7, 8, 9].forEach((n) => {
      const extra =
        p.panStyle === "转盘" && stars[n] === "芮" ? { star: "禽", stem: earth[5] } : null;
      const c = {
        p: n,
        earth: earth[n],
        hs: heaven[n] || null,
        star: stars[n] || null,
        extra,
        door: doors[n] || null,
        god: gods[n] || null,
        tags: [],
        geju: [],
      };
      if (n === 2 && earth[5]) c.center = earth[5];
      qCellScore(c);
      if (kongP.includes(n)) {
        c.tags.push({ n: "空亡", t: "空" });
        c.score -= 1;
      }
      if (horseP === n) c.tags.push({ n: "驿马", t: "马" });
      if (n === q) c.tags.push({ n: "值符", t: "符" });
      if (n === rr) c.tags.push({ n: "值使", t: "使" });
      cells[n] = c;
    });
    cells[5] = { p: 5, earth: earth[5], center: true, tags: [], geju: [] };
    const ranked = [1, 2, 3, 4, 6, 7, 8, 9].sort(
      (a, b) => (cells[b].score || 0) - (cells[a].score || 0),
    );
    const fuyin =
      p.panStyle === "转盘"
        ? qmod(qri(q) - qri(p0r), 8) === 0
        : Object.entries(stars).every(([n, st]) => QHOME_STAR[+n] === st);
    const fanyin = p.panStyle === "转盘" ? qmod(qri(q) - qri(p0r), 8) === 4 : false;
    const legacy = {
      yang,
      ju,
      term,
      k,
      kNow: Math.floor(v.solarLongitude / 15) % 24,
      yuan,
      dun,
      p0,
      q,
      rr,
      steps,
      xun,
      zfStar,
      zsDoor,
      cells,
      earth,
      kongB,
      kongP,
      horseB,
      horseP,
      fuyin,
      fanyin,
      best: ranked.slice(0, 2),
      worst: ranked.slice(-2).reverse(),
      yuanName: ["上元", "中元", "下元"][yuan],
      hourGZ,
    };
    return {
      schema: "tianji.qimen/2.0",
      version: "2.0.0",
      build: BUILD,
      input: v,
      policy: p,
      calendar: {
        solarTerm: term,
        yinYang: yang ? "阳遁" : "阴遁",
        juNumber: ju,
        yuanName: legacy.yuanName,
        termDayIndex: v.termDayIndex,
      },
      duty: { chiefStar: zfStar, chiefStarPalace: q, chiefDoor: zsDoor, chiefDoorPalace: rr },
      markers: {
        emptyBranches: kongB,
        emptyPalaces: kongP,
        horseBranch: horseB,
        horsePalace: horseP,
        horseSource: p.horseSource,
      },
      flags: { fuyin, fanyin },
      legacy,
    };
  }
  function qCalc(input = {}, policy = {}) {
    const p = qPolicy(Object.assign({}, QPOL, policy, input.policy || {})),
      v = qValidate(input);
    if (
      p.panStyle === "转盘" &&
      p.zhiRunMethod === "chaibu" &&
      p.yinGodSystem === "gouque" &&
      p.horseSource === "hour" &&
      QB &&
      typeof QB.calculate === "function"
    ) {
      const out = qclone(QB.calculate(v));
      out.schema = "tianji.qimen/2.0";
      out.version = "2.0.0";
      out.build = BUILD;
      out.policy = p;
      return out;
    }
    return qGeneric(v, p);
  }
  function qFromTimeContext(ctx, input = {}) {
    if (!ctx || !ctx.astronomy) throw new Error("Qimen v112: TimeContext required");
    let bz = input.bazi || null;
    if (!bz && window.TianjiBazi && typeof TianjiBazi.calculate === "function")
      bz = TianjiBazi.calculate(ctx, { gender: input.gender || "M" });
    const leg = bz && bz.legacy;
    if (!leg) throw new Error("Qimen v112: Bazi indices unavailable");
    const pol = qPolicy(Object.assign({}, QPOL, input.policy || {})),
      td = pol.zhiRunMethod === "maoshan" ? qTermDay(ctx) : null;
    return qCalc(
      {
        solarLongitude: +ctx.astronomy.solarLongitude,
        dayGanzhiIndex: +leg.dayIdx,
        hourGanzhiIndex: +leg.hourIdx,
        termDayIndex: td,
      },
      pol,
    );
  }
  function qFromRuntime(R0, policy = {}) {
    const pol = qPolicy(Object.assign({}, QPOL, policy));
    let td = null;
    if (pol.zhiRunMethod === "maoshan" && window.TianjiTime && R0 && R0.t && R0.t.civ) {
      const ctx = TianjiTime.createContext(R0.t.civ, {
        location: { longitude: (R0.opt && R0.opt.lon) || 120 },
        trueSolarTime: { enabled: !!(R0.opt && R0.opt.solar) },
      });
      td = qTermDay(ctx);
    }
    return qCalc(
      {
        solarLongitude: R0.t.lon,
        dayGanzhiIndex: R0.bz.dayIdx,
        hourGanzhiIndex: R0.bz.hourIdx,
        termDayIndex: td,
      },
      pol,
    );
  }
  function qSetPolicy(p) {
    QPOL = qPolicy(Object.assign({}, QPOL, p || {}));
    return qclone(QPOL);
  }
  function qSelfTest() {
    const C = [];
    const add = (id, ok, detail = "") => C.push({ id, ok: !!ok, detail });
    try {
      const x = QB && QB.selfTest ? QB.selfTest() : { ok: true };
      add("v110.base", x.ok !== false);
    } catch (e) {
      add("v110.base", false, e.message);
    }
    const samples = [
      { solarLongitude: 270.1, dayGanzhiIndex: 0, hourGanzhiIndex: 0 },
      { solarLongitude: 90.1, dayGanzhiIndex: 52, hourGanzhiIndex: 29 },
      { solarLongitude: 180.2, dayGanzhiIndex: 57, hourGanzhiIndex: 11 },
    ];
    for (let i = 0; i < samples.length; i++) {
      try {
        const a = qCalc(samples[i], QPOL_DEFAULT),
          b = QB.calculate(samples[i]);
        add("default.compat." + i, JSON.stringify(a.legacy) === JSON.stringify(b.legacy));
      } catch (e) {
        add("default.compat." + i, false, e.message);
      }
    }
    try {
      const a = qCalc(
          { solarLongitude: 270.1, dayGanzhiIndex: 0, hourGanzhiIndex: 0, termDayIndex: 1 },
          { zhiRunMethod: "maoshan" },
        ),
        b = qCalc(
          { solarLongitude: 270.1, dayGanzhiIndex: 0, hourGanzhiIndex: 0, termDayIndex: 6 },
          { zhiRunMethod: "maoshan" },
        ),
        c = qCalc(
          { solarLongitude: 270.1, dayGanzhiIndex: 0, hourGanzhiIndex: 0, termDayIndex: 11 },
          { zhiRunMethod: "maoshan" },
        );
      add(
        "maoshan.yuan",
        a.calendar.yuanName === "上元" &&
          a.calendar.juNumber === 1 &&
          b.calendar.yuanName === "中元" &&
          b.calendar.juNumber === 7 &&
          c.calendar.yuanName === "下元" &&
          c.calendar.juNumber === 4,
      );
    } catch (e) {
      add("maoshan.yuan", false, e.message);
    }
    try {
      const f = qCalc(
        { solarLongitude: 270.1, dayGanzhiIndex: 0, hourGanzhiIndex: 0 },
        { panStyle: "飞盘" },
      ).legacy;
      add(
        "flying.golden",
        f.cells[1].hs === "戊" &&
          f.cells[2].hs === "己" &&
          f.cells[3].hs === "庚" &&
          f.cells[4].hs === "辛" &&
          f.cells[6].hs === "癸" &&
          f.cells[7].hs === "丁" &&
          f.cells[8].hs === "丙" &&
          f.cells[9].hs === "乙" &&
          f.cells[1].star === "蓬" &&
          f.cells[1].door === "休" &&
          f.cells[2].door === "生" &&
          f.cells[9].door === "开",
      );
    } catch (e) {
      add("flying.golden", false, e.message);
    }
    try {
      const g = qCalc(
        { solarLongitude: 90.1, dayGanzhiIndex: 52, hourGanzhiIndex: 29 },
        { yinGodSystem: "huwu", horseSource: "day" },
      ).legacy;
      add(
        "mingpan.golden",
        g.ju === 3 &&
          !g.yang &&
          g.yuanName === "中元" &&
          g.zfStar === "蓬" &&
          g.q === 7 &&
          g.zsDoor === "休" &&
          g.rr === 1 &&
          g.cells[1].hs === "戊" &&
          g.cells[7].star === "蓬" &&
          g.cells[1].door === "休" &&
          g.cells[3].god === "白虎",
      );
    } catch (e) {
      add("mingpan.golden", false, e.message);
    }
    try {
      const a = qCalc(
          { solarLongitude: 90.1, dayGanzhiIndex: 52, hourGanzhiIndex: 29 },
          { yinGodSystem: "gouque" },
        ).legacy,
        b = qCalc(
          { solarLongitude: 90.1, dayGanzhiIndex: 52, hourGanzhiIndex: 29 },
          { yinGodSystem: "huwu" },
        ).legacy;
      add(
        "god.policy",
        Object.values(a.cells).some((c) => c.god === "勾陈") &&
          Object.values(b.cells).some((c) => c.god === "白虎"),
      );
    } catch (e) {
      add("god.policy", false, e.message);
    }
    try {
      const a = qCalc(
          { solarLongitude: 90.1, dayGanzhiIndex: 52, hourGanzhiIndex: 29 },
          { horseSource: "hour" },
        ).legacy,
        b = qCalc(
          { solarLongitude: 90.1, dayGanzhiIndex: 52, hourGanzhiIndex: 29 },
          { horseSource: "day" },
        ).legacy;
      add("horse.policy", a.horseB !== b.horseB || a.horseP !== b.horseP);
    } catch (e) {
      add("horse.policy", false, e.message);
    }
    return { ok: C.every((x) => x.ok), checks: C };
  }
  const QTEST = qSelfTest();
  const QAPI = Object.freeze({
    version: "2.0.0",
    schema: "tianji.qimen/2.0",
    build: BUILD,
    defaultPolicy: () => qclone(QPOL_DEFAULT),
    getPolicy: () => qclone(QPOL),
    setPolicy: qSetPolicy,
    calculate: qCalc,
    fromTimeContext: qFromTimeContext,
    fromRuntime: qFromRuntime,
    selfTest: () => qclone(QTEST),
    base: QB,
    verifier: QV,
    manifest: () => ({
      module: "Tianji Qimen Core",
      version: "2.0.0",
      schema: "tianji.qimen/2.0",
      build: BUILD,
      baseline: "v111",
      policy: qclone(QPOL),
      selfTest: qclone(QTEST),
      implemented: [
        "时盘",
        "转盘",
        "飞盘",
        "拆补法",
        "茅山法",
        "阴遁八神口径切换",
        "马星日支/时支切换",
      ],
      remainingGaps: ["日盘", "月盘", "年盘", "完整格局知识层"],
    }),
  });
  window.TianjiQimen = QAPI;

  /* Qimen UI controls: preserve old default, recalc only Qimen pane when changed */
  const QRENDER = typeof renderQimen === "function" ? renderQimen : null;
  function qPolicyBar() {
    const p = QAPI.getPolicy();
    return `<div class="panel blk"><div class="tjq112-policy" id="tjq112Policy"><label>盘式<select data-q112="panStyle"><option${p.panStyle === "转盘" ? " selected" : ""}>转盘</option><option${p.panStyle === "飞盘" ? " selected" : ""}>飞盘</option></select></label><label>定局<select data-q112="zhiRunMethod"><option value="chaibu"${p.zhiRunMethod === "chaibu" ? " selected" : ""}>拆补法</option><option value="maoshan"${p.zhiRunMethod === "maoshan" ? " selected" : ""}>茅山法</option></select></label><label>阴遁八神<select data-q112="yinGodSystem"><option value="gouque"${p.yinGodSystem === "gouque" ? " selected" : ""}>勾陈 / 朱雀</option><option value="huwu"${p.yinGodSystem === "huwu" ? " selected" : ""}>白虎 / 玄武</option></select></label><label>马星<select data-q112="horseSource"><option value="hour"${p.horseSource === "hour" ? " selected" : ""}>按时支</option><option value="day"${p.horseSource === "day" ? " selected" : ""}>按日支</option></select></label><span class="tjmode">时盘 · ${p.panStyle} · ${p.zhiRunMethod === "chaibu" ? "拆补" : "茅山"}</span></div><p class="note" style="margin:0">默认保持 Tianji 原口径；所有差异均显式可切换，不再把门派规则藏在算法内部。日盘/月盘/年盘尚未在本版开启。</p></div>`;
  }
  if (QRENDER) {
    renderQimen = function (R0) {
      let RR = R0;
      try {
        const z = qFromRuntime(R0).legacy;
        RR = Object.assign({}, R0, { qm: z });
        try {
          if (typeof qimenPlus === "function") qimenPlus(z, RR);
        } catch (_) {}
      } catch (e) {
        console.warn("[v112 qimen render]", e);
      }
      let body = QRENDER(RR);
      body = body.replace(
        /此为时家转盘奇门·拆补法[^<]*/,
        "当前口径由上方“盘式 / 定局 / 八神 / 马星”控制；不同口径结果可出现结构性差异。",
      );
      return qPolicyBar() + body;
    };
  }
  document.addEventListener(
    "change",
    (e) => {
      const el = e.target && e.target.closest && e.target.closest("[data-q112]");
      if (!el) return;
      const key = el.dataset.q112;
      try {
        QAPI.setPolicy({ [key]: el.value });
        if (typeof R !== "undefined" && R) {
          R.qm = qFromRuntime(R).legacy;
          try {
            if (typeof qimenPlus === "function") qimenPlus(R.qm, R);
          } catch (_) {}
          const pane = document.getElementById("pane-qimen");
          if (pane) pane.innerHTML = renderQimen(R);
          try {
            if (typeof bindReadings === "function") bindReadings();
          } catch (_) {}
          try {
            if (typeof updateChips === "function") updateChips(R);
          } catch (_) {}
        }
      } catch (err) {
        console.error(err);
      }
    },
    true,
  );

  /* ---------- Ziwei timeline v2: snapshots and autoplay intentionally removed ---------- */
  try {
    delete window.TianjiZiweiSnapshotAB;
  } catch (_) {
    window.TianjiZiweiSnapshotAB = undefined;
  }
  try {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i);
      if (k && k.startsWith("tianji.ziwei.v109.ab.")) localStorage.removeItem(k);
    }
  } catch (_) {}
  const ZB = window.TianjiZiwei;
  const ZRENDER = typeof renderZiwei === "function" ? renderZiwei : null,
    ZBIND = typeof bindZiwei === "function" ? bindZiwei : null;
  const ZS = { R: null, chart: null, key: "", target: null, unit: "day", slider: null };
  const zpad = (n) => String(n).padStart(2, "0");
  function zNow() {
    try {
      const n = nowBJ();
      return `${n.y}-${zpad(n.m)}-${zpad(n.d)} ${zpad(n.h)}:${zpad(n.mi)}`;
    } catch (_) {
      const d = new Date();
      return `${d.getFullYear()}-${zpad(d.getMonth() + 1)}-${zpad(d.getDate())} ${zpad(d.getHours())}:${zpad(d.getMinutes())}`;
    }
  }
  function zNorm(s) {
    s = String(s || "")
      .trim()
      .replace("T", " ");
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) s += " 12:00";
    return s;
  }
  function zInput(s) {
    return zNorm(s).replace(" ", "T").slice(0, 16);
  }
  function zBirth(R0) {
    if (!R0 || !R0.lunar || !R0.bz || !R0.bz.pill || !R0.bz.pill[3])
      throw new Error("紫微人物资料不完整");
    return {
      lunar: {
        year: +R0.lunar.year,
        month: +R0.lunar.month,
        day: +R0.lunar.day,
        isLeap: !!R0.lunar.isLeap,
      },
      hourBranchIndex: +R0.bz.pill[3].b,
      gender: (R0.opt && R0.opt.gender) || "M",
    };
  }
  window.TianjiZiweiInput = Object.freeze({ fromResult: zBirth });
  function zChart() {
    const b = zBirth(ZS.R),
      k = [
        b.lunar.year,
        b.lunar.month,
        b.lunar.day,
        b.lunar.isLeap ? 1 : 0,
        b.hourBranchIndex,
        b.gender,
      ].join("|");
    if (!ZS.chart || ZS.key !== k) {
      ZS.chart = ZB.calculate(b);
      ZS.key = k;
    }
    return ZS.chart;
  }
  function zUnitLabel(u) {
    return { hour: "时", day: "日", month: "月", year: "年", decadal: "大限" }[u] || u;
  }
  function zCardData(n) {
    return [
      [
        "majorCycle",
        n.majorCycle && n.majorCycle.type === "childhood" ? "童限" : "大限",
        (n.majorCycle && n.majorCycle.name) || "—",
        n.majorCycle && n.majorCycle.range ? n.majorCycle.range.join("–") + "岁" : "",
      ],
      [
        "minorPeriod",
        "小限",
        (n.minorPeriod && n.minorPeriod.name) || "—",
        (n.minorPeriod && n.minorPeriod.branch) || "",
      ],
      [
        "yearly",
        "流年",
        (n.yearly && n.yearly.ganzhi) || "—",
        n.yearly && n.yearly.lifePalace ? "命宫 " + n.yearly.lifePalace : "",
      ],
      [
        "monthly",
        "流月",
        (n.monthly && n.monthly.ganzhi) || "—",
        n.monthly && n.monthly.lifePalace ? "命宫 " + n.monthly.lifePalace : "",
      ],
      [
        "daily",
        "流日",
        (n.daily && n.daily.ganzhi) || "—",
        n.daily && n.daily.lifePalace ? "命宫 " + n.daily.lifePalace : "",
      ],
      [
        "hourly",
        "流时",
        (n.hourly && n.hourly.ganzhi) || "—",
        n.hourly && n.hourly.lifePalace ? "命宫 " + n.hourly.lifePalace : "",
      ],
    ];
  }
  function zBranchIndex(b) {
    try {
      return ZHI.indexOf(b);
    } catch (_) {
      return -1;
    }
  }
  function zClearMarks() {
    const g = document.getElementById("zgrid");
    if (!g) return;
    g.querySelectorAll(".v112-flowmarks").forEach((x) => x.remove());
    g.querySelectorAll(".zc.v112-hit").forEach((x) => x.classList.remove("v112-hit"));
  }
  function zMark(branch, cls, label) {
    const bi = zBranchIndex(branch);
    if (bi < 0) return;
    const g = document.getElementById("zgrid"),
      cell = g && g.querySelector(`.zc[data-b="${bi}"]`);
    if (!cell) return;
    cell.classList.add("v112-hit");
    let box = cell.querySelector(".v112-flowmarks");
    if (!box) {
      box = document.createElement("div");
      box.className = "v112-flowmarks";
      cell.appendChild(box);
    }
    const m = document.createElement("span");
    m.className = "v112-flowmark " + cls;
    m.textContent = label;
    box.appendChild(m);
  }
  function zMarks(n) {
    zClearMarks();
    if (n.majorCycle) zMark(n.majorCycle.branch || n.majorCycle.earthlyBranch, "major", "大");
    if (n.minorPeriod) zMark(n.minorPeriod.branch, "minor", "小");
    if (n.yearly) zMark(n.yearly.lifePalace, "year", "年");
    if (n.monthly) zMark(n.monthly.lifePalace, "month", "月");
    if (n.daily) zMark(n.daily.lifePalace, "day", "日");
    if (n.hourly) zMark(n.hourly.lifePalace, "hour", "时");
  }
  function zSlider(chart, n) {
    if (ZS.unit === "decadal") {
      const list = ZB.decadalTimeline(chart),
        age = (n.age && n.age.nominalAge) || 1;
      let ci = list.findIndex(
        (x) => n.majorCycle && n.majorCycle.range && x.ageRange[0] === n.majorCycle.range[0],
      );
      if (ci < 0) ci = 0;
      return {
        items: list.map((x) => ({
          target: ZB.shiftTarget(ZS.target, "year", x.ageRange[0] - age),
          label: `${x.ageRange[0]}–${x.ageRange[1]}`,
        })),
        center: ci,
      };
    }
    const w = ZB.timelineWindow(chart, ZS.target, { unit: ZS.unit, before: 4, after: 4 });
    return {
      items: w.items.map((x) => ({
        target: x.target,
        label:
          ZS.unit === "hour"
            ? x.target.slice(11, 16)
            : ZS.unit === "day"
              ? x.target.slice(5, 10)
              : ZS.unit === "month"
                ? x.target.slice(0, 7)
                : x.target.slice(0, 4),
      })),
      center: w.centerIndex,
    };
  }
  function zRender() {
    if (!ZS.R || !ZB || typeof ZB.timelineAt !== "function") return;
    const chart = zChart(),
      n = ZB.timelineAt(chart, ZS.target),
      prev = ZB.timelineNavigate(chart, ZS.target, ZS.unit, -1),
      diff = ZB.timelineDiff(prev, n),
      changed = diff.changedScopes || [];
    const cards = document.getElementById("tjz112Cards");
    if (cards)
      cards.innerHTML = zCardData(n)
        .map(
          ([k, l, v, sub]) =>
            `<div class="tjz112-card${changed.includes(k) ? " changed" : ""}"><small>${l}</small><b>${v}</b><em>${sub}</em></div>`,
        )
        .join("");
    const inp = document.getElementById("tjz112Target");
    if (inp && document.activeElement !== inp) inp.value = zInput(n.target.text);
    const cursor = document.getElementById("tjz112Cursor");
    if (cursor) cursor.textContent = n.target.text;
    const ch = document.getElementById("tjz112Change");
    if (ch) {
      const names = {
        majorCycle: "大限",
        minorPeriod: "小限",
        yearly: "流年",
        monthly: "流月",
        daily: "流日",
        hourly: "流时",
      };
      ch.innerHTML = changed.length
        ? `相对上一${zUnitLabel(ZS.unit)}：<b>${changed.map((x) => names[x] || x).join(" · ")}</b>`
        : `相对上一${zUnitLabel(ZS.unit)}：无层级变化`;
    }
    const pr = document.getElementById("tjz112Prev"),
      nx = document.getElementById("tjz112Next");
    if (pr) pr.textContent = "← 上一" + zUnitLabel(ZS.unit);
    if (nx) nx.textContent = "下一" + zUnitLabel(ZS.unit) + " →";
    zMarks(n);
    ZS.slider = zSlider(chart, n);
    const range = document.getElementById("tjz112Range"),
      ticks = document.getElementById("tjz112Ticks");
    if (range) {
      range.min = 0;
      range.max = ZS.slider.items.length - 1;
      range.value = ZS.slider.center;
    }
    if (ticks) {
      ticks.classList.toggle("decadal", ZS.unit === "decadal");
      ticks.innerHTML = ZS.slider.items
        .map(
          (x, i) =>
            `<button type="button" class="tjz112-tick${i === ZS.slider.center ? " center" : ""}" data-z112="${i}" title="${x.target}">${x.label}</button>`,
        )
        .join("");
    }
    document
      .querySelectorAll("[data-z112-unit]")
      .forEach((b) => b.classList.toggle("on", b.dataset.z112Unit === ZS.unit));
  }
  function zStep(d) {
    ZS.target = ZB.timelineNavigate(zChart(), ZS.target, ZS.unit, d).target.text;
    zRender();
  }
  function zPanel() {
    return `<section class="panel blk tjz112" id="tjz112Panel"><div class="tjz112-head"><div><h3 class="sec">运限时间轴</h3><p>用于连续查看大限、小限、流年、流月、流日与流时的迁移。A/B 快照与自动播放已移除，保留实际推演所需的稳定交互。</p></div><div class="tjz112-date"><button class="gbtn sm" id="tjz112Now" type="button">此刻</button><input id="tjz112Target" type="datetime-local" step="60"></div></div><div class="tjz112-tools">${["hour", "day", "month", "year", "decadal"].map((u) => `<button type="button" class="gbtn sm tjz112-unit" data-z112-unit="${u}">${zUnitLabel(u)}</button>`).join("")}<button class="gbtn sm" id="tjz112Prev" type="button">← 上一${zUnitLabel(ZS.unit)}</button><button class="gbtn sm" id="tjz112Next" type="button">下一${zUnitLabel(ZS.unit)} →</button></div><div class="tjz112-cards" id="tjz112Cards"></div><div class="tjz112-track"><input type="range" id="tjz112Range" min="0" max="8" value="4" step="1"><div class="tjz112-ticks" id="tjz112Ticks"></div><div class="tjz112-foot"><span id="tjz112Change"></span><b id="tjz112Cursor"></b></div></div></section>`;
  }
  if (ZRENDER) {
    renderZiwei = function (R0) {
      ZS.R = R0;
      const base = ZRENDER(R0),
        marker = '<div class="panel blk"><div class="yrctl">';
      return base.includes(marker) ? base.replace(marker, zPanel() + marker) : base + zPanel();
    };
  }
  function zBind() {
    const root = document.getElementById("tjz112Panel");
    if (!root || root.dataset.bound === "1") return;
    root.dataset.bound = "1";
    const inp = document.getElementById("tjz112Target");
    if (inp)
      inp.onchange = () => {
        ZS.target = zNorm(inp.value);
        zRender();
      };
    const nw = document.getElementById("tjz112Now");
    if (nw)
      nw.onclick = () => {
        ZS.target = zNow();
        zRender();
      };
    const pr = document.getElementById("tjz112Prev"),
      nx = document.getElementById("tjz112Next");
    if (pr) pr.onclick = () => zStep(-1);
    if (nx) nx.onclick = () => zStep(1);
    document.querySelectorAll("[data-z112-unit]").forEach(
      (b) =>
        (b.onclick = () => {
          ZS.unit = b.dataset.z112Unit;
          zRender();
        }),
    );
    const rg = document.getElementById("tjz112Range");
    if (rg)
      rg.onchange = () => {
        const x = ZS.slider && ZS.slider.items[+rg.value];
        if (x) {
          ZS.target = x.target;
          zRender();
        }
      };
    const ticks = document.getElementById("tjz112Ticks");
    if (ticks)
      ticks.onclick = (e) => {
        const b = e.target.closest("[data-z112]");
        if (!b) return;
        const x = ZS.slider && ZS.slider.items[+b.dataset.z112];
        if (x) {
          ZS.target = x.target;
          zRender();
        }
      };
    zRender();
  }
  if (ZBIND) {
    bindZiwei = function () {
      ZBIND();
      if (!ZS.target) ZS.target = zNow();
      zBind();
    };
  }
  const ZTEST = (() => {
    const c = [];
    const add = (id, ok) => c.push({ id, ok: !!ok });
    try {
      const birth = {
          lunar: { year: 2000, month: 7, day: 17, isLeap: false },
          hourBranchIndex: 2,
          gender: "F",
        },
        chart = ZB.calculate(birth),
        n = ZB.timelineAt(chart, "2023-08-19 03:12", { dayDivide: "current" });
      add(
        "timeline.core",
        n.yearly.ganzhi === "癸卯" &&
          n.monthly.ganzhi === "庚申" &&
          n.daily.ganzhi === "己酉" &&
          n.hourly.ganzhi === "丙寅",
      );
      const w = ZB.timelineWindow(chart, "2023-08-19 03:12", { unit: "day", before: 4, after: 4 });
      add("window.9", w.items.length === 9 && w.centerIndex === 4);
      add("snapshot.removed", !window.TianjiZiweiSnapshotAB);
    } catch (e) {
      c.push({ id: "timeline.runtime", ok: false, error: e.message });
    }
    return { ok: c.every((x) => x.ok), checks: c };
  })();
  window.TianjiZiweiTimelineUI = Object.freeze({
    version: "2.0.0",
    build: BUILD,
    getState: () => ({ target: ZS.target, unit: ZS.unit }),
    setTarget: (t) => {
      ZS.target = zNorm(t);
      zRender();
    },
    setUnit: (u) => {
      ZS.unit = u;
      zRender();
    },
    next: () => zStep(1),
    prev: () => zStep(-1),
    render: zRender,
    selfTest: () => qclone(ZTEST),
  });

  /* System/registry */
  try {
    if (window.TianjiCore) {
      TianjiCore.registerSource({
        id: "tianji-v112-qimen-doctrine",
        type: "internal",
        title: "Tianji Qimen Doctrine/Style Layer",
        version: "2.0.0",
        baseline: "v111",
      });
      TianjiCore.registerEngine(
        {
          id: "qimen.core.v2",
          system: "qimen",
          name: "Tianji Qimen Core 2.0",
          version: "2.0.0",
          source: "tianji-v112-qimen-doctrine",
          doctrine: "时盘 · 转盘/飞盘 · 拆补/茅山 · 显式八神/马星口径",
          status: QTEST.ok ? "active" : "degraded",
        },
        (input) => qCalc(input || {}, (input && input.policy) || {}),
      );
    }
  } catch (e) {
    console.warn("[v112 registry]", e);
  }
  try {
    const a =
      document.getElementById("tjQimenVerifyBadge") || document.getElementById("buildVersion");
    let b = document.getElementById("tjQimenV2Badge");
    if (!b && a) {
      b = document.createElement("span");
      b.id = "tjQimenV2Badge";
      a.insertAdjacentElement("afterend", b);
    }
    if (b) {
      b.textContent = "QimenCore 2.0 · 盘式口径";
      b.classList.toggle("warn", !QTEST.ok);
      b.title = "v112：转盘/飞盘、拆补/茅山、八神与马星口径";
    }
    let z = document.getElementById("tjZiweiTimelineV2Badge");
    const anchor =
      document.getElementById("tjQimenV2Badge") || document.getElementById("buildVersion");
    if (!z && anchor) {
      z = document.createElement("span");
      z.id = "tjZiweiTimelineV2Badge";
      anchor.insertAdjacentElement("afterend", z);
    }
    if (z) {
      z.textContent = "ZiweiTimeline 2.0 · 精简稳定版";
      z.classList.toggle("warn", !ZTEST.ok);
    }
  } catch (_) {}
  const prev = window.TianjiSystem || {},
    oldRoad = window.TianjiRoadmap || {},
    route = (oldRoad.engineRoute || []).map((x) =>
      x.id === "qimen"
        ? Object.assign({}, x, {
            state: "core+verify+doctrine",
            versions: "v110–v112",
            next: "日/月/年盘 + 格局知识层",
          })
        : x,
    );
  const road = Object.freeze(
    Object.assign({}, qclone(oldRoad), {
      engineRoute: route,
      nextMainline: [
        "奇门日盘/月盘/年盘",
        "大六壬核心",
        "六爻/梅花核心",
        "择日核心",
        "Evidence",
        "AI",
        "MCP",
      ],
    }),
  );
  window.TianjiRoadmap = road;
  window.TianjiSystem = Object.freeze({
    version: "v112",
    build: BUILD,
    baseline: "v84",
    core: window.TianjiCore || prev.core || null,
    time: window.TianjiTime || prev.time || null,
    verify: window.TianjiVerifier || prev.verify || null,
    bazi: window.TianjiBazi || prev.bazi || null,
    baziVerify: window.TianjiBaziVerifier || prev.baziVerify || null,
    ziwei: window.TianjiZiwei || prev.ziwei || null,
    ziweiTimelineUI: window.TianjiZiweiTimelineUI,
    ziweiSnapshotAB: null,
    ziweiVerify: window.TianjiZiweiVerifier || prev.ziweiVerify || null,
    qimen: QAPI,
    qimenVerify: window.TianjiQimenVerifier || prev.qimenVerify || null,
    roadmap: road,
    manifest: () => ({
      product: "天机盘",
      version: "v112",
      build: BUILD,
      qimen: QAPI.manifest(),
      ziweiTimelineUI: { version: "2.0.0", selfTest: ZTEST, snapshotAB: false, autoplay: false },
      roadmap: qclone(road),
    }),
  });
  try {
    const bv = document.getElementById("buildVersion");
  } catch (_) {}
})();
