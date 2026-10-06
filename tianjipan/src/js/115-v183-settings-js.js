(() => {
  "use strict";
  const BUILD = "v183 · 2026-10-05 23:46 +08:00";
  const KEY = "tianjipan.settings.v1";
  const THEMES = {
    auto: { name: "跟随系统", desc: "自动模式 · 跟随设备明暗", actual: null, mode: true },
    xuanpaper: { name: "宣纸雅白", desc: "纸本米白 · 茶金朱印", actual: "light" },
    xuanye: { name: "玄夜墨青", desc: "墨青夜色 · 金线青光", actual: "dark" },
    cinnabar: { name: "宫阙朱砂", desc: "宫墙朱砂 · 宣纸旧金", actual: "light" },
    jade: { name: "月白青玉", desc: "月白青瓷 · 玉色铜绿", actual: "light" },
    ziwei: { name: "紫微星垣", desc: "深靛星垣 · 紫曜银金", actual: "dark" },
  };
  const FONTS = {
    serif: { name: "雅宋", desc: "宋体骨架，古雅耐读；优先 Noto / 思源宋体" },
    kai: { name: "楷意", desc: "楷体书写感更强，适合传统文化氛围" },
    fangsong: { name: "仿宋书卷", desc: "纤细端正，偏古籍与文献气质" },
    sans: { name: "清雅黑体", desc: "现代、克制，长时间屏幕阅读更清楚" },
    system: { name: "系统原生", desc: "优先使用当前设备最稳定的系统字体" },
  };
  const DEF = {
    appearance: {
      theme: "auto",
      quickReturn: "xuanpaper",
      fontScale: 1,
      fontFamily: "serif",
      letterSpacing: 0.015,
      reduceMotion: false,
      stars: true,
    },
    general: { rememberTab: true },
  };
  let S = load(),
    modal = null,
    tab = "appearance",
    mq = null;

  function clone(x) {
    return JSON.parse(JSON.stringify(x));
  }
  function merge(a, b) {
    const o = clone(a);
    for (const [k, v] of Object.entries(b || {})) {
      if (v && typeof v === "object" && !Array.isArray(v)) o[k] = { ...(o[k] || {}), ...v };
      else o[k] = v;
    }
    return o;
  }
  function load() {
    let o = null;
    try {
      o = JSON.parse(localStorage.getItem(KEY) || "null");
    } catch (_) {}
    if (!o) {
      let old = null;
      try {
        old = localStorage.getItem("tianjipan.theme");
      } catch (_) {}
      o = {
        appearance: { theme: old === "light" ? "xuanpaper" : old === "dark" ? "xuanye" : "auto" },
      };
    }
    return merge(DEF, o);
  }
  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(S));
    } catch (_) {}
    window.dispatchEvent(new CustomEvent("tianji:settingschange", { detail: clone(S) }));
  }
  function sysLight() {
    return !!(window.matchMedia && matchMedia("(prefers-color-scheme: light)").matches);
  }
  function applyTheme(choice = S.appearance.theme, persist = true) {
    if (!THEMES[choice]) choice = "auto";
    S.appearance.theme = choice;
    const actual = THEMES[choice].actual || (sysLight() ? "light" : "dark");
    const r = document.documentElement;
    r.setAttribute("data-tj-theme", choice);
    r.setAttribute("data-theme", actual);
    try {
      localStorage.setItem("tianjipan.theme", actual);
    } catch (_) {}
    if (persist) save();
    try {
      window.dispatchEvent(
        new CustomEvent("tianji:themechange", { detail: { theme: choice, actual } }),
      );
    } catch (_) {}
    requestAnimationFrame(() => {
      try {
        window.dispatchEvent(new Event("resize"));
        nwRenderCards?.(true);
      } catch (_) {}
    });
  }
  function applyAppearance(persist = true) {
    const r = document.documentElement,
      fs = Math.max(0.85, Math.min(1.3, Number(S.appearance.fontScale) || 1));
    const fk = FONTS[S.appearance.fontFamily] ? S.appearance.fontFamily : "serif";
    const ls = Math.max(0, Math.min(0.08, Number(S.appearance.letterSpacing ?? 0.015)));
    S.appearance.fontScale = fs;
    S.appearance.fontFamily = fk;
    S.appearance.letterSpacing = ls;
    r.style.setProperty("--tj-font-scale", String(fs));
    r.setAttribute("data-tj-font", fk);
    r.style.setProperty("--tj-letter-spacing", ls + "em");
    if (S.appearance.reduceMotion) r.setAttribute("data-tj-motion", "reduced");
    else r.removeAttribute("data-tj-motion");
    if (S.appearance.stars === false) r.setAttribute("data-tj-stars", "off");
    else r.removeAttribute("data-tj-stars");
    applyTheme(S.appearance.theme, persist);
  }
  function E(s) {
    return String(s ?? "").replace(
      /[&<>"']/g,
      (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[m],
    );
  }
  function ensure() {
    if (modal && modal.isConnected) return modal;
    modal = document.createElement("div");
    modal.className = "tjs-modal";
    modal.id = "tjsModal";
    modal.hidden = true;
    modal.innerHTML =
      '<div class="tjs-shell" role="dialog" aria-modal="true" aria-label="全站设置"><div id="tjsBody"></div></div>';
    document.body.appendChild(modal);
    modal.addEventListener("pointerdown", (e) => {
      if (e.target === modal) close();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && modal && !modal.hidden) close();
    });
    return modal;
  }
  const navs = [
    ["appearance", "◐", "外观与主题", "全站颜色、字体、动效"],
    ["bell", "♬", "报时与提醒", "声音、语音、天象、勿扰"],
    ["time", "◷", "时间与显示", "当前时间口径与显示约定"],
    ["data", "◇", "账号与数据", "档案、设置导入导出"],
    ["about", "◎", "关于设置", "范围、原则与后续计划"],
  ];
  function themeGrid() {
    const actual = Object.entries(THEMES).filter(([k, v]) => !v.mode);
    return `<div class="tjs-auto-wrap">
    <button type="button" class="tjs-auto-theme${S.appearance.theme === "auto" ? " on" : ""}" data-tjs-theme="auto">
      <span class="tjs-auto-swatch"><i></i><i></i></span>
      <span><b>跟随系统</b><small>系统浅色 = 纯白 · 系统深色 = 纯黑</small></span>
    </button>
    <span class="dim sm">自动模式不占五套主题名额</span>
  </div>
  <div class="tjs-themegrid">${actual.map(([k, v]) => `<button type="button" class="tjs-theme${S.appearance.theme === k ? " on" : ""}" data-tjs-theme="${k}"><span class="tjs-swatch"><i></i><i></i><i></i></span><b>${v.name}</b><small>${v.desc}</small></button>`).join("")}</div>`;
  }
  function updateQuickThemeButton() {
    const b = document.getElementById("themeBtn");
    if (!b) return;
    const night = S.appearance.theme === "xuanye";
    b.dataset.night = night ? "1" : "0";
    b.innerHTML = '<span class="tj-taiji-icon" aria-hidden="true"></span>';
    const back =
      S.appearance.quickReturn &&
      THEMES[S.appearance.quickReturn] &&
      S.appearance.quickReturn !== "xuanye"
        ? S.appearance.quickReturn
        : "xuanpaper";
    b.title = night ? `返回：${THEMES[back].name}` : "一键切换：玄夜墨青";
    b.setAttribute("aria-label", b.title);
    b.setAttribute("aria-pressed", night ? "true" : "false");
  }
  function quickTheme() {
    const cur = S.appearance.theme;
    if (cur === "xuanye") {
      const back =
        S.appearance.quickReturn &&
        THEMES[S.appearance.quickReturn] &&
        S.appearance.quickReturn !== "xuanye"
          ? S.appearance.quickReturn
          : "xuanpaper";
      applyTheme(back);
    } else {
      S.appearance.quickReturn = cur && cur !== "auto" && cur !== "xuanye" ? cur : "xuanpaper";
      applyTheme("xuanye");
    }
    updateQuickThemeButton();
    if (modal && !modal.hidden) render();
  }
  function appearanceHTML() {
    const fs = Math.round((S.appearance.fontScale || 1) * 100),
      ls = Number(S.appearance.letterSpacing ?? 0.015);
    return `<section class="tjs-section on" data-sec="appearance"><h3 class="tjs-title">外观与主题</h3><p class="tjs-desc">主题负责色彩与层级；排版负责字号、字间距和正文气质。标题、篆印、卦象符号等专用字体仍保持原设计，避免全站一刀切后失去层次。</p>
  <div class="tjs-card"><h4>全站主题</h4>${themeGrid()}<p>页面右上角的太极按钮可在“玄夜墨青”和你最近使用的浅色主题之间快速切换。</p></div>
  <div class="tjs-card"><h4>字体与排版</h4>
    <div class="tjs-row"><div class="lab"><b>正文 / 界面字体</b><small>只使用网页安全的本机字体栈，不下载或嵌入第三方字体；设备缺少首选字体时会自动回退。</small></div><div class="tjs-control"><select id="tjsFontFamily">${Object.entries(
      FONTS,
    )
      .map(
        ([k, v]) =>
          `<option value="${k}"${S.appearance.fontFamily === k ? " selected" : ""}>${v.name} · ${v.desc}</option>`,
      )
      .join("")}</select></div></div>
    <div class="tjs-row"><div class="lab"><b>字号大小</b><small>调整全站继承字号。专业盘中的关键刻度仍保留固定尺寸，避免比例失真。</small></div><div class="tjs-control"><input id="tjsFont" type="range" min="85" max="130" step="5" value="${fs}"><span id="tjsFontVal">${fs}%</span><div class="tjs-typopresets"><button type="button" data-tjs-fs="90">紧凑</button><button type="button" data-tjs-fs="100">标准</button><button type="button" data-tjs-fs="110">舒展</button><button type="button" data-tjs-fs="120">大字</button></div></div></div>
    <div class="tjs-row"><div class="lab"><b>字间距</b><small>中文正文通常不需要过大的间距；0.01–0.04em 会比较雅致，较大数值更适合海报式标题。</small></div><div class="tjs-control"><input id="tjsLetter" type="range" min="0" max="0.08" step="0.005" value="${ls}"><span id="tjsLetterVal">${ls.toFixed(3)}em</span><div class="tjs-typopresets"><button type="button" data-tjs-ls="0">紧密</button><button type="button" data-tjs-ls=".015">标准</button><button type="button" data-tjs-ls=".03">雅致</button><button type="button" data-tjs-ls=".05">舒朗</button></div></div></div>
    <div class="tjs-font-preview"><b>天地有大美而不言 · 日月有明</b><span>甲辰 · 乙巳 · 山河清气 · 天机观象</span><small>当前：${FONTS[S.appearance.fontFamily]?.name || "雅宋"} · ${fs}% · 字距 ${ls.toFixed(3)}em</small></div>
  </div>
  <div class="tjs-card"><h4>阅读与动效</h4>
    <div class="tjs-row"><div class="lab"><b>减少动态效果</b><small>关闭大多数过渡与循环动画，适合低性能设备或希望界面更安静时。</small></div><div class="tjs-control"><label class="tjs-switch"><input id="tjsMotion" type="checkbox"${S.appearance.reduceMotion ? " checked" : ""}> 减少动效</label></div></div>
    <div class="tjs-row"><div class="lab"><b>星空背景</b><small>只控制全站背景星空显示；不会关闭天象、天机式内部的计算与图层。</small></div><div class="tjs-control"><label class="tjs-switch"><input id="tjsStars" type="checkbox"${S.appearance.stars !== false ? " checked" : ""}> 显示星空背景</label></div></div>
  </div></section>`;
  }
  function bellCheckbox(id, key, title, desc) {
    return `<label class="tjs-bellopt"><input id="${id}" type="checkbox"${BELL[key] ? " checked" : ""}><span><b>${title}</b><small>${desc}</small></span></label>`;
  }
  function remindersHTML() {
    return (BELL.reminders || []).length
      ? `<div class="tjs-reminders">${BELL.reminders.map((r, i) => `<div class="tjs-reminder"><span><b>${E(r.label || "提醒")}</b><br><small>${r.type === "shi" ? ZHI[r.shi] + "时 · 每天" : f2(r.h) + ":" + f2(r.m) + " · 每天"}</small></span><button data-tjs-rdel="${i}">删除</button></div>`).join("")}</div>`
      : '<div class="tjs-preview">还没有自定义提醒。</div>';
  }
  function bellHTML() {
    const hrs = [...Array(24).keys()]
      .map((h) => `<option value="${h}"${BELL.qFrom === h ? " selected" : ""}>${f2(h)}:00</option>`)
      .join("");
    const hrs2 = [...Array(24).keys()]
      .map((h) => `<option value="${h}"${BELL.qTo === h ? " selected" : ""}>${f2(h)}:00</option>`)
      .join("");
    return `<section class="tjs-section on" data-sec="bell"><h3 class="tjs-title">报时与提醒</h3><p class="tjs-desc">统一管理“播什么、什么时候播、怎么播”。页面必须保持打开；手机浏览器通常需要用户先点过页面，才允许声音与语音。</p>
  <div class="tjs-card"><h4>总开关与声音</h4>
    <div class="tjs-row"><div class="lab"><b>报时总开关</b><small>关闭后不会自动播报，但仍保留所有设置。</small></div><div class="tjs-control"><label class="tjs-switch"><input id="tjsBOn" type="checkbox"${BELL.on ? " checked" : ""}> ${BELL.on ? "已开启" : "已关闭"}</label></div></div>
    <div class="tjs-row"><div class="lab"><b>提示音</b><small>选择报时音色并设置统一音量。</small></div><div class="tjs-control"><select id="tjsBTimbre">${[
      ["bell", "钟"],
      ["qing", "磬"],
      ["wood", "木鱼"],
      ["bang", "梆"],
      ["qin", "琴"],
    ]
      .map(([k, n]) => `<option value="${k}"${BELL.timbre === k ? " selected" : ""}>${n}</option>`)
      .join(
        "",
      )}</select><input id="tjsBVol" type="range" min="5" max="100" value="${Math.round(BELL.vol * 100)}"><span>${Math.round(BELL.vol * 100)}%</span><button class="tjs-btn" id="tjsBTest">试听</button></div></div>
    <div class="tjs-row"><div class="lab"><b>中文语音</b><small>使用浏览器 Speech Synthesis 播报时辰、节气和提醒。</small></div><div class="tjs-control"><label class="tjs-switch"><input id="tjsBSpeech" type="checkbox"${BELL.speech ? " checked" : ""}> 语音播报</label><select id="tjsBRate"><option value=".82"${Math.abs(BELL.speechRate - 0.82) < 0.01 ? " selected" : ""}>舒缓</option><option value=".92"${Math.abs(BELL.speechRate - 0.92) < 0.01 ? " selected" : ""}>自然</option><option value="1.05"${Math.abs(BELL.speechRate - 1.05) < 0.01 ? " selected" : ""}>稍快</option><option value="1.18"${Math.abs(BELL.speechRate - 1.18) < 0.01 ? " selected" : ""}>快速</option></select><button class="tjs-btn" id="tjsBSpeechTest">试听语音</button></div></div>
    <div class="tjs-row"><div class="lab"><b>时辰报时方式</b><small>控制每次交时辰时的声音形式。</small></div><div class="tjs-control"><select id="tjsBMode"><option value="count"${BELL.mode === "count" ? " selected" : ""}>按时辰序数敲钟</option><option value="once"${BELL.mode === "once" ? " selected" : ""}>每时辰一响</option><option value="text"${BELL.mode === "text" ? " selected" : ""}>只弹文字</option></select></div></div>
  </div>
  <div class="tjs-card"><h4>播报内容</h4><div class="tjs-bellgrid">
    ${bellCheckbox("tjsBHour", "hour", "十二时辰交接", "子、丑、寅……每进入一个新时辰。")}
    ${bellCheckbox("tjsBImportant", "important", "四正时加强", "子、卯、午、酉播报更完整的传统说明。")}
    ${bellCheckbox("tjsBGeng", "geng", "夜间更鼓", "按一至五更提供夜间更鼓提示。")}
    ${bellCheckbox("tjsBTerm", "term", "二十四节气", "节气交接时提醒。")}
    ${bellCheckbox("tjsBSun", "sun", "日出 / 日落", "依据当前地点的太阳升落。")}
    ${bellCheckbox("tjsBMoon", "moon", "朔 / 望", "农历初一与十五的传统月相提醒。")}
    ${bellCheckbox("tjsBMorn", "morning", "每日晨报", "每日一次当日干支、值日与黄历宜忌摘要。")}
    ${bellCheckbox("tjsBAstro", "astro", "特殊天象", "按日检查日月食、流星雨与行星事件。")}
  </div></div>
  <div class="tjs-card"><h4>特殊天象</h4>
    <div class="tjs-row"><div class="lab"><b>检查范围</b><small>只做提前提示，具体可见性仍回“天象 / 星空”页面核对。</small></div><div class="tjs-control">
      <label class="tjs-switch"><input id="tjsAEcl" type="checkbox"${BELL.astroEclipse ? " checked" : ""}> 日月食</label>
      <label class="tjs-switch"><input id="tjsAMet" type="checkbox"${BELL.astroMeteor ? " checked" : ""}> 流星雨</label>
      <label class="tjs-switch"><input id="tjsAPla" type="checkbox"${BELL.astroPlanet ? " checked" : ""}> 行星事件</label>
    </div></div>
    <div class="tjs-row"><div class="lab"><b>每日检查时间</b><small>仅在页面保持打开时检查。</small></div><div class="tjs-control"><input id="tjsATime" type="time" value="${E(BELL.astroTime || "08:00")}">${[7, 2, 1, 0].map((d) => `<label class="tjs-switch"><input type="checkbox" data-tjs-alead="${d}"${(BELL.astroLead || []).includes(d) ? " checked" : ""}> ${d === 0 ? "当天" : d + "天前"}</label>`).join("")}</div></div>
  </div>
  <div class="tjs-card"><h4>勿扰与通知</h4>
    <div class="tjs-row"><div class="lab"><b>勿扰时段</b><small>普通报时只弹文字不发声；自定义提醒仍可按原规则提醒。</small></div><div class="tjs-control"><label class="tjs-switch"><input id="tjsBQ" type="checkbox"${BELL.quiet ? " checked" : ""}> 开启</label><select id="tjsBQf">${hrs}</select><span>至</span><select id="tjsBQt">${hrs2}</select></div></div>
    <div class="tjs-row"><div class="lab"><b>桌面通知</b><small>需要浏览器授权。通知权限属于浏览器 / 系统，不会上传设置内容。</small></div><div class="tjs-control"><label class="tjs-switch"><input id="tjsBNotify" type="checkbox"${BELL.notify ? " checked" : ""}> 同时发桌面通知</label><button class="tjs-btn" id="tjsNotifyAsk">${typeof Notification === "undefined" ? "当前环境不支持" : Notification.permission === "granted" ? "已允许通知" : "请求通知权限"}</button></div></div>
  </div>
  <div class="tjs-card"><h4>自定义提醒</h4>${remindersHTML()}<div class="tjs-rem-add"><select id="tjsRType"><option value="shi">按时辰</option><option value="clock">按钟点</option></select><select id="tjsRShi">${ZHI.map((z, i) => `<option value="${i}">${z}时</option>`).join("")}</select><input id="tjsRTime" type="time" value="08:00" hidden><input id="tjsRLabel" type="text" maxlength="18" placeholder="例如：午时小憩"><button class="tjs-btn" id="tjsRAdd">添加提醒</button></div></div>
  <div class="tjs-note">“当令经脉”等属于传统子午流注文化信息，不是医学测量或医疗建议。特殊天象是观测提醒，也不是异常事件预警。</div></section>`;
  }
  function timeHTML() {
    const solar = document.getElementById("solarChk")?.checked;
    const lon = document.getElementById("lon")?.value || "—",
      lat = document.getElementById("lat")?.value || "—";
    return `<section class="tjs-section on" data-sec="time"><h3 class="tjs-title">时间与显示</h3><p class="tjs-desc">这一版先集中展示全站正在使用的时间口径；专业术数自己的流派参数仍留在各模块内部，不塞进全局设置。</p>
  <div class="tjs-card"><h4>当前首页时间环境</h4>
    <div class="tjs-row"><div class="lab"><b>时辰边界</b><small>首页实时卡片按当前主界面的“真太阳时”选择决定。</small></div><div class="tjs-control"><span class="tjs-kbd">${solar ? "真太阳时" : "北京时间 / 标准时"}</span></div></div>
    <div class="tjs-row"><div class="lab"><b>当前位置</b><small>来自首页经纬度输入，用于日月升落与天象。</small></div><div class="tjs-control"><span class="tjs-kbd">${E(lon)}, ${E(lat)}</span></div></div>
    <div class="tjs-row"><div class="lab"><b>换日口径</b><small>八字、奇门、黄历存在不同历史口径，当前项目继续显式分层，不在全局设置强制改成一个答案。</small></div><div class="tjs-control"><button class="tjs-btn" id="tjsGoVerify">查看“校验与口径”</button></div></div>
  </div>
  <div class="tjs-note">后续若加入“默认地点、默认真太阳时、历史时区”，会进入本页；不会把紫微、奇门等专业门派参数混入全站设置。</div></section>`;
  }
  function dataHTML() {
    return `<section class="tjs-section on" data-sec="data"><h3 class="tjs-title">账号与数据</h3><p class="tjs-desc">账号负责人物档案云同步；全站设置第一阶段仍只保存在本机，避免账号系统刚上线就同时引入设置冲突合并。</p>
  <div class="tjs-card"><h4>我的档案</h4><div class="tjs-actions"><button class="tjs-btn primary" id="tjsAccount">打开“我的档案”</button><button class="tjs-btn" id="tjsExport">导出全站设置 JSON</button><button class="tjs-btn" id="tjsImport">导入设置 JSON</button><input type="file" id="tjsImportFile" accept=".json,application/json" hidden></div><p>导出内容包含主题与全局设置、报时偏好和自定义提醒；不包含账号 Bearer session token。</p></div>
  <div class="tjs-card"><h4>重置</h4><div class="tjs-actions"><button class="tjs-btn" id="tjsResetAppearance">仅重置外观</button><button class="tjs-btn" id="tjsResetBell">仅重置报时</button><button class="tjs-btn" id="tjsResetAll">重置全部全站设置</button></div><p>不会删除人物档案、关系网或云端账号。</p></div>
  </section>`;
  }
  function aboutHTML() {
    return `<section class="tjs-section on" data-sec="about"><h3 class="tjs-title">关于设置中心</h3><p class="tjs-desc">v183 把原先分散的主题按钮和报时弹窗收进一个稳定入口。</p>
  <div class="tjs-card"><h4>全局设置的边界</h4><p><b>放这里：</b>主题、字号、动效、声音、语音、通知、全站时间显示、账号与数据。</p><p><b>不放这里：</b>奇门转盘 / 飞盘、紫微流派、六爻取用、天机式图层等专业模块参数。它们仍属于各自工作台。</p></div>
  <div class="tjs-card"><h4>下一阶段可以继续加入</h4><p>主题自动按日出 / 日落切换、默认地点、语言、界面密度、低性能模式、键盘快捷键，以及账号稳定后的“设置云同步”。</p></div></section>`;
  }
  function sectionHTML() {
    if (tab === "bell") return bellHTML();
    if (tab === "time") return timeHTML();
    if (tab === "data") return dataHTML();
    if (tab === "about") return aboutHTML();
    return appearanceHTML();
  }
  function render() {
    const m = ensure(),
      b = m.querySelector("#tjsBody");
    if (!b) return;
    b.innerHTML = `<div class="tjs-head"><div><h2>设置</h2><p>全站外观 · 报时提醒 · 时间显示 · 账号与数据</p></div><button class="tjs-x" id="tjsClose">关闭 ✕</button></div><div class="tjs-body"><nav class="tjs-nav">${navs.map(([id, ic, n, d]) => `<button type="button" data-tjs-tab="${id}" class="${tab === id ? "on" : ""}"><i>${ic}</i><span><b>${n}</b><small>${d}</small></span></button>`).join("")}</nav><main class="tjs-main">${sectionHTML()}</main></div>`;
    bind(b);
  }
  function open(which = "appearance") {
    tab = navs.some((x) => x[0] === which) ? which : "appearance";
    ensure().hidden = false;
    document.body.style.overflow = "hidden";
    render();
  }
  function close() {
    if (modal) modal.hidden = true;
    document.body.style.overflow = "";
  }
  function changeBell(key, v) {
    BELL[key] = v;
    bellSave();
    if (key === "on") nwSetBell(!!v);
  }
  function bind(root) {
    root.querySelector("#tjsClose")?.addEventListener("click", close);
    root.querySelectorAll("[data-tjs-tab]").forEach(
      (x) =>
        (x.onclick = () => {
          tab = x.dataset.tjsTab;
          render();
        }),
    );
    root.querySelectorAll("[data-tjs-theme]").forEach(
      (x) =>
        (x.onclick = () => {
          applyTheme(x.dataset.tjsTheme);
          updateQuickThemeButton();
          render();
        }),
    );
    const family = root.querySelector("#tjsFontFamily");
    if (family)
      family.onchange = () => {
        S.appearance.fontFamily = family.value;
        applyAppearance();
        render();
      };
    const font = root.querySelector("#tjsFont");
    if (font)
      font.oninput = () => {
        S.appearance.fontScale = +font.value / 100;
        root.querySelector("#tjsFontVal").textContent = font.value + "%";
        applyAppearance();
      };
    root.querySelectorAll("[data-tjs-fs]").forEach(
      (x) =>
        (x.onclick = () => {
          S.appearance.fontScale = +x.dataset.tjsFs / 100;
          applyAppearance();
          render();
        }),
    );
    const letter = root.querySelector("#tjsLetter");
    if (letter)
      letter.oninput = () => {
        S.appearance.letterSpacing = +letter.value;
        root.querySelector("#tjsLetterVal").textContent = (+letter.value).toFixed(3) + "em";
        applyAppearance();
      };
    root.querySelectorAll("[data-tjs-ls]").forEach(
      (x) =>
        (x.onclick = () => {
          S.appearance.letterSpacing = +x.dataset.tjsLs;
          applyAppearance();
          render();
        }),
    );
    const mot = root.querySelector("#tjsMotion");
    if (mot)
      mot.onchange = () => {
        S.appearance.reduceMotion = mot.checked;
        applyAppearance();
      };
    const stars = root.querySelector("#tjsStars");
    if (stars)
      stars.onchange = () => {
        S.appearance.stars = stars.checked;
        applyAppearance();
      };
    const ck = (id, key) => {
      const x = root.querySelector("#" + id);
      if (x) x.onchange = () => changeBell(key, x.checked);
    };
    ck("tjsBOn", "on");
    ck("tjsBSpeech", "speech");
    ck("tjsBHour", "hour");
    ck("tjsBImportant", "important");
    ck("tjsBGeng", "geng");
    ck("tjsBTerm", "term");
    ck("tjsBSun", "sun");
    ck("tjsBMoon", "moon");
    ck("tjsBMorn", "morning");
    ck("tjsBAstro", "astro");
    ck("tjsAEcl", "astroEclipse");
    ck("tjsAMet", "astroMeteor");
    ck("tjsAPla", "astroPlanet");
    ck("tjsBQ", "quiet");
    ck("tjsBNotify", "notify");
    const tim = root.querySelector("#tjsBTimbre");
    if (tim)
      tim.onchange = () => {
        BELL.timbre = tim.value;
        bellSave();
      };
    const vol = root.querySelector("#tjsBVol");
    if (vol)
      vol.oninput = () => {
        BELL.vol = +vol.value / 100;
        bellSave();
        const s = vol.nextElementSibling;
        if (s) s.textContent = vol.value + "%";
      };
    const rate = root.querySelector("#tjsBRate");
    if (rate)
      rate.onchange = () => {
        BELL.speechRate = +rate.value;
        bellSave();
      };
    const mode = root.querySelector("#tjsBMode");
    if (mode)
      mode.onchange = () => {
        BELL.mode = mode.value;
        bellSave();
      };
    const qf = root.querySelector("#tjsBQf");
    if (qf)
      qf.onchange = () => {
        BELL.qFrom = +qf.value;
        bellSave();
      };
    const qt = root.querySelector("#tjsBQt");
    if (qt)
      qt.onchange = () => {
        BELL.qTo = +qt.value;
        bellSave();
      };
    root
      .querySelector("#tjsBTest")
      ?.addEventListener("click", () => bellPlay(bellStrikes({ kind: "hour", b: 2 }, BELL), BELL));
    root
      .querySelector("#tjsBSpeechTest")
      ?.addEventListener("click", () =>
        bellSpeak("天机盘语音播报已启用。现在为语音试听。", { cancel: true }),
      );
    root.querySelector("#tjsNotifyAsk")?.addEventListener("click", () => {
      try {
        Notification.requestPermission().then(() => {
          BELL.notify = Notification.permission === "granted";
          bellSave();
          render();
        });
      } catch (_) {
        toast("当前环境不支持桌面通知");
      }
    });
    const at = root.querySelector("#tjsATime");
    if (at)
      at.onchange = () => {
        BELL.astroTime = at.value || "08:00";
        bellSave();
      };
    root.querySelectorAll("[data-tjs-alead]").forEach(
      (x) =>
        (x.onchange = () => {
          BELL.astroLead = [...root.querySelectorAll("[data-tjs-alead]:checked")]
            .map((e) => +e.dataset.tjsAlead)
            .sort((a, b) => b - a);
          bellSave();
        }),
    );
    const rt = root.querySelector("#tjsRType");
    if (rt)
      rt.onchange = () => {
        const sh = rt.value === "shi";
        root.querySelector("#tjsRShi").hidden = !sh;
        root.querySelector("#tjsRTime").hidden = sh;
      };
    root.querySelector("#tjsRAdd")?.addEventListener("click", () => {
      const t = root.querySelector("#tjsRType").value,
        lb = (root.querySelector("#tjsRLabel").value || "").trim();
      let r;
      if (t === "shi") {
        const shi = +root.querySelector("#tjsRShi").value;
        r = { type: "shi", shi, label: lb || ZHI[shi] + "时提醒" };
      } else {
        const [h, m] = (root.querySelector("#tjsRTime").value || "08:00").split(":").map(Number);
        r = { type: "clock", h, m, label: lb || "提醒" };
      }
      BELL.reminders.push(r);
      bellSave();
      render();
      toast("已添加提醒");
    });
    root.querySelectorAll("[data-tjs-rdel]").forEach(
      (x) =>
        (x.onclick = () => {
          BELL.reminders.splice(+x.dataset.tjsRdel, 1);
          bellSave();
          render();
        }),
    );
    root.querySelector("#tjsGoVerify")?.addEventListener("click", () => {
      close();
      try {
        selectTab("verify");
      } catch (_) {}
    });
    root.querySelector("#tjsAccount")?.addEventListener("click", () => {
      close();
      window.TianjiAccount?.open?.();
    });
    root.querySelector("#tjsExport")?.addEventListener("click", () => exportSettings());
    const imp = root.querySelector("#tjsImport"),
      file = root.querySelector("#tjsImportFile");
    if (imp && file) {
      imp.onclick = () => file.click();
      file.onchange = async () => {
        const f = file.files?.[0];
        if (!f) return;
        try {
          importSettings(JSON.parse(await f.text()));
          toast("设置已导入");
          render();
        } catch (e) {
          toast("设置文件无法识别");
        }
        file.value = "";
      };
    }
    root.querySelector("#tjsResetAppearance")?.addEventListener("click", () => {
      S.appearance = clone(DEF.appearance);
      applyAppearance();
      render();
      toast("外观设置已重置");
    });
    root.querySelector("#tjsResetBell")?.addEventListener("click", () => {
      Object.assign(BELL, JSON.parse(JSON.stringify(BELL_DEF)));
      BELL.reminders = [];
      bellSave();
      nwSetBell(BELL.on);
      render();
      toast("报时设置已重置");
    });
    root.querySelector("#tjsResetAll")?.addEventListener("click", () => {
      if (!confirm("重置全站外观与报时设置？人物档案不会删除。")) return;
      S = clone(DEF);
      Object.assign(BELL, JSON.parse(JSON.stringify(BELL_DEF)));
      BELL.reminders = [];
      save();
      bellSave();
      applyAppearance();
      nwSetBell(BELL.on);
      render();
      toast("全站设置已重置");
    });
  }
  function exportSettings() {
    const data = {
      schema: "tianjipan.settings.export.v1",
      exportedAt: new Date().toISOString(),
      settings: S,
      bell: BELL,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }),
      a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "天机盘设置-" + new Date().toISOString().slice(0, 10) + ".json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 500);
  }
  function importSettings(o) {
    if (!o || typeof o !== "object") throw new Error("bad");
    if (o.settings) S = merge(DEF, o.settings);
    if (o.bell && typeof o.bell === "object") {
      Object.assign(BELL, o.bell);
      if (!Array.isArray(BELL.reminders)) BELL.reminders = [];
      bellSave();
      nwSetBell(BELL.on);
    }
    applyAppearance();
    save();
  }
  function installEntry() {
    const old = document.getElementById("themeBtn");
    if (old) {
      old.onclick = quickTheme;
      updateQuickThemeButton();
    }
    const bell = document.getElementById("lbBellSet");
    if (bell) {
      bell.title = "设置 · 报时与提醒";
      bell.setAttribute("aria-label", "打开报时与提醒设置");
      bell.onclick = () => open("bell");
    }
    /* “设置”保留为完整设置中心入口；太极按钮只负责玄夜快捷切换。 */
    const right = document.querySelector("#topnav .tn-right");
    if (right && !document.getElementById("tnSettings")) {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "tn-b";
      b.id = "tnSettings";
      b.textContent = "设置";
      b.onclick = () => open("appearance");
      right.insertBefore(b, right.querySelector("#tnAll") || right.firstChild);
    }
  }
  applyAppearance(false);
  try {
    mq = matchMedia("(prefers-color-scheme: light)");
    const f = () => {
      if (S.appearance.theme === "auto") applyTheme("auto", false);
    };
    if (mq.addEventListener) mq.addEventListener("change", f);
    else mq.addListener?.(f);
  } catch (_) {}
  ensure();
  installEntry();
  /* v184：入口只需在启动后的几个稳定节点补绑，不再监听整个 BODY 的所有 childList 变化。 */
  [300, 1100, 3000].forEach((ms) => setTimeout(installEntry, ms));
  window.addEventListener("tianji:homepage-ready", installEntry, { once: true });

  window.TianjiSettings = Object.freeze({
    version: "1.0.0",
    build: BUILD,
    open,
    close,
    get: () => clone(S),
    setTheme: (t) => {
      applyTheme(t);
      if (modal && !modal.hidden) render();
    },
    export: exportSettings,
    import: importSettings,
  });
  window.TianjiTheme = Object.freeze({
    version: "2.0.0",
    themes: clone(THEMES),
    fonts: clone(FONTS),
    current: () => S.appearance.theme,
    set: (t) => {
      applyTheme(t);
      updateQuickThemeButton();
    },
    quick: quickTheme,
    apply: applyAppearance,
  });
  window.TianjiBellSettings = Object.freeze({
    version: "1.0.0",
    open: () => open("bell"),
    get: () => JSON.parse(JSON.stringify(BELL)),
    save: bellSave,
  });

  try {
    const bv = document.getElementById("buildVersion");

    window.TianjiSystemV183 = {
      version: "v183",
      build: BUILD,
      settingsCenter: true,
      themeSystem: true,
      bellSettingsV3: true,
      baseline: "v182",
    };
  } catch (_) {}
})();
