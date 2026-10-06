class PdfDoc {
  constructor() {
    this.pages = [];
    this.cache = {};
    this.newPage();
  }
  newPage() {
    const { W, H, S, paper, line } = PDFC,
      c = document.createElement("canvas");
    c.width = Math.round(W * S);
    c.height = Math.round(H * S);
    const x = c.getContext("2d");
    x.scale(S, S);
    x.fillStyle = paper;
    x.fillRect(0, 0, W, H);
    x.strokeStyle = line;
    x.lineWidth = 0.8;
    x.strokeRect(26, 26, W - 52, H - 52);
    x.strokeRect(29, 29, W - 58, H - 58);
    this.pg = { c, x, texts: [] };
    this.pages.push(this.pg);
    this.y = PDFC.MT;
  }
  ensure(h) {
    if (this.y + h > PDFC.H - PDFC.MB) this.newPage();
  }
  font(size, bold, fam) {
    this.pg.x.font = `${bold ? "600 " : ""}${size}px ${fam || PDFC.FB}`;
  }
  cw(ch) {
    const k = this.pg.x.font + ch;
    return this.cache[k] || (this.cache[k] = this.pg.x.measureText(ch).width);
  }
  tw(s, size, bold, fam) {
    this.font(size, bold, fam);
    let w = 0;
    for (const ch of s) w += this.cw(ch);
    return w;
  }
  txt(s, x, y, size, color, bold, fam, align) {
    if (!s) return 0;
    this.font(size, bold, fam);
    const w = this.tw(s, size, bold, fam),
      X = align === "center" ? x - w / 2 : align === "right" ? x - w : x;
    this.font(size, bold, fam);
    const c = this.pg.x;
    c.fillStyle = color || PDFC.ink;
    c.textAlign = "left";
    c.textBaseline = "alphabetic";
    c.fillText(s, X, y);
    this.pg.texts.push({ s, x: X, y, size });
    return w;
  }
  wrap(str, width, size, bold, fam) {
    this.font(size, bold, fam);
    const out = [];
    for (const para of String(str == null ? "" : str).split("\n")) {
      let line = "",
        w = 0;
      for (const ch of para) {
        const k = this.cw(ch);
        if (w + k > width && line) {
          if (PDF_NOSTART.includes(ch) && w + k < width + size) {
            line += ch;
            w += k;
            continue;
          }
          out.push(line);
          line = ch === " " ? "" : ch;
          w = line ? k : 0;
        } else {
          line += ch;
          w += k;
        }
      }
      out.push(line);
    }
    return out;
  }
  /* 块 */
  space(h) {
    this.y += h;
  }
  h1(t) {
    this.ensure(60);
    this.y += 22;
    const x = this.pg.x;
    x.fillStyle = PDFC.red;
    x.fillRect(PDFC.ML, this.y - 13, 4, 17);
    this.txt(t, PDFC.ML + 11, this.y, 15.5, PDFC.gold, false, PDFC.FT);
    x.strokeStyle = PDFC.line;
    x.lineWidth = 0.8;
    x.beginPath();
    x.moveTo(PDFC.ML, this.y + 7);
    x.lineTo(PDFC.W - PDFC.MR, this.y + 7);
    x.stroke();
    this.y += 11;
  }
  h2(t) {
    this.ensure(40);
    this.y += 17;
    this.txt(t, PDFC.ML, this.y, 12, PDFC.red, true);
    this.y += 3;
  }
  p(t, o) {
    o = o || {};
    const size = o.size || 10,
      lh = o.lh || size * 1.68,
      ind = o.ind || 0,
      w = PDFC.W - PDFC.ML - PDFC.MR - ind - (o.bullet ? 10 : 0),
      x0 = PDFC.ML + ind + (o.bullet ? 10 : 0);
    const ls = this.wrap(t, w, size, o.bold);
    ls.forEach((l, i) => {
      this.ensure(lh + 2);
      this.y += lh;
      if (i === 0 && o.bullet)
        this.txt(o.bullet, PDFC.ML + ind, this.y, size, o.bcolor || PDFC.red, true);
      this.txt(l, x0, this.y, size, o.color, o.bold);
    });
    this.y += o.after == null ? 2 : o.after;
  }
  lines(arr) {
    arr.forEach((raw) => {
      if (/^\s*$/.test(raw)) {
        this.y += 3;
        return;
      }
      if (/^[■─\s]*$/.test(raw) || /^─+$/.test(raw)) return;
      const n = raw.match(/^ */)[0].length,
        s = raw.trim();
      if (/^【.+】$/.test(s)) {
        this.ensure(24);
        this.y += 3;
        this.pg.x.fillStyle = PDFC.red;
        this.txt(s, PDFC.ML + Math.min(n, 6) * 3, this.y + 11, 10.5, PDFC.red, true);
        this.y += 15;
        return;
      }
      if (/^[★·]\s/.test(s) || /^· /.test(s)) {
        this.p(s.replace(/^[★·]\s*/, ""), {
          ind: Math.min(n, 8) * 3,
          bullet: s[0] === "★" ? "★" : "·",
          size: 9.8,
        });
        return;
      }
      this.p(s, { ind: Math.min(n, 10) * 3, size: 9.8 });
    });
  }
  kv(pairs, cols) {
    cols = cols || 2;
    const w = (PDFC.W - PDFC.ML - PDFC.MR) / cols;
    for (let i = 0; i < pairs.length; i += cols) {
      const row = pairs.slice(i, i + cols),
        hs = row.map(([k, v]) => this.wrap(String(v), w - 62, 10).length);
      const h = Math.max(...hs) * 16 + 4;
      this.ensure(h);
      row.forEach(([k, v], j) => {
        const x = PDFC.ML + j * w;
        this.txt(k, x, this.y + 13, 9.5, PDFC.dim);
        this.wrap(String(v), w - 62, 10).forEach((l, m) =>
          this.txt(l, x + 58, this.y + 13 + m * 16, 10, PDFC.ink, true),
        );
      });
      this.y += h;
    }
    this.y += 7;
  }
  table(head, rows, cols, o) {
    o = o || {};
    const W = PDFC.W - PDFC.ML - PDFC.MR,
      tot = cols.reduce((a, b) => a + b, 0),
      cw = cols.map((c) => (c / tot) * W),
      size = o.size || 9.5,
      lh = size * 1.55,
      x = this.pg.x;
    const drawRow = (cells, hd) => {
      const wr = cells.map((c, i) =>
        this.wrap(typeof c === "object" && c ? c.t : c, cw[i] - 10, size, hd),
      );
      const h = Math.max(...wr.map((a) => a.length)) * lh + 8;
      if (this.y + h > PDFC.H - PDFC.MB) {
        this.newPage();
      }
      const c2 = this.pg.x;
      if (hd) {
        c2.fillStyle = PDFC.soft;
        c2.fillRect(PDFC.ML, this.y, W, h);
      }
      c2.strokeStyle = PDFC.line;
      c2.lineWidth = 0.6;
      c2.beginPath();
      c2.moveTo(PDFC.ML, this.y + h);
      c2.lineTo(PDFC.ML + W, this.y + h);
      c2.stroke();
      let xx = PDFC.ML;
      cells.forEach((c, i) => {
        const col = (typeof c === "object" && c && c.c) || (hd ? PDFC.gold : PDFC.ink);
        wr[i].forEach((l, m) =>
          this.txt(l, xx + 5, this.y + 4 + lh * (m + 0.82), size, col, hd || (c && c.b)),
        );
        xx += cw[i];
      });
      this.y += h;
    };
    if (head) drawRow(head, true);
    rows.forEach((r) => drawRow(r, false));
    this.y += 6;
  }
  bar(label, pct, val, col, lw) {
    lw = lw || 92;
    this.ensure(19);
    this.y += 2;
    const x = this.pg.x,
      W = PDFC.W - PDFC.ML - PDFC.MR,
      bw = W - lw - 70;
    this.txt(label, PDFC.ML, this.y + 12, 9.8, PDFC.ink);
    x.fillStyle = PDFC.soft;
    x.fillRect(PDFC.ML + lw, this.y + 4, bw, 8);
    x.fillStyle = col || PDFC.gold;
    x.fillRect(PDFC.ML + lw, this.y + 4, bw * Math.max(0, Math.min(1, pct)), 8);
    this.txt(val || "", PDFC.ML + lw + bw + 8, this.y + 12, 9.5, PDFC.dim);
    this.y += 17;
  }
  pillars(P, title) {
    const bz = P.bz,
      D = P.deep,
      W = PDFC.W - PDFC.ML - PDFC.MR,
      cw = W / 4;
    this.ensure(150);
    const x = this.pg.x,
      y0 = this.y;
    if (title) this.txt(title, PDFC.ML, y0 + 10, 10.5, PDFC.red, true);
    const top = y0 + (title ? 18 : 4);
    bz.pill.forEach((p, i) => {
      const X = PDFC.ML + i * cw + 3,
        w = cw - 6;
      x.strokeStyle = i === 2 ? PDFC.gold : PDFC.line;
      x.lineWidth = i === 2 ? 1.4 : 0.8;
      x.strokeRect(X, top, w, 118);
      x.fillStyle = PDFC.soft;
      x.fillRect(X, top, w, 17);
      this.txt(
        ["年柱", "月柱", "日柱", "时柱"][i],
        X + w / 2,
        top + 12,
        9.5,
        PDFC.dim,
        false,
        null,
        "center",
      );
      this.txt(GAN[p.s], X + w / 2, top + 46, 30, PDFC.wx[GAN_WX[p.s]], false, PDFC.FT, "center");
      this.txt(
        i === 2 ? "日元" : shishen(bz.dm, p.s),
        X + w / 2,
        top + 60,
        9,
        PDFC.dim,
        false,
        null,
        "center",
      );
      this.txt(ZHI[p.b], X + w / 2, top + 88, 30, PDFC.wx[ZHI_WX[p.b]], false, PDFC.FT, "center");
      this.txt(
        CANG[p.b].map((s) => GAN[s] + shishen(bz.dm, s)).join(" "),
        X + w / 2,
        top + 102,
        8.2,
        PDFC.dim,
        false,
        null,
        "center",
      );
      this.txt(
        NAYIN[ganzhiIdx(p.s, p.b) >> 1],
        X + w / 2,
        top + 113,
        8.2,
        PDFC.gold,
        false,
        null,
        "center",
      );
    });
    this.y = top + 126;
  }
  wxBar(share, title) {
    this.ensure(40);
    const x = this.pg.x,
      W = PDFC.W - PDFC.ML - PDFC.MR;
    if (title) this.txt(title, PDFC.ML, this.y + 10, 9.8, PDFC.dim);
    this.y += title ? 15 : 2;
    let xx = PDFC.ML;
    share.forEach((v, e) => {
      const w = Math.max(1, v * W);
      x.fillStyle = PDFC.wx[e];
      x.globalAlpha = 0.85;
      x.fillRect(xx, this.y, w, 16);
      x.globalAlpha = 1;
      if (v >= 0.07)
        this.txt(
          `${WXK[e]} ${Math.round(v * 100)}%`,
          xx + w / 2,
          this.y + 12,
          9,
          "#fff",
          true,
          null,
          "center",
        );
      xx += w;
    });
    this.y += 26;
  }
  bars(arr, o) {
    // arr:[{l,v,cur}] v∈[-1,1]
    o = o || {};
    this.ensure(92);
    const x = this.pg.x,
      W = PDFC.W - PDFC.ML - PDFC.MR,
      n = arr.length,
      bw = W / n,
      mid = this.y + 36;
    x.strokeStyle = PDFC.line;
    x.beginPath();
    x.moveTo(PDFC.ML, mid);
    x.lineTo(PDFC.ML + W, mid);
    x.stroke();
    arr.forEach((a, i) => {
      const h = Math.min(34, Math.abs(a.v) * 34),
        X = PDFC.ML + i * bw + bw * 0.18,
        w = bw * 0.64;
      x.fillStyle = a.v >= 0 ? PDFC.good : PDFC.bad;
      x.globalAlpha = a.cur ? 1 : 0.62;
      x.fillRect(X, a.v >= 0 ? mid - h : mid, w, Math.max(1.5, h));
      x.globalAlpha = 1;
      this.txt(
        a.l,
        X + w / 2,
        this.y + 82,
        8.2,
        a.cur ? PDFC.red : PDFC.dim,
        !!a.cur,
        null,
        "center",
      );
      if (o.vals)
        this.txt(
          String(a.t == null ? "" : a.t),
          X + w / 2,
          a.v >= 0 ? mid - h - 3 : mid + h + 9,
          7.8,
          PDFC.dim,
          false,
          null,
          "center",
        );
    });
    this.y += 92;
  }
  grid12(zw) {
    const pos = {
        5: [0, 0],
        6: [0, 1],
        7: [0, 2],
        8: [0, 3],
        9: [1, 3],
        10: [2, 3],
        11: [3, 3],
        0: [3, 2],
        1: [3, 1],
        2: [3, 0],
        3: [2, 0],
        4: [1, 0],
      },
      W = PDFC.W - PDFC.ML - PDFC.MR,
      cw = W / 4,
      ch = 96;
    this.ensure(ch * 4 + 8);
    const x = this.pg.x,
      y0 = this.y;
    zw.pal.forEach((p) => {
      const [r, c] = pos[p.b],
        X = PDFC.ML + c * cw,
        Y = y0 + r * ch;
      x.strokeStyle = p.isMing ? PDFC.red : PDFC.line;
      x.lineWidth = p.isMing ? 1.6 : 0.8;
      x.strokeRect(X, Y, cw, ch);
      this.txt(
        p.name + "宫" + (p.isMing ? " 命" : "") + (p.isShen ? " 身" : ""),
        X + 5,
        Y + 12,
        9.5,
        p.isMing ? PDFC.red : PDFC.gold,
        true,
      );
      this.txt(GAN[p.stem] + ZHI[p.b], X + cw - 5, Y + 12, 9, PDFC.dim, false, null, "right");
      let yy = Y + 26;
      p.stars.slice(0, 5).forEach((s) => {
        const lab = s.n + (s.br ? "·" + s.br : "") + (s.h ? " 化" + s.h : "");
        this.txt(
          lab,
          X + 5,
          yy,
          s.t === "main" ? 10 : 8.8,
          s.h === "忌" ? PDFC.bad : s.t === "main" ? PDFC.ink : PDFC.dim,
          s.t === "main",
        );
        yy += s.t === "main" ? 13 : 11.5;
      });
      this.txt(p.dx ? p.dx.join("-") : "", X + 5, Y + ch - 5, 8.2, PDFC.dim);
      this.txt(p.cs || "", X + cw - 5, Y + ch - 5, 8.2, PDFC.dim, false, null, "right");
    });
    const X = PDFC.ML + cw,
      Y = y0 + ch;
    x.fillStyle = PDFC.soft;
    x.fillRect(X + 1, Y + 1, cw * 2 - 2, ch * 2 - 2);
    const L = [
      `${zw.juName}`,
      `命宫 ${ZHI[zw.ming]} · 身宫 ${ZHI[zw.shen]}`,
      `紫微在${ZHI[zw.z]} · 命主 ${zw.mingStar} · 身主 ${zw.shenStar}`,
      `生年四化:${zw.sihua.join(" ")}`,
    ];
    L.forEach((l, i) =>
      this.txt(
        l,
        X + cw,
        Y + 44 + i * 20,
        i ? 10.5 : 13,
        i ? PDFC.ink : PDFC.red,
        !i,
        i ? null : PDFC.FT,
        "center",
      ),
    );
    this.y = y0 + ch * 4 + 8;
  }
  network(D, w, h) {
    h = h || 230;
    this.ensure(h + 10);
    const x = this.pg.x,
      cx = PDFC.W / 2,
      cy = this.y + h / 2,
      r = Math.min(h / 2 - 26, 95),
      n = D.P.length,
      pts = {};
    D.P.forEach((p, i) => {
      const a = (n === 2 ? Math.PI : -Math.PI / 2) + (i * 2 * Math.PI) / Math.max(1, n);
      pts[p.id] = { x: cx + r * 1.7 * Math.cos(a), y: cy + r * Math.sin(a) };
    });
    D.rels.forEach((rr) => {
      const A = pts[rr.a],
        B = pts[rr.b];
      if (!A || !B) return;
      const pr = netPair(D.byId[rr.a], D.byId[rr.b]);
      x.strokeStyle = pr.cls === "good" ? PDFC.good : pr.cls === "bad" ? PDFC.bad : PDFC.gold;
      x.lineWidth = 1.6;
      x.setLineDash(PPL_ROLE[rr.role].kind === "soc" ? [4, 3] : []);
      x.beginPath();
      x.moveTo(A.x, A.y);
      x.lineTo(B.x, B.y);
      x.stroke();
      x.setLineDash([]);
    });
    D.P.forEach((p) => {
      const q = pts[p.id],
        e = GAN_WX[p.bz.dm];
      x.fillStyle = PDFC.paper;
      x.beginPath();
      x.arc(q.x, q.y, 15, 0, 7);
      x.fill();
      x.strokeStyle = PDFC.wx[e];
      x.lineWidth = 2;
      x.stroke();
      this.txt([...p.name][0] || "?", q.x, q.y + 5, 14, PDFC.wx[e], false, PDFC.FT, "center");
      this.txt(p.name, q.x, q.y + 29, 8.6, PDFC.dim, false, null, "center");
    });
    this.y += h + 4;
  }
  /* 页眉页脚 + 封面 */
  cover(title, sub, meta) {
    const x = this.pg.x,
      W = PDFC.W;
    x.fillStyle = PDFC.red;
    x.fillRect(PDFC.ML, 40, 34, 44);
    this.txt("天", PDFC.ML + 17, 60, 15, "#fbeee0", false, PDFC.FT, "center");
    this.txt("机", PDFC.ML + 17, 78, 15, "#fbeee0", false, PDFC.FT, "center");
    this.txt(title, PDFC.ML + 46, 66, 22, PDFC.gold, false, PDFC.FT);
    this.txt(sub, PDFC.ML + 48, 82, 9.5, PDFC.dim);
    x.strokeStyle = PDFC.gold;
    x.lineWidth = 1.2;
    x.beginPath();
    x.moveTo(PDFC.ML, 94);
    x.lineTo(W - PDFC.MR, 94);
    x.stroke();
    x.lineWidth = 0.5;
    x.beginPath();
    x.moveTo(PDFC.ML, 97);
    x.lineTo(W - PDFC.MR, 97);
    x.stroke();
    this.y = 102;
    this.kv(meta, 2);
  }
  finish(runTitle) {
    const n = this.pages.length;
    this.pages.forEach((pg, i) => {
      this.pg = pg;
      if (i > 0) this.txt(`天机盘 · ${runTitle}`, PDFC.ML, 44, 8.6, PDFC.dim);
      this.txt("倾向与提示,非预言,不构成决策建议", PDFC.ML, PDFC.H - 38, 8, PDFC.dim);
      this.txt(
        `第 ${i + 1} / ${n} 页`,
        PDFC.W - PDFC.MR,
        PDFC.H - 38,
        8,
        PDFC.dim,
        false,
        null,
        "right",
      );
    });
  }
  async toPdf(title) {
    const { W, H } = PDFC,
      enc = new TextEncoder(),
      parts = [],
      offs = [];
    let len = 0;
    const push = (x) => {
      const b = typeof x === "string" ? enc.encode(x) : x;
      parts.push(b);
      len += b.length;
    };
    const hex = (s) =>
      [...s]
        .map((ch) => {
          const c = ch.codePointAt(0);
          return c > 0xffff ? "003F" : c.toString(16).padStart(4, "0");
        })
        .join("");
    const jpegs = [];
    for (const pg of this.pages) {
      const blob = await new Promise((r) => pg.c.toBlob(r, "image/jpeg", 0.88));
      jpegs.push(new Uint8Array(await blob.arrayBuffer()));
    }
    const n = this.pages.length;
    push(new Uint8Array([37, 80, 68, 70, 45, 49, 46, 52, 10, 37, 226, 227, 207, 211, 10]));
    const obj = (id, body) => {
      offs[id] = len;
      push(`${id} 0 obj\n${body}\nendobj\n`);
    };
    obj(1, `<< /Type /Catalog /Pages 2 0 R >>`);
    obj(
      2,
      `<< /Type /Pages /Kids [${this.pages.map((_, i) => `${7 + 3 * i} 0 R`).join(" ")}] /Count ${n} >>`,
    );
    obj(
      3,
      `<< /Type /Font /Subtype /Type0 /BaseFont /STSong-Light-UniGB-UCS2-H /Encoding /UniGB-UCS2-H /DescendantFonts [4 0 R] >>`,
    );
    obj(
      4,
      `<< /Type /Font /Subtype /CIDFontType0 /BaseFont /STSong-Light /CIDSystemInfo << /Registry (Adobe) /Ordering (GB1) /Supplement 4 >> /FontDescriptor 5 0 R /DW 1000 >>`,
    );
    obj(
      5,
      `<< /Type /FontDescriptor /FontName /STSong-Light /Flags 6 /FontBBox [-25 -254 1000 880] /ItalicAngle 0 /Ascent 880 /Descent -120 /CapHeight 880 /StemV 93 >>`,
    );
    obj(
      6,
      `<< /Title <FEFF${hex(title)}> /Creator <FEFF${hex("天机盘")}> /Producer <FEFF${hex("天机盘 · 浏览器内生成")}> >>`,
    );
    this.pages.forEach((pg, i) => {
      const pid = 7 + 3 * i,
        cid = 8 + 3 * i,
        iid = 9 + 3 * i;
      obj(
        pid,
        `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${W} ${H}] /Contents ${cid} 0 R /Resources << /XObject << /Im0 ${iid} 0 R >> /Font << /F1 3 0 R >> >> >>`,
      );
      let cs = `q ${W} 0 0 ${H} 0 0 cm /Im0 Do Q\n`;
      pg.texts.forEach((t) => {
        cs += `BT /F1 ${t.size.toFixed(1)} Tf 3 Tr 1 0 0 1 ${t.x.toFixed(1)} ${(H - t.y).toFixed(1)} Tm <${hex(t.s)}> Tj ET\n`;
      });
      const cb = enc.encode(cs);
      offs[cid] = len;
      push(`${cid} 0 obj\n<< /Length ${cb.length} >>\nstream\n`);
      push(cb);
      push(`\nendstream\nendobj\n`);
      const j = jpegs[i];
      offs[iid] = len;
      push(
        `${iid} 0 obj\n<< /Type /XObject /Subtype /Image /Width ${pg.c.width} /Height ${pg.c.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${j.length} >>\nstream\n`,
      );
      push(j);
      push(`\nendstream\nendobj\n`);
    });
    const total = 7 + 3 * n,
      xr = len;
    let x = `xref\n0 ${total}\n0000000000 65535 f \n`;
    for (let i = 1; i < total; i++) x += `${String(offs[i]).padStart(10, "0")} 00000 n \n`;
    x += `trailer\n<< /Size ${total} /Root 1 0 R /Info 6 0 R >>\nstartxref\n${xr}\n%%EOF\n`;
    push(x);
    return new Blob(parts, { type: "application/pdf" });
  }
}
/* ---------- 各模块内容 ---------- */
const PDF_MODS = {
  over: "总览",
  guide: "个人指南",
  bazi: "八字",
  ziwei: "紫微斗数",
  net: "关系网",
  fate: "事项运势",
  hepan: "合盘",
};
function pdfSecs() {
  buildReportFull(R);
  const m = {};
  (REP_LAST ? REP_LAST.SEC : []).forEach((s) => (m[s.title.slice(0, 2)] = s));
  return m;
}
function pdfMeta() {
  const c = R.t.civ,
    nm = (($("#pname") && $("#pname").value) || "").trim(),
    pv = $("#pprov"),
    pc = $("#pcty"),
    pd = $("#pdis");
  const place =
    [
      pv && pv.value !== "" && pv.value !== "x" ? pv.selectedOptions[0].text : "",
      pc && pc.value !== "" && pc.selectedIndex > 0 ? pc.selectedOptions[0].text : "",
      pd && pd.value !== "" && pd.selectedIndex > 0 ? pd.selectedOptions[0].text : "",
    ]
      .filter(Boolean)
      .join(" ") || `经度 ${R.opt.lon}° 纬度 ${R.opt.lat}°`;
  return [
    ["姓名", nm || "—"],
    ["性别", R.opt.gender === "M" ? "乾造(男)" : "坤造(女)"],
    [
      "公历",
      `${c.y}-${f2(c.m)}-${f2(c.d)} ${f2(c.h)}:${f2(c.mi)}${R.opt.solar ? "(真太阳时 " + f2(R.t.loc.h) + ":" + f2(R.t.loc.mi) + ")" : ""}`,
    ],
    ["农历", lunarText(R.lunar)],
    ["地点", place],
    [
      "生成时间",
      (() => {
        const n = nowBJ();
        return `${n.y}-${f2(n.m)}-${f2(n.d)} ${f2(n.h)}:${f2(n.mi)}`;
      })(),
    ],
  ];
}
function pdfAIText(kind) {
  const l = AI.last[kind];
  return l && l.text ? l.text.replace(/\*\*/g, "") : "";
}
function pdfBuild(mod, doc) {
  const name = PDF_MODS[mod],
    P = {
      name: (($("#pname") && $("#pname").value) || "").trim() || "本人",
      gender: R.opt.gender === "M" ? "1" : "0",
      bz: R.bz,
      deep: R.deep,
    },
    y0 = nowBJ().y;
  if (mod === "net" || mod === "fate" || mod === "hepan") {
    doc.cover(
      `${name}报告`,
      "天机盘 · 命局",
      mod === "net"
        ? [
            ["人物数", String(PPL.people.length)],
            ["关系数", String(PPL.rels.length)],
          ]
        : [["生成时间", pdfMeta()[5][1]]],
    );
  } else doc.cover(`${name}报告`, "天机盘 · 命局", pdfMeta());
  const S = pdfSecs();
  if (mod === "over") {
    doc.h1("命局速览");
    doc.pillars(P);
    doc.wxBar(pplShare(R.deep), "五行分布(天干+藏干)");
    doc.kv(
      [
        ["日主", `${GAN[R.bz.dm]}${WXK[GAN_WX[R.bz.dm]]} · ${R.deep.st.level}`],
        ["格局", R.deep.gj.name],
        ["喜用", R.deep.xy.favor.map((x) => WXK[x]).join("")],
        ["忌", R.deep.xy.avoid.map((x) => WXK[x]).join("") || "—"],
      ],
      2,
    );
    doc.h1("综合方位(机械叠加)");
    const dirs = [1, 2, 3, 4, 6, 7, 8, 9]
      .map((p) => ({ p, ...palScore(R, p) }))
      .sort((a, b) => b.total - a.total);
    doc.table(
      ["方位", "宫", "奇门星门格局", "五行契合", "流年飞星", "合计"],
      dirs.map((d) => [
        PDIR[d.p],
        PNAME[d.p] + PNUM[d.p],
        d.q.toFixed(1),
        (d.xi > 0 ? "+" : "") + d.xi,
        (d.ys > 0 ? "+" : "") + d.ys,
        {
          t: (d.total > 0 ? "+" : "") + d.total.toFixed(1),
          c: d.total >= 2 ? PDFC.good : d.total < 0 ? PDFC.bad : PDFC.ink,
          b: 1,
        },
      ]),
      [1.1, 1, 2, 1.4, 1.4, 1.2],
    );
    doc.h1(`流年趋势 ${y0 - 3}—${y0 + 12}`);
    const ly = liunian(R.bz, R.deep, y0 - 3, 16);
    doc.bars(
      ly.map((x) => ({
        l: String(x.y).slice(2),
        v: Math.max(-1, Math.min(1, x.sc / 1.6)),
        cur: x.y === y0,
        t: x.lv,
      })),
      { vals: 0 },
    );
    doc.p(
      "柱向上为偏顺、向下为偏紧;红色为今年。依据流年干支对喜忌的契合、与日支月支的合冲等机械加减。",
      { size: 8.6, color: PDFC.dim },
    );
    ["八、", "七、", "十、"].forEach((k) => {
      const s = S[k];
      if (s) {
        doc.h1(s.title.replace(/^[一二三四五六七八九十]+、/, ""));
        doc.lines(s.lines);
      }
    });
    const ai = pdfAIText("chart");
    if (ai) {
      doc.h1("AI 综合解读(由你自备的模型生成)");
      doc.p(ai, { size: 9.8 });
    }
  } else if (mod === "guide") {
    doc.h1("命局");
    doc.pillars(P);
    const g = S["九、"];
    if (g) {
      doc.h1("个人指南要点");
      doc.lines(g.lines);
    }
  } else if (mod === "bazi") {
    doc.h1("八字命局");
    doc.pillars(P);
    doc.wxBar(pplShare(R.deep), "五行分布");
    const s = S["一、"];
    if (s) doc.lines(s.lines);
    doc.h1(`流年(${y0 - 1}—${y0 + 10})`);
    const ly = liunian(R.bz, R.deep, y0 - 1, 12);
    doc.bars(
      ly.map((x) => ({
        l: String(x.y).slice(2),
        v: Math.max(-1, Math.min(1, x.sc / 1.6)),
        cur: x.y === y0,
        t: x.lv,
      })),
      { vals: 0 },
    );
  } else if (mod === "ziwei") {
    doc.h1("紫微命盘");
    doc.grid12(R.zw);
    const s = S["二、"];
    if (s) {
      doc.h1("十二宫与规则解读");
      doc.lines(s.lines.slice(1));
    }
  } else if (mod === "net") {
    const D = netData();
    doc.h1("人物");
    doc.table(
      ["姓名", "身份", "四柱", "日主", "强弱", "喜用"],
      D.P.map((p) => [
        { t: p.name, b: 1 },
        p.tag || "—",
        p.bz.pill.map((x) => GAN[x.s] + ZHI[x.b]).join(" "),
        GAN[p.bz.dm] + WXK[GAN_WX[p.bz.dm]],
        p.deep.st.level,
        p.deep.xy.favor.map((x) => WXK[x]).join(""),
      ]),
      [1.2, 1, 3, 1, 0.9, 1],
    );
    if (D.P.length >= 2) {
      doc.h1("关系图");
      doc.network(D);
      doc.p("连线:绿色相合相扶,红色有摩擦,金色平和;虚线为社会关系。", {
        size: 8.6,
        color: PDFC.dim,
      });
    }
    doc.h1("关系一览");
    const A = D.rels.map((r) => {
      const a = D.byId[r.a],
        b = D.byId[r.b],
        pr = netPair(a, b);
      return [
        `${a.name} — ${b.name}`,
        PPL_ROLE[r.role].n,
        {
          t: pr.verdict,
          c: pr.cls === "good" ? PDFC.good : pr.cls === "bad" ? PDFC.bad : PDFC.ink,
          b: 1,
        },
        (pr.T > 0 ? "+" : "") + pr.T.toFixed(1),
        r.hm ? `合盘 ${esc(r.hm.pct)}` : "—",
      ];
    });
    if (A.length) doc.table(["双方", "关系", "倾向", "分值", "合盘"], A, [2.4, 1.2, 1.5, 0.9, 1.1]);
    else doc.p("尚未建立关系。", { color: PDFC.dim });
    D.rels.slice(0, 12).forEach((r) => {
      const a = D.byId[r.a],
        b = D.byId[r.b],
        pr = netPair(a, b);
      doc.h2(`${a.name} — ${b.name}(${PPL_ROLE[r.role].n})· ${pr.verdict}`);
      pr.lines.forEach((l) => doc.p(`${l.k}:${l.t}`, { bullet: "·", size: 9.4, ind: 4 }));
    });
  } else if (mod === "fate") {
    const list = ftPersons(),
      cur = list.find((x) => x.id === FT.who) || list[0];
    if (!cur) {
      doc.p("请先在首页保存人物或推演命盘。");
      return;
    }
    const Pp = cur.P,
      year = y0,
      involved = list
        .filter((x) => x.id !== cur.id && x.id !== "cur" && FT.inv[x.id] !== false)
        .map((x) => x.P)
        .concat([Pp]);
    doc.kv(
      [
        ["对象", cur.label],
        ["日主", `${GAN[Pp.bz.dm]}${WXK[GAN_WX[Pp.bz.dm]]} · ${Pp.deep.st.level}`],
        ["喜用", Pp.deep.xy.favor.map((x) => WXK[x]).join("")],
        ["生肖", ZODIAC[Pp.bz.pill[0].b]],
      ],
      2,
    );
    doc.h1(`${year}年 八类事项倾向`);
    doc.table(
      ["事项", `${year}年`, "倾向分", `${year + 1}年`, "要点"],
      FATE_ORDER.map((s) => {
        const a = fateYear(Pp, s, year),
          b = fateYear(Pp, s, year + 1);
        return FATE_SCN[s].grave
          ? [s, "只看避忌", "—", "—", "不作运势判断"]
          : [
              { t: s, b: 1 },
              { t: a.label, c: a.p >= 60 ? PDFC.good : a.p < 45 ? PDFC.bad : PDFC.ink, b: 1 },
              String(a.p),
              b.label + " " + b.p,
              a.notes.slice(0, 2).join("、") || "—",
            ];
      }),
      [1, 1.1, 0.8, 1.2, 3],
    );
    const rep = fateReport(Pp, FT.scn, year, nowBJ(), involved),
      S2 = rep.S;
    doc.h1(`${FT.scn} · ${S2.desc}`);
    if (!S2.grave) {
      doc.kv(
        [
          [`${year}年`, `${rep.year.gz}(${rep.year.ss}) ${rep.year.label} ${rep.year.p}`],
          [`${year + 1}年`, `${rep.next.gz}(${rep.next.ss}) ${rep.next.label} ${rep.next.p}`],
        ],
        2,
      );
      doc.p(rep.year.notes.join("、") || "无明显加减", { size: 9.4, color: PDFC.dim });
    }
    doc.h2(`犯太岁 · ${year}年`);
    if (rep.year.ts.items.length)
      rep.year.ts.items.forEach((x) => doc.p(`${x.name}:${x.txt}`, { bullet: "·", size: 9.6 }));
    else doc.p("无冲、刑、害、破、合,不犯太岁,无额外加减。", { size: 9.6 });
    if (!S2.grave) {
      doc.h2(`${year}年逐月(交节为界)`);
      const key = (x) => x.y * 10000 + x.m * 100 + x.d,
        tk = key(nowBJ());
      const nowI = rep.months.reduce((a, m, k) => (key(m.from) <= tk ? k : a), -1);
      doc.bars(
        rep.months.map((m, i) => ({ l: m.name, v: (m.p - 50) / 50, cur: i === nowI, t: m.p })),
        { vals: 1 },
      );
    }
    doc.h2(S2.grave ? "可参考日期(未来 90 天)" : "择吉日(未来 90 天 · 已按个人八字加减)");
    const pick = involved.length > 1 && rep.clean.length ? rep.clean : rep.pick;
    doc.table(
      ["日期", "干支", "建除/神", "评", "冲煞核对"],
      pick.map((d) => {
        const i = d.info;
        return [
          `${i.m}月${i.d}日 周${"日一二三四五六"[new Date(Date.UTC(i.y, i.m - 1, i.d)).getUTCDay()]}`,
          i.gz + "日",
          `${i.zx}日 ${i.ts}${i.huang ? "(黄)" : ""}`,
          ["忌", "慎", "平", "宜", "吉"][d.tier] || "",
          d.conflicts.length ? d.conflicts.map((c) => c.who + c.t).join("、") : "无人相冲",
        ];
      }),
      [1.8, 1, 1.9, 0.6, 2],
    );
    const D = rep.dirs;
    doc.h2("方位与五行");
    if (S2.grave)
      doc.p("出殡、入土避开当日“煞”所在方向;怀孕者与生肖相冲者可不到场。不给方位吉凶。", {
        size: 9.6,
      });
    else {
      doc.p(
        `命卦 ${D.mg.name}。可取:${D.good.map((d) => d.n + "(" + d.dir + ")").join("、")};宜避:${D.bad.map((d) => d.n + "(" + d.dir + ")").join("、")}。`,
        { size: 9.6 },
      );
      doc.p(
        "命主喜用:" + D.favWx.map((f) => `${NM_WXN[f.wx]}(方位${f.dir}、色系${f.color})`).join(";"),
        { size: 9.6 },
      );
    }
    doc.h2("注意");
    rep.caution.forEach((c) => doc.p(c, { bullet: "·", size: 9.6 }));
  } else if (mod === "hepan") {
    const c = hpCompute();
    if (c.err) {
      doc.p(c.err);
      return;
    }
    const { A, B } = c,
      res = HP2.mode === "marry" ? hhMarriage(A, B) : hhGeneric(HP2.mode, A, B);
    doc.kv(
      [
        ["类型", HP_MODES.find((m) => m[0] === HP2.mode)[1]],
        ["契合度", `${res.pct}(规则综合分 ${res.score};高于约 ${res.pct}% 的随机配对)`],
        ["结论", res.lv],
        ["甲方", `${A.name}(${A.gender === "0" ? "女" : "男"})`],
        ["乙方", `${B.name}(${B.gender === "0" ? "女" : "男"})`],
      ],
      2,
    );
    doc.h1("双方八字");
    doc.pillars(A, `甲方 · ${A.name}`);
    doc.pillars(B, `乙方 · ${B.name}`);
    doc.h1("分项");
    res.dims.forEach((d) => {
      doc.bar(
        d.k,
        d.s / 100,
        `${d.s}(权重${d.w})`,
        d.s >= 60 ? PDFC.good : d.s < 44 ? PDFC.bad : PDFC.gold,
        120,
      );
      d.items.forEach((i) =>
        doc.p(`${i.v ? (i.v > 0 ? "+" : "") + Math.round(i.v * 10) / 10 + " " : ""}${i.txt}`, {
          bullet: "·",
          size: 9,
          ind: 8,
          color: i.t === "吉" ? PDFC.good : i.t === "凶" ? PDFC.bad : PDFC.ink,
          after: 0,
        }),
      );
      doc.space(4);
    });
    if (res.pros.length) {
      doc.h2("主要优势");
      res.pros.forEach((x) =>
        doc.p(`${x.k}:${x.txt}`, { bullet: "+", bcolor: PDFC.good, size: 9.6 }),
      );
    }
    if (res.cons.length) {
      doc.h2("需要留意");
      res.cons.forEach((x) => doc.p(`${x.k}:${x.txt}`, { bullet: "!", size: 9.6 }));
    }
    if (HP2.mode === "marry" && res.years.length) {
      doc.h2("近年与婚姻相关的流年线索");
      res.years.forEach((y) => doc.p(`${y.y}年(${y.gz}):${y.why}`, { bullet: "·", size: 9.6 }));
    }
    doc.h2("建议");
    res.advice.forEach((t) => doc.p(t, { bullet: "·", size: 9.6 }));
    const ai = pdfAIText("pair");
    if (ai) {
      doc.h1("AI 合盘解读(由你自备的模型生成)");
      doc.p(ai, { size: 9.8 });
    }
  }
}
async function pdfExport(mod, btn) {
  if (!R) {
    toast("尚未起盘");
    return;
  }
  const txt = btn && btn.textContent;
  if (btn) {
    btn.disabled = true;
    btn.textContent = "生成中…";
  }
  try {
    await new Promise((r) => setTimeout(r, 30));
    if (document.fonts && document.fonts.ready)
      await Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 1500))]);
    const doc = new PdfDoc();
    pdfBuild(mod, doc);
    doc.finish(PDF_MODS[mod] + "报告");
    const blob = await doc.toPdf(`天机盘 · ${PDF_MODS[mod]}报告`);
    const ok = await saveFile(`天机盘-${PDF_MODS[mod]}-${stamp()}.pdf`, blob);
    if (ok)
      toast(
        `已生成 ${PDF_MODS[mod]}报告 PDF(${doc.pages.length} 页,${(blob.size / 1048576).toFixed(1)} MB)`,
      );
    PDF_LAST = { mod, pages: doc.pages.length, size: blob.size, blob };
  } catch (e) {
    console.error(e);
    toast("PDF 生成失败:" + ((e && e.message) || e));
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = txt;
    }
  }
}
let PDF_LAST = null;
function pdfDecorate() {
  Object.keys(PDF_MODS).forEach((id) => {
    const pane = $("#pane-" + id);
    if (!pane || pane.querySelector(":scope .pdfbox")) return;
    const first = pane.querySelector(".panel.blk");
    if (!first) return;
    first.classList.add("pdfhost");
    const box = document.createElement("div");
    box.className = "pdfbox";
    box.innerHTML = `<button type="button" class="gbtn sm pdfbtn" data-mod="${id}" title="把本页内容排版成 A4 的 PDF 报告">导出 PDF</button>`;
    first.insertBefore(box, first.firstChild);
    box.firstChild.onclick = (e) => pdfExport(id, e.currentTarget);
  });
}
function pdfWatch() {
  pdfDecorate();
  let t = 0;
  const cb = () => {
    if (t) return;
    t = requestAnimationFrame(() => {
      t = 0;
      pdfDecorate();
    });
  };
  Object.keys(PDF_MODS).forEach((id) => {
    const p = $("#pane-" + id);
    if (p) new MutationObserver(cb).observe(p, { childList: true });
  });
}

/* ================= 周易 · 64 卦原文 ================= */
const ZYS = { sel: "111111", mv: [], q: "", tag: "" };
const zyLines = (id) => id.split("").map(Number);
function zyInfo(id) {
  const hi = hexInfo(zyLines(id));
  return Object.assign(
    {
      sym: hi.kw ? String.fromCodePoint(0x4dc0 + hi.kw - 1) : "",
      kw: hi.kw,
      full: hi.name,
      up: hi.up,
      lo: hi.lo,
      txt: hi.txt,
    },
    ZY_BY[id],
  );
}
function zyDraw(id, mv) {
  const l = zyLines(id);
  return `<span class="zyhx">${[5, 4, 3, 2, 1, 0].map((i) => `<i class="${l[i] ? "y" : "n"}${mv && mv.includes(i) ? " mv" : ""}"><b></b><b></b></i>`).join("")}</span>`;
}
const zyRev = (id) => id.split("").reverse().join(""),
  zyInv = (id) =>
    id
      .split("")
      .map((c) => (c === "1" ? "0" : "1"))
      .join(""),
  zyHu = (id) => {
    const l = zyLines(id);
    return [l[1], l[2], l[3], l[2], l[3], l[4]].join("");
  };
function zyOpen(lines, mv, tag) {
  ZYS.sel = lines.join("");
  ZYS.mv = mv || [];
  ZYS.tag = tag || "";
  selectTab("zy", false);
  renderZy();
  setTimeout(() => {
    try {
      navScroll("tabs");
    } catch (e) {}
  }, 40);
}
function renderZy() {
  const pane = $("#pane-zy");
  if (!pane) return;
  pane.dataset.built = "1";
  const info = zyInfo(ZYS.sel),
    order = [1, 2, 3, 4, 5, 6, 7, 8];
  const grid = order
    .map((u) =>
      order
        .map((l) => {
          const id = hexFromTri(u, l).join(""),
            z = ZY_BY[id];
          return `<button type="button" class="zyc${id === ZYS.sel ? " on" : ""}" data-id="${id}" title="${z.name}"><span>${String.fromCodePoint(0x4dc0 + hexInfo(zyLines(id)).kw - 1)}</span><em>${z.name}</em></button>`;
        })
        .join(""),
    )
    .join("");
  const q = ZYS.q.trim(),
    hits = q
      ? ZY_DATA.filter((r) =>
          (r[1] + r[2] + r[3] + r[4] + r[5].join("") + r[6].join("")).includes(q),
        ).slice(0, 24)
      : [];
  const yaoRows = info.yao
    .map((y, i) => {
      const isExtra = i === 6,
        mv = !isExtra && ZYS.mv.includes(i);
      return `<tr class="${mv ? "mv" : ""}${isExtra ? " extra" : ""}"><th>${isExtra ? (info.id === "111111" ? "用九" : "用六") : ZY_YAONAME[i] + "爻"}${mv ? "<em>动</em>" : ""}</th><td>${esc(y)}</td><td class="dim">${esc(info.xx[i] || "")}</td></tr>`;
    })
    .join("");
  const rel = [
    ["综卦(倒转)", zyRev(info.id)],
    ["错卦(阴阳互换)", zyInv(info.id)],
    ["互卦", zyHu(info.id)],
  ]
    .map(
      ([n, id]) =>
        `<button type="button" class="zyrel" data-id="${id}"><small>${n}</small><b>${ZY_BY[id].name}</b></button>`,
    )
    .join("");
  const idx = ZY_DATA.findIndex((r) => r[0] === info.id),
    prev = ZY_DATA[(idx + 63) % 64][0],
    next = ZY_DATA[(idx + 1) % 64][0];
  pane.innerHTML = `<div class="panel blk"><h3 class="sec">周易 · 六十四卦原文</h3>
  <p class="note" style="margin-top:0">收录各卦的卦辞、彖传、大象、爻辞与小象。文本为公有领域经典,仅供阅读对照;梅花、六爻、测字页里的“查看周易原文”会跳到这里,并标出动爻。原文古奥,理解时可参考本页“白话大意”之外的注本(见天机书院)。</p>
  <div class="zytop"><input type="search" id="zyQ" value="${esc(ZYS.q)}" placeholder="搜卦名或原文关键字,如 龙、利涉大川、君子" aria-label="搜索周易原文"><span class="dim sm" id="zyHit">${q ? `找到 ${ZY_DATA.filter((r) => (r[1] + r[2] + r[3] + r[4] + r[5].join("") + r[6].join("")).includes(q)).length} 卦` : ""}</span></div>
  ${hits.length ? `<div class="zyhits">${hits.map((r) => `<button type="button" class="zyrel" data-id="${r[0]}"><small>第${hexInfo(zyLines(r[0])).kw}卦</small><b>${r[1]}</b></button>`).join("")}</div>` : ""}
  <div class="zywrap"><div class="zygrid" role="grid" aria-label="六十四卦速查(行为上卦,列为下卦)"><div class="zyaxis"><span></span>${order.map((l) => `<span>${TRI[l].n}</span>`).join("")}</div>${order
    .map(
      (u, r) =>
        `<div class="zyrow"><span class="zyaxis2">${TRI[u].n}</span>${grid
          .split("</button>")
          .slice(r * 8, r * 8 + 8)
          .map((s) => s + "</button>")
          .join("")}</div>`,
    )
    .join("")}<p class="dim sm">行为上卦,列为下卦。</p></div>
  <div class="zydetail"><div class="zyhead"><div class="zysym">${info.sym}</div><div><div class="zyname">第 ${info.kw} 卦 · ${info.name}</div><div class="dim">${info.full}(上${TRI[info.up].n}${TRI[info.up].img} 下${TRI[info.lo].n}${TRI[info.lo].img})${info.txt ? " · " + esc(info.txt) : ""}</div></div>${zyDraw(info.id, ZYS.mv)}</div>
   ${ZYS.tag ? `<p class="note ok">来自「${esc(ZYS.tag)}」${ZYS.mv.length ? `,动爻:${ZYS.mv.map((i) => ZY_YAONAME[i] + "爻").join("、")}(下表高亮)` : ""}</p>` : ""}
   <h4 class="gl">卦辞</h4><p class="zytx">${esc(info.gua)}</p>
   <h4 class="gl">彖传</h4><p class="zytx">${esc(info.tuan)}</p>
   <h4 class="gl">大象</h4><p class="zytx">${esc(info.xiang)}</p>
   <h4 class="gl">爻辞 · 小象</h4><div class="tbl-wrap"><table class="tbl zyyao"><thead><tr><th>爻</th><th>爻辞</th><th>小象</th></tr></thead><tbody>${yaoRows}</tbody></table></div>
   <h4 class="gl">相关之卦</h4><div class="zyrels">${rel}</div>
   <div class="row3" style="margin-top:12px"><button class="gbtn sm" type="button" data-id="${prev}" id="zyPrev">← 上一卦</button><button class="gbtn sm" type="button" data-id="${next}" id="zyNext">下一卦 →</button></div></div></div>
  <p class="note">使用提示:梅花、六爻取“动爻”之辞为占断的重点之一;动爻不止一个时,六爻传统上另有取法(如本卦与变卦的卦辞、不动爻的取舍),本页只是原文对照,不替你断卦。</p></div>`;
  const sel = (id) => {
    ZYS.sel = id;
    ZYS.mv = [];
    ZYS.tag = "";
    renderZy();
  };
  $$(".zyc,.zyrel,#zyPrev,#zyNext", pane).forEach((b) => (b.onclick = () => sel(b.dataset.id)));
  const qi = $("#zyQ");
  qi.oninput = () => {
    ZYS.q = qi.value;
    const pos = qi.selectionStart;
    renderZy();
    const n = $("#zyQ");
    n.focus();
    try {
      n.setSelectionRange(pos, pos);
    } catch (e) {}
  };
}
/* 在梅花、六爻页加入“查看周易原文” */
function zyDecorate() {
  const add = (paneId, items, label) => {
    const pane = $("#" + paneId);
    if (!pane || pane.querySelector(".zylink")) return;
    const host = pane.querySelector(".panel.blk:last-of-type") || pane.querySelector(".panel.blk");
    if (!host) return;
    const d = document.createElement("div");
    d.className = "zylink";
    d.innerHTML = `<span class="dim sm">${label}</span>${items.map((it, i) => `<button type="button" class="gbtn sm" data-i="${i}">${it.t}</button>`).join("")}`;
    host.appendChild(d);
    $$("button", d).forEach(
      (b) =>
        (b.onclick = () => {
          const it = items[+b.dataset.i];
          zyOpen(it.lines, it.mv, it.tag);
        }),
    );
  };
  try {
    const m = R.mh;
    add(
      "pane-yi",
      [
        { t: `本卦「${m.ben.name}」`, lines: m.ben.lines, mv: [m.mv - 1], tag: "梅花易数 · 本卦" },
        { t: `互卦「${m.hu.name}」`, lines: m.hu.lines, mv: [], tag: "梅花易数 · 互卦" },
        { t: `变卦「${m.bian.name}」`, lines: m.bian.lines, mv: [], tag: "梅花易数 · 变卦" },
      ],
      "查看《周易》原文:",
    );
  } catch (e) {}
  try {
    const { lines, moving } = lyLinesFrom(R),
      bl = lines.slice();
    moving.forEach((i) => {
      bl[i] = 1 - bl[i];
    });
    add(
      "pane-liuyao",
      [{ t: "本卦原文", lines: lines, mv: moving.slice(), tag: "六爻 · 本卦" }].concat(
        moving.length ? [{ t: "变卦原文", lines: bl, mv: [], tag: "六爻 · 变卦" }] : [],
      ),
      "查看《周易》原文:",
    );
  } catch (e) {}
}

/* ================= 天机书院 · 功过格 ================= */
const LBK = "tianjipan.lib.v1",
  GGK = "tianjipan.gongguo.v1";
const LB = {
  cat: "all",
  lv: "all",
  st: "all",
  q: "",
  path: "",
  st_: {},
  notes: {},
  qi: -1,
  open: {},
};
(function () {
  try {
    const o = JSON.parse(localStorage.getItem(LBK) || "null");
    if (o) {
      LB.st_ = o.st || {};
      LB.notes = o.notes || {};
    }
  } catch (e) {}
})();
const lbSave = () => {
  try {
    localStorage.setItem(LBK, JSON.stringify({ st: LB.st_, notes: LB.notes }));
  } catch (e) {}
};
let GG = [];
try {
  GG = JSON.parse(localStorage.getItem(GGK) || "[]") || [];
} catch (e) {
  GG = [];
}
const ggSave = () => {
  try {
    localStorage.setItem(GGK, JSON.stringify(GG));
  } catch (e) {
    toast("当前环境不允许保存本地数据");
  }
};
const lbDay = () => {
  const n = nowBJ();
  return `${n.y}-${f2(n.m)}-${f2(n.d)}`;
};
const enc = encodeURIComponent;
function lbLinks(b) {
  const [id, t, a, e, c, l, s, tip, ct, wq] = b,
    q = t.replace(/[((].*$/, "").trim(),
    L = [];
  const dir = (LB_DIRECT[t] || []).concat((LB_NEW.find((n) => n.id === id) || { url: [] }).url);
  dir.forEach(([n, uu]) => L.push([n + (/\.pdf(\?|$)/i.test(uu) ? "(PDF)" : "") + " · 直达", uu]));
  if (ct) L.push(["中国哲学书电子化计划", ct]);
  if (wq)
    L.push([
      "维基文库",
      `https://zh.wikisource.org/w/index.php?title=Special:Search&search=${enc(wq)}&go=Go`,
    ]);
  if (c === "fo") L.push(["CBETA 电子佛典", "https://cbetaonline.dila.edu.tw/"]);
  L.push(["书格(古籍扫描)", `https://www.shuge.org/?s=${enc(q)}`]);
  L.push(["微信读书", `https://weread.qq.com/web/search/books?keyword=${enc(q)}`]);
  L.push([
    "豆瓣读书(找注本)",
    `https://book.douban.com/subject_search?search_text=${enc(q)}&cat=1001`,
  ]);
  L.push(["Internet Archive", `https://archive.org/search?query=${enc(q)}`]);
  return L;
}
function lbQuoteIdx() {
  const d = new Date(Date.now() + 8 * 3600e3),
    k = Math.floor(d.getTime() / 86400000);
  return ((k % LB_QUOTES.length) + LB_QUOTES.length) % LB_QUOTES.length;
}
function lbBookCard(b, step) {
  const [id, t, a, e, c, l, s, tip] = b,
    st = LB.st_[id] || "",
    note = LB.notes[id] || "",
    cat = LB_CATS.find((x) => x[0] === c)[1],
    open = !!LB.open[id];
  return `<article class="lbk${st ? " st-" + st : ""}" data-id="${id}"><div class="lbk-h">${step ? `<i class="lbk-n">${step}</i>` : ""}<div><h4>${esc(t)}</h4><div class="dim sm">${esc(a)} · ${esc(e)}</div></div><div class="lbk-p"><span class="pill">${cat}</span><span class="pill lv${l}">${LB_LV[l]}</span></div></div>
  <p class="lbk-s">${esc(s)}</p><p class="lbk-t"><b>从哪里开始:</b>${esc(tip)}</p>
  <div class="lbk-a"><select class="lbst" aria-label="阅读状态"><option value="">未标记</option><option value="want"${st === "want" ? " selected" : ""}>想读</option><option value="ing"${st === "ing" ? " selected" : ""}>在读</option><option value="done"${st === "done" ? " selected" : ""}>读完</option></select><button type="button" class="gbtn sm lbopen">${open ? "收起" : "在线阅读 · 笔记"}</button>${id === "zhouyi" ? '<button type="button" class="gbtn sm lbzy">打开本站《周易》原文</button>' : ""}</div>
  ${
    open
      ? `<div class="lbk-more">${lbStudyHTML(b)}<div class="lbk-links">${lbLinks(b)
          .map(
            ([n, u]) =>
              `<a class="lk" href="${u}" target="_blank" rel="noopener noreferrer">${n} ↗</a>`,
          )
          .join(
            "",
          )}</div><textarea class="lbnote" rows="2" placeholder="读书笔记(只保存在本机)" maxlength="600">${esc(note)}</textarea></div>`
      : ""
  }</article>`;
}
function lbStudyHTML(b) {
  const st = LB_STUDY[b[1]] || (LB_NEW.find((n) => n.id === b[0]) || {}).study;
  if (!st || (!st.ch.length && !st.pr)) return "";
  return `<div class="lbstudy">${st.fo ? `<p><b>读法:</b>${esc(st.fo)}</p>` : ""}${st.ch.length ? `<p><b>建议章节:</b>${st.ch.map(esc).join(";")}</p>` : ""}${st.pr ? `<p><b>践行练习:</b>${esc(st.pr)}</p>` : ""}${st.ed ? `<p class="dim sm">版本:${esc(st.ed)}</p>` : ""}</div>`;
}
function lbList() {
  let arr = LB_BOOKS.slice();
  const pth = LB.path && LB_PATHS.find((p) => p.k === LB.path);
  if (pth)
    return pth.ids
      .map((id, i) =>
        lbBookCard(
          LB_BOOKS.find((b) => b[0] === id),
          i + 1,
        ),
      )
      .join("");
  if (LB.cat !== "all") arr = arr.filter((b) => b[4] === LB.cat);
  if (LB.lv !== "all") arr = arr.filter((b) => String(b[5]) === LB.lv);
  if (LB.st !== "all") arr = arr.filter((b) => (LB.st_[b[0]] || "") === LB.st);
  const q = LB.q.trim();
  if (q) arr = arr.filter((b) => (b[1] + b[2] + b[3] + b[6]).includes(q));
  return arr.map((b) => lbBookCard(b)).join("") || '<p class="dim">没有符合条件的书。</p>';
}
/* ---- 功过格 ---- */
function ggStats() {
  const today = lbDay(),
    by = {};
  GG.forEach((x) => {
    by[x.d] = by[x.d] || { g: 0, o: 0, n: [] };
    by[x.d][x.k === "g" ? "g" : "o"] += x.n;
    by[x.d].n.push(x);
  });
  const days = [];
  for (let i = 29; i >= 0; i--) {
    const t = new Date(Date.now() + 8 * 3600e3 - i * 86400000),
      k = `${t.getUTCFullYear()}-${f2(t.getUTCMonth() + 1)}-${f2(t.getUTCDate())}`;
    days.push({
      k,
      m: t.getUTCMonth() + 1,
      d: t.getUTCDate(),
      ...(by[k] || { g: 0, o: 0, n: [] }),
    });
  }
  let streak = 0;
  for (let i = days.length - 1; i >= 0; i--) {
    if (days[i].g + days[i].o > 0) streak++;
    else if (i === days.length - 1) continue;
    else break;
  }
  return {
    today,
    by,
    days,
    streak,
    tg: days.reduce((a, d) => a + d.g, 0),
    to: days.reduce((a, d) => a + d.o, 0),
    t: by[today] || { g: 0, o: 0, n: [] },
  };
}
function ggHTML() {
  const S = ggStats(),
    mx = Math.max(3, ...S.days.map((d) => Math.max(d.g, d.o)));
  const san = JSON.parse(localStorage.getItem("tianjipan.san." + S.today) || "[0,0,0]"),
    san2 = JSON.parse(localStorage.getItem("tianjipan.san2." + S.today) || "[]");
  const chart = `<div class="ggbars">${S.days.map((d) => `<div class="ggb" title="${d.m}/${d.d} 功 ${d.g} · 过 ${d.o}"><div class="ggu"><i class="g" style="height:${(d.g / mx) * 100}%"></i></div><div class="ggd"><i class="o" style="height:${(d.o / mx) * 100}%"></i></div></div>`).join("")}</div>`;
  const todayList =
    S.t.n
      .slice()
      .reverse()
      .map(
        (x) =>
          `<li class="${x.k === "g" ? "good" : "bad"}"><b>${x.k === "g" ? "功" : "过"} +${x.n}</b> ${esc(x.c)}${x.note ? " · " + esc(x.note) : ""} <button type="button" class="lnk" data-del="${x.id}">删除</button></li>`,
      )
      .join("") || '<li class="dim">今天还没有记录。</li>';
  return `<div class="panel blk" id="lbGG"><h3 class="sec">功过格 · 每日自省</h3>
  <p class="note" style="margin-top:0">功过格是明清士人自省修德的方法,《了凡四训》里记袁了凡正是靠它改过积善。做法很简单:每天晚上回想一遍,做了什么算功,犯了什么算过,各记几分。目的不是给自己打分,而是看见自己。数据只存在这台设备上。</p>
  <h4 class="gl">今日三省</h4><div class="lbsan">${LB_SAN.map((q, i) => `<label class="chk"><input type="checkbox" data-san="${i}"${san[i] ? " checked" : ""}> ${esc(q)}</label>`).join("")}</div>
  <h4 class="gl">日课 · 三问</h4><div class="lbsan2">${[
    ["觉察", "今天哪一刻,情绪或习惯替我作了决定?"],
    ["修德", "有什么承诺、误解或疏漏,可以主动补好?"],
    ["践行", "明天在什么时间,做哪一件可完成的小事?"],
  ]
    .map(
      ([k, q], i) =>
        `<label><b>${k}</b> ${q}<textarea rows="2" maxlength="300" data-san2="${i}">${esc(san2[i] || "")}</textarea></label>`,
    )
    .join(
      "",
    )}</div><p class="note">日课侧重觉察、诚信、克制与善待他人。经典中的报应、宿命与苦行叙事按历史宗教语境阅读,不把疾病或遭遇归责于个人德行,也不把积善换算成运势分数。</p>
  <h4 class="gl">记一笔</h4><div class="ggform"><select id="ggK"><option value="g">功(做得好的)</option><option value="o">过(要改的)</option></select><select id="ggC">${LB_GONG.map((c) => `<option>${c}</option>`).join("")}</select><select id="ggN"><option>1</option><option>2</option><option>3</option></select><input type="text" id="ggNote" maxlength="40" placeholder="一句话说明(可空)"><button class="gbtn" id="ggAdd" type="button">记录</button></div>
  <h4 class="gl">今天 · 功 ${S.t.g} / 过 ${S.t.o}</h4><ul class="cul ggl">${todayList}</ul>
  <h4 class="gl">近 30 天</h4>${chart}<div class="kv" style="margin-top:6px"><span>累计功 <b class="good">${S.tg}</b></span><span>累计过 <b class="bad">${S.to}</b></span><span>连续记录 <b>${S.streak}</b> 天</span></div>
  <p class="note">图中上半是功、下半是过。比起分数多少,更有意义的是趋势:过是否在减少,功是否更自然。袁了凡的做法是对着自己的“过”下决心改,而不是靠自责。</p>
  <div class="row3"><button class="gbtn sm" id="ggCsv" type="button">导出记录</button><button class="gbtn sm" id="ggClr" type="button">清空全部</button></div></div>`;
}
function lbPathsHTML() {
  const idOf = (t) => (LB_BOOKS.find((b) => b[1] === t) || [])[0],
    tabOK = (r) => {
      const t = LB_ROUTE_TAB[r];
      return t && $("#pane-" + t) ? t : null;
    };
  return `<div class="panel blk"><h3 class="sec">研习路径 · 每一步带一个练习</h3><p class="note" style="margin-top:0">来自参考版的研习安排:每次读一小段,记一个问题,做一件具体的事,不以读完数量衡量。</p><div class="lbpp">${LB_PATHS2.map((p) => `<details class="lbpd"><summary><b>${esc(p.n)}</b><small>${p.steps.length} 步</small></summary><p class="dim sm">${esc(p.d)}</p><ol>${p.steps.map((s) => `<li><b>${esc(s.t)}</b>${idOf(s.t) ? ` <button type="button" class="lnk" data-find="${esc(s.t)}">查看书目</button>` : ""}<br><span class="dim">读:${esc(s.ch)}</span><br><span>练:${esc(s.task)}</span></li>`).join("")}</ol></details>`).join("")}</div></div>
  <div class="panel blk"><h3 class="sec">从经典到工具 · 研习与复核索引</h3><p class="note" style="margin-top:0">每个术数模块对应应读的原典。读完再回到盘面,分别核对“可计算的事实”“传统的解释”与“现实的行动”。</p><div class="lbmx">${LB_METHODS.map(
    (m) => {
      const t = tabOK(m.r);
      return `<div class="lbm"><b>${esc(m.n)}</b><small class="dim">${esc(m.fo)}</small><div class="lbm-b">${m.bk.map((x) => `<button type="button" class="chip" data-find="${esc(x)}">${esc(x)}</button>`).join("") || '<span class="dim sm">暂无推荐原典</span>'}</div><small class="dim">${esc(m.sc)}</small>${t ? `<button type="button" class="gbtn sm" data-go="${t}">去这个模块</button>` : ""}</div>`;
    },
  ).join("")}</div></div>`;
}
function renderLib() {
  const pane = $("#pane-lib");
  if (!pane) return;
  pane.dataset.built = "1";
  if (LB.qi < 0) LB.qi = lbQuoteIdx();
  const qt = LB_QUOTES[LB.qi];
  const pth = LB.path && LB_PATHS.find((p) => p.k === LB.path);
  pane.innerHTML = `<div class="panel blk"><h3 class="sec">天机书院 · 经典与修习</h3>
   <div class="lbq"><div class="lbq-t">“${esc(qt[0])}”</div><div class="lbq-a">—— ${esc(qt[1])}<button type="button" class="lnk" id="lbQn">换一句</button></div></div>
   <p class="note">这里整理了与传统命理、易学、术数,以及修心修德相关的经典书目,每本都给出简介、读法和在线阅读的入口(点开后在新窗口打开外部网站)。本站不存放书籍正文。书目里“旧题”表示托名或作者有争议。</p>
   <h4 class="gl">阅读路径</h4><div class="lbpaths">${LB_PATHS.map((p) => `<button type="button" class="lbpath${LB.path === p.k ? " on" : ""}" data-p="${p.k}"><b>${p.n}</b><small>${p.d}</small><em>${p.ids.length} 本</em></button>`).join("")}</div>
   ${pth ? `<p class="note ok">正在按“${pth.n}”的顺序显示,编号是建议的阅读次序。<button type="button" class="lnk" id="lbPClr">查看全部书目</button></p>` : `<div class="lbfilter"><input type="search" id="lbQ" value="${esc(LB.q)}" placeholder="搜书名、作者、关键词" aria-label="搜索书目"><select id="lbCat"><option value="all">全部类别</option>${LB_CATS.map(([k, n]) => `<option value="${k}"${LB.cat === k ? " selected" : ""}>${n}</option>`).join("")}</select><select id="lbLv"><option value="all">全部难度</option>${LB_LV.map((n, i) => `<option value="${i}"${LB.lv === String(i) ? " selected" : ""}>${n}</option>`).join("")}</select><select id="lbSt"><option value="all">全部状态</option><option value="want"${LB.st === "want" ? " selected" : ""}>想读</option><option value="ing"${LB.st === "ing" ? " selected" : ""}>在读</option><option value="done"${LB.st === "done" ? " selected" : ""}>读完</option></select></div>`}
   <div class="lbgrid" id="lbList">${lbList()}</div></div>
   ${lbPathsHTML()}${knHTML()}
   ${ggHTML()}
   <div class="panel blk"><h3 class="sec">在线阅读站点</h3><div class="lbsites">${LB_SITES.map((s) => `<a class="lbsite" href="${s.u}" target="_blank" rel="noopener noreferrer"><b>${s.n} ↗</b><small>${s.d}</small></a>`).join("")}</div>
   <p class="note">外部网站的内容、可用性与收费由各站自行决定,链接可能随对方改版而失效。“搜索”类链接会带着书名跳到对方站内的搜索页。读古籍时,建议同时对照一两种有注释的现代注本。</p></div>`;
  const redo = () => {
    $("#lbList").innerHTML = lbList();
    bindList();
  };
  const bindList = () => {
    $$(".lbst", pane).forEach(
      (s) =>
        (s.onchange = () => {
          const id = s.closest(".lbk").dataset.id;
          if (s.value) LB.st_[id] = s.value;
          else delete LB.st_[id];
          lbSave();
          s.closest(".lbk").className = "lbk" + (s.value ? " st-" + s.value : "");
        }),
    );
    $$(".lbopen", pane).forEach(
      (b) =>
        (b.onclick = () => {
          const id = b.closest(".lbk").dataset.id;
          LB.open[id] = !LB.open[id];
          redo();
        }),
    );
    $$(".lbnote", pane).forEach(
      (t) =>
        (t.oninput = () => {
          const id = t.closest(".lbk").dataset.id;
          LB.notes[id] = t.value;
          lbSave();
        }),
    );
    $$(".lbzy", pane).forEach(
      (b) =>
        (b.onclick = () => {
          ZYS.sel = "111111";
          ZYS.mv = [];
          ZYS.tag = "";
          selectTab("zy", false);
          renderZy();
        }),
    );
  };
  $("#lbQn").onclick = () => {
    LB.qi = (LB.qi + 1) % LB_QUOTES.length;
    renderLib();
  };
  $$(".lbpath", pane).forEach(
    (b) =>
      (b.onclick = () => {
        LB.path = LB.path === b.dataset.p ? "" : b.dataset.p;
        renderLib();
      }),
  );
  const pc = $("#lbPClr");
  if (pc)
    pc.onclick = () => {
      LB.path = "";
      renderLib();
    };
  const q = $("#lbQ");
  if (q) {
    q.oninput = () => {
      LB.q = q.value;
      redo();
    };
    $("#lbCat").onchange = (e) => {
      LB.cat = e.target.value;
      redo();
    };
    $("#lbLv").onchange = (e) => {
      LB.lv = e.target.value;
      redo();
    };
    $("#lbSt").onchange = (e) => {
      LB.st = e.target.value;
      redo();
    };
  }
  bindList();
  $$("[data-find]", pane).forEach(
    (b) =>
      (b.onclick = () => {
        LB.path = "";
        LB.q = b.dataset.find.replace(/[((].*$/, "");
        LB.cat = "all";
        LB.lv = "all";
        LB.st = "all";
        const id = (LB_BOOKS.find((x) => x[1] === b.dataset.find) || [])[0];
        if (id) LB.open[id] = true;
        renderLib();
        const q = $("#lbQ");
        if (q) q.scrollIntoView({ behavior: "smooth", block: "center" });
      }),
  );
  $$("[data-go]", pane).forEach((b) => (b.onclick = () => selectTab(b.dataset.go, true)));
  try {
    knBind();
  } catch (e) {
    console.error(e);
  }
  $$("[data-san]", pane).forEach(
    (c) =>
      (c.onchange = () => {
        const k = "tianjipan.san." + lbDay(),
          v = JSON.parse(localStorage.getItem(k) || "[0,0,0]");
        v[+c.dataset.san] = c.checked ? 1 : 0;
        try {
          localStorage.setItem(k, JSON.stringify(v));
        } catch (e) {}
      }),
  );
  $$("[data-san2]", pane).forEach(
    (t) =>
      (t.oninput = () => {
        const k = "tianjipan.san2." + lbDay(),
          v = JSON.parse(localStorage.getItem(k) || "[]");
        v[+t.dataset.san2] = t.value;
        try {
          localStorage.setItem(k, JSON.stringify(v));
        } catch (e) {}
      }),
  );
  $("#ggAdd").onclick = () => {
    const k = $("#ggK").value,
      c = $("#ggC").value,
      n = +$("#ggN").value,
      note = $("#ggNote").value.trim();
    GG.push({
      id: "g" + Date.now().toString(36) + Math.random().toString(36).slice(2, 4),
      d: lbDay(),
      t: Date.now(),
      k,
      c,
      n,
      note,
    });
    ggSave();
    renderLib();
    toast(k === "g" ? "已记一功" : "已记一过,记下来就是改的开始");
  };
  $("#ggK").onchange = () => {
    const k = $("#ggK").value;
    $("#ggC").innerHTML = (k === "g" ? LB_GONG : LB_GUO)
      .map((c) => `<option>${c}</option>`)
      .join("");
  };
  $$("[data-del]", pane).forEach(
    (b) =>
      (b.onclick = () => {
        GG = GG.filter((x) => x.id !== b.dataset.del);
        ggSave();
        renderLib();
      }),
  );
  $("#ggCsv").onclick = () => {
    const rows = ["日期,类型,类别,分数,说明"].concat(
      GG.slice()
        .sort((a, b) => a.t - b.t)
        .map(
          (x) =>
            `${x.d},${x.k === "g" ? "功" : "过"},${x.c},${x.n},${(x.note || "").replace(/[,\n]/g, " ")}`,
        ),
    );
    saveFile(`功过格-${lbDay()}.csv`, "\ufeff" + rows.join("\n"));
  };
  $("#ggClr").onclick = () => {
    const b = $("#ggClr");
    if (b.dataset.c === "1") {
      GG = [];
      ggSave();
      renderLib();
      toast("已清空");
      return;
    }
    b.dataset.c = "1";
    b.textContent = "再点一次确认清空";
    setTimeout(() => {
      if (b.isConnected) {
        b.dataset.c = "";
        b.textContent = "清空全部";
      }
    }, 3000);
  };
}

/* ================= 命理小工具 · 梅花多法 · 紫微流月流日 · 八字流日流时 ================= */
const TL = { who: "cur", ne: "", nek: "phone", ks: null, mh: { mode: "two", v: ["", "", ""] } };
const tlChartOf = (id) => {
  if (id === "cur")
    return R
      ? {
          R,
          name: (($("#pname") && $("#pname").value) || "").trim() || "当前命盘",
          male: R.opt.gender === "M",
        }
      : null;
  const p = PPL.people.find((x) => x.id === id);
  if (!p) return null;
  const d = pplDerive(p);
  return d ? { R: d.R, name: p.name, male: p.gender === "1" } : null;
};
function tlWho(sel) {
  const list = ftPersons();
  if (!list.some((x) => x.id === TL.who)) TL.who = "cur";
  return `<select id="${sel}">${list.map((x) => `<option value="${x.id}"${x.id === TL.who ? " selected" : ""}>${esc(x.label)}</option>`).join("")}</select>`;
}
const tlNum = (n) => n.replace(/\d/g, (c) => `<i class="nd n${c}">${c}</i>`);
function cgHTML(ch) {
  const R0 = ch.R,
    l = R0.lunar,
    hb = R0.bz.pill[3].b,
    r = cgCalc(l.year, l.month, l.day, hb),
    yb = r.yi;
  const row = (k, v, t) => `<tr><th>${k}</th><td>${t}</td><td><b>${cgLiang(v)}</b></td></tr>`;
  return `<div class="cgres"><div class="cgbig"><b>${cgLiang(r.tot)}</b><small>骨重</small></div><div><div class="cgping">${esc(r.song[1])}</div><div class="cgsong">${esc(r.song[2]).replace(/；/g, "；<br>")}</div></div></div>
  <table class="tbl sm cgt"><tbody>${row("年", r.y, `农历${l.year}年 ${gz(yb)}`)}${row("月", r.m, `农历${l.isLeap ? "闰" : ""}${l.month}月`)}${row("日", r.d, `农历${l.day}日`)}${row("时", r.h, `${ZHI[hb]}时`)}</tbody></table>
  <p class="note">称骨法相传出自唐代袁天罡,把生辰的年、月、日、时各折成骨重相加,再查“称骨歌”。它是民间流传的简易算命法,歌诀措辞较绝对(尤其轻重两端),与八字、紫微等体系的推演逻辑完全不同,也没有外部标准可验证。请当作民俗文化材料阅读,不要据此断定人生。年骨按农历年、月日按农历,${l.isLeap ? "闰月按本月计;" : ""}晚子时按当日子时。不同版本个别数值略有出入(如己丑年 7 或 8 钱),这里取 7 钱。</p>`;
}
function neHTML() {
  const a = TL.ne ? neAnalyze(TL.ne, TL.nek) : null;
  if (!a) return '<p class="dim">输入数字后自动分析。</p>';
  if (a.err) return `<p class="note bad">${a.err}</p>`;
  const col = (s) => (NE_ST[s].t === "吉" ? "good" : NE_ST[s].t === "凶" ? "bad" : "mid");
  return `<div class="nedig">${[...a.digits].map((c, i) => `<i class="nd n${c}${a.digits.length - i <= 4 ? " last" : ""}">${c}</i>`).join("")}</div>${a.note ? `<p class="dim sm">${a.note}</p>` : ""}
  <div class="nepairs">${a.pairs.map((p) => `<span class="nep ${col(p.star)}${p.last ? " last" : ""}" title="${p.star}:${esc(NE_ST[p.star].d)}"><b>${p.a}${p.b}</b><em>${p.star}</em>${p.amp ? "<small>5</small>" : ""}</span>`).join("") || '<span class="dim">没有可组合的数对(只有 0 和 5)</span>'}</div>
  <div class="kv" style="margin:10px 0"><span>整体倾向 <b class="${a.idx >= 0.3 ? "good" : a.idx <= -0.3 ? "bad" : ""}">${a.lv}</b></span><span>末四位:${a.last4.length ? a.last4.join("、") : "—"}</span><span>数字 0:${a.n0} 个 · 数字 5:${a.n5} 个</span></div>
  <h4 class="gl">星的构成</h4><div class="necnt">${a.top.map(([k, v]) => `<div class="nec ${col(k)}"><b>${k}</b><span>×${v}</span><small>${esc(NE_ST[k].d)}</small></div>`).join("") || '<p class="dim">无</p>'}</div>`;
}
function ksHTML(ch) {
  const R0 = ch.R,
    c = R0.t.civ,
    py = R0.bz.pill[0],
    iy = ganzhiIdx(py.s, py.b),
    yearNum = (((c.y - 4) % 60) + 60) % 60 === iy ? c.y : c.y - 1,
    mb = R0.bz.pill[1].b,
    mi = (mb - 2 + 12) % 12;
  const ben = ksBenming(yearNum, ch.male),
    yue = ksYueming(py.b, mi),
    B = KS_INFO[ben],
    Y = KS_INFO[yue],
    ny = nowBJ().y,
    dirs = ksYearDirs(ny),
    star = KS_INFO[dirs.star];
  const rel = KS_REL(B.wx, star.wx);
  const card = (t, I, n) =>
    `<div class="ksc wx${I.wx}"><small>${t}</small><div class="ksn">${I.n}</div><div class="dim sm">${I.g}宫 · ${I.dir}</div><p>${esc(I.d)}</p></div>`;
  return `<div class="kscards">${card("本命星(性格根基)", B)}${card("月命星(处世与内在)", Y)}</div>
  <h4 class="gl">${ny}年流年星与方位</h4><p class="rt">${ny}年中宫为 <b>${star.n}</b>,与你的本命星(${B.n})五行关系:<b>${rel}</b>。${rel.startsWith("相生") ? "流年星与本命星相生,传统看法偏有助力。" : rel.startsWith("相克") ? "流年星与本命星相克,传统看法偏有压力,宜稳。" : "同气,偏于平稳放大自身特质。"}</p>
  <div class="kv"><span>五黄煞:${dirs.wuhuang != null ? PDIR[dirs.wuhuang] + " (" + PNAME[dirs.wuhuang] + ")" : "中宫"}</span><span>暗剑煞:${dirs.anjian != null ? PDIR[dirs.anjian] : "—"}</span><span>太岁方:${dirs.taisui}</span><span>岁破方:${dirs.suipo}</span></div>
  <p class="note">九星气学是日本在传统九宫、玄空基础上发展出的体系。本命星按立春为界的出生年算:男 11 减年份数根,女数根加 4(超过 9 减 9);月命星按年支三组与月序逆推。五黄、暗剑、太岁、岁破的方位传统上宜静不宜动(如动土、大型装修),这是民俗提示,不必过度解读。各流派对星的性格描述差别很大,这里是通行的概括。</p>`;
}
function renderTools() {
  const pane = $("#pane-tools");
  if (!pane) return;
  pane.dataset.built = "1";
  const ch = tlChartOf(TL.who);
  pane.innerHTML = `<div class="panel blk"><h3 class="sec">命理小工具</h3><p class="note" style="margin-top:0">三个独立的小工具:称骨、数字能量、九星气学。它们源自民间或近现代,体系比八字、紫微更松散,请当作文化材料与趣味参考。</p>
  <div class="row3"><label class="sm dim">为谁看(称骨与九星) ${tlWho("tlWho")}</label></div></div>
  <div class="panel blk"><h3 class="sec">袁天罡称骨</h3><div id="cgBox">${ch ? cgHTML(ch) : '<p class="dim">请先填写出生信息并推演。</p>'}</div></div>
  <div class="panel blk"><h3 class="sec">数字能量(数字易经)</h3>
   <div class="nmform"><label>类型<select id="neK"><option value="phone"${TL.nek === "phone" ? " selected" : ""}>手机号</option><option value="plate"${TL.nek === "plate" ? " selected" : ""}>车牌数字</option><option value="door"${TL.nek === "door" ? " selected" : ""}>门牌/房号</option><option value="pin"${TL.nek === "pin" ? " selected" : ""}>密码/其他</option></select></label><label>数字<input type="text" id="neN" value="${esc(TL.ne)}" maxlength="24" inputmode="numeric" placeholder="如 13812349085" autocomplete="off"></label></div>
   <div id="neBox">${neHTML()}</div>
   <details class="ai-set"><summary>八星对照表</summary><div class="necnt">${Object.entries(NE_ST)
     .map(
       ([k, v]) =>
         `<div class="nec ${v.t === "吉" ? "good" : v.t === "凶" ? "bad" : "mid"}"><b>${k}</b><span>${v.pairs
           .slice(0, 4)
           .map((p) => p[0] + "" + p[1])
           .join(" ")}${k === "伏位" ? " …" : ""}</span><small>${esc(v.d)}</small></div>`,
     )
     .join("")}</div></details>
   <p class="note">数字能量学是近几十年流行的民间体系,把相邻两个数字组成“磁场”,分为天医、延年、生气、伏位(多偏吉或平)与绝命、祸害、五鬼、六煞(多偏凶)。这里的算法:相邻数字两两成对(0 与 5 不参与组合,其中夹着 5 的数对标“5”表示被放大),末四位权重更高,按各星权重得整体倾向。各家对 0 与 5 的处理不一,结果没有经典依据,也没有验证,更不应据此挑选或放弃号码。</p></div>
  <div class="panel blk"><h3 class="sec">九星气学</h3><div id="ksBox">${ch ? ksHTML(ch) : '<p class="dim">请先填写出生信息并推演。</p>'}</div></div>`;
  $("#tlWho").onchange = (e) => {
    TL.who = e.target.value;
    renderTools();
  };
  $("#neK").onchange = (e) => {
    TL.nek = e.target.value;
    $("#neBox").innerHTML = neHTML();
  };
  $("#neN").oninput = (e) => {
    TL.ne = e.target.value;
    $("#neBox").innerHTML = neHTML();
  };
}
/* ---------- 梅花 · 多种起卦法 ---------- */
function mhExtraHTML() {
  const M = TL.mh,
    fields = {
      two: ["第一个数", "第二个数"],
      three: ["上卦数", "下卦数", "动爻数"],
      one: ["一个数"],
      digits: ["一串数字"],
    }[M.mode];
  return `<div class="panel blk mhx"><h3 class="sec">梅花易数 · 数字起卦</h3><p class="note" style="margin-top:0">不用时间,而用你心中浮现的数字起卦。传统上提倡“心有所动、即时报数”,不要反复挑选。</p>
  <div class="nmform"><label>方式<select id="mhxM"><option value="two"${M.mode === "two" ? " selected" : ""}>两数起卦</option><option value="three"${M.mode === "three" ? " selected" : ""}>三数起卦</option><option value="one"${M.mode === "one" ? " selected" : ""}>单数起卦</option><option value="digits"${M.mode === "digits" ? " selected" : ""}>数字串起卦</option></select></label>${fields.map((f, i) => `<label>${f}<input type="text" class="mhxv" data-i="${i}" value="${esc(M.v[i] || "")}" inputmode="numeric" maxlength="12" placeholder="例如 ${[17, 38, 5][i] || 9}"></label>`).join("")}<button class="gbtn primary" id="mhxGo" type="button">起卦</button></div><div id="mhxOut"></div></div>`;
}
function mhxRun() {
  const M = TL.mh,
    vals = M.v
      .slice(0, { two: 2, three: 3, one: 1, digits: 1 }[M.mode])
      .map((s) => String(s).trim());
  if (vals.some((s) => !/^\d+$/.test(s))) {
    $("#mhxOut").innerHTML = '<p class="note bad">请填写完整的正整数。</p>';
    return;
  }
  const hb = R.bz.pill[3].b,
    r = mhCast(M.mode, M.mode === "digits" ? [vals[0]] : vals.map(Number), hb),
    ty = r.tiyong;
  $("#mhxOut").innerHTML =
    `<div class="cz-hex"><div><small>本卦</small><b>${r.ben.name}</b></div><div><small>互卦</small><b>${r.hu.name}</b></div><div><small>变卦</small><b>${r.bian.name}</b></div><div><small>体用</small><b>${ty[0]}</b><em>${ty[1]}</em></div></div>
  <p class="rt">${esc(r.how)}。体为${TRI[r.ti].n}(${NM_WXN[TRI[r.ti].wx]}),用为${TRI[r.yong].n}(${NM_WXN[TRI[r.yong].wx]}):${esc(ty[2])}</p>
  <div class="zylink"><span class="dim sm">查看《周易》原文:</span><button type="button" class="gbtn sm" data-k="b">本卦「${r.ben.name}」</button><button type="button" class="gbtn sm" data-k="h">互卦「${r.hu.name}」</button><button type="button" class="gbtn sm" data-k="v">变卦「${r.bian.name}」</button></div>`;
  $$("#mhxOut [data-k]").forEach(
    (b) =>
      (b.onclick = () => {
        const k = b.dataset.k;
        zyOpen(
          k === "b" ? r.ben.lines : k === "h" ? r.hu.lines : r.bian.lines,
          k === "b" ? [r.mv - 1] : [],
          "梅花数字起卦 · " + { b: "本卦", h: "互卦", v: "变卦" }[k],
        );
      }),
  );
}
function mhxBind() {
  const h = $(".mhx");
  if (!h) return;
  let busy = false;
  $("#mhxM").onchange = (e) => {
    if (busy || !h.isConnected) return;
    busy = true;
    TL.mh.mode = e.target.value;
    const old = h;
    const n = document.createElement("div");
    n.innerHTML = mhExtraHTML();
    old.replaceWith(n.firstElementChild);
    mhxBind();
  };
  $$(".mhxv", h).forEach(
    (i) =>
      (i.oninput = () => {
        TL.mh.v[+i.dataset.i] = i.value;
      }),
  );
  $("#mhxGo").onclick = mhxRun;
}
/* ---------- 紫微 · 流月流日 ---------- */
const FL = { y: null, m: 1, d: null };
function flZwHTML() {
  const zw = R.zw,
    lunar = R.lunar,
    hb = R.bz.pill[3].b,
    y = FL.y || nowBJ().y,
    m = zfMonths(zw, lunar, hb, y),
    cur = m.list[Math.min(11, Math.max(0, FL.m - 1))],
    days = zfDays(zw, cur.b, 30);
  const nowM = (() => {
    const n = nowBJ();
    return y === n.y ? Math.min(12, Math.max(1, (R.lunar && nowLunarMonth()) || 1)) : 0;
  })();
  const starsOf = (p) =>
    p.stars
      .filter((s) => s.t === "main")
      .map((s) => s.n)
      .join("") || "空宫(借对宫)";
  return `<div class="panel blk fl-zw"><h3 class="sec">紫微 · 流月 · 流日(斗君法)</h3>
  <div class="nmform"><label>流年<input type="number" id="flY" min="1902" max="2098" value="${y}"></label><label>看第几个月<select id="flM">${ZF_MON.map((n, i) => `<option value="${i + 1}"${FL.m === i + 1 ? " selected" : ""}>${n}月</option>`).join("")}</select></label></div>
  <p class="rt">${y}年(${gz((((y - 4) % 60) + 60) % 60)})斗君落 <b>${zfPalAt(zw, m.dj).name}宫(${ZHI[m.dj]})</b>。以斗君为流年正月,顺行排出各流月的命宫;各月命宫的宫干飞出四化,落入的宫位就是该月牵动的领域。</p>
  <div class="tbl-wrap"><table class="tbl sm"><thead><tr><th>流月</th><th>命宫落</th><th>宫干</th><th>主星</th><th>四化飞入(星@本命宫)</th></tr></thead><tbody>${m.list.map((x) => `<tr class="${x.k === FL.m ? "on" : ""}" data-k="${x.k}"><th>${x.name}</th><td>${x.pal.name}宫 ${ZHI[x.b]}</td><td>${GAN[x.stem]}</td><td>${starsOf(x.pal)}</td><td>${x.sh.map((s) => `<span class="${s.h === "忌" ? "bad" : s.h === "禄" ? "good" : ""}">${s.h}${s.star}@${s.pal}</span>`).join(" ")}</td></tr>`).join("")}</tbody></table></div>
  <h4 class="gl">${cur.name} · 逐日命宫(初一至三十)</h4><div class="fldays">${days.map((x) => `<span title="${x.pal.name}宫"><b>${x.d}</b>${x.pal.name.slice(0, 2)}</span>`).join("")}</div>
  <p class="note">斗君法:从流年太岁所在宫起,逆数至生月(农历月),再顺数至生时,所得即斗君;斗君作正月,顺行得各月命宫,流月命宫作初一再顺行得流日。紫微各派对流月流日的取法并不统一,此为较通行的一种,宫位与四化仅作观察用,不是吉凶断语。${R.lunar ? "" : ""}</p></div>`;
}
function nowLunarMonth() {
  try {
    const n = nowBJ(),
      r = computeAll(
        { y: n.y, m: n.m, d: n.d, h: 12, mi: 0, s: 0 },
        { gender: R.opt.gender, solar: false, lon: R.opt.lon },
      );
    return r.lunar.month;
  } catch (e) {
    return 1;
  }
}
function flZwBind() {
  const h = $(".fl-zw");
  if (!h) return;
  let busy = false;
  const redo = () => {
    if (busy || !h.isConnected) return;
    busy = true;
    const n = document.createElement("div");
    n.innerHTML = flZwHTML();
    h.replaceWith(n.firstElementChild);
    flZwBind();
  };
  $("#flY").onchange = (e) => {
    FL.y = Math.max(1902, Math.min(2098, +e.target.value || nowBJ().y));
    redo();
  };
  $("#flM").onchange = (e) => {
    FL.m = +e.target.value;
    redo();
  };
  $$("tbody tr", h).forEach(
    (tr) =>
      (tr.onclick = () => {
        FL.m = +tr.dataset.k;
        redo();
      }),
  );
}
/* ---------- 八字 · 流日 · 流时 ---------- */
const FD = { y: null, m: null, d: null };
function flBzHTML() {
  const n = nowBJ();
  if (!FD.y) {
    FD.y = n.y;
    FD.m = n.m;
    FD.d = n.d;
  }
  const { y, m } = FD,
    dim = new Date(y, m, 0).getDate(),
    first = new Date(Date.UTC(y, m - 1, 1)).getUTCDay(),
    days = [];
  for (let d = 1; d <= dim; d++) days.push(bzDayFlow(R.bz, R.deep, y, m, d));
  const sel = Math.min(FD.d, dim),
    df = days[sel - 1],
    hours = bzHourFlow(R.bz, R.deep, df.idx);
  const cls = (v) =>
    v >= 0.85 ? "g2" : v >= 0.3 ? "g1" : v > -0.3 ? "g0" : v > -0.85 ? "b1" : "b2";
  const cells = [
    ...Array(first).fill('<span class="fdc empty"></span>'),
    ...days.map(
      (x) =>
        `<button type="button" class="fdc ${cls(x.sc)}${x.d === sel ? " on" : ""}${y === n.y && m === n.m && x.d === n.d ? " today" : ""}" data-d="${x.d}" title="${x.gz}日 ${x.ss} ${x.lv}"><b>${x.d}</b><small>${x.gz}</small></button>`,
    ),
  ].join("");
  const warn =
    typeof live !== "undefined" && live
      ? '<p class="note bad">当前是“实时流转”的盘,不是出生八字。请关闭实时流转或载入人物后再看。</p>'
      : "";
  return `<div class="panel blk fl-bz"><h3 class="sec">八字 · 流日 · 流时</h3>${warn}
  <div class="nmform"><label>年<input type="number" id="fdY" min="1901" max="2099" value="${y}"></label><label>月<select id="fdM">${[...Array(12).keys()].map((i) => `<option value="${i + 1}"${m === i + 1 ? " selected" : ""}>${i + 1}月</option>`).join("")}</select></label><span class="dim sm">颜色:绿偏顺、灰平、红偏紧(干支对你的喜忌、十神与日支合冲的机械加减)</span></div>
  <div class="fdgrid"><div class="fdhead">${"日一二三四五六"
    .split("")
    .map((c) => `<span>${c}</span>`)
    .join("")}</div><div class="fdbody">${cells}</div></div>
  <h4 class="gl">${m}月${sel}日 · ${df.gz}日(${df.ss}) · ${df.lv}</h4><p class="rt">${df.notes.join("、") || "与命局无明显合冲或喜忌加减。"} 黄历:${df.info.zx}日,${df.info.huang ? "黄道" : "黑道"}${df.info.chong ? ",冲" + df.info.chong : ""}。</p>
  <div class="fdhours">${hours.map((h) => `<div class="fdh ${cls(h.sc)}"><b>${ZHI[h.b]}时</b><small>${h.span}</small><span>${h.gz}</span><em>${h.ss}</em><i>${h.lv}</i></div>`).join("")}</div>
  <p class="note">流日、流时沿用与流年相同的加减规则,只用于观察“这一天、这一时辰的干支与你命局的关系”,力度远小于大运和流年,不宜据此安排重大决定;选日子请用“择日”和“事项运势”页。</p></div>`;
}
function flBzBind() {
  const h = $(".fl-bz");
  if (!h) return;
  let busy = false;
  const redo = () => {
    if (busy || !h.isConnected) return;
    busy = true;
    const n = document.createElement("div");
    n.innerHTML = flBzHTML();
    h.replaceWith(n.firstElementChild);
    flBzBind();
  };
  $("#fdY").onchange = (e) => {
    FD.y = Math.max(1901, Math.min(2099, +e.target.value || nowBJ().y));
    redo();
  };
  $("#fdM").onchange = (e) => {
    FD.m = +e.target.value;
    redo();
  };
  $$(".fdc[data-d]", h).forEach(
    (b) =>
      (b.onclick = () => {
        FD.d = +b.dataset.d;
        redo();
      }),
  );
}
function toolsDecorate() {
  try {
    const yi = $("#pane-yi");
    if (yi && !yi.querySelector(".mhx")) {
      yi.insertAdjacentHTML("beforeend", mhExtraHTML());
      mhxBind();
    }
  } catch (e) {
    console.error(e);
  }
  try {
    const zi = $("#pane-ziwei");
    if (zi && !zi.querySelector(".fl-zw") && R.zw) {
      zi.insertAdjacentHTML("beforeend", flZwHTML());
      flZwBind();
    }
  } catch (e) {
    console.error(e);
  }
  try {
    const bz = $("#pane-bazi");
    if (bz && !bz.querySelector(".fl-bz") && R.deep) {
      bz.insertAdjacentHTML("beforeend", flBzHTML());
      flBzBind();
    }
  } catch (e) {
    console.error(e);
  }
  try {
    zyDecorate();
  } catch (e) {
    console.error(e);
  }
}

/* ================= 八字 · 互动细盘 =================
   点任一干、支、十神、五行、关系,盘面即时联动:相关字高亮、其余变淡,下方给出该字的详解;
   可叠加大运、流年、流月三列,关系用弧线连出;选中状态同步到圆盘的“命局”图层。 */
const YYN = (i) => (i % 2 === 0 ? "阳" : "阴");
const BZX = {
  dy: null,
  ly: null,
  lm: 0,
  run: true,
  sel: null,
  hi: null,
  key: "",
  show: { he: 1, chong: 1, xing: 1, hai: 0, po: 0, gh: 1, gc: 1 },
};
const BZX_SS = {
  比肩: "与日主同五行、同阴阳。主自我、同辈、朋友与独立;过多则竞争心强、固执、易分财。",
  劫财: "同五行、异阴阳。主合作与竞争并存、冲劲与义气;过多易破财、争强好胜。",
  食神: "日主所生,同阴阳。主才华、表达、福气、享受与从容;偏重则安于现状、泄气。",
  伤官: "日主所生,异阴阳。主聪明、创意、不拘一格与锋芒;过重则挑剔、不服管、口舌。",
  偏财: "日主所克,同阴阳。主流动的财、机遇、人缘与应酬;传统上男命亦指父亲、情缘。",
  正财: "日主所克,异阴阳。主稳定收入、勤俭踏实;传统上男命指妻。",
  七杀: "克日主,同阴阳。主压力、魄力、竞争与挑战;得制化则成权威,失制则多波折。",
  正官: "克日主,异阴阳。主规范、职位、名誉与责任感;传统上女命以官星为夫星。",
  偏印: "生日主,同阴阳。主偏门学问、直觉、孤独与灵感;过重则多疑、思虑多。",
  正印: "生日主,异阴阳。主庇护、学业、名誉与母亲;过重则依赖、行动力弱。",
};
const BZX_POS = {
  y: "年柱:祖上、早年(约 0–15 岁)与外部环境。年支也代表外部的大背景。",
  m: "月柱:父母、兄弟、青年(约 16–30 岁),也是事业与格局的根基(月令最重)。",
  d: "日柱:自己与配偶。日干是你本人,日支称“配偶宫”,反映内心状态与亲密关系。",
  h: "时柱:子女、下属、晚年(约 46 岁后)与归宿。",
  dy: "大运:管十年左右的大环境与阶段主题,是命局之外的“背景节奏”。",
  ly: "流年:当年的外部变化与机缘,作用比大运短而直接。",
  lm: "流月:当月的细节变化,力度最小,只作参考。",
};
const BZX_REL = {
  he: ["合", "#2f8f4e"],
  chong: ["冲", "#c8452e"],
  xing: ["刑", "#d98a2a"],
  hai: ["害", "#9b6ad0"],
  po: ["破", "#8a8f99"],
  gh: ["干合", "#2f8f4e"],
  gc: ["干冲", "#c8452e"],
};
const BZX_LAB = ["年", "月", "日", "时"],
  BZX_SH = ["年柱", "月柱", "日柱", "时柱"];
function bzxSyncKey() {
  if (!R || !R.bz) return;
  const key = R.bz.pill.map((p) => p.s + "," + p.b).join("|");
  if (BZX.key !== key) {
    BZX.key = key;
    BZX.sel = null;
    BZX.hi = null;
    BZX.dy = null;
    BZX.ly = null;
    BZX.lm = 0;
  }
  if (BZX.dy === null && R.deep) {
    const cur = typeof dayunNow === "function" ? dayunNow(R) : 0;
    BZX.dy = cur >= 0 ? cur : 0;
  }
  if (!BZX.ly) BZX.ly = nowBJ().y;
}
function bzxCols() {
  bzxSyncKey();
  const bz = R.bz,
    D = R.deep,
    cols = [];
  bz.pill.forEach((p, i) =>
    cols.push({
      k: ["y", "m", "d", "h"][i],
      lab: BZX_SH[i],
      s: p.s,
      b: p.b,
      orig: true,
      i,
      kong: i !== 2 && D.kong.includes(p.b),
    }),
  );
  if (BZX.run) {
    const dts = dayunTable(bz, D);
    if (BZX.dy !== null && dts[BZX.dy]) {
      const d = dts[BZX.dy];
      cols.push({
        k: "dy",
        lab: "大运",
        s: d.idx % 10,
        b: d.idx % 12,
        run: true,
        info: d,
        sub: `${Math.floor(d.startAge)}岁起`,
      });
    }
    if (BZX.ly) {
      const x = liunian(bz, D, BZX.ly, 1)[0];
      cols.push({
        k: "ly",
        lab: `${BZX.ly}流年`,
        s: x.idx % 10,
        b: x.idx % 12,
        run: true,
        info: x,
        sub: "流年",
      });
    }
    if (BZX.lm) {
      const ms = liuyue(bz, D, BZX.ly || nowBJ().y),
        m = ms[BZX.lm - 1];
      if (m) {
        const idx = ganzhiIdxOf(m.gz);
        cols.push({
          k: "lm",
          lab: `${m.name}月`,
          s: idx % 10,
          b: idx % 12,
          run: true,
          info: m,
          sub: "流月",
        });
      }
    }
  }
  return cols;
}
function bzxRels(cols) {
  const out = [],
    S = BZX.show;
  for (let i = 0; i < cols.length; i++)
    for (let j = i + 1; j < cols.length; j++) {
      const a = cols[i],
        b = cols[j];
      if (G_HE.some(([x, y]) => (a.s === x && b.s === y) || (a.s === y && b.s === x)))
        out.push({
          k: "gh",
          typ: "gan",
          a: i,
          b: j,
          txt: `${GAN[a.s]}${GAN[b.s]}合(化${G_HE.find(([x, y]) => (a.s === x && b.s === y) || (a.s === y && b.s === x))[2]})`,
        });
      if (inPair(PPL_GAN_CHONG, a.s, b.s))
        out.push({ k: "gc", typ: "gan", a: i, b: j, txt: `${GAN[a.s]}${GAN[b.s]}相冲` });
      pplZhiRel(a.b, b.b).forEach((r) => {
        const k =
          r.t === "六合" || r.t === "半合"
            ? "he"
            : r.t === "冲"
              ? "chong"
              : r.t === "刑" || r.t === "自刑"
                ? "xing"
                : r.t === "害"
                  ? "hai"
                  : r.t === "破"
                    ? "po"
                    : null;
        if (k) out.push({ k, typ: "zhi", a: i, b: j, txt: r.txt });
      });
    }
  out.forEach((r) => {
    r.names = [cols[r.a].lab, cols[r.b].lab];
    r.on = !!S[r.k];
  });
  return out;
}
function bzxTriples(cols) {
  const bs = cols.map((c) => c.b),
    res = [];
  [
    [Z_SANHE, "三合", "局"],
    [Z_SANHUI, "三会", "方"],
  ].forEach(([T, nm, sf]) =>
    T.forEach((g) => {
      const idx = g.slice(0, 3).map((z) => bs.indexOf(z));
      if (idx.every((x) => x >= 0))
        res.push({
          txt: `${g
            .slice(0, 3)
            .map((z) => ZHI[z])
            .join("")}${nm}${g[3]}${sf}`,
          cols: idx,
          note: `(${idx.map((i) => cols[i].lab).join("、")})`,
        });
    }),
  );
  return res;
}
function bzxRelated(cols, rels) {
  const sel = BZX.sel,
    set = new Set();
  if (!sel) return set;
  if (sel.rel !== undefined) {
    const r = rels[sel.rel];
    if (r) {
      set.add(r.a + ":" + r.typ);
      set.add(r.b + ":" + r.typ);
    }
    return set;
  }
  const parts = sel.part === "col" ? ["gan", "zhi"] : [sel.part];
  set.add(sel.c + ":" + sel.part);
  if (sel.part === "col") {
    set.add(sel.c + ":gan");
    set.add(sel.c + ":zhi");
  }
  rels.forEach((r) => {
    if (!r.on || !parts.includes(r.typ)) return;
    if (r.a === sel.c) {
      set.add(r.b + ":" + r.typ);
    } else if (r.b === sel.c) {
      set.add(r.a + ":" + r.typ);
    }
  });
  return set;
}
function bzxHiMatch(c, part, hi) {
  if (!hi) return false;
  const bz = R.bz;
  if (hi.k === "ss") {
    if (part === "gan") return c.k === "d" ? false : shishen(bz.dm, c.s) === hi.v;
    if (part === "zhi") return CANG[c.b].some((g) => shishen(bz.dm, g) === hi.v);
  }
  if (hi.k === "wx") {
    return part === "gan" ? GAN_WX[c.s] === hi.v : ZHI_WX[c.b] === hi.v;
  }
  return false;
}
function bzxHTML() {
  const bz = R.bz,
    D = R.deep,
    cols = bzxCols(),
    rels = bzxRels(cols),
    tri = bzxTriples(cols),
    rel = bzxRelated(cols, rels),
    n = cols.length;
  const cell = (c, ci, part, inner, cls) => {
    const key = ci + ":" + part,
      sel = BZX.sel && BZX.sel.c === ci && (BZX.sel.part === part || BZX.sel.part === "col"),
      r = rel.has(key),
      hm = bzxHiMatch(c, part, BZX.hi);
    const dim = (BZX.sel && !r && !sel) || (BZX.hi && !hm && !BZX.sel);
    return `<button type="button" class="bzc ${cls || ""}${sel ? " sel" : ""}${r && !sel ? " rel" : ""}${hm ? " hm" : ""}${dim ? " dim" : ""}" data-c="${ci}" data-p="${part}" aria-pressed="${!!sel}">${inner}</button>`;
  };
  const row = (cls, fn) =>
    cols
      .map((c, ci) => `<div class="bzr ${cls}${ci === 4 ? " run-first" : ""}">${fn(c, ci)}</div>`)
      .join("");
  const lane = (cls) => `<div class="bzlane ${cls}" style="grid-column:1/-1"></div>`;
  const head = row(
    "hd",
    (c, ci) =>
      `<button type="button" class="bzh${BZX.sel && BZX.sel.c === ci && BZX.sel.part === "col" ? " sel" : ""}" data-c="${ci}" data-p="col">${c.lab}${c.kong ? '<i class="kb">空</i>' : ""}${c.sub ? `<small>${c.sub}</small>` : ""}</button>`,
  );
  const ssr = row("ssr", (c, ci) => {
    const t = c.k === "d" ? "日主" : shishen(bz.dm, c.s),
      hm = BZX.hi && BZX.hi.k === "ss" && BZX.hi.v === t;
    return c.k === "d"
      ? `<span class="ssl dmk">日主</span>`
      : `<button type="button" class="ssl${hm ? " hm" : ""}" data-ss="${t}">${t}</button>`;
  });
  const gan = row("gn", (c, ci) =>
    cell(
      c,
      ci,
      "gan",
      `<span class="gz wx${GAN_WX[c.s]}">${GAN[c.s]}</span><em>${YYN(c.s)}${WXK[GAN_WX[c.s]]}</em>`,
      c.k === "d" ? "dm" : "",
    ),
  );
  const zhi = row("zh", (c, ci) =>
    cell(
      c,
      ci,
      "zhi",
      `<span class="gz wx${ZHI_WX[c.b]}">${ZHI[c.b]}</span><em>${ZODIAC[c.b]}·${WXK[ZHI_WX[c.b]]}</em>`,
    ),
  );
  const cang = row(
    "cg",
    (c, ci) =>
      `<div class="cgl">${CANG[c.b]
        .map((g, k) => {
          const t = shishen(bz.dm, g),
            hm = BZX.hi && BZX.hi.k === "ss" && BZX.hi.v === t;
          return `<button type="button" class="cgi wx${GAN_WX[g]}${hm ? " hm" : ""}" data-ss="${t}" title="${["本气", "中气", "余气"][k] || ""}">${GAN[g]}<small>${t}</small></button>`;
        })
        .join("")}</div>`,
  );
  const ny = row("ny", (c) => `<span>${NAYIN[ganzhiIdx(c.s, c.b) >> 1]}</span>`);
  const cs = row(
    "cs",
    (c) =>
      `<span>星运 ${changsheng(bz.dm, c.b)}</span><span class="dim">自坐 ${changsheng(c.s, c.b)}</span>`,
  );
  const bars = bz.wx
    .map(
      (w, i) =>
        `<button type="button" class="bzb${BZX.hi && BZX.hi.k === "wx" && BZX.hi.v === i ? " sel" : ""}" data-wx="${i}"><span class="wx${i}">${WXK[i]}</span><i><em class="bg${i}" style="width:${((w / Math.max(...bz.wx)) * 100).toFixed(0)}%"></em></i><b>${w.toFixed(1)}</b></button>`,
    )
    .join("");
  const dts = dayunTable(bz, D),
    curDy = typeof dayunNow === "function" ? dayunNow(R) : -1;
  const dyStrip = dts
    .map(
      (d, i) =>
        `<button type="button" class="bzdy${BZX.dy === i ? " on" : ""}${i === curDy ? " now" : ""}" data-dy="${i}"><span class="wx${GAN_WX[d.idx % 10]}">${d.gz}</span><small>${Math.floor(d.startAge)}岁</small><small class="${LVC(d.lv)}">${d.lv}</small></button>`,
    )
    .join("");
  const d0 = BZX.dy !== null ? dts[BZX.dy] : null,
    y0 = d0 ? d0.yr : BZX.ly || nowBJ().y,
    lyears = liunian(bz, D, y0, 10);
  const lyStrip = lyears
    .map(
      (x) =>
        `<button type="button" class="bzly${BZX.ly === x.y ? " on" : ""}${x.y === nowBJ().y ? " now" : ""}" data-ly="${x.y}"><b>${x.y}</b><span class="wx${GAN_WX[x.idx % 10]}">${x.gz}</span><small class="${LVC(x.lv)}">${x.lv}</small></button>`,
    )
    .join("");
  const lms = BZX.ly ? liuyue(bz, D, BZX.ly) : [];
  const relChips = rels.length
    ? rels
        .map(
          (r, i) =>
            `<button type="button" class="bzrc${r.on ? "" : " off"}${BZX.sel && BZX.sel.rel === i ? " sel" : ""}" data-rel="${i}" style="--c:${BZX_REL[r.k][1]}"><b>${BZX_REL[r.k][0]}</b>${esc(r.txt)}<small>${r.names.join("↔")}</small></button>`,
        )
        .join("")
    : '<span class="dim">当前各柱之间没有合冲刑害破</span>';
  const triChips = tri.length
    ? tri.map((t) => `<span class="pill g">${t.txt}<small>${t.note}</small></span>`).join("")
    : "";
  const legend = Object.entries(BZX_REL)
    .map(
      ([k, [n, c]]) =>
        `<label class="bzlg"><input type="checkbox" data-sh="${k}"${BZX.show[k] ? " checked" : ""}><i style="background:${c}"></i>${n}</label>`,
    )
    .join("");
  return `<h3 class="sec">四柱 · 互动细盘</h3>
  <p class="note" style="margin-top:0">点击任意<b>天干、地支、柱名、十神、五行、关系</b>,盘面即时联动:相关的字高亮并标出关系,其余变淡,下方给出详解;圆盘的“命局”图层同步显示。再点一次取消选择。</p>
  <div class="bzx-tool"><label class="chk"><input type="checkbox" id="bzxRun"${BZX.run ? " checked" : ""}> 叠加大运、流年</label><span class="dim sm">关系线:</span>${legend}<button class="gbtn sm" id="bzxClr" type="button"${BZX.sel || BZX.hi ? "" : " disabled"}>清除选择</button></div>
  <div class="bzx-scroll"><div class="bzx-wrap" id="bzxWrap" style="--n:${n}"><svg class="bzx-svg" id="bzxSvg" aria-hidden="true"></svg><div class="bzx-grid" style="grid-template-columns:repeat(${n},minmax(0,1fr))">${head}${ssr}${lane("l1")}${gan}${zhi}${lane("l2")}${cang}${ny}${cs}</div></div></div>
  <div class="kv" style="margin:8px 0"><span>命宫 <b>${GAN[D.ex.ming.s] + ZHI[D.ex.ming.b]}</b></span><span>身宫 <b>${GAN[D.ex.shen.s] + ZHI[D.ex.shen.b]}</b></span><span>胎元 <b>${GAN[D.ex.tai.s] + ZHI[D.ex.tai.b]}</b></span><span>日柱旬空 <b>${D.kong.map((z) => ZHI[z]).join("")}</b></span></div>
  ${
    BZX.run
      ? `<h4 class="gl">选大运</h4><div class="bzdys">${dyStrip}</div><h4 class="gl">选流年${d0 ? `(${d0.gz}大运内)` : ""}</h4><div class="bzlys"><button type="button" class="gbtn sm" id="bzLyP">‹ 前十年</button>${lyStrip}<button type="button" class="gbtn sm" id="bzLyN">后十年 ›</button></div>
  <div class="row3" style="margin-top:6px"><label class="sm dim">流月 <select id="bzLm"><option value="0">不叠加</option>${lms.map((m, i) => `<option value="${i + 1}"${BZX.lm === i + 1 ? " selected" : ""}>${m.name} ${m.gz}</option>`).join("")}</select></label></div>`
      : ""
  }
  <h4 class="gl">五行权重(点击高亮)</h4><div class="bzbars">${bars}</div>
  <h4 class="gl">关系汇总(点击查看)</h4><div class="bzrcs">${relChips}</div>${triChips ? `<div class="pills" style="margin-top:6px">${triChips}</div>` : ""}
  <div class="bzx-detail" id="bzxDetail" aria-live="polite">${bzxDetail(cols, rels)}</div>
  <p class="note">上:十神(以日干为主);中:天干地支与阴阳五行;下:藏干(含十神)、纳音、星运(日主在该支的十二长生)与自坐。晚 23 点后按次日子时起日柱。空亡以日柱旬计。弧线只列出两字之间的合冲刑害破,不判断是否化合成功,也不处理合冲对力量的改变。</p>`;
}
function bzxDetail(cols, rels) {
  const bz = R.bz,
    D = R.deep,
    sel = BZX.sel,
    hi = BZX.hi;
  const st = (wx) =>
    D.xy.favor.includes(wx)
      ? '<b class="good">喜用</b>'
      : D.xy.avoid.includes(wx)
        ? '<b class="bad">忌神</b>'
        : "平常";
  if (hi && !sel) {
    if (hi.k === "ss") {
      const at = [];
      cols.forEach((c, ci) => {
        if (c.k !== "d" && shishen(bz.dm, c.s) === hi.v) at.push(`${c.lab}天干${GAN[c.s]}`);
        CANG[c.b].forEach((g, k) => {
          if (shishen(bz.dm, g) === hi.v)
            at.push(`${c.lab}地支${ZHI[c.b]}藏${GAN[g]}(${["本气", "中气", "余气"][k] || ""})`);
        });
      });
      return `<h4 class="gl">${hi.v}</h4><p class="rt">${BZX_SS[hi.v]}</p><p class="rt"><b>在盘中出现 ${at.length} 处:</b>${at.join("、") || "未出现"}。</p><p class="note">六亲取象(传统):${bz.dm !== undefined && R.opt.gender === "M" ? "男命以财为妻(正财妻、偏财父),官杀为子女,印为母,比劫为兄弟" : "女命以官杀为夫,食伤为子女,印为母,财为父,比劫为姐妹"}。</p>`;
    }
    if (hi.k === "wx") {
      const at = [];
      cols.forEach((c) => {
        if (GAN_WX[c.s] === hi.v) at.push(`${c.lab}${GAN[c.s]}`);
        if (ZHI_WX[c.b] === hi.v) at.push(`${c.lab}${ZHI[c.b]}`);
      });
      return `<h4 class="gl">${WXK[hi.v]} · 权重 ${bz.wx[hi.v].toFixed(1)}</h4><p class="rt">对日主(${GAN[bz.dm]}${WXK[GAN_WX[bz.dm]]}):${st(hi.v)}。盘中明现(干支本字)为:${at.join("、") || "无"}。</p>`;
    }
  }
  if (!sel)
    return '<p class="dim sm">还没有选择。点上面任意一个字、十神、五行或关系,这里会显示详解。</p>';
  if (sel.rel !== undefined) {
    const r = rels[sel.rel];
    return `<h4 class="gl">${BZX_REL[r.k][0]} · ${r.names.join(" ↔ ")}</h4><p class="rt">${esc(r.txt)}</p><p class="rt dim sm">${{ he: "合表示靠近、牵绊与融合;六合、半合只是“有合意”,是否真正化成别的五行,要看月令与有无冲破。", chong: "冲表示对立、变动与碰撞;冲不一定是坏事,常带来变化、迁移或打破僵局。", xing: "刑表示摩擦、较真与内耗,常体现为口舌或牵绊。", hai: "害表示暗中的妨碍与误会。", po: "破表示小的损耗与缺口。", gh: "天干相合表示心性上的吸引与牵制。", gc: "天干相冲表示观念与做法上的正面碰撞。" }[r.k]}</span></p>`;
  }
  const c = cols[sel.c],
    isCol = sel.part === "col",
    parts = isCol ? ["gan", "zhi"] : [sel.part],
    out = [];
  const posKey = c.k,
    posTxt = BZX_POS[posKey] || "";
  out.push(
    `<h4 class="gl">${c.lab} · ${GAN[c.s]}${ZHI[c.b]}${isCol ? "" : sel.part === "gan" ? "(天干)" : "(地支)"}</h4><p class="rt dim sm">${posTxt}</p>`,
  );
  if (parts.includes("gan")) {
    const t = c.k === "d" ? "日主" : shishen(bz.dm, c.s),
      w = GAN_WX[c.s];
    out.push(
      `<div class="bzd"><b>天干 ${GAN[c.s]}</b>:${YYN(c.s)}${WXK[w]}。${c.k === "d" ? "这是你本人(日主),命局的一切都以它为中心来看。" : `对日主为「${t}」。${BZX_SS[t]}`} 五行对日主:${st(w)}。</div>`,
    );
  }
  if (parts.includes("zhi")) {
    const w = ZHI_WX[c.b],
      zs = CANG[c.b];
    out.push(
      `<div class="bzd"><b>地支 ${ZHI[c.b]}</b>(${ZODIAC[c.b]},${YYN(c.b)}${WXK[w]})。五行对日主:${st(w)}。星运:日主在${ZHI[c.b]}为「${changsheng(bz.dm, c.b)}」,该柱天干坐此支为「${changsheng(c.s, c.b)}」。${c.kong ? "此支落在日柱旬空,传统上力量较虚、应期偏迟。" : ""}<table class="tbl sm" style="margin-top:6px"><thead><tr><th>藏干</th><th>位次</th><th>十神</th><th>五行</th><th>权重</th></tr></thead><tbody>${zs.map((g, k) => `<tr><th class="wx${GAN_WX[g]}">${GAN[g]}</th><td>${["本气", "中气", "余气"][k] || "—"}</td><td>${shishen(bz.dm, g)}</td><td>${WXK[GAN_WX[g]]}</td><td>${[1, 0.5, 0.3][k] || 0.3}</td></tr>`).join("")}</tbody></table></div>`,
    );
    if (c.orig) {
      const sh = D.ss.filter((s) => s.where.includes(BZX_LAB[c.i]));
      if (sh.length)
        out.push(
          `<div class="bzd"><b>该柱神煞</b>:${sh.map((s) => `<span class="pill ${s.tone === "吉" ? "g" : s.tone === "凶" ? "r" : ""}" title="${esc(s.desc)}">${s.n}</span>`).join(" ")}<span class="dim sm">(悬停看含义)</span></div>`,
        );
    }
  }
  if (c.info && c.run) {
    const i = c.info;
    out.push(
      `<div class="bzd"><b>${c.lab}倾向</b>:<span class="${LVC(i.lv)}">${i.lv}</span>(与原局喜忌、日支月支合冲的机械契合)。${i.notes && i.notes.length ? i.notes.join("、") : "无明显加减。"}${c.k === "dy" ? ` 起运 ${Math.floor(i.startAge)} 岁,${i.yr} 年起。` : ""}</div>`,
    );
  }
  const rl = rels
    .map((r, i) => ({ ...r, i }))
    .filter((r) => (r.a === sel.c || r.b === sel.c) && parts.includes(r.typ));
  out.push(
    `<div class="bzd"><b>与其他位置的关系</b>:${rl.length ? rl.map((r) => `<button type="button" class="bzrc${r.on ? "" : " off"}" data-rel="${r.i}" style="--c:${BZX_REL[r.k][1]}"><b>${BZX_REL[r.k][0]}</b>${esc(r.txt)}<small>${(r.a === sel.c ? cols[r.b] : cols[r.a]).lab}</small></button>`).join("") : '<span class="dim">无合冲刑害破</span>'}</div>`,
  );
  return out.join("");
}
function bzxArcs() {
  const wrap = $("#bzxWrap"),
    svg = $("#bzxSvg");
  if (!wrap || !svg) return;
  const wr = wrap.getBoundingClientRect();
  if (!wr.width || !wr.height) {
    svg.innerHTML = "";
    return;
  }
  svg.setAttribute("width", wr.width);
  svg.setAttribute("height", wr.height);
  svg.setAttribute("viewBox", `0 0 ${wr.width} ${wr.height}`);
  const cols = bzxCols(),
    rels = bzxRels(cols),
    pos = (ci, part) => {
      const e = wrap.querySelector(`.bzc[data-c="${ci}"][data-p="${part}"]`);
      if (!e) return null;
      const r = e.getBoundingClientRect();
      return {
        x: r.left - wr.left + r.width / 2,
        top: r.top - wr.top,
        bot: r.bottom - wr.top,
        w: r.width,
      };
    };
  let h = "";
  const sel = BZX.sel;
  rels.forEach((r, i) => {
    if (!r.on) return;
    const A = pos(r.a, r.typ),
      B = pos(r.b, r.typ);
    if (!A || !B || !A.w) return;
    const up = r.typ === "gan",
      y = up ? A.top - 3 : A.bot + 3,
      span = Math.abs(B.x - A.x),
      dep = Math.min(46, 10 + (span / A.w) * 9),
      cy = up ? y - dep : y + dep,
      c = BZX_REL[r.k][1];
    const active =
      sel &&
      (sel.rel === i ||
        (sel.rel === undefined &&
          (r.a === sel.c || r.b === sel.c) &&
          (sel.part === "col" || sel.part === r.typ)));
    const op = sel ? (active ? 1 : 0.12) : 0.6;
    h += `<path d="M${A.x},${y} Q${(A.x + B.x) / 2},${cy} ${B.x},${y}" fill="none" stroke="${c}" stroke-width="${active ? 2.4 : 1.5}" stroke-opacity="${op}" stroke-linecap="round"${r.k === "po" || r.k === "hai" ? ' stroke-dasharray="3 3"' : ""}/>`;
    if (active || !sel)
      h += `<text x="${(A.x + B.x) / 2}" y="${(y + cy) / 2 + (up ? -1 : 5)}" text-anchor="middle" font-size="10.5" fill="${c}" fill-opacity="${op}" font-weight="700">${BZX_REL[r.k][0]}</text>`;
  });
  svg.innerHTML = h;
}
function bzxRender() {
  const host = $("#bzx");
  if (!host || !R || !R.deep) return;
  bzxSyncKey();
  host.innerHTML = bzxHTML();
  bzxBind();
  requestAnimationFrame(() => {
    bzxArcs();
  });
  try {
    dialBzRender();
  } catch (e) {}
}
function bzxRefreshPart() {
  // 只更新联动部分,保留滚动位置
  const host = $("#bzx");
  if (!host) return;
  const sc = host.querySelector(".bzx-scroll"),
    x = sc ? sc.scrollLeft : 0;
  host.innerHTML = bzxHTML();
  bzxBind();
  const sc2 = host.querySelector(".bzx-scroll");
  if (sc2) sc2.scrollLeft = x;
  requestAnimationFrame(bzxArcs);
  try {
    dialBzRender();
  } catch (e) {}
}
function bzxBind() {
  const host = $("#bzx");
  if (!host) return;
  const same = (a, b) => a && b && a.c === b.c && a.part === b.part;
  $$(".bzc,.bzh", host).forEach(
    (b) =>
      (b.onclick = () => {
        const s = { c: +b.dataset.c, part: b.dataset.p };
        BZX.sel = same(BZX.sel, s) ? null : s;
        BZX.hi = null;
        bzxRefreshPart();
      }),
  );
  $$("[data-ss]", host).forEach(
    (b) =>
      (b.onclick = (e) => {
        e.stopPropagation();
        const h = { k: "ss", v: b.dataset.ss };
        BZX.hi = BZX.hi && BZX.hi.v === h.v ? null : h;
        BZX.sel = null;
        bzxRefreshPart();
      }),
  );
  $$("[data-wx]", host).forEach(
    (b) =>
      (b.onclick = () => {
        const h = { k: "wx", v: +b.dataset.wx };
        BZX.hi = BZX.hi && BZX.hi.v === h.v ? null : h;
        BZX.sel = null;
        bzxRefreshPart();
      }),
  );
  $$("[data-rel]", host).forEach(
    (b) =>
      (b.onclick = () => {
        const i = +b.dataset.rel;
        BZX.sel = BZX.sel && BZX.sel.rel === i ? null : { rel: i };
        BZX.hi = null;
        bzxRefreshPart();
      }),
  );
  $$("[data-dy]", host).forEach(
    (b) =>
      (b.onclick = () => {
        BZX.dy = +b.dataset.dy;
        const d = dayunTable(R.bz, R.deep)[BZX.dy];
        if (!(BZX.ly >= d.yr && BZX.ly < d.yr + 10)) BZX.ly = d.yr;
        BZX.lm = 0;
        BZX.sel = null;
        bzxRefreshPart();
      }),
  );
  $$("[data-ly]", host).forEach(
    (b) =>
      (b.onclick = () => {
        BZX.ly = +b.dataset.ly;
        BZX.lm = 0;
        BZX.sel = { c: bzxCols().findIndex((c) => c.k === "ly"), part: "col" };
        bzxRefreshPart();
      }),
  );
  const mv = (d) => {
    const d0 = dayunTable(R.bz, R.deep)[BZX.dy],
      base = d0 ? d0.yr : BZX.ly;
    const t = Math.max(1902, Math.min(2090, (BZX.ly || base) + d));
    BZX.ly = t;
    BZX.lm = 0;
    bzxRefreshPart();
  };
  const p = $("#bzLyP"),
    n = $("#bzLyN");
  if (p) p.onclick = () => mv(-10);
  if (n) n.onclick = () => mv(10);
  const lm = $("#bzLm");
  if (lm)
    lm.onchange = () => {
      BZX.lm = +lm.value;
      bzxRefreshPart();
    };
  $$("[data-sh]", host).forEach(
    (c) =>
      (c.onchange = () => {
        BZX.show[c.dataset.sh] = c.checked ? 1 : 0;
        bzxRefreshPart();
      }),
  );
  $("#bzxRun").onchange = (e) => {
    BZX.run = e.target.checked;
    BZX.sel = null;
    bzxRefreshPart();
  };
  $("#bzxClr").onclick = () => {
    BZX.sel = null;
    BZX.hi = null;
    bzxRefreshPart();
  };
  if (window.ResizeObserver) {
    if (BZX.ro) BZX.ro.disconnect();
    BZX.ro = new ResizeObserver(() => bzxArcs());
    const w = $("#bzxWrap");
    if (w) BZX.ro.observe(w);
  }
}
document.addEventListener("keydown", (e) => {
  if (
    e.key === "Escape" &&
    (BZX.sel || BZX.hi) &&
    $("#pane-bazi") &&
    $("#pane-bazi").classList.contains("on") &&
    !document.querySelector("#topnav .tn-panel:not([hidden])") &&
    !(e.target && /INPUT|SELECT|TEXTAREA/.test(e.target.tagName))
  ) {
    BZX.sel = null;
    BZX.hi = null;
    bzxRefreshPart();
  }
});
/* ===== 圆盘“命局”图层 ===== */
function buildBzLayer(root) {
  const g = E("g", { class: "lx lx-bz" }, root);
  dial.layerG.bz = g;
  const X = (dial.bz = { g });
  E("circle", { r: 270, class: "bz-ring" }, g);
  E("circle", { r: 330, class: "bz-ring" }, g);
  X.ticks = E("g", {}, g);
  for (let b = 0; b < 12; b++) {
    const a = 180 + 30 * b,
      [x, y] = P(352, a);
    E("text", { x, y: y + 5, class: "bz-zhi", "text-anchor": "middle" }, X.ticks, ZHI[b]);
    const [x1, y1] = P(330, a),
      [x2, y2] = P(342, a);
    E("line", { x1, y1, x2, y2, class: "bz-tk" }, X.ticks);
  }
  X.chords = E("g", {}, g);
  X.marks = E("g", {}, g);
  X.title = E("text", { x: 0, y: -8, class: "bz-t", "text-anchor": "middle" }, g, "");
  X.sub = E("text", { x: 0, y: 14, class: "bz-s", "text-anchor": "middle" }, g, "");
  dialBzRender();
}
function dialBzRender() {
  const X = dial && dial.bz;
  if (!X) return;
  const g = X.g;
  if (!R || !R.deep) {
    return;
  }
  bzxSyncKey();
  while (X.chords.firstChild) X.chords.removeChild(X.chords.firstChild);
  while (X.marks.firstChild) X.marks.removeChild(X.marks.firstChild);
  const cols = bzxCols(),
    rels = bzxRels(cols).filter((r) => r.typ === "zhi" && r.on),
    sel = BZX.sel,
    rel = bzxRelated(cols, bzxRels(cols));
  const pt = (b, r) => P(r, 180 + 30 * b);
  // 同一地支多处出现时错开半径
  const stack = {};
  const rad = cols.map((c) => {
    const n = stack[c.b] || 0;
    stack[c.b] = n + 1;
    return 298 - n * 36;
  });
  rels.forEach((r) => {
    const A = pt(cols[r.a].b, 258),
      B = pt(cols[r.b].b, 258),
      col = BZX_REL[r.k][1],
      active =
        sel &&
        (sel.rel === bzxRels(cols).indexOf(r) ||
          (sel.rel === undefined &&
            (r.a === sel.c || r.b === sel.c) &&
            (sel.part === "col" || sel.part === "zhi")));
    E(
      "path",
      {
        d: `M${A[0]},${A[1]} Q0,0 ${B[0]},${B[1]}`,
        fill: "none",
        stroke: col,
        "stroke-width": active ? 3 : 1.6,
        "stroke-opacity": sel ? (active ? 1 : 0.12) : 0.55,
        "stroke-linecap": "round",
        ...(r.k === "po" || r.k === "hai" ? { "stroke-dasharray": "4 4" } : {}),
      },
      X.chords,
    );
  });
  cols.forEach((c, i) => {
    const [x, y] = pt(c.b, rad[i]),
      isSel = sel && sel.c === i && (sel.part === "col" || sel.part === "zhi"),
      isRel = rel.has(i + ":zhi"),
      dim = sel && !isSel && !isRel;
    const col = c.run ? "var(--gold2)" : `var(--wx${ZHI_WX[c.b]},var(--ink))`;
    const grp = E(
      "g",
      {
        class: "bz-m" + (isSel ? " sel" : "") + (dim ? " dim" : "") + (c.run ? " run" : ""),
        style: "cursor:pointer",
      },
      X.marks,
    );
    E("circle", { cx: x, cy: y, r: c.run ? 14 : 16, class: "bz-dot wx" + ZHI_WX[c.b] }, grp);
    E("text", { x, y: y - 2, class: "bz-gz", "text-anchor": "middle" }, grp, GAN[c.s] + ZHI[c.b]);
    E(
      "text",
      { x, y: y + 10, class: "bz-lab", "text-anchor": "middle" },
      grp,
      c.lab.replace("柱", ""),
    );
    grp.addEventListener("click", () => {
      const s = { c: i, part: "col" };
      BZX.sel = BZX.sel && BZX.sel.c === i && BZX.sel.part === "col" ? null : s;
      BZX.hi = null;
      bzxRefreshPart();
    });
  });
  X.title.textContent = `${GAN[R.bz.dm]}${WXK[GAN_WX[R.bz.dm]]}日主 · ${R.deep.st.level}`;
  X.sub.textContent = sel
    ? sel.rel !== undefined
      ? "已选关系"
      : `已选:${cols[sel.c] ? cols[sel.c].lab : ""}`
    : "点击圆点或下方“八字”页互动";
}

/* ================= 盘库 · 各类圆盘的绘制 =================
   统一约定:角度 a 自正上方起顺时针(度),南在上、东在左(与圆盘一致);子在正下,地支 b 的角度为 180+30b。 */
const sp = (r, a) => {
  const t = (a * Math.PI) / 180;
  return [r * Math.sin(t), -r * Math.cos(t)];
};
const f1 = (n) => n.toFixed(1);
function sPath(r0, r1, a0, a1) {
  const [x0, y0] = sp(r1, a0),
    [x1, y1] = sp(r1, a1),
    [x2, y2] = sp(r0, a1),
    [x3, y3] = sp(r0, a0),
    L = (a1 - a0) % 360 > 180 ? 1 : 0;
  return `M${f1(x0)},${f1(y0)}A${r1},${r1} 0 ${L} 1 ${f1(x1)},${f1(y1)}L${f1(x2)},${f1(y2)}A${r0},${r0} 0 ${L} 0 ${f1(x3)},${f1(y3)}Z`;
}
function aPath(r, a0, a1) {
  const [x0, y0] = sp(r, a0),
    [x1, y1] = sp(r, a1);
  return `M${f1(x0)},${f1(y0)}A${r},${r} 0 ${(a1 - a0) % 360 > 180 ? 1 : 0} 1 ${f1(x1)},${f1(y1)}`;
}
function sSec(g, r0, r1, a0, a1, o = {}) {
  const p = E(
    "path",
    {
      d: sPath(r0, Math.max(r1, r0 + 0.5), a0, a1),
      class: "stu-sec" + (o.cls ? " " + o.cls : ""),
      ...(o.fill ? { fill: o.fill } : {}),
      ...(o.op != null ? { "fill-opacity": o.op } : {}),
      ...(o.stroke ? { stroke: o.stroke } : {}),
    },
    g,
  );
  if (o.hit) {
    p.classList.add("stu-hit");
    p.addEventListener("click", o.hit);
  }
  if (o.tip) {
    E("title", {}, p, o.tip);
  }
  return p;
}
function sTxt(g, r, a, txt, fs, o = {}) {
  const [x, y] = sp(r, a),
    na = ((a % 360) + 360) % 360;
  let rot;
  if (o.mode === "rad") {
    rot = a - 90;
    if (na > 180) rot += 180;
  } else rot = na > 90 && na < 270 ? a + 180 : a;
  const t = E(
    "text",
    {
      class: "stu-t" + (o.cls ? " " + o.cls : ""),
      "font-size": f1(fs * STU.fs),
      "text-anchor": "middle",
      "dominant-baseline": "central",
      transform: `translate(${f1(x)},${f1(y)}) rotate(${f1(rot)})`,
    },
    g,
    txt,
  );
  if (o.fill) t.setAttribute("fill", o.fill);
  if (o.b) t.setAttribute("font-weight", "700");
  return t;
}
const SW = ["var(--sw0)", "var(--sw1)", "var(--sw2)", "var(--sw3)", "var(--sw4)"];
const NY_WX = (n) => "木火土金水".indexOf(n[n.length - 1]);
/* 一组爻线(自内而外 初→上),stroke 为弧形 */
function sLines(g, lines, rc0, rc1, am, aw, col, hi) {
  const lt = (rc1 - rc0) / lines.length;
  lines.forEach((y, i) => {
    const r = rc0 + (i + 0.5) * lt,
      sw = Math.max(1.2, lt * 0.62);
    if (y)
      E(
        "path",
        {
          d: aPath(r, am - aw, am + aw),
          class: "stu-yao",
          stroke: col || "var(--ink)",
          "stroke-width": f1(sw),
        },
        g,
      );
    else {
      const gp = aw * 0.26;
      E(
        "path",
        {
          d: aPath(r, am - aw, am - gp),
          class: "stu-yao",
          stroke: col || "var(--ink)",
          "stroke-width": f1(sw),
        },
        g,
      );
      E(
        "path",
        {
          d: aPath(r, am + gp, am + aw),
          class: "stu-yao",
          stroke: col || "var(--ink)",
          "stroke-width": f1(sw),
        },
        g,
      );
    }
  });
}
let STU_SC = 1;
const clampF = (v, a, b) => Math.max(a, Math.min(b * STU_SC, v));
function ringLine(g, r) {
  E("circle", { r: f1(r), class: "stu-rl" }, g);
}
function noData(g, r1, msg) {
  E(
    "text",
    { class: "stu-t", x: 0, y: -r1 + 30, "text-anchor": "middle", "font-size": 16 },
    g,
    msg,
  );
}
