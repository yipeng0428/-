(() => {
  "use strict";
  const BUILD = "v217 · 2026-10-06 15:08 +08:00";
  const SCHEMA = "tianji.release.freeze.v1";
  const STORE = "tianjipan.release.freeze.v217";
  let LAST_QA = null,
    FREEZE = null,
    RUNNING = false;

  const clone = (x) => {
    try {
      return structuredClone(x);
    } catch (_) {
      try {
        return JSON.parse(JSON.stringify(x));
      } catch (__) {
        return x;
      }
    }
  };
  const E = (s) =>
    String(s ?? "").replace(
      /[&<>"']/g,
      (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
    );
  const nowISO = () => new Date().toISOString();
  try {
    FREEZE = JSON.parse(localStorage.getItem(STORE) || "null");
  } catch (_) {
    FREEZE = null;
  }

  async function digest(obj) {
    const text = JSON.stringify(obj, Object.keys(obj).sort());
    try {
      const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
      return [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, "0")).join("");
    } catch (_) {
      let h = 2166136261;
      for (let i = 0; i < text.length; i++) {
        h ^= text.charCodeAt(i);
        h = Math.imul(h, 16777619);
      }
      return "fallback-" + (h >>> 0).toString(16).padStart(8, "0");
    }
  }
  function classify(qa) {
    if (!qa)
      return {
        state: "not-run",
        label: "尚未运行最终门禁",
        tone: "cyan",
        canFreeze: false,
        reason: "先运行 V215 完整回归。",
      };
    const s = qa.summary || {},
      fails = +s.fail || 0,
      warns = +s.warn || 0;
    if (fails > 0)
      return {
        state: "blocked",
        label: "冻结阻塞",
        tone: "bad",
        canFreeze: false,
        reason: `存在 ${fails} 个 FAIL。`,
      };
    return {
      state: "conditional",
      label: "可条件冻结",
      tone: "warn",
      canFreeze: true,
      reason: warns ? `无 FAIL；保留 ${warns} 个 warning / 已知限制。` : "无 FAIL / WARN。",
    };
  }
  async function runFinal() {
    if (RUNNING) return LAST_QA;
    RUNNING = true;
    try {
      if (!window.TianjiReleaseQA?.full) throw new Error("V215 Release QA API 不可用");
      LAST_QA = await TianjiReleaseQA.full();
      return LAST_QA;
    } finally {
      RUNNING = false;
    }
  }
  async function freezeNow() {
    const gate = classify(LAST_QA);
    if (!gate.canFreeze) throw new Error(gate.reason);
    const manifest = {
      schema: SCHEMA,
      build: BUILD,
      channel: "Release Freeze Candidate",
      frozenAt: nowISO(),
      qa: {
        build: LAST_QA.build,
        mode: LAST_QA.mode,
        generatedAt: LAST_QA.generatedAt,
        summary: clone(LAST_QA.summary),
        viewport: clone(LAST_QA.viewport),
      },
      knownLimits: [
        "奇门日家/月家/年家真实独立第三方 reference 仍 pending。",
        "七政四余核心化仍 blocked：星历 / 四余口径 / 许可证方案未满足。",
        "V217 不包含部署层变更；Surge / Cloudflare 配置等待正式推送时统一生成。",
      ],
      invariant: {
        noticeTickerDefault: false,
        noticePopupDefault: false,
        embeddedNoticesEmpty: true,
        startupBaseline: "V201",
        layoutBaseline: "V200",
        formalEvidence: "V214",
        releaseQA: "V215",
      },
    };
    manifest.digest = await digest(manifest);
    FREEZE = manifest;
    try {
      localStorage.setItem(STORE, JSON.stringify(FREEZE));
    } catch (_) {}
    return clone(FREEZE);
  }
  function unfreeze() {
    FREEZE = null;
    try {
      localStorage.removeItem(STORE);
    } catch (_) {}
    return true;
  }
  function gateHTML() {
    const g = FREEZE
      ? {
          state: "frozen",
          label: "本地冻结记录已建立",
          tone: "good",
          reason: `冻结于 ${FREEZE.frozenAt}`,
        }
      : classify(LAST_QA);
    return `<div class="rf217-gate ${g.tone}"><strong>${E(g.label)}</strong><small>${E(g.reason)}</small></div>`;
  }
  function freezeMeta() {
    if (!FREEZE)
      return '<div class="rf217-note">当前浏览器尚未建立 V217 冻结记录。运行最终门禁后，如无 FAIL，可明确执行“冻结当前 RC”。</div>';
    return `<dl class="rf217-meta"><dt>Schema</dt><dd>${E(FREEZE.schema)}</dd><dt>Build</dt><dd>${E(FREEZE.build)}</dd><dt>冻结时间</dt><dd>${E(FREEZE.frozenAt)}</dd><dt>QA Build</dt><dd>${E(FREEZE.qa?.build || "—")}</dd><dt>QA Gate</dt><dd>${E(FREEZE.qa?.summary?.gate?.label || "—")}</dd><dt>摘要</dt><dd class="rf217-code">${E(FREEZE.digest || "—")}</dd></dl>`;
  }
  function shell() {
    const q = LAST_QA?.summary || {},
      f = FREEZE;
    return `<section class="rf217" id="rf217Freeze">
    <section class="rf217-hero"><div class="rf217-head"><div><h3>V217 · Release Freeze 最终冻结候选</h3><p>V217 不再扩展术数功能，只负责最终冻结流程：复用 V215 的完整回归门禁，只有运行时 FAIL 为 0 才允许建立本地冻结记录。已知研究缺口继续保留，不会为了“发布”而伪装成完成。</p></div><span class="rf217-schema">${SCHEMA}</span></div>
      <div class="rf217-tools"><button class="primary" id="rf217Run" type="button">运行最终完整门禁</button><button class="freeze" id="rf217FreezeBtn" type="button"${classify(LAST_QA).canFreeze ? "" : " disabled"}>冻结当前 RC</button><button id="rf217JSON" type="button"${f ? "" : " disabled"}>下载冻结清单 JSON</button><button class="danger" id="rf217Unfreeze" type="button"${f ? "" : " disabled"}>解除本地冻结</button></div>
      <div class="rf217-status" id="rf217Status">${f ? "已建立本地冻结记录；文件本身仍可正常使用。" : "尚未运行最终门禁。"}</div>
    </section>
    <div class="rf217-kpis">
      <div class="rf217-kpi ${f ? "good" : "cyan"}"><small>冻结状态</small><b>${f ? "FROZEN" : "PENDING"}</b></div>
      <div class="rf217-kpi"><small>QA FAIL</small><b>${q.fail ?? "—"}</b></div>
      <div class="rf217-kpi gold"><small>QA WARN</small><b>${q.warn ?? "—"}</b></div>
      <div class="rf217-kpi good"><small>通知默认</small><b>OFF</b></div>
      <div class="rf217-kpi cyan"><small>启动基线</small><b>V201</b></div>
      <div class="rf217-kpi gold"><small>候选阶段</small><b>FREEZE</b></div>
    </div>
    <div class="rf217-grid">
      <section class="rf217-card"><h4>最终门禁</h4><div id="rf217Gate">${gateHTML()}</div><div class="rf217-note" style="margin-top:6px">冻结条件只看运行时 QA 是否有 FAIL。奇门第三方 reference pending 与七政前置 blocked 属于产品研究边界，会继续进入“已知限制”，不会被隐藏。</div></section>
      <aside class="rf217-card"><h4>冻结记录</h4><div id="rf217Meta">${freezeMeta()}</div></aside>
    </div>
    <section class="rf217-card"><h4>发布冻结原则</h4><div class="rf217-list">
      <div class="rf217-item good"><b>功能冻结</b><small>从这一版开始，不再因为“看起来还能加”而继续增加主模块；只接受阻塞性 bug、布局、性能、数据一致性和发布级修复。</small></div>
      <div class="rf217-item warn"><b>研究缺口不伪装完成</b><small>奇门日/月/年独立 reference 与七政前置条件继续保留原状态。</small></div>
      <div class="rf217-item cyan"><b>部署层仍暂缓</b><small>Surge / Cloudflare / Worker / 缓存配置等，等正式决定推送时再一次性生成，不混入当前 HTML 冻结。</small></div>
    </div></section>
  </section>`;
  }
  function saveBlob(name, text, type) {
    const blob = new Blob([text], { type }),
      url = URL.createObjectURL(blob),
      a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1600);
  }
  function refresh() {
    const host = document.getElementById("rf217Freeze");
    if (!host) return;
    const box = document.createElement("div");
    box.innerHTML = shell();
    host.replaceWith(box.firstElementChild);
    bind();
  }
  function bind() {
    document.getElementById("rf217Run")?.addEventListener("click", async () => {
      const b = document.getElementById("rf217Run");
      if (b) {
        b.disabled = true;
        b.textContent = "运行中…";
      }
      try {
        await runFinal();
        refresh();
        try {
          toast(
            LAST_QA?.summary?.fail ? "最终门禁存在 FAIL，请先修复" : "最终门禁完成，可执行冻结",
          );
        } catch (_) {}
      } catch (err) {
        try {
          toast("最终门禁失败：" + String(err?.message || err));
        } catch (_) {}
      } finally {
        const bb = document.getElementById("rf217Run");
        if (bb) {
          bb.disabled = false;
          bb.textContent = "运行最终完整门禁";
        }
      }
    });
    document.getElementById("rf217FreezeBtn")?.addEventListener("click", async () => {
      try {
        await freezeNow();
        refresh();
        try {
          toast("已建立 V217 本地冻结记录");
        } catch (_) {}
      } catch (err) {
        try {
          toast(String(err?.message || err));
        } catch (_) {}
      }
    });
    document.getElementById("rf217JSON")?.addEventListener("click", () => {
      if (FREEZE)
        saveBlob(
          `天机盘_V217_ReleaseFreeze_${Date.now()}.json`,
          JSON.stringify(FREEZE, null, 2),
          "application/json;charset=utf-8",
        );
    });
    document.getElementById("rf217Unfreeze")?.addEventListener("click", () => {
      unfreeze();
      refresh();
      try {
        toast("已解除本地冻结记录");
      } catch (_) {}
    });
  }
  try {
    const old = REF_PANES.verify,
      oldBind = REF_BIND.verify;
    if (old && !old.__v217) {
      const fn = () => shell() + old();
      fn.__v217 = true;
      REF_PANES.verify = fn;
    }
    REF_BIND.verify = () => {
      try {
        oldBind && oldBind();
      } catch (err) {
        console.warn("[V217 old verify bind]", err);
      }
      try {
        bind();
      } catch (err) {
        console.warn("[V217 bind]", err);
      }
    };
  } catch (err) {
    console.warn("[V217 freeze patch]", err);
  }

  function selfTest() {
    const C = [],
      add = (id, ok, d = "") => C.push({ id, ok: !!ok, d });
    add("qa.api", typeof window.TianjiReleaseQA?.full === "function", "");
    add("freeze.schema", SCHEMA === "tianji.release.freeze.v1", SCHEMA);
    add("default.not-frozen", FREEZE === null || FREEZE?.schema === SCHEMA, "");
    add("no-auto-qa", LAST_QA === null && !RUNNING, "");
    return { ok: C.every((x) => x.ok), checks: C };
  }
  const TEST = selfTest();

  window.TianjiReleaseFreeze = Object.freeze({
    version: "1.0.0",
    build: BUILD,
    schema: SCHEMA,
    runFinal: () => runFinal(),
    gate: () => clone(classify(LAST_QA)),
    freeze: () => freezeNow(),
    unfreeze: () => unfreeze(),
    record: () => (FREEZE ? clone(FREEZE) : null),
    selfTest: () => clone(TEST),
    manifest: () => ({
      module: "Tianji Release Freeze V217",
      releaseStage: "freeze-candidate",
      automaticQA: false,
      freezeRule: "V215 full QA fail === 0",
      preserves: [
        "V200 layout guard",
        "V201 startup optimization",
        "V214 formal Evidence report",
        "V215 release QA",
      ],
      knownLimits: ["奇门日/月/年第三方 reference pending", "七政四余前置 blocked"],
      deployment: "deferred until explicit publish decision",
    }),
  });
  window.TianjiSystemV217 = {
    version: "v217",
    build: BUILD,
    releaseFreeze: true,
    releaseStage: "freeze-candidate",
    noticeQuietDefault: true,
    baseline: "v215",
  };

  try {
    const road = window.TianjiRoadmap || {},
      board = window.TianjiPriorityBoard?.snapshot?.();
    window.TianjiRoadmap = Object.freeze(
      Object.assign({}, road, {
        releaseFreeze: {
          build: BUILD,
          stage: "freeze-candidate",
          runtimeGate: "manual via TianjiReleaseQA.full()",
          freezeRule: "fail===0",
          deployment: "deferred",
        },
        urgentImportant: board || road.urgentImportant,
        nextMainline: [
          "运行 V217 最终完整门禁并冻结当前 RC",
          "仅修复发布阻塞性问题",
          "正式决定推送时再生成 Surge / Cloudflare / Worker / 缓存配置",
        ],
      }),
    );
  } catch (_) {}

  function sync() {
    const b = document.getElementById("buildVersion");
  }
  /* V226: historical delayed version writer disabled */
})();
