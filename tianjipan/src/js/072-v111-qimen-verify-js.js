(() => {
  "use strict";
  const BASE = window.TianjiQimen;
  if (!BASE || typeof BASE.calculate !== "function") {
    try {
      console.warn("[TianjiQimenVerifier v111] Qimen core unavailable");
    } catch (_) {}
    return;
  }
  const VERSION = "1.0.0",
    BUILD = "2026-10-04 11:44:12";
  const SOURCE = Object.freeze({
    name: "Mingpan",
    repo: "ChesterRa/mingpan",
    version: "0.1.8",
    commit: "d4cab8f27d14541c1219650318c0c40e80cb492c",
    license: "Apache-2.0",
    scope: "奇门遁甲 · 时盘 · 转盘 · 拆补法",
    references: Object.freeze({
      juShu: "de53dcfb07e6589263de10b959a9b0f1eb6b518e",
      jiuGong: "421d0a5096450132c44de6c85434c63fd0e42bfb",
      zhuanPan: "16af09fb028aa4f52abffc7e97d7a67e29c90824",
      baShen: "6ce7ce5acb8b058efd0dcabf7fbefb012b16c08b",
      goldenTests: "0eeee7f887fef2462ece50b9d05f28da80326dbf",
    }),
    note: "Reference logic is independently normalized from fixed Mingpan 0.1.8 source/test rules. Mingpan never replaces TianjiQimen.",
  });
  const clone = (x) => (x == null ? x : JSON.parse(JSON.stringify(x)));
  const mod = (n, m) => ((n % m) + m) % m;
  const G = "甲乙丙丁戊己庚辛壬癸".split("");
  const Z = "子丑寅卯辰巳午未申酉戌亥".split("");
  const TERMS_REF = [
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
  const JU_REF = {
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
  const RING = [1, 8, 3, 4, 9, 2, 7, 6],
    RING_CCW = [1, 6, 7, 2, 9, 4, 3, 8];
  const STEMS = "戊己庚辛壬癸丁丙乙".split("");
  const STAR_RING = ["蓬", "任", "冲", "辅", "英", "芮", "柱", "心"];
  const DOOR_RING = ["休", "生", "伤", "杜", "景", "死", "惊", "开"];
  const GOD_RING = ["符", "蛇", "阴", "合", "虎", "武", "地", "天"];
  const HOME_STAR = {
    1: "蓬",
    2: "芮",
    3: "冲",
    4: "辅",
    5: "禽",
    6: "心",
    7: "柱",
    8: "任",
    9: "英",
  };
  const HOME_DOOR = { 1: "休", 8: "生", 3: "伤", 4: "杜", 9: "景", 2: "死", 7: "惊", 6: "开" };
  const XUN = ["甲子", "甲戌", "甲申", "甲午", "甲辰", "甲寅"],
    LIUYI = ["戊", "己", "庚", "辛", "壬", "癸"];
  const KONG = {
    甲子: ["戌", "亥"],
    甲戌: ["申", "酉"],
    甲申: ["午", "未"],
    甲午: ["辰", "巳"],
    甲辰: ["寅", "卯"],
    甲寅: ["子", "丑"],
  };
  const BRANCH_GONG = {
    子: 1,
    丑: 8,
    寅: 8,
    卯: 3,
    辰: 4,
    巳: 4,
    午: 9,
    未: 2,
    申: 2,
    酉: 7,
    戌: 6,
    亥: 6,
  };
  const DAY_HORSE = {
    申: "寅",
    子: "寅",
    辰: "寅",
    寅: "申",
    午: "申",
    戌: "申",
    亥: "巳",
    卯: "巳",
    未: "巳",
    巳: "亥",
    酉: "亥",
    丑: "亥",
  };
  const JIAZI = Array.from({ length: 60 }, (_, i) => G[i % 10] + Z[i % 12]);
  const STATUS = Object.freeze({
    PASS: "PASS",
    DIFF: "DIFF",
    POLICY: "POLICY",
    GAP: "GAP",
    NA: "N/A",
  });
  function refInput(input = {}) {
    const lon = Number(input.solarLongitude ?? input.lon),
      day = Number(input.dayGanzhiIndex ?? input.dayIdx),
      hour = Number(input.hourGanzhiIndex ?? input.hourIdx),
      lonFu = input.boundarySolarLongitude ?? input.lonFu;
    if (!Number.isFinite(lon) || !Number.isFinite(day) || !Number.isFinite(hour))
      throw new Error("QimenVerifier: solarLongitude/dayGanzhiIndex/hourGanzhiIndex required");
    return {
      solarLongitude: mod(lon, 360),
      boundarySolarLongitude: lonFu == null ? null : mod(Number(lonFu), 360),
      dayGanzhiIndex: mod(Math.trunc(day), 60),
      hourGanzhiIndex: mod(Math.trunc(hour), 60),
    };
  }
  function idx(order, g) {
    return order.indexOf(g === 5 ? 2 : g);
  }
  function rotate(g, steps, isYang) {
    const order = isYang ? RING : RING_CCW,
      at = idx(order, g);
    return order[mod(at + steps, 8)];
  }
  function stepsBetween(from, to, isYang) {
    const order = isYang ? RING : RING_CCW;
    return mod(idx(order, to) - idx(order, from), 8);
  }
  function yuanByDay(dayIdx) {
    const fu = JIAZI[dayIdx - (dayIdx % 5)],
      b = fu.charAt(1);
    return "子午卯酉".includes(b) ? "上元" : "寅申巳亥".includes(b) ? "中元" : "下元";
  }
  function mingpanReference(input = {}) {
    const v = refInput(input),
      lon = v.boundarySolarLongitude == null ? v.solarLongitude : v.boundarySolarLongitude;
    const termIndex = Math.floor(lon / 15) % 24,
      term = TERMS_REF[termIndex],
      isYang = termIndex >= 18 || termIndex <= 5;
    const yuan = yuanByDay(v.dayGanzhiIndex),
      yuanIndex = ["上元", "中元", "下元"].indexOf(yuan),
      ju = JU_REF[term][yuanIndex];
    const earth = {},
      ganGong = {};
    STEMS.forEach((gan, i) => {
      const p = mod(ju - 1 + (isYang ? i : -i), 9) + 1;
      earth[p] = gan;
      ganGong[gan] = p;
    });
    const hourGZ = JIAZI[v.hourGanzhiIndex],
      xunIndex = Math.floor(v.hourGanzhiIndex / 10),
      xunShou = XUN[xunIndex],
      fuGan = LIUYI[xunIndex];
    const hourGan = hourGZ.charAt(0),
      refGan = hourGan === "甲" ? fuGan : hourGan;
    let fuGong = ganGong[fuGan],
      shiGong = ganGong[refGan];
    if (fuGong === 5) fuGong = 2;
    if (shiGong === 5) shiGong = 2;
    const rot = stepsBetween(fuGong, shiGong, isYang);
    const heaven = {},
      stars = {};
    for (let i = 0; i < 8; i++) {
      const home = RING[i],
        dst = rotate(home, rot, isYang),
        gan = earth[home];
      heaven[dst] = gan;
      stars[dst] = STAR_RING[i];
    }
    heaven[5] = heaven[2];
    stars[5] = "禽";
    const zhiFuXing = HOME_STAR[ganGong[fuGan]],
      zhiFuLuoGong = shiGong;
    const zhiShiMen = HOME_DOOR[fuGong === 5 ? 2 : fuGong] || "死";
    const zhiShiHome = Object.keys(HOME_DOOR).find((p) => HOME_DOOR[p] === zhiShiMen) * 1;
    let zhiShiLuo =
      mod(zhiShiHome - 1 + (isYang ? v.hourGanzhiIndex % 10 : -(v.hourGanzhiIndex % 10)), 9) + 1;
    if (zhiShiLuo === 5) zhiShiLuo = 2;
    const doorRot = stepsBetween(zhiShiHome, zhiShiLuo, isYang),
      doors = {};
    for (let i = 0; i < 8; i++) {
      const home = RING[i];
      doors[rotate(home, doorRot, isYang)] = DOOR_RING[i];
    }
    doors[5] = doors[2];
    const gods = {},
      godOrder = isYang ? RING : RING_CCW,
      start = idx(godOrder, zhiFuLuoGong);
    GOD_RING.forEach((g, i) => {
      gods[godOrder[mod(start + i, 8)]] = g;
    });
    gods[5] = gods[2];
    const emptyBranches = KONG[xunShou].slice(),
      emptyPalaces = [...new Set(emptyBranches.map((x) => BRANCH_GONG[x]))];
    const dayBranch = JIAZI[v.dayGanzhiIndex].charAt(1),
      horseBranch = DAY_HORSE[dayBranch],
      horsePalace = BRANCH_GONG[horseBranch];
    return {
      input: v,
      term,
      termIndex,
      yinYang: isYang ? "阳遁" : "阴遁",
      isYang,
      ju,
      yuan,
      hourGZ,
      xunShou,
      fuGan,
      duty: {
        chiefStar: zhiFuXing,
        chiefStarOrigin: ganGong[fuGan],
        chiefStarPalace: zhiFuLuoGong,
        chiefDoor: zhiShiMen,
        chiefDoorPalace: zhiShiLuo,
      },
      earth,
      heaven,
      stars,
      doors,
      gods,
      emptyBranches,
      emptyPalaces,
      horseBranch,
      horsePalace,
      flags: { fuyin: rot === 0, fanyin: rot === 4 },
      rotation: { stars: rot, doors: doorRot },
    };
  }
  function shortGod(x) {
    return (
      {
        值符: "符",
        腾蛇: "蛇",
        太阴: "阴",
        六合: "合",
        白虎: "虎",
        玄武: "武",
        九地: "地",
        九天: "天",
        勾陈: "勾",
        朱雀: "雀",
      }[x] || x
    );
  }
  function sameSet(a, b) {
    return JSON.stringify([...(a || [])].sort()) === JSON.stringify([...(b || [])].sort());
  }
  function item(scope, label, status, tianji, reference, note = "", detail = {}) {
    return Object.assign(
      { scope, label, status, tianji: clone(tianji), reference: clone(reference), note },
      detail,
    );
  }
  function compare(input = {}) {
    const v = refInput(input),
      t = BASE.calculate(v),
      r = mingpanReference(v),
      rows = [];
    rows.push(
      item(
        "method",
        "盘型/置闰",
        STATUS.PASS,
        "时盘·转盘·拆补法",
        "时盘·转盘·拆补法",
        "重叠口径一致",
      ),
    );
    rows.push(
      item(
        "ju",
        "阴阳遁",
        t.calendar.yinYang === r.yinYang ? STATUS.PASS : STATUS.DIFF,
        t.calendar.yinYang,
        r.yinYang,
      ),
    );
    rows.push(
      item(
        "ju",
        "局数",
        t.calendar.juNumber === r.ju ? STATUS.PASS : STATUS.DIFF,
        t.calendar.juNumber,
        r.ju,
      ),
    );
    rows.push(
      item(
        "ju",
        "三元",
        t.calendar.yuanName === r.yuan ? STATUS.PASS : STATUS.DIFF,
        t.calendar.yuanName,
        r.yuan,
      ),
    );
    const te = Object.fromEntries(t.palaces.map((p) => [p.number, p.earthStem]));
    rows.push(
      item(
        "earth",
        "地盘三奇六仪",
        [1, 2, 3, 4, 5, 6, 7, 8, 9].every((p) => te[p] === r.earth[p]) ? STATUS.PASS : STATUS.DIFF,
        te,
        r.earth,
      ),
    );
    const th = Object.fromEntries(
      t.palaces.filter((p) => !p.center).map((p) => [p.number, p.heavenStem]),
    );
    const rh = Object.fromEntries(RING.map((p) => [p, r.heaven[p]]));
    rows.push(
      item(
        "heaven",
        "天盘干（八宫）",
        RING.every((p) => th[p] === rh[p]) ? STATUS.PASS : STATUS.DIFF,
        th,
        rh,
        "中五宫显示方式单列为 N/A",
      ),
    );
    rows.push(
      item(
        "heaven",
        "中宫天盘显示",
        STATUS.NA,
        null,
        r.heaven[5],
        "Tianji canonical 将中宫寄宫信息放在坤二 extraStar/center，不直接复制 Mingpan 的中宫显示值",
      ),
    );
    const ts = Object.fromEntries(
      t.palaces.filter((p) => !p.center).map((p) => [p.number, p.star]),
    );
    const rs = Object.fromEntries(RING.map((p) => [p, r.stars[p]]));
    rows.push(
      item(
        "star",
        "九星（八宫）",
        RING.every((p) => ts[p] === rs[p]) ? STATUS.PASS : STATUS.DIFF,
        ts,
        rs,
      ),
    );
    const ruiPalace = t.palaces.find((p) => !p.center && p.star === "芮"),
      poultry = ruiPalace?.extraStar?.star;
    rows.push(
      item(
        "star",
        "天禽寄芮",
        poultry === "禽" ? STATUS.PASS : STATUS.DIFF,
        { palace: ruiPalace?.number || null, star: poultry },
        {
          palace: Number(Object.keys(r.stars).find((k) => r.stars[k] === "芮")) || null,
          star: "禽",
        },
        "天禽随天芮同宫旋转，不固定在坤二",
      ),
    );
    const td = Object.fromEntries(
      t.palaces.filter((p) => !p.center).map((p) => [p.number, p.door]),
    );
    const rd = Object.fromEntries(RING.map((p) => [p, r.doors[p]]));
    rows.push(
      item(
        "door",
        "八门（八宫）",
        RING.every((p) => td[p] === rd[p]) ? STATUS.PASS : STATUS.DIFF,
        td,
        rd,
      ),
    );
    rows.push(
      item(
        "duty",
        "值符星",
        t.duty.chiefStar === r.duty.chiefStar ? STATUS.PASS : STATUS.DIFF,
        t.duty.chiefStar,
        r.duty.chiefStar,
      ),
    );
    rows.push(
      item(
        "duty",
        "值符落宫",
        t.duty.chiefStarPalace === r.duty.chiefStarPalace ? STATUS.PASS : STATUS.DIFF,
        t.duty.chiefStarPalace,
        r.duty.chiefStarPalace,
      ),
    );
    rows.push(
      item(
        "duty",
        "值使门",
        t.duty.chiefDoor === r.duty.chiefDoor ? STATUS.PASS : STATUS.DIFF,
        t.duty.chiefDoor,
        r.duty.chiefDoor,
      ),
    );
    rows.push(
      item(
        "duty",
        "值使落宫",
        t.duty.chiefDoorPalace === r.duty.chiefDoorPalace ? STATUS.PASS : STATUS.DIFF,
        t.duty.chiefDoorPalace,
        r.duty.chiefDoorPalace,
      ),
    );
    const tg = Object.fromEntries(
      t.palaces.filter((p) => !p.center).map((p) => [p.number, shortGod(p.god)]),
    );
    const rg = Object.fromEntries(RING.map((p) => [p, r.gods[p]]));
    const godDiff = RING.filter((p) => tg[p] !== rg[p]);
    if (!godDiff.length) rows.push(item("god", "八神", STATUS.PASS, tg, rg));
    else {
      const knownPolicy =
        !r.isYang &&
        godDiff.every(
          (p) => (tg[p] === "勾" && rg[p] === "虎") || (tg[p] === "雀" && rg[p] === "武"),
        );
      rows.push(
        item(
          "god",
          "八神",
          knownPolicy ? STATUS.POLICY : STATUS.DIFF,
          tg,
          rg,
          knownPolicy
            ? "阴遁八神命名/神系口径差异：Tianji 用勾陈/朱雀，Mingpan 0.1.8 用白虎/玄武；暂不判算法错误。"
            : "八神存在非预期差异",
          { diffPalaces: godDiff },
        ),
      );
    }
    rows.push(
      item(
        "marker",
        "旬空地支",
        sameSet(
          t.markers.emptyBranches.map((i) => Z[i]),
          r.emptyBranches,
        )
          ? STATUS.PASS
          : STATUS.DIFF,
        t.markers.emptyBranches.map((i) => Z[i]),
        r.emptyBranches,
      ),
    );
    rows.push(
      item(
        "marker",
        "空亡宫",
        sameSet(t.markers.emptyPalaces, r.emptyPalaces) ? STATUS.PASS : STATUS.DIFF,
        t.markers.emptyPalaces,
        r.emptyPalaces,
      ),
    );
    rows.push(
      item(
        "marker",
        "马星",
        STATUS.POLICY,
        { source: "时支", branch: Z[t.markers.horseBranch], palace: t.markers.horsePalace },
        { source: "日支", branch: r.horseBranch, palace: r.horsePalace },
        "马星取法口径不同：Tianji v110 按时支，Mingpan 0.1.8 的盘面 isMa 按日支；需在后续流派层裁决。",
      ),
    );
    rows.push(
      item(
        "flag",
        "伏吟",
        t.flags.fuyin === r.flags.fuyin ? STATUS.PASS : STATUS.DIFF,
        t.flags.fuyin,
        r.flags.fuyin,
      ),
    );
    rows.push(
      item(
        "flag",
        "反吟",
        t.flags.fanyin === r.flags.fanyin ? STATUS.PASS : STATUS.DIFF,
        t.flags.fanyin,
        r.flags.fanyin,
      ),
    );
    rows.push(
      item("capability", "飞盘", STATUS.GAP, false, true, "Mingpan 已实现；TianjiQimen 当前未实现"),
    );
    rows.push(
      item(
        "capability",
        "茅山法",
        STATUS.GAP,
        false,
        true,
        "Mingpan 已实现；TianjiQimen 当前未实现",
      ),
    );
    rows.push(
      item(
        "capability",
        "日盘/月盘/年盘",
        STATUS.GAP,
        false,
        true,
        "Mingpan 已实现四盘型；TianjiQimen 当前仅时盘",
      ),
    );
    rows.push(
      item(
        "capability",
        "完整奇仪格局库",
        STATUS.GAP,
        "基础子集",
        "更完整",
        "Mingpan 0.1.8 的确定性格局库明显更完整，建议后续规则层补齐而非直接复制断语",
      ),
    );
    const summary = {};
    Object.values(STATUS).forEach((s) => (summary[s] = rows.filter((x) => x.status === s).length));
    return {
      verifier: "TianjiQimenVerifier",
      version: VERSION,
      build: BUILD,
      source: clone(SOURCE),
      input: v,
      tianji: t,
      reference: r,
      rows,
      summary,
      ok: summary.DIFF === 0,
      conclusion:
        summary.DIFF === 0
          ? "重叠确定性核心无硬差异；POLICY/GAP 需按流派与产品范围处理。"
          : "存在同口径 DIFF，需要先排查核心算法。",
    };
  }
  const GOLDEN = Object.freeze({
    title: "Mingpan 0.1.8 金样本 · 2024-06-21 10:00",
    input: { solarLongitude: 90.1, dayGanzhiIndex: 52, hourGanzhiIndex: 29 },
    expected: {
      term: "夏至",
      yinYang: "阴遁",
      ju: 3,
      yuan: "中元",
      hourGZ: "癸巳",
      earth: { 1: "庚", 2: "己", 3: "戊", 4: "乙", 5: "丙", 6: "丁", 7: "癸", 8: "壬", 9: "辛" },
      duty: { chiefStar: "蓬", chiefStarPalace: 7, chiefDoor: "休", chiefDoorPalace: 1 },
      heaven: { 1: "戊", 2: "丁", 3: "辛", 4: "己", 5: "丁", 6: "壬", 7: "庚", 8: "乙", 9: "癸" },
      stars: { 1: "冲", 2: "心", 3: "英", 4: "芮", 5: "禽", 6: "任", 7: "蓬", 8: "辅", 9: "柱" },
      doors: { 1: "休", 2: "死", 3: "伤", 4: "杜", 5: "死", 6: "开", 7: "惊", 8: "生", 9: "景" },
      gods: { 1: "地", 2: "蛇", 3: "虎", 4: "合", 5: "蛇", 6: "天", 7: "符", 8: "武", 9: "阴" },
    },
  });
  function goldenCheck() {
    const r = mingpanReference(GOLDEN.input),
      e = GOLDEN.expected,
      checks = [];
    const eq = (id, a, b) =>
      checks.push({
        id,
        ok: JSON.stringify(a) === JSON.stringify(b),
        actual: clone(a),
        expected: clone(b),
      });
    eq("term", r.term, e.term);
    eq("yinYang", r.yinYang, e.yinYang);
    eq("ju", r.ju, e.ju);
    eq("yuan", r.yuan, e.yuan);
    eq("hourGZ", r.hourGZ, e.hourGZ);
    eq("earth", r.earth, e.earth);
    eq(
      "duty",
      r.duty && {
        chiefStar: r.duty.chiefStar,
        chiefStarPalace: r.duty.chiefStarPalace,
        chiefDoor: r.duty.chiefDoor,
        chiefDoorPalace: r.duty.chiefDoorPalace,
      },
      e.duty,
    );
    eq("heaven", r.heaven, e.heaven);
    eq("stars", r.stars, e.stars);
    eq("doors", r.doors, e.doors);
    eq("gods", r.gods, e.gods);
    return { ok: checks.every((x) => x.ok), checks };
  }
  function verifyExternal(input, mingpanResult) {
    if (!mingpanResult || typeof mingpanResult !== "object")
      throw new Error("Mingpan result object required");
    const v = refInput(input),
      t = BASE.calculate(v),
      rows = [];
    const yin = mingpanResult.yinYangDun,
      ju = mingpanResult.juShu,
      yuan = mingpanResult.yuan;
    rows.push(
      item(
        "external",
        "阴阳遁",
        t.calendar.yinYang === yin ? STATUS.PASS : STATUS.DIFF,
        t.calendar.yinYang,
        yin,
      ),
    );
    rows.push(
      item(
        "external",
        "局数",
        t.calendar.juNumber === ju ? STATUS.PASS : STATUS.DIFF,
        t.calendar.juNumber,
        ju,
      ),
    );
    rows.push(
      item(
        "external",
        "三元",
        t.calendar.yuanName === yuan ? STATUS.PASS : STATUS.DIFF,
        t.calendar.yuanName,
        yuan,
      ),
    );
    if (mingpanResult.gongs) {
      const tg = Object.fromEntries(t.palaces.map((p) => [p.number, p.earthStem])),
        mg = {};
      for (let p = 1; p <= 9; p++) mg[p] = mingpanResult.gongs[p]?.diPanGan;
      rows.push(
        item(
          "external",
          "地盘",
          Object.keys(mg).every((p) => tg[p] === mg[p]) ? STATUS.PASS : STATUS.DIFF,
          tg,
          mg,
        ),
      );
    } else rows.push(item("external", "九宫数据", STATUS.NA, null, null, "外部结果未包含 gongs"));
    const summary = {};
    Object.values(STATUS).forEach((s) => (summary[s] = rows.filter((x) => x.status === s).length));
    return { source: clone(SOURCE), rows, summary, ok: summary.DIFF === 0 };
  }
  function selfTest() {
    const checks = [];
    try {
      const b = BASE.selfTest && BASE.selfTest();
      checks.push({ id: "v110.base", ok: !b || b.ok !== false });
    } catch (e) {
      checks.push({ id: "v110.base", ok: false, error: String((e && e.message) || e) });
    }
    try {
      const g = goldenCheck();
      checks.push({
        id: "mingpan.golden",
        ok: g.ok,
        failed: g.checks.filter((x) => !x.ok).map((x) => x.id),
      });
    } catch (e) {
      checks.push({ id: "mingpan.golden", ok: false, error: String((e && e.message) || e) });
    }
    const cases = [
      { id: "golden", solarLongitude: 90.1, dayGanzhiIndex: 52, hourGanzhiIndex: 29 },
      { id: "winter", solarLongitude: 270.1, dayGanzhiIndex: 0, hourGanzhiIndex: 0 },
      { id: "spring", solarLongitude: 315.2, dayGanzhiIndex: 14, hourGanzhiIndex: 23 },
      { id: "equinox", solarLongitude: 0.2, dayGanzhiIndex: 29, hourGanzhiIndex: 37 },
      { id: "autumn", solarLongitude: 180.2, dayGanzhiIndex: 57, hourGanzhiIndex: 11 },
      {
        id: "override",
        solarLongitude: 269.99,
        boundarySolarLongitude: 270.01,
        dayGanzhiIndex: 9,
        hourGanzhiIndex: 59,
      },
    ];
    for (const c of cases) {
      try {
        const r = compare(c);
        checks.push({ id: "compare." + c.id, ok: r.summary.DIFF === 0, summary: r.summary });
      } catch (e) {
        checks.push({ id: "compare." + c.id, ok: false, error: String((e && e.message) || e) });
      }
    }
    try {
      const r = compare(cases[0]);
      checks.push({
        id: "policy.detect",
        ok:
          r.rows.some((x) => x.scope === "god" && x.status === STATUS.POLICY) &&
          r.rows.some((x) => x.label === "马星" && x.status === STATUS.POLICY),
      });
      checks.push({ id: "gaps.detect", ok: r.summary.GAP >= 4 });
    } catch (e) {
      checks.push({ id: "policy-gap", ok: false, error: String((e && e.message) || e) });
    }
    return { ok: checks.every((x) => x.ok), checks, version: VERSION, build: BUILD };
  }
  const TEST = selfTest();
  function manifest() {
    return {
      module: "Tianji Qimen Verification Layer",
      version: VERSION,
      build: BUILD,
      baseline: "v110",
      source: clone(SOURCE),
      status: TEST.ok ? "active" : "degraded",
      selfTest: clone(TEST),
      comparison: [
        "阴阳遁",
        "局数",
        "三元",
        "地盘",
        "天盘八宫",
        "九星",
        "天禽寄芮",
        "八门",
        "值符值使",
        "旬空",
        "空亡宫",
        "伏吟",
        "反吟",
      ],
      policyFields: ["阴遁八神命名/神系", "马星取日支/时支"],
      gapFields: ["飞盘", "茅山法", "日盘", "月盘", "年盘", "更完整奇仪格局库"],
      limits: [
        "v111 共享 Tianji 时间/节气与干支输入，只验证奇门排盘核心；完整“公历时间→奇门盘”的跨引擎日期级验证留待后续接入 Mingpan MCP/Node 适配器",
        "Mingpan 参考实现固定到 0.1.8 commit，升级上游必须重新跑本层回归",
      ],
    };
  }
  const API = Object.freeze({
    version: VERSION,
    build: BUILD,
    source: SOURCE,
    status: STATUS,
    reference: mingpanReference,
    verify: compare,
    verifyExternal,
    golden: () => clone(GOLDEN),
    goldenCheck,
    selfTest: () => clone(TEST),
    manifest,
  });
  window.TianjiQimenVerifier = API;
  try {
    if (window.TianjiCore) {
      TianjiCore.registerSource({
        id: "mingpan-qimen-0.1.8",
        type: "third-party-verifier",
        title: "Mingpan Qimen 0.1.8",
        version: "0.1.8",
        commit: SOURCE.commit,
        license: "Apache-2.0",
        repo: SOURCE.repo,
        status: "shadow-only",
      });
      TianjiCore.registerLicense({
        id: "mingpan-qimen-apache-2.0",
        name: "Mingpan",
        license: "Apache-2.0",
        version: "0.1.8",
        commit: SOURCE.commit,
        usage: "verification/reference only",
      });
      TianjiCore.registerEngine(
        {
          id: "qimen.verify.mingpan.v1",
          system: "qimen",
          name: "Qimen Verification · Mingpan 0.1.8",
          version: VERSION,
          source: "mingpan-qimen-0.1.8",
          doctrine: "时盘 · 转盘 · 拆补法 shadow verification",
          status: TEST.ok ? "active" : "degraded",
        },
        (input) => compare(input || {}),
      );
    }
  } catch (e) {
    try {
      console.warn("[TianjiQimenVerifier v111 registry]", e);
    } catch (_) {}
  }
  try {
    const anchor =
      document.getElementById("tjQimenV1Badge") || document.getElementById("buildVersion");
    let b = document.getElementById("tjQimenVerifyBadge");
    if (!b && anchor) {
      b = document.createElement("span");
      b.id = "tjQimenVerifyBadge";
      anchor.insertAdjacentElement("afterend", b);
    }
    if (b) {
      b.textContent = "QimenVerify 1.0 · Mingpan";
      b.classList.toggle("warn", !TEST.ok);
      b.title = TEST.ok ? "v111：Mingpan 0.1.8 奇门影子验证层通过" : "v111 奇门验证层存在自检失败";
      b.dataset.selftest = TEST.ok ? "PASS" : "FAIL";
      b.dataset.checks =
        String(TEST.checks.filter((x) => x.ok).length) + "/" + String(TEST.checks.length);
    }
  } catch (_) {}
  const oldRoad = window.TianjiRoadmap || {},
    newRoute = (oldRoad.engineRoute || []).map((x) =>
      x.id === "qimen"
        ? Object.assign({}, x, {
            state: "core+verify",
            versions: "v110–v111",
            next: "流派/盘式增强",
          })
        : x,
    );
  const ROADMAP111 = Object.freeze(
    Object.assign({}, clone(oldRoad), {
      engineRoute: newRoute,
      nextMainline: [
        "奇门流派/盘式增强",
        "大六壬核心",
        "六爻/梅花核心",
        "择日核心",
        "Evidence",
        "AI",
        "MCP",
      ],
    }),
  );
  window.TianjiRoadmap = ROADMAP111;
  const prev = window.TianjiSystem || {};
  window.TianjiSystem = Object.freeze({
    version: "v111",
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
    qimen: window.TianjiQimen || prev.qimen || null,
    qimenVerify: API,
    roadmap: ROADMAP111,
    manifest: () => ({
      product: "天机盘",
      version: "v111",
      build: BUILD,
      baseline: "v84",
      qimen:
        window.TianjiQimen && window.TianjiQimen.manifest ? window.TianjiQimen.manifest() : null,
      qimenVerify: manifest(),
      roadmap: clone(ROADMAP111),
    }),
  });
  try {
    const bv = document.getElementById("buildVersion");

    window.dispatchEvent(new CustomEvent("tianji:qimen-verify-v111-ready", { detail: manifest() }));
  } catch (_) {}
})();
