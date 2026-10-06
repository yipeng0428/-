(() => {
  const TS = "2026-10-04 02:31:47";
  const q = (s, r = document) => r.querySelector(s),
    qa = (s, r = document) => Array.from(r.querySelectorAll(s));
  const WXN81 = ["木", "火", "土", "金", "水"];
  const HE81 = [1, 0, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2];

  function jl81WxIndex(wx) {
    return wx === "相火" ? 1 : WXN81.indexOf(wx);
  }
  function jl81WxRel(dm, wx) {
    const a = GAN_WX[dm],
      b = jl81WxIndex(wx),
      r = (b - a + 5) % 5;
    return ["同我 · 比和", "我生 · 泄", "我克 · 财", "克我 · 官杀", "生我 · 印"][r] || "—";
  }
  function jl81Pair(i) {
    return i % 2 === 0 ? i + 1 : i - 1;
  }
  function jl81RealNow() {
    const n = nowBJ(),
      i = n.h === 23 ? 0 : Math.floor((n.h + 1) / 2) % 12;
    return { n, i };
  }
  function jl81Remain() {
    const { n, i } = jl81RealNow();
    const starts = [23, 1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21];
    let end = (starts[i] + 2) % 24,
      mins;
    if (i === 0) mins = 1 * 60 - (n.h === 23 ? (n.h - 23) * 60 + n.mi : n.mi);
    else {
      const cur = n.h * 60 + n.mi;
      let e = end * 60;
      if (end === 0) e = 24 * 60;
      mins = e - cur;
    }
    return Math.max(0, mins);
  }
  function jl81BranchLinks(i) {
    if (!R || !R.bz) return { same: [], he: [], chong: [] };
    const bs = R.bz.pill.map((p, k) => ({ b: p.b, k: ["年", "月", "日", "时"][k] }));
    return {
      same: bs.filter((x) => x.b === i),
      he: bs.filter((x) => x.b === HE81[i]),
      chong: bs.filter((x) => x.b === (i + 6) % 12),
    };
  }
  function jl81Favor(i) {
    if (!R || !R.bz) return { txt: "—", detail: "未载入人物命盘" };
    try {
      const st = strength(R.bz),
        xy = xiyong(R.bz, st),
        wi = jl81WxIndex(JL_MER[i].wx);
      const flag = xy.favor.includes(wi) ? "喜用相关" : xy.avoid.includes(wi) ? "忌神相关" : "中性";
      return {
        txt: flag,
        detail: `日主 ${GAN[R.bz.dm]}${WXN81[GAN_WX[R.bz.dm]]} · ${st.level} · 喜用 ${xy.favor.map((x) => WXN81[x]).join("、") || "—"} · 忌 ${xy.avoid.map((x) => WXN81[x]).join("、") || "—"}`,
      };
    } catch (_) {
      return { txt: "—", detail: "命主喜忌暂不可用" };
    }
  }
  function jl81WxState(i) {
    if (!R || !R.bz) return { txt: "—", detail: "—" };
    try {
      const c = wxContrib(R.bz),
        sum = c.tot.reduce((a, b) => a + b, 0) || 1,
        wi = jl81WxIndex(JL_MER[i].wx),
        pct = c.tot[wi] / sum;
      const strong = c.tot.indexOf(Math.max(...c.tot)),
        weak = c.tot.indexOf(Math.min(...c.tot));
      return {
        txt: `${WXN81[wi]} ${(pct * 100).toFixed(0)}%`,
        detail: `命局最强 ${WXN81[strong]} · 最弱 ${WXN81[weak]}`,
      };
    } catch (_) {
      return { txt: "—", detail: "—" };
    }
  }
  function jl81RelationText(i) {
    const r = jl81BranchLinks(i),
      parts = [];
    if (r.same.length) parts.push(`同支：${r.same.map((x) => x.k + "支").join("、")}`);
    if (r.he.length) parts.push(`六合：${r.he.map((x) => x.k + "支" + ZHI[x.b]).join("、")}`);
    if (r.chong.length) parts.push(`六冲：${r.chong.map((x) => x.k + "支" + ZHI[x.b]).join("、")}`);
    return parts.length ? parts.join("；") : "与命主四支无同支、六合或六冲";
  }
  function jl81Html(i) {
    i = i == null ? JL.now : i;
    const m = JL_MER[i],
      pair = JL_MER[jl81Pair(i)],
      prev = JL_MER[(i + 11) % 12],
      next = JL_MER[(i + 1) % 12];
    const real = jl81RealNow(),
      fav = jl81Favor(i),
      ws = jl81WxState(i),
      rel = jl81RelationText(i),
      remain = jl81Remain();
    const actual = i === real.i;
    return `<div class="panel jl-link-card${actual ? " jl-observe" : ""}" id="jlLinkCard">
    <div class="jl-link-head"><h4>子午流注 · 数据联动</h4><small>${actual ? "正在观察当前真实时辰" : "正在手动观察 " + m.z + "时"} · 传统体系内部关系</small></div>
    <div class="jl-link-kpis">
      <div class="jl-link-kpi"><small>观察时辰</small><b>${m.z}时 · ${m.h}</b><span>${actual ? "当前真实时辰" : "手动选择"}</span></div>
      <div class="jl-link-kpi"><small>当令经络</small><b>${m.n}</b><span>${m.yy} · ${m.wx}</span></div>
      <div class="jl-link-kpi"><small>表里相配</small><b>${pair.n}</b><span>${pair.z}时 · ${pair.wx}</span></div>
      <div class="jl-link-kpi"><small>命主喜忌联动</small><b>${fav.txt}</b><span>${jl81WxRel(R && R.bz ? R.bz.dm : 0, m.wx)}</span></div>
      <div class="jl-link-kpi"><small>命局该五行</small><b>${ws.txt}</b><span>${ws.detail}</span></div>
    </div>
    <div class="jl-link-grid">
      <div class="jl-link-box"><h5>时序关系</h5>
       <div class="jl-link-rel"><span>前一时辰</span><b>${prev.z} · ${prev.n}</b><span>当前观察</span><b>${m.z} · ${m.n}</b><span>后一时辰</span><b>${next.z} · ${next.n}</b><span>当前真实时辰</span><b>${JL_MER[real.i].z} · ${JL_MER[real.i].n}${i === real.i ? ` · 距交接约 ${remain} 分钟` : ""}</b></div>
      </div>
      <div class="jl-link-box"><h5>命主 × 时辰</h5>
       <p>${fav.detail}</p><p><b>${m.z}支关系：</b>${rel}</p>
       <div class="jl-link-tags"><span>时支 ${m.z}</span><span>${m.yy}经</span><span>${m.wx}</span><span>${jl81WxRel(R && R.bz ? R.bz.dm : 0, m.wx)}</span><span>${fav.txt}</span></div>
       <p class="muted">这里把命主五行与当前/所选时辰做结构联动，仅展示传统命理、经络模型内部对应，不把它解释为器官活性或医学诊断。</p>
      </div>
    </div>
    <div class="jl-link-actions">
      <button type="button" class="gbtn sm" data-jl81go="body">人体图谱定位</button>
      <button type="button" class="gbtn sm" data-jl81go="wxflow">五行流通</button>
      <button type="button" class="gbtn sm" data-jl81go="bridge">地支枢纽</button>
      <button type="button" class="gbtn sm" data-jl81go="now">此刻</button>
      <button type="button" class="gbtn sm" data-jl81go="zlf">盘库 · 子午流注时盘</button>
    </div>
   </div>`;
  }
  function jl81BodyKey(i) {
    const names = [
        "胆",
        "肝",
        "肺",
        "大肠",
        "胃",
        "脾",
        "心",
        "小肠",
        "膀胱",
        "肾",
        "心包",
        "三焦",
      ],
      n = names[i];
    const o = BD_ZF.find((x) => x.n === n);
    return o ? o.k : null;
  }
  function jl81BindActions(i) {
    const card = q("#jlLinkCard");
    if (!card) return;
    qa("[data-jl81go]", card).forEach(
      (b) =>
        (b.onclick = () => {
          const k = b.dataset.jl81go;
          if (k === "body") {
            const key = jl81BodyKey(i);
            BD.layer = "zf";
            BD.sel = key;
            const block = q("#bdBlock");
            if (block) {
              const tmp = document.createElement("div");
              tmp.innerHTML = bdHTML();
              block.replaceWith(tmp.firstElementChild);
              bdBind();
            }
            setTimeout(
              () => q("#bdBlock")?.scrollIntoView({ behavior: "smooth", block: "start" }),
              40,
            );
          } else if (k === "wxflow") {
            selectTab("wxflow", true);
          } else if (k === "bridge") {
            try {
              fxSet("zhi", i, "子午流注");
            } catch (_) {}
            selectTab("bridge", true);
          } else if (k === "now") {
            selectTab("now", true);
          } else if (k === "zlf") {
            try {
              if (typeof zlfOpen === "function") zlfOpen();
              else selectTab("studio", true);
            } catch (_) {
              selectTab("studio", true);
            }
          }
        }),
    );
  }
  function jl81CleanZoom() {
    qa("#pane-jingluo svg.jl-ring").forEach((el) => {
      el.setAttribute("data-nozoom", "1");
      if (el._zb) {
        try {
          el._zb.remove();
        } catch (_) {}
        el._zb = null;
      }
      const p = el.parentElement;
      if (p) qa(":scope > .zbtn,:scope > .zoom-ui", p).forEach((b) => b.remove());
    });
  }

  const _ring81 = window.jlRingSvg;
  window.jlRingSvg = function (cur) {
    let h = _ring81(cur);
    return h.replace("<svg ", '<svg data-nozoom="1" ');
  };

  const _render81 = window.renderJingluo;
  window.renderJingluo = function (R) {
    JL.sel = JL.sel == null ? R.bz.pill[3].b : JL.sel;
    let h = _render81(R);
    const anchor = '<div class="nw-card wide"><h3 class="sec">天人关系</h3>';
    if (h.includes(anchor)) h = h.replace(anchor, jl81Html(JL.sel) + anchor);
    else h += jl81Html(JL.sel);
    return h;
  };

  window.jlSelect = function (i) {
    JL.sel = i;
    const p = q("#pane-jingluo");
    if (!p) return;
    qa(".jl-seg", p).forEach((g) => g.classList.toggle("on", +g.dataset.mi === i));
    qa(".jl-mini", p).forEach((g) => g.classList.toggle("on", +g.dataset.mi === i));
    const info = q("#jlInfo", p);
    if (info) info.innerHTML = jlInfoHtml(i);
    const old = q("#jlLinkCard", p);
    if (old) {
      const tmp = document.createElement("div");
      tmp.innerHTML = jl81Html(i);
      old.replaceWith(tmp.firstElementChild);
      jl81BindActions(i);
    }
    jl81CleanZoom();
  };

  const _bind81 = window.bindJingluo;
  window.bindJingluo = function () {
    _bind81();
    const p = q("#pane-jingluo");
    if (!p) return;
    qa("[data-mi]", p).forEach((g) => {
      g.onclick = () => jlSelect(+g.dataset.mi);
    });
    jl81BindActions(JL.sel == null ? JL.now : JL.sel);
    jl81CleanZoom();
  };

  try {
    const _zm81 = window.zmScan;
    if (typeof _zm81 === "function")
      window.zmScan = function () {
        qa("#pane-jingluo svg.jl-ring").forEach((el) => el.setAttribute("data-nozoom", "1"));
        const r = _zm81();
        jl81CleanZoom();
        return r;
      };
  } catch (_) {}

  try {
    if (q("#pane-jingluo")?.classList.contains("on") && window.R) jingluoRefresh();
    jl81CleanZoom();
  } catch (_) {}

  try {
    const bv = q("#buildVersion");
  } catch (_) {}
})();
