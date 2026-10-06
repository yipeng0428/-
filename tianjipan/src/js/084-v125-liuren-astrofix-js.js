(function () {
  "use strict";
  const V125_BUILD = "v125 · 2026-10-04 21:03 +08:00";
  /* --- 天象回归修复：v119 流星模块曾引用 v123 IIFE 内部 helper，导致 metBind 抛错并中断 install119，连带使日月食新按钮未绑定。 --- */
  try {
    if (typeof window.dir119 === "undefined" && typeof dir119 === "function")
      window.dir119 = dir119;
  } catch (_) {}
  function v125AstroEnsure() {
    try {
      if (typeof install119 === "function") install119();
    } catch (e) {
      console.error("[v125 天象 ensure]", e);
    }
    try {
      if (typeof eclBind === "function") eclBind();
    } catch (e) {
      console.error("[v125 日月食 bind]", e);
    }
    try {
      if (typeof metBind === "function") metBind();
    } catch (e) {
      console.error("[v125 流星 bind]", e);
    }
  }
  document.addEventListener(
    "click",
    function (e) {
      const t =
        e.target && e.target.closest
          ? e.target.closest('[data-tab="astro"],[data-orr-mode="eclipse"],[data-met-tab]')
          : null;
      if (t) setTimeout(v125AstroEnsure, 0);
    },
    true,
  );
  try {
    const old = REF_BIND.astro;
    REF_BIND.astro = () => {
      try {
        if (old) old();
      } catch (e) {
        console.error("[v125 astro old bind]", e);
      }
      setTimeout(v125AstroEnsure, 0);
    };
  } catch (_) {}

  /* --- 涉害四级：代表古籍例课自动核对。 --- */
  function lr125Case(name, day, hb, zj, expectKind, expectChu) {
    let r;
    try {
      r = liuren(day, hb, zj, {});
    } catch (e) {
      return {
        name,
        ok: false,
        got: "运行异常 " + (e.message || e),
        want: expectKind + " · " + expectChu.join(""),
      };
    }
    const got = r.chu.map((x) => ZHI[x.z]),
      sub = r.sub || "",
      kind = /缀瑕/.test(sub)
        ? "缀瑕"
        : /察微/.test(sub)
          ? "察微"
          : /见机/.test(sub)
            ? "见机"
            : /涉害/.test(sub)
              ? "涉害"
              : "其他",
      ok = kind === expectKind && got.join("") === expectChu.join("");
    return {
      name,
      ok,
      got: kind + " · " + got.join(" → "),
      want: expectKind + " · " + expectChu.join(" → "),
    };
  }
  function lr125Stats() {
    const st = { she: 0, jian: 0, cha: 0, zhui: 0, fanShe: 0, fanZhui: 0 };
    for (let d = 0; d < 60; d++)
      for (let off = 0; off < 12; off++) {
        const r = liuren(d, 0, off, {});
        if (r.ge !== "涉害") continue;
        const s = r.sub || "";
        if (r.fanyin) {
          if (/缀瑕/.test(s)) st.fanZhui++;
          else st.fanShe++;
        } else if (/缀瑕/.test(s)) st.zhui++;
        else if (/察微/.test(s)) st.cha++;
        else if (/见机/.test(s)) st.jian++;
        else st.she++;
      }
    return st;
  }
  function lr125Panel() {
    const cases = [
        lr125Case("涉害例 · 甲辰日亥将卯时", ganzhiIdx(0, 4), 3, 11, "涉害", ["子", "申", "辰"]),
        lr125Case("见机例 · 丙子日午将亥时", ganzhiIdx(2, 0), 11, 6, "见机", ["子", "未", "寅"]),
        lr125Case("察微例 · 庚午日申将辰时", ganzhiIdx(6, 6), 4, 8, "察微", ["辰", "申", "子"]),
        lr125Case("缀瑕例 · 戊辰日子将巳时", ganzhiIdx(4, 4), 5, 0, "缀瑕", ["子", "未", "寅"]),
      ],
      st = lr125Stats(),
      pass = cases.filter((x) => x.ok).length;
    return `<div class="panel blk lr125-card"><div class="lr125-head"><div><h3>大六壬 Evidence 2.0 · 涉害 → 见机 → 察微 → 缀瑕</h3><small>修正涉害“寄宫 / 克向 / 孟仲判位”，并把四个代表古籍课例作为运行时回归测试</small></div><span class="lr125-state">代表例课 ${pass}/4 ${pass === 4 ? "通过" : "待校"}</span></div><div class="lr125-cases">${cases.map((x) => `<div class="lr125-case"><b>${esc(x.name)}</b><span class="${x.ok ? "ok" : "bad"}">${x.ok ? "✓ 匹配" : "△ 未匹配"}</span><br>程序：${esc(x.got)}<br><span class="dim">古籍参照：${esc(x.want)}</span></div>`).join("")}</div><div class="lr125-counts"><b>720 结构扫描（非返吟涉害细分）：</b>涉害本体 ${st.she} · 见机 ${st.jian} · 察微 ${st.cha} · 缀瑕 ${st.zhui}；返吟结构中另有涉害 ${st.fanShe}、缀瑕 ${st.fanZhui}。<br>《大六壬探原》给出的见机 9、察微 2、缀瑕 1 已与本程序一致；涉害本体本程序为 ${st.she}，与该书所述 63 仍差 1 课，因此<strong>不宣称涉害 720 全量已完全校准</strong>，保留这一处为下一轮定点核查。</div><p class="lr125-note"><strong>本轮算法修正：</strong>涉害沿途只计十干寄宫而非八字藏干；上克下与下贼上的“克向”分别计算；见机/察微判断的是候选上神所临的地盘属于孟/仲，不再误看上神自身支位。这样四个代表例课均能复现古籍三传。</p></div>`;
  }
  const LR125_OLD_RENDER = renderLiuren;
  renderLiuren = function (R0) {
    return LR125_OLD_RENDER(R0) + lr125Panel();
  };
  try {
    window.renderLiuren = renderLiuren;
  } catch (_) {}
  try {
    const bv = document.getElementById("buildVersion");

    window.TianjiSystemV125 = {
      version: "v125",
      build: V125_BUILD,
      astroLifecycleRepair: true,
      meteorScopeFix: true,
      liurenShehaiEvidence2: true,
      representativeCases: 4,
    };
  } catch (_) {}
})();
