(() => {
  "use strict";
  const BUILD = "v205 · 2026-10-06 13:58 +08:00";
  const SCHEMA = "tianji.xuankong.house.v1";
  const MOUNTAINS = XK_MTN_ALL.slice();
  const CENTERS = [
    345, 0, 15, 30, 45, 60, 75, 90, 105, 120, 135, 150, 165, 180, 195, 210, 225, 240, 255, 270, 285,
    300, 315, 330,
  ];
  const REPLACE = {
    子: 1,
    癸: 1,
    甲: 1,
    申: 1,
    壬: 2,
    卯: 2,
    乙: 2,
    未: 2,
    坤: 2,
    乾: 6,
    亥: 6,
    辰: 6,
    巽: 6,
    巳: 6,
    戌: 6,
    酉: 7,
    辛: 7,
    丑: 7,
    艮: 7,
    丙: 7,
    寅: 9,
    午: 9,
    庚: 9,
    丁: 9,
  };
  const OPP = { 1: 9, 9: 1, 3: 7, 7: 3, 2: 8, 8: 2, 4: 6, 6: 4 };
  let S205 = { facing: 180, mode: "auto", month: 0 };
  const clone = (x) => (x == null ? x : JSON.parse(JSON.stringify(x)));
  const e = (s) =>
    String(s ?? "").replace(
      /[&<>"']/g,
      (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
    );
  const norm = (d) => ((Number(d) % 360) + 360) % 360;
  const signed = (a, b) => ((a - b + 540) % 360) - 180;

  function mountainAt(deg) {
    const d = norm(deg);
    let best = 0,
      dist = 999;
    CENTERS.forEach((c, i) => {
      const x = Math.abs(signed(d, c));
      if (x < dist) {
        dist = x;
        best = i;
      }
    });
    const offset = signed(d, CENTERS[best]),
      idx = best;
    const next = offset >= 0 ? (idx + 1) % 24 : (idx + 23) % 24;
    const current = MOUNTAINS[idx],
      neighbor = MOUNTAINS[next],
      a = xkFind(current),
      b = xkFind(neighbor);
    const edgeDistance = 7.5 - Math.abs(offset);
    const voidLine = edgeDistance <= 1.0;
    return {
      degree: d,
      mountain: current,
      index: idx,
      center: CENTERS[idx],
      offset: +offset.toFixed(2),
      neighbor,
      boundaryDistance: +edgeDistance.toFixed(2),
      mode: Math.abs(offset) <= 4.5 ? "下卦" : "替卦",
      voidLine,
      voidType: voidLine ? (a?.pal === b?.pal ? "小空亡" : "大空亡") : "",
      crossTrigram: a?.pal !== b?.pal,
      description: `${current}${Math.abs(offset) < 0.05 ? "正针" : `兼${neighbor}${Math.abs(offset).toFixed(1)}°`}`,
    };
  }
  function orientation(facing) {
    const face = mountainAt(facing),
      sit = mountainAt(norm(facing + 180));
    return { facing: face, sitting: sit };
  }
  function replaceMeta(origStar, pos, ownMountain, ownPal, useReplace) {
    const sourceMountain = origStar === 5 ? ownMountain : XK_MTN[origStar]?.[pos];
    const dir = origStar === 5 ? xkYY(ownPal, pos) : xkYY(origStar, pos);
    const replacement =
      useReplace && origStar !== 5 && sourceMountain
        ? REPLACE[sourceMountain] || origStar
        : origStar;
    return {
      original: origStar,
      sourceMountain: sourceMountain || ownMountain,
      replacement,
      dir,
      changed: replacement !== origStar,
    };
  }
  function chart205(facing, buildYear, forcedMode = "auto") {
    const O = orientation(facing),
      zuo = O.sitting.mountain,
      z = xkFind(zuo);
    if (!z) return null;
    const yun = xkYuan(buildYear),
      xp = OPP[z.pal],
      xiang = XK_MTN[xp][z.pos],
      yunPan = xkFly(yun, true);
    const zOrig = yunPan[z.pal],
      xOrig = yunPan[xp];
    const autoMode = O.facing.mode === "替卦" || O.sitting.mode === "替卦" ? "替卦" : "下卦";
    const mode = forcedMode === "下卦" || forcedMode === "替卦" ? forcedMode : autoMode,
      useReplace = mode === "替卦";
    const zm = replaceMeta(zOrig, z.pos, zuo, z.pal, useReplace),
      xm = replaceMeta(xOrig, z.pos, xiang, xp, useReplace);
    const shan = xkFly(zm.replacement, zm.dir === 1),
      xiangFly = xkFly(xm.replacement, xm.dir === 1);
    const cells = {};
    for (let p = 1; p <= 9; p++)
      cells[p] = { pal: p, yun: yunPan[p], shan: shan[p], xiang: xiangFly[p] };
    const notes = [];
    const wangShan = cells[z.pal].shan === yun,
      wangXiang = cells[xp].xiang === yun,
      shangShan = cells[xp].shan === yun,
      xiaShui = cells[z.pal].xiang === yun;
    if (wangShan && wangXiang)
      notes.push({
        tone: "good",
        name: "旺山旺向",
        text: "当运山星到坐宫、当运向星到向宫。传统形法仍要求坐后有承托、向首开阔得水方可配合。",
      });
    else if (shangShan && xiaShui)
      notes.push({
        tone: "bad",
        name: "上山下水",
        text: "当运山星到向首、向星到坐山，属于旺星错位的典型结构。",
      });
    else if (wangXiang && shangShan)
      notes.push({
        tone: "cyan",
        name: "双星会向",
        text: "山向两旺星聚向首；传统多强调向方形势配合。",
      });
    else if (wangShan && xiaShui)
      notes.push({
        tone: "cyan",
        name: "双星会坐",
        text: "山向两旺星聚坐方；传统多强调坐方形势配合。",
      });
    else {
      if (wangShan) notes.push({ tone: "good", name: "旺山", text: "当运山星落坐宫。" });
      if (wangXiang) notes.push({ tone: "good", name: "旺向", text: "当运向星落向宫。" });
      if (shangShan) notes.push({ tone: "bad", name: "山星到向", text: "当运山星落向首。" });
      if (xiaShui) notes.push({ tone: "bad", name: "向星到坐", text: "当运向星落坐山。" });
    }
    const heshi = [];
    for (let p = 1; p <= 9; p++) if (cells[p].shan + cells[p].xiang === 10) heshi.push(p);
    if (heshi.length)
      notes.push({
        tone: "good",
        name: "山向合十",
        text: `${heshi.map((p) => XK_PAL_NAME[p]).join("、")}宫山向星相加为十。`,
      });
    if (O.facing.voidLine || O.sitting.voidLine)
      notes.unshift({
        tone: "bad",
        name: O.facing.voidType || O.sitting.voidType,
        text: "坐向非常接近二十四山交界线。实务上应重新复测，避免在误差范围内硬排唯一宅盘。",
      });
    if (mode === "替卦")
      notes.unshift({
        tone: "gold",
        name: "兼向替卦",
        text: `向度偏离山中线超过 4.5°，采用替卦研究口径。山入中 ${zOrig}→${zm.replacement}${zm.changed ? "（有替）" : "（用替未替）"}；向入中 ${xOrig}→${xm.replacement}${xm.changed ? "（有替）" : "（用替未替）"}。`,
      });
    return {
      schema: SCHEMA,
      orientation: O,
      zuo,
      xiang,
      zPal: z.pal,
      xPal: xp,
      pos: z.pos,
      yun,
      mode,
      useReplace,
      yunPan,
      cells,
      zMeta: zm,
      xMeta: xm,
      notes,
    };
  }
  function flows205(chart, flowYear, monthIdx) {
    const yz = (((flowYear - 4) % 12) + 12) % 12,
      ys = xkYearStar(flowYear),
      ms = xkMonthStar(yz, monthIdx);
    return {
      yearCenter: ys,
      monthCenter: ms,
      year: xkFly(ys, true),
      month: xkFly(ms, true),
      monthIdx,
    };
  }
  function hotspots205(chart, F) {
    const out = [];
    for (let p = 1; p <= 9; p++) {
      const c = chart.cells[p],
        ys = F.year[p],
        ms = F.month[p],
        flags = [];
      if (ys === 5) flags.push("流年五黄");
      if (ms === 5) flags.push("流月五黄");
      if (ys === 2) flags.push("流年二黑");
      if (ms === 2) flags.push("流月二黑");
      if (ys === 9) flags.push("流年九紫");
      if (ms === 9) flags.push("流月九紫");
      if (ys === chart.yun) flags.push("流年当运星");
      if (ms === chart.yun) flags.push("流月当运星");
      if ((ys === 5 || ys === 2) && (ms === 5 || ms === 2)) flags.push("二五叠临");
      if (flags.length)
        out.push({
          pal: p,
          name: XK_PAL_NAME[p],
          dir: XK_PAL_DIR[p],
          flags,
          shan: c.shan,
          xiang: c.xiang,
          year: ys,
          month: ms,
        });
    }
    return out;
  }
  function plain205(D) {
    const C = D.chart,
      O = C.orientation,
      n = C.notes.map((x) => x.name);
    const hot = D.hotspots.filter((x) => x.flags.some((f) => /五黄|二黑|二五/.test(f)));
    let t = `这套宅盘按 ${O.facing.degree.toFixed(1)}° 向度立向，对应坐${C.zuo}向${C.xiang}，${C.mode === "替卦" ? "属于兼向替卦" : "属于下卦"}，建造/大修年份落在${NUMC[C.yun]}运。`;
    if (n.length) t += ` 盘面主要结构有：${n.join("、")}。`;
    if (hot.length)
      t += ` ${D.flowYear}年${hot.map((x) => `${x.name}宫(${x.dir})见${x.flags.join("/")}`).join("；")}，传统上这类位置更适合保持安静、谨慎施工；`;
    t +=
      " 这些结论只是玄空规则与时间叠层的结构化翻译，真实居住体验仍要结合采光、通风、动线、噪音、结构安全及外部形势。";
    return t;
  }
  function build205() {
    const by = XKS.build || nowBJ().y,
      fy = XKS.flow || nowBJ().y;
    if (!Number.isFinite(S205.facing)) {
      const old = xkFind(XKS.zuo),
        xp = OPP[old?.pal],
        xm = old ? XK_MTN[xp][old.pos] : "午",
        idx = MOUNTAINS.indexOf(xm);
      S205.facing = idx >= 0 ? CENTERS[idx] : 180;
    }
    const C = chart205(S205.facing, by, S205.mode),
      F = flows205(C, fy, S205.month),
      hot = hotspots205(C, F);
    const evidence = [
      {
        item: "运盘 / 山星 / 向星",
        state: "baseline",
        note: "复用既有玄空下卦算法与八、九运典型格局回归检查。",
      },
      {
        item: "下卦 / 替卦度数带",
        state: "school",
        note: "每山 15°；中间 9°按下卦，左右各 3°按兼向替卦研究口径。",
      },
      {
        item: "替星规则",
        state: "school",
        note: "采用中州/沈氏常见替星诀：子癸甲申一；壬卯乙未坤二；乾亥辰巽巳戌六；酉辛丑艮丙七；寅午庚丁九。替星只替入中数，顺逆仍取原同元龙阴阳。",
      },
      {
        item: "流年 / 流月紫白",
        state: "baseline",
        note: "复用既有年、月紫白飞星算法；此处作为宅盘时间叠层，不单独断事件。",
      },
      {
        item: "空亡线预警",
        state: "policy",
        note: "距二十四山交界线约 1° 内标记为复测区；同卦交界称小空亡、跨卦交界称大空亡，仅作测向风险提示。",
      },
    ];
    return {
      schema: SCHEMA,
      build: BUILD,
      available: !!C,
      buildYear: by,
      flowYear: fy,
      monthIndex: S205.month,
      chart: C,
      flows: F,
      hotspots: hot,
      evidence,
      plain: plain205({ chart: C, flowYear: fy, hotspots: hot }),
    };
  }
  function cell205(D, p) {
    const C = D.chart,
      c = C.cells[p],
      ys = D.flows.year[p],
      ms = D.flows.month[p],
      hot = D.hotspots.find((x) => x.pal === p);
    return `<div class="xk205-cell${p === C.zPal ? " sit" : ""}${p === C.xPal ? " face" : ""}${hot && hot.flags.some((f) => /五黄|二黑|二五/.test(f)) ? " hot" : ""}">
    <div class="xk205-cell-head"><b>${XK_PAL_NAME[p]} · ${XK_PAL_DIR[p]}</b><span>${p === C.zPal ? "坐" : p === C.xPal ? "向" : ""}</span></div>
    <div class="xk205-stars"><span><small>山</small><b>${c.shan}</b></span><span><small>运</small><b>${c.yun}</b></span><span><small>向</small><b>${c.xiang}</b></span></div>
    <div class="xk205-flow"><span class="${ys === 5 || ys === 2 ? "bad" : ys === 9 ? "good" : ""}">年 ${ys}</span><span class="${ms === 5 || ms === 2 ? "bad" : ms === 9 ? "good" : ""}">月 ${ms}</span></div>
  </div>`;
  }
  function panel205() {
    const D = build205();
    if (!D.available)
      return '<section class="xk205"><div class="xk205-note">当前无法生成玄空宅盘。</div></section>';
    const C = D.chart,
      O = C.orientation,
      hot = D.hotspots.filter((x) => x.flags.some((f) => /五黄|二黑|二五/.test(f)));
    return `<section class="xk205" id="xk205Depth">
   <section class="xk205-hero"><div class="xk205-head"><div><h3>玄空宅盘深化 · 精确向度 / 替卦 / 年月叠层</h3><p>在原有三元九运、运盘、山星、向星与流年紫白基础上，加入精确向度判山、下卦/兼向替卦、替星入中、空亡线复测提示、流年流月叠层和大白话宅盘摘要。形法与现实建筑条件仍优先于单独盘面。</p></div><span class="xk205-schema">${SCHEMA}</span></div>
   <div class="xk205-tools"><label>向度（0°北）<input id="xk205Facing" type="number" min="0" max="359.9" step="0.1" value="${O.facing.degree.toFixed(1)}"></label><label>盘式<select id="xk205Mode"><option value="auto"${S205.mode === "auto" ? " selected" : ""}>自动判定</option><option value="下卦"${S205.mode === "下卦" ? " selected" : ""}>强制下卦</option><option value="替卦"${S205.mode === "替卦" ? " selected" : ""}>强制替卦</option></select></label><label>流月<select id="xk205Month">${JIE.map((x, i) => `<option value="${i}"${S205.month === i ? " selected" : ""}>${x}月</option>`).join("")}</select></label><button id="xk205SyncOld" type="button">同步到旧宅盘</button><button id="xk205Copy" type="button">复制宅盘 Schema</button></div></section>
   <div class="xk205-kpis">
    <div class="xk205-kpi cyan"><small>坐向</small><b>${e(C.zuo)} → ${e(C.xiang)}</b></div>
    <div class="xk205-kpi"><small>向度</small><b>${O.facing.degree.toFixed(1)}°</b></div>
    <div class="xk205-kpi ${C.mode === "替卦" ? "bad" : "good"}"><small>盘式</small><b>${C.mode}</b></div>
    <div class="xk205-kpi"><small>元运</small><b>${NUMC[C.yun]}运</b></div>
    <div class="xk205-kpi ${O.facing.voidLine ? "bad" : "good"}"><small>交界风险</small><b>${O.facing.voidLine ? O.facing.voidType : "正常"}</b></div>
    <div class="xk205-kpi bad"><small>二五热点</small><b>${hot.length}</b></div>
   </div>
   <div class="xk205-grid">
    <section class="xk205-card"><h4>九宫宅盘 · 山 / 运 / 向 + 年 / 月</h4><div class="xk205-nine">${XK_GRID.map((p) => cell205(D, p)).join("")}</div><div class="xk205-note" style="margin-top:7px">金边=坐宫，青边=向宫。每宫中间三数依次为山星 / 运星 / 向星；下方“年/月”为紫白时间叠层，不改变本命宅盘。</div></section>
    <aside class="xk205-card"><h4>立向与替卦审计</h4><div class="xk205-list">
      <div class="xk205-item cyan"><b>向：${e(O.facing.description)} · 坐：${e(O.sitting.description)}</b><small>当前向线距本山中心 ${Math.abs(O.facing.offset).toFixed(1)}°，距最近交界 ${O.facing.boundaryDistance.toFixed(1)}°。${O.facing.crossTrigram ? "正在靠近另一卦宫。" : "相邻山仍在同一卦宫。"}</small></div>
      <div class="xk205-item ${C.mode === "替卦" ? "gold" : "good"}"><b>${C.mode} · 山星入中 ${C.zMeta.original}→${C.zMeta.replacement} · 向星入中 ${C.xMeta.original}→${C.xMeta.replacement}</b><small>山星所取同元龙：${e(C.zMeta.sourceMountain)}，${C.zMeta.dir ? "顺" : "逆"}飞；向星所取同元龙：${e(C.xMeta.sourceMountain)}，${C.xMeta.dir ? "顺" : "逆"}飞。${C.mode === "替卦" ? "替星只替入中星数，顺逆仍按原同元龙阴阳。" : "下卦不替入中星。"}</small></div>
      ${O.facing.voidLine ? `<div class="xk205-item bad"><b>${e(O.facing.voidType)}复测提示</b><small>当前读数靠近二十四山交界，手机磁传感器、钢筋、电器都可能造成数度误差。建议在多个位置复测，不宜强行只取一盘。</small></div>` : ""}
    </div></aside>
   </div>
   <div class="xk205-grid">
    <section class="xk205-card"><h4>宅盘格局</h4><div class="xk205-list">${C.notes.map((x) => `<div class="xk205-item ${x.tone}"><b>${e(x.name)}</b><small>${e(x.text)}</small></div>`).join("") || '<div class="xk205-note">未识别到本版本单列的主要格局。</div>'}</div></section>
    <aside class="xk205-card"><h4>${D.flowYear} 年 · ${JIE[D.monthIndex]}月重点宫位</h4><div class="xk205-list">${D.hotspots.length ? D.hotspots.map((x) => `<div class="xk205-item ${x.flags.some((f) => /五黄|二黑|二五/.test(f)) ? "bad" : x.flags.some((f) => /九紫|当运/.test(f)) ? "good" : "cyan"}"><b>${e(x.name)}宫 · ${e(x.dir)}</b><small>${e(x.flags.join(" · "))}；宅盘山${x.shan}/向${x.xiang}，年${x.year}/月${x.month}。</small></div>`).join("") : '<div class="xk205-note">本月没有命中当前筛选标签的宫位。</div>'}</div></aside>
   </div>
   <div class="xk205-grid">
    <section class="xk205-card"><h4>大白话</h4><div class="xk205-plain">${e(D.plain)}</div><div class="xk205-note" style="margin-top:7px">五黄、二黑等是传统紫白飞星分类，不应被理解成疾病、事故或财务结果的确定预测。装修与居住决策请优先考虑结构安全、消防、采光、通风、噪音和真实使用需求。</div></section>
    <aside class="xk205-card"><h4>Evidence / 口径</h4><div class="xk205-evidence">${D.evidence.map((x) => `<div class="xk205-ev"><b>${e(x.item)}</b><small>${e(x.note)}</small><span>${x.state === "baseline" ? "既有基线" : x.state === "school" ? "流派规则" : "测向策略"}</span></div>`).join("")}</div></aside>
   </div>
  </section>`;
  }
  function bind205() {
    document.getElementById("xk205Facing")?.addEventListener("change", (e0) => {
      S205.facing = norm(+e0.target.value || 0);
      refRender("xk");
    });
    document.getElementById("xk205Mode")?.addEventListener("change", (e0) => {
      S205.mode = e0.target.value;
      refRender("xk");
    });
    document.getElementById("xk205Month")?.addEventListener("change", (e0) => {
      S205.month = +e0.target.value || 0;
      refRender("xk");
    });
    document.getElementById("xk205SyncOld")?.addEventListener("click", () => {
      const D = build205();
      XKS.zuo = D.chart.zuo;
      const z = document.getElementById("xkZuo");
      if (z) z.value = XKS.zuo;
      try {
        document.getElementById("xkBox").innerHTML = xkHTML(R);
        document.getElementById("xkRead").innerHTML = xkReadHTML(R);
        toast("已同步精确向度对应坐山到旧宅盘");
      } catch (_) {}
    });
    document.getElementById("xk205Copy")?.addEventListener("click", () =>
      navigator.clipboard
        ?.writeText?.(JSON.stringify(build205(), null, 2))
        .then(() => {
          try {
            toast("已复制玄空宅盘 Schema");
          } catch (_) {}
        })
        .catch(() => {}),
    );
  }
  try {
    const oldP = REF_PANES.xk;
    if (oldP && !oldP.__v205) {
      const fn = () => oldP() + panel205();
      fn.__v205 = true;
      REF_PANES.xk = fn;
    }
    const oldB = REF_BIND.xk;
    const bf = () => {
      try {
        oldB && oldB();
      } catch (e0) {
        console.warn("[V205 old xk bind]", e0);
      }
      try {
        bind205();
      } catch (e0) {
        console.warn("[V205 xk bind]", e0);
      }
    };
    bf.__v205 = true;
    REF_BIND.xk = bf;
  } catch (e0) {
    console.warn("[V205 xk patch]", e0);
  }

  function selfTest205() {
    const C = [],
      add = (id, ok, d = "") => C.push({ id, ok: !!ok, d });
    try {
      let a = mountainAt(180);
      add("orientation.wu", a.mountain === "午" && a.mode === "下卦", JSON.stringify(a));
      let b = mountainAt(185.5);
      add("orientation.replace", b.mountain === "午" && b.mode === "替卦", JSON.stringify(b));
      let x = chart205(180, 2026, "下卦");
      add("chart.shape", !!x && Object.keys(x.cells).length === 9, `${x?.zuo}/${x?.xiang}`);
      let y = chart205(185.5, 2026, "替卦");
      add(
        "replace.shape",
        !!y &&
          y.mode === "替卦" &&
          Number.isFinite(y.zMeta.replacement) &&
          Number.isFinite(y.xMeta.replacement),
        JSON.stringify({ z: y?.zMeta, x: y?.xMeta }),
      );
      add(
        "replace.mapping",
        REPLACE.辰 === 6 && REPLACE.甲 === 1 && REPLACE.丑 === 7 && REPLACE.庚 === 9,
        "",
      );
    } catch (e0) {
      add("exception", false, String((e0 && e0.message) || e0));
    }
    return { ok: C.every((x) => x.ok), checks: C };
  }
  const TEST205 = selfTest205();

  const TASKS205 = [
    { id: "ai", p: "P0", name: "统一 AI 解释层", state: "done", note: "v171 完成" },
    { id: "mcp", p: "P0", name: "MCP / API 外部调用层", state: "done", note: "v172 完成" },
    {
      id: "kg",
      p: "P0",
      name: "典籍 Evidence / 规则知识图谱",
      state: "done",
      note: "v173 第一阶段完成",
    },
    {
      id: "router",
      p: "P0",
      name: "自然语言问事路由",
      state: "done",
      note: "v196–v197；含寻人 / 寻物路由",
    },
    {
      id: "consumer",
      p: "P0",
      name: "统一消费者结果页 / 报告",
      state: "done",
      note: "v198：深度解析 + 大白话结果 + 来源回指",
    },
    {
      id: "qimen-evidence",
      p: "P1",
      name: "奇门四家第三方对拍 / 高级 Evidence",
      state: "doing",
      note: "v199 一期验证台完成；日/月/年仍等待真实外部 reference 样本",
    },
    {
      id: "liuyao-depth",
      p: "P1",
      name: "六爻完整旺衰 / 卦格 / 应期层",
      state: "done",
      note: "v202 完成",
    },
    {
      id: "ziwei-depth",
      p: "P1",
      name: "紫微完整飞星体系",
      state: "done",
      note: "v203–v204 完成当前声明流派口径 V1",
    },
    {
      id: "qizheng",
      p: "P1",
      name: "七政四余核心化",
      state: "blocked",
      note: "等待星历、四余口径与许可证方案",
    },
    {
      id: "xk",
      p: "P1",
      name: "玄空完整宅盘",
      state: "doing",
      note: "v205 一期：精确向度、下卦/替卦、替星入中、空亡线复测、山运向九宫、流年流月叠层、大白话与 Evidence；后续补第三方逐盘对拍与更完整宅盘格局库",
    },
    {
      id: "sanhe",
      p: "P1",
      name: "三合水法 Core",
      state: "todo",
      note: "罗盘已有，确定性规则链待核心化",
    },
    {
      id: "tz",
      p: "P2",
      name: "历史时区 / 夏令时自动校正",
      state: "todo",
      note: "历史时区数据库待接入",
    },
    {
      id: "relation",
      p: "P2",
      name: "关系长期时间轴",
      state: "todo",
      note: "人物关系已有，长期阶段待产品化",
    },
    {
      id: "report",
      p: "P2",
      name: "合参 Evidence 正式报告",
      state: "todo",
      note: "与消费者结果页联动推进",
    },
  ];
  const BOARD205 = {
    schema: "tianji.priority.board.v1",
    build: BUILD,
    total: 14,
    done: 7,
    doing: 2,
    blocked: 1,
    progress: 57.1,
    next: [
      "玄空宅盘二期：第三方对拍 / 格局库",
      "奇门日/月/年真实第三方 reference 样本",
      "三合水法 Core",
    ],
    tasks: TASKS205,
  };
  function board205() {
    window.TianjiPriorityBoard = Object.freeze({
      schema: BOARD205.schema,
      snapshot: () => clone(BOARD205),
    });
    const road = window.TianjiRoadmap || {};
    window.TianjiRoadmap = Object.freeze(
      Object.assign({}, road, {
        urgentImportant: clone(BOARD205),
        nextMainline: [
          "玄空宅盘二期：对拍 / 格局 Evidence",
          "奇门四家第三方对拍（二期待外部样本）",
          "三合水法 Core",
          "历史时区 / DST",
        ],
      }),
    );
  }
  board205();
  window.addEventListener("tianji:lazy-ready", () => setTimeout(board205, 0));

  window.TianjiXuankongHouse = Object.freeze({
    version: "1.0.0",
    build: BUILD,
    schema: SCHEMA,
    analyze: () => clone(build205()),
    orientation: (d) => clone(orientation(d)),
    chart: (facing, year, mode) => clone(chart205(facing, year, mode || "auto")),
    selfTest: () => clone(TEST205),
    manifest: () => ({
      module: "Tianji Xuankong House V1",
      features: [
        "精确向度",
        "24山",
        "下卦/替卦",
        "替星",
        "空亡线预警",
        "山运向三盘",
        "年月紫白叠层",
        "宅盘格局",
        "大白话",
        "Evidence",
      ],
      remaining: ["更多经典格局库", "替卦逐盘第三方对拍", "复杂户型立极/多入口策略"],
    }),
  });
  window.TianjiSystemV205 = {
    version: "v205",
    build: BUILD,
    xuankongHouse: true,
    noticeGlobalSwitches: true,
    noticeQuietDefault: true,
    baseline: "v204",
  };

  function sync205() {
    const b = document.getElementById("buildVersion");
  }
})();
