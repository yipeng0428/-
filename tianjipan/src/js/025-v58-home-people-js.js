(() => {
  const TS = "2026-10-03 22:44:55";
  const $v = (s) => document.querySelector(s),
    $$v = (s) => Array.from(document.querySelectorAll(s));
  function v58ExpandPersona() {
    const panel = $v("#persona"),
      btn = $v("#personaTassel");
    if (panel && panel.classList.contains("is-collapsed")) {
      if (btn) btn.click();
      else panel.classList.remove("is-collapsed");
    }
  }
  function v58GoHome() {
    try {
      selectTab("now", false);
    } catch (e) {
      console.error("[v58 首页切换此刻]", e);
    }
    v58ExpandPersona();
    setTimeout(() => {
      try {
        navScroll("home");
      } catch (_) {
        const p = $v("#persona");
        if (p) p.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 35);
  }
  function v58NavMount() {
    const nav = $v("#topnav"),
      groups = nav && nav.querySelector(".tn-groups");
    if (!nav || !groups) return false;
    const home = groups.querySelector('[data-go="home"]'),
      dial = groups.querySelector('[data-go="dial"]');
    if (home) home.onclick = () => v58GoHome();
    const brand = $v("#tnHome");
    if (brand) brand.onclick = () => v58GoHome();
    let direct = $v("#tnStudioDirect");
    if (!direct) {
      direct = document.createElement("button");
      direct.type = "button";
      direct.id = "tnStudioDirect";
      direct.className = "tn-b";
      direct.setAttribute("role", "menuitem");
      direct.textContent = "盘库";
      direct.onclick = () => {
        try {
          selectTab("studio", false);
          setTimeout(() => navScroll("tabs"), 30);
        } catch (e) {
          console.error("[v58 盘库入口]", e);
        }
      };
      if (home && home.parentNode) home.parentNode.insertBefore(direct, dial || home.nextSibling);
    }
    $$v("#topnav .tn-g").forEach((b) => {
      if ((b.textContent || "").replace(/▾/g, "").trim() === "盘库") b.remove();
    });
    direct.classList.toggle("on", !!($v(".tab.on") && $v(".tab.on").dataset.tab === "studio"));
    return true;
  }
  function v58FormDecor() {
    const head = $v("#persona .pr-head");
    if (head && !$v("#v58CreateGuide")) {
      const g = document.createElement("div");
      g.id = "v58CreateGuide";
      g.className = "v58-create-guide";
      g.innerHTML =
        "<b>① 填写人物信息</b><i>→</i><b>② 可选人物关系</b><i>→</i><b>③ 点击红色“保存”</b><small><strong>每点一次“保存”都会建立一份新的独立档案，不覆盖前面的人。</strong> 第一位如果不选择关系，自动作为“本人”；以后可继续录入第二、第三位人物。</small>";
      head.insertAdjacentElement("afterend", g);
    }
    const hint = $v("#persona .pr-hint");
    if (hint)
      hint.textContent =
        "这里负责填写人物与起局。关系可以暂不选择；保存后会进入统一人物关系册，后续各模块都按人物ID读取。";
    const fl = $v("#persona .f-tag");
    if (fl) {
      fl.classList.add("v58-rel");
      const sel = $v("#ptag");
      if (fl.firstChild && fl.firstChild.nodeType === 3)
        fl.firstChild.nodeValue = "人物关系（可选）";
      if (sel && sel.options.length) sel.options[0].textContent = "暂不选择（首位默认本人）";
      if (!fl.querySelector(".v58-rel-note")) {
        const n = document.createElement("small");
        n.className = "v58-rel-note";
        n.textContent = "选择父母、配偶、子女等后，如已设置“本人”，保存时会自动建立关系图关联。";
        fl.appendChild(n);
      }
    }
    ["updateP", "newP", "delP"].forEach((id) => {
      const el = $v("#" + id);
      if (el) el.remove();
    });
    const save = $v("#saveP");
    if (save) {
      save.textContent = "保存";
      save.title = "保存为新的独立人物档案；不会覆盖已有档案";
      save.classList.add("v58-save");
    }
  }
  function v58LinkFromTag(p, tag) {
    if (!p || !tag || tag === "本人" || !PPL.meId || PPL.meId === p.id) return null;
    const me = PPL.meId,
      map = {
        配偶: "spouse",
        父亲: "parent",
        母亲: "parent",
        子女: "parent",
        兄弟姐妹: "sibling",
        祖辈: "grand",
        朋友: "friend",
        同事: "colleague",
        其他: "other",
      };
    const role = map[tag];
    if (!role) return null;
    let a = p.id,
      b = me;
    if (tag === "子女") {
      a = me;
      b = p.id;
    }
    const n = pplNormRel(a, b, role);
    const dup = PPL.rels.find(
      (r) =>
        r &&
        r.role === n.role &&
        ((r.a === n.a && r.b === n.b) || (PPL_SYM.includes(n.role) && r.a === n.b && r.b === n.a)),
    );
    if (dup) return dup;
    const r = {
      id: "r" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
      a: n.a,
      b: n.b,
      role: n.role,
      note: "",
      createdAt: Date.now(),
    };
    PPL.rels.push(r);
    return r;
  }
  function v58State() {
    const el = $v("#prState"),
      save = $v("#saveP");
    if (!el) return;
    if (save) {
      save.textContent = "保存";
      save.title = "每次保存都建立新的独立人物档案，不覆盖已有档案";
      save.classList.add("v58-save");
    }
    const p = pplById(PPL.cur),
      count = PPL.people.length;
    el.classList.add("v58-state");
    if (!count) {
      el.textContent = "尚未保存人物 · 填写完成后点击红色“保存”；首位未选择关系时默认设为本人";
      el.className = "pr-state new v58-state";
      return;
    }
    if (p && pplSameForm(p, pplFormPerson())) {
      el.textContent = `已载入「${p.name}」 · 当前共有 ${count} 份档案；再次点击“保存”会另存一份新档案，不修改原记录`;
      el.className = "pr-state ok v58-state";
    } else {
      el.textContent = `人物关系册已有 ${count} 人 · 当前表单可直接作为下一位人物保存，系统会自动生成新的独立ID`;
      el.className = "pr-state new v58-state";
    }
  }
  function v58Book() {
    const box = $v("#prBook");
    if (!box) return;
    if (!PPL.people.length) {
      box.innerHTML =
        '<span class="dim sm">尚无人物档案。填写上方信息后点击红色“保存”即可。</span>';
      return;
    }
    box.innerHTML =
      '<span class="pb-l">已保存人物</span>' +
      PPL.people
        .map((p) => {
          let dm = null;
          try {
            const d = pplDerive(p);
            dm = d ? GAN_WX[d.bz.dm] : null;
          } catch (_) {}
          return `<button type="button" class="pchip${p.id === PPL.cur ? " on" : ""}" data-id="${esc(p.id)}" title="${esc(p.name)} · ${esc(p.dt || "")}"><i class="pdot ${dm === null ? "" : "wx" + dm}"></i><b>${esc(p.name)}</b>${p.id === PPL.meId ? '<em class="me">我</em>' : p.tag ? `<small>${esc(p.tag)}</small>` : ""}</button>`;
        })
        .join("");
    $$v("#prBook .pchip").forEach((b) => (b.onclick = () => pplOpen(b.dataset.id)));
  }
  function v58BindSave() {
    const save = $v("#saveP");
    if (!save) return;
    save.onclick = () => {
      if (!parseDt()) {
        toast("请先填写有效的出生日期时间");
        return;
      }
      const f = pplFormPerson();
      if (!f.name) f.name = "人物" + (PPL.people.length + 1);
      const first = PPL.people.length === 0;
      if (first && !f.tag) {
        f.tag = "本人";
        const t = $v("#ptag");
        if (t) t.value = "本人";
      }
      let id = pplId();
      while (PPL.people.some((x) => x.id === id)) id = pplId();
      const now = Date.now(),
        p = Object.assign({ id, createdAt: now, updatedAt: now, source: "persona-save" }, f);
      PPL.people.push(p);
      PPL.cur = p.id;
      pplApplyMeState(p, f);
      const rel = v58LinkFromTag(p, f.tag);
      PPL.cache = {};
      if (!pplSave()) return false;
      try {
        pplAfterChange();
      } catch (e) {
        console.error("[v58 保存后刷新]", e);
      }
      try {
        window.dispatchEvent(
          new CustomEvent("tianjipan:peoplechange", { detail: { type: "person:add", id: p.id } }),
        );
      } catch (_) {}
      v58Book();
      v58State();
      const idx = PPL.people.length,
        who = p.id === PPL.meId ? " · 已设为本人" : rel ? " · 已建立人物关系" : "";
      toast(`已保存：${p.name} · 第${idx}份人物档案${who}`);
    };
  }
  function v58Mount() {
    if (!$v("#persona") || !$v("#saveP")) return false;
    v58FormDecor();
    try {
      pplState = v58State;
      pplBook = v58Book;
    } catch (e) {
      console.error("[v58 人物状态覆盖]", e);
    }
    v58BindSave();
    v58Book();
    v58State();
    v58NavMount();
    return true;
  }
  let tries = 0;
  const timer = setInterval(() => {
    tries++;
    if (v58Mount() || tries > 30) clearInterval(timer);
  }, 80);
  v58Mount();
  try {
    const prev = selectTab;
    selectTab = function (id, scroll) {
      const r = prev(id, scroll);
      const b = $v("#tnStudioDirect");
      if (b) b.classList.toggle("on", id === "studio");
      return r;
    };
  } catch (e) {
    console.error("[v58 导航联动]", e);
  }
  try {
    const bv = $v("#buildVersion");

    const ft = document.querySelector("footer");
    if (ft) {
      const t = ft.textContent || "";
      if (/版本\s*·/.test(t));
      else ft.insertAdjacentHTML("beforeend", "<br>版本 · " + TS);
    }
  } catch (_) {}
})();
