(() => {
  "use strict";
  const V174_BUILD = "v174 · 2026-10-05 19:36 +08:00";
  const MODE_LABEL = {
    observe: ["此刻观象", "看现在这一刻的整体结构"],
    compare: ["出生对照", "把出生时刻和当前时刻放在一起看"],
    simulate: ["时间推演", "沿时间轴观察盘面如何变化"],
    inverse: ["专业 · 时空搜索", "按条件或相似状态反查时间"],
  };
  let timer = 0,
    observer = null;

  function q(s, r = document) {
    return r.querySelector(s);
  }
  function qa(s, r = document) {
    return Array.from(r.querySelectorAll(s));
  }
  function click(sel) {
    const el = q(sel);
    if (el) {
      el.click();
      return true;
    }
    return false;
  }
  function activeMode() {
    const b = q("#tj152Panel [data-tj152-mode].on");
    return b?.dataset.tj152Mode || "observe";
  }
  function originalModeBtn(mode) {
    return q(`#tj152Panel [data-tj152-mode="${mode}"]`);
  }
  function summaryItems() {
    const snap = q("#tj157Snapshot");
    const arr = snap
      ? qa(":scope>div", snap).map((x) => ({
          k: q("small", x)?.textContent?.trim() || "",
          v: q("b", x)?.textContent?.trim() || "",
        }))
      : [];
    if (arr.length) return arr.slice(0, 5);
    const d = q("#tj152Date")?.textContent?.trim() || "—";
    return [
      { k: "观察时刻", v: d },
      { k: "模式", v: MODE_LABEL[activeMode()]?.[0] || "观象" },
    ];
  }
  function sync() {
    const p = q("#tj152Panel.tj174-mounted");
    if (!p) return;
    const mode = activeMode(),
      meta = MODE_LABEL[mode] || MODE_LABEL.observe;
    qa("[data-tj174-mode]", p).forEach((b) =>
      b.classList.toggle("on", b.dataset.tj174Mode === mode),
    );
    const mt = q("#tj174ModeText", p);
    if (mt) mt.textContent = meta[0];
    const ms = q("#tj174ModeSub", p);
    if (ms) ms.textContent = meta[1];
    const dt = q("#tj174NowText", p);
    if (dt) {
      const t = summaryItems().find((x) => x.k.includes("观察时刻"));
      dt.textContent = t?.v || q("#tj152Date")?.textContent?.trim() || "—";
    }
    const state = q("#tj174State", p);
    if (state) {
      state.innerHTML = summaryItems()
        .map(
          (x) =>
            `<div><small>${escapeHtml(x.k)}</small><b title="${escapeHtml(x.v)}">${escapeHtml(x.v)}</b></div>`,
        )
        .join("");
    }
    const pro = q("#tj174Professional", p);
    if (pro && mode === "inverse") pro.open = true;
  }
  function escapeHtml(s) {
    return String(s ?? "").replace(
      /[&<>"']/g,
      (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[m],
    );
  }

  function surfaceHTML() {
    return `<div class="tj174-surface" id="tj174Surface">
  <header class="tj174-hero">
    <div>
      <div class="tj174-eyebrow">TIANJI · TIME & SYMBOLIC OBSERVATION</div>
      <h2 class="tj174-title">天机式</h2>
      <p class="tj174-sub">先选你想看的内容，再看盘。常用操作放在表面；完整图层、精细时间控制和时空搜索都收进下方折叠区。</p>
    </div>
    <div class="tj174-now">
      <small>当前观察时间</small>
      <b id="tj174NowText">—</b>
      <span id="tj174ModeText">此刻观象</span>
    </div>
  </header>

  <section class="tj174-start">
    <div class="tj174-starthead"><b>你想看什么？</b><span id="tj174ModeSub">看现在这一刻的整体结构</span></div>
    <div class="tj174-actions">
      <button type="button" class="tj174-action" data-tj174-mode="observe"><i>01</i><span><b>看此刻</b><small>回到现在，直接观察当前盘面。</small></span></button>
      <button type="button" class="tj174-action" data-tj174-mode="compare"><i>02</i><span><b>看出生对照</b><small>把出生时刻与当前时刻放在同一张盘里比较。</small></span></button>
      <button type="button" class="tj174-action" data-tj174-mode="simulate"><i>03</i><span><b>看时间变化</b><small>打开时间轴，前后推移观察结构变化。</small></span></button>
    </div>
  </section>

  <div class="tj174-display">
    <span>显示内容</span>
    <button class="tj174-chip" type="button" data-tj174-preset="simple">清爽</button>
    <button class="tj174-chip" type="button" data-tj174-preset="astro">天文</button>
    <button class="tj174-chip" type="button" data-tj174-preset="yi">易学</button>
    <button class="tj174-chip" type="button" data-tj174-preset="trad">传统</button>
    <button class="tj174-chip" type="button" data-tj174-preset="all">全部</button>
    <span class="note">只切换显示层，不改计算时间。</span>
  </div>

  <section class="tj174-stagecard">
    <div class="tj174-stagehead"><b>主盘</b><span>滚轮缩放 · 按住拖动 · 点击盘面查看内容</span></div>
    <div class="tj174-stagehost" id="tj174StageHost"></div>
  </section>

  <div class="tj174-state" id="tj174State"></div>
  <div class="tj174-timelinehost" id="tj174TimelineHost"></div>

  <section class="tj174-context">
    <div class="tj174-contexthead"><b>你当前点到的内容</b><span>点击盘上的行星、节气、卦象等查看</span></div>
    <div id="tj174DetailHost"></div>
  </section>

  <details class="tj174-fold" id="tj174More">
    <summary><i>＋</i><span><b>更多设置</b><small>完整图层、精细时间控制，需要时再打开。</small></span><em>›</em></summary>
    <div class="tj174-foldbody">
      <div class="tj174-foldlabel">时间控制</div>
      <div class="tj174-advancedtime" id="tj174TimeHost"></div>
      <div class="tj174-foldlabel">完整图层</div>
      <div class="tj174-layerhost" id="tj174LayerHost"></div>
    </div>
  </details>

  <details class="tj174-fold" id="tj174Professional">
    <summary><i>◇</i><span><b>专业工具</b><small>时空搜索、星位反演和更多约束都放在这里。</small></span><em>›</em></summary>
    <div class="tj174-foldbody">
      <div class="tj174-prointro">
        <div><b>时空搜索</b><small>从目标星位、节气、月相或相似状态反查历史 / 未来时间。它不是日常入口，所以默认收起。</small></div>
        <button type="button" id="tj174OpenSearch">进入时空搜索</button>
      </div>
      <div class="tj174-prohost" id="tj174ProHost"></div>
    </div>
  </details>
</div>`;
  }

  function mount() {
    const p = q("#tj152Panel");
    if (!p || !p.classList.contains("on")) return false;
    const shell = q(".tj152-shell", p),
      ws = q(".tj155-workspace", p),
      stage = q("#tj152StageShell", p);
    if (!shell || !ws || !stage) return false;
    if (q("#tj174Surface", p)) {
      p.classList.add("tj174-mounted");
      sync();
      return true;
    }

    shell.insertAdjacentHTML("afterbegin", surfaceHTML());
    p.classList.add("tj174-mounted");

    const hostStage = q("#tj174StageHost", p);
    const hostTimeline = q("#tj174TimelineHost", p);
    const hostDetail = q("#tj174DetailHost", p);
    const hostTime = q("#tj174TimeHost", p);
    const hostLayer = q("#tj174LayerHost", p);
    const hostPro = q("#tj174ProHost", p);

    const river = q("#tj152River", p);
    const detail = q("#tj152Detail", p)?.closest(".tj152-card");
    const timebar = q(".tj152-timebar", p);
    const layer = q("#tj160LayerCard", p) || q("#tj155ControlSide .tj152-card", p);
    const inverse = q("#tj155Inverse", p);

    hostStage.appendChild(stage);
    if (river) hostTimeline.appendChild(river);
    if (detail) hostDetail.appendChild(detail);
    if (timebar) hostTime.appendChild(timebar);
    if (layer) hostLayer.appendChild(layer);
    if (inverse) hostPro.appendChild(inverse);

    qa("[data-tj174-mode]", p).forEach((btn) =>
      btn.addEventListener("click", () => {
        const m = btn.dataset.tj174Mode;
        if (m === "observe") {
          originalModeBtn("observe")?.click();
          setTimeout(() => q("#tj152Now")?.click(), 0);
        } else if (m === "compare") {
          q("#tj152Now")?.click();
          setTimeout(() => originalModeBtn("compare")?.click(), 0);
        } else if (m === "simulate") {
          originalModeBtn("simulate")?.click();
        }
        setTimeout(sync, 40);
      }),
    );

    qa("[data-tj174-preset]", p).forEach((btn) =>
      btn.addEventListener("click", () => {
        const k = btn.dataset.tj174Preset;
        const target = q(`[data-tj152-preset="${k}"]`, p);
        target?.click();
        qa("[data-tj174-preset]", p).forEach((x) => x.classList.toggle("on", x === btn));
        setTimeout(sync, 30);
      }),
    );

    q("#tj174OpenSearch", p)?.addEventListener("click", () => {
      originalModeBtn("inverse")?.click();
      const d = q("#tj174Professional", p);
      if (d) d.open = true;
      setTimeout(sync, 40);
    });

    /* Old "big" button is intentionally hidden. Enlarged mode will be redesigned separately. */
    sync();
    if (timer) clearInterval(timer);
    timer = setInterval(() => {
      if (q("#tj152Panel.tj174-mounted.on")) sync();
    }, 1000);
    return true;
  }

  function installObserver() {
    if (observer) return;
    observer = new MutationObserver(() => {
      const p = q("#tj152Panel");
      if (p?.classList.contains("on")) setTimeout(mount, 0);
    });
    observer.observe(document.body, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ["class", "data-built"],
    });
    q("#tj152Btn")?.addEventListener("click", () => setTimeout(mount, 40));
  }
  installObserver();
  setTimeout(mount, 0);

  /* Export a tiny UX status object; no algorithm changes. */
  window.TianjiSurface = Object.freeze({
    version: "1.0.0",
    build: V174_BUILD,
    philosophy: "default-simple / progressive-disclosure / chart-preserved",
    mount,
    sync,
    manifest: () => ({
      module: "Tianji Surface UX 1.0",
      build: V174_BUILD,
      preserved: [
        "#tj152Svg renderer",
        "planet/term/layer calculations",
        "time simulation",
        "inverse/search engine",
        "existing enlarged mode code",
      ],
      surfaced: ["看此刻", "出生对照", "时间推演", "显示预设"],
      folded: ["完整图层", "精细时间控制", "时空搜索/反演"],
      postponed: ["放大态重新设计"],
    }),
  });

  try {
    const bv = document.getElementById("buildVersion");

    window.TianjiSystemV174 = {
      version: "v174",
      build: V174_BUILD,
      tianjiSurfaceRedesign: true,
      chartPreserved: true,
      bigModeRedesignDeferred: true,
    };
  } catch (_) {}
})();
