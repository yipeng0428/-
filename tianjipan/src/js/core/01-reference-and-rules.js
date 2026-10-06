const PPL_ROLES = [
  { k: "parent", n: "父母", inv: "child", kind: "kin", dir: 1, gen: 1 },
  { k: "child", n: "子女", inv: "parent", kind: "kin", dir: 1, gen: -1 },
  { k: "spouse", n: "配偶", inv: "spouse", kind: "kin", gen: 0 },
  { k: "sibling", n: "兄弟姐妹", inv: "sibling", kind: "kin", gen: 0 },
  { k: "grand", n: "祖辈", inv: "grandchild", kind: "kin", dir: 1, gen: 2 },
  { k: "grandchild", n: "孙辈", inv: "grand", kind: "kin", dir: 1, gen: -2 },
  { k: "relative", n: "其他亲属", inv: "relative", kind: "kin", gen: 0 },
  { k: "lover", n: "恋人", inv: "lover", kind: "soc", gen: 0 },
  { k: "friend", n: "朋友", inv: "friend", kind: "soc", gen: 0 },
  { k: "classmate", n: "同学", inv: "classmate", kind: "soc", gen: 0 },
  { k: "colleague", n: "同事", inv: "colleague", kind: "soc", gen: 0 },
  { k: "boss", n: "上级", inv: "sub", kind: "soc", dir: 1, gen: 0 },
  { k: "sub", n: "下级", inv: "boss", kind: "soc", dir: 1, gen: 0 },
  { k: "teacher", n: "老师", inv: "student", kind: "soc", dir: 1, gen: 0 },
  { k: "student", n: "学生", inv: "teacher", kind: "soc", dir: 1, gen: 0 },
  { k: "partner", n: "合伙人", inv: "partner", kind: "soc", gen: 0 },
  { k: "other", n: "其他", inv: "other", kind: "soc", gen: 0 },
];
const PPL_ROLE = Object.fromEntries(PPL_ROLES.map((r) => [r.k, r]));
const PPL_NORM = { child: "parent", grandchild: "grand", sub: "boss", student: "teacher" }; // 存储时统一为“前者为尊/长”的方向
function pplSanHm(h) {
  if (!h || typeof h !== "object") return null;
  const pct = Number(h.pct);
  if (!Number.isFinite(pct) || pct < 0 || pct > 100) return null;
  return {
    mode: h.mode === "marry" || Object.hasOwn(HH_KIND, h.mode) ? h.mode : "marry",
    pct,
    score: Number.isFinite(Number(h.score)) ? Number(h.score) : 0,
    lv: String(h.lv || "").slice(0, 80),
    t: Number.isFinite(Number(h.t)) && Math.abs(Number(h.t)) < 8.64e15 ? Number(h.t) : 0,
  };
}
function pplNormRel(a, b, role) {
  if (Object.hasOwn(PPL_NORM, role)) return { a: b, b: a, role: PPL_NORM[role] };
  return { a, b, role };
}
const PPL_SYM = [
  "spouse",
  "sibling",
  "relative",
  "lover",
  "friend",
  "classmate",
  "colleague",
  "partner",
  "other",
];
const PPL_TAGS = [
  "本人",
  "配偶",
  "父亲",
  "母亲",
  "子女",
  "兄弟姐妹",
  "祖辈",
  "朋友",
  "同事",
  "其他",
];
/* 称谓文字 */
function pplElder(A, B) {
  return (A.dt || "") <= (B.dt || "");
}
function pplRelLabel(rel, A, B) {
  const gm = (p) => p.gender === "1";
  switch (rel.role) {
    case "parent":
      return (gm(A) ? "父" : "母") + (gm(B) ? "子" : "女");
    case "grand":
      return "祖孙";
    case "spouse":
      return "夫妻";
    case "sibling": {
      const e = pplElder(A, B) ? A : B,
        y = e === A ? B : A;
      return (gm(e) ? "兄" : "姐") + (gm(y) ? "弟" : "妹");
    }
    case "boss":
      return "上下级";
    case "teacher":
      return "师生";
    case "other":
      return rel.note || "其他";
    default:
      return PPL_ROLE[rel.role].n;
  }
}
/* ---- 地支 / 天干 关系 ---- */
const PPL_GAN_HE = [
  [0, 5, "土"],
  [1, 6, "金"],
  [2, 7, "水"],
  [3, 8, "木"],
  [4, 9, "火"],
];
const PPL_GAN_CHONG = [
  [0, 6],
  [1, 7],
  [2, 8],
  [3, 9],
];
const inPair = (arr, a, b) =>
  arr.some((p) => (p[0] === a && p[1] === b) || (p[0] === b && p[1] === a));
function pplZhiRel(a, b) {
  const out = [];
  if (a === b) {
    out.push({ t: "同支", tone: 0.4, txt: ZHI[a] + "同支" });
    if ([4, 6, 9, 11].includes(a)) out.push({ t: "自刑", tone: -1, txt: ZHI[a] + "自刑" });
    return out;
  }
  const he = Z_HE6.find((p) => (p[0] === a && p[1] === b) || (p[0] === b && p[1] === a));
  if (he) out.push({ t: "六合", tone: 2, txt: `${ZHI[a]}${ZHI[b]}六合(化${he[2]})` });
  if (inPair(Z_CHONG, a, b)) out.push({ t: "冲", tone: -2.5, txt: `${ZHI[a]}${ZHI[b]}相冲` });
  if (inPair(Z_HAI, a, b)) out.push({ t: "害", tone: -1.5, txt: `${ZHI[a]}${ZHI[b]}相害` });
  if (inPair(Z_PO, a, b)) out.push({ t: "破", tone: -1, txt: `${ZHI[a]}${ZHI[b]}相破` });
  const sh = Z_SANHE.find((g) => g.slice(0, 3).includes(a) && g.slice(0, 3).includes(b));
  if (sh) out.push({ t: "半合", tone: 1.5, txt: `${ZHI[a]}${ZHI[b]}半合(${sh[3]}局)` });
  const hu = Z_SANHUI.find((g) => g.slice(0, 3).includes(a) && g.slice(0, 3).includes(b));
  if (hu && !he) out.push({ t: "半会", tone: 1, txt: `${ZHI[a]}${ZHI[b]}半会(${hu[3]}方)` });
  if (Z_XING2.some((g) => inPair([[g[0], g[1]]], a, b)))
    out.push({ t: "刑", tone: -1.5, txt: `${ZHI[a]}${ZHI[b]}相刑` });
  Z_XING3.forEach((g) => {
    const s = g.slice(0, 3);
    if (s.includes(a) && s.includes(b))
      out.push({ t: "刑", tone: -1.2, txt: `${ZHI[a]}${ZHI[b]}相刑(${g[3]}之二)` });
  });
  return out;
}
const pplZhiTone = (a) => a.reduce((s, x) => s + x.tone, 0);
/* ---- 十神 ---- */
const PPL_SS_TXT = {
  比肩: "同类同频,并肩互助,也易各不相让",
  劫财: "亲近中带竞争,钱财与边界宜说清",
  食神: "愿意付出与照顾,对方能激发才华与温和的表达",
  伤官: "直言少忌、要求较多,对方常成为挑剔或表达的对象",
  偏财: "对方是愿意投入、灵活经营的对象(缘分偏动)",
  正财: "对方是务实经营、愿负责的对象(缘分偏稳)",
  七杀: "对方带来压力与挑战,推着人成长,也易紧张",
  正官: "对方带来规范与约束,受敬重也受管束",
  偏印: "对方带来另类的启发与庇护,但不一定贴心",
  正印: "对方像长辈般滋养、庇护与教导",
};
/* ---- 五行 ---- */
function pplWx(a, b) {
  // a、b 为日主五行索引;返回 {rel,dir}
  const d = (b - a + 5) % 5;
  return d === 0
    ? { rel: "同", dir: 0 }
    : d === 1
      ? { rel: "生", dir: 1 }
      : d === 2
        ? { rel: "克", dir: 1 }
        : d === 3
          ? { rel: "克", dir: -1 }
          : { rel: "生", dir: -1 }; // dir:1 表示 a→b;-1 表示 b→a
}
const pplShare = (deep) => {
  const w = deep.st.wxw,
    s = w.reduce((x, y) => x + y, 0) || 1;
  return w.map((x) => x / s);
};
function pplSupport(rec, giv) {
  // giv 对 rec 的扶持(按 rec 的喜忌看 giv 的五行分布与日主五行)
  const fav = rec.deep.xy.favor,
    av = rec.deep.xy.avoid,
    sh = pplShare(giv.deep);
  let v = 0;
  const help = [],
    harm = [];
  for (let e = 0; e < 5; e++) {
    if (fav.includes(e)) {
      v += sh[e];
      if (sh[e] >= 0.2) help.push(WXN[e]);
    } else if (av.includes(e)) {
      v -= sh[e];
      if (sh[e] >= 0.2) harm.push(WXN[e]);
    }
  }
  const dmw = GAN_WX[giv.bz.dm],
    dmT = fav.includes(dmw) ? 1 : av.includes(dmw) ? -1 : 0;
  const val = Math.max(-1, Math.min(1, v * 0.7 + dmT * 0.3)),
    score = Math.round(50 + 50 * val);
  const label =
    score >= 65
      ? "助益明显"
      : score >= 55
        ? "略有助益"
        : score >= 45
          ? "互不相碍"
          : score >= 35
            ? "略有消耗"
            : "易被消耗";
  return { v: val, score, label, help, harm, dmFav: dmT };
}
/* ---- 两两分析 ---- */
function pplPair(A, B) {
  const da = A.bz.dm,
    db = B.bz.dm,
    wa = GAN_WX[da],
    wb = GAN_WX[db],
    pa = A.bz.pill,
    pb = B.bz.pill;
  const wx = pplWx(wa, wb),
    ssAB = shishen(da, db),
    ssBA = shishen(db, da);
  const lines = [];
  let T = 0;
  // 日主五行
  {
    const an = A.name || "甲",
      bn = B.name || "乙";
    let t, tone;
    if (wx.rel === "同") {
      t = `日主同属${WXN[wa]}(${GAN[da]}、${GAN[db]}):同气相求,彼此理解,也易比较。`;
      tone = 0.5;
    } else {
      const from = wx.dir === 1 ? an : bn,
        to = wx.dir === 1 ? bn : an,
        fw = wx.dir === 1 ? wa : wb,
        tw = wx.dir === 1 ? wb : wa;
      if (wx.rel === "生") {
        t = `${from}(${GAN[wx.dir === 1 ? da : db]}${WXN[fw]})生${to}(${GAN[wx.dir === 1 ? db : da]}${WXN[tw]}):${from}天然滋养、托举${to};${to}更易得益,${from}需留意不过度付出。`;
        tone = 1;
      } else {
        t = `${from}(${GAN[wx.dir === 1 ? da : db]}${WXN[fw]})克${to}(${GAN[wx.dir === 1 ? db : da]}${WXN[tw]}):${from}对${to}有约束与主导的一面;处得好是督促与规范,处不好是压制与摩擦。`;
        tone = -1;
      }
    }
    T += tone;
    lines.push({ k: "日主五行", t, tone });
  }
  // 十神
  lines.push({
    k: "十神",
    t: `${A.name || "甲"}看${B.name || "乙"}:对方是你的「${ssAB}」——${PPL_SS_TXT[ssAB]}。\n${B.name || "乙"}看${A.name || "甲"}:对方是你的「${ssBA}」——${PPL_SS_TXT[ssBA]}。`,
    tone: 0,
  });
  // 日干合冲
  const gh = PPL_GAN_HE.find((p) => (p[0] === da && p[1] === db) || (p[0] === db && p[1] === da));
  if (gh) {
    T += 1.5;
    lines.push({
      k: "日干",
      t: `日干${GAN[da]}${GAN[db]}相合(合化${gh[2]}):容易相互吸引、靠近,合而不一定化。`,
      tone: 1.5,
    });
  } else if (inPair(PPL_GAN_CHONG, da, db)) {
    T -= 1.5;
    lines.push({
      k: "日干",
      t: `日干${GAN[da]}${GAN[db]}相冲(四冲):性情上易正面碰撞,需要彼此让步。`,
      tone: -1.5,
    });
  }
  // 日支(配偶宫)与年支(生肖)、月支
  const dz = pplZhiRel(pa[2].b, pb[2].b),
    yz = pplZhiRel(pa[0].b, pb[0].b),
    mz = pplZhiRel(pa[1].b, pb[1].b);
  const showZ = (nm, arr, a, b, w) => {
    if (!arr.length) return;
    const tn = pplZhiTone(arr) * w;
    T += tn;
    lines.push({
      k: nm,
      t: `${nm}:${arr.map((x) => x.txt).join("、")}${nm === "日支" ? "(日支代表个人内在与亲近关系的“宫位”,影响最直接)" : nm === "年支" ? "(生肖层面的缘分与长辈、大环境的关系)" : "(月支代表成长环境与事业场域的呼应)"}。`,
      tone: tn,
    });
  };
  showZ("日支", dz, pa[2].b, pb[2].b, 1);
  showZ("年支", yz, pa[0].b, pb[0].b, 0.5);
  showZ("月支", mz, pa[1].b, pb[1].b, 0.4);
  if (!dz.length && !yz.length && !mz.length)
    lines.push({
      k: "地支",
      t: `日支${ZHI[pa[2].b]}、${ZHI[pb[2].b]},年支${ZHI[pa[0].b]}、${ZHI[pb[0].b]}:彼此无明显的合冲刑害,关系较平顺、不强求。`,
      tone: 0,
    });
  // 扶持
  const sAB = pplSupport(A, B),
    sBA = pplSupport(B, A);
  T += (sAB.score - 50 + (sBA.score - 50)) / 50;
  lines.push({
    k: "用神扶持",
    t: `${B.name || "乙"}对${A.name || "甲"}:${sAB.label}(${sAB.score})${sAB.help.length ? ",其五行中的" + sAB.help.join("、") + "正是" + (A.name || "甲") + "所喜" : ""}${sAB.harm.length ? ",但" + sAB.harm.join("、") + "偏旺则易耗" + (A.name || "甲") : ""}。\n${A.name || "甲"}对${B.name || "乙"}:${sBA.label}(${sBA.score})${sBA.help.length ? ",其五行中的" + sBA.help.join("、") + "正是" + (B.name || "乙") + "所喜" : ""}${sBA.harm.length ? ",但" + sBA.harm.join("、") + "偏旺则易耗" + (B.name || "乙") : ""}。`,
    tone: (sAB.score + sBA.score - 100) / 50,
  });
  // 五行互补
  const shA = pplShare(A.deep),
    shB = pplShare(B.deep),
    comp = [];
  for (let e = 0; e < 5; e++) {
    if (shA[e] < 0.1 && shB[e] >= 0.22)
      comp.push(`${A.name || "甲"}缺${WXN[e]},${B.name || "乙"}有`);
    if (shB[e] < 0.1 && shA[e] >= 0.22)
      comp.push(`${B.name || "乙"}缺${WXN[e]},${A.name || "甲"}有`);
  }
  if (comp.length)
    (lines.push({ k: "五行互补", t: comp.join(";") + "。", tone: 0.6 }), (T += 0.3 * comp.length));
  const verdict =
    T >= 3
      ? "相合相扶"
      : T >= 1.2
        ? "和顺互助"
        : T > -1.2
          ? "平和"
          : T > -3
            ? "有摩擦,需磨合"
            : "冲克较重";
  const cls = T >= 1.2 ? "good" : T <= -1.2 ? "bad" : "mid";
  return {
    T,
    verdict,
    cls,
    wx,
    ssAB,
    ssBA,
    lines,
    sAB,
    sBA,
    dz,
    yz,
    mz,
    gh: !!gh,
    tags: [
      ...(gh ? ["合"] : []),
      ...(inPair(PPL_GAN_CHONG, da, db) ? ["冲"] : []),
      ...dz
        .map((x) =>
          x.t === "六合" || x.t === "半合"
            ? "合"
            : x.t === "冲"
              ? "冲"
              : x.t === "害"
                ? "害"
                : x.t === "刑"
                  ? "刑"
                  : x.t === "破"
                    ? "破"
                    : "",
        )
        .filter(Boolean),
    ],
  };
}
/* ---- 家庭/群体整体 ---- */
function pplFamily(P) {
  const n = P.length,
    tot = [0, 0, 0, 0, 0],
    S = P.map(() => P.map(() => null)),
    pairs = [];
  P.forEach((p) => {
    const s = pplShare(p.deep);
    for (let e = 0; e < 5; e++) tot[e] += s[e] / n;
  });
  for (let i = 0; i < n; i++)
    for (let j = 0; j < n; j++) if (i !== j) S[i][j] = pplSupport(P[i], P[j]);
  for (let i = 0; i < n; i++)
    for (let j = i + 1; j < n; j++) pairs.push({ i, j, r: pplPair(P[i], P[j]) });
  const need = [0, 0, 0, 0, 0];
  P.forEach((p) => p.deep.xy.favor.forEach((e) => need[e]++));
  const top = tot.map((v, e) => [v, e]).sort((a, b) => b[0] - a[0]);
  const supporters = P.map((p, i) => {
    let best = null;
    for (let j = 0; j < n; j++)
      if (j !== i && (!best || S[i][j].score > best.s.score)) best = { j, s: S[i][j] };
    return best;
  });
  const givers = P.map((p, j) => {
    let sum = 0;
    for (let i = 0; i < n; i++) if (i !== j) sum += S[i][j].score - 50;
    return sum;
  });
  return {
    n,
    tot,
    need,
    top,
    S,
    pairs,
    supporters,
    givers,
    tension: pairs.filter((x) => x.r.cls === "bad").sort((a, b) => a.r.T - b.r.T),
    harmony: pairs.filter((x) => x.r.cls === "good").sort((a, b) => b.r.T - a.r.T),
  };
}
/* ---- 布局:家谱分层 / 环形 ---- */
function pplLayout(people, rels, mode) {
  const n = people.length,
    pos = {};
  if (!n) return { pos, W: 960, H: 520 };
  const ids = people.map((p) => p.id),
    idx = Object.fromEntries(ids.map((id, i) => [id, i])),
    R = rels.filter((r) => idx[r.a] !== undefined && idx[r.b] !== undefined);
  const hasGen = R.some((r) => r.role === "parent" || r.role === "grand");
  if (mode === "circle" || !hasGen) {
    const W = 960,
      H = n <= 2 ? 440 : 560;
    if (n === 1) {
      pos[ids[0]] = { x: W / 2, y: H / 2 };
      return { pos, W, H };
    }
    const rx = Math.min(W * 0.36, 110 + n * 30),
      ry = Math.min(H * 0.36, 100 + n * 20);
    people.forEach((p, i) => {
      const a = -Math.PI / 2 + (i * 2 * Math.PI) / n;
      pos[p.id] = { x: W / 2 + rx * Math.cos(a), y: H / 2 + ry * Math.sin(a) };
    });
    return { pos, W, H };
  }
  // 连通分量与辈分
  const adj = ids.map(() => []);
  R.forEach((r) => {
    adj[idx[r.a]].push([idx[r.b], r, 1]);
    adj[idx[r.b]].push([idx[r.a], r, -1]);
  });
  const comp = Array(n).fill(-1),
    gen = Array(n).fill(0);
  let cc = 0;
  for (let s = 0; s < n; s++) {
    if (comp[s] >= 0) continue;
    comp[s] = cc;
    gen[s] = 0;
    const q = [s];
    while (q.length) {
      const u = q.shift();
      adj[u].forEach(([v, r, sgn]) => {
        if (comp[v] >= 0) return;
        const d = r.role === "parent" ? 1 : r.role === "grand" ? 2 : 0;
        comp[v] = cc;
        gen[v] = gen[u] + sgn * d;
        q.push(v);
      });
    }
    const ids2 = [...Array(n).keys()].filter((i) => comp[i] === cc),
      mn = Math.min(...ids2.map((i) => gen[i]));
    ids2.forEach((i) => (gen[i] -= mn));
    cc++;
  }
  const levels = [...new Set(gen)].sort((a, b) => a - b),
    rows = levels.map((g) => [...Array(n).keys()].filter((i) => gen[i] === g));
  // 行内:并列关系(配偶/兄弟/恋人)相邻,其余按分量、出生先后
  const tie = ["spouse", "lover", "sibling"];
  rows.forEach((row, ri) => {
    const par = {};
    row.forEach((i) => (par[i] = i));
    const find = (x) => (par[x] === x ? x : (par[x] = find(par[x])));
    R.forEach((r) => {
      const a = idx[r.a],
        b = idx[r.b];
      if (row.includes(a) && row.includes(b) && tie.includes(r.role)) par[find(a)] = find(b);
    });
    const groups = {};
    row.forEach((i) => {
      (groups[find(i)] = groups[find(i)] || []).push(i);
    });
    const G = Object.values(groups).map((g) =>
      g.sort((a, b) => (people[a].dt || "").localeCompare(people[b].dt || "")),
    );
    G.sort(
      (a, b) =>
        comp[a[0]] - comp[b[0]] || (people[a[0]].dt || "").localeCompare(people[b[0]].dt || ""),
    );
    rows[ri] = G.flat();
  });
  const maxRow = Math.max(...rows.map((r) => r.length)),
    W = Math.max(960, maxRow * 150 + 100),
    H = Math.max(520, rows.length * 190 + 110);
  rows.forEach((row, ri) => {
    const y = rows.length === 1 ? H / 2 : 70 + (ri * (H - 140)) / (rows.length - 1);
    row.forEach((i, k) => {
      pos[ids[i]] = { x: (W * (k + 1)) / (row.length + 1), y };
    });
  });
  return { pos, W, H };
}

/* =====================================================================
   姓名学:笔画(康熙口径,常见部首变体已换算)、五格剖象与三才、81 数理、字形五行、与八字喜用的匹配、开店取名
   说明:数理吉凶为熊崎式“五格剖象法”通行表,字形五行按部首归类;均为传统姓名学的机械化规则,不是命运判定。
   ===================================================================== */
