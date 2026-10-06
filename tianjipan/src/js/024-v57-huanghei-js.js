/* ===== v57 · 黄黑道十二神 · 日时流转盘 ===== */
(function () {
  const HHD = {
    civ: null,
    boundary: "midnight",
    play: null,
    playStep: "hour",
    gesture: "select",
    view: { x: -440, y: -440, w: 880, h: 880 },
    layers: { day: 1, hour: 1, anchors: 1 },
  };
  const HHD_META = {
    青龙: {
      tone: "黄道",
      txt: "十二天神之一，传统黄历常列为黄道吉神。名称用于历注轮值，并非现实事件的因果判断。",
    },
    明堂: {
      tone: "黄道",
      txt: "十二天神之一，传统列黄道。与建除“明堂”之外的其它神煞条目应按各自体系区分。",
    },
    天刑: {
      tone: "黑道",
      txt: "十二天神之一，传统列黑道。这里只展示其历法轮值位置，不把名称直接解释成现实刑灾。",
    },
    朱雀: {
      tone: "黑道",
      txt: "十二天神之一，传统列黑道。不同术数体系中“朱雀”还可作为六神等名称，本盘只指黄黑道十二天神。",
    },
    金匮: {
      tone: "黄道",
      txt: "十二天神之一，传统列黄道。与具体事项是否相宜仍需结合当日、当时宜忌。",
    },
    天德: {
      tone: "黄道",
      txt: "十二天神之一，传统列黄道。本盘中的天德为十二天神序列位置，不等同其它神煞体系中的天德贵人。",
    },
    白虎: {
      tone: "黑道",
      txt: "十二天神之一，传统列黑道。名称具有传统象义，但本盘不据此预测伤病或事故。",
    },
    玉堂: { tone: "黄道", txt: "十二天神之一，传统列黄道，用于显示日、时两套轮值序列。" },
    天牢: { tone: "黑道", txt: "十二天神之一，传统列黑道。这里是历注分类，不直接等同现实风险。" },
    玄武: { tone: "黑道", txt: "十二天神之一，传统列黑道。也不要与其它术数系统中的玄武神将混同。" },
    司命: { tone: "黄道", txt: "十二天神之一，传统列黄道。其在本盘中的意义是轮值位置与历注分类。" },
    勾陈: {
      tone: "黑道",
      txt: "十二天神之一，传统列黑道。大六壬、六神等体系也会出现同名概念，本盘只按黄历十二天神处理。",
    },
  };
  function hhdNow() {
    try {
      const n = nowBJ();
      return { y: n.y, m: n.m, d: n.d, h: n.h, mi: n.mi || 0 };
    } catch (_) {
      const n = new Date();
      return {
        y: n.getFullYear(),
        m: n.getMonth() + 1,
        d: n.getDate(),
        h: n.getHours(),
        mi: n.getMinutes(),
      };
    }
  }
  function hhdPad(n) {
    return String(n).padStart(2, "0");
  }
  function hhdFmt(c) {
    return `${c.y}-${hhdPad(c.m)}-${hhdPad(c.d)}T${hhdPad(c.h)}:${hhdPad(c.mi || 0)}`;
  }
  function hhdParse(v) {
    const m = String(v || "").match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
    if (!m) return null;
    const c = { y: +m[1], m: +m[2], d: +m[3], h: +m[4], mi: +m[5] };
    if (
      c.y < 1901 ||
      c.y > 2099 ||
      c.m < 1 ||
      c.m > 12 ||
      c.d < 1 ||
      c.d > 31 ||
      c.h < 0 ||
      c.h > 23 ||
      c.mi < 0 ||
      c.mi > 59
    )
      return null;
    return c;
  }
  function hhdDateAdd(c, days = 0, hours = 0) {
    const dt = new Date(c.y, c.m - 1, c.d, c.h, c.mi || 0, 0);
    dt.setDate(dt.getDate() + days);
    dt.setHours(dt.getHours() + hours);
    return {
      y: dt.getFullYear(),
      m: dt.getMonth() + 1,
      d: dt.getDate(),
      h: dt.getHours(),
      mi: dt.getMinutes(),
    };
  }
  function hhdEffective(c) {
    if (HHD.boundary === "zi" && c.h >= 23) {
      const n = hhdDateAdd(c, 1, 0);
      return { y: n.y, m: n.m, d: n.d };
    }
    return { y: c.y, m: c.m, d: c.d };
  }
  function hhdHb(c) {
    return Math.floor((c.h + 1) / 2) % 12;
  }
  function hhdTimeMid(b) {
    return b === 0 ? 0 : b * 2;
  }
  function hhdDayGodAt(branch, mz) {
    return TIANSHEN[(((branch - tianshenStart(mz)) % 12) + 12) % 12];
  }
  function hhdHourGodAt(branch, dz) {
    return TIANSHEN[(((branch - HR_TS_START[dz]) % 12) + 12) % 12];
  }
  function hhdData(c) {
    const eff = hhdEffective(c),
      di = dayInfo(eff.y, eff.m, eff.d),
      hb = hhdHb(c),
      hrs = hoursOfDay(eff.y, eff.m, eff.d),
      hi = hrs[hb],
      dayGod = di.ts,
      hourGod = hi.ts;
    return {
      c,
      eff,
      di,
      dz: di.dayIdx % 12,
      mz: di.mz,
      hb,
      hrs,
      hi,
      dayGod,
      hourGod,
      dayHuang: TS_HUANG.includes(dayGod),
      hourHuang: hi.huang,
      dayStart: tianshenStart(di.mz),
      hourStart: HR_TS_START[di.dayIdx % 12],
    };
  }
  function hhdPolar(r, a) {
    const q = ((a - 90) * Math.PI) / 180;
    return [Math.cos(q) * r, Math.sin(q) * r];
  }
  function hhdArc(r0, r1, a0, a1) {
    const p1 = hhdPolar(r1, a0),
      p2 = hhdPolar(r1, a1),
      p3 = hhdPolar(r0, a1),
      p4 = hhdPolar(r0, a0);
    return `M${p1[0]},${p1[1]} A${r1},${r1} 0 0 1 ${p2[0]},${p2[1]} L${p3[0]},${p3[1]} A${r0},${r0} 0 0 0 ${p4[0]},${p4[1]} Z`;
  }
  function hhdTone(g) {
    return TS_HUANG.includes(g) ? "huang" : "hei";
  }
  function hhdView() {
    const s = $("#hhdSvg");
    if (s) s.setAttribute("viewBox", `${HHD.view.x} ${HHD.view.y} ${HHD.view.w} ${HHD.view.h}`);
    const z = $("#hhdZoom");
    if (z) z.textContent = `${Math.round((880 / HHD.view.w) * 100)}%`;
  }
  function hhdFit() {
    HHD.view = { x: -440, y: -440, w: 880, h: 880 };
    hhdView();
  }
  function hhdZoomAt(f, cx, cy) {
    const s = $("#hhdSvg");
    if (!s) return;
    const r = s.getBoundingClientRect(),
      old = HHD.view.w,
      nw = Math.max(360, Math.min(1320, old * f)),
      nh = nw,
      px = (cx - r.left) / r.width,
      py = (cy - r.top) / r.height;
    HHD.view.x += (old - nw) * px;
    HHD.view.y += (HHD.view.h - nh) * py;
    HHD.view.w = nw;
    HHD.view.h = nh;
    hhdView();
  }
  function hhdRenderSvg(D) {
    const svg = $("#hhdSvg");
    if (!svg) return;
    let o = "";
    o += `<circle r="405" class="hhd-ring"/><circle r="360" class="hhd-ring thin"/><circle r="292" class="hhd-ring"/><circle r="214" class="hhd-ring"/><circle r="142" class="hhd-ring"/>`;
    for (let b = 0; b < 12; b++) {
      const a = b * 30,
        a0 = a - 15,
        a1 = a + 15,
        pz = hhdPolar(387, a),
        pd = hhdPolar(327, a),
        ph = hhdPolar(252, a),
        psd = hhdPolar(302, a),
        psh = hhdPolar(226, a),
        dg = hhdDayGodAt(b, D.mz),
        hg = hhdHourGodAt(b, D.dz),
        dc = b === D.dz,
        hc = b === D.hb;
      o += `<text x="${pz[0]}" y="${pz[1]}" class="hhd-text hhd-zhi">${ZHI[b]}</text>`;
      if (HHD.layers.day)
        o += `<g data-hhd-day="${b}"><path d="${hhdArc(294, 358, a0, a1)}" class="hhd-sector day ${hhdTone(dg)}${dc ? " current-day" : ""}"/><text x="${pd[0]}" y="${pd[1]}" class="hhd-text hhd-god ${hhdTone(dg)}">${dg}</text><text x="${psd[0]}" y="${psd[1] + 13}" class="hhd-text hhd-sub">${TS_HUANG.includes(dg) ? "黄道" : "黑道"} · 值日</text></g>`;
      if (HHD.layers.hour)
        o += `<g data-hhd-hour="${b}"><path d="${hhdArc(216, 290, a0, a1)}" class="hhd-sector hour ${hhdTone(hg)}${hc ? " current-hour" : ""}"/><text x="${ph[0]}" y="${ph[1]}" class="hhd-text hhd-god ${hhdTone(hg)}">${hg}</text><text x="${psh[0]}" y="${psh[1] + 12}" class="hhd-text hhd-sub">${TS_HUANG.includes(hg) ? "黄道" : "黑道"} · 值时</text></g>`;
    }
    if (HHD.layers.anchors) {
      const ad = hhdPolar(367, D.dayStart * 30),
        ah = hhdPolar(299, D.hourStart * 30);
      o += `<circle cx="${ad[0]}" cy="${ad[1]}" r="7" class="hhd-anchor-day"/><text x="${ad[0]}" y="${ad[1] - 16}" class="hhd-text hhd-day-label">日青龙起</text><circle cx="${ah[0]}" cy="${ah[1]}" r="7" class="hhd-anchor-hour"/><text x="${ah[0]}" y="${ah[1] - 16}" class="hhd-text hhd-hour-label">时青龙起</text>`;
    }
    const dp = hhdPolar(358, D.dz * 30),
      hp = hhdPolar(290, D.hb * 30);
    o += `<line x1="0" y1="0" x2="${dp[0]}" y2="${dp[1]}" class="hhd-pointer-day"/><line x1="0" y1="0" x2="${hp[0]}" y2="${hp[1]}" class="hhd-pointer-hour"/>`;
    o += `<circle r="132" class="hhd-center"/><text x="0" y="-82" class="hhd-text hhd-center-kicker">DAY / HOUR TWELVE DEITIES</text><text x="0" y="-47" class="hhd-text hhd-center-sm">${D.eff.y}年${D.eff.m}月${D.eff.d}日 · ${D.di.gz}日</text><text x="0" y="-12" class="hhd-text hhd-center-title">${D.dayGod} · ${D.dayHuang ? "黄道" : "黑道"}</text><text x="0" y="24" class="hhd-text hhd-center-hour">${D.hourGod} · ${D.hourHuang ? "黄道" : "黑道"}</text><text x="0" y="56" class="hhd-text hhd-center-sm">${D.hi.gz}时 · ${D.hi.span} · ${ZHI[D.hb]}时</text><text x="0" y="79" class="hhd-text hhd-center-sm">日层由${ZHI[D.mz]}月建定位 · 时层由${ZHI[D.dz]}日支定位</text>`;
    svg.innerHTML = o;
    hhdView();
  }
  function hhdHours(D) {
    const box = $("#hhdHours");
    if (!box) return;
    box.innerHTML = D.hrs
      .map(
        (x, i) =>
          `<button class="hhd-hour-card${i === D.hb ? " on" : ""}" data-hhd-hourcard="${i}"><b>${ZHI[i]}时</b><span class="${x.huang ? "good" : "bad"}">${x.ts}</span><small>${x.span} · ${x.gz}</small></button>`,
      )
      .join("");
  }
  function hhdDays(D) {
    const box = $("#hhdDays");
    if (!box) return;
    const base = { y: D.eff.y, m: D.eff.m, d: D.eff.d, h: 12, mi: 0 },
      arr = [];
    for (let k = -5; k <= 6; k++) {
      const c = hhdDateAdd(base, k, 0),
        di = dayInfo(c.y, c.m, c.d);
      arr.push({ c, di });
    }
    box.innerHTML = arr
      .map(
        (x) =>
          `<button class="hhd-day-card${x.c.y === D.eff.y && x.c.m === D.eff.m && x.c.d === D.eff.d ? " on" : ""}" data-hhd-daycard="${x.c.y}-${hhdPad(x.c.m)}-${hhdPad(x.c.d)}"><b>${hhdPad(x.c.m)}/${hhdPad(x.c.d)} · ${x.di.gz}</b><span class="${x.di.huang ? "good" : "bad"}">${x.di.ts}</span><small>${x.di.huang ? "黄道" : "黑道"} · ${x.di.zx}日</small></button>`,
      )
      .join("");
  }
  function hhdInfo(D) {
    const box = $("#hhdInfo");
    if (!box) return;
    const dm = HHD_META[D.dayGod] || {},
      hm = HHD_META[D.hourGod] || {},
      mins = D.c.h * 60 + (D.c.mi || 0),
      branchStart = D.hb === 0 ? (D.c.h === 23 ? 23 * 60 : 0) : (D.hb * 2 - 1) * 60,
      branchEnd = D.hb === 0 ? (D.c.h === 23 ? 25 * 60 : 60) : (D.hb * 2 + 1) * 60,
      mm = D.hb === 0 && D.c.h === 0 ? mins : mins + (D.c.h === 23 ? 0 : 0),
      left = Math.max(0, Math.round(branchEnd - mm));
    const yiD = (D.di.yi || []).slice(0, 10),
      jiD = (D.di.ji || []).slice(0, 10),
      yiH = (D.hi.yi || []).slice(0, 10),
      jiH = (D.hi.ji || []).slice(0, 10),
      combo =
        D.dayHuang && D.hourHuang
          ? "日时皆黄道"
          : D.dayHuang || D.hourHuang
            ? "一黄一黑"
            : "日时皆黑道";
    box.innerHTML = `<h4>日时双层读数</h4><div class="hhd-kpis"><div class="hhd-kpi"><small>值日天神</small><b class="${D.dayHuang ? "good" : "bad"}">${D.dayGod} · ${D.dayHuang ? "黄道" : "黑道"}</b></div><div class="hhd-kpi"><small>值时天神</small><b class="${D.hourHuang ? "good" : "bad"}">${D.hourGod} · ${D.hourHuang ? "黄道" : "黑道"}</b></div><div class="hhd-kpi"><small>月建 / 日支</small><b>${ZHI[D.mz]} → ${ZHI[D.dz]}</b></div><div class="hhd-kpi"><small>当前时辰</small><b class="cyan">${ZHI[D.hb]}时 · ${D.hi.span}</b></div></div><div class="hhd-facts"><span>观察时间</span><b>${hhdFmt(D.c).replace("T", " ")}</b><span>日柱 / 时柱</span><b>${D.di.gz}日 · ${D.hi.gz}时</b><span>日青龙起位</span><b>${ZHI[D.dayStart]} · 由${ZHI[D.mz]}月建定位</b><span>时青龙起位</span><b>${ZHI[D.hourStart]} · 由${ZHI[D.dz]}日支定位</b><span>日时组合</span><b>${combo}</b><span>本时辰剩余</span><b>约 ${left} 分钟</b><span>换日口径</span><b>${HHD.boundary === "zi" ? "23:00 子初换日（演示）" : "00:00 民用日期（本站默认）"}</b></div><div class="hhd-card"><b>值日 · ${D.dayGod}</b><br>${dm.txt || ""}<div class="hhd-pills"><span>${D.dayHuang ? "黄道" : "黑道"}</span><span>${D.di.zx}日</span><span>${D.di.xiu}</span></div></div><div class="hhd-card"><b>值时 · ${D.hourGod}</b><br>${hm.txt || ""}<div class="hhd-pills"><span>${D.hourHuang ? "黄道" : "黑道"}</span><span>${D.hi.gz}时</span><span>冲${D.hi.chong}</span></div></div><div class="hhd-card"><b>当日宜 / 忌</b><div class="hhd-pills">${yiD.length ? yiD.map((x) => `<span>${esc(x)}</span>`).join("") : "<span>—</span>"}</div><div class="hhd-pills ji">${jiD.length ? jiD.map((x) => `<span>${esc(x)}</span>`).join("") : "<span>—</span>"}</div></div><div class="hhd-card"><b>当前时辰宜 / 忌</b><div class="hhd-pills">${yiH.length ? yiH.map((x) => `<span>${esc(x)}</span>`).join("") : "<span>—</span>"}</div><div class="hhd-pills ji">${jiH.length ? jiH.map((x) => `<span>${esc(x)}</span>`).join("") : "<span>—</span>"}</div><p class="dim" style="margin:6px 0 0">时辰宜忌直接复用本站既有逐时黄历数据；“黄道/黑道”只是其中一层，不应单独代替完整择时。</p></div><div class="hhd-card"><b>相关模块</b><div class="hhd-links"><button class="gbtn sm" data-hhdlink="jianchu">建除十二神</button><button class="gbtn sm" data-hhdlink="calendar">万年历此刻</button><button class="gbtn sm" data-hhdlink="zeri">择日</button><button class="gbtn sm" data-hhdlink="bridge">地支枢纽</button></div></div>`;
  }
  function hhdRender(sync = true) {
    const c = HHD.civ || hhdNow();
    HHD.civ = c;
    const D = hhdData(c);
    hhdRenderSvg(D);
    hhdHours(D);
    hhdDays(D);
    hhdInfo(D);
    if (sync) {
      const el = $("#hhdDt");
      if (el) el.value = hhdFmt(c);
      const bd = $("#hhdBoundary");
      if (bd) bd.value = HHD.boundary;
    }
    $$("[data-hhdl]", $("#pane-studio")).forEach((x) => (x.checked = !!HHD.layers[x.dataset.hhdl]));
  }
  function hhdSet(c) {
    if (!c) return;
    HHD.civ = c;
    hhdRender(true);
  }
  function hhdStop() {
    if (HHD.play) {
      clearInterval(HHD.play);
      HHD.play = null;
    }
    const b = $("#hhdPlay");
    if (b) b.textContent = "▶ 连续演示";
  }
  function hhdPlay() {
    if (HHD.play) {
      hhdStop();
      return;
    }
    const b = $("#hhdPlay");
    if (b) b.textContent = "■ 停止演示";
    HHD.play = setInterval(() => {
      const n =
        HHD.playStep === "day"
          ? hhdDateAdd(HHD.civ || hhdNow(), 1, 0)
          : hhdDateAdd(HHD.civ || hhdNow(), 0, 2);
      if (n.y > 2099) {
        hhdStop();
        return;
      }
      HHD.civ = n;
      hhdRender(true);
      try {
        if (typeof mechTick === "function") mechTick(0.28);
      } catch (_) {}
    }, 900);
  }
  function hhdOpen() {
    const pane = $("#pane-studio");
    if (!pane) return;
    if (STU.active) studioLeave();
    [
      "jc12Stop",
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
    hhdStop();
    PANLIB.mode = "huanghei-cycle";
    document.body.classList.add("studio-mode");
    delete pane.dataset.ui;
    pane.dataset.built = "1";
    HHD.civ = HHD.civ || hhdNow();
    pane.innerHTML = `<div class="hhd-shell" id="hhdShell"><div class="hhd-top"><button class="gbtn sm" id="hhdBack">← 盘库</button><div class="hhd-title"><b>黄黑道十二神 · 日时流转盘</b><small>值日十二天神 × 值时十二天神 · 月建定日层 · 日支定时层 · 双层黄黑道对照</small></div><button class="gbtn sm" id="hhdCal">打开万年历</button><button class="gbtn sm" id="hhdFs">全屏</button></div><div class="hhd-grid"><aside class="panel hhd-side"><h4>日期与时辰</h4><div class="hhd-group"><label>观察时间<input type="datetime-local" id="hhdDt" min="1901-01-01T00:00" max="2099-12-31T23:59" value="${hhdFmt(HHD.civ)}"></label><div class="hhd-row"><button class="gbtn sm" id="hhdNow">此刻 · 归位</button><button class="gbtn sm" id="hhdPrevH">← 前时辰</button><button class="gbtn sm" id="hhdNextH">后时辰 →</button></div><div class="hhd-row" style="margin-top:6px"><button class="gbtn sm" id="hhdPrevD">← 前一日</button><button class="gbtn sm" id="hhdNextD">后一日 →</button></div></div><div class="hhd-group"><h4>连续演示</h4><label>演示步长<select id="hhdStep"><option value="hour"${HHD.playStep === "hour" ? " selected" : ""}>每步 1 时辰（2小时）</option><option value="day"${HHD.playStep === "day" ? " selected" : ""}>每步 1 日</option></select></label><button class="gbtn sm" id="hhdPlay" style="width:100%">▶ 连续演示</button></div><div class="hhd-group"><h4>换日口径</h4><label>日柱边界<select id="hhdBoundary"><option value="midnight"${HHD.boundary === "midnight" ? " selected" : ""}>00:00 · 与本站黄历一致</option><option value="zi"${HHD.boundary === "zi" ? " selected" : ""}>23:00 · 子初换日演示</option></select></label><p class="note">不同传统存在换日口径差异。默认保持本站现有黄历口径；“子初换日”只用于比较研究。</p></div><div class="hhd-group"><h4>显示层</h4><label class="hhd-layer"><input type="checkbox" data-hhdl="day"${HHD.layers.day ? " checked" : ""}><span>值日十二天神<small>由节令月建确定“青龙”起位，日支决定当天值神</small></span></label><label class="hhd-layer"><input type="checkbox" data-hhdl="hour"${HHD.layers.hour ? " checked" : ""}><span>值时十二天神<small>由日支确定“青龙”起位，时支决定当前值时</small></span></label><label class="hhd-layer"><input type="checkbox" data-hhdl="anchors"${HHD.layers.anchors ? " checked" : ""}><span>显示青龙起位<small>帮助理解两层为什么会相对错开</small></span></label></div></aside><section class="hhd-main"><div class="hhd-viewbar"><button class="gbtn sm" id="hhdSelect">选择查看</button><button class="gbtn sm" id="hhdPan">查看平移</button><span class="hint">外环点“值日” · 内环点“值时” · 滚轮缩放 · 平移模式拖动</span><button class="gbtn sm" id="hhdFit">↙↗ 适应</button><button class="gbtn sm" id="hhdZm">−</button><span id="hhdZoom">100%</span><button class="gbtn sm" id="hhdZp">＋</button></div><div class="hhd-frame" id="hhdFrame"><svg id="hhdSvg" viewBox="-440 -440 880 880" role="img" aria-label="黄黑道十二神日时流转盘"></svg></div><div class="hhd-legend"><span><i class="dy"></i>值日指针</span><span><i class="hr"></i>值时指针</span><span><i class="gd"></i>传统黄道六神</span><span><i class="bd"></i>传统黑道六神</span></div><div class="panel hhd-board"><div class="hhd-board-head"><b>今日十二时辰</b><small>逐时显示时柱、值时天神与黄黑道；点击即可切换观察时刻</small></div><div class="hhd-hours" id="hhdHours"></div></div><div class="panel hhd-board"><div class="hhd-board-head"><b>前后十二日 · 值日流转</b><small>观察日支每天推进，以及月建跨节时整套值日序列如何重定位</small></div><div class="hhd-days" id="hhdDays"></div></div><details class="panel hhd-guide" open><summary>四步读懂“日时双层”</summary><div class="hhd-guide-grid"><button data-hhdteach="day"><b>① 值日层</b><span>先看月建。月建决定青龙落在哪个日支，再随日支取当天值神。</span></button><button data-hhdteach="hour"><b>② 值时层</b><span>再看日支。日支决定青龙落在哪个时支，再随当前时支取值时神。</span></button><button data-hhdteach="tone"><b>③ 黄道与黑道</b><span>青龙、明堂、金匮、天德、玉堂、司命传统列黄道，其余六神列黑道。</span></button><button data-hhdteach="compare"><b>④ 不与建除混用</b><span>建除十二值和黄黑道十二天神是两套并行历注，本盘专门把后者拆开观察。</span></button></div></details></section><aside class="panel hhd-info" id="hhdInfo"></aside></div><div class="panel hhd-bottom"><b>算法口径：</b>本盘不另造公式，直接复用本站现有万年历与择时数据。值日层使用“月支定青龙起日支”的十二天神算法；值时层使用“日支定青龙起时支”的逐时算法。黄道六神为青龙、明堂、金匮、天德、玉堂、司命，其余六神按本站现有数据列黑道。日/时宜忌、建除、二十八宿等都是并行历注层，不能只凭“黄道”或“黑道”一个标签替代完整择日或现实决策。</div></div>`;
    hhdBind();
    hhdRender(false);
  }
  function hhdBind() {
    const pane = $("#pane-studio"),
      svg = $("#hhdSvg"),
      frame = $("#hhdFrame");
    if (!pane || !svg) return;
    $("#hhdBack").onclick = () => {
      hhdStop();
      plHub();
    };
    $("#hhdNow").onclick = () => {
      HHD.civ = hhdNow();
      HHD.boundary = "midnight";
      hhdFit();
      hhdRender(true);
    };
    $("#hhdPrevH").onclick = () => hhdSet(hhdDateAdd(HHD.civ || hhdNow(), 0, -2));
    $("#hhdNextH").onclick = () => hhdSet(hhdDateAdd(HHD.civ || hhdNow(), 0, 2));
    $("#hhdPrevD").onclick = () => hhdSet(hhdDateAdd(HHD.civ || hhdNow(), -1, 0));
    $("#hhdNextD").onclick = () => hhdSet(hhdDateAdd(HHD.civ || hhdNow(), 1, 0));
    $("#hhdDt").onchange = (e) => {
      const c = hhdParse(e.target.value);
      if (c) hhdSet(c);
    };
    $("#hhdBoundary").onchange = (e) => {
      HHD.boundary = e.target.value;
      hhdRender(false);
    };
    $("#hhdStep").onchange = (e) => (HHD.playStep = e.target.value);
    $("#hhdPlay").onclick = hhdPlay;
    $$("[data-hhdl]", pane).forEach(
      (c) =>
        (c.onchange = () => {
          HHD.layers[c.dataset.hhdl] = c.checked ? 1 : 0;
          hhdRender(false);
        }),
    );
    const mode = (m) => {
      HHD.gesture = m;
      frame.classList.toggle("pan", m === "pan");
      $("#hhdSelect").classList.toggle("on", m === "select");
      $("#hhdPan").classList.toggle("on", m === "pan");
    };
    $("#hhdSelect").onclick = () => mode("select");
    $("#hhdPan").onclick = () => mode("pan");
    mode(HHD.gesture);
    $("#hhdFit").onclick = hhdFit;
    $("#hhdZm").onclick = () => {
      const r = svg.getBoundingClientRect();
      hhdZoomAt(1.18, r.left + r.width / 2, r.top + r.height / 2);
    };
    $("#hhdZp").onclick = () => {
      const r = svg.getBoundingClientRect();
      hhdZoomAt(0.84, r.left + r.width / 2, r.top + r.height / 2);
    };
    svg.addEventListener(
      "wheel",
      (e) => {
        e.preventDefault();
        hhdZoomAt(e.deltaY < 0 ? 0.86 : 1.16, e.clientX, e.clientY);
      },
      { passive: false },
    );
    let drag = null;
    svg.addEventListener("pointerdown", (e) => {
      if (e.button > 0 || HHD.gesture !== "pan") return;
      drag = {
        id: e.pointerId,
        x: e.clientX,
        y: e.clientY,
        vx: HHD.view.x,
        vy: HHD.view.y,
        w: HHD.view.w,
        h: HHD.view.h,
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
      HHD.view.x = drag.vx - (e.clientX - drag.x) * kx;
      HHD.view.y = drag.vy - (e.clientY - drag.y) * ky;
      hhdView();
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
      if (HHD.gesture !== "select") return;
      const hg = e.target.closest && e.target.closest("[data-hhd-hour]");
      if (hg) {
        const b = +hg.dataset.hhdHour,
          c = HHD.civ || hhdNow();
        hhdSet({ y: c.y, m: c.m, d: c.d, h: hhdTimeMid(b), mi: 0 });
        return;
      }
      const dg = e.target.closest && e.target.closest("[data-hhd-day]");
      if (dg) {
        const D = hhdData(HHD.civ || hhdNow()),
          target = +dg.dataset.hhdDay,
          delta = (target - D.dz + 12) % 12,
          step = delta <= 6 ? delta : delta - 12;
        hhdSet(hhdDateAdd(HHD.civ || hhdNow(), step, 0));
      }
    });
    pane.addEventListener("click", (e) => {
      const hc = e.target.closest("[data-hhd-hourcard]");
      if (hc) {
        const b = +hc.dataset.hhdHourcard,
          c = HHD.civ || hhdNow();
        hhdSet({ y: c.y, m: c.m, d: c.d, h: hhdTimeMid(b), mi: 0 });
        return;
      }
      const dc = e.target.closest("[data-hhd-daycard]");
      if (dc) {
        const m = dc.dataset.hhdDaycard.match(/^(\d+)-(\d+)-(\d+)$/);
        if (m) {
          const c = HHD.civ || hhdNow();
          hhdSet({ y: +m[1], m: +m[2], d: +m[3], h: c.h, mi: c.mi });
        }
        return;
      }
      const t = e.target.closest("[data-hhdteach]");
      if (t) {
        const k = t.dataset.hhdteach;
        if (k === "day") {
          HHD.layers.day = 1;
          HHD.layers.hour = 0;
        } else if (k === "hour") {
          HHD.layers.day = 0;
          HHD.layers.hour = 1;
        } else {
          HHD.layers.day = 1;
          HHD.layers.hour = 1;
        }
        hhdRender(false);
        return;
      }
      const l = e.target.closest("[data-hhdlink]");
      if (!l) return;
      const k = l.dataset.hhdlink,
        D = hhdData(HHD.civ || hhdNow());
      if (k === "calendar") {
        try {
          calOpen({ y: D.eff.y, m: D.eff.m, d: D.eff.d });
        } catch (_) {
          selectTab("zeri", true);
        }
        return;
      }
      hhdStop();
      if (k === "jianchu") {
        try {
          if (typeof jc12Open === "function") {
            jc12Open();
            if (typeof JC12 !== "undefined") JC12.civ = { y: D.eff.y, m: D.eff.m, d: D.eff.d };
          }
        } catch (_) {
          plHub();
        }
      } else if (k === "zeri") {
        try {
          if (typeof ZRS !== "undefined") {
            ZRS.start = `${D.eff.y}-${hhdPad(D.eff.m)}-${hhdPad(D.eff.d)}`;
            ZRS.sel = 0;
          }
        } catch (_) {}
        selectTab("zeri", true);
      } else selectTab(k, true);
    });
    $("#hhdCal").onclick = () => {
      const D = hhdData(HHD.civ || hhdNow());
      try {
        calOpen({ y: D.eff.y, m: D.eff.m, d: D.eff.d });
      } catch (_) {
        selectTab("zeri", true);
      }
    };
    $("#hhdFs").onclick = async () => {
      try {
        if (document.fullscreenElement) await document.exitFullscreen();
        else await $("#hhdShell").requestFullscreen();
      } catch (_) {
        toast("当前浏览器不允许全屏");
      }
    };
    if (!window.__HHD_FS) {
      window.__HHD_FS = 1;
      document.addEventListener("fullscreenchange", () => {
        const b = $("#hhdFs");
        if (b) b.textContent = document.fullscreenElement ? "退出全屏" : "全屏";
      });
    }
  }
  /* 盘库入口：正式加入第 13 盘。 */
  const plHub_v56_hhd = plHub;
  plHub = function () {
    hhdStop();
    plHub_v56_hhd();
    const pane = $("#pane-studio");
    if (!pane) return;
    const cnt = pane.querySelector(".pl-count b");
    if (cnt) cnt.textContent = "13";
    const f = pane.querySelector(".pl-card.future");
    if (f)
      f.outerHTML = `<article class="panel pl-card" data-pl="huanghei-cycle"><span class="num">13 · 神煞流转</span><span class="enter">↗</span><h3>黄黑道十二神 · 日时流转盘</h3><p>把青龙、明堂、天刑、朱雀、金匮、天德、白虎、玉堂、天牢、玄武、司命、勾陈拆成值日与值时双层，直观看两套起位与轮值。</p><div class="tags"><span>黄道黑道</span><span>值日值时</span><span>双层轮值</span></div></article><article class="panel pl-card future"><span class="num">NEXT · 神煞流转</span><span class="enter">待建</span><h3>六十甲子太岁 · 值年神盘</h3><p>下一盘把六十甲子、值年太岁、干支五行、纳音与年度循环组织成完整的六十年值年圆盘，并与流年太岁盘联动。</p><div class="tags"><span>六十甲子</span><span>值年太岁</span><span>纳音流年</span></div></article>`;
    const c = pane.querySelector('[data-pl="huanghei-cycle"]');
    if (c) c.onclick = () => hhdOpen();
  };
  const plClose_v57_hhd = plClose;
  plClose = function () {
    hhdStop();
    return plClose_v57_hhd();
  };
  try {
    const g = NAV_G.find((x) => x.g === "盘库");
    if (g && g.it && g.it[0]) {
      g.it[0][2] =
        "天机巨盘、罗经三盘、三式、全天星图、浑天仪、易学数理、择时养生、流年太岁、建除十二神、黄黑道十二神及后续独立盘";
      g.it[0][3] +=
        " 黄黑道十二神 青龙 明堂 天刑 朱雀 金匮 天德 白虎 玉堂 天牢 玄武 司命 勾陈 值日天神 值时天神 日时流转";
    }
  } catch (_) {}
  try {
    const bv = document.getElementById("buildVersion");

    const ft = document.querySelector("footer");
    if (ft) {
      const t = ft.textContent || "";
      if (/版本\s*·/.test(t));
      else ft.insertAdjacentHTML("beforeend", "<br>版本 · 2026-10-03 22:26:01");
    }
  } catch (_) {}
  window.hhdOpen = hhdOpen;
  window.hhdStop = hhdStop;
})();
