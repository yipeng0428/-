const STU_REND = {};
const STU_HEAD = {};
/* ---------- 二十八宿 · 七政 ---------- */
function stuPlanets(C) {
  const R = C.R,
    A = R.astro;
  if (!A) return [];
  const out = A.planets.slice(0, 7).map((p) => ({
    n: p.n,
    lon: p.lon,
    g: AS_INFO[p.n].g,
    wx: AS_INFO[p.n].wx,
    retro: p.retro,
    speed: p.speed,
    big: p.n === "太阳" || p.n === "月亮",
  }));
  if (STU.si) {
    const T = (R.t.jdUT - 2451545) / 36525,
      node = norm360(125.0445479 - 1934.1362891 * T),
      apo = norm360(83.3532465 + 4069.0137287 * T + 180);
    out.push(
      { n: "罗睺", lon: node, g: "☊", wx: 2, si: 1 },
      { n: "计都", lon: norm360(node + 180), g: "☋", wx: 2, si: 1 },
      { n: "月孛", lon: apo, g: "⚸", wx: 4, si: 1 },
    );
  }
  return out;
}
STU_REND.xiu = (g, r0, r1, C) => {
  const R = C.R;
  if (!R.astro) {
    noData(g, r1, "星象数据尚未生成");
    return;
  }
  const t = r1 - r0,
    year = R.t.civ.y,
    tb = xiuTable(year),
    st = xiuStart(year),
    aOf = (l) => 307 - norm360(l - st),
    pls = stuPlanets(C);
  const rx0 = r1 - t * 0.3,
    rs0 = rx0 - t * 0.2,
    sun = xiuOf(pls[0].lon, year).i,
    moon = xiuOf(pls[1].lon, year).i;
  tb.forEach((x) => {
    const aH = aOf(x.s),
      aL = aH - x.w,
      mid = (aH + aL) / 2,
      on = x.i === sun || x.i === moon;
    sSec(g, rx0, r1 - 2, aL, aH, {
      fill: SW[x.wx],
      op: on ? 0.55 : 0.2,
      cls: on ? "on" : "",
      hit: () => {
        const inn = pls.filter((p) => xiuOf(p.lon, year).i === x.i);
        stuInfo(
          `<h4 class="gl">${x.n}宿(${x.full})</h4><p class="rt">${x.si} · 宽 ${XIU_DEG[x.i]} 古度(约 ${x.w.toFixed(1)}°)。起点黄经 ${x.s.toFixed(1)}°。</p><p class="rt">${inn.length ? "此宿内有:" + inn.map((p) => `${p.n} ${xiuOf(p.lon, year).off.toFixed(1)}°`).join("、") : "此刻七政不在此宿。"}</p>`,
        );
      },
    });
    sTxt(
      g,
      (rx0 + r1) / 2,
      mid,
      x.n,
      clampF(Math.min(t * 0.12, ((((x.w * Math.PI) / 180) * (rx0 + r1)) / 2) * 0.8), 6.5, 16),
      { mode: "rad", b: on },
    );
  });
  const SG = [
    "降娄",
    "大梁",
    "实沈",
    "鹑首",
    "鹑火",
    "鹑尾",
    "寿星",
    "大火",
    "析木",
    "星纪",
    "玄枵",
    "娵訾",
  ];
  for (let i = 0; i < 12; i++) {
    const aH = aOf(i * 30),
      aL = aH - 30;
    sSec(g, rs0, rx0 - 2, aL, aH, {
      cls: "alt" + (i % 2),
      hit: () =>
        stuInfo(
          `<h4 class="gl">${AS_SIGN[i][0]}宫 · ${SG[i]}</h4><p class="rt">黄经 ${i * 30}°–${i * 30 + 30}°。此处为回归黄道十二宫与中国十二次的对应,与按宿度划分的 28 宿不是同一套边界。</p>`,
        ),
    });
    sTxt(
      g,
      (rs0 + rx0) / 2,
      (aH + aL) / 2,
      `${AS_SIGN[i][1]} ${SG[i]}`,
      clampF(t * 0.07, 6.5, 12),
      { mode: "tan", cls: "dim" },
    );
  }
  ringLine(g, rs0);
  // 七政:防重叠分道
  const lanes = [],
    ord = pls.map((p, i) => ({ p, i, a: aOf(p.lon) })).sort((x, y) => x.a - y.a),
    rin = r0 + t * 0.06,
    rout = rs0 - t * 0.05,
    nl = Math.max(2, Math.floor((rout - rin) / (t * 0.075)));
  ord.forEach((o) => {
    let k = 0;
    while (
      k < nl &&
      (lanes[k] || []).some((a) => Math.abs(a - o.a) < 6.5 * (1 + Math.abs(k - 0) * 0))
    )
      k++;
    k = Math.min(k, nl - 1);
    (lanes[k] = lanes[k] || []).push(o.a);
    o.k = k;
  });
  ord.forEach((o) => {
    const p = o.p,
      r = rout - (o.k * (rout - rin)) / nl - t * 0.03,
      [x, y] = sp(r, o.a),
      [x2, y2] = sp(rs0, o.a),
      xo = xiuOf(p.lon, year),
      big = p.big;
    E("line", { x1: f1(x), y1: f1(y), x2: f1(x2), y2: f1(y2), class: "stu-lead" }, g);
    const gg = E("g", { class: "stu-hit stu-pl" }, g);
    gg.addEventListener("click", () =>
      stuInfo(
        `<h4 class="gl">${p.n}${p.retro ? "(逆行)" : ""}</h4><p class="rt">黄经 ${p.lon.toFixed(2)}°,落${xo.n}宿 ${xo.off.toFixed(1)}°,在${AS_SIGN[Math.floor(p.lon / 30) % 12][0]}宫。${p.si ? "<br>四余为平均位置的简化算法(罗睺取平均升交点,计都为其对点,月孛为平均远地点),与传统七政四余历法的算法与口径不同,仅作示意。" : ""}</p>`,
      ),
    );
    E(
      "circle",
      {
        cx: f1(x),
        cy: f1(y),
        r: big ? clampF(t * 0.045, 8, 15) : clampF(t * 0.036, 6.5, 12),
        fill: p.si ? "var(--panel2)" : SW[p.wx],
        "fill-opacity": p.si ? 1 : 0.9,
        class: "stu-pd",
        stroke: p.si ? SW[p.wx] : "none",
      },
      gg,
    );
    E(
      "text",
      {
        x: f1(x),
        y: f1(y),
        class: "stu-t pg",
        "font-size": f1((big ? clampF(t * 0.05, 9, 17) : clampF(t * 0.04, 7.5, 13)) * STU.fs),
        "text-anchor": "middle",
        "dominant-baseline": "central",
        fill: p.si ? SW[p.wx] : "#fff",
      },
      gg,
      p.g,
    );
    E("title", {}, gg, `${p.n} ${xo.n}宿${xo.off.toFixed(1)}°`);
  });
};
STU_HEAD.xiu = (C) => {
  const R = C.R;
  if (!R.astro) return "";
  const y = R.t.civ.y,
    a = xiuOf(R.astro.planets[0].lon, y),
    b = xiuOf(R.astro.planets[1].lon, y);
  return `日在${a.n}宿 · 月在${b.n}宿`;
};
/* ---------- 六十甲子 · 纳音 ---------- */
STU_REND.jz = (g, r0, r1, C) => {
  const R = C.R,
    t = r1 - r0,
    rn0 = r1 - t * 0.34,
    rg0 = rn0 - t * 0.42,
    mk = [];
  const pill = R.bz.pill.map((p) => ganzhiIdx(p.s, p.b)),
    n = nowBJ(),
    yIdx = (((n.y - 4) % 60) + 60) % 60,
    dIdx = dayInfo(n.y, n.m, n.d).dayIdx;
  let dyIdx = -1;
  try {
    const d = dayunTable(R.bz, R.deep),
      cur = dayunNow(R);
    if (cur >= 0) dyIdx = d[cur].idx;
  } catch (e) {}
  [
    ["年", pill[0]],
    ["月", pill[1]],
    ["日", pill[2]],
    ["时", pill[3]],
    ["运", dyIdx],
    ["岁", yIdx],
    ["今", dIdx],
  ].forEach(([l, i]) => {
    if (i >= 0) mk.push({ l, i });
  });
  for (let k = 0; k < 30; k++) {
    const a0 = 180 + k * 12,
      col = NY_WX(NAYIN[k]);
    sSec(g, rn0, r1 - 2, a0, a0 + 12, {
      fill: SW[col],
      op: 0.2,
      hit: () =>
        stuInfo(
          `<h4 class="gl">${NAYIN[k]}</h4><p class="rt">纳音五行属${"木火土金水"[col]}。同一纳音含两个相邻的甲子:${gz(2 * k)}、${gz(2 * k + 1)}。</p>`,
        ),
    });
    sTxt(g, (rn0 + r1) / 2, a0 + 6, NAYIN[k], clampF(t * 0.1, 7, 14), { mode: "rad" });
  }
  for (let i = 0; i < 60; i++) {
    const a0 = 180 + i * 6,
      gi = i % 10,
      zi = i % 12,
      hit = mk.filter((m) => m.i === i);
    sSec(g, rg0, rn0 - 2, a0, a0 + 6, {
      fill: hit.length ? "var(--gold)" : SW[GAN_WX[gi]],
      op: hit.length ? 0.5 : 0.1,
      hit: () =>
        stuInfo(
          `<h4 class="gl">${gz(i)} · 第 ${i + 1} 位</h4><p class="rt">纳音 ${NAYIN[i >> 1]}。${hit.length ? "<br>此刻对应:" + hit.map((m) => ({ 年: "年柱", 月: "月柱", 日: "日柱", 时: "时柱", 运: "当前大运", 岁: "今年流年", 今: "今日" })[m.l]).join("、") : ""}</p>`,
        ),
    });
    sTxt(g, (rg0 + rn0) / 2 + t * 0.015, a0 + 3, GAN[gi], clampF(t * 0.075, 6.5, 11), {
      mode: "rad",
      fill: SW[GAN_WX[gi]],
    });
    sTxt(g, (rg0 + rn0) / 2 - t * 0.075, a0 + 3, ZHI[zi], clampF(t * 0.075, 6.5, 11), {
      mode: "rad",
      fill: SW[ZHI_WX[zi]],
    });
  }
  ringLine(g, rg0);
  mk.forEach((m, j) => {
    const a = 180 + m.i * 6 + 3,
      [x, y] = sp(rg0 - t * 0.07, a);
    E("circle", { cx: f1(x), cy: f1(y), r: clampF(t * 0.04, 6, 11), class: "stu-mk m" + m.l }, g);
    sTxt(g, rg0 - t * 0.07, a, m.l, clampF(t * 0.05, 6.5, 11), { cls: "mkt", fill: "#fff" });
  });
};
STU_HEAD.jz = (C) => "四柱 " + C.R.bz.pill.map((p) => GAN[p.s] + ZHI[p.b]).join(" ");
/* ---------- 先天后天八卦与六十四卦圆图 ---------- */
const GUA_XT = { 1: 0, 2: 315, 3: 270, 4: 225, 5: 45, 6: 90, 7: 135, 8: 180 },
  GUA_HT = { 3: 0, 8: 45, 2: 90, 1: 135, 6: 180, 7: 225, 4: 270, 5: 315 }; // 先天/后天:卦序(先天数)→角度
const GUA_YT = { 3: 0, 8: 45, 2: 90, 1: 135, 6: 180, 7: 225, 4: 270, 5: 315 };
const GUA_GONG = [
  ["乾", "姤", "遯", "否", "观", "剥", "晋", "大有"],
  ["兑", "困", "萃", "咸", "蹇", "谦", "小过", "归妹"],
  ["离", "旅", "鼎", "未济", "蒙", "涣", "讼", "同人"],
  ["震", "豫", "解", "恒", "升", "井", "大过", "随"],
  ["巽", "小畜", "家人", "益", "无妄", "噬嗑", "颐", "蛊"],
  ["坎", "节", "屯", "既济", "革", "丰", "明夷", "师"],
  ["艮", "贲", "大畜", "损", "睽", "履", "中孚", "渐"],
  ["坤", "复", "临", "泰", "大壮", "夬", "需", "比"],
];
function guaIdToUL(id) {
  const ln = id.split("").map(Number),
    tri = (a) =>
      TRI.findIndex((x, i) => x && x.l && x.l[0] === a[0] && x.l[1] === a[1] && x.l[2] === a[2]);
  return [tri(ln.slice(3)), tri(ln.slice(0, 3))];
}
function guaRing(mode) {
  mode = mode || (typeof STU !== "undefined" && STU.guaOrd) || "xt";
  if (mode === "wen") return ZY_DATA.map((r) => guaIdToUL(r[0]));
  if (mode === "gong") {
    const byName = {};
    ZY_DATA.forEach((r) => {
      byName[r[1]] = r[0];
    });
    return GUA_GONG.flat().map((n) => guaIdToUL(byName[n]));
  }
  const lo1 = [4, 3, 2, 1],
    lo2 = [5, 6, 7, 8],
    ups1 = [8, 7, 6, 5, 4, 3, 2, 1],
    ups2 = [1, 2, 3, 4, 5, 6, 7, 8],
    out = [];
  lo1.forEach((l) => ups1.forEach((u) => out.push([u, l])));
  lo2.forEach((l) => ups2.forEach((u) => out.push([u, l])));
  return out;
}
STU_REND.gua = (g, r0, r1, C) => {
  const R = C.R,
    t = r1 - r0,
    hexes = guaRing(),
    rb0 = r1 - t * 0.52,
    rx0 = rb0 - t * 0.26,
    rh0 = rx0 - t * 0.22,
    mark = {};
  try {
    const m = R.mh;
    mark[m.ben.lines.join("")] = "本";
    mark[m.hu.lines.join("")] = mark[m.hu.lines.join("")] || "互";
    mark[m.bian.lines.join("")] = mark[m.bian.lines.join("")] || "变";
  } catch (e) {}
  hexes.forEach(([u, l], k) => {
    const lines = hexFromTri(u, l),
      id = lines.join(""),
      z = ZY_BY[id],
      a0 = 180 + k * 5.625,
      am = a0 + 2.8125,
      mk = mark[id];
    sSec(g, rb0, r1 - 2, a0, a0 + 5.625, {
      cls: mk ? "on" : "",
      fill: mk ? "var(--red)" : undefined,
      op: mk ? 0.28 : 0.06,
      hit: () =>
        stuInfo(
          `<h4 class="gl">${z.name}卦 · 第 ${hexInfo(lines).kw} 卦</h4><p class="rt">${hexInfo(lines).name}${mk ? " · 梅花" + mk + "卦" : ""}</p><p class="rt">${esc(z.gua)}</p><p class="rt dim sm">${esc(z.xiang)}</p><button type="button" class="gbtn sm" data-zy="${id}">查看周易原文</button>`,
        ),
    });
    sLines(
      g,
      lines,
      rb0 + t * 0.015,
      rb0 + t * 0.015 + t * 0.27,
      am,
      2.15,
      mk ? "var(--red)" : "var(--ink)",
    );
    sTxt(g, r1 - t * 0.115, am, z.name, clampF(t * 0.085, 6, 13), { mode: "rad", b: !!mk });
  });
  ringLine(g, rb0);
  [
    [GUA_XT, "先天", rx0, rb0 - 2],
    [GUA_HT, "后天", rh0, rx0 - 2],
  ].forEach(([M, nm, ra, rb]) => {
    Object.entries(M).forEach(([ti, a]) => {
      ti = +ti;
      const T = TRI[ti],
        am = a;
      sSec(g, ra, rb, am - 22.5, am + 22.5, {
        fill: SW[T.wx],
        op: 0.16,
        hit: () =>
          stuInfo(
            `<h4 class="gl">${T.n}(${T.img})· ${nm}八卦</h4><p class="rt">五行属${"木火土金水"[T.wx]}。${nm === "先天" ? "先天八卦:乾南坤北、离东坎西,讲对待与阴阳消长。" : "后天八卦:离南坎北、震东兑西,讲流行与方位时令,是风水、奇门常用的方位体系。"}</p>`,
          ),
      });
      sLines(g, T.l, ra + (rb - ra) * 0.1, ra + (rb - ra) * 0.52, am, 13, "var(--ink)");
      sTxt(g, ra + (rb - ra) * 0.76, am, T.n + " " + T.img, clampF((rb - ra) * 0.22, 7, 14), {
        b: 1,
      });
    });
    sTxt(g, (ra + rb) / 2 - (rb - ra) * 0.46, 180 + 0.01, "", 1, {});
    ringLine(g, ra);
  });
  sTxt(g, rx0 - t * 0.005, 0, "先天", 9, { cls: "dim", mode: "tan" });
  sTxt(g, rh0 - t * 0.005, 0, "后天", 9, { cls: "dim", mode: "tan" });
};
STU_HEAD.gua = (C) => {
  try {
    const m = C.R.mh;
    return `梅花:本${m.ben.name.slice(-2)} 互${m.hu.name.slice(-2)} 变${m.bian.name.slice(-2)}`;
  } catch (e) {
    return "";
  }
};
/* ---------- 十二辟卦 · 月令 ---------- */
const BG_LIST = [
  [0, "复", "100000", "十一月", "大雪 冬至"],
  [1, "临", "110000", "十二月", "小寒 大寒"],
  [2, "泰", "111000", "正月", "立春 雨水"],
  [3, "大壮", "111100", "二月", "惊蛰 春分"],
  [4, "夬", "111110", "三月", "清明 谷雨"],
  [5, "乾", "111111", "四月", "立夏 小满"],
  [6, "姤", "011111", "五月", "芒种 夏至"],
  [7, "遁", "001111", "六月", "小暑 大暑"],
  [8, "否", "000111", "七月", "立秋 处暑"],
  [9, "观", "000011", "八月", "白露 秋分"],
  [10, "剥", "000001", "九月", "寒露 霜降"],
  [11, "坤", "000000", "十月", "立冬 小雪"],
];
STU_REND.bg = (g, r0, r1, C) => {
  const R = C.R,
    t = r1 - r0,
    mb = R.bz.pill[1].b;
  BG_LIST.forEach(([b, nm, ls, mo, jq]) => {
    const a0 = 180 + b * 30,
      am = a0 + 15,
      on = b === mb,
      lines = ls.split("").map(Number),
      yang = lines.reduce((x, y) => x + y, 0);
    sSec(g, r0, r1 - 2, a0, a0 + 30, {
      fill: on ? "var(--gold)" : SW[b % 2 ? 3 : 2],
      op: on ? 0.4 : 0.1,
      cls: on ? "on" : "",
      hit: () =>
        stuInfo(
          `<h4 class="gl">${nm}卦 · ${ZHI[b]}月(${mo})</h4><p class="rt">十二辟卦(又称十二消息卦)把一年的阴阳消长配成十二个卦:阳爻自下而上渐长,为“息”;阴爻渐长,为“消”。本卦 ${yang} 阳 ${6 - yang} 阴,管${ZHI[b]}月,节气:${jq}。${on ? "<br><b>此刻的月建正在此月。</b>" : ""}</p><button type="button" class="gbtn sm" data-zy="${ls}">查看周易原文</button>`,
        ),
    });
    sLines(
      g,
      lines,
      r0 + t * 0.34,
      r0 + t * 0.34 + t * 0.3,
      am,
      10,
      on ? "var(--red)" : "var(--ink)",
    );
    sTxt(g, r1 - t * 0.1, am, nm, clampF(t * 0.16, 8, 17), { b: on });
    sTxt(g, r0 + t * 0.22, am, `${ZHI[b]}月 · ${mo}`, clampF(t * 0.085, 6, 11), {
      mode: "tan",
      cls: "dim",
    });
    sTxt(g, r0 + t * 0.1, am, jq, clampF(t * 0.07, 5.5, 9.5), { mode: "tan", cls: "dim" });
  });
};
STU_HEAD.bg = (C) => {
  const b = C.R.bz.pill[1].b,
    x = BG_LIST[b];
  return `月建${ZHI[b]}月 · 辟卦「${x[1]}」`;
};
/* ---------- 紫微十二宫 ---------- */
STU_REND.zw = (g, r0, r1, C) => {
  const R = C.Rb || C.R,
    zw = R.zw;
  if (!zw || !zw.pal) {
    noData(g, r1, "紫微盘尚未生成");
    return;
  }
  const t = r1 - r0,
    sel = STU.sel.zw;
  zw.pal.forEach((p) => {
    const a0 = 180 + 30 * p.b,
      am = a0 + 15,
      on = sel === p.b,
      related = sel != null && [0, 4, 6, 8].some((d) => (sel + d) % 12 === p.b);
    sSec(g, r0, r1 - 2, a0, a0 + 30, {
      fill: p.isMing ? "var(--red)" : "var(--gold)",
      op: p.isMing ? 0.3 : related ? 0.2 : 0.07,
      cls: on ? "on" : "",
      hit: () => {
        STU.sel.zw = STU.sel.zw === p.b ? null : p.b;
        studioRender();
        stuInfo(zwInfo(zw, p));
      },
    });
    sTxt(g, r1 - t * 0.075, am, `${p.name}${p.isShen ? "·身" : ""}`, clampF(t * 0.095, 7, 14), {
      b: 1,
      fill: p.isMing ? "var(--red)" : "var(--gold2)",
      mode: "tan",
    });
    sTxt(g, r1 - t * 0.16, am, GAN[p.stem] + ZHI[p.b], clampF(t * 0.07, 6.5, 11), {
      cls: "dim",
      mode: "tan",
    });
    const ms = p.stars.filter((s) => s.t === "main").slice(0, 3);
    ms.forEach((s, i) =>
      sTxt(
        g,
        r1 - t * (0.28 + i * 0.12),
        am,
        s.n + (s.h ? "·" + s.h : ""),
        clampF(t * 0.085, 6.5, 13),
        {
          fill: s.h === "忌" ? "var(--bad)" : s.h === "禄" ? "var(--good)" : "var(--ink)",
          mode: "tan",
          b: 1,
        },
      ),
    );
    if (!ms.length)
      sTxt(g, r1 - t * 0.28, am, "(借对宫)", clampF(t * 0.07, 6, 10), { cls: "dim", mode: "tan" });
    sTxt(g, r0 + t * 0.17, am, p.dx ? `${p.dx[0]}–${p.dx[1]}` : "", clampF(t * 0.065, 6, 10), {
      cls: "dim",
      mode: "tan",
    });
    sTxt(g, r0 + t * 0.07, am, p.cs || "", clampF(t * 0.055, 5.5, 9), { cls: "dim", mode: "tan" });
  });
  if (sel != null) {
    const pts = [0, 4, 8].map((d) => sp((r0 + r1) / 2, 180 + 30 * ((sel + d) % 12) + 15)),
      opp = sp((r0 + r1) / 2, 180 + 30 * ((sel + 6) % 12) + 15);
    E(
      "polygon",
      { points: pts.map((p) => f1(p[0]) + "," + f1(p[1])).join(" "), class: "stu-tri" },
      g,
    );
    const me = sp((r0 + r1) / 2, 180 + 30 * sel + 15);
    E(
      "line",
      { x1: f1(me[0]), y1: f1(me[1]), x2: f1(opp[0]), y2: f1(opp[1]), class: "stu-tri" },
      g,
    );
  }
};
function zwInfo(zw, p) {
  const ms = p.stars
    .map((s) => s.n + (s.br ? "(" + s.br + ")" : "") + (s.h ? "化" + s.h : ""))
    .join("、");
  return `<h4 class="gl">${p.name}宫 · ${GAN[p.stem]}${ZHI[p.b]}</h4><p class="rt">星曜:${esc(ms) || "无主星"}${(p.adj || []).length ? "<br>辅杂曜:" + p.adj.join("、") : ""}</p><p class="rt dim sm">大限 ${p.dx ? p.dx.join("–") : "—"} · 长生 ${p.cs || "—"} · 博士 ${p.boshi || "—"}<br>已高亮三方四正(再点取消)。更完整的解读见「紫微斗数」页。</p>`;
}
STU_HEAD.zw = (C) => {
  const z = C.R.zw;
  if (!z || !z.pal) return "";
  const m = z.pal.find((p) => p.isMing);
  return m ? `命宫在${ZHI[m.b]}` : "";
};
/* ---------- 大六壬 · 天地盘 ---------- */
const LR_GOOD = ["贵人", "青龙", "六合", "太常", "太阴", "天后"];
STU_REND.lr = (g, r0, r1, C) => {
  const R = C.R;
  let lr = R.lr;
  try {
    lr = lr || liuren(R.bz.dayIdx, R.bz.pill[3].b, liurenYueJiang(R.t.lon));
  } catch (e) {}
  if (!lr) {
    noData(g, r1, "六壬盘尚未生成");
    return;
  }
  const t = r1 - r0,
    rg0 = r1 - t * 0.2,
    rs0 = rg0 - t * 0.3,
    rj0 = rs0 - t * 0.24,
    off = ((((lr.hb - lr.zj) % 12) + 12) % 12) * 30;
  const chu = lr.chu.map((c) => c.z),
    lab = ["初", "中", "末"];
  for (let p = 0; p < 12; p++) {
    const a0 = 180 + 30 * p,
      am = a0 + 15,
      k = lr.kong.includes(p);
    sSec(g, rg0, r1 - 2, a0, a0 + 30, { cls: "alt" + (p % 2), hit: () => stuInfo(lrInfo(lr, p)) });
    sTxt(g, (rg0 + r1) / 2, am, ZHI[p], clampF(t * 0.14, 8, 18), { b: 1, fill: SW[ZHI_WX[p]] });
    if (k) sTxt(g, r1 - t * 0.035, am, "空", clampF(t * 0.06, 6, 10), { fill: "var(--bad)" });
    if (p === lr.yiMa)
      sTxt(g, rg0 + t * 0.035, am, "马", clampF(t * 0.06, 6, 10), { fill: "var(--gold)" });
  }
  ringLine(g, rg0);
  const tg = E("g", { class: "stu-tian" }, g);
  tg.style.setProperty("--off", -off + "deg");
  for (let p = 0; p < 12; p++) {
    const s = lr.sky[p],
      a0 = 180 + 30 * p,
      am = a0 + 15,
      gen = lr.gen[s],
      good = LR_GOOD.includes(gen),
      ci = chu.indexOf(s);
    sSec(tg, rj0, rg0 - 2, a0, a0 + 30, {
      fill: good ? "var(--good)" : "var(--bad)",
      op: ci >= 0 ? 0.38 : 0.1,
      cls: ci >= 0 ? "on" : "",
      hit: () => stuInfo(lrInfo(lr, p)),
    });
    sTxt(tg, rg0 - t * 0.1, am, ZHI[s] + (lr.dun && lr.dun[s] ? "" : ""), clampF(t * 0.12, 7, 16), {
      b: 1,
      fill: SW[ZHI_WX[s]],
      mode: "tan",
    });
    sTxt(tg, rg0 - t * 0.22, am, gen, clampF(t * 0.085, 6, 12), {
      fill: good ? "var(--good)" : "var(--bad)",
      mode: "tan",
    });
    if (lr.dun && lr.dun[s])
      sTxt(tg, rj0 + t * 0.04, am, "遁" + lr.dun[s], clampF(t * 0.055, 5.5, 9), {
        cls: "dim",
        mode: "tan",
      });
    if (ci >= 0) sTxt(tg, rj0 - t * 0.0, am, "", 1);
  }
  ringLine(g, rj0);
  // 日干、日支所在地盘位置
  const dgp = [2, 5, 5, 8, 5, 8, 11, 2, 2, 5][lr.dg % 10]; // 十干寄宫:甲寅乙辰丙巳丁未戊巳己未庚申辛戌壬亥癸丑
  const JG = [2, 4, 5, 7, 5, 7, 8, 10, 11, 1][lr.dg],
    a = 180 + 30 * JG + 15,
    [x, y] = sp(r1 - t * 0.3, a);
  E("circle", { cx: f1(x), cy: f1(y), r: clampF(t * 0.05, 5, 9), class: "stu-mk mA" }, g);
  sTxt(g, r1 - t * 0.3, a, "干", clampF(t * 0.045, 5, 8), { fill: "#fff" });
  const a2 = 180 + 30 * lr.dz + 15,
    [x2, y2] = sp(r1 - t * 0.3, a2);
  E("circle", { cx: f1(x2), cy: f1(y2), r: clampF(t * 0.05, 5, 9), class: "stu-mk mB" }, g);
  sTxt(g, r1 - t * 0.3, a2, "支", clampF(t * 0.045, 5, 8), { fill: "#fff" });
  // 三传标记(标在天盘支所在位置)
  chu.forEach((z, i) => {
    const p = lr.sky.indexOf(z),
      aa = 180 + 30 * p + 15,
      [xx, yy] = sp(rs0 - t * 0.02, aa);
    E("circle", { cx: f1(xx), cy: f1(yy), r: clampF(t * 0.05, 6, 10), class: "stu-mk mC" }, g);
    sTxt(g, rs0 - t * 0.02, aa, lab[i], clampF(t * 0.05, 6, 10), { fill: "#fff" });
  });
  if (r0 < r1 * 0.2 || true) {
    const cy = -t * 0; /* 盘心:格局 */
  }
  tg.setAttribute("data-off", off);
};
function lrInfo(lr, p) {
  const s = lr.sky[p],
    gen = lr.gen[s];
  return `<h4 class="gl">地盘 ${ZHI[p]} · 天盘 ${ZHI[s]}</h4><p class="rt">天将:${gen}${lr.dun && lr.dun[s] ? ` · 遁干 ${lr.dun[s]}` : ""}${lr.kong.includes(p) ? " · 此位逢旬空" : ""}。</p><p class="rt dim sm">${lr.ge}课 · ${lr.sub}。月将 ${ZHI[lr.zj]}(${lr.jiangName})加临占时 ${ZHI[lr.hb]},天盘整体顺转 ${(((lr.hb - lr.zj) % 12) + 12) % 12} 位。三传:${lr.chu.map((c) => ZHI[c.z] + "(" + c.gen + ")").join(" → ")}。详见「大六壬」页。</p>`;
}
STU_HEAD.lr = (C) => {
  const lr = C.R.lr;
  return lr ? `${lr.ge} · 月将${ZHI[lr.zj]}加${ZHI[lr.hb]}` : "";
};
/* ---------- 奇门九宫圆盘 ---------- */
const QM_ANG = { 9: 0, 2: 45, 7: 90, 6: 135, 1: 180, 8: 225, 3: 270, 4: 315 },
  QM_GOOD_DOOR = "开休生",
  QM_MID_DOOR = "景杜";
STU_REND.qm = (g, r0, r1, C) => {
  const R = C.R,
    q = R.qm;
  if (!q || !q.cells) {
    noData(g, r1, "奇门盘尚未生成");
    return;
  }
  const t = r1 - r0,
    rb = [r1, r1 - t * 0.22, r1 - t * 0.5, r1 - t * 0.76, r0 + (r0 < 8 ? 0 : 0)];
  Object.entries(QM_ANG).forEach(([ps, a]) => {
    const p = +ps,
      c = q.cells[p];
    if (!c) return;
    const a0 = a - 22.5,
      sc = c.score || 0,
      doorCol = QM_GOOD_DOOR.includes(c.door)
        ? "var(--good)"
        : QM_MID_DOOR.includes(c.door)
          ? "var(--gold)"
          : "var(--bad)",
      zf = c.star === q.zfStar,
      zs = c.door === q.zsDoor;
    sSec(g, r0, r1 - 2, a0, a0 + 45, {
      fill: sc >= 3 ? "var(--good)" : sc <= -3 ? "var(--bad)" : "var(--gold)",
      op: Math.min(0.32, 0.06 + Math.abs(sc) * 0.03),
      hit: () => stuInfo(qmInfo(q, p, c)),
    });
    sTxt(g, (rb[0] + rb[1]) / 2, a, c.god || "", clampF(t * 0.085, 6.5, 13), {
      mode: "tan",
      cls: "dim",
    });
    sTxt(
      g,
      (rb[1] + rb[2]) / 2 + t * 0.01,
      a,
      (c.star || "") + (c.hs ? " " + c.hs : ""),
      clampF(t * 0.095, 7, 14),
      { mode: "tan", b: zf, fill: zf ? "var(--red)" : "var(--ink)" },
    );
    sTxt(g, (rb[2] + rb[3]) / 2, a, (c.door || "") + "门", clampF(t * 0.115, 8, 16), {
      mode: "tan",
      b: 1,
      fill: doorCol,
    });
    sTxt(
      g,
      Math.max(r0 + t * 0.03, rb[3] - t * 0.085),
      a,
      c.earth || "",
      clampF(t * 0.085, 6.5, 13),
      { mode: "tan", cls: "dim" },
    );
    if (zs) {
      const [x, y] = sp((rb[2] + rb[3]) / 2, a - 12);
      E("circle", { cx: f1(x), cy: f1(y), r: 3, fill: "var(--red)" }, g);
    }
    (c.tags || []).forEach((tg, i) => {
      if (tg.n === "空亡" || tg.n === "马星" || tg.n === "驿马")
        sTxt(
          g,
          r1 - t * 0.035,
          a - 14 + i * 8,
          tg.n === "空亡" ? "空" : "马",
          clampF(t * 0.05, 5.5, 9),
          { fill: tg.n === "空亡" ? "var(--bad)" : "var(--gold)" },
        );
    });
  });
  for (let i = 0; i < 8; i++) {
    const [x1, y1] = sp(r0, 22.5 + 45 * i),
      [x2, y2] = sp(r1, 22.5 + 45 * i);
    E("line", { x1: f1(x1), y1: f1(y1), x2: f1(x2), y2: f1(y2), class: "stu-rl" }, g);
  }
  [1, 2, 3].forEach((i) => ringLine(g, rb[i]));
  if (r0 < r1 * 0.12) {
    E(
      "circle",
      { r: f1(t * 0.105), fill: "var(--panel)", "fill-opacity": 0.95, stroke: "var(--line2)" },
      g,
    );
    sTxt(g, 0, 0, (q.yang ? "阳" : "阴") + "遁" + q.ju + "局", clampF(t * 0.032, 7, 12), {
      b: 1,
      fill: "var(--gold2)",
    });
  }
};
function qmInfo(q, p, c) {
  return `<h4 class="gl">${PNAME[p]}${PNUM[p]}宫(${PDIR[p]})</h4><p class="rt">${c.god || ""} · ${c.star || ""}星(天盘干 ${c.hs || "—"}) · ${c.door || ""}门 · 地盘干 ${c.earth || "—"}</p><p class="rt">${(c.geju || []).map((x) => x.n).join("、") || "无特殊格局"};综合分 ${c.score || 0}。${(c.tags || []).map((x) => x.n).join("、")}</p><p class="rt dim sm">${q.yang ? "阳" : "阴"}遁${q.ju}局,值符星 ${q.zfStar || "—"},值使门 ${q.zsDoor || "—"}。外圈神 → 星干 → 门 → 地盘干。详见「奇门遁甲」页。</p>`;
}
STU_HEAD.qm = (C) => {
  const q = C.R.qm;
  return q
    ? `${q.yang ? "阳" : "阴"}遁${q.ju}局 · 值符${q.zfStar || ""} 值使${q.zsDoor || ""}`
    : "";
};
/* ---------- 河图 · 洛书 ---------- */
function dotsAt(g, r, a, n, fill, dr) {
  const t = (a * Math.PI) / 180,
    tx = Math.cos(t),
    ty = Math.sin(t),
    [cx, cy] = sp(r, a);
  for (let i = 0; i < n; i++) {
    const k = (i - (n - 1) / 2) * dr * 2.5;
    E(
      "circle",
      {
        cx: f1(cx + tx * k),
        cy: f1(cy + ty * k),
        r: f1(dr),
        class: "stu-dot",
        fill,
        stroke: "var(--ink)",
      },
      g,
    );
  }
}
STU_REND.hl = (g, r0, r1, C) => {
  const R = C.R,
    t = r1 - r0,
    rl0 = r1 - t * 0.46,
    fly = xkFly(xkYearStar(R.bz.yearNum || R.t.civ.y), true),
    dr = clampF(t * 0.028, 3, 8),
    WH = "var(--stu-w,#f3ead2)",
    BK = "var(--stu-b,#1b1810)";
  const HAN = { 9: "离", 2: "坤", 7: "兑", 6: "乾", 1: "坎", 8: "艮", 3: "震", 4: "巽" };
  Object.entries(QM_ANG).forEach(([ps, a]) => {
    const p = +ps;
    sSec(g, rl0, r1 - 2, a - 22.5, a + 22.5, {
      fill: SW[PWX[p]],
      op: 0.18,
      hit: () =>
        stuInfo(
          `<h4 class="gl">洛书 ${p} · ${HAN[p]}宫(${PDIR[p]})</h4><p class="rt">洛书九宫:戴九履一、左三右七、二四为肩、六八为足、五居中央;纵横斜三数之和皆为 15。本宫五行属${"木火土金水"[PWX[p]]}。今年(${R.bz.yearNum || R.t.civ.y})飞到此宫的流年星为 ${fly[p]}。</p>`,
        ),
    });
    sTxt(g, r1 - t * 0.15, a, String(p), clampF(t * 0.2, 10, 26), { b: 1, fill: SW[PWX[p]] });
    sTxt(g, r1 - t * 0.3, a, HAN[p] + " " + PDIR[p], clampF(t * 0.085, 6.5, 12), {
      cls: "dim",
      mode: "tan",
    });
    sTxt(g, rl0 + t * 0.06, a, "年" + fly[p], clampF(t * 0.075, 6, 11), {
      fill: "var(--gold)",
      b: 1,
      mode: "tan",
    });
  });
  for (let i = 0; i < 8; i++) {
    const [x1, y1] = sp(rl0, 22.5 + 45 * i),
      [x2, y2] = sp(r1, 22.5 + 45 * i);
    E("line", { x1: f1(x1), y1: f1(y1), x2: f1(x2), y2: f1(y2), class: "stu-rl" }, g);
  }
  ringLine(g, rl0);
  // 河图:生数近、成数远
  const hr0 = r0 + t * 0.06,
    hr1 = rl0 - t * 0.06,
    rA = hr0 + (hr1 - hr0) * 0.3,
    rB = hr0 + (hr1 - hr0) * 0.72,
    tag = (a, s) =>
      sTxt(g, hr1 + t * 0.012, a, s, clampF(t * 0.06, 6, 10), { cls: "dim", mode: "tan" });
  [
    [180, 1, 6, "水"],
    [0, 2, 7, "火"],
    [270, 3, 8, "木"],
    [90, 4, 9, "金"],
  ].forEach(([a, n1, n2, wx]) => {
    dotsAt(g, r0 > 5 ? rA : Math.max(rA, t * 0.22), a, n1, n1 % 2 ? WH : BK, dr);
    dotsAt(g, r0 > 5 ? rB : Math.max(rB, t * 0.34), a, n2, n2 % 2 ? WH : BK, dr);
    tag(a, `${n1}·${n2} ${wx}`);
  });
  if (r0 < 8) {
    dotsAt(g, 0, 0, 5, WH, dr);
    dotsAt(g, t * 0.11, 90, 10, BK, dr * 0.8);
  }
  const hit = E("circle", { r: Math.max(10, rl0), fill: "transparent", class: "stu-hit" }, g);
  hit.setAttribute("pointer-events", "none");
};
STU_HEAD.hl = (C) => {
  const y = C.R.bz.yearNum || C.R.t.civ.y;
  return `${y}年流年中宫 ${xkYearStar(y)}`;
};

/* ================= 盘库:居中的巨大圆盘 + 每类盘独立开关 ================= */
const STK = "tianjipan.studio.v1";
const STU_DISKS = [
  {
    k: "xiu",
    n: "二十八宿 · 七政",
    w: 1.55,
    d: "二十八宿按古度分宽窄,日月五星按此刻黄经落位;可选含四余(罗睺、计都、月孛的平均位置)",
  },
  {
    k: "jz",
    n: "六十甲子 · 纳音",
    w: 1.25,
    d: "六十甲子与三十纳音一圈,标出四柱、当前大运、今年与今日",
  },
  {
    k: "gua",
    n: "先天后天八卦 · 六十四卦圆图",
    w: 2.0,
    d: "邵雍先天六十四卦圆图,内含先天、后天八卦两圈;标出梅花起卦的本、互、变卦",
  },
  { k: "bg", n: "十二辟卦 · 月令", w: 1.05, d: "十二消息卦配十二月:阳息阴消,标出当前月建" },
  {
    k: "zw",
    n: "紫微十二宫",
    w: 1.75,
    d: "十二宫、主星、四化、大限落在十二地支环上;点宫位高亮三方四正",
  },
  {
    k: "lr",
    n: "大六壬 · 天地盘",
    w: 1.7,
    d: "地盘十二支固定,天盘随月将加占时转动;标出十二天将、三传与空亡",
  },
  {
    k: "qm",
    n: "奇门九宫",
    w: 1.8,
    d: "八宫的八神、九星、八门与地盘干,按综合分着色;标出值符、值使与空亡",
  },
  { k: "hl", n: "河图 · 洛书", w: 1.25, d: "洛书九宫配流年飞星,河图生成数以黑白点表示" },
];
const STU_OL = [
  ["lp", "罗盘"],
  ["astro", "星象"],
  ["ppl", "人物"],
  ["bz", "命局"],
  ["sense", "感应"],
  ["gz", "干支"],
  ["yq", "气运"],
];
const STU_PRE = [
  ["星命盘", { xiu: 1, jz: 1, zw: 1, orig: 1 }],
  ["术数盘", { qm: 1, lr: 1, gua: 0, orig: 1 }],
  ["易学盘", { gua: 1, bg: 1, hl: 1, orig: 0 }],
  ["全部", { xiu: 1, jz: 1, gua: 1, bg: 1, zw: 1, lr: 1, qm: 1, hl: 1, orig: 1 }],
  ["仅原盘", { orig: 1 }],
];
const STU = {
  gest: "",
  pan: { x: 0, y: 0 },
  obs: { mode: "now", date: "", time: "" },
  guaOrd: "xt",
  rot: {},
  rotSel: "",
  rotSpd: 4,
  sfx: 1,
  sfxVol: 0.24,
  active: false,
  on: { orig: 1, xiu: 1, gua: 1, zw: 1, qm: 1 },
  solo: null,
  ol: { lp: 1 },
  si: 0,
  fs: 1,
  zoom: 1,
  sel: { zw: null },
  prevLayer: null,
  spin: false,
  infoMode: "auto",
  lastDerive: null,
  pendingSource: "",
};
(function () {
  try {
    const o = JSON.parse(localStorage.getItem(STK) || "null");
    if (o) {
      if (o.guaOrd) STU.guaOrd = o.guaOrd;
      Object.assign(STU.on, o.on || {});
      STU.ol = o.ol || STU.ol;
      STU.si = o.si || 0;
      STU.fs = o.fs || 1;
      STU.zoom = o.zoom || 1;
      /* v4 声音默认策略：首次升级到本版时强制启用机械声并把内部音量设为最大。
     此后用户若手动关闭或调低，则继续尊重并持久化用户选择。 */
      if ((+o.sfxPrefV || 0) >= 4) {
        STU.sfx = o.sfx === 0 ? 0 : 1;
        if (Number.isFinite(+o.sfxVol)) STU.sfxVol = Math.max(0.06, Math.min(0.24, +o.sfxVol));
      } else {
        STU.sfx = 1;
        STU.sfxVol = 0.24;
        o.sfx = 1;
        o.sfxVol = 0.24;
        o.sfxPrefV = 4;
        try {
          localStorage.setItem(STK, JSON.stringify(o));
        } catch (_) {}
      }
    }
  } catch (e) {}
})();
const stuSave = () => {
  try {
    localStorage.setItem(
      STK,
      JSON.stringify({
        guaOrd: STU.guaOrd,
        on: STU.on,
        ol: STU.ol,
        si: STU.si,
        fs: STU.fs,
        zoom: STU.zoom,
        sfx: STU.sfx,
        sfxVol: STU.sfxVol,
        sfxPrefV: 4,
      }),
    );
  } catch (e) {}
};

/* ================= v35 · 巨盘时空演算器 =================
   原则：把“盘面展示状态”和“可被历算验证的条件”分开。
   - 自动：环按真实盘面渲染；旋转角仅为视觉展示。
   - 手动：用户拨环选择中轴项目，但不作为硬约束。
   - 锁定：选中项目固定；其中有明确历算定义的项目可参加条件搜索。
   不把纯视觉环的任意角度伪装成传统算法输入。 */
const STU_WK = "tianjipan.studio.work.v1";
STU.work = {
  mode: "manual",
  locks: {},
  A: null,
  B: null,
  snaps: [],
  extra: { term: "", hour: "", phase: "" },
  range: 90,
  play: { on: false, step: "day" },
  track: "",
  searchToken: 0,
};
(function () {
  try {
    const o = JSON.parse(localStorage.getItem(STU_WK) || "null");
    if (o && typeof o === "object") {
      STU.work.mode = o.mode || "manual";
      STU.work.locks = o.locks || {};
      STU.work.A = o.A || null;
      STU.work.B = o.B || null;
      STU.work.snaps = Array.isArray(o.snaps) ? o.snaps.slice(0, 30) : [];
      STU.work.extra = Object.assign(STU.work.extra, o.extra || {});
      STU.work.range = +o.range || 90;
      STU.work.play.step = (o.play && o.play.step) || "day";
      STU.work.track = o.track || "";
    }
  } catch (_) {}
})();
function stuWorkSave() {
  try {
    localStorage.setItem(
      STU_WK,
      JSON.stringify({
        mode: STU.work.mode,
        locks: STU.work.locks,
        A: STU.work.A,
        B: STU.work.B,
        snaps: STU.work.snaps.slice(0, 30),
        extra: STU.work.extra,
        range: STU.work.range,
        play: { step: STU.work.play.step },
        track: STU.work.track,
      }),
    );
  } catch (_) {}
}
function stuA180(a) {
  a = ((((a + 180) % 360) + 360) % 360) - 180;
  return a;
}
function stuWorkSpec(k, r) {
  r = r || stuObsR() || R;
  const out = [];
  if (k === "xiu") {
    try {
      const y = r.t.civ.y,
        tb = xiuTable(y),
        st = xiuStart(y),
        aOf = (l) => 307 - norm360(l - st);
      tb.forEach((x) => {
        const aH = aOf(x.s),
          aL = aH - x.w;
        out.push({ i: x.i, a: (aH + aL) / 2, label: x.n + "宿", value: x.n, kind: "sunXiu" });
      });
    } catch (_) {}
    return out;
  }
  if (k === "jz") {
    for (let i = 0; i < 60; i++)
      out.push({ i, a: 183 + i * 6, label: gz(i), value: gz(i), kind: "dayGz" });
    return out;
  }
  if (k === "gua") {
    try {
      guaRing().forEach(([u, l], i) => {
        const id = hexFromTri(u, l).join(""),
          z = ZY_BY[id];
        out.push({
          i,
          a: 182.8125 + i * 5.625,
          label: (z ? z.name : "第" + (i + 1)) + "卦",
          value: id,
          kind: "visual",
        });
      });
    } catch (_) {}
    return out;
  }
  if (k === "bg") {
    BG_LIST.forEach(([b, nm]) =>
      out.push({
        i: b,
        a: 195 + b * 30,
        label: `${ZHI[b]}月·${nm}卦`,
        value: ZHI[b],
        kind: "monthBranch",
      }),
    );
    return out;
  }
  if (k === "zw") {
    const pal = (r && r.zw && r.zw.pal) || [];
    for (let b = 0; b < 12; b++) {
      const p = pal.find((x) => x.b === b);
      out.push({
        i: b,
        a: 195 + b * 30,
        label: p ? `${p.name}宫·${ZHI[b]}` : `${ZHI[b]}宫位`,
        value: b,
        kind: "visual",
      });
    }
    return out;
  }
  if (k === "lr") {
    for (let b = 0; b < 12; b++)
      out.push({ i: b, a: 195 + b * 30, label: `地盘${ZHI[b]}`, value: b, kind: "visual" });
    return out;
  }
  if (k === "qm" || k === "hl") {
    Object.entries(QM_ANG).forEach(([ps, a], i) => {
      const p = +ps;
      out.push({
        i,
        a,
        label: k === "qm" ? `${PNAME[p]}${PNUM[p]}宫` : `洛书${p}·${PDIR[p]}`,
        value: p,
        kind: "visual",
      });
    });
    return out;
  }
  return out;
}
function stuWorkRingSelection(k, r) {
  const rr = STU.rot[k] || { a: 0 },
    spec = stuWorkSpec(k, r);
  if (!spec.length) return null;
  let best = spec[0],
    bd = 999;
  spec.forEach((x) => {
    const d = Math.abs(stuA180(x.a + (rr.a || 0)));
    if (d < bd) {
      bd = d;
      best = x;
    }
  });
  return Object.assign({ dist: bd }, best);
}
function stuWorkSnapRing(k) {
  const r = STU.rot[k] || (STU.rot[k] = { a: 0, dir: 1, spin: false, v: STU.rotSpd }),
    s = stuWorkRingSelection(k);
  if (!s) return null;
  r.spin = false;
  r.a = (r.a - stuA180(s.a + r.a)) % 360;
  stuRotApply();
  return stuWorkRingSelection(k);
}
function stuWorkLockState(k) {
  return (STU.work.locks[k] && STU.work.locks[k].mode) || "auto";
}
function stuWorkCycleRing(k) {
  if (!k) return;
  const old = stuWorkLockState(k),
    next = old === "auto" ? "manual" : old === "manual" ? "lock" : "auto";
  if (next !== "auto")
    try {
      stuGestSet("rot");
    } catch (_) {}
  let o = STU.work.locks[k] || {};
  o.mode = next;
  if (next === "auto") {
    const r = STU.rot[k];
    if (r) {
      r.a = 0;
      r.spin = false;
    }
    delete o.label;
    delete o.value;
    delete o.kind;
  } else {
    if (next === "lock") stuWorkSnapRing(k);
    const s = stuWorkRingSelection(k);
    if (s) Object.assign(o, { label: s.label, value: s.value, kind: s.kind, index: s.i });
  }
  STU.work.locks[k] = o;
  stuWorkSave();
  stuRotApply();
  stuWorkRingUI();
  stuWorkRender();
  stuWorkVisualApply();
}
function stuWorkAfterRotate(k) {
  if (!k) return;
  let o = STU.work.locks[k] || { mode: "auto" };
  if (o.mode === "auto") o.mode = "manual";
  if (o.mode === "lock") stuWorkSnapRing(k);
  const s = stuWorkRingSelection(k);
  if (s) Object.assign(o, { label: s.label, value: s.value, kind: s.kind, index: s.i });
  STU.work.locks[k] = o;
  stuWorkSave();
  stuWorkRingUI();
  stuWorkRender();
}
function stuWorkRingUI() {
  STU_DISKS.forEach((d) => {
    const b = document.querySelector(`.stu-lock[data-lock="${d.k}"]`),
      sm = $("#stuCond-" + d.k),
      m = stuWorkLockState(d.k),
      s = stuWorkRingSelection(d.k);
    if (b) {
      b.className = "stu-lock " + (m === "lock" ? "locked" : m);
      b.textContent = m === "auto" ? "自" : m === "manual" ? "手" : "锁";
      b.title =
        m === "auto"
          ? "自动：点击切换为手动定盘"
          : m === "manual"
            ? "手动：点击锁定当前中轴项目"
            : "已锁定：点击恢复自动";
    }
    if (sm)
      sm.textContent =
        m === "auto" ? "自动" : `${m === "lock" ? "锁定" : "手动"} · ${s ? s.label : "—"}`;
  });
}
function stuWorkLocked() {
  return STU_DISKS.map((d) => {
    const o = STU.work.locks[d.k];
    if (!o || o.mode !== "lock") return null;
    const s = stuWorkRingSelection(d.k);
    if (s) Object.assign(o, { label: s.label, value: s.value, kind: s.kind, index: s.i });
    return { k: d.k, n: d.n, o };
  }).filter(Boolean);
}
function stuWorkLockChips() {
  const a = stuWorkLocked();
  return a.length
    ? `<div class="stu-cond-list">${a.map((x) => `<span class="stu-cond-chip lock">🔒 ${esc(x.n.split(" · ")[0])}：${esc(x.o.label || "—")}</span>`).join("")}</div>`
    : '<p class="stu-work-note">尚未锁定外环。拖动外环后，点该环右侧“手”切换到“锁”。</p>';
}
function stuWorkCoreObj(r) {
  if (!r || !r.t || !r.bz) return {};
  const c = r.t.civ || {},
    pl = (r.astro && r.astro.planets) || [],
    sun = pl.find((p) => p.n === "太阳"),
    moon = pl.find((p) => p.n === "月亮"),
    year = c.y || 2000;
  let sx = "",
    mx = "";
  try {
    if (sun) sx = xiuOf(sun.lon, year).n + "宿";
    if (moon) mx = xiuOf(moon.lon, year).n + "宿";
  } catch (_) {}
  const q = r.qm,
    lr = r.lr;
  return {
    时刻: `${c.y}-${f2(c.m)}-${f2(c.d)} ${f2(c.h)}:${f2(c.mi)}`,
    四柱: (r.bz.pill || []).map((p) => GAN[p.s] + ZHI[p.b]).join(" "),
    节气: TERMS[Math.floor(norm360(r.t.lon || 0) / 15) % 24] || "—",
    太阳宿: sx || "—",
    月亮宿: mx || "—",
    月相: r.astro && r.astro.moon ? r.astro.moon.name : "—",
    奇门: q ? `${q.yang ? "阳" : "阴"}遁${q.ju}局 · ${q.zfStar || ""}/${q.zsDoor || ""}` : "—",
    六壬: lr ? `${lr.ge} · 月将${ZHI[lr.zj]}加${ZHI[lr.hb]}` : "—",
    月建: r.bz && r.bz.pill && r.bz.pill[1] ? ZHI[r.bz.pill[1].b] : "—",
  };
}
function stuWorkConstraintEval(r) {
  const rows = [];
  stuWorkLocked().forEach((x) => {
    let actual = "—",
      ok = null;
    if (x.o.kind === "sunXiu") {
      const p = r.astro && r.astro.planets && r.astro.planets.find((p) => p.n === "太阳");
      if (p) {
        actual = xiuOf(p.lon, r.t.civ.y).n;
        ok = actual === x.o.value;
        actual += "宿";
      }
    } else if (x.o.kind === "dayGz") {
      actual = GAN[r.bz.pill[2].s] + ZHI[r.bz.pill[2].b];
      ok = actual === x.o.value;
    } else if (x.o.kind === "monthBranch") {
      actual = ZHI[r.bz.pill[1].b] + "月";
      ok = ZHI[r.bz.pill[1].b] === x.o.value;
    }
    rows.push({
      name: x.n,
      selected: x.o.label,
      actual,
      ok,
      searchable: ["sunXiu", "dayGz", "monthBranch"].includes(x.o.kind),
    });
  });
  return rows;
}
function stuWorkEvalHTML(r) {
  const a = stuWorkConstraintEval(r);
  if (!a.length) return '<p class="dim sm">当前没有锁定条件；本次按指定时刻正常推演。</p>';
  return `<div class="stu-mini"><h5>锁定条件校验</h5>${a.map((x) => `<p><b>${esc(x.name.split(" · ")[0])}</b>：选 ${esc(x.selected)}；盘面 ${esc(x.actual)} · ${x.ok === true ? '<span class="good">符合</span>' : x.ok === false ? '<span class="bad">不符</span>' : '<span class="dim">视觉参照</span>'}${x.searchable ? "" : " · 不参与时间反推"}</p>`).join("")}</div>`;
}
function stuWorkCiv(r) {
  const c = (r || stuObsR()).t.civ;
  return { y: c.y, m: c.m, d: c.d, h: c.h, mi: c.mi || 0, s: 0 };
}
function stuWorkSetCiv(c, source) {
  STU.obs.mode = "custom";
  STU.obs.date = `${c.y}-${f2(c.m)}-${f2(c.d)}`;
  STU.obs.time = `${f2(c.h)}:${f2(c.mi || 0)}`;
  STU.infoMode = "auto";
  STU_OBS_CACHE.k = "";
  if (STU.obsUI) STU.obsUI();
  studioRender();
  const r = stuObsR();
  stuDeriveInfo(r, source || "巨盘 · 手动定盘");
  return r;
}
function stuWorkManualCiv() {
  const d = $("#stuManD"),
    t = $("#stuManT");
  if (d && d.value && t && t.value) {
    const [y, m, dd] = d.value.split("-").map(Number),
      [h, mi] = t.value.split(":").map(Number);
    if (y >= 1901 && y <= 2099) return { y, m, d: dd, h, mi: mi || 0, s: 0 };
  }
  return stuWorkCiv(stuObsR());
}
function stuWorkApplyManual() {
  const c = stuWorkManualCiv(),
    r = stuWorkSetCiv(c, "巨盘 · 当前组合推演");
  stuInfo(
    `<div class="stu-info-head"><div><h4>当前组合推演</h4><small>时间条件按历算计算；锁定环中只有可验证项目作为条件校验，其余仅保留为盘面实验状态。</small></div><span class="stu-info-badge">组合</span></div>${stuInfoCore(r)}${stuWorkEvalHTML(r)}<div class="stu-work-actions"><button class="gbtn sm" type="button" data-chain="time">查看推导链</button><button class="gbtn sm" type="button" data-rules="1">查看规则口径</button></div>`,
  );
  stuWorkRender();
}
function stuWorkCapture(slot) {
  const r = stuObsR();
  const snap = {
    at: Date.now(),
    c: stuWorkCiv(r),
    core: stuWorkCoreObj(r),
    rings: {},
    locks: JSON.parse(JSON.stringify(STU.work.locks || {})),
    on: Object.assign({}, STU.on),
    ol: Object.assign({}, STU.ol),
  };
  STU_DISKS.forEach((d) => {
    const s = stuWorkRingSelection(d.k, r);
    snap.rings[d.k] = { a: (STU.rot[d.k] && STU.rot[d.k].a) || 0, label: s ? s.label : "—" };
  });
  STU.work[slot] = snap;
  stuWorkSave();
  stuWorkRender();
  toast(`已记录状态 ${slot}`);
}
function stuWorkCompare() {
  const A = STU.work.A,
    B = STU.work.B;
  if (!A || !B) {
    toast("请先分别记录 A 和 B");
    return;
  }
  const keys = [...new Set([...Object.keys(A.core || {}), ...Object.keys(B.core || {})])];
  const rows = keys
    .map((k) => {
      const a = A.core[k] || "—",
        b = B.core[k] || "—",
        diff = a !== b;
      return `<tr class="${diff ? "diff" : "same"}"><th>${esc(k)}</th><td>${esc(a)}</td><td>${esc(b)}</td></tr>`;
    })
    .join("");
  const rd = STU_DISKS.map((d) => {
    const a = A.rings[d.k] && A.rings[d.k].label,
      b = B.rings[d.k] && B.rings[d.k].label;
    return a !== b
      ? `<span class="stu-cond-chip lock">${esc(d.n.split(" · ")[0])}：${esc(a || "—")} → ${esc(b || "—")}</span>`
      : "";
  })
    .filter(Boolean)
    .join("");
  stuInfo(
    `<div class="stu-info-head"><div><h4>A / B 对照</h4><small>不变项自动降权；变化项保持高亮。巨盘对应外环也会用红色接缝提示。</small></div><span class="stu-info-badge">比较</span></div><table class="stu-compare-table"><thead><tr><th>项目</th><th>A</th><th>B</th></tr></thead><tbody>${rows}</tbody></table>${rd ? `<div class="stu-mini"><h5>环带差异</h5><div class="stu-cond-list">${rd}</div></div>` : ""}`,
  );
  stuWorkVisualApply();
}
function stuWorkSnapshotSave() {
  const r = stuObsR(),
    s = {
      id: "s" + Date.now().toString(36),
      name: "时空快照 " + stuWorkCoreObj(r).时刻,
      at: Date.now(),
      c: stuWorkCiv(r),
      core: stuWorkCoreObj(r),
      rings: {},
      locks: JSON.parse(JSON.stringify(STU.work.locks || {})),
      on: Object.assign({}, STU.on),
      ol: Object.assign({}, STU.ol),
    };
  STU_DISKS.forEach(
    (d) =>
      (s.rings[d.k] = {
        a: (STU.rot[d.k] && STU.rot[d.k].a) || 0,
        label: (stuWorkRingSelection(d.k, r) || {}).label || "—",
      }),
  );
  STU.work.snaps.unshift(s);
  STU.work.snaps = STU.work.snaps.slice(0, 30);
  stuWorkSave();
  stuWorkRender();
  toast("已保存时空快照");
}
function stuWorkSnapshotLoad(id) {
  const s = STU.work.snaps.find((x) => x.id === id);
  if (!s) return;
  Object.assign(STU.on, s.on || {});
  Object.assign(STU.ol, s.ol || {});
  STU.work.locks = JSON.parse(JSON.stringify(s.locks || {}));
  Object.entries(s.rings || {}).forEach(([k, v]) => {
    const r = STU.rot[k] || (STU.rot[k] = { a: 0, dir: 1, spin: false, v: STU.rotSpd });
    r.a = +v.a || 0;
    r.spin = false;
  });
  if (s.c) stuWorkSetCiv(s.c, "巨盘 · 载入时空快照");
  if (STU.sync) STU.sync();
  studioRender();
  stuWorkRender();
  toast("已载入快照");
}
function stuWorkSnapshotDel(id) {
  STU.work.snaps = STU.work.snaps.filter((x) => x.id !== id);
  stuWorkSave();
  stuWorkRender();
}
function stuWorkMatch(r) {
  const locks = stuWorkLocked().filter((x) =>
    ["sunXiu", "dayGz", "monthBranch"].includes(x.o.kind),
  );
  for (const x of locks) {
    if (x.o.kind === "sunXiu") {
      const p = r.astro && r.astro.planets && r.astro.planets.find((p) => p.n === "太阳");
      if (!p || xiuOf(p.lon, r.t.civ.y).n !== x.o.value) return false;
    }
    if (x.o.kind === "dayGz" && GAN[r.bz.pill[2].s] + ZHI[r.bz.pill[2].b] !== x.o.value)
      return false;
    if (x.o.kind === "monthBranch" && ZHI[r.bz.pill[1].b] !== x.o.value) return false;
  }
  const e = STU.work.extra || {};
  if (e.term) {
    const tm = TERMS[Math.floor(norm360(r.t.lon || 0) / 15) % 24];
    if (tm !== e.term) return false;
  }
  if (e.hour && ZHI[r.bz.pill[3].b] !== e.hour) return false;
  if (e.phase !== "" && e.phase != null) {
    const idx = r.astro && r.astro.moon && r.astro.moon.idx;
    if (String(idx) !== String(e.phase)) return false;
  }
  return true;
}
async function stuWorkSearch() {
  const has =
    stuWorkLocked().some((x) => ["sunXiu", "dayGz", "monthBranch"].includes(x.o.kind)) ||
    STU.work.extra.term ||
    STU.work.extra.hour ||
    (STU.work.extra.phase !== "" && STU.work.extra.phase != null);
  if (!has) {
    toast("请至少锁定一个可计算条件，或选择节气/时辰/月相");
    return;
  }
  const token = ++STU.work.searchToken,
    base = stuWorkCiv(stuObsR()),
    range = Math.max(1, Math.min(365, +STU.work.range || 90)),
    start = new Date(Date.UTC(base.y, base.m - 1, base.d, base.h, base.mi || 0)),
    hits = [];
  let checked = 0;
  const max = range * 12;
  stuInfo(
    `<div class="stu-info-head"><div><h4>条件时间搜索</h4><small>未来 ${range} 天 · 按双时辰（2 小时）采样 · 最多返回 16 个候选</small></div><span class="stu-info-badge">搜索中</span></div><p id="stuSearchProg" class="dim">准备搜索…</p>`,
  );
  for (let i = 0; i <= max && hits.length < 16; i++) {
    if (token !== STU.work.searchToken) return;
    const d = new Date(start.getTime() + i * 2 * 3600000),
      c = {
        y: d.getUTCFullYear(),
        m: d.getUTCMonth() + 1,
        d: d.getUTCDate(),
        h: d.getUTCHours(),
        mi: d.getUTCMinutes(),
        s: 0,
      };
    if (c.y > 2099) break;
    let r = null;
    try {
      r = compute(c);
    } catch (_) {
      continue;
    }
    checked++;
    if (stuWorkMatch(r)) hits.push({ c, core: stuWorkCoreObj(r) });
    if (i % 36 === 0) {
      const p = $("#stuSearchProg");
      if (p) p.textContent = `已检查 ${checked} 个时刻，找到 ${hits.length} 个候选…`;
      await new Promise((ok) => setTimeout(ok, 0));
    }
  }
  if (token !== STU.work.searchToken) return;
  const list = hits.length
    ? `<div class="stu-search-results">${hits
        .map((h) => {
          const iso = `${h.c.y}-${f2(h.c.m)}-${f2(h.c.d)}T${f2(h.c.h)}:${f2(h.c.mi)}`;
          return `<div class="stu-search-hit"><div><b>${esc(h.core.时刻)}</b><small>${esc(h.core.四柱)} · ${esc(h.core.节气)} · 日${esc(h.core.太阳宿)} · ${esc(h.core.月相)}</small></div><button class="gbtn sm" type="button" data-stime="${iso}">载入</button></div>`;
        })
        .join("")}</div>`
    : '<p class="note">当前搜索范围内没有找到同时满足条件的时刻。可放宽锁定条件或扩大日期范围。</p>';
  stuInfo(
    `<div class="stu-info-head"><div><h4>条件时间搜索</h4><small>检查 ${checked} 个双时辰采样点 · 找到 ${hits.length} 个候选</small></div><span class="stu-info-badge">完成</span></div>${stuWorkLockChips()}${list}<p class="dim sm">搜索仅使用有明确历算含义的锁定条件；紫微宫位、六十四卦、河洛等“盘面朝向”不会被伪装成时间条件。</p>`,
  );
}
function stuWorkPlayStop() {
  STU.work.play.on = false;
  if (STU.work._playTimer) {
    clearTimeout(STU.work._playTimer);
    STU.work._playTimer = 0;
  }
  stuWorkRender();
}
function stuWorkAdvance(c, kind) {
  const d = new Date(Date.UTC(c.y, c.m - 1, c.d, c.h, c.mi || 0));
  if (kind === "hour") d.setUTCHours(d.getUTCHours() + 1);
  else if (kind === "day") d.setUTCDate(d.getUTCDate() + 1);
  else if (kind === "week") d.setUTCDate(d.getUTCDate() + 7);
  else if (kind === "month") d.setUTCMonth(d.getUTCMonth() + 1);
  else d.setUTCFullYear(d.getUTCFullYear() + 1);
  return {
    y: d.getUTCFullYear(),
    m: d.getUTCMonth() + 1,
    d: d.getUTCDate(),
    h: d.getUTCHours(),
    mi: d.getUTCMinutes(),
    s: 0,
  };
}
function stuWorkPlayToggle() {
  if (STU.work.play.on) {
    stuWorkPlayStop();
    return;
  }
  STU.work.play.on = true;
  const tick = () => {
    if (!STU.work.play.on || !STU.active) {
      stuWorkPlayStop();
      return;
    }
    const c = stuWorkAdvance(stuWorkCiv(stuObsR()), STU.work.play.step || "day");
    if (c.y < 1901 || c.y > 2099) {
      stuWorkPlayStop();
      return;
    }
    STU.obs.mode = "custom";
    STU.obs.date = `${c.y}-${f2(c.m)}-${f2(c.d)}`;
    STU.obs.time = `${f2(c.h)}:${f2(c.mi)}`;
    STU_OBS_CACHE.k = "";
    if (STU.obsUI) STU.obsUI();
    studioRender();
    stuSfxTick(0.22, false, 1, 0.38);
    STU.work._playTimer = setTimeout(tick, 1000);
  };
  tick();
  stuWorkRender();
}
const STU_TRACK = {
  木: {
    terms: [
      "木",
      "甲",
      "乙",
      "寅",
      "卯",
      "震",
      "巽",
      "青龙",
      "春",
      "角",
      "亢",
      "氐",
      "房",
      "心",
      "尾",
      "箕",
    ],
    desc: "甲乙、寅卯、东方、春令、震巽，以及东方苍龙七宿等传统对应。",
  },
  火: {
    terms: [
      "火",
      "丙",
      "丁",
      "巳",
      "午",
      "离",
      "朱雀",
      "夏",
      "井",
      "鬼",
      "柳",
      "星",
      "张",
      "翼",
      "轸",
    ],
    desc: "丙丁、巳午、南方、夏令、离，以及南方朱雀七宿等传统对应。",
  },
  土: {
    terms: ["土", "戊", "己", "辰", "戌", "丑", "未", "坤", "艮", "勾陈", "太常"],
    desc: "戊己、辰戌丑未、坤艮与中央/四季土等传统对应。",
  },
  金: {
    terms: [
      "金",
      "庚",
      "辛",
      "申",
      "酉",
      "乾",
      "兑",
      "白虎",
      "秋",
      "奎",
      "娄",
      "胃",
      "昴",
      "毕",
      "觜",
      "参",
    ],
    desc: "庚辛、申酉、西方、秋令、乾兑，以及西方白虎七宿等传统对应。",
  },
  水: {
    terms: [
      "水",
      "壬",
      "癸",
      "亥",
      "子",
      "坎",
      "玄武",
      "冬",
      "斗",
      "牛",
      "女",
      "虚",
      "危",
      "室",
      "壁",
    ],
    desc: "壬癸、亥子、北方、冬令、坎，以及北方玄武七宿等传统对应。",
  },
};
function stuWorkTrack(k) {
  STU.work.track = STU.work.track === k ? "" : k;
  stuWorkSave();
  stuWorkRender();
  stuWorkVisualApply();
  if (STU.work.track) {
    const x = STU_TRACK[STU.work.track];
    stuInfo(
      `<div class="stu-info-head"><div><h4>关系追踪 · ${STU.work.track}</h4><small>跨环检索传统对应词；这是知识关系高亮，不代表所有体系可以直接互相换算。</small></div><span class="stu-info-badge">追踪</span></div><p class="rt">${esc(x.desc)}</p><div class="stu-cond-list">${x.terms.map((t) => `<span class="stu-cond-chip">${esc(t)}</span>`).join("")}</div>`,
    );
  } else stuInfoAuto(true);
}
function stuWorkVisualApply() {
  const st = $("#stuStage");
  if (!st) return;
  st.classList.toggle("stu-track-on", !!STU.work.track);
  $$("#stuStage .stu-track-hit").forEach((x) => x.classList.remove("stu-track-hit"));
  $$("#stuSvg .stu-disk").forEach((x) =>
    x.classList.remove("stu-track-ring", "stu-compare-changed"),
  );
  if (STU.work.track && STU_TRACK[STU.work.track]) {
    const terms = STU_TRACK[STU.work.track].terms;
    $$("#stuSvg text,#stuOrig text").forEach((t) => {
      const s = t.textContent || "";
      if (terms.some((x) => s.includes(x))) t.classList.add("stu-track-hit");
    });
    STU_DISKS.forEach((d) => {
      const g = document.querySelector(`#stuSvg .stu-disk[data-k="${d.k}"]`);
      if (g && [...g.querySelectorAll("text")].some((t) => t.classList.contains("stu-track-hit")))
        g.classList.add("stu-track-ring");
    });
  }
  const A = STU.work.A,
    B = STU.work.B;
  if (A && B) {
    STU_DISKS.forEach((d) => {
      const a = A.rings && A.rings[d.k],
        b = B.rings && B.rings[d.k],
        g = document.querySelector(`#stuSvg .stu-disk[data-k="${d.k}"]`);
      if (g && a && b && a.label !== b.label) g.classList.add("stu-compare-changed");
    });
  }
}
function stuWorkChain(topic) {
  const r = stuObsR(),
    c = r.t.civ,
    term = TERMS[Math.floor(norm360(r.t.lon || 0) / 15) % 24],
    four = (r.bz.pill || []).map((p) => GAN[p.s] + ZHI[p.b]).join(" "),
    q = r.qm,
    lr = r.lr,
    pl = (r.astro && r.astro.planets) || [],
    sun = pl.find((p) => p.n === "太阳"),
    moon = pl.find((p) => p.n === "月亮");
  let steps = [];
  if (topic === "qimen") {
    steps = [
      ["时空输入", `${c.y}-${f2(c.m)}-${f2(c.d)} ${f2(c.h)}:${f2(c.mi)}`],
      ["节气定位", `${term} · 太阳黄经 ${(r.t.lon || 0).toFixed(2)}°`],
      ["阴阳遁与局数", q ? `${q.yang ? "阳" : "阴"}遁 ${q.ju} 局` : "—"],
      ["值符/值使", q ? `值符 ${q.zfStar || "—"} · 值使 ${q.zsDoor || "—"}` : "—"],
      ["九宫落盘", "八神、九星、八门、天地盘干按本页“拆补法时家转盘”口径排布"],
    ];
  } else if (topic === "liuren") {
    steps = [
      ["时空输入", `${c.y}-${f2(c.m)}-${f2(c.d)} ${f2(c.h)}:${f2(c.mi)}`],
      ["太阳黄经/中气", `${term} · ${(r.t.lon || 0).toFixed(2)}°`],
      ["月将", lr ? `${ZHI[lr.zj]} · ${lr.jiangName || ""}` : "—"],
      ["月将加占时", lr ? `${ZHI[lr.zj]} 加 ${ZHI[lr.hb]}` : "—"],
      ["天地盘与三传", lr ? `${lr.ge} · ${lr.chu.map((x) => ZHI[x.z]).join("→")}` : "—"],
    ];
  } else if (topic === "astro") {
    let sx = "—",
      mx = "—";
    try {
      if (sun) sx = xiuOf(sun.lon, c.y).n + "宿";
      if (moon) mx = xiuOf(moon.lon, c.y).n + "宿";
    } catch (_) {}
    steps = [
      ["儒略日/时刻", "由指定民用时刻换算天文时刻"],
      ["太阳黄经", sun ? sun.lon.toFixed(2) + "°" : "—"],
      ["二十八宿定位", `太阳 ${sx} · 月亮 ${mx}`],
      [
        "月相",
        r.astro && r.astro.moon
          ? `${r.astro.moon.name} · 月龄 ${r.astro.moon.age.toFixed(1)} 日`
          : "—",
      ],
      ["传统参照", "黄道、十二次、二十八宿作为不同坐标/分区语言分层显示"],
    ];
  } else {
    steps = [
      ["出生/观测时刻", `${c.y}-${f2(c.m)}-${f2(c.d)} ${f2(c.h)}:${f2(c.mi)}`],
      ["节令", `${term} · 太阳黄经 ${(r.t.lon || 0).toFixed(2)}°`],
      ["四柱", four],
      ["月令", ZHI[r.bz.pill[1].b] + "月"],
      ["扩展推演", "紫微、奇门、六壬、天象等从各自规则继续计算；不同体系不互相替代"],
    ];
  }
  stuInfo(
    `<div class="stu-info-head"><div><h4>推导链 · ${topic === "qimen" ? "奇门" : topic === "liuren" ? "六壬" : topic === "astro" ? "天文历象" : "时空总链"}</h4><small>展示“为什么得到这个结果”，而不是只给最终盘面。</small></div><span class="stu-info-badge">推导</span></div><div class="stu-chain">${steps.map(([a, b]) => `<div class="stu-step"><b>${esc(a)}</b><small>${esc(b)}</small></div>`).join("")}</div>`,
  );
}
function stuWorkRules() {
  const rows = [
    [
      "二十八宿·七政",
      "现代天文黄经 + 本页宿度表",
      "太阳所在宿可反推",
      "宿度不是 28 等分；传统宿度与黄道宫度分开",
    ],
    ["六十甲子·纳音", "四柱干支", "日柱可反推", "环的视觉朝向本身不等于更改干支算法"],
    ["十二辟卦·月令", "月支/月令", "月支可反推", "由历法月令决定"],
    ["六十四卦", "先天/文王/八宫序", "否", "可手动观察与比较；不把任意转角当作时间条件"],
    ["紫微十二宫", "人物出生资料", "否", "属于本命盘；不会被“当前时刻”随意重算"],
    ["大六壬", "月将、占时、日干支等", "环向不直接反推", "完整课体需遵循六壬起课规则"],
    ["奇门九宫", "节气、三元、时干支等", "环向不直接反推", "本页采用拆补法时家转盘"],
    ["河图洛书", "数理/飞星参照", "否", "数理结构与时空历算分层"],
  ];
  stuInfo(
    `<div class="stu-info-head"><div><h4>规则模式</h4><small>说明哪些环能成为真实计算条件，哪些只适合手动实验与视觉比较。</small></div><span class="stu-info-badge">口径</span></div><table class="stu-compare-table"><thead><tr><th>环</th><th>计算依据</th><th>时间反推</th><th>边界</th></tr></thead><tbody>${rows.map((r) => `<tr><td>${r.map(esc).join("</td><td>")}</td></tr>`).join("")}</tbody></table>`,
  );
}
function stuWorkRender() {
  const box = $("#stuWorkCtl");
  if (!box) return;
  const m = STU.work.mode || "manual",
    modes = [
      ["manual", "定盘"],
      ["compare", "比较"],
      ["search", "搜时"],
      ["play", "播放"],
      ["snap", "快照"],
      ["track", "追踪"],
      ["derive", "推导"],
    ];
  let h = `<div class="stu-work-tabs">${modes.map((x) => `<button type="button" data-wm="${x[0]}" class="${m === x[0] ? "on" : ""}">${x[1]}</button>`).join("")}</div><div class="stu-work-body">`;
  const r = stuObsR(),
    c = stuWorkCiv(r),
    date = `${c.y}-${f2(c.m)}-${f2(c.d)}`,
    time = `${f2(c.h)}:${f2(c.mi)}`;
  if (m === "manual")
    h += `<p class="stu-work-note">拖动外环选择“中轴项目”。环旁状态：自=自动、手=手动、锁=锁定。只有锁定且有明确历算含义的项目才会参加条件搜索。</p>${stuWorkLockChips()}<div class="row3"><label>基准日期<input id="stuManD" type="date" min="1901-01-01" max="2099-12-31" value="${date}"></label><label>基准时间<input id="stuManT" type="time" value="${time}"></label></div><div class="stu-work-actions"><button class="gbtn sm" type="button" data-wact="apply">按当前组合推演</button><button class="gbtn sm" type="button" data-wact="clearlocks">解除全部锁定</button></div>`;
  if (m === "compare")
    h += `<div class="stu-slot"><b>A</b><span>${STU.work.A ? esc(STU.work.A.core.时刻) + " · " + esc(STU.work.A.core.四柱) : "尚未记录"}</span><button class="gbtn sm" type="button" data-wact="capA">记录当前</button></div><div class="stu-slot"><b>B</b><span>${STU.work.B ? esc(STU.work.B.core.时刻) + " · " + esc(STU.work.B.core.四柱) : "尚未记录"}</span><button class="gbtn sm" type="button" data-wact="capB">记录当前</button></div><div class="stu-work-actions"><button class="gbtn sm" type="button" data-wact="compare">A/B 对照</button></div>`;
  if (m === "search")
    h += `${stuWorkLockChips()}<div class="row3"><label>未来范围<select id="stuSearchRange"><option value="30"${STU.work.range === 30 ? " selected" : ""}>30 天</option><option value="90"${STU.work.range === 90 ? " selected" : ""}>90 天</option><option value="365"${STU.work.range === 365 ? " selected" : ""}>365 天</option></select></label><label>节气<select id="stuSearchTerm"><option value="">不限</option>${TERMS.map((x) => `<option${STU.work.extra.term === x ? " selected" : ""}>${x}</option>`).join("")}</select></label><label>时辰<select id="stuSearchHour"><option value="">不限</option>${ZHI.map((x) => `<option${STU.work.extra.hour === x ? " selected" : ""}>${x}</option>`).join("")}</select></label></div><label>月相<select id="stuSearchPhase"><option value="">不限</option>${["朔(新月)", "蛾眉月", "上弦月", "盈凸月", "望(满月)", "亏凸月", "下弦月", "残月"].map((x, i) => `<option value="${i}"${String(STU.work.extra.phase) === String(i) ? " selected" : ""}>${x}</option>`).join("")}</select></label><div class="stu-work-actions"><button class="gbtn sm" type="button" data-wact="search">寻找符合条件的时间</button></div><p class="stu-work-note">搜索按双时辰采样，优先用于“日柱 / 月建 / 太阳宿 / 节气 / 时辰 / 月相”等可验证条件。</p>`;
  if (m === "play")
    h += `<p class="stu-work-note">让整个巨盘按统一天文/历法时钟向前播放。慢周期与快周期会同时变化，适合观察“多周期叠加”。</p><label>每秒推进<select id="stuPlayStep"><option value="hour"${STU.work.play.step === "hour" ? " selected" : ""}>1 小时</option><option value="day"${STU.work.play.step === "day" ? " selected" : ""}>1 天</option><option value="week"${STU.work.play.step === "week" ? " selected" : ""}>7 天</option><option value="month"${STU.work.play.step === "month" ? " selected" : ""}>1 月</option><option value="year"${STU.work.play.step === "year" ? " selected" : ""}>1 年</option></select></label><div class="stu-work-actions"><button class="gbtn sm" type="button" data-wact="play">${STU.work.play.on ? "暂停时间" : "播放时间"}</button><button class="gbtn sm" type="button" data-wact="now">回到此刻</button></div>`;
  if (m === "snap")
    h += `<div class="stu-work-actions"><button class="gbtn sm" type="button" data-wact="snap">保存当前快照</button></div><div class="stu-snap-list">${STU.work.snaps.length ? STU.work.snaps.map((s) => `<div class="stu-snap"><div><b>${esc(s.name)}</b><small>${esc((s.core && s.core.四柱) || "")}</small></div><span><button class="gbtn sm" type="button" data-wload="${s.id}">载入</button><button class="gbtn sm" type="button" data-wdel="${s.id}">删</button></span></div>`).join("") : '<p class="dim">还没有快照。</p>'}</div>`;
  if (m === "track")
    h += `<p class="stu-work-note">选择一个概念，跨环高亮传统对应关系。它是知识关联工具，不把不同术数体系强行合并成同一算法。</p><div class="stu-track-chips">${Object.keys(
      STU_TRACK,
    )
      .map(
        (k) =>
          `<button class="gbtn sm${STU.work.track === k ? " on" : ""}" type="button" data-track="${k}">${k}</button>`,
      )
      .join("")}<button class="gbtn sm" type="button" data-track="">清除</button></div>`;
  if (m === "derive")
    h += `<p class="stu-work-note">把“结果”拆成可追踪的计算链，并同时查看规则边界。</p><div class="stu-work-actions"><button class="gbtn sm" type="button" data-chain="time">时空总链</button><button class="gbtn sm" type="button" data-chain="qimen">奇门</button><button class="gbtn sm" type="button" data-chain="liuren">六壬</button><button class="gbtn sm" type="button" data-chain="astro">天文历象</button><button class="gbtn sm" type="button" data-rules="1">规则模式</button></div>`;
  box.innerHTML = h + "</div>";
  stuWorkBind();
  stuWorkRingUI();
}
function stuWorkBind() {
  const box = $("#stuWorkCtl");
  if (!box) return;
  box.onclick = (e) => {
    const b = e.target.closest("button");
    if (!b) return;
    if (b.dataset.wm) {
      STU.work.mode = b.dataset.wm;
      stuWorkSave();
      stuWorkRender();
      return;
    }
    const a = b.dataset.wact;
    if (a === "apply") stuWorkApplyManual();
    if (a === "clearlocks") {
      STU.work.locks = {};
      Object.values(STU.rot).forEach((r) => {
        r.a = 0;
        r.spin = false;
      });
      stuWorkSave();
      stuRotApply();
      stuWorkRender();
      stuWorkRingUI();
    }
    if (a === "capA") stuWorkCapture("A");
    if (a === "capB") stuWorkCapture("B");
    if (a === "compare") stuWorkCompare();
    if (a === "search") stuWorkSearch();
    if (a === "play") stuWorkPlayToggle();
    if (a === "now") {
      stuWorkPlayStop();
      stuReturnToday(true);
    }
    if (a === "snap") stuWorkSnapshotSave();
    if (b.dataset.wload) stuWorkSnapshotLoad(b.dataset.wload);
    if (b.dataset.wdel) stuWorkSnapshotDel(b.dataset.wdel);
    if ("track" in b.dataset) stuWorkTrack(b.dataset.track);
    if (b.dataset.chain) stuWorkChain(b.dataset.chain);
    if (b.dataset.rules) stuWorkRules();
  };
  const rg = $("#stuSearchRange");
  if (rg)
    rg.onchange = (e) => {
      STU.work.range = +e.target.value;
      stuWorkSave();
    };
  const tm = $("#stuSearchTerm");
  if (tm)
    tm.onchange = (e) => {
      STU.work.extra.term = e.target.value;
      stuWorkSave();
    };
  const hr = $("#stuSearchHour");
  if (hr)
    hr.onchange = (e) => {
      STU.work.extra.hour = e.target.value;
      stuWorkSave();
    };
  const ph = $("#stuSearchPhase");
  if (ph)
    ph.onchange = (e) => {
      STU.work.extra.phase = e.target.value;
      stuWorkSave();
    };
  const ps = $("#stuPlayStep");
  if (ps)
    ps.onchange = (e) => {
      STU.work.play.step = e.target.value;
      stuWorkSave();
    };
}

/* 全站盘类机械音效：Web Audio 程序合成，不依赖外部音频文件。
   v3 音色目标：金属发条 / 秒表机芯 / 自行车花鼓棘轮。
   核心规则：慢速 → 稀疏、轻、小颗粒“嗒”；快速 → 密集、明亮、带弹簧回弹的“哒哒哒”。
   只用于主动推演 / 转盘 / 环带，持续背景动画保持安静。 */
const STU_SFX = {
  ctx: null,
  master: null,
  comp: null,
  noise: null,
  last: 0,
  dragLast: 0,
  dragPending: null,
  dragTimer: 0,
  autoAcc: 0,
  mainAcc: 0,
  phase: 0,
};
function stuSfxEnsure() {
  if (!STU.sfx) return null;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  try {
    if (!STU_SFX.ctx) {
      const c = new AC(),
        m = c.createGain(),
        comp = c.createDynamicsCompressor();
      /* 保持较高网页内部增益；最终仍受浏览器标签页与系统总音量控制。 */
      m.gain.value = 1.72;
      comp.threshold.value = -11;
      comp.knee.value = 10;
      comp.ratio.value = 4.5;
      comp.attack.value = 0.001;
      comp.release.value = 0.065;
      m.connect(comp);
      comp.connect(c.destination);
      STU_SFX.ctx = c;
      STU_SFX.master = m;
      STU_SFX.comp = comp;
      const n = Math.max(768, Math.floor(c.sampleRate * 0.085)),
        b = c.createBuffer(1, n, c.sampleRate),
        a = b.getChannelData(0);
      for (let i = 0; i < n; i++) {
        const env = Math.pow(1 - i / n, 2.7);
        a[i] = (Math.random() * 2 - 1) * env;
      }
      STU_SFX.noise = b;
    }
    if (STU_SFX.ctx.state === "suspended") STU_SFX.ctx.resume().catch(() => {});
    return STU_SFX.ctx;
  } catch (_) {
    return null;
  }
}
function stuSfxMetalImpulse(c, t, vol, speed, detent, phase, dir) {
  /* 第一层：极短高频金属触点，像秒表擒纵叉/花鼓棘爪碰齿。 */
  if (STU_SFX.noise) {
    const src = c.createBufferSource(),
      hp = c.createBiquadFilter(),
      bp = c.createBiquadFilter(),
      g = c.createGain();
    src.buffer = STU_SFX.noise;
    hp.type = "highpass";
    hp.frequency.value = 2650 + speed * 1150;
    bp.type = "bandpass";
    bp.frequency.value = (phase ? 6100 : 5350) + speed * 1350 + (detent ? 420 : 0);
    bp.Q.value = detent ? 9.5 : 11.5;
    const pk = vol * (detent ? 0.78 : 0.56);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, pk), t + 0.00065);
    g.gain.exponentialRampToValueAtTime(0.0001, t + (detent ? 0.018 : 0.0105));
    src.connect(hp);
    hp.connect(bp);
    bp.connect(g);
    g.connect(STU_SFX.master);
    src.start(t);
    src.stop(t + 0.028);
  }
  /* 第二层：三组短衰减金属泛音，制造发条/薄钢片回弹。 */
  const shift = (dir < 0 ? -90 : 70) + (phase ? 115 : -55);
  const tones = detent
    ? [
        [2550 + shift, 0.23, 0.03, "triangle"],
        [4380 + shift, 0.15, 0.022, "sine"],
        [6840 + shift, 0.085, 0.016, "sine"],
      ]
    : [
        [2920 + shift + speed * 360, 0.17, 0.019, "triangle"],
        [4860 + shift + speed * 520, 0.105, 0.014, "sine"],
        [7250 + shift + speed * 620, 0.055, 0.01, "sine"],
      ];
  tones.forEach((z, i) => {
    const o = c.createOscillator(),
      g = c.createGain();
    o.type = z[3];
    o.frequency.setValueAtTime(z[0], t);
    o.frequency.exponentialRampToValueAtTime(z[0] * (i === 0 ? 0.83 : 0.91), t + z[2]);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, vol * z[1]), t + 0.0008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + z[2]);
    o.connect(g);
    g.connect(STU_SFX.master);
    o.start(t);
    o.stop(t + z[2] + 0.008);
  });
  /* 快速转动时加入一个极轻的第二棘爪回弹，让声音更像自行车花鼓连续咬合。 */
  if (speed > 0.55 && !detent) {
    const d = 0.0048 - speed * 0.0018,
      src2 = c.createOscillator(),
      g2 = c.createGain();
    src2.type = "square";
    src2.frequency.setValueAtTime(3900 + (phase ? 360 : 0) + speed * 900, t + d);
    src2.frequency.exponentialRampToValueAtTime(3150, t + d + 0.006);
    g2.gain.setValueAtTime(0.0001, t + d);
    g2.gain.exponentialRampToValueAtTime(vol * (0.032 + 0.035 * speed), t + d + 0.00055);
    g2.gain.exponentialRampToValueAtTime(0.0001, t + d + 0.0065);
    src2.connect(g2);
    g2.connect(STU_SFX.master);
    src2.start(t + d);
    src2.stop(t + d + 0.009);
  }
}
/* 手拖专用轻量音色：视觉必须优先。拖动事件中不再同步创建完整多层音频图，
   而是合并到后续任务里，只生成一层金属触点 + 一层短钢片泛音。 */
function stuSfxDragImpulse(c, t, vol, speed, detent, phase, dir) {
  try {
    if (STU_SFX.noise) {
      const src = c.createBufferSource(),
        bp = c.createBiquadFilter(),
        g = c.createGain();
      src.buffer = STU_SFX.noise;
      bp.type = "bandpass";
      bp.frequency.value = (phase ? 5750 : 5150) + speed * 1250 + (detent ? 380 : 0);
      bp.Q.value = 10.5;
      const pk = vol * (detent ? 0.68 : 0.46);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(Math.max(0.0002, pk), t + 0.00055);
      g.gain.exponentialRampToValueAtTime(0.0001, t + (detent ? 0.015 : 0.0085));
      src.connect(bp);
      bp.connect(g);
      g.connect(STU_SFX.master);
      src.start(t);
      src.stop(t + 0.021);
    }
    const o = c.createOscillator(),
      g2 = c.createGain(),
      shift = (dir < 0 ? -70 : 55) + (phase ? 85 : -35);
    o.type = "triangle";
    o.frequency.setValueAtTime(3050 + shift + speed * 520, t);
    o.frequency.exponentialRampToValueAtTime(2480 + shift, t + (detent ? 0.024 : 0.014));
    g2.gain.setValueAtTime(0.0001, t);
    g2.gain.exponentialRampToValueAtTime(
      Math.max(0.0002, vol * (detent ? 0.16 : 0.11)),
      t + 0.0007,
    );
    g2.gain.exponentialRampToValueAtTime(0.0001, t + (detent ? 0.025 : 0.015));
    o.connect(g2);
    g2.connect(STU_SFX.master);
    o.start(t);
    o.stop(t + (detent ? 0.031 : 0.02));
  } catch (_) {}
}
function stuSfxDragQueue(strength = 0.4, detent = false, dir = 1, speed = 0.4) {
  if (!STU.sfx) return;
  speed = Math.max(0, Math.min(1, +speed || 0));
  const prev = STU_SFX.dragPending;
  STU_SFX.dragPending = {
    strength: Math.max(strength, prev ? prev.strength : 0),
    detent: !!detent || !!(prev && prev.detent),
    dir,
    speed: Math.max(speed, prev ? prev.speed : 0),
  };
  if (STU_SFX.dragTimer) return;
  STU_SFX.dragTimer = setTimeout(() => {
    STU_SFX.dragTimer = 0;
    const p = STU_SFX.dragPending;
    STU_SFX.dragPending = null;
    if (!p || !STU.sfx) return;
    const now = performance.now(),
      minMs = p.detent ? 14 : 30 - p.speed * 13;
    if (now - STU_SFX.dragLast < minMs) return;
    STU_SFX.dragLast = now;
    const c = stuSfxEnsure();
    if (!c || c.state !== "running" || !STU_SFX.master) return;
    STU_SFX.phase = (STU_SFX.phase + 1) & 1;
    const base = Math.max(0.04, Math.min(0.28, +STU.sfxVol || 0.1)),
      vol = base * Math.max(0.14, Math.min(1.1, p.strength)) * (0.32 + p.speed * 0.66);
    stuSfxDragImpulse(c, c.currentTime, vol, p.speed, p.detent, STU_SFX.phase, p.dir);
  }, 0);
}
function stuSfxTick(strength = 0.45, detent = false, dir = 1, speed = 0.45) {
  if (!STU.sfx) return;
  const c = stuSfxEnsure();
  if (!c || c.state !== "running" || !STU_SFX.master) return;
  speed = Math.max(0, Math.min(1, +speed || 0));
  const t = c.currentTime,
    minGap = detent ? 0.014 : 0.047 - speed * 0.026;
  if (t - STU_SFX.last < minGap) return;
  STU_SFX.last = t;
  STU_SFX.phase = (STU_SFX.phase + 1) & 1;
  const base = Math.max(0.04, Math.min(0.28, +STU.sfxVol || 0.1));
  /* 慢速更小声，快速更明亮更有存在感。 */
  const vol = base * Math.max(0.16, Math.min(1.2, strength)) * (0.36 + speed * 0.72);
  try {
    stuSfxMetalImpulse(c, t, vol, speed, detent, STU_SFX.phase, dir);
  } catch (_) {}
}
function stuSfxClunk() {
  if (!STU.sfx) return;
  const c = stuSfxEnsure();
  if (!c || c.state !== "running" || !STU_SFX.master) return;
  const t = c.currentTime,
    vol = Math.max(0.04, Math.min(0.28, +STU.sfxVol || 0.1));
  try {
    /* 停止声改成“发条擒纵锁止”：清脆金属弹片 + 极短机械实体感，不再有低沉砰声。 */
    stuSfxMetalImpulse(c, t, vol * 0.95, 0.38, true, 0, 1);
    const o = c.createOscillator(),
      g = c.createGain();
    o.type = "triangle";
    o.frequency.setValueAtTime(1180, t + 0.004);
    o.frequency.exponentialRampToValueAtTime(760, t + 0.032);
    g.gain.setValueAtTime(0.0001, t + 0.004);
    g.gain.exponentialRampToValueAtTime(vol * 0.12, t + 0.0055);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.035);
    o.connect(g);
    g.connect(STU_SFX.master);
    o.start(t + 0.004);
    o.stop(t + 0.04);
    setTimeout(() => stuSfxTick(0.42, true, -1, 0.24), 24);
  } catch (_) {}
}
function stuSfxPreview() {
  if (!STU.sfx) return;
  stuSfxEnsure();
  /* 试听：秒表慢走 → 花鼓加速 → 发条锁止。 */
  const seq = [
    [0, 0.14],
    [280, 0.18],
    [500, 0.28],
    [655, 0.43],
    [755, 0.6],
    [825, 0.76],
    [875, 0.9],
    [918, 1],
  ];
  seq.forEach((z, i) =>
    setTimeout(
      () => stuSfxTick(0.26 + z[1] * 0.56, i === 2 || i === seq.length - 1, i % 2 ? 1 : -1, z[1]),
      z[0],
    ),
  );
  setTimeout(stuSfxClunk, 1005);
}
/* 浏览器通常要求先有一次用户手势才允许 Web Audio 发声。
   默认声音开启时，用户第一次点击/触摸/按键就提前解锁音频上下文，
   这样随后由自动推演、惯性转盘或延时回调触发的机械声也能正常听见。 */
(function stuSfxInstallUnlock() {
  const unlock = () => {
    if (!STU.sfx) return;
    const c = stuSfxEnsure();
    if (c && c.state === "running") {
      document.removeEventListener("pointerdown", unlock, true);
      document.removeEventListener("keydown", unlock, true);
    }
  };
  document.addEventListener("pointerdown", unlock, { capture: true, passive: true });
  document.addEventListener("keydown", unlock, true);
})();

function stuInfoCore(r) {
  if (!r || !r.t || !r.bz) return '<p class="dim sm">尚无可用盘面数据。</p>';
  const c = r.t.civ || {},
    bz = r.bz || {},
    ast = r.astro || {},
    pl = ast.planets || [],
    sun = pl.find((p) => p.n === "太阳") || pl[0],
    moon = pl.find((p) => p.n === "月亮") || pl[1],
    yr = c.y || new Date().getFullYear();
  const term =
    typeof TERMS !== "undefined" && r.t && isFinite(r.t.lon)
      ? TERMS[Math.floor(norm360(r.t.lon) / 15) % 24]
      : "";
  let sx = null,
    mx = null;
  try {
    if (sun) sx = xiuOf(sun.lon, yr);
    if (moon) mx = xiuOf(moon.lon, yr);
  } catch (e) {}
  const four = (bz.pill || []).map((p) => GAN[p.s] + ZHI[p.b]).join(" ");
  const sunTx = sun ? `${sun.n} ${sun.lon.toFixed(2)}°${sx ? " · " + sx.n + "宿" : ""}` : "—";
  const moonTx = moon
    ? `${moon.n} ${moon.lon.toFixed(2)}°${mx ? " · " + mx.n + "宿" : ""}${ast.moon && ast.moon.name ? " · " + ast.moon.name : ""}`
    : "—";
  const qm = r.qm
    ? `${r.qm.yang ? "阳" : "阴"}遁${PNUM[r.qm.ju]}局 · 值符天${r.qm.zfStar} · 值使${r.qm.zsDoor}门`
    : "—";
  const lr = r.lr
    ? `${r.lr.ge}${r.lr.chu && r.lr.chu.length ? " · 三传 " + r.lr.chu.map((x) => ZHI[x.z]).join("→") : ""}`
    : "—";
  const yq = ast.yq
    ? `${ast.yq.gz || ""}年 ${ast.yq.yunName || ""}${ast.yq.siTian ? " · 司天" + ast.yq.siTian : ""}`
    : "—";
  const loc = r.opt
    ? `${(+r.opt.lon).toFixed(2)}°E · ${(+r.opt.lat).toFixed(2)}°N${r.opt.solar ? " · 真太阳时校正" : ""}`
    : "—";
  return `<div class="stu-facts">
    <div class="stu-fact"><span>时刻</span><b>${c.y || ""}-${f2(c.m || 0)}-${f2(c.d || 0)} ${f2(c.h || 0)}:${f2(c.mi || 0)}</b></div>
    <div class="stu-fact"><span>地点</span><b>${loc}</b></div>
    <div class="stu-fact"><span>节令</span><b>${term || "—"} · 太阳黄经 ${isFinite(r.t.lon) ? r.t.lon.toFixed(2) + "°" : "—"}</b></div>
    <div class="stu-fact"><span>四柱</span><b>${four || "—"}</b></div>
    <div class="stu-fact"><span>日象</span><b>${sunTx}</b></div>
    <div class="stu-fact"><span>月象</span><b>${moonTx}</b></div>
    <div class="stu-fact"><span>奇门</span><b>${qm}</b></div>
    <div class="stu-fact"><span>六壬</span><b>${lr}</b></div>
    <div class="stu-fact"><span>运气</span><b>${yq}</b></div>
  </div>`;
}
function stuInfoAuto(force) {
  const el = $("#stuInfo");
  if (!el || !R) return;
  if (STU.infoMode === "manual" && !force) return;
  STU.infoMode = "auto";
  const r = stuObsR(),
    m = STU.obs.mode,
    title = m === "now" ? "此刻时空" : m === "custom" ? "指定时空" : "当前排盘时空",
    badge = m === "now" ? "实时" : m === "custom" ? "指定" : "排盘";
  let last = "";
  if (STU.lastDerive && STU.lastDerive.r) {
    const d = STU.lastDerive,
      dc = (d.r.t && d.r.t.civ) || {};
    last = `<details class="stu-last"><summary>最近一次推演 · ${esc(d.source || "综合推演")}</summary><div class="stu-mini"><h5>${esc(d.source || "综合推演")} · ${dc.y || ""}-${f2(dc.m || 0)}-${f2(dc.d || 0)} ${f2(dc.h || 0)}:${f2(dc.mi || 0)}</h5>${stuInfoCore(d.r)}</div></details>`;
  }
  el.innerHTML = `<div class="stu-info-head"><div><h4>${title}</h4><small>${stuObsLabel()} · 巨盘默认以此刻作为时空基准</small></div><span class="stu-info-badge">${badge}</span></div>${stuInfoCore(r)}${last}<p class="dim sm">点击盘上的宿、卦、宫、星、门可查看单项详情；下一次推演完成后会自动回到本总览并更新“最近一次推演”。</p>`;
}
function stuInfo(h) {
  const el = $("#stuInfo");
  if (!el) return;
  STU.infoMode = "manual";
  el.innerHTML = `<div class="stu-info-nav"><button type="button" id="stuInfoBack">← 返回时空总览</button></div>${h}`;
  const b = $("#stuInfoBack");
  if (b) b.onclick = () => stuInfoAuto(true);
}
function stuDeriveInfo(r, source) {
  if (!r) return;
  STU.lastDerive = { r, source: source || "综合推演", at: Date.now() };
  if (STU.active) stuInfoAuto(true);
}
/* ---- 观测时刻:当前盘 / 此刻(联动) / 指定时刻 ---- */
const STU_OBS_CACHE = { k: "", r: null };
function stuObsCiv() {
  const o = STU.obs;
  if (o.mode === "now") {
    const n = nowBJ();
    return { y: n.y, m: n.m, d: n.d, h: n.h, mi: n.mi, s: 0 };
  }
  if (o.mode === "custom" && o.date && o.time) {
    const [y, m, d] = o.date.split("-").map(Number),
      [h, mi] = o.time.split(":").map(Number);
    if (y >= 1901 && y <= 2099 && isFinite(h)) return { y, m, d, h, mi: mi || 0, s: 0 };
  }
  return null;
}
function stuObsR() {
  const c = stuObsCiv();
  if (!c) return R;
  const k = [c.y, c.m, c.d, c.h, c.mi, R && R.opt ? R.opt.lon + "," + R.opt.lat : ""].join("|");
  if (STU_OBS_CACHE.k !== k) {
    try {
      STU_OBS_CACHE.r = compute(c);
      STU_OBS_CACHE.k = k;
    } catch (e) {
      console.error("studio obs", e);
      return R;
    }
  }
  return STU_OBS_CACHE.r;
}
function stuObsLabel() {
  const r = stuObsR(),
    c = r.t.civ,
    m = STU.obs.mode;
  return (
    (m === "now" ? "此刻 · " : m === "custom" ? "指定时刻 · " : "当前盘 · ") +
    `${c.y}-${f2(c.m)}-${f2(c.d)} ${f2(c.h)}:${f2(c.mi)}`
  );
}
function stuLayout() {
  const Rmax = 770,
    gap = 5,
    joinGap = 0;
  let arr = [];
  if (STU.solo) {
    const d = STU.solo === "orig" ? { k: "orig" } : STU_DISKS.find((x) => x.k === STU.solo);
    arr = [{ k: d.k, w: 1, r0: 0, r1: Rmax }];
    return arr;
  }
  STU_DISKS.forEach((d) => {
    if (STU.on[d.k]) arr.push({ k: d.k, w: d.w });
  });
  const orig = !!STU.on.orig;
  if (orig) arr.push({ k: "orig", w: 2.7 });
  if (!arr.length) return arr;
  const tot = arr.reduce((a, d) => a + d.w, 0);
  const gapSum = arr
    .slice(0, -1)
    .reduce((s, d, i) => s + (arr[i + 1].k === "orig" ? joinGap : gap), 0);
  const avail = Rmax - gapSum;
  let r = Rmax;
  arr.forEach((d, i) => {
    const t = (avail * d.w) / tot;
    d.r1 = r;
    d.r0 = d.k === "orig" ? 0 : r - t;
    const next = arr[i + 1];
    r = d.r0 - (next ? (next.k === "orig" ? joinGap : gap) : 0);
  });
  if (!orig) arr[arr.length - 1].r0 = 0;
  return arr;
}
/* 原盘不是固定 345 半径：不同原盘图层的实际外径不同。按当前开启图层计算真实外径，
   再把它精确贴到巨盘最内环，避免“原盘缩成一坨 / 与大环留空隙 / 被大环遮掉一截”。 */
function stuOrigOuterRadius() {
  let r = 298; // 主盘基础节气/时辰/六十四卦外径
  if (STU.ol.lp) r = Math.max(r, 404); // 综合罗盘最外刻度
  if (STU.ol.astro) r = Math.max(r, 366); // 星象/黄道十二宫
  if (STU.ol.ppl) r = Math.max(r, 404); // 人物关系节点最外可到约 404
  if (STU.ol.bz) r = Math.max(r, 352); // 命局地支标记
  if (STU.ol.sense) r = Math.max(r, 398); // 感应扫描环
  if (STU.ol.gz) r = Math.max(r, 396); // 六十甲子层
  if (STU.ol.yq) r = Math.max(r, 398); // 五运六气层
  return Math.min(404, Math.max(298, r));
}
function stuApplyOrig(arr) {
  const o = arr.find((d) => d.k === "orig"),
    box = $("#stuOrig");
  if (!box) return;
  if (!o) {
    box.style.display = "none";
    return;
  }
  box.style.display = "";
  const srcR = stuOrigOuterRadius();
  const w = ((816 * (o.r1 / srcR)) / 1600) * 100;
  box.style.width = w + "%";
  box.style.height = w + "%";
  box.dataset.srcR = String(srcR);
  try {
    Object.entries(dial.layerG).forEach(([k, g]) => {
      g.style.display = STU.ol[k] ? "" : "none";
    });
    if (dial.x.aspG)
      dial.x.aspG.style.display = STU.ol.astro && dial.x.showAsp !== false ? "" : "none";
    senseLayerChanged(STU.ol.sense ? "sense" : "lp");
  } catch (e) {}
}
function studioRender() {
  const svg = $("#stuSvg");
  if (!svg || !STU.active || !R) return;
  const C = { R: stuObsR(), Rb: R };
  const arr = stuLayout();
  svg.innerHTML = "";
  const defs = E("defs", {}, svg);
  arr.forEach((d, i) => {
    if (d.k === "orig") return;
    const g = E("g", { class: "stu-disk", "data-k": d.k }, svg);
    g.style.setProperty("--s", (i % 2 ? "-" : "") + "360deg");
    const bg = E(
      "path",
      {
        d: sPath(d.r0, d.r1, 0, 359.99) + (d.r0 > 0 ? "" : ""),
        class: "stu-bg",
        "fill-rule": "evenodd",
      },
      g,
    );
    bg.setAttribute(
      "d",
      `M${d.r1},0A${d.r1},${d.r1} 0 1 1 ${-d.r1},0A${d.r1},${d.r1} 0 1 1 ${d.r1},0Z` +
        (d.r0 > 0
          ? `M${d.r0},0A${d.r0},${d.r0} 0 1 0 ${-d.r0},0A${d.r0},${d.r0} 0 1 0 ${d.r0},0Z`
          : ""),
    );
    ringLine(g, d.r1);
    if (d.r0 > 0) ringLine(g, d.r0);
    const body = E("g", {}, g);
    STU_SC = Math.max(1, (d.r1 - d.r0) / 230);
    const hole = !["hl", "qm"].includes(d.k) && d.r0 < d.r1 * 0.3,
      r0e = hole ? d.r1 * 0.3 : d.r0;
    {
      const cp = E("clipPath", { id: "stuClip-" + d.k }, defs),
        ri = hole ? 0 : d.r0,
        ro = d.r1;
      E(
        "path",
        {
          d:
            `M${ro},0A${ro},${ro} 0 1 1 ${-ro},0A${ro},${ro} 0 1 1 ${ro},0Z` +
            (ri > 0 ? `M${ri},0A${ri},${ri} 0 1 0 ${-ri},0A${ri},${ri} 0 1 0 ${ri},0Z` : ""),
          "clip-rule": "evenodd",
        },
        cp,
      );
      body.setAttribute("clip-path", `url(#stuClip-${d.k})`);
    }
    if (hole) {
      const nm = (STU_DISKS.find((x) => x.k === d.k) || {}).n || "",
        hd = (() => {
          try {
            return STU_HEAD[d.k](C);
          } catch (e) {
            return "";
          }
        })(),
        fs = Math.max(8, Math.min(26, r0e * 0.13)) * STU.fs;
      E(
        "text",
        {
          class: "stu-t",
          x: 0,
          y: -fs * 0.7,
          "text-anchor": "middle",
          "font-size": f1(fs),
          "font-weight": 700,
          fill: "var(--gold2)",
        },
        body,
        nm.split(" · ")[0],
      );
      E(
        "text",
        {
          class: "stu-t dim",
          x: 0,
          y: fs * 0.9,
          "text-anchor": "middle",
          "font-size": f1(fs * 0.62),
        },
        body,
        hd,
      );
    }
    try {
      STU_REND[d.k](body, r0e, d.r1, C);
    } catch (e) {
      console.error("studio", d.k, e);
      E(
        "text",
        { class: "stu-t", x: 0, y: -d.r1 + 30, "text-anchor": "middle", "font-size": 14 },
        body,
        "绘制出错:" + d.k,
      );
    }
    {
      const el = Date.now() - (STU.spinAt || 0);
      if (el < 1900) {
        g.classList.add("spin");
        g.style.animationDelay = -el / 1000 + "s";
      }
    }
  });
  stuApplyOrig(arr);
  /* 原盘与最内侧外环共享同一接缝：视觉上是一张同心母盘，而不是两张盘叠放。 */
  {
    const o = arr.find((d) => d.k === "orig");
    if (o && arr.some((d) => d.k !== "orig")) {
      E("circle", { r: f1(o.r1), class: "stu-join" }, svg);
      if (o.r1 > 5) E("circle", { r: f1(o.r1 - 3), class: "stu-join stu-join-in" }, svg);
    }
  }
  try {
    stuRotApply();
    if (STU.rotUI) STU.rotUI();
    if (STU.obsUI) STU.obsUI();
  } catch (e) {}
  const lrg = svg.querySelector(".stu-tian");
  if (lrg && STU.lrSpin) {
    lrg.classList.add("spin2");
    STU.lrSpin = false;
  }
  stuHeads();
  try {
    stuInfoAuto(false);
  } catch (e) {}
  try {
    stuWorkRingUI();
    stuWorkVisualApply();
  } catch (e) {}
}
function stuHeads() {
  STU_DISKS.forEach((d) => {
    const el = $("#stuHead-" + d.k);
    if (el)
      try {
        el.textContent = STU.on[d.k] && R ? STU_HEAD[d.k]({ R }) : "";
      } catch (e) {
        el.textContent = "";
      }
  });
}
function stuFitView(save = true) {
  STU.zoom = 1;
  STU.pan = { x: 0, y: 0 };
  STU.gest = "";
  if (save) stuSave();
  try {
    if (STU.sync) STU.sync();
  } catch (_) {}
  try {
    stuPanApply();
    stuGestSet("");
  } catch (_) {}
  const sc = $("#stuScroll");
  if (sc)
    requestAnimationFrame(() => {
      try {
        sc.scrollLeft = Math.max(0, (sc.scrollWidth - sc.clientWidth) / 2);
        sc.scrollTop = 0;
      } catch (_) {}
    });
}
function stuRestoreToday(resetView = true) {
  const n = nowBJ();
  STU.obs.mode = "now";
  STU.obs.date = `${n.y}-${f2(n.m)}-${f2(n.d)}`;
  STU.obs.time = `${f2(n.h)}:${f2(n.mi)}`;
  STU_OBS_CACHE.k = "";
  STU.infoMode = "auto";
  STU.solo = null;
  Object.values(STU.rot).forEach((r) => {
    r.a = 0;
    r.spin = false;
  });
  STU_SFX.autoAcc = 0;
  if (resetView) stuFitView(false);
  stuSave();
  if (STU.active) {
    try {
      if (STU.obsUI) STU.obsUI();
      if (STU.sync) STU.sync();
      studioRender();
      stuInfoAuto(true);
    } catch (e) {
      console.error("studio today", e);
    }
  }
}
function stuUI() {
  const pane = $("#pane-studio");
  if (!pane || pane.dataset.ui) return;
  pane.dataset.ui = "1";
  pane.dataset.built = "1";
  pane.innerHTML = `<div class="stu"><aside class="stu-ctl panel blk"><h3 class="sec">盘 · 开关</h3>
   <div class="stu-pre">${STU_PRE.map(([n], i) => `<button type="button" class="gbtn sm" data-pre="${i}">${n}</button>`).join("")}</div>
   <div class="stu-rows">
    <div class="stu-row"><label class="stu-sw"><input type="checkbox" data-k="orig"><i class="sw"></i><span>原盘<small>罗盘·星象·人物·命局…</small><small class="stu-condline">固定核心</small></span></label><button type="button" class="stu-lock core" disabled title="原盘固定为核心母盘">核</button><button type="button" class="solo" data-solo="orig" title="只看这个盘">◎</button></div>
    <div class="stu-ol" id="stuOl">${STU_OL.map(([k, n]) => `<button type="button" class="chip${STU.ol[k] ? " on" : ""}" data-ol="${k}">${n}</button>`).join("")}</div>
    ${STU_DISKS.map((d) => `<div class="stu-row"><label class="stu-sw" title="${esc(d.d)}"><input type="checkbox" data-k="${d.k}"><i class="sw"></i><span>${d.n}<small id="stuHead-${d.k}"></small><small class="stu-condline" id="stuCond-${d.k}">自动</small></span></label><button type="button" class="stu-lock auto" data-lock="${d.k}" title="自动 / 手动 / 锁定">自</button><button type="button" class="solo" data-solo="${d.k}" title="只看这个盘">◎</button></div>`).join("")}
   </div>
   <h4 class="gl">时空演算器</h4><div class="stu-work"><div id="stuWorkCtl"></div></div>
   <p class="note">盘从外到内依次为:二十八宿七政、六十甲子、六十四卦、十二辟卦、紫微、六壬、奇门、河洛,最内是原盘。原盘会按当前开启的罗盘/星象/人物/命局等图层自动计算真实外径,与最内侧大环无缝同心衔接；开的越多,每圈越窄,可用右上缩放或“◎”单独放大一个盘。</p></aside>
   <section class="stu-main"><div class="stu-bar"><button type="button" class="gbtn sm" id="stuSpin">▶ 按此刻重新推演并转动</button><span class="stu-core-actions"><button type="button" class="gbtn sm" id="stuCalcCombo">组合推演</button><button type="button" class="gbtn sm" id="stuQuickA">记 A</button><button type="button" class="gbtn sm" id="stuQuickB">记 B</button><button type="button" class="gbtn sm" id="stuQuickCmp">A/B</button><button type="button" class="gbtn sm" id="stuQuickSnap">快照</button></span><button type="button" class="gbtn sm" id="stuLrSpin">转动六壬天盘</button><span class="stu-gest" role="group" aria-label="拖动手势"><button type="button" class="gbtn sm" id="stuGR" aria-pressed="false" title="按住外环拖动即可转动该环；原盘固定">拖转环带</button><button type="button" class="gbtn sm" id="stuGP" aria-pressed="false" title="立即拖动整张巨盘视图">平移大盘</button></span><span class="dim sm stu-viewhint">滚轮缩放 · 长按拖动查看</span><span class="dim sm" id="stuSoloTag"></span><button type="button" class="gbtn sm" id="stuFit" title="恢复为完整自适应大小并回到中心">↙↗ 适应视图</button><span class="stu-zoom"><button type="button" class="gbtn sm" id="stuZm">−</button><span id="stuZv">100%</span><button type="button" class="gbtn sm" id="stuZp">＋</button></span></div>
    <div class="stu-scroll" id="stuScroll"><button type="button" class="stu-fit-float" id="stuFitFloat" title="恢复完整盘面">↙↗<small>适应</small></button><div class="stu-stage" id="stuStage"><div class="stu-orig" id="stuOrig"></div><svg id="stuSvg" viewBox="-800 -800 1600 1600" role="img" aria-label="盘库圆盘"></svg></div></div>
    <div class="stu-under" aria-label="巨盘辅助控制区">
      <div class="stu-under-card stu-under-obs"><h4 class="gl">观测时刻</h4><div class="stu-opt"><label>盘面时刻<select id="stuObsM"><option value="now">此刻北京时间 · 默认 · 每分钟联动</option><option value="chart">当前已排盘时刻</option><option value="custom">指定时刻</option></select></label><div class="row3" id="stuObsC" hidden><input type="date" id="stuObsD" min="1901-01-01" max="2099-12-31"><input type="time" id="stuObsT"><button class="gbtn sm" type="button" id="stuObsGo">更新盘面</button></div><p class="dim sm" id="stuObsL"></p><p class="dim sm stu-under-note">紫微仍按人物生辰；其余盘按观测时刻。奇门按拆补转盘，六壬按中气换将。</p></div></div>
      <div class="stu-under-card stu-under-rot"><h4 class="gl">环带转动 · 机械反馈</h4><div class="stu-opt stu-rot-grid"><label class="chk"><input type="checkbox" id="stuRotAll"> 全部环带转动</label><label>当前环<select id="stuRotSel"></select></label><div class="row3"><button class="gbtn sm" type="button" id="stuRotP">转动此环</button><button class="gbtn sm" type="button" id="stuRotD">顺时针</button></div><label>转速<select id="stuRotS"><option value="1.5">舒缓</option><option value="4" selected>缓慢</option><option value="9">适中</option><option value="18">较快</option></select></label><div class="row3 stu-sfx-row"><label class="chk"><input type="checkbox" id="stuSfx"> 机械运转音效</label><label>音量<select id="stuSfxV"><option value=".06">轻</option><option value=".10">中</option><option value=".16">响亮</option><option value=".22">强</option><option value=".24" selected>最大</option></select></label><button class="gbtn sm" type="button" id="stuSfxTry">试听</button></div><div class="row3"><button class="gbtn sm" type="button" id="stuRotZ">坐标归位</button><span class="dim sm" id="stuAng">展示转角 0°</span></div><p class="dim sm stu-under-note">转动只改变展示位置，盘面数据不变；声音密度随转速变化，并继续跟随系统总音量。</p></div></div>
      <div class="stu-under-card stu-under-display"><h4 class="gl">显示</h4><div class="stu-opt"><label>六十四卦圆图序<select id="stuGo"><option value="xt">邵雍先天序</option><option value="wen">文王卦序</option><option value="gong">京房八宫序</option></select></label><label>文字大小<select id="stuFs"><option value=".85">小</option><option value="1">中</option><option value="1.25">大</option><option value="1.6">特大</option></select></label><label class="chk"><input type="checkbox" id="stuSi"> 七政含四余</label><p class="dim sm stu-under-note">这些参数只控制巨盘的显示方式，不改变推演数据。</p></div></div>
    </div>
   </section>
   <aside class="stu-info panel blk"><h3 class="sec">详情</h3><div id="stuInfo"><p class="dim sm">正在读取此刻时空信息…</p></div></aside></div>`;
  const sync = () => {
    $$(".stu-sw input", pane).forEach((c) => {
      c.checked = !!STU.on[c.dataset.k];
    });
    $$("#stuOl .chip", pane).forEach((b) => b.classList.toggle("on", !!STU.ol[b.dataset.ol]));
    $("#stuFs").value = String(STU.fs);
    $("#stuSi").checked = !!STU.si;
    $$(".solo", pane).forEach((b) => b.classList.toggle("on", STU.solo === b.dataset.solo));
    $("#stuSoloTag").textContent = STU.solo
      ? `仅显示:${STU.solo === "orig" ? "原盘" : STU_DISKS.find((d) => d.k === STU.solo).n}(再点 ◎ 恢复)`
      : "";
    $("#stuZv").textContent = Math.round(STU.zoom * 100) + "%";
    $("#stuStage").style.width = STU.zoom * 100 + "%";
    $("#stuStage").style.setProperty("--zz", STU.zoom);
    const sx = $("#stuSfx"),
      sv = $("#stuSfxV");
    if (sx) sx.checked = !!STU.sfx;
    if (sv) sv.value = String(STU.sfxVol);
    try {
      stuWorkRingUI();
    } catch (_) {}
  };
  STU.sync = sync;
  const obsUI = () => {
    $("#stuObsM").value = STU.obs.mode;
    $("#stuObsC").hidden = STU.obs.mode !== "custom";
    $("#stuObsL").textContent = R ? "盘面时刻:" + stuObsLabel() : "";
    const dd = $("#stuObsD"),
      tt = $("#stuObsT");
    if (!dd.value && R) {
      const c = R.t.civ;
      dd.value = `${c.y}-${f2(c.m)}-${f2(c.d)}`;
      tt.value = `${f2(c.h)}:${f2(c.mi)}`;
    }
  };
  STU.obsUI = obsUI;
  $("#stuObsM").onchange = (e) => {
    STU.obs.mode = e.target.value;
    STU.infoMode = "auto";
    obsUI();
    studioRender();
    stuInfoAuto(true);
  };
  $("#stuObsGo").onclick = () => {
    STU.obs.mode = "custom";
    STU.obs.date = $("#stuObsD").value;
    STU.obs.time = $("#stuObsT").value;
    if (!stuObsCiv()) {
      toast("请选择 1901–2099 年内的日期与时间");
      return;
    }
    STU.infoMode = "auto";
    obsUI();
    studioRender();
    stuInfoAuto(true);
  };
  $("#stuGo").value = STU.guaOrd;
  $("#stuGo").onchange = (e) => {
    STU.guaOrd = e.target.value;
    stuSave();
    studioRender();
  };
  /* 单环转动 */
  const rotKeys = () => ["xiu", "jz", "gua", "bg", "zw", "lr", "qm", "hl"].filter((k) => STU.on[k]);
  const rs = (k) => STU.rot[k] || (STU.rot[k] = { a: 0, dir: 1, spin: false, v: STU.rotSpd });
  STU.rotUI = () => {
    const sel = $("#stuRotSel"),
      ks = rotKeys(),
      cur = ks.includes(STU.rotSel) ? STU.rotSel : ks[0] || "";
    STU.rotSel = cur;
    sel.innerHTML =
      ks
        .map(
          (k) =>
            `<option value="${k}"${k === cur ? " selected" : ""}>${STU_DISKS.find((d) => d.k === k).n}</option>`,
        )
        .join("") || '<option value="">(没有开启的盘)</option>';
    const r = cur ? rs(cur) : null;
    $("#stuRotP").textContent = r && r.spin ? "暂停此环" : "转动此环";
    $("#stuRotD").textContent = r && r.dir < 0 ? "逆时针" : "顺时针";
    $("#stuRotAll").checked = ks.length > 0 && ks.every((k) => rs(k).spin);
    $("#stuRotS").value = String(r ? r.v : STU.rotSpd);
    $("#stuAng").textContent = r
      ? `展示转角 ${(((r.a % 360) + 360) % 360).toFixed(0)}°`
      : "展示转角 0°";
  };
  $("#stuRotSel").onchange = (e) => {
    STU.rotSel = e.target.value;
    STU.rotUI();
  };
  $("#stuRotP").onclick = () => {
    const k = STU.rotSel;
    if (!k) return;
    const r = rs(k);
    r.spin = !r.spin;
    if (r.spin) {
      stuSfxEnsure();
      stuSfxTick(0.56, true, r.dir, Math.min(1, (r.v || STU.rotSpd) / 18));
    } else stuSfxClunk();
    STU.rotUI();
    stuRotStart();
  };
  $("#stuRotD").onclick = () => {
    const k = STU.rotSel;
    if (!k) return;
    const r = rs(k);
    r.dir *= -1;
    stuSfxTick(0.6, true, r.dir, Math.min(1, (r.v || STU.rotSpd) / 18));
    STU.rotUI();
  };
  $("#stuRotS").onchange = (e) => {
    const k = STU.rotSel;
    STU.rotSpd = +e.target.value;
    if (k) rs(k).v = +e.target.value;
  };
  $("#stuSfx").checked = !!STU.sfx;
  $("#stuSfxV").value = String(STU.sfxVol);
  $("#stuSfx").onchange = (e) => {
    STU.sfx = e.target.checked ? 1 : 0;
    if (STU.sfx) {
      stuSfxEnsure();
      stuSfxTick(0.62, true, 1, 0.5);
    }
    stuSave();
  };
  $("#stuSfxV").onchange = (e) => {
    STU.sfxVol = Math.max(0.06, Math.min(0.24, +e.target.value || 0.24));
    stuSave();
    if (STU.sfx) stuSfxTick(0.5, true, 1, 0.4);
  };
  $("#stuSfxTry").onclick = () => {
    if (!STU.sfx) {
      STU.sfx = 1;
      $("#stuSfx").checked = true;
      stuSave();
    }
    stuSfxPreview();
  };
  $("#stuRotAll").onchange = (e) => {
    if (e.target.checked) stuSfxEnsure();
    rotKeys().forEach((k) => {
      rs(k).spin = e.target.checked;
    });
    if (!e.target.checked) stuSfxClunk();
    STU.rotUI();
    stuRotStart();
  };
  $("#stuRotZ").onclick = () => {
    Object.values(STU.rot).forEach((r) => {
      r.a = 0;
      r.spin = false;
    });
    STU_SFX.autoAcc = 0;
    stuRotApply();
    stuFitView();
    stuSfxClunk();
    STU.rotUI();
  };
  $("#stuGR").onclick = () => stuGestSet(STU.gest === "rot" ? "" : "rot");
  $("#stuGP").onclick = () => stuGestSet(STU.gest === "pan" ? "" : "pan");
  $("#stuFit").onclick = () => stuFitView();
  $("#stuFitFloat").onclick = (e) => {
    e.stopPropagation();
    stuFitView();
  };
  $$(".stu-lock[data-lock]", pane).forEach(
    (b) =>
      (b.onclick = (e) => {
        e.stopPropagation();
        stuWorkCycleRing(b.dataset.lock);
      }),
  );
  $("#stuCalcCombo").onclick = () => stuWorkApplyManual();
  $("#stuQuickA").onclick = () => stuWorkCapture("A");
  $("#stuQuickB").onclick = () => stuWorkCapture("B");
  $("#stuQuickCmp").onclick = () => stuWorkCompare();
  $("#stuQuickSnap").onclick = () => stuWorkSnapshotSave();
  stuWorkRender();

  $$(".stu-sw input", pane).forEach(
    (c) =>
      (c.onchange = () => {
        STU.on[c.dataset.k] = c.checked ? 1 : 0;
        STU.solo = null;
        stuSave();
        sync();
        studioRender();
        stuWorkRender();
      }),
  );
  $$(".solo", pane).forEach(
    (b) =>
      (b.onclick = () => {
        STU.solo = STU.solo === b.dataset.solo ? null : b.dataset.solo;
        sync();
        studioRender();
      }),
  );
  $$("#stuOl .chip", pane).forEach(
    (b) =>
      (b.onclick = () => {
        STU.ol[b.dataset.ol] = STU.ol[b.dataset.ol] ? 0 : 1;
        stuSave();
        sync();
        studioRender();
      }),
  );
  $$("[data-pre]", pane).forEach(
    (b) =>
      (b.onclick = () => {
        const p = STU_PRE[+b.dataset.pre][1];
        Object.keys(STU.on).forEach((k) => (STU.on[k] = 0));
        STU_DISKS.forEach((d) => (STU.on[d.k] = p[d.k] ? 1 : 0));
        STU.on.orig = p.orig ? 1 : 0;
        STU.solo = null;
        stuSave();
        sync();
        studioRender();
      }),
  );
  $("#stuFs").onchange = (e) => {
    STU.fs = +e.target.value;
    stuSave();
    studioRender();
  };
  $("#stuSi").onchange = (e) => {
    STU.si = e.target.checked ? 1 : 0;
    stuSave();
    studioRender();
  };
  const zoom = (f, cx = null, cy = null) => {
    const st = $("#stuStage"),
      sc = $("#stuScroll"),
      old = STU.zoom,
      nz = Math.max(1, Math.min(5, +(old * f).toFixed(3)));
    if (Math.abs(nz - old) < 0.0001) return;
    let u = 0.5,
      v = 0.5,
      ow = 0,
      oh = 0;
    if (st && cx != null && cy != null) {
      const r = st.getBoundingClientRect();
      ow = r.width;
      oh = r.height;
      if (ow > 0 && oh > 0) {
        u = Math.max(0, Math.min(1, (cx - r.left) / ow));
        v = Math.max(0, Math.min(1, (cy - r.top) / oh));
      }
    }
    STU.zoom = nz;
    if (ow > 0 && oh > 0 && cx != null && cy != null) {
      const ratio = nz / old;
      STU.pan.x += (u - 0.5) * ow * (1 - ratio);
      STU.pan.y += (v - 0.5) * oh * (1 - ratio);
    }
    stuSave();
    sync();
    stuPanApply();
    if (sc) sc.classList.add("edge-show");
  };
  $("#stuZp").onclick = () => zoom(1.25);
  $("#stuZm").onclick = () => zoom(0.8);
  $("#stuScroll").addEventListener(
    "wheel",
    (e) => {
      e.preventDefault();
      zoom(e.deltaY < 0 ? 1.12 : 0.893, e.clientX, e.clientY);
    },
    { passive: false },
  );
  $("#stuSpin").onclick = async () => {
    STU.spinAt = Date.now();
    STU.pendingSource = "巨盘 · 此刻综合推演";
    studioRender();
    try {
      await startDerive("qimen");
    } catch (e) {
      console.error(e);
    }
    STU.spinAt = Date.now();
    studioRender();
  };
  $("#stuLrSpin").onclick = () => {
    const t = $("#stuSvg .stu-tian");
    if (!t) return toast("请先打开“大六壬 · 天地盘”");
    t.classList.remove("spin2");
    void t.getBoundingClientRect();
    t.classList.add("spin2");
  };
  pane.addEventListener("click", (e) => {
    const b = e.target.closest("[data-zy]");
    if (b) {
      const id = b.dataset.zy;
      zyOpen(id.split("").map(Number), [], "盘库");
      return;
    }
    const t = e.target.closest("[data-stime]");
    if (t) {
      const m = t.dataset.stime.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/);
      if (m) {
        stuWorkSetCiv(
          { y: +m[1], m: +m[2], d: +m[3], h: +m[4], mi: +m[5], s: 0 },
          "巨盘 · 条件搜索候选",
        );
        stuInfoAuto(true);
        stuWorkRender();
      }
      return;
    }
    const c = e.target.closest("[data-chain]");
    if (c) {
      stuWorkChain(c.dataset.chain);
      return;
    }
    const rr = e.target.closest("[data-rules]");
    if (rr) {
      stuWorkRules();
      return;
    }
  });
  getCap("downloads")
    .then((ok) => {
      if (!ok) return;
      const bar = $(".stu-bar", pane);
      if (!bar || $("#stuExpSvg")) return;
      const sp = document.createElement("span");
      sp.className = "stu-exp";
      sp.innerHTML =
        '<button type="button" class="gbtn sm" id="stuExpSvg">导出 SVG</button><button type="button" class="gbtn sm" id="stuExpPng">导出 PNG</button>';
      bar.appendChild(sp);
      $("#stuExpSvg").onclick = () => stuExport("svg").catch(() => {});
      $("#stuExpPng").onclick = () => stuExport("png").catch(() => {});
    })
    .catch(() => {});
  sync();
}
function stuOrigLock(on) {
  const svg = $("#dial");
  if (!svg) return;
  if (on) {
    /* 进入巨盘前把主盘自身的 pan/zoom 归零；进入后只随巨盘整体移动，不允许单独漂移。 */
    try {
      const s = PZ.get(svg);
      if (s) {
        s.x = s.base.x;
        s.y = s.base.y;
        s.w = s.base.w;
        s.h = s.base.h;
        s.z = 1;
        s.drag = false;
        s.moved = false;
        pzApply(svg, s);
      }
    } catch (_) {}
    svg.classList.remove("pz-dragging", "pz-svg");
    delete svg.dataset.panzoom;
    delete svg.dataset.pzMoved;
    svg.dataset.stuLocked = "1";
    try {
      svg.releasePointerCapture &&
        [...((svg.getPointerCapture && []) || [])].forEach((id) => svg.releasePointerCapture(id));
    } catch (_) {}
  } else {
    delete svg.dataset.stuLocked;
    /* 回到首页后重新接回通用圆盘交互。 */
    requestAnimationFrame(() => {
      try {
        pzScan(svg);
      } catch (_) {}
    });
  }
}
function studioEnter() {
  if (STU.active) return;
  try {
    if ($("#zoomModal") && !$("#zoomModal").hidden) closeZoom();
  } catch (e) {}
  stuUI();
  stuDetachGenericPZ();
  STU.active = true;
  STU.prevLayer = dial && dial.x ? dial.x.layer : "lp";
  const box = $("#stuOrig"),
    svg = $("#dial"),
    fix = $("#dialFix");
  /* 先复位主盘自身的查看偏移，再移入巨盘并锁定。 */
  try {
    if (svg) pzReset(svg);
  } catch (_) {}
  box.appendChild(svg);
  if (fix) box.appendChild(fix);
  stuOrigLock(true);
  document.body.classList.add("studio-mode");
  STU.infoMode = "auto";
  STU.sync();
  studioRender();
  stuInfoAuto(true);
  try {
    stuWorkRender();
  } catch (_) {}
}
function studioLeave() {
  if (!STU.active) return;
  try {
    stuWorkPlayStop();
  } catch (_) {}
  STU.active = false;
  const svg = $("#dial"),
    fix = $("#dialFix"),
    box = $(".dialbox");
  stuOrigLock(false);
  if (box && svg) {
    box.insertBefore(svg, box.firstChild);
    if (fix) box.insertBefore(fix, svg.nextSibling);
  }
  document.body.classList.remove("studio-mode");
  try {
    setDialLayer(STU.prevLayer || "lp");
  } catch (e) {}
}
function studioSync(id) {
  if (id === "studio") studioEnter();
  else if (STU.active) studioLeave();
}

/* ---- 盘库导出(原盘 + 各圆盘合成) ---- */
async function stuExport(kind) {
  if (!R || !STU.active) return;
  const svg = $("#stuSvg"),
    clone = svg.cloneNode(true),
    src = [svg, ...svg.querySelectorAll("*")],
    dst = [clone, ...clone.querySelectorAll("*")];
  const props = [
    "fill",
    "fill-opacity",
    "stroke",
    "stroke-width",
    "stroke-opacity",
    "stroke-dasharray",
    "opacity",
    "font-size",
    "font-family",
    "font-weight",
    "letter-spacing",
    "text-anchor",
    "dominant-baseline",
    "display",
    "visibility",
  ];
  src.forEach((el, i) => {
    const cs = getComputedStyle(el);
    let st = "";
    props.forEach((p) => {
      const v = cs.getPropertyValue(p);
      if (v) st += `${p}:${v};`;
    });
    dst[i].setAttribute("style", st);
    dst[i].removeAttribute("class");
  });
  const scale = kind === "png" ? 1.5 : 1,
    out = document.createElementNS(SV, "svg");
  out.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  out.setAttribute("viewBox", "-800 -800 1600 1600");
  out.setAttribute("width", 1600 * scale);
  out.setAttribute("height", 1600 * scale);
  const bgc = getComputedStyle(document.body).backgroundColor,
    bg = document.createElementNS(SV, "rect");
  ["x", "y"].forEach((k) => bg.setAttribute(k, -800));
  bg.setAttribute("width", 1600);
  bg.setAttribute("height", 1600);
  bg.setAttribute("fill", bgc === "rgba(0, 0, 0, 0)" ? "#0b0a12" : bgc);
  out.appendChild(bg);
  const o = stuLayout().find((d) => d.k === "orig");
  if (o) {
    const doc = new DOMParser().parseFromString(dialSvgString(1), "image/svg+xml").documentElement,
      w = 816 * (o.r1 / stuOrigOuterRadius());
    ["width", "height"].forEach((k) => doc.setAttribute(k, w));
    doc.setAttribute("x", -w / 2);
    doc.setAttribute("y", -w / 2);
    out.appendChild(document.importNode(doc, true));
  }
  [...clone.childNodes].forEach((n) => out.appendChild(n));
  const str = new XMLSerializer().serializeToString(out),
    nm = `天机盘-盘库-${stamp()}`;
  if (kind === "svg") {
    await saveFile(nm + ".svg", str);
    return;
  }
  const img = new Image();
  await new Promise((ok, no) => {
    img.onload = ok;
    img.onerror = () => no(new Error("渲染失败"));
    img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(str);
  }).catch((e) => {
    toast("PNG 渲染失败,可改用 SVG");
    throw e;
  });
  const cv = document.createElement("canvas");
  cv.width = cv.height = 2400;
  cv.getContext("2d").drawImage(img, 0, 0, 2400, 2400);
  const blob = await new Promise((ok) => cv.toBlob(ok, "image/png"));
  if (blob) await saveFile(nm + ".png", blob);
}

/* ---- 单环转动动画 ---- */
function stuRotApply() {
  $$("#stuSvg .stu-disk").forEach((g) => {
    const r = STU.rot[g.dataset.k];
    if (r && r.a) g.style.transform = `rotate(${r.a.toFixed(2)}deg)`;
    else g.style.transform = "";
  });
}
function stuRotStart() {
  if (STU._raf) return;
  let t0 = performance.now();
  const tick = (ts) => {
    STU._raf = 0;
    if (!STU.active) return;
    const dt = Math.min(0.1, (ts - t0) / 1000);
    t0 = ts;
    let any = false,
      maxStep = 0,
      maxV = 0,
      dir = 1,
      det = false;
    Object.entries(STU.rot).forEach(([k, r]) => {
      if (r.spin && !REDUCE) {
        const prev = r.a,
          step = r.dir * r.v * dt;
        r.a = (r.a + step) % 360;
        any = true;
        if (Math.abs(step) > maxStep) {
          maxStep = Math.abs(step);
          dir = r.dir;
        }
        maxV = Math.max(maxV, Math.abs(r.v || 0));
        if (
          Math.floor((((prev % 360) + 360) % 360) / 15) !==
          Math.floor((((r.a % 360) + 360) % 360) / 15)
        )
          det = true;
      }
    });
    if (any) {
      const norm = Math.max(0, Math.min(1, maxV / 18)),
        gap = 5.3 - 3.1 * norm;
      STU_SFX.autoAcc += maxStep;
      if (det) {
        stuSfxTick(0.34 + 0.58 * norm, true, dir, norm);
        STU_SFX.autoAcc = 0;
      } else if (STU_SFX.autoAcc >= gap) {
        stuSfxTick(0.18 + 0.6 * norm, false, dir, norm);
        STU_SFX.autoAcc %= gap;
      }
      stuRotApply();
      const k = STU.rotSel,
        r = k && STU.rot[k];
      const el = $("#stuAng");
      if (el && r) el.textContent = `展示转角 ${(((r.a % 360) + 360) % 360).toFixed(0)}°`;
      STU._raf = requestAnimationFrame(tick);
    }
  };
  STU._raf = requestAnimationFrame(tick);
}
setInterval(() => {
  try {
    if (STU.active && STU.obs.mode === "now") studioRender();
  } catch (e) {}
}, 60000);

/* ---- 拖转环带 / 平移大盘 ---- */
function stuDetachGenericPZ() {
  const svg = $("#stuSvg");
  if (!svg) return;
  /* 兼容旧版本已经给 #stuSvg 写入过的通用 viewBox/pz 状态。进入巨盘交互时彻底清掉。 */
  try {
    if (typeof PZ !== "undefined" && PZ.delete) PZ.delete(svg);
  } catch (_) {}
  svg.classList.remove("pz-svg", "pz-dragging");
  delete svg.dataset.panzoom;
  delete svg.dataset.pzMoved;
  svg.setAttribute("viewBox", "-800 -800 1600 1600");
}
function stuGestSet(m) {
  stuDetachGenericPZ();
  STU.gest = m;
  const sc = $("#stuScroll");
  if (sc) {
    sc.classList.toggle("g-rot", m === "rot");
    sc.classList.toggle("g-pan", m === "pan");
  }
  [
    ["#stuGR", "rot"],
    ["#stuGP", "pan"],
  ].forEach(([q, k]) => {
    const b = $(q);
    if (b) {
      b.classList.toggle("on", m === k);
      b.setAttribute("aria-pressed", m === k ? "true" : "false");
    }
  });
}
function stuPanApply() {
  const st = $("#stuStage");
  if (st)
    st.style.transform =
      STU.pan.x || STU.pan.y
        ? `translate(${STU.pan.x.toFixed(1)}px,${STU.pan.y.toFixed(1)}px)`
        : "";
}
function stuPolar(e) {
  const st = $("#stuStage"),
    r = st.getBoundingClientRect(),
    k = 1600 / r.width,
    dx = (e.clientX - (r.left + r.width / 2)) * k,
    dy = (e.clientY - (r.top + r.height / 2)) * k;
  return { r: Math.hypot(dx, dy), a: (Math.atan2(dy, dx) * 180) / Math.PI };
}
function stuDiskAt(rr) {
  const arr = stuLayout();
  return arr.find((d) => d.k !== "orig" && rr >= d.r0 && rr <= d.r1) || null;
}
(function () {
  let G = null,
    swallow = false;
  const clearHold = (g) => {
    if (g && g.timer) {
      clearTimeout(g.timer);
      g.timer = 0;
    }
  };
  document.addEventListener(
    "pointerdown",
    (e) => {
      if (!STU.active || e.button > 0) return;
      const st = e.target.closest && e.target.closest("#stuStage");
      if (!st) return;
      const p = stuPolar(e),
        d = stuDiskAt(p.r);
      if (STU.gest === "pan") {
        G = {
          m: "pan",
          x: e.clientX,
          y: e.clientY,
          px: STU.pan.x,
          py: STU.pan.y,
          moved: false,
          id: e.pointerId,
        };
        $("#stuScroll") && $("#stuScroll").classList.add("view-drag");
        try {
          st.setPointerCapture(e.pointerId);
        } catch (_) {}
        return;
      }
      if (STU.gest === "rot" && d) {
        /* 拖转环带时只旋转外环；原盘区不会进入 rot。 */
        stuSfxEnsure();
        G = {
          m: "rot",
          k: d.k,
          a: p.a,
          x: e.clientX,
          y: e.clientY,
          moved: false,
          id: e.pointerId,
          was: !!(STU.rot[d.k] && STU.rot[d.k].spin),
          panX: STU.pan.x,
          panY: STU.pan.y,
          sAcc: 0,
          sTs: performance.now(),
        };
        try {
          st.setPointerCapture(e.pointerId);
        } catch (_) {}
        return;
      }
      /* 默认查看手势：按住约 180ms 后进入“拖动画面”。这是观察视角平移，不会改变原盘内部坐标。 */
      G = {
        m: "hold",
        x: e.clientX,
        y: e.clientY,
        px: STU.pan.x,
        py: STU.pan.y,
        moved: false,
        id: e.pointerId,
        armed: false,
        timer: 0,
      };
      G.timer = setTimeout(() => {
        if (!G || G.id !== e.pointerId || G.m !== "hold") return;
        G.armed = true;
        $("#stuScroll") && $("#stuScroll").classList.add("view-drag");
        try {
          st.setPointerCapture(e.pointerId);
        } catch (_) {}
      }, 180);
    },
    true,
  );
  document.addEventListener(
    "pointermove",
    (e) => {
      if (!G || e.pointerId !== G.id) return;
      const dx = e.clientX - G.x,
        dy = e.clientY - G.y,
        dist = Math.hypot(dx, dy);
      if (G.m === "hold") {
        if (!G.armed) {
          if (dist > 7) {
            clearHold(G);
            G = null;
          }
          return;
        }
        if (!G.moved && dist < 3) return;
        G.moved = true;
        e.preventDefault();
        STU.pan = { x: G.px + dx, y: G.py + dy };
        stuPanApply();
        return;
      }
      /* 拖转环带优先响应：1.35px 即开始跟手；平移仍保留较小防误触阈值。 */
      const gate = G.m === "rot" ? 1.35 : 3;
      if (!G.moved && dist < gate) return;
      G.moved = true;
      e.preventDefault();
      if (G.m === "pan") {
        STU.pan = { x: G.px + dx, y: G.py + dy };
        stuPanApply();
        return;
      }
      if (STU.pan.x !== G.panX || STU.pan.y !== G.panY) {
        STU.pan = { x: G.panX, y: G.panY };
        stuPanApply();
      }
      const p = stuPolar(e);
      let da = p.a - G.a;
      if (da > 180) da -= 360;
      if (da < -180) da += 360;
      G.a = p.a;
      const r = STU.rot[G.k] || (STU.rot[G.k] = { a: 0, dir: 1, spin: false, v: STU.rotSpd }),
        prevA = r.a;
      r.spin = false;
      r.a = (r.a + da) % 360;
      STU.rotSel = G.k;
      /* 先立即更新画面，再排队生成声音，避免 Web Audio 节点创建阻塞鼠标手势。 */
      stuRotApply();
      const el = $("#stuAng");
      if (el) el.textContent = `展示转角 ${(((r.a % 360) + 360) % 360).toFixed(0)}°`;
      const nts = performance.now(),
        sdt = Math.max(8, nts - (G.sTs || nts)) / 1000,
        spd = Math.abs(da) / sdt,
        norm = Math.max(0, Math.min(1, spd / 210)),
        gap = 5.0 - 2.7 * norm;
      G.sTs = nts;
      G.sAcc = (G.sAcc || 0) + Math.abs(da);
      const p0 = ((prevA % 360) + 360) % 360,
        p1 = ((r.a % 360) + 360) % 360,
        det = Math.floor(p0 / 15) !== Math.floor(p1 / 15);
      if (det) {
        stuSfxDragQueue(0.34 + 0.6 * norm, true, da < 0 ? -1 : 1, norm);
        G.sAcc = 0;
      } else if (G.sAcc >= gap) {
        stuSfxDragQueue(0.17 + 0.58 * norm, false, da < 0 ? -1 : 1, norm);
        G.sAcc %= gap;
      }
    },
    true,
  );
  const end = (e) => {
    if (!G || e.pointerId !== G.id) return;
    const g = G;
    clearHold(g);
    G = null;
    const sc = $("#stuScroll");
    if (sc) sc.classList.remove("view-drag");
    if (g.moved) {
      swallow = true;
      setTimeout(() => {
        swallow = false;
      }, 0);
      if (g.m === "rot") {
        stuWorkAfterRotate(g.k);
        stuSfxClunk();
        if (STU.rotUI) STU.rotUI();
      }
      return;
    }
    if (g.m === "rot" && g.was) {
      const r = STU.rot[g.k];
      if (r) {
        r.spin = false;
        STU.rotSel = g.k;
        if (STU.rotUI) STU.rotUI();
      }
    }
  };
  document.addEventListener("pointerup", end, true);
  document.addEventListener("pointercancel", end, true);
  document.addEventListener(
    "click",
    (e) => {
      if (swallow) {
        e.stopPropagation();
        e.preventDefault();
      }
    },
    true,
  );
})();

/* ================= 移植模块:金口诀 · 七政四余 · 太乙神数 · 占断(小六壬/灵签/灵根/数字数理) ================= */
