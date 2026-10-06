/* ===== v55 人物关系册：视觉重构 + 防溢出 + 筛选信息架构 ===== */
(function () {
  const TS = "2026-10-03 21:57:57";
  PRB.filter = PRB.filter || "all";
  function filterMatch(p) {
    const f = PRB.filter || "all";
    if (f === "all") return true;
    if (f === "me") return p.id === PPL.meId || p.tag === "本人";
    if (f === "family") return ["配偶", "父亲", "母亲", "子女", "兄弟姐妹", "祖辈"].includes(p.tag);
    if (f === "friend") return p.tag === "朋友";
    if (f === "work") return p.tag === "同事";
    if (f === "other") return !p.tag || p.tag === "其他";
    return true;
  }
  function countFilter(k) {
    return PPL.people.filter((p) => {
      const old = PRB.filter;
      PRB.filter = k;
      const ok = filterMatch(p);
      PRB.filter = old;
      return ok;
    }).length;
  }
  function healthBlock() {
    const h = pplHealthReport(),
      bad = h.invalid + h.badObj + h.orphan + h.badRel + h.duplicates;
    return `<div class="prb55-health"><strong>数据健康</strong><span class="${bad ? "warn" : "ok"}">${bad ? "发现 " + bad + " 项待处理" : "正常"}</span><small>${h.people} 人 · ${h.relations} 条关系${h.invalid ? " · " + h.invalid + " 位出生时间待核" : ""}${h.orphan ? " · " + h.orphan + " 条孤立关系" : ""}</small><div class="prb55-health-actions"><button class="gbtn sm" id="prbHealthCheck">重新自检</button><button class="gbtn sm" id="prbRepair">备份并修复</button></div></div>`;
  }
  function personCard55(p) {
    let d = null;
    try {
      d = pplDerive(p);
    } catch (_) {
      d = null;
    }
    const rels = PPL.rels.filter((r) => r.a === p.id || r.b === p.id),
      isMe = p.id === PPL.meId,
      isCur = p.id === PPL.cur;
    const pillars =
      d && d.bz && d.bz.pill
        ? d.bz.pill.map((x) => GAN[x.s] + ZHI[x.b]).join(" · ")
        : "出生时间待核";
    const sex = p.gender === "1" ? "男" : "女",
      initial = (p.name || "人").slice(0, 1),
      birth = (p.dt || "—").replace("T", " ");
    return `<article class="prb55-person${isCur ? " cur" : ""}${isMe ? " me" : ""}" data-prbid="${esc(p.id)}">
      <div class="prb55-personhead"><div class="prb55-avatar">${esc(initial)}</div><div class="prb55-name"><h5><span>${esc(p.name)}</span>${p.tag ? `<span class="tag">${esc(p.tag)}</span>` : ""}</h5><div class="prb55-id" title="${esc(p.id)}">${esc(p.id)}</div></div><div class="prb55-status">${isMe ? '<span class="prb55-chip me">本人</span>' : ""}${isCur ? '<span class="prb55-chip cur">当前</span>' : ""}<span class="prb55-chip rel">${rels.length} 关系</span></div></div>
      <div class="prb55-pillar"><span>四柱</span><b title="${esc(pillars)}">${esc(pillars)}</b></div>
      <div class="prb55-meta"><span>出生</span><b title="${esc(birth)}">${esc(birth)}</b><span>资料</span><b>${sex}${p.solar ? " · 真太阳时" : ""}${p.place ? " · " + esc(p.place) : ""}</b><span>坐标</span><b>${esc(p.lon || "—")}, ${esc(p.lat || "—")}</b></div>
      ${p.note ? `<p class="prb55-note" title="${esc(p.note)}">${esc(p.note)}</p>` : '<p class="prb55-note">未填写备注</p>'}
      <div class="prb55-actions"><button class="gbtn" data-prbact="load" data-id="${esc(p.id)}">载入起局</button><button class="gbtn" data-prbact="graph" data-id="${esc(p.id)}">关系图</button><div class="prb55-actions-sub"><button class="gbtn sm" data-prbact="edit" data-id="${esc(p.id)}">编辑</button><button class="gbtn sm" data-prbact="me" data-id="${esc(p.id)}">设为本人</button><button class="gbtn sm prb55-danger" data-prbact="del" data-id="${esc(p.id)}">删除</button></div></div>
    </article>`;
  }
  function relRow55(r) {
    const A = pplById(r.a),
      B = pplById(r.b);
    if (!A || !B) return "";
    const role = PPL_ROLE[r.role] || PPL_ROLE.other;
    return `<div class="prb55-rel"><div class="prb55-rel-main"><b title="${esc(A.name)} → ${esc(B.name)} · ${esc(role.n)}">${esc(A.name)} → ${esc(B.name)} · ${esc(role.n)}</b><small title="${esc(r.a)} ↔ ${esc(r.b)}${r.note ? " · " + esc(r.note) : ""}">${r.note ? esc(r.note) + " · " : ""}ID 强关联</small></div><div class="ops"><button class="gbtn sm" data-prbrel="graph" data-rid="${esc(r.id)}">查看</button><button class="gbtn sm" data-prbrel="del" data-rid="${esc(r.id)}">删</button></div></div>`;
  }
  prbPage = function () {
    prbEnsure();
    const q = String(PRB.q || "")
      .trim()
      .toLowerCase();
    const list = PPL.people.filter(
      (p) =>
        filterMatch(p) &&
        (!q || [p.name, p.tag, p.dt, p.note, p.id, p.place].join(" ").toLowerCase().includes(q)),
    );
    const optA = PPL.people
      .map(
        (p, i) =>
          `<option value="${esc(p.id)}">${esc(p.name)}${p.tag ? " · " + esc(p.tag) : ""}</option>`,
      )
      .join("");
    const optB = PPL.people
      .map(
        (p, i) =>
          `<option value="${esc(p.id)}"${i === 1 ? " selected" : ""}>${esc(p.name)}${p.tag ? " · " + esc(p.tag) : ""}</option>`,
      )
      .join("");
    const me = pplById(PPL.meId),
      cur = pplById(PPL.cur);
    const filters = [
      ["all", "全部人物"],
      ["me", "本人"],
      ["family", "家庭"],
      ["friend", "朋友"],
      ["work", "同事"],
      ["other", "未分类"],
    ];
    return `<div class="prb55-shell">
      <section class="panel prb55-hero"><div><div class="prb55-kicker">People Master Archive</div><h3 class="prb55-title">人物关系册</h3><p class="prb55-desc">以人物为主数据，而不是以某一次排盘为中心。每个人拥有永久 ID；姓名可改、资料可补，但八字、紫微、合盘、择日与关系图始终读取同一个人物源。</p></div><div class="prb55-stats"><div class="prb55-stat"><small>人物总数</small><b>${PPL.people.length}</b></div><div class="prb55-stat"><small>关系记录</small><b>${PPL.rels.length}</b></div><div class="prb55-stat"><small>本人主档</small><b title="${me ? esc(me.name) : "—"}">${me ? esc(me.name) : "—"}</b></div><div class="prb55-stat"><small>当前起局</small><b title="${cur ? esc(cur.name) : "—"}">${cur ? esc(cur.name) : "—"}</b></div></div></section>
      ${healthBlock()}
      <div class="prb55-workspace">
        <aside class="panel prb55-rail"><div><span class="prb55-label">快速检索</span><div class="prb55-search"><input class="prb-search" id="prbQ" value="${esc(PRB.q || "")}" placeholder="姓名 / 标签 / 生日 / ID"></div></div><div><span class="prb55-label">人物分组</span><div class="prb55-filter">${filters.map(([k, n]) => `<button type="button" data-prbfilter="${k}" class="${PRB.filter === k ? "on" : ""}"><span>${n}</span><i>${countFilter(k)}</i></button>`).join("")}</div></div><div><span class="prb55-label">操作</span><div class="prb55-rail-actions"><button class="gbtn" id="prbStartNew">录入人物</button><button class="gbtn sm" id="prbGraphAll">打开关系图</button><button class="gbtn sm" id="prbExp">导出人物主库</button><button class="gbtn sm" id="prbImpB">导入并合并</button><input id="prbImp" type="file" accept=".json,application/json" hidden></div></div><div class="prb55-rail-note"><b>数据规则</b><span>保存新人物始终创建新 ID；只有“编辑档案”才修改旧记录。</span><span>关系使用 ID 外键，所以改名不会断开关系。</span></div></aside>
        <main class="prb55-main"><div class="prb55-mainhead"><div><h4>人物档案</h4><p>${q || PRB.filter !== "all" ? "当前为筛选结果" : "按人物独立存档，可直接载入各模块继续推演"}</p></div><span class="prb55-count">SHOW ${list.length} / ${PPL.people.length}</span></div><div class="prb55-cards">${list.length ? list.map(personCard55).join("") : `<div class="prb55-empty">${PPL.people.length ? "没有符合当前筛选条件的人物。" : "人物关系册还是空的。请从右侧录入第一位人物；每次保存都会生成独立 ID。"}</div>`}</div></main>
        <aside class="prb55-side">
          <section class="panel prb55-editor"><div class="prb55-panelhead"><div><h4>${PRB.editId ? "编辑档案" : "录入人物"}</h4><small>${PRB.editId ? "当前只修改指定人物，不会新建 ID" : "保存新档案不会覆盖任何已有档案"}</small></div><span class="prb55-editflag" id="prbEditFlag"${PRB.editId ? "" : " hidden"}>${PRB.editId ? "ID · " + PRB.editId : ""}</span></div><div class="prb55-form"><label>姓名<input id="prbName" maxlength="24" placeholder="人物姓名"></label><label>身份<select id="prbTag"><option value="">未分类</option>${PPL_TAGS.map((x) => `<option>${x}</option>`).join("")}</select></label><label>性别<select id="prbGender"><option value="1">男</option><option value="0">女</option></select></label><label>出生日期时间<input type="datetime-local" id="prbDt"></label><label>经度<input type="number" step=".0001" id="prbLon"></label><label>纬度<input type="number" step=".0001" id="prbLat"></label><label class="prb55-check"><input type="checkbox" id="prbSolar"> 真太阳时校正</label><label class="wide">备注<textarea id="prbNote" maxlength="300" placeholder="称谓、家庭信息、来源说明等"></textarea></label><div class="prb55-form-actions"><button class="gbtn" id="prbSave">${PRB.editId ? "保存修改" : "保存档案"}</button><button class="gbtn sm" id="prbFromCurrent">带入当前档案</button><button class="gbtn sm" id="prbClear">清空表单</button></div></div></section>
          <section class="panel prb55-relbox"><div class="prb55-panelhead"><div><h4>人物强关联</h4><small>关系记录只保存 人物ID ↔ 人物ID</small></div></div>${PPL.people.length >= 2 ? `<div class="prb55-relform"><select id="prbRA">${optA}</select><span class="word">是</span><select id="prbRB">${optB}</select><select class="full" id="prbRole">${PPL_ROLES.map((r) => `<option value="${r.k}">${r.n}</option>`).join("")}</select><input class="full" id="prbRNote" maxlength="30" placeholder="备注 / 自定义称谓"><button class="gbtn full" id="prbRAdd">建立关系</button></div>` : '<p class="note">至少需要两位人物才能建立关系。先保存两位人物档案即可。</p>'}<div class="prb55-rel-list">${PPL.rels.length ? PPL.rels.map(relRow55).join("") : '<div class="prb55-empty" style="padding:18px 10px">暂无人物关系</div>'}</div></section>
        </aside>
      </div>
      <details class="panel prb55-tech"><summary><span>开发接口与数据结构</span><span class="dim">TJPeople · 给其它模块读取</span></summary><div class="prb55-tech-body"><div class="prb55-schema"><div><b>稳定人物 ID</b><small>姓名修改，ID 不变</small></div><div><b>关系外键</b><small>relation.a / relation.b 仅存 ID</small></div><div><b>级联清理</b><small>删除人物同步清理关系</small></div><div><b>变化事件</b><small>tianjipan:peoplechange</small></div></div><pre><code>window.TJPeople
.list() / .get(id) / .current() / .me()
.relations(id) / .related(id) / .derive(id)
.add(data) / .update(id, patch) / .remove(id)
.link(aId, bId, role, note) / .unlink(relationId)
.select(id) / .setMe(id)
.snapshot() / .subscribe(callback)</code></pre></div></details>
    </div>`;
  };
  const bind54 = prbBind;
  prbBind = function () {
    bind54();
    const pane = $("#pane-people");
    if (!pane) return;
    $$("[data-prbfilter]", pane).forEach(
      (b) =>
        (b.onclick = () => {
          PRB.filter = b.dataset.prbfilter || "all";
          refRender("people");
        }),
    );
    const n = $("#prbStartNew");
    if (n)
      n.onclick = () => {
        PRB.editId = null;
        refRender("people");
        setTimeout(() => {
          $("#prbName")?.focus();
          $("#prbName")?.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 30);
      };
  };
  REF_PANES.people = prbPage;
  REF_BIND.people = prbBind;
  REF_STATIC.add("people");
  /* 人物关系册/关系图使用独立宽幅工作区，避免被左侧巨盘挤压。 */
  try {
    const _selectTabPeople55 = selectTab;
    selectTab = function (id, scroll) {
      document.body.classList.toggle("people-focus-mode", id === "people" || id === "net");
      return _selectTabPeople55(id, scroll);
    };
    const active = $(".tab.on");
    document.body.classList.toggle(
      "people-focus-mode",
      !!(active && (active.dataset.tab === "people" || active.dataset.tab === "net")),
    );
  } catch (e) {
    console.error("[人物关系册宽幅模式]", e);
  }
  try {
    const bv = document.getElementById("buildVersion");

    const ft = document.querySelector("footer");
    if (ft) {
      const t = ft.textContent || "";
      if (/版本\s*·/.test(t));
      else ft.insertAdjacentHTML("beforeend", "<br>版本 · " + TS);
    }
  } catch (_) {}
})();
