/* ─────────────────────────────────────────────────────────────
   İkonlar / Icons — çini karonun üstüne boyanmış düz şekiller.
   Hepsi birim kutuda (-0.5..0.5) çizilir; BF.icon(ctx, ad, x, y, s, t).
   Hareketli parçalar (makara, pervane, nabız) t ile döner.
   ───────────────────────────────────────────────────────────── */
(function (root) {
  const BF = (root.BF = root.BF || {});
  const { P, S, M } = BF;
  const TAU = Math.PI * 2;

  const R = (ctx, x, y, w, h, r, c) => { ctx.fillStyle = c; S.rrect(ctx, x, y, w, h, r); ctx.fill(); };
  const C = (ctx, x, y, r, c) => { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); };
  const Ln = (ctx, pts, c, w) => { ctx.strokeStyle = c; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.stroke(); };

  // birim uzayda yazı: tarayıcılar çok küçük punto ile sorun çıkarmasın diye 100× ölçekle
  const iconText = (ctx, str, x, y, size, c) => {
    ctx.save(); ctx.scale(0.01, 0.01);
    BF.CHECK.mute++;
    BF.T.text(ctx, str, x * 100, y * 100, { size: size * 100, fam: 'display', color: c });
    BF.CHECK.mute--;
    ctx.restore();
  };

  const ICONS = {
    phone(ctx, t) {
      R(ctx, -0.22, -0.42, 0.44, 0.84, 0.08, P.murekkep);
      R(ctx, -0.18, -0.34, 0.36, 0.64, 0.03, P.turkuaz);
      // uygulama karoları
      const cs = [P.safran, P.mercan, P.sir, P.kobalt, P.zumrut, P.lale];
      for (let i = 0; i < 6; i++) R(ctx, -0.14 + (i % 2) * 0.16, -0.28 + Math.floor(i / 2) * 0.17, 0.12, 0.12, 0.03, cs[i]);
      R(ctx, -0.06, 0.34, 0.12, 0.03, 0.015, P.sir2);
    },
    tablet(ctx) {
      R(ctx, -0.44, -0.3, 0.88, 0.6, 0.07, P.murekkep);
      R(ctx, -0.38, -0.24, 0.76, 0.48, 0.03, P.kobalt);
      R(ctx, -0.3, -0.16, 0.34, 0.06, 0.03, P.sir);
      R(ctx, -0.3, -0.05, 0.5, 0.04, 0.02, P.turkuazA);
      R(ctx, -0.3, 0.03, 0.42, 0.04, 0.02, P.turkuazA);
      C(ctx, 0.2, 0.1, 0.07, P.safran);
    },
    laptop(ctx) {
      R(ctx, -0.36, -0.36, 0.72, 0.5, 0.05, P.murekkep);
      R(ctx, -0.31, -0.31, 0.62, 0.4, 0.02, P.turkuaz);
      // ekranda yazı satırları
      for (let i = 0; i < 4; i++) R(ctx, -0.25, -0.24 + i * 0.08, 0.3 + (i % 2) * 0.14, 0.035, 0.015, P.sir);
      ctx.fillStyle = P.murekkep;
      ctx.beginPath(); ctx.moveTo(-0.44, 0.2); ctx.lineTo(0.44, 0.2); ctx.lineTo(0.48, 0.3); ctx.lineTo(-0.48, 0.3); ctx.closePath(); ctx.fill();
      R(ctx, -0.08, 0.2, 0.16, 0.03, 0.01, P.sir2);
    },
    typewriter(ctx) {
      // kâğıt
      R(ctx, -0.2, -0.46, 0.4, 0.34, 0.02, '#FFFFFF');
      for (let i = 0; i < 3; i++) R(ctx, -0.14, -0.4 + i * 0.07, 0.26 - i * 0.05, 0.025, 0.01, P.murekkep);
      // silindir
      R(ctx, -0.36, -0.16, 0.72, 0.09, 0.045, P.murekkep);
      C(ctx, -0.4, -0.115, 0.05, P.safran); C(ctx, 0.4, -0.115, 0.05, P.safran);
      // gövde
      ctx.fillStyle = P.mercan;
      ctx.beginPath(); ctx.moveTo(-0.34, -0.07); ctx.lineTo(0.34, -0.07); ctx.lineTo(0.46, 0.34); ctx.lineTo(-0.46, 0.34); ctx.closePath(); ctx.fill();
      // tuşlar
      for (let r = 0; r < 3; r++) for (let i = 0; i < 7 - (r === 2 ? 1 : 0); i++) C(ctx, -0.27 + i * 0.09 + r * 0.03, 0.02 + r * 0.09, 0.03, P.murekkep);
      R(ctx, -0.18, 0.26, 0.36, 0.04, 0.02, P.murekkep);
    },
    tape(ctx, t) {
      // tutacak
      Ln(ctx, [[-0.26, -0.3], [-0.26, -0.4], [0.26, -0.4], [0.26, -0.3]], P.murekkep, 0.05);
      R(ctx, -0.46, -0.3, 0.92, 0.6, 0.07, P.safran);
      // hoparlör
      C(ctx, -0.26, 0.02, 0.15, P.murekkep);
      for (let i = 0; i < 3; i++) C(ctx, -0.26, 0.02, 0.12 - i * 0.04, i % 2 ? P.murekkep : '#2A335A');
      // kaset penceresi
      R(ctx, -0.04, -0.2, 0.44, 0.26, 0.03, P.murekkep);
      for (const cx of [0.08, 0.28]) {
        C(ctx, cx, -0.07, 0.07, P.sir);
        ctx.save(); ctx.translate(cx, -0.07); ctx.rotate(t * 3);
        for (let k = 0; k < 3; k++) { ctx.rotate(TAU / 3); R(ctx, -0.012, -0.06, 0.024, 0.05, 0.01, P.murekkep); }
        ctx.restore();
      }
      // tuşlar
      for (let i = 0; i < 4; i++) R(ctx, -0.02 + i * 0.11, 0.12, 0.08, 0.1, 0.02, i === 1 ? P.mercan : P.murekkep);
    },
    mainframe(ctx, t) {
      // oda büyüklüğünde bilgisayar: dolaplar, makaralar, ışıklar
      for (let k = 0; k < 3; k++) {
        const x = -0.46 + k * 0.315;
        R(ctx, x, -0.44, 0.29, 0.86, 0.03, P.kobalt);
        R(ctx, x + 0.03, -0.4, 0.23, 0.3, 0.02, P.murekkep);
        for (const dy of [-0.32, -0.18]) {
          C(ctx, x + 0.145, dy + 0.0, 0.055, P.sir);
          ctx.save(); ctx.translate(x + 0.145, dy); ctx.rotate(t * (k % 2 ? -2 : 2.5));
          R(ctx, -0.01, -0.05, 0.02, 0.1, 0.01, P.murekkep); ctx.restore();
        }
        // ışık matrisi
        for (let i = 0; i < 4; i++) for (let j = 0; j < 5; j++) {
          const on = M.hash(Math.floor(t * 3) * 97 + k * 31 + i * 7 + j, 23) > 0.5;
          C(ctx, x + 0.05 + i * 0.063, -0.02 + j * 0.075, 0.019, on ? P.safran : '#1A2560');
        }
      }
    },
    cloud(ctx) {
      ctx.fillStyle = P.turkuaz;
      ctx.beginPath();
      ctx.arc(-0.18, 0.04, 0.17, 0, TAU); ctx.arc(0.02, -0.08, 0.22, 0, TAU); ctx.arc(0.22, 0.05, 0.16, 0, TAU);
      ctx.fill();
      R(ctx, -0.34, 0.02, 0.7, 0.2, 0.1, P.turkuaz);
      Ln(ctx, [[-0.08, 0.3], [-0.08, 0.02]], P.murekkep, 0.05);
      Ln(ctx, [[-0.15, 0.09], [-0.08, 0.02], [-0.01, 0.09]], P.murekkep, 0.05);
      Ln(ctx, [[0.1, 0.0], [0.1, 0.28]], P.murekkep, 0.05);
      Ln(ctx, [[0.03, 0.21], [0.1, 0.28], [0.17, 0.21]], P.murekkep, 0.05);
    },
    smartboard(ctx) {
      R(ctx, -0.46, -0.36, 0.92, 0.6, 0.04, P.murekkep);
      R(ctx, -0.41, -0.31, 0.82, 0.5, 0.02, '#FFFFFF');
      // tahtada çizim: sütun grafiği ve el yazısı
      const hs = [0.14, 0.24, 0.1, 0.3];
      hs.forEach((h, i) => R(ctx, -0.33 + i * 0.1, 0.12 - h, 0.07, h, 0.01, [P.kobalt, P.turkuaz, P.mercan, P.safran][i]));
      Ln(ctx, [[0.1, -0.18], [0.18, -0.08], [0.26, -0.2], [0.34, -0.1]], P.mercan, 0.035);
      R(ctx, 0.1, 0.04, 0.24, 0.035, 0.015, P.kobalt);
      Ln(ctx, [[-0.22, 0.24], [-0.3, 0.44]], P.murekkep, 0.045);
      Ln(ctx, [[0.22, 0.24], [0.3, 0.44]], P.murekkep, 0.045);
    },
    busCard(ctx, t) {
      // okuyucu
      R(ctx, 0.02, -0.4, 0.4, 0.8, 0.06, P.murekkep);
      R(ctx, 0.08, -0.32, 0.28, 0.14, 0.02, P.zumrut);
      C(ctx, 0.22, 0.1, 0.1, P.safran);
      // kart ve dalgalar
      ctx.save(); ctx.translate(-0.2, 0.02); ctx.rotate(-0.25);
      R(ctx, -0.2, -0.13, 0.4, 0.26, 0.04, P.mercan);
      R(ctx, -0.14, -0.06, 0.1, 0.08, 0.02, P.safran);
      R(ctx, -0.14, 0.05, 0.24, 0.03, 0.015, P.sir);
      ctx.restore();
      for (let i = 0; i < 3; i++) {
        const a = 0.35 + 0.65 * Math.max(0, Math.sin(t * 4 - i));
        ctx.save(); ctx.globalAlpha *= a; ctx.strokeStyle = P.kobalt; ctx.lineWidth = 0.035; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.arc(-0.02, 0.02, 0.08 + i * 0.06, -0.7, 0.7); ctx.stroke(); ctx.restore();
      }
    },
    navigation(ctx, t) {
      R(ctx, -0.42, -0.38, 0.84, 0.76, 0.06, '#D8EFE9');
      Ln(ctx, [[-0.42, 0.1], [-0.1, 0.05], [0.12, -0.2], [0.42, -0.24]], P.sir, 0.09);
      Ln(ctx, [[-0.2, 0.38], [-0.1, 0.05], [-0.18, -0.38]], P.sir, 0.07);
      // rota
      ctx.save(); ctx.setLineDash([0.04, 0.05]); ctx.lineDashOffset = -t * 0.15;
      Ln(ctx, [[-0.3, 0.3], [-0.1, 0.05], [0.12, -0.2]], P.kobalt, 0.04); ctx.restore();
      // iğne
      ctx.fillStyle = P.mercan;
      ctx.beginPath(); ctx.arc(0.12, -0.3, 0.1, Math.PI, 0); ctx.lineTo(0.12, -0.1); ctx.closePath(); ctx.fill();
      C(ctx, 0.12, -0.3, 0.04, P.sir);
      C(ctx, -0.3, 0.3, 0.05, P.kobalt);
    },
    monitor(ctx, t) {
      R(ctx, -0.44, -0.34, 0.88, 0.58, 0.05, P.murekkep);
      R(ctx, -0.39, -0.29, 0.78, 0.48, 0.02, '#0E2A2A');
      // nabız çizgisi kayar
      ctx.save(); S.rrect(ctx, -0.39, -0.29, 0.78, 0.48, 0.02); ctx.clip();
      const pts = [];
      for (let i = 0; i <= 40; i++) {
        const x = -0.39 + i * 0.0195;
        const ph = ((i / 40) * 1.6 - t * 0.8) % 0.8;
        const p = ((ph % 0.8) + 0.8) % 0.8;
        let y = 0;
        if (p > 0.3 && p < 0.34) y = -0.18; else if (p >= 0.34 && p < 0.38) y = 0.12; else if (p >= 0.26 && p <= 0.3) y = 0.03;
        pts.push([x, y - 0.03]);
      }
      Ln(ctx, pts, P.zumrut, 0.03);
      ctx.restore();
      iconText(ctx, '72', 0.26, -0.2, 0.12, P.zumrut);
      R(ctx, -0.06, 0.24, 0.12, 0.12, 0.01, P.murekkep);
      R(ctx, -0.2, 0.34, 0.4, 0.05, 0.02, P.murekkep);
    },
    mri(ctx) {
      C(ctx, 0.05, -0.05, 0.4, P.kobalt);
      C(ctx, 0.05, -0.05, 0.2, P.murekkep);
      C(ctx, 0.05, -0.05, 0.3, 'rgba(255,255,255,0.12)');
      C(ctx, 0.05, -0.05, 0.2, P.murekkep);
      R(ctx, -0.46, 0.0, 0.66, 0.08, 0.03, P.sir2);
      R(ctx, -0.46, 0.0, 0.66, 0.08, 0.03, P.turkuaz);
      R(ctx, -0.36, 0.08, 0.06, 0.32, 0.02, P.murekkep);
      R(ctx, -0.2, 0.38, 0.52, 0.05, 0.02, P.murekkep);
    },
    greenscreen(ctx) {
      R(ctx, -0.46, -0.42, 0.58, 0.64, 0.03, P.zumrut);
      // oyuncu silüeti
      C(ctx, -0.17, -0.18, 0.07, P.murekkep);
      R(ctx, -0.25, -0.1, 0.16, 0.26, 0.06, P.murekkep);
      // kamera + sehpa
      R(ctx, 0.12, -0.12, 0.26, 0.18, 0.03, P.murekkep);
      ctx.fillStyle = P.murekkep; ctx.beginPath(); ctx.moveTo(0.12, -0.07); ctx.lineTo(0.02, -0.12); ctx.lineTo(0.02, 0.06); ctx.lineTo(0.12, 0.01); ctx.fill();
      C(ctx, 0.19, -0.2, 0.06, P.mercan); C(ctx, 0.32, -0.2, 0.06, P.mercan);
      Ln(ctx, [[0.25, 0.06], [0.14, 0.42]], P.murekkep, 0.035);
      Ln(ctx, [[0.25, 0.06], [0.36, 0.42]], P.murekkep, 0.035);
      Ln(ctx, [[0.25, 0.06], [0.25, 0.42]], P.murekkep, 0.035);
    },
    gamepad(ctx) {
      ctx.fillStyle = P.mor;
      ctx.beginPath();
      ctx.moveTo(-0.3, -0.18); ctx.lineTo(0.3, -0.18);
      ctx.quadraticCurveTo(0.48, -0.16, 0.46, 0.12); ctx.quadraticCurveTo(0.44, 0.3, 0.3, 0.26);
      ctx.lineTo(0.16, 0.12); ctx.lineTo(-0.16, 0.12); ctx.lineTo(-0.3, 0.26);
      ctx.quadraticCurveTo(-0.44, 0.3, -0.46, 0.12); ctx.quadraticCurveTo(-0.48, -0.16, -0.3, -0.18);
      ctx.fill();
      R(ctx, -0.32, -0.05, 0.16, 0.05, 0.01, P.sir); R(ctx, -0.265, -0.105, 0.05, 0.16, 0.01, P.sir);
      C(ctx, 0.24, -0.08, 0.035, P.safran); C(ctx, 0.31, -0.01, 0.035, P.mercan); C(ctx, 0.17, -0.01, 0.035, P.turkuaz); C(ctx, 0.24, 0.06, 0.035, P.zumrut);
    },
    headphones(ctx) {
      ctx.strokeStyle = P.murekkep; ctx.lineWidth = 0.07; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.arc(0, 0.05, 0.32, Math.PI * 1.05, Math.PI * 1.95); ctx.stroke();
      R(ctx, -0.4, -0.02, 0.16, 0.3, 0.07, P.mercan); R(ctx, 0.24, -0.02, 0.16, 0.3, 0.07, P.mercan);
      // nota
      C(ctx, -0.04, 0.2, 0.05, P.kobalt); Ln(ctx, [[0.0, 0.2], [0.0, -0.02], [0.08, 0.02]], P.kobalt, 0.03);
    },
    drone(ctx, t) {
      // gövde ve kollar
      Ln(ctx, [[-0.32, -0.16], [0.32, 0.12]], P.murekkep, 0.045);
      Ln(ctx, [[0.32, -0.16], [-0.32, 0.12]], P.murekkep, 0.045);
      R(ctx, -0.12, -0.1, 0.24, 0.16, 0.05, P.zumrut);
      C(ctx, 0, -0.02, 0.035, P.sir);
      for (const [x, y] of [[-0.32, -0.16], [0.32, -0.16], [-0.32, 0.12], [0.32, 0.12]]) {
        const w = 0.14 * Math.abs(Math.cos(t * 30 + x * 9));
        ctx.fillStyle = 'rgba(11,19,51,0.55)';
        ctx.beginPath(); ctx.ellipse(x, y - 0.04, Math.max(0.03, w), 0.025, 0, 0, TAU); ctx.fill();
        C(ctx, x, y, 0.03, P.murekkep);
      }
      // ilaç damlaları
      for (let i = 0; i < 5; i++) {
        const p = (t * 1.3 + i / 5) % 1;
        C(ctx, -0.08 + (i % 3) * 0.08, 0.12 + p * 0.3, 0.022 * (1 - p * 0.5), P.turkuaz);
      }
    },
    soilSensor(ctx, t) {
      R(ctx, -0.46, 0.14, 0.92, 0.3, 0.04, '#8A5A3C');
      // bitki
      Ln(ctx, [[-0.22, 0.14], [-0.22, -0.12]], P.zumrut, 0.04);
      ctx.fillStyle = P.zumrut;
      ctx.beginPath(); ctx.ellipse(-0.3, -0.12, 0.09, 0.045, -0.5, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.ellipse(-0.14, -0.2, 0.09, 0.045, 0.5, 0, TAU); ctx.fill();
      // sensör çubuğu
      R(ctx, 0.14, -0.2, 0.08, 0.5, 0.02, P.murekkep);
      R(ctx, 0.08, -0.3, 0.2, 0.14, 0.03, P.safran);
      for (let i = 0; i < 3; i++) {
        const a = 0.3 + 0.7 * Math.max(0, Math.sin(t * 4 - i));
        ctx.save(); ctx.globalAlpha *= a; ctx.strokeStyle = P.kobalt; ctx.lineWidth = 0.03; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.arc(0.18, -0.3, 0.08 + i * 0.06, -2.4, -0.7); ctx.stroke(); ctx.restore();
      }
    },
    // kavram ikonları
    info(ctx) {
      // hava durumu balonu: "18°"
      R(ctx, -0.44, -0.36, 0.88, 0.58, 0.14, P.kobalt);
      ctx.fillStyle = P.kobalt; ctx.beginPath(); ctx.moveTo(-0.2, 0.2); ctx.lineTo(-0.3, 0.4); ctx.lineTo(-0.02, 0.2); ctx.fill();
      C(ctx, -0.22, -0.08, 0.12, P.safran);
      for (let i = 0; i < 8; i++) { const a = (i * TAU) / 8; Ln(ctx, [[-0.22 + Math.cos(a) * 0.16, -0.08 + Math.sin(a) * 0.16], [-0.22 + Math.cos(a) * 0.2, -0.08 + Math.sin(a) * 0.2]], P.safran, 0.03); }
      iconText(ctx, '18°', 0.17, -0.07, 0.24, P.sir);
    },
    chat(ctx, t) {
      R(ctx, -0.46, -0.38, 0.6, 0.38, 0.12, P.mercan);
      ctx.fillStyle = P.mercan; ctx.beginPath(); ctx.moveTo(-0.34, -0.02); ctx.lineTo(-0.38, 0.1); ctx.lineTo(-0.22, -0.02); ctx.fill();
      R(ctx, -0.08, 0.0, 0.54, 0.36, 0.12, P.turkuaz);
      ctx.fillStyle = P.turkuaz; ctx.beginPath(); ctx.moveTo(0.3, 0.34); ctx.lineTo(0.36, 0.46); ctx.lineTo(0.18, 0.34); ctx.fill();
      for (let i = 0; i < 3; i++) C(ctx, -0.3 + i * 0.12, -0.19, 0.035, P.sir);
      for (let i = 0; i < 3; i++) { const a = 0.4 + 0.6 * Math.max(0, Math.sin(t * 5 - i)); ctx.save(); ctx.globalAlpha *= a; C(ctx, 0.07 + i * 0.12, 0.18, 0.035, P.murekkep); ctx.restore(); }
    },
    gear(ctx, t) {
      ctx.save(); ctx.rotate(t * 0.8);
      ctx.fillStyle = P.safran;
      for (let i = 0; i < 8; i++) { ctx.save(); ctx.rotate((i * TAU) / 8); R(ctx, -0.06, -0.42, 0.12, 0.14, 0.02, P.safran); ctx.restore(); }
      C(ctx, 0, 0, 0.32, P.safran); C(ctx, 0, 0, 0.12, P.sir);
      ctx.restore();
      // anahtar
      ctx.save(); ctx.translate(0.14, 0.14); ctx.rotate(-0.8);
      R(ctx, -0.035, -0.02, 0.07, 0.34, 0.03, P.murekkep);
      C(ctx, 0, -0.04, 0.08, P.murekkep); R(ctx, -0.025, -0.13, 0.05, 0.08, 0.01, P.sir);
      ctx.restore();
    },
    alarm(ctx, t) {
      const sh = Math.sin(t * 40) * 0.03;
      ctx.save(); ctx.rotate(sh);
      ICONS.phone(ctx, t);
      ctx.restore();
    },
    folder(ctx) {
      R(ctx, -0.42, -0.3, 0.36, 0.16, 0.04, P.safran);
      R(ctx, -0.42, -0.2, 0.84, 0.52, 0.05, P.safran);
    },
  };

  BF.icon = function (ctx, name, x, y, s, t = 0) {
    const f = ICONS[name];
    if (!f) return;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    f(ctx, t);
    ctx.restore();
  };
  BF.ICONS = ICONS;
})(typeof window !== 'undefined' ? window : globalThis);
