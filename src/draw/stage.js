/* ─────────────────────────────────────────────────────────────
   Sahne / Stage — renderFrame(t): zemin → sahne → geçiş → başlık → altyazı.
   Tasarım uzayı: yatay 1920×1080, dikey 1080×1920. Tuval (canvas) çıktı
   çözünürlüğüne göre ölçeklenir (ör. 720p için 2/3).
   ───────────────────────────────────────────────────────────── */
(function (root) {
  const BF = (root.BF = root.BF || {});
  const { M, P, S, T } = BF;

  // Düzen: yatay/dikey
  function layout(format) {
    const v = format === 'vertical';
    const W = v ? 1080 : 1920, H = v ? 1920 : 1080;
    return {
      v, W, H, cx: W / 2, cy: H / 2,
      pick: (h, vv) => (v ? vv : h),
      margin: 60,
      // altyazı bandının merkezi ve yüksekliği (sahne yazıları buraya girmemeli)
      capY: v ? 1570 : 972,
      capMaxW: v ? 940 : 1560,
      top: v ? 170 : 130,          // içerik alanı üstü (başlık çipinin altı)
      bottom: v ? 1450 : 880,      // içerik alanı altı (altyazının üstü)
    };
  }

  function activeScene(t) {
    const sc = BF.SCENES;
    for (let i = 0; i < sc.length; i++) if (t < sc[i].t1 || i === sc.length - 1) return i;
    return sc.length - 1;
  }

  function drawScene(ctx, L, i, t) {
    const sc = BF.SCENES[i];
    const fn = BF.scenes && BF.scenes[sc.id];
    if (fn) fn(ctx, L, (t - sc.t0) / (BF.META.tempo || 1), t); // sahneye hikâye zamanı, ortam için film zamanı
  }

  function header(ctx, L, t, lang) {
    const i = activeScene(t);
    const sc = BF.SCENES[i];
    if (sc.noHeader) return;
    const a = M.win(t, sc.t0 + 0.5, sc.t1 - 0.2, 0.4);
    const name = lang === 'en' ? sc.en : sc.name;
    const x = L.margin, y = L.v ? 78 : 64;
    // mini karo logosu
    ctx.save(); ctx.globalAlpha *= a;
    ctx.fillStyle = P.turkuaz; S.rrect(ctx, x, y - 23, 46, 46, 9); ctx.fill();
    ctx.fillStyle = P.safran; S.rrect(ctx, x + 19, y - 14, 6, 20, 3); ctx.fill();
    ctx.restore();
    const w = S.chip(ctx, BF.META.code, x + 58, y, { size: 27, align: 'left', bg: 'rgba(28,42,92,0.9)', color: P.turkuazA, alpha: a, fam: 'display', h: 44 });
    S.chip(ctx, `${i + 1}  ·  ${name}`, x + 58 + w + 12, y, { size: 29, align: 'left', bg: P.gece2, alpha: a, fam: 'body', weight: 800, h: 46, maxW: L.W - (x + 58 + w + 12) - L.margin });
  }

  function captions(ctx, L, t, mode) {
    if (!mode || mode === 'off') return;
    const C = BF.CAPTIONS || [];
    const c = C.find((k) => t >= k.start - 0.25 && t <= k.end + 0.25);
    if (!c) return;
    const a = M.win(t, c.start - 0.2, c.end + 0.2, 0.25);
    if (a <= 0.01) return;
    const tr = mode === 'tr' || mode === 'bi', en = mode === 'en' || mode === 'bi';
    const szTR = L.v ? 46 : 46, szEN = mode === 'bi' ? (L.v ? 36 : 36) : szTR;
    const lines = [];
    if (tr) T.wrap(ctx, c.tr, L.capMaxW - 90, szTR, 'body', 800).forEach((s) => lines.push({ s, size: szTR, color: P.sir, w: 800 }));
    if (en) T.wrap(ctx, c.en, L.capMaxW - 90, szEN, 'body', 600).forEach((s) => lines.push({ s, size: szEN, color: mode === 'bi' ? P.turkuazA : P.sir, w: mode === 'bi' ? 600 : 800 }));
    const lh = (k) => k.size * 1.28;
    const h = lines.reduce((s, k) => s + lh(k), 0) + 34;
    let wmax = 0;
    lines.forEach((k) => { wmax = Math.max(wmax, T.measure(ctx, k.s, k.size, 'body', k.w)); });
    const w = Math.min(L.capMaxW, wmax + 90);
    const x0 = L.cx - w / 2, y0 = L.capY - h / 2;
    ctx.save();
    ctx.globalAlpha *= a;
    ctx.fillStyle = 'rgba(11,19,51,0.9)';
    S.rrect(ctx, x0, y0, w, h, 22); ctx.fill();
    ctx.fillStyle = P.safran;
    S.rrect(ctx, x0 + 16, y0 + 18, 8, h - 36, 4); ctx.fill();
    let y = y0 + 17;
    const g = ++BF.CHECK.group;
    lines.forEach((k) => {
      T.text(ctx, k.s, L.cx + 10, y + lh(k) / 2, { size: k.size, weight: k.w, color: k.color, group: g });
      y += lh(k);
    });
    ctx.restore();
  }

  // Bir kare çiz. opts: {format, captions, scale}
  function renderFrame(ctx, t, opts) {
    const L = layout(opts.format);
    BF.CHECK.items = [];
    const sc = opts.scale || 1;
    BF.CHECK.stageScale = sc;
    ctx.setTransform(sc, 0, 0, sc, 0, 0);
    S.backdrop(ctx, L, t);
    // sahne + geçiş
    const scenes = BF.SCENES;
    let inTransition = false;
    for (let i = 1; i < scenes.length; i++) {
      const T0 = scenes[i].t0;
      if (Math.abs(t - T0) < S.TR_D / 2) {
        inTransition = true;
        S.transition(ctx, L, t, T0, () => drawScene(ctx, L, i - 1, t), () => drawScene(ctx, L, i, t));
        break;
      }
    }
    if (!inTransition) drawScene(ctx, L, activeScene(t), t);
    header(ctx, L, t, opts.captions);
    captions(ctx, L, t, opts.captions);
    return { L, inTransition };
  }

  // Yazı kontrolü: üst üste binme, taşma, küçük punto
  function checkFrame(L, scale, minPx) {
    const items = BF.CHECK.items;
    const issues = [];
    const W = L.W * scale, H = L.H * scale, m = 16 * scale;
    for (const k of items) {
      if (k.x0 < m || k.y0 < m || k.x1 > W - m || k.y1 > H - m) issues.push(`taşma: "${k.str}"`);
      if (k.px < minPx) issues.push(`küçük (${k.px.toFixed(1)}px): "${k.str}"`);
    }
    for (let i = 0; i < items.length; i++) for (let j = i + 1; j < items.length; j++) {
      const a = items[i], b = items[j];
      if (a.group === b.group) continue;
      const ox = Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0);
      const oy = Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0);
      if (ox > 3 * scale && oy > 3 * scale) issues.push(`çakışma: "${a.str}" × "${b.str}"`);
    }
    return issues;
  }

  BF.layout = layout;
  BF.renderFrame = renderFrame;
  BF.checkFrame = checkFrame;
  BF.activeScene = activeScene;
})(typeof window !== 'undefined' ? window : globalThis);
