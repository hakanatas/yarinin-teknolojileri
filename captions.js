/* ─────────────────────────────────────────────────────────────
   ALTYAZILAR / CAPTIONS — düzenlenebilir (metin). Zamanlar film saniyesidir.
   note: öğretmen için önerilen seslendirme cümlesi.
   Senaryo değişirse: node scripts/build.mjs (zamanlar yeniden hesaplanır).
   ───────────────────────────────────────────────────────────── */
(function (root) {
  const CAPTIONS = [
    { scene: 1, start: 0.9, end: 8.5, tr: "Boyadığım dinozor tabletin ekranında canlandı!", en: "The dinosaur I coloured came alive on the tablet!",
      note: "Karo bir boyama sayfasını boyadı. Tableti sayfaya tutunca dinozor ekranda canlandı ve yürümeye başladı!" },
    { scene: 1, start: 9.3, end: 15, tr: "Bu hangi teknoloji?", en: "Which technology is this?",
      note: "Bu, yenilikçi bilişim teknolojilerinden biri. Gel, yarının teknolojilerini tanıyalım." },
    { scene: 2, start: 17.9, end: 24.6, tr: "AR gerçek dünyaya sanal nesne ekler", en: "AR adds virtual objects to the real world",
      note: "Artırılmış gerçeklikte, yani AR'da, gerçek dünyayı görmeye devam ederiz. Ekranda üstüne sanal bir dinozor eklenir." },
    { scene: 2, start: 25.4, end: 31.1, tr: "VR bizi bambaşka bir dünyaya götürür", en: "VR takes us into a whole new world",
      note: "Sanal gerçeklikte, yani VR'da, gözlüğü takınca gerçek dünya kapanır; kendimizi uzayda ya da bir müzede buluruz." },
    { scene: 3, start: 33.9, end: 39.8, tr: "Giyilebilir: akıllı saat, akıllı gözlük", en: "Wearables: smart watches and glasses",
      note: "Giyilebilir teknolojiler üzerimizde taşıdığımız akıllı cihazlardır: akıllı saat, akıllı gözlük gibi." },
    { scene: 3, start: 40.5, end: 46.2, tr: "Bulut: dosyalar internette saklanır", en: "Cloud: files are kept online",
      note: "Bulut depolamada dosyalarımız internetteki sunucularda saklanır. Onlara her cihazdan ulaşabiliriz." },
    { scene: 3, start: 47, end: 53.8, tr: "Nesnelerin interneti: eşyalar birbirine bağlanır", en: "Internet of Things: objects talk to each other",
      note: "Nesnelerin internetinde ampul, buzdolabı, saksı gibi eşyalar internete bağlanır ve bilgi paylaşır." },
    { scene: 3, start: 54.6, end: 61.8, tr: "Yapay zekâ, 3B yazıcı ve dron da yenilikçi", en: "AI, 3D printers and drones are innovative too",
      note: "Yapay zekâ, üç boyutlu yazıcılar ve dronlar da yenilikçi bilişim teknolojileridir." },
    { scene: 4, start: 64.6, end: 70.3, tr: "Akıllı saat hareket etmeni hatırlatır", en: "A smart watch reminds you to move",
      note: "Akıllı saat adımlarımızı sayar ve uzun süre oturduğumuzda hareket etmemizi hatırlatır." },
    { scene: 4, start: 71.1, end: 76.8, tr: "Bulut ile dosyalar her yerde", en: "With the cloud, files are everywhere",
      note: "Ödevimizi buluta kaydedersek ona okuldan da evden de ulaşabiliriz." },
    { scene: 4, start: 77.6, end: 84.3, tr: "Akıllı ev enerji tasarrufu sağlar", en: "A smart home saves energy",
      note: "Akıllı evde unuttuğumuz ışıkları telefondan kapatabiliriz. Hem kolaylık hem tasarruf!" },
    { scene: 5, start: 87.1, end: 93, tr: "Bu teknolojiler nerelerde kullanılıyor?", en: "Where are these technologies used?",
      note: "Yenilikçi teknolojileri kullanıldıkları alanlara göre gruplayalım." },
    { scene: 5, start: 93.8, end: 99.5, tr: "Sağlıkta ve eğitimde", en: "In health and in education",
      note: "Sağlıkta yapay zekâ doktorlara görüntüleri incelemede yardım eder, akıllı saat nabzı ölçer. Eğitimde AR ile gezegenleri inceleriz." },
    { scene: 5, start: 100.3, end: 106, tr: "Müzede VR, tarlada sensör ve dron", en: "VR in museums; sensors and drones on farms",
      note: "VR ile müzeleri gezebiliriz. Tarımda toprak nem sensörleri ve dronlar çiftçiye yardım eder." },
    { scene: 5, start: 106.8, end: 114.5, tr: "Ulaşımda akıllı kart ve yol bulma", en: "Smart cards and route finding in transport",
      note: "Ulaşımda akıllı kartlar ve trafiğe göre en kısa yolu bulan uygulamalar kullanılır." },
    { scene: 6, start: 117.3, end: 125, tr: "Aklında kalsın: yenilikçi teknoloji hayatı kolaylaştırır", en: "Remember: innovative tech makes life easier",
      note: "Aklında kalsın: yenilikçi bilişim teknolojileri pek çok alanda hayatımızı kolaylaştırır." },
    { scene: 6, start: 125.8, end: 131.5, tr: "Yarının teknolojisi bugün başlıyor!", en: "Tomorrow's technology starts today!",
      note: "Belki yarının teknolojisini sen geliştireceksin!" },
  ];
  if (typeof module !== 'undefined' && module.exports) module.exports = CAPTIONS;
  else { root.BF = root.BF || {}; root.BF.CAPTIONS = CAPTIONS; }
})(typeof window !== 'undefined' ? window : globalThis);
