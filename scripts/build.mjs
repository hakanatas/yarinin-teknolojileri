// Senaryo değişince süreleri ve altyazıları yeniden üret:  npm run build
//   scenes/film.js → film.config.js + captions.js
// (Altyazı metnini yalnızca düzeltmek için captions.js doğrudan düzenlenebilir.)
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const g = globalThis; g.BF = {};
for (const [, f] of html.matchAll(/<script src="([^"]+)"><\/script>/g)) {
  if (/fonts\.js|player\.js|synth\.js|film\.config\.js|captions\.js/.test(f)) continue;
  require(path.join(root, f));
}
const BF = g.BF, spec = BF.FILM;
const js = (o) => JSON.stringify(o, null, 2).replace(/\n/g, '\n  ');
const oldCfg = fs.readFileSync(path.join(root, 'film.config.js'), 'utf8');
const metaStr = oldCfg.match(/const META = ([\s\S]*?\n  \});/);
let meta = Object.assign({}, BF.META, { duration: spec.duration, tempo: 1 });
fs.writeFileSync(path.join(root, 'film.config.js'), oldCfg
  .replace(/"duration": [\d.]+/, `"duration": ${spec.duration}`)
  .replace(/const SCENES = [\s\S]*?\n  \];/, `const SCENES = ${js(BF.SCENES)};`));
const caps = BF.CAPTIONS;
const head = fs.readFileSync(path.join(root, 'captions.js'), 'utf8').split('  const CAPTIONS = [')[0];
fs.writeFileSync(path.join(root, 'captions.js'), head + `  const CAPTIONS = [
${caps.map((c) => `    { scene: ${c.scene}, start: ${c.start}, end: ${c.end}, tr: ${JSON.stringify(c.tr)}, en: ${JSON.stringify(c.en)},\n      note: ${JSON.stringify(c.note)} },`).join('\n')}
  ];
  if (typeof module !== 'undefined' && module.exports) module.exports = CAPTIONS;
  else { root.BF = root.BF || {}; root.BF.CAPTIONS = CAPTIONS; }
})(typeof window !== 'undefined' ? window : globalThis);
`);
console.log(`✓ ${meta.slug}: ${spec.duration.toFixed(1)} sn, ${caps.length} altyazı — film.config.js ve captions.js güncellendi`);
