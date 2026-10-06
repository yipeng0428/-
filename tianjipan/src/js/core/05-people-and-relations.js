const PPLK = "tianjipan.people.master.v1";
const PPL = { people: [], rels: [], meId: null, pos: {}, cur: null, calKind: "S", cache: {} };
const NET = { layout: "tree", gs: true, tags: true, all: false, sel: null, drag: null };
const PPL_CITY = [
  ["北京", 116.4, 39.9],
  ["上海", 121.5, 31.2],
  ["天津", 117.2, 39.1],
  ["重庆", 106.5, 29.6],
  ["广州", 113.3, 23.1],
  ["深圳", 114.1, 22.5],
  ["福州", 119.3, 26.1],
  ["厦门", 118.1, 24.5],
  ["漳州", 117.65, 24.5],
  ["泉州", 118.6, 24.9],
  ["莆田", 119.0, 25.4],
  ["龙岩", 117.0, 25.1],
  ["三明", 117.6, 26.3],
  ["宁德", 119.5, 26.7],
  ["南平", 118.2, 26.6],
  ["温州", 120.7, 28.0],
  ["杭州", 120.2, 30.3],
  ["宁波", 121.6, 29.9],
  ["南京", 118.8, 32.1],
  ["苏州", 120.6, 31.3],
  ["合肥", 117.3, 31.9],
  ["南昌", 115.9, 28.7],
  ["武汉", 114.3, 30.6],
  ["长沙", 113.0, 28.2],
  ["郑州", 113.6, 34.7],
  ["济南", 117.0, 36.7],
  ["青岛", 120.4, 36.1],
  ["石家庄", 114.5, 38.0],
  ["太原", 112.5, 37.9],
  ["西安", 108.9, 34.3],
  ["兰州", 103.8, 36.1],
  ["银川", 106.3, 38.5],
  ["西宁", 101.8, 36.6],
  ["呼和浩特", 111.7, 40.8],
  ["沈阳", 123.4, 41.8],
  ["长春", 125.3, 43.9],
  ["哈尔滨", 126.6, 45.8],
  ["成都", 104.1, 30.7],
  ["贵阳", 106.7, 26.6],
  ["昆明", 102.7, 25.0],
  ["南宁", 108.3, 22.8],
  ["海口", 110.3, 20.0],
  ["汕头", 116.7, 23.4],
  ["拉萨", 91.1, 29.7],
  ["乌鲁木齐", 87.6, 43.8],
  ["香港", 114.2, 22.3],
  ["澳门", 113.5, 22.2],
  ["台北", 121.5, 25.0],
];
const pplId = () => "p" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
function pplValidCivil(c) {
  const leap = c.y % 4 === 0 && (c.y % 100 !== 0 || c.y % 400 === 0),
    days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return (
    c.y >= 1901 &&
    c.y <= 2099 &&
    c.m >= 1 &&
    c.m <= 12 &&
    c.d >= 1 &&
    c.d <= days[c.m - 1] &&
    c.h >= 0 &&
    c.h <= 23 &&
    c.mi >= 0 &&
    c.mi <= 59 &&
    c.s >= 0 &&
    c.s < 60
  );
}
const pplSafeId = (id) =>
  typeof id === "string" &&
  /^[A-Za-z0-9_-]{1,96}$/.test(id) &&
  !["__proto__", "prototype", "constructor"].includes(id);
let pplCommitted = null;
function pplCheckpoint() {
  return JSON.parse(
    JSON.stringify({
      people: PPL.people,
      rels: PPL.rels,
      meId: PPL.meId,
      pos: PPL.pos,
      cur: PPL.cur,
    }),
  );
}
function pplRestore() {
  if (pplCommitted) Object.assign(PPL, JSON.parse(JSON.stringify(pplCommitted)), { cache: {} });
}
const pplParse = (s) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(s || "");
  if (!m) return null;
  const c = { y: +m[1], m: +m[2], d: +m[3], h: +m[4], mi: +m[5], s: m[6] ? +m[6] : 0 };
  return pplValidCivil(c) ? c : null;
};
function pplLoad() {
  pplCommitted = pplCheckpoint();
  const hydrate = (o) => {
    if (!o || !Array.isArray(o.people)) return false;
    PPL.people = o.people;
    PPL.rels = Array.isArray(o.rels) ? o.rels : Array.isArray(o.relations) ? o.relations : [];
    PPL.meId = o.meId || null;
    PPL.pos = o.pos && typeof o.pos === "object" ? o.pos : {};
    PPL.cur = o.cur || o.currentId || null;
    pplRepairData(false);
    pplCommitted = pplCheckpoint();
    return true;
  };
  try {
    if (hydrate(JSON.parse(localStorage.getItem(PPLK) || "null"))) return;
  } catch (e) {}
  /* v3 → 人物主库 v1：保留旧人物、关系、位置，迁移后不丢数据 */
  try {
    const o = JSON.parse(localStorage.getItem("tianjipan.people.v3") || "null");
    if (hydrate(o)) {
      if (!pplSave()) return false;
      return;
    }
  } catch (e) {}
  /* 更早的 profiles.v2 也继续兼容 */
  try {
    const old = JSON.parse(localStorage.getItem("tianjipan.profiles.v2") || "[]");
    old.forEach((p) =>
      PPL.people.push({
        id: pplId(),
        name: p.name,
        tag: "",
        gender: p.gender,
        dt: p.dt,
        lon: p.lon,
        lat: p.lat,
        solar: !!p.solar,
        cal: "S",
        note: "",
        createdAt: Date.now(),
        updatedAt: Date.now(),
        source: "profiles-v2",
      }),
    );
    if (PPL.people.length) if (!pplSave()) return false;
  } catch (e) {}
}
function pplSave() {
  try {
    const now = Date.now();
    PPL.people.forEach((p) => {
      if (!p.createdAt) p.createdAt = now;
      if (!p.updatedAt) p.updatedAt = p.createdAt;
      if (!p.source) p.source = "legacy";
    });
    const data = { schema: 5, api: "TJPeople/1.2", updatedAt: now, ...pplCheckpoint() };
    localStorage.setItem(PPLK, JSON.stringify(data));
    pplCommitted = pplCheckpoint();
    return true;
  } catch (e) {
    pplRestore();
    toast("保存失败：本地存储不可用或空间不足；本次更改未保存，请先导出备份。");
    return false;
  }
}
/* ---- v54 人物主库稳定层：在应用 init() 前可用，避免旧数据/缺失字段拖垮关系册与关系图 ---- */
function pplRepairData(save) {
  const rep = {
    fixed: 0,
    droppedPeople: 0,
    droppedRelations: 0,
    duplicateIds: 0,
    invalidBirth: 0,
    orphanPos: 0,
  };
  if (!Array.isArray(PPL.people)) {
    PPL.people = [];
    rep.fixed++;
  }
  if (!Array.isArray(PPL.rels)) {
    PPL.rels = [];
    rep.fixed++;
  }
  if (!PPL.pos || typeof PPL.pos !== "object" || Array.isArray(PPL.pos)) {
    PPL.pos = {};
    rep.fixed++;
  }
  const now = Date.now(),
    seen = new Set(),
    out = [],
    remap = new Map();
  PPL.people.forEach((raw, i) => {
    if (!raw || typeof raw !== "object") {
      rep.droppedPeople++;
      return;
    }
    const p = raw;
    let id = String(p.id || "").trim();
    const old = id;
    if (!pplSafeId(id) || seen.has(id)) {
      do {
        id = pplId();
      } while (seen.has(id));
      rep.fixed++;
      if (seen.has(old)) rep.duplicateIds++;
    }
    if (!remap.has(old)) remap.set(old, id);
    seen.add(id);
    p.id = id;
    p.name =
      String(p.name || "人物" + (i + 1))
        .trim()
        .slice(0, 24) || "人物" + (i + 1);
    p.tag = PPL_TAGS.includes(p.tag) ? p.tag : "";
    p.gender = p.gender === "0" ? "0" : "1";
    p.dt = String(p.dt || "")
      .trim()
      .replace(" ", "T");
    if (!pplParse(p.dt)) rep.invalidBirth++;
    let lo = parseFloat(p.lon),
      la = parseFloat(p.lat);
    if (!Number.isFinite(lo)) {
      lo = 117.8;
      rep.fixed++;
    }
    if (!Number.isFinite(la)) {
      la = 24.5;
      rep.fixed++;
    }
    lo = Math.max(-180, Math.min(180, lo));
    la = Math.max(-66, Math.min(66, la));
    p.lon = String(lo);
    p.lat = String(la);
    p.solar = !!p.solar;
    p.cal = p.cal === "L" ? "L" : "S";
    p.note = String(p.note || "").slice(0, 300);
    p.fenye = String(p.fenye || "");
    p.place = String(p.place || "");
    p.createdAt = Number.isFinite(+p.createdAt) ? +p.createdAt : now;
    p.updatedAt = Number.isFinite(+p.updatedAt) ? +p.updatedAt : p.createdAt;
    p.source = String(p.source || "legacy");
    out.push(p);
  });
  PPL.people = out;
  const ids = new Set(out.map((p) => p.id)),
    relSeen = new Set(),
    rels = [];
  PPL.rels.forEach((raw) => {
    if (!raw || typeof raw !== "object") {
      rep.droppedRelations++;
      return;
    }
    let a = remap.get(String(raw.a || "")) || String(raw.a || ""),
      b = remap.get(String(raw.b || "")) || String(raw.b || "");
    if (!ids.has(a) || !ids.has(b) || a === b) {
      rep.droppedRelations++;
      return;
    }
    let role = Object.hasOwn(PPL_ROLE, raw.role) ? raw.role : "other";
    const n = pplNormRel(a, b, role);
    a = n.a;
    b = n.b;
    role = n.role;
    const sym = PPL_SYM.includes(role),
      key = role + "|" + (sym ? [a, b].sort().join("|") : a + "|" + b);
    if (relSeen.has(key)) {
      rep.droppedRelations++;
      return;
    }
    relSeen.add(key);
    rels.push({
      id: pplSafeId(raw.id) && !rels.some((r) => r.id === raw.id) ? raw.id : "r" + pplId(),
      a,
      b,
      role,
      note: String(raw.note || "").slice(0, 30),
      createdAt: Number.isFinite(+raw.createdAt) ? +raw.createdAt : now,
      hm: pplSanHm(raw.hm),
    });
  });
  PPL.rels = rels;
  PPL.cur = remap.get(PPL.cur) || PPL.cur;
  PPL.meId = remap.get(PPL.meId) || PPL.meId;
  const pos = {};
  Object.entries(PPL.pos || {}).forEach(([oldId, q]) => {
    const id = remap.get(oldId) || oldId;
    if (!ids.has(id) || !q || !Number.isFinite(+q.x) || !Number.isFinite(+q.y)) {
      rep.orphanPos++;
      return;
    }
    pos[id] = { x: Math.max(0.04, Math.min(0.96, +q.x)), y: Math.max(0.04, Math.min(0.96, +q.y)) };
  });
  PPL.pos = pos;
  if (PPL.meId && !ids.has(PPL.meId)) {
    PPL.meId = null;
    rep.fixed++;
  }
  if (PPL.cur && !ids.has(PPL.cur)) {
    PPL.cur = null;
    rep.fixed++;
  }
  if (!PPL.meId) {
    const me = out.find((p) => p.tag === "本人");
    if (me) {
      PPL.meId = me.id;
      rep.fixed++;
    }
  }
  PPL.cache = {};
  rep.people = PPL.people.length;
  rep.relations = PPL.rels.length;
  rep.ok = rep.invalidBirth === 0 && rep.droppedPeople === 0 && rep.droppedRelations === 0;
  if (save) {
    try {
      if (!pplSave()) return false;
    } catch (_) {}
  }
  return rep;
}
function pplDerive(p) {
  if (!p || typeof p !== "object") return null;
  const civ = pplParse(String(p.dt || ""));
  if (!civ || civ.y < 1901 || civ.y > 2099) return null;
  let lon = parseFloat(p.lon),
    lat = parseFloat(p.lat);
  if (!Number.isFinite(lon)) lon = 117.8;
  if (!Number.isFinite(lat)) lat = 24.5;
  lon = Math.max(-180, Math.min(180, lon));
  lat = Math.max(-66, Math.min(66, lat));
  const opt = { gender: p.gender === "0" ? "F" : "M", solar: !!p.solar, lon, lat };
  const key = [p.id || "", p.dt, p.gender, p.solar ? 1 : 0, lon.toFixed(5), lat.toFixed(5)].join(
    "|",
  );
  if (PPL.cache && PPL.cache[key]) return PPL.cache[key];
  try {
    const rr = computeAll(civ, opt);
    try {
      qimenPlus(rr.qm, rr);
    } catch (_) {}
    rr.deep = baziDeep(rr.bz);
    try {
      ziweiPlus(rr.zw, rr.lunar, rr.bz.pill[3].b, opt.gender);
      ziweiAdj(rr.zw, rr.lunar, rr.bz.pill[3].b, opt.gender);
    } catch (_) {}
    try {
      rr.lr = liuren(rr.bz.dayIdx, rr.bz.pill[3].b, liurenYueJiang(rr.t.lon));
    } catch (_) {}
    try {
      const pl = asPlanets(rr.t.jdUT);
      rr.astro = {
        planets: pl,
        aspects: asAspects(pl),
        angles: asAngles(rr.t.jdUT, opt.lon, opt.lat),
        moon: asMoonPhase(pl[0].lon, pl[1].lon),
        helio: asHelioAll(rr.t.jdUT),
        yq: wuyunLiuqi(ganzhiIdx(rr.bz.pill[0].s, rr.bz.pill[0].b), rr.t.lon),
      };
    } catch (_) {}
    const out = { R: rr, bz: rr.bz, deep: rr.deep };
    if (!PPL.cache || typeof PPL.cache !== "object") PPL.cache = {};
    if (Object.keys(PPL.cache).length > 160) PPL.cache = {};
    PPL.cache[key] = out;
    return out;
  } catch (e) {
    console.warn("[人物派生失败]", p.id, p.name, e);
    return null;
  }
}
function pplHealthReport() {
  const ids = new Set(),
    dup = [];
  let invalid = 0,
    badObj = 0,
    orphan = 0,
    badRel = 0;
  (Array.isArray(PPL.people) ? PPL.people : []).forEach((p) => {
    if (!p || typeof p !== "object") {
      badObj++;
      return;
    }
    if (ids.has(p.id)) dup.push(p.id);
    ids.add(p.id);
    if (!pplParse(String(p.dt || ""))) invalid++;
  });
  (Array.isArray(PPL.rels) ? PPL.rels : []).forEach((r) => {
    if (!r || !ids.has(r.a) || !ids.has(r.b) || r.a === r.b) orphan++;
    if (r && !PPL_ROLE[r.role]) badRel++;
  });
  return {
    people: Array.isArray(PPL.people) ? PPL.people.length : 0,
    relations: Array.isArray(PPL.rels) ? PPL.rels.length : 0,
    invalid,
    badObj,
    orphan,
    badRel,
    duplicates: dup.length,
    ok: !invalid && !badObj && !orphan && !badRel && !dup.length,
  };
}
const pplEng = (p) => {
  const d = pplDerive(p);
  return d ? Object.assign({}, p, { bz: d.bz, deep: d.deep }) : null;
};
const pplById = (id) => PPL.people.find((x) => x.id === id);
const wxCls = (e) => "wx" + e;
/* ---- 首页人物卡 ---- */
function pplFormPerson() {
  return {
    name: ($("#pname").value || "").trim(),
    tag: $("#ptag").value,
    gender: $("#gender").value,
    dt: $("#dt").value,
    lon: $("#lon").value,
    lat: $("#lat").value,
    solar: $("#solarChk").checked,
    cal: PPL.calKind,
    note: "",
    fenye: ($("#pfenye") || {}).value || "",
  };
}
function pplFill(p) {
  $("#pname").value = p.name || "";
  $("#ptag").value = PPL_TAGS.includes(p.tag) ? p.tag : "";
  $("#gender").value = p.gender || "1";
  $("#dt").value = p.dt || "";
  $("#lon").value = p.lon || "117.8";
  $("#lat").value = p.lat || "24.5";
  $("#solarChk").checked = !!p.solar;
  pplCitySync();
  pplCalKind(p.cal || "S", true);
  pplLunarFill();
  try {
    gfSet(p.fenye || "");
  } catch (e) {}
  setTimeout(prQuickSync, 0);
}
const geoOpts = (arr, ph) =>
  `<option value="">${ph}</option>` +
  arr.map((x, i) => `<option value="${i}">${esc(x)}</option>`).join("");
let GEO_SEARCH_INDEX = null;
function geoPlaceLabel(f) {
  if (!f) return "";
  const p = GEO_DATA[f.pi],
    c = geoCities(f.pi)[f.ci],
    a = f.ai >= 0 ? geoAreas(f.pi, f.ci)[f.ai] : null;
  return [p && GEO_SHORT(p[0]), c && c[0], a && a[0]].filter(Boolean).join(" · ");
}
function geoSearchIndex() {
  if (GEO_SEARCH_INDEX) return GEO_SEARCH_INDEX;
  const out = [];
  GEO_DATA.forEach((p, pi) =>
    p[1].forEach((c, ci) => {
      const pv = GEO_SHORT(p[0]),
        base = { pi, ci, ai: -1, lo: c[1], la: c[2], path: [pv, c[0]].filter(Boolean).join(" · ") };
      out.push(Object.assign({ key: (pv + c[0]).replace(/\s/g, "") }, base));
      (c[3] || []).forEach((a, ai) =>
        out.push({
          pi,
          ci,
          ai,
          lo: a[1],
          la: a[2],
          path: [pv, c[0], a[0]].join(" · "),
          key: (pv + c[0] + a[0]).replace(/\s/g, ""),
        }),
      );
    }),
  );
  return (GEO_SEARCH_INDEX = out);
}
function geoChooseHit(h) {
  if (!h) return;
  $("#pprov").value = String(h.pi);
  $("#pcty").innerHTML = geoOpts(
    geoCities(h.pi).map((c) => c[0]),
    "市",
  );
  $("#pcty").value = String(h.ci);
  const ar = geoAreas(h.pi, h.ci);
  $("#pdis").innerHTML = geoOpts(
    ar.map((a) => a[0]),
    ar.length ? "区/县(可选)" : "—",
  );
  if (h.ai >= 0) $("#pdis").value = String(h.ai);
  $("#llBox").hidden = true;
  const q = $("#geoQuick"),
    rs = $("#geoResults");
  if (q) q.value = h.path;
  if (rs) rs.hidden = true;
  pplSetLL(h.lo, h.la);
}
function geoSearchRender(v) {
  const box = $("#geoResults");
  if (!box) return;
  const q = (v || "").trim().replace(/\s+/g, "");
  if (!q) {
    box.hidden = true;
    box.innerHTML = "";
    return;
  }
  const hits = geoSearchIndex()
    .filter((x) => x.key.includes(q))
    .slice(0, 9);
  box.innerHTML = hits.length
    ? hits
        .map(
          (h, i) => `<button type="button" class="geo-hit" data-gi="${i}">${esc(h.path)}</button>`,
        )
        .join("")
    : `<span class="geo-empty">未找到。可使用右侧三级选择，或选择“其他地区”手动输入经纬度。</span>`;
  box.hidden = false;
  $$(".geo-hit", box).forEach((b, i) => (b.onclick = () => geoChooseHit(hits[i])));
}
function pplSetLL(lo, la) {
  $("#lon").value = lo;
  $("#lat").value = la;
  pplAuto();
}
function geoOnCity() {
  const pi = +$("#pprov").value,
    ci = $("#pcty").value;
  if (ci === "") return;
  const c = geoCities(pi)[+ci];
  $("#pdis").innerHTML = geoOpts(
    c[3].map((a) => a[0]),
    c[3].length ? "区/县(可选)" : "—",
  );
  pplSetLL(c[1], c[2]);
  const q = $("#geoQuick");
  if (q) q.value = geoPlaceLabel({ pi, ci: +ci, ai: -1 });
}
function geoInit() {
  $("#pprov").innerHTML =
    geoOpts(
      GEO_DATA.map((p) => GEO_SHORT(p[0])),
      "省/直辖市",
    ) + '<option value="x">其他地区(手动经纬度)</option>';
  $("#pcty").innerHTML = geoOpts([], "市");
  $("#pdis").innerHTML = geoOpts([], "区/县");
  $("#pprov").onchange = () => {
    const pi = $("#pprov").value;
    $("#llBox").hidden = pi !== "x";
    if (pi === "x") {
      $("#pcty").innerHTML = geoOpts([], "—");
      $("#pdis").innerHTML = geoOpts([], "—");
      const q = $("#geoQuick");
      if (q) q.value = "";
      return;
    }
    $("#pcty").innerHTML = geoOpts(pi === "" ? [] : geoCities(+pi).map((c) => c[0]), "市");
    $("#pdis").innerHTML = geoOpts([], "区/县");
    if (pi !== "" && geoCities(+pi).length === 1) {
      $("#pcty").value = "0";
      geoOnCity();
    }
  };
  $("#pcty").onchange = geoOnCity;
  $("#pdis").onchange = () => {
    const ai = $("#pdis").value;
    if (ai === "") return geoOnCity();
    const pi = +$("#pprov").value,
      ci = +$("#pcty").value,
      a = geoAreas(pi, ci)[+ai];
    if (a) {
      const q = $("#geoQuick");
      if (q) q.value = geoPlaceLabel({ pi, ci, ai: +ai });
      pplSetLL(a[1], a[2]);
    }
  };
  const q = $("#geoQuick");
  if (q) {
    q.oninput = () => geoSearchRender(q.value);
    q.onkeydown = (e) => {
      if (e.key === "Enter") {
        const b = $("#geoResults .geo-hit");
        if (b) {
          e.preventDefault();
          b.click();
        }
      } else if (e.key === "Escape") {
        const r = $("#geoResults");
        if (r) r.hidden = true;
      }
    };
    q.onfocus = () => {
      if (q.value) geoSearchRender(q.value);
    };
  }
}
function geoNearest(lo, la, max) {
  let b = null;
  GEO_DATA.forEach((p, pi) =>
    p[1].forEach((c, ci) => {
      const d = Math.hypot(c[1] - lo, c[2] - la);
      if (d < max && (!b || d < b.d)) b = { d, pi, ci, ai: -1 };
    }),
  );
  return b;
}
function pplCitySync() {
  if (!$("#pprov")) return;
  const lo = parseFloat($("#lon").value),
    la = parseFloat($("#lat").value);
  let f = geoFind(lo, la);
  if (!f) f = geoNearest(lo, la, 0.8);
  if (!f) {
    $("#pprov").value = "x";
    $("#llBox").hidden = false;
    $("#pcty").innerHTML = geoOpts([], "—");
    $("#pdis").innerHTML = geoOpts([], "—");
    const q = $("#geoQuick");
    if (q && document.activeElement !== q) q.value = "";
    return;
  }
  $("#llBox").hidden = true;
  $("#pprov").value = String(f.pi);
  $("#pcty").innerHTML = geoOpts(
    geoCities(f.pi).map((c) => c[0]),
    "市",
  );
  $("#pcty").value = String(f.ci);
  const ar = geoAreas(f.pi, f.ci);
  $("#pdis").innerHTML = geoOpts(
    ar.map((a) => a[0]),
    ar.length ? "区/县(可选)" : "—",
  );
  if (f.ai >= 0) $("#pdis").value = String(f.ai);
  const q = $("#geoQuick");
  if (q && document.activeElement !== q) q.value = geoPlaceLabel(f);
}
function pplIdentityChanged(p, f) {
  if (!p) return false;
  return ["name", "gender", "dt"].some((k) => String(p[k] || "") !== String(f[k] || ""));
}
function pplSameForm(p, f) {
  if (!p) return false;
  return (
    ["name", "tag", "gender", "dt", "lon", "lat", "fenye", "cal"].every(
      (k) => String(p[k] || "") === String(f[k] || ""),
    ) && !!p.solar === !!f.solar
  );
}
function pplApplyMeState(p, f) {
  if (!p) return;
  if (f.tag === "本人") {
    PPL.people.forEach((x) => {
      if (x.id !== p.id && x.tag === "本人") x.tag = "";
    });
    PPL.meId = p.id;
  } else if (PPL.meId === p.id) PPL.meId = null;
}
function pplState() {
  const el = $("#prState");
  if (!el) return;
  const p = pplById(PPL.cur),
    f = pplFormPerson(),
    save = $("#saveP"),
    upd = $("#updateP");
  if (save) {
    save.textContent = "新增入册";
    save.title = "始终新建独立人物ID，不覆盖已有档案";
  }
  if (!p) {
    el.textContent = "当前表单未绑定已保存人物 · 点“新增入册”会创建独立ID";
    el.className = "pr-state new";
    if (upd) upd.hidden = true;
    return;
  }
  const same = pplSameForm(p, f);
  if (same) {
    el.textContent = `当前载入 · ${p.name} · 已在人物关系册；“新增入册”会另建一份新ID`;
    el.className = "pr-state ok";
  } else {
    el.textContent = `当前表单已修改 · “新增入册”会创建新人物；只有“更新当前档案”才会覆盖「${p.name}」`;
    el.className = "pr-state dirty";
  }
  if (upd) {
    upd.hidden = false;
    upd.textContent = "更新当前档案";
    upd.title = "明确修改当前人物ID " + p.id;
  }
}
function pplBook() {
  const box = $("#prBook");
  if (!box) return;
  if (!PPL.people.length) {
    box.innerHTML =
      '<span class="dim sm">人物关系册为空。填写资料后点击红色“保存”即可建立第一份人物档案。</span>';
    return;
  }
  box.innerHTML =
    '<span class="pb-l">关系册快捷切换</span>' +
    PPL.people
      .map((p) => {
        const d = pplDerive(p);
        const dm = d ? GAN_WX[d.bz.dm] : null;
        return `<button type="button" class="pchip${p.id === PPL.cur ? " on" : ""}" data-id="${esc(p.id)}" title="${esc(p.name)} · ${esc(p.dt || "")}"><i class="pdot ${dm === null ? "" : "wx" + dm}"></i><b>${esc(p.name)}</b>${p.id === PPL.meId ? '<em class="me">我</em>' : p.tag ? `<small>${esc(p.tag)}</small>` : ""}</button>`;
      })
      .join("");
  $$("#prBook .pchip").forEach((b) => (b.onclick = () => pplOpen(b.dataset.id)));
}
function pplOpen(id) {
  const p = pplById(id);
  if (!p) return;
  PPL.cur = id;
  pplFill(p);
  setLive(false);
  const c = parseDt();
  if (c) deduce(c, "full");
  pplBook();
  pplState();
}
let _pa = null;
function pplAuto() {
  clearTimeout(_pa);
  _pa = setTimeout(() => {
    const c = parseDt();
    pplState();
    prQuickSync();
    if (!c) return;
    setLive(false);
    deduce(c, "full");
  }, 380);
}
function pplAfterChange() {
  pplBook();
  pplState();
  pplRefreshViews();
}
function pplRefreshViews() {
  try {
    if ($("#pane-net") && $("#pane-net").dataset.built) renderNet();
  } catch (e) {
    console.error(e);
  }
  try {
    dialPeopleRender();
  } catch (e) {
    console.error(e);
  }
}
function pplCalKind(k, silent) {
  PPL.calKind = k;
  $$("#calKind button").forEach((b) => b.classList.toggle("on", b.dataset.k === k));
  const L = $("#lunarIn"),
    S = $("#solarIn"),
    F = L && L.closest(".f-dt"),
    LINE = $("#v59PersonLine");
  if (L) L.hidden = k !== "L";
  if (S) S.hidden = k === "L";
  if (F) F.classList.toggle("is-lunar", k === "L");
  if (LINE) LINE.classList.toggle("v70-lunar-mode", k === "L");
  if (k === "L" && !silent) pplLunarFill();
}
function pplLunarFill() {
  const c = parseDt();
  if (!c || !$("#lnY")) return;
  const l = solar2lunar(c.y, c.m, c.d);
  $("#lnY").value = l.year;
  $("#lnM").value = l.month;
  $("#lnLeap").checked = l.isLeap;
  $("#lnD").value = l.day;
  $("#lnT").value = f2(c.h) + ":" + f2(c.mi);
  $("#lnMsg").textContent = `对应公历 ${c.y}年${c.m}月${c.d}日`;
}
function pplLunarApply() {
  const y = parseInt($("#lnY").value),
    m = parseInt($("#lnM").value),
    d = parseInt($("#lnD").value),
    lp = $("#lnLeap").checked;
  if (!(y >= 1901 && y <= 2099)) return;
  const s = calLunar2Solar(y, m, d, lp);
  if (!s) {
    $("#lnMsg").textContent = "该农历日期不存在(无此闰月或当月无该日)";
    return;
  }
  $("#lnMsg").textContent = `对应公历 ${s.y}年${s.m}月${s.d}日`;
  $("#dt").value = `${s.y}-${f2(s.m)}-${f2(s.d)}T${$("#lnT").value || "12:00"}`;
  pplAuto();
}
function personaHTML() {
  return `<div class="persona-body" id="personaFold"><div class="pr-head"><h2 class="sec">人物 · 起局</h2><span class="pr-hint">这里负责起局与编辑当前表单；“新增入册”永远创建独立人物ID，不覆盖旧人物。多人档案与关系请到“人物关系册”统一管理</span></div>
  <div class="pr-grid">
   <label class="f-name">姓名<input type="text" id="pname" placeholder="如:甲 / 张三" maxlength="12" autocomplete="off"></label>
   <label class="f-tag">身份<select id="ptag"><option value="">—</option>${PPL_TAGS.map((t) => `<option>${t}</option>`).join("")}</select></label>
   <label class="f-gender">性别(定大运顺逆)<select id="gender"><option value="1">乾造(男)</option><option value="0">坤造(女)</option></select></label>
   <div class="f-dt"><span class="lbl">出生日期时间<span class="seg" id="calKind"><button type="button" data-k="S" class="on">公历</button><button type="button" data-k="L">农历</button></span></span>
     <div id="solarIn"><input type="datetime-local" id="dt" min="1901-01-01T00:00" max="2099-12-31T23:59"></div>
     <div id="lunarIn" class="lunar lunar-grid" hidden>
       <label class="ln-field ln-year"><span>农历年</span><span class="ln-control"><input type="number" id="lnY" min="1901" max="2099" aria-label="农历年"><i>年</i></span></label>
       <label class="ln-field"><span>月份</span><select id="lnM" aria-label="农历月">${CAL_LMON.map((n, i) => `<option value="${i + 1}">${n}月</option>`).join("")}</select></label>
       <label class="ln-field ln-leap"><span>闰月</span><span class="ln-check"><input type="checkbox" id="lnLeap"><b>本月为闰月</b></span></label>
       <label class="ln-field"><span>日期</span><select id="lnD" aria-label="农历日">${CAL_LDAY.map((n, i) => `<option value="${i + 1}">${n}</option>`).join("")}</select></label>
       <label class="ln-field"><span>出生时刻</span><input type="time" id="lnT" value="12:00" aria-label="出生时刻"></label>
       <span id="lnMsg" class="ln-msg dim sm"></span>
     </div></div>
   <div class="f-city birthplace-card"><div class="birthplace-head"><b>出生地 · 古州分野</b><small>地点决定经纬度；古州分野为地方志参照，不按现代行政区自动换算</small></div>
    <div class="geo-pickrow"><div class="geo-quick"><input type="search" id="geoQuick" placeholder="快速搜索省 / 市 / 区县，如：漳州 龙海" autocomplete="off" aria-label="快速搜索出生地"><div class="geo-results" id="geoResults" hidden></div></div>
     <div class="geo"><select id="pprov" aria-label="省份"></select><select id="pcty" aria-label="城市"></select><select id="pdis" aria-label="区县"></select></div></div>
    <div class="birthplace-meta"><label class="f-fenye"><span class="lbl">古州分野参照（可选）</span><select id="pfenye" aria-label="古州分野"></select><small class="fenye-note" id="pfenyeTxt"></small></label>
     <p class="birthplace-note">默认使用内置地点的近似经纬度；只选到市时取市级坐标。区县坐标可能有少量偏差。境外或需要更精确的位置，请在省份中选择“其他地区”，再手动输入经纬度。</p>
     <div class="llbox" id="llBox" hidden><label>经度(°E)<input type="number" id="lon" value="117.8" step="0.1" min="-180" max="180"></label><label>纬度(°N)<input type="number" id="lat" value="24.5" step="0.1" min="-60" max="66"></label></div></div>
   </div>
   <div class="pr-subrow"><label class="chk"><input type="checkbox" id="solarChk"> 真太阳时校正</label></div>
  </div>
  <div class="pr-act"><span class="pr-state new" id="prState">新人物 · 尚未保存</span><span class="sp"></span>
   <span class="btns"><span class="pr-quick" id="prQuick" hidden><span class="pr-quick-title"><b>快捷命盘</b><small>信息已完整</small></span><span class="pr-quick-btns"><button type="button" class="pr-quick-btn" id="quickBazi">八字</button><button type="button" class="pr-quick-btn" id="quickZiwei">紫微斗数</button><button type="button" class="pr-quick-btn" id="quickPeople">人物关系册</button></span><span class="pr-quick-divider" aria-hidden="true"></span></span><button class="primary" id="saveP">新增入册</button><button id="updateP" hidden title="仅在需要明确覆盖当前档案时使用">更新当前档案</button><button id="newP">新建人物</button><button id="delP">删除</button><button id="goBtn">重新推演</button><button id="nowBtn">此刻</button></span></div>
  <div class="pr-book" id="prBook" aria-label="人物册"></div></div>
  <button type="button" class="pr-toggle" id="personaTassel" aria-controls="personaFold" aria-expanded="true" title="收起个人信息">
    <span class="pr-toggle-icon" id="personaTasselIcon" aria-hidden="true">↑</span>
    <span class="pr-toggle-text" id="personaTasselText">收起面板</span>
  </button>`;
}
function bindPersonaFold() {
  const panel = $("#persona"),
    fold = $("#personaFold"),
    btn = $("#personaTassel"),
    icon = $("#personaTasselIcon"),
    label = $("#personaTasselText");
  if (!panel || !fold || !btn || !icon || !label) return;
  panel.classList.remove("is-collapsed");
  panel.classList.add("opening");
  setTimeout(() => panel.classList.remove("opening"), 760);
  const syncState = () => {
    const collapsed = panel.classList.contains("is-collapsed");
    btn.setAttribute("aria-expanded", String(!collapsed));
    btn.setAttribute("title", collapsed ? "展开个人信息" : "收起个人信息");
    icon.textContent = collapsed ? "↓" : "↑";
    label.textContent = collapsed ? "展开面板" : "收起面板";
  };
  btn.onclick = () => {
    panel.classList.add("pulling");
    setTimeout(() => panel.classList.remove("pulling"), 240);
    panel.classList.toggle("is-collapsed");
    syncState();
  };
  syncState();
}
function prQuickSync() {
  const box = $("#prQuick");
  if (!box) return;
  const ok = !!(($("#pname")?.value || "").trim() && parseDt());
  box.hidden = !ok;
}
function prQuickOpen(tab) {
  const c = parseDt();
  if (!c) {
    toast("请先填写有效的出生日期时间");
    return;
  }
  if (!($("#pname")?.value || "").trim()) {
    toast("请先填写姓名，完成个人信息");
    return;
  }
  setLive(false);
  Promise.resolve(deduce(c, "full")).finally(() => {
    selectTab(tab, false);
    setTimeout(() => {
      const pane = $("#pane-" + tab);
      if (pane) pane.scrollIntoView({ behavior: REDUCE ? "auto" : "smooth", block: "start" });
    }, 90);
  });
}
function bindProfiles() {
  bindPersonaFold();
  pplLoad();
  try {
    pplRepairData(true);
  } catch (e) {
    console.error("[人物主库启动修复]", e);
  }
  $("#pname").addEventListener("input", () => {
    pplState();
    prQuickSync();
  });
  $("#ptag").addEventListener("change", pplState);
  ["#dt", "#gender", "#lon", "#lat", "#solarChk"].forEach((s) => {
    const el = $(s);
    el.addEventListener("input", pplAuto);
    el.addEventListener("change", pplAuto);
  });
  ["#lon", "#lat"].forEach((s) => $(s).addEventListener("input", pplCitySync));
  geoInit();
  pplCitySync();
  try {
    gfBind();
  } catch (e) {
    console.error(e);
  }
  const qb = $("#quickBazi"),
    qz = $("#quickZiwei"),
    qp = $("#quickPeople");
  if (qb) qb.onclick = () => prQuickOpen("bazi");
  if (qz) qz.onclick = () => prQuickOpen("ziwei");
  if (qp)
    qp.onclick = () => {
      try {
        selectTab("people", true);
        setTimeout(() => {
          const pane = $("#pane-people");
          if (pane) pane.scrollIntoView({ behavior: REDUCE ? "auto" : "smooth", block: "start" });
        }, 80);
      } catch (e) {
        console.error("[首页人物关系册快捷入口]", e);
      }
    };
  prQuickSync();
  $$("#calKind button").forEach((b) => (b.onclick = () => pplCalKind(b.dataset.k)));
  ["#lnY", "#lnM", "#lnLeap", "#lnD", "#lnT"].forEach((s) => {
    $(s).addEventListener("change", pplLunarApply);
    $(s).addEventListener("input", () => {
      if (s === "#lnY" || s === "#lnT") pplLunarApply();
    });
  });
  $("#dt").addEventListener("change", () => {
    if (PPL.calKind === "L") pplLunarFill();
  });
  $("#saveP").onclick = () => {
    if (!parseDt()) {
      toast("请先填写有效的出生日期时间");
      return;
    }
    const f = pplFormPerson();
    if (!f.name) f.name = "人物" + (PPL.people.length + 1);
    const now = Date.now(),
      p = Object.assign({ id: pplId(), createdAt: now, updatedAt: now, source: "persona" }, f);
    PPL.people.push(p);
    PPL.cur = p.id;
    pplApplyMeState(p, f);
    if (!pplSave()) return false;
    pplAfterChange();
    try {
      window.dispatchEvent(
        new CustomEvent("tianjipan:peoplechange", { detail: { type: "person:add", id: p.id } }),
      );
    } catch (_) {}
    toast(`已新增入人物关系册：${f.name}（独立ID，不覆盖任何旧档案）`);
  };
  let updArm = null;
  const updP = $("#updateP");
  if (updP)
    updP.onclick = () => {
      const p = pplById(PPL.cur);
      if (!p) {
        toast("当前没有可更新的已保存人物");
        return;
      }
      if (!parseDt()) {
        toast("请先填写有效的出生日期时间");
        return;
      }
      const f = pplFormPerson();
      if (!f.name) f.name = p.name || "人物" + (PPL.people.length + 1);
      if (updArm === null) {
        updP.textContent = "再点确认覆盖";
        updArm = setTimeout(() => {
          updArm = null;
          updP.textContent = "更新当前档案";
        }, 3000);
        return;
      }
      clearTimeout(updArm);
      updArm = null;
      updP.textContent = "更新当前档案";
      const oldName = p.name;
      Object.assign(p, f, { updatedAt: Date.now() });
      pplApplyMeState(p, f);
      if (!pplSave()) return false;
      pplAfterChange();
      try {
        window.dispatchEvent(
          new CustomEvent("tianjipan:peoplechange", {
            detail: { type: "person:update", id: p.id },
          }),
        );
      } catch (_) {}
      toast(`已更新当前档案:${oldName} → ${f.name}`);
    };
  $("#newP").onclick = () => {
    PPL.cur = null;
    $("#pname").value = "";
    $("#ptag").value = "";
    $("#dt").value = "";
    if (PPL.calKind === "L") {
      $("#lnMsg").textContent = "";
    }
    pplBook();
    pplState();
    prQuickSync();
    $("#pname").focus();
    toast("已清空当前表单。填写后点“新增入册”会创建新的独立人物");
  };
  let delArm = null;
  $("#delP").onclick = () => {
    const p = pplById(PPL.cur);
    if (!p) {
      toast("当前是未保存的新人物");
      return;
    }
    if (delArm === null) {
      $("#delP").textContent = "再点确认删除";
      delArm = setTimeout(() => {
        delArm = null;
        $("#delP").textContent = "删除";
      }, 3000);
      return;
    }
    clearTimeout(delArm);
    delArm = null;
    $("#delP").textContent = "删除";
    PPL.people = PPL.people.filter((x) => x.id !== p.id);
    PPL.rels = PPL.rels.filter((r) => r.a !== p.id && r.b !== p.id);
    delete PPL.pos[p.id];
    if (PPL.meId === p.id) PPL.meId = null;
    PPL.cur = null;
    if (!pplSave()) return false;
    pplAfterChange();
    toast("已删除:" + p.name);
  };
  pplBook();
  pplState();
}
/* ---- 关系网 ---- */
const NET_PAIR = {};
function netPair(a, b) {
  const k = [
    a.id,
    a.dt,
    a.gender,
    a.lon,
    a.lat,
    a.solar,
    b.id,
    b.dt,
    b.gender,
    b.lon,
    b.lat,
    b.solar,
  ].join("|");
  return NET_PAIR[k] || (NET_PAIR[k] = pplPair(a, b));
}
function netData() {
  const P = [],
    invalid = [];
  (Array.isArray(PPL.people) ? PPL.people : []).forEach((p) => {
    try {
      const e = pplEng(p);
      if (e) P.push(e);
      else invalid.push(p);
    } catch (err) {
      console.warn("[关系图人物跳过]", p && p.id, err);
      invalid.push(p);
    }
  });
  const byId = Object.fromEntries(P.map((p) => [p.id, p]));
  const rels = (Array.isArray(PPL.rels) ? PPL.rels : []).filter(
    (r) => r && byId[r.a] && byId[r.b] && r.a !== r.b && PPL_ROLE[r.role],
  );
  return { P, byId, rels, invalid };
}
const netRadius = 34,
  netClamp = (v) => Math.max(0.04, Math.min(0.96, v));
function netPos(lay, id) {
  const q = PPL.pos[id];
  return q ? { x: q.x * lay.W, y: q.y * lay.H } : lay.pos[id];
}
function netInner(D, lay) {
  const { P, byId, rels } = D,
    pts = {};
  P.forEach((p) => (pts[p.id] = netPos(lay, p.id)));
  const grp = {};
  rels.forEach((r) => {
    const k = [r.a, r.b].sort().join("|");
    (grp[k] = grp[k] || []).push(r);
  });
  let s =
    "<defs>" +
    ["good", "bad", "mid"]
      .map(
        (c) =>
          `<marker id="ar-${c}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10Z" class="mk-${c}"/></marker>`,
      )
      .join("") +
    ["wxs", "wxk"]
      .map(
        (c) =>
          `<marker id="ar-${c}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0L10 5L0 10Z" class="mk-${c}"/></marker>`,
      )
      .join("") +
    "</defs>";
  const geom = (a, b, curv) => {
    const A = pts[a],
      B = pts[b],
      dx = B.x - A.x,
      dy = B.y - A.y,
      L = Math.hypot(dx, dy) || 1,
      ux = dx / L,
      uy = dy / L,
      nx = -uy,
      ny = ux;
    const sx = A.x + ux * netRadius,
      sy = A.y + uy * netRadius,
      ex = B.x - ux * (netRadius + 4),
      ey = B.y - uy * (netRadius + 4),
      mx = (sx + ex) / 2 + nx * curv,
      my = (sy + ey) / 2 + ny * curv;
    return {
      d: `M${sx.toFixed(1)} ${sy.toFixed(1)}Q${mx.toFixed(1)} ${my.toFixed(1)} ${ex.toFixed(1)} ${ey.toFixed(1)}`,
      lx: 0.25 * sx + 0.5 * mx + 0.25 * ex,
      ly: 0.25 * sy + 0.5 * my + 0.25 * ey,
    };
  };
  // 生克箭头(底层)
  if (NET.gs) {
    const pairSet = new Set();
    if (NET.all) {
      for (let i = 0; i < P.length; i++)
        for (let j = i + 1; j < P.length; j++) pairSet.add(P[i].id + "|" + P[j].id);
    } else rels.forEach((r) => pairSet.add([r.a, r.b].sort().join("|")));
    pairSet.forEach((k) => {
      const [a, b] = k.split("|"),
        A = byId[a],
        B = byId[b];
      if (!A || !B) return;
      const w = pplWx(GAN_WX[A.bz.dm], GAN_WX[B.bz.dm]);
      const cv = -34;
      if (w.rel === "同") {
        const g = geom(a, b, cv);
        s += `<path d="${g.d}" class="wxg same"/>`;
        return;
      }
      const from = w.dir === 1 ? a : b,
        to = w.dir === 1 ? b : a,
        g = geom(from, to, w.dir === 1 ? cv : -cv);
      s += `<path d="${g.d}" class="wxg ${w.rel === "生" ? "sheng" : "ke"}" marker-end="url(#ar-${w.rel === "生" ? "wxs" : "wxk"})"/>`;
    });
  }
  // 关系线
  rels.forEach((r) => {
    const A = byId[r.a],
      B = byId[r.b],
      k = [r.a, r.b].sort().join("|"),
      list = grp[k],
      i = list.indexOf(r),
      n = list.length;
    const curv = n === 1 ? 0 : (i - (n - 1) / 2) * 46,
      g = geom(r.a, r.b, curv * (r.a < r.b ? 1 : -1)),
      pr = netPair(A, B),
      role = PPL_ROLE[r.role],
      kind = role.kind;
    const label = pplRelLabel(r, A, B),
      tag = NET.tags && pr.tags.length ? [...new Set(pr.tags)].join(" ") : "",
      w = Math.max(34, label.length * 14 + 14);
    const sel = NET.sel && NET.sel.t === "e" && NET.sel.id === r.id;
    s += `<g class="ed ${pr.cls} ${kind}${sel ? " sel" : ""}" data-rid="${esc(r.id)}"><path d="${g.d}" class="hit"/><path d="${g.d}" class="ln"${role.dir ? ` marker-end="url(#ar-${pr.cls})"` : ""}/>
      <g transform="translate(${g.lx.toFixed(1)} ${g.ly.toFixed(1)})"><rect x="${-w / 2}" y="-11" width="${w}" height="${tag ? 30 : 22}" rx="11" class="lb"/><text y="4" text-anchor="middle" class="lt">${esc(label)}</text>${tag ? `<text y="20" text-anchor="middle" class="lg">${esc(tag)}</text>` : ""}</g></g>`;
  });
  // 节点
  P.forEach((p) => {
    const q = pts[p.id],
      e = GAN_WX[p.bz.dm],
      sel = NET.sel && NET.sel.t === "p" && NET.sel.id === p.id,
      gz = GAN[p.bz.pill[2].s] + ZHI[p.bz.pill[2].b],
      nm = p.name.length > 6 ? p.name.slice(0, 6) + "…" : p.name;
    s += `<g class="nd wx${e}${sel ? " sel" : ""}" data-id="${esc(p.id)}" transform="translate(${q.x.toFixed(1)} ${q.y.toFixed(1)})" tabindex="0" role="button" aria-label="${esc(p.name)}"><circle r="${netRadius + 5}" class="halo"/><circle r="${netRadius}" class="disc"/><text class="st" y="9" text-anchor="middle">${GAN[p.bz.dm]}</text>${p.id === PPL.meId ? '<g transform="translate(24 -26)"><rect x="-10" y="-10" width="20" height="20" rx="3" class="sealr"/><text y="5" text-anchor="middle" class="sealt">我</text></g>' : ""}
      <text y="${netRadius + 19}" text-anchor="middle" class="nm">${esc(nm)}</text><text y="${netRadius + 35}" text-anchor="middle" class="sb">${gz} · ${ZODIAC12[p.bz.pill[0].b]}${p.tag && p.id !== PPL.meId ? " · " + esc(p.tag) : ""}</text></g>`;
  });
  return s;
}
function netLayoutNow(D) {
  return pplLayout(D.P, D.rels, NET.layout);
}
/* ---- 详情 ---- */
const wxChip = (e) => `<span class="pill wxp wx${e}">${WXN[e]}</span>`;
function netPersonHTML(p, D) {
  const dp = pplDerive(p),
    R0 = dp.R,
    d = dp.deep,
    sh = pplShare(d),
    xy = d.xy;
  const rels =
    D.rels
      .filter((r) => r.a === p.id || r.b === p.id)
      .map((r) => {
        const o = D.byId[r.a === p.id ? r.b : r.a],
          pr = netPair(D.byId[r.a], D.byId[r.b]),
          meIsA = r.a === p.id;
        return `<button type="button" class="relrow ${pr.cls}" data-rid="${esc(r.id)}"><b>${esc(o.name)}</b> <span>${esc(pplRelLabel(r, D.byId[r.a], D.byId[r.b]))}${PPL_ROLE[r.role].dir ? (meIsA ? "(尊/长→)" : "(←尊/长)") : ""}</span> <em>${pr.verdict}</em></button>`;
      })
      .join("") || '<span class="dim sm">尚未建立关系。</span>';
  return `<div class="nd-h"><b class="nm2">${esc(p.name)}</b><span class="dim">${p.tag ? esc(p.tag) + " · " : ""}${p.gender === "1" ? "男" : "女"} · ${esc((p.dt || "").replace("T", " "))}</span></div>
   <div class="gzrow">${p.bz.pill.map((x, i) => `<div class="gzc"><small>${["年", "月", "日", "时"][i]}</small><b class="wx${GAN_WX[x.s]}">${GAN[x.s]}</b><b class="wx${ZHI_WX[x.b]}">${ZHI[x.b]}</b></div>`).join("")}</div>
   <div class="kv"><span>日主 <b class="wx${GAN_WX[p.bz.dm]}">${GAN[p.bz.dm]}${WXN[GAN_WX[p.bz.dm]]}</b></span><span>旺衰 <b>${d.st.level}</b></span><span>格局 <b>${d.gj.name}</b></span><span>生肖 <b>${ZODIAC12[p.bz.pill[0].b]}</b></span></div>
   <div class="kv"><span>喜用 ${xy.favor.map(wxChip).join("")}</span><span>忌 ${xy.avoid.map(wxChip).join("") || '<span class="dim">—</span>'}</span></div>
   <div class="wxbar" title="五行分布(按藏干权重)">${sh.map((v, e) => `<i class="wx${e}" style="flex:${Math.max(v, 0.001)}" title="${WXN[e]} ${(v * 100).toFixed(0)}%"><span>${v >= 0.1 ? WXN[e] : ""}</span></i>`).join("")}</div>
   <h4 class="gl">与他人的关系</h4><div class="relrows">${rels}</div>
   <div class="row3" style="margin-top:8px"><button class="gbtn sm" data-act="open" data-id="${esc(p.id)}">载入到首页命盘</button>${p.id === PPL.meId ? "" : `<button class="gbtn sm" data-act="me" data-id="${esc(p.id)}">设为“本人”</button>`}</div>`;
}
function netEdgeHTML(r, D) {
  const A = D.byId[r.a],
    B = D.byId[r.b],
    pr = netPair(A, B),
    label = pplRelLabel(r, A, B),
    role = PPL_ROLE[r.role];
  return `<div class="nd-h"><b class="nm2">${esc(A.name)} ${role.dir ? "→" : "⇄"} ${esc(B.name)}</b><span class="dim">${esc(label)}${r.note && r.role !== "other" ? " · " + esc(r.note) : ""}</span></div>
   <div class="pills" style="margin:6px 0"><span class="pill tierp ${pr.cls === "good" ? "t4" : pr.cls === "bad" ? "t0" : "t2"}">${pr.verdict}</span><span class="pill">综合倾向分 ${pr.T > 0 ? "+" : ""}${pr.T.toFixed(1)}</span>${pr.tags.length ? `<span class="pill">${[...new Set(pr.tags)].join("、")}</span>` : ""}</div>
   <div class="sup"><div><small>${esc(B.name)} → ${esc(A.name)} 扶持</small><div class="barx"><i style="width:${pr.sAB.score}%"></i></div><b>${pr.sAB.score}</b> ${pr.sAB.label}</div><div><small>${esc(A.name)} → ${esc(B.name)} 扶持</small><div class="barx"><i style="width:${pr.sBA.score}%"></i></div><b>${pr.sBA.score}</b> ${pr.sBA.label}</div></div>
   <ul class="cul pl">${pr.lines.map((l) => `<li class="${l.tone > 0.4 ? "good" : l.tone < -0.4 ? "bad" : ""}"><b>${l.k}</b> ${esc(l.t).replace(/\n/g, "<br>")}</li>`).join("")}</ul>
   <p class="note">以上是按八字常用口径做的机械加减与文字提示,描述的是“倾向”:关系的好坏取决于两个人如何相处,不是命盘能决定的。</p>
   ${r.hm ? `<p class="rt"><b>合盘结果</b>:${r.hm.mode === "marry" ? "合婚" : HH_KIND[r.hm.mode].n}契合度 ${esc(r.hm.pct)}(高于约 ${esc(r.hm.pct)}% 的随机配对,${esc(r.hm.lv)}),保存于 ${new Date(r.hm.t).toLocaleDateString()}</p>` : ""}
   <div class="row3"><button class="gbtn sm" data-act="hepan" data-rid="${esc(r.id)}">${["spouse", "lover"].includes(r.role) ? "合婚 / 合盘" : "合盘"}</button><button class="gbtn sm" data-act="swap" data-rid="${esc(r.id)}">互换双方</button><button class="gbtn sm" data-act="delrel" data-rid="${esc(r.id)}">删除这条关系</button></div>`;
}
function netDetailHTML(D) {
  const s = NET.sel;
  if (!s)
    return `<div class="dim sm" style="padding:10px 0">点击人物查看命局与关系,点击连线查看两人之间的生克与扶持。拖动人物可调整位置。</div>`;
  if (s.t === "p") {
    const p = D.byId[s.id];
    return p ? netPersonHTML(p, D) : "";
  }
  const r = D.rels.find((x) => x.id === s.id);
  return r ? netEdgeHTML(r, D) : "";
}
/* ---- 家庭整体 ---- */
function netFamilyHTML(D) {
  const P = D.P;
  if (P.length < 2) return '<div class="dim sm">至少需要两位人物,才能看整体的五行与扶持。</div>';
  const F = pplFamily(P),
    n = P.length,
    nm = (i) => esc(P[i].name);
  const top = F.top[0],
    low = F.top[4],
    needTop = F.need.map((c, e) => [c, e]).sort((a, b) => b[0] - a[0])[0];
  const holders = (e) =>
    P.map((p, i) => [pplShare(p.deep)[e], i])
      .filter((x) => x[0] >= 0.22)
      .sort((a, b) => b[0] - a[0])
      .map((x) => nm(x[1]));
  const bar = `<div class="wxbar big">${F.tot.map((v, e) => `<i class="wx${e}" style="flex:${Math.max(v, 0.001)}"><span>${WXN[e]} ${(v * 100).toFixed(0)}%</span></i>`).join("")}</div>`;
  const cellCls = (s) => (s >= 65 ? "c4" : s >= 55 ? "c3" : s >= 45 ? "c2" : s >= 35 ? "c1" : "c0");
  const matrix =
    n <= 10
      ? `<div class="tbl-wrap"><table class="tbl sm mtx"><thead><tr><th>受助者 ↓ / 扶持者 →</th>${P.map((p, j) => `<th>${nm(j)}</th>`).join("")}<th>最得力的扶持</th></tr></thead><tbody>${P.map((p, i) => `<tr><th>${nm(i)}</th>${P.map((q, j) => (i === j ? '<td class="self">—</td>' : `<td class="${cellCls(F.S[i][j].score)}" title="${esc(F.S[i][j].label)}">${F.S[i][j].score}</td>`)).join("")}<td>${F.supporters[i] ? `${nm(F.supporters[i].j)}<small class="dim"> ${F.supporters[i].s.score}</small>` : "—"}</td></tr>`).join("")}</tbody></table></div><p class="note">数字是“扶持分”(0–100):列中的人,其五行分布与日主五行,对行中那位的喜用神的匹配程度。≥65 助益明显,≤35 易被消耗。</p>`
      : '<p class="note">人物较多,已省略矩阵;请点击单条关系查看。</p>';
  const gv = F.givers.map((v, j) => [v, j]).sort((a, b) => b[0] - a[0]);
  const sent = [
    `全体五行以<b class="wx${top[1]}">${WXN[top[1]]}</b>最旺(${(top[0] * 100).toFixed(0)}%)、<b class="wx${low[1]}">${WXN[low[1]]}</b>最弱(${(low[0] * 100).toFixed(0)}%)。`,
    needTop[0] > 0
      ? `成员中有 ${needTop[0]} 人把<b class="wx${needTop[1]}">${WXN[needTop[1]]}</b>当作喜用${holders(needTop[1]).length ? `;五行里${WXN[needTop[1]]}较足的是 ${holders(needTop[1]).join("、")},可多在这方面支持大家` : ";家中这一行较弱,可从环境、职业、颜色与方位上补足"}。`
      : "",
    gv[0][0] > 0
      ? `整体上最能扶持他人的是 ${nm(gv[0][1])}(对其他人的扶持分合计 ${gv[0][0] > 0 ? "+" : ""}${gv[0][0]})` +
        (gv[n - 1][0] < 0 ? `;相对更容易被消耗的是 ${nm(gv[n - 1][1])}。` : "。")
      : "",
    F.tension.length
      ? `需要留意的关系:${F.tension
          .slice(0, 3)
          .map((x) => `${nm(x.i)}—${nm(x.j)}(${x.r.verdict})`)
          .join("、")}。`
      : "两两之间没有冲克特别重的组合。",
    F.harmony.length
      ? `相合相扶较多的组合:${F.harmony
          .slice(0, 3)
          .map((x) => `${nm(x.i)}—${nm(x.j)}`)
          .join("、")}。`
      : "",
  ].filter(Boolean);
  return `<div class="fam"><h4 class="gl">整体五行</h4>${bar}<p class="rt">${sent.join("")}</p><h4 class="gl">扶持矩阵</h4>${matrix}
   ${
     F.tension.length
       ? `<h4 class="gl">需要磨合</h4><div class="relrows">${F.tension
           .slice(0, 6)
           .map(
             (x) =>
               `<span class="relrow bad" >${nm(x.i)} × ${nm(x.j)} <em>${x.r.verdict}</em> <small>${esc(
                 x.r.lines
                   .filter((l) => l.tone < -0.4)
                   .map((l) => l.k)
                   .join("、"),
               )}</small></span>`,
           )
           .join("")}</div>`
       : ""
   }
   <p class="note">这是对已保存人物两两比较的汇总,不限于你建立过关系的人。整体五行是各人藏干权重的平均;扶持分按对方五行能否补到你的喜用神来算,属倾向,请结合实际相处。</p></div>`;
}
/* ---- 关系编辑与人物管理 ---- */
function netManageHTML(D) {
  const opt = PPL.people
    .map((p) => `<option value="${esc(p.id)}">${esc(p.name)}</option>`)
    .join("");
  const rows =
    PPL.rels
      .map((r) => {
        const A = pplById(r.a),
          B = pplById(r.b);
        if (!A || !B) return "";
        const role = PPL_ROLE[r.role];
        return `<li><b>${esc(A.name)}</b> 是 <b>${esc(B.name)}</b> 的 <em>${role.n}</em>${r.note ? ` <small>(${esc(r.note)})</small>` : ""} <button class="lnk2" data-act="selrel" data-rid="${esc(r.id)}">查看</button> <button class="lnk2" data-act="swap" data-rid="${esc(r.id)}">互换</button> <button class="lnk" data-act="delrel" data-rid="${esc(r.id)}">删除</button></li>`;
      })
      .join("") || '<li class="dim">还没有关系。</li>';
  const ppl = PPL.people
    .map((p) => {
      const d = pplDerive(p);
      return `<tr><td><b>${esc(p.name)}</b>${p.id === PPL.meId ? ' <em class="me">我</em>' : ""}<small class="dim"> ${esc(p.tag || "")}</small></td><td>${d ? d.bz.pill.map((x) => GAN[x.s] + ZHI[x.b]).join(" ") : '<span class="bad">日期无效</span>'}</td><td><button class="lnk2" data-act="open" data-id="${esc(p.id)}">载入</button> <button class="lnk2" data-act="me" data-id="${esc(p.id)}">设为本人</button> <button class="lnk" data-act="delp" data-id="${esc(p.id)}">删除</button></td></tr>`;
    })
    .join("");
  return `<div class="panel blk"><h3 class="sec">建立关系</h3>
   ${PPL.people.length >= 2 ? `<div class="rel-form"><select id="rfA" aria-label="甲">${opt}</select><span>是</span><select id="rfB" aria-label="乙">${opt}</select><span>的</span><select id="rfRole" aria-label="关系">${PPL_ROLES.map((r) => `<option value="${r.k}">${r.n}</option>`).join("")}</select><input type="text" id="rfNote" placeholder="备注或自定义称谓(选“其他”时作为连线名称)" maxlength="10"><button class="gbtn" id="rfAdd">添加关系</button></div>` : '<p class="dim">至少需要两位独立人物。请先从首页保存人物档案，或进入“人物关系册”录入人物。</p>'}
   <ul class="cul rels">${rows}</ul></div>
  <div class="panel blk"><h3 class="sec">人物关系册 · 快捷管理</h3><div class="tbl-wrap"><table class="tbl sm"><thead><tr><th>人物</th><th>日柱 · 四柱</th><th></th></tr></thead><tbody>${ppl || '<tr><td colspan="3" class="dim">暂无人物。</td></tr>'}</tbody></table></div>
   <div class="row3" style="margin-top:8px"><button class="gbtn sm" id="pplExp">导出人物册(.json)</button><button class="gbtn sm" id="pplImpB">导入(合并)</button><input type="file" id="pplImp" accept=".json,application/json" hidden><span class="dim sm">数据只存在本机浏览器里;换设备或清缓存前,请先导出备份。</span></div></div>`;
}
function renderNet() {
  const pane = $("#pane-net");
  if (!pane) return;
  pane.dataset.built = "1";
  const D = netData();
  if (!D.P.length) {
    pane.innerHTML = `<div class="panel blk"><h3 class="sec">关系图</h3><p class="rt">把家人、伴侣、朋友的出生信息存进人物关系册,再在这里为他们建立关系(父母、夫妻、兄弟、朋友、同事…),就会形成一张关系网:可以看到每两个人之间的五行生克、十神、日支合冲,以及谁的五行能补益谁的喜用神;全家人还有整体的五行与扶持汇总。同一张网也会出现在圆盘的“人物”图层里。</p><div class="row3"><button class="gbtn" id="netGoHome">去首页填写第一位人物</button></div></div>${netManageHTML(D)}`;
    const g = $("#netGoHome");
    if (g)
      g.onclick = () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
        setTimeout(() => {
          const n = $("#pname");
          if (n) n.focus();
        }, 500);
      };
    netBindManage();
    return;
  }
  if (
    NET.sel &&
    ((NET.sel.t === "p" && !D.byId[NET.sel.id]) ||
      (NET.sel.t === "e" && !D.rels.some((r) => r.id === NET.sel.id)))
  )
    NET.sel = null;
  const lay = netLayoutNow(D);
  pane.innerHTML = `<div class="panel blk netpanel"><h3 class="sec">关系图 · ${D.P.length} 人 ${D.rels.length} 条关系</h3>
   <div class="net-tools"><label class="sm dim">布局<select id="netLay"><option value="tree"${NET.layout === "tree" ? " selected" : ""}>家谱分层</option><option value="circle"${NET.layout === "circle" ? " selected" : ""}>环形</option></select></label>
    <label class="chk sm"><input type="checkbox" id="netGs"${NET.gs ? " checked" : ""}> 五行生克箭头</label><label class="chk sm"><input type="checkbox" id="netTags"${NET.tags ? " checked" : ""}> 合冲标记</label><label class="chk sm"><input type="checkbox" id="netAll"${NET.all ? " checked" : ""}${NET.gs ? "" : " disabled"}> 显示所有人两两生克</label><button class="gbtn sm" id="netReset">重置位置</button></div>
   <div class="net-wrap"><svg id="netSvg" class="netsvg" viewBox="0 0 ${lay.W} ${lay.H}" role="group" aria-label="人物关系网">${netInner(D, lay)}</svg>
    <div class="net-legend"><span><i class="lg good"></i>相合相扶</span><span><i class="lg mid"></i>平和</span><span><i class="lg bad"></i>有摩擦</span><span><i class="lg kin"></i>实线亲属</span><span><i class="lg soc"></i>虚线社会关系</span>${NET.gs ? '<span><i class="lg sheng"></i>生 →</span><span><i class="lg ke"></i>克 →</span>' : ""}</div></div>
   <div class="net-detail" id="netDetail">${netDetailHTML(D)}</div></div>
   <div class="panel blk"><h3 class="sec">家庭整体 · 五行与扶持</h3>${netFamilyHTML(D)}</div>${netManageHTML(D)}`;
  netBindAll(D, lay);
}
function netSvgPt(svg, e) {
  const pt = svg.createSVGPoint();
  pt.x = e.clientX;
  pt.y = e.clientY;
  const m = svg.getScreenCTM();
  return m ? pt.matrixTransform(m.inverse()) : { x: 0, y: 0 };
}
function netRedraw(D, lay) {
  const svg = $("#netSvg");
  if (!svg) return;
  svg.innerHTML = netInner(D, lay);
}
function netSelect(sel) {
  NET.sel = sel;
  const D = netData(),
    lay = netLayoutNow(D);
  netRedraw(D, lay);
  const d = $("#netDetail");
  if (d) {
    d.innerHTML = netDetailHTML(D);
    netBindDetail(D);
  }
}
function netBindDetail(D) {
  $$("#netDetail .relrow[data-rid]").forEach(
    (b) => (b.onclick = () => netSelect({ t: "e", id: b.dataset.rid })),
  );
  netBindActs($("#netDetail"));
}
function netBindActs(root) {
  if (!root) return;
  root.querySelectorAll("[data-act]").forEach(
    (b) =>
      (b.onclick = () => {
        const a = b.dataset.act,
          id = b.dataset.id,
          rid = b.dataset.rid;
        if (a === "open") {
          pplOpen(id);
          window.scrollTo({ top: 0, behavior: "smooth" });
        } else if (a === "me") {
          const p = pplById(id);
          if (!p) return;
          PPL.people.forEach((x) => {
            if (x.tag === "本人") x.tag = "";
          });
          p.tag = "本人";
          PPL.meId = id;
          if (!pplSave()) return false;
          pplAfterChange();
          toast("已将「" + p.name + "」设为本人");
        } else if (a === "hepan") {
          const r = PPL.rels.find((x) => x.id === rid);
          if (r) hpOpenFor(r.a, r.b, r.role);
        } else if (a === "swap") {
          const r = PPL.rels.find((x) => x.id === rid);
          if (!r) return;
          const nr =
            PPL_ROLE[r.role].dir || ["spouse", "sibling"].includes(r.role) || true
              ? { a: r.b, b: r.a }
              : null;
          r.a = nr.a;
          r.b = nr.b;
          if (!pplSave()) return false;
          pplRefreshViews();
        } else if (a === "delrel") {
          PPL.rels = PPL.rels.filter((x) => x.id !== rid);
          if (NET.sel && NET.sel.t === "e" && NET.sel.id === rid) NET.sel = null;
          if (!pplSave()) return false;
          pplRefreshViews();
          toast("已删除关系");
        } else if (a === "selrel") {
          netSelect({ t: "e", id: rid });
          const s = $("#netSvg");
          if (s) s.scrollIntoView({ behavior: "smooth", block: "center" });
        } else if (a === "delp") {
          const p = pplById(id);
          if (!p) return;
          PPL.people = PPL.people.filter((x) => x.id !== id);
          PPL.rels = PPL.rels.filter((r) => r.a !== id && r.b !== id);
          delete PPL.pos[id];
          if (PPL.meId === id) PPL.meId = null;
          if (PPL.cur === id) PPL.cur = null;
          NET.sel = null;
          if (!pplSave()) return false;
          pplAfterChange();
          toast("已删除:" + p.name);
        }
      }),
  );
}
function netBindManage() {
  const root = $("#pane-net");
  netBindActs(root);
  const add = $("#rfAdd");
  if (add)
    add.onclick = () => {
      const a = $("#rfA").value,
        b = $("#rfB").value,
        role = $("#rfRole").value,
        note = ($("#rfNote").value || "").trim();
      if (a === b) {
        toast("请选择两位不同的人物");
        return;
      }
      const n = pplNormRel(a, b, role);
      if (
        PPL.rels.some(
          (r) =>
            r.role === n.role &&
            ((r.a === n.a && r.b === n.b) ||
              (PPL_SYM.includes(n.role) && r.a === n.b && r.b === n.a)),
        )
      ) {
        toast("这条关系已存在");
        return;
      }
      const A = pplById(n.a),
        B = pplById(n.b);
      let warn = "";
      if ((n.role === "parent" || n.role === "grand") && A && B && A.dt && B.dt && A.dt > B.dt)
        warn = "(注意:出生先后与关系不符,请核对)";
      PPL.rels.push({
        id: "r" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
        a: n.a,
        b: n.b,
        role: n.role,
        note,
      });
      if (!pplSave()) return false;
      pplRefreshViews();
      toast("已添加关系" + warn);
    };
  const ex = $("#pplExp");
  if (ex)
    ex.onclick = () =>
      saveFile(
        `天机盘人物册-${nowBJ().y}${f2(nowBJ().m)}${f2(nowBJ().d)}.json`,
        JSON.stringify(
          { v: 3, people: PPL.people, rels: PPL.rels, meId: PPL.meId, pos: PPL.pos },
          null,
          1,
        ),
      );
  const ib = $("#pplImpB"),
    fi = $("#pplImp");
  if (ib && fi) {
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
      } catch (e) {
        toast("导入失败：" + String(e.message || e));
      }
      fi.value = "";
    };
  }
}
function pplImport(o) {
  if (!o || !Array.isArray(o.people) || o.people.length > 2000)
    throw new Error("人物格式无效，或超过2000人导入上限");
  const inputIds = new Set();
  for (const p of o.people) {
    if (!p || typeof p !== "object") throw new Error("人物记录格式无效");
    const id = String(p.id || "");
    if (id && inputIds.has(id)) throw new Error("导入文件存在重复人物ID");
    if (id) inputIds.add(id);
  }
  const srcR = Array.isArray(o.rels) ? o.rels : Array.isArray(o.relations) ? o.relations : [],
    map = new Map(),
    used = new Set(PPL.people.map((p) => p.id));
  let np = 0,
    nr = 0;
  o.people.forEach((raw, i) => {
    if (!raw || typeof raw !== "object") return;
    let old = String(raw.id || "import-" + i),
      id = old;
    if (!pplSafeId(id) || used.has(id)) {
      do {
        id = pplId();
      } while (used.has(id));
    }
    used.add(id);
    map.set(old, id);
    const p = {
      id,
      name: String(raw.name || "人物").slice(0, 24),
      tag: PPL_TAGS.includes(raw.tag) ? raw.tag : "",
      gender: raw.gender === "0" ? "0" : "1",
      dt: String(raw.dt || "").replace(" ", "T"),
      lon: raw.lon == null ? "117.8" : String(raw.lon),
      lat: raw.lat == null ? "24.5" : String(raw.lat),
      solar: !!raw.solar,
      cal: raw.cal === "L" ? "L" : "S",
      note: String(raw.note || "").slice(0, 300),
      fenye: String(raw.fenye || ""),
      place: String(raw.place || ""),
      createdAt: +raw.createdAt || Date.now(),
      updatedAt: +raw.updatedAt || Date.now(),
      source: "import",
    };
    PPL.people.push(p);
    np++;
  });
  srcR.forEach((raw) => {
    if (!raw) return;
    const a = map.get(String(raw.a)),
      b = map.get(String(raw.b));
    if (a === b || !pplById(a) || !pplById(b)) return;
    let role = Object.hasOwn(PPL_ROLE, raw.role) ? raw.role : "other";
    const n = pplNormRel(a, b, role);
    const dup = PPL.rels.some(
      (r) =>
        r.role === n.role &&
        ((r.a === n.a && r.b === n.b) || (PPL_SYM.includes(n.role) && r.a === n.b && r.b === n.a)),
    );
    if (dup) return;
    PPL.rels.push({
      id: "r" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      a: n.a,
      b: n.b,
      role: n.role,
      note: String(raw.note || "").slice(0, 30),
      createdAt: +raw.createdAt || Date.now(),
      hm: pplSanHm(raw.hm),
    });
    nr++;
  });
  const rr = pplRepairData(false);
  if (!pplSave()) throw new Error("导入未保存：本地存储不可用或空间不足");
  pplAfterChange();
  toast(
    `已导入 ${np} 位人物、${nr} 条关系${rr.invalidBirth ? " · " + rr.invalidBirth + " 位出生时间待核" : ""}`,
  );
  return { people: np, relations: nr, repair: rr };
}
function netBindAll(D, lay) {
  const svg = $("#netSvg");
  $("#netLay").onchange = (e) => {
    NET.layout = e.target.value;
    renderNet();
  };
  $("#netGs").onchange = (e) => {
    NET.gs = e.target.checked;
    renderNet();
  };
  $("#netTags").onchange = (e) => {
    NET.tags = e.target.checked;
    renderNet();
  };
  $("#netAll").onchange = (e) => {
    NET.all = e.target.checked;
    renderNet();
  };
  $("#netReset").onclick = () => {
    D.P.forEach((p) => delete PPL.pos[p.id]);
    if (!pplSave()) return false;
    renderNet();
  };
  svg.onpointerdown = (e) => {
    if (e.button > 0) return;
    const g = e.target.closest(".nd");
    if (g) {
      const id = g.dataset.id,
        pt = netSvgPt(svg, e),
        q = netPos(lay, id);
      NET.drag = { id, dx: pt.x - q.x, dy: pt.y - q.y, moved: false, sx: e.clientX, sy: e.clientY };
      try {
        svg.setPointerCapture(e.pointerId);
      } catch (_) {}
      e.preventDefault();
    }
  };
  svg.onpointermove = (e) => {
    const d = NET.drag;
    if (!d) return;
    if (!d.moved && Math.hypot(e.clientX - d.sx, e.clientY - d.sy) < 5) return;
    d.moved = true;
    const pt = netSvgPt(svg, e);
    PPL.pos[d.id] = { x: netClamp((pt.x - d.dx) / lay.W), y: netClamp((pt.y - d.dy) / lay.H) };
    netRedraw(D, lay);
  };
  svg.onpointerup = (e) => {
    const d = NET.drag;
    NET.drag = null;
    if (d) {
      if (d.moved) {
        if (!pplSave()) return false;
        pplRefreshViews();
      } else netSelect({ t: "p", id: d.id });
      return;
    }
    const ed = e.target.closest(".ed");
    if (ed) {
      netSelect({ t: "e", id: ed.dataset.rid });
      return;
    }
    if (NET.sel) netSelect(null);
  };
  svg.onkeydown = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      const g = e.target.closest(".nd");
      if (g) {
        e.preventDefault();
        netSelect({ t: "p", id: g.dataset.id });
      }
    }
  };
  netBindDetail(D);
  netBindManage();
}
/* ---- 圆盘“人物”图层:按日支落位于十二地支盘 ---- */
function buildPeopleLayer(ring) {
  const g = ring(1, 1.2);
  g.setAttribute("class", "lx lx-ppl");
  dial.layerG.ppl = g;
  dial.pplG = g;
  dialPeopleRender();
}
function dialPeopleRender() {
  const g = dial && dial.pplG;
  if (!g) return;
  g.innerHTML = "";
  let D;
  try {
    D = netData();
  } catch (e) {
    return;
  }
  E("circle", { r: 352, class: "ln2" }, g);
  if (!D.P.length) {
    E(
      "text",
      { y: -340, class: "ppl-emp", "text-anchor": "middle" },
      g,
      "关系网 · 尚无人物(在首页保存人物)",
    );
    return;
  }
  const used = {},
    pts = {};
  D.P.forEach((p) => {
    const b = p.bz.pill[2].b,
      k = (used[b] = (used[b] || 0) + 1) - 1,
      a = (180 + 30 * b) * D2R,
      r = 352 + [0, 26, -26, 52][k % 4];
    pts[p.id] = { x: r * Math.sin(a), y: -r * Math.cos(a) };
  });
  D.rels.forEach((r) => {
    const A = pts[r.a],
      B = pts[r.b],
      pr = netPair(D.byId[r.a], D.byId[r.b]);
    if (!A || !B) return;
    E(
      "path",
      {
        d: `M${A.x.toFixed(1)} ${A.y.toFixed(1)}Q${(A.x * 0.3 + B.x * 0.3).toFixed(1)} ${(A.y * 0.3 + B.y * 0.3).toFixed(1)} ${B.x.toFixed(1)} ${B.y.toFixed(1)}`,
        class: "ppl-ed " + pr.cls + (PPL_ROLE[r.role].kind === "soc" ? " soc" : ""),
      },
      g,
    );
  });
  D.P.forEach((p) => {
    const q = pts[p.id],
      e = GAN_WX[p.bz.dm],
      n = E(
        "g",
        { class: "ppl-nd wx" + e, transform: `translate(${q.x.toFixed(1)} ${q.y.toFixed(1)})` },
        g,
      );
    E(
      "title",
      {},
      n,
      `${p.name} · ${GAN[p.bz.pill[2].s]}${ZHI[p.bz.pill[2].b]}日 · ${ZODIAC12[p.bz.pill[0].b]}`,
    );
    E("circle", { r: 12, class: "disc" }, n);
    E("text", { y: 4.5, "text-anchor": "middle", class: "ch" }, n, [...p.name][0] || "?");
    if (p.id === PPL.meId) E("circle", { r: 15.5, class: "me" }, n);
  });
}

/* ================= 报时:声音合成、提醒、设置面板 ================= */
const BELL_K = "tianjipan.bell.v2";
let BELL = JSON.parse(JSON.stringify(BELL_DEF));
BELL.reminders = [];
(function () {
  try {
    const o = JSON.parse(localStorage.getItem(BELL_K) || "null");
    if (o) Object.assign(BELL, o);
    else if (localStorage.getItem("tianjipan.bell") === "1") BELL.on = true;
  } catch (e) {}
})();
NW.bell = BELL.on;
function bellSave() {
  try {
    localStorage.setItem(BELL_K, JSON.stringify(BELL));
    localStorage.setItem("tianjipan.bell", BELL.on ? "1" : "0");
  } catch (e) {}
}
let _bac = null;
function bellCtx() {
  if (!_bac) _bac = new (window.AudioContext || window.webkitAudioContext)();
  if (_bac.state === "suspended") _bac.resume();
  return _bac;
}
function bellStrike(kind, t, v) {
  const ac = bellCtx(),
    out = ac.destination,
    mk = (f, type, dur, gain, det) => {
      const o = ac.createOscillator(),
        g = ac.createGain();
      o.type = type;
      o.frequency.setValueAtTime(f, t);
      if (det) o.frequency.exponentialRampToValueAtTime(det, t + dur * 0.7);
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(gain * v, t + 0.008);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g);
      g.connect(out);
      o.start(t);
      o.stop(t + dur + 0.05);
    };
  if (kind === "bell") {
    [
      [220, 2.6, 0.5],
      [441, 1.8, 0.3],
      [590, 1.2, 0.18],
      [882, 0.8, 0.12],
      [1180, 0.5, 0.06],
    ].forEach(([f, d, g]) => mk(f, "sine", d, g));
  } else if (kind === "qing") {
    [
      [880, 1.8, 0.4],
      [2360, 1.0, 0.18],
      [4180, 0.5, 0.08],
    ].forEach(([f, d, g]) => mk(f, "sine", d, g));
  } else if (kind === "wood") {
    mk(430, "sine", 0.14, 0.5, 300);
    mk(860, "triangle", 0.06, 0.2);
  } else if (kind === "bang") {
    mk(920, "square", 0.07, 0.16);
    mk(460, "sine", 0.1, 0.4, 300);
  } else if (kind === "qin") {
    [
      [196, 1.2, 0.4],
      [392, 0.9, 0.2],
      [588, 0.6, 0.1],
    ].forEach(([f, d, g]) => mk(f, "triangle", d, g));
  } else if (kind === "drum") {
    mk(140, "sine", 0.35, 0.7, 60);
  }
}
function bellPlay(spec, cfg) {
  if (!spec || !spec.n) return;
  try {
    const ac = bellCtx(),
      v = Math.max(0.05, Math.min(1, cfg.vol)) * 0.9,
      t0 = ac.currentTime + 0.03;
    const tim = spec.t === "chord" ? "chord" : spec.t;
    if (tim === "chord") {
      [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
        const o = ac.createOscillator(),
          g = ac.createGain();
        o.type = "sine";
        o.frequency.value = f;
        o.connect(g);
        g.connect(ac.destination);
        const s = t0 + i * 0.22;
        g.gain.setValueAtTime(0, s);
        g.gain.linearRampToValueAtTime(0.22 * v, s + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, s + 1.4);
        o.start(s);
        o.stop(s + 1.5);
      });
      return;
    }
    const kind =
      { bell: "bell", qing: "qing", wood: "wood", bang: "bang", qin: "qin", drum: "drum" }[tim] ||
      "bell";
    const gap =
      kind === "wood" || kind === "bang" ? 0.3 : kind === "drum" ? 0.4 : spec.n > 6 ? 0.36 : 0.6;
    for (let i = 0; i < Math.min(spec.n, 12); i++) bellStrike(kind, t0 + i * gap, v);
  } catch (e) {}
}
function nwChime(kind) {
  bellPlay(kind === "term" ? { n: 4, t: "chord" } : { n: 1, t: BELL.timbre }, BELL);
}
function nwNotify(title, body) {
  try {
    if (BELL.notify && typeof Notification !== "undefined" && Notification.permission === "granted")
      new Notification(title, { body });
  } catch (e) {}
}
function bellSpeechSupported() {
  return (
    typeof window !== "undefined" &&
    "speechSynthesis" in window &&
    typeof SpeechSynthesisUtterance !== "undefined"
  );
}
function bellSpeak(text, opt) {
  if (!BELL.speech || !bellSpeechSupported() || !text) return;
  opt = opt || {};
  try {
    const u = new SpeechSynthesisUtterance(String(text).replace(/[·|]/g, "，"));
    u.lang = "zh-CN";
    u.rate = Math.max(0.6, Math.min(1.35, +BELL.speechRate || 0.92));
    u.pitch = 1;
    u.volume = Math.max(0.15, Math.min(1, +BELL.vol || 0.6));
    const vs = speechSynthesis.getVoices ? speechSynthesis.getVoices() : [];
    const zh = vs.find((v) => /^zh(-|_)?CN/i.test(v.lang)) || vs.find((v) => /^zh/i.test(v.lang));
    if (zh) u.voice = zh;
    if (opt.cancel) speechSynthesis.cancel();
    speechSynthesis.speak(u);
  } catch (e) {}
}
function bellHourRange(b) {
  const a = (23 + b * 2) % 24,
    c = (a + 2) % 24;
  return `${f2(a)}点至${f2(c)}点`;
}
function bellSpeechText(e, N) {
  if (e.kind === "hour") {
    const z = ZHI[e.b],
      jl = ZW_LZ[e.b],
      imp = [0, 3, 6, 9].includes(e.b);
    return imp && BELL.important
      ? `现在进入${z}时，约为${bellHourRange(e.b)}。这是传统十二时辰的四正时之一。传统子午流注记作${jl[2]}当令。`
      : `现在进入${z}时，约为${bellHourRange(e.b)}。传统子午流注记作${jl[2]}当令。`;
  }
  if (e.kind === "geng") return `现在是${["", "一", "二", "三", "四", "五"][e.n]}更。`;
  if (e.kind === "term") return `节气交接，已进入${e.name}。`;
  if (e.kind === "sunrise") return "现在接近日出时刻。";
  if (e.kind === "sunset") return "现在接近日落时刻。";
  if (e.kind === "moon") return e.day === 1 ? "今天是农历初一，朔日。" : "今天是农历十五，望日。";
  if (e.kind === "remind") return e.r.label || "你设置的提醒时间到了。";
  return "";
}
function nwSetBell(on) {
  NW.bell = on;
  BELL.on = on;
  bellSave();
  const b = $("#lbBell");
  if (b) {
    b.classList.toggle("on", on);
    b.textContent = on ? "🔔 报时 开" : "🔕 报时 关";
    b.setAttribute("aria-pressed", on);
  }
}
const BELL_TEXT = {
  hour: (e) => [`进入${ZHI[e.b]}时`, `${ZW_LZ[e.b][2]}当令:${ZW_LZ[e.b][5]}`],
  geng: (e) => [
    `${["", "一", "二", "三", "四", "五"][e.n]}更`,
    `夜已${["", "一", "二", "三", "四", "五"][e.n]}更,击梆${e.n}下`,
  ],
  term: (e) => [`交${e.name}节气`, `已入${e.name}`],
  sunrise: () => ["日出", "太阳升起,日出而作"],
  sunset: () => ["日落", "太阳落山,日入而息"],
  moon: (e) => [
    e.day === 1 ? "朔日(初一)" : "望日(十五)",
    e.day === 1 ? "新月之日,宜静思谋划" : "月圆之日,宜圆满收束",
  ],
  remind: (e) => [
    e.r.label || "提醒",
    e.r.type === "shi" ? `${ZHI[e.r.shi]}时到了` : `${f2(e.r.h)}:${f2(e.r.m)}`,
  ],
};
function bellState(sc, tl, n, N) {
  const gi = sc.geng ? NW_WUGENG.findIndex((g) => g[0] === sc.geng) + 1 : 0,
    rs = N && N.rs && N.rs.sun;
  let ld = null;
  try {
    ld = N.R.lunar.day;
  } catch (e) {}
  return {
    b: sc.b,
    geng: gi,
    term: tl[0].name,
    dayKey: `${n.y}-${n.m}-${n.d}`,
    tmin: n.h * 60 + n.mi,
    sunrise: rs && rs.rise != null ? rs.rise : null,
    sunset: rs && rs.set != null ? rs.set : null,
    lunarDay: ld,
  };
}
function bellTick(sc, tl, n, N) {
  const cur = bellState(sc, tl, n, N),
    prev = NW.bellPrev || null;
  NW.bellPrev = cur;
  if (!NW.bell) return;
  const evs = bellEvents(prev, cur, BELL);
  if (!evs.length) return;
  const quiet = bellInQuiet(BELL, cur.tmin);
  evs.forEach((e, i) => {
    if (e.kind === "brief") {
      BELL.lastBrief = cur.dayKey;
      bellSave();
      const di = N.di;
      const y = di.yi.slice(0, 4).join("、") || "无特别事项",
        j = di.ji.slice(0, 4).join("、") || "无特别事项";
      toast(`今日 ${di.gz}日 · ${di.zx}日 · 宜 ${y} · 忌 ${j}`);
      nwNotify(
        "今日黄历",
        `${di.gz}日 宜 ${di.yi.slice(0, 5).join("、")} 忌 ${di.ji.slice(0, 5).join("、")}`,
      );
      if (!quiet)
        bellSpeak(`早安。传统黄历提示，今日${di.gz}日，${di.zx}日。宜${y}。忌${j}。`, {
          cancel: true,
        });
      return;
    }
    const tx = BELL_TEXT[e.kind](e);
    setTimeout(() => {
      toast(tx[0] + " · " + tx[1]);
    }, i * 1800);
    nwNotify(tx[0], tx[1]);
    if (!quiet || e.kind === "remind") {
      setTimeout(() => bellPlay(bellStrikes(e, BELL), BELL), i * 2500);
      setTimeout(() => bellSpeak(bellSpeechText(e, N), { cancel: false }), i * 2500 + 450);
    }
  });
}
/* 设置面板 */
function bellDlg() {
  let d = $("#bellDlg");
  if (!d) {
    d = document.createElement("div");
    d.id = "bellDlg";
    d.className = "bell-dlg";
    d.hidden = true;
    d.innerHTML = '<div class="bell-card" role="dialog" aria-label="报时设置"></div>';
    document.body.appendChild(d);
    d.addEventListener("click", (e) => {
      if (e.target === d) d.hidden = true;
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !d.hidden) d.hidden = true;
    });
  }
  return d;
}
function bellRender() {
  const d = bellDlg(),
    c = d.querySelector(".bell-card"),
    tm = [
      ["bell", "钟"],
      ["qing", "磬"],
      ["wood", "木鱼"],
      ["bang", "梆"],
      ["qin", "琴"],
    ];
  const hrs = [...Array(24).keys()]
    .map((h) => `<option value="${h}">${f2(h)}:00</option>`)
    .join("");
  c.innerHTML = `<div class="bell-h"><h3 class="sec">报时设置</h3><button class="ghost" id="bellX" aria-label="关闭">×</button></div>
  <div class="bell-grid">
   <label class="chk big"><input type="checkbox" id="bOn"${BELL.on ? " checked" : ""}> 开启报时(总开关)</label>
   <label>音色<select id="bTim">${tm.map(([k, n]) => `<option value="${k}"${BELL.timbre === k ? " selected" : ""}>${n}</option>`).join("")}</select></label>
   <label>音量<input type="range" id="bVol" min="5" max="100" value="${Math.round(BELL.vol * 100)}"></label>
   <button class="gbtn" id="bTest">试听提示音</button>
   <label>时辰报时方式<select id="bMode"><option value="count"${BELL.mode === "count" ? " selected" : ""}>按时辰序数敲钟(子1…亥12)</option><option value="once"${BELL.mode === "once" ? " selected" : ""}>每时辰一响</option><option value="text"${BELL.mode === "text" ? " selected" : ""}>只弹文字,不敲钟</option></select></label>
   <label class="chk big"><input type="checkbox" id="bSpeech"${BELL.speech ? " checked" : ""}> 中文语音播报（浏览器语音）</label>
   <label>语音速度<select id="bSpeechRate"><option value="0.82"${Math.abs(BELL.speechRate - 0.82) < 0.01 ? " selected" : ""}>舒缓</option><option value="0.92"${Math.abs(BELL.speechRate - 0.92) < 0.01 ? " selected" : ""}>自然</option><option value="1.05"${Math.abs(BELL.speechRate - 1.05) < 0.01 ? " selected" : ""}>稍快</option><option value="1.18"${Math.abs(BELL.speechRate - 1.18) < 0.01 ? " selected" : ""}>快速</option></select></label>
   <button class="gbtn" id="bSpeechTest">试听语音</button>
  </div>
  <div class="bell-opts">
   <label class="chk"><input type="checkbox" id="bHour"${BELL.hour ? " checked" : ""}> 每交一个时辰</label>
   <label class="chk"><input type="checkbox" id="bImportant"${BELL.important ? " checked" : ""}> 子·卯·午·酉四正时加强播报</label>
   <label class="chk"><input type="checkbox" id="bGeng"${BELL.geng ? " checked" : ""}> 夜间更鼓(一至五更,击梆)</label>
   <label class="chk"><input type="checkbox" id="bTerm"${BELL.term ? " checked" : ""}> 交节气</label>
   <label class="chk"><input type="checkbox" id="bSun"${BELL.sun ? " checked" : ""}> 日出、日落</label>
   <label class="chk"><input type="checkbox" id="bMoon"${BELL.moon ? " checked" : ""}> 朔日、望日</label>
   <label class="chk"><input type="checkbox" id="bMorn"${BELL.morning ? " checked" : ""}> 每日晨报(当日黄历宜忌,每天一次)</label>
  </div>
  <div class="bell-q"><label class="chk"><input type="checkbox" id="bQ"${BELL.quiet ? " checked" : ""}> 勿扰时段(只弹文字,不发声;自定义提醒不受限)</label> <select id="bQf">${hrs}</select> 至 <select id="bQt">${hrs}</select></div>
  <div class="bell-q"><button class="gbtn sm" id="bNotify">${typeof Notification === "undefined" ? "此环境不支持桌面通知" : Notification.permission === "granted" ? "桌面通知:已允许" : "允许桌面通知"}</button><label class="chk"><input type="checkbox" id="bNotifyOn"${BELL.notify ? " checked" : ""}> 报时同时发送桌面通知</label></div>
  <h4 class="gl">自定义提醒</h4>
  <ul class="cul bell-list">${(BELL.reminders || []).map((r, i) => `<li><b>${esc(r.label || "提醒")}</b> · ${r.type === "shi" ? ZHI[r.shi] + "时(每天)" : f2(r.h) + ":" + f2(r.m) + "(每天)"} <button class="lnk" data-del="${i}">删除</button></li>`).join("") || '<li class="dim">还没有提醒。可设在某个时辰,或某个钟点。</li>'}</ul>
  <div class="bell-add"><select id="rType"><option value="shi">按时辰</option><option value="clock">按钟点</option></select><select id="rShi">${ZHI.map((z, i) => `<option value="${i}">${z}时</option>`).join("")}</select><input type="time" id="rTime" value="08:00" hidden><input type="text" id="rLabel" placeholder="提醒内容,如:午时小憩" maxlength="14"><button class="gbtn" id="rAdd">添加</button></div>
  <p class="note">语音会播报时辰、四正时、节气、日出日落、朔望、晨报和自定义提醒；其中“当令经络”等内容属于传统子午流注口径，仅作文化信息。报时只在页面开着时生效；手机上通常需先点一下页面，浏览器才允许发声。数据只存在本机。</p>`;
  $("#bQf").value = BELL.qFrom;
  $("#bQt").value = BELL.qTo;
  const bind = (id, fn, ev) => {
    const e = $("#" + id);
    if (e) e[ev || "onchange"] = fn;
  };
  bind(
    "bellX",
    () => {
      d.hidden = true;
    },
    "onclick",
  );
  bind("bOn", (e) => {
    nwSetBell(e.target.checked);
  });
  bind("bTim", (e) => {
    BELL.timbre = e.target.value;
    bellSave();
  });
  bind("bVol", (e) => {
    BELL.vol = e.target.value / 100;
    bellSave();
  });
  bind("bMode", (e) => {
    BELL.mode = e.target.value;
    bellSave();
  });
  bind("bSpeech", (e) => {
    BELL.speech = e.target.checked;
    bellSave();
  });
  bind("bSpeechRate", (e) => {
    BELL.speechRate = +e.target.value;
    bellSave();
  });
  [
    ["bHour", "hour"],
    ["bImportant", "important"],
    ["bGeng", "geng"],
    ["bTerm", "term"],
    ["bSun", "sun"],
    ["bMoon", "moon"],
    ["bMorn", "morning"],
    ["bQ", "quiet"],
  ].forEach(([id, k]) =>
    bind(id, (e) => {
      BELL[k] = e.target.checked;
      bellSave();
    }),
  );
  bind("bQf", (e) => {
    BELL.qFrom = +e.target.value;
    bellSave();
  });
  bind("bQt", (e) => {
    BELL.qTo = +e.target.value;
    bellSave();
  });
  bind(
    "bTest",
    () => {
      bellPlay(bellStrikes({ kind: "hour", b: 2 }, BELL), BELL);
    },
    "onclick",
  );
  bind(
    "bSpeechTest",
    () => {
      bellSpeak("天机盘语音播报已启用。现在为语音试听。", { cancel: true });
    },
    "onclick",
  );
  bind(
    "bNotify",
    () => {
      try {
        Notification.requestPermission().then(() => {
          BELL.notify = Notification.permission === "granted";
          bellSave();
          bellRender();
        });
      } catch (e) {
        toast("此环境不支持桌面通知");
      }
    },
    "onclick",
  );
  bind("bNotifyOn", (e) => {
    BELL.notify = e.target.checked;
    bellSave();
  });
  bind("rType", (e) => {
    const s = e.target.value === "shi";
    $("#rShi").hidden = !s;
    $("#rTime").hidden = s;
  });
  bind(
    "rAdd",
    () => {
      const t = $("#rType").value,
        lb = ($("#rLabel").value || "").trim();
      let r;
      if (t === "shi")
        r = { type: "shi", shi: +$("#rShi").value, label: lb || ZHI[+$("#rShi").value] + "时提醒" };
      else {
        const [h, m] = ($("#rTime").value || "08:00").split(":").map(Number);
        r = { type: "clock", h, m, label: lb || "提醒" };
      }
      BELL.reminders.push(r);
      bellSave();
      bellRender();
      toast("已添加提醒");
    },
    "onclick",
  );
  $$("[data-del]", c).forEach(
    (b) =>
      (b.onclick = () => {
        BELL.reminders.splice(+b.dataset.del, 1);
        bellSave();
        bellRender();
      }),
  );
}
function bellOpen() {
  bellRender();
  bellDlg().hidden = false;
}

/* ================= 能量波动感应:传感器采集、圆盘图层、控制面板 =================
   采集只在本机完成:麦克风只算电平与频段能量,摄像头只取平均亮度,均不录制、不上传。 */
const SN_K = "tianjipan.sense.v1";
const SN = {
  on: false,
  demo: false,
  gain: 4,
  sens: 5,
  ch: {},
  det: null,
  idx: 0,
  disp: 0,
  log: [],
  t0: 0,
  st: {},
  head: 0,
  bins: new Array(180).fill(0),
  lastBin: -1,
  heading: null,
  beta: 0,
  gamma: 0,
  hs: null,
  m0: null,
  dv: null,
  bear: null,
  mic: null,
  cam: null,
  mains: 0,
  timers: [],
  pulses: [],
  moving: false,
  frame: 0,
  ev: {},
};
(function () {
  try {
    const o = JSON.parse(localStorage.getItem(SN_K) || "null");
    if (o) {
      SN.gain = o.gain || 4;
      SN.sens = o.sens || 5;
    }
  } catch (e) {}
})();
const snSave = () => {
  try {
    localStorage.setItem(SN_K, JSON.stringify({ gain: SN.gain, sens: SN.sens }));
  } catch (e) {}
};
const snThr = () => 6 - SN.sens * 0.4;
const snNow = () => performance.now() / 1000;
const SN_ORDER = ["mag", "hdg", "acc", "gyr", "snd", "hum", "hi", "lum"];
const SN_COL = {
  mag: "var(--water)",
  hdg: "var(--metal)",
  acc: "var(--earth)",
  gyr: "var(--wood)",
  snd: "var(--fire)",
  hum: "var(--gold2)",
  hi: "#b98be0",
  lum: "#e8c35a",
};
const SN_OFFMSG = {
  mag: "此浏览器不开放磁力计(仅部分安卓 Chrome 支持,iPhone 不开放)",
  hdg: "没有指南针读数(需手机,并允许方向权限)",
  acc: "没有运动传感器(电脑通常没有)",
  gyr: "没有陀螺仪数据(电脑通常没有)",
  snd: "未开启麦克风",
  hum: "未开启麦克风",
  hi: "未开启麦克风",
  lum: "未开启摄像头",
  tmr: "",
};
function snReset() {
  SN.det = new SnDet({ thr: snThr() });
  SN.ch = {};
  SN_CH.forEach(
    (c) =>
      (SN.ch[c.id] = {
        trk: new SnTrack(c.floor),
        z: 0,
        v: null,
        st: SN.st[c.id] || "off",
        zh: [],
        msg: "",
        last: 0,
      }),
  );
  SN.log = [];
  SN.bins.fill(0);
  SN.idx = 0;
  SN.disp = 0;
  SN.bear = null;
  SN.ev = {};
}
function snSetSt(id, st, msg) {
  const c = SN.ch[id];
  if (!c) return;
  c.st = st;
  c.msg = msg || "";
  SN.st[id] = st;
}
function snPush(id, v, t) {
  const c = SN.ch[id];
  if (!c || !isFinite(v)) return;
  if (c.st === "off" || c.st === "wait" || c.st === "na") c.st = "warm";
  c.v = v;
  c.last = t;
  const z = c.trk.update(v, t);
  c.z = z;
  if (c.trk.ready) c.st = "on";
  c.zh.push(z);
  if (c.zh.length > 80) c.zh.shift();
  if (!c.trk.ready) return;
  SN.det.thr = snThr();
  SN.det.feed(id, z, t).forEach((o) => {
    if (o.type === "open") {
      SN.pulses.push({ id, t: performance.now(), n: SN_BY[id].ctrl ? 0 : 1 });
      SN.ev[id] = o.ev;
    } else {
      snLogEvent(o.ev, o.note);
      delete SN.ev[id];
    }
  });
}
function snLogEvent(ev, note) {
  if (SN_BY[ev.id].ctrl && false) return;
  const n = new Date(Date.now() + 8 * 3600e3),
    hh = f2(n.getUTCHours()) + ":" + f2(n.getUTCMinutes()) + ":" + f2(n.getUTCSeconds());
  const sc = nwShichen(n.getUTCHours(), n.getUTCMinutes(), 0).label.slice(0, 2);
  SN.log.unshift({
    hh,
    sc,
    id: ev.id,
    name: SN_BY[ev.id].name,
    peak: ev.peak,
    dur: ev.t1 - ev.t0,
    note,
    demo: SN.demo,
    bear: SN.evBear && (ev.id === "mag" || ev.id === "hdg") ? SN.evBear.deg : null,
  });
  if (ev.id === "mag") SN.evBear = null;
  if (SN.log.length > 80) SN.log.pop();
  senseRenderLog();
}
/* ---- 采集:运动 / 方向 / 磁力计 / 供电 / 时钟抖动 ---- */
function snOnMotion(e) {
  const t = snNow(),
    a = e.accelerationIncludingGravity,
    r = e.rotationRate;
  if (a && a.x != null) snPush("acc", Math.hypot(a.x, a.y, a.z), t);
  if (r && r.alpha != null) snPush("gyr", Math.hypot(r.alpha, r.beta, r.gamma), t);
}
function snOnOrient(e) {
  const t = snNow();
  SN.beta = e.beta || 0;
  SN.gamma = e.gamma || 0;
  let h = null;
  if (typeof e.webkitCompassHeading === "number") h = e.webkitCompassHeading;
  else if ((e.absolute || e.type === "deviceorientationabsolute") && e.alpha != null)
    h = (360 - e.alpha) % 360;
  if (h === null) return;
  SN.heading = h;
  const x = Math.cos(h * D2R),
    y = Math.sin(h * D2R);
  if (!SN.hs) SN.hs = { x, y, t };
  else {
    const k = 1 - Math.exp(-(t - SN.hs.t) / 5);
    SN.hs.x += k * (x - SN.hs.x);
    SN.hs.y += k * (y - SN.hs.y);
    SN.hs.t = t;
  }
  const hs = Math.atan2(SN.hs.y, SN.hs.x) / D2R;
  snPush("hdg", Math.abs(snWrap(h - hs)), t);
}
function snStartMag() {
  if (!("Magnetometer" in window)) {
    snSetSt("mag", "na", SN_OFFMSG.mag);
    return;
  }
  try {
    const s = new Magnetometer({ frequency: 30 });
    SN.magS = s;
    s.addEventListener("reading", () => {
      const t = snNow(),
        B = Math.hypot(s.x, s.y, s.z);
      snPush("mag", B, t);
      if (!SN.m0) SN.m0 = { x: s.x, y: s.y, z: s.z, t };
      else {
        const k = 1 - Math.exp(-(t - SN.m0.t) / 20);
        SN.m0.x += k * (s.x - SN.m0.x);
        SN.m0.y += k * (s.y - SN.m0.y);
        SN.m0.z += k * (s.z - SN.m0.z);
        SN.m0.t = t;
      }
      const dx = s.x - SN.m0.x,
        dy = s.y - SN.m0.y,
        mag = SN.ch.mag,
        flat = Math.abs(SN.beta) < 25 && Math.abs(SN.gamma) < 25;
      if (
        mag &&
        Math.abs(mag.z) > snThr() * 0.6 &&
        flat &&
        SN.heading !== null &&
        Math.hypot(dx, dy) > 0.5
      ) {
        SN.bear = { deg: snBearing(dx, dy, SN.heading), t, str: Math.hypot(dx, dy) };
        if (SN.ev.mag && (!SN.evBear || SN.bear.str > SN.evBear.str))
          SN.evBear = { deg: SN.bear.deg, str: SN.bear.str };
      }
    });
    s.addEventListener("error", (e) => {
      snSetSt(
        "mag",
        "na",
        e.error && e.error.name === "NotAllowedError"
          ? "磁力计权限被拒绝(或嵌入页面不允许使用传感器)"
          : "磁力计不可用:" + ((e.error && e.error.message) || ""),
      );
    });
    s.start();
    snSetSt("mag", "wait", "等待数据…");
  } catch (e) {
    snSetSt(
      "mag",
      "na",
      "磁力计不可用:" +
        (e.name === "SecurityError" ? "当前页面不允许使用传感器(嵌入页面或非安全环境)" : e.message),
    );
  }
}
async function snStart() {
  if (SN.on) return;
  snReset();
  SN.on = true;
  SN.t0 = snNow();
  SN.m0 = null;
  SN.hs = null;
  ["mag", "hdg", "acc", "gyr"].forEach((i) => snSetSt(i, "wait", "等待数据…"));
  snSetSt("tmr", "wait", "");
  try {
    if (window.DeviceMotionEvent && typeof DeviceMotionEvent.requestPermission === "function") {
      const r = await DeviceMotionEvent.requestPermission();
      if (r !== "granted") {
        snSetSt("acc", "na", "运动权限被拒绝");
        snSetSt("gyr", "na", "运动权限被拒绝");
      }
    }
    if (
      window.DeviceOrientationEvent &&
      typeof DeviceOrientationEvent.requestPermission === "function"
    ) {
      const r = await DeviceOrientationEvent.requestPermission();
      if (r !== "granted") snSetSt("hdg", "na", "方向权限被拒绝");
    }
  } catch (e) {}
  SN.onM = snOnMotion;
  SN.onO = snOnOrient;
  window.addEventListener("devicemotion", SN.onM);
  window.addEventListener("deviceorientationabsolute", SN.onO);
  window.addEventListener("deviceorientation", SN.onO);
  snStartMag();
  try {
    navigator.getBattery &&
      navigator.getBattery().then((b) => {
        SN.bat = b;
        const f = () =>
          snSysEvent(
            "供电",
            `充电${b.charging ? "中" : "已断开"} · 电量 ${Math.round(b.level * 100)}%`,
          );
        b.addEventListener("chargingchange", f);
        b.addEventListener("levelchange", () => {
          const p = Math.round(b.level * 100);
          if (SN.batP !== undefined && Math.abs(p - SN.batP) >= 3)
            snSysEvent("供电", `电量跳变 ${SN.batP}%→${p}%`);
          SN.batP = p;
        });
        SN.batP = Math.round(b.level * 100);
      });
  } catch (e) {}
  try {
    const cn = navigator.connection;
    if (cn && cn.addEventListener) {
      SN.cnF = () =>
        snSysEvent(
          "网络",
          `${cn.effectiveType || ""} · 往返 ${cn.rtt || "?"}ms · 下行 ${cn.downlink || "?"}Mbps`,
        );
      cn.addEventListener("change", SN.cnF);
    }
  } catch (e) {}
  let last = performance.now();
  SN.timers.push(
    setInterval(() => {
      const n = performance.now();
      snPush("tmr", Math.abs(n - last - 50), snNow());
      last = n;
    }, 50),
  );
  SN.timers.push(setInterval(snFrame, 100));
  setTimeout(() => {
    if (!SN.on || SN.demo) return;
    ["mag", "hdg", "acc", "gyr"].forEach((i) => {
      const c = SN.ch[i];
      if (c && c.st === "wait") snSetSt(i, "na", SN_OFFMSG[i]);
    });
    senseUpdatePanel();
  }, 4500);
  senseUpdatePanel();
}
function snSysEvent(name, text) {
  if (!SN.on) return;
  const n = new Date(Date.now() + 8 * 3600e3);
  SN.log.unshift({
    hh: f2(n.getUTCHours()) + ":" + f2(n.getUTCMinutes()) + ":" + f2(n.getUTCSeconds()),
    sys: 1,
    name,
    text,
  });
  if (SN.log.length > 80) SN.log.pop();
  senseRenderLog();
}
function snStop() {
  SN.on = false;
  SN.demo = false;
  SN.timers.forEach(clearInterval);
  SN.timers = [];
  try {
    window.removeEventListener("devicemotion", SN.onM);
    window.removeEventListener("deviceorientationabsolute", SN.onO);
    window.removeEventListener("deviceorientation", SN.onO);
  } catch (e) {}
  try {
    SN.magS && SN.magS.stop();
  } catch (e) {}
  SN.magS = null;
  try {
    const cn = navigator.connection;
    cn && SN.cnF && cn.removeEventListener("change", SN.cnF);
  } catch (e) {}
  try {
    snMicOff();
  } catch (e) {
    console.error(e);
  }
  try {
    snCamOff();
  } catch (e) {
    console.error(e);
  }
  SN_CH.forEach((c) => {
    SN.st[c.id] = "off";
    if (SN.ch[c.id]) SN.ch[c.id].st = "off";
  });
  SN.bear = null;
  SN.evBear = null;
  try {
    senseUpdatePanel();
    dialSenseRender();
  } catch (e) {
    console.error(e);
  }
}
/* ---- 麦克风:总电平 / 工频嗡鸣 / 高频 ---- */
async function snMicOn() {
  if (SN.mic) return;
  try {
    if (!SN.on) await snStart();
    const st = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
    });
    const ac = new (window.AudioContext || window.webkitAudioContext)(),
      src = ac.createMediaStreamSource(st),
      an = ac.createAnalyser();
    an.fftSize = 16384;
    an.smoothingTimeConstant = 0.3;
    src.connect(an);
    const fb = new Float32Array(an.frequencyBinCount),
      tb = new Float32Array(2048),
      hz = ac.sampleRate / an.fftSize;
    const pw = (f1, f2) => {
      let s = 0;
      for (
        let i = Math.max(1, Math.floor(f1 / hz));
        i <= Math.min(fb.length - 1, Math.ceil(f2 / hz));
        i++
      )
        s += Math.pow(10, fb[i] / 10);
      return 10 * Math.log10(s + 1e-14);
    };
    SN.mic = { st, ac, an };
    ["snd", "hum", "hi"].forEach((i) => snSetSt(i, "wait", "等待数据…"));
    let k = 0;
    const id = setInterval(() => {
      if (!SN.on) return;
      const t = snNow();
      an.getFloatFrequencyData(fb);
      an.getFloatTimeDomainData(tb);
      let e = 0;
      for (let i = 0; i < tb.length; i++) e += tb[i] * tb[i];
      snPush("snd", 10 * Math.log10(e / tb.length + 1e-12), t);
      if (!SN.mains && k++ > 20) {
        SN.mains = pw(47, 53) >= pw(57, 63) ? 50 : 60;
      }
      const f0 = SN.mains || 50,
        h1 = pw(f0 - 3, f0 + 3),
        h2 = pw(2 * f0 - 3, 2 * f0 + 3);
      snPush("hum", 10 * Math.log10(Math.pow(10, h1 / 10) + Math.pow(10, h2 / 10)), t);
      if (ac.sampleRate >= 40000)
        snPush("hi", pw(15000, Math.min(20000, ac.sampleRate / 2 - 300)), t);
      else snSetSt("hi", "na", "采样率过低,听不到 15kHz 以上");
    }, 100);
    SN.mic.id = id;
    SN.timers.push(id);
  } catch (e) {
    ["snd", "hum", "hi"].forEach((i) =>
      snSetSt(
        i,
        "na",
        e.name === "NotAllowedError"
          ? "麦克风权限被拒绝(嵌入页面可能不允许)"
          : "麦克风不可用:" + e.message,
      ),
    );
    SN.mic = null;
  }
  senseUpdatePanel();
}
function snMicOff() {
  if (!SN.mic) return;
  try {
    clearInterval(SN.mic.id);
    SN.mic.st.getTracks().forEach((t) => t.stop());
    SN.mic.ac.close();
  } catch (e) {}
  SN.mic = null;
  SN.mains = 0;
  ["snd", "hum", "hi"].forEach((i) => {
    snSetSt(i, "off");
    if (SN.ch[i]) {
      SN.ch[i].trk.reset();
      SN.ch[i].zh = [];
      SN.ch[i].z = 0;
    }
  });
  senseUpdatePanel();
}
/* ---- 摄像头:只取平均亮度 ---- */
async function snCamOn() {
  if (SN.cam) return;
  try {
    if (!SN.on) await snStart();
    const st = await navigator.mediaDevices.getUserMedia({
        video: { width: 64, height: 48, facingMode: "environment" },
      }),
      v = document.createElement("video");
    v.srcObject = st;
    v.muted = true;
    v.playsInline = true;
    await v.play();
    const cv = document.createElement("canvas");
    cv.width = 32;
    cv.height = 24;
    const cx = cv.getContext("2d", { willReadFrequently: true });
    SN.cam = { st, v };
    snSetSt("lum", "wait", "等待数据…");
    const id = setInterval(() => {
      if (!SN.on) return;
      cx.drawImage(v, 0, 0, 32, 24);
      const d = cx.getImageData(0, 0, 32, 24).data;
      let s = 0;
      for (let i = 0; i < d.length; i += 4) s += 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
      snPush("lum", (s / (d.length / 4) / 255) * 100, snNow());
    }, 66);
    SN.cam.id = id;
    SN.timers.push(id);
  } catch (e) {
    snSetSt(
      "lum",
      "na",
      e.name === "NotAllowedError"
        ? "摄像头权限被拒绝(嵌入页面可能不允许)"
        : "摄像头不可用:" + e.message,
    );
    SN.cam = null;
  }
  senseUpdatePanel();
}
function snCamOff() {
  if (!SN.cam) return;
  try {
    clearInterval(SN.cam.id);
    SN.cam.st.getTracks().forEach((t) => t.stop());
  } catch (e) {}
  SN.cam = null;
  snSetSt("lum", "off");
  if (SN.ch.lum) {
    SN.ch.lum.trk.reset();
    SN.ch.lum.zh = [];
    SN.ch.lum.z = 0;
  }
  senseUpdatePanel();
}
/* ---- 演示:合成信号,只用来看显示效果,与真实传感器无关 ---- */
function snDemo() {
  if (SN.on && !SN.demo) snStop();
  if (SN.demo) {
    snStop();
    return;
  }
  snReset();
  SN.on = true;
  SN.demo = true;
  SN.t0 = snNow();
  SN_CH.forEach((c) => snSetSt(c.id, "wait", "模拟信号"));
  const base = { mag: 48, hdg: 0, acc: 9.81, gyr: 0, snd: -62, hum: -88, hi: -96, lum: 42, tmr: 0 },
    rate = { mag: 30, hdg: 30, acc: 30, gyr: 30, snd: 10, hum: 10, hi: 10, lum: 15, tmr: 10 };
  let next = snNow() + 22,
    act = [],
    gate = {};
  const gauss = () => {
    let u = 0;
    while (!u) u = Math.random();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * Math.random());
  };
  SN.timers.push(
    setInterval(() => {
      const t = snNow();
      if (t >= next) {
        const pool =
          Math.random() < 0.6
            ? [
                ["mag", "hdg", "hum"],
                ["mag", "hum", "lum"],
                ["snd", "hi"],
              ][Math.floor(Math.random() * 3)]
            : [SN_ORDER[Math.floor(Math.random() * 8)]];
        pool.forEach((id) =>
          act.push({
            id,
            t0: t + Math.random() * 0.4,
            dur: 2 + Math.random() * 3,
            amp: 7 + Math.random() * 12,
          }),
        );
        next = t + 14 + Math.random() * 12;
      }
      act = act.filter((a) => t < a.t0 + a.dur);
      SN_CH.forEach((c) => {
        const r = rate[c.id];
        if (t - (gate[c.id] || 0) < 1 / r) return;
        gate[c.id] = t;
        let v = base[c.id] + gauss() * c.floor * 0.5;
        act.forEach((a) => {
          if (a.id === c.id && t >= a.t0) {
            const p = (t - a.t0) / a.dur;
            v += a.amp * c.floor * Math.sin(Math.PI * Math.min(1, p)) * (1 + 0.2 * Math.sin(t * 9));
          }
        });
        snPush(c.id, v, t);
      });
    }, 20),
  );
  SN.timers.push(setInterval(snFrame, 100));
  senseUpdatePanel();
}
/* ---- 每 100ms:综合指数、扫描轨迹、图层与面板刷新 ---- */
function snFrame() {
  SN.frame++;
  const zs = {};
  let mv = false;
  SN_CH.forEach((c) => {
    const k = SN.ch[c.id];
    if (k && k.st === "on") {
      zs[c.id] = k.z;
      if ((c.id === "acc" || c.id === "gyr") && Math.abs(k.z) > snThr() * 0.6) mv = true;
    }
  });
  SN.moving = mv;
  SN.idx = snIndex(zs, SN.gain, { moving: mv });
  SN.disp = Math.max(SN.idx, SN.disp * Math.exp(-0.1 / 4));
  SN.head = (SN.head + 0.6) % 360;
  const bi = Math.floor(SN.head / 2);
  for (let i = SN.lastBin < 0 ? bi : SN.lastBin + 1; ; i = (i + 1) % 180) {
    SN.bins[i] = SN.disp / 100;
    if (i === bi) break;
  }
  SN.lastBin = bi;
  if (SN.bear && snNow() - SN.bear.t > 4) SN.bear = null;
  const L = dial && dial.layerG && dial.layerG.sense;
  if (L && L.style.display !== "none") dialSenseRender();
  if (SN.frame % 3 === 0) senseUpdatePanel();
}
/* ---- 圆盘图层 ---- */
const SN_R1 = 352,
  SN_R2 = 404;
function buildSenseLayer(root) {
  const g = E("g", { class: "lx lx-sense" }, root);
  dial.layerG.sense = g;
  const X = (dial.sn = { g, bars: {}, lbl: {}, slots: {} });
  E("circle", { r: 306, class: "sn-ring" }, g);
  E("circle", { r: 350, class: "sn-ring" }, g);
  X.wedge = E("path", { class: "sn-wedge", d: "" }, g);
  X.trace = E("path", { class: "sn-trace", d: "" }, g);
  X.head = E("line", { class: "sn-head", x1: 0, y1: 0, x2: 0, y2: 0 }, g);
  SN_ORDER.forEach((id, i) => {
    const th = 22.5 + 45 * i,
      a1 = th - 16,
      a2 = th + 16;
    E("path", { d: sector(SN_R1, SN_R2, a1, a2), class: "sn-slot" }, g);
    X.bars[id] = E("path", { d: "", class: "sn-bar", style: `--c:${SN_COL[id]}` }, g);
    const [x, y] = P(418, th);
    X.lbl[id] = E(
      "text",
      { x, y: y + 4, class: "sn-lb", "text-anchor": "middle" },
      g,
      SN_BY[id].name,
    );
    X.slots[id] = { th, a1, a2 };
  });
  X.arrow = E("g", { class: "sn-arrow" }, g);
  E("path", { d: "M0 -298L-7 -318L0 -311L7 -318Z" }, X.arrow);
  X.idx = E("text", { x: 0, y: -386, class: "sn-idx", "text-anchor": "middle" }, g, "");
  X.tag = E("text", { x: 0, y: -370, class: "sn-tag", "text-anchor": "middle" }, g, "");
  X.pulses = E("g", {}, g);
  dialSenseRender();
}
function dialSenseRender() {
  const X = dial && dial.sn;
  if (!X) return;
  const off = !SN.on,
    now = performance.now();
  SN_ORDER.forEach((id) => {
    const c = SN.ch[id],
      on = c && c.st === "on",
      s = X.slots[id],
      amp = on ? snAmp(c.z, SN.gain) : 0,
      r2 = SN_R1 + 4 + amp * (SN_R2 - SN_R1 - 6);
    X.bars[id].setAttribute("d", amp > 0.01 ? sector(SN_R1 + 2, r2, s.a1 + 2, s.a2 - 2) : "");
    X.bars[id].style.opacity = on ? 0.45 + 0.55 * amp : 0;
    X.lbl[id].setAttribute("class", "sn-lb" + (on ? (amp > 0.5 ? " hot" : "") : " off"));
  });
  // 扫描轨迹
  const N = SN.bins.length,
    pts = [];
  for (let i = 0; i < N; i++) {
    const a = (i * 2 + 1 - 90) * D2R,
      r = 312 + Math.min(1, SN.bins[i]) * 36;
    pts.push((r * Math.cos(a)).toFixed(1) + " " + (r * Math.sin(a)).toFixed(1));
  }
  X.trace.setAttribute(
    "d",
    off ? "" : "M" + pts.join("L") + "Z M312 0A312 312 0 1 0 -312 0A312 312 0 1 0 312 0Z",
  );
  const ha = (SN.head - 90) * D2R;
  X.head.setAttribute("x1", (306 * Math.cos(ha)).toFixed(1));
  X.head.setAttribute("y1", (306 * Math.sin(ha)).toFixed(1));
  X.head.setAttribute("x2", (352 * Math.cos(ha)).toFixed(1));
  X.head.setAttribute("y2", (352 * Math.sin(ha)).toFixed(1));
  X.head.style.opacity = off ? 0 : 1;
  X.wedge.setAttribute("d", off ? "" : sector(306, 350, SN.head - 40, SN.head));
  // 扰动方向:圆盘 午在上,屏幕角 = 方位 + 180
  if (SN.bear && SN.on) {
    X.arrow.style.display = "";
    X.arrow.setAttribute("transform", `rotate(${(SN.bear.deg + 180).toFixed(1)})`);
  } else X.arrow.style.display = "none";
  X.idx.textContent = off
    ? "能量波动感应 · 未启动"
    : `能量波动感应 · 指数 ${Math.round(SN.disp)}${SN.demo ? " · 演示" : ""}`;
  X.g.classList.toggle("alert", !off && SN.disp >= 40);
  X.tag.textContent = off
    ? ""
    : SN.disp >= 70
      ? "波动强烈"
      : SN.disp >= 40
        ? "明显波动"
        : SN.disp >= 15
          ? "轻微波动"
          : "平稳";
  // 脉冲
  SN.pulses = SN.pulses.filter((p) => now - p.t < 1800);
  while (X.pulses.firstChild) X.pulses.removeChild(X.pulses.firstChild);
  SN.pulses.forEach((p) => {
    if (!p.n) return;
    const k = (now - p.t) / 1800,
      s = X.slots[p.id],
      c = E(
        "path",
        {
          d: sector(SN_R1 + k * 40, SN_R1 + k * 40 + 4, s.a1, s.a2),
          class: "sn-pulse",
          style: `--c:${SN_COL[p.id]};opacity:${(1 - k).toFixed(2)}`,
        },
        X.pulses,
      );
  });
}
/* ---- 控制面板(圆盘下方) ---- */
function senseRenderLog() {
  const ul = $("#snLog");
  if (!ul) return;
  const lv = {
    coherent: ["多通道同步", "good"],
    single: ["单通道", "mid"],
    moved: ["可能是设备被移动", "bad"],
    device: ["可能是页面自身卡顿", "bad"],
  };
  ul.innerHTML =
    SN.log
      .slice(0, 14)
      .map((x) =>
        x.sys
          ? `<li class="sys"><span class="dim">${x.hh}</span> <b>${esc(x.name)}</b> ${esc(x.text)}</li>`
          : `<li class="${lv[x.note.level][1]}"><span class="dim">${x.hh} ${x.sc}时</span> <b>${x.name}</b> ${x.peak > 0 ? "↑" : "↓"}${Math.abs(x.peak).toFixed(1)}σ · ${x.dur.toFixed(1)}s ${x.note.co.length ? `· 同步:${x.note.co.map((i) => SN_BY[i].name).join("、")}` : ""}${x.bear !== null && x.bear !== undefined ? ` · 扰动朝向≈${Math.round(x.bear)}°` : ""} <em>${lv[x.note.level][0]}${x.demo ? " · 模拟" : ""}</em></li>`,
      )
      .join("") ||
    '<li class="dim">暂无记录。开始感应后,偏离超过阈值并持续 0.3 秒以上的变化会记录在这里。</li>';
}
function senseBuildPanel() {
  const p = $("#sensePanel");
  if (!p || p.dataset.built) return;
  p.dataset.built = "1";
  p.innerHTML = `<div class="sn-head"><b>能量波动感应</b><span class="sn-state" id="snState">未启动</span></div>
  <div class="sn-btns"><button class="gbtn primary" id="snGo" type="button">开始感应</button><button class="gbtn" id="snMic" type="button">麦克风:关</button><button class="gbtn" id="snCam" type="button">摄像头:关</button><button class="gbtn" id="snDemo" type="button">演示(模拟信号)</button><button class="gbtn" id="snCal" type="button">重新校准</button></div>
  <div class="sn-sl"><label>放大倍数<input type="range" id="snGain" min="1" max="10" value="${SN.gain}"><b id="snGainV">${SN.gain}×</b></label><label>触发灵敏度<input type="range" id="snSens" min="1" max="10" value="${SN.sens}"><b id="snSensV">${SN.sens}</b></label></div>
  <div class="sn-idxrow"><div class="sn-meter"><i id="snMeter"></i></div><b id="snIdx">0</b><span class="dim" id="snIdxT">平稳</span></div>
  <ul class="sn-ch" id="snCh">${SN_CH.map((c) => `<li data-id="${c.id}" title="${esc(c.hint)}"><span class="n">${c.name}${c.ctrl ? "<em>对照</em>" : ""}</span><span class="s"></span><span class="b"><i></i></span><span class="v"></span></li>`).join("")}</ul>
  <h4 class="gl">异常记录</h4><ul class="sn-log" id="snLog"></ul>
  <div class="sn-btns"><button class="gbtn sm" id="snCsv" type="button">导出记录</button><button class="gbtn sm" id="snClr" type="button">清空记录</button></div>
  <p class="note">这里显示的是设备能读到的真实物理量(磁场、指南针、振动、转动、声、光)<b>相对它自己前一分钟基线的偏离</b>,偏离越大条越长,并按“放大倍数”拉伸。浏览器读不到电压和电网频率,只能通过麦克风里的 50/60Hz 嗡鸣、摄像头亮度起伏和电池充电状态间接反映。多数异常来自金属物、电器、充电线、有人走动和手机自身发热或卡顿,所以记录里会标出“多通道同步”(更可信)、“设备被移动”、“页面自身卡顿”(多半是假异常)。这些数据<b>无法判断来源,也无法证明存在任何“能量体”</b>;请把设备放稳、远离磁吸配件,再观察。麦克风只算电平与频段能量,摄像头只取平均亮度,均不录制、不上传。</p>
  <p class="note" id="snEnv"></p>`;
  $("#snGo").onclick = () => {
    SN.on && !SN.demo ? snStop() : (SN.demo && snStop(), snStart());
  };
  $("#snMic").onclick = () => (SN.mic ? snMicOff() : snMicOn());
  $("#snCam").onclick = () => (SN.cam ? snCamOff() : snCamOn());
  $("#snDemo").onclick = snDemo;
  $("#snCal").onclick = () => {
    if (!SN.on) return;
    SN_CH.forEach((c) => {
      SN.ch[c.id].trk.reset();
      SN.ch[c.id].zh = [];
      SN.ch[c.id].z = 0;
    });
    SN.bins.fill(0);
    SN.disp = 0;
    SN.m0 = null;
    SN.hs = null;
    toast("重新校准中,请把设备放稳约 10 秒");
  };
  $("#snGain").oninput = (e) => {
    SN.gain = +e.target.value;
    $("#snGainV").textContent = SN.gain + "×";
    snSave();
  };
  $("#snSens").oninput = (e) => {
    SN.sens = +e.target.value;
    $("#snSensV").textContent = SN.sens;
    snSave();
  };
  $("#snClr").onclick = () => {
    SN.log = [];
    senseRenderLog();
  };
  $("#snCsv").onclick = () => {
    const rows = ["时间,时辰,通道,偏离σ,持续s,级别,同步通道,扰动朝向,备注"].concat(
      SN.log
        .slice()
        .reverse()
        .map((x) =>
          x.sys
            ? `${x.hh},,${x.name},,,系统事件,,,${x.text}`
            : `${x.hh},${x.sc},${x.name},${x.peak.toFixed(2)},${x.dur.toFixed(1)},${x.note.level},${x.note.co.map((i) => SN_BY[i].name).join("+")},${x.bear != null ? Math.round(x.bear) : ""},${x.demo ? "模拟" : ""}`,
        ),
    );
    const b = new Blob(["\ufeff" + rows.join("\n")], { type: "text/csv" }),
      a = document.createElement("a");
    a.href = URL.createObjectURL(b);
    a.download = "能量波动感应记录.csv";
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  };
  senseRenderLog();
}
function senseUpdatePanel() {
  const p = $("#sensePanel");
  if (!p || p.hidden || !p.dataset.built) return;
  const stT = { off: "未开启", wait: "等待数据", warm: "校准中", on: "感应中", na: "不可用" };
  $("#snState").textContent = SN.on ? (SN.demo ? "演示中(模拟信号)" : "感应中") : "未启动";
  $("#snState").className = "sn-state" + (SN.on ? " on" : "") + (SN.demo ? " demo" : "");
  $("#snGo").textContent = SN.on && !SN.demo ? "停止感应" : "开始感应";
  $("#snDemo").textContent = SN.demo ? "停止演示" : "演示(模拟信号)";
  $("#snMic").textContent = "麦克风:" + (SN.mic ? "开" : "关");
  $("#snCam").textContent = "摄像头:" + (SN.cam ? "开" : "关");
  $("#snMic").classList.toggle("on", !!SN.mic);
  $("#snCam").classList.toggle("on", !!SN.cam);
  $$("#snCh li").forEach((li) => {
    const id = li.dataset.id,
      c = SN.ch[id],
      st = c ? c.st : "off",
      az = c ? Math.abs(c.z) : 0,
      amp = st === "on" ? snAmp(c.z, SN.gain) : 0;
    li.className = (st === "on" ? "" : "dim ") + (amp > 0.5 ? "hot" : "");
    li.querySelector(".s").textContent =
      st === "na" || st === "off"
        ? (c && c.msg) || SN_OFFMSG[id] || stT[st]
        : stT[st] + (id === "hum" && SN.mains && st !== "off" ? ` · 市电${SN.mains}Hz` : "");
    const bar = li.querySelector(".b i");
    bar.style.width = (amp * 100).toFixed(0) + "%";
    bar.style.background = SN_COL[id] || "var(--dim)";
    li.querySelector(".v").textContent =
      st === "on" ? `${c.z > 0 ? "+" : ""}${c.z.toFixed(1)}σ` : "";
  });
  const d = Math.round(SN.disp);
  $("#snMeter").style.width = d + "%";
  $("#snIdx").textContent = d;
  $("#snIdxT").textContent = !SN.on
    ? "—"
    : d >= 70
      ? "波动强烈"
      : d >= 40
        ? "明显波动"
        : d >= 15
          ? "轻微波动"
          : "平稳";
  const r = typeof R !== "undefined" && R && R.bz ? R : null;
  if (r && $("#snEnv") && !$("#snEnv").dataset.s) {
    $("#snEnv").dataset.s = 1;
  }
}
function senseLayerChanged(name) {
  const p = $("#sensePanel");
  if (!p) return;
  p.hidden = name !== "sense";
  if (name === "sense") {
    senseBuildPanel();
    senseUpdatePanel();
    senseRenderLog();
    dialSenseRender();
  }
}

/* ================= AI 综合解读(用户自己的 API Key) =================
   Key 只保存在你的浏览器里(默认仅本次会话;勾选“记住”才写入本机),请求直接发给你选择的服务商。 */
const AIK = "tianjipan.ai.v1",
  AIKEY = "tianjipan.ai.key";
const AI = {
  cfg: { provider: "anthropic", base: "", model: "", key: "", remember: false },
  last: {},
  busy: false,
  ctl: null,
};
(function () {
  try {
    const o = JSON.parse(localStorage.getItem(AIK) || "null");
    if (o) {
      Object.assign(AI.cfg, o);
    }
  } catch (e) {}
  try {
    const k = localStorage.getItem(AIKEY);
    if (k) {
      AI.cfg.key = k;
      AI.cfg.remember = true;
    } else {
      const k2 = sessionStorage.getItem(AIKEY);
      if (k2) AI.cfg.key = k2;
    }
  } catch (e) {}
  const p = AI_PRESET_BY[AI.cfg.provider] || AI_PRESET_BY.anthropic;
  if (!AI.cfg.model) AI.cfg.model = p.model;
  if (!AI.cfg.base) AI.cfg.base = p.base;
})();
function aiSaveCfg() {
  const c = AI.cfg;
  try {
    localStorage.setItem(
      AIK,
      JSON.stringify({ provider: c.provider, base: c.base, model: c.model }),
    );
  } catch (e) {}
  try {
    localStorage.removeItem(AIKEY);
    sessionStorage.removeItem(AIKEY);
    if (c.key) {
      (c.remember ? localStorage : sessionStorage).setItem(AIKEY, c.key);
    }
  } catch (e) {}
}
function mdLite(t) {
  return esc(t)
    .replace(/\*\*(.+?)\*\*/g, "<b>$1</b>")
    .replace(/^#{1,4}\s*(.+)$/gm, "<b>$1</b>")
    .replace(/\n/g, "<br>");
}
const aiKindTitle = (k) => (k === "pair" ? "AI 合盘解读" : "AI 综合解读");
function aiCardHTML(kind) {
  kind = kind || "chart";
  const c = AI.cfg;
  return `<div class="ai-card" data-kind="${kind}"><h3 class="sec">${aiKindTitle(kind)} <em class="opt">可选 · 需自备 API Key</em></h3>
  <p class="note" style="margin:0 0 8px">把上面排定的${kind === "pair" ? "两人八字与合盘结果" : "盘面事实与规则摘要"}交给你选择的 AI,写一篇跨体系的综合解读。内容只依据排盘事实,仍可能有偏差,请当作参考文字。</p>
  <details class="ai-set"${c.key || (AI_PRESET_BY[c.provider] || {}).nokey ? "" : " open"}><summary>接口设置 <span class="dim sm ai-sum">${esc((AI_PRESET_BY[c.provider] || {}).n || "")} · ${esc(c.model || "未填模型")} · ${(AI_PRESET_BY[c.provider] || {}).nokey ? "免 Key" : c.key ? "已填 Key" : "未填 Key"}</span></summary>
   <div class="ai-form">
    <label>服务商<select class="ai-prov">${AI_PRESETS.map((p) => `<option value="${p.k}"${p.k === c.provider ? " selected" : ""}>${p.n}</option>`).join("")}</select></label>
    <label>Base URL<input type="text" class="ai-base" value="${esc(c.base)}" placeholder="https://…" autocomplete="off" spellcheck="false"></label>
    <label>模型名<input type="text" class="ai-model" value="${esc(c.model)}" placeholder="例如 claude-sonnet-5-5" autocomplete="off" spellcheck="false"></label>
    <label>API Key<input type="password" class="ai-key" value="${esc(c.key)}" placeholder="sk-…" autocomplete="off" spellcheck="false"></label>
    <label class="chk ai-rem"><input type="checkbox" class="ai-remember"${c.remember ? " checked" : ""}> 记住在本机(写入浏览器本地存储;公用电脑请勿勾选)</label>
   </div>
   ${(AI_PRESET_BY[c.provider] || {}).nokey ? '<p class="note bad ai-free">当前选的是<b>免费免 Key 的第三方公共线路</b>:你的盘面文字(含出生信息的推演结果)会发送到该公共服务(text.pollinations.ai),本站无法控制其保存与使用方式;背后是开源小模型,回答质量与稳定性不保证,也未经本站验证可用。涉及隐私或需要更严谨解读时,请改用自备 Key 的线路。</p>' : ""}<p class="note">Key 不会发给本站以外的任何人:点击生成后,浏览器会<b>直接</b>把请求发给你选择的服务商。盘面事实(含出生信息推演结果)也会一并发送给该服务商,请自行评估。模型名与地址可自行修改,预设值可能已过时。</p>
  </details>
  <div class="row2"><button class="gbtn aiGo" type="button">生成${kind === "pair" ? "合盘" : "综合"}解读</button><button class="gbtn sm aiStop" type="button" hidden>停止</button><button class="gbtn sm aiTest" type="button">测试连接</button><button class="gbtn sm aiCopy" type="button">复制提示词</button><button class="gbtn sm aiClr" type="button">清除 Key</button><span class="aiSt dim sm" aria-live="polite"></span></div>
  <div class="aiOut rt" aria-live="polite"></div>
  <p class="note ai-env" hidden></p></div>`;
}
function aiPromptFor(kind) {
  if (kind === "pair") {
    const h = HP2 && HP2.last;
    if (!h) throw new Error("请先在合盘页选好两人并生成结果");
    return AI_PROMPT_PAIR + hhFacts(h.A, h.B, h.res);
  }
  if (!R) throw new Error("尚未起盘");
  return AI_PROMPT_CHART + aiFacts(R);
}
function aiKeyOf(kind) {
  if (kind === "pair") {
    const h = HP2.last;
    return h ? [h.A.name, h.B.name, h.res.score, HP2.mode].join("|") : "";
  }
  return R ? keyOf(R) : "";
}
async function aiCopyText(t) {
  try {
    await navigator.clipboard.writeText(t);
    return true;
  } catch (e) {
    try {
      const ta = document.createElement("textarea");
      ta.value = t;
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      ta.remove();
      return ok;
    } catch (e2) {
      return false;
    }
  }
}
async function aiCall(prompt, onText, signal) {
  const req = aiBuildReq(AI.cfg, prompt, true);
  let resp;
  try {
    resp = await fetch(req.url, Object.assign({ signal }, req.init));
  } catch (e) {
    if (e && e.name === "AbortError") throw e;
    const er = new Error(aiNetHint());
    er.net = true;
    throw er;
  }
  if (!resp.ok) {
    const tx = await resp.text().catch(() => "");
    throw new Error(aiErrMsg(resp.status, tx));
  }
  const ct = resp.headers.get("content-type") || "";
  if (!/event-stream/.test(ct) || !resp.body) {
    const j = await resp.json();
    const t = aiParseFull(req.fmt, j);
    onText(t);
    return t;
  }
  const rd = resp.body.getReader(),
    dec = new TextDecoder(),
    st = { buf: "" };
  let all = "";
  for (;;) {
    const { done, value } = await rd.read();
    if (done) break;
    const parts = aiSSE(req.fmt, st, dec.decode(value, { stream: true }));
    if (parts.length) {
      all += parts.join("");
      onText(all);
    }
  }
  if (st.buf) aiSSE(req.fmt, st, "\n");
  return all;
}
function aiBind() {
  $$(".ai-card").forEach((card) => {
    const kind = card.dataset.kind || "chart",
      go = $(".aiGo", card),
      stop = $(".aiStop", card),
      st = $(".aiSt", card),
      out = $(".aiOut", card),
      c = AI.cfg;
    const sync = () => {
      const e = $(".ai-sum", card);
      if (e)
        e.textContent = `${(AI_PRESET_BY[c.provider] || {}).n || ""} · ${c.model || "未填模型"} · ${(AI_PRESET_BY[c.provider] || {}).nokey ? "免 Key" : c.key ? "已填 Key" : "未填 Key"}`;
    };
    const lastK = AI.last[kind];
    if (lastK && lastK.key === aiKeyOf(kind)) out.innerHTML = mdLite(lastK.text);
    if (location.protocol !== "file:") {
      const en = $(".ai-env", card);
      en.hidden = false;
      en.textContent =
        "提示:如果你是在 claude.ai 的发布页里打开本页,页面的安全策略会拦截对外部服务商的请求,点击后可能提示“被拦截”。遇到这种情况请下载本地版 HTML 再用,或点“复制提示词”粘贴到你常用的 AI 网站。";
    }
    $(".ai-prov", card).onchange = (e) => {
      const p = AI_PRESET_BY[e.target.value];
      c.provider = p.k;
      c.base = p.base;
      c.model = p.model;
      aiSaveCfg();
      $(".ai-base", card).value = c.base;
      $(".ai-model", card).value = c.model;
      sync();
      let fr = $(".ai-free", card);
      if (p.nokey && !fr) {
        const n = document.createElement("p");
        n.className = "note bad ai-free";
        n.innerHTML =
          "当前选的是<b>免费免 Key 的第三方公共线路</b>:你的盘面文字(含出生信息的推演结果)会发送到该公共服务(text.pollinations.ai),本站无法控制其保存与使用方式;背后是开源小模型,回答质量与稳定性不保证,也未经本站验证可用。涉及隐私或需要更严谨解读时,请改用自备 Key 的线路。";
        $(".ai-form", card).after(n);
      } else if (!p.nokey && fr) fr.remove();
    };
    $(".ai-base", card).oninput = (e) => {
      c.base = e.target.value;
      aiSaveCfg();
    };
    $(".ai-model", card).oninput = (e) => {
      c.model = e.target.value;
      aiSaveCfg();
      sync();
    };
    $(".ai-key", card).oninput = (e) => {
      c.key = e.target.value;
      aiSaveCfg();
      sync();
    };
    $(".ai-remember", card).onchange = (e) => {
      c.remember = e.target.checked;
      aiSaveCfg();
    };
    $(".aiClr", card).onclick = () => {
      c.key = "";
      $(".ai-key", card).value = "";
      aiSaveCfg();
      sync();
      st.textContent = "已清除 Key";
    };
    $(".aiCopy", card).onclick = async () => {
      try {
        const ok = await aiCopyText(aiPromptFor(kind));
        st.textContent = ok ? "提示词已复制(含盘面事实),可粘贴到任意 AI" : "复制失败,请手动选择";
      } catch (e) {
        st.textContent = e.message;
      }
    };
    $(".aiTest", card).onclick = async () => {
      st.textContent = "测试中…";
      try {
        const t = await aiCall("只回复两个字:连通", () => {}, new AbortController().signal);
        st.textContent = t ? "连接正常" : "已连通(返回为空)";
      } catch (e) {
        st.textContent = e.message;
      }
    };
    go.onclick = async () => {
      if (AI.busy) return;
      let prompt;
      try {
        prompt = aiPromptFor(kind);
      } catch (e) {
        st.textContent = e.message;
        return;
      }
      AI.busy = true;
      AI.ctl = new AbortController();
      go.disabled = true;
      stop.hidden = false;
      st.textContent = "请求中…";
      out.innerHTML = "";
      const k = aiKeyOf(kind);
      try {
        const t = await aiCall(
          prompt,
          (txt) => {
            st.textContent = "生成中…";
            AI.last[kind] = { key: k, text: txt };
            $$(`.ai-card[data-kind="${kind}"] .aiOut`).forEach((o) => (o.innerHTML = mdLite(txt)));
          },
          AI.ctl.signal,
        );
        AI.last[kind] = { key: k, text: t };
        $$(`.ai-card[data-kind="${kind}"] .aiOut`).forEach((o) => (o.innerHTML = mdLite(t)));
        st.textContent = t ? "完成" : "服务商返回为空";
      } catch (e) {
        st.textContent =
          e && e.name === "AbortError" ? "已停止" : "生成失败:" + ((e && e.message) || "未知错误");
      } finally {
        AI.busy = false;
        go.disabled = false;
        stop.hidden = true;
      }
    };
    stop.onclick = () => {
      if (AI.ctl) AI.ctl.abort();
    };
  });
}
function initAI() {
  aiBind();
}

/* ================= 合盘:合婚(重点)· 合作 · 亲子 · 朋友同事;与人物册、关系网互通 ================= */
const HP2 = {
  mode: "marry",
  a: "cur",
  b: "man",
  dt: "1995-06-15T12:00",
  gender: "0",
  bname: "",
  role: "",
  last: null,
  open: {},
};
const HP_MODES = [
  ["marry", "婚恋合婚"],
  ["partner", "合作伙伴"],
  ["parent", "亲子"],
  ["friend", "朋友同事"],
];
const HP_ROLE_BY = {
  marry: ["spouse", "lover"],
  partner: ["partner", "colleague"],
  parent: ["parent"],
  friend: ["friend", "colleague", "classmate", "sibling"],
};
function hpPersons() {
  return ftPersons();
}
function hpGet(id, list) {
  if (id === "man") {
    const m = (HP2.dt || "").match(/^(\d{4})-(\d\d)-(\d\d)T(\d\d):(\d\d)/);
    if (!m) return { err: "请填写乙方的出生时间。" };
    const civ = { y: +m[1], m: +m[2], d: +m[3], h: +m[4], mi: +m[5], s: 0 };
    if (civ.y < 1901 || civ.y > 2099) return { err: "乙方年份需在 1901–2099。" };
    const Rb = computeAll(civ, {
      gender: HP2.gender === "1" ? "M" : "F",
      solar: false,
      lon: R.opt.lon,
    });
    return {
      P: {
        id: "man",
        name: (HP2.bname || "").trim() || "乙方",
        gender: HP2.gender,
        bz: Rb.bz,
        deep: baziDeep(Rb.bz),
        dt: HP2.dt,
      },
    };
  }
  const x = list.find((p) => p.id === id);
  return x ? { P: x.P } : { err: "找不到所选人物。" };
}
function hpCompute() {
  const list = hpPersons();
  if (!list.some((x) => x.id === HP2.a)) HP2.a = "cur";
  if (HP2.b !== "man" && (!list.some((x) => x.id === HP2.b) || HP2.b === HP2.a)) HP2.b = "man";
  const a = hpGet(HP2.a, list),
    b = hpGet(HP2.b, list);
  if (a.err) return { err: a.err };
  if (b.err) return { err: b.err };
  return { A: a.P, B: b.P, list };
}
function hpPillars(P, who) {
  const bz = P.bz,
    D = P.deep;
  return `<div class="hpc"><div class="ph">${who}:${esc(P.name || "")}<small>${P.gender === "0" ? "女" : "男"}</small></div><div class="hpp">${bz.pill.map((p, i) => `<span class="${i === 2 ? "dmk" : ""}"><b class="wx${GAN_WX[p.s]}">${GAN[p.s]}</b><b class="wx${ZHI_WX[p.b]}">${ZHI[p.b]}</b></span>`).join("")}</div><div class="dim sm">日主${GAN[bz.dm]}${WXK[GAN_WX[bz.dm]]} · ${D.st.level} · 喜用 ${D.xy.favor.map((x) => WXK[x]).join("")} · ${ZODIAC[bz.pill[0].b]}年生</div></div>`;
}
function hpDimHTML(d) {
  const open = HP2.open[d.k];
  return `<div class="hpd${open ? " open" : ""}" data-k="${esc(d.k)}"><button type="button" class="hpd-h"><span class="hpd-n">${d.k}</span><span class="hpd-w dim">权重 ${d.w}</span><span class="hpd-b"><i class="${d.s >= 60 ? "g" : d.s < 44 ? "r" : ""}" style="width:${d.s}%"></i></span><b>${d.s}</b><em>${open ? "收起" : "展开"}</em></button><ul class="hpd-l"${open ? "" : " hidden"}>${d.items.map((i) => `<li class="${i.t === "吉" ? "gd" : i.t === "凶" ? "bd" : ""}"><span class="d">${i.v ? (i.v > 0 ? "+" : "") + Math.round(i.v * 10) / 10 : "·"}</span>${esc(i.txt)}</li>`).join("")}</ul></div>`;
}
function hpRelHTML(A, B, res) {
  const inBook = (id) => PPL.people.some((p) => p.id === id),
    both = inBook(A.id) && inBook(B.id);
  const rel = both
    ? PPL.rels.find((r) => (r.a === A.id && r.b === B.id) || (r.a === B.id && r.b === A.id))
    : null;
  const roles = HP_ROLE_BY[HP2.mode],
    cur = HP2.role && roles.includes(HP2.role) ? HP2.role : roles[0];
  let h = `<div class="hprel"><h4 class="gl">与关系网互通</h4>`;
  if (!both) {
    h += `<p class="rt">${[A, B]
      .filter((x) => !inBook(x.id))
      .map((x) => esc(x.name))
      .join(
        "、",
      )}还不在人物册里,所以没法写入关系网。${B.id === "man" ? "" : "(当前命盘需先在首页点“保存人物”)"}</p>`;
    if (B.id === "man")
      h += `<div class="row3"><button class="gbtn sm" id="hpSaveB" type="button">把「${esc(B.name)}」存入人物册</button></div>`;
  } else {
    const label = rel
      ? `关系网里已有:<b>${esc(A.name)}</b>与<b>${esc(B.name)}</b>是「${PPL_ROLE[rel.role].n}」`
      : "关系网里还没有这两人的关系";
    h += `<p class="rt">${label}${rel && rel.hm ? `;上次保存的结果:${rel.hm.mode === "marry" ? "合婚" : HH_KIND[rel.hm.mode].n} 高于约 ${esc(rel.hm.pct)}% 的随机配对(${esc(rel.hm.lv)})` : ""}。</p>
    <div class="row3"><label class="sm dim">关系 <select id="hpRole">${roles.map((r) => `<option value="${r}"${r === cur ? " selected" : ""}>${PPL_ROLE[r].n}</option>`).join("")}</select></label>
    <button class="gbtn sm" id="hpSaveRel" type="button">${rel ? "更新关系并保存本次结果" : "建立关系并保存本次结果"}</button>${rel ? '<button class="gbtn sm" id="hpGoNet" type="button">在关系网中查看</button>' : ""}</div>
    <p class="note">保存后,关系网的连线详情里会显示这次的结果,也可以从关系网点“合盘”回到这里。结果只存在本机。</p>`;
  }
  return h + "</div>";
}
function hpBody() {
  const c = hpCompute();
  if (c.err) {
    HP2.last = null;
    return `<p class="note">${c.err}</p>`;
  }
  const { A, B } = c,
    res = HP2.mode === "marry" ? hhMarriage(A, B) : hhGeneric(HP2.mode, A, B);
  HP2.last = { A, B, res };
  const warn =
    typeof live !== "undefined" && live && HP2.a === "cur"
      ? '<p class="note bad">当前是“实时流转”的盘,甲方是此刻的八字,不是出生八字。请关闭实时流转或在首页填写出生信息,或直接在下拉里选人物册里的人。</p>'
      : "";
  const ring = `<div class="hpring ${res.pct >= 70 ? "good" : res.pct < 35 ? "bad" : "mid"}"><b>${res.pct}</b><small>契合度</small></div>`;
  const meta = `<div class="hphead">${ring}<div><div class="hpverdict">${res.lv}</div><div class="dim sm">规则综合分 ${res.score} · 高于约 ${res.pct}% 的随机${HP2.mode === "marry" ? "男女" : ""}配对</div>${res.flags.length ? `<div class="pills" style="margin-top:6px">${res.flags.map((f) => `<span class="pill ${f.t === "吉" ? "good" : "bad"}">${f.txt}</span>`).join("")}</div>` : ""}</div></div>`;
  const dimsH = res.dims.map(hpDimHTML).join("");
  const prosH = res.pros.length
    ? `<ul class="cul pl">${res.pros.map((x) => `<li class="good"><b>${x.k}</b> ${esc(x.txt)}</li>`).join("")}</ul>`
    : '<p class="dim sm">没有特别突出的加分项。</p>';
  const consH = res.cons.length
    ? `<ul class="cul pl">${res.cons.map((x) => `<li class="bad"><b>${x.k}</b> ${esc(x.txt)}</li>`).join("")}</ul>`
    : '<p class="dim sm">没有特别突出的减分项。</p>';
  let extra = "";
  if (HP2.mode === "marry") {
    const sh = (P) => {
      const s = hhSpouseStar(P);
      return `${esc(P.name)}:${P.gender === "0" ? "官杀" : "财星"}${s.w < 0.5 ? "不显" : "力度 " + s.w.toFixed(1)}${s.gan.length ? "(透干 " + s.gan.join("、") + ")" : ""},配偶宫(日支)坐「${s.palace}」`;
    };
    extra = `<h4 class="gl">夫妻星与配偶宫</h4><ul class="cul"><li>${sh(A)}</li><li>${sh(B)}</li></ul>
    <h4 class="gl">神煞(传统婚姻参考)</h4><ul class="cul">${[
      [A, res.sa],
      [B, res.sb],
    ]
      .map(
        ([P, s]) =>
          `<li><b>${esc(P.name)}</b>:${s.items.length ? s.items.map((x) => x.n).join("、") + "。" + s.items.map((x) => esc(x.t)).join(";") : "无明显婚姻神煞"}</li>`,
      )
      .join("")}</ul>
    <h4 class="gl">近年与婚姻相关的流年线索</h4>${res.years.length ? `<ul class="cul">${res.years.map((y) => `<li><b>${y.y}年(${y.gz})</b> ${y.why}</li>`).join("")}</ul><p class="note">这是传统上“配偶宫逢合、红鸾天喜”的年份,只表示感情话题容易被推动,不是婚期的结论。</p>` : '<p class="dim sm">未来几年没有明显的相关线索。</p>'}`;
  } else if (res.pair) {
    extra = `<h4 class="gl">十神互看与地支</h4><ul class="cul pl">${res.pair.lines.map((l) => `<li class="${l.tone > 0.4 ? "good" : l.tone < -0.4 ? "bad" : ""}"><b>${l.k}</b> ${esc(l.t).replace(/\n/g, "<br>")}</li>`).join("")}</ul>`;
  }
  const kindNote =
    HP2.mode === "marry"
      ? "合婚比较项:生肖(年支)、日柱与配偶宫、夫妻星(男看财、女看官杀)与配偶宫十神、双方五行喜用互补、日主强弱搭配、月柱、孤辰寡宿红鸾天喜、近六年流年同步。八项按权重加成综合分,再换算成“在随机配对中的位置”。"
      : "关系视角比较项见上方各维度;综合分同样换算成“在随机配对中的位置”。";
  return `${warn}<div class="hpwrap">${hpPillars(A, "甲方")}${hpPillars(B, "乙方")}</div>${meta}
  <h4 class="gl">分项(点开看依据)</h4><div class="hpdims">${dimsH}</div>
  <div class="hpcols"><div><h4 class="gl">主要优势</h4>${prosH}</div><div><h4 class="gl">需要留意</h4>${consH}</div></div>${extra}
  <h4 class="gl">建议</h4><ul class="cul">${res.advice.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>
  ${hpRelHTML(A, B, res)}
  <p class="note">${kindNote}这是传统八字的结构性提示,不能替代对人的了解,更不是“能不能结婚”的结论:冲、刑、害表示磨合点,合表示容易靠近,都不是定数。两人互换位置,结果相同。</p>`;
}
function renderHepan(R) {
  const list = hpPersons();
  const sel = (id, cur, withMan) =>
    `<select id="${id}">${list
      .filter((x) => (id === "hpB" ? x.id !== HP2.a : true))
      .map(
        (x) => `<option value="${x.id}"${x.id === cur ? " selected" : ""}>${esc(x.label)}</option>`,
      )
      .join(
        "",
      )}${withMan ? `<option value="man"${cur === "man" ? " selected" : ""}>手动输入出生时间…</option>` : ""}</select>`;
  return `<div class="panel blk"><h3 class="sec">合盘 · 两人关系</h3>
  <div class="hpmodes" role="tablist">${HP_MODES.map(([k, n]) => `<button type="button" class="hpm${HP2.mode === k ? " on" : ""}" data-m="${k}" role="tab">${n}</button>`).join("")}</div>
  <div class="xkctl"><label>甲方${sel("hpA", HP2.a, false)}</label><label>乙方${sel("hpB", HP2.b, true)}</label>
   <span id="hpMan"${HP2.b === "man" ? "" : " hidden"} class="hpman"><label>乙方出生时间(北京时间)<input type="datetime-local" id="hpDt" value="${HP2.dt}" min="1901-01-01T00:00" max="2099-12-31T23:59"></label><label>性别<select id="hpG"><option value="0"${HP2.gender === "0" ? " selected" : ""}>女</option><option value="1"${HP2.gender === "1" ? " selected" : ""}>男</option></select></label><label>称呼<input type="text" id="hpN" maxlength="8" value="${esc(HP2.bname)}" placeholder="乙方"></label></span></div>
  <div id="hpBox">${hpBody()}</div></div>
  <div class="panel blk" id="hpAI">${aiCardHTML("pair")}</div>`;
}
function hpRefresh() {
  $("#hpBox").innerHTML = hpBody();
  hpBindBody();
  const ai = $("#hpAI");
  if (ai) {
    ai.innerHTML = aiCardHTML("pair");
    aiBind();
  }
}
function hpBindBody() {
  $$("#hpBox .hpd-h").forEach(
    (b) =>
      (b.onclick = () => {
        const k = b.parentNode.dataset.k;
        HP2.open[k] = !HP2.open[k];
        b.parentNode.classList.toggle("open", HP2.open[k]);
        b.parentNode.querySelector(".hpd-l").hidden = !HP2.open[k];
        b.querySelector("em").textContent = HP2.open[k] ? "收起" : "展开";
      }),
  );
  const sv = $("#hpSaveB");
  if (sv)
    sv.onclick = () => {
      const h = HP2.last;
      if (!h) return;
      const id = "p" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
      PPL.people.push({
        id,
        name: h.B.name,
        tag: "",
        gender: HP2.gender,
        dt: HP2.dt,
        lon: String(R.opt.lon),
        lat: String(R.opt.lat),
        solar: false,
        cal: "S",
        note: "",
      });
      if (!pplSave()) return false;
      pplAfterChange();
      HP2.b = id;
      toast("已存入人物册");
      renderHepanAll();
    };
  const sr = $("#hpSaveRel");
  if (sr)
    sr.onclick = () => {
      const h = HP2.last;
      if (!h) return;
      const role = $("#hpRole").value,
        n = pplNormRel(h.A.id, h.B.id, role);
      let rel = PPL.rels.find(
        (r) => (r.a === h.A.id && r.b === h.B.id) || (r.a === h.B.id && r.b === h.A.id),
      );
      if (rel) {
        rel.a = n.a;
        rel.b = n.b;
        rel.role = n.role;
      } else {
        rel = {
          id: "r" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
          a: n.a,
          b: n.b,
          role: n.role,
          note: "",
        };
        PPL.rels.push(rel);
      }
      rel.hm = { mode: HP2.mode, score: h.res.score, pct: h.res.pct, lv: h.res.lv, t: Date.now() };
      HP2.role = role;
      if (!pplSave()) return false;
      pplRefreshViews();
      toast("已保存到关系网");
      renderHepanAll();
    };
  const gn = $("#hpGoNet");
  if (gn)
    gn.onclick = () => {
      const h = HP2.last;
      const rel = PPL.rels.find(
        (r) => (r.a === h.A.id && r.b === h.B.id) || (r.a === h.B.id && r.b === h.A.id),
      );
      selectTab("net", true);
      setTimeout(() => {
        try {
          if (rel) netSelect({ t: "e", id: rel.id });
        } catch (e) {}
      }, 80);
    };
  const rs = $("#hpRole");
  if (rs)
    rs.onchange = () => {
      HP2.role = rs.value;
    };
}
function renderHepanAll() {
  const p = $("#pane-hepan");
  if (!p) return;
  p.innerHTML = renderHepan(R);
  bindHepan();
}
function bindHepan() {
  $$("#pane-hepan .hpm").forEach(
    (b) =>
      (b.onclick = () => {
        HP2.mode = b.dataset.m;
        HP2.role = "";
        renderHepanAll();
      }),
  );
  $("#hpA").onchange = (e) => {
    HP2.a = e.target.value;
    if (HP2.b === HP2.a) HP2.b = "man";
    renderHepanAll();
  };
  $("#hpB").onchange = (e) => {
    HP2.b = e.target.value;
    renderHepanAll();
  };
  const m = $("#hpDt");
  if (m) {
    const upd = () => {
      HP2.dt = $("#hpDt").value;
      HP2.gender = $("#hpG").value;
      HP2.bname = $("#hpN").value;
      hpRefresh();
    };
    m.onchange = upd;
    $("#hpG").onchange = upd;
    $("#hpN").onchange = upd;
  }
  hpBindBody();
  aiBind();
}
/* 关系网 → 合盘 */
function hpOpenFor(aId, bId, role) {
  const mode =
    Object.keys(HP_ROLE_BY).find((k) => HP_ROLE_BY[k].includes(role)) ||
    (PPL_ROLE[role] && PPL_ROLE[role].k === "parent" ? "parent" : "friend");
  HP2.mode = role === "spouse" || role === "lover" ? "marry" : mode;
  HP2.a = aId;
  HP2.b = bId;
  HP2.role = role;
  renderHepanAll();
  selectTab("hepan", true);
}

/* ================= 文字报告:详细版(默认)/ 简要版 ================= */
const RP = { lv: "full" };
let REP_LAST = null;
function repEnsureLevel() {
  const row = $("#repCopy") && $("#repCopy").parentNode;
  if (!row || $("#repLv")) return;
  const sel = document.createElement("select");
  sel.id = "repLv";
  sel.setAttribute("aria-label", "报告详细程度");
  sel.innerHTML = '<option value="full">详细版</option><option value="brief">简要版</option>';
  sel.value = RP.lv;
  sel.onchange = () => {
    RP.lv = sel.value;
    $("#repTxt").value = buildReport(R, RP.lv);
  };
  row.insertBefore(sel, row.firstChild);
}
function buildReport(R, lv) {
  return lv === "brief" ? buildReportBrief(R) : buildReportFull(R);
}
function buildReportFull(R) {
  const c = R.t.civ,
    bz = R.bz,
    D = R.deep,
    q = R.qm,
    mh = R.mh,
    zw = R.zw,
    lr = R.lr,
    y0 = nowBJ().y,
    male = R.opt.gender === "M";
  const L = [],
    SEC = [],
    H = (t) => {
      L.push("");
      L.push("■ " + t);
      L.push("─".repeat(30));
    },
    err = (n, e) => {
      L.push(`(${n}生成失败:${(e && e.message) || e})`);
      console.error(e);
    };
  const headEnd = () => {};
  const sec = (t, fn) => {
    H(t);
    const st = L.length;
    try {
      fn();
    } catch (e) {
      err(t, e);
    }
    SEC.push({ title: t, lines: L.slice(st) });
  };
  const nm = (($("#pname") && $("#pname").value) || "").trim(),
    now = nowBJ();
  L.push("【天机盘 · 详细报告】");
  L.push(`生成时间:${now.y}-${f2(now.m)}-${f2(now.d)} ${f2(now.h)}:${f2(now.mi)}(北京时间)`);
  L.push(
    `起局时间:${c.y}-${f2(c.m)}-${f2(c.d)} ${f2(c.h)}:${f2(c.mi)}${R.opt.solar ? `;真太阳时 ${f2(R.t.loc.h)}:${f2(R.t.loc.mi)}` : ""};经度 ${R.opt.lon}°E、纬度 ${R.opt.lat}°N`,
  );
  L.push(
    `${nm ? "姓名:" + nm + ";" : ""}性别:${male ? "男(乾造)" : "女(坤造)"};农历 ${lunarText(R.lunar)};太阳黄经 ${R.t.lon.toFixed(2)}°`,
  );
  if (typeof live !== "undefined" && live)
    L.push(
      "提示:当前为“实时流转”,以上是此刻的盘,不是出生盘。要看命盘请先填写出生时间并关闭实时流转。",
    );
  sec("一、八字命局", () => {
    L.push(
      "四柱  " +
        bz.pill.map((p, i) => ["年", "月", "日", "时"][i] + ":" + GAN[p.s] + ZHI[p.b]).join("  "),
    );
    bz.pill.forEach((p, i) => {
      const g = ganzhiIdx(p.s, p.b);
      L.push(
        `  ${["年柱", "月柱", "日柱", "时柱"][i]} ${GAN[p.s]}${ZHI[p.b]}  天干${i === 2 ? "日元" : shishen(bz.dm, p.s)}  地支藏干 ${CANG[p.b].map((s) => GAN[s] + "(" + shishen(bz.dm, s) + ")").join(" ")}  纳音 ${NAYIN[g >> 1]}`,
      );
    });
    if (bz.wx) {
      const t = bz.wx.reduce((a, b) => a + b, 0) || 1;
      L.push(
        "五行分布(天干+藏干计):" +
          bz.wx
            .map((v, i) => WXK[i] + " " + (+v).toFixed(1) + "(" + Math.round((v / t) * 100) + "%)")
            .join("  "),
      );
    }
    L.push(
      `日主 ${GAN[bz.dm]}${WXK[GAN_WX[bz.dm]]},${D.st.season}令,${D.st.level}${D.st.deLing !== undefined ? `(${D.st.deLing ? "得令" : "不得令"})` : ""}`,
    );
    L.push(`格局:${D.gj.name}${D.gj.note ? "。" + D.gj.note : ""}`);
    L.push(
      `取用:喜 ${D.xy.favor.map((x) => WXK[x]).join("")}(方位 ${D.xy.favor.map((x) => FATE_WXDIR[x]).join(";")};色系 ${D.xy.favor.map((x) => FATE_COLOR[x]).join(";")});忌 ${D.xy.avoid.map((x) => WXK[x]).join("") || "—"}${D.xy.notes && D.xy.notes.length ? "。" + D.xy.notes.join(";") : ""}`,
    );
    L.push(
      `命宫 ${GAN[D.ex.ming.s] + ZHI[D.ex.ming.b]}  身宫 ${GAN[D.ex.shen.s] + ZHI[D.ex.shen.b]}  胎元 ${GAN[D.ex.tai.s] + ZHI[D.ex.tai.b]}`,
    );
    if (D.rel.length) {
      L.push("合冲刑害:");
      D.rel.forEach((r) => L.push("  · " + r.txt));
    }
    if (D.ss.length) {
      L.push("神煞:");
      D.ss.forEach((s) =>
        L.push(`  · ${s.n}(${s.where.join("")}) ${s.tone}${s.desc ? ":" + s.desc : ""}`),
      );
    }
    L.push("大运(起运岁数 · 干支 · 十神 · 倾向):");
    dayunTable(bz, D).forEach((d) =>
      L.push(
        `  ${String(Math.floor(d.startAge)).padStart(2)}岁起  ${d.gz}  ${d.ss}  ${d.lv}${d.notes.length ? "  " + d.notes.join("、") : ""}`,
      ),
    );
    L.push(`流年(${y0 - 1}—${y0 + 10}):`);
    liunian(bz, D, y0 - 1, 12).forEach((x) =>
      L.push(
        `  ${x.y}年 ${x.gz}  ${x.ss}  ${x.lv}${x.notes.length ? "  " + x.notes.join("、") : ""}${x.y === y0 ? "  ← 今年" : ""}`,
      ),
    );
    L.push(`${y0}年流月(以交节为界):`);
    liuyue(bz, D, y0).forEach((m) =>
      L.push(
        `  ${m.name}月 ${m.gz}  ${m.ss}  ${m.lv}${m.notes.length ? "  " + m.notes.join("、") : ""}`,
      ),
    );
    try {
      const rd = bzReading(bz, D, R.opt.gender, R.lunar, y0);
      L.push("规则解读要点:");
      rd.summary.forEach((s) => L.push("  ★ " + s.text));
      rd.sections.forEach((s) => {
        L.push(`  【${s.title}】`);
        s.items.forEach((i) => L.push(`    ${i.k}:${String(i.t).replace(/\n/g, " ")}`));
      });
    } catch (e) {
      err("八字解读", e);
    }
  });
  sec("二、紫微斗数", () => {
    L.push(
      `命宫 ${ZHI[zw.ming]}  身宫 ${ZHI[zw.shen]}  ${zw.juName}  紫微在${ZHI[zw.z]}  命主 ${zw.mingStar}  身主 ${zw.shenStar}  生年四化 ${zw.sihua.join(" ")}`,
    );
    L.push("十二宫(宫位 · 地支 · 主星与辅星 · 大限):");
    zw.pal.forEach((p) =>
      L.push(
        `  ${p.name}宫${p.isMing ? "[命]" : ""}${p.isShen ? "[身]" : ""} ${ZHI[p.b]}  ${p.stars.map((s) => s.n + (s.br ? "(" + s.br + ")" : "") + (s.h ? "化" + s.h : "")).join(" ") || "(无主星)"}  大限 ${p.dx ? p.dx.join("—") : ""}  ${p.cs || ""}${p.adj && p.adj.length ? "  杂曜:" + p.adj.slice(0, 6).join("、") : ""}`,
      ),
    );
    try {
      const z = ziweiReading(zw, R.lunar, R.opt.gender, y0);
      L.push("规则解读要点:");
      z.summary.forEach((s) => L.push("  ★ " + s.text));
      z.sections
        .filter((s) => !/杂曜神煞/.test(s.title))
        .forEach((s) => {
          L.push(`  【${s.title}】`);
          s.items.forEach((i) => L.push(`    ${i.k}:${String(i.t).replace(/\n/g, " ")}`));
        });
    } catch (e) {
      err("紫微解读", e);
    }
  });
  sec("三、奇门遁甲(起局时刻)", () => {
    L.push(
      `${q.yang ? "阳" : "阴"}遁${PNUM[q.ju]}局(${q.term}${q.yuanName})  时柱 ${q.hourGZ}  值符 天${q.zfStar}落${PNAME[q.q]}${PNUM[q.q]}宫  值使 ${q.zsDoor}门落${PNAME[q.rr]}${PNUM[q.rr]}宫  ${q.fuyin ? "伏吟 " : ""}${q.fanyin ? "反吟 " : ""}${q.wubuyu ? "五不遇时" : ""}`,
    );
    if (q.kongP)
      L.push(
        `空亡宫:${[]
          .concat(q.kongP)
          .map((p) => PNAME[p] + PNUM[p])
          .join("、")}  驿马宫:${q.horseP ? PNAME[q.horseP] + PNUM[q.horseP] : "—"}`,
      );
    L.push("九宫(宫 · 方位 · 八门 · 九星 · 八神 · 天盘干/地盘干 · 格局 · 提示):");
    [4, 9, 2, 3, 5, 7, 8, 1, 6].forEach((p) => {
      if (p === 5) {
        L.push("  中五宫 寄坤二");
        return;
      }
      const x = q.cells[p],
        g = (x.geju || [])
          .concat(x.extra2 || [])
          .map((k) => k.n + (k.t ? "(" + k.t + ")" : ""))
          .join("、"),
        tg = (x.tags || []).map((k) => k.n).join("、");
      L.push(
        `  ${PNAME[p]}${PNUM[p]}宫(${PDIR[p]})  ${x.door}门  天${x.star}  ${x.god}  ${GAN[x.hs] !== undefined ? x.hs : x.hs}/${x.earth}  ${g || "—"}${tg ? "  [" + tg + "]" : ""}`,
      );
    });
    L.push("按事项问事(盘面倾向):");
    Object.keys(QM_TOPICS).forEach((t) => {
      try {
        const a = qimenAsk(R, t);
        L.push(`  ${t}:${a.verdict[0]}(${a.score > 0 ? "+" : ""}${a.score.toFixed(1)})`);
      } catch (e) {}
    });
    L.push(
      "结构较顺:" +
        q.best.map((p) => PDIR[p] + q.cells[p].door + "门").join("、") +
        ";偏阻:" +
        q.worst.map((p) => PDIR[p] + q.cells[p].door + "门").join("、"),
    );
  });
  sec("四、大六壬(起局时刻)", () => {
    L.push(
      `${lr.ge}(${lr.sub})  月将 ${lr.jiangName}  ${ZHI[lr.zj]}将加${ZHI[lr.hb]}时  ${lr.fuyin ? "伏吟 " : ""}${lr.fanyin ? "反吟" : ""}`,
    );
    if (lr.ke)
      L.push(
        "四课:" +
          lr.ke
            .map(
              (k, i) =>
                `第${i + 1}课 上${ZHI[k.u]}下${k.lIsGan ? GAN[k.l] : ZHI[k.l]}(${k.rel},${k.gen})`,
            )
            .join(";"),
      );
    L.push(
      "三传:" +
        lr.chu
          .map((x, i) => ["初", "中", "末"][i] + "传 " + ZHI[x.z] + "(" + x.gen + ")")
          .join(" → "),
    );
    if (lr.kong)
      L.push(
        "旬空:" +
          []
            .concat(lr.kong)
            .map((z) => ZHI[z])
            .join("、"),
      );
  });
  sec("五、梅花易数(时间起卦)", () => {
    L.push(`上卦 ${TRI[mh.up].n}(${mh.up})  下卦 ${TRI[mh.lo].n}(${mh.lo})  动爻 第${mh.mv}爻`);
    L.push(`本卦「${mh.ben.name}」→ 互卦「${mh.hu.name}」→ 变卦「${mh.bian.name}」`);
    L.push(
      `体 ${TRI[mh.ti].n}(${WXK[TRI[mh.ti].wx]})  用 ${TRI[mh.yong].n}(${WXK[TRI[mh.yong].wx]})  ${mh.verdict[0]}(${mh.verdict[1]}):${mh.verdict[2]}`,
    );
    [mh.ben, mh.hu, mh.bian].forEach((h, i) => {
      if (typeof HEXTXT !== "undefined" && HEXTXT[h.name])
        L.push(`  ${["本", "互", "变"][i]}卦 ${h.name}:${HEXTXT[h.name]}`);
    });
  });
  sec("六、天象与五运六气", () => {
    const A = R.astro;
    L.push(
      "行星黄经:" +
        A.planets
          .map((p) => `${p.n}${p.sign[0]}${p.deg.toFixed(1)}°${p.retro ? "(逆)" : ""}`)
          .join("  "),
    );
    L.push(
      `月相:${A.moon.name};${A.yq.gz}年 ${A.yq.yunName};司天 ${A.yq.siTian};在泉 ${A.yq.zaiQuan}`,
    );
    if (A.yq.tip) L.push("  " + A.yq.tip);
  });
  sec("七、八宅命卦与方位", () => {
    const bh = bazhaiOf(R);
    L.push(`命卦:${bh.mg.name}`);
    bh.dirs.forEach((d) => L.push(`  ${d.n}:${d.dir}(${d.g}) ${d.t}${d.d ? "——" + d.d : ""}`));
  });
  sec(`八、${y0}年事项运势倾向(个人八字)`, () => {
    const P = { name: nm || "本人", gender: male ? "1" : "0", bz, deep: D };
    L.push(
      "流年" +
        gz((((y0 - 4) % 60) + 60) % 60) +
        ";犯太岁:" +
        (fateTaisui(P, y0)
          .items.map((x) => x.name)
          .join("、") || "无"),
    );
    FATE_ORDER.forEach((s) => {
      const y = fateYear(P, s, y0);
      L.push(
        FATE_SCN[s].grave
          ? `  ${s}:只看避忌,不作运势判断`
          : `  ${s}:${y.label}(${y.p})${y.notes.length ? "  " + y.notes.join("、") : ""}`,
      );
    });
    L.push("(各事项的逐月走势与吉日,请在「事项运势」页查看。)");
  });
  sec("九、个人指南要点", () => {
    const g = guideReading(R, y0);
    g.summary.forEach((x) => L.push("  ★ " + x.text));
    g.sections.forEach((s) => {
      L.push(`  【${s.title}】`);
      s.items.forEach((i) => L.push(`    ${i.k}:${String(i.t).replace(/\n/g, " ")}`));
    });
  });
  sec("十、起局当日黄历", () => {
    const di = dayInfo(c.y, c.m, c.d);
    L.push(
      `${di.gz}日(${di.nayin})  建除 ${di.zx}日  二十八宿 ${di.xiu}  天神 ${di.ts}${di.huang ? "(黄道)" : "(黑道)"}${di.chong ? "  冲 " + di.chong : ""}`,
    );
    L.push("宜:" + (di.yi.join("、") || "诸事不宜"));
    L.push("忌:" + (di.ji.join("、") || "—"));
  });
  if (typeof PPL !== "undefined" && PPL.people.length >= 2)
    sec("十一、人物关系册与关系图", () => {
      const P = PPL.people.map(pplEng).filter(Boolean),
        by = Object.fromEntries(P.map((p) => [p.id, p]));
      L.push(
        "人物:" +
          P.map((p) => `${p.name}(${p.bz.pill.map((x) => GAN[x.s] + ZHI[x.b]).join(" ")})`).join(
            ";",
          ),
      );
      PPL.rels.slice(0, 16).forEach((r) => {
        const a = by[r.a],
          b = by[r.b];
        if (!a || !b) return;
        const pr = pplPair(a, b);
        L.push(
          `  ${a.name} — ${b.name}(${PPL_ROLE[r.role].n}):${pr.verdict},倾向分 ${pr.T > 0 ? "+" : ""}${pr.T.toFixed(1)}${r.hm ? `;合盘 高于约 ${esc(r.hm.pct)}% 的随机配对(${esc(r.hm.lv)})` : ""}`,
        );
      });
    });
  L.push("");
  L.push("─".repeat(30));
  L.push(
    "说明:本报告由程序按传统术数的通行口径排盘并做规则化提示,各体系的“倾向”是机械加减的结果,没有外部标准可验证吉凶,不构成任何决策、医疗、法律或投资建议。",
  );
  REP_LAST = { L, SEC };
  return L.join("\n");
}

/* ================= 术数各模块:“启动推演” ================= */
const DV = {
  mods: { qimen: "奇门遁甲", liuren: "大六壬", liuyao: "六爻纳甲", yi: "梅花易数", xk: "玄空飞星" },
  busy: false,
};
function dvDecorate() {
  Object.keys(DV.mods).forEach((id) => {
    const pane = $("#pane-" + id);
    if (!pane) return;
    const first = pane.querySelector(".panel.blk");
    if (!first) return;
    first.classList.add("dv-host");
    const c = R && R.t && R.t.civ,
      box = document.createElement("div");
    box.className = "dvbox";
    box.innerHTML = `<span class="dvst">起局 ${c ? `${f2(c.m)}-${f2(c.d)} ${f2(c.h)}:${f2(c.mi)}` : ""}</span><button type="button" class="gbtn sm dvbtn" data-mod="${id}" title="按此刻重新起局:圆盘转动,并更新本页与其他页的数据">启动推演</button>`;
    first.insertBefore(box, first.firstChild);
    box.querySelector("button").onclick = () => startDerive(id);
    if (DV.busy) box.querySelector("button").disabled = true;
  });
}
async function startDerive(id) {
  if (DV.busy) return;
  DV.busy = true;
  STU.pendingSource = DV.mods[id] || "综合推演";
  $$(".dvbtn").forEach((b) => {
    b.disabled = true;
  });
  const btn = $(`.dvbtn[data-mod="${id}"]`);
  if (btn) btn.textContent = "推演中…";
  const wasLive = live;
  let c = nowBJ();
  try {
    for (let i = 0; i < 120 && running; i++) await sleep(100); // 若已有推演在进行,等它结束再开始
    c = nowBJ();
    setDt(c);
    if (id === "liuyao") LYS.mode = "time";
    if (id === "xk") XKS.flow = c.y;
    await deduce(c, "full");
  } catch (e) {
    console.error(e);
    toast("推演失败:" + ((e && e.message) || e));
  } finally {
    DV.busy = false;
    $$(".dvbtn").forEach((b) => {
      b.disabled = false;
      b.textContent = "启动推演";
    });
    const host = $(`#pane-${id} .dv-host`);
    if (host) {
      host.classList.remove("dvflash");
      void host.offsetWidth;
      host.classList.add("dvflash");
      setTimeout(() => host.classList.remove("dvflash"), 1800);
    }
    toast(
      `${DV.mods[id]}已按此刻 ${f2(c.h)}:${f2(c.mi)} 重新推演${wasLive ? "" : "(顶部时间已设为此刻;点人物卡的“重新推演”可回到出生盘)"}`,
    );
  }
}

/* ================= 顶部固定目录导航 ================= */
const NAV_D = {
  g: [
    {
      g: "天时",
      ask: "看此刻的天象与节令",
      it: [
        [
          "now",
          "此刻",
          "实时时辰、日出日落、未来 24 小时",
          "现在 当下 时辰 日出 日落 月相 农历 干支 天人感应 五运六气 报时",
        ],
        [
          "season",
          "时令",
          "节气物候、数九、三伏、花信",
          "节气 物候 七十二候 数九 三伏 花信 二十四节气 养生 时令与你",
        ],
        [
          "astro",
          "天象",
          "行星、相位、日月图解、3D 运转、五运六气",
          "行星 相位 星盘 月相 日月 升落 方位 3d 运转 太阳系 五运六气 黄道",
        ],
        ["xingkong", "星空", "二十八宿星图、值日宿", "星图 二十八宿 星宿 值日宿 夜空 星座"],
        ["jingluo", "经络", "子午流注、十二经络示意", "子午流注 经络 十二时辰 养生 当令 穴位"],
      ],
    },
    {
      g: "命局",
      ask: "看一个人的命盘",
      it: [
        [
          "over",
          "总览",
          "命局速览、综合方位、AI 解读、文字报告",
          "总览 速览 命盘 报告 pdf ai 解读 综合 方位 罗盘 启动推演",
        ],
        ["guide", "个人指南", "优势、短板、近期节奏", "指南 优势 短板 性格 近期 运势 节奏 建议"],
        [
          "bazi",
          "八字",
          "四柱、十神、大运流年、互动细盘、校时对照",
          "八字 四柱 十神 大运 流年 流月 流日 藏干 神煞 日主 喜用 真太阳时 校时 互动",
        ],
        [
          "ziwei",
          "紫微斗数",
          "十二宫、四化、大限流年",
          "紫微 斗数 十二宫 四化 大限 流年 流月 命宫 主星",
        ],
        [
          "qizheng",
          "七政四余",
          "果老星宗本命、十二宫",
          "七政 四余 果老 星宗 本命 十二宫 命宫 身宫",
        ],
        [
          "natal",
          "星盘",
          "本命、太阳回归、次限、组合盘、四种宫位制、阿拉伯点",
          "星盘 西方占星 本命盘 太阳回归 次限 组合盘 宫位制 普拉西德 整宫 等宫 上升 中天 福点 相位 星座 生日盘 流年",
        ],
        [
          "vedic",
          "吠陀占星",
          "恒星黄道、27宿、Vimshottari大运、D1/D9、五支历",
          "吠陀 印度占星 jyotish 恒星黄道 岁差 27宿 nakshatra 大运 vimshottari dasha 九分盘 navamsa 五支历 panchanga tithi 月宿",
        ],
        [
          "people",
          "人物关系册",
          "统一人物主库、独立档案ID、关系管理与跨模块接口",
          "人物关系册 人物库 人物档案 人物 主库 家人 朋友 亲友 保存 多人 独立ID 数据接口",
        ],
        [
          "net",
          "关系图",
          "读取人物关系册生成可视化关系网络",
          "关系图 关系网 人物 关系 家谱 家人 网络 五行 扶持",
        ],
        ["hepan", "合盘 · 合婚", "两人八字契合度", "合婚 合盘 配对 感情 夫妻 对象 合不合 缘分"],
      ],
    },
    {
      g: "占测",
      ask: "问一件具体的事",
      it: [
        [
          "qimen",
          "奇门遁甲",
          "时家转盘、按事项问事",
          "奇门 遁甲 问事 占事 九宫 八门 九星 八神 时家 出行 求财 官司",
        ],
        ["liuren", "大六壬", "四课三传、天将", "六壬 四课 三传 天将 天地盘 占事"],
        ["jinkou", "金口诀", "月将加时、四位五动", "金口诀 月将 地分 人元 贵神 将神 占事"],
        [
          "liuyao",
          "六爻纳甲",
          "装卦、六亲六神、大衍筮法",
          "六爻 纳甲 装卦 六亲 六神 世应 大衍 筮法 摇卦 起卦 铜钱",
        ],
        ["yi", "梅花易数", "时间与数字起卦、体用", "梅花 易数 起卦 体用 数字 本卦 互卦 变卦"],
        ["taiyi", "太乙神数", "年家排盘、三算五将", "太乙 神数 年家 三算 五将 三门 宏观"],
        ["cezi", "测字", "拆字、取卦、奇门映照", "测字 拆字 字义 笔画 取卦 一字"],
        [
          "fun",
          "占断",
          "小六壬、灵签、灵根、数理",
          "小六壬 灵签 观音 关帝 月老 抽签 灵根 修仙 号码 数理 手机号 占断",
        ],
      ],
    },
    {
      g: "择办",
      ask: "择日、起名、选址",
      it: [
        [
          "zeri",
          "择日",
          "黄历宜忌、吉日",
          "择日 黄历 宜忌 吉日 万年历 结婚 搬家 开业 入宅 动土 出行 日历",
        ],
        [
          "fate",
          "事项运势",
          "结婚、事业、看房、丧葬等八类",
          "事项 运势 结婚 事业 买房 看房 丧葬 求学 求医 出行 签约 开业",
        ],
        [
          "name",
          "姓名 · 取名",
          "五格、五行、开店取名",
          "姓名 取名 起名 改名 五格 五行 笔画 店名 公司名 宝宝",
        ],
        [
          "house",
          "房屋方位",
          "坐向、明财位、八宅游年",
          "房屋 方位 风水 坐向 朝向 财位 八宅 游年 户型 大门 卧室 厨房",
        ],
        ["xk", "玄空飞星", "宅盘山向、流年", "玄空 飞星 宅盘 山向 三元 九运 流年 风水 罗盘"],
        [
          "luopan",
          "综合罗盘",
          "24山、三元龙、阴阳、兼向、空亡线、十二长生",
          "罗盘 24山 二十四山 三元龙 兼向 空亡 出卦 坐向 朝向 分金 长生",
        ],
        [
          "sha",
          "年度神煞方位",
          "太岁、岁破、三煞、岁德、五黄二黑、十二岁神",
          "太岁 岁破 三煞 劫煞 灾煞 岁煞 岁德 五黄 二黑 暗剑 动土 流年方位 岁神 风水",
        ],
        [
          "taisui",
          "犯太岁",
          "值冲刑破害合、未来12年、生肖换年口径",
          "犯太岁 太岁 本命年 生肖 冲 刑 破 害 合 属相 流年 立春 春节",
        ],
        [
          "jifang",
          "吉方共识",
          "奇门+玄空+气学+太岁三煞+八宅命卦八方并列",
          "吉方 方位 出行 往哪走 搬家 开业 奇门 八宅 命卦 东四命 西四命 共识",
        ],
      ],
    },
    {
      g: "数理",
      ask: "查卦、查表、算数",
      it: [
        [
          "zy",
          "周易",
          "64 卦原文、爻辞",
          "周易 易经 六十四卦 卦辞 爻辞 彖 象 原文 查卦 互卦 错卦 综卦",
        ],
        ["hetu", "河图洛书", "河洛数理、九宫合十五", "河图 洛书 九宫 数理 生数 成数 紫白 飞星"],
        [
          "jiazi",
          "甲子查表",
          "纳音、旬空、十神对照",
          "甲子 六十甲子 纳音 旬空 空亡 十神 干支 查表",
        ],
        [
          "bridge",
          "地支枢纽",
          "十二支在八字、紫微、六壬、辟卦、经络等体系中的对应",
          "地支 十二支 坐标 月将 月建 辟卦 星次 经络 长生 对应 联动 枢纽",
        ],
        [
          "tools",
          "命理工具",
          "称骨、数字能量、九星气学、梅花数字",
          "称骨 袁天罡 骨重 数字能量 手机号 车牌 门牌 九星 气学 本命星 梅花数字",
        ],
      ],
    },
    {
      g: "盘库",
      ask: "把多个盘叠在一起看",
      it: [
        [
          "studio",
          "盘库",
          "独立盘库入口：天机巨盘、罗经三盘及后续各类式盘",
          "盘库 巨盘 罗经 罗盘 三盘 地盘正针 人盘中针 天盘缝针 穿山七十二龙 透地六十龙 圆盘 叠合",
        ],
      ],
    },
    {
      g: "修习",
      ask: "读书、做功课、复盘",
      it: [
        [
          "lib",
          "天机书院",
          "经典书目、研习路径、概念辨析、功过格",
          "书目 书单 读书 经典 研习 路径 概念 辨析 名词 功过格 日课 三省 自省 相术 阅读",
        ],
        [
          "review",
          "复盘记录",
          "盘面、解释、行动、结果分开记",
          "复盘 记录 反馈 验证 应验 回看 对比 笔记 日记",
        ],
        [
          "verify",
          "校验与口径",
          "每个盘对拍了什么、样本多少、哪里没做",
          "校验 对拍 口径 准确 可信 来源 误差 验证 未实现 版本",
        ],
      ],
    },
  ],
  tasks: [
    ["我想看今天适合做什么", "zeri"],
    ["我想看我的八字", "bazi"],
    ["我想问一件事", "qimen"],
    ["两个人合不合", "hepan"],
    ["给孩子 / 店铺起名", "name"],
    ["看房子方位与财位", "house"],
    ["称骨、查号码吉凶", "tools"],
    ["读经典、做功课", "lib"],
  ],
};
const NAV_G = NAV_D.g.map((x) => ({ g: x.g, ask: x.ask, it: x.it }));
const NAV_RK = "tianjipan.nav.recent";
function navRecent() {
  try {
    return JSON.parse(localStorage.getItem(NAV_RK) || "[]").filter((id) =>
      NAV_G.some((x) => x.it.some((t) => t[0] === id)),
    );
  } catch (e) {
    return [];
  }
}
function navRecord(id) {
  try {
    const a = [id].concat(navRecent().filter((x) => x !== id)).slice(0, 6);
    localStorage.setItem(NAV_RK, JSON.stringify(a));
  } catch (e) {}
}
function navFind(id) {
  for (const x of NAV_G)
    for (const t of x.it)
      if (t[0] === id) return { g: x.g, id: t[0], n: t[1], d: t[2], k: t[3] || "" };
  return null;
}
function navSearch(q) {
  const ts = String(q || "")
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);
  if (!ts.length) return [];
  const out = [];
  NAV_G.forEach((x) =>
    x.it.forEach((t) => {
      const hay = (x.g + " " + t[1] + " " + t[2] + " " + (t[3] || "")).toLowerCase();
      if (ts.every((w) => hay.includes(w))) {
        const nm = t[1].toLowerCase();
        out.push({
          g: x.g,
          id: t[0],
          n: t[1],
          d: t[2],
          s: ts.reduce(
            (a, w) =>
              a + (nm.includes(w) ? 3 : 0) + ((t[3] || "").toLowerCase().includes(w) ? 1 : 0),
            0,
          ),
        });
      }
    }),
  );
  return out.sort((a, b) => b.s - a.s);
}
const NAVS = { open: -1 };
function navBuild() {
  if ($("#topnav")) return;
  const nav = document.createElement("nav");
  nav.id = "topnav";
  nav.className = "topnav";
  nav.setAttribute("aria-label", "目录导航");
  nav.innerHTML = `<div class="tn-in"><button type="button" class="tn-brand" id="tnHome" aria-label="回到页面顶部"><i>天机</i><b>天机盘</b></button>
   <div class="tn-groups" role="menubar"><button type="button" class="tn-b" data-go="home" role="menuitem">首页</button>${NAV_G.map((x, i) => `<button type="button" class="tn-b tn-g" data-g="${i}" role="menuitem" aria-haspopup="true" aria-expanded="false">${x.g}<em>▾</em></button>`).join("")}</div>
   <div class="tn-right"><span class="tn-cur" id="tnCur"></span><button type="button" class="tn-b" id="tnAll" aria-expanded="false">目录</button></div></div>
   <div class="tn-panel" id="tnPanel" hidden role="menu"></div>`;
  const back = document.createElement("div");
  back.id = "tnBack";
  back.className = "tn-back";
  back.hidden = true;
  document.body.insertBefore(nav, document.body.firstChild);
  document.body.appendChild(back);
  const panel = $("#tnPanel");
  const closeP = (refocus) => {
    const was = NAVS.open;
    panel.hidden = true;
    back.hidden = true;
    NAVS.open = -1;
    if (refocus && was !== -1) {
      const f = was === "all" ? $("#tnAll") : $(`.tn-g[data-g="${was}"]`, nav);
      if (f) f.focus();
    }
    $$(".tn-g", nav).forEach((b) => b.setAttribute("aria-expanded", "false"));
    $("#tnAll").setAttribute("aria-expanded", "false");
  };
  const itemHTML = (id, n, d, g) =>
    `<button type="button" class="tn-it" data-tab="${id}"><b>${n}</b><small>${d}</small></button>`;
  const openG = (i) => {
    if (NAVS.open === i) {
      closeP();
      return;
    }
    NAVS.open = i;
    NAVS.y0 = window.scrollY || 0;
    const colHTML = (x) =>
      `<div class="tn-col"><h5>${x.g}</h5><p class="tn-ask">${x.ask || ""}</p>${x.it.map(([id, n, d]) => itemHTML(id, n, d)).join("")}</div>`;
    const rec = navRecent().map(navFind).filter(Boolean).slice(0, 5);
    const top =
      i === "all"
        ? `<div class="tn-top"><div class="tn-search"><input type="search" id="tnQ" placeholder="想做什么?输入关键词,如:起名 / 结婚 / 风水 / 称骨 / 月相 / 合婚" autocomplete="off" spellcheck="false" aria-label="搜索功能"><span class="dim sm" id="tnQn"></span></div>
      <div class="tn-tasks" id="tnTasks">${NAV_D.tasks.map(([t, id]) => `<button type="button" class="tn-task" data-tab="${id}">${t}</button>`).join("")}</div>
      ${rec.length ? `<div class="tn-rec"><span class="dim sm">最近用过</span>${rec.map((r) => `<button type="button" class="tn-task rc" data-tab="${esc(r.id)}">${r.n}</button>`).join("")}</div>` : ""}</div>`
        : "";
    panel.innerHTML =
      '<button type="button" class="tn-x" aria-label="关闭目录">关闭 ✕</button>' +
      (i === "all"
        ? top +
          `<div class="tn-cols" id="tnCols">${NAV_G.map(colHTML).join("")}</div><div class="tn-res" id="tnRes" hidden></div>`
        : `<div class="tn-col one"><h5>${NAV_G[i].g}</h5><p class="tn-ask">${NAV_G[i].ask || ""}</p>${NAV_G[i].it.map(([id, n, d]) => itemHTML(id, n, d)).join("")}</div>`);
    panel.classList.toggle("all", i === "all");
    panel.hidden = false;
    back.hidden = false;
    $$(".tn-g", nav).forEach((b) => b.setAttribute("aria-expanded", String(+b.dataset.g === i)));
    $("#tnAll").setAttribute("aria-expanded", String(i === "all"));
    const src = i === "all" ? $("#tnAll") : $(`.tn-g[data-g="${i}"]`, nav);
    if (!panel.classList.contains("all") && window.innerWidth > 700) {
      const r = src.getBoundingClientRect();
      panel.style.left = Math.max(8, Math.min(window.innerWidth - 280, r.left)) + "px";
    } else panel.style.left = "";
    const wire = (root) =>
      $$(".tn-it,.tn-task", root).forEach(
        (b) =>
          (b.onclick = () => {
            closeP();
            navGo(b.dataset.tab);
          }),
      );
    wire(panel);
    $(".tn-x", panel).onclick = () => closeP(true);
    const q = $("#tnQ", panel);
    if (q) {
      const cols = $("#tnCols", panel),
        res = $("#tnRes", panel),
        cnt = $("#tnQn", panel);
      const run = () => {
        const v = q.value.trim(),
          r = navSearch(v);
        cols.hidden = !!v;
        res.hidden = !v;
        cnt.textContent = v ? (r.length ? `${r.length} 项` : "无匹配") : "";
        res.innerHTML = v
          ? r.length
            ? r
                .map(
                  (t) =>
                    `<button type="button" class="tn-it" data-tab="${t.id}"><b>${t.n} <em class="tn-tag">${t.g}</em></b><small>${t.d}</small></button>`,
                )
                .join("")
            : `<p class="dim">没有匹配“${esc(v)}”的功能。可以换个词,例如:起名、结婚、风水、月相、读书。</p>`
          : "";
        wire(res);
      };
      q.oninput = run;
      q.onkeydown = (e) => {
        if (e.key === "Enter") {
          const r = navSearch(q.value);
          if (r.length) {
            e.preventDefault();
            closeP();
            navGo(r[0].id);
          }
        }
      };
      if (window.innerWidth > 860) setTimeout(() => q.focus(), 30);
    }
  };
  $$(".tn-g", nav).forEach((b) => (b.onclick = () => openG(+b.dataset.g)));
  $("#tnAll").onclick = () => openG("all");
  $$("[data-go]", nav).forEach(
    (b) =>
      (b.onclick = () => {
        closeP();
        navScroll(b.dataset.go);
      }),
  );
  $("#tnHome").onclick = () => {
    closeP();
    window.scrollTo({ top: 0, behavior: REDUCE ? "auto" : "smooth" });
  };
  back.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    closeP();
  });
  document.addEventListener(
    "pointerdown",
    (e) => {
      if (!panel.hidden && !e.target.closest("#topnav") && e.target !== back) closeP();
    },
    true,
  );
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !panel.hidden) closeP(true);
  });
  window.addEventListener(
    "scroll",
    () => {
      if (
        !panel.hidden &&
        panel.scrollHeight <= panel.clientHeight + 2 &&
        Math.abs((window.scrollY || 0) - NAVS.y0) > 80
      )
        closeP();
    },
    { passive: true },
  );
  window.addEventListener("resize", () => {
    if (!panel.hidden) closeP();
  });
  const upd = () => {
    document.documentElement.style.setProperty("--navh", nav.offsetHeight + "px");
  };
  upd();
  window.addEventListener("resize", upd);
  if (window.ResizeObserver) new ResizeObserver(upd).observe(nav);
  navSync($(".tab.on") ? $(".tab.on").dataset.tab : "now", true);
}
function navOffset() {
  const n = $("#topnav"),
    l = $("#livebar");
  return (n ? n.offsetHeight : 0) + (l ? l.offsetHeight : 0) + 10;
}
function navScroll(where, tries) {
  tries = tries || 0;
  if (where === "dial" && typeof STU !== "undefined" && STU.active) {
    selectTab("now", false);
    setTimeout(() => navScroll("dial", (tries || 0) + 1), 120);
    return;
  }
  let el = null;
  if (where === "home") el = $("#persona");
  else if (where === "dial") {
    const d = $("#dial");
    el = d && (d.closest(".dialcard,.dial-wrap,.card,section") || d.parentElement);
    if (!el && tries < 12) {
      setTimeout(() => navScroll("dial", tries + 1), 100);
      return;
    }
  } else if (where === "tabs") el = $("#tabs");
  if (!el) return;
  const y = el.getBoundingClientRect().top + window.scrollY - navOffset();
  window.scrollTo({ top: Math.max(0, y), behavior: REDUCE ? "auto" : "smooth" });
}
function navGo(id) {
  selectTab(id, false);
  setTimeout(() => navScroll("tabs"), 30);
}
function navSync(id, quiet) {
  const nav = $("#topnav");
  if (!nav) return;
  if (!quiet && id) navRecord(id);
  let gi = -1,
    nm = "";
  NAV_G.forEach((x, i) =>
    x.it.forEach(([k, n]) => {
      if (k === id) {
        gi = i;
        nm = n;
      }
    }),
  );
  $$(".tn-g", nav).forEach((b) => b.classList.toggle("on", +b.dataset.g === gi));
  const c = $("#tnCur");
  if (c) c.textContent = nm ? `${NAV_G[gi].g} · ${nm}` : "";
}

/* ================= 命局各模块:导出 PDF =================
   在浏览器里排版成 A4 页面(使用你设备上的中文字体),每页压成 JPEG 嵌入 PDF,并叠加一层不可见的文字层,便于搜索与复制。
   不依赖任何外部库。保存走平台的 downloads 能力(本地打开时走浏览器下载)。 */
const PDFC = {
  W: 595.28,
  H: 841.89,
  S: 2,
  ML: 48,
  MR: 48,
  MT: 60,
  MB: 54,
  paper: "#fffdf8",
  ink: "#26211b",
  dim: "#7d705f",
  gold: "#9a7428",
  red: "#b03a28",
  line: "#dccfb2",
  soft: "#f6efde",
  wx: ["#2f8f4e", "#c8452e", "#a37a2c", "#7b8089", "#2f6fb0"],
  good: "#2f8f4e",
  bad: "#b03a28",
  FB: "'Noto Serif SC','Source Han Serif SC','Songti SC','STSong','SimSun','Noto Sans CJK SC','Microsoft YaHei',serif",
  FT: "'ZCOOL XiaoWei','Ma Shan Zheng','STKaiti','KaiTi','Noto Serif SC','Songti SC',serif",
};
const PDF_NOSTART = "，。、；：！？）》」』】”’,.;:!?)]}%…—";
