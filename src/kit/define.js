/* ─────────────────────────────────────────────────────────────
   BF.defineFilm(spec) — senaryoyu çalışan filme bağlar.
   spec = { meta:{slug,title,titleEn,grade,code,outcome,…}, scenes:[{type,…,beats:[…]}] }
   • Sahne sürelerini altyazılardan hesaplar (BF.timeFilm)
   • BF.META / BF.SCENES / BF.CAPTIONS yoksa doldurur (film.config.js ve
     captions.js varsa onlar geçerlidir: öğretmen altyazı metnini orada düzeltebilir)
   • BF.scenes[id] çizim fonksiyonlarını ve BF.CUES ses olaylarını kurar
   ───────────────────────────────────────────────────────────── */
(function (root) {
  const BF = (root.BF = root.BF || {});
  BF.defineFilm = function (spec) {
    spec.scenes.forEach((sc) => { if (sc.type === 'summary' && !sc.name) { sc.name = 'Aklında kalsın'; sc.en = 'Remember'; } });
    BF.timeFilm(spec);
    BF.FILM = spec;
    if (!BF.META || BF.META.slug !== spec.meta.slug) BF.META = Object.assign({ tempo: 1, duration: spec.duration }, spec.meta, { duration: spec.duration, tempo: 1 });
    if (!BF.SCENES || BF.SCENES.length !== spec.scenes.length) BF.SCENES = spec.scenes.map((sc) => ({ id: sc.id, t0: sc.t0, t1: sc.t1, name: sc.name || '', en: sc.en || '', concept: sc.concept || '', noHeader: sc.type === 'intro' }));
    if (!BF.CAPTIONS) BF.CAPTIONS = BF.captionsOf(spec);
    BF.scenes = {};
    BF.CUES = {};
    spec.scenes.forEach((sc) => {
      if (sc.type === 'summary' && !sc.name) { sc.name = 'Aklında kalsın'; sc.en = 'Remember'; }
      const tpl = BF.TPL[sc.type];
      if (!tpl) throw new Error('Bilinmeyen sahne şablonu: ' + sc.type);
      BF.scenes[sc.id] = (ctx, L, lt, t) => tpl.draw(ctx, L, lt, t, sc);
      BF.CUES[sc.id] = (tpl.cues ? tpl.cues(sc) : []).concat(sc.cues || []);
    });
    return spec;
  };
})(typeof window !== 'undefined' ? window : globalThis);
