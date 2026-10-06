(() => {
  "use strict";
  const BUILD = "v213 · 2026-10-06 14:02 +08:00";
  const SCHEMA = "tianji.relation.timeline.v2";
  const REPORT_SCHEMA = "tianji.relation.long-report.v1";
  const STORE = "tianjipan.relation.timeline.v213";
  let S = {
    selected: [],
    query: "",
    eventType: "all",
    eventScope: "all",
    segments: {},
    reportMode: "focus",
  };
  try {
    const x = JSON.parse(localStorage.getItem(STORE) || "null");
    if (x && typeof x === "object")
      S = { ...S, ...x, segments: x.segments && typeof x.segments === "object" ? x.segments : {} };
  } catch (_) {}
  const save = () => {
    try {
      localStorage.setItem(STORE, JSON.stringify(S));
    } catch (_) {}
  };
  const clone = (x) => (x == null ? x : JSON.parse(JSON.stringify(x)));
  const E = (s) =>
    String(s ?? "").replace(
      /[&<>"']/g,
      (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
    );
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const snap = () => TianjiRelationTimeline.snapshot();
  const V1 = () => snap().data || {};
  const rel = (id) => PPL.rels.find((x) => x.id === id) || null;
  const person = (id) => pplById(id) || null;
  const role = (r) => (PPL_ROLE[r?.role] || PPL_ROLE.other).n;
  const relName = (r) => {
    const A = person(r?.a),
      B = person(r?.b);
    return r ? `${A?.name || "甲"} × ${B?.name || "乙"} · ${role(r)}` : "—";
  };
  const eventTypes = () => ({
    milestone: "里程碑",
    support: "支持 / 合作",
    conflict: "冲突 / 压力",
    change: "关系变化",
    family: "家庭事件",
    distance: "分离 / 迁移",
    reunion: "重聚",
    other: "其他",
  });

  function normalize() {
    const ids = PPL.rels.map((r) => r.id);
    S.selected = (S.selected || []).filter((id) => ids.includes(id)).slice(0, 6);
    if (!S.selected.length) S.selected = ids.slice(0, Math.min(4, ids.length));
    Object.keys(S.segments).forEach((id) => {
      if (!ids.includes(id)) delete S.segments[id];
    });
  }
  normalize();
  save();

  function range() {
    const d = V1(),
      a = +d.startYear || nowBJ().y - 5,
      b = +d.endYear || nowBJ().y + 6;
    return {
      start: Math.min(a, b),
      end: Math.max(a, b),
      years: Array.from(
        { length: Math.max(0, Math.min(25, Math.abs(b - a) + 1)) },
        (_, i) => Math.min(a, b) + i,
      ),
    };
  }
  function annual(id, y) {
    try {
      return TianjiRelationTimeline.annual(id, y);
    } catch (_) {
      return { available: false, year: y, reason: "annual unavailable" };
    }
  }
  function personAnnual(P, y) {
    try {
      const X = pplEng(P),
        idx = (((y - 4) % 60) + 60) % 60,
        r = scoreGZ(X.bz, X.deep, idx, 0.6, 0.4);
      return { year: y, gz: gz(idx), score: +r.sc.toFixed(3), level: LV(r.sc) };
    } catch (err) {
      return { year: y, score: 0, level: "—", error: String(err?.message || err) };
    }
  }
  function series() {
    const R = range();
    return S.selected.map((id) => {
      const rr = rel(id);
      return { id, name: relName(rr), role: role(rr), values: R.years.map((y) => annual(id, y)) };
    });
  }
  function points(vals, R, w = 720, h = 230, pad = 32) {
    const n = Math.max(1, R.years.length - 1),
      x = (i) => pad + (i * (w - pad * 2)) / n,
      y = (s) => pad + ((100 - clamp(+s || 0, 0, 100)) * (h - pad * 2)) / 100;
    return vals
      .map((v, i) => `${x(i).toFixed(1)},${y(v.available ? v.score : 50).toFixed(1)}`)
      .join(" ");
  }
  function chartHTML() {
    const R = range(),
      SS = series(),
      w = 720,
      h = 250,
      pad = 34;
    if (!SS.length) return '<div class="rt213-note">当前还没有可比较的明确关系。</div>';
    const gy = [20, 40, 60, 80],
      years = R.years;
    const x = (i) => pad + (i * (w - pad * 2)) / Math.max(1, years.length - 1);
    return `<div class="rt213-chartbox"><svg class="rt213-chart" viewBox="0 0 ${w} ${h}" role="img" aria-label="多关系年度结构指数比较">
    ${gy
      .map((v) => {
        const yy = pad + ((100 - v) * (h - pad * 2)) / 100;
        return `<line class="grid" x1="${pad}" y1="${yy}" x2="${w - pad}" y2="${yy}"/><text x="5" y="${yy + 3}">${v}</text>`;
      })
      .join("")}
    <line class="axis" x1="${pad}" y1="${h - pad}" x2="${w - pad}" y2="${h - pad}"/>
    ${years.map((yr, i) => (i % Math.max(1, Math.ceil(years.length / 10)) === 0 ? `<text x="${x(i) - 10}" y="${h - 8}">${yr}</text>` : "")).join("")}
    ${SS.map((s, i) => `<polyline class="l${i % 6}" points="${points(s.values, R, w, h, pad)}"/>${s.values.map((v, j) => `<circle class="l${i % 6}" cx="${x(j)}" cy="${pad + ((100 - (v.available ? v.score : 50)) * (h - pad * 2)) / 100}" r="${eventsInYear(years[j], s.id).length ? 3.8 : 2.3}" fill="currentColor"><title>${E(s.name)} · ${years[j]} · ${v.available ? v.score.toFixed(1) : "—"}</title></circle>`).join("")}`).join("")}
  </svg></div><div class="rt213-legend">${SS.map((s, i) => `<span><i class="c${i % 6}"></i>${E(s.name)}</span>`).join("")}</div>`;
  }
  function segments(id) {
    return Array.isArray(S.segments[id]) ? S.segments[id] : [];
  }
  function addSegment(id, a, b, label) {
    if (!id || !rel(id) || !label) return null;
    const R = range(),
      x = {
        id: "sg" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
        start: clamp(+a || R.start, R.start, R.end),
        end: clamp(+b || R.end, R.start, R.end),
        label: String(label).slice(0, 50),
      };
    if (x.end < x.start) [x.start, x.end] = [x.end, x.start];
    if (!S.segments[id]) S.segments[id] = [];
    S.segments[id].push(x);
    save();
    return x;
  }
  function stageHTML() {
    const rows = [];
    S.selected.forEach((id) => {
      const rr = rel(id),
        arr = segments(id);
      if (!arr.length)
        rows.push(
          `<div class="rt213-stage"><b>${E(relName(rr))}</b><small>尚未添加历史阶段分段</small><span></span></div>`,
        );
      arr.forEach((x) =>
        rows.push(
          `<div class="rt213-stage"><b>${E(relName(rr))}</b><div><small>${x.start}–${x.end} · ${E(x.label)}</small><div class="rt213-stagebar"></div></div><button type="button" data-rt213-segdel="${x.id}" data-rel="${id}">删除</button></div>`,
        ),
      );
    });
    return rows.join("") || '<div class="rt213-note">请先选择至少一条关系。</div>';
  }
  function allEvents() {
    return clone(V1().events || []);
  }
  function eventsInYear(y, relationId) {
    return allEvents().filter(
      (x) =>
        +String(x.date || "").slice(0, 4) === +y && (!relationId || x.relationId === relationId),
    );
  }
  function filteredEvents() {
    const q = (S.query || "").trim().toLowerCase(),
      type = S.eventType || "all",
      scope = S.eventScope || "all";
    return allEvents()
      .filter((x) => {
        if (type !== "all" && x.type !== type) return false;
        if (scope !== "all") {
          if (scope === "family" && x.scope !== "family") return false;
          if (scope !== "family" && x.relationId !== scope) return false;
        }
        if (q) {
          const hay = [x.title, x.note, (x.personNames || []).join(" "), x.date]
            .join(" ")
            .toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => String(a.date).localeCompare(String(b.date)));
  }
  function eventListHTML() {
    const a = filteredEvents();
    if (!a.length) return '<div class="rt213-note">当前筛选条件下没有现实事件。</div>';
    return a
      .slice(0, 120)
      .map(
        (x) =>
          `<div class="rt213-event"><b>${E(x.date)}</b><span>${E(eventTypes()[x.type] || "其他")}</span><small><strong>${E(x.title)}</strong>${x.note ? `<br>${E(x.note)}` : ""}</small><small>${E(x.relationId ? relName(rel(x.relationId)) : "家庭整体")}</small></div>`,
      )
      .join("");
  }
  function majorYears(id) {
    const R = range(),
      vals = R.years.map((y) => annual(id, y)).filter((x) => x.available),
      out = [];
    vals.forEach((v, i) => {
      const prev = vals[i - 1],
        next = vals[i + 1],
        ev = eventsInYear(v.year, id);
      const peak = prev && next && v.score > prev.score && v.score > next.score && v.score >= 62;
      const low = prev && next && v.score < prev.score && v.score < next.score && v.score <= 40;
      const jump = prev && Math.abs(v.score - prev.score) >= 14;
      if (peak || low || jump || ev.length)
        out.push({
          year: v.year,
          score: v.score,
          type: peak ? "局部高点" : low ? "局部低点" : jump ? "明显转折" : "事件年",
          events: ev.length,
          phase: v.phase || "",
        });
    });
    return out
      .sort((a, b) => b.events - a.events || Math.abs(b.score - 50) - Math.abs(a.score - 50))
      .slice(0, 8)
      .sort((a, b) => a.year - b.year);
  }
  function majorHTML() {
    const rows = [];
    S.selected.forEach((id) =>
      majorYears(id).forEach((x) => rows.push({ ...x, id, name: relName(rel(id)) })),
    );
    rows.sort((a, b) => a.year - b.year || b.events - a.events);
    if (!rows.length)
      return '<div class="rt213-note">当前选中关系和年份范围内没有达到自动筛选条件的重点年份。</div>';
    return rows
      .slice(0, 30)
      .map(
        (x) =>
          `<div class="rt213-major"><b>${x.year}</b><strong>${x.score.toFixed(1)}</strong><small>${E(x.name)} · ${E(x.type)}${x.events ? ` · ${x.events} 条现实事件` : ""}${x.phase ? ` · ${E(x.phase)}` : ""}</small></div>`,
      )
      .join("");
  }
  function familyMatrixHTML() {
    const R = range(),
      people = PPL.people.slice(0, 12);
    if (!people.length) return '<div class="rt213-note">人物库为空。</div>';
    return `<div class="rt213-matrix"><table><thead><tr><th>人物</th>${R.years.map((y) => `<th>${y}</th>`).join("")}</tr></thead><tbody>${people
      .map(
        (p) =>
          `<tr><td><b>${E(p.name)}</b><br><small>${E(p.tag || "")}</small></td>${R.years
            .map((y) => {
              const a = personAnnual(p, y),
                tone = a.score >= 0.3 ? "good" : a.score <= -0.3 ? "bad" : "cyan";
              return `<td class="rt213-cell ${tone}" title="${E(`${a.gz} · ${a.level} · ${a.score >= 0 ? "+" : ""}${a.score.toFixed(2)}`)}">${a.score >= 0 ? "+" : ""}${a.score.toFixed(1)}</td>`;
            })
            .join("")}</tr>`,
      )
      .join("")}</tbody></table></div>`;
  }
  function evidence() {
    const selected = S.selected.slice(),
      ev = [
        {
          id: "compare.series",
          claim: `并行比较 ${selected.length} 条明确关系`,
          formula: "TianjiRelationTimeline.annual(relationId, year)",
          state: "derived",
        },
        {
          id: "family.matrix",
          claim: `家庭成员阶段矩阵按人物逐年生成`,
          formula: "scoreGZ(pplEng(person).bz, deep, 流年干支, 0.6, 0.4)",
          state: "derived",
        },
        {
          id: "major.years",
          claim: "重点年份按局部高低点、明显跳变及现实事件联合筛选",
          formula: "local extrema OR |Δscore|≥14 OR manual-event-year",
          state: "derived",
        },
        {
          id: "stage.segments",
          claim: `历史阶段分段 ${Object.values(S.segments).flat().length} 条`,
          formula: "人工维护的关系阶段元数据，不由命理算法推断",
          state: "manual",
        },
        {
          id: "event.filter",
          claim: `现实事件总数 ${allEvents().length} 条，可按文字/类型/关系筛选`,
          formula: "人工事件索引；与推演结果分层",
          state: "manual",
        },
        {
          id: "boundary",
          claim: "关系结构指数不是概率、幸福度、离婚率或具体事件预测",
          formula: "解释边界",
          state: "policy",
        },
      ];
    return ev;
  }
  function reportObject(mode = S.reportMode) {
    const R = range(),
      selected = S.selected.slice(),
      seriesData = selected.map((id) => ({
        id,
        name: relName(rel(id)),
        years: R.years.map((y) => annual(id, y)),
        majorYears: majorYears(id),
        segments: clone(segments(id)),
      }));
    const family = {
      years: R.years.map((y) => TianjiRelationTimeline.annual("family", y)),
      people: PPL.people.map((p) => ({
        id: p.id,
        name: p.name,
        years: R.years.map((y) => personAnnual(p, y)),
      })),
    };
    return {
      schema: REPORT_SCHEMA,
      build: BUILD,
      mode,
      range: R,
      selectedRelations: seriesData,
      family,
      realEvents: filteredEvents(),
      allRealEventsCount: allEvents().length,
      evidence: evidence(),
      boundaries: [
        "现实事件来自人工记录，与术数派生结果分层保存。",
        "长期结构指数只允许同规则跨年比较，不解释为概率、幸福度或事件必然。",
        "报告不根据缺失事件反推“没有发生”，也不根据高低点自动命名婚育、分离、疾病、财务等具体事件。",
      ],
    };
  }
  function reportText() {
    const O = reportObject(),
      L = [
        "天机盘 V213 · 关系长期报告",
        `版本：${BUILD}`,
        `范围：${O.range.start}–${O.range.end}`,
        "",
      ];
    O.selectedRelations.forEach((r) => {
      const vals = r.years.filter((x) => x.available);
      const hi = vals.length ? vals.reduce((a, b) => (a.score > b.score ? a : b)) : null,
        lo = vals.length ? vals.reduce((a, b) => (a.score < b.score ? a : b)) : null;
      L.push(`【${r.name}】`);
      if (hi) L.push(`区间高点：${hi.year} · ${hi.score.toFixed(1)} · ${hi.phase || ""}`);
      if (lo) L.push(`区间低点：${lo.year} · ${lo.score.toFixed(1)} · ${lo.phase || ""}`);
      if (r.majorYears.length)
        L.push(
          "重点年份：" +
            r.majorYears.map((x) => `${x.year}(${x.type}/${x.score.toFixed(1)})`).join("、"),
        );
      if (r.segments.length)
        L.push("阶段记录：" + r.segments.map((x) => `${x.start}-${x.end} ${x.label}`).join("；"));
      L.push("");
    });
    L.push("【现实事件】");
    if (O.realEvents.length)
      O.realEvents.forEach((x) =>
        L.push(
          `${x.date} · ${eventTypes()[x.type] || "其他"} · ${x.title}${x.relationId ? ` · ${relName(rel(x.relationId))}` : " · 家庭整体"}`,
        ),
      );
    else L.push("当前筛选下没有人工事件。");
    L.push("");
    L.push("【Evidence】");
    O.evidence.forEach((x) => L.push(`${x.id} · ${x.state} · ${x.claim} · ${x.formula}`));
    L.push("");
    L.push("说明：现实事件与传统推演严格分层；年度指数不是概率或幸福度。");
    return L.join("\n");
  }
  function relationChecks() {
    return PPL.rels
      .map(
        (r, i) =>
          `<label><input type="checkbox" data-rt213-rel="${r.id}"${S.selected.includes(r.id) ? " checked" : ""}>${E(relName(r))}</label>`,
      )
      .join("");
  }
  function filterScopeOptions() {
    return (
      `<option value="all"${S.eventScope === "all" ? " selected" : ""}>全部关系</option><option value="family"${S.eventScope === "family" ? " selected" : ""}>家庭整体</option>` +
      PPL.rels
        .map(
          (r) =>
            `<option value="${r.id}"${S.eventScope === r.id ? " selected" : ""}>${E(relName(r))}</option>`,
        )
        .join("")
    );
  }
  function panel() {
    normalize();
    const R = range(),
      evs = filteredEvents(),
      segs = Object.values(S.segments).flat().length,
      maj = S.selected.reduce((n, id) => n + majorYears(id).length, 0);
    return `<section class="rt213" id="rt213Depth">
    <section class="rt213-hero"><div class="rt213-head"><div><h3>关系长期时间轴二期 · 多关系 / 家庭矩阵 / 长期报告</h3><p>在 V212 单条关系时间轴之上增加并行比较：可同时观察多条夫妻、亲子、朋友或合作关系；家庭成员逐年放进同一矩阵；现实事件可检索筛选；阶段分段由用户人工维护；重点年份只做结构筛选，不自动命名具体事件。</p></div><span class="rt213-schema">${SCHEMA}</span></div>
      <div class="rt213-tools"><button type="button" id="rt213All">选择前 6 条关系</button><button type="button" id="rt213None">清空比较</button><button type="button" id="rt213Report">生成长期报告</button><button type="button" id="rt213Export">导出正式 Evidence JSON</button></div>
    </section>

    <div class="rt213-kpis">
      <div class="rt213-kpi cyan"><small>并行关系</small><b>${S.selected.length}</b></div>
      <div class="rt213-kpi"><small>年份范围</small><b>${R.start}–${R.end}</b></div>
      <div class="rt213-kpi good"><small>重点年份</small><b>${maj}</b></div>
      <div class="rt213-kpi"><small>阶段分段</small><b>${segs}</b></div>
      <div class="rt213-kpi"><small>筛选事件</small><b>${evs.length}</b></div>
      <div class="rt213-kpi bad"><small>解释口径</small><b>非概率</b></div>
    </div>

    <section class="rt213-card"><h4>选择要并行比较的关系</h4><div class="rt213-checks">${relationChecks() || '<span class="rt213-note">当前没有明确关系。</span>'}</div></section>

    <section class="rt213-card"><h4>多关系同图比较</h4>${chartHTML()}<div class="rt213-note" style="margin-top:6px">圆点较大表示该关系当年存在人工现实事件。曲线只比较同一套关系结构规则的年度变化，不表示关系“好坏概率”。</div></section>

    <div class="rt213-grid">
      <section class="rt213-card"><h4>重大年份自动筛选</h4><div class="rt213-list">${majorHTML()}</div></section>
      <aside class="rt213-card"><h4>历史阶段分段</h4><div class="rt213-form">
        <label>关系<select id="rt213SegRel">${S.selected.map((id) => `<option value="${id}">${E(relName(rel(id)))}</option>`).join("")}</select></label>
        <label>开始年<input id="rt213SegA" type="number" min="${R.start}" max="${R.end}" value="${R.start}"></label>
        <label>结束年<input id="rt213SegB" type="number" min="${R.start}" max="${R.end}" value="${R.end}"></label>
        <label>阶段名<input id="rt213SegLabel" maxlength="50" placeholder="如：婚后磨合 / 异地期"></label>
      </div><div class="rt213-actions"><button type="button" class="primary" id="rt213SegAdd">加入阶段</button></div><div class="rt213-stageband">${stageHTML()}</div></aside>
    </div>

    <section class="rt213-card"><h4>家庭成员阶段矩阵</h4>${familyMatrixHTML()}<div class="rt213-note" style="margin-top:6px">矩阵单元格是每个人当年的个人流年背景分，用于观察家庭成员“谁在上扬、谁在承压、谁与谁节奏不同步”。不把该分数解释为健康、财务或情绪诊断。</div></section>

    <div class="rt213-grid">
      <section class="rt213-card"><h4>现实事件检索</h4><div class="rt213-filter">
        <label>关键词<input id="rt213Query" value="${E(S.query)}" placeholder="标题 / 备注 / 人名 / 日期"></label>
        <label>类型<select id="rt213Type"><option value="all"${S.eventType === "all" ? " selected" : ""}>全部类型</option>${Object.entries(
          eventTypes(),
        )
          .map(
            ([k, v]) => `<option value="${k}"${S.eventType === k ? " selected" : ""}>${v}</option>`,
          )
          .join("")}</select></label>
        <label>关系<select id="rt213Scope">${filterScopeOptions()}</select></label>
      </div><div class="rt213-actions"><button type="button" class="primary" id="rt213Filter">应用筛选</button><button type="button" id="rt213Reset">清空筛选</button></div><div class="rt213-list" style="margin-top:7px">${eventListHTML()}</div></section>
      <aside class="rt213-card"><h4>长期关系报告</h4><div id="rt213ReportOut" class="rt213-report">点击“生成长期报告”后，这里会汇总各关系高低点、重点年份、阶段记录、现实事件与 Evidence。</div></aside>
    </div>

    <section class="rt213-card"><h4>Evidence / 正式输出</h4><div class="rt213-evidence">${evidence()
      .map(
        (x) =>
          `<div class="rt213-ev"><b>${E(x.id)}</b><small>${E(x.claim)}<br><span class="rt213-code">${E(x.formula)}</span></small><span>${x.state === "manual" ? "人工事实" : x.state === "policy" ? "解释边界" : "可追溯派生"}</span></div>`,
      )
      .join("")}</div></section>
  </section>`;
  }
  function refresh() {
    refRender("people");
  }
  function bind() {
    document.querySelectorAll("[data-rt213-rel]").forEach((cb) =>
      cb.addEventListener("change", () => {
        const id = cb.dataset.rt213Rel;
        if (cb.checked) {
          if (!S.selected.includes(id) && S.selected.length < 6) S.selected.push(id);
        } else S.selected = S.selected.filter((x) => x !== id);
        save();
        refresh();
      }),
    );
    document.getElementById("rt213All")?.addEventListener("click", () => {
      S.selected = PPL.rels.slice(0, 6).map((r) => r.id);
      save();
      refresh();
    });
    document.getElementById("rt213None")?.addEventListener("click", () => {
      S.selected = [];
      save();
      refresh();
    });
    document.getElementById("rt213SegAdd")?.addEventListener("click", () => {
      const id = document.getElementById("rt213SegRel")?.value,
        label = (document.getElementById("rt213SegLabel")?.value || "").trim();
      const a = +document.getElementById("rt213SegA")?.value,
        b = +document.getElementById("rt213SegB")?.value;
      if (!id || !label) {
        try {
          toast("请选择关系并填写阶段名称");
        } catch (_) {}
        return;
      }
      addSegment(id, a, b, label);
      refresh();
    });
    document.querySelectorAll("[data-rt213-segdel]").forEach((b) =>
      b.addEventListener("click", () => {
        const id = b.dataset.rel,
          sg = b.dataset.rt213Segdel;
        S.segments[id] = (S.segments[id] || []).filter((x) => x.id !== sg);
        save();
        refresh();
      }),
    );
    document.getElementById("rt213Filter")?.addEventListener("click", () => {
      S.query = document.getElementById("rt213Query")?.value || "";
      S.eventType = document.getElementById("rt213Type")?.value || "all";
      S.eventScope = document.getElementById("rt213Scope")?.value || "all";
      save();
      refresh();
    });
    document.getElementById("rt213Reset")?.addEventListener("click", () => {
      S.query = "";
      S.eventType = "all";
      S.eventScope = "all";
      save();
      refresh();
    });
    document.getElementById("rt213Report")?.addEventListener("click", () => {
      const t = reportText(),
        box = document.getElementById("rt213ReportOut");
      if (box) box.textContent = t;
    });
    document.getElementById("rt213Export")?.addEventListener("click", () => {
      const obj = reportObject();
      saveFile(
        `天机盘关系长期报告-${nowBJ().y}${f2(nowBJ().m)}${f2(nowBJ().d)}.json`,
        JSON.stringify(obj, null, 2),
      );
    });
  }
  try {
    const oldP = REF_PANES.people;
    if (oldP && !oldP.__v213) {
      const fn = () => oldP() + panel();
      fn.__v213 = true;
      REF_PANES.people = fn;
    }
    const oldB = REF_BIND.people;
    const bf = () => {
      try {
        oldB && oldB();
      } catch (err) {
        console.warn("[V213 old people bind]", err);
      }
      try {
        bind();
      } catch (err) {
        console.warn("[V213 bind]", err);
      }
    };
    bf.__v213 = true;
    REF_BIND.people = bf;
    REF_STATIC.add("people");
  } catch (err) {
    console.warn("[V213 relation patch]", err);
  }

  function selfTest() {
    const C = [],
      add = (id, ok, d = "") => C.push({ id, ok: !!ok, d });
    try {
      const R = range();
      add("range.valid", R.end >= R.start && R.years.length <= 25, `${R.start}-${R.end}`);
      add("selected.max", S.selected.length <= 6, String(S.selected.length));
      const O = reportObject();
      add("report.schema", O.schema === REPORT_SCHEMA, O.schema);
      add(
        "evidence.layers",
        evidence().some((x) => x.state === "manual") &&
          evidence().some((x) => x.state === "policy"),
        "",
      );
      if (PPL.rels.length) {
        const id = PPL.rels[0].id,
          m = majorYears(id);
        add("major.array", Array.isArray(m), String(m.length));
      } else add("major.array", true, "无关系，跳过");
    } catch (err) {
      add("exception", false, String((err && err.message) || err));
    }
    return { ok: C.every((x) => x.ok), checks: C };
  }
  const TEST = selfTest();

  const TASKS213 = [
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
      note: "v209–v211 当前声明范围完成；默认 AUDIT ONLY",
    },
    {
      id: "relation",
      p: "P2",
      name: "关系长期时间轴",
      state: "done",
      note: "v212–v213：关系阶段与现实事件、双人/家庭多年轨迹、多关系并行曲线、家庭成员矩阵、事件筛选、阶段分段、重点年份、长期报告与正式 Evidence 输出；完成当前声明范围",
    },
    {
      id: "report",
      p: "P2",
      name: "合参 Evidence 正式报告",
      state: "todo",
      note: "下一主线：把各术数确定性字段、解释链、来源、置信边界与大白话结果统一成正式可导出的 Evidence 报告",
    },
  ];
  const BOARD = {
    schema: "tianji.priority.board.v1",
    build: BUILD,
    total: 14,
    done: 11,
    doing: 1,
    blocked: 1,
    progress: 85.7,
    next: [
      "合参 Evidence 正式报告",
      "奇门日/月/年真实第三方 reference 样本",
      "七政四余星历 / 许可证前置",
    ],
    tasks: TASKS213,
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
          "合参 Evidence 正式报告",
          "奇门四家第三方对拍（二期待外部样本）",
          "七政四余星历 / 许可证前置",
        ],
      }),
    );
  }
  applyBoard();
  window.addEventListener("tianji:lazy-ready", () => setTimeout(applyBoard, 0));

  window.TianjiRelationTimelineV2 = Object.freeze({
    version: "2.0.0",
    build: BUILD,
    schema: SCHEMA,
    reportSchema: REPORT_SCHEMA,
    compare: () => clone(series()),
    familyMatrix: () => {
      const R = range();
      return clone(
        PPL.people.map((p) => ({
          id: p.id,
          name: p.name,
          years: R.years.map((y) => personAnnual(p, y)),
        })),
      );
    },
    majorYears: (id) => clone(majorYears(id)),
    filteredEvents: () => clone(filteredEvents()),
    report: () => clone(reportObject()),
    reportText,
    addStage: (id, start, end, label) => clone(addSegment(id, start, end, label)),
    selfTest: () => clone(TEST),
    manifest: () => ({
      module: "Tianji Relation Timeline V2",
      completeForDeclaredPolicy: true,
      implemented: [
        "多关系同图比较",
        "家庭成员阶段矩阵",
        "现实事件搜索筛选",
        "关系阶段分段",
        "重点年份筛选",
        "双人/家庭长期报告",
        "Evidence 正式 JSON",
      ],
      boundaries: [
        "现实事件与命理派生严格分层",
        "年度结构指数不是概率/幸福度/离婚率",
        "重点年份只筛结构，不自动命名具体事件",
      ],
    }),
  });
  window.TianjiSystemV213 = {
    version: "v213",
    build: BUILD,
    relationTimelineV2: true,
    relationTaskComplete: true,
    noticeQuietDefault: true,
    baseline: "v212",
  };

  function sync() {
    const b = document.getElementById("buildVersion");
  }
  /* V226: historical delayed version writer disabled */
})();
