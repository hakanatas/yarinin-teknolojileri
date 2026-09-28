/* ─────────────────────────────────────────────────────────────
   Oynatıcı / Player — oynat, sar, sahne, hız, biçim, altyazı.
   ?render=1&format=vertical&captions=tr&scale=0.6667 → dışa aktarım modu
   ?check=1 → yazı kontrolü açık (window.__BF.check(t))
   ───────────────────────────────────────────────────────────── */
(function () {
  const BF = window.BF;
  const q = new URLSearchParams(location.search);
  const RENDER = q.get('render') === '1';
  const DUR = BF.META.duration;
  const canvas = document.getElementById('film');
  const ctx = canvas.getContext('2d');

  const state = {
    t: +(q.get('t') || 0), playing: false, speed: 1,
    format: q.get('format') || q.get('bicim') || 'horizontal',
    captions: q.get('captions') || q.get('altyazi') || 'tr',
    scale: +(q.get('scale') || (RENDER ? 1 : 1)),
  };
  if (!['horizontal', 'vertical'].includes(state.format)) state.format = 'horizontal';
  if (!['off', 'tr', 'en', 'bi'].includes(state.captions)) state.captions = 'tr';
  BF.CHECK.on = q.get('check') === '1';

  function size() {
    const L = BF.layout(state.format);
    const sc = RENDER ? state.scale : Math.min(1, (window.devicePixelRatio || 1) * 0.75);
    const w = Math.round(L.W * sc), h = Math.round(L.H * sc);
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
    state._sc = sc;
    document.body.dataset.format = state.format;
    if (!RENDER) fit();
  }
  // tuvali sahne alanına oranını bozmadan sığdır
  function fit() {
    const st = document.getElementById('stage'), fr = document.getElementById('frame');
    if (!st || !fr) return;
    const r = st.getBoundingClientRect(), L = BF.layout(state.format);
    const k = Math.min(r.width / L.W, r.height / L.H);
    fr.style.width = Math.floor(L.W * k) + 'px'; fr.style.height = Math.floor(L.H * k) + 'px';
  }
  window.addEventListener('resize', fit);

  function draw() {
    size();
    return BF.renderFrame(ctx, state.t, { format: state.format, captions: state.captions, scale: state._sc });
  }

  // dışa aktarım / kontrol arayüzü
  window.__BF = {
    renderAt(t) { state.t = t; return draw(); },
    set(o) { Object.assign(state, o); draw(); },
    check(t, minPx) {
      state.t = t;
      const r = draw();
      if (r.inTransition) return [];
      return BF.checkFrame(r.L, state._sc, minPx || 17);
    },
    duration: DUR,
  };

  BF.loadFonts().then(() => {
    draw();
    document.body.dataset.ready = '1';
    const ld = document.getElementById('loading'); if (ld) ld.remove();
  });
  if (RENDER) { document.body.classList.add('render'); return; }

  // ─── etkileşimli oynatıcı
  const $ = (id) => document.getElementById(id);

  // ─── ses: efektler + fon müziği, kodla üretilir (src/audio/synth.js)
  const audio = { ctx: null, buf: null, src: null, on: q.get('ses') !== '0', loading: null, t0: 0, c0: 0 };
  // ses izi sayfa açılınca arka planda (Worker) hazırlanır; oynatınca hazır olur
  function audioPrepare() {
    if (!audio.raw && BF.AUDIO) audio.raw = BF.AUDIO.renderAsync(BF.AUDIO.filmCues(), DUR);
    return audio.raw;
  }
  function audioEnsure() {
    if (audio.buf || !BF.AUDIO || !audio.ctx) return Promise.resolve();
    if (!audio.loading) {
      $('sndInfo').textContent = 'ses hazırlanıyor…';
      audio.loading = audioPrepare().then((r) => {
        const b = audio.ctx.createBuffer(2, r.L.length, r.sr);
        b.copyToChannel(r.L, 0); b.copyToChannel(r.R, 1);
        audio.buf = b; $('sndInfo').textContent = '';
      });
    }
    return audio.loading;
  }
  if (audio.on) setTimeout(audioPrepare, 300);
  function audioStop() { if (audio.src) { try { audio.src.stop(); } catch (e) {} audio.src = null; } }
  function audioStart() {
    audioStop();
    if (!audio.on || !state.playing || !audio.buf || !audio.ctx) return;
    const s = audio.ctx.createBufferSource();
    s.buffer = audio.buf; s.playbackRate.value = state.speed;
    s.connect(audio.ctx.destination);
    s.start(0, Math.min(state.t, DUR - 0.01));
    audio.src = s; audio.t0 = state.t; audio.c0 = audio.ctx.currentTime;
  }
  function audioUnlock() { // kullanıcı tıklamasıyla açılmalı
    if (!audio.ctx) { const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return; audio.ctx = new AC(); }
    if (audio.ctx.state === 'suspended') audio.ctx.resume();
  }
  const resync = () => { if (state.playing) audioStart(); };
  const fmt = (t) => { const m = Math.floor(t / 60), s = t - m * 60; return `${String(m).padStart(2, '0')}:${s.toFixed(2).padStart(5, '0')}`; };

  function seg(el, items, get, set) {
    el.innerHTML = '';
    items.forEach(([val, label]) => {
      const b = document.createElement('button');
      b.textContent = label; b.dataset.v = val;
      b.onclick = () => { set(val); refresh(); };
      el.appendChild(b);
    });
    el._get = get;
  }
  function refresh() {
    for (const el of document.querySelectorAll('.seg')) for (const b of el.children) b.classList.toggle('on', String(el._get()) === b.dataset.v);
    const i = BF.activeScene(state.t);
    $('sceneName').textContent = `${i + 1} · ${BF.SCENES[i].name}`;
    $('sceneConcept').textContent = BF.SCENES[i].concept;
    $('tc').textContent = fmt(state.t);
    const p = state.t / DUR;
    $('fill').style.width = p * 100 + '%';
    $('head').style.left = p * 100 + '%';
    document.body.classList.toggle('playing', state.playing);
    const u = new URL(location.href);
    u.searchParams.set('bicim', state.format === 'vertical' ? 'vertical' : 'horizontal');
    u.searchParams.set('altyazi', state.captions);
    if (!audio.on) u.searchParams.set('ses', '0'); else u.searchParams.delete('ses');
    history.replaceState(null, '', u);
  }

  seg($('scenes'), BF.SCENES.map((s, i) => [String(i), String(i + 1)]), () => String(BF.activeScene(state.t)), (v) => { state.t = BF.SCENES[+v].t0 + (v === '0' ? 0 : 0.7); draw(); resync(); });
  $('scenes').querySelectorAll('button').forEach((b, i) => (b.title = BF.SCENES[i].name));
  seg($('speeds'), [['0.5', '½×'], ['1', '1×'], ['1.5', '1½×']], () => String(state.speed), (v) => { state.speed = +v; resync(); });
  seg($('sound'), [['1', 'Açık'], ['0', 'Kapalı']], () => (audio.on ? '1' : '0'), (v) => { audio.on = v === '1'; if (audio.on && state.playing) { audioUnlock(); audioEnsure().then(resync); } else audioStop(); });
  $('dur').textContent = '/ ' + fmt(DUR);
  seg($('formats'), [['horizontal', '16:9'], ['vertical', '9:16']], () => state.format, (v) => { state.format = v; draw(); });
  seg($('caps'), [['off', 'Kapalı'], ['tr', 'TR'], ['en', 'EN'], ['bi', 'TR+EN']], () => state.captions, (v) => { state.captions = v; draw(); });

  const markers = $('markers');
  BF.SCENES.forEach((s) => { const m = document.createElement('i'); m.style.left = (s.t0 / DUR) * 100 + '%'; markers.appendChild(m); });

  let last = null;
  function loop(now) {
    if (state.playing) {
      if (audio.src) state.t = audio.t0 + (audio.ctx.currentTime - audio.c0) * state.speed; // ses saatiyle eşzamanlı
      else if (last != null) state.t += ((now - last) / 1000) * state.speed;
      if (state.t >= DUR) { state.t = DUR; state.playing = false; audioStop(); }
      draw(); refresh();
    }
    last = now;
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  const toggle = () => {
    if (state.t >= DUR) state.t = 0;
    state.playing = !state.playing;
    if (state.playing) { audioUnlock(); if (audio.on && audio.ctx) audioEnsure().then(resync); } else audioStop();
    refresh();
  };
  $('play').onclick = toggle;
  $('restart').onclick = () => { state.t = 0; draw(); refresh(); resync(); };
  const scrub = $('scrub');
  const seek = (e) => { const r = scrub.getBoundingClientRect(); state.t = Math.max(0, Math.min(DUR, ((e.clientX - r.left) / r.width) * DUR)); draw(); refresh(); };
  scrub.addEventListener('pointerdown', (e) => { scrub.setPointerCapture(e.pointerId); seek(e); scrub.onpointermove = seek; });
  scrub.addEventListener('pointerup', () => { scrub.onpointermove = null; resync(); });
  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space') { e.preventDefault(); toggle(); }
    else if (e.code === 'ArrowRight') { state.t = Math.min(DUR, state.t + 3); draw(); refresh(); resync(); }
    else if (e.code === 'ArrowLeft') { state.t = Math.max(0, state.t - 3); draw(); refresh(); resync(); }
    else if (e.code === 'Home') { state.t = 0; draw(); refresh(); resync(); }
  });

  // indirmeler
  const ts = (s) => { const ms = Math.round(s * 1000); const p = (n, k = 2) => String(n).padStart(k, '0'); return `${p(Math.floor(ms / 3600000))}:${p(Math.floor(ms / 60000) % 60)}:${p(Math.floor(ms / 1000) % 60)},${p(ms % 1000, 3)}`; };
  const dl = (name, blob) => { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); };
  $('srt').onclick = () => {
    const mode = state.captions === 'off' ? 'bi' : state.captions;
    const txt = BF.CAPTIONS.map((c, i) => `${i + 1}\n${ts(c.start)} --> ${ts(c.end)}\n${mode === 'tr' ? c.tr : mode === 'en' ? c.en : c.tr + '\n' + c.en}\n`).join('\n');
    dl(`${BF.META.slug}_${mode === 'bi' ? 'tr-en' : mode}.srt`, new Blob([txt], { type: 'text/plain' }));
  };
  $('png').onclick = () => canvas.toBlob((b) => dl(`${BF.META.slug}_${state.t.toFixed(2)}s.png`, b));

  refresh();
})();
