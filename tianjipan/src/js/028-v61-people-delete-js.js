/* ===== v61 · 统一人物删除：不依赖原生 confirm，人物关系册 / 首页共用 ===== */
(function () {
  const TS = "2026-10-03 23:18:59";
  const ARM_MS = 5200;
  let armed = { key: "", at: 0, el: null, timer: null };
  const q = (s) => document.querySelector(s),
    qa = (s, r = document) => Array.from(r.querySelectorAll(s));
  function personById(id) {
    try {
      return typeof pplById === "function"
        ? pplById(id)
        : (PPL.people || []).find((x) => x && x.id === id);
    } catch (_) {
      return null;
    }
  }
  function resetArm() {
    if (armed.timer) clearTimeout(armed.timer);
    const el = armed.el;
    if (el && el.isConnected) {
      el.classList.remove("armed");
      const src = el.dataset.v61src;
      el.textContent = src === "book" ? "删除" : "×";
      el.title = src === "book" ? "删除人物" : "删除人物";
      const card = el.closest(".prb55-person");
      if (card) card.classList.remove("delete-armed");
    }
    armed = { key: "", at: 0, el: null, timer: null };
  }
  function armDelete(el, id, src) {
    const key = src + ":" + id,
      now = Date.now();
    if (armed.key === key && now - armed.at < ARM_MS) return true;
    resetArm();
    armed.key = key;
    armed.at = now;
    armed.el = el;
    el.dataset.v61src = src;
    el.classList.add("armed");
    if (src === "book") {
      el.textContent = "确认删除";
      el.title = "再次点击确认删除该人物";
      const card = el.closest(".prb55-person");
      if (card) {
        card.classList.add("delete-armed");
        let note = card.querySelector(".prb55-delete-note");
        if (!note) {
          note = document.createElement("div");
          note.className = "prb55-delete-note";
          note.textContent = "再次点击“确认删除”将移除此人物，并同步清理其人物关系。";
          const actions = card.querySelector(".prb55-actions");
          if (actions) actions.after(note);
          else card.appendChild(note);
        }
      }
    } else {
      el.textContent = "!";
      el.title = "再次点击确认删除";
    }
    armed.timer = setTimeout(resetArm, ARM_MS);
    return false;
  }
  function backupBeforeDelete() {
    try {
      if (window.TJPeople && typeof TJPeople.backup === "function") return TJPeople.backup();
    } catch (_) {}
    try {
      localStorage.setItem(
        "tianjipan.people.backup.v61",
        JSON.stringify({
          at: Date.now(),
          people: PPL.people,
          rels: PPL.rels,
          meId: PPL.meId,
          pos: PPL.pos,
          cur: PPL.cur,
        }),
      );
      return true;
    } catch (_) {
      return false;
    }
  }
  function hardRemove(id) {
    const p = personById(id);
    if (!p) return false;
    const wasCur = PPL.cur === id,
      wasMe = PPL.meId === id;
    PPL.people = (PPL.people || []).filter((x) => x && x.id !== id);
    PPL.rels = (PPL.rels || []).filter((r) => r && r.a !== id && r.b !== id);
    try {
      if (PPL.pos) delete PPL.pos[id];
    } catch (_) {}
    if (wasCur) PPL.cur = null;
    if (wasMe) PPL.meId = null;
    try {
      if (typeof PRB !== "undefined" && PRB.editId === id) PRB.editId = null;
    } catch (_) {}
    try {
      PPL.cache = {};
    } catch (_) {}
    try {
      if (!pplSave()) return false;
    } catch (_) {}
    return true;
  }
  function removePerson(id, src) {
    const p = personById(id);
    if (!p) {
      resetArm();
      try {
        toast("该人物已经不存在");
      } catch (_) {}
      return false;
    }
    const name = p.name || "该人物";
    backupBeforeDelete();
    let ok = false;
    try {
      if (window.TJPeople && typeof TJPeople.remove === "function") ok = !!TJPeople.remove(id);
    } catch (e) {
      console.error("[v61 TJPeople.remove]", e);
    }
    if (!ok) ok = hardRemove(id);
    resetArm();
    if (!ok) {
      try {
        toast("删除失败，请重新打开人物关系册后再试");
      } catch (_) {}
      return false;
    }
    /* 强制刷新所有读取同一人物主库的界面；单处刷新异常不能阻断其它区域。 */
    try {
      if (typeof pplRepairData === "function") pplRepairData(false);
    } catch (_) {}
    try {
      if (typeof pplSave === "function") if (!pplSave()) return false;
    } catch (_) {}
    try {
      renderHomeBook();
    } catch (e) {
      console.error("[v61 首页人物刷新]", e);
    }
    try {
      if (typeof pplState === "function") pplState();
    } catch (_) {}
    try {
      if (q("#pane-people") && q("#pane-people").dataset.built && typeof refRender === "function")
        refRender("people");
    } catch (e) {
      console.error("[v61 关系册刷新]", e);
    }
    try {
      if (q("#pane-net") && q("#pane-net").dataset.built && typeof renderNet === "function")
        renderNet();
    } catch (e) {
      console.error("[v61 关系图刷新]", e);
    }
    try {
      if (typeof dialPeopleRender === "function") dialPeopleRender();
    } catch (_) {}
    try {
      window.dispatchEvent(
        new CustomEvent("tianjipan:peoplechange", {
          detail: { type: "person:remove:v61", id, source: src },
        }),
      );
    } catch (_) {}
    try {
      toast(`已删除：${name}${wasRelationCount(p, id)}`);
    } catch (_) {}
    return true;
  }
  function wasRelationCount(p, id) {
    return "";
  }
  function renderHomeBook() {
    const box = q("#prBook");
    if (!box || typeof PPL === "undefined") return;
    const people = Array.isArray(PPL.people) ? PPL.people : [];
    if (!people.length) {
      box.innerHTML =
        '<span class="dim sm">尚无人物档案。填写上方信息后点击红色“保存”即可。</span>';
      return;
    }
    const cards = people
      .map((p) => {
        let dm = null;
        try {
          const d = typeof pplDerive === "function" ? pplDerive(p) : null;
          dm = d && d.bz ? GAN_WX[d.bz.dm] : null;
        } catch (_) {}
        const tag =
          p.id === PPL.meId
            ? '<em class="me">我</em>'
            : p.tag
              ? `<small>${esc(p.tag)}</small>`
              : "";
        return `<span class="pchip-wrap${p.id === PPL.cur ? " on" : ""}" data-home-person="${esc(p.id)}"><button type="button" class="pchip${p.id === PPL.cur ? " on" : ""}" data-id="${esc(p.id)}" title="${esc(p.name)} · ${esc(p.dt || "")}"><i class="pdot ${dm === null ? "" : "wx" + dm}"></i><b>${esc(p.name)}</b>${tag}</button><button type="button" class="pchip-x" data-home-del="${esc(p.id)}" aria-label="删除 ${esc(p.name)}" title="删除人物">×</button></span>`;
      })
      .join("");
    box.innerHTML = '<span class="pb-l">已保存人物</span>' + cards;
    qa(".pchip", box).forEach((b) =>
      b.addEventListener("click", () => {
        try {
          pplOpen(b.dataset.id);
        } catch (e) {
          console.error("[v61 人物载入]", e);
        }
      }),
    );
  }
  /* 对外暴露统一删除方法，后续任何模块都应走这里/TJPeople.remove，不直接 splice。 */
  window.TJDeletePerson = function (id) {
    backupBeforeDelete();
    return removePerson(String(id || ""), "api");
  };
  try {
    if (window.TJPeople) window.TJPeople.removeSafe = window.TJDeletePerson;
  } catch (_) {}
  /* 首页人物册统一替换；v58 保存后会广播 peoplechange，再由这里恢复带 × 的版本。 */
  try {
    pplBook = renderHomeBook;
  } catch (_) {}
  window.addEventListener("tianjipan:peoplechange", () => setTimeout(renderHomeBook, 0));
  /* 捕获阶段拦截旧版删除按钮，避开旧 onclick + 原生 confirm 造成的失效链。 */
  document.addEventListener(
    "click",
    function (e) {
      const book =
        e.target && e.target.closest ? e.target.closest('#pane-people [data-prbact="del"]') : null;
      if (book) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        const id = book.dataset.id;
        if (!personById(id)) {
          try {
            toast("该人物已经不存在");
          } catch (_) {}
          return;
        }
        if (armDelete(book, id, "book")) removePerson(id, "book");
        return;
      }
      const home =
        e.target && e.target.closest ? e.target.closest("#prBook [data-home-del]") : null;
      if (home) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        const id = home.dataset.homeDel;
        if (!personById(id)) {
          renderHomeBook();
          return;
        }
        if (armDelete(home, id, "home")) removePerson(id, "home");
        return;
      }
    },
    true,
  );
  /* v58 的延迟 mount 可能再次写回旧版 pplBook；延迟再接管一次。 */
  setTimeout(() => {
    try {
      pplBook = renderHomeBook;
    } catch (_) {}
    renderHomeBook();
  }, 160);
  setTimeout(() => {
    try {
      pplBook = renderHomeBook;
    } catch (_) {}
    renderHomeBook();
  }, 420);
  try {
    const bv = q("#buildVersion");

    const ft = document.querySelector("footer");
    if (ft) {
      const t = ft.textContent || "";
      if (/版本\s*·/.test(t));
      else ft.insertAdjacentHTML("beforeend", "<br>版本 · " + TS);
    }
  } catch (_) {}
})();
