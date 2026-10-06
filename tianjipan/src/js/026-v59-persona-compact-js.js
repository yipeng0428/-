(() => {
  const TS = "2026-10-03 22:54:07";
  const q = (s) => document.querySelector(s);
  function mkField(label, node, cls = "") {
    const w = document.createElement("label");
    w.className = "v59-field v59-place-select " + cls;
    const s = document.createElement("span");
    s.className = "v59-lbl";
    s.textContent = label;
    w.appendChild(s);
    w.appendChild(node);
    return w;
  }
  function compactPersona() {
    const persona = q("#persona"),
      grid = persona && persona.querySelector(".pr-grid");
    if (!persona || !grid) return false;
    persona.querySelector("#v58CreateGuide")?.remove();
    persona.querySelectorAll(".v58-create-guide,.v58-rel-note").forEach((x) => x.remove());
    const hint = persona.querySelector(".pr-hint");
    if (hint) hint.remove();
    const rel = persona.querySelector(".f-tag");
    if (rel) {
      rel.classList.add("v58-rel");
      for (const n of Array.from(rel.childNodes)) {
        if (n.nodeType === 3 && n.nodeValue.trim()) n.nodeValue = "人物关系";
      }
      const sel = q("#ptag");
      if (sel && sel.options.length) sel.options[0].textContent = "暂不选择";
    }
    let line = persona.querySelector("#v59PersonLine");
    if (!line) {
      line = document.createElement("div");
      line.id = "v59PersonLine";
      line.className = "v59-person-line";
      grid.parentNode.insertBefore(line, grid);
    }
    const name = persona.querySelector(".f-name"),
      gender = persona.querySelector(".f-gender"),
      dt = persona.querySelector(".f-dt");
    [name, rel, gender, dt].forEach((x) => {
      if (x && x.parentNode !== line) line.appendChild(x);
    });
    const quick = persona.querySelector(".geo-quick");
    if (quick) {
      quick.classList.add("v59-field");
      if (!quick.querySelector(":scope > .v59-lbl")) {
        const s = document.createElement("span");
        s.className = "v59-lbl";
        s.textContent = "出生地";
        quick.insertBefore(s, quick.firstChild);
      }
      const qi = quick.querySelector("input");
      if (qi) qi.placeholder = "搜索出生地";
      if (quick.parentNode !== line) line.appendChild(quick);
    }
    [
      ["pprov", "省份", ""],
      ["pcty", "城市", "v59-city"],
      ["pdis", "区县", "v59-district"],
    ].forEach(([id, lab, cls]) => {
      const el = q("#" + id);
      if (!el) return;
      let w = persona.querySelector('[data-v59-wrap="' + id + '"]');
      if (!w) {
        w = mkField(lab, el, cls);
        w.dataset.v59Wrap = id;
      } else if (el.parentNode !== w) w.appendChild(el);
      if (w.parentNode !== line) line.appendChild(w);
    });
    const fy = persona.querySelector(".f-fenye");
    if (fy) {
      const lbl = fy.querySelector(".lbl");
      if (lbl) lbl.textContent = "古州分野";
      if (fy.parentNode !== line) line.appendChild(fy);
    }
    const sub = persona.querySelector(".pr-subrow"),
      chk = q("#solarChk");
    if (chk) {
      let sw = persona.querySelector("#v59SolarWrap");
      if (!sw) {
        sw = document.createElement("div");
        sw.id = "v59SolarWrap";
        sw.className = "v59-field v59-solar";
        sw.innerHTML = '<span class="v59-lbl">校正</span><label class="chk">真太阳时校正</label>';
        sw.querySelector(".chk").prepend(chk);
      }
      if (sw.parentNode !== line) line.appendChild(sw);
    }
    const ll = q("#llBox");
    if (ll) {
      ll.classList.add("v59-llbox");
      if (ll.parentNode !== line.parentNode) line.insertAdjacentElement("afterend", ll);
    }
    persona.querySelector(".birthplace-head")?.remove();
    persona.querySelector(".birthplace-note")?.remove();
    if (sub && sub !== ll) sub.remove();
    const dial = q('#topnav [data-go="dial"]');
    if (dial) {
      dial.textContent = "观象盘";
      dial.title = "返回首页观象盘";
      dial.setAttribute("aria-label", "观象盘");
    }
    persona.dataset.v59 = "1";
    return true;
  }
  function renameHomeDial() {
    const dial = q('#topnav [data-go="dial"]');
    if (dial) {
      dial.textContent = "观象盘";
      dial.title = "返回首页观象盘";
    }
    document.querySelectorAll('[data-fxa="dial"]').forEach((b) => {
      if ((b.textContent || "").trim() === "圆盘") b.textContent = "观象盘";
    });
  }
  let tries = 0;
  const tm = setInterval(() => {
    tries++;
    const ok = compactPersona();
    renameHomeDial();
    if (ok || tries > 40) clearInterval(tm);
  }, 80);
  compactPersona();
  renameHomeDial();
  const persona = q("#persona");
  if (persona && window.MutationObserver) {
    const mo = new MutationObserver(() => {
      if (!persona.dataset.v59) compactPersona();
      renameHomeDial();
    });
    mo.observe(persona, { childList: true, subtree: true });
  }
  try {
    const bv = q("#buildVersion");

    const ft = document.querySelector("footer");
    if (ft && /版本\s*·/.test(ft.textContent || ""));
  } catch (_) {}
})();
