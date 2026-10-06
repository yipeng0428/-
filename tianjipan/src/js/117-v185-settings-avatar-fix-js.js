(() => {
  "use strict";
  const BUILD = "v185 · 2026-10-05 22:08 +08:00";

  /* 设置中心：阻止滚轮事件继续冒泡给页面级交互，但不 preventDefault，
   因此右侧内容仍由浏览器原生滚动。 */
  function fixSettingsScroll() {
    const main = document.querySelector("#tjsModal .tjs-main");
    if (!main || main.dataset.v185Scroll === "1") return;
    main.dataset.v185Scroll = "1";
    main.addEventListener("wheel", (e) => e.stopPropagation(), { passive: true });
    main.addEventListener("touchmove", (e) => e.stopPropagation(), { passive: true });
    main.setAttribute("tabindex", "0");
  }

  /* 头像 img 只在确认可显示后出现；加载失败自动回到空头像状态。 */
  function hardenAvatar(root) {
    if (!root || root.dataset.v185Avatar === "1") return;
    root.dataset.v185Avatar = "1";
    const img = root.querySelector(".v126-avpick img");
    if (!img) return;
    const outer = root.matches(".v126-avatar-field,.v126-book-avatar")
      ? root
      : root.closest(".v126-avatar-field,.v126-book-avatar");
    const fallback = () => {
      try {
        img.hidden = true;
        img.removeAttribute("src");
        outer?.classList.add("no-avatar");
      } catch (_) {}
    };
    img.addEventListener("error", fallback);
    if (!img.getAttribute("src")) fallback();
  }
  function fixAvatars() {
    document.querySelectorAll(".v126-avatar-field,.v126-book-avatar").forEach(hardenAvatar);
    /* 卡片真实头像失败时，不显示浏览器 broken-image 标识；
     卡片下一次重绘会恢复姓名首字占位。 */
    document
      .querySelectorAll(".prb55-avatar img,.prb-avatar img,.v126-chip-avatar,.ov130-avatar[src]")
      .forEach((img) => {
        if (img.dataset.v185Err === "1") return;
        img.dataset.v185Err = "1";
        img.addEventListener("error", () => {
          try {
            img.style.display = "none";
          } catch (_) {}
        });
      });
  }

  /* 包装设置 open/render 后补上滚动行为。 */
  try {
    if (window.TianjiSettings && typeof window.TianjiSettings.open === "function") {
      const old = window.TianjiSettings.open;
      /* Object.freeze 无法直接覆盖 API，所以通过设置入口点击后的微任务补绑即可。 */
      document.addEventListener(
        "click",
        (e) => {
          if (e.target.closest?.("#themeBtn,#tnSettings,#lbBellSet,[data-tjs-tab]")) {
            setTimeout(fixSettingsScroll, 0);
          }
        },
        true,
      );
    }
  } catch (_) {}

  fixSettingsScroll();
  fixAvatars();
  [80, 300, 900, 2200].forEach((ms) =>
    setTimeout(() => {
      fixSettingsScroll();
      fixAvatars();
    }, ms),
  );
  window.addEventListener("tianjipan:peoplechange", () => setTimeout(fixAvatars, 30));

  /* 只观察头像/设置弹窗局部，而不是整个 BODY。 */
  const scopedObserver = new MutationObserver((muts) => {
    let needSettings = false,
      needAvatar = false;
    for (const m of muts) {
      const t = m.target?.nodeType === 1 ? m.target : m.target?.parentElement;
      if (!t) continue;
      if (t.closest?.("#tjsModal")) needSettings = true;
      if (t.closest?.("#persona,#pane-people,#prBook")) needAvatar = true;
    }
    if (needSettings) fixSettingsScroll();
    if (needAvatar) fixAvatars();
  });
  ["tjsModal", "persona", "pane-people", "prBook"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) scopedObserver.observe(el, { childList: true, subtree: true });
  });

  window.TianjiUIFixV185 = Object.freeze({
    version: "1.0.0",
    build: BUILD,
    repair: () => {
      fixSettingsScroll();
      fixAvatars();
    },
    status: () => ({
      settingsScrollable:
        !!document.querySelector("#tjsModal .tjs-main") &&
        getComputedStyle(document.querySelector("#tjsModal .tjs-main")).overflowY === "auto",
      avatarEmptyImages: [...document.querySelectorAll(".v126-avpick img")].filter(
        (x) => !x.getAttribute("src") && !x.hidden,
      ).length,
    }),
  });

  try {
    const bv = document.getElementById("buildVersion");

    window.TianjiSystemV185 = {
      version: "v185",
      build: BUILD,
      settingsScrollFix: true,
      avatarPlaceholderFix: true,
      baseline: "v184",
    };
  } catch (_) {}
})();
