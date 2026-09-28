/* ─────────────────────────────────────────────────────────────
   SAHNE ŞABLONLARI / Scene templates
   Bir film, scenes/film.js içinde BF.defineFilm({...}) ile yazılan bir
   senaryodur: her sahne bir şablon (type) ve "vuruş"lardan (beats) oluşur.
   Her vuruş bir altyazı + o anda ekranda olacak şeydir. Süreler altyazının
   uzunluğundan hesaplanır: öğrencinin okumasına yetecek kadar.

   Şablonlar: intro · cards · compare · sort · steps · judge · columns ·
              app · network · flow · code · summary
   Her şablon iki şey verir: çizim (ctx, L, lt, t, sc) ve ses olayları (cues).
   ───────────────────────────────────────────────────────────── */
(function (root) {
  const BF = (root.BF = root.BF || {});
  const { M, P, S, T } = BF;
  const { E, seg, pop, win, go, lerp, clamp, track } = M;
  const TPL = (BF.TPL = BF.TPL || {});

  // ─── zamanlama ────────────────────────────────────────────────
  const READ = 10; // 5. sınıf okuma hızı (harf/sn) — altyazı süresini belirler
  function beatDur(b) {
    const n = (b.tr || '').length;
    return Math.max(b.min || 6.5, Math.min(12, 2.8 + n / READ)) + (b.extra || 0);
  }
  function timeFilm(spec) {
    let t = 0;
    spec.scenes.forEach((sc, i) => {
      sc.id = sc.id || `s${i}`;
      sc.index = i;
      const lead = sc.lead != null ? sc.lead : i === 0 ? 0.6 : 1.1;
      let x = lead;
      sc.beats.forEach((b, j) => { b.i = j; b.t = x; b.d = beatDur(b); x += b.d; });
      sc.dur = +Math.max(x + (sc.tail != null ? sc.tail : 0.9), sc.minDur || 0).toFixed(2);
      sc.t0 = +t.toFixed(2); sc.t1 = +(t + sc.dur).toFixed(2);
      t += sc.dur;
    });
    spec.duration = +t.toFixed(2);
    return spec;
  }
  function captionsOf(spec) {
    const out = [];
    spec.scenes.forEach((sc, i) => sc.beats.forEach((b) => {
      if (!b.tr) return;
      out.push({ scene: i + 1, start: +(sc.t0 + b.t + 0.35).toFixed(1), end: +(sc.t0 + b.t + b.d - 0.45).toFixed(1), tr: b.tr, en: b.en, note: b.note || b.tr });
    }));
    return out;
  }

  // ─── ortak yardımcılar ────────────────────────────────────────
  const K = (ctx, st, t) => BF.drawKaro(ctx, st, t);
  const tile = (ctx, x, y, s, icon, color, t, o = {}) => S.tile(ctx, x, y, s, Object.assign({ icon, color, t }, o));
  const bIdx = (sc, lt) => { let k = -1; sc.beats.forEach((b, i) => { if (lt >= b.t) k = i; }); return k; };
  const col = (c) => (typeof c === 'string' && P[c]) || c || P.turkuaz;
  const ink = (c) => { // açık zeminde koyu, koyu zeminde açık yazı
    const h = String(col(c)).replace('#', '');
    if (h.length !== 6) return P.sir;
    const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
    return 0.299 * r + 0.587 * g + 0.114 * b > 0.55 ? P.murekkep : P.sir;
  };
  const lite = (c) => (col(c) === P.kobalt ? '#8FA6FF' : col(c) === P.mor ? '#B8A5FF' : col(c));
  const pentaUp = (i) => Math.pow(2, [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24][i % 11] / 12);

  // Karo'nun vuruşa göre hâli: beat.karo = {mood, caret, arms} ile geçersiz kılınabilir
  function karoMood(sc, lt, dflt = {}) {
    const k = bIdx(sc, lt);
    const b = sc.beats[k] || {};
    const m = Object.assign({ mood: 'happy', caret: 'bar' }, dflt, b.karo || {});
    return m;
  }
  const armsFor = (m, lt) => {
    if (m.mood === 'proud') return [2.5 + Math.sin(lt * 4) * 0.15, 0.4];
    if (m.mood === 'surprised') return [2.6, 2.6];
    if (m.mood === 'thinking') return [0.3, 2.0];
    if (m.mood === 'worried') return [0.5, 0.5];
    if (m.caret === '!' ) return [0.3, 2.6];
    return [0.35 + Math.sin(lt * 2.2) * 0.1, 0.5];
  };
  function drawK(ctx, sc, lt, t, pos, extra = {}) {
    const m = karoMood(sc, lt, extra);
    const [aL, aR] = extra.arms || armsFor(m, lt);
    K(ctx, Object.assign({ x: pos[0], y: pos[1], s: pos[2] || 100, mood: m.mood, caret: m.caret, look: extra.look || [0, -0.4], armL: aL, armR: aR, seed: sc.index + 3 }, extra.st || {}), t);
  }
  // Karo'nun vuruş başlarındaki sesleri
  function karoCues(sc, dflt) {
    const out = [];
    sc.beats.forEach((b, i) => {
      const m = (b.karo && b.karo.mood) || (i === 0 ? dflt : null);
      if (m && m !== 'neutral' && m !== 'thinking') out.push({ at: b.t + 0.5, sfx: 'karo', mood: m === 'surprised' ? 'surprised' : m === 'worried' ? 'worried' : m === 'proud' ? 'proud' : 'happy', pan: -0.6 });
      if (b.karo && b.karo.caret === '?') out.push({ at: b.t + 0.5, sfx: 'karo', mood: 'question', pan: -0.6 });
    });
    return out;
  }

  // yazıyı iki satıra böl (dikey başlıklar için)
  function splitTwo(str) {
    const w = str.split(' ');
    if (w.length < 2) return [str];
    let best = 1, bd = 1e9;
    for (let i = 1; i < w.length; i++) { const a = w.slice(0, i).join(' ').length, b = w.slice(i).join(' ').length; if (Math.abs(a - b) < bd) { bd = Math.abs(a - b); best = i; } }
    return [w.slice(0, best).join(' '), w.slice(best).join(' ')];
  }

  // Ortalanmış çip dizisi; çok genişse satır kırar. Döndürür: satır sayısı
  function chipRow(ctx, items, cx, cy, o = {}) {
    const size = o.size || 32, fam = o.fam || 'body', gap = o.gap || 18, maxW = o.maxW || 1600, lh = o.lh || size * 2.3;
    const ws = items.map((it) => Math.min(maxW, T.measure(ctx, it.text, size, fam, 800) + size * 1.4));
    const rows = [[]]; let w = 0;
    ws.forEach((wi, i) => { if (w + wi > maxW && rows[rows.length - 1].length) { rows.push([]); w = 0; } rows[rows.length - 1].push(i); w += wi + gap; });
    rows.forEach((r, ri) => {
      const tot = r.reduce((s, i) => s + ws[i], 0) + gap * (r.length - 1);
      let x = cx - tot / 2;
      const y = cy + (ri - (rows.length - 1) / 2) * lh;
      r.forEach((i) => {
        const it = items[i];
        const sc = it.scale == null ? 1 : it.scale;
        S.chip(ctx, it.text, x + ws[i] / 2, y, { size, fam, bg: it.bg || P.gece2, stroke: it.stroke, lw: 4, color: it.color || P.sir, alpha: it.alpha == null ? 1 : it.alpha, scale: sc, maxW: ws[i] });
        x += ws[i] + gap;
      });
    });
    return rows.length;
  }

  // Panel (yuvarlak köşeli koyu kutu)
  function panel(ctx, x, y, w, h, o = {}) {
    const a = o.alpha == null ? 1 : o.alpha;
    if (a <= 0.001) return;
    ctx.save(); ctx.globalAlpha *= a;
    ctx.fillStyle = o.bg || 'rgba(28,42,92,0.88)';
    S.rrect(ctx, x, y, w, h, o.r || 26); ctx.fill();
    if (o.stroke) { ctx.strokeStyle = o.stroke; ctx.lineWidth = o.lw || 4; if (o.dash) ctx.setLineDash(o.dash); S.rrect(ctx, x, y, w, h, o.r || 26); ctx.stroke(); ctx.setLineDash([]); }
    ctx.restore();
  }

  // Damga: ✓ ya da ✕
  function stamp(ctx, x, y, r, ok, p) {
    if (p <= 0.01) return;
    const s = E.back(clamp(p));
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.rotate((1 - clamp(p)) * -0.6);
    ctx.fillStyle = ok ? P.zumrut : P.mercan;
    ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = P.sir; ctx.lineWidth = r * 0.2; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath();
    if (ok) { ctx.moveTo(-r * 0.42, 0); ctx.lineTo(-r * 0.1, r * 0.32); ctx.lineTo(r * 0.45, -r * 0.35); }
    else { ctx.moveTo(-r * 0.35, -r * 0.35); ctx.lineTo(r * 0.35, r * 0.35); ctx.moveTo(r * 0.35, -r * 0.35); ctx.lineTo(-r * 0.35, r * 0.35); }
    ctx.stroke(); ctx.restore();
  }

  // ═══ intro ═══════════════════════════════════════════════════
  // { type:'intro', icons:[{icon,c}], beats:[…] }  (başlık meta'dan)
  const INTRO_H = [[700, 560], [1220, 560], [500, 560], [1420, 560], [300, 560], [1620, 560], [670, 760], [1250, 760], [470, 760], [1450, 760]];
  const INTRO_V = [[340, 790], [740, 790], [340, 1340], [740, 1340], [140, 790], [940, 790], [140, 1340], [940, 1340], [540, 790], [540, 1340]];
  TPL.intro = {
    draw(ctx, L, lt, t, sc) {
      const meta = BF.META;
      const tsz = L.pick(118, 124);
      let lines = [meta.title];
      if (L.v && T.measure(ctx, meta.title, tsz, 'display', 800) > 960) lines = splitTwo(meta.title);
      let size = tsz;
      lines.forEach((ln) => { const w = T.measure(ctx, ln, size, 'display', 800); if (w > L.W - 140) size *= (L.W - 140) / w; });
      const g = ++BF.CHECK.group;
      let k = 0;
      lines.forEach((ln, li) => {
        const y = L.pick(250, (lines.length > 1 ? 300 : 360) + li * 140);
        const w = T.measure(ctx, ln, size, 'display', 800);
        let x = L.cx - w / 2;
        [...ln].forEach((ch) => {
          const p = E.back(seg(lt, 0.3 + k * 0.04, 0.75 + k * 0.04)); k++;
          const cw = T.measure(ctx, ch, size, 'display', 800);
          T.text(ctx, ch, x + cw / 2, y - (1 - p) * 60, { size, fam: 'display', color: /[?!]/.test(ch) ? P.safran : P.sir, alpha: clamp(p * 1.5), group: g });
          x += cw;
        });
      });
      const subA = go(lt, 1.0, 1.6);
      const gradeLine = `${meta.code} · ${meta.grade}. sınıf`;
      if (L.v) {
        const y0 = lines.length > 1 ? 545 : 465;
        T.text(ctx, gradeLine, L.cx, y0, { size: 34, fam: 'display', weight: 600, color: P.turkuazA, alpha: subA });
        T.text(ctx, 'Bilişim Teknolojileri ve Yazılım', L.cx, y0 + 60, { size: 34, weight: 600, color: P.turkuazA, alpha: subA });
      } else {
        T.text(ctx, `${meta.code}  ·  ${meta.grade}. sınıf  ·  ${meta.themeShort || 'Bilişim Teknolojileri ve Yazılım'}`, L.cx, 360, { size: 32, weight: 600, color: P.turkuazA, alpha: subA, maxW: 1700 });
      }
      const slots = L.v ? INTRO_V : INTRO_H;
      (sc.icons || []).slice(0, 10).forEach((it, i) => {
        const [x, y] = slots[i];
        const s0 = pop(lt, 2.4 + i * 0.25, 0.5);
        tile(ctx, x, y, 150 * s0, it.icon, col(it.c), t, { alpha: clamp(s0 * 2) });
      });
      // Karo yukarıdan düşer, yere oturur
      const gy = L.pick(800, 1180), s = 170;
      const fall = E.in(seg(lt, 1.0, 1.45));
      const land = lt > 1.45 && lt < 1.75 ? Math.sin(((lt - 1.45) / 0.3) * Math.PI) : 0;
      const y = lt < 1.45 ? lerp(-200, gy, fall) : gy;
      const m = karoMood(sc, lt, { mood: 'happy', caret: 'bar' });
      const surprised = lt > 1.45 && lt < 2.3;
      K(ctx, {
        x: L.cx, y, s, mood: surprised ? 'surprised' : m.mood, caret: surprised ? '!' : m.caret,
        look: [Math.sin(lt * 1.2) * 0.8, -0.3], armL: surprised ? 2.6 : 0.4 + Math.sin(lt * 3) * 0.2, armR: surprised ? 2.6 : lt > 5 ? 2.2 : 0.5,
        squash: 1 - land * 0.18, alpha: lt < 1.0 ? 0 : 1, seed: 2,
      }, t);
    },
    cues(sc) {
      const c = [{ at: 0.3, sfx: 'whoosh', dur: 0.8, gain: 0.5 }, { at: 1.0, sfx: 'whoosh', dur: 0.45, up: false, gain: 0.6 }, { at: 1.45, sfx: 'land' }, { at: 1.5, sfx: 'karo', mood: 'surprised' }, { at: 2.3, sfx: 'karo', mood: 'happy' }];
      (sc.icons || []).slice(0, 10).forEach((it, i) => c.push({ at: 2.4 + i * 0.25, sfx: 'pop', pitch: pentaUp(i), pan: i % 2 ? 0.5 : -0.5 }));
      sc.beats.forEach((b, i) => { if (i > 0) c.push({ at: b.t + 0.5, sfx: 'karo', mood: 'question' }); });
      return c;
    },
  };

  // ═══ cards ═══════════════════════════════════════════════════
  // { type:'cards', cards:[{word, def, icon, c}], result?:{word, c, chips:[…], line} }
  // Vuruşlar: her kart için bir vuruş (+ sonuç varsa son vuruş).
  function cardsLayout(L, n) {
    if (!L.v) {
      const xs = { 1: [960], 2: [620, 1300], 3: [400, 960, 1520], 4: [300, 740, 1180, 1620] }[n];
      return { xs, ts: { 1: 240, 2: 230, 3: 210, 4: 180 }[n], defW: { 1: 900, 2: 560, 3: 470, 4: 400 }[n], word: n === 4 ? 44 : 50, def: n === 4 ? 33 : 36 };
    }
    const ys = { 1: [600], 2: [450, 830], 3: [380, 700, 1020], 4: [330, 600, 870, 1140] }[n];
    return { ys, ts: n === 4 ? 170 : 200, defW: 640, word: 48, def: 34 };
  }
  TPL.cards = {
    draw(ctx, L, lt, t, sc) {
      const cards = sc.cards, n = cards.length, lay = cardsLayout(L, n);
      const hasRes = !!sc.result;
      const resB = hasRes ? sc.beats[sc.beats.length - 1] : null;
      const MERGE = hasRes ? resB.t : 1e9;
      const mA = go(lt, MERGE, MERGE + 0.6);
      const k = bIdx(sc, lt);
      cards.forEach((c, i) => {
        const b = sc.beats[Math.min(i, sc.beats.length - 1)];
        const at = b.t + 0.2 + (c.delay || 0);
        const p = pop(lt, at, 0.55);
        const a = clamp(p * 2) * (1 - mA);
        if (a <= 0.01) return;
        const active = k === i;
        const dim = active || k >= n ? 1 : 0.55;
        const wc = lite(c.c);
        if (!L.v) {
          const x = lay.xs[i];
          tile(ctx, x, 360, lay.ts * p, c.icon, col(c.c), t, { alpha: a, glow: active ? 0.7 : 0 });
          T.text(ctx, c.word, x, 530, { size: lay.word, fam: 'display', color: wc, alpha: a * clamp(dim + 0.2), maxW: (lay.defW + 20) });
          T.para(ctx, c.def, x, 600, { size: lay.def, maxW: lay.defW, color: P.sir, alpha: a * dim, maxLines: 3 });
        } else {
          const y = lay.ys[i];
          tile(ctx, 190, y, lay.ts * p, c.icon, col(c.c), t, { alpha: a, glow: active ? 0.7 : 0 });
          T.text(ctx, c.word, 330, y - 50, { size: lay.word, fam: 'display', align: 'left', color: wc, alpha: a * clamp(dim + 0.2), maxW: 700 });
          T.para(ctx, c.def, 330, y + 20, { size: lay.def, maxW: 680, align: 'left', color: P.sir, alpha: a * dim, maxLines: 3 });
        }
      });
      if (hasRes && lt > MERGE - 0.1) {
        const r = sc.result;
        const cy = L.pick(200, 250);
        const items = cards.map((c, i) => ({ text: c.word, bg: col(c.c), color: ink(c.c), scale: pop(lt, MERGE + 0.2 + i * 0.15, 0.45) }));
        items.forEach((it) => (it.alpha = clamp(it.scale * 2)));
        // "+" işaretleri çiplerin arasında
        let size = L.pick(34, n > 3 ? 26 : 30);
        const plus = r.join === false ? 24 : L.pick(64, 48);
        let ws = items.map((it) => T.measure(ctx, it.text, size, 'display', 800) + size * 1.4);
        let tot = ws.reduce((a, b) => a + b, 0) + plus * (n - 1);
        const avail = L.W - 100;
        if (tot > avail) { size = Math.max(26, size * (avail - plus * (n - 1)) / (tot - plus * (n - 1))); ws = items.map((it) => T.measure(ctx, it.text, size, 'display', 800) + size * 1.4); tot = ws.reduce((a, b) => a + b, 0) + plus * (n - 1); }
        let x = L.cx - tot / 2;
        items.forEach((it, i) => {
          S.chip(ctx, it.text, x + ws[i] / 2, cy, { size, bg: it.bg, color: it.color, alpha: it.alpha, scale: it.scale });
          x += ws[i];
          if (i < n - 1) { if (r.join !== false) T.text(ctx, r.join || '+', x + plus / 2, cy, { size: 40, fam: 'display', color: P.sir, alpha: go(lt, MERGE + 0.5, MERGE + 0.8) }); x += plus; }
        });
        const ty = L.pick(430, 480), th = L.pick(160, 170);
        const rsz = L.pick(72, 70);
        let tw = T.measure(ctx, r.word, rsz, 'display', 800) + 200;
        tw = Math.min(tw, L.W - 120);
        S.arrow(ctx, L.cx, cy + 45, L.cx, ty - th / 2 - 18, { p: go(lt, MERGE + 0.7, MERGE + 1.1), lw: 8, color: P.safran });
        const bp = pop(lt, MERGE + 1.0, 0.6);
        if (bp > 0.01) {
          ctx.save(); ctx.translate(L.cx, ty); ctx.scale(bp, bp);
          ctx.fillStyle = 'rgba(3,6,20,0.35)'; S.rrect(ctx, -tw / 2 + 8, -th / 2 + 12, tw, th, 34); ctx.fill();
          ctx.fillStyle = col(r.c || 'turkuaz'); S.rrect(ctx, -tw / 2, -th / 2, tw, th, 34); ctx.fill();
          ctx.strokeStyle = P.sir; ctx.lineWidth = 5; S.rrect(ctx, -tw / 2 + 14, -th / 2 + 14, tw - 28, th - 28, 24); ctx.stroke();
          ctx.fillStyle = P.safran;
          for (const sx of [-1, 1]) { S.star8(ctx, sx * (tw / 2 - 44), 0, 16); ctx.fill(); }
          T.text(ctx, r.word, 0, 0, { size: rsz, fam: 'display', color: ink(r.c || 'turkuaz'), maxW: tw - 150 });
          ctx.restore();
        }
        if (r.chips) {
          const it2 = r.chips.map((c, i) => { const s = pop(lt, MERGE + 1.6 + i * 0.25, 0.45); return { text: c.text || c, stroke: col(c.c || ['kobalt', 'mercan', 'safran', 'zumrut', 'mor'][i % 5]), scale: s, alpha: clamp(s * 2) }; });
          chipRow(ctx, it2, L.cx, L.pick(610, 690), { size: 34, maxW: L.pick(1500, 900), lh: 100 });
        }
        if (r.line) S.chip(ctx, r.line, L.cx, L.pick(740, 930), { size: L.pick(34, 32), fam: 'body', bg: 'rgba(255,188,58,0.14)', stroke: P.safran, lw: 3, alpha: go(lt, MERGE + 2.6, MERGE + 3.0), maxW: L.W - 140 });
      }
      // Karo
      if (!L.v) {
        const s = 100;
        const xs = lay.xs;
        const keys = [{ t: 0, x: xs[0] }];
        cards.forEach((c, i) => { if (i > 0) { const b = sc.beats[Math.min(i, sc.beats.length - 1)]; keys.push({ t: b.t - 0.9, x: xs[i - 1] }, { t: b.t + 0.1, x: xs[i] }); } });
        if (hasRes) keys.push({ t: MERGE, x: xs[n - 1] }, { t: MERGE + 1, x: 1720 });
        const kk = track(keys, lt);
        drawK(ctx, sc, lt, t, [kk.x, 884, s], { st: { roll: BF.rollFor(kk.x, xs[0], s) }, look: [0, -0.9] });
      } else {
        drawK(ctx, sc, lt, t, [930, 1445, 90], { look: [-0.6, -0.9] });
      }
    },
    cues(sc) {
      const c = [];
      sc.cards.forEach((cd, i) => { const b = sc.beats[Math.min(i, sc.beats.length - 1)]; c.push({ at: b.t + 0.2 + (cd.delay || 0), sfx: 'ding', f: [784, 880, 988, 1175][i % 4], pan: (i - (sc.cards.length - 1) / 2) * 0.4 }); });
      if (sc.result) {
        const M0 = sc.beats[sc.beats.length - 1].t;
        sc.cards.forEach((cd, i) => c.push({ at: M0 + 0.2 + i * 0.15, sfx: 'pop', pitch: 1 + i * 0.12 }));
        c.push({ at: M0 + 0.8, sfx: 'whoosh', dur: 0.35, gain: 0.6 }, { at: M0 + 1.0, sfx: 'chord', root: 60 }, { at: M0 + 1.3, sfx: 'karo', mood: 'proud' });
        (sc.result.chips || []).forEach((x, i) => c.push({ at: M0 + 1.6 + i * 0.25, sfx: 'pop', pitch: pentaUp(i + 2), gain: 0.8 }));
        if (sc.result.line) c.push({ at: M0 + 2.6, sfx: 'pop', pitch: 0.8 });
      }
      return c.concat(karoCues(sc));
    },
  };

  // ═══ summary ═════════════════════════════════════════════════
  // { type:'summary', lines:[{icon,c,text}], beats } — satırlar vuruşlara dağıtılır (line.beat)
  TPL.summary = {
    draw(ctx, L, lt, t, sc) {
      T.text(ctx, sc.heading || 'Aklında kalsın', L.pick(330, 70), L.pick(150, 270), { size: L.pick(52, 60), fam: 'display', align: 'left', color: P.safran, alpha: go(lt, 0.1, 0.5) });
      const n = sc.lines.length;
      sc.lines.forEach((it, i) => {
        const b = sc.beats[it.beat != null ? it.beat : Math.min(sc.beats.length - 1, Math.floor((i * sc.beats.length) / n))];
        const at = b.t + 0.2 + (it.beat != null ? 0 : (i - sc.lines.findIndex((x, j) => (x.beat != null ? x.beat : Math.floor((j * sc.beats.length) / n)) === b.i)) * 1.6);
        const p = pop(lt, at, 0.55);
        const a = clamp(p * 2);
        const y = L.pick(300 + i * (n > 3 ? 140 : 175), 470 + i * (n > 3 ? 215 : 270));
        const tx = L.pick(330, 150);
        const bh = L.pick(n > 3 ? 120 : 144, n > 3 ? 190 : 220);
        ctx.save(); ctx.globalAlpha *= a;
        ctx.fillStyle = 'rgba(28,42,92,0.85)';
        S.rrect(ctx, tx - 20 + (1 - p) * 60, y - bh / 2, L.pick(1250, 900), bh, 30); ctx.fill();
        ctx.restore();
        tile(ctx, tx + L.pick(50, 55), y, L.pick(n > 3 ? 96 : 110, n > 3 ? 120 : 140) * p, it.icon, col(it.c), t, { alpha: a });
        T.para(ctx, it.text, tx + L.pick(140, 170), y, { size: L.pick(n > 3 ? 40 : 44, n > 3 ? 42 : 46), maxW: L.pick(1040, 640), align: 'left', vcenter: true, color: P.sir, alpha: a, maxLines: L.pick(2, 3) });
      });
      const last = sc.beats[sc.beats.length - 1];
      K(ctx, { x: L.pick(1720, 540), y: L.pick(800, 1340), s: L.pick(140, 130), mood: 'proud', caret: lt > last.t + 2 ? 'heart' : 'ok', look: [L.pick(-0.8, 0), -0.4], armL: 2.6 + Math.sin(lt * 4) * 0.2, armR: 0.4, seed: 7 }, t);
      const ea = go(lt, last.t + 2.5, last.t + 3.1);
      T.text(ctx, 'Bilişim Filmleri  ·  Hakan Ataş  ·  CC BY-NC 4.0', L.pick(L.cx - 100, L.cx), L.pick(820, 1425), { size: 28, weight: 600, color: P.turkuazA, alpha: ea, maxW: L.W - 140 });
    },
    cues(sc) {
      const c = [{ at: 0.1, sfx: 'whoosh', dur: 0.5, gain: 0.5 }];
      const n = sc.lines.length;
      sc.lines.forEach((it, i) => {
        const b = sc.beats[it.beat != null ? it.beat : Math.min(sc.beats.length - 1, Math.floor((i * sc.beats.length) / n))];
        const first = sc.lines.findIndex((x, j) => (x.beat != null ? x.beat : Math.floor((j * sc.beats.length) / n)) === b.i);
        c.push({ at: b.t + 0.2 + (it.beat != null ? 0 : (i - first) * 1.6), sfx: 'ding', f: [784, 988, 1175, 1319][i % 4] });
      });
      const last = sc.beats[sc.beats.length - 1];
      c.push({ at: last.t + 1.2, sfx: 'karo', mood: 'proud', pan: 0.6 }, { at: last.t + 1.3, sfx: 'sparkle' }, { at: last.t + 2.1, sfx: 'karo', mood: 'heart', pan: 0.6 });
      return c;
    },
  };

  BF.TPLH = { K, tile, bIdx, col, ink, lite, pentaUp, karoMood, drawK, karoCues, splitTwo, chipRow, panel, stamp };
  BF.timeFilm = timeFilm;
  BF.captionsOf = captionsOf;
})(typeof window !== 'undefined' ? window : globalThis);
