/* ─────────────────────────────────────────────────────────────
   SAHNE ŞABLONLARI (2) — compare · sort · steps · judge · columns
   ───────────────────────────────────────────────────────────── */
(function (root) {
  const BF = (root.BF = root.BF || {});
  const { M, P, S, T, TPL } = BF;
  const { E, seg, pop, go, lerp, clamp, track } = M;
  const { tile, bIdx, col, ink, lite, pentaUp, drawK, karoCues, chipRow, panel, stamp } = BF.TPLH;

  // ═══ compare ═════════════════════════════════════════════════
  // { type:'compare', left:'DÜN', right:'BUGÜN', sameLabel:'aynı iş', diffLabel:'farklı',
  //   beats:[{ a:{icon,name,tag}, b:{icon,name,tag}, same:'…', diff:['…','…'] , tr,en,note }] }
  TPL.compare = {
    draw(ctx, L, lt, t, sc) {
      const hdrA = go(lt, 0.2, 0.6);
      const oldX = L.pick(520, 540), nowX = L.pick(1400, 540);
      const oldY = L.pick(430, 410), nowY = L.pick(430, 1010);
      const lc = col(sc.leftC || 'sir2'), rc = col(sc.rightC || 'turkuaz');
      S.chip(ctx, sc.left || 'DÜN', oldX, L.pick(170, 200), { size: 32, bg: lc, color: ink(lc), alpha: hdrA, maxW: 700 });
      S.chip(ctx, sc.right || 'BUGÜN', nowX, L.pick(170, 815), { size: 32, bg: rc, color: ink(rc), alpha: hdrA, maxW: 700 });
      const k = Math.max(0, bIdx(sc, lt));
      const pr = sc.beats[k];
      const pl = lt - pr.t;
      const out = k < sc.beats.length - 1 ? go(lt, pr.t + pr.d - 0.6, pr.t + pr.d - 0.1) : 0;
      const cs = L.pick(300, 270);
      const flip = out ? 1 - out * 2 : null;
      const po = pop(pl, 0.2, 0.5);
      tile(ctx, oldX, oldY, cs * po, pr.a.icon, col(pr.a.c || 'mercan'), t, { alpha: clamp(po * 2) * (out < 0.5 ? 1 : 0), flip, ground: '#F6E9D0' });
      const nA = clamp(po * 2) * (1 - out);
      T.text(ctx, pr.a.name, oldX, oldY + cs / 2 + 40, { size: 36, maxW: 440, alpha: nA, minSize: 26 });
      if (pr.a.tag) S.chip(ctx, pr.a.tag, oldX + cs / 2 - 10, oldY - cs / 2 + 10, { size: 26, fam: 'body', bg: P.mercan, color: P.sir, alpha: nA, h: 44 });
      const pn = pop(pl, 0.7, 0.5);
      tile(ctx, nowX, nowY, cs * pn, pr.b.icon, col(pr.b.c || 'turkuaz'), t, { alpha: clamp(pn * 2) * (out < 0.5 ? 1 : 0), flip });
      T.text(ctx, pr.b.name, nowX, nowY + cs / 2 + 40, { size: 36, maxW: 440, alpha: clamp(pn * 2) * (1 - out), minSize: 26 });
      if (pr.b.tag) S.chip(ctx, pr.b.tag, nowX + cs / 2 - 10, nowY - cs / 2 + 10, { size: 26, fam: 'body', bg: P.turkuazK, color: P.sir, alpha: clamp(pn * 2) * (1 - out), h: 44 });
      if (pr.same) {
        const eq = pop(pl, 1.3, 0.5);
        const eqA = clamp(eq * 2) * (1 - out);
        const ex = L.pick(960, 180), ey = L.pick(400, 705);
        ctx.save(); ctx.globalAlpha *= eqA; ctx.translate(ex, ey); ctx.scale(eq, eq);
        ctx.fillStyle = P.turkuaz; ctx.beginPath(); ctx.arc(0, 0, 46, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = P.murekkep; S.rrect(ctx, -22, -14, 44, 9, 4); ctx.fill(); S.rrect(ctx, -22, 5, 44, 9, 4); ctx.fill();
        ctx.restore();
        if (!L.v) {
          T.text(ctx, sc.sameLabel || 'aynı iş', ex, ey + 85, { size: 30, weight: 600, color: P.turkuazA, alpha: eqA });
          T.para(ctx, pr.same, ex, ey + 135, { size: 40, maxW: 500, color: P.sir, alpha: eqA, maxLines: 2 });
        } else {
          T.text(ctx, sc.sameLabel || 'aynı iş', ex + 75, ey - 26, { size: 30, weight: 600, align: 'left', color: P.turkuazA, alpha: eqA });
          T.text(ctx, pr.same, ex + 75, ey + 22, { size: 40, align: 'left', color: P.sir, alpha: eqA, maxW: 560, minSize: 28 });
        }
      }
      if (pr.diff && pr.diff.length) {
        const fA = go(pl, 2.3, 2.6) * (1 - out);
        if (!L.v) {
          const items = [{ text: sc.diffLabel || 'farklı', bg: P.mercan, alpha: fA }].concat(pr.diff.map((d, i) => { const s = pop(pl, 2.3 + (i + 1) * 0.35, 0.4); return { text: d, stroke: P.mercan, scale: s, alpha: clamp(s * 2) * (1 - out) }; }));
          chipRow(ctx, items, L.cx, 770, { size: 34, maxW: 1700 });
        } else {
          S.chip(ctx, sc.diffLabel || 'farklı', L.cx, 1262, { size: 26, bg: P.mercan, alpha: fA });
          pr.diff.forEach((w, i) => { const s = pop(pl, 2.65 + i * 0.35, 0.4); S.chip(ctx, w, L.cx, 1335 + i * 78, { size: 34, fam: 'body', bg: P.gece2, stroke: P.mercan, lw: 3, alpha: clamp(s * 2) * (1 - out), scale: s, maxW: 1000 }); });
        }
      }
      const think = pl < 2.4;
      const side = Math.sin(pl * 2.2) > 0 ? 1 : -1;
      drawK(ctx, sc, lt, t, [L.pick(170, 900), L.pick(860, 770), L.pick(115, 100)], {
        mood: think ? 'thinking' : 'happy', caret: think ? '?' : '!', look: L.v ? [-0.3, side * 0.9] : [0.9, side * 0.2 - 0.4],
      });
    },
    cues(sc) {
      const c = [];
      sc.beats.forEach((b, i) => {
        const P0 = b.t;
        c.push({ at: P0 + 0.2, sfx: 'pop', pitch: 0.85, pan: -0.5 }, { at: P0 + 0.4, sfx: 'karo', mood: 'question', pan: -0.7 }, { at: P0 + 0.7, sfx: 'pop', pitch: 1.1, pan: 0.5 });
        if (b.same) c.push({ at: P0 + 1.3, sfx: 'ding', f: 880 });
        (b.diff || []).forEach((d, j) => c.push({ at: P0 + 2.3 + (j + 1) * 0.35, sfx: 'pop', pitch: 0.8 + j * 0.12, gain: 0.7 }));
        if (b.diff && b.diff.length) c.push({ at: P0 + 2.5, sfx: 'karo', mood: 'happy', pan: -0.7 });
        if (i < sc.beats.length - 1) c.push({ at: P0 + b.d - 0.6, sfx: 'whoosh', dur: 0.45, up: false, gain: 0.6 });
      });
      return c;
    },
  };

  // ═══ sort ════════════════════════════════════════════════════
  // { type:'sort', bins:[{label,c}], items:[{icon,name,bin, beat?}], beats }
  // Vuruş 0: raflar ve yığın belirir; eşyalar sonraki vuruşlarda sırayla raflara uçar.
  function sortLayout(L, sc) {
    const n = sc.bins.length;
    const per = sc.bins.map((b, i) => sc.items.filter((it) => it.bin === i).length);
    const rows = Math.max(1, ...per);
    const bins = [];
    if (!L.v) {
      const w = Math.min(n <= 3 ? 560 : 430, (1800 - (n - 1) * 22) / n);
      const tot = n * w + (n - 1) * 22, x0 = (L.W - tot) / 2 + w / 2;
      const rowH = rows > 3 ? 100 : 110;
      const h = 84 + rows * rowH;
      for (let i = 0; i < n; i++) bins.push({ x: x0 + i * (w + 22), y: 150, w, h });
      const pileY = Math.min(760, 150 + h + 130);
      return { bins, rowH, mini: rows > 3 ? 82 : 90, nameSize: n > 4 ? 28 : 32, pile: (k, N) => { const sp = Math.min(170, 1560 / Math.max(1, N)); return [L.cx + (k - (N - 1) / 2) * sp, pileY]; }, pileS: 110, karo: [110, 860, 100] };
    }
    const cols = 2, w = 470, rowH = n >= 5 ? 92 : 108;
    const h = 84 + rows * rowH;
    const nr = Math.ceil(n / cols);
    for (let i = 0; i < n; i++) {
      const r = Math.floor(i / cols), c = i % cols;
      const last = i === n - 1 && n % 2 === 1;
      bins.push({ x: last ? 540 : c ? 795 : 285, y: 170 + r * (h + 34), w, h });
    }
    const top = Math.min(1100, 170 + nr * (h + 34) + 90);
    return { bins, rowH, mini: n >= 5 ? 78 : 88, nameSize: 31, pile: (k, N) => { const per = Math.min(5, Math.ceil(N / 2)); const r = Math.floor(k / per), c = k % per, m = Math.min(per, N - r * per); return [540 + (c - (m - 1) / 2) * 195, top + r * 150]; }, pileS: 116, karo: [540, 1462, 72] };
  }
  function sortSchedule(sc) {
    // her eşyanın uçuş zamanı
    const items = sc.items;
    const out = [];
    const sortBeats = sc.beats.length > 1 ? sc.beats.slice(1) : sc.beats;
    const groups = sortBeats.map(() => []);
    items.forEach((it, i) => {
      const bi = it.beat != null ? Math.max(0, it.beat - (sc.beats.length > 1 ? 1 : 0)) : Math.min(sortBeats.length - 1, Math.floor((i * sortBeats.length) / items.length));
      groups[bi].push(i);
    });
    groups.forEach((g, bi) => {
      const b = sortBeats[bi];
      const sp = Math.min(1.6, (b.d - 3.2) / Math.max(1, g.length));
      g.forEach((idx, j) => (out[idx] = b.t + 0.6 + j * sp));
    });
    return out;
  }
  TPL.sort = {
    draw(ctx, L, lt, t, sc) {
      const lay = sortLayout(L, sc);
      const FLY = 0.9;
      const when = sortSchedule(sc);
      sc.bins.forEach((b, i) => {
        const r = lay.bins[i];
        const a = clamp(pop(lt, 0.3 + i * 0.15, 0.5) * 2);
        const c = col(b.c);
        ctx.save(); ctx.globalAlpha *= a;
        panel(ctx, r.x - r.w / 2, r.y, r.w, r.h, { bg: 'rgba(12,20,52,0.55)', stroke: c, lw: 5, dash: [2, 14], r: 26 });
        ctx.fillStyle = c; S.rrect(ctx, r.x - r.w / 2 + 18, r.y + r.h - 20, r.w - 36, 10, 5); ctx.fill();
        ctx.restore();
        S.chip(ctx, b.label, r.x, r.y, { size: L.pick(sc.bins.length > 4 ? 26 : 30, 28), bg: c, color: ink(c), alpha: a, maxW: r.w - 30 });
      });
      const N = sc.items.length;
      const slotIdx = sc.items.map((it, i) => sc.items.filter((x, j) => x.bin === it.bin && j < i).length);
      sc.items.forEach((it, i) => {
        const [px, py] = lay.pile(i, N);
        const r = lay.bins[it.bin];
        const sx = r.x - r.w / 2 + 30 + lay.mini / 2, sy = r.y + 62 + slotIdx[i] * lay.rowH + lay.mini / 2 - 4;
        const t0 = when[i];
        const f = seg(lt, t0, t0 + FLY), ef = E.inOut(f);
        const ap = pop(lt, 0.9 + i * 0.08, 0.45);
        const x = lerp(px, sx, ef), y = lerp(py, sy, ef) - Math.sin(f * Math.PI) * 150;
        const s = lerp(lay.pileS, lay.mini, ef);
        const rot0 = (M.hash(i, 9) - 0.5) * 0.45;
        const landed = lt - t0 - FLY;
        const glow = f > 0 && f < 1 ? 0.8 : landed > 0 && landed < 0.4 ? 0.8 : 0;
        tile(ctx, x, y, s * (f > 0 ? 1 : ap), it.icon, col(sc.bins[it.bin].c), t, { alpha: clamp(ap * 2), rot: rot0 * (1 - ef) + Math.sin(f * Math.PI) * 0.35, glow });
        const nA = go(lt, t0 + FLY, t0 + FLY + 0.3);
        if (nA > 0) T.para(ctx, it.name, sx + lay.mini / 2 + 16, sy, { size: lay.nameSize, align: 'left', maxW: r.w - lay.mini - 70, alpha: nA, minSize: 26, maxLines: 2, vcenter: true, lh: 1.08 });
      });
      const cur = when.reduce((k, w, i) => (lt >= w ? i : k), -1);
      const target = cur >= 0 ? lay.bins[sc.items[cur].bin] : null;
      const inThrow = cur >= 0 && lt - when[cur] < 0.5;
      const done = lt > Math.max(...when) + FLY + 0.2;
      const [kx, ky, ks] = lay.karo;
      drawK(ctx, sc, lt, t, [kx, ky, ks], {
        mood: done ? 'proud' : cur < 0 ? 'thinking' : 'happy', caret: done ? 'ok' : cur < 0 ? '?' : 'dots',
        look: target ? [clamp((target.x - kx) / 500, -1, 1), -0.8] : [0.8, 0],
        arms: [done ? 2.5 : 0.3, inThrow ? 2.8 : done ? 2.5 : 0.6],
      });
    },
    cues(sc) {
      const c = [];
      sc.bins.forEach((b, i) => c.push({ at: 0.3 + i * 0.15, sfx: 'pop', pitch: 0.6 + i * 0.08, pan: (i - (sc.bins.length - 1) / 2) * 0.4 }));
      sc.items.forEach((it, i) => c.push({ at: 0.9 + i * 0.08, sfx: 'pop', pitch: 1.2 + i * 0.04, gain: 0.45 }));
      const when = sortSchedule(sc);
      sc.items.forEach((it, i) => { const pan = (it.bin - (sc.bins.length - 1) / 2) * 0.4; c.push({ at: when[i], sfx: 'whoosh', dur: 0.9, pan, gain: 0.7 }, { at: when[i] + 0.9, sfx: 'land', pitch: [1, 1.12, 1.26, 1.5, 1.68, 1.89][it.bin % 6], pan }); });
      c.push({ at: 0.8, sfx: 'karo', mood: 'question', pan: -0.8 }, { at: Math.max(...when) + 1.2, sfx: 'karo', mood: 'proud', pan: -0.8 }, { at: Math.max(...when) + 1.3, sfx: 'sparkle' });
      return c;
    },
  };

  // ═══ steps ═══════════════════════════════════════════════════
  // { type:'steps', steps:[{icon,label,text,c}], loop?:'etiket', beats:[{show:k}] }
  // show: o vuruşun sonunda görünen adım sayısı (varsayılan: vuruş başına bir adım)
  function stepsShowAt(sc) {
    const n = sc.steps.length, B = sc.beats.length;
    const at = [];
    let prev = 0;
    sc.beats.forEach((b, i) => {
      const show = b.show != null ? b.show : Math.round(((i + 1) * n) / B);
      const cnt = show - prev;
      for (let j = 0; j < cnt; j++) at[prev + j] = b.t + 0.3 + j * Math.min(1.6, (b.d - 1.5) / Math.max(1, cnt));
      prev = show;
    });
    for (let j = 0; j < n; j++) if (at[j] == null) at[j] = sc.beats[B - 1].t + 0.3;
    return at;
  }
  function stepsPos(L, n) {
    if (!L.v) {
      if (n <= 5) {
        const sp = Math.min(420, 1600 / n);
        return Array.from({ length: n }, (_, i) => ({ x: L.cx + (i - (n - 1) / 2) * sp, y: 320, tw: sp - 34, ts: n === 5 ? 160 : 190, row: 0 }));
      }
      const per = Math.ceil(n / 2), sp = Math.min(440, 1580 / per);
      return Array.from({ length: n }, (_, i) => { const r = Math.floor(i / per), c = i % per; return { x: L.cx + (c - (per - 1) / 2) * sp, y: r ? 590 : 240, tw: sp - 40, ts: 120, row: r }; });
    }
    const top = 270, bot = 1330, sp = Math.min(290, (bot - top) / Math.max(1, n - 1));
    const y0 = n > 1 ? top + ((bot - top) - sp * (n - 1)) / 2 : 700;
    return Array.from({ length: n }, (_, i) => ({ x: 150, y: y0 + i * sp, tw: 740, ts: n > 5 ? 120 : 150 }));
  }
  TPL.steps = {
    draw(ctx, L, lt, t, sc) {
      const n = sc.steps.length, pos = stepsPos(L, n), at = stepsShowAt(sc);
      const cur = at.reduce((k, a, i) => (lt >= a ? i : k), -1);
      // oklar
      for (let i = 0; i < n - 1; i++) {
        const a = pos[i], b = pos[i + 1];
        const p = go(lt, at[i + 1] - 0.5, at[i + 1]);
        if (p <= 0) continue;
        if (!L.v) {
          if (a.row === b.row) S.arrow(ctx, a.x + a.ts / 2 + 14, a.y, b.x - b.ts / 2 - 14, b.y, { p, lw: 7, color: P.safran });
          else { // sıra değişimi: aşağı kıvrım
            ctx.save(); ctx.globalAlpha *= p; ctx.strokeStyle = P.safran; ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.setLineDash([2, 14]);
            ctx.beginPath(); ctx.moveTo(a.x, a.y + a.ts / 2 + 150); ctx.bezierCurveTo(a.x, b.y - 150, b.x, a.y + 200, b.x, b.y - b.ts / 2 - 18); ctx.stroke(); ctx.restore();
          }
        } else S.arrow(ctx, a.x, a.y + a.ts / 2 + 10, b.x, b.y - b.ts / 2 - 10, { p, lw: 6, color: P.safran });
      }
      if (sc.loop && n > 1) {
        const lp = go(lt, at[n - 1] + 0.8, at[n - 1] + 1.8);
        if (lp > 0) {
          ctx.save(); ctx.globalAlpha *= lp; ctx.strokeStyle = P.turkuaz; ctx.fillStyle = P.turkuaz; ctx.lineWidth = 6; ctx.setLineDash([3, 14]); ctx.lineCap = 'round';
          if (!L.v) {
            const a = pos[n - 1], b = pos[0], y = 780;
            ctx.beginPath(); ctx.moveTo(a.x, a.y + 280); ctx.lineTo(a.x, y); ctx.lineTo(b.x, y); ctx.lineTo(b.x, b.y + 300); ctx.stroke();
            ctx.setLineDash([]); S.chip(ctx, sc.loop, L.cx, y, { size: 28, fam: 'body', bg: P.gece2, stroke: P.turkuaz, lw: 3 });
          } else {
            const a = pos[n - 1], b = pos[0], x = Math.max(40, a.x - a.ts / 2 - 36);
            ctx.beginPath(); ctx.moveTo(a.x - a.ts / 2 - 10, a.y); ctx.lineTo(x, a.y); ctx.lineTo(x, b.y); ctx.lineTo(b.x - b.ts / 2 - 10, b.y); ctx.stroke();
            ctx.setLineDash([]);
            ctx.save(); ctx.translate(x, n >= 3 ? (pos[1].y + pos[2].y) / 2 : (a.y + b.y) / 2); ctx.rotate(-Math.PI / 2); S.chip(ctx, sc.loop, 0, 0, { size: 26, fam: 'body', bg: P.gece2, stroke: P.turkuaz, lw: 3 }); ctx.restore();
          }
          ctx.restore();
        }
      }
      sc.steps.forEach((st, i) => {
        const p = pop(lt, at[i], 0.5);
        const a = clamp(p * 2);
        if (a <= 0.01) return;
        const q = pos[i], c = col(st.c || ['kobalt', 'mercan', 'safran', 'zumrut', 'mor', 'turkuaz'][i % 6]);
        const active = i === cur;
        tile(ctx, q.x, q.y, q.ts * p, st.icon, c, t, { alpha: a, glow: active ? 0.75 : 0 });
        // numara rozeti
        ctx.save(); ctx.globalAlpha *= a; ctx.fillStyle = c; ctx.beginPath(); ctx.arc(q.x - q.ts / 2 + 6, q.y - q.ts / 2 + 6, 22, 0, Math.PI * 2); ctx.fill(); ctx.restore();
        BF.CHECK.mute++; T.text(ctx, String(i + 1), q.x - q.ts / 2 + 6, q.y - q.ts / 2 + 6, { size: 24, fam: 'display', color: ink(c), alpha: a }); BF.CHECK.mute--;
        const dim = active || cur === n - 1 ? 1 : 0.7;
        if (!L.v) {
          T.text(ctx, st.label, q.x, q.y + q.ts / 2 + 44, { size: n > 4 ? 32 : 38, fam: 'display', color: lite(c), alpha: a, maxW: q.tw, minSize: 24 });
          if (st.text) T.para(ctx, st.text, q.x, q.y + q.ts / 2 + 100, { size: n > 4 ? 30 : 34, maxW: q.tw, color: P.sir, alpha: a * dim, maxLines: q.row != null && n > 5 ? 2 : 3, minSize: 26 });
        } else {
          T.text(ctx, st.label, q.x + q.ts / 2 + 36, q.y - (st.text ? 40 : 0), { size: 40, fam: 'display', align: 'left', color: lite(c), alpha: a, maxW: 720, minSize: 26 });
          if (st.text) T.para(ctx, st.text, q.x + q.ts / 2 + 36, q.y + 20, { size: 34, maxW: 700, align: 'left', color: P.sir, alpha: a * dim, maxLines: 2, minSize: 26 });
        }
      });
      if (!L.v) {
        const keys = [{ t: 0, x: pos[0].x }];
        at.forEach((a, i) => { if (i > 0) keys.push({ t: a - 0.8, x: pos[i - 1].x }, { t: a, x: pos[i].x }); });
        const kk = track(keys, lt);
        const low = n > 5;
        drawK(ctx, sc, lt, t, [low ? 110 : kk.x, 862, 96], { st: low ? {} : { roll: BF.rollFor(kk.x, pos[0].x, 96) }, look: [0, -0.9] });
      } else drawK(ctx, sc, lt, t, [960, 1450, 76], { look: [-0.8, -0.8] });
    },
    cues(sc) {
      const at = stepsShowAt(sc);
      const c = at.map((a, i) => ({ at: a, sfx: 'pop', pitch: pentaUp(i), pan: (i - (at.length - 1) / 2) * 0.3 }));
      at.forEach((a, i) => { if (i > 0) c.push({ at: a - 0.45, sfx: 'whoosh', dur: 0.4, gain: 0.35 }); });
      if (sc.loop) c.push({ at: at[at.length - 1] + 0.9, sfx: 'whoosh', dur: 0.9, up: false, gain: 0.5 }, { at: at[at.length - 1] + 1.8, sfx: 'ding', f: 1175 });
      return c.concat(karoCues(sc, 'happy'));
    },
  };

  // ═══ judge ═══════════════════════════════════════════════════
  // { type:'judge', labels:{ok:'doğru', no:'yanlış'}, beats:[{ row:{icon,text,ok,why}, … }] }
  // Her vuruş bir satır ekler (en çok 4); damga vuruşun ortasında basılır.
  TPL.judge = {
    draw(ctx, L, lt, t, sc) {
      const rows = sc.beats.map((b) => b.row).filter(Boolean);
      const n = rows.length;
      sc.beats.forEach((b, i) => {
        const r = b.row; if (!r) return;
        const idx = rows.indexOf(r);
        const p = pop(lt, b.t + 0.2, 0.5), a = clamp(p * 2);
        if (a <= 0.01) return;
        const sp = pop(lt, b.t + (b.stampAt || 2.6), 0.5);
        const verdictShown = lt > b.t + (b.stampAt || 2.6);
        const c = r.ok ? P.zumrut : P.mercan;
        if (!L.v) {
          const y = (n > 3 ? 250 : 270) + idx * (n > 3 ? 160 : 205);
          const h = n > 3 ? 140 : 178;
          panel(ctx, 160 + (1 - p) * 80, y - h / 2, 1600, h, { alpha: a, stroke: verdictShown ? c : null, lw: 4 });
          tile(ctx, 250, y, (n > 3 ? 104 : 124) * p, r.icon, verdictShown ? c : P.kobalt, t, { alpha: a });
          T.para(ctx, r.text, 340, r.why && verdictShown ? y - 24 : y, { size: n > 3 ? 35 : 38, align: 'left', maxW: 1150, color: P.sir, alpha: a, maxLines: r.why && verdictShown ? 1 : 2, vcenter: true, minSize: 26 });
          if (r.why) T.text(ctx, r.why, 340, y + (n > 3 ? 32 : 36), { size: n > 3 ? 29 : 31, weight: 600, align: 'left', color: r.ok ? '#9BE8B8' : '#FFB3A8', alpha: go(lt, b.t + (b.stampAt || 2.6) + 0.3, b.t + (b.stampAt || 2.6) + 0.7), maxW: 1150, minSize: 24 });
          stamp(ctx, 1640, y - 12, 40, r.ok, sp);
          if (verdictShown) T.para(ctx, r.ok ? (sc.labels && sc.labels.ok) || 'doğru' : (sc.labels && sc.labels.no) || 'yanlış', 1640, y + 44, { size: 26, fam: 'display', color: c, alpha: clamp(sp), maxW: 190, maxLines: 2, minSize: 26, lh: 1.05 });
        } else {
          const sp = n > 1 ? Math.min(330, 960 / (n - 1)) : 0;
          const y = 770 - ((n - 1) * sp) / 2 + idx * sp;
          const h = Math.min(290, n > 1 ? sp - 50 : 290);
          panel(ctx, 40 + (1 - p) * 60, y - h / 2, 1000, h, { alpha: a, stroke: verdictShown ? c : null, lw: 4 });
          tile(ctx, 115, y - (r.why ? 40 : 0), 100 * p, r.icon, verdictShown ? c : P.kobalt, t, { alpha: a });
          T.para(ctx, r.text, 190, y - (r.why ? 50 : 0), { size: 35, align: 'left', maxW: 660, color: P.sir, alpha: a, maxLines: 3, vcenter: true, minSize: 26 });
          if (r.why) T.para(ctx, r.why, 80, y + 74, { size: 30, weight: 600, align: 'left', maxW: 780, color: r.ok ? '#9BE8B8' : '#FFB3A8', alpha: go(lt, b.t + (b.stampAt || 2.6) + 0.3, b.t + (b.stampAt || 2.6) + 0.7), maxLines: 2, minSize: 24 });
          stamp(ctx, 930, y - 58, 36, r.ok, sp);
          if (verdictShown) T.para(ctx, r.ok ? (sc.labels && sc.labels.ok) || 'doğru' : (sc.labels && sc.labels.no) || 'yanlış', 930, y + 2, { size: 26, fam: 'display', color: c, alpha: clamp(sp), maxW: 150, maxLines: 2, minSize: 26, lh: 1.05 });
        }
      });
      const k = Math.max(0, bIdx(sc, lt)), b = sc.beats[k];
      const shown = b.row && lt > b.t + (b.stampAt || 2.6);
      drawK(ctx, sc, lt, t, L.pick([100, 868, 88], [540, 1468, 64]), {
        mood: !b.row ? 'happy' : !shown ? 'thinking' : b.row.ok ? 'happy' : 'worried', caret: !b.row ? 'bar' : !shown ? '?' : b.row.ok ? 'ok' : '!', look: [0.6, -0.6],
      });
    },
    cues(sc) {
      const c = [];
      sc.beats.forEach((b) => {
        if (!b.row) return;
        const s = b.t + (b.stampAt || 2.6);
        c.push({ at: b.t + 0.2, sfx: 'whoosh', dur: 0.4, gain: 0.4 }, { at: b.t + 0.6, sfx: 'karo', mood: 'question', pan: -0.8 });
        c.push({ at: s, sfx: 'land', pitch: b.row.ok ? 1.3 : 0.8, pan: 0.7 });
        c.push(b.row.ok ? { at: s + 0.05, sfx: 'sparkle' } : { at: s + 0.05, sfx: 'no', pan: 0.7 });
        c.push({ at: s + 0.4, sfx: 'karo', mood: b.row.ok ? 'happy' : 'worried', pan: -0.8 });
      });
      return c;
    },
  };

  // ═══ columns ═════════════════════════════════════════════════
  // { type:'columns', cols:[{label,c,icon}], items:[{text,col,icon?,beat?}], scale?:true, beats }
  function colsSchedule(sc) {
    const B = sc.beats.length, N = sc.items.length;
    const groups = sc.beats.map(() => []);
    sc.items.forEach((it, i) => { const bi = it.beat != null ? it.beat : Math.min(B - 1, Math.floor((i * B) / N)); groups[bi].push(i); });
    const at = [];
    groups.forEach((g, bi) => { const b = sc.beats[bi]; const sp = Math.min(1.8, (b.d - 1.4) / Math.max(1, g.length)); g.forEach((idx, j) => (at[idx] = b.t + 0.4 + j * sp)); });
    return at;
  }
  TPL.columns = {
    draw(ctx, L, lt, t, sc) {
      const nc = sc.cols.length, at = colsSchedule(sc);
      const xs = !L.v ? (nc === 2 ? [510, 1410] : [360, 960, 1560]) : (nc === 2 ? [285, 795] : [540, 540, 540]);
      const w = !L.v ? (nc === 2 ? 820 : 560) : (nc === 2 ? 480 : 980);
      const hy = L.pick(175, 215);
      const counts = sc.cols.map(() => 0);
      let tilt = 0;
      sc.items.forEach((it, i) => { if (lt > at[i] + 0.4) tilt += it.col === 0 ? -1 : 1; });
      sc.cols.forEach((c, ci) => {
        const a = go(lt, 0.2 + ci * 0.2, 0.6 + ci * 0.2);
        const cc = col(c.c);
        let x = xs[ci], y = hy;
        if (L.v && nc === 3) y = 215 + ci * 420;
        S.chip(ctx, c.label, x, y, { size: 32, bg: cc, color: ink(cc), alpha: a, maxW: w - 20 });
        if (c.icon) tile(ctx, x - w / 2 + 50, y, 70, c.icon, cc, t, { alpha: a });
      });
      if (sc.scale && nc === 2) {
        const a = go(lt, 0.4, 0.8);
        const ang = Math.max(-0.22, Math.min(0.22, tilt * 0.07));
        const cx = L.cx, cy = L.pick(175, 105);
        ctx.save(); ctx.globalAlpha *= a; ctx.translate(cx, cy);
        ctx.fillStyle = P.safran; ctx.beginPath(); ctx.moveTo(-18, 34); ctx.lineTo(18, 34); ctx.lineTo(0, 0); ctx.fill();
        ctx.rotate(ang); ctx.strokeStyle = P.safran; ctx.lineWidth = 8; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(-110, 0); ctx.lineTo(110, 0); ctx.stroke();
        for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(s * 110, 0); ctx.lineTo(s * 110, 22); ctx.stroke(); ctx.beginPath(); ctx.ellipse(s * 110, 26, 30, 9, 0, 0, Math.PI * 2); ctx.fill(); }
        ctx.restore();
      }
      const mx = Math.max(...sc.cols.map((c, ci) => sc.items.filter((it) => it.col === ci).length));
      sc.items.forEach((it, i) => {
        const ci = it.col, cc = col(sc.cols[ci].c);
        const k = counts[ci]++;
        const p = pop(lt, at[i], 0.5), a = clamp(p * 2);
        if (a <= 0.01) return;
        let x, y, ww, hh;
        if (!L.v) { const sp = mx > 3 ? 150 : 178; ww = w - 30; hh = sp - 20; x = xs[ci]; y = 300 + k * sp; }
        else if (nc === 2) { const sp = Math.min(330, 1020 / Math.max(1, mx)); ww = w - 20; hh = sp - 26; x = xs[ci]; y = 330 + Math.max(0, (1060 - mx * sp) / 2) + sp / 2 - 20 + k * sp; }
        else { ww = 470; hh = 170; x = k ? 795 : 285; y = 215 + ci * 420 + 150 + Math.floor(k / 2) * 190; }
        const fromY = y - 60 * (1 - p);
        panel(ctx, x - ww / 2, fromY - hh / 2, ww, hh, { alpha: a, stroke: cc, lw: 3 });
        if (!L.v) {
          if (it.icon) tile(ctx, x - ww / 2 + 66, fromY, mx > 3 ? 86 : 100, it.icon, cc, t, { alpha: a });
          T.para(ctx, it.text, x - ww / 2 + (it.icon ? 134 : 30), fromY, { size: nc === 3 ? 31 : mx > 3 ? 33 : 36, maxW: ww - (it.icon ? 160 : 60), align: 'left', vcenter: true, color: P.sir, alpha: a, maxLines: 3, minSize: 26 });
        } else if (nc === 2) {
          if (it.icon) tile(ctx, x, fromY - hh / 2 + 62, 92, it.icon, cc, t, { alpha: a });
          T.para(ctx, it.text, x, fromY + (it.icon ? 50 : 0), { size: 32, maxW: ww - 40, vcenter: true, color: P.sir, alpha: a, maxLines: it.icon ? 3 : 5, minSize: 26 });
        } else {
          T.para(ctx, it.text, x, fromY, { size: 29, maxW: ww - 40, vcenter: true, color: P.sir, alpha: a, maxLines: 3, minSize: 26 });
        }
      });
      drawK(ctx, sc, lt, t, L.pick([960, 868, 90], [540, 1452, 76]), { look: [Math.sin(lt) * 0.8, -0.8] });
    },
    cues(sc) {
      const at = colsSchedule(sc);
      const c = sc.cols.map((x, i) => ({ at: 0.2 + i * 0.2, sfx: 'pop', pitch: 0.7 + i * 0.1 }));
      sc.items.forEach((it, i) => c.push({ at: at[i], sfx: 'pop', pitch: it.col === 0 ? 1.2 : 0.9, pan: it.col === 0 ? -0.5 : 0.5 }, { at: at[i] + 0.35, sfx: 'land', pitch: 1.4, pan: it.col === 0 ? -0.5 : 0.5 }));
      return c.concat(karoCues(sc));
    },
  };
})(typeof window !== 'undefined' ? window : globalThis);
