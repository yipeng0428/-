(() => {
  "use strict";
  const V72_TS = "2026-10-04 01:19:17";
  /* 扩充五行传统对应：人体相关均仅作传统文化分类，不用于健康判断。 */
  const WX72 = [
    {
      n: "木",
      nature: "曲直",
      dir: "东",
      season: "春",
      color: "青",
      taste: "酸",
      zang: "肝",
      fu: "胆",
      sense: "目",
      emotion: "怒",
      stem: "甲乙",
      branch: "寅卯",
      hetu: "三 · 八",
      tone: "角",
      virtue: "仁",
      transform: "生",
      qi: "风",
      body: "筋",
      glory: "爪",
      liquid: "泪",
      planet: "岁星 · 木星",
      voice: "呼",
    },
    {
      n: "火",
      nature: "炎上",
      dir: "南",
      season: "夏",
      color: "赤",
      taste: "苦",
      zang: "心",
      fu: "小肠",
      sense: "舌",
      emotion: "喜",
      stem: "丙丁",
      branch: "巳午",
      hetu: "二 · 七",
      tone: "徵",
      virtue: "礼",
      transform: "长",
      qi: "暑 / 热",
      body: "脉",
      glory: "面",
      liquid: "汗",
      planet: "荧惑 · 火星",
      voice: "笑",
    },
    {
      n: "土",
      nature: "稼穑",
      dir: "中",
      season: "长夏",
      color: "黄",
      taste: "甘",
      zang: "脾",
      fu: "胃",
      sense: "口",
      emotion: "思",
      stem: "戊己",
      branch: "辰戌丑未",
      hetu: "五 · 十",
      tone: "宫",
      virtue: "信",
      transform: "化",
      qi: "湿",
      body: "肉",
      glory: "唇",
      liquid: "涎",
      planet: "镇星 · 土星",
      voice: "歌",
    },
    {
      n: "金",
      nature: "从革",
      dir: "西",
      season: "秋",
      color: "白",
      taste: "辛",
      zang: "肺",
      fu: "大肠",
      sense: "鼻",
      emotion: "悲",
      stem: "庚辛",
      branch: "申酉",
      hetu: "四 · 九",
      tone: "商",
      virtue: "义",
      transform: "收",
      qi: "燥",
      body: "皮毛",
      glory: "毛",
      liquid: "涕",
      planet: "太白 · 金星",
      voice: "哭",
    },
    {
      n: "水",
      nature: "润下",
      dir: "北",
      season: "冬",
      color: "黑",
      taste: "咸",
      zang: "肾",
      fu: "膀胱",
      sense: "耳",
      emotion: "恐",
      stem: "壬癸",
      branch: "亥子",
      hetu: "一 · 六",
      tone: "羽",
      virtue: "智",
      transform: "藏",
      qi: "寒",
      body: "骨",
      glory: "发",
      liquid: "唾",
      planet: "辰星 · 水星",
      voice: "呻",
    },
  ];
  const WX72_COL = ["var(--wood)", "var(--fire)", "var(--earth)", "var(--metal)", "var(--water)"];
  function wx72Rel(dm, i) {
    const d = (i - dm + 5) % 5;
    return [
      { rel: "同我", tg: "比劫", act: "扶", desc: "同类之气，强调同类、竞争、自主与承载。" },
      { rel: "我生", tg: "食伤", act: "泄", desc: "由日主向外输出，传统十神归入食神 / 伤官一族。" },
      { rel: "我克", tg: "财", act: "耗", desc: "日主去制约与承担，传统十神归入正财 / 偏财一族。" },
      { rel: "克我", tg: "官杀", act: "制", desc: "外来约束日主，传统十神归入正官 / 七杀一族。" },
      { rel: "生我", tg: "印", act: "生扶", desc: "向日主提供资源，传统十神归入正印 / 偏印一族。" },
    ][d];
  }
  function wx72Tag(d, i) {
    const p = d.flow.pct[i],
      xy = d.D.xy;
    if (xy.favor.includes(i))
      return {
        k: "fav",
        t: p < 0.14 ? "喜用 · 偏弱" : "喜用",
        s:
          p < 0.14
            ? "此行在原局占比较低，是喜用体系中的相对短板。"
            : "此行属于喜用，原局已有一定承载。",
      };
    if (xy.avoid.includes(i))
      return {
        k: "avoid",
        t: p > 0.28 ? "忌 · 偏重" : "忌",
        s:
          p > 0.28
            ? "此行既属忌又偏重，流通图中更值得观察其克泄去向。"
            : "此行属忌，但当前占比并不特别突出。",
      };
    return {
      k: "mid",
      t: p > 0.29 ? "中性 · 偏重" : p < 0.11 ? "中性 · 偏弱" : "中性",
      s: "不在当前喜用 / 忌神列表中，主要看它是否承担通关、承接或制衡作用。",
    };
  }
  function wx72TimeData(bz, D) {
    const n = nowBJ(),
      out = { n, dayun: null, year: null, month: null, day: null, hour: null };
    try {
      const i = dayunNow(R),
        d = (i >= 0 && bz.dayun && bz.dayun[i]) || null;
      if (d)
        out.dayun = {
          label: "当前大运",
          gz: gz(d.idx),
          idx: d.idx,
          sub: (d.ss || "") + (d.lv ? " · " + d.lv : ""),
        };
    } catch (_) {}
    try {
      const idx = (((n.y - 4) % 60) + 60) % 60;
      out.year = { label: "流年", gz: gz(idx), idx, sub: String(n.y) + " 年" };
    } catch (_) {}
    try {
      const ms = [...liuyue(bz, D, n.y - 1), ...liuyue(bz, D, n.y)].filter(
          (m) => meCmp(m.from, n) <= 0,
        ),
        m = ms[ms.length - 1];
      if (m)
        out.month = {
          label: "流月",
          gz: m.gz,
          idx: ganzhiIdxOf(m.gz),
          sub: m.name + "月 · " + m.ss,
        };
    } catch (_) {}
    try {
      const di = dayInfo(n.y, n.m, n.d);
      out.day = {
        label: "流日",
        gz: di.gz,
        idx: di.dayIdx,
        sub: `${n.m}/${n.d} · ${shishen(bz.dm, di.dayIdx % 10)}`,
      };
    } catch (_) {}
    try {
      const hb = ((n.h + 1) >> 1) % 12,
        h = hoursOfDay(n.y, n.m, n.d).find((x) => x.b === hb);
      if (h)
        out.hour = {
          label: "此刻时辰",
          gz: h.gz,
          idx: ganzhiIdxOf(h.gz),
          sub: h.span + " · " + h.ts,
        };
    } catch (_) {}
    return out;
  }
  function wx72Extra(it, label) {
    return it && Number.isFinite(it.idx) ? wxExtraGZ(it.idx, label || it.label) : [];
  }
  /* 覆盖原 wxfData：保留旧模式并增加 流月 / 流日 / 四层合参。 */
  const _wxfData72Old = wxfData;
  wxfData = function () {
    const bz = R.bz,
      D = R.deep || baziDeep(bz),
      n = nowBJ(),
      Y = WXF.year || n.y,
      T = wx72TimeData(bz, D);
    let extra = [],
      labs = [];
    if (WXF.ov === "year" || WXF.ov === "both") {
      const idx = (((Y - 4) % 60) + 60) % 60;
      extra = extra.concat(wxExtraGZ(idx, "流年"));
      labs.push(`${Y}年 ${gz(idx)}`);
    }
    if (WXF.ov === "dayun" || WXF.ov === "both") {
      if (T.dayun) {
        extra = extra.concat(wx72Extra(T.dayun, "大运"));
        labs.push(`大运 ${T.dayun.gz}`);
      }
    }
    if (WXF.ov === "month" && T.month) {
      extra = extra.concat(wx72Extra(T.month, "流月"));
      labs.push(`流月 ${T.month.gz}`);
    }
    if (WXF.ov === "day" && T.day) {
      extra = extra.concat(wx72Extra(T.day, "流日"));
      labs.push(`流日 ${T.day.gz}`);
    }
    if (WXF.ov === "full") {
      if (T.dayun) {
        extra = extra.concat(wx72Extra(T.dayun, "大运"));
        labs.push(`大运 ${T.dayun.gz}`);
      }
      if (T.year) {
        extra = extra.concat(wx72Extra(T.year, "流年"));
        labs.push(`${T.n.y}年 ${T.year.gz}`);
      }
      if (T.month) {
        extra = extra.concat(wx72Extra(T.month, "流月"));
        labs.push(`流月 ${T.month.gz}`);
      }
      if (T.day) {
        extra = extra.concat(wx72Extra(T.day, "流日"));
        labs.push(`流日 ${T.day.gz}`);
      }
    }
    const base = wxContrib(bz),
      withE = wxContrib(bz, extra),
      cur = WXF.ov === "none" ? base : withE;
    return {
      bz,
      D,
      base,
      cur,
      flow: wxFlow(cur.tot),
      flow0: wxFlow(base.tot),
      lab: labs.join(" + "),
      Y,
      T,
    };
  };
  function wx72Person(d) {
    const dm = GAN_WX[d.bz.dm],
      name = (document.getElementById("pname")?.value || "").trim() || "当前人物",
      F = d.flow,
      xy = d.D.xy,
      focus = WXF.sel == null ? dm : WXF.sel;
    const favNeed = xy.favor.slice().sort((a, b) => F.pct[a] - F.pct[b])[0],
      avoidHeavy = xy.avoid.slice().sort((a, b) => F.pct[b] - F.pct[a])[0];
    const cards = WXN.map((w, i) => {
      const r = wx72Rel(dm, i),
        t = wx72Tag(d, i);
      return `<button type="button" class="wx72-ecard ${t.k === "fav" ? "fav" : t.k === "avoid" ? "avoid" : ""}${focus === i ? " on" : ""}" data-wx72="${i}"><div class="top"><b style="color:${WX72_COL[i]}">${w}</b><em>${(F.pct[i] * 100).toFixed(0)}%</em></div><span><strong>${r.tg}</strong> · ${r.rel} · ${r.act}</span><span>${t.t}</span><div class="wx72-meter"><i style="--p:${Math.min(100, F.pct[i] * 100).toFixed(1)}%;--bc:${WX72_COL[i]}"></i></div></button>`;
    }).join("");
    const r = wx72Rel(dm, focus),
      t = wx72Tag(d, focus),
      up = (focus + 4) % 5,
      down = (focus + 1) % 5,
      ctrl = (focus + 2) % 5,
      by = (focus + 3) % 5;
    const gf = F.gen.find((x) => x.a === up && x.b === focus),
      go = F.gen.find((x) => x.a === focus && x.b === down),
      kin = F.kill.find((x) => x.a === by && x.b === focus),
      kout = F.kill.find((x) => x.a === focus && x.b === ctrl);
    return `<section class="wx72-section"><div class="wx72-head"><h4>${name} · 命主五行画像</h4><small>原局权重 × 日主关系 × 喜忌 × 流通角色</small></div>
  <div class="wx72-kpis"><div class="wx72-kpi"><small>日主核心</small><b>${GAN[d.bz.dm]} · ${WXN[dm]} · ${d.D.st.level}</b></div><div class="wx72-kpi"><small>最强 / 最弱</small><b>${WXN[F.strong]} ${(F.pct[F.strong] * 100).toFixed(0)}% / ${WXN[F.weak]} ${(F.pct[F.weak] * 100).toFixed(0)}%</b></div><div class="wx72-kpi"><small>喜用侧重点</small><b class="good">${xy.favor.map((i) => WXN[i]).join("、") || "—"}${favNeed != null ? " · 先看" + WXN[favNeed] : ""}</b></div><div class="wx72-kpi"><small>忌神观察</small><b class="bad">${xy.avoid.map((i) => WXN[i]).join("、") || "—"}${avoidHeavy != null ? " · " + WXN[avoidHeavy] + "占" + (F.pct[avoidHeavy] * 100).toFixed(0) + "%" : ""}</b></div></div>
  <div class="wx72-matrix">${cards}</div>
  <div class="wx72-detail"><div><h5>${WXN[focus]} 对 ${GAN[d.bz.dm]}日主</h5><p><b>${r.tg}</b> · ${r.rel} · ${r.act}。${r.desc}<br><b>${t.t}</b>：${t.s}</p></div><div><h5>${WXN[focus]} 的四向流通</h5><p>生我：<b>${WXN[up]}→${WXN[focus]}</b>，流量 ${gf ? gf.flow.toFixed(2) : "—"}；我生：<b>${WXN[focus]}→${WXN[down]}</b>，流量 ${go ? go.flow.toFixed(2) : "—"}。<br>克我：<b>${WXN[by]}克${WXN[focus]}</b>，压力 ${kin ? kin.press.toFixed(2) : "—"}；我克：<b>${WXN[focus]}克${WXN[ctrl]}</b>，压力 ${kout ? kout.press.toFixed(2) : "—"}。</p></div></div>
  <p class="wx72-note">这里的“扶、泄、耗、制”是五行与十神的结构语言；喜用、忌神沿用本站八字引擎，不把某个单独五行直接解释成现实事件。</p></section>`;
  }
  function wx72Temporal(d) {
    const dm = GAN_WX[d.bz.dm],
      T = d.T;
    const item = (x, k, ov) => {
      if (!x) return "";
      const sw = GAN_WX[x.idx % 10],
        bw = GAN_WX[CANG[x.idx % 12][0]],
        r = wx72Rel(dm, sw);
      return `<div class="wx72-time${WXF.ov === ov ? " on" : ""}"><small>${x.label}</small><b>${x.gz}</b><span>干 ${WXN[sw]} · 支本气 ${WXN[bw]}</span><span>时干对日主：${r.tg} / ${r.rel}</span><span>${x.sub || ""}</span>${ov ? `<button type="button" class="gbtn sm" data-wx72ov="${ov}">叠加到图</button>` : ""}</div>`;
    };
    return `<section class="wx72-section"><div class="wx72-head"><h4>时序五行 · 当前阶段</h4><small>大运 → 流年 → 流月 → 流日 → 此刻时辰</small></div><div class="wx72-timegrid">${item(T.dayun, "dy", "dayun")}${item(T.year, "y", "year")}${item(T.month, "m", "month")}${item(T.day, "d", "day")}${item(T.hour, "h", null)}</div>
  <div class="wx72-quick"><button class="chip${WXF.ov === "none" ? " on" : ""}" data-wx72ov="none">只看原局</button><button class="chip${WXF.ov === "both" ? " on" : ""}" data-wx72ov="both">大运 + 流年</button><button class="chip${WXF.ov === "full" ? " on" : ""}" data-wx72ov="full">大运 + 流年 + 流月 + 流日</button></div><p class="wx72-note">叠加仍采用本站原来的“额外一柱”启发式权重，只用于观察结构变化，不等同于传统命理各家对岁运力量的统一公式；“此刻时辰”只作读数，不自动叠加，避免图形每两小时跳变。</p></section>`;
  }
  function wx72All() {
    const cards = WX72.map(
      (m, i) =>
        `<article class="wx72-all"><h5 style="color:${WX72_COL[i]}">${m.n} · ${m.nature}</h5><dl><dt>五音</dt><dd>${m.tone}</dd><dt>五常</dt><dd>${m.virtue}</dd><dt>五化</dt><dd>${m.transform}</dd><dt>五气</dt><dd>${m.qi}</dd><dt>五星</dt><dd>${m.planet}</dd><dt>五体</dt><dd>${m.body}</dd><dt>五华</dt><dd>${m.glory}</dd><dt>五液</dt><dd>${m.liquid}</dd><dt>五声</dt><dd>${m.voice}</dd><dt>天干 / 地支</dt><dd>${m.stem} / ${m.branch}</dd></dl><div class="muted">${m.dir} · ${m.season} · ${m.color} · ${m.taste} · ${m.zang}/${m.fu} · ${m.sense} · ${m.emotion}</div></article>`,
    ).join("");
    return `<section class="wx72-section"><div class="wx72-head"><h4>五行万象库</h4><small>把“五行”从生克图扩展为传统分类索引</small></div><div class="wx72-allgrid">${cards}</div><p class="wx72-note">五音、五常、五化、五气、五体、五华、五液、五星等属于传统关联体系。不同古籍在个别项目上存在异说；本页采用后世最常见的一组配法。脏腑、五体、五液等仅为传统文化 / 医学史对应，不用于医学诊断或治疗。</p></section>`;
  }
  /* 万象库仍放在“通用生克总图”之后，保留原图和原表。 */
  const _wxRefHTML72 = wxRefHTML;
  wxRefHTML = function () {
    let h = _wxRefHTML72();
    h = h.replace('<svg id="wxRefSvg"', '<svg id="wxRefSvg" data-nozoom="1"');
    return h + wx72All();
  };
  /* 不复制原来的巨大 SVG 生成函数，只在它生成的 HTML 上注入新模块和新增叠加选项。 */
  const _wxfPage72 = wxfPage;
  wxfPage = function () {
    let h = _wxfPage72();
    if (!R || !R.bz) return h;
    const d = wxfData();
    h = h
      .replace('<svg id="wxSvg"', '<svg id="wxSvg" data-nozoom="1"')
      .replace('<svg id="wxRefSvg"', '<svg id="wxRefSvg" data-nozoom="1"');
    const opts = [
      ["none", "只看原局"],
      ["dayun", "叠加当前大运"],
      ["year", "叠加流年"],
      ["month", "叠加当前流月"],
      ["day", "叠加今日流日"],
      ["both", "大运 + 流年"],
      ["full", "四层合参 · 运 · 年 · 月 · 日"],
    ]
      .map(([k, n]) => `<option value="${k}"${WXF.ov === k ? " selected" : ""}>${n}</option>`)
      .join("");
    h = h.replace(/<select id="wxO">[\s\S]*?<\/select>/, `<select id="wxO">${opts}</select>`);
    const anchor = '<div class="wx-ref">';
    const inject = wx72Person(d) + wx72Temporal(d);
    if (h.includes(anchor)) h = h.replace(anchor, inject + anchor);
    else h += inject;
    return h;
  };
  const _wxfBind72 = wxfBind;
  wxfBind = function () {
    _wxfBind72();
    const pane = document.getElementById("pane-wxflow");
    if (!pane) return;
    pane.querySelectorAll("[data-wx72]").forEach(
      (b) =>
        (b.onclick = () => {
          const i = +b.dataset.wx72;
          WXF.sel = WXF.sel === i ? null : i;
          refRender("wxflow");
        }),
    );
    pane.querySelectorAll("[data-wx72ov]").forEach(
      (b) =>
        (b.onclick = () => {
          WXF.ov = b.dataset.wx72ov;
          refRender("wxflow");
        }),
    );
    ["wxSvg", "wxRefSvg"].forEach((id) => {
      const el = document.getElementById(id);
      if (el) {
        el.setAttribute("data-nozoom", "1");
        if (el._zb) {
          try {
            el._zb.remove();
          } catch (_) {}
          el._zb = null;
        }
      }
    });
  };
  REF_PANES.wxflow = wxfPage;
  REF_BIND.wxflow = wxfBind;
  /* 通用 SVG 自动放大扫描也显式跳过两张五行总览图；清理已生成的按钮。 */
  try {
    const _zm72 = zmScan;
    zmScan = function () {
      ["wxSvg", "wxRefSvg"].forEach((id) => {
        const el = document.getElementById(id);
        if (el) {
          el.setAttribute("data-nozoom", "1");
          if (el._zb) {
            try {
              el._zb.remove();
            } catch (_) {}
            el._zb = null;
          }
        }
      });
      return _zm72();
    };
  } catch (_) {}
  try {
    const bv = document.getElementById("buildVersion");
  } catch (_) {}
})();
