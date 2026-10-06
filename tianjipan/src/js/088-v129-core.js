(function () {
  "use strict";
  /* ---------------- 六爻 Core：一键问事 + 规则链 + 64卦结构回归 ---------------- */
  try {
    if (typeof LYS === "object") {
      LYS.q = LYS.q || "";
      LYS.view = LYS.view || "plain";
    }
    const LY129_TOPICS = ["求财", "事业", "婚姻", "疾病", "官司", "考试", "子女", "出行", "合作"];
    function ly129QuickHTML() {
      const topic = typeof lyTopic === "string" ? lyTopic : "求财",
        q = (LYS && LYS.q) || "";
      return `<div class="panel blk ly129-quick"><div class="ly129-head"><div><h3>六爻 · 一键问事</h3><p>普通人只需写清楚“问什么”，选一种起卦方式，系统会自动完成装卦、取用、旺衰、动变与世应解读。</p></div><span class="ly129-badge">Core 1.0 · 新手入口</span></div>
      <div class="ly129-form"><label>你想问什么？<input id="ly129Q" value="${esc(q)}" placeholder="例如：这个合作现在适合推进吗？"></label>
      <label>事项<select id="ly129Topic">${LY129_TOPICS.map((x) => `<option${x === topic ? " selected" : ""}>${x}</option>`).join("")}</select></label>
      <label>起卦方式<select id="ly129Method"><option value="coin">三枚铜钱（推荐）</option><option value="dayan">大衍揲蓍</option><option value="time">当前时刻</option></select></label>
      <button type="button" class="gbtn ly129-go" id="ly129Go">一键起卦 · 自动解读</button></div>
      <div class="ly129-five"><span><b>① 起卦</b>得到六个爻，自下而上组成卦。</span><span><b>② 找“我”</b>世爻代表自己，应爻多代表对方/外界。</span><span><b>③ 找事情</b>按所问事项取妻财、官鬼、父母、子孙等用神。</span><span><b>④ 看强弱变化</b>月建、日辰、旬空、动爻、变爻共同判断力量。</span><span><b>⑤ 才下结论</b>先看结构，再看用神，不用单个“吉凶词”替代现实判断。</span></div></div>`;
    }
    function ly129Yong(L, R0, topic) {
      const T = LY_TOPIC[topic] || LY_TOPIC.求财;
      let y = T.yong;
      if (y === "*") y = R0.opt.gender === "M" ? "妻财" : "官鬼";
      if (y === "世") return { name: "世爻", row: L.rows[L.shi - 1] };
      if (y === "应") return { name: "应爻", row: L.rows[L.ying - 1] };
      const a = L.rows.filter((r) => r.rel === y);
      if (!a.length) return { name: y, row: null };
      a.sort(
        (x, z) =>
          lyStrength(z, L.monthB, L.dayIdx % 12).s - lyStrength(x, L.monthB, L.dayIdx % 12).s,
      );
      return { name: y, row: a[0] };
    }
    function ly129Plain(R0) {
      try {
        const L = lyRowsNow(R0),
          Y = ly129Yong(L, R0, lyTopic),
          rd = liuyaoReading(L, R0, lyTopic),
          sr = L.rows[L.shi - 1],
          yr = L.rows[L.ying - 1],
          mv = L.moving.length ? L.moving.map((i) => "第" + (i + 1) + "爻").join("、") : "无";
        const first = rd && rd.summary && rd.summary.length ? rd.summary[0].text : "";
        return `<div class="ly129-plain"><b>先说人话：</b>${first || `这是一卦“${L.info.name}”，先看${Y.name}和世爻的强弱，再看动爻把事情往哪里推。`}<br><b>你：</b>世爻第${L.shi}爻 · ${sr.rel}${ZHI[sr.b]}； <b>对方/外界：</b>应爻第${L.ying}爻 · ${yr.rel}${ZHI[yr.b]}； <b>这件事：</b>${Y.row ? `${Y.name}在第${Y.row.i + 1}爻 · ${ZHI[Y.row.b]} · ${Y.row.season}${Y.row.kong ? " · 旬空" : ""}` : `${Y.name}没有直接上卦，需要看伏神或旁证`}； <b>变化：</b>${mv}${L.moving.length ? `，变为${L.info2.name}` : "，事情暂时更偏“守现状、看旺衰”"}。</div>`;
      } catch (e) {
        return `<div class="ly129-plain">当前卦的白话摘要暂时无法生成：${esc(String(e.message || e))}</div>`;
      }
    }
    function ly129Trace(R0) {
      const L = lyRowsNow(R0),
        Y = ly129Yong(L, R0, lyTopic);
      return [
        [
          "定卦",
          `${L.info.name}${L.moving.length ? " → " + L.info2.name : "（静卦）"}，归${L.palName} ${L.pal.order}卦`,
        ],
        ["定世应", `世在第${L.shi}爻，应在第${L.ying}爻；世=我，应=对方/环境`],
        ["装纳甲", `六爻装入干支、五行与六亲；六神按日干起${L.rows[0].ls}`],
        [
          "看日月",
          `月建${ZHI[L.monthB]}、日辰${ZHI[L.dayIdx % 12]}、旬空${L.kong.map((z) => ZHI[z]).join("、")}`,
        ],
        [
          "取用神",
          `${lyTopic}取${Y.name}${Y.row ? "，落第" + (Y.row.i + 1) + "爻 " + ZHI[Y.row.b] : "，本卦不现则转查伏神/旁证"}`,
        ],
        [
          "看动变",
          L.moving.length
            ? L.moving.map((i) => `第${i + 1}爻 ${L.rows[i].change || "发动"}`).join("；")
            : "六爻安静：不靠动爻制造结论，重点看用神、世应与日月旺衰",
        ],
        [
          "综合",
          `把用神强弱、原神/忌神、世应关系、动变合并后再给倾向；单一六神或单一“吉凶”不独立定论`,
        ],
      ];
    }
    function ly129AuditNow(R0) {
      let pal = {};
      Object.keys(LY_PAL || {}).forEach((k) => {
        const p = LY_PAL[k] && LY_PAL[k].pal;
        pal[p] = (pal[p] || 0) + 1;
      });
      const pOk =
        Object.keys(LY_PAL || {}).length === 64 &&
        Object.values(pal).length === 8 &&
        Object.values(pal).every((n) => n === 8);
      const L = lyRowsNow(R0),
        ok =
          L.rows.length === 6 &&
          L.rows2.length === 6 &&
          L.shi >= 1 &&
          L.shi <= 6 &&
          L.ying >= 1 &&
          L.ying <= 6 &&
          L.rows.every((r) => LY_LIU.includes(r.rel) && LIUSHEN.includes(r.ls));
      return { pOk, ok, pal, L };
    }
    function ly129CoreHTML(R0) {
      const A = ly129AuditNow(R0),
        tr = ly129Trace(R0);
      return `<div class="panel blk ly129-core"><div class="ly129-head"><div><h3>六爻 Core · 规则链与自检</h3><p>把“卦是怎么装出来、为什么这样取用”拆开显示。结构自检只证明程序内部一致，不等于所有六爻流派唯一口径。</p></div><span class="ly129-badge">64 卦 · 八宫 · 纳甲</span></div>
    ${ly129Plain(R0)}<div class="ly129-coregrid"><div class="ly129-corecell"><small>64卦八宫表</small><b>${A.pOk ? "64 / 64 ✓" : "异常"}</b></div><div class="ly129-corecell"><small>当前六爻结构</small><b>${A.ok ? "通过 ✓" : "异常"}</b></div><div class="ly129-corecell"><small>世 / 应</small><b>${A.L.shi} / ${A.L.ying}</b></div><div class="ly129-corecell"><small>动爻</small><b>${A.L.moving.length}</b></div></div>
    <div class="ly129-trace">${tr.map((x, i) => `<div class="ly129-step"><i>${i + 1}</i><b>${x[0]}</b><span>${x[1]}</span></div>`).join("")}</div>
    <div class="ly129-audit"><button type="button" class="gbtn sm" id="ly129Run">运行 7,680 局结构回归</button><div class="ly129-progress"><i id="ly129Bar"></i></div><span id="ly129Pct" class="dim sm">未运行</span></div><div class="ly129-auditout" id="ly129Out">范围：64 卦 × 10 日干 × 12 月建。检查八宫映射、世应、六亲、六神、纳甲、变卦、旬空与动爻结构；不把内部自洽等同于古籍逐例 Evidence。</div></div>`;
    }
    let LY129_RUNNING = false;
    function ly129RunAudit() {
      if (LY129_RUNNING) return;
      LY129_RUNNING = true;
      const btn = $("#ly129Run"),
        bar = $("#ly129Bar"),
        pc = $("#ly129Pct"),
        out = $("#ly129Out");
      if (btn) btn.disabled = true;
      let idx = 0,
        bad = 0,
        examples = [];
      const total = 64 * 10 * 12;
      const tick = () => {
        for (let n = 0; n < 160 && idx < total; n++, idx++) {
          const h = Math.floor(idx / 120),
            rem = idx % 120,
            day = Math.floor(rem / 12),
            mb = rem % 12,
            lines = [0, 1, 2, 3, 4, 5].map((i) => (h >> i) & 1),
            mv = (day + mb + h) % 5 === 0 ? [0, 2, 5] : (day + mb + h) % 3 === 0 ? [1] : [];
          try {
            const L = liuyao(lines, mv, day, mb),
              ok =
                L &&
                L.rows.length === 6 &&
                L.rows2.length === 6 &&
                L.shi >= 1 &&
                L.shi <= 6 &&
                L.ying >= 1 &&
                L.ying <= 6 &&
                L.rows.every(
                  (r) =>
                    LY_LIU.includes(r.rel) &&
                    LIUSHEN.includes(r.ls) &&
                    r.b >= 0 &&
                    r.b < 12 &&
                    r.gan >= 0 &&
                    r.gan < 10,
                ) &&
                L.kong.length === 2;
            if (!ok) {
              bad++;
              if (examples.length < 5) examples.push({ h, day, mb });
            }
          } catch (e) {
            bad++;
            if (examples.length < 5) examples.push({ h, day, mb, err: String(e.message || e) });
          }
        }
        const p = Math.round((idx / total) * 100);
        if (bar) bar.style.width = p + "%";
        if (pc) pc.textContent = idx + " / " + total;
        if (idx < total) {
          requestAnimationFrame(tick);
        } else {
          LY129_RUNNING = false;
          if (btn) btn.disabled = false;
          if (out)
            out.innerHTML = `结构回归完成：<b class="${bad ? "bad" : "good"}">${total - bad} / ${total} 通过</b>，异常 ${bad}${examples.length ? "；样例 " + esc(JSON.stringify(examples)) : ""}。这一步是 Core 稳定性检查，古籍规则仍需单独做 Evidence 对拍。`;
        }
      };
      requestAnimationFrame(tick);
    }
    const _renderLy129 = renderLiuyao;
    renderLiuyao = function (R0) {
      return ly129QuickHTML() + _renderLy129(R0) + ly129CoreHTML(R0);
    };
    window.renderLiuyao = renderLiuyao;
    const _bindLy129 = bindLiuyao;
    bindLiuyao = function () {
      _bindLy129();
      try {
        bindReadings();
      } catch (_) {}
      const go = $("#ly129Go");
      if (go)
        go.onclick = () => {
          LYS.q = ($("#ly129Q") || {}).value || "";
          lyTopic = ($("#ly129Topic") || {}).value || "求财";
          const m = ($("#ly129Method") || {}).value || "coin";
          if (m === "coin") {
            const buf = new Uint8Array(18);
            crypto.getRandomValues(buf);
            let k = 0;
            LYS.sums = castCoins(() => buf[k++] & 1);
            LYS.mode = "coin";
          } else if (m === "dayan") {
            const d = dayanStalks(cryptoRand);
            LYS.sums = d.sums;
            LYS.dayanLog = `<p class="note" style="margin:8px 0 0">大衍揲蓍模拟（自下而上）：</p><p>${d.logs.join("</p><p>")}</p>`;
            LYS.mode = "dayan";
          } else {
            LYS.sums = null;
            LYS.mode = "time";
          }
          refRender("liuyao");
          setTimeout(() => {
            const e = $("#lyBox");
            if (e) e.scrollIntoView({ behavior: "smooth", block: "start" });
          }, 60);
        };
      const run = $("#ly129Run");
      if (run) run.onclick = ly129RunAudit;
    };
    window.bindLiuyao = bindLiuyao;
  } catch (e) {
    console.error("[v129 六爻 Core]", e);
  }

  /* ---------------- 太阳系 / 日心俯视：多参数多数据图层 ---------------- */
  try {
    const V129_TERMS = [
      ["春分", 0],
      ["清明", 15],
      ["谷雨", 30],
      ["立夏", 45],
      ["小满", 60],
      ["芒种", 75],
      ["夏至", 90],
      ["小暑", 105],
      ["大暑", 120],
      ["立秋", 135],
      ["处暑", 150],
      ["白露", 165],
      ["秋分", 180],
      ["寒露", 195],
      ["霜降", 210],
      ["立冬", 225],
      ["小雪", 240],
      ["大雪", 255],
      ["冬至", 270],
      ["小寒", 285],
      ["大寒", 300],
      ["立春", 315],
      ["雨水", 330],
      ["惊蛰", 345],
    ];
    const V129_MONTHS = [
      ["寅月", 315],
      ["卯月", 345],
      ["辰月", 15],
      ["巳月", 45],
      ["午月", 75],
      ["未月", 105],
      ["申月", 135],
      ["酉月", 165],
      ["戌月", 195],
      ["亥月", 225],
      ["子月", 255],
      ["丑月", 285],
    ];
    const V129_SEASONS = [
      ["春", 0, 90],
      ["夏", 90, 180],
      ["秋", 180, 270],
      ["冬", 270, 360],
    ];
    Object.assign(ORR3D.show, {
      terms: true,
      solarMonths: false,
      seasons: false,
      xiuRing: false,
      yqLayer: false,
    });
    ORR3D.zFocus = ORR3D.zFocus == null ? -1 : ORR3D.zFocus;
    function v129SunLon(jd) {
      try {
        return asPlanets(jd)[0].lon;
      } catch (_) {
        return sunLon(jd);
      }
    }
    function v129JdYear(jd) {
      const d = fromJD(jd + 8 / 24);
      return d.y || 2000;
    }
    function v129CurTerm(lon) {
      let best = V129_TERMS[0],
        bd = 999;
      V129_TERMS.forEach((t) => {
        let d = Math.abs(((lon - t[1] + 540) % 360) - 180);
        if (d < bd) {
          bd = d;
          best = t;
        }
      });
      return best;
    }
    function v129SolarMonth(lon) {
      const i = Math.floor(norm360(lon - 315) / 30);
      return V129_MONTHS[i][0];
    }
    function v129QiAt(jd, lon) {
      const d = fromJD(jd + 8 / 24),
        gy = d.m <= 2 && lon < 315 ? d.y - 1 : d.y,
        idx = ganzhiIdx((((gy - 4) % 10) + 10) % 10, (((gy - 4) % 12) + 12) % 12);
      return wuyunLiuqi(idx, lon);
    }
    function v129LayerMeta() {
      const el = $("#orr129Meta");
      if (!el || ORR3D.mode === "sem") {
        if (el) el.hidden = true;
        return;
      }
      el.hidden = false;
      const lon = v129SunLon(ORR3D.jd),
        d = fromJD(ORR3D.jd + 8 / 24),
        term = v129CurTerm(lon),
        mon = v129SolarMonth(lon),
        sign = AS_SIGN[Math.floor(lon / 30)],
        x = typeof xiuOf === "function" ? xiuOf(lon, d.y) : null,
        q = v129QiAt(ORR3D.jd, lon);
      el.innerHTML = `<span>太阳黄经 <b>${lon.toFixed(2)}°</b></span><span>最近节气点 <b>${term[0]} ${term[1]}°</b></span><span>节令月 <b>${mon}</b></span><span>黄道宫 <b>${sign[1]} ${sign[0]}座 · ${sign[3]}象</b></span>${x ? `<span>二十八宿 <b>${x.n || x.name || ""}</b></span>` : ""}<span>六气 <b>${["初", "二", "三", "四", "五", "终"][q.step]}之气 · ${q.guest[q.step]}</b></span>`;
    }
    function v129RingPt(lon, r) {
      const a = lon * D2R;
      return { x: r * Math.cos(a), y: r * Math.sin(a), z: 0 };
    }
    function v129DrawTick(lon, r0, r1, label, col, font, alpha) {
      const c = ORR3D.ctx,
        p0 = orr3dProj(v129RingPt(lon, r0).x, v129RingPt(lon, r0).y, 0),
        p1 = orr3dProj(v129RingPt(lon, r1).x, v129RingPt(lon, r1).y, 0);
      c.save();
      c.globalAlpha = alpha == null ? 0.72 : alpha;
      c.strokeStyle = col;
      c.fillStyle = col;
      c.lineWidth = 1;
      c.beginPath();
      c.moveTo(p0.x, p0.y);
      c.lineTo(p1.x, p1.y);
      c.stroke();
      if (label) {
        c.font = font || "9px sans-serif";
        c.textAlign = "center";
        c.fillText(label, p1.x, p1.y - 3);
      }
      c.restore();
    }
    function v129DrawOrbitLayers() {
      if (!ORR3D.ctx || ORR3D.mode !== "3d") return;
      const c = ORR3D.ctx,
        show = ORR3D.show,
        lon = v129SunLon(ORR3D.jd),
        year = v129JdYear(ORR3D.jd);
      if (show.seasons) {
        V129_SEASONS.forEach((s, i) => {
          const pts = [];
          for (let a = s[1]; a <= s[2]; a += 3) pts.push(v129RingPt(a, 252));
          orr3dPath(pts, ["#70ad76", "#d18458", "#c69b56", "#668db5"][i], 4, null, 0.16);
          v129DrawTick(
            (s[1] + s[2]) / 2,
            248,
            257,
            s[0],
            ["#70ad76", "#d18458", "#c69b56", "#668db5"][i],
            "bold 10px serif",
            0.72,
          );
        });
      }
      if (show.terms)
        V129_TERMS.forEach((t, i) =>
          v129DrawTick(
            t[1],
            260,
            272,
            t[0],
            i % 3 === 0 ? "#e1bd70" : "rgba(216,196,155,.72)",
            i % 3 === 0 ? "9px serif" : "7.5px serif",
            i % 3 === 0 ? 0.88 : 0.58,
          ),
        );
      if (show.solarMonths)
        V129_MONTHS.forEach((m) =>
          v129DrawTick(m[1], 276, 287, m[0], "rgba(108,190,172,.9)", "8px serif", 0.72),
        );
      if (show.xiuRing && typeof xiuTable === "function") {
        const tb = xiuTable(year);
        tb.forEach((x, i) =>
          v129DrawTick(
            norm360(x.s + x.w / 2),
            290,
            299,
            x.n,
            "rgba(140,170,215,.82)",
            "7.5px serif",
            0.58,
          ),
        );
      }
      if (show.yqLayer) {
        for (let i = 0; i < 6; i++)
          v129DrawTick(
            norm360(300 + i * 60),
            302,
            314,
            ["初气", "二气", "三气", "四气", "五气", "终气"][i],
            "rgba(208,122,100,.82)",
            "8px serif",
            0.72,
          );
      }
      if (show.zodiac && ORR3D.zFocus >= 0) {
        const a0 = ORR3D.zFocus * 30,
          pts = [];
        for (let a = a0; a <= a0 + 30; a += 2) pts.push(v129RingPt(a, 243));
        orr3dPath(pts, "rgba(231,201,122,.95)", 5, null, 0.42);
      }
      const p0 = v129RingPt(lon, 245),
        p1 = v129RingPt(lon, 317),
        a = orr3dProj(p0.x, p0.y, 0),
        b = orr3dProj(p1.x, p1.y, 0);
      c.save();
      c.strokeStyle = "rgba(240,199,95,.82)";
      c.lineWidth = 1.2;
      c.setLineDash([4, 3]);
      c.beginPath();
      c.moveTo(a.x, a.y);
      c.lineTo(b.x, b.y);
      c.stroke();
      c.restore();
      v129LayerMeta();
    }
    function v129HelioLayers() {
      const svg = $("#orrHelioSvg");
      if (!svg) return;
      const old = svg.querySelector("#v129HelioLayers");
      if (old) old.remove();
      const show = ORR3D.show,
        C = 310,
        lon = v129SunLon(ORR3D.jd),
        year = v129JdYear(ORR3D.jd),
        Q = (a, r) => {
          const x = a * D2R;
          return [C + r * Math.cos(x), C - r * Math.sin(x)];
        };
      let s = '<g id="v129HelioLayers">';
      if (show.seasons)
        V129_SEASONS.forEach((z, i) => {
          const p = Q((z[1] + z[2]) / 2, 304);
          s += `<text x="${p[0].toFixed(1)}" y="${p[1].toFixed(1)}" fill="${["#70ad76", "#d18458", "#c69b56", "#668db5"][i]}" font-size="11" text-anchor="middle">${z[0]}</text>`;
        });
      if (show.terms)
        V129_TERMS.forEach((t, i) => {
          const a = Q(t[1], 282),
            b = Q(t[1], i % 3 === 0 ? 300 : 293),
            l = Q(t[1], i % 3 === 0 ? 309 : 300);
          s += `<line x1="${a[0].toFixed(1)}" y1="${a[1].toFixed(1)}" x2="${b[0].toFixed(1)}" y2="${b[1].toFixed(1)}" stroke="${i % 3 === 0 ? "#d9b25f" : "rgba(170,145,105,.65)"}" stroke-width="${i % 3 === 0 ? 1.2 : 0.7}"/><text x="${l[0].toFixed(1)}" y="${(l[1] + 3).toFixed(1)}" fill="${i % 3 === 0 ? "#d9b25f" : "rgba(160,145,120,.75)"}" font-size="${i % 3 === 0 ? 8 : 6.5}" text-anchor="middle">${t[0]}</text>`;
        });
      if (show.solarMonths)
        V129_MONTHS.forEach((m) => {
          const a = Q(m[1], 248),
            b = Q(m[1], 260),
            l = Q(m[1] + 4, 250);
          s += `<line x1="${a[0].toFixed(1)}" y1="${a[1].toFixed(1)}" x2="${b[0].toFixed(1)}" y2="${b[1].toFixed(1)}" stroke="rgba(98,205,195,.7)"/><text x="${l[0].toFixed(1)}" y="${(l[1] + 3).toFixed(1)}" fill="rgba(98,205,195,.9)" font-size="7" text-anchor="middle">${m[0]}</text>`;
        });
      if (show.xiuRing && typeof xiuTable === "function")
        xiuTable(year).forEach((x) => {
          const a = norm360(x.s + x.w / 2),
            p = Q(a, 232);
          s += `<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="1.7" fill="rgba(120,165,220,.75)"/><text x="${p[0].toFixed(1)}" y="${(p[1] - 4).toFixed(1)}" fill="rgba(140,175,220,.78)" font-size="6.3" text-anchor="middle">${x.n}</text>`;
        });
      if (show.yqLayer)
        for (let i = 0; i < 6; i++) {
          const p = Q(300 + i * 60, 218);
          s += `<text x="${p[0].toFixed(1)}" y="${(p[1] + 3).toFixed(1)}" fill="rgba(208,122,100,.82)" font-size="7.3" text-anchor="middle">${["初气", "二气", "三气", "四气", "五气", "终气"][i]}</text>`;
        }
      if (show.zodiac && ORR3D.zFocus >= 0) {
        const p1 = Q(ORR3D.zFocus * 30 + 15, 274);
        s += `<circle cx="${p1[0].toFixed(1)}" cy="${p1[1].toFixed(1)}" r="16" fill="none" stroke="#e6c77f" stroke-width="2" opacity=".85"/>`;
      }
      const a = Q(lon, 212),
        b = Q(lon, 306);
      s += `<line x1="${a[0].toFixed(1)}" y1="${a[1].toFixed(1)}" x2="${b[0].toFixed(1)}" y2="${b[1].toFixed(1)}" stroke="#e6c77f" stroke-dasharray="4 3" stroke-width="1.2" opacity=".78"/></g>`;
      svg.insertAdjacentHTML("beforeend", s);
      v129LayerMeta();
    }
    const _h129 = orr3dHTML;
    orr3dHTML = function () {
      let h = _h129();
      h = h.replace(
        '</div><div class="orr3d-info" id="orr3dInfo">',
        '<label class="only-system"><input type="checkbox" id="orr3dT_term" checked> 节气24点</label><label class="only-system"><input type="checkbox" id="orr3dT_month"> 节令十二月</label><label class="only-system"><input type="checkbox" id="orr3dT_season"> 四季分区</label><label class="only-system"><input type="checkbox" id="orr3dT_xiur"> 二十八宿度</label><label class="only-system"><input type="checkbox" id="orr3dT_yq"> 五运六气</label></div><div class="orr129-meta" id="orr129Meta"></div><div class="orr3d-info" id="orr3dInfo">',
      );
      return h;
    };
    window.orr3dHTML = orr3dHTML;
    const _d129 = orr3dDraw;
    orr3dDraw = function () {
      const r = _d129.apply(this, arguments);
      try {
        v129DrawOrbitLayers();
      } catch (e) {
        console.error("[v129 3D layers]", e);
      }
      return r;
    };
    window.orr3dDraw = orr3dDraw;
    const _he129 = orr3dHelioRender;
    orr3dHelioRender = function () {
      const r = _he129.apply(this, arguments);
      try {
        v129HelioLayers();
      } catch (e) {
        console.error("[v129 helio layers]", e);
      }
      return r;
    };
    window.orr3dHelioRender = orr3dHelioRender;
    const _m129 = orr3dSetMode;
    orr3dSetMode = function (mode) {
      const r = _m129.apply(this, arguments);
      try {
        v129LayerMeta();
        if (mode === "helio") v129HelioLayers();
      } catch (_) {}
      return r;
    };
    window.orr3dSetMode = orr3dSetMode;
    function v129BindLayerTog() {
      [
        ["orr3dT_term", "terms"],
        ["orr3dT_month", "solarMonths"],
        ["orr3dT_season", "seasons"],
        ["orr3dT_xiur", "xiuRing"],
        ["orr3dT_yq", "yqLayer"],
      ].forEach(([id, k]) => {
        const e = $("#" + id);
        if (!e || e.dataset.v129) return;
        e.dataset.v129 = "1";
        e.checked = !!ORR3D.show[k];
        e.onchange = () => {
          ORR3D.show[k] = e.checked;
          if (ORR3D.mode === "helio") orr3dHelioRender();
          else orr3dDraw();
        };
      });
      v129LayerMeta();
    }
    const _b129 = bindOrr3d;
    bindOrr3d = function () {
      const r = _b129.apply(this, arguments);
      try {
        v129BindLayerTog();
      } catch (e) {
        console.error("[v129 layer bind]", e);
      }
      return r;
    };
    window.bindOrr3d = bindOrr3d;

    /* 命主桥接：v128 的 helper 位于闭包内，v129 自己判断当前是否载入人物。 */
    function v129HasPerson() {
      try {
        return typeof meHas === "function" && meHas() && typeof R !== "undefined" && R && R.bz;
      } catch (_) {
        return false;
      }
    }
    function v129Person() {
      try {
        return v129HasPerson() && typeof meP === "function" ? meP() : null;
      } catch (_) {
        return null;
      }
    }
    function v129PersonName() {
      try {
        return v129HasPerson()
          ? ((document.getElementById("pname") || {}).value || "当前命主").trim() || "当前命主"
          : "";
      } catch (_) {
        return "";
      }
    }

    /* 黄道十二宫：用途 / 操作 / 命主联动 */
    const V129_SIGN_DESC = [
      ["白羊", "火", "开创", "主动、起步、直接"],
      ["金牛", "土", "固定", "稳定、资源、耐力"],
      ["双子", "风", "变动", "信息、交流、连接"],
      ["巨蟹", "水", "开创", "照顾、安全感、归属"],
      ["狮子", "火", "固定", "表达、创造、被看见"],
      ["处女", "土", "变动", "分析、整理、改进"],
      ["天秤", "风", "开创", "关系、协调、权衡"],
      ["天蝎", "水", "固定", "深度、边界、转化"],
      ["射手", "火", "变动", "探索、学习、远方"],
      ["摩羯", "土", "开创", "结构、责任、长期目标"],
      ["水瓶", "风", "固定", "创新、群体、独立思考"],
      ["双鱼", "水", "变动", "感受、想象、共情"],
    ];
    function v129NatalSign(R0) {
      try {
        const p = R0.astro.planets.find((x) => x.n === "太阳") || R0.astro.planets[0],
          i = Math.floor(p.lon / 30);
        return { i, lon: p.lon, d: V129_SIGN_DESC[i] };
      } catch (_) {
        return null;
      }
    }
    function v129ZodiacPanel(R0) {
      const nat = v129HasPerson() ? v129NatalSign(R0) : null,
        sun = v129SunLon(ORR3D.jd || R0.t.jdUT),
        nowi = Math.floor(sun / 30),
        ni = nat ? nat.i : -1;
      return `<div class="panel blk z129" id="z129Panel"><div class="z129-head"><div><h3 class="sec">黄道十二宫 · 用法与联动</h3><p class="note" style="margin:2px 0 0">这里把十二宫作为黄道经度的 12 个 30° 区段来用：可定位太阳/行星、联动太阳系图层，也可展示西方占星的传统象征语言。占星性格描述属于文化/象征解释，不是科学人格测量。</p></div><span class="ly129-badge">0° 白羊起</span></div>
    <div class="z129-kv"><span class="pill">模拟太阳：${A2_GLYPH[nowi]} ${A2_SIGN[nowi]}座</span>${nat ? `<span class="pill g">命主太阳：${A2_GLYPH[ni]} ${A2_SIGN[ni]}座 · ${A2_ELEM[ni]}象</span>` : '<span class="pill">未载入命主</span>'}<span class="pill">点击宫位 → 太阳系与日心俯视同步高亮</span></div>
    <div class="z129-main"><div class="z129-signs">${V129_SIGN_DESC.map((d, i) => `<button type="button" class="z129-sign${i === ORR3D.zFocus ? " on" : ""}" data-z129="${i}"><b>${A2_GLYPH[i]} ${d[0]}</b><small>${d[1]}象 · ${d[2]}</small></button>`).join("")}</div><div class="z129-info" id="z129Info">${v129SignInfo(ni >= 0 ? ni : nowi, nat && ni >= 0)}</div></div></div>`;
    }
    function v129SignInfo(i, isNatal) {
      const d = V129_SIGN_DESC[i];
      return `<h4>${A2_GLYPH[i]} ${d[0]}座</h4><p><b>${d[1]}象 · ${d[2]}模式</b>。在西方占星传统里，常用“${d[3]}”作为这一宫位的象征关键词。</p><p><b>怎么用：</b>先看太阳/行星落在哪一宫，再结合相位与宫位，不建议只凭“我是某星座”直接下结论。</p>${isNatal ? `<p><b>命主联动：</b>当前命主出生太阳落在这里，所以页面会把它作为个人星座标签；它只代表西方占星体系中的太阳位置，不替代八字、紫微等体系。</p>` : ""}`;
    }
    function v129BindZodiac() {
      document.querySelectorAll("[data-z129]").forEach(
        (b) =>
          (b.onclick = () => {
            ORR3D.zFocus = +b.dataset.z129;
            ORR3D.show.zodiac = true;
            const ck = $("#orr3dT_zd");
            if (ck) ck.checked = true;
            document
              .querySelectorAll("[data-z129]")
              .forEach((x) => x.classList.toggle("on", x === b));
            const inf = $("#z129Info");
            if (inf)
              inf.innerHTML = v129SignInfo(
                ORR3D.zFocus,
                !!(v129NatalSign(R) && v129NatalSign(R).i === ORR3D.zFocus),
              );
            if (ORR3D.mode === "helio") orr3dHelioRender();
            else orr3dDraw();
          }),
      );
    }

    /* 五运六气 / 子午流注 与命主关联 */
    function v129PersonBase() {
      try {
        return v129HasPerson() ? { P: v129Person(), name: v129PersonName() || "当前命主" } : null;
      } catch (_) {
        return null;
      }
    }
    function v129QiWx(name) {
      if (/木/.test(name)) return 0;
      if (/火/.test(name)) return 1;
      if (/土/.test(name)) return 2;
      if (/金/.test(name)) return 3;
      if (/水/.test(name)) return 4;
      return -1;
    }
    function v129WxRelation(wx, P) {
      if (wx < 0 || !P || !P.deep || !P.deep.xy) return 0;
      return P.deep.xy.favor.includes(wx) ? 1 : P.deep.xy.avoid.includes(wx) ? -1 : 0;
    }
    function v129YqText(q) {
      const B = v129PersonBase();
      if (!B)
        return `<div class="v129-person-bridge generic"><b>普适提醒：</b>当前为${["初", "二", "三", "四", "五", "终"][q.step]}之气，主气${LQ_ZHU[q.step]}、客气${q.guest[q.step]}。把它作为传统季节节律的参考，不用于预测个人疾病或具体事件。</div>`;
      const wx = v129QiWx(q.guest[q.step]),
        r = v129WxRelation(wx, B.P),
        w = WXK[wx] || "—",
        msg =
          r > 0
            ? `客气属${w}，在你的八字取用里偏有利，可把这一阶段理解为“环境节奏比较顺手”，适合稳步推进，而不是盲目加速。`
            : r < 0
              ? `客气属${w}，在你的八字取用里偏需要节制。更适合留余量、少熬夜少硬扛，把重要事情拆小验证。`
              : `客气属${w}，与你的喜忌不是明显同向或反向，更适合作为季节与作息背景。`;
      return `<div class="v129-person-bridge"><b>${esc(B.name)} · 五运六气合参：</b>${msg}<br><span class="dim">这是传统五行象类的跨体系合参，不表示气候或“六气”会直接造成个人事件；身体不适按现代医学处理。</span></div>`;
    }
    function v129LzText(branch) {
      const B = v129PersonBase(),
        z = ZW_LZ[branch];
      if (!B)
        return `<div class="v129-person-bridge generic"><b>普适提醒：</b>${ZHI[branch]}时传统纳支法对应${z[2]}。可把“${z[5]}”当作作息提示，不把经络时辰当成诊断依据。</div>`;
      const r = v129WxRelation(z[4], B.P),
        msg =
          r > 0
            ? `这一时辰传统五行归${WXK[z[4]]}，与你的喜用偏同向。适合把重要任务放在自己精神状态确实不错的时候完成，不必为了时辰强行调整生活。`
            : r < 0
              ? `这一时辰传统五行归${WXK[z[4]]}，与你的喜用偏反向。更值得提醒的是控制疲劳与节奏，而不是回避这个时辰。`
              : `这一时辰与你的喜忌没有强烈冲突，以正常作息和真实体感为先。`;
      return `<div class="v129-person-bridge"><b>${esc(B.name)} · 子午流注合参：</b>${ZHI[branch]}时 · ${z[2]}。${msg}<br><span class="dim">经络时辰属于传统养生框架，只做生活节律提示，不用于诊断或治疗。</span></div>`;
    }
    function v129YqLzPanel(R0) {
      const q = R0.astro && R0.astro.yq,
        br = R0.bz.pill[3].b;
      if (!q) return "";
      return `<div class="panel blk"><h3 class="sec">五运六气 / 子午流注 · 与命主关联</h3><p class="note" style="margin-top:0">同一套传统时间信息，除了“现在是什么”，还要回答“对当前命主应该怎么理解”。有命主时按其八字喜忌做象类合参；没有命主时退回普适说明。</p><div class="v129-yqlz"><div class="v129-mini"><h4>五运六气</h4><div class="kv"><span>${q.gz} <b>${q.yunName}</b></span><span>当前 <b>${q.guest[q.step]}</b></span></div>${v129YqText(q)}</div><div class="v129-mini"><h4>子午流注</h4><div class="kv"><span>${ZHI[br]}时 <b>${ZW_LZ[br][2]}</b></span><span>五行 <b>${WXK[ZW_LZ[br][4]]}</b></span></div>${v129LzText(br)}</div></div></div>`;
    }

    const _ra129 = renderAstro;
    renderAstro = function (R0) {
      let h = _ra129(R0);
      return h + v129ZodiacPanel(R0) + v129YqLzPanel(R0);
    };
    window.renderAstro = renderAstro;
    const _refDecorate129 = refDecorate;
    refDecorate = function () {
      const r = _refDecorate129.apply(this, arguments);
      try {
        v129BindLayerTog();
        v129BindZodiac();
      } catch (e) {
        console.error("[v129 astro extras]", e);
      }
      return r;
    };
    window.refDecorate = refDecorate;
    /* NW_CARDS 保存的是旧函数引用，所以直接替换卡片 html/key。 */
    try {
      const cy = NW_CARDS.find((x) => x.id === "nwc-yq");
      if (cy && !cy._v129) {
        cy._v129 = 1;
        const oh = cy.html,
          ok = cy.key;
        cy.html = (N) => {
          let h = oh(N);
          return h.replace(/<\/div>\s*$/, v129YqText(N.R.astro.yq) + "</div>");
        };
        cy.key = (N) => ok(N) + "|v129|" + (v129HasPerson() ? v129PersonName() : "generic");
      }
      const cl = NW_CARDS.find((x) => x.id === "nwc-lz");
      if (cl && !cl._v129) {
        cl._v129 = 1;
        const oh = cl.html,
          ok = cl.key;
        cl.html = (N) => {
          let h = oh(N);
          return h.replace(/<\/div>\s*$/, v129LzText(N.sc.b) + "</div>");
        };
        cl.key = (N) => ok(N) + "|v129|" + (v129HasPerson() ? v129PersonName() : "generic");
      }
    } catch (e) {
      console.error("[v129 NW yq/lz]", e);
    }
  } catch (e) {
    console.error("[v129 astro/yq/zodiac]", e);
  }

  /* 版本 */
  try {
    const v = document.getElementById("buildVersion");
  } catch (_) {}
})();
