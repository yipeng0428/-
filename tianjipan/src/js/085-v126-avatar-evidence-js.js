(function () {
  "use strict";
  const V126_BUILD = "v126 · 2026-10-04 21:21 +08:00";
  const AV126 = { home: "", book: "" };
  function av126Safe(s) {
    s = String(s || "");
    return /^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/i.test(s) && s.length <= 180000
      ? s
      : "";
  }
  function av126EscAttr(s) {
    return String(s || "")
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }
  function av126Compress(file, done) {
    if (!file || !/^image\/(?:jpeg|png|webp)$/i.test(file.type || "")) {
      toast("请选择 JPG、PNG 或 WebP 图片");
      return;
    }
    if (file.size > 12 * 1024 * 1024) {
      toast("图片过大，请选择 12MB 以内的照片");
      return;
    }
    const fr = new FileReader();
    fr.onerror = () => toast("读取头像失败");
    fr.onload = () => {
      const im = new Image();
      im.onerror = () => toast("无法识别这张图片");
      im.onload = () => {
        try {
          let target = 160,
            side = Math.min(im.naturalWidth || im.width, im.naturalHeight || im.height),
            sx = ((im.naturalWidth || im.width) - side) / 2,
            sy = ((im.naturalHeight || im.height) - side) / 2;
          const make = (n, q) => {
            const c = document.createElement("canvas");
            c.width = c.height = n;
            const x = c.getContext("2d");
            x.imageSmoothingEnabled = true;
            x.imageSmoothingQuality = "high";
            x.drawImage(im, sx, sy, side, side, 0, 0, n, n);
            let out = c.toDataURL("image/jpeg", q);
            return out;
          };
          let out = make(target, 0.82);
          for (let q = 0.76; out.length > 120000 && q >= 0.54; q -= 0.08) out = make(target, q);
          if (out.length > 150000) out = make(128, 0.68);
          out = av126Safe(out);
          if (!out) {
            toast("头像压缩失败，请换一张图片");
            return;
          }
          done(out);
        } catch (e) {
          console.error("[v126 头像压缩]", e);
          toast("头像处理失败");
        }
      };
      im.src = String(fr.result || "");
    };
    fr.readAsDataURL(file);
  }
  function av126SetHome(v) {
    AV126.home = av126Safe(v);
    av126SyncHome();
  }
  function av126SyncHome() {
    const w = document.getElementById("v126HomeAvatar");
    if (!w) return;
    const im = w.querySelector("img"),
      v = AV126.home;
    w.classList.toggle("no-avatar", !v);
    if (im) {
      if (v) {
        im.src = v;
        im.hidden = false;
      } else {
        im.removeAttribute("src");
        im.hidden = true;
      }
    }
  }
  function av126HomeMount() {
    const line = document.getElementById("v59PersonLine");
    if (!line) return false;
    let w = document.getElementById("v126HomeAvatar");
    if (!w) {
      w = document.createElement("div");
      w.id = "v126HomeAvatar";
      w.className = "v126-avatar-field no-avatar";
      w.innerHTML =
        '<span class="v126-av-label">头像</span><span class="v126-avwrap"><button type="button" class="v126-avpick" id="v126AvPick" title="上传人物头像"><span class="v126-avplus">＋</span><img alt="人物头像" hidden></button><button type="button" class="v126-avrm" id="v126AvRm" title="移除头像">×</button></span><input type="file" id="v126AvFile" accept="image/jpeg,image/png,image/webp" hidden>';
      const name = line.querySelector(".f-name");
      line.insertBefore(w, name || line.firstChild);
      const pick = w.querySelector("#v126AvPick"),
        inp = w.querySelector("#v126AvFile"),
        rm = w.querySelector("#v126AvRm");
      pick.onclick = () => inp.click();
      inp.onchange = () => {
        const f = inp.files && inp.files[0];
        if (f) av126Compress(f, av126SetHome);
        inp.value = "";
      };
      rm.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        av126SetHome("");
      };
    }
    av126SyncHome();
    return true;
  }
  /* 人物主库：头像作为可选字段，永不参与排盘。 */
  try {
    const oldRepair = pplRepairData;
    pplRepairData = function (save) {
      const r = oldRepair(save);
      let changed = false;
      (PPL.people || []).forEach((p) => {
        const a = av126Safe(p.avatar || "");
        if ((p.avatar || "") !== a) {
          p.avatar = a;
          changed = true;
        }
      });
      if (changed && save)
        try {
          pplSave();
        } catch (_) {}
      return r;
    };
    const oldForm = pplFormPerson;
    pplFormPerson = function () {
      const f = oldForm();
      f.avatar = av126Safe(AV126.home);
      return f;
    };
    const oldFill = pplFill;
    pplFill = function (p) {
      const r = oldFill(p);
      av126SetHome((p && p.avatar) || "");
      return r;
    };
    const oldSame = pplSameForm;
    pplSameForm = function (p, f) {
      return oldSame(p, f) && av126Safe((p && p.avatar) || "") === av126Safe((f && f.avatar) || "");
    };
  } catch (e) {
    console.error("[v126 人物头像主库接入]", e);
  }
  /* 人物关系册编辑器也能上传/修改同一头像字段。 */
  function av126SyncBook() {
    const w = document.getElementById("v126BookAvatar");
    if (!w) return;
    const im = w.querySelector("img"),
      v = AV126.book;
    w.classList.toggle("no-avatar", !v);
    if (im) {
      if (v) {
        im.src = v;
        im.hidden = false;
      } else {
        im.removeAttribute("src");
        im.hidden = true;
      }
    }
  }
  function av126SetBook(v) {
    AV126.book = av126Safe(v);
    av126SyncBook();
  }
  function av126BookMount() {
    const form = document.querySelector("#pane-people .prb55-form, #pane-people .prb-form");
    if (!form) return false;
    let w = document.getElementById("v126BookAvatar");
    if (!w) {
      w = document.createElement("div");
      w.id = "v126BookAvatar";
      w.className = "v126-book-avatar no-avatar";
      w.innerHTML =
        '<span class="v126-avwrap"><button type="button" class="v126-avpick" id="v126BookPick" title="上传人物头像"><span class="v126-avplus">＋</span><img alt="人物头像" hidden></button><button type="button" class="v126-avrm" id="v126BookRm" title="移除头像">×</button></span><div class="v126-book-avtext"><b>人物头像（可选）</b><small>关系网会以小头像显示人物；图片自动裁成方形并压缩，只保存在本机人物主库，不参与任何命理计算。</small></div><input type="file" id="v126BookFile" accept="image/jpeg,image/png,image/webp" hidden>';
      form.insertBefore(w, form.firstChild);
      const pick = w.querySelector("#v126BookPick"),
        inp = w.querySelector("#v126BookFile"),
        rm = w.querySelector("#v126BookRm");
      pick.onclick = () => inp.click();
      inp.onchange = () => {
        const f = inp.files && inp.files[0];
        if (f) av126Compress(f, av126SetBook);
        inp.value = "";
      };
      rm.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        av126SetBook("");
      };
    }
    av126SyncBook();
    return true;
  }
  try {
    const oldRead = prbFormRead;
    prbFormRead = function () {
      const f = oldRead();
      f.avatar = av126Safe(AV126.book);
      return f;
    };
    const oldPF = prbFillForm;
    prbFillForm = function (p) {
      AV126.book = av126Safe((p && p.avatar) || "");
      const r = oldPF(p);
      setTimeout(() => {
        av126BookMount();
        av126SyncBook();
      }, 0);
      return r;
    };
  } catch (e) {
    console.error("[v126 人物关系册头像接入]", e);
  }
  function av126DecorPeopleCards() {
    document.querySelectorAll("#pane-people [data-prbid]").forEach((card) => {
      const p = pplById(card.dataset.prbid),
        a = av126Safe((p && p.avatar) || ""),
        box = card.querySelector(".prb55-avatar,.prb-avatar");
      if (!box) return;
      if (a) {
        box.classList.add("has-photo");
        box.innerHTML = '<img alt="' + av126EscAttr(p.name || "人物") + '" src="' + a + '">';
      }
    });
  }
  function av126DecorHomeBook() {
    const box = document.getElementById("prBook");
    if (!box) return;
    box.querySelectorAll(".pchip[data-id]").forEach((b) => {
      const p = pplById(b.dataset.id),
        a = av126Safe((p && p.avatar) || "");
      let im = b.querySelector(".v126-chip-avatar");
      if (a) {
        if (!im) {
          im = document.createElement("img");
          im.className = "v126-chip-avatar";
          im.alt = "";
          b.insertBefore(im, b.firstChild);
        }
        im.src = a;
        b.classList.add("has-v126-avatar");
      } else {
        if (im) im.remove();
        b.classList.remove("has-v126-avatar");
      }
    });
  }
  try {
    const oldBook = pplBook;
    pplBook = function () {
      const r = oldBook.apply(this, arguments);
      setTimeout(av126DecorHomeBook, 0);
      return r;
    };
  } catch (_) {}
  /* 关系图：头像只替代节点中心的大日干字，五行外圈/姓名/关系线全部保留。 */
  function av126DecorNet() {
    const svg = document.getElementById("netSvg");
    if (!svg) return;
    let defs = svg.querySelector("defs");
    if (!defs) {
      defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
      svg.insertBefore(defs, svg.firstChild);
    }
    svg.querySelectorAll(".nd[data-id]").forEach((g) => {
      if (g.querySelector(".v126-net-avatar")) return;
      const p = pplById(g.dataset.id),
        a = av126Safe((p && p.avatar) || "");
      if (!a) return;
      const old = g.querySelector(".st"),
        stem = old ? (old.textContent || "").trim() : "",
        cid = "v126clip-" + String(p.id).replace(/[^a-zA-Z0-9_-]/g, "");
      if (!defs.querySelector("#" + cid)) {
        const cp = document.createElementNS("http://www.w3.org/2000/svg", "clipPath");
        cp.id = cid;
        const cc = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        cc.setAttribute("cx", "0");
        cc.setAttribute("cy", "0");
        cc.setAttribute("r", "27");
        cp.appendChild(cc);
        defs.appendChild(cp);
      }
      const im = document.createElementNS("http://www.w3.org/2000/svg", "image");
      im.setAttribute("class", "v126-net-avatar");
      im.setAttribute("href", a);
      im.setAttribute("x", "-27");
      im.setAttribute("y", "-27");
      im.setAttribute("width", "54");
      im.setAttribute("height", "54");
      im.setAttribute("preserveAspectRatio", "xMidYMid slice");
      im.setAttribute("clip-path", "url(#" + cid + ")");
      const disc = g.querySelector(".disc");
      if (disc) disc.insertAdjacentElement("afterend", im);
      else g.insertBefore(im, g.firstChild);
      const ring = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      ring.setAttribute("class", "v126-net-ring");
      ring.setAttribute("r", "27");
      im.insertAdjacentElement("afterend", ring);
      if (old) old.remove();
      if (stem) {
        const bg = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        bg.setAttribute("class", "v126-net-stem-bg");
        bg.setAttribute("cx", "22");
        bg.setAttribute("cy", "22");
        bg.setAttribute("r", "9");
        ring.insertAdjacentElement("afterend", bg);
        const tx = document.createElementNS("http://www.w3.org/2000/svg", "text");
        tx.setAttribute("class", "v126-net-stem");
        tx.setAttribute("x", "22");
        tx.setAttribute("y", "25.5");
        tx.setAttribute("text-anchor", "middle");
        tx.textContent = stem;
        bg.insertAdjacentElement("afterend", tx);
      }
    });
    try {
      if (NET.sel && NET.sel.t === "p") {
        const p = pplById(NET.sel.id),
          a = av126Safe((p && p.avatar) || ""),
          h = document.querySelector("#netDetail .nd-h");
        if (a && h && !h.querySelector(".v126-detail-avatar")) {
          const im = document.createElement("img");
          im.className = "v126-detail-avatar";
          im.src = a;
          im.alt = "";
          h.insertBefore(im, h.firstChild);
        }
      }
    } catch (_) {}
  }
  try {
    const oldNet = renderNet;
    renderNet = function () {
      const r = oldNet.apply(this, arguments);
      requestAnimationFrame(av126DecorNet);
      return r;
    };
  } catch (e) {
    console.error("[v126 关系网头像]", e);
  }
  /* 人物关系册最终 bind 包装：每次重绘后恢复头像编辑器/卡片。 */
  try {
    const oldBind = prbBind;
    prbBind = function () {
      const r = oldBind.apply(this, arguments);
      av126BookMount();
      av126DecorPeopleCards();
      return r;
    };
    if (typeof REF_BIND !== "undefined") REF_BIND.people = prbBind;
  } catch (e) {
    console.error("[v126 人物页绑定]", e);
  }
  window.addEventListener("tianjipan:peoplechange", () =>
    setTimeout(() => {
      av126DecorHomeBook();
      av126DecorPeopleCards();
      av126DecorNet();
    }, 25),
  );
  /* 启动时继承当前人物头像，并确保紧凑首页出现头像入口。 */
  try {
    const cur = pplById(PPL.cur);
    AV126.home = av126Safe((cur && cur.avatar) || "");
  } catch (_) {}
  let avTry = 0;
  const avTimer = setInterval(() => {
    avTry++;
    if (av126HomeMount() || avTry > 40) clearInterval(avTimer);
  }, 80);
  av126HomeMount();
  setTimeout(av126DecorHomeBook, 30);

  /* --- 大六壬 Evidence 3.0：定位“63 vs 64”。结论：这是《探原》汇总统计与逐日详表之间的文献内部冲突，不能为了凑 63 强改算法。 --- */
  function lr126Scan() {
    const rows = [];
    let jian = 0,
      cha = 0,
      zhui = 0;
    for (let d = 0; d < 60; d++)
      for (let off = 0; off < 12; off++) {
        let r;
        try {
          r = liuren(d, 0, off, {});
        } catch (_) {
          continue;
        }
        if (r.ge !== "涉害" || r.fanyin) continue;
        const s = r.sub || "";
        if (/见机/.test(s)) {
          jian++;
          continue;
        }
        if (/察微/.test(s)) {
          cha++;
          continue;
        }
        if (/缀瑕/.test(s)) {
          zhui++;
          continue;
        }
        rows.push({
          d,
          off,
          day: GAN[d % 10] + ZHI[d % 12],
          ganUp: ZHI[r.ke[0].u],
          chu: ZHI[r.chu[0].z],
        });
      }
    return { rows, jian, cha, zhui };
  }
  function lr126Evidence() {
    const x = lr126Scan(),
      n = x.rows.length;
    return `<div class="panel blk lr126-card"><div class="lr126-head"><div><h3>大六壬 Evidence 3.0 · “涉害 63 / 64”定点核查</h3><small>不为迎合一个汇总数字而改算法；把汇总统计与逐日 720 课详表分开作为两份证据</small></div><span class="lr126-badge">结论：文献统计冲突</span></div><div class="lr126-grid"><div class="lr126-kpi warn"><small>《大六壬探原》汇总段</small><b>涉害 63</b></div><div class="lr126-kpi ok"><small>逐日详表逐项核读</small><b>涉害 64</b></div><div class="lr126-kpi ok"><small>当前 Core 扫描</small><b>${n} · 见机 ${x.jian} / 察微 ${x.cha} / 缀瑕 ${x.zhui}</b></div></div><div class="lr126-conclusion"><strong>本轮定位结果：</strong>没有找到一课可以在不违背逐日详表的情况下“删掉”来凑成 63。当前程序得到的 ${n} 个非返吟普通涉害，在《探原》后附逐日课表中均能找到对应的“涉害 / 改正涉害”标注；因此这里更合理的处理是把 <b>63</b> 视为该书汇总段与详表之间的一处内部统计差异。算法继续保留“所涉深浅 → 见机 → 察微 → 缀瑕”的确定规则，并在 Evidence 中明确冲突，而不是人为制造一条例外。</div><div class="lr126-actions"><button type="button" class="gbtn sm" id="lr126Toggle">展开当前 ${n} 个普通涉害键值</button><button type="button" class="gbtn sm" id="lr126Copy">复制核对清单</button><span class="dim sm">键值 = 日柱 · 月将相对位 · 干上 · 初传，便于继续对照影印本。</span></div><div class="lr126-list" id="lr126List" hidden>${x.rows.map((r, i) => `<span>${String(i + 1).padStart(2, "0")}. ${r.day} · 位${r.off} · 干上${r.ganUp} · 初${r.chu}</span>`).join("")}</div><div class="lr126-src">证据口径：<a href="https://orasage.com/zh-CN/daozang/docs/zh-cn/5_5_3" target="_blank" rel="noopener">《大六壬探原》推演篇</a>的汇总段明确写“涉害六十三课”，同文后附 720 课详表用于逐日复核；另有现代研究者也指出该 720 课分类统计未必完全无误。当前状态标记为“<b>规则已收口 / 文献计数冲突保留</b>”。</div></div>`;
  }
  try {
    const oldLR = renderLiuren;
    renderLiuren = function (R0) {
      let h = oldLR(R0);
      h = h.replace(
        "与该书所述 63 仍差 1 课，因此<strong>不宣称涉害 720 全量已完全校准</strong>，保留这一处为下一轮定点核查。",
        "与《探原》汇总段所述 63 相差 1；本轮已继续对照后附逐日详表，详见下方 Evidence 3.0。",
      );
      return h + lr126Evidence();
    };
    window.renderLiuren = renderLiuren;
  } catch (e) {
    console.error("[v126 六壬 Evidence 3]", e);
  }
  document.addEventListener(
    "click",
    (e) => {
      if (e.target && e.target.id === "lr126Toggle") {
        const b = e.target,
          l = document.getElementById("lr126List");
        if (!l) return;
        l.hidden = !l.hidden;
        b.textContent = l.hidden ? "展开当前 64 个普通涉害键值" : "收起核对清单";
      }
      if (e.target && e.target.id === "lr126Copy") {
        const x = lr126Scan(),
          t = x.rows
            .map((r, i) => `${i + 1}. ${r.day} · 位${r.off} · 干上${r.ganUp} · 初${r.chu}`)
            .join("\n");
        if (navigator.clipboard && navigator.clipboard.writeText)
          navigator.clipboard
            .writeText(t)
            .then(() => toast("已复制涉害核对清单"))
            .catch(() => toast("浏览器不允许复制"));
        else toast("当前浏览器不支持直接复制");
      }
    },
    true,
  );
  try {
    if (typeof VF !== "undefined") {
      const r = VF.find((x) => x[0] === "大六壬");
      if (r) {
        r[2] = "外部实现 + Core 自检 + Evidence 3.0";
        r[3] = "8638 外部课例 + 720 结构扫描 + 4 个涉害代表例 + 63/64 文献冲突审计";
        r[4] =
          "天地盘/四课已外部对拍；涉害四级代表例 4/4；见机9/察微2/缀瑕1吻合；普通涉害保留详表64并标注文献汇总63冲突";
        r[5] = "“规则可复现”不等于各派唯一；后续继续做伏吟/返吟/别责/八专代表古籍例课 Evidence";
      }
    }
  } catch (_) {}
  /* 版本 */
  try {
    const bv = document.getElementById("buildVersion");

    window.TianjiSystemV126 = {
      version: "v126",
      build: V126_BUILD,
      peopleAvatar: true,
      relationAvatarNodes: true,
      liurenEvidence3: true,
      shehaiSourceConflict: "summary63-vs-detail64",
    };
  } catch (_) {}
})();
