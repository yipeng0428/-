(() => {
  "use strict";
  const BUILD = "v193 · 2026-10-06 00:42 +08:00";
  const CFG = window.TJ_ACCOUNT_CONFIG || {};
  const DEVICE_KEY = "tianjipan.account.device.v1";
  const TOKEN_KEY = "tianjipan.account.session.v2";
  const MAP_KEY = "tianjipan.account.profilemap.v1";
  const SNAP_SCHEMA = "tianjipan.profile.snapshot.v1";
  const A = {
    me: null,
    cloud: [],
    busy: false,
    error: "",
    booted: false,
    modal: null,
    editId: null,
    lastMessage: "",
    tokenPresent: false,
  };

  function E(s) {
    try {
      return esc(String(s == null ? "" : s));
    } catch (_) {
      return String(s ?? "").replace(
        /[&<>"']/g,
        (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[m],
      );
    }
  }
  function apiBase() {
    return String(CFG.API_BASE || "").replace(/\/+$/, "");
  }
  function configured() {
    const s = apiBase();
    return /^https?:\/\//i.test(s) && !s.includes("YOUR-WORKER");
  }
  function getToken() {
    try {
      return localStorage.getItem(TOKEN_KEY) || "";
    } catch (_) {
      return "";
    }
  }
  function setToken(v) {
    try {
      if (v) localStorage.setItem(TOKEN_KEY, v);
      else localStorage.removeItem(TOKEN_KEY);
    } catch (_) {}
    A.tokenPresent = !!v;
  }
  function deviceId() {
    let id = "";
    try {
      id = localStorage.getItem(DEVICE_KEY) || "";
    } catch (_) {}
    if (!id) {
      try {
        id = crypto.randomUUID();
      } catch (_) {
        id = "dev-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2);
      }
      try {
        localStorage.setItem(DEVICE_KEY, id);
      } catch (_) {}
    }
    return id;
  }
  function resetDeviceId() {
    let id = "";
    try {
      id = crypto.randomUUID();
    } catch (_) {
      id = "dev-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2);
    }
    try {
      localStorage.setItem(DEVICE_KEY, id);
    } catch (_) {}
    return id;
  }
  function profileMap() {
    try {
      return JSON.parse(localStorage.getItem(MAP_KEY) || "{}") || {};
    } catch (_) {
      return {};
    }
  }
  function saveMap(m) {
    try {
      localStorage.setItem(MAP_KEY, JSON.stringify(m || {}));
    } catch (_) {}
  }
  function sameKey(name, dt) {
    return (
      String(name || "")
        .trim()
        .toLowerCase() +
      "|" +
      String(dt || "").trim()
    );
  }
  async function req(path, opt = {}) {
    if (!configured()) throw new Error("API_BASE 尚未配置");
    const ctl = new AbortController(),
      tm = setTimeout(() => ctl.abort(), Math.max(3000, Number(opt.timeout) || 9000));
    const headers = { Accept: "application/json", ...(opt.headers || {}) },
      token = getToken();
    if (token && !opt.noAuth) headers.Authorization = "Bearer " + token;
    const init = { method: opt.method || "GET", signal: ctl.signal, headers };
    if (opt.body !== undefined) {
      headers["Content-Type"] = "application/json";
      init.body = JSON.stringify(opt.body);
    }
    let r;
    try {
      r = await fetch(apiBase() + path, init);
    } catch (e) {
      if (e && e.name === "AbortError") throw new Error("账号服务连接超时");
      throw e;
    } finally {
      clearTimeout(tm);
    }
    let data = null;
    try {
      data = await r.json();
    } catch (_) {}
    if (!r.ok || !data?.ok) {
      const er = new Error(data?.error || "HTTP " + r.status);
      er.status = r.status;
      er.data = data;
      throw er;
    }
    return data;
  }
  function localPeople() {
    return window.PPL && Array.isArray(PPL.people) ? PPL.people : [];
  }
  function currentProfile() {
    return window.PPL && PPL.cur ? PPL.people.find((x) => x.id === PPL.cur) : null;
  }
  function compactSnapshot(p, includeChart = true) {
    let chart = null;
    if (includeChart) {
      try {
        const d = typeof pplDerive === "function" ? pplDerive(p) : null;
        if (d?.bz) {
          chart = {
            pillars: (d.bz.pill || []).map((x) => GAN[x.s] + ZHI[x.b]),
            day_master: d.bz.dm != null ? GAN[d.bz.dm] : "",
            captured_at: Math.floor(Date.now() / 1000),
          };
        }
      } catch (_) {}
    }
    return JSON.stringify({
      schema: SNAP_SCHEMA,
      profile_meta: {
        tag: p.tag || "",
        lon: String(p.lon ?? ""),
        lat: String(p.lat ?? ""),
        solar: !!p.solar,
        cal: p.cal || "S",
        fenye: p.fenye || "",
        place: p.place || "",
        local_id: p.id || "",
      },
      chart,
    });
  }
  function parseSnapshot(s) {
    try {
      return typeof s === "string" ? JSON.parse(s) : s || null;
    } catch (_) {
      return null;
    }
  }
  function cloudPayloadFromLocal(p, includeChart = true) {
    return {
      name: String(p.name || "人物")
        .trim()
        .slice(0, 60),
      gender: String(p.gender ?? ""),
      birth_datetime: String(p.dt || ""),
      birthplace: String(p.place || "").slice(0, 200),
      notes: String(p.note || "").slice(0, 2000),
      chart_snapshot: compactSnapshot(p, includeChart),
    };
  }
  function localFromCloud(c) {
    const s = parseSnapshot(c.chart_snapshot),
      m = s?.profile_meta || {},
      now = Date.now();
    return {
      id:
        m.local_id && typeof pplById === "function" && !pplById(m.local_id)
          ? m.local_id
          : typeof pplId === "function"
            ? pplId()
            : "p" + now.toString(36) + Math.random().toString(36).slice(2, 6),
      name: String(c.name || "人物").slice(0, 24),
      tag: (window.PPL_TAGS || []).includes?.(m.tag) ? m.tag : m.tag || "",
      gender: String(c.gender ?? "1") === "0" ? "0" : "1",
      dt: String(c.birth_datetime || "").replace(" ", "T"),
      lon: String(m.lon || "117.8"),
      lat: String(m.lat || "24.5"),
      solar: !!m.solar,
      cal: m.cal === "L" ? "L" : "S",
      note: String(c.notes || "").slice(0, 300),
      fenye: String(m.fenye || ""),
      place: String(c.birthplace || m.place || ""),
      createdAt: (+c.created_at || 0) * 1000 || now,
      updatedAt: (+c.updated_at || 0) * 1000 || now,
      source: "cloud",
    };
  }
  function importDetailToLocal(c) {
    if (!window.PPL || !Array.isArray(PPL.people)) return null;
    let p = PPL.people.find((x) => sameKey(x.name, x.dt) === sameKey(c.name, c.birth_datetime));
    if (!p) {
      p = localFromCloud(c);
      PPL.people.push(p);
    }
    const map = profileMap();
    map[p.id] = c.id;
    saveMap(map);
    try {
      pplSave();
      pplAfterChange?.();
    } catch (_) {}
    return p;
  }
  async function fetchCloud() {
    if (!A.me || A.me.is_anonymous) {
      A.cloud = [];
      return [];
    }
    const d = await req("/api/profiles");
    A.cloud = Array.isArray(d.profiles) ? d.profiles : [];
    return A.cloud;
  }
  async function fetchCloudDetail(id) {
    const d = await req("/api/profiles/" + encodeURIComponent(id));
    return d.profile || null;
  }
  async function bootstrap(openAfter = false) {
    if (A.busy) return;
    A.busy = true;
    A.error = "";
    A.tokenPresent = !!getToken();
    try {
      if (!configured()) {
        A.me = null;
        A.booted = true;
        return;
      }
      let token = getToken();
      if (token) {
        try {
          const d = await req("/api/auth/me");
          A.me = d.user || null;
        } catch (e) {
          if (e.status === 401) {
            setToken("");
            A.me = null;
          } else throw e;
        }
      }
      if (!A.me) {
        const d = await req("/api/auth/init", {
          method: "POST",
          body: { device_id: deviceId() },
          noAuth: true,
        });
        if (d.token) setToken(d.token);
        A.me = d.user || null;
      }
      if (A.me && !A.me.is_anonymous) {
        try {
          await fetchCloud();
        } catch (e) {
          A.error = e.message || String(e);
        }
      }
      A.booted = true;
    } catch (e) {
      A.error = e.message || String(e);
      A.booted = true;
    } finally {
      A.busy = false;
      syncNav();
      if (A.modal && !A.modal.hidden) render();
      if (openAfter) open();
    }
  }
  function ensureModal() {
    if (A.modal && A.modal.isConnected) return A.modal;
    const m = document.createElement("div");
    m.className = "tja-modal";
    m.id = "tjaModal";
    m.hidden = true;
    m.innerHTML =
      '<div class="tja-card" role="dialog" aria-modal="true" aria-label="我的档案"><div id="tjaBody"></div></div>';
    document.body.appendChild(m);
    A.modal = m;
    m.addEventListener("pointerdown", (e) => {
      if (e.target === m) close();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && A.modal && !A.modal.hidden) close();
    });
    return m;
  }
  function statusHTML() {
    if (!configured())
      return `<div class="tja-status"><div><strong>本地模式</strong><small>API_BASE 还没有配置。人物档案继续保存在当前浏览器 localStorage，现有排盘功能不受影响。</small></div><span class="pill">本地</span></div>`;
    if (A.error)
      return `<div class="tja-status"><div><strong>连接异常</strong><small>${E(A.error)}。本地人物档案仍可正常使用。</small></div><span class="pill bad">离线</span></div>`;
    if (!A.me)
      return `<div class="tja-status"><div><strong>正在建立匿名身份…</strong><small>首次访问生成 device_id，并从 Worker 获取一次性的 Bearer session token。</small></div><span class="pill">连接中</span></div>`;
    if (A.me.is_anonymous)
      return `<div class="tja-status"><div><strong>本地模式 · 匿名身份已就绪</strong><small>当前人物仍以本机 localStorage 为准。绑定邮箱后进入可跨设备恢复的云端档案模式。</small></div><span class="pill">匿名</span></div>`;
    return `<div class="tja-status"><div><strong>云端档案已连接</strong><small>${E(A.me.email || "已验证邮箱")} · 当前会话使用 Bearer Token；换设备时通过邮箱魔法链接登录。</small></div><span class="pill good">云端</span></div>`;
  }
  function localListHTML() {
    const ps = localPeople();
    if (!ps.length) return '<div class="tja-empty">本机还没有人物档案。</div>';
    return `<div class="tja-list">${ps.map((p) => `<div class="tja-item"><div><b>${E(p.name)}</b><small>${E(p.dt || "未填写出生时间")} ${p.place ? "· " + E(p.place) : ""}</small></div><div class="ops">${A.me && !A.me.is_anonymous ? `<button data-tja-upload="${E(p.id)}">存到云端</button>` : ""}<button data-tja-openlocal="${E(p.id)}">载入</button></div></div>`).join("")}</div>`;
  }
  function cloudListHTML() {
    if (!A.me || A.me.is_anonymous)
      return '<div class="tja-empty">绑定 / 登录邮箱后，这里显示云端档案。</div>';
    if (!A.cloud.length)
      return '<div class="tja-empty">云端还没有档案。可合并本地档案或新建云端档案。</div>';
    return `<div class="tja-list">${A.cloud.map((p) => `<div class="tja-item"><div><b>${E(p.name)}</b><small>${E(p.birth_datetime || "")} ${p.birthplace ? "· " + E(p.birthplace) : ""}<br>更新：${p.updated_at ? new Date(p.updated_at * 1000).toLocaleString() : "—"}</small></div><div class="ops"><button data-tja-loadcloud="${E(p.id)}">同步到本机</button><button data-tja-edit="${E(p.id)}">编辑</button><button class="danger" data-tja-del="${E(p.id)}">删除</button></div></div>`).join("")}</div>`;
  }
  function formHTML() {
    const p = A.editId ? A.cloud.find((x) => x.id === A.editId) : null;
    return `<div class="tja-form">
    <label>姓名 *<input id="tjaName" maxlength="60" value="${E(p?.name || "")}"></label>
    <label>性别<select id="tjaGender"><option value="1"${String(p?.gender ?? "1") === "1" ? " selected" : ""}>男</option><option value="0"${String(p?.gender ?? "") === "0" ? " selected" : ""}>女</option></select></label>
    <label>出生日期时间 *<input id="tjaBirth" type="datetime-local" value="${E((p?.birth_datetime || "").replace(" ", "T").slice(0, 16))}"></label>
    <label>出生地<input id="tjaPlace" maxlength="200" value="${E(p?.birthplace || "")}"></label>
    <label class="wide">备注<textarea id="tjaNotes" maxlength="2000">${E(p?.notes || "")}</textarea></label>
    <label class="tja-check"><input id="tjaSnap" type="checkbox" checked> 保存紧凑排盘快照（可选）</label>
    <div class="tja-actions wide"><button class="primary" id="tjaSaveCloud">${p ? "保存云端修改" : "新建云端档案"}</button>${p ? '<button id="tjaCancelEdit">取消编辑</button>' : ""}<button id="tjaUseCurrent">带入当前人物</button></div>
  </div>`;
  }
  function render() {
    const m = ensureModal(),
      body = m.querySelector("#tjaBody");
    if (!body) return;
    const localN = localPeople().length,
      cloudN = A.cloud.length;
    body.innerHTML = `<div class="tja-head"><div class="tja-head-main"><h2>我的档案</h2><p>打开即用 · 匿名先行 · Bearer Token · 邮箱魔法链接 · 云端人物档案</p></div><button class="tja-x" id="tjaClose">关闭 ✕</button></div>
  ${statusHTML()}
  ${A.lastMessage ? `<div class="tja-alert good">${E(A.lastMessage)}</div>` : ""}
  <div class="tja-grid">
    <section class="tja-panel"><h3>账号 <small>无密码</small></h3>
      <div class="tja-authrow"><input id="tjaEmail" type="email" autocomplete="email" placeholder="邮箱，用于绑定或新设备登录"><button id="tjaSendMagic"${configured() ? "" : " disabled"}>发送魔法链接</button></div>
      <p class="note">新邮箱：升级当前匿名身份；已存在邮箱：发送登录链接并切换到原云端账号。魔法链接 15 分钟有效，只能使用一次。</p>
      <div class="tja-actions"><button id="tjaRefresh"${A.me && !A.me.is_anonymous ? "" : " disabled"}>刷新云端</button><button id="tjaMerge"${A.me && !A.me.is_anonymous ? "" : " disabled"}>合并本地档案到云端</button><button id="tjaSyncDown"${A.me && !A.me.is_anonymous ? "" : " disabled"}>同步云端到本机</button>${A.me ? '<button id="tjaLogout">退出登录</button>' : ""}</div>
      <div class="tja-alert"><b>本机 ${localN} 份</b> · <b>云端 ${cloudN} 份</b><br>合并按“姓名 + 出生日期时间”完全相同去重；不会自动删除本地人物。</div>
      <h3 style="margin-top:12px">云端档案编辑</h3>${formHTML()}
    </section>
    <section class="tja-panel"><div class="tja-columns"><div><h3>本地人物 <small>localStorage</small></h3>${localListHTML()}</div><div><h3>云端人物 <small>D1</small></h3>${cloudListHTML()}</div></div></section>
  </div>
  <div class="tja-foot">会话凭据按新版需求存于本机 localStorage，并以 <code>Authorization: Bearer</code> 发送；不要在本站引入不可信第三方脚本。云端删除不会自动删除本机副本。</div>`;
    bindUI(body);
  }
  function open() {
    ensureModal();
    A.modal.hidden = false;
    document.body.style.overflow = "hidden";
    render();
    if (!A.booted) bootstrap(false);
  }
  function close() {
    if (A.modal) A.modal.hidden = true;
    document.body.style.overflow = "";
  }
  function navButton() {
    const right = document.querySelector("#topnav .tn-right");
    if (!right) return null;
    let b = document.getElementById("tnAccount");
    if (!b) {
      b = document.createElement("button");
      b.type = "button";
      b.className = "tn-b local";
      b.id = "tnAccount";
      b.textContent = "档案";
      b.title = "我的档案 · 本地 / 云端";
      b.onclick = open;
      right.insertBefore(b, right.querySelector("#tnAll") || right.firstChild);
    }
    return b;
  }
  function syncNav() {
    const b = navButton();
    if (!b) return;
    b.classList.remove("local", "cloud", "warn");
    if (A.error) b.classList.add("warn");
    else if (A.me && !A.me.is_anonymous) b.classList.add("cloud");
    else b.classList.add("local");
    b.title =
      A.me && !A.me.is_anonymous
        ? `我的档案 · ${A.me.email || "云端已连接"}`
        : "我的档案 · 本地模式";
  }
  function formPayload() {
    const name = (document.getElementById("tjaName")?.value || "").trim(),
      birth = document.getElementById("tjaBirth")?.value || "";
    if (!name) throw new Error("请填写姓名");
    if (!birth) throw new Error("请填写出生日期时间");
    let snap = null;
    if (document.getElementById("tjaSnap")?.checked) {
      const cp = currentProfile();
      snap = cp
        ? compactSnapshot(cp, true)
        : JSON.stringify({ schema: SNAP_SCHEMA, profile_meta: {}, chart: null });
    }
    return {
      name,
      gender: document.getElementById("tjaGender")?.value || "",
      birth_datetime: birth,
      birthplace: (document.getElementById("tjaPlace")?.value || "").trim(),
      notes: (document.getElementById("tjaNotes")?.value || "").trim(),
      chart_snapshot: snap,
    };
  }
  async function uploadLocal(id) {
    const p = localPeople().find((x) => x.id === id);
    if (!p) throw new Error("本地档案不存在");
    const map = profileMap(),
      rid = map[id],
      payload = cloudPayloadFromLocal(p, true);
    const d = rid
      ? await req("/api/profiles/" + encodeURIComponent(rid), { method: "PUT", body: payload })
      : await req("/api/profiles", { method: "POST", body: payload });
    if (d.profile?.id) {
      map[id] = d.profile.id;
      saveMap(map);
    }
    await fetchCloud();
    A.lastMessage = "已同步到云端：" + p.name;
  }
  async function mergeLocal() {
    await fetchCloud();
    const byKey = new Map(A.cloud.map((x) => [sameKey(x.name, x.birth_datetime), x]));
    const map = profileMap();
    let created = 0,
      linked = 0;
    for (const p of localPeople()) {
      const k = sameKey(p.name, p.dt),
        existing = byKey.get(k);
      if (existing) {
        map[p.id] = existing.id;
        linked++;
        continue;
      }
      const d = await req("/api/profiles", {
        method: "POST",
        body: cloudPayloadFromLocal(p, true),
      });
      if (d.profile) {
        map[p.id] = d.profile.id;
        byKey.set(k, d.profile);
        created++;
      }
    }
    saveMap(map);
    await fetchCloud();
    A.lastMessage = `合并完成：新增 ${created}，跳过重复 ${linked}`;
  }
  async function syncCloudToLocal() {
    await fetchCloud();
    let added = 0,
      linked = 0;
    for (const c of A.cloud) {
      const exists = localPeople().some(
        (x) => sameKey(x.name, x.dt) === sameKey(c.name, c.birth_datetime),
      );
      const full = await fetchCloudDetail(c.id);
      if (!full) continue;
      importDetailToLocal(full);
      exists ? linked++ : added++;
    }
    A.lastMessage = `云端同步完成：新增到本机 ${added}，已存在 ${linked}`;
  }
  function fillCurrent() {
    const p = currentProfile();
    if (!p) {
      A.lastMessage = "请先在首页载入或保存一个人物档案";
      render();
      return;
    }
    const set = (id, v) => {
      const e = document.getElementById(id);
      if (e) e.value = v ?? "";
    };
    set("tjaName", p.name);
    set("tjaGender", p.gender);
    set("tjaBirth", String(p.dt || "").slice(0, 16));
    set("tjaPlace", p.place || "");
    set("tjaNotes", p.note || "");
  }
  function setBusy(v) {
    A.busy = v;
    const card = A.modal?.querySelector(".tja-card");
    card?.classList.toggle("tja-busy", v);
  }
  async function action(fn) {
    if (A.busy) return;
    setBusy(true);
    A.lastMessage = "";
    A.error = "";
    try {
      await fn();
    } catch (e) {
      A.error = e.message || String(e);
    } finally {
      setBusy(false);
      syncNav();
      render();
    }
  }
  function bindUI(root) {
    root.querySelector("#tjaClose")?.addEventListener("click", close);
    root.querySelector("#tjaSendMagic")?.addEventListener("click", () =>
      action(async () => {
        const email = (root.querySelector("#tjaEmail")?.value || "").trim();
        if (!email) throw new Error("请输入邮箱");
        await req("/api/auth/bind", { method: "POST", body: { email } });
        A.lastMessage = "登录链接已发送，请查收邮件。链接 15 分钟有效，只能使用一次。";
      }),
    );
    root.querySelector("#tjaRefresh")?.addEventListener("click", () =>
      action(async () => {
        await fetchCloud();
        A.lastMessage = "云端档案已刷新";
      }),
    );
    root.querySelector("#tjaMerge")?.addEventListener("click", () => action(mergeLocal));
    root.querySelector("#tjaSyncDown")?.addEventListener("click", () => action(syncCloudToLocal));
    root.querySelector("#tjaLogout")?.addEventListener("click", () =>
      action(async () => {
        try {
          await req("/api/auth/logout", { method: "POST", body: {} });
        } finally {
          setToken("");
        }
        A.me = null;
        A.cloud = [];
        A.lastMessage = "已退出云端账号，本地人物档案没有删除。";
        resetDeviceId();
        await bootstrap(false);
      }),
    );
    root.querySelector("#tjaSaveCloud")?.addEventListener("click", () =>
      action(async () => {
        const payload = formPayload(),
          path = A.editId ? "/api/profiles/" + encodeURIComponent(A.editId) : "/api/profiles";
        await req(path, { method: A.editId ? "PUT" : "POST", body: payload });
        A.editId = null;
        await fetchCloud();
        A.lastMessage = "云端档案已保存";
      }),
    );
    root.querySelector("#tjaCancelEdit")?.addEventListener("click", () => {
      A.editId = null;
      render();
    });
    root.querySelector("#tjaUseCurrent")?.addEventListener("click", fillCurrent);
    root
      .querySelectorAll("[data-tja-upload]")
      .forEach((b) => (b.onclick = () => action(() => uploadLocal(b.dataset.tjaUpload))));
    root.querySelectorAll("[data-tja-openlocal]").forEach(
      (b) =>
        (b.onclick = () => {
          try {
            pplOpen?.(b.dataset.tjaOpenlocal);
            close();
          } catch (_) {}
        }),
    );
    root.querySelectorAll("[data-tja-loadcloud]").forEach(
      (b) =>
        (b.onclick = () =>
          action(async () => {
            const full = await fetchCloudDetail(b.dataset.tjaLoadcloud);
            if (!full) throw new Error("云端档案不存在");
            const p = importDetailToLocal(full);
            if (p) {
              try {
                pplOpen?.(p.id);
              } catch (_) {}
              A.lastMessage = "已同步到本机并载入：" + full.name;
            }
          })),
    );
    root.querySelectorAll("[data-tja-edit]").forEach(
      (b) =>
        (b.onclick = () => {
          A.editId = b.dataset.tjaEdit;
          render();
        }),
    );
    root.querySelectorAll("[data-tja-del]").forEach(
      (b) =>
        (b.onclick = () =>
          action(async () => {
            const c = A.cloud.find((x) => x.id === b.dataset.tjaDel);
            if (!c) return;
            if (!confirm(`确认删除云端档案“${c.name}”？本机副本不会自动删除。`)) return;
            await req("/api/profiles/" + encodeURIComponent(c.id), { method: "DELETE" });
            const map = profileMap();
            Object.keys(map).forEach((k) => {
              if (map[k] === c.id) delete map[k];
            });
            saveMap(map);
            await fetchCloud();
            A.lastMessage = "云端档案已删除";
          })),
    );
  }
  function handleAuthReturn() {
    try {
      const raw = String(location.hash || "");
      if (raw.startsWith("#tj_auth=")) {
        const token = decodeURIComponent(raw.slice(9));
        if (token) {
          setToken(token);
          history.replaceState(null, "", location.pathname + location.search);
          A.lastMessage = "邮箱验证成功，正在加载云端档案。";
          setTimeout(() => bootstrap(true), 60);
          return true;
        }
      }
      if (raw.startsWith("#tj_auth_error=")) {
        const code = decodeURIComponent(raw.slice(15));
        history.replaceState(null, "", location.pathname + location.search);
        A.lastMessage =
          code === "expired"
            ? "登录链接已失效或已使用，请重新发送。"
            : "邮箱验证失败，请重新发送登录链接。";
        setTimeout(open, 80);
        return true;
      }
    } catch (_) {}
    return false;
  }
  function boot() {
    navButton();
    syncNav();
    ensureModal();
    if (handleAuthReturn()) return;
    [350, 1200, 3200].forEach((ms) =>
      setTimeout(() => {
        navButton();
        syncNav();
      }, ms),
    );
    if (CFG.AUTO_BOOTSTRAP !== false) {
      const start = () => {
        const delay = Math.max(500, Number(CFG.BOOT_DELAY_MS) || 1400);
        setTimeout(() => bootstrap(false), delay);
      };
      if (window.__TJ_PERF_BOOT && !window.__TJ_PERF_BOOT.homepageReady) {
        window.addEventListener("tianji:homepage-ready", start, { once: true });
        setTimeout(() => {
          if (!A.booted) start();
        }, 4200);
      } else start();
    }
  }
  window.TianjiAccount = Object.freeze({
    version: "2.0.0",
    build: BUILD,
    open,
    close,
    bootstrap,
    state: () => ({
      configured: configured(),
      me: A.me,
      cloudCount: A.cloud.length,
      localCount: localPeople().length,
      error: A.error,
      tokenPresent: !!getToken(),
    }),
    mergeLocal,
    syncCloudToLocal,
    fetchCloud,
    deviceId,
  });
  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  else boot();
  try {
    const bv = document.getElementById("buildVersion");

    window.TianjiSystemV193 = {
      version: "v193",
      build: BUILD,
      accountBearerV2: true,
      baseline: "v192",
    };
  } catch (_) {}
})();
