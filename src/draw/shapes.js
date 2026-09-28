/* ─────────────────────────────────────────────────────────────
   Şekiller / Shapes — karo kartları, etiket çipleri, raflar, oklar,
   zemin deseni ve karo-çevirme geçişi.
   ───────────────────────────────────────────────────────────── */
(function (root) {
  const BF = (root.BF = root.BF || {});
  const { M, P } = BF;

  function rrect(ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  // 8 köşeli yıldız (Selçuklu/çini motifi): iki kare üst üste
  function star8(ctx, x, y, r) {
    ctx.beginPath();
    for (let i = 0; i < 16; i++) {
      const a = (i * Math.PI) / 8 - Math.PI / 2;
      const rr = i % 2 === 0 ? r : r * 0.62;
      ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
    }
    ctx.closePath();
  }

  // Çini karo kartı: sır beyazı zemin, renkli iç çerçeve, köşe benekleri.
  // İçine icon çizilir. (x, y) merkez, s kenar.
  function tile(ctx, x, y, s, o = {}) {
    const a = o.alpha == null ? 1 : o.alpha;
    if (a <= 0.001 || s <= 1) return;
    const c = o.color || P.turkuaz;
    ctx.save();
    ctx.globalAlpha *= a;
    ctx.translate(x, y);
    if (o.rot) ctx.rotate(o.rot);
    if (o.flip != null) ctx.scale(Math.max(0.001, Math.abs(o.flip)), 1);
    const h = s / 2, r = s * 0.14;
    // gölge
    ctx.fillStyle = 'rgba(5,10,30,0.35)';
    rrect(ctx, -h + s * 0.03, -h + s * 0.06, s, s, r); ctx.fill();
    // karo
    ctx.fillStyle = o.ground || P.sir;
    rrect(ctx, -h, -h, s, s, r); ctx.fill();
    // iç çerçeve
    ctx.strokeStyle = c;
    ctx.lineWidth = s * 0.035;
    rrect(ctx, -h + s * 0.075, -h + s * 0.075, s * 0.85, s * 0.85, r * 0.6); ctx.stroke();
    // köşe benekleri
    ctx.fillStyle = c;
    for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
      ctx.beginPath(); ctx.arc(sx * s * 0.36, sy * s * 0.36, s * 0.022, 0, Math.PI * 2); ctx.fill();
    }
    if (o.icon) BF.icon(ctx, o.icon, 0, 0, s * 0.62, o.t || 0, o.iconOpts);
    if (o.glow) {
      ctx.globalAlpha = a * o.glow;
      ctx.strokeStyle = P.safran; ctx.lineWidth = s * 0.05;
      rrect(ctx, -h - s * 0.06, -h - s * 0.06, s * 1.12, s * 1.12, r * 1.3); ctx.stroke();
    }
    ctx.restore();
  }

  // Etiket çipi: renkli kapsül + yazı. Döndürür: genişlik
  function chip(ctx, str, x, y, o = {}) {
    const size = o.size || 32, fam = o.fam || 'display', weight = o.weight || 800;
    const padX = o.padX == null ? size * 0.7 : o.padX;
    let w = BF.T.measure(ctx, str, size, fam, weight, o.tracking || 0) + padX * 2;
    let sz = size;
    if (o.maxW && w > o.maxW) { sz = size * ((o.maxW - padX * 2) / (w - padX * 2)); w = o.maxW; }
    const h = o.h || sz * 1.75;
    const a = o.alpha == null ? 1 : o.alpha;
    if (a <= 0.001) return w;
    const align = o.align || 'center';
    const x0 = align === 'center' ? x - w / 2 : align === 'right' ? x - w : x;
    ctx.save();
    ctx.globalAlpha *= a;
    if (o.scale != null) { ctx.translate(x, y); ctx.scale(o.scale, o.scale); ctx.translate(-x, -y); }
    ctx.fillStyle = o.bg || P.gece2;
    rrect(ctx, x0, y - h / 2, w, h, o.r == null ? h * 0.28 : o.r); ctx.fill();
    if (o.stroke) { ctx.strokeStyle = o.stroke; ctx.lineWidth = o.lw || 3; ctx.stroke(); }
    BF.T.text(ctx, str, x0 + w / 2, y, { size: sz, fam, weight, color: o.color || P.sir, tracking: o.tracking || 0 });
    ctx.restore();
    return w;
  }

  // Ok: (x0,y0) → (x1,y1), p = çizilen oran
  function arrow(ctx, x0, y0, x1, y1, o = {}) {
    const p = o.p == null ? 1 : o.p;
    if (p <= 0.001) return;
    const x = M.lerp(x0, x1, p), y = M.lerp(y0, y1, p);
    ctx.save();
    ctx.globalAlpha *= o.alpha == null ? 1 : o.alpha;
    ctx.strokeStyle = ctx.fillStyle = o.color || P.safran;
    ctx.lineWidth = o.lw || 8; ctx.lineCap = 'round';
    if (o.dash) { ctx.setLineDash(o.dash); ctx.lineDashOffset = -(o.dashOffset || 0); }
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x, y); ctx.stroke();
    ctx.setLineDash([]);
    if (o.head !== false) {
      const a = Math.atan2(y1 - y0, x1 - x0), hs = o.hs || ctx.lineWidth * 2.6;
      ctx.beginPath();
      ctx.moveTo(x + Math.cos(a) * hs * 0.4, y + Math.sin(a) * hs * 0.4);
      ctx.lineTo(x - Math.cos(a - 0.6) * hs, y - Math.sin(a - 0.6) * hs);
      ctx.lineTo(x - Math.cos(a + 0.6) * hs, y - Math.sin(a + 0.6) * hs);
      ctx.closePath(); ctx.fill();
    }
    ctx.restore();
  }

  // Raf: başlık çipi + çerçeveli bölme
  function shelf(ctx, r, o = {}) {
    const a = o.alpha == null ? 1 : o.alpha;
    if (a <= 0.001) return;
    const c = o.color || P.kobalt;
    ctx.save();
    ctx.globalAlpha *= a;
    ctx.fillStyle = 'rgba(12,20,52,0.55)';
    rrect(ctx, r.x - r.w / 2, r.y, r.w, r.h, 26); ctx.fill();
    ctx.strokeStyle = c; ctx.lineWidth = 5;
    ctx.setLineDash([2, 14]); ctx.lineCap = 'round';
    rrect(ctx, r.x - r.w / 2, r.y, r.w, r.h, 26); ctx.stroke();
    ctx.setLineDash([]);
    // raf tahtası
    ctx.fillStyle = c;
    rrect(ctx, r.x - r.w / 2 + 18, r.y + r.h - 22, r.w - 36, 10, 5); ctx.fill();
    if (o.label) chip(ctx, o.label, r.x, r.y, { size: o.size || 30, bg: c, color: o.labelColor || P.sir, maxW: r.w - 30 });
    if (o.shake) { /* sallanma dıştan translate ile verilir */ }
    ctx.restore();
  }

  // ─── Zemin: lacivert, katmanlı ışık, derz ızgarası, 8 köşeli yıldızlar
  function backdrop(ctx, L, t) {
    const { W, H } = L;
    ctx.fillStyle = P.gece; ctx.fillRect(0, 0, W, H);
    let g = ctx.createRadialGradient(W * 0.18, H * 0.12, 0, W * 0.18, H * 0.12, Math.max(W, H) * 0.75);
    g.addColorStop(0, 'rgba(31,194,178,0.16)'); g.addColorStop(1, 'rgba(31,194,178,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    g = ctx.createRadialGradient(W * 0.9, H * 0.95, 0, W * 0.9, H * 0.95, Math.max(W, H) * 0.7);
    g.addColorStop(0, 'rgba(255,90,69,0.12)'); g.addColorStop(1, 'rgba(255,90,69,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    // derz ızgarası
    const cell = 120;
    const ox = ((W % cell) / 2), oy = ((H % cell) / 2);
    ctx.strokeStyle = 'rgba(60,86,170,0.22)'; ctx.lineWidth = 2;
    ctx.beginPath();
    for (let x = ox; x <= W; x += cell) { ctx.moveTo(x, 0); ctx.lineTo(x, H); }
    for (let y = oy; y <= H; y += cell) { ctx.moveTo(0, y); ctx.lineTo(W, y); }
    ctx.stroke();
    // kesişimlerde küçük yıldızlar; bazı karolar yavaşça "nefes alır"
    let i = 0;
    for (let x = ox; x <= W; x += cell) for (let y = oy; y <= H; y += cell) {
      i++;
      ctx.fillStyle = 'rgba(80,110,200,0.28)';
      star8(ctx, x, y, 7); ctx.fill();
      const h = M.hash(i, 3);
      if (h < 0.09 && x + cell <= W && y + cell <= H) {
        const ph = M.hash(i, 11) * 12;
        const b = Math.max(0, Math.sin(((t + ph) / 6) * Math.PI * 2));
        ctx.fillStyle = [P.turkuaz, P.safran, P.mercan, P.kobalt][Math.floor(M.hash(i, 5) * 4)];
        ctx.globalAlpha = 0.07 * b;
        rrect(ctx, x + 8, y + 8, cell - 16, cell - 16, 16); ctx.fill();
        ctx.globalAlpha = 1;
      }
    }
    // kenar kararması
    g = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.max(W, H) * 0.8);
    g.addColorStop(0, 'rgba(5,9,28,0)'); g.addColorStop(1, 'rgba(5,9,28,0.45)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  }

  // ─── Karo-çevirme geçişi: karolar köşegen sırayla kalkar, arkasında yeni sahne belirir.
  // T: sahne sınırı. Döndürür: {active, drawNewClip(fn)}
  const TR_D = 1.3;
  function transition(ctx, L, t, T, drawOld, drawNew) {
    const cell = L.v ? 135 : 120;
    const cols = Math.ceil(L.W / cell), rows = Math.ceil(L.H / cell);
    const p = (t - (T - TR_D / 2)) / TR_D; // 0..1
    drawOld();
    const cols4 = [P.turkuaz, P.mercan, P.safran, P.kobalt, P.sir, P.zumrut];
    const tiles = [];
    for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
      const d = (i / cols + j / rows) / 2;          // köşegen gecikme
      const lp = M.clamp((p - d * 0.45) / 0.55);     // karo zamanı 0..1
      tiles.push({ i, j, lp });
    }
    // yeni sahne: tepe noktasını geçmiş karoların içinde görünür
    ctx.save();
    ctx.beginPath();
    let any = false;
    for (const k of tiles) if (k.lp >= 0.5) { ctx.rect(k.i * cell, k.j * cell, cell + 0.5, cell + 0.5); any = true; }
    if (any) { ctx.clip(); BF.CHECK.mute++; drawNew(); BF.CHECK.mute--; }
    ctx.restore();
    // karolar
    for (const k of tiles) {
      if (k.lp <= 0 || k.lp >= 1) continue;
      const sc = Math.sin(k.lp * Math.PI);
      const s = cell * 0.96 * sc;
      const x = k.i * cell + cell / 2, y = k.j * cell + cell / 2;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate((1 - sc) * 0.6 * (k.lp < 0.5 ? -1 : 1));
      ctx.fillStyle = cols4[Math.floor(M.hash(k.i * 31 + k.j, 17) * cols4.length)];
      rrect(ctx, -s / 2, -s / 2, s, s, s * 0.16); ctx.fill();
      ctx.fillStyle = 'rgba(11,19,51,0.22)';
      star8(ctx, 0, 0, s * 0.22); ctx.fill();
      ctx.restore();
    }
  }

  BF.S = { rrect, star8, tile, chip, arrow, shelf, backdrop, transition, TR_D };
})(typeof window !== 'undefined' ? window : globalThis);
