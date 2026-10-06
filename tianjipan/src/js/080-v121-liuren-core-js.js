(function () {
  "use strict";
  const LR121_BUILD = "v121 · 2026-10-04 14:50 +08:00";
  function lr121Esc(x) {
    return String(x == null ? "" : x).replace(/[&<>\"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '\"': "&quot;" }[c] || c;
    });
  }
  function lr121RelTxt(k) {
    return k.rel === "贼" ? "下贼上" : k.rel === "克" ? "上克下" : "无克";
  }
  function lr121Trace(lr) {
    const zei = lr.ke.filter((k) => k.rel === "贼"),
      ke = lr.ke.filter((k) => k.rel === "克"),
      d = lr.distinct;
    const a = [];
    a.push({
      t: "天地盘",
      v: `${ZHI[lr.zj]}将（${lr.jiangName}）加${ZHI[lr.hb]}时；${lr.fuyin ? "天地盘同位，为伏吟" : lr.fanyin ? "天地盘对冲，为返吟" : "天地盘正常转位"}`,
      c: "ok",
    });
    a.push({
      t: "四课",
      v: lr.ke
        .map(
          (k, i) =>
            `${["一", "二", "三", "四"][i]}课 ${k.lIsGan ? GAN[lr.dg] + "寄" + ZHI[LR_JIGONG[lr.dg]] : ZHI[k.l]}→${ZHI[k.u]}（${lr121RelTxt(k)}）`,
        )
        .join("；"),
      c: "ok",
    });
    if (zei.length || ke.length) {
      const pool = zei.length ? zei : ke;
      a.push({
        t: "贼克入口",
        v: `下贼上 ${zei.length} 个，上克下 ${ke.length} 个；先取${zei.length ? "贼" : "克"}。候选上神：${pool.map((x) => ZHI[x.u]).join("、")}。`,
        c: "ok",
      });
      a.push({
        t: "比用 / 涉害",
        v:
          pool.length === 1
            ? "候选唯一，不再进入比用、涉害。"
            : `候选不唯一：先按日干阴阳比用；仍不唯一再比较涉害深浅。当前最终依据：${lr.sub}。`,
        c: lr.ge === "涉害" ? "warn" : "ok",
      });
    } else {
      a.push({
        t: "无贼克",
        v: `四课无直接上下克，进入遥克 / 昴星 / 别责 / 八专 / 伏吟返吟分支；四课上下组合去重数 = ${d}。`,
        c: "warn",
      });
      if (lr.fuyin)
        a.push({
          t: "伏吟",
          v: `月将与占时同支（${ZHI[lr.zj]}），天地盘不动；按伏吟取传规则处理。当前：${lr.sub}。`,
          c: "warn",
        });
      else if (lr.fanyin)
        a.push({ t: "返吟", v: `月将与占时相冲（相差六支）；当前：${lr.sub}。`, c: "warn" });
      else
        a.push({
          t: "特殊分支",
          v: `最终落入「${lr.ge}」：${lr.sub}。`,
          c: ["涉害", "别责", "八专", "昴星", "遥克"].includes(lr.ge) ? "warn" : "ok",
        });
    }
    a.push({
      t: "三传落定",
      v: `初传 ${ZHI[lr.chu[0].z]}（${lr.chu[0].gen}） → 中传 ${ZHI[lr.chu[1].z]}（${lr.chu[1].gen}） → 末传 ${ZHI[lr.chu[2].z]}（${lr.chu[2].gen}）；取传说明：${lr.sub}。`,
      c: "ok",
    });
    a.push({
      t: "附加层",
      v: `贵人 ${ZHI[lr.gui]}，${lr.shun ? "顺布" : "逆布"}十二天将；旬空 ${lr.kong.map((z) => ZHI[z]).join("、")}；驿马 ${ZHI[lr.yiMa]}。`,
      c: "ok",
    });
    return a;
  }
  function lr121Audit(lr) {
    const rs = [],
      pass = (n, ok, d) => rs.push({ n, ok, d });
    const perm = (a) =>
      Array.isArray(a) &&
      a.length === 12 &&
      new Set(a).size === 12 &&
      a.every((x) => Number.isInteger(x) && x >= 0 && x < 12);
    pass("天盘排列", perm(lr.sky), "12 支必须各出现一次");
    let inv = true;
    for (let e = 0; e < 12; e++) {
      const s = lr.sky[e];
      if (lr.earthOf[s] !== e) {
        inv = false;
        break;
      }
    }
    pass("天地互逆", inv, "earthOf[sky[地盘]] 必须回到原地盘");
    pass("月将加时", lr.sky[lr.hb] === lr.zj, `占时 ${ZHI[lr.hb]} 位上应见月将 ${ZHI[lr.zj]}`);
    const g0 = LR_JIGONG[lr.dg],
      s1 = lr.sky[g0],
      s2 = lr.sky[s1],
      s3 = lr.sky[lr.dz],
      s4 = lr.sky[s3];
    const k = lr.ke || [];
    pass(
      "四课复算",
      k.length === 4 && k[0].u === s1 && k[1].u === s2 && k[2].u === s3 && k[3].u === s4,
      "按干寄宫、支上神逐课复算",
    );
    pass(
      "三传结构",
      Array.isArray(lr.chu) &&
        lr.chu.length === 3 &&
        lr.chu.every((x) => x && x.z >= 0 && x.z < 12),
      "必须恰有初、中、末三传",
    );
    pass(
      "天将映射",
      Array.isArray(lr.gen) && lr.gen.length === 12 && new Set(lr.gen).size === 12,
      "十二天将应各临一神",
    );
    pass(
      "旬空 / 遁干",
      Array.isArray(lr.kong) && lr.kong.length === 2 && Object.keys(lr.dun || {}).length === 10,
      "一旬十干、二支旬空",
    );
    pass("伏吟标志", !lr.fuyin || lr.zj === lr.hb, "伏吟必须月将与占时同支");
    pass("返吟标志", !lr.fanyin || (lr.zj - lr.hb + 12) % 12 === 6, "返吟必须天地盘相差六支");
    pass(
      "传课附属",
      lr.chu.every((c) => lr.gen[c.z] === c.gen && lr.relOf(c.z) === c.rel),
      "三传天将、六亲须与主表一致",
    );
    return rs;
  }
  function lr121Tags(lr) {
    const t = [`主课体 · ${lr.ge}`];
    if (lr.fuyin) t.push("伏吟");
    if (lr.fanyin) t.push("返吟");
    const k = lr.chu.filter((c) => c.kong).length;
    if (k) t.push(`${k}传空亡`);
    if (lr.chu.some((c) => c.z === lr.yiMa)) t.push("驿马入传");
    if (new Set(lr.chu.map((c) => c.z)).size < 3) t.push("三传有复神");
    if (lr.chu[0].z === lr.chu[2].z) t.push("首尾同传");
    return t;
  }
  function lr121CoreHTML(R) {
    const lr = R.lr,
      trace = lr121Trace(lr),
      audit = lr121Audit(lr),
      ok = audit.every((x) => x.ok),
      tags = lr121Tags(lr);
    const chain = trace
      .map(
        (x, i) =>
          `<div class="lr-rule-step ${x.c}"><span class="n">${i + 1}</span><b>${lr121Esc(x.t)}</b><span>${lr121Esc(x.v)}</span></div>`,
      )
      .join("");
    const aud = audit
      .map(
        (x) =>
          `<div class="lr-audit-row ${x.ok ? "pass" : "fail"}"><span class="ic">${x.ok ? "✓" : "×"}</span><b>${lr121Esc(x.n)}</b><span>${lr121Esc(x.d)}</span></div>`,
      )
      .join("");
    return `<div class="panel blk lr-core"><div class="lr-core-head"><div><h3>大六壬 Core · 九宗门规则链</h3><small>把“为什么是这个课体、为什么取这三传”拆成可追踪步骤</small></div><span class="lr-core-badge">${ok ? "当前课局自检通过" : "当前课局存在自检异常"}</span></div><div class="lr-tags121">${tags.map((x, i) => `<span class="${i === 0 ? "hot" : /空亡|返吟|伏吟/.test(x) ? "risk" : ""}">${lr121Esc(x)}</span>`).join("")}</div><div class="lr-core-grid"><section><div class="lr-rule-chain">${chain}</div></section><aside class="lr-tracebox"><h4>当前课局自检</h4><div class="lr-audit">${aud}</div><p class="lr-core-note"><b>边界：</b>这是确定性结构自检，不等于第三方外部对拍。当前项目对天地盘、四课已有大样本外部核对；伏吟、返吟、八专、别责、涉害等特殊取传仍保留流派差异说明，不把“自洽”冒充“唯一正确”。</p></aside></div><div class="lr-tracebox" id="lr121Pick"><h4>点盘面查看溯源</h4><p>点击天地盘中的天盘神、四课上神或三传，即可查看它在地盘、天将、六亲、遁干、旬空与三传中的位置。</p></div></div>`;
  }
  function lr121PickHTML(lr, z) {
    const earth = lr.earthOf[z],
      ci = lr.chu.findIndex((c) => c.z === z),
      kis = [];
    lr.ke.forEach((k, i) => {
      if (k.u === z) kis.push(["一", "二", "三", "四"][i] + "课上神");
    });
    const parts = [
      `天盘 <b>${ZHI[z]}</b>（${JIANG_OF_ZHI[z]}）`,
      `落地盘 <b>${ZHI[earth]}</b>`,
      `天将 <b>${lr.gen[z]}</b>（${TJ_BRIEF[lr.gen[z]]}）`,
      `六亲 <b>${lr.relOf(z)}</b>`,
      lr.dun[z] ? `遁干 <b>${lr.dun[z]}</b>` : "本支无遁干",
      lr.kong.includes(z) ? '<b class="bad">旬空</b>' : "不空",
      z === lr.yiMa ? '<b class="gold">驿马</b>' : "",
      kis.length ? `见于 <b>${kis.join("、")}</b>` : "",
      ci >= 0 ? `为 <b class="gold">${["初传", "中传", "末传"][ci]}</b>` : "",
    ].filter(Boolean);
    return `<h4>${ZHI[z]} · ${lr.gen[z]}</h4><p>${parts.join(" · ")}</p><p><b>空间关系：</b>月将 ${ZHI[lr.zj]} 加 ${ZHI[lr.hb]} 时后，${ZHI[z]} 从本位转临地盘 ${ZHI[earth]}；其天将、六亲和遁干均随当前课局读取。</p>`;
  }
  const OLD_RENDER_LR121 = window.renderLiuren;
  window.renderLiuren = function (R) {
    const lr = R.lr,
      dg = lr.dg,
      inChu = lr.chu.map((c) => c.z),
      tags = ["初", "中", "末"],
      cells = [];
    for (let b = 0; b < 12; b++) {
      const s = lr.sky[b],
        [rr, cc] = LR_POS[b],
        idx = inChu.indexOf(s),
        g = lr.gen[s];
      cells.push(
        `<div class="lrc lr-clickable" data-lr-z="${s}" style="grid-area:${rr}/${cc};--i:${b}"><span class="eb">${ZHI[b]}</span>${idx >= 0 ? `<span class="cb">${tags[idx]}传</span>` : ""}<div class="sk wx${ZHI_WX[s]}" data-scr="gz">${ZHI[s]}</div><div class="gn ${TJ_TONE[g]}">${g}</div><small class="dim">${lr.dun[s] ? "遁" + lr.dun[s] + " · " : ""}${lr.relOf(s)}</small></div>`,
      );
    }
    const ke4 = [...lr.ke].reverse(),
      nm = ["四课", "三课", "二课", "一课"];
    const ke = ke4
      .map(
        (k, i) =>
          `<div class="kc lr-clickable" data-lr-z="${k.u}"><div class="kh">${nm[i]}</div><div class="ku wx${ZHI_WX[k.u]}">${ZHI[k.u]}</div><div class="kr ${k.rel === "贼" ? "bad" : k.rel === "克" ? "good" : "dim"}">${k.rel === "和" ? "—" : k.rel === "贼" ? "下贼上" : "上克下"}</div><div class="kl">${k.lIsGan ? GAN[dg] : ZHI[k.l]}</div><small class="${TJ_TONE[k.gen]}">${k.gen}</small></div>`,
      )
      .join("");
    const cs = lr.chu
      .map(
        (c, i) =>
          `<div class="cc rv lr-clickable" data-lr-z="${c.z}" style="--i:${i}"><div class="ch">${["初传", "中传", "末传"][i]}</div><div class="cz wx${ZHI_WX[c.z]}" data-scr="gz">${ZHI[c.z]}</div><div class="cj ${TJ_TONE[c.gen]}">${c.gen}</div><small class="dim">${TJ_BRIEF[c.gen]}</small><div class="cm">${c.rel}${c.dun ? " · 遁" + c.dun : ""}${c.kong ? ' · <span class="bad">空亡</span>' : ""}</div></div>`,
      )
      .join('<div class="ar">›</div>');
    return `<div class="panel blk"><div class="kv"><span>日柱 <b>${GAN[dg]}${ZHI[lr.dz]}</b></span><span>时支 <b>${ZHI[lr.hb]}</b>(${lr.day ? "昼" : "夜"}占)</span><span>月将 <b>${ZHI[lr.zj]}·${lr.jiangName}</b> 加时</span><span>贵人 <b>${ZHI[lr.gui]}</b> ${lr.shun ? "顺布" : "逆布"}</span><span>课体 <b class="gold">${lr.ge}</b></span><span>空亡 <b>${lr.kong.map((z) => ZHI[z]).join("")}</b></span><span>驿马 <b>${ZHI[lr.yiMa]}</b></span></div><p class="note" style="margin-top:6px">取传依据:${lr.sub}${lr.fuyin ? "。天地盘伏吟" : ""}${lr.fanyin ? "。天地盘返吟" : ""}</p></div>
  <div class="panel blk"><h3 class="sec">天地盘</h3><div class="lrgrid">${cells.join("")}<div class="lrctr"><div class="big">${lr.ge}</div><div class="dim">${ZHI[lr.zj]}将(${lr.jiangName})加${ZHI[lr.hb]}时</div><div class="dim">${GAN[dg]}${ZHI[lr.dz]}日 · ${lr.day ? "昼" : "夜"}贵</div></div></div><p class="note">外圈小字为地盘，大字为天盘神。现在可直接点击任一天盘神，与四课、三传做同神溯源高亮。</p></div>
  <div class="panel blk"><h3 class="sec">四课</h3><div class="kegrid">${ke}</div><p class="note">一课:日干寄宫上神；二课:一课上神之上神；三课:日支上神；四课:三课上神之上神。点击上神可追踪它在天地盘与三传中的位置。</p></div>
  <div class="panel blk"><h3 class="sec">三传</h3><div class="chuan">${cs}</div><p class="note">六亲以日干为“我”。三传是九宗门决策的最终输出；下方 Core 面板会逐步显示本课为什么进入当前取传分支。</p></div>
  ${lr121CoreHTML(R)}
  ${lrReadHTML(R)}`;
  };
  function lr121Focus(z) {
    const pane = document.getElementById("pane-liuren");
    if (!pane || typeof R === "undefined" || !R) return;
    pane.querySelectorAll(".lr-focus").forEach((x) => x.classList.remove("lr-focus"));
    pane.querySelectorAll(`[data-lr-z="${z}"]`).forEach((x) => x.classList.add("lr-focus"));
    const box = document.getElementById("lr121Pick");
    if (box) box.innerHTML = lr121PickHTML(R.lr, z);
  }
  document.addEventListener(
    "click",
    function (e) {
      const t = e.target && e.target.closest ? e.target.closest("#pane-liuren [data-lr-z]") : null;
      if (!t) return;
      lr121Focus(+t.dataset.lrZ);
    },
    false,
  );
  /* 校验表：保持“部分”状态，但把本轮新增的 Core 自检边界写清楚。 */
  try {
    if (typeof VF !== "undefined") {
      const r = VF.find((x) => x[0] === "大六壬");
      if (r) {
        r[2] = "外部实现 + v121 Core 自检";
        r[3] = "8638 个外部课例 + 当前课局 9 项结构自检";
        r[4] =
          "天地盘、四课外部对拍 0 偏差；新增天地互逆、月将加时、四课复算、三传/天将/旬空等运行时自检";
        r[5] =
          "特殊课体（伏吟、返吟、八专、别责、涉害）仍存在取传口径差异；自检只证明结构自洽，不宣称各派唯一正确";
      }
    }
  } catch (_) {}
  /* 版本 */
  try {
    const bv = document.getElementById("buildVersion");

    window.TianjiSystemV121 = {
      version: "v121",
      build: LR121_BUILD,
      liurenCore: true,
      liurenRuleTrace: true,
      liurenRuntimeAudit: true,
      liurenTraceClick: true,
    };
  } catch (_) {}
})();
