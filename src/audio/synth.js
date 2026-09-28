/* ─────────────────────────────────────────────────────────────
   SES / Sound — tamamen kodla üretilen efektler ve hafif fon müziği.
   Ses dosyası yok: her ses, sahnelerdeki olay listesinden (BF.CUES) ve
   tohumlu rastgelelikten hesaplanır. Aynı kod tarayıcıda (oynatıcı) ve
   Node'da (MP4 dışa aktarımı) çalışır; iki yerde de aynı dalga çıkar.

   BF.AUDIO.render(cues, duration, {music}) → { sr, L: Float32Array, R: Float32Array }
   ───────────────────────────────────────────────────────────── */
(function (root) {
  const BF = (root.BF = root.BF || {});

  // Sentezleyici kendi içinde kapalıdır (dış değişken kullanmaz): tarayıcıda
  // arayüz donmasın diye aynı fonksiyon bir Web Worker'da da çalıştırılır.
  function factory() {
  const SR = 44100;
  const TAU = Math.PI * 2;

  function rng(seed) {
    let a = seed | 0;
    return function () {
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const K30 = Math.exp(-30 / SR), K5 = Math.exp(-5 / SR);
  const midi = (n) => 440 * Math.pow(2, (n - 69) / 12);

  // ─── temel ses kaynakları: hepsi (L, R) tamponuna ekler
  function mk(duration) {
    const n = Math.ceil(duration * SR) + SR;
    return { L: new Float32Array(n), R: new Float32Array(n), n };
  }
  function put(b, i, v, pan) {
    if (i < 0 || i >= b.n) return;
    const l = Math.cos((pan + 1) * Math.PI / 4), r = Math.sin((pan + 1) * Math.PI / 4);
    b.L[i] += v * l; b.R[i] += v * r;
  }
  // zarf: attack, sonra üstel sönüm
  const envAD = (x, a, d) => (x < a ? x / a : Math.exp(-(x - a) / d));

  // tonal ses: frekans f0→f1 kayar (üstel), dalga: sine | tri | square | kalimba | bell
  function tone(b, t0, dur, o) {
    const f0 = o.f0, f1 = o.f1 == null ? o.f0 : o.f1;
    const g = o.gain == null ? 0.3 : o.gain, pan = o.pan || 0;
    const a = o.attack == null ? 0.005 : o.attack, d = o.decay == null ? dur / 3 : o.decay;
    const vib = o.vib || 0, vibF = o.vibF || 6;
    const i0 = Math.floor(t0 * SR), N = Math.floor(dur * SR);
    const gl = Math.cos((pan + 1) * Math.PI / 4) * g, gr = Math.sin((pan + 1) * Math.PI / 4) * g;
    const fStep = Math.pow(f1 / f0, 1 / N), dec = Math.exp(-1 / (d * SR)), aN = Math.max(1, a * SR), tailN = 0.012 * SR;
    let ph = 0, ph2 = 0, f = f0, env = 1, k2 = 1;
    for (let k = 0; k < N; k++) {
      const i = i0 + k;
      if (i >= b.n) break;
      const ff = vib ? f * (1 + vib * Math.sin(TAU * vibF * k / SR)) : f;
      ph += TAU * ff / SR;
      let s;
      switch (o.wave) {
        case 'tri': { const q = (ph / TAU) % 1; s = q < 0.5 ? 4 * q - 1 : 3 - 4 * q; break; }
        case 'square': s = Math.sin(ph) > 0 ? 0.6 : -0.6; break;
        case 'kalimba': ph2 += TAU * ff * 3.01 / SR; k2 *= K30; s = Math.sin(ph) + 0.35 * Math.sin(ph2) * k2; break;
        case 'bell': { k2 *= K5; s = Math.sin(ph + 2.2 * k2 * Math.sin(ph * 3.5)); break; }
        default: s = Math.sin(ph);
      }
      let e;
      if (k < aN) e = k / aN; else { env *= dec; e = env; }
      if (N - k < tailN) e *= (N - k) / tailN;
      if (i >= 0) { b.L[i] += s * e * gl; b.R[i] += s * e * gr; }
      f *= fStep;
    }
  }
  // gürültü: tek kutuplu alçak/yüksek geçiren; bant geçiren kayan frekansla
  function noise(b, t0, dur, o) {
    const r = rng(o.seed || 7);
    const g = o.gain == null ? 0.2 : o.gain, pan = o.pan || 0;
    const gl = Math.cos((pan + 1) * Math.PI / 4) * g, gr = Math.sin((pan + 1) * Math.PI / 4) * g;
    const i0 = Math.floor(t0 * SR), N = Math.floor(dur * SR);
    const fa = o.f0 || 800, fb = o.f1 || fa, fStep = Math.pow(fb / fa, 1 / N);
    const aN = Math.max(1, (o.attack || 0.002) * SR), dec = Math.exp(-1 / ((o.decay || dur / 3) * SR));
    let lp = 0, lp2 = 0, fc = fa, env = 1;
    for (let k = 0; k < N; k++) {
      const i = i0 + k;
      if (i >= b.n) break;
      const al = 1 - Math.exp(-TAU * fc / SR);
      lp += al * (r() * 2 - 1 - lp);
      lp2 += al * (lp - lp2);
      const s = o.band ? (lp - lp2) * 3 : lp;
      let e;
      if (o.shape === 'swell') e = Math.sin(Math.PI * k / N);
      else if (k < aN) e = k / aN; else { env *= dec; e = env; }
      if (i >= 0) { b.L[i] += s * e * gl; b.R[i] += s * e * gr; }
      fc *= fStep;
    }
  }

  // ─── efekt kataloğu (t: saniye, o: seçenekler)
  const PENTA = [0, 2, 4, 7, 9];
  const SFX = {
    pop(b, t, o = {}) { // karo belirir
      const p = o.pitch || 1;
      tone(b, t, 0.12, { f0: 520 * p, f1: 1050 * p, gain: 0.22 * (o.gain || 1), decay: 0.05, pan: o.pan || 0 });
      noise(b, t, 0.02, { f0: 4000, gain: 0.05, decay: 0.006, pan: o.pan || 0, seed: 11 });
    },
    ding(b, t, o = {}) { // kavram / eşleşme
      const f = o.f || 1046.5;
      tone(b, t, 1.6, { f0: f, wave: 'bell', gain: 0.16 * (o.gain || 1), decay: 0.45, pan: o.pan || 0 });
      tone(b, t + 0.004, 1.2, { f0: f * 2.005, gain: 0.03, decay: 0.2, pan: -(o.pan || 0) });
    },
    chord(b, t, o = {}) { // büyük an: BİLİŞİM, yeni grup
      const base = o.root || 60;
      [0, 4, 7, 12].forEach((n, i) => tone(b, t + i * 0.06, 2.2, { f0: midi(base + 12 + n), wave: 'bell', gain: 0.1, decay: 0.7, pan: (i - 1.5) * 0.3 }));
    },
    whoosh(b, t, o = {}) { // uçuş, kayma
      noise(b, t, o.dur || 0.45, { f0: o.up === false ? 2600 : 350, f1: o.up === false ? 350 : 2600, band: true, gain: 0.22 * (o.gain || 1), shape: 'swell', pan: o.pan || 0, seed: 23 });
    },
    land(b, t, o = {}) { // karo yerine oturur: tahta "tok"
      const p = o.pitch || 1;
      tone(b, t, 0.16, { f0: 210 * p, f1: 120 * p, gain: 0.32, decay: 0.035, pan: o.pan || 0 });
      tone(b, t, 0.1, { f0: 1400 * p, gain: 0.05, decay: 0.012, pan: o.pan || 0 });
      noise(b, t, 0.025, { f0: 2500, gain: 0.08, decay: 0.006, pan: o.pan || 0, seed: 31 });
    },
    roll(b, t, o = {}) { // Karo kenarına devrilir
      tone(b, t, 0.12, { f0: 150, f1: 95, gain: 0.2, decay: 0.03, pan: o.pan || 0 });
    },
    tiles(b, t) { // sahne geçişi: köşegen karo dalgası
      const r = rng(Math.floor(t * 100));
      for (let i = 0; i < 11; i++) {
        const n = 72 + PENTA[i % 5] + 12 * Math.floor(i / 5);
        tone(b, t - 0.55 + i * 0.085, 0.35, { f0: midi(n), wave: 'kalimba', gain: 0.07, decay: 0.09, pan: (r() - 0.5) * 1.4 });
      }
      noise(b, t - 0.6, 1.1, { f0: 600, f1: 3000, band: true, gain: 0.05, shape: 'swell', seed: 41 });
    },
    alarm(b, t, o = {}) { // telefon alarmı
      const dur = o.dur || 2;
      for (let s = 0; s < dur; s += 0.6)
        for (let k = 0; k < 8; k++) tone(b, t + s + k * 0.05, 0.05, { f0: k % 2 ? 1568 : 1319, wave: 'square', gain: 0.045, attack: 0.002, decay: 0.2, pan: 0.35 });
    },
    no(b, t, o = {}) { // olmadı: yumuşak "bıı-bıı"
      for (let k = 0; k < 2; k++) tone(b, t + k * 0.13, 0.1, { f0: 196, f1: 185, wave: 'tri', gain: 0.16, decay: 0.08, pan: o.pan || 0 });
    },
    sparkle(b, t) { // ✓ tamam
      [88, 91, 95].forEach((n, i) => tone(b, t + i * 0.07, 0.6, { f0: midi(n), wave: 'bell', gain: 0.05, decay: 0.15, pan: (i - 1) * 0.5 }));
    },
    // ─── Karo'nun sözsüz "sesi": kısa, tatlı ciyaklamalar
    karo(b, t, o = {}) {
      const pan = o.pan || 0, v = { wave: 'tri', vib: 0.02, vibF: 11, pan };
      const say = (dt, d, f0, f1, g = 0.13) => tone(b, t + dt, d, Object.assign({ f0, f1, gain: g, attack: 0.012, decay: d * 0.7 }, v));
      switch (o.mood) {
        case 'happy': say(0, 0.09, 620, 880); say(0.11, 0.13, 900, 1180); break;
        case 'surprised': say(0, 0.2, 480, 1400, 0.14); break;
        case 'question': say(0, 0.14, 700, 640); say(0.16, 0.2, 640, 980); break;
        case 'worried': say(0, 0.3, 820, 480, 0.12); break;
        case 'proud': say(0, 0.08, midi(76), midi(76)); say(0.09, 0.08, midi(79), midi(79)); say(0.18, 0.2, midi(84), midi(86)); break;
        case 'yawn': say(0, 0.5, 520, 300, 0.07); break;
        case 'heart': say(0, 0.12, 700, 1050); say(0.14, 0.26, 1050, 820, 0.1); break;
        case 'snore': noise(b, t, 0.7, { f0: 300, gain: 0.07, shape: 'swell', pan, seed: 51 }); break;
      }
    },
  };

  // ─── fon müziği: sakin kalimba arpejleri + yumuşak bas + ped
  // I–vi–IV–V (Do majör), 84 vuruş/dk; hikâyenin sonunda tonikte çözülür.
  function music(b, duration, o = {}) {
    const bpm = 84, beat = 60 / bpm, bar = beat * 4;
    const prog = [[60, 64, 67, 71], [57, 60, 64, 67], [53, 57, 60, 64], [55, 59, 62, 65]];
    const r = rng(1234);
    const G = o.gain == null ? 1 : o.gain;
    const bars = Math.ceil(duration / bar);
    for (let m = 0; m < bars; m++) {
      const t0 = m * bar;
      const last = t0 + bar > duration - 3;
      const ch = last ? prog[0] : prog[m % 4];
      // ped (üçgen, yavaş kabarma)
      ch.slice(0, 3).forEach((n, i) => tone(b, t0, bar + 0.3, { f0: midi(n), wave: 'tri', gain: 0.018 * G, attack: 0.8, decay: 3, pan: (i - 1) * 0.5 }));
      // bas
      tone(b, t0, beat * 2.5, { f0: midi(ch[0] - 24), gain: 0.07 * G, attack: 0.02, decay: 0.7 });
      tone(b, t0 + beat * 2, beat * 1.8, { f0: midi(ch[0] - 24 + (m % 2 ? 7 : 0)), gain: 0.045 * G, attack: 0.02, decay: 0.5 });
      // arpej: sekizlikler, arada boşluk bırakarak
      const pat = [0, 1, 2, 3, 2, 1, 2, 3];
      for (let e = 0; e < 8; e++) {
        if (r() < 0.22 && e % 2) continue;
        const n = ch[pat[e]] + 12 + (r() < 0.15 ? 12 : 0);
        tone(b, t0 + e * beat / 2 + (r() - 0.5) * 0.008, 1.2, { f0: midi(n), wave: 'kalimba', gain: 0.045 * G, decay: 0.28, pan: (r() - 0.5) * 0.9 });
      }
      if (last) break;
    }
  }

  // basit yankı (müzik veriyolu için): iki geri beslemeli gecikme
  function echo(b, sec, fb, mix) {
    const d = Math.floor(sec * SR);
    for (const ch of [b.L, b.R]) for (let i = d; i < b.n; i++) ch[i] += ch[i - d] * fb * mix;
  }

  const MUS = 2.3, FX = 2.0; // karışım: müzik geride, efektler önde (≈ −19 LUFS)
  function render(cues, duration, opts = {}) {
    const mus = mk(duration), fx = mk(duration);
    if (opts.music !== false) { music(mus, duration, { gain: 1 }); echo(mus, 0.36, 0.35, 1); }
    if (opts.fx !== false) for (const c of cues) { const f = SFX[c.sfx]; if (f) f(fx, c.t, c); }
    echo(fx, 0.11, 0.18, 1);
    const n = Math.ceil(duration * SR);
    const L = new Float32Array(n), R = new Float32Array(n);
    const fadeIn = 1.5 * SR, fadeOut = 3.5 * SR;
    for (let i = 0; i < n; i++) {
      const g = Math.min(1, i / fadeIn, (n - i) / fadeOut);
      // müzik biraz geri planda; efektler önde. tanh ile yumuşak sınırlama
      const gf = Math.min(1, (n - i) / (0.3 * SR));
      L[i] = Math.tanh(mus.L[i] * g * MUS + fx.L[i] * gf * FX) * 0.92;
      R[i] = Math.tanh(mus.R[i] * g * MUS + fx.R[i] * gf * FX) * 0.92;
    }
    return { sr: SR, L, R };
  }

  function wav(L, R, sr = SR) { // 16 bit PCM stereo
    const n = L.length, buf = new ArrayBuffer(44 + n * 4), v = new DataView(buf);
    const s = (o, str) => { for (let i = 0; i < str.length; i++) v.setUint8(o + i, str.charCodeAt(i)); };
    s(0, 'RIFF'); v.setUint32(4, 36 + n * 4, true); s(8, 'WAVE'); s(12, 'fmt ');
    v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 2, true); v.setUint32(24, sr, true);
    v.setUint32(28, sr * 4, true); v.setUint16(32, 4, true); v.setUint16(34, 16, true); s(36, 'data'); v.setUint32(40, n * 4, true);
    for (let i = 0, o = 44; i < n; i++, o += 4) {
      v.setInt16(o, Math.max(-1, Math.min(1, L[i])) * 32767, true);
      v.setInt16(o + 2, Math.max(-1, Math.min(1, R[i])) * 32767, true);
    }
    return buf;
  }

  return { SR, render, wav, SFX, midi };
  } // factory

  const A = factory();
  // Film için: sahne olayları (hikâye zamanı) → film zamanı + sahne geçişleri
  A.filmCues = function () {
    const out = [];
    const tempo = BF.META.tempo || 1;
    for (const sc of BF.SCENES) {
      const list = (BF.CUES && BF.CUES[sc.id]) || [];
      for (const c of list) out.push(Object.assign({}, c, { t: sc.t0 + c.at * tempo }));
    }
    BF.SCENES.slice(1).forEach((sc) => out.push({ sfx: 'tiles', t: sc.t0 }));
    return out.sort((a, b) => a.t - b.t);
  }


  // Tarayıcıda: Worker'da üret (olmazsa aynı iş parçacığında)
  A.renderAsync = function (cues, duration, opts = {}) {
    return new Promise((resolve) => {
      const sync = () => resolve(A.render(cues, duration, opts));
      try {
        const src = `const A=(${factory})();onmessage=(e)=>{const r=A.render(e.data.cues,e.data.duration,e.data.opts);postMessage(r,[r.L.buffer,r.R.buffer]);};`;
        const url = URL.createObjectURL(new Blob([src], { type: 'text/javascript' }));
        const w = new Worker(url);
        w.onmessage = (e) => { resolve(e.data); w.terminate(); URL.revokeObjectURL(url); };
        w.onerror = (e) => { e.preventDefault && e.preventDefault(); w.terminate(); sync(); };
        w.postMessage({ cues, duration, opts });
      } catch (err) { sync(); }
    });
  };

  BF.AUDIO = A;
})(typeof window !== 'undefined' ? window : globalThis);
