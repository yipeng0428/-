/* ===== v54 关系册/关系图：故障隔离、数据自检、兼容迁移、恢复入口 ===== */
(function () {
  const TS = "2026-10-03 21:32:35";
  function safeText(v) {
    return String(v == null ? "" : v);
  }
  function peopleBackup() {
    try {
      localStorage.setItem(
        "tianjipan.people.backup.v54",
        JSON.stringify({
          at: Date.now(),
          people: PPL.people,
          rels: PPL.rels,
          meId: PPL.meId,
          pos: PPL.pos,
          cur: PPL.cur,
        }),
      );
      return true;
    } catch (e) {
      return false;
    }
  }
  function healthHTML() {
    const h = pplHealthReport(),
      bad = h.invalid + h.badObj + h.orphan + h.badRel + h.duplicates;
    return `<div class="prb-health"><b>数据健康</b><span class="${bad ? "warn" : "ok"}">${bad ? "发现 " + bad + " 项待修复" : "正常"}</span><small>${h.people} 人 · ${h.relations} 条关系${h.invalid ? " · " + h.invalid + " 位出生时间无效" : ""}${h.orphan ? " · " + h.orphan + " 条孤立关系" : ""}</small><span class="sp"></span><button class="gbtn sm" id="prbHealthCheck">重新自检</button><button class="gbtn sm" id="prbRepair">备份并修复</button></div>`;
  }
  if (window.TJPeople) {
    window.TJPeople.apiVersion = "1.1";
    window.TJPeople.schemaVersion = 5;
    window.TJPeople.health = () => prbClone(pplHealthReport());
    window.TJPeople.backup = () => peopleBackup();
    window.TJPeople.repair = () => {
      peopleBackup();
      const r = pplRepairData(false);
      if (!pplSave()) return false;
      pplAfterChange();
      prbEmit("store:repair", r);
      return prbClone(r);
    };
    window.TJPeople.snapshot = () =>
      prbClone({
        schema: 5,
        api: "TJPeople/1.1",
        people: PPL.people,
        rels: PPL.rels,
        relations: PPL.rels,
        meId: PPL.meId,
        pos: PPL.pos,
        cur: PPL.cur,
        currentId: PPL.cur,
      });
  }
  /* 对关系分析做故障隔离：单个人/单条关系异常时保持整张图可用。 */
  const rawNetPair = netPair;
  netPair = function (a, b) {
    try {
      return rawNetPair(a, b);
    } catch (e) {
      console.warn("[关系分析降级]", a && a.id, b && b.id, e);
      return {
        cls: "mid",
        tags: ["资料待核"],
        verdict: "资料待核",
        T: 0,
        sAB: { score: 50, label: "资料待核" },
        sBA: { score: 50, label: "资料待核" },
        lines: [
          { k: "资料状态", t: "其中一位人物的出生资料无法完成派生计算；关系线仍保留。", tone: 0 },
        ],
      };
    }
  };
  /* 人物关系册：增加数据健康面板与错误隔离。 */
  const page53 = prbPage,
    bind53 = prbBind;
  prbPage = function () {
    try {
      const h = page53();
      return h.replace(
        '<div class="prb-grid">',
        healthHTML() +
          '<div class="prb-data-note"><div><b>主库唯一来源</b><small>所有模块统一读取 TJPeople，不再复制人物数据</small></div><div><b>损坏数据隔离</b><small>无效生日只暂停该人物派生，不阻断整个人物册</small></div><div><b>关系强外键</b><small>自动清理孤立引用与重复关系</small></div></div><div class="prb-grid">',
      );
    } catch (e) {
      console.error("[人物关系册渲染]", e);
      return `<div class="panel blk"><h3 class="sec">人物关系册</h3><div class="net-recover"><b>人物主库需要修复</b><span class="dim sm">${esc(safeText(e.message || e))}</span><div class="row3"><button class="gbtn" id="prbRepairOnly">备份并自动修复</button></div></div></div>`;
    }
  };
  prbBind = function () {
    try {
      bind53();
    } catch (e) {
      console.error("[人物关系册绑定]", e);
    }
    const chk = $("#prbHealthCheck");
    if (chk)
      chk.onclick = () => {
        const h = pplHealthReport();
        toast(
          h.ok
            ? "人物主库检查正常"
            : `发现 ${h.invalid + h.badObj + h.orphan + h.badRel + h.duplicates} 项待处理`,
        );
        refRender("people");
      };
    const rep = $("#prbRepair");
    if (rep)
      rep.onclick = () => {
        peopleBackup();
        const r = pplRepairData(false);
        if (!pplSave()) return false;
        pplAfterChange();
        toast(`修复完成：${r.people} 人 · ${r.relations} 条关系`);
        refRender("people");
      };
    const ro = $("#prbRepairOnly");
    if (ro)
      ro.onclick = () => {
        peopleBackup();
        pplRepairData(false);
        if (!pplSave()) return false;
        refRender("people");
      };
  };
  REF_PANES.people = prbPage;
  REF_BIND.people = prbBind;
  REF_STATIC.add("people");
  /* 人物关系册/关系图使用独立宽幅工作区，避免被左侧巨盘挤压。 */
  try {
    const _selectTabPeople55 = selectTab;
    selectTab = function (id, scroll) {
      document.body.classList.toggle("people-focus-mode", id === "people" || id === "net");
      return _selectTabPeople55(id, scroll);
    };
    const active = $(".tab.on");
    document.body.classList.toggle(
      "people-focus-mode",
      !!(active && (active.dataset.tab === "people" || active.dataset.tab === "net")),
    );
  } catch (e) {
    console.error("[人物关系册宽幅模式]", e);
  }
  /* 关系图：整页分区容错。家庭分析或某条关系失败，不再让整个页面变成“内部可视化出错”。 */
  const rawRenderNet = renderNet;
  renderNet = function () {
    const pane = $("#pane-net");
    if (!pane) return;
    pane.dataset.built = "1";
    try {
      pplRepairData(false);
      const D = netData();
      if (!D.P.length) {
        const inv =
          D.invalid && D.invalid.length
            ? `<div class="net-invalid">关系册中有 ${D.invalid.length} 位人物的出生时间暂时无法计算。请到“人物关系册”修正出生时间；这些记录不会被删除。</div>`
            : "";
        pane.innerHTML = `<div class="panel blk"><h3 class="sec">关系图</h3><p class="rt">关系图读取统一人物主库。至少需要一位出生时间有效的人物才能生成命理关系节点。</p>${inv}<div class="row3"><button class="gbtn" id="netGoBook">打开人物关系册</button><button class="gbtn sm" id="netRepair">自检修复</button></div></div>${netManageHTML(D)}`;
        $("#netGoBook").onclick = () => selectTab("people", true);
        $("#netRepair").onclick = () => {
          peopleBackup();
          pplRepairData(true);
          renderNet();
        };
        netBindManage();
        return;
      }
      if (
        NET.sel &&
        ((NET.sel.t === "p" && !D.byId[NET.sel.id]) ||
          (NET.sel.t === "e" && !D.rels.some((r) => r.id === NET.sel.id)))
      )
        NET.sel = null;
      let lay;
      try {
        lay = netLayoutNow(D);
      } catch (e) {
        console.error("[关系图布局]", e);
        NET.layout = "circle";
        lay = pplLayout(D.P, D.rels, "circle");
      }
      let graph, detail, family, manage;
      try {
        graph = netInner(D, lay);
      } catch (e) {
        console.error("[关系图SVG]", e);
        NET.gs = false;
        NET.tags = false;
        graph = netInner(D, lay);
      }
      try {
        detail = netDetailHTML(D);
      } catch (e) {
        console.error("[关系详情]", e);
        detail = '<div class="dim sm">当前详情计算失败，可切换人物后继续使用关系图。</div>';
      }
      try {
        family = netFamilyHTML(D);
      } catch (e) {
        console.error("[家庭汇总]", e);
        family =
          '<div class="net-recover"><b>家庭汇总暂不可用</b><span class="dim sm">个别人物资料无法完成五行汇总，但人物节点与关系线仍可继续使用。</span></div>';
      }
      try {
        manage = netManageHTML(D);
      } catch (e) {
        console.error("[关系管理]", e);
        manage =
          '<div class="panel blk"><p class="note">关系管理区暂时无法生成。可到“人物关系册”继续管理人物与关系。</p></div>';
      }
      const inv =
        D.invalid && D.invalid.length
          ? `<div class="net-invalid">已隔离 ${D.invalid.length} 位出生资料无效的人物；修正资料后会自动重新加入关系图。</div>`
          : "";
      pane.innerHTML = `<div class="panel blk netpanel"><h3 class="sec">关系图 · ${D.P.length} 人 ${D.rels.length} 条关系</h3>${inv}
       <div class="net-tools"><label class="sm dim">布局<select id="netLay"><option value="tree"${NET.layout === "tree" ? " selected" : ""}>家谱分层</option><option value="circle"${NET.layout === "circle" ? " selected" : ""}>环形</option></select></label>
        <label class="chk sm"><input type="checkbox" id="netGs"${NET.gs ? " checked" : ""}> 五行生克箭头</label><label class="chk sm"><input type="checkbox" id="netTags"${NET.tags ? " checked" : ""}> 合冲标记</label><label class="chk sm"><input type="checkbox" id="netAll"${NET.all ? " checked" : ""}${NET.gs ? "" : " disabled"}> 显示所有人两两生克</label><button class="gbtn sm" id="netReset">重置位置</button><button class="gbtn sm" id="netGoBook2">人物关系册</button></div>
       <div class="net-wrap"><svg id="netSvg" class="netsvg" viewBox="0 0 ${lay.W} ${lay.H}" role="group" aria-label="人物关系图">${graph}</svg>
        <div class="net-legend"><span><i class="lg good"></i>相合相扶</span><span><i class="lg mid"></i>平和</span><span><i class="lg bad"></i>有摩擦</span><span><i class="lg kin"></i>实线亲属</span><span><i class="lg soc"></i>虚线社会关系</span>${NET.gs ? '<span><i class="lg sheng"></i>生 →</span><span><i class="lg ke"></i>克 →</span>' : ""}</div></div>
       <div class="net-detail" id="netDetail">${detail}</div></div>
       <div class="panel blk"><h3 class="sec">家庭整体 · 五行与扶持</h3>${family}</div>${manage}`;
      try {
        netBindAll(D, lay);
      } catch (e) {
        console.error("[关系图交互绑定]", e);
      }
      const gb = $("#netGoBook2");
      if (gb) gb.onclick = () => selectTab("people", true);
    } catch (e) {
      console.error("[关系图主渲染]", e);
      pane.innerHTML = `<div class="panel blk"><h3 class="sec">关系图</h3><div class="net-recover"><b>关系图已进入安全模式</b><span class="dim sm">${esc(safeText(e.message || e))}</span><span class="dim sm">人物原始数据仍保留。可先自动修复索引与孤立关系，再重新生成。</span><div class="row3"><button class="gbtn" id="netSafeRepair">备份并修复</button><button class="gbtn sm" id="netSafeBook">打开人物关系册</button></div></div></div>`;
      const r = $("#netSafeRepair"),
        b = $("#netSafeBook");
      if (r)
        r.onclick = () => {
          peopleBackup();
          pplRepairData(true);
          renderNet();
        };
      if (b) b.onclick = () => selectTab("people", true);
    }
  };
  /* 统一刷新：一个视图报错不影响另一个视图。 */
  pplRefreshViews = function () {
    try {
      if ($("#pane-net") && $("#pane-net").dataset.built) renderNet();
    } catch (e) {
      console.error("[关系图刷新]", e);
    }
    try {
      dialPeopleRender();
    } catch (e) {
      console.error("[巨盘人物图层刷新]", e);
    }
    try {
      if ($("#pane-people") && $("#pane-people").dataset.built && !REF_BUSY.people)
        refRender("people");
    } catch (e) {
      console.error("[人物关系册刷新]", e);
    }
  };
  try {
    pplRepairData(false);
    if (!pplSave()) return false;
    pplBook();
    pplState();
  } catch (e) {
    console.error("[v54人物主库启动]", e);
  }
  try {
    const bv = document.getElementById("buildVersion");

    const ft = document.querySelector("footer");
    if (ft) {
      const t = ft.textContent || "";
      if (/版本\s*·/.test(t));
      else ft.insertAdjacentHTML("beforeend", "<br>版本 · " + TS);
    }
  } catch (_) {}
})();
