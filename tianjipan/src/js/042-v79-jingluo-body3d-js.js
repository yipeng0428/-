(() => {
  const TS = "2026-10-04 02:06:36";
  window.BD3D = window.BD3D || { ry: 0, rx: -8, scale: 1 };
  const BD3D = window.BD3D;
  const q = (s, r = document) => r.querySelector(s),
    qa = (s, r = document) => Array.from(r.querySelectorAll(s));

  function jlRailHtml(cur) {
    return JL_MER.map(
      (m, i) =>
        `<button type="button" class="jl-mini${i === cur ? " on" : ""}" data-mi="${i}"><b>${m.z}时</b><span>${m.n}</span><small>${m.h}</small></button>`,
    ).join("");
  }

  window.jlSelect = function (i) {
    const p = q("#pane-jingluo");
    if (!p) return;
    qa(".jl-seg", p).forEach((g) => g.classList.toggle("on", +g.dataset.mi === i));
    qa(".jl-mini", p).forEach((g) => g.classList.toggle("on", +g.dataset.mi === i));
    const info = q("#jlInfo", p);
    if (info) info.innerHTML = jlInfoHtml(i);
  };

  window.renderJingluo = function (R) {
    const cur = R.bz.pill[3].b;
    JL.now = cur;
    const m = JL_MER[cur];
    const gz = R.bz.pill.map((p) => GAN[p.s] + ZHI[p.b]).join(" ");
    const jie = TERMS[Math.floor(R.t.lon / 15) % 24];
    const noteRows = [
      ["当前当令", `${m.z}时 · ${m.h}`],
      ["对应经络", m.n],
      ["阴阳 / 五行", `${m.yy}经 · ${m.wx}`],
      ["四柱", esc(gz)],
      ["节令", jie],
    ]
      .map((r) => `<tr><th>${r[0]}</th><td>${r[1]}</td></tr>`)
      .join("");
    return (
      `<div class="nw-card wide"><h3 class="sec">当下天人状态</h3>
    <div class="jl-now"><div class="jl-now-t"><b>${m.z}时</b><span>${m.h}</span></div>
    <div class="jl-now-b"><div>${m.n} <em>当令</em></div>
    <div class="dim sm">四柱 ${esc(gz)} · 日主${GAN[R.bz.dm]}${WXK[GAN_WX[R.bz.dm]]} · ${jie}</div>
    <p>${m.d}</p></div></div></div>
    <div class="nw-card wide"><h3 class="sec">子午流注图</h3>
      <div class="jl-zl-grid">
        <div>
          <div class="jl-stage">${jlRingSvg(cur)}</div>
          <div class="jl-rail">${jlRailHtml(cur)}</div>
          <p class="note jl-wide-note">现在把图容器扩展为整个模块区域，放大查看时不会再挤在小卡片里；下方十二个时辰按钮也可直接切换查看对应经络。</p>
        </div>
        <aside class="jl-sidecol">
          <div class="jl-info jl-sidebox" id="jlInfo">${jlInfoHtml(cur)}</div>
          <div class="jl-sidebox"><h4>即时读数</h4><div class="tbl-wrap"><table class="tbl"><tbody>${noteRows}</tbody></table></div></div>
          <div class="jl-sidebox"><h4>如何阅读</h4><ul class="jl-tiplist"><li>点击圆环扇区或下方时辰卡片，可查看对应经络与时段。</li><li>中间显示当前当令经络；外围按十二时辰顺序排列。</li><li>本页用于传统经络时间模型学习，不作现代医学诊断依据。</li></ul></div>
        </aside>
      </div>
    </div>
    <div class="nw-card wide"><h3 class="sec">天人关系</h3>${jlHeavenSvg(cur, R)}
    <p class="note">以起局时间为「当下」：天时（时辰·节气·值日宿）感应于人，五行生克、空间方位定位，气血运化于经络脏腑。此为传统文化框架，非实证医学结论。</p></div>` +
      bdHTML()
    );
  };

  function bd3dPathShape(o, c, back) {
    const tx = back ? -310 : 0;
    if (o.shape)
      return o.line
        ? `<path d="${o.shape}" transform="translate(${tx} 0)" style="fill:none;stroke:${c};stroke-width:6;stroke-opacity:.78"/>`
        : `<path d="${o.shape}" transform="translate(${tx} 0)" style="fill:${c};fill-opacity:.58;stroke:${c}"/>`;
    if (o.ring)
      return `<circle cx="${o.x + tx}" cy="${o.y}" r="${o.r}" style="fill:none;stroke:${c};stroke-dasharray:3 3"/>`;
    if (o.tag) return `<text x="${o.x + tx}" y="${o.y}" class="bd-tag">三焦 →</text>`;
    return `<circle cx="${o.x + tx}" cy="${o.y}" r="${o.r}" style="fill:${c};fill-opacity:.68;stroke:${c}"/>`;
  }
  function bd3dOverlay(back) {
    let g = "";
    if (BD.layer === "qj") {
      const front = ["ren", "chong", "yinq", "yinw"],
        rear = ["du", "yangq", "yangw"];
      const use = BD_QJ.filter((m) => (back ? rear : front).includes(m.k));
      use.forEach((m) => {
        const on = BD.sel === m.k,
          dim = BD.sel && !on;
        const tx = back ? -310 : 0;
        g += `<g class="bd-hit${on ? " on" : ""}" data-bd="${m.k}" style="opacity:${dim ? 0.22 : 1}"><path d="${m.d}" transform="translate(${tx} 0)" class="bd-ln" style="stroke:${m.c}"/><path d="${m.d}" transform="translate(${tx} 0)" class="bd-hitln"/>${m.pts.map(([n, x, y]) => `<circle cx="${x + tx}" cy="${y}" r="3.4" style="fill:${m.c}"/>`).join("")}</g>`;
      });
      const daiOn = BD.sel === "dai",
        daiColor = "#4fae8f";
      g += `<g class="bd-hit${daiOn ? " on" : ""}" data-bd="dai"><path d="M114,262 C130,276 190,276 206,262 C190,250 130,250 114,262" class="bd-ln" style="stroke:${daiColor}"/><path d="M114,262 C130,276 190,276 206,262 C190,250 130,250 114,262" class="bd-hitln"/></g>`;
    }
    if (BD.layer === "zf") {
      const orgs = back
        ? BD_ZF.filter((o) => ["shen"].includes(o.k))
        : BD_ZF.filter((o) => !["shen"].includes(o.k) && !o.tag);
      orgs.forEach((o) => {
        const on = BD.sel === o.k,
          c = BD_WXC[o.wx];
        g += `<g class="bd-hit${on ? " on" : ""}" data-bd="${o.k}">${bd3dPathShape(o, c, back)}</g>`;
      });
    }
    if (BD.layer === "sj") {
      if (!back) {
        BD_SJ.forEach((b) => {
          const on = BD.sel === b.k;
          g += `<g class="bd-hit${on ? " on" : ""}" data-bd="${b.k}"><rect x="98" y="${b.y0}" width="124" height="${b.y1 - b.y0}" style="fill:${b.c};fill-opacity:${on ? 0.42 : 0.18};stroke:${b.c};stroke-dasharray:4 3"/></g>`;
        });
        BD_DT.forEach((d) => {
          const on = BD.sel === d.k;
          g += `<g class="bd-hit${on ? " on" : ""}" data-bd="${d.k}"><circle cx="${d.x}" cy="${d.y}" r="${on ? 13 : 10}" class="bd-dt"/><circle cx="${d.x}" cy="${d.y}" r="4" style="fill:var(--gold2)"/></g>`;
        });
      } else {
        g += `<text x="160" y="282" text-anchor="middle" class="bd-cap">三焦 / 丹田以正面示意为主</text>`;
      }
    }
    return g;
  }
  function bd3dSvg(back) {
    return `<svg viewBox="40 0 240 575" role="img" aria-label="人体图谱${back ? "背面" : "正面"}3D示意"><ellipse cx="160" cy="542" rx="62" ry="10" fill="rgba(0,0,0,.06)"/>${bdFigure(160, back)}<line x1="160" y1="20" x2="160" y2="545" class="bd-mid"/>${bd3dOverlay(back)}</svg>`;
  }
  function bd3dPins() {
    const map = {
      qj: [
        ["ren", "任脉", 36, 36],
        ["du", "督脉", 64, 36],
        ["chong", "冲脉", 38, 60],
        ["dai", "带脉", 30, 78],
        ["yinq", "阴跷", 24, 92],
        ["yangq", "阳跷", 76, 92],
        ["yinw", "阴维", 18, 48],
        ["yangw", "阳维", 82, 48],
      ],
      zf: [
        ["fei", "肺", 30, 28],
        ["xin", "心", 42, 36],
        ["gan", "肝", 38, 52],
        ["pi", "脾", 54, 56],
        ["wei", "胃", 56, 64],
        ["xc", "小肠", 44, 76],
        ["dc", "大肠", 28, 76],
        ["pg", "膀胱", 44, 90],
        ["shen", "肾", 70, 52],
      ],
      sj: [
        ["sj1", "上焦", 32, 28],
        ["sj2", "中焦", 32, 54],
        ["sj3", "下焦", 32, 82],
        ["dt1", "上丹田", 64, 16],
        ["dt2", "中丹田", 64, 38],
        ["dt3", "下丹田", 64, 72],
      ],
    };
    return (map[BD.layer] || [])
      .map(
        ([k, n, l, t]) =>
          `<button type="button" class="bd3d-hit${BD.sel === k ? " on" : ""}" data-bd="${k}" style="left:${l}%;top:${t}%"><i></i><span>${n}</span></button>`,
      )
      .join("");
  }
  function bd3dLegend() {
    if (BD.layer === "qj")
      return `<div class="bd3d-legend"><span><i style="background:#5aa6c8"></i>任 / 阴跷 / 阴维</span><span><i style="background:#d9b25f"></i>督脉</span><span><i style="background:#c8452e"></i>冲脉</span><span><i style="background:#4fae8f"></i>带脉</span></div>`;
    if (BD.layer === "zf")
      return `<div class="bd3d-legend">${["木", "火", "土", "金", "水"].map((x) => `<span><i style="background:${BD_WXC[x]}"></i>${x}</span>`).join("")}</div>`;
    return `<div class="bd3d-legend"><span><i style="background:#e0655a"></i>上焦</span><span><i style="background:#d9b25f"></i>中焦</span><span><i style="background:#5aa6c8"></i>下焦 / 丹田</span></div>`;
  }
  function bd3dHTML() {
    return `<div class="bd3d-module"><div class="bd3d-bar"><button type="button" class="gbtn sm${Math.abs((((BD3D.ry % 360) + 360) % 360) - 180) < 60 ? "" : " on"}" id="bd3dFront">正面</button><button type="button" class="gbtn sm${Math.abs((((BD3D.ry % 360) + 360) % 360) - 180) < 60 ? " on" : ""}" id="bd3dBack">背面</button><button type="button" class="gbtn sm" id="bd3dReset">复位</button><span class="bd3d-hint">拖动旋转 · 滚轮缩放 · 双击复位</span><span class="bd3d-zoom"><button type="button" class="gbtn sm" id="bd3dMinus">−</button><b class="bd3d-read" id="bd3dRead">100%</b><button type="button" class="gbtn sm" id="bd3dPlus">＋</button><button type="button" class="gbtn sm bd3d-fs" id="bd3dFs">放大</button></span></div><div class="bd3d-card-wrap"><div class="bd3d-stage" id="bd3dStage"><div class="bd3d-floor"></div><div class="bd3d-card" id="bd3dCard"><div class="bd3d-face front">${bd3dSvg(false)}</div><div class="bd3d-face back">${bd3dSvg(true)}</div></div><div class="bd3d-pins">${bd3dPins()}</div></div><aside class="bd3d-side"><div class="bd3d-cardnote"><h4>3D 人体模拟</h4><p>这里把人体图谱改成了一个可拖动查看的 3D 模拟卡片：你可以手动旋转到正面或背面，用滚轮或右上角按钮缩放，也可以点“放大”进入更大的查看区域。</p>${bd3dLegend()}</div><div class="bd3d-cardnote"><h4>使用建议</h4><ul><li>先用 3D 视图看整体方位与前后关系。</li><li>再用下方平面图做精确阅读和查看详细说明。</li><li>点击金色热点，可同步联动右侧说明卡。</li></ul></div></aside></div></div>`;
  }

  window.bdHTML = function () {
    const tab = (k, n) =>
      `<button type="button" class="chip${BD.layer === k ? " on" : ""}" data-bdl="${k}">${n}</button>`;
    return `<section id="bdBlock"><div class="panel blk bdp" id="bdPanel">${phHead("人体图谱", "奇经八脉 · 五脏六腑 · 三焦与三丹田 —— 正面 + 背面,点部位看说明")}
    <div class="bd-tabs">${tab("qj", "奇经八脉")}${tab("zf", "五脏六腑")}${tab("sj", "三焦 · 丹田")}</div>
    ${bd3dHTML()}
    <div class="bd-flat-wrap"><div class="nt-fig bd-flat-fig">${bdSvg()}</div><div class="nt-side" id="bdInfo">${bdInfo()}</div></div>
    ${phNote("上方新增 3D 人体模拟，便于前后观察；下方平面图继续保留，用来精细阅读。图为本站自绘的示意图：人体比例、穴位位置均为大致示意，不能用于取穴。经脉走行与原文依据《黄帝内经》《难经》等公开古籍；各家注本对奇经的具体循行有出入，这里取通行说法。", "关于这张图")}</div>
    <div class="panel blk bdp">${phHead("命主身体倾向", "按命盘五行分布对应脏腑系统(传统观念)")}${bdPerson()}</div>
    <div class="panel blk bdp">${phHead("今日子午流注作息", "● 为当前时辰; ★ 为与你偏弱五行相关的时辰")}${bdSchedule()}</div></section>`;
  };

  function bd3dApply() {
    const shell = q("#bd3dStage");
    const card = q("#bd3dCard");
    const read = q("#bd3dRead");
    if (!shell || !card) return;
    const ry = ((BD3D.ry % 360) + 360) % 360;
    const frontActive = Math.abs(ry - 180) >= 60;
    shell.style.setProperty("--bd3d-ry", BD3D.ry + "deg");
    shell.style.setProperty("--bd3d-rx", BD3D.rx + "deg");
    shell.style.setProperty("--bd3d-scale", BD3D.scale);
    if (read) read.textContent = Math.round(BD3D.scale * 100) + "%";
    const bf = q("#bd3dFront"),
      bb = q("#bd3dBack");
    if (bf) bf.classList.toggle("on", frontActive);
    if (bb) bb.classList.toggle("on", !frontActive);
  }
  function bd3dReset() {
    BD3D.ry = 0;
    BD3D.rx = -8;
    BD3D.scale = 1;
    bd3dApply();
  }
  function bd3dBind() {
    const stage = q("#bd3dStage");
    if (!stage) return;
    let drag = null;
    q("#bd3dFront")?.addEventListener("click", () => {
      BD3D.ry = 0;
      bd3dApply();
    });
    q("#bd3dBack")?.addEventListener("click", () => {
      BD3D.ry = 180;
      bd3dApply();
    });
    q("#bd3dReset")?.addEventListener("click", bd3dReset);
    q("#bd3dMinus")?.addEventListener("click", () => {
      BD3D.scale = Math.max(0.72, BD3D.scale - 0.08);
      bd3dApply();
    });
    q("#bd3dPlus")?.addEventListener("click", () => {
      BD3D.scale = Math.min(1.72, BD3D.scale + 0.08);
      bd3dApply();
    });
    q("#bd3dFs")?.addEventListener("click", async () => {
      const shell = q("#bdBlock");
      if (!shell) return;
      try {
        if (document.fullscreenElement) await document.exitFullscreen();
        else await shell.requestFullscreen();
      } catch (_) {
        if (typeof toast === "function") toast("当前浏览器不允许全屏");
      }
    });
    stage.addEventListener(
      "wheel",
      (e) => {
        e.preventDefault();
        BD3D.scale = Math.max(0.72, Math.min(1.72, BD3D.scale + (e.deltaY < 0 ? 0.06 : -0.06)));
        bd3dApply();
      },
      { passive: false },
    );
    stage.addEventListener("dblclick", (e) => {
      e.preventDefault();
      bd3dReset();
    });
    stage.addEventListener("pointerdown", (e) => {
      if (e.button > 0 || e.target.closest(".bd3d-hit")) return;
      drag = { id: e.pointerId, x: e.clientX, y: e.clientY, ry: BD3D.ry, rx: BD3D.rx };
      stage.classList.add("grab");
      try {
        stage.setPointerCapture(e.pointerId);
      } catch (_) {}
    });
    stage.addEventListener("pointermove", (e) => {
      if (!drag || e.pointerId !== drag.id) return;
      BD3D.ry = drag.ry + (e.clientX - drag.x) * 0.45;
      BD3D.rx = Math.max(-24, Math.min(24, drag.rx - (e.clientY - drag.y) * 0.18));
      bd3dApply();
    });
    const up = (e) => {
      if (!drag || e.pointerId !== drag.id) return;
      drag = null;
      stage.classList.remove("grab");
    };
    stage.addEventListener("pointerup", up);
    stage.addEventListener("pointercancel", () => {
      drag = null;
      stage.classList.remove("grab");
    });
    bd3dApply();
  }

  window.bdBind = function () {
    const re = () => {
      const p = q("#bdBlock");
      if (!p) return;
      const tmp = document.createElement("div");
      tmp.innerHTML = bdHTML();
      p.replaceWith(tmp.firstElementChild);
      bdBind();
      try {
        if (typeof zmScan === "function") zmScan();
      } catch (_) {}
    };
    qa("[data-bdl]").forEach(
      (b) =>
        (b.onclick = () => {
          BD.layer = b.dataset.bdl;
          BD.sel = null;
          re();
        }),
    );
    qa("#bdSvg .bd-hit,[data-bd]").forEach(
      (g) =>
        (g.onclick = () => {
          const k = g.dataset.bd;
          if (!k) return;
          BD.sel = BD.sel === k ? null : k;
          re();
        }),
    );
    bd3dBind();
  };

  window.bindJingluo = function () {
    const p = q("#pane-jingluo");
    if (!p) return;
    qa("[data-mi]", p).forEach((g) => g.addEventListener("click", () => jlSelect(+g.dataset.mi)));
    try {
      bdBind();
    } catch (e) {
      console.error(e);
    }
    try {
      if (typeof zmScan === "function") zmScan();
    } catch (_) {}
  };
  window.jingluoRefresh = function () {
    const p = q("#pane-jingluo");
    if (!p || !window.R) return;
    p.innerHTML = renderJingluo(R);
    bindJingluo();
  };

  try {
    const bv = document.getElementById("buildVersion");
  } catch (_) {}
})();
