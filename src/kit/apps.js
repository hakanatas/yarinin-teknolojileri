/* ─────────────────────────────────────────────────────────────
   UYGULAMA PENCERESİ şablonu — "app"
   Gerçek bir programın arayüzünü taklit eden, markasız bir pencere:
   başlık çubuğu, araç çubuğu, çalışma alanı. İmleç araca gider, tıklar,
   çalışma alanında sonuç görünür.
   { type:'app', app:'image'|'poster'|'word'|'slides'|'sheet'|'audio'|'video'|'mail'|'browser'|'folder',
     title:'…', tools:[{id,label}], data:{…}, beats:[{tool:'id' | tools:['id',…], …}] }
   ───────────────────────────────────────────────────────────── */
(function (root) {
  const BF = (root.BF = root.BF || {});
  const { M, P, S, T, TPL } = BF;
  const { E, seg, pop, go, lerp, clamp } = M;
  const { tile, bIdx, col, ink, pentaUp, drawK, karoCues, panel } = BF.TPLH;
  const R = (ctx, x, y, w, h, r, c) => { ctx.fillStyle = c; S.rrect(ctx, x, y, w, h, r); ctx.fill(); };
  const TX = (ctx, s, x, y, o) => T.text(ctx, s, x, y, Object.assign({ size: 28, color: P.murekkep, align: 'left', minSize: 20 }, o));

  // araç zamanlaması: vuruş başına araçlar; her araç 1.3 sn arayla uygulanır
  function toolTimes(sc) {
    const out = [];
    sc.beats.forEach((b) => {
      const ts = b.tools || (b.tool ? [b.tool] : []);
      const sp = Math.min(2.2, (b.d - 1.4) / Math.max(1, ts.length));
      ts.forEach((id, j) => out.push({ id, t: b.t + 0.3 + j * sp, click: b.t + 0.3 + j * sp + 0.7, apply: b.t + 0.3 + j * sp + 1.0, beat: b.i }));
    });
    return out;
  }
  function makeState(sc, lt) {
    const tt = toolTimes(sc);
    const st = { p: {}, cur: null, tt };
    tt.forEach((x) => { const p = go(lt, x.apply, x.apply + 0.9); if (lt >= x.apply) st.p[x.id] = Math.max(st.p[x.id] || 0, p); if (lt >= x.t && lt < x.apply + 1.2) st.cur = x.id; });
    st.has = (id) => st.p[id] || 0;
    return st;
  }

  // ─── pencere
  function winRect(L) { return L.v ? { x: 40, y: 175, w: 1000, h: 1240 } : { x: 150, y: 150, w: 1620, h: 705 }; }
  function toolRects(ctx, L, W, tools) {
    const out = [];
    const top = W.y + 56, pad = 14, bh = 78;
    let x = W.x + 20, y = top;
    tools.forEach((tl) => {
      const w = Math.max(120, T.measure(ctx, tl.label, 27, 'body', 800) + 44);
      if (x + w > W.x + W.w - 20) { x = W.x + 20; y += bh + 10; }
      out.push({ x, y, w, h: bh });
      x += w + pad;
    });
    return { rects: out, bottom: y + bh + 14 };
  }

  const PAINT = {};

  // ═══ görsel düzenleyici
  function landscape(ctx, x, y, w, h, t, o = {}) {
    ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
    const g = ctx.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, '#7CC8F0'); g.addColorStop(1, '#CFEFFF');
    ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
    ctx.fillStyle = P.safran; ctx.beginPath(); ctx.arc(x + w * 0.75, y + h * 0.28, h * 0.1, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#2DB36E'; ctx.beginPath(); ctx.moveTo(x, y + h); ctx.lineTo(x, y + h * 0.62); ctx.quadraticCurveTo(x + w * 0.3, y + h * 0.4, x + w * 0.55, y + h * 0.6); ctx.quadraticCurveTo(x + w * 0.8, y + h * 0.78, x + w, y + h * 0.55); ctx.lineTo(x + w, y + h); ctx.fill();
    ctx.fillStyle = '#1E8A52'; ctx.beginPath(); ctx.moveTo(x, y + h); ctx.lineTo(x, y + h * 0.8); ctx.quadraticCurveTo(x + w * 0.5, y + h * 0.65, x + w, y + h * 0.85); ctx.lineTo(x + w, y + h); ctx.fill();
    // ağaç ve okul
    ctx.fillStyle = '#7A4A2C'; ctx.fillRect(x + w * 0.18, y + h * 0.5, w * 0.025, h * 0.2);
    ctx.fillStyle = '#1E8A52'; ctx.beginPath(); ctx.arc(x + w * 0.19, y + h * 0.46, h * 0.1, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = P.mercan; ctx.fillRect(x + w * 0.42, y + h * 0.5, w * 0.16, h * 0.18);
    ctx.fillStyle = '#B83A2A'; ctx.beginPath(); ctx.moveTo(x + w * 0.4, y + h * 0.5); ctx.lineTo(x + w * 0.5, y + h * 0.4); ctx.lineTo(x + w * 0.6, y + h * 0.5); ctx.fill();
    ctx.fillStyle = '#FFF4E0'; for (let i = 0; i < 3; i++) ctx.fillRect(x + w * (0.44 + i * 0.045), y + h * 0.55, w * 0.03, h * 0.05);
    if (o.litter) { ctx.fillStyle = '#8A8A8A'; for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.arc(x + w * (0.25 + i * 0.12), y + h * (0.86 + (i % 2) * 0.05), h * 0.025, 0, Math.PI * 2); ctx.fill(); } }
    ctx.restore();
  }
  PAINT.image = (ctx, r, st, t, sc) => {
    ctx.fillStyle = '#2A2F45'; ctx.fillRect(r.x, r.y, r.w, r.h);
    // sağda katman / ayar paneli
    const side = Math.min(360, r.w * 0.28);
    const cx = r.x + (r.w - side) / 2, cy = r.y + r.h / 2;
    const open = st.has('open') || (sc.data && sc.data.preload) ? 1 : 0;
    let W = Math.min(r.w - side - 80, (r.h - 60) * 1.4), H = W / 1.4;
    const crop = st.has('crop');
    const rot = st.has('rotate');
    ctx.save(); ctx.globalAlpha *= Math.max(open, st.has('open'));
    ctx.translate(cx, cy); ctx.rotate(rot * Math.PI * 0.5 * (sc.data && sc.data.rotate === 'small' ? 0.08 : 1) * (rot < 1 ? 1 : 1));
    const z = 1 + crop * 0.35;
    ctx.scale(z, z);
    const rk = rot > 0 ? (sc.data && sc.data.rotate === 'small' ? 1 - 0.12 * rot : 0.72) : 1, w2 = W * rk, h2 = H * rk;
    ctx.beginPath(); ctx.rect(-w2 / 2 * (1 - crop * 0.26), -h2 / 2 * (1 - crop * 0.26), w2 * (1 - crop * 0.26), h2 * (1 - crop * 0.26)); ctx.clip();
    landscape(ctx, -w2 / 2, -h2 / 2, w2, h2, t, { litter: sc.data && sc.data.litter });
    const br = st.has('bright'); if (br) { ctx.fillStyle = `rgba(255,255,240,${0.22 * br})`; ctx.fillRect(-w2 / 2, -h2 / 2, w2, h2); }
    const fl = st.has('filter'); if (fl) { ctx.fillStyle = `rgba(255,150,60,${0.25 * fl})`; ctx.fillRect(-w2 / 2, -h2 / 2, w2, h2); }
    const dr = st.has('draw'); if (dr) { ctx.strokeStyle = P.mor; ctx.lineWidth = 12; ctx.lineCap = 'round'; ctx.beginPath(); for (let i = 0; i <= 20 * dr; i++) { const q = i / 20; const x = -w2 * 0.3 + q * w2 * 0.5, y = h2 * 0.1 + Math.sin(q * 9) * h2 * 0.08; if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); } ctx.stroke(); }
    const sh = st.has('layer'); if (sh) { ctx.fillStyle = P.safran; S.star8(ctx, w2 * 0.28, -h2 * 0.22, 40 * E.back(sh)); ctx.fill(); }
    const tx = st.has('text'); if (tx) { ctx.globalAlpha *= tx; T.text(ctx, (sc.data && sc.data.text) || 'OKULUMUZ', 0, -h2 * 0.2, { size: Math.min(64, w2 * 0.09), fam: 'display', color: '#FFFFFF' }); }
    ctx.restore();
    if (crop > 0 && crop < 1) { ctx.save(); ctx.strokeStyle = P.safran; ctx.lineWidth = 5; ctx.setLineDash([12, 10]); const f = 1 - crop * 0.26; ctx.strokeRect(cx - W * f / 2, cy - H * f / 2, W * f, H * f); ctx.restore(); }
    // yan panel: ayarlar
    const px = r.x + r.w - side;
    R(ctx, px, r.y, side, r.h, 0, '#232842');
    TX(ctx, 'Ayarlar', px + 24, r.y + 40, { size: 28, fam: 'display', color: P.turkuazA, maxW: side - 40 });
    const rows = [['Parlaklık', st.has('bright')], ['Renk', st.has('filter')], ['Boyut', st.has('resize')]];
    rows.forEach(([lab, v], i) => {
      const y = r.y + 100 + i * 86;
      TX(ctx, lab, px + 24, y, { size: 26, color: P.sir, maxW: side - 50 });
      R(ctx, px + 24, y + 26, side - 60, 10, 5, '#3A4270');
      const k = 0.35 + 0.4 * v;
      R(ctx, px + 24, y + 26, (side - 60) * k, 10, 5, P.turkuaz);
      ctx.fillStyle = P.sir; ctx.beginPath(); ctx.arc(px + 24 + (side - 60) * k, y + 31, 13, 0, Math.PI * 2); ctx.fill();
    });
    if (st.has('resize')) T.para(ctx, st.has('resize') > 0.5 ? '1200 × 850 piksel' : '4000 × 2800 piksel', px + 24, r.y + 370, { size: 26, color: P.safran, maxW: side - 40, align: 'left', maxLines: 2, minSize: 22 });
    if (st.has('save')) {
      const a = st.has('save');
      panel(ctx, cx - 250, cy - 90, 500, 180, { bg: P.sir, alpha: a, r: 20 });
      TX(ctx, 'Farklı kaydet', cx - 220, cy - 45, { size: 28, fam: 'display', alpha: a, maxW: 440 });
      TX(ctx, (sc.data && sc.data.file) || 'okulumuz.png', cx - 220, cy + 10, { size: 30, color: P.kobalt, alpha: a, maxW: 270 });
      ['JPG', 'PNG'].forEach((f, i) => S.chip(ctx, f, cx + 90 + i * 110, cy + 10, { size: 26, bg: i ? P.zumrut : '#9AA6C8', color: P.sir, alpha: a }));
      
    }
  };

  // ═══ afiş tasarımı (dikey tuval)
  PAINT.poster = (ctx, r, st, t, sc) => {
    ctx.fillStyle = '#2A2F45'; ctx.fillRect(r.x, r.y, r.w, r.h);
    const d = sc.data || {};
    const H = r.h - 50, W = Math.min(H * 0.72, r.w - 60);
    const x = r.x + (r.w - W) / 2, y = r.y + 25;
    R(ctx, x, y, W, H, 6, '#FFFFFF');
    const bg = st.has('bg'); if (bg) { ctx.save(); ctx.globalAlpha *= bg; R(ctx, x, y, W, H, 6, col(d.bg || 'turkuaz')); ctx.restore(); }
    const ph = st.has('photo'); if (ph) { ctx.save(); ctx.globalAlpha *= ph; landscape(ctx, x + W * 0.1, y + H * 0.28, W * 0.8, H * 0.4, t, { litter: d.litter }); ctx.restore(); }
    const ti = st.has('title'); if (ti) T.para(ctx, d.title || 'OKULUMU SEVİYORUM', x + W / 2, y + H * 0.14, { size: Math.min(46, W * 0.085), fam: 'display', color: ink(d.bg || 'turkuaz'), alpha: ti, maxW: W * 0.86, vcenter: true, maxLines: 2, minSize: 22 });
    const sl = st.has('slogan'); if (sl) T.para(ctx, d.slogan || 'Çöpünü yere değil, kutuya at!', x + W / 2, y + H * 0.78, { size: Math.max(26, Math.min(34, W * 0.07)), color: ink(d.bg || 'turkuaz'), alpha: sl, maxW: W * 0.88, vcenter: true, maxLines: 2, minSize: 26 });
    const ic = st.has('icons'); if (ic) ['trash', 'heart', 'school'].forEach((n, i) => tile(ctx, x + W * (0.28 + i * 0.22), y + H * 0.9, W * 0.13 * E.back(ic), n, P.kobalt, t));
    if (st.has('check')) {
      const a = st.has('check');
      const items = d.criteria || ['Mesaj açık', 'Yazı okunaklı', 'Renkler uyumlu'];
      items.forEach((s, i) => { const k = go(a, i * 0.3, i * 0.3 + 0.3); S.chip(ctx, '✓ ' .replace('✓ ', '') + s, r.x + 30, r.y + 60 + i * 70, { size: 26, fam: 'body', align: 'left', bg: P.zumrut, color: P.sir, alpha: k }); });
    }
  };

  // ═══ kelime işlemci
  PAINT.word = (ctx, r, st, t, sc) => {
    ctx.fillStyle = '#D9DDEA'; ctx.fillRect(r.x, r.y, r.w, r.h);
    const d = sc.data || {};
    const W = Math.min(r.w - 80, 760), x = r.x + (r.w - W) / 2, y = r.y + 24, H = r.h - 24;
    R(ctx, x, y, W, H + 30, 4, '#FFFFFF');
    const ty = st.has('type');
    const hd = st.has('heading'), al = st.has('align'), bo = st.has('bold'), fo = st.has('font');
    const title = d.title || 'Okul Bahçemiz';
    const tx = al ? lerp(x + 50, x + W / 2, al) : x + 50;
    if (ty) T.text(ctx, title.slice(0, Math.ceil(title.length * clamp(ty * 1.5))), tx, y + 60, { size: hd ? lerp(30, 44, hd) : 30, fam: fo ? 'display' : 'body', weight: 800, align: al > 0.5 ? 'center' : 'left', color: hd ? P.kobalt : P.murekkep, maxW: W - 100 });
    const lines = d.lines || ['Okul bahçemiz geniş ve ağaçlıdır.', 'Teneffüste burada oyun oynarız.', 'Bahçeyi temiz tutmak hepimizin görevi.'];
    lines.forEach((ln, i) => {
      if (d.typo && d.typo.to && i === d.typo.line && st.has('spell') > 0.5) ln = ln.replace(d.typo.from, d.typo.to);
      const k = clamp(ty * 3 - 0.8 - i * 0.5);
      if (k <= 0) return;
      const s = ln.slice(0, Math.ceil(ln.length * k));
      const isBold = bo && i === 2;
      T.text(ctx, (st.has('list') ? '•  ' : '') + s, x + 50, y + 130 + i * 50, { size: 27, weight: isBold ? 800 : 600, color: P.murekkep, maxW: W - 100, align: 'left' });
      if (d.typo && i === d.typo.line && !st.has('spell')) { ctx.save(); ctx.strokeStyle = P.mercan; ctx.lineWidth = 3; ctx.beginPath(); for (let q = 0; q < 20; q++) ctx.lineTo(x + 50 + d.typo.x + q * 8, y + 150 + i * 50 + (q % 2) * 5); ctx.stroke(); ctx.restore(); }
    });
    const im = st.has('image'); if (im) { ctx.save(); ctx.globalAlpha *= im; landscape(ctx, x + 50, y + 300, W * 0.42, W * 0.26, t); ctx.restore(); T.para(ctx, d.caption || 'Resim 1: Okul bahçemiz', x + 60 + W * 0.45, y + 300 + W * 0.13, { size: 26, color: '#566089', alpha: im, maxW: W * 0.45, align: 'left', vcenter: true, maxLines: 2 }); }
    const tb = st.has('table'); if (tb) {
      const tyy = y + 320 + (im ? W * 0.3 : 0), cw = (W - 100) / 3;
      ctx.save(); ctx.globalAlpha *= tb;
      for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) { ctx.strokeStyle = '#9AA6C8'; ctx.lineWidth = 2; ctx.strokeRect(x + 50 + i * cw, tyy + j * 44, cw, 44); if (j === 0) { ctx.fillStyle = '#E3E8FA'; ctx.fillRect(x + 51 + i * cw, tyy + 1, cw - 2, 42); } }
      ctx.restore();
      (d.table || ['Sınıf', 'Ağaç', 'Fidan']).forEach((s, i) => TX(ctx, s, x + 64 + i * cw, tyy + 22, { size: 26, alpha: tb, maxW: cw - 20 }));
    }
    if (st.has('save')) { const a = st.has('save'); S.chip(ctx, (d.file || 'okul-bahcemiz.docx') + '  kaydedildi', r.x + r.w / 2, r.y + r.h - 50, { size: 26, fam: 'body', bg: P.zumrut, color: P.sir, alpha: a }); }
  };

  // ═══ sunu
  PAINT.slides = (ctx, r, st, t, sc) => {
    ctx.fillStyle = '#D9DDEA'; ctx.fillRect(r.x, r.y, r.w, r.h);
    const d = sc.data || {};
    const nSl = 1 + (st.has('new') > 0.5 ? 1 : 0) + (st.has('new2') > 0.5 ? 1 : 0);
    const vert = r.h > r.w * 1.1;
    const tw = vert ? Math.min(200, r.w * 0.26) : Math.min(200, r.w * 0.2), th = tw * 0.5625;
    for (let i = 0; i < nSl; i++) {
      const sx = vert ? r.x + 40 + i * (tw + 30) : r.x + 20, sy = vert ? r.y + 20 : r.y + 20 + i * (th + 20);
      R(ctx, sx, sy, tw, th, 4, i === nSl - 1 ? '#FFFFFF' : '#F4F5FA');
      if (i === nSl - 1) { ctx.strokeStyle = P.safran; ctx.lineWidth = 4; ctx.strokeRect(sx - 2, sy - 2, tw + 4, th + 4); }
      TX(ctx, String(i + 1), sx - 16, sy + 14, { size: 26, color: '#566089' });
    }
    let mx, mw, mh, my;
    const nH = d.notes ? 90 : 0;
    if (vert) { mx = r.x + 20; mw = r.w - 40; mh = mw * 0.5625; my = r.y + th + 40 + (r.h - th - 40 - mh - nH) / 2; }
    else { mx = r.x + tw + 60; mw = Math.min(r.w - tw - 90, (r.h - 60 - nH) / 0.5625); mh = mw * 0.5625; my = r.y + (r.h - mh - nH) / 2; }
    const theme = st.has('theme');
    R(ctx, mx, my, mw, mh, 6, '#FFFFFF');
    if (theme) { ctx.save(); ctx.globalAlpha *= theme; R(ctx, mx, my, mw, mh, 6, col(d.theme || 'kobalt')); R(ctx, mx, my + mh - 24, mw, 24, 0, P.safran); ctx.restore(); }
    const tc = theme > 0.5 ? P.sir : P.murekkep;
    const tr = st.has('transition'); let slideX = 0;
    if (tr > 0 && tr < 1) slideX = (1 - E.out(tr)) * mw * 0.12;
    ctx.save(); ctx.beginPath(); ctx.rect(mx, my, mw, mh); ctx.clip(); ctx.translate(slideX, 0); if (tr > 0 && tr < 1) ctx.globalAlpha *= 0.25 + 0.75 * E.out(tr);
    const ti = st.has('title') * (st.has('play') > 0 ? 0 : 1); if (ti) T.text(ctx, d.title || 'Geri Dönüşüm', mx + mw / 2, my + mh * 0.2, { size: Math.min(52, mw * 0.06), fam: 'display', color: tc, alpha: ti, maxW: mw - 60 });
    const bl = st.has('bullets') * (st.has('play') > 0 ? 0 : 1); if (bl) (d.bullets || ['Kâğıt, cam, plastik ayrı', 'Atık kutularını kullan', 'Doğa teşekkür eder']).forEach((s, i) => T.text(ctx, '•  ' + s, mx + 50, my + mh * (0.4 + i * 0.14), { size: Math.max(26, Math.min(32, mw * 0.036)), align: 'left', color: tc, alpha: clamp(bl * 3 - i), maxW: mw * 0.56 }));
    const im = st.has('image'); if (im) { const an = st.has('anim'); const dy = an > 0 && an < 1 ? (1 - E.back(an)) * 200 : 0; ctx.save(); ctx.globalAlpha *= im; tile(ctx, mx + mw * 0.78, my + mh * 0.58 + dy, mh * 0.42, d.icon || 'trash', P.zumrut, t); ctx.restore(); }
    ctx.restore();
    const nt = st.has('notes'); if (nt) { R(ctx, mx, my + mh + 12, mw, 50, 6, '#FFFFFF'); TX(ctx, d.notes || 'Konuşmacı notu: Her maddeyi bir örnekle anlat.', mx + 16, my + mh + 37, { size: 26, color: '#566089', alpha: nt, maxW: mw - 30 }); }
    const pl = st.has('play'); if (pl > 0) { ctx.save(); ctx.globalAlpha *= clamp(pl * 2) * (pl > 0.95 ? 1 : 1); ctx.fillStyle = 'rgba(12,16,34,0.96)'; ctx.fillRect(r.x, r.y, r.w, r.h); ctx.restore(); const s = 0.8 + pl * 0.15; const w2 = mw * s * 1.15, h2 = w2 * 0.5625; R(ctx, r.x + (r.w - w2) / 2, r.y + (r.h - h2) / 2, w2, h2, 4, theme ? col(d.theme || 'kobalt') : '#FFFFFF'); T.text(ctx, d.title || 'Geri Dönüşüm', r.x + r.w / 2, r.y + (r.h - h2) / 2 + h2 * 0.25, { size: Math.min(60, w2 * 0.06), fam: 'display', color: tc, maxW: w2 - 60, alpha: clamp(pl * 2) }); const px0 = r.x + (r.w - w2) / 2, py0 = r.y + (r.h - h2) / 2;
      if (st.has('bullets')) (d.bullets || ['Kâğıt, cam, plastik ayrı', 'Atık kutularını kullan', 'Doğa teşekkür eder']).forEach((s2, i) => T.text(ctx, '•  ' + s2, px0 + 50, py0 + h2 * (0.45 + i * 0.14), { size: Math.max(26, Math.min(34, w2 * 0.036)), align: 'left', color: tc, alpha: clamp(pl * 2), maxW: w2 * 0.56 }));
      if (st.has('image')) { ctx.save(); ctx.globalAlpha *= clamp(pl * 2); tile(ctx, px0 + w2 * 0.78, py0 + h2 * 0.6, h2 * 0.42, d.icon || 'trash', P.zumrut, t); ctx.restore(); }
    }
  };

  // ═══ hesap tablosu
  PAINT.sheet = (ctx, r, st, t, sc) => {
    ctx.fillStyle = '#FFFFFF'; ctx.fillRect(r.x, r.y, r.w, r.h);
    const d = sc.data || { cols: ['Sınıf', 'Kitap'], rows: [['5-A', 42], ['5-B', 35], ['5-C', 51], ['5-D', 28]] };
    const nc = d.cols.length + 1, nr = Math.min(9, d.rows.length + 3);
    const showChart = Math.max(st.has('chart'), st.has('pie'), st.has('line'));
    const vert = r.h > r.w * 1.1;
    const gw = showChart && !vert ? r.w * 0.52 : r.w - 40;
    const cw = Math.min(300, (gw - 60) / nc), rh = Math.max(50, Math.min(64, (r.h - 70) / (nr + 1)));
    const x0 = r.x + 20, y0 = r.y + 70;
    // formül çubuğu
    R(ctx, r.x, r.y, r.w, 54, 0, '#EEF1F8');
    TX(ctx, 'fx', r.x + 20, r.y + 27, { size: 26, color: '#566089', fam: 'display' });
    const fShow = st.has('avg') ? (d.avgF || '=ORTALAMA(B2:B5)') : st.has('formula') ? (d.sumF || '=TOPLA(B2:B5)') : '';
    if (fShow) TX(ctx, fShow, r.x + 80, r.y + 27, { size: 26, color: P.kobalt, maxW: r.w - 120 });
    // başlıklar
    ctx.fillStyle = '#E3E8F5'; ctx.fillRect(x0, y0, 60 + cw * (nc - 1), rh); ctx.fillRect(x0, y0, 60, rh * (nr + 1));
    const letters = 'ABCDEFG';
    BF.CHECK.mute++;
    for (let i = 0; i < nc - 1; i++) TX(ctx, letters[i], x0 + 60 + i * cw + cw / 2, y0 + rh / 2, { size: 26, align: 'center', color: '#566089', fam: 'display' });
    for (let j = 1; j <= nr; j++) TX(ctx, String(j), x0 + 30, y0 + j * rh + rh / 2, { size: 26, align: 'center', color: '#566089', fam: 'display' });
    BF.CHECK.mute--;
    ctx.strokeStyle = '#C9D0E3'; ctx.lineWidth = 1.5;
    for (let i = 0; i < nc; i++) { ctx.beginPath(); ctx.moveTo(x0 + 60 + i * cw, y0); ctx.lineTo(x0 + 60 + i * cw, y0 + rh * (nr + 1)); ctx.stroke(); }
    for (let j = 0; j <= nr + 1; j++) { ctx.beginPath(); ctx.moveTo(x0, y0 + j * rh); ctx.lineTo(x0 + 60 + cw * (nc - 1), y0 + j * rh); ctx.stroke(); }
    const en = st.has('enter') || (d.preload ? 1 : 0);
    const fm = st.has('format');
    let rows = d.rows.map((x) => x.slice());
    if (st.has('clean') > 0.5 && d.clean) rows = d.clean.map((x) => x.slice());
    if (st.has('sort') > 0.5) rows.sort((a, b) => (+b[1]) - (+a[1]));
    const allRows = rows.slice();
    if (st.has('filter') > 0.5 && d.filterMin != null) rows = rows.filter((x) => (+x[1] || 0) >= d.filterMin);
    const cell = (i, j, s, o = {}) => TX(ctx, String(s), x0 + 60 + i * cw + 12, y0 + j * rh + rh / 2, Object.assign({ size: 27, maxW: cw - 20 }, o));
    if (en) {
      if (fm) { ctx.save(); ctx.globalAlpha *= fm; ctx.fillStyle = 'rgba(45,179,110,0.25)'; ctx.fillRect(x0 + 60, y0 + rh, cw * (nc - 1), rh); ctx.restore(); }
      d.cols.forEach((c, i) => cell(i, 1, c, { weight: fm ? 800 : 600, color: fm ? '#1E6B45' : P.murekkep }));
      rows.forEach((row, j) => row.forEach((v, i) => { const k = clamp(en * rows.length * 1.2 - j); if (k > 0) cell(i, j + 2, v, { alpha: k, color: d.bad && d.bad.some(([bj, bi]) => bj === j && bi === i) && !(st.has('clean') > 0.5) ? P.mercan : P.murekkep }); }));
    }
    const lastRow = rows.length + 2;
    const sum = allRows.reduce((s, x) => s + (+x[1] || 0), 0);
    if (st.has('formula')) { const a = st.has('formula'); cell(0, lastRow, d.sumLabel || 'Toplam', { weight: 800, alpha: a }); cell(1, lastRow, sum, { weight: 800, color: P.kobalt, alpha: a }); ctx.save(); ctx.strokeStyle = P.kobalt; ctx.lineWidth = 3; ctx.strokeRect(x0 + 60 + cw, y0 + lastRow * rh, cw, rh); ctx.restore(); }
    if (st.has('avg')) { const a = st.has('avg'); cell(0, lastRow + 1, 'Ortalama', { weight: 800, alpha: a }); cell(1, lastRow + 1, (sum / allRows.length).toFixed(1).replace('.', ','), { weight: 800, color: P.mor, alpha: a }); }
    if (st.has('filter')) { const a = st.has('filter'); S.chip(ctx, d.filterLabel || '▼ filtre: > 30', x0 + 60 + cw * (nc - 1) + 20, y0 + rh * 1.5, { size: 26, fam: 'body', align: 'left', bg: P.safran, color: P.murekkep, alpha: a }); }
    if (showChart) {
      let cx = r.x + r.w * 0.56, cy = r.y + 90, cw2 = r.w * 0.4, ch = r.h - 140;
      if (vert) { cx = r.x + 20; cy = r.y + 70 + rh * (nr + 1) + 24; cw2 = r.w - 40; ch = r.y + r.h - cy - 16; }
      const kind = st.has('line') > 0.5 ? 'line' : st.has('pie') > 0.5 ? 'pie' : d.chartType || 'bar';
      const grow = (i) => E.out(clamp(showChart * 1.5 - i * 0.1));
      const COLS = [P.kobalt, P.mercan, P.safran, P.zumrut, P.mor, P.turkuaz, P.lale];
      ctx.save(); ctx.globalAlpha *= showChart;
      R(ctx, cx, cy, cw2, ch, 10, '#F6F8FC');
      const vals = rows.map((x) => +x[1] || 0), mx = Math.max(...vals), tot = vals.reduce((a, b) => a + b, 0) || 1;
      if (kind === 'bar') {
        // yatay sütunlar: etiketler solda, rahat okunur
        const n = rows.length, top = cy + 64, rowH = Math.min(70, (ch - 84) / n), bx = cx + cw2 * 0.4, bmax = cw2 * 0.5;
        rows.forEach((row, i) => {
          const y = top + i * rowH + rowH / 2, w = (vals[i] / mx) * bmax * grow(i);
          TX(ctx, row[0], bx - 14, y, { size: 26, align: 'right', maxW: cw2 * 0.38 - 20 });
          R(ctx, bx, y - rowH * 0.32, Math.max(2, w), rowH * 0.64, 6, COLS[i % 7]);
          if (grow(i) > 0.9) TX(ctx, String(vals[i]), bx + w + 10, y, { size: 26, color: '#566089' });
        });
      } else if (kind === 'line') {
        const n = rows.length, x0l = cx + 50, x1l = cx + cw2 - 40, yb = cy + ch - 60, yt = cy + 70;
        const pts = rows.map((row, i) => [x0l + (n > 1 ? (i / (n - 1)) * (x1l - x0l) : 0), yb - (vals[i] / mx) * (yb - yt)]);
        const k = clamp(showChart * 1.3) * (n - 1);
        ctx.strokeStyle = P.kobalt; ctx.lineWidth = 6; ctx.lineJoin = 'round'; ctx.beginPath();
        pts.forEach(([x, y], i) => { if (i > k + 1) return; if (i === 0) ctx.moveTo(x, y); else { const f = clamp(k - (i - 1)); ctx.lineTo(lerp(pts[i - 1][0], x, f), lerp(pts[i - 1][1], y, f)); } });
        ctx.stroke();
        pts.forEach(([x, y], i) => { if (i > k) return; ctx.fillStyle = P.mercan; ctx.beginPath(); ctx.arc(x, y, 9, 0, Math.PI * 2); ctx.fill(); TX(ctx, rows[i][0], x, yb + 30, { size: 26, align: 'center', maxW: (x1l - x0l) / Math.max(1, n - 1) }); });
      } else {
        const side = cw2 > 520;
        const rad = side ? Math.min(cw2 * 0.28, ch * 0.34) : Math.min(cw2 * 0.36, ch * 0.22);
        const pcx = side ? cx + cw2 * 0.3 : cx + cw2 / 2, pcy = side ? cy + ch / 2 + 16 : cy + 70 + rad;
        let a0 = -Math.PI / 2; const g = clamp(showChart * 1.2);
        rows.forEach((row, i) => { const a1 = a0 + (vals[i] / tot) * Math.PI * 2 * g; ctx.fillStyle = COLS[i % 7]; ctx.beginPath(); ctx.moveTo(pcx, pcy); ctx.arc(pcx, pcy, rad, a0, a1); ctx.closePath(); ctx.fill(); a0 = a1; });
        rows.forEach((row, i) => {
          const lx = side ? cx + cw2 * 0.6 : cx + 40, ly = side ? cy + ch / 2 + 16 + (i - (rows.length - 1) / 2) * 44 : pcy + rad + 50 + i * 42;
          R(ctx, lx, ly - 12, 24, 24, 5, COLS[i % 7]);
          TX(ctx, row[0] + '  %' + Math.round((vals[i] / tot) * 100), lx + 36, ly, { size: 26, maxW: side ? cw2 * 0.38 : cw2 - 90, alpha: g });
        });
      }
      TX(ctx, d.chartTitle || d.cols[1], cx + cw2 / 2, cy + 30, { size: 26, align: 'center', fam: 'display', maxW: cw2 - 30 });
      ctx.restore();
    }
  };

  // ═══ ses düzenleyici
  function waveBar(ctx, x, y, w, h, seed, amp, c, from = 0, to = 1, gap) {
    const n = Math.floor(w / 9);
    for (let i = 0; i < n; i++) {
      const q = i / n; if (q < from || q > to) continue;
      if (gap && q > gap[0] && q < gap[1]) continue;
      const v = (0.25 + 0.75 * Math.abs(Math.sin(i * 0.37 + seed) * Math.sin(i * 0.11 + seed * 2))) * amp(q);
      ctx.fillStyle = c; S.rrect(ctx, x + i * 9, y - (h / 2) * v, 6, h * v, 3); ctx.fill();
    }
  }
  PAINT.audio = (ctx, r, st, t, sc) => {
    ctx.fillStyle = '#1E2342'; ctx.fillRect(r.x, r.y, r.w, r.h);
    const d = sc.data || {};
    const tx = r.x + 150, tw = r.w - 180, th = Math.min(r.h > r.w * 1.1 ? 240 : 150, (r.h - 120) / 2.3);
    const ty1 = r.y + 40 + th / 2, ty2 = ty1 + th + 40;
    // zaman cetveli
    for (let i = 0; i <= 10; i++) { ctx.fillStyle = '#566089'; ctx.fillRect(tx + (tw * i) / 10, r.y + 8, 2, 14); }
    TX(ctx, d.track1 || 'Ses 1', r.x + 20, ty1, { size: 26, color: P.sir, maxW: 120 });
    R(ctx, tx, ty1 - th / 2, tw, th, 10, '#262C52');
    const rec = st.has('record') || (d.preload ? 1 : 0);
    const cut = st.has('cut'), trim = st.has('trim'), vol = st.has('volume'), fade = st.has('fade'), fx = st.has('effect');
    const amp = (q) => (1 + vol * 0.5) * (fade ? Math.min(1, q / (0.15 * fade + 1e-6), (1 - q) / (0.15 * fade + 1e-6)) : 1);
    const from = trim * 0.12, to = 1 - trim * 0.1;
    if (rec) waveBar(ctx, tx + 10, ty1, (tw - 20) * Math.min(1, rec * 1.02), th - 20, 1.3, amp, fx ? P.mor : P.turkuaz, from, to, cut > 0.3 ? [0.45, 0.58] : null);
    if (cut > 0 && cut < 0.6) { ctx.save(); ctx.fillStyle = 'rgba(255,90,69,0.3)'; ctx.fillRect(tx + tw * 0.45, ty1 - th / 2, tw * 0.13, th); ctx.restore(); }
    if (fx) { for (let k = 1; k <= 2; k++) { ctx.save(); ctx.globalAlpha *= 0.3 / k * fx; waveBar(ctx, tx + 10 + k * 18, ty1, tw - 40, th - 30, 1.3, amp, P.mor, from, to); ctx.restore(); } }
    const mu = st.has('music');
    TX(ctx, d.track2 || 'Müzik', r.x + 20, ty2, { size: 26, color: P.sir, maxW: 120, alpha: mu ? 1 : 0.4 });
    R(ctx, tx, ty2 - th / 2, tw, th, 10, '#262C52');
    if (mu) waveBar(ctx, tx + 10, ty2, (tw - 20) * mu, th * 0.6, 4.1, (q) => 0.5, P.safran);
    // oynatma çizgisi
    const ph = (t * 0.08) % 1;
    ctx.fillStyle = P.mercan; ctx.fillRect(tx + tw * ph, r.y + 10, 3, ty2 + th / 2 - r.y);
    // alt satır: bilgi / dışa aktarım
    const ex = st.has('export'); if (ex) S.chip(ctx, d.file || 'okul-radyosu.mp3  dışa aktarıldı', r.x + r.w / 2, Math.min(r.y + r.h - 44, ty2 + th / 2 + 60), { size: 26, fam: 'body', bg: P.zumrut, color: P.sir, alpha: ex });
    if (rec > 0 && rec < 1) { ctx.fillStyle = P.mercan; ctx.beginPath(); ctx.arc(r.x + 40, r.y + r.h - 44, 14 + Math.sin(t * 8) * 3, 0, Math.PI * 2); ctx.fill(); TX(ctx, 'Kaydediliyor', r.x + 64, r.y + r.h - 44, { size: 26, color: P.sir }); }
  };

  // ═══ video düzenleyici
  PAINT.video = (ctx, r, st, t, sc) => {
    ctx.fillStyle = '#1E2342'; ctx.fillRect(r.x, r.y, r.w, r.h);
    const d = sc.data || {};
    const pw = Math.min(r.w - 40, (r.h * 0.55) / 0.5625), ph = pw * 0.5625;
    const px = r.x + (r.w - pw) / 2, py = r.y + 16;
    R(ctx, px, py, pw, ph, 6, '#000000');
    const imp = st.has('import') || (d.preload ? 1 : 0);
    const clips = [P.kobalt, P.mercan, P.zumrut, P.safran, P.mor];
    const ph2 = (t * 0.1) % 1;
    const clipIdx = Math.min(2, Math.floor(ph2 * 3));
    if (imp) { ctx.save(); ctx.beginPath(); ctx.rect(px, py, pw, ph); ctx.clip(); if (clipIdx === 0) landscape(ctx, px, py, pw, ph, t); else { R(ctx, px, py, pw, ph, 0, clips[clipIdx]); tile(ctx, px + pw / 2, py + ph / 2, ph * 0.5, ['film', 'school', 'heart'][clipIdx], clips[clipIdx], t); } ctx.restore(); }
    const tr = st.has('transition'); if (tr && Math.abs(ph2 * 3 - Math.round(ph2 * 3)) < 0.06) { ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.fillRect(px, py, pw, ph); }
    const ti = st.has('text'); if (ti) { R(ctx, px, py + ph - 70, pw, 56, 0, 'rgba(0,0,0,0.55)'); T.text(ctx, d.title || 'Okulumuzun Bir Günü', px + pw / 2, py + ph - 42, { size: Math.min(34, pw * 0.05), fam: 'display', color: '#FFFFFF', alpha: ti, maxW: pw - 40 }); }
    // zaman çizelgesi
    const ty = py + ph + 40, tw = r.w - 160, tx = r.x + 130, th = Math.min(r.h > r.w * 1.1 ? 120 : 70, (r.y + r.h - ty - 30) / 2.4);
    TX(ctx, 'Video', r.x + 20, ty + th / 2, { size: 26, color: P.sir, maxW: 100 });
    TX(ctx, 'Ses', r.x + 20, ty + th * 1.5 + 14, { size: 26, color: P.sir, maxW: 100, alpha: st.has('music') ? 1 : 0.4 });
    const cut = st.has('cut');
    const nseg = (d.clips || 2) + (cut > 0.5 && d.cutSplits !== false ? 1 : 0), segs = [];
    for (let i = 0; i < nseg; i++) segs.push([i / nseg + (i ? 0.01 : 0), (i + 1) / nseg - 0.01]);
    if (imp) segs.forEach(([a, b], i) => { R(ctx, tx + tw * a, ty, tw * (b - a) * Math.min(1, imp * 1.5), th, 8, clips[i % 5]); });
    if (tr) segs.slice(1).forEach(([a]) => { ctx.fillStyle = P.safran; ctx.save(); ctx.globalAlpha *= tr; ctx.beginPath(); ctx.moveTo(tx + tw * a - 16, ty + th / 2); ctx.lineTo(tx + tw * a, ty + 6); ctx.lineTo(tx + tw * a + 16, ty + th / 2); ctx.lineTo(tx + tw * a, ty + th - 6); ctx.closePath(); ctx.fill(); ctx.restore(); });
    if (ti) R(ctx, tx + tw * 0.02, ty - 22, tw * 0.3, 16, 6, P.sir);
    const mu = st.has('music'); if (mu) { R(ctx, tx, ty + th + 14, tw * mu, th * 0.8, 8, '#3A2F70'); waveBar(ctx, tx + 8, ty + th * 1.4 + 14, tw * mu - 16, th * 0.6, 2.2, () => 0.6, P.safran); }
    ctx.fillStyle = P.mercan; ctx.fillRect(tx + tw * ph2, ty - 30, 3, th * 2 + 50);
    const sp = st.has('speed'); if (sp) S.chip(ctx, d.speed || 'Hız: 1,5×', r.x + r.w - 140, py + 40, { size: 26, fam: 'body', bg: P.mor, color: P.sir, alpha: sp });
    const ex = st.has('export'); if (ex) S.chip(ctx, d.file || 'okulumuz.mp4  dışa aktarıldı', r.x + r.w / 2, py + ph / 2, { size: 28, fam: 'body', bg: P.zumrut, color: P.sir, alpha: ex });
  };

  // ═══ e-posta
  PAINT.mail = (ctx, r, st, t, sc) => {
    ctx.fillStyle = '#FFFFFF'; ctx.fillRect(r.x, r.y, r.w, r.h);
    const d = sc.data || {};
    const fx = r.x + 40, fw = r.w - 80, lab = 160;
    const fields = [['to', 'Kime', d.to || 'ogretmen@okul.k12.tr'], ['cc', 'Bilgi', d.cc || 'veli@ornek.com'], ['subject', 'Konu', d.subject || 'Proje ödevim']];
    let y = r.y + 50;
    const sent = st.has('send');
    ctx.save(); ctx.globalAlpha *= 1 - sent * 0.6;
    fields.forEach(([id, l, v]) => {
      TX(ctx, l, fx, y, { size: 26, color: '#566089', weight: 800, maxW: lab - 10 });
      const k = st.has(id);
      if (k) TX(ctx, v.slice(0, Math.ceil(v.length * clamp(k * 1.3))), fx + lab, y, { size: 27, color: id === 'subject' ? P.murekkep : P.kobalt, maxW: fw - lab });
      ctx.fillStyle = '#E3E8F5'; ctx.fillRect(fx, y + 26, fw, 2);
      y += 72;
    });
    const bd = st.has('body');
    (d.body || ['Merhaba Öğretmenim,', 'Proje ödevimi ekte gönderiyorum.', 'Saygılarımla, Elif']).forEach((s, i) => { const k = clamp(bd * 3 - i * 0.8); if (k > 0) TX(ctx, s.slice(0, Math.ceil(s.length * k)), fx, y + 20 + i * 48, { size: 27, maxW: fw }); });
    const at = st.has('attach'); if (at) { const ay = r.y + r.h - 120; R(ctx, fx, ay, 360, 64, 12, '#EEF1F8'); BF.icon(ctx, 'fileDoc', fx + 40, ay + 32, 48, t); TX(ctx, d.file || 'proje.docx', fx + 80, ay + 32, { size: 26, alpha: at, maxW: 260 }); }
    ctx.restore();
    // gönder düğmesi
    const bx = r.x + r.w - 220, by = r.y + r.h - 110;
    R(ctx, bx, by, 180, 64, 14, sent ? P.zumrut : P.kobalt);
    T.text(ctx, sent > 0.3 ? 'Gönderildi' : 'Gönder', bx + 90, by + 32, { size: 26, color: P.sir, maxW: 160 });
    if (sent > 0 && sent < 1) { ctx.save(); ctx.translate(lerp(r.x + r.w / 2, r.x + r.w + 100, E.in(sent)), lerp(r.y + r.h / 2, r.y - 60, E.in(sent))); ctx.rotate(-0.3); BF.icon(ctx, 'mail', 0, 0, 110, t); ctx.restore(); }
  };

  // ═══ tarayıcı / arama motoru
  PAINT.browser = (ctx, r, st, t, sc) => {
    ctx.fillStyle = '#FFFFFF'; ctx.fillRect(r.x, r.y, r.w, r.h);
    const d = sc.data || {};
    // adres ve arama kutusu
    R(ctx, r.x + 20, r.y + 16, r.w - 40, 50, 25, '#EEF1F8');
    let q = d.query || 'kelebek göçü';
    if (st.has('quote') > 0.3) q = d.quoteQ || '"kral kelebeği göçü"';
    if (st.has('minus') > 0.3) q += d.minusQ || ' -oyun';
    if (st.has('site') > 0.3) q += d.siteQ || ' site:edu.tr';
    if (st.has('filetype') > 0.3) q += d.fileQ || ' filetype:pdf';
    const ty = st.has('query') || (d.preload ? 1 : 0);
    BF.icon(ctx, 'search', r.x + 50, r.y + 41, 34, t);
    if (ty) TX(ctx, q.slice(0, Math.ceil(q.length * clamp(ty * 1.4))), r.x + 80, r.y + 41, { size: 27, maxW: r.w - 140 });
    // sonuçlar
    const res = (st.has('filetype') > 0.5 && d.resFile) || (st.has('site') > 0.5 && d.resSite) || (st.has('minus') > 0.5 && d.resMinus) || (st.has('quote') > 0.5 && d.resQuote) || d.res || [['Kelebekler nasıl göç eder?', 'ornekblog.com', 'blog'], ['Kelebek oyunu indir', 'oyunlar.com', 'oyun'], ['Göç eden böcekler', 'ansiklopedi.org', 'ans']];
    const cnt = st.has('query') || d.preload ? res.length : 0;
    const N = (d.count || ['1.240.000 sonuç', '38.500 sonuç', '12.300 sonuç', '860 sonuç', '42 sonuç'])[Math.min(4, ['quote', 'minus', 'site', 'filetype'].filter((k) => st.has(k) > 0.5).length)];
    if (cnt) TX(ctx, N, r.x + 40, r.y + 100, { size: 26, color: '#566089', maxW: 400 });
    const rh = Math.min(110, (r.h - 150) / 3.2);
    res.slice(0, cnt).forEach(([title, url, tag], i) => {
      const y = r.y + 150 + i * rh;
      const a = clamp(ty * 3 - i * 0.5);
      TX(ctx, url, r.x + 40, y, { size: 26, color: P.zumrut, alpha: a, maxW: r.w - 120 });
      TX(ctx, title, r.x + 40, y + 34, { size: 29, color: P.kobalt, weight: 800, alpha: a, maxW: r.w - 220 });
      const v = st.has('verify');
      if (v && d.trust) { const ok = d.trust[i]; S.chip(ctx, ok ? 'güvenilir' : 'kontrol et', r.x + r.w - 110, y + 16, { size: 26, fam: 'body', bg: ok ? P.zumrut : P.mercan, color: P.sir, alpha: clamp(v * 3 - i * 0.4) }); }
    });
  };

  // ═══ sohbet (yapay zekâ aracı) — data.msgs: [{who:'me'|'ai', text, tool}]
  PAINT.chat = (ctx, r, st, t, sc) => {
    ctx.fillStyle = '#F4F6FB'; ctx.fillRect(r.x, r.y, r.w, r.h);
    const d = sc.data || {};
    const msgs = (d.msgs || []).filter((m) => st.has(m.tool) > 0);
    const bw = r.w * (r.h > r.w * 1.1 ? 0.78 : 0.62), pad = 22, size = 27;
    // alttan yukarı: son mesajlar görünür kalsın
    const hs = msgs.map((m) => { const lines = T.wrap ? T.wrap(ctx, m.text, bw - pad * 2, size, 'body', 700).length : Math.ceil(T.measure(ctx, m.text, size, 'body', 700) / (bw - pad * 2)); return lines * size * 1.22 + pad * 1.6; });
    let y = r.y + r.h - 96;
    const pos = [];
    for (let i = msgs.length - 1; i >= 0; i--) { y -= hs[i]; pos[i] = y; y -= 18; }
    msgs.forEach((m, i) => {
      if (pos[i] < r.y + 8) return;
      const k = st.has(m.tool), a = clamp(k * 3);
      const me = m.who === 'me';
      const x = me ? r.x + r.w - 30 - bw : r.x + 90;
      const txt = m.who === 'ai' ? m.text.slice(0, Math.ceil(m.text.length * clamp(k * 1.4))) : m.text;
      ctx.save(); ctx.globalAlpha *= a;
      R(ctx, x, pos[i], bw, hs[i], 18, me ? P.kobalt : '#FFFFFF');
      if (!me) { ctx.strokeStyle = '#D5DBEA'; ctx.lineWidth = 2; S.rrect(ctx, x, pos[i], bw, hs[i], 18); ctx.stroke(); tile(ctx, r.x + 50, pos[i] + 30, 52, 'ai', P.mor, t); }
      ctx.restore();
      T.para(ctx, txt || ' ', x + pad, pos[i] + pad * 0.8 + size * 0.6, { size, weight: 700, align: 'left', maxW: bw - pad * 2, color: me ? P.sir : P.murekkep, alpha: a, lh: 1.22 });
    });
    const ck = st.has('check'); if (ck) S.chip(ctx, d.checkLabel || 'Kontrol edildi: doğru', r.x + r.w - 30, r.y + 36, { size: 26, fam: 'body', align: 'right', bg: P.zumrut, color: P.sir, alpha: ck });
    // yazma kutusu
    R(ctx, r.x + 20, r.y + r.h - 76, r.w - 40, 56, 28, '#FFFFFF');
    TX(ctx, d.placeholder || 'Bir şey sor...', r.x + 50, r.y + r.h - 48, { size: 26, color: '#9AA6C8', maxW: r.w - 120 });
  };

  // ═══ model eğitme (öğretilebilir makine benzeri)
  // data: { classes:[{name,icon,c,n,n2}], test:{icon,name,probs:[…]}, test2:{icon,name,probs:[…],probs2:[…]} }
  PAINT.model = (ctx, r, st, t, sc) => {
    ctx.fillStyle = '#F4F6FB'; ctx.fillRect(r.x, r.y, r.w, r.h);
    const d = sc.data || {}, cls = d.classes || [];
    const vert = r.w < 1200;
    const shC = st.has('classes'), shS = st.has('samples'), more = st.has('more');
    const L1 = vert ? { x: r.x + 20, y: r.y + 20, w: r.w - 40, h: r.h * 0.44 } : { x: r.x + 20, y: r.y + 20, w: r.w * 0.46, h: r.h - 40 };
    const rowH = (L1.h - (cls.length - 1) * 14) / Math.max(1, cls.length);
    cls.forEach((c, i) => {
      const y = L1.y + i * (rowH + 14), a = clamp(shC * 3 - i * 0.5);
      if (a <= 0) return;
      ctx.save(); ctx.globalAlpha *= a; R(ctx, L1.x, y, L1.w, rowH, 14, '#FFFFFF'); ctx.strokeStyle = col(c.c || 'kobalt'); ctx.lineWidth = 3; S.rrect(ctx, L1.x, y, L1.w, rowH, 14); ctx.stroke(); ctx.restore();
      TX(ctx, c.name, L1.x + 20, y + 30, { size: 27, weight: 800, color: col(c.c || 'kobalt'), alpha: a, maxW: L1.w * 0.5 });
      const n = Math.round((c.n || 6) * clamp(shS * 1.2) + ((c.n2 || c.n || 6) - (c.n || 6)) * clamp(more * 1.2));
      if (shS > 0) TX(ctx, n + ' örnek', L1.x + L1.w - 20, y + 30, { size: 26, color: '#566089', align: 'right', alpha: a, maxW: 160 });
      const ts = Math.min(rowH - 62, 64), per = Math.floor((L1.w - 30) / (ts + 8));
      for (let k = 0; k < Math.min(n, per); k++) tile(ctx, L1.x + 20 + ts / 2 + k * (ts + 8), y + 50 + ts / 2, ts, c.icon, col(c.c || 'kobalt'), t, { alpha: a });
    });
    // eğitim
    const tr = Math.max(st.has('train'), st.has('retrain'));
    const bx = vert ? r.x + 20 : L1.x + L1.w + 24, by = vert ? L1.y + L1.h + 24 : r.y + 20, bw = vert ? r.w - 40 : r.w * 0.18, bh = vert ? 96 : r.h - 40;
    R(ctx, bx, by, bw, bh, 14, '#FFFFFF');
    const prog = clamp(tr * 1.4), done = tr >= 0.72;
    if (vert) { R(ctx, bx + 16, by + bh - 30, bw - 32, 16, 8, '#E3E8F5'); R(ctx, bx + 16, by + bh - 30, (bw - 32) * prog, 16, 8, P.mor); TX(ctx, done ? 'Model hazır' : tr > 0 ? 'Eğitiliyor...' : 'Eğit', bx + 16, by + 30, { size: 27, weight: 800, color: P.mor, maxW: bw - 32 }); }
    else {
      const bb = by + bh - 30; R(ctx, bx + bw / 2 - 12, bb - (bh - 110) * prog, 24, (bh - 110) * prog, 12, P.mor);
      T.para(ctx, done ? 'Model hazır' : tr > 0 ? 'Eğitiliyor' : 'Eğit', bx + bw / 2, by + 40, { size: 27, color: P.mor, maxW: bw - 20, maxLines: 2, vcenter: true });
      BF.icon(ctx, 'model', bx + bw / 2, by + bh / 2, Math.min(90, bw * 0.5), t);
    }
    // test
    const tx0 = vert ? r.x + 20 : bx + bw + 24, ty0 = vert ? by + bh + 24 : r.y + 20, tw = vert ? r.w - 40 : r.x + r.w - 20 - tx0, th = vert ? r.y + r.h - 20 - ty0 : r.h - 40;
    R(ctx, tx0, ty0, tw, th, 14, '#FFFFFF');
    TX(ctx, 'Test', tx0 + 20, ty0 + 30, { size: 27, weight: 800, color: '#566089', maxW: tw - 40 });
    const t2 = st.has('test2'), t1 = st.has('test'), rt = st.has('retrain');
    const cur = t2 > 0 ? d.test2 : t1 > 0 ? d.test : null;
    if (cur) {
      const a = clamp((t2 > 0 ? t2 : t1) * 3);
      const ts = Math.min(tw * 0.3, th * 0.32);
      tile(ctx, tx0 + tw / 2, ty0 + 60 + ts / 2, ts, cur.icon, P.kobalt, t, { alpha: a });
      TX(ctx, cur.name, tx0 + tw / 2, ty0 + 84 + ts, { size: 26, align: 'center', alpha: a, maxW: tw - 30 });
      const probs = t2 > 0 && rt > 0.5 && cur.probs2 ? cur.probs2 : cur.probs;
      const y0 = ty0 + 120 + ts, rh = Math.min(52, (ty0 + th - y0 - 10) / Math.max(1, cls.length));
      cls.forEach((c, i) => {
        const y = y0 + i * rh, v = (probs[i] || 0) * clamp(a * 1.2);
        TX(ctx, c.name, tx0 + 20, y + rh / 2, { size: 26, alpha: a, maxW: tw * 0.36 });
        R(ctx, tx0 + tw * 0.4, y + rh * 0.2, (tw * 0.6 - 90) * v, rh * 0.6, 8, col(c.c || 'kobalt'));
        TX(ctx, '%' + Math.round(v * 100), tx0 + tw - 20, y + rh / 2, { size: 26, align: 'right', alpha: a, maxW: 80 });
      });
    }
  };

  // ═══ dosya gezgini
  PAINT.folder = (ctx, r, st, t, sc) => {
    ctx.fillStyle = '#FFFFFF'; ctx.fillRect(r.x, r.y, r.w, r.h);
    const d = sc.data || {};
    const tw = Math.min(300, r.w * 0.28);
    R(ctx, r.x, r.y, tw, r.h, 0, '#EEF1F8');
    const tree = ['Belgelerim', '  Ödevler', '  Fotoğraflar'].concat(st.has('newfolder') > 0.5 ? [st.has('rename') > 0.5 ? '  ' + (d.newName || 'Bilişim') : '  Yeni klasör'] : []);
    tree.forEach((s, i) => { BF.icon(ctx, 'folder', r.x + 36 + (s.startsWith('  ') ? 24 : 0), r.y + 44 + i * 60, 38, t); TX(ctx, s.trim(), r.x + 66 + (s.startsWith('  ') ? 24 : 0), r.y + 44 + i * 60, { size: 28, maxW: tw - 90 }); });
    // sağ bölme: dosyalar
    let files = (d.files || [['odev1.docx', 'fileDoc'], ['bahce.png', 'fileImg'], ['notlar.txt', 'file']]).map((f) => ({ name: f[0], icon: f[1], size: f[2] }));
    if (st.has('newfolder') > 0.5) files.unshift({ name: st.has('rename') > 0.5 ? d.newName || 'Bilişim' : 'Yeni klasör', icon: 'folder', sel: st.has('rename') > 0 && st.has('rename') < 1 });
    if (st.has('copy') > 0.5) files.push({ name: d.copyName || 'bahce - Kopya.png', icon: 'fileImg' });
    if (st.has('move') > 0.5) files = files.filter((f) => f.name !== (d.moveName || 'odev1.docx'));
    if (st.has('delete') > 0.5) files = files.filter((f) => f.name !== (d.deleteName || 'notlar.txt'));
    if (st.has('zip') > 0.5) files.push({ name: d.zipName || 'odevler.zip', icon: 'fileZip' });
    const cell = 236, gx = r.x + tw + 30, cols = Math.max(2, Math.floor((r.w - tw - 60) / cell));
    files.forEach((f, i) => {
      const x = gx + (i % cols) * cell + cell / 2, y = r.y + 110 + Math.floor(i / cols) * 250;
      if (f.sel) { R(ctx, x - 100, y - 90, 200, 220, 14, 'rgba(39,72,194,0.15)'); }
      tile(ctx, x, y, 136, f.icon, f.icon === 'folder' ? P.safran : P.kobalt, t);
      T.para(ctx, f.name, x, y + 98, { size: 28, maxW: cell - 20, maxLines: 2, color: P.murekkep, minSize: 26, lh: 1.05 });
    });
    if (st.has('move') > 0 && st.has('move') < 1) { const m = st.has('move'); tile(ctx, lerp(gx + 118, r.x + 80, E.inOut(m)), lerp(r.y + 110, r.y + 94, E.inOut(m)), 100 * (1 - m * 0.4), 'fileDoc', P.kobalt, t); }
    if (st.has('delete') > 0 && st.has('delete') < 1) { const m = st.has('delete'); tile(ctx, lerp(gx + 460, r.x + r.w - 80, E.inOut(m)), lerp(r.y + 90, r.y + r.h - 80, E.inOut(m)), 80 * (1 - m * 0.5), 'file', P.mercan, t); }
    BF.icon(ctx, 'trash', r.x + r.w - 80, r.y + r.h - 80, 70, t);
    if (st.has('zip')) { const z = st.has('zip'); S.chip(ctx, d.zipInfo || '12 MB → 4 MB', r.x + r.w / 2 + tw / 2, r.y + r.h - 50, { size: 26, fam: 'body', bg: P.safran, color: P.murekkep, alpha: z }); }
    if (st.has('ext')) { S.chip(ctx, 'Dosya uzantıları görünür', r.x + tw + 180, r.y + r.h - 50, { size: 26, fam: 'body', bg: P.kobalt, color: P.sir, alpha: st.has('ext') }); }
  };

  TPL.app = {
    draw(ctx, L, lt, t, sc) {
      const W = winRect(L);
      const a = go(lt, 0.1, 0.6);
      ctx.save(); ctx.globalAlpha *= a;
      ctx.translate(0, (1 - E.out(a)) * 40);
      panel(ctx, W.x + 10, W.y + 14, W.w, W.h, { bg: 'rgba(3,6,20,0.45)', r: 22 });
      panel(ctx, W.x, W.y, W.w, W.h, { bg: '#F3F5FB', r: 22 });
      R(ctx, W.x, W.y, W.w, 48, 22, col(sc.titleC || 'kobalt'));
      R(ctx, W.x, W.y + 26, W.w, 22, 0, col(sc.titleC || 'kobalt'));
      [P.mercan, P.safran, P.zumrut].forEach((c, i) => { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(W.x + 28 + i * 26, W.y + 24, 8, 0, Math.PI * 2); ctx.fill(); });
      T.text(ctx, sc.title || 'Program', W.x + W.w / 2, W.y + 25, { size: 26, fam: 'display', color: P.sir, maxW: W.w - 200 });
      const st = makeState(sc, lt);
      const { rects, bottom } = toolRects(ctx, L, W, sc.tools);
      sc.tools.forEach((tl, i) => {
        const q = rects[i];
        const on = st.cur === tl.id, used = st.has(tl.id) >= 1;
        R(ctx, q.x, q.y, q.w, q.h, 14, on ? P.safran : used ? '#DDF3E7' : '#FFFFFF');
        ctx.strokeStyle = on ? '#C98A10' : '#D5DAEA'; ctx.lineWidth = 2; S.rrect(ctx, q.x, q.y, q.w, q.h, 14); ctx.stroke();
        T.text(ctx, tl.label, q.x + q.w / 2, q.y + q.h / 2, { size: 27, color: P.murekkep, maxW: q.w - 20, minSize: 22 });
      });
      const WR = { x: W.x + 16, y: bottom, w: W.w - 32, h: W.y + W.h - bottom - 16 };
      ctx.save(); ctx.beginPath(); S.rrect(ctx, WR.x, WR.y, WR.w, WR.h, 12); ctx.clip();
      (PAINT[sc.app] || (() => {}))(ctx, WR, st, t, sc);
      ctx.restore();
      // imleç
      let cx = WR.x + WR.w * 0.6, cy = WR.y + WR.h * 0.6, click = 0;
      const tt = st.tt;
      for (let i = 0; i < tt.length; i++) {
        const x = tt[i], q = rects[sc.tools.findIndex((tl) => tl.id === x.id)];
        if (!q) continue;
        const px = i ? rects[sc.tools.findIndex((tl) => tl.id === tt[i - 1].id)] : null;
        const from = px ? [WR.x + WR.w * 0.55, WR.y + WR.h * 0.5] : [WR.x + WR.w * 0.6, WR.y + WR.h * 0.6];
        const tb = [q.x + q.w * 0.6, q.y + q.h * 0.65], wk = [WR.x + WR.w * (0.45 + (i % 3) * 0.05), WR.y + WR.h * 0.5];
        if (lt >= x.t && lt < x.click) { const f = E.inOut(seg(lt, x.t, x.click)); cx = lerp(from[0], tb[0], f); cy = lerp(from[1], tb[1], f); }
        else if (lt >= x.click && lt < x.apply + 0.8) { const f = E.inOut(seg(lt, x.click + 0.15, x.apply + 0.8)); cx = lerp(tb[0], wk[0], f); cy = lerp(tb[1], wk[1], f); click = Math.max(0, 1 - Math.abs(lt - x.click) / 0.15); }
        else if (lt >= x.apply + 0.8) { cx = wk[0]; cy = wk[1]; }
      }
      ctx.save(); ctx.translate(cx, cy); ctx.scale(1 - click * 0.2, 1 - click * 0.2);
      ctx.fillStyle = P.murekkep; ctx.strokeStyle = P.sir; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 40); ctx.lineTo(11, 30); ctx.lineTo(19, 46); ctx.lineTo(26, 42); ctx.lineTo(18, 27); ctx.lineTo(32, 27); ctx.closePath(); ctx.fill(); ctx.stroke();
      if (click > 0) { ctx.strokeStyle = P.safran; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(0, 0, 26 * (1 - click) + 8, 0, Math.PI * 2); ctx.stroke(); }
      ctx.restore();
      ctx.restore();
      // araç açıklaması (kısa not)
      const k = bIdx(sc, lt), b = sc.beats[k];
      if (b && b.hint) S.chip(ctx, b.hint, L.cx, L.pick(W.y + W.h + 2, W.y + W.h + 4), { size: 28, fam: 'body', bg: P.safran, color: P.murekkep, alpha: go(lt, b.t + 1.2, b.t + 1.6), maxW: L.W - 200 });
      drawK(ctx, sc, lt, t, L.pick([1830, 868, 72], [980, 1462, 64]), { look: [-0.8, -0.6] });
    },
    cues(sc) {
      const c = [{ at: 0.1, sfx: 'whoosh', dur: 0.5, gain: 0.5 }];
      toolTimes(sc).forEach((x, i) => { c.push({ at: x.t, sfx: 'whoosh', dur: 0.5, gain: 0.25 }, { at: x.click, sfx: 'pop', pitch: 1.6, gain: 0.5 }, { at: x.apply + 0.2, sfx: x.id === 'save' || x.id === 'send' || x.id === 'export' ? 'sparkle' : 'ding', f: [988, 1175, 1319, 1568][i % 4], gain: 0.6 }); });
      return c.concat(karoCues(sc));
    },
  };
  BF.APP_PAINT = PAINT;
})(typeof window !== 'undefined' ? window : globalThis);
