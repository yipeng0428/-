(() => {
  "use strict";
  const V165_BUILD = "v165 · 2026-10-05 14:20 +08:00";
  const K = "tianjipan.qimen.family.v165";
  let mode = "hour";
  try {
    mode = localStorage.getItem(K) || "hour";
  } catch (_) {}
  if (!["hour", "day", "month", "year"].includes(mode)) mode = "hour";
  const MOD = (n, m) => ((n % m) + m) % m;
  const G = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"],
    Z = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];
  const JZ = Array.from({ length: 60 }, (_, i) => G[i % 10] + Z[i % 12]);
  const FLY = [1, 2, 3, 4, 6, 7, 8, 9],
    TURN = [1, 8, 3, 4, 9, 2, 7, 6];
  const STEMS = ["戊", "己", "庚", "辛", "壬", "癸", "丁", "丙", "乙"],
    LIUYI = ["戊", "己", "庚", "辛", "壬", "癸"];
  const HSTAR = { 1: "蓬", 2: "芮", 3: "冲", 4: "辅", 5: "禽", 6: "心", 7: "柱", 8: "任", 9: "英" };
  const HDOOR = { 1: "休", 2: "死", 3: "伤", 4: "杜", 6: "开", 7: "惊", 8: "生", 9: "景" };
  const PNM = { 1: "坎", 2: "坤", 3: "震", 4: "巽", 5: "中", 6: "乾", 7: "兑", 8: "艮", 9: "离" },
    PD = {
      1: "北",
      2: "西南",
      3: "东",
      4: "东南",
      5: "中",
      6: "西北",
      7: "西",
      8: "东北",
      9: "南",
    },
    PN = { 1: "一", 2: "二", 3: "三", 4: "四", 5: "五", 6: "六", 7: "七", 8: "八", 9: "九" };
  const GOOD = new Set(["休", "生", "开"]),
    MID = new Set(["景", "杜"]);
  function pidx(p) {
    return TURN.indexOf(p === 5 ? 2 : p);
  }
  function flyIdx(p) {
    return FLY.indexOf(p === 5 ? 2 : p);
  }
  function yearIdx(R0) {
    try {
      return ganzhiIdx(R0.bz.pill[0].s, R0.bz.pill[0].b);
    } catch (_) {
      const y = R0?.t?.civ?.y || new Date().getFullYear();
      return MOD(y - 1984, 60);
    }
  }
  function monthIdx(R0) {
    try {
      return ganzhiIdx(R0.bz.pill[1].s, R0.bz.pill[1].b);
    } catch (_) {
      return 0;
    }
  }
  function dayIdx(R0) {
    return Number.isFinite(R0?.bz?.dayIdx) ? R0.bz.dayIdx : 0;
  }
  function q165Earth(ju) {
    const earth = {},
      ganPal = {};
    STEMS.forEach((g, i) => {
      const p = MOD(ju - 1 - i, 9) + 1;
      earth[p] = g;
      ganPal[g] = p;
    });
    return { earth, ganPal };
  }
  function periodCore(ju, idx, label) {
    const { earth, ganPal } = q165Earth(ju),
      xun = Math.floor(idx / 10),
      dun = LIUYI[xun],
      gz = JZ[idx],
      stem = gz[0],
      ref = stem === "甲" ? dun : stem;
    let p0 = ganPal[dun],
      p0r = p0 === 5 ? 2 : p0,
      q = ganPal[ref];
    if (q === 5) q = 2;
    const sh = MOD(pidx(q) - pidx(p0r), 8),
      heaven = {},
      stars = {};
    TURN.forEach((home, i) => {
      const dst = TURN[MOD(i + sh, 8)];
      heaven[dst] = earth[home];
      stars[dst] = HSTAR[home];
    });
    const step = idx % 10,
      rr = FLY[MOD(flyIdx(p0r) - step, 8)],
      sd = MOD(flyIdx(rr) - flyIdx(p0r), 8),
      doors = {};
    FLY.forEach((home, i) => (doors[FLY[MOD(i + sd, 8)]] = HDOOR[home]));
    return {
      label,
      ju,
      idx,
      gz,
      xun,
      dun,
      p0,
      p0r,
      q,
      rr,
      earth,
      heaven,
      stars,
      doors,
      zf: HSTAR[p0] || "禽",
      zs: HDOOR[p0r] || "死",
    };
  }
  function q222YearPolicy() {
    try {
      const v = localStorage.getItem("tianjipan.qimen.year-doctrine.v222");
      return v === "rolling" ? "rolling" : "fixed";
    } catch (_) {
      return "fixed";
    }
  }
  function yearMetaByPolicy(R0, policy = "fixed") {
    const y = R0?.t?.civ?.y || new Date().getFullYear(),
      cy = Math.floor((y - 1864) / 60),
      yuan = MOD(cy, 3),
      start = 1864 + cy * 60,
      off = y - start,
      base = [1, 4, 7][yuan],
      p = policy === "rolling" ? "rolling" : "fixed",
      ju = p === "rolling" ? MOD(base - 1 - off, 9) + 1 : base,
      idx = yearIdx(R0);
    return { y, yuan, name: ["上元", "中元", "下元"][yuan], start, off, base, ju, idx, policy: p };
  }
  function yearMeta(R0) {
    return yearMetaByPolicy(R0, q222YearPolicy());
  }
  function monthMeta(R0) {
    const yi = yearIdx(R0),
      start = yi - (yi % 5),
      b = start % 12,
      kind = "寅申巳亥".includes(Z[b]) ? 0 : "子午卯酉".includes(Z[b]) ? 1 : 2,
      ju = [1, 7, 4][kind],
      idx = monthIdx(R0);
    return {
      yearIndex: yi,
      startIndex: start,
      startGZ: JZ[start],
      startBranch: Z[b],
      yuan: kind,
      name: ["上元", "中元", "下元"][kind],
      ju,
      idx,
    };
  }
  function dayMeta(R0) {
    const idx = dayIdx(R0),
      grp = Math.floor(idx / 3),
      anchor = FLY[grp % 8],
      pos = (idx % 3) + 1,
      doors = {},
      ai = FLY.indexOf(anchor),
      seq = ["休", "死", "伤", "杜", "开", "惊", "生", "景"];
    seq.forEach((d, i) => (doors[FLY[(ai + i) % 8]] = d));
    return { idx, gz: JZ[idx], grp, anchor, pos, doors };
  }
  function cellClass(d) {
    return GOOD.has(d) ? "good" : MID.has(d) ? "mid" : "bad";
  }
  function gridPeriod(C) {
    const order = [4, 9, 2, 3, 5, 7, 8, 1, 6];
    return `<div class="q165-qgrid">${order
      .map((p) => {
        if (p === 5)
          return `<div class="q165-cell center"><div><small style="color:var(--dim)">中五宫</small><div class="stem">${C.earth[5] || "—"}</div><small style="color:var(--dim)">地盘 · 阴遁${PN[C.ju]}局</small></div></div>`;
        const d = C.doors[p],
          cl = cellClass(d);
        return `<div class="q165-cell ${cl}${p === C.q ? " zf" : ""}${p === C.rr ? " zs" : ""}"><div class="top"><span>${PNM[p]}${PN[p]} · ${PD[p]}</span><span>天${C.stars[p] || "—"}</span></div><div style="margin-top:12px"><span class="stem">${C.heaven[p] || "—"}</span> <span class="star">天盘</span></div><div class="door ${cl}">${d || "—"}门</div><div class="earth">地盘 ${C.earth[p] || "—"}</div></div>`;
      })
      .join("")}</div>`;
  }
  function dayGrid(M) {
    const order = [4, 9, 2, 3, 5, 7, 8, 1, 6];
    return `<div class="q165-daygrid">${order
      .map((p) => {
        if (p === 5)
          return `<div class="q165-daycell"><b>中五宫</b><span class="d">—</span><small>日家八门不入中五</small></div>`;
        const d = M.doors[p],
          cl = GOOD.has(d) || d === "景" ? "good" : MID.has(d) ? "mid" : "bad";
        return `<div class="q165-daycell${p === M.anchor ? " on" : ""}"><div><b>${PNM[p]}${PN[p]} · ${PD[p]}</b><div class="door ${cl}" style="margin-top:8px">${d}门</div></div><small>${p === M.anchor ? "本组三日从此宫起休门" : "八门顺轮"}</small></div>`;
      })
      .join("")}</div>`;
  }
  function periodSide(type, M, C, R0) {
    if (type === "year")
      return `<div class="q165-card"><h4>年家三元</h4><p><b>${M.name}</b> · 本元 ${M.start}–${M.start + 59}。${M.start} 为本元甲子基准年。</p><div class="q165-pills"><span>基准阴${PN[M.base]}局</span><span>本年阴${PN[M.ju]}局</span><span>${M.policy === "rolling" ? "旧版逐年逆移" : "三元固定局"}</span><span>${JZ[M.idx]}</span></div></div><div class="q165-card"><h4>值符 / 值使</h4><p>旬首遁干 <b>${C.dun}</b>；值符 <b>天${C.zf}</b> 随年干转至 ${PNM[C.q]}宫；值使 <b>${C.zs}门</b> 按年支序逆飞至 ${PNM[C.rr]}宫。</p></div><div class="q165-card"><h4>流派证据</h4><p>${M.policy === "fixed" ? "当前推荐“上/中/下元固定阴一/四/七局”。该口径同时获得 atopx/qimen 与 Horosa 两套独立公开参考样本支持。" : "旧版兼容口径：本元基准局随年序逐年逆移。保留用于历史结果复现，不再作为默认。"}</p></div>`;
    if (type === "month")
      return `<div class="q165-card"><h4>月家三元</h4><p>当前五年组从 <b>${M.startGZ}</b> 起，首年地支属${"寅申巳亥".includes(M.startBranch) ? "四孟" : "子午卯酉".includes(M.startBranch) ? "四仲" : "四季"}，故取 <b>${M.name}</b>。</p><div class="q165-pills"><span>${M.name}</span><span>阴${PN[M.ju]}局</span><span>月建 ${JZ[M.idx]}</span></div></div><div class="q165-card"><h4>五虎遁月建</h4><p>月干支直接复用本站八字节令月柱，避免把农历初一误当月界；值符随月干，值使按月支序逆飞。</p></div><div class="q165-card"><h4>适用尺度</h4><p>月家更适合月度阶段、项目周期与月内方位研究；与时家问具体时刻的用途不同。</p></div>`;
    return "";
  }
  function periodHTML(type, R0) {
    if (type === "day") {
      const M = dayMeta(R0),
        q = R0?.qm;
      return `<div class="q165-period on"><div class="panel blk"><div class="q165-hero"><div><h2>日家奇门 · 三日移宫八门盘</h2><p>按《遁甲演义》“甲子起坎、每三日一换、顺飞八方、不入中五”的日家规则，把当前日干支定位到八宫，再从该宫起休门顺轮八门。</p></div><div class="q165-kpis"><div class="q165-kpi"><small>今日</small><b>${M.gz}</b></div><div class="q165-kpi"><small>三日组</small><b>第 ${M.grp + 1} 组</b></div><div class="q165-kpi"><small>起休门</small><b>${PNM[M.anchor]}${PN[M.anchor]}宫</b></div><div class="q165-kpi"><small>节令遁</small><b>${q ? (q.yang ? "阳遁期" : "阴遁期") : "—"}</b></div></div></div><div class="q165-actions">${navButtons("day")}<span class="hint">本版先实现古籍明确的“三日一移八宫 + 八门”；三奇细层不硬造未校规则。</span></div></div><div class="q165-grid"><section class="panel blk q165-pan">${dayGrid(M)}</section><aside class="q165-side"><div class="q165-card"><h4>当前位置</h4><p><b>${M.gz}</b> 为本组三日中的第 <b>${M.pos}</b> 日；休门落 <b>${PNM[M.anchor]}${PN[M.anchor]}宫</b>。</p></div><div class="q165-card"><h4>日家吉门</h4><p>原文明确列 <b>休、开、生、景</b> 为吉门；实际应用仍需结合旺衰、三奇与所办事项，不把单一门位当结论。</p></div><div class="q165-card"><h4>边界说明</h4><p>日家奇门流传口径不止一种。本页采用《遁甲演义》可直接复核的八门表作为第一版，不与时家拆补算法混写。</p></div></aside></div><div class="q165-audit"><b>古籍实现范围：</b>甲子三日移宫表、八门顺轮已实现；阴阳二遁与三奇更细层仍列为 Evidence 待核，不以推测补齐。</div></div>`;
    }
    if (type === "month") {
      const M = monthMeta(R0),
        C = periodCore(M.ju, M.idx, "月家");
      return `<div class="q165-period on"><div class="panel blk"><div class="q165-hero"><div><h2>月家奇门 · 五年三元月建盘</h2><p>按《遁甲演义》“甲己遇四孟/四仲/四季分三元；上元一宫、中元七宫、下元四宫起甲子”的月家口径，并用本站节令月柱作为月建。</p></div><div class="q165-kpis"><div class="q165-kpi"><small>五年元</small><b>${M.name}</b></div><div class="q165-kpi"><small>局</small><b>阴${PN[M.ju]}局</b></div><div class="q165-kpi"><small>月建</small><b>${JZ[M.idx]}</b></div><div class="q165-kpi"><small>值符 / 值使</small><b>天${C.zf} / ${C.zs}</b></div></div></div><div class="q165-actions">${navButtons("month")}<span class="hint">月份边界复用本站节气月柱，不用农历初一替代。</span></div></div><div class="q165-grid"><section class="panel blk q165-pan">${gridPeriod(C)}</section><aside class="q165-side">${periodSide("month", M, C, R0)}</aside></div><div class="q165-audit"><b>算法口径：</b>月家按五年一元、阴遁一/七/四局重构；值符按月干、值使按月支序移动。属于古籍规则研究实现，尚未完成独立第三方软件逐月对拍。</div></div>`;
    }
    const M = yearMeta(R0),
      C = periodCore(M.ju, M.idx, "年家");
    return `<div class="q165-period on"><div class="panel blk"><div class="q165-hero"><div><h2>年家奇门 · 三元六十年盘</h2><p>年遁皆阴。V222 将“上/中/下元固定一/四/七局”升级为推荐口径，同时完整保留旧版“本元内逐年逆移”用于历史结果复现；两者不再混写。</p></div><div class="q165-kpis"><div class="q165-kpi"><small>年份</small><b>${M.y}</b></div><div class="q165-kpi"><small>三元</small><b>${M.name}</b></div><div class="q165-kpi"><small>年局</small><b>阴${PN[M.ju]}局</b></div><div class="q165-kpi"><small>年柱</small><b>${JZ[M.idx]}</b></div></div></div><div class="q165-actions">${navButtons("year")}<label style="display:inline-flex;align-items:center;gap:6px">年家口径<select id="q222YearDoctrine"><option value="fixed"${M.policy === "fixed" ? " selected" : ""}>三元固定局 · 推荐</option><option value="rolling"${M.policy === "rolling" ? " selected" : ""}>逐年逆移 · 旧版兼容</option></select></label><span class="hint">1864 上元甲子 · 1924 中元甲子 · 1984 下元甲子 · 2044 再上元。</span></div></div><div class="q165-grid"><section class="panel blk q165-pan">${gridPeriod(C)}</section><aside class="q165-side">${periodSide("year", M, C, R0)}</aside></div><div class="q165-audit"><b>V222 Evidence：</b>两套独立公开参考数据都把 2024–2026 下元年家处理为阴七局，因此固定局成为推荐口径；旧 rolling 仍可选，不把流派差异伪装成唯一真值。</div></div>`;
  }
  function navButtons(t) {
    const u = t === "day" ? "日" : t === "month" ? "月" : "年";
    return `<button type="button" class="gbtn sm" data-q165-shift="-1">← 上一${u}</button><button type="button" class="gbtn sm" data-q165-now>回到此刻</button><button type="button" class="gbtn sm" data-q165-shift="1">下一${u} →</button>`;
  }
  function familyHeader() {
    return `<div class="panel blk q165-family"><div class="q165-family-head"><div><h3>奇门四家 · 时间尺度</h3><p>时家看具体时刻；日家、月家、年家是不同起局体系，不是把同一张时盘简单放大。v165 将四种尺度并列，并把古籍口径与未校部分明确标注。</p></div><span class="q165-badge">Qimen Period Family · v165</span></div><div class="q165-tabs"><button data-q165-mode="hour" class="${mode === "hour" ? "on" : ""}"><b>时家</b><small>时辰 · 既有 Core 2.0</small></button><button data-q165-mode="day" class="${mode === "day" ? "on" : ""}"><b>日家</b><small>三日一移 · 八门</small></button><button data-q165-mode="month" class="${mode === "month" ? "on" : ""}"><b>月家</b><small>五年三元 · 月建</small></button><button data-q165-mode="year" class="${mode === "year" ? "on" : ""}"><b>年家</b><small>三元六十年 · 年遁</small></button></div></div>`;
  }
  const OLD = window.renderQimen || renderQimen;
  renderQimen = function (R0) {
    const body = OLD(R0);
    return (
      familyHeader() +
      `<div class="q165-hour${mode === "hour" ? "" : " off"}">${body}</div>` +
      (mode === "hour" ? "" : periodHTML(mode, R0))
    );
  };
  window.renderQimen = renderQimen;
  async function shift(dir) {
    try {
      const c = R?.t?.civ || nowBJ(),
        d = { y: c.y, m: c.m, d: c.d, h: c.h || 0, mi: c.mi || 0, s: c.s || 0 };
      if (mode === "day") {
        const x = new Date(Date.UTC(d.y, d.m - 1, d.d + dir, d.h, d.mi, d.s));
        d.y = x.getUTCFullYear();
        d.m = x.getUTCMonth() + 1;
        d.d = x.getUTCDate();
      } else if (mode === "month") {
        const x = new Date(Date.UTC(d.y, d.m - 1 + dir, d.d, d.h, d.mi, d.s));
        d.y = x.getUTCFullYear();
        d.m = x.getUTCMonth() + 1;
        d.d = x.getUTCDate();
      } else if (mode === "year") {
        d.y += dir;
      } else return;
      setLive(false);
      await deduce(d, "full");
      selectTab("qimen", false);
    } catch (e) {
      console.error("[v165 shift]", e);
      try {
        toast("切换失败：" + (e.message || e));
      } catch (_) {}
    }
  }
  async function now() {
    try {
      await startDerive("qimen");
      selectTab("qimen", false);
    } catch (e) {
      console.error(e);
    }
  }
  document.addEventListener("click", (e) => {
    const b =
      e.target.closest && e.target.closest("[data-q165-mode],[data-q165-shift],[data-q165-now]");
    if (!b) return;
    if (b.dataset.q165Mode) {
      mode = b.dataset.q165Mode;
      try {
        localStorage.setItem(K, mode);
      } catch (_) {}
      try {
        refRender("qimen");
        setTimeout(() => {
          try {
            if (typeof bindReadings === "function") bindReadings();
            if (typeof dvDecorate === "function") dvDecorate();
          } catch (_) {}
        }, 0);
      } catch (_) {
        const p = document.getElementById("pane-qimen");
        if (p && typeof R !== "undefined") p.innerHTML = renderQimen(R);
      }
      return;
    }
    if (b.hasAttribute("data-q165-shift")) {
      shift(+b.dataset.q165Shift || 0);
      return;
    }
    if (b.hasAttribute("data-q165-now")) now();
  });
  function selfTest() {
    const C = [];
    const add = (n, ok, d = "") => C.push({ n, ok: !!ok, d });
    try {
      const fake = (y) => ({
        t: { civ: { y } },
        bz: {
          pill: [
            { s: MOD(y - 1984, 10), b: MOD(y - 1984, 12) },
            { s: 0, b: 0 },
          ],
          dayIdx: 0,
        },
      });
      let a = yearMetaByPolicy(fake(1984), "fixed"),
        b = yearMetaByPolicy(fake(2024), "fixed"),
        br = yearMetaByPolicy(fake(2024), "rolling"),
        c = yearMetaByPolicy(fake(2044), "fixed");
      add("year.fixed.1984", a.name === "下元" && a.ju === 7, JSON.stringify(a));
      add("year.fixed.2024", b.name === "下元" && b.ju === 7, JSON.stringify(b));
      add("year.rolling.2024", br.name === "下元" && br.ju === 3, JSON.stringify(br));
      add("year.fixed.2044", c.name === "上元" && c.ju === 1, JSON.stringify(c));
      const d = dayMeta({ bz: { dayIdx: 0 } }),
        e = dayMeta({ bz: { dayIdx: 3 } });
      add("day.jiazi", d.anchor === 1 && d.doors[1] === "休");
      add("day.dingmao", e.anchor === 2 && e.doors[2] === "休");
      const f = periodCore(7, 40, "test");
      add(
        "period.structure",
        Object.keys(f.doors).length === 8 && Object.keys(f.stars).length === 8 && !!f.earth[5],
      );
    } catch (e) {
      add("exception", false, e.message);
    }
    return { ok: C.every((x) => x.ok), checks: C };
  }
  const TEST = selfTest();
  window.TianjiQimenPeriod = Object.freeze({
    version: "1.1.0",
    build: V165_BUILD,
    getMode: () => mode,
    setMode: (m) => {
      if (["hour", "day", "month", "year"].includes(m)) mode = m;
      return mode;
    },
    yearMeta,
    yearMetaByPolicy,
    yearPolicy: q222YearPolicy,
    monthMeta,
    dayMeta,
    periodCore,
    selfTest: () => JSON.parse(JSON.stringify(TEST)),
    manifest: () => ({
      module: "Tianji Qimen Period Family",
      version: "1.1.0",
      build: V165_BUILD,
      implemented: [
        "日家三日移宫八门",
        "月家五年三元月建盘",
        "年家三元六十年盘",
        "V222 年家固定局/逐年逆移双口径",
      ],
      source: "《遁甲演义》研究口径 + 外部 Golden 对拍",
      limitations: [
        "日家完整三奇/九星/值符值使仍未封顶",
        "月家虽已有独立样本支持但仍需扩大样本",
        "不同门派不声明唯一标准",
      ],
      selfTest: TEST,
    }),
  });
  try {
    const road = window.TianjiRoadmap || {},
      er = (road.engineRoute || []).map((x) =>
        x.id === "qimen"
          ? Object.assign({}, x, {
              state: "core+verify+doctrine+period-family",
              versions: "v110–v112,v165",
              next: "四家古籍交叉验证 + 完整格局知识层",
            })
          : x,
      );
    window.TianjiRoadmap = Object.freeze(
      Object.assign({}, road, {
        engineRoute: er,
        nextMainline: [
          "奇门四家交叉验证/格局知识层",
          "梅花易数 Core+Verify",
          "择日 Core",
          "Evidence 总控",
          "跨术数合参",
          "AI",
          "MCP",
        ],
      }),
    );
  } catch (_) {}
  try {
    if (window.TianjiCore) {
      TianjiCore.registerSource({
        id: "tianji-v165-qimen-period",
        type: "internal",
        title: "Tianji Qimen Period Family",
        version: "1.0.0",
        baseline: "v164",
      });
      TianjiCore.registerEngine(
        {
          id: "qimen.period.v1",
          system: "qimen",
          name: "Qimen Period Family",
          version: "1.0.0",
          source: "tianji-v165-qimen-period",
          doctrine: "《遁甲演义》日家/月家/年家研究口径",
          status: TEST.ok ? "active" : "degraded",
        },
        (input) => input,
      );
    }
  } catch (e) {
    console.warn("[v165 registry]", e);
  }
  try {
    const note = document.querySelector("#tjq112Policy")?.parentElement?.querySelector(".note");
    if (note && /日盘\/月盘\/年盘尚未/.test(note.textContent || ""))
      note.textContent =
        "v165 已接入日家 / 月家 / 年家研究盘；时家仍保留 Core 2.0 的盘式、定局、八神与马星口径开关。四家算法彼此独立，不把不同时间尺度简单混算。";
  } catch (_) {}
  try {
    const bv = document.getElementById("buildVersion");

    window.TianjiSystemV165 = {
      version: "v165",
      build: V165_BUILD,
      qimenPeriodFamily: true,
      selfTest: TEST,
    };
  } catch (_) {}
})();
