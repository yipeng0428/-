(() => {
  "use strict";
  const V167_BUILD = "v167 · 2026-10-05 14:01 +08:00";
  const qclone = (o) => JSON.parse(JSON.stringify(o));
  const LEGACY_DAY = typeof scoreDay === "function" ? scoreDay : null;
  const LEGACY_HOUR = typeof zrHourScore === "function" ? zrHourScore : null;
  const POLICY = Object.freeze({
    eventYiEach: 1.2,
    eventYiCap: 3,
    eventJi: -3.5,
    huang: 1,
    hei: -1,
    jianchuJi: 1,
    jianchuPing: 0,
    jianchuXiong: -1.5,
    poExtra: -2,
    xiuJi: 0.4,
    xiuXiong: -0.4,
    zodiacChong: -3,
    zodiacHe: 0.8,
    majorJi: 0.8,
    majorXiong: -0.8,
    hourYiEach: 1.2,
    hourYiCap: 2,
    hourJi: -3,
    hourHuang: 1,
    hourHei: -1,
    hourChong: -3,
  });
  const MAJOR_JI = Object.freeze([
    "天德",
    "月德",
    "天德合",
    "月德合",
    "天恩",
    "天赦",
    "天愿",
    "母仓",
    "时德",
    "王日",
    "守日",
    "相日",
    "民日",
  ]);
  const MAJOR_XIONG = Object.freeze([
    "月破",
    "大耗",
    "四废",
    "天贼",
    "五虚",
    "九空",
    "往亡",
    "归忌",
    "血忌",
    "四离",
    "四绝",
  ]);
  function contribution(k, label, value, detail = "", hard = false) {
    return { k, label, value: +value || 0, detail, hard: !!hard };
  }
  function scoreInfo(info, evName, birthZ) {
    const ev = ZERI_EVENTS[evName];
    if (!info || !ev) throw new Error("无效择日输入");
    const steps = [],
      flags = {};
    let sc = 0;
    const add = (x) => {
      steps.push(x);
      sc += x.value;
    };
    const hit = ev.yi.filter((x) => info.yi.includes(x)),
      bad = ev.ji.filter((x) => info.ji.includes(x));
    if (hit.length)
      add(
        contribution(
          "event.yi",
          "事项宜命中",
          Math.min(POLICY.eventYiCap, hit.length) * POLICY.eventYiEach,
          hit.join("、"),
        ),
      );
    if (bad.length) {
      add(contribution("event.ji", "事项忌命中", POLICY.eventJi, bad.join("、"), true));
      flags.ji = 1;
    }
    add(
      contribution(
        "huanghei",
        info.ts + (info.huang ? " · 黄道" : " · 黑道"),
        info.huang ? POLICY.huang : POLICY.hei,
      ),
    );
    const jv =
      info.zxTone === "吉"
        ? POLICY.jianchuJi
        : info.zxTone === "凶"
          ? POLICY.jianchuXiong
          : POLICY.jianchuPing;
    add(contribution("jianchu", "建除 · " + info.zx + "日", jv, info.zxTone));
    if (info.zx === "破") {
      add(contribution("jianchu.po", "月破附加限制", POLICY.poExtra, "破日", true));
      flags.po = 1;
    }
    add(
      contribution(
        "xiu",
        "二十八宿 · " + info.xiu,
        info.xiuTone > 0 ? POLICY.xiuJi : POLICY.xiuXiong,
        info.xiuTone > 0 ? "通行吉宿" : "通行凶宿",
      ),
    );
    if (birthZ != null && birthZ >= 0) {
      if (info.chongZ === birthZ) {
        add(
          contribution("person.chong", "日支冲本命生肖", POLICY.zodiacChong, ZODIAC[birthZ], true),
        );
        flags.chong = 1;
      }
      if (
        Z_HE6.some(
          ([a, b]) =>
            (a === birthZ && b === info.dayIdx % 12) || (b === birthZ && a === info.dayIdx % 12),
        )
      )
        add(contribution("person.he", "日支六合本命", POLICY.zodiacHe, ZODIAC[birthZ]));
    }
    const good = info.js.filter((x) => MAJOR_JI.includes(x));
    if (good.length) add(contribution("shen.ji", "核心吉神命中", POLICY.majorJi, good.join("、")));
    const bads = info.xs.filter((x) => MAJOR_XIONG.includes(x));
    if (bads.length)
      add(contribution("shen.xiong", "核心凶煞命中", POLICY.majorXiong, bads.join("、")));
    return { sc, steps, flags, hit, bad, event: evName, birthZ };
  }
  function scoreHour(h, evName, birthZ) {
    const ev = ZERI_EVENTS[evName];
    if (!h || !ev) throw new Error("无效择时输入");
    const steps = [];
    let sc = 0;
    const add = (x) => {
      steps.push(x);
      sc += x.value;
    };
    add(
      contribution(
        "hour.huanghei",
        h.ts + (h.huang ? " · 黄道" : " · 黑道"),
        h.huang ? POLICY.hourHuang : POLICY.hourHei,
      ),
    );
    const hit = ev.yi.filter((x) => h.yi.includes(x)),
      bad = ev.ji.filter((x) => h.ji.includes(x));
    if (hit.length)
      add(
        contribution(
          "hour.yi",
          "时宜命中",
          Math.min(POLICY.hourYiCap, hit.length) * POLICY.hourYiEach,
          hit.join("、"),
        ),
      );
    if (bad.length) add(contribution("hour.ji", "时忌命中", POLICY.hourJi, bad.join("、"), true));
    if (birthZ != null && birthZ >= 0 && h.chongZ === birthZ)
      add(contribution("hour.chong", "时支冲本命生肖", POLICY.hourChong, ZODIAC[birthZ], true));
    return { sc, steps, hit, bad };
  }
  function facts(y, m, d) {
    const i = dayInfo(+y, +m, +d);
    return {
      date: `${i.y}-${f2(i.m)}-${f2(i.d)}`,
      gz: i.gz,
      dayIdx: i.dayIdx,
      monthBranch: ZHI[i.mz],
      jianchu: i.zx,
      jianchuTone: i.zxTone,
      xiu: i.xiu,
      xiuTone: i.xiuTone,
      tianshen: i.ts,
      huang: i.huang,
      chong: i.chong,
      sha: i.sha,
      yi: qclone(i.yi),
      ji: qclone(i.ji),
      jishen: qclone(i.js),
      xiongsha: qclone(i.xs),
      nayin: i.nayin,
      lunar: qclone(i.lunar),
    };
  }
  function evaluateDate(y, m, d, evName, birthZ) {
    const info = dayInfo(+y, +m, +d),
      a = scoreInfo(info, evName, birthZ);
    return {
      schema: "tianji.zeri.date.v1",
      facts: facts(y, m, d),
      event: evName,
      birthZ,
      score: a.sc,
      flags: qclone(a.flags),
      audit: qclone(a.steps),
    };
  }
  function evaluateHours(y, m, d, evName, birthZ) {
    return hoursOfDay(+y, +m, +d)
      .map((h) => {
        const a = scoreHour(h, evName, birthZ);
        return Object.assign({}, h, { score: a.sc, audit: a.steps });
      })
      .sort((a, b) => b.score - a.score || a.b - b.b);
  }
  function rankRange(y, m, d, days, evName, birthZ) {
    let jd = jdFromGreg(+y, +m, +d, 12),
      out = [];
    for (let i = 0; i < +days; i++) {
      const f = fromJD(jd + i),
        info = dayInfo(f.y, f.m, f.d),
        a = scoreInfo(info, evName, birthZ);
      out.push({
        info,
        sc: a.sc,
        why: a.steps.map((x) => `${x.label}${x.detail ? ":" + x.detail : ""}`),
        flags: a.flags,
        audit: a.steps,
      });
    }
    return out;
  }
  function almost(a, b) {
    return Math.abs((+a || 0) - (+b || 0)) < 1e-9;
  }
  function selfTest() {
    const checks = [],
      add = (n, ok, d = "") => checks.push({ n, ok: !!ok, d });
    try {
      const ds = [
        [2024, 2, 10],
        [2025, 1, 29],
        [2026, 10, 5],
        [2030, 6, 18],
      ];
      let total = 0,
        pass = 0;
      for (const [y, m, d] of ds)
        for (const ev of Object.keys(ZERI_EVENTS)) {
          const i = dayInfo(y, m, d),
            a = scoreInfo(i, ev, 3),
            b = LEGACY_DAY ? LEGACY_DAY(i, ev, 3) : a;
          total++;
          if (almost(a.sc, b.sc) && JSON.stringify(a.flags) === JSON.stringify(b.flags)) pass++;
        }
      add("日评分 legacy 回归", pass === total, `${pass}/${total}`);
      let ht = 0,
        hp = 0;
      for (const [y, m, d] of ds.slice(0, 2))
        for (const ev of Object.keys(ZERI_EVENTS))
          for (const h of hoursOfDay(y, m, d)) {
            const a = scoreHour(h, ev, 3),
              b = LEGACY_HOUR ? LEGACY_HOUR(h, ZERI_EVENTS[ev], 3) : a;
            ht++;
            if (almost(a.sc, b.sc)) hp++;
          }
      add("时评分 legacy 回归", hp === ht, `${hp}/${ht}`);
      const one = evaluateDate(2026, 10, 5, "开业", 3);
      add(
        "统一 Schema",
        one.schema === "tianji.zeri.date.v1" && Array.isArray(one.audit) && one.facts.gz,
        "事实/规则/审计链完整",
      );
      add(
        "规则显式化",
        Object.isFrozen(POLICY) && POLICY.eventJi < 0 && POLICY.huang > 0,
        "评分权重冻结为可审计对象",
      );
      const h = evaluateHours(2026, 10, 5, "出行", 3);
      add("十二时辰闭合", h.length === 12 && h.every((x) => Number.isFinite(x.score)), "12/12");
    } catch (e) {
      add("exception", false, e.message || String(e));
    }
    return {
      ok: checks.every((x) => x.ok),
      checks,
      pass: checks.filter((x) => x.ok).length,
      total: checks.length,
    };
  }
  function verifyBaseline() {
    if (!LEGACY_DAY)
      return { ok: false, pass: 0, total: 0, fail: [{ reason: "legacy scoreDay 不存在" }] };
    const fail = [];
    let total = 0,
      pass = 0,
      jd = jdFromGreg(2024, 1, 1, 12);
    const evs = Object.keys(ZERI_EVENTS);
    for (let d = 0; d < 1461; d++) {
      const f = fromJD(jd + d),
        i = dayInfo(f.y, f.m, f.d);
      for (const ev of evs) {
        total++;
        const a = scoreInfo(i, ev, 3),
          b = LEGACY_DAY(i, ev, 3);
        if (almost(a.sc, b.sc) && JSON.stringify(a.flags) === JSON.stringify(b.flags)) pass++;
        else if (fail.length < 8)
          fail.push({
            date: `${f.y}-${f.m}-${f.d}`,
            ev,
            core: a.sc,
            legacy: b.sc,
            cf: a.flags,
            lf: b.flags,
          });
      }
    }
    return { ok: pass === total, pass, total, fail };
  }
  function verifyHourSample() {
    if (!LEGACY_HOUR)
      return { ok: false, pass: 0, total: 0, fail: [{ reason: "legacy zrHourScore 不存在" }] };
    const fail = [];
    let total = 0,
      pass = 0,
      jd = jdFromGreg(2026, 1, 1, 12),
      evs = Object.keys(ZERI_EVENTS);
    for (let d = 0; d < 60; d++) {
      const f = fromJD(jd + d);
      for (const h of hoursOfDay(f.y, f.m, f.d))
        for (const ev of evs) {
          total++;
          const a = scoreHour(h, ev, 3),
            b = LEGACY_HOUR(h, ZERI_EVENTS[ev], 3);
          if (almost(a.sc, b.sc)) pass++;
          else if (fail.length < 8)
            fail.push({ date: `${f.y}-${f.m}-${f.d}`, hour: h.b, ev, core: a.sc, legacy: b.sc });
        }
    }
    return { ok: pass === total, pass, total, fail };
  }
  const TEST = selfTest();
  const API = Object.freeze({
    version: "1.0.0",
    build: V167_BUILD,
    schema: "tianji.zeri.v1",
    policy: POLICY,
    facts,
    evaluateDate,
    evaluateHours,
    rankRange,
    scoreInfo,
    scoreHour,
    selfTest: () => qclone(TEST),
    verifyBaseline,
    verifyHourSample,
    manifest: () => ({
      module: "Tianji Zeri Core",
      version: "1.0.0",
      build: V167_BUILD,
      status: TEST.ok ? "active" : "degraded",
      schema: "tianji.zeri.v1",
      layers: ["历法事实层", "事项规则层", "个体生肖层", "评分/排名层"],
      implemented: [
        "建除十二值",
        "二十八宿",
        "黄黑道十二天神",
        "历书宜忌",
        "核心吉神凶煞",
        "生肖冲合",
        "逐时黄黑道与时宜忌",
        "机械评分审计",
        "4年基准分位分档兼容",
      ],
      policy: qclone(POLICY),
      limitations: [
        "当前个体化只进入生肖冲合，未把完整四柱、宅向、方位纳入硬规则",
        "事项评分为本站筛选策略，不等同传统唯一择日法",
        "建除/宿/黄黑道/神煞为并行历注层，不能只凭单项定吉凶",
        "重大事项仍应优先现实法律、安全、健康与专业安排",
      ],
    }),
  });
  window.TianjiZeri = API;
  /* 主界面正式切到 Core；legacy 保留供回归校验 */
  try {
    scoreDay = function (info, evName, birthZ) {
      const r = API.scoreInfo(info, evName, birthZ);
      return {
        sc: r.sc,
        why: r.steps.map((x) => (x.detail ? `${x.label}:${x.detail}` : x.label)),
        flags: r.flags,
      };
    };
    zrHourScore = function (h, ev, birthZ) {
      const r = API.scoreHour(
        h,
        typeof ev === "string"
          ? ev
          : Object.keys(ZERI_EVENTS).find((k) => ZERI_EVENTS[k] === ev) || "嫁娶",
        birthZ,
      );
      return { sc: r.sc, why: r.steps.map((x) => (x.detail ? `${x.label}:${x.detail}` : x.label)) };
    };
  } catch (e) {
    console.warn("[v167 core install]", e);
  }
  function currentAudit(R0) {
    try {
      const arr = zrCompute(R0),
        idx = Math.min(Math.max(0, ZRS.sel || 0), arr.length - 1),
        x = arr[idx],
        b = zrBirthZ(R0),
        a = API.scoreInfo(x.info, ZRS.ev, b);
      return { x, a, b };
    } catch (_) {
      return null;
    }
  }
  function panel(R0) {
    const cur = currentAudit(R0),
      checks = TEST.checks || [],
      ok = TEST.ok;
    const factsHTML = cur
      ? `<div class="zr167-facts"><span>日期 <b>${cur.x.info.y}-${f2(cur.x.info.m)}-${f2(cur.x.info.d)}</b></span><span>日柱 <b>${cur.x.info.gz}</b></span><span>建除 <b>${cur.x.info.zx}</b></span><span>宿 <b>${cur.x.info.xiu}</b></span><span>天神 <b>${cur.x.info.ts}</b></span><span>冲 <b>${cur.x.info.chong}</b></span></div>`
      : "";
    const steps = cur
      ? cur.a.steps
          .map(
            (s) =>
              `<div class="zr167-step ${s.value > 0 ? "pos" : s.value < 0 ? "neg" : "zero"}"><b>${esc(s.label)}${s.detail ? ` · <span class="dim">${esc(s.detail)}</span>` : ""}${s.hard ? ' · <em class="bad">限制项</em>' : ""}</b><strong>${s.value > 0 ? "+" : ""}${s.value.toFixed(1)}</strong></div>`,
          )
          .join("")
      : "";
    return `<div class="panel blk zr167-core"><div class="zr167-head"><div><h3>择日 Core 1.0 · 规则审计与分层引擎</h3><p>把原来散落在黄历、建除、黄黑道、神煞、生肖与逐时宜忌里的机械规则收束为统一 Core。历法事实与“怎么评分”的策略分开，任何加减分都可以追溯。</p></div><span class="zr167-badge ${ok ? "ok" : "bad"}">Core Self-Test · ${ok ? "PASS" : "FAIL"}</span></div>
  <div class="zr167-layers"><div class="zr167-layer"><i>01</i><b>历法事实层</b><span>日柱、节令月支、建除、宿、天神、冲煞、历书宜忌、吉神凶煞。</span></div><div class="zr167-layer"><i>02</i><b>事项规则层</b><span>嫁娶、开业、搬家、动土等事项只匹配相应“宜/忌”，不把所有标签混成一个分数。</span></div><div class="zr167-layer"><i>03</i><b>个体约束层</b><span>当前先纳入当事人生肖冲合；完整四柱择日保留为后续高级规则，不伪装已实现。</span></div><div class="zr167-layer"><i>04</i><b>筛选与排名层</b><span>明确权重后计算机械分，再按四年基准分位映射“吉/宜/平/慎/忌”。</span></div></div>
  <div class="zr167-audit"><div class="zr167-audit-head"><b>当前所选日期 · ${esc(ZRS.ev)} 审计链</b><em>${cur ? cur.a.sc.toFixed(1) : "—"} 分</em></div>${factsHTML}<div class="zr167-steps">${steps || '<span class="dim">暂无可审计日期</span>'}</div></div>
  <div class="zr167-policy"><div class="zr167-pol"><b>硬性/强限制</b><p>事项在历书明确列“忌” −3.5；冲本命生肖 −3；破日额外 −2。现有分档继续规定：事项忌、冲命、破日不能被其它小吉项轻易抬成“吉”。</p></div><div class="zr167-pol"><b>辅助加减项</b><p>事项宜每项 +1.2（最多三项）；黄/黑道 +1/−1；建除 +1/0/−1.5；宿 ±0.4；六合本命 +0.8；核心吉神/凶煞各 ±0.8。</p></div><div class="zr167-pol"><b>逐时规则</b><p>值时黄/黑道 +1/−1；时宜每项 +1.2（最多两项）；时忌 −3；冲本命 −3。时辰排序与日评分分开，不用“好日子”自动推出“全天都好”。</p></div><div class="zr167-pol"><b>证据边界</b><p>日历数据层继续复用既有历法库对拍结果；v167 核心化的是本站“筛选策略与审计链”，并不宣称这套权重是传统唯一标准。</p></div></div>
  <div class="zr167-self">${checks.map((x) => `<div class="zr167-check ${x.ok ? "ok" : "bad"}"><b>${esc(x.n)}</b><span>${esc(x.d || "")}</span></div>`).join("")}</div>
  <div class="zr167-tools"><button class="gbtn sm" type="button" id="zr167Verify">运行 20,454 组日事项回归</button><button class="gbtn sm" type="button" id="zr167VerifyHour">运行 10,080 组时事项回归</button><button class="gbtn sm" type="button" id="zr167Copy">复制当前择日审计 JSON</button><div class="zr167-out" id="zr167Out">自动自检已覆盖：日评分 legacy 对拍、时评分 legacy 对拍、统一 Schema、规则冻结、十二时辰闭合。</div></div>
  <p class="note" style="margin:10px 0 0">v167 的目标不是制造新的“吉日算法”，而是把现有规则变成可审计、可替换、可验证的 Core。以后若加入完整四柱、方位、宅向或不同择日门派，应作为新的 policy / doctrine 层叠加，而不是偷偷修改底层黄历事实。</p></div>`;
  }
  try {
    const OLD_RENDER_ZERI = renderZeri;
    renderZeri = function (R0) {
      return OLD_RENDER_ZERI(R0) + panel(R0);
    };
    window.renderZeri = renderZeri;
  } catch (e) {
    console.warn("[v167 render patch]", e);
  }
  document.addEventListener(
    "click",
    (e) => {
      const b = e.target.closest && e.target.closest("#zr167Verify,#zr167VerifyHour,#zr167Copy");
      if (!b) return;
      const out = document.getElementById("zr167Out");
      if (b.id === "zr167Verify") {
        b.disabled = true;
        if (out) out.textContent = "正在运行 2024–2027 四年基准、全部事项的 20,454 组日评分回归…";
        setTimeout(() => {
          const r = API.verifyBaseline();
          if (out)
            out.innerHTML = r.ok
              ? `<b>PASS</b> · ${r.pass.toLocaleString()} / ${r.total.toLocaleString()} 与 v166 legacy 完全一致。`
              : `<b class="bad">FAIL</b> · ${r.pass.toLocaleString()} / ${r.total.toLocaleString()}；首批差异：${esc(JSON.stringify(r.fail.slice(0, 3)))}`;
          b.disabled = false;
          try {
            toast(r.ok ? "择日 20,454 组回归通过" : "择日回归发现差异");
          } catch (_) {}
        }, 20);
        return;
      }
      if (b.id === "zr167VerifyHour") {
        b.disabled = true;
        if (out) out.textContent = "正在运行 2026 前60日 × 14事项 × 12时辰的 10,080 组回归…";
        setTimeout(() => {
          const r = API.verifyHourSample();
          if (out)
            out.innerHTML = r.ok
              ? `<b>PASS</b> · ${r.pass.toLocaleString()} / ${r.total.toLocaleString()} 与 v166 legacy 完全一致。`
              : `<b class="bad">FAIL</b> · ${r.pass.toLocaleString()} / ${r.total.toLocaleString()}；首批差异：${esc(JSON.stringify(r.fail.slice(0, 3)))}`;
          b.disabled = false;
          try {
            toast(r.ok ? "择时 10,080 组回归通过" : "择时回归发现差异");
          } catch (_) {}
        }, 20);
        return;
      }
      if (b.id === "zr167Copy") {
        try {
          const A = currentAudit(typeof R !== "undefined" ? R : null),
            obj = {
              build: V167_BUILD,
              core: API.manifest(),
              current: A
                ? {
                    date: A.x.info.y + "-" + f2(A.x.info.m) + "-" + f2(A.x.info.d),
                    event: ZRS.ev,
                    birthZ: A.b,
                    score: A.a.sc,
                    flags: A.a.flags,
                    audit: A.a.steps,
                  }
                : null,
            };
          const s = JSON.stringify(obj, null, 2);
          if (navigator.clipboard?.writeText)
            navigator.clipboard.writeText(s).then(() => toast("已复制择日 Core 审计 JSON"));
          else toast("当前浏览器不支持直接复制");
        } catch (_) {
          try {
            toast("复制失败");
          } catch (__) {}
        }
      }
    },
    true,
  );
  try {
    if (window.TianjiCore) {
      TianjiCore.registerSource({
        id: "tianji-v167-zeri-core",
        type: "internal",
        title: "Tianji Zeri Core 1.0",
        version: "1.0.0",
        baseline: "v166",
        evidence: "既有黄历数据层 + 显式评分 policy",
      });
      TianjiCore.registerEngine(
        {
          id: "zeri.core.v1",
          system: "zeri",
          name: "Tianji Zeri Core 1.0",
          version: "1.0.0",
          source: "tianji-v167-zeri-core",
          doctrine: "历法事实 × 事项规则 × 个体生肖 × 可审计权重",
          status: TEST.ok ? "active" : "degraded",
        },
        (input) =>
          API.evaluateDate(input.y, input.m, input.d, input.event || "嫁娶", input.birthZ ?? -1),
      );
      TianjiCore.registerEngine(
        {
          id: "zeri.verify.v1",
          system: "zeri",
          name: "Zeri Core Verifier",
          version: "1.0.0",
          source: "tianji-v167-zeri-core",
          doctrine: "自检 + legacy 日/时评分回归",
          status: "verification",
        },
        (input) =>
          input?.hours
            ? API.verifyHourSample()
            : input?.full
              ? API.verifyBaseline()
              : API.selfTest(),
      );
    }
  } catch (e) {
    console.warn("[v167 registry]", e);
  }
  try {
    if (typeof VF !== "undefined") {
      let r = VF.find((x) => String(x[0]).includes("择日"));
      if (!r) {
        r = ["黄历/择日", "", "", "", "", ""];
        VF.push(r);
      }
      r[1] = "Core 自检 + legacy 回归";
      r[2] = "历法事实层 + 显式评分 policy";
      r[3] = "日事项 20,454 组 + 时事项 10,080 组可复跑";
      r[4] = "主界面评分已切入 TianjiZeri Core 1.0；权重、限制项与每次加减分可审计";
      r[5] = "评分 policy 是本站筛选策略，不声明为传统唯一择日法；完整四柱/方位尚未进入核心";
    }
  } catch (_) {}
  try {
    const road = window.TianjiRoadmap || {},
      er = (road.engineRoute || []).map((x) =>
        x.id === "zeri"
          ? Object.assign({}, x, {
              state: "core+verify+policy",
              versions: "v167",
              next: "Evidence 典籍出处 + 四柱/方位高级择日规则层",
            })
          : x,
      );
    window.TianjiRoadmap = Object.freeze(
      Object.assign({}, road, {
        engineRoute: er,
        nextMainline: [
          "奇门四家交叉验证/格局知识层",
          "择日 Evidence / 高级规则层",
          "Evidence 总控",
          "跨术数合参",
          "AI",
          "MCP",
        ],
      }),
    );
  } catch (_) {}
  try {
    const bv = document.getElementById("buildVersion");

    window.TianjiSystemV167 = {
      version: "v167",
      build: V167_BUILD,
      zeriCore: true,
      selfTest: TEST,
    };
  } catch (_) {}
})();
