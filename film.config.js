/* ─────────────────────────────────────────────────────────────
   FİLM KİMLİĞİ / Film identity — scripts/build.mjs ile scenes/film.js'ten üretilir.
   Süreler altyazı uzunluğundan hesaplanır (okuma hızı: ~10 harf/sn).
   ───────────────────────────────────────────────────────────── */
(function (root) {
  const META = {
    "slug": "yarinin-teknolojileri",
    "title": "Yarının Teknolojileri",
    "titleEn": "Technologies of Tomorrow",
    "grade": 6,
    "theme": "Bilişim Teknolojilerinin Hayatımızdaki Yeri",
    "code": "BTY.6.1.1",
    "outcome": "Yenilikçi bilişim teknolojilerini sınıflandırabilme",
    "outcomeEn": "Classifying innovative information technologies",
    "duration": 132.8,
    "tempo": 1
  };
  const SCENES = [
    {
      "id": "s0",
      "t0": 0,
      "t1": 16.4,
      "name": "",
      "en": "",
      "concept": "",
      "noHeader": true
    },
    {
      "id": "s1",
      "t0": 16.4,
      "t1": 32.4,
      "name": "AR mi, VR mi?",
      "en": "AR or VR?",
      "concept": "",
      "noHeader": false
    },
    {
      "id": "s2",
      "t0": 32.4,
      "t1": 63.2,
      "name": "Yeni kavramlar",
      "en": "New ideas",
      "concept": "",
      "noHeader": false
    },
    {
      "id": "s3",
      "t0": 63.2,
      "t1": 85.7,
      "name": "Hayatı kolaylaştırır",
      "en": "Making life easier",
      "concept": "",
      "noHeader": false
    },
    {
      "id": "s4",
      "t0": 85.7,
      "t1": 115.9,
      "name": "Kullanım alanları",
      "en": "Fields of use",
      "concept": "",
      "noHeader": false
    },
    {
      "id": "s5",
      "t0": 115.9,
      "t1": 132.8,
      "name": "Aklında kalsın",
      "en": "Remember",
      "concept": "",
      "noHeader": false
    }
  ];
  if (typeof module !== 'undefined' && module.exports) module.exports = { META, SCENES };
  else { root.BF = root.BF || {}; root.BF.META = META; root.BF.SCENES = SCENES; }
})(typeof window !== 'undefined' ? window : globalThis);
