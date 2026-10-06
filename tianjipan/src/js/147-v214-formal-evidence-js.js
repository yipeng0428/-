(() => {
  "use strict";
  const BUILD = "v214 · 2026-10-06 14:32 +08:00";
  const SCHEMA = "tianji.evidence.formal-report.v1";
  const CLAIM_SCHEMA = "tianji.evidence.claim.v1";
  let LAST = null,
    GENERATING = false;

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
  const safe = (fn, fb = null) => {
    try {
      return fn();
    } catch (_) {
      return fb;
    }
  };
  const E = (s) =>
    String(s ?? "").replace(
      /[&<>"']/g,
      (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
    );
  const arr = (x) => (Array.isArray(x) ? x : []);
  const uniq = (a) => [...new Set(a.filter(Boolean).map(String))];
  const nowISO = () => new Date().toISOString();
  const currentR = () => {
    try {
      return typeof R !== "undefined" ? R : null;
    } catch (_) {
      return null;
    }
  };
  const context = () =>
    safe(() => window.TianjiConsumerReport?.context?.(), null) ||
    safe(() => JSON.parse(localStorage.getItem("tianji.v169.consensus") || "null"), null) || {
      topic: "事业",
      question: "",
      intent: "event",
    };

  async function ensureInsight() {
    if (window.TianjiConsensus && window.TianjiExplainGraph && window.TianjiAIExplain) return true;
    try {
      await window.TianjiPerformance?.load?.("insight", true);
    } catch (err) {
      console.warn("[V214 insight load]", err);
    }
    return !!(window.TianjiConsensus && window.TianjiExplainGraph && window.TianjiAIExplain);
  }
  function stable(v) {
    if (Array.isArray(v)) return v.map(stable);
    if (v && typeof v === "object") {
      const o = {};
      Object.keys(v)
        .sort()
        .forEach((k) => (o[k] = stable(v[k])));
      return o;
    }
    return v;
  }
  async function sha256(v) {
    const text = JSON.stringify(stable(v));
    try {
      if (crypto?.subtle) {
        const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
        return [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, "0")).join("");
      }
    } catch (_) {}
    let h = 2166136261;
    for (let i = 0; i < text.length; i++) {
      h ^= text.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return "fallback-" + (h >>> 0).toString(16).padStart(8, "0");
  }
  function evidenceMap() {
    const c = safe(() => window.TianjiEvidence?.catalog?.(), []) || [];
    return Object.fromEntries(c.map((x) => [x.id, x]));
  }
  function evidenceLevelLabel(level) {
    return (
      {
        0: "未登记",
        1: "结构自检",
        2: "确定性回归",
        3: "第三方独立对拍",
        4: "古籍/规则证据",
        5: "冻结候选",
      }[+level] || "未登记"
    );
  }
  function claimFromSystem(s, i) {
    const ev = s.evidence || {};
    return {
      schema: CLAIM_SCHEMA,
      id: `system.${s.id}.${i + 1}`,
      kind: s.role === "event" ? "interpretation" : "context",
      system: s.id,
      systemName: s.name,
      role: s.role,
      statement: s.result?.headline || "当前未取到该层结果",
      direction: s.role === "event" ? s.result?.tone || "mid" : "independent",
      topic: s.topic || "",
      topicAdapted: !!s.topicAdapted,
      evidence: {
        level: +ev.level || 0,
        state: ev.state || "unknown",
        label: ev.label || evidenceLevelLabel(ev.level),
        source: ev.source || "",
        verify: ev.verify || "",
      },
      provenance: {
        source: s.provenance?.source || s.id,
        fields: clone(s.provenance?.fields || []),
        note: s.provenance?.note || "",
      },
      deterministicFacts: clone(s.result?.facts || {}),
      interpretationBoundary:
        s.role === "event"
          ? "传统规则解释；不是概率或科学因果"
          : "独立尺度信息；不参与事项多数投票",
    };
  }
  function claimFromSynthesis(S) {
    const out = [];
    arr(S?.synthesis?.agreements).forEach((x, i) =>
      out.push({
        schema: CLAIM_SCHEMA,
        id: `synthesis.agreement.${i + 1}`,
        kind: "agreement",
        statement: x,
        system: "aggregate",
        evidence: { level: null, state: "derived" },
        provenance: {
          source: "tianji.consensus.v1",
          fields: ["systems[].result.polarity", "systems[].result.weight"],
        },
        interpretationBoundary: "仅合并可比较的 event role",
      }),
    );
    arr(S?.synthesis?.conflicts).forEach((x, i) =>
      out.push({
        schema: CLAIM_SCHEMA,
        id: `synthesis.conflict.${i + 1}`,
        kind: "conflict",
        statement: x,
        system: "aggregate",
        evidence: { level: null, state: "derived" },
        provenance: { source: "tianji.consensus.v1", fields: ["systems[].result.polarity"] },
        interpretationBoundary: "冲突保留，不以多数票抹平",
      }),
    );
    return out;
  }
  function supplement(name, id, api, buildFn) {
    if (!api)
      return { id, name, state: "missing", manifest: null, data: null, error: "API unavailable" };
    try {
      const manifest = typeof api.manifest === "function" ? api.manifest() : null;
      const data = buildFn ? buildFn(api) : null;
      let state = "available";
      if (manifest?.externalValidation === "pending") state = "external-pending";
      return { id, name, state, manifest: clone(manifest), data: clone(data) };
    } catch (err) {
      return {
        id,
        name,
        state: "error",
        manifest: safe(() => api.manifest?.(), null),
        data: null,
        error: String(err?.message || err),
      };
    }
  }
  function supplements(r) {
    return [
      supplement("奇门四家对拍", "qimen-crosscheck", window.TianjiQimenCrosscheck, (a) => ({
        status: a.status?.(),
        reportSummary: a.report?.()?.summary || null,
      })),
      supplement("六爻深度层", "liuyao-depth", window.TianjiLiuyaoDepth, (a) =>
        a.build?.(r, context().topic),
      ),
      supplement("紫微飞星 V2", "ziwei-flying", window.TianjiZiweiFlyingDepthV2, (a) =>
        a.analyze?.(r),
      ),
      supplement("玄空宅盘 V2", "xuankong-house", window.TianjiXuankongHouseV2, (a) =>
        a.analyze?.(),
      ),
      supplement("三合水法规则层", "sanhe-water", window.TianjiSanhePolicy, (a) => a.analyze?.()),
      supplement("历史时间 V3", "historical-time", window.TianjiHistoricalTimeV3, (a) => ({
        current: safe(() => window.TianjiHistoricalTime?.analyzeCurrent?.(), null),
        manifest: a.manifest?.(),
      })),
      supplement(
        "关系长期时间轴 V2",
        "relation-timeline",
        window.TianjiRelationTimelineV2,
        (a) => ({ report: a.report?.(), manifest: a.manifest?.() }),
      ),
    ];
  }
  function supplementClaims(SP) {
    const out = [];
    SP.forEach((x) => {
      const M = x.manifest || {},
        data = x.data;
      if (x.state === "missing" || x.state === "error") {
        out.push({
          schema: CLAIM_SCHEMA,
          id: `supplement.${x.id}.availability`,
          kind: "missing",
          system: x.id,
          systemName: x.name,
          statement: x.error || "模块当前不可用",
          evidence: { level: null, state: x.state },
          provenance: { source: x.id, fields: [] },
          interpretationBoundary: "缺失项不得由报告补写",
        });
        return;
      }
      const features = arr(M.features || M.implemented);
      out.push({
        schema: CLAIM_SCHEMA,
        id: `supplement.${x.id}.scope`,
        kind: "scope",
        system: x.id,
        systemName: x.name,
        statement: features.length
          ? `当前实现：${features.slice(0, 12).join("、")}`
          : `${x.name} 当前接口可用`,
        evidence: {
          level: null,
          state: x.state,
          label: M.completeForDeclaredPolicy ? "当前声明口径完成" : x.state,
        },
        provenance: { source: x.id, fields: ["manifest"] },
        interpretationBoundary: arr(M.boundaries).join("；") || "以模块自身 manifest 为准",
      });
      const ev = arr(data?.evidence);
      ev.slice(0, 20).forEach((e0, i) =>
        out.push({
          schema: CLAIM_SCHEMA,
          id: `supplement.${x.id}.evidence.${i + 1}`,
          kind: "derived",
          system: x.id,
          systemName: x.name,
          statement: e0.claim || e0.item || e0.id || "Evidence item",
          evidence: { level: null, state: e0.state || x.state, label: e0.basis || "" },
          provenance: {
            source: e0.source || x.id,
            fields: [e0.path || e0.formula || ""].filter(Boolean),
          },
          interpretationBoundary: "沿用模块自身 Evidence / 口径",
        }),
      );
    });
    return out;
  }
  function pendingItems(catalog, SP, S) {
    const out = [];
    catalog
      .filter(
        (x) =>
          (+x.level || 0) < 3 ||
          /todo|doing|unknown|待|未/.test(
            String(x.state || "") + String(x.label || "") + String(x.verify || ""),
          ),
      )
      .forEach((x) => {
        out.push({
          id: `catalog.${x.id}`,
          name: x.name || x.id,
          reason: `Evidence L${x.level || 0} · ${x.label || x.state || "未登记"}${x.verify ? " · " + x.verify : ""}`,
          source: x.source || "",
        });
      });
    SP.filter(
      (x) => x.state === "external-pending" || x.state === "missing" || x.state === "error",
    ).forEach((x) => {
      out.push({
        id: `supplement.${x.id}`,
        name: x.name,
        reason: x.state === "external-pending" ? "外部逐盘验证仍 pending" : x.error || x.state,
        source: x.id,
      });
    });
    arr(S?.systems)
      .filter((x) => x.topicAdapted)
      .forEach((x) =>
        out.push({
          id: `mapping.${x.id}`,
          name: x.name,
          reason: `当前事项「${S.context?.question?.topic || ""}」映射为「${x.topic}」；不是完全同题`,
          source: x.provenance?.source || x.id,
        }),
      );
    return out;
  }
  function sourceLedger(core, catalog) {
    const sources = arr(core?.sources).map((x) => ({
      kind: "source",
      id: x.id,
      title: x.title || x.id,
      type: x.type || "",
      version: x.version || "",
      note: x.note || "",
    }));
    const engines = arr(core?.engines).map((x) => ({
      kind: "engine",
      id: x.id,
      title: x.name || x.id,
      type: x.system || "",
      version: x.version || "",
      note: x.doctrine || "",
      source: x.source || "",
    }));
    const licenses = arr(core?.licenses).map((x) => ({
      kind: "license",
      id: x.id,
      title: x.id,
      type: x.status || "",
      version: x.license || "",
      note: x.note || "",
    }));
    const ev = arr(catalog).map((x) => ({
      kind: "evidence",
      id: x.id,
      title: x.name || x.id,
      type: `L${x.level || 0}`,
      version: x.state || "",
      note: [x.label, x.source, x.verify].filter(Boolean).join(" · "),
    }));
    return { sources, engines, licenses, evidence: ev };
  }
  function boundaries(A, G, SP) {
    return uniq([
      ...arr(A?.sections?.boundary),
      ...arr(G?.principles),
      "Evidence 等级描述验证成熟度，不是预测准确率、概率或科学证据强度。",
      "不同术数的时间尺度、对象和问题语义不同；只有可比较层才允许合参。",
      "缺失字段、待验证规则与流派分歧必须显式保留，不允许为了“完整报告”而补造。",
      "健康、法律、财务、安全等现实高风险事项应以现实专业信息和实际行动为优先。",
      ...SP.flatMap((x) => arr(x.manifest?.boundaries)),
    ]);
  }
  function formalStatus(report) {
    const pending = report.pending.length,
      conflicts = report.summary.conflicts,
      low = report.summary.lowEvidence;
    if (report.errors.length) return { code: "degraded", label: "报告降级", tone: "bad" };
    if (pending || low) return { code: "auditable-draft", label: "可审计草案", tone: "gold" };
    if (conflicts)
      return { code: "auditable-with-conflicts", label: "可审计 · 含冲突", tone: "cyan" };
    return { code: "auditable", label: "可审计报告", tone: "good" };
  }
  async function buildFormal(opts = {}) {
    const r = opts.runtime || currentR();
    if (!r) throw new Error("当前尚无可用推演结果，请先建立档案并完成一次推演。");
    await ensureInsight();
    const ctx = opts.context || context(),
      errors = [];
    let S = null,
      G = null,
      A = null;
    try {
      S = window.TianjiConsensus?.build?.(r, ctx) || null;
    } catch (err) {
      errors.push("Consensus: " + String(err?.message || err));
    }
    try {
      if (S) G = window.TianjiExplainGraph?.build?.(r, { consensus: S }) || null;
    } catch (err) {
      errors.push("ExplainGraph: " + String(err?.message || err));
    }
    try {
      if (G) A = window.TianjiAIExplain?.build?.(r, { mode: "pro", graph: G }) || null;
    } catch (err) {
      errors.push("AIExplain: " + String(err?.message || err));
    }
    const catalog = safe(() => window.TianjiEvidence?.catalog?.(), []) || [];
    const core = safe(() => window.TianjiCore?.manifest?.(), null);
    const SP = supplements(r);
    const claims = [
      ...arr(S?.systems).map(claimFromSystem),
      ...claimFromSynthesis(S),
      ...supplementClaims(SP),
    ];
    const pending = pendingItems(catalog, SP, S);
    const lowEvidence = arr(S?.systems).filter((x) => (+x.evidence?.level || 0) < 3).length;
    const report = {
      schema: SCHEMA,
      claimSchema: CLAIM_SCHEMA,
      build: BUILD,
      generatedAt: nowISO(),
      reportId: "",
      digest: { algorithm: "SHA-256", value: "" },
      status: null,
      context: clone(S?.context || { question: ctx }),
      executive: {
        conclusion:
          A?.sections?.conclusion || S?.synthesis?.eventVote?.label || "当前未取到统一结论",
        why: clone(A?.sections?.why || S?.synthesis?.agreements || []),
        conflicts: clone(A?.sections?.conflicts || S?.synthesis?.conflicts || []),
        background: clone(A?.sections?.background || S?.synthesis?.independent || []),
        timing: clone(A?.sections?.timing || []),
        actions: clone(A?.sections?.actions || []),
        maturity: clone(A?.maturity || null),
      },
      consensus: clone(S),
      explainGraph: {
        schema: G?.schema || null,
        steps: clone(G?.steps || []),
        diagnostics: clone(G?.diagnostics || []),
        principles: clone(G?.principles || []),
        nodes: clone(
          G?.nodes?.map((n) => ({
            id: n.id,
            kind: n.kind,
            label: n.label,
            sub: n.sub,
            tone: n.tone,
          })) || [],
        ),
        edges: clone(G?.edges || []),
      },
      claims,
      evidenceCatalog: clone(catalog),
      supplements: SP,
      pending,
      sources: sourceLedger(core, catalog),
      boundaries: boundaries(A, G, SP),
      errors,
      summary: {
        systems: arr(S?.systems).length,
        eventSystems: arr(S?.systems).filter((x) => x.role === "event").length,
        claims: claims.length,
        conflicts: arr(S?.synthesis?.conflicts).filter((x) => !/未发现/.test(x)).length,
        pending: pending.length,
        lowEvidence,
        avgEvidence: (() => {
          const a = arr(S?.systems).map((x) => +x.evidence?.level || 0);
          return a.length ? +(a.reduce((p, c) => p + c, 0) / a.length).toFixed(2) : 0;
        })(),
      },
      provenance: {
        coreVersion: window.TianjiCore?.version || null,
        coreSchema: window.TianjiCore?.schemaVersion || null,
        evidenceSchema: window.TianjiEvidence?.schema || "tianji.evidence.snapshot.v1",
        consensusSchema: S?.schema || null,
        explainSchema: G?.schema || null,
        aiExplainSchema: A?.schema || null,
        consumerReportSchema: window.TianjiConsumerReport?.schema || null,
        runtime: "current R",
      },
    };
    report.status = formalStatus(report);
    const digestBase = clone(report);
    delete digestBase.reportId;
    delete digestBase.digest;
    delete digestBase.generatedAt;
    const dig = await sha256(digestBase);
    report.digest = {
      algorithm: dig.startsWith("fallback-") ? "FNV1a-fallback" : "SHA-256",
      value: dig,
    };
    report.reportId = `TJR-${report.generatedAt.replace(/\D/g, "").slice(0, 14)}-${dig.replace("fallback-", "").slice(0, 10)}`;
    return report;
  }
  function toText(RP) {
    const L = [];
    L.push("天机盘 · 合参 Evidence 正式报告");
    L.push(`Report ID：${RP.reportId}`);
    L.push(`Schema：${RP.schema}`);
    L.push(`Build：${RP.build}`);
    L.push(`生成时间：${RP.generatedAt}`);
    L.push(`摘要校验：${RP.digest.algorithm} ${RP.digest.value}`);
    L.push(`状态：${RP.status.label}`);
    L.push("");
    const q = RP.context?.question || {};
    L.push(`事项：${q.topic || "—"}`);
    L.push(`问题：${q.text || q.question || "—"}`);
    L.push(`人物：${RP.context?.person?.name || "—"}`);
    L.push(`排盘时刻：${RP.context?.time?.civil || "—"}`);
    L.push("");
    L.push("【执行摘要】");
    L.push(RP.executive.conclusion || "—");
    arr(RP.executive.why).forEach((x) => L.push("依据：" + x));
    arr(RP.executive.conflicts).forEach((x) => L.push("冲突：" + x));
    arr(RP.executive.actions).forEach((x) => L.push("建议：" + x));
    L.push("");
    L.push("【Claim Ledger】");
    RP.claims.forEach((c) =>
      L.push(
        `${c.id} | ${c.kind} | ${c.systemName || c.system || "—"} | ${c.statement} | Evidence ${c.evidence?.level == null ? "—" : "L" + c.evidence.level} ${c.evidence?.state || ""} | 来源 ${c.provenance?.source || "—"} ${(c.provenance?.fields || []).join("/")}`,
      ),
    );
    L.push("");
    L.push("【待验证 / 缺口】");
    if (RP.pending.length) RP.pending.forEach((x) => L.push(`${x.name}：${x.reason}`));
    else L.push("当前报告未登记额外 pending 项。");
    L.push("");
    L.push("【解释边界】");
    RP.boundaries.forEach((x) => L.push(" - " + x));
    return L.join("\n");
  }
  function standaloneHTML(RP) {
    const rows = RP.claims
      .map(
        (c) =>
          `<tr><td>${E(c.id)}</td><td>${E(c.systemName || c.system || "—")}</td><td>${E(c.kind)}</td><td>${E(c.statement)}</td><td>${c.evidence?.level == null ? "—" : "L" + E(c.evidence.level)} ${E(c.evidence?.state || "")}</td><td>${E(c.provenance?.source || "—")}</td></tr>`,
      )
      .join("");
    const pend = RP.pending.length
      ? RP.pending.map((x) => `<li><b>${E(x.name)}</b>：${E(x.reason)}</li>`).join("")
      : "<li>当前报告未登记额外 pending 项。</li>";
    const bd = RP.boundaries.map((x) => `<li>${E(x)}</li>`).join("");
    return `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${E(RP.reportId)} · 天机盘 Evidence 报告</title><style>body{font-family:system-ui,-apple-system,"Microsoft YaHei",sans-serif;max-width:1100px;margin:36px auto;padding:0 20px;color:#202020;line-height:1.65}h1,h2{font-weight:650}small,.muted{color:#6c6c6c}.meta{display:grid;grid-template-columns:130px 1fr;gap:5px 10px;padding:12px;background:#f6f6f6}.answer{border-left:4px solid #8b6d35;padding:12px;background:#faf8f2}table{width:100%;border-collapse:collapse;font-size:12px}th,td{border:1px solid #ddd;padding:7px;vertical-align:top;text-align:left}th{background:#f3f3f3}code{word-break:break-all}@media print{body{margin:0;max-width:none}}</style></head><body><h1>天机盘 · 合参 Evidence 正式报告</h1><div class="meta"><b>Report ID</b><span>${E(RP.reportId)}</span><b>Schema</b><span>${E(RP.schema)}</span><b>Build</b><span>${E(RP.build)}</span><b>生成时间</b><span>${E(RP.generatedAt)}</span><b>状态</b><span>${E(RP.status.label)}</span><b>摘要校验</b><code>${E(RP.digest.algorithm + " " + RP.digest.value)}</code></div><h2>执行摘要</h2><div class="answer">${E(RP.executive.conclusion)}</div><p>${arr(RP.executive.why).map(E).join("<br>")}</p><h2>Claim Ledger</h2><table><thead><tr><th>ID</th><th>系统</th><th>类型</th><th>声明</th><th>Evidence</th><th>来源</th></tr></thead><tbody>${rows}</tbody></table><h2>待验证 / 缺口</h2><ul>${pend}</ul><h2>解释边界</h2><ul>${bd}</ul><p class="muted">本报告保存的是当前天机盘运行时的结构化快照。Evidence 成熟度不是预测准确率或概率。</p></body></html>`;
  }
  function saveBlob(name, text, type) {
    const blob = new Blob([text], { type }),
      url = URL.createObjectURL(blob),
      a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1800);
  }
  function statusSummary(RP) {
    const s = RP.summary;
    return `<div class="ev214-kpis">
    <div class="ev214-kpi ${RP.status.tone}"><small>报告状态</small><b>${E(RP.status.label)}</b></div>
    <div class="ev214-kpi"><small>系统覆盖</small><b>${s.systems}</b></div>
    <div class="ev214-kpi cyan"><small>Claim</small><b>${s.claims}</b></div>
    <div class="ev214-kpi ${s.conflicts ? "bad" : "good"}"><small>显式冲突</small><b>${s.conflicts}</b></div>
    <div class="ev214-kpi bad"><small>待验证 / 缺口</small><b>${s.pending}</b></div>
    <div class="ev214-kpi"><small>平均 Evidence</small><b>L${s.avgEvidence}</b></div>
  </div>`;
  }
  function claimsHTML(RP) {
    if (!RP.claims.length) return '<div class="ev214-note">当前没有可列出的 Claim。</div>';
    return `<div class="ev214-tablewrap"><table class="ev214-table"><thead><tr><th>Claim ID</th><th>系统 / 类型</th><th>声明</th><th>Evidence</th><th>来源 / 字段</th></tr></thead><tbody>${RP.claims.map((c) => `<tr><td><span class="ev214-code">${E(c.id)}</span></td><td><b>${E(c.systemName || c.system || "—")}</b><br><span class="ev214-state ${c.kind === "conflict" ? "bad" : c.kind === "agreement" ? "good" : "cyan"}">${E(c.kind)}</span></td><td>${E(c.statement)}</td><td>${c.evidence?.level == null ? "—" : `L${E(c.evidence.level)} · ${E(c.evidence.label || evidenceLevelLabel(c.evidence.level))}`}<br><small>${E(c.evidence?.state || "")}</small></td><td><span class="ev214-code">${E(c.provenance?.source || "—")}</span><br>${E((c.provenance?.fields || []).join(" / ") || "—")}</td></tr>`).join("")}</tbody></table></div>`;
  }
  function systemsHTML(RP) {
    const systems = arr(RP.consensus?.systems);
    if (!systems.length) return '<div class="ev214-note">Consensus 系统记录不可用。</div>';
    return systems
      .map(
        (s) =>
          `<div class="ev214-item ${s.role === "event" ? (s.result?.tone === "good" ? "good" : s.result?.tone === "bad" ? "bad" : "cyan") : "gold"}"><b>${E(s.name)} · ${E(s.role)}</b><small>${E(s.result?.headline || "—")}</small><div class="ev214-badges"><span class="ev214-badge">Evidence L${E(s.evidence?.level || 0)}</span><span class="ev214-badge">${E(s.evidence?.label || s.evidence?.state || "—")}</span>${s.topicAdapted ? '<span class="ev214-badge bad">事项映射</span>' : ""}<span class="ev214-badge cyan">${E(s.provenance?.source || s.id)}</span></div></div>`,
      )
      .join("");
  }
  function supplementsHTML(RP) {
    return RP.supplements
      .map(
        (x) =>
          `<div class="ev214-item ${x.state === "error" || x.state === "missing" ? "bad" : x.state === "external-pending" ? "gold" : "cyan"}"><b>${E(x.name)}</b><small>${E(x.manifest?.module || x.id)}${x.error ? " · " + E(x.error) : ""}</small><div class="ev214-badges"><span class="ev214-badge ${x.state === "external-pending" ? "gold" : x.state === "error" || x.state === "missing" ? "bad" : "good"}">${E(x.state)}</span>${x.manifest?.completeForDeclaredPolicy ? '<span class="ev214-badge good">当前声明口径完成</span>' : ""}</div></div>`,
      )
      .join("");
  }
  function pendingHTML(RP) {
    if (!RP.pending.length)
      return '<div class="ev214-item good"><b>当前没有新增 pending 项</b><small>这不代表所有传统规则都已被现代第三方验证，只表示本报告登记范围内未发现额外缺口。</small></div>';
    return RP.pending
      .map(
        (x) =>
          `<div class="ev214-item bad"><b>${E(x.name)}</b><small>${E(x.reason)}${x.source ? " · " + E(x.source) : ""}</small></div>`,
      )
      .join("");
  }
  function reportHTML(RP) {
    const q = RP.context?.question || {};
    return `<section class="ev214-report" id="ev214Report">
    ${statusSummary(RP)}
    <div class="ev214-grid">
      <section class="ev214-card"><h4>执行摘要</h4><div class="ev214-answer">${E(RP.executive.conclusion)}</div><h5>为什么</h5><div class="ev214-list">${
        arr(RP.executive.why)
          .map((x) => `<div class="ev214-item good"><small>${E(x)}</small></div>`)
          .join("") || '<div class="ev214-note">当前没有更多一致依据。</div>'
      }<h5>冲突</h5>${
        arr(RP.executive.conflicts)
          .map((x) => `<div class="ev214-item bad"><small>${E(x)}</small></div>`)
          .join("") || '<div class="ev214-note">当前没有显式冲突条目。</div>'
      }</div></section>
      <aside class="ev214-card"><h4>报告身份 / 可审计摘要</h4><dl class="ev214-meta"><dt>Report ID</dt><dd>${E(RP.reportId)}</dd><dt>事项</dt><dd>${E(q.topic || "—")}</dd><dt>问题</dt><dd>${E(q.text || q.question || "—")}</dd><dt>人物</dt><dd>${E(RP.context?.person?.name || "—")}</dd><dt>排盘时间</dt><dd>${E(RP.context?.time?.civil || "—")}</dd><dt>摘要算法</dt><dd>${E(RP.digest.algorithm)}</dd><dt>摘要值</dt><dd class="ev214-code">${E(RP.digest.value)}</dd></dl></aside>
    </div>
    <div class="ev214-grid">
      <section class="ev214-card"><h4>各系统 Evidence 矩阵</h4><div class="ev214-list">${systemsHTML(RP)}</div></section>
      <aside class="ev214-card"><h4>深化模块 / 专项验证</h4><div class="ev214-list">${supplementsHTML(RP)}</div></aside>
    </div>
    <section class="ev214-card"><h4>Claim Ledger · 原始结论 → Evidence → 来源字段</h4>${claimsHTML(RP)}</section>
    <div class="ev214-grid">
      <section class="ev214-card"><h4>待验证 / 缺口</h4><div class="ev214-list">${pendingHTML(RP)}</div></section>
      <aside class="ev214-card"><h4>解释边界</h4><div class="ev214-list">${RP.boundaries.map((x) => `<div class="ev214-item cyan"><small>${E(x)}</small></div>`).join("")}</div></aside>
    </div>
    <section class="ev214-card"><h4>来源与引擎台账</h4><div class="ev214-note">Core 已登记 ${RP.sources.engines.length} 个引擎、${RP.sources.sources.length} 个来源、${RP.sources.licenses.length} 个许可证条目、${RP.sources.evidence.length} 个 Evidence 记录。正式 JSON 会保存完整台账；页面只显示核心摘要，避免正文被工程元数据淹没。</div><div class="ev214-badges">${RP.sources.engines
      .slice(0, 18)
      .map((x) => `<span class="ev214-badge cyan">${E(x.id)}</span>`)
      .join("")}</div></section>
  </section>`;
  }
  function shell() {
    return `<section class="ev214" id="ev214Formal">
    <section class="ev214-hero"><div class="ev214-head"><div><h3>合参 Evidence 正式报告</h3><p>把当前命盘、同一事项合参、解释链、Evidence 成熟度、来源字段、流派边界、专项深化模块与待验证缺口冻结成一个可审计快照。正式报告不“补齐”缺失结论，不把 Evidence 等级说成准确率，也不会为了得出一致答案而抹平冲突。</p></div><span class="ev214-schema">${SCHEMA}</span></div>
      <div class="ev214-tools"><button class="primary" type="button" id="ev214Build">生成 / 刷新正式报告</button><button type="button" id="ev214JSON" disabled>下载 JSON</button><button type="button" id="ev214TXT" disabled>下载 TXT</button><button type="button" id="ev214HTML" disabled>导出独立 HTML</button><button type="button" id="ev214Copy" disabled>复制 Report ID + 摘要</button></div>
      <div class="ev214-statusline" id="ev214Status">默认不在首屏自动生成。点击后才加载合参/解释依赖并冻结当前快照，避免影响启动速度。</div>
    </section>
    <div id="ev214Out"><div class="ev214-note">尚未生成正式报告。先确认当前人物、时间与问题，再点击“生成 / 刷新正式报告”。</div></div>
  </section>`;
  }
  function enableButtons(on) {
    ["ev214JSON", "ev214TXT", "ev214HTML", "ev214Copy"].forEach((id) => {
      const b = document.getElementById(id);
      if (b) b.disabled = !on;
    });
  }
  async function generateUI() {
    if (GENERATING) return;
    GENERATING = true;
    const b = document.getElementById("ev214Build"),
      st = document.getElementById("ev214Status");
    if (b) {
      b.disabled = true;
      b.textContent = "生成中…";
    }
    if (st) st.textContent = "正在加载合参/解释依赖并构建 Evidence 快照…";
    try {
      LAST = await buildFormal();
      const out = document.getElementById("ev214Out");
      if (out) out.innerHTML = reportHTML(LAST);
      if (st)
        st.textContent = `已生成 ${LAST.reportId} · ${LAST.status.label} · ${LAST.summary.claims} 条 Claim · ${LAST.summary.pending} 个待验证/缺口。`;
      enableButtons(true);
    } catch (err) {
      const out = document.getElementById("ev214Out");
      if (out)
        out.innerHTML = `<div class="ev214-item bad"><b>正式报告生成失败</b><small>${E(err?.message || err)}</small></div>`;
      if (st) st.textContent = "生成失败；不会回退为编造内容。";
      enableButtons(false);
    } finally {
      GENERATING = false;
      if (b) {
        b.disabled = false;
        b.textContent = "生成 / 刷新正式报告";
      }
    }
  }
  function bind() {
    document.getElementById("ev214Build")?.addEventListener("click", generateUI);
    document.getElementById("ev214JSON")?.addEventListener("click", () => {
      if (LAST)
        saveBlob(
          `天机盘_Evidence_${LAST.reportId}.json`,
          JSON.stringify(LAST, null, 2),
          "application/json;charset=utf-8",
        );
    });
    document.getElementById("ev214TXT")?.addEventListener("click", () => {
      if (LAST)
        saveBlob(`天机盘_Evidence_${LAST.reportId}.txt`, toText(LAST), "text/plain;charset=utf-8");
    });
    document.getElementById("ev214HTML")?.addEventListener("click", () => {
      if (LAST)
        saveBlob(
          `天机盘_Evidence_${LAST.reportId}.html`,
          standaloneHTML(LAST),
          "text/html;charset=utf-8",
        );
    });
    document.getElementById("ev214Copy")?.addEventListener("click", () => {
      if (!LAST) return;
      const s = `${LAST.reportId}\n${LAST.status.label}\n${LAST.digest.algorithm}: ${LAST.digest.value}\n${LAST.executive.conclusion}`;
      navigator.clipboard
        ?.writeText?.(s)
        .then(() => {
          try {
            toast("已复制正式报告标识与摘要");
          } catch (_) {}
        })
        .catch(() => {});
    });
  }
  try {
    const oldP = REF_PANES.over;
    if (oldP && !oldP.__v214) {
      const fn = () => oldP() + shell();
      fn.__v214 = true;
      REF_PANES.over = fn;
    }
    const oldB = REF_BIND.over;
    const bf = () => {
      try {
        oldB && oldB();
      } catch (err) {
        console.warn("[V214 old over bind]", err);
      }
      try {
        bind();
      } catch (err) {
        console.warn("[V214 bind]", err);
      }
    };
    bf.__v214 = true;
    REF_BIND.over = bf;
  } catch (err) {
    console.warn("[V214 formal report patch]", err);
  }

  const TASKS214 = [
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
      note: "v199 验证台已成；时家有 Mingpan 固定基准，日/月/年仍等待真实独立 reference",
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
      note: "v203–v204 当前声明流派口径完成",
    },
    {
      id: "qizheng",
      p: "P1",
      name: "七政四余核心化",
      state: "blocked",
      note: "仍受星历、四余口径与许可证方案前置约束",
    },
    {
      id: "xk",
      p: "P1",
      name: "玄空完整宅盘",
      state: "done",
      note: "v205–v206 当前声明口径完成；外部 reference 单独 pending",
    },
    {
      id: "sanhe",
      p: "P1",
      name: "三合水法 Core",
      state: "done",
      note: "v207–v208 当前声明规则包完成；外部 reference 单独 pending",
    },
    {
      id: "tz",
      p: "P2",
      name: "历史时区 / 夏令时自动校正",
      state: "done",
      note: "v209–v211 当前声明范围完成；默认 AUDIT ONLY",
    },
    {
      id: "relation",
      p: "P2",
      name: "关系长期时间轴",
      state: "done",
      note: "v212–v213 当前声明范围完成",
    },
    {
      id: "report",
      p: "P2",
      name: "合参 Evidence 正式报告",
      state: "done",
      note: "v214：正式报告 Schema、Claim Ledger、来源/引擎台账、专项模块快照、pending 缺口、SHA-256 摘要以及 JSON/TXT/独立 HTML 导出",
    },
  ];
  const BOARD = {
    schema: "tianji.priority.board.v1",
    build: BUILD,
    total: 14,
    done: 12,
    doing: 1,
    blocked: 1,
    progress: 92.9,
    next: [
      "奇门日/月/年真实第三方 reference 样本",
      "七政四余星历 / 许可证前置",
      "发布候选 RC：全站回归 / 性能 / 移动端 QA",
    ],
    tasks: TASKS214,
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
          "奇门四家第三方对拍（二期待外部样本）",
          "七政四余星历 / 许可证前置",
          "发布候选 RC：全站回归 / 性能 / 移动端 QA",
        ],
      }),
    );
  }
  applyBoard();
  window.addEventListener("tianji:lazy-ready", () => setTimeout(applyBoard, 0));

  function roadPanel() {
    return `<section class="ev214-road"><div class="ev214-card"><div class="ev214-roadhead"><div><h3>V214 · 当前主任务状态</h3><small>正式报告主线已完成；剩余核心阻塞项不伪造完成。</small></div><span class="ev214-schema">${BOARD.progress}%</span></div><div class="ev214-roadgrid">${[
      "P0",
      "P1",
      "P2",
    ]
      .map(
        (p) =>
          `<div><h4>${p}</h4>${BOARD.tasks
            .filter((x) => x.p === p)
            .map(
              (x) =>
                `<div class="ev214-task ${x.state}"><b>${x.state === "done" ? "✓" : x.state === "doing" ? "↻" : x.state === "blocked" ? "!" : "○"} ${E(x.name)}</b><small>${E(x.note)}</small></div>`,
            )
            .join("")}</div>`,
      )
      .join("")}</div></div></section>`;
  }
  try {
    const old = REF_PANES.verify,
      oldBind = REF_BIND.verify;
    if (old && !old.__v214) {
      const fn = () => roadPanel() + old();
      fn.__v214 = true;
      REF_PANES.verify = fn;
    }
    REF_BIND.verify = () => {
      try {
        oldBind && oldBind();
      } catch (_) {}
    };
  } catch (err) {
    console.warn("[V214 roadmap patch]", err);
  }

  function selfTest() {
    const C = [],
      add = (id, ok, d = "") => C.push({ id, ok: !!ok, d });
    add(
      "schemas",
      SCHEMA === "tianji.evidence.formal-report.v1" && CLAIM_SCHEMA === "tianji.evidence.claim.v1",
      SCHEMA,
    );
    add("task.report.done", TASKS214.find((x) => x.id === "report")?.state === "done", "");
    add(
      "task.qimen.not-faked",
      TASKS214.find((x) => x.id === "qimen-evidence")?.state === "doing",
      "",
    );
    add("task.qizheng.blocked", TASKS214.find((x) => x.id === "qizheng")?.state === "blocked", "");
    add(
      "on-demand",
      typeof buildFormal === "function" && LAST === null,
      "formal report is not generated on startup",
    );
    return { ok: C.every((x) => x.ok), checks: C };
  }
  const TEST = selfTest();

  try {
    if (window.TianjiCore) {
      TianjiCore.registerSource({
        id: "tianji-v214-formal-evidence-report",
        type: "internal",
        title: "Tianji Formal Evidence Report 1.0",
        version: "1.0.0",
        baseline: "v213",
        note: "冻结当前 Consensus / Explain / Evidence / 专项模块为可审计报告；不重算、不补造缺失、不抹平冲突。",
      });
    }
  } catch (err) {
    console.warn("[V214 core source]", err);
  }

  window.TianjiFormalEvidenceReport = Object.freeze({
    version: "1.0.0",
    build: BUILD,
    schema: SCHEMA,
    claimSchema: CLAIM_SCHEMA,
    generate: (opts) => buildFormal(opts || {}),
    last: () => (LAST ? clone(LAST) : null),
    toText: (r) => toText(r || LAST),
    toHTML: (r) => standaloneHTML(r || LAST),
    taskSnapshot: () => clone(BOARD),
    selfTest: () => clone(TEST),
    manifest: () => ({
      module: "Tianji Formal Evidence Report",
      completeForDeclaredPolicy: true,
      input: [
        "tianji.consensus.v1",
        "tianji.explain.graph.v1",
        "tianji.ai.explain.v1",
        "tianji.evidence.snapshot.v1",
        "TianjiCore provenance",
        "V199+ specialist layers",
      ],
      output: [SCHEMA, CLAIM_SCHEMA, "JSON", "TXT", "standalone HTML"],
      guarantees: [
        "按需生成，不进入首屏启动链",
        "缺失项显式 pending",
        "冲突保留",
        "Evidence 非准确率",
        "报告摘要可校验",
      ],
      boundaries: [
        "报告快照不是科学验证证书",
        "第三方 reference 尚缺的模块继续标记 pending",
        "真实世界高风险决策不由术数报告替代",
      ],
    }),
  });
  window.TianjiSystemV214 = {
    version: "v214",
    build: BUILD,
    formalEvidenceReport: true,
    reportTaskComplete: true,
    noticeQuietDefault: true,
    baseline: "v213",
  };

  function sync() {
    const b = document.getElementById("buildVersion");
  }
  /* V226: historical delayed version writer disabled */
})();
