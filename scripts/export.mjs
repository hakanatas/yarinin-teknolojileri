// ─────────────────────────────────────────────────────────────
// Kare kare MP4 dışa aktarımı / Deterministic frame-by-frame MP4 export
//
//   npm run export -- --format=horizontal --captions=tr --height=720
//
//   --format=horizontal|vertical|both   (varsayılan both)
//   --captions=off|tr|en|bi             yakılmış altyazı (varsayılan tr)
//   --height=720                        kısa kenar (720 → 1280×720 / 720×1280)
//   --fps=30 --crf=19 --preset=slow
//   --workers=3                         paralel sayfa
//   --out=out
//   --no-audio                          sessiz MP4 (varsayılan: efekt + fon müziği)
//
// Her kare renderFrame(t) ile t = kare / fps anında çizilir, PNG olarak diske
// yazılır (yarıda kalırsa kaldığı yerden sürer), sonra ffmpeg -nostdin ile
// birleştirilir. Ekran kaydı yoktur; her çalıştırmada aynı sonuç.
// ─────────────────────────────────────────────────────────────
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import { root, arg, flag, META, launch, openFilm, frameAt, renderAudio } from './lib.mjs';

const FPS = +arg('fps', 30), CAPS = arg('captions', 'tr'), SHORT = +arg('height', 720);
const CRF = arg('crf', '19'), PRESET = arg('preset', 'slow'), WORKERS = Math.max(1, +arg('workers', 3));
const OUT = path.resolve(root, arg('out', 'out'));
const fmtArg = arg('format', 'both');
const formats = fmtArg === 'both' ? ['horizontal', 'vertical'] : [fmtArg];
const NAME = { horizontal: 'yatay', vertical: 'dikey' };

function ffmpegBin() {
  if (process.env.FFMPEG_PATH) return process.env.FFMPEG_PATH;
  const r = spawnSync('ffmpeg', ['-version']);
  if (r.status === 0) return 'ffmpeg';
  console.error('ffmpeg bulunamadı. Mac: brew install ffmpeg  (ya da FFMPEG_PATH ayarlayın)');
  process.exit(1);
}

async function exportFormat(browser, format, ffmpeg) {
  const scale = SHORT / 1080;
  const mp4 = path.join(OUT, `${META.slug}_${NAME[format]}_${SHORT}p${CAPS === 'tr' ? '' : '_' + CAPS}.mp4`);
  if (fs.existsSync(mp4) && !process.argv.includes('--force')) { console.log(`  = ${path.basename(mp4)} zaten var, atlandı`); return mp4; }
  const dir = path.join(OUT, `.frames_${format}_${CAPS}_${SHORT}`);
  fs.mkdirSync(dir, { recursive: true });
  const total = Math.round(META.duration * FPS);
  const todo = [];
  for (let f = 0; f < total; f++) if (!fs.existsSync(path.join(dir, `${String(f).padStart(5, '0')}.png`))) todo.push(f);
  if (todo.length) {
    const pages = await Promise.all(Array.from({ length: WORKERS }, () => openFilm(browser, { format, captions: CAPS, scale })));
    const t0 = Date.now();
    let done = 0;
    for (let i = 0; i < todo.length; i += WORKERS) {
      const batch = todo.slice(i, i + WORKERS);
      const bufs = await Promise.all(batch.map((f, k) => frameAt(pages[k], f / FPS)));
      batch.forEach((f, k) => fs.writeFileSync(path.join(dir, `${String(f).padStart(5, '0')}.png`), bufs[k]));
      done += batch.length;
      if (done % (FPS * 3) < WORKERS || done === todo.length) {
        const el = (Date.now() - t0) / 1000;
        process.stdout.write(`\r  ${NAME[format]}: ${total - todo.length + done}/${total} kare · ${el.toFixed(0)} sn · ~${((el / done) * (todo.length - done)).toFixed(0)} sn kaldı   `);
      }
    }
    for (const p of pages) { if (p._errs.length) console.error('\n[sayfa]', p._errs.join('\n')); await p.close(); }
    process.stdout.write('\n');
  }
  const wav = flag('no-audio') ? null : renderAudio(path.join(OUT, `.ses_${META.slug}.wav`));
  const aIn = wav ? ['-i', wav] : [];
  const aOut = wav ? ['-c:a', 'aac', '-b:a', '160k', '-ar', '44100', '-shortest'] : [];
  const r = spawnSync(ffmpeg, ['-nostdin', '-y', '-loglevel', 'error', '-framerate', String(FPS), '-i', path.join(dir, '%05d.png'), ...aIn,
    ...aOut, '-c:v', 'libx264', '-preset', PRESET, '-crf', CRF, '-pix_fmt', 'yuv420p', '-r', String(FPS), '-movflags', '+faststart',
    '-metadata', `title=${META.title} — ${META.code}`, '-metadata', 'artist=Hakan Ataş', '-metadata', 'copyright=CC BY-NC 4.0', mp4], { stdio: 'inherit' });
  if (r.status !== 0) { console.error('ffmpeg hata verdi'); process.exit(1); }
  fs.rmSync(dir, { recursive: true, force: true });
  if (wav) fs.rmSync(wav, { force: true });
  console.log(`  ✓ ${path.relative(root, mp4)}`);
  return mp4;
}

fs.mkdirSync(OUT, { recursive: true });
const ffmpeg = ffmpegBin();
const browser = await launch();
console.log(`${META.title} → MP4 (${SHORT}p, ${FPS} fps, altyazı: ${CAPS}, ${WORKERS} sayfa)`);
for (const f of formats) await exportFormat(browser, f, ffmpeg);
await browser.close();
