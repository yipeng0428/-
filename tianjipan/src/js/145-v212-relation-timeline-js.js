(() => {
  "use strict";
  const BUILD = "v212 · 2026-10-06 14:02 +08:00";
  const SCHEMA = "tianji.relation.timeline.v1";
  const STORE = "tianjipan.relation.timeline.v212";
  const EVT = {
    milestone: "里程碑",
    support: "支持 / 合作",
    conflict: "冲突 / 压力",
    change: "关系变化",
    family: "家庭事件",
    distance: "分离 / 迁移",
    reunion: "重聚",
    other: "其他",
  };
  const STATUS = { active: "进行中", paused: "暂缓", ended: "已结束", unknown: "未标注" };
  let DB = {
    version: 1,
    events: [],
    meta: {},
    focus: "family",
    startYear: nowBJ().y - 5,
    endYear: nowBJ().y + 6,
    selectedYear: nowBJ().y,
  };
  try {
    const x = JSON.parse(localStorage.getItem(STORE) || "null");
    if (x && typeof x === "object")
      DB = {
        ...DB,
        ...x,
        events: Array.isArray(x.events) ? x.events : [],
        meta: x.meta && typeof x.meta === "object" ? x.meta : {},
      };
  } catch (_) {}
  const save = () => {
    try {
      localStorage.setItem(STORE, JSON.stringify(DB));
    } catch (_) {}
  };
  const clone = (x) => (x == null ? x : JSON.parse(JSON.stringify(x)));
  const E = (s) =>
    String(s ?? "").replace(
      /[&<>"']/g,
      (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
    );
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const yrNow = () => nowBJ().y;
  const relById = (id) => PPL.rels.find((r) => r.id === id) || null;
  const person = (id) => pplById(id) || null;
  const roleName = (r) => (PPL_ROLE[r?.role] || PPL_ROLE.other).n;
  const eventId = () => "te" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

  function clean() {
    const ids = new Set(PPL.people.map((p) => p.id)),
      rels = new Set(PPL.rels.map((r) => r.id));
    DB.events = DB.events
      .filter((x) => x && x.id && x.date && Array.isArray(x.personIds))
      .map((x) => ({
        ...x,
        personIds: x.personIds.filter((id) => ids.has(id)),
        relationId: x.relationId && rels.has(x.relationId) ? x.relationId : x.relationId || null,
      }));
    Object.keys(DB.meta).forEach((id) => {
      if (!rels.has(id)) delete DB.meta[id];
    });
    if (DB.focus !== "family" && !rels.has(DB.focus)) DB.focus = PPL.rels[0]?.id || "family";
    DB.startYear = clamp(+DB.startYear || yrNow() - 5, 1901, 2099);
    DB.endYear = clamp(+DB.endYear || yrNow() + 6, 1901, 2099);
    if (DB.endYear < DB.startYear) [DB.startYear, DB.endYear] = [DB.endYear, DB.startYear];
    if (DB.endYear - DB.startYear > 24) DB.endYear = DB.startYear + 24;
    DB.selectedYear = clamp(+DB.selectedYear || yrNow(), DB.startYear, DB.endYear);
  }
  clean();
  save();

  function annualPerson(P, year) {
    const idx = (((year - 4) % 60) + 60) % 60,
      r = scoreGZ(P.bz, P.deep, idx, 0.6, 0.4);
    return {
      year,
      idx,
      gz: gz(idx),
      score: +r.sc.toFixed(3),
      level: LV(r.sc),
      notes: r.notes || [],
    };
  }
  function stemTone(ys, dm) {
    const he = PPL_GAN_HE.some(([a, b]) => (a === ys && b === dm) || (a === dm && b === ys));
    const ch = PPL_GAN_CHONG.some(([a, b]) => (a === ys && b === dm) || (a === dm && b === ys));
    return he ? 0.5 : ch ? -0.55 : 0;
  }
  function annualRelation(rel, year) {
    const pa = person(rel.a),
      pb = person(rel.b),
      A = pplEng(pa),
      B = pplEng(pb);
    if (!A || !B) return { available: false, year, reason: "其中一位人物出生资料无法派生" };
    const base = netPair(A, B),
      fa = annualPerson(A, year),
      fb = annualPerson(B, year),
      idx = fa.idx,
      ys = idx % 10,
      yb = idx % 12;
    const za = pplZhiRel(yb, A.bz.pill[2].b),
      zb = pplZhiRel(yb, B.bz.pill[2].b);
    const zaTone = pplZhiTone(za),
      zbTone = pplZhiTone(zb),
      stA = stemTone(ys, A.bz.dm),
      stB = stemTone(ys, B.bz.dm);
    const shared =
      fa.score >= 0.3 && fb.score >= 0.3
        ? 1
        : fa.score <= -0.3 && fb.score <= -0.3
          ? 0.35
          : Math.sign(fa.score) !== Math.sign(fb.score) && Math.abs(fa.score - fb.score) > 0.7
            ? -0.55
            : 0;
    const raw =
      50 +
      base.T * 5.5 +
      (fa.score + fb.score) * 7.5 -
      Math.abs(fa.score - fb.score) * 3 +
      (zaTone + zbTone) * 2 +
      (stA + stB) * 2 +
      shared * 4;
    const score = +clamp(raw, 0, 100).toFixed(1);
    const phase =
      score >= 72
        ? "共振较强"
        : score >= 60
          ? "顺势互动"
          : score >= 45
            ? "平稳磨合"
            : score >= 32
              ? "摩擦增多"
              : "共同压力较重";
    const sync =
      fa.score >= 0.3 && fb.score >= 0.3
        ? "共同上扬"
        : fa.score <= -0.3 && fb.score <= -0.3
          ? "共同承压"
          : Math.abs(fa.score - fb.score) > 0.8
            ? "节奏分化"
            : "节奏接近";
    const tags = [...za, ...zb].map((x) => x.t).filter(Boolean);
    const notes = [
      `${A.name}流年 ${fa.gz} · ${fa.level} (${fa.score >= 0 ? "+" : ""}${fa.score.toFixed(2)})`,
      `${B.name}流年 ${fb.gz} · ${fb.level} (${fb.score >= 0 ? "+" : ""}${fb.score.toFixed(2)})`,
      sync,
    ];
    if (za.length) notes.push(`${A.name}日支受流年：${za.map((x) => x.txt).join("、")}`);
    if (zb.length) notes.push(`${B.name}日支受流年：${zb.map((x) => x.txt).join("、")}`);
    return {
      available: true,
      year,
      gz: fa.gz,
      score,
      phase,
      sync,
      base: { T: +base.T.toFixed(2), verdict: base.verdict, cls: base.cls },
      a: fa,
      b: fb,
      yearBranch: yb,
      yearStem: ys,
      tags: [...new Set(tags)],
      notes,
    };
  }
  function annualFamily(year) {
    const P = PPL.people.map(pplEng).filter(Boolean),
      rels = PPL.rels.filter((r) => P.some((p) => p.id === r.a) && P.some((p) => p.id === r.b));
    if (!P.length) return { available: false, year, reason: "没有可计算人物" };
    const persons = P.map((p) => ({ id: p.id, name: p.name, ...annualPerson(p, year) }));
    const pairs = rels
      .map((r) => ({ rel: r, result: annualRelation(r, year) }))
      .filter((x) => x.result.available);
    const avgPerson = persons.reduce((s, x) => s + x.score, 0) / persons.length;
    const avgPair = pairs.length
      ? pairs.reduce((s, x) => s + x.result.score, 0) / pairs.length
      : 50;
    const score = +clamp(avgPair + avgPerson * 4, 0, 100).toFixed(1);
    const strong = pairs.filter((x) => x.result.score >= 65).length,
      stress = pairs.filter((x) => x.result.score <= 38).length;
    const phase = score >= 65 ? "家庭互动较顺" : score >= 45 ? "家庭节奏平稳" : "家庭压力偏多";
    return {
      available: true,
      year,
      score,
      phase,
      avgPerson: +avgPerson.toFixed(2),
      avgPair: +avgPair.toFixed(1),
      persons,
      pairs,
      strong,
      stress,
    };
  }
  function years() {
    const out = [];
    for (let y = DB.startYear; y <= DB.endYear; y++)
      out.push(DB.focus === "family" ? annualFamily(y) : annualRelation(relById(DB.focus), y));
    return out;
  }
  function eventsForYear(year, focus = DB.focus) {
    return DB.events
      .filter((x) => {
        const y = +String(x.date).slice(0, 4);
        if (y !== year) return false;
        if (focus === "family") return true;
        return x.relationId === focus;
      })
      .sort((a, b) => String(a.date).localeCompare(String(b.date)));
  }
  function focusInfo() {
    if (DB.focus === "family")
      return { mode: "family", name: "家庭整体", rel: null, A: null, B: null };
    const rel = relById(DB.focus);
    if (!rel) return { mode: "family", name: "家庭整体", rel: null, A: null, B: null };
    const A = person(rel.a),
      B = person(rel.b);
    return { mode: "relation", name: `${A?.name || "甲"} × ${B?.name || "乙"}`, rel, A, B };
  }
  function relationMeta(relId) {
    if (!DB.meta[relId])
      DB.meta[relId] = { startDate: "", endDate: "", status: "unknown", stage: "" };
    return DB.meta[relId];
  }
  function evidence(selected) {
    const F = focusInfo(),
      ev = [];
    if (F.mode === "relation" && F.rel) {
      const A = pplEng(F.A),
        B = pplEng(F.B),
        base = A && B ? netPair(A, B) : null;
      ev.push({
        id: "relation.base",
        claim: base
          ? `静态关系底盘：${base.verdict} · T=${base.T.toFixed(2)}`
          : "静态关系底盘不可用",
        formula: "netPair(A,B)",
        state: "deterministic",
      });
      ev.push({
        id: "year.personal",
        claim: "双方每年个人背景分分别计算",
        formula: "scoreGZ(个人八字, 喜用, 流年干支, 0.6, 0.4)",
        state: "derived",
      });
      ev.push({
        id: "year.interaction",
        claim: "流年与双方日支 / 日干的合冲加入关系年度结构",
        formula: "pplZhiRel(流年支, 日支) + 天干合冲",
        state: "derived",
      });
    } else {
      ev.push({
        id: "family.aggregate",
        claim: "家庭年度指数由有效人物流年背景与已建立关系年度指数汇总",
        formula: "avg(explicit relation annual scores) + avg(person annual score)",
        state: "derived",
      });
    }
    ev.push({
      id: "manual.events",
      claim: `当前共有 ${DB.events.length} 条人工事件记录`,
      formula: "用户手工记录；不由命理算法生成",
      state: "manual",
    });
    ev.push({
      id: "score.boundary",
      claim: "年度关系指数只用于比较结构变化，不是概率、幸福指数或事件预测",
      formula: "clamp(静态关系 + 双方流年 + 年支触发 + 同步性, 0..100)",
      state: "policy",
    });
    return ev;
  }
  function plain(selected) {
    const F = focusInfo();
    if (!selected?.available) return selected?.reason || "当前没有足够数据。";
    if (F.mode === "family") {
      return `家庭整体在 ${selected.year} 年的结构指数为 ${selected.score}，当前归为“${selected.phase}”。其中显式关系里有 ${selected.strong} 组相对顺势、${selected.stress} 组压力偏多。这个指数用于观察多年变化方向；真实家庭关系还应优先依据沟通、生活事件、经济与照护责任等实际记录。`;
    }
    return `${F.name} 在 ${selected.year} 年的结构指数为 ${selected.score}，阶段标签为“${selected.phase}”，双方年度节奏表现为“${selected.sync}”。${selected.notes.slice(0, 3).join("；")}。这里描述的是传统八字关系规则在时间轴上的机械变化，不代表某年必然发生具体感情、家庭或合作事件。`;
  }
  function relOptions() {
    const opts = [
      `<option value="family"${DB.focus === "family" ? " selected" : ""}>家庭整体</option>`,
    ];
    PPL.rels.forEach((r) => {
      const A = person(r.a),
        B = person(r.b);
      if (!A || !B) return;
      opts.push(
        `<option value="${r.id}"${DB.focus === r.id ? " selected" : ""}>${E(A.name)} × ${E(B.name)} · ${E(roleName(r))}</option>`,
      );
    });
    return opts.join("");
  }
  function yearCard(x) {
    const y = x.year,
      events = eventsForYear(y),
      score = x.available ? x.score : 0,
      tone = !x.available ? "bad" : score >= 62 ? "good" : score <= 38 ? "bad" : "cyan";
    const h = x.available ? clamp(score, 5, 100) : 5;
    return `<button type="button" class="rt212-year ${tone}${DB.selectedYear === y ? " on" : ""}" data-rt-year="${y}">
    ${events.length ? `<span class="rt212-evdot">${events.length}</span>` : ""}<b>${y}</b><small>${x.available ? x.gz || x.phase : "不可计算"}</small>
    <div class="rt212-scorebar"><i style="height:${h}%"></i></div><em>${x.available ? `${score.toFixed(1)} · ${E(x.phase)}` : E(x.reason || "缺数据")}</em>
  </button>`;
  }
  function eventRows() {
    const rows = eventsForYear(DB.selectedYear);
    if (!rows.length)
      return '<div class="rt212-note">当前选中年份还没有人工事件。人工事件是现实记录，与命理推算分开保存。</div>';
    return rows
      .map(
        (x) =>
          `<div class="rt212-event"><b>${E(x.date)}</b><span>${E(EVT[x.type] || EVT.other)}</span><small><strong>${E(x.title)}</strong>${x.note ? `<br>${E(x.note)}` : ""}</small><button type="button" data-rt-del="${x.id}">删除</button></div>`,
      )
      .join("");
  }
  function metaHTML(F) {
    if (F.mode !== "relation" || !F.rel)
      return '<div class="rt212-note">“家庭整体”不设置单一关系开始/结束日期。切换到某一条明确关系后，可以记录关系起点、当前阶段与结束时间。</div>';
    const M = relationMeta(F.rel.id);
    return `<div class="rt212-meta">
    <label>关系开始<input id="rt212Start" type="date" value="${E(M.startDate || "")}"></label>
    <label>关系状态<select id="rt212Status">${Object.entries(STATUS)
      .map(([k, v]) => `<option value="${k}"${M.status === k ? " selected" : ""}>${v}</option>`)
      .join("")}</select></label>
    <label>当前阶段<input id="rt212Stage" maxlength="40" value="${E(M.stage || "")}" placeholder="如：婚后育儿 / 合作磨合"></label>
    <label>关系结束<input id="rt212End" type="date" value="${E(M.endDate || "")}"></label>
  </div><div class="rt212-actions"><button type="button" class="primary" id="rt212SaveMeta">保存关系阶段</button></div>
  <div class="rt212-note" style="margin-top:6px">人物库里关系记录的 createdAt 只是“录入系统的时间”，不等于现实关系开始时间；V212 不会自动把它当作关系起点。</div>`;
  }
  function panel() {
    clean();
    const F = focusInfo(),
      YS = years(),
      selected = YS.find((x) => x.year === DB.selectedYear) || YS[0],
      events = eventsForYear(DB.selectedYear);
    const eventCount = DB.events.filter(
      (x) => F.mode === "family" || x.relationId === F.rel?.id,
    ).length;
    const scores = YS.filter((x) => x.available).map((x) => x.score),
      hi = scores.length ? Math.max(...scores) : 0,
      lo = scores.length ? Math.min(...scores) : 0;
    return `<section class="rt212" id="rt212Timeline">
    <section class="rt212-hero"><div class="rt212-head"><div><h3>关系长期时间轴 · 双人 / 家庭</h3><p>把“静态关系图”推进为“多年关系轨迹”：明确现实关系阶段与人工事件，再叠加双方流年背景、日支/日干年度触发和已有关系底盘。人工事件与传统推演分层保存，系统不把某一年结构分数解释成事件概率。</p></div><span class="rt212-schema">${SCHEMA}</span></div>
      <div class="rt212-tools">
        <label>观察对象<select id="rt212Focus">${relOptions()}</select></label>
        <label>起始年<input id="rt212Y0" type="number" min="1901" max="2099" value="${DB.startYear}"></label>
        <label>结束年<input id="rt212Y1" type="number" min="1901" max="2099" value="${DB.endYear}"></label>
        <button type="button" id="rt212Now">以今年为中心</button>
        <button type="button" id="rt212Export">导出时间轴</button>
      </div>
    </section>

    <div class="rt212-kpis">
      <div class="rt212-kpi cyan"><small>观察对象</small><b>${E(F.name)}</b></div>
      <div class="rt212-kpi"><small>年份跨度</small><b>${DB.endYear - DB.startYear + 1} 年</b></div>
      <div class="rt212-kpi good"><small>区间高点</small><b>${hi.toFixed(1)}</b></div>
      <div class="rt212-kpi bad"><small>区间低点</small><b>${lo.toFixed(1)}</b></div>
      <div class="rt212-kpi"><small>人工事件</small><b>${eventCount}</b></div>
      <div class="rt212-kpi cyan"><small>当前选中</small><b>${DB.selectedYear}</b></div>
    </div>

    <section class="rt212-card"><h4>多年轨迹 · 可横向拖动</h4><div class="rt212-strip" id="rt212Strip">${YS.map(yearCard).join("")}</div><div class="rt212-note">柱高是“关系结构指数”或“家庭互动指数”，仅用于同一规则下跨年比较。横向拖动时间轴，点击年份查看当年结构与现实事件。</div></section>

    <div class="rt212-grid">
      <section class="rt212-card"><h4>${DB.selectedYear} · 结构解析</h4>
        <div class="rt212-plain">${E(plain(selected))}</div>
        <div class="rt212-list" style="margin-top:7px">${
          selected?.available && selected.notes
            ? selected.notes
                .map((n) => `<div class="rt212-item cyan"><small>${E(n)}</small></div>`)
                .join("")
            : selected?.available && selected.persons
              ? selected.persons
                  .slice(0, 8)
                  .map(
                    (p) =>
                      `<div class="rt212-item ${p.score >= 0.3 ? "good" : p.score <= -0.3 ? "bad" : "cyan"}"><b>${E(p.name)} · ${E(p.gz)} · ${E(p.level)}</b><small>个人流年背景分 ${p.score >= 0 ? "+" : ""}${p.score.toFixed(2)}；这里只作为家庭年度背景。</small></div>`,
                  )
                  .join("")
              : '<div class="rt212-note">当前年份不可计算。</div>'
        }</div>
      </section>
      <aside class="rt212-card"><h4>关系阶段</h4>${metaHTML(F)}</aside>
    </div>

    <div class="rt212-grid">
      <section class="rt212-card"><h4>${DB.selectedYear} · 现实事件</h4><div class="rt212-list" id="rt212EventList">${eventRows()}</div></section>
      <aside class="rt212-card"><h4>新增现实事件</h4>
        <div class="rt212-form">
          <label>日期<input id="rt212Date" type="date" value="${DB.selectedYear}-${String(nowBJ().m).padStart(2, "0")}-${String(Math.min(nowBJ().d, 28)).padStart(2, "0")}"></label>
          <label>类型<select id="rt212Type">${Object.entries(EVT)
            .map(([k, v]) => `<option value="${k}">${v}</option>`)
            .join("")}</select></label>
          <label class="wide">标题<input id="rt212Title" maxlength="60" placeholder="如：搬家 / 结婚 / 合作启动 / 一次重要争执"></label>
          <label class="wide">备注<textarea id="rt212Note" maxlength="500" placeholder="记录现实发生的事情，不会自动参与命理算法。"></textarea></label>
        </div>
        <div class="rt212-actions"><button type="button" class="primary" id="rt212AddEvent">写入时间轴</button></div>
        <div class="rt212-note" style="margin-top:6px">V212 把“实际发生的事件”与“传统规则的年度结构”严格分层。人工记录不会反向修改命盘，也不会被系统当成算法证据。</div>
      </aside>
    </div>

    <section class="rt212-card"><h4>Evidence / 数据来源</h4><div class="rt212-evidence">${evidence(
      selected,
    )
      .map(
        (x) =>
          `<div class="rt212-ev"><b>${E(x.id)}</b><small>${E(x.claim)}<br><span class="rt212-code">${E(x.formula)}</span></small><span>${x.state === "manual" ? "人工记录" : x.state === "policy" ? "解释边界" : x.state === "deterministic" ? "确定性底盘" : "可追溯派生"}</span></div>`,
      )
      .join("")}</div></section>
  </section>`;
  }
  function addEvent() {
    const F = focusInfo(),
      date = document.getElementById("rt212Date")?.value,
      title = (document.getElementById("rt212Title")?.value || "").trim();
    if (!date || !title) {
      try {
        toast("请填写事件日期和标题");
      } catch (_) {}
      return;
    }
    const type = document.getElementById("rt212Type")?.value || "other",
      note = (document.getElementById("rt212Note")?.value || "").trim();
    const ids = F.mode === "relation" ? [F.rel.a, F.rel.b] : PPL.people.map((p) => p.id);
    DB.events.push({
      id: eventId(),
      date,
      type,
      title: title.slice(0, 60),
      note: note.slice(0, 500),
      relationId: F.mode === "relation" ? F.rel.id : null,
      personIds: ids.slice(),
      personNames: ids.map((id) => person(id)?.name || id),
      scope: F.mode,
      createdAt: Date.now(),
      source: "manual",
    });
    DB.selectedYear = +date.slice(0, 4) || DB.selectedYear;
    save();
    refRender("people");
    try {
      toast("事件已写入关系时间轴");
    } catch (_) {}
  }
  function delEvent(id) {
    DB.events = DB.events.filter((x) => x.id !== id);
    save();
    refRender("people");
  }
  function saveMeta() {
    const F = focusInfo();
    if (F.mode !== "relation" || !F.rel) return;
    DB.meta[F.rel.id] = {
      startDate: document.getElementById("rt212Start")?.value || "",
      endDate: document.getElementById("rt212End")?.value || "",
      status: document.getElementById("rt212Status")?.value || "unknown",
      stage: (document.getElementById("rt212Stage")?.value || "").trim().slice(0, 40),
      updatedAt: Date.now(),
    };
    save();
    refRender("people");
    try {
      toast("关系阶段已保存");
    } catch (_) {}
  }
  function dragBind(el) {
    if (!el) return;
    let down = false,
      x0 = 0,
      s0 = 0,
      moved = false;
    el.addEventListener("pointerdown", (e) => {
      down = true;
      moved = false;
      x0 = e.clientX;
      s0 = el.scrollLeft;
      el.classList.add("dragging");
      try {
        el.setPointerCapture(e.pointerId);
      } catch (_) {}
    });
    el.addEventListener("pointermove", (e) => {
      if (!down) return;
      const dx = e.clientX - x0;
      if (Math.abs(dx) > 4) moved = true;
      el.scrollLeft = s0 - dx;
    });
    const end = (e) => {
      down = false;
      el.classList.remove("dragging");
      try {
        el.releasePointerCapture(e.pointerId);
      } catch (_) {}
    };
    el.addEventListener("pointerup", end);
    el.addEventListener("pointercancel", end);
    el.addEventListener(
      "click",
      (e) => {
        if (moved) {
          e.preventDefault();
          e.stopPropagation();
        }
      },
      true,
    );
  }
  function bind() {
    document.getElementById("rt212Focus")?.addEventListener("change", (e0) => {
      DB.focus = e0.target.value;
      DB.selectedYear = clamp(DB.selectedYear, DB.startYear, DB.endYear);
      save();
      refRender("people");
    });
    document.getElementById("rt212Y0")?.addEventListener("change", (e0) => {
      DB.startYear = clamp(+e0.target.value || yrNow() - 5, 1901, 2099);
      if (DB.endYear < DB.startYear) DB.endYear = DB.startYear;
      if (DB.endYear - DB.startYear > 24) DB.endYear = DB.startYear + 24;
      DB.selectedYear = clamp(DB.selectedYear, DB.startYear, DB.endYear);
      save();
      refRender("people");
    });
    document.getElementById("rt212Y1")?.addEventListener("change", (e0) => {
      DB.endYear = clamp(+e0.target.value || yrNow() + 6, 1901, 2099);
      if (DB.endYear < DB.startYear) DB.startYear = DB.endYear;
      if (DB.endYear - DB.startYear > 24) DB.startYear = DB.endYear - 24;
      DB.selectedYear = clamp(DB.selectedYear, DB.startYear, DB.endYear);
      save();
      refRender("people");
    });
    document.getElementById("rt212Now")?.addEventListener("click", () => {
      DB.startYear = yrNow() - 5;
      DB.endYear = yrNow() + 6;
      DB.selectedYear = yrNow();
      save();
      refRender("people");
    });
    document.getElementById("rt212AddEvent")?.addEventListener("click", addEvent);
    document.getElementById("rt212SaveMeta")?.addEventListener("click", saveMeta);
    document.querySelectorAll("[data-rt-year]").forEach((b) =>
      b.addEventListener("click", () => {
        DB.selectedYear = +b.dataset.rtYear;
        save();
        refRender("people");
      }),
    );
    document
      .querySelectorAll("[data-rt-del]")
      .forEach((b) => b.addEventListener("click", () => delEvent(b.dataset.rtDel)));
    document
      .getElementById("rt212Export")
      ?.addEventListener("click", () =>
        saveFile(
          `天机盘关系时间轴-${nowBJ().y}${f2(nowBJ().m)}${f2(nowBJ().d)}.json`,
          JSON.stringify(window.TianjiRelationTimeline.snapshot(), null, 2),
        ),
      );
    dragBind(document.getElementById("rt212Strip"));
  }
  try {
    const oldP = REF_PANES.people;
    if (oldP && !oldP.__v212) {
      const fn = () => oldP() + panel();
      fn.__v212 = true;
      REF_PANES.people = fn;
    }
    const oldB = REF_BIND.people;
    const bf = () => {
      try {
        oldB && oldB();
      } catch (err) {
        console.warn("[V212 old people bind]", err);
      }
      try {
        bind();
      } catch (err) {
        console.warn("[V212 timeline bind]", err);
      }
    };
    bf.__v212 = true;
    REF_BIND.people = bf;
    REF_STATIC.add("people");
  } catch (err) {
    console.warn("[V212 relation timeline patch]", err);
  }

  function selfTest() {
    const C = [],
      add = (id, ok, d = "") => C.push({ id, ok: !!ok, d });
    try {
      add("store.events", Array.isArray(DB.events), String(DB.events.length));
      add(
        "year.range",
        DB.endYear >= DB.startYear && DB.endYear - DB.startYear <= 24,
        `${DB.startYear}-${DB.endYear}`,
      );
      const idx = (((2026 - 4) % 60) + 60) % 60;
      add("year.gz", gz(idx) === "丙午", gz(idx));
      if (PPL.rels.length) {
        const r = annualRelation(PPL.rels[0], yrNow());
        add(
          "relation.shape",
          !r.available || Number.isFinite(r.score),
          JSON.stringify({ available: r.available, score: r.score }),
        );
      } else add("relation.shape", true, "无现有关系，跳过运行时关系样本");
    } catch (err) {
      add("exception", false, String((err && err.message) || err));
    }
    return { ok: C.every((x) => x.ok), checks: C };
  }
  const TEST = selfTest();

  const TASKS212 = [
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
      state: "doing",
      note: "v212 一期：关系阶段元数据、现实事件记录、双人年度结构轨迹、家庭年度聚合、可拖动多年时间轴、Evidence 与导出；下一期补多关系并行比较、事件筛选与长期报告",
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
    doing: 2,
    blocked: 1,
    progress: 82.1,
    next: [
      "关系长期时间轴二期：多关系比较 / 长期报告",
      "奇门日/月/年真实第三方 reference 样本",
      "合参 Evidence 正式报告",
    ],
    tasks: TASKS212,
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
          "关系长期时间轴二期：多关系并行 / 阶段报告",
          "奇门四家第三方对拍（二期待外部样本）",
          "合参 Evidence 正式报告",
          "七政四余星历/许可证前置",
        ],
      }),
    );
  }
  applyBoard();
  window.addEventListener("tianji:lazy-ready", () => setTimeout(applyBoard, 0));

  window.TianjiRelationTimeline = Object.freeze({
    version: "1.0.0",
    build: BUILD,
    schema: SCHEMA,
    snapshot: () =>
      clone({
        schema: SCHEMA,
        build: BUILD,
        data: DB,
        people: PPL.people.map((p) => ({ id: p.id, name: p.name, tag: p.tag })),
        relations: PPL.rels,
      }),
    focus: () => clone(focusInfo()),
    annual: (relId, year) =>
      clone(relId === "family" ? annualFamily(year) : annualRelation(relById(relId), year)),
    events: (year, focus) => clone(eventsForYear(year, focus || DB.focus)),
    addEvent: (data) => {
      const x = {
        id: eventId(),
        date: String(data.date || ""),
        type: EVT[data.type] ? data.type : "other",
        title: String(data.title || "").slice(0, 60),
        note: String(data.note || "").slice(0, 500),
        relationId: data.relationId || null,
        personIds: Array.isArray(data.personIds) ? data.personIds.slice() : [],
        personNames: Array.isArray(data.personNames) ? data.personNames.slice() : [],
        scope: data.scope || "custom",
        createdAt: Date.now(),
        source: "api",
      };
      if (!x.date || !x.title) return null;
      DB.events.push(x);
      save();
      return clone(x);
    },
    removeEvent: (id) => {
      const n = DB.events.length;
      DB.events = DB.events.filter((x) => x.id !== id);
      save();
      return DB.events.length < n;
    },
    setRelationMeta: (id, meta) => {
      if (!relById(id)) return null;
      DB.meta[id] = { ...relationMeta(id), ...clone(meta), updatedAt: Date.now() };
      save();
      return clone(DB.meta[id]);
    },
    selfTest: () => clone(TEST),
    manifest: () => ({
      module: "Tianji Relation Timeline V1",
      implemented: [
        "关系开始/结束/状态/阶段",
        "现实事件记录",
        "双人年度结构轨迹",
        "家庭年度聚合",
        "流年触发",
        "可拖动时间轴",
        "Evidence",
        "独立导出",
      ],
      boundaries: [
        "年度指数不是概率或幸福指数",
        "现实事件由用户手工记录且与算法分层",
        "关系建立记录时间不自动当作现实关系开始时间",
      ],
      remaining: ["多关系同图比较", "事件筛选/搜索", "双人长期报告", "家庭成员阶段矩阵"],
    }),
  });
  window.TianjiSystemV212 = {
    version: "v212",
    build: BUILD,
    relationTimeline: true,
    noticeQuietDefault: true,
    baseline: "v211",
  };

  function sync() {
    const b = document.getElementById("buildVersion");
  }
  /* V226: historical delayed version writer disabled */
})();
