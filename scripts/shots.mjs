// Önizleme kareleri ve yazı kontrolü
//   npm run shots -- --times=5,20,40 --format=both --captions=tr --out=shots
//   npm run check                         (her 0,25 sn'de yatay+dikey yazı kontrolü)
//   --sheet=docs/strip.jpg --times=...    (kareleri tek şeritte birleştirir; ffmpeg gerekir)
import path from 'node:path';
import fs from 'node:fs';
import { spawnSync } from 'node:child_process';
import { root, arg, flag, META, SCENES, launch, openFilm, frameAt } from './lib.mjs';

const fmtArg = arg('format', 'both');
const formats = fmtArg === 'both' ? ['horizontal', 'vertical'] : [fmtArg];
const captions = arg('captions', 'tr');
const out = path.resolve(root, arg('out', 'shots'));
const scale = +arg('scale', 0.5);
const browser = await launch();

if (flag('check')) {
  // Altyazının üç dilini de dener; 720p çıktıda 17 px altı yazı "küçük" sayılır.
  const step = +arg('step', 0.25), minPx = +arg('min', 17);
  let bad = 0;
  for (const format of formats) for (const cap of ['tr', 'en', 'bi']) {
    const page = await openFilm(browser, { format, captions: cap, scale: 720 / 1080, check: true });
    const seen = new Map();
    for (let t = 0; t <= META.duration + 1e-6; t += step) {
      const issues = await page.evaluate(([t, m]) => window.__BF.check(t, m), [t, minPx]);
      for (const s of issues) if (!seen.has(s)) seen.set(s, t);
    }
    if (page._errs.length) { console.log(`[${format}/${cap}] SAYFA HATASI:\n  ` + page._errs.join('\n  ')); bad++; }
    for (const [s, t] of seen) { console.log(`[${format}/${cap}] ${t.toFixed(2)} sn  ${s}`); bad++; }
    await page.close();
  }
  console.log(bad ? `\n${bad} sorun bulundu.` : '✓ yazı kontrolü temiz: çakışma, taşma ya da küçük yazı yok');
  await browser.close();
  process.exit(bad ? 1 : 0);
}

const times = (arg('times', '') || SCENES.map((s) => (s.t0 + s.t1) / 2).join(',')).split(',').map(Number);
fs.mkdirSync(out, { recursive: true });
const files = { horizontal: [], vertical: [] };
for (const format of formats) {
  const page = await openFilm(browser, { format, captions, scale });
  for (const t of times) {
    const f = path.join(out, `${format[0]}_${t.toFixed(2)}.png`);
    fs.writeFileSync(f, await frameAt(page, t));
    files[format].push(f);
  }
  if (page._errs.length) console.log('SAYFA HATASI:\n' + page._errs.join('\n'));
  await page.close();
}
await browser.close();
console.log(`✓ ${times.length * formats.length} kare → ${path.relative(root, out)}`);

const sheet = arg('sheet', '');
if (sheet) {
  const list = files.horizontal.length ? files.horizontal : files.vertical;
  const inputs = list.flatMap((f) => ['-i', f]);
  const r = spawnSync('ffmpeg', ['-nostdin', '-y', '-loglevel', 'error', ...inputs, '-filter_complex', `${list.map((_, i) => `[${i}:v]scale=640:-1[v${i}]`).join(';')};${list.map((_, i) => `[v${i}]`).join('')}hstack=inputs=${list.length}`, '-q:v', '3', path.resolve(root, sheet)], { stdio: 'inherit' });
  if (r.status === 0) console.log('✓', sheet);
}
