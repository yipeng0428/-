(() => {
  "use strict";
  const BUILD = "v203 · 2026-10-06 13:12 +08:00";
  const SCHEMA = "tianji.ziwei.flying-depth.v1";
  const HUA203 = ["禄", "权", "科", "忌"];
  const HUA_TONE203 = { 禄: "good", 权: "gold", 科: "cyan", 忌: "bad" };
  const HUA_WORD203 = {
    禄: "资源、缘分与获得的流向",
    权: "推动、主导与控制的着力点",
    科: "名誉、秩序、缓冲与被看见",
    忌: "牵挂、阻塞、亏欠或反复用力处",
  };
  const clone203 = (x) => (x == null ? x : JSON.parse(JSON.stringify(x)));
  const e203 = (s) =>
    String(s ?? "").replace(
      /[&<>"']/g,
      (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
    );
  const current203 = () => {
    try {
      return typeof R !== "undefined" ? R : null;
    } catch (_) {
      return null;
    }
  };
  const pname203 = (zw, b) => zw?.pal?.[b]?.name || "—";
  const domain203 = (p) => {
    try {
      return RD_PAL[p.name]?.noun || RD_PAL[p.name]?.th || p.name;
    } catch (_) {
      return p?.name || "该领域";
    }
  };
  const huaTag203 = (h, txt) =>
    `<span class="zw203-tag ${h === "禄" ? "lu" : h === "权" ? "quan" : h === "科" ? "ke" : "ji"}">化${h}${txt ? " · " + e203(txt) : ""}</span>`;

  function origin203(zw) {
    if (!zw || !Array.isArray(zw.pal)) return null;
    /* 飞星派常用来因宫：寅至亥十宫中，宫干与生年天干相同的一宫。
     子丑宫因宫干重复不作为首选；这里明确按寅..亥取。 */
    let p = zw.pal.find((x) => x && x.b >= 2 && x.b <= 11 && x.stem === zw.ys);
    if (!p) {
      const branch = [10, 9, 8, 7, 6, 5, 4, 3, 2, 11][zw.ys];
      p = zw.pal[branch] || null;
    }
    return p
      ? { branch: p.b, name: p.name, stem: p.stem, stemName: GAN[p.stem], domain: domain203(p) }
      : null;
  }
  function centrifugal203(zw) {
    if (!zw) return [];
    const net = zfNet(zw, {});
    return net.edges
      .filter((x) => x.layer === "ben" && x.self)
      .map((x) => ({
        type: "centrifugal",
        label: "离心自化",
        from: x.from,
        to: x.to,
        h: x.h,
        star: x.star,
        palace: pname203(zw, x.from),
        stem: GAN[x.stem],
        definition: "本宫宫干化出的四化，落在本宫自身星曜。",
      }));
  }
  function inward203(zw) {
    if (!zw) return [];
    const out = [];
    for (const target of zw.pal) {
      if (!target) continue;
      const opp = (target.b + 6) % 12,
        src = zw.pal[opp];
      if (!src) continue;
      zfFlyFrom(zw, src.stem).forEach((f) => {
        if (f.to === target.b)
          out.push({
            type: "inward",
            label: "向心自化（对宫化入）",
            from: opp,
            to: target.b,
            h: f.h,
            star: f.star,
            sourcePalace: src.name,
            targetPalace: target.name,
            stem: GAN[src.stem],
            definition:
              "按本项目采用的飞星研究口径：对宫宫干所化之星落入本宫；部分流派称“向心自化”或“视同自化”。",
          });
      });
    }
    return out;
  }
  function birth203(zw) {
    if (!zw) return [];
    return zfFlyFrom(zw, zw.ys).map((f) => ({
      h: f.h,
      star: f.star,
      to: f.to,
      palace: f.to == null ? "未落宫" : pname203(zw, f.to),
      branch: f.to,
      stem: GAN[zw.ys],
    }));
  }
  function focus203(zw, origin) {
    const fallback = Number.isInteger(+origin?.branch)
      ? +origin.branch
      : Number.isInteger(+zw?.ming)
        ? +zw.ming
        : 0;
    const raw = typeof ZF !== "undefined" && ZF.sel != null ? Number(ZF.sel) : fallback;
    const b =
      Number.isInteger(raw) && raw >= 0 && raw < 12 && zw?.pal?.[raw]
        ? raw
        : zw?.pal?.[fallback]
          ? fallback
          : 0;
    if (typeof ZF !== "undefined" && ZF.sel != null && ZF.sel !== b) {
      ZF.sel = b;
      ZF.chain = null;
    }
    return { branch: b, palace: zw?.pal?.[b] || null, name: pname203(zw, b) };
  }
  function coupling203(zw, birth, cent, inw) {
    return birth.map((x) => {
      const c = cent.filter((z) => z.to === x.to),
        i = inw.filter((z) => z.to === x.to);
      const sameStarC = c.find((z) => z.star === x.star) || null;
      const sameStarI = i.find((z) => z.star === x.star) || null;
      return { ...x, centrifugal: c, inward: i, sameStarC, sameStarI };
    });
  }
  function target203(year) {
    const n = nowBJ(),
      m = n.m || 1,
      max = new Date(Date.UTC(year, m, 0)).getUTCDate(),
      d = Math.min(n.d || 1, max);
    return `${year}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")} ${String(n.h || 12).padStart(2, "0")}:${String(n.mi || 0).padStart(2, "0")}`;
  }
  function timeline203(R0, year, zw, focus) {
    const api = window.TianjiZiwei;
    if (!api || typeof api.timelineAt !== "function")
      return { available: false, reason: "统一紫微运限时间轴不可用", items: [] };
    try {
      const birth = window.TianjiZiweiInput.fromResult(R0),
        chart = api.calculate(birth),
        t = api.timelineAt(chart, target203(year), { dayDivide: "current" });
      const mk = (scope, label, gz, life, trans, extra = {}) => {
        const b = ZHI.indexOf(life || "");
        const trs = (trans || []).map((x) => {
          const loc = zfStarPal(zw, x.star);
          return {
            h: x.type || x.h,
            star: x.star,
            to: loc ? loc.b : null,
            palace: loc ? loc.name : "—",
          };
        });
        const hits = trs.filter((x) => x.to === focus.branch);
        return {
          scope,
          label,
          gz: gz || "",
          life: life || "",
          lifeBranch: b,
          transformations: trs,
          hits,
          focusLife: b === focus.branch,
          ...extra,
        };
      };
      const major = t.majorCycle || {},
        minor = t.minorPeriod || {};
      let mb = ZHI.indexOf(major.branch || ""),
        mstem = null,
        mtrs = [];
      if (mb >= 0 && zw.pal[mb]) {
        mstem = zw.pal[mb].stem;
        mtrs = zfFlyFrom(zw, mstem).map((x) => ({ type: x.h, star: x.star }));
      }
      const items = [
        mk("major", "大限", major.name || "", major.branch || "", mtrs, {
          range: major.range || null,
        }),
        mk("minor", "小限", minor.name || "", minor.branch || "", [], {}),
        mk(
          "yearly",
          "流年",
          t.yearly?.ganzhi,
          t.yearly?.lifePalace,
          t.yearly?.transformations || [],
        ),
        mk(
          "monthly",
          "流月",
          t.monthly?.ganzhi,
          t.monthly?.lifePalace,
          t.monthly?.transformations || [],
        ),
        mk("daily", "流日", t.daily?.ganzhi, t.daily?.lifePalace, t.daily?.transformations || []),
        mk(
          "hourly",
          "流时",
          t.hourly?.ganzhi,
          t.hourly?.lifePalace,
          t.hourly?.transformations || [],
        ),
      ];
      return {
        available: true,
        target: t.target?.text || target203(year),
        age: t.age?.nominalAge ?? null,
        items,
        policies: t.policies || {},
      };
    } catch (err) {
      return { available: false, reason: String((err && err.message) || err), items: [] };
    }
  }
  function plain203(D) {
    const O = D.origin,
      F = D.focus,
      C = D.centrifugal.filter((x) => x.to === F.branch),
      I = D.inward.filter((x) => x.to === F.branch);
    const birthHit = D.birth.filter((x) => x.to === F.branch),
      timeHits = D.timeline.items.filter((x) => x.focusLife || x.hits.length);
    const arr = [];
    if (O)
      arr.push(
        `来因宫落在${O.name}，在飞星派语汇里可把它当成一个“起点主题”；这里更稳妥地理解为：出生年干与此宫宫干同干，提示${O.domain}是值得优先观察的领域之一。`,
      );
    arr.push(
      `当前焦点是${F.name}。${C.length ? `本宫有${C.map((x) => "离心自化" + x.h).join("、")}，表示本宫宫干的四化落回本宫。` : "本宫未识别到离心自化。"}${I.length ? `同时有${I.map((x) => x.sourcePalace + "→向心化" + x.h).join("、")}的对宫化入结构。` : "当前没有对宫化入本宫的向心结构。"}`,
    );
    if (birthHit.length)
      arr.push(
        `生年四化中，${birthHit.map((x) => x.star + "化" + x.h).join("、")}落在${F.name}，说明这一宫同时承接先天四化标记；它与自化是否同星、同类，应分开看，不直接合并成吉凶。`,
      );
    if (timeHits.length)
      arr.push(
        `在${D.year}年的当前时间截面，大限/小限/流年流月流日流时中有${timeHits.length}层与${F.name}发生“命宫落入或四化飞入”的机械共振，可作为进一步查看该时间层的入口。`,
      );
    else
      arr.push(
        `在${D.year}年的当前时间截面，没有检测到运限命宫或四化直接落入${F.name}的机械共振；这不等于该领域“无事”。`,
      );
    return arr.join("");
  }
  function build203(R0 = current203(), year) {
    if (!R0?.zw)
      return { schema: SCHEMA, build: BUILD, available: false, reason: "当前未取到紫微命盘" };
    const zw = R0.zw,
      Y = Math.max(
        1902,
        Math.min(2098, Number(year) || (typeof ZF !== "undefined" && ZF.year) || nowBJ().y),
      );
    const origin = origin203(zw),
      cent = centrifugal203(zw),
      inw = inward203(zw),
      birth = birth203(zw),
      focus = focus203(zw, origin);
    if (!focus?.palace)
      return {
        schema: SCHEMA,
        build: BUILD,
        available: false,
        reason: "当前焦点宫数据不可用；已阻止紫微飞星继续使用非法宫位状态",
      };
    const couplings = coupling203(zw, birth, cent, inw),
      timeline = timeline203(R0, Y, zw, focus);
    const outgoing = zfFlyFrom(zw, focus.palace.stem).map((x) => ({
      ...x,
      toPalace: x.to == null ? "—" : pname203(zw, x.to),
    }));
    const incoming = zfNet(zw, {})
      .edges.filter((x) => x.layer === "ben" && x.to === focus.branch)
      .map((x) => ({ ...x, fromPalace: pname203(zw, x.from) }));
    const D = {
      schema: SCHEMA,
      build: BUILD,
      available: true,
      year: Y,
      origin,
      focus,
      birth,
      centrifugal: cent,
      inward: inw,
      couplings,
      focusDetail: {
        outgoing,
        incoming,
        opposite: (focus.branch + 6) % 12,
        oppositeName: pname203(zw, (focus.branch + 6) % 12),
      },
      timeline,
      policy: {
        origin: "来因宫取寅至亥宫中宫干与生年天干相同者；子丑重复宫干不作为首选。",
        centrifugal: "本宫宫干飞化落回本宫星曜。",
        inward: "对宫宫干飞化落入本宫；“向心自化/视同自化”名称存在流派差异。",
        interpretation: "所有大白话仅把结构翻译成人话，不把单条飞化当作事件结论。",
      },
      evidence: [
        {
          item: "宫干 / 四化星表 / 飞化落宫",
          state: "verified",
          note: "复用站内既有 iztro 2.6.1 对拍结果。",
        },
        {
          item: "生年 / 大限 / 流年 / 流月 / 流日 / 流时",
          state: "verified-core",
          note: "复用 TianjiZiwei v107 统一运限时间轴及此前逐层验证。",
        },
        {
          item: "来因宫",
          state: "school-policy",
          note: "飞星/钦天派术语；按“宫干同生年干”规则实现，解释不声明古典唯一标准。",
        },
        {
          item: "离心 / 向心自化命名",
          state: "school-policy",
          note: "离心=本宫自化；向心=对宫化入本宫。不同流派术语和断法不完全一致。",
        },
      ],
    };
    D.plain = plain203(D);
    return D;
  }
  function item203(x) {
    const tone = HUA_TONE203[x.h] || "cyan";
    const name =
      x.type === "centrifugal"
        ? `${x.palace} · 离心自化${x.h}`
        : `${x.sourcePalace} → ${x.targetPalace} · 向心化${x.h}`;
    return `<div class="zw203-item ${tone}"><b>${e203(name)} · ${e203(x.star)}</b><small>${e203(x.definition)} ${e203(HUA_WORD203[x.h] || "")}</small></div>`;
  }
  function time203(x) {
    const tags = (x.transformations || [])
      .map((t) => huaTag203(t.h, `${t.star}→${t.palace}`))
      .join(" ");
    const hit = x.focusLife || x.hits.length;
    return `<div class="zw203-time${hit ? " focus" : ""}"><b>${e203(x.label)}</b><span>${e203(x.gz || "—")}</span><span>${x.life ? `命宫 ${e203(x.life)}` : "—"}</span><small>${tags || "这一层不单列四化"}</small><span class="zw203-res${hit ? " hit" : ""}">${hit ? "命中" : "—"}</span></div>`;
  }
  function panel203() {
    const R0 = current203(),
      D = build203(R0);
    if (!D.available)
      return `<section class="zw203"><div class="zw203-note">${e203(D.reason)}</div></section>`;
    const F = D.focus,
      O = D.origin,
      centF = D.centrifugal.filter((x) => x.to === F.branch),
      inwF = D.inward.filter((x) => x.to === F.branch),
      birthF = D.birth.filter((x) => x.to === F.branch);
    const coup = D.couplings.filter((x) => x.centrifugal.length || x.inward.length);
    const focusOpts = (R0?.zw?.pal || [])
      .filter(Boolean)
      .map(
        (p) =>
          `<option value="${p.b}"${p.b === F.branch ? " selected" : ""}>${e203(p.name)} · ${GAN[p.stem]}${ZHI[p.b]}</option>`,
      )
      .join("");
    return `<section class="zw203" id="zw203Depth">
    <section class="zw203-hero">
      <div class="zw203-head"><div><h3>紫微飞星深化 · 来因宫 / 自化方向 / 运限叠层</h3><p>在既有宫干飞化网络上增加飞星派研究层。基础宫干、四化与运限沿用已验证 Core；“来因宫、离心/向心自化”属于特定飞星/钦天派术语，因此明确标成流派口径，不伪装成所有紫微派别的统一规则。</p></div><span class="zw203-schema">${SCHEMA}</span></div>
      <div class="zw203-tools"><label>焦点宫<select id="zw203Focus">${focusOpts}</select></label><label>观察年份<input id="zw203Year" type="number" min="1902" max="2098" value="${D.year}"></label><button class="gbtn sm" id="zw203Origin">定位来因宫</button></div>
    </section>
    <div class="zw203-kpis">
      <div class="zw203-kpi cyan"><small>来因宫</small><b>${O ? e203(O.name + " · " + O.stemName) : "—"}</b></div>
      <div class="zw203-kpi"><small>当前焦点</small><b>${e203(F.name)}</b></div>
      <div class="zw203-kpi good"><small>离心自化</small><b>${D.centrifugal.length}</b></div>
      <div class="zw203-kpi cyan"><small>向心结构</small><b>${D.inward.length}</b></div>
      <div class="zw203-kpi bad"><small>焦点化忌飞入</small><b>${D.focusDetail.incoming.filter((x) => x.h === "忌").length}</b></div>
    </div>
    <div class="zw203-grid">
      <section class="zw203-card"><h4>自化方向图谱</h4><div class="zw203-list">${D.centrifugal.length ? D.centrifugal.map(item203).join("") : '<div class="zw203-note">本盘未识别到离心自化。</div>'}${D.inward.length ? D.inward.map(item203).join("") : '<div class="zw203-note">本盘未识别到向心（对宫化入）结构。</div>'}</div></section>
      <aside class="zw203-card"><h4>来因宫与生年四化</h4>
        <div class="zw203-item cyan"><b>${O ? `来因宫 · ${e203(O.name)}（${e203(O.stemName)}${ZHI[O.branch]}）` : "来因宫未识别"}</b><small>${O ? `宫干与生年天干同为${e203(O.stemName)}；当前只把它作为飞星派的“起点宫”结构标签，不据此推断前世、宿命或确定事件。` : "当前数据不足。"}</small></div>
        <div style="margin-top:6px">${D.birth.map((x) => huaTag203(x.h, `${x.star}→${x.palace}`)).join(" ")}</div>
        <div class="zw203-list" style="margin-top:7px">${coup.length ? coup.map((x) => `<div class="zw203-item ${HUA_TONE203[x.h] || "cyan"}"><b>生年${x.star}化${x.h} → ${e203(x.palace)}</b><small>${x.centrifugal.length ? `该宫另有离心：${x.centrifugal.map((z) => z.star + "化" + z.h).join("、")}。` : ""}${x.inward.length ? `对宫化入：${x.inward.map((z) => z.star + "化" + z.h).join("、")}。` : ""}${x.sameStarC ? " 同一颗星同时出现生年四化与本宫离心自化。" : ""}${x.sameStarI ? " 同一颗星同时承接生年四化与对宫化入。" : ""}</small></div>`).join("") : '<div class="zw203-note">生年四化落宫与自化结构没有直接重叠；仍可分别阅读。</div>'}</div>
      </aside>
    </div>
    <div class="zw203-grid">
      <section class="zw203-card"><h4>焦点宫 · ${e203(F.name)}</h4>
        <div class="zw203-note">对宫：${e203(D.focusDetail.oppositeName)}。飞星中“飞出”看本宫宫干的四化去向；“飞入”看其它宫的宫干把四化带到本宫。两者方向不同，不宜混写成一句吉凶。</div>
        <div class="tbl-wrap"><table class="zw203-table"><thead><tr><th>化</th><th>本宫飞出</th><th>本宫被飞入</th></tr></thead><tbody>${HUA203.map(
          (h) => {
            const o = D.focusDetail.outgoing.find((x) => x.h === h),
              ins = D.focusDetail.incoming.filter((x) => x.h === h);
            return `<tr><th>${huaTag203(h, "")}</th><td>${o ? `${e203(o.star)} → <b>${e203(o.toPalace)}</b>` : "—"}</td><td>${ins.length ? ins.map((x) => `${e203(x.fromPalace)} · ${e203(x.star)}`).join("<br>") : "—"}</td></tr>`;
          },
        ).join("")}</tbody></table></div>
        <div style="margin-top:7px">${birthF.length ? `<div class="zw203-item gold"><b>生年四化落入焦点</b><small>${birthF.map((x) => `${x.star}化${x.h}`).join("、")}</small></div>` : ""}${centF.length ? `<div class="zw203-item good"><b>焦点宫离心自化</b><small>${centF.map((x) => `${x.star}化${x.h}`).join("、")}</small></div>` : ""}${inwF.length ? `<div class="zw203-item cyan"><b>焦点宫向心结构</b><small>${inwF.map((x) => `${x.sourcePalace}的${x.star}化${x.h}飞入`).join("、")}</small></div>` : ""}</div>
      </section>
      <aside class="zw203-card"><h4>大白话</h4><div class="zw203-plain">${e203(D.plain)}</div><div class="zw203-note" style="margin-top:7px">“命中 / 共振”只表示某一运限层的命宫或四化机械地落到当前焦点宫，不表示事件一定发生，也不是概率。</div><div class="zw203-actions"><button id="zw203Copy" type="button">复制飞星深度 Schema</button><button id="zw203Refresh" type="button">重新计算</button></div></aside>
    </div>
    <section class="zw203-card"><h4>运限时序叠层 · ${e203(D.timeline.target || String(D.year))}</h4>${D.timeline.available ? `<div class="zw203-timeline">${D.timeline.items.map(time203).join("")}</div>` : `<div class="zw203-note">${e203(D.timeline.reason || "当前未取到运限时间轴")}</div>`}</section>
    <section class="zw203-card"><h4>Evidence / 口径状态</h4><div class="zw203-evidence">${D.evidence.map((x) => `<div class="zw203-ev"><b>${e203(x.item)}</b><small>${e203(x.note)}</small><span class="${x.state.includes("verified") ? "ok" : "policy"}">${x.state.includes("verified") ? "已验证基础" : "流派口径"}</span></div>`).join("")}</div></section>
  </section>`;
  }
  function fillFocus203() {
    const sel = document.getElementById("zw203Focus"),
      R0 = current203();
    if (!sel || !R0?.zw) return;
    const zw = R0.zw,
      origin = origin203(zw),
      focus = focus203(zw, origin);
    sel.innerHTML = zw.pal
      .map(
        (p) =>
          `<option value="${p.b}"${p.b === focus.branch ? " selected" : ""}>${e203(p.name)} · ${GAN[p.stem]}${ZHI[p.b]}</option>`,
      )
      .join("");
  }
  function bind203() {
    fillFocus203();
    const sel = document.getElementById("zw203Focus");
    if (sel)
      sel.onchange = () => {
        ZF.sel = +sel.value;
        ZF.chain = null;
        refRender("zwfly");
      };
    const y = document.getElementById("zw203Year");
    if (y)
      y.onchange = () => {
        ZF.year = Math.max(1902, Math.min(2098, +y.value || nowBJ().y));
        refRender("zwfly");
      };
    document.getElementById("zw203Origin")?.addEventListener("click", () => {
      const O = origin203(current203()?.zw);
      if (!O) return;
      ZF.sel = O.branch;
      ZF.chain = null;
      refRender("zwfly");
    });
    document.getElementById("zw203Refresh")?.addEventListener("click", () => refRender("zwfly"));
    document.getElementById("zw203Copy")?.addEventListener("click", () => {
      const txt = JSON.stringify(build203(), null, 2);
      navigator.clipboard
        ?.writeText?.(txt)
        .then(() => {
          try {
            toast("已复制紫微飞星深度 Schema");
          } catch (_) {}
        })
        .catch(() => {});
    });
  }
  try {
    const oldP = REF_PANES.zwfly;
    if (oldP && !oldP.__v203) {
      const fn = () => {
        let a = "",
          b = "";
        try {
          a = oldP();
        } catch (err) {
          console.warn("[V203 base render]", err);
          a = `<div class="panel blk"><p class="note bad">紫微飞星基础盘渲染失败：${e203(err?.message || err)}</p></div>`;
        }
        try {
          b = panel203();
        } catch (err) {
          console.warn("[V203 depth render]", err);
          b = `<section class="zw203"><div class="zw203-note">飞星深化层渲染失败：${e203(err?.message || err)}</div></section>`;
        }
        return a + b;
      };
      fn.__v203 = true;
      REF_PANES.zwfly = fn;
    }
    const oldB = REF_BIND.zwfly;
    const bf = () => {
      try {
        oldB && oldB();
      } catch (e) {
        console.warn("[V203 old bind]", e);
      }
      try {
        bind203();
      } catch (e) {
        console.warn("[V203 bind]", e);
      }
    };
    bf.__v203 = true;
    REF_BIND.zwfly = bf;
  } catch (e) {
    console.warn("[V203 patch]", e);
  }

  /* 自检：只验证结构算法，不宣称流派解释唯一。 */
  function selfTest203() {
    const checks = [],
      add = (id, ok, detail = "") => checks.push({ id, ok: !!ok, detail });
    try {
      const R0 = current203();
      if (!R0?.zw) {
        add("runtime.chart", true, "无当前命盘，跳过运行时盘测试");
        return { ok: true, checks };
      }
      const D = build203(R0);
      add(
        "origin.same-stem",
        !!D.origin && R0.zw.pal[D.origin.branch].stem === R0.zw.ys,
        D.origin?.name || "",
      );
      add(
        "origin.not-zichou",
        !!D.origin && ![0, 1].includes(D.origin.branch),
        String(D.origin?.branch),
      );
      add(
        "centrifugal.self",
        D.centrifugal.every((x) => x.from === x.to),
        String(D.centrifugal.length),
      );
      add(
        "inward.opposite",
        D.inward.every((x) => (x.from + 6) % 12 === x.to),
        String(D.inward.length),
      );
      add("birth.four", D.birth.length === 4, D.birth.map((x) => x.star + x.h).join(","));
      add("focus.shape", D.focusDetail.outgoing.length === 4, D.focus.name);
    } catch (e) {
      add("exception", false, String((e && e.message) || e));
    }
    return { ok: checks.every((x) => x.ok), checks };
  }
  const TEST203 = selfTest203();

  const TASKS203 = [
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
      note: "v202：逐爻旺衰、卦格组合、未来60日传统应期候选",
    },
    {
      id: "ziwei-depth",
      p: "P1",
      name: "紫微完整飞星体系",
      state: "doing",
      note: "v203 一期：来因宫、离心自化、向心（对宫化入）、生年四化耦合、焦点宫飞入飞出、六层运限时序叠层；流派专项应期仍继续",
    },
    {
      id: "qizheng",
      p: "P1",
      name: "七政四余核心化",
      state: "blocked",
      note: "等待星历、四余口径与许可证方案",
    },
    { id: "xk", p: "P1", name: "玄空完整宅盘", state: "todo", note: "运盘/山星/向星/替卦" },
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
  const BOARD203 = {
    schema: "tianji.priority.board.v1",
    build: BUILD,
    total: 14,
    done: 6,
    doing: 2,
    blocked: 1,
    progress: 50,
    next: [
      "紫微飞星二期：应期与流派 Evidence",
      "奇门日/月/年真实第三方 reference 样本",
      "玄空完整宅盘",
    ],
    tasks: TASKS203,
  };
  function board203() {
    window.TianjiPriorityBoard = Object.freeze({
      schema: BOARD203.schema,
      snapshot: () => clone203(BOARD203),
    });
    const road = window.TianjiRoadmap || {};
    window.TianjiRoadmap = Object.freeze(
      Object.assign({}, road, {
        urgentImportant: clone203(BOARD203),
        nextMainline: [
          "紫微飞星二期：专项应期 / 流派 Evidence",
          "奇门四家第三方对拍（二期待外部样本）",
          "玄空完整宅盘",
          "历史时区 / DST",
        ],
      }),
    );
  }
  board203();
  window.addEventListener("tianji:lazy-ready", () => setTimeout(board203, 0));

  window.TianjiZiweiFlyingDepth = Object.freeze({
    version: "1.0.0",
    build: BUILD,
    schema: SCHEMA,
    analyze: (runtime, year) => clone203(build203(runtime || current203(), year)),
    originPalace: (runtime) => clone203(origin203((runtime || current203())?.zw)),
    centrifugal: (runtime) => clone203(centrifugal203((runtime || current203())?.zw)),
    inward: (runtime) => clone203(inward203((runtime || current203())?.zw)),
    selfTest: () => clone203(TEST203),
    manifest: () => ({
      module: "Tianji Ziwei Flying Depth",
      schema: SCHEMA,
      verifiedFoundation: ["宫干", "四化星表", "飞化落宫", "生年四化", "统一运限时间轴"],
      schoolPolicy: ["来因宫", "离心自化", "向心/对宫化入"],
      remaining: [
        "流派专项应期规则",
        "向心/离心细分在不同师承中的术语映射",
        "更多飞星 Evidence 对拍",
      ],
    }),
  });
  window.TianjiSystemV203 = {
    version: "v203",
    build: BUILD,
    ziweiFlyingDepth: true,
    baseline: "v202",
  };

  function sync203() {
    const b = document.getElementById("buildVersion");
  }
  /* V226: historical delayed version writer disabled */
})();
