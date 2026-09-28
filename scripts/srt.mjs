// Altyazı ve seslendirme notları:  npm run srt
//   → out/<slug>_tr.srt, _en.srt, _tr-en.srt, _seslendirme-notlari.txt
import path from 'node:path';
import fs from 'node:fs';
import { root, arg, META, srt, narration } from './lib.mjs';
const out = path.resolve(root, arg('out', 'out'));
fs.mkdirSync(out, { recursive: true });
fs.writeFileSync(path.join(out, `${META.slug}_tr.srt`), srt('tr'));
fs.writeFileSync(path.join(out, `${META.slug}_en.srt`), srt('en'));
fs.writeFileSync(path.join(out, `${META.slug}_tr-en.srt`), srt('bi'));
fs.writeFileSync(path.join(out, `${META.slug}_seslendirme-notlari.txt`), narration());
console.log(`✓ ${path.relative(root, out)}/${META.slug}_{tr,en,tr-en}.srt + _seslendirme-notlari.txt`);
