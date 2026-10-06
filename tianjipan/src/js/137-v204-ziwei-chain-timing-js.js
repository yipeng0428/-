(() => {
  "use strict";
  const BUILD = "v204 · 2026-10-06 13:34 +08:00";
  const SCHEMA = "tianji.ziwei.flying-depth.v2";
  const STORE = "tianjipan.ziwei.v204.scan.v1";
  const LABEL = {
    birth: "生年",
    major: "大限",
    yearly: "流年",
    monthly: "流月",
    daily: "流日",
    hourly: "流时",
  };
  const TONE = { 禄: "good", 权: "gold", 科: "cyan", 忌: "bad" };
  let scanState = { key: "", items: [], horizon: 30, scannedAt: "" };
  try {
    const x = JSON.parse(sessionStorage.getItem(STORE) || "null");
    if (x && Array.isArray(x.items)) scanState = x;
  } catch (_) {}

  const c204 = (x) => (x == null ? x : JSON.parse(JSON.stringify(x)));
  const e204 = (s) =>
    String(s ?? "").replace(
      /[&<>"']/g,
      (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
    );
  const current204 = () => {
    try {
      return typeof R !== "undefined" ? R : null;
    } catch (_) {
      return null;
    }
  };
  const palace204 = (zw, b) => (b == null || b < 0 ? "—" : zw?.pal?.[b]?.name || "—");
  const branch204 = (b) => (b == null || b < 0 ? "—" : ZHI[b]);
  const findStar204 = (zw, star) => {
    try {
      return zfStarPal(zw, star);
    } catch (_) {
      return null;
    }
  };
  const mapTrans204 = (zw, arr = []) =>
    arr.map((x) => {
      const p = findStar204(zw, x.star);
      return { h: x.type || x.h, star: x.star, to: p ? p.b : null, palace: p ? p.name : "未落宫" };
    });

  function target204(year) {
    const n = nowBJ(),
      m = n.m || 1,
      max = new Date(Date.UTC(year, m, 0)).getUTCDate(),
      d = Math.min(n.d || 1, max);
    return `${year}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")} ${String(n.h || 12).padStart(2, "0")}:${String(n.mi || 0).padStart(2, "0")}`;
  }
  function layerSet204(R0, year) {
    const zw = R0?.zw,
      api = window.TianjiZiwei;
    if (!zw || !api?.timelineAt) return { layers: [], timeline: null, chart: null };
    const chart = api.calculate(window.TianjiZiweiInput.fromResult(R0)),
      timeline = api.timelineAt(chart, target204(year), { dayDivide: "current" });
    const layers = [];
    layers.push({
      id: "birth",
      label: "生年",
      lifeBranch: zw.ming,
      stem: zw.ys,
      trans: zfFlyFrom(zw, zw.ys).map((x) => ({ ...x, palace: palace204(zw, x.to) })),
    });
    let mb = ZHI.indexOf(timeline.majorCycle?.branch || "");
    if (mb >= 0 && zw.pal[mb])
      layers.push({
        id: "major",
        label: "大限",
        lifeBranch: mb,
        stem: zw.pal[mb].stem,
        trans: zfFlyFrom(zw, zw.pal[mb].stem).map((x) => ({ ...x, palace: palace204(zw, x.to) })),
      });
    for (const id of ["yearly", "monthly", "daily", "hourly"]) {
      const x = timeline[id];
      if (!x) continue;
      const lb = ZHI.indexOf(x.lifePalace || "");
      layers.push({
        id,
        label: LABEL[id],
        lifeBranch: lb,
        stem: GAN.indexOf((x.ganzhi || "").charAt(0)),
        ganzhi: x.ganzhi || "",
        trans: mapTrans204(zw, x.transformations || []),
      });
    }
    return { layers, timeline, chart };
  }
  function nextHua204(zw, from, h) {
    if (from == null || from < 0 || !zw.pal[from]) return null;
    const f = zfFlyFrom(zw, zw.pal[from].stem).find((x) => x.h === h);
    return f
      ? {
          from,
          h,
          star: f.star,
          to: f.to,
          fromPalace: palace204(zw, from),
          toPalace: palace204(zw, f.to),
          stem: GAN[zw.pal[from].stem],
        }
      : null;
  }
  function transferChains204(zw, layers) {
    const out = [];
    layers.forEach((L) => {
      const lu = L.trans.find((x) => x.h === "禄"),
        ji = L.trans.find((x) => x.h === "忌");
      if (lu?.to != null) {
        const nx = nextHua204(zw, lu.to, "忌");
        if (nx)
          out.push({
            kind: "luToJi",
            layer: L.id,
            label: L.label,
            first: lu,
            next: nx,
            text: `${L.label}${lu.star}化禄落${palace204(zw, lu.to)} → 该宫宫干再化忌${nx.star}至${nx.toPalace}`,
          });
      }
      if (ji?.to != null) {
        const nx = nextHua204(zw, ji.to, "忌");
        if (nx)
          out.push({
            kind: "jiToJi",
            layer: L.id,
            label: L.label,
            first: ji,
            next: nx,
            text: `${L.label}${ji.star}化忌落${palace204(zw, ji.to)} → 该宫再飞忌${nx.star}至${nx.toPalace}`,
          });
      }
    });
    return out;
  }
  function jiTerminal204(zw, layers) {
    const out = [];
    layers.forEach((L) => {
      const ji = L.trans.find((x) => x.h === "忌");
      if (ji?.to == null) return;
      let C;
      try {
        C = zfChain(zw, ji.to, "忌");
      } catch (_) {
        return;
      }
      const path = (C.path || []).map((b) => ({ branch: b, palace: palace204(zw, b) }));
      out.push({
        layer: L.id,
        label: L.label,
        start: ji,
        chain: path,
        end: C.end,
        loop: C.loop,
        terminal: path.length ? path[path.length - 1] : null,
      });
    });
    return out;
  }
  function overlaps204(layers) {
    const mp = new Map();
    layers.forEach((L) =>
      L.trans.forEach((t) => {
        if (!t.star) return;
        if (!mp.has(t.star)) mp.set(t.star, []);
        mp.get(t.star).push({ layer: L.id, label: L.label, h: t.h, to: t.to, palace: t.palace });
      }),
    );
    return [...mp.entries()]
      .filter(([, a]) => a.length >= 2)
      .map(([star, a]) => {
        const sameH = a.some((x, i) => a.some((y, j) => j > i && y.h === x.h));
        const hasJi = a.some((x) => x.h === "忌"),
          hasLu = a.some((x) => x.h === "禄");
        return { star, entries: a, sameH, mixedLuJi: hasJi && hasLu };
      });
  }
  function trigger204(D, layers) {
    const out = [],
      targets = [
        { id: "origin", label: "来因宫", branch: D.origin?.branch },
        { id: "focus", label: "焦点宫", branch: D.focus?.branch },
      ].filter((x) => x.branch != null);
    layers
      .filter((x) => x.id !== "birth")
      .forEach((L) =>
        targets.forEach((T) => {
          const life = L.lifeBranch === T.branch,
            flies = L.trans.filter((x) => x.to === T.branch);
          if (life || flies.length)
            out.push({
              target: T.id,
              targetLabel: T.label,
              targetBranch: T.branch,
              layer: L.id,
              label: L.label,
              life,
              flies,
              text: `${L.label}${life ? "命宫落入" : ""}${life && flies.length ? "，且" : ""}${flies.length ? flies.map((x) => `${x.star}化${x.h}`).join("、") + "飞入" : ""}${T.label}`,
            });
        }),
      );
    return out;
  }
  function evidence204(data) {
    const ev = [];
    data.transfers.forEach((x, i) =>
      ev.push({
        id: `transfer.${i}`,
        claim: x.text,
        path: `layers.${x.layer}.四化落宫 → 本命宫干化忌`,
        state: "derived",
        basis: "宫干飞化确定性计算",
      }),
    );
    data.terminals.forEach((x, i) =>
      ev.push({
        id: `ji-chain.${i}`,
        claim: `${x.label}飞忌链：${x.chain.map((y) => y.palace).join(" → ")} · ${x.end}`,
        path: `zfChain(${x.start.to},忌)`,
        state: "derived",
        basis: "本命各宫宫干连续飞忌",
      }),
    );
    data.overlaps.forEach((x, i) =>
      ev.push({
        id: `overlap.${i}`,
        claim: `${x.star}跨层四化重叠：${x.entries.map((y) => y.label + "化" + y.h).join(" / ")}`,
        path: "layers[*].transformations.groupBy(star)",
        state: "derived",
        basis: "已验证四化表 + 各运限层四化",
      }),
    );
    data.triggers.forEach((x, i) =>
      ev.push({
        id: `trigger.${i}`,
        claim: x.text,
        path: `timeline.${x.layer}`,
        state: "derived",
        basis: "统一运限时间轴 + 落宫匹配",
      }),
    );
    return ev;
  }
  function build204(R0 = current204(), year) {
    const base = window.TianjiZiweiFlyingDepth?.analyze?.(R0, year) || null;
    if (!base?.available)
      return {
        schema: SCHEMA,
        build: BUILD,
        available: false,
        reason: base?.reason || "V203 飞星深度层不可用",
      };
    const Y = base.year,
      { layers, timeline, chart } = layerSet204(R0, Y),
      zw = R0.zw;
    const transfers = transferChains204(zw, layers),
      terminals = jiTerminal204(zw, layers),
      overlaps = overlaps204(layers),
      triggers = trigger204(base, layers);
    const data = {
      schema: SCHEMA,
      build: BUILD,
      available: true,
      year: Y,
      origin: base.origin,
      focus: base.focus,
      layers,
      transfers,
      terminals,
      overlaps,
      triggers,
      timeline,
      chart: null,
    };
    data.evidence = evidence204(data);
    data.summary = {
      transferCount: transfers.length,
      jiChains: terminals.length,
      overlapStars: overlaps.length,
      triggerCount: triggers.length,
      loopCount: terminals.filter((x) => x.end === "回环" || x.end === "自化").length,
      focusTriggers: triggers.filter((x) => x.target === "focus").length,
      originTriggers: triggers.filter((x) => x.target === "origin").length,
    };
    data.plain = `当前把生年、大限、流年、流月、流日、流时放在同一张飞星时间层里看。检测到 ${data.summary.overlapStars} 颗星出现跨层四化重叠，${data.summary.transferCount} 条“禄/忌落宫后再转飞”的二段链，${data.summary.loopCount} 条飞忌链最终形成自化或回环。${data.summary.originTriggers ? `来因宫被 ${data.summary.originTriggers} 个运限层直接触发；` : ""}${data.summary.focusTriggers ? `当前焦点宫被 ${data.summary.focusTriggers} 个运限层直接触发。` : ""}这些只是结构共振，不等于现实事件必然发生；真正解释仍应回看对应宫位、人事主题和现实背景。`;
    return data;
  }
  function scanKey204(D, h) {
    return `${D.year}|${D.focus?.branch}|${D.origin?.branch}|${h}`;
  }
  function dayScore204(zw, D, node) {
    let score = 0,
      why = [];
    const scopes = ["yearly", "monthly", "daily"];
    const focus = D.focus?.branch,
      origin = D.origin?.branch;
    const starMap = new Map();
    for (const id of scopes) {
      const x = node[id];
      if (!x) continue;
      const lb = ZHI.indexOf(x.lifePalace || "");
      if (lb === focus) {
        score += 2;
        why.push(`${LABEL[id]}命宫到焦点`);
      }
      if (lb === origin) {
        score += 1.5;
        why.push(`${LABEL[id]}命宫到来因`);
      }
      mapTrans204(zw, x.transformations || []).forEach((t) => {
        if (t.to === focus) {
          score += t.h === "忌" ? 3 : t.h === "禄" ? 2.2 : 1.5;
          why.push(`${LABEL[id]}${t.star}化${t.h}入焦点`);
        }
        if (t.to === origin) {
          score += t.h === "忌" ? 2.2 : 1.2;
          why.push(`${LABEL[id]}${t.star}化${t.h}入来因`);
        }
        if (!starMap.has(t.star)) starMap.set(t.star, []);
        starMap.get(t.star).push({ id, h: t.h });
      });
    }
    for (const [star, a] of starMap) {
      if (a.length >= 2) {
        score += 1.2;
        why.push(`${star}跨层重叠`);
      }
      if (a.some((x) => x.h === "禄") && a.some((x) => x.h === "忌")) {
        score += 0.8;
        why.push(`${star}禄忌同星跨层`);
      }
    }
    return { score: +score.toFixed(1), why: [...new Set(why)].slice(0, 8) };
  }
  function scan204(horizon = 30) {
    const R0 = current204(),
      D = build204(R0),
      api = window.TianjiZiwei;
    if (!D.available || !api?.timelineRange) throw new Error("运限扫描条件不足");
    const h = Math.max(7, Math.min(120, Number(horizon) || 30)),
      chart = api.calculate(window.TianjiZiweiInput.fromResult(R0)),
      start = D.timeline?.target?.text || target204(D.year);
    const range = api.timelineRange(chart, {
      start,
      unit: "day",
      count: h,
      detail: "full",
      maxItems: h,
      dayDivide: "current",
    });
    const items = (range.items || [])
      .map((n) => {
        const s = dayScore204(R0.zw, D, n);
        return {
          target: n.target?.text || "",
          score: s.score,
          why: s.why,
          yearly: n.yearly?.ganzhi || "",
          monthly: n.monthly?.ganzhi || "",
          daily: n.daily?.ganzhi || "",
        };
      })
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score || a.target.localeCompare(b.target))
      .slice(0, 20);
    scanState = { key: scanKey204(D, h), items, horizon: h, scannedAt: new Date().toISOString() };
    try {
      sessionStorage.setItem(STORE, JSON.stringify(scanState));
    } catch (_) {}
    return c204(scanState);
  }
  function layersHTML204(D) {
    return D.layers
      .map(
        (L) =>
          `<div class="zw204-item ${L.id === "birth" ? "gold" : L.id === "major" ? "good" : "cyan"}"><b><span class="zw204-layer ${L.id}">${e204(L.label)}</span>${L.ganzhi ? e204(L.ganzhi) : L.stem >= 0 ? GAN[L.stem] : ""}${L.lifeBranch >= 0 ? ` · 命宫 ${e204(palace204(current204()?.zw, L.lifeBranch))}` : ""}</b><small>${L.trans.map((x) => `${x.star}化${x.h}→${x.palace || palace204(current204()?.zw, x.to)}`).join(" · ")}</small></div>`,
      )
      .join("");
  }
  function transferHTML204(D) {
    if (!D.transfers.length)
      return '<div class="zw204-note">当前截面没有形成可列出的“禄转忌 / 忌转忌”二段链。</div>';
    return D.transfers
      .map(
        (x) =>
          `<div class="zw204-item ${x.kind === "jiToJi" ? "bad" : "good"}"><b>${x.kind === "jiToJi" ? "忌转忌" : "禄转忌"} · ${e204(x.label)}</b><small>${e204(x.text)}</small><div class="zw204-chain"><span class="zw204-node">${e204(x.first.star)}化${x.first.h} · ${e204(palace204(current204()?.zw, x.first.to))}</span><span class="zw204-arrow">→</span><span class="zw204-node">${e204(x.next.star)}化忌 · ${e204(x.next.toPalace)}</span></div></div>`,
      )
      .join("");
  }
  function terminalHTML204(D) {
    if (!D.terminals.length) return '<div class="zw204-note">当前没有可追踪的飞忌链。</div>';
    return D.terminals
      .map(
        (x) =>
          `<div class="zw204-item ${x.end === "回环" || x.end === "自化" ? "bad" : "cyan"}"><b>${e204(x.label)} · 飞忌终点：${e204(x.end)}</b><small>${e204(x.start.star)}化忌起于 ${e204(palace204(current204()?.zw, x.start.to))}</small><div class="zw204-chain">${x.chain.map((p, i) => `${i ? '<span class="zw204-arrow">→</span>' : ""}<span class="zw204-node">${e204(p.palace)}</span>`).join("")}</div></div>`,
      )
      .join("");
  }
  function overlapHTML204(D) {
    if (!D.overlaps.length)
      return '<div class="zw204-note">当前截面没有同一颗星跨两层以上出现四化。</div>';
    return D.overlaps
      .map(
        (x) =>
          `<div class="zw204-item ${x.mixedLuJi ? "bad" : x.sameH ? "good" : "cyan"}"><b>${e204(x.star)} · ${x.entries.length} 层重叠${x.mixedLuJi ? " · 含禄忌同星" : ""}</b><small>${x.entries.map((y) => `${y.label}化${y.h}→${y.palace || "—"}`).join(" / ")}</small></div>`,
      )
      .join("");
  }
  function triggerHTML204(D) {
    if (!D.triggers.length)
      return '<div class="zw204-note">当前时间截面没有运限层直接命中来因宫或焦点宫。</div>';
    return D.triggers
      .map(
        (x) =>
          `<div class="zw204-item ${x.target === "origin" ? "gold" : "cyan"}"><b>${e204(x.targetLabel)} · ${e204(x.label)}触发</b><small>${e204(x.text)}</small></div>`,
      )
      .join("");
  }
  function scanHTML204(D) {
    const keyPrefix = `${D.year}|${D.focus?.branch}|${D.origin?.branch}|`;
    const valid = scanState.key?.startsWith(keyPrefix);
    if (!valid || !scanState.items.length)
      return '<div class="zw204-note">尚未扫描。为保护 V201 的首屏性能，时间窗口搜索只在点击“开始扫描”后运行，不在页面启动时自动遍历。</div>';
    return `<div class="zw204-window">${scanState.items.map((x, i) => `<div class="zw204-day${i < 5 ? " hot" : ""}"><b>${e204(x.target.slice(0, 10))}</b><strong>${x.score.toFixed(1)}</strong><span>${e204(x.daily || "")}</span><small>${e204(x.why.join(" · "))}</small></div>`).join("")}</div>`;
  }
  function panel204() {
    const D = build204();
    if (!D.available)
      return `<section class="zw204"><div class="zw204-note">${e204(D.reason)}</div></section>`;
    return `<section class="zw204" id="zw204Depth">
  <section class="zw204-hero"><div class="zw204-head"><div><h3>紫微飞星二期 · 四化转链 / 应期触发 / Evidence</h3><p>继续把飞星从“看一条箭头”推进到“看多层时间如何叠加”。本层识别生年—大限—流年—流月—流日—流时的同星四化重叠、禄转忌/忌转忌、连续飞忌终点与回环，并提供按需时间窗口扫描。所有“触发”均是结构匹配，不等于现实事件必然发生。</p></div><span class="zw204-schema">${SCHEMA}</span></div></section>
  <div class="zw204-kpis">
   <div class="zw204-kpi cyan"><small>跨层同星</small><b>${D.summary.overlapStars}</b></div>
   <div class="zw204-kpi good"><small>转飞链</small><b>${D.summary.transferCount}</b></div>
   <div class="zw204-kpi bad"><small>飞忌链</small><b>${D.summary.jiChains}</b></div>
   <div class="zw204-kpi bad"><small>回环 / 自化</small><b>${D.summary.loopCount}</b></div>
   <div class="zw204-kpi cyan"><small>来因 / 焦点触发</small><b>${D.summary.originTriggers + D.summary.focusTriggers}</b></div>
  </div>
  <div class="zw204-grid">
    <section class="zw204-card"><h4>六层四化截面</h4><div class="zw204-list">${layersHTML204(D)}</div></section>
    <aside class="zw204-card"><h4>同星四化重叠</h4><div class="zw204-list">${overlapHTML204(D)}</div></aside>
  </div>
  <div class="zw204-grid">
    <section class="zw204-card"><h4>禄转忌 / 忌转忌</h4><div class="zw204-list">${transferHTML204(D)}</div></section>
    <aside class="zw204-card"><h4>连续飞忌 · 终点 / 回环</h4><div class="zw204-list">${terminalHTML204(D)}</div></aside>
  </div>
  <div class="zw204-grid">
    <section class="zw204-card"><h4>来因宫 / 焦点宫触发</h4><div class="zw204-list">${triggerHTML204(D)}</div></section>
    <aside class="zw204-card"><h4>大白话</h4><div class="zw204-plain">${e204(D.plain)}</div><div class="zw204-note" style="margin-top:7px">“禄转忌”“忌转忌”在这里是明确的数据链名称：某层四化先落宫，再读取该落宫的宫干化忌去向。它不是单独的吉凶结论。</div></aside>
  </div>
  <section class="zw204-card"><h4>时间窗口自动搜索</h4><div class="zw204-toolbar"><label>扫描天数<select id="zw204Horizon"><option value="14">14 天</option><option value="30" selected>30 天</option><option value="60">60 天</option><option value="90">90 天</option><option value="120">120 天</option></select></label><button class="primary" id="zw204Scan" type="button">开始扫描</button><button id="zw204Clear" type="button">清除结果</button><button id="zw204Copy" type="button">复制 V2 Schema</button></div><div id="zw204ScanResult" style="margin-top:7px">${scanHTML204(D)}</div></section>
  <section class="zw204-card"><h4>Evidence 链</h4><div class="zw204-ev">${D.evidence.length ? D.evidence.map((x) => `<div class="zw204-evrow"><b>${e204(x.id)}</b><small>${e204(x.claim)}<br>${e204(x.path)} · ${e204(x.basis)}</small><span>${x.state === "derived" ? "可追溯派生" : "规则口径"}</span></div>`).join("") : '<div class="zw204-note">当前没有可列出的派生 Evidence。</div>'}</div></section>
 </section>`;
  }
  function refresh204() {
    const old = document.getElementById("zw204Depth");
    if (!old) return;
    const box = document.createElement("div");
    box.innerHTML = panel204();
    old.replaceWith(box.firstElementChild);
    bind204();
  }
  function bind204() {
    const h = document.getElementById("zw204Horizon");
    if (h) h.value = String(scanState.horizon || 30);
    document.getElementById("zw204Scan")?.addEventListener("click", () => {
      const b = document.getElementById("zw204Scan");
      if (b) {
        b.disabled = true;
        b.textContent = "扫描中…";
      }
      setTimeout(() => {
        try {
          scan204(+(document.getElementById("zw204Horizon")?.value || 30));
          refresh204();
          try {
            toast("紫微触发窗口扫描完成");
          } catch (_) {}
        } catch (err) {
          if (b) {
            b.disabled = false;
            b.textContent = "开始扫描";
          }
          try {
            toast("扫描失败：" + (err.message || err));
          } catch (_) {}
        }
      }, 20);
    });
    document.getElementById("zw204Clear")?.addEventListener("click", () => {
      scanState = { key: "", items: [], horizon: 30, scannedAt: "" };
      try {
        sessionStorage.removeItem(STORE);
      } catch (_) {}
      refresh204();
    });
    document.getElementById("zw204Copy")?.addEventListener("click", () => {
      const txt = JSON.stringify(build204(), null, 2);
      navigator.clipboard
        ?.writeText?.(txt)
        .then(() => {
          try {
            toast("已复制紫微飞星 V2 Schema");
          } catch (_) {}
        })
        .catch(() => {});
    });
  }
  try {
    const oldP = REF_PANES.zwfly;
    if (oldP && !oldP.__v204) {
      const fn = () => {
        let a = "",
          b = "";
        try {
          a = oldP();
        } catch (err) {
          console.warn("[V204 previous render]", err);
          a = `<div class="panel blk"><p class="note bad">紫微飞星主视图渲染失败：${e204(err?.message || err)}</p></div>`;
        }
        try {
          b = panel204();
        } catch (err) {
          console.warn("[V204 panel render]", err);
          b = `<section class="zw204"><div class="zw204-note">四化转链层渲染失败：${e204(err?.message || err)}</div></section>`;
        }
        return a + b;
      };
      fn.__v204 = true;
      REF_PANES.zwfly = fn;
    }
    const oldB = REF_BIND.zwfly;
    const bf = () => {
      try {
        oldB && oldB();
      } catch (e) {
        console.warn("[V204 old bind]", e);
      }
      try {
        bind204();
      } catch (e) {
        console.warn("[V204 bind]", e);
      }
    };
    bf.__v204 = true;
    REF_BIND.zwfly = bf;
  } catch (e) {
    console.warn("[V204 patch]", e);
  }

  function selfTest204() {
    const checks = [],
      add = (id, ok, detail = "") => checks.push({ id, ok: !!ok, detail });
    try {
      const R0 = current204();
      if (!R0?.zw) {
        add("runtime.chart", true, "无当前命盘，跳过运行时盘测试");
        return { ok: true, checks };
      }
      const D = build204(R0);
      add("layers.min", D.layers.length >= 4, String(D.layers.length));
      add("birth.four", D.layers.find((x) => x.id === "birth")?.trans?.length === 4, "");
      add(
        "ji.chain",
        D.terminals.every((x) => Array.isArray(x.chain) && x.chain.length >= 1),
        String(D.terminals.length),
      );
      add(
        "overlap.shape",
        D.overlaps.every((x) => x.entries.length >= 2),
        String(D.overlaps.length),
      );
      add(
        "evidence.shape",
        D.evidence.every((x) => x.id && x.claim && x.path),
        String(D.evidence.length),
      );
    } catch (e) {
      add("exception", false, String((e && e.message) || e));
    }
    return { ok: checks.every((x) => x.ok), checks };
  }
  const TEST204 = selfTest204();

  const TASKS204 = [
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
      note: "v202：逐爻旺衰、卦格组合、传统应期候选",
    },
    {
      id: "ziwei-depth",
      p: "P1",
      name: "紫微完整飞星体系",
      state: "done",
      note: "v203–v204：来因宫、离心/向心自化、六层运限叠层、同星四化、禄转忌/忌转忌、飞忌回环、按需应期窗口扫描与 Evidence 链；完成当前声明流派口径的 V1 稳定层",
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
      state: "todo",
      note: "下一主线：运盘/山星/向星/替卦/宅盘解释",
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
  const BOARD204 = {
    schema: "tianji.priority.board.v1",
    build: BUILD,
    total: 14,
    done: 7,
    doing: 1,
    blocked: 1,
    progress: 53.6,
    next: ["玄空完整宅盘", "奇门日/月/年真实第三方 reference 样本", "三合水法 Core"],
    tasks: TASKS204,
  };
  function board204() {
    window.TianjiPriorityBoard = Object.freeze({
      schema: BOARD204.schema,
      snapshot: () => c204(BOARD204),
    });
    const road = window.TianjiRoadmap || {};
    window.TianjiRoadmap = Object.freeze(
      Object.assign({}, road, {
        urgentImportant: c204(BOARD204),
        nextMainline: [
          "玄空完整宅盘",
          "奇门四家第三方对拍（二期待外部样本）",
          "三合水法 Core",
          "历史时区 / DST",
        ],
      }),
    );
  }
  board204();
  window.addEventListener("tianji:lazy-ready", () => setTimeout(board204, 0));

  window.TianjiZiweiFlyingDepthV2 = Object.freeze({
    version: "2.0.0",
    build: BUILD,
    schema: SCHEMA,
    analyze: (runtime, year) => c204(build204(runtime || current204(), year)),
    scan: (h) => scan204(h),
    selfTest: () => c204(TEST204),
    manifest: () => ({
      module: "Tianji Ziwei Flying Depth V2",
      completeForDeclaredPolicy: true,
      features: [
        "六层四化叠层",
        "同星四化重叠",
        "禄转忌",
        "忌转忌",
        "飞忌终点/回环",
        "来因/焦点触发",
        "按需时间窗口搜索",
        "Evidence 链",
      ],
      boundaries: [
        "结构触发不是事件概率",
        "时间窗口为机械筛选，不是断言",
        "来因与自化术语继续遵循 V203 声明的飞星流派口径",
      ],
    }),
  });
  window.TianjiSystemV204 = {
    version: "v204",
    build: BUILD,
    ziweiFlyingDepthV2: true,
    baseline: "v203",
  };

  function sync204() {
    const b = document.getElementById("buildVersion");
  }
  /* V226: historical delayed version writer disabled */
})();
