/* ─────────────────────────────────────────────────────────────
   Yazı / Text — iki yazı tipi:
   • Unbounded (başlık, etiket)   • Bricolage Grotesque (cümle, altyazı)
   Her yazı çizimi bir "kontrol kaydı"na düşer: ?check=1 ile üst üste binen,
   kenardan taşan ya da çok küçük kalan yazılar otomatik bulunur.
   ───────────────────────────────────────────────────────────── */
(function (root) {
  const BF = (root.BF = root.BF || {});
  const FAM = { display: '"Unbounded"', body: '"Bricolage Grotesque"' };

  const CHECK = (BF.CHECK = { on: false, items: [], mute: 0, group: 0 });

  function font(size, fam = 'body', weight = 800) {
    return `${weight} ${Math.round(size * 10) / 10}px ${FAM[fam] || FAM.body}, sans-serif`;
  }

  function measure(ctx, str, size, fam, weight, tracking = 0) {
    ctx.font = font(size, fam, weight);
    return ctx.measureText(str).width + tracking * size * Math.max(0, [...str].length - 1);
  }

  function record(ctx, str, x0, y0, x1, y1, size, alpha, group) {
    if (!CHECK.on || CHECK.mute > 0 || alpha < 0.35 || !str.trim()) return;
    const m = ctx.getTransform();
    const pts = [[x0, y0], [x1, y0], [x0, y1], [x1, y1]].map(([x, y]) => [m.a * x + m.c * y + m.e, m.b * x + m.d * y + m.f]);
    const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
    // punto denetimi nominal boyutla yapılır (açılış animasyonundaki geçici küçülme sayılmaz)
    CHECK.items.push({ str, x0: Math.min(...xs), y0: Math.min(...ys), x1: Math.max(...xs), y1: Math.max(...ys), px: size * (CHECK.stageScale || 1), group });
  }

  // Tek satır yazı. o: {size, fam, weight, color, align, base, maxW, alpha, tracking, minSize}
  function text(ctx, str, x, y, o = {}) {
    let size = o.size || 40;
    const fam = o.fam || 'body', weight = o.weight || 800, tracking = o.tracking || 0;
    const minSize = o.minSize || size * 0.7;
    let w = measure(ctx, str, size, fam, weight, tracking);
    if (o.maxW && w > o.maxW) { size = Math.max(minSize, size * (o.maxW / w)); w = measure(ctx, str, size, fam, weight, tracking); }
    const alpha = o.alpha == null ? 1 : o.alpha;
    if (alpha <= 0.001) return { w, size };
    ctx.save();
    ctx.globalAlpha *= alpha;
    ctx.font = font(size, fam, weight);
    ctx.fillStyle = o.color || BF.P.sir;
    ctx.textBaseline = 'alphabetic';
    const align = o.align || 'center';
    let sx = align === 'center' ? x - w / 2 : align === 'right' ? x - w : x;
    // dikey hizalama: 'middle' → x-yüksekliği ortası
    const asc = size * (fam === 'display' ? 0.74 : 0.72);
    const base = o.base || 'middle';
    const by = base === 'middle' ? y + asc / 2 : base === 'top' ? y + asc : y;
    if (tracking) {
      ctx.textAlign = 'left';
      let cx = sx;
      for (const ch of str) { ctx.fillText(ch, cx, by); cx += ctx.measureText(ch).width + tracking * size; }
    } else {
      ctx.textAlign = 'left';
      ctx.fillText(str, sx, by);
    }
    record(ctx, str, sx, by - asc * 1.02, sx + w, by + size * 0.2, size, ctx.globalAlpha, o.group == null ? ++CHECK.group : o.group);
    ctx.restore();
    return { w, size };
  }

  function wrap(ctx, str, maxW, size, fam = 'body', weight = 800) {
    ctx.font = font(size, fam, weight);
    const words = str.split(/\s+/);
    const lines = [];
    let cur = '';
    for (const wd of words) {
      const next = cur ? cur + ' ' + wd : wd;
      if (ctx.measureText(next).width <= maxW || !cur) cur = next;
      else { lines.push(cur); cur = wd; }
    }
    if (cur) lines.push(cur);
    return lines;
  }

  // Çok satırlı paragraf; y = ilk satırın ortası ya da o.vcenter ile bloğun ortası
  function para(ctx, str, x, y, o = {}) {
    let size = o.size || 36;
    const fam = o.fam || 'body', weight = o.weight || 800;
    let lines = wrap(ctx, str, o.maxW || 800, size, fam, weight);
    const maxLines = o.maxLines || 99;
    while (lines.length > maxLines && size > (o.minSize || size * 0.7)) { size *= 0.94; lines = wrap(ctx, str, o.maxW || 800, size, fam, weight); }
    const lh = size * (o.lh || 1.18);
    const y0 = o.vcenter ? y - ((lines.length - 1) * lh) / 2 : y;
    const g = ++CHECK.group;
    let wmax = 0;
    lines.forEach((ln, i) => { const r = text(ctx, ln, x, y0 + i * lh, Object.assign({}, o, { size, group: g, maxW: o.maxW })); wmax = Math.max(wmax, r.w); });
    return { lines: lines.length, h: lines.length * lh, size, w: wmax };
  }

  BF.T = { font, measure, text, wrap, para, FAM };
})(typeof window !== 'undefined' ? window : globalThis);
