(() => {
  "use strict";
  const V166_BUILD = "v166 · 2026-10-05 15:20 +08:00";
  const LEGACY = typeof calcMeihua === "function" ? calcMeihua : null;
  const clone = (x) => JSON.parse(JSON.stringify(x));
  const modN = (n, k) => {
    let r = (((Number(n) || 0) % k) + k) % k;
    return r === 0 ? k : r;
  };
  function build(up, lo, mv, meta = {}) {
    up = modN(up, 8);
    lo = modN(lo, 8);
    mv = modN(mv, 6);
    const lines = hexFromTri(up, lo),
      ben = hexInfo(lines);
    const huLines = [lines[1], lines[2], lines[3], lines[2], lines[3], lines[4]],
      hu = hexInfo(huLines);
    const bl = lines.slice();
    bl[mv - 1] = 1 - bl[mv - 1];
    const bian = hexInfo(bl);
    const inLower = mv <= 3,
      ti = inLower ? up : lo,
      yong = inLower ? lo : up;
    return Object.assign(
      { up, lo, mv, ben, hu, bian, ti, yong, inLower, verdict: tiyong(ti, yong), moving: [mv - 1] },
      meta,
    );
  }
  function fromParts(yearNum, month, day, hourNum) {
    const yn = modN(yearNum, 12),
      m = Number(month),
      d = Number(day),
      h = modN(hourNum, 12),
      s3 = yn + m + d,
      s4 = s3 + h;
    return build(modN(s3, 8), modN(s4, 8), modN(s4, 6), {
      yn,
      m,
      d,
      h,
      s3,
      s4,
      method: "time",
      evidence: "《梅花易数》卷一·年月日时起例",
    });
  }
  function fromLunar(lunar, hourBranch) {
    if (
      !lunar ||
      !Number.isFinite(+lunar.year) ||
      !Number.isFinite(+lunar.month) ||
      !Number.isFinite(+lunar.day)
    )
      throw new Error("梅花时间起卦需要有效农历年月日");
    const yn = ((((+lunar.year - 4) % 12) + 12) % 12) + 1,
      hb = (((Number(hourBranch) || 0) % 12) + 12) % 12;
    const r = fromParts(yn, +lunar.month, +lunar.day, hb + 1);
    r.lunarYear = +lunar.year;
    r.isLeap = !!lunar.isLeap;
    r.hourBranch = hb;
    r.note = r.isLeap ? "闰月沿用同名月序数；古籍未在本条另定闰月加数，本站不擅自另造。" : "";
    return r;
  }
  function fromCounts(mode, values, hourBranch = 0) {
    const h = ((((Number(hourBranch) || 0) % 12) + 12) % 12) + 1,
      v = (values || []).map(Number);
    let up,
      lo,
      mv,
      how,
      evidence = "扩展";
    if (mode === "object" || mode === "one") {
      const a = v[0];
      up = modN(a, 8);
      lo = modN(a + h, 8);
      mv = modN(a + h, 6);
      how = `物数 ${a} 为上卦；加时数 ${h} 为下卦并取动爻`;
      evidence = "《梅花易数》卷一·物数占例";
    } else if (mode === "two" || mode === "sound2") {
      const a = v[0],
        b = v[1];
      up = modN(a, 8);
      lo = modN(b, 8);
      mv = modN(a + b + h, 6);
      how = `前数 ${a} 为上卦，后数 ${b} 为下卦；两数加时数 ${h} 取动爻`;
      evidence = "《梅花易数》卷一·声音占例（邻夜扣门例）";
    } else if (mode === "three") {
      up = modN(v[0], 8);
      lo = modN(v[1], 8);
      mv = modN(v[2], 6);
      how = "三数分别直取上卦、下卦、动爻";
      evidence = "本站便捷扩展（非卷一该条原式）";
    } else if (mode === "digits") {
      const s = String(values?.[0] ?? "").replace(/\D/g, ""),
        k = Math.ceil(s.length / 2),
        a = [...s.slice(0, k)].reduce((x, y) => x + (+y || 0), 0),
        b = [...s.slice(k)].reduce((x, y) => x + (+y || 0), 0) || a;
      up = modN(a, 8);
      lo = modN(b, 8);
      mv = modN(a + b + h, 6);
      how = `数字串前后半段求和：${a} / ${b}，再加时取动爻`;
      evidence = "本站便捷扩展（用于数字工具）";
    } else throw new Error("未知梅花起卦方式");
    return build(up, lo, mv, {
      method: mode,
      how,
      evidence,
      hourNum: h,
      values: clone(values || []),
    });
  }
  function sameCore(a, b) {
    return (
      !!a &&
      !!b &&
      ["up", "lo", "mv", "ti", "yong"].every((k) => a[k] === b[k]) &&
      a.ben?.name === b.ben?.name &&
      a.hu?.name === b.hu?.name &&
      a.bian?.name === b.bian?.name
    );
  }
  function selfTest() {
    const c = [],
      add = (n, ok, d = "") => c.push({ n, ok: !!ok, d });
    try {
      let r = fromParts(5, 12, 17, 9);
      add(
        "古例·观梅",
        r.ben.name === "泽火革" && r.mv === 1 && r.bian.name === "泽山咸",
        `${r.ben.name} · ${r.mv}爻 → ${r.bian.name}`,
      );
      r = fromParts(6, 3, 16, 4);
      add(
        "古例·牡丹",
        r.ben.name === "天风姤" && r.mv === 5 && r.bian.name === "火风鼎",
        `${r.ben.name} · ${r.mv}爻 → ${r.bian.name}`,
      );
      r = fromCounts("two", [1, 5], 9);
      add(
        "古例·夜扣门",
        r.ben.name === "天风姤" && r.mv === 4 && r.bian.name === "巽为风",
        `${r.ben.name} · ${r.mv}爻 → ${r.bian.name}`,
      );
      let total = 0,
        pass = 0,
        names = new Set();
      for (let up = 1; up <= 8; up++)
        for (let lo = 1; lo <= 8; lo++)
          for (let mv = 1; mv <= 6; mv++) {
            total++;
            const x = build(up, lo, mv);
            names.add(x.ben.name);
            const dif = x.ben.lines.reduce((s, v, i) => s + (v !== x.bian.lines[i] ? 1 : 0), 0),
              body = mv <= 3 ? x.ti === up && x.yong === lo : x.ti === lo && x.yong === up,
              hu =
                x.hu.lines.join("") ===
                [
                  x.ben.lines[1],
                  x.ben.lines[2],
                  x.ben.lines[3],
                  x.ben.lines[2],
                  x.ben.lines[3],
                  x.ben.lines[4],
                ].join("");
            if (dif === 1 && body && hu && x.ben.kw >= 1 && x.ben.kw <= 64) pass++;
          }
      add(
        "64卦×6爻结构回归",
        pass === total && names.size === 64,
        `${pass}/${total} · 覆盖 ${names.size}/64 卦`,
      );
      add("八卦定数", TRI[1].n === "乾" && TRI[2].n === "兑" && TRI[8].n === "坤", "乾一兑二…坤八");
      const v = tiyong(2, 3);
      add("体用生克", v[0] === "用克体" && v[1] === "凶", `${v[0]} · ${v[1]}`);
    } catch (e) {
      add("exception", false, e.message || String(e));
    }
    return {
      ok: c.every((x) => x.ok),
      checks: c,
      pass: c.filter((x) => x.ok).length,
      total: c.length,
    };
  }
  function verifyLegacy() {
    if (!LEGACY)
      return { ok: false, total: 0, pass: 0, fail: [{ reason: "legacy calcMeihua 不存在" }] };
    let total = 0,
      pass = 0;
    const fail = [];
    for (let yn = 1; yn <= 12; yn++)
      for (let m = 1; m <= 12; m++)
        for (let d = 1; d <= 30; d++)
          for (let hb = 0; hb < 12; hb++) {
            total++;
            const year = 1983 + yn,
              l = { year, month: m, day: d, isLeap: false };
            let a, b;
            try {
              a = LEGACY(l, hb);
              b = fromLunar(l, hb);
            } catch (e) {
              if (fail.length < 10) fail.push({ yn, m, d, hb, error: e.message });
              continue;
            }
            if (sameCore(a, b)) pass++;
            else if (fail.length < 10)
              fail.push({
                yn,
                m,
                d,
                hb,
                legacy: {
                  up: a.up,
                  lo: a.lo,
                  mv: a.mv,
                  ben: a.ben?.name,
                  hu: a.hu?.name,
                  bian: a.bian?.name,
                },
                core: {
                  up: b.up,
                  lo: b.lo,
                  mv: b.mv,
                  ben: b.ben?.name,
                  hu: b.hu?.name,
                  bian: b.bian?.name,
                },
              });
          }
    return { ok: pass === total, total, pass, fail };
  }
  const TEST = selfTest();
  const API = Object.freeze({
    version: "1.0.0",
    build: V166_BUILD,
    doctrine: "先天数 · 年月日时起例 · 体用互变",
    fromParts,
    fromLunar,
    fromCounts,
    build,
    selfTest: () => clone(TEST),
    verifyLegacy,
    manifest: () => ({
      module: "Tianji Meihua Core",
      version: "1.0.0",
      build: V166_BUILD,
      status: TEST.ok ? "active" : "degraded",
      implemented: [
        "年月日时起卦",
        "物数/声音数起卦",
        "本互变卦",
        "单爻变",
        "体用判定",
        "五行生克",
      ],
      evidence: [
        "《梅花易数》卷一：周易卦数、卦以八除、爻以六除、互卦起例、年月日时起例、物数占例",
        "《梅花易数》卷二：体用生克",
      ],
      extensions: ["三数直取", "数字串拆分"],
      limitations: [
        "外应/十应/应期尚未结构化",
        "闰月沿用同名月序数",
        "古籍互卦以中四爻分两卦且称不必取六十四卦名；页面组合名仅为统一展示",
        "乾坤无互另有“互其变卦”异说，当前保持通用中四爻算法并显式标记",
        "体用旺衰与万物类象仍属解释层，不声明唯一断法",
      ],
      selfTest: TEST,
    }),
  });
  window.TianjiMeihua = API;
  try {
    window.__TianjiCalcMeihuaLegacy = LEGACY;
    calcMeihua = function (lunar, hb) {
      return API.fromLunar(lunar, hb);
    };
    window.calcMeihua = calcMeihua;
  } catch (e) {
    console.warn("[v166 install]", e);
  }
  function panel(R0) {
    const m = R0?.mh || {},
      checks = TEST.checks || [],
      status = TEST.ok ? "PASS" : "FAIL";
    return `<div class="panel blk mh166-core"><div class="mh166-head"><div><h3>梅花易数 Core 1.0 · 古籍金样与结构回归</h3><p>把原先散落在页面里的时间起卦、数字起卦、互卦、变卦和体用规则收束成独立确定性 Core；排盘事实与后续象意解读分离。</p></div><span class="mh166-badge ${TEST.ok ? "ok" : "bad"}">Core Self-Test · ${status}</span></div>
  <div class="mh166-grid"><div class="mh166-card good"><small>古籍主公式</small><b>年月日 → 上卦</b><p>年月日加时 → 下卦；总数除六取动爻。余数 0 分别按 8 / 6 处理。</p></div><div class="mh166-card good"><small>本 · 互 · 变</small><b>单爻变 + 中四爻互卦</b><p>互卦取二三四爻为下互、三四五爻为上互；变卦只翻转指定动爻。</p></div><div class="mh166-card good"><small>体 · 用</small><b>无动者体 · 有动者用</b><p>动爻在下卦则下用上体；动爻在上卦则上用下体，再按五行生克判关系。</p></div></div>
  <div class="mh166-formula"><b>当前时间卦审计：</b>年支数 ${m.yn ?? "—"} + 月 ${m.m ?? "—"} + 日 ${m.d ?? "—"} = ${m.s3 ?? "—"} → 上卦 ${m.up ? TRI[m.up].n : "—"}；再 + 时数 ${m.h ?? "—"} = ${m.s4 ?? "—"} → 下卦 ${m.lo ? TRI[m.lo].n : "—"}；总数除 6 → 第 ${m.mv ?? "—"} 爻动。${m.note ? `<br><span class="dim">${esc(m.note)}</span>` : ""}</div>
  <div class="mh166-tests">${checks.map((x) => `<div class="mh166-test ${x.ok ? "ok" : "bad"}"><b>${esc(x.n)}</b><span>${esc(x.d || "")}</span></div>`).join("")}</div>
  <div class="mh166-methods"><div class="mh166-method"><b>时间起卦</b><em class="src">古籍原式</em><p>年支、农历月、日、时支按数起卦，是当前主页面默认方式。</p></div><div class="mh166-method"><b>物数 / 单数 + 时</b><em class="src">古籍原式</em><p>物数作上卦，加时作下卦与动爻。</p></div><div class="mh166-method"><b>两次数 + 时</b><em class="src">古例可核</em><p>如夜扣门一声、五声：一作乾、五作巽，再加酉时取动爻。</p></div><div class="mh166-method"><b>三数直取 / 数字串</b><em class="ext">本站扩展</em><p>保留为便捷输入，但不再标成《梅花易数》卷一原式。</p></div></div>
  <div class="mh166-tools"><button type="button" class="gbtn sm" id="mh166Verify">运行 51,840 组 legacy 回归</button><button type="button" class="gbtn sm" id="mh166Copy">复制当前 Core JSON</button><div class="mh166-out" id="mh166Out">古籍金样：观梅、牡丹、夜扣门已纳入；64 卦 × 6 动爻共 384 组结构回归已自动运行。</div></div>
  <p class="note" style="margin:10px 0 0">证据口径：核心公式取《梅花易数》卷一“卦以八除、爻以六除、互卦起例、年月日时起例”及观梅/牡丹/夜扣门古例；体用生克取卷二。外应、十应、应期、旺衰和万物类象属于更高层解释规则，v166 不把它们硬塞进确定性排盘 Core。另：古籍说互卦以中四爻分作两卦、‘不必取六十四卦名’，并另记‘乾坤无互，互其变卦’异说；本站现有界面把上下互卦组合成一个六十四卦名只是统一展示方式，不把它当作唯一古法口径。</p></div>`;
  }
  try {
    const OLD_RENDER = window.renderYi || renderYi;
    renderYi = function (R0) {
      return OLD_RENDER(R0) + panel(R0);
    };
    window.renderYi = renderYi;
  } catch (e) {
    console.warn("[v166 render patch]", e);
  }
  document.addEventListener(
    "click",
    (e) => {
      const b = e.target.closest && e.target.closest("#mh166Verify,#mh166Copy");
      if (!b) return;
      if (b.id === "mh166Verify") {
        const out = document.getElementById("mh166Out");
        b.disabled = true;
        if (out) out.textContent = "正在运行 51,840 组时间起卦回归…";
        setTimeout(() => {
          const r = verifyLegacy();
          if (out)
            out.innerHTML = r.ok
              ? `<b>PASS</b> · ${r.pass.toLocaleString()} / ${r.total.toLocaleString()} 全部与 v84 legacy 一致。`
              : `<b style="color:var(--bad)">FAIL</b> · ${r.pass.toLocaleString()} / ${r.total.toLocaleString()}，首批差异：${esc(JSON.stringify(r.fail.slice(0, 3)))}`;
          b.disabled = false;
          try {
            toast(r.ok ? "梅花 51,840 组回归通过" : "梅花回归发现差异");
          } catch (_) {}
        }, 20);
        return;
      }
      if (b.id === "mh166Copy") {
        try {
          const cur = typeof R !== "undefined" && R ? R.mh : null,
            obj = { build: V166_BUILD, core: API.manifest(), current: cur };
          const s = JSON.stringify(obj, null, 2);
          if (navigator.clipboard?.writeText)
            navigator.clipboard.writeText(s).then(() => toast("已复制梅花 Core JSON"));
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
        id: "tianji-v166-meihua-core",
        type: "internal",
        title: "Tianji Meihua Core 1.0",
        version: "1.0.0",
        baseline: "v165",
        evidence: "《梅花易数》卷一/卷二公有领域古籍口径",
      });
      TianjiCore.registerEngine(
        {
          id: "meihua.core.v1",
          system: "meihua",
          name: "Tianji Meihua Core 1.0",
          version: "1.0.0",
          source: "tianji-v166-meihua-core",
          doctrine: "先天数 · 年月日时 · 体用互变",
          status: TEST.ok ? "active" : "degraded",
        },
        (input) =>
          input?.lunar
            ? API.fromLunar(input.lunar, input.hourBranch || 0)
            : API.fromParts(input.yearNum, input.month, input.day, input.hourNum),
      );
      TianjiCore.registerEngine(
        {
          id: "meihua.verify.v1",
          system: "meihua",
          name: "Meihua Core Verifier",
          version: "1.0.0",
          source: "tianji-v166-meihua-core",
          doctrine: "古籍金样 + 384结构回归 + v84回归",
          status: "verification",
        },
        (input) => (input?.legacy ? API.verifyLegacy() : API.selfTest()),
      );
    }
  } catch (e) {
    console.warn("[v166 registry]", e);
  }
  try {
    if (typeof VF !== "undefined" && !VF.some((r) => r[0] === "梅花易数")) {
      const at = Math.max(
        0,
        VF.findIndex((r) => r[0] === "周易六十四卦"),
      );
      VF.splice(at, 0, [
        "梅花易数",
        "自洽校验",
        "《梅花易数》卷一/卷二古籍金样 + v84 legacy",
        "观梅/牡丹/夜扣门 + 384 结构组；可选 51,840 时间组合",
        "三则古例结果一致；64 卦×6 爻结构闭合；legacy 全量回归可一键复跑",
        "时间起卦为古籍原式；三数直取、数字串拆分明确标为本站扩展；外应/应期未并入确定性 Core",
      ]);
    }
  } catch (_) {}
  try {
    const road = window.TianjiRoadmap || {},
      er = (road.engineRoute || []).map((x) =>
        x.id === "meihua"
          ? Object.assign({}, x, {
              state: "core+verify+evidence",
              versions: "v166",
              next: "外应/应期 Evidence + 解读知识层",
            })
          : x,
      );
    window.TianjiRoadmap = Object.freeze(
      Object.assign({}, road, {
        engineRoute: er,
        nextMainline: [
          "奇门四家交叉验证/格局知识层",
          "择日 Core",
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

    window.TianjiSystemV166 = {
      version: "v166",
      build: V166_BUILD,
      meihuaCore: true,
      selfTest: TEST,
    };
  } catch (_) {}
})();
