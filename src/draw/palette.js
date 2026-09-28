/* ─────────────────────────────────────────────────────────────
   RENK TOKENLARI / Colour tokens — "Çini-piksel" paleti
   Lacivert bir zemin üstünde İznik çinisinin renkleri:
   kobalt, turkuaz, mercan kırmızısı, safran, zümrüt ve sır beyazı.
   Piksel = karo: bilişimin en küçük parçası ile çininin en küçük parçası.
   ───────────────────────────────────────────────────────────── */
(function (root) {
  const BF = (root.BF = root.BF || {});
  BF.P = {
    gece: '#131E45',      // zemin / background
    gece2: '#1C2A5C',     // panel
    derz: '#27397A',      // karo aralığı / grout lines
    murekkep: '#0B1333',  // koyu çizgi / dark ink on tiles
    sir: '#FFF4E0',       // sır beyazı / glaze white (text, tile ground)
    sir2: '#F3E4C8',      // gölgeli sır / shaded glaze
    kobalt: '#2748C2',
    turkuaz: '#1FC2B2',
    turkuazK: '#12978B',  // koyu turkuaz
    turkuazA: '#9BE9DF',  // açık turkuaz (EN altyazı)
    mercan: '#FF5A45',
    safran: '#FFBC3A',
    zumrut: '#2DB36E',
    lale: '#FF8BB0', kehribar: '#F28A1A',
    mor: '#8D6BFF',
  };
  // Alanlara göre renkler (sınıflandırma sahnelerinde tutarlı kullanılır)
  BF.P.alan = {
    egitim: BF.P.kobalt, saglik: BF.P.mercan, ulasim: BF.P.safran, eglence: BF.P.mor, tarim: BF.P.zumrut, iletisim: BF.P.turkuaz,
  };
})(typeof window !== 'undefined' ? window : globalThis);
