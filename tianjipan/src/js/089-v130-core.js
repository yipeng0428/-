(function () {
  "use strict";
  const V130_BUILD = "v130 · 2026-10-04 22:30 +08:00";
  function e130(s) {
    try {
      return typeof esc === "function"
        ? esc(String(s == null ? "" : s))
        : String(s == null ? "" : s).replace(
            /[&<>"']/g,
            (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[m],
          );
    } catch (_) {
      return String(s || "");
    }
  }
  function v130Person() {
    try {
      let p = null;
      if (typeof PPL === "object" && Array.isArray(PPL.people))
        p =
          PPL.people.find((x) => x.id === PPL.cur) ||
          PPL.people.find((x) => x.id === PPL.meId) ||
          null;
      const nm =
        (p && p.name) ||
        ((document.getElementById("pname") || {}).value || "").trim() ||
        "当前命主";
      return { p, name: nm, avatar: p && p.avatar ? p.avatar : "", id: p && p.id ? p.id : null };
    } catch (_) {
      return { p: null, name: "当前命主", avatar: "", id: null };
    }
  }
  function v130Age(R0) {
    try {
      const n = nowBJ(),
        b = R0.t.civ;
      let a = n.y - b.y;
      if (n.m < b.m || (n.m === b.m && n.d < b.d)) a--;
      return Math.max(0, a);
    } catch (_) {
      return null;
    }
  }
  function v130Sign(lon) {
    try {
      const i = ((Math.floor((((lon % 360) + 360) % 360) / 30) % 12) + 12) % 12,
        s = AS_SIGN[i];
      return { i, name: s[0], glyph: s[1], elem: ["火", "土", "风", "水"][i % 4] };
    } catch (_) {
      return { i: 0, name: "—", glyph: "", elem: "—" };
    }
  }
  function v130CurrentStage(R0) {
    try {
      const y = nowBJ().y,
        ds = dayunTable(R0.bz, R0.deep),
        cur = ds.filter((d) => d.yr <= y).slice(-1)[0] || ds[0],
        ly = liunian(R0.bz, R0.deep, y, 1)[0];
      return { cur, ly };
    } catch (_) {
      return { cur: null, ly: null };
    }
  }
  function v130RelStat(person) {
    try {
      if (typeof PPL !== "object" || !Array.isArray(PPL.people))
        return { people: 0, rels: 0, linked: 0 };
      const rels = Array.isArray(PPL.rels) ? PPL.rels : [],
        id = person.id;
      return {
        people: PPL.people.length,
        rels: rels.length,
        linked: id ? rels.filter((r) => r.a === id || r.b === id).length : 0,
      };
    } catch (_) {
      return { people: 0, rels: 0, linked: 0 };
    }
  }
  function v130OverviewHTML(R0) {
    try {
      const P = v130Person(),
        bz = R0.bz,
        D = R0.deep,
        zw = R0.zw,
        A = R0.astro || {},
        age = v130Age(R0),
        stage = v130CurrentStage(R0),
        rs = v130RelStat(P),
        nowY = nowBJ().y;
      const wx = D.st.wxw || [0, 0, 0, 0, 0],
        tot = Math.max(
          0.001,
          wx.reduce((a, b) => a + b, 0),
        ),
        ord = wx.map((v, i) => ({ i, v })).sort((a, b) => b.v - a.v),
        strong = ord[0],
        weak = ord[ord.length - 1];
      const mp = zw.pal && zw.pal[zw.ming],
        main =
          mp && mp.stars
            ? mp.stars
                .filter((s) => s.t === "main")
                .map((s) => s.n + (s.h ? "化" + s.h : ""))
                .slice(0, 3)
            : [];
      const sun = A.planets && A.planets[0] ? v130Sign(A.planets[0].lon) : null,
        moon = A.planets && A.planets[1] ? v130Sign(A.planets[1].lon) : null,
        asc = A.angles ? v130Sign(A.angles.asc) : null;
      let g = { summary: [] };
      try {
        g = guideReading(R0, nowY) || g;
      } catch (_) {}
      const gs = (g.summary || []).slice(0, 3);
      const relKey =
        (D.rel || [])
          .slice(0, 3)
          .map((x) => x.txt)
          .join("、") || "结构相对简洁";
      const avatar = P.avatar
        ? `<img class="ov130-avatar" src="${e130(P.avatar)}" alt="${e130(P.name)}头像">`
        : `<div class="ov130-avatar ph">${e130(P.name.slice(0, 1))}</div>`;
      const birth =
        R0.t && R0.t.civ
          ? `${R0.t.civ.y}-${f2(R0.t.civ.m)}-${f2(R0.t.civ.d)} ${f2(R0.t.civ.h)}:${f2(R0.t.civ.mi)}`
          : "—";
      const dy = stage.cur
        ? `${Math.floor(stage.cur.startAge)}–${Math.floor(stage.cur.startAge) + 9}岁 · ${stage.cur.gz}运（${stage.cur.ss}）`
        : "—";
      const lyr = stage.ly ? `${stage.ly.y} ${stage.ly.gz} · ${stage.ly.ss} · ${stage.ly.lv}` : "—";
      const focus = gs.length
        ? gs.map((x) => `<div class="${e130(x.tone || "mid")}">${e130(x.text)}</div>`).join("")
        : `<div class="mid">已完成命局计算，可进入各模块查看细节。</div>`;
      const bars = wx.map((v) => `<i style="width:${((v / tot) * 100).toFixed(1)}%"></i>`).join("");
      const cards = [
        [
          "八字 · 结构核心",
          `<p><span class="metric">${GAN[bz.dm]}${WXN[GAN_WX[bz.dm]]}</span> · ${e130(D.st.level)} · ${e130(D.gj.name)}</p><p>取用：<b>${D.xy.favor.map((x) => WXN[x]).join("、") || "—"}</b>；宜收敛：${D.xy.avoid.map((x) => WXN[x]).join("、") || "—"}</p><p><small>最强 ${WXN[strong.i]} · 最弱 ${WXN[weak.i]} · ${e130(relKey)}</small></p><button class="gbtn sm go" data-v130go="bazi">看八字详情</button>`,
        ],
        [
          "五行 · 分布与流通",
          `<div class="ov130-wx">${bars}</div><p>${WXN.map((w, i) => `${w}${Math.round((wx[i] / tot) * 100)}%`).join(" · ")}</p><p><small>这里看的是命局结构，不是今天的即时五行。取用与调候以八字页的完整判断为准。</small></p><button class="gbtn sm go" data-v130go="wxflow">看五行流通</button>`,
        ],
        [
          "紫微 · 人生主题",
          `<p>命宫 <b>${ZHI[zw.ming]}</b> · 身宫 <b>${ZHI[zw.shen]}</b> · ${e130(zw.juName)}</p><p>命宫主星：<b>${e130(main.join("、") || "无主星／借对宫")}</b></p><p><small>生年四化：${e130((zw.sihua || []).join(" · "))}</small></p><button class="gbtn sm go" data-v130go="ziwei">看紫微详情</button>`,
        ],
        [
          "出生天空 · 本命星盘",
          sun && moon && asc
            ? `<p>太阳 <b>${e130(sun.glyph)} ${e130(sun.name)}座</b> · ${sun.elem}象</p><p>月亮 <b>${e130(moon.glyph)} ${e130(moon.name)}座</b> · 上升 <b>${e130(asc.glyph)} ${e130(asc.name)}座</b></p><p><small>这是出生时刻的天空快照；西方占星象征与天文学位置分层显示。</small></p><button class="gbtn sm go" data-v130go="natal">看本命星盘</button>`
            : `<p class="muted">本命星盘数据暂不可用。</p>`,
        ],
        [
          "人生阶段 · 慢变量",
          `<p>当前大运：<b>${e130(dy)}</b></p><p>${nowY} 年：<b>${e130(lyr)}</b></p><p><small>这里保留十年/年度层级的“阶段”，分钟、时辰、当天变化统一放在「此刻」。</small></p><button class="gbtn sm go" data-v130go="guide">看个人指南</button>`,
        ],
        [
          "关系网络 · 外部系统",
          `<p>人物册 <b>${rs.people}</b> 人 · 已建关系 <b>${rs.rels}</b> 条${P.id ? ` · 与当前命主直连 <b>${rs.linked}</b> 条` : ""}</p><p><small>关系网只提炼人物与关系结构；具体相生相克、合冲与互动放到关系页展开。</small></p><button class="gbtn sm go" data-v130go="net">看关系网</button>`,
        ],
        [
          "命宫 / 身宫 / 胎元",
          `<p>命宫 <b>${GAN[D.ex.ming.s]}${ZHI[D.ex.ming.b]}</b> · 身宫 <b>${GAN[D.ex.shen.s]}${ZHI[D.ex.shen.b]}</b></p><p>胎元 <b>${GAN[D.ex.tai.s]}${ZHI[D.ex.tai.b]}</b> · 生肖 <b>${ZODIAC12[bz.pill[0].b]}</b></p><p><small>作为传统命理补充坐标，详情仍以八字与紫微原模块为准。</small></p><button class="gbtn sm go" data-v130go="bazi">看命局细节</button>`,
        ],
        [
          "信息覆盖 · 快速入口",
          `<p>总览只保留“每个体系最关键的 1–3 条”，不复制详情页。</p><p><small>需要即时影响 → 去「此刻」；需要某体系的证据链与细节 → 点对应模块。</small></p><button class="gbtn sm go" data-v130go="now">看此刻</button>`,
        ],
      ];
      return `<div class="panel blk ov130-hero"><div class="ov130-head">${avatar}<div class="ov130-title"><h3>${e130(P.name)} · 命局总览</h3><p>${birth}${age != null ? ` · ${age}岁` : ""}。这里汇总“这个人本身”的长期结构与当前人生阶段；小时级、当天级变化请看「此刻」。</p></div><span class="ov130-mode">稳定结构优先</span></div>
      <div class="ov130-tags"><span>四柱 <b>${bz.pill.map((p) => GAN[p.s] + ZHI[p.b]).join(" ")}</b></span><span>日主 <b>${GAN[bz.dm]}${WXN[GAN_WX[bz.dm]]}</b></span><span>格局 <b>${e130(D.gj.name)}</b></span><span>喜用 <b>${D.xy.favor.map((x) => WXN[x]).join("") || "—"}</b></span>${sun ? `<span>太阳 <b>${e130(sun.glyph)}${e130(sun.name)}</b></span>` : ""}</div>
      <div class="ov130-focus">${focus}</div></div>
      <div class="panel blk"><h3 class="sec">模块精要 · 每个体系只取关键结论</h3><div class="ov130-grid">${cards.map((c) => `<div class="ov130-card"><h4>${c[0]}</h4>${c[1]}</div>`).join("")}</div></div>
      <div class="panel blk"><h3 class="sec">一眼直达</h3><div class="ov130-index">
        <button data-v130go="bazi"><b>八字</b><small>结构、旺衰、十神、喜用</small></button><button data-v130go="ziwei"><b>紫微</b><small>命身十二宫、四化、大限</small></button><button data-v130go="natal"><b>本命星盘</b><small>太阳、月亮、上升、相位</small></button><button data-v130go="wxflow"><b>五行流通</b><small>力量、通关与结构</small></button><button data-v130go="guide"><b>个人指南</b><small>优势、短板、长期行动</small></button><button data-v130go="net"><b>关系网</b><small>家人、伴侣、同事与互动</small></button><button data-v130go="fate"><b>事项运势</b><small>事业、婚育、财务等专题</small></button><button data-v130go="now"><b>此刻</b><small>今天此时 × 命主影响</small></button>
      </div><div class="ov130-note" style="margin-top:10px"><b>总览与此刻的边界：</b>总览回答“我是谁、长期结构如何、现在处于哪个人生阶段”；此刻回答“今天这个时空对我有什么即时影响”。因此总览不重复小时级天象、时辰吉凶和实时奇门。</div></div>`;
    } catch (e) {
      return `<div class="panel blk"><h3 class="sec">命局总览 2.0</h3><p class="note bad">总览增强层暂时无法生成：${e130(e.message || e)}</p></div>`;
    }
  }
  try {
    const _v130Over = renderOverview;
    renderOverview = function (R0) {
      let old = _v130Over(R0);
      old = old.replace("此刻黄历 ·", "动态参考 · 今日黄历（非总览核心） ·");
      return v130OverviewHTML(R0) + old;
    };
    window.renderOverview = renderOverview;
  } catch (e) {
    console.error("[v130 overview]", e);
  }
  document.addEventListener(
    "click",
    function (e) {
      const b = e.target.closest && e.target.closest("[data-v130go]");
      if (!b) return;
      try {
        selectTab(b.dataset.v130go, true);
      } catch (err) {
        console.error(err);
      }
    },
    true,
  );

  /* ---------------- 六爻 Evidence 1.0：文献规则锚点 ---------------- */
  function ly130Tests() {
    const out = [];
    const add = (n, ok, d) => out.push({ n, ok: !!ok, d });
    try {
      const ex = {
        1: { g: [0, 8], lo: [0, 2, 4], up: [6, 8, 10] },
        2: { g: [3, 3], lo: [5, 3, 1], up: [11, 9, 7] },
        3: { g: [5, 5], lo: [3, 1, 11], up: [9, 7, 5] },
        4: { g: [6, 6], lo: [0, 2, 4], up: [6, 8, 10] },
        5: { g: [7, 7], lo: [1, 11, 9], up: [7, 5, 3] },
        6: { g: [4, 4], lo: [2, 4, 6], up: [8, 10, 0] },
        7: { g: [2, 2], lo: [4, 6, 8], up: [10, 0, 2] },
        8: { g: [1, 9], lo: [7, 5, 3], up: [1, 11, 9] },
      };
      let n = 0;
      Object.keys(ex).forEach((k) => {
        const a = NAJIA[k],
          b = ex[k];
        if (
          a &&
          JSON.stringify(a.g) === JSON.stringify(b.g) &&
          JSON.stringify(a.lo) === JSON.stringify(b.lo) &&
          JSON.stringify(a.up) === JSON.stringify(b.up)
        )
          n++;
      });
      add("八卦纳甲", n === 8, `${n}/8 与固定纳甲表一致`);
      const pure = [];
      for (let p = 1; p <= 8; p++) {
        const L = TRI[p].l.concat(TRI[p].l),
          x = liuyao(L, [], 0, 2);
        pure.push(x.shi === 6 && x.ying === 3);
      }
      add("八纯世应", pure.every(Boolean), `${pure.filter(Boolean).length}/8：八纯世六、应三`);
      const orders = ["本宫", "一世", "二世", "三世", "四世", "五世", "游魂", "归魂"];
      let palOK = 0;
      for (let p = 1; p <= 8; p++) {
        const a = Object.values(LY_PAL).filter((x) => x.pal === p);
        const s = new Set(a.map((x) => x.order));
        if (a.length === 8 && orders.every((o) => s.has(o))) palOK++;
      }
      add("八宫世次", palOK === 8, `${palOK}/8 宫均含本宫、一至五世、游魂、归魂`);
      const ls = [0, 0, 1, 1, 2, 3, 4, 4, 5, 5];
      add(
        "六神起法",
        JSON.stringify(LS_START) === JSON.stringify(ls),
        `甲乙青龙、丙丁朱雀、戊勾陈、己螣蛇、庚辛白虎、壬癸玄武`,
      );
      const kp = [
        [10, 11],
        [8, 9],
        [6, 7],
        [4, 5],
        [2, 3],
        [0, 1],
      ];
      let kk = 0;
      [0, 10, 20, 30, 40, 50].forEach((d, i) => {
        if (JSON.stringify(xunkongOf(d)) === JSON.stringify(kp[i])) kk++;
      });
      add("六甲旬空", kk === 6, `${kk}/6 旬首空亡规则一致`);
      const q = liuyao([1, 1, 1, 1, 1, 1], [], 0, 2),
        k = liuyao([0, 0, 0, 0, 0, 0], [], 0, 2);
      add(
        "乾坤装卦锚点",
        q.info.name === "乾为天" &&
          k.info.name === "坤为地" &&
          q.rows.map((r) => r.b).join(",") === "0,2,4,6,8,10" &&
          k.rows.map((r) => r.b).join(",") === "7,5,3,1,11,9",
        `乾：子寅辰午申戌；坤：未巳卯丑亥酉`,
      );
      const all64 = Object.keys(LY_PAL).length === 64 && new Set(Object.keys(LY_PAL)).size === 64;
      add("六十四卦覆盖", all64, `${Object.keys(LY_PAL).length}/64 唯一卦形`);
    } catch (e) {
      add("Evidence 执行", false, String(e.message || e));
    }
    return out;
  }
  function ly130EvidenceHTML() {
    const t = ly130Tests(),
      ok = t.filter((x) => x.ok).length;
    return `<div class="panel blk ly130-ev"><div class="ly129-head"><div><h3>六爻 Evidence 1.0 · 装卦规则锚点</h3><p>从“程序内部自洽”推进到“固定古法规则逐项对照”。本轮先冻结纳甲、世应、八宫、六神、旬空等基础层；实际占验案例的用神与断法留到下一层 Evidence。</p></div><span class="ly129-badge">${ok} / ${t.length} 通过</span></div><div class="ly130-evgrid"><div class="ly130-evcell"><small>基础规则锚点</small><b>${ok}/${t.length}</b></div><div class="ly130-evcell"><small>64 卦覆盖</small><b>${Object.keys(LY_PAL).length}/64</b></div><div class="ly130-evcell"><small>口径</small><b>京房八宫 · 纳甲</b></div></div><div class="ly130-list">${t.map((x) => `<div class="ly130-row"><b>${e130(x.n)}</b><span class="${x.ok ? "ok" : "ng"}">${x.ok ? "通过 ✓" : "异常"}</span><span>${e130(x.d)}</span></div>`).join("")}</div><div class="ly130-src">文献锚点：纳甲装卦、安世应、起六神、六甲旬空。在线核对可参考 <a href="https://zh.wikisource.org/zh-hans/%E5%A2%9E%E5%88%AA%E5%8D%9C%E6%98%93" target="_blank" rel="noopener">《增删卜易》</a> 与 <a href="https://chinesebooks.github.io/yijingshuji/bushizhengzong/" target="_blank" rel="noopener">《卜筮正宗》</a>。<br>注意：本面板验证的是“装卦基础规则”，并不等于已经验证具体问事的最终断语。</div></div>`;
  }
  try {
    const _v130Ly = renderLiuyao;
    renderLiuyao = function (R0) {
      return _v130Ly(R0) + ly130EvidenceHTML();
    };
    window.renderLiuyao = renderLiuyao;
  } catch (e) {
    console.error("[v130 liuyao evidence]", e);
  }

  try {
    const v = document.getElementById("buildVersion");

    window.TianjiSystemV130 = {
      version: "v130",
      build: V130_BUILD,
      overview2: true,
      liuyaoEvidence1: true,
    };
  } catch (_) {}
})();
