(() => {
  "use strict";
  const BUILD = "v211 · 2026-10-06 14:02 +08:00";
  const SCHEMA = "tianji.time.migration.v1";
  let LAST = null,
    BATCH = null;

  const clone = (x) => (x == null ? x : JSON.parse(JSON.stringify(x)));
  const E = (s) =>
    String(s ?? "").replace(
      /[&<>"']/g,
      (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
    );
  const r6 = (x) => (Number.isFinite(+x) ? +(+x).toFixed(6) : null);
  const fmtPill = (R0) => R0?.bz?.pill?.map((p) => GAN[p.s] + ZHI[p.b]).join(" ") || "—";
  const fmtMh = (R0) =>
    R0?.mh
      ? `${R0.mh.ben?.name || "—"}→${R0.mh.bian?.name || "—"} · 动${R0.mh.mv || "—"} · 体${R0.mh.ti}/用${R0.mh.yong}`
      : "—";
  const fmtLr = (R0) =>
    R0?.lr
      ? `${R0.lr.ge} · ${R0.lr.chu?.map((x) => ZHI[x.z]).join("→") || "—"} · 月将${ZHI[R0.lr.zj]} · 时${ZHI[R0.lr.hb]}`
      : "—";

  function rawCompute(civ) {
    const o = readOpts(),
      r = computeAll(civ, o);
    qimenPlus(r.qm, r);
    r.deep = baziDeep(r.bz);
    ziweiPlus(r.zw, r.lunar, r.bz.pill[3].b, o.gender);
    r.lr = liuren(r.bz.dayIdx, r.bz.pill[3].b, liurenYueJiang(r.t.lon));
    ziweiAdj(r.zw, r.lunar, r.bz.pill[3].b, o.gender);
    const pl = asPlanets(r.t.jdUT);
    r.astro = {
      planets: pl,
      aspects: asAspects(pl),
      angles: asAngles(r.t.jdUT, o.lon, o.lat),
      moon: asMoonPhase(pl[0].lon, pl[1].lon),
      helio: asHelioAll(r.t.jdUT),
      yq: wuyunLiuqi(ganzhiIdx(r.bz.pill[0].s, r.bz.pill[0].b), r.t.lon),
    };
    return r;
  }
  function historicalRaw(civ, A) {
    if (!A?.available) throw new Error(A?.reason || "历史时间未解析");
    const b = A.clocks?.legacyBridgeUTC8;
    if (!b) throw new Error("缺少 UTC+8 兼容桥");
    const bc = { y: +b.y, m: +b.m, d: +b.d, h: +b.h, mi: +b.mi, s: +(b.s || 0) };
    const r = rawCompute(bc);
    r.timeAudit = clone(A);
    r.timeMode = "historical-regression-v211";
    r.inputCivil = clone(civ);
    return r;
  }
  function westernSig(R0) {
    try {
      const o = readOpts(),
        C = a2Chart(R0.t.jdUT, +o.lon || 120, +o.lat || 24.5, "placidus");
      return {
        asc: r6(C.A.asc),
        mc: r6(C.A.mc),
        cusps: C.cusps.map(r6),
        planets: C.planets.map((p) => ({
          n: p.n,
          sign: p.sign,
          house: p.house,
          lon: r6(p.lon),
          retro: !!p.retro,
        })),
      };
    } catch (err) {
      return { error: String(err?.message || err) };
    }
  }
  function vedicSig(R0) {
    try {
      const o = readOpts(),
        V = v2Chart(R0.t.jdUT, +o.lon || 120, +o.lat || 24.5);
      return {
        ay: r6(V.ay),
        lagna: {
          sign: V.lagna.sign,
          deg: r6(V.lagna.deg),
          nak: V.lagna.nak?.name,
          pada: V.lagna.nak?.pada,
          nv: V.lagna.nv,
        },
        planets: V.planets.map((p) => ({
          k: p.k,
          sign: p.sign,
          deg: r6(p.deg),
          nak: p.nak?.name,
          pada: p.nak?.pada,
          nv: p.nv,
          retro: !!p.retro,
        })),
      };
    } catch (err) {
      return { error: String(err?.message || err) };
    }
  }
  function qizhengSig(R0) {
    try {
      const Q = qzCalc(R0);
      return {
        mingZhi: Q.mingZhi,
        mingZhu: Q.mingZhu,
        mingDuZhu: Q.mingDuZhu,
        mingDuXiu: `${Q.mingDuXiu?.name || "—"}${r6(Q.mingDuXiu?.du)}`,
        shenA: Q.shenA,
        shenB: Q.shenB,
        isDay: Q.isDay,
        stars: Q.stars.map((s) => ({
          n: s.n,
          lon: r6(s.lon),
          gong: s.gong?.zhi,
          xiu: s.xiu?.name,
          xiuDu: r6(s.xiu?.du),
          retro: !!s.retro,
        })),
      };
    } catch (err) {
      return { error: String(err?.message || err) };
    }
  }
  function signatures(R0) {
    return {
      bazi: { text: fmtPill(R0), day: R0.bz?.dayIdx, hour: R0.bz?.hourIdx },
      qimen: {
        text: `${R0.qm?.yang ? "阳" : "阴"}遁${R0.qm?.ju}局 · ${R0.qm?.k || ""}`,
        ju: R0.qm?.ju,
        yang: !!R0.qm?.yang,
        k: R0.qm?.k,
      },
      liuren: {
        text: fmtLr(R0),
        ge: R0.lr?.ge,
        chu: R0.lr?.chu?.map((x) => x.z),
        zj: R0.lr?.zj,
        hb: R0.lr?.hb,
      },
      meihua: {
        text: fmtMh(R0),
        ben: R0.mh?.ben?.name,
        bian: R0.mh?.bian?.name,
        mv: R0.mh?.mv,
        ti: R0.mh?.ti,
        yong: R0.mh?.yong,
      },
      ziwei: {
        text: `命${ZHI[R0.zw?.ming]} 身${ZHI[R0.zw?.shen]} ${R0.zw?.juName || ""}`,
        ming: R0.zw?.ming,
        shen: R0.zw?.shen,
        ju: R0.zw?.juName,
      },
      western: westernSig(R0),
      vedic: vedicSig(R0),
      qizheng: qizhengSig(R0),
      wuyun: {
        text: `${R0.astro?.yq?.gz || "—"} ${R0.astro?.yq?.yunName || "—"} · ${R0.astro?.yq?.siTian || "—"}/${R0.astro?.yq?.zaiQuan || "—"}`,
        gz: R0.astro?.yq?.gz,
        yun: R0.astro?.yq?.yunName,
        siTian: R0.astro?.yq?.siTian,
        zaiQuan: R0.astro?.yq?.zaiQuan,
        step: R0.astro?.yq?.step,
      },
      astro: {
        sun: r6(R0.astro?.planets?.[0]?.lon),
        moon: r6(R0.astro?.planets?.[1]?.lon),
        asc: r6(R0.astro?.angles?.asc),
        mc: r6(R0.astro?.angles?.mc),
      },
    };
  }
  function same(a, b) {
    return JSON.stringify(a) === JSON.stringify(b);
  }
  function short(v) {
    if (v == null) return "—";
    if (typeof v === "string") return v;
    const s = JSON.stringify(v);
    return s.length > 180 ? s.slice(0, 177) + "…" : s;
  }
  const MODULES = [
    ["bazi", "八字", "high"],
    ["qimen", "奇门时家", "high"],
    ["liuren", "大六壬", "high"],
    ["meihua", "梅花易数", "medium"],
    ["ziwei", "紫微斗数", "high"],
    ["western", "西方本命星盘", "high"],
    ["vedic", "吠陀占星", "high"],
    ["qizheng", "七政四余", "high"],
    ["wuyun", "五运六气", "medium"],
    ["astro", "天文角度", "medium"],
  ];
  function extendedRegression() {
    const civ = (() => {
        try {
          return parseDt();
        } catch (_) {
          return null;
        }
      })(),
      A = TianjiHistoricalTime?.analyzeCurrent?.();
    if (!civ)
      return { schema: SCHEMA, build: BUILD, available: false, reason: "当前档案没有有效出生时间" };
    if (!A?.available)
      return {
        schema: SCHEMA,
        build: BUILD,
        available: false,
        reason: A?.reason || "历史时区未唯一解析",
        audit: A,
      };
    const t0 = performance.now(),
      L = rawCompute(civ),
      t1 = performance.now(),
      H = historicalRaw(civ, A),
      t2 = performance.now();
    const ls = signatures(L),
      hs = signatures(H);
    const rows = MODULES.map(([id, name, severity]) => {
      const changed = !same(ls[id], hs[id]);
      return { id, name, severity, changed, legacy: clone(ls[id]), historical: clone(hs[id]) };
    });
    const changed = rows.filter((x) => x.changed),
      high = changed.filter((x) => x.severity === "high");
    return {
      schema: SCHEMA,
      build: BUILD,
      available: true,
      audit: A,
      input: {
        civil: clone(civ),
        zone: A.zone,
        offsetMinutes: A.offsetMinutes,
        bridge: clone(A.clocks?.legacyBridgeUTC8),
        legacyDeltaMinutes: A.correction?.legacyInstantDeltaMinutes,
      },
      rows,
      summary: {
        modules: rows.length,
        changed: changed.length,
        highImpact: high.length,
        verdict: high.length ? "migration-required" : changed.length ? "review" : "same",
        legacyMs: +(t1 - t0).toFixed(1),
        historicalMs: +(t2 - t1).toFixed(1),
      },
      boundaries: [
        "七政四余当前仍是 workbench 口径；这里只比较其时间输入变化，不提升其算法验证等级。",
        "西占与吠陀比较本命核心结构；太阳回归、次限、组合盘和 Vimshottari 当前时刻进度不在此表里做迁移判定。",
        "五运六气比较年运与当前气步；它不是医学或天气预测。",
      ],
    };
  }
  function standardParityCase(civ, zone, lon, lat, label) {
    const A = TianjiHistoricalTime.resolve(civ, {
      zone,
      longitude: lon,
      latitude: lat,
      solar: false,
    });
    if (!A.available) return { label, ok: false, status: A.status, reason: A.reason };
    const bridge = A.clocks.legacyBridgeUTC8;
    const exact =
      bridge.y === civ.y &&
      bridge.m === civ.m &&
      bridge.d === civ.d &&
      bridge.h === civ.h &&
      bridge.mi === civ.mi;
    if (!exact)
      return {
        label,
        ok: false,
        status: "bridge-not-identical",
        bridge: clone(bridge),
        input: clone(civ),
      };
    const L = signatures(rawCompute(civ)),
      H = signatures(historicalRaw(civ, A));
    const bad = MODULES.filter(([id]) => !same(L[id], H[id])).map((x) => x[0]);
    return {
      label,
      ok: bad.length === 0,
      status: bad.length ? "module-diff" : "pass",
      bad,
      offsetMinutes: A.offsetMinutes,
    };
  }
  function conversionCase(civ, zone, lon, lat, label, expect) {
    const A = TianjiHistoricalTime.resolve(civ, {
      zone,
      longitude: lon,
      latitude: lat,
      solar: false,
      choice: expect.choice || "earlier",
    });
    let ok = true,
      why = [];
    if (expect.available === false) {
      ok = !A.available;
      if (!ok) why.push("expected unavailable");
    } else {
      ok = !!A.available;
      if (expect.offset != null && A.offsetMinutes !== expect.offset) {
        ok = false;
        why.push(`offset ${A.offsetMinutes} != ${expect.offset}`);
      }
      if (expect.ambiguous != null && !!A.ambiguous !== expect.ambiguous) {
        ok = false;
        why.push("ambiguous mismatch");
      }
      if (expect.bridgeHour != null && A.clocks?.legacyBridgeUTC8?.h !== expect.bridgeHour) {
        ok = false;
        why.push("bridge hour mismatch");
      }
    }
    return {
      label,
      ok,
      status: A.status,
      why,
      offsetMinutes: A.offsetMinutes,
      ambiguous: A.ambiguous,
      bridge: A.clocks?.legacyBridgeUTC8?.text || null,
    };
  }
  function batchSuite() {
    const cases = [];
    cases.push(
      standardParityCase(
        { y: 1992, m: 6, d: 5, h: 17, mi: 30, s: 0 },
        "Asia/Shanghai",
        121.47,
        31.23,
        "上海 1992 标准 UTC+8 · 全模块等价",
      ),
    );
    cases.push(
      standardParityCase(
        { y: 2026, m: 10, d: 6, h: 12, mi: 0, s: 0 },
        "Asia/Shanghai",
        116.4,
        39.9,
        "北京 2026 标准 UTC+8 · 全模块等价",
      ),
    );
    cases.push(
      conversionCase(
        { y: 1986, m: 6, d: 5, h: 17, mi: 30, s: 0 },
        "Asia/Shanghai",
        117.8,
        24.5,
        "中国 1986 夏令时",
        { offset: 540, bridgeHour: 16 },
      ),
    );
    cases.push(
      conversionCase(
        { y: 2024, m: 3, d: 10, h: 2, mi: 30, s: 0 },
        "America/New_York",
        -74,
        40.7,
        "纽约 DST 跳时",
        { available: false },
      ),
    );
    cases.push(
      conversionCase(
        { y: 2024, m: 11, d: 3, h: 1, mi: 30, s: 0 },
        "America/New_York",
        -74,
        40.7,
        "纽约 DST 回拨重复时刻",
        { offset: -240, ambiguous: true, choice: "earlier" },
      ),
    );
    return {
      schema: "tianji.time.batch-regression.v1",
      build: BUILD,
      cases,
      ok: cases.every((x) => x.ok),
      passed: cases.filter((x) => x.ok).length,
      total: cases.length,
    };
  }
  function gate(RG = LAST, BS = BATCH) {
    const A = TianjiHistoricalTime?.analyzeCurrent?.();
    const reasons = [];
    if (!A?.available) reasons.push("当前 IANA 历史时间没有唯一解析");
    if (A?.ambiguous) reasons.push("当前当地钟表时间存在 DST fold，需要明确选择较早/较晚瞬间");
    if (!RG?.available) reasons.push("尚未运行 V211 扩展模块回归");
    if (!BS?.ok) reasons.push("批量回归套件尚未全部通过");
    const errors = RG?.rows?.filter((x) => x.legacy?.error || x.historical?.error) || [];
    if (errors.length) reasons.push(`有 ${errors.length} 个模块运行异常`);
    if (reasons.length)
      return { state: "blocked", tone: "bad", title: "暂不满足正式接管条件", reasons };
    if (RG.summary.highImpact > 0)
      return {
        state: "migration-required",
        tone: "gold",
        title: "可接管，但必须按迁移变更处理",
        reasons: [
          `发现 ${RG.summary.highImpact} 个高影响模块变化；这是历史时间修正的结果，不应静默覆盖旧档案结论。`,
        ],
      };
    return {
      state: "ready",
      tone: "good",
      title: "当前档案满足受控接管条件",
      reasons: ["时区唯一、批量基础回归通过、扩展模块无运行异常。"],
    };
  }
  function reportText(RG = LAST, BS = BATCH) {
    const G = gate(RG, BS),
      A = RG?.audit || TianjiHistoricalTime?.analyzeCurrent?.();
    const L = [];
    L.push("天机盘 V211 · 历史时间迁移报告");
    L.push("生成版本：" + BUILD);
    L.push("");
    if (A?.available) {
      L.push(`出生记录：${A.clocks.recorded.text}`);
      L.push(
        `IANA 时区：${A.zone} · UTC${A.offsetMinutes >= 0 ? "+" : ""}${(A.offsetMinutes / 60).toFixed(2)}`,
      );
      L.push(`真实 UTC：${A.clocks.utc.text}`);
      L.push(`旧引擎 UTC+8 等价时刻：${A.clocks.legacyBridgeUTC8.text}`);
      L.push(
        `旧链瞬间差：${A.correction.legacyInstantDeltaMinutes >= 0 ? "+" : ""}${A.correction.legacyInstantDeltaMinutes.toFixed(1)} 分钟`,
      );
    }
    L.push("");
    L.push("接管门禁：" + G.title);
    G.reasons.forEach((x) => L.push(" - " + x));
    if (RG?.available) {
      L.push("");
      L.push(
        `扩展模块：${RG.summary.modules}；发生变化：${RG.summary.changed}；高影响：${RG.summary.highImpact}`,
      );
      RG.rows.forEach((x) =>
        L.push(
          `${x.changed ? "[变]" : "[同]"} ${x.name}：${short(x.legacy)}  =>  ${short(x.historical)}`,
        ),
      );
    }
    if (BS) {
      L.push("");
      L.push(`批量基础回归：${BS.passed}/${BS.total} ${BS.ok ? "PASS" : "FAIL"}`);
      BS.cases.forEach((x) => L.push(`${x.ok ? "[PASS]" : "[FAIL]"} ${x.label} · ${x.status}`));
    }
    L.push("");
    L.push(
      "说明：默认仍为 AUDIT ONLY。任何高影响变化都应作为“迁移变更”展示给用户，而不是静默替换旧结论。",
    );
    return L.join("\n");
  }
  function rowDisplay(x) {
    const l = x.legacy?.text || short(x.legacy),
      h = x.historical?.text || short(x.historical);
    return `<tr><td><b>${E(x.name)}</b><br><span class="tz211-code">${E(x.id)}</span></td><td>${E(l)}</td><td>${E(h)}</td><td><span class="tz211-state ${x.changed ? "diff" : "same"}">${x.changed ? "变化" : "一致"}</span></td></tr>`;
  }
  function resultHTML() {
    if (!LAST)
      return '<div class="tz211-note">扩展模块回归尚未运行。点击“运行 V211 扩展回归”后，才会计算六壬、梅花、西占、吠陀、七政四余、五运六气等更多时间敏感模块。</div>';
    if (!LAST.available)
      return `<div class="tz211-item bad"><b>回归无法运行</b><small>${E(LAST.reason)}</small></div>`;
    return `<div class="tbl-wrap"><table class="tz211-table"><thead><tr><th>模块</th><th>Legacy UTC+8</th><th>Historical</th><th>状态</th></tr></thead><tbody>${LAST.rows.map(rowDisplay).join("")}</tbody></table></div>`;
  }
  function batchHTML() {
    if (!BATCH)
      return '<div class="tz211-note">批量基础套件尚未运行。它包含：1992/2026 中国标准 UTC+8 全模块等价、1986 中国 DST、纽约 DST gap/fold。</div>';
    return `<div class="tz211-list">${BATCH.cases.map((x) => `<div class="tz211-item ${x.ok ? "good" : "bad"}"><b>${x.ok ? "PASS" : "FAIL"} · ${E(x.label)}</b><small>${E(x.status)}${x.bad?.length ? " · 差异模块 " + E(x.bad.join(", ")) : ""}${x.why?.length ? " · " + E(x.why.join("; ")) : ""}</small></div>`).join("")}</div>`;
  }
  function gateHTML() {
    const G = gate();
    return `<div class="tz211-gate ${G.tone}"><strong>${E(G.title)}</strong><small>${G.reasons.map(E).join("<br>")}</small></div>`;
  }
  function cardHTML() {
    const s = LAST?.summary || {
        modules: 10,
        changed: 0,
        highImpact: 0,
        legacyMs: 0,
        historicalMs: 0,
      },
      G = gate();
    return `<section class="tz211-card" id="tz211Migration">
    <h3>V211 · 历史时间三期 · 扩展回归 / 迁移门禁</h3>
    <div class="tz211-toolbar">
      <button class="primary" id="tz211Run" type="button">运行 V211 扩展回归</button>
      <button id="tz211Batch" type="button">运行批量边界套件</button>
      <button id="tz211Report" type="button">生成迁移报告</button>
      <button id="tz211Copy" type="button">复制迁移 JSON</button>
      <button class="warn" id="tz211Adopt" type="button"${G.state === "blocked" ? " disabled" : ""}>按门禁结果启用当前档案接管</button>
    </div>
    <div class="tz211-kpis">
      <div class="tz211-kpi ${G.tone}"><small>接管门禁</small><b>${E(G.state)}</b></div>
      <div class="tz211-kpi"><small>扩展模块</small><b>${s.modules}</b></div>
      <div class="tz211-kpi bad"><small>变化模块</small><b>${s.changed}</b></div>
      <div class="tz211-kpi bad"><small>高影响</small><b>${s.highImpact}</b></div>
      <div class="tz211-kpi ${BATCH?.ok ? "good" : "cyan"}"><small>批量套件</small><b>${BATCH ? `${BATCH.passed}/${BATCH.total}` : "未运行"}</b></div>
      <div class="tz211-kpi cyan"><small>默认策略</small><b>AUDIT ONLY</b></div>
    </div>
    <div class="tz211-grid">
      <section><h3 style="margin-top:8px">扩展模块双轨结果</h3><div id="tz211Result">${resultHTML()}</div></section>
      <aside><h3 style="margin-top:8px">正式接管门禁</h3><div id="tz211Gate">${gateHTML()}</div>
        <div class="tz211-note" style="margin-top:6px">“可接管”不等于“必须接管”。如果历史时区修正导致八字、奇门、六壬、紫微、西占等核心变化，V211 会把它视为档案迁移，而不是无提示覆盖。</div>
      </aside>
    </div>
    <div class="tz211-grid">
      <section><h3 style="margin-top:8px">批量边界 / 不变量回归</h3><div id="tz211BatchOut">${batchHTML()}</div></section>
      <aside><h3 style="margin-top:8px">迁移报告</h3><div id="tz211ReportOut" class="tz211-report">尚未生成。</div></aside>
    </div>
  </section>`;
  }
  function mount() {
    const body = document.querySelector("#tz209Modal .tz209-body");
    if (!body) return;
    document.getElementById("tz211Migration")?.remove();
    body.insertAdjacentHTML("beforeend", cardHTML());
    bind();
  }
  function refresh() {
    const old = document.getElementById("tz211Migration");
    if (!old) return;
    const box = document.createElement("div");
    box.innerHTML = cardHTML();
    old.replaceWith(box.firstElementChild);
    bind();
  }
  function bind() {
    document.getElementById("tz211Run")?.addEventListener("click", () => {
      const b = document.getElementById("tz211Run");
      if (b) {
        b.disabled = true;
        b.textContent = "回归中…";
      }
      setTimeout(() => {
        try {
          LAST = extendedRegression();
        } catch (err) {
          LAST = { available: false, reason: String(err?.message || err) };
        }
        refresh();
      }, 25);
    });
    document.getElementById("tz211Batch")?.addEventListener("click", () => {
      const b = document.getElementById("tz211Batch");
      if (b) {
        b.disabled = true;
        b.textContent = "测试中…";
      }
      setTimeout(() => {
        try {
          BATCH = batchSuite();
        } catch (err) {
          BATCH = {
            ok: false,
            passed: 0,
            total: 0,
            cases: [{ label: "suite exception", ok: false, status: String(err?.message || err) }],
          };
        }
        refresh();
      }, 25);
    });
    document.getElementById("tz211Report")?.addEventListener("click", () => {
      const out = document.getElementById("tz211ReportOut");
      if (out) out.textContent = reportText();
    });
    document.getElementById("tz211Copy")?.addEventListener("click", () => {
      const payload = {
        schema: SCHEMA,
        build: BUILD,
        regression: LAST,
        batch: BATCH,
        gate: gate(),
        report: reportText(),
      };
      navigator.clipboard
        ?.writeText?.(JSON.stringify(payload, null, 2))
        .then(() => {
          try {
            toast("已复制 V211 时间迁移 JSON");
          } catch (_) {}
        })
        .catch(() => {});
    });
    document.getElementById("tz211Adopt")?.addEventListener("click", () => {
      const G = gate();
      if (G.state === "blocked") return;
      try {
        TianjiHistoricalTimeV2?.setMode?.("profile");
      } catch (_) {}
      const civ = (() => {
        try {
          return parseDt();
        } catch (_) {
          return null;
        }
      })();
      if (civ && typeof deduce === "function") {
        try {
          deduce(civ, "quick");
        } catch (err) {
          console.warn("[V211 adopt]", err);
        }
      }
      try {
        toast(
          G.state === "migration-required"
            ? "已启用当前档案历史时间接管；请保留迁移报告"
            : "已启用当前档案历史时间接管",
        );
      } catch (_) {}
      refresh();
    });
  }
  document.addEventListener(
    "click",
    (ev) => {
      if (ev.target?.id === "tz209Open" || ev.target?.id === "tz209VerifyOpen")
        setTimeout(mount, 55);
    },
    true,
  );

  function selfTest() {
    const C = [],
      add = (id, ok, d = "") => C.push({ id, ok: !!ok, d });
    try {
      const a = TianjiHistoricalTime.resolve(
        { y: 1992, m: 6, d: 5, h: 17, mi: 30, s: 0 },
        { zone: "Asia/Shanghai", longitude: 121.47, latitude: 31.23, solar: false },
      );
      add(
        "standard.bridge.identity",
        a.available && a.clocks.legacyBridgeUTC8.h === 17 && a.clocks.legacyBridgeUTC8.mi === 30,
        JSON.stringify(a.clocks?.legacyBridgeUTC8),
      );
    } catch (err) {
      add("standard.bridge.identity", false, String(err));
    }
    try {
      const a = TianjiHistoricalTime.resolve(
        { y: 1986, m: 6, d: 5, h: 17, mi: 30, s: 0 },
        { zone: "Asia/Shanghai", longitude: 117.8, latitude: 24.5, solar: false },
      );
      add(
        "dst.bridge.shift",
        a.available && a.clocks.legacyBridgeUTC8.h === 16 && a.offsetMinutes === 540,
        JSON.stringify({ bridge: a.clocks?.legacyBridgeUTC8, off: a.offsetMinutes }),
      );
    } catch (err) {
      add("dst.bridge.shift", false, String(err));
    }
    add(
      "module.functions",
      typeof qzCalc === "function" &&
        typeof a2Chart === "function" &&
        typeof v2Chart === "function" &&
        typeof liuren === "function",
      "",
    );
    return { ok: C.every((x) => x.ok), checks: C };
  }
  const TEST = selfTest();

  const TASKS211 = [
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
      state: "done",
      note: "v209–v211：IANA/DST、gap/fold、太阳时间链、UTC+8兼容桥、八字/奇门/紫微及六壬/梅花/西占/吠陀/七政/五运六气扩展回归、批量边界套件、迁移报告与当前档案受控接管；默认审计模式作为产品安全策略保留",
    },
    {
      id: "relation",
      p: "P2",
      name: "关系长期时间轴",
      state: "todo",
      note: "下一主线：人物关系已有，补关系阶段、时间事件、双人/家庭长期变化与可视化",
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
    done: 10,
    doing: 1,
    blocked: 1,
    progress: 78.6,
    next: ["关系长期时间轴", "奇门日/月/年真实第三方 reference 样本", "合参 Evidence 正式报告"],
    tasks: TASKS211,
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
          "关系长期时间轴",
          "奇门四家第三方对拍（二期待外部样本）",
          "合参 Evidence 正式报告",
          "七政四余星历/许可证前置",
        ],
      }),
    );
  }
  applyBoard();
  window.addEventListener("tianji:lazy-ready", () => setTimeout(applyBoard, 0));

  window.TianjiHistoricalTimeV3 = Object.freeze({
    version: "3.0.0",
    build: BUILD,
    schema: SCHEMA,
    extendedRegression: () => clone(extendedRegression()),
    batchSuite: () => clone(batchSuite()),
    gate: () => clone(gate(LAST, BATCH)),
    migrationReport: () => reportText(LAST, BATCH),
    selfTest: () => clone(TEST),
    manifest: () => ({
      module: "Tianji Historical Time V3",
      completeForDeclaredPolicy: true,
      comparedModules: [
        "八字",
        "奇门",
        "大六壬",
        "梅花易数",
        "紫微斗数",
        "西方本命星盘",
        "吠陀占星",
        "七政四余",
        "五运六气",
        "天文角度",
      ],
      adoption: "默认 AUDIT ONLY；通过门禁后可显式对当前档案启用历史时间接管",
      batchInvariants: [
        "中国标准 UTC+8 全模块等价",
        "中国 1986 DST 兼容桥",
        "纽约 DST gap",
        "纽约 DST fold",
      ],
      boundaries: [
        "浏览器 Intl 不暴露具体 tzdb 版本",
        "全球经纬度→IANA 边界库仍未内置",
        "七政四余比较不改变其 blocked 状态",
        "高影响变化必须作为档案迁移展示",
      ],
    }),
  });
  window.TianjiSystemV211 = {
    version: "v211",
    build: BUILD,
    historicalTimeV3: true,
    timeTaskComplete: true,
    defaultAuditOnly: true,
    noticeQuietDefault: true,
    baseline: "v210",
  };

  function sync() {
    const b = document.getElementById("buildVersion");
  }
  /* V226: historical delayed version writer disabled */
})();
