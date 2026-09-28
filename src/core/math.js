/* ─────────────────────────────────────────────────────────────
   Zaman matematiği / Time maths
   Her kare renderFrame(t) ile çizilir: her şey t'nin saf fonksiyonu.
   Rastgelelik tohumludur (seeded) — aynı t, aynı kare.
   ───────────────────────────────────────────────────────────── */
(function (root) {
  const BF = (root.BF = root.BF || {});

  const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
  const lerp = (a, b, t) => a + (b - a) * t;
  const seg = (t, a, b) => clamp((t - a) / (b - a));

  const E = {
    linear: (x) => x,
    in: (x) => x * x * x,
    out: (x) => 1 - Math.pow(1 - x, 3),
    inOut: (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2),
    sine: (x) => -(Math.cos(Math.PI * x) - 1) / 2,
    back: (x) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); },
    elastic: (x) => (x === 0 || x === 1 ? x : Math.pow(2, -10 * x) * Math.sin((x * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1),
  };

  // görünürlük penceresi: a'da belirir, b'de kaybolur
  const win = (t, a, b, d = 0.35) => Math.min(E.out(seg(t, a, a + d)), 1 - E.in(seg(t, b - d, b)));
  // yaylanarak büyüme (0 → 1, hafif taşma)
  const pop = (t, a, d = 0.45) => (t <= a ? 0 : E.back(seg(t, a, a + d)));
  // a..b arasında yumuşak geçiş
  const go = (t, a, b, ease = E.inOut) => ease(seg(t, a, b));

  // anahtar kare izi: keys = [{t, x, y, ...}], sayılar yumuşak geçer, diğerleri basamaklı
  function track(keys, t) {
    if (t <= keys[0].t) return Object.assign({}, keys[0]);
    for (let i = 0; i < keys.length - 1; i++) {
      const a = keys[i], b = keys[i + 1];
      if (t < b.t) {
        const k = (b.ease || E.inOut)(seg(t, a.t, b.t));
        const o = {};
        for (const key in a) o[key] = typeof a[key] === 'number' && typeof b[key] === 'number' ? lerp(a[key], b[key], k) : a[key];
        for (const key in b) if (!(key in o)) o[key] = b[key];
        o._k = k; o._a = a; o._b = b;
        return o;
      }
    }
    return Object.assign({}, keys[keys.length - 1]);
  }

  // tohumlu rastgele / seeded random
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  // tek sayıdan tekrar edilebilir değer
  const hash = (i, seed = 7) => mulberry32((i * 2654435761) ^ (seed * 97531))();

  BF.M = { clamp, lerp, seg, E, win, pop, go, track, mulberry32, hash };
})(typeof window !== 'undefined' ? window : globalThis);
