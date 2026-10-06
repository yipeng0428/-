/* ===== v36 · Claude v6.5 优点择优融合层 ===== */
const phHead = (t, sub) => `<div class="ph"><h3>${t}</h3>${sub ? `<p>${sub}</p>` : ""}</div>`;
const phNote = (txt, title) =>
  `<details class="ph-note"><summary>${title || "口径说明"}</summary><div>${txt}</div></details>`;

const ZF_LAB = ["禄", "权", "科", "忌"];
function zfStarPal(zw, nm) {
  for (const q of zw.pal) if (q.stars.some((s) => s.n === nm)) return q;
  return null;
}
/* 一个天干的四化落点:[{h,star,to(地支序 0-11 或 null)}] */
function zfFlyFrom(zw, stem) {
  return SIHUA[stem].map((nm, i) => {
    const q = zfStarPal(zw, nm);
    return { h: ZF_LAB[i], star: nm, to: q ? q.b : null };
  });
}
/* 层:ben 各宫宫干飞化;sheng 生年四化;dx 大限命宫宫干;liu 流年天干。from=-1 表示不从某一宫出发(中心) */
function zfNet(zw, o) {
  o = o || {};
  const age = o.age,
    year = o.year;
  const edges = [];
  zw.pal.forEach((p) =>
    zfFlyFrom(zw, p.stem).forEach((f) =>
      edges.push({
        layer: "ben",
        from: p.b,
        stem: p.stem,
        h: f.h,
        star: f.star,
        to: f.to,
        self: f.to === p.b,
      }),
    ),
  );
  zfFlyFrom(zw, zw.ys).forEach((f) =>
    edges.push({
      layer: "sheng",
      from: -1,
      stem: zw.ys,
      h: f.h,
      star: f.star,
      to: f.to,
      self: false,
    }),
  );
  let dxPal = null;
  if (age != null) dxPal = zw.pal.find((p) => p.dx && age >= p.dx[0] && age <= p.dx[1]) || null;
  if (dxPal)
    zfFlyFrom(zw, dxPal.stem).forEach((f) =>
      edges.push({
        layer: "dx",
        from: dxPal.b,
        stem: dxPal.stem,
        h: f.h,
        star: f.star,
        to: f.to,
        self: f.to === dxPal.b,
      }),
    );
  if (year != null) {
    const st = (((year - 4) % 10) + 10) % 10;
    zfFlyFrom(zw, st).forEach((f) =>
      edges.push({ layer: "liu", from: -1, stem: st, h: f.h, star: f.star, to: f.to, self: false }),
    );
  }
  return { edges, dxPal };
}
/* 入宫统计:每宫被各化飞入的来源(仅本命宫干层) */
function zfInbound(zw, edges) {
  const inb = zw.pal.map(() => ({ 禄: [], 权: [], 科: [], 忌: [] }));
  edges
    .filter((e) => e.layer === "ben" && e.to != null)
    .forEach((e) => inb[e.to][e.h].push(e.from));
  return inb;
}
/* 追踪:从 b0 宫出发,按某一化一路转飞,直到回到走过的宫(回环)或落空 */
function zfChain(zw, b0, h) {
  const hi = ZF_LAB.indexOf(h),
    path = [b0];
  let loop = -1;
  for (let k = 0; k < 13; k++) {
    const cur = path[path.length - 1],
      f = zfFlyFrom(zw, zw.pal[cur].stem)[hi];
    if (f.to == null) {
      return { path, loop: -1, end: "落空" };
    }
    const at = path.indexOf(f.to);
    if (at >= 0) {
      loop = at;
      return { path, loop, end: f.to === cur ? "自化" : "回环" };
    }
    path.push(f.to);
  }
  return { path, loop, end: "未终止" };
}
/* ---------------- 八字五行 ---------------- */
/* 各柱对五行的贡献;sum 与 strength().wxw 同源。返回 {pillar:[{src,wx,w}], tot[5]} */
function wxContrib(bz, extra) {
  const items = [];
  bz.pill.forEach((p, i) => {
    if (i !== 2 && STW[i] > 0)
      items.push({
        pil: i,
        src: `${["年", "月", "日", "时"][i]}干 ${GAN[p.s]}`,
        g: p.s,
        wx: GAN_WX[p.s],
        w: STW[i],
        kind: "干",
      });
    CANG[p.b].forEach((g, k) =>
      items.push({
        pil: i,
        src: `${["年", "月", "日", "时"][i]}支 ${ZHI[p.b]} 藏${GAN[g]}`,
        g,
        wx: GAN_WX[g],
        w: CANGW[k] * POSW[i],
        kind: k === 0 ? "本气" : k === 1 ? "中气" : "余气",
      }),
    );
  });
  if (extra) extra.forEach((x) => items.push(x));
  const tot = [0, 0, 0, 0, 0];
  items.forEach((x) => {
    tot[x.wx] += x.w;
  });
  return { items, tot };
}
/* 把一个干支(如流年)按“多一柱”的同一规则折算成额外权重:干按年柱干权重,支按年柱位置权重 */
function wxExtraGZ(idx, label) {
  const s = idx % 10,
    b = idx % 12,
    out = [{ pil: -1, src: `${label}干 ${GAN[s]}`, g: s, wx: GAN_WX[s], w: STW[0], kind: "干" }];
  CANG[b].forEach((g, k) =>
    out.push({
      pil: -1,
      src: `${label}支 ${ZHI[b]} 藏${GAN[g]}`,
      g,
      wx: GAN_WX[g],
      w: CANGW[k] * POSW[0],
      kind: k === 0 ? "本气" : k === 1 ? "中气" : "余气",
    }),
  );
  return out;
}
/* 五行流通:生环 木→火→土→金→水→木(序号 0..4 即 木火土金水);克 i 克 (i+2)%5 */
function wxFlow(tot) {
  const sum = tot.reduce((a, b) => a + b, 0) || 1,
    pct = tot.map((v) => v / sum);
  const gen = [],
    kill = [];
  for (let i = 0; i < 5; i++) {
    const j = (i + 1) % 5;
    gen.push({ a: i, b: j, flow: Math.min(tot[i], tot[j]) });
  }
  for (let i = 0; i < 5; i++) {
    const j = (i + 2) % 5;
    kill.push({ a: i, b: j, press: Math.max(0, tot[i] - tot[j]), both: Math.min(tot[i], tot[j]) });
  }
  const mx = Math.max(...gen.map((g) => g.flow), 1e-9),
    mean = sum / 5;
  const thin = gen
    .filter((g) => g.flow < mx * 0.25 || g.flow < mean * 0.25)
    .map((g) => ({
      ...g,
      why:
        tot[g.a] < mean * 0.25 && tot[g.b] < mean * 0.25
          ? "两端都弱"
          : tot[g.a] < tot[g.b]
            ? `${WXN[g.a]}太弱,供不上${WXN[g.b]}`
            : `${WXN[g.b]}太弱,承接不了${WXN[g.a]}`,
    }));
  /* 通关:A 克 B 且 A、B 都不弱(≥均值),媒介 C=A 所生(同时生 B)的力量 */
  const bridge = kill
    .filter((k) => tot[k.a] >= mean && tot[k.b] >= mean)
    .map((k) => {
      const c = (k.a + 1) % 5;
      return { a: k.a, b: k.b, c, w: tot[c], ok: tot[c] >= mean * 0.5 };
    });
  const missing = [0, 1, 2, 3, 4].filter((i) => tot[i] < mean * 0.05);
  return {
    sum,
    pct,
    gen,
    kill,
    thin,
    bridge,
    missing,
    mean,
    strong: tot.indexOf(Math.max(...tot)),
    weak: tot.indexOf(Math.min(...tot)),
  };
}

/* ---------------- 结构化导出(纯函数,可在 node 中测试) ---------------- */
function tjSan(v, d, seen) {
  d = d || 0;
  seen = seen || new WeakSet();
  if (v === null || v === undefined) return null;
  const t = typeof v;
  if (t === "number") return isFinite(v) ? v : null;
  if (t === "string" || t === "boolean") return v;
  if (t === "function" || t === "symbol") return undefined;
  if (t === "bigint") return Number(v);
  if (typeof Node !== "undefined" && v instanceof Node) return undefined;
  if (d > 9) return "[深度截断]";
  if (typeof v === "object") {
    if (seen.has(v)) return "[循环引用]";
    seen.add(v);
    let out;
    if (Array.isArray(v)) {
      out = v.map((x) => {
        const r = tjSan(x, d + 1, seen);
        return r === undefined ? null : r;
      });
    } else if (v instanceof Set) {
      out = [...v].map((x) => tjSan(x, d + 1, seen));
    } else if (v instanceof Map) {
      out = [...v].map(([k, x]) => [String(k), tjSan(x, d + 1, seen)]);
    } else {
      out = {};
      for (const k of Object.keys(v)) {
        const r = tjSan(v[k], d + 1, seen);
        if (r !== undefined) out[k] = r;
      }
    }
    seen.delete(v);
    return out;
  }
  return undefined;
}
const TJ_VERSION = "天机盘 · 融合增强版 v36";
function tjExport(R, o) {
  o = o || {};
  const bz = R.bz,
    D = R.deep || baziDeep(R.bz),
    zw = R.zw,
    c = R.t.civ,
    PN = ["年", "月", "日", "时"];
  const pillars = bz.pill.map((p, i) => ({
    pos: PN[i],
    stem: GAN[p.s],
    branch: ZHI[p.b],
    stemIdx: p.s,
    branchIdx: p.b,
    tenGod: i === 2 ? "日主" : shishen(bz.dm, p.s),
    hidden: CANG[p.b].map((g) => ({ stem: GAN[g], tenGod: shishen(bz.dm, g) })),
    nayin: NAYIN[ganzhiIdx(p.s, p.b) >> 1],
    lifeStage: D.cs ? WXN && D.cs[i] : null,
  }));
  const wx = wxContrib(bz),
    fl = wxFlow(wx.tot),
    WN = ["木", "火", "土", "金", "水"];
  const net = zfNet(zw, { age: o.year != null ? o.year - zw.lunarYear + 1 : null, year: o.year });
  const out = {
    schema: "tianjipan.chart/1",
    generator: TJ_VERSION,
    exportedAt: o.now || null,
    disclaimer:
      "算法部分已与开源库对拍(见站内「校验与口径」);文字解释属传统文化参考,不构成决策依据。",
    input: {
      name: o.name || null,
      gender: R.opt.gender,
      civil: { y: c.y, m: c.m, d: c.d, h: c.h, mi: c.mi },
      trueSolarTime: !!R.opt.solar,
      location: { lon: R.opt.lon, lat: R.opt.lat },
      timezone: "Asia/Shanghai (UTC+8)",
    },
    time: { jdUT: R.t.jdUT, sunLongitude: R.t.lon, lunar: tjSan(R.lunar) },
    bazi: {
      pillars,
      dayMaster: { stem: GAN[bz.dm], element: WN[GAN_WX[bz.dm]] },
      strength: {
        level: D.st.level,
        ratio: D.st.ratio,
        season: D.st.season,
        deLing: D.st.deLing,
        weights: Object.fromEntries(WN.map((n, i) => [n, D.st.wxw[i]])),
      },
      favorable: {
        lead: D.xy.lead,
        favor: D.xy.favor.map((i) => WN[i]),
        avoid: D.xy.avoid.map((i) => WN[i]),
        notes: D.xy.notes,
      },
      pattern: tjSan(D.gj),
      emptyBranches: (D.kong || []).map((z) => ZHI[z]),
      shensha: tjSan(D.ss),
      luckCycles: (bz.dayun || []).map((d) => ({
        gz: gz(d.idx),
        idx: d.idx,
        startAge: d.startAge,
        startYear: d.yr,
      })),
      fiveElementFlow: {
        total: Object.fromEntries(WN.map((n, i) => [n, wx.tot[i]])),
        percent: Object.fromEntries(WN.map((n, i) => [n, fl.pct[i]])),
        generating: fl.gen.map((g) => ({ from: WN[g.a], to: WN[g.b], flow: g.flow })),
        controlling: fl.kill.map((k) => ({ from: WN[k.a], to: WN[k.b], pressure: k.press })),
        thinLinks: fl.thin.map((g) => ({ from: WN[g.a], to: WN[g.b], why: g.why })),
        missing: fl.missing.map((i) => WN[i]),
        bridges: fl.bridge.map((b) => ({
          between: [WN[b.a], WN[b.b]],
          mediator: WN[b.c],
          weight: b.w,
          present: b.ok,
        })),
        note: "流量=生者与被生者力量的较小值;克压=克者减被克者(不小于0)。启发式,非古法公式。",
      },
    },
    ziwei: {
      fiveElementBureau: zw.juName,
      ming: ZHI[zw.ming],
      shen: ZHI[zw.shen],
      birthYearTransformations: zw.sihua,
      palaces: zw.pal.map((p) => ({
        branch: ZHI[p.b],
        name: p.name,
        stem: GAN[p.stem],
        isMing: !!p.isMing,
        isShen: !!p.isShen,
        majorLimit: p.dx || null,
        stars: p.stars.map((s) => tjSan(s)),
      })),
      flyingTransformations: net.edges
        .filter((e) => e.layer === "ben")
        .map((e) => ({
          from: zw.pal[e.from].name,
          stem: GAN[e.stem],
          type: e.h,
          star: e.star,
          to: e.to == null ? null : zw.pal[e.to].name,
          self: e.self,
        })),
    },
    engine: { qimen: tjSan(R.qm), liuren: tjSan(R.lr), meihua: tjSan(R.mh), astro: tjSan(R.astro) },
  };
  if (typeof a2Chart === "function") {
    try {
      const W = a2Chart(R.t.jdUT, +R.opt.lon || 120, +R.opt.lat || 24.5, "placidus");
      out.western = {
        houseSystem: "placidus",
        asc: W.A.asc,
        mc: W.A.mc,
        cusps: W.cusps,
        planets: W.planets.map((p) => ({
          name: p.n,
          lon: p.lon,
          sign: A2_SIGN[p.sign],
          house: p.house,
          retrograde: !!p.retro,
        })),
        aspects: tjSan(W.aspects),
      };
    } catch (e) {
      out.western = null;
    }
  }
  if (typeof v2Chart === "function") {
    try {
      const V = v2Chart(R.t.jdUT, +R.opt.lon || 120, +R.opt.lat || 24.5);
      out.vedic = {
        ayanamsa: V.ay,
        lagna: { sidereal: V.lagna.sid, sign: A2_SIGN[V.lagna.sign] },
        planets: V.planets.map((p) => ({
          name: p.n,
          sidereal: p.sid,
          sign: A2_SIGN[p.sign],
          nakshatra: p.nak.name,
          pada: p.nak.pada,
          navamsaSign: A2_SIGN[p.nv],
        })),
      };
    } catch (e) {
      out.vedic = null;
    }
  }
  return tjSan(out);
}
/* 状态码:JSON → UTF-8 → base64url(不加密,只是编码) */
function tjEnc(obj) {
  const s = JSON.stringify(obj),
    b =
      typeof Buffer !== "undefined"
        ? Buffer.from(s, "utf8").toString("base64")
        : btoa(unescape(encodeURIComponent(s)));
  return b.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function tjDec(code) {
  try {
    let b = String(code).trim().replace(/-/g, "+").replace(/_/g, "/");
    while (b.length % 4) b += "=";
    const s =
      typeof Buffer !== "undefined"
        ? Buffer.from(b, "base64").toString("utf8")
        : decodeURIComponent(escape(atob(b)));
    return JSON.parse(s);
  } catch (e) {
    return null;
  }
}
/* 从任意文本里找出状态码:完整链接、#tj1=…、裸码、导出的 JSON */
function tjParseAny(text) {
  text = String(text || "").trim();
  if (!text) return null;
  if (text[0] === "{") {
    try {
      const j = JSON.parse(text);
      if (j && j.schema && String(j.schema).startsWith("tianjipan.chart") && j.input) {
        const i = j.input,
          c = i.civil;
        return {
          v: 1,
          prof: {
            name: i.name || "",
            gender: i.gender === "F" ? "0" : "1",
            dt: `${String(c.y).padStart(4, "0")}-${String(c.m).padStart(2, "0")}-${String(c.d).padStart(2, "0")}T${String(c.h).padStart(2, "0")}:${String(c.mi).padStart(2, "0")}`,
            solar: !!i.trueSolarTime,
            lon: i.location && i.location.lon,
            lat: i.location && i.location.lat,
          },
          fromJson: true,
        };
      }
      if (j && j.v === 1) return j;
    } catch (e) {}
    return null;
  }
  const m = /tj1=([A-Za-z0-9_\-]+)/.exec(text),
    code = m ? m[1] : /^[A-Za-z0-9_\-]{12,}$/.test(text) ? text : null;
  const o = code && tjDec(code);
  return o && o.v === 1 ? o : null;
}

/* 星表与星官连线:取自 d3-celestial(Olaf Frohn,BSD-3-Clause 许可);中国星官源自 Stellarium 中国星空文化;坐标为 J2000 赤经/赤纬(度)。
   Copyright (c) 2015, Olaf Frohn. All rights reserved. Redistribution and use in source and binary forms, with or without modification, are permitted provided that the conditions of the BSD 3-Clause License are met. */

/* =====================================================================
   关系网:滚轮缩放(以光标为中心)· 按住空白处拖动平移 · 选中后只高亮相关的人与关系,并让关系线流动
   节点拖动、点选沿用原有逻辑;这里只在外面加一层。
   ===================================================================== */
NET.vb = NET.vb || null; /* {x,y,w,h,W,H}:当前视窗;W/H 记录原始画布大小,布局改变就作废 */
function netVbApply(svg) {
  const W = +svg.dataset.w,
    H = +svg.dataset.h;
  if (!W) return;
  if (!NET.vb || NET.vb.W !== W || NET.vb.H !== H) NET.vb = { x: 0, y: 0, w: W, h: H, W, H };
  const v = NET.vb;
  svg.setAttribute(
    "viewBox",
    `${v.x.toFixed(1)} ${v.y.toFixed(1)} ${v.w.toFixed(1)} ${v.h.toFixed(1)}`,
  );
  const z = $("#netZoom");
  if (z) z.textContent = Math.round((W / v.w) * 100) + "%";
}
function netHi() {
  const svg = $("#netSvg");
  if (!svg) return;
  const s = NET.sel;
  svg.classList.toggle("has-sel", !!s);
  $$(".nd,.ed", svg).forEach((e) => e.classList.remove("rel"));
  if (!s) return;
  const D = netData(),
    ids = new Set();
  let eids = new Set();
  if (s.t === "p") {
    ids.add(s.id);
    D.rels.forEach((r) => {
      if (r.a === s.id || r.b === s.id) {
        eids.add(r.id);
        ids.add(r.a);
        ids.add(r.b);
      }
    });
  } else {
    const r = D.rels.find((x) => x.id === s.id);
    if (r) {
      eids.add(r.id);
      ids.add(r.a);
      ids.add(r.b);
    }
  }
  $$(".nd", svg).forEach((n) => {
    if (ids.has(n.dataset.id)) n.classList.add("rel");
  });
  $$(".ed", svg).forEach((e) => {
    if (eids.has(e.dataset.rid)) e.classList.add("rel");
  });
}
const _netRedraw = netRedraw;
netRedraw = function (D, lay) {
  _netRedraw(D, lay);
  netHi();
};
const _netBindAll = netBindAll;
netBindAll = function (D, lay) {
  _netBindAll(D, lay);
  const svg = $("#netSvg");
  if (!svg) return;
  svg.dataset.w = lay.W;
  svg.dataset.h = lay.H;
  netVbApply(svg);
  netHi();
  /* 缩放条 */
  const tools = $("#pane-net .net-tools");
  if (tools && !$("#netZoom")) {
    tools.insertAdjacentHTML(
      "beforeend",
      '<span class="net-zm"><button class="gbtn sm" id="netFit" title="恢复整张网">适应</button><b id="netZoom">100%</b></span><span class="dim sm net-hint">滚轮缩放 · 拖动空白处平移 · 拖动人物调整位置 · 点人或关系线高亮</span>',
    );
    $("#netFit").onclick = () => {
      NET.vb = null;
      netVbApply(svg);
    };
    netVbApply(svg);
  }
  svg.addEventListener(
    "wheel",
    (e) => {
      e.preventDefault();
      const v = NET.vb,
        k = Math.exp(Math.max(-120, Math.min(120, e.deltaY)) * 0.0016),
        nw = Math.max(v.W / 6, Math.min(v.W * 2.5, v.w * k));
      const p = netSvgPt(svg, e),
        r = nw / v.w;
      v.x = p.x - (p.x - v.x) * r;
      v.y = p.y - (p.y - v.y) * r;
      v.w = nw;
      v.h = v.h * r;
      netVbApply(svg);
    },
    { passive: false },
  );
  let pan = null;
  svg.addEventListener(
    "pointerdown",
    (e) => {
      if (
        e.button === 1 ||
        (e.button === 0 && !e.target.closest(".nd") && !e.target.closest(".ed"))
      ) {
        const r = svg.getBoundingClientRect();
        pan = {
          sx: e.clientX,
          sy: e.clientY,
          x0: NET.vb.x,
          y0: NET.vb.y,
          k: NET.vb.w / r.width,
          moved: false,
          id: e.pointerId,
        };
        if (e.button === 1) e.preventDefault();
      }
    },
    true,
  );
  svg.addEventListener(
    "pointermove",
    (e) => {
      if (!pan || e.pointerId !== pan.id) return;
      const dx = e.clientX - pan.sx,
        dy = e.clientY - pan.sy;
      if (!pan.moved && Math.hypot(dx, dy) < 5) return;
      if (!pan.moved) {
        pan.moved = true;
        try {
          svg.setPointerCapture(e.pointerId);
        } catch (_) {}
        svg.classList.add("dv-grab");
      }
      NET.vb.x = pan.x0 - dx * pan.k;
      NET.vb.y = pan.y0 - dy * pan.k;
      netVbApply(svg);
    },
    true,
  );
  svg.addEventListener(
    "pointerup",
    (e) => {
      if (!pan || e.pointerId !== pan.id) return;
      const mv = pan.moved;
      pan = null;
      svg.classList.remove("dv-grab");
      if (mv) {
        e.stopImmediatePropagation();
        e.stopPropagation();
      }
    },
    true,
  );
  svg.addEventListener(
    "pointercancel",
    () => {
      pan = null;
      svg.classList.remove("dv-grab");
    },
    true,
  );
};

/* =====================================================================
   周易 · 起卦(可直接使用)
   方式:铜钱(三枚,六次)· 数字(两数 + 时辰定动爻)· 时间(梅花年月日时)· 手动点爻
   输出:本卦 / 互卦 / 变卦;按朱熹《易学启蒙》变爻规则指出该读哪一句;附白话提示
   爻值:6 老阴(动)· 7 少阳 · 8 少阴 · 9 老阳(动),由下往上记
   ===================================================================== */
const ZYC = { m: "coin", v: [], coins: [], q: "", a: "", b: "" };
const ZY_POS = [
  "初爻:事情刚起步、基层、根基",
  "二爻:内部、自身所在的位置、主办者",
  "三爻:内外交界、转折处,常有风险",
  "四爻:接近上层、外部环境、进退之间",
  "五爻:主导位、关键决策者、全局",
  "上爻:事情的尽头、过度、收尾",
];
const zyRand = () => {
  try {
    const a = new Uint32Array(1);
    crypto.getRandomValues(a);
    return a[0] / 4294967296;
  } catch (e) {
    return Math.random();
  }
};
function zyCoinToss() {
  const c = [0, 0, 0].map(() => (zyRand() < 0.5 ? 3 : 2));
  return { c, v: c.reduce((a, b) => a + b, 0) };
} /* 字=3 背=2:6 老阴 7 少阳 8 少阴 9 老阳 */
const zyBit = (v) => (v === 7 || v === 9 ? 1 : 0),
  zyMv = (v) => v === 6 || v === 9;
function zyFromNums(up, lo, mvPos) {
  const l = hexFromTri(up, lo);
  return l.map((b, i) => (i === mvPos - 1 ? (b ? 9 : 6) : b ? 7 : 8));
}
function zyTimeCast() {
  const n = nowBJ();
  let Rn;
  try {
    Rn = compute({ y: n.y, m: n.m, d: n.d, h: n.h, mi: n.mi, s: 0 });
  } catch (e) {
    return null;
  }
  const yz = Rn.bz.pill[0].b + 1,
    hz = Rn.bz.pill[3].b + 1,
    lm = Rn.lunar.month,
    ld = Rn.lunar.day,
    s1 = yz + lm + ld,
    s2 = s1 + hz;
  return {
    v: zyFromNums(s1 % 8 || 8, s2 % 8 || 8, s2 % 6 || 6),
    how: `年支${ZHI[yz - 1]}(${yz})+ 农历${lm}月 + ${ld}日 = ${s1} → 上卦 ${s1}÷8 余 ${s1 % 8 || 8};再加时支${ZHI[hz - 1]}(${hz})= ${s2} → 下卦余 ${s2 % 8 || 8},动爻 ${s2}÷6 余 ${s2 % 6 || 6}`,
  };
}
function zyRule(v, ben, bian) {
  const mv = [0, 1, 2, 3, 4, 5].filter((i) => zyMv(v[i])),
    n = mv.length,
    B = ZY_BY[ben],
    G = ZY_BY[bian],
    keep = [0, 1, 2, 3, 4, 5].filter((i) => !zyMv(v[i]));
  const yl = (H, i) => ({ h: H.name, t: H.yao[i], x: H.xx[i], pos: i }),
    gl = (H) => ({ h: H.name, t: "卦辞:" + H.gua });
  if (n === 0) return { rule: "没有动爻:看本卦卦辞。", read: [gl(B)] };
  if (n === 1) return { rule: "一爻动:看本卦这一动爻的爻辞。", read: [yl(B, mv[0])] };
  if (n === 2)
    return {
      rule: "二爻动:看本卦两个动爻的爻辞,以上面那一爻为主。",
      read: [yl(B, mv[1]), yl(B, mv[0])],
      main: 0,
    };
  if (n === 3)
    return {
      rule: "三爻动:看本卦与变卦的卦辞,以本卦为主(本卦为“贞”、变卦为“悔”)。",
      read: [gl(B), gl(G)],
      main: 0,
    };
  if (n === 4)
    return {
      rule: "四爻动:看变卦中两个不动爻的爻辞,以下面那一爻为主。",
      read: [yl(G, keep[0]), yl(G, keep[1])],
      main: 0,
    };
  if (n === 5) return { rule: "五爻动:看变卦中唯一不动那一爻的爻辞。", read: [yl(G, keep[0])] };
  if (ben === "111111")
    return { rule: "六爻全动(乾):看“用九”。", read: [{ h: "乾", t: B.yao[6], x: B.xx[6] }] };
  if (ben === "000000")
    return { rule: "六爻全动(坤):看“用六”。", read: [{ h: "坤", t: B.yao[6], x: B.xx[6] }] };
  return { rule: "六爻全动:看变卦的卦辞。", read: [gl(G)] };
}
function zyHexCard(id, label, mv) {
  const I = zyInfo(id);
  return `<div class="zc-h"><small>${label}</small><div class="zc-sym">${I.sym}</div>${zyDraw(id, mv)}<b>${I.name}</b><span class="dim sm">${I.full}</span>${I.txt ? `<p class="zc-txt">${esc(I.txt)}</p>` : ""}<button type="button" class="chip" data-zyopen="${id}" data-mv="${(mv || []).join(",")}">看原文</button></div>`;
}
function zyCastResult() {
  const v = ZYC.v;
  if (v.length < 6)
    return `<p class="dim">${ZYC.m === "coin" ? `已摇 ${v.length}/6 次。每次三枚铜钱:字为 3、背为 2,相加得 6/7/8/9,由下往上记爻。` : "设置好后点“起卦”。"}</p>`;
  const ben = v.map(zyBit).join(""),
    mv = [0, 1, 2, 3, 4, 5].filter((i) => zyMv(v[i])),
    bian = v.map((x) => (x === 9 ? 0 : x === 6 ? 1 : zyBit(x))).join(""),
    hu = zyHu(ben),
    R0 = zyRule(v, ben, bian);
  const lines = v
    .map(
      (x, i) =>
        `<tr class="${zyMv(x) ? "mv" : ""}"><th>${ZY_YAONAME[i]}爻</th><td>${x}</td><td>${{ 6: "老阴(动,阴变阳)", 7: "少阳", 8: "少阴", 9: "老阳(动,阳变阴)" }[x]}</td></tr>`,
    )
    .reverse()
    .join("");
  const B = zyInfo(ben),
    G = zyInfo(bian);
  const plain = [
    `<b>现状</b>(本卦「${B.name}」):${B.txt || B.gua}`,
    mv.length
      ? `<b>走向</b>(变卦「${G.name}」):${G.txt || G.gua}`
      : "<b>没有动爻</b>:局面相对稳定,变化不大",
    `<b>过程</b>(互卦「${zyInfo(hu).name}」):事情内部的演变,常用来看中间经过`,
  ];
  mv.forEach((i) => plain.push(`<b>动在${ZY_YAONAME[i]}爻</b>:${ZY_POS[i]}`));
  return `<div class="zc-q">${ZYC.q ? `所问:<b>${esc(ZYC.q)}</b>` : '<span class="dim">未填写所问之事</span>'} · ${mv.length ? `${mv.length} 个动爻` : "无动爻"}</div>
   <div class="zc-hex">${zyHexCard(ben, "本卦 · 现状", mv)}${zyHexCard(hu, "互卦 · 过程", [])}${zyHexCard(bian, mv.length ? "变卦 · 走向" : "变卦(无动爻,同本卦)", [])}</div>
   <div class="zc-read"><h4 class="gl">该读哪一句</h4><p class="zc-rule">${R0.rule}</p>${R0.read.map((r, i) => `<div class="zc-line${R0.main === i ? " main" : ""}"><small>${r.h}${R0.main === i && R0.read.length > 1 ? " · 为主" : ""}</small><p>${esc(r.t)}</p>${r.x ? `<p class="dim sm">小象:${esc(r.x)}</p>` : ""}${r.pos != null ? `<p class="dim sm">爻位白话:${ZY_POS[r.pos]}</p>` : ""}</div>`).join("")}</div>
   <div class="zc-plain"><h4 class="gl">白话</h4><ul>${plain.map((x) => `<li>${x}</li>`).join("")}</ul><p class="dim sm">卦的白话只给到“卦”这一级的概括;爻辞原文古奥,建议结合本卦上下文与注本理解。周易占筮属传统文化,结论仅供参考。</p></div>
   <details class="ph-note"><summary>六爻明细</summary><div class="tbl-wrap"><table class="tbl"><tbody>${lines}</tbody></table></div></details>
   <div class="fx-chips"><button type="button" class="chip" id="zcCopy">复制结果</button><button type="button" class="chip" id="zcAgain">重新起卦</button></div>`;
}
function zyCastHTML() {
  const m = ZYC.m,
    tab = (k, n) =>
      `<button type="button" class="chip${m === k ? " on" : ""}" data-zcm="${k}">${n}</button>`;
  let ctl = "";
  if (m === "coin")
    ctl = `<div class="zc-coins">${ZYC.coins.length ? ZYC.coins[ZYC.coins.length - 1].map((c) => `<span class="zc-coin ${c === 3 ? "z" : "b"}">${c === 3 ? "字" : "背"}</span>`).join("") : '<span class="dim sm">心里默想所问之事,然后点“摇一次”,共六次</span>'}</div><button type="button" class="gbtn" id="zcToss"${ZYC.v.length >= 6 ? " disabled" : ""}>摇一次(${ZYC.v.length}/6)</button><button type="button" class="gbtn sm" id="zcToss6"${ZYC.v.length >= 6 ? " disabled" : ""}>一次摇完</button>`;
  else if (m === "num")
    ctl = `<label>第一个数 <input type="number" id="zcA" min="1" value="${esc(ZYC.a)}" placeholder="如 3"></label><label>第二个数 <input type="number" id="zcB" min="1" value="${esc(ZYC.b)}" placeholder="如 8"></label><button type="button" class="gbtn" id="zcNum">起卦</button><span class="dim sm">第一个数定上卦、第二个数定下卦(除以 8 取余);两数之和加此刻时辰数除以 6 取余定动爻。</span>`;
  else if (m === "time")
    ctl = `<button type="button" class="gbtn" id="zcTime">用此刻起卦</button><span class="dim sm">梅花易数时间起卦:年支 + 农历月 + 日 定上卦,再加时支定下卦与动爻。</span>`;
  else
    ctl = `<div class="zc-man">${[5, 4, 3, 2, 1, 0]
      .map((i) => {
        const x = ZYC.v[i] || 7;
        return `<button type="button" class="zc-y v${x}" data-zy="${i}" title="点一下切换:少阳 → 少阴 → 老阳(动)→ 老阴(动)"><i class="${zyBit(x) ? "y" : "n"}"><b></b><b></b></i><small>${ZY_YAONAME[i]} · ${x}${zyMv(x) ? " 动" : ""}</small></button>`;
      })
      .join(
        "",
      )}</div><span class="dim sm">已有卦象(如别人给你的卦)时用:点每一爻切换阴阳与动静。</span>`;
  return `<div class="panel blk zc">${phHead("周易起卦", "铜钱 · 数字 · 时间 · 手动 —— 起卦后指出该读哪一句")}
   <label class="zc-qin">所问之事 <input type="text" id="zcQ" maxlength="60" value="${esc(ZYC.q)}" placeholder="一事一占,写清楚,如:这次换工作是否合适"></label>
   <div class="zc-tabs">${tab("coin", "铜钱摇卦")}${tab("num", "数字起卦")}${tab("time", "时间起卦")}${tab("man", "手动点爻")}</div>
   <div class="zc-ctl">${ctl}</div>${ZYC.how ? `<p class="dim sm">${esc(ZYC.how)}</p>` : ""}
   <div class="zc-out" id="zcOut">${zyCastResult()}</div></div>`;
}
function zyCastBind() {
  const re = () => {
    const w = $("#zcWrap");
    if (w) {
      w.innerHTML = zyCastHTML();
      zyCastBind();
    }
  };
  const q = $("#zcQ");
  if (q)
    q.oninput = () => {
      ZYC.q = q.value;
    };
  $$("[data-zcm]").forEach(
    (b) =>
      (b.onclick = () => {
        ZYC.m = b.dataset.zcm;
        ZYC.v = ZYC.m === "man" ? [7, 7, 7, 7, 7, 7] : [];
        ZYC.coins = [];
        ZYC.how = "";
        re();
      }),
  );
  const t = $("#zcToss");
  if (t)
    t.onclick = () => {
      const r = zyCoinToss();
      ZYC.coins.push(r.c);
      ZYC.v.push(r.v);
      re();
    };
  const t6 = $("#zcToss6");
  if (t6)
    t6.onclick = () => {
      while (ZYC.v.length < 6) {
        const r = zyCoinToss();
        ZYC.coins.push(r.c);
        ZYC.v.push(r.v);
      }
      re();
    };
  const nb = $("#zcNum");
  if (nb)
    nb.onclick = () => {
      const a = parseInt($("#zcA").value),
        b = parseInt($("#zcB").value);
      if (!(a > 0 && b > 0)) {
        toast("请填两个正整数");
        return;
      }
      ZYC.a = a;
      ZYC.b = b;
      const hz = nowBJ().h === 23 ? 1 : (Math.floor((nowBJ().h + 1) / 2) % 12) + 1,
        s = a + b + hz;
      ZYC.v = zyFromNums(a % 8 || 8, b % 8 || 8, s % 6 || 6);
      ZYC.how = `上卦 ${a}÷8 余 ${a % 8 || 8},下卦 ${b}÷8 余 ${b % 8 || 8};(${a}+${b}+时辰数 ${hz})÷6 余 ${s % 6 || 6} 为动爻`;
      re();
    };
  const tb = $("#zcTime");
  if (tb)
    tb.onclick = () => {
      const r = zyTimeCast();
      if (!r) {
        toast("此刻无法排盘");
        return;
      }
      ZYC.v = r.v;
      ZYC.how = r.how;
      re();
    };
  $$("[data-zy]").forEach(
    (b) =>
      (b.onclick = () => {
        const i = +b.dataset.zy,
          cyc = { 7: 8, 8: 9, 9: 6, 6: 7 };
        ZYC.v[i] = cyc[ZYC.v[i] || 7];
        re();
      }),
  );
  $$("[data-zyopen]").forEach(
    (b) =>
      (b.onclick = () => {
        ZYS.sel = b.dataset.zyopen;
        ZYS.mv = b.dataset.mv ? b.dataset.mv.split(",").map(Number) : [];
        renderZy();
        setTimeout(() => {
          const d = $("#pane-zy .zydetail");
          if (d) d.scrollIntoView({ block: "start", behavior: "smooth" });
        }, 60);
      }),
  );
  const cp = $("#zcCopy");
  if (cp)
    cp.onclick = () => {
      const t = $("#zcOut").innerText;
      try {
        navigator.clipboard.writeText(t);
        toast("已复制");
      } catch (e) {
        toast("复制失败,请手动选择文字");
      }
    };
  const ag = $("#zcAgain");
  if (ag)
    ag.onclick = () => {
      ZYC.v = ZYC.m === "man" ? [7, 7, 7, 7, 7, 7] : [];
      ZYC.coins = [];
      ZYC.how = "";
      re();
    };
}
const _renderZy = renderZy;
renderZy = function () {
  _renderZy();
  const pane = $("#pane-zy");
  if (!pane) return;
  const w = document.createElement("div");
  w.id = "zcWrap";
  w.innerHTML = zyCastHTML();
  pane.insertBefore(w, pane.firstChild);
  zyCastBind();
  const h = pane.querySelector(".panel.blk:not(.zc) > h3.sec");
  if (h && h.textContent.includes("六十四卦原文"))
    h.outerHTML = phHead("六十四卦原文", "卦辞 · 彖传 · 大象 · 爻辞 · 小象;点格子查阅,可搜索");
};

/* =====================================================================
   经络 · 人体图谱(自绘示意;依据《黄帝内经》《难经》等公开古籍记载,不复制任何书籍插图)
   1) 奇经八脉 / 五脏六腑 / 三焦与三丹田 三个图层,正面 + 背面,点部位看说明
   2) 命主身体倾向:按命盘五行分布对应脏腑系统(传统文化观念,不是医学诊断)
   3) 今日子午流注作息表:标出当前时辰与命主偏弱五行相关的时辰
   ===================================================================== */
const BD = { layer: "qj", sel: null };
const BD_WXC = {
  木: "var(--wood)",
  火: "var(--fire)",
  土: "var(--earth)",
  金: "var(--metal)",
  水: "var(--water)",
  相火: "var(--fire)",
};
/* 人形轮廓:正面中线 x=160,背面中线 x=470 */
function bdFigure(cx, back) {
  const o = cx - 160,
    P = (x, y) => `${x + o},${y}`;
  const body = `M${P(148, 92)} L${P(148, 108)} C${P(128, 112)} ${P(104, 114)} ${P(96, 126)} C${P(86, 150)} ${P(80, 210)} ${P(74, 260)} C${P(70, 290)} ${P(68, 320)} ${P(70, 338)} L${P(82, 338)} C${P(88, 300)} ${P(96, 250)} ${P(108, 196)} L${P(114, 250)} C${P(112, 280)} ${P(110, 310)} ${P(112, 336)} C${P(114, 400)} ${P(116, 470)} ${P(118, 540)} L${P(152, 540)} C${P(154, 470)} ${P(156, 400)} ${P(158, 350)} L${P(162, 350)} C${P(164, 400)} ${P(166, 470)} ${P(168, 540)} L${P(202, 540)} C${P(204, 470)} ${P(206, 400)} ${P(208, 336)} C${P(210, 310)} ${P(208, 280)} ${P(206, 250)} L${P(212, 196)} C${P(224, 250)} ${P(232, 300)} ${P(238, 338)} L${P(250, 338)} C${P(252, 320)} ${P(250, 290)} ${P(246, 260)} C${P(240, 210)} ${P(234, 150)} ${P(224, 126)} C${P(216, 114)} ${P(192, 112)} ${P(172, 108)} L${P(172, 92)} Z`;
  return `<path d="${body}" class="bd-body"/><circle cx="${cx}" cy="58" r="34" class="bd-body"/><text x="${cx}" y="560" text-anchor="middle" class="bd-cap">${back ? "背面" : "正面"}</text>`;
}
/* ---- 奇经八脉 ---- */
const BD_QJ = [
  {
    k: "ren",
    n: "任脉",
    c: "#5aa6c8",
    d: "M160,338 L160,86",
    src: "《难经·二十八难》:任脉者,起于中极之下,以上毛际,循腹里,上关元,至咽喉。",
    plain: "走在身体正面的正中线,从会阴一直上到下唇下方的承浆。古人称它“阴脉之海”,总管全身的阴经。",
    pts: [
      ["会阴", 160, 338],
      ["关元", 160, 300],
      ["神阙(脐)", 160, 270],
      ["中脘", 160, 215],
      ["膻中", 160, 160],
      ["天突", 160, 114],
      ["承浆", 160, 86],
    ],
  },
  {
    k: "du",
    n: "督脉",
    c: "#d9b25f",
    d: "M470,330 L470,118 L470,98 C470,60 470,40 470,24",
    src: "《难经·二十八难》:督脉者,起于下极之俞,并于脊里,上至风府,入属于脑。",
    plain: "沿着后背正中的脊柱往上走,过后颈上到头顶的百会。古人称它“阳脉之海”,总督全身的阳经。",
    pts: [
      ["长强", 470, 330],
      ["命门", 470, 262],
      ["至阳", 470, 190],
      ["大椎", 470, 118],
      ["风府", 470, 96],
      ["百会", 470, 24],
    ],
  },
  {
    k: "chong",
    n: "冲脉",
    c: "#c8452e",
    d: "M154,336 C150,300 148,270 150,230 C152,200 152,175 150,152 M166,336 C170,300 172,270 170,230 C168,200 168,175 170,152",
    src: "《难经·二十八难》:冲脉者,起于气冲,并足阳明之经,夹脐上行,至胸中而散也。",
    plain:
      "从小腹出发,贴着肚脐两侧往上走,到胸中散开。古人称它“十二经脉之海”“血海”,与妇女月经关系最密切。",
    pts: [
      ["气冲", 154, 336],
      ["夹脐", 150, 270],
      ["胸中", 150, 152],
    ],
  },
  {
    k: "dai",
    n: "带脉",
    c: "#4fae8f",
    d: "M114,262 C130,276 190,276 206,262 C190,250 130,250 114,262 M424,262 C440,276 500,276 516,262 C500,250 440,250 424,262",
    src: "《难经·二十八难》:带脉者,起于季胁,回身一周。",
    plain: "像一条腰带横着环绕腰腹一圈,是全身唯一横行的经脉,约束纵行的诸经。",
    pts: [["带脉(侧腰)", 114, 262]],
  },
  {
    k: "yinq",
    n: "阴跷脉",
    c: "#9a7ad0",
    d: "M154,532 C152,480 152,420 154,360 C156,300 156,220 156,140 C156,110 154,80 150,58",
    src: "《难经·二十八难》:阴跷脉者,亦起于跟中,循内踝上行,至咽喉,交贯冲脉。",
    plain: "从脚跟内侧沿下肢内侧上行,经胸腹到咽喉、内眼角。与睡眠、眼睛开合有关的传统说法很多。",
    pts: [
      ["照海(内踝下)", 154, 532],
      ["睛明(内眼角)", 150, 58],
    ],
  },
  {
    k: "yangq",
    n: "阳跷脉",
    c: "#e0904a",
    d: "M432,532 C430,470 428,400 428,336 C428,280 430,220 434,160 C440,120 448,96 452,82",
    src: "《难经·二十八难》:阳跷脉者,起于跟中,循外踝上行,入风池。",
    plain: "从脚跟外侧沿下肢外侧上行,经身侧、肩到后颈的风池。传统上与“醒”、肢体活动相关。",
    pts: [
      ["申脉(外踝下)", 432, 532],
      ["风池", 452, 82],
    ],
  },
  {
    k: "yinw",
    n: "阴维脉",
    c: "#6fb7a8",
    d: "M148,440 C146,380 146,320 146,280 C146,220 150,170 156,120 C158,108 160,100 160,96",
    src: "《难经·二十八难》:阳维、阴维者,维络于身,溢蓄不能环流灌溉诸经者也。阴维起于诸阴交也。",
    plain: "从小腿内侧起,沿腹部上行到咽喉,把全身的阴经联络在一起。",
    pts: [
      ["筑宾(小腿内)", 148, 440],
      ["廉泉(喉)", 160, 96],
    ],
  },
  {
    k: "yangw",
    n: "阳维脉",
    c: "#b9a24f",
    d: "M434,520 C432,450 430,380 430,320 C430,240 436,170 444,128 C452,100 462,92 470,90",
    src: "《难经·二十八难》:阳维起于诸阳会也。",
    plain: "从脚外侧起,沿下肢外侧、身侧上到肩、头后,把全身的阳经联络在一起。",
    pts: [
      ["金门(足外)", 434, 520],
      ["哑门(后颈)", 470, 90],
    ],
  },
];
/* ---- 五脏六腑 ---- */
const BD_ZF = [
  {
    k: "xin",
    n: "心",
    wx: "火",
    t: "脏",
    biao: "小肠",
    jl: "手少阴心经",
    sc: "午",
    qiao: "舌",
    hua: "面",
    zhu: "主血脉、藏神",
    zhi: "喜",
    ji: "夏",
    x: 163,
    y: 170,
    r: 13,
  },
  {
    k: "fei",
    n: "肺",
    wx: "金",
    t: "脏",
    biao: "大肠",
    jl: "手太阴肺经",
    sc: "寅",
    qiao: "鼻",
    hua: "毛",
    zhu: "主气、司呼吸、通调水道",
    zhi: "悲(忧)",
    ji: "秋",
    x: 160,
    y: 150,
    r: 0,
    shape:
      "M128,132 C118,150 118,184 132,192 C144,196 148,170 148,140 Z M192,132 C202,150 202,184 188,192 C176,196 172,170 172,140 Z",
  },
  {
    k: "gan",
    n: "肝",
    wx: "木",
    t: "脏",
    biao: "胆",
    jl: "足厥阴肝经",
    sc: "丑",
    qiao: "目",
    hua: "爪",
    zhu: "藏血、主疏泄",
    zhi: "怒",
    ji: "春",
    shape: "M118,206 C126,198 160,198 168,206 C166,222 150,232 124,228 C118,222 116,214 118,206 Z",
    x: 140,
    y: 214,
  },
  {
    k: "pi",
    n: "脾",
    wx: "土",
    t: "脏",
    biao: "胃",
    jl: "足太阴脾经",
    sc: "巳",
    qiao: "口",
    hua: "唇",
    zhu: "主运化、统血",
    zhi: "思",
    ji: "长夏",
    x: 190,
    y: 212,
    r: 9,
  },
  {
    k: "shen",
    n: "肾",
    wx: "水",
    t: "脏",
    biao: "膀胱",
    jl: "足少阴肾经",
    sc: "酉",
    qiao: "耳及二阴",
    hua: "发",
    zhu: "藏精、主水、纳气",
    zhi: "恐",
    ji: "冬",
    shape:
      "M446,236 C438,240 438,262 448,266 C456,266 458,244 452,238 Z M494,236 C502,240 502,262 492,266 C484,266 482,244 488,238 Z",
    x: 470,
    y: 252,
  },
  {
    k: "xb",
    n: "心包",
    wx: "相火",
    t: "脏",
    biao: "三焦",
    jl: "手厥阴心包经",
    sc: "戌",
    qiao: "—",
    hua: "—",
    zhu: "护卫心脏,“代心受邪”",
    zhi: "喜乐",
    ji: "—",
    x: 163,
    y: 170,
    r: 19,
    ring: 1,
  },
  {
    k: "dan",
    n: "胆",
    wx: "木",
    t: "腑",
    biao: "肝",
    jl: "足少阳胆经",
    sc: "子",
    qiao: "—",
    hua: "—",
    zhu: "贮藏排泄胆汁,主决断",
    zhi: "—",
    ji: "—",
    x: 150,
    y: 228,
    r: 5,
  },
  {
    k: "wei",
    n: "胃",
    wx: "土",
    t: "腑",
    biao: "脾",
    jl: "足阳明胃经",
    sc: "辰",
    qiao: "—",
    hua: "—",
    zhu: "受纳腐熟水谷",
    zhi: "—",
    ji: "—",
    x: 176,
    y: 224,
    r: 11,
  },
  {
    k: "xc",
    n: "小肠",
    wx: "火",
    t: "腑",
    biao: "心",
    jl: "手太阳小肠经",
    sc: "未",
    qiao: "—",
    hua: "—",
    zhu: "受盛化物、泌别清浊",
    zhi: "—",
    ji: "—",
    x: 160,
    y: 276,
    r: 14,
  },
  {
    k: "dc",
    n: "大肠",
    wx: "金",
    t: "腑",
    biao: "肺",
    jl: "手阳明大肠经",
    sc: "卯",
    qiao: "—",
    hua: "—",
    zhu: "传导糟粕",
    zhi: "—",
    ji: "—",
    shape: "M132,300 L132,250 L188,250 L188,300",
    x: 132,
    y: 274,
    line: 1,
  },
  {
    k: "pg",
    n: "膀胱",
    wx: "水",
    t: "腑",
    biao: "肾",
    jl: "足太阳膀胱经",
    sc: "申",
    qiao: "—",
    hua: "—",
    zhu: "贮尿排尿",
    zhi: "—",
    ji: "—",
    x: 160,
    y: 320,
    r: 9,
  },
  {
    k: "sj",
    n: "三焦",
    wx: "相火",
    t: "腑",
    biao: "心包",
    jl: "手少阳三焦经",
    sc: "亥",
    qiao: "—",
    hua: "—",
    zhu: "通行元气、运行水液(见“三焦·丹田”图层)",
    zhi: "—",
    ji: "—",
    x: 216,
    y: 250,
    r: 0,
    tag: 1,
  },
];
/* ---- 三焦 · 三丹田 ---- */
const BD_SJ = [
  {
    k: "sj1",
    n: "上焦",
    y0: 116,
    y1: 180,
    c: "#e0655a",
    txt: "膈以上,含心、肺。《灵枢·营卫生会》:上焦如雾——像雾一样把气血宣散到全身。",
  },
  {
    k: "sj2",
    n: "中焦",
    y0: 180,
    y1: 248,
    c: "#d9b25f",
    txt: "膈以下、脐以上,含脾、胃(肝胆常一并论)。中焦如沤——像浸泡发酵一样腐熟、运化饮食。",
  },
  {
    k: "sj3",
    n: "下焦",
    y0: 248,
    y1: 338,
    c: "#5aa6c8",
    txt: "脐以下,含肾、膀胱、大小肠(后世多把肝肾并入)。下焦如渎——像沟渠一样分别清浊、排出糟粕。",
  },
];
const BD_DT = [
  {
    k: "dt1",
    n: "上丹田",
    x: 160,
    y: 46,
    txt: "在两眉之间向内(印堂、脑中)。道家内丹以为“藏神之府”,修炼中对应“炼神还虚”。",
  },
  {
    k: "dt2",
    n: "中丹田",
    x: 160,
    y: 160,
    txt: "在两乳之间的膻中一带。被视为“藏气之府”,对应“炼气化神”。",
  },
  {
    k: "dt3",
    n: "下丹田",
    x: 160,
    y: 290,
    txt: "在脐下约三寸(关元、气海一带)。被视为“藏精之府”、性命之根,对应“炼精化气”;日常静坐、腹式呼吸多意守于此。",
  },
];
function bdSvg() {
  const L = BD.layer;
  let g = bdFigure(160, false) + bdFigure(470, true);
  g += `<line x1="160" y1="20" x2="160" y2="545" class="bd-mid"/><line x1="470" y1="20" x2="470" y2="545" class="bd-mid"/>`;
  if (L === "qj") {
    BD_QJ.forEach((m) => {
      const on = BD.sel === m.k,
        dim = BD.sel && !on;
      g += `<g class="bd-hit${on ? " on" : ""}" data-bd="${m.k}" style="opacity:${dim ? 0.22 : 1}"><title>${m.n}</title><path d="${m.d}" class="bd-ln" style="stroke:${m.c}"/><path d="${m.d}" class="bd-hitln"/>${m.pts.map(([n, x, y]) => `<circle cx="${x}" cy="${y}" r="3.6" style="fill:${m.c}"/>${on ? `<text x="${x + (x < 315 ? -7 : 7)}" y="${y + 4}" text-anchor="${x < 315 ? "end" : "start"}" class="bd-pt">${n}</text>` : ""}`).join("")}</g>`;
    });
    g += BD_QJ.map(
      (m, i) =>
        `<g class="bd-hit" data-bd="${m.k}"><rect x="${i < 4 ? 262 : 262}" y="${40 + i * 26}" width="78" height="20" rx="10" style="fill:${m.c};fill-opacity:${BD.sel === m.k ? 0.9 : 0.25};stroke:${m.c}"/><text x="301" y="${54 + i * 26}" text-anchor="middle" class="bd-chipt">${m.n}</text></g>`,
    ).join("");
  }
  if (L === "zf") {
    BD_ZF.forEach((o) => {
      const on = BD.sel === o.k,
        c = BD_WXC[o.wx],
        dim = BD.sel && !on && !(BD_ZF.find((z) => z.k === BD.sel) || {}).biao !== o.n;
      const shape = o.shape
        ? o.line
          ? `<path d="${o.shape}" style="fill:none;stroke:${c};stroke-width:6;stroke-opacity:.75"/>`
          : `<path d="${o.shape}" style="fill:${c};fill-opacity:.55;stroke:${c}"/>`
        : o.ring
          ? `<circle cx="${o.x}" cy="${o.y}" r="${o.r}" style="fill:none;stroke:${c};stroke-dasharray:3 3"/>`
          : o.tag
            ? ""
            : `<circle cx="${o.x}" cy="${o.y}" r="${o.r}" style="fill:${c};fill-opacity:.65;stroke:${c}"/>`;
      g += `<g class="bd-hit${on ? " on" : ""}" data-bd="${o.k}"><title>${o.n}(${o.wx})</title>${shape}${o.tag ? `<text x="${o.x}" y="${o.y}" class="bd-tag">三焦 →</text>` : ""}</g>`;
    });
    g += `<text x="315" y="300" text-anchor="middle" class="bd-pt">肾在背面</text>`;
    const lbl = [
      ["肺", 100, 140],
      ["心", 100, 172],
      ["肝", 100, 214],
      ["胆", 100, 236],
      ["大肠", 100, 262],
      ["小肠", 100, 286],
      ["膀胱", 100, 322],
      ["脾", 226, 206],
      ["胃", 226, 228],
    ];
    lbl.forEach(([n, x, y]) => {
      const o = BD_ZF.find((z) => z.n === n);
      g += `<g class="bd-hit" data-bd="${o.k}"><text x="${x}" y="${y}" text-anchor="${x < 160 ? "end" : "start"}" class="bd-lab" style="fill:${BD_WXC[o.wx]}">${n}</text></g>`;
    });
    g += `<g class="bd-hit" data-bd="shen"><text x="512" y="256" class="bd-lab" style="fill:${BD_WXC["水"]}">肾</text></g>`;
  }
  if (L === "sj") {
    BD_SJ.forEach((b) => {
      const on = BD.sel === b.k;
      g += `<g class="bd-hit${on ? " on" : ""}" data-bd="${b.k}"><rect x="98" y="${b.y0}" width="124" height="${b.y1 - b.y0}" style="fill:${b.c};fill-opacity:${on ? 0.42 : 0.18};stroke:${b.c};stroke-dasharray:4 3"/><text x="232" y="${(b.y0 + b.y1) / 2 + 4}" class="bd-lab" style="fill:${b.c}">${b.n}</text></g>`;
    });
    BD_DT.forEach((d) => {
      const on = BD.sel === d.k;
      g += `<g class="bd-hit${on ? " on" : ""}" data-bd="${d.k}"><circle cx="${d.x}" cy="${d.y}" r="${on ? 13 : 10}" class="bd-dt"/><circle cx="${d.x}" cy="${d.y}" r="4" style="fill:var(--gold2)"/><text x="${d.x - 18}" y="${d.y + 4}" text-anchor="end" class="bd-lab" style="fill:var(--gold2)">${d.n}</text></g>`;
    });
  }
  return `<svg id="bdSvg" viewBox="40 0 560 575" role="img" aria-label="人体图谱">${g}</svg>`;
}
function bdInfo() {
  const k = BD.sel;
  if (!k)
    return `<p class="dim sm">${{ qj: "点任一条经脉或右侧名称,看它的走行与古籍原文。", zf: "点脏腑看它的五行、表里、当令时辰、开窍与情志。", sj: "点三焦色带或三丹田,看它们的位置与传统说法。" }[BD.layer]}</p>`;
  const q = BD_QJ.find((x) => x.k === k);
  if (q)
    return `<h4 style="color:${q.c}">${q.n}</h4><p>${q.plain}</p><p class="dim sm">${q.src}</p><p class="dim sm">经过的要穴:${q.pts.map((p) => p[0]).join(" → ")}</p>`;
  const o = BD_ZF.find((x) => x.k === k);
  if (o) {
    const m = JL_MER.findIndex((x) => x.n === o.jl);
    return `<h4 style="color:${BD_WXC[o.wx]}">${o.n} · ${o.t}</h4><div class="tbl-wrap"><table class="tbl"><tbody><tr><th>五行</th><td>${o.wx}</td><th>表里</th><td>${o.t === "脏" ? "与" + o.biao + "相表里" : "与" + o.biao + "相表里"}</td></tr><tr><th>经络</th><td>${o.jl}</td><th>当令</th><td>${o.sc}时${m >= 0 ? " " + JL_MER[m].h : ""}</td></tr><tr><th>开窍</th><td>${o.qiao}</td><th>其华</th><td>${o.hua}</td></tr><tr><th>主</th><td colspan="3">${o.zhu}</td></tr><tr><th>情志</th><td>${o.zhi}</td><th>应季</th><td>${o.ji}</td></tr></tbody></table></div>${m >= 0 ? `<p class="dim sm">${JL_MER[m].d}</p>` : ""}`;
  }
  const s = BD_SJ.find((x) => x.k === k) || BD_DT.find((x) => x.k === k);
  if (s) return `<h4>${s.n}</h4><p>${s.txt}</p>`;
  return "";
}
/* ---- 命主身体倾向 ---- */
const BD_TIP = {
  木: {
    z: "肝、胆",
    sc: "丑、子",
    hi: "木偏旺:传统上说肝气易旺,表现为急躁、易怒、紧绷。宜疏泄情绪、规律作息,子丑时(23–3 点)熟睡。",
    lo: "木偏弱:传统上说肝血易不足,常与眼睛疲劳、筋脉不舒相联系。宜养血护眼,少熬夜。",
  },
  火: {
    z: "心、小肠",
    sc: "午、未",
    hi: "火偏旺:传统上说心火易盛,表现为烦躁、失眠、口舌生疮。宜少熬夜、少辛辣,午时静心。",
    lo: "火偏弱:传统上说心阳易不足,常与怕冷、精神不振相联系。宜午时小憩、注意保暖、适度晒太阳。",
  },
  土: {
    z: "脾、胃",
    sc: "辰、巳",
    hi: "土偏旺:传统上说易湿滞,表现为困重、食欲时好时坏。宜饮食有节,少甜腻,饭后走动。",
    lo: "土偏弱:传统上说运化偏弱,常与消化不好、易疲倦相联系。宜辰时好好吃早餐,少生冷。",
  },
  金: {
    z: "肺、大肠",
    sc: "寅、卯",
    hi: "金偏旺:传统上说肺燥偏重,常与皮肤干燥、肠燥相联系。宜润燥、多喝水。",
    lo: "金偏弱:传统上说肺气偏弱,常与容易感冒、气短相联系。宜练呼吸、防寒,卯时起床排便。",
  },
  水: {
    z: "肾、膀胱",
    sc: "申、酉",
    hi: "水偏旺:传统上说易寒湿,表现为畏寒、水肿倾向。宜温阳、少生冷、多活动。",
    lo: "水偏弱:传统上说肾精易亏,常与腰膝酸软、精力下降相联系。宜避免熬夜过劳,酉时适当休整。",
  },
};
function bdPerson() {
  if (!R || !R.bz) return '<p class="dim">排盘后显示。</p>';
  let tot;
  try {
    tot = wxContrib(R.bz).tot;
  } catch (e) {
    return '<p class="dim">五行数据不可用。</p>';
  }
  const sum = tot.reduce((a, b) => a + b, 0) || 1,
    pct = tot.map((v) => v / sum),
    N = ["木", "火", "土", "金", "水"];
  const rows = N.map((n, i) => {
    const p = pct[i],
      st = p > 0.3 ? "hi" : p < 0.12 ? "lo" : "";
    return { n, i, p, st };
  });
  const notes = rows.filter((r) => r.st).sort((a, b) => Math.abs(b.p - 0.2) - Math.abs(a.p - 0.2));
  const bars = rows
    .map(
      (r) =>
        `<div class="bd-bar"><span style="color:${BD_WXC[r.n]}">${r.n}</span><i style="width:${Math.max(3, r.p * 100 * 2.4)}px;background:${BD_WXC[r.n]}"></i><b>${(r.p * 100).toFixed(0)}%</b><small>${BD_TIP[r.n].z}${r.st === "hi" ? " · 偏旺" : r.st === "lo" ? " · 偏弱" : ""}</small></div>`,
    )
    .join("");
  return `<div class="bd-bars">${bars}</div>${notes.length ? `<ul class="bd-notes">${notes.map((r) => `<li><b style="color:${BD_WXC[r.n]}">${r.n}(${BD_TIP[r.n].z})</b> ${BD_TIP[r.n][r.st]} <span class="dim">养护时段:${BD_TIP[r.n].sc}时</span></li>`).join("")}</ul>` : '<p class="sm">五行分布比较均衡,没有明显偏旺偏弱的一行。</p>'}
   <p class="bd-warn">这是传统命理里“五行对应脏腑”的文化观念,只用来提示作息与生活习惯,<b>不是医学诊断</b>;身体有不适请就医。</p>`;
}
function bdSchedule() {
  const n = nowBJ(),
    cur = n.h === 23 ? 0 : Math.floor((n.h + 1) / 2) % 12;
  let weak = [];
  try {
    const t = wxContrib(R.bz).tot,
      s = t.reduce((a, b) => a + b, 0) || 1;
    weak = ["木", "火", "土", "金", "水"].filter((x, i) => t[i] / s < 0.12);
  } catch (e) {}
  return `<div class="tbl-wrap"><table class="tbl bd-sch"><thead><tr><th>时辰</th><th>时间</th><th>当令</th><th>宜</th></tr></thead><tbody>${JL_MER.map(
    (m, i) => {
      const w = weak.includes(m.wx === "相火" ? "火" : m.wx);
      return `<tr class="${i === cur ? "cur" : ""}${w ? " wk" : ""}"><th>${m.z}${i === cur ? " ●" : ""}</th><td>${m.h}</td><td style="color:${BD_WXC[m.wx]}">${m.n}</td><td class="sm">${m.d}${w ? ' <b class="gold">★ 对应你偏弱的' + (m.wx === "相火" ? "火" : m.wx) + "</b>" : ""}</td></tr>`;
    },
  ).join("")}</tbody></table></div>`;
}
function bdHTML() {
  const tab = (k, n) =>
    `<button type="button" class="chip${BD.layer === k ? " on" : ""}" data-bdl="${k}">${n}</button>`;
  return `<div class="panel blk bdp" id="bdPanel">${phHead("人体图谱", "奇经八脉 · 五脏六腑 · 三焦与三丹田 —— 正面 + 背面,点部位看说明")}
   <div class="bd-tabs">${tab("qj", "奇经八脉")}${tab("zf", "五脏六腑")}${tab("sj", "三焦 · 丹田")}</div>
   <div class="nt-wrap"><div class="nt-fig">${bdSvg()}</div><div class="nt-side" id="bdInfo">${bdInfo()}</div></div>
   ${phNote("图为本站自绘的示意图:人体比例、穴位位置均为大致示意,不能用于取穴。经脉走行与原文依据《黄帝内经》《难经》等公开古籍;各家注本对奇经的具体循行有出入,这里取通行说法。", "关于这张图")}</div>
   <div class="panel blk bdp">${phHead("命主身体倾向", "按命盘五行分布对应脏腑系统(传统观念)")}${bdPerson()}</div>
   <div class="panel blk bdp">${phHead("今日子午流注作息", "● 为当前时辰;★ 为与你偏弱五行相关的时辰")}${bdSchedule()}</div>`;
}
function bdBind() {
  const re = () => {
    const p = $("#bdPanel");
    if (!p) return;
    const tmp = document.createElement("div");
    tmp.innerHTML = bdHTML();
    p.replaceWith(tmp.firstElementChild);
    bdBind();
  };
  $$("[data-bdl]").forEach(
    (b) =>
      (b.onclick = () => {
        BD.layer = b.dataset.bdl;
        BD.sel = null;
        re();
      }),
  );
  $$("#bdSvg .bd-hit").forEach(
    (g) =>
      (g.onclick = () => {
        const k = g.dataset.bd;
        BD.sel = BD.sel === k ? null : k;
        re();
      }),
  );
}
const _renderJingluo = renderJingluo;
renderJingluo = function (R) {
  return _renderJingluo(R) + bdHTML();
};
const _bindJingluo = bindJingluo;
bindJingluo = function () {
  _bindJingluo();
  try {
    bdBind();
  } catch (e) {
    console.error(e);
  }
};

const daysTo = (y, m, d) => {
  const n = nowBJ(),
    a = Date.UTC(n.y, n.m - 1, n.d),
    b = Date.UTC(y, m - 1, d);
  return Math.round((b - a) / 864e5);
};
function meRemind() {
  const c = R.t.civ,
    n = nowBJ(),
    L = R.lunar,
    out = [];
  /* 生日 */
  let gy = n.y;
  if (daysTo(gy, c.m, c.d) < 0) gy++;
  const gd = daysTo(gy, c.m, c.d),
    age = gy - c.y;
  let lb = null;
  for (let y = n.y - 1; y <= n.y + 1 && !lb; y++) {
    try {
      const s = calLunar2Solar(y, L.month, L.day, false);
      if (s && daysTo(s.y, s.m, s.d) >= 0) lb = { y, ...s };
    } catch (e) {}
  }
  out.push(
    `<div class="mr-card"><small>公历生日</small><b>${gd === 0 ? "就是今天" : gd + " 天后"}</b><span>${gy}-${f2(c.m)}-${f2(c.d)} · 满 ${age} 岁</span></div>`,
  );
  if (lb) {
    const ld = daysTo(lb.y, lb.m, lb.d);
    out.push(
      `<div class="mr-card"><small>农历生日(${calLM(L.month, false)}${calLD(L.day)})</small><b>${ld === 0 ? "就是今天" : ld + " 天后"}</b><span>下一次在公历 ${lb.y}-${f2(lb.m)}-${f2(lb.d)}</span></div>`,
    );
  }
  /* 本命年 / 犯太岁 */
  const pb = R.bz.pill[0].b,
    yrs = [0, 1, 2]
      .map((k) => {
        const Y = n.y + k,
          S = p5YearSha(Y),
          f = p5Fan(S.zi, pb);
        return `<tr><th>${Y} ${S.gz}</th><td>${f.length ? f.map((x) => `<span class="pill ${x.tone === "xiong" ? "r" : ""}">${x.n}</span>`).join(" ") : '<span class="dim">与太岁无冲刑破害</span>'}</td></tr>`;
      })
      .join("");
  /* 大运交接 */
  let dy = "";
  try {
    const T = dayunTable(R.bz, R.deep),
      i = dayunNow(R),
      cur = T[i],
      nx = T[i + 1];
    dy =
      `<div class="mr-card"><small>当前大运</small><b>${cur ? cur.gz : "—"}</b><span>${cur ? `${cur.yr} 年起 · ${cur.ss} · ${cur.lv}` : "尚未起运"}</span></div>` +
      (nx
        ? `<div class="mr-card"><small>下一步大运</small><b>${nx.gz}</b><span>${nx.yr} 年交接(约 ${Math.round(nx.startAge)} 岁)· 还有 ${nx.yr - n.y} 年 · ${nx.ss} · ${nx.lv}</span></div>`
        : "");
  } catch (e) {}
  /* 下一个节气 */
  let tm = "";
  try {
    const all = calTerms(n.y).concat(calTerms(n.y + 1)),
      nt = all.find(
        (t) =>
          daysTo(t.bj.y || n.y, t.bj.m, t.bj.d) > 0 ||
          (daysTo(t.bj.y || n.y, t.bj.m, t.bj.d) === 0 &&
            (t.bj.h > n.h || (t.bj.h === n.h && t.bj.mi > n.mi))),
      );
    if (nt) {
      const yy = nt.bj.y || n.y;
      tm = `<div class="mr-card"><small>下一个节气</small><b>${nt.name}</b><span>${yy}-${f2(nt.bj.m)}-${f2(nt.bj.d)} ${f2(nt.bj.h)}:${f2(nt.bj.mi)} · ${daysTo(yy, nt.bj.m, nt.bj.d)} 天后${nt.zhong ? "" : " · 换月令"}</span></div>`;
    }
  } catch (e) {}
  return `<div class="panel blk">${phHead("提醒", "生日、本命年与犯太岁、大运交接、节气 —— 按你的命盘计算")}
   <div class="mr-grid">${out.join("")}${dy}${tm}</div>
   <h4 class="gl">今明后三年与太岁的关系</h4><div class="tbl-wrap"><table class="tbl"><tbody>${yrs}</tbody></table></div>
   ${phNote("本命年、犯太岁按出生年的地支与流年地支的冲、刑、破、害关系判断,流年以立春为界;各家对“犯太岁”的范围说法不一,这里取较全的一种。大运交接年龄按节气折算,可能与其他软件差几个月。", "口径说明")}
   <div class="fx-chips"><button type="button" class="chip" data-mego="taisui">看犯太岁盘</button><button type="button" class="chip" data-mego="bazi">看大运流年</button><button type="button" class="chip" data-mego="season">看时令</button></div></div>`;
}

/* =====================================================================
   紫微飞星(zwfly)· 五行流通(wxflow)· 分享与导出(链接 / 状态码 / JSON)
   ===================================================================== */
const HUA_C = { 禄: "var(--good)", 权: "var(--gold2)", 科: "var(--cyan)", 忌: "var(--red)" };
const ZF = { layer: "ben", on: { 禄: 1, 权: 1, 科: 1, 忌: 1 }, sel: null, year: null, chain: null };
const ZF_LAYERS = [
  ["ben", "本命 · 各宫宫干飞化"],
  ["sheng", "生年四化"],
  ["dx", "大限四化"],
  ["liu", "流年四化"],
];
const zfNowY = () => nowBJ().y;
const zfD = (n) => (/宫$/.test(n) ? n : n + "宫"); /* 命宫 已带“宫”,其余宫名不带 */
function zfSanitizeState(zw) {
  const layers = new Set(ZF_LAYERS.map((x) => x[0]));
  if (!layers.has(ZF.layer)) ZF.layer = "ben";
  if (!ZF.on || typeof ZF.on !== "object") ZF.on = { 禄: 1, 权: 1, 科: 1, 忌: 1 };
  else ZF_LAB.forEach((h) => (ZF.on[h] = ZF.on[h] === 0 ? 0 : 1));
  const s = Number(ZF.sel);
  ZF.sel = Number.isInteger(s) && s >= 0 && s < 12 && zw?.pal?.[s] ? s : null;
  const y = Number(ZF.year);
  ZF.year = Number.isFinite(y) && y >= 1902 && y <= 2098 ? Math.round(y) : null;
  if (ZF.sel == null) ZF.chain = null;
  return ZF;
}
function zfEdgePath(P0, P1, k, r0, r1) {
  const dx = P1[0] - P0[0],
    dy = P1[1] - P0[1],
    L = Math.hypot(dx, dy) || 1,
    ux = dx / L,
    uy = dy / L,
    a = [P0[0] + ux * r0, P0[1] + uy * r0],
    b = [P1[0] - ux * r1, P1[1] - uy * r1];
  const off = (k - 1.5) * 11,
    mx = ((a[0] + b[0]) / 2) * 0.62 - uy * off,
    my = ((a[1] + b[1]) / 2) * 0.62 + ux * off;
  return {
    d: `M${a[0].toFixed(1)},${a[1].toFixed(1)}Q${mx.toFixed(1)},${my.toFixed(1)} ${b[0].toFixed(1)},${b[1].toFixed(1)}`,
    mid: [(a[0] + 2 * mx + b[0]) / 4, (a[1] + 2 * my + b[1]) / 4],
  };
}
function zfPage() {
  if (!R || !R.zw) return '<div class="panel blk"><p class="note">请先排盘。</p></div>';
  const zw = R.zw;
  if (!Array.isArray(zw.pal) || zw.pal.length < 12)
    return '<div class="panel blk"><p class="note bad">紫微飞星：十二宫数据不完整，请重新推演当前档案。</p></div>';
  zfSanitizeState(zw);
  const Y = ZF.year || zfNowY(),
    age = Y - (Number(zw.lunarYear) || Y) + 1;
  let net;
  try {
    net = zfNet(zw, { age, year: Y });
  } catch (err) {
    return `<div class="panel blk"><p class="note bad">紫微飞星基础网络计算失败：${esc(String((err && err.message) || err))}</p></div>`;
  }
  const edges = Array.isArray(net?.edges) ? net.edges : [];
  const E2 = edges.filter((e) => e && e.layer === ZF.layer && ZF.on[e.h]);
  const pos = (b) => p5Pt(235, 180 + 30 * b),
    NR = 40,
    sel = ZF.sel,
    inb = zfInbound(zw, edges);
  let g =
    "<defs>" +
    ZF_LAB.map(
      (h) =>
        `<marker id="zfm-${h}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0L10,5L0,10z" style="fill:${HUA_C[h]}"/></marker>`,
    ).join("") +
    "</defs>";
  g += `<circle r="296" class="p5-ctr"/>`;
  /* 节点 */
  zw.pal.forEach((p) => {
    if (!p || !Number.isInteger(+p.b)) return;
    const [x, y] = pos(+p.b),
      main = (Array.isArray(p.stars) ? p.stars : [])
        .filter((s) => s && s.t === "main")
        .map((s) => s.n),
      isDx = net.dxPal && net.dxPal.b === p.b && ZF.layer === "dx",
      on = sel === p.b;
    g += `<g class="zf-n${on ? " on" : ""}" data-b="${p.b}"><title>${zfD(p.name)} ${GAN[p.stem]}${ZHI[p.b]}${main.length ? " · " + main.join("、") : ""}${p.dx ? " · 大限 " + p.dx[0] + "–" + p.dx[1] + " 岁" : ""}</title><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${NR}" class="zf-c${p.isMing ? " ming" : ""}${isDx ? " dx" : ""}"/>${p.isShen ? `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${NR + 4}" class="zf-shen"/>` : ""}
     <text x="${x.toFixed(1)}" y="${(y - 9).toFixed(1)}" class="zf-nm" text-anchor="middle">${p.name}</text><text x="${x.toFixed(1)}" y="${(y + 6).toFixed(1)}" class="zf-gz" text-anchor="middle">${GAN[p.stem]}${ZHI[p.b]}</text><text x="${x.toFixed(1)}" y="${(y + 19).toFixed(1)}" class="zf-st" text-anchor="middle">${main.slice(0, 2).join(" ")}</text></g>`;
  });
  /* 中心节点(生年 / 流年的起点) */
  const cen = ZF.layer === "sheng" || ZF.layer === "liu";
  if (cen) {
    const st = ZF.layer === "sheng" ? zw.ys : (((Y - 4) % 10) + 10) % 10;
    g += `<circle r="44" class="zf-c ctr"/>${p5T(-8, 0, (ZF.layer === "sheng" ? "生年" : Y + "年") + GAN[st], 14, "p5-gl")}${p5T(12, 0, "化禄权科忌", 9, "p5-sh")}`;
  } else if (ZF.layer === "dx" && net.dxPal)
    g += `${p5T(-6, 0, "大限 " + net.dxPal.name, 13, "p5-gl")}${p5T(12, 0, `${net.dxPal.dx[0]}–${net.dxPal.dx[1]} 岁`, 10, "p5-sh")}`;
  else
    g += `${p5T(-6, 0, "宫干飞化", 14, "p5-gl")}${p5T(12, 0, sel == null ? "点一个宫" : zw.pal[sel].name, 10, "p5-sh")}`;
  /* 飞线 */
  const chainSet = new Set();
  if (ZF.chain) {
    const c = ZF.chain;
    for (let i = 0; i + 1 < c.path.length; i++) chainSet.add(c.path[i] + ">" + c.path[i + 1]);
    if (c.loop >= 0) chainSet.add(c.path[c.path.length - 1] + ">" + c.path[c.loop]);
  }
  let ei = 0;
  E2.forEach((e) => {
    const k = ZF_LAB.indexOf(e.h),
      from = e.from < 0 ? [0, 0] : pos(e.from),
      to = e.to == null ? null : pos(e.to);
    if (!to) return;
    const isOut = sel != null && e.from === sel,
      isIn = sel != null && e.to === sel,
      inChain =
        ZF.layer === "ben" && ZF.chain && e.h === ZF.chain.h && chainSet.has(e.from + ">" + e.to);
    let cls = "zf-e",
      op = sel == null ? 0.62 : 0.07,
      w = 1.5,
      dash = "";
    if (isOut) {
      op = 1;
      w = 2.6;
    } else if (isIn) {
      op = 0.9;
      w = 2;
      dash = "5 3";
    }
    if (inChain) {
      op = 1;
      w = 4;
      dash = "";
    }
    if (e.self) {
      const [x, y] = pos(e.from),
        a = ((180 + 30 * e.from) * Math.PI) / 180,
        ox = Math.sin(a),
        oy = -Math.cos(a),
        cx = x + ox * (NR + 9),
        cy = y + oy * (NR + 9);
      g += `<g class="${cls}" data-b="${e.from}"><title>${zw.pal[e.from].name}(${GAN[e.stem]})化${e.h}:${e.star} → 自化</title><circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="9" fill="none" stroke="${HUA_C[e.h]}" stroke-width="${w}" stroke-opacity="${Math.max(op, 0.25)}" ${dash ? `stroke-dasharray="${dash}"` : ""}/><text x="${cx.toFixed(1)}" y="${cy.toFixed(1)}" class="zf-hl" text-anchor="middle" dominant-baseline="central" fill="${HUA_C[e.h]}">${e.h}</text></g>`;
      return;
    }
    const r0 = e.from < 0 ? 46 : NR,
      P = zfEdgePath(from, to, k, r0, NR + 2);
    g += `<g class="${cls}" data-b="${e.from < 0 ? e.to : e.from}"><title>${e.from < 0 ? (ZF.layer === "sheng" ? "生年" : Y + "年") + GAN[e.stem] : zw.pal[e.from].name + "(" + GAN[e.stem] + ")"}化${e.h}:${e.star} → ${zfD(zw.pal[e.to].name)}</title><path d="${P.d}" fill="none" stroke="${HUA_C[e.h]}" stroke-width="${w}" stroke-opacity="${op}" ${dash ? `stroke-dasharray="${dash}"` : ""} marker-end="url(#zfm-${e.h})"/>`;
    if (isOut || (sel == null && cen) || inChain)
      g += `<text x="${P.mid[0].toFixed(1)}" y="${P.mid[1].toFixed(1)}" class="zf-el" fill="${HUA_C[e.h]}" text-anchor="middle">${e.h}·${e.star}</text>`;
    g += "</g>";
    ei++;
  });
  /* 追踪链序号 */
  if (ZF.chain && ZF.layer === "ben")
    ZF.chain.path.forEach((b, i) => {
      const [x, y] = pos(b),
        a = ((180 + 30 * b) * Math.PI) / 180;
      g += `<circle cx="${(x + Math.sin(a) * (NR + 2) * 0).toFixed(1)}" cy="${(y - NR + 2).toFixed(1)}" r="9" class="zf-no"/><text x="${x.toFixed(1)}" y="${(y - NR + 2).toFixed(1)}" class="zf-nt" text-anchor="middle" dominant-baseline="central">${i + 1}</text>`;
    });
  /* 右侧表 */
  const P0 = sel != null ? zw.pal[sel] : null;
  const detail = P0
    ? (() => {
        const out = zfFlyFrom(zw, P0.stem),
          inn = inb[sel];
        return `<h4 class="gl">${zfD(P0.name)} · ${GAN[P0.stem]}${ZHI[sel]} <small class="dim">${RD_PAL[P0.name] ? RD_PAL[P0.name].th : ""}</small></h4>
     <div class="tbl-wrap"><table class="tbl"><thead><tr><th>化</th><th>飞出(宫干${GAN[P0.stem]})</th><th>被飞入(来自)</th></tr></thead><tbody>${ZF_LAB.map(
       (h, i) => {
         const f = out[i],
           srcs = inn[h].map((b) => zw.pal[b].name + (b === sel ? "(自)" : ""));
         return `<tr><th style="color:${HUA_C[h]}">化${h}</th><td>${f.star} → <b>${f.to == null ? "—" : zw.pal[f.to].name + (f.to === sel ? "(自化)" : "")}</b></td><td>${srcs.join("、") || "—"}</td></tr>`;
       },
     ).join("")}</tbody></table></div>
     <div class="fx-chips">${ZF_LAB.map((h) => `<button type="button" class="chip${ZF.chain && ZF.chain.b0 === sel && ZF.chain.h === h ? " on" : ""}" data-zfc="${h}">追踪化${h}链</button>`).join("")}<button type="button" class="chip" data-zfc="">清除追踪</button></div>`;
      })()
    : '<p class="dim sm">点圆上的宫,看它的飞出和被飞入。灰蒙的线是其它宫的飞化。</p>';
  const chainTxt = ZF.chain
    ? (() => {
        const c = ZF.chain,
          nm = c.path.map((b) => zw.pal[b].name),
          last = nm[nm.length - 1];
        return `<p class="rt"><b style="color:${HUA_C[c.h]}">化${c.h}链</b>:${nm.join(" → ")}${c.end === "落空" ? "(此化星未落在任何宫)" : c.end === "自化" ? `,${last}自化,链到此为止` : c.end === "回环" ? `,再回到 ${nm[c.loop]},形成回环` : ""}。</p>`;
      })()
    : "";
  const st = zw.pal
    .map((p) => ({ p, i: inb[p.b] }))
    .map(
      (o) =>
        `<tr class="${o.p.b === sel ? "on" : ""}" data-b="${o.p.b}"><th>${o.p.name}</th>${ZF_LAB.map((h) => `<td class="${o.i[h].length >= 2 ? "hi" + h : ""}">${o.i[h].length || "·"}</td>`).join("")}</tr>`,
    )
    .join("");
  const selfs = net.edges
    .filter((e) => e.layer === "ben" && e.self)
    .map((e) => `${zw.pal[e.from].name}自化${e.h}(${e.star})`);
  const topJi = zw.pal
    .map((p) => ({ p, n: inb[p.b].忌.length }))
    .filter((x) => x.n >= 2)
    .sort((a, b) => b.n - a.n)
    .map((x) => `${zfD(x.p.name)}被 ${x.n} 宫化忌飞入`);
  const intr = P0
    ? (() => {
        const f = zfFlyFrom(zw, P0.stem)
          .filter((x) => x.to != null && x.to !== sel)
          .map(
            (x) =>
              `${P0.name}(${RD_PAL[P0.name] ? RD_PAL[P0.name].noun : ""})化${x.h}入${zw.pal[x.to].name}(${RD_PAL[zw.pal[x.to].name] ? RD_PAL[zw.pal[x.to].name].noun : ""})`,
          );
        return f.length
          ? `<p class="dim sm">读法(飞星派的通行说法,仅作线索):${f.join(";")}。「禄」多指缘分与资源流向,「忌」多指牵挂、亏欠或需要用心之处。</p>`
          : "";
      })()
    : "";
  return `<div class="panel blk p5">${phHead("紫微飞星", "宫干四化连线 · 入宫统计 · 忌转忌追踪")}
   <div class="p5-ctl"><label>层 <select id="zfL">${ZF_LAYERS.map(([k, n]) => `<option value="${k}"${ZF.layer === k ? " selected" : ""}>${n}</option>`).join("")}</select></label>
    ${ZF.layer === "dx" || ZF.layer === "liu" ? `<label>年份 <input type="number" id="zfY" min="1902" max="2098" value="${Y}"></label><span class="dim sm">虚岁 ${age}${ZF.layer === "dx" && !net.dxPal ? "(超出大限范围)" : ""}</span>` : ""}
    <span class="p5-lay">${ZF_LAB.map((h) => `<label class="chk"><input type="checkbox" data-zfh="${h}"${ZF.on[h] ? " checked" : ""}><b style="color:${HUA_C[h]}">化${h}</b></label>`).join("")}</span>
    <button type="button" class="gbtn sm" id="zfClr">取消选中</button></div>
   <div class="nt-wrap"><div class="nt-fig"><svg id="zfSvg" viewBox="-330 -330 660 660" role="img" aria-label="紫微飞星连线图">${g}</svg></div>
   <div class="nt-side">${detail}${chainTxt}${intr}
    <h4 class="gl" style="margin-top:10px">入宫统计 <small class="dim">各宫被本命宫干飞入几次(≥2 次标色)</small></h4>
    <div class="tbl-wrap"><table class="tbl zf-st"><thead><tr><th>宫</th>${ZF_LAB.map((h) => `<th style="color:${HUA_C[h]}">${h}</th>`).join("")}</tr></thead><tbody>${st}</tbody></table></div>
    <div class="kv">${selfs.length ? `<span>自化:<b>${selfs.join("、")}</b></span>` : '<span class="dim">本命没有自化</span>'}${topJi.length ? `<span>化忌集中:<b>${topJi.join("、")}</b></span>` : ""}</div></div></div>
   ${P5_NOTE}${p5Audit(["宫干:与 iztro 对拍,12 宫 × 60 个命盘的天干 0 偏差;四化星表 10 个天干 × 4 化 0 偏差。", "飞化落宫:该宫宫干按四化表飞出禄权科忌,落在该化星所在的宫;与 iztro 的 mutagedPlaces 对拍 60 个命盘共 2880 项 0 偏差;另与站内原有「宫干飞四化」表在 2000 个命盘上完全一致。", "生年四化与 iztro 在 2000 个命盘上一致。大限层用大限命宫的宫干;流年层用流年天干(按公历年份的干,不以立春为界),二者落在本命盘宫位。", "追踪链:从选中宫出发,每一步取当前宫宫干的同一种化落点,遇到走过的宫即为回环,遇到自化即终止;已验证路径无重复、回环指向正确。", "只实现了宫干飞化与统计。未做:星曜飞入后的吉凶判读规则(流派差异大)、大限/流年各宫重新定名的叠宫、化曜互化的专项标注。右侧“读法”只是飞星派通行说法的提示。"])}</div>`;
}
function zfBind() {
  const pane = $("#pane-zwfly");
  if (!pane) return;
  if (R?.zw) zfSanitizeState(R.zw);
  const re = () => refRender("zwfly");
  const layer = $("#zfL");
  if (layer)
    layer.onchange = (e) => {
      ZF.layer = e.target.value;
      ZF.chain = null;
      re();
    };
  const y = $("#zfY");
  if (y)
    y.onchange = () => {
      ZF.year = Math.max(1902, Math.min(2098, +y.value || zfNowY()));
      re();
    };
  $$("[data-zfh]", pane).forEach(
    (c) =>
      (c.onchange = () => {
        ZF.on[c.dataset.zfh] = c.checked ? 1 : 0;
        re();
      }),
  );
  const clr = $("#zfClr");
  if (clr)
    clr.onclick = () => {
      ZF.sel = null;
      ZF.chain = null;
      re();
    };
  const pick = (b) => {
    b = Number(b);
    if (!Number.isInteger(b) || b < 0 || b > 11 || !R?.zw?.pal?.[b]) return;
    ZF.sel = ZF.sel === b ? null : b;
    ZF.chain = null;
    try {
      if (ZF.sel != null) fxSet("zhi", ZF.sel, "紫微飞星");
    } catch (e) {}
    re();
  };
  $$("#zfSvg .zf-n", pane).forEach((n) => (n.onclick = () => pick(n.dataset.b)));
  $$("#zfSvg .zf-e", pane).forEach((n) => (n.onclick = () => pick(n.dataset.b)));
  $$(".zf-st tbody tr", pane).forEach((r) => (r.onclick = () => pick(r.dataset.b)));
  $$("[data-zfc]", pane).forEach(
    (b) =>
      (b.onclick = () => {
        const h = b.dataset.zfc;
        try {
          ZF.chain =
            h && ZF.sel != null && R?.zw
              ? Object.assign({ b0: ZF.sel, h }, zfChain(R.zw, ZF.sel, h))
              : null;
        } catch (_) {
          ZF.chain = null;
        }
        re();
      }),
  );
}
REF_PANES.zwfly = zfPage;
REF_BIND.zwfly = zfBind;

/* ================= 五行流通 ================= */
const WXF = { sel: null, view: "gen", ov: "none", year: null, rsel: null };
const WX_V = ["wood", "fire", "earth", "metal", "water"];
const WX_TBL = [
  ["木", "东", "春", "青", "酸", "肝", "胆", "目", "怒", "甲乙", "寅卯", "三 · 八"],
  ["火", "南", "夏", "赤", "苦", "心", "小肠", "舌", "喜", "丙丁", "巳午", "二 · 七"],
  ["土", "中", "长夏", "黄", "甘", "脾", "胃", "口", "思", "戊己", "辰戌丑未", "五 · 十"],
  ["金", "西", "秋", "白", "辛", "肺", "大肠", "鼻", "悲", "庚辛", "申酉", "四 · 九"],
  ["水", "北", "冬", "黑", "咸", "肾", "膀胱", "耳", "恐", "壬癸", "亥子", "一 · 六"],
];
function wxfData() {
  const bz = R.bz,
    D = R.deep || baziDeep(bz),
    n = nowBJ(),
    Y = WXF.year || n.y;
  let extra = [],
    lab = "";
  if (WXF.ov === "year" || WXF.ov === "both") {
    extra = extra.concat(wxExtraGZ((((Y - 4) % 60) + 60) % 60, "流年"));
    lab += `${Y}年 ${gz((((Y - 4) % 60) + 60) % 60)}`;
  }
  if (WXF.ov === "dayun" || WXF.ov === "both") {
    let i = -1;
    try {
      i = dayunNow(R);
    } catch (e) {}
    const d = (i >= 0 && bz.dayun && bz.dayun[i]) || null;
    if (d) {
      extra = extra.concat(wxExtraGZ(d.idx, "大运"));
      lab = (lab ? "大运 " + gz(d.idx) + " + " : "大运 " + gz(d.idx)) + (lab ? lab : "");
    }
  }
  const base = wxContrib(bz),
    withE = wxContrib(bz, extra),
    cur = WXF.ov === "none" ? base : withE;
  return { bz, D, base, cur, flow: wxFlow(cur.tot), flow0: wxFlow(base.tot), lab, Y };
}
/* 通用五边形:节点位置、边的曲线 */
const wxPos = (i, r) => p5Pt(r, i * 72);
function wxEdge(a, b, ra, rb, bow, R0) {
  const P0 = wxPos(a, R0),
    P1 = wxPos(b, R0),
    dx = P1[0] - P0[0],
    dy = P1[1] - P0[1],
    L = Math.hypot(dx, dy),
    ux = dx / L,
    uy = dy / L,
    s = [P0[0] + ux * ra, P0[1] + uy * ra],
    e = [P1[0] - ux * rb, P1[1] - uy * rb],
    mx = (s[0] + e[0]) / 2 + -uy * bow,
    my = (s[1] + e[1]) / 2 + ux * bow;
  return {
    d: `M${s[0].toFixed(1)},${s[1].toFixed(1)}Q${mx.toFixed(1)},${my.toFixed(1)} ${e[0].toFixed(1)},${e[1].toFixed(1)}`,
    mid: [(s[0] + 2 * mx + e[0]) / 4, (s[1] + 2 * my + e[1]) / 4],
  };
}
const wxDefs =
  '<defs><marker id="wxm-g" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="11" markerHeight="11" markerUnits="userSpaceOnUse" orient="auto"><path d="M0,0L10,5L0,10z" style="fill:var(--good)"/></marker><marker id="wxm-k" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="11" markerHeight="11" markerUnits="userSpaceOnUse" orient="auto"><path d="M0,0L10,5L0,10z" style="fill:var(--red)"/></marker></defs>';
function wxfPage() {
  if (!R || !R.bz) return '<div class="panel blk"><p class="note">请先排盘。</p></div>';
  const d = wxfData(),
    tot = d.cur.tot,
    F = d.flow,
    xy = d.D.xy,
    mx = Math.max(...F.gen.map((g) => g.flow), 1e-9),
    mk = Math.max(...F.kill.map((k) => k.press), 1e-9),
    nm = (i) => WXN[i];
  const R0 = 168,
    rad = (i) => 26 + Math.sqrt(F.pct[i]) * 62,
    showG = WXF.view !== "kill",
    showK = WXF.view !== "gen",
    lab = WXF.view !== "both";
  let g = wxDefs;
  if (showK)
    F.kill.forEach((k) => {
      const E3 = wxEdge(k.a, k.b, rad(k.a) + 4, rad(k.b) + 8, 0, R0),
        w = 0.8 + (k.press / mk) * 6;
      g += `<g><title>${nm(k.a)}克${nm(k.b)} · 克压 ${k.press.toFixed(2)}(${nm(k.a)} ${tot[k.a].toFixed(2)} − ${nm(k.b)} ${tot[k.b].toFixed(2)},差值为负记 0)</title><path d="${E3.d}" fill="none" stroke="var(--red)" stroke-width="${w.toFixed(1)}" stroke-opacity="${k.press > 0 ? 0.6 : 0.2}" ${k.press > 0 ? "" : 'stroke-dasharray="4 4"'} marker-end="url(#wxm-k)"/>${lab && k.press > 0 ? `<text x="${E3.mid[0].toFixed(1)}" y="${E3.mid[1].toFixed(1)}" class="wx-el k" text-anchor="middle">${nm(k.a)}克${nm(k.b)} ${k.press.toFixed(1)}</text>` : ""}</g>`;
    });
  if (showG)
    F.gen.forEach((e) => {
      const E3 = wxEdge(e.a, e.b, rad(e.a) + 4, rad(e.b) + 8, -30, R0),
        w = 1 + (e.flow / mx) * 10,
        thin = F.thin.some((t) => t.a === e.a && t.b === e.b);
      g += `<g><title>${nm(e.a)}生${nm(e.b)} · 流量 ${e.flow.toFixed(2)}(取两端较小值)${thin ? " · 细流:" + F.thin.find((t) => t.a === e.a && t.b === e.b).why : ""}</title><path d="${E3.d}" fill="none" stroke="var(--good)" stroke-width="${w.toFixed(1)}" stroke-opacity="${thin ? 0.4 : 0.78}" ${thin ? 'stroke-dasharray="6 5"' : ""} marker-end="url(#wxm-g)"/>${lab ? `<text x="${E3.mid[0].toFixed(1)}" y="${E3.mid[1].toFixed(1)}" class="wx-el ${thin ? "k" : "g"}" text-anchor="middle">${nm(e.a)}生${nm(e.b)} ${e.flow.toFixed(1)}${thin ? " 细" : ""}</text>` : ""}</g>`;
    });
  for (let i = 0; i < 5; i++) {
    const [x, y] = wxPos(i, R0),
      r = rad(i),
      fav = xy.favor.includes(i),
      av = xy.avoid.includes(i),
      miss = F.missing.includes(i),
      st = miss ? "缺" : F.pct[i] > 0.3 ? "偏旺" : F.pct[i] < 0.12 ? "偏弱" : "";
    g += `<g class="wx-n${WXF.sel === i ? " on" : ""}" data-i="${i}"><title>${nm(i)} ${tot[i].toFixed(2)}(${(F.pct[i] * 100).toFixed(0)}%)${fav ? " · 喜用" : av ? " · 忌" : ""}${miss ? " · 缺" : ""}</title>
     ${fav ? `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(r + 6).toFixed(1)}" class="wx-fav"/>` : ""}${av ? `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(r + 6).toFixed(1)}" class="wx-av"/>` : ""}
     <circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(1)}" style="fill:var(--${WX_V[i]});fill-opacity:.3;stroke:var(--${WX_V[i]})" class="wx-c${miss ? " miss" : ""}"/>
     <text x="${x.toFixed(1)}" y="${(y - 2).toFixed(1)}" class="wx-t" text-anchor="middle" style="fill:var(--${WX_V[i]})">${nm(i)}</text><text x="${x.toFixed(1)}" y="${(y + 14).toFixed(1)}" class="wx-p" text-anchor="middle">${miss ? "缺" : (F.pct[i] * 100).toFixed(0) + "%"}</text>
     <text x="${x.toFixed(1)}" y="${(y + r + 14).toFixed(1)}" class="wx-tag ${fav ? "f" : av ? "a" : ""}" text-anchor="middle">${[fav ? "喜用" : av ? "忌" : "", st].filter(Boolean).join(" · ")}</text></g>`;
  }
  const facts = [];
  facts.push(
    `最强 <b>${nm(F.strong)}</b>(${(F.pct[F.strong] * 100).toFixed(0)}%),最弱 <b>${nm(F.weak)}</b>(${(F.pct[F.weak] * 100).toFixed(0)}%)${F.missing.length ? `,缺 <b class="bad">${F.missing.map(nm).join("、")}</b>` : ""}`,
  );
  facts.push(
    F.thin.length
      ? `细流/断点:${F.thin.map((t) => `<b>${nm(t.a)}→${nm(t.b)}</b>(${t.why})`).join(";")}`
      : "生的通道没有明显细流:每一环两端都有足够的力量。",
  );
  facts.push(
    F.bridge.length
      ? `强克强(需要通关):${F.bridge.map((b) => `${nm(b.a)}克${nm(b.b)},通关神 <b>${nm(b.c)}</b> ${b.ok ? '<b class="good">在</b>(' + b.w.toFixed(1) + ")" : '<b class="bad">弱或缺</b>(' + b.w.toFixed(1) + ")"}`).join(";")}`
      : "没有“两强相克”的格局,不需要通关。",
  );
  facts.push(
    xy.favor
      .map((i) => {
        const up = (i + 4) % 5,
          fl = F.gen.find((x) => x.a === up && x.b === i);
        return `喜用 <b>${nm(i)}</b> 占 ${(F.pct[i] * 100).toFixed(0)}%${F.pct[i] < 0.2 ? "(低于均值)" : ""};来路 ${nm(up)}→${nm(i)} 流量 ${fl.flow.toFixed(2)}${fl.flow < mx * 0.25 ? "(细)" : ""}`;
      })
      .join("<br>"),
  );
  if (xy.avoid.length)
    facts.push(
      xy.avoid
        .map(
          (i) =>
            `忌 <b>${nm(i)}</b> 占 ${(F.pct[i] * 100).toFixed(0)}%${F.pct[i] > 0.28 ? "(偏重)" : ""}`,
        )
        .join(";"),
    );
  const sel = WXF.sel,
    contrib =
      sel != null ? d.cur.items.filter((x) => x.wx === sel).sort((a, b) => b.w - a.w) : null;
  const rel =
    sel != null
      ? `<p class="dim sm">生我:${nm((sel + 4) % 5)}(${tot[(sel + 4) % 5].toFixed(1)}) · 我生:${nm((sel + 1) % 5)}(${tot[(sel + 1) % 5].toFixed(1)}) · 我克:${nm((sel + 2) % 5)}(${tot[(sel + 2) % 5].toFixed(1)}) · 克我:${nm((sel + 3) % 5)}(${tot[(sel + 3) % 5].toFixed(1)})</p>`
      : "";
  const selTbl =
    sel != null
      ? `<h4 class="gl">${nm(sel)} 从哪里来 <small class="dim">合计 ${tot[sel].toFixed(2)}</small></h4><div class="tbl-wrap"><table class="tbl"><thead><tr><th>来源</th><th>位置</th><th>权重</th></tr></thead><tbody>${contrib.map((x) => `<tr><td>${x.src}${x.pil === -1 ? ' <small class="dim">(叠加)</small>' : ""}</td><td>${x.kind}</td><td>${x.w.toFixed(2)}</td></tr>`).join("") || '<tr><td colspan="3" class="dim">没有来源</td></tr>'}</tbody></table></div>${rel}`
      : '<p class="dim sm">点五行圆,看它由哪些干支构成,以及上下游关系。日干本身不计入(与八字页强弱算法一致)。</p>';
  const delta =
    WXF.ov !== "none"
      ? `<h4 class="gl">叠加「${d.lab}」后的变化</h4><div class="tbl-wrap"><table class="tbl"><thead><tr><th></th>${[0, 1, 2, 3, 4].map((i) => `<th>${nm(i)}</th>`).join("")}</tr></thead><tbody><tr><th>原局</th>${d.flow0.pct.map((p) => `<td>${(p * 100).toFixed(0)}%</td>`).join("")}</tr><tr><th>叠加后</th>${F.pct.map((p) => `<td>${(p * 100).toFixed(0)}%</td>`).join("")}</tr><tr><th>变化</th>${F.pct
          .map((p, i) => {
            const dd = (p - d.flow0.pct[i]) * 100;
            return `<td class="${dd > 1 ? "good" : dd < -1 ? "bad" : ""}">${dd > 0 ? "+" : ""}${dd.toFixed(0)}</td>`;
          })
          .join("")}</tr></tbody></table></div>`
      : "";
  return `<div class="panel blk p5">${phHead("五行流通", "命主的木火土金水:谁旺谁弱、哪里不通、喜忌各在哪")}
   <div class="wx-ctl"><span class="wx-seg" role="group" aria-label="显示内容">${[
     ["gen", "只看生"],
     ["kill", "只看克"],
     ["both", "生 + 克"],
   ]
     .map(
       ([k, n]) =>
         `<button type="button" class="chip${WXF.view === k ? " on" : ""}" data-wv="${k}">${n}</button>`,
     )
     .join("")}</span>
    <label>叠加 <select id="wxO">${[
      ["none", "只看原局"],
      ["year", "叠加流年"],
      ["dayun", "叠加当前大运"],
      ["both", "大运 + 流年"],
    ]
      .map(([k, n]) => `<option value="${k}"${WXF.ov === k ? " selected" : ""}>${n}</option>`)
      .join(
        "",
      )}</select></label>${WXF.ov === "year" || WXF.ov === "both" ? `<label>年份 <input type="number" id="wxY" min="1902" max="2098" value="${d.Y}"></label>` : ""}</div>
   <div class="wx-legend"><span><i class="lg g"></i>生:线越粗,流量越大</span><span><i class="lg k"></i>克:线越粗,压力越大</span><span><i class="lg dash"></i>虚线:细流或无压力</span><span><i class="lg fav"></i>金圈:喜用</span><span><i class="lg av"></i>红虚圈:忌</span><span>圆越大,力量越强</span></div>
   <div class="kv"><span>日主 <b>${GAN[d.bz.dm]}${nm(GAN_WX[d.bz.dm])}</b>(${d.D.st.level})</span><span>喜用 <b class="good">${xy.favor.map(nm).join("、")}</b></span><span>忌 <b class="bad">${xy.avoid.map(nm).join("、")}</b></span></div>
   <div class="nt-wrap"><div class="nt-fig"><svg id="wxSvg" data-nozoom="1" viewBox="-250 -240 500 500" role="img" aria-label="命主五行流通图">${g}</svg></div>
   <div class="nt-side"><ul class="wx-facts">${facts.map((f) => `<li>${f}</li>`).join("")}</ul>${delta}${selTbl}
   ${phNote("绿线是“生”,粗细=两端力量的较小值(管道取决于较细的一头);红线是“克”,粗细=克者超出被克者的部分。这是对八字页同一套权重的流向化展示,<b>流量与克压的定义是本站的启发式</b>,不是古法公式。")}</div></div>
   ${wxRefHTML()}
   ${P5_NOTE}${p5Audit(["权重:与八字页强弱判断使用同一套(年月时天干 × 位置权重,四地支藏干 本气/中气/余气 × 位置权重;日干本身不计)。验证:按柱拆分的各行之和与 strength() 的五行权重在 3000 个随机命盘上完全相同(最大差 0)。", "流量 = min(生者, 被生者);克压 = max(0, 克者 − 被克者);断点 = 流量低于最大流量 25% 或低于均值 25%;缺 = 低于均值 5%。验证:流量不超过两端较小值、克压非负、占比之和为 1。", "通关:A 克 B 且二者都不低于均值时,取 A 所生者为通关神;通关神力量不低于均值一半视为“在”。这是传统“通关”概念的量化近似。", "叠加大运/流年:把该干支当作多出的一柱,干按年柱的天干权重,支按年柱位置的藏干权重加入。属示意,古法对大运流年的取力权重并不统一。", "不含:月令得令的加权(强弱判断另有“旺相休囚死”)、合化后五行变化、调候用神。喜用与忌来自八字页的 xiyong。", "下方“五行生克总图”是通行的五行对应表(方位、季节、脏腑等),为传统文化常识,不含命盘计算。"])}</div>`;
}
/* ---- 工具:五行生克总图(与命盘无关) ---- */
function wxRefHTML() {
  const sel = WXF.rsel,
    R0 = 150,
    nr = 34;
  let g = wxDefs;
  for (let i = 0; i < 5; i++) {
    const E3 = wxEdge(i, (i + 1) % 5, nr + 3, nr + 9, -22, R0),
      hl = sel != null && (i === sel || (i + 1) % 5 === sel);
    g += `<g><path d="${E3.d}" fill="none" stroke="var(--good)" stroke-width="${hl ? 3.4 : 2}" stroke-opacity="${sel == null || hl ? 0.85 : 0.2}" marker-end="url(#wxm-g)"/><text x="${E3.mid[0].toFixed(1)}" y="${E3.mid[1].toFixed(1)}" class="wx-el g" text-anchor="middle">${WXN[i]}生${WXN[(i + 1) % 5]}</text></g>`;
  }
  for (let i = 0; i < 5; i++) {
    const j = (i + 2) % 5,
      E3 = wxEdge(i, j, nr + 4, nr + 10, 0, R0),
      hl = sel != null && (i === sel || j === sel);
    g += `<g><path d="${E3.d}" fill="none" stroke="var(--red)" stroke-width="${hl ? 2.8 : 1.4}" stroke-opacity="${sel == null || hl ? 0.8 : 0.15}" marker-end="url(#wxm-k)"/>${sel == null || hl ? `<text x="${(E3.mid[0] * 0.62).toFixed(1)}" y="${(E3.mid[1] * 0.62).toFixed(1)}" class="wx-el k" text-anchor="middle">${WXN[i]}克${WXN[j]}</text>` : ""}</g>`;
  }
  for (let i = 0; i < 5; i++) {
    const [x, y] = wxPos(i, R0),
      on = sel === i;
    g += `<g class="wx-n${on ? " on" : ""}" data-ri="${i}"><title>${WXN[i]} · ${WX_TBL[i][1]} · ${WX_TBL[i][2]} · ${WX_TBL[i][5]}/${WX_TBL[i][6]}(点击高亮它的四种关系)</title><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${nr}" style="fill:var(--${WX_V[i]});fill-opacity:.32;stroke:var(--${WX_V[i]})" class="wx-c"/><text x="${x.toFixed(1)}" y="${(y + 3).toFixed(1)}" class="wx-t" text-anchor="middle" style="fill:var(--${WX_V[i]})">${WXN[i]}</text><text x="${x.toFixed(1)}" y="${(y + nr + 14).toFixed(1)}" class="wx-tag" text-anchor="middle">${WX_TBL[i][1]} · ${WX_TBL[i][2]}</text></g>`;
  }
  const cap =
    sel != null
      ? `<b style="color:var(--${WX_V[sel]})">${WXN[sel]}</b>:被 <b>${WXN[(sel + 4) % 5]}</b> 所生(生我) · 生 <b>${WXN[(sel + 1) % 5]}</b>(我生) · 克 <b>${WXN[(sel + 2) % 5]}</b>(我克) · 被 <b>${WXN[(sel + 3) % 5]}</b> 所克(克我) · 同类 ${WXN[sel]}(比和)`
      : "点任意一个五行,高亮它的生我、我生、我克、克我。";
  return `<div class="wx-ref">${phHead("五行生克总图", "工具 · 与命盘无关的通用对照")}
   <div class="nt-wrap"><div class="nt-fig"><svg id="wxRefSvg" data-nozoom="1" viewBox="-250 -235 500 490" role="img" aria-label="五行生克总图">${g}</svg></div>
   <div class="nt-side"><p class="wx-cap" id="wxCap">${cap}</p>
   <div class="tbl-wrap"><table class="tbl wx-tbl"><thead><tr><th>五行</th><th>方位</th><th>季节</th><th>颜色</th><th>味</th><th>脏</th><th>腑</th><th>官</th><th>情志</th><th>天干</th><th>地支</th><th>河图数</th></tr></thead><tbody>${WX_TBL.map(
     (r, i) =>
       `<tr class="${sel === i ? "on" : ""}" data-rr="${i}"><th style="color:var(--${WX_V[i]})">${r[0]}</th>${r
         .slice(1)
         .map((c) => `<td>${c}</td>`)
         .join("")}</tr>`,
   ).join("")}</tbody></table></div>
   ${phNote("<b>生</b>(相生):木生火、火生土、土生金、金生水、水生木,像一圈接力,上一个供养下一个。<b>克</b>(相克):木克土、土克水、水克火、火克金、金克木,隔一位相制。<b>相乘</b>是克得太过(如木太旺、土被压垮),<b>相侮</b>是反过来欺负(如土太弱、木反而不受制)。<b>通关</b>:两强相克时,取夹在中间的那个“母”来化解(如金木交战,取水)。脏腑对应来自《黄帝内经》的传统归类,属中医文化常识,不构成医疗建议。", "五行关系说明")}</div></div></div>`;
}
function wxfBind() {
  const re = () => refRender("wxflow");
  $$("[data-wv]", $("#pane-wxflow")).forEach(
    (b) =>
      (b.onclick = () => {
        WXF.view = b.dataset.wv;
        re();
      }),
  );
  $("#wxO").onchange = (e) => {
    WXF.ov = e.target.value;
    re();
  };
  const y = $("#wxY");
  if (y)
    y.onchange = () => {
      WXF.year = Math.max(1902, Math.min(2098, +y.value || nowBJ().y));
      re();
    };
  $$("#wxSvg .wx-n").forEach(
    (n) =>
      (n.onclick = () => {
        const i = +n.dataset.i;
        WXF.sel = WXF.sel === i ? null : i;
        re();
      }),
  );
  const pickR = (i) => {
    WXF.rsel = WXF.rsel === i ? null : i;
    const keep = window.scrollY;
    re();
    window.scrollTo(0, keep);
  };
  $$("#wxRefSvg .wx-n").forEach((n) => (n.onclick = () => pickR(+n.dataset.ri)));
  $$(".wx-tbl tbody tr", $("#pane-wxflow")).forEach(
    (r) => (r.onclick = () => pickR(+r.dataset.rr)),
  );
}
REF_PANES.wxflow = wxfPage;
REF_BIND.wxflow = wxfBind;

/* =====================================================================
   分享与导出:永久链接 · 状态码 · 结构化 JSON · 导入
   - 永久链接:把“出生资料 + 当前页 + 页面设置 + 联动焦点”编码进网址 # 之后。仅在页面作为独立文件或自己的网站打开时,
     地址栏才能带上它;在某些嵌入式作品框里,地址栏不属于本页,请改用“状态码”(任何地方都能粘贴导入)。
   - 编码只是 base64,不是加密:含出生资料的链接等于把资料交给拿到链接的人。
   ===================================================================== */
const SH = { opts: { birth: 1, name: 0, page: 1, fx: 1 }, year: null };
const SH_INP = [
  "shY",
  "tsY",
  "seaY",
  "zrStart",
  "liuYear",
  "ziYear",
  "flY",
  "fdY",
  "nwViewD",
  "stuObsD",
  "ntY",
  "ntT",
  "zfY",
  "wxY",
]; /* 白名单:只收这几类年份/日期输入,绝不收 API Key 等 */
const SH_PAGE = {
  zwfly: {
    get: () => ({ layer: ZF.layer, on: ZF.on, sel: ZF.sel, year: ZF.year }),
    set: (o) => {
      if (o && o.layer) ZF.layer = o.layer;
      if (o && o.on && typeof o.on === "object") ZF.on = o.on;
      ZF.sel = o?.sel == null ? null : Number(o.sel);
      ZF.year = o?.year == null ? null : Number(o.year);
      ZF.chain = null;
      try {
        zfSanitizeState(R?.zw || null);
      } catch (_) {}
    },
  },
  wxflow: {
    get: () => ({ view: WXF.view, ov: WXF.ov, sel: WXF.sel, year: WXF.year, rsel: WXF.rsel }),
    set: (o) => Object.assign(WXF, o),
  },
  natal: {
    get: () => ({
      kind: NT.kind,
      sys: NT.sys,
      year: NT.year,
      target: NT.target,
      relon: NT.relon,
      relat: NT.relat,
    }),
    set: (o) => Object.assign(NT, o),
  },
  vedic: { get: () => ({ style: VD.style }), set: (o) => Object.assign(VD, o) },
  me: { get: () => ({ tab: ME.tab }), set: (o) => Object.assign(ME, o) },
};
const curTab = () => {
  const p = $(".pane.on");
  return p ? p.id.replace(/^pane-/, "") : "now";
};
function shCapture(o) {
  o = Object.assign({}, SH.opts, o || {});
  const st = { v: 1, tab: curTab() };
  if (o.birth && R && $("#dt") && $("#dt").value) {
    const lon = $("#lon"),
      lat = $("#lat");
    st.prof = {
      dt: $("#dt").value,
      gender: $("#gender").value,
      solar: !!($("#solarChk") && $("#solarChk").checked),
      prov: ($("#pprov") || {}).value || "",
      cty: ($("#pcty") || {}).value || "",
      dis: ($("#pdis") || {}).value || "",
      lon: lon ? +lon.value : null,
      lat: lat ? +lat.value : null,
    };
    if (o.name && $("#pname").value.trim()) st.prof.name = $("#pname").value.trim();
  }
  if (o.page) {
    const t = st.tab;
    if (SH_PAGE[t]) st.pg = { [t]: SH_PAGE[t].get() };
    const inp = {};
    SH_INP.forEach((id) => {
      const e = $("#" + id);
      if (e && e.closest("#pane-" + t) && e.value) inp[id] = e.value;
    });
    if (Object.keys(inp).length) st.inp = inp;
  }
  if (o.fx && FX && FX.kind) st.fx = { kind: FX.kind, id: FX.id };
  return st;
}
const shBase = () => {
  try {
    return location.href.split("#")[0];
  } catch (e) {
    return "";
  }
};
const shLink = (o) => shBase() + "#tj1=" + tjEnc(shCapture(o));
async function shSave(name, text, mime) {
  try {
    const dl = await getCap("downloads");
    if (dl) {
      return await saveFile(name, text);
    }
  } catch (e) {}
  try {
    const a = document.createElement("a"),
      b = new Blob([text], { type: mime || "application/json" });
    a.href = URL.createObjectURL(b);
    a.download = name;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      URL.revokeObjectURL(a.href);
      a.remove();
    }, 500);
    return true;
  } catch (e) {
    toast("保存失败,请改用“复制”");
    return false;
  }
}
async function shCopy(text, msg) {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      toast(msg || "已复制");
      return true;
    }
  } catch (e) {}
  try {
    const t = document.createElement("textarea");
    t.value = text;
    t.style.cssText = "position:fixed;opacity:0";
    document.body.appendChild(t);
    t.select();
    const ok = document.execCommand("copy");
    t.remove();
    if (ok) {
      toast(msg || "已复制");
      return true;
    }
  } catch (e) {}
  toast("浏览器不允许自动复制,请在文本框里手动全选复制");
  return false;
}
/* ---- 应用状态 ---- */
let SH_BUSY = false;
async function shApply(o) {
  if (!o || SH_BUSY) return false;
  SH_BUSY = true;
  try {
    if (o.prof && o.prof.dt) {
      const p = Object.assign({ solar: false, name: "" }, o.prof);
      if (p.lon != null && p.lat != null && !p.prov) {
        await meWaitIdle();
        const a = $("#lon"),
          b = $("#lat");
        if (a) a.value = p.lon;
        if (b) b.value = p.lat;
      }
      await meApplyProfile(p);
    }
    if (o.tab && $("#pane-" + o.tab)) {
      if (o.pg && SH_PAGE[o.tab] && o.pg[o.tab]) SH_PAGE[o.tab].set(o.pg[o.tab]);
      selectTab(o.tab, false);
      await sleep(350);
      if (o.inp) {
        for (const id of Object.keys(o.inp)) {
          if (!SH_INP.includes(id)) continue;
          const e = $("#" + id);
          if (e && e.value !== o.inp[id]) {
            e.value = o.inp[id];
            e.dispatchEvent(new Event("change", { bubbles: true }));
            await sleep(200);
          }
        }
      }
      if (REF_PANES[o.tab]) refRender(o.tab);
    }
    if (o.fx && o.fx.kind) fxSet(o.fx.kind, o.fx.id, "链接");
    return true;
  } catch (e) {
    console.error("shApply", e);
    toast("载入状态时出错:" + (e.message || e));
    return false;
  } finally {
    SH_BUSY = false;
  }
}
/* ---- 弹层 ---- */
function shInfo(o) {
  const st = shCapture(o),
    bits = [];
  bits.push(`页面:${(NAV_G.flatMap((x) => x.it).find((t) => t[0] === st.tab) || [0, st.tab])[1]}`);
  if (st.prof) {
    const c = st.prof.dt.replace("T", " ");
    bits.push(
      `出生资料:${c}${st.prof.name ? " · " + st.prof.name : ""}${st.prof.prov ? " · 含出生地" : st.prof.lon != null ? " · 含经纬度" : ""}`,
    );
  } else bits.push("不含出生资料");
  if (st.pg) bits.push("含本页设置");
  if (st.inp) bits.push("含年份/日期输入");
  if (st.fx) bits.push("含联动焦点");
  return bits.join(" · ");
}
function shOpen() {
  let m = $("#shBox");
  if (!m) {
    m = document.createElement("div");
    m.id = "shBox";
    m.hidden = true;
    document.body.appendChild(m);
    m.addEventListener("click", (e) => {
      if (e.target.dataset.sh === "close") {
        shClose();
        return;
      }
      const b = e.target.closest("[data-sha]");
      if (b) shAct(b.dataset.sha);
    });
    m.addEventListener("change", (e) => {
      const k = e.target.dataset.sho;
      if (k) {
        SH.opts[k] = e.target.checked ? 1 : 0;
        shFill();
      }
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !m.hidden && !(typeof ZM_FB !== "undefined" && ZM_FB)) shClose();
    });
  }
  m.innerHTML = `<div class="sr-back" data-sh="close"></div><div class="sh-card" role="dialog" aria-label="分享与导出">
   <div class="sh-hd"><b>分享 · 导出</b><button type="button" class="fx-x" data-sh="close" aria-label="关闭">✕</button></div>
   <div class="sh-opts"><label class="chk"><input type="checkbox" data-sho="birth"> 含出生资料</label><label class="chk"><input type="checkbox" data-sho="name"> 含姓名</label><label class="chk"><input type="checkbox" data-sho="page"> 含当前页设置</label><label class="chk"><input type="checkbox" data-sho="fx"> 含联动焦点</label></div>
   <p class="dim sm" id="shInfo"></p>
   <h4 class="gl">永久链接</h4><textarea id="shLink" readonly rows="3"></textarea>
   <div class="p5-ctl"><button type="button" class="gbtn sm" data-sha="copyLink">复制链接</button><button type="button" class="gbtn sm" data-sha="copyCode">只复制状态码</button><button type="button" class="gbtn sm" data-sha="addr">写入地址栏</button><span class="dim sm" id="shMsg"></span></div>
   <p class="note" style="margin:4px 0 8px">链接里的 <code>#tj1=</code> 之后就是状态码,<b>不是加密</b>:含出生资料时,拿到链接的人能还原出生时间。分享给别人前请先看上面一行写了什么。在某些嵌入式作品框里,地址栏不是本页的,请复制“状态码”,到另一边用“导入”粘贴。</p>
   <h4 class="gl">结构化 JSON <small class="dim">四柱、十神、喜用、五行流通、紫微宫位与飞化、星盘、吠陀</small></h4>
   <div class="p5-ctl"><label>附流年 <input type="number" id="shY" min="1902" max="2098"></label><button type="button" class="gbtn sm" data-sha="jsonSave">保存 .json</button><button type="button" class="gbtn sm" data-sha="jsonCopy">复制 JSON</button><span class="dim sm" id="shJInfo"></span></div>
   <h4 class="gl">导入</h4><textarea id="shIn" rows="3" placeholder="粘贴链接、状态码,或之前导出的 JSON(只读取其中的出生信息并重新排盘)"></textarea>
   <div class="p5-ctl"><button type="button" class="gbtn sm" data-sha="import">载入</button><span class="dim sm" id="shInMsg"></span></div></div>`;
  m.hidden = false;
  const y = $("#shY");
  y.value = SH.year || nowBJ().y;
  y.onchange = () => {
    SH.year = +y.value || null;
  };
  $$("[data-sho]", m).forEach((c) => {
    c.checked = !!SH.opts[c.dataset.sho];
  });
  shFill();
}
function shClose() {
  const m = $("#shBox");
  if (m) m.hidden = true;
}
function shFill() {
  const l = $("#shLink");
  if (!l) return;
  l.value = shLink();
  $("#shInfo").textContent = "此链接包含 → " + shInfo();
  const ji = $("#shJInfo");
  if (ji) ji.textContent = R ? "" : "(先排盘才有可导出的内容)";
}
async function shAct(a) {
  const msg = (t) => {
    const e = $("#shMsg");
    if (e) e.textContent = t;
  };
  if (a === "copyLink") await shCopy($("#shLink").value, "已复制链接");
  else if (a === "copyCode")
    await shCopy($("#shLink").value.split("#tj1=")[1] || "", "已复制状态码");
  else if (a === "addr") {
    try {
      history.replaceState(null, "", "#tj1=" + tjEnc(shCapture()));
      msg(location.hash.startsWith("#tj1=") ? "已写入地址栏" : "这个环境不允许修改地址栏,请用复制");
    } catch (e) {
      msg("这个环境不允许修改地址栏(常见于作品框),请用复制状态码");
    }
  } else if (a === "jsonSave" || a === "jsonCopy") {
    if (!R) {
      toast("请先排盘");
      return;
    }
    const y = +$("#shY").value || null,
      j = tjExport(R, {
        name: SH.opts.name ? $("#pname").value.trim() : null,
        year: y,
        now: new Date().toISOString(),
      }),
      txt = JSON.stringify(j, null, 2);
    if (a === "jsonCopy") {
      await shCopy(txt, "已复制 JSON(" + Math.round(txt.length / 1024) + " KB)");
    } else {
      const ok = await shSave(`天机盘-${stamp()}.json`, txt, "application/json");
      if (ok) toast("已保存 JSON");
    }
  } else if (a === "import") {
    const t = $("#shIn").value,
      o = tjParseAny(t),
      im = $("#shInMsg");
    if (!o) {
      im.textContent =
        "没有识别出有效内容。可以粘贴完整链接、#tj1= 之后的状态码,或本站导出的 JSON。";
      return;
    }
    im.textContent = "正在载入…";
    const ok = await shApply(o);
    im.textContent = ok ? (o.fromJson ? "已按 JSON 里的出生信息重新排盘" : "已载入") : "载入失败";
    if (ok) setTimeout(shClose, 700);
  }
}
/* ---- 入口 ---- */
(function mount(n) {
  const right = document.querySelector("#topnav .tn-right");
  if (!right) {
    if (n < 40) setTimeout(() => mount(n + 1), 250);
    return;
  }
  if ($("#tnShare")) return;
  const b = document.createElement("button");
  b.type = "button";
  b.className = "tn-b";
  b.id = "tnShare";
  b.title = "分享链接 / 状态码 / 导出 JSON";
  b.textContent = "分享";
  b.onclick = () => shOpen();
  right.insertBefore(b, $("#tnSearch") || right.firstChild);
})(0);
/* ---- 启动与哈希变化 ---- */
const SH_HASH = () => {
  try {
    return tjParseAny(location.hash);
  } catch (e) {
    return null;
  }
};
window.TJ_BOOT = !!SH_HASH();
if (window.TJ_BOOT)
  setTimeout(() => {
    const o = SH_HASH();
    if (o) shApply(o);
  }, 900);
window.addEventListener("hashchange", () => {
  const o = SH_HASH();
  if (o && !SH_BUSY) shApply(o);
});

/* =====================================================================
   奇门盘面互动:点宫位看详情(八神/九星/八门/天地盘干格/击刑/入墓/门宫关系/标记/评分构成/对宫),
   表头的值符、值使、驿马、空亡可点;并加“上/下一时辰”步进。
   解读文字复用站内已有的八门/九星/八神/干格表;门宫关系是五行生克的机械判断,与盘面的“门迫”标记一致(已核对)。
   ===================================================================== */
const QMS = { sel: null };
const QM_OPP = { 1: 9, 9: 1, 2: 8, 8: 2, 3: 7, 7: 3, 4: 6, 6: 4 };
const QM_TAGTXT = {
  值符: "值符所临之宫:本局主事之宫,贵人所在",
  值使: "值使门所落之宫:办事的门路所在",
  空亡: "此宫对应的地支逢旬空:力量落空,事不实或迟",
  驿马: "驿马所在:主出行、变动、加速",
  门迫: "八门克所在宫(五行相克):事受制,力不从心",
};
function qmWxRel(dw, pw) {
  if (dw === pw) return ["比和", "门与宫五行相同:力量相当,较稳定", "mid"];
  if ((dw + 1) % 5 === pw) return ["门生宫", "门生宫:门去滋养此宫,主得助得利", "good"];
  if ((pw + 1) % 5 === dw) return ["宫生门", "宫生门:宫在耗力生门,事可成但费力", "mid"];
  if ((dw + 2) % 5 === pw) return ["门迫", "门克宫(“门迫”):事受制,力不从心", "bad"];
  return ["宫制门", "宫克门:门被宫制,事受阻、施展不开", "bad"];
}
const qmChip = (p, txt) => `<button type="button" class="chip" data-qp="${p}">${txt}</button>`;
function qmDetHTML(R, p) {
  const q = R.qm;
  if (p == null || !q.cells[p]) {
    const rows = [1, 2, 3, 4, 6, 7, 8, 9]
      .map((pp) => {
        const c = q.cells[pp],
          ks = c.tags.map((t) => t.n).concat(c.geju.map((g) => g.n)),
          pr = QM_PAIR[c.hs + c.earth];
        if (pr && !ks.includes(pr[0])) ks.push(pr[0]);
        if (QM_JIXING[c.hs] === pp) ks.push("击刑");
        if (QM_MU[c.hs] === pp) ks.push("入墓");
        return { pp, c, ks };
      })
      .filter((x) => x.ks.length);
    return `<h4 class="gl">点任一宫看详情</h4><p class="dim sm">下面是整盘有标记的宫(点击跳到该宫):</p><div class="qm-sum">${rows.map((x) => `<button type="button" class="chip" data-qp="${x.pp}"><b>${PNAME[x.pp]}${PNUM[x.pp]}</b> ${x.ks.join("·")}</button>`).join("") || '<span class="dim">整盘没有特殊标记</span>'}</div>`;
  }
  if (p === 5)
    return `<h4 class="gl">中五宫</h4><p class="rt">中五宫不单独布星门,地盘干 <b>${q.cells[5].earth}</b> 寄坤二宫;天禽星随天芮寄坤二。</p>`;
  const c = q.cells[p],
    pr = QM_PAIR[c.hs + c.earth],
    dw = DOORWX[c.door],
    rel = qmWxRel(dw, PWX[p]),
    o = QM_OPP[p],
    co = q.cells[o];
  const sS = STAR_SC[c.star],
    sD = DOOR_SC[c.door],
    rest = c.score - sS - sD;
  const tcol = (t) => (t === "吉" ? "good" : t === "凶" ? "bad" : "mid");
  const rows = [
    ["八神", `<b>${c.god}</b> · ${QM_GOD_TXT[c.god] || ""}`],
    [
      "九星",
      `<b>天${c.star}${c.extra ? "(天禽寄)" : ""}</b> <span class="${tcol(STARTYPE[c.star])}">${STARTYPE[c.star]}星</span> · ${(QM_STAR_TXT[c.star] || "").replace(/^[^:]*:/, "")}`,
    ],
    [
      "八门",
      `<b>${c.door}门</b> <span class="${tcol(DOORTYPE[c.door])}">${DOORTYPE[c.door]}门</span> · ${(QM_DOOR_TXT[c.door] || "").replace(/^[^:]*:/, "")}`,
    ],
    [
      "天盘 / 地盘干",
      `天盘 <b>${c.hs}</b> 加 地盘 <b>${c.earth}</b>${c.center ? `(中五寄 ${c.center})` : ""}${pr ? ` → <b class="${tcol(pr[1])}">${pr[0]}</b>(${pr[1]})· ${pr[2]}` : " → 无特殊干格"}`,
    ],
    [
      "门宫五行",
      `${c.door}门属${WXK[dw]},${PNAME[p]}${PNUM[p]}宫属${WXK[PWX[p]]} → <b class="${rel[2]}">${rel[0]}</b> · ${rel[1]}`,
    ],
  ];
  const ex = [];
  if (QM_JIXING[c.hs] === p)
    ex.push(
      `<b class="bad">击刑</b>:天盘 ${c.hs} 落在${PNAME[p]}${PNUM[p]}宫,为六仪击刑(通行说法,主受制、反复)`,
    );
  if (QM_MU[c.hs] === p)
    ex.push(
      `<b class="bad">入墓</b>:天盘 ${c.hs} 落在其墓库宫(${PNAME[p]}${PNUM[p]}),主被困、不得发挥`,
    );
  if (ex.length) rows.push(["干的状态", ex.join("<br>")]);
  if (c.tags.length)
    rows.push(["标记", c.tags.map((t) => `<b>${t.n}</b>:${QM_TAGTXT[t.n] || ""}`).join("<br>")]);
  if (c.geju.length)
    rows.push([
      "格局",
      c.geju
        .map(
          (g) =>
            `<b class="${g.t === "吉" ? "good" : g.t === "凶" ? "bad" : "mid"}">${g.n}</b>${g.d ? ":" + g.d : ""}`,
        )
        .join("<br>"),
    ]);
  rows.push([
    "评分构成",
    `星 ${sS > 0 ? "+" : ""}${sS} · 门 ${sD > 0 ? "+" : ""}${sD} · 格局/空亡/门迫等 ${rest > 0 ? "+" : ""}${rest} = <b>${c.score > 0 ? "+" : ""}${c.score}</b>(只是机械加减,见页尾说明)`,
  ]);
  rows.push([
    "对宫",
    `${PNAME[o]}${PNUM[o]}宫(${PDIR[o]}):天${co.star} ${co.door}门 ${co.god} · 评分 ${co.score > 0 ? "+" : ""}${co.score} <small class="dim">(对宫常作“冲”看)</small>`,
  ]);
  return `<h4 class="gl">${PNAME[p]}${PNUM[p]}宫 · ${PDIR[p]}方 · ${WXK[PWX[p]]} ${p === q.q ? '<span class="pill g">值符宫</span>' : ""}${p === q.rr ? '<span class="pill">值使宫</span>' : ""}</h4>
   <div class="tbl-wrap"><table class="tbl"><tbody>${rows.map((r) => `<tr><th>${r[0]}</th><td>${r[1]}</td></tr>`).join("")}</tbody></table></div>
   <div class="fx-chips"><button type="button" class="chip" data-qp="${o}">看对宫 ${PNAME[o]}${PNUM[o]}</button><button type="button" class="chip" data-qgo="ask">按所问之事解读</button><button type="button" class="chip" data-qp="-1">清除选择</button></div>`;
}
function qmApply(p) {
  const pane = $("#pane-qimen");
  if (!pane || !R) return;
  QMS.sel = p == null || p < 0 ? null : p;
  $$(".qc", pane).forEach((c) => {
    const pp = +c.dataset.p;
    c.classList.toggle("sel", pp === QMS.sel);
    c.classList.toggle("rel", QMS.sel != null && QM_OPP[QMS.sel] === pp);
  });
  const d = $("#qmDet");
  if (d) d.innerHTML = qmDetHTML(R, QMS.sel);
}
document.addEventListener("click", (e) => {
  const t = e.target;
  if (!t || !t.closest) return;
  const pane = t.closest("#pane-qimen");
  if (!pane) return;
  const qp = t.closest("[data-qp]");
  if (qp && qp.dataset.qp !== "") {
    const v = +qp.dataset.qp;
    qmApply(v === QMS.sel && !qp.classList.contains("chip") ? -1 : v);
    const d = $("#qmDet");
    if (d && v >= 0 && window.innerWidth < 900)
      d.scrollIntoView({ block: "nearest", behavior: REDUCE ? "auto" : "smooth" });
    return;
  }
  const go = t.closest("[data-qgo]");
  if (go) {
    const a = $("#askOut");
    if (a) a.scrollIntoView({ behavior: REDUCE ? "auto" : "smooth", block: "start" });
    return;
  }
  const c = t.closest(".qc");
  if (c && c.dataset.p) {
    const v = +c.dataset.p;
    qmApply(v === QMS.sel ? -1 : v);
  }
});
/* 上 / 下一时辰:改顶部时间并推演(与“启动推演”同一条路径,但不回到此刻) */
function dvStep(mins) {
  if (running) return;
  const c = parseDt() || nowBJ(),
    jd = jdFromGreg(c.y, c.m, c.d, c.h, c.mi, 0) + mins / 1440,
    f = fromJD(jd),
    n = { y: f.y, m: f.m, d: f.d, h: f.h, mi: f.mi, s: 0 };
  if (n.y < 1901 || n.y > 2099) {
    toast("超出 1901–2099 年");
    return;
  }
  setLive(false);
  setDt(n);
  deduce(n, "quick");
}

renderQimen = function (R) {
  const q = R.qm,
    order = [4, 9, 2, 3, 5, 7, 8, 1, 6];
  const cells = order
    .map((p, i) => {
      const c = q.cells[p];
      if (p === 5)
        return `<div class="qc ctr" data-p="5" style="--i:${i}"><div><div style="font-size:12px;color:var(--dim)">中五宫</div><div class="hs" style="font-family:'Ma Shan Zheng',serif;font-size:34px;color:var(--gold2)">${c.earth}</div><div style="font-size:11px;color:var(--dim)">地盘 · 寄坤二</div></div></div>`;
      const stType = STARTYPE[c.star],
        gj = c.geju
          .concat(c.extra2 || [])
          .map((g) => `<div class="gj ${g.t}" title="${g.d || ""}">${g.n}</div>`)
          .join("");
      return `<div class="qc${p === q.q ? " zf" : ""}${p === q.rr ? " zs" : ""}${QMS.sel === p ? " sel" : ""}${QMS.sel != null && QM_OPP[QMS.sel] === p ? " rel" : ""}" data-p="${p}" style="--i:${i}"><div class="top2"><span class="god">${c.god}</span><span>${PNAME[p]}${PNUM[p]} · ${PDIR[p]}</span></div>
    <div class="mid"><span class="hs" data-scr="gz">${c.hs}</span><span class="star ${stType}">天${c.star}${c.extra ? '<small style="font-size:11px">(禽)</small>' : ""}</span></div>
    <div class="door ${DOORTYPE[c.door]}">${c.door}门</div>
    <div class="bot"><span class="es" title="地盘干">${c.earth}${c.center ? '<small style="font-size:10px">/' + c.center + "</small>" : ""}</span><div class="tags">${c.tags.map((g) => `<span class="tg2 ${g.t}">${g.n}</span>`).join("")}</div></div>${gj ? `<div>${gj}</div>` : ""}</div>`;
    })
    .join("");
  const flags = [q.fuyin ? "伏吟" : "", q.fanyin ? "反吟" : ""].filter(Boolean).join(" · ");
  const list = (arr) =>
    arr
      .map((p) => {
        const c = q.cells[p];
        return `<li><b>${PNAME[p]}${PNUM[p]}宫 · ${PDIR[p]}</b> <span class="door ${DOORTYPE[c.door]}">${c.door}门</span> 天${c.star} ${c.god}<span style="color:var(--dim)"> (${c.score > 0 ? "+" : ""}${c.score})</span></li>`;
      })
      .join("");
  return `<div class="panel blk"><div class="kv"><span><b>${q.yang ? "阳" : "阴"}遁${PNUM[q.ju]}局</b></span><span>节气 <b>${q.term}</b>${q.yuanName}</span><span>时柱 <b>${q.hourGZ}</b></span><span>旬首 <b>甲${ZHI[(R.bz.hourIdx - (R.bz.hourIdx % 10)) % 12]}${q.dun}</b></span><span>值符 <b class="qlink" data-qp="${q.q}" title="点此定位到值符宫">天${q.zfStar}</b></span><span>值使 <b class="qlink" data-qp="${q.rr}" title="点此定位到值使宫">${q.zsDoor}门</b></span>${flags ? `<span style="color:var(--red)"><b>${flags}</b></span>` : ""}</div>
  <div class="kv" style="margin-top:4px"><span>空亡 <b>${q.kongB.map((b) => ZHI[b]).join("")}</b>(${q.kongP.map((p) => `<b class="qlink" data-qp="${p}">${PNAME[p]}${PNUM[p]}</b>`).join("、")}宫)</span><span>驿马 <b>${ZHI[q.horseB]}</b>(<b class="qlink" data-qp="${q.horseP}">${PNAME[q.horseP]}${PNUM[q.horseP]}</b>宫)</span></div></div>
  <div class="panel blk"><div class="qgrid">${cells}</div><div class="qm-det" id="qmDet">${qmDetHTML(R, QMS.sel)}</div><p class="note">点宫位可看详情(八神、九星、八门、天地盘干格、击刑、入墓、门宫关系、评分构成、对宫)。每宫从上到下:八神 / 宫位方位、天盘干与九星、八门、地盘干与标记。红框为值符落宫,青点为值使落宫。地盘按局排三奇六仪,转盘九星八门整体旋转,天禽寄坤二随天芮。</p></div>
  <div class="panel blk dirs"><div><h3 class="sec">结构较顺之方</h3><ul>${list(q.best)}</ul></div><div><h3 class="sec">结构偏阻之方</h3><ul>${list(q.worst)}</ul></div></div>
  <div class="panel blk"><h3 class="sec">问事分析 · 按所问之事解读此盘</h3>${topicBar("asks", QM_TOPICS, qmTopic)}<div id="askOut">${readingHTML(qimenAsk(R, qmTopic), { foot: RD_FOOT })}</div></div>
  <p class="note">评分只是把星、门、格局、空亡、门迫做机械加减(吉门 +2、凶门 −2,吉凶格 ±2,空亡、门迫各 −1),用来展示盘面结构,并非断语。此为时家转盘奇门·拆补法,以交节时刻换局;定局取当前所处节气查局数表,再以日柱所属旬的符头地支定上/中/下元(现行软件最常见的“拆补”口径);更严格的“节气日起用上元、未完部分拆到下元之后补足”的拆补写法、超神接气置闰、茅山法、阴盘、飞盘等排法不同,结果会有出入。局数、地盘、九星、八门、天盘干已与另一套开源拆补实现对拍一致。</p>`;
};

const LP_DIR8 = [
  ["正北", 0],
  ["东北", 45],
  ["正东", 90],
  ["东南", 135],
  ["正南", 180],
  ["西南", 225],
  ["正西", 270],
  ["西北", 315],
];
const dn8 = (d) => (Array.isArray(d) ? d[0] : d);
function lpReadHTML(L) {
  const f = p5Facing(L.deg, L.tol),
    m = f.mtn,
    ls = { 坎: 1, 坤: 2, 震: 3, 巽: 4, 乾: 6, 兑: 7, 艮: 8, 离: 9 };
  return `<div class="lp-card face"><small>向(正面朝向)</small><b>${m.n}山${f.zheng ? "" : " 兼" + f.jian.n}</b><span>${L.deg.toFixed(1)}° · ${f.dir8[0]}(${f.dir8[1]})${f.zheng ? "" : " · 偏" + (f.off > 0 ? "+" : "") + f.off.toFixed(1) + "°"}</span></div>
   <div class="lp-card sit"><small>坐(背靠方向)</small><b>${f.sitting.n}山</b><span>${((L.deg + 180) % 360).toFixed(1)}° · ${f.sitDir8[0]}(${f.sitDir8[1]})</span></div>
   <div class="lp-card"><small>三元龙 · 阴阳</small><b>${m.yuan}</b><span>${m.yy ? "阳" : "阴"}山 · ${m.gua}卦 · 洛书 ${ls[m.gua]}</span></div>
   <div class="lp-card"><small>地支 · 生肖</small><b>${ZHI[p5Branch(L.deg)]}</b><span>${P5_SHENG[p5Branch(L.deg)]} · 本山属${m.gua}宫</span></div>`;
}
function lpYearHints(L) {
  const f = p5Facing(L.deg, L.tol),
    Y = p5NowYear(),
    S = p5YearSha(Y),
    out = [];
  const face = f.dir8[0],
    sit = f.sitDir8[0];
  const items = [
    ["太岁", dn8(S.taisui.dir), "传统说“太岁头上不可动土”,向太岁方宜稳不宜大动"],
    ["岁破", dn8(S.suipo.dir), "与太岁正冲,传统视为破坏力最强,忌大兴土木"],
    ...S.sansha.items.map((i) => [i.n, dn8(i.dir), "三煞之一,传统忌该方位动土、安床"]),
    ["五黄", S.wuhuang.dir, "玄空流年关煞,宜静不宜动"],
    ["二黑", S.erhei.dir, "病符星,传统主疾病,宜静"],
    ["暗剑", S.anjian.dir, "与五黄正对,同样宜静"],
  ];
  items.forEach(([n, d, why]) => {
    if (!d) return;
    if (d === face) out.push({ t: "凶", txt: `向(${face}方)与今年「${n}」同方位:${why}。` });
    if (d === sit) out.push({ t: "凶", txt: `坐(${sit}方)与今年「${n}」同方位:${why}。` });
  });
  [
    ["岁德", S.suide.deg == null ? null : dn8(p5Dir8(S.suide.deg))],
    ["岁德合", S.suideHe.deg == null ? null : dn8(p5Dir8(S.suideHe.deg))],
  ].forEach(([n, d]) => {
    if (d && d === face)
      out.push({ t: "吉", txt: `向(${face}方)与今年「${n}」同方位,传统视为吉方之一。` });
  });
  return { Y, gz: S.gz, out };
}

P5.lpAdv = !!P5.lpAdv;

p5LuopanPage = function () {
  const L = P5.lp,
    f = p5Facing(L.deg, L.tol),
    kw = p5Kongwang(L.deg, L.kw),
    m = f.mtn,
    cs = p5ChangSheng(L.ju),
    b = p5Branch(L.deg),
    H = lpYearHints(L);
  const sb = (n) =>
    `<label class="chk"><input type="checkbox" data-lp="${n[0]}"${L[n[0]] ? " checked" : ""}> ${n[1]}</label>`;
  const plain = `你面朝<b>${f.dir8[0]}</b>(${f.dir8[1]}卦位),背靠<b>${f.sitDir8[0]}</b>。罗盘上这个朝向落在<b>${m.n}山</b>${f.zheng ? "(正向,没有偏)" : `,偏向${f.jian.n}山 ${Math.abs(f.off).toFixed(1)}°,叫“兼${f.jian.n}”`}。<b>${m.n}山</b>属<b>${m.yuan}龙</b>、<b>${m.yy ? "阳" : "阴"}山</b>:这两个标记是玄空飞星排盘时决定“顺飞还是逆飞”的依据。${kw ? `<br><span class="p5-xiong">提示:朝向接近${kw.type}(距缝 ${kw.dist.toFixed(1)}°)</span>,传统认为朝向压在两山交界的缝上,力量不纯,放盘时尽量避开。` : ""}`;
  return `<div class="panel blk p5">${phHead("综合罗盘", "24山 · 三元龙 · 阴阳 · 十二支 · 八卦 · 洛书 · 十二长生 · 空亡线")}
  <div class="lp-read" id="lpRead">${lpReadHTML(L)}</div>
  <div class="lp-ctl"><div class="lp-row"><label>朝向 <input type="number" id="lpD" min="0" max="360" step="0.1" value="${L.deg.toFixed(1)}">°</label><input type="range" id="lpR" min="0" max="360" step="0.1" value="${L.deg}" aria-label="朝向滑块">
    <span class="lp-steps"><button class="gbtn sm" data-step="-1">−1°</button><button class="gbtn sm" data-step="-0.1">−0.1°</button><button class="gbtn sm" data-step="0.1">+0.1°</button><button class="gbtn sm" data-step="1">+1°</button></span></div>
   <div class="lp-row"><span class="lp-dirs">${LP_DIR8.map(([n, d]) => `<button class="chip${Math.abs(((L.deg - d + 540) % 360) - 180) < 1 ? " on" : ""}" data-dir="${d}">${n}</button>`).join("")}</span>
    <select id="lpPre" aria-label="按山定向"><option value="">按 24 山定向…</option>${P5_N24.map((x) => `<option value="${x.c}">正${x.n}山(${x.c}°)</option>`).join("")}</select></div>
   <p class="lp-tip">操作:<b>在罗盘上按住拖动</b>即可转到想要的朝向;点一个山直接对准它;也可以用滑块、输入框或上面的快捷按钮。</p></div>
  <div class="nt-wrap"><div class="nt-fig" id="lpFig">${p5LuopanSVG(L)}</div>
  <div class="nt-side">
   <h4 class="gl">这个朝向是什么意思</h4><p class="rt" id="lpPlain">${plain}</p>
   <h4 class="gl">对照今年(${H.Y} ${H.gz})</h4>${H.out.length ? `<ul class="lp-hint">${H.out.map((x) => `<li class="${x.t === "吉" ? "g" : "r"}"><b>${x.t}</b>${x.txt}</li>`).join("")}</ul>` : '<p class="dim sm">这个朝向和今年的太岁、岁破、三煞、五黄二黑不在同一方位,没有明显冲撞。</p>'}
   <div class="fx-chips"><button type="button" class="chip" data-lpgo="sha">看今年神煞方位盘</button><button type="button" class="chip" data-lpgo="xk">以此朝向排玄空飞星</button><button type="button" class="chip" data-lpgo="house">房屋方位</button></div>
   <h4 class="gl">读数表</h4><div class="tbl-wrap"><table class="tbl"><tbody>
    <tr><th>向</th><td><b class="gold">${m.n}山</b> ${f.zheng ? "正向" : `<b>兼${f.jian.n}</b>`}(偏 ${f.off > 0 ? "+" : ""}${f.off.toFixed(1)}°) · ${f.dir8[0]}(${f.dir8[1]})</td></tr>
    <tr><th>坐</th><td>${f.sitting.n}山 · ${f.sitDir8[0]}(${f.sitDir8[1]})</td></tr>
    <tr><th>三元龙</th><td>${m.yuan} · ${m.yy ? "阳" : "阴"}山 · ${m.gua}卦</td></tr>
    <tr><th>${L.ju}局长生</th><td>${ZHI[b]}位为「${cs[b]}」;长生在${ZHI[P5_JU[L.ju]]}</td></tr>
    <tr><th>空亡线</th><td>${kw ? `<span class="p5-xiong">近${kw.type}</span>(距缝 ${kw.dist.toFixed(1)}°,线在 ${kw.at}°)` : `<span class="p5-ji">不在缝针范围</span>(±${L.kw}°)`}</td></tr></tbody></table></div>
   <details class="ph-note" id="lpAdv"${P5.lpAdv ? " open" : ""}><summary>进阶设置(出卦半宽、缝针宽度、三合局、图层)</summary><div class="lp-adv"><label>正向半宽° <input type="number" id="lpTol" min="0.5" max="7" step="0.5" value="${L.tol}"></label><label>空亡缝针半宽° <input type="number" id="lpKw" min="0.5" max="3" step="0.5" value="${L.kw}"></label><label>三合局(十二长生) <select id="lpJu">${["水", "木", "火", "金"].map((j) => `<option${L.ju === j ? " selected" : ""}>${j}</option>`).join("")}</select></label>${[
     ["showYY", "阴阳点"],
     ["showKW", "空亡线"],
     ["yuan", "十二长生"],
   ]
     .map(sb)
     .join("")}</div></details>
   ${phNote("“兼向”:偏离本山中线超过设定半宽记为兼向,至半山(7.5°)为止。空亡线:八卦分界(22.5°+45°k)为大空亡,其余山间缝为小空亡;古人对缝针的宽度与忌讳各派不同,半宽可自行调整。本页是纯计算罗盘;要用手机实测朝向,请回「观象盘」页的能量感应层读取读数后填到这里。")}
  </div></div>${P5_NOTE}
  ${p5Audit(["24山中心度数:子0°、癸15°、丑30°……壬345°,每山15°;三元龙与阴阳取自玄空模块,经公开山向表反推校验。", "阴阳(玄空顺逆):阳:乾坤艮巽(天元)、寅申巳亥(人元)、甲庚壬丙(地元);阴:子午卯酉、乙辛丁癸、辰戌丑未。", "十二长生:各三合局长生所在支:水局申、木局亥、火局寅、金局巳,自长生起顺布(三合派水法口径,不分阴阳顺逆)。", "“对照今年”:把朝向/坐向所在的八方位,与今年太岁、岁破、三煞、五黄、二黑、暗剑所在方位逐一比对(同方位才提示);岁德同理。方位按八方划分,不是精确到度。", "60龙、72龙、120分金、28宿对应24山:这里没有收录。典籍版本之间差异大,没有可核对的来源,宁可不列。", "出卦、兼向的度数界限为通行口径,不同流派不同,已设为可调。"])}</div>`;
};

p5LuopanBind = function () {
  const L = P5.lp,
    pane = $("#pane-luopan"),
    re = () => refRender("luopan"),
    setD = (d) => {
      L.deg = ((+d % 360) + 360) % 360;
      re();
    };
  if (!$("#lpD")) return;
  const adv = $("#lpAdv");
  if (adv)
    adv.ontoggle = () => {
      P5.lpAdv = adv.open;
    };
  const live = () => {
    const fig = $("#lpFig");
    if (fig) fig.innerHTML = p5LuopanSVG(L);
    $("#lpRead").innerHTML = lpReadHTML(L);
    $("#lpD").value = L.deg.toFixed(1);
    $("#lpR").value = L.deg;
  };
  $("#lpD").onchange = (e) => setD(e.target.value);
  $("#lpR").oninput = (e) => {
    L.deg = +e.target.value;
    live();
    clearTimeout(p5LuopanBind.t);
    p5LuopanBind.t = setTimeout(re, 250);
  };
  $$("[data-step]", pane).forEach((b) => (b.onclick = () => setD(L.deg + +b.dataset.step)));
  $$("[data-dir]", pane).forEach((b) => (b.onclick = () => setD(+b.dataset.dir)));
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
  $$("[data-lp]", pane).forEach(
    (c) =>
      (c.onchange = () => {
        L[c.dataset.lp] = c.checked ? 1 : 0;
        re();
      }),
  );
  $$("[data-lpgo]", pane).forEach(
    (b) =>
      (b.onclick = () => {
        const v = b.dataset.lpgo;
        if (v === "xk") {
          try {
            XKS.zuo = p5Facing(L.deg, L.tol).sitting.n;
          } catch (e) {}
        }
        selectTab(v === "xk" ? "xk" : v, true);
      }),
  );
  /* 在罗盘上按住拖动:指针相对圆心的角度(自正上方顺时针)就是朝向;短按(<5px)仍是“点山对准” */
  const fig = $("#lpFig");
  let drag = null;
  const ang = (e) => {
    const svg = $("#lpSvg"),
      r = svg.getBoundingClientRect(),
      dx = e.clientX - (r.left + r.width / 2),
      dy = e.clientY - (r.top + r.height / 2);
    return ((Math.atan2(dx, -dy) * 180) / Math.PI + 360) % 360;
  };
  fig.onpointerdown = (e) => {
    if (e.button > 0 || !e.target.closest("#lpSvg")) return;
    drag = { x: e.clientX, y: e.clientY, moved: false, id: e.pointerId, t: e.target };
    try {
      fig.setPointerCapture(e.pointerId);
    } catch (_) {}
  };
  fig.onpointermove = (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    if (!drag.moved && Math.hypot(e.clientX - drag.x, e.clientY - drag.y) < 5) return;
    drag.moved = true;
    fig.classList.add("dv-grab");
    L.deg = Math.round(ang(e) * 10) / 10;
    live();
  };
  fig.onpointerup = (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const d0 = drag,
      mv = drag.moved;
    drag = null;
    fig._pt = Date.now();
    fig.classList.remove("dv-grab");
    if (mv) re();
    else {
      /* 短按:点在 24 山那一圈上,就按角度对准最近的山(文字压在扇形上,直接取元素不可靠) */
      const svg = $("#lpSvg"),
        r = svg.getBoundingClientRect(),
        dx = e.clientX - (r.left + r.width / 2),
        dy = e.clientY - (r.top + r.height / 2),
        rr = Math.hypot(dx, dy) / (r.width / 2);
      if (rr >= 0.74 && rr <= 0.99) {
        const a = ang(e),
          t = P5_N24.reduce(
            (b, x) =>
              Math.abs(((x.c - a + 540) % 360) - 180) < Math.abs(((b.c - a + 540) % 360) - 180)
                ? x
                : b,
            P5_N24[0],
          );
        setD(t.c);
      }
    }
  };
  fig.onpointercancel = () => {
    drag = null;
    fig.classList.remove("dv-grab");
  };
  /* 键盘、辅助技术或脚本触发的 click(前面没有指针按下):按被点的山对准 */
  fig.onclick = (e) => {
    if (Date.now() - (fig._pt || 0) < 500) return;
    const m = e.target.closest && e.target.closest(".p5-m");
    if (m) {
      const t = P5_N24.find((x) => x.n === m.dataset.m);
      if (t) setD(t.c);
    }
  };
};

REF_PANES.luopan = p5LuopanPage;
REF_BIND.luopan = p5LuopanBind;

/* 奇门 / 六壬：启动推演旁加入上、下一时辰 */
dvDecorate = function () {
  Object.keys(DV.mods).forEach((id) => {
    const pane = $("#pane-" + id),
      m = DV.mods[id];
    if (!pane || !m) return;
    let host = pane.querySelector(m.sel);
    if (!host) host = pane.querySelector(".panel.blk");
    if (!host) return;
    host.classList.add("dv-host");
    let box = host.querySelector(":scope > .dvbox");
    if (!box) {
      box = document.createElement("div");
      box.className = "dvbox";
      host.insertBefore(box, host.firstChild);
    }
    const r = (DV.last && DV.last[id]) || null;
    box.innerHTML = `${id === "qimen" || id === "liuren" ? `<span class="dvstep"><button type="button" class="gbtn sm" data-step="-120">← 上一时辰</button><button type="button" class="gbtn sm" data-step="120">下一时辰 →</button></span>` : ""}<span class="dvst">${r ? `上次 · ${r.when}` : "按当前输入时间"}</span><button type="button" class="dvbtn">启动推演</button>`;
    box.querySelector(".dvbtn").onclick = () => startDerive(id);
    box.querySelectorAll("[data-step]").forEach((b) => (b.onclick = () => dvStep(+b.dataset.step)));
  });
};

/* 把新页加入顶部目录 / 搜索 */
try {
  const g = NAV_G.find((x) => x.g === "命局");
  if (g) {
    let q = g.it.findIndex((x) => x[0] === "qizheng");
    if (!g.it.some((x) => x[0] === "zwfly"))
      g.it.splice(q < 0 ? g.it.length : q, 0, [
        "zwfly",
        "紫微飞星",
        "宫干飞化、生年/大限/流年四化网络",
        "紫微 飞星 飞化 四化 禄权科忌 宫干 自化 链路",
      ]);
    q = g.it.findIndex((x) => x[0] === "qizheng");
    if (!g.it.some((x) => x[0] === "wxflow"))
      g.it.splice(q < 0 ? g.it.length : q, 0, [
        "wxflow",
        "五行流通",
        "五行来源、生克、通关与流年大运叠加",
        "五行 流通 生克 通关 喜用 忌神 大运 流年",
      ]);
  }
} catch (e) {
  console.error(e);
}
setTimeout(() => {
  try {
    dvDecorate();
  } catch (e) {
    console.error(e);
  }
}, 1200);
