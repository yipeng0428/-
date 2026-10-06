(() => {
  "use strict";
  const BUILD = "2026-10-04 09:46:18",
    VERSION = "1.9.0",
    SCHEMA = "tianji.ziwei/1.9",
    CAPABILITY = "zhongzhou-heaven-earth-human-charts";
  const BASE = window.TianjiZiwei;
  if (!BASE || typeof BASE.calculate !== "function") {
    try {
      console.warn("[TianjiZiwei v100] v99 core unavailable");
    } catch (_) {}
    return;
  }
  const GANS = "甲乙丙丁戊己庚辛壬癸".split(""),
    ZHIS = "子丑寅卯辰巳午未申酉戌亥".split("");
  const PALACES = [
    "命宫",
    "兄弟",
    "夫妻",
    "子女",
    "财帛",
    "疾厄",
    "迁移",
    "交友",
    "官禄",
    "田宅",
    "福德",
    "父母",
  ];
  const BUREAUS = { 2: "水二局", 3: "木三局", 4: "金四局", 5: "土五局", 6: "火六局" };
  const NAYINS = [
    "海中金",
    "炉中火",
    "大林木",
    "路旁土",
    "剑锋金",
    "山头火",
    "涧下水",
    "城头土",
    "白蜡金",
    "杨柳木",
    "泉中水",
    "屋上土",
    "霹雳火",
    "松柏木",
    "长流水",
    "沙中金",
    "山下火",
    "平地木",
    "壁上土",
    "金箔金",
    "覆灯火",
    "天河水",
    "大驿土",
    "钗钏金",
    "桑柘木",
    "大溪水",
    "沙中土",
    "天上火",
    "石榴木",
    "大海水",
  ];
  const clone = (o) => {
      try {
        return structuredClone(o);
      } catch (_) {
        return JSON.parse(JSON.stringify(o));
      }
    },
    mod = (a, n) => ((a % n) + n) % n;
  function findHelper(name) {
    let x = BASE,
      n = 0;
    while (x && n++ < 20) {
      if (typeof x[name] === "function") return x[name];
      x = x.base;
    }
    return null;
  }
  const brightnessHelper = findHelper("brightnessFor"),
    changshengHelper = findHelper("changshengMap");
  const STORAGE = "tianjipan.ziwei.doctrine.v100";
  const ASTRO_TYPES = Object.freeze({
    heaven: { id: "heaven", label: "天盘" },
    earth: { id: "earth", label: "地盘" },
    human: { id: "human", label: "人盘" },
  });
  const DOCTRINES = Object.freeze({
    default: {
      id: "default",
      label: "通行派 / default",
      astroTypes: ["heaven"],
      description: "通行安星法仅启用天盘。",
    },
    zhongzhou: {
      id: "zhongzhou",
      label: "中州派 / zhongzhou",
      astroTypes: ["heaven", "earth", "human"],
      description: "中州派天盘、地盘、人盘均已启用；地盘以身宫干支、人盘以福德宫干支重排。",
    },
  });
  let RUNTIME = { algorithm: "default", astroType: "heaven" };
  try {
    const d = BASE.getDoctrine && BASE.getDoctrine();
    if (d && DOCTRINES[d.algorithm]) RUNTIME.algorithm = d.algorithm;
  } catch (_) {}
  try {
    const x = JSON.parse(localStorage.getItem(STORAGE) || "null");
    if (
      x &&
      DOCTRINES[x.algorithm] &&
      ASTRO_TYPES[x.astroType] &&
      DOCTRINES[x.algorithm].astroTypes.includes(x.astroType)
    )
      RUNTIME = { algorithm: x.algorithm, astroType: x.astroType };
  } catch (_) {}
  function normalizeDoctrine(input = {}) {
    const d = input.ziweiDoctrine || input.doctrine || {},
      algorithm = DOCTRINES[d.algorithm || input.algorithm]
        ? String(d.algorithm || input.algorithm)
        : RUNTIME.algorithm,
      astroType = ASTRO_TYPES[d.astroType || input.astroType]
        ? String(d.astroType || input.astroType)
        : RUNTIME.astroType;
    if (!DOCTRINES[algorithm].astroTypes.includes(astroType))
      throw new Error("ZiweiCore v100: " + algorithm + " 不支持 " + astroType + " 盘型");
    return {
      algorithm,
      algorithmLabel: DOCTRINES[algorithm].label,
      astroType,
      astroTypeLabel: ASTRO_TYPES[astroType].label,
      implemented: true,
    };
  }
  function setDoctrine(p = {}) {
    const algorithm = String(p.algorithm || RUNTIME.algorithm),
      astroType = String(p.astroType || RUNTIME.astroType || "heaven");
    if (!DOCTRINES[algorithm])
      throw new Error("ZiweiCore v100: algorithm must be default or zhongzhou");
    if (!ASTRO_TYPES[astroType] || !DOCTRINES[algorithm].astroTypes.includes(astroType))
      throw new Error("ZiweiCore v100: " + algorithm + " 不支持 " + astroType + " 盘型");
    RUNTIME = { algorithm, astroType };
    try {
      if (BASE.setDoctrine) BASE.setDoctrine({ algorithm, astroType: "heaven" });
    } catch (_) {}
    try {
      localStorage.setItem(STORAGE, JSON.stringify(RUNTIME));
    } catch (_) {}
    return getDoctrine();
  }
  function getDoctrine() {
    return clone({
      ...RUNTIME,
      label: DOCTRINES[RUNTIME.algorithm].label,
      astroTypeLabel: ASTRO_TYPES[RUNTIME.astroType].label,
      supportedAstroTypes: clone(DOCTRINES[RUNTIME.algorithm].astroTypes),
    });
  }
  function listDoctrines() {
    return clone(DOCTRINES);
  }
  function ganzhiIndex(stem, branch) {
    for (let n = 0; n < 60; n++) if (n % 10 === stem && n % 12 === branch) return n;
    return 0;
  }
  function bureauFrom(stem, branch) {
    let idx = Math.floor(stem / 2) + 1 + (Math.floor(mod(branch, 6) / 2) + 1);
    while (idx > 5) idx -= 5;
    const num = { 1: 3, 2: 4, 3: 2, 4: 6, 5: 5 }[idx],
      gz = ganzhiIndex(stem, branch),
      nayin = NAYINS[gz >> 1];
    return { number: num, name: BUREAUS[num], nayin };
  }
  function ziweiPosition(day, bureau) {
    let x = 0;
    while ((day + x) % bureau !== 0) x++;
    const q = (day + x) / bureau;
    return mod(2 + (x % 2 === 0 ? q + x : q - x) - 1, 12);
  }
  function fallbackBrightness(name, b) {
    const map = {
      紫微: ["旺", "旺", "得", "旺", "庙", "庙", "旺", "旺", "得", "旺", "平", "庙"],
      天机: ["得", "旺", "利", "平", "庙", "陷", "得", "旺", "利", "平", "庙", "陷"],
      太阳: ["旺", "庙", "旺", "旺", "旺", "得", "得", "平", "不", "陷", "陷", "不"],
      武曲: ["得", "利", "庙", "平", "旺", "庙", "得", "利", "庙", "平", "旺", "庙"],
      天同: ["利", "平", "平", "庙", "陷", "不", "旺", "平", "平", "庙", "旺", "不"],
      廉贞: ["庙", "平", "利", "陷", "平", "利", "庙", "平", "利", "陷", "平", "利"],
      天府: ["庙", "得", "庙", "得", "旺", "庙", "得", "旺", "庙", "得", "庙", "庙"],
      太阴: ["旺", "陷", "陷", "陷", "不", "不", "利", "旺", "旺", "庙", "庙", "庙"],
      贪狼: ["平", "利", "庙", "陷", "旺", "庙", "平", "利", "庙", "陷", "旺", "庙"],
      巨门: ["庙", "庙", "陷", "旺", "旺", "不", "庙", "庙", "陷", "旺", "旺", "不"],
      天相: ["庙", "陷", "得", "得", "庙", "得", "庙", "陷", "得", "得", "庙", "庙"],
      天梁: ["庙", "庙", "庙", "陷", "庙", "旺", "陷", "得", "庙", "陷", "庙", "旺"],
      七杀: ["庙", "旺", "庙", "平", "旺", "庙", "庙", "旺", "庙", "平", "旺", "庙"],
      破军: ["得", "陷", "旺", "平", "庙", "旺", "得", "陷", "旺", "平", "庙", "旺"],
    };
    const a = map[name];
    return a ? a[mod(b - 2, 12)] : null;
  }
  const brightnessFor = (n, b) =>
    brightnessHelper ? brightnessHelper(n, b) : fallbackBrightness(n, b);
  function fallbackChangsheng(bureau, forward) {
    const seq = ["长生", "沐浴", "冠带", "临官", "帝旺", "衰", "病", "死", "墓", "绝", "胎", "养"],
      start = { 2: 8, 3: 11, 4: 5, 5: 8, 6: 2 }[bureau],
      o = {};
    seq.forEach((n, i) => (o[mod(start + (forward ? i : -i), 12)] = n));
    return o;
  }
  const changshengMap = (bureau, forward) =>
    changshengHelper ? changshengHelper(bureau, forward) : fallbackChangsheng(bureau, forward);
  function majorPositions(day, bureau) {
    const z = ziweiPosition(day, bureau),
      tf = mod(4 - z, 12),
      o = {};
    [
      ["紫微", 0],
      ["天机", -1],
      ["太阳", -3],
      ["武曲", -4],
      ["天同", -5],
      ["廉贞", -8],
    ].forEach(([n, k]) => (o[n] = mod(z + k, 12)));
    [
      ["天府", 0],
      ["太阴", 1],
      ["贪狼", 2],
      ["巨门", 3],
      ["天相", 4],
      ["天梁", 5],
      ["七杀", 6],
      ["破军", 10],
    ].forEach(([n, k]) => (o[n] = mod(tf + k, 12)));
    return { positions: o, z, tf };
  }
  function byBranch(chart) {
    const o = {};
    (chart.palaces || []).forEach((p) => (o[p.branchIndex] = p));
    return o;
  }
  function moveAdjective(chart, name, target) {
    let tpl = null;
    for (const p of chart.palaces || []) {
      for (const s of p.adjectiveStars || []) if (s && s.name === name && !tpl) tpl = clone(s);
      p.adjectiveStars = (p.adjectiveStars || []).filter((s) => s && s.name !== name);
      p.stars = (p.stars || []).filter((s) => s && s.name !== name);
    }
    const p = byBranch(chart)[target];
    if (!p) return;
    if (!tpl)
      tpl = {
        name,
        type: "adjective",
        category: "adjective",
        nature: "adjective",
        scope: "origin",
      };
    p.adjectiveStars = p.adjectiveStars || [];
    p.adjectiveStars.push(clone(tpl));
    p.stars = p.stars || [];
    p.stars.push(clone(tpl));
    if (chart.adjectiveStars && chart.adjectiveStars.positions)
      chart.adjectiveStars.positions[name] = target;
  }
  function effectiveDay(chart) {
    const l =
      (chart.input && chart.input.effectiveLunar) || (chart.input && chart.input.lunar) || {};
    return Number(l.day) || 1;
  }
  function rearrangeZhongzhou(heaven, astroType) {
    if (astroType === "heaven") {
      const x = clone(heaven);
      x.doctrine = Object.assign({}, x.doctrine || {}, {
        astroType: "heaven",
        astroTypeLabel: "天盘",
      });
      return x;
    }
    const base = clone(heaven),
      source =
        astroType === "earth"
          ? (base.palaces || []).find((p) => p.isBodyPalace)
          : (base.palaces || []).find((p) => p.name === "福德");
    if (!source) throw new Error("ZiweiCore v100: " + astroType + " 重排基准宫位缺失");
    const life = source.branchIndex,
      lifeStem = Number.isInteger(source.stemIndex) ? source.stemIndex : GANS.indexOf(source.stem),
      timeIndex = Number(
        (base.input && base.input.timeIndex) != null
          ? base.input.timeIndex
          : (base.input && base.input.hourBranchIndex) != null
            ? base.input.hourBranchIndex
            : 0,
      ),
      hb = timeIndex === 12 ? 0 : mod(timeIndex, 12),
      body = mod(life + 2 * hb, 12),
      bureau = bureauFrom(lifeStem, life),
      forward = !!(base.majorPeriod && base.majorPeriod.forward),
      cs = changshengMap(bureau.number, forward),
      mp = majorPositions(effectiveDay(base), bureau.number),
      bm = byBranch(base);
    const templates = {};
    for (const p of base.palaces || [])
      for (const s of p.majorStars || []) templates[s.name] = clone(s);
    for (const p of base.palaces || []) {
      p.stars = (p.stars || []).filter(
        (s) => !(s && (s.category === "major" || s.type === "major")),
      );
      p.majorStars = [];
      p.name = PALACES[mod(life - p.branchIndex, 12)];
      p.isLifePalace = p.branchIndex === life;
      p.isBodyPalace = p.branchIndex === body;
      p.changsheng12 = cs[p.branchIndex];
      const k = forward ? mod(p.branchIndex - life, 12) : mod(life - p.branchIndex, 12),
        start = bureau.number + 10 * k;
      p.majorPeriod = { startAge: start, endAge: start + 9 };
      p.decadal = {
        range: [start, start + 9],
        heavenlyStem: p.stem,
        earthlyBranch: p.branch,
        direction: forward ? "顺行" : "逆行",
      };
    }
    for (const [name, b] of Object.entries(mp.positions)) {
      const p = bm[b];
      if (!p) continue;
      const s = templates[name] || { name, type: "major", category: "major", transformation: null };
      s.type = "major";
      s.category = "major";
      s.brightness = brightnessFor(name, b);
      p.majorStars.push(clone(s));
      p.stars.unshift(clone(s));
    }
    const lifeP = bm[life],
      bodyP = bm[body],
      yb =
        base.yearBranch && Number.isInteger(base.yearBranch.index)
          ? base.yearBranch.index
          : mod(((base.input && base.input.lunar && base.input.lunar.year) || 4) - 4, 12),
      g = base.input && base.input.gender === "F" ? 1 : 0;
    base.lifePalace = {
      branchIndex: life,
      branch: ZHIS[life],
      stemIndex: lifeStem,
      stem: GANS[lifeStem],
      nayin: bureau.nayin,
    };
    base.bodyPalace = {
      branchIndex: body,
      branch: ZHIS[body],
      stemIndex: bodyP.stemIndex,
      stem: bodyP.stem,
    };
    base.bureau = clone(bureau);
    base.starAnchors = {
      ziweiBranchIndex: mp.z,
      ziweiBranch: ZHIS[mp.z],
      tianfuBranchIndex: mp.tf,
      tianfuBranch: ZHIS[mp.tf],
    };
    if (base.decorative)
      base.decorative.changsheng12 = ZHIS.map((b, i) => ({ branch: b, name: cs[i] }));
    const tiancai = mod(life + yb, 12);
    let tianshang = mod(life + 5, 12),
      tianshi = mod(life + 7, 12);
    if (yb % 2 !== g) [tianshang, tianshi] = [tianshi, tianshang];
    moveAdjective(base, "天才", tiancai);
    moveAdjective(base, "天伤", tianshang);
    moveAdjective(base, "天使", tianshi);
    base.schema = SCHEMA;
    base.version = VERSION;
    base.build = BUILD;
    base.capability = CAPABILITY;
    base.astroType = {
      id: astroType,
      label: ASTRO_TYPES[astroType].label,
      sourcePalace: { name: source.name, branch: source.branch, stem: source.stem },
      rearranged: true,
    };
    base.doctrine = Object.assign({}, base.doctrine || {}, {
      algorithm: "zhongzhou",
      astroType,
      astroTypeLabel: ASTRO_TYPES[astroType].label,
      differencesApplied: [
        ...new Set([
          ...((base.doctrine && base.doctrine.differencesApplied) || []),
          astroType === "earth"
            ? "地盘：以原身宫干支为命宫及五行局基准"
            : "人盘：以原福德宫干支为命宫及五行局基准",
        ]),
      ],
    });
    base.coverage = Object.assign({}, base.coverage || {}, {
      zhongzhouHeavenChart: true,
      zhongzhouEarthChart: true,
      zhongzhouHumanChart: true,
    });
    base.policy = Object.assign({}, base.policy || {}, {
      astroType: { mode: astroType, label: ASTRO_TYPES[astroType].label, source: source.name },
      rearrangement: {
        mode: "zhongzhou-from-palace",
        recomputed: [
          "命宫",
          "身宫",
          "宫名",
          "五行局",
          "十四主星",
          "长生十二神",
          "大限",
          "天才",
          "天伤",
          "天使",
        ],
        preserved: ["十四辅星", "其余年/月/日/时系杂曜", "四化", "小限年龄落宫"],
      },
    });
    base.legacyCompatibility = {
      mode: "heaven-only",
      note: "legacy 字段保留原天盘兼容快照；地盘/人盘请使用 canonical palaces / lifePalace / bureau 等字段。",
    };
    return base;
  }
  function calculate(input = {}) {
    const d = normalizeDoctrine(input),
      clean = Object.assign({}, input, {
        ziweiDoctrine: { algorithm: d.algorithm, astroType: "heaven" },
      });
    delete clean.algorithm;
    delete clean.astroType;
    delete clean.doctrine;
    const heaven = clone(BASE.calculate(clean)),
      out = d.algorithm === "zhongzhou" ? rearrangeZhongzhou(heaven, d.astroType) : heaven;
    out.schema = SCHEMA;
    out.version = VERSION;
    out.build = BUILD;
    out.capability = CAPABILITY;
    out.doctrine = Object.assign({}, out.doctrine || {}, d);
    if (d.algorithm === "default")
      out.astroType = { id: "heaven", label: "天盘", rearranged: false };
    return out;
  }
  function fromLegacy(lunar, hb, gender) {
    return BASE.fromLegacy(lunar, hb, gender);
  }
  function fromLegacyWithDoctrine(lunar, hb, gender, doctrine = {}) {
    return calculate({
      lunar: clone(lunar),
      hourBranchIndex: Number(hb),
      gender: gender === "女" || gender === "F" ? "F" : "M",
      ziweiDoctrine: doctrine,
    });
  }
  function fromTimeContext(ctx, input = {}) {
    const d = normalizeDoctrine(input),
      clean = Object.assign({}, input, {
        ziweiDoctrine: { algorithm: d.algorithm, astroType: "heaven" },
      });
    delete clean.algorithm;
    delete clean.astroType;
    delete clean.doctrine;
    const heaven = clone(BASE.fromTimeContext(ctx, clean)),
      out = d.algorithm === "zhongzhou" ? rearrangeZhongzhou(heaven, d.astroType) : heaven;
    out.schema = SCHEMA;
    out.version = VERSION;
    out.build = BUILD;
    out.capability = CAPABILITY;
    out.doctrine = Object.assign({}, out.doctrine || {}, d);
    if (d.algorithm === "default")
      out.astroType = { id: "heaven", label: "天盘", rearranged: false };
    return out;
  }
  function fingerprint(c) {
    return {
      life: c.lifePalace && c.lifePalace.branch,
      body: c.bodyPalace && c.bodyPalace.branch,
      bureau: c.bureau && c.bureau.name,
      names: (c.palaces || []).map((p) => [p.branch, p.name]),
      major: (c.palaces || []).map((p) => [
        p.branch,
        (p.majorStars || []).map((s) => s.name).sort((a, b) => a.localeCompare(b, "zh-CN")),
      ]),
      cs: (c.palaces || []).map((p) => [p.branch, p.changsheng12]),
      dec: (c.palaces || []).map((p) => [p.branch, p.decadal && p.decadal.range]),
    };
  }
  function selfTest() {
    const checks = [],
      sample = {
        lunar: { year: 1986, month: 4, day: 28, isLeap: false },
        hourBranchIndex: 9,
        gender: "M",
      };
    try {
      const a = BASE.calculate(
          Object.assign({}, sample, {
            ziweiDoctrine: { algorithm: "default", astroType: "heaven" },
          }),
        ),
        b = calculate(
          Object.assign({}, sample, {
            ziweiDoctrine: { algorithm: "default", astroType: "heaven" },
          }),
        );
      checks.push({
        id: "default.heaven-preserved",
        ok: JSON.stringify(fingerprint(a)) === JSON.stringify(fingerprint(b)),
      });
    } catch (e) {
      checks.push({
        id: "default.heaven-preserved",
        ok: false,
        error: String((e && e.message) || e),
      });
    }
    try {
      const a = BASE.calculate(
          Object.assign({}, sample, {
            ziweiDoctrine: { algorithm: "zhongzhou", astroType: "heaven" },
          }),
        ),
        b = calculate(
          Object.assign({}, sample, {
            ziweiDoctrine: { algorithm: "zhongzhou", astroType: "heaven" },
          }),
        );
      checks.push({
        id: "zhongzhou.heaven-preserved",
        ok: JSON.stringify(fingerprint(a)) === JSON.stringify(fingerprint(b)),
      });
    } catch (e) {
      checks.push({
        id: "zhongzhou.heaven-preserved",
        ok: false,
        error: String((e && e.message) || e),
      });
    }
    try {
      const h = BASE.calculate(
          Object.assign({}, sample, {
            ziweiDoctrine: { algorithm: "zhongzhou", astroType: "heaven" },
          }),
        ),
        src = (h.palaces || []).find((p) => p.isBodyPalace),
        e = calculate(
          Object.assign({}, sample, {
            ziweiDoctrine: { algorithm: "zhongzhou", astroType: "earth" },
          }),
        );
      checks.push({
        id: "earth.life-from-body",
        ok: !!src && e.lifePalace.branchIndex === src.branchIndex && e.lifePalace.stem === src.stem,
      });
      checks.push({
        id: "earth.bureau-from-body",
        ok: e.bureau.name === bureauFrom(src.stemIndex, src.branchIndex).name,
      });
      checks.push({
        id: "earth.major14",
        ok: e.palaces.flatMap((p) => p.majorStars || []).length === 14,
      });
      checks.push({
        id: "earth.changsheng12",
        ok: new Set(e.palaces.map((p) => p.changsheng12)).size === 12,
      });
      checks.push({
        id: "earth.decadal-life-start",
        ok: e.palaces.find((p) => p.isLifePalace).decadal.range[0] === e.bureau.number,
      });
    } catch (e) {
      checks.push({ id: "earth.chart", ok: false, error: String((e && e.message) || e) });
    }
    try {
      const h = BASE.calculate(
          Object.assign({}, sample, {
            ziweiDoctrine: { algorithm: "zhongzhou", astroType: "heaven" },
          }),
        ),
        src = (h.palaces || []).find((p) => p.name === "福德"),
        u = calculate(
          Object.assign({}, sample, {
            ziweiDoctrine: { algorithm: "zhongzhou", astroType: "human" },
          }),
        );
      checks.push({
        id: "human.life-from-fortune",
        ok: !!src && u.lifePalace.branchIndex === src.branchIndex && u.lifePalace.stem === src.stem,
      });
      checks.push({
        id: "human.bureau-from-fortune",
        ok: u.bureau.name === bureauFrom(src.stemIndex, src.branchIndex).name,
      });
      const yb = u.yearBranch.index,
        expect = mod(u.lifePalace.branchIndex + yb, 12);
      checks.push({
        id: "human.tiancai-recomputed",
        ok: u.adjectiveStars.positions["天才"] === expect,
      });
      checks.push({
        id: "human.body-recomputed",
        ok:
          u.bodyPalace.branchIndex ===
          mod(
            u.lifePalace.branchIndex + 2 * (u.input.timeIndex === 12 ? 0 : u.input.hourBranchIndex),
            12,
          ),
      });
    } catch (e) {
      checks.push({ id: "human.chart", ok: false, error: String((e && e.message) || e) });
    }
    try {
      let ok = false;
      try {
        calculate(
          Object.assign({}, sample, {
            ziweiDoctrine: { algorithm: "default", astroType: "earth" },
          }),
        );
      } catch (_) {
        ok = true;
      }
      checks.push({ id: "default.reject-nonheaven", ok });
    } catch (e) {
      checks.push({
        id: "default.reject-nonheaven",
        ok: false,
        error: String((e && e.message) || e),
      });
    }
    try {
      const cases = [
        [1986, 4, 28, 9, "M"],
        [2026, 8, 24, 0, "M"],
        [2025, 6, 16, 5, "F"],
      ];
      for (const [y, m, d, h, g] of cases) {
        const l = { year: y, month: m, day: d, isLeap: false };
        checks.push({
          id: "legacy." + [y, m, d, h, g].join("-"),
          ok: JSON.stringify(BASE.fromLegacy(l, h, g)) === JSON.stringify(fromLegacy(l, h, g)),
        });
      }
    } catch (e) {
      checks.push({ id: "legacy.compat", ok: false, error: String((e && e.message) || e) });
    }
    return { ok: checks.every((x) => x.ok), checks, version: VERSION, build: BUILD };
  }
  const TEST = selfTest();
  function manifest() {
    return {
      module: "Tianji Ziwei Core",
      version: VERSION,
      schema: SCHEMA,
      build: BUILD,
      baseline: "v99",
      capability: CAPABILITY,
      selfTest: clone(TEST),
      doctrine: getDoctrine(),
      supportedAlgorithms: ["default", "zhongzhou"],
      supportedAstroTypes: { default: ["heaven"], zhongzhou: ["heaven", "earth", "human"] },
      resolvedGaps: ["中州派地盘 earth", "中州派人盘 human", "三盘型重排审计"],
      remainingGaps: [
        "小限 birthday 目标日期分界",
        "更高阶流年流月流日流时运限",
        "中州派更多细分传承差异",
      ],
      reference: {
        name: "SylarLong/iztro",
        version: "2.6.1",
        tagCommit: "b78dfe391f65e938d79f2419dddb80f74c6bbb8e",
        license: "MIT",
        files: [
          "src/astro/astro.ts#rearrangeAstrolable",
          "src/astro/palace.ts#getSoulAndBody/getHoroscope",
          "src/star/location.ts#getStartIndex",
          "src/__tests__/astro/astro.test.ts",
        ],
        role: "deterministic astroType rule cross-check",
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
    fromLegacyWithDoctrine,
    fromTimeContext,
    setDoctrine,
    getDoctrine,
    listDoctrines,
    rearrangeZhongzhou: (chart, type) => clone(rearrangeZhongzhou(chart, type)),
    selfTest: () => clone(TEST),
    manifest,
    base: BASE,
  });
  window.TianjiZiwei = API;
  if (TEST.ok) window.calcZiwei = (lunar, hb, gender) => fromLegacy(lunar, hb, gender);
  try {
    if (window.TianjiCore) {
      TianjiCore.registerSource({
        id: "tianji-v100-ziwei-astrotype-layer",
        type: "internal",
        title: "Tianji Ziwei Core 1.9 Zhongzhou Heaven/Earth/Human",
        version: VERSION,
        baseline: "v99",
      });
      TianjiCore.registerSource({
        id: "iztro-2.6.1-astrotype-reference",
        type: "third-party-reference",
        title: "SylarLong/iztro v2.6.1 astroType rearrangement reference",
        version: "2.6.1",
        license: "MIT",
        repository: "SylarLong/iztro",
        commit: "b78dfe391f65e938d79f2419dddb80f74c6bbb8e",
        role: "rule-reference",
      });
      TianjiCore.registerEngine(
        {
          id: "ziwei.core.v1.9",
          system: "ziwei",
          name: "Tianji Ziwei Core 1.9",
          version: VERSION,
          source: "tianji-v100-ziwei-astrotype-layer",
          doctrine: "default heaven | zhongzhou heaven/earth/human",
          status: "active",
        },
        (input) => calculate(input || {}),
      );
    }
  } catch (e) {
    try {
      console.warn("[TianjiZiwei v100] registry", e);
    } catch (_) {}
  }
  try {
    const old =
      document.getElementById("tjZiweiV9Badge") || document.getElementById("buildVersion");
    let b = document.getElementById("tjZiweiV10Badge");
    if (!b && old) {
      b = document.createElement("span");
      b.id = "tjZiweiV10Badge";
      old.insertAdjacentElement("afterend", b);
    }
    if (b) {
      b.textContent = "ZiweiCore 1.9 · 三盘型";
      b.classList.toggle("warn", !TEST.ok);
      b.title = TEST.ok
        ? "v100：中州派天盘/地盘/人盘已通过回归"
        : "v100 三盘型自检失败；旧 calcZiwei 默认接口保持兼容";
    }
  } catch (_) {}

  /* ---- v100-aware iztro verifier: heaven / earth / human ---- */
  const OLDV = window.TianjiZiweiVerifier,
    V10STATE = { lastSuite: null };
  function eq(a, b) {
    return JSON.stringify(a) === JSON.stringify(b);
  }
  function mapP(ps, key) {
    const o = {};
    (ps || []).forEach((p) => (o[p[key]] = p));
    return o;
  }
  function vendorChart(input, astroType) {
    if (!(window.iztro && iztro.astro && iztro.astro.withOptions))
      throw new Error("iztro unavailable");
    const astro = iztro.astro,
      l = input.lunar,
      g = input.gender === "F" ? "女" : "男",
      h = Number(input.timeIndex ?? input.hourBranchIndex ?? 0),
      old = astro.getConfig ? astro.getConfig() : {},
      dd = input.dayDivide || old.dayDivide || "forward";
    try {
      return astro.withOptions({
        type: "lunar",
        dateStr: `${l.year}-${l.month}-${l.day}`,
        timeIndex: h,
        gender: g,
        isLeapMonth: !!l.isLeap,
        fixLeap: true,
        language: "zh-CN",
        astroType,
        config: { algorithm: "zhongzhou", dayDivide: dd },
      });
    } finally {
      try {
        if (astro.config)
          astro.config({
            algorithm: old.algorithm || "default",
            dayDivide: old.dayDivide || "forward",
            yearDivide: old.yearDivide || "normal",
            horoscopeDivide: old.horoscopeDivide || "normal",
            ageDivide: old.ageDivide || "normal",
          });
      } catch (_) {}
    }
  }
  function majorP(c) {
    const m = mapP(c.palaces, "branch");
    return ZHIS.map((b) => [
      b,
      ((m[b] && m[b].majorStars) || [])
        .map((s) => s.name)
        .sort((a, b) => a.localeCompare(b, "zh-CN")),
    ]);
  }
  function majorV(v) {
    const m = mapP(v && v.palaces, "earthlyBranch");
    return ZHIS.map((b) => [
      b,
      ((m[b] && m[b].majorStars) || [])
        .map((s) => s.name)
        .sort((a, b) => a.localeCompare(b, "zh-CN")),
    ]);
  }
  function namesP(c) {
    const m = mapP(c.palaces, "branch");
    return ZHIS.map((b) => [b, m[b] && m[b].name, m[b] && m[b].stem]);
  }
  function namesV(v) {
    const m = mapP(v && v.palaces, "earthlyBranch");
    return ZHIS.map((b) => [b, m[b] && m[b].name, m[b] && m[b].heavenlyStem]);
  }
  function csP(c) {
    const m = mapP(c.palaces, "branch");
    return ZHIS.map((b) => [b, m[b] && m[b].changsheng12]);
  }
  function csV(v) {
    const m = mapP(v && v.palaces, "earthlyBranch");
    return ZHIS.map((b) => [b, m[b] && m[b].changsheng12]);
  }
  function decP(c) {
    const m = mapP(c.palaces, "branch");
    return ZHIS.map((b) => [b, m[b] && m[b].decadal && m[b].decadal.range]);
  }
  function decV(v) {
    const m = mapP(v && v.palaces, "earthlyBranch");
    return ZHIS.map((b) => [b, m[b] && m[b].decadal && m[b].decadal.range]);
  }
  function dynamicP(c) {
    const p = (c.adjectiveStars && c.adjectiveStars.positions) || {};
    return ["天才", "天伤", "天使"].map((n) => [n, ZHIS[p[n]]]);
  }
  function dynamicV(v) {
    const out = {};
    ((v && v.palaces) || []).forEach((p) =>
      (p.adjectiveStars || []).forEach((s) => {
        if (["天才", "天伤", "天使"].includes(s.name)) out[s.name] = p.earthlyBranch;
      }),
    );
    return ["天才", "天伤", "天使"].map((n) => [n, out[n]]);
  }
  function compareAstroType(input = {}, astroType = "earth") {
    if (!(OLDV && OLDV.hasVendor && OLDV.hasVendor()))
      return { available: false, ok: false, reason: "iztro unavailable" };
    if (!["earth", "human", "heaven"].includes(astroType)) throw new Error("invalid astroType");
    const c = calculate(
        Object.assign({}, input, { ziweiDoctrine: { algorithm: "zhongzhou", astroType } }),
      ),
      vv = vendorChart(input, astroType),
      v = vv && typeof vv.toJSON === "function" ? vv.toJSON() : vv,
      rows = [];
    const push = (id, label, a, b, note) =>
      rows.push({ id, label, primary: a, verifier: b, status: eq(a, b) ? "PASS" : "DIFF", note });
    push("astrotype.life", "命宫地支", c.lifePalace.branch, v && v.earthlyBranchOfSoulPalace);
    push("astrotype.body", "身宫地支", c.bodyPalace.branch, v && v.earthlyBranchOfBodyPalace);
    push("astrotype.bureau", "五行局", c.bureau.name, v && v.fiveElementsClass);
    push("astrotype.palaces", "十二宫名 / 宫干", namesP(c), namesV(v));
    push("astrotype.major14", "十四主星重排", majorP(c), majorV(v));
    push("astrotype.changsheng", "长生十二神", csP(c), csV(v));
    push("astrotype.decadal", "大限区间", decP(c), decV(v));
    push("astrotype.dynamic-adj", "天才 / 天伤 / 天使", dynamicP(c), dynamicV(v));
    const counts = { PASS: 0, DIFF: 0, POLICY: 0, GAP: 0, "N/A": 0 };
    rows.forEach((x) => (counts[x.status] = (counts[x.status] || 0) + 1));
    return {
      available: true,
      ok: counts.DIFF === 0,
      astroType,
      input: clone(input),
      counts,
      rows,
      raw: { primary: c, verifier: v },
    };
  }
  function suite100() {
    if (!(OLDV && OLDV.hasVendor && OLDV.hasVendor()))
      return {
        available: false,
        cases: [],
        summary: { PASS: 0, DIFF: 0, POLICY: 0, GAP: 0, "N/A": 0 },
        ok: false,
      };
    const cases = [
        {
          id: "earth",
          type: "earth",
          l: { year: 2001, month: 6, day: 27, isLeap: false },
          h: 7,
          g: "M",
        },
        {
          id: "human",
          type: "human",
          l: { year: 1986, month: 4, day: 28, isLeap: false },
          h: 8,
          g: "M",
        },
      ],
      out = [],
      summary = { PASS: 0, DIFF: 0, POLICY: 0, GAP: 0, "N/A": 0 };
    for (const x of cases) {
      try {
        const r = compareAstroType({ lunar: x.l, hourBranchIndex: x.h, gender: x.g }, x.type);
        out.push({ id: x.id, report: r });
        r.rows.forEach((y) => (summary[y.status] = (summary[y.status] || 0) + 1));
      } catch (e) {
        out.push({ id: x.id, error: String((e && e.message) || e) });
        summary.DIFF++;
      }
    }
    const r = {
      available: true,
      at: new Date().toISOString(),
      cases: out,
      summary,
      ok: summary.DIFF === 0,
    };
    V10STATE.lastSuite = r;
    renderV10();
    return r;
  }
  function liveV10() {
    const d = getDoctrine(),
      s = V10STATE.lastSuite,
      sum = (s && s.summary) || { PASS: 0, DIFF: 0, GAP: 0 };
    return `<div class="panel blk tjzv10-live"><h4>紫微三盘型 · v100</h4><div class="tjzv3-stat"><span class="pass">PASS ${sum.PASS || 0}</span><span class="diff">DIFF ${sum.DIFF || 0}</span><span class="gap">GAP ${sum.GAP || 0}</span></div><div class="tjzv10-grid"><div class="tjzv10-card"><b>当前口径</b><br>${d.label}<br>${d.astroTypeLabel}</div><div class="tjzv10-card"><b>中州派盘型</b><br>天盘：原命宫<br>地盘：原身宫为命宫<br>人盘：原福德宫为命宫</div><div class="tjzv10-card"><b>重排项目</b><br>命身宫、宫名、五行局、主星、长生、大限、天才/天伤/天使</div></div><div class="tjzv10-actions"><button class="gbtn sm ${d.algorithm === "default" ? "on" : ""}" id="tjzv10Default" type="button">通行派</button><button class="gbtn sm ${d.algorithm === "zhongzhou" ? "on" : ""}" id="tjzv10ZZ" type="button">中州派</button>${d.algorithm === "zhongzhou" ? `<button class="gbtn sm ${d.astroType === "heaven" ? "on" : ""}" data-zv100-type="heaven">天盘</button><button class="gbtn sm ${d.astroType === "earth" ? "on" : ""}" data-zv100-type="earth">地盘</button><button class="gbtn sm ${d.astroType === "human" ? "on" : ""}" data-zv100-type="human">人盘</button>` : ""}<button class="gbtn sm" id="tjzv10Run" type="button">验证三盘型</button></div></div>`;
  }
  function patchVerifyUI() {
    try {
      if (!window.REF_PANES || typeof REF_PANES.verify !== "function" || REF_PANES.verify.__v100)
        return;
      const old = REF_PANES.verify,
        oldBind = window.REF_BIND && REF_BIND.verify;
      const fn = () => liveV10() + old();
      fn.__v100 = true;
      REF_PANES.verify = fn;
      if (window.REF_BIND)
        REF_BIND.verify = function () {
          try {
            if (typeof oldBind === "function") oldBind();
          } catch (_) {}
          const a = document.getElementById("tjzv10Default"),
            z = document.getElementById("tjzv10ZZ"),
            r = document.getElementById("tjzv10Run");
          if (a)
            a.onclick = () => {
              setDoctrine({ algorithm: "default", astroType: "heaven" });
              renderV10();
            };
          if (z)
            z.onclick = () => {
              setDoctrine({ algorithm: "zhongzhou", astroType: "heaven" });
              renderV10();
            };
          document.querySelectorAll("[data-zv100-type]").forEach(
            (b) =>
              (b.onclick = () => {
                setDoctrine({
                  algorithm: "zhongzhou",
                  astroType: b.getAttribute("data-zv100-type"),
                });
                renderV10();
              }),
          );
          if (r)
            r.onclick = () => {
              if (OLDV && OLDV.hasVendor && OLDV.hasVendor()) suite100();
              else if (OLDV && OLDV.loadVendor) OLDV.loadVendor().then(() => suite100());
            };
        };
    } catch (e) {
      try {
        console.warn("[ZiweiVerify v100 UI]", e);
      } catch (_) {}
    }
  }
  function renderV10() {
    try {
      const p = document.getElementById("pane-verify");
      if (p && p.classList.contains("on") && typeof refRender === "function") refRender("verify");
    } catch (_) {}
  }
  const VERIFY100 = Object.freeze({
    version: "10.0.0",
    build: BUILD,
    state: V10STATE,
    compareAstroType,
    suite: suite100,
    loadVendor: OLDV && OLDV.loadVendor ? OLDV.loadVendor : async () => ({ status: "unavailable" }),
    hasVendor: () => !!(OLDV && OLDV.hasVendor && OLDV.hasVendor()),
    manifest: () => ({
      module: "Tianji Ziwei Verification Layer",
      version: "10.0.0",
      build: BUILD,
      baseline: "v100",
      vendor: "iztro 2.6.1",
      resolvedComparison: ["zhongzhou heaven / earth / human astroType"],
      remainingGaps: manifest().remainingGaps,
    }),
  });
  window.TianjiZiweiVerifier = VERIFY100;
  patchVerifyUI();
  const prev = window.TianjiSystem || {};
  window.TianjiSystem = Object.freeze({
    version: "v100",
    build: BUILD,
    baseline: "v84",
    core: window.TianjiCore || prev.core || null,
    time: window.TianjiTime || prev.time || null,
    verify: window.TianjiVerifier || prev.verify || null,
    bazi: window.TianjiBazi || prev.bazi || null,
    baziVerify: window.TianjiBaziVerifier || prev.baziVerify || null,
    ziwei: API,
    ziweiVerify: VERIFY100,
    manifest: () => ({
      product: "天机盘",
      version: "v100",
      build: BUILD,
      baseline: "v84",
      ziwei: manifest(),
      ziweiVerify: VERIFY100.manifest(),
    }),
  });
  try {
    const bv = document.getElementById("buildVersion");

    window.dispatchEvent(new CustomEvent("tianji:ziwei-core-v100-ready", { detail: manifest() }));
  } catch (_) {}
})();
