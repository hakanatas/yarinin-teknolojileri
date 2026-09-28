/* ─────────────────────────────────────────────────────────────
   KARO — serinin karakteri.
   Canlı bir çini karo / piksel. Konuşmaz; yüzü, kolları ve başının
   üstünde yüzen imleç (│ ? ! … ✓ z ♥) ile anlatır.
   Yürümez, kenarı üstünde devrilerek "yuvarlanır".
   Bütün poz ve ifadeler zamanın fonksiyonudur: drawKaro(ctx, state, t).

   state = {
     x, y      : zemin noktası (ayakların bastığı yer)
     s         : gövde kenarı (px)
     mood      : 'neutral' | 'happy' | 'surprised' | 'thinking' | 'proud' | 'worried' | 'sleep'
     look      : bakış yönü, [-1..1] (lx, ly)
     caret     : 'bar' | '?' | '!' | 'dots' | 'ok' | 'z' | 'heart' | 'none'
     armL,armR : kol açısı (radyan; 0 = aşağı, π/2 = yana, π = yukarı)
     roll      : yuvarlanma açısı (radyan) — gövde döner, yüz dik kalır
     squash    : 1 = normal, <1 basık, >1 uzamış
     alpha
   }
   ───────────────────────────────────────────────────────────── */
(function (root) {
  const BF = (root.BF = root.BF || {});
  const { M, P, S } = BF;

  function blinkAt(t, seed) {
    // tohumlu göz kırpma: her ~3.4 sn'de bir, 0.14 sn
    const period = 3.4, off = M.hash(seed, 41) * period;
    const ph = ((t + off) % period) / period;
    const d = 0.14 / period;
    return ph < d ? Math.sin((ph / d) * Math.PI) : 0;
  }

  function drawCaret(ctx, kind, x, y, s, t, alpha) {
    if (!kind || kind === 'none' || alpha <= 0.01) return;
    ctx.save();
    ctx.globalAlpha *= alpha;
    ctx.translate(x, y);
    const c = P.safran;
    ctx.fillStyle = c; ctx.strokeStyle = c; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const bob = Math.sin(t * 2.4) * s * 0.03;
    ctx.translate(0, bob);
    if (kind === 'bar') {
      const on = (t % 1.06) < 0.62 ? 1 : 0.18;
      ctx.globalAlpha *= on;
      S.rrect(ctx, -s * 0.04, -s * 0.18, s * 0.08, s * 0.36, s * 0.04); ctx.fill();
    } else if (kind === '?' || kind === '!') {
      BF.CHECK.mute++;
      BF.T.text(ctx, kind, 0, 0, { size: s * 0.46, fam: 'display', weight: 800, color: c });
      BF.CHECK.mute--;
    } else if (kind === 'dots') {
      for (let i = 0; i < 3; i++) {
        const a = 0.35 + 0.65 * Math.max(0, Math.sin(t * 5 - i * 0.9));
        ctx.globalAlpha = alpha * a;
        ctx.beginPath(); ctx.arc((i - 1) * s * 0.13, 0, s * 0.045, 0, Math.PI * 2); ctx.fill();
      }
    } else if (kind === 'ok') {
      ctx.lineWidth = s * 0.07;
      ctx.beginPath(); ctx.moveTo(-s * 0.13, 0); ctx.lineTo(-s * 0.03, s * 0.1); ctx.lineTo(s * 0.16, -s * 0.13); ctx.stroke();
    } else if (kind === 'z') {
      BF.CHECK.mute++;
      for (let i = 0; i < 2; i++) {
        const ph = ((t * 0.6 + i * 0.5) % 1);
        BF.T.text(ctx, 'z', s * 0.08 * i + ph * s * 0.12, -ph * s * 0.3, { size: s * (0.2 + 0.1 * i), fam: 'display', weight: 800, color: c, alpha: Math.sin(ph * Math.PI) });
      }
      BF.CHECK.mute--;
    } else if (kind === 'heart') {
      const r = s * 0.075;
      ctx.fillStyle = P.lale;
      ctx.beginPath();
      ctx.moveTo(0, r * 1.6);
      ctx.bezierCurveTo(-r * 2.4, 0, -r * 1.2, -r * 1.8, 0, -r * 0.6);
      ctx.bezierCurveTo(r * 1.2, -r * 1.8, r * 2.4, 0, 0, r * 1.6);
      ctx.fill();
    }
    ctx.restore();
  }

  function limb(ctx, x0, y0, ang, len, w, handR) {
    const x1 = x0 + Math.sin(ang) * len, y1 = y0 + Math.cos(ang) * len;
    ctx.lineWidth = w; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
    ctx.beginPath(); ctx.arc(x1, y1, handR, 0, Math.PI * 2); ctx.fill();
  }

  function drawKaro(ctx, st, t) {
    const a = st.alpha == null ? 1 : st.alpha;
    if (a <= 0.001) return;
    const s = st.s || 160;
    const mood = st.mood || 'neutral';
    const look = st.look || [0, 0];
    const roll = st.roll || 0;
    const sq = st.squash || 1;
    const idle = Math.sin(t * 2.2 + (st.seed || 0)) * 0.012; // nefes
    ctx.save();
    ctx.globalAlpha *= a;
    ctx.translate(st.x, st.y);
    if (st.scale) ctx.scale(st.scale, st.scale);

    // yuvarlanma: kare, alt köşesi üstünde devrilir → merkez yükselir
    const ph = ((roll % (Math.PI / 2)) + Math.PI / 2) % (Math.PI / 2);
    const lift = roll ? (s / 2) * (Math.cos(ph) + Math.sin(ph)) - s / 2 : 0;
    const legLen = s * 0.2;
    const cy = -legLen - s / 2 - lift;

    // gölge
    ctx.fillStyle = 'rgba(3,6,20,0.35)';
    ctx.beginPath(); ctx.ellipse(0, 0, s * 0.46 * (1 - lift / s), s * 0.07, 0, 0, Math.PI * 2); ctx.fill();

    // bacaklar (yuvarlanırken toplanır)
    const legIn = roll ? Math.min(1, lift / (s * 0.05) + 0.6) : 0;
    ctx.strokeStyle = P.sir; ctx.fillStyle = P.sir;
    if (legIn < 1) {
      ctx.save(); ctx.globalAlpha *= 1 - legIn;
      const stepA = st.step ? Math.sin(t * 12) * 0.25 : 0;
      limb(ctx, -s * 0.2, -legLen, stepA, legLen * 0.95, s * 0.075, s * 0.06);
      limb(ctx, s * 0.2, -legLen, -stepA, legLen * 0.95, s * 0.075, s * 0.06);
      ctx.restore();
    }

    // gövde
    ctx.save();
    ctx.translate(0, cy);
    ctx.scale(1 / Math.sqrt(sq) + idle, sq - idle);
    // kollar (gövdenin arkasından çıkar)
    const armL = st.armL == null ? 0.25 : st.armL, armR = st.armR == null ? 0.25 : st.armR;
    if (!roll) {
      limb(ctx, -s * 0.44, s * 0.08, -armL, s * 0.34, s * 0.075, s * 0.07);
      limb(ctx, s * 0.44, s * 0.08, armR, s * 0.34, s * 0.075, s * 0.07);
    }
    ctx.save();
    ctx.rotate(roll);
    const h = s / 2;
    ctx.fillStyle = 'rgba(3,6,20,0.3)';
    S.rrect(ctx, -h + s * 0.03, -h + s * 0.05, s, s, s * 0.2); ctx.fill();
    ctx.fillStyle = st.color || P.turkuaz;
    S.rrect(ctx, -h, -h, s, s, s * 0.2); ctx.fill();
    // alt gölge bandı (sır parlaklığı hissi)
    ctx.save();
    S.rrect(ctx, -h, -h, s, s, s * 0.2); ctx.clip();
    ctx.fillStyle = P.turkuazK;
    ctx.fillRect(-h, h - s * 0.2, s, s * 0.2);
    ctx.fillStyle = 'rgba(255,255,255,0.22)';
    ctx.beginPath(); ctx.ellipse(-s * 0.22, -s * 0.3, s * 0.2, s * 0.07, -0.5, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    // çini çerçevesi
    ctx.strokeStyle = P.sir; ctx.lineWidth = s * 0.03;
    S.rrect(ctx, -h + s * 0.08, -h + s * 0.08, s * 0.84, s * 0.84, s * 0.13); ctx.stroke();
    ctx.fillStyle = P.safran;
    for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
      S.star8(ctx, sx * s * 0.34, sy * s * 0.34, s * 0.045); ctx.fill();
    }
    ctx.restore(); // roll

    // YÜZ — her zaman dik
    const lx = M.clamp(look[0], -1, 1), ly = M.clamp(look[1], -1, 1);
    const fx = lx * s * 0.05, fy = ly * s * 0.035;
    const blink = mood === 'sleep' ? 1 : blinkAt(t, st.seed || 1);
    const eyeY = -s * 0.06 + fy;
    let eyeRy = s * 0.14 * (1 - blink * 0.92);
    if (mood === 'surprised') eyeRy *= 1.15;
    if (mood === 'happy' || mood === 'proud') eyeRy *= 0.95;
    for (const side of [-1, 1]) {
      const ex = side * s * 0.19 + fx;
      ctx.fillStyle = P.sir;
      ctx.beginPath(); ctx.ellipse(ex, eyeY, s * 0.11, Math.max(s * 0.012, eyeRy), 0, 0, Math.PI * 2); ctx.fill();
      if (blink < 0.6) {
        ctx.fillStyle = P.murekkep;
        const pr = s * (mood === 'surprised' ? 0.05 : 0.065);
        ctx.beginPath(); ctx.arc(ex + lx * s * 0.04, eyeY + ly * s * 0.05, pr, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = P.sir;
        ctx.beginPath(); ctx.arc(ex + lx * s * 0.04 - pr * 0.35, eyeY + ly * s * 0.05 - pr * 0.4, pr * 0.3, 0, Math.PI * 2); ctx.fill();
      } else {
        // kapalı göz çizgisi
        ctx.strokeStyle = P.murekkep; ctx.lineWidth = s * 0.028; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.arc(ex, eyeY - s * 0.02, s * 0.07, 0.25 * Math.PI, 0.75 * Math.PI); ctx.stroke();
      }
      // kaş
      ctx.strokeStyle = P.murekkep; ctx.lineWidth = s * 0.035; ctx.lineCap = 'round';
      let bt = 0, by = 0;
      if (mood === 'surprised') { by = -s * 0.05; }
      if (mood === 'thinking') { bt = side === -1 ? 0.25 : -0.1; by = side === -1 ? -s * 0.03 : 0; }
      if (mood === 'worried') { bt = side * -0.3; }
      if (mood === 'proud') { bt = side * 0.15; by = -s * 0.01; }
      const bx = ex, byy = eyeY - s * 0.2 + by;
      ctx.beginPath();
      ctx.moveTo(bx - s * 0.07, byy + Math.sin(bt * side) * s * 0.05);
      ctx.lineTo(bx + s * 0.07, byy - Math.sin(bt * side) * s * 0.05);
      ctx.stroke();
    }
    // yanaklar
    if (mood === 'happy' || mood === 'proud') {
      ctx.fillStyle = 'rgba(255,139,176,0.75)';
      for (const side of [-1, 1]) { ctx.beginPath(); ctx.ellipse(side * s * 0.3 + fx, s * 0.12 + fy, s * 0.06, s * 0.035, 0, 0, Math.PI * 2); ctx.fill(); }
    }
    // ağız
    const mx = fx, my = s * 0.2 + fy;
    ctx.strokeStyle = P.murekkep; ctx.fillStyle = P.murekkep; ctx.lineWidth = s * 0.035; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath();
    if (mood === 'happy') { ctx.arc(mx, my - s * 0.05, s * 0.1, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke(); }
    else if (mood === 'proud') {
      ctx.moveTo(mx - s * 0.12, my - s * 0.03); ctx.quadraticCurveTo(mx, my + s * 0.13, mx + s * 0.12, my - s * 0.03); ctx.closePath(); ctx.fill();
      ctx.fillStyle = P.mercan; ctx.beginPath(); ctx.ellipse(mx, my + s * 0.03, s * 0.05, s * 0.025, 0, 0, Math.PI * 2); ctx.fill();
    }
    else if (mood === 'surprised') { ctx.ellipse(mx, my, s * 0.045, s * 0.06, 0, 0, Math.PI * 2); ctx.fill(); }
    else if (mood === 'worried') {
      ctx.moveTo(mx - s * 0.1, my + s * 0.01);
      for (let i = 1; i <= 4; i++) ctx.lineTo(mx - s * 0.1 + i * s * 0.05, my + (i % 2 ? -s * 0.02 : s * 0.01));
      ctx.stroke();
    }
    else if (mood === 'thinking') { ctx.moveTo(mx - s * 0.06, my + s * 0.01); ctx.lineTo(mx + s * 0.07, my - s * 0.02); ctx.stroke(); }
    else if (mood === 'sleep') { ctx.ellipse(mx, my, s * 0.03, s * 0.02, 0, 0, Math.PI * 2); ctx.fill(); }
    else { ctx.moveTo(mx - s * 0.07, my); ctx.quadraticCurveTo(mx, my + s * 0.03, mx + s * 0.07, my); ctx.stroke(); }
    ctx.restore(); // gövde

    // imleç
    drawCaret(ctx, st.caret || 'bar', 0, cy - s * 0.5 - s * 0.32, s, t, st.caretAlpha == null ? 1 : st.caretAlpha);
    ctx.restore();
  }

  // Yuvarlanarak hareket: x değişimi → açı (gövde kenarı kadar yol = 90°)
  function rollFor(x, x0, s) { return ((x - x0) / s) * (Math.PI / 2); }

  BF.drawKaro = drawKaro;
  BF.rollFor = rollFor;
})(typeof window !== 'undefined' ? window : globalThis);
