(() => {
  const TS = "2026-10-04 02:18:54";
  const q = (s, r = document) => r.querySelector(s),
    qa = (s, r = document) => Array.from(r.querySelectorAll(s));
  const S = (window.BD3D = window.BD3D || { ry: 0, rx: -8, scale: 1 });
  if (S.snap == null) S.snap = 1;
  if (S.labels == null) S.labels = 1;

  function norm(a) {
    a = ((a % 360) + 360) % 360;
    return a;
  }
  function nearestSide() {
    const a = norm(S.ry),
      arr = [0, 90, 180, 270];
    return arr.reduce((best, x) => (Math.abs(x - a) < Math.abs(best - a) ? x : best), 0);
  }
  function sideName(a) {
    a = norm(a);
    if (a < 45 || a >= 315) return "正面";
    if (a < 135) return "左侧";
    if (a < 225) return "背面";
    return "右侧";
  }
  function isFront() {
    const a = norm(S.ry);
    return a < 90 || a > 270;
  }

  function pinGroups() {
    const maps = {
      qj: {
        front: [
          ["ren", "任脉", 36, 36],
          ["chong", "冲脉", 38, 59],
          ["dai", "带脉", 30, 78],
          ["yinq", "阴跷", 24, 91],
          ["yinw", "阴维", 18, 48],
        ],
        back: [
          ["du", "督脉", 50, 34],
          ["yangq", "阳跷", 70, 91],
          ["yangw", "阳维", 82, 48],
          ["dai", "带脉", 70, 78],
        ],
      },
      zf: {
        front: [
          ["fei", "肺", 30, 28],
          ["xin", "心", 42, 36],
          ["gan", "肝", 38, 52],
          ["pi", "脾", 54, 56],
          ["wei", "胃", 56, 64],
          ["xc", "小肠", 44, 76],
          ["dc", "大肠", 28, 76],
          ["pg", "膀胱", 44, 90],
        ],
        back: [["shen", "肾", 52, 52]],
      },
      sj: {
        front: [
          ["sj1", "上焦", 32, 28],
          ["sj2", "中焦", 32, 54],
          ["sj3", "下焦", 32, 82],
          ["dt1", "上丹田", 64, 16],
          ["dt2", "中丹田", 64, 38],
          ["dt3", "下丹田", 64, 72],
        ],
        back: [],
      },
    };
    const M = maps[BD.layer] || { front: [], back: [] };
    const h = (arr) =>
      arr
        .map(
          ([k, n, l, t]) =>
            `<button type="button" class="bd3d-hit${BD.sel === k ? " on" : ""}" data-bd="${k}" style="left:${l}%;top:${t}%"><i></i><span>${n}</span></button>`,
        )
        .join("");
    return `<div class="bd3d-pins frontpins">${h(M.front)}</div><div class="bd3d-pins backpins">${h(M.back)}</div>`;
  }

  function selectedMini() {
    if (!BD.sel)
      return `<h4>当前选中 <small>未选择</small></h4><div class="bd3d-miniinfo dim">点击人体热点或下方平面图，可查看经脉、脏腑、三焦与丹田说明。</div>`;
    const qj = BD_QJ.find((x) => x.k === BD.sel);
    if (qj)
      return `<h4>${qj.n}<small>奇经八脉</small></h4><div class="bd3d-miniinfo">${qj.plain}<div class="dim">要穴示意：${qj.pts.map((p) => p[0]).join(" → ")}</div></div>`;
    const o = BD_ZF.find((x) => x.k === BD.sel);
    if (o)
      return `<h4>${o.n}<small>${o.t} · ${o.wx}</small></h4><div class="bd3d-miniinfo">${o.zhu}<div class="dim">经络：${o.jl} · 当令：${o.sc}时 · 表里：${o.biao}</div></div>`;
    const s = BD_SJ.find((x) => x.k === BD.sel) || BD_DT.find((x) => x.k === BD.sel);
    if (s)
      return `<h4>${s.n}<small>三焦 / 丹田</small></h4><div class="bd3d-miniinfo">${s.txt}</div>`;
    return "";
  }

  const oldHTML = window.bd3dHTML;
  window.bd3dHTML = function () {
    let h = oldHTML();
    h = h.replace(
      /<div class="bd3d-bar">[\s\S]*?<\/div><div class="bd3d-card-wrap">/,
      `<div class="bd3d-bar">
      <div class="bd3d-orient">
       <button type="button" class="gbtn sm" data-bdview="0">正面</button>
       <button type="button" class="gbtn sm" data-bdview="90">左侧</button>
       <button type="button" class="gbtn sm" data-bdview="180">背面</button>
       <button type="button" class="gbtn sm" data-bdview="270">右侧</button>
       <button type="button" class="gbtn sm" id="bd3dReset">复位</button>
      </div>
      <span class="bd3d-angle" id="bd3dAngle">${sideName(S.ry)} · ${Math.round(norm(S.ry))}°</span>
      <div class="bd3d-toggles">
       <label><input type="checkbox" id="bd3dSnap"${S.snap ? " checked" : ""}> 90°吸附</label>
       <label><input type="checkbox" id="bd3dLabels"${S.labels ? " checked" : ""}> 显示标注</label>
      </div>
      <span class="bd3d-hint">拖动旋转 · 滚轮缩放 · 双击复位</span>
      <span class="bd3d-zoom"><button type="button" class="gbtn sm" id="bd3dMinus">−</button><b class="bd3d-read" id="bd3dRead">100%</b><button type="button" class="gbtn sm" id="bd3dPlus">＋</button><button type="button" class="gbtn sm bd3d-fs" id="bd3dFs">放大</button></span>
     </div><div class="bd3d-card-wrap">`,
    );
    h = h.replace(
      '<div class="bd3d-card" id="bd3dCard">',
      '<div class="bd3d-card" id="bd3dCard"><div class="bd3d-core"></div>',
    );
    h = h.replace(
      /<div class="bd3d-pins">[\s\S]*?<\/div><\/div><aside class="bd3d-side">/,
      `${pinGroups()}</div><aside class="bd3d-side">`,
    );
    h = h.replace(
      '<div class="bd3d-cardnote"><h4>使用建议</h4>',
      `<div class="bd3d-cardnote bd3d-selected">${selectedMini()}</div><div class="bd3d-cardnote"><h4>使用建议</h4>`,
    );
    return h;
  };

  const oldApply = window.bd3dApply;
  window.bd3dApply = function () {
    const stage = q("#bd3dStage"),
      card = q("#bd3dCard"),
      read = q("#bd3dRead");
    if (!stage || !card) return;
    stage.style.setProperty("--bd3d-ry", S.ry + "deg");
    stage.style.setProperty("--bd3d-rx", S.rx + "deg");
    stage.style.setProperty("--bd3d-scale", S.scale);
    stage.classList.toggle("view-front", isFront());
    stage.classList.toggle("view-back", !isFront());
    stage.classList.toggle("no-labels", !S.labels);
    if (read) read.textContent = Math.round(S.scale * 100) + "%";
    const a = q("#bd3dAngle");
    if (a) a.textContent = `${sideName(S.ry)} · ${Math.round(norm(S.ry))}°`;
    qa("[data-bdview]").forEach((b) =>
      b.classList.toggle("on", +b.dataset.bdview === nearestSide()),
    );
  };

  window.bd3dReset = function () {
    S.ry = 0;
    S.rx = -8;
    S.scale = 1;
    window.bd3dApply();
  };

  window.bd3dBind = function () {
    const stage = q("#bd3dStage");
    if (!stage) return;
    let drag = null,
      moved = false;
    qa("[data-bdview]").forEach((b) =>
      b.addEventListener("click", () => {
        S.ry = +b.dataset.bdview;
        S.rx = -8;
        window.bd3dApply();
      }),
    );
    q("#bd3dReset")?.addEventListener("click", window.bd3dReset);
    q("#bd3dMinus")?.addEventListener("click", () => {
      S.scale = Math.max(0.68, S.scale - 0.08);
      window.bd3dApply();
    });
    q("#bd3dPlus")?.addEventListener("click", () => {
      S.scale = Math.min(1.82, S.scale + 0.08);
      window.bd3dApply();
    });
    q("#bd3dSnap")?.addEventListener("change", (e) => {
      S.snap = e.target.checked ? 1 : 0;
    });
    q("#bd3dLabels")?.addEventListener("change", (e) => {
      S.labels = e.target.checked ? 1 : 0;
      window.bd3dApply();
    });
    q("#bd3dFs")?.addEventListener("click", async () => {
      try {
        if (document.fullscreenElement) await document.exitFullscreen();
        else await stage.requestFullscreen();
      } catch (_) {
        if (typeof toast === "function") toast("当前浏览器不允许全屏");
      }
    });
    stage.addEventListener(
      "wheel",
      (e) => {
        e.preventDefault();
        S.scale = Math.max(0.68, Math.min(1.82, S.scale + (e.deltaY < 0 ? 0.06 : -0.06)));
        window.bd3dApply();
      },
      { passive: false },
    );
    stage.addEventListener("dblclick", (e) => {
      if (e.target.closest(".bd3d-hit")) return;
      e.preventDefault();
      window.bd3dReset();
    });
    stage.addEventListener("pointerdown", (e) => {
      if (e.button > 0 || e.target.closest(".bd3d-hit")) return;
      moved = false;
      drag = { id: e.pointerId, x: e.clientX, y: e.clientY, ry: S.ry, rx: S.rx };
      stage.classList.add("grab");
      q("#bd3dCard")?.classList.add("dragging");
      try {
        stage.setPointerCapture(e.pointerId);
      } catch (_) {}
    });
    stage.addEventListener("pointermove", (e) => {
      if (!drag || e.pointerId !== drag.id) return;
      const dx = e.clientX - drag.x,
        dy = e.clientY - drag.y;
      if (Math.abs(dx) + Math.abs(dy) > 3) moved = true;
      S.ry = drag.ry + dx * 0.46;
      S.rx = Math.max(-22, Math.min(22, drag.rx - dy * 0.16));
      window.bd3dApply();
    });
    const up = (e) => {
      if (!drag || e.pointerId !== drag.id) return;
      drag = null;
      stage.classList.remove("grab");
      q("#bd3dCard")?.classList.remove("dragging");
      if (S.snap && moved) {
        S.ry = Math.round(S.ry / 90) * 90;
        setTimeout(window.bd3dApply, 10);
      }
    };
    stage.addEventListener("pointerup", up);
    stage.addEventListener("pointercancel", () => {
      drag = null;
      stage.classList.remove("grab");
      q("#bd3dCard")?.classList.remove("dragging");
    });
    qa(".bd3d-hit").forEach((b) =>
      b.addEventListener("click", (e) => {
        e.stopPropagation();
        const k = b.dataset.bd;
        if (!k) return;
        BD.sel = BD.sel === k ? null : k;
        const block = q("#bdBlock");
        if (block) {
          const tmp = document.createElement("div");
          tmp.innerHTML = bdHTML();
          block.replaceWith(tmp.firstElementChild);
          bdBind();
          try {
            if (typeof zmScan === "function") zmScan();
          } catch (_) {}
        }
      }),
    );
    window.bd3dApply();
  };

  /* bdBind 在 v79 中已建立，这里只替换 3D 绑定函数；重绘时自动使用新的 bd3dHTML/bd3dBind。 */
  try {
    if (q("#pane-jingluo")?.classList.contains("on") && window.R) jingluoRefresh();
  } catch (_) {}

  try {
    const bv = q("#buildVersion");
  } catch (_) {}
})();
