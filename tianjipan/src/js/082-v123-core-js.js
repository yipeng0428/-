(function () {
  "use strict";
  const V123_BUILD = "v123 · 2026-10-04 15:20 +08:00";

  /* ========================= 大六壬 Core · 特殊课体第二阶段 =========================
   只把有明确文献依据、可复现的分歧做成口径开关。
   当前可切换项：阴日别责初传——古法“支前三合直取本支” vs v122 旧实现“取该位上神”。
   涉害/伏吟/返吟/八专等其余差异先做候选审计与提示，不伪造未校定流派算法。
*/
  const LR123_K = "tianjipan.liuren.policy.v123";
  let LR123_POLICY = "classic";
  try {
    LR123_POLICY = localStorage.getItem(LR123_K) || "classic";
  } catch (_) {}
  const LR123_OLD_LIUREN = liuren;
  function lr123Mk(r, z) {
    return {
      z: z,
      gen: r.gen[z],
      rel: r.relOf(z),
      dun: r.dun[z] || "",
      kong: r.kong.includes(z),
      from: r.earthOf[z],
    };
  }
  function lr123ApplyPolicy(r) {
    if (!r) return r;
    r.policy123 = LR123_POLICY;
    if (LR123_POLICY === "classic" && r.ge === "别责" && r.dg % 2 === 1) {
      const groups = [
          [8, 0, 4],
          [2, 6, 10],
          [5, 9, 1],
          [11, 3, 7],
        ],
        grp = groups.find((g) => g.includes(r.dz));
      if (grp) {
        const nx = grp[(grp.indexOf(r.dz) + 1) % 3],
          s1 = r.sky[LR_JIGONG[r.dg]];
        r.chu = [lr123Mk(r, nx), lr123Mk(r, s1), lr123Mk(r, s1)];
        r.sub = "阴日·支前三合直取本支（古法口径）";
        r.policyChanged123 = true;
      }
    }
    return r;
  }
  liuren = function (dayIdx, hb, zj, opt) {
    return lr123ApplyPolicy(LR123_OLD_LIUREN(dayIdx, hb, zj, opt));
  };
  try {
    window.liuren = liuren;
  } catch (_) {}

  function lr123Depth(lr, k) {
    const J = Array.from({ length: 12 }, () => []);
    LR_JIGONG.forEach((b, g) => J[b].push(g));
    const xw = ZHI_WX[k.u],
      hit = (w) => (k.rel === "克" ? wxKe(xw, w) : wxKe(w, xw));
    let cnt = 0,
      b = k.l;
    for (let step = 0; step < 12; step++) {
      if (hit(ZHI_WX[b])) cnt++;
      J[b].forEach((g) => {
        if (hit(GAN_WX[g])) cnt++;
      });
      if (b === k.u) break;
      b = (b + 1) % 12;
    }
    return cnt;
  }
  function lr123Rank(z) {
    return [2, 5, 8, 11].includes(z) ? "孟" : [0, 3, 6, 9].includes(z) ? "仲" : "季";
  }
  function lr123CandidateRows(lr) {
    const zei = [],
      ke = [];
    lr.ke.forEach((k, i) => {
      const x = Object.assign({ i: i }, k);
      if (k.rel === "贼" && !zei.some((q) => q.u === k.u)) zei.push(x);
      if (k.rel === "克" && !ke.some((q) => q.u === k.u)) ke.push(x);
    });
    const pool = zei.length ? zei : ke,
      dyy = lr.dg % 2,
      selected = lr.chu && lr.chu[0] ? lr.chu[0].z : -1;
    if (!pool.length) return "";
    return pool
      .map(
        (c) =>
          `<tr class="${c.u === selected ? "pick" : ""}"><td>${["一", "二", "三", "四"][c.i]}课</td><td><b>${ZHI[c.u]}</b></td><td>${c.rel === "贼" ? "下贼上" : "上克下"}</td><td>${c.u % 2 === dyy ? "同" : "异"}</td><td>${lr123Depth(lr, c)}</td><td>${lr123Rank(c.l)}</td></tr>`,
      )
      .join("");
  }
  function lr123Branch(lr) {
    const z = lr.ke.filter((k) => k.rel === "贼").length,
      k = lr.ke.filter((k) => k.rel === "克").length,
      rows = [];
    rows.push({ n: "贼克", on: z || k, t: `下贼上 ${z} · 上克下 ${k}` });
    rows.push({
      n: "比用 / 涉害",
      on: lr.ge === "知一" || lr.ge === "涉害",
      t:
        lr.ge === "涉害"
          ? `已进入涉害：${lr.sub}`
          : lr.ge === "知一"
            ? `已由阴阳比用定初传：${lr.sub}`
            : "未进入或候选唯一",
    });
    rows.push({
      n: "遥克",
      on: lr.ge === "遥克",
      t: lr.ge === "遥克" ? lr.sub : "无直接贼克时才检查",
    });
    rows.push({ n: "昴星", on: lr.ge === "昴星", t: "四课俱全、无贼克、无遥克时检查" });
    rows.push({
      n: "别责",
      on: lr.ge === "别责",
      t: lr.ge === "别责" ? lr.sub : "四课仅三课、无贼克遥克时检查",
    });
    rows.push({
      n: "八专",
      on: lr.ge === "八专",
      t: lr.ge === "八专" ? lr.sub : "四课仅两课的八专日分支",
    });
    rows.push({
      n: "伏吟 / 返吟",
      on: lr.fuyin || lr.fanyin,
      t: lr.fuyin ? "天地盘伏吟；" + lr.sub : lr.fanyin ? "天地盘返吟；" + lr.sub : "当前非伏返吟",
    });
    return rows
      .map(
        (x) => `<div class="${x.on ? "on" : ""}"><b>${x.on ? "● " : "○ "}${x.n}</b> · ${x.t}</div>`,
      )
      .join("");
  }
  function lr123Panel(R) {
    const lr = R.lr,
      sens = ["涉害", "伏吟", "返吟", "八专", "别责"].includes(lr.ge),
      cand = lr123CandidateRows(lr);
    const matrix = cand
      ? `<table class="lr123-matrix"><thead><tr><th>候选课</th><th>上神</th><th>克型</th><th>与日干阴阳</th><th>涉害计数</th><th>孟仲季</th></tr></thead><tbody>${cand}</tbody></table>`
      : `<p class="note">当前课无直接贼克候选，查看右侧特殊分支诊断。</p>`;
    return `<div class="panel blk lr123-lab"><div class="lr123-head"><div><h3>大六壬 Core · 特殊课体审计</h3><small>候选矩阵 · 流派敏感项 · 720 结构回归；不把尚未校定的流派差异伪装成唯一答案</small></div><div class="lr123-policy"><label>取传口径 <select id="lr123Policy"><option value="classic"${LR123_POLICY === "classic" ? " selected" : ""}>古法校订（默认）</option><option value="legacy"${LR123_POLICY === "legacy" ? " selected" : ""}>v122 旧口径（兼容）</option></select></label>${sens ? '<span class="lr123-sensitive">流派敏感课体</span>' : ""}</div></div><div class="lr123-grid"><section class="lr123-card"><h4>发用候选矩阵</h4>${matrix}<p class="lr123-note">高亮行为当前初传。涉害计数只用于解释现有算法的候选深浅；“同/异”表示候选上神阴阳是否与日干一致。</p></section><aside class="lr123-card"><h4>九宗门分支诊断</h4><div class="lr123-branch">${lr123Branch(lr)}</div><p class="lr123-note"><b>口径说明：</b>“古法校订”目前只改变已能明确核对的阴日别责：初传直接取日支三合局前一支，中末仍归干上神。其它特殊课体继续显示差异敏感提示，待逐课古籍/外部实现对拍后再开放切换。</p></aside></div><div class="lr123-reg"><div class="row"><button class="gbtn sm" id="lr123Reg">运行 720 课结构回归</button><div class="lr123-progress"><i id="lr123Prog"></i></div><span class="dim sm" id="lr123Pct">按需运行，不占首屏</span></div><div class="lr123-regout" id="lr123Out">60 日 × 12 种月将/占时相对位置 = 720 个结构课例；检查无异常、三传完整、天地盘互逆，并统计课体分布。此测试是程序回归，不等于 720 古籍课例逐条外部对拍。</div></div></div>`;
  }
  const LR123_OLD_RENDER = renderLiuren;
  renderLiuren = function (R) {
    try {
      if (R && R.lr) {
        R.lr = liuren(
          R.lr.dg + Math.floor((R.bz.dayIdx - R.lr.dg) / 10) * 10,
          R.lr.hb,
          R.lr.zj,
          {},
        );
      }
    } catch (_) {}
    return LR123_OLD_RENDER(R) + lr123Panel(R);
  };
  try {
    window.renderLiuren = renderLiuren;
  } catch (_) {}
  function lr123BasicAudit(r) {
    if (
      !r ||
      !Array.isArray(r.sky) ||
      new Set(r.sky).size !== 12 ||
      !Array.isArray(r.chu) ||
      r.chu.length !== 3
    )
      return false;
    for (let i = 0; i < 12; i++) if (r.earthOf[r.sky[i]] !== i) return false;
    return r.chu.every((c) => c && c.z >= 0 && c.z < 12);
  }
  let LR123_RUN = 0;
  function lr123Regression() {
    if (LR123_RUN) return;
    LR123_RUN = 1;
    const btn = document.getElementById("lr123Reg"),
      bar = document.getElementById("lr123Prog"),
      pct = document.getElementById("lr123Pct"),
      out = document.getElementById("lr123Out");
    if (btn) btn.disabled = true;
    let idx = 0,
      bad = 0,
      dist = {};
    function step() {
      for (let n = 0; n < 36 && idx < 720; n++, idx++) {
        const day = Math.floor(idx / 12),
          off = idx % 12,
          r = liuren(day, 0, off, {});
        if (!lr123BasicAudit(r)) bad++;
        dist[r.ge] = (dist[r.ge] || 0) + 1;
      }
      const p = (idx / 720) * 100;
      if (bar) bar.style.width = p.toFixed(1) + "%";
      if (pct) pct.textContent = Math.round(p) + "%";
      if (idx < 720) {
        setTimeout(step, 0);
        return;
      }
      LR123_RUN = 0;
      if (btn) btn.disabled = false;
      if (pct) pct.textContent = bad ? "发现异常" : "结构回归通过";
      if (out)
        out.innerHTML =
          `完成 720 课：<b>${720 - bad}</b> 通过，<b class="${bad ? "bad" : "good"}">${bad}</b> 异常。课体分布：` +
          Object.keys(dist)
            .sort((a, b) => dist[b] - dist[a])
            .map((k) => `${k} ${dist[k]}`)
            .join(" · ") +
          `。`;
    }
    step();
  }
  document.addEventListener("change", function (e) {
    if (e.target && e.target.id === "lr123Policy") {
      LR123_POLICY = e.target.value;
      try {
        localStorage.setItem(LR123_K, LR123_POLICY);
      } catch (_) {}
      if (typeof R !== "undefined" && R && R.lr) R.lr = liuren(R.bz.dayIdx, R.lr.hb, R.lr.zj, {});
      try {
        refRender("liuren");
      } catch (_) {}
    }
  });
  document.addEventListener("click", function (e) {
    if (e.target && e.target.id === "lr123Reg") lr123Regression();
  });

  /* ========================= 报时 · 特殊天象提醒 ========================= */
  if (typeof BELL !== "undefined") {
    if (BELL.astro == null) BELL.astro = true;
    if (!Array.isArray(BELL.astroLead)) BELL.astroLead = [2, 1, 0];
    if (!BELL.astroTime) BELL.astroTime = "08:00";
    if (BELL.astroEclipse == null) BELL.astroEclipse = true;
    if (BELL.astroMeteor == null) BELL.astroMeteor = true;
    if (BELL.astroPlanet == null) BELL.astroPlanet = true;
    if (!BELL.astroSeen || typeof BELL.astroSeen !== "object") BELL.astroSeen = {};
  }
  let ASTRO_BELL_DAY = "";
  const AB_DAY = 86400000;
  function abBjDay(ms) {
    return Math.floor((ms + 8 * 3600000) / AB_DAY);
  }
  function abFmtBJ(d) {
    const x = new Date(d.getTime() + 8 * 3600000);
    return `${x.getUTCFullYear()}-${f2(x.getUTCMonth() + 1)}-${f2(x.getUTCDate())} ${f2(x.getUTCHours())}:${f2(x.getUTCMinutes())}`;
  }
  function abSep(a, b) {
    let d = Math.abs(a - b) % 360;
    return d > 180 ? 360 - d : d;
  }
  function v123Dir(a) {
    const N = ["北", "东北", "东", "东南", "南", "西南", "西", "西北"];
    return N[Math.round((((a % 360) + 360) % 360) / 45) % 8];
  }
  function abPlanetsAt(ms) {
    const jd = ms / 86400000 + 2440587.5;
    return asPlanets(jd);
  }
  function abPlanetEvents(nowMs, maxLead) {
    const out = [],
      names = ["水星", "金星", "火星", "木星", "土星"],
      outer = ["火星", "木星", "土星"],
      base = abBjDay(nowMs);
    function noon(day) {
      return day * AB_DAY - 8 * 3600000 + 12 * 3600000;
    }
    for (let lead = 0; lead <= maxLead; lead++) {
      const day = base + lead,
        ms = noon(day),
        A = abPlanetsAt(ms),
        P = Object.fromEntries(A.map((x) => [x.n, x]));
      for (let i = 0; i < names.length; i++)
        for (let j = i + 1; j < names.length; j++) {
          const a = names[i],
            b = names[j],
            s = abSep(P[a].lon, P[b].lon),
            sp = abSep(
              Object.fromEntries(abPlanetsAt(ms - AB_DAY).map((x) => [x.n, x]))[a].lon,
              Object.fromEntries(abPlanetsAt(ms - AB_DAY).map((x) => [x.n, x]))[b].lon,
            ),
            sn = abSep(
              Object.fromEntries(abPlanetsAt(ms + AB_DAY).map((x) => [x.n, x]))[a].lon,
              Object.fromEntries(abPlanetsAt(ms + AB_DAY).map((x) => [x.n, x]))[b].lon,
            );
          if (s <= 1.2 && s <= sp && s < sn)
            out.push({
              kind: "planet",
              id: `conj-${a}-${b}-${day}`,
              date: new Date(ms),
              title: `${a}与${b}近合`,
              detail: `地心黄经角距约 ${s.toFixed(1)}°（低精度提示）`,
            });
        }
      outer.forEach((n) => {
        const s = abSep(P[n].lon, P["太阳"].lon),
          err = Math.abs(180 - s),
          pp = Object.fromEntries(abPlanetsAt(ms - AB_DAY).map((x) => [x.n, x])),
          nn = Object.fromEntries(abPlanetsAt(ms + AB_DAY).map((x) => [x.n, x])),
          ep = Math.abs(180 - abSep(pp[n].lon, pp["太阳"].lon)),
          en = Math.abs(180 - abSep(nn[n].lon, nn["太阳"].lon));
        if (err <= 1.2 && err <= ep && err < en)
          out.push({
            kind: "planet",
            id: `opp-${n}-${day}`,
            date: new Date(ms),
            title: `${n}冲日附近`,
            detail: `与太阳黄经差约 ${(180 - err).toFixed(1)}°（低精度提示）`,
          });
      });
    }
    return out;
  }
  function abMeteorLocal(sh, date) {
    try {
      const l = loc119();
      let best = null;
      for (let h = -8; h <= 8; h += 1) {
        const d = new Date(date.getTime() + h * 3600000),
          jd = smJD(d),
          su = smSun(jd),
          sa = smAltAz(su.eq.ra, su.eq.dec, jd, l.lon, l.lat).alt,
          rr = smAltAz(sh.ra / 15, sh.dec, jd, l.lon, l.lat);
        if (sa < -9 && (!best || rr.alt > best.alt)) best = { alt: rr.alt, az: rr.az, d: d };
      }
      return best;
    } catch (_) {
      return null;
    }
  }
  function astroBellCandidates(nowMs) {
    if (typeof BELL === "undefined" || !BELL.astro) return [];
    const leads = (BELL.astroLead || []).map(Number),
      maxLead = Math.max(0, ...leads),
      day0 = abBjDay(nowMs),
      ev = [];
    if (BELL.astroEclipse && typeof ECL_EVENTS !== "undefined")
      ECL_EVENTS.forEach((e) => {
        const d = new Date(e.iso),
          lead = abBjDay(d.getTime()) - day0;
        if (leads.includes(lead) && d.getTime() > nowMs - 6 * 3600000)
          ev.push({
            kind: "eclipse",
            id: e.id,
            date: d,
            lead,
            title: e.type,
            detail: `最大食北京时间 ${abFmtBJ(d)}；主要可见区：${e.region}`,
          });
      });
    if (BELL.astroMeteor && typeof SHOWERS !== "undefined") {
      const bj = new Date(nowMs + 8 * 3600000),
        y = bj.getUTCFullYear();
      [y, y + 1].forEach((yr) =>
        SHOWERS.forEach((sh) => {
          const d = showerPeak(sh, yr),
            lead = abBjDay(d.getTime()) - day0;
          if (leads.includes(lead)) {
            const b = abMeteorLocal(sh, d),
              local = b
                ? `；本地较佳时段辐射点约在${v123Dir(b.az)}方，高度 ${b.alt.toFixed(0)}°`
                : "";
            ev.push({
              kind: "meteor",
              id: `${sh.id}-${yr}`,
              date: d,
              lead,
              title: `${sh.n}峰值`,
              detail: `峰值 ZHR≈${sh.zhr}，速度 ${sh.v} km/s${local}`,
            });
          }
        }),
      );
    }
    if (BELL.astroPlanet)
      abPlanetEvents(nowMs, maxLead).forEach((x) => {
        const lead = abBjDay(x.date.getTime()) - day0;
        if (leads.includes(lead)) {
          x.lead = lead;
          ev.push(x);
        }
      });
    return ev.sort((a, b) => a.date - b.date);
  }
  function abLeadText(n) {
    return n === 0 ? "今天" : n === 1 ? "明天" : `${n}天后`;
  }
  function abEventText(e) {
    return `${abLeadText(e.lead)}，${e.title}。${e.detail}`;
  }
  function astroBellCheck(announce) {
    const ev = astroBellCandidates(Date.now());
    if (!announce) return ev;
    const fresh = ev.filter((e) => {
      const key = e.kind + "|" + e.id + "|" + e.lead;
      if (BELL.astroSeen[key]) return false;
      BELL.astroSeen[key] = Date.now();
      return true;
    });
    const cut = Date.now() - 400 * AB_DAY;
    Object.keys(BELL.astroSeen).forEach((k) => {
      if (BELL.astroSeen[k] < cut) delete BELL.astroSeen[k];
    });
    if (fresh.length) {
      bellSave();
      fresh.forEach((e, i) => {
        const t = abEventText(e);
        setTimeout(() => toast("特殊天象 · " + t), i * 1600);
        nwNotify("特殊天象提醒", t);
        if (!bellInQuiet(BELL, nowBJ().h * 60 + nowBJ().mi)) {
          setTimeout(() => bellPlay({ n: 2, t: "qing" }, BELL), i * 2100);
          setTimeout(() => bellSpeak(t, { cancel: false }), i * 2100 + 400);
        }
      });
    }
    return fresh;
  }
  const AB_OLD_TICK = bellTick;
  bellTick = function (sc, tl, n, N) {
    AB_OLD_TICK(sc, tl, n, N);
    try {
      if (!BELL.on || !BELL.astro) return;
      const key = `${n.y}-${n.m}-${n.d}`,
        a = (BELL.astroTime || "08:00").split(":").map(Number),
        tm = (a[0] || 0) * 60 + (a[1] || 0);
      if (n.h * 60 + n.mi < tm || ASTRO_BELL_DAY === key) return;
      ASTRO_BELL_DAY = key;
      astroBellCheck(true);
    } catch (e) {
      try {
        console.warn("[astro bell]", e);
      } catch (_) {}
    }
  };
  try {
    window.bellTick = bellTick;
  } catch (_) {}
  const AB_OLD_RENDER = bellRender;
  bellRender = function () {
    AB_OLD_RENDER();
    const card = document.querySelector("#bellDlg .bell-card");
    if (!card || card.querySelector("#bAstroBox")) return;
    const anchor = card.querySelector("h4.gl");
    const box = document.createElement("div");
    box.id = "bAstroBox";
    box.className = "astro-bell-box";
    box.innerHTML = `<h4>特殊天象 / 天文现象报时</h4><div class="astro-bell-grid"><label class="chk"><input type="checkbox" id="bAstro"${BELL.astro ? " checked" : ""}> 开启特殊天象播报</label><label>每日检查时间 <input type="time" id="bAstroTime" value="${BELL.astroTime || "08:00"}"></label><label class="chk"><input type="checkbox" id="bAstroEcl"${BELL.astroEclipse ? " checked" : ""}> 日食 / 月食</label><label class="chk"><input type="checkbox" id="bAstroMet"${BELL.astroMeteor ? " checked" : ""}> 主要流星雨峰值</label><label class="chk"><input type="checkbox" id="bAstroPla"${BELL.astroPlanet ? " checked" : ""}> 行星近合 / 冲日提示</label><button class="gbtn sm" id="bAstroNow">立即检查</button></div><div class="astro-bell-leads"><small>提前：</small>${[7, 2, 1, 0].map((d) => `<label class="chk"><input type="checkbox" data-astro-lead="${d}"${(BELL.astroLead || []).includes(d) ? " checked" : ""}> ${d === 0 ? "当天" : d + "天"}</label>`).join("")}</div><div class="astro-bell-preview" id="bAstroPreview">日月食与流星雨来自站内事件表；行星近合/冲日由站内低精度天文引擎做日级搜索，只作提前提示，具体观测条件请回“天象/星空”页核对。这里的“特殊天象”不是物理学意义上的异常。</div>`;
    if (anchor) anchor.before(box);
    else card.appendChild(box);
    const bind = (id, key) => {
      const e = document.getElementById(id);
      if (e)
        e.onchange = () => {
          BELL[key] = e.checked;
          ASTRO_BELL_DAY = "";
          bellSave();
        };
    };
    bind("bAstro", "astro");
    bind("bAstroEcl", "astroEclipse");
    bind("bAstroMet", "astroMeteor");
    bind("bAstroPla", "astroPlanet");
    const ti = document.getElementById("bAstroTime");
    if (ti)
      ti.onchange = () => {
        BELL.astroTime = ti.value || "08:00";
        ASTRO_BELL_DAY = "";
        bellSave();
      };
    document.querySelectorAll("[data-astro-lead]").forEach(
      (e) =>
        (e.onchange = () => {
          BELL.astroLead = [...document.querySelectorAll("[data-astro-lead]:checked")]
            .map((x) => +x.dataset.astroLead)
            .sort((a, b) => b - a);
          ASTRO_BELL_DAY = "";
          bellSave();
        }),
    );
    const now = document.getElementById("bAstroNow");
    if (now)
      now.onclick = () => {
        const a = astroBellCandidates(Date.now()),
          p = document.getElementById("bAstroPreview");
        p.innerHTML = a.length
          ? a
              .slice(0, 6)
              .map((x) => `<div><b>${abLeadText(x.lead)} · ${x.title}</b> — ${x.detail}</div>`)
              .join("")
          : "按当前提前天数，没有命中特殊天象。";
      };
  };
  try {
    window.bellRender = bellRender;
  } catch (_) {}

  /* ========================= 全天球 3D · 地平圈 / 观测者视角 ========================= */
  function xk3EqHor(raD, decD, lstD, latD) {
    const H = (lstD - raD) * SM_D2R,
      d = decD * SM_D2R,
      p = latD * SM_D2R,
      cd = Math.cos(d),
      sd = Math.sin(d),
      sp = Math.sin(p),
      cp = Math.cos(p);
    return {
      x: -cd * Math.sin(H),
      y: cp * sd - sp * cd * Math.cos(H),
      z: sp * sd + cp * cd * Math.cos(H),
    };
  }
  const XKP_OLD = xk3Point;
  xk3Point = function (p, R, C) {
    const q = xk3Rot(p);
    return { x: C + q.x * R * XK3D.zoom, y: C - q.z * R * XK3D.zoom, d: q.y, h: p.z };
  };
  function xk3Reset() {
    XK3D.yaw = Math.PI;
    XK3D.pitch = -0.55;
    XK3D.zoom = 1;
    XK3D.auto = false;
    const a = document.getElementById("xk3Auto");
    if (a) a.checked = false;
    xkSky3dDraw();
  }
  try {
    window.xk3Reset = xk3Reset;
  } catch (_) {}
  XK3D.yaw = Math.PI;
  XK3D.pitch = -0.55;
  XK3D.auto = false;
  xk3ConstProjected = function (pt, jd, R, C) {
    const eq = xkPrecess(pt[0] / 15, pt[1], jd),
      F = XK3D._frame;
    return xk3Point(xk3EqHor(eq.ra, eq.dec, F.lst, F.lat), R, C);
  };
  xk3DrawConstellations = function (ctx, jd, R, C, O) {
    if (!O.show.constell && !O.show.constName) return;
    for (let ci = 0; ci < XK3_CONST.length; ci++) {
      const co = XK3_CONST[ci],
        pp = co.p.map((p) => xk3ConstProjected(p, jd, R, C));
      if (O.show.constell) {
        ctx.save();
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.lineWidth = co.z ? 1.25 : 1.05;
        ctx.strokeStyle = co.z ? "rgba(224,184,100,.72)" : "rgba(150,178,225,.58)";
        for (let li = 0; li < co.l.length; li++) {
          const path = co.l[li];
          for (let k = 1; k < path.length; k++) {
            const a = pp[path[k - 1]],
              b = pp[path[k]],
              front = Math.max(0, Math.min(1, (a.d + b.d + 2) / 4)),
              above = (a.h + b.h) / 2 >= 0;
            ctx.globalAlpha = (above ? 1 : 0.12) * (0.18 + 0.82 * front);
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
        ctx.restore();
      }
      if (O.show.constName) {
        let sx = 0,
          sy = 0,
          sd = 0,
          sh = 0;
        pp.forEach((p) => {
          sx += p.x;
          sy += p.y;
          sd += p.d;
          sh += p.h;
        });
        sx /= pp.length;
        sy /= pp.length;
        sd /= pp.length;
        sh /= pp.length;
        if (sd > -0.15) {
          ctx.save();
          ctx.textAlign = "center";
          ctx.font = (co.z ? "600 " : "") + "12px sans-serif";
          ctx.fillStyle = co.z ? "rgba(242,207,125,.92)" : "rgba(205,220,245,.82)";
          ctx.globalAlpha = (sh >= 0 ? 1 : 0.15) * (0.45 + 0.55 * Math.max(0, sd));
          ctx.fillText(co.n, sx, sy - 8);
          ctx.restore();
        }
      }
    }
  };
  function xkSky3dDraw() {
    const cv = document.getElementById("xkSky3d");
    if (!cv || cv.hidden) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const W = cv.width,
      H = cv.height,
      C = W / 2,
      R = Math.min(W, H) * 0.39;
    ctx.clearRect(0, 0, W, H);
    let bg = ctx.createRadialGradient(C, C, R * 0.1, C, C, R * 1.25);
    bg.addColorStop(0, "#111a34");
    bg.addColorStop(1, "#050812");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);
    const jd = nwNowJD(),
      loc = nwLoc(),
      lon = +loc.lon,
      lat = +loc.lat,
      eps = 23.4393,
      gm = smGMST(jd),
      lst = smN360((gm + lon / 15) * 15),
      O = XK3D;
    O._frame = { lst: lst, lat: lat };
    ctx.save();
    ctx.strokeStyle = "rgba(190,200,230,.16)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(C, C, R * O.zoom, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
    const EQ = (ra, dec) => xk3EqHor(ra, dec, lst, lat);
    if (O.show.grid) {
      [-60, -30, 0, 30, 60].forEach((dec) =>
        xk3Great(
          ctx,
          (a) => EQ(a, dec),
          R,
          C,
          dec === 0 ? "rgba(95,169,234,.55)" : "rgba(180,195,225,.13)",
          dec === 0 ? 1.4 : 0.8,
          null,
          1,
        ),
      );
      for (let ra = 0; ra < 360; ra += 30)
        xk3Great(ctx, (t) => EQ(ra, t - 180), R, C, "rgba(180,195,225,.10)", 0.8, null, 1);
    }
    if (O.show.ecl)
      xk3Great(
        ctx,
        (a) => {
          const e = smEqFromEcl(a, 0, eps);
          return EQ(e.ra * 15, e.dec);
        },
        R,
        C,
        "#d2aa55",
        2,
        null,
        0.88,
      );
    /* 地平圈是视觉主基准：本地 ENU 的 z=0 大圆 */
    if (O.show.hor) {
      xk3Great(
        ctx,
        (a) => {
          const t = a * SM_D2R;
          return { x: Math.sin(t), y: Math.cos(t), z: 0 };
        },
        R,
        C,
        "#72c6a9",
        2.8,
        null,
        1,
      );
      [
        ["北", 0],
        ["东", 90],
        ["南", 180],
        ["西", 270],
      ].forEach(([n, a]) => {
        const t = a * SM_D2R,
          p = xk3Point({ x: Math.sin(t), y: Math.cos(t), z: 0 }, R, C);
        ctx.save();
        ctx.font = "600 14px sans-serif";
        ctx.textAlign = "center";
        ctx.fillStyle = "#83d7ba";
        ctx.globalAlpha = p.d < -0.1 ? 0.45 : 1;
        ctx.fillText(n, p.x, p.y - 7);
        ctx.restore();
      });
    }
    if (O.show.mer)
      xk3Great(
        ctx,
        (a) => {
          const t = a * SM_D2R;
          return { x: 0, y: Math.cos(t), z: Math.sin(t) };
        },
        R,
        C,
        "rgba(208,80,59,.66)",
        1.2,
        [4, 4],
        1,
      );
    xk3DrawConstellations(ctx, jd, R, C, O);
    const list = [];
    for (let i = 0; i < XK_STARS.length; i++) {
      const st = XK_STARS[i],
        eq = xkPrecess(st[1], st[2], jd),
        v = EQ(eq.ra, eq.dec),
        p = xk3Point(v, R, C);
      list.push({ s: st, p: p, v: v });
    }
    list.sort((a, b) => a.p.d - b.p.d);
    const labs = [];
    for (let j = 0; j < list.length; j++) {
      const it = list[j],
        st = it.s,
        p = it.p,
        above = it.v.z >= 0,
        front = (p.d + 1) / 2,
        mag = st[3],
        rr = Math.max(0.7, 3.6 - 0.72 * mag) * (0.72 + 0.28 * front);
      ctx.globalAlpha = (above ? 1 : 0.12) * (0.16 + 0.84 * front);
      ctx.fillStyle = xkStarColor(st[4]);
      ctx.beginPath();
      ctx.arc(p.x, p.y, rr, 0, Math.PI * 2);
      ctx.fill();
      if (O.show.lab && above && mag <= 1.25 && front > 0.42) {
        let ok = true;
        for (let z = 0; z < labs.length; z++)
          if (Math.hypot(labs[z][0] - p.x, labs[z][1] - p.y) < 46) {
            ok = false;
            break;
          }
        if (ok) {
          labs.push([p.x, p.y]);
          ctx.globalAlpha = 0.75 + 0.25 * front;
          ctx.font = "14px sans-serif";
          ctx.fillStyle = "#dfe6f4";
          ctx.fillText(st[0], p.x + rr + 4, p.y - 5);
        }
      }
    }
    ctx.globalAlpha = 1;
    function body(eq, col, label, rad) {
      const v = EQ(eq.ra * 15, eq.dec),
        p = xk3Point(v, R, C);
      ctx.save();
      ctx.globalAlpha = v.z >= 0 ? 1 : 0.18;
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.arc(p.x, p.y, rad, 0, Math.PI * 2);
      ctx.fill();
      ctx.font = "15px sans-serif";
      ctx.fillText(label, p.x + 10, p.y + 5);
      ctx.restore();
    }
    const su = smSun(jd),
      mo = smMoon(jd);
    body(su.eq, "#ffd36f", "太阳", 7);
    body(mo.eq, "#e6e8ef", "月亮", 5);
    /* 天顶与视线中心 */ const zen = xk3Point({ x: 0, y: 0, z: 1 }, R, C);
    ctx.save();
    ctx.fillStyle = "rgba(114,198,169,.8)";
    ctx.font = "11px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("天顶", zen.x, zen.y - 6);
    ctx.strokeStyle = "rgba(255,255,255,.25)";
    ctx.beginPath();
    ctx.moveTo(C - 6, C);
    ctx.lineTo(C + 6, C);
    ctx.moveTo(C, C - 6);
    ctx.lineTo(C, C + 6);
    ctx.stroke();
    ctx.restore();
    const cap = document.getElementById("xk3Cap"),
      az = (((O.yaw / SM_D2R) % 360) + 360) % 360,
      alt = -O.pitch / SM_D2R;
    if (cap)
      cap.innerHTML =
        "全天球3D · 地平基准 · " +
        orr3dFmt(jd) +
        " · 观测地 " +
        lon.toFixed(2) +
        "°E / " +
        lat.toFixed(2) +
        '°N · <span class="xk-horizon-note">绿色粗线=地平圈；地平以下星体自动淡化</span> · 当前视向 ' +
        v123Dir(az) +
        " / 仰角约 " +
        alt.toFixed(0) +
        "°";
  }
  try {
    window.xkSky3dDraw = xkSky3dDraw;
  } catch (_) {}

  /* 版本 */
  try {
    const bv = document.getElementById("buildVersion");

    window.TianjiSystemV123 = {
      version: "v123",
      build: V123_BUILD,
      liurenSpecialCore: true,
      liuren720Regression: true,
      liurenBiezePolicy: true,
      astroBell: true,
      horizonSky3D: true,
    };
  } catch (_) {}
})();
