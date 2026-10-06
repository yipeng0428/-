(() => {
  const TS = "2026-10-03 23:06:53";
  const q = (s) => document.querySelector(s);
  const clean = (s) => (s || "").replace(/\s+/g, " ").trim();
  const exact = {
    宜: "good",
    吉: "good",
    小吉: "good",
    大吉: "good",
    偏吉: "good",
    生: "good",
    相生: "good",
    可行: "good",
    已启用: "good",
    启用: "good",
    黄道: "good",
    吉神: "good",
    忌: "bad",
    凶: "bad",
    小凶: "bad",
    不吉: "bad",
    克: "bad",
    相克: "bad",
    受克: "bad",
    回头克: "bad",
    禁止: "bad",
    无用: "bad",
    不可行: "bad",
    黑道: "bad",
    凶煞: "bad",
    平: "neutral",
    中性: "neutral",
    平和: "neutral",
    比和: "neutral",
    慎: "bad",
    大凶: "dire",
    极凶: "dire",
    绝命: "dire",
    失效: "disabled",
    未启用: "disabled",
    停用: "disabled",
    关闭: "disabled",
    不可用: "disabled",
    禁用: "disabled",
  };
  const lead = [
    [/^(大凶|极凶)(?:[\s·:：()（）+-]|$)/, "dire"],
    [/^(失效|未启用|停用|关闭|不可用|禁用)(?:[\s·:：()（）+-]|$)/, "disabled"],
    [
      /^(忌|凶|小凶|不吉|克|相克|受克|回头克|禁止|无用|不可行|黑道|凶煞)(?:[\s·:：()（）+-]|$)/,
      "bad",
    ],
    [/^(平|中性|平和|比和)(?:[\s·:：()（）+-]|$)/, "neutral"],
    [/^(宜|吉|小吉|大吉|偏吉|生|相生|可行|已启用|启用|黄道|吉神)(?:[\s·:：()（）+-]|$)/, "good"],
  ];
  function toneOf(s) {
    const t = clean(s);
    if (!t || t.length > 28) return "";
    if (exact[t]) return exact[t];
    /* 同一句同时有正负语义（如“宜静不宜动”“宜/忌”）不自动染色，避免误导。 */
    const hasGood = /(^|[\s·:：])(?:宜|吉|生|可行|启用|黄道)/.test(t);
    const hasBad = /(?:不宜|忌|凶|克|禁止|无用|黑道)/.test(t);
    if (hasGood && hasBad) return "";
    for (const [re, k] of lead) if (re.test(t)) return k;
    return "";
  }
  function paint(el) {
    if (!el || el.nodeType !== 1) return;
    if (el.matches("input,select,textarea,svg,path,line,polyline,polygon,rect,circle")) return;
    if (el.children.length > 2) return;
    const k = toneOf(el.textContent);
    if (k) el.dataset.sem = k;
    else if (el.hasAttribute("data-sem-auto")) {
      delete el.dataset.sem;
      el.removeAttribute("data-sem-auto");
    }
    if (k) el.setAttribute("data-sem-auto", "1");
  }
  function scan(root) {
    if (!root) return;
    if (root.nodeType === 1) paint(root);
    const base = root.nodeType === 1 ? root : document;
    base
      .querySelectorAll?.("b,strong,em,i,span,small,button,.status,.badge,.tone,.pill,.tier,.tb")
      .forEach(paint);
  }
  let raf = 0,
    queue = [];
  function later(root) {
    queue.push(root);
    if (raf) return;
    raf = requestAnimationFrame(() => {
      raf = 0;
      const xs = queue.splice(0);
      xs.forEach(scan);
    });
  }
  scan(document);
  if (window.MutationObserver) {
    const mo = new MutationObserver((ms) => {
      for (const m of ms) {
        if (m.type === "characterData") later(m.target.parentElement);
        else
          m.addedNodes.forEach((n) => {
            if (n.nodeType === 1) later(n);
          });
      }
    });
    mo.observe(document.body, { subtree: true, childList: true, characterData: true });
  }
  window.TJSemantics = {
    version: "1.0",
    toneOf,
    apply: scan,
    classes: { good: "green", bad: "red", neutral: "brown", dire: "black", disabled: "gray" },
    meaning: {
      good: "可行 / 吉 / 宜 / 生 / 已启用",
      bad: "忌 / 克 / 禁止 / 不吉",
      neutral: "平 / 中性",
      dire: "大凶 / 极端警示",
      disabled: "失效 / 未启用 / 不可用",
    },
  };
  try {
    const bv = q("#buildVersion");

    const ft = document.querySelector("footer");
    if (ft && /版本\s*·/.test(ft.textContent || ""));
  } catch (_) {}
})();
