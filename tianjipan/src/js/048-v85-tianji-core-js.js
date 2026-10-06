(() => {
  "use strict";
  const BUILD = "2026-10-04 03:31:00";
  const BASELINE = {
    version: "v84",
    file: "天机盘_修改84_内置真实空间3D人体_离线稳定版.html",
    build: "2026-10-04 03:30:18",
  };
  const CORE_VERSION = "1.0.0";
  const SCHEMA_VERSION = "1.0.0";
  const STORAGE_KEY = "tianjipan.core.config.v1";

  const clone = (v) => {
    try {
      return structuredClone(v);
    } catch (_) {
      return JSON.parse(JSON.stringify(v));
    }
  };
  const stableStringify = (v) => {
    const seen = new WeakSet();
    const walk = (x) => {
      if (x === null || typeof x !== "object") return x;
      if (seen.has(x)) return "[Circular]";
      seen.add(x);
      if (Array.isArray(x)) return x.map(walk);
      return Object.keys(x)
        .sort()
        .reduce((o, k) => ((o[k] = walk(x[k])), o), {});
    };
    return JSON.stringify(walk(v));
  };
  const hash = (v) => {
    let h = 2166136261,
      s = stableStringify(v);
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return ("00000000" + (h >>> 0).toString(16)).slice(-8);
  };

  const DEFAULT_CONFIG = {
    time: {
      timezone: "Asia/Shanghai",
      civilStandard: "UTC+08:00",
      trueSolarTime: { enabled: false, longitude: 120 },
      dayBoundary: { mode: "ziEarly", hour: 23, label: "子初换日" },
      yearBoundary: { mode: "lichun", label: "立春换年" },
      monthBoundary: { mode: "jie", label: "以节换月" },
    },
    doctrine: {
      bazi: { id: "legacy-common", label: "v84 现有通行子平口径" },
      ziwei: { id: "legacy-simplified", label: "v84 现有紫微简盘口径" },
      qimen: { id: "shijia-zhuanpan-chaibu", label: "时家奇门 · 转盘 · 拆补法" },
      liuren: { id: "legacy-current", label: "v84 现有六壬口径" },
    },
    audit: { trace: true, includeEngineMeta: true, includeSourceMeta: true },
  };
  function mergeInto(a, b) {
    for (const [k, v] of Object.entries(b || {})) {
      if (["__proto__", "prototype", "constructor"].includes(k)) continue;
      if (v && typeof v === "object" && !Array.isArray(v)) {
        a[k] = a[k] && typeof a[k] === "object" ? a[k] : {};
        mergeInto(a[k], v);
      } else a[k] = v;
    }
    return a;
  }
  function loadConfig() {
    try {
      const x = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      return x && typeof x === "object"
        ? mergeInto(clone(DEFAULT_CONFIG), x)
        : clone(DEFAULT_CONFIG);
    } catch (_) {
      return clone(DEFAULT_CONFIG);
    }
  }
  let config = loadConfig();
  function saveConfig() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    } catch (_) {}
  }
  function setConfig(patch) {
    config = mergeInto(clone(config), patch || {});
    saveConfig();
    return clone(config);
  }

  const engines = new Map();
  const sources = new Map();
  const licenses = new Map();
  const rules = new Map();
  function registerRule(x) {
    if (!x || typeof x.id !== "string" || !x.id)
      throw new Error("TianjiCore.registerRule: id required");
    rules.set(x.id, Object.freeze({ ...x }));
    return x.id;
  }
  function registerSource(x) {
    if (!x || !x.id) throw new Error("TianjiCore.registerSource: id required");
    sources.set(x.id, Object.freeze({ ...x }));
    return x.id;
  }
  function registerLicense(x) {
    if (!x || !x.id) throw new Error("TianjiCore.registerLicense: id required");
    licenses.set(x.id, Object.freeze({ ...x }));
    return x.id;
  }
  function registerEngine(meta, run) {
    if (!meta || !meta.id || typeof run !== "function")
      throw new Error("TianjiCore.registerEngine: meta.id + run required");
    const m = Object.freeze({ deterministic: true, status: "active", ...meta });
    engines.set(m.id, { meta: m, run });
    return m.id;
  }
  function runEngine(id, input, context = {}) {
    const e = engines.get(id);
    if (!e) throw new Error("Unknown Tianji engine: " + id);
    const started = performance.now(),
      result = e.run(input, context);
    return {
      engine: e.meta,
      result,
      audit: {
        inputHash: hash(input),
        contextHash: hash(context),
        elapsedMs: +(performance.now() - started).toFixed(3),
        generatedAt: new Date().toISOString(),
      },
    };
  }
  function envelope(input, outputs = {}, extra = {}) {
    const now = new Date().toISOString();
    return {
      schema: "tianji.calculation",
      schemaVersion: SCHEMA_VERSION,
      coreVersion: CORE_VERSION,
      build: BUILD,
      baseline: clone(BASELINE),
      calculationId: "tj-" + Date.now().toString(36) + "-" + hash({ input, outputs, now }),
      generatedAt: now,
      input: clone(input),
      context: clone(config),
      outputs: clone(outputs),
      provenance: {
        engines: [...engines.values()].map((x) => x.meta),
        sources: [...sources.values()],
        rules: [...rules.values()],
        licenses: [...licenses.values()],
      },
      ...clone(extra),
    };
  }

  /* 第三方候选台账：只是集成决策登记，不表示相应代码已引入。正式集成前再次核验上游 LICENSE。 */
  [
    ["lunar-javascript", "MIT", "candidate", "历法基础候选"],
    ["iztro", "MIT", "candidate", "紫微斗数候选"],
    ["mingpan", "Apache-2.0", "candidate", "MCP / 多术数引擎参考"],
    ["mystilight-8char", "ISC", "candidate", "八字/神煞交叉校验候选"],
    ["qfdk-qimen", "MIT", "candidate", "奇门模块化实现参考"],
    ["taibu", "MIT + AGPL-3.0 (mixed)", "conditional", "仅可按具体目录/文件许可证评估"],
    ["cnlunar", "GPL-3.0", "reference-only", "闭源商业核心不直接并入"],
    ["bazaar-of-fates", "license-unverified", "research-only", "未完成许可证核验前不复制代码"],
    [
      "astrologylib",
      "mixed: public-domain / MIT / CC-BY-SA",
      "conditional",
      "按数据/代码/译文分别处理",
    ],
    ["ctext", "rights-vary", "external-reference", "引用与使用范围按具体文本权利说明处理"],
  ].forEach(([id, license, status, note]) =>
    registerLicense({ id, license, status, note, checkedAt: "2026-10-04" }),
  );

  registerSource({
    id: "tianji-v84-internal",
    type: "internal",
    title: "天机盘 v84 完整现有算法与交互",
    version: BASELINE.build,
    baseline: "v84",
    note: "v85 不改变 v84 计算结果与界面功能，仅通过适配器注册统一核心接口。",
  });

  /* 将 v84 现有全局算法作为 legacy adapter 注册。后续逐层替换、双引擎核验，不一次性重写。 */
  try {
    if (typeof calcTime === "function")
      registerEngine(
        {
          id: "time.legacy",
          system: "calendar",
          name: "v84 现有时间/真太阳时核心",
          version: "v84",
          source: "tianji-v84-internal",
          doctrine: "UTC+8 / 可选真太阳时",
        },
        (input) => calcTime(input.civ, input.opt || {}),
      );
  } catch (_) {}
  try {
    if (typeof calcBazi === "function")
      registerEngine(
        {
          id: "bazi.legacy",
          system: "bazi",
          name: "v84 现有八字排盘核心",
          version: "v84",
          source: "tianji-v84-internal",
          doctrine: "子初23:00换日",
        },
        (input) => calcBazi(input.time, input.gender),
      );
  } catch (_) {}
  try {
    if (typeof calcQimen === "function")
      registerEngine(
        {
          id: "qimen.legacy",
          system: "qimen",
          name: "v84 现有奇门核心",
          version: "v84",
          source: "tianji-v84-internal",
          doctrine: "时家奇门 · 转盘 · 拆补法",
        },
        (input) => calcQimen(input.lon, input.dayIdx, input.hourIdx, input.lonFu),
      );
  } catch (_) {}
  try {
    if (typeof calcZiwei === "function")
      registerEngine(
        {
          id: "ziwei.legacy",
          system: "ziwei",
          name: "v84 现有紫微简盘核心",
          version: "v84",
          source: "tianji-v84-internal",
          doctrine: "现有简盘口径",
        },
        (input) => calcZiwei(input.lunar, input.hourBranch, input.gender),
      );
  } catch (_) {}
  try {
    if (typeof calcMeihua === "function")
      registerEngine(
        {
          id: "meihua.legacy",
          system: "meihua",
          name: "v84 现有梅花易数核心",
          version: "v84",
          source: "tianji-v84-internal",
        },
        (input) => calcMeihua(input.lunar, input.hourBranch),
      );
  } catch (_) {}
  try {
    if (typeof computeAll === "function")
      registerEngine(
        {
          id: "tianji.legacy-all",
          system: "aggregate",
          name: "v84 现有全盘聚合计算",
          version: "v84",
          source: "tianji-v84-internal",
        },
        (input) => computeAll(input.civ, input.opt || {}),
      );
  } catch (_) {}

  function selfTest() {
    const checks = [
      ["core.schema", SCHEMA_VERSION === "1.0.0"],
      ["core.registry", engines.size >= 5],
      ["core.config", !!(config && config.time && config.time.dayBoundary)],
      ["baseline.v84", BASELINE.version === "v84"],
      ["legacy.calcTime", typeof calcTime === "function"],
      ["legacy.calcBazi", typeof calcBazi === "function"],
      ["legacy.calcQimen", typeof calcQimen === "function"],
      ["legacy.calcZiwei", typeof calcZiwei === "function"],
      ["legacy.calcMeihua", typeof calcMeihua === "function"],
    ].map(([id, ok]) => ({ id, ok: !!ok }));
    return {
      ok: checks.every((x) => x.ok),
      checks,
      engineCount: engines.size,
      sourceCount: sources.size,
      licenseCount: licenses.size,
    };
  }
  function manifest() {
    return {
      product: "天机盘",
      build: BUILD,
      baseline: clone(BASELINE),
      coreVersion: CORE_VERSION,
      schemaVersion: SCHEMA_VERSION,
      config: clone(config),
      engines: [...engines.values()].map((x) => x.meta),
      sources: [...sources.values()],
      rules: [...rules.values()],
      licenses: [...licenses.values()],
      selfTest: selfTest(),
    };
  }

  window.TianjiCore = Object.freeze({
    version: CORE_VERSION,
    schemaVersion: SCHEMA_VERSION,
    build: BUILD,
    baseline: clone(BASELINE),
    getConfig: () => clone(config),
    setConfig,
    listEngines: () => [...engines.values()].map((x) => x.meta),
    listSources: () => [...sources.values()],
    listLicenses: () => [...licenses.values()],
    registerRule,
    listRules: () => [...rules.values()],
    registerEngine,
    registerSource,
    registerLicense,
    runEngine,
    envelope,
    manifest,
    selfTest,
  });

  /* 极轻量状态标记：不改变 v84 主界面结构。 */
  try {
    const t = selfTest(),
      bv = document.getElementById("buildVersion");
    if (bv) {
      let badge = document.getElementById("tjCoreBadge");
      if (!badge) {
        badge = document.createElement("span");
        badge.id = "tjCoreBadge";
        bv.insertAdjacentElement("afterend", badge);
      }
      badge.textContent = "Core " + CORE_VERSION + " · Schema " + SCHEMA_VERSION;
      badge.classList.toggle("warn", !t.ok);
      badge.title = t.ok ? "v85 核心层已就绪 · 基线 v84" : "v85 核心层有未通过自检项";
    }
  } catch (_) {}
  try {
    window.dispatchEvent(new CustomEvent("tianji:core-ready", { detail: manifest() }));
  } catch (_) {}
})();
