(() => {
  "use strict";
  const BUILD = "V195";
  const LOCAL_CFG = window.TJ_NOTICE_CONFIG || {};
  const READ_KEY = "tianjipan.notice.read.v1";
  const DISMISS_KEY = "tianjipan.notice.dismissed.v1";
  const POLL_MS = 5 * 60 * 1000;
  let modal = null,
    currentId = null,
    serverNotices = [],
    admin = false,
    adminChecked = false,
    adminItems = [],
    adminEditId = null,
    pollTimer = 0;
  let noticeSettings = {
    ticker_enabled: LOCAL_CFG.tickerEnabled === true,
    popup_enabled: LOCAL_CFG.popupEnabled === true,
  };
  function normalizeNoticeSettings(x) {
    return {
      ticker_enabled: x?.ticker_enabled === true || x?.ticker_enabled === 1,
      popup_enabled: x?.popup_enabled === true || x?.popup_enabled === 1,
    };
  }
  function syncNoticeChannelClass() {
    const hasTicker = noticeSettings.ticker_enabled && active().some((x) => x.ticker);
    document.documentElement.classList.toggle("tj-notice-ticker-on", !!hasTicker);
  }

  function apiBase() {
    return String(window.TJ_ACCOUNT_CONFIG?.API_BASE || "").replace(/\/+$/, "");
  }
  function configured() {
    const s = apiBase();
    return /^https?:\/\//i.test(s) && !s.includes("YOUR-WORKER");
  }
  function token() {
    try {
      return localStorage.getItem("tianjipan.account.session.v2") || "";
    } catch (_) {
      return "";
    }
  }
  function E(s) {
    return String(s ?? "").replace(
      /[&<>"']/g,
      (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[m],
    );
  }
  function readSet(key) {
    try {
      return new Set(JSON.parse(localStorage.getItem(key) || "[]"));
    } catch (_) {
      return new Set();
    }
  }
  function saveSet(key, set) {
    try {
      localStorage.setItem(key, JSON.stringify([...set]));
    } catch (_) {}
  }
  function localActive() {
    return Array.isArray(LOCAL_CFG.notices)
      ? LOCAL_CFG.notices.filter((x) => x && x.active !== false)
      : [];
  }
  function active() {
    return serverNotices.length ? serverNotices : localActive();
  }
  function unreadCount() {
    const r = readSet(READ_KEY);
    return active().filter((x) => !r.has(x.id)).length;
  }
  function markRead(id) {
    if (!id) return;
    const s = readSet(READ_KEY);
    s.add(id);
    saveSet(READ_KEY, s);
    syncBadge();
  }
  function markAllRead() {
    const s = readSet(READ_KEY);
    active().forEach((x) => s.add(x.id));
    saveSet(READ_KEY, s);
    syncBadge();
  }
  function dismiss(id) {
    if (!id) return;
    const s = readSet(DISMISS_KEY);
    s.add(id);
    saveSet(DISMISS_KEY, s);
  }
  function headers(auth = true) {
    const h = { Accept: "application/json" },
      t = token();
    if (auth && t) h.Authorization = "Bearer " + t;
    return h;
  }
  async function getJSON(path, opt = {}) {
    if (!configured()) throw new Error("API_BASE 尚未配置");
    const ctl = new AbortController(),
      tm = setTimeout(() => ctl.abort(), 8000);
    const init = {
      method: opt.method || "GET",
      headers: { ...headers(opt.auth !== false), ...(opt.headers || {}) },
      signal: ctl.signal,
    };
    if (opt.body !== undefined) {
      init.headers["Content-Type"] = "application/json";
      init.body = JSON.stringify(opt.body);
    }
    let r;
    try {
      r = await fetch(apiBase() + path, init);
    } finally {
      clearTimeout(tm);
    }
    let d = null;
    try {
      d = await r.json();
    } catch (_) {}
    if (!r.ok || !d?.ok) {
      const e = new Error(d?.error || "HTTP " + r.status);
      e.status = r.status;
      throw e;
    }
    return d;
  }

  function ensureNoticeButton() {
    const right = document.querySelector("#topnav .tn-right");
    if (!right) return null;
    let b = document.getElementById("tnNotice");
    if (!b) {
      b = document.createElement("button");
      b.id = "tnNotice";
      b.type = "button";
      b.title = "消息与通知";
      b.setAttribute("aria-label", "消息与通知");
      b.innerHTML =
        '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6.5h16v11H4z"/><path d="m4 7 8 6 8-6"/></svg><span id="tnNoticeCount" hidden></span>';
      const anchor =
        document.getElementById("tnSettings") ||
        document.getElementById("tnAll") ||
        right.firstChild;
      right.insertBefore(b, anchor);
      b.addEventListener("click", () => openCenter());
    }
    return b;
  }
  function syncBadge() {
    ensureNoticeButton();
    const c = document.getElementById("tnNoticeCount"),
      n = unreadCount();
    if (!c) return;
    c.textContent = n > 99 ? "99+" : String(n);
    c.hidden = n < 1;
  }
  function tickerText() {
    if (!noticeSettings.ticker_enabled) return "";
    return active()
      .filter((x) => x.ticker)
      .map((x) => `${x.title}${x.summary ? " · " + x.summary : ""}`)
      .join("　◆　");
  }
  function ensureTicker() {
    let bar = document.getElementById("tjNoticeTicker"),
      text = tickerText();
    syncNoticeChannelClass();
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "tjNoticeTicker";
      bar.innerHTML =
        '<div class="tjn-ticker-in"><span class="tjn-ticker-label">道长通知</span><div class="tjn-ticker-viewport" id="tjnTickerView"><span class="tjn-ticker-track" id="tjnTickerTrack"></span></div><button class="tjn-ticker-mail" id="tjnTickerOpen">查看全部</button></div>';
      document.body.appendChild(bar);
      bar.querySelector("#tjnTickerView")?.addEventListener("click", () => openCenter());
      bar.querySelector("#tjnTickerOpen")?.addEventListener("click", () => openCenter());
    }
    const track = bar.querySelector("#tjnTickerTrack");
    if (track) {
      track.textContent = text || "暂无重要通知";
      track.style.setProperty(
        "--tjn-speed",
        Math.max(16, Number(LOCAL_CFG.tickerSpeed) || 32) + "s",
      );
    }
    bar.hidden = !text;
  }
  function ensureModal() {
    if (modal && modal.isConnected) return modal;
    modal = document.createElement("div");
    modal.id = "tjNoticeModal";
    modal.hidden = true;
    modal.innerHTML =
      '<div class="tjn-box" role="dialog" aria-modal="true" aria-label="消息与通知"><div id="tjnModalBody"></div></div>';
    document.body.appendChild(modal);
    modal.addEventListener("pointerdown", (e) => {
      if (e.target === modal) closeModal();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !modal.hidden) closeModal();
    });
    return modal;
  }
  function closeModal() {
    if (modal) modal.hidden = true;
    document.body.style.overflow = "";
  }
  function featureHTML(n, auto = false) {
    if (!n) return '<div class="tjn-empty">暂无通知。</div>';
    return `<article class="tjn-feature"><div class="meta">${auto ? "开屏通知 · " : ""}${E(n.published_at || "")}</div><h3>${E(n.title || "道长通知")}</h3><div class="body">${window.TianjiRuntime?.sanitizeHTML(n.body) || window.__TJ_V219?.sanitizeHTML(n.body) || `<p>${E(n.summary || "")}</p>`}</div><div class="tjn-actions"><button class="primary" data-tjn-close>知道了</button>${auto ? "<button data-tjn-dismiss>本条不再自动弹出</button>" : ""}</div></article>`;
  }
  function listHTML() {
    const r = readSet(READ_KEY),
      items = active();
    if (!items.length) return '<div class="tjn-empty">暂无通知。</div>';
    return `<div class="tjn-list">${items.map((n) => `<div class="tjn-item${r.has(n.id) ? "" : " unread"}" data-tjn-id="${E(n.id)}"><div><div class="meta">${E(n.published_at || "")}</div><b>${E(n.title || "通知")}</b><small>${E(n.summary || "")}</small></div><span class="dot"></span></div>`).join("")}</div>`;
  }
  function bindModal(root, auto = false) {
    root.querySelector("#tjnClose")?.addEventListener("click", closeModal);
    root.querySelector("#tjnMarkAll")?.addEventListener("click", () => {
      markAllRead();
      renderCenter();
    });
    root.querySelector("[data-tjn-close]")?.addEventListener("click", closeModal);
    root.querySelector("[data-tjn-dismiss]")?.addEventListener("click", () => {
      dismiss(currentId);
      closeModal();
    });
    root.querySelectorAll("[data-tjn-id]").forEach((el) =>
      el.addEventListener("click", () => {
        const n = active().find((x) => x.id === el.dataset.tjnId);
        if (!n) return;
        currentId = n.id;
        markRead(n.id);
        renderDetail(n);
      }),
    );
    root.querySelector("#tjnAdminOpen")?.addEventListener("click", renderAdmin);
  }
  function renderCenter() {
    const m = ensureModal(),
      body = m.querySelector("#tjnModalBody");
    currentId = null;
    body.innerHTML = `<header class="tjn-head"><div class="tjn-head-main"><h2>消息与通知</h2><p>道长通知 · 更新公告 · 使用提醒</p></div><button class="tjn-close" id="tjnClose">关闭 ✕</button></header><div class="tjn-content"><div class="tjn-adminbar"><button id="tjnMarkAll">全部标为已读</button><span class="spacer"></span>${admin ? '<button class="primary" id="tjnAdminOpen">站长控制台</button>' : ""}</div>${listHTML()}</div>`;
    bindModal(body, false);
  }
  function renderDetail(n, auto = false) {
    const m = ensureModal(),
      body = m.querySelector("#tjnModalBody");
    currentId = n?.id || null;
    if (n) markRead(n.id);
    body.innerHTML = `<header class="tjn-head"><div class="tjn-head-main"><h2>${auto ? "道长通知" : "消息详情"}</h2><p>${auto ? "天机盘开屏公告" : "站长发布的消息与通知"}</p></div><button class="tjn-close" id="tjnClose">关闭 ✕</button></header><div class="tjn-content">${featureHTML(n, auto)}${auto ? "" : '<div class="tjn-actions"><button id="tjnBack">← 返回消息列表</button></div>'}</div>`;
    bindModal(body, auto);
    body.querySelector("#tjnBack")?.addEventListener("click", renderCenter);
  }
  function openCenter() {
    ensureModal();
    modal.hidden = false;
    document.body.style.overflow = "hidden";
    renderCenter();
    syncBadge();
    checkAdmin()
      .then(() => {
        if (!modal.hidden && currentId === null) renderCenter();
      })
      .catch(() => {});
  }
  function openPopup(n) {
    if (!n) return;
    ensureModal();
    modal.hidden = false;
    document.body.style.overflow = "hidden";
    renderDetail(n, true);
  }
  function maybePopup() {
    if (!noticeSettings.popup_enabled) return;
    const dismissed = readSet(DISMISS_KEY),
      n = active().filter((x) => x.popup && !dismissed.has(x.id))[0];
    if (!n) return;
    setTimeout(
      () => {
        if (noticeSettings.popup_enabled) openPopup(n);
      },
      Math.max(350, Number(LOCAL_CFG.popupDelayMs) || 1400),
    );
  }

  /* ---------------- Cloud notices ---------------- */
  async function loadPublicNotices() {
    if (!configured()) return active();
    try {
      const d = await getJSON("/api/notices", { auth: false });
      serverNotices = Array.isArray(d.notices) ? d.notices : [];
      if (d.settings) noticeSettings = normalizeNoticeSettings(d.settings);
      ensureTicker();
      syncBadge();
    } catch (e) {
      console.warn("[Notices public]", e);
    }
    return active();
  }
  async function checkAdmin() {
    if (adminChecked) return admin;
    adminChecked = true;
    admin = false;
    if (!configured() || !token()) return false;
    try {
      const d = await getJSON("/api/admin/me");
      admin = !!d.is_admin;
    } catch (_) {
      admin = false;
    }
    return admin;
  }
  async function loadAdminItems() {
    const d = await getJSON("/api/admin/notices");
    adminItems = Array.isArray(d.notices) ? d.notices : [];
    return adminItems;
  }
  function blankAdmin() {
    return {
      id: "",
      title: "",
      summary: "",
      body: "",
      published_at: new Date().toISOString().slice(0, 10),
      popup: false,
      ticker: false,
      active: true,
      priority: 0,
    };
  }
  function adminItem() {
    return adminEditId
      ? adminItems.find((x) => x.id === adminEditId) || blankAdmin()
      : blankAdmin();
  }
  function adminListHTML() {
    if (!adminItems.length) return '<div class="tjn-empty">还没有云端通知。</div>';
    return adminItems
      .map(
        (n) =>
          `<div class="tjn-admin-row${adminEditId === n.id ? " on" : ""}" data-tjn-admin-id="${E(n.id)}"><div><b>${E(n.title)}</b><small>${E(n.published_at || "")} · ${n.ticker ? "跑马灯 " : ""}${n.popup ? "开屏 " : ""}</small></div><span class="state${n.active ? " live" : ""}">${n.active ? "已发布" : "已停用"}</span></div>`,
      )
      .join("");
  }
  function renderAdmin() {
    const m = ensureModal(),
      body = m.querySelector("#tjnModalBody"),
      n = adminItem();
    body.innerHTML = `<header class="tjn-head"><div class="tjn-head-main"><h2>站长控制台</h2><p>发布道长通知 · 跑马灯 · 开屏公告</p></div><button class="tjn-close" id="tjnClose">关闭 ✕</button></header><div class="tjn-content"><div class="tjn-adminbar"><button id="tjnAdminBack">← 消息中心</button><button id="tjnAdminRefresh">刷新</button><span class="spacer"></span><button class="primary" id="tjnAdminNew">＋ 新建通知</button></div><div class="tjn-global-switches"><strong>全站通知频道</strong><label><input id="tjnGlobalTicker" type="checkbox"${noticeSettings.ticker_enabled ? " checked" : ""}> 信息跑马灯</label><label><input id="tjnGlobalPopup" type="checkbox"${noticeSettings.popup_enabled ? " checked" : ""}> 开屏通知弹页</label><button id="tjnGlobalSave">保存频道开关</button><span class="state">关闭频道不会删除历史通知。</span></div><div class="tjn-adminshell"><aside class="tjn-admin-list" id="tjnAdminList">${adminListHTML()}</aside><section class="tjn-editor"><div class="tjn-form">
    <label class="wide">标题 *<input id="tjnAdminTitle" maxlength="100" value="${E(n.title)}" placeholder="例如：V195 更新通知"></label>
    <label>发布时间<input id="tjnAdminDate" type="date" value="${E((n.published_at || "").slice(0, 10))}"></label>
    <label>优先级<select id="tjnAdminPriority"><option value="0"${+n.priority === 0 ? " selected" : ""}>普通</option><option value="10"${+n.priority === 10 ? " selected" : ""}>重要</option><option value="20"${+n.priority === 20 ? " selected" : ""}>置顶</option></select></label>
    <label class="wide">摘要<input id="tjnAdminSummary" maxlength="220" value="${E(n.summary)}" placeholder="用于消息列表与跑马灯"></label>
    <label class="wide">正文 HTML<textarea id="tjnAdminBody" placeholder="<p>这里写通知正文</p>">${E(n.body)}</textarea></label>
    <div class="tjn-checks"><label><input id="tjnAdminPopup" type="checkbox"${n.popup ? " checked" : ""}> 首页首次开屏</label><label><input id="tjnAdminTicker" type="checkbox"${n.ticker ? " checked" : ""}> 加入跑马灯</label><label><input id="tjnAdminActive" type="checkbox"${n.active ? " checked" : ""}> 立即发布</label></div>
    <div class="tjn-editor-actions"><button class="primary" id="tjnAdminSave">${n.id ? "保存修改" : "发布新通知"}</button>${n.id ? '<button id="tjnAdminDuplicate">复制为新通知</button><button class="danger" id="tjnAdminDelete">删除</button>' : ""}<button id="tjnAdminPreview">预览</button></div>
    <div class="tjn-preview" id="tjnAdminPreviewBox"><b>使用说明：</b>“立即发布”开启后，保存即对所有用户生效；关闭则作为停用/草稿保存。跑马灯和开屏可独立控制。</div>
  </div><div class="tjn-admin-note">安全：控制台只对 Worker 环境变量 <code>ADMIN_EMAILS</code> 中的已验证邮箱开放。不要把管理员口令写进 HTML。</div></section></div></div>`;
    body.querySelector("#tjnClose")?.addEventListener("click", closeModal);
    body.querySelector("#tjnAdminBack")?.addEventListener("click", renderCenter);
    body.querySelector("#tjnAdminRefresh")?.addEventListener("click", () => refreshAdmin());
    body.querySelector("#tjnGlobalSave")?.addEventListener("click", saveGlobalNoticeSettings);
    body.querySelector("#tjnAdminNew")?.addEventListener("click", () => {
      adminEditId = null;
      renderAdmin();
    });
    body.querySelectorAll("[data-tjn-admin-id]").forEach((el) =>
      el.addEventListener("click", () => {
        adminEditId = el.dataset.tjnAdminId;
        renderAdmin();
      }),
    );
    body.querySelector("#tjnAdminSave")?.addEventListener("click", saveAdmin);
    body.querySelector("#tjnAdminDelete")?.addEventListener("click", deleteAdmin);
    body.querySelector("#tjnAdminDuplicate")?.addEventListener("click", () => {
      const x = readAdminForm();
      adminEditId = null;
      renderAdmin();
      setTimeout(
        () => fillAdminForm({ ...x, id: "", title: x.title + "（副本）", active: false }),
        0,
      );
    });
    body.querySelector("#tjnAdminPreview")?.addEventListener("click", () => {
      const x = readAdminForm(),
        box = body.querySelector("#tjnAdminPreviewBox");
      box.innerHTML = `<div class="meta">${E(x.published_at)}</div><h3 style="margin:5px 0">${E(x.title || "未填写标题")}</h3><div>${window.TianjiRuntime?.sanitizeHTML(x.body) || window.__TJ_V219?.sanitizeHTML(x.body) || `<p>${E(x.summary)}</p>`}</div>`;
    });
  }
  function readAdminForm() {
    const q = (id) => document.getElementById(id);
    return {
      id: adminEditId || "",
      title: (q("tjnAdminTitle")?.value || "").trim(),
      summary: (q("tjnAdminSummary")?.value || "").trim(),
      body: q("tjnAdminBody")?.value || "",
      published_at: q("tjnAdminDate")?.value || new Date().toISOString().slice(0, 10),
      priority: +(q("tjnAdminPriority")?.value || 0),
      popup: !!q("tjnAdminPopup")?.checked,
      ticker: !!q("tjnAdminTicker")?.checked,
      active: !!q("tjnAdminActive")?.checked,
    };
  }
  function fillAdminForm(x) {
    const set = (id, v) => {
      const e = document.getElementById(id);
      if (e) e.value = v ?? "";
    };
    set("tjnAdminTitle", x.title);
    set("tjnAdminDate", x.published_at);
    set("tjnAdminPriority", x.priority);
    set("tjnAdminSummary", x.summary);
    set("tjnAdminBody", x.body);
    const ck = (id, v) => {
      const e = document.getElementById(id);
      if (e) e.checked = !!v;
    };
    ck("tjnAdminPopup", x.popup);
    ck("tjnAdminTicker", x.ticker);
    ck("tjnAdminActive", x.active);
  }
  async function refreshAdmin() {
    try {
      await Promise.all([loadAdminItems(), loadPublicNotices()]);
      renderAdmin();
    } catch (e) {
      alert("读取通知失败：" + e.message);
    }
  }
  async function saveGlobalNoticeSettings() {
    const ticker_enabled = !!document.getElementById("tjnGlobalTicker")?.checked;
    const popup_enabled = !!document.getElementById("tjnGlobalPopup")?.checked;
    try {
      const d = await getJSON("/api/admin/notice-settings", {
        method: "PUT",
        body: { ticker_enabled, popup_enabled },
      });
      noticeSettings = normalizeNoticeSettings(d.settings || { ticker_enabled, popup_enabled });
      ensureTicker();
      renderAdmin();
    } catch (e) {
      alert("保存全站通知频道失败：" + e.message);
    }
  }
  async function saveAdmin() {
    const x = readAdminForm();
    if (!x.title) {
      alert("请填写通知标题");
      return;
    }
    try {
      if (adminEditId)
        await getJSON("/api/admin/notices/" + encodeURIComponent(adminEditId), {
          method: "PUT",
          body: x,
        });
      else await getJSON("/api/admin/notices", { method: "POST", body: x });
      await Promise.all([loadAdminItems(), loadPublicNotices()]);
      adminEditId = null;
      renderAdmin();
    } catch (e) {
      alert("保存失败：" + e.message);
    }
  }
  async function deleteAdmin() {
    if (!adminEditId) return;
    const n = adminItems.find((x) => x.id === adminEditId);
    if (!confirm(`确认删除通知“${n?.title || adminEditId}”？`)) return;
    try {
      await getJSON("/api/admin/notices/" + encodeURIComponent(adminEditId), { method: "DELETE" });
      adminEditId = null;
      await Promise.all([loadAdminItems(), loadPublicNotices()]);
      renderAdmin();
    } catch (e) {
      alert("删除失败：" + e.message);
    }
  }

  /* footer cleanup/version */
  function cleanFooter() {
    const footer = document.querySelector("footer");
    if (!footer) return;
    footer.querySelectorAll('span[id$="Badge"],[id*="Badge"]').forEach((x) => x.remove());
    /* V201：版本号由最终版本统一管理，旧通知模块不再参与写入，避免启动期 DOM 抖动。 */
  }

  function scheduleNoticePoll(delay = POLL_MS) {
    if (pollTimer) clearTimeout(pollTimer);
    pollTimer = setTimeout(
      async () => {
        pollTimer = 0;
        if (document.hidden) {
          scheduleNoticePoll(POLL_MS);
          return;
        }
        try {
          await loadPublicNotices();
        } catch (_) {}
        scheduleNoticePoll(POLL_MS);
      },
      Math.max(1000, Number(delay) || POLL_MS),
    );
  }
  document.addEventListener(
    "visibilitychange",
    () => {
      if (!document.hidden) scheduleNoticePoll(50);
    },
    { passive: true },
  );

  async function boot() {
    ensureNoticeButton();
    ensureTicker();
    ensureModal();
    syncBadge();
    cleanFooter();
    await loadPublicNotices();
    checkAdmin().catch(() => {});
    [400, 1600, 4200].forEach((ms) =>
      setTimeout(() => {
        ensureNoticeButton();
        ensureTicker();
        syncBadge();
        cleanFooter();
      }, ms),
    );
    maybePopup();
    scheduleNoticePoll(POLL_MS);
  }
  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  else boot();

  window.TianjiNotice = Object.freeze({
    version: "2.0.0",
    build: BUILD,
    open: openCenter,
    close: closeModal,
    notices: () => active().map((x) => ({ ...x })),
    unread: unreadCount,
    markAllRead,
    refresh: loadPublicNotices,
    admin: () => admin,
    settings: () => ({ ...noticeSettings }),
  });
  window.TianjiSystemV195 = {
    version: "v195",
    build: BUILD,
    noticeAdminConsole: true,
    cloudNotices: true,
    baseline: "v194",
  };
})();
