(function () {
  "use strict";
  const V132_BUILD = "v132 · 2026-10-04 23:58 +08:00";
  function lr132Panel() {
    return `<div class="panel blk lr132-card"><div class="lr132-head"><div><h3>大六壬 Evidence 总控</h3><small>把 v123 / v124 / v125 已有的结构回归与古籍核对串成一键运行入口，继续推进 Core。</small></div><span class="lr132-state">一键拉通现有自检</span></div><div class="lr132-actions"><button class="gbtn sm" id="lr132RunAll" type="button">运行全部六壬自检</button><button class="gbtn sm" id="lr132Open123" type="button">定位到 v123 结构回归</button><button class="gbtn sm" id="lr132Open124" type="button">定位到 v124 古籍核对</button></div><div class="lr132-note" id="lr132Out">本轮重点一：把太阳系 3D / 日心俯视的信息环进一步拉开间距，缓解黄道十二宫、节气、公历月份等文字拥挤；重点二：给六壬 Core 增加总控入口，方便你一轮跑完现有 Evidence。</div></div>`;
  }
  const oldRender = renderLiuren;
  renderLiuren = function (R0) {
    return oldRender(R0) + lr132Panel();
  };
  try {
    window.renderLiuren = renderLiuren;
  } catch (_) {}
  function scrollToId(id) {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  document.addEventListener(
    "click",
    function (e) {
      const id = e.target && e.target.id;
      if (id === "lr132Open123") scrollToId("lr123Out");
      if (id === "lr132Open124") scrollToId("lr124Out");
      if (id === "lr132RunAll") {
        const out = document.getElementById("lr132Out");
        if (out) out.textContent = "正在顺序运行：v123 结构回归 → v124 古籍核对 …";
        setTimeout(() => {
          try {
            const b = document.getElementById("lr123Reg");
            if (b) b.click();
          } catch (_) {}
          setTimeout(() => {
            try {
              const b2 = document.getElementById("lr124Run");
              if (b2) b2.click();
            } catch (_) {}
            if (out)
              out.innerHTML =
                "已触发：<b>v123 结构回归</b> 与 <b>v124 古籍核对</b>。你可向下查看各自输出结果；v125 代表例课为静态即时显示。";
          }, 200);
        }, 40);
      }
    },
    false,
  );
  window.addEventListener("load", function () {
    try {
      const bv = document.getElementById("buildVersion");

      window.TianjiSystemV132 = {
        version: "v132",
        build: V132_BUILD,
        solarRingSpacing: true,
        liurenEvidenceSuite: true,
      };
    } catch (_) {}
  });
})();
