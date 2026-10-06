/* ===== v56 · 建除十二神 · 月建流转盘 ===== */
(function () {
  const JC12 = {
    civ: null,
    mode: "auto",
    manualMz: 2,
    play: null,
    gesture: "select",
    view: { x: -440, y: -440, w: 880, h: 880 },
    layers: { tianshen: 1, tone: 1, monthbreak: 1 },
  };
  const JC12_META = {
    建: {
      key: "建立 · 起始",
      txt: "以月建为起点，象征建立与开端。通书中常作平性值日，具体事项仍须结合宜忌。",
      use: "适合理解“起始、设立”的象义，不应仅凭一个“建”字决定事项。",
    },
    除: {
      key: "解除 · 清理",
      txt: "“除”取去旧更新之意，传统速记多联想到解除、清理、整治。",
      use: "适合观察解除类事项的传统象义，仍需核对该日实际宜忌。",
    },
    满: {
      key: "盈满 · 丰足",
      txt: "“满”有充盈、完备之象。部分事项取其丰足，部分事项又忌过满。",
      use: "不宜机械解释为“凡事大吉”，不同事项取义不同。",
    },
    平: {
      key: "平正 · 修整",
      txt: "“平”强调平衡、平常、修整，道路修治等传统条目常见其象义。",
      use: "多作中性理解，是否适合仍看事项与其它历注。",
    },
    定: {
      key: "安定 · 确立",
      txt: "“定”取安定、确定、稳定之义，传统常用于需要“定下来”的象征理解。",
      use: "它不是现代合同或重大决定的自动吉日标签。",
    },
    执: {
      key: "执持 · 执行",
      txt: "“执”有持守、执行、掌握之意，常被理解为执行与守成。",
      use: "通用速记仅帮助理解名称，不替代逐项择日。",
    },
    破: {
      key: "破除 · 月破",
      txt: "日支与月建相冲时为“破”，是十二值中结构最明确的对冲位置。",
      use: "传统历书通常较谨慎看待月破，但仍应阅读具体宜忌，不能直接推断现实结果。",
    },
    危: {
      key: "谨慎 · 临高",
      txt: "“危”强调警觉与谨慎，不等于必然发生危险。",
      use: "更适合作为传统象义提醒，而不是风险预测。",
    },
    成: {
      key: "成就 · 完成",
      txt: "“成”取成就、完成、形成之象，在传统速记中常被视为较积极的位置。",
      use: "是否适合具体事项仍以当日宜忌及所用择日体系为准。",
    },
    收: {
      key: "收纳 · 收成",
      txt: "“收”取收束、收纳、收获之意，对需要开启、扩张的事项未必同义。",
      use: "应根据事项是“收”还是“开”来理解，不宜只看吉凶标签。",
    },
    开: {
      key: "开启 · 开张",
      txt: "“开”取开放、开启、通达之意，是十二值中容易理解的一类象义。",
      use: "现代开业、上线、发布与古代“开市”等仍需明确参照范围。",
    },
    闭: {
      key: "闭藏 · 收敛",
      txt: "“闭”取关闭、封藏、静止之意，与开相对。",
      use: "传统上偏收敛，并不表示这一天所有事情都不可进行。",
    },
  };
  function jc12Now() {
    try {
      const n = nowBJ();
      return { y: n.y, m: n.m, d: n.d };
    } catch (_) {
      const n = new Date();
      return { y: n.getFullYear(), m: n.getMonth() + 1, d: n.getDate() };
    }
  }
  function jc12Fmt(c) {
    return `${c.y}-${String(c.m).padStart(2, "0")}-${String(c.d).padStart(2, "0")}`;
  }
  function jc12Parse(v) {
    if (!v) return null;
    const a = v.split("-").map(Number);
    if (a.length < 3 || !a[0] || !a[1] || !a[2]) return null;
    return { y: a[0], m: a[1], d: a[2] };
  }
  function jc12Add(c, n) {
    try {
      const f = fromJD(jdFromGreg(c.y, c.m, c.d, 12) + n);
      return { y: f.y, m: f.m, d: f.d };
    } catch (_) {
      const d = new Date(Date.UTC(c.y, c.m - 1, c.d + n, 12));
      return { y: d.getUTCFullYear(), m: d.getUTCMonth() + 1, d: d.getUTCDate() };
    }
  }
  function jc12Data(c) {
    const di = dayInfo(c.y, c.m, c.d),
      dz = di.dayIdx % 12,
      mz = JC12.mode === "manual" ? JC12.manualMz : di.mz,
      idx = (dz - mz + 12) % 12,
      zx = JCHU[idx],
      tone = JCHU_TONE[zx],
      ts = TIANSHEN[(((dz - tianshenStart(mz)) % 12) + 12) % 12];
    return { c, di, dz, mz, idx, zx, tone, ts, huang: TS_HUANG.includes(ts), actualZx: di.zx };
  }
  function jc12ToneClass(t) {
    return t === "吉" ? "good" : t === "凶" ? "bad" : "";
  }
  function jc12Polar(r, deg) {
    const a = ((deg - 90) * Math.PI) / 180;
    return [r * Math.cos(a), r * Math.sin(a)];
  }
  function jc12Path(r0, r1, a0, a1) {
    const p1 = jc12Polar(r1, a0),
      p2 = jc12Polar(r1, a1),
      p3 = jc12Polar(r0, a1),
      p4 = jc12Polar(r0, a0);
    return `M${p1[0].toFixed(2)},${p1[1].toFixed(2)} A${r1},${r1} 0 0 1 ${p2[0].toFixed(2)},${p2[1].toFixed(2)} L${p3[0].toFixed(2)},${p3[1].toFixed(2)} A${r0},${r0} 0 0 0 ${p4[0].toFixed(2)},${p4[1].toFixed(2)} Z`;
  }
  function jc12Svg(D) {
    let o = `<circle r="402" class="jc12-ring"/><circle r="360" class="jc12-ring thin"/><circle r="286" class="jc12-ring"/><circle r="205" class="jc12-ring thin"/><circle r="140" class="jc12-center"/>`;
    for (let b = 0; b < 12; b++) {
      const a = b * 30,
        a0 = a - 15,
        a1 = a + 15,
        i = (b - D.mz + 12) % 12,
        z = JCHU[i],
        tone = JCHU_TONE[z],
        cur = b === D.dz,
        mon = b === D.mz,
        brk = i === 6,
        pc = jc12Polar(324, a),
        pz = jc12Polar(381, a),
        pt = jc12Polar(244, a),
        pts = jc12Polar(174, a);
      o += `<g data-jc12b="${b}" data-jc12z="${z}"><path d="${jc12Path(286, 360, a0, a1)}" class="jc12-sector${cur ? " current" : ""}${mon ? " month" : ""}${brk && JC12.layers.monthbreak ? " break" : ""}"/><text x="${pz[0]}" y="${pz[1]}" class="jc12-text jc12-zhi">${ZHI[b]}</text><text x="${pc[0]}" y="${pc[1]}" class="jc12-text jc12-god ${jc12ToneClass(tone)}">${z}</text>${JC12.layers.tone ? `<text x="${pt[0]}" y="${pt[1] + 14}" class="jc12-text jc12-tone">${tone} · ${JC12_META[z].key.split(" · ")[0]}</text>` : ""}${JC12.layers.tianshen ? `<text x="${pts[0]}" y="${pts[1]}" class="jc12-text jc12-ts ${TS_HUANG.includes(TIANSHEN[(((b - tianshenStart(D.mz)) % 12) + 12) % 12]) ? "huang" : ""}">${TIANSHEN[(((b - tianshenStart(D.mz)) % 12) + 12) % 12]}</text>` : ""}</g>`;
    }
    const pm = jc12Polar(395, D.mz * 30),
      pd = jc12Polar(278, D.dz * 30),
      pd2 = jc12Polar(366, D.dz * 30);
    o += `<line x1="0" y1="0" x2="${pm[0]}" y2="${pm[1]}" class="jc12-pointer-month" opacity=".72"/><circle cx="${pm[0]}" cy="${pm[1]}" r="6" class="jc12-moon-dot"/><line x1="${pd[0]}" y1="${pd[1]}" x2="${pd2[0]}" y2="${pd2[1]}" class="jc12-pointer-day"/><circle cx="${pd2[0]}" cy="${pd2[1]}" r="6" class="jc12-pointer-dot"/>`;
    o += `<text x="0" y="-54" class="jc12-text jc12-center-sm">${D.c.y}年${D.c.m}月${D.c.d}日 · ${D.di.gz}日</text><text x="0" y="-8" class="jc12-text jc12-center-title ${D.tone === "凶" ? "jc12-center-bad" : ""}">${D.zx}</text><text x="0" y="28" class="jc12-text jc12-center-sub">${ZHI[D.mz]}月建 · ${ZHI[D.dz]}日支 · ${D.tone}</text><text x="0" y="52" class="jc12-text jc12-center-sm">序差 ${D.idx} · ${D.ts}${D.huang ? " · 黄道" : " · 黑道"}</text>`;
    return o;
  }
  function jc12View() {
    const s = $("#jc12Svg");
    if (!s) return;
    s.setAttribute("viewBox", `${JC12.view.x} ${JC12.view.y} ${JC12.view.w} ${JC12.view.w}`);
    const z = $("#jc12Zoom");
    if (z) z.textContent = Math.round((880 / JC12.view.w) * 100) + "%";
  }
  function jc12Fit() {
    JC12.view = { x: -440, y: -440, w: 880, h: 880 };
    jc12View();
  }
  function jc12ZoomAt(f, cx, cy) {
    const s = $("#jc12Svg");
    if (!s) return;
    const r = s.getBoundingClientRect(),
      V = JC12.view,
      nw = Math.max(420, Math.min(1450, V.w * f)),
      mx = V.x + ((cx - r.left) / r.width) * V.w,
      my = V.y + ((cy - r.top) / r.height) * V.w,
      k = nw / V.w;
    V.x = mx - (mx - V.x) * k;
    V.y = my - (my - V.y) * k;
    V.w = nw;
    V.h = nw;
    jc12View();
  }
  function jc12Info(D) {
    const box = $("#jc12Info");
    if (!box) return;
    const M = JC12_META[D.zx],
      yi = (D.di.yi || []).slice(0, 10),
      ji = (D.di.ji || []).slice(0, 10),
      modeNote =
        JC12.mode === "manual" && D.actualZx !== D.zx
          ? `<div class="jc12-card"><b>手动月建演示：</b>当前以 ${ZHI[D.mz]} 为假定月建，因此结构值为“${D.zx}”；本站真实黄历按当日节令月建计算为“${D.actualZx}”。手动模式只用于学习十二神怎样随月建旋转。</div>`
          : "";
    box.innerHTML = `<h4>当日读数</h4><div class="jc12-kpis"><div class="jc12-kpi"><small>建除值日</small><b class="${jc12ToneClass(D.tone)}">${D.zx} · ${D.tone}</b></div><div class="jc12-kpi"><small>月建 / 日支</small><b>${ZHI[D.mz]} → ${ZHI[D.dz]}</b></div><div class="jc12-kpi"><small>十二天神</small><b class="${D.huang ? "good" : "bad"}">${D.ts} · ${D.huang ? "黄道" : "黑道"}</b></div><div class="jc12-kpi"><small>值日宿</small><b>${D.di.xiu}</b></div></div><div class="jc12-facts"><span>日期</span><b>${D.c.y}-${String(D.c.m).padStart(2, "0")}-${String(D.c.d).padStart(2, "0")} · 周${"日一二三四五六"[D.di.week]}</b><span>日柱</span><b>${D.di.gz} · ${D.di.nayin}</b><span>算法关系</span><b>(${ZHI[D.dz]}日支 − ${ZHI[D.mz]}月建) mod 12 = ${D.idx} → ${D.zx}</b><span>月破位置</span><b>${ZHI[(D.mz + 6) % 12]} · 破</b><span>冲 / 煞</span><b>冲${D.di.chong} · 煞${D.di.sha}</b></div><div class="jc12-card"><b>${D.zx} · ${M.key}</b><br>${M.txt}<br><span class="dim">${M.use}</span><div class="jc12-tags"><span class="${jc12ToneClass(D.tone)}">传统速记：${D.tone}</span><span>月建 ${ZHI[D.mz]}</span><span>日支 ${ZHI[D.dz]}</span></div></div>${modeNote}<div class="jc12-card"><b>当日黄历宜忌</b><div class="jc12-yj"><div><strong>宜</strong><div class="pills">${yi.length ? yi.map((x) => `<span>${esc(x)}</span>`).join("") : "<span>—</span>"}</div></div><div><strong>忌</strong><div class="pills ji">${ji.length ? ji.map((x) => `<span>${esc(x)}</span>`).join("") : "<span>—</span>"}</div></div></div><p class="dim" style="margin:6px 0 0">宜忌来自本站现有黄历数据；建除只是其中一个维度，不能替代完整择日。</p></div><div class="jc12-card"><b>相关模块</b><div class="jc12-links"><button class="gbtn sm" data-jc12link="calendar">万年历此日</button><button class="gbtn sm" data-jc12link="zeri">择日</button><button class="gbtn sm" data-jc12link="bridge">地支枢纽</button><button class="gbtn sm" data-jc12link="taisui">流年太岁盘</button><button class="gbtn sm" data-jc12link="sha">神煞方位</button></div></div>`;
  }
  function jc12Flow(D) {
    const w = $("#jc12Days");
    if (!w) return;
    let html = "";
    const today = jc12Now();
    for (let k = -6; k < 18; k++) {
      const c = jc12Add(D.c, k),
        x = dayInfo(c.y, c.m, c.d),
        on = k === 0,
        tod = c.y === today.y && c.m === today.m && c.d === today.d;
      html += `<button class="jc12-day ${jc12ToneClass(x.zxTone)}${on ? " on" : ""}${tod ? " today" : ""}" data-jc12date="${jc12Fmt(c)}"><b>${c.m}/${c.d}</b><span>${x.zx}</span><small>${ZHI[x.mz]}建 · ${x.gz}</small></button>`;
    }
    w.innerHTML = html;
  }
  function jc12Render(sound = false) {
    JC12.civ = JC12.civ || jc12Now();
    const D = jc12Data(JC12.civ),
      svg = $("#jc12Svg");
    if (!svg) return;
    svg.innerHTML = jc12Svg(D);
    jc12Info(D);
    jc12Flow(D);
    jc12View();
    const inp = $("#jc12Date");
    if (inp && document.activeElement !== inp) inp.value = jc12Fmt(D.c);
    const mz = $("#jc12Mz");
    if (mz) mz.value = D.mz;
    $("#jc12Auto")?.classList.toggle("on", JC12.mode === "auto");
    $("#jc12Manual")?.classList.toggle("on", JC12.mode === "manual");
    if (sound) {
      try {
        if (typeof mechTick === "function") mechTick(0.6);
      } catch (_) {}
    }
  }
  function jc12SetDate(c, sound = true) {
    if (!c) return;
    const min = jdFromGreg(1901, 1, 1, 12),
      max = jdFromGreg(2099, 12, 31, 12),
      j = jdFromGreg(c.y, c.m, c.d, 12);
    if (j < min || j > max) {
      toast("日期范围为 1901–2099");
      return;
    }
    JC12.civ = c;
    jc12Render(sound);
  }
  function jc12Shift(n) {
    jc12SetDate(jc12Add(JC12.civ || jc12Now(), n), true);
  }
  function jc12Stop() {
    if (JC12.play) {
      clearInterval(JC12.play);
      JC12.play = null;
    }
    const b = $("#jc12Play");
    if (b) b.textContent = "▶ 24日流转演示";
  }
  function jc12Play() {
    if (JC12.play) {
      jc12Stop();
      return;
    }
    const b = $("#jc12Play");
    if (b) b.textContent = "■ 停止演示";
    JC12.play = setInterval(() => {
      const n = jc12Add(JC12.civ || jc12Now(), 1);
      if (n.y > 2099) {
        jc12Stop();
        return;
      }
      jc12SetDate(n, false);
      try {
        if (typeof mechTick === "function") mechTick(0.35);
      } catch (_) {}
    }, 900);
  }
  function jc12Open() {
    const pane = $("#pane-studio");
    if (!pane) return;
    if (STU.active) studioLeave();
    [
      "msgStop",
      "htdStop",
      "xapStop",
      "typStop",
      "qtpStop",
      "lrpStop",
      "zlfStop",
      "lgbStop",
      "tspStop",
    ].forEach((n) => {
      try {
        if (typeof window[n] === "function") window[n]();
      } catch (_) {}
    });
    jc12Stop();
    PANLIB.mode = "jianchu-cycle";
    document.body.classList.add("studio-mode");
    delete pane.dataset.ui;
    pane.dataset.built = "1";
    JC12.civ = JC12.civ || jc12Now();
    const cur = jc12Data(JC12.civ);
    JC12.manualMz = cur.mz;
    pane.innerHTML = `<div class="jc12-shell" id="jc12Shell"><div class="jc12-top"><button class="gbtn sm" id="jc12Back">← 盘库</button><div class="jc12-title"><b>建除十二神 · 月建流转盘</b><small>月建为锚 · 日支逐日流转 · 建除十二值 · 黄黑道十二天神 · 值日宿 · 宜忌联动</small></div><button class="gbtn sm" id="jc12Cal">打开万年历</button><button class="gbtn sm" id="jc12Fs">全屏</button></div><div class="jc12-grid"><aside class="panel jc12-side"><h4>日期与月建</h4><div class="jc12-group"><label>观察日期<input type="date" id="jc12Date" min="1901-01-01" max="2099-12-31" value="${jc12Fmt(JC12.civ)}"></label><div class="jc12-row"><button class="gbtn sm" id="jc12Now">今日 · 归位</button><button class="gbtn sm" id="jc12Prev">← 前一日</button><button class="gbtn sm" id="jc12Next">后一日 →</button></div><button class="gbtn sm" id="jc12Play" style="width:100%;margin-top:6px">▶ 24日流转演示</button></div><div class="jc12-group"><h4>月建模式</h4><div class="jc12-mode"><button class="gbtn sm on" id="jc12Auto">节令自动</button><button class="gbtn sm" id="jc12Manual">手动演示</button></div><label>手动月建<select id="jc12Mz">${ZHI.map((z, i) => `<option value="${i}"${i === cur.mz ? " selected" : ""}>${z}月建</option>`).join("")}</select></label><p class="note">自动模式按本站黄历同一算法，以当日节令太阳黄经确定月支。手动模式只旋转结构，便于理解“建随月建”的规则。</p></div><div class="jc12-group"><h4>显示层</h4><label class="jc12-layer"><input type="checkbox" data-jc12l="tianshen"${JC12.layers.tianshen ? " checked" : ""}><span>黄黑道十二天神<small>青龙、明堂、天刑等与建除不是同一套十二神</small></span></label><label class="jc12-layer"><input type="checkbox" data-jc12l="tone"${JC12.layers.tone ? " checked" : ""}><span>传统吉平凶速记<small>仅作黄历结构提示，不代替事项宜忌</small></span></label><label class="jc12-layer"><input type="checkbox" data-jc12l="monthbreak"${JC12.layers.monthbreak ? " checked" : ""}><span>月破强调<small>月建对冲位置固定为“破”</small></span></label></div></aside><section class="jc12-main"><div class="jc12-viewbar"><button class="gbtn sm" id="jc12Select">选择查看</button><button class="gbtn sm" id="jc12Pan">查看平移</button><span class="hint">点击任一地支/十二神查看 · 滚轮缩放 · 平移模式拖动画面</span><button class="gbtn sm" id="jc12Fit">↙↗ 适应</button><button class="gbtn sm" id="jc12Zm">−</button><span id="jc12Zoom">100%</span><button class="gbtn sm" id="jc12Zp">＋</button></div><div class="jc12-frame" id="jc12Frame"><svg id="jc12Svg" viewBox="-440 -440 880 880" role="img" aria-label="建除十二神月建流转盘"></svg></div><div class="jc12-legend"><span><i class="m"></i>月建锚点</span><span><i class="d"></i>当日日支</span><span><i class="h"></i>黄道天神</span><span>“建”始终与月建同位，“破”始终在月建对冲位</span></div><div class="panel jc12-flow"><div class="jc12-flow-head"><b>前后 24 日 · 流转带</b><small>同时跨越节令边界时，可看到月建切换后整组十二神重新定位</small></div><div class="jc12-days" id="jc12Days"></div></div><details class="panel jc12-guide" open><summary>怎么读这张盘</summary><div class="jc12-guide-grid"><button data-jc12teach="month"><b>① 先找月建</b><span>金色指针指出月建。建神一定落在月建地支上，是整张盘的锚。</span></button><button data-jc12teach="day"><b>② 再找日支</b><span>红色指针是当日日支。日支相对月建前进几位，就得到第几个建除值。</span></button><button data-jc12teach="break"><b>③ 认识月破</b><span>日支与月建正冲，相差六位，因此固定落到“破”。</span></button><button data-jc12teach="compare"><b>④ 区分两套十二神</b><span>建除十二值与青龙、明堂等黄黑道十二天神是两套不同轮值，不能混称。</span></button></div></details></section><aside class="panel jc12-info" id="jc12Info"></aside></div><div class="panel jc12-bottom"><b>口径说明：</b>本盘直接复用本站万年历/择日模块的建除算法：以当日节令月支为月建，以日支与月建的相对差映射建、除、满、平、定、执、破、危、成、收、开、闭。黄黑道十二天神、二十八宿、宜忌属于其它历注层，与建除并列参考。页面中的“吉/平/凶”是传统速记分类，不能单独用来决定婚嫁、医疗、投资、签约等现实事项。</div></div>`;
    jc12Bind();
    jc12Render(false);
  }
  function jc12Bind() {
    const pane = $("#pane-studio"),
      svg = $("#jc12Svg"),
      frame = $("#jc12Frame");
    if (!pane || !svg) return;
    $("#jc12Back").onclick = () => {
      jc12Stop();
      plHub();
    };
    $("#jc12Now").onclick = () => {
      JC12.civ = jc12Now();
      JC12.mode = "auto";
      jc12Fit();
      jc12Render(true);
    };
    $("#jc12Prev").onclick = () => jc12Shift(-1);
    $("#jc12Next").onclick = () => jc12Shift(1);
    $("#jc12Date").onchange = (e) => {
      const c = jc12Parse(e.target.value);
      if (c) jc12SetDate(c, true);
    };
    $("#jc12Play").onclick = jc12Play;
    $("#jc12Auto").onclick = () => {
      JC12.mode = "auto";
      jc12Render(true);
    };
    $("#jc12Manual").onclick = () => {
      JC12.mode = "manual";
      JC12.manualMz = +($("#jc12Mz")?.value ?? jc12Data(JC12.civ || jc12Now()).mz);
      jc12Render(true);
    };
    $("#jc12Mz").onchange = (e) => {
      JC12.manualMz = +e.target.value;
      JC12.mode = "manual";
      jc12Render(true);
    };
    $$("[data-jc12l]", pane).forEach(
      (c) =>
        (c.onchange = () => {
          JC12.layers[c.dataset.jc12l] = c.checked ? 1 : 0;
          jc12Render(false);
        }),
    );
    const mode = (m) => {
      JC12.gesture = m;
      frame.classList.toggle("pan", m === "pan");
      $("#jc12Select").classList.toggle("on", m === "select");
      $("#jc12Pan").classList.toggle("on", m === "pan");
    };
    $("#jc12Select").onclick = () => mode("select");
    $("#jc12Pan").onclick = () => mode("pan");
    mode(JC12.gesture);
    $("#jc12Fit").onclick = jc12Fit;
    $("#jc12Zm").onclick = () => {
      const r = svg.getBoundingClientRect();
      jc12ZoomAt(1.18, r.left + r.width / 2, r.top + r.height / 2);
    };
    $("#jc12Zp").onclick = () => {
      const r = svg.getBoundingClientRect();
      jc12ZoomAt(0.84, r.left + r.width / 2, r.top + r.height / 2);
    };
    svg.addEventListener(
      "wheel",
      (e) => {
        e.preventDefault();
        jc12ZoomAt(e.deltaY < 0 ? 0.86 : 1.16, e.clientX, e.clientY);
      },
      { passive: false },
    );
    let drag = null;
    svg.addEventListener("pointerdown", (e) => {
      if (e.button > 0 || JC12.gesture !== "pan") return;
      drag = {
        id: e.pointerId,
        x: e.clientX,
        y: e.clientY,
        vx: JC12.view.x,
        vy: JC12.view.y,
        w: JC12.view.w,
        h: JC12.view.h,
        rw: Math.max(1, svg.getBoundingClientRect().width),
        rh: Math.max(1, svg.getBoundingClientRect().height),
      };
      try {
        svg.setPointerCapture(e.pointerId);
      } catch (_) {}
      frame.classList.add("grab");
    });
    svg.addEventListener("pointermove", (e) => {
      if (!drag || e.pointerId !== drag.id) return;
      const kx = drag.w / drag.rw,
        ky = drag.h / drag.rh;
      JC12.view.x = drag.vx - (e.clientX - drag.x) * kx;
      JC12.view.y = drag.vy - (e.clientY - drag.y) * ky;
      jc12View();
    });
    const up = (e) => {
      if (!drag || e.pointerId !== drag.id) return;
      drag = null;
      frame.classList.remove("grab");
    };
    svg.addEventListener("pointerup", up);
    svg.addEventListener("pointercancel", () => {
      drag = null;
      frame.classList.remove("grab");
    });
    svg.addEventListener("click", (e) => {
      if (JC12.gesture !== "select") return;
      const g = e.target.closest && e.target.closest("[data-jc12b]");
      if (!g) return;
      const b = +g.dataset.jc12b,
        D = jc12Data(JC12.civ || jc12Now()),
        delta = (b - D.dz + 12) % 12;
      const c = jc12Add(D.c, delta <= 6 ? delta : delta - 12);
      jc12SetDate(c, true);
    });
    pane.addEventListener("click", (e) => {
      const d = e.target.closest("[data-jc12date]");
      if (d) {
        const c = jc12Parse(d.dataset.jc12date);
        if (c) jc12SetDate(c, true);
        return;
      }
      const t = e.target.closest("[data-jc12teach]");
      if (t) {
        const D = jc12Data(JC12.civ || jc12Now());
        if (t.dataset.jc12teach === "month") {
          JC12.mode = "manual";
          JC12.manualMz = D.mz;
        } else if (t.dataset.jc12teach === "break") {
          const target = (D.mz + 6) % 12,
            delta = (target - D.dz + 12) % 12;
          jc12SetDate(jc12Add(D.c, delta <= 6 ? delta : delta - 12), true);
          return;
        }
        jc12Render(false);
        return;
      }
      const l = e.target.closest("[data-jc12link]");
      if (!l) return;
      const k = l.dataset.jc12link,
        D = jc12Data(JC12.civ || jc12Now());
      if (k === "calendar") {
        try {
          calOpen({ y: D.c.y, m: D.c.m, d: D.c.d });
        } catch (_) {
          selectTab("zeri", true);
        }
        return;
      }
      jc12Stop();
      if (k === "taisui") {
        try {
          tspOpen();
        } catch (_) {
          plHub();
        }
      } else if (k === "zeri") {
        try {
          if (typeof ZRS !== "undefined") {
            ZRS.start = jc12Fmt(D.c);
            ZRS.sel = 0;
          }
        } catch (_) {}
        selectTab("zeri", true);
      } else selectTab(k, true);
    });
    $("#jc12Cal").onclick = () => {
      const D = jc12Data(JC12.civ || jc12Now());
      try {
        calOpen({ y: D.c.y, m: D.c.m, d: D.c.d });
      } catch (_) {
        selectTab("zeri", true);
      }
    };
    $("#jc12Fs").onclick = async () => {
      try {
        if (document.fullscreenElement) await document.exitFullscreen();
        else await $("#jc12Shell").requestFullscreen();
      } catch (_) {
        toast("当前浏览器不允许全屏");
      }
    };
    if (!window.__JC12_FS) {
      window.__JC12_FS = 1;
      document.addEventListener("fullscreenchange", () => {
        const b = $("#jc12Fs");
        if (b) b.textContent = document.fullscreenElement ? "退出全屏" : "全屏";
      });
    }
  }
  /* 盘库入口：正式加入第 12 盘。 */
  const plHub_v55_jc12 = plHub;
  plHub = function () {
    jc12Stop();
    plHub_v55_jc12();
    const pane = $("#pane-studio");
    if (!pane) return;
    const cnt = pane.querySelector(".pl-count b");
    if (cnt) cnt.textContent = "12";
    const f = pane.querySelector(".pl-card.future");
    if (f)
      f.outerHTML = `<article class="panel pl-card" data-pl="jianchu-cycle"><span class="num">12 · 神煞流转</span><span class="enter">↗</span><h3>建除十二神 · 月建流转盘</h3><p>以节令月建为固定锚点，让建、除、满、平、定、执、破、危、成、收、开、闭随每日地支依次流转，并与黄黑道、宿值和宜忌联动。</p><div class="tags"><span>建除十二值</span><span>月建日支</span><span>择日联动</span></div></article><article class="panel pl-card future"><span class="num">NEXT · 神煞流转</span><span class="enter">待建</span><h3>黄黑道十二神 · 日时流转盘</h3><p>下一盘把青龙、明堂、天刑、朱雀、金匮、天德、白虎、玉堂、天牢、玄武、司命、勾陈单独展开，并区分值日与值时。</p><div class="tags"><span>黄道黑道</span><span>十二天神</span><span>日时双层</span></div></article>`;
    const c = pane.querySelector('[data-pl="jianchu-cycle"]');
    if (c) c.onclick = () => jc12Open();
  };
  const plClose_v56_jc12 = plClose;
  plClose = function () {
    jc12Stop();
    return plClose_v56_jc12();
  };
  try {
    const g = NAV_G.find((x) => x.g === "盘库");
    if (g && g.it && g.it[0]) {
      g.it[0][2] =
        "天机巨盘、罗经三盘、三式、全天星图、浑天仪、易学数理、择时养生、流年太岁、建除十二神及后续独立盘";
      g.it[0][3] +=
        " 建除十二神 月建流转 建日 除日 满日 平日 定日 执日 破日 危日 成日 收日 开日 闭日 月破 黄黑道十二神";
    }
  } catch (_) {}
  try {
    const bv = document.getElementById("buildVersion");

    const ft = document.querySelector("footer");
    if (ft) {
      const t = ft.textContent || "";
      if (/版本\s*·/.test(t));
      else ft.insertAdjacentHTML("beforeend", "<br>版本 · 2026-10-03 22:15:11");
    }
  } catch (_) {}
  window.jc12Open = jc12Open;
  window.jc12Stop = jc12Stop;
})();
