const REF_PANES = {
  jinkou: () => renderJinkou(R),
  qizheng: () => renderQizheng(R),
  taiyi: () => {
    const h = renderTaiyi(R);
    return h;
  },
  fun: () => renderFun(R),
};
const REF_BIND = { taiyi: () => bindTaiyi(), fun: () => bindFun() };
const REF_BUSY = {};
/* ===== v116 启动性能：核心重页面统一按需渲染 =====
   首页不再一次性构造所有隐藏盘面；点击相应标签时，refRender() 才生成该页。
   R 始终保存最新推演结果，因此延迟渲染不会使用旧数据。 */
Object.assign(REF_PANES, {
  over: () => renderOverview(R),
  guide: () => renderGuide(R),
  astro: () => renderAstro(R),
  bazi: () => renderBazi(R),
  qimen: () => renderQimen(R),
  liuren: () => renderLiuren(R),
  liuyao: () => renderLiuyao(R),
  yi: () => renderYi(R),
  ziwei: () => renderZiwei(R),
  xk: () => renderXuankong(R),
  zeri: () => renderZeri(R),
  hepan: () => renderHepan(R),
});
Object.assign(REF_BIND, {
  over: () => {
    try {
      bindReadings();
    } catch (_) {}
  },
  guide: () => {},
  astro: () => {
    try {
      refDecorate();
    } catch (_) {}
  },
  bazi: () => {
    bindBazi();
    try {
      bindReadings();
    } catch (_) {}
  },
  qimen: () => {},
  liuren: () => {},
  liuyao: () => bindLiuyao(),
  yi: () => bindCast(),
  ziwei: () => bindZiwei(),
  xk: () => bindXuankong(),
  zeri: () => bindZeri(),
  hepan: () => bindHepan(),
});
function refRender(id) {
  const p = $("#pane-" + id);
  if (!p || !R || !REF_PANES[id]) return;
  if (REF_BUSY[id]) return; /* 被移除的输入框失焦会再触发一次 change,避免同一页嵌套重绘 */
  REF_BUSY[id] = 1;
  try {
    const h = REF_PANES[id]();
    if (typeof h === "string") p.innerHTML = h;
    p.dataset.built = "1";
    if (REF_BIND[id]) REF_BIND[id]();
  } catch (e) {
    console.error("ref", id, e);
    p.innerHTML =
      '<div class="panel blk"><p class="note bad">这一页渲染出错:' +
      esc(String(e.message || e)) +
      "</p></div>";
  } finally {
    REF_BUSY[id] = 0;
  }
}
const REF_STATIC = new Set(["house", "review"]); // 含用户输入,不随推演刷新
function refRefresh() {
  Object.keys(REF_PANES).forEach((id) => {
    if (REF_STATIC.has(id)) return;
    const p = $("#pane-" + id);
    if (p && p.classList.contains("on")) refRender(id);
  });
}
/* ---- 占断 ---- */
function renderFun(R) {
  const rl = R && R.lunar ? R.lunar : null,
    m = rl ? rl.month : 1,
    d = rl ? rl.day : 1,
    defH = R && R.bz ? R.bz.pill[3].b + 1 : 1;
  return `<div class="panel blk"><h3 class="sec">占断 · 小六壬 · 灵签 · 灵根 · 数理</h3><p class="note" style="margin-top:0">民间趣味与速断之术。小六壬、灵签源自传统民俗,灵根测试纯属娱乐,数字数理为姓名学引申。称骨、测字、数字能量另见各自页面。</p></div>
  <div class="panel blk"><h3 class="sec">小六壬 · 掐指神通</h3>
    <p class="note" style="margin:0 0 8px">月上起日、日上起时,六宫循环:大安、留连、速喜、赤口、小吉、空亡。断事以<b>时宫</b>为主,月日为辅。默认取当前命盘的农历日与时辰,也可手动指定。</p>
    <div class="kv"><span>农历月 <select id="xlr-m">${Array.from({ length: 12 }, (_, i) => `<option value="${i + 1}"${i + 1 === m ? " selected" : ""}>${i + 1}月</option>`).join("")}</select></span>
    <span>农历日 <select id="xlr-d">${Array.from({ length: 30 }, (_, i) => `<option value="${i + 1}"${i + 1 === d ? " selected" : ""}>${i + 1}日</option>`).join("")}</select></span>
    <span>时辰 <select id="xlr-h">${ZD_ZHI.map((z, i) => `<option value="${i + 1}"${i + 1 === defH ? " selected" : ""}>${z}时</option>`).join("")}</select></span>
    <span>所问 <select id="xlr-q">${["求财", "婚姻", "出行", "疾病", "官讼", "失物"].map((x) => `<option>${x}</option>`).join("")}</select></span></div>
    <button class="gbtn" id="xlrBtn" type="button" style="margin-top:8px">起 课</button><div id="xlrOut" style="margin-top:10px"></div></div>
  <div class="panel blk"><h3 class="sec">灵签 · 心诚则灵</h3>
    <p class="note" style="margin:0 0 8px">默念所求,诚心抽一签。签诗为传统签文,仅供参详;吉签勿骄,凶签勿馁。观音、关帝各百签,另有月老签。</p>
    <div class="kv"><span>签种 <select id="qz-type"><option value="guanyin">观音灵签 · 百签</option><option value="guandi">关帝灵签 · 百签</option><option value="yuelao">月老灵签</option></select></span><span>所求之事 <input id="qz-q" placeholder="如:今年事业" style="width:10em"></span></div>
    <button class="gbtn" id="qzBtn" type="button" style="margin-top:8px">诚 心 抽 签</button><div id="qzOut" style="margin-top:10px"></div></div>
  <div class="panel blk"><h3 class="sec">修仙灵根测试</h3><p class="note" style="margin:0 0 8px">用当前命主八字五行的能量占比,换算成一个修仙梗。单属性突出为天灵根,两种相当为双灵根。纯属娱乐。</p>
    <button class="gbtn" id="lgBtn" type="button">测 灵 根</button><div id="lgOut" style="margin-top:10px"></div></div>
  <div class="panel blk"><h3 class="sec">数字吉凶 · 号码数理</h3><p class="note" style="margin:0 0 8px">取号码后四位除以 80 取余数(余 0 作 80),查八十一数理;并看全号数字之和与数字五行分布。</p>
    <div class="kv"><span>号码 <input id="num-in" inputmode="numeric" placeholder="如手机号或车牌数字" style="width:14em"></span></div>
    <button class="gbtn" id="numBtn" type="button" style="margin-top:8px">测 算</button><div id="numOut" style="margin-top:10px"></div></div>`;
}
function bindFun() {
  const lg = $("#lgBtn");
  if (lg)
    lg.onclick = () => {
      const out = $("#lgOut");
      if (!R || !R.bz) {
        out.innerHTML = lgHTML(null);
        return;
      }
      if (REDUCE) {
        out.innerHTML = lgHTML(R);
        return;
      }
      out.innerHTML = '<p class="note">正在感应天地灵气……</p>';
      setTimeout(() => {
        out.innerHTML = lgHTML(R);
      }, 700);
    };
  const xb = $("#xlrBtn");
  if (xb)
    xb.onclick = () => {
      const m = +$("#xlr-m").value,
        d = +$("#xlr-d").value,
        h = +$("#xlr-h").value,
        q = $("#xlr-q").value,
        r = xlrQi(m, d, h);
      const card = (l, s, main) =>
        `<div class="xlr-c${main ? " main" : ""}"><small>${l}</small><b>${s.n}</b><small>${s.wx} · ${s.col} · ${s.fang}</small><small>${s.time}</small></div>`;
      $("#xlrOut").innerHTML =
        `<div class="xlr-g">${card("月宫(远)", r.yue)}${card("日宫(近)", r.ri)}${card("时宫(急)· 主断", r.shi, 1)}</div><p class="rt" style="font-size:15px;line-height:2">${esc(r.shi.kou)}</p><div class="kv"><span>问${q} <b>${esc(r.shi.fen[q] || "")}</b></span></div><p class="note" style="margin-top:8px">小六壬是民间速断之术,流派口诀差别很大,这里取通行口诀。月看远、日看近、时看急。</p>`;
    };
  const qb = $("#qzBtn");
  if (qb)
    qb.onclick = () => {
      const tp = $("#qz-type").value,
        q = ($("#qz-q").value || "").trim(),
        pool = QIANWEN[tp],
        out = $("#qzOut");
      if (!pool || !pool.length) {
        out.innerHTML = '<p class="note">签文数据尚未载入。</p>';
        return;
      }
      const s = pool[Math.floor(cryptoRand() * pool.length)],
        jc = /上|大吉/.test(s.ji) ? "good" : /下|凶/.test(s.ji) ? "bad" : "mid";
      out.innerHTML = `<div class="kv"><span>${{ guanyin: "观音灵签", guandi: "关帝灵签", yuelao: "月老灵签" }[tp]} <b>第${s.n}签</b></span><span>签等 <b class="${jc}">${esc(s.ji)}</b></span>${q ? `<span>所求 <b>${esc(q)}</b></span>` : ""}</div><p class="qian-poem">${s.shi.map(esc).join("<br>")}</p><p class="note">${esc(s.zhu || "")}</p><p class="note">签以诚心为应,行事终究在人。</p>`;
    };
  const nb = $("#numBtn");
  if (nb)
    nb.onclick = () => {
      const raw = ($("#num-in").value || "").replace(/\D/g, ""),
        out = $("#numOut");
      if (raw.length < 4) {
        out.innerHTML = '<p class="note">请至少输入 4 位数字。</p>';
        return;
      }
      const last4 = raw.slice(-4);
      let r = parseInt(last4, 10) % 80;
      if (r === 0) r = 80;
      const s1 = SL81[r] || ["—", "—"],
        sum = [...raw].reduce((a, c) => a + +c, 0),
        k2 = sum > 81 ? sum % 81 || 81 : sum,
        s2 = SL81[k2] || ["—", "—"];
      const wx5 = {
          1: "水",
          6: "水",
          3: "木",
          8: "木",
          2: "火",
          7: "火",
          4: "金",
          9: "金",
          5: "土",
          0: "土",
        },
        cnt = {};
      [...raw].forEach((c) => {
        const w = wx5[c];
        cnt[w] = (cnt[w] || 0) + 1;
      });
      const cl = (t) => (/吉/.test(t) ? "good" : /凶/.test(t) ? "bad" : "mid");
      out.innerHTML = `<div class="numbox"><span>后四位 <b>${last4}</b></span><span>÷80 余数 <b>${r}</b></span><span>数理 <b class="${cl(s1[0])}">${s1[0]}</b></span><span>全号和 <b>${sum}</b> → 数理 <b class="${cl(s2[0])}">${s2[0]}</b></span></div><p class="rt">后四位数理:${esc(s1[1] || "")}<br>全号和数理:${esc(s2[1] || "")}</p><div class="kv"><span>数字五行 <b>${Object.entries(
        cnt,
      )
        .map(([w, n]) => w + n)
        .join(
          " · ",
        )}</b></span></div><p class="note" style="margin-top:6px">号码数理是民间趣味口径(八十一数理出自姓名学的引申),仅供娱乐;数字能量另见“命理工具”。</p>`;
    };
}

/* =====================================================================
   移植自《天机玄秘》深色版:房屋方位盘 · 河图洛书 · 复盘记录 · 甲子查表 · 古州分野 · 概念辨析
   房屋方位的算法(HouseCore)与河洛数理核对按原作逻辑移植;界面为本站自写。
   ===================================================================== */
/* ---------- 房屋方位 · 核心 ---------- */
const HouseCore = (function () {
  const directions = [
    ["北", "坎", "水"],
    ["东北", "艮", "土"],
    ["东", "震", "木"],
    ["东南", "巽", "木"],
    ["南", "离", "火"],
    ["西南", "坤", "土"],
    ["西", "兑", "金"],
    ["西北", "乾", "金"],
  ];
  const norm = (n) => ((n % 360) + 360) % 360;
  // 下、中、上爻编码。《八宅明镜》游年配对;宅卦取坐方,非向方。
  const guaBits = { 乾: 7, 兑: 6, 离: 5, 震: 4, 巽: 3, 坎: 2, 艮: 1, 坤: 0 };
  const wandering = {
    0: ["伏位", "静处与日常秩序", "stable"],
    1: ["生气", "经营与拓展的传统取象", "favourable"],
    6: ["天医", "安居与照护的传统名称", "favourable"],
    7: ["延年", "协作与长期安排的传统取象", "favourable"],
    3: ["五鬼", "传统列为不利方位", "caution"],
    5: ["六煞", "传统列为不利方位", "caution"],
    4: ["祸害", "传统列为不利方位", "caution"],
    2: ["绝命", "传统列为不利方位", "caution"],
  };
  function direction(deg) {
    const angle = norm(deg),
      index = Math.floor((angle + 22.5) / 45) % 8;
    return {
      angle,
      index,
      name: directions[index][0],
      gua: directions[index][1],
      element: directions[index][2],
    };
  }
  function point(x, y, s) {
    const dx = (x - 0.5) * s.width,
      dy = (y - 0.5) * s.depth;
    if (Math.hypot(dx, dy) < 1e-8)
      return { name: "中宫", gua: "中", element: "土", angle: null, index: -1 };
    return direction(s.bearing + (Math.atan2(dx, -dy) * 180) / Math.PI);
  }
  function door(s) {
    const t = Number(s.doorPosition);
    return s.doorSide === "top"
      ? { x: t, y: 0 }
      : s.doorSide === "bottom"
        ? { x: t, y: 1 }
        : s.doorSide === "left"
          ? { x: 0, y: t }
          : { x: 1, y: t };
  }
  function wealth(s) {
    if (s.shape === "irregular") return [];
    const t = Number(s.doorPosition),
      side = s.doorSide,
      opposite =
        side === "bottom"
          ? [
              { x: 0, y: 0 },
              { x: 1, y: 0 },
            ]
          : side === "top"
            ? [
                { x: 0, y: 1 },
                { x: 1, y: 1 },
              ]
            : side === "left"
              ? [
                  { x: 1, y: 0 },
                  { x: 1, y: 1 },
                ]
              : [
                  { x: 0, y: 0 },
                  { x: 0, y: 1 },
                ];
    return (t < 0.4 ? [opposite[1]] : t > 0.6 ? [opposite[0]] : opposite).map((v) => ({
      ...v,
      direction: point(v.x, v.y, s),
    }));
  }
  function bazhai(s) {
    const sitting = direction(s.bearing + 180),
      homeBits = guaBits[sitting.gua];
    return {
      sitting,
      house: sitting.gua + "宅",
      nearBoundary:
        Math.min(norm(sitting.angle + 22.5) % 45, 45 - (norm(sitting.angle + 22.5) % 45)) < 1,
      cells: directions.map((d, index) => {
        const code = homeBits ^ guaBits[d[1]],
          star = wandering[code];
        return {
          index,
          direction: d[0],
          gua: d[1],
          name: star[0],
          meaning: star[1],
          kind: star[2],
          code,
        };
      }),
    };
  }
  function markerAt(index, s) {
    const a = ((index * 45 - s.bearing) * Math.PI) / 180,
      dx = Math.sin(a),
      dy = -Math.cos(a),
      radius =
        0.7 *
        Math.min(
          Math.abs(dx) < 1e-10 ? Infinity : s.width / 2 / Math.abs(dx),
          Math.abs(dy) < 1e-10 ? Infinity : s.depth / 2 / Math.abs(dy),
        );
    return { x: 0.5 + (dx * radius) / s.width, y: 0.5 + (dy * radius) / s.depth };
  }
  function validate(s) {
    if (
      !Number.isFinite(s.bearing) ||
      s.bearing < 0 ||
      s.bearing > 360 ||
      !Number.isFinite(s.width) ||
      !Number.isFinite(s.depth) ||
      s.width < 1 ||
      s.width > 100 ||
      s.depth < 1 ||
      s.depth > 100
    )
      throw Error("朝向须为 0–360°,尺寸须为 1–100 米。");
    if (
      !["top", "bottom", "left", "right"].includes(s.doorSide) ||
      ![0.2, 0.5, 0.8].includes(Number(s.doorPosition))
    )
      throw Error("请核对入口位置。");
    if (!["regular", "irregular"].includes(s.shape)) throw Error("请核对户型选项。");
    return {
      ...s,
      bearing: norm(s.bearing),
      layer: s.layer === "bazhai" ? "bazhai" : "ming",
      markers: (Array.isArray(s.markers) ? s.markers : [])
        .filter(
          (p) =>
            typeof p?.name === "string" &&
            p.name.trim() &&
            Number.isFinite(p.x) &&
            Number.isFinite(p.y) &&
            p.x >= 0 &&
            p.x <= 1 &&
            p.y >= 0 &&
            p.y <= 1,
        )
        .slice(0, 20)
        .map((p) => ({ name: p.name.slice(0, 30), x: p.x, y: p.y })),
    };
  }
  return { directions, norm, direction, point, door, wealth, bazhai, markerAt, validate };
})();
const HSK = "tianjipan.house.v1";
const HS = Object.assign(
  {
    bearing: 180,
    confirmed: false,
    doorSide: "bottom",
    doorPosition: 0.5,
    shape: "regular",
    width: 8,
    depth: 10,
    layer: "ming",
    markers: [],
    view: 4,
    room: "客厅",
    err: "",
  },
  (() => {
    try {
      return JSON.parse(localStorage.getItem(HSK) || "{}");
    } catch (e) {
      return {};
    }
  })(),
);
const hsSave = () => {
  try {
    localStorage.setItem(
      HSK,
      JSON.stringify({
        bearing: HS.bearing,
        confirmed: HS.confirmed,
        doorSide: HS.doorSide,
        doorPosition: HS.doorPosition,
        shape: HS.shape,
        width: HS.width,
        depth: HS.depth,
        layer: HS.layer,
        markers: HS.markers,
      }),
    );
  } catch (e) {}
};
const HS_ROOMS = ["客厅", "主卧", "次卧", "厨房", "卫生间", "书房", "阳台", "工作区"];
function hsSpec() {
  return HouseCore.validate({
    bearing: +HS.bearing,
    width: +HS.width,
    depth: +HS.depth,
    doorSide: HS.doorSide,
    doorPosition: +HS.doorPosition,
    shape: HS.shape,
    layer: HS.layer,
    markers: HS.markers,
  });
}
function hsSvg(s) {
  const bz = HouseCore.bazhai(s),
    k = 270 / Math.max(s.width, s.depth),
    W = s.width * k,
    H = s.depth * k,
    cx = 260,
    cy = 260,
    P2 = (r, a) => [cx + r * Math.sin((a * Math.PI) / 180), cy - r * Math.cos((a * Math.PI) / 180)];
  let h = `<circle cx="${cx}" cy="${cy}" r="226" class="hs-ring"/>`;
  bz.cells.forEach((c) => {
    const a = c.index * 45 - s.bearing,
      [x1, y1] = P2(226, a - 22.5),
      [x2, y2] = P2(226, a + 22.5);
    if (s.layer === "bazhai")
      h += `<path d="M${cx},${cy}L${x1.toFixed(1)},${y1.toFixed(1)}A226,226 0 0 1 ${x2.toFixed(1)},${y2.toFixed(1)}Z" class="hs-w ${c.kind}"/>`;
    h += `<line x1="${cx}" y1="${cy}" x2="${x1.toFixed(1)}" y2="${y1.toFixed(1)}" class="hs-ln"/>`;
    const [lx, ly] = P2(246, a);
    h += `<text x="${lx.toFixed(1)}" y="${ly.toFixed(1)}" class="hs-dir${c.index === HS.view ? " on" : ""}" data-v="${c.index}" text-anchor="middle" dominant-baseline="central">${c.direction}</text>`;
    if (s.layer === "bazhai") {
      const [tx, ty] = P2(185, a);
      h += `<text x="${tx.toFixed(1)}" y="${ty.toFixed(1)}" class="hs-st ${c.kind}" text-anchor="middle" dominant-baseline="central">${c.name}</text>`;
    }
  });
  h += `<rect x="${cx - W / 2}" y="${cy - H / 2}" width="${W}" height="${H}" class="hs-rect${s.shape === "irregular" ? " irr" : ""}"/>`;
  const d = HouseCore.door(s),
    dx = cx + (d.x - 0.5) * W,
    dy = cy + (d.y - 0.5) * H;
  h += `<circle cx="${dx}" cy="${dy}" r="7" class="hs-door"/><text x="${dx}" y="${dy + (d.y >= 1 ? 20 : d.y <= 0 ? -12 : 0)}" class="hs-dt" text-anchor="middle">门</text>`;
  if (s.layer === "ming")
    HouseCore.wealth(s).forEach((w) => {
      const x = cx + (w.x - 0.5) * W,
        y = cy + (w.y - 0.5) * H;
      h += `<circle cx="${x}" cy="${y}" r="9" class="hs-wealth"/><text x="${x}" y="${y + 1}" class="hs-wt" text-anchor="middle" dominant-baseline="central">财</text>`;
    });
  s.markers.forEach((m) => {
    const x = cx + (m.x - 0.5) * W,
      y = cy + (m.y - 0.5) * H;
    h += `<g class="hs-mk"><circle cx="${x}" cy="${y}" r="5"/><text x="${x}" y="${y - 9}" text-anchor="middle">${esc(m.name)}</text></g>`;
  });
  const [tx, ty] = P2(0, 0);
  h += `<text x="${cx}" y="22" text-anchor="middle" class="hs-top">图上方 = 向方 ${s.bearing.toFixed(1)}° ${HouseCore.direction(s.bearing).name}</text>`;
  return `<svg viewBox="0 0 520 520" id="hsSvg" role="img" aria-label="房屋方位示意盘">${h}</svg>`;
}
function renderHouse() {
  const pane = $("#pane-house");
  if (!pane) return;
  pane.dataset.built = "1";
  let s,
    err = "";
  try {
    s = hsSpec();
  } catch (e) {
    err = e.message;
  }
  const bz = s ? HouseCore.bazhai(s) : null,
    vd = HouseCore.directions[HS.view];
  const sel = (id, vals, cur) =>
    `<select id="${id}">${vals.map(([v, t]) => `<option value="${v}"${String(v) === String(cur) ? " selected" : ""}>${t}</option>`).join("")}</select>`;
  pane.innerHTML = `<div class="panel blk"><h3 class="sec">房屋方位盘 · 坐向与八宅</h3>
  <p class="note" style="margin-top:0">把户型画成一张示意图,按图上方的朝向标出八个方位,再按入口位置给出“明财位”,或按《八宅明镜》按坐方定宅卦、配游年。这是传统方位示意,不是风水断语。</p>
  ${err ? `<p class="note bad">${esc(err)}</p>` : ""}${s && !HS.confirmed ? '<p class="note bad">示例朝向,尚未确认实际住宅方向。请先量得住宅向方(从屋内向外),再勾选下面的确认项。</p>' : ""}
  <div class="hs-wrap"><div class="hs-form">
    <label>图上方的朝向 · 0°北 / 90°东<input type="number" id="hsB" min="0" max="360" step="0.5" value="${HS.bearing}"></label>
    <div class="row3"><button class="gbtn sm" type="button" id="hsCp">带入罗盘读数</button><label class="chk"><input type="checkbox" id="hsCf"${HS.confirmed ? " checked" : ""}> 已确认图上方是住宅的向方(从屋内向外)</label></div>
    <p class="dim sm" style="margin:0">图纸上方不一定是住宅正面,入户门也不一定在向方。测向后再确认。</p>
    <label>空间入口在哪一侧${sel(
      "hsDs",
      [
        ["bottom", "图下方"],
        ["top", "图上方"],
        ["left", "图左侧"],
        ["right", "图右侧"],
      ],
      HS.doorSide,
    )}</label>
    <label>门的位置${sel(
      "hsDp",
      [
        [0.2, "偏左 / 偏上"],
        [0.5, "居中"],
        [0.8, "偏右 / 偏下"],
      ],
      HS.doorPosition,
    )}</label>
    <div class="row3"><label>横向宽度(米)<input type="number" id="hsW" min="1" max="100" step="0.5" value="${HS.width}"></label><label>纵向进深(米)<input type="number" id="hsD" min="1" max="100" step="0.5" value="${HS.depth}"></label></div>
    <label>户型${sel(
      "hsSh",
      [
        ["regular", "基本方正,门进入该空间"],
        ["irregular", "不规则 / 有长走廊 / 门不直接入厅"],
      ],
      HS.shape,
    )}</label>
    <div class="hs-layers"><button type="button" class="gbtn sm${HS.layer === "ming" ? " on" : ""}" data-ly="ming">明财位</button><button type="button" class="gbtn sm${HS.layer === "bazhai" ? " on" : ""}" data-ly="bazhai">八宅游年</button></div>
    <label>当前查看方位${sel(
      "hsV",
      HouseCore.directions.map((d, i) => [i, `${d[0]} · ${d[1]}`]),
      HS.view,
    )}</label>
    <div class="row3"><select id="hsRm">${HS_ROOMS.map((r) => `<option${r === HS.room ? " selected" : ""}>${r}</option>`).join("")}</select><button class="gbtn sm" type="button" id="hsAdd">标在当前方位</button></div>
    <div class="row3"><button class="gbtn sm" type="button" id="hsExp">导出布局</button><button class="gbtn sm" type="button" id="hsRst">重置示意盘</button></div>
  </div><div class="hs-fig">${s ? hsSvg(s) : ""}</div></div>
  ${
    s
      ? `<div class="hs-read"><div class="kv"><span>向方 <b>${HouseCore.direction(s.bearing).name}(${s.bearing.toFixed(1)}°)</b></span><span>坐方 <b>${bz.sitting.name}</b></span><span>宅卦 <b>${bz.house}</b></span>${
          s.layer === "ming"
            ? `<span>明财位 <b>${
                s.shape === "irregular"
                  ? "不自动定位"
                  : HouseCore.wealth(s)
                      .map((w) => w.direction.name)
                      .join("、")
              }</b></span>`
            : ""
        }</div>${bz.nearBoundary ? '<p class="note bad">坐向接近两个方位的分界,宜复测后再定宅卦。</p>' : ""}
   ${s.layer === "bazhai" ? `<table class="tbl sm"><thead><tr><th>方位</th><th>卦</th><th>游年</th><th>传统取象</th></tr></thead><tbody>${bz.cells.map((c) => `<tr class="${c.index === HS.view ? "on" : ""}"><td>${c.direction}</td><td>${c.gua}</td><td class="hs-st ${c.kind}">${c.name}</td><td class="dim">${c.meaning}</td></tr>`).join("")}</tbody></table>` : ""}
   ${s.markers.length ? `<h4 class="gl">已标记的房间</h4><div class="pills">${s.markers.map((m, i) => `<span class="pill">${esc(m.name)} · ${HouseCore.point(m.x, m.y, s).name}${HouseCore.point(m.x, m.y, s).gua && HouseCore.point(m.x, m.y, s).gua !== "中" ? "(" + HouseCore.point(m.x, m.y, s).gua + ")" : ""}${s.layer === "bazhai" ? " · " + (bz.cells[HouseCore.point(m.x, m.y, s).index] || { name: "" }).name : ""} <button type="button" class="lnk" data-rm="${i}">移除</button></span>`).join("")}</div>` : ""}</div>`
      : ""
  }
  <details class="ai-set"><summary>取法依据与实测方法</summary><div class="rt dim"><p><b>先定地理方向:</b>0°北、90°东、180°南、270°西。图纸上方的朝向独立于入口;矩形中心到房间标记的向量按宽度、进深换算,不能只按屏幕角度读方位。住宅向方是从屋内向外的朝向,坐方为其反向 180°。磁北读数与真北图纸若采用不同基准,须先统一。</p><p><b>明财位:</b>采用常见的入口远端斜对角法。入口偏侧取对角,居中列两个候选;角落随门位改变,地理方位随设向改变。适用于方正且入口直接进入该空间的示意;有玄关、长走廊或不规则户型时不自动定位。</p><p><b>八宅游年:</b>依《八宅明镜》以坐方定宅卦,再分配生气、天医、延年、伏位、五鬼、六煞、祸害、绝命。这里展示宅卦游年,不将生气直接等同于明财位,也不混入个人命卦、年飞星或需要建造年份的玄空宅盘。</p><p>罗盘带入的是当次读数,需面对已确定的住宅向方测量,避开金属、电器并复测。矩形中心仅为本示意的参照;缺角、复层与复杂户型不能据此精确确定立极。财位与游年吉凶为传统分类,不代表实际收益或健康结果;家具布置先保证采光、通行与安全。</p></div></details></div>`;
  const re = () => {
    hsSave();
    renderHouse();
  };
  const num = (id, k) =>
    ($(id).onchange = (e) => {
      HS[k] = +e.target.value;
      re();
    });
  num("#hsB", "bearing");
  num("#hsW", "width");
  num("#hsD", "depth");
  $("#hsDs").onchange = (e) => {
    HS.doorSide = e.target.value;
    re();
  };
  $("#hsDp").onchange = (e) => {
    HS.doorPosition = +e.target.value;
    re();
  };
  $("#hsSh").onchange = (e) => {
    HS.shape = e.target.value;
    re();
  };
  $("#hsCf").onchange = (e) => {
    HS.confirmed = e.target.checked;
    re();
  };
  $("#hsV").onchange = (e) => {
    HS.view = +e.target.value;
    re();
  };
  $("#hsRm").onchange = (e) => {
    HS.room = e.target.value;
  };
  $("#hsCp").onclick = () => {
    const v = parseFloat(($("#cpDeg") || {}).value);
    if (!isFinite(v)) {
      toast("罗盘当前没有读数");
      return;
    }
    HS.bearing = ((v % 360) + 360) % 360;
    HS.confirmed = false;
    re();
    toast("已带入罗盘读数,请确认这是住宅的向方");
  };
  $$("[data-ly]", pane).forEach(
    (b) =>
      (b.onclick = () => {
        HS.layer = b.dataset.ly;
        re();
      }),
  );
  $$(".hs-dir", pane).forEach(
    (t) =>
      (t.onclick = () => {
        HS.view = +t.dataset.v;
        re();
      }),
  );
  $("#hsAdd").onclick = () => {
    try {
      const sp = hsSpec(),
        p = HouseCore.markerAt(HS.view, sp);
      if (HS.markers.length >= 20) {
        toast("最多 20 个标记");
        return;
      }
      HS.markers.push({ name: HS.room, x: p.x, y: p.y });
      re();
    } catch (e) {
      toast(e.message);
    }
  };
  $$("[data-rm]", pane).forEach(
    (b) =>
      (b.onclick = () => {
        HS.markers.splice(+b.dataset.rm, 1);
        re();
      }),
  );
  $("#hsRst").onclick = () => {
    Object.assign(HS, {
      bearing: 180,
      confirmed: false,
      doorSide: "bottom",
      doorPosition: 0.5,
      shape: "regular",
      width: 8,
      depth: 10,
      layer: "ming",
      markers: [],
      view: 4,
    });
    re();
  };
  $("#hsExp").onclick = () => {
    try {
      saveFile("房屋方位布局.json", JSON.stringify(hsSpec(), null, 1));
    } catch (e) {
      toast(e.message);
    }
  };
}
/* ---------- 河图 · 洛书 ---------- */
const HT_PL = [
  { x: 260, y: 410, a: 1, b: 6, w: "水", dir: "北" },
  { x: 260, y: 110, a: 2, b: 7, w: "火", dir: "南" },
  { x: 410, y: 260, a: 3, b: 8, w: "木", dir: "东" },
  { x: 110, y: 260, a: 4, b: 9, w: "金", dir: "西" },
  { x: 260, y: 260, a: 5, b: 10, w: "土", dir: "中" },
];
const HT_LS = [4, 9, 2, 3, 5, 7, 8, 1, 6];
const HTS = { view: "hetu", sel: null, yearStar: false, monthStar: false };
function htDots(n, x, y) {
  return Array.from({ length: n }, (_, i) => {
    const col = n === 10 ? 5 : Math.min(n, 5),
      rows = Math.ceil(n / col),
      cx = x + ((i % col) - (col - 1) / 2) * 15,
      cy = y + (Math.floor(i / col) - (rows - 1) / 2) * 15;
    return `<circle cx="${cx}" cy="${cy}" r="4.6" class="${n % 2 ? "yang-dot" : "yin-dot"}"/>`;
  }).join("");
}
function htHetu() {
  return `<svg viewBox="0 0 520 520" role="img" aria-label="河图,一六水北,二七火南,三八木东,四九金西,五十土中"><circle cx="260" cy="260" r="204" class="river-rule"/><circle cx="260" cy="260" r="139" class="river-rule"/>${HT_PL.map((p) => `<g>${htDots(p.a, p.x, p.y - 30)}${htDots(p.b, p.x, p.y + 13)}<text x="${p.x}" y="${p.y + 57}">${p.a} · ${p.b} ${p.w}</text></g>`).join("")}<text x="260" y="27">南</text><text x="260" y="506">北</text><text x="506" y="266">东</text><text x="15" y="266">西</text></svg>`;
}
function htLuoshu() {
  let ys = null,
    ms = null;
  try {
    const bz = R.bz;
    ys = xkFly(xkYearStar(bz.yearNum || ksYearStar ? nowBJ().y : nowBJ().y), true);
    ms = xkFly(xkMonthStar(bz.pill[0].b, (bz.pill[1].b - 2 + 12) % 12), true);
  } catch (e) {}
  const body = HT_LS.map((n, i) => {
    const x = 104 + (i % 3) * 156,
      y = 104 + Math.floor(i / 3) * 156;
    return `<g class="ht-c${HTS.sel === n ? " sel" : ""}" data-n="${n}" style="cursor:pointer"><rect class="river-rule" x="${x - 65}" y="${y - 65}" width="130" height="130"/>${htDots(n, x, y - 5)}<text x="${x}" y="${y + 46}">${n}</text>${HTS.yearStar && ys ? `<text x="${x - 48}" y="${y - 44}" class="ls-y">${ys[n]}</text>` : ""}${HTS.monthStar && ms ? `<text x="${x + 48}" y="${y - 44}" class="ls-m">${ms[n]}</text>` : ""}</g>`;
  }).join("");
  return `<svg viewBox="0 0 520 520" role="img" aria-label="洛书数序四九二,三五七,八一六,上南下北">${body}<text x="260" y="25">南</text><text x="260" y="506">北</text><text x="506" y="266">东</text><text x="15" y="266">西</text></svg>`;
}
function htVerify() {
  const L = HT_LS,
    rows = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8],
    ],
    cols = [
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8],
    ],
    dg = [
      [0, 4, 8],
      [2, 4, 6],
    ],
    sums = [...rows, ...cols, ...dg].map((l) => l.reduce((a, i) => a + L[i], 0)),
    opp = [
      [0, 8],
      [1, 7],
      [2, 6],
      [3, 5],
    ].map(([a, b]) => L[a] + L[b]);
  const sheng = [1, 2, 3, 4, 5].reduce((a, b) => a + b, 0),
    cheng = [6, 7, 8, 9, 10].reduce((a, b) => a + b, 0);
  return {
    hetu: `数理核对:生数合 ${sheng}(应 15) · 成数合 ${cheng}(应 40) · 共 ${sheng + cheng}(应 55) · 每组成数−生数=5:${HT_PL.every((p) => p.b - p.a === 5) ? "✓" : "✗"}`,
    luoshu: `数理核对:九数互异 ${new Set(L).size === 9 ? "✓" : "✗"} · 八条纵横斜线各合 ${sums.join("、")}(应均为 15) · 对宫合 ${opp.join("、")}(应均为 10) · 共 ${L.reduce((a, b) => a + b, 0)}(应 45)`,
  };
}
function renderHetu() {
  const pane = $("#pane-hetu");
  if (!pane) return;
  pane.dataset.built = "1";
  const v = HTS.view,
    ver = htVerify(),
    pal = (n) => {
      try {
        return { name: PNAME[n], dir: PDIR[n], wx: WXK[PWX[n]] };
      } catch (e) {
        return null;
      }
    };
  const reading =
    v === "hetu"
      ? `<h4 class="gl">生成数与五行</h4><p class="rt">一至五为生数,六至十为成数;每组相差五。黑白区分奇偶(白点为奇、黑点为偶),图中方位采用南上北下。</p><dl class="ht-dl">${HT_PL.map((p) => `<div><dt>${p.dir} · ${p.w}</dt><dd>${p.a} 与 ${p.b} 相配</dd></div>`).join("")}</dl>`
      : v === "luoshu"
        ? `<h4 class="gl">九宫数序与均衡</h4><p class="rt">戴九履一,左三右七。二四为肩,六八为足,五居中央。九宫各数只出现一次。任一行、列或对角线均合十五,对宫两数合十。</p>${
            HTS.sel
              ? (() => {
                  const p = pal(HTS.sel);
                  return `<p class="rt"><b>已选 ${HTS.sel}</b>${p ? `:${p.name}宫 · ${p.dir} · 五行属${p.wx}` : ""}</p>`;
                })()
              : '<p class="dim sm">点洛书里的任一格,看它的方位与五行。</p>'
          }<div class="row3"><label class="chk"><input type="checkbox" id="htYs"${HTS.yearStar ? " checked" : ""}> 叠加年紫白(红)</label><label class="chk"><input type="checkbox" id="htMs"${HTS.monthStar ? " checked" : ""}> 叠加月紫白(蓝)</label></div>`
        : `<h4 class="gl">同属河洛,各有数序</h4><p class="rt">河图使用一至十,共五十五,表达生成数与五行方位。洛书使用一至九,共四十五,表达九宫纵横合十五。</p><p class="rt">河图火在南、金在西;洛书九宫以自身后天方位规则配置。两种图式不能按同一数序直接套用。</p>`;
  pane.innerHTML = `<div class="panel blk"><h3 class="sec">河图 · 洛书</h3><p class="note" style="margin-top:0">使用宋以后通行的河图、洛书点数图式:奇数白点、偶数黑点;方位南上北下。它们是数理与传统配属示意,不能单独排出个人命运。文献可参见《天原发微》卷十三。</p>
  <div class="hs-layers"><button type="button" class="gbtn sm${v === "hetu" ? " on" : ""}" data-v="hetu">河图 · 五行生成</button><button type="button" class="gbtn sm${v === "luoshu" ? " on" : ""}" data-v="luoshu">洛书 · 九宫合十五</button><button type="button" class="gbtn sm${v === "compare" ? " on" : ""}" data-v="compare">两图对照</button></div>
  <div class="ht-fig">${v === "compare" ? `<div class="river-pair">${htHetu()}${htLuoshu()}</div>` : v === "hetu" ? htHetu() : htLuoshu()}</div>
  <div class="ht-read">${reading}</div><p class="note ok">${v === "hetu" ? ver.hetu : v === "luoshu" ? ver.luoshu : `河图 55、洛书 45;${ver.hetu.slice(5, 26)} … 另见各图下方核对。`}</p></div>`;
  $$("[data-v]", pane).forEach(
    (b) =>
      (b.onclick = () => {
        HTS.view = b.dataset.v;
        renderHetu();
      }),
  );
  $$(".ht-c", pane).forEach(
    (g) =>
      (g.onclick = () => {
        HTS.sel = +g.dataset.n;
        renderHetu();
      }),
  );
  const y = $("#htYs");
  if (y)
    y.onchange = (e) => {
      HTS.yearStar = e.target.checked;
      renderHetu();
    };
  const m = $("#htMs");
  if (m)
    m.onchange = (e) => {
      HTS.monthStar = e.target.checked;
      renderHetu();
    };
}
/* ---------- 甲子查表 ---------- */
const JZ = { i: 0, ref: 0 };
function jzXunKong(i) {
  const x = Math.floor(i / 10);
  return [(10 - 2 * x + 12) % 12, (11 - 2 * x + 12) % 12];
}
function jzHTML() {
  const i = JZ.i,
    s = i % 10,
    b = i % 12,
    xun = Math.floor(i / 10),
    xk = jzXunKong(i),
    ref = JZ.ref,
    ss = shishen(ref, s),
    zs = shishen(ref, CANG[b][0]);
  const cur = ganzhiIdx(R.bz.pill[2].s, R.bz.pill[2].b);
  return `<div class="panel blk"><h3 class="sec">甲子查表</h3><p class="note" style="margin-top:0">查询六十甲子的阴阳、干支五行、生肖、纳音、旬与旬空。纳音与干支本身的五行分别显示,互不混用。</p>
  <div class="nmform"><label>选择干支<select id="jzSel">${Array.from({ length: 60 }, (_, k) => `<option value="${k}"${k === i ? " selected" : ""}>${k + 1}. ${GAN[k % 10]}${ZHI[k % 12]}</option>`).join("")}</select></label><label>十神参照日干<select id="jzRef">${GAN.map((g, k) => `<option value="${k}"${k === ref ? " selected" : ""}>${g}(${WXK[GAN_WX[k]]})</option>`).join("")}</select></label><button class="gbtn sm" type="button" id="jzCur">取当前日柱 ${GAN[R.bz.pill[2].s]}${ZHI[R.bz.pill[2].b]}</button></div>
  <div class="kv" style="margin:8px 0"><span>干支 <b>${GAN[s]}${ZHI[b]}</b>(第 ${i + 1} 位)</span><span>天干 <b>${s % 2 === 0 ? "阳" : "阴"}${WXK[GAN_WX[s]]}</b></span><span>地支 <b>${b % 2 === 0 ? "阳" : "阴"}${WXK[ZHI_WX[b]]}</b>(${ZODIAC[b]})</span><span>纳音 <b>${NAYIN[i >> 1]}</b></span><span>所在旬 <b>${GAN[0]}${ZHI[(xun * 10) % 12]}旬</b>,空亡 <b>${ZHI[xk[0]]}${ZHI[xk[1]]}</b></span><span>十神(参照 ${GAN[ref]}) 天干 <b>${ss}</b> · 地支本气 <b>${zs}</b></span></div>
  <details class="ai-set"><summary>展开六十甲子全表</summary><div class="tbl-wrap"><table class="tbl sm jz-t"><thead><tr><th>#</th><th>干支</th><th>纳音</th><th>阴阳</th><th>生肖</th><th>旬空</th></tr></thead><tbody>${Array.from(
    { length: 60 },
    (_, k) => {
      const x = jzXunKong(k);
      return `<tr class="${k === i ? "on" : ""}${k === cur ? " now" : ""}" data-k="${k}"><td>${k + 1}</td><td><b class="wx${GAN_WX[k % 10]}">${GAN[k % 10]}</b><b class="wx${ZHI_WX[k % 12]}">${ZHI[k % 12]}</b></td><td>${NAYIN[k >> 1]}</td><td>${k % 2 === 0 ? "阳" : "阴"}</td><td>${ZODIAC[k % 12]}</td><td>${ZHI[x[0]]}${ZHI[x[1]]}</td></tr>`;
    },
  ).join("")}</tbody></table></div></details>
  <p class="note">干支表是关系查阅;纳音、干支本气与十神分别定义,不以单项推出喜用、职业或命运。</p></div>`;
}
function jzBind() {
  const re = () => {
    const h = $("#jzBox");
    if (h) {
      h.innerHTML = jzHTML();
      jzBind();
    }
  };
  const a = $("#jzSel");
  if (!a) return;
  a.onchange = (e) => {
    JZ.i = +e.target.value;
    re();
  };
  $("#jzRef").onchange = (e) => {
    JZ.ref = +e.target.value;
    re();
  };
  $("#jzCur").onclick = () => {
    JZ.i = ganzhiIdx(R.bz.pill[2].s, R.bz.pill[2].b);
    JZ.ref = R.bz.pill[2].s;
    re();
  };
  $$(".jz-t tbody tr").forEach(
    (tr) =>
      (tr.onclick = () => {
        JZ.i = +tr.dataset.k;
        re();
      }),
  );
}
/* ---------- 古州分野参照 ---------- */
const GF_REG = {
  yan: ["古兖州", "角、亢"],
  yu: ["古豫州", "氐、房、心"],
  you: ["古幽州", "尾、箕"],
  yang: ["古扬州", "斗、牛"],
  qing: ["古青州", "女、虚"],
  bing: ["古并州", "危、室、壁"],
  xu: ["古徐州", "奎、娄"],
  ji: ["古冀州", "胃、昴"],
  yi: ["古益州", "毕、觜、参"],
  yong: ["古雍州", "井、鬼"],
  sanhe: ["古三河", "柳、星、张"],
  jing: ["古荆州", "翼、轸"],
};
function gfOptions(cur) {
  return (
    '<option value="">待地方志核对</option>' +
    Object.entries(GF_REG)
      .map(
        ([k, v]) =>
          `<option value="${k}"${k === cur ? " selected" : ""}>${v[0]} · ${v[1]}</option>`,
      )
      .join("")
  );
}
function gfReading(k) {
  const r = GF_REG[k];
  return r
    ? `${r[0]} · ${r[1]}分野。《史记·天官书》正义引《星经》的十二州配属,仅为你选定的古州参照;本站不把经纬度或现代省市直接换算为古分野。`
    : "星宿分野是古代州域配属,与现代行政区边界不能一一对应。可按当地府县志选古州参照。";
}
function gfBind() {
  const s = $("#pfenye");
  if (!s || s.dataset.b) return;
  s.dataset.b = "1";
  s.innerHTML = gfOptions(s.dataset.v || "");
  const t = $("#pfenyeTxt");
  const up = () => {
    t.textContent = gfReading(s.value);
  };
  s.onchange = () => {
    s.dataset.v = s.value;
    up();
    try {
      pplState();
    } catch (e) {}
  };
  up();
}
/* ---------- 复盘记录 ---------- */
const RVK = "tianjipan.review.v1";
const RV = { list: [], edit: null, cmp: [], kind: "bazi" };
(function () {
  try {
    RV.list = JSON.parse(localStorage.getItem(RVK) || "[]") || [];
  } catch (e) {
    RV.list = [];
  }
})();
const rvSave = () => {
  try {
    localStorage.setItem(RVK, JSON.stringify(RV.list));
  } catch (e) {
    toast("当前环境不允许保存本地数据");
  }
};
const RV_KINDS = [
  ["bazi", "四柱八字"],
  ["zw", "紫微斗数"],
  ["mh", "梅花易数"],
  ["ly", "六爻纳甲"],
  ["qm", "奇门遁甲"],
  ["lr", "大六壬"],
  ["jk", "金口诀"],
  ["free", "不附盘面"],
];
function rvSnap(kind) {
  if (kind === "free" || !R) return [];
  const c = R.t.civ,
    when = `盘面时间 ${c.y}-${f2(c.m)}-${f2(c.d)} ${f2(c.h)}:${f2(c.mi)}(北京时间)`,
    L = [when];
  try {
    if (kind === "bazi") {
      const bz = R.bz,
        p = bz.pill.map((x) => GAN[x.s] + ZHI[x.b]);
      L.push(`四柱 ${p.join(" ")},日主 ${GAN[bz.dm]}${WXK[GAN_WX[bz.dm]]}`);
      const dts = dayunTable(bz, R.deep),
        cur = typeof dayunNow === "function" ? dayunNow(R) : -1;
      if (cur >= 0) L.push(`当前大运 ${dts[cur].gz}(${Math.floor(dts[cur].startAge)}岁起)`);
    } else if (kind === "zw") {
      const m = R.zw.pal.find((p) => p.isMing);
      L.push(
        `命宫在${ZHI[m.b]},主星 ${
          m.stars
            .filter((s) => s.t === "main")
            .map((s) => s.n)
            .join("、") || "空宫"
        }`,
      );
    } else if (kind === "mh") {
      const m = R.mh;
      L.push(
        `梅花 本卦 ${m.ben.name} → 互卦 ${m.hu.name} → 变卦 ${m.bian.name};动爻 ${m.mv || ""}`,
      );
    } else if (kind === "ly") {
      const { lines, moving } = lyLinesFrom(R),
        bl = lines.slice();
      moving.forEach((i) => {
        bl[i] = 1 - bl[i];
      });
      L.push(
        `六爻 本卦 ${hexInfo(lines).name}${moving.length ? ` → 变卦 ${hexInfo(bl).name};动爻 ${moving.map((i) => ["初", "二", "三", "四", "五", "上"][i]).join("、")}` : "(无动爻)"}`,
      );
    } else if (kind === "qm") {
      const q = R.qm;
      L.push(`奇门 ${q.yang ? "阳" : "阴"}遁${q.ju}局,值符 ${q.zfStar},值使 ${q.zsDoor}`);
    } else if (kind === "lr") {
      const l = R.lr;
      L.push(
        `大六壬 ${l.ge};三传 ${l.chu.map((x) => ZHI[x.z]).join("→")};月将 ${l.jiangName}加${ZHI[l.hb]}时`,
      );
    } else if (kind === "jk") {
      const dg = R.bz.dayIdx % 10,
        hb = R.bz.pill[3].b,
        zj = jkYueJiang(R.t.lon, "zhong"),
        k = jkQiKe(dg, hb, zj, hb, {});
      L.push(
        `金口诀 人元 ${GAN[k.renyuan]} · 贵神 ${k.guiName} · 将神 ${ZHI[k.jiangshen]}(${k.jiangName}) · 地分 ${ZHI[k.difen]}`,
      );
    }
  } catch (e) {
    L.push("(此盘面暂时无法取数)");
  }
  return L;
}
const RV_F = [
  ["scope", "核对范围", "这次要核对的是盘里的哪一部分?只写一个具体问题。"],
  ["facts", "盘面事实", "排盘得出的、可核查的事实(时间、干支、卦名、星位等)。"],
  ["counter", "反证与另一种解释", "什么现象会推翻这个解读?还有哪种说法能同样解释?"],
  ["action", "采取的行动", "你实际做了什么,不是盘面“建议”做什么。"],
  ["outcome", "事后结果", "实际发生了什么(只写事实,不写评价)。"],
  ["date", "复盘日期", ""],
];
function rvForm(rec) {
  const r = rec || {
    kind: RV.kind,
    title: "",
    snap: rvSnap(RV.kind),
    f: { facts: rvSnap(RV.kind).join("\n") },
  };
  const f = r.f || {};
  const field = (k, n, ph, step, cls, full = "") =>
    `<label class="rv-field ${cls}${full ? " full" : ""}" data-step="${step}"><span>${n}<small>${esc(ph)}</small></span><textarea id="rv_${k}" rows="${k === "facts" ? 4 : 3}" maxlength="800" placeholder="${esc(ph)}">${esc(f[k] || "")}</textarea></label>`;
  return `<div class="panel rv-compose"><div class="rv-compose-head"><div><h3 class="sec">${rec && rec.id ? "编辑复盘" : "新建复盘"}</h3><small>先记事实，再写解释；把行动与结果分开。</small></div><span class="pill ${rec && rec.id ? "g" : ""}">${rec && rec.id ? "正在编辑" : "新记录"}</span></div>
  <div class="rv-form-body"><div class="rv-meta"><label>盘面类型<select id="rvKind">${RV_KINDS.map(([k, n]) => `<option value="${k}"${k === r.kind ? " selected" : ""}>${n}</option>`).join("")}</select></label><label>标题 / 所问之事<input type="text" id="rvTitle" maxlength="60" value="${esc(r.title || "")}" placeholder="例如：十月初的项目沟通"></label><label>复盘日期<input type="date" id="rv_date" value="${esc(f.date || "")}"></label></div>
  <div class="rv-fields">${field("facts", "盘面事实", "只记录时间、干支、卦名、星位等可核查内容", "01", "facts", true)}${field("scope", "核对范围", "这次只核对一个具体问题", "02", "scope")}${field("counter", "反证 / 另一解释", "什么现象会推翻这个判断？", "03", "counter")}${field("action", "实际采取的行动", "只写你真正做了什么", "04", "action")}${field("outcome", "事后结果", "只写后来实际发生了什么", "05", "outcome")}</div>
  <div class="rv-form-foot"><button class="gbtn primary" id="rvSave" type="button">${rec && rec.id ? "更新记录" : "保存记录"}</button>${rec && rec.id ? '<button class="gbtn" id="rvCancel" type="button">取消编辑</button>' : ""}<button class="gbtn sm rv-refill" id="rvRefill" type="button">从当前盘面重新取事实</button><span class="rv-privacy">记录仅保存在当前浏览器本地，不上传。建议先写“事实”，隔一段时间再补“结果”。</span></div></div></div>`;
}
function renderReview() {
  const pane = $("#pane-review");
  if (!pane) return;
  pane.dataset.built = "1";
  const rec = RV.edit ? RV.list.find((x) => x.id === RV.edit) : null;
  const total = RV.list.length,
    doneN = RV.list.filter((x) => x.f && x.f.outcome).length,
    pendingN = total - doneN;
  const rows =
    RV.list
      .slice()
      .sort((a, b) => b.t - a.t)
      .map((x) => {
        const done = !!(x.f && x.f.outcome),
          kn = (RV_KINDS.find((k) => k[0] === x.kind) || [0, "—"])[1],
          sel = RV.cmp.includes(x.id),
          f = x.f || {},
          dt = f.date || new Date(x.t).toLocaleDateString("zh-CN");
        const parts = [
          ["scope", "核对范围", ""],
          ["counter", "反证 / 另一解释", "counter"],
          ["action", "采取的行动", ""],
          ["outcome", "事后结果", "outcome"],
        ].filter(([k]) => f[k]);
        return `<article class="rvc ${done ? "done" : "pending"}${sel ? " selected" : ""}"><div class="rvh"><label class="rv-check"><input type="checkbox" data-cmp="${x.id}"${sel ? " checked" : ""}> 对比</label><div class="rv-title"><b>${esc(x.title || "(未命名)")}</b><div class="rv-meta-line"><span class="pill ${done ? "g" : ""}">${done ? "已复盘" : "待复盘"}</span><span class="pill">${kn}</span><time>${esc(dt)}</time></div></div><span class="rvb"><button type="button" class="lnk" data-edit="${x.id}">编辑</button><button type="button" class="lnk" data-del="${x.id}">删除</button></span></div>${(x.snap || []).length ? `<div class="rv-snap">${x.snap.map(esc).join("<br>")}</div>` : ""}${f.facts ? `<div class="rv-part"><b>盘面事实</b><p>${esc(f.facts)}</p></div>` : ""}${parts.length ? `<div class="rv-card-grid">${parts.map(([k, n, c]) => `<div class="rv-part ${c}"><b>${n}</b><p>${esc(f[k])}</p></div>`).join("")}</div>` : ""}</article>`;
      })
      .join("") ||
    '<div class="rv-empty"><p class="dim">还没有复盘记录。先在上面建立第一条，把“盘面事实”和“后来发生的事”分开保存。</p></div>';
  let diff = "";
  if (RV.cmp.length === 2) {
    const [a, b] = RV.cmp.map((id) => RV.list.find((x) => x.id === id));
    if (a && b) {
      const ch = (x, y) => (x || "") !== (y || "");
      diff = `<div class="panel blk rv-compare"><h3 class="sec">A / B 两条记录对比</h3><div class="tbl-wrap"><table class="tbl sm"><thead><tr><th>项目</th><th>${esc(a.title || "A")}</th><th>${esc(b.title || "B")}</th></tr></thead><tbody><tr><th>盘面快照</th><td>${(a.snap || []).map(esc).join("<br>") || "—"}</td><td>${(b.snap || []).map(esc).join("<br>") || "—"}</td></tr>${RV_F.map((f) => `<tr class="${ch((a.f || {})[f[0]], (b.f || {})[f[0]]) ? "on" : ""}"><th>${f[1]}${ch((a.f || {})[f[0]], (b.f || {})[f[0]]) ? ' <em class="dim">不同</em>' : ""}</th><td>${esc((a.f || {})[f[0]] || "—")}</td><td>${esc((b.f || {})[f[0]] || "—")}</td></tr>`).join("")}</tbody></table></div></div>`;
    }
  }
  pane.innerHTML = `<div class="panel blk rv-overview"><div class="rv-overview-h"><div><h3 class="sec">复盘记录</h3><p class="note">把“盘面事实、当时解释、实际行动、事后结果”拆开记录。目的不是证明一次判断准不准，而是长期检查哪些解释真正经得起事实。</p></div><div class="rvstats"><div class="rvstat"><small>全部记录</small><b>${total}</b></div><div class="rvstat good"><small>已补结果</small><b>${doneN}</b></div><div class="rvstat wait"><small>待复盘</small><b>${pendingN}</b></div><div class="rvstat"><small>对比已选</small><b>${RV.cmp.length}/2</b></div></div></div></div>${rvForm(rec)}
  <div class="panel blk rv-list-panel"><div class="rv-list-head"><div><h3 class="sec">记录档案</h3>${RV.cmp.length === 1 ? '<small class="dim">已选 1 条，再选 1 条即可进入 A / B 对比。</small>' : '<small class="dim">新记录在前；有“事后结果”的记录标为已复盘。</small>'}</div><div class="rv-list-tools"><button class="gbtn sm" id="rvExp" type="button">导出 JSON</button><label class="gbtn sm" style="cursor:pointer">导入备份<input type="file" id="rvImp" accept="application/json" hidden></label><button class="gbtn sm" id="rvClr" type="button">清空全部</button></div></div><div class="rvl">${rows}</div></div>${diff}
  <div class="panel blk"><h3 class="sec">复盘方法 · 五步</h3><div class="rv-method"><div class="rv-step"><em>01</em><b>只记事实</b><p>先写时间、干支、卦名、星位等可以重新核对的盘面信息。</p></div><div class="rv-step"><em>02</em><b>限定问题</b><p>一次只核对一个具体判断，避免事后把范围无限扩大。</p></div><div class="rv-step"><em>03</em><b>预写反证</b><p>在结果发生前写清楚：出现什么情况，就说明原解释不成立。</p></div><div class="rv-step"><em>04</em><b>记录行动</b><p>把你实际做过的事单独记录，避免把行动效果误认为盘面预测。</p></div><div class="rv-step"><em>05</em><b>事后核对</b><p>只补事实结果，再判断哪些解释得到支持、哪些应降低权重。</p></div></div><p class="note">单次对错没有统计意义。长期保留反例，比只记“说中的”更能提高复盘价值。</p></div>`;
  const fields = () => {
    const f = {};
    RV_F.forEach(([k]) => {
      const e = $("#rv_" + k);
      if (e) f[k] = e.value.trim();
    });
    return f;
  };
  $("#rvKind").onchange = (e) => {
    RV.kind = e.target.value;
    if (!RV.edit) {
      const ta = $("#rv_facts");
      if (ta) ta.value = rvSnap(RV.kind).join("\n");
    }
  };
  $("#rvRefill").onclick = () => {
    $("#rv_facts").value = rvSnap($("#rvKind").value).join("\n");
  };
  $("#rvSave").onclick = () => {
    const kind = $("#rvKind").value,
      f = fields(),
      title = $("#rvTitle").value.trim();
    if (!title && !Object.values(f).some(Boolean)) {
      toast("请至少写一个标题或一项内容");
      return;
    }
    if (rec) {
      Object.assign(rec, { kind, title, f });
      rec.snap = rec.snap && rec.snap.length ? rec.snap : rvSnap(kind);
      RV.edit = null;
    } else {
      if (RV.list.length >= 50) {
        toast("最多保存 50 条,请先删除旧记录");
        return;
      }
      RV.list.push({
        id: "r" + Date.now().toString(36),
        t: Date.now(),
        kind,
        title,
        f,
        snap: rvSnap(kind),
      });
    }
    rvSave();
    renderReview();
    toast("已保存");
  };
  const cn = $("#rvCancel");
  if (cn)
    cn.onclick = () => {
      RV.edit = null;
      renderReview();
    };
  $$("[data-edit]", pane).forEach(
    (b) =>
      (b.onclick = () => {
        RV.edit = b.dataset.edit;
        renderReview();
        window.scrollTo({
          top: pane.getBoundingClientRect().top + scrollY - 110,
          behavior: "smooth",
        });
      }),
  );
  $$("[data-del]", pane).forEach(
    (b) =>
      (b.onclick = () => {
        if (b.dataset.c === "1") {
          RV.list = RV.list.filter((x) => x.id !== b.dataset.del);
          RV.cmp = RV.cmp.filter((x) => x !== b.dataset.del);
          if (RV.edit === b.dataset.del) RV.edit = null;
          rvSave();
          renderReview();
          return;
        }
        b.dataset.c = "1";
        b.textContent = "确认删除";
        setTimeout(() => {
          if (b.isConnected) {
            b.dataset.c = "";
            b.textContent = "删除";
          }
        }, 3000);
      }),
  );
  $$("[data-cmp]", pane).forEach(
    (c) =>
      (c.onchange = () => {
        const id = c.dataset.cmp;
        RV.cmp = RV.cmp.filter((x) => x !== id);
        if (c.checked) RV.cmp.push(id);
        if (RV.cmp.length > 2) RV.cmp = RV.cmp.slice(-2);
        renderReview();
      }),
  );
  $("#rvExp").onclick = () =>
    saveFile(
      `天机盘-复盘记录-${stamp()}.json`,
      JSON.stringify({ version: 1, exported: Date.now(), records: RV.list }, null, 1),
    );
  $("#rvImp").onchange = async (e) => {
    const fl = e.target.files[0];
    if (!fl) return;
    try {
      const j = JSON.parse(await fl.text()),
        arr = Array.isArray(j) ? j : j.records;
      if (!Array.isArray(arr)) throw 0;
      let n = 0;
      arr.slice(0, 100).forEach((x) => {
        if (
          x &&
          typeof x === "object" &&
          !RV.list.some((y) => y.id === x.id) &&
          RV.list.length < 50
        ) {
          RV.list.push({
            id: String(x.id || "r" + Date.now().toString(36) + n),
            t: +x.t || Date.now(),
            kind: String(x.kind || "free"),
            title: String(x.title || "").slice(0, 60),
            f: Object.fromEntries(
              RV_F.map(([k]) => [k, String((x.f || {})[k] || "").slice(0, 800)]),
            ),
            snap: Array.isArray(x.snap)
              ? x.snap.slice(0, 8).map((s) => String(s).slice(0, 200))
              : [],
          });
          n++;
        }
      });
      rvSave();
      renderReview();
      toast(`已导入 ${n} 条`);
    } catch (er) {
      toast("备份文件格式不对");
    }
  };
  $("#rvClr").onclick = () => {
    const b = $("#rvClr");
    if (b.dataset.c === "1") {
      RV.list = [];
      RV.cmp = [];
      RV.edit = null;
      rvSave();
      renderReview();
      return;
    }
    b.dataset.c = "1";
    b.textContent = "确认清空全部";
    setTimeout(() => {
      if (b.isConnected) {
        b.dataset.c = "";
        b.textContent = "清空全部";
      }
    }, 3000);
  };
}
/* ---------- 概念辨析(天机书院内) ---------- */
const KNS = { q: "", cat: "" };
function knHTML() {
  const cats = [...new Set(KN.map((k) => k[0]))],
    q = KNS.q.trim(),
    arr = KN.filter(
      (k) => (!KNS.cat || k[0] === KNS.cat) && (!q || (k[1] + k[2] + k[3]).includes(q)),
    );
  return `<div class="panel blk" id="knBox"><h3 class="sec">概念辨析 · ${KN.length} 条</h3><p class="note" style="margin-top:0">把通则和具体算法分开讲:农历与节气的区别、各体系的换日规则、神煞为何同名异法……读命盘前先弄清这些,很多“对不上”的疑问就消了。</p>
  <div class="lbfilter"><input type="search" id="knQ" value="${esc(KNS.q)}" placeholder="搜条目或关键词,如 换日、闰月、真太阳时" aria-label="搜索概念"></div><div class="hs-layers" style="margin:6px 0"><button type="button" class="gbtn sm${KNS.cat ? "" : " on"}" data-kc="">全部</button>${cats.map((c) => `<button type="button" class="gbtn sm${KNS.cat === c ? " on" : ""}" data-kc="${c}">${c}</button>`).join("")}</div>
  <div class="knl">${arr.map((k) => `<details class="knd"><summary><span class="pill">${k[0]}</span> ${esc(k[1])}</summary><p>${esc(k[2])}</p><p class="dim">${esc(k[3])}</p></details>`).join("") || '<p class="dim">没有符合的条目。</p>'}</div></div>`;
}
function knBind() {
  const box = $("#knBox");
  if (!box) return;
  const re = () => {
    const n = document.createElement("div");
    n.innerHTML = knHTML();
    box.replaceWith(n.firstElementChild);
    knBind();
  };
  const q = $("#knQ");
  q.oninput = () => {
    KNS.q = q.value;
    const pos = q.selectionStart;
    re();
    const n = $("#knQ");
    n.focus();
    try {
      n.setSelectionRange(pos, pos);
    } catch (e) {}
  };
  $$("[data-kc]", box).forEach(
    (b) =>
      (b.onclick = () => {
        KNS.cat = b.dataset.kc;
        re();
      }),
  );
}
/* ---------- 动效常驻 ---------- */
function motionApply() {
  REDUCE = document.documentElement.getAttribute("data-tj-motion") === "reduced";
  document.body.classList.toggle("no-motion", REDUCE);
}

/* ---------- 接入页面 ---------- */
REF_PANES.house = () => {
  renderHouse();
};
REF_PANES.hetu = () => {
  renderHetu();
};
REF_PANES.review = () => {
  renderReview();
};
REF_PANES.jiazi = () => `<div id="jzBox">${jzHTML()}</div>`;
REF_BIND.jiazi = jzBind;
function gfSet(v) {
  const s = $("#pfenye");
  if (!s) return;
  gfBind();
  s.dataset.v = v || "";
  s.value = v || "";
  const t = $("#pfenyeTxt");
  if (t) t.textContent = gfReading(s.value);
}
(function () {
  const b = () => motionApply();
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", b);
  else b();
})();

/* 防重入:被移除的输入框失焦时会再触发一次 change,导致同一页面渲染嵌套 */
["renderHouse", "renderHetu", "renderReview"].forEach((n) => {
  const f = window[n];
  if (typeof f !== "function") return;
  let busy = false;
  const w = function () {
    if (busy) return;
    busy = true;
    try {
      return f.apply(this, arguments);
    } finally {
      setTimeout(() => {
        busy = false;
      }, 0);
    }
  };
  try {
    window[n] = w;
  } catch (e) {}
});

const WX_SHENG = { 木: "火", 火: "土", 土: "金", 金: "水", 水: "木" },
  WX_KE = { 木: "土", 土: "水", 水: "火", 火: "金", 金: "木" };
/* 移植自《天机玄秘》v10.2:经络 · 星空 · 天人感应 · 时令与你 · 花信 · 日月天象图解 · 日月地 3D 运转。算法与数据原样保留。 */
/* =====================================================================
   v3.9 · 经络（天人时空）/ 星空（二十八宿）—— 传统文化示意模型
   经络循行与穴位为简化示意，不作医学依据；星图非实测星历；值日宿与择日模块同源。
   ===================================================================== */
const JL_MER = [
  {
    z: "子",
    h: "23–1",
    n: "足少阳胆经",
    yy: "阳",
    wx: "木",
    d: "少阳初生，胆气升发。宜卧床休息，忌熬夜、恼怒、过食油腻。",
    pts: "M126,34 C118,60 114,90 116,130 C118,180 112,240 108,300 C104,360 106,420 108,468",
  },
  {
    z: "丑",
    h: "1–3",
    n: "足厥阴肝经",
    yy: "阴",
    wx: "木",
    d: "肝藏血、主疏泄。当令宜熟睡养肝，忌饮酒、熬夜、生气。",
    pts: "M118,470 C116,410 118,350 124,300 C128,270 132,250 138,235 C142,210 140,190 136,172",
  },
  {
    z: "寅",
    h: "3–5",
    n: "手太阴肺经",
    yy: "阴",
    wx: "金",
    d: "肺主气、司呼吸。当令宜深呼吸、早起，忌悲忧耗气、受寒。",
    pts: "M150,140 C130,130 112,122 104,110 C94,152 88,212 80,270 C78,280 77,287 76,293",
  },
  {
    z: "卯",
    h: "5–7",
    n: "手阳明大肠经",
    yy: "阳",
    wx: "金",
    d: "大肠主传导。当令宜排便、喝温水，忌憋便、久卧。",
    pts: "M82,294 C86,240 92,180 98,130 C102,112 112,104 122,100 C130,90 134,78 136,66",
  },
  {
    z: "辰",
    h: "7–9",
    n: "足阳明胃经",
    yy: "阳",
    wx: "土",
    d: "胃主受纳。当令宜吃好早餐，忌空腹、过饱、生冷。",
    pts: "M138,60 C136,100 134,130 136,160 C138,200 136,240 134,280 C132,340 130,400 128,460 C127,470 127,476 128,482",
  },
  {
    z: "巳",
    h: "9–11",
    n: "足太阴脾经",
    yy: "阴",
    wx: "土",
    d: "脾主运化。当令宜工作学习，忌思虑过劳、冷饮甜食。",
    pts: "M134,482 C136,420 138,360 142,310 C145,280 146,260 144,240 C142,210 140,190 138,172",
  },
  {
    z: "午",
    h: "11–13",
    n: "手少阴心经",
    yy: "阴",
    wx: "火",
    d: "心主神明。当令宜小憩养心，忌大喜大怒、剧烈运动。",
    pts: "M118,138 C114,170 110,220 104,268 C102,278 99,286 96,292",
  },
  {
    z: "未",
    h: "13–15",
    n: "手太阳小肠经",
    yy: "阳",
    wx: "火",
    d: "小肠主受盛、泌别清浊。当令宜午餐营养均衡，忌暴饮暴食。",
    pts: "M90,292 C96,240 104,190 112,140 C116,118 124,106 132,100 C140,92 144,80 144,64",
  },
  {
    z: "申",
    h: "15–17",
    n: "足太阳膀胱经",
    yy: "阳",
    wx: "水",
    d: "膀胱主津液。当令宜多喝水、活动筋骨，忌久坐、憋尿。",
    pts: "M104,48 C94,108 90,190 92,270 C94,350 92,420 94,474",
  },
  {
    z: "酉",
    h: "17–19",
    n: "足少阴肾经",
    yy: "阴",
    wx: "水",
    d: "肾藏精。当令宜晚餐清淡，忌过咸、熬夜。",
    pts: "M126,484 C128,430 130,370 134,320 C137,280 140,250 142,220 C144,200 146,185 148,172",
  },
  {
    z: "戌",
    h: "19–21",
    n: "手厥阴心包经",
    yy: "阴",
    wx: "相火",
    d: "心包护心。当令宜散步娱乐、舒缓心情，忌郁怒、劳心。",
    pts: "M150,152 C130,150 114,146 104,140 C98,180 92,230 88,276 C87,284 86,290 86,294",
  },
  {
    z: "亥",
    h: "21–23",
    n: "手少阳三焦经",
    yy: "阳",
    wx: "相火",
    d: "三焦主气化。当令宜准备入睡，忌剧烈运动、夜宵、思虑。",
    pts: "M86,294 C90,240 98,190 104,142 C108,120 116,108 124,102 C134,94 140,82 142,66 C143,58 144,52 144,46",
  },
];
const JL = { now: 0 };
function jlRingSvg(cur) {
  const cx = 150,
    cy = 150,
    R0 = 118,
    R1 = 86;
  const P = (r, a) => (cx + r * Math.cos(a)).toFixed(1) + "," + (cy + r * Math.sin(a)).toFixed(1);
  let s = "";
  for (let i = 0; i < 12; i++) {
    const a0 = ((i * 30 - 105) * Math.PI) / 180,
      a1 = ((i * 30 - 75) * Math.PI) / 180,
      am = (a0 + a1) / 2;
    const d =
      "M" +
      P(R1, a0) +
      " L" +
      P(R0, a0) +
      " A" +
      R0 +
      "," +
      R0 +
      " 0 0 1 " +
      P(R0, a1) +
      " L" +
      P(R1, a1) +
      " A" +
      R1 +
      "," +
      R1 +
      " 0 0 0 " +
      P(R1, a0) +
      " Z";
    s +=
      '<g class="jl-seg' +
      (i === cur ? " on" : "") +
      '" data-mi="' +
      i +
      '"><path d="' +
      d +
      '" fill="#1a2036" stroke="#3a4260" stroke-width="1"/>' +
      '<text x="' +
      (cx + 102 * Math.cos(am)).toFixed(1) +
      '" y="' +
      (cy + 102 * Math.sin(am) + 4.5).toFixed(1) +
      '" text-anchor="middle" fill="#9aa3bd" font-size="13">' +
      JL_MER[i].z +
      "</text></g>";
  }
  const m = JL_MER[cur];
  return (
    '<svg viewBox="0 0 300 300" class="jl-ring" role="img" aria-label="子午流注时辰环">' +
    s +
    '<circle cx="150" cy="150" r="58" class="jl-ring-c" fill="#141828" stroke="#3a4260" stroke-width="1"/>' +
    '<text x="150" y="143" text-anchor="middle" class="jl-rc-t" fill="#d9b25f" font-size="14" font-weight="700">' +
    m.z +
    "时当令</text>" +
    '<text x="150" y="163" text-anchor="middle" class="jl-rc-s" fill="#cdbf9d" font-size="12">' +
    m.n +
    "</text></svg>"
  );
}
function jlInfoHtml(i) {
  const m = JL_MER[i];
  return (
    "<h4>" +
    m.z +
    "时 " +
    m.h +
    " · " +
    m.n +
    "</h4>" +
    '<div class="jl-tags"><span>' +
    m.yy +
    "经</span><span>" +
    m.wx +
    "行</span><span>" +
    (i === JL.now ? "当令" : "非当令") +
    "</span></div>" +
    "<p>" +
    m.d +
    "</p>"
  );
}
function jlHeavenSvg(cur, R) {
  const m = JL_MER[cur],
    duty = xkDuty(R.civ),
    x = XK_XIU[duty];
  const jie = TERMS[Math.floor(R.t.lon / 15) % 24];
  const fang = [
    "北",
    "东北",
    "东北",
    "东",
    "东南",
    "东南",
    "南",
    "西南",
    "西南",
    "西",
    "西北",
    "西北",
  ][cur];
  const wxS = { 木: "木", 火: "火", 土: "土", 金: "金", 水: "水", 相火: "火(相)" }[m.wx];
  const lon = R.opt.lon.toFixed(1),
    lat = R.opt.lat.toFixed(1);
  const node = (x, y, t1, t2) =>
    '<g><rect x="' +
    x +
    '" y="' +
    y +
    '" width="170" height="54" rx="10" class="jl-hv-n" fill="#171c2e" stroke="#3a4260"/>' +
    '<text x="' +
    (x + 85) +
    '" y="' +
    (y + 22) +
    '" text-anchor="middle" class="jl-hv-t" fill="#d9b25f" font-size="13" font-weight="700">' +
    t1 +
    "</text>" +
    '<text x="' +
    (x + 85) +
    '" y="' +
    (y + 41) +
    '" text-anchor="middle" class="jl-hv-s" fill="#9aa3bd" font-size="11.5">' +
    t2 +
    "</text></g>";
  const edge = (x1, y1, x2, y2, lb, lx, ly) =>
    '<line x1="' +
    x1 +
    '" y1="' +
    y1 +
    '" x2="' +
    x2 +
    '" y2="' +
    y2 +
    '" class="jl-hv-e" stroke="#4a5478" stroke-width="1.2"/>' +
    '<text x="' +
    lx +
    '" y="' +
    ly +
    '" text-anchor="middle" class="jl-hv-l" fill="#7c86a8" font-size="11">' +
    lb +
    "</text>";
  return (
    '<svg viewBox="0 0 560 320" class="jl-heaven" role="img" aria-label="天人关系图">' +
    node(195, 14, "天时 · " + m.z + "时", jie + " · " + x[0] + "值日") +
    node(15, 133, "身 · " + m.n, m.yy + "经 · " + m.wx + "行当令") +
    node(375, 133, "五行 · " + wxS + "旺于时", "木 火 土 金 水") +
    node(195, 252, "空间 · " + fang + "方", lon + "°E " + lat + "°N") +
    edge(280, 68, 280, 124, "感应", 302, 98) +
    edge(185, 160, 244, 160, "运化", 214, 152) +
    edge(375, 160, 316, 160, "生克", 346, 152) +
    edge(280, 252, 280, 196, "定位", 302, 228) +
    '<circle cx="280" cy="160" r="36" class="jl-hv-c" fill="#231d10" stroke="#d9b25f" stroke-width="1.5"/><text x="280" y="169" text-anchor="middle" class="jl-hv-p" fill="#f6dc94" font-size="20" font-weight="700">人</text></svg>'
  );
}
function renderJingluo(R) {
  const cur = R.bz.pill[3].b;
  JL.now = cur;
  const m = JL_MER[cur];
  const gz = R.bz.pill.map((p) => GAN[p.s] + ZHI[p.b]).join(" ");
  const jie = TERMS[Math.floor(R.t.lon / 15) % 24];
  return (
    '<div class="nw-card wide"><h3 class="sec">当下天人状态</h3>' +
    '<div class="jl-now"><div class="jl-now-t"><b>' +
    m.z +
    "时</b><span>" +
    m.h +
    "</span></div>" +
    '<div class="jl-now-b"><div>' +
    m.n +
    " <em>当令</em></div>" +
    '<div class="dim sm">四柱 ' +
    esc(gz) +
    " · 日主" +
    GAN[R.bz.dm] +
    WXK[GAN_WX[R.bz.dm]] +
    " · " +
    jie +
    "</div>" +
    "<p>" +
    m.d +
    "</p></div></div></div>" +
    '<div class="nw-card"><h3 class="sec">子午流注</h3>' +
    jlRingSvg(cur) +
    '<div id="jlInfo" class="jl-info">' +
    jlInfoHtml(cur) +
    "</div>" +
    '<p class="note">「子午流注」为传统时间医学模型：十二时辰气血依次流注十二经。点击时辰查看对应经络。</p></div>' +
    '<div class="nw-card wide"><h3 class="sec">天人关系</h3>' +
    jlHeavenSvg(cur, R) +
    '<p class="note">以起局时间为「当下」：天时（时辰·节气·值日宿）感应于人，五行生克、空间方位定位，气血运化于经络脏腑。此为传统文化框架，非实证医学结论。</p></div>'
  );
}
function bindJingluo() {
  const p = $("#pane-jingluo");
  if (!p) return;
  p.querySelectorAll("[data-mi]").forEach((g) => {
    g.addEventListener("click", () => jlSelect(+g.dataset.mi));
  });
}
function jlSelect(i) {
  const p = $("#pane-jingluo");
  if (!p) return;
  p.querySelectorAll(".jl-seg").forEach((g) => g.classList.toggle("on", +g.dataset.mi === i));
  $("#jlInfo").innerHTML = jlInfoHtml(i);
}
function jingluoRefresh() {
  const p = $("#pane-jingluo");
  if (!p || !R) return;
  p.innerHTML = renderJingluo(R);
  bindJingluo();
}
/* ---- 二十八宿星空 ---- */
const XK_XIU = [
  ["角木蛟", 0, "吉", "宜出行、婚嫁、开市"],
  ["亢金龙", 0, "凶", "忌婚嫁、出行"],
  ["氐土貉", 0, "吉", "宜婚嫁、开市、修造"],
  ["房日兔", 0, "吉", "宜祭祀、婚嫁"],
  ["心月狐", 0, "凶", "忌诉讼、出行"],
  ["尾火虎", 0, "吉", "宜出行、建造"],
  ["箕水豹", 0, "吉", "宜开仓、纳财"],
  ["斗木獬", 3, "吉", "宜出行、修造"],
  ["牛金牛", 3, "凶", "忌婚嫁"],
  ["女土蝠", 3, "凶", "忌婚嫁、裁衣"],
  ["虚日鼠", 3, "凶", "忌开仓、出行"],
  ["危月燕", 3, "凶", "忌登高、出行"],
  ["室火猪", 3, "吉", "宜婚嫁、入宅"],
  ["壁水貐", 3, "吉", "宜修造、婚嫁"],
  ["奎木狼", 2, "凶", "忌婚嫁、出行"],
  ["娄金狗", 2, "吉", "宜婚嫁、开市"],
  ["胃土雉", 2, "吉", "宜修造、婚嫁"],
  ["昴日鸡", 2, "凶", "忌婚嫁、出行"],
  ["毕月乌", 2, "吉", "宜出行、开市"],
  ["觜火猴", 2, "凶", "忌婚嫁、安葬"],
  ["参水猿", 2, "吉", "宜出行、裁衣"],
  ["井木犴", 1, "吉", "宜开市、修造"],
  ["鬼金羊", 1, "凶", "忌婚嫁、出行"],
  ["柳土獐", 1, "凶", "忌婚嫁、出行"],
  ["星日马", 1, "凶", "忌婚嫁"],
  ["张月鹿", 1, "吉", "宜婚嫁、开市"],
  ["翼火蛇", 1, "凶", "忌婚嫁、出行"],
  ["轸水蚓", 1, "吉", "宜出行、婚嫁"],
];
const XIANG = [
  ["东方青龙", "东", "#4fae8f", "春", "木"],
  ["南方朱雀", "南", "#e0655a", "夏", "火"],
  ["西方白虎", "西", "#c9d2dd", "秋", "金"],
  ["北方玄武", "北", "#7b95d6", "冬", "水"],
];
/* HYG v38 亮星星表(514颗,星等<4.0,J2000): [中文名或编号,赤经(时),赤纬(度),星等,B-V] */
const XK_STARS = [
  ["天狼星", 6.7525, -16.7161, -1.44, 0.01],
  ["老人星", 6.3992, -52.6957, -0.62, 0.16],
  ["大角星", 14.261, 19.1824, -0.05, 1.24],
  ["南门二", 14.6608, -60.834, -0.01, 0.71],
  ["织女星", 18.6156, 38.7837, 0.03, -0.0],
  ["五车二", 5.2782, 45.998, 0.08, 0.8],
  ["参宿七", 5.2423, -8.2016, 0.18, -0.03],
  ["南河三", 7.655, 5.225, 0.4, 0.43],
  ["水委一", 1.6286, -57.2368, 0.45, -0.16],
  ["参宿四", 5.9195, 7.4071, 0.45, 1.5],
  ["马腹一", 14.0637, -60.373, 0.61, -0.23],
  ["河鼓二", 19.8464, 8.8683, 0.76, 0.22],
  ["十字架二", 12.4433, -63.0991, 0.77, -0.24],
  ["毕宿五", 4.5987, 16.5093, 0.87, 1.54],
  ["角宿一", 13.4199, -11.1613, 0.98, -0.23],
  ["心宿二", 16.4901, -26.432, 1.06, 1.86],
  ["北河三", 7.7553, 28.0262, 1.16, 0.99],
  ["北落师门", 22.9608, -29.6222, 1.17, 0.14],
  ["十字架三", 12.7954, -59.6888, 1.25, -0.24],
  ["天津四", 20.6905, 45.2803, 1.25, 0.09],
  ["轩辕十四", 10.1395, 11.9672, 1.36, -0.09],
  ["弧矢七", 6.9771, -28.9721, 1.5, -0.21],
  ["北河二", 7.5766, 31.8883, 1.58, 0.03],
  ["Gacrux", 12.5194, -57.1132, 1.59, 1.6],
  ["Shaula", 17.5601, -37.1038, 1.62, -0.23],
  ["参宿五", 5.4189, 6.3497, 1.64, -0.22],
  ["Elnath", 5.4382, 28.6075, 1.65, -0.13],
  ["Miaplacidus", 9.22, -69.7172, 1.67, 0.07],
  ["参宿二", 5.6036, -1.2019, 1.69, -0.18],
  ["Alnair", 22.1372, -46.961, 1.73, -0.07],
  ["参宿一", 5.6793, -1.9426, 1.74, -0.2],
  ["Gam-2 Vel", 8.1589, -47.3366, 1.75, -0.14],
  ["玉衡", 12.9005, 55.9598, 1.76, -0.02],
  ["Mirfak", 3.4054, 49.8612, 1.79, 0.48],
  ["Kaus Australis", 18.4029, -34.3846, 1.79, -0.03],
  ["天枢", 11.0622, 61.751, 1.81, 1.06],
  ["Wezen", 7.1399, -26.3932, 1.83, 0.67],
  ["摇光", 13.7924, 49.3133, 1.85, -0.1],
  ["Avior", 8.3752, -59.5095, 1.86, 1.2],
  ["Sargas", 17.622, -42.9978, 1.86, 0.41],
  ["Menkalinan", 5.9921, 44.9474, 1.9, 0.08],
  ["Atria", 16.8111, -69.0277, 1.91, 1.45],
  ["Alhena", 6.6285, 16.3993, 1.93, 0.0],
  ["Alsephina", 8.7451, -54.7088, 1.93, 0.04],
  ["Peacock", 20.4275, -56.7351, 1.94, -0.12],
  ["北极星", 2.5297, 89.2641, 1.97, 0.64],
  ["Mirzam", 6.3783, -17.9559, 1.98, -0.24],
  ["Alphard", 9.4598, -8.6586, 1.99, 1.44],
  ["娄宿三", 2.1196, 23.4624, 2.01, 1.15],
  ["Algieba", 10.3329, 19.8415, 2.01, 1.13],
  ["土司空", 0.7265, -17.9866, 2.04, 1.02],
  ["Nunki", 18.9211, -26.2967, 2.05, -0.13],
  ["Menkent", 14.1114, -36.37, 2.06, 1.01],
  ["壁宿二", 0.1398, 29.0904, 2.07, -0.04],
  ["Mirach", 1.1622, 35.6206, 2.07, 1.58],
  ["Saiph", 5.7959, -9.6696, 2.07, -0.17],
  ["Kochab", 14.8451, 74.1555, 2.07, 1.47],
  ["Tiaki", 22.7111, -46.8846, 2.07, 1.61],
  ["Rasalhague", 17.5822, 12.56, 2.08, 0.15],
  ["Algol", 3.1361, 40.9556, 2.09, -0.0],
  ["Almach", 2.065, 42.3297, 2.1, 1.37],
  ["Denebola", 11.8177, 14.5721, 2.14, 0.09],
  ["Cih", 0.9451, 60.7167, 2.15, -0.05],
  ["Gam Cen", 12.692, -48.9599, 2.2, -0.02],
  ["Naos", 8.0597, -40.0031, 2.21, -0.27],
  ["Aspidiske", 9.2848, -59.2752, 2.21, 0.19],
  ["Alphecca", 15.5781, 26.7147, 2.22, 0.03],
  ["Suhail", 9.1333, -43.4326, 2.23, 1.67],
  ["开阳", 13.3987, 54.9254, 2.23, 0.06],
  ["Sadr", 20.3705, 40.2567, 2.23, 0.67],
  ["Schedar", 0.6751, 56.5373, 2.24, 1.17],
  ["Eltanin", 17.9434, 51.4889, 2.24, 1.52],
  ["参宿三", 5.5334, -0.2991, 2.25, -0.17],
  ["Caph", 0.1529, 59.1498, 2.28, 0.38],
  ["Eps Cen", 13.6648, -53.4664, 2.29, -0.17],
  ["Dschubba", 16.0056, -22.6217, 2.29, -0.12],
  ["Larawag", 16.8361, -34.2932, 2.29, 1.14],
  ["Alp Lup", 14.6988, -47.3882, 2.3, -0.15],
  ["Eta Cen", 14.5918, -42.1578, 2.33, -0.16],
  ["天璇", 11.0307, 56.3824, 2.34, 0.03],
  ["Izar", 14.7498, 27.0742, 2.35, 0.97],
  ["Enif", 21.7364, 9.875, 2.38, 1.52],
  ["Kap Sco", 17.7081, -39.03, 2.39, -0.17],
  ["Ankaa", 0.4381, -42.306, 2.4, 1.08],
  ["天玑", 11.8972, 53.6948, 2.41, 0.04],
  ["Sabik", 17.173, -15.7249, 2.43, 0.06],
  ["Scheat", 23.0629, 28.0828, 2.44, 1.66],
  ["Aludra", 7.4016, -29.3031, 2.45, -0.08],
  ["Alderamin", 21.3096, 62.5856, 2.45, 0.26],
  ["Markeb", 9.3686, -55.0107, 2.47, -0.14],
  ["Aljanah", 20.7702, 33.9703, 2.48, 1.02],
  ["Markab", 23.0793, 15.2053, 2.49, -0.0],
  ["Menkar", 3.038, 4.0897, 2.54, 1.63],
  ["Zet Oph", 16.6193, -10.5671, 2.54, 0.04],
  ["Zet Cen", 13.9257, -47.2884, 2.55, -0.18],
  ["Zosma", 11.2351, 20.5237, 2.56, 0.13],
  ["Acrab", 16.0906, -19.8055, 2.56, -0.07],
  ["Arneb", 5.5455, -17.8223, 2.58, 0.21],
  ["Del Cen", 12.1393, -50.7224, 2.58, -0.13],
  ["Gienah", 12.2634, -17.5419, 2.58, -0.11],
  ["Ascella", 19.0435, -29.8801, 2.6, 0.06],
  ["Zubeneschamali", 15.2834, -9.3829, 2.61, -0.07],
  ["Unukalhai", 15.7378, 6.4256, 2.63, 1.17],
  ["Sheratan", 1.9107, 20.808, 2.64, 0.17],
  ["Phact", 5.6608, -34.0741, 2.65, -0.12],
  ["Mahasim", 5.9954, 37.2126, 2.65, -0.08],
  ["Kraz", 12.5731, -23.3968, 2.65, 0.89],
  ["Ruchbah", 1.4302, 60.2353, 2.66, 0.16],
  ["Muphrid", 13.9114, 18.3977, 2.68, 0.58],
  ["Bet Lup", 14.9755, -43.134, 2.68, -0.18],
  ["Hassaleh", 4.9499, 33.1661, 2.69, 1.49],
  ["Mu Vel", 10.7795, -49.4203, 2.69, 0.9],
  ["Alp Mus", 12.6197, -69.1356, 2.69, -0.18],
  ["Lesath", 17.5127, -37.2958, 2.7, -0.18],
  ["Pi Pup", 7.2857, -37.0975, 2.71, 1.62],
  ["Kaus Media", 18.3499, -29.8281, 2.72, 1.38],
  ["Tarazed", 19.771, 10.6133, 2.72, 1.51],
  ["Yed Prior", 16.2391, -3.6943, 2.73, 1.58],
  ["Athebyne", 16.3999, 61.5142, 2.73, 0.91],
  ["The Car", 10.7159, -64.3945, 2.74, -0.22],
  ["Porrima", 12.6943, -1.4494, 2.74, 0.37],
  ["Hatysa", 5.5906, -5.9099, 2.75, -0.21],
  ["Iot Cen", 13.3433, -36.7123, 2.75, 0.07],
  ["Zubenelgenubi", 14.848, -16.0418, 2.75, 0.15],
  ["Cebalrai", 17.7245, 4.5673, 2.76, 1.17],
  ["Cursa", 5.1308, -5.0864, 2.78, 0.16],
  ["Kornephoros", 16.5037, 21.4896, 2.78, 0.95],
  ["Rasalgethi", 17.2441, 14.3903, 2.78, 1.16],
  ["Imai", 12.2524, -58.7489, 2.79, -0.19],
  ["Rastaban", 17.5072, 52.3014, 2.79, 0.95],
  ["Gam Lup", 15.5857, -41.1668, 2.8, -0.22],
  ["Nihal", 5.4708, -20.7594, 2.81, 0.81],
  ["Zet Her", 16.6881, 31.6027, 2.81, 0.65],
  ["Bet Hyi", 0.4279, -77.2542, 2.82, 0.62],
  ["Paikauhale", 16.598, -28.216, 2.82, -0.21],
  ["Kaus Borealis", 18.4662, -25.4217, 2.82, 1.02],
  ["Algenib", 0.2206, 15.1836, 2.83, -0.19],
  ["Tureis", 8.1257, -24.3043, 2.83, 0.46],
  ["Bet TrA", 15.9191, -63.4307, 2.83, 0.32],
  ["Zet Per", 3.9022, 31.8836, 2.84, 0.27],
  ["Bet Ara", 17.4217, -55.5299, 2.84, 1.48],
  ["Alp Ara", 17.5307, -49.8761, 2.84, -0.14],
  ["Alcyone", 3.7914, 24.1051, 2.85, -0.09],
  ["Vindemiatrix", 13.0363, 10.9591, 2.85, 0.93],
  ["Deneb Algedi", 21.784, -16.1273, 2.85, 0.18],
  ["Alp Hyi", 1.9795, -61.5699, 2.86, 0.29],
  ["Fawaris", 19.7496, 45.1308, 2.86, -0.0],
  ["Tejat", 6.3827, 22.5136, 2.87, 1.62],
  ["Gam TrA", 15.3152, -68.6795, 2.87, 0.01],
  ["Alp Tuc", 22.3084, -60.2596, 2.87, 1.39],
  ["Acamar", 2.971, -40.3047, 2.88, 0.13],
  ["Albaldah", 19.1627, -21.0236, 2.88, 0.38],
  ["Gomeisa", 7.4525, 8.2893, 2.89, -0.1],
  ["Cor Caroli", 12.9338, 38.3184, 2.89, -0.12],
  ["Fang", 15.9809, -26.1141, 2.89, -0.18],
  ["Eps Per", 3.9642, 40.0102, 2.9, -0.2],
  ["Alniyat", 16.3531, -25.5928, 2.9, 0.3],
  ["Sadalsuud", 21.526, -5.5712, 2.9, 0.83],
  ["Gam Per", 3.0799, 53.5064, 2.91, 0.72],
  ["Ups Car", 9.785, -65.072, 2.92, 0.27],
  ["Matar", 22.7167, 30.2212, 2.93, 0.85],
  ["Tau Pup", 6.8323, -50.6146, 2.94, 1.21],
  ["Algorab", 12.4977, -16.5154, 2.94, -0.01],
  ["Sadalmelik", 22.0964, -0.3199, 2.95, 0.97],
  ["Zaurak", 3.9672, -13.5085, 2.97, 1.59],
  ["Tianguan", 5.6274, 21.1425, 2.97, -0.15],
  ["Ras Elased Australis", 9.7642, 23.7743, 2.97, 0.81],
  ["Alnasl", 18.0968, -30.4241, 2.98, 0.98],
  ["Gam Hya", 13.3154, -23.1715, 2.99, 0.92],
  ["Iot-1 Sco", 17.7931, -40.127, 2.99, 0.51],
  ["Okab", 19.0902, 13.8635, 2.99, 0.01],
  ["Bet Tri", 2.1591, 34.9873, 3.0, 0.14],
  ["Psi UMa", 11.1611, 44.4985, 3.0, 1.14],
  ["Pherkad", 15.3455, 71.834, 3.0, 0.06],
  ["Xamidimura", 16.8645, -38.0474, 3.0, -0.2],
  ["Aldhanab", 21.8988, -37.3649, 3.0, -0.08],
  ["Del Per", 3.7154, 47.7876, 3.01, -0.12],
  ["Furud", 6.3386, -30.0634, 3.02, -0.16],
  ["Omi-2 CMa", 7.0504, -23.8333, 3.02, -0.08],
  ["Eps Crv", 12.1687, -22.6198, 3.02, 1.33],
  ["Almaaz", 5.0328, 43.8233, 3.03, 0.54],
  ["Bet Mus", 12.7713, -68.1081, 3.04, -0.18],
  ["Seginus", 14.5346, 38.3083, 3.04, 0.19],
  ["Albireo", 19.512, 27.9597, 3.05, 1.09],
  ["Dabih", 20.3502, -14.7814, 3.05, 0.79],
  ["Mebsuta", 6.7322, 25.1311, 3.06, 1.38],
  ["Tania Australis", 10.3722, 41.4995, 3.06, 1.6],
  ["Altais", 19.2092, 67.6615, 3.07, 0.99],
  ["Eta Sgr", 18.2938, -36.7617, 3.1, 1.58],
  ["Zet Hya", 8.9232, 5.9456, 3.11, 0.98],
  ["Nu Hya", 10.8271, -16.1936, 3.11, 1.23],
  ["Lam Cen", 11.5964, -63.0198, 3.11, -0.04],
  ["Alp Ind", 20.6261, -47.2915, 3.11, 1.0],
  ["Wazn", 5.8493, -35.7683, 3.12, 1.15],
  ["Talitha", 8.9868, 48.0418, 3.12, 0.22],
  ["Zet Ara", 16.977, -55.9901, 3.12, 1.55],
  ["Sarin", 17.2505, 24.8392, 3.12, 0.08],
  ["Kap Cen", 14.986, -42.1042, 3.13, -0.21],
  ["Alp Lyn", 9.3509, 34.3926, 3.14, 1.55],
  ["HIP 46701", 9.5204, -57.0344, 3.16, 1.54],
  ["Pi Her", 17.2508, 36.8092, 3.16, 1.44],
  ["Nu Pup", 6.6294, -43.1959, 3.17, -0.1],
  ["The UMa", 9.5477, 51.6773, 3.17, 0.47],
  ["Aldhibah", 17.1464, 65.7147, 3.17, -0.12],
  ["Phi Sgr", 18.7609, -26.9908, 3.17, -0.11],
  ["Haedus", 5.1086, 41.2345, 3.18, -0.15],
  ["Alp Cir", 14.7085, -64.9751, 3.18, 0.26],
  ["Tabit", 4.8307, 6.9613, 3.19, 0.48],
  ["Eps Lep", 5.091, -22.371, 3.19, 1.46],
  ["Kap Oph", 16.9611, 9.375, 3.19, 1.16],
  ["Fuyue", 17.831, -37.0433, 3.19, 1.19],
  ["Zet Cyg", 21.2156, 30.2269, 3.21, 0.99],
  ["Errai", 23.6558, 77.6323, 3.21, 1.03],
  ["Del Lup", 15.3562, -40.6475, 3.22, -0.23],
  ["Yed Posterior", 16.3054, -4.6925, 3.23, 0.97],
  ["Eta Ser", 18.3552, -2.8988, 3.23, 0.94],
  ["Alfirk", 21.4777, 70.5607, 3.23, -0.2],
  ["Alp Pic", 6.8032, -61.9414, 3.24, 0.23],
  ["The Aql", 20.1884, -0.8215, 3.24, -0.07],
  ["Sig Pup", 7.4872, -43.3014, 3.25, 1.51],
  ["Pi Hya", 14.1062, -26.6824, 3.25, 1.09],
  ["Brachium", 15.0678, -25.282, 3.25, 1.67],
  ["Sulafat", 18.9824, 32.6896, 3.25, -0.05],
  ["Gam Hyi", 3.7873, -74.239, 3.26, 1.59],
  ["Del And", 0.6555, 30.861, 3.27, 1.27],
  ["The Oph", 17.3668, -24.9995, 3.27, -0.19],
  ["Skat", 22.9108, -15.8208, 3.27, 0.07],
  ["Mu Lep", 5.2155, -16.2055, 3.29, -0.11],
  ["Ome Car", 10.229, -70.0379, 3.29, -0.07],
  ["Edasich", 15.4155, 58.9661, 3.29, 1.17],
  ["Alp Dor", 4.5666, -55.045, 3.3, -0.08],
  ["HIP 51576", 10.5337, -61.6853, 3.3, -0.09],
  ["Propus", 6.248, 22.5068, 3.31, 1.6],
  ["Gam Ara", 17.4232, -56.3777, 3.31, -0.15],
  ["Bet Phe", 1.1014, -46.7184, 3.32, 0.89],
  ["Rho Per", 3.0863, 38.8403, 3.32, 1.53],
  ["天权", 12.2571, 57.0326, 3.32, 0.08],
  ["Eta Sco", 17.2026, -43.2392, 3.32, 0.44],
  ["Nu Oph", 17.9838, -9.7736, 3.32, 0.99],
  ["Tau Sgr", 19.1157, -27.6704, 3.32, 1.17],
  ["Alp Ret", 4.2404, -62.4739, 3.33, 0.92],
  ["Chertan", 11.2373, 15.4296, 3.33, -0.0],
  ["Azmidi", 7.8216, -24.8598, 3.34, 1.22],
  ["Segin", 1.9066, 63.6701, 3.35, -0.15],
  ["Eta Ori", 5.4079, -2.3971, 3.35, -0.24],
  ["Alzirr", 6.7548, 12.8956, 3.35, 0.44],
  ["Muscida", 8.5044, 60.7182, 3.35, 0.86],
  ["Del Aql", 19.425, 3.1148, 3.36, 0.32],
  ["Eps Lup", 15.378, -44.6896, 3.37, -0.19],
  ["Ashlesha", 8.7796, 6.4188, 3.38, 0.69],
  ["Heze", 13.5782, -0.5958, 3.38, 0.11],
  ["Meissa", 5.5856, 9.9342, 3.39, -0.16],
  ["HIP 50371", 10.2847, -61.3323, 3.39, 1.54],
  ["Minelauva", 12.9267, 3.3975, 3.39, 1.57],
  ["Zet Cep", 22.1809, 58.2013, 3.39, 1.56],
  ["Chamukuy", 4.4777, 15.8709, 3.4, 0.18],
  ["Gam Phe", 1.4728, -43.3182, 3.41, 1.54],
  ["Lam Tau", 4.0113, 12.4903, 3.41, -0.1],
  ["Nu Cen", 13.8251, -41.6877, 3.41, -0.23],
  ["Zet Lup", 15.2048, -52.0992, 3.41, 0.92],
  ["Eta Cep", 20.7548, 61.8388, 3.41, 0.91],
  ["Homam", 22.691, 10.8314, 3.41, -0.09],
  ["Mothallah", 1.8847, 29.5788, 3.42, 0.49],
  ["Eta Lup", 16.002, -38.3967, 3.42, -0.21],
  ["Mu Her", 17.7743, 27.7207, 3.42, 0.75],
  ["Bet Pav", 20.7493, -66.2032, 3.42, 0.16],
  ["HIP 45080", 9.1828, -58.9669, 3.43, -0.19],
  ["Adhafera", 10.2782, 23.4173, 3.43, 0.31],
  ["Lam Aql", 19.1042, -4.8826, 3.43, -0.1],
  ["Tania Borealis", 10.285, 42.9144, 3.45, 0.03],
  ["Achird", 0.8183, 57.8152, 3.46, 0.59],
  ["Eta Cet", 1.1432, -10.1823, 3.46, 1.16],
  ["Chi Car", 7.9463, -52.9824, 3.46, -0.18],
  ["Del Boo", 15.2584, 33.3148, 3.46, 0.96],
  ["Kaffaljidhma", 2.7217, 3.2358, 3.47, 0.09],
  ["Mu Cen", 13.8269, -42.4737, 3.47, -0.17],
  ["Eta Leo", 10.1222, 16.7627, 3.48, -0.03],
  ["Eta Her", 16.7149, 38.9223, 3.48, 0.92],
  ["Tau Cet", 1.7345, -15.9375, 3.49, 0.73],
  ["Nganurganity", 7.0287, -27.9348, 3.49, 1.73],
  ["Alula Borealis", 11.308, 33.0943, 3.49, 1.4],
  ["Nekkar", 15.0324, 40.3906, 3.49, 0.96],
  ["Alp Tel", 18.4496, -45.9685, 3.49, -0.18],
  ["Eps Gru", 22.8092, -51.3169, 3.49, 0.08],
  ["Kap CMa", 6.8307, -32.5085, 3.5, -0.12],
  ["Wasat", 7.3354, 21.9823, 3.5, 0.37],
  ["Iot Cep", 22.828, 66.2004, 3.5, 1.05],
  ["Gam Sge", 19.9793, 19.4921, 3.51, 1.57],
  ["Sadalbari", 22.8334, 24.6016, 3.51, 0.93],
  ["Rana", 3.7208, -9.7634, 3.52, 0.92],
  ["Subra", 9.6858, 9.8923, 3.52, 0.52],
  ["Phi Vel", 9.9477, -54.5678, 3.52, -0.07],
  ["Sheliak", 18.8347, 33.3627, 3.52, 0.0],
  ["Xi-2 Sgr", 18.9622, -21.1067, 3.52, 1.15],
  ["Biham", 22.17, 6.1979, 3.52, 0.09],
  ["Ain", 4.4769, 19.1804, 3.53, 1.01],
  ["Tarf", 8.2753, 9.1855, 3.53, 1.48],
  ["Xi Hya", 11.55, -31.8576, 3.54, 0.95],
  ["Mu Ser", 15.827, -3.4302, 3.54, -0.04],
  ["Xi Ser", 17.6264, -15.3986, 3.54, 0.26],
  ["Ups-4 Eri", 4.2982, -33.7983, 3.55, -0.11],
  ["Zet Lep", 5.7826, -14.8219, 3.55, 0.1],
  ["Iot Lup", 14.3234, -46.0581, 3.55, -0.18],
  ["Chi Dra", 18.3507, 72.7328, 3.55, 0.49],
  ["Del Pav", 20.1452, -66.1821, 3.55, 0.75],
  ["Iot Cet", 0.3238, -8.8239, 3.56, 1.21],
  ["Phi Eri", 2.2752, -51.5122, 3.56, -0.12],
  ["Del Crt", 11.3223, -14.7785, 3.56, 1.11],
  ["Pipirima", 16.8723, -38.0175, 3.56, -0.21],
  ["Kap Gem", 7.7408, 24.398, 3.57, 0.93],
  ["Alkaphrah", 9.0604, 47.1565, 3.57, 0.01],
  ["Rho Boo", 14.5305, 30.3714, 3.57, 1.3],
  ["Phi-1 Lup", 15.3634, -36.2614, 3.57, 1.53],
  ["Lam Gem", 7.3015, 16.5404, 3.58, 0.11],
  ["Algedi", 20.3009, -12.5449, 3.58, 0.88],
  ["Nembus", 1.6332, 48.6282, 3.59, 1.27],
  ["Tau Ori", 5.2934, -6.8444, 3.59, -0.12],
  ["Gam Lep", 5.7411, -22.4484, 3.59, 0.48],
  ["Zavijava", 11.8449, 1.7647, 3.59, 0.52],
  ["Ginan", 12.356, -60.4011, 3.59, 1.39],
  ["The Cet", 1.4004, -8.1833, 3.6, 1.06],
  ["The Gem", 6.8798, 33.9613, 3.6, 0.1],
  ["Omi Vel", 8.6716, -52.9219, 3.6, -0.17],
  ["Psi Vel", 9.5117, -40.4668, 3.6, 0.37],
  ["Ups Lib", 15.6171, -28.1351, 3.6, 1.36],
  ["Del Ara", 17.5183, -60.6838, 3.6, -0.1],
  ["Bharani", 2.8331, 27.2605, 3.61, -0.1],
  ["Omi Tau", 3.4136, 9.0289, 3.61, 0.89],
  ["Lam Hya", 10.1765, -12.3541, 3.61, 1.01],
  ["Del Mus", 13.0378, -71.5489, 3.61, 1.19],
  ["Eta Pav", 17.7622, -64.7239, 3.61, 1.16],
  ["Alpherg", 1.5247, 15.3458, 3.62, 0.97],
  ["Atlas", 3.8194, 24.0534, 3.62, -0.07],
  ["HIP 37819", 7.7542, -37.9686, 3.62, 1.71],
  ["Zet-2 Sco", 16.9097, -42.3613, 3.62, 1.39],
  ["Omi And", 23.032, 42.326, 3.62, -0.1],
  ["Lam Mus", 11.7601, -66.7288, 3.63, 0.16],
  ["Rotanev", 20.6258, 14.5951, 3.64, 0.42],
  ["Prima Hyadum", 4.3299, 15.6276, 3.65, 0.98],
  ["23 UMa", 9.5255, 63.0619, 3.65, 0.36],
  ["Bet Ser", 15.7698, 15.4218, 3.65, 0.07],
  ["The Ara", 18.1105, -50.0915, 3.65, -0.1],
  ["Zet-1 Aqr", 22.4805, -0.02, 3.65, 0.41],
  ["Nusakan", 15.4638, 29.1057, 3.66, 0.32],
  ["Tau Lib", 15.6443, -29.7778, 3.66, -0.18],
  ["Thuban", 14.0732, 64.3758, 3.67, -0.05],
  ["Bet Ind", 20.9135, -58.4542, 3.67, 1.25],
  ["Pi-4 Ori", 4.8534, 5.6051, 3.68, -0.16],
  ["Alp Pyx", 8.7265, -33.1864, 3.68, -0.18],
  ["Del Sge", 19.7898, 18.5343, 3.68, 1.31],
  ["88 Aqr", 23.1574, -21.1724, 3.68, 1.2],
  ["Fulu", 0.6162, 53.8969, 3.69, -0.2],
  ["Chi Eri", 1.9326, -51.6089, 3.69, 0.84],
  ["Saclateni", 5.0413, 41.0758, 3.69, 1.15],
  ["HIP 47854", 9.7541, -62.5079, 3.69, 1.01],
  ["Taiyangshou", 11.7675, 47.7794, 3.69, 1.18],
  ["Nashira", 21.6682, -16.6623, 3.69, 0.32],
  ["Tau-4 Eri", 3.3253, -21.7579, 3.7, 1.61],
  ["Xi Her", 17.9627, 29.2479, 3.7, 0.94],
  ["Gam Psc", 23.2861, 3.2823, 3.7, 0.92],
  ["Pi-5 Ori", 4.9042, 2.4407, 3.71, -0.18],
  ["Eta Lep", 5.9401, -14.1677, 3.71, 0.34],
  ["HIP 38414", 7.8703, -40.5758, 3.71, 1.01],
  ["Eps Ser", 15.8469, 4.4777, 3.71, 0.15],
  ["72 Oph", 18.1225, 9.5638, 3.71, 0.16],
  ["Alshain", 19.9219, 6.4068, 3.71, 0.85],
  ["Ran", 3.5488, -9.4583, 3.72, 0.88],
  ["Electra", 3.7479, 24.1133, 3.72, -0.1],
  ["Del Aur", 5.9921, 54.2847, 3.72, 1.01],
  ["Xi Cyg", 21.0822, 43.9279, 3.72, 1.61],
  ["Xi Tau", 3.4528, 9.7327, 3.73, -0.08],
  ["109 Vir", 14.7708, 1.8929, 3.73, -0.01],
  ["Grumium", 17.8921, 56.8726, 3.73, 1.18],
  ["Nu Oct", 21.6913, -77.39, 3.73, 1.01],
  ["Lam Aqr", 22.8769, -7.5796, 3.73, 1.63],
  ["Baten Kaitos", 1.8577, -10.335, 3.74, 1.14],
  ["Gam Her", 16.3653, 19.1531, 3.74, 0.3],
  ["Tau Cyg", 21.2465, 38.0453, 3.74, 0.39],
  ["HIP 44511", 9.0692, -47.0977, 3.75, 1.17],
  ["Gam Oph", 17.7982, 2.7073, 3.75, 0.04],
  ["Bet Dor", 5.5604, -62.4898, 3.76, 0.64],
  ["Del Lep", 5.8554, -20.8791, 3.76, 0.98],
  ["Bet Mon", 6.4803, -7.0331, 3.76, -0.11],
  ["Omi Sgr", 19.0781, -21.7415, 3.76, 1.01],
  ["Iot-2 Cyg", 19.4951, 51.7298, 3.76, 0.15],
  ["Alp Lac", 22.5215, 50.2825, 3.76, 0.03],
  ["Miram", 2.8449, 55.8955, 3.77, 1.69],
  ["Nu Per", 3.7532, 42.5785, 3.77, 0.42],
  ["Secunda Hyadum", 4.3822, 17.5425, 3.77, 0.98],
  ["Sig Ori", 5.6458, -2.6001, 3.77, -0.19],
  ["Bet Vol", 8.429, -66.1369, 3.77, 1.13],
  ["HIP 42570", 8.6771, -46.6487, 3.77, 0.67],
  ["Eta Ara", 16.8298, -59.0414, 3.77, 1.56],
  ["Sualocin", 20.6606, 15.9121, 3.77, -0.06],
  ["Zet Cap", 21.4445, -22.4113, 3.77, 1.0],
  ["Iot Peg", 22.1168, 25.3451, 3.77, 0.43],
  ["Gam-2 Vol", 7.1458, -70.4989, 3.78, 1.01],
  ["Iot Gem", 7.4288, 27.7981, 3.78, 1.02],
  ["Ups UMa", 9.8499, 59.0387, 3.78, 0.29],
  ["HIP 53253", 10.8916, -58.8532, 3.78, 0.94],
  ["Zet Boo", 14.6858, 13.7283, 3.78, 0.04],
  ["Albali", 20.7946, -9.4958, 3.78, 0.0],
  ["Misam", 3.1583, 44.8575, 3.79, 0.98],
  ["Praecipua", 10.8885, 34.2149, 3.79, 1.04],
  ["Dalim", 3.2012, -28.9876, 3.8, 0.54],
  ["HIP 37229", 7.6472, -26.8038, 3.8, -0.16],
  ["Del Ser", 15.58, 10.5389, 3.8, 0.27],
  ["Kap Cyg", 19.285, 53.3685, 3.8, 0.95],
  ["31 Cyg", 20.2272, 46.7413, 3.8, 1.27],
  ["Theemin", 4.5925, -30.5623, 3.81, 0.96],
  ["HIP 51232", 10.4646, -58.7394, 3.81, 0.32],
  ["Gam CrB", 15.7124, 26.2956, 3.81, 0.02],
  ["Lam And", 23.6261, 46.4582, 3.81, 0.98],
  ["Alrescha", 2.0341, 2.7638, 3.82, 0.02],
  ["38 Lyn", 9.3141, 36.8026, 3.82, 0.07],
  ["Giausar", 11.5234, 69.3311, 3.82, 1.61],
  ["Marfik", 16.5152, 1.9839, 3.82, 0.02],
  ["Iot Her", 17.6577, 46.0063, 3.82, -0.18],
  ["Mu Hya", 10.4348, -16.8363, 3.83, 1.46],
  ["Phi Cen", 13.9712, -42.1008, 3.83, -0.22],
  ["Alp Aps", 14.7977, -79.0448, 3.83, 1.43],
  ["Bet Ret", 3.7366, -64.8069, 3.84, 1.13],
  ["Atik", 3.7386, 32.2882, 3.84, 0.02],
  ["The-1 Tau", 4.4762, 15.9622, 3.84, 0.95],
  ["HIP 43783", 8.9175, -60.6446, 3.84, -0.1],
  ["Rho Leo", 10.5469, 9.3066, 3.84, -0.15],
  ["HIP 51986", 10.6217, -48.2256, 3.84, 0.3],
  ["Gam Mus", 12.5411, -72.133, 3.84, -0.16],
  ["Omi Her", 18.1257, 28.7625, 3.84, -0.02],
  ["Polis", 18.2294, -21.0588, 3.84, 0.2],
  ["Eps Dra", 19.8028, 70.2679, 3.84, 0.89],
  ["Alp Hor", 4.2334, -42.2944, 3.85, 1.08],
  ["Bet Pic", 5.7881, -51.0665, 3.85, 0.17],
  ["Del Col", 6.3686, -33.4364, 3.85, 0.86],
  ["HIP 50191", 10.2456, -42.1219, 3.85, 0.05],
  ["Kap Dra", 12.5581, 69.7882, 3.85, -0.12],
  ["Tau Cen", 12.6284, -48.5413, 3.85, 0.05],
  ["Gam Ser", 15.9409, 15.6616, 3.85, 0.48],
  ["109 Her", 18.395, 21.7698, 3.85, 1.17],
  ["Alp Sct", 18.5868, -8.2441, 3.85, 1.32],
  ["Mu And", 0.9459, 38.4993, 3.86, 0.13],
  ["Sceptrum", 4.6363, -14.304, 3.86, 1.08],
  ["Eps Col", 5.5202, -35.4705, 3.86, 1.13],
  ["Del TrA", 16.2573, -63.6857, 3.86, 1.1],
  ["Gam Aps", 16.5576, -78.8971, 3.86, 0.92],
  ["The Her", 17.9376, 37.2505, 3.86, 1.35],
  ["Sadachbia", 22.3609, -1.3873, 3.86, -0.06],
  ["Maia", 3.7638, 24.3677, 3.87, -0.06],
  ["HIP 43023", 8.7671, -46.0415, 3.87, 0.01],
  ["Ups-1 Cen", 13.978, -44.8036, 3.87, -0.21],
  ["Mu Vir", 14.7177, -5.6582, 3.87, 0.39],
  ["Iklil", 15.9481, -29.2141, 3.87, -0.2],
  ["Eta Aql", 19.8745, 1.0057, 3.87, 0.63],
  ["Eps Phe", 0.1568, -45.7474, 3.88, 1.01],
  ["Mesarthim", 1.8922, 19.2939, 3.88, -0.05],
  ["Rasalas", 9.8794, 26.007, 3.88, 1.22],
  ["Kap-1 Lup", 15.1989, -48.7378, 3.88, -0.03],
  ["Iot Gru", 23.1726, -45.2467, 3.88, 1.0],
  ["Azha", 2.9405, -8.8981, 3.89, 1.09],
  ["Omi-1 CMa", 6.9022, -24.1842, 3.89, 1.74],
  ["The Hya", 9.2394, 2.3143, 3.89, -0.06],
  ["Zaniah", 12.3318, -0.6668, 3.89, 0.03],
  ["Eta Cyg", 19.9384, 35.0834, 3.89, 1.02],
  ["Ukdah", 9.6643, -1.1428, 3.9, 1.31],
  ["Pi Cen", 11.3501, -54.491, 3.9, -0.16],
  ["HIP 65936", 13.5174, -39.4073, 3.9, 1.19],
  ["Nu Tau", 4.0526, 5.9893, 3.91, 0.03],
  ["HIP 41307", 8.4277, -3.9064, 3.91, -0.01],
  ["Sig Cen", 12.4673, -50.2306, 3.91, -0.19],
  ["Pi Lup", 15.0853, -47.0512, 3.91, -0.14],
  ["Zubenelhakrabi", 15.5921, -14.7895, 3.91, 1.01],
  ["Tau Her", 16.329, 46.3134, 3.91, -0.15],
  ["Eps Her", 17.0048, 30.9264, 3.92, -0.02],
  ["Rho-1 Sgr", 19.3612, -17.8472, 3.92, 0.23],
  ["Kitalpha", 21.2637, 5.2478, 3.92, 0.55],
  ["Kap Phe", 0.4367, -43.6798, 3.93, 0.17],
  ["Del Phe", 1.5209, -49.0727, 3.93, 0.97],
  ["Tau Per", 2.9043, 52.7625, 3.93, 0.76],
  ["Nu Eri", 4.6053, -3.3525, 3.93, -0.21],
  ["Zet Vol", 7.697, -72.6061, 3.93, 1.03],
  ["HIP 54463", 11.1432, -58.975, 3.93, 1.23],
  ["Ome-1 Sco", 16.1135, -20.6692, 3.93, -0.05],
  ["67 Oph", 18.0108, 2.9316, 3.93, 0.03],
  ["Wurren", 1.1397, -55.2458, 3.94, -0.12],
  ["Alp Mon", 7.6875, -9.5511, 3.94, 1.02],
  ["3 Pup", 7.7301, -28.9548, 3.94, 0.16],
  ["Asellus Australis", 8.7447, 18.1543, 3.94, 1.08],
  ["Nu Cyg", 20.9529, 41.1671, 3.94, 0.03],
  ["50 Cas", 2.0573, 72.4213, 3.95, -0.0],
  ["Nu-2 CMa", 6.6114, -19.2559, 3.95, 1.04],
  ["48 Per", 4.1444, 47.7125, 3.96, -0.03],
  ["Eta Col", 5.9858, -42.8151, 3.96, 1.15],
  ["HIP 44248", 9.0107, 41.7829, 3.96, 0.46],
  ["HIP 45101", 9.188, -62.317, 3.96, -0.18],
  ["Arkab Prior", 19.3773, -44.459, 3.96, -0.09],
  ["Rukbat", 19.3981, -40.6159, 3.96, -0.1],
  ["32 Cyg", 20.2579, 47.7142, 3.96, 1.45],
  ["98 Aqr", 23.3828, -20.1006, 3.96, 1.08],
  ["Beemim", 4.4006, -34.0168, 3.97, 1.47],
  ["Nu Aur", 5.8582, 39.1485, 3.97, 1.13],
  ["Del Vol", 7.2805, -67.9572, 3.97, 0.76],
  ["Bet Pyx", 8.6684, -35.3084, 3.97, 0.94],
  ["Rho Cen", 12.1942, -52.3685, 3.97, -0.16],
  ["Chi Lup", 15.8493, -33.6272, 3.97, -0.04],
  ["Eps Pav", 20.0098, -72.9105, 3.97, -0.03],
  ["Del-1 Gru", 22.4878, -43.4956, 3.97, 1.02],
  ["Lam Peg", 22.7755, 23.5657, 3.97, 1.07],
  ["Menkib", 3.9827, 35.791, 3.98, 0.02],
  ["Rho Cyg", 21.5663, 45.5918, 3.98, 0.89],
  ["Ups Cet", 2.0001, -21.0778, 3.99, 1.55],
  ["Gam Mon", 6.2476, -6.2748, 3.99, 1.32],
  ["HIP 50954", 10.4066, -74.0316, 3.99, 0.37],
  ["Alcor", 13.4204, 54.988, 3.99, 0.17],
  ["Gam Tuc", 23.2905, -58.2357, 3.99, 0.41],
];
const XK = { duty: 0, timer: 0 };
function xkDuty(civ) {
  const dn = Math.floor(jdFromGreg(civ.y, civ.m, civ.d, 12) + 0.5 + 1e-9);
  return (((dn + XIU_ANCHOR) % 28) + 28) % 28;
}
function xkRel(i) {
  const mw = { 木: 0, 火: 1, 土: 2, 金: 3, 水: 4, 相火: 1 }[JL_MER[JL.now].wx];
  const c = XK_XIU[i][0][1];
  const xw = { 木: 0, 火: 1, 土: 2, 金: 3, 水: 4 }[c];
  if (xw == null) return "七曜属日月，不入五行生克";
  const r = (xw - mw + 5) % 5;
  return ["与当令经络同气", "当令经络生" + c, "当令经络克" + c, c + "克当令经络", c + "生当令经络"][
    r
  ];
}
function xkInfoHtml(i) {
  const x = XK_XIU[i],
    xg = XIANG[x[1]];
  return (
    "<h4>" +
    x[0] +
    ' <span class="' +
    (x[2] === "吉" ? "good" : "bad") +
    '">' +
    x[2] +
    "</span></h4>" +
    '<div class="jl-tags"><span>' +
    xg[0] +
    "</span><span>" +
    xg[1] +
    "方</span><span>" +
    xg[3] +
    "季</span><span>七曜 " +
    x[0][1] +
    "·" +
    x[0].slice(2) +
    "</span></div>" +
    "<p>" +
    x[3] +
    '。</p><p class="dim sm">' +
    xkRel(i) +
    "（传统对应，仅供参考）。</p>"
  );
}
function xkTable() {
  let h =
    '<table class="xk-t"><thead><tr><th>星宿</th><th>四象</th><th>方位</th><th>季节</th><th>七曜</th><th>吉凶</th><th>宜忌</th></tr></thead><tbody>';
  for (let g = 0; g < 4; g++)
    for (let k = 0; k < 7; k++) {
      const i = g === 0 ? k : g === 1 ? 21 + k : g === 2 ? 14 + k : 7 + k;
      const x = XK_XIU[i],
        xg = XIANG[x[1]];
      h +=
        "<tr" +
        (i === XK.duty ? ' class="hl"' : "") +
        "><td><b>" +
        x[0] +
        "</b></td><td>" +
        xg[0] +
        "</td><td>" +
        xg[1] +
        "</td><td>" +
        xg[3] +
        "</td><td>" +
        x[0][1] +
        "·" +
        x[0].slice(2) +
        '</td><td class="' +
        (x[2] === "吉" ? "good" : "bad") +
        '">' +
        x[2] +
        "</td><td>" +
        x[3] +
        "</td></tr>";
    }
  return h + "</tbody></table>";
}
function renderXingkong(R) {
  const duty = xkDuty(R.civ);
  XK.duty = duty;
  const x = XK_XIU[duty],
    tmr = XK_XIU[(duty + 1) % 28];
  return (
    '<div class="nw-card wide"><h3 class="sec">当下可见星空 <span class="dim sm">实时推算 · 2D / 全天球3D</span></h3>' +
    '<div class="xk-modebar" role="tablist" aria-label="星空显示模式"><button type="button" class="on" data-xk-mode="2d">地平星空 2D</button><button type="button" data-xk-mode="3d">全天球 3D</button><span class="astro-gesture-hint" id="xkGesture">3D：<b>拖动旋转</b> · <b>滚轮缩放</b> · 双击复位</span></div>' +
    '<div class="xk-wrap"><div><div class="xk-cvwrap"><canvas id="xkSky" width="760" height="760"></canvas><canvas id="xkSky3d" width="760" height="760" hidden></canvas></div>' +
    '<div class="xk3-tools" id="xk3Tools" hidden><label><input type="checkbox" id="xk3Grid" checked> 赤道网格</label><label><input type="checkbox" id="xk3Ecl" checked> 黄道</label><label><input type="checkbox" id="xk3Const" checked> 星座连线</label><label><input type="checkbox" id="xk3ConstName" checked> 星座名称</label><label><input type="checkbox" id="xk3Hor" checked> 地平圈</label><label><input type="checkbox" id="xk3Mer" checked> 子午圈</label><label><input type="checkbox" id="xk3Lab" checked> 亮星名称</label><label><input type="checkbox" id="xk3Auto"> 自动旋转</label><button type="button" class="gbtn sm" id="xk3Reset">复位视角</button></div><div class="xk3-caption" id="xk3Cap" hidden>观测者地平基准全天球：默认面向南方抬头，地平圈作为视觉基准；地平线以下星体淡化，拖动可转向不同方位。</div></div>' +
    '<div class="xk-side"><div class="xk-duty">今日 <b>' +
    x[0] +
    "</b> 值日 · 明日 <b>" +
    tmr[0] +
    "</b></div>" +
    '<div id="xkInfo" class="jl-info">' +
    xkInfoHtml(duty) +
    "</div>" +
    '<p class="note" id="xkCap"></p></div></div>' +
    '<p class="note">依据 HYG 亮星星表（514 颗，J2000 历元，岁差改正至当日）与当前时刻、所设经纬度实时推算。2D 为观测者地平视图；3D 为完整天球外视模型，并加入黄道十二星座和主要星座识别骨架，可开关星座连线与名称。值日宿与择日页同源推算，仅供参考。</p></div>' +
    '<div class="nw-card wide"><h3 class="sec">二十八宿对应表</h3><div class="xk-tbl">' +
    xkTable() +
    "</div></div>"
  );
}
/* ---- 真实星空:亮星星表(J2000)+岁差改正 -> 地平坐标,仰视天穹图 ---- */
function xkPrecess(raH, decD, jd) {
  // J2000 赤道坐标岁差改正至当日(平位置)
  const T = (jd - 2451545.0) / 36525;
  const zeta = ((2306.2181 * T + 0.30188 * T * T + 0.017998 * T * T * T) / 3600) * D2R;
  const z = ((2306.2181 * T + 1.09468 * T * T + 0.018203 * T * T * T) / 3600) * D2R;
  const th = ((2004.3109 * T - 0.42665 * T * T - 0.041833 * T * T * T) / 3600) * D2R;
  const ra = raH * 15 * D2R,
    dec = decD * D2R;
  const x = Math.cos(dec) * Math.cos(ra),
    y = Math.cos(dec) * Math.sin(ra),
    zz = Math.sin(dec);
  const x1 = x * Math.cos(zeta) - y * Math.sin(zeta),
    y1 = x * Math.sin(zeta) + y * Math.cos(zeta),
    z1 = zz;
  const x2 = x1 * Math.cos(th) - z1 * Math.sin(th),
    y2 = y1,
    z2 = x1 * Math.sin(th) + z1 * Math.cos(th);
  const x3 = x2 * Math.cos(z) - y2 * Math.sin(z),
    y3 = x2 * Math.sin(z) + y2 * Math.cos(z),
    z3 = z2;
  let a = Math.atan2(y3, x3) / D2R;
  if (a < 0) a += 360;
  return { ra: a, dec: Math.asin(Math.max(-1, Math.min(1, z3))) / D2R };
}
function xkStarColor(bv) {
  if (bv == null || isNaN(bv)) return "#e9edff";
  if (bv < 0) return "#cfe0ff";
  if (bv < 0.35) return "#e9edff";
  if (bv < 0.65) return "#f6f1e4";
  if (bv < 1.05) return "#ffe7bd";
  if (bv < 1.45) return "#ffcd96";
  return "#ff9d78";
}
function xkSkyDraw() {
  const cv = $("#xkSky");
  if (!cv || !$("#pane-xingkong").classList.contains("on")) return;
  const ctx = cv.getContext("2d");
  if (!ctx) {
    visRuntimeReport("地平星空2D", "Canvas 2D 上下文不可用");
    return;
  }
  const W = cv.width,
    H = cv.height,
    cx = W / 2,
    cy = H / 2,
    Rad = W / 2 - 48;
  const jd = nwNowJD(),
    loc = nwLoc(),
    lon = +loc.lon,
    lat = +loc.lat;
  const sun = nwSun(jd, lon, lat),
    moon = nwMoon(jd, lon, lat),
    day = sun.alt > 0;
  const g = ctx.createRadialGradient(cx, cy, Rad * 0.08, cx, cy, Rad);
  if (day) {
    g.addColorStop(0, "#f5f8fd");
    g.addColorStop(1, "#ccd9ec");
  } else {
    g.addColorStop(0, "#0a0f22");
    g.addColorStop(0.7, "#0d1430");
    g.addColorStop(1, "#141c3c");
  }
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  const P = (alt, az) => {
    const r = ((90 - alt) / 90) * Rad,
      a = az * D2R;
    return [cx - r * Math.sin(a), cy - r * Math.cos(a)];
  };
  const ink = day ? "#33415c" : "#dfe5f5",
    faint = day ? "rgba(60,80,120,.35)" : "rgba(190,200,230,.26)";
  ctx.strokeStyle = faint;
  ctx.lineWidth = 1;
  ctx.setLineDash([5, 6]);
  for (const h of [30, 60]) {
    ctx.beginPath();
    ctx.arc(cx, cy, ((90 - h) / 90) * Rad, 0, 6.2832);
    ctx.stroke();
  }
  ctx.setLineDash([]);
  ctx.strokeStyle = day ? "#8fa0bd" : "#5b6b94";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, Rad, 0, 6.2832);
  ctx.stroke();
  const dirs = ["北", "东北", "东", "东南", "南", "西南", "西", "西北"];
  ctx.fillStyle = ink;
  ctx.font = "600 21px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  for (let k = 0; k < 8; k++) {
    const a = k * 45 * D2R;
    ctx.fillText(dirs[k], cx - (Rad + 27) * Math.sin(a), cy - (Rad + 27) * Math.cos(a));
  }
  ctx.strokeStyle = faint;
  ctx.beginPath();
  ctx.moveTo(cx - 9, cy);
  ctx.lineTo(cx + 9, cy);
  ctx.moveTo(cx, cy - 9);
  ctx.lineTo(cx, cy + 9);
  ctx.stroke();
  ctx.fillStyle = faint;
  ctx.font = "15px sans-serif";
  ctx.fillText("天顶", cx, cy + 24);
  let n = 0;
  const labeled = [];
  if (!day)
    for (const s of XK_STARS) {
      const eq = xkPrecess(s[1], s[2], jd);
      const hz = nwHorizon(eq.ra, eq.dec * D2R, jd, lon, lat);
      if (hz.alt <= 0) continue;
      n++;
      const xy = P(hz.alt, hz.az),
        x = xy[0],
        y = xy[1],
        m = s[3];
      const r = Math.max(0.8, 3.9 - 0.82 * m),
        col = xkStarColor(s[4]);
      if (m < 1.2) {
        const hg = ctx.createRadialGradient(x, y, 0, x, y, r * 3.2);
        hg.addColorStop(0, col);
        hg.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = hg;
        ctx.beginPath();
        ctx.arc(x, y, r * 3.2, 0, 6.2832);
        ctx.fill();
      }
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, 6.2832);
      ctx.fill();
      if (m <= 1.5) {
        let ok = true;
        for (const q of labeled) {
          if (Math.hypot(q[0] - x, q[1] - y) < 48) {
            ok = false;
            break;
          }
        }
        if (ok) {
          labeled.push([x, y]);
          ctx.fillStyle = "#cdd6ee";
          ctx.font = "19px sans-serif";
          ctx.textAlign = "left";
          ctx.fillText(s[0], x + r + 6, y - 7);
        }
      }
    }
  const dot = (alt, az, draw, label) => {
    if (alt <= 0) return;
    const xy = P(alt, az),
      x = xy[0],
      y = xy[1];
    draw(x, y);
    ctx.fillStyle = day ? "#6b5f36" : "#ffe9a8";
    ctx.font = "19px sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(label, x + 15, y + 6);
  };
  dot(
    sun.alt,
    sun.az,
    (x, y) => {
      const hg = ctx.createRadialGradient(x, y, 0, x, y, 28);
      hg.addColorStop(0, "rgba(255,200,90,.9)");
      hg.addColorStop(1, "rgba(255,200,90,0)");
      ctx.fillStyle = hg;
      ctx.beginPath();
      ctx.arc(x, y, 28, 0, 6.2832);
      ctx.fill();
      ctx.fillStyle = "#ffdf7e";
      ctx.beginPath();
      ctx.arc(x, y, 11, 0, 6.2832);
      ctx.fill();
    },
    "太阳",
  );
  dot(
    moon.alt,
    moon.az,
    (x, y) => {
      ctx.fillStyle = day ? "#e9edf5" : "#eef1f8";
      ctx.beginPath();
      ctx.arc(x, y, 9, 0, 6.2832);
      ctx.fill();
      ctx.strokeStyle = day ? "#9fb0c8" : "#8b96b8";
      ctx.lineWidth = 1.5;
      ctx.stroke();
    },
    "月亮",
  );
  const d = new Date();
  const cap =
    "推算时刻 " +
    f2(d.getMonth() + 1) +
    "-" +
    f2(d.getDate()) +
    " " +
    f2(d.getHours()) +
    ":" +
    f2(d.getMinutes()) +
    "（本机时间）· 经度 " +
    lon +
    "°E / 纬度 " +
    lat +
    "°N" +
    (day ? " · 此时为白昼，恒星不可见" : " · 地平线上 " + n + " 颗亮星") +
    " · 太阳" +
    (sun.alt > 0 ? "在地平线上" : "在地平线下") +
    "，月亮" +
    (moon.alt > 0 ? "在地平线上" : "在地平线下");
  const el = $("#xkCap");
  if (el) el.textContent = cap;
}
var XK3D = {
  mode: "2d",
  yaw: -0.65,
  pitch: 0.34,
  zoom: 1,
  auto: false,
  token: 0,
  last: 0,
  cv: null,
  ctx: null,
  stars: null,
  show: { grid: true, ecl: true, constell: true, constName: true, hor: true, mer: true, lab: true },
};
function xk3Reset() {
  XK3D.yaw = -0.65;
  XK3D.pitch = 0.34;
  XK3D.zoom = 1;
  xkSky3dDraw();
}
function xk3Unit(raD, decD) {
  var r = raD * SM_D2R,
    d = decD * SM_D2R,
    c = Math.cos(d);
  return { x: c * Math.cos(r), y: c * Math.sin(r), z: Math.sin(d) };
}
function xk3Rot(p) {
  var O = XK3D,
    cy = Math.cos(O.yaw),
    sy = Math.sin(O.yaw),
    x1 = p.x * cy - p.y * sy,
    y1 = p.x * sy + p.y * cy,
    z1 = p.z,
    cp = Math.cos(O.pitch),
    sp = Math.sin(O.pitch);
  return { x: x1, y: y1 * cp - z1 * sp, z: y1 * sp + z1 * cp };
}
function xk3Point(p, R, C) {
  var q = xk3Rot(p);
  return { x: C + q.x * R * XK3D.zoom, y: C - q.z * R * XK3D.zoom, d: q.y };
}
function xk3Great(ctx, fn, R, C, color, width, dash, alpha) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = width || 1;
  ctx.globalAlpha = alpha == null ? 1 : alpha;
  if (dash) ctx.setLineDash(dash);
  var last = null;
  for (var i = 0; i <= 180; i++) {
    var q = xk3Point(fn(i * 2), R, C);
    if (last && Math.abs(q.d - last.d) < 1.2) {
      ctx.beginPath();
      ctx.moveTo(last.x, last.y);
      ctx.lineTo(q.x, q.y);
      ctx.stroke();
    }
    last = q;
  }
  ctx.restore();
}
/* 全天球3D星座骨架：赤经(度)、赤纬(度)，以主要亮星位置构成识别线；z=true 为黄道十二星座 */
const XK3_CONST = [
  {
    n: "白羊座",
    z: 1,
    p: [
      [31.79, 23.46],
      [28.66, 20.81],
      [28.38, 19.29],
    ],
    l: [[0, 1, 2]],
  },
  {
    n: "金牛座",
    z: 1,
    p: [
      [56.87, 24.11],
      [68.98, 16.51],
      [81.57, 28.61],
      [84.41, 21.14],
    ],
    l: [
      [0, 1, 2],
      [1, 3],
    ],
  },
  {
    n: "双子座",
    z: 1,
    p: [
      [113.65, 31.89],
      [116.33, 28.03],
      [100.98, 25.13],
      [99.43, 16.4],
      [95.74, 22.51],
    ],
    l: [
      [0, 2, 4],
      [1, 2, 3],
    ],
  },
  {
    n: "巨蟹座",
    z: 1,
    p: [
      [124.13, 9.19],
      [131.19, 18.15],
      [134.62, 11.86],
      [128.72, 21.47],
    ],
    l: [
      [0, 1, 2],
      [1, 3],
    ],
  },
  {
    n: "狮子座",
    z: 1,
    p: [
      [152.09, 11.97],
      [154.99, 19.84],
      [148.2, 26.01],
      [168.53, 20.52],
      [168.56, 15.43],
      [177.26, 14.57],
    ],
    l: [
      [0, 1, 2],
      [1, 3, 4, 0],
      [4, 5],
    ],
  },
  {
    n: "室女座",
    z: 1,
    p: [
      [184.98, -0.67],
      [190.41, -1.45],
      [195.54, 10.96],
      [201.3, -11.16],
      [220.77, -5.66],
    ],
    l: [
      [2, 0, 1, 3, 4],
      [1, 2],
    ],
  },
  {
    n: "天秤座",
    z: 1,
    p: [
      [222.72, -16.04],
      [229.25, -9.38],
      [226.02, -25.28],
      [234.26, -28.14],
    ],
    l: [
      [0, 1],
      [0, 2, 3],
      [1, 3],
    ],
  },
  {
    n: "天蝎座",
    z: 1,
    p: [
      [240.08, -22.62],
      [241.36, -19.81],
      [247.35, -26.43],
      [252.54, -34.29],
      [258.04, -43.24],
      [263.4, -37.1],
      [262.69, -37.3],
    ],
    l: [[1, 0, 2, 3, 4, 5, 6]],
  },
  {
    n: "人马座",
    z: 1,
    p: [
      [271.45, -30.42],
      [275.25, -29.83],
      [276.04, -34.38],
      [276.99, -25.42],
      [283.82, -26.3],
      [285.65, -29.88],
    ],
    l: [
      [0, 1, 3, 4, 5, 2, 1],
      [3, 5],
    ],
  },
  {
    n: "摩羯座",
    z: 1,
    p: [
      [305.25, -14.78],
      [312.95, -26.92],
      [321.67, -16.66],
      [326.76, -16.13],
    ],
    l: [[0, 1, 2, 3, 0]],
  },
  {
    n: "宝瓶座",
    z: 1,
    p: [
      [322.89, -5.57],
      [331.45, -0.32],
      [335.41, -1.39],
      [343.66, -15.82],
      [350.74, -20.1],
    ],
    l: [
      [0, 1, 2, 3, 4],
      [1, 3],
    ],
  },
  {
    n: "双鱼座",
    z: 1,
    p: [
      [359.83, 6.86],
      [18.43, 7.58],
      [22.87, 15.35],
      [30.51, 2.76],
      [28.27, 3.28],
    ],
    l: [
      [0, 1, 2],
      [0, 4, 3, 2],
    ],
  },
  {
    n: "猎户座",
    p: [
      [88.79, 7.41],
      [81.28, 6.35],
      [83.0, -0.3],
      [84.05, -1.2],
      [85.19, -1.94],
      [78.63, -8.2],
      [86.94, -9.67],
    ],
    l: [
      [0, 2, 3, 4, 1],
      [0, 5],
      [1, 6],
      [5, 3, 6],
    ],
  },
  {
    n: "大熊座·北斗",
    p: [
      [165.93, 61.75],
      [165.46, 56.38],
      [178.46, 53.69],
      [183.86, 57.03],
      [193.51, 55.96],
      [200.98, 54.93],
      [206.89, 49.31],
    ],
    l: [
      [0, 1, 2, 3, 0],
      [3, 4, 5, 6],
    ],
  },
  {
    n: "仙后座",
    p: [
      [2.29, 59.15],
      [10.13, 56.54],
      [14.18, 60.72],
      [21.45, 60.24],
      [28.6, 63.67],
    ],
    l: [[0, 1, 2, 3, 4]],
  },
  {
    n: "仙女座",
    p: [
      [2.1, 29.09],
      [17.43, 35.62],
      [30.97, 42.33],
    ],
    l: [[0, 1, 2]],
  },
  {
    n: "英仙座",
    p: [
      [51.08, 49.86],
      [47.04, 40.96],
      [55.73, 47.79],
      [59.46, 40.01],
      [58.53, 31.88],
    ],
    l: [
      [0, 2, 3, 4],
      [0, 1, 4],
    ],
  },
  {
    n: "飞马座",
    p: [
      [346.19, 15.21],
      [345.94, 28.08],
      [2.1, 29.09],
      [3.31, 15.18],
      [326.05, 9.88],
    ],
    l: [
      [0, 1, 2, 3, 0],
      [0, 4],
    ],
  },
  {
    n: "天鹅座",
    p: [
      [310.36, 45.28],
      [305.56, 40.26],
      [311.55, 33.97],
      [292.68, 27.96],
      [296.24, 45.13],
    ],
    l: [
      [0, 1, 3],
      [4, 1, 2],
    ],
  },
  {
    n: "天琴座",
    p: [
      [279.23, 38.78],
      [282.52, 33.36],
      [284.74, 32.69],
    ],
    l: [[0, 1, 2, 0]],
  },
  {
    n: "天鹰座",
    p: [
      [297.7, 8.87],
      [296.57, 10.61],
      [298.83, 6.41],
    ],
    l: [[1, 0, 2]],
  },
  {
    n: "南十字座",
    p: [
      [186.65, -63.1],
      [191.93, -59.69],
      [187.79, -57.11],
      [184.61, -62.49],
    ],
    l: [
      [0, 1],
      [2, 3],
    ],
  },
];
function xk3ConstProjected(pt, jd, R, C) {
  var eq = xkPrecess(pt[0] / 15, pt[1], jd);
  return xk3Point(xk3Unit(eq.ra, eq.dec), R, C);
}
function xk3DrawConstellations(ctx, jd, R, C, O) {
  if (!O.show.constell && !O.show.constName) return;
  for (var ci = 0; ci < XK3_CONST.length; ci++) {
    var co = XK3_CONST[ci],
      pp = co.p.map(function (p) {
        return xk3ConstProjected(p, jd, R, C);
      });
    if (O.show.constell) {
      ctx.save();
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.lineWidth = co.z ? 1.25 : 1.05;
      ctx.strokeStyle = co.z ? "rgba(224,184,100,.72)" : "rgba(150,178,225,.58)";
      for (var li = 0; li < co.l.length; li++) {
        var path = co.l[li];
        for (var k = 1; k < path.length; k++) {
          var a = pp[path[k - 1]],
            b = pp[path[k]],
            front = Math.max(0, Math.min(1, (a.d + b.d + 2) / 4));
          ctx.globalAlpha = 0.18 + 0.82 * front;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
      ctx.restore();
    }
    if (O.show.constName) {
      var sx = 0,
        sy = 0,
        sd = 0;
      for (var pi = 0; pi < pp.length; pi++) {
        sx += pp[pi].x;
        sy += pp[pi].y;
        sd += pp[pi].d;
      }
      sx /= pp.length;
      sy /= pp.length;
      sd /= pp.length;
      if (sd > -0.15) {
        ctx.save();
        ctx.textAlign = "center";
        ctx.font = (co.z ? "600 " : "") + "12px sans-serif";
        ctx.fillStyle = co.z ? "rgba(242,207,125,.92)" : "rgba(205,220,245,.82)";
        ctx.globalAlpha = 0.45 + 0.55 * Math.max(0, sd);
        ctx.fillText(co.n, sx, sy - 8);
        ctx.restore();
      }
    }
  }
}
function xkSky3dDraw() {
  var cv = document.getElementById("xkSky3d");
  if (!cv || cv.hidden) return;
  var ctx = cv.getContext("2d");
  if (!ctx) {
    visRuntimeReport("全天球3D", "Canvas 2D 上下文不可用");
    return;
  }
  var W = cv.width,
    H = cv.height,
    C = W / 2,
    R = Math.min(W, H) * 0.39;
  ctx.clearRect(0, 0, W, H);
  var bg = ctx.createRadialGradient(C, C, R * 0.1, C, C, R * 1.25);
  bg.addColorStop(0, "#111a34");
  bg.addColorStop(1, "#050812");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  var jd = nwNowJD(),
    loc = nwLoc(),
    lon = +loc.lon,
    lat = +loc.lat,
    eps = 23.4393,
    gm = smGMST(jd),
    lst = smN360((gm + lon / 15) * 15),
    O = XK3D;
  ctx.save();
  ctx.strokeStyle = "rgba(190,200,230,.18)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(C, C, R * O.zoom, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
  if (O.show.grid) {
    [-60, -30, 0, 30, 60].forEach(function (dec) {
      xk3Great(
        ctx,
        function (a) {
          return xk3Unit(a, dec);
        },
        R,
        C,
        dec === 0 ? "rgba(95,169,234,.58)" : "rgba(180,195,225,.16)",
        dec === 0 ? 1.5 : 1,
        null,
        1,
      );
    });
    for (var ra = 0; ra < 360; ra += 30)
      xk3Great(
        ctx,
        function (t) {
          var d = t - 180;
          return xk3Unit(ra, d);
        },
        R,
        C,
        "rgba(180,195,225,.12)",
        1,
        null,
        1,
      );
  }
  if (O.show.ecl)
    xk3Great(
      ctx,
      function (a) {
        var e = smEqFromEcl(a, 0, eps);
        return xk3Unit(e.ra * 15, e.dec);
      },
      R,
      C,
      "#d2aa55",
      2,
      null,
      0.9,
    );
  if (O.show.hor) {
    var L = lst * SM_D2R,
      la = lat * SM_D2R,
      E = { x: -Math.sin(L), y: Math.cos(L), z: 0 },
      N = { x: -Math.sin(la) * Math.cos(L), y: -Math.sin(la) * Math.sin(L), z: Math.cos(la) };
    xk3Great(
      ctx,
      function (a) {
        var t = a * SM_D2R;
        return {
          x: E.x * Math.cos(t) + N.x * Math.sin(t),
          y: E.y * Math.cos(t) + N.y * Math.sin(t),
          z: E.z * Math.cos(t) + N.z * Math.sin(t),
        };
      },
      R,
      C,
      "#69b79b",
      1.6,
      [6, 4],
      0.9,
    );
  }
  if (O.show.mer)
    xk3Great(
      ctx,
      function (a) {
        var t = a * SM_D2R,
          L = lst * SM_D2R;
        return { x: Math.cos(t) * Math.cos(L), y: Math.cos(t) * Math.sin(L), z: Math.sin(t) };
      },
      R,
      C,
      "rgba(208,80,59,.72)",
      1.2,
      [4, 4],
      1,
    );
  xk3DrawConstellations(ctx, jd, R, C, O);
  var list = [];
  for (var i = 0; i < XK_STARS.length; i++) {
    var st = XK_STARS[i],
      eq = xkPrecess(st[1], st[2], jd),
      p = xk3Point(xk3Unit(eq.ra, eq.dec), R, C);
    list.push({ s: st, p: p });
  }
  list.sort(function (a, b) {
    return a.p.d - b.p.d;
  });
  var labs = [];
  for (var j = 0; j < list.length; j++) {
    var it = list[j],
      st = it.s,
      p = it.p,
      front = (p.d + 1) / 2,
      mag = st[3],
      r = Math.max(0.7, 3.6 - 0.72 * mag) * (0.72 + 0.28 * front);
    ctx.globalAlpha = 0.16 + 0.84 * front;
    ctx.fillStyle = xkStarColor(st[4]);
    ctx.beginPath();
    ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
    ctx.fill();
    if (O.show.lab && mag <= 1.25 && front > 0.42) {
      var ok = true;
      for (var z = 0; z < labs.length; z++)
        if (Math.hypot(labs[z][0] - p.x, labs[z][1] - p.y) < 46) {
          ok = false;
          break;
        }
      if (ok) {
        labs.push([p.x, p.y]);
        ctx.globalAlpha = 0.75 + 0.25 * front;
        ctx.font = "14px sans-serif";
        ctx.textAlign = "left";
        ctx.fillStyle = "#dfe6f4";
        ctx.fillText(st[0], p.x + r + 4, p.y - 5);
      }
    }
  }
  ctx.globalAlpha = 1;
  function body(eq, col, label, rad) {
    var p = xk3Point(xk3Unit(eq.ra * 15, eq.dec), R, C);
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.arc(p.x, p.y, rad, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = "15px sans-serif";
    ctx.fillStyle = col;
    ctx.fillText(label, p.x + 10, p.y + 5);
  }
  var su = smSun(jd),
    mo = smMoon(jd);
  body(su.eq, "#ffd36f", "太阳", 7);
  body(mo.eq, "#e6e8ef", "月亮", 5);
  var cap = document.getElementById("xk3Cap");
  if (cap)
    cap.textContent =
      "全天球3D · " +
      orr3dFmt(jd) +
      " · 观测地 " +
      (+lon).toFixed(2) +
      "°E / " +
      (+lat).toFixed(2) +
      "°N · 金色=黄道与黄道星座 · 蓝白=主要星座 · 可在上方开关连线与名称";
}
function xk3Bind() {
  var cv = document.getElementById("xkSky3d");
  if (!cv || cv.dataset.xk3) return;
  cv.dataset.xk3 = "1";
  XK3D.cv = cv;
  XK3D.ctx = cv.getContext("2d");
  var drag = null;
  cv.addEventListener("pointerdown", function (e) {
    if (e.button !== 0) return;
    drag = { x: e.clientX, y: e.clientY };
    try {
      cv.setPointerCapture(e.pointerId);
    } catch (_) {}
  });
  cv.addEventListener("pointermove", function (e) {
    if (!drag) return;
    var dx = e.clientX - drag.x,
      dy = e.clientY - drag.y;
    XK3D.yaw += dx * 0.006;
    XK3D.pitch = Math.max(-1.35, Math.min(1.35, XK3D.pitch + dy * 0.006));
    drag = { x: e.clientX, y: e.clientY };
    xkSky3dDraw();
  });
  cv.addEventListener("pointerup", function () {
    drag = null;
  });
  cv.addEventListener("pointercancel", function () {
    drag = null;
  });
  cv.addEventListener(
    "wheel",
    function (e) {
      e.preventDefault();
      XK3D.zoom *= Math.exp(-Math.max(-120, Math.min(120, e.deltaY)) * 0.0028);
      XK3D.zoom = Math.max(0.55, Math.min(2.6, XK3D.zoom));
      xkSky3dDraw();
    },
    { passive: false },
  );
  cv.addEventListener("dblclick", function (e) {
    e.preventDefault();
    xk3Reset();
  });
  document.querySelectorAll("[data-xk-mode]").forEach(function (b) {
    b.onclick = function () {
      var m = b.dataset.xkMode;
      XK3D.mode = m;
      document.querySelectorAll("[data-xk-mode]").forEach(function (q) {
        q.classList.toggle("on", q.dataset.xkMode === m);
      });
      var a = document.getElementById("xkSky"),
        d = document.getElementById("xkSky3d"),
        t = document.getElementById("xk3Tools"),
        c = document.getElementById("xk3Cap");
      if (a) a.hidden = m !== "2d";
      if (d) d.hidden = m !== "3d";
      if (t) t.hidden = m !== "3d";
      if (c) c.hidden = m !== "3d";
      if (m === "3d") xkSky3dDraw();
      else xkSkyDraw();
    };
  });
  [
    ["xk3Grid", "grid"],
    ["xk3Ecl", "ecl"],
    ["xk3Const", "constell"],
    ["xk3ConstName", "constName"],
    ["xk3Hor", "hor"],
    ["xk3Mer", "mer"],
    ["xk3Lab", "lab"],
  ].forEach(function (z) {
    var e = document.getElementById(z[0]);
    if (e)
      e.onchange = function () {
        XK3D.show[z[1]] = e.checked;
        xkSky3dDraw();
      };
  });
  var au = document.getElementById("xk3Auto");
  if (au)
    au.onchange = function () {
      XK3D.auto = au.checked;
    };
  var re = document.getElementById("xk3Reset");
  if (re) re.onclick = xk3Reset;
  var tok = ++XK3D.token;
  XK3D.last = performance.now();
  function loop(ts) {
    if (tok !== XK3D.token) return;
    requestAnimationFrame(loop);
    if (!XK3D.auto || XK3D.mode !== "3d" || document.hidden || ts - XK3D.last < 45) return;
    if (XK3D._faultUntil && ts < XK3D._faultUntil) return;
    try {
      var dt = (ts - XK3D.last) / 1000;
      XK3D.last = ts;
      XK3D.yaw += dt * 0.08;
      xkSky3dDraw();
      XK3D._faultN = 0;
    } catch (e) {
      XK3D._faultN = (XK3D._faultN || 0) + 1;
      XK3D._faultUntil = ts + Math.min(3000, 400 * XK3D._faultN);
      visRuntimeReport("全天球3D", e);
    }
  }
  requestAnimationFrame(loop);
}
function xkStart() {
  xkStop();
  xkSkyDraw();
  xk3Bind();
  xkSky3dDraw();
  XK.timer = setInterval(function () {
    xkSkyDraw();
    if (XK3D.mode === "3d") xkSky3dDraw();
  }, 60000);
}
function xkStop() {
  if (XK.timer) {
    clearInterval(XK.timer);
    XK.timer = 0;
  }
  XK3D.token++;
}
function xingkongRefresh() {
  const p = $("#pane-xingkong");
  if (!p || !R) return;
  p.innerHTML = renderXingkong(R);
  xkStart();
}
/* ===== v9.2 天人感应 · 此刻与你(首页) ===== */
/* ===== v9.2 天人感应 · 此刻与你(首页 now 页签) =====
   天时:此刻四柱(N.R.bz)+五运六气(N.R.astro.yq,已按此刻算好)
   人:全局 R(人物档案/命主信息当前选中的人);未选人时只讲天时并提示去选人 */
const TR_YUN_PLAIN = {
  木: "生发之气,关乎肝胆、筋骨和情绪的舒展",
  火: "炎热之气,关乎心神、睡眠和上火",
  土: "湿化之气,关乎脾胃运化和身体的沉重感",
  金: "收敛之气,关乎肺、呼吸道和皮肤",
  水: "寒润之气,关乎肾、骨骼和精力的收藏",
};
const TR_QI_SHORT = {
  厥阴风木: "风木",
  少阴君火: "君火",
  太阴湿土: "湿土",
  少阳相火: "相火",
  阳明燥金: "燥金",
  太阳寒水: "寒水",
};
const TR_QI_WX = {
  厥阴风木: "木",
  少阴君火: "火",
  太阴湿土: "土",
  少阳相火: "火",
  阳明燥金: "金",
  太阳寒水: "水",
};
const TR_LIUHE = [
  [0, 1],
  [2, 11],
  [3, 10],
  [4, 9],
  [5, 8],
  [6, 7],
];
function trSSPlain(ss) {
  if (/财/.test(ss)) return "财星当令:多和钱财、资源、现实收获打交道";
  if (/官|杀/.test(ss)) return "官杀当头:事业、规则、责任和压力都会变重,也利考学求职";
  if (/印/.test(ss)) return "印星照命:利学习、贵人、文书房产,也容易思虑偏多";
  if (/食|伤/.test(ss)) return "食伤吐秀:想法多、表达欲强,利才艺输出,也要防口舌是非";
  return "比劫林立:人际热闹,合作与竞争并存,看好自己的钱袋子";
}
/* 日/月/时干支 vs 日主:一句话天人感应 */
function trSSDay(ss) {
  switch (ss) {
    case "比肩":
      return "宜并肩做事,朋友给力";
    case "劫财":
      return "看好钱包,忌借贷担保";
    case "食神":
      return "口福灵感俱佳,宜表达";
    case "伤官":
      return "想法冒头,宜输出,忌口舌";
    case "偏财":
      return "偏门机会多,见好就收";
    case "正财":
      return "正业得财,宜踏实推进";
    case "七杀":
      return "压力即战力,宜攻坚";
    case "正官":
      return "利事业规则,宜见贵人";
    case "偏印":
      return "宜学习充电,贵人在暗处";
    default:
      return "宜休养生息,长辈运佳";
  }
}
function trDayLink(dm, p, label) {
  const ssS = shishen(dm, p.s),
    cg = CANG[p.b][0],
    ssB = shishen(dm, cg);
  return `<li><b>${label}与你</b> ${GAN[p.s]}${ZHI[p.b]}:天干是你的${ssS},${ZHI[p.b]}中${GAN[cg]}${ssB}当令——${trSSDay(ssS)};${trSSDay(ssB)}。</li>`;
}
/* 下一客气还有多少天 */
function trNextQi(N) {
  try {
    const yq = N.R.astro.yq,
      lon = N.R.t.lon,
      ns = (yq.step + 1) % 6;
    const nl = [300, 0, 60, 120, 180, 240][ns];
    const days = Math.round(((((nl - lon) % 360) + 360) % 360) / 0.9856);
    const gname = yq.guest[ns],
      sname = ["初", "二", "三", "四", "五", "终"][ns];
    return `<li><b>气运转折</b> 距下一客气「${sname}之气·${gname}」还有约${days}天——${LQ_TIP[gname]}。</li>`;
  } catch (e) {
    return "";
  }
}
/* 人物部分:返回 [kvHTML, lisHTML] */
function tianrenPerson(P, y0, yq, nbz) {
  const D = P.deep,
    bz = P.bz,
    dm = bz.dm,
    dmWx = WXK[GAN_WX[dm]];
  const ln = liunian(bz, D, y0, 1)[0],
    s = ln.idx % 10,
    b = ln.idx % 12;
  const st = D.st,
    xy = D.xy,
    dts = dayunTable(bz, D),
    cur = dayunNow(P);
  const kv = `<div class="kv" style="margin:8px 0"><span>日主 <b class="wx${GAN_WX[dm]}">${GAN[dm]}${dmWx}</b>(${st.level})</span><span>当前大运 <b>${cur >= 0 && dts[cur] ? dts[cur].gz : "未起运"}</b></span><span>今年流年 <b class="wx${GAN_WX[s]}">${ln.gz}</b>(${ln.ss})</span></div>`;
  const lis = [];
  /* 天人关系:岁运五行 vs 日主五行 */
  const yw = yq.yun;
  let rel;
  if (yw === dmWx)
    rel = `你的日主是${GAN[dm]}${dmWx},今年岁运也是${yw}——天时与你同气,像顺风行船,得天时之助`;
  else if (WX_SHENG[yw] === dmWx)
    rel = `今年${yw}运生你的${dmWx}——天时在"生"你,像有人在背后推一把,适合主动进取`;
  else if (WX_SHENG[dmWx] === yw)
    rel = `你的${dmWx}去生今年的${yw}——你在"生"天时,付出多、见效慢,宜守成、别透支`;
  else if (WX_KE[yw] === dmWx)
    rel = `今年${yw}运克你的${dmWx}——天时对你有点"压力测试"的意思,宜低调,稳住基本盘`;
  else rel = `你的${dmWx}克今年的${yw}——你能"管住"天时,适合主动出击、拿下主导权`;
  lis.push(`<li><b>天人关系</b> ${rel}。(喜用${xy.favor.map((x) => WXK[x]).join("、")})</li>`);
  /* 流年十神 */
  const cg = CANG[b][0],
    ssB = shishen(dm, cg);
  const ssA = trSSPlain(ln.ss),
    ssB2 = trSSPlain(ssB);
  lis.push(
    `<li><b>流年十神</b> ${GAN[s]}${ln.ss}透干,${ZHI[b]}中${GAN[cg]}${ssB}当令。大白话:${ssA}${ssB2 === ssA ? "" : "；" + ssB2}。</li>`,
  );
  /* 大运流年 */
  if (cur >= 0 && dts[cur]) {
    const dy = dts[cur],
      dyS = dy.idx % 10,
      dyB = dy.idx % 12;
    let dytxt;
    const chong = (dyB - b + 12) % 12 === 6,
      he = TR_LIUHE.some((p) => (p[0] === dyB && p[1] === b) || (p[1] === dyB && p[0] === b));
    const tianke = WX_KE[GAN_WX[dyS]] === GAN_WX[s];
    const sanhe = [
      ["申子辰", "水"],
      ["寅午戌", "火"],
      ["巳酉丑", "金"],
      ["亥卯未", "木"],
    ].find(([zs]) => zs.includes(ZHI[dyB]) && zs.includes(ZHI[b]) && dyB !== b);
    if (tianke && chong)
      dytxt = `大运${dy.gz}与流年${ln.gz}天克地冲——变动最大的一年,工作、住处、远行都可能"被安排",顺势而动比硬扛好`;
    else if (chong)
      dytxt = `大运${dy.gz}与流年${ln.gz}地支相冲——"动"的一年,宜动不宜静,动起来反而顺`;
    else if (he) dytxt = `大运${dy.gz}与流年${ln.gz}地支相合——人和的一年,适合合作、签约、见贵人`;
    else if (sanhe)
      dytxt = `大运${dy.gz}与流年${ln.gz}半合${sanhe[1]}局——${sanhe[1]}的力量被放大,顺势而为比逆势省力`;
    else dytxt = `大运${dy.gz}与流年${ln.gz}没有直接冲合,各走各的节奏,吉凶看各自十神`;
    lis.push(`<li><b>大运流年</b> ${dytxt}。(当前${dy.gz}大运,${dy.ss})</li>`);
  } else lis.push(`<li><b>大运流年</b> 还没起运,流年${ln.gz}(${ln.ss})一个人说了算。</li>`);
  /* 五行风向 */
  const cnt = {};
  [yw, TR_QI_WX[yq.siTian], WXK[GAN_WX[s]], WXK[ZHI_WX[b]]].forEach(
    (w) => (cnt[w] = (cnt[w] || 0) + 1),
  );
  const top = Object.keys(cnt).sort((a, b2) => cnt[b2] - cnt[a])[0];
  const favor = xy.favor.map((x) => WXK[x]);
  lis.push(
    `<li><b>五行风向</b> 今年${top}最旺。${favor.includes(top) ? "正好是你喜用的,天时补你所需。" : "不是你最缺的,主动往喜用(" + favor.join("、") + ")上靠。"}</li>`,
  );
  /* 今日/今月/今时干支 × 日主 */
  lis.push(trDayLink(dm, nbz.pill[2], "今日"));
  lis.push(trDayLink(dm, nbz.pill[1], "本月"));
  lis.push(trDayLink(dm, nbz.pill[3], "此时"));
  return [kv, lis.join("")];
}
function nwTianrenCard(N) {
  try {
    const yq = N.R.astro.yq,
      nbz = N.R.bz,
      n = nowBJ(),
      y0 = n.y;
    const now4 = nbz.pill
      .map((p, i) => ["年", "月", "日", "时"][i] + GAN[p.s] + ZHI[p.b])
      .join(" ");
    const stepName = ["初", "二", "三", "四", "五", "终"][yq.step];
    let html =
      `<div class="nw-card"><h3 class="sec">天人感应 · 此刻与你</h3>` +
      `<div class="kv" style="margin-bottom:6px"><span>此刻</span><span><b>${now4}</b></span></div>` +
      `<div class="kv" style="margin-bottom:8px"><span>岁运 <b class="gold">${yq.yunName}</b></span><span>司天 <b>${yq.siTian}</b></span><span>在泉 <b>${yq.zaiQuan}</b></span><span>眼下 <b>${stepName}之气</b>·${yq.guest[yq.step]}</span></div>` +
      `<ul class="mini">` +
      `<li><b>岁运</b> ${y0}年${yq.gz},天干${yq.gz[0]}走「${yq.yunName}」。大白话:老天爷今年${yq.yun}气${/太过/.test(yq.yunName) ? "给得偏多" : "偏弱"},${TR_YUN_PLAIN[yq.yun]}${/太过/.test(yq.yunName) ? "。" : "；注意补一补这方面的养护。"}</li>` +
      `<li><b>司天在泉</b> 地支${yq.gz[1]},${yq.siTian}司天、${yq.zaiQuan}在泉。大白话:上半年${TR_QI_SHORT[yq.siTian]}当令,下半年${TR_QI_SHORT[yq.zaiQuan]}收尾,一年里天时的上下半年是两种脾气。</li>` +
      `<li><b>眼下客气</b> 此刻正值「${yq.guest[yq.step]}」:${yq.tip}。</li>`;
    const P = typeof R !== "undefined" && R && R.bz ? R : null;
    const sameP = !P || P.bz.pill.every((p, i) => p.s === nbz.pill[i].s && p.b === nbz.pill[i].b);
    if (P && !sameP) {
      const pr = tianrenPerson(P, y0, yq, nbz);
      html += `</ul>${pr[0]}<ul class="mini">${pr[1]}${trNextQi(N)}</ul>`;
    } else {
      const dcnt = {};
      nbz.pill.forEach((p) => {
        const w1 = WXK[GAN_WX[p.s]],
          w2 = WXK[ZHI_WX[p.b]];
        dcnt[w1] = (dcnt[w1] || 0) + 1;
        dcnt[w2] = (dcnt[w2] || 0) + 1;
      });
      const dtop = Object.keys(dcnt).sort((a, b) => dcnt[b] - dcnt[a])[0];
      html +=
        `<li><b>今日风向</b> 今日四柱里${dtop}气最旺——${TR_YUN_PLAIN[dtop]}</li>` +
        `<li><b>命主</b> 在上方「命主信息」填写生辰,或从「人物档案」选人,这里会把天时和你的八字放在一起讲——天时如何生克你的日主、今年是什么十神、大运流年是冲是合。</li>${trNextQi(N)}</ul>`;
    }
    html += `<p class="note">把《黄帝内经》五运六气的"天时",说给这个命盘听:岁运太过/不及、司天在泉、眼下客气,皆为示意级传统算法,仅作文化趣味参考,不构成决策建议。</p></div>`;
    return html;
  } catch (e) {
    return '<div class="nw-card"><h3 class="sec">天人感应 · 此刻与你</h3><span class="dim">计算异常,稍后再试</span></div>';
  }
}

/* ===== v9.3 时令 · 与你(时令页签左列) ===== */
/* ===== v9.3 时令 · 与你(时令页签左列,SEA_MOVABLE) =====
   此刻时令(nwSeasonYear+nowBJ,取此刻不受 SEA.y 切年影响)×当前人物(全局 R):
   有人:月令提纲(月支本气十神+日主十二长生)+十二月旺衰格+时令养生×喜用
   无人:节气倒计时+当令养生+选人提示 */
/* 未来 k 个月的干支(五虎遁起月干)+月干十神 vs 日主 */
function seaFutureMonths(n, mb, dm, k) {
  const cells = [];
  let y = n.y,
    b = mb;
  for (let i = 0; i < k; i++) {
    b = (b + 1) % 12;
    if (b === 2) y++;
    const ys = (((y - 4) % 10) + 10) % 10,
      off = (b - 2 + 12) % 12;
    const s = ((ys % 5) * 2 + 2 + off) % 10;
    cells.push(`<div class="cs-cell"><b>${GAN[s]}${ZHI[b]}</b><i>${shishen(dm, s)}</i></div>`);
  }
  return `<div class="cs-grid c5">${cells.join("")}</div>`;
}
function seaPersonPanel() {
  try {
    const n = nowBJ(),
      yr = nwSeasonYear(n.y),
      todayN = nwDayNum(n.y, n.m, n.d);
    const idx = yr.findIndex((t) => todayN >= t.dn && todayN <= t.endDn);
    const cur = idx >= 0 ? yr[idx] : null;
    const P = typeof R !== "undefined" && R && R.bz ? R : null;
    /* 下一节气(有人无人两态共用) */
    const ni = (idx + 1) % 24;
    const nx =
      idx >= 0
        ? ni > idx
          ? yr[ni]
          : (() => {
              const jd = termJD(285, jdFromGreg(n.y + 1, 1, 5) - 0.3),
                b = fromJD(jd + 8 / 24);
              return { name: "小寒", dn: nwDayNum(b.y, b.m, b.d), bj: b };
            })()
        : null;
    const nxDays = nx ? nx.dn - todayN : null;
    let inner = "";
    if (P && cur) {
      const D = P.deep,
        bz = P.bz,
        dm = bz.dm;
      const favor = D.xy.favor.map((x) => WXK[x]);
      /* 月柱:用 compute 现算此刻(与首页此刻四柱同源);失败则按节气退化为月支 */
      let ms = null,
        mb = null;
      try {
        const mp = compute({ y: n.y, m: n.m, d: n.d, h: n.h, mi: n.mi, s: 0 }).bz.pill[1];
        ms = mp.s;
        mb = mp.b;
      } catch (e) {}
      if (mb === null) {
        for (let k = idx; k >= 0; k--) {
          if (!yr[k].zhong) {
            mb = ZHI.indexOf(NW_JIE_MONTH[yr[k].name]);
            break;
          }
        }
      }
      const cg = CANG[mb][0],
        ssB = shishen(dm, cg),
        cs = changsheng(dm, mb);
      const monthTxt = ms === null ? ZHI[mb] + "月" : GAN[ms] + ZHI[mb] + "月";
      inner +=
        `<div class="kv" style="margin-bottom:6px"><span>此刻${monthTxt}</span><span>月令 <b>${ssB}当令</b></span><span>日主 <b>${cs}</b></span></div><ul class="mini">` +
        `<li><b>月令提纲</b> ${monthTxt},${ZHI[mb]}中${GAN[cg]}${ssB}当令;你的${GAN[dm]}在${ZHI[mb]}月处「${cs}」。大白话:${trSSDay(ssB)};月令是提纲,${/帝旺|临官|长生|冠带/.test(cs) ? "得令而旺,宜主动进取" : "处" + cs + "之地,宜守成蓄力"}。</li>`;
      /* 十二月旺衰格(寅起) */
      const order = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 0, 1];
      inner +=
        `<li><b>十二月旺衰</b> 你的${GAN[dm]}在十二个月令里的状态,本月高亮:` +
        `<div class="cs-grid">` +
        order
          .map(
            (b) =>
              `<div class="cs-cell${b === mb ? " cur" : ""}"><b>${ZHI[b]}</b><i>${changsheng(dm, b)}</i></div>`,
          )
          .join("") +
        `</div></li>`;
      /* 时令养生×喜用 */
      const SEA_WX = { 春: "木", 夏: "火", 秋: "金", 冬: "水" };
      const swx = SEA_WX[NW_SEASON_OF[cur.name]];
      const tip = NW_TERM_TIPS[cur.name] || "";
      inner += `<li><b>时令养生</b> 眼下${cur.name},${swx}气当令。${tip}${favor.includes(swx) ? "正合你喜用" + swx + ",顺势调养事半功倍。" : "你喜用" + favor.join("、") + ",调养时多往这上靠。"}</li>`;
      if (nx)
        inner += `<li><b>节气倒计时</b> 距下一节气「${nx.name}」(${nx.bj.m}月${nx.bj.d}日)还有 <b>${nxDays}</b> 天。</li>`;
      inner += `<li><b>未来流月</b> 未来12个月,月干是你日主的：${seaFutureMonths(n, mb, dm, 12)}</li></ul>`;
    } else if (cur) {
      inner =
        `<ul class="mini">` +
        `<li><b>节气倒计时</b> 眼下${cur.name},距下一节气「${nx.name}」(${nx.bj.m}月${nx.bj.d}日)还有 <b>${nxDays}</b> 天。</li>` +
        `<li><b>当令养生</b> ${cur.name}:${NW_TERM_TIPS[cur.name] || ""}</li>` +
        `<li><b>命主</b> 在首页「命主信息」填写生辰,或从「人物档案」选人,这里会讲月令与你的日主关系(十神当令/十二长生)、十二月旺衰格、时令养生顺喜用。</li></ul>`;
    } else {
      inner = `<ul class="mini"><li><b>命主</b> 所选年份不含今天,切回今年再看此时令。</li></ul>`;
    }
    return (
      `<div class="panel blk" id="sea-person"><h3 class="sec">时令 · 与你</h3>${inner}` +
      `<p class="note">月令提纲、十二长生皆为传统术数示意,仅作文化趣味参考,不构成决策建议;养生提示为各地传统说法概括,不构成医疗建议。</p></div>`
    );
  } catch (e) {
    return '<div class="panel blk" id="sea-person"><h3 class="sec">时令 · 与你</h3><span class="dim">计算异常,稍后再试</span></div>';
  }
}

/* ===== v9.4 节气 · 命局(时令页签左列) ===== */
/* ===== v9.4 节气 · 命局(时令页签左列,二十四节气×八字当事人) =====
   有人:出生节气+调候+廿四节气×喜用格;无人:廿四节气五行格+选人提示。
   取此刻节气(不受 SEA.y 切年影响);人物取全局 R,出生年月日取 R.civ。 */
function seaBaziPanel() {
  try {
    const n = nowBJ(),
      yr = nwSeasonYear(n.y),
      todayN = nwDayNum(n.y, n.m, n.d);
    const idx = yr.findIndex((t) => todayN >= t.dn && todayN <= t.endDn);
    const P = typeof R !== "undefined" && R && R.bz && R.civ ? R : null;
    const WX_OF = { 春: "木", 夏: "火", 秋: "金", 冬: "水" };
    let favor = [];
    if (P) {
      try {
        favor = P.deep.xy.favor.map((x) => WXK[x]);
      } catch (e) {}
    }
    /* 廿四节气五行格(两态共用) */
    const cells = NW_TERM_ORDER.map((t, k) => {
      const wx = WX_OF[NW_SEASON_OF[t[0]]];
      const cls = (k === idx ? " cur" : "") + (favor.indexOf(wx) >= 0 ? " fav" : "");
      return `<div class="cs-cell${cls}"><b>${t[0]}</b><i>${wx}</i></div>`;
    }).join("");
    let inner = "";
    if (P) {
      const bz = P.bz,
        dm = bz.dm,
        civ = P.civ;
      /* 出生节气+出生之候:用出生年(1月初则上年)的节气表定位 */
      let bt = null,
        bhouTxt = "";
      try {
        const bdn = nwDayNum(civ.y, civ.m, civ.d);
        let byr = nwSeasonYear(civ.y),
          ti = byr.findIndex((t) => bdn >= t.dn && bdn <= t.endDn);
        if (ti < 0) {
          byr = nwSeasonYear(civ.y - 1);
          ti = 23;
        }
        const t = byr[ti],
          hi = t.hou.findIndex((h) => bdn >= h.s && bdn <= h.e);
        if (hi >= 0) bhouTxt = "、" + ["一", "二", "三"][hi] + "候「" + t.hou[hi].name + "」";
        const nxT = ti < 23 ? byr[ti + 1] : nwSeasonYear(civ.y)[0];
        bt = { name: t.name, since: bdn - t.dn, nx: nxT, toGo: nxT.dn - bdn };
      } catch (e) {}
      /* 调候:按出生月支定季节,传统说法 */
      const mb = bz.pill[1].b;
      const season =
        mb >= 2 && mb <= 4 ? "春" : mb >= 5 && mb <= 7 ? "夏" : mb >= 8 && mb <= 10 ? "秋" : "冬";
      const TIAO = {
        春: { t: "木旺,宜金裁、火泄秀暖局", k: ["金", "火"] },
        夏: { t: "火炎土燥,水调候为急、宜金生水润局", k: ["水", "金"] },
        秋: { t: "金气肃杀,宜火炼秋金、水泄秀", k: ["火", "水"] },
        冬: { t: "水寒土冻,宜火暖局、土制水", k: ["火", "土"] },
      }[season];
      const hit = TIAO.k.filter((k) => favor.indexOf(k) >= 0);
      inner += `<div class="kv" style="margin-bottom:6px"><span>出生 <b>${bt ? bt.name : "—"}</b></span><span>调候 <b>${hit.length ? hit.join("、") : "—"}</b></span></div><ul class="mini">`;
      if (bt) {
        inner += `<li><b>出生节气</b> 你出生于${civ.y}年${civ.m}月${civ.d}日,${bt.since === 0 ? "正值" : "处"}「${bt.name}」${bt.since === 0 ? "当天" : "后第" + bt.since + "天"}${bhouTxt},离下一节气「${bt.nx.name}」(${bt.nx.bj.m}月${bt.nx.bj.d}日)还有${bt.toGo}天。</li>`;
      }
      inner += `<li><b>调候</b> 你生于${season}季(${ZHI[mb]}月),传统调候讲「${TIAO.t}」。${hit.length ? "正合你的喜用" + hit.join("、") + ",得天时之助。" : "你的喜用是" + favor.join("、") + ",与调候侧重不同,仍以喜用为准。"}</li>`;
      inner += `<li><b>廿四节气 × 喜用</b> 金色字为你的喜用当令之节气,描边为当前节气:<div class="cs-grid">${cells}</div></li></ul>`;
    } else {
      inner =
        `<ul class="mini"><li><b>廿四节气五行</b> 春木夏火秋金冬水,描边为当前节气。选人后这里会标出金色——你的喜用当令之节气:<div class="cs-grid">${cells}</div></li>` +
        `<li><b>命主</b> 在首页「命主信息」填写生辰,或从「人物档案」选人,这里会讲你的出生节气、调候与廿四节气喜用。</li></ul>`;
    }
    return (
      `<div class="panel blk" id="sea-bazi"><h3 class="sec">节气 · 命局</h3>${inner}` +
      `<p class="note">调候、节气五行为传统术数示意,仅作文化趣味参考,不构成决策建议。</p></div>`
    );
  } catch (e) {
    return '<div class="panel blk" id="sea-bazi"><h3 class="sec">节气 · 命局</h3><span class="dim">计算异常,稍后再试</span></div>';
  }
}

/* ===== v9.4 出生天数(首页起局参数小角落) ===== */
function bornDaysTick() {
  try {
    const el = document.getElementById("bornDays"),
      dt = document.getElementById("dt");
    if (!el || !dt || !dt.value) {
      if (el) el.hidden = true;
      return;
    }
    const b = new Date(dt.value.trim());
    if (isNaN(b)) {
      el.hidden = true;
      return;
    }
    const days = Math.floor((Date.now() - b.getTime()) / 864e5);
    if (days < 1 || days > 45000) {
      el.hidden = true;
      return;
    }
    el.hidden = false;
    el.textContent = "您已出生" + days + "天";
  } catch (e) {}
}
/* ===== v9.4 花信 · 二十四番(时令页签左列) ===== */
/* ===== v9.4 花信 · 二十四番(时令页签左列) =====
   二十四番花信风(宋·程大昌《演繁露》):自小寒至谷雨,每节气三候、一候一花,共廿四番。
   有人且出生在花信期内:附出生花信;无人:纯时令花信+选人提示。 */
const HX24 = [
  ["小寒", ["梅花", "山茶", "水仙"]],
  ["大寒", ["瑞香", "兰花", "山矾"]],
  ["立春", ["迎春", "樱桃", "望春"]],
  ["雨水", ["菜花", "杏花", "李花"]],
  ["惊蛰", ["桃花", "棠梨", "蔷薇"]],
  ["春分", ["海棠", "梨花", "木兰"]],
  ["清明", ["桐花", "麦花", "柳花"]],
  ["谷雨", ["牡丹", "荼蘼", "楝花"]],
];
function hxSeasonBloom(m) {
  if (m >= 5 && m <= 7) return "荷花、栀子、石榴花开得正好";
  if (m >= 8 && m <= 10) return "桂花、菊花、木芙蓉正当时";
  return "腊梅含苞、山茶初绽";
}
function seaHuaxinPanel() {
  try {
    const n = nowBJ(),
      yr = nwSeasonYear(n.y),
      todayN = nwDayNum(n.y, n.m, n.d);
    const idx = yr.findIndex((t) => todayN >= t.dn && todayN <= t.endDn);
    const P = typeof R !== "undefined" && R && R.bz && R.civ ? R : null;
    /* 今日花信(仅小寒~谷雨) */
    let curHx = null;
    if (idx >= 0 && idx <= 7) {
      const hi = yr[idx].hou.findIndex((h) => todayN >= h.s && todayN <= h.e);
      curHx = {
        term: yr[idx].name,
        flower: HX24[idx][1][hi < 0 ? 0 : hi],
        ord: ["初候", "二候", "三候"][hi < 0 ? 0 : hi],
      };
    }
    /* 下一番花信倒计时 */
    let nxHx = null;
    if (!curHx) {
      const ty = idx > 7 ? n.y + 1 : n.y,
        tyr = nwSeasonYear(ty);
      nxHx = { flower: "梅花", days: tyr[0].dn - todayN };
    }
    /* 出生花信(有人且生于花信期内) */
    let birthHx = null;
    if (P) {
      try {
        const c = P.civ,
          bdn = nwDayNum(c.y, c.m, c.d);
        let byr = nwSeasonYear(c.y),
          ti = byr.findIndex((t) => bdn >= t.dn && bdn <= t.endDn);
        if (ti < 0) {
          byr = nwSeasonYear(c.y - 1);
          ti = 23;
        }
        if (ti >= 0 && ti <= 7) {
          const hi = byr[ti].hou.findIndex((h) => bdn >= h.s && bdn <= h.e);
          birthHx = { term: byr[ti].name, flower: HX24[ti][1][hi < 0 ? 0 : hi] };
        }
      } catch (e) {}
    }
    const cells = HX24.map(
      (g, k) =>
        `<div class="cs-cell${curHx && curHx.term === g[0] ? " cur" : ""}"><b>${g[0]}</b><i>${g[1].join("·")}</i></div>`,
    ).join("");
    let inner = '<ul class="mini">';
    if (curHx) {
      inner += `<li><b>今日花信</b> 今当「${curHx.term}」${curHx.ord},花信是「${curHx.flower}」。一候一花,五日一番,是古人观天候时的浪漫。</li>`;
    } else if (nxHx) {
      inner += `<li><b>花信</b> 廿四番花信(小寒~谷雨)此季未至,下一番「小寒初候·梅花」还有 <b>${nxHx.days}</b> 天。${hxSeasonBloom(n.m)}。</li>`;
    }
    if (P) {
      inner += birthHx
        ? `<li><b>出生花信</b> 你出生在「${birthHx.term}」花信「${birthHx.flower}」绽放之时。</li>`
        : `<li><b>出生花信</b> 你出生不在花信期内(小寒~谷雨),故无本命花信。</li>`;
    }
    inner += `<li><b>廿四番</b> 自小寒至谷雨,每候一花,描边为当前节气:<div class="cs-grid c4">${cells}</div></li>`;
    if (!P)
      inner += `<li><b>命主</b> 在首页「命主信息」填写生辰,或从「人物档案」选人,这里会告诉你出生在哪一番花信。</li>`;
    inner += "</ul>";
    return (
      `<div class="panel blk" id="sea-huaxin"><h3 class="sec">花信 · 二十四番</h3>${inner}` +
      `<p class="note">廿四番花信风出自宋代程大昌《演繁露》,传统岁时之说,仅作文化趣味参考。</p></div>`
    );
  } catch (e) {
    return '<div class="panel blk" id="sea-huaxin"><h3 class="sec">花信 · 二十四番</h3><span class="dim">计算异常,稍后再试</span></div>';
  }
}

try {
  gfilterInit();
} catch (e) {}

/* ===== v8.9 日月天象图解 ===== */
/* ================= v8.7 日月天象 · 图解 =================
   自包含模块:天文算法(低精度示意级,方位约±0.1°)+三幅 SVG+时间调节。
   观测地取页面上方经纬度输入框(#lon/#lat);时刻独立于排盘起局时间。
   约定:方位角自正北向东量(北=0°,东=90°);天穹图北上东右。 */
var SM = { dt: new Date(), now0: new Date() };
var SM_R2D = 180 / Math.PI,
  SM_D2R = Math.PI / 180;
function smN360(x) {
  x %= 360;
  return x < 0 ? x + 360 : x;
}
function smN180(x) {
  x = smN360(x);
  return x > 180 ? x - 360 : x;
}
function smSin(x) {
  return Math.sin(x * SM_D2R);
}
function smCos(x) {
  return Math.cos(x * SM_D2R);
}
function smJD(dt) {
  return dt.getTime() / 86400000 + 2440587.5;
}

/* 黄道坐标 -> 赤道坐标(ra:小时,dec:度) */
function smEqFromEcl(lon, lat, eps) {
  var se = smSin(eps),
    ce = smCos(eps);
  var sl = smSin(lon) * smCos(lat),
    cl = smCos(lon) * smCos(lat),
    sb = smSin(lat);
  var ra = (Math.atan2(sl * ce - sb * se, cl) * SM_R2D) / 15;
  var dec = Math.asin(Math.max(-1, Math.min(1, sl * se + sb * ce))) * SM_R2D;
  return { ra: smN360(ra * 15) / 15, dec: dec };
}
/* 太阳(黄经约±0.01°) */
function smSun(jd) {
  var d = jd - 2451543.5;
  var M = smN360(356.047 + 0.9856002585 * d);
  var L = smN360(M + 282.9404 + 4.70935e-5 * d);
  var lon = smN360(L + 1.915 * smSin(M) + 0.02 * smSin(2 * M));
  var eps = 23.4393 - 3.563e-7 * d;
  return { lon: lon, eq: smEqFromEcl(lon, 0, eps), eps: eps };
}
/* 月球(Schlyter 低精度,约角分级) */
function smMoon(jd) {
  var d = jd - 2451543.5,
    R = SM_D2R;
  var N = (125.1228 - 0.0529538083 * d) * R,
    inc = 5.1454 * R,
    w = (318.0634 + 0.1643573223 * d) * R;
  var a = 60.2666,
    e = 0.0549;
  var M = smN360(115.3654 + 13.0649929509 * d) * R,
    E = M + e * Math.sin(M);
  for (var k = 0; k < 5; k++) E = E - (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
  var xv = a * (Math.cos(E) - e),
    yv = a * Math.sqrt(1 - e * e) * Math.sin(E);
  var v = Math.atan2(yv, xv),
    r = Math.hypot(xv, yv),
    u = v + w;
  var xh = r * (Math.cos(N) * Math.cos(u) - Math.sin(N) * Math.sin(u) * Math.cos(inc));
  var yh = r * (Math.sin(N) * Math.cos(u) + Math.cos(N) * Math.sin(u) * Math.cos(inc));
  var zh = r * Math.sin(u) * Math.sin(inc);
  var lon = Math.atan2(yh, xh) / R,
    lat = Math.atan2(zh, Math.hypot(xh, yh)) / R;
  var Ms = smN360(356.047 + 0.9856002585 * d),
    Mm = smN360(M / R);
  var Lm = smN360(N / R + w / R + Mm),
    Ls = smN360(Ms + 282.9404 + 4.70935e-5 * d);
  var Dm = smN360(Lm - Ls),
    Fm = smN360(Lm - N / R);
  lon +=
    -1.274 * smSin(Mm - 2 * Dm) + 0.658 * smSin(2 * Dm) - 0.186 * smSin(Ms) - 0.114 * smSin(2 * Fm);
  lat +=
    -0.173 * smSin(Fm - 2 * Dm) -
    0.055 * smSin(Mm - Fm - 2 * Dm) -
    0.046 * smSin(Mm + Fm - 2 * Dm) +
    0.027 * smSin(2 * Dm - Mm);
  var dist = r - 0.58 * Math.cos((Mm - 2 * Dm) * R) - 0.46 * Math.cos(2 * Dm * R);
  lon = smN360(lon);
  var eps = 23.4393 - 3.563e-7 * d;
  return { lon: lon, lat: lat, dist: dist, eq: smEqFromEcl(lon, lat, eps) };
}
/* 格林尼治平恒星时(小时) */
function smGMST(jd) {
  var day = Math.floor(jd - 0.5) + 0.5,
    dd = day - 2451543.5;
  var Ls0 = smN360(356.047 + 0.9856002585 * dd + 282.9404 + 4.70935e-5 * dd);
  var g0 = smN360(Ls0 + 180) / 15,
    ut = (jd - day) * 24;
  return smN360((g0 + ut * 1.002737909) * 15) / 15;
}
/* 地平坐标 */
function smAltAz(raH, decD, jd, lonD, latD) {
  var lst = (((smGMST(jd) + lonD / 15) % 24) + 24) % 24,
    ha = (lst - raH) * 15;
  var sAlt = smSin(decD) * smSin(latD) + smCos(decD) * smCos(latD) * smCos(ha);
  sAlt = Math.max(-1, Math.min(1, sAlt));
  var alt = Math.asin(sAlt) * SM_R2D;
  var cA = (smSin(decD) - sAlt * smSin(latD)) / (smCos(alt) * smCos(latD));
  var az = Math.acos(Math.max(-1, Math.min(1, cA))) * SM_R2D;
  if (smSin(ha) > 0) az = 360 - az;
  return { alt: alt, az: az };
}
/* 月相 */
var SM_PH = [
  "朔 · 新月",
  "娥眉月 · 昏见",
  "上弦月",
  "盈凸月",
  "望 · 满月",
  "亏凸月",
  "下弦月",
  "残月 · 晓见",
];
function smPhase(mLon, sLon) {
  var elong = smN360(mLon - sLon),
    wax = elong < 180,
    e2 = wax ? elong : 360 - elong;
  return {
    name: SM_PH[Math.floor(smN360(elong + 22.5) / 45) % 8],
    elong: elong,
    e2: e2,
    k: (1 - smCos(e2)) / 2,
    age: (elong / 360) * 29.53058867,
    wax: wax,
  };
}
/* 日出日落/月出月落(所选日期,地方时) */
function smRiseSet(which, y, mo, d, lonD, latD) {
  var t0 = new Date(y, mo - 1, d, 0, 0, 0).getTime(),
    h0 = which === "sun" ? -0.583 : 0.125;
  var prev = null,
    rise = null,
    set = null;
  for (var m = 0; m <= 48 * 60; m += 6) {
    var jd = (t0 + m * 60000) / 86400000 + 2440587.5;
    var o = which === "sun" ? smSun(jd) : smMoon(jd);
    var a = smAltAz(o.eq.ra, o.eq.dec, jd, lonD, latD).alt - h0;
    if (prev !== null) {
      if (prev < 0 && a >= 0 && rise === null) rise = t0 + m * 60000;
      if (prev > 0 && a <= 0 && set === null) set = t0 + m * 60000;
    }
    prev = a;
  }
  function f(t) {
    if (t === null) return "—";
    var x = new Date(t);
    return String(x.getHours()).padStart(2, "0") + ":" + String(x.getMinutes()).padStart(2, "0");
  }
  return { rise: f(rise), set: f(set) };
}
/* 月相受光区路径(局部坐标,圆心0,0,+x 为亮缘方向;waxing 形,亏月外层再转180°) */
function smLitPath(r, e2) {
  var rx = r * Math.abs(smCos(e2)),
    sw = e2 < 90 ? 0 : 1;
  return (
    "M0 " +
    -r +
    " A" +
    r +
    " " +
    r +
    " 0 0 1 0 " +
    r +
    " A" +
    rx.toFixed(2) +
    " " +
    r +
    " 0 0 " +
    sw +
    " 0 " +
    -r +
    " Z"
  );
}
/* 天球大圆在天穹图上的路径(fn(t)->{ra,dec}) */
function smSkyPath(fn, t0, t1, step, jd, lonD, latD, P) {
  var d = "",
    pen = false;
  for (var t = t0; t <= t1 + 1e-9; t += step) {
    var e = fn(t),
      aa = smAltAz(e.ra, e.dec, jd, lonD, latD);
    if (aa.alt > 0) {
      var p = P(aa.alt, aa.az);
      d += (pen ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1) + " ";
      pen = true;
    } else pen = false;
  }
  return d;
}
/* 图1:天穹图 */
function smDomeSVG(sun, moon, sa, ma, ph, jd, lonD, latD) {
  var C = 170,
    R = 150;
  function P(alt, az) {
    var r = (R * (90 - alt)) / 90;
    return [C + r * smSin(az), C - r * smCos(az)];
  }
  var s =
    '<defs><clipPath id="smClip"><circle cx="' +
    C +
    '" cy="' +
    C +
    '" r="' +
    R +
    '"/></clipPath></defs>';
  s +=
    '<circle cx="' +
    C +
    '" cy="' +
    C +
    '" r="' +
    R +
    '" fill="none" stroke="var(--line2)" stroke-width="2"/>';
  [30, 60].forEach(function (a) {
    var r = (R * (90 - a)) / 90;
    s +=
      '<circle cx="' +
      C +
      '" cy="' +
      C +
      '" r="' +
      r.toFixed(1) +
      '" fill="none" stroke="var(--line)" stroke-width="1" stroke-dasharray="4 4"/>';
  });
  for (var k = 0; k < 12; k++) {
    var p = P(0, k * 30);
    s +=
      '<line x1="' +
      C +
      '" y1="' +
      C +
      '" x2="' +
      p[0].toFixed(1) +
      '" y2="' +
      p[1].toFixed(1) +
      '" stroke="var(--line)" stroke-width="1"/>';
  }
  var WN = ["北", "东北", "东", "东南", "南", "西南", "西", "西北"];
  for (var k = 0; k < 8; k++) {
    var az = k * 45,
      lx = C + (R - 17) * smSin(az),
      ly = C - (R - 17) * smCos(az);
    s +=
      '<text x="' +
      lx.toFixed(1) +
      '" y="' +
      (ly + 4).toFixed(1) +
      '" text-anchor="middle" font-size="' +
      (k % 2 ? 10 : 13) +
      '" fill="var(--dim)">' +
      WN[k] +
      "</text>";
  }
  s +=
    '<text x="' +
    C +
    '" y="' +
    (C + 4) +
    '" text-anchor="middle" font-size="10" fill="var(--dim)">天顶</text>';
  s +=
    '<path d="' +
    smSkyPath(
      function (t) {
        return { ra: t, dec: 0 };
      },
      0,
      24,
      0.25,
      jd,
      lonD,
      latD,
      P,
    ) +
    '" fill="none" stroke="#5f7f9e" stroke-width="1.5" stroke-dasharray="6 4" clip-path="url(#smClip)"/>';
  s +=
    '<path d="' +
    smSkyPath(
      function (t) {
        return smEqFromEcl(t, 0, sun.eps);
      },
      0,
      360,
      3,
      jd,
      lonD,
      latD,
      P,
    ) +
    '" fill="none" stroke="#c9962e" stroke-width="2" clip-path="url(#smClip)"/>';
  var sp = P(sa.alt, sa.az),
    mp = P(ma.alt, ma.az);
  s += '<g clip-path="url(#smClip)">';
  s +=
    '<g opacity="' +
    (sa.alt > 0 ? 1 : 0.3) +
    '"><circle cx="' +
    sp[0].toFixed(1) +
    '" cy="' +
    sp[1].toFixed(1) +
    '" r="15" fill="#e8a020" opacity=".25"/>' +
    '<circle cx="' +
    sp[0].toFixed(1) +
    '" cy="' +
    sp[1].toFixed(1) +
    '" r="10" fill="#f2b73c" stroke="#8a5a12" stroke-width="1.5"/>' +
    '<text x="' +
    (sp[0] + 16).toFixed(1) +
    '" y="' +
    (sp[1] + 5).toFixed(1) +
    '" font-size="13" fill="var(--ink)">日</text></g>';
  var ang = Math.atan2(sp[1] - mp[1], sp[0] - mp[0]) * SM_R2D;
  s +=
    '<g opacity="' +
    (ma.alt > 0 ? 1 : 0.35) +
    '"><g transform="translate(' +
    mp[0].toFixed(1) +
    " " +
    mp[1].toFixed(1) +
    ") rotate(" +
    ang.toFixed(1) +
    ')">' +
    '<circle r="8.5" fill="#454c5c"/><g' +
    (ph.wax ? "" : ' transform="rotate(180)"') +
    ">" +
    '<path d="' +
    smLitPath(8.5, ph.e2) +
    '" fill="#e9e4d6"/></g></g>' +
    '<text x="' +
    (mp[0] + 14).toFixed(1) +
    '" y="' +
    (mp[1] + 5).toFixed(1) +
    '" font-size="13" fill="var(--ink)">月</text></g>';
  s += "</g>";
  return s;
}
/* 图2:日地月关系(黄道俯视,自北黄极下望,黄经逆时针增大) */
function smTopSVG(sun, moon, ph, jd) {
  var Cx = 180,
    Cy = 170,
    Ro = 95;
  function Q(lon, r) {
    var a = lon * SM_D2R;
    return [Cx + r * Math.cos(a), Cy - r * Math.sin(a)];
  }
  var ZD = [
    "白羊",
    "金牛",
    "双子",
    "巨蟹",
    "狮子",
    "室女",
    "天秤",
    "天蝎",
    "人马",
    "摩羯",
    "宝瓶",
    "双鱼",
  ];
  var s =
    '<circle cx="' +
    Cx +
    '" cy="' +
    Cy +
    '" r="' +
    Ro +
    '" fill="none" stroke="var(--gold)" stroke-width="1.7"/>';
  /* 白道示意：以月球升交点近似，在黄道圈两侧按±5.145°起伏显示 */
  var dd = (jd || 2451545) - 2451543.5,
    node = smN360(125.1228 - 0.0529538083 * dd),
    wd = "";
  for (var q = 0; q <= 180; q++) {
    var ll = q * 2,
      rr = Ro + 15 * smSin(ll - node),
      wp = Q(ll, rr);
    wd += (q ? "L" : "M") + wp[0].toFixed(1) + " " + wp[1].toFixed(1) + " ";
  }
  s +=
    '<path d="' +
    wd +
    '" fill="none" stroke="var(--cyan)" stroke-width="1.3" stroke-dasharray="5 4" opacity=".8"/>' +
    '<text x="' +
    (Cx - Ro - 22) +
    '" y="' +
    (Cy - Ro - 9) +
    '" font-size="9" fill="var(--gold)">黄道 0°</text>' +
    '<text x="' +
    (Cx - Ro - 22) +
    '" y="' +
    (Cy - Ro + 5) +
    '" font-size="9" fill="var(--cyan)">白道 ±5.145°</text>';
  for (var k = 0; k < 12; k++) {
    var p1 = Q(k * 30, Ro),
      p2 = Q(k * 30, Ro + 10),
      pl = Q(k * 30 + 15, Ro + 25);
    s +=
      '<line x1="' +
      p1[0].toFixed(1) +
      '" y1="' +
      p1[1].toFixed(1) +
      '" x2="' +
      p2[0].toFixed(1) +
      '" y2="' +
      p2[1].toFixed(1) +
      '" stroke="var(--line2)" stroke-width="1"/>' +
      '<text x="' +
      pl[0].toFixed(1) +
      '" y="' +
      (pl[1] + 3).toFixed(1) +
      '" text-anchor="middle" font-size="10" fill="var(--dim)">' +
      ZD[k] +
      "宫</text>";
  }
  var sp = Q(sun.lon, 132),
    ep = Q(sun.lon, 26);
  s +=
    '<line x1="' +
    ep[0].toFixed(1) +
    '" y1="' +
    ep[1].toFixed(1) +
    '" x2="' +
    sp[0].toFixed(1) +
    '" y2="' +
    sp[1].toFixed(1) +
    '" stroke="#c9962e" stroke-width="1.5" stroke-dasharray="5 4"/>';
  s += "<g>";
  for (var k = 0; k < 8; k++) {
    var a2 = k * 45 * SM_D2R;
    var q1 = [sp[0] + 20 * Math.cos(a2), sp[1] + 20 * Math.sin(a2)],
      q2 = [sp[0] + 27 * Math.cos(a2), sp[1] + 27 * Math.sin(a2)];
    s +=
      '<line x1="' +
      q1[0].toFixed(1) +
      '" y1="' +
      q1[1].toFixed(1) +
      '" x2="' +
      q2[0].toFixed(1) +
      '" y2="' +
      q2[1].toFixed(1) +
      '" stroke="#c9962e" stroke-width="1.5"/>';
  }
  s +=
    '<circle cx="' +
    sp[0].toFixed(1) +
    '" cy="' +
    sp[1].toFixed(1) +
    '" r="15" fill="#f2b73c" stroke="#8a5a12" stroke-width="1.5"/>' +
    '<text x="' +
    sp[0].toFixed(1) +
    '" y="' +
    (sp[1] + 34).toFixed(1) +
    '" text-anchor="middle" font-size="12" fill="var(--ink)">太阳</text></g>';
  var mp = Q(moon.lon, Ro);
  s +=
    '<circle cx="' +
    mp[0].toFixed(1) +
    '" cy="' +
    mp[1].toFixed(1) +
    '" r="9" fill="#e9e4d6" stroke="#454c5c" stroke-width="1.5"/>' +
    '<text x="' +
    mp[0].toFixed(1) +
    '" y="' +
    (mp[1] - 16).toFixed(1) +
    '" text-anchor="middle" font-size="12" fill="var(--ink)">月</text>';
  var d = smN180(moon.lon - sun.lon),
    a1 = Q(sun.lon, 44),
    a2 = Q(moon.lon, 44),
    mid = Q(sun.lon + d / 2, 62);
  s +=
    '<path d="M' +
    a1[0].toFixed(1) +
    " " +
    a1[1].toFixed(1) +
    " A44 44 0 0 " +
    (d > 0 ? 0 : 1) +
    " " +
    a2[0].toFixed(1) +
    " " +
    a2[1].toFixed(1) +
    '" fill="none" stroke="var(--gold)" stroke-width="1.5"/>' +
    '<text x="' +
    mid[0].toFixed(1) +
    '" y="' +
    (mid[1] + 4).toFixed(1) +
    '" text-anchor="middle" font-size="11" fill="var(--gold)">距角' +
    ph.e2.toFixed(1) +
    "°</text>";
  s +=
    '<circle cx="' +
    Cx +
    '" cy="' +
    Cy +
    '" r="13" fill="#3f6f9e" stroke="#274b6e" stroke-width="1.5"/>' +
    '<text x="' +
    Cx +
    '" y="' +
    (Cy + 32) +
    '" text-anchor="middle" font-size="12" fill="var(--ink)">地球</text>';
  return s;
}
/* 图3:月相大图 */
function smPhaseBigSVG(ph) {
  var s =
    '<circle cx="85" cy="85" r="58" fill="#454c5c"/>' +
    '<g transform="translate(85 85)' +
    (ph.wax ? "" : " rotate(180)") +
    '"><path d="' +
    smLitPath(58, ph.e2) +
    '" fill="#ece7d8"/></g>' +
    '<circle cx="85" cy="85" r="58" fill="none" stroke="var(--line2)" stroke-width="1.5"/>';
  return s;
}
/* 图4:当日高度角变化(金线太阳/灰线月亮/阴影黑夜/出没标记/所选时刻线) */
function smAltCurveSVG(y, mo, d, lonD, latD, dt, rs, rm) {
  var W = 360,
    H = 220,
    L = 30,
    Rm = 10,
    T = 14,
    B = 22,
    PW = W - L - Rm,
    PH = H - T - B;
  function X(h) {
    return L + (h / 24) * PW;
  }
  function Y(a) {
    return T + ((90 - a) / 180) * PH;
  }
  var t0 = new Date(y, mo - 1, d, 0, 0, 0).getTime();
  var sunD = "",
    moonD = "",
    night = [],
    ns = null;
  for (var m = 0; m <= 24 * 60; m += 10) {
    var jd = (t0 + m * 60000) / 86400000 + 2440587.5,
      h = m / 60;
    var so = smSun(jd),
      oo = smMoon(jd);
    var sa = smAltAz(so.eq.ra, so.eq.dec, jd, lonD, latD).alt;
    var ma = smAltAz(oo.eq.ra, oo.eq.dec, jd, lonD, latD).alt;
    sunD += (m ? "L" : "M") + X(h).toFixed(1) + " " + Y(sa).toFixed(1) + " ";
    moonD += (m ? "L" : "M") + X(h).toFixed(1) + " " + Y(ma).toFixed(1) + " ";
    if (sa < 0) {
      if (ns === null) ns = h;
    } else if (ns !== null) {
      night.push([ns, h]);
      ns = null;
    }
  }
  if (ns !== null) night.push([ns, 24]);
  var s = "";
  night.forEach(function (n) {
    s +=
      '<rect x="' +
      X(n[0]).toFixed(1) +
      '" y="' +
      T +
      '" width="' +
      (X(n[1]) - X(n[0])).toFixed(1) +
      '" height="' +
      PH +
      '" fill="rgba(70,80,100,.10)"/>';
  });
  [-60, -30, 0, 30, 60].forEach(function (a) {
    s +=
      '<line x1="' +
      L +
      '" y1="' +
      Y(a).toFixed(1) +
      '" x2="' +
      (W - Rm) +
      '" y2="' +
      Y(a).toFixed(1) +
      '" stroke="var(--line)" stroke-width="1"' +
      (a === 0 ? ' stroke-dasharray="5 4"' : ' opacity=".55"') +
      "/>" +
      '<text x="' +
      (L - 4) +
      '" y="' +
      (Y(a) + 3).toFixed(1) +
      '" text-anchor="end" font-size="9" fill="var(--dim)">' +
      a +
      "°</text>";
  });
  for (var hh = 0; hh <= 24; hh += 3)
    s +=
      '<text x="' +
      X(hh).toFixed(1) +
      '" y="' +
      (H - 6) +
      '" text-anchor="middle" font-size="9" fill="var(--dim)">' +
      hh +
      "时</text>";
  s += '<path d="' + sunD + '" fill="none" stroke="#c9962e" stroke-width="2"/>';
  s += '<path d="' + moonD + '" fill="none" stroke="#8b93a3" stroke-width="2"/>';
  function mark(t, color, label) {
    if (!t || t === "—") return "";
    var p = t.split(":"),
      h = +p[0] + +p[1] / 60;
    return (
      '<circle cx="' +
      X(h).toFixed(1) +
      '" cy="' +
      Y(0).toFixed(1) +
      '" r="3.5" fill="' +
      color +
      '"/>' +
      (label
        ? '<text x="' +
          X(h).toFixed(1) +
          '" y="' +
          (Y(0) + 15).toFixed(1) +
          '" text-anchor="middle" font-size="9" fill="' +
          color +
          '">' +
          label +
          "</text>"
        : "")
    );
  }
  s += mark(rs.rise, "#c9962e", rs.rise) + mark(rs.set, "#c9962e", rs.set);
  s += mark(rm.rise, "#8b93a3", "") + mark(rm.set, "#8b93a3", "");
  var dh = (dt.getTime() - t0) / 3600000;
  if (dh >= 0 && dh <= 24) {
    s +=
      '<line x1="' +
      X(dh).toFixed(1) +
      '" y1="' +
      T +
      '" x2="' +
      X(dh).toFixed(1) +
      '" y2="' +
      (T + PH) +
      '" stroke="var(--gold)" stroke-width="1.5"/>' +
      '<text x="' +
      X(dh).toFixed(1) +
      '" y="' +
      (T - 3) +
      '" text-anchor="middle" font-size="9" fill="var(--gold)">所选</text>';
  }
  return s;
}
/* 面板骨架 */
function smPanelHTML() {
  return (
    '<div class="panel blk" id="smPanel"><h3 class="sec">日月天象 · 图解 <small class="dim">拨动时间,看日月方位与月相变化</small></h3>' +
    '<div class="sm-ctl"><input type="datetime-local" id="smDt" step="60">' +
    '<button class="gbtn sm" id="smNow">回到此刻</button>' +
    '<button class="gbtn sm" data-sm-step="-1440">-1天</button>' +
    '<button class="gbtn sm" data-sm-step="-60">-1时</button>' +
    '<button class="gbtn sm" data-sm-step="60">+1时</button>' +
    '<button class="gbtn sm" data-sm-step="1440">+1天</button></div>' +
    '<div class="sm-srow"><span class="dim sm">过去</span><input type="range" id="smSlider" min="-72" max="72" step="0.5" value="0">' +
    '<span class="dim sm">未来</span><span class="dim sm" id="smOff">+0.0h</span></div>' +
    '<div class="sm-grid" id="smCards"></div>' +
    '<div class="sm-figs">' +
    '<figure class="sm-fig"><svg id="smDome" viewBox="0 0 340 340"></svg><figcaption>天穹图 · 地平坐标(北上东右)<br><span class="dim sm">金线=黄道 · 蓝虚线=天赤道 · 圆圈=30°/60°高度圈</span></figcaption></figure>' +
    '<figure class="sm-fig"><svg id="smTop" viewBox="0 0 360 340"></svg><figcaption>日地月关系 · 黄道俯视(自北黄极下望)<br><span class="dim sm">金圈=黄道 · 青虚线=白道示意 · 距角=日月黄经差</span></figcaption></figure>' +
    '<figure class="sm-fig"><svg id="smPhaseSvg" viewBox="0 0 170 170"></svg><figcaption id="smPhaseCap">月相</figcaption></figure>' +
    '<figure class="sm-fig"><svg id="smAlt" viewBox="0 0 360 220"></svg><figcaption>日月高度角 · 当日变化<br><span class="dim sm">金线=太阳 · 灰线=月亮 · 阴影=黑夜 · 圆点=出没</span></figcaption></figure>' +
    '</div><p class="note" id="smLoc"></p></div>'
  );
}
function smFmtDT(d) {
  var p = function (n) {
    return String(n).padStart(2, "0");
  };
  return (
    d.getFullYear() +
    "-" +
    p(d.getMonth() + 1) +
    "-" +
    p(d.getDate()) +
    " " +
    p(d.getHours()) +
    ":" +
    p(d.getMinutes())
  );
}
function smFmtLocal(d) {
  var p = function (n) {
    return String(n).padStart(2, "0");
  };
  return (
    d.getFullYear() +
    "-" +
    p(d.getMonth() + 1) +
    "-" +
    p(d.getDate()) +
    "T" +
    p(d.getHours()) +
    ":" +
    p(d.getMinutes())
  );
}
/* 重算并刷新 */
function smUpdate() {
  var dt = SM.dt,
    jd = smJD(dt);
  var lon = parseFloat($("#lon").value),
    lat = parseFloat($("#lat").value);
  if (isNaN(lon)) lon = 120;
  if (isNaN(lat)) lat = 23.5;
  var sun = smSun(jd),
    moon = smMoon(jd);
  var sa = smAltAz(sun.eq.ra, sun.eq.dec, jd, lon, lat),
    ma = smAltAz(moon.eq.ra, moon.eq.dec, jd, lon, lat);
  var ph = smPhase(moon.lon, sun.lon);
  var rs = smRiseSet("sun", dt.getFullYear(), dt.getMonth() + 1, dt.getDate(), lon, lat);
  var rm = smRiseSet("moon", dt.getFullYear(), dt.getMonth() + 1, dt.getDate(), lon, lat);
  var WN = ["北", "东北", "东", "东南", "南", "西南", "西", "西北"];
  function azn(az) {
    return WN[Math.round(az / 45) % 8];
  }
  function fmt(o) {
    return (o.alt >= 0 ? "+" : "") + o.alt.toFixed(1) + "° / " + o.az.toFixed(1) + "°" + azn(o.az);
  }
  function st(o) {
    return o.alt > 0 ? "地平之上" : "地平之下";
  }
  $("#smCards").innerHTML =
    '<div class="sm-card"><h4>☉ 太阳</h4>' +
    '<div class="row"><span>高度 / 方位</span><b>' +
    fmt(sa) +
    "</b></div>" +
    '<div class="row"><span>黄经</span><span>' +
    sun.lon.toFixed(2) +
    "°</span></div>" +
    '<div class="row"><span>状态</span><span>' +
    st(sa) +
    "</span></div></div>" +
    '<div class="sm-card"><h4>☽ 月亮</h4>' +
    '<div class="row"><span>高度 / 方位</span><b>' +
    fmt(ma) +
    "</b></div>" +
    '<div class="row"><span>黄经 / 黄纬</span><span>' +
    moon.lon.toFixed(2) +
    "° / " +
    moon.lat.toFixed(2) +
    "°</span></div>" +
    '<div class="row"><span>地心距离</span><span>' +
    ((moon.dist * 6378.14) / 10000).toFixed(1) +
    "万km</span></div>" +
    '<div class="row"><span>状态</span><span>' +
    st(ma) +
    "</span></div></div>" +
    '<div class="sm-card"><h4>月相</h4>' +
    '<div class="row"><span>月相</span><b class="sm-big">' +
    ph.name +
    "</b></div>" +
    '<div class="row"><span>照亮比</span><span>' +
    (ph.k * 100).toFixed(1) +
    "%</span></div>" +
    '<div class="row"><span>月龄</span><span>' +
    ph.age.toFixed(1) +
    "天</span></div>" +
    '<div class="row"><span>距角</span><span>' +
    ph.e2.toFixed(1) +
    "° · " +
    (ph.wax ? "盈" : "亏") +
    "</span></div></div>" +
    '<div class="sm-card"><h4>出没 <span class="dim sm">所选日期</span></h4>' +
    '<div class="row"><span>日出</span><span>' +
    rs.rise +
    "</span></div>" +
    '<div class="row"><span>日落</span><span>' +
    rs.set +
    "</span></div>" +
    '<div class="row"><span>月出</span><span>' +
    rm.rise +
    "</span></div>" +
    '<div class="row"><span>月落</span><span>' +
    rm.set +
    "</span></div></div>" +
    '<div class="sm-card"><h4>轨道参数</h4>' +
    '<div class="row"><span>黄赤交角</span><span>' +
    sun.eps.toFixed(3) +
    "°</span></div>" +
    '<div class="row"><span>白道倾角</span><span>5.145°</span></div>' +
    '<div class="row"><span>朔望月</span><span>29.5306 天</span></div>' +
    '<div class="row"><span>日地距离</span><span>' +
    (() => {
      try {
        var T = (jd - 2451545) / 36525,
          e = asHelio("地球", T);
        return Math.hypot(e.x, e.y, e.z).toFixed(4) + " AU";
      } catch (_) {
        return "约 1 AU";
      }
    })() +
    "</span></div></div>";
  $("#smDome").innerHTML = smDomeSVG(sun, moon, sa, ma, ph, jd, lon, lat);
  $("#smTop").innerHTML = smTopSVG(sun, moon, ph, jd);
  $("#smPhaseSvg").innerHTML = smPhaseBigSVG(ph);
  $("#smAlt").innerHTML = smAltCurveSVG(
    dt.getFullYear(),
    dt.getMonth() + 1,
    dt.getDate(),
    lon,
    lat,
    dt,
    rs,
    rm,
  );
  $("#smPhaseCap").innerHTML =
    "月相 · " +
    ph.name +
    '<br><span class="dim sm">照亮 ' +
    (ph.k * 100).toFixed(1) +
    "% · 月龄 " +
    ph.age.toFixed(1) +
    "天</span>";
  $("#smLoc").textContent =
    "观测地:东经" +
    lon.toFixed(2) +
    "° 北纬" +
    lat.toFixed(2) +
    "°(取页面上方经纬度) · 时刻 " +
    smFmtDT(dt) +
    " · 低精度示意算法,方位约±0.1°,仅作直观参考";
  try {
    if (
      typeof ORR3D !== "undefined" &&
      ORR3D &&
      !ORR3D.syncLock &&
      document.getElementById("as-orr3d")
    ) {
      ORR3D.jd = jd;
      ORR3D.orbitCache = { key: null, data: {} };
      if (ORR3D.mode === "helio") orr3dHelioRender();
      orr3dInfo();
    }
  } catch (e) {}
}
/* 放大查看(lightbox):克隆 SVG 进全屏浮层,点背景/✕/Esc 关闭 */
function smZoomClose() {
  var o = document.getElementById("smLight");
  if (o) o.remove();
  document.body.style.overflow = "";
}
function smZoomOpen(svgId, cap) {
  smZoomClose();
  var src = document.getElementById(svgId);
  if (!src) return;
  var ov = document.createElement("div");
  ov.className = "sm-light";
  ov.id = "smLight";
  var card = document.createElement("div");
  card.className = "sm-light-card";
  var c = src.cloneNode(true);
  c.removeAttribute("id");
  var x = document.createElement("button");
  x.className = "sm-light-x";
  x.textContent = "✕";
  x.title = "关闭";
  x.onclick = function (ev) {
    ev.stopPropagation();
    smZoomClose();
  };
  var cp = document.createElement("div");
  cp.className = "sm-light-cap";
  cp.textContent = cap || "";
  card.appendChild(x);
  card.appendChild(c);
  card.appendChild(cp);
  ov.appendChild(card);
  ov.addEventListener("click", function (e) {
    if (e.target === ov) smZoomClose();
  });
  document.body.appendChild(ov);
  document.body.style.overflow = "hidden";
}
/* 绑定 */
function bindSunMoon() {
  var dtI = $("#smDt");
  if (!dtI || dtI.dataset.smb) return;
  dtI.dataset.smb = "1";
  SM.dt = new Date();
  SM.now0 = new Date();
  dtI.value = smFmtLocal(SM.dt);
  function sync(v) {
    dtI.value = smFmtLocal(SM.dt);
    $("#smSlider").value = 0;
    $("#smOff").textContent = "+0.0h";
    smUpdate();
  }
  $("#smNow").onclick = function () {
    SM.dt = new Date();
    SM.now0 = new Date();
    sync();
  };
  dtI.onchange = function () {
    var v = new Date(dtI.value);
    if (!isNaN(v)) {
      SM.dt = v;
      SM.now0 = new Date();
      sync();
    }
  };
  var btns = document.querySelectorAll("[data-sm-step]");
  for (var i = 0; i < btns.length; i++)
    (function (b) {
      b.onclick = function () {
        SM.dt = new Date(SM.dt.getTime() + +b.dataset.smStep * 60000);
        SM.now0 = new Date();
        sync();
      };
    })(btns[i]);
  $("#smSlider").oninput = function (e) {
    var h = parseFloat(e.target.value);
    SM.dt = new Date(SM.now0.getTime() + h * 3600e3);
    dtI.value = smFmtLocal(SM.dt);
    $("#smOff").textContent = (h >= 0 ? "+" : "") + h.toFixed(1) + "h";
    smUpdate();
  };
  var panel = document.getElementById("smPanel");
  if (panel && !panel.dataset.zb) {
    panel.dataset.zb = "1";
    panel.addEventListener("click", function (e) {
      var b = e.target.closest ? e.target.closest(".sm-zoom") : null;
      if (!b) return;
      var fig = b.closest(".sm-fig");
      var cap =
        fig && fig.querySelector("figcaption") ? fig.querySelector("figcaption").textContent : "";
      smZoomOpen(b.getAttribute("data-svg"), cap);
    });
  }
  if (!window.__smZoomEsc) {
    window.__smZoomEsc = true;
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") smZoomClose();
    });
  }
  smUpdate();
}

/* ===== v13.0 太阳系 3D 运转模拟（八大行星 + 冥王星可选） ===== */
var ORR3D = {
  jd: 0,
  playing: true,
  speed: 7,
  yaw: -0.62,
  pitch: 0.82,
  dist: 720,
  minDist: 310,
  focal: 650,
  tx: 0,
  ty: 0,
  tz: 0,
  autoRot: false,
  selected: "地球",
  mode: "3d",
  syncLock: false,
  show: {
    grid: true,
    orbits: true,
    labels: true,
    pluto: false,
    zodiac: true,
    axes: true,
    skyStars: true,
    skyConst: true,
    skyConstName: true,
    skyXiu: true,
    skyLabels: false,
  },
  cv: null,
  ctx: null,
  cw: 0,
  ch: 0,
  token: 0,
  last: 0,
  io: null,
  ro: null,
  visible: true,
  visHidden: false,
  infoT: 0,
  colT: 0,
  cols: {},
  stars: null,
  hits: [],
  orbitCache: { key: null, data: {} },
};
var ORR3D_PLANETS = {
  水星: { g: "☿", period: 87.969, size: 3.6, c1: "#d8d1c4", c2: "#81776a" },
  金星: { g: "♀", period: 224.701, size: 5.0, c1: "#f3d79b", c2: "#ad7844" },
  地球: { g: "⊕", period: 365.256, size: 5.2, c1: "#9cd6ff", c2: "#296497" },
  火星: { g: "♂", period: 686.98, size: 4.2, c1: "#ec9b72", c2: "#9f3d28" },
  木星: { g: "♃", period: 4332.59, size: 9.0, c1: "#dfc09d", c2: "#8f684e" },
  土星: { g: "♄", period: 10759.2, size: 8.2, c1: "#ead7a8", c2: "#a58a57" },
  天王星: { g: "♅", period: 30685.4, size: 6.2, c1: "#a8edf1", c2: "#4b9fa9" },
  海王星: { g: "♆", period: 60189, size: 6.1, c1: "#85a9ff", c2: "#3259ad" },
  冥王星: { g: "♇", period: 90560, size: 3.2, c1: "#d1c4b4", c2: "#6e6258" },
};
var ORR3D_NAMES = ["水星", "金星", "地球", "火星", "木星", "土星", "天王星", "海王星", "冥王星"];
function orr3dHTML() {
  return (
    '<span id="as-orr3d-ph" hidden></span><div class="panel blk orr-workbench" id="as-orr3d"><div class="mod-head"><h3>太阳系 · 天体模拟工作台</h3><p>太阳系 3D · 日心俯视 · 日地月 3D · 黄道 / 白道 / 天赤道 / 月相 / 轨道参数</p></div>' +
    '<div class="orr-modebar" role="tablist" aria-label="太阳系模拟模式"><button type="button" class="on" data-orr-mode="3d">太阳系 3D</button><button type="button" data-orr-mode="helio">日心俯视</button><button type="button" data-orr-mode="sem">日 · 地 · 月 3D</button><span class="orr-modehint" id="orrModeHint">拖动环绕 · 滚轮推进/拉远 · Shift/右键拖动平移</span></div>' +
    '<div class="orr3d-ctl"><button class="gbtn sm" id="orr3dPlay">⏸ 暂停</button><label>速度 <select id="orr3dSpd"><option value="1">1天/秒</option><option value="7" selected>7天/秒</option><option value="30">30天/秒</option><option value="120">120天/秒</option></select></label><label class="orr-focus-wrap">聚焦 <select id="orr3dFocus">' +
    ORR3D_NAMES.map(function (n) {
      return (
        '<option value="' +
        n +
        '"' +
        (n === "地球" ? " selected" : "") +
        ">" +
        ORR3D_PLANETS[n].g +
        " " +
        n +
        "</option>"
      );
    }).join("") +
    '</select></label><span class="sp"></span><button class="gbtn sm" id="orr3dNow">回到此刻</button><button class="gbtn sm" id="orr3dReset">视图复位</button></div>' +
    '<section class="orr-mode-panel" id="orrMode3d" data-mode="3d"><div class="orr3d-stage"><canvas id="orr3dCv"></canvas><div class="orr3d-badge">J2000 黄道坐标 · 真相机推进 / 拉远 · 恒星天球 / 星座 / 二十八宿</div></div><div class="cam-help"><span><b>滚轮</b> 相机前后推进</span><span><b>拖动</b> 环绕观察</span><span><kbd>Shift</kbd>+拖动 / 右键拖动 平移视点</span><span><b>双击</b> 复位</span></div></section>' +
    '<section class="orr-mode-panel" id="orrModeHelio" data-mode="helio" hidden><div class="orr-helio-grid"><div class="orr-helio-stage"><svg id="orrHelioSvg" viewBox="0 0 620 620" role="img" aria-label="太阳系日心俯视图"></svg></div><aside class="orr-helio-side" id="orrHelioInfo"></aside></div></section>' +
    '<section class="orr-mode-panel orr-sem-wrap" id="orrModeSem" data-mode="sem" hidden><div class="sem3d-block"><div class="sem3d-head"><h4>日 · 地 · 月 3D 空间模拟</h4><span class="astro-gesture-hint"><b>拖动环绕</b> · <b>滚轮推进/拉远</b> · <b>Shift/右键拖动平移</b></span></div><div class="sem3d-tools"><label><input type="checkbox" id="semT_ecl" checked> 黄道面</label><label><input type="checkbox" id="semT_lun" checked> 白道 / 月球轨道</label><label><input type="checkbox" id="semT_eq" checked> 天赤道</label><label><input type="checkbox" id="semT_vec" checked> 日地月连线</label><label><input type="checkbox" id="semT_axis" checked> 地轴 / 春分点</label><label><input type="checkbox" id="semT_lab" checked> 名称参数</label><label><input type="checkbox" id="semT_trad" checked> 传统历象标记</label><span class="sem3d-sky-sep">天球背景</span><label><input type="checkbox" id="semT_stars" checked> 恒星</label><label><input type="checkbox" id="semT_const" checked> 星座线</label><label><input type="checkbox" id="semT_constName" checked> 星座名</label><label><input type="checkbox" id="semT_xiu" checked> 二十八宿</label><label><input type="checkbox" id="semT_starLab"> 亮星名</label></div><div class="sem3d-stage"><canvas id="sem3dCv"></canvas><div class="sem3d-badge">同源联动 · 恒星天球背景 · 星座 / 二十八宿 · 与下方“日月天象图解”共享数据</div></div><div class="cam-help"><span><b>滚轮</b> 相机前后推进</span><span><b>拖动</b> 环绕观察</span><span><kbd>Shift</kbd>+拖动 / 右键拖动 平移视点</span><span><b>双击</b> 复位</span></div><div class="sem3d-legend"><span style="--lc:#d2aa55"><i></i>黄道</span><span style="--lc:#62cdc3"><i class="dash"></i>白道</span><span style="--lc:#5f7fbe"><i class="dash"></i>天赤道</span><span style="--lc:#d0503b"><i></i>春分点 / 地轴</span></div></div>' +
    smPanelHTML() +
    "</section>" +
    '<div class="orr3d-tog" id="orr3dTog" data-mode="3d"><label class="only-3d"><input type="checkbox" id="orr3dT_grid" checked> 黄道网格</label><label class="only-system"><input type="checkbox" id="orr3dT_orb" checked> 行星轨道</label><label class="only-system"><input type="checkbox" id="orr3dT_lb" checked> 名称标注</label><label class="only-system"><input type="checkbox" id="orr3dT_zd" checked> 黄道十二宫</label><label class="only-3d"><input type="checkbox" id="orr3dT_ax" checked> 坐标轴</label><label class="only-system"><input type="checkbox" id="orr3dT_pl"> 冥王星</label><label class="only-3d"><input type="checkbox" id="orr3dT_rot"> 自动旋转</label><label class="only-3d"><input type="checkbox" id="orr3dT_stars" checked> 恒星背景</label><label class="only-3d"><input type="checkbox" id="orr3dT_const" checked> 星座线</label><label class="only-3d"><input type="checkbox" id="orr3dT_constName" checked> 星座名</label><label class="only-3d"><input type="checkbox" id="orr3dT_xiu" checked> 二十八宿</label><label class="only-3d"><input type="checkbox" id="orr3dT_starLab"> 亮星名</label></div>' +
    '<div class="orr3d-info" id="orr3dInfo"></div><div class="orr3d-legend" id="orr3dLegend">' +
    ORR3D_NAMES.slice(0, 8)
      .map(function (n) {
        return '<span style="--pc:' + ORR3D_PLANETS[n].c1 + '"><i></i>' + n + "</span>";
      })
      .join("") +
    "</div>" +
    '<div class="tradastro" id="tradAstro"><div class="tradastro-head"><h4>传统历象 · 七政二十八宿参照</h4><span>二十四节气 · 十二次 · 二十八宿 · 日月五星 · 黄白交点</span></div><div class="tradastro-grid"><div class="tradastro-fig"><svg id="tradAstroSvg" viewBox="-300 -300 600 600" role="img" aria-label="传统天文历象参照盘"></svg></div><div class="tradastro-side" id="tradAstroInfo"></div></div></div>' +
    '<p class="orr-common-note" id="orrModeNote">位置由本页 JPL 近似开普勒根数计算。3D 使用固定焦距透视相机：滚轮改变相机距离，普通拖动环绕，Shift/中键/右键拖动平移观察中心；双击或“视图复位”回到默认视角。</p></div>'
  );
}
/* 太阳系 / 日地月共用的真实恒星天球背景：恒星与主要星座来自“星空”模块；二十八宿为本页宿度参照。 */
var ASTRO_SKY_CACHE = { key: null, data: null };
function astroSkyEqToEcl(raDeg, decDeg, epsDeg) {
  var a = raDeg * SM_D2R,
    d = decDeg * SM_D2R,
    e = epsDeg * SM_D2R,
    cd = Math.cos(d),
    x = cd * Math.cos(a),
    y = cd * Math.sin(a),
    z = Math.sin(d);
  return { x: x, y: y * Math.cos(e) + z * Math.sin(e), z: -y * Math.sin(e) + z * Math.cos(e) };
}
function astroSkyLonVec(lon, lat) {
  var a = lon * SM_D2R,
    b = (lat || 0) * SM_D2R,
    cb = Math.cos(b);
  return { x: cb * Math.cos(a), y: cb * Math.sin(a), z: Math.sin(b) };
}
function astroSkyCatalog(jd) {
  var key = Math.floor(jd / 7);
  if (ASTRO_SKY_CACHE.key === key && ASTRO_SKY_CACHE.data) return ASTRO_SKY_CACHE.data;
  var eps = typeof smSun === "function" ? smSun(jd).eps : 23.4393,
    dt = fromJD(jd + 8 / 24),
    year = dt.y || 2000;
  var stars = [];
  if (typeof XK_STARS !== "undefined")
    for (var i = 0; i < XK_STARS.length; i++) {
      var s = XK_STARS[i],
        eq = xkPrecess(s[1], s[2], jd);
      stars.push({ n: s[0], mag: s[3], bv: s[4], v: astroSkyEqToEcl(eq.ra, eq.dec, eps) });
    }
  var cons = [];
  if (typeof XK3_CONST !== "undefined")
    for (var ci = 0; ci < XK3_CONST.length; ci++) {
      var co = XK3_CONST[ci],
        pts = [];
      for (var pi = 0; pi < co.p.length; pi++) {
        var q = co.p[pi],
          eq2 = xkPrecess(q[0] / 15, q[1], jd);
        pts.push(astroSkyEqToEcl(eq2.ra, eq2.dec, eps));
      }
      cons.push({ n: co.n, z: !!co.z, p: pts, l: co.l });
    }
  var xiu = [];
  if (typeof xiuTable === "function") {
    var tb = xiuTable(year);
    for (var xi = 0; xi < tb.length; xi++) {
      var x = tb[xi];
      xiu.push({
        n: x.n,
        si: x.si,
        wx: x.wx,
        lon: norm360(x.s + x.w / 2),
        v: astroSkyLonVec(norm360(x.s + x.w / 2), 0),
      });
    }
  }
  ASTRO_SKY_CACHE = { key: key, data: { stars: stars, cons: cons, xiu: xiu, year: year } };
  return ASTRO_SKY_CACHE.data;
}
function astroSkyRot(O, p) {
  var cy = Math.cos(O.yaw),
    sy = Math.sin(O.yaw),
    x1 = p.x * cy - p.y * sy,
    y1 = p.x * sy + p.y * cy,
    z1 = p.z,
    cp = Math.cos(O.pitch),
    sp = Math.sin(O.pitch);
  return { x: x1, y: y1 * cp - z1 * sp, z: y1 * sp + z1 * cp };
}
function astroSkyPoint(O, p, R) {
  var q = astroSkyRot(O, p);
  return { x: O.cw / 2 + q.x * R, y: O.ch / 2 - q.z * R, d: q.y };
}
function astroSkyDraw(O, jd, opt) {
  var c = O.ctx;
  if (!c || !O.cw) return;
  opt = opt || {};
  var D = astroSkyCatalog(jd),
    R = Math.hypot(O.cw, O.ch) * 0.6,
    labels = [];
  if (opt.stars) {
    c.save();
    for (var i = 0; i < D.stars.length; i++) {
      var s = D.stars[i],
        p = astroSkyPoint(O, s.v, R);
      if (p.d <= 0.015) continue;
      var a = 0.12 + 0.58 * Math.pow(Math.min(1, p.d), 0.65),
        r = Math.max(0.45, 2.7 - 0.52 * s.mag);
      c.globalAlpha = a;
      c.fillStyle = typeof xkStarColor === "function" ? xkStarColor(s.bv) : "#e7ecf7";
      c.beginPath();
      c.arc(p.x, p.y, r, 0, Math.PI * 2);
      c.fill();
      if (opt.labels && s.mag <= 1.1 && p.d > 0.3) {
        var ok = true;
        for (var li = 0; li < labels.length; li++)
          if (Math.hypot(labels[li][0] - p.x, labels[li][1] - p.y) < 42) {
            ok = false;
            break;
          }
        if (ok) {
          labels.push([p.x, p.y]);
          c.globalAlpha = 0.72;
          c.font = "9.5px sans-serif";
          c.textAlign = "left";
          c.fillStyle = "#d9e3f4";
          c.fillText(s.n, p.x + r + 3, p.y - 3);
        }
      }
    }
    c.restore();
  }
  if (opt.constell || opt.constName) {
    for (var ci = 0; ci < D.cons.length; ci++) {
      var co = D.cons[ci],
        pp = co.p.map(function (v) {
          return astroSkyPoint(O, v, R);
        });
      if (opt.constell) {
        c.save();
        c.lineCap = "round";
        c.lineJoin = "round";
        c.strokeStyle = co.z ? "rgba(224,184,100,.46)" : "rgba(143,173,220,.34)";
        c.lineWidth = co.z ? 1.05 : 0.85;
        for (var si = 0; si < co.l.length; si++) {
          var path = co.l[si];
          for (var k = 1; k < path.length; k++) {
            var a = pp[path[k - 1]],
              b = pp[path[k]];
            if (a.d <= 0 || b.d <= 0) continue;
            c.globalAlpha = 0.22 + 0.55 * Math.min(1, (a.d + b.d) / 2);
            c.beginPath();
            c.moveTo(a.x, a.y);
            c.lineTo(b.x, b.y);
            c.stroke();
          }
        }
        c.restore();
      }
      if (opt.constName) {
        var sx = 0,
          sy = 0,
          sd = 0,
          n = 0;
        for (var pi = 0; pi < pp.length; pi++)
          if (pp[pi].d > 0) {
            sx += pp[pi].x;
            sy += pp[pi].y;
            sd += pp[pi].d;
            n++;
          }
        if (n && sd / n > 0.2) {
          c.save();
          c.globalAlpha = co.z ? 0.72 : 0.56;
          c.fillStyle = co.z ? "#e1bd70" : "#b8cae8";
          c.font = (co.z ? "600 " : "") + "10px sans-serif";
          c.textAlign = "center";
          c.fillText(co.n, sx / n, sy / n - 7);
          c.restore();
        }
      }
    }
  }
  if (opt.xiu && D.xiu.length) {
    var cols = ["#63c090", "#62cdc3", "#ddd8c9", "#d06a52", "#d9b25f"];
    c.save();
    c.textAlign = "center";
    c.font = '9px "Noto Serif SC",serif';
    for (var xi = 0; xi < D.xiu.length; xi++) {
      var x = D.xiu[xi],
        p = astroSkyPoint(O, x.v, R * 0.985);
      if (p.d <= 0.08) continue;
      var col = cols[x.wx] || "#d9b25f";
      c.globalAlpha = 0.38 + 0.5 * p.d;
      c.fillStyle = col;
      c.beginPath();
      c.arc(p.x, p.y, 2.1, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = col;
      c.fillText(x.n, p.x, p.y - 6);
    }
    c.restore();
  }
}
var SEM3D = {
  yaw: -0.62,
  pitch: 0.58,
  dist: 660,
  minDist: 285,
  focal: 620,
  tx: 0,
  ty: 0,
  tz: 0,
  cv: null,
  ctx: null,
  cw: 0,
  ch: 0,
  show: {
    ecl: true,
    lun: true,
    eq: true,
    vec: true,
    axis: true,
    lab: true,
    trad: true,
    skyStars: true,
    skyConst: true,
    skyConstName: true,
    skyXiu: true,
    skyLabels: false,
  },
  stars: null,
};
function sem3dReset() {
  SEM3D.yaw = -0.62;
  SEM3D.pitch = 0.58;
  SEM3D.dist = 660;
  SEM3D.tx = SEM3D.ty = SEM3D.tz = 0;
  sem3dDraw();
}
function sem3dProj(x, y, z) {
  var O = SEM3D;
  x -= O.tx;
  y -= O.ty;
  z -= O.tz;
  var cy = Math.cos(O.yaw),
    sy = Math.sin(O.yaw),
    x1 = x * cy - y * sy,
    y1 = x * sy + y * cy,
    z1 = z,
    cp = Math.cos(O.pitch),
    sp = Math.sin(O.pitch),
    y2 = y1 * cp - z1 * sp,
    z2 = y1 * sp + z1 * cp,
    depth = O.dist + y2;
  if (depth < 45) depth = 45;
  var sc = O.focal / depth;
  return { x: O.cw / 2 + x1 * sc, y: O.ch / 2 - z2 * sc, s: sc, d: depth };
}
function sem3dPath(pts, col, lw, dash, alpha) {
  var O = SEM3D,
    c = O.ctx;
  if (!c) return;
  c.save();
  c.strokeStyle = col;
  c.lineWidth = lw || 1;
  c.globalAlpha = alpha == null ? 1 : alpha;
  if (dash) c.setLineDash(dash);
  c.beginPath();
  for (var i = 0; i < pts.length; i++) {
    var p = sem3dProj(pts[i].x, pts[i].y, pts[i].z);
    if (i) c.lineTo(p.x, p.y);
    else c.moveTo(p.x, p.y);
  }
  c.stroke();
  c.restore();
}
function sem3dCircle(r, tilt, node) {
  var a = [],
    i = (tilt || 0) * SM_D2R,
    N = (node || 0) * SM_D2R;
  for (var k = 0; k <= 144; k++) {
    var u = (k / 144) * Math.PI * 2,
      cu = Math.cos(u),
      su = Math.sin(u),
      x = r * (Math.cos(N) * cu - Math.sin(N) * su * Math.cos(i)),
      y = r * (Math.sin(N) * cu + Math.cos(N) * su * Math.cos(i)),
      z = r * su * Math.sin(i);
    a.push({ x: x, y: y, z: z });
  }
  return a;
}
function sem3dFit() {
  var cv = document.getElementById("sem3dCv");
  if (!cv || !cv.isConnected) return;
  var r = cv.getBoundingClientRect();
  if (r.width < 10) return;
  var O = SEM3D,
    nw = r.width,
    nh = Math.round(Math.max(350, Math.min(590, r.width * 0.62))),
    maxPx = 2400000,
    dpr = Math.min(window.devicePixelRatio || 1, 1.65, Math.sqrt(maxPx / Math.max(1, nw * nh)));
  dpr = Math.max(1, dpr);
  var pw = Math.round(nw * dpr),
    ph = Math.round(nh * dpr);
  if (
    Math.abs((O.cw || 0) - nw) < 0.5 &&
    O.ch === nh &&
    cv.width === pw &&
    cv.height === ph &&
    O.ctx
  ) {
    sem3dDraw();
    return;
  }
  O.cw = nw;
  O.ch = nh;
  O.focal = Math.max(430, Math.min(820, O.ch * 1.22));
  if (cv.width !== pw) cv.width = pw;
  if (cv.height !== ph) cv.height = ph;
  if (cv.style.height !== O.ch + "px") cv.style.height = O.ch + "px";
  O.ctx = cv.getContext("2d");
  if (!O.ctx) {
    visRuntimeReport("日地月3D", "Canvas 2D 上下文不可用");
    return;
  }
  O.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  O.stars = null;
  sem3dDraw();
}
function sem3dDraw() {
  var O = SEM3D,
    c = O.ctx;
  if (
    !c ||
    !O.cw ||
    (document.getElementById("orrModeSem") && document.getElementById("orrModeSem").hidden)
  )
    return;
  var W = O.cw,
    H = O.ch,
    jd = (typeof ORR3D !== "undefined" && ORR3D.jd) || smJD(new Date()),
    sun = smSun(jd),
    moon = smMoon(jd),
    ph = smPhase(moon.lon, sun.lon);
  c.clearRect(0, 0, W, H);
  var bg = c.createRadialGradient(W * 0.5, H * 0.45, 20, W * 0.5, H * 0.5, Math.max(W, H) * 0.72);
  bg.addColorStop(0, "#152033");
  bg.addColorStop(1, "#06090f");
  c.fillStyle = bg;
  c.fillRect(0, 0, W, H);
  astroSkyDraw(O, jd, {
    stars: O.show.skyStars,
    constell: O.show.skyConst,
    constName: O.show.skyConstName,
    xiu: O.show.skyXiu,
    labels: O.show.skyLabels,
  });
  var d = jd - 2451543.5,
    node = smN360(125.1228 - 0.0529538083 * d),
    eps = sun.eps;
  if (O.show.ecl) {
    sem3dPath(sem3dCircle(145, 0, 0), "rgba(210,170,85,.78)", 1.8, null, 1);
    [72, 108].forEach(function (r) {
      sem3dPath(sem3dCircle(r, 0, 0), "rgba(210,170,85,.15)", 1, null, 1);
    });
    for (var z = 0; z < 12; z++) {
      var a = z * 30 * SM_D2R;
      sem3dPath(
        [
          { x: 42 * Math.cos(a), y: 42 * Math.sin(a), z: 0 },
          { x: 150 * Math.cos(a), y: 150 * Math.sin(a), z: 0 },
        ],
        "rgba(210,170,85,.10)",
        1,
        null,
        1,
      );
    }
  }
  if (O.show.eq) {
    sem3dPath(sem3dCircle(133, eps, 0), "rgba(95,127,190,.72)", 1.5, [6, 4], 1);
  }
  if (O.show.lun) {
    sem3dPath(sem3dCircle(102, 5.145, node), "rgba(98,205,195,.82)", 1.7, [6, 4], 1);
    var N = node * SM_D2R;
    sem3dPath(
      [
        { x: -115 * Math.cos(N), y: -115 * Math.sin(N), z: 0 },
        { x: 115 * Math.cos(N), y: 115 * Math.sin(N), z: 0 },
      ],
      "rgba(98,205,195,.36)",
      1,
      [3, 4],
      1,
    );
  }
  if (O.show.axis) {
    sem3dPath(
      [
        { x: -158, y: 0, z: 0 },
        { x: 158, y: 0, z: 0 },
      ],
      "rgba(208,80,59,.52)",
      1.2,
      [5, 4],
      1,
    );
    var ax = { x: 0, y: -Math.sin(eps * SM_D2R) * 66, z: Math.cos(eps * SM_D2R) * 66 };
    sem3dPath([{ x: -ax.x, y: -ax.y, z: -ax.z }, ax], "rgba(220,225,235,.75)", 1.8, null, 1);
  }
  var sunR = 245,
    sa = sun.lon * SM_D2R,
    S = { x: sunR * Math.cos(sa), y: sunR * Math.sin(sa), z: 0 };
  var mr = 102,
    ml = moon.lon * SM_D2R,
    mb = moon.lat * SM_D2R,
    M = {
      x: mr * Math.cos(mb) * Math.cos(ml),
      y: mr * Math.cos(mb) * Math.sin(ml),
      z: mr * Math.sin(mb),
    },
    E = { x: 0, y: 0, z: 0 };
  if (O.show.vec) {
    sem3dPath([E, S], "rgba(242,183,60,.54)", 1.3, [4, 4], 1);
    sem3dPath([E, M], "rgba(230,232,239,.55)", 1.3, null, 1);
    sem3dPath([S, M], "rgba(180,190,205,.20)", 1, [3, 5], 1);
  }
  var objs = [
    { n: "太阳", p: S, r: 15, c1: "#fff0a5", c2: "#d89020" },
    { n: "地球", p: E, r: 11, c1: "#8dc8ff", c2: "#285e91" },
    { n: "月亮", p: M, r: 7, c1: "#f0eee7", c2: "#737b8d" },
  ]
    .map(function (o) {
      o.v = sem3dProj(o.p.x, o.p.y, o.p.z);
      return o;
    })
    .sort(function (a, b) {
      return b.v.d - a.v.d;
    });
  for (var i = 0; i < objs.length; i++) {
    var o = objs[i],
      p = o.v,
      rr = o.r * Math.max(0.72, Math.min(1.2, p.s)),
      g = c.createRadialGradient(p.x - rr * 0.35, p.y - rr * 0.35, 1, p.x, p.y, rr);
    g.addColorStop(0, o.c1);
    g.addColorStop(1, o.c2);
    c.fillStyle = g;
    c.beginPath();
    c.arc(p.x, p.y, rr, 0, Math.PI * 2);
    c.fill();
    if (O.show.lab) {
      c.fillStyle = "#e4dfd2";
      c.font = "11px sans-serif";
      c.textAlign = "center";
      c.fillText(o.n, p.x, p.y - rr - 7);
    }
  }
  if (O.show.trad) {
    var ci = [
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
    c.save();
    c.font = '9px "Noto Serif SC",serif';
    c.textAlign = "center";
    c.fillStyle = "rgba(217,178,95,.68)";
    for (var zz = 0; zz < 12; zz++) {
      var aa = (zz * 30 + 15) * SM_D2R,
        pp = sem3dProj(164 * Math.cos(aa), 164 * Math.sin(aa), 0);
      if (pp.d > 50) c.fillText(ci[zz], pp.x, pp.y);
    }
    var majors = [
      ["春分", 0],
      ["夏至", 90],
      ["秋分", 180],
      ["冬至", 270],
    ];
    c.fillStyle = "rgba(246,220,148,.82)";
    for (var mm = 0; mm < majors.length; mm++) {
      var ma = majors[mm][1] * SM_D2R,
        mp = sem3dProj(183 * Math.cos(ma), 183 * Math.sin(ma), 0);
      if (mp.d > 50) c.fillText(majors[mm][0], mp.x, mp.y);
    }
    c.restore();
  }
  if (O.show.lab) {
    c.save();
    c.font = "10px sans-serif";
    c.fillStyle = "rgba(230,220,195,.74)";
    c.textAlign = "left";
    c.fillText("春分点 0°", W - 92, H / 2 - 5);
    c.fillText("黄赤交角 " + eps.toFixed(2) + "°", 12, H - 28);
    c.fillText("白道倾角 5.145°", 12, H - 13);
    c.textAlign = "right";
    c.fillText(ph.name + " · 距角 " + ph.e2.toFixed(1) + "°", W - 12, H - 13);
    c.restore();
  }
}
function camPan(O, dx, dy) {
  var cy = Math.cos(O.yaw),
    sy = Math.sin(O.yaw),
    sp = Math.sin(O.pitch),
    cp = Math.cos(O.pitch),
    w = O.dist / Math.max(100, O.focal);
  O.tx += (-dx * cy + dy * sy * sp) * w;
  O.ty += (dx * sy + dy * cy * sp) * w;
  O.tz += dy * cp * w;
}
function camDolly(O, dy) {
  O.dist *= Math.exp(Math.max(-120, Math.min(120, dy)) * 0.0024);
  O.dist = Math.max(O.minDist || 180, Math.min(2200, O.dist));
}
function sem3dBind() {
  var cv = document.getElementById("sem3dCv");
  if (!cv || cv.dataset.sem3) return;
  cv.dataset.sem3 = "1";
  var O = SEM3D;
  if (O.ro && O.ro.disconnect)
    try {
      O.ro.disconnect();
    } catch (_) {}
  if (O._resizeHandler) window.removeEventListener("resize", O._resizeHandler);
  if (O._fitRaf) cancelAnimationFrame(O._fitRaf);
  O.cv = cv;
  var drag = null,
    holdTimer = 0,
    moved = false;
  cv.addEventListener("contextmenu", function (e) {
    e.preventDefault();
  });
  cv.addEventListener("pointerdown", function (e) {
    if (e.button !== 0 && e.button !== 1 && e.button !== 2) return;
    clearTimeout(holdTimer);
    drag = {
      x: e.clientX,
      y: e.clientY,
      sx: e.clientX,
      sy: e.clientY,
      mode: e.shiftKey || e.button === 1 || e.button === 2 ? "pan" : "orbit",
      held: false,
    };
    moved = false;
    if (drag.mode === "orbit" && e.button === 0) {
      holdTimer = setTimeout(function () {
        if (drag && !moved) {
          drag.mode = "pan";
          drag.held = true;
          cv.classList.add("v114-longpan");
        }
      }, 480);
    }
    try {
      cv.setPointerCapture(e.pointerId);
    } catch (_) {}
  });
  cv.addEventListener("pointermove", function (e) {
    if (!drag) return;
    var dx = e.clientX - drag.x,
      dy = e.clientY - drag.y;
    if (Math.abs(e.clientX - drag.sx) + Math.abs(e.clientY - drag.sy) > 3) {
      moved = true;
      if (!drag.held && drag.mode === "orbit") clearTimeout(holdTimer);
    }
    if (drag.mode === "pan") camPan(SEM3D, dx, dy);
    else {
      SEM3D.yaw += dx * 0.006;
      SEM3D.pitch = Math.max(0.03, Math.min(1.5, SEM3D.pitch + dy * 0.006));
    }
    drag.x = e.clientX;
    drag.y = e.clientY;
    sem3dDraw();
  });
  cv.addEventListener("pointerup", function () {
    clearTimeout(holdTimer);
    cv.classList.remove("v114-longpan");
    drag = null;
  });
  cv.addEventListener("pointercancel", function () {
    clearTimeout(holdTimer);
    cv.classList.remove("v114-longpan");
    drag = null;
  });
  cv.addEventListener(
    "wheel",
    function (e) {
      e.preventDefault();
      camDolly(SEM3D, e.deltaY);
      sem3dDraw();
    },
    { passive: false },
  );
  cv.addEventListener("dblclick", function (e) {
    e.preventDefault();
    sem3dReset();
  });
  [
    ["semT_ecl", "ecl"],
    ["semT_lun", "lun"],
    ["semT_eq", "eq"],
    ["semT_vec", "vec"],
    ["semT_axis", "axis"],
    ["semT_lab", "lab"],
    ["semT_trad", "trad"],
    ["semT_stars", "skyStars"],
    ["semT_const", "skyConst"],
    ["semT_constName", "skyConstName"],
    ["semT_xiu", "skyXiu"],
    ["semT_starLab", "skyLabels"],
  ].forEach(function (z) {
    var e = document.getElementById(z[0]);
    if (e)
      e.onchange = function () {
        SEM3D.show[z[1]] = e.checked;
        sem3dDraw();
      };
  });
  var scheduleFit = function () {
    if (O._fitRaf) return;
    O._fitRaf = requestAnimationFrame(function () {
      O._fitRaf = 0;
      try {
        sem3dFit();
      } catch (e) {
        visRuntimeReport("日地月3D尺寸", e);
      }
    });
  };
  if (typeof ResizeObserver !== "undefined") {
    O.ro = new ResizeObserver(scheduleFit);
    O.ro.observe(cv.parentElement || cv);
  }
  O._resizeHandler = scheduleFit;
  window.addEventListener("resize", O._resizeHandler, { passive: true });
  setTimeout(scheduleFit, 0);
}
function orr3dFmt(jd) {
  var d = new Date((jd - 2440587.5) * 86400000),
    p = function (n) {
      return String(n).padStart(2, "0");
    };
  return (
    d.getFullYear() +
    "-" +
    p(d.getMonth() + 1) +
    "-" +
    p(d.getDate()) +
    " " +
    p(d.getHours()) +
    ":" +
    p(d.getMinutes())
  );
}
function orr3dCols() {
  var cs = getComputedStyle(document.body),
    g = function (k, f) {
      var v = cs.getPropertyValue(k).trim();
      return v || f;
    };
  ORR3D.cols = {
    ink: g("--ink", "#ddd"),
    gold: g("--gold", "#c89c45"),
    gold2: g("--gold2", "#e6c77f"),
    dim: g("--dim", "#aaa"),
    line: g("--line", "#555"),
  };
}
function orr3dDispR(r) {
  return 48 + 105 * Math.log10(1 + 2 * Math.max(0, r));
}
function orr3dCompress(h) {
  var r = Math.hypot(h.x, h.y, h.z) || 1,
    s = orr3dDispR(r) / r;
  return { x: h.x * s, y: h.y * s, z: h.z * s, r: r };
}
function orr3dProj(x, y, z) {
  var O = ORR3D;
  x -= O.tx;
  y -= O.ty;
  z -= O.tz;
  var cy = Math.cos(O.yaw),
    sy = Math.sin(O.yaw),
    x1 = x * cy - y * sy,
    y1 = x * sy + y * cy,
    z1 = z,
    cp = Math.cos(O.pitch),
    sp = Math.sin(O.pitch),
    y2 = y1 * cp - z1 * sp,
    z2 = y1 * sp + z1 * cp,
    depth = O.dist + y2;
  if (depth < 45) depth = 45;
  var s = O.focal / depth;
  return { x: O.cw / 2 + x1 * s, y: O.ch / 2 - z2 * s, s: s, depth: depth };
}
function orr3dPath(points, color, lw, dash, alpha) {
  var O = ORR3D,
    c = O.ctx;
  c.save();
  c.strokeStyle = color;
  c.globalAlpha = alpha == null ? 1 : alpha;
  c.lineWidth = lw || 1;
  if (dash) c.setLineDash(dash);
  c.beginPath();
  for (var i = 0; i < points.length; i++) {
    var p = orr3dProj(points[i].x, points[i].y, points[i].z);
    if (i === 0) c.moveTo(p.x, p.y);
    else c.lineTo(p.x, p.y);
  }
  c.stroke();
  c.restore();
}
function orr3dBall(px, py, pr, lit, mid, dark) {
  var c = ORR3D.ctx,
    g = c.createRadialGradient(px - pr * 0.35, py - pr * 0.4, pr * 0.15, px, py, pr);
  g.addColorStop(0, lit);
  g.addColorStop(0.58, mid);
  g.addColorStop(1, dark);
  c.fillStyle = g;
  c.beginPath();
  c.arc(px, py, Math.max(1.8, pr), 0, Math.PI * 2);
  c.fill();
}
function orr3dOrbitData(name, T) {
  var O = ORR3D,
    key = Math.floor((O.jd - 2451545) / 365.25),
    cache = O.orbitCache;
  if (cache.key !== key) {
    cache.key = key;
    cache.data = {};
  }
  if (cache.data[name]) return cache.data[name];
  var P = ORR3D_PLANETS[name],
    a = [];
  for (var i = 0; i <= 112; i++) {
    var tt = T + (P.period * (i / 112)) / 36525;
    a.push(orr3dCompress(asHelio(name, tt)));
  }
  return (cache.data[name] = a);
}
function orr3dGrid() {
  var O = ORR3D,
    c = O.ctx,
    CL = O.cols;
  if (!O.show.grid) return;
  var rings = [70, 120, 180, 240];
  for (var ri = 0; ri < rings.length; ri++) {
    var r = rings[ri],
      pts = [];
    for (var i = 0; i <= 96; i++) {
      var a = (i / 96) * Math.PI * 2;
      pts.push({ x: r * Math.cos(a), y: r * Math.sin(a), z: 0 });
    }
    orr3dPath(pts, "rgba(210,205,190,.11)", 1, null, 1);
  }
  c.save();
  c.strokeStyle = "rgba(210,205,190,.08)";
  c.lineWidth = 1;
  c.beginPath();
  for (var k = 0; k < 12; k++) {
    var a2 = (k / 12) * Math.PI * 2,
      p1 = orr3dProj(45 * Math.cos(a2), 45 * Math.sin(a2), 0),
      p2 = orr3dProj(248 * Math.cos(a2), 248 * Math.sin(a2), 0);
    c.moveTo(p1.x, p1.y);
    c.lineTo(p2.x, p2.y);
  }
  c.stroke();
  c.restore();
}
function orr3dStars() {
  var O = ORR3D,
    c = O.ctx,
    W = O.cw,
    H = O.ch;
  if (!O.stars) {
    O.stars = [];
    for (var i = 0; i < 220; i++)
      O.stars.push([
        Math.random() * W,
        Math.random() * H,
        0.15 + Math.random() * 0.45,
        Math.random() < 0.09 ? 1.6 : 1,
      ]);
  }
  c.save();
  c.fillStyle = "#d9e3f1";
  for (var j = 0; j < O.stars.length; j++) {
    var s = O.stars[j];
    c.globalAlpha = s[2];
    c.fillRect((s[0] / Math.max(1, W)) * W, (s[1] / Math.max(1, H)) * H, s[3], s[3]);
  }
  c.restore();
}

function orr3dSpeedDeg(name) {
  var O = ORR3D,
    T = (O.jd - 2451545) / 36525,
    d = 0.5 / 36525,
    a = asHelio(name, T - d),
    b = asHelio(name, T + d),
    la = norm360(Math.atan2(a.y, a.x) / D2R),
    lb = norm360(Math.atan2(b.y, b.x) / D2R),
    v = ((lb - la + 540) % 360) - 180;
  return v;
}
function orr3dHelioRender() {
  var O = ORR3D,
    svg = document.getElementById("orrHelioSvg"),
    side = document.getElementById("orrHelioInfo");
  if (!svg || !side) return;
  var T = (O.jd - 2451545) / 36525,
    C = 310,
    names = O.show.pluto ? ORR3D_NAMES : ORR3D_NAMES.slice(0, 8),
    zNames = [
      "白羊",
      "金牛",
      "双子",
      "巨蟹",
      "狮子",
      "室女",
      "天秤",
      "天蝎",
      "人马",
      "摩羯",
      "宝瓶",
      "双鱼",
    ];
  function Q(a, r) {
    var x = (a || 0) * D2R;
    return [C + r * Math.cos(x), C - r * Math.sin(x)];
  }
  var s =
    '<rect width="620" height="620" fill="transparent"/><circle cx="' +
    C +
    '" cy="' +
    C +
    '" r="282" class="oh-zring"/>';
  if (O.show.zodiac) {
    for (var k = 0; k < 12; k++) {
      var p1 = Q(k * 30, 264),
        p2 = Q(k * 30, 282),
        pl = Q(k * 30 + 15, 296);
      s +=
        '<line x1="' +
        p1[0].toFixed(1) +
        '" y1="' +
        p1[1].toFixed(1) +
        '" x2="' +
        p2[0].toFixed(1) +
        '" y2="' +
        p2[1].toFixed(1) +
        '" class="oh-zline"/><text x="' +
        pl[0].toFixed(1) +
        '" y="' +
        (pl[1] + 3).toFixed(1) +
        '" class="oh-ztext">' +
        zNames[k] +
        "</text>";
    }
  }
  s +=
    '<line x1="' +
    C +
    '" y1="' +
    C +
    '" x2="592" y2="' +
    C +
    '" class="oh-axis"/><text x="588" y="' +
    (C - 7) +
    '" class="oh-ztext" text-anchor="end">春分点 0°</text>';
  for (var i = 0; i < names.length; i++) {
    var n = names[i],
      h = asHelio(n, T),
      r = Math.hypot(h.x, h.y, h.z),
      rr = orr3dDispR(r),
      lon = norm360(Math.atan2(h.y, h.x) / D2R);
    if (O.show.orbits)
      s += '<circle cx="' + C + '" cy="' + C + '" r="' + rr.toFixed(1) + '" class="oh-orbit"/>';
    var p = Q(lon, rr),
      m = ORR3D_PLANETS[n],
      rad = n === "地球" ? 6.5 : 5.2;
    s +=
      '<g class="oh-p' +
      (n === O.selected ? " sel" : "") +
      '" tabindex="0" data-planet="' +
      n +
      '"><circle cx="' +
      p[0].toFixed(1) +
      '" cy="' +
      p[1].toFixed(1) +
      '" r="' +
      rad +
      '" fill="' +
      m.c1 +
      '"/><text x="' +
      (p[0] + 9).toFixed(1) +
      '" y="' +
      (p[1] - 7).toFixed(1) +
      '">' +
      m.g +
      " " +
      n +
      "</text></g>";
  }
  s +=
    '<circle cx="' +
    C +
    '" cy="' +
    C +
    '" r="10" class="oh-sun"/><text x="' +
    C +
    '" y="' +
    (C + 26) +
    '" class="oh-ztext">☉ 太阳</text>';
  svg.innerHTML = s;
  var h = asHelio(O.selected, T),
    r = Math.hypot(h.x, h.y, h.z),
    lon = norm360(Math.atan2(h.y, h.x) / D2R),
    lat = Math.atan2(h.z, Math.hypot(h.x, h.y)) / D2R,
    m = ORR3D_PLANETS[O.selected],
    spd = orr3dSpeedDeg(O.selected);
  var rows = names
    .map(function (n) {
      var q = asHelio(n, T),
        qr = Math.hypot(q.x, q.y, q.z),
        ql = norm360(Math.atan2(q.y, q.x) / D2R);
      return (
        '<div class="orr-helio-row' +
        (n === O.selected ? " sel" : "") +
        '"><b>' +
        ORR3D_PLANETS[n].g +
        " " +
        n +
        "</b><em>" +
        qr.toFixed(2) +
        " AU</em><span>日心黄经 " +
        ql.toFixed(1) +
        "°</span></div>"
      );
    })
    .join("");
  side.innerHTML =
    "<h4>" +
    m.g +
    " " +
    O.selected +
    ' · 日心参数</h4><div class="orr-helio-kv"><span>模拟时刻</span><b>' +
    orr3dFmt(O.jd) +
    "</b><span>日心黄经</span><b>" +
    lon.toFixed(2) +
    "°</b><span>黄纬</span><b>" +
    lat.toFixed(2) +
    "°</b><span>距日</span><b>" +
    r.toFixed(3) +
    " AU</b><span>角速度</span><b>" +
    spd.toFixed(3) +
    "°/日</b><span>公转周期</span><b>" +
    m.period.toLocaleString("zh-CN", { maximumFractionDigits: 1 }) +
    ' 日</b><span>参考平面</span><b>J2000 黄道面</b><span>黄赤交角</span><b>约 23.44°</b></div><div class="orr-helio-table-title">行星当前日心位置</div><div class="orr-helio-table">' +
    rows +
    "</div>";
}
function orr3dSyncSem() {
  var O = ORR3D;
  if (O.syncLock || O.mode !== "sem" || !document.getElementById("smPanel")) return;
  O.syncLock = true;
  try {
    SM.dt = new Date((O.jd - 2440587.5) * 86400000);
    var di = document.getElementById("smDt");
    if (di) di.value = smFmtLocal(SM.dt);
    var sl = document.getElementById("smSlider");
    if (sl) sl.value = 0;
    var off = document.getElementById("smOff");
    if (off) off.textContent = "+0.0h";
    smUpdate();
  } catch (e) {
    console.error("sun-earth-moon sync", e);
  } finally {
    O.syncLock = false;
  }
}
function orr3dSetMode(mode) {
  var O = ORR3D;
  if (["3d", "helio", "sem"].indexOf(mode) < 0) mode = "3d";
  O.mode = mode;
  document.querySelectorAll("#as-orr3d [data-orr-mode]").forEach(function (b) {
    b.classList.toggle("on", b.dataset.orrMode === mode);
  });
  ["3d", "helio", "sem"].forEach(function (k) {
    var el = document.getElementById(
      "orrMode" + (k === "3d" ? "3d" : k === "helio" ? "Helio" : "Sem"),
    );
    if (el) el.hidden = k !== mode;
  });
  var tg = document.getElementById("orr3dTog");
  if (tg) tg.dataset.mode = mode;
  var hint = document.getElementById("orrModeHint"),
    note = document.getElementById("orrModeNote"),
    focus = document.querySelector("#as-orr3d .orr-focus-wrap"),
    reset = document.getElementById("orr3dReset");
  if (hint)
    hint.textContent =
      mode === "3d"
        ? "拖动旋转 · 滚轮缩放 · 双击复位"
        : mode === "helio"
          ? "滚轮缩放 · 拖动平移 · 双击 / 按钮复位"
          : "日地月 3D：拖动旋转 · 滚轮缩放 · 下方保留天穹 / 月相 / 高度角";
  if (note)
    note.textContent =
      mode === "3d"
        ? "3D 视图采用 J2000 黄道坐标与对数轨道视觉缩放；天体大小为示意。"
        : mode === "helio"
          ? "日心俯视与 3D 使用同一模拟时刻；滚轮可缩放、拖动可平移，双击或“视图复位”恢复初始视野。"
          : "日地月 3D 以地球为中心同时画出黄道面、白道、天赤道、地轴、春分点与日地月连线；下方继续保留原三星天象图解。";
  if (focus) focus.style.display = mode === "sem" ? "none" : "";
  if (reset) {
    reset.style.display = "";
    reset.textContent = "视图复位";
  }
  if (mode === "helio") {
    orr3dHelioRender();
    setTimeout(function () {
      pzScan(document.getElementById("orrModeHelio"));
    }, 0);
  }
  if (mode === "sem") {
    orr3dSyncSem();
    setTimeout(function () {
      try {
        sem3dBind();
        sem3dFit();
        sem3dDraw();
      } catch (e) {
        console.error("sem3d", e);
      }
    }, 0);
  }
  orr3dInfo();
}
function orr3dAxes() {
  var O = ORR3D,
    c = O.ctx;
  if (!O.show.axes) return;
  c.save();
  c.lineWidth = 1;
  c.setLineDash([5, 5]);
  var a = orr3dProj(-260, 0, 0),
    b = orr3dProj(260, 0, 0);
  c.strokeStyle = "rgba(208,80,59,.48)";
  c.beginPath();
  c.moveTo(a.x, a.y);
  c.lineTo(b.x, b.y);
  c.stroke();
  var c1 = orr3dProj(0, -260, 0),
    d = orr3dProj(0, 260, 0);
  c.strokeStyle = "rgba(95,169,234,.38)";
  c.beginPath();
  c.moveTo(c1.x, c1.y);
  c.lineTo(d.x, d.y);
  c.stroke();
  c.restore();
}
function orr3dZodiac() {
  var O = ORR3D,
    c = O.ctx;
  if (!O.show.zodiac) return;
  var names = [
    "白羊",
    "金牛",
    "双子",
    "巨蟹",
    "狮子",
    "室女",
    "天秤",
    "天蝎",
    "人马",
    "摩羯",
    "宝瓶",
    "双鱼",
  ];
  c.save();
  c.font = "10px sans-serif";
  c.textAlign = "center";
  c.fillStyle = "rgba(228,220,198,.62)";
  for (var k = 0; k < 12; k++) {
    var a = (k * 30 + 15) * D2R,
      p = orr3dProj(274 * Math.cos(a), 274 * Math.sin(a), 0);
    c.fillText(names[k], p.x, p.y);
  }
  c.restore();
}
function orr3dDraw() {
  var O = ORR3D,
    c = O.ctx,
    W = O.cw,
    H = O.ch,
    CL = O.cols;
  if (!c) return;
  c.clearRect(0, 0, W, H);
  astroSkyDraw(O, O.jd, {
    stars: O.show.skyStars,
    constell: O.show.skyConst,
    constName: O.show.skyConstName,
    xiu: O.show.skyXiu,
    labels: O.show.skyLabels,
  });
  orr3dGrid();
  orr3dAxes();
  orr3dZodiac();
  var T = (O.jd - 2451545) / 36525,
    names = O.show.pluto ? ORR3D_NAMES : ORR3D_NAMES.slice(0, 8);
  if (O.show.orbits) {
    for (var oi = 0; oi < names.length; oi++) {
      var n = names[oi],
        sel = n === O.selected;
      orr3dPath(
        orr3dOrbitData(n, T),
        sel ? "rgba(228,199,127,.72)" : "rgba(210,205,190,.20)",
        sel ? 1.7 : 1,
        null,
        1,
      );
    }
  }
  var sun = orr3dProj(0, 0, 0),
    gl = c.createRadialGradient(sun.x, sun.y, 5, sun.x, sun.y, 54);
  gl.addColorStop(0, "rgba(255,220,115,.45)");
  gl.addColorStop(1, "rgba(255,200,80,0)");
  c.fillStyle = gl;
  c.beginPath();
  c.arc(sun.x, sun.y, 54, 0, Math.PI * 2);
  c.fill();
  orr3dBall(sun.x, sun.y, 12 * sun.s, "#fff8ce", "#f6cd5b", "#d58d20");
  var list = [];
  for (var i = 0; i < names.length; i++) {
    var name = names[i],
      h = asHelio(name, T),
      r = Math.hypot(h.x, h.y, h.z),
      v = orr3dCompress(h),
      p = orr3dProj(v.x, v.y, v.z);
    list.push({ name: name, h: h, r: r, v: v, p: p, m: ORR3D_PLANETS[name] });
  }
  list.sort(function (a, b) {
    return b.p.depth - a.p.depth;
  });
  O.hits = [];
  for (var pi = 0; pi < list.length; pi++) {
    var q = list[pi],
      rr = q.m.size * Math.max(0.72, Math.min(1.16, q.p.s)),
      selected = q.name === O.selected;
    if (selected) {
      c.save();
      c.strokeStyle = "rgba(246,220,148,.8)";
      c.lineWidth = 1.4;
      c.setLineDash([4, 4]);
      c.beginPath();
      c.arc(q.p.x, q.p.y, rr + 8, 0, Math.PI * 2);
      c.stroke();
      c.restore();
    }
    orr3dBall(q.p.x, q.p.y, rr, "#fff", q.m.c1, q.m.c2);
    if (q.name === "土星") {
      c.save();
      c.strokeStyle = "rgba(236,219,178,.62)";
      c.lineWidth = 1.2;
      c.beginPath();
      c.ellipse(q.p.x, q.p.y, rr * 1.9, rr * 0.56, -0.25, 0, Math.PI * 2);
      c.stroke();
      c.restore();
    }
    if (O.show.labels) {
      c.save();
      c.font = (selected ? "600 " : "") + "11px sans-serif";
      c.textAlign = "center";
      c.fillStyle = selected ? "#f3dc9a" : "#d8d5cc";
      var tn =
        typeof AS_INFO !== "undefined" &&
        AS_INFO[q.name] &&
        AS_INFO[q.name].zh &&
        AS_INFO[q.name].zh !== q.name
          ? " · " + AS_INFO[q.name].zh
          : "";
      c.fillText(q.m.g + " " + q.name + tn, q.p.x, q.p.y - rr - 8);
      c.restore();
    }
    O.hits.push({ name: q.name, x: q.p.x, y: q.p.y, r: Math.max(12, rr + 8) });
  }
  if (O.show.labels) {
    c.save();
    c.font = "11px sans-serif";
    c.textAlign = "center";
    c.fillStyle = "#efd178";
    c.fillText("☉ 太阳", sun.x, sun.y + 30);
    c.restore();
  }
}
function tradAstroPt(r, deg) {
  var a = (deg - 90) * D2R;
  return [r * Math.cos(a), r * Math.sin(a)];
}
function tradAstroRender() {
  var svg = document.getElementById("tradAstroSvg"),
    info = document.getElementById("tradAstroInfo");
  if (!svg || !info || typeof ORR3D === "undefined") return;
  var jd = ORR3D.jd || smJD(new Date()),
    dt = fromJD(jd + 8 / 24),
    year = dt.y,
    pl = asPlanets(jd),
    sun = pl[0],
    moon = pl[1],
    sx = xiuOf(sun.lon, year),
    mx = xiuOf(moon.lon, year),
    ph = asMoonPhase(sun.lon, moon.lon),
    termIdx = Math.floor(norm360(sun.lon) / 15) % 24,
    term = TERMS[termIdx],
    next = TERMS[(termIdx + 1) % 24],
    ci = AS_SIGN[Math.floor(sun.lon / 30) % 12][2],
    mci = AS_SIGN[Math.floor(moon.lon / 30) % 12][2],
    d = jd - 2451543.5,
    node = norm360(125.1228 - 0.0529538083 * d),
    desc = norm360(node + 180),
    tb = xiuTable(year),
    s = "";
  s +=
    '<circle r="268" class="ta-ring"/><circle r="224" class="ta-ring"/><circle r="181" class="ta-ring"/><circle r="135" class="ta-ring"/>';
  for (var i = 0; i < 24; i++) {
    var deg = i * 15,
      p1 = tradAstroPt(224, deg),
      p2 = tradAstroPt(i % 6 === 0 ? 268 : 254, deg),
      pt = tradAstroPt(279, deg);
    s +=
      '<line x1="' +
      p1[0].toFixed(1) +
      '" y1="' +
      p1[1].toFixed(1) +
      '" x2="' +
      p2[0].toFixed(1) +
      '" y2="' +
      p2[1].toFixed(1) +
      '" class="ta-term-line"/>';
    s +=
      '<text x="' +
      pt[0].toFixed(1) +
      '" y="' +
      pt[1].toFixed(1) +
      '" class="ta-term ' +
      (i % 6 === 0 ? "major" : "") +
      '" dominant-baseline="central">' +
      TERMS[i] +
      "</text>";
  }
  for (var xi = 0; xi < tb.length; xi++) {
    var x = tb[xi],
      mid = norm360(x.s + x.w / 2),
      xp = tradAstroPt(205, mid);
    s +=
      '<text x="' +
      xp[0].toFixed(1) +
      '" y="' +
      xp[1].toFixed(1) +
      '" class="ta-xiu" dominant-baseline="central">' +
      x.n +
      "</text>";
  }
  for (var z = 0; z < 12; z++) {
    var zp = tradAstroPt(157, z * 30 + 15);
    s +=
      '<text x="' +
      zp[0].toFixed(1) +
      '" y="' +
      zp[1].toFixed(1) +
      '" class="ta-ci" dominant-baseline="central">' +
      AS_SIGN[z][2] +
      "</text>";
  }
  var sp = tradAstroPt(181, sun.lon),
    mp = tradAstroPt(181, moon.lon);
  s +=
    '<line x1="0" y1="0" x2="' +
    sp[0].toFixed(1) +
    '" y2="' +
    sp[1].toFixed(1) +
    '" class="ta-ray-sun"/><line x1="0" y1="0" x2="' +
    mp[0].toFixed(1) +
    '" y2="' +
    mp[1].toFixed(1) +
    '" class="ta-ray-moon"/><circle cx="' +
    sp[0].toFixed(1) +
    '" cy="' +
    sp[1].toFixed(1) +
    '" r="8" class="ta-sun"/><circle cx="' +
    mp[0].toFixed(1) +
    '" cy="' +
    mp[1].toFixed(1) +
    '" r="7" class="ta-moon"/><text x="' +
    sp[0].toFixed(1) +
    '" y="' +
    (sp[1] - 13).toFixed(1) +
    '" class="ta-ci">日</text><text x="' +
    mp[0].toFixed(1) +
    '" y="' +
    (mp[1] - 12).toFixed(1) +
    '" class="ta-ci">月</text>';
  [node, desc].forEach(function (nd, k) {
    var np = tradAstroPt(135, nd);
    s +=
      '<rect x="' +
      (np[0] - 4).toFixed(1) +
      '" y="' +
      (np[1] - 4).toFixed(1) +
      '" width="8" height="8" transform="rotate(45 ' +
      np[0].toFixed(1) +
      " " +
      np[1].toFixed(1) +
      ')" class="ta-node"/><text x="' +
      np[0].toFixed(1) +
      '" y="' +
      (np[1] - 11).toFixed(1) +
      '" class="ta-xiu">' +
      (k ? "降交" : "升交") +
      "</text>";
  });
  var five = pl.filter(function (p) {
    return ["水星", "金星", "火星", "木星", "土星"].indexOf(p.n) >= 0;
  });
  for (var fp = 0; fp < five.length; fp++) {
    var q = five[fp],
      r = 146 - fp * 5,
      pp = tradAstroPt(r, q.lon),
      col = ["#7db8d8", "#e4c781", "#d7785d", "#7dbb8d", "#c9aa67"][fp];
    s +=
      '<circle cx="' +
      pp[0].toFixed(1) +
      '" cy="' +
      pp[1].toFixed(1) +
      '" r="4" class="ta-planet" fill="' +
      col +
      '"><title>' +
      q.n +
      " " +
      q.lon.toFixed(2) +
      "°</title></circle>";
  }
  svg.innerHTML = s;
  var seven = pl.filter(function (p) {
    return ["太阳", "月亮", "水星", "金星", "火星", "木星", "土星"].indexOf(p.n) >= 0;
  });
  var rows = seven
    .map(function (p) {
      var x = xiuOf(p.lon, year),
        sg = AS_SIGN[Math.floor(p.lon / 30) % 12],
        trad = (AS_INFO[p.n] && AS_INFO[p.n].zh) || p.n;
      return (
        '<div class="ta-seven-row"><b>' +
        p.g +
        " " +
        trad +
        "</b><span>" +
        sg[2] +
        " · " +
        x.n +
        "宿</span><em>" +
        p.lon.toFixed(1) +
        '°</em><em class="' +
        (p.retro ? "retro" : "") +
        '">' +
        (p.retro ? "逆" : "顺") +
        "</em></div>"
      );
    })
    .join("");
  info.innerHTML =
    '<div class="ta-kv"><span>模拟时刻</span><b>' +
    orr3dFmt(jd) +
    "</b><span>当前节气</span><b>" +
    term +
    " → " +
    next +
    "</b><span>太阳</span><b>" +
    ci +
    " · " +
    sx.n +
    "宿 · " +
    sun.lon.toFixed(2) +
    "°</b><span>月亮</span><b>" +
    mci +
    " · " +
    mx.n +
    "宿 · " +
    moon.lon.toFixed(2) +
    "°</b><span>月相</span><b>" +
    ph.name +
    " · 月龄 " +
    ph.age.toFixed(1) +
    "日</b><span>黄白交点</span><b>升交 " +
    node.toFixed(1) +
    "° / 降交 " +
    desc.toFixed(1) +
    '°</b></div><div class="ta-seven">' +
    rows +
    '</div><p class="ta-note">外圈为二十四节气黄经点，中圈按本页宿度表绘二十八宿，内圈为十二次。日月五星位置来自同一模拟时刻。升降交点采用月球轨道平均近似，仅作传统天文与七政研习参照；不同星命体系的宿度、四余和历元口径应分别核对。</p>';
}
function orr3dInfo() {
  var O = ORR3D,
    el = document.getElementById("orr3dInfo");
  if (!el) return;
  try {
    tradAstroRender();
  } catch (e) {
    console.error("trad astro", e);
  }
  if (O.mode === "sem") {
    var dt = new Date((O.jd - 2440587.5) * 86400000),
      jd = O.jd,
      su = smSun(jd),
      mo = smMoon(jd),
      ph = smPhase(mo.lon, su.lon),
      km = mo.dist * 6378.14;
    el.innerHTML =
      "<span><b>与日月天象图解同源联动</b>　共享时刻 <b>" +
      smFmtDT(dt) +
      "</b>　日月距角 <b>" +
      ph.e2.toFixed(1) +
      "°</b>　月相 <b>" +
      ph.name +
      "</b>　受光 <b>" +
      (ph.k * 100).toFixed(1) +
      "%</b></span><span>月地距离约 <b>" +
      Math.round(km).toLocaleString("zh-CN") +
      " km</b></span>";
    return;
  }
  var T = (O.jd - 2451545) / 36525,
    h = asHelio(O.selected, T),
    r = Math.hypot(h.x, h.y, h.z),
    lon = norm360(Math.atan2(h.y, h.x) / D2R),
    lat = Math.atan2(h.z, Math.hypot(h.x, h.y)) / D2R,
    m = ORR3D_PLANETS[O.selected];
  el.innerHTML =
    "<span>模拟时刻 <b>" +
    orr3dFmt(O.jd) +
    '</b>　<span class="planet-focus">' +
    m.g +
    " " +
    O.selected +
    "</span> 日心黄经 <b>" +
    lon.toFixed(1) +
    "°</b>　黄纬 <b>" +
    lat.toFixed(1) +
    "°</b>　距日 <b>" +
    r.toFixed(2) +
    " AU</b></span><span>公转周期约 <b>" +
    m.period.toLocaleString("zh-CN", { maximumFractionDigits: 1 }) +
    " 天</b></span>";
  if (O.mode === "helio") orr3dHelioRender();
}
function orr3dLoop(tok, ts) {
  var O = ORR3D;
  if (tok !== O.token) return;
  requestAnimationFrame(function (t2) {
    orr3dLoop(tok, t2);
  });
  if (!O.visible || O.visHidden || document.hidden) {
    O.last = ts;
    return;
  }
  var step = O.mode === "sem" ? 42 : 33;
  if (O._frameT && ts - O._frameT < step) return;
  O._frameT = ts;
  if (O._faultUntil && ts < O._faultUntil) return;
  try {
    var dt = Math.min(0.12, (ts - O.last) / 1000);
    O.last = ts;
    if (O.playing) {
      O.jd += O.speed * dt;
      var min = jdFromGreg(1800, 1, 1, 0) - 8 / 24,
        max = jdFromGreg(2050, 12, 31, 23, 59) - 8 / 24;
      if (O.jd > max) O.jd = min;
      if (O.jd < min) O.jd = max;
    }
    if (O.autoRot && O.mode === "3d") O.yaw += dt * 0.1;
    if (ts - O.colT > 1800) {
      O.colT = ts;
      orr3dCols();
    }
    if (O.mode === "3d") orr3dDraw();
    else if (O.mode === "sem") sem3dDraw();
    if (ts - O.infoT > 650) {
      O.infoT = ts;
      if (O.mode === "sem" && O.playing) orr3dSyncSem();
      orr3dInfo();
    }
    O._faultN = 0;
  } catch (e) {
    O._faultN = (O._faultN || 0) + 1;
    O._faultUntil = ts + Math.min(3000, 350 * O._faultN);
    visRuntimeReport(O.mode === "sem" ? "日地月3D" : "太阳系3D", e);
  }
}
function bindOrr3d() {
  var cv = document.getElementById("orr3dCv");
  if (!cv || cv.dataset.b3d) return;
  cv.dataset.b3d = "1";
  var O = ORR3D;
  if (O.ro && O.ro.disconnect)
    try {
      O.ro.disconnect();
    } catch (e) {}
  if (O.io && O.io.disconnect)
    try {
      O.io.disconnect();
    } catch (e) {}
  O.cv = cv;
  O.ctx = cv.getContext("2d");
  if (!O.ctx) return;
  O.jd = smJD(new Date());
  O.playing = true;
  O.visHidden = false;
  O.orbitCache = { key: null, data: {} };
  orr3dCols();
  function fit() {
    if (!cv.isConnected) return;
    var r = cv.getBoundingClientRect();
    if (r.width < 10 || !O.ctx) return;
    var nw = r.width,
      nh = Math.round(Math.max(420, Math.min(760, r.width * 0.78))),
      maxPx = 2600000,
      dpr = Math.min(window.devicePixelRatio || 1, 1.65, Math.sqrt(maxPx / Math.max(1, nw * nh)));
    dpr = Math.max(1, dpr);
    var pw = Math.round(nw * dpr),
      ph = Math.round(nh * dpr);
    O.cw = nw;
    O.ch = nh;
    O.focal = Math.max(450, Math.min(860, O.ch * 1.18));
    if (cv.width !== pw) cv.width = pw;
    if (cv.height !== ph) cv.height = ph;
    if (cv.style.height !== O.ch + "px") cv.style.height = O.ch + "px";
    O.ctx = cv.getContext("2d");
    if (!O.ctx) {
      visRuntimeReport("太阳系3D", "Canvas 2D 上下文不可用");
      return;
    }
    O.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    O.stars = null;
    orr3dDraw();
  }
  var scheduleFit = function () {
    if (O._fitRaf) return;
    O._fitRaf = requestAnimationFrame(function () {
      O._fitRaf = 0;
      try {
        fit();
      } catch (e) {
        visRuntimeReport("太阳系3D尺寸", e);
      }
    });
  };
  scheduleFit();
  if (typeof ResizeObserver !== "undefined") {
    O.ro = new ResizeObserver(scheduleFit);
    O.ro.observe(cv.parentElement || cv);
  } else {
    if (O._resizeHandler) window.removeEventListener("resize", O._resizeHandler);
    O._resizeHandler = scheduleFit;
    window.addEventListener("resize", O._resizeHandler, { passive: true });
  }
  cv.style.touchAction = "none";
  var drag = null,
    moved = false,
    holdTimer = 0;
  cv.addEventListener("contextmenu", function (e) {
    e.preventDefault();
  });
  cv.addEventListener("pointerdown", function (e) {
    if (e.button !== 0 && e.button !== 1 && e.button !== 2) return;
    clearTimeout(holdTimer);
    drag = {
      x: e.clientX,
      y: e.clientY,
      sx: e.clientX,
      sy: e.clientY,
      mode: e.shiftKey || e.button === 1 || e.button === 2 ? "pan" : "orbit",
      held: false,
    };
    moved = false;
    if (drag.mode === "orbit" && e.button === 0) {
      holdTimer = setTimeout(function () {
        if (drag && !moved) {
          drag.mode = "pan";
          drag.held = true;
          cv.classList.add("v114-longpan");
        }
      }, 480);
    }
    try {
      cv.setPointerCapture(e.pointerId);
    } catch (err) {}
  });
  cv.addEventListener("pointermove", function (e) {
    if (!drag) return;
    var dx = e.clientX - drag.x,
      dy = e.clientY - drag.y;
    if (Math.abs(e.clientX - drag.sx) + Math.abs(e.clientY - drag.sy) > 3) {
      moved = true;
      if (!drag.held && drag.mode === "orbit") clearTimeout(holdTimer);
    }
    if (drag.mode === "pan") camPan(O, dx, dy);
    else {
      O.yaw += dx * 0.006;
      O.pitch += dy * 0.006;
      O.pitch = Math.max(0.08, Math.min(1.5, O.pitch));
    }
    drag.x = e.clientX;
    drag.y = e.clientY;
    orr3dDraw();
  });
  function end(e) {
    clearTimeout(holdTimer);
    cv.classList.remove("v114-longpan");
    if (drag && !moved) {
      var rect = cv.getBoundingClientRect(),
        x = e.clientX - rect.left,
        y = e.clientY - rect.top,
        best = null,
        bd = 1e9;
      O.hits.forEach(function (h) {
        var d = Math.hypot(x - h.x, y - h.y);
        if (d < h.r && d < bd) {
          best = h;
          bd = d;
        }
      });
      if (best) {
        O.selected = best.name;
        var f = document.getElementById("orr3dFocus");
        if (f) f.value = best.name;
        orr3dInfo();
      }
    }
    drag = null;
  }
  cv.addEventListener("pointerup", end);
  cv.addEventListener("pointercancel", function () {
    clearTimeout(holdTimer);
    cv.classList.remove("v114-longpan");
    drag = null;
  });
  cv.addEventListener(
    "wheel",
    function (e) {
      e.preventDefault();
      camDolly(O, e.deltaY);
      orr3dDraw();
    },
    { passive: false },
  );
  cv.addEventListener("dblclick", function (e) {
    e.preventDefault();
    O.yaw = -0.62;
    O.pitch = 0.82;
    O.dist = 720;
    O.tx = O.ty = O.tz = 0;
    orr3dDraw();
  });
  var play = document.getElementById("orr3dPlay");
  if (play) {
    play.textContent = "⏸ 暂停";
    play.onclick = function () {
      O.playing = !O.playing;
      play.textContent = O.playing ? "⏸ 暂停" : "▶ 播放";
    };
  }
  var spd = document.getElementById("orr3dSpd");
  if (spd)
    spd.onchange = function (e) {
      O.speed = parseFloat(e.target.value) || 7;
    };
  var focus = document.getElementById("orr3dFocus");
  if (focus)
    focus.onchange = function (e) {
      O.selected = e.target.value;
      orr3dInfo();
    };
  var now = document.getElementById("orr3dNow");
  if (now)
    now.onclick = function () {
      O.jd = smJD(new Date());
      O.orbitCache = { key: null, data: {} };
      if (O.mode === "sem") orr3dSyncSem();
      orr3dInfo();
    };
  var reset = document.getElementById("orr3dReset");
  if (reset)
    reset.onclick = function () {
      if (O.mode === "3d") {
        O.yaw = -0.62;
        O.pitch = 0.82;
        O.dist = 720;
        O.tx = O.ty = O.tz = 0;
        orr3dDraw();
      } else if (O.mode === "helio") {
        var h = document.getElementById("orrHelioSvg");
        if (h) pzReset(h);
        orr3dHelioRender();
      } else {
        sem3dReset();
        var d = document.getElementById("smDome"),
          t = document.getElementById("smTop");
        if (d) pzReset(d);
        if (t) pzReset(t);
      }
    };
  document.querySelectorAll("#as-orr3d [data-orr-mode]").forEach(function (b) {
    b.onclick = function () {
      orr3dSetMode(b.dataset.orrMode);
    };
  });
  var hs = document.getElementById("orrHelioSvg");
  if (hs) {
    hs.addEventListener("click", function (e) {
      var g = e.target.closest ? e.target.closest("[data-planet]") : null;
      if (!g) return;
      O.selected = g.dataset.planet;
      if (focus) focus.value = O.selected;
      orr3dHelioRender();
      orr3dInfo();
    });
    hs.addEventListener("keydown", function (e) {
      if (e.key !== "Enter" && e.key !== " ") return;
      var g = e.target.closest ? e.target.closest("[data-planet]") : null;
      if (!g) return;
      e.preventDefault();
      O.selected = g.dataset.planet;
      if (focus) focus.value = O.selected;
      orr3dHelioRender();
      orr3dInfo();
    });
  }
  try {
    sem3dBind();
  } catch (e) {
    console.error("sem3d bind", e);
  }
  var map = {
    grid: "orr3dT_grid",
    orbits: "orr3dT_orb",
    labels: "orr3dT_lb",
    pluto: "orr3dT_pl",
    zodiac: "orr3dT_zd",
    axes: "orr3dT_ax",
    skyStars: "orr3dT_stars",
    skyConst: "orr3dT_const",
    skyConstName: "orr3dT_constName",
    skyXiu: "orr3dT_xiu",
    skyLabels: "orr3dT_starLab",
  };
  Object.keys(map).forEach(function (k) {
    var el = document.getElementById(map[k]);
    if (el) {
      el.checked = !!O.show[k];
      el.onchange = function (e) {
        O.show[k] = e.target.checked;
        if (O.mode === "helio") orr3dHelioRender();
        else if (O.mode === "3d") orr3dDraw();
      };
    }
  });
  var rot = document.getElementById("orr3dT_rot");
  if (rot) {
    rot.checked = O.autoRot;
    rot.onchange = function (e) {
      O.autoRot = e.target.checked;
    };
  }
  if (typeof IntersectionObserver !== "undefined") {
    O.io = new IntersectionObserver(
      function (es) {
        O.visible = es[0] ? es[0].isIntersecting : true;
        if (O.visible && !document.hidden && !O.raf) {
          var tok = O.token;
          O.last = performance.now();
          O.raf = requestAnimationFrame(function (ts) {
            orr3dLoop(tok, ts);
          });
        }
      },
      { threshold: 0.02 },
    );
    O.io.observe(document.getElementById("as-orr3d") || cv);
  } else O.visible = true;
  orr3dSetMode("3d");
  orr3dInfo();
  var tok = ++O.token;
  O.last = performance.now();
  O.raf = requestAnimationFrame(function (ts) {
    orr3dLoop(tok, ts);
  });
}

/* ---------- 接入页面 ---------- */
REF_PANES.jingluo = () => renderJingluo(R);
REF_BIND.jingluo = () => bindJingluo();
REF_PANES.xingkong = () => renderXingkong(R);
REF_BIND.xingkong = () => xkStart();
/* 时令页:追加“时令与你 / 节气命局 / 花信” */
(function () {
  const _rs = renderSeason;
  renderSeason = function () {
    let h = _rs.apply(this, arguments);
    try {
      h +=
        '<span id="sea-person-ph" hidden></span>' +
        seaPersonPanel() +
        '<span id="sea-bazi-ph" hidden></span>' +
        seaBaziPanel() +
        '<span id="sea-huaxin-ph" hidden></span>' +
        seaHuaxinPanel();
    } catch (e) {
      console.error("sea extras", e);
    }
    return h;
  };
})();
/* 此刻页:天人感应卡 */
try {
  NW_CARDS.push({
    id: "nwc-tianren",
    key: (N) =>
      N.dayKey +
      "|" +
      (N.R.astro && N.R.astro.yq ? N.R.astro.yq.step : "") +
      "|" +
      (typeof R !== "undefined" && R && R.bz
        ? R.bz.pill.map((p) => p.s + "," + p.b).join(";")
        : "-"),
    html: nwTianrenCard,
  });
} catch (e) {
  console.error("tianren card", e);
}
/* 天象页:统一太阳系工作台（3D / 日心俯视 / 日地月三星） */
function refDecorate() {
  try {
    const p = $("#pane-astro");
    if (p && !$("#as-orr3d")) {
      p.insertAdjacentHTML("afterbegin", orr3dHTML());
      try {
        bindOrr3d();
      } catch (e) {
        console.error("orr3d", e);
      }
      try {
        bindSunMoon();
      } catch (e) {
        console.error("sm", e);
      }
    }
  } catch (e) {
    console.error("astro ext", e);
  }
  try {
    bornDaysTick();
  } catch (e) {}
}
document.addEventListener(
  "input",
  (e) => {
    if (e.target && e.target.id === "dt") bornDaysTick();
  },
  true,
);
document.addEventListener(
  "change",
  (e) => {
    if (e.target && e.target.id === "dt") setTimeout(bornDaysTick, 50);
  },
  true,
);

/* =====================================================================
   校时对照:同一个钟表时刻,按 标准时 / 平太阳时 / 真太阳时 三种读数各排一次四柱。
   平太阳时 = 标准时 + (经度-120°)×4 分钟;真太阳时 = 平太阳时 + 时差。
   只是把"读数"重排,并不是三个不同的天文瞬间;不覆盖主盘。
   ===================================================================== */
const TS4 = { lon: null, civ: null };
function ts4Civ() {
  const c = R && R.t && R.t.civ;
  return c ? { y: c.y, m: c.m, d: c.d, h: c.h, mi: c.mi, s: 0 } : null;
}
function ts4Calc(civ, lon, gender) {
  const jdCivil = jdFromGreg(civ.y, civ.m, civ.d, civ.h, civ.mi, 0),
    jdUT = jdCivil - 8 / 24,
    eq = eot(jdUT),
    lonMin = (lon - 120) * 4;
  const rows = [
    ["标准时(北京时间)", 0],
    ["平太阳时", lonMin],
    ["真太阳时", lonMin + eq],
  ].map(([name, shift]) => {
    const t = calcTime(civ, { solar: false, lon }),
      jdLoc = jdCivil + shift / 1440;
    const tt = Object.assign({}, t, { shift, jdLoc, loc: fromJD(jdLoc) }),
      bz = calcBazi(tt, gender);
    const loc = tt.loc;
    return {
      name,
      shift,
      read: `${loc.y}-${f2(loc.m)}-${f2(loc.d)} ${f2(loc.h)}:${f2(loc.mi)}`,
      pill: bz.pill.map((p) => GAN[p.s] + ZHI[p.b]),
      hb: bz.pill[3].b,
      db: bz.dayIdx,
      loc,
    };
  });
  return { rows, lonMin, eq };
}
function ts4Margin(loc) {
  // 距最近时辰分界(奇数整点)的分钟数
  const m = loc.h * 60 + loc.mi,
    edges = [];
  for (let h = -1; h <= 25; h += 2) edges.push(h * 60);
  return Math.min(...edges.map((e) => Math.abs(m - e)));
}
function ts4HTML() {
  const civ = ts4Civ();
  if (!civ) return "";
  const lon = isFinite(+R.opt.lon) ? +R.opt.lon : 120;
  let c;
  try {
    c = ts4Calc(civ, lon, R.opt.gender);
  } catch (e) {
    return `<div class="panel blk ts4"><h3 class="sec">校时对照</h3><p class="note bad">计算失败:${esc(e.message)}</p></div>`;
  }
  const [a, b, t] = c.rows,
    sameHour = a.hb === b.hb && b.hb === t.hb,
    sameDay = a.db === b.db && b.db === t.db,
    sameAll = a.pill.join() === b.pill.join() && b.pill.join() === t.pill.join();
  const mg = ts4Margin(t.loc),
    warn = sameAll
      ? `<p class="note ok">三种读数的四柱完全相同,校时不影响这张盘。</p>`
      : `<p class="note bad">三种读数的四柱不完全相同:${sameDay ? "" : "<b>日柱</b>不同(跨了日界)。"}${sameHour ? "" : "<b>时柱</b>不同(跨了时辰界)。"}若出生钟点不能确认到几分钟,建议两种读数都参看,以人生经历校验哪一个更贴切。</p>`;
  return `<div class="panel blk ts4"><h3 class="sec">校时对照 <small class="dim">标准时 · 平太阳时 · 真太阳时</small></h3>
   <div class="kv"><span>出生钟点 <b>${civ.y}-${f2(civ.m)}-${f2(civ.d)} ${f2(civ.h)}:${f2(civ.mi)}</b></span><span>经度 <b>${lon.toFixed(2)}°E</b></span><span>经度修正 <b>${c.lonMin >= 0 ? "+" : ""}${c.lonMin.toFixed(1)} 分</b></span><span>时差 <b>${c.eq >= 0 ? "+" : ""}${c.eq.toFixed(1)} 分</b></span></div>
   <div class="tbl-wrap"><table class="tbl"><thead><tr><th>时间口径</th><th>读数</th><th>年柱</th><th>月柱</th><th>日柱</th><th>时柱</th></tr></thead><tbody>${c.rows.map((r) => `<tr><th>${r.name}</th><td>${r.read}</td>${r.pill.map((x) => `<td>${x}</td>`).join("")}</tr>`).join("")}</tbody></table></div>
   ${warn}
   <p class="note">真太阳时读数距最近的时辰分界约 <b>${mg}</b> 分钟${mg <= 20 ? ",属于<b>临界</b>,出生钟点差几分钟就可能换时柱" : ""}。</p>
   <p class="note">说明:这只是把同一个钟点按三种读数各重排一次四柱,<b>不是三个不同的天文瞬间</b>;页面顶部「真太阳时校正」勾选与否决定主盘用哪一种,本表不覆盖主盘。年、月柱按节令切换,在节气交接前后也可能随读数改变。</p></div>`;
}
(function () {
  const _td = toolsDecorate;
  toolsDecorate = function () {
    _td.apply(this, arguments);
    try {
      const bz = $("#pane-bazi");
      if (bz && R && R.t) {
        const old = bz.querySelector(".ts4"),
          h = ts4HTML();
        if (old) old.outerHTML = h;
        else if (h) bz.insertAdjacentHTML("beforeend", h);
      }
    } catch (e) {
      console.error("ts4", e);
    }
  };
})();

/* =====================================================================
   盘页:年度神煞方位(sha) · 犯太岁(taisui) · 吉方共识(jifang) · 综合罗盘(luopan)
   所有“说明”均为传统说法的概括,不构成决策建议。
   ===================================================================== */
const P5 = {
  year: null,
  sub: { sansha: 1, taisui: 1, suide: 1, wuhuang: 1, sui12: 0 },
  birthMode: "ritual",
  manualBZ: "",
  jf: { src: "R", gender: "M", by: 1990, time: "now" },
  lp: { deg: 180, tol: 3, kw: 1.5, showYY: 1, showKW: 1, ju: "水", yuan: 1 },
};
const P5_TONE = { ji: "吉", xiong: "凶", zhong: "平" };
function p5Pt(r, deg) {
  const a = (deg * Math.PI) / 180;
  return [r * Math.sin(a), -r * Math.cos(a)];
}
function p5Arc(r0, r1, a0, a1) {
  const [x0, y0] = p5Pt(r1, a0),
    [x1, y1] = p5Pt(r1, a1),
    [x2, y2] = p5Pt(r0, a1),
    [x3, y3] = p5Pt(r0, a0),
    lg = (((a1 - a0) % 360) + 360) % 360 > 180 ? 1 : 0;
  return `M${x0.toFixed(2)},${y0.toFixed(2)}A${r1},${r1} 0 ${lg} 1 ${x1.toFixed(2)},${y1.toFixed(2)}L${x2.toFixed(2)},${y2.toFixed(2)}A${r0},${r0} 0 ${lg} 0 ${x3.toFixed(2)},${y3.toFixed(2)}Z`;
}
function p5T(r, deg, txt, size, cls) {
  const [x, y] = p5Pt(r, deg);
  return `<text x="${x.toFixed(2)}" y="${y.toFixed(2)}" font-size="${size}" class="${cls || ""}" text-anchor="middle" dominant-baseline="central">${txt}</text>`;
}
function p5Ticks(r0) {
  let s = "";
  for (let d = 0; d < 360; d += 5) {
    const big = d % 45 === 0,
      mid = d % 15 === 0,
      [x0, y0] = p5Pt(r0, d),
      [x1, y1] = p5Pt(r0 + (big ? 10 : mid ? 7 : 4), d);
    s += `<line x1="${x0.toFixed(1)}" y1="${y0.toFixed(1)}" x2="${x1.toFixed(1)}" y2="${y1.toFixed(1)}" class="p5-tk${big ? " b" : ""}"/>`;
  }
  return s;
}
function p5NowYear() {
  try {
    const n = nowBJ(),
      r = computeAll(
        { y: n.y, m: n.m, d: n.d, h: n.h, mi: n.mi, s: 0 },
        { gender: "M", solar: false, lon: 120, lat: 24.5 },
      );
    return r.bz.yearNum;
  } catch (e) {
    return nowBJ().y;
  }
}
function p5YouNian(gua) {
  const d = P5_D8.find((x) => x[1] === gua);
  if (!d) return null;
  const s = HouseCore.validate({
      bearing: (d[2] + 180) % 360,
      width: 8,
      depth: 10,
      doorSide: "bottom",
      doorPosition: 0.5,
      shape: "regular",
      layer: "bazhai",
      markers: [],
    }),
    bz = HouseCore.bazhai(s);
  return bz.cells.map((c) => ({ name: c.name, dir: (P5_D8.find((x) => x[1] === c.gua) || [])[0] }));
}
const P5_NOTE =
  '<p class="note">本页所有“吉凶、宜忌”均为传统民俗说法的概括,各流派口径不一,仅作文化参考,不构成决策或医疗、法律、财务建议。</p>';
function p5Audit(items) {
  return `<details class="p5-aud"><summary>推演依据与口径(点开可核对)</summary><ul>${items.map((x) => `<li>${x}</li>`).join("")}</ul></details>`;
}
const P5_STAR_C = {
  1: "#5aa6c8",
  2: "#8a6a3a",
  3: "#4fae8f",
  4: "#4fae8f",
  5: "#c8452e",
  6: "#d4b45a",
  7: "#c8452e",
  8: "#d4b45a",
  9: "#b04ad0",
};

/* ================= 年度神煞方位盘 ================= */
function p5ShaSVG(S, sub, person) {
  let g = `<g>${p5Ticks(288)}`;
  // 24山
  P5_N24.forEach((m) => {
    const a0 = m.c - 7.5,
      a1 = m.c + 7.5;
    g += `<path d="${p5Arc(238, 286, a0, a1)}" class="p5-m ${m.yuan === "天元" ? "t" : m.yuan === "地元" ? "d" : "r"}"><title>${m.n}山 ${m.yuan} ${m.yy ? "阳" : "阴"} · ${m.gua}卦</title></path>${p5T(262, m.c, m.n, 17, "p5-ml")}`;
  });
  // 12支
  for (let z = 0; z < 12; z++) {
    const c = z * 30;
    g += `<path d="${p5Arc(204, 236, c - 15, c + 15)}" class="p5-z${person != null && person === z ? " me" : ""}"/>${p5T(224, c, ZHI[z], 15, "p5-zl")}${p5T(210, c, P5_SHENG[z], 8, "p5-sh")}`;
  }
  // 八方/八卦
  P5_D8.forEach(([n, gua, d]) => {
    g += `<path d="${p5Arc(168, 202, d - 22.5, d + 22.5)}" class="p5-g"/>${p5T(192, d, gua, 14, "p5-gl")}${p5T(176, d, n, 9, "p5-sh")}`;
  });
  // 三煞带
  if (sub.sansha) {
    const [a0, a1] = S.sansha.arc;
    g += `<path d="${p5Arc(238, 286, a0, a1)}" class="p5-sansha"><title>三煞(${S.sansha.dir}方):${S.sansha.items.map((i) => i.n + i.zhi).join(" ")}</title></path>`;
    S.sansha.items.forEach((it) => {
      g += p5T(301, it.deg, "煞", 10, "p5-ml bad");
    });
  }
  // 十二岁神
  if (sub.sui12)
    S.sui12.forEach((x) => {
      g += p5T(
        314,
        x.deg,
        x.n,
        9,
        "p5-s12l " + (x.t === "吉" ? "ji" : x.t === "凶" ? "xiong" : "zhong"),
      );
    });
  // 太岁/岁破
  if (sub.taisui) {
    const [tx, ty] = p5Pt(262, S.taisui.deg),
      [px, py] = p5Pt(262, (S.taisui.deg + 180) % 360);
    g += `<circle cx="${tx}" cy="${ty}" r="14" class="p5-ts"/>${p5T(262, S.taisui.deg, "岁", 11, "p5-tsl")}<circle cx="${px}" cy="${py}" r="14" class="p5-sp"/>${p5T(262, (S.taisui.deg + 180) % 360, "破", 11, "p5-tsl")}`;
  }
  // 岁德
  if (sub.suide) {
    [
      ["德", S.suide],
      ["合", S.suideHe],
    ].forEach(([t, x]) => {
      if (x.deg != null) {
        const [sx, sy] = p5Pt(262, x.deg);
        g += `<rect x="${sx - 9}" y="${sy - 9}" width="18" height="18" transform="rotate(45 ${sx} ${sy})" class="p5-sd${t === "合" ? " he" : ""}"/>${p5T(262, x.deg, t, 10, "p5-tsl")}`;
      }
    });
  }
  // 中宫九宫飞星
  const layout = {
      4: [-1, -1],
      9: [0, -1],
      2: [1, -1],
      3: [-1, 0],
      5: [0, 0],
      7: [1, 0],
      8: [-1, 1],
      1: [0, 1],
      6: [1, 1],
    },
    pal = { 4: "巽", 9: "离", 2: "坤", 3: "震", 5: "中", 7: "兑", 8: "艮", 1: "坎", 6: "乾" };
  for (const p in layout) {
    const st = S.fly[p],
      [cx, cy] = layout[p],
      x = cx * 50,
      y = cy * 50;
    const hl = (sub.wuhuang && st === 5) || (sub.wuhuang && st === 2);
    g += `<rect x="${x - 24}" y="${y - 24}" width="48" height="48" class="p5-fl${hl ? " hot" : ""}"/><text x="${x}" y="${y + 2}" text-anchor="middle" dominant-baseline="central" font-size="26" fill="${P5_STAR_C[st]}" class="p5-fn">${st}</text><text x="${x - 18}" y="${y - 14}" font-size="8" class="p5-sh">${pal[p]}</text>${st === 5 ? `<text x="${x + 13}" y="${y - 14}" font-size="9" class="p5-bad">黄</text>` : ""}${st === 2 ? `<text x="${x + 13}" y="${y - 14}" font-size="9" class="p5-bad">黑</text>` : ""}`;
  }
  return `<svg id="shSvg" viewBox="-335 -335 670 670" role="img" aria-label="${S.gz}年神煞方位盘">${g}</g></svg>`;
}
function p5ShaPage() {
  const Y = P5.year || (P5.year = p5NowYear()),
    S = p5YearSha(Y),
    sub = P5.sub;
  const person = R && R.bz ? R.bz.pill[0].b : null;
  const dirTxt = (d) => `${d[0]}(${d[1]})`;
  const rows = [
    [
      "太岁",
      `${S.zhi}山 · ${dirTxt(S.taisui.dir)}`,
      "吉凶参半",
      "值年之神。传统说“太岁头上不可动土”,多指该方位避免大兴土木、重大改动。",
    ],
    [
      "岁破",
      `${S.suipo.zhi}山 · ${dirTxt(S.suipo.dir)}`,
      "凶",
      "与太岁正冲的方位,传统视为破坏力最强,忌动土、起造、迁入大件。",
    ],
    ...S.sansha.items.map((i) => [
      i.n,
      `${i.zhi}山 · ${dirTxt(i.dir)}`,
      "凶",
      `三煞(${S.sansha.ju}局年,煞${S.sansha.dir}方)之一。三煞合称“劫、灾、岁”,传统忌该方位动土、安床。`,
    ]),
    [
      "岁德",
      S.suide.deg == null
        ? `${S.suide.stem}(中宫,无定方)`
        : `${S.suide.stem}山 · ${dirTxt(p5Dir8(S.suide.deg))}`,
      "吉",
      "岁之福德所在,传统视为该年吉方之一。",
    ],
    [
      "岁德合",
      S.suideHe.deg == null
        ? `${S.suideHe.stem}(中宫,无定方)`
        : `${S.suideHe.stem}山 · ${dirTxt(p5Dir8(S.suideHe.deg))}`,
      "吉",
      "与岁德天干相合之位,辅助吉方。",
    ],
    [
      "五黄",
      `${S.wuhuang.dir}(${S.wuhuang.gua})宫`,
      "凶",
      "玄空流年飞星中的五黄正关煞,传统忌动、宜静。",
    ],
    [
      "暗剑",
      S.anjian.dir ? `${S.anjian.dir}方(五黄对宫)` : "—",
      "凶",
      "气学所说的“暗剑煞”,与五黄正对。",
    ],
    ["二黑", `${S.erhei.dir}(${S.erhei.gua})宫`, "凶", "二黑病符星,传统主疾病,宜静不宜动。"],
  ];
  const tone = { 吉: "ji", 凶: "xiong", 吉凶参半: "zhong" };
  let h = `<div class="panel blk p5"><h3 class="sec">年度神煞方位盘 <small class="dim">太岁 · 岁破 · 三煞 · 岁德 · 五黄二黑 · 十二岁神</small></h3>
  <div class="p5-ctl"><label>流年(立春为界) <input type="number" id="shY" min="1901" max="2099" value="${Y}"></label><button class="gbtn sm" id="shP">‹ 上一年</button><button class="gbtn sm" id="shN">下一年 ›</button><button class="gbtn sm" id="shT">今年</button>
   <span class="p5-lay">${[
     ["sansha", "三煞"],
     ["taisui", "太岁岁破"],
     ["suide", "岁德"],
     ["wuhuang", "五黄二黑"],
     ["sui12", "十二岁神"],
   ]
     .map(
       ([k, n]) =>
         `<label class="chk"><input type="checkbox" data-sub="${k}"${sub[k] ? " checked" : ""}> ${n}</label>`,
     )
     .join("")}</span></div>
  <div class="kv"><span>${Y}年 <b class="gold">${S.gz}</b>(${S.sheng}年)</span><span>三合局 <b>${S.ju}局</b></span><span>中宫飞星 <b>${S.center}</b></span><span>本命生肖 <b>${person != null ? P5_SHENG[person] + "(" + ZHI[person] + ")" : "未载入命主"}</b></span></div>
  <div class="p5-wrap"><div class="p5-fig">${p5ShaSVG(S, sub, person)}</div><div class="p5-side">
   <div class="tbl-wrap"><table class="tbl"><thead><tr><th>神煞</th><th>方位</th><th>性质</th><th>传统说法</th></tr></thead><tbody>${rows.map((r) => `<tr><th>${r[0]}</th><td>${r[1]}</td><td class="p5-${tone[r[2]]}">${r[2]}</td><td class="dim sm">${r[3]}</td></tr>`).join("")}</tbody></table></div>
   ${sub.sui12 ? `<div class="p5-s12">${S.sui12.map((x) => `<span class="pill ${x.t === "吉" ? "g" : x.t === "凶" ? "r" : ""}">${x.n} ${x.zhi}(${x.dir[0]})</span>`).join("")}</div><p class="note">十二岁神自岁支顺行:岁建、晦气、丧门、贯索、官符、小耗、大耗、龙德、白虎、天德、吊客、病符。吉凶标注为传统归类。</p>` : ""}
   ${
     person != null
       ? `<p class="note">你的生肖${P5_SHENG[person]}(${ZHI[person]})在${Y}年:${
           p5Fan(S.zi, person)
             .map((r) => r.n)
             .join("、") || "与太岁无冲刑破害合关系"
         }。详见「犯太岁盘」。</p>`
       : ""
   }
  </div></div>${P5_NOTE}
  ${p5Audit(["太岁=岁支所在山;岁破=对冲之山。", "三煞按三合局:申子辰煞南(巳午未)、亥卯未煞西(申酉戌)、寅午戌煞北(亥子丑)、巳酉丑煞东(寅卯辰),依次为劫煞、灾煞、岁煞。", "岁德:阳干取本干,阴干取阳(乙→庚、丁→壬、己→甲、辛→丙、癸→戊);岁德合取其五合天干。戊、己属中宫,无定方。", "年飞星:中宫星=11−(年数除9的余数),洛书顺飞;校验:1901–2099 共 199 年与 lunar-javascript 一致。", "十二岁神:校验:6 个流年 72 项与 iztro 一致。", "太岁方位:与 lunar-javascript 对拍,仅戌、亥两年支不同(该库把戌亥记为坎,此处按24山取乾),已确认以24山为准。", "“年”以立春为界,本页不按春节换年。"])}</div>`;
  return h;
}
function p5ShaBind() {
  const go = (y) => {
    P5.year = Math.max(1901, Math.min(2099, y));
    refRender("sha");
  };
  const e = $("#shY");
  if (!e) return;
  e.onchange = () => go(parseInt(e.value) || p5NowYear());
  $("#shP").onclick = () => go(P5.year - 1);
  $("#shN").onclick = () => go(P5.year + 1);
  $("#shT").onclick = () => go(p5NowYear());
  $$("[data-sub]", $("#pane-sha")).forEach(
    (c) =>
      (c.onchange = () => {
        P5.sub[c.dataset.sub] = c.checked ? 1 : 0;
        refRender("sha");
      }),
  );
}

/* ================= 犯太岁盘 ================= */
function p5BirthBranch() {
  // 返回 {zi, note}
  if (P5.birthMode === "manual" && P5.manualBZ !== "")
    return { zi: +P5.manualBZ, note: "手动选择生肖" };
  if (!R || !R.bz) return null;
  const ritual = R.bz.pill[0].b;
  let ly = null;
  try {
    ly = ((R.lunar.y || R.lunar.year || R.lunarYear) - 4 + 1200) % 12;
  } catch (e) {}
  if (P5.birthMode === "spring" && ly != null && !isNaN(ly))
    return { zi: ly, note: "按农历正月初一(春节)换生肖" };
  return {
    zi: ritual,
    note: "按立春换年(与八字年柱一致)",
    alt: ly != null && !isNaN(ly) && ly !== ritual ? ly : null,
  };
}
function p5TaisuiPage() {
  const Y = P5.year || (P5.year = p5NowYear()),
    zi = (((Y - 4) % 12) + 12) % 12,
    bb = p5BirthBranch(),
    tone = { ji: "g", xiong: "r" };
  const cell = (b) => {
    const rel = p5Fan(zi, b);
    return `<div class="p5-ts-c${bb && bb.zi === b ? " me" : ""}"><b>${P5_SHENG[b]}<small>${ZHI[b]}</small></b><div>${rel.length ? rel.map((r) => `<span class="pill ${tone[r.tone] || ""}">${r.k}</span>`).join("") : '<span class="dim sm">—</span>'}</div></div>`;
  };
  let h = `<div class="panel blk p5"><h3 class="sec">犯太岁盘 <small class="dim">值 · 冲 · 刑 · 破 · 害 · 合</small></h3>
   <div class="p5-ctl"><label>流年(立春为界) <input type="number" id="tsY" min="1901" max="2099" value="${Y}"></label><button class="gbtn sm" id="tsP">‹</button><button class="gbtn sm" id="tsN">›</button><button class="gbtn sm" id="tsT">今年</button>
   <label>生肖来源 <select id="tsBM"><option value="ritual"${P5.birthMode === "ritual" ? " selected" : ""}>命主 · 立春换年</option><option value="spring"${P5.birthMode === "spring" ? " selected" : ""}>命主 · 春节换年</option><option value="manual"${P5.birthMode === "manual" ? " selected" : ""}>手动选择</option></select></label>
   <label>生肖 <select id="tsMB">${ZHI.map((z, i) => `<option value="${i}"${String(P5.manualBZ) === String(i) ? " selected" : ""}>${P5_SHENG[i]}(${z})</option>`).join("")}</select></label></div>
   <div class="kv"><span>${Y}年 <b class="gold">${GAN[(((Y - 4) % 10) + 10) % 10]}${ZHI[zi]}</b>(${P5_SHENG[zi]}年)</span>${bb ? `<span>你的生肖 <b>${P5_SHENG[bb.zi]}</b></span><span class="dim sm">${bb.note}${bb.alt != null ? `;若按春节则为${P5_SHENG[bb.alt]}` : ""}</span>` : '<span class="dim">未载入命主,请手动选择生肖</span>'}</div>
   <div class="p5-ts-grid">${Array.from({ length: 12 }, (_, b) => cell(b)).join("")}</div>`;
  if (bb) {
    const rows = Array.from({ length: 12 }, (_, i) => {
      const y = Y + i,
        z = (((y - 4) % 12) + 12) % 12,
        rel = p5Fan(z, bb.zi);
      return `<tr class="${i === 0 ? "on" : ""}"><th>${y}</th><td>${GAN[(((y - 4) % 10) + 10) % 10]}${ZHI[z]}</td><td>${P5_SHENG[z]}</td><td>${rel.length ? rel.map((r) => `<span class="pill ${tone[r.tone] || ""}">${r.n}</span>`).join(" ") : '<span class="dim sm">—</span>'}</td></tr>`;
    }).join("");
    h += `<h4 class="gl" style="margin-top:12px">${P5_SHENG[bb.zi]}年生人 · 未来 12 年</h4><div class="tbl-wrap"><table class="tbl"><thead><tr><th>年份</th><th>干支</th><th>太岁</th><th>与你的关系</th></tr></thead><tbody>${rows}</tbody></table></div>`;
  }
  h += `<p class="note">“犯太岁”的说法:值太岁(本命年)、冲、刑、破、害为“犯”;六合、三合为“合”,传统认为合则缓和。民间有佩戴、祈福、避忌等做法,属民俗文化,本站不作吉凶断言。</p>${P5_NOTE}
   ${p5Audit(["冲:相隔六位(子午、丑未……)。六合:子丑、寅亥、卯戌、辰酉、巳申、午未。三合:申子辰、寅午戌、巳酉丑、亥卯未。", "刑:子卯相刑;寅巳申、丑戌未为三刑(任意两支同现);辰午酉亥自刑(仅同支)。破:子酉、丑辰、寅亥、卯午、巳申、未戌。害:子未、丑午、寅巳、卯辰、申亥、酉戌。", "校验:冲、六合与 lunar-javascript 一致;刑破害为通行表,各派略有出入。", "生肖来源:八字以立春换年,民间多以春节换生肖,两者在立春~春节之间出生的人会不同,页面上并列给出。"])}</div>`;
  return h;
}
function p5TaisuiBind() {
  const go = (y) => {
    P5.year = Math.max(1901, Math.min(2099, y));
    refRender("taisui");
  };
  const e = $("#tsY");
  if (!e) return;
  e.onchange = () => go(parseInt(e.value) || p5NowYear());
  $("#tsP").onclick = () => go(P5.year - 1);
  $("#tsN").onclick = () => go(P5.year + 1);
  $("#tsT").onclick = () => go(p5NowYear());
  $("#tsBM").onchange = (ev) => {
    P5.birthMode = ev.target.value;
    if (P5.birthMode === "manual" && P5.manualBZ === "") P5.manualBZ = 0;
    refRender("taisui");
  };
  $("#tsMB").onchange = (ev) => {
    P5.manualBZ = ev.target.value;
    P5.birthMode = "manual";
    refRender("taisui");
  };
}

/* ================= 吉方共识盘 ================= */
function p5JifangPage() {
  const jf = P5.jf,
    Y = P5.year || (P5.year = p5NowYear());
  let chart = R,
    tlabel = "当前排盘时刻";
  if (jf.time === "now") {
    try {
      const n = nowBJ();
      chart = compute({ y: n.y, m: n.m, d: n.d, h: n.h, mi: n.mi, s: 0 });
      tlabel = "此刻 " + f2(n.h) + ":" + f2(n.mi);
    } catch (e) {}
  }
  const yr = chart && chart.bz ? chart.bz.yearNum : Y;
  let gender = null,
    by = null;
  if (jf.src === "R" && R && R.bz) {
    gender = R.opt.gender;
    by = R.bz.yearNum;
  } else if (jf.src === "manual") {
    gender = jf.gender;
    by = +jf.by;
  }
  const D = p5Directions(chart, yr, gender, by, p5YouNian),
    mg = gender && by ? p5Minggua(by, gender) : null;
  const cols = D.dirs;
  const toneCls = { ji: "ji", xiong: "xiong", zhong: "zhong" };
  const rowSys = ["奇门", "玄空流年", "气学", "太岁三煞", "八宅命卦"];
  const cellHTML = (d, sys) => {
    const es = d.ev.filter((e) => e.sys === sys);
    if (!es.length) return '<td class="dim">—</td>';
    return `<td>${es.map((e) => `<span class="p5-ev ${toneCls[e.tone]}">${P5_TONE[e.tone]}</span> ${e.text}${e.sub ? ` <small class="dim">${e.sub}</small>` : ""}`).join("<br>")}</td>`;
  };
  // 极坐标八方示意
  let svg = '<svg id="jfSvg" viewBox="-200 -200 400 400" role="img" aria-label="八方吉凶证据并列">';
  cols.forEach((d) => {
    const a0 = d.deg - 22.5,
      a1 = d.deg + 22.5,
      tot = d.ji - d.xiong,
      cls = d.ji && !d.xiong ? "ji" : d.xiong && !d.ji ? "xiong" : d.ji && d.xiong ? "mix" : "none";
    svg += `<path d="${p5Arc(40, 190, a0, a1)}" class="p5-jf ${cls}"><title>${d.n}(${d.gua}): 吉 ${d.ji} · 凶 ${d.xiong}</title></path>${p5T(165, d.deg, d.n, 15, "p5-gl")}${p5T(148, d.deg, d.gua, 10, "p5-sh")}`;
    d.ev.slice(0, 8).forEach((e, i) => {
      const [x, y] = p5Pt(128 - i * 12, d.deg - 12 + (i % 2) * 24);
      svg += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="4.2" class="p5-dot ${e.tone}"><title>${e.sys}:${e.text}</title></circle>`;
    });
    svg += p5T(70, d.deg, `${d.ji}/${d.xiong}`, 11, "p5-cnt");
  });
  svg += `<circle r="38" class="p5-ctr"/>${p5T(-4, 0, String(yr), 12, "p5-gl")}${p5T(12, 0, "吉/凶", 9, "p5-sh")}</svg>`;
  return `<div class="panel blk p5"><h3 class="sec">吉方共识盘 <small class="dim">八个方位 · 多体系证据并列 · 不加总</small></h3>
   <div class="p5-ctl"><label>奇门取时 <select id="jfT"><option value="now"${jf.time === "now" ? " selected" : ""}>此刻</option><option value="chart"${jf.time === "chart" ? " selected" : ""}>当前排盘时刻</option></select></label>
   <label>命卦来源 <select id="jfS"><option value="R"${jf.src === "R" ? " selected" : ""}>当前命主</option><option value="manual"${jf.src === "manual" ? " selected" : ""}>手动输入</option><option value="none"${jf.src === "none" ? " selected" : ""}>不用命卦</option></select></label>
   <label>性别 <select id="jfG"><option value="M"${jf.gender === "M" ? " selected" : ""}>男</option><option value="F"${jf.gender === "F" ? " selected" : ""}>女</option></select></label><label>出生年(立春) <input type="number" id="jfB" min="1901" max="2099" value="${jf.by}"></label></div>
   <div class="kv"><span>奇门:<b>${tlabel}</b></span><span>流年:<b>${GAN[(((yr - 4) % 10) + 10) % 10]}${ZHI[(((yr - 4) % 12) + 12) % 12]}(${yr})</b></span>${mg ? `<span>命卦:<b>${mg.gua}(${mg.n})</b> · ${mg.east ? "东四命" : "西四命"}</span>` : '<span class="dim">未使用命卦</span>'}</div>
   <div class="p5-wrap"><div class="p5-fig p5-fig-s">${svg}</div><div class="p5-side"><p class="note" style="margin-top:0">颜色只表示该方位上“吉”“凶”证据的并存情况:绿=只有吉、红=只有凶、金=吉凶并存、灰=无证据。<b>数字是证据条数,不是评分</b>,不同体系的吉凶口径不同、分歧是常态。</p></div></div>
   <div class="tbl-wrap"><table class="tbl p5-jt"><thead><tr><th></th>${cols.map((d) => `<th>${d.n}<small>${d.gua}</small></th>`).join("")}</tr></thead><tbody>${rowSys.map((s) => `<tr><th>${s}</th>${cols.map((d) => cellHTML(d, s)).join("")}</tr>`).join("")}<tr class="tot"><th>吉/凶条数</th>${cols.map((d) => `<td><b class="p5-ji">${d.ji}</b> / <b class="p5-xx">${d.xiong}</b></td>`).join("")}</tr></tbody></table></div>
   ${P5_NOTE}${p5Audit(["奇门:取所选时刻的时家转盘(拆补法),门吉凶:开休生吉、景杜平、伤惊死凶;星吉凶:辅心禽冲任吉、蓬芮柱英凶。", "玄空流年:年中宫星按洛书顺飞,吉凶按通行分类(一四六八九吉,二三五七凶,与 lunar-javascript 一致)。", "气学:五黄煞、暗剑煞。太岁三煞:见「年度神煞方位盘」,传统忌动土而非不能前往。", "八宅命卦:男 11−年数除9的余数,女 +4,五寄(男坤、女艮);东四命吉方:生气、延年、天医、伏位;游年按《八宅明镜》表(已对拍坎宅)。", "不同体系对“吉”的含义不同:八宅看居住,奇门看事机,玄空看流年场。并列呈现,是为了让分歧可见,而不是求一个答案。"])}</div>`;
}
function p5JifangBind() {
  const jf = P5.jf,
    re = () => refRender("jifang");
  $("#jfT").onchange = (e) => {
    jf.time = e.target.value;
    re();
  };
  $("#jfS").onchange = (e) => {
    jf.src = e.target.value;
    re();
  };
  $("#jfG").onchange = (e) => {
    jf.gender = e.target.value;
    jf.src = "manual";
    re();
  };
  $("#jfB").onchange = (e) => {
    jf.by = +e.target.value || 1990;
    jf.src = "manual";
    re();
  };
}

/* ================= 综合罗盘 ================= */
function p5LuopanSVG(L) {
  const f = p5Facing(L.deg, L.tol),
    ju = p5ChangSheng(L.ju);
  let g = p5Ticks(296);
  for (let d = 0; d < 360; d += 30) g += p5T(318, d, d, 9, "p5-sh");
  P5_N24.forEach((m) => {
    const cur = m === f.mtn;
    g += `<path d="${p5Arc(240, 292, m.c - 7.5, m.c + 7.5)}" class="p5-m ${m.yuan === "天元" ? "t" : m.yuan === "地元" ? "d" : "r"}${cur ? " cur" : ""}" data-m="${m.n}"><title>${m.n}山 ${m.c}° · ${m.yuan} · ${m.yy ? "阳" : "阴"} · ${m.gua}卦</title></path>${p5T(266, m.c, m.n, 17, "p5-ml")}`;
    if (L.showYY)
      g += `<circle cx="${p5Pt(226, m.c)[0].toFixed(1)}" cy="${p5Pt(226, m.c)[1].toFixed(1)}" r="5" class="p5-yy ${m.yy ? "yang" : "yin"}"/>`;
  });
  for (let z = 0; z < 12; z++) {
    const c = z * 30;
    g += `<path d="${p5Arc(180, 214, c - 15, c + 15)}" class="p5-z"/>${p5T(200, c, ZHI[z], 14, "p5-zl")}${p5T(186, c, P5_SHENG[z], 8, "p5-sh")}`;
  }
  P5_D8.forEach(([n, gua, d]) => {
    g += `<path d="${p5Arc(140, 178, d - 22.5, d + 22.5)}" class="p5-g"/>${p5T(164, d, gua, 14, "p5-gl")}${p5T(148, d, n, 9, "p5-sh")}`;
  });
  const LS = { 坎: 1, 坤: 2, 震: 3, 巽: 4, 乾: 6, 兑: 7, 艮: 8, 离: 9 };
  P5_D8.forEach(([n, gua, d]) => {
    g += `<path d="${p5Arc(108, 138, d - 22.5, d + 22.5)}" class="p5-ls"/>${p5T(123, d, LS[gua], 15, "p5-fn")}`;
  });
  if (L.yuan) {
    for (let z = 0; z < 12; z++) {
      const c = z * 30;
      g += `<path d="${p5Arc(76, 106, c - 15, c + 15)}" class="p5-cs${ju[z] === "长生" ? " on" : ""}"/>${p5T(91, c, ju[z], 9, "p5-sh")}`;
    }
  }
  if (L.showKW) {
    for (let k = 0; k < 8; k++) {
      const a = 22.5 + 45 * k,
        [x0, y0] = p5Pt(108, a),
        [x1, y1] = p5Pt(292, a);
      g += `<line x1="${x0}" y1="${y0}" x2="${x1}" y2="${y1}" class="p5-kw big"/>`;
    }
    for (let k = 0; k < 24; k++) {
      if (k % 3 === 1) continue;
      const a = 7.5 + 15 * k,
        [x0, y0] = p5Pt(240, a),
        [x1, y1] = p5Pt(292, a);
      g += `<line x1="${x0}" y1="${y0}" x2="${x1}" y2="${y1}" class="p5-kw"/>`;
    }
  }
  const [fx, fy] = p5Pt(306, L.deg),
    [sx, sy] = p5Pt(306, (L.deg + 180) % 360),
    [bx, by] = p5Pt(60, L.deg);
  g += `<line x1="${sx}" y1="${sy}" x2="${fx}" y2="${fy}" class="p5-ptr"/><circle cx="${fx}" cy="${fy}" r="8" class="p5-face"/><circle cx="${sx}" cy="${sy}" r="6" class="p5-sit"/>`;
  g += `<circle r="72" class="p5-ctr"/>${p5T(-9, 0, L.deg.toFixed(1) + "°", 17, "p5-gl")}${p5T(12, 0, f.mtn.n + (f.zheng ? "" : "兼" + f.jian.n), 14, "p5-ml")}`;
  return `<svg id="lpSvg" viewBox="-330 -330 660 660" role="img" aria-label="综合罗盘">${g}</svg>`;
}
function p5LuopanPage() {
  const L = P5.lp,
    f = p5Facing(L.deg, L.tol),
    kw = p5Kongwang(L.deg, L.kw),
    m = f.mtn,
    ls = { 坎: 1, 坤: 2, 震: 3, 巽: 4, 乾: 6, 兑: 7, 艮: 8, 离: 9 },
    cs = p5ChangSheng(L.ju);
  const sb = (n) =>
    `<label class="chk"><input type="checkbox" data-lp="${n[0]}"${L[n[0]] ? " checked" : ""}> ${n[1]}</label>`;
  return `<div class="panel blk p5"><h3 class="sec">综合罗盘 <small class="dim">24山 · 三元龙 · 阴阳 · 十二支 · 八卦 · 洛书 · 十二长生 · 空亡线</small></h3>
  <div class="p5-ctl"><label>朝向(向)° <input type="number" id="lpD" min="0" max="360" step="0.1" value="${L.deg.toFixed(1)}"></label><input type="range" id="lpR" min="0" max="360" step="0.1" value="${L.deg}" aria-label="朝向滑块">
   <button class="gbtn sm" data-step="-1">−1°</button><button class="gbtn sm" data-step="-0.1">−0.1°</button><button class="gbtn sm" data-step="0.1">+0.1°</button><button class="gbtn sm" data-step="1">+1°</button>
   <select id="lpPre" aria-label="常用朝向"><option value="">快速定向…</option>${P5_N24.map((x) => `<option value="${x.c}">正${x.n}(${x.c}°)</option>`).join("")}</select></div>
  <div class="p5-ctl"><label>正向半宽° <input type="number" id="lpTol" min="0.5" max="7" step="0.5" value="${L.tol}"></label><label>空亡缝针半宽° <input type="number" id="lpKw" min="0.5" max="3" step="0.5" value="${L.kw}"></label><label>三合局(十二长生) <select id="lpJu">${["水", "木", "火", "金"].map((j) => `<option${L.ju === j ? " selected" : ""}>${j}</option>`).join("")}</select></label>${[
    ["showYY", "阴阳点"],
    ["showKW", "空亡线"],
    ["yuan", "十二长生"],
  ]
    .map(sb)
    .join("")}</div>
  <div class="p5-wrap"><div class="p5-fig">${p5LuopanSVG(L)}</div><div class="p5-side"><div class="tbl-wrap"><table class="tbl"><tbody>
   <tr><th>向(朝向)</th><td><b class="gold">${f.mtn.n}山</b> ${f.zheng ? "正向" : `<b>兼${f.jian.n}</b>`}(偏 ${f.off > 0 ? "+" : ""}${f.off.toFixed(1)}°) · ${f.dir8[0]}(${f.dir8[1]})</td></tr>
   <tr><th>坐(背向)</th><td>${f.sitting.n}山 · ${f.sitDir8[0]}(${f.sitDir8[1]})</td></tr>
   <tr><th>三元龙</th><td>${m.yuan} · ${m.yy ? "阳" : "阴"}山(玄空顺逆) · ${m.gua}卦 · 洛书 ${ls[m.gua]}</td></tr>
   <tr><th>地支</th><td>${ZHI[p5Branch(L.deg)]}(${P5_SHENG[p5Branch(L.deg)]}) · 本山${m.n}所属${m.gua}宫</td></tr>
   <tr><th>${L.ju}局长生</th><td>${ZHI[p5Branch(L.deg)]}位为「${cs[p5Branch(L.deg)]}」;长生在${ZHI[P5_JU[L.ju]]}</td></tr>
   <tr><th>空亡线</th><td>${kw ? `<span class="p5-xiong">近${kw.type}</span>(距缝 ${kw.dist.toFixed(1)}°,线在 ${kw.at}°)` : `<span class="p5-ji">不在缝针范围</span>(±${L.kw}°)`}</td></tr>
  </tbody></table></div>
  <p class="note">“兼向”:偏离本山中线超过 ${L.tol}° 记为兼向,至半山(7.5°)为止。空亡线:八卦分界(22.5°+45°k)为大空亡,其余山间缝为小空亡;古人对缝针的宽度与忌讳各派不同,这里的半宽可自行调整。</p>
  <p class="note">本页是纯计算罗盘。要用手机实测朝向,请回「观象盘」页的能量感应层读取读数后,把数值填到上面。</p></div></div>${P5_NOTE}
  ${p5Audit(["24山中心度数:子0°、癸15°、丑30°……壬345°,每山15°;三元龙与阴阳取自玄空模块,经公开山向表反推校验。", "阴阳(玄空顺逆):阳:乾坤艮巽(天元)、寅申巳亥(人元)、甲庚壬丙(地元);阴:子午卯酉、乙辛丁癸、辰戌丑未。", "十二长生:各三合局长生所在支:水局申、木局亥、火局寅、金局巳,自长生起顺布(三合派水法口径,不分阴阳顺逆)。", "60龙、72龙、120分金、28宿对应24山:这里没有收录。典籍版本之间差异大,我没有可核对的来源,宁可不列,也不凭记忆写。", "出卦、兼向的度数界限为通行口径,不同流派不同,已设为可调。"])}</div>`;
}
function p5LuopanBind() {
  const L = P5.lp,
    re = () => refRender("luopan"),
    setD = (d) => {
      L.deg = ((+d % 360) + 360) % 360;
      re();
    };
  $("#lpD").onchange = (e) => setD(e.target.value);
  $("#lpR").oninput = (e) => {
    L.deg = +e.target.value;
    const f = p5Facing(L.deg, L.tol);
    $("#lpD").value = L.deg.toFixed(1);
    clearTimeout(p5LuopanBind.t);
    p5LuopanBind.t = setTimeout(re, 40);
  };
  $$("[data-step]", $("#pane-luopan")).forEach(
    (b) => (b.onclick = () => setD(L.deg + +b.dataset.step)),
  );
  $("#lpPre").onchange = (e) => {
    if (e.target.value !== "") setD(e.target.value);
  };
  $("#lpTol").onchange = (e) => {
    L.tol = +e.target.value || 3;
    re();
  };
  $("#lpKw").onchange = (e) => {
    L.kw = +e.target.value || 1.5;
    re();
  };
  $("#lpJu").onchange = (e) => {
    L.ju = e.target.value;
    re();
  };
  $$("[data-lp]", $("#pane-luopan")).forEach(
    (c) =>
      (c.onchange = () => {
        L[c.dataset.lp] = c.checked ? 1 : 0;
        re();
      }),
  );
  $$(".p5-m", $("#lpSvg")).forEach(
    (m) =>
      (m.onclick = () => {
        const t = P5_N24.find((x) => x.n === m.dataset.m);
        if (t) setD(t.c);
      }),
  );
}
REF_PANES.sha = p5ShaPage;
REF_BIND.sha = p5ShaBind;
REF_PANES.taisui = p5TaisuiPage;
REF_BIND.taisui = p5TaisuiBind;
REF_PANES.jifang = p5JifangPage;
REF_BIND.jifang = p5JifangBind;
REF_PANES.luopan = p5LuopanPage;
REF_BIND.luopan = p5LuopanBind;
REF_STATIC.add("luopan");

/* =====================================================================
   地支枢纽(坐标桥):十二地支是各体系共用的坐标环,点一支,看它在所有体系里的位置
   校验与口径:每个盘对照了什么、样本多少、结果如何、哪里没做
   ===================================================================== */
const BR = { sel: null };
const BR_YUEJIAN = [
  "十一月",
  "十二月",
  "正月",
  "二月",
  "三月",
  "四月",
  "五月",
  "六月",
  "七月",
  "八月",
  "九月",
  "十月",
];
const BR_YUEJIANG = [
  "神后",
  "大吉",
  "功曹",
  "太冲",
  "天罡",
  "太乙",
  "胜光",
  "小吉",
  "传送",
  "从魁",
  "河魁",
  "登明",
];
const BR_BIGUA = ["复", "临", "泰", "大壮", "夬", "乾", "姤", "遯", "否", "观", "剥", "坤"];
const BR_XINGCI = [
  "玄枵",
  "星纪",
  "析木",
  "大火",
  "寿星",
  "鹑尾",
  "鹑火",
  "鹑首",
  "实沈",
  "大梁",
  "降娄",
  "娵訾",
];
const BR_HOUR = [
  "23–1",
  "1–3",
  "3–5",
  "5–7",
  "7–9",
  "9–11",
  "11–13",
  "13–15",
  "15–17",
  "17–19",
  "19–21",
  "21–23",
];
function brCS(stem, b) {
  const st = CS_START[stem];
  const pos = stem % 2 === 0 ? (b - st + 12) % 12 : (st - b + 12) % 12;
  return CS_NAME[pos];
}
function brMeridian(z) {
  const m = typeof JL_MER !== "undefined" ? JL_MER.find((x) => x.z === ZHI[z]) : null;
  return m ? m.n.replace("足", "").replace("手", "") : "—";
}
function brMarks() {
  // 本盘在各支上的落点
  const m = Array.from({ length: 12 }, () => []);
  if (!R || !R.bz) return m;
  R.bz.pill.forEach((p, i) => m[p.b].push(["年", "月", "日", "时"][i] + "柱"));
  try {
    if (R.zw) {
      m[R.zw.ming].push("紫微命宫");
      m[R.zw.shen].push("紫微身宫");
    }
  } catch (e) {}
  try {
    const dy = R.bz.dayun && R.bz.dayun[0];
  } catch (e) {}
  try {
    const ny = R.bz.yearNum,
      z = (((ny - 4) % 12) + 12) % 12;
  } catch (e) {}
  return m;
}
function brRings() {
  const hasZW = !!(R && R.zw && R.zw.pal),
    dm = R && R.bz ? R.bz.dm : null;
  const rings = [
    { n: "地支·生肖", f: (z) => [ZHI[z], P5_SHENG[z]], w: 30, main: 1 },
    { n: "月建(农历月)", f: (z) => [BR_YUEJIAN[z]], w: 28 },
    { n: "月将(六壬)", f: (z) => [BR_YUEJIANG[z]], w: 28 },
    { n: "十二辟卦", f: (z) => [BR_BIGUA[z]], w: 28 },
    { n: "十二星次", f: (z) => [BR_XINGCI[z]], w: 28 },
    { n: "经络(子午流注)", f: (z) => [brMeridian(z)], w: 28 },
  ];
  if (hasZW)
    rings.push({
      n: "紫微十二宫",
      f: (z) => {
        const p = R.zw.pal.find((x) => x.b === z);
        return [p ? p.name : "—"];
      },
      w: 28,
    });
  if (dm != null) rings.push({ n: "日主十二长生", f: (z) => [brCS(dm, z)], w: 28 });
  return rings;
}
function brSVG() {
  const rings = brRings(),
    marks = brMarks();
  let r = 300,
    g = "";
  const sel = BR.sel;
  rings.forEach((ring, ri) => {
    const r1 = r,
      r0 = r - ring.w;
    for (let z = 0; z < 12; z++) {
      const c = z * 30,
        t = ring.f(z),
        on = sel === z,
        mk = marks[z].length && ri === 0;
      g += `<path d="${p5Arc(r0, r1, c - 15, c + 15)}" class="br-c${on ? " on" : ""}${mk ? " mk" : ""}" data-z="${z}"><title>${ring.n}:${t.join(" ")}</title></path>`;
      g += p5T(
        (r0 + r1) / 2 + (ring.main ? 2 : 0),
        c,
        t[0],
        ring.main ? 15 : 11,
        ri === 0 ? "p5-zl" : "p5-ml",
      );
      if (t[1]) g += p5T(r0 + 6, c, t[1], 8, "p5-sh");
    }
    r = r0;
  });
  g += `<circle r="${r - 2}" class="p5-ctr"/>${p5T(-8, 0, sel == null ? "点一支" : ZHI[sel], 20, "p5-gl")}${p5T(14, 0, sel == null ? "看各系统" : P5_SHENG[sel], 11, "p5-sh")}`;
  return `<svg id="brSvg" viewBox="-320 -320 640 640" role="img" aria-label="地支枢纽:十二地支与各体系的对应">${g}</svg>`;
}
function brDetail(z) {
  const marks = brMarks()[z],
    dm = R && R.bz ? R.bz.dm : null,
    zw = R && R.zw && R.zw.pal ? R.zw.pal.find((x) => x.b === z) : null,
    m24 = P5_N24.find((x) => x.n === ZHI[z]),
    d8 = p5Dir8(z * 30);
  const wx = "木火土金水"[ZHI_WX[z]],
    he6 = ZHI[(P5_HE6.find((p) => p.includes(z)) || []).find((x) => x !== z)],
    chong = ZHI[(z + 6) % 12];
  const san = P5_HE3.find((g) => g.includes(z))
      .map((x) => ZHI[x])
      .join(""),
    hai = ZHI[(P5_HAI.find((p) => p.includes(z)) || []).find((x) => x !== z)],
    po = ZHI[(P5_PO.find((p) => p.includes(z)) || []).find((x) => x !== z)];
  const rows = [
    ["五行·阴阳", `${wx} · ${z % 2 === 0 ? "阳" : "阴"}`],
    ["生肖 / 时辰", `${P5_SHENG[z]} · ${ZHI[z]}时 ${BR_HOUR[z]}`],
    ["农历月建", BR_YUEJIAN[z] + "(节气月以立春为寅月)"],
    ["月将", BR_YUEJIANG[z]],
    ["十二辟卦", BR_BIGUA[z] + "卦"],
    ["十二星次", BR_XINGCI[z]],
    ["经络", brMeridian(z)],
    [
      "24山 · 方位",
      `${ZHI[z]}山(${m24.c}°)· ${d8[0]}(${d8[1]}卦)· ${m24.yuan} · ${m24.yy ? "阳" : "阴"}山`,
    ],
    ["六合 / 冲", `${he6} / ${chong}`],
    ["三合局", san],
    ["害 / 破", `${hai || "—"} / ${po || "—"}`],
  ];
  if (zw)
    rows.push([
      "紫微宫位",
      `${zw.name}(${zw.stars.map((s) => s.n).join(" ") || "空宫"})` +
        (zw.isMing ? " · 命宫" : "") +
        (zw.isShen ? " · 身宫" : ""),
    ]);
  if (dm != null) rows.push(["日主十二长生", `${GAN[dm]}日主在${ZHI[z]}:${brCS(dm, z)}`]);
  return `<h4 class="gl">${ZHI[z]}(${P5_SHENG[z]})</h4><div class="tbl-wrap"><table class="tbl"><tbody>${rows.map((r) => `<tr><th>${r[0]}</th><td>${r[1]}</td></tr>`).join("")}</tbody></table></div>${marks.length ? `<p class="note ok" style="margin-top:8px">在你的盘上:${marks.join("、")}</p>` : '<p class="note dim">这个支在当前盘上没有落点。</p>'}<p class="note">月将与月建不同:月将按中气换,随太阳所在;月建按节换,随斗柄。十二星次按太阳黄经分,这里按支对应给出参照,不是实时位置。</p>`;
}
function brPage() {
  return `<div class="panel blk p5"><h3 class="sec">地支枢纽 <small class="dim">十二地支 = 各体系共用的坐标环</small></h3>
   <p class="note" style="margin-top:0">八字、紫微、奇门、六壬、辟卦、星次、经络,虽各自成体系,却共用同一个十二分的环。点任意一格,同一个支在所有环上高亮,右侧列出它在每个体系里的含义;金色描边的格子是你这张盘上有落点的支。</p>
   <div class="p5-wrap"><div class="p5-fig">${brSVG()}</div><div class="p5-side" id="brDet">${BR.sel == null ? '<p class="dim">点左边环上任意一格。</p>' : brDetail(BR.sel)}</div></div>
   ${P5_NOTE}${p5Audit(["十二月将:神后(子)大吉(丑)功曹(寅)太冲(卯)天罡(辰)太乙(巳)胜光(午)小吉(未)传送(申)从魁(酉)河魁(戌)登明(亥)。", "十二辟卦:复(子)临(丑)泰(寅)大壮(卯)夬(辰)乾(巳)姤(午)遯(未)否(申)观(酉)剥(戌)坤(亥)。", "十二星次:玄枵(子)星纪(丑)析木(寅)大火(卯)寿星(辰)鹑尾(巳)鹑火(午)鹑首(未)实沈(申)大梁(酉)降娄(戌)娵訾(亥)。", "十二长生:取自八字模块长生起点表(甲亥、乙午、丙寅、丁酉、戊寅、己酉、庚巳、辛子、壬申、癸卯),阳干顺行、阴干逆行。", "冲、六合、三合、害、破:与犯太岁盘共用同一套规则。"])}</div>`;
}
function brBind() {
  const svg = $("#brSvg");
  if (!svg) return;
  $$(".br-c", svg).forEach(
    (c) =>
      (c.onclick = () => {
        BR.sel = BR.sel === +c.dataset.z ? null : +c.dataset.z;
        refRender("bridge");
      }),
  );
}
REF_PANES.bridge = brPage;
REF_BIND.bridge = brBind;
REF_STATIC.add("bridge");

/* ---------- 校验与口径 ---------- */
const VF = [
  [
    "八字四柱 / 农历 / 节气",
    "已对拍",
    "lunar-javascript(开源历法库)",
    "30000 个随机时刻",
    "四柱 0 偏差;日柱 23:00 换日与 00:00 换日两种口径都核对过",
    "子时换日、真太阳时、立春/春节换年是口径选项,页面上都可切换或并列",
  ],
  [
    "紫微斗数",
    "已对拍",
    "iztro(开源紫微库)",
    "3000 + 2500 个随机命盘",
    "命宫、身宫、五行局、主星、辅曜、煞曜、长生、大限、博士、四化与杂曜 0 偏差",
    "三合派、飞星派、中州派的取法不同,本站按 iztro 默认口径",
  ],
  [
    "择日 / 黄历",
    "已对拍",
    "lunar-javascript",
    "24090 个日期(1902–2099)",
    "建除、二十八宿、天神、冲煞、宜忌、吉神凶煞 0 偏差",
    "评分与吉日推荐是本站自己的规则,不在对拍范围",
  ],
  [
    "年度神煞 · 年飞星",
    "已对拍",
    "lunar-javascript",
    "199 个年份",
    "年飞星 0 偏差;冲、六合 12 项一致",
    "太岁方位:该库把戌亥年记为坎,本站按 24 山取乾;已确认以 24 山为准",
  ],
  [
    "十二岁神",
    "已对拍",
    "iztro",
    "6 个流年共 72 项",
    "岁建、晦气、丧门、贯索、官符、小耗、大耗、龙德、白虎、天德、吊客、病符 0 偏差",
    "吉凶归类为传统说法",
  ],
  [
    "行星位置",
    "已对拍",
    "Astronomy Engine(JPL 级星历)",
    "采样若干日期,月亮及水星至海王星",
    "月亮与水星、金星、火星最大差 ≤0.05°;木星 ≤0.15°;土星 ≤0.35°;海王星 ≤0.03°",
    "太阳与冥王星未在对拍之列;适合星座、相位与宫位判断,不适合到角秒级的天文用途",
  ],
  [
    "奇门遁甲",
    "已对拍",
    "外部奇门软件导出的 30 局",
    "30 局",
    "定局、地盘、天盘、八门、九星 0 偏差",
    "时家转盘、拆补法;置闰、飞盘、阴盘、年月日家未实现",
  ],
  [
    "大六壬",
    "部分",
    "外部实现",
    "8638 个课例",
    "天盘、四课 0 偏差",
    "特殊课体(伏吟、返吟、八专、涉害)与参照实现有差异,九宗门规则未逐案校验,不宣称一致",
  ],
  [
    "玄空飞星",
    "已对拍",
    "公开的八运/九运山向表",
    "反推校验",
    "阴阳山、顺逆飞布与公开表一致",
    "不含替卦与兼向替卦",
  ],
  [
    "周易六十四卦",
    "已对拍",
    "@freizl/yijing(MIT)",
    "64 卦逐卦",
    "卦序、爻数、King Wen 序、卦名匹配 64/64",
    "文本为经文,解释部分是现代概括",
  ],
  [
    "八宅游年 / 命卦",
    "已对拍",
    "《八宅明镜》游年口诀、命卦逐年连续性",
    "坎宅口诀 + 8 个朝向;190 年连续性",
    "坎宅八个游年与口诀一致;东西四宅吉位同组;男命卦逐年递减、女逐年递增",
    "过程中查出并修正了一个命卦公式错误(2000 年起),现已用连续性测试守住",
  ],
  [
    "河图洛书",
    "自洽校验",
    "数理关系自检",
    "—",
    "生数合 15、成数合 40、洛书各线合 15、对宫合 10、共 45",
    "属数理自洽,不是外部对拍",
  ],
  [
    "大衍筮法",
    "统计校验",
    "经典概率",
    "12 万爻",
    "老阴 6.1% / 少阳 30.4% / 少阴 43.8% / 老阳 19.7%,与理论 6.25 / 31.25 / 43.75 / 18.75 一致",
    "随机源为浏览器加密随机",
  ],
  [
    "称骨 / 数字能量 / 九星气学",
    "自洽校验",
    "值域与歌诀数目",
    "—",
    "歌诀 51 首覆盖 21–71 两",
    "无外部对照",
  ],
  [
    "金口诀 · 七政四余 · 太乙神数",
    "未对拍",
    "—",
    "—",
    "仅验证可渲染、参数可切换、无异常",
    "移植自参考版,口径依其说明;未与外部软件对拍",
  ],
  [
    "经络 · 星空 · 日月天象图解 · 3D",
    "示意",
    "—",
    "—",
    "示意模型",
    "经络非医学依据,星图非实测星历",
  ],
  [
    "星盘:上升/中天、恒星时",
    "已对拍",
    "Astronomy Engine(恒星时)",
    "200 组随机时刻与经纬度",
    "赤经 RAMC 与 Astronomy 的恒星时最大差 0.005°",
    "上升点按真黄赤交角计算;未计章动以外的微小项",
  ],
  [
    "星盘:普拉西德宫头",
    "自洽校验",
    "解析关系与闭合性",
    "600 组多纬度多时刻",
    "对宫相差 180°;赤道处第 11/12/2 宫头等于赤经 30°/60°/120° 的黄经点;纬度高于 66.5° 自动改用波菲利",
    "无外部软件逐宫对拍;Koch 等其他宫位制未收录",
  ],
  [
    "星盘:太阳回归 · 次限 · 组合盘",
    "已对拍",
    "Astronomy Engine(SearchSunLongitude)",
    "15 组回归时刻",
    "太阳回归时刻最大差 2.3 分钟",
    "次限按 365.2422 日一年;组合盘取短弧中点、等宫制,属简化做法",
  ],
  [
    "吠陀占星:岁差 · 27宿 · 大运 · D9",
    "部分",
    "内部一致性 + Astronomy Engine(日月位置)",
    "80 个新月/满月时刻",
    "新月/满月时日月黄经差偏离 ≤0.017°;九大运总长 = 120 年;小运之和 = 大运",
    "岁差用拉希里近似式,其他岁差体系会差 0.1–1°,可能改变月宿;未与 Jagannatha Hora 等软件逐盘对拍",
  ],
  [
    "综合罗盘 · 犯太岁 · 吉方共识",
    "部分",
    "见上各项",
    "—",
    "24 山顺序、阴阳、坐向兼向换算、空亡线、刑破害合有单元测试;吉方并列证据的结构自洽",
    "刑破害为通行表,各派略有出入;兼向度数界限可调",
  ],
  [
    "铁板神数 · 南北极神数 · 三世书",
    "未实现",
    "—",
    "—",
    "—",
    "没有可核对的起数规则与条文版本,不收录",
  ],
  [
    "60龙 · 72龙 · 120分金 · 28宿对应24山",
    "未实现",
    "—",
    "—",
    "—",
    "典籍版本差异大,没有可核对来源,宁可不列",
  ],
  ["皇极经世 · 河洛理数", "未实现", "—", "—", "—", "规则版本多,尚未核对,不收录"],
  [
    "吠陀占星:十二宫判断 · 庄严 · 瑜伽 · 分盘 D2–D60",
    "未实现",
    "—",
    "—",
    "—",
    "只给 D1/D9 与大运,吉凶判断规则版本多,不收录",
  ],
];
const VF_ST = {
  已对拍: "g",
  统计校验: "g",
  自洽校验: "",
  部分: "y",
  示意: "",
  未对拍: "y",
  未实现: "r",
};
const VFS = { f: "" };
function vfPage() {
  const list = VF.filter((r) => !VFS.f || r[1] === VFS.f),
    sts = ["", ...Array.from(new Set(VF.map((r) => r[1])))];
  const cnt = (s) => VF.filter((r) => r[1] === s).length;
  return `<div class="panel blk p5"><h3 class="sec">校验与口径 <small class="dim">每个盘对照了什么、样本多少、哪里没做</small></h3>
   <p class="note" style="margin-top:0">排盘软件的可信度来自能追溯。这里列出各盘实际对拍过的开源参照、样本量与结果,也列出没有校验和没有实现的部分。“已对拍”只表示与所列参照一致,<b>并不代表该口径就是唯一正确的</b>。</p>
   <div class="kv"><span>已对拍 <b class="gold">${cnt("已对拍") + cnt("统计校验")}</b></span><span>部分 <b>${cnt("部分") + cnt("未对拍")}</b></span><span>自洽/示意 <b>${cnt("自洽校验") + cnt("示意")}</b></span><span>未实现 <b>${cnt("未实现")}</b></span></div>
   <div class="p5-ctl"><label>状态 <select id="vfF">${sts.map((s) => `<option value="${s}"${VFS.f === s ? " selected" : ""}>${s || "全部"}</option>`).join("")}</select></label></div>
   <div class="tbl-wrap"><table class="tbl vf-t"><thead><tr><th>盘 / 模块</th><th>状态</th><th>参照物</th><th>样本</th><th>结果</th><th>口径与已知差异</th></tr></thead><tbody>${list.map((r) => `<tr><th>${r[0]}</th><td><span class="pill ${VF_ST[r[1]] || ""}">${r[1]}</span></td><td>${r[2]}</td><td>${r[3]}</td><td>${r[4]}</td><td class="dim sm">${r[5]}</td></tr>`).join("")}</tbody></table></div>
   <p class="note">对拍脚本随开发保留,每次改动后重新跑。数字取自本次构建前最近一次运行。</p></div>`;
}
function vfBind() {
  const e = $("#vfF");
  if (e)
    e.onchange = () => {
      VFS.f = e.value;
      refRender("verify");
    };
}
REF_PANES.verify = vfPage;
REF_BIND.verify = vfBind;

/* =====================================================================
   星盘完整版(natal)与吠陀占星(vedic)
   本命 / 太阳回归 / 次限 / 组合盘;宫位制:普拉西德、整宫、等宫、波菲利。
   吠陀:恒星黄道(拉希里近似)、27 宿、Vimshottari 大运、D1/D9、五支历。
   行星位置已与 Astronomy Engine 对拍;文字解释为文化参考,不构成决策建议。
   ===================================================================== */
const NT = {
  kind: "natal",
  sys: "placidus",
  year: null,
  target: null,
  partner: "",
  relon: "",
  relat: "",
};
const NT_ASP_C = { 合: "#d4b45a", 和: "#4fae8f", 冲: "#c8452e" };
const A2_PL_C = {
  太阳: "#e0a21a",
  月亮: "#9fb4c8",
  水星: "#6ac4b0",
  金星: "#e68aa8",
  火星: "#d8502e",
  木星: "#9a6ad0",
  土星: "#8a8f98",
  天王星: "#4aa8d8",
  海王星: "#4a7ad8",
  冥王星: "#a04a6a",
};
function ntJD() {
  return R && R.t ? R.t.jdUT : null;
}
function ntLoc() {
  return {
    lon: +(R && R.opt ? R.opt.lon : 120) || 120,
    lat: +(R && R.opt ? R.opt.lat : 24.5) || 24.5,
  };
}
function ntPersonJD(p) {
  const c = pplParse(p.dt);
  if (!c) return null;
  return jdFromGreg(c.y, c.m, c.d, c.h, c.mi, 0) - 8 / 24;
}
function ntFmt(jd) {
  const t = fromJD(jd + 8 / 24);
  return `${t.y}-${f2(t.m)}-${f2(t.d)} ${f2(t.h)}:${f2(t.mi)}`;
}
function ntNowYear() {
  return nowBJ().y;
}
function ntBuild() {
  const jd = ntJD();
  if (jd == null) return null;
  const L = ntLoc(),
    sys = NT.sys;
  const natal = a2Chart(jd, L.lon, L.lat, sys);
  if (NT.kind === "natal")
    return {
      chart: natal,
      natal,
      title: "本命盘",
      sub: `出生 ${ntFmt(jd)} · 经度 ${L.lon.toFixed(2)}° 纬度 ${L.lat.toFixed(2)}°`,
    };
  if (NT.kind === "return") {
    const y = NT.year || ntNowYear(),
      jr = a2SolarReturn(jd, y),
      rl = NT.relon !== "" && NT.relat !== "" ? { lon: +NT.relon, lat: +NT.relat } : L;
    return {
      chart: a2Chart(jr, rl.lon, rl.lat, sys),
      natal,
      title: `${y} 年太阳回归盘`,
      sub: `太阳回到本命黄经的时刻 ${ntFmt(jr)}(北京时间) · 地点 ${rl.lon.toFixed(2)}°E ${rl.lat.toFixed(2)}°N${NT.relon === "" ? "(出生地)" : "(自填)"}`,
    };
  }
  if (NT.kind === "prog") {
    const tg =
        NT.target ||
        (() => {
          const n = nowBJ();
          return `${n.y}-${f2(n.m)}-${f2(n.d)}`;
        })(),
      m = /^(\d{4})-(\d{2})-(\d{2})/.exec(tg);
    if (!m) return null;
    const jt = jdFromGreg(+m[1], +m[2], +m[3], 12, 0, 0) - 8 / 24,
      jp = a2Progressed(jd, jt),
      age = (jt - jd) / 365.2422;
    return {
      chart: a2Chart(jp, L.lon, L.lat, sys),
      natal,
      title: `次限盘(一日一年)`,
      sub: `目标日 ${tg} · 年龄约 ${age.toFixed(1)} 岁 · 对应出生后第 ${(jp - jd).toFixed(1)} 天`,
      prog: true,
    };
  }
  if (NT.kind === "comp") {
    const p = (PPL.people || []).find((x) => x.id === NT.partner) || null;
    if (!p) return { chart: natal, natal, title: "组合盘", sub: "请先选择另一个人", empty: true };
    const jb = ntPersonJD(p);
    if (jb == null)
      return {
        chart: natal,
        natal,
        title: "组合盘",
        sub: "所选人物缺少完整的出生日期时间",
        empty: true,
      };
    const cb = a2Chart(jb, +p.lon || 120, +p.lat || 24.5, sys),
      comp = a2Composite(natal, cb);
    return {
      chart: comp,
      natal,
      partner: cb,
      title: "组合盘(中点盘)",
      sub: `${((R && R.opt && PPL.people.find((x) => x.id === PPL.meId)) || {}).name || "本人"} × ${p.name || "对方"}`,
      comp: true,
    };
  }
  return null;
}
/* --------- 星盘轮 --------- */
function ntWheel(B) {
  const C = B.chart,
    N = B.natal,
    asc = C.A.asc,
    sc = (l) => 270 - (l - asc);
  let g = "";
  g += `<circle r="300" class="nt-o"/><circle r="262" class="nt-o"/><circle r="205" class="nt-o"/><circle r="120" class="nt-in"/>`;
  for (let i = 0; i < 12; i++) {
    const a0 = sc(i * 30),
      a1 = sc(i * 30 + 30),
      el = A2_ELEM[i];
    const mid = sc(i * 30 + 15);
    g += `<path d="${p5Arc(262, 300, Math.min(a0, a1), Math.max(a0, a1))}" class="nt-sg e${"火土风水".indexOf(el)}"/>${p5T(278, mid, A2_GLYPH[i], 18, "nt-gl")}${p5T(294, mid, A2_SIGN[i], 7.5, "nt-sl")}`;
    for (let d = 0; d < 30; d += 5) {
      const [x0, y0] = p5Pt(262, sc(i * 30 + d)),
        [x1, y1] = p5Pt(d % 10 === 0 ? 252 : 256, sc(i * 30 + d));
      g += `<line x1="${x0.toFixed(1)}" y1="${y0.toFixed(1)}" x2="${x1.toFixed(1)}" y2="${y1.toFixed(1)}" class="nt-tk"/>`;
    }
  }
  C.cusps.forEach((c, i) => {
    const a = sc(c),
      big = i % 3 === 0,
      [x0, y0] = p5Pt(120, a),
      [x1, y1] = p5Pt(262, a);
    g += `<line x1="${x0.toFixed(1)}" y1="${y0.toFixed(1)}" x2="${x1.toFixed(1)}" y2="${y1.toFixed(1)}" class="nt-cu${big ? " big" : ""}"/>`;
    const mid = sc(c + A2_NORM(C.cusps[(i + 1) % 12] - c) / 2);
    g += p5T(142, mid, String(i + 1), 11, "nt-hn");
  });
  [
    ["ASC", C.A.asc],
    ["MC", C.A.mc],
    ["DSC", C.A.dsc],
    ["IC", C.A.ic],
  ].forEach(([n, l]) => {
    g += p5T(316, sc(l), n, 11, "nt-ang") + p5T(330, sc(l), `${Math.floor(l % 30)}°`, 8, "p5-sh");
  });
  // 行星:按黄经排序并展开,避免重叠
  const pl = C.planets.map((p) => ({ ...p })).sort((a, b) => a.lon - b.lon),
    minGap = 8.5;
  let pos = pl.map((p) => p.lon);
  for (let it = 0; it < 60; it++) {
    let moved = false;
    for (let i = 0; i < pos.length; i++) {
      const j = (i + 1) % pos.length,
        d = A2_NORM(pos[j] - pos[i]);
      if (d < minGap && pl.length > 1) {
        const push = (minGap - d) / 2 + 0.01;
        pos[i] -= push;
        pos[j] += push;
        moved = true;
      }
    }
    if (!moved) break;
  }
  pl.forEach((p, i) => {
    const a = sc(pos[i]),
      at = sc(p.lon),
      [tx, ty] = p5Pt(205, at),
      [tx2, ty2] = p5Pt(197, at),
      [gx, gy] = p5Pt(180, a),
      [dx, dy] = p5Pt(160, a);
    g += `<line x1="${tx.toFixed(1)}" y1="${ty.toFixed(1)}" x2="${tx2.toFixed(1)}" y2="${ty2.toFixed(1)}" class="nt-tk"/><g class="nt-pl" data-n="${p.n}"><title>${p.n} ${Math.floor(p.deg)}°${f2(Math.round((p.deg % 1) * 60))}′ ${A2_SIGN[p.sign]}${p.house ? " · 第" + p.house + "宫" : ""}${p.retro ? " · 逆行" : ""}</title><text x="${gx.toFixed(1)}" y="${gy.toFixed(1)}" font-size="20" fill="${A2_PL_C[p.n] || "#ccc"}" text-anchor="middle" dominant-baseline="central" class="nt-pg">${p.g || p.n[0]}</text>${p5T(194, a, p.n, 7.2, "nt-pn")}</g>`;
    g += `<text x="${dx.toFixed(1)}" y="${dy.toFixed(1)}" font-size="9" class="p5-sh" text-anchor="middle" dominant-baseline="central">${Math.floor(p.deg)}°${p.retro ? "℞" : ""}</text>`;
  });
  C.parts.forEach((pt) => {
    const a = sc(pt.lon),
      [x, y] = p5Pt(222, a);
    g += `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" font-size="11" class="nt-part" text-anchor="middle" dominant-baseline="central"><title>${pt.n} ${Math.floor(pt.deg)}° ${A2_SIGN[pt.sign]}</title>${pt.n[0] === "福" ? "⊗" : "⊕"}</text>${p5T(237, a, pt.n, 6.8, "nt-part-name")}`;
  });
  // 相位线
  const byN = {};
  C.planets.forEach((p) => {
    byN[p.n] = p;
  });
  C.aspects.forEach((a) => {
    const p = byN[a.a],
      q = byN[a.b];
    if (!p || !q) return;
    const [x0, y0] = p5Pt(118, sc(p.lon)),
      [x1, y1] = p5Pt(118, sc(q.lon));
    g += `<line x1="${x0.toFixed(1)}" y1="${y0.toFixed(1)}" x2="${x1.toFixed(1)}" y2="${y1.toFixed(1)}" stroke="${NT_ASP_C[a.t]}" class="nt-as" stroke-opacity="${(0.9 - a.orb / 12).toFixed(2)}"><title>${a.a} ${a.sym} ${a.b} ${a.name}(误差 ${a.orb.toFixed(1)}°)</title></line>`;
  });
  // 次限/回归叠加本命外圈
  if ((B.prog || NT.kind === "return") && N) {
    N.planets.forEach((p) => {
      const [x, y] = p5Pt(312, sc(p.lon));
      g += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3" fill="${A2_PL_C[p.n] || "#ccc"}" opacity=".8"><title>本命 ${p.n} ${Math.floor(p.deg)}° ${A2_SIGN[p.sign]}</title></circle>`;
    });
  }
  return `<svg id="ntSvg" viewBox="-372 -360 744 720" role="img" aria-label="${B.title}">${g}</svg>`;
}
function ntTables(B) {
  const C = B.chart,
    fm = (p) => `${Math.floor(p.deg)}°${f2(Math.round((p.deg % 1) * 60) % 60)}′`;
  const pr = C.planets
    .map(
      (p) =>
        `<tr><th><span style="color:${A2_PL_C[p.n] || "#ccc"}">${p.g || ""}</span> ${p.n}</th><td>${A2_SIGN[p.sign]} ${fm(p)}</td><td>${p.house ? "第 " + p.house + " 宫" : "—"}</td><td>${p.retro ? "逆行 ℞" : "顺行"}</td></tr>`,
    )
    .join("");
  const hs = C.cusps
    .map(
      (c, i) =>
        `<tr><th>${i + 1}</th><td>${A2_SIGN[Math.floor(c / 30)]} ${fm({ deg: c % 30 })}</td></tr>`,
    )
    .join("");
  const as = C.aspects
    .slice()
    .sort((a, b) => a.orb - b.orb)
    .slice(0, 24)
    .map(
      (a) =>
        `<tr><td>${a.a}</td><td style="color:${NT_ASP_C[a.t]}">${a.sym} ${a.name}</td><td>${a.b}</td><td class="dim">${a.orb.toFixed(1)}°</td></tr>`,
    )
    .join("");
  const el = { 火: 0, 土: 0, 风: 0, 水: 0 },
    mod = [0, 0, 0];
  C.planets
    .filter((p) => ["太阳", "月亮", "水星", "金星", "火星", "木星", "土星"].includes(p.n))
    .forEach((p) => {
      el[A2_ELEM[p.sign]]++;
      mod[p.sign % 3]++;
    });
  return `<div class="nt-tabs"><div class="tbl-wrap"><table class="tbl"><thead><tr><th>天体</th><th>位置</th><th>宫位</th><th>行动</th></tr></thead><tbody>${pr}</tbody></table></div>
   <div class="tbl-wrap"><table class="tbl"><thead><tr><th>宫</th><th>宫头(${{ placidus: "普拉西德", whole: "整宫", equal: "等宫", porphyry: "波菲利" }[C.sys] || C.sys})</th></tr></thead><tbody>${hs}</tbody></table></div></div>
   <div class="kv"><span>上升 <b>${A2_SIGN[Math.floor(C.A.asc / 30)]} ${Math.floor(C.A.asc % 30)}°</b></span><span>中天 <b>${A2_SIGN[Math.floor(C.A.mc / 30)]} ${Math.floor(C.A.mc % 30)}°</b></span><span>${C.day != null ? (C.day ? "昼盘" : "夜盘") : ""}</span>${C.parts.map((pt) => `<span>${pt.n} <b>${A2_SIGN[pt.sign]} ${Math.floor(pt.deg)}°(${pt.house}宫)</b></span>`).join("")}</div>
   <div class="kv"><span>元素(七曜) 火 <b>${el.火}</b> 土 <b>${el.土}</b> 风 <b>${el.风}</b> 水 <b>${el.水}</b></span><span>三态 本位 <b>${mod[0]}</b> 固定 <b>${mod[1]}</b> 变动 <b>${mod[2]}</b></span></div>
   <h4 class="gl" style="margin-top:10px">主要相位(按精度,前 24)</h4><div class="tbl-wrap"><table class="tbl"><tbody>${as || '<tr><td class="dim">无</td></tr>'}</tbody></table></div>`;
}
