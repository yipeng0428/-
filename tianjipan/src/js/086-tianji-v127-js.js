(() => {
  "use strict";
  const V127_BUILD = "v127 · 2026-10-04 20:45 +08:00";

  /* ==================== 1. 此刻星盘：放大按钮安全区 ==================== */
  function v127ZoomSafe() {
    const box = document.querySelector("#pane-now .wheelbox");
    if (!box) return false;
    box.dataset.v127ZoomSafe = "1";
    const b = box.querySelector(":scope > .zbtn");
    if (b) {
      b.dataset.v127Safe = "1";
      b.title = "放大查看此刻星盘";
      b.setAttribute("aria-label", "放大查看此刻星盘");
    }
    return !!b;
  }
  let z127T = 0;
  function v127ZoomSoon() {
    if (z127T) return;
    z127T = setTimeout(() => {
      z127T = 0;
      try {
        v127ZoomSafe();
      } catch (_) {}
    }, 80);
  }
  try {
    new MutationObserver(v127ZoomSoon).observe(document.body, { childList: true, subtree: true });
  } catch (_) {}
  window.addEventListener("resize", v127ZoomSoon, { passive: true });
  setTimeout(v127ZoomSafe, 120);

  /* ==================== 2. 太阳系 / 日地月：统一时空时间轴 ==================== */
  function v127Pad(n) {
    return String(n).padStart(2, "0");
  }
  function v127JdToBj(jd) {
    try {
      const f = fromJD(jd + 8 / 24);
      return { y: f.y, m: f.m, d: f.d, h: f.h, mi: f.mi, s: f.s || 0 };
    } catch (_) {
      const d = new Date((jd - 2440587.5) * 86400000 + 8 * 3600000);
      return {
        y: d.getUTCFullYear(),
        m: d.getUTCMonth() + 1,
        d: d.getUTCDate(),
        h: d.getUTCHours(),
        mi: d.getUTCMinutes(),
        s: d.getUTCSeconds(),
      };
    }
  }
  function v127FmtInput(jd) {
    const f = v127JdToBj(jd);
    return `${f.y}-${v127Pad(f.m)}-${v127Pad(f.d)}T${v127Pad(f.h)}:${v127Pad(f.mi)}`;
  }
  function v127FmtDisplay(jd) {
    return v127FmtInput(jd).replace("T", " ");
  }
  /* 太阳系工作台统一以北京时间显示，避免浏览器系统时区不同导致同一 JD 显示成 UTC/其它时区。 */
  try {
    orr3dFmt = function (jd) {
      return v127FmtDisplay(jd);
    };
    window.orr3dFmt = orr3dFmt;
  } catch (_) {}
  function v127ParseInput(v) {
    const m = String(v || "").match(/^(\d{4})-(\d\d)-(\d\d)T(\d\d):(\d\d)/);
    if (!m) return null;
    return { y: +m[1], m: +m[2], d: +m[3], h: +m[4], mi: +m[5] };
  }
  function v127ToJD(c) {
    return jdFromGreg(c.y, c.m, c.d, c.h || 0, c.mi || 0, c.s || 0) - 8 / 24;
  }
  function v127BirthCiv() {
    try {
      if (typeof parseDt === "function") {
        const c = parseDt();
        if (c && c.y) return c;
      }
    } catch (_) {}
    try {
      if (typeof R !== "undefined" && R && R.t && R.t.civ) return R.t.civ;
    } catch (_) {}
    return null;
  }
  function v127BirthName() {
    try {
      return (document.getElementById("pname") || {}).value || "当前命主";
    } catch (_) {
      return "当前命主";
    }
  }
  function v127StopPlay() {
    if (typeof ORR3D === "undefined") return;
    ORR3D.playing = false;
    const p = document.getElementById("orr3dPlay");
    if (p) p.textContent = "▶ 播放";
  }
  function v127Invalidate() {
    try {
      ORR3D.orbitCache = { key: null, data: {} };
    } catch (_) {}
    try {
      if (typeof v113InvalidateSky === "function") {
        v113InvalidateSky(ORR3D);
        if (typeof SEM3D !== "undefined") v113InvalidateSky(SEM3D);
      }
    } catch (_) {}
  }
  function v127RenderAstro() {
    try {
      if (ORR3D.mode === "3d") orr3dDraw();
      else if (ORR3D.mode === "helio") orr3dHelioRender();
      else if (ORR3D.mode === "sem") {
        orr3dSyncSem();
        sem3dDraw();
      } else if (ORR3D.mode === "eclipse") {
        if (typeof eclDraw === "function") eclDraw();
      }
      if (typeof tradAstroRender === "function") tradAstroRender();
      orr3dInfo();
    } catch (e) {
      console.error("[v127 time render]", e);
    }
  }
  function v127SetJD(jd, source, label) {
    if (typeof ORR3D === "undefined" || !Number.isFinite(jd)) return false;
    const mn = jdFromGreg(1800, 1, 1, 0) - 8 / 24,
      mx = jdFromGreg(2050, 12, 31, 23, 59) - 8 / 24;
    if (jd < mn || jd > mx) {
      if (typeof toast === "function") toast("当前行星近似模型的校准范围为 1800–2050 年");
      return false;
    }
    ORR3D.jd = jd;
    ORR3D.timeSource127 = source || "custom";
    ORR3D.timeLabel127 = label || "";
    v127StopPlay();
    v127Invalidate();
    v127RenderAstro();
    v127SyncTimeUI();
    return true;
  }
  function v127SyncTimeUI() {
    if (typeof ORR3D === "undefined") return;
    const inp = document.getElementById("orr127Dt");
    if (inp && document.activeElement !== inp) {
      const v = v127FmtInput(ORR3D.jd);
      if (inp.value !== v) inp.value = v;
    }
    const st = document.getElementById("orr127State");
    if (st) {
      let src = ORR3D.timeSource127 || "current",
        name = ORR3D.timeLabel127 || "";
      if (ORR3D.playing) src = "play";
      const txt =
        src === "birth"
          ? "命主出生时刻"
          : src === "custom"
            ? "自定义时刻"
            : src === "play"
              ? "连续演示"
              : "当前时刻";
      st.innerHTML =
        "<span>当前时间源</span><b>" +
        txt +
        (name ? " · " + String(name).replace(/[<>]/g, "") : "") +
        "</b>";
    }
  }
  function v127TimeDelta(days) {
    if (typeof ORR3D === "undefined") return;
    v127SetJD(ORR3D.jd + days, "custom", "");
  }
  function v127DecorAstro() {
    const root = document.getElementById("as-orr3d");
    if (!root || typeof ORR3D === "undefined") return false;
    if (!document.getElementById("orr127TimeBar")) {
      const bar = document.createElement("div");
      bar.id = "orr127TimeBar";
      bar.className = "v127-astro-timebar";
      bar.innerHTML = `<label>模拟日期时间 · 北京时间<input type="datetime-local" id="orr127Dt" min="1800-01-01T00:00" max="2050-12-31T23:59" step="60"></label><label>步进<select id="orr127Step"><option value="0.0416666667">1 小时</option><option value="1" selected>1 天</option><option value="30">30 天</option><option value="365.25">1 年</option></select></label><div class="v127-time-nav"><button type="button" class="gbtn sm" id="orr127Prev">← 上一步</button><button type="button" class="gbtn sm" id="orr127Next">下一步 →</button><button type="button" class="gbtn sm v127-birth" id="orr127Birth">载入命主出生时刻</button></div><div class="v127-state" id="orr127State"></div><div class="v127-range">时间选择会同步作用于“太阳系 3D / 日心俯视 / 日·地·月 3D”。行星位置采用本站现有 JPL 近似根数模型，校准使用范围为 1800–2050；出生时刻按页面当前命主的北京时间载入。</div>`;
      const mode = root.querySelector(".orr-modebar");
      if (mode) mode.insertAdjacentElement("afterend", bar);
      else root.insertBefore(bar, root.firstChild);
    }
    const dt = document.getElementById("orr127Dt"),
      step = document.getElementById("orr127Step"),
      prev = document.getElementById("orr127Prev"),
      next = document.getElementById("orr127Next"),
      birth = document.getElementById("orr127Birth");
    if (dt && !dt.dataset.v127) {
      dt.dataset.v127 = "1";
      dt.onchange = () => {
        const c = v127ParseInput(dt.value);
        if (c) v127SetJD(v127ToJD(c), "custom", "");
      };
    }
    if (prev && !prev.dataset.v127) {
      prev.dataset.v127 = "1";
      prev.onclick = () => v127TimeDelta(-parseFloat((step || {}).value || 1));
    }
    if (next && !next.dataset.v127) {
      next.dataset.v127 = "1";
      next.onclick = () => v127TimeDelta(parseFloat((step || {}).value || 1));
    }
    if (birth && !birth.dataset.v127) {
      birth.dataset.v127 = "1";
      birth.onclick = () => {
        const c = v127BirthCiv();
        if (!c) {
          if (typeof toast === "function") toast("请先在人物档案填写出生日期时间");
          return;
        }
        if (v127SetJD(v127ToJD(c), "birth", v127BirthName()) && typeof toast === "function")
          toast("已载入 " + v127BirthName() + " 的出生时刻");
      };
    }
    const now = document.getElementById("orr3dNow");
    if (now && !now.dataset.v127) {
      now.dataset.v127 = "1";
      now.addEventListener("click", () => {
        ORR3D.timeSource127 = "current";
        ORR3D.timeLabel127 = "";
        setTimeout(v127SyncTimeUI, 0);
      });
    }
    const play = document.getElementById("orr3dPlay");
    if (play && !play.dataset.v127) {
      play.dataset.v127 = "1";
      play.addEventListener("click", () => {
        if (ORR3D.playing) {
          ORR3D.timeSource127 = "play";
          ORR3D.timeLabel127 = "";
        }
        setTimeout(v127SyncTimeUI, 0);
      });
    }
    if (!ORR3D.timeSource127) {
      ORR3D.timeSource127 = "current";
      ORR3D.timeLabel127 = "";
    }
    v127SyncTimeUI();
    return true;
  }
  /* 让连续播放时的日期输入也跟着走；保留前面所有信息面板扩展。 */
  try {
    const oldInfo127 = orr3dInfo;
    orr3dInfo = function () {
      const r = oldInfo127.apply(this, arguments);
      try {
        const el = document.getElementById("orr3dInfo");
        if (el && ORR3D && ORR3D.mode === "sem")
          el.innerHTML = el.innerHTML.replace(
            /共享时刻\s*<b>[^<]*<\/b>/,
            "共享时刻 <b>" + v127FmtDisplay(ORR3D.jd) + "（北京时间）</b>",
          );
        v127SyncTimeUI();
      } catch (_) {}
      return r;
    };
    window.orr3dInfo = orr3dInfo;
  } catch (e) {
    console.error("[v127 info wrap]", e);
  }
  let a127T = 0;
  function v127AstroSoon() {
    if (a127T) return;
    a127T = setTimeout(() => {
      a127T = 0;
      try {
        v127DecorAstro();
      } catch (e) {
        console.error("[v127 astro decor]", e);
      }
    }, 70);
  }
  try {
    new MutationObserver(v127AstroSoon).observe(document.body, { childList: true, subtree: true });
  } catch (_) {}
  /* 天象页若因懒渲染/页面重建再次绑定 3D，保留用户已经选择的历史/未来/命主出生时刻。 */
  try {
    const oldBind127 = bindOrr3d;
    bindOrr3d = function () {
      const keep =
        typeof ORR3D !== "undefined" &&
        ORR3D.jd &&
        ORR3D.timeSource127 &&
        ORR3D.timeSource127 !== "current"
          ? {
              jd: ORR3D.jd,
              playing: !!ORR3D.playing,
              src: ORR3D.timeSource127,
              label: ORR3D.timeLabel127 || "",
            }
          : null;
      const out = oldBind127.apply(this, arguments);
      if (keep && typeof ORR3D !== "undefined") {
        ORR3D.jd = keep.jd;
        ORR3D.playing = keep.playing;
        ORR3D.timeSource127 = keep.src;
        ORR3D.timeLabel127 = keep.label;
        setTimeout(() => {
          try {
            v127DecorAstro();
            v127RenderAstro();
          } catch (e) {
            console.error("[v127 restore time]", e);
          }
        }, 0);
      } else
        setTimeout(() => {
          try {
            v127DecorAstro();
          } catch (_) {}
        }, 0);
      return out;
    };
    window.bindOrr3d = bindOrr3d;
  } catch (e) {
    console.error("[v127 bind preserve]", e);
  }
  /* refRender() 会在每次重新进入“天象”时重建整个面板；在绑定链最外层保存时间源，避免旧 bindOrr3d 的“回到此刻”初始化覆盖历史/出生时刻。 */
  try {
    const oldAstBind127 = REF_BIND && REF_BIND.astro;
    if (oldAstBind127)
      REF_BIND.astro = function () {
        const keep =
          typeof ORR3D !== "undefined" &&
          Number.isFinite(ORR3D.jd) &&
          ORR3D.timeSource127 &&
          ORR3D.timeSource127 !== "current"
            ? {
                jd: ORR3D.jd,
                playing: !!ORR3D.playing,
                src: ORR3D.timeSource127,
                label: ORR3D.timeLabel127 || "",
                mode: ORR3D.mode,
              }
            : null;
        const out = oldAstBind127.apply(this, arguments);
        if (keep && typeof ORR3D !== "undefined") {
          ORR3D.jd = keep.jd;
          ORR3D.playing = keep.playing;
          ORR3D.timeSource127 = keep.src;
          ORR3D.timeLabel127 = keep.label;
          if (keep.mode) ORR3D.mode = keep.mode;
          v127Invalidate();
          setTimeout(() => {
            try {
              v127DecorAstro();
              v127RenderAstro();
              v127SyncTimeUI();
            } catch (e) {
              console.error("[v127 astro outer restore]", e);
            }
          }, 0);
        } else
          setTimeout(() => {
            try {
              v127DecorAstro();
              v127SyncTimeUI();
            } catch (_) {}
          }, 0);
        return out;
      };
  } catch (e) {
    console.error("[v127 astro REF_BIND preserve]", e);
  }
  setTimeout(v127DecorAstro, 160);

  /* ==================== 3. 大六壬 Evidence 4.0：特殊课体古籍代表例 ==================== */
  function lr127DayIdx(g, z) {
    for (let i = 0; i < 60; i++) if (GAN[i % 10] === g && ZHI[i % 12] === z) return i;
    return -1;
  }
  const LR127_CASES = [
    {
      group: "别责",
      name: "刚日别责",
      g: "丙",
      z: "辰",
      zj: "午",
      hb: "巳",
      want: "亥午午",
      note: "丙辰日 · 午将巳时",
    },
    {
      group: "别责",
      name: "柔日别责",
      g: "辛",
      z: "酉",
      zj: "亥",
      hb: "子",
      want: "丑酉酉",
      note: "辛酉日 · 亥将子时",
    },
    {
      group: "八专",
      name: "刚日八专",
      g: "甲",
      z: "寅",
      zj: "子",
      hb: "卯",
      want: "丑亥亥",
      note: "甲寅日 · 子将卯时",
    },
    {
      group: "八专",
      name: "柔日八专",
      g: "丁",
      z: "未",
      zj: "丑",
      hb: "戌",
      want: "亥戌戌",
      note: "丁未日 · 丑将戌时",
    },
    {
      group: "八专",
      name: "独足",
      g: "己",
      z: "未",
      zj: "午",
      hb: "辰",
      want: "酉酉酉",
      note: "己未日 · 午将辰时",
    },
    {
      group: "返吟",
      name: "有克 · 无依",
      g: "庚",
      z: "戌",
      zj: "亥",
      hb: "巳",
      want: "寅申寅",
      note: "庚戌日 · 亥将巳时",
    },
    {
      group: "返吟",
      name: "无克 · 无亲",
      g: "辛",
      z: "丑",
      zj: "申",
      hb: "寅",
      want: "亥未辰",
      note: "辛丑日 · 申将寅时",
    },
    {
      group: "伏吟",
      name: "不虞",
      g: "癸",
      z: "丑",
      zj: "子",
      hb: "子",
      want: "丑戌未",
      note: "癸丑日 · 子将子时",
    },
    {
      group: "伏吟",
      name: "自任",
      g: "丙",
      z: "辰",
      zj: "寅",
      hb: "寅",
      want: "巳申寅",
      note: "丙辰日 · 寅将寅时",
    },
    {
      group: "伏吟",
      name: "自信",
      g: "丁",
      z: "丑",
      zj: "申",
      hb: "申",
      want: "丑戌未",
      note: "丁丑日 · 申将申时",
    },
    {
      group: "伏吟",
      name: "杜传",
      g: "壬",
      z: "辰",
      zj: "亥",
      hb: "亥",
      want: "亥辰戌",
      note: "壬辰日 · 亥将亥时",
    },
  ];
  function lr127RunCases() {
    return LR127_CASES.map((c) => {
      let r = null,
        got = "—",
        ok = false,
        struct = false;
      try {
        const d = lr127DayIdx(c.g, c.z);
        r = liuren(d, ZHI.indexOf(c.hb), ZHI.indexOf(c.zj), {});
        got = r.chu.map((x) => ZHI[x.z]).join("");
        struct =
          c.group === "返吟" ? !!r.fanyin : c.group === "伏吟" ? !!r.fuyin : r.ge === c.group;
        ok = got === c.want && struct;
      } catch (e) {
        got = "错误";
      }
      return Object.assign({}, c, { got, ok, ge: r ? r.ge : "—", sub: r ? r.sub : "", struct });
    });
  }
  function lr127Evidence() {
    const rows = lr127RunCases(),
      pass = rows.filter((x) => x.ok).length,
      groups = {};
    rows.forEach((x) => {
      groups[x.group] = groups[x.group] || [0, 0];
      groups[x.group][1]++;
      if (x.ok) groups[x.group][0]++;
    });
    const kpis = ["别责", "八专", "返吟", "伏吟"]
      .map(
        (g) =>
          `<div class="lr127-kpi ${groups[g][0] === groups[g][1] ? "ok" : ""}"><small>${g}代表例</small><b>${groups[g][0]} / ${groups[g][1]}</b></div>`,
      )
      .join("");
    return `<div class="panel blk lr127-card"><div class="lr127-head"><div><h3>大六壬 Evidence 4.0 · 特殊课体代表古籍例课</h3><small>从“结构计数”推进到“具体日柱 + 月将 + 占时 + 三传”逐例核对；返吟有克仍按贼克立传，所以校验返吟结构标志与三传，不强求课名必须写“返吟”。</small></div><span class="lr127-score">代表例 ${pass} / ${rows.length} ${pass === rows.length ? "通过" : "待校"}</span></div><div class="lr127-summary">${kpis}</div><div class="lr127-cases">${rows.map((x) => `<div class="lr127-case"><b>${x.group} · ${x.name}</b><span class="${x.ok ? "ok" : "bad"}">${x.ok ? "✓ 匹配" : "△ 待校"}</span><br>${x.note}<br>程序三传：<code>${x.got}</code>　古籍参照：<code>${x.want}</code><br><span class="dim">程序课名：${String(x.ge).replace(/[<>]/g, "")}${x.sub ? " · " + String(x.sub).replace(/[<>]/g, "") : ""}</span></div>`).join("")}</div><p class="lr127-note"><b>证据来源：</b>《大六壬探原》推演篇明确给出：丙辰/辛酉别责，甲寅/丁未/己未八专（含独足），庚戌/辛丑返吟，以及癸丑不虞、丙辰自任、丁丑自信、壬辰杜传等代表式。本卡只校验排盘规则和三传，不把古代占断文本当作现代事实验证。 <a href="https://orasage.com/zh-CN/daozang/docs/zh-cn/5_5_3" target="_blank" rel="noopener">打开原文参照</a></p></div>`;
  }
  try {
    const oldRender127 = renderLiuren;
    renderLiuren = function (R0) {
      return oldRender127(R0) + lr127Evidence();
    };
    window.renderLiuren = renderLiuren;
  } catch (e) {
    console.error("[v127 六壬 Evidence 4]", e);
  }
  try {
    if (typeof VF !== "undefined") {
      const r = VF.find((x) => x[0] === "大六壬");
      if (r) {
        r[2] = "外部实现 + Core 自检 + Evidence 4.0";
        r[3] = "8638 外部课例 + 720 结构扫描 + 涉害代表例 + 特殊课体 11 个古籍代表例";
        r[4] =
          "新增别责2、八专3、返吟2、伏吟4个具体古籍例课的三传回归；继续保留涉害63/64文献内部冲突";
        r[5] = "当前代表例通过只证明对应起课规则可复现，不等于所有流派或全部占断已验证";
      }
    }
  } catch (_) {}

  /* ==================== 版本 ==================== */
  try {
    const bv = document.getElementById("buildVersion");

    window.TianjiSystemV127 = {
      version: "v127",
      build: V127_BUILD,
      zoomSafeRule: "controls-in-reserved-blank-space",
      astroTimeTravel: true,
      natalAstroSnapshot: true,
      liurenEvidence4: true,
    };
  } catch (_) {}
})();
