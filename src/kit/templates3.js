/* ─────────────────────────────────────────────────────────────
   SAHNE ŞABLONLARI (3) — network · flow · code
   ───────────────────────────────────────────────────────────── */
(function (root) {
  const BF = (root.BF = root.BF || {});
  const { M, P, S, T, TPL } = BF;
  const { E, seg, pop, go, lerp, clamp, track } = M;
  const { tile, bIdx, col, ink, lite, pentaUp, drawK, karoCues, chipRow, panel, stamp } = BF.TPLH;

  // ═══ network ═════════════════════════════════════════════════
  // { type:'network', nodes:[{id,icon,name,c,pos:[x,y],vpos:[x,y]}], links:[{a,b,kind:'kablo'|'kablosuz'|'uzak',label}],
  //   beats:[{ show:[id…] (bu vuruşta belirenler), packet:[id,id,…] (paket yolu), hi:[id] }] }
  // pos: içerik alanında 0..1 (yatay 160..1760 × 190..780, dikey 110..970 × 260..1380)
  function netXY(L, n) {
    const p = L.v ? n.vpos || n.pos : n.pos;
    return L.v ? [110 + p[0] * 860, 260 + p[1] * 1120] : [160 + p[0] * 1600, 190 + p[1] * 590];
  }
  function netAppear(sc) {
    const at = {};
    sc.beats.forEach((b) => (b.show || []).forEach((id, j) => { if (at[id] == null) at[id] = b.t + 0.3 + j * 0.45; }));
    sc.nodes.forEach((n) => { if (at[n.id] == null) at[n.id] = 0.3; });
    return at;
  }
  TPL.network = {
    draw(ctx, L, lt, t, sc) {
      const at = netAppear(sc);
      const byId = Object.fromEntries(sc.nodes.map((n) => [n.id, n]));
      const ns = L.pick(sc.nodeSize || 130, sc.vNodeSize || 120);
      // bağlantılar
      sc.links.forEach((l) => {
        const a = byId[l.a], b = byId[l.b];
        const t0 = Math.max(at[l.a], at[l.b]) + 0.3;
        const p = go(lt, t0, t0 + 0.6);
        if (p <= 0) return;
        const [x1, y1] = netXY(L, a), [x2, y2] = netXY(L, b);
        const c = l.kind === 'kablosuz' ? P.turkuaz : l.kind === 'uzak' ? P.mor : P.safran;
        ctx.save();
        ctx.strokeStyle = c; ctx.lineWidth = l.kind === 'kablo' || !l.kind ? 10 : 7; ctx.lineCap = 'round';
        if (l.kind === 'kablosuz') { ctx.setLineDash([4, 18]); ctx.lineDashOffset = -t * 30; }
        if (l.kind === 'uzak') { ctx.setLineDash([22, 14]); ctx.lineDashOffset = -t * 40; }
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(lerp(x1, x2, p), lerp(y1, y2, p)); ctx.stroke();
        ctx.restore();
        if (l.label && p >= 1) {
          const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
          S.chip(ctx, l.label, mx + (l.lo ? l.lo[0] : 0), my + (l.lo ? l.lo[1] : 0), { size: 26, fam: 'body', bg: P.gece, stroke: c, lw: 3, alpha: go(lt, t0 + 0.6, t0 + 1), maxW: 360 });
        }
      });
      // paketler
      sc.beats.forEach((b) => {
        if (!b.packet) return;
        const path = b.packet.map((id) => netXY(L, byId[id]));
        const segs = path.length - 1, dur = Math.min(b.d - 2.5, 1.4 * segs);
        const p0 = b.t + 1.2;
        for (let rep = 0; rep < (b.repeat || 1); rep++) {
          const q = (lt - p0 - rep * (dur + 0.4)) / dur;
          if (q < 0 || q > 1) continue;
          const f = q * segs, i = Math.min(segs - 1, Math.floor(f)), r = E.inOut(f - i);
          const x = lerp(path[i][0], path[i + 1][0], r), y = lerp(path[i][1], path[i + 1][1], r);
          ctx.save(); ctx.translate(x, y); ctx.rotate(t * 3);
          ctx.fillStyle = b.packetC ? col(b.packetC) : P.safran; S.rrect(ctx, -16, -16, 32, 32, 7); ctx.fill();
          ctx.fillStyle = P.murekkep; S.star8(ctx, 0, 0, 7); ctx.fill();
          ctx.restore();
        }
      });
      // düğümler
      const k = bIdx(sc, lt), hi = (sc.beats[k] && sc.beats[k].hi) || [];
      sc.nodes.forEach((n, i) => {
        const p = pop(lt, at[n.id], 0.5);
        const a = clamp(p * 2);
        if (a <= 0.01) return;
        const [x, y] = netXY(L, n);
        const s = (n.size || 1) * ns;
        tile(ctx, x, y, s * p, n.icon, col(n.c || ['kobalt', 'turkuaz', 'safran', 'mercan', 'zumrut', 'mor'][i % 6]), t, { alpha: a, glow: hi.includes(n.id) ? 0.8 : 0 });
        if (n.name) {
          // aşağı inen bir bağlantı adı kesiyorsa ad yana yazılır
          const down = sc.links.some((l) => { if (l.a !== n.id && l.b !== n.id) return false; const o = byId[l.a === n.id ? l.b : l.a]; const [ox, oy] = netXY(L, o); return oy > y + 10 && Math.abs(ox - x) < (oy - y) * 0.45; });
          const lab = L.v ? n.vlab || n.lab : n.lab;
          if (lab === 'up') T.text(ctx, n.name, x, y - s / 2 - 30, { size: 30, maxW: n.nameW || 300, alpha: a, minSize: 26 });
          else if (down && !n.no) {
            const right = x < L.W * 0.72, gx = x + (right ? 1 : -1) * (s / 2 + 18);
            T.text(ctx, n.name, gx, y, { size: 30, maxW: n.nameW || 260, alpha: a, minSize: 26, align: right ? 'left' : 'right' });
          } else T.text(ctx, n.name, x + (n.no ? n.no[0] : 0), y + s / 2 + 32 + (n.no ? n.no[1] : 0), { size: L.pick(30, 30), maxW: n.nameW || 300, alpha: a, minSize: 26 });
        }
      });
      if (sc.area) { // çerçeve (ör. "yerel ağ")
        sc.area.forEach((ar) => {
          const a = go(lt, sc.beats[ar.beat || 0].t + 0.3, sc.beats[ar.beat || 0].t + 0.9);
          const r = L.v ? ar.vrect || ar.rect : ar.rect;
          const [x1, y1] = netXY(L, { pos: [r[0], r[1]], vpos: [r[0], r[1]] }), [x2, y2] = netXY(L, { pos: [r[2], r[3]], vpos: [r[2], r[3]] });
          ctx.save(); ctx.globalAlpha *= a * 0.9; ctx.strokeStyle = col(ar.c || 'turkuaz'); ctx.lineWidth = 4; ctx.setLineDash([3, 12]); ctx.lineCap = 'round';
          S.rrect(ctx, x1, y1, x2 - x1, y2 - y1, 40); ctx.stroke(); ctx.restore();
          S.chip(ctx, ar.label, x1 + 40, y1, { size: 28, align: 'left', bg: col(ar.c || 'turkuaz'), color: ink(ar.c || 'turkuaz'), alpha: a, maxW: x2 - x1 - 60 });
        });
      }
      drawK(ctx, sc, lt, t, L.pick([100, 868, 90], [960, 1452, 76]), { look: [0.7, -0.6] });
    },
    cues(sc) {
      const at = netAppear(sc);
      const c = [];
      sc.nodes.forEach((n, i) => c.push({ at: at[n.id], sfx: 'pop', pitch: pentaUp(i), gain: 0.8 }));
      sc.beats.forEach((b) => {
        if (!b.packet) return;
        const segs = b.packet.length - 1, dur = Math.min(b.d - 2.5, 1.4 * segs);
        for (let rep = 0; rep < (b.repeat || 1); rep++) {
          const p0 = b.t + 1.2 + rep * (dur + 0.4);
          c.push({ at: p0, sfx: 'whoosh', dur, gain: 0.5 }, { at: p0 + dur, sfx: 'ding', f: 1319, gain: 0.7 });
        }
      });
      return c.concat(karoCues(sc));
    },
  };

  // ═══ flow ════════════════════════════════════════════════════
  // Akış şeması. { type:'flow', nodes:[{id,shape:'start'|'io'|'proc'|'dec'|'end',text}],
  //   edges:[[from,to,label?,side?]], side?:{title, lines:[…]},
  //   beats:[{ show:k, trace:[id…], bug:{id,text}, fix:{id,text}, sideLines:k }] }
  // Düğümler üstten alta dizilir; "dec" düğümünün "hayır" dalı sağdan geri döner.
  function flowPos(L, sc) {
    const n = sc.nodes.length;
    const pos = {};
    if (!L.v) {
      const x = sc.side ? 620 : 960, top = 175, bot = 830, sp = Math.min(118, (bot - top) / Math.max(1, n - 1));
      sc.nodes.forEach((nd, i) => (pos[nd.id] = { x, y: top + i * sp + (n < 6 ? ((bot - top) - sp * (n - 1)) / 2 * 0.5 : 0), w: 560, h: 78 }));
    } else {
      const x = 470, top = 250, bot = sc.side ? 1000 : 1330, sp = Math.min(150, (bot - top) / Math.max(1, n - 1));
      sc.nodes.forEach((nd, i) => (pos[nd.id] = { x, y: top + i * sp, w: 640, h: 84 }));
    }
    return pos;
  }
  function flowShape(ctx, nd, q, c, a) {
    const { x, y, w, h } = q;
    ctx.save(); ctx.globalAlpha *= a;
    ctx.fillStyle = c;
    if (nd.shape === 'start' || nd.shape === 'end') { S.rrect(ctx, x - w * 0.35, y - h / 2, w * 0.7, h, h / 2); ctx.fill(); }
    else if (nd.shape === 'io') { ctx.beginPath(); ctx.moveTo(x - w / 2 + 30, y - h / 2); ctx.lineTo(x + w / 2, y - h / 2); ctx.lineTo(x + w / 2 - 30, y + h / 2); ctx.lineTo(x - w / 2, y + h / 2); ctx.closePath(); ctx.fill(); }
    else if (nd.shape === 'dec') { ctx.beginPath(); ctx.moveTo(x, y - h / 2 - 16); ctx.lineTo(x + w / 2, y); ctx.lineTo(x, y + h / 2 + 16); ctx.lineTo(x - w / 2, y); ctx.closePath(); ctx.fill(); }
    else { S.rrect(ctx, x - w / 2, y - h / 2, w, h, 12); ctx.fill(); }
    ctx.restore();
  }
  const FLOWC = { start: 'zumrut', end: 'mercan', io: 'mor', proc: 'kobalt', dec: 'safran' };
  function flowShowAt(sc) {
    const at = [];
    let prev = 0;
    sc.beats.forEach((b) => {
      const show = b.show != null ? b.show : prev;
      for (let j = prev; j < show; j++) at[j] = b.t + 0.3 + (j - prev) * Math.min(0.9, (b.d - 2) / Math.max(1, show - prev));
      prev = Math.max(prev, show);
    });
    for (let j = 0; j < sc.nodes.length; j++) if (at[j] == null) at[j] = 1e9;
    return at;
  }
  TPL.flow = {
    draw(ctx, L, lt, t, sc) {
      const pos = flowPos(L, sc), at = flowShowAt(sc);
      const idx = Object.fromEntries(sc.nodes.map((n, i) => [n.id, i]));
      const k = bIdx(sc, lt), b = sc.beats[Math.max(0, k)];
      // metin değişiklikleri (hata / düzeltme)
      const textOf = (nd) => {
        let s = nd.text;
        sc.beats.forEach((bb) => { if (lt >= bb.t + 0.3) { if (bb.bug && bb.bug.id === nd.id) s = bb.bug.text; if (bb.fix && bb.fix.id === nd.id && lt >= bb.t + 1.6) s = bb.fix.text; } });
        return s;
      };
      const bugOn = (nd) => sc.beats.some((bb) => bb.bug && bb.bug.id === nd.id && lt >= bb.t + 0.3) && !sc.beats.some((bb) => bb.fix && bb.fix.id === nd.id && lt >= bb.t + 1.6);
      // kenarlar
      sc.edges.forEach(([f, to, label, side]) => {
        const a = pos[f], c2 = pos[to];
        const t0 = Math.max(at[idx[f]], at[idx[to]]) + 0.2;
        const p = go(lt, t0, t0 + 0.4);
        if (p <= 0) return;
        ctx.save(); ctx.globalAlpha *= p; ctx.strokeStyle = P.sir2; ctx.fillStyle = P.sir2; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        let lx, ly;
        if (side === 'right' || side === 'left') { // geri dönüş ya da yan dal
          const sx = side === 'right' ? 1 : -1;
          const ox = a.x + sx * (a.w / 2 + 40);
          const fromX = a.x + sx * (sc.nodes[idx[f]].shape === 'dec' ? a.w / 2 : a.w / 2);
          const toX = c2.x + sx * (c2.w / 2);
          ctx.beginPath(); ctx.moveTo(fromX, a.y); ctx.lineTo(ox, a.y); ctx.lineTo(ox, c2.y); ctx.lineTo(toX + sx * 14, c2.y); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(toX, c2.y); ctx.lineTo(toX + sx * 22, c2.y - 12); ctx.lineTo(toX + sx * 22, c2.y + 12); ctx.closePath(); ctx.fill();
          lx = ox + sx * 8; ly = (a.y + c2.y) / 2;
        } else {
          const y1 = a.y + a.h / 2 + (sc.nodes[idx[f]].shape === 'dec' ? 16 : 0), y2 = c2.y - c2.h / 2 - (sc.nodes[idx[to]].shape === 'dec' ? 16 : 0);
          ctx.beginPath(); ctx.moveTo(a.x, y1); ctx.lineTo(a.x, y2 - 14); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(a.x, y2); ctx.lineTo(a.x - 12, y2 - 20); ctx.lineTo(a.x + 12, y2 - 20); ctx.closePath(); ctx.fill();
          lx = a.x + 36; ly = (y1 + y2) / 2;
        }
        ctx.restore();
        if (label) T.text(ctx, label, lx, ly, { size: 26, fam: 'display', weight: 800, color: P.safran, align: side === 'left' ? 'right' : 'left', alpha: p });
      });
      // düğümler
      sc.nodes.forEach((nd, i) => {
        const q = pos[nd.id];
        const p = pop(lt, at[i], 0.45), a = clamp(p * 2);
        if (a <= 0.01) return;
        const c = col(FLOWC[nd.shape] || 'kobalt');
        const qq = Object.assign({}, q, { w: q.w * (0.6 + 0.4 * p), h: q.h * (0.6 + 0.4 * p) });
        const bug = bugOn(nd);
        flowShape(ctx, nd, qq, bug ? P.mercan : c, a);
        T.text(ctx, textOf(nd), q.x, q.y, { size: L.pick(30, 32), maxW: nd.shape === 'dec' ? q.w * 0.66 : q.w * (nd.shape === 'start' || nd.shape === 'end' ? 0.62 : 0.88) - 20, color: ink(bug ? P.mercan : c), alpha: a, minSize: 22 });
        if (bug) { ctx.save(); ctx.translate(q.x - q.w / 2 - 44, q.y); BF.icon(ctx, 'bug', 0, 0, 56, t); ctx.restore(); }
      });
      // iz: aktif düğümde parlayan halka ve küçük Karo işareti
      if (b && b.trace) {
        const tr = b.trace, dur = (b.d - 2) / tr.length;
        const i = Math.min(tr.length - 1, Math.max(0, Math.floor((lt - b.t - 1) / dur)));
        if (lt > b.t + 1) {
          const q = pos[tr[i]];
          ctx.save(); ctx.strokeStyle = P.safran; ctx.lineWidth = 6; ctx.globalAlpha *= 0.6 + 0.4 * Math.sin(t * 8);
          S.rrect(ctx, q.x - q.w / 2 - 14, q.y - q.h / 2 - 14, q.w + 28, q.h + 28, 22); ctx.stroke(); ctx.restore();
        }
      }
      // yan panel
      if (sc.side) {
        const lines = sc.side.lines || [];
        const shown = sc.beats.reduce((m, bb) => (lt >= bb.t + 0.3 && bb.sideLines != null ? Math.max(m, bb.sideLines) : m), 0);
        const pa = go(lt, 0.2, 0.6);
        if (!L.v) {
          panel(ctx, 1080, 170, 700, 640, { alpha: pa, stroke: P.derz, lw: 3 });
          T.text(ctx, sc.side.title, 1120, 225, { size: 34, fam: 'display', align: 'left', color: P.safran, alpha: pa, maxW: 620 });
          lines.slice(0, shown).forEach((ln, j) => {
            const a2 = go(lt, 0, 0.001);
            T.para(ctx, ln, 1120, 300 + j * 100, { size: 31, align: 'left', maxW: 620, color: P.sir, maxLines: 2, alpha: a2 });
          });
        } else {
          panel(ctx, 60, 1060, 960, 360, { alpha: pa, stroke: P.derz, lw: 3 });
          T.text(ctx, sc.side.title, 100, 1110, { size: 32, fam: 'display', align: 'left', color: P.safran, alpha: pa, maxW: 880 });
          lines.slice(0, shown).forEach((ln, j) => T.para(ctx, ln, 100, 1175 + j * 72, { size: 30, align: 'left', maxW: 880, color: P.sir, maxLines: 1 }));
        }
      }
      drawK(ctx, sc, lt, t, L.pick([sc.side ? 1700 : 1700, 868, 96], [960, sc.side ? 1000 : 1452, 76]), { look: [-0.8, -0.5] });
    },
    cues(sc) {
      const at = flowShowAt(sc);
      const c = at.filter((a) => a < 1e8).map((a, i) => ({ at: a, sfx: 'pop', pitch: pentaUp(i), gain: 0.8 }));
      sc.beats.forEach((b) => {
        if (b.trace) { const dur = (b.d - 2) / b.trace.length; b.trace.forEach((id, i) => c.push({ at: b.t + 1 + i * dur, sfx: 'roll' })); }
        if (b.bug) c.push({ at: b.t + 0.3, sfx: 'no' }, { at: b.t + 0.5, sfx: 'karo', mood: 'worried' });
        if (b.fix) c.push({ at: b.t + 1.6, sfx: 'sparkle' }, { at: b.t + 1.8, sfx: 'karo', mood: 'happy' });
      });
      return c.concat(karoCues(sc));
    },
  };

  // ═══ code ════════════════════════════════════════════════════
  // Blok tabanlı programlama. Solda blok dizisi, sağda ızgaralı sahne; Karo'nun
  // küçük bir kopyası blokları çalıştırır.
  // { type:'code', grid:{w,h,start:[x,y],dir:'E',goal:[x,y],walls:[[x,y]…],items:[[x,y,icon]…]},
  //   blocks:[{text,kind:'event'|'motion'|'control'|'looks'|'sound'|'sense'|'var'|'ai',ind:0,op:{…}}],
  //   beats:[{ show:k, run:bool, bug:{i,text,op}, fix:{i,text,op}, say:'…' }] }
  // op: {move:n} {turn:'R'|'L'} {repeat:n, body:k} {say:'…'} {if:'…'} {set:'puan',v}
  const BK = { event: 'safran', motion: 'kobalt', control: 'turkuazK', looks: 'mor', sound: 'lale', sense: 'turkuaz', var: 'kehribar', ai: 'zumrut', func: 'lale' };
  function codeProgram(blocks) {
    // blokları düz komut listesine çevir (tekrar blokları açılır)
    const out = [];
    const defs = {};
    blocks.forEach((b, i) => { const op = b.op || {}; if (op.def) defs[op.def] = [i + 1, i + 1 + (op.body || 1)]; });
    let depth = 0;
    const walk = (i0, i1) => {
      for (let i = i0; i < i1; i++) {
        const b = blocks[i], op = b.op || {};
        if (op.def) { i += op.body || 1; continue; } // tanım: kendi başına çalışmaz
        if (op.repeat) { const body = op.body || 1; for (let r = 0; r < op.repeat; r++) { out.push({ bi: i }); walk(i + 1, i + 1 + body); } i += body; }
        else if (op.call && defs[op.call] && depth < 5) { out.push({ bi: i }); depth++; walk(...defs[op.call]); depth--; }
        else out.push({ bi: i, op });
      }
    };
    walk(0, blocks.length);
    return out;
  }
  function codeState(sc, blocks, steps) {
    // her adımdan sonra sprite durumu
    const g = sc.grid, st = [{ x: g.start[0], y: g.start[1], dir: g.dir || 'E', say: '', vars: Object.assign({}, g.vars || {}), got: [] }];
    const D = { E: [1, 0], W: [-1, 0], N: [0, -1], S: [0, 1] }, R = { E: 'S', S: 'W', W: 'N', N: 'E' }, Lf = { E: 'N', N: 'W', W: 'S', S: 'E' };
    steps.forEach((s) => {
      const pv = st[st.length - 1];
      const c = Object.assign({}, pv, { say: '', bump: false, vars: Object.assign({}, pv.vars), got: pv.got.slice() });
      const op = s.op || {};
      if (op.move) { const [dx, dy] = D[c.dir]; const nx = c.x + dx * op.move, ny = c.y + dy * op.move; if (!(g.walls || []).some(([wx, wy]) => wx === nx && wy === ny) && nx >= 0 && ny >= 0 && nx < g.w && ny < g.h) { c.x = nx; c.y = ny; } else c.bump = true;
        (g.items || []).forEach(([ix, iy], k) => { if (ix === c.x && iy === c.y && !c.got.includes(k)) { c.got.push(k); if (g.score) c.vars[g.score] = (c.vars[g.score] || 0) + 1; } }); }
      if (op.set) c.vars[op.set] = op.v;
      if (op.change) c.vars[op.change] = (c.vars[op.change] || 0) + (op.by == null ? 1 : op.by);
      if (op.turn) c.dir = op.turn === 'R' ? R[c.dir] : Lf[c.dir];
      if (op.say) c.say = op.say;
      st.push(c);
    });
    return st;
  }
  TPL.code = {
    draw(ctx, L, lt, t, sc) {
      const k = Math.max(0, bIdx(sc, lt)), b = sc.beats[k];
      // blok listesinin o anki hâli (hata/düzeltme uygulanır)
      const blocks = sc.blocks.map((x) => Object.assign({}, x));
      sc.beats.forEach((bb) => {
        if (lt >= bb.t + 0.3 && bb.bug) Object.assign(blocks[bb.bug.i], { text: bb.bug.text, op: bb.bug.op || blocks[bb.bug.i].op, bugged: true });
        if (lt >= bb.t + 1.4 && bb.fix) Object.assign(blocks[bb.fix.i], { text: bb.fix.text, op: bb.fix.op || blocks[bb.fix.i].op, bugged: false, fixed: lt < bb.t + 3.5 });
        if (lt >= bb.t + 0.3 && bb.change) bb.change.forEach((ch) => Object.assign(blocks[ch.i], ch));
      });
      const shown = sc.beats.reduce((m, bb) => (lt >= bb.t + 0.2 && bb.show != null ? Math.max(m, bb.show) : m), 0);
      // yerleşim
      const H = !L.v;
      const panelR = H ? [150, 160, 720, 690] : [50, 170, 980, 590];
      const stageR = H ? [920, 160, 850, 690] : [100, 800, 880, 620];
      panel(ctx, ...panelR, { bg: 'rgba(11,19,51,0.75)', stroke: P.derz, lw: 3 });
      panel(ctx, ...stageR, { bg: '#1B2B63', stroke: P.derz, lw: 3 });
      T.text(ctx, sc.panelTitle || 'Kod', panelR[0] + 30, panelR[1] + 40, { size: 28, fam: 'display', align: 'left', color: P.turkuazA, maxW: 400 });
      T.text(ctx, sc.stageTitle || 'Sahne', stageR[0] + 30, stageR[1] + 40, { size: 28, fam: 'display', align: 'left', color: P.turkuazA, maxW: 400 });
      // bloklar
      const bh = H ? Math.min(66, 580 / Math.max(1, blocks.length) - 8) : Math.min(62, 490 / Math.max(1, blocks.length) - 8);
      const bx0 = panelR[0] + 34, by0 = panelR[1] + 80;
      // çalıştırma
      let runStep = -1, runSt = null, steps = null, states = null;
      if (b.run) {
        steps = codeProgram(blocks.slice(0, shown));
        states = codeState(sc, blocks, steps);
        const dur = Math.min(0.9, (b.d - 2.2) / Math.max(1, steps.length));
        const q = (lt - b.t - 1.0) / dur;
        runStep = Math.min(steps.length - 1, Math.floor(q));
        runSt = { q, dur };
      }
      blocks.forEach((bl, i) => {
        if (i >= shown) return;
        const firstBeat = sc.beats.find((bb) => bb.show != null && bb.show > i);
        const p = pop(lt, (firstBeat ? firstBeat.t : 0) + 0.3 + (i - sc.beats.filter((bb) => bb.t < (firstBeat ? firstBeat.t : 0) && bb.show != null).reduce((m, bb) => Math.max(m, bb.show), 0)) * 0.35, 0.4);
        const a = clamp(p * 2);
        const c = col(bl.bugged ? 'mercan' : BK[bl.kind] || 'kobalt');
        const ind = (bl.ind || 0) * 44;
        const x = bx0 + ind, y = by0 + i * (bh + 8);
        const w = Math.min(panelR[2] - 70 - ind, T.measure(ctx, bl.text, H ? 29 : 30, 'body', 800) + 70);
        const active = steps && runStep >= 0 && steps[runStep] && steps[runStep].bi === i && runSt.q < steps.length;
        ctx.save(); ctx.globalAlpha *= a; ctx.translate((1 - p) * -40, 0);
        ctx.fillStyle = 'rgba(3,6,20,0.35)'; S.rrect(ctx, x + 4, y + 6, w, bh, 12); ctx.fill();
        ctx.fillStyle = c; S.rrect(ctx, x, y, w, bh, 12); ctx.fill();
        S.rrect(ctx, x + 22, y - 6, 34, 12, 5); ctx.fill(); // çentik
        if (active) { ctx.strokeStyle = P.sir; ctx.lineWidth = 5; S.rrect(ctx, x - 4, y - 4, w + 8, bh + 8, 14); ctx.stroke(); }
        if (bl.fixed) { ctx.strokeStyle = P.zumrut; ctx.lineWidth = 5; S.rrect(ctx, x - 5, y - 5, w + 10, bh + 10, 15); ctx.stroke(); }
        ctx.restore();
        T.text(ctx, bl.text, x + 22, y + bh / 2, { size: H ? 29 : 30, align: 'left', color: ink(c), alpha: a, maxW: w - 34, minSize: 22 });
      });
      // sahne ızgarası
      const g = sc.grid;
      const cell = Math.min((stageR[2] - 60) / g.w, (stageR[3] - 100) / g.h);
      const gx0 = stageR[0] + (stageR[2] - cell * g.w) / 2, gy0 = stageR[1] + 70 + (stageR[3] - 80 - cell * g.h) / 2;
      ctx.save();
      for (let i = 0; i < g.w; i++) for (let j = 0; j < g.h; j++) {
        ctx.fillStyle = (i + j) % 2 ? '#223574' : '#27397A'; S.rrect(ctx, gx0 + i * cell + 2, gy0 + j * cell + 2, cell - 4, cell - 4, 8); ctx.fill();
      }
      (g.walls || []).forEach(([x, y]) => { ctx.fillStyle = P.mercan; S.rrect(ctx, gx0 + x * cell + 6, gy0 + y * cell + 6, cell - 12, cell - 12, 10); ctx.fill(); ctx.fillStyle = 'rgba(0,0,0,0.2)'; S.star8(ctx, gx0 + (x + 0.5) * cell, gy0 + (y + 0.5) * cell, cell * 0.18); ctx.fill(); });
      ctx.restore();
      let cur = { vars: Object.assign({}, g.vars || {}), got: [] };
      if (states) { const i2 = Math.max(0, Math.min(states.length - 1, runSt.q < 0 ? 0 : runSt.q >= steps.length ? states.length - 1 : runStep + (runSt.q - runStep > 0.6 ? 1 : 0))); cur = states[i2]; }
      (g.items || []).forEach(([x, y, icon], k) => { if (!cur.got.includes(k)) tile(ctx, gx0 + (x + 0.5) * cell, gy0 + (y + 0.5) * cell, cell * 0.6, icon, P.safran, t); });
      const vk = Object.keys(cur.vars);
      let vx = stageR[0] + 190;
      vk.forEach((name) => { vx += 16 + S.chip(ctx, name + ' = ' + cur.vars[name], vx, stageR[1] + 40, { size: 28, fam: 'body', align: 'left', bg: P.safran, color: P.murekkep }); });
      if (g.goal) { ctx.save(); ctx.fillStyle = P.zumrut; ctx.globalAlpha *= 0.85; S.star8(ctx, gx0 + (g.goal[0] + 0.5) * cell, gy0 + (g.goal[1] + 0.5) * cell, cell * 0.34); ctx.fill(); ctx.restore(); }
      // sprite
      let sx = g.start[0], sy = g.start[1], dir = g.dir || 'E', say = '', bump = 0;
      if (states) {
        const i = Math.max(0, Math.min(states.length - 2, runStep));
        const f = runSt.q < 0 ? 0 : clamp(runSt.q - Math.max(0, runStep));
        const s0 = states[runSt.q < 0 ? 0 : i], s1 = states[runSt.q < 0 ? 0 : Math.min(states.length - 1, i + 1)];
        const e = E.inOut(f);
        if (runSt.q >= steps.length) { sx = states[states.length - 1].x; sy = states[states.length - 1].y; dir = states[states.length - 1].dir; say = states[states.length - 1].say; }
        else { sx = lerp(s0.x, s1.x, e); sy = lerp(s0.y, s1.y, e); dir = f > 0.5 ? s1.dir : s0.dir; say = s1.say && f > 0.2 ? s1.say : ''; bump = s1.bump ? Math.sin(f * Math.PI) : 0; }
      }
      const px = gx0 + (sx + 0.5) * cell, py = gy0 + (sy + 0.5) * cell;
      const DX = { E: 1, W: -1, N: 0, S: 0 }[dir], DY = { E: 0, W: 0, N: -1, S: 1 }[dir];
      BF.drawKaro(ctx, { x: px + DX * bump * cell * 0.15, y: py + cell * 0.36, s: cell * 0.5, mood: bump > 0.2 ? 'surprised' : say ? 'happy' : 'neutral', caret: 'none', look: [DX, DY], armL: 0.4, armR: 0.4, seed: 11 }, t);
      if (say) S.chip(ctx, say, Math.min(stageR[0] + stageR[2] - 150, Math.max(stageR[0] + 150, px)), py - cell * 0.7, { size: 28, fam: 'body', bg: P.sir, color: P.murekkep, maxW: 300 });
      const done = states && runSt.q >= steps.length && g.goal && Math.round(sx) === g.goal[0] && Math.round(sy) === g.goal[1];
      if (done) stamp(ctx, stageR[0] + stageR[2] - 60, stageR[1] + 50, 34, true, go(lt, b.t + 1 + steps.length * runSt.dur, b.t + 1.5 + steps.length * runSt.dur));
      drawK(ctx, sc, lt, t, L.pick([1830, 868, 70], [960, 1452, 70]), { look: [-0.8, -0.5], mood: done ? 'proud' : b.bug ? 'worried' : undefined, caret: done ? 'ok' : b.bug ? '?' : undefined });
    },
    cues(sc) {
      const c = [];
      let prev = 0;
      sc.beats.forEach((b) => {
        if (b.show != null && b.show > prev) { for (let j = prev; j < b.show; j++) c.push({ at: b.t + 0.3 + (j - prev) * 0.35, sfx: 'land', pitch: 1.2 + (j % 5) * 0.1, gain: 0.7 }); prev = b.show; }
        if (b.run) {
          const steps = codeProgram(sc.blocks.slice(0, prev));
          const dur = Math.min(0.9, (b.d - 2.2) / Math.max(1, steps.length));
          c.push({ at: b.t + 0.6, sfx: 'ding', f: 1568 });
          steps.forEach((s, i) => c.push({ at: b.t + 1.0 + i * dur, sfx: s.op && s.op.say ? 'karo' : 'roll', mood: 'happy', pan: 0.5 }));
          c.push({ at: b.t + 1.0 + steps.length * dur, sfx: 'sparkle' });
        }
        if (b.bug) c.push({ at: b.t + 0.3, sfx: 'no' });
        if (b.fix) c.push({ at: b.t + 1.4, sfx: 'pop', pitch: 1.4 }, { at: b.t + 1.5, sfx: 'karo', mood: 'happy' });
      });
      return c.concat(karoCues(sc));
    },
  };
})(typeof window !== 'undefined' ? window : globalThis);
