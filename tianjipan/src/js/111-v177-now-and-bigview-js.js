(() => {
  "use strict";
  const BUILD = "v177 · 2026-10-05 20:42 +08:00";

  function esc177(s) {
    return String(s ?? "").replace(
      /[&<>"']/g,
      (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[m],
    );
  }
  function nwGuideText(mode) {
    if (mode === "use")
      return `<b>用法：</b>先看上方曲线，判断白天/夜晚与太阳、月亮的大致位置；再看下方时辰卡，点击任意一张卡片，即可查看该时段的黄黑道、当令经脉、宜忌与“是否冲我”。如果只想找顺手的时段，优先看绿色黄道并避开“冲我”的卡片。`;
    if (mode === "meaning")
      return `<b>意义：</b>这个版块把“二十四小时”拆成十二个时辰，并把太阳、月亮、黄黑道与子午流注并放在一起。它的价值不是替你做决定，而是帮你把一天看成有节奏、有轻重缓急的时间地形图。`;
    return `<b>功能：</b>这是“未来 24 小时 · 时辰与天象”观察板。它把你当前位置的未来一天，按传统时辰切开，并叠加太阳 / 月亮高度、日出日落、黄黑道与当令经脉。点击下方任一时辰卡，右侧会联动显示该时段说明。`;
  }
  function nwCurrentOrFirst(D) {
    let idx = D.blocks.findIndex((b) => b.isNow && !D.custom);
    if (idx < 0)
      idx = Math.max(
        0,
        D.blocks.findIndex((b) => b.huang),
      );
    if (idx < 0) idx = 0;
    return idx;
  }
  function nwBlockExplain(b, D, bz) {
    const cx = bz >= 0 && b.chongZ === bz;
    const quality = b.huang
      ? "黄道时，适合把重要动作放在前面。"
      : "黑道时，更适合收尾、复核、观望。";
    const clash = cx
      ? "这个时段冲你的生肖，若非必要，尽量不要把最不可逆的决定放在这里。"
      : "这个时段与所选生肖没有直接相冲。";
    return `<div class="nw24-livegrid">
    <span>观察对象</span><b>${esc177(ZHI[b.b])}时 · ${esc177(b.gz)}</b>
    <span>时间范围</span><b>${esc177(nwHM(b.sJD))}–${esc177(nwHM(b.eJD))}</b>
    <span>黄黑道</span><b>${esc177(b.ts)}</b>
    <span>当令经脉</span><b>${esc177(b.lz[2])}</b>
    <span>宜</span><b>${esc177((b.yi || []).slice(0, 4).join("、") || "—")}</b>
    <span>忌</span><b>${esc177((b.ji || []).slice(0, 4).join("、") || "—")}</b>
    <span>冲煞</span><b>冲${esc177(b.chong)}${cx ? "（冲我）" : ""}</b>
  </div>
  <div class="nw24-livehint">${esc177(quality)} ${esc177(clash)} 点击不同卡片，可比较一天中不同时间的节奏差异。</div>`;
  }
  function bindNow24Interactive() {
    const host = document.getElementById("nwc-24");
    if (!host || !window.NW || !NW.N) return;
    const D = nw24Data(NW.N),
      bz = nwBirthZ();
    const guideBody = host.querySelector("#nw24GuideBody");
    const tabBtns = host.querySelectorAll("[data-nwguide]");
    const setGuide = (g) => {
      tabBtns.forEach((b) => b.classList.toggle("on", b.dataset.nwguide === g));
      if (guideBody) guideBody.innerHTML = nwGuideText(g);
      host.dataset.guide = g;
    };
    tabBtns.forEach((btn) => (btn.onclick = () => setGuide(btn.dataset.nwguide)));
    setGuide(host.dataset.guide || "feature");

    const live = host.querySelector("#nw24LiveBody");
    const cards = host.querySelectorAll(".nw24-card");
    const setSel = (idx) => {
      cards.forEach((c) => c.classList.toggle("sel", c.dataset.idx === String(idx)));
      const b = D.blocks[idx];
      if (live && b) live.innerHTML = nwBlockExplain(b, D, bz);
      host.dataset.sel = String(idx);
    };
    cards.forEach((btn) => {
      btn.onclick = () => setSel(parseInt(btn.dataset.idx, 10) || 0);
      btn.onkeydown = (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          btn.click();
        }
      };
    });
    setSel(parseInt(host.dataset.sel || nwCurrentOrFirst(D), 10) || 0);
  }

  /* 重定义未来24小时卡片 */
  nw24Html = function (N) {
    const D = nw24Data(N),
      bz = nwBirthZ(),
      bl = D.blocks;
    const top = bl
      .filter((b) => b.huang && b.chongZ !== bz && b.eJD > D.t0)
      .slice(0, 3)
      .map((b) => `${ZHI[b.b]}时(${nwHM(b.sJD)}–${nwHM(b.eJD)})`);
    const nowBlock = bl.find((b) => b.isNow && !D.custom);
    const cards = bl
      .map((b, idx) => {
        const cx = bz >= 0 && b.chongZ === bz,
          now = b.isNow && !D.custom;
        return `<button type="button" class="hb nw24-card ${b.huang ? "hd" : "hk"}${now ? " now" : ""}${cx ? " cx" : ""}" data-idx="${idx}" title="${esc(b.ts + " · 宜:" + (b.yi.join("、") || "—") + " 忌:" + (b.ji.join("、") || "—"))}">
      ${now ? '<span class="nw24-nowtag">当前</span>' : ""}
      <div class="hb-t"><b>${ZHI[b.b]}时</b><span>${b.gz}</span></div>
      <div class="hb-s">${nwHM(b.sJD)}–${nwHM(b.eJD)}</div>
      <div class="hb-g"><span class="${b.huang ? "good" : "bad"}">${b.ts}</span> · ${b.lz[2].replace("经", "")}</div>
      <div class="hb-y"><i>宜</i>${b.yi.slice(0, 3).join("、") || "—"}</div>
      <div class="hb-y j"><i>忌</i>${b.ji.slice(0, 3).join("、") || "—"}</div>
      <div class="hb-c">冲${b.chong}${cx ? " <em>冲我</em>" : ""}</div>
      <span class="nw24-clicktip">点击查看</span>
    </button>`;
      })
      .join("");
    const evs = D.ev
      .map(
        (e, i) =>
          `<span class="pill ${e.kind === "sun" ? "c" : e.kind === "moon" ? "" : "g"}" data-nwev="${i}">${nwFmtEv(e.jd, D)} ${e.label}</span>`,
      )
      .join("");
    const vd = nwYmd(D.b);
    return `<div class="nw-card wide"><h3 class="sec">${D.custom ? "日期视图 · " + vd + " 的时辰与天象" : "未来 24 小时 · 时辰与天象"}</h3>
   <div class="row3"><label class="sm dim">日期 <input type="date" id="nwViewD" value="${vd}" min="1901-01-01" max="2099-12-31"></label><button class="gbtn sm" id="nwPrevD">‹ 前一天</button><button class="gbtn sm" id="nwNextD">后一天 ›</button><button class="gbtn sm" id="nwBackNow"${D.custom ? "" : " disabled"}>回到此刻</button>
   <label class="sm dim">我的生肖 <select id="nwBirth"><option value="-1"${NW.birth === -1 ? " selected" : ""}>不标注冲</option><option value="-2"${NW.birth === -2 ? " selected" : ""}>取左侧命盘生肖</option>${ZODIAC12.map((z, i) => `<option value="${i}"${NW.birth === i ? " selected" : ""}>${z}</option>`).join("")}</select></label></div>
   ${nowBlock ? `<div class="nw24-currentbar"><b>当前时段：${ZHI[nowBlock.b]}时</b><span>${nwHM(nowBlock.sJD)}–${nwHM(nowBlock.eJD)} · ${nowBlock.ts} · 当令经脉 ${nowBlock.lz[2]}</span><span class="pill ${nowBlock.huang ? "c" : ""}">${nowBlock.huang ? "较顺手" : "宜放缓"}</span></div>` : ""}
   <div class="nw24-intro">
      <div class="nw24-tipcard">
        <h4>这块面板怎么用？</h4>
        <div class="nw24-tabbar">
          <button type="button" data-nwguide="feature">功能</button>
          <button type="button" data-nwguide="use">用法</button>
          <button type="button" data-nwguide="meaning">意义</button>
        </div>
        <div class="nw24-guidebody" id="nw24GuideBody"></div>
      </div>
      <div class="nw24-livecard">
        <h4>联动解读</h4>
        <div id="nw24LiveBody"></div>
      </div>
   </div>
   <div class="dim sm" style="margin-bottom:6px">${top.length ? "较优时段(黄道且不冲我)：" + top.join("、") : "此窗口内暂无符合的较优时段"}</div>
   <div class="c24wrap">${nw24Chart(N, D)}</div>
   <div class="pills" style="margin:6px 0 10px">${evs}</div>
   <div class="hbrow">${cards}</div>
   <p class="nw24-helpnote">金色曲线为太阳，青色虚线为月亮；绿色时辰卡偏顺手，红色时辰卡偏保守。点击时辰卡，右侧会联动解释它的用途、节奏与冲煞关系。${D.custom ? "日期视图自该日 0 点起算 24 小时。" : ""}时辰边界按${N.loc.solar ? "真太阳时" : "北京时间"}划分。</p></div>`;
  };

  /* 重定义“今日节律 · 起居参照”的色带 */
  nwRhythmHtml = function (N) {
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
    let band = "";
    if (hasSun) {
      const seg = [
        [0, dawn, "夜"],
        [dawn, sun.rise, "晨曦"],
        [sun.rise, sun.set, "昼"],
        [sun.set, dusk, "暮"],
        [dusk, 24, "夜"],
      ];
      const labels = seg
        .map(([a, c, n]) => `<b style="left:${(((a + c) / 2 / 24) * 100).toFixed(2)}%">${n}</b>`)
        .join("");
      const track = seg
        .map(
          ([a, c, n]) =>
            `<div class="rhy-seg ${NW_PHASE_CLS[n]}" style="width:${(((c - a) / 24) * 100).toFixed(2)}%" title="${n} ${nwFmtH(a)}–${nwFmtH(c)}"></div>`,
        )
        .join("");
      const now = nw24Base();
      const nowh = (now.h || 0) + (now.mi || 0) / 60;
      band = `<div class="rhy-strip"><div class="rhy-labels">${labels}</div><div class="rhy-track">${track}<i class="rhy-noon" style="left:${((sun.noon / 24) * 100).toFixed(2)}%"><span>日中 ${nwFmtH(sun.noon)}</span></i>${!b.custom ? `<i class="rhy-now" style="left:${((nowh / 24) * 100).toFixed(2)}%"><span>此刻</span></i>` : ""}</div><div class="rbar-t"><span>0</span><span>6</span><span>12</span><span>18</span><span>24</span></div></div>`;
    } else
      band = `<p class="dim sm">该纬度当日${sun.alwaysUp ? "为极昼(太阳不落)" : "为极夜(太阳不升)"},以下按钟点划分。</p>`;
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
      ? `日出 <b>${nwFmtH(sun.rise)}</b>(${ZHI[hOf(sun.rise)]}时)，日落 <b>${nwFmtH(sun.set)}</b>(${ZHI[hOf(sun.set)]}时)，昼长 <b>${Math.floor(sun.set - sun.rise)}时${f2(Math.round(((sun.set - sun.rise) % 1) * 60))}分</b>；晨曦自 ${nwFmtH(dawn)} 起，暮色至 ${nwFmtH(dusk)}。`
      : "";
    return `<div class="nw-card wide"><h3 class="sec">${b.custom ? nwYmd(b) + " " : "今日"}节律 · 起居参照</h3>
   <div class="rhy-hero">
     ${band}
     <div class="lead">${sr}${hasSun ? `传统上常把“日出而作、日入而息”当作作息参照：可以在日出前后(${ZHI[hOf(sun.rise)]}时)起身，午时(11–13 点)短歇，${ZHI[hOf(sun.set)]}时(日落)后逐步收心，亥时(21–23 点)前后入睡。` : ""}</div>
   </div>
   <div class="tbl-wrap"><table class="tbl sm rhy"><thead><tr><th>时辰</th><th>时段</th><th>当令经脉</th><th>天象</th><th>黄黑道</th><th>传统养生说法(子午流注)</th></tr></thead><tbody>${rows}</tbody></table></div>
   <p class="note" style="margin:8px 0 0">${di.gz}日 · ${di.zx}日。晨曦/暮色以太阳在地平线下 6° 内计(民用曙暮光)。表中养生说法出自子午流注的传统经验，只作文化与起居参照，不是医疗建议；个人作息请以自身条件为先。</p></div>`;
  };

  const __nwRenderCards177 = nwRenderCards;
  nwRenderCards = function (force) {
    __nwRenderCards177(force);
    try {
      bindNow24Interactive();
    } catch (e) {
      console.warn("[v177 now24 interactive]", e);
    }
  };

  setTimeout(() => {
    try {
      if (window.NW && NW.N && document.getElementById("pane-now")) nwRenderCards(true);
    } catch (_) {}
  }, 80);

  try {
    const bv = document.getElementById("buildVersion");

    window.TianjiSystemV177 = {
      version: "v177",
      build: BUILD,
      enhancements: {
        now24Interactive: true,
        rhythmBandRedesigned: true,
        bigObserveViewportMaximized: true,
      },
    };
  } catch (_) {}
})();
