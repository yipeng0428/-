/* ===== v53 人物关系册：人物主库 + 稳定ID关系 + 公共读取接口 ===== */
const PRB = { editId: null, q: "", subs: new Set(), version: "1.0" };
function prbClone(v) {
  try {
    return structuredClone(v);
  } catch (_) {
    return JSON.parse(JSON.stringify(v));
  }
}
function prbEnsure() {
  try {
    return pplRepairData(false);
  } catch (e) {
    console.error("[人物主库自检]", e);
    return {
      people: 0,
      relations: 0,
      invalidBirth: 0,
      ok: false,
      error: String((e && e.message) || e),
    };
  }
}
function prbEmit(type, detail) {
  const payload = Object.assign({ type, at: Date.now() }, detail || {});
  PRB.subs.forEach((fn) => {
    try {
      fn(prbClone(payload));
    } catch (e) {
      console.error(e);
    }
  });
  try {
    window.dispatchEvent(new CustomEvent("tianjipan:peoplechange", { detail: payload }));
  } catch (_) {}
}
function prbSan(d) {
  d = d || {};
  const now = Date.now();
  return {
    id: pplSafeId(d.id) && !PPL.people.some((p) => p.id === d.id) ? d.id : pplId(),
    name:
      String(d.name || "人物")
        .trim()
        .slice(0, 24) || "人物",
    tag: PPL_TAGS.includes(d.tag) ? d.tag : "",
    gender: d.gender === "0" ? "0" : "1",
    dt: String(d.dt || ""),
    lon: String(d.lon == null ? "117.8" : d.lon),
    lat: String(d.lat == null ? "24.5" : d.lat),
    solar: !!d.solar,
    cal: d.cal === "L" ? "L" : "S",
    note: String(d.note || "").slice(0, 300),
    fenye: String(d.fenye || ""),
    place: String(d.place || ""),
    createdAt: d.createdAt || now,
    updatedAt: now,
    source: d.source || "people-book",
  };
}
function prbCommit(type, detail) {
  if (!pplSave()) throw new Error("本次更改未保存，请检查本地存储空间");
  try {
    pplBook();
    pplState();
    pplRefreshViews();
  } catch (e) {
    console.error(e);
  }
  prbEmit(type, detail);
  if ($("#pane-people") && $("#pane-people").classList.contains("on"))
    setTimeout(() => refRender("people"), 0);
}
const TJPeople = {
  apiVersion: "1.0",
  schemaVersion: 4,
  event: "tianjipan:peoplechange",
  list() {
    return PPL.people.map(prbClone);
  },
  get(id) {
    const p = pplById(id);
    return p ? prbClone(p) : null;
  },
  current() {
    return this.get(PPL.cur);
  },
  me() {
    return this.get(PPL.meId);
  },
  relations(id) {
    return PPL.rels.filter((r) => !id || r.a === id || r.b === id).map(prbClone);
  },
  related(id) {
    return PPL.rels
      .filter((r) => r.a === id || r.b === id)
      .map((r) => ({ relation: prbClone(r), person: this.get(r.a === id ? r.b : r.a) }));
  },
  derive(id) {
    const p = pplById(id);
    return p ? pplDerive(p) : null;
  },
  add(data, opt) {
    const p = prbSan(data);
    PPL.people.push(p);
    if (!opt || opt.select !== false) PPL.cur = p.id;
    if (p.tag === "本人") {
      PPL.people.forEach((x) => {
        if (x.id !== p.id && x.tag === "本人") x.tag = "";
      });
      PPL.meId = p.id;
    }
    prbCommit("person:add", { id: p.id });
    return prbClone(p);
  },
  update(id, patch) {
    const p = pplById(id);
    if (!p) return null;
    const keep = { id: p.id, createdAt: p.createdAt, source: p.source };
    Object.assign(p, prbSan(Object.assign({}, p, patch)), keep, { updatedAt: Date.now() });
    if (p.tag === "本人") {
      PPL.people.forEach((x) => {
        if (x.id !== p.id && x.tag === "本人") x.tag = "";
      });
      PPL.meId = p.id;
    }
    prbCommit("person:update", { id });
    return prbClone(p);
  },
  remove(id) {
    const p = pplById(id);
    if (!p) return false;
    PPL.people = PPL.people.filter((x) => x.id !== id);
    PPL.rels = PPL.rels.filter((r) => r.a !== id && r.b !== id);
    delete PPL.pos[id];
    if (PPL.meId === id) PPL.meId = null;
    if (PPL.cur === id) PPL.cur = null;
    if (PRB.editId === id) PRB.editId = null;
    prbCommit("person:remove", { id });
    return true;
  },
  select(id, opt) {
    const p = pplById(id);
    if (!p) return false;
    PPL.cur = id;
    if (!pplSave()) return false;
    if (!opt || opt.load !== false) pplOpen(id);
    prbEmit("person:select", { id });
    return true;
  },
  setMe(id) {
    const p = pplById(id);
    if (!p) return false;
    PPL.people.forEach((x) => {
      if (x.tag === "本人") x.tag = "";
    });
    p.tag = "本人";
    p.updatedAt = Date.now();
    PPL.meId = id;
    prbCommit("person:me", { id });
    return true;
  },
  link(a, b, role, note) {
    if (a === b || !pplById(a) || !pplById(b)) return null;
    role = Object.hasOwn(PPL_ROLE, role) ? role : "other";
    const n = pplNormRel(a, b, role);
    const dup = PPL.rels.find(
      (r) =>
        r.role === n.role &&
        ((r.a === n.a && r.b === n.b) || (PPL_SYM.includes(n.role) && r.a === n.b && r.b === n.a)),
    );
    if (dup) return prbClone(dup);
    const r = {
      id: "r" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
      a: n.a,
      b: n.b,
      role: n.role,
      note: String(note || "").slice(0, 30),
      createdAt: Date.now(),
    };
    PPL.rels.push(r);
    prbCommit("relation:add", { id: r.id, a: r.a, b: r.b });
    return prbClone(r);
  },
  unlink(id) {
    const n = PPL.rels.length;
    PPL.rels = PPL.rels.filter((r) => r.id !== id);
    if (PPL.rels.length === n) return false;
    prbCommit("relation:remove", { id });
    return true;
  },
  snapshot() {
    return prbClone({
      schema: 5,
      api: "TJPeople/1.1",
      people: PPL.people,
      rels: PPL.rels,
      relations: PPL.rels,
      meId: PPL.meId,
      pos: PPL.pos,
      cur: PPL.cur,
      currentId: PPL.cur,
    });
  },
  subscribe(fn) {
    if (typeof fn !== "function") return () => {};
    PRB.subs.add(fn);
    return () => PRB.subs.delete(fn);
  },
};
window.TJPeople = TJPeople;
function prbFormCurrent() {
  const f = pplFormPerson();
  return Object.assign({}, f, { place: ($("#geoQuick") || {}).value || "", source: "persona" });
}
function prbFillForm(p) {
  const set = (id, v) => {
    const e = $("#" + id);
    if (e) e.value = v == null ? "" : v;
  };
  set("prbName", p && p.name);
  set("prbTag", p && p.tag);
  set("prbGender", (p && p.gender) || "1");
  set("prbDt", p && p.dt);
  set("prbLon", (p && p.lon) || "117.8");
  set("prbLat", (p && p.lat) || "24.5");
  set("prbNote", (p && p.note) || "");
  const s = $("#prbSolar");
  if (s) s.checked = !!(p && p.solar);
  const flag = $("#prbEditFlag"),
    save = $("#prbSave");
  if (flag) {
    flag.hidden = !PRB.editId;
    flag.textContent = PRB.editId ? "编辑ID · " + PRB.editId : "";
  }
  if (save) save.textContent = PRB.editId ? "保存修改" : "保存档案";
}
function prbFormRead() {
  return {
    name: ($("#prbName").value || "").trim(),
    tag: $("#prbTag").value,
    gender: $("#prbGender").value,
    dt: $("#prbDt").value,
    lon: $("#prbLon").value,
    lat: $("#prbLat").value,
    solar: $("#prbSolar").checked,
    cal: "S",
    note: ($("#prbNote").value || "").trim(),
    source: "people-book",
  };
}
function prbPersonCard(p) {
  const d = pplDerive(p),
    rels = PPL.rels.filter((r) => r.a === p.id || r.b === p.id),
    isMe = p.id === PPL.meId,
    isCur = p.id === PPL.cur;
  const pillars = d ? d.bz.pill.map((x) => GAN[x.s] + ZHI[x.b]).join(" · ") : "出生时间待核";
  const sex = p.gender === "1" ? "男" : "女",
    initial = (p.name || "人").slice(0, 1);
  return `<article class="prb-person${isCur ? " cur" : ""}${isMe ? " me" : ""}" data-prbid="${esc(p.id)}">
    <div class="top"><div class="prb-avatar">${esc(initial)}</div><div style="min-width:0;flex:1"><h5>${esc(p.name)}${p.tag ? `<small>${esc(p.tag)}</small>` : ""}</h5><div class="prb-id">${esc(p.id)}</div></div></div>
    <div class="prb-meta"><span>身份</span><b>${sex}${isMe ? " · 本人" : ""}</b><span>出生</span><b>${esc((p.dt || "—").replace("T", " "))}</b><span>四柱</span><b title="${esc(pillars)}">${esc(pillars)}</b><span>坐标</span><b>${esc(p.lon || "—")}, ${esc(p.lat || "—")}</b></div>
    <div class="prb-badges">${isMe ? '<span class="prb-badge me">本人主档</span>' : ""}<span class="prb-badge rel">${rels.length} 条关系</span>${p.solar ? '<span class="prb-badge">真太阳时</span>' : ""}</div>
    ${p.note ? `<p class="note" style="margin:7px 0 0">${esc(p.note)}</p>` : ""}
    <div class="prb-actions"><button class="gbtn sm" data-prbact="load" data-id="${esc(p.id)}">载入起局</button><button class="gbtn sm" data-prbact="edit" data-id="${esc(p.id)}">编辑</button><button class="gbtn sm" data-prbact="me" data-id="${esc(p.id)}">设为本人</button><button class="gbtn sm" data-prbact="graph" data-id="${esc(p.id)}">关系图</button><button class="gbtn sm" data-prbact="del" data-id="${esc(p.id)}">删除</button></div>
  </article>`;
}
function prbRelRow(r) {
  const A = pplById(r.a),
    B = pplById(r.b);
  if (!A || !B) return "";
  const role = PPL_ROLE[r.role] || PPL_ROLE.other;
  return `<div class="prb-rel"><div><b>${esc(A.name)} → ${esc(B.name)} · ${esc(role.n)}</b><small>ID关联：${esc(r.a)} ↔ ${esc(r.b)}${r.note ? " · " + esc(r.note) : ""}</small></div><div class="ops"><button class="gbtn sm" data-prbrel="graph" data-rid="${esc(r.id)}">查看</button><button class="gbtn sm" data-prbrel="del" data-rid="${esc(r.id)}">删除</button></div></div>`;
}
function prbPage() {
  prbEnsure();
  const q = PRB.q.trim().toLowerCase(),
    list = PPL.people.filter(
      (p) => !q || [p.name, p.tag, p.dt, p.note, p.id].join(" ").toLowerCase().includes(q),
    );
  const opt = PPL.people
    .map(
      (p) =>
        `<option value="${esc(p.id)}">${esc(p.name)}${p.tag ? " · " + esc(p.tag) : ""}</option>`,
    )
    .join("");
  const me = pplById(PPL.meId),
    cur = pplById(PPL.cur);
  return `<div class="prb-shell">
    <section class="panel prb-hero"><div><h3>人物关系册</h3><p>这是全站统一的“人物主库”。每个人物拥有永久独立 ID；关系只关联 ID，不依赖姓名文本。八字、紫微、合盘、择日、关系图和后续模块都可以通过统一接口读取这里的数据。</p></div>
      <div class="prb-stats"><div class="prb-stat"><small>人物</small><b>${PPL.people.length}</b></div><div class="prb-stat"><small>关系</small><b>${PPL.rels.length}</b></div><div class="prb-stat"><small>本人</small><b>${me ? esc(me.name) : "—"}</b></div><div class="prb-stat"><small>当前起局</small><b>${cur ? esc(cur.name) : "—"}</b></div></div></section>
    <div class="prb-grid">
      <section class="panel prb-panel"><div class="prb-hd"><h4>${PRB.editId ? "编辑档案" : "录入人物"}</h4><small>保存新人物始终创建新 ID；编辑才修改指定 ID</small></div>
        <div class="prb-form">
          <label>姓名<input id="prbName" maxlength="24" placeholder="人物姓名"></label>
          <label>关系标签<select id="prbTag"><option value="">未分类</option>${PPL_TAGS.map((x) => `<option>${x}</option>`).join("")}</select></label>
          <label>性别<select id="prbGender"><option value="1">男</option><option value="0">女</option></select></label>
          <label>出生日期时间<input type="datetime-local" id="prbDt"></label>
          <label>经度<input type="number" step=".0001" id="prbLon"></label>
          <label>纬度<input type="number" step=".0001" id="prbLat"></label>
          <label class="wide" style="flex-direction:row;align-items:center"><input type="checkbox" id="prbSolar"> 真太阳时校正</label>
          <label class="wide">备注<textarea id="prbNote" maxlength="300" placeholder="称谓、家庭信息、来源说明等；不会参与排盘计算"></textarea></label>
          <div class="prb-form-actions"><button class="gbtn" id="prbSave">${PRB.editId ? "保存修改" : "保存档案"}</button><button class="gbtn sm" id="prbFromCurrent">从当前个人档案带入</button><button class="gbtn sm" id="prbClear">清空表单</button><span class="prb-editflag" id="prbEditFlag"${PRB.editId ? "" : " hidden"}>${PRB.editId ? "编辑ID · " + PRB.editId : ""}</span></div>
        </div>
        <div class="prb-bookbar"><input class="prb-search" id="prbQ" value="${esc(PRB.q)}" placeholder="搜索姓名、标签、生日、备注或人物ID"><button class="gbtn sm" id="prbGraphAll">打开关系图</button><button class="gbtn sm" id="prbExp">导出主库</button><button class="gbtn sm" id="prbImpB">导入合并</button><input id="prbImp" type="file" accept=".json,application/json" hidden></div>
        <div class="prb-cards">${list.length ? list.map(prbPersonCard).join("") : '<div class="prb-empty">人物关系册还是空的。可以直接在上方录入第一个人物；每次“保存档案”都会生成独立 ID，不会覆盖已有档案。</div>'}</div>
      </section>
      <aside class="panel prb-panel"><div class="prb-hd"><h4>人物强关联</h4><small>关系记录 = 人物ID ↔ 人物ID</small></div>
        ${PPL.people.length >= 2 ? `<div class="prb-relform"><select id="prbRA">${opt}</select><div class="arrow">是</div><select id="prbRB">${opt}</select><div class="arrow">的</div><select id="prbRole">${PPL_ROLES.map((r) => `<option value="${r.k}">${r.n}</option>`).join("")}</select><input id="prbRNote" maxlength="30" placeholder="备注 / 自定义称谓"><button class="gbtn" id="prbRAdd">建立关系</button></div>` : '<p class="note">至少新增两位人物后即可建立关系。关系不会因为人物改名而断开。</p>'}
        <div class="prb-rel-list">${PPL.rels.length ? PPL.rels.map(prbRelRow).join("") : '<div class="prb-empty">暂无人物关系</div>'}</div>
      </aside>
    </div>
    <section class="panel prb-api"><div class="prb-hd"><h4>跨模块数据接口</h4><small>供当前页面与后续功能统一读取</small></div>
      <div class="prb-schema"><div><b>稳定人物 ID</b><small>姓名可修改，ID 不变</small></div><div><b>关系外键</b><small>relation.a / relation.b 只存人物 ID</small></div><div><b>级联删除</b><small>删除人物同时清理其关系</small></div><div><b>变化事件</b><small>tianjipan:peoplechange</small></div></div>
      <pre><code>window.TJPeople
.list() / .get(id) / .current() / .me()
.relations(id) / .related(id) / .derive(id)
.add(data) / .update(id, patch) / .remove(id)
.link(aId, bId, role, note) / .unlink(relationId)
.select(id) / .setMe(id)
.snapshot() / .subscribe(callback)</code></pre>
      <p class="note">以后新模块不要各自保存一份人物数据，而应从 <code>window.TJPeople</code> 读取。这样同一个人的八字、紫微、合盘、择日、关系图等始终引用同一人物 ID。</p>
    </section>
  </div>`;
}
function prbBind() {
  const pane = $("#pane-people");
  if (!pane) return;
  prbFillForm(PRB.editId ? pplById(PRB.editId) : null);
  const save = $("#prbSave");
  if (save)
    save.onclick = () => {
      const f = prbFormRead();
      if (!f.dt || !pplParse(f.dt)) {
        toast("请填写有效的出生日期时间");
        return;
      }
      if (!f.name) f.name = "人物" + (PPL.people.length + 1);
      if (PRB.editId) {
        TJPeople.update(PRB.editId, f);
        toast("已保存人物修改");
        PRB.editId = null;
      } else {
        const p = TJPeople.add(f);
        toast(`已新增：${p.name} · ${esc(p.id)}`);
      }
      refRender("people");
    };
  $("#prbFromCurrent").onclick = () => {
    PRB.editId = null;
    prbFillForm(prbFormCurrent());
  };
  $("#prbClear").onclick = () => {
    PRB.editId = null;
    prbFillForm(null);
  };
  const q = $("#prbQ");
  q.oninput = () => {
    PRB.q = q.value;
    clearTimeout(prbBind._q);
    prbBind._q = setTimeout(() => refRender("people"), 160);
  };
  pane.onclick = (e) => {
    const b = e.target.closest("[data-prbact]");
    if (b) {
      const id = b.dataset.id,
        a = b.dataset.prbact,
        p = pplById(id);
      if (!p) return;
      if (a === "load") {
        TJPeople.select(id);
        window.scrollTo({ top: 0, behavior: "smooth" });
        toast("已载入当前起局：" + p.name);
      } else if (a === "edit") {
        PRB.editId = id;
        refRender("people");
        setTimeout(() => $("#prbName")?.focus(), 30);
      } else if (a === "me") {
        TJPeople.setMe(id);
        toast("已设为本人：" + p.name);
      } else if (a === "graph") {
        NET.sel = { t: "p", id };
        selectTab("net", true);
      } else if (a === "del") {
        if (confirm("确定从人物关系册删除「" + p.name + "」？与其关联的关系也会一并删除。"))
          TJPeople.remove(id);
      }
      return;
    }
    const r = e.target.closest("[data-prbrel]");
    if (r) {
      if (r.dataset.prbrel === "del") {
        TJPeople.unlink(r.dataset.rid);
      } else {
        NET.sel = { t: "e", id: r.dataset.rid };
        selectTab("net", true);
      }
    }
  };
  const add = $("#prbRAdd");
  if (add)
    add.onclick = () => {
      const a = $("#prbRA").value,
        b = $("#prbRB").value;
      if (a === b) {
        toast("请选择两位不同的人物");
        return;
      }
      const r = TJPeople.link(a, b, $("#prbRole").value, ($("#prbRNote").value || "").trim());
      if (r) {
        toast("关系已写入人物主库");
        refRender("people");
      }
    };
  $("#prbGraphAll").onclick = () => {
    NET.sel = null;
    selectTab("net", true);
  };
  $("#prbExp").onclick = () =>
    saveFile(
      `天机盘人物关系册-${nowBJ().y}${f2(nowBJ().m)}${f2(nowBJ().d)}.json`,
      JSON.stringify(TJPeople.snapshot(), null, 2),
    );
  const ib = $("#prbImpB"),
    fi = $("#prbImp");
  ib.onclick = () => fi.click();
  fi.onchange = async () => {
    const f = fi.files[0];
    if (!f) return;
    if (f.size > 8 * 1024 * 1024) {
      toast("导入文件超过8MB，请拆分后导入");
      return;
    }
    try {
      pplImport(JSON.parse(await f.text()));
      prbEnsure();
      refRender("people");
    } catch (e) {
      toast("导入失败：" + String(e.message || e));
    }
    fi.value = "";
  };
  for (const el of [pane, ...pane.querySelectorAll("*")])
    for (const key of ["onclick", "onchange"]) {
      const fn = el[key];
      if (typeof fn === "function")
        el[key] = function (...args) {
          try {
            const v = fn.apply(this, args);
            if (v?.catch) v.catch((e) => toast(String(e.message || e)));
            return v;
          } catch (e) {
            toast(String(e.message || e));
          }
        };
    }
}
prbEnsure();
REF_PANES.people = prbPage;
REF_BIND.people = prbBind;
REF_STATIC.add("people");
/* 现有关系图和其它模块继续读同一 PPL；人物页变化时自动刷新。 */
const _pplRefreshViews_v53 = pplRefreshViews;
pplRefreshViews = function () {
  _pplRefreshViews_v53();
  try {
    if ($("#pane-people") && $("#pane-people").dataset.built && !REF_BUSY.people)
      refRender("people");
  } catch (e) {
    console.error(e);
  }
};
/* 首页“新增入册”也统一走主库接口，永不覆盖当前人物。 */
const _saveP53 = $("#saveP");
if (_saveP53) {
  _saveP53.textContent = "新增入册";
  _saveP53.title =
    "始终创建新的独立人物ID；如需修改已保存人物，请使用“更新当前档案”或到人物关系册编辑";
}
/* v53 version */
try {
  const bv = document.getElementById("buildVersion");

  const ft = document.querySelector("footer");
  if (ft) {
    const t = ft.textContent || "";
    if (/版本\s*·/.test(t));
    else ft.insertAdjacentHTML("beforeend", "<br>版本 · 2026-10-03 21:32:35");
  }
} catch (_) {}
