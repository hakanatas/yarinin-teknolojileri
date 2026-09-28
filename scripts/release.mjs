// v1.0 sürüm dosyalarını üretir → release/ (6 dosya)
//   yatay ve dikey 720p MP4 (Türkçe altyazılı), TR / EN / TR+EN SRT, seslendirme notları
// Var olan dosyaları atlar; yarıda kalan MP4 kaldığı kareden sürer.
import path from 'node:path';
import fs from 'node:fs';
import { spawnSync } from 'node:child_process';
import { root, META } from './lib.mjs';

const rel = path.join(root, 'release');
const want = [
  `${META.slug}_yatay_720p.mp4`, `${META.slug}_dikey_720p.mp4`,
  `${META.slug}_tr.srt`, `${META.slug}_en.srt`, `${META.slug}_tr-en.srt`, `${META.slug}_seslendirme-notlari.txt`,
];
const missing = want.filter((f) => !fs.existsSync(path.join(rel, f)));
if (!missing.length) { console.log(`= ${META.slug}: release/ tamam (6 dosya)`); process.exit(0); }
const node = process.execPath;
const run = (script, extra = []) => {
  const r = spawnSync(node, [path.join(root, 'scripts', script), '--out=release', ...extra], { stdio: 'inherit', cwd: root });
  if (r.status !== 0) process.exit(r.status || 1);
};
run('srt.mjs');
if (missing.some((f) => f.endsWith('.mp4'))) run('export.mjs', ['--format=both', '--captions=tr', '--height=720']);
const still = want.filter((f) => !fs.existsSync(path.join(rel, f)));
if (still.length) { console.error('Eksik:', still.join(', ')); process.exit(1); }
console.log(`✓ ${META.slug}: release/ hazır (6 dosya)`);
