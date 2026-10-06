function renderBazi(R) {
  const { bz, t, lunar } = R,
    D = R.deep,
    names = ["年柱", "月柱", "日柱", "时柱"];
  const pillars = bz.pill
    .map((p, i) => {
      const idx = ganzhiIdx(p.s, p.b),
        ss = i === 2 ? "日主" : shishen(bz.dm, p.s);
      const cang = CANG[p.b]
        .map(
          (g) => `<span class="wx${GAN_WX[g]}">${GAN[g]}<small>${shishen(bz.dm, g)}</small></span>`,
        )
        .join("");
      const kong = i !== 2 && D.kong.includes(p.b) ? '<span class="kb">空</span>' : "";
      return `<div class="pillar${i === 2 ? " dm" : ""} rv" style="--i:${i}"><div class="ph">${names[i]}${kong}</div><div class="ss">${ss}</div><div class="gan wx${GAN_WX[p.s]}" data-scr="gz">${GAN[p.s]}</div><div class="zhi wx${ZHI_WX[p.b]}" data-scr="gz">${ZHI[p.b]}</div><div class="cang">${cang}</div><div class="ny">${NAYIN[idx >> 1]}</div><div class="cs2">星运 ${D.cs[i]} · 自坐 ${D.zizuo[i]}</div></div>`;
    })
    .join("");
  const mx = Math.max(...bz.wx),
    bars = bz.wx
      .map(
        (w, i) =>
          `<div class="bar"><span class="wx${i}">${WXK[i]}</span><i><em class="bg${i}" style="width:${((w / mx) * 100).toFixed(0)}%"></em></i><span>${w.toFixed(1)}</span></div>`,
      )
      .join("");
  const dm = GAN_WX[bz.dm],
    st = D.st,
    xy = D.xy,
    gj = D.gj;
  const cur = dayunNow(R);
  const dts = dayunTable(bz, D);
  const dy = dts
    .map(
      (d, i) =>
        `<div class="dy rv${i === cur ? " now" : ""}" style="--i:${i}"><div class="g wx${GAN_WX[d.idx % 10]}">${d.gz}</div><small>${d.ss}</small><small>${Math.floor(d.startAge)}岁起 · ${d.yr}</small><small class="${LVC(d.lv)}">${d.lv}</small></div>`,
    )
    .join("");
  const ay = Math.floor(bz.age),
    am = Math.round((bz.age - ay) * 12);
  const ex = D.ex,
    g2 = (o) => GAN[o.s] + ZHI[o.b];
  const rel = D.rel.length
    ? D.rel
        .map((r) => `<span class="pill ${r.t === "合" ? "g" : "r"}" title="${r.k}">${r.txt}</span>`)
        .join("")
    : '<span class="dim">四柱之间无明显合冲刑害</span>';
  const tone = { 吉: "g", 凶: "r", 动: "c", 情: "p", 静: "d", 空: "d", 刚: "r" };
  const sss = D.ss.length
    ? D.ss
        .map(
          (s) =>
            `<span class="pill ${tone[s.tone] || ""}" title="${esc(s.desc)}">${s.n}<small>${s.where.join("")}</small></span>`,
        )
        .join("")
    : '<span class="dim">无常见神煞</span>';
  const ratioPct = (st.ratio * 100).toFixed(0);
  const y0 = liuYear || nowBJ().y;
  return `<div class="panel blk"><div class="kv"><span>公历 <b>${t.civ.y}年${t.civ.m}月${t.civ.d}日 ${f2(t.civ.h)}:${f2(t.civ.mi)}</b></span><span>农历 <b>${lunarText(lunar)}</b></span>${R.opt.solar ? `<span>真太阳时 <b>${f2(t.loc.h)}:${f2(t.loc.mi)}</b>(${t.shift >= 0 ? "+" : ""}${t.shift.toFixed(1)}分)</span>` : ""}<span>太阳黄经 <b>${t.lon.toFixed(3)}°</b></span>${tjLifeDaysMeta(R, "bazi")}</div></div>
  <div class="panel blk" id="bzx"></div>
  <div class="panel blk"><h3 class="sec">日主旺衰 · 格局 · 喜用</h3>
    <div class="meter"><i style="left:${ratioPct}%"></i><span>偏弱</span><span>中和</span><span>偏强</span></div>
    <div class="kv" style="margin-top:6px"><span>日主 <b class="wx${dm}">${GAN[bz.dm]}${WXK[dm]}</b></span><span>生扶占比 <b>${ratioPct}%</b></span><span>判断 <b>${st.level}</b></span><span>月令 <b>${st.season}</b>${st.deLing ? "(得令)" : "(失令)"}</span><span>格局 <b>${gj.name}</b></span></div>
    <div class="kv" style="margin-top:4px"><span>${gj.note}</span></div>
    <div style="margin-top:10px"><span class="lab">取用</span> ${xy.favor.map((x) => `<span class="pill g wx${x}">${WXK[x]}</span>`).join("")} <span class="lab" style="margin-left:10px">宜抑</span> ${xy.avoid.map((x) => `<span class="pill r wx${x}">${WXK[x]}</span>`).join("") || '<span class="dim">—</span>'}</div>
    <ul class="mini">${xy.notes.map((n) => `<li>${n}</li>`).join("")}</ul>
    <p class="note">旺衰按四柱位置加权(月支最重)统计天干与藏干,比较生扶与克泄耗的力量,再用扶抑与调候两条最常见的思路取用。这是教科书式的机械近似,没有处理从格、化气格、合冲对力量的改变,也不含具体行业与六亲取象。</p></div>
  <div class="panel blk"><h3 class="sec">五行权重</h3><div class="bars">${bars}</div><p class="note">天干计 1(月干 1.2),地支藏干按 1 / 0.5 / 0.3 递减,仅作分布示意。</p></div>
  <div class="panel blk"><h3 class="sec">合冲刑害</h3><div class="pills">${rel}</div><h3 class="sec" style="margin-top:14px">神煞</h3><div class="pills">${sss}</div><p class="note">神煞取通行查表口径(悬停显示含义),各派差异大,且传统上多为辅助参考。空亡以日柱旬、年柱旬分别计。</p></div>
  <div class="panel blk"><h3 class="sec">大运(${bz.fwd ? "顺" : "逆"}行)</h3><div class="kv" style="margin-bottom:10px"><span>起运 <b>${ay}岁${am}个月</b></span><span>上节 <b>${bz.jie.prev}</b> ${fmtT(bz.jie.prevT)}</span><span>下节 <b>${bz.jie.next}</b> ${fmtT(bz.jie.nextT)}</span></div><div class="dayun">${dy}</div><p class="note">大运倾向 = 干支五行与上面的取用/宜抑比对,再加冲合日支月支的扣加分(权重:天干 0.6、地支 0.4)。它只表达“与原局喜忌的机械契合程度”,不预测事件。以此刻作出生时间的“命盘模式”:阳男阴女顺行、阴男阳女逆行,三日折一岁;交节时刻由校准后的天文算法得出,误差在秒级到一分钟内。</p></div>
  <div class="panel blk"><div class="yrctl"><label>起始流年 <input type="number" id="liuYear" min="1902" max="2098" value="${y0}"></label><button class="gbtn sm" id="liuPrev">‹ 前一年</button><button class="gbtn sm" id="liuNext">后一年 ›</button></div><div id="liuBox">${liuHTML(R, y0)}</div></div>
  ${bzReadHTML(R)}`;
}
let liuYear = 0;
function bindBazi() {
  const upd = () => {
    const v = parseInt($("#liuYear").value);
    if (!v) return;
    liuYear = Math.max(1902, Math.min(2098, v));
    $("#liuBox").innerHTML = liuHTML(R, liuYear);
  };
  try {
    bzxRender();
  } catch (e) {
    console.error(e);
  }
  const y = $("#liuYear");
  if (!y) return;
  $$(".dayun .dy").forEach((c, i) => {
    c.style.cursor = "pointer";
    c.title = "点击:在上方互动细盘中叠加这步大运";
    c.onclick = () => {
      BZX.dy = i;
      BZX.run = true;
      BZX.sel = null;
      bzxRender();
      const h = $("#bzx");
      if (h) h.scrollIntoView({ behavior: "smooth", block: "start" });
    };
  });
  y.onchange = upd;
  $("#liuPrev").onclick = () => {
    y.value = (+y.value || nowBJ().y) - 1;
    upd();
  };
  $("#liuNext").onclick = () => {
    y.value = (+y.value || nowBJ().y) + 1;
    upd();
  };
}

/* ---- 总览 ---- */
function palScore(R, p) {
  // 综合方位分:奇门盘面 + 喜用五行 + 流年紫白
  const q = R.qm.cells[p].score,
    xy = R.deep.xy,
    wx = PWX[p];
  const xi = xy.favor.includes(wx) ? 1 : xy.avoid.includes(wx) ? -1 : 0;
  const star = xkFly(xkYearStar(R.yearForStar), true)[p];
  const ys = { 1: 1, 2: -1, 3: -1, 4: 1, 5: -2, 6: 1, 7: 0, 8: 1, 9: 1 }[star];
  return { q, xi, ys, star, total: q + xi + ys };
}
function renderOverview(R) {
  const c = R.t.civ,
    di = dayInfo(c.y, c.m, c.d),
    D = R.deep,
    bz = R.bz,
    st = D.st,
    xy = D.xy;
  R.yearForStar = bz.yearNum;
  const dirs = [1, 2, 3, 4, 6, 7, 8, 9]
    .map((p) => ({ p, ...palScore(R, p) }))
    .sort((a, b) => b.total - a.total);
  const mx = Math.max(4, ...dirs.map((d) => Math.abs(d.total)));
  const bars = dirs
    .map(
      (d) =>
        `<div class="dbar"><span class="dn">${PDIR[d.p]}<small>${PNAME[d.p]}${PNUM[d.p]}</small></span><span class="sb ${d.total < 0 ? "neg" : "pos"}"><i style="width:${((Math.abs(d.total) / mx) * 50).toFixed(0)}%"></i></span><span class="dv ${d.total >= 2 ? "good" : d.total <= -2 ? "bad" : "mid"}">${d.total > 0 ? "+" : ""}${d.total.toFixed(0)}</span><span class="dd">奇门${d.q > 0 ? "+" : ""}${d.q} · 五行${d.xi > 0 ? "+" : ""}${d.xi} · 流年星${d.star}(${d.ys > 0 ? "+" : ""}${d.ys})</span></div>`,
    )
    .join("");
  const y0 = nowBJ().y,
    ly = liunian(bz, D, y0 - 3, 16);
  const W = 520,
    H = 120,
    pad = 22,
    bw = (W - pad * 2) / ly.length;
  const bars2 = ly
    .map((x, i) => {
      const h = Math.min(48, (Math.abs(x.sc) / 1.6) * 48),
        y = x.sc >= 0 ? 60 - h : 60;
      const now = x.y === y0;
      return `<g><rect x="${(pad + i * bw + 2).toFixed(1)}" y="${y.toFixed(1)}" width="${(bw - 4).toFixed(1)}" height="${Math.max(1.5, h).toFixed(1)}" class="${x.sc >= 0 ? "pos" : "neg"}${now ? " now" : ""}"/><text x="${(pad + i * bw + bw / 2).toFixed(1)}" y="${H - 24}" text-anchor="middle" class="tk">${String(x.y).slice(2)}</text><text x="${(pad + i * bw + bw / 2).toFixed(1)}" y="${H - 10}" text-anchor="middle" class="tk g">${x.gz}</text></g>`;
    })
    .join("");
  const yi = di.yi.slice(0, 10),
    ji = di.ji.slice(0, 10);
  return `<div class="panel blk"><h3 class="sec">此刻黄历 · ${c.y}.${c.m}.${c.d}</h3>
   <div class="kv"><span>日柱 <b>${di.gz}</b>(${di.nayin})</span><span>建除 <b class="${LVC(di.zxTone)}">${di.zx}日</b></span><span>二十八宿 <b>${di.xiu}</b></span><span>天神 <b class="${di.huang ? "good" : "bad"}">${di.ts}${di.huang ? "(黄道)" : "(黑道)"}</b></span><span>冲 <b>${di.chong}</b> 煞 <b>${di.sha}</b></span></div>
   <div class="yj"><div><span class="yl">宜</span>${chipList(yi, "g") || '<span class="dim">诸事不宜</span>'}</div><div><span class="yl j">忌</span>${chipList(ji, "r") || '<span class="dim">—</span>'}</div></div></div>
  <div class="panel blk"><h3 class="sec">命局速览</h3><div class="kv"><span>四柱 <b>${bz.pill.map((p) => GAN[p.s] + ZHI[p.b]).join(" ")}</b></span><span>日主 <b class="wx${GAN_WX[bz.dm]}">${GAN[bz.dm]}${WXK[GAN_WX[bz.dm]]}</b> ${st.level}</span><span>格局 <b>${D.gj.name}</b></span><span>取用 <b>${xy.favor.map((x) => WXK[x]).join("")}</b></span><span>宜抑 <b>${xy.avoid.map((x) => WXK[x]).join("") || "—"}</b></span></div></div>
  <div class="panel blk"><h3 class="sec">综合方位(机械叠加)</h3><div class="dbars">${bars}</div><p class="note">分值 = 奇门该宫星门格局分 + 该宫五行对取用/宜抑的契合(±1) + 当年紫白飞星吉凶(五黄 −2)。三套体系各有不同的“时间尺度”(此刻 / 一生 / 一年),这里只是把它们简单相加做展示,并不是经典体系里存在的一种断法。</p></div>
  <div class="panel blk"><h3 class="sec">流年趋势 · ${y0 - 3}—${y0 + 12}</h3><svg viewBox="0 0 ${W} ${H}" class="trend" role="img" aria-label="流年倾向柱状图"><line x1="${pad}" x2="${W - pad}" y1="60" y2="60" class="axis"/>${bars2}</svg><p class="note">柱向上为契合喜用、向下为逆喜用(与八字页“流年”同一算法);描边柱为今年。</p></div>
  ${aiCardHTML()}
  <div class="panel blk"><h3 class="sec">文字报告</h3><p class="note" style="margin:0 0 8px">把当前各体系的关键结果汇总成纯文本,便于粘贴保存或交给他人。</p><button class="gbtn" id="repBtn">生成文字报告</button></div>`;
}
function buildReportBrief(R) {
  const c = R.t.civ,
    bz = R.bz,
    D = R.deep,
    q = R.qm,
    mh = R.mh,
    zw = R.zw,
    lr = R.lr;
  const L = [];
  L.push(
    `【天机盘报告】${c.y}-${f2(c.m)}-${f2(c.d)} ${f2(c.h)}:${f2(c.mi)}(北京时间)${R.opt.solar ? ` 真太阳时 ${f2(R.t.loc.h)}:${f2(R.t.loc.mi)}` : ""}`,
  );
  L.push(`农历:${lunarText(R.lunar)}  太阳黄经 ${R.t.lon.toFixed(2)}°`);
  L.push(
    `\n■ 八字:${bz.pill.map((p) => GAN[p.s] + ZHI[p.b]).join(" ")}  日主${GAN[bz.dm]}${WXK[GAN_WX[bz.dm]]}(${D.st.level},${D.st.season}令)  格局:${D.gj.name}`,
  );
  L.push(
    `  取用:${D.xy.favor.map((x) => WXK[x]).join("")}  宜抑:${D.xy.avoid.map((x) => WXK[x]).join("") || "—"}  命宫${GAN[D.ex.ming.s] + ZHI[D.ex.ming.b]} 身宫${GAN[D.ex.shen.s] + ZHI[D.ex.shen.b]} 胎元${GAN[D.ex.tai.s] + ZHI[D.ex.tai.b]}`,
  );
  if (D.rel.length) L.push("  合冲刑害:" + D.rel.map((r) => r.txt).join(";"));
  if (D.ss.length)
    L.push("  神煞:" + D.ss.map((s) => s.n + "(" + s.where.join("") + ")").join("、"));
  L.push(
    "  大运:" +
      dayunTable(bz, D)
        .map((d) => `${Math.floor(d.startAge)}岁${d.gz}`)
        .join(" "),
  );
  L.push(
    `\n■ 奇门遁甲:${q.yang ? "阳" : "阴"}遁${PNUM[q.ju]}局(${q.term}${q.yuanName})  值符天${q.zfStar} 值使${q.zsDoor}门  ${q.fuyin ? "伏吟 " : ""}${q.fanyin ? "反吟" : ""}`,
  );
  L.push(
    "  结构较顺:" +
      q.best.map((p) => PDIR[p] + q.cells[p].door + "门").join("、") +
      "  偏阻:" +
      q.worst.map((p) => PDIR[p] + q.cells[p].door + "门").join("、"),
  );
  L.push(
    `\n■ 大六壬:${lr.ge}(${lr.sub})  三传 ${lr.chu.map((x) => ZHI[x.z] + "(" + x.gen + ")").join("→")}  月将${lr.jiangName}`,
  );
  L.push(
    `\n■ 梅花易数:${mh.ben.name} → ${mh.bian.name}(互 ${mh.hu.name},动爻第${mh.mv}爻,${mh.verdict[0]})`,
  );
  L.push(
    `\n■ 紫微斗数:命宫${ZHI[zw.ming]} 身宫${ZHI[zw.shen]} ${zw.juName} 紫微在${ZHI[zw.z]}  命主${zw.mingStar} 身主${zw.shenStar}  生年四化 ${zw.sihua.join(" ")}`,
  );
  try {
    const g = guideReading(R, nowBJ().y);
    L.push("\n■ 个人指南要点");
    g.summary.forEach((x) => L.push("  " + x.text));
    const z = ziweiReading(R.zw, R.lunar, R.opt.gender, nowBJ().y);
    L.push("■ 紫微解读要点");
    z.summary.forEach((x) => L.push("  " + x.text));
    const b = bzReading(R.bz, R.deep, R.opt.gender, R.lunar, nowBJ().y);
    L.push("■ 八字解读要点");
    b.summary.forEach((x) => L.push("  " + x.text));
    const a = R.astro;
    L.push(
      `■ 天象:${a.planets.map((p) => p.n + AS_SIGN[Math.floor(p.lon / 30)][0] + Math.floor(p.lon % 30) + "°" + (p.retro ? "R" : "")).join(" ")};月相 ${a.moon.name};${a.yq.gz}年 ${a.yq.yunName},司天${a.yq.siTian}`,
    );
  } catch (e) {}
  L.push("\n(本报告为传统术数算法演示,不构成任何决策建议)");
  return L.join("\n");
}

/* ---- 奇门 / 梅花 ---- */
function renderQimen(R) {
  const q = R.qm,
    order = [4, 9, 2, 3, 5, 7, 8, 1, 6];
  const cells = order
    .map((p, i) => {
      const c = q.cells[p];
      if (p === 5)
        return `<div class="qc ctr" style="--i:${i}"><div><div style="font-size:12px;color:var(--dim)">中五宫</div><div class="hs" style="font-family:'Ma Shan Zheng',serif;font-size:34px;color:var(--gold2)">${c.earth}</div><div style="font-size:11px;color:var(--dim)">地盘 · 寄坤二</div></div></div>`;
      const stType = STARTYPE[c.star],
        gj = c.geju
          .concat(c.extra2 || [])
          .map((g) => `<div class="gj ${g.t}" title="${g.d || ""}">${g.n}</div>`)
          .join("");
      return `<div class="qc${p === q.q ? " zf" : ""}${p === q.rr ? " zs" : ""}" style="--i:${i}"><div class="top2"><span class="god">${c.god}</span><span>${PNAME[p]}${PNUM[p]} · ${PDIR[p]}</span></div>
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
  return `<div class="panel blk"><div class="kv"><span><b>${q.yang ? "阳" : "阴"}遁${PNUM[q.ju]}局</b></span><span>节气 <b>${q.term}</b>${q.yuanName}</span><span>时柱 <b>${q.hourGZ}</b></span><span>旬首 <b>甲${ZHI[(R.bz.hourIdx - (R.bz.hourIdx % 10)) % 12]}${q.dun}</b></span><span>值符 <b>天${q.zfStar}</b></span><span>值使 <b>${q.zsDoor}门</b></span>${flags ? `<span style="color:var(--red)"><b>${flags}</b></span>` : ""}</div>
  <div class="kv" style="margin-top:4px"><span>空亡 <b>${q.kongB.map((b) => ZHI[b]).join("")}</b>(${q.kongP.map((p) => PNAME[p] + PNUM[p]).join("、")}宫)</span><span>驿马 <b>${ZHI[q.horseB]}</b>(${PNAME[q.horseP]}${PNUM[q.horseP]}宫)</span></div></div>
  <div class="panel blk"><div class="qgrid">${cells}</div><p class="note">每宫从上到下:八神 / 宫位方位、天盘干与九星、八门、地盘干与标记。红框为值符落宫,青点为值使落宫。地盘按局排三奇六仪,转盘九星八门整体旋转,天禽寄坤二随天芮。</p></div>
  <div class="panel blk dirs"><div><h3 class="sec">结构较顺之方</h3><ul>${list(q.best)}</ul></div><div><h3 class="sec">结构偏阻之方</h3><ul>${list(q.worst)}</ul></div></div>
  <div class="panel blk"><h3 class="sec">问事分析 · 按所问之事解读此盘</h3>${topicBar("asks", QM_TOPICS, qmTopic)}<div id="askOut">${readingHTML(qimenAsk(R, qmTopic), { foot: RD_FOOT })}</div></div>
  <p class="note">评分只是把星、门、格局、空亡、门迫做机械加减(吉门 +2、凶门 −2,吉凶格 ±2,空亡、门迫各 −1),用来展示盘面结构,并非断语。此为时家转盘奇门·拆补法,以交节时刻换局;定局取当前所处节气查局数表,再以日柱所属旬的符头地支定上/中/下元(现行软件最常见的“拆补”口径);更严格的“节气日起用上元、未完部分拆到下元之后补足”的拆补写法、超神接气置闰、茅山法、阴盘、飞盘等排法不同,结果会有出入。局数、地盘、九星、八门、天盘干已与另一套开源拆补实现对拍一致。</p>`;
}

function renderYi(R) {
  const m = R.mh,
    v = m.verdict,
    tiN = TRI[m.ti],
    yoN = TRI[m.yong];
  return `<div class="panel blk"><h3 class="sec">梅花易数 · 时间起卦</h3><div class="numbox"><span>年支数 <b>${m.yn}</b></span><span>农历月 <b>${m.m}</b></span><span>农历日 <b>${m.d}</b></span><span>时支数 <b>${m.h}</b></span><span>上卦 (${m.yn}+${m.m}+${m.d}) mod 8 = <b>${m.up} ${TRI[m.up].n}</b></span><span>下卦 (…+${m.h}) mod 8 = <b>${m.lo} ${TRI[m.lo].n}</b></span><span>动爻 mod 6 = <b>第${m.mv}爻</b></span></div>
  <div class="hexrow" style="margin-top:14px">${hexCard("本卦 · 事之始", m.ben, m.moving, 0)}${hexCard("互卦 · 事之中", m.hu, [], 1)}${hexCard("变卦 · 事之终", m.bian, [], 2)}</div></div>
  <div class="panel blk"><h3 class="sec">体用</h3><div class="kv"><span>体 <b>${tiN.img}${tiN.n}(${WXK[tiN.wx]})</b></span><span>用 <b>${yoN.img}${yoN.n}(${WXK[yoN.wx]})</b></span><span>关系 <b>${v[0]}</b></span><span>倾向 <b style="color:var(--${v[1].startsWith("吉") || v[1] === "大吉" ? "good" : v[1] === "凶" ? "bad" : "mid"})">${v[1]}</b></span></div><p class="note" style="margin-top:8px">${v[2]}动爻在${m.inLower ? "下" : "上"}卦,故${m.inLower ? "上卦为体、下卦为用" : "下卦为体、上卦为用"}。梅花易数原本讲究“先天之数为体、临机取象为用”,此处只演示时间起卦的算法骨架,象意需结合所问之事。</p></div>
  <div class="panel blk"><h3 class="sec">铜钱摇卦</h3><p class="note" style="margin:0 0 8px">三枚铜钱六次,随机数取自浏览器加密随机源:六为老阴、七为少阳、八为少阴、九为老阳,老爻为动爻。</p><button class="gbtn" id="castBtn">摇 卦</button><div class="coins" id="coins"></div><div id="castOut"></div></div>
  ${mhReadHTML(R)}`;
}

function bindCast() {
  const b = $("#castBtn");
  if (!b) return;
  b.onclick = async () => {
    b.disabled = true;
    const box = $("#coins"),
      out = $("#castOut");
    box.innerHTML = "";
    out.innerHTML = "";
    const buf = new Uint8Array(18);
    crypto.getRandomValues(buf);
    let k = 0;
    const sums = castCoins(() => buf[k++] & 1);
    for (const s of sums) {
      const d = document.createElement("div");
      d.className = "coin" + (s === 6 || s === 9 ? " old" : "");
      d.textContent = { 6: "老阴", 7: "少阳", 8: "少阴", 9: "老阳" }[s];
      d.title = s;
      box.appendChild(d);
      if (!REDUCE) await sleep(420);
    }
    const r = coinsToHex(sums);
    out.innerHTML = `<div class="hexrow" style="grid-template-columns:repeat(2,1fr)">${hexCard("本卦", r.ben, r.moving, 0)}${hexCard(r.moving.length ? "变卦" : "变卦(无动爻,同本卦)", r.bian, [], 1)}</div><p class="note">${r.moving.length ? "动爻:" + r.moving.map((i) => ["初", "二", "三", "四", "五", "上"][i] + "爻").join("、") : "六爻安静,以本卦卦辞为断。"}(自下而上:${sums.join(" ")})</p>`;
    b.disabled = false;
  };
}

/* ---- 大六壬 ---- */
const LR_POS = {
  5: [1, 1],
  6: [1, 2],
  7: [1, 3],
  8: [1, 4],
  9: [2, 4],
  10: [3, 4],
  11: [4, 4],
  0: [4, 3],
  1: [4, 2],
  2: [4, 1],
  3: [3, 1],
  4: [2, 1],
};
function renderLiuren(R) {
  const lr = R.lr,
    dg = lr.dg,
    inChu = lr.chu.map((c) => c.z);
  const tags = ["初", "中", "末"];
  const cells = [];
  for (let b = 0; b < 12; b++) {
    const s = lr.sky[b],
      [r, c] = LR_POS[b],
      idx = inChu.indexOf(s);
    const g = lr.gen[s];
    cells.push(
      `<div class="lrc${idx >= 0 ? " chu" : ""}" style="grid-area:${r}/${c};--i:${b}"><span class="eb">${ZHI[b]}</span>${idx >= 0 ? `<span class="cb">${tags[idx]}传</span>` : ""}<div class="sk wx${ZHI_WX[s]}" data-scr="gz">${ZHI[s]}</div><div class="gn ${TJ_TONE[g]}">${g}</div><small class="dim">${lr.dun[s] ? "遁" + lr.dun[s] + " · " : ""}${lr.relOf(s)}</small></div>`,
    );
  }
  const ke4 = [...lr.ke].reverse(); // 四课 三课 二课 一课
  const nm = ["四课", "三课", "二课", "一课"];
  const ke = ke4
    .map(
      (k, i) =>
        `<div class="kc"><div class="kh">${nm[i]}</div><div class="ku wx${ZHI_WX[k.u]}">${ZHI[k.u]}</div><div class="kr ${k.rel === "贼" ? "bad" : k.rel === "克" ? "good" : "dim"}">${k.rel === "和" ? "—" : k.rel === "贼" ? "下贼上" : "上克下"}</div><div class="kl">${k.lIsGan ? GAN[dg] : ZHI[k.l]}</div><small class="${TJ_TONE[k.gen]}">${k.gen}</small></div>`,
    )
    .join("");
  const cs = lr.chu
    .map(
      (c, i) =>
        `<div class="cc rv" style="--i:${i}"><div class="ch">${["初传", "中传", "末传"][i]}</div><div class="cz wx${ZHI_WX[c.z]}" data-scr="gz">${ZHI[c.z]}</div><div class="cj ${TJ_TONE[c.gen]}">${c.gen}</div><small class="dim">${TJ_BRIEF[c.gen]}</small><div class="cm">${c.rel}${c.dun ? " · 遁" + c.dun : ""}${c.kong ? ' · <span class="bad">空亡</span>' : ""}</div></div>`,
    )
    .join('<div class="ar">›</div>');
  return `<div class="panel blk"><div class="kv"><span>日柱 <b>${GAN[dg]}${ZHI[lr.dz]}</b></span><span>时支 <b>${ZHI[lr.hb]}</b>(${lr.day ? "昼" : "夜"}占)</span><span>月将 <b>${ZHI[lr.zj]}·${lr.jiangName}</b> 加时</span><span>贵人 <b>${ZHI[lr.gui]}</b> ${lr.shun ? "顺布" : "逆布"}</span><span>课体 <b class="gold">${lr.ge}</b></span><span>空亡 <b>${lr.kong.map((z) => ZHI[z]).join("")}</b></span><span>驿马 <b>${ZHI[lr.yiMa]}</b></span></div><p class="note" style="margin-top:6px">取传依据:${lr.sub}${lr.fuyin ? "。天地盘伏吟" : ""}${lr.fanyin ? "。天地盘返吟" : ""}</p></div>
  <div class="panel blk"><h3 class="sec">天地盘</h3><div class="lrgrid">${cells.join("")}<div class="lrctr"><div class="big">${lr.ge}</div><div class="dim">${ZHI[lr.zj]}将(${lr.jiangName})加${ZHI[lr.hb]}时</div><div class="dim">${GAN[dg]}${ZHI[lr.dz]}日 · ${lr.day ? "昼" : "夜"}贵</div></div></div><p class="note">外圈小字为地盘(固定十二支),大字为月将加临时支后转到该位的天盘神,其下为十二天将与遁干(天盘神在本日旬中的天干)。“初/中/末传”角标标出三传所在。</p></div>
  <div class="panel blk"><h3 class="sec">四课</h3><div class="kegrid">${ke}</div><p class="note">一课:日干寄宫上神;二课:一课上神之上神;三课:日支上神;四课:三课上神之上神。</p></div>
  <div class="panel blk"><h3 class="sec">三传</h3><div class="chuan">${cs}</div><p class="note">六亲以日干为“我”:同我为兄弟,我生为子孙,我克为妻财,克我为官鬼,生我为父母。取传按九宗门次序(贼克→比用→涉害→遥克→昴星→别责→八专→伏吟/返吟)。天地盘、四课、天将已与一套开源六壬实现全量对拍(12 将×12 时×60 日柱共 8640 局)一致;元首/重审/昴星课体全部一致,遥克 98.5% 一致。伏吟、八专、别责、涉害的取传口径在各派间本来就有分歧,这里按通行九宗门规则,与该开源实现的特例分支并不完全相同,遇到这几类课体请以你所宗流派为准。</p></div>
  ${lrReadHTML(R)}`;
}

/* ---- 六爻纳甲 ---- */
let LYS = { mode: "time", sums: null };
function lyLinesFrom(R) {
  if (LYS.mode === "time" || !LYS.sums)
    return { lines: R.mh.ben.lines.slice(), moving: R.mh.moving.slice() };
  const r = coinsToHex(LYS.sums);
  return { lines: r.ben.lines.slice(), moving: r.moving.slice() };
}
function lyHTML(R) {
  const { lines, moving } = lyLinesFrom(R),
    L = liuyao(lines, moving, R.bz.dayIdx, R.bz.pill[1].b);
  const yao = (y, mv) =>
    `<span class="yao ${y ? "yang" : "yin"}${mv ? " mv" : ""}"><b></b>${y ? "" : "<b></b>"}</span>`;
  const rows = [];
  for (let i = 5; i >= 0; i--) {
    const r = L.rows[i],
      r2 = L.rows2[i],
      mv = L.moving.includes(i);
    rows.push(`<tr class="${r.isShi ? "shi" : ""}${r.isYing ? " ying" : ""}">
      <td class="ls">${r.ls}</td>
      <td class="fu dim">${r.fu ? `${GAN[r.fu.gan]}${ZHI[r.fu.b]} ${r.fu.rel}` : ""}</td>
      <td class="lyr wx${r.wx}">${r.rel}</td><td class="lyz"><b class="wx${r.wx}">${GAN[r.gan]}${ZHI[r.b]}</b><small>${WXK[r.wx]}</small></td>
      <td>${yao(r.yang, mv)}${mv ? `<em class="mvt">${r.yang ? "○" : "×"}</em>` : ""}</td>
      <td class="sy">${r.isShi ? "世" : r.isYing ? "应" : ""}</td>
      <td class="bchg">${mv ? `<span class="wx${r2.wx}">${r2.rel} ${GAN[r2.gan]}${ZHI[r2.b]}</span> ${yao(r2.yang, false)}<small class="dim">${r.change || ""}</small>` : ""}</td>
      <td class="dim sm">${r.season}${r.kong ? "·旬空" : ""}${r.dayRel ? "·" + r.dayRel : ""}</td></tr>`);
  }
  const fu = L.fu.length
    ? `本卦缺 ${L.fu.join("、")},伏于本宫纯卦相应爻下(见“伏神”列)。`
    : "六亲俱全,无需取伏神。";
  return `<div class="kv"><span>本卦 <b class="gold">${L.info.name}</b></span><span>变卦 <b>${L.moving.length ? L.info2.name : "无(六爻安静)"}</b></span><span>卦宫 <b>${L.palName}·${L.pal.order}</b>(${WXK[L.palWx]})</span><span>世 <b>第${L.shi}爻</b> 应 <b>第${L.ying}爻</b></span><span>月建 <b>${ZHI[L.monthB]}</b> 日辰 <b>${ZHI[L.dayIdx % 12]}</b> 旬空 <b>${L.kong.map((z) => ZHI[z]).join("")}</b></span></div>
  <div class="tbl-wrap"><table class="tbl ly"><thead><tr><th>六神</th><th>伏神</th><th colspan="2">本卦(纳甲·六亲)</th><th></th><th></th><th>变爻</th><th>月日</th></tr></thead><tbody>${rows.join("")}</tbody></table></div>
  <p class="note">${fu}动爻标记:○ 老阳、× 老阴;“变爻”列给出该动爻所变之爻及其关系(回头生/回头克、化进/化退、化合/化冲等)。“月日”列为各爻对月建的旺相休囚死、月破、对日辰的生克冲合与旬空。</p>`;
}
function renderLiuyao(R) {
  const sel = [0, 1, 2, 3, 4, 5]
    .map(
      (i) =>
        `<label>${["初", "二", "三", "四", "五", "上"][i]}爻<select data-ly="${i}">${[
          [6, "老阴 ×"],
          [7, "少阳 ─"],
          [8, "少阴 - -"],
          [9, "老阳 ○"],
        ]
          .map(
            ([v, t]) =>
              `<option value="${v}"${LYS.sums && LYS.sums[i] === v ? " selected" : ""}>${t}</option>`,
          )
          .join("")}</select></label>`,
    )
    .join("");
  return `<div class="panel blk"><h3 class="sec">六爻纳甲 · 装卦</h3>
  <div class="lyctl"><button class="gbtn sm${LYS.mode === "time" ? " on" : ""}" id="lyTime">按当前时刻起卦</button><button class="gbtn sm${LYS.mode === "coin" ? " on" : ""}" id="lyCoin">铜钱摇卦</button><button class="gbtn sm${LYS.mode === "dayan" ? " on" : ""}" id="lyDayan" title="系辞古法:大衍之数五十,其用四十有九">大衍揲蓍</button><button class="gbtn sm${LYS.mode === "manual" ? " on" : ""}" id="lyMan">手动录入</button></div>
  <div class="lyman" id="lyManBox"${LYS.mode === "manual" ? "" : " hidden"}>${sel}<button class="gbtn sm" id="lyGo">装卦</button></div>
  <div id="lyDayanLog" class="dayan-log">${LYS.mode === "dayan" && LYS.dayanLog ? LYS.dayanLog : ""}</div><div id="lyBox">${lyHTML(R)}</div></div>
  <div class="panel blk"><p class="note" style="margin:0">纳甲遵《京房易传》通行体系:八卦纳干支、八宫世应(一至五世、游魂、归魂)、六亲按“卦宫五行”定、六神按日干起青龙。时间起卦沿用梅花易数的上下卦与动爻数;摇卦用浏览器加密随机源。装卦结果是纯粹的排盘事实,用神取舍、旺衰断卦属于解卦环节,派别甚多,这里不作断语。</p></div>
  ${lyReadHTML(R)}`;
}
function bindLiuyao() {
  const box = () => {
    $("#lyBox").innerHTML = lyHTML(R);
    const lr = $("#lyRead");
    if (lr) lr.innerHTML = lyReadInner(R);
  };
  const setMode = (m) => {
    LYS.mode = m;
    ["Time", "Coin", "Dayan", "Man"].forEach((k) => {
      const b = $("#ly" + k);
      if (b)
        b.classList.toggle(
          "on",
          (k === "Time" && m === "time") ||
            (k === "Coin" && m === "coin") ||
            (k === "Dayan" && m === "dayan") ||
            (k === "Man" && m === "manual"),
        );
    });
    const dl = $("#lyDayanLog");
    if (dl && m !== "dayan") dl.innerHTML = "";
    $("#lyManBox").hidden = m !== "manual";
  };
  $("#lyTime").onclick = () => {
    setMode("time");
    box();
  };
  $("#lyMan").onclick = () => {
    setMode("manual");
    if (!LYS.sums) LYS.sums = [7, 7, 7, 7, 7, 7];
    $$("[data-ly]").forEach((s) => (s.value = LYS.sums[+s.dataset.ly]));
    box();
    LYS.mode = "manual";
  };
  $("#lyGo").onclick = () => {
    LYS.sums = [0, 1, 2, 3, 4, 5].map((i) => +$(`[data-ly="${i}"]`).value);
    LYS.mode = "manual";
    box();
  };
  $("#lyDayan").onclick = () => {
    setMode("dayan");
    const r = dayanStalks(cryptoRand);
    LYS.sums = r.sums;
    LYS.dayanLog = `<p class="note" style="margin:8px 0 0">大衍之数五十,其用四十有九。分二、挂一、揲四、归奇,三变而成一爻(用浏览器的加密随机源模拟揲蓍,自下而上):</p><p>${r.logs.join("</p><p>")}</p>`;
    const dl = $("#lyDayanLog");
    if (dl) dl.innerHTML = LYS.dayanLog;
    box();
  };
  $("#lyCoin").onclick = async () => {
    setMode("coin");
    const buf = new Uint8Array(18);
    crypto.getRandomValues(buf);
    let k = 0;
    LYS.sums = castCoins(() => buf[k++] & 1);
    box();
  };
}

/* ---- 紫微斗数 ---- */
const ZW_POS = {
  5: [1, 1],
  6: [1, 2],
  7: [1, 3],
  8: [1, 4],
  9: [2, 4],
  10: [3, 4],
  11: [4, 4],
  0: [4, 3],
  1: [4, 2],
  2: [4, 1],
  3: [3, 1],
  4: [2, 1],
};
function ziweiYearsHTML(R, y0) {
  const yrs = ziweiYears(R.zw, y0, 12);
  const rows = yrs
    .map(
      (y) =>
        `<tr><td class="c1">${y.y}</td><td class="c2 wx${GAN_WX[(y.y - 4 + 100) % 10]}">${y.gz}</td><td class="dim">${y.age > 0 ? y.age + "岁" : "-"}</td><td>${y.palName}<small class="dim"> ${ZHI[y.b]}</small></td><td class="flies">${y.flies.map((f) => `<span class="fl ${f.h}">${f.star}<sup>${f.h}</sup><small>入${f.pal}</small></span>`).join("")}</td></tr>`,
    )
    .join("");
  return `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>年</th><th>干支</th><th>虚岁</th><th>流年命宫落本命</th><th>流年四化 · 落入本命之宫</th></tr></thead><tbody>${rows}</tbody></table></div>`;
}
function renderZiwei(R) {
  const z = R.zw;
  const cells = z.pal
    .map((p, i) => {
      const [r, c] = ZW_POS[p.b];
      const st = p.stars
        .map(
          (s) =>
            `<span class="st ${s.t}">${s.n}${s.br ? `<i class="br b${s.br}">${s.br}</i>` : ""}${s.h ? `<sup class="${s.h}">${s.h}</sup>` : ""}</span>`,
        )
        .join("");
      return `<div class="zc${p.isMing ? " ming" : ""}" data-b="${p.b}" style="grid-area:${r}/${c};--i:${i}"><div class="zh"><span>${GAN[p.stem]}${ZHI[p.b]}</span><span>${p.isShen ? "身" : ""}</span></div><div class="zn">${p.name}</div><div class="zs2">${st}</div><div class="zf"><span>${p.cs}</span><span>${p.dx[0]}–${p.dx[1]}</span></div></div>`;
    })
    .join("");
  const l = R.lunar,
    y0 = ziYear || nowBJ().y;
  return `<div class="panel blk"><div class="zgrid" id="zgrid">${cells}<div class="zctr"><div class="big">${z.juName}</div><div>${lunarText(l)}</div><div class="dim">命宫在 <b class="gold">${ZHI[z.ming]}</b> · 身宫在 <b class="gold">${ZHI[z.shen]}</b> · 紫微居 <b class="gold">${ZHI[z.z]}</b></div><div class="dim">命主 <b class="gold">${z.mingStar}</b> · 身主 <b class="gold">${z.shenStar}</b> · 命宫纳音 ${z.nyName}</div><div class="dim">大限${z.fwd ? "顺" : "逆"}行 · 生年四化 ${z.sihua.join(" ")}</div>${tjLifeDaysMeta(R, "ziwei")}<div class="dim sm">点选任一宫,高亮其三方四正</div></div></div>
  <p class="note">宫内:上行天干地支与“身”;中部星曜(右上角上标为亮度:庙旺得利平不陷;禄权科忌为生年四化);底行左为长生十二神,右为大限起止岁数。星曜有主星 14、六吉(左辅右弼文昌文曲天魁天钺)、禄存天马、六煞(擎羊陀罗火星铃星地空地劫)。主星、辅佐煞曜的落宫、亮度、长生十二神、大限、命主身主、38 颗杂曜与三个十二神、小限,均已与开源实现 iztro 逐盘对拍一致(盘面只显示主星与六吉六煞禄马,杂曜与十二神在下方“命盘解读”中列出)。飞星四化见下方“宫位飞化”。年干以农历年(正月初一)为界,闰月按十五日前后分属本月与下月,均为常见但非唯一的排法;晚 23 点起的“晚子时”未作特殊处理。</p></div>
  <div class="panel blk"><div class="yrctl"><label>起始流年 <input type="number" id="ziYear" min="1902" max="2098" value="${y0}"></label></div><h3 class="sec">流年命宫与流年四化</h3><div id="ziBox">${ziweiYearsHTML(R, y0)}</div><p class="note">流年命宫取该年地支所在之宫;流年四化按流年天干起,并标出四化星在本命盘所落之宫。这是最基础的“流年飞化”演示。</p></div>
  ${ziReadHTML(R)}`;
}
let ziYear = 0;
function bindZiwei() {
  const g = $("#zgrid");
  if (!g) return;
  const clear = () => $$(".zc", g).forEach((z) => z.classList.remove("sel", "san"));
  $$(".zc", g).forEach(
    (z) =>
      (z.onclick = () => {
        const b = +z.dataset.b,
          was = z.classList.contains("sel");
        clear();
        if (was) return;
        z.classList.add("sel");
        R.zw
          .san(b)
          .slice(1)
          .forEach((x) => $(`.zc[data-b="${x}"]`, g).classList.add("san"));
      }),
  );
  const y = $("#ziYear");
  if (y)
    y.onchange = () => {
      const v = parseInt(y.value);
      if (!v) return;
      ziYear = Math.max(1902, Math.min(2098, v));
      $("#ziBox").innerHTML = ziweiYearsHTML(R, ziYear);
    };
}

/* ---- 玄空飞星 ---- */
const XK_MTN_ALL = [
  "壬",
  "子",
  "癸",
  "丑",
  "艮",
  "寅",
  "甲",
  "卯",
  "乙",
  "辰",
  "巽",
  "巳",
  "丙",
  "午",
  "丁",
  "未",
  "坤",
  "申",
  "庚",
  "酉",
  "辛",
  "戌",
  "乾",
  "亥",
];
let XKS = { zuo: "子", build: 0, flow: 0 };
const XK_GRID = [4, 9, 2, 3, 5, 7, 8, 1, 6];
function xkYunBand(y) {
  const n = xkYuan(y),
    y0 = 1864 + Math.floor((y - 1864) / 180) * 180 + (n - 1) * 20;
  return [y0, y0 + 19];
}
function xkHTML(R) {
  const by = XKS.build || nowBJ().y,
    fy = XKS.flow || nowBJ().y,
    yun = xkYuan(by),
    band = xkYunBand(by);
  const X = xuankong(XKS.zuo, yun),
    ys = xkYearStar(fy),
    yf = xkFly(ys, true),
    yz = (((fy - 4) % 12) + 12) % 12;
  const ms = [...Array(12)].map((_, i) => xkMonthStar(yz, i));
  const cell = (p) => {
    if (!p) return "";
    const c = X.cells[p],
      isZ = p === X.zPal,
      isX = p === X.xPal,
      star = yf[p];
    const q = xkQi(c.shan, yun),
      q2 = xkQi(c.xiang, yun);
    return `<div class="xkc${isZ ? " zuo" : ""}${isX ? " xiang" : ""}"><div class="xh"><span>${XK_PAL_NAME[p]}${PNUM[p]} · ${XK_PAL_DIR[p]}</span><span>${isZ ? "坐" : isX ? "向" : ""}</span></div><div class="xnums"><span class="xs shan ${q === "当旺" ? "wang" : q === "生气" ? "sheng" : ""}" title="山星 ${c.shan}:${q}">${c.shan}</span><span class="xs yun" title="运星">${c.yun}</span><span class="xs xiang ${q2 === "当旺" ? "wang" : q2 === "生气" ? "sheng" : ""}" title="向星 ${c.xiang}:${q2}">${c.xiang}</span></div><div class="xy ${XK_STAR_INFO[star].t === "吉" ? "good" : XK_STAR_INFO[star].t === "平" ? "mid" : "bad"}" title="${XK_STAR_INFO[star].n}:${XK_STAR_INFO[star].d}">${fy}年 ${NUMC[star]}</div></div>`;
  };
  const grid = XK_GRID.map(cell).join("");
  const notes = X.notes
    .map(
      (n) =>
        `<span class="pill ${n.t === "吉" ? "g" : n.t === "凶" ? "r" : ""}" title="${n.d}">${n.n}</span>`,
    )
    .join("");
  const s5 = [];
  for (let p = 1; p <= 9; p++) {
    if (yf[p] === 5) s5.push(p);
  }
  const mrow = ms
    .map(
      (s, i) =>
        `<div class="mcell ${XK_STAR_INFO[s].t === "吉" ? "good" : XK_STAR_INFO[s].t === "平" ? "mid" : "bad"}"><b>${NUMC[s]}</b><small>${JIE[i]}月</small><small>${XK_STAR_INFO[s].n.slice(2)}</small></div>`,
    )
    .join("");
  return `<div class="kv"><span>坐山 <b class="gold">${X.zuo}</b> 向 <b class="gold">${X.xiang}</b>(${XK_PAL_NAME[X.zPal]}宫坐 ${XK_PAL_NAME[X.xPal]}宫向)</span><span>元运 <b>${NUMC[yun]}运</b>(${band[0]}—${band[1]})</span><span>山星${X.zDir ? "顺" : "逆"}飞 · 向星${X.xDir ? "顺" : "逆"}飞</span></div>
  <div class="pills" style="margin:10px 0">${notes || '<span class="dim">未见特殊格局</span>'}</div>
  <div class="xkgrid">${grid}</div>
  <p class="note">每宫三数:左为山星、中为运星、右为向星;金色边框为坐宫,青色边框为向宫;山/向星底色标出当旺(与元运同数)与生气(将入运之星)。底行为 ${fy} 年流年紫白(${NUMC[ys]}入中,五黄在${s5.map((p) => XK_PAL_NAME[p]).join("")}宫)。</p>
  <h3 class="sec" style="margin-top:12px">${fy}年 流月紫白(中宫飞星)</h3><div class="mgrid">${mrow}</div>`;
}
function renderXuankong(R) {
  const by = XKS.build || nowBJ().y,
    fy = XKS.flow || nowBJ().y;
  return `<div class="panel blk"><h3 class="sec">玄空飞星 · 宅盘</h3>
  <div class="xkctl"><label>坐山<select id="xkZuo">${XK_MTN_ALL.map((m) => `<option${m === XKS.zuo ? " selected" : ""}>${m}</option>`).join("")}</select></label><label>建造/入住年<input type="number" id="xkBuild" value="${by}" min="1864" max="2100"></label><label>看哪一年流年<input type="number" id="xkFlow" value="${fy}" min="1902" max="2098"></label></div>
  <div id="xkBox">${xkHTML(R)}</div></div>
  <div class="panel blk"><h3 class="sec">宅盘解读</h3><div id="xkRead">${xkReadHTML(R)}</div></div>
  <div class="panel blk"><p class="note" style="margin:0">采用挨星法(不含替卦、兼向)。三元九运以 1864 年为上元起点、每运 20 年,现处九运(2024–2043);山向阴阳与飞行顺逆经公开的八运/九运山向表反推校验:八运旺山旺向 6 局、双星会向 6 局,九运双星会向 12 局,七运子山午向全盘合十,五运 12 局上山下水等结论均与之一致。流年紫白取立春为界:2026 为一白入中。玄空重在“形与理”结合,盘面只是起点,此处仅演示排盘算法。</p></div>`;
}
function bindXuankong() {
  const upd = () => {
    XKS.zuo = $("#xkZuo").value;
    XKS.build = parseInt($("#xkBuild").value) || 0;
    XKS.flow = parseInt($("#xkFlow").value) || 0;
    $("#xkBox").innerHTML = xkHTML(R);
    $("#xkRead").innerHTML = xkReadHTML(R);
  };
  ["xkZuo", "xkBuild", "xkFlow"].forEach((id) => {
    const e = $("#" + id);
    if (e) e.onchange = upd;
  });
}

/* ---- 择日 ---- */
let ZRS = { ev: "嫁娶", start: "", days: 45, birth: -2, sel: 0 };
const ZR_TIER = ["忌", "慎", "平", "宜", "吉"];
function zrBirthZ(R) {
  return ZRS.birth === -2 ? R.bz.pill[0].b : ZRS.birth;
}
function zrCompute(R) {
  const c = R.t.civ,
    st = ZRS.start || `${c.y}-${f2(c.m)}-${f2(c.d)}`,
    [y, m, d] = st.split("-").map(Number);
  const birthZ = ZRS.birth === -2 ? R.bz.pill[0].b : ZRS.birth;
  return zeriRange(y, m, d, ZRS.days, ZRS.ev, birthZ);
}
function zrHours(i) {
  const hs = hoursOfDay(i.y, i.m, i.d),
    bz = R && R.bz ? R.bz.pill[0].b : -1;
  return `<div class="hrgrid">${hs.map((h) => `<div class="hr ${h.huang ? "hd" : "hk"}${bz >= 0 && h.chongZ === bz ? " cx" : ""}" title="${esc("宜:" + (h.yi.join("、") || "—") + "\n忌:" + (h.ji.join("、") || "—"))}"><b>${ZHI[h.b]}时</b><small>${h.span}</small><span>${h.gz}</span><em>${h.ts}</em>${bz >= 0 && h.chongZ === bz ? "<i>冲命</i>" : ""}</div>`).join("")}</div><div class="dim sm">十二时辰黄黑道(悬停看宜忌)。绿色为黄道时,红色为黑道时;“冲命”表示该时辰与你的生肖相冲。</div>`;
}
function zrDetail(x) {
  const i = x.info;
  return `<div class="zdet"><div class="kv"><span><b>${i.y}-${f2(i.m)}-${f2(i.d)}</b> 周${"日一二三四五六"[i.week]}</span><span>农历 ${LM[i.lunar.month - 1]}月${LD[i.lunar.day - 1]}</span><span>日柱 <b>${i.gz}</b>(${i.nayin})</span><span>建除 <b class="${LVC(i.zxTone)}">${i.zx}</b></span><span>宿 <b>${i.xiu}</b></span><span>天神 <b class="${i.huang ? "good" : "bad"}">${i.ts}</b></span><span>冲 <b>${i.chong}</b> 煞${i.sha}</span></div>
  <div class="yj"><div><span class="yl">宜</span>${chipList(i.yi, "g") || '<span class="dim">诸事不宜</span>'}</div><div><span class="yl j">忌</span>${chipList(i.ji, "r") || '<span class="dim">—</span>'}</div></div>
  <div class="yj"><div><span class="yl s">吉神</span>${chipList(i.js.slice(0, 10), "") || '<span class="dim">—</span>'}</div><div><span class="yl j">凶煞</span>${chipList(i.xs.slice(0, 10), "r") || '<span class="dim">—</span>'}</div></div>
  <div class="dim sm" style="margin-top:6px">评分依据:${x.why.join(";")} ⇒ <b>${x.sc.toFixed(1)}</b></div><h4 class="gl">择时:当日十二时辰</h4>${zrHours(i)}${zrBestHoursHTML(i)}<div class="row3" style="margin-top:8px"><button class="gbtn sm" data-cal="${i.y}-${i.m}-${i.d}">在万年历中打开此日</button><button class="gbtn sm" data-fav="${i.y}-${i.m}-${i.d}">★ 收藏为备选日</button></div></div>`;
}
function zrHTML(R) {
  const arr = zrCompute(R);
  const first = arr[0].info.week;
  const cells = [];
  for (let i = 0; i < first; i++) cells.push('<div class="zd empty"></div>');
  arr.forEach((x, i) => {
    const t = zrTierOf(x, ZRS.ev, zrBirthZ(R));
    cells.push(
      `<button class="zd t${t}${i === ZRS.sel ? " on" : ""}" data-i="${i}" title="${ZR_TIER[t]}"><b>${x.info.m}/${x.info.d}</b><small>${x.info.zx}·${x.info.ts}</small><em>${ZR_TIER[t]}</em></button>`,
    );
  });
  const top = arr
    .map((x, i) => ({ x, i }))
    .sort((a, b) => b.x.sc - a.x.sc)
    .slice(0, 6)
    .map(
      ({ x, i }) =>
        `<button class="topd" data-i="${i}"><b>${x.info.m}/${x.info.d}</b> 周${"日一二三四五六"[x.info.week]} <span class="wx${GAN_WX[x.info.dayIdx % 10]}">${x.info.gz}</span> ${x.info.zx}日<small>${x.sc.toFixed(1)}</small></button>`,
    )
    .join("");
  return `<div class="kv"><span>事项 <b>${ZRS.ev}</b>(${ZERI_EVENTS[ZRS.ev].desc})</span><span>共 ${arr.length} 日</span><span class="dim">分档按该事项 4 年基准期分位:吉≈前10%、宜≈前30%、慎≈后30%、忌≈后15%</span></div><div class="topl"><span class="lab">较优前列</span>${top}</div><div class="zweek"><span>日</span><span>一</span><span>二</span><span>三</span><span>四</span><span>五</span><span>六</span></div><div class="zcal" id="zcal">${cells.join("")}</div><div id="zdetail">${zrDetail(arr[Math.min(ZRS.sel, arr.length - 1)])}</div>`;
}
function renderZeri(R) {
  const c = R.t.civ,
    st = ZRS.start || `${c.y}-${f2(c.m)}-${f2(c.d)}`;
  const dayUnit = [30, 45, 60, 90];
  return `<div class="panel blk"><h3 class="sec">择日 · 按事项选日</h3>
  <div class="xkctl"><label>事项<select id="zrEv">${Object.keys(ZERI_EVENTS)
    .map((k) => `<option${k === ZRS.ev ? " selected" : ""}>${k}</option>`)
    .join(
      "",
    )}</select></label><label>起始日<input type="date" id="zrStart" value="${st}" min="1901-01-01" max="2099-12-31"></label><label>天数<select id="zrDays">${dayUnit.map((d) => `<option value="${d}"${d === ZRS.days ? " selected" : ""}>${d} 天</option>`).join("")}</select></label><label>当事人生肖<select id="zrBirth"><option value="-2"${ZRS.birth === -2 ? " selected" : ""}>取当前命盘(${ZODIAC[R.bz.pill[0].b]})</option><option value="-1"${ZRS.birth === -1 ? " selected" : ""}>不考虑</option>${ZODIAC.map((z, i) => `<option value="${i}"${ZRS.birth === i ? " selected" : ""}>${z}</option>`).join("")}</select></label></div>
  <div class="row3" style="margin:4px 0 8px"><button class="gbtn sm" id="zrToCal">在万年历中按月查看 →</button><span class="dim sm">万年历按月显示同一事项与生肖的评分、节日、神诞和择日榜,可与此处互相跳转、共用设置。</span></div>
  <div id="zrBox">${zrHTML(R)}</div></div>
  <div class="panel blk"><p class="note" style="margin:0">每日的建除十二值星、二十八宿、黄黑道十二天神、冲煞、吉神凶煞、宜忌均取自传统历书体系(数据与开源历法库逐日对拍,1902–2099 年约 2.4 万天零差异)。“较优”评分是本页自定的机械加减:该事项的宜忌命中、黄道加分、建除吉凶、月破、冲本命生肖、合本命、天德月德等吉神与月破大耗等凶煞。它是辅助筛选,不等于“黄道吉日”的官方定论;重大事项传统上还需结合当事人八字、时辰与方位。</p></div>`;
}
function bindZeri() {
  const re = () => {
    $("#zrBox").innerHTML = zrHTML(R);
    bindZeriGrid();
  };
  $("#zrEv").onchange = (e) => {
    ZRS.ev = e.target.value;
    ZRS.sel = 0;
    re();
  };
  $("#zrStart").onchange = (e) => {
    if (e.target.value) {
      ZRS.start = e.target.value;
      ZRS.sel = 0;
      re();
    }
  };
  $("#zrDays").onchange = (e) => {
    ZRS.days = +e.target.value;
    ZRS.sel = 0;
    re();
  };
  $("#zrBirth").onchange = (e) => {
    ZRS.birth = +e.target.value;
    re();
  };
  const tc = $("#zrToCal");
  if (tc)
    tc.onclick = () => {
      const c = R.t.civ,
        st = ZRS.start || `${c.y}-${f2(c.m)}-${f2(c.d)}`,
        [yy, mm, dd] = st.split("-").map(Number);
      calOpenFromZeri({ y: yy, m: mm, d: dd }, ZRS.ev);
    };
  const pn = $("#pane-zeri");
  if (pn)
    pn.onclick = (e) => {
      const b = e.target.closest("[data-cal],[data-fav]");
      if (!b) return;
      if (b.dataset.cal) {
        const [yy, mm, dd] = b.dataset.cal.split("-").map(Number);
        calOpenFromZeri({ y: yy, m: mm, d: dd }, ZRS.ev);
      } else {
        const [yy, mm, dd] = b.dataset.fav.split("-").map(Number),
          a = calMineLoad(),
          nm = "备选·" + ZRS.ev;
        if (!a.some((x) => x.t === "O" && x.y === yy && x.m === mm && x.d === dd && x.n === nm))
          a.push({ n: nm, t: "O", y: yy, m: mm, d: dd });
        calMineSave(a);
        toast("已收藏为备选日,可在万年历的“我的日子”里对比");
      }
    };
  bindZeriGrid();
}
function zrBestHoursHTML(i) {
  const bz = zrBirthZ(R),
    bh = zrBestHours(i.y, i.m, i.d, ZRS.ev, bz).slice(0, 3);
  return `<div class="dim sm" style="margin-top:6px">「${ZRS.ev}」较优时辰(机械评分:黄黑道、时宜忌、冲本命):${bh.map((h) => `<b>${ZHI[h.b]}时</b>(${h.span},${h.gz})`).join("、")}</div>`;
}
function bindZeriGrid() {
  const pick = (i) => {
    ZRS.sel = i;
    const arr = zrCompute(R);
    $$(".zd").forEach((b) => b.classList.toggle("on", +b.dataset.i === i));
    $("#zdetail").innerHTML = zrDetail(arr[i]);
  };
  $$(".zd:not(.empty),.topd").forEach((b) => (b.onclick = () => pick(+b.dataset.i)));
}

/* ---- 合盘 ---- */
let HPS = { dt: "1995-06-15T12:00", gender: "0", out: null };
function hpHTML(R) {
  const m = (HPS.dt || "").match(/^(\d{4})-(\d\d)-(\d\d)T(\d\d):(\d\d)/);
  if (!m) return '<p class="note">请填写乙方的出生时间。</p>';
  const civ = { y: +m[1], m: +m[2], d: +m[3], h: +m[4], mi: +m[5], s: 0 };
  if (civ.y < 1901 || civ.y > 2099) return '<p class="note">乙方年份需在 1901–2099。</p>';
  const RB = computeAll(civ, {
    gender: HPS.gender === "1" ? "M" : "F",
    solar: false,
    lon: R.opt.lon,
  });
  RB.deep = baziDeep(RB.bz);
  const res = hepan(R.bz, RB.bz, R.deep, RB.deep);
  const pl = (bz, D, who) =>
    `<div class="hpc"><div class="ph">${who}</div><div class="hpp">${bz.pill.map((p, i) => `<span class="${i === 2 ? "dmk" : ""}"><b class="wx${GAN_WX[p.s]}">${GAN[p.s]}</b><b class="wx${ZHI_WX[p.b]}">${ZHI[p.b]}</b></span>`).join("")}</div><div class="dim sm">日主${GAN[bz.dm]}${WXK[GAN_WX[bz.dm]]} · ${D.st.level} · 取用${D.xy.favor.map((x) => WXK[x]).join("")}</div></div>`;
  const rows = res.lines
    .map(
      (l) =>
        `<li class="${l.t === "吉" ? "gd" : l.t === "凶" ? "bd" : ""}"><span class="d">${l.d ? (l.d > 0 ? "+" : "") + l.d : "·"}</span>${l.txt}</li>`,
    )
    .join("");
  return `<div class="hpwrap">${pl(R.bz, R.deep, "甲方(当前命盘)")}${pl(RB.bz, RB.deep, "乙方")}</div><div class="hpscore"><div class="meter big"><i style="left:${res.score}%"></i><span>差异</span><span>一般</span><span>契合</span></div><div class="kv"><span>契合度 <b class="gold">${res.score}</b></span><span>评语 <b>${res.lv}</b></span></div></div><ul class="hplist">${rows}</ul>`;
}
function renderHepan(R) {
  return `<div class="panel blk"><h3 class="sec">八字合盘</h3>
  <div class="xkctl"><label>乙方出生时间(北京时间)<input type="datetime-local" id="hpDt" value="${HPS.dt}" min="1901-01-01T00:00" max="2099-12-31T23:59"></label><label>乙方性别<select id="hpG"><option value="0"${HPS.gender === "0" ? " selected" : ""}>坤造(女)</option><option value="1"${HPS.gender === "1" ? " selected" : ""}>乾造(男)</option></select></label></div>
  <div id="hpBox">${hpHTML(R)}</div></div>
  <div class="panel blk"><p class="note" style="margin:0">甲方为顶部当前命盘。比较项:日干合克、日支(配偶宫)六合/三合/冲害刑、生肖合冲、双方取用五行在对方八字中的占比。分值起于 50,逐项加减,仅表达“结构上的互补或冲突”,不能替代对两个人的了解;合婚传统上还有纳音、大运同步等多维度,此处未展开。</p></div>`;
}
function bindHepan() {
  const upd = () => {
    HPS.dt = $("#hpDt").value;
    HPS.gender = $("#hpG").value;
    $("#hpBox").innerHTML = hpHTML(R);
  };
  $("#hpDt").onchange = upd;
  $("#hpG").onchange = upd;
}

/* ================= 通用解读渲染 ================= */
function rdText(t) {
  return esc(t).replace(/\n/g, "<br>");
}
function readingHTML(rd, opts) {
  opts = opts || {};
  const sum =
    rd.summary && rd.summary.length
      ? `<div class="rd-sum">${rd.summary.map((s) => `<div class="rs ${s.tone || "mid"}">${esc(s.text)}</div>`).join("")}</div>`
      : "";
  const secs = rd.sections
    .map((sc) => {
      const items = sc.items
        .map(
          (it) =>
            `<div class="ri ${it.tone || ""}"><div class="rk"><b>${esc(it.k)}</b>${it.badge ? `<em>${esc(it.badge)}</em>` : ""}</div><div class="rt">${rdText(it.t)}</div>${it.basis ? `<div class="rb">依据:${esc(it.basis)}</div>` : ""}</div>`,
        )
        .join("");
      const note = sc.note ? `<p class="note">${esc(sc.note)}</p>` : "";
      return sc.collapse
        ? `<details class="rsec"><summary>${esc(sc.title)}<span class="cnt">${sc.items.length}</span></summary>${items}${note}</details>`
        : `<div class="rsec"><h4>${esc(sc.title)}</h4>${items}${note}</div>`;
    })
    .join("");
  return `${sum}${secs}${opts.foot ? `<p class="note">${opts.foot}</p>` : ""}`;
}
const RD_FOOT =
  "解读由规则引擎按传统章法生成,是“结构性倾向”的描述,不是命运断语;各流派取法不同。遇到重大决定,请以现实条件与专业意见为准。";
function topicBar(id, topics, cur) {
  return `<div class="asks" id="${id}">${Object.keys(topics)
    .map(
      (k) =>
        `<button class="gbtn sm${k === cur ? " on" : ""}" data-topic="${k}">${topics[k].icon || ""} ${k}</button>`,
    )
    .join("")}</div>`;
}

/* ================= 天象页 ================= */
function orreryHTML(R) {
  const H = R.astro.helio,
    W = 420,
    c = W / 2,
    f = (r) => 28 + (Math.log10(r) + 0.5) * 68;
  const orb = H.map(
    (p) => `<circle cx="${c}" cy="${c}" r="${f(p.r).toFixed(1)}" class="orb"/>`,
  ).join("");
  const pls = H.map((p) => {
    const a = (p.lon * Math.PI) / 180,
      r = f(p.r),
      x = c + r * Math.cos(a),
      y = c - r * Math.sin(a);
    const info = {
      水星: ["☿", "var(--water)"],
      金星: ["♀", "var(--metal)"],
      地球: ["⊕", "var(--good)"],
      火星: ["♂", "var(--fire)"],
      木星: ["♃", "var(--wood)"],
      土星: ["♄", "var(--earth)"],
      天王星: ["♅", "var(--cyan)"],
      海王星: ["♆", "var(--water)"],
      冥王星: ["♇", "var(--dim)"],
    }[p.n];
    return `<g><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${p.n === "地球" ? 5.5 : 4}" fill="${info[1]}" class="orp"/><text x="${(x + 7).toFixed(1)}" y="${(y - 6).toFixed(1)}" class="ort">${info[0]}\uFE0E ${p.n}</text></g>`;
  }).join("");
  const e = H.find((p) => p.n === "地球"),
    ea = (e.lon * Math.PI) / 180;
  return `<svg viewBox="0 0 ${W} ${W}" class="orrery" role="img" aria-label="太阳系俯视图"><rect width="${W}" height="${W}" class="orbg"/>${orb}<line x1="${c}" y1="${c}" x2="${c + 190}" y2="${c}" class="oraxis"/><text x="${c + 192}" y="${c - 4}" class="ort" text-anchor="end">春分点 ♈︎</text><circle cx="${c}" cy="${c}" r="9" class="orsun"/>${pls}<line x1="${c}" y1="${c}" x2="${(c + (f(1) + 14) * Math.cos(ea)).toFixed(1)}" y2="${(c - (f(1) + 14) * Math.sin(ea)).toFixed(1)}" class="orlos"/></svg>`;
}
const AS_MEAN = {
  太阳: "自我与生命力",
  月亮: "情感与本能",
  水星: "思维与沟通",
  金星: "情感与价值",
  火星: "行动与欲望",
  木星: "扩张与机遇",
  土星: "责任与限制",
  天王星: "变革与突破",
  海王星: "想象与迷雾",
  冥王星: "深层转化",
};
const AS_TXT7 = {
  太阳: "日(太阳)",
  月亮: "月(太阴)",
  水星: "辰星(水)",
  金星: "太白(金)",
  火星: "荧惑(火)",
  木星: "岁星(木)",
  土星: "镇星(土)",
};
function astroHTML(R) {
  const A = R.astro,
    pl = A.planets,
    yr = R.t.civ.y,
    q = A.yq,
    mp = A.moon,
    ang = A.angles,
    bz = R.bz;
  const xs = xiuOf(pl[0].lon, yr),
    xm = xiuOf(pl[1].lon, yr),
    di = dayInfo(R.t.civ.y, R.t.civ.m, R.t.civ.d);
  const sgn = (x) => AS_SIGN[Math.floor(x / 30)],
    dg = (x) => Math.floor(x % 30) + "°" + f2(Math.floor((x % 1) * 60)) + "′";
  const nowB = bz.pill[3].b,
    lz = ZW_LZ[nowB],
    mb = bz.pill[1].b;
  // 综合此刻
  const uni = `太阳行至<b>${sgn(pl[0].lon)[0]}</b>${dg(pl[0].lon % 30)},入<b>${xs.full || xs.n}宿</b>(${xs.si});节气<b>${TERMS[Math.floor(R.t.lon / 15) % 24]}</b>后;月建<b>${ZHI[mb]}</b>(${WXN[ZHI_WX[mb]]}当令);${q.gz}年<b>${LQ_ZHU[q.step]}</b>主气、<b>${q.guest[q.step]}</b>客气;当前时辰<b>${ZHI[nowB]}时</b>属<b>${lz[2]}</b>;月相<b>${mp.name}</b>。`;
  const rows = pl
    .map(
      (p) =>
        `<tr><td><span class="pgl">${p.g}\uFE0E</span> ${p.n}<small class="dim"> ${AS_TXT7[p.n] || p.zh}</small></td><td class="num">${p.lon.toFixed(2)}°</td><td>${p.sign[1]}\uFE0E ${p.sign[0]} ${dg(p.lon % 30)}<small class="dim"> ${p.sign[2]}</small></td><td>${xiuOf(p.lon, yr).n}宿</td><td>${p.retro ? '<span class="bad">逆行 ℞</span>' : '<span class="dim">顺行</span>'}</td><td class="dim sm">${AS_MEAN[p.n]}</td></tr>`,
    )
    .join("");
  const asp = A.aspects.length
    ? A.aspects
        .sort((a, b) => a.orb - b.orb)
        .map(
          (a) =>
            `<span class="pill ${a.t === "和" ? "g" : a.t === "冲" ? "r" : "c"}">${AS_INFO[a.a].g}\uFE0E ${a.sym} ${AS_INFO[a.b].g}\uFE0E <small>${a.a}${a.name}${a.b} 容许 ${a.orb.toFixed(1)}°</small></span>`,
        )
        .join("")
    : '<span class="dim">此刻无紧密相位</span>';
  const hs = A.angles.houses
    .map((h, i) => `<span class="pill">${i + 1}宫 ${sgn(h)[1]}\uFE0E${sgn(h)[0]}</span>`)
    .join("");
  const lqRows = [0, 1, 2, 3, 4, 5]
    .map(
      (s) =>
        `<tr class="${s === q.step ? "now" : ""}"><td>${["初", "二", "三", "四", "五", "终"][s]}之气<small class="dim"> ${LQ_TERMS[s]}</small></td><td>${LQ_ZHU[s]}</td><td>${q.guest[s]}${s === 2 ? '<b class="gold"> 司天</b>' : s === 5 ? '<b class="gold"> 在泉</b>' : ""}</td></tr>`,
    )
    .join("");
  const yunRows = q.yunSteps
    .map(
      (y, i) =>
        `<span class="pill ${i === q.yunStep ? "g" : ""}">${["初", "二", "三", "四", "终"][i]}运 主${y.zhu}·客${y.ke}</span>`,
    )
    .join("");
  const lzRows = ZW_LZ.map(
    (z, i) =>
      `<tr class="${i === nowB ? "now" : ""}"><td>${z[0]}时<small class="dim"> ${["23–1", "1–3", "3–5", "5–7", "7–9", "9–11", "11–13", "13–15", "15–17", "17–19", "19–21", "21–23"][i]}</small></td><td class="wx${z[4]}">${z[2]}</td><td>${z[3]}</td><td class="dim sm">${z[5]}</td></tr>`,
  ).join("");
  const idxs = bz.pill.map((p) => ganzhiIdx(p.s, p.b));
  const jz = idxs
    .map(
      (x, i) =>
        `<span class="pill">${["年", "月", "日", "时"][i]}柱 ${gz(x)}<small>第${x + 1}位 · ${NAYIN[x >> 1]}</small></span>`,
    )
    .join("");
  // 五行当令
  const wxNow = WXN.map((w, i) => {
    const s = RM_SEASON(i, mb);
    return `<span class="pill ${s[1] >= 0.7 ? "g" : s[1] <= -0.6 ? "r" : ""} wx${i}">${w}<small>${s[0]}</small></span>`;
  }).join("");
  const yy = R.t.lon >= 270 || R.t.lon < 90 ? "阳长阴消(冬至→夏至)" : "阴长阳消(夏至→冬至)";
  const dayYY = R.bz.dm % 2 === 0 ? "阳" : "阴";
  return `<div class="panel blk"><h3 class="sec">此刻天象 · 综合</h3><p class="unl">${uni}</p>
    <div class="kv"><span>月相 <b>${mp.name}</b>(月龄 ${mp.age.toFixed(1)} 天,受光 ${(mp.lit * 100).toFixed(0)}%)</span><span>月入 <b>${xm.n}宿</b></span><span>日值宿 <b>${di.xiu}</b></span><span>上升 <b>${sgn(ang.asc)[0]} ${dg(ang.asc % 30)}</b></span><span>中天 <b>${sgn(ang.mc)[0]} ${dg(ang.mc % 30)}</b></span></div>
    <p class="note">上升/中天按经度 ${R.opt.lon}°E、纬度 ${R.opt.lat}°N 计算(等宫制)。行星位置用 JPL 近似根数(与天文历库对拍,主要行星偏差通常 &lt;0.05°,土星最大约 0.35°),月球取主要周期项,均为示意精度。二十八宿取古度距度示意,与真实距星有出入。</p></div>
  <div class="panel blk"><h3 class="sec">行星 · 黄道十二宫 · 二十八宿</h3><div class="tbl-wrap"><table class="tbl"><thead><tr><th>星体</th><th>黄经</th><th>星座(十二次)</th><th>入宿</th><th>状态</th><th>象义</th></tr></thead><tbody>${rows}</tbody></table></div>
    <h3 class="sec" style="margin-top:14px">相位</h3><div class="pills">${asp}</div>
    <h3 class="sec" style="margin-top:14px">十二宫位(等宫制,自上升点起)</h3><div class="pills">${hs}</div></div>
  <div class="panel blk"><h3 class="sec">五运六气 · ${q.gz}年</h3>
    <div class="kv"><span>岁运 <b class="gold">${q.yunName}</b></span><span>司天 <b>${q.siTian}</b></span><span>在泉 <b>${q.zaiQuan}</b></span><span>当前 <b>${["初", "二", "三", "四", "五", "终"][q.step]}之气</b>(主气 ${LQ_ZHU[q.step]} · 客气 ${q.guest[q.step]})</span></div>
    <div class="tbl-wrap"><table class="tbl"><thead><tr><th>六步</th><th>主气(固定)</th><th>客气(逐年)</th></tr></thead><tbody>${lqRows}</tbody></table></div>
    <div class="pills" style="margin-top:10px">${yunRows}</div>
    <ul class="mini"><li>当前主气:${q.zhuTip}</li><li>当前客气:${q.tip}</li></ul>
    <p class="note">五运六气以“年干定岁运、年支定司天在泉”,再分六步(主气固定、客气随年推移)与五运(主运固定、客运由岁运起)。这里只给出气运格局与传统养生提示,不用于预测疫病或天气。</p></div>
  <div class="panel blk"><h3 class="sec">子午流注 · 纳支法</h3><div class="tbl-wrap"><table class="tbl"><thead><tr><th>时辰</th><th>经脉</th><th>阴阳</th><th>养生提示</th></tr></thead><tbody>${lzRows}</tbody></table></div>
    <p class="note">纳支法:十二时辰各主一条经脉的气血旺盛。此刻${ZHI[nowB]}时 ${lz[2]}当令。养生提示为传统经验的一般性说法,不是医疗建议。</p></div>
  <div class="panel blk"><h3 class="sec">干支 · 生肖 · 阴阳五行</h3>
    <div class="kv"><span>年生肖 <b>${ZODIAC12[bz.pill[0].b]}</b></span><span>日主阴阳 <b>${dayYY}</b></span><span>节令气机 <b>${yy}</b></span></div>
    <div class="pills" style="margin:8px 0">${jz}</div>
    <div><span class="lab">${ZHI[mb]}月令下五行</span> ${wxNow}</div>
    <p class="note">六十甲子环上标出了四柱所在位置(盘面“干支”层)。五行当令:与月令同气者旺,月令所生者相,生月令者休,克月令者囚,被月令克者死。五行相生:木→火→土→金→水→木;相克:木→土→水→火→金→木。</p></div>`;
}
function renderAstro(R) {
  return astroHTML(R);
}

/* ================= 个人指南页 ================= */
function renderGuide(R) {
  const g = guideReading(R, nowBJ().y);
  g.sections.splice(
    Math.max(
      0,
      g.sections.findIndex((x) => x.title.startsWith("化解")),
    ) + 1,
    0,
    bazhaiSection(R),
  );
  return `${aiCardHTML()}<div class="panel blk guide-v66"><div class="guide-v66-head"><h3 class="sec">个人指南</h3><div class="guide-v66-sub">优势 · 短板 · 补益 · 化解 · 未来</div></div><p class="note" style="margin-top:0">依据当前命盘(八字为主、紫微为辅)生成。若要看自己的指南,请在上方把起局时间改为<b>出生时间</b>并选好性别。</p>${readingHTML(g, { foot: RD_FOOT })}</div>`;
}

/* ================= 解读:状态与绑定 ================= */
let qmTopic = "求财",
  lrTopic = "综合",
  lyTopic = "求财",
  mhTopic = "求财";
function bzReadHTML(R) {
  return `<div class="panel blk"><h3 class="sec">命局解读 · 深度分析</h3>${readingHTML(bzReading(R.bz, R.deep, R.opt.gender, R.lunar, nowBJ().y), { foot: RD_FOOT })}</div>`;
}
function ziReadHTML(R) {
  const rd = ziweiReading(R.zw, R.lunar, R.opt.gender, nowBJ().y);
  const ex = ziweiExtra(R.zw, R.lunar, R.opt.gender, nowBJ().y);
  const at =
    Math.max(
      0,
      rd.sections.findIndex((s) => s.title.startsWith("十二宫")),
    ) + 1;
  rd.sections.splice(at, 0, ...ex);
  return `<div class="panel blk"><h3 class="sec">命盘解读 · 全面</h3>${readingHTML(rd, { foot: RD_FOOT })}</div>`;
}
function lrReadHTML(R) {
  return `<div class="panel blk"><h3 class="sec">问事解读</h3>${topicBar("lrTopics", LR_TOPIC, lrTopic)}<div id="lrRead">${readingHTML(liurenReading(R, lrTopic), { foot: RD_FOOT })}</div></div>`;
}
function lyRowsNow(R) {
  const { lines, moving } = lyLinesFrom(R);
  return liuyao(lines, moving, R.bz.dayIdx, R.bz.pill[1].b);
}
function lyReadInner(R) {
  const L = lyRowsNow(R),
    rd = liuyaoReading(L, R, lyTopic),
    ex = liuyaoExtra(L, R);
  if (ex) rd.sections.splice(1, 0, ex);
  return readingHTML(rd, { foot: RD_FOOT });
}
function lyReadHTML(R) {
  return `<div class="panel blk"><h3 class="sec">问事解读</h3>${topicBar("lyTopics", LY_TOPIC, lyTopic)}<div id="lyRead">${lyReadInner(R)}</div></div>`;
}
const MH_TOPICS = { 求财: { icon: "财" }, 事业: { icon: "业" }, 综合: { icon: "总" } };
function mhReadHTML(R) {
  return `<div class="panel blk"><h3 class="sec">卦象解读(按当前时刻起卦)</h3>${topicBar("mhTopics", MH_TOPICS, mhTopic)}<div id="mhRead">${readingHTML(meihuaReading(R, mhTopic), { foot: RD_FOOT })}</div><p class="note">此处解读基于“按当前起局时间起的梅花卦”;上方铜钱摇卦仅作演示,不进入此解读。</p></div>`;
}
function xkReadHTML(R) {
  const by = XKS.build || nowBJ().y,
    fy = XKS.flow || nowBJ().y,
    yun = xkYuan(by),
    X = xuankong(XKS.zuo, yun);
  return readingHTML(xuankongReading(X, yun, fy, xkYearStar(fy)), { foot: RD_FOOT });
}
function bindTopics(id, setter, rerender) {
  $$("#" + id + " button").forEach(
    (b) =>
      (b.onclick = () => {
        setter(b.dataset.topic);
        $$("#" + id + " button").forEach((x) => x.classList.toggle("on", x === b));
        rerender();
      }),
  );
}
function bindReadings() {
  if ($("#asks"))
    bindTopics(
      "asks",
      (t) => (qmTopic = t),
      () => {
        $("#askOut").innerHTML = readingHTML(qimenAsk(R, qmTopic), { foot: RD_FOOT });
      },
    );
  if ($("#lrTopics"))
    bindTopics(
      "lrTopics",
      (t) => (lrTopic = t),
      () => {
        $("#lrRead").innerHTML = readingHTML(liurenReading(R, lrTopic), { foot: RD_FOOT });
      },
    );
  if ($("#lyTopics"))
    bindTopics(
      "lyTopics",
      (t) => (lyTopic = t),
      () => {
        $("#lyRead").innerHTML = lyReadInner(R);
      },
    );
  if ($("#mhTopics"))
    bindTopics(
      "mhTopics",
      (t) => (mhTopic = t),
      () => {
        $("#mhRead").innerHTML = readingHTML(meihuaReading(R, mhTopic), { foot: RD_FOOT });
      },
    );
}

/* ================= 扩展:使用说明 · 术语表 · 导出 · Claude 综合解读 ================= */
const CAP = {};
async function getCap(name) {
  if (name in CAP) return CAP[name];
  try {
    CAP[name] = window.claude && window.claude.use ? await window.claude.use(name) : null;
  } catch (e) {
    CAP[name] = null;
  }
  return CAP[name];
}
const GLOSSARY = [
  ["四柱", "出生的年、月、日、时各一柱干支,共八字,是八字命理的骨架。日柱天干称“日主”,代表你自己。"],
  [
    "十神",
    "以日主为中心,其余干支与日主的生克关系:比肩劫财(同类)、食神伤官(我生)、正偏财(我克)、正官七杀(克我)、正偏印(生我)。",
  ],
  [
    "用神 / 喜忌",
    "八字里对命局最有平衡作用的五行叫用神,不利的叫忌神。本页取“扶抑+调候”这一最常见思路,流派不同取法可差异很大。",
  ],
  ["格局", "以月令藏干为主取的命局类型(如正官格、食神格),决定命局的主体结构与发展方向。"],
  [
    "大运 / 流年",
    "大运每十年一换,是长期背景;流年逐年一换,流月逐月一换。这里的“倾向”只表示与你喜忌的契合度。",
  ],
  ["神煞", "后世附加的象法(如天乙贵人、桃花、驿马),多为辅助参考。"],
  ["命宫 / 身宫", "紫微斗数中命盘的起点:命宫主先天禀赋,身宫主后天重心。"],
  [
    "四化",
    "禄、权、科、忌:随天干让某颗星带上“机遇、掌控、声誉、执着”的色彩;生年四化落在哪一宫,该宫就特别突出。",
  ],
  ["三方四正", "命宫的本宫、对宫,加上左右各隔四宫的两个宫,共四宫,是紫微断命宫的“会照范围”。"],
  ["大限 / 小限", "紫微里十年一转的运程叫大限,一年一宫叫小限;再叠加流年看当年重心。"],
  ["局数 / 遁", "奇门遁甲的起局方式:阳遁顺布、阴遁逆布,局数由节气与三元决定。"],
  ["值符 / 值使", "奇门中代表“事之主宰(贵人首领)”的星与代表“事之通道”的门。"],
  [
    "用神(奇门/六壬/六爻)",
    "占事时代表所问之事的那个符号——奇门看某门某星落宫,六壬看某六亲入不入传,六爻看某六亲(如妻财)的旺衰动静。",
  ],
  ["三传", "六壬中描述事情“起因—过程—结果”的三个地支,由四课按九宗门规则取出。"],
  ["世 / 应 / 动爻", "六爻中世爻代表自己、应爻代表对方,动爻是变化的起点,变出的卦称变卦。"],
  ["体 / 用", "梅花易数里体卦代表自己、用卦代表所问之事,通过五行生克断吉凶。"],
  ["山向飞星", "玄空中以坐山、朝向定出的“山星、向星、运星”,山星主人丁健康、向星主财运。"],
  ["建除 / 黄黑道", "择日常用的日课:建除十二值星与青龙、明堂等十二天神,黄道日为吉、黑道日为凶。"],
  ["二十八宿", "古人沿黄道分的二十八个星区,分属青龙、白虎、朱雀、玄武四象。"],
  [
    "五运六气",
    "以年干定岁运、年支定司天在泉,再分六步气与五运,是中医与天文历法结合的传统气运理论。",
  ],
  ["子午流注", "十二时辰各对应一条经脉气血最旺,是传统养生的时间节律。"],
];
function helpHTML() {
  return `<h3 class="sec" style="margin:0">使用说明与术语</h3>
  <div class="helpbody"><ol class="steps"><li><b>人物与起局</b>:在首页“人物 · 起局”填写姓名、性别、出生日期时间(公历或农历)、出生地(可选城市或直接填经纬度),<b>填完会自动推演</b>八字、紫微、奇门等;需要更准可勾选“真太阳时校正”。点“保存人物”存入人物册,可存多位(家人、朋友…),点人物册里的名字即可切换。</li>
  <li><b>关系网</b>:在“关系网”标签页为人物建立关系(如:甲是乙的父母、夫妻、兄弟姐妹、朋友、同事…),生成一张网络。连线颜色表示两人的相合相扶或摩擦,可叠加五行生克箭头;点人物看命局与关系,点连线看两人之间的日主五行、十神、日干日支合冲、用神扶持;下方有全体的五行与“谁扶持谁”的矩阵。同一张网也会出现在圆盘的“人物”图层里。人物册可导出为文件备份。</li>
  <li><b>左右独立滚动</b>:电脑宽屏下,主工作区分成左右两栏。鼠标停在左栏滚动时只滚左栏,停在右栏滚动时只滚右栏;手机与窄屏仍保持单栏正常滚动。“回顶 / 到底”按钮仍可快速跳到整页顶部或底部。</li>
  <li><b>看盘</b>:左边是天机盘,默认像罗盘一样缓缓转动。把鼠标放在主圆盘或页面中的其它圆盘上,直接滚动滚轮即可放大/缩小,按住鼠标左键拖动即可平移查看,双击圆盘可复位;进入“放大查看”后操作完全相同,因此不再使用“+ / −”按钮。罗盘切到“手动转盘”时,按住 Shift 再拖动用于旋转盘体,普通拖动仍是平移。盘下可切换“罗盘/星象/干支/气运/基础”等图层,并可把朝向一键带到玄空飞星。</li>
  <li><b>问事</b>:奇门、六壬、六爻、梅花页里先选所问的事项(求财、事业、感情……),下面的解读会按该事项的“用神”重新分析。</li>
  <li><b>万年历</b>:点顶部的“万年历”(或电脑上点时间)打开。月历格显示农历、节气、节日、神明诞辰、法定假日与补班、黄道黑道、朔望;点任一天展开黄历详情(宜忌、时辰吉凶、方位、彭祖百忌等),可按“宜”筛选、记录“我的日子”、公农历换算,并导出年历文件(.ics)导入手机日历。</li>
  <li><b>存档与报告</b>:“存档”保存到本浏览器;“总览”里可生成文字报告,并可保存为文件。</li>
  <li><b>心态</b>:这是把传统术数按章法算出来并解释,不是预言。结果是倾向与提醒,重大决定请以现实条件与专业意见为准。</li></ol>
  <h4 class="gl">术语表</h4><dl class="gloss">${GLOSSARY.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join("")}</dl></div>
  <div class="row"><button class="gbtn" id="helpClose">关闭</button></div>`;
}
function bindHelp() {
  const m = $("#helpModal");
  $("#helpBox").innerHTML = helpHTML();
  const close = () => {
    m.hidden = true;
  };
  $("#helpBtn").onclick = () => {
    m.hidden = false;
  };
  m.addEventListener("click", (e) => {
    if (e.target === m) close();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !m.hidden) close();
  });
  $("#helpClose").onclick = close;
}
/* ---- 导出 ---- */
async function saveFile(filename, data) {
  const dl = await getCap("downloads");
  if (!dl) {
    toast("当前环境不支持保存文件,可改用“复制”");
    return false;
  }
  try {
    await dl.save({ filename, data });
    return true;
  } catch (e) {
    if (e && e.code === "declined") return false;
    toast("保存失败:" + ((e && e.message) || "未知错误"));
    return false;
  }
}
function dialSvgString(scale) {
  const svg = $("#dial"),
    clone = svg.cloneNode(true);
  const src = [svg, ...svg.querySelectorAll("*")],
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
  const bg = getComputedStyle(document.body).backgroundColor || "#0b0a12";
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  clone.setAttribute("width", 816 * scale);
  clone.setAttribute("height", 816 * scale);
  const r = document.createElementNS(SV, "rect");
  r.setAttribute("x", -108);
  r.setAttribute("y", -108);
  r.setAttribute("width", 816);
  r.setAttribute("height", 816);
  r.setAttribute("fill", bg === "rgba(0, 0, 0, 0)" ? "#0b0a12" : bg);
  clone.insertBefore(r, clone.firstChild);
  return new XMLSerializer().serializeToString(clone);
}
function stamp() {
  const c = R ? R.t.civ : nowBJ();
  return `${c.y}${f2(c.m)}${f2(c.d)}-${f2(c.h)}${f2(c.mi)}`;
}
async function exportDial(kind) {
  if (!R) return;
  if (kind === "svg") {
    await saveFile(`天机盘-${stamp()}.svg`, dialSvgString(1));
    return;
  }
  const s = dialSvgString(2),
    img = new Image();
  await new Promise((ok, no) => {
    img.onload = ok;
    img.onerror = () => no(new Error("渲染失败"));
    img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(s);
  }).catch((e) => {
    toast("PNG 渲染失败,可改用 SVG");
    throw e;
  });
  const cv = document.createElement("canvas");
  cv.width = 1632;
  cv.height = 1632;
  cv.getContext("2d").drawImage(img, 0, 0, 1632, 1632);
  const blob = await new Promise((ok) => cv.toBlob(ok, "image/png"));
  if (blob) await saveFile(`天机盘-${stamp()}.png`, blob);
}
async function initExport() {
  const dl = await getCap("downloads");
  const box = $("#exportBox");
  if (!box) return;
  if (!dl) {
    box.hidden = true;
    return;
  }
  box.hidden = false;
  $("#expPng").onclick = () => exportDial("png").catch(() => {});
  $("#expSvg").onclick = () => exportDial("svg").catch(() => {});
  $("#repSave").hidden = false;
  $("#repSave").onclick = () => saveFile(`天机盘报告-${stamp()}.txt`, $("#repTxt").value);
}
/* ---- AI 综合解读:事实组装(界面见 ui_ai.js) ---- */
function aiFacts(R) {
  const bz = R.bz,
    D = R.deep,
    now = nowBJ().y;
  const rep = buildReportBrief(R);
  const b = bzReading(bz, D, R.opt.gender, R.lunar, now),
    z = ziweiReading(R.zw, R.lunar, R.opt.gender, now),
    g = guideReading(R, now);
  const flat = (rd, titles) =>
    rd.sections
      .filter((s) => titles.some((t) => s.title.startsWith(t)))
      .map(
        (s) =>
          `【${s.title}】` +
          s.items
            .slice(0, 8)
            .map((i) => `${i.k}:${i.t.replace(/\n/g, " ").slice(0, 150)}`)
            .join(" / "),
      )
      .join("\n");
  const parts = [
    "=== 基本盘面(程序排定) ===",
    rep,
    "=== 八字规则解读摘要 ===",
    b.summary.map((s) => s.text).join("\n"),
    flat(b, ["日主与格局", "经典组合", "婚恋", "事业与财运", "运势节奏"]),
    "=== 紫微规则解读摘要 ===",
    z.summary.map((s) => s.text).join("\n"),
    flat(z, ["命盘总纲", "生年四化", "格局"]),
    "=== 个人指南摘要 ===",
    g.summary.map((s) => s.text).join("\n"),
    flat(g, ["个人优势", "短板", "个人运势"]),
    `=== 性别 ${R.opt.gender === "M" ? "男" : "女"};今年 ${now} 年 ===`,
  ];
  return parts.join("\n");
}

/* ================= 此刻:实时仪表 ================= */
const NW = {
  R: null,
  minKey: "",
  dayKey: "",
  cards: {},
  rs: null,
  lastFull: 0,
  terms: null,
  nextHouJD: 0,
  nextStepJD: 0,
  solarShift: 0,
};
const NW_WK = "日一二三四五六";
function nwDHMS(sec) {
  sec = Math.max(0, Math.floor(sec));
  const d = Math.floor(sec / 86400),
    h = Math.floor((sec % 86400) / 3600),
    m = Math.floor((sec % 3600) / 60),
    s = sec % 60;
  return (d ? d + "天 " : "") + f2(h) + ":" + f2(m) + ":" + f2(s);
}
function nwJdToBJ(jd) {
  const f = fromJD(jd + 8 / 24);
  return `${f.m}月${f.d}日 ${f2(f.h)}:${f2(f.mi)}`;
}
function nwNowJD() {
  return Date.now() / 86400000 + 2440587.5;
}
function nwLoc() {
  const o = readOpts();
  return { lon: o.lon, lat: o.lat, solar: o.solar };
}
/* ---- 星盘(此刻)---- */
function nwWheel(A, size) {
  const c = size / 2,
    r0 = size * 0.47,
    rz1 = r0 * 0.83,
    rh = r0 * 0.68,
    rp = r0 * 0.58,
    ra = r0 * 0.48;
  const asc = A.angles.asc,
    mc = A.angles.mc;
  const ang = (l) => 270 - (l - asc); // 屏幕角度(自上顺时针)
  const Pp = (r, l) => {
    const a = ang(l) * D2R;
    return [c + r * Math.sin(a), c - r * Math.cos(a)];
  };
  const f = (n) => n.toFixed(1);
  let s = `<svg viewBox="-18 -18 ${size + 36} ${size + 36}" class="wheel" role="img" aria-label="此刻星盘">`;
  s += `<circle cx="${c}" cy="${c}" r="${r0}" class="wh-o"/><circle cx="${c}" cy="${c}" r="${rz1}" class="wh-o"/><circle cx="${c}" cy="${c}" r="${rh}" class="wh-o"/><circle cx="${c}" cy="${c}" r="${ra}" class="wh-i"/>`;
  for (let i = 0; i < 12; i++) {
    // 星座环
    const l0 = i * 30,
      [x1, y1] = Pp(rz1, l0),
      [x2, y2] = Pp(r0, l0),
      [gx, gy] = Pp((rz1 + r0) / 2, l0 + 15);
    s += `<line x1="${f(x1)}" y1="${f(y1)}" x2="${f(x2)}" y2="${f(y2)}" class="wh-l"/><text x="${f(gx)}" y="${f(gy)}" class="wh-sg wh-e${["火", "土", "风", "水"].indexOf(AS_SIGN[i][3])}" text-anchor="middle" dominant-baseline="central">${AS_SIGN[i][1]}\uFE0E</text>`;
  }
  for (let i = 0; i < 12; i++) {
    // 宫位(等宫)
    const l0 = asc + 30 * i,
      [x1, y1] = Pp(ra, l0),
      [x2, y2] = Pp(rz1, l0),
      [nx, ny] = Pp((rh + rz1) / 2, l0 + 15);
    s += `<line x1="${f(x1)}" y1="${f(y1)}" x2="${f(x2)}" y2="${f(y2)}" class="wh-h${i % 3 === 0 ? " ax" : ""}"/><text x="${f(nx)}" y="${f(ny)}" class="wh-hn" text-anchor="middle" dominant-baseline="central">${i + 1}</text>`;
  }
  // 相位线
  A.aspects
    .filter((a) => a.name !== "合相")
    .forEach((a) => {
      const [x1, y1] = Pp(ra, A.planets[a.i].lon),
        [x2, y2] = Pp(ra, A.planets[a.j].lon);
      s += `<line x1="${f(x1)}" y1="${f(y1)}" x2="${f(x2)}" y2="${f(y2)}" class="wh-a ${a.t === "和" ? "he" : "ch"}"/>`;
    });
  // 行星(防重叠)
  const order = A.planets.map((p, i) => ({ p, i })).sort((a, b) => a.p.lon - b.p.lon),
    placed = [];
  order.forEach((o) => {
    let lane = 0;
    for (;;) {
      if (
        !placed.some((q) => q.lane === lane && Math.abs(((o.p.lon - q.lon + 540) % 360) - 180) < 9)
      )
        break;
      lane++;
    }
    placed.push({ lon: o.p.lon, lane, i: o.i });
  });
  placed.forEach((q) => {
    const p = A.planets[q.i],
      rr = rp - (q.lane % 3) * 15,
      [x, y] = Pp(rr, p.lon),
      [tx, ty] = Pp(rh, p.lon),
      [tx2, ty2] = Pp(rr + 9, p.lon);
    s += `<line x1="${f(tx)}" y1="${f(ty)}" x2="${f(tx2)}" y2="${f(ty2)}" class="wh-t"/><circle cx="${f(x)}" cy="${f(y)}" r="9" class="wh-p${p.retro ? " rt" : ""}"/><text x="${f(x)}" y="${f(y)}" class="wh-pg" text-anchor="middle" dominant-baseline="central">${p.g}\uFE0E</text>`;
  });
  // 轴线与标注
  [
    [asc, "ASC"],
    [mc, "MC"],
    [asc + 180, "DSC"],
    [mc + 180, "IC"],
  ].forEach(([l, n], k) => {
    const [x1, y1] = Pp(ra * 0.35, l),
      [x2, y2] = Pp(r0 + 2, l),
      [tx, ty] = Pp(r0 + 13, l);
    s += `<line x1="${f(x1)}" y1="${f(y1)}" x2="${f(x2)}" y2="${f(y2)}" class="wh-ax${k > 1 ? " d" : ""}"/><text x="${f(tx)}" y="${f(ty)}" class="wh-at" text-anchor="middle" dominant-baseline="central">${n}</text>`;
  });
  s += `<text x="${c}" y="${c - 4}" class="wh-c1" text-anchor="middle">此 刻</text><text x="${c}" y="${c + 12}" class="wh-c2" text-anchor="middle">${AS_SIGN[Math.floor(asc / 30)][0]}座上升</text></svg>`;
  return s;
}
/* ---- 各卡片 ---- */
function nwHero(N) {
  const R = N.R,
    bz = R.bz,
    c = R.t.civ;
  const gzs = bz.pill
    .map(
      (p, i) =>
        `<div class="gzc"><small>${["年", "月", "日", "时"][i]}</small><b class="wx${GAN_WX[p.s]}">${GAN[p.s]}</b><b class="wx${ZHI_WX[p.b]}">${ZHI[p.b]}</b></div>`,
    )
    .join("");
  return `<div class="nw-hero"><div class="nw-left"><div class="nw-clock" id="nwT">--:--:--</div><div class="nw-date" id="nwD"></div><div class="nw-gz">${gzs}</div></div>
   <div class="nw-ring"><svg viewBox="0 0 120 120" class="ringsvg"><circle cx="60" cy="60" r="50" class="rg-bg"/><path id="nwArc" class="rg-fg" d="" /><text x="60" y="58" class="rg-t" text-anchor="middle" id="nwSc">时</text><text x="60" y="76" class="rg-s" text-anchor="middle" id="nwKe"></text></svg>
   <div class="nw-rem"><span id="nwRemain"></span><small id="nwGeng"></small></div></div></div>
   <p class="note" style="margin:0 0 8px">以下均为“此刻”(北京时间)的实时数据,随时间自动更新,与左侧盘面所用的起局时间无关;位置取自顶部经纬度。<button class="gbtn sm" id="nwLoad" style="margin-left:6px">载入左侧天机盘</button></p>`;
}
function nwTermCard(N) {
  const tl = N.terms,
    h = N.hou,
    R = N.R,
    bz = R.bz;
  const cur = tl[0],
    nx = tl[1];
  const tl2 = tl
    .slice(1, 5)
    .map(
      (t) =>
        `<span class="pill ${t.zhong ? "c" : ""}">${t.name}<small>${nwJdToBJ(t.jd)}</small></span>`,
    )
    .join("");
  const sj = N.shujiu,
    fu = N.fu;
  const chips = [
    sj ? `<span class="pill g">${sj.name}第${sj.day}天</span>` : "",
    fu ? `<span class="pill r">${fu.name}第${fu.day}天</span>` : "",
  ].join("");
  return `<div class="nw-card"><h3 class="sec">节气 · 物候</h3>
   <div class="nw-big"><b>${cur.name}</b><span class="dim"> 后 · 距<b class="gold">${nx.name}</b></span></div>
   <div class="barx"><i id="nwTermBar" style="width:0%"></i></div><div class="nw-cd" id="nwTermCd"></div>
   <div class="nw-hou"><b>${h.term} · ${h.ord}</b> <span class="gold">${h.name}</span><small class="dim">${h.meaning}</small><div class="barx thin"><i style="width:${(h.progress * 100).toFixed(0)}%"></i></div></div>
   <div class="pills" style="margin:8px 0">${chips}<span class="pill">${NW_XIAOXI[bz.pill[1].b]}卦(${ZHI[bz.pill[1].b]}月)<small>${NW_XIAOXI_TXT[bz.pill[1].b]}</small></span></div>
   <div class="pills">${tl2}</div></div>`;
}
function nwSunCard(N) {
  const rs = N.rs;
  return `<div class="nw-card"><h3 class="sec">太阳</h3>
   <div class="kv"><span>高度 <b id="nwSunAlt">—</b></span><span>方位 <b id="nwSunAz">—</b></span><span>视赤纬 <b id="nwSunDec">—</b></span></div>
   <div class="sunbar"><div class="sunbar-t"><span>日出 ${nwFmtH(rs.sun.rise)}</span><span>正午 ${nwFmtH(rs.sun.noon)}</span><span>日落 ${nwFmtH(rs.sun.set)}</span></div><div class="sunbar-b"><i id="nwSunMk"></i></div></div>
   <div class="kv"><span>昼长 <b>${rs.sun.rise !== null && rs.sun.set !== null ? Math.floor(rs.sun.set - rs.sun.rise) + "时" + f2(Math.round(((rs.sun.set - rs.sun.rise) % 1) * 60)) + "分" : rs.sun.alwaysUp ? "极昼" : "极夜"}</b></span><span>正午太阳高度 <b>${rs.sun.maxAlt.toFixed(1)}°</b></span><span>${N.R.t.lon >= 270 || N.R.t.lon < 90 ? "阳长阴消(昼渐长)" : "阴长阳消(昼渐短)"}</span></div>
   <p class="note" style="margin:6px 0 0">日出日落按标准大气折射计算(与天文历库对拍,误差 &lt;0.1 分钟);北京时间显示。</p></div>`;
}
function nwMoonCard(N) {
  const A = N.R.astro,
    mp = A.moon,
    rs = N.rs,
    mo = A.planets[1],
    xm = xiuOf(mo.lon, N.R.t.civ.y);
  const jd = N.jd,
    nn = nwNextPhase(jd, 0),
    nf = nwNextPhase(jd, 180),
    first = nn < nf;
  return `<div class="nw-card"><h3 class="sec">月亮</h3><div class="moonrow">${nwMoonSvg(mp.el, 64)}<div><div class="nw-big"><b>${mp.name}</b></div><div class="dim sm">月龄 ${mp.age.toFixed(1)} 天 · 受光 ${(mp.lit * 100).toFixed(0)}%</div></div></div>
   <div class="kv" style="margin-top:8px"><span>${mo.sign[1]}\uFE0E ${mo.sign[0]}座 ${Math.floor(mo.deg)}°</span><span>入 <b>${xm.n}宿</b></span><span>高度 <b id="nwMoonAlt">—</b></span><span>方位 <b id="nwMoonAz">—</b></span></div>
   <div class="kv"><span>月出 <b>${nwFmtH(rs.moon.rise)}</b></span><span>月落 <b>${nwFmtH(rs.moon.set)}</b></span></div>
   <div class="kv"><span>${first ? "下个朔" : "下个望"} <b>${nwJdToBJ(first ? nn : nf)}</b></span><span>${first ? "其后望" : "其后朔"} <b>${nwJdToBJ(first ? nf : nn)}</b></span></div>
   <p class="note" style="margin:6px 0 0">朔望时刻由月球主要周期项估算,与天文历库对拍平均约 1–2 分钟。</p></div>`;
}
function nwSkyCard(N) {
  const A = N.R.astro,
    pl = A.planets;
  const rows = pl
    .map(
      (p) =>
        `<tr><td><span class="pgl">${p.g}\uFE0E</span>${p.n}</td><td>${p.sign[1]}\uFE0E ${p.sign[0]} ${Math.floor(p.deg)}°${f2(Math.floor((p.deg % 1) * 60))}′</td><td>${xiuOf(p.lon, N.R.t.civ.y).n}宿</td><td>${p.retro ? '<span class="bad">℞</span>' : ""}</td></tr>`,
    )
    .join("");
  const asp = A.aspects
    .sort((a, b) => a.orb - b.orb)
    .slice(0, 8)
    .map(
      (a) =>
        `<span class="pill ${a.t === "和" ? "g" : a.t === "冲" ? "r" : "c"}">${AS_INFO[a.a].g}\uFE0E${a.sym}${AS_INFO[a.b].g}\uFE0E<small>${a.orb.toFixed(1)}°</small></span>`,
    )
    .join("");
  return `<div class="nw-card wide"><h3 class="sec">此刻星盘</h3><div class="wheelrow"><div class="wheelbox">${nwWheel(A, 380)}</div><div class="wheeltbl"><div class="tbl-wrap"><table class="tbl sm"><thead><tr><th>星体</th><th>位置</th><th>宿</th><th></th></tr></thead><tbody>${rows}</tbody></table></div><div class="pills" style="margin-top:8px">${asp}</div>
   <p class="note" style="margin:8px 0 0">上升 <b>${AS_SIGN[Math.floor(A.angles.asc / 30)][0]} ${Math.floor(A.angles.asc % 30)}°</b> · 中天 <b>${AS_SIGN[Math.floor(A.angles.mc / 30)][0]} ${Math.floor(A.angles.mc % 30)}°</b>(等宫制,经度 ${N.loc.lon}°E、纬度 ${N.loc.lat}°N)。盘面上升点在左(ASC),自上升点起逆时针为一至十二宫。</p></div></div></div>`;
}
function nwYqCard(N) {
  const q = N.R.astro.yq;
  return `<div class="nw-card"><h3 class="sec">五运六气 · ${q.gz}年</h3>
   <div class="kv"><span>岁运 <b class="gold">${q.yunName}</b></span><span>司天 <b>${q.siTian}</b></span><span>在泉 <b>${q.zaiQuan}</b></span></div>
   <div class="nw-big"><b>${["初", "二", "三", "四", "五", "终"][q.step]}之气</b><span class="dim"> 主 ${LQ_ZHU[q.step]} · 客 ${q.guest[q.step]}</span></div>
   <div class="barx"><i id="nwYqBar" style="width:0%"></i></div><div class="nw-cd" id="nwYqCd"></div>
   <div class="kv"><span>当前运 <b>${["初", "二", "三", "四", "终"][q.yunStep]}运</b>:主${q.zhuYun} · 客${q.keYun}</span></div>
   <ul class="mini"><li>${q.zhuTip}</li><li>${q.tip}</li></ul></div>`;
}
function nwLzCard(N) {
  const bz = N.R.bz,
    b = N.sc.b,
    lz = ZW_LZ[b],
    nx = ZW_LZ[(b + 1) % 12],
    pv = ZW_LZ[(b + 11) % 12];
  return `<div class="nw-card"><h3 class="sec">子午流注 · 时辰</h3>
   <div class="nw-big"><b class="wx${lz[4]}">${lz[2]}</b><span class="dim"> ${lz[3]} · ${ZHI[b]}时当令</span></div>
   <p class="rt" style="margin:4px 0 8px">${lz[5]}。</p>
   <div class="lzstrip">${ZW_LZ.map((z, i) => `<span class="${i === b ? "on" : ""} wx${z[4]}" title="${z[0]}时 ${z[2]}">${z[1]}</span>`).join("")}</div>
   <div class="kv" style="margin-top:8px"><span>上一时 <b>${pv[1]}</b></span><span>下一时 <b>${nx[1]}</b>:${nx[5]}</span></div>
   <p class="note" style="margin:6px 0 0">纳支法:十二时辰各主一条经脉气血最旺。养生提示为传统经验的一般说法,不是医疗建议。</p></div>`;
}
function nwQimenCard(N) {
  const R = N.R,
    q = R.qm,
    order = [4, 9, 2, 3, 5, 7, 8, 1, 6];
  const cells = order
    .map((p) => {
      if (p === 5)
        return `<div class="qmc mid"><b>中五</b><small>${q.earth ? q.earth[5] : ""}</small></div>`;
      const c = q.cells[p];
      return `<div class="qmc${p === q.q ? " zf" : ""}${p === q.rr ? " zs" : ""}"><small>${PNAME[p]}${PNUM[p]}·${PDIR[p]}</small><b class="${DOORTYPE[c.door] || ""}">${c.door}门</b><span>天${c.star}</span><em>${c.god}</em></div>`;
    })
    .join("");
  return `<div class="nw-card"><h3 class="sec">奇门 · 此刻局</h3><div class="kv"><span><b>${q.yang ? "阳" : "阴"}遁${PNUM[q.ju]}局</b>(${q.term}${q.yuanName})</span><span>值符 <b>天${q.zfStar}</b></span><span>值使 <b>${q.zsDoor}门</b></span></div>
   <div class="qmgrid">${cells}</div><div class="kv" style="margin-top:8px"><span class="good">较顺:${q.best.map((p) => PDIR[p] + q.cells[p].door + "门").join("、")}</span><span class="bad">偏阻:${q.worst.map((p) => PDIR[p] + q.cells[p].door + "门").join("、")}</span></div>
   <p class="note" style="margin:6px 0 0">${q.wubuyu ? "本时为“五不遇时”。" : ""}${q.fuyin ? "伏吟(静)。" : ""}${q.fanyin ? "反吟(反复)。" : ""}盘面每两小时(一个时辰)更换一次。详见“奇门遁甲”页。</p></div>`;
}
function nwPlusCard(N) {
  const R = N.R,
    lr = R.lr,
    mh = R.mh;
  return `<div class="nw-card"><h3 class="sec">六壬 · 梅花 · 此刻卦象</h3>
   <div class="kv"><span>六壬 <b class="gold">${lr.ge}</b></span><span>三传 <b>${lr.chu.map((c) => ZHI[c.z] + "(" + c.gen + ")").join("→")}</b></span><span>月将 <b>${lr.jiangName}</b></span></div>
   <div class="hexline"><div class="hxn"><small>本卦</small><b>${mh.ben.name}</b></div><span>→</span><div class="hxn"><small>互卦</small><b>${mh.hu.name}</b></div><span>→</span><div class="hxn"><small>变卦</small><b>${mh.bian.name}</b></div></div>
   <p class="rt" style="margin:6px 0 0">梅花:${mh.ben.txt || ""}。体用「${mh.verdict[0]}」——${mh.verdict[2]}</p></div>`;
}
function nwAlmCard(N) {
  const R = N.R,
    c = R.t.civ,
    di = N.di,
    hs = N.hours,
    cur = hs[N.sc.b];
  const strip = hs
    .map(
      (h) =>
        `<div class="hs ${h.huang ? "hd" : "hk"}${h.b === N.sc.b ? " now" : ""}" title="${esc(h.ts + " · 宜:" + (h.yi.join("、") || "—") + " 忌:" + (h.ji.join("、") || "—"))}"><b>${ZHI[h.b]}</b><small>${h.span.slice(0, 2)}</small></div>`,
    )
    .join("");
  const chips = (a, cls) =>
    a
      .slice(0, 9)
      .map((x) => `<span class="pill ${cls}">${x}</span>`)
      .join("") || '<span class="dim">—</span>';
  return `<div class="nw-card"><h3 class="sec">黄历 · 今日与此时</h3>
   <div class="kv"><span>日柱 <b>${di.gz}</b>(${di.nayin})</span><span>建除 <b class="${LVC(di.zxTone)}">${di.zx}日</b><small class="dim"> ${NW_JCHU_TXT[di.zx]}</small></span><span>宿 <b>${di.xiu}</b></span><span>天神 <b class="${di.huang ? "good" : "bad"}">${di.ts}(${di.huang ? "黄" : "黑"}道)</b></span><span>冲 <b>${di.chong}</b> 煞${di.sha}</span></div>
   <div class="yj"><div><span class="yl">宜</span>${chips(di.yi, "g")}</div><div><span class="yl j">忌</span>${chips(di.ji, "r")}</div></div>
   <h4 class="gl">此时:${ZHI[cur.b]}时(${cur.gz}) · <span class="${cur.huang ? "good" : "bad"}">${cur.ts}·${cur.huang ? "黄" : "黑"}道</span> · 冲${cur.chong}</h4>
   <div class="yj"><div><span class="yl">宜</span>${chips(cur.yi, "g")}</div><div><span class="yl j">忌</span>${chips(cur.ji, "r")}</div></div>
   <div class="hstrip">${strip}</div></div>`;
}
function nwWxCard(N) {
  const mb = N.R.bz.pill[1].b,
    wx = WXN.map((w, i) => {
      const s = RM_SEASON(i, mb);
      return `<span class="pill ${s[1] >= 0.7 ? "g" : s[1] <= -0.6 ? "r" : ""} wx${i}">${w}<small>${s[0]}</small></span>`;
    }).join("");
  return `<div class="nw-card wide wxflow-card" id="wxflowTool"><div class="mod-head"><h3>五行流通 · 关系工具</h3><p>标准五行关系 · 本命五行权重 · 日主生克 · 喜用与忌神</p></div>
   <div class="wxflow-top"><div class="wxflow-tabs" role="tablist" aria-label="五行关系模式"><button type="button" data-wf-mode="normal">标准五行</button><button type="button" data-wf-mode="natal" class="on">本命五行</button></div><span class="wxflow-season">当前月令 <b>${ZHI[mb]} · ${WXN[ZHI_WX[mb]]}</b>　${wx}</span></div>
   <div class="wxflow-body"><div class="wxflow-stage"><div id="wxflowViz"></div></div><aside class="wxflow-side" id="wxflowSide"></aside></div>
   <div class="wxflow-legend"><span class="sheng"><i></i>相生：木→火→土→金→水→木</span><span class="ke"><i></i>相克：木→土→水→火→金→木</span><span class="fav"><i></i>本命喜用</span><span class="avoid"><i></i>本命忌神</span></div>
   <p class="module-note">“标准五行”展示固定的生克结构；“本命五行”读取当前人物八字的五行权重、日主旺衰及本页“扶抑 + 调候”规则生成的喜忌。它是结构化参考，不代表单凭某一五行多少即可断吉凶。</p></div>`;
}
function wfRel(f, i) {
  if (i === f) return ["同我", "比和", "同类相助，也可能形成同类竞争"];
  if (i === (f + 1) % 5) return ["我生", "泄", "我向它输出、滋养，日主会有所泄耗"];
  if (i === (f + 2) % 5) return ["我克", "财", "我能制约或运用它，同时也需要消耗自身力量"];
  if (i === (f + 4) % 5) return ["生我", "印", "它滋养、支持日主，是日主的来源与补给"];
  return ["克我", "官杀", "它制约日主，代表压力、规范与约束"];
}
function wfPt(i) {
  const a = (-90 + i * 72) * D2R,
    r = 126;
  return { x: 190 + r * Math.cos(a), y: 174 + r * Math.sin(a) };
}
function wfTrim(a, b, ra, rb) {
  const dx = b.x - a.x,
    dy = b.y - a.y,
    d = Math.hypot(dx, dy) || 1;
  return {
    x1: a.x + (dx / d) * ra,
    y1: a.y + (dy / d) * ra,
    x2: b.x - (dx / d) * rb,
    y2: b.y - (dy / d) * rb,
  };
}
function wfSvg(N, mode, focus) {
  const D = N.R.deep || baziDeep(N.R.bz),
    st = D.st,
    xy = D.xy,
    tot = st.wxw.reduce((a, b) => a + b, 0) || 1,
    share = st.wxw.map((v) => v / tot),
    cols = ["var(--wood)", "var(--fire)", "var(--earth)", "var(--metal)", "var(--water)"];
  const rs = share.map((v) => (mode === "natal" ? 28 + Math.min(15, v * 48) : 35));
  let sh = "",
    ke = "",
    nodes = "";
  for (let i = 0; i < 5; i++) {
    const j = (i + 1) % 5,
      a = wfPt(i),
      b = wfPt(j),
      q = wfTrim(a, b, rs[i] + 3, rs[j] + 7);
    sh += `<path class="wf-sheng" d="M${q.x1.toFixed(1)} ${q.y1.toFixed(1)} L${q.x2.toFixed(1)} ${q.y2.toFixed(1)}" marker-end="url(#wfArrowS)"/>`;
    const k = (i + 2) % 5,
      c = wfPt(k),
      z = wfTrim(a, c, rs[i] + 3, rs[k] + 7);
    ke += `<path class="wf-ke" d="M${z.x1.toFixed(1)} ${z.y1.toFixed(1)} L${z.x2.toFixed(1)} ${z.y2.toFixed(1)}" marker-end="url(#wfArrowK)"/>`;
  }
  for (let i = 0; i < 5; i++) {
    const p = wfPt(i),
      rel = wfRel(focus, i),
      good = mode === "natal" && xy.favor.includes(i),
      bad = mode === "natal" && xy.avoid.includes(i),
      cl = `wf-node${i === focus ? " selected" : ""}${good ? " good" : ""}${bad ? " bad" : ""}`;
    nodes += `<g class="${cl}" data-wx="${i}" tabindex="0" role="button" aria-label="${WXN[i]}：${rel[0]}"><circle class="halo" cx="${p.x}" cy="${p.y}" r="${rs[i] + 7}"/><circle class="main" cx="${p.x}" cy="${p.y}" r="${rs[i]}" style="--wc:${cols[i]}"/><text class="wf-char" x="${p.x}" y="${p.y - 3}" style="--wc:${cols[i]}">${WXN[i]}</text>${mode === "natal" ? `<text class="wf-pct" x="${p.x}" y="${p.y + 19}">${(share[i] * 100).toFixed(0)}%</text>` : ""}<text class="wf-rel" x="${p.x}" y="${p.y + rs[i] + 18}">${rel[0]}</text></g>`;
  }
  const dm = GAN_WX[N.R.bz.dm],
    center = mode === "natal" ? `${GAN[N.R.bz.dm]}日主 · ${WXN[dm]}` : `以「${WXN[focus]}」为我`,
    sub = mode === "natal" ? `${st.level} · ${st.season}` : "点击任一五行切换观察中心";
  return `<svg class="wxflow-svg" viewBox="0 0 380 360" role="img" aria-label="五行相生相克关系图"><defs><marker id="wfArrowS" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0L8 4L0 8Z" fill="var(--good)"/></marker><marker id="wfArrowK" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0L8 4L0 8Z" fill="var(--red)"/></marker></defs>${sh}${ke}<circle cx="190" cy="174" r="54" fill="var(--panel)" stroke="var(--line2)"/><text class="wf-center" x="190" y="168">${center}</text><text class="wf-center-sub" x="190" y="189">${sub}</text>${nodes}</svg>`;
}
function wfSide(N, mode, focus) {
  const D = N.R.deep || baziDeep(N.R.bz),
    st = D.st,
    xy = D.xy,
    dm = GAN_WX[N.R.bz.dm],
    r = wfRel(mode === "natal" ? dm : focus, focus),
    tot = st.wxw.reduce((a, b) => a + b, 0) || 1,
    share = st.wxw.map((v) => v / tot),
    cols = ["var(--wood)", "var(--fire)", "var(--earth)", "var(--metal)", "var(--water)"];
  if (mode === "normal") {
    const rr = wfRel(focus, focus),
      sheng = (focus + 1) % 5,
      ke = (focus + 2) % 5,
      shengwo = (focus + 4) % 5,
      kewo = (focus + 3) % 5;
    return `<h4>以「${WXN[focus]}」为观察中心</h4><div class="wf-kv"><span>同我</span><b>${WXN[focus]} · 比和</b><span>我生</span><b>${WXN[sheng]} · 泄</b><span>我克</span><b>${WXN[ke]} · 财</b><span>生我</span><b>${WXN[shengwo]} · 印</b><span>克我</span><b>${WXN[kewo]} · 官杀</b></div><p class="wxflow-desc">五行不是简单的“好 / 坏”二分，而是一套<b>生成、输出、制约、承受与同类</b>的关系语言。点击图上任意五行，可以把它切换为“我”，观察另外四行与它的关系。</p>`;
  }
  const bars = WXN.map(
    (w, i) =>
      `<div class="wxflow-bar"><span class="wx${i}">${w}</span><i><b style="--p:${(share[i] * 100).toFixed(1)}%;--bc:${cols[i]}"></b></i><em>${(share[i] * 100).toFixed(0)}%</em></div>`,
  ).join("");
  const rr = wfRel(dm, focus),
    fav = xy.favor.includes(focus),
    avoid = xy.avoid.includes(focus),
    tag = fav
      ? '<span class="good">喜用</span>'
      : avoid
        ? '<span class="bad">忌神</span>'
        : '<span class="dim">中性</span>';
  return `<h4>${GAN[N.R.bz.dm]}日主 · ${WXN[dm]}　${st.level}</h4><div class="wf-kv"><span>当前观察</span><b class="wx${focus}">${WXN[focus]} · ${rr[0]} · ${tag}</b><span>关系含义</span><b>${rr[2]}</b><span>月令</span><b>${ZHI[N.R.bz.pill[1].b]}月 · 日主${st.season}</b><span>喜用</span><b>${xy.favor.map((i) => WXN[i]).join("、") || "—"}</b><span>忌神</span><b>${xy.avoid.map((i) => WXN[i]).join("、") || "—"}</b><span>用神重点</span><b>${xy.lead || "—"}</b></div><div class="wxflow-bars">${bars}</div><p class="wxflow-desc">圆点大小代表本页八字引擎计算的五行权重；外圈<b class="good">绿虚线</b>表示喜用，<b class="bad">红虚线</b>表示忌神。点击某一五行，可以看它相对日主属于“生我 / 我生 / 克我 / 我克 / 同我”中的哪一种。</p>`;
}
function bindWxFlow(N) {
  const root = document.getElementById("wxflowTool"),
    viz = document.getElementById("wxflowViz"),
    side = document.getElementById("wxflowSide");
  if (!root || !viz || !side) return;
  let mode = "natal",
    focus = GAN_WX[N.R.bz.dm];
  const render = () => {
    viz.innerHTML = wfSvg(N, mode, focus);
    side.innerHTML = wfSide(N, mode, focus);
    root
      .querySelectorAll("[data-wf-mode]")
      .forEach((b) => b.classList.toggle("on", b.dataset.wfMode === mode));
    viz.querySelectorAll(".wf-node").forEach((g) => {
      const go = () => {
        focus = +g.dataset.wx;
        render();
      };
      g.addEventListener("click", go);
      g.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          go();
        }
      });
    });
  };
  root.querySelectorAll("[data-wf-mode]").forEach((b) =>
    b.addEventListener("click", () => {
      mode = b.dataset.wfMode;
      focus = mode === "natal" ? GAN_WX[N.R.bz.dm] : focus;
      render();
    }),
  );
  render();
}

function nwTipsCard(N) {
  const R = N.R,
    lz = ZW_LZ[N.sc.b],
    cur = N.hours[N.sc.b],
    di = N.di,
    q = R.qm,
    yq = R.astro.yq;
  const tips = [
    `${ZHI[N.sc.b]}时属${lz[2]}当令:${lz[5]}。`,
    `此时为${cur.ts}(${cur.huang ? "黄道" : "黑道"}),${cur.yi.length ? "传统宜:" + cur.yi.slice(0, 5).join("、") : "无特别宜事"};${cur.ji.length ? "忌:" + cur.ji.slice(0, 5).join("、") + "。" : "无特别忌事。"}`,
    `今日${di.zx}日、${di.ts}(${di.huang ? "黄" : "黑"}道),冲${di.chong}(属${di.chong}者今日留意出行与冲动决定)。`,
    `气运:${LQ_ZHU[yq.step]}主气、${yq.guest[yq.step]}客气——${yq.tip.split(":")[1] || yq.tip}`,
    `奇门此刻${q.yang ? "阳" : "阴"}遁${PNUM[q.ju]}局,较顺方位:${q.best.map((p) => PDIR[p]).join("、")};偏阻:${q.worst.map((p) => PDIR[p]).join("、")}。${q.wubuyu ? "本时为五不遇时,重要启动宜改时。" : ""}`,
  ];
  return `<div class="nw-card wide"><h3 class="sec">此刻提示(综合传统时令与历书)</h3><ul class="tips">${tips.map((t) => `<li>${esc(t)}</li>`).join("")}</ul><p class="note" style="margin:6px 0 0">以上是把传统历书、子午流注、五运六气与奇门的“此刻”读数并列摘出,属文化与养生层面的提醒,不构成任何决策建议。</p></div>`;
}
const NW_CARDS = [
  { id: "nwc-hero", key: (N) => N.R.bz.pill.map((p) => p.s + "," + p.b).join(), html: nwHero },
  {
    id: "nwc-24",
    key: (N) =>
      N.minKey +
      N.loc.lon +
      N.loc.lat +
      N.loc.solar +
      NW.birth +
      (NW.view ? nwYmd(NW.view) : "") +
      (NW.birth === -2 && R ? R.bz.pill[0].b : ""),
    html: nw24Html,
  },
  {
    id: "nwc-rhythm",
    key: (N) => N.dayKey + N.loc.lon + N.loc.lat + (NW.view ? nwYmd(NW.view) : ""),
    html: nwRhythmHtml,
  },
  {
    id: "nwc-term",
    key: (N) =>
      N.terms[0].name +
      N.hou.name +
      (N.shujiu ? N.shujiu.k : "") +
      (N.fu ? N.fu.name + N.fu.day : "") +
      N.R.bz.pill[1].b,
    html: nwTermCard,
  },
  { id: "nwc-sun", key: (N) => N.dayKey + N.loc.lon + N.loc.lat, html: nwSunCard },
  { id: "nwc-moon", key: (N) => N.minKey, html: nwMoonCard },
  { id: "nwc-lz", key: (N) => N.sc.b, html: nwLzCard },
  {
    id: "nwc-yq",
    key: (N) => N.R.astro.yq.step + N.R.astro.yq.yunStep + N.R.astro.yq.gz,
    html: nwYqCard,
  },
  { id: "nwc-qm", key: (N) => N.R.bz.hourIdx + N.dayKey, html: nwQimenCard },
  { id: "nwc-plus", key: (N) => N.R.bz.hourIdx + N.dayKey, html: nwPlusCard },
  { id: "nwc-alm", key: (N) => N.dayKey + N.sc.b, html: nwAlmCard },
  { id: "nwc-wx", key: (N) => N.R.bz.pill[1].b, html: nwWxCard },
  { id: "nwc-sky", key: (N) => N.minKey + N.loc.lon + N.loc.lat, html: nwSkyCard },
  { id: "nwc-tips", key: (N) => N.R.bz.hourIdx + N.dayKey, html: nwTipsCard },
];
function nwBuildShell() {
  const p = $("#pane-now");
  if (p.dataset.built) return;
  p.dataset.built = "1";
  p.innerHTML = `<div id="nwc-hero"></div><div id="nwc-24"></div><div id="nwc-rhythm"></div><div class="nw-grid"><div id="nwc-term"></div><div id="nwc-sun"></div><div id="nwc-moon"></div><div id="nwc-lz"></div><div id="nwc-yq"></div></div><div id="nwc-wx"></div><div id="nwc-tianren"></div><div id="nwc-sky"></div><div class="nw-grid"><div id="nwc-qm"></div><div id="nwc-plus"></div></div><div id="nwc-alm"></div><div id="nwc-tips"></div>`;
}
/* ---- 计算与更新 ---- */
function nwFull() {
  const n = nowBJ(),
    civ = { y: n.y, m: n.m, d: n.d, h: n.h, mi: n.mi, s: 0 },
    loc = nwLoc(),
    o0 = readOpts();
  const rc = R && R.t && R.t.civ,
    ro = R && R.opt;
  const reuse = !!(
    R &&
    rc &&
    rc.y === civ.y &&
    rc.m === civ.m &&
    rc.d === civ.d &&
    rc.h === civ.h &&
    rc.mi === civ.mi &&
    (!ro ||
      (ro.gender === o0.gender &&
        !!ro.solar === !!o0.solar &&
        Math.abs((+ro.lon || 0) - (+o0.lon || 0)) < 1e-9 &&
        Math.abs((+ro.lat || 0) - (+o0.lat || 0)) < 1e-9))
  );
  const R0 = reuse ? R : compute(civ);
  const jd = nwNowJD(),
    jdLoc = jd + 8 / 24;
  const N = (NW.N = {
    R: R0,
    loc,
    jd,
    minKey: `${n.y}${n.m}${n.d}${n.h}${n.mi}`,
    dayKey: `${n.y}-${n.m}-${n.d}`,
  });
  N.hou = nwHou(jdLoc);
  N.terms = nwTermList(jd, 4);
  N.shujiu = nwShujiu(n.y, n.m, n.d);
  N.fu = nwFu(n.y, n.m, n.d);
  const shift = loc.solar ? R0.t.shift : 0;
  NW.solarShift = shift;
  N.sc = nwShichen(n.h, n.mi, n.s + shift * 60);
  // 升落(按日缓存)
  const rk = N.dayKey + "|" + loc.lon + "|" + loc.lat;
  if (NW.rsKey !== rk) {
    NW.rs = {
      sun: nwRiseSet(n.y, n.m, n.d, loc.lon, loc.lat, "sun"),
      moon: nwRiseSet(n.y, n.m, n.d, loc.lon, loc.lat, "moon"),
    };
    NW.rsKey = rk;
  }
  N.rs = NW.rs;
  const hd = n.h >= 23 ? fromJD(jdFromGreg(n.y, n.m, n.d, 12) + 1) : n;
  N.hours = hoursOfDay(hd.y, hd.m, hd.d);
  N.di = dayInfo(n.y, n.m, n.d);
  const q = R0.astro.yq,
    startLon = LQ_START_LON[q.step],
    nextLon = (startLon + 60) % 360;
  N.yqPrevJD = termJD(startLon, jd - ((R0.t.lon - startLon + 360) % 360) / 0.9856);
  N.yqNextJD = termJD(nextLon, jd + ((nextLon - R0.t.lon + 360) % 360) / 0.9856);
  return N;
}
function nwRenderCards(force) {
  const N = NW.N;
  NW_CARDS.forEach((c) => {
    const el = document.getElementById(c.id);
    if (!el) return;
    const k = String(c.key(N));
    if (!force && NW.cards[c.id] === k) return;
    NW.cards[c.id] = k;
    el.innerHTML = c.html(N);
  });
  const nb = $("#nwBirth");
  if (nb)
    nb.onchange = () => {
      NW.birth = parseInt(nb.value);
      nwRenderCards(true);
    };
  const setV = (y, m, d) => {
    NW.view = { y, m, d };
    nwRenderCards(true);
  };
  const vd = $("#nwViewD");
  if (vd) {
    const cur = () => {
      const b = nw24Base();
      return { y: b.y, m: b.m, d: b.d };
    };
    const shift = (k) => {
      const c = cur(),
        f = fromJD(jdFromGreg(c.y, c.m, c.d, 12) + k);
      if (f.y < 1901 || f.y > 2099) return;
      setV(f.y, f.m, f.d);
    };
    vd.onchange = () => {
      const p = vd.value.split("-").map(Number);
      if (p.length === 3 && p[0] >= 1901 && p[0] <= 2099) setV(p[0], p[1], p[2]);
    };
    $("#nwPrevD").onclick = () => shift(-1);
    $("#nwNextD").onclick = () => shift(1);
    $("#nwBackNow").onclick = () => {
      NW.view = null;
      nwRenderCards(true);
    };
  }
  const b = $("#nwLoad");
  if (b)
    b.onclick = () => {
      setLive(false);
      const n = nowBJ();
      setDt(n);
      deduce(n, "full");
      selectTab("over");
    };
  try {
    bindWxFlow(N);
  } catch (e) {
    console.error("wxflow", e);
  }
}
function nwArcPath(pct) {
  const a0 = -90,
    a1 = a0 + 360 * Math.min(0.9999, Math.max(0, pct)),
    cx = 60,
    cy = 60,
    r = 50,
    p = (a) => [cx + r * Math.cos(a * D2R), cy + r * Math.sin(a * D2R)];
  const [x0, y0] = p(a0),
    [x1, y1] = p(a1);
  return `M ${x0.toFixed(2)} ${y0.toFixed(2)} A ${r} ${r} 0 ${pct > 0.5 ? 1 : 0} 1 ${x1.toFixed(2)} ${y1.toFixed(2)}`;
}
function nwSecond() {
  const N = NW.N;
  if (!N) return;
  const nowJD = nwNowJD(),
    n = nowBJ(),
    set = (id, v) => {
      const e = document.getElementById(id);
      if (e && e.textContent !== v) e.textContent = v;
    };
  set("nwT", `${f2(n.h)}:${f2(n.mi)}:${f2(n.s)}`);
  const lu = N.R.lunar,
    bz = N.R.bz;
  set(
    "nwD",
    `${n.y}年${n.m}月${n.d}日 周${NW_WK[new Date(Date.UTC(n.y, n.m - 1, n.d)).getUTCDay()]} · ${lunarText(lu)}`,
  );
  const sc = nwShichen(n.h, n.mi, n.s + NW.solarShift * 60);
  N.sc = sc;
  const arc = document.getElementById("nwArc");
  if (arc) arc.setAttribute("d", nwArcPath(sc.pct));
  set("nwSc", ZHI[sc.b] + "时");
  set("nwKe", sc.half + ["一", "二", "三", "四"][sc.ke - 1] + "刻");
  // 剩余秒精确:sc.remain 以分钟(含小数)
  const rs_ = Math.max(0, Math.round(sc.remain * 60));
  set(
    "nwRemain",
    `距${ZHI[(sc.b + 1) % 12]}时 ${Math.floor(rs_ / 3600) ? Math.floor(rs_ / 3600) + "时" : ""}${Math.floor((rs_ % 3600) / 60)}分${f2(rs_ % 60)}秒`,
  );
  set("nwGeng", sc.geng ? `${sc.geng} · 夜间` : "");
  // 节气
  const tl = N.terms,
    a = tl[0].jd,
    b = tl[1].jd;
  const tb = document.getElementById("nwTermBar");
  if (tb)
    tb.style.width = Math.max(0, Math.min(100, ((nowJD - a) / (b - a)) * 100)).toFixed(2) + "%";
  set("nwTermCd", `距${tl[1].name} ${nwDHMS((b - nowJD) * 86400)}  (${nwJdToBJ(b)})`);
  // 太阳月亮
  const s = nwSun(nowJD, N.loc.lon, N.loc.lat),
    m = nwMoon(nowJD, N.loc.lon, N.loc.lat);
  set("nwSunAlt", s.alt.toFixed(1) + "°" + (s.alt < 0 ? "(地平线下)" : ""));
  set(
    "nwSunAz",
    s.az.toFixed(0) +
      "° " +
      ["北", "东北", "东", "东南", "南", "西南", "西", "西北"][Math.round(s.az / 45) % 8],
  );
  set("nwSunDec", (s.dec >= 0 ? "+" : "") + s.dec.toFixed(2) + "°");
  set("nwMoonAlt", m.alt.toFixed(1) + "°" + (m.alt < 0 ? "(地平线下)" : ""));
  set(
    "nwMoonAz",
    m.az.toFixed(0) +
      "° " +
      ["北", "东北", "东", "东南", "南", "西南", "西", "西北"][Math.round(m.az / 45) % 8],
  );
  const mk = document.getElementById("nwSunMk");
  if (mk && N.rs.sun.rise !== null && N.rs.sun.set !== null) {
    const h = n.h + n.mi / 60 + n.s / 3600,
      p = (h - N.rs.sun.rise) / (N.rs.sun.set - N.rs.sun.rise);
    mk.style.left = Math.max(-2, Math.min(102, p * 100)).toFixed(1) + "%";
    mk.classList.toggle("night", p < 0 || p > 1);
  }
  // 气运
  const yb = document.getElementById("nwYqBar");
  if (yb)
    yb.style.width =
      Math.max(0, Math.min(100, ((nowJD - N.yqPrevJD) / (N.yqNextJD - N.yqPrevJD)) * 100)).toFixed(
        2,
      ) + "%";
  set("nwYqCd", `距下一步 ${nwDHMS((N.yqNextJD - nowJD) * 86400)}  (${nwJdToBJ(N.yqNextJD)})`);
}
function nwTick(force) {
  const n = nowBJ(),
    lc = nwLoc(),
    mk = `${n.y}${n.m}${n.d}${n.h}${n.mi}${lc.lon}${lc.lat}${lc.solar}${$("#gender").value}`;
  if (force || NW.fullKey !== mk || !NW.N) {
    NW.fullKey = mk;
    nwFull();
    NW.needRender = true;
  }
  nwLiveBar();
  const pane = $("#pane-now");
  if (pane && pane.classList.contains("on") && !document.hidden) {
    nwBuildShell();
    if (NW.needRender || force) {
      nwRenderCards(force);
      NW.needRender = false;
    }
    nwSecond();
  }
}

/* ================= 此刻 · 未来24小时 / 常驻状态条 / 报时 / 时令年历 ================= */
NW.birth = -1;
NW.bell = false;
NW.lastB = null;
NW.lastTerm = null;
NW.rs2 = null;
try {
  NW.bell = localStorage.getItem("tianjipan.bell") === "1";
} catch (e) {}
const NW_SEASON_OF = {
  小寒: "冬",
  大寒: "冬",
  立春: "春",
  雨水: "春",
  惊蛰: "春",
  春分: "春",
  清明: "春",
  谷雨: "春",
  立夏: "夏",
  小满: "夏",
  芒种: "夏",
  夏至: "夏",
  小暑: "夏",
  大暑: "夏",
  立秋: "秋",
  处暑: "秋",
  白露: "秋",
  秋分: "秋",
  寒露: "秋",
  霜降: "秋",
  立冬: "冬",
  小雪: "冬",
  大雪: "冬",
  冬至: "冬",
};
const NW_SEASON_WX = { 春: 0, 夏: 1, 秋: 3, 冬: 4 };
const NW_JIE_MONTH = {
  立春: "寅",
  惊蛰: "卯",
  清明: "辰",
  立夏: "巳",
  芒种: "午",
  小暑: "未",
  立秋: "申",
  白露: "酉",
  寒露: "戌",
  立冬: "亥",
  大雪: "子",
  小寒: "丑",
};
function nwBirthZ() {
  return NW.birth === -2 ? (R && R.bz ? R.bz.pill[0].b : -1) : NW.birth;
}
/* ---- 报时 ---- */
let _ac = null;
function nwChime(kind) {
  try {
    if (!_ac) _ac = new (window.AudioContext || window.webkitAudioContext)();
    if (_ac.state === "suspended") _ac.resume();
    const t0 = _ac.currentTime,
      fr = kind === "term" ? [523.25, 659.25, 783.99, 1046.5] : [659.25, 987.77];
    fr.forEach((f, i) => {
      const o = _ac.createOscillator(),
        g = _ac.createGain();
      o.type = "sine";
      o.frequency.value = f;
      o.connect(g);
      g.connect(_ac.destination);
      const s = t0 + i * 0.2;
      g.gain.setValueAtTime(0, s);
      g.gain.linearRampToValueAtTime(0.1, s + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, s + 1.8);
      o.start(s);
      o.stop(s + 1.9);
    });
  } catch (e) {}
}
function nwNotify(title, body) {
  try {
    if (typeof Notification !== "undefined" && Notification.permission === "granted")
      new Notification(title, { body });
  } catch (e) {}
}
function nwSetBell(on) {
  NW.bell = on;
  try {
    localStorage.setItem("tianjipan.bell", on ? "1" : "0");
  } catch (e) {}
  const b = $("#lbBell");
  if (b) {
    b.classList.toggle("on", on);
    b.textContent = on ? "🔔 报时 开" : "🔕 报时 关";
    b.setAttribute("aria-pressed", on);
  }
}
function nwLiveBar() {
  const N = NW.N;
  if (!N) return;
  const nowJD = nwNowJD(),
    n = nowBJ(),
    set = (id, v) => {
      const e = document.getElementById(id);
      if (e && e.textContent !== v) e.textContent = v;
    };
  const sc = nwShichen(n.h, n.mi, n.s + NW.solarShift * 60),
    tl = N.terms;
  const rs_ = Math.max(0, Math.round(sc.remain * 60)),
    left = (tl[1].jd - nowJD) * 86400;
  set("lbSc", `${sc.label}${sc.geng ? " · " + sc.geng : ""}`);
  set(
    "lbRem",
    `距${ZHI[(sc.b + 1) % 12]}时 ${Math.floor(rs_ / 3600) ? Math.floor(rs_ / 3600) + "时" : ""}${Math.floor((rs_ % 3600) / 60)}分`,
  );
  set(
    "lbTerm",
    `${tl[0].name}后 · 距${tl[1].name} ${Math.floor(left / 86400)}天${Math.floor((left % 86400) / 3600)}时`,
  );
  set("lbDay", `${N.di.gz}日 · ${N.di.zx}日`);
  set("lbMoon", N.R.astro.moon.name);
  try {
    document.title = `${ZHI[sc.b]}时 · ${tl[0].name}后 · 天机盘`;
  } catch (e) {}
  bellTick(sc, tl, n, N);
}
/* ---- 时令年历 ---- */
const SEA = { y: 0 };
function renderSeason() {
  const n = nowBJ();
  if (!SEA.y) SEA.y = n.y;
  const y = SEA.y,
    yr = nwSeasonYear(y),
    todayN = nwDayNum(n.y, n.m, n.d),
    fu = nwFuRanges(y),
    j0 = nwJiuRanges(y - 1),
    j1 = nwJiuRanges(y);
  const dfmt = (dn) => {
    const f = fromJD(dn);
    return `${f.m}/${f.d}`;
  };
  const dnDate = (dn) => fromJD(dn + 0.0);
  const cur = yr.find((t) => todayN >= t.dn && todayN <= t.endDn);
  // 年带
  const d0 = yr[0].dn,
    d1 = yr[23].endDn + 1,
    tot = d1 - d0;
  const seg = yr
    .map((t, i) => {
      const a = ((t.dn - d0) / tot) * 100,
        b = ((t.endDn + 1 - d0) / tot) * 100,
        s = NW_SEASON_OF[t.name];
      return `<div class="yseg s${NW_SEASON_WX[s]}${t === cur ? " now" : ""}${t.zhong ? " zh" : ""}" style="left:${a.toFixed(2)}%;width:${(b - a).toFixed(2)}%" title="${t.name} ${t.bj.m}/${t.bj.d}"><span>${t.name}</span></div>`;
    })
    .join("");
  const band = (r, cls) =>
    r
      .filter((x) => x.e >= d0 && x.s < d1)
      .map((x) => {
        const a = ((Math.max(x.s, d0) - d0) / tot) * 100,
          b = ((Math.min(x.e + 1, d1) - d0) / tot) * 100;
        return `<div class="yband ${cls}" style="left:${a.toFixed(2)}%;width:${(b - a).toFixed(2)}%"><span>${x.name}</span></div>`;
      })
      .join("");
  const tm =
    todayN >= d0 && todayN < d1
      ? `<i class="ytoday" style="left:${(((todayN - d0) / tot) * 100).toFixed(2)}%" title="今天"></i>`
      : "";
  const cards = yr
    .map((t, i) => {
      const s = NW_SEASON_OF[t.name],
        isCur = t === cur,
        jm = NW_JIE_MONTH[t.name];
      return `<div class="sea-card s${NW_SEASON_WX[s]}${isCur ? " now" : ""}"><div class="sea-h"><b>${t.name}</b><span>${t.bj.m}月${t.bj.d}日 ${f2(t.bj.h)}:${f2(t.bj.mi)}</span><em>${s}${t.zhong ? " · 中气" : " · 节"}${jm ? " · " + jm + "月起" : ""}</em></div>
     <div class="sea-hou">${t.hou
       .map((h) => {
         const on = todayN >= h.s && todayN <= h.e;
         return `<div class="${on ? "on" : ""}"><b>${["初候", "二候", "三候"][t.hou.indexOf(h)]}</b> ${h.name}<small>${dfmt(h.s)}–${dfmt(h.e)} · ${NW_HOU_MEAN[h.name] || ""}</small></div>`;
       })
       .join("")}</div>
     <p class="sea-tip">${NW_TERM_TIPS[t.name]}</p></div>`;
    })
    .join("");
  const fuTxt = fu
    .map((f) => `<span class="pill r">${f.name} ${dfmt(f.s)}–${dfmt(f.e)}</span>`)
    .join("");
  const jiuTxt = [...j0.filter((x) => x.e >= d0), ...j1.filter((x) => x.s < d1)]
    .map((f) => `<span class="pill g">${f.name} ${dfmt(f.s)}–${dfmt(f.e)}</span>`)
    .join("");
  return `<div class="panel blk"><h3 class="sec">时令年历 · 二十四节气 · 七十二候</h3>
   <div class="yrctl"><label>年份 <input type="number" id="seaY" min="1902" max="2098" value="${y}"></label><button class="gbtn sm" id="seaP">‹ 上一年</button><button class="gbtn sm" id="seaN">下一年 ›</button><button class="gbtn sm" id="seaT">今年</button></div>
   ${
     cur
       ? `<p class="unl">今日处于<b>${cur.name}</b>(${cur.bj.m}月${cur.bj.d}日起),第 <b>${todayN - cur.dn + 1}</b> 天;${(() => {
           const h = cur.hou.find((h) => todayN >= h.s && todayN <= h.e);
           return h ? `此候「<b>${h.name}</b>」` : "";
         })()}。</p>`
       : '<p class="unl dim">所选年份不含今天。</p>'
   }
   <div class="ywrap"><div class="ytrack">${seg}${tm}</div><div class="ytrack thin">${band(fu, "fu")}${band([...j0, ...j1], "jiu")}</div></div>
   <div class="pills" style="margin:8px 0"><span class="lab">三伏</span>${fuTxt}</div><div class="pills"><span class="lab">数九</span>${jiuTxt}</div>
   <p class="note">年带自小寒起至该年最后一个节气结束;红带为三伏,蓝带为数九(自上年冬至与本年冬至起算)。候的起止取“节气当日起每五日一候”的历书通行算法,与开源历法库逐日对拍一致;个别候名有异文(如“鹰始鸷/鹰始挚”)。习俗与养生提示为各地传统说法的概括,不构成医疗建议。</p></div>
   ${posterCardHTML(y)}<div class="sea-grid">${cards}</div>`;
}
function bindSeason() {
  const go = (y) => {
    SEA.y = Math.max(1902, Math.min(2098, y));
    $("#pane-season").innerHTML = renderSeason();
    bindSeason();
  };
  const e = $("#seaY");
  if (!e) return;
  e.onchange = () => go(parseInt(e.value) || nowBJ().y);
  $("#seaP").onclick = () => go(SEA.y - 1);
  $("#seaN").onclick = () => go(SEA.y + 1);
  $("#seaT").onclick = () => go(nowBJ().y);
  bindPoster(SEA.y);
}
function seasonRefresh() {
  const p = $("#pane-season");
  if (!p) return;
  p.innerHTML = renderSeason();
  bindSeason();
}

/* ================= 此刻 · 日期视图 / 未来24小时 / 今日节律 ================= */
NW.view = null;
NW.rsc = {};
function nwRS(y, m, d, lon, lat, body, h0) {
  const k = [y, m, d, lon, lat, body, h0 === undefined ? "" : h0].join("|");
  if (!(k in NW.rsc)) {
    if (Object.keys(NW.rsc).length > 80) NW.rsc = {};
    NW.rsc[k] = nwRiseSet(y, m, d, lon, lat, body, h0);
  }
  return NW.rsc[k];
}
function nw24Base() {
  if (NW.view) return { y: NW.view.y, m: NW.view.m, d: NW.view.d, h: 0, mi: 0, s: 0, custom: true };
  const n = nowBJ();
  return { y: n.y, m: n.m, d: n.d, h: n.h, mi: n.mi, s: n.s, custom: false };
}
function nw24Data(N) {
  const b = nw24Base(),
    t0 = jdFromGreg(b.y, b.m, b.d, b.h, b.mi, b.s),
    jdUT = t0 - 8 / 24,
    day0 = jdFromGreg(b.y, b.m, b.d, 0),
    nx = fromJD(jdFromGreg(b.y, b.m, b.d, 12) + 1);
  const blocks = nwHourBlocks(b, NW.solarShift, 13),
    lon = N.loc.lon,
    lat = N.loc.lat;
  const ev = [],
    add = (jd, label, kind) => {
      if (jd >= t0 - 1e-6 && jd < t0 + 1) ev.push({ jd, label, kind });
    };
  [
    [nwRS(b.y, b.m, b.d, lon, lat, "sun"), nwRS(b.y, b.m, b.d, lon, lat, "moon"), 0],
    [nwRS(nx.y, nx.m, nx.d, lon, lat, "sun"), nwRS(nx.y, nx.m, nx.d, lon, lat, "moon"), 1],
  ].forEach(([s, m, o]) => {
    if (s.rise !== null) add(day0 + o + s.rise / 24, "日出", "sun");
    if (s.set !== null) add(day0 + o + s.set / 24, "日落", "sun");
    if (m.rise !== null) add(day0 + o + m.rise / 24, "月出", "moon");
    if (m.set !== null) add(day0 + o + m.set / 24, "月落", "moon");
    if (s.noon !== null && s.maxAlt > 0) add(day0 + o + s.noon / 24, "日中", "sun");
  });
  nwTermList(jdUT, 4)
    .slice(1, 3)
    .forEach((t) => add(t.jd + 8 / 24, "交" + t.name, "term"));
  add(nwNextPhase(jdUT, 0) + 8 / 24, "朔", "moon");
  add(nwNextPhase(jdUT, 180) + 8 / 24, "望", "moon");
  ev.sort((a, c) => a.jd - c.jd);
  return { b, t0, jdUT, blocks, ev, custom: b.custom };
}
function nwFmtEv(jd, D) {
  const f = fromJD(jd),
    same = f.d === D.b.d && f.m === D.b.m;
  return (same ? (D.custom ? "" : "今 ") : D.custom ? "次日 " : "明 ") + f2(f.h) + ":" + f2(f.mi);
}
function nwHM(jd) {
  const f = fromJD(jd);
  return f2(f.h) + ":" + f2(f.mi);
}
function nw24Chart(N, D) {
  const W = 740,
    H = 210,
    pl = 34,
    pr = 8,
    pt = 40,
    pb = 26,
    cw = W - pl - pr,
    ch = H - pt - pb;
  const t0 = D.t0,
    t1 = t0 + 1,
    X = (t) => pl + (t - t0) * cw,
    mn = -45,
    mx = 90,
    Y = (a) => pt + ((mx - Math.max(mn, Math.min(mx, a))) / (mx - mn)) * ch;
  let s = `<svg viewBox="0 0 ${W} ${H}" class="chart24" role="img" aria-label="24小时太阳月亮高度与时辰">`;
  D.blocks.forEach((b) => {
    const a = Math.max(t0, b.sJD),
      e = Math.min(t1, b.eJD);
    if (e <= a) return;
    const x1 = X(a),
      x2 = X(e);
    s += `<rect x="${x1.toFixed(1)}" y="${pt}" width="${(x2 - x1).toFixed(1)}" height="${ch}" class="c24-b ${b.huang ? "hd" : "hk"}${b.isNow && !D.custom ? " now" : ""}"/>`;
    s += `<text x="${((x1 + x2) / 2).toFixed(1)}" y="${pt - 22}" class="c24-z" text-anchor="middle">${ZHI[b.b]}</text><text x="${((x1 + x2) / 2).toFixed(1)}" y="${pt - 9}" class="c24-l wx${b.lz[4]}" text-anchor="middle">${b.lz[1]}</text>`;
    s += `<rect x="${x1.toFixed(1)}" y="${pt + ch + 2}" width="${(x2 - x1).toFixed(1)}" height="4" class="c24-t ${b.huang ? "hd" : "hk"}"/>`;
    s += `<text x="${x1.toFixed(1)}" y="${H - 6}" class="c24-tm" text-anchor="middle">${f2(fromJD(Math.max(t0, b.sJD)).h)}</text>`;
  });
  const step = 15 / 1440,
    pts = { s: [], m: [] };
  let nightStart = null;
  for (let t = t0; t <= t1 + 1e-9; t += step) {
    const ut = t - 8 / 24,
      sa = nwSun(ut, N.loc.lon, N.loc.lat).alt,
      ma = nwMoon(ut, N.loc.lon, N.loc.lat).alt;
    pts.s.push([X(t), Y(sa)]);
    pts.m.push([X(t), Y(ma)]);
    const night = sa < -0.833;
    if (night && nightStart === null) nightStart = t;
    if (!night && nightStart !== null) {
      s += `<rect x="${X(nightStart).toFixed(1)}" y="${pt}" width="${(X(t) - X(nightStart)).toFixed(1)}" height="${ch}" class="c24-n"/>`;
      nightStart = null;
    }
  }
  if (nightStart !== null)
    s += `<rect x="${X(nightStart).toFixed(1)}" y="${pt}" width="${(X(t1) - X(nightStart)).toFixed(1)}" height="${ch}" class="c24-n"/>`;
  s += `<line x1="${pl}" x2="${W - pr}" y1="${Y(0).toFixed(1)}" y2="${Y(0).toFixed(1)}" class="c24-h"/><text x="${pl - 4}" y="${(Y(0) + 3).toFixed(1)}" class="c24-ax" text-anchor="end">地平</text><text x="${pl - 4}" y="${(Y(60) + 3).toFixed(1)}" class="c24-ax" text-anchor="end">60°</text><line x1="${pl}" x2="${W - pr}" y1="${Y(60).toFixed(1)}" y2="${Y(60).toFixed(1)}" class="c24-g"/>`;
  s += `<polyline points="${pts.m.map((p) => p.map((v) => v.toFixed(1)).join(",")).join(" ")}" class="c24-moon"/><polyline points="${pts.s.map((p) => p.map((v) => v.toFixed(1)).join(",")).join(" ")}" class="c24-sun"/>`;
  D.ev.forEach((e) => {
    const x = X(e.jd);
    s += `<line x1="${x.toFixed(1)}" x2="${x.toFixed(1)}" y1="${pt}" y2="${pt + ch}" class="c24-e ${e.kind}"/><text x="${x.toFixed(1)}" y="${pt + 11}" class="c24-et ${e.kind}" text-anchor="${x > W - 50 ? "end" : "start"}" dx="${x > W - 50 ? -3 : 3}">${e.label}</text>`;
  });
  s += `<line x1="${pl}" x2="${pl}" y1="${pt - 4}" y2="${pt + ch}" class="c24-now"/><text x="${pl + 3}" y="${pt + ch - 4}" class="c24-nt">${D.custom ? "0 点" : "此刻"}</text>`;
  s += `<g class="c24-lg"><line x1="${W - 150}" x2="${W - 132}" y1="${H - 12}" y2="${H - 12}" class="c24-sun"/><text x="${W - 128}" y="${H - 9}">太阳</text><line x1="${W - 92}" x2="${W - 74}" y1="${H - 12}" y2="${H - 12}" class="c24-moon"/><text x="${W - 70}" y="${H - 9}">月亮</text></g>`;
  return s + "</svg>";
}
function nwYmd(b) {
  return `${b.y}-${f2(b.m)}-${f2(b.d)}`;
}
function nw24Html(N) {
  const D = nw24Data(N),
    bz = nwBirthZ(),
    bl = D.blocks;
  const top = bl
    .filter((b) => b.huang && b.chongZ !== bz && b.eJD > D.t0)
    .slice(0, 3)
    .map((b) => `${ZHI[b.b]}时(${nwHM(b.sJD)}–${nwHM(b.eJD)})`);
  const cards = bl
    .map((b) => {
      const cx = bz >= 0 && b.chongZ === bz,
        now = b.isNow && !D.custom;
      return `<div class="hb ${b.huang ? "hd" : "hk"}${now ? " now" : ""}${cx ? " cx" : ""}" title="${esc(b.ts + " · 宜:" + (b.yi.join("、") || "—") + " 忌:" + (b.ji.join("、") || "—"))}"><div class="hb-t"><b>${ZHI[b.b]}时</b><span>${b.gz}</span></div><div class="hb-s">${nwHM(b.sJD)}–${nwHM(b.eJD)}</div><div class="hb-g"><span class="${b.huang ? "good" : "bad"}">${b.ts}</span> · ${b.lz[2].replace("经", "")}</div><div class="hb-y"><i>宜</i>${b.yi.slice(0, 3).join("、") || "—"}</div><div class="hb-y j"><i>忌</i>${b.ji.slice(0, 3).join("、") || "—"}</div><div class="hb-c">冲${b.chong}${cx ? " <em>冲我</em>" : ""}</div></div>`;
    })
    .join("");
  const evs = D.ev
    .map(
      (e) =>
        `<span class="pill ${e.kind === "sun" ? "c" : e.kind === "moon" ? "" : "g"}">${nwFmtEv(e.jd, D)} ${e.label}</span>`,
    )
    .join("");
  const vd = nwYmd(D.b);
  return `<div class="nw-card wide"><h3 class="sec">${D.custom ? "日期视图 · " + vd + " 的时辰与天象" : "未来 24 小时 · 时辰与天象"}</h3>
   <div class="row3"><label class="sm dim">日期 <input type="date" id="nwViewD" value="${vd}" min="1901-01-01" max="2099-12-31"></label><button class="gbtn sm" id="nwPrevD">‹ 前一天</button><button class="gbtn sm" id="nwNextD">后一天 ›</button><button class="gbtn sm" id="nwBackNow"${D.custom ? "" : " disabled"}>回到此刻</button>
   <label class="sm dim">我的生肖 <select id="nwBirth"><option value="-1"${NW.birth === -1 ? " selected" : ""}>不标注冲</option><option value="-2"${NW.birth === -2 ? " selected" : ""}>取左侧命盘生肖</option>${ZODIAC12.map((z, i) => `<option value="${i}"${NW.birth === i ? " selected" : ""}>${z}</option>`).join("")}</select></label></div>
   <div class="dim sm" style="margin-bottom:6px">${top.length ? "较优时段(黄道且不冲我):" + top.join("、") : "此窗口内暂无符合的较优时段"}</div>
   <div class="c24wrap">${nw24Chart(N, D)}</div>
   <div class="pills" style="margin:6px 0 10px">${evs}</div>
   <div class="hbrow">${cards}</div>
   <p class="note" style="margin:8px 0 0">曲线为太阳(金)与月亮(青)在你所填经纬度的高度(15 分钟一点);夜色为日落到日出;绿色为黄道时、红色为黑道时。悬停时辰卡可看宜忌。${D.custom ? "日期视图自该日 0 点起算 24 小时。" : ""}时辰边界按${N.loc.solar ? "真太阳时" : "北京时间"}划分。</p></div>`;
}
/* ---- 今日节律 ---- */
const NW_PHASE_CLS = { 夜: "n", 晨曦: "d", 昼: "a", 暮: "d" };
function nwRhythmHtml(N) {
  const b = nw24Base(),
    { y, m, d } = b,
    lon = N.loc.lon,
    lat = N.loc.lat;
  const sun = nwRS(y, m, d, lon, lat, "sun"),
    tw = nwRS(y, m, d, lon, lat, "sun", -6),
    hs = hoursOfDay(y, m, d),
    di = dayInfo(y, m, d);
  const hasSun = sun.rise !== null && sun.set !== null;
  const dawn = tw.rise !== null ? tw.rise : sun.rise,
    dusk = tw.set !== null ? tw.set : sun.set;
  const phaseOf = (h) => {
    if (!hasSun) return sun.alwaysUp ? "昼" : "夜";
    if (h < dawn || h >= dusk) return "夜";
    if (h < sun.rise) return "晨曦";
    if (h < sun.set) return "昼";
    return "暮";
  };
  let bar = "";
  if (hasSun) {
    const seg = [
      [0, dawn, "夜"],
      [dawn, sun.rise, "晨曦"],
      [sun.rise, sun.set, "昼"],
      [sun.set, dusk, "暮"],
      [dusk, 24, "夜"],
    ];
    bar = `<div class="rbar">${seg.map(([a, c, n]) => `<div class="ph ${NW_PHASE_CLS[n]}${n === "昼" ? " day" : ""}" style="width:${(((c - a) / 24) * 100).toFixed(2)}%" title="${n} ${nwFmtH(a)}–${nwFmtH(c)}"><span>${c - a >= 1.3 ? n : ""}</span></div>`).join("")}<i class="rnoon" style="left:${((sun.noon / 24) * 100).toFixed(2)}%" title="日中 ${nwFmtH(sun.noon)}"></i></div><div class="rbar-t"><span>0</span><span>6</span><span>12</span><span>18</span><span>24</span></div>`;
  } else
    bar = `<p class="dim sm">该纬度当日${sun.alwaysUp ? "为极昼(太阳不落)" : "为极夜(太阳不升)"},以下按钟点划分。</p>`;
  const hOf = (t) => Math.floor(((t + 1) % 24) / 2) % 12;
  const rows = [...Array(12).keys()]
    .map((bi) => {
      const h = hs[bi],
        mid = bi === 0 ? 0 : 2 * bi,
        ph = phaseOf(mid),
        lz = ZW_LZ[bi],
        sp = (2 * bi - 1 + 24) % 24,
        ep = (2 * bi + 1) % 24;
      const mark = hasSun
        ? [
            hOf(sun.rise) === bi ? "日出" : "",
            hOf(sun.set) === bi ? "日落" : "",
            hOf(sun.noon) === bi ? "日中" : "",
          ]
            .filter(Boolean)
            .map((x) => `<em class="mk">${x}</em>`)
            .join("")
        : "";
      return `<tr class="${h.huang ? "hd" : "hk"}"><td><b>${ZHI[bi]}时</b><small>${h.gz}</small></td><td class="tn">${f2(sp)}–${f2(ep)}</td><td><span class="wx${lz[4]}">${lz[2]}</span></td><td><span class="phc ${NW_PHASE_CLS[ph]}">${ph}</span>${mark}</td><td><span class="${h.huang ? "good" : "bad"}">${h.ts}</span></td><td class="rt">${lz[5]}</td></tr>`;
    })
    .join("");
  const sr = hasSun
    ? `日出 <b>${nwFmtH(sun.rise)}</b>(${ZHI[hOf(sun.rise)]}时),日落 <b>${nwFmtH(sun.set)}</b>(${ZHI[hOf(sun.set)]}时),昼长 <b>${Math.floor(sun.set - sun.rise)}时${f2(Math.round(((sun.set - sun.rise) % 1) * 60))}分</b>;晨曦自 ${nwFmtH(dawn)} 起,暮色至 ${nwFmtH(dusk)}。`
    : "";
  return `<div class="nw-card wide"><h3 class="sec">${b.custom ? nwYmd(b) + " " : "今日"}节律 · 起居参照</h3>${bar}
   <p class="rt" style="margin:8px 0">${sr}${hasSun ? `传统主张“日出而作、日入而息”:可以日出前后(${ZHI[hOf(sun.rise)]}时)起身为参照,午时(11–13 点)小憩,${ZHI[hOf(sun.set)]}时(日落)后渐次收心,亥时(21–23 点)前后入睡。` : ""}</p>
   <div class="tbl-wrap"><table class="tbl sm rhy"><thead><tr><th>时辰</th><th>时段</th><th>当令经脉</th><th>天象</th><th>黄黑道</th><th>传统养生说法(子午流注)</th></tr></thead><tbody>${rows}</tbody></table></div>
   <p class="note" style="margin:8px 0 0">${di.gz}日 · ${di.zx}日。晨曦/暮色以太阳在地平线下 6° 内计(民用曙暮光)。表中养生说法出自子午流注的传统经验,只作文化与起居参照,不是医疗建议;个人作息请以自身条件为先。</p></div>`;
}

/* ================= 节气物候年历图(可导出海报) ================= */
function posterSVG(y) {
  const W = 1200,
    H = 1700,
    cx = 600,
    cy = 870;
  const yr = nwSeasonYear(y),
    fu = nwFuRanges(y),
    j0 = nwJiuRanges(y - 1),
    j1 = nwJiuRanges(y);
  const gzIdx = (((y - 4) % 60) + 60) % 60,
    gz = GAN[gzIdx % 10] + ZHI[gzIdx % 12],
    yq = wuyunLiuqi(gzIdx, 90);
  const C = {
    bg: "#f4ecd9",
    ink: "#2b2218",
    dim: "#7a6a4e",
    line: "#a08a62",
    red: "#b23a2c",
    s: ["#5e8b5a", "#c2503a", "#a58a4a", "#4a7896"],
  }; // 春夏秋冬
  const FONT = "'Noto Serif SC','Songti SC','SimSun','Source Han Serif SC',serif",
    KAI = "'Ma Shan Zheng','STKaiti','KaiTi','Kaiti SC',serif";
  const P = (r, t) => {
    const a = t * D2R;
    return [cx + r * Math.sin(a), cy - r * Math.cos(a)];
  };
  const f1 = (n) => n.toFixed(1);
  const th = (lon) => (((lon - 90) % 360) + 360) % 360; // 夏至在上,顺时针
  const sector = (r1, r2, t1, t2) => {
    const [x1, y1] = P(r2, t1),
      [x2, y2] = P(r2, t2),
      [x3, y3] = P(r1, t2),
      [x4, y4] = P(r1, t1),
      lg = (t2 - t1 + 360) % 360 > 180 ? 1 : 0;
    return `M${f1(x1)} ${f1(y1)}A${r2} ${r2} 0 ${lg} 1 ${f1(x2)} ${f1(y2)}L${f1(x3)} ${f1(y3)}A${r1} ${r1} 0 ${lg} 0 ${f1(x4)} ${f1(y4)}Z`;
  };
  const rtext = (txt, t, rmid, size, fill, weight, extra) => {
    // 径向文字,保证可读
    const right = t <= 180,
      a = right ? t - 90 : t + 90,
      x = right ? cx + rmid : cx - rmid;
    return `<g transform="rotate(${f1(a)} ${cx} ${cy})"><text x="${f1(x)}" y="${cy}" font-size="${size}" fill="${fill}" font-weight="${weight || 400}" text-anchor="middle" dominant-baseline="central" ${extra || ""}>${txt}</text></g>`;
  };
  let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" font-family="${FONT}">`;
  s += `<rect width="${W}" height="${H}" fill="${C.bg}"/><rect x="28" y="28" width="${W - 56}" height="${H - 56}" fill="none" stroke="${C.line}" stroke-width="2"/><rect x="40" y="40" width="${W - 80}" height="${H - 80}" fill="none" stroke="${C.line}" stroke-width=".8"/>`;
  // 标题
  s += `<text x="${cx}" y="150" font-family="${KAI}" font-size="86" fill="${C.ink}" text-anchor="middle" letter-spacing="14">节气物候年历</text>`;
  s += `<text x="${cx}" y="204" font-size="26" fill="${C.dim}" text-anchor="middle" letter-spacing="8">${y} · ${gz}年 · 二十四节气 七十二候</text>`;
  s += `<g transform="translate(96 96)"><rect width="70" height="70" rx="6" fill="${C.red}"/><text x="35" y="31" font-family="${KAI}" font-size="30" fill="#f4ecd9" text-anchor="middle" dominant-baseline="central">天</text><text x="35" y="57" font-family="${KAI}" font-size="30" fill="#f4ecd9" text-anchor="middle" dominant-baseline="central">机</text></g>`;
  // 季节环
  const seasons = [
    ["春", 315, C.s[0]],
    ["夏", 45, C.s[1]],
    ["秋", 135, C.s[2]],
    ["冬", 225, C.s[3]],
  ];
  seasons.forEach(([n, l0, col]) => {
    const t1 = th(l0),
      t2 = t1 + 90;
    s += `<path d="${sector(505, 528, t1, t2)}" fill="${col}" fill-opacity=".85"/>`;
    s += rtext(n, (t1 + 45) % 360, 517, 17, "#f4ecd9", 600);
  });
  // 二十四节气环 (505–405)
  const order = yr.slice().sort((a, b) => a.lon - b.lon);
  order.forEach((t) => {
    const t1 = th(t.lon),
      col = C.s[["春", "夏", "秋", "冬"].indexOf(NW_SEASON_OF[t.name])];
    s += `<path d="${sector(405, 505, t1, t1 + 15)}" fill="${col}" fill-opacity="${t.zhong ? 0.2 : 0.09}" stroke="${C.line}" stroke-width=".8"/>`;
    s += rtext(t.name, (t1 + 7.5) % 360, 474, 27, t.zhong ? C.red : C.ink, t.zhong ? 700 : 600);
    s += rtext(`${t.bj.m}/${t.bj.d}`, (t1 + 7.5) % 360, 428, 14, C.dim, 400);
  });
  // 七十二候环 (405–290)
  order.forEach((t) => {
    const t1 = th(t.lon),
      col = C.s[["春", "夏", "秋", "冬"].indexOf(NW_SEASON_OF[t.name])];
    t.hou.forEach((h, k) => {
      const a = t1 + 5 * k;
      s += `<path d="${sector(290, 405, a, a + 5)}" fill="${col}" fill-opacity="${k === 1 ? 0.05 : 0.11}" stroke="${C.line}" stroke-width=".5"/>`;
      s += rtext(h.name, (a + 2.5) % 360, 348, 12.5, C.ink, 400);
    });
  });
  // 月建环 (290–252)
  Object.entries(NW_JIE_MONTH).forEach(([jn, zb]) => {
    const t = yr.find((x) => x.name === jn),
      bi = ZHI.indexOf(zb),
      t1 = th(t.lon);
    s += `<path d="${sector(252, 290, t1, t1 + 30)}" fill="${C.line}" fill-opacity="${bi % 2 ? 0.14 : 0.24}" stroke="${C.line}" stroke-width=".8"/>`;
    s += rtext(`${zb}月 · ${NW_XIAOXI[bi]}`, (t1 + 15) % 360, 271, 15, C.ink, 500);
  });
  // 伏九环 (252–214)
  const lonAt = (dn) => sunLon(dn - 0.5 - 8 / 24);
  const arc = (x, col, label, size) => {
    const t1 = th(lonAt(x.s)),
      t2 = th(lonAt(x.e + 1)),
      span = (t2 - t1 + 360) % 360;
    s += `<path d="${sector(214, 252, t1, t1 + span)}" fill="${col}" fill-opacity=".55" stroke="${C.bg}" stroke-width="1"/>`;
    if (span >= 4.2) s += rtext(label, (t1 + span / 2) % 360, 233, size, "#fff", 600);
  };
  fu.forEach((x) => arc(x, C.s[1], x.name.replace("伏", ""), 14));
  [...j0, ...j1]
    .filter((x) => x.e >= yr[0].dn && x.s <= yr[23].endDn)
    .forEach((x) => arc(x, C.s[3], x.name.slice(0, 1), 13));
  // 分隔线
  for (let i = 0; i < 24; i++) {
    const [x1, y1] = P(214, i * 15),
      [x2, y2] = P(528, i * 15);
    s += `<line x1="${f1(x1)}" y1="${f1(y1)}" x2="${f1(x2)}" y2="${f1(y2)}" stroke="${C.line}" stroke-width="${i % 2 === 0 ? 1.2 : 0.7}" opacity=".6"/>`;
  }
  [214, 252, 290, 405, 505, 528].forEach((r) => {
    s += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${C.line}" stroke-width="${r === 528 || r === 214 ? 2 : 1}"/>`;
  });
  // 今日
  const now = nowBJ(),
    tdn = nwDayNum(now.y, now.m, now.d);
  if (tdn >= yr[0].dn && tdn <= yr[23].endDn) {
    const t = th(sunLon(nwNowJD())),
      [x1, y1] = P(214, t),
      [x2, y2] = P(540, t),
      [tx, ty] = P(556, t);
    s += `<line x1="${f1(x1)}" y1="${f1(y1)}" x2="${f1(x2)}" y2="${f1(y2)}" stroke="${C.red}" stroke-width="2.2"/><circle cx="${f1(x2)}" cy="${f1(y2)}" r="6" fill="${C.red}"/><text x="${f1(tx)}" y="${f1(ty)}" font-size="15" fill="${C.red}" text-anchor="middle" dominant-baseline="central">今日 ${now.m}/${now.d}</text>`;
  }
  // 中心
  s += `<circle cx="${cx}" cy="${cy}" r="205" fill="${C.bg}" stroke="${C.line}" stroke-width="1"/><circle cx="${cx}" cy="${cy}" r="192" fill="none" stroke="${C.line}" stroke-width=".6" stroke-dasharray="2 5"/>`;
  s += `<text x="${cx}" y="${cy - 100}" font-size="24" fill="${C.dim}" text-anchor="middle" letter-spacing="6">${y}</text><text x="${cx}" y="${cy - 20}" font-family="${KAI}" font-size="112" fill="${C.ink}" text-anchor="middle" letter-spacing="8">${gz}</text>`;
  s += `<text x="${cx}" y="${cy + 42}" font-size="20" fill="${C.red}" text-anchor="middle" letter-spacing="3">${yq.yunName}</text><text x="${cx}" y="${cy + 76}" font-size="18" fill="${C.ink}" text-anchor="middle">司天 ${yq.siTian}</text><text x="${cx}" y="${cy + 104}" font-size="18" fill="${C.ink}" text-anchor="middle">在泉 ${yq.zaiQuan}</text><text x="${cx}" y="${cy + 148}" font-size="13" fill="${C.dim}" text-anchor="middle" letter-spacing="3">上南下北 · 顺时针</text>`;
  // 图例与底栏
  const dfmt = (dn) => {
    const f = fromJD(dn);
    return `${f.m}/${f.d}`;
  };
  const fdz = nwTermDate(270, y - 1, 12),
    cdz = nwTermDate(270, y, 12);
  const jp = nwJiuRanges(y - 1),
    jc = nwJiuRanges(y).filter((x) => x.s <= yr[23].endDn + 9);
  const txt = (t, yy, size, fill, extra) =>
    `<text x="${cx}" y="${yy}" font-size="${size}" fill="${fill}" text-anchor="middle" ${extra || ""}>${t}</text>`;
  const items = (a) => a.map((f) => f.name + " " + dfmt(f.s) + "–" + dfmt(f.e)).join("   ");
  s += txt(
    `<tspan fill="${C.s[1]}" font-weight="700">三伏</tspan>  ${fu.map((f) => f.name + " " + dfmt(f.s) + "–" + dfmt(f.e)).join("   ·   ")}`,
    1452,
    21,
    C.ink,
    'letter-spacing="2"',
  );
  s += txt(
    `<tspan fill="${C.s[3]}" font-weight="700">数九</tspan>  上年冬至(${cdz.y === y ? fdz.m + "/" + fdz.d : ""})起`,
    1494,
    18,
    C.ink,
    'letter-spacing="1"',
  );
  s += txt(items(jp.slice(0, 5)), 1524, 17, C.ink) + txt(items(jp.slice(5)), 1550, 17, C.ink);
  s += txt(`本年冬至(${cdz.m}/${cdz.d})起 · ${items(jc)}`, 1580, 17, C.ink);
  s += `<text x="${cx}" y="1622" font-size="14" fill="${C.dim}" text-anchor="middle">节气时刻据太阳视黄经推算(北京时间,日期取当日);七十二候依历书通行“节气当日起每五日一候”,候名用字各本或有异文。</text>`;
  s += `<text x="${cx}" y="1648" font-size="13" fill="${C.dim}" text-anchor="middle" letter-spacing="3">天机盘 · 节气物候年历</text></svg>`;
  return s;
}
function posterCardHTML(y) {
  return `<div class="panel blk poster-card"><h3 class="sec">年历图 · ${y} 节气物候(可导出印刷)</h3>
   <div class="poster-wrap"><div class="poster-prev" id="posterPrev">${posterSVG(y).replace(/ width="1200" height="1700"/, "")}</div>
   <div class="poster-side"><p class="rt" style="margin:0 0 10px">一张以太阳黄经为轴的年轮:外圈二十四节气(附交节日期),其内为七十二候,再内是十二月建与消息卦、三伏与数九。夏至在上、冬至在下,顺时针依节气次序。</p>
   <div class="row2" id="posterBtns" hidden><button class="gbtn sm" id="posterP1">导出 PNG(标准 1800×2550)</button><button class="gbtn sm" id="posterP2">导出 PNG(高清 3000×4250)</button><button class="gbtn sm" id="posterS">导出 SVG</button></div>
   <p class="note" style="margin:10px 0 0">PNG 适合直接印 A4/A3;SVG 可在设计软件里继续编辑。导出图使用系统宋体/楷体的备用字体(网页字体无法嵌入导出图),若要更好的字形,请把 SVG 在设计软件中换成你的字体。</p></div></div></div>`;
}
async function exportPoster(y, kind) {
  const s = posterSVG(y);
  if (kind === "svg") {
    await saveFile(`节气物候年历-${y}.svg`, s);
    return;
  }
  const sc = kind === "p2" ? 2.5 : 1.5,
    w = Math.round(1200 * sc),
    h = Math.round(1700 * sc),
    img = new Image();
  await new Promise((ok, no) => {
    img.onload = ok;
    img.onerror = () => no(new Error("渲染失败"));
    img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(s);
  });
  const cv = document.createElement("canvas");
  cv.width = w;
  cv.height = h;
  cv.getContext("2d").drawImage(img, 0, 0, w, h);
  const blob = await new Promise((ok) => cv.toBlob(ok, "image/png"));
  if (blob) await saveFile(`节气物候年历-${y}-${w}x${h}.png`, blob);
}
async function bindPoster(y) {
  const dl = await getCap("downloads"),
    bx = $("#posterBtns");
  if (!bx) return;
  if (!dl) {
    return;
  }
  bx.hidden = false;
  $("#posterP1").onclick = () =>
    exportPoster(y, "p1").catch(() => toast("PNG 渲染失败,可改用 SVG"));
  $("#posterP2").onclick = () =>
    exportPoster(y, "p2").catch(() => toast("PNG 渲染失败,可改用 SVG"));
  $("#posterS").onclick = () => exportPoster(y, "svg");
}

/* ================= 圆盘放大查看 · 赞赏 ================= */
const ZM = { box: null };
function zmSize() {
  const bar = $("#zmBar").offsetHeight || 48;
  return Math.max(280, Math.min(window.innerWidth - 16, window.innerHeight - bar - 16));
}
function zmApply() {
  const w = $("#zmWrap"),
    sz = Math.round(zmSize());
  w.style.width = w.style.height = sz + "px";
  pzUpdateZoomLabel($("#dial"));
}
function openZoom() {
  const m = $("#zoomModal"),
    svg = $("#dial");
  if (!m.hidden) return;
  ZM.box = svg.parentNode;
  m.hidden = false;
  $("#zmWrap").appendChild(svg);
  $("#zmWrap").appendChild($("#dialFix"));
  document.body.classList.add("zm-open");
  zmApply();
  pzReset(svg);
  syncZmLayer();
  $("#zmClose").focus();
}
function closeZoom() {
  const m = $("#zoomModal");
  if (m.hidden) return;
  const svg = $("#dial");
  pzReset(svg);
  ZM.box.insertBefore(svg, ZM.box.firstChild);
  ZM.box.insertBefore($("#dialFix"), svg.nextSibling);
  m.hidden = true;
  document.body.classList.remove("zm-open");
  $("#dialZoom").focus();
}
function syncZmLayer() {
  const cur = (document.querySelector("#layerSw button.on") || {}).dataset;
  $$("#zmLayers button").forEach((b) =>
    b.classList.toggle("on", cur && b.dataset.layer === cur.layer),
  );
}
function bindZoom() {
  $("#dialZoom").onclick = openZoom;
  $("#zmClose").onclick = closeZoom;
  $("#zmFit").onclick = () => pzReset($("#dial"));
  $$("#zmLayers button").forEach(
    (b) =>
      (b.onclick = () => {
        setDialLayer(b.dataset.layer);
        syncZmLayer();
      }),
  );
  document.addEventListener("keydown", (e) => {
    if ($("#zoomModal").hidden) return;
    if (e.key === "Escape") closeZoom();
    else if (e.key === "0") pzReset($("#dial"));
    else if (e.key === "+" || e.key === "=") pzZoomCenter($("#dial"), 1.18);
    else if (e.key === "-") pzZoomCenter($("#dial"), 1 / 1.18);
  });
  window.addEventListener("resize", () => {
    if (!$("#zoomModal").hidden) zmApply();
  });
}
function bindTip() {
  const set = () => {
    $$(".tipimg").forEach((i) => {
      i.src = DONATE_IMG;
    });
  };
  set();
  const m = $("#tipModal"),
    close = () => {
      m.hidden = true;
    };
  $("#tipBtn").onclick = () => {
    m.hidden = false;
    $("#tipClose").focus();
  };
  m.addEventListener("click", (e) => {
    if (e.target === m) close();
  });
  $("#tipClose").onclick = close;
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !m.hidden) close();
  });
}

/* ================= 通用圆盘交互:滚轮缩放 / 拖拽平移 ================= */
const PZ = new WeakMap();
const PZ_SEL =
  "#dial,svg.wheel,svg.orrery,#hsSvg,.ht-fig svg,svg.jl-ring,#smDome,#smTop,#orrHelioSvg,#shSvg,#jfSvg,#lpSvg,#brSvg,#ntSvg,svg.vd-nsvg,.p5-fig svg";
const PZ_OWNED_IDS = new Set([
  "ljSvg",
  "lrpSvg",
  "qtpSvg",
  "typSvg",
  "xapSvg",
  "htdSvg",
  "msgSvg",
  "zlfSvg",
  "lgbSvg",
  "tspSvg",
  "jc12Svg",
  "hhdSvg",
  "jtsSvg",
  "stuSvg",
]);

function pzNums(v) {
  return (v || "")
    .trim()
    .split(/[\s,]+/)
    .map(Number)
    .filter(Number.isFinite);
}
function pzEligible(svg) {
  /* 盘库巨盘有自己独立的缩放 / 平移 / 环带旋转坐标系。
     绝不能再接入通用 SVG pan/zoom，否则拖环时两套 pointer 逻辑会同时运行，造成整盘漂移。
     原盘 #dial 在盘库中同样锁定：它是巨盘核心，不允许单独被拖走或缩放。 */
  if (!svg || svg.tagName !== "svg" || svg.id === "dialFix" || PZ_OWNED_IDS.has(svg.id))
    return false;
  if (svg.id === "dial" && svg.closest && svg.closest(".stu")) return false;
  if (svg.matches(PZ_SEL)) return true;
  const n = pzNums(svg.getAttribute("viewBox"));
  if (n.length !== 4) return false;
  const w = n[2],
    h = n[3],
    a = w / h,
    lab = svg.getAttribute("aria-label") || "";
  return (
    Math.min(w, h) >= 280 &&
    a > 0.82 &&
    a < 1.18 &&
    /(盘|罗盘|星盘|圆盘|方位|河图|洛书|天穹|时辰环|俯视)/.test(lab)
  );
}
function pzState(svg) {
  let s = PZ.get(svg);
  if (s) return s;
  const n = pzNums(svg.getAttribute("viewBox"));
  if (n.length !== 4) return null;
  s = {
    base: { x: n[0], y: n[1], w: n[2], h: n[3] },
    x: n[0],
    y: n[1],
    w: n[2],
    h: n[3],
    z: 1,
    drag: false,
    moved: false,
    pid: null,
    sx: 0,
    sy: 0,
    ox: 0,
    oy: 0,
  };
  PZ.set(svg, s);
  svg.classList.add("pz-svg");
  svg.dataset.panzoom = "1";
  if (!svg.hasAttribute("tabindex")) svg.setAttribute("tabindex", "0");
  return s;
}
function pzApply(svg, s) {
  svg.setAttribute("viewBox", `${s.x} ${s.y} ${s.w} ${s.h}`);
  pzUpdateZoomLabel(svg);
}
function pzUpdateZoomLabel(svg) {
  if (!svg) return;
  const s = PZ.get(svg),
    lab = $("#zmZoom");
  if (lab && svg.id === "dial" && !$("#zoomModal").hidden)
    lab.textContent = Math.round((s ? s.z : 1) * 100) + "%";
}
function pzReset(svg) {
  const s = pzState(svg);
  if (!s) return;
  s.x = s.base.x;
  s.y = s.base.y;
  s.w = s.base.w;
  s.h = s.base.h;
  s.z = 1;
  s.drag = false;
  s.moved = false;
  svg.classList.remove("pz-dragging");
  pzApply(svg, s);
}
function pzZoomAt(svg, f, cx, cy) {
  const s = pzState(svg);
  if (!s) return;
  const nz = Math.max(0.65, Math.min(6, s.z * f));
  if (Math.abs(nz - s.z) < 1e-6) return;
  const rect = svg.getBoundingClientRect();
  if (!rect.width || !rect.height) return;
  let nx = Math.max(0, Math.min(1, (cx - rect.left) / rect.width)),
    ny = Math.max(0, Math.min(1, (cy - rect.top) / rect.height));
  // 主天机盘持续旋转，缩放以圆心为锚点可避免旋转后的外接矩形造成光标定位漂移
  if (svg.id === "dial") {
    nx = 0.5;
    ny = 0.5;
  }
  const px = s.x + nx * s.w,
    py = s.y + ny * s.h,
    nw = s.base.w / nz,
    nh = s.base.h / nz;
  s.x = px - nx * nw;
  s.y = py - ny * nh;
  s.w = nw;
  s.h = nh;
  s.z = nz;
  pzApply(svg, s);
}
function pzZoomCenter(svg, f) {
  if (!svg) return;
  const r = svg.getBoundingClientRect();
  pzZoomAt(svg, f, r.left + r.width / 2, r.top + r.height / 2);
}
function pzScan(root = document) {
  const a = [];
  if (root.nodeType === 1 && root.matches && pzEligible(root)) a.push(root);
  if (root.querySelectorAll) root.querySelectorAll(PZ_SEL).forEach((x) => a.push(x));
  a.forEach((svg) => {
    if (pzEligible(svg)) pzState(svg);
  });
}
function pzBind() {
  pzScan(document);
  document.addEventListener(
    "wheel",
    (e) => {
      const svg = e.target.closest && e.target.closest("svg");
      if (!pzEligible(svg)) return;
      e.preventDefault();
      const f = Math.exp(-Math.max(-120, Math.min(120, e.deltaY)) * 0.0022);
      pzZoomAt(svg, f, e.clientX, e.clientY);
    },
    { passive: false, capture: true },
  );

  document.addEventListener(
    "pointerdown",
    (e) => {
      const svg = e.target.closest && e.target.closest("svg");
      if (!pzEligible(svg) || e.button !== 0) return;
      // 手动罗盘保留“Shift + 拖动 = 旋转”；普通拖动一律用于平移查看
      if (svg.id === "dial" && typeof CP !== "undefined" && CP.mode === "manual" && e.shiftKey)
        return;
      const s = pzState(svg);
      if (!s) return;
      s.drag = true;
      s.moved = false;
      s.pid = e.pointerId;
      s.sx = e.clientX;
      s.sy = e.clientY;
      s.ox = s.x;
      s.oy = s.y;
      svg.classList.add("pz-dragging");
      try {
        svg.setPointerCapture(e.pointerId);
      } catch (_) {}
      e.preventDefault();
    },
    true,
  );

  document.addEventListener(
    "pointermove",
    (e) => {
      const svg = e.target.closest && e.target.closest("svg");
      // pointer capture 后 target 仍可能是原 SVG；若不是，则从已拖动的 SVG 中找
      let target = svg && PZ.get(svg) && PZ.get(svg).drag ? svg : null;
      if (!target) {
        document.querySelectorAll(".pz-svg.pz-dragging").forEach((x) => {
          const s = PZ.get(x);
          if (!target && s && s.drag && s.pid === e.pointerId) target = x;
        });
      }
      if (!target) return;
      const s = PZ.get(target),
        r = target.getBoundingClientRect();
      if (!r.width || !r.height) return;
      const dx = e.clientX - s.sx,
        dy = e.clientY - s.sy;
      if (Math.abs(dx) + Math.abs(dy) > 3) s.moved = true;
      let ux = dx,
        uy = dy;
      // #dial 有 CSS 旋转：把屏幕拖动量逆旋转回 SVG 坐标，保证“往哪拖就往哪移动”
      if (target.id === "dial" && typeof CP !== "undefined") {
        const a = (-CP.theta * Math.PI) / 180,
          c = Math.cos(a),
          sn = Math.sin(a);
        ux = dx * c - dy * sn;
        uy = dx * sn + dy * c;
      }
      s.x = s.ox - (ux / r.width) * s.w;
      s.y = s.oy - (uy / r.height) * s.h;
      pzApply(target, s);
      e.preventDefault();
    },
    true,
  );

  const end = (e) => {
    document.querySelectorAll(".pz-svg.pz-dragging").forEach((svg) => {
      const s = PZ.get(svg);
      if (!s || !s.drag || (e.pointerId !== undefined && s.pid !== e.pointerId)) return;
      s.drag = false;
      s.pid = null;
      svg.classList.remove("pz-dragging");
      if (s.moved) {
        svg.dataset.pzMoved = "1";
        setTimeout(() => {
          delete svg.dataset.pzMoved;
        }, 0);
      }
    });
  };
  document.addEventListener("pointerup", end, true);
  document.addEventListener("pointercancel", end, true);
  document.addEventListener(
    "click",
    (e) => {
      const svg = e.target.closest && e.target.closest('svg[data-pz-moved="1"]');
      if (svg) {
        e.preventDefault();
        e.stopPropagation();
      }
    },
    true,
  );
  document.addEventListener(
    "dblclick",
    (e) => {
      const svg = e.target.closest && e.target.closest("svg");
      if (pzEligible(svg)) {
        e.preventDefault();
        pzReset(svg);
      }
    },
    true,
  );

  if ("MutationObserver" in window) {
    new MutationObserver((ms) =>
      ms.forEach((m) => {
        const t = m.target && m.target.nodeType === 1 ? m.target : null;
        if (t && t.closest && t.closest("#orr3dInfo,#tradAstroSvg,#tradAstroInfo,#clock,#log"))
          return;
        m.addedNodes.forEach((n) => {
          if (n.nodeType === 1) pzScan(n);
        });
      }),
    ).observe(document.body, { childList: true, subtree: true });
  }
}

/* ================= 罗盘:三盘二十四山 · 缓缓运转 · 朝向读数 · 手动/指南针 ================= */
const CP_MTN = [
  "子",
  "癸",
  "丑",
  "艮",
  "寅",
  "甲",
  "卯",
  "乙",
  "辰",
  "巽",
  "巳",
  "丙",
  "午",
  "丁",
  "未",
  "坤",
  "申",
  "庚",
  "酉",
  "辛",
  "戌",
  "乾",
  "亥",
  "壬",
]; // 自正北起顺时针,每山 15°
const CP_RING = [
  { key: "di", name: "地盘正针", off: 0, r1: 354, r2: 378 },
  { key: "ren", name: "人盘中针", off: -7.5, r1: 330, r2: 354 },
  { key: "tian", name: "天盘缝针", off: 7.5, r1: 306, r2: 330 },
];
const CP_WX = {
  甲: "木",
  乙: "木",
  丙: "火",
  丁: "火",
  庚: "金",
  辛: "金",
  壬: "水",
  癸: "水",
  子: "水",
  丑: "土",
  寅: "木",
  卯: "木",
  辰: "土",
  巳: "火",
  午: "火",
  未: "土",
  申: "金",
  酉: "金",
  戌: "土",
  亥: "水",
  乾: "金",
  坤: "土",
  艮: "土",
  巽: "木",
};
const CP_YUAN_CLS = { 天元: "lp-tian", 地元: "lp-di", 人元: "lp-ren" };
function cpInfoOf(m) {
  // 元龙与所属卦,取自玄空山表(地元、天元、人元)
  for (const p of [1, 2, 3, 4, 6, 7, 8, 9]) {
    const k = XK_MTN[p].indexOf(m);
    if (k >= 0) return { yuan: ["地元", "天元", "人元"][k], gua: XK_PAL_NAME[p] };
  }
  return { yuan: "", gua: "" };
}
const CP_INFO = {};
CP_MTN.forEach((m) => (CP_INFO[m] = cpInfoOf(m)));
const cpNorm = (a) => ((a % 360) + 360) % 360;
function cpIdx(bearing, off) {
  return Math.floor(cpNorm(bearing - off + 7.5) / 15) % 24;
}
function cpRing(bearing, ring) {
  const b = cpNorm(bearing),
    i = cpIdx(b, ring.off),
    c = cpNorm(15 * i + ring.off),
    d = Math.abs(((b - c + 540) % 360) - 180),
    edge = 7.5 - d;
  const m = CP_MTN[i],
    inf = CP_INFO[m];
  return {
    m,
    i,
    yuan: inf.yuan,
    gua: inf.gua,
    wx: CP_WX[m],
    edge,
    near: edge < 3,
    dev: ((b - c + 540) % 360) - 180,
  };
}
function cpDirText(h) {
  h = cpNorm(h);
  const c = Math.round(h / 90) % 4,
    cen = c * 90,
    d = ((h - cen + 540) % 360) - 180,
    nm = ["北", "东", "南", "西"][c];
  if (Math.abs(d) < 0.05) return "正" + nm;
  const nx = ["东", "南", "西", "北"],
    pv = ["西", "北", "东", "南"];
  return nm + "偏" + (d > 0 ? nx[c] : pv[c]) + Math.abs(d).toFixed(1) + "°";
}
function cpRead(h) {
  h = cpNorm(h);
  const z = cpNorm(h + 180),
    out = { h, z, rows: [] };
  CP_RING.forEach((r) => out.rows.push({ ring: r, x: cpRing(h, r), z: cpRing(z, r) }));
  const bagua = [
    ["坎", 0],
    ["艮", 45],
    ["震", 90],
    ["巽", 135],
    ["离", 180],
    ["坤", 225],
    ["兑", 270],
    ["乾", 315],
  ];
  const g = bagua.reduce((a, b) =>
    Math.abs(((h - b[1] + 540) % 360) - 180) < Math.abs(((h - a[1] + 540) % 360) - 180) ? b : a,
  );
  out.gua = g[0];
  out.guaEdge = 22.5 - Math.abs(((h - g[1] + 540) % 360) - 180);
  return out;
}
/* ---- 盘面图层 ---- */
const CP = {
  theta: 0,
  mode: "auto",
  speed: 0.6,
  drag: false,
  last: 0,
  visible: true,
  decl: 0,
  txt: { di: [], ren: [], tian: [] },
  hl: {},
  sensorOK: false,
  readKey: "",
};
function buildCompassLayer(ring) {
  const g = ring(1, 1.4);
  g.setAttribute("class", "lx lx-lp");
  dial.layerG.lp = g;
  const A = (b) => b - 180; // 方位角 → 盘面角度(南在上)
  E("circle", { r: 404, class: "ln" }, g);
  E("circle", { r: 390, class: "ln2" }, g);
  E("circle", { r: 304, class: "ln" }, g);
  // 刻度:1° / 5° / 15°
  let d1 = "",
    d5 = "",
    d15 = "";
  for (let b = 0; b < 360; b++) {
    const [x1, y1] = P(390, A(b)),
      len = b % 15 === 0 ? 13 : b % 5 === 0 ? 8 : 4,
      [x2, y2] = P(390 + len, A(b)),
      s = `M${x1.toFixed(1)} ${y1.toFixed(1)}L${x2.toFixed(1)} ${y2.toFixed(1)}`;
    if (b % 15 === 0) d15 += s;
    else if (b % 5 === 0) d5 += s;
    else d1 += s;
  }
  E("path", { d: d1, class: "lp-tk1" }, g);
  E("path", { d: d5, class: "lp-tk5" }, g);
  E("path", { d: d15, class: "lp-tk15" }, g);
  for (let b = 0; b < 360; b += 15) txt(g, String(b), 383, A(b), "lp-dg", 8);
  CP_RING.forEach((r) => {
    E("circle", { r: r.r1, class: "ln2" }, g);
    for (let i = 0; i < 24; i++) {
      const c = 15 * i + r.off,
        m = CP_MTN[i];
      line(g, r.r1, r.r2, A(c - 7.5), "sep");
      const t = txt(
        g,
        m,
        (r.r1 + r.r2) / 2,
        A(c),
        "lp-t " + CP_YUAN_CLS[CP_INFO[m].yuan],
        r.key === "di" ? 15 : 13,
      );
      CP.txt[r.key][i] = t;
    }
  });
  // 磁针(红头指南,固定于盘体)
  E("path", { d: "M0 -96L5 0L0 22L-5 0Z", class: "lp-nd-s" }, g);
  E("path", { d: "M0 96L5 0L0 -22L-5 0Z", class: "lp-nd-n" }, g);
  E("circle", { r: 3.2, class: "lp-nd-c" }, g);
}
/* ---- 旋转引擎 ---- */
function cpApply() {
  const svg = $("#dial");
  if (!svg) return;
  svg.style.transform = `rotate(${CP.theta.toFixed(3)}deg)`;
  cpUpdateRead();
}
function cpHeading() {
  return cpNorm(180 - CP.theta);
} // 固定朱针所指的方位角(向)
function cpSetHeading(h) {
  CP.theta = cpNorm(180 - h);
  cpApply();
}
function cpFrame(ts) {
  if (CP.mode !== "auto" || document.hidden || !CP.visible || CP.drag) {
    CP.last = ts;
    CP.raf = 0;
    return;
  }
  if (CP.last) {
    CP.theta = cpNorm(CP.theta + CP.speed * Math.min(0.25, (ts - CP.last) / 1000));
    $("#dial").style.transform = `rotate(${CP.theta.toFixed(3)}deg)`;
    if (ts - (CP.tRead || 0) > 250) {
      CP.tRead = ts;
      cpUpdateRead();
    }
  }
  CP.last = ts;
  CP.raf = requestAnimationFrame(cpFrame);
}
function cpUpdateRead() {
  const h = cpHeading(),
    o = cpRead(h),
    key = [o.h.toFixed(1), CP.mode].join("|");
  // 高亮当前指针下的山
  CP_RING.forEach((r, k) => {
    const cur = o.rows[k].x.i,
      prev = CP.hl[r.key];
    if (prev !== cur) {
      if (prev !== undefined && CP.txt[r.key][prev]) CP.txt[r.key][prev].classList.remove("on");
      if (CP.txt[r.key][cur]) CP.txt[r.key][cur].classList.add("on");
      CP.hl[r.key] = cur;
    }
  });
  const box = $("#cpRead");
  if (!box || CP.readKey === key) return;
  CP.readKey = key;
  const cell = (x) =>
    `<span class="cpm ${CP_YUAN_CLS[x.yuan]}">${x.m}</span> <small>${x.yuan}·${x.gua}·${x.wx}</small>${x.near ? ` <em class="cpw" title="距山界不足 3°,读数误差可能改变所在山">近界 ${x.edge.toFixed(1)}°</em>` : ` <small class="dim">距界 ${x.edge.toFixed(1)}°</small>`}`;
  box.innerHTML = `<div class="cp-h"><b>${o.h.toFixed(1)}°</b> <span>${cpDirText(o.h)}</span> <small class="dim">朝向(向) · 坐山方位 ${o.z.toFixed(1)}°</small></div>
   <table class="tbl sm cptbl"><thead><tr><th>盘</th><th>向山</th><th>坐山</th></tr></thead><tbody>${o.rows.map((r) => `<tr><td>${r.ring.name}</td><td>${cell(r.x)}</td><td>${cell(r.z)}</td></tr>`).join("")}</tbody></table>
   <div class="cp-g">向在<b>${o.gua}</b>卦范围${o.guaEdge < 3 ? ` <em class="cpw">近卦界 ${o.guaEdge.toFixed(1)}°(易涉出卦/替卦;本页玄空未含替卦)</em>` : ""}</div>`;
  const inp = $("#cpDeg");
  if (inp && document.activeElement !== inp) inp.value = o.h.toFixed(1);
  const zr = $("#zmRead");
  if (zr) zr.textContent = `向 ${o.h.toFixed(1)}° ${o.rows[0].x.m}山`;
  const bx = $("#cpXk");
  if (bx) bx.textContent = `以此朝向排玄空:坐${o.rows[0].z.m}向${o.rows[0].x.m}`;
}
/* ---- 模式 ---- */
function cpMode(m) {
  if (CP.mode === "sensor" && m !== "sensor") cpSensorStop();
  CP.mode = m;
  CP.readKey = "";
  $$("#cpModes button").forEach((b) => b.classList.toggle("on", b.dataset.mode === m));
  document
    .querySelectorAll(".dialbox,#zmWrap")
    .forEach((e) => e.classList.toggle("cp-manual", m === "manual"));
  const sp = $("#cpSpeedW");
  if (sp) sp.hidden = m !== "auto";
  const dc = $("#cpDeclW");
  if (dc) dc.hidden = m !== "sensor";
  if (m === "sensor") cpSensorStart();
  cpUpdateRead();
  if (m === "auto" && !document.hidden && !CP.raf) CP.raf = requestAnimationFrame(cpFrame);
}
function cpBindDrag(el) {
  el.addEventListener("pointerdown", (e) => {
    if (el.closest && el.closest(".stu")) return; /* 盘库内原盘锁定，禁止单独手动旋转 */
    if (CP.mode !== "manual" || e.button > 0 || !e.shiftKey) return;
    const r = el.getBoundingClientRect();
    CP.cx = r.left + r.width / 2;
    CP.cy = r.top + r.height / 2;
    CP.p0 = (Math.atan2(e.clientY - CP.cy, e.clientX - CP.cx) * 180) / Math.PI;
    CP.t0 = CP.theta;
    CP.drag = true;
    try {
      el.setPointerCapture(e.pointerId);
    } catch (_) {}
    e.preventDefault();
  });
  el.addEventListener("pointermove", (e) => {
    if (!CP.drag) return;
    const p = (Math.atan2(e.clientY - CP.cy, e.clientX - CP.cx) * 180) / Math.PI;
    CP.theta = cpNorm(CP.t0 + (p - CP.p0));
    cpApply();
  });
  const end = () => {
    CP.drag = false;
  };
  el.addEventListener("pointerup", end);
  el.addEventListener("pointercancel", end);
  el.addEventListener("keydown", (e) => {
    if (el.closest && el.closest(".stu")) return;
    if (CP.mode !== "manual") return;
    const st = e.shiftKey ? 1 : 5;
    if (e.key === "ArrowRight") {
      CP.theta = cpNorm(CP.theta + st);
      cpApply();
      e.preventDefault();
    } else if (e.key === "ArrowLeft") {
      CP.theta = cpNorm(CP.theta - st);
      cpApply();
      e.preventDefault();
    }
  });
}
/* ---- 手机指南针(需设备与浏览器授权;取磁北读数并加磁偏角)---- */
let _cpH = null,
  _cpGot = false;
function cpOnOrient(e) {
  let hd = null;
  if (typeof e.webkitCompassHeading === "number") hd = e.webkitCompassHeading;
  else if (
    e.alpha !== null &&
    e.alpha !== undefined &&
    (e.absolute || e.type === "deviceorientationabsolute")
  )
    hd = cpNorm(360 - e.alpha);
  if (hd === null) return;
  _cpGot = true;
  const t = cpNorm(hd + CP.decl);
  _cpH = _cpH === null ? t : cpNorm(_cpH + (((t - _cpH + 540) % 360) - 180) * 0.25); // 低通平滑,处理 0/360 跨越
  if (CP.mode === "sensor") cpSetHeading(_cpH);
}
async function cpSensorStart() {
  _cpGot = false;
  _cpH = null;
  try {
    if (typeof DeviceOrientationEvent === "undefined") throw new Error("nosupport");
    if (typeof DeviceOrientationEvent.requestPermission === "function") {
      const r = await DeviceOrientationEvent.requestPermission();
      if (r !== "granted") throw new Error("denied");
    }
    window.addEventListener("deviceorientationabsolute", cpOnOrient, true);
    window.addEventListener("deviceorientation", cpOnOrient, true);
    setTimeout(() => {
      if (CP.mode === "sensor" && !_cpGot) {
        toast("未收到指南针数据:此设备或当前嵌入环境不提供方向传感器");
        cpMode("manual");
      }
    }, 2500);
  } catch (e) {
    toast(e.message === "denied" ? "未获得方向传感器授权" : "此设备或浏览器不支持指南针");
    cpMode("manual");
  }
}
function cpSensorStop() {
  window.removeEventListener("deviceorientationabsolute", cpOnOrient, true);
  window.removeEventListener("deviceorientation", cpOnOrient, true);
}
/* ---- 面板 ---- */
function cpPanelHTML() {
  return `<div class="cp-box" id="compassBox"><div class="cp-row"><span class="cp-l">罗盘</span><span class="cp-modes" id="cpModes"><button data-mode="auto" class="on">缓转</button><button data-mode="still">静止</button><button data-mode="manual">手动转盘</button><button data-mode="sensor">指南针</button></span>
   <label id="cpSpeedW" class="sm dim">转速<select id="cpSpeed"><option value=".25">很慢</option><option value=".6" selected>缓慢</option><option value="2">稍快</option></select></label>
   <label id="cpDeclW" class="sm dim" hidden>磁偏角°<input type="number" id="cpDecl" value="0" step="0.5" min="-30" max="30" title="东偏为正,西偏为负;指南针读磁北,填入后换算为真北"></label></div>
   <div class="cp-row"><label class="sm dim">朝向<input type="number" id="cpDeg" min="0" max="360" step="0.5" value="180"></label><button class="gbtn sm" id="cpGo">转到</button><button class="gbtn sm" id="cpSnap" title="吸附到地盘山的中线">吸附山中线</button><button class="gbtn sm" id="cpXk">以此朝向排玄空</button></div>
   <div id="cpRead" class="cp-read"></div>
   <p class="note" style="margin:6px 0 0">圆盘南在上、北在下(传统罗盘方位)。固定的朱红线为朝向线:线的上端指“向”,下端为“坐”。圆盘默认可按住拖动平移查看；手动转盘模式下按住 Shift 再拖动可旋转罗盘，也可用 ←/→ 键(Shift 为微调)转动。地盘正针为子午正中;人盘中针较地盘逆转 7.5°,天盘缝针顺转 7.5°(通行说法)。七十二龙与一百二十分金各家分歧,本页未收。</p></div>`;
}
function bindCompass() {
  const bx = $("#compassBox");
  if (!bx) return;
  $$("#cpModes button").forEach((b) => (b.onclick = () => cpMode(b.dataset.mode)));
  $("#cpSpeed").onchange = (e) => {
    CP.speed = parseFloat(e.target.value);
  };
  $("#cpDecl").onchange = (e) => {
    CP.decl = parseFloat(e.target.value) || 0;
  };
  const go = () => {
    const v = parseFloat($("#cpDeg").value);
    if (isNaN(v)) return;
    if (CP.mode === "auto" || CP.mode === "sensor") cpMode("manual");
    cpSetHeading(v);
  };
  $("#cpGo").onclick = go;
  $("#cpDeg").addEventListener("keydown", (e) => {
    if (e.key === "Enter") go();
  });
  $("#cpSnap").onclick = () => {
    if (CP.mode === "auto" || CP.mode === "sensor") cpMode("manual");
    cpSetHeading(Math.round(cpHeading() / 15) * 15);
  };
  $("#cpXk").onclick = () => {
    const o = cpRead(cpHeading()),
      zuo = o.rows[0].z.m;
    XKS.zuo = zuo;
    selectTab("xk");
    setTimeout(() => {
      const s = $("#xkZuo");
      if (s) {
        s.value = zuo;
        s.dispatchEvent(new Event("change"));
        s.dispatchEvent(new Event("input"));
      }
      toast(`已按地盘正针:坐${zuo}向${o.rows[0].x.m}${o.rows[0].z.near ? "(近山界,请复核)" : ""}`);
    }, 60);
  };
  document.querySelectorAll(".dialbox").forEach(cpBindDrag);
  cpBindDrag($("#zmWrap"));
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(
      (es) => {
        CP.visible = es.some((e) => e.isIntersecting) || !$("#zoomModal").hidden;
      },
      { threshold: 0 },
    ).observe($(".dialbox"));
  }
  cpMode(REDUCE ? "still" : "auto");
  cpApply();
  if (CP.mode === "auto" && !document.hidden && !CP.raf) CP.raf = requestAnimationFrame(cpFrame);
}

/* ================= 万年历(顶栏时间处打开) ================= */
const CAL_ST = {
  y: 0,
  m: 0,
  sel: null,
  ws: 0,
  layers: { term: 1, fest: 1, deity: 1, hol: 1, hd: 1, phase: 1, mine: 1, memo: 0 },
  yi: "",
  on: false,
  range: "m",
  open: { ov: 1, zj: 1, yj: 1, fe: 1, hr: 0, js: 0, pos: 0, zx: 0, mine: 1, tool: 0, exp: 0 },
};
const CAL_YI_LIST = [
  "嫁娶",
  "订盟",
  "纳采",
  "祈福",
  "求嗣",
  "开光",
  "出行",
  "赴任",
  "入学",
  "会亲友",
  "开市",
  "交易",
  "立券",
  "纳财",
  "入宅",
  "移徙",
  "安床",
  "动土",
  "修造",
  "安葬",
  "求医",
  "栽种",
];
const CAL_LAYERS = [
  ["term", "节气"],
  ["fest", "节日"],
  ["deity", "神诞"],
  ["hol", "假期"],
  ["hd", "黄黑道"],
  ["phase", "月相"],
  ["mine", "我的日子"],
  ["memo", "纪念日"],
];
const _calCache = {};
try {
  const o = JSON.parse(localStorage.getItem("tianjipan.cal") || "null");
  if (o) {
    if (o.ws === 0 || o.ws === 1) CAL_ST.ws = o.ws;
    if (o.layers) Object.assign(CAL_ST.layers, o.layers);
  }
} catch (e) {}
const calSave = () => {
  try {
    localStorage.setItem("tianjipan.cal", JSON.stringify({ ws: CAL_ST.ws, layers: CAL_ST.layers }));
  } catch (e) {}
};
function calGet(y, m, d) {
  const k = y + "-" + m + "-" + d;
  if (!_calCache[k]) {
    if (Object.keys(_calCache).length > 500) for (const x in _calCache) delete _calCache[x];
    _calCache[k] = calDay(y, m, d);
  }
  return _calCache[k];
}
/* 我的日子(本地保存) */
function calMineLoad() {
  try {
    return JSON.parse(localStorage.getItem("tianjipan.cal.mine") || "[]");
  } catch (e) {
    return [];
  }
}
function calMineSave(a) {
  try {
    localStorage.setItem("tianjipan.cal.mine", JSON.stringify(a));
  } catch (e) {
    toast("本地存储不可用,无法保存");
  }
}
const calKey = (s) => `${s.y}-${s.m}-${s.d}`;
function calToday() {
  const n = nowBJ();
  return { y: n.y, m: n.m, d: n.d };
}
function calOpen(dt) {
  const t = dt || calToday();
  CAL_ST.y = t.y;
  CAL_ST.m = t.m;
  CAL_ST.sel = { y: t.y, m: t.m, d: t.d };
  const m = $("#calModal");
  m.hidden = false;
  document.body.classList.add("zm-open");
  calRender();
  setTimeout(() => {
    const b = $("#calClose");
    if (b) b.focus();
  }, 0);
}
/* ---- 格子 ---- */
function calLabels(c) {
  const L = CAL_ST.layers,
    out = [];
  const hn = c.hol ? c.hol.name.replace(/节$/, "") : "";
  if (L.hol && c.hol)
    out.push({ c: c.hol.work ? "hol wk" : "hol", t: hn + (c.hol.work ? "补班" : "") });
  const same = (x) => L.hol && c.hol && x.replace(/节$/, "") === hn;
  if (L.fest) {
    c.fest.solar.filter((x) => !same(x)).forEach((x) => out.push({ c: "fe", t: x }));
    c.fest.lunar.filter((x) => !same(x)).forEach((x) => out.push({ c: "fe", t: x }));
    c.fest.other.forEach((x) => out.push({ c: "fe2", t: x }));
  }
  if (L.term && c.term) out.push({ c: c.term.zhong ? "tm z" : "tm", t: c.term.name });
  if (L.deity) {
    c.fest.tao
      .filter((x) => x.name.includes("诞"))
      .forEach((x) =>
        out.push({
          c: "dt",
          t: x.name.replace(/[(（].*?[)）]/g, "").replace(/圣诞|诞辰|诞$/, "诞"),
          f: x.name,
        }),
      );
    c.fest.foto.forEach((x) => {
      if (x.includes("诞")) out.push({ c: "dt", t: x.replace(/圣诞$/, "诞"), f: x });
    });
    c.fest.folk.forEach((x) =>
      out.push({ c: "dt f", t: x.name.replace(/[(（].*?[)）]/g, ""), f: x.name }),
    );
  }
  if (L.memo) c.fest.so.forEach((x) => out.push({ c: "me", t: x }));
  return out;
}
function calGridHTML() {
  const y = CAL_ST.y,
    m = CAL_ST.m,
    ws = CAL_ST.ws,
    today = calToday(),
    wd = calWeekday(y, m, 1),
    off = (wd - ws + 7) % 7,
    rows = Math.ceil((off + calDim(y, m)) / 7);
  const st = calAddDays(y, m, 1, -off),
    heads = [...Array(7)]
      .map((_, i) => {
        const w = (ws + i) % 7;
        return `<div class="ch${w === 0 || w === 6 ? " red" : ""}" role="columnheader">${w === 0 ? "日" : CAL_WEEK[w]}</div>`;
      })
      .join("");
  let cells = "";
  for (let i = 0; i < rows * 7; i++) {
    const t = calAddDays(st.y, st.m, st.d, i),
      c = calGet(t.y, t.m, t.d);
    cells += calCellHTML(
      c,
      t.y,
      t.m,
      t.d,
      t.y === y && t.m === m,
      t.y === today.y && t.m === today.m && t.d === today.d,
    );
  }
  return `<div class="cal-heads" role="row">${heads}</div><div class="cal-grid" id="calGrid" role="grid" aria-label="${y}年${m}月">${cells}</div>`;
}
/* ---- 详情 ---- */
const calSec = (id, title, body, extra) =>
  `<details class="csec" data-k="${id}"${CAL_ST.open[id] ? " open" : ""}><summary>${title}${extra || ""}</summary><div class="csb">${body}</div></details>`;
const calChips = (a, cls) =>
  a && a.length
    ? a.map((x) => `<span class="pill ${cls || ""}">${esc(x)}</span>`).join("")
    : '<span class="dim">—</span>';
function calText() {
  const s = CAL_ST.sel,
    c = calGet(s.y, s.m, s.d),
    lu = c.lunar;
  return [
    `${s.y}年${s.m}月${s.d}日 星期${CAL_WEEK[c.week]}`,
    `农历${c.lfull} ${c.zodiac}年 ${c.gz}日(${c.nayin})`,
    `建除:${c.zx}日 · ${c.ts}(${c.huang ? "黄道" : "黑道"}) · ${c.xiu} · 冲${c.chong}煞${c.sha}`,
    c.term ? `节气:${c.term.name} ${c.term.time}` : "",
    [
      ...c.fest.solar,
      ...c.fest.lunar,
      ...c.fest.other,
      ...(c.hol ? [c.hol.name + (c.hol.work ? "(调休上班)" : "(放假)")] : []),
    ].join("、")
      ? `节日:${[...c.fest.solar, ...c.fest.lunar, ...c.fest.other, ...(c.hol ? [c.hol.name + (c.hol.work ? "(调休上班)" : "(放假)")] : [])].join("、")}`
      : "",
    [...c.fest.tao.map((x) => x.name), ...c.fest.foto, ...c.fest.folk.map((x) => x.name)].length
      ? `神诞:${[...c.fest.tao.map((x) => x.name), ...c.fest.foto, ...c.fest.folk.map((x) => x.name)].join("、")}`
      : "",
    `宜:${c.yi.join(" ") || "—"}`,
    `忌:${c.ji.join(" ") || "—"}`,
    `财神${CAL_DIR[c.pos.cai]} 喜神${CAL_DIR[c.pos.xi]} 福神${CAL_DIR[c.pos.fu]}`,
    `彭祖百忌:${c.pz}`,
  ]
    .filter(Boolean)
    .join("\n");
}
/* ---- 渲染与交互 ---- */
function calGo(y, m) {
  if (y < 1901) {
    y = 1901;
    m = 1;
  }
  if (y > 2099) {
    y = 2099;
    m = 12;
  }
  CAL_ST.y = y;
  CAL_ST.m = m;
  CAL_ST.sel = { y, m, d: Math.min(CAL_ST.sel ? CAL_ST.sel.d : 1, calDim(y, m)) };
  calRender();
}
function calSelect(t, focus) {
  CAL_ST.sel = { y: t.y, m: t.m, d: t.d };
  if (t.y !== CAL_ST.y || t.m !== CAL_ST.m) {
    CAL_ST.y = t.y;
    CAL_ST.m = t.m;
  }
  calRender();
  if (focus) {
    const el = document.querySelector(
      `#calGrid .cc[data-y="${t.y}"][data-m="${t.m}"][data-d="${t.d}"]`,
    );
    if (el) el.focus();
  }
  if (window.innerWidth < 900) {
    const d = $("#calDetail");
    if (d) d.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }
}
function bindCal() {
  const open = () => calOpen();
  $("#calBtn").onclick = open;
  const ck = $("#clock");
  if (ck) {
    ck.setAttribute("role", "button");
    ck.setAttribute("tabindex", "0");
    ck.setAttribute("title", "点击打开万年历");
    ck.style.cursor = "pointer";
    ck.onclick = open;
    ck.onkeydown = (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        open();
      }
    };
  }
  document.addEventListener("keydown", (e) => {
    const m = $("#calModal");
    if (m.hidden) return;
    if (e.key === "Escape" && !e.defaultPrevented) {
      calClose();
    }
  });
}

/* ================= 万年历 × 择日 联动 ================= */
const calZt = () => (CAL_ST.on ? ZRS.ev : "");
function calBirthZ() {
  return ZRS.birth === -2
    ? typeof R !== "undefined" && R && R.bz
      ? R.bz.pill[0].b
      : -1
    : ZRS.birth;
}
function calChartZodiac() {
  return typeof R !== "undefined" && R && R.bz ? "属" + ZODIAC12[R.bz.pill[0].b] : "暂无命盘";
}
function calScore(c, ev) {
  if (!ev || !ZERI_EVENTS[ev]) return null;
  const bz = calBirthZ(),
    k = ev + "|" + bz;
  c._z = c._z || {};
  if (!c._z[k]) {
    const r = scoreDay(c, ev, bz);
    c._z[k] = {
      sc: r.sc,
      why: r.why,
      flags: r.flags,
      tier: zrTierOf({ sc: r.sc, flags: r.flags }, ev, bz),
    };
  }
  return c._z[k];
}
const calBirthOpts = (sel) =>
  `<option value="-1"${sel === -1 ? " selected" : ""}>不考虑生肖</option><option value="-2"${sel === -2 ? " selected" : ""}>取左侧命盘(${calChartZodiac()})</option>${ZODIAC12.map((z, i) => `<option value="${i}"${sel === i ? " selected" : ""}>属${z}</option>`).join("")}`;
function calMineOn(c, y, m, d) {
  return calMineLoad().filter((x) =>
    x.t === "S"
      ? x.m === m && x.d === d
      : x.t === "O"
        ? x.y === y && x.m === m && x.d === d
        : !c.lunar.isLeap && x.m === c.lunar.month && x.d === c.lunar.day,
  );
}
function calClose() {
  $("#calModal").hidden = true;
  document.body.classList.remove("zm-open");
  try {
    zrSyncUI();
  } catch (e) {}
  const b = $("#calBtn");
  if (b) b.focus();
}
function zrSyncUI() {
  const sel = $("#zrEv");
  if (!sel) return;
  sel.value = ZRS.ev;
  const st = $("#zrStart");
  if (st && ZRS.start) st.value = ZRS.start;
  const b = $("#zrBirth");
  if (b) b.value = String(ZRS.birth);
  const dy = $("#zrDays");
  if (dy) dy.value = String(ZRS.days);
  $("#zrBox").innerHTML = zrHTML(R);
  bindZeriGrid();
}
function calToZeri() {
  const s = CAL_ST.sel;
  ZRS.start = `${s.y}-${f2(s.m)}-${f2(s.d)}`;
  ZRS.sel = 0;
  if (ZRS.days < 30) ZRS.days = 45;
  calClose();
  selectTab("zeri");
  setTimeout(() => {
    try {
      zrSyncUI();
    } catch (e) {
      console.error(e);
    }
  }, 60);
}
function calOpenFromZeri(dt, ev) {
  if (ev && ZERI_EVENTS[ev]) ZRS.ev = ev;
  CAL_ST.on = true;
  CAL_ST.yi = "";
  calOpen(dt);
}
/* ---- 格子 ---- */
function calCellHTML(c, y, m, d, inMonth, today) {
  const L = CAL_ST.layers,
    sel = CAL_ST.sel,
    isSel = sel && sel.y === y && sel.m === m && sel.d === d,
    wk = c.week === 0 || c.week === 6;
  const labs = calLabels(c),
    mine = L.mine ? calMineOn(c, y, m, d) : [],
    zt = calZt(),
    zs = zt ? calScore(c, zt) : null;
  const yi = CAL_ST.yi,
    fl = !zt && yi ? (c.yi.includes(yi) ? " yes" : c.ji.includes(yi) ? " no" : " neu") : "";
  const tcls = zs ? ` tz t${zs.tier}` : "";
  const badge =
    L.hol && c.hol
      ? `<i class="hb2 ${c.hol.work ? "wk" : "rest"}">${c.hol.work ? "班" : "休"}</i>`
      : "";
  const tb =
    zs && zs.tier !== 2
      ? `<i class="tb t${zs.tier}" title="${esc(zt + ":" + ZR_TIER[zs.tier] + " " + zs.sc.toFixed(1))}">${ZR_TIER[zs.tier]}</i>`
      : "";
  const dots = `${tb}${L.hd ? `<i class="dot ${c.huang ? "hd" : "hk"}" title="${c.ts}·${c.huang ? "黄道" : "黑道"}"></i>` : ""}${L.phase && c.ph ? `<i class="ph2" title="${c.ph.name} ${c.ph.time}">${{ 朔: "●", 上弦: "◐", 望: "○", 下弦: "◑" }[c.ph.name]}</i>` : ""}${mine.length ? '<i class="mn" title="我的日子">★</i>' : ""}`;
  const show = labs.slice(0, 2),
    more = labs.length - show.length;
  const aria = `${y}年${m}月${d}日 星期${CAL_WEEK[c.week]} 农历${c.lfull}${labs.length ? " " + labs.map((x) => x.t).join("、") : ""}${zs ? " " + zt + ZR_TIER[zs.tier] : ""}`;
  return `<button type="button" role="gridcell" class="cc${inMonth ? "" : " out"}${isSel ? " sel" : ""}${today ? " today" : ""}${wk || (c.hol && !c.hol.work) ? " red" : ""}${c.hol && c.hol.work ? " work" : ""}${fl}${tcls}" data-y="${y}" data-m="${m}" data-d="${d}" aria-label="${esc(aria)}" aria-selected="${isSel ? "true" : "false"}" tabindex="${isSel ? 0 : -1}">
   <span class="cc-top"><b>${d}</b>${badge}</span><span class="cc-l${c.lunar.day === 1 ? " m1" : ""}">${c.lname}</span>
   <span class="cc-lab">${show.map((x) => `<em class="${x.c}" title="${esc(x.f || x.t)}">${esc(x.t)}</em>`).join("")}${more > 0 ? `<em class="more">+${more}</em>` : ""}</span><span class="cc-dots">${dots}</span></button>`;
}
/* ---- 榜单 ---- */
function calRankHTML() {
  const ev = calZt();
  if (!ev) return "";
  const bz = calBirthZ(),
    month = CAL_ST.range === "m",
    st = month ? { y: CAL_ST.y, m: CAL_ST.m, d: 1 } : CAL_ST.sel,
    n = month ? calDim(CAL_ST.y, CAL_ST.m) : parseInt(CAL_ST.range);
  const arr = zeriRange(st.y, st.m, st.d, n, ev, bz).map((x) =>
    Object.assign(x, { tier: zrTierOf(x, ev, bz) }),
  );
  const item = (x) =>
    `<button type="button" class="rk t${x.tier}" data-go="${x.info.y}-${x.info.m}-${x.info.d}" title="${esc(x.why.join(";"))}"><b>${month ? "" : x.info.y + "/"}${x.info.m}/${x.info.d}</b><span>周${CAL_WEEK[x.info.week]} ${x.info.gz}</span><em>${ZR_TIER[x.tier]} ${x.sc.toFixed(1)}</em></button>`;
  let good = arr
    .slice()
    .sort(
      (a, b) => b.sc - a.sc || a.info.y - b.info.y || a.info.m - b.info.m || a.info.d - b.info.d,
    )
    .filter((x) => x.tier >= 3);
  let note = "";
  if (!good.length) {
    good = arr
      .slice()
      .sort((a, b) => b.sc - a.sc)
      .slice(0, 6);
    note = '<span class="dim sm">此范围内没有“宜/吉”档,以下按评分列前列供参考。</span>';
  }
  good = good.slice(0, 6);
  const bad = arr
    .filter((x) => x.tier === 0)
    .sort((a, b) => a.sc - b.sc)
    .slice(0, 5);
  return `<div class="rank"><div class="rank-h"><b>「${ev}」择日榜</b><label class="sm dim">范围<select id="cRange"><option value="m"${month ? " selected" : ""}>${CAL_ST.m}月内</option><option value="90"${CAL_ST.range === "90" ? " selected" : ""}>自所选日起 90 天</option><option value="180"${CAL_ST.range === "180" ? " selected" : ""}>自所选日起 180 天</option></select></label><span class="dim sm">${bz >= 0 ? "已避开冲属" + ZODIAC12[bz] + "的日子" : "未考虑生肖"}</span></div>
   <div class="rank-l"><span class="lab g">较优</span>${good.map(item).join("")}${note}</div>
   ${bad.length ? `<div class="rank-l"><span class="lab r">宜避</span>${bad.map(item).join("")}</div>` : ""}</div>`;
}
/* ---- 详情:择日评分段 ---- */
function calZjHTML(c, s) {
  const cur = calZt(),
    bz = calBirthZ();
  const rows = Object.keys(ZERI_EVENTS)
    .map((ev) => {
      const z = calScore(c, ev);
      return `<tr class="${ev === cur ? "on" : ""}" data-zt="${ev}" tabindex="0" role="button" title="点击选为当前事项"><td>${ev}<small>${ZERI_EVENTS[ev].desc}</small></td><td><i class="tb t${z.tier}">${ZR_TIER[z.tier]}</i></td><td class="tn">${z.sc.toFixed(1)}</td><td class="dim sm">${esc(z.why.slice(0, 3).join(";"))}</td></tr>`;
    })
    .join("");
  const zs = cur ? calScore(c, cur) : null;
  const bh = cur ? zrBestHours(s.y, s.m, s.d, cur, bz).slice(0, 3) : [];
  return `<div class="tbl-wrap"><table class="tbl sm zjt"><thead><tr><th>事项</th><th>档</th><th>分</th><th>主要依据</th></tr></thead><tbody>${rows}</tbody></table></div>
   ${
     zs
       ? `<div class="zj-cur"><b>「${cur}」</b>今日<b class="tier t${zs.tier}">${ZR_TIER[zs.tier]}</b>(${zs.sc.toFixed(1)}):${esc(zs.why.join(";"))}</div>
   <div class="zj-hr"><span class="lab">较优时辰</span>${bh.map((h) => `<span class="pill ${h.huang ? "g" : ""}" title="${esc(h.why.join(";"))}">${ZHI[h.b]}时 ${h.span} <small>${h.gz}</small></span>`).join("")}<span class="dim sm">时辰分是同一套机械加减(黄黑道、时宜忌、冲本命)</span></div>`
       : '<div class="dim sm" style="margin-top:6px">点击某一事项,或在上方“择日”下拉里选择事项,月历会按该事项的评分着色并生成择日榜。</div>'
   }
   <p class="note">分档按该事项在 4 年基准期内的分位数(吉≈前 10%、宜≈前 30%、慎≈后 30%、忌≈后 15%),并叠加“历书明确忌、冲本命、月破”上限;与“择日”标签页是同一套算法。生肖设置与择日页共用。</p>
   <div class="row3"><button class="gbtn sm" id="calFav">★ 收藏为备选日</button><button class="gbtn sm" id="calZeri">在择日页对比后续日子 →</button></div>`;
}
/* ---- 详情 ---- */
function calDetailHTML() {
  const s = CAL_ST.sel,
    c = calGet(s.y, s.m, s.d),
    today = calToday(),
    lu = c.lunar,
    ly = lu.year,
    gy = GAN[(((ly - 4) % 10) + 10) % 10] + ZHI[(((ly - 4) % 12) + 12) % 12];
  const jdN = jdFromGreg(s.y, s.m, s.d, 12),
    hou = nwHou(jdN),
    fu = nwFu(s.y, s.m, s.d),
    jiu = nwShujiu(s.y, s.m, s.d),
    mo = calMoonAt(s.y, s.m, s.d),
    loc = nwLoc(),
    sun = nwRiseSet(s.y, s.m, s.d, loc.lon, loc.lat, "sun");
  const diff = calDiff(today, s),
    dtxt = diff === 0 ? "就是今天" : diff > 0 ? `距今 ${diff} 天后` : `距今已过 ${-diff} 天`;
  const zt = calZt(),
    zs = zt ? calScore(c, zt) : null,
    bz = calBirthZ();
  const badges = [
    zs ? `<span class="pill tierp t${zs.tier}">${zt}·${ZR_TIER[zs.tier]}</span>` : "",
    c.hol
      ? `<span class="pill ${c.hol.work ? "r" : "g"}">${c.hol.work ? "调休上班" : "法定放假"} · ${esc(c.hol.name)}</span>`
      : "",
    c.term ? `<span class="pill c">${c.term.name} ${c.term.time}</span>` : "",
    ...c.fest.solar.map((x) => `<span class="pill">${esc(x)}</span>`),
    ...c.fest.lunar.map((x) => `<span class="pill">${esc(x)}</span>`),
    c.ph ? `<span class="pill">${c.ph.name} ${c.ph.time}</span>` : "",
  ].join("");
  const yj = `<div class="yj"><div><span class="yl">宜</span>${calChips(c.yi, "g")}</div><div><span class="yl j">忌</span>${calChips(c.ji, "r")}</div></div>`;
  const dt = [
    ...c.fest.tao.map((x) => ({ n: x.name, r: x.remark, k: "道教" })),
    ...c.fest.foto.map((x) => ({ n: x, r: "", k: "佛教" })),
    ...c.fest.folk.map((x) => ({ n: x.name, r: x.remark + "(民间说法,各地日期不一)", k: "民间" })),
  ];
  const fe = [
    ...c.fest.solar.map((x) => ({ n: x, k: "公历节日" })),
    ...c.fest.lunar.map((x) => ({ n: x, k: "农历节日" })),
    ...c.fest.other.map((x) => ({ n: x, k: "民俗" })),
    ...(c.hol ? [{ n: c.hol.name + (c.hol.work ? "(调休上班)" : "(放假)"), k: "法定节假日" }] : []),
    ...c.fest.so.map((x) => ({ n: x, k: "纪念日" })),
  ];
  const feHtml =
    fe.length || dt.length || c.term
      ? `<ul class="cul">${c.term ? `<li><b>${c.term.name}</b> <small>${c.term.zhong ? "中气" : "节"} · ${c.term.time}(北京时间)</small></li>` : ""}${fe.map((x) => `<li><b>${esc(x.n)}</b> <small>${x.k}</small></li>`).join("")}${dt.map((x) => `<li><b class="dtc">${esc(x.n)}</b> <small>${x.k}神诞${x.r ? " · " + esc(x.r) : ""}</small></li>`).join("")}</ul>`
      : '<span class="dim">今日无特别节日与神诞记载</span>';
  const hs = hoursOfDay(s.y, s.m, s.d),
    zr = bz >= 0 ? calZodiacRel(bz, c.dayZ) : null,
    best = zt
      ? zrBestHours(s.y, s.m, s.d, zt, bz)
          .slice(0, 3)
          .map((h) => h.b)
      : [];
  const hrHtml = `<div class="hstrip">${hs.map((h) => `<div class="hs ${h.huang ? "hd" : "hk"}${best.includes(h.b) ? " best" : ""}" title="${esc(h.ts + " · 宜:" + (h.yi.join("、") || "—") + " 忌:" + (h.ji.join("、") || "—"))}"><b>${ZHI[h.b]}</b><small>${h.span.slice(0, 2)}</small><small>${best.includes(h.b) ? "★" : h.huang ? "黄" : "黑"}</small></div>`).join("")}</div><div class="dim sm" style="margin-top:4px">悬停或长按时辰看宜忌;绿为黄道时,红为黑道时${zt ? `;★ 为「${zt}」较优时辰` : ""}。</div>`;
  const zodHtml = `<div class="row3"><label class="sm dim">我的生肖 <select id="calZod">${calBirthOpts(ZRS.birth)}</select></label>${zr ? `<span class="sm">今日${ZHI[c.dayZ]}日(冲${c.chong}):对属${ZODIAC12[bz]}者 ${zr.length ? zr.map((x) => `<span class="pill ${x === "相冲" || x === "相害" ? "r" : "g"}">${x}</span>`).join("") : '<span class="dim">无特别关系</span>'}</span>` : ""}</div><p class="note">此处的生肖与“择日”页、月历的择日评分共用。</p>`;
  const posHtml = `<div class="kv"><span>财神 <b>${CAL_DIR[c.pos.cai]}</b></span><span>喜神 <b>${CAL_DIR[c.pos.xi]}</b></span><span>福神 <b>${CAL_DIR[c.pos.fu]}</b></span><span>阳贵 <b>${CAL_DIR[c.pos.yg]}</b></span><span>阴贵 <b>${CAL_DIR[c.pos.yin]}</b></span></div><div class="kv"><span>胎神占方 <b>${c.tai}</b></span></div><div class="kv"><span>彭祖百忌 <b>${c.pz}</b></span></div><p class="note">方位为传统黄历所载,仅作文化参照。</p>`;
  const jsHtml = `<div class="yj"><div><span class="yl">吉</span>${calChips(c.js, "g")}</div><div><span class="yl j">凶</span>${calChips(c.xs, "r")}</div></div>`;
  const mine = calMineOn(c, s.y, s.m, s.d),
    all = calMineLoad();
  const lab = (x) =>
    x.t === "S"
      ? `公历每年 ${x.m}月${x.d}日`
      : x.t === "O"
        ? `仅 ${x.y}年${x.m}月${x.d}日`
        : `农历每年 ${CAL_LMON[x.m - 1]}月${calLD(x.d)}`;
  const tierOf = (x) => {
    if (!zt || x.t !== "O") return "";
    const z = calScore(calGet(x.y, x.m, x.d), zt);
    return z
      ? ` <i class="tb t${z.tier}" title="${zt}评分 ${z.sc.toFixed(1)}">${ZR_TIER[z.tier]}</i>`
      : "";
  };
  const mineHtml = `${mine.length ? `<ul class="cul">${mine.map((x) => `<li><b>★ ${esc(x.n)}</b> <small>${lab(x)}${x.note ? " · " + esc(x.note) : ""}</small></li>`).join("")}</ul>` : '<div class="dim sm">今日没有你的记录。</div>'}
   <div class="row3" style="margin-top:6px"><input type="text" id="calMineN" placeholder="名称(如:生日、纪念日)" maxlength="20" aria-label="名称"><select id="calMineT"><option value="S">按公历每年</option><option value="L">按农历每年</option><option value="O">仅这一天(备选日)</option></select><button class="gbtn sm" id="calMineAdd">添加到 ${s.m}月${s.d}日 / ${lu.isLeap ? "闰" : ""}${CAL_LMON[lu.month - 1]}月${calLD(lu.day)}</button></div>
   ${all.length ? `<details class="csub"><summary>全部记录(${all.length})</summary><ul class="cul">${all.map((x, i) => `<li>${x.t === "O" ? `<button class="lnk2" data-go="${x.y}-${x.m}-${x.d}">${esc(x.n)}</button>` : esc(x.n)} <small>${lab(x)}</small>${tierOf(x)} <button class="lnk" data-del="${i}">删除</button></li>`).join("")}</ul></details>` : ""}
   <p class="note">“我的日子”只保存在这台设备的浏览器里。“备选日”是只在某一天出现的收藏,可在择日页或此处添加,选了事项后会显示各备选日的评分档,方便比较。农历记录在闰月不重复显示。</p>`;
  const toolHtml = `<div class="cvt"><b>公历 → 农历</b><div class="row3"><input type="date" id="cvS" min="1901-01-01" max="2099-12-31" value="${s.y}-${f2(s.m)}-${f2(s.d)}"><span id="cvSo" class="sm"></span></div>
   <b>农历 → 公历</b><div class="row3"><input type="number" id="cvLy" value="${ly}" min="1901" max="2099" style="width:76px">年<select id="cvLm">${CAL_LMON.map((n, i) => `<option value="${i + 1}"${i + 1 === lu.month ? " selected" : ""}>${n}月</option>`).join("")}</select><label class="sm"><input type="checkbox" id="cvLl"${lu.isLeap ? " checked" : ""}> 闰</label><select id="cvLd">${CAL_LDAY.map((n, i) => `<option value="${i + 1}"${i + 1 === lu.day ? " selected" : ""}>${n}</option>`).join("")}</select><button class="gbtn sm" id="cvGo">换算</button><span id="cvLo" class="sm"></span></div></div>`;
  const expHtml = `<div class="row3"><label class="sm"><input type="checkbox" class="ex" value="term" checked> 节气</label><label class="sm"><input type="checkbox" class="ex" value="fest" checked> 农历节日</label><label class="sm"><input type="checkbox" class="ex" value="solarFest" checked> 公历节日</label><label class="sm"><input type="checkbox" class="ex" value="deity" checked> 神明诞辰</label><label class="sm"><input type="checkbox" class="ex" value="holiday" checked> 法定假日</label></div><div class="row3"><button class="gbtn sm" id="calIcs">导出 ${s.y} 年为日历文件(.ics)</button><span class="dim sm">可导入手机或电脑日历(全天事件)。</span></div>`;
  return `<div class="cd-h"><div class="cd-date"><b>${s.y}年${s.m}月${s.d}日</b><span>星期${CAL_WEEK[c.week]}</span></div><div class="cd-l">${gy}年(${c.zodiac}) · ${c.lfull}</div><div class="pills" style="margin:6px 0">${badges}</div></div>
   ${calSec(
     "ov",
     "概览",
     `<div class="kv"><span>日柱 <b>${c.gz}</b>(${c.nayin})</span><span>建除 <b class="${LVC(c.zxTone)}">${c.zx}日</b></span><span>天神 <b class="${c.huang ? "good" : "bad"}">${c.ts}(${c.huang ? "黄" : "黑"}道)</b></span><span>二十八宿 <b>${c.xiu}</b></span><span>冲 <b>${c.chong}</b> 煞${c.sha}</span></div>
     <div class="kv"><span>${dtxt}</span><span>一年中第 <b>${calDayOfYear(s.y, s.m, s.d)}</b> 天</span><span>七十二候 <b>${hou.term}·${hou.ord} ${hou.name}</b></span>${fu ? `<span><b>${fu.name}</b>第${fu.day}天</span>` : ""}${jiu ? `<span><b>${jiu.name}</b>第${jiu.day}天</span>` : ""}</div>
     <div class="kv"><span>月相 <b>${mo.name}</b>(受光 ${(mo.lit * 100).toFixed(0)}%)</span>${sun.rise !== null && sun.set !== null ? `<span>日出 <b>${nwFmtH(sun.rise)}</b> 日落 <b>${nwFmtH(sun.set)}</b></span>` : ""}</div>`,
     "",
   )}
   ${calSec("zj", "择日评分", calZjHTML(c, s), zs ? ` <em class="tb t${zs.tier}">${zt}·${ZR_TIER[zs.tier]}</em>` : "")}
   ${calSec("yj", "宜 · 忌", yj)}
   ${calSec("fe", "节日 · 节气 · 神明诞辰", feHtml)}
   ${calSec("hr", "十二时辰吉凶", hrHtml)}
   ${calSec("zx", "生肖关系", zodHtml)}
   ${calSec("js", "吉神 · 凶煞", jsHtml)}
   ${calSec("pos", "方位 · 民俗", posHtml)}
   ${calSec("mine", "我的日子 · 备选日", mineHtml, mine.length ? ' <em class="mn">★</em>' : "")}
   ${calSec("tool", "日期换算", toolHtml)}
   ${calSec("exp", "导出日历文件", expHtml)}
   <div class="cd-act"><button class="gbtn sm" id="calCopy">复制本日黄历</button><button class="gbtn sm" id="calChart">以此日起局</button><button class="gbtn sm" id="calHours">此日时辰与节律</button></div>`;
}
/* ---- 渲染与交互 ---- */
function calRender(keepScroll) {
  const y = CAL_ST.y,
    m = CAL_ST.m,
    box = $("#calBox"),
    zt = calZt();
  const prevScroll = keepScroll && $("#calDetail") ? $("#calDetail").scrollTop : 0,
    prevMain = keepScroll && $(".cal-main") ? $(".cal-main").scrollTop : 0;
  const topicVal = zt ? "z:" + zt : CAL_ST.yi ? "y:" + CAL_ST.yi : "";
  box.innerHTML = `<div class="cal-top"><span class="cal-t">万年历</span>
    <span class="cal-nav"><button id="cPY" aria-label="上一年">«</button><button id="cPM" aria-label="上一月">‹</button><label class="cal-ym"><input type="number" id="cY" value="${y}" min="1901" max="2099" aria-label="年份">年<select id="cM" aria-label="月份">${[...Array(12)].map((_, i) => `<option value="${i + 1}"${i + 1 === m ? " selected" : ""}>${i + 1}月</option>`).join("")}</select></label><button id="cNM" aria-label="下一月">›</button><button id="cNY" aria-label="下一年">»</button><button id="cToday" class="gbtn sm" title="跳到北京时间的今天">回到今天</button></span>
    <span class="cal-opt"><label class="sm dim">择日<select id="cTopic"><option value=""${topicVal === "" ? " selected" : ""}>— 不使用 —</option><optgroup label="择日评分(与择日页同算法)">${Object.keys(
      ZERI_EVENTS,
    )
      .map((k) => `<option value="z:${k}"${topicVal === "z:" + k ? " selected" : ""}>${k}</option>`)
      .join(
        "",
      )}</optgroup><optgroup label="仅按黄历“宜”项高亮">${CAL_YI_LIST.map((k) => `<option value="y:${k}"${topicVal === "y:" + k ? " selected" : ""}>宜${k}</option>`).join("")}</optgroup></select></label>
    <label class="sm dim">生肖<select id="cBirth">${calBirthOpts(ZRS.birth)}</select></label>
    <label class="sm dim">每周起于<select id="cWs"><option value="0"${CAL_ST.ws === 0 ? " selected" : ""}>周日</option><option value="1"${CAL_ST.ws === 1 ? " selected" : ""}>周一</option></select></label></span>
    <button id="calClose" class="zm-x" aria-label="关闭万年历">✕ 关闭</button></div>
   <div class="cal-layers" id="calLayers">${CAL_LAYERS.map(([k, n]) => `<button type="button" data-l="${k}" class="${CAL_ST.layers[k] ? "on" : ""}" aria-pressed="${CAL_ST.layers[k] ? "true" : "false"}">${n}</button>`).join("")}</div>
   ${calHolidayKnown(y) ? "" : `<div class="cal-warn">${y} 年的法定节假日与调休安排尚未收录(本页数据到 2026 年);其余节日、节气、神诞按历法推算。</div>`}
   <div class="cal-body"><div class="cal-main">${calGridHTML()}<div class="cal-lg"><span><i class="dot hd"></i>黄道</span><span><i class="dot hk"></i>黑道</span><span><i class="hb2 rest">休</i>放假</span><span><i class="hb2 wk">班</i>调休</span><span>● 朔 ◐ 上弦 ○ 望 ◑ 下弦</span>${zt ? `<span class="tierlg"><i class="tb t4">吉</i><i class="tb t3">宜</i><i class="tb t1">慎</i><i class="tb t0">忌</i>「${zt}」评分</span>` : ""}${CAL_ST.yi && !zt ? `<span class="yes-l">宜${CAL_ST.yi}</span><span class="no-l">忌${CAL_ST.yi}</span>` : ""}</div>${calRankHTML()}</div><div class="cal-detail" id="calDetail" aria-live="polite">${calDetailHTML()}</div></div>`;
  const dt = $("#calDetail");
  if (dt) dt.scrollTop = prevScroll;
  const mn = $(".cal-main");
  if (mn) mn.scrollTop = prevMain;
  calBind();
}
function calBind() {
  const y = CAL_ST.y,
    m = CAL_ST.m;
  $("#calClose").onclick = calClose;
  $("#cPY").onclick = () => calGo(y - 1, m);
  $("#cNY").onclick = () => calGo(y + 1, m);
  $("#cPM").onclick = () => calGo(m === 1 ? y - 1 : y, m === 1 ? 12 : m - 1);
  $("#cNM").onclick = () => calGo(m === 12 ? y + 1 : y, m === 12 ? 1 : m + 1);
  $("#cY").onchange = (e) => calGo(parseInt(e.target.value) || y, m);
  $("#cM").onchange = (e) => calGo(y, parseInt(e.target.value));
  $("#cToday").onclick = () => {
    calSelect(calToday());
    try {
      if (STU.active) stuRestoreToday(true);
    } catch (_) {}
  };
  $("#cTopic").onchange = (e) => {
    const v = e.target.value;
    CAL_ST.on = false;
    CAL_ST.yi = "";
    if (v.startsWith("z:")) {
      CAL_ST.on = true;
      ZRS.ev = v.slice(2);
      ZRS.sel = 0;
      CAL_ST.open.zj = 1;
    } else if (v.startsWith("y:")) CAL_ST.yi = v.slice(2);
    calRender(true);
  };
  $("#cBirth").onchange = (e) => {
    ZRS.birth = parseInt(e.target.value);
    calRender(true);
  };
  const rg = $("#cRange");
  if (rg)
    rg.onchange = (e) => {
      CAL_ST.range = e.target.value;
      calRender(true);
    };
  $("#cWs").onchange = (e) => {
    CAL_ST.ws = parseInt(e.target.value);
    calSave();
    calRender(true);
  };
  $$("#calLayers button").forEach(
    (b) =>
      (b.onclick = () => {
        CAL_ST.layers[b.dataset.l] = CAL_ST.layers[b.dataset.l] ? 0 : 1;
        calSave();
        calRender(true);
      }),
  );
  $$("#calGrid .cc").forEach(
    (b) => (b.onclick = () => calSelect({ y: +b.dataset.y, m: +b.dataset.m, d: +b.dataset.d })),
  );
  $$("#calBox [data-go]").forEach(
    (b) =>
      (b.onclick = () => {
        const [yy, mm, dd] = b.dataset.go.split("-").map(Number);
        calSelect({ y: yy, m: mm, d: dd });
      }),
  );
  $("#calGrid").onkeydown = (e) => {
    const s = CAL_ST.sel,
      k = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }[e.key];
    if (k !== undefined) {
      e.preventDefault();
      calSelect(calAddDays(s.y, s.m, s.d, k), true);
    } else if (e.key === "PageDown") {
      e.preventDefault();
      const t = calAddDays(s.y, s.m, 1, calDim(s.y, s.m));
      calSelect({ y: t.y, m: t.m, d: Math.min(s.d, calDim(t.y, t.m)) }, true);
    } else if (e.key === "PageUp") {
      e.preventDefault();
      const pm = s.m === 1 ? 12 : s.m - 1,
        py = s.m === 1 ? s.y - 1 : s.y;
      calSelect({ y: py, m: pm, d: Math.min(s.d, calDim(py, pm)) }, true);
    }
  };
  $$("#calDetail details.csec").forEach((dd) =>
    dd.addEventListener("toggle", () => {
      CAL_ST.open[dd.dataset.k] = dd.open ? 1 : 0;
    }),
  );
  $$("#calDetail [data-zt]").forEach((r) => {
    const go = () => {
      CAL_ST.on = true;
      ZRS.ev = r.dataset.zt;
      ZRS.sel = 0;
      calRender(true);
    };
    r.onclick = go;
    r.onkeydown = (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        go();
      }
    };
  });
  const z = $("#calZod");
  if (z)
    z.onchange = (e) => {
      ZRS.birth = parseInt(e.target.value);
      CAL_ST.open.zx = 1;
      calRender(true);
    };
  const s = CAL_ST.sel,
    add = $("#calMineAdd");
  if (add)
    add.onclick = () => {
      const n = $("#calMineN").value.trim();
      if (!n) {
        toast("请先填写名称");
        return;
      }
      const c = calGet(s.y, s.m, s.d),
        t = $("#calMineT").value,
        a = calMineLoad();
      a.push(
        t === "S"
          ? { n, t: "S", m: s.m, d: s.d }
          : t === "O"
            ? { n, t: "O", y: s.y, m: s.m, d: s.d }
            : { n, t: "L", m: c.lunar.month, d: c.lunar.day },
      );
      calMineSave(a);
      CAL_ST.open.mine = 1;
      calRender(true);
      toast("已添加");
    };
  $$("#calDetail [data-del]").forEach(
    (b) =>
      (b.onclick = () => {
        const a = calMineLoad();
        a.splice(+b.dataset.del, 1);
        calMineSave(a);
        calRender(true);
      }),
  );
  const fav = $("#calFav");
  if (fav)
    fav.onclick = () => {
      const a = calMineLoad(),
        nm = "备选·" + (calZt() || "择日");
      if (!a.some((x) => x.t === "O" && x.y === s.y && x.m === s.m && x.d === s.d && x.n === nm))
        a.push({ n: nm, t: "O", y: s.y, m: s.m, d: s.d });
      calMineSave(a);
      CAL_ST.open.mine = 1;
      calRender(true);
      toast("已收藏为备选日,可在“我的日子”里对比");
    };
  const zz = $("#calZeri");
  if (zz) zz.onclick = calToZeri;
  const cs = $("#cvS");
  if (cs) {
    const f = () => {
      const p = cs.value.split("-").map(Number);
      if (p.length === 3 && p[0] >= 1901 && p[0] <= 2099) {
        const c = calDay(p[0], p[1], p[2]);
        $("#cvSo").textContent =
          `${c.zodiac}年 农历${c.lfull} · ${c.gz}日 · 星期${CAL_WEEK[c.week]}`;
      }
    };
    cs.onchange = f;
    f();
  }
  const go = $("#cvGo");
  if (go)
    go.onclick = () => {
      const r = calLunar2Solar(
        parseInt($("#cvLy").value),
        parseInt($("#cvLm").value),
        parseInt($("#cvLd").value),
        $("#cvLl").checked,
      );
      $("#cvLo").textContent = r
        ? `公历 ${r.y}年${r.m}月${r.d}日 星期${CAL_WEEK[calWeekday(r.y, r.m, r.d)]}`
        : "该农历日期不存在(如无此闰月或当月无三十)";
    };
  $("#calCopy").onclick = async () => {
    const t = calText();
    try {
      await navigator.clipboard.writeText(t);
      toast("已复制本日黄历");
    } catch (e) {
      const ta = document.createElement("textarea");
      ta.value = t;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      let ok = false;
      try {
        ok = document.execCommand("copy");
      } catch (_) {}
      ta.remove();
      toast(ok ? "已复制本日黄历" : "当前环境不允许复制,请手动选取");
    }
  };
  $("#calChart").onclick = () => {
    const n = nowBJ(),
      t = { y: s.y, m: s.m, d: s.d, h: n.h, mi: n.mi, s: 0 };
    calClose();
    try {
      setLive(false);
      setDt(t);
      deduce(t, "full");
      selectTab("over");
    } catch (e) {
      console.error(e);
    }
  };
  $("#calHours").onclick = () => {
    calClose();
    NW.view = { y: s.y, m: s.m, d: s.d };
    selectTab("now");
    setTimeout(() => {
      try {
        nwTick(true);
        document.getElementById("nwc-24").scrollIntoView({ behavior: "smooth", block: "start" });
      } catch (e) {
        console.error(e);
      }
    }, 80);
  };
  const ics = $("#calIcs");
  if (ics) {
    getCap("downloads").then((dl) => {
      if (!dl) {
        ics.disabled = true;
        ics.title = "当前环境不支持保存文件";
      } else
        ics.onclick = () => {
          const opt = {};
          $$("#calDetail .ex").forEach((c) => {
            opt[c.value] = c.checked;
          });
          saveFile(`天机盘万年历-${s.y}.ics`, calICS(s.y, opt));
        };
    });
  }
}

/* ================= 回到顶部 / 直达底部 ================= */
function bindFab() {
  const top = $("#goTop"),
    bot = $("#goBottom"),
    lb = $("#livebar"),
    root = document.documentElement;
  const reduce = false;
  const go = (y) => window.scrollTo({ top: y, behavior: reduce ? "auto" : "smooth" });
  top.onclick = () => go(0);
  bot.onclick = () => go(root.scrollHeight);
  let edgeTimer = 0;
  const edgeShow = () => {
    [top, bot].forEach((b) => {
      if (b && !b.classList.contains("hide")) b.classList.add("edge-show");
    });
    clearTimeout(edgeTimer);
    edgeTimer = setTimeout(() => {
      [top, bot].forEach((b) => {
        if (b && !b.matches(":hover") && document.activeElement !== b)
          b.classList.remove("edge-show");
      });
    }, 1450);
  };
  [top, bot].forEach((b) => {
    b.addEventListener("mouseenter", () => b.classList.add("edge-show"));
    b.addEventListener("mouseleave", () => {
      clearTimeout(edgeTimer);
      edgeTimer = setTimeout(() => b.classList.remove("edge-show"), 500);
    });
    b.addEventListener("focus", () => b.classList.add("edge-show"));
    b.addEventListener("blur", () => b.classList.remove("edge-show"));
  });
  const upd = () => {
    const y = window.scrollY || root.scrollTop,
      max = root.scrollHeight - window.innerHeight;
    top.classList.toggle("hide", y < 320);
    bot.classList.toggle("hide", max < 600 || max - y < 320);
    if (lb) root.style.setProperty("--lbh", lb.offsetHeight + "px");
  };
  window.addEventListener(
    "scroll",
    () => {
      upd();
      edgeShow();
    },
    { passive: true },
  );
  window.addEventListener("resize", upd);
  document.addEventListener(
    "pointermove",
    (e) => {
      if (window.innerWidth - e.clientX < 28) edgeShow();
    },
    { passive: true },
  );
  if (window.ResizeObserver) new ResizeObserver(upd).observe(document.body);
  upd();
  setTimeout(edgeShow, 800);
}

/* ================= 人物 · 关系网 ================= */
