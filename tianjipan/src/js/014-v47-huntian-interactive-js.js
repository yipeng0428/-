/* ===== v47 · 默认视角 + 交互式部件 + 教程 + 古仪模型 + 相关盘联动 ===== */
const HTD_DEFAULT_VIEW = {
  yaw: -28,
  pitch: 18,
  zoom: 1,
  panX: 0,
  panY: 0,
  ref: "celestial",
  gesture: "rotate",
};
if (HTD.layers.ancient == null) HTD.layers.ancient = 1;
if (!HTD_LAYERS.some((x) => x[0] === "ancient"))
  HTD_LAYERS.push(["ancient", "古仪环架", "以传统浑仪意象重构的外框、环架与窥管示意"]);
function htdResetDefault(render = true) {
  HTD.yaw = HTD_DEFAULT_VIEW.yaw;
  HTD.pitch = HTD_DEFAULT_VIEW.pitch;
  HTD.zoom = HTD_DEFAULT_VIEW.zoom;
  HTD.panX = 0;
  HTD.panY = 0;
  HTD.ref = "celestial";
  HTD.gesture = "rotate";
  if (render) htdRender(false);
}
const HTD_COMP = {
  earth: [
    "地球 / 仪器中心",
    "浑天仪以观察者所在的地球为中心组织天球几何。这里的蓝灰小球是示意，不表示真实尺寸比例。",
  ],
  axis: [
    "天轴",
    "地球自转轴向天球延伸，穿过南、北天极。北半球观测时，北天极在地平线上的高度约等于当地纬度。",
  ],
  eq: ["天赤道", "地球赤道平面延伸到天球形成的大圆，是赤经、赤纬坐标的基准。"],
  ecl: [
    "黄道",
    "太阳周年视运动所在的大圆。黄道与天赤道相交于春分点、秋分点，两者夹角就是黄赤交角。",
  ],
  hor: [
    "地平圈",
    "观察者脚下地平面延伸到天球形成的大圆，把天空分为可见半球与地平线以下半球；它随地点和参考系改变。",
  ],
  mer: [
    "子午圈",
    "通过北点、天顶、南点和天底的大圆。太阳穿越本地子午圈附近时达到当天最高高度，称为中天。",
  ],
  trop: ["南北回归圈", "太阳赤纬周年变化的两条极限平行圈，约为 +23.44° 与 −23.44°，对应二至附近。"],
  grid: ["天球坐标网", "赤纬平行圈与赤经大圆组成的坐标网，用来理解恒星与太阳在赤道坐标中的位置。"],
  terms: [
    "二十四节气刻度",
    "把太阳黄经每 15° 划为一个节气。春分 0°、夏至 90°、秋分 180°、冬至 270°。",
  ],
  term: ["节气点", "二十四节气本质上是太阳到达特定黄经位置的时刻。"],
  day: [
    "今日太阳日周弧",
    "按今天太阳赤纬绘制的整日运动轨迹。地平线上方为当天实际可见弧段，下方是夜间位于地平线下的部分。",
  ],
  season: [
    "二至二分比较轨迹",
    "用赤纬 0°、+23.44°、−23.44°比较春秋分、夏至、冬至时太阳日周路径的高低与昼长变化。",
  ],
  sun: ["太阳", "当前计算时刻的太阳位置。它同时拥有赤道坐标、黄道坐标和地平坐标三套等价描述。"],
  zenith: ["天顶", "观察者头顶正上方，高度角 90°。天顶随地点与恒星时在天球坐标中变化。"],
  pole: ["南北天极", "地球自转轴与天球相交的两个点，是赤经坐标绕转的中心。"],
  spring: ["春分点", "黄道由南向北穿过天赤道的交点，定义为黄经 0°，也是赤经的零点基准。"],
  summer: ["夏至点", "太阳黄经 90°附近，太阳赤纬达到北侧极值。"],
  autumn: ["秋分点", "太阳黄经 180°，黄道由北向南穿过天赤道。"],
  winter: ["冬至点", "太阳黄经 270°附近，太阳赤纬达到南侧极值。"],
  ancient: [
    "古仪环架 · 示意",
    "以古代浑仪常见的外框、六合仪/三辰仪环架、支架与窥管意象做的简化重构，用于建立“实体仪器”的视觉感，不对应某一朝代某一件实物的精确复原。",
  ],
};
function htdCompMeta(D, key, term) {
  const base = HTD_COMP[key] || ["浑天仪组件", "点击组件查看说明。"];
  let title = base[0],
    desc = base[1],
    dyn = "",
    rel = "";
  if (key === "eq") {
    dyn = `当前太阳赤纬 ${htdDegFmt(D.sun.eq.dec)}；太阳相对天赤道在${D.sun.eq.dec >= 0 ? "北侧" : "南侧"}。`;
    rel = `与黄道相交于春分点和秋分点；黄道相对天赤道倾斜 ${D.sun.eps.toFixed(3)}°。`;
  } else if (key === "ecl") {
    dyn = `当前太阳黄经 ${D.sun.lon.toFixed(2)}°，位于「${D.term}」段。`;
    rel = "二十四节气、黄道十二宫与太阳周年位置都以黄道为基准。";
  } else if (key === "hor") {
    dyn = `当前地点 ${D.lon.toFixed(2)}°E、${D.lat.toFixed(2)}°N；太阳高度 ${htdDegFmt(D.aa.alt)}。`;
    rel = "太阳跨过地平圈对应日出/日落；上方弧是当天可见太阳路径。";
  } else if (key === "mer") {
    dyn = `当前太阳时角 ${htdDegFmt(D.ha)}；太阳中天约在 ${htdMinFmt(D.sol.noon)}。`;
    rel = "时角接近 0° 时，太阳接近本地子午圈与中天。";
  } else if (key === "axis" || key === "pole") {
    dyn = `当前纬度 ${D.lat.toFixed(2)}°，当地可见天极的高度与纬度直接相关。`;
    rel = "地球自转造成恒星和太阳的日周运动；赤经网格绕天轴旋转。";
  } else if (key === "trop") {
    dyn = `当前太阳赤纬 ${htdDegFmt(D.sun.eq.dec)}，周年极限约 ±23.44°。`;
    rel = "夏至、冬至分别接近两条回归圈，是昼长和正午太阳高度变化的极点。";
  } else if (key === "grid") {
    dyn = `太阳赤经 ${htdRaFmt(D.sun.eq.ra)} · 赤纬 ${htdDegFmt(D.sun.eq.dec)}。`;
    rel = "赤经类似天球上的“经度”，赤纬类似“纬度”。";
  } else if (key === "terms") {
    dyn = `当前「${D.term}」，下一节气「${D.nextTerm.name}」约 ${D.nextTerm.days.toFixed(1)} 天后。`;
    rel = "每个节气相隔 15° 太阳黄经；点击具体节气名称可查看它的固定黄经。";
  } else if (key === "term" && term) {
    const i = TERMS.indexOf(term),
      lon = i >= 0 ? i * 15 : null;
    dyn = `${term}${lon != null ? `对应太阳黄经 ${lon}°` : ""}。`;
    rel = `当前太阳黄经 ${D.sun.lon.toFixed(2)}°；当前节气段为「${D.term}」。`;
    title = term + " · 节气点";
  } else if (key === "day") {
    dyn = `今日太阳赤纬 ${htdDegFmt(D.sun.eq.dec)}；日出 ${htdMinFmt(D.sol.sun.rise)}，日落 ${htdMinFmt(D.sol.sun.set)}，昼长 ${htdDurFmt(D.sol.sun.len)}。`;
    rel = "改变日期时，这条弧会在夏至轨迹与冬至轨迹之间上下移动。";
  } else if (key === "season") {
    dyn = "淡色三条参照线分别对应二分、夏至与冬至的典型赤纬。";
    rel = "与当前“今日太阳轨迹”叠看，可快速理解季节、昼长和正午高度。";
  } else if (key === "sun") {
    dyn = `高度 ${htdDegFmt(D.aa.alt)} · 方位 ${D.aa.az.toFixed(2)}° · 黄经 ${D.sun.lon.toFixed(2)}° · 赤经 ${htdRaFmt(D.sun.eq.ra)} · 赤纬 ${htdDegFmt(D.sun.eq.dec)}。`;
    rel = `地方视太阳时 ${htdMinFmt(D.sol.app)}；当前${D.sol.state}。`;
  } else if (key === "zenith") {
    dyn = `当地天顶的赤纬等于当地纬度：约 ${D.lat.toFixed(2)}°。`;
    rel = "地平坐标的高度角从地平圈量起，天顶为 +90°。";
  } else if (["spring", "summer", "autumn", "winter"].includes(key)) {
    const map = {
        spring: ["春分", 0],
        summer: ["夏至", 90],
        autumn: ["秋分", 180],
        winter: ["冬至", 270],
      },
      q = map[key];
    dyn = `${q[0]}点对应太阳黄经 ${q[1]}°。`;
    rel = "可用左侧“二至二分对比”按钮直接跳到本年对应时刻观察。";
  } else if (key === "ancient") {
    dyn = "当前显示的是现代天球几何与古仪器外观意象的叠合层。";
    rel = "历史浑仪形制随时代和用途变化，本图只用于帮助理解环架、天轴与观测窥管的空间关系。";
  }
  return { title, desc, dyn, rel };
}
function htdAncientSVG() {
  const x = HTD.panX,
    y = HTD.panY,
    z = HTD.zoom,
    rx = 340 * z,
    ry = 105 * z,
    top = y - 300 * z,
    baseY = y + 315 * z;
  let pins = "";
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2,
      pX = x + Math.cos(a) * rx,
      pY = y + Math.sin(a) * ry;
    pins += `<circle cx="${pX.toFixed(1)}" cy="${pY.toFixed(1)}" r="${(2.5 * z).toFixed(1)}" class="htd-ancient-pin"/>`;
  }
  return `<g class="htd-ancient htd-selectable" data-htdcomp="ancient"><ellipse cx="${x}" cy="${y}" rx="${rx.toFixed(1)}" ry="${ry.toFixed(1)}" class="htd-ancient-frame" transform="rotate(-10 ${x} ${y})"/><ellipse cx="${x}" cy="${y}" rx="${(318 * z).toFixed(1)}" ry="${(82 * z).toFixed(1)}" class="htd-ancient-frame" transform="rotate(62 ${x} ${y})"/><ellipse cx="${x}" cy="${y}" rx="${(318 * z).toFixed(1)}" ry="${(82 * z).toFixed(1)}" class="htd-ancient-frame" transform="rotate(-62 ${x} ${y})"/>${pins}<path d="M${(x - rx * 0.72).toFixed(1)} ${baseY.toFixed(1)} Q${x.toFixed(1)} ${(baseY + 42 * z).toFixed(1)} ${(x + rx * 0.72).toFixed(1)} ${baseY.toFixed(1)} L${(x + rx * 0.58).toFixed(1)} ${(baseY + 34 * z).toFixed(1)} L${(x - rx * 0.58).toFixed(1)} ${(baseY + 34 * z).toFixed(1)} Z" class="htd-ancient-base"/><path d="M${(x - rx * 0.72).toFixed(1)} ${baseY.toFixed(1)} L${(x - rx * 0.66).toFixed(1)} ${(y + 90 * z).toFixed(1)} M${(x + rx * 0.72).toFixed(1)} ${baseY.toFixed(1)} L${(x + rx * 0.66).toFixed(1)} ${(y + 90 * z).toFixed(1)}" class="htd-ancient-heavy"/><line x1="${(x - 165 * z).toFixed(1)}" y1="${(y + 125 * z).toFixed(1)}" x2="${(x + 170 * z).toFixed(1)}" y2="${(y - 140 * z).toFixed(1)}" class="htd-ancient-heavy"/><text x="${(x - rx * 0.62).toFixed(1)}" y="${(top + 14 * z).toFixed(1)}" class="htd-ancient-label">古仪环架 · 简化示意</text></g>`;
}
const htdArmillarySVG_v47_base = htdArmillarySVG;
htdArmillarySVG = function (D) {
  let s = htdArmillarySVG_v47_base(D);
  const clsMap = [
    ["htd-eq", "eq"],
    ["htd-ecl", "ecl"],
    ["htd-hor", "hor"],
    ["htd-mer", "mer"],
    ["htd-tropic", "trop"],
    ["htd-gridline", "grid"],
    ["htd-term-tick", "terms"],
    ["htd-day-up", "day"],
    ["htd-day-down", "day"],
    ["htd-season-eq", "season"],
    ["htd-season-summer", "season"],
    ["htd-season-winter", "season"],
    ["htd-axis", "axis"],
    ["htd-sun", "sun"],
    ["htd-zen", "zenith"],
    ["htd-pole", "pole"],
    ["htd-earth", "earth"],
  ];
  for (const [cls, key] of clsMap) {
    const re = new RegExp(`class="([^"]*\\b${cls}\\b[^"]*)"`, "g");
    s = s.replace(re, (m, c) => `class="${c} htd-selectable" data-htdcomp="${key}"`);
  }
  s = s.replace(
    /<text ([^>]*?)class="([^"]*htd-term-label[^"]*)"([^>]*)>([^<]+)<\/text>/g,
    (m, a, c, b, n) =>
      `<text ${a}class="${c} htd-selectable"${b} data-htdcomp="term" data-htdterm="${n}">${n}</text>`,
  );
  const nameMap = {
    太阳: "sun",
    天顶: "zenith",
    北天极: "pole",
    南天极: "pole",
    春分点: "spring",
    夏至点: "summer",
    秋分点: "autumn",
    冬至点: "winter",
  };
  s = s.replace(
    /<text ([^>]*?)class="([^"]*htd-lab[^"]*)"([^>]*)>(太阳|天顶|北天极|南天极|春分点|夏至点|秋分点|冬至点)<\/text>/g,
    (m, a, c, b, n) =>
      `<text ${a}class="${c} htd-selectable"${b} data-htdcomp="${nameMap[n]}">${n}</text>`,
  );
  return (HTD.layers.ancient ? htdAncientSVG() : "") + s;
};
function htdSelectedHTML(D) {
  const sel = HTD.sel;
  if (!sel)
    return `<div class="htd-selected-card"><span class="eyebrow">点图识仪</span><h5>点击任意环、轴、太阳或节气</h5><p>被选中的组件会高亮，这里会解释它是什么、当前读数是什么，以及它与其它圈层之间的关系。</p></div>`;
  const M = htdCompMeta(D, sel.key, sel.term);
  return `<div class="htd-selected-card"><span class="eyebrow">当前选中</span><h5>${M.title}</h5><p>${M.desc}</p>${M.dyn ? `<p><b>当前读数：</b>${M.dyn}</p>` : ""}${M.rel ? `<p class="rel"><b>关系：</b>${M.rel}</p>` : ""}</div>`;
}
function htdRelatedHTML() {
  return `<div class="htd-card htd-related"><h5>相关盘联动</h5><p>同一份时间与天文数据可以继续进入其它页面，从“仪器结构”切到“星空、节气或天象数据”。</p><div class="links"><button class="gbtn sm" data-htdlink="xiutian">二十八宿全天星图</button><button class="gbtn sm" data-htdlink="astro">天象详页</button><button class="gbtn sm" data-htdlink="sky">实时星空</button><button class="gbtn sm" data-htdlink="season">时令 · 节气</button><button class="gbtn sm" data-htdlink="luopan">综合罗盘</button></div></div>`;
}
const htdInfo_v47_base = htdInfo;
htdInfo = function (D) {
  htdInfo_v47_base(D);
  const inner = $("#htdInfo .htd-info-inner");
  if (inner) {
    inner.insertAdjacentHTML("afterbegin", htdSelectedHTML(D));
    inner.insertAdjacentHTML("beforeend", htdRelatedHTML());
  }
};
function htdTutorialHTML() {
  return `<details class="htd-tutorial" id="htdTutorial" open><summary>快速读懂这台浑天仪 · 点击步骤可在图中高亮</summary><div class="htd-tutorial-note"><b>推荐顺序：</b>先认“天轴/天极” → 再看“天赤道” → 对比“黄道” → 再加入“地平圈/子午圈” → 最后看太阳日周弧和日晷。拖动只是改变观察视角，不改变天体计算结果。</div><div class="htd-tutorial-grid"><button class="htd-tutorial-step" data-htdteach="axis"><b>① 天轴与天极</b><span>先建立地球自转轴和天球旋转中心。</span></button><button class="htd-tutorial-step" data-htdteach="eq"><b>② 天赤道</b><span>理解赤经、赤纬坐标从哪里来。</span></button><button class="htd-tutorial-step" data-htdteach="ecl"><b>③ 黄道与节气</b><span>看黄赤交角，以及太阳黄经如何定义节气。</span></button><button class="htd-tutorial-step" data-htdteach="hor"><b>④ 地平圈与子午圈</b><span>把“天球坐标”转换成观察者真正看到的天空。</span></button><button class="htd-tutorial-step" data-htdteach="day"><b>⑤ 太阳日周弧</b><span>观察日出、中天、日落和季节轨迹高低。</span></button><button class="htd-tutorial-step" data-htdteach="sun"><b>⑥ 太阳时与日晷</b><span>由太阳位置理解地方视太阳时和晷影。</span></button></div></details>`;
}
function htdMount47() {
  const main = $("#htdShell .htd-main"),
    frame = $("#htdFrame"),
    view = $("#htdShell .htd-viewbar");
  if (!main || !frame || !view) return;
  const fit = $("#htdFit");
  if (fit) {
    fit.textContent = "⟳ 默认视角";
    fit.title = "恢复默认旋转角度、缩放、平移与天球跟随";
    fit.id = "htdDefault";
  }
  const now = $("#htdNow");
  if (now) {
    now.textContent = "此刻 · 归位";
    now.title = "回到当前时间，并恢复默认视角";
  }
  if (!$("#htdHelp")) {
    const fs = $("#htdFs"),
      b = document.createElement("button");
    b.className = "gbtn sm";
    b.id = "htdHelp";
    b.textContent = "? 教程";
    b.title = "打开快速读图教程";
    if (fs) fs.parentNode.insertBefore(b, fs);
  }
  if (!frame.nextElementSibling || !frame.nextElementSibling.classList.contains("htd-click-hint"))
    frame.insertAdjacentHTML(
      "afterend",
      '<div class="htd-click-hint"><b>可交互：</b><span>把鼠标移到天赤道、黄道、地平圈、子午圈、天轴、太阳、节气等元素上会响应；单击后高亮并在右侧显示解释。</span></div>',
    );
  if (!$("#htdTutorial")) {
    const inst = main.querySelector(".htd-instruments");
    if (inst) inst.insertAdjacentHTML("beforebegin", htdTutorialHTML());
  }
}
function htdApplySelected() {
  const svg = $("#htdSvg");
  if (!svg) return;
  svg.querySelectorAll("[data-htdcomp]").forEach((el) => {
    const ok =
      !!HTD.sel &&
      el.dataset.htdcomp === HTD.sel.key &&
      (HTD.sel.key !== "term" || !el.dataset.htdterm || el.dataset.htdterm === HTD.sel.term);
    el.classList.toggle("htd-selected", ok);
  });
}
function htdShowCompTip(D) {
  const frame = $("#htdFrame");
  if (!frame) return;
  let tip = $("#htdCompTip");
  if (!HTD.sel) {
    if (tip) tip.remove();
    return;
  }
  const M = htdCompMeta(D, HTD.sel.key, HTD.sel.term);
  if (!tip) {
    tip = document.createElement("div");
    tip.id = "htdCompTip";
    tip.className = "htd-comp-tip";
    frame.appendChild(tip);
  }
  tip.innerHTML = `<b>${M.title}</b><span>${M.dyn || M.desc}</span>`;
}
const htdRender_v47_base = htdRender;
htdRender = function (sound = false) {
  htdRender_v47_base(sound);
  htdApplySelected();
  try {
    htdShowCompTip(htdData());
  } catch (_) {}
};
function htdBindInteractive47() {
  const svg = $("#htdSvg"),
    frame = $("#htdFrame");
  if (!svg || svg.dataset.v47) return;
  svg.dataset.v47 = "1";
  let down = null;
  svg.addEventListener(
    "pointerdown",
    (e) => {
      down = { id: e.pointerId, x: e.clientX, y: e.clientY };
    },
    true,
  );
  svg.addEventListener(
    "click",
    (e) => {
      if (down && Math.hypot(e.clientX - down.x, e.clientY - down.y) > 5) return;
      const el = e.target.closest && e.target.closest("[data-htdcomp]");
      if (!el) return;
      HTD.sel = { key: el.dataset.htdcomp, term: el.dataset.htdterm || null };
      htdRender(false);
      try {
        if (STU.sfx) stuSfxTick(0.18, false, 1, 0.18);
      } catch (_) {}
    },
    true,
  );
  const def = $("#htdDefault");
  if (def)
    def.onclick = () => {
      htdResetDefault(false);
      HTD.sel = null;
      htdRender(false);
    };
  const now = $("#htdNow");
  if (now)
    now.onclick = () => {
      HTD.civ = htdNow();
      htdResetDefault(false);
      HTD.sel = null;
      htdRender(true);
    };
  const help = $("#htdHelp");
  if (help)
    help.onclick = () => {
      const d = $("#htdTutorial");
      if (d) {
        d.open = true;
        d.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    };
}
if (!window.__HTD_V47_DELEGATE) {
  window.__HTD_V47_DELEGATE = 1;
  document.addEventListener("click", (e) => {
    const t = e.target.closest && e.target.closest("[data-htdteach]");
    if (t && $("#htdShell")) {
      HTD.sel = { key: t.dataset.htdteach, term: null };
      htdRender(false);
      const info = $("#htdInfo");
      if (info && window.innerWidth < 1320)
        info.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    const l = e.target.closest && e.target.closest("[data-htdlink]");
    if (l && $("#htdShell")) {
      const k = l.dataset.htdlink;
      htdStop();
      if (k === "xiutian") {
        try {
          xapOpen();
        } catch (_) {
          selectTab("xingkong", true);
        }
      } else if (k === "astro") selectTab("astro", true);
      else if (k === "sky") selectTab("xingkong", true);
      else if (k === "season") selectTab("season", true);
      else if (k === "luopan") selectTab("luopan", true);
      return;
    }
  });
}
const htdOpen_v47_base = htdOpen;
htdOpen = function () {
  htdResetDefault(false);
  HTD.sel = null;
  htdOpen_v47_base();
  htdMount47();
  htdBindInteractive47();
  htdRender(false);
};
try {
  const g = NAV_G.find((x) => x.g === "盘库");
  if (g && g.it && g.it[0])
    g.it[0][3] +=
      " 古代浑天仪 古仪模型 教程 部件交互 天赤道点击 黄道点击 默认视角 此刻归位 盘间联动";
} catch (_) {}
