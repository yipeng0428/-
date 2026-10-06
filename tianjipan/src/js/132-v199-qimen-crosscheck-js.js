(() => {
  "use strict";
  const BUILD = "v199 · 2026-10-06 09:52 +08:00";
  const SCHEMA = "tianji.qimen.crosscheck.v1";
  const REQUEST_SCHEMA = "tianji.qimen.crosscheck.request.v1";
  const REF_SCHEMA = "tianji.qimen.crosscheck.reference.v1";
  const STORE = "tianjipan.qimen.crosscheck.v199";
  let imported = [],
    lastReport = null;
  try {
    const x = JSON.parse(localStorage.getItem(STORE) || "null");
    if (Array.isArray(x)) imported = x.slice(-120);
  } catch (_) {}

  const clone = (x) => (x == null ? x : JSON.parse(JSON.stringify(x)));
  const E = (s) =>
    String(s ?? "").replace(
      /[&<>"']/g,
      (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
    );
  const GZ = (p) => {
    try {
      return GAN[p.s] + ZHI[p.b];
    } catch (_) {
      return "";
    }
  };
  const currentR = () => {
    try {
      return typeof R !== "undefined" ? R : null;
    } catch (_) {
      return null;
    }
  };
  function save() {
    try {
      localStorage.setItem(STORE, JSON.stringify(imported.slice(-120)));
    } catch (_) {}
  }
  function civilKey(c) {
    return c
      ? `${c.y}-${String(c.m).padStart(2, "0")}-${String(c.d).padStart(2, "0")} ${String(c.h ?? 0).padStart(2, "0")}:${String(c.mi ?? 0).padStart(2, "0")}`
      : "—";
  }
  function normalizeCivil(x) {
    if (!x) return null;
    if (typeof x === "string") {
      const m = x
        .trim()
        .match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:[ T](\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?/);
      if (!m) return null;
      return { y: +m[1], m: +m[2], d: +m[3], h: +(m[4] || 0), mi: +(m[5] || 0), s: +(m[6] || 0) };
    }
    const c = { y: +x.y, m: +x.m, d: +x.d, h: +(x.h || 0), mi: +(x.mi || 0), s: +(x.s || 0) };
    return [c.y, c.m, c.d, c.h, c.mi, c.s].every(Number.isFinite) ? c : null;
  }
  function buildR(civ) {
    try {
      if (typeof compute !== "function") throw new Error("compute() unavailable");
      return compute(civ);
    } catch (e) {
      return { __error: String((e && e.message) || e), t: { civ } };
    }
  }
  function hourInput(R0) {
    if (!R0 || R0.__error) return null;
    const lon = Number(R0?.t?.lon ?? R0?.t?.astronomy?.solarLongitude);
    const di = Number(R0?.bz?.dayIdx);
    let hi = Number(R0?.bz?.hourIdx);
    if (!Number.isFinite(hi) && R0?.bz?.pill?.[3] && typeof ganzhiIdx === "function")
      hi = ganzhiIdx(R0.bz.pill[3].s, R0.bz.pill[3].b);
    if (![lon, di, hi].every(Number.isFinite)) return null;
    return { solarLongitude: lon, dayGanzhiIndex: di, hourGanzhiIndex: hi };
  }
  function snapshotHour(R0) {
    const q = R0?.qm;
    if (!q) return { family: "hour", error: "当前未取到时家盘" };
    const heaven = {},
      stars = {},
      doors = {},
      gods = {};
    [1, 2, 3, 4, 6, 7, 8, 9].forEach((p) => {
      const c = q.cells?.[p];
      if (c) {
        heaven[p] = c.hs;
        stars[p] = c.star;
        doors[p] = c.door;
        gods[p] = c.god;
      }
    });
    return {
      family: "hour",
      input: { civil: clone(R0.t?.civ), core: hourInput(R0) },
      core: {
        yinYang: q.yang ? "阳遁" : "阴遁",
        ju: q.ju,
        term: q.term,
        yuan: q.yuanName,
        hourGZ: q.hourGZ,
        chiefStar: q.zfStar,
        chiefStarPalace: q.q,
        chiefDoor: q.zsDoor,
        chiefDoorPalace: q.rr,
        earth: clone(q.earth),
        heaven,
        stars,
        doors,
        gods,
        emptyPalaces: clone(q.kongP || []),
        horsePalace: q.horseP,
        fuyin: !!q.fuyin,
        fanyin: !!q.fanyin,
      },
    };
  }
  function snapshotDay(R0) {
    const P = window.TianjiQimenPeriod;
    if (!P) return { family: "day", error: "TianjiQimenPeriod unavailable" };
    try {
      const M = P.dayMeta(R0);
      return {
        family: "day",
        input: { civil: clone(R0.t?.civ) },
        core: {
          dayGZ: M.gz,
          dayIndex: M.idx,
          group: M.grp,
          groupPosition: M.pos,
          restDoorAnchor: M.anchor,
          doors: clone(M.doors),
        },
      };
    } catch (e) {
      return { family: "day", error: String((e && e.message) || e) };
    }
  }
  function snapshotMonth(R0) {
    const P = window.TianjiQimenPeriod;
    if (!P) return { family: "month", error: "TianjiQimenPeriod unavailable" };
    try {
      const M = P.monthMeta(R0),
        C = P.periodCore(M.ju, M.idx, "月家");
      return {
        family: "month",
        input: { civil: clone(R0.t?.civ) },
        core: {
          yuan: M.name,
          ju: M.ju,
          monthGZ: C.gz,
          dun: C.dun,
          chiefStar: C.zf,
          chiefStarPalace: C.q,
          chiefDoor: C.zs,
          chiefDoorPalace: C.rr,
          earth: clone(C.earth),
          heaven: clone(C.heaven),
          stars: clone(C.stars),
          doors: clone(C.doors),
        },
      };
    } catch (e) {
      return { family: "month", error: String((e && e.message) || e) };
    }
  }
  function snapshotYear(R0) {
    const P = window.TianjiQimenPeriod;
    if (!P) return { family: "year", error: "TianjiQimenPeriod unavailable" };
    try {
      const M = P.yearMeta(R0),
        C = P.periodCore(M.ju, M.idx, "年家");
      return {
        family: "year",
        input: { civil: clone(R0.t?.civ) },
        core: {
          year: M.y,
          yuan: M.name,
          yuanStart: M.start,
          baseJu: M.base,
          ju: M.ju,
          yearGZ: C.gz,
          dun: C.dun,
          chiefStar: C.zf,
          chiefStarPalace: C.q,
          chiefDoor: C.zs,
          chiefDoorPalace: C.rr,
          earth: clone(C.earth),
          heaven: clone(C.heaven),
          stars: clone(C.stars),
          doors: clone(C.doors),
        },
      };
    } catch (e) {
      return { family: "year", error: String((e && e.message) || e) };
    }
  }
  function snapshot(family, R0) {
    if (family === "hour") return snapshotHour(R0);
    if (family === "day") return snapshotDay(R0);
    if (family === "month") return snapshotMonth(R0);
    if (family === "year") return snapshotYear(R0);
    return { family, error: "unknown family" };
  }
  function currentBundle() {
    const R0 = currentR();
    return {
      schema: REQUEST_SCHEMA,
      build: BUILD,
      createdAt: new Date().toISOString(),
      note: "把同一 civil time 放到第三方软件/资料中核对；将第三方规范化结果填入 expected，再导回本验证台。不要把 Tianji 自己的 snapshot 复制到 expected 冒充第三方验证。",
      cases: ["hour", "day", "month", "year"].map((f) => {
        const s = snapshot(f, R0);
        return {
          id: `${f}-${Date.now()}`,
          family: f,
          input: s.input,
          tianji_snapshot: s.core,
          expected: {},
          source: { name: "", version: "", url: "", note: "" },
        };
      }),
    };
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
    return v;
  }
  function walkExpected(actual, expected, path = "", rows = []) {
    if (expected === undefined) return rows;
    if (expected === null || typeof expected !== "object") {
      const ok = JSON.stringify(actual) === JSON.stringify(expected);
      rows.push({
        path: path || "(root)",
        status: actual === undefined ? "MISSING" : ok ? "PASS" : "DIFF",
        tianji: actual,
        reference: expected,
      });
      return rows;
    }
    if (Array.isArray(expected)) {
      const ok = JSON.stringify(clean(actual)) === JSON.stringify(clean(expected));
      rows.push({
        path: path || "(root)",
        status: actual === undefined ? "MISSING" : ok ? "PASS" : "DIFF",
        tianji: actual,
        reference: expected,
      });
      return rows;
    }
    for (const k of Object.keys(expected)) {
      walkExpected(actual?.[k], expected[k], path ? path + "." + k : k, rows);
    }
    return rows;
  }
  function runCase(c) {
    const civil = normalizeCivil(c?.input?.civil || c?.civil);
    if (!civil)
      return {
        id: c?.id || "",
        family: c?.family || "",
        status: "INVALID",
        error: "input.civil 缺失或格式无效",
        rows: [],
      };
    const R0 = buildR(civil);
    if (R0.__error)
      return {
        id: c?.id || "",
        family: c?.family || "",
        status: "INVALID",
        error: R0.__error,
        rows: [],
      };
    const s = snapshot(c.family, R0),
      expected = c.expected || {};
    const rows = walkExpected(s.core, expected),
      diff = rows.filter((x) => x.status === "DIFF"),
      missing = rows.filter((x) => x.status === "MISSING");
    const compared = rows.length,
      pass = rows.filter((x) => x.status === "PASS").length;
    return {
      id: c.id || `${c.family}-${civilKey(civil)}`,
      family: c.family,
      civil,
      status: !compared ? "NO_REFERENCE" : diff.length || missing.length ? "DIFF" : "PASS",
      compared,
      pass,
      diff: diff.length,
      missing: missing.length,
      rows,
      source: c.source || {},
      tianji: s.core,
    };
  }
  function evaluate() {
    const cases = imported.map(runCase),
      summary = {
        cases: cases.length,
        pass: cases.filter((x) => x.status === "PASS").length,
        diff: cases.filter((x) => x.status === "DIFF").length,
        noReference: cases.filter((x) => x.status === "NO_REFERENCE").length,
        invalid: cases.filter((x) => x.status === "INVALID").length,
        fields: cases.reduce((a, x) => a + (x.compared || 0), 0),
      };
    lastReport = {
      schema: SCHEMA,
      build: BUILD,
      generatedAt: new Date().toISOString(),
      summary,
      cases,
      hourBuiltin: hourBuiltin(),
      periodSelfTest: periodTest(),
    };
    return lastReport;
  }
  function hourBuiltin() {
    try {
      const V = window.TianjiQimenVerifier;
      if (!V) return { state: "missing" };
      const test = V.selfTest?.() || null,
        input = hourInput(currentR()),
        current = input ? V.verify?.(input) : null;
      return {
        state: test?.ok ? "pass" : "degraded",
        source: V.manifest?.()?.source || V.source || null,
        selfTest: test,
        current: current ? { ok: current.ok, summary: current.summary } : null,
      };
    } catch (e) {
      return { state: "error", error: String((e && e.message) || e) };
    }
  }
  function periodTest() {
    try {
      return window.TianjiQimenPeriod?.selfTest?.() || null;
    } catch (e) {
      return { ok: false, error: String((e && e.message) || e) };
    }
  }
  function familyStats(f) {
    const report = evaluate(),
      a = report.cases.filter((x) => x.family === f);
    return {
      n: a.length,
      pass: a.filter((x) => x.status === "PASS").length,
      diff: a.filter((x) => x.status === "DIFF").length,
      fields: a.reduce((s, x) => s + (x.compared || 0), 0),
    };
  }
  function familyCard(f, name, desc) {
    const st = familyStats(f),
      builtin = f === "hour" ? hourBuiltin() : null,
      pt = f !== "hour" ? periodTest() : null;
    let cls = "doing",
      label = "待第三方样本",
      extra = `已导入 ${st.n} 例 · 字段 ${st.fields}`;
    if (f === "hour" && builtin?.state === "pass") {
      cls = st.diff ? "diff" : "pass";
      label = st.diff ? "Mingpan基准通过 / 外部有差异" : "Mingpan 0.1.8 基准通过";
      extra = `内置 shadow verifier PASS${builtin.current ? ` · 当前盘 ${builtin.current.ok ? "PASS" : "DIFF"}` : ""} · 外部样本 ${st.n}`;
    } else if (st.n && st.diff) {
      cls = "diff";
      label = "存在差异";
    } else if (st.n && st.pass === st.n) {
      cls = "pass";
      label = "导入样本全部通过";
    } else if (pt?.ok) {
      label = "内部自检通过 · 待外部对拍";
    }
    return `<section class="q199-family"><h4>${name}</h4><span class="state ${cls}">${label}</span><p>${desc}<br>${extra}</p></section>`;
  }
  function caseHTML(x) {
    const cls = x.status === "PASS" ? "pass" : x.status === "DIFF" ? "diff" : "";
    const diffs = (x.rows || []).filter((r) => r.status !== "PASS").slice(0, 8);
    return `<div class="q199-case ${cls}"><h5>${E(x.family)} · ${E(x.id || "未命名")}</h5><small>${E(civilKey(x.civil))} · ${E(x.status)} · 比较字段 ${x.compared || 0} · 来源 ${E(x.source?.name || "未填写")}</small>${x.error ? `<div class="q199-diff">${E(x.error)}</div>` : ""}${diffs.length ? `<div class="q199-diff">${diffs.map((d) => `${E(d.path)} · ${E(d.status)} · Tianji=${E(JSON.stringify(d.tianji))} · Ref=${E(JSON.stringify(d.reference))}`).join("<br>")}</div>` : ""}</div>`;
  }
  function auditHTML() {
    const h = hourBuiltin(),
      p = periodTest(),
      m = window.TianjiQimenPeriod?.manifest?.();
    return `<div class="q199-audit">
  <div class="q199-audit-row"><b>时家</b><small>Mingpan 0.1.8 固定版本 · Apache-2.0 · shadow verifier</small><span class="${h.state === "pass" ? "ok" : "bad"}">${h.state === "pass" ? "PASS" : E(h.state)}</span></div>
  <div class="q199-audit-row"><b>日家</b><small>${E(m?.source || "《遁甲演义》研究口径")} · 三日移宫八门；三奇细层仍待核</small><span class="${familyStats("day").n ? "ok" : "wait"}">${familyStats("day").n ? "已导入样本" : "待第三方"}</span></div>
  <div class="q199-audit-row"><b>月家</b><small>五年三元 · 节令月柱；当前为研究实现，不声明现代软件唯一口径</small><span class="${familyStats("month").n ? "ok" : "wait"}">${familyStats("month").n ? "已导入样本" : "待第三方"}</span></div>
  <div class="q199-audit-row"><b>年家</b><small>三元六十年 · 阴遁一/四/七基准；需逐年跨软件核对</small><span class="${familyStats("year").n ? "ok" : "wait"}">${familyStats("year").n ? "已导入样本" : "待第三方"}</span></div>
  <div class="q199-audit-row"><b>内部结构</b><small>v165 period family 自检</small><span class="${p?.ok ? "ok" : "bad"}">${p?.ok ? "PASS" : "FAIL"}</span></div>
 </div>`;
  }
  function panel() {
    const report = evaluate(),
      S = report.summary;
    return `<section class="q199" id="q199Lab">
  <section class="q199-hero"><div class="q199-head"><div><h3>奇门四家 · 对拍验证实验室</h3><p>把“代码能跑”升级为“可以被外部结果逐字段核对”。时家继续使用已固定的 Mingpan 0.1.8 shadow verifier；日家、月家、年家不伪造第三方验证结论，而是提供标准化样本导出、第三方结果导入、逐字段差异和 Evidence 状态。</p></div><span class="q199-badge">${SCHEMA}</span></div></section>
  <div class="q199-status">
   ${familyCard("hour", "时家", "时盘 · 转盘 · 拆补法")}
   ${familyCard("day", "日家", "三日一移 · 八门顺轮")}
   ${familyCard("month", "月家", "五年三元 · 节令月建")}
   ${familyCard("year", "年家", "三元六十年 · 年遁")}
  </div>
  <div class="q199-grid">
   <section class="q199-card"><h4>第三方对拍数据</h4>
    <div class="q199-summary"><div class="q199-kpi"><small>样本</small><b>${S.cases}</b></div><div class="q199-kpi good"><small>通过</small><b>${S.pass}</b></div><div class="q199-kpi bad"><small>差异</small><b>${S.diff}</b></div><div class="q199-kpi cyan"><small>字段</small><b>${S.fields}</b></div></div>
    <div class="q199-toolbar"><button class="primary" data-q199-template>生成当前四家模板</button><button data-q199-import>导入并对拍</button><button data-q199-file>读取 JSON 文件</button><input id="q199File" type="file" accept=".json,application/json" hidden><button data-q199-report>下载验证报告</button><button data-q199-clear>清空外部样本</button></div>
    <textarea class="q199-json" id="q199Json" spellcheck="false" placeholder="粘贴 ${REF_SCHEMA} / ${REQUEST_SCHEMA} JSON。第三方结果写在 cases[].expected。"></textarea>
    <div class="q199-note"><b>重要：</b>对拍不是把本站结果复制一份再比较。第三方软件、独立实现或人工古籍金样必须写入 <code>expected</code>，并填写来源名称 / 版本 / 链接或说明。允许 expected 只提供部分字段；本实验室只比较第三方实际提供的字段。</div>
   </section>
   <aside class="q199-card"><h4>Evidence 审计状态</h4>${auditHTML()}<h4 style="margin-top:10px">参考数据格式</h4><div class="q199-schema">{
 "schema":"${REF_SCHEMA}",
 "cases":[{
   "id":"sample-001",
   "family":"day|month|year|hour",
   "input":{"civil":"2026-10-06 09:30"},
   "source":{"name":"第三方软件/人工金样","version":"","url":""},
   "expected":{"ju":1,"doors":{"1":"休"}}
 }]
}</div></aside>
  </div>
  <section class="q199-card"><h4>已导入样本与差异</h4><div class="q199-cases">${report.cases.length ? report.cases.map(caseHTML).join("") : '<div class="q199-note">暂无外部样本。时家已有内置 Mingpan shadow verifier；日/月/年家仍需要真实第三方对拍数据。</div>'}</div></section>
 </section>`;
  }
  function mount() {
    const pane = document.getElementById("pane-qimen");
    if (!pane || !pane.classList.contains("on")) return;
    let host = pane.querySelector("#q199Lab");
    if (!host) {
      const tmp = document.createElement("div");
      tmp.innerHTML = panel();
      host = tmp.firstElementChild;
      pane.appendChild(host);
    } else {
      const tmp = document.createElement("div");
      tmp.innerHTML = panel();
      host.replaceWith(tmp.firstElementChild);
    }
  }
  function parseImport(raw) {
    const x = typeof raw === "string" ? JSON.parse(raw) : raw;
    const cases = Array.isArray(x) ? x : Array.isArray(x?.cases) ? x.cases : [x];
    const out = [];
    for (const c of cases) {
      if (!c || !["hour", "day", "month", "year"].includes(c.family)) continue;
      const civ = normalizeCivil(c?.input?.civil || c?.civil);
      if (!civ) continue;
      out.push({
        id: String(c.id || `${c.family}-${Date.now()}-${out.length}`),
        family: c.family,
        input: { ...(c.input || {}), civil },
        expected: c.expected || {},
        source: c.source || {},
        importedAt: new Date().toISOString(),
      });
    }
    return out;
  }
  function download(name, obj) {
    const blob = new Blob([JSON.stringify(obj, null, 2)], {
        type: "application/json;charset=utf-8",
      }),
      url = URL.createObjectURL(blob),
      a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1600);
  }
  document.addEventListener(
    "click",
    async (e) => {
      const b = e.target?.closest?.(
        "[data-q199-template],[data-q199-import],[data-q199-file],[data-q199-report],[data-q199-clear]",
      );
      if (!b) return;
      const ta = document.getElementById("q199Json");
      if (b.hasAttribute("data-q199-template")) {
        if (ta) ta.value = JSON.stringify(currentBundle(), null, 2);
        return;
      }
      if (b.hasAttribute("data-q199-import")) {
        try {
          const add = parseImport(ta?.value || "");
          if (!add.length) throw new Error("未找到有效 cases");
          imported = [...imported, ...add].slice(-120);
          save();
          lastReport = evaluate();
          mount();
          try {
            toast(`已导入 ${add.length} 个对拍样本`);
          } catch (_) {}
        } catch (err) {
          try {
            toast("导入失败：" + (err.message || err));
          } catch (_) {
            alert(err.message || err);
          }
        }
        return;
      }
      if (b.hasAttribute("data-q199-file")) {
        document.getElementById("q199File")?.click();
        return;
      }
      if (b.hasAttribute("data-q199-report")) {
        lastReport = evaluate();
        download("天机盘_V199_奇门四家对拍报告.json", lastReport);
        return;
      }
      if (b.hasAttribute("data-q199-clear")) {
        if (!confirm("清空本机保存的第三方对拍样本？不会影响排盘算法。")) return;
        imported = [];
        save();
        lastReport = evaluate();
        mount();
        return;
      }
    },
    true,
  );
  document.addEventListener(
    "change",
    async (e) => {
      if (e.target?.id !== "q199File") return;
      const f = e.target.files?.[0];
      if (!f) return;
      try {
        const ta = document.getElementById("q199Json");
        if (ta) ta.value = await f.text();
        try {
          toast("已读取 JSON，请检查后点击“导入并对拍”");
        } catch (_) {}
      } catch (err) {
        try {
          toast("读取失败");
        } catch (_) {}
      }
      e.target.value = "";
    },
    true,
  );

  /* qimen 每次重绘后自动重挂验证台，不侵入原 renderQimen。 */
  try {
    const oldRef199 = refRender;
    refRender = function (...args) {
      const r = oldRef199.apply(this, args);
      if (args[0] === "qimen") setTimeout(mount, 0);
      return r;
    };
  } catch (e) {
    console.warn("[v199 refRender hook]", e);
  }
  document.addEventListener(
    "click",
    (e) => {
      if (e.target?.closest?.("[data-q165-mode],[data-q165-shift],[data-q165-now],#qm124Run"))
        setTimeout(mount, 80);
    },
    true,
  );
  /* V201：首屏阶段不主动挂载四家验证台；进入奇门页时再由 refRender hook 挂载。 */

  /* Evidence / Registry：只登记“验证工具”，不把未导入的第三方样本冒充 Evidence。 */
  try {
    if (window.TianjiCore) {
      TianjiCore.registerSource({
        id: "tianji-v199-qimen-crosscheck-lab",
        type: "internal",
        title: "Qimen Four-Family Cross-check Lab",
        version: "1.0.0",
        baseline: "v198",
        note: "验证工作台；时家复用 Mingpan verifier，日/月/年家仅在导入真实第三方 reference 后形成对拍结果。",
      });
      TianjiCore.registerEngine(
        {
          id: "qimen.crosscheck.v1",
          system: "qimen",
          name: "Qimen Four-Family Cross-check",
          version: "1.0.0",
          source: "tianji-v199-qimen-crosscheck-lab",
          doctrine: "compare only explicit reference fields; no fabricated external evidence",
          status: "active",
        },
        () => evaluate(),
      );
    }
  } catch (e) {
    console.warn("[v199 registry]", e);
  }

  /* 最新任务看板：P0 全部完成，正式进入 P1 奇门 Evidence。 */
  const TASKS199 = [
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
      note: "v196–v197 完成；含寻人 / 寻物",
    },
    {
      id: "consumer",
      p: "P0",
      name: "统一消费者结果页 / 报告",
      state: "done",
      note: "v198：深度解析 + 大白话结果 + 来源回指",
    },
    {
      id: "qimen-evidence",
      p: "P1",
      name: "奇门四家第三方对拍 / 高级 Evidence",
      state: "doing",
      note: "v199 一期：四家标准化样本、导入第三方 reference、逐字段 diff；时家已有 Mingpan 0.1.8，日/月/年待真实外部样本",
    },
    {
      id: "liuyao-depth",
      p: "P1",
      name: "六爻完整旺衰 / 卦格 / 应期层",
      state: "todo",
      note: "Core 已成型，解释层继续深化",
    },
    {
      id: "ziwei-depth",
      p: "P1",
      name: "紫微完整飞星体系",
      state: "todo",
      note: "继续补飞星/自化/应期",
    },
    {
      id: "qizheng",
      p: "P1",
      name: "七政四余核心化",
      state: "blocked",
      note: "等待星历、四余口径与许可证方案",
    },
    { id: "xk", p: "P1", name: "玄空完整宅盘", state: "todo", note: "运盘/山星/向星/替卦" },
    {
      id: "sanhe",
      p: "P1",
      name: "三合水法 Core",
      state: "todo",
      note: "罗盘已有，确定性规则链待核心化",
    },
    {
      id: "tz",
      p: "P2",
      name: "历史时区 / 夏令时自动校正",
      state: "todo",
      note: "历史时区数据库待接入",
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
  const BOARD199 = {
    schema: "tianji.priority.board.v1",
    build: BUILD,
    total: 14,
    done: 5,
    doing: 1,
    blocked: 1,
    progress: 39.3,
    next: [
      "补充日家/月家/年家真实第三方对拍样本",
      "六爻完整旺衰 / 卦格 / 应期层",
      "紫微完整飞星体系",
    ],
    tasks: TASKS199,
  };
  function applyBoard199() {
    window.TianjiPriorityBoard = Object.freeze({
      schema: BOARD199.schema,
      snapshot: () => clone(BOARD199),
    });
    const road = window.TianjiRoadmap || {};
    window.TianjiRoadmap = Object.freeze(
      Object.assign({}, road, {
        urgentImportant: clone(BOARD199),
        nextMainline: [
          "奇门四家第三方对拍与高级 Evidence（二期）",
          "六爻完整旺衰 / 卦格 / 应期",
          "紫微完整飞星体系",
          "历史时区 / DST",
        ],
      }),
    );
  }
  applyBoard199();
  window.addEventListener("tianji:lazy-ready", () => setTimeout(applyBoard199, 0));

  window.TianjiQimenCrosscheck = Object.freeze({
    version: "1.0.0",
    build: BUILD,
    schema: SCHEMA,
    snapshot: (family, civ) => snapshot(family, civ ? buildR(normalizeCivil(civ)) : currentR()),
    currentBundle,
    importReferences: (x) => {
      const a = parseImport(x);
      imported = [...imported, ...a].slice(-120);
      save();
      return evaluate();
    },
    clear: () => {
      imported = [];
      save();
      return evaluate();
    },
    report: () => clone(evaluate()),
    status: () => ({
      imported: imported.length,
      hourBuiltin: hourBuiltin(),
      periodSelfTest: periodTest(),
    }),
  });
  window.TianjiSystemV199 = {
    version: "v199",
    build: BUILD,
    qimenCrosscheck: true,
    advancedEvidencePhase1: true,
    baseline: "v198",
  };

  /* V201：V199 版本号锁停用；避免 footer MutationObserver 与 V198/V200/V201 争写。 */
})();
