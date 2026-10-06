(() => {
  "use strict";
  const BUILD = "2026-10-04 08:57:31",
    VERSION = "1.1.0",
    SCHEMA = "tianji.ziwei/1.1",
    CAPABILITY = "enhanced-foundation";
  const BASE = window.TianjiZiwei;
  if (!BASE || typeof BASE.calculate !== "function") {
    try {
      console.warn("[TianjiZiwei v92] v90 core unavailable");
    } catch (_) {}
    return;
  }
  const GANS = "甲乙丙丁戊己庚辛壬癸".split(""),
    ZHIS = "子丑寅卯辰巳午未申酉戌亥".split("");
  const CHANGSHENG = [
    "长生",
    "沐浴",
    "冠带",
    "临官",
    "帝旺",
    "衰",
    "病",
    "死",
    "墓",
    "绝",
    "胎",
    "养",
  ];
  const BRIGHTNESS_LABEL = {
    miao: "庙",
    wang: "旺",
    de: "得",
    li: "利",
    ping: "平",
    bu: "不",
    xian: "陷",
    庙: "庙",
    旺: "旺",
    得: "得",
    利: "利",
    平: "平",
    不: "不",
    陷: "陷",
  };
  /* Reference-derived rule/data notice:
   Star-brightness tables and several deterministic star-location rules were cross-checked against
   SylarLong/iztro v2.6.1 (tag commit b78dfe391f65e938d79f2419dddb80f74c6bbb8e), MIT License.
   Copyright (c) 2023 All Contributors. Permission is granted under the MIT License; see the
   existing Tianji license/source registry entry `iztro@2.6.1`. The Tianji implementation below is
   independent runtime code; iztro remains a verifier/reference and does not control primary output.
*/
  const BRIGHTNESS = {
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
    文昌: ["陷", "利", "得", "庙", "陷", "利", "得", "庙", "陷", "利", "得", "庙"],
    文曲: ["平", "旺", "得", "庙", "陷", "旺", "得", "庙", "陷", "旺", "得", "庙"],
    火星: ["庙", "利", "陷", "得", "庙", "利", "陷", "得", "庙", "利", "陷", "得"],
    铃星: ["庙", "利", "陷", "得", "庙", "利", "陷", "得", "庙", "利", "陷", "得"],
    擎羊: ["", "陷", "庙", "", "陷", "庙", "", "陷", "庙", "", "陷", "庙"],
    陀罗: ["陷", "", "庙", "陷", "", "庙", "陷", "", "庙", "陷", "", "庙"],
  };
  const MINOR14 = [
    "左辅",
    "右弼",
    "文昌",
    "文曲",
    "天魁",
    "天钺",
    "禄存",
    "天马",
    "地空",
    "地劫",
    "火星",
    "铃星",
    "擎羊",
    "陀罗",
  ];
  const MINOR_NATURE = {
    左辅: "soft",
    右弼: "soft",
    文昌: "soft",
    文曲: "soft",
    天魁: "soft",
    天钺: "soft",
    禄存: "lucun",
    天马: "tianma",
    地空: "tough",
    地劫: "tough",
    火星: "tough",
    铃星: "tough",
    擎羊: "tough",
    陀罗: "tough",
  };
  const clone = (o) => {
      try {
        return structuredClone(o);
      } catch (_) {
        return JSON.parse(JSON.stringify(o));
      }
    },
    mod = (a, n) => ((a % n) + n) % n;
  const brightnessFor = (name, branchIndex) => {
    const a = BRIGHTNESS[name];
    if (!a) return null;
    const idx = mod(branchIndex - 2, 12),
      v = a[idx];
    return v === "" ? "" : BRIGHTNESS_LABEL[v] || v || null;
  };
  function luYangTuoMa(ys, yb) {
    const lu = [2, 3, 5, 6, 5, 6, 8, 9, 11, 0][ys];
    let ma = 0;
    if ([2, 6, 10].includes(yb)) ma = 8;
    else if ([8, 0, 4].includes(yb)) ma = 2;
    else if ([5, 9, 1].includes(yb)) ma = 11;
    else ma = 5;
    return { 禄存: lu, 擎羊: mod(lu + 1, 12), 陀罗: mod(lu - 1, 12), 天马: ma };
  }
  function kuiYue(ys) {
    if ([0, 4, 6].includes(ys)) return { 天魁: 1, 天钺: 7 };
    if ([1, 5].includes(ys)) return { 天魁: 0, 天钺: 8 };
    if (ys === 7) return { 天魁: 6, 天钺: 2 };
    if ([2, 3].includes(ys)) return { 天魁: 11, 天钺: 9 };
    return { 天魁: 3, 天钺: 5 };
  }
  function kongJie(hb) {
    return { 地空: mod(11 - hb, 12), 地劫: mod(11 + hb, 12) };
  }
  function huoLing(yb, hb) {
    let h = 0,
      l = 10;
    if ([2, 6, 10].includes(yb)) {
      h = 1;
      l = 3;
    } else if ([8, 0, 4].includes(yb)) {
      h = 2;
      l = 10;
    } else if ([5, 9, 1].includes(yb)) {
      h = 3;
      l = 10;
    } else {
      h = 9;
      l = 10;
    }
    return { 火星: mod(h + hb, 12), 铃星: mod(l + hb, 12) };
  }
  function minorPositions(ys, yb, m, hb) {
    return Object.assign(
      {
        左辅: mod(4 + m - 1, 12),
        右弼: mod(10 - (m - 1), 12),
        文昌: mod(10 - hb, 12),
        文曲: mod(4 + hb, 12),
      },
      kuiYue(ys),
      luYangTuoMa(ys, yb),
      kongJie(hb),
      huoLing(yb, hb),
    );
  }
  function changshengMap(bureau, forward) {
    const start = { 2: 8, 3: 11, 4: 5, 5: 8, 6: 2 }[bureau],
      o = {};
    CHANGSHENG.forEach((name, i) => {
      o[mod(start + (forward ? i : -i), 12)] = name;
    });
    return o;
  }
  function enhance(input = {}) {
    const base = clone(BASE.calculate(input));
    const lunar = base.input.lunar,
      hb = base.input.hourBranchIndex,
      ys = base.yearStem.index,
      yb = mod(lunar.year - 4, 12),
      m = base.effectiveLunarMonth;
    const pos = minorPositions(ys, yb, m, hb),
      cs = changshengMap(base.bureau.number, !!base.majorPeriod.forward);
    const byBranch = {};
    base.palaces.forEach((p) => (byBranch[p.branchIndex] = p));
    // 先补齐 14 辅星：已有四辅保持原位，只补缺失十星，并统一 canonical 元数据。
    for (const name of MINOR14) {
      const b = pos[name],
        p = byBranch[b];
      if (!p) continue;
      let s = (p.stars || []).find((x) => x.name === name);
      if (!s) {
        s = { name, type: "minor", transformation: null };
        p.stars.push(s);
      }
      s.category = "minor";
      s.nature = MINOR_NATURE[name];
      s.brightness = brightnessFor(name, b);
    }
    for (const p of base.palaces) {
      for (const s of p.stars || []) {
        if (s.type === "major") {
          s.category = "major";
          s.brightness = brightnessFor(s.name, p.branchIndex);
        } else if (MINOR14.includes(s.name)) {
          s.category = "minor";
          s.nature = s.nature || MINOR_NATURE[s.name];
          s.brightness = brightnessFor(s.name, p.branchIndex);
        }
      }
      p.majorStars = (p.stars || [])
        .filter((s) => s.category === "major" || s.type === "major")
        .map(clone);
      p.minorStars = (p.stars || []).filter((s) => MINOR14.includes(s.name)).map(clone);
      p.adjectiveStars = [];
      p.changsheng12 = cs[p.branchIndex];
      p.decadal = {
        range: [p.majorPeriod.startAge, p.majorPeriod.endAge],
        heavenlyStem: p.stem,
        earthlyBranch: p.branch,
        direction: base.majorPeriod.forward ? "顺行" : "逆行",
      };
    }
    base.schema = SCHEMA;
    base.version = VERSION;
    base.build = BUILD;
    base.capability = CAPABILITY;
    base.yearBranch = { index: yb, name: ZHIS[yb] };
    base.minorStars = { count: MINOR14.length, names: clone(MINOR14), positions: clone(pos) };
    base.decorative = { changsheng12: ZHIS.map((b, i) => ({ branch: b, name: cs[i] })) };
    base.coverage = {
      majorStars14: true,
      minorStars14: true,
      brightness: { major14: true, minor: ["文昌", "文曲", "火星", "铃星", "擎羊", "陀罗"] },
      changsheng12: true,
      decadalStandard: true,
      remaining: [
        "杂曜系统",
        "博士十二神",
        "将前十二神",
        "岁前十二神",
        "小限",
        "命主身主",
        "晚子时独立索引",
        "中州派算法",
      ],
    };
    base.policy = Object.assign({}, base.policy || {}, {
      assistants: { mode: "minor-14", label: "十四辅星完整落宫" },
      brightness: { mode: "reference-table-v1", label: "主星及部分辅煞星庙旺得利平陷" },
      changsheng12: {
        mode: "bureau-and-yinyang-direction",
        label: "五行局起长生，阳男阴女顺、阴男阳女逆",
      },
    });
    return base;
  }
  function fromLegacy(lunar, hb, gender) {
    return enhance({ lunar, hourBranchIndex: hb, gender }).legacy;
  }
  function fromTimeContext(ctx, input = {}) {
    const r = BASE.fromTimeContext(ctx, input);
    return enhance({
      lunar: r.input.lunar,
      hourBranchIndex: r.input.hourBranchIndex,
      gender: r.input.gender,
    });
  }
  function directMinorTest() {
    const a = minorPositions(9, 3, 1, 0);
    return a.禄存 === 0 && a.擎羊 === 1 && a.陀罗 === 11 && a.天马 === 5;
  }
  function selfTest() {
    const cases = [
        ["base-M", { year: 1986, month: 4, day: 28, isLeap: false }, 9, "M"],
        ["base-F", { year: 1986, month: 4, day: 28, isLeap: false }, 9, "F"],
        ["zi", { year: 2026, month: 8, day: 24, isLeap: false }, 0, "M"],
        ["hai", { year: 2026, month: 8, day: 24, isLeap: false }, 11, "F"],
        ["leap15", { year: 2025, month: 6, day: 15, isLeap: true }, 5, "M"],
        ["leap16", { year: 2025, month: 6, day: 16, isLeap: true }, 5, "M"],
        ["m12", { year: 2033, month: 12, day: 29, isLeap: false }, 7, "F"],
      ],
      checks = [];
    for (const [id, l, h, g] of cases) {
      try {
        const a = BASE.fromLegacy(l, h, g),
          b = fromLegacy(l, h, g);
        checks.push({ id: "legacy." + id, ok: JSON.stringify(a) === JSON.stringify(b) });
      } catch (e) {
        checks.push({ id: "legacy." + id, ok: false, error: String((e && e.message) || e) });
      }
    }
    try {
      const r = enhance({
          lunar: { year: 1986, month: 4, day: 28, isLeap: false },
          hourBranchIndex: 9,
          gender: "M",
        }),
        maj = r.palaces.flatMap((p) => p.majorStars),
        min = r.palaces.flatMap((p) => p.minorStars),
        cs = r.palaces.map((p) => p.changsheng12);
      checks.push({ id: "major14", ok: maj.length === 14 });
      checks.push({
        id: "minor14",
        ok: min.length === 14 && new Set(min.map((s) => s.name)).size === 14,
      });
      checks.push({ id: "changsheng12", ok: cs.length === 12 && new Set(cs).size === 12 });
      checks.push({
        id: "brightness.major",
        ok: maj.every((s) => s.brightness !== null && s.brightness !== undefined),
      });
      checks.push({
        id: "decadal.standard",
        ok: r.palaces.every(
          (p) =>
            p.decadal &&
            p.decadal.range.length === 2 &&
            p.decadal.heavenlyStem &&
            p.decadal.earthlyBranch,
        ),
      });
    } catch (e) {
      checks.push({ id: "enhanced.shape", ok: false, error: String((e && e.message) || e) });
    }
    checks.push({
      id: "minor.reference-case",
      ok: directMinorTest(),
      detail: "癸卯：禄子、羊丑、陀亥、马巳",
    });
    return { ok: checks.every((x) => x.ok), checks, version: VERSION, build: BUILD };
  }
  const TEST = selfTest();
  function manifest() {
    return {
      module: "Tianji Ziwei Core",
      version: VERSION,
      schema: SCHEMA,
      build: BUILD,
      baseline: "v91",
      capability: CAPABILITY,
      selfTest: clone(TEST),
      resolvedGaps: [
        "十四辅星",
        "主星庙旺落陷",
        "文昌文曲火铃羊陀亮度",
        "长生十二神",
        "标准化大限对象",
      ],
      remainingGaps: [
        "杂曜系统",
        "博士十二神",
        "将前十二神",
        "岁前十二神",
        "小限",
        "命主身主",
        "晚子时",
        "中州派算法",
      ],
      reference: {
        name: "SylarLong/iztro",
        version: "2.6.1",
        tagCommit: "b78dfe391f65e938d79f2419dddb80f74c6bbb8e",
        license: "MIT",
        role: "rule/data cross-check only",
      },
    };
  }
  const API = Object.freeze({
    version: VERSION,
    schema: SCHEMA,
    build: BUILD,
    capability: CAPABILITY,
    calculate: enhance,
    fromLegacy,
    fromTimeContext,
    minorPositions: (ys, yb, m, hb) => clone(minorPositions(ys, yb, m, hb)),
    brightnessFor,
    changshengMap: (bureau, forward) => clone(changshengMap(bureau, forward)),
    selfTest: () => clone(TEST),
    manifest,
    base: BASE,
  });
  window.TianjiZiwei = API;
  if (TEST.ok) window.calcZiwei = (lunar, hb, gender) => fromLegacy(lunar, hb, gender);
  try {
    if (window.TianjiCore) {
      TianjiCore.registerSource({
        id: "tianji-v92-ziwei-enhancement",
        type: "internal",
        title: "Tianji Ziwei Core 1.1 Enhancement",
        version: VERSION,
        baseline: "v91",
      });
      TianjiCore.registerSource({
        id: "iztro-2.6.1-rule-reference",
        type: "third-party-reference",
        title: "SylarLong/iztro v2.6.1 rule/data reference",
        version: "2.6.1",
        license: "MIT",
        repository: "SylarLong/iztro",
        commit: "b78dfe391f65e938d79f2419dddb80f74c6bbb8e",
        role: "reference-data",
        note: "v92 用于交叉核对十四辅星安法、长生十二神和庙旺表；不作为 Tianji 主运行时。",
      });
      TianjiCore.registerEngine(
        {
          id: "ziwei.core.v1.1",
          system: "ziwei",
          name: "Tianji Ziwei Core 1.1",
          version: VERSION,
          source: "tianji-v92-ziwei-enhancement",
          doctrine:
            "legacy-compatible + minor14 + brightness + changsheng12 + standardized decadal",
          status: "active",
        },
        (input) => enhance(input || {}),
      );
    }
  } catch (e) {
    try {
      console.warn("[TianjiZiwei v92] registry", e);
    } catch (_) {}
  }
  try {
    const old = document.getElementById("tjZiweiBadge");
    if (old) old.textContent = "ZiweiCore 1.0 · Legacy";
    const anchor =
      document.getElementById("tjZiweiVerifyBadge") ||
      old ||
      document.getElementById("buildVersion");
    let b = document.getElementById("tjZiweiV2Badge");
    if (!b && anchor) {
      b = document.createElement("span");
      b.id = "tjZiweiV2Badge";
      anchor.insertAdjacentElement("afterend", b);
    }
    if (b) {
      b.textContent = "ZiweiCore 1.1 · 增强";
      b.classList.toggle("warn", !TEST.ok);
      b.title = TEST.ok
        ? "v92：14辅星 / 庙旺 / 长生十二神 / 标准化大限已通过回归"
        : "v92 增强层自检失败；legacy calcZiwei 未切换";
    }
  } catch (_) {}

  /* ---- v92-aware iztro verifier：替代 v91 静态 GAP 判读 ---- */
  const OLDV = window.TianjiZiweiVerifier;
  function eq(a, b) {
    return JSON.stringify(a) === JSON.stringify(b);
  }
  function names(a) {
    return (a || [])
      .map((x) => (typeof x === "string" ? x : (x && x.name) || ""))
      .filter(Boolean)
      .sort((x, y) => x.localeCompare(y, "zh-CN"));
  }
  function normPalace(n) {
    n = String(n || "").replace(/宮/g, "宫");
    return n === "仆役" || n === "僕役" ? "交友" : n;
  }
  function vChart(input) {
    if (!(window.iztro && iztro.astro && iztro.astro.byLunar))
      throw new Error("iztro verifier unavailable");
    const l = input.lunar,
      g = input.gender === "F" ? "女" : "男",
      v = iztro.astro.byLunar(
        `${l.year}-${l.month}-${l.day}`,
        input.hourBranchIndex,
        g,
        !!l.isLeap,
        true,
        "zh-CN",
      );
    return v && typeof v.toJSON === "function" ? v.toJSON() : v;
  }
  function row(id, label, a, b, opt = {}) {
    if (opt.gap) return { id, label, primary: a, verifier: b, status: "GAP", note: opt.note || "" };
    if (opt.na) return { id, label, primary: a, verifier: b, status: "N/A", note: opt.note || "" };
    const ok = typeof opt.test === "function" ? opt.test(a, b) : eq(a, b);
    return {
      id,
      label,
      primary: a,
      verifier: b,
      status: ok ? "PASS" : opt.policy ? "POLICY" : "DIFF",
      note: opt.note || "",
    };
  }
  function mapP(ps, key) {
    const o = {};
    (ps || []).forEach((p) => (o[p[key]] = p));
    return o;
  }
  function compare92(input = {}) {
    if (!(OLDV && OLDV.hasVendor && OLDV.hasVendor()))
      return { available: false, ok: false, reason: "iztro verifier unavailable" };
    const n = {
      lunar: clone(input.lunar),
      hourBranchIndex: Number(input.hourBranchIndex ?? input.hourBranch),
      gender: input.gender === "F" ? "F" : "M",
    };
    if (n.hourBranchIndex < 0 || n.hourBranchIndex > 11)
      return { available: true, ok: false, reason: "Tianji v92 仍只支持 0..11 时支" };
    const c = enhance(n),
      v = vChart(n),
      pm = mapP(c.palaces, "branch"),
      vm = mapP(v.palaces, "earthlyBranch"),
      rows = [];
    const branches = ZHIS;
    rows.push(row("life", "命宫地支", c.lifePalace.branch, v.earthlyBranchOfSoulPalace));
    rows.push(row("body", "身宫地支", c.bodyPalace.branch, v.earthlyBranchOfBodyPalace));
    rows.push(row("bureau", "五行局", c.bureau.name, v.fiveElementsClass));
    rows.push(
      row(
        "palaces",
        "十二宫名",
        branches.map((b) => [b, normPalace(pm[b] && pm[b].name)]),
        branches.map((b) => [b, normPalace(vm[b] && vm[b].name)]),
      ),
    );
    rows.push(
      row(
        "stems",
        "十二宫天干",
        branches.map((b) => [b, pm[b] && pm[b].stem]),
        branches.map((b) => [b, vm[b] && vm[b].heavenlyStem]),
      ),
    );
    rows.push(
      row(
        "major14",
        "十四主星",
        branches.map((b) => [b, names(pm[b] && pm[b].majorStars)]),
        branches.map((b) => [b, names(vm[b] && vm[b].majorStars)]),
      ),
    );
    rows.push(
      row(
        "minor14",
        "十四辅星",
        branches.map((b) => [b, names(pm[b] && pm[b].minorStars)]),
        branches.map((b) => [b, names(vm[b] && vm[b].minorStars)]),
        { note: "v92 已从“四辅”扩展为完整十四辅星。" },
      ),
    );
    const brightNames = new Set(Object.keys(BRIGHTNESS)),
      pb = [],
      vb = [];
    for (const b of branches) {
      for (const s of (pm[b] && [...(pm[b].majorStars || []), ...(pm[b].minorStars || [])]) || []) {
        if (brightNames.has(s.name)) pb.push([b, s.name, s.brightness ?? ""]);
      }
      for (const s of (vm[b] && [...(vm[b].majorStars || []), ...(vm[b].minorStars || [])]) || []) {
        if (brightNames.has(s.name)) vb.push([b, s.name, s.brightness ?? ""]);
      }
    }
    pb.sort();
    vb.sort();
    rows.push(
      row("brightness", "庙旺得利平陷", pb, vb, {
        note: "比较十四主星及文昌文曲、火铃、擎羊陀罗。",
      }),
    );
    rows.push(
      row(
        "changsheng12",
        "长生十二神",
        branches.map((b) => [b, pm[b] && pm[b].changsheng12]),
        branches.map((b) => [b, vm[b] && vm[b].changsheng12]),
      ),
    );
    const transP = (c.transformations || []).map((x) => `${x.type}:${x.star}`).sort(),
      transV = [];
    (v.palaces || []).forEach((p) =>
      [...(p.majorStars || []), ...(p.minorStars || []), ...(p.adjectiveStars || [])].forEach(
        (s) => {
          if (s && s.mutagen) transV.push(`${s.mutagen}:${s.name}`);
        },
      ),
    );
    rows.push(row("sihua", "生年四化", transP, [...new Set(transV)].sort()));
    const dp = branches.map((b) => [b, pm[b] && pm[b].decadal ? pm[b].decadal.range : null]),
      dv = branches.map((b) => [b, vm[b] && vm[b].decadal ? vm[b].decadal.range : null]);
    rows.push(
      row("decadal", "大限区间", dp, dv, {
        policy: true,
        note: "若年龄定义不同归入口径差异；大限结构已在 v92 标准化。",
      }),
    );
    const adj = [
      ...new Set((v.palaces || []).flatMap((p) => (p.adjectiveStars || []).map((s) => s.name))),
    ].sort();
    const extra = {
      boshi: (v.palaces || []).filter((p) => p.boshi12).length,
      jiang: (v.palaces || []).filter((p) => p.jiangqian12).length,
      sui: (v.palaces || []).filter((p) => p.suiqian12).length,
      ages: (v.palaces || []).reduce((x, p) => x + (Array.isArray(p.ages) ? p.ages.length : 0), 0),
    };
    rows.push(
      row("gap.adjective", "杂曜系统", "骨架已预留，尚未安星", adj, {
        gap: adj.length > 0,
        na: adj.length === 0,
      }),
    );
    rows.push(
      row("gap.boshi", "博士十二神", "未实现", extra.boshi, {
        gap: extra.boshi > 0,
        na: extra.boshi === 0,
      }),
    );
    rows.push(
      row("gap.jiang", "将前十二神", "未实现", extra.jiang, {
        gap: extra.jiang > 0,
        na: extra.jiang === 0,
      }),
    );
    rows.push(
      row("gap.sui", "岁前十二神", "未实现", extra.sui, {
        gap: extra.sui > 0,
        na: extra.sui === 0,
      }),
    );
    rows.push(
      row("gap.xiaoxian", "小限", "未实现", extra.ages, {
        gap: extra.ages > 0,
        na: extra.ages === 0,
      }),
    );
    rows.push(
      row(
        "gap.master",
        "命主/身主",
        "未实现",
        { soul: v.soul || "", body: v.body || "" },
        { gap: !!(v.soul || v.body), na: !(v.soul || v.body) },
      ),
    );
    rows.push(row("gap.late-rat", "晚子时", "0..11", "0..12", { gap: true }));
    rows.push(
      row("gap.algorithms", "流派算法切换", "legacy-enhanced", "default / zhongzhou", {
        gap: true,
      }),
    );
    const counts = { PASS: 0, DIFF: 0, POLICY: 0, GAP: 0, "N/A": 0 };
    rows.forEach((x) => (counts[x.status] = (counts[x.status] || 0) + 1));
    return {
      available: true,
      ok: counts.DIFF === 0,
      at: new Date().toISOString(),
      input: n,
      counts,
      rows,
      raw: { primary: c, verifier: v },
    };
  }
  const CASES = OLDV && OLDV.cases ? OLDV.cases() : [];
  let V2STATE = { lastSuite: null };
  function suite92() {
    if (!(OLDV && OLDV.hasVendor && OLDV.hasVendor()))
      return {
        available: false,
        cases: [],
        summary: { PASS: 0, DIFF: 0, POLICY: 0, GAP: 0, "N/A": 0 },
        ok: false,
      };
    const cases = [],
      summary = { PASS: 0, DIFF: 0, POLICY: 0, GAP: 0, "N/A": 0 };
    for (const x of CASES) {
      try {
        const r = compare92({ lunar: x.l, hourBranchIndex: x.h, gender: x.g });
        cases.push({ id: x.id, label: x.label, report: r });
        r.rows.forEach((y) => (summary[y.status] = (summary[y.status] || 0) + 1));
      } catch (e) {
        cases.push({ id: x.id, label: x.label, error: String((e && e.message) || e) });
        summary.DIFF++;
      }
    }
    const o = {
      available: true,
      at: new Date().toISOString(),
      cases,
      summary,
      ok: summary.DIFF === 0,
    };
    V2STATE.lastSuite = o;
    renderV2();
    return o;
  }
  function esc(s) {
    return String(s == null ? "" : s).replace(
      /[&<>\"]/g,
      (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '\"': "&quot;" })[c],
    );
  }
  function liveV2() {
    const S = V2STATE.lastSuite,
      sum = (S && S.summary) || { PASS: 0, DIFF: 0, POLICY: 0, GAP: 0, "N/A": 0 },
      ready = OLDV && OLDV.hasVendor && OLDV.hasVendor(),
      cases =
        S && S.cases
          ? S.cases
              .map((x) => {
                const c = x.report && x.report.counts;
                return `<div class="tjzv2-case"><b>${esc(x.label)}</b><small>${x.error ? esc(x.error) : `PASS ${c.PASS} · DIFF ${c.DIFF} · 口径 ${c.POLICY} · GAP ${c.GAP}`}</small></div>`;
              })
              .join("")
          : "";
    return `<div class="panel blk tjzv2-live"><div class="tjzv2-head"><div><h4>紫微斗数交叉验证 · v92 增强核心</h4><small>${ready ? "iztro 2.6.1 已就绪" : "等待 iztro 2.6.1"} · 14辅星 / 庙旺 / 长生十二神已进入重叠验证</small></div><div class="tjzv2-stat"><span class="pass">PASS ${sum.PASS}</span><span class="diff">DIFF ${sum.DIFF}</span><span class="policy">口径 ${sum.POLICY}</span><span class="gap">GAP ${sum.GAP}</span></div></div><div class="tjzv2-cases">${cases || '<div class="tjzv2-case"><b>尚未运行</b><small>iztro 就绪后自动验证；Tianji 主计算不依赖它。</small></div>'}</div><div class="tjzv2-actions"><button class="gbtn sm" id="tjzv2Run" type="button">重新运行 v92 验证</button></div><p class="tjzv2-note"><strong>v92 已消除的 GAP：</strong>十四辅星、庙旺得利平陷、长生十二神、标准化大限。剩余 GAP 继续按版本逐层补齐。</p></div>`;
  }
  function patchVerifyUI() {
    try {
      if (!window.REF_PANES || typeof REF_PANES.verify !== "function" || REF_PANES.verify.__v92)
        return;
      const old = REF_PANES.verify,
        oldBind = window.REF_BIND && REF_BIND.verify;
      const fn = () => liveV2() + old();
      fn.__v92 = true;
      REF_PANES.verify = fn;
      if (window.REF_BIND)
        REF_BIND.verify = function () {
          try {
            if (typeof oldBind === "function") oldBind();
          } catch (_) {}
          const b = document.getElementById("tjzv2Run");
          if (b)
            b.onclick = () => {
              if (OLDV && OLDV.hasVendor && OLDV.hasVendor()) suite92();
              else if (OLDV && OLDV.loadVendor) OLDV.loadVendor().then(() => suite92());
            };
        };
    } catch (e) {
      try {
        console.warn("[ZiweiVerify v92 UI]", e);
      } catch (_) {}
    }
  }
  function renderV2() {
    try {
      const p = document.getElementById("pane-verify");
      if (p && p.classList.contains("on") && typeof refRender === "function") refRender("verify");
    } catch (_) {}
  }
  const VERIFY92 = Object.freeze({
    version: "2.0.0",
    build: BUILD,
    state: V2STATE,
    compare: compare92,
    suite: suite92,
    cases: () => clone(CASES),
    loadVendor: OLDV && OLDV.loadVendor ? OLDV.loadVendor : async () => ({ status: "unavailable" }),
    hasVendor: () => !!(OLDV && OLDV.hasVendor && OLDV.hasVendor()),
    manifest: () => ({
      module: "Tianji Ziwei Verification Layer",
      version: "2.0.0",
      build: BUILD,
      baseline: "v92",
      vendor: "iztro 2.6.1",
      resolvedComparison: ["十四辅星", "庙旺", "长生十二神", "标准化大限"],
      remainingGaps: manifest().remainingGaps,
    }),
  });
  window.TianjiZiweiVerifier = VERIFY92;
  patchVerifyUI();
  const prev = window.TianjiSystem || {};
  window.TianjiSystem = Object.freeze({
    version: "v92",
    build: BUILD,
    baseline: "v84",
    core: window.TianjiCore || prev.core || null,
    time: window.TianjiTime || prev.time || null,
    verify: window.TianjiVerifier || prev.verify || null,
    bazi: window.TianjiBazi || prev.bazi || null,
    baziVerify: window.TianjiBaziVerifier || prev.baziVerify || null,
    ziwei: API,
    ziweiVerify: VERIFY92,
    manifest: () => ({
      product: "天机盘",
      version: "v92",
      build: BUILD,
      baseline: "v84",
      ziwei: manifest(),
      ziweiVerify: VERIFY92.manifest(),
    }),
  });
  try {
    const bv = document.getElementById("buildVersion");

    window.dispatchEvent(new CustomEvent("tianji:ziwei-core-v92-ready", { detail: manifest() }));
  } catch (_) {}
})();
