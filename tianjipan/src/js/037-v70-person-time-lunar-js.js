(() => {
  "use strict";
  const TS = "2026-10-04 00:51:36";

  /* 旧个人中心入口统一重定向到个人指南；算法函数保留供“此刻/指南”复用。 */
  try {
    const _selectTab70 = selectTab;
    if (!window.__selectTab70) {
      window.__selectTab70 = _selectTab70;
      selectTab = function (id, scroll) {
        return window.__selectTab70(id === "me" ? "guide" : id, scroll);
      };
    }
  } catch (_) {}

  function v70Name() {
    try {
      const p = PPL && PPL.cur ? pplById(PPL.cur) : null;
      if (p && p.name) return p.name;
    } catch (_) {}
    try {
      return (($("#pname") && $("#pname").value) || "").trim() || "当前人物";
    } catch (_) {
      return "当前人物";
    }
  }
  function v70PersonSig() {
    try {
      return (
        ((PPL && PPL.cur) || "form") +
        "|" +
        (R && R.bz ? R.bz.pill.map((p) => p.s + "," + p.b).join(";") : "-")
      );
    } catch (_) {
      return "none";
    }
  }
  function v70PersonOptions() {
    let a = [];
    try {
      a = PPL && Array.isArray(PPL.people) ? PPL.people : [];
    } catch (_) {}
    const cur = (() => {
      try {
        return PPL.cur || "";
      } catch (_) {
        return "";
      }
    })();
    const opts = a
      .map(
        (p) =>
          `<option value="${esc(p.id)}"${p.id === cur ? " selected" : ""}>${esc(p.name)}${p.tag ? " · " + esc(p.tag) : ""}</option>`,
      )
      .join("");
    if (!a.length) return '<option value="">尚未保存人物</option>';
    return opts;
  }
  function v70PersonBar(context) {
    const nm = v70Name(),
      has = typeof meHas === "function" && meHas();
    let meta = "";
    try {
      if (has && R && R.bz)
        meta = `${R.opt.gender === "M" ? "乾造" : "坤造"} · 日主 ${GAN[R.bz.dm]}${WXN[GAN_WX[R.bz.dm]]} · ${R.deep && R.deep.st ? R.deep.st.level : ""}`;
    } catch (_) {}
    return `<div class="v70-personbar"><div class="v70-who"><span class="v70-avatar">${esc((nm || "人").slice(0, 1))}</span><span><b>${esc(nm)}</b><small>${meta || "请选择人物档案后查看个性化信息"}</small></span></div><select data-v70-person aria-label="切换当前人物">${v70PersonOptions()}</select><div class="v70-actions"><button class="gbtn sm" data-v70-go="people">人物档案</button>${context === "now" ? '<button class="gbtn sm" data-v70-go="guide">完整个人指南</button>' : '<button class="gbtn sm" data-v70-go="now">回到此刻</button>'}</div></div>`;
  }

  function v70NowPerson(N) {
    const ok = typeof meHas === "function" && meHas();
    if (!ok)
      return `<div class="panel v70-empty"><h3>此刻与你</h3><p class="note">“此刻”展示客观天时；选中一个人物后，这里会进一步把今日干支、喜忌、十神、冲合、当前时辰与该人物命局合参。</p><div class="v70-actions" style="justify-content:center"><button class="gbtn" data-v70-go="people">选择人物</button><button class="gbtn" data-v70-focus-person>填写首页人物信息</button></div></div>`;
    try {
      const n = nowBJ(),
        P = meP(),
        S = meDayScore(P, n.y, n.m, n.d),
        hb = ((n.h + 1) >> 1) % 12,
        hrs = hoursOfDay(n.y, n.m, n.d),
        hr = hrs.find((x) => x.b === hb) || hrs[0];
      let hss = "—",
        rel = "与命局无明显冲合";
      try {
        const hi = ganzhiIdxOf(hr.gz);
        hss = shishen(P.bz.dm, hi % 10);
      } catch (_) {}
      try {
        const rr = pplZhiRel(P.bz.pill[2].b, hb).filter((r) =>
          ["冲", "六合", "半合", "刑", "自刑", "害", "破"].includes(r.t),
        );
        if (rr.length) rel = rr.map((r) => r.txt).join("、");
      } catch (_) {}
      const yi = (hr.yi || []).slice(0, 4).join("、") || "—",
        ji = (hr.ji || []).slice(0, 4).join("、") || "—";
      let today = "";
      try {
        today = meToday();
        today = today.replace('<h3 class="sec">今日 ·', '<h3 class="sec">今日与你 ·');
      } catch (e) {
        console.error("[v70 此刻与你]", e);
      }
      return `<div class="v70-now-person">${v70PersonBar("now")}<div class="v70-now-head"><div class="v70-now-stat"><small>今日倾向</small><b class="${meCls(S.label)}">${S.label} · ${S.p}</b><span>${S.ss}日 · ${S.di.gz}</span></div><div class="v70-now-stat"><small>当前时辰</small><b>${hr.gz || ZHI[hb] + "时"} · ${hss}</b><span>${hr.huang ? "黄道" : "黑道"} · ${hr.ts || ""}</span></div><div class="v70-now-stat"><small>时支与你</small><b>${esc(rel)}</b><span>以命主日支与当前时支合参</span></div><div class="v70-now-stat"><small>当前时辰宜 / 忌</small><b>${esc(yi)}</b><span>慎：${esc(ji)}</span></div></div>${today}</div>`;
    } catch (e) {
      console.error("[v70 人时合参]", e);
      return `<div class="panel v70-empty"><h3>此刻与你</h3><p class="note">人物合参暂未完成渲染；客观“此刻”信息仍可正常使用。</p></div>`;
    }
  }

  /* 此刻新增“此刻与你”。客观天时仍沿用原 NW 引擎。 */
  try {
    const _nwBuild70 = nwBuildShell;
    nwBuildShell = function () {
      _nwBuild70();
      const p = $("#pane-now");
      if (!p) return;
      if (!$("#nwc-person")) {
        const d = document.createElement("div");
        d.id = "nwc-person";
        const after = $("#nwc-rhythm");
        if (after) after.insertAdjacentElement("afterend", d);
        else p.prepend(d);
      }
    };
    if (Array.isArray(NW_CARDS) && !NW_CARDS.some((x) => x.id === "nwc-person")) {
      const at = Math.max(
        0,
        NW_CARDS.findIndex((x) => x.id === "nwc-term"),
      );
      NW_CARDS.splice(at, 0, {
        id: "nwc-person",
        key: (N) => N.dayKey + "|" + N.sc.b + "|" + v70PersonSig(),
        html: v70NowPerson,
      });
    }
  } catch (e) {
    console.error("[v70 此刻挂载]", e);
  }

  /* 个人指南接管旧个人中心的“命盘 / 运势 / 提醒 / 报告”；资料归人物关系册。 */
  try {
    const _renderGuide70 = renderGuide;
    renderGuide = function (R0) {
      const base = _renderGuide70(R0),
        ok = typeof meHas === "function" && meHas();
      if (!ok)
        return `${v70PersonBar("guide")}<div class="panel v70-empty v70-guide-intro"><h3>个人指南</h3><p class="note">请选择或建立人物档案。完成后这里会汇总人物速览、优势与短板、人生阶段、未来 7 日 / 本月 / 流年、大运交接、生日与节气提醒，以及报告导出。</p></div>${base}`;
      let chart = "",
        luck = "",
        remind = "",
        report = "";
      try {
        chart = meChart().replace("命盘速览", "人物速览");
      } catch (_) {}
      try {
        luck = meLuck().replace(">运势 <", ">近期节奏 <");
      } catch (_) {}
      try {
        remind = meRemind();
      } catch (_) {}
      try {
        report = meReport();
      } catch (_) {}
      const archive = `<div class="panel v70-archive"><div><b class="gold">人物档案与关系</b><div class="dim sm">姓名、出生资料、多人主库与关系图统一由“人物关系册”维护；个人指南只读取当前人物，不再保存第二份个人资料。</div></div><div class="v70-actions"><button class="gbtn sm" data-v70-go="people">编辑人物档案</button><button class="gbtn sm" data-v70-go="net">查看关系图</button></div></div>`;
      return `${v70PersonBar("guide")}${chart}${base}<div class="v70-guide-block"><div class="v70-kicker">Current rhythm</div>${luck}</div><div class="v70-guide-block"><div class="v70-kicker">Time nodes</div>${remind}</div>${archive}${report}`;
    };
  } catch (e) {
    console.error("[v70 指南整合]", e);
  }

  /* 导航语义同步。 */
  try {
    const tg = NAV_G.find((x) => x.g === "天时");
    if (tg) {
      const t = tg.it.find((x) => x[0] === "now");
      if (t) {
        t[2] = "实时时辰、日月节令、未来24小时、此刻与你";
        t[3] += " 此刻与你 当前人物 今日 十神 喜忌 吉时 人时合参";
      }
    }
    const mg = NAV_G.find((x) => x.g === "命局");
    if (mg) {
      const t = mg.it.find((x) => x[0] === "guide");
      if (t) {
        t[2] = "当前人物总览、人生阶段、近期节奏、时间节点与报告";
        t[3] += " 人物速览 近期节奏 七日 本月 流年 大运 提醒 生日 时间节点 报告";
      }
    }
  } catch (_) {}

  /* 统一交互：指南内原个人中心的跳转/报告按钮继续可用。 */
  document.addEventListener("click", (e) => {
    const go = e.target.closest && e.target.closest("[data-v70-go]");
    if (go) {
      selectTab(go.dataset.v70Go, true);
      return;
    }
    const old =
      e.target.closest && e.target.closest("#pane-guide [data-mego],#nwc-person [data-mego]");
    if (old) {
      selectTab(old.dataset.mego, true);
      return;
    }
    const foc = e.target.closest && e.target.closest("[data-v70-focus-person]");
    if (foc) {
      try {
        const p = $("#persona");
        if (p && p.classList.contains("is-collapsed")) $("#personaTassel").click();
        p.scrollIntoView({ behavior: REDUCE ? "auto" : "smooth", block: "start" });
        $("#pname").focus();
      } catch (_) {}
      return;
    }
    const cp = e.target.closest && e.target.closest("#pane-guide #meCopy");
    if (cp) {
      try {
        const t = meSummaryText(),
          pre = $("#pane-guide #mePre");
        if (pre) {
          pre.hidden = false;
          pre.textContent = t;
        }
        if (navigator.clipboard && navigator.clipboard.writeText)
          navigator.clipboard.writeText(t).then(
            () => toast("已复制命盘摘要"),
            () => toast("请手动复制下方文字"),
          );
      } catch (_) {}
      return;
    }
    const rp = e.target.closest && e.target.closest("#pane-guide #meRep");
    if (rp) {
      selectTab("over", true);
      setTimeout(() => {
        const b = $("#repBtn");
        if (b) b.click();
      }, 350);
      return;
    }
    const pd = e.target.closest && e.target.closest("#pane-guide #mePdf");
    if (pd) {
      selectTab("over", true);
      setTimeout(() => {
        const b = $$("#pane-over button").find((x) => /导出 PDF/.test(x.textContent));
        if (b) {
          b.scrollIntoView({ block: "center" });
          b.focus();
          toast("点这里导出 PDF");
        }
      }, 350);
      return;
    }
  });

  document.addEventListener("change", (e) => {
    const s = e.target.closest && e.target.closest("[data-v70-person]");
    if (!s || !s.value) return;
    try {
      pplOpen(s.value);
      setTimeout(async () => {
        try {
          await sleep(40);
          if (typeof meWaitIdle === "function") await meWaitIdle(15000);
        } catch (_) {}
        try {
          nwTick(true);
        } catch (_) {}
      }, 20);
    } catch (err) {
      console.error("[v70 切换人物]", err);
    }
  });

  /* 修复农历模式在加载旧档案时的跨行状态；无须等待用户再次切换。 */
  function v70SyncLunarMode() {
    try {
      const on = !!(PPL && PPL.calKind === "L"),
        F = $("#lunarIn") && $("#lunarIn").closest(".f-dt"),
        L = $("#v59PersonLine");
      if (F) F.classList.toggle("is-lunar", on);
      if (L) L.classList.toggle("v70-lunar-mode", on);
    } catch (_) {}
  }
  v70SyncLunarMode();
  setTimeout(v70SyncLunarMode, 120);
  setTimeout(v70SyncLunarMode, 600);

  /* 盘库性能兜底：清除旧 v66 自适应残留标记，不创建尺寸反馈观察器。 */
  try {
    const st = $("#stuStage");
    if (st) st.dataset.v66fit = "1";
  } catch (_) {}

  try {
    const bv = document.getElementById("buildVersion");
  } catch (_) {}
})();
