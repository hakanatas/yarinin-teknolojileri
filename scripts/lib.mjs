// Ortak yardımcılar: tarayıcı açma, sayfa hazırlama, SRT metni.
// Tarayıcı sırası: BF_CHROME (yol) → Playwright'ın kendi Chromium'u (PLAYWRIGHT_BROWSERS_PATH varsa)
// → yüklü Google Chrome (channel: 'chrome'). Mac'te kendi Chromium indirmesi gerekmez.
import { chromium } from 'playwright';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import path from 'node:path';
import fs from 'node:fs';

const require = createRequire(import.meta.url);
export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const arg = (k, d) => { const a = process.argv.find((x) => x.startsWith(`--${k}=`)); return a ? a.slice(k.length + 3) : d; };
export const flag = (k) => process.argv.includes(`--${k}`);
export const { META, SCENES } = require(path.join(root, 'film.config.js'));
export const CAPTIONS = require(path.join(root, 'captions.js'));

export async function launch() {
  const opts = { headless: true, args: ['--force-color-profile=srgb', '--disable-lcd-text'] };
  if (process.env.BF_CHROME) return chromium.launch({ ...opts, executablePath: process.env.BF_CHROME });
  if (process.env.PLAYWRIGHT_BROWSERS_PATH && fs.existsSync(process.env.PLAYWRIGHT_BROWSERS_PATH)) {
    try { return await chromium.launch(opts); } catch {}
  }
  return chromium.launch({ ...opts, channel: 'chrome' });
}

export async function openFilm(browser, { format = 'horizontal', captions = 'tr', scale = 1, check = false } = {}) {
  const W = format === 'vertical' ? 1080 : 1920, H = format === 'vertical' ? 1920 : 1080;
  const page = await browser.newPage({ viewport: { width: Math.round(W * scale), height: Math.round(H * scale) }, deviceScaleFactor: 1 });
  const errs = [];
  page.on('pageerror', (e) => errs.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
  const url = pathToFileURL(path.join(root, 'index.html')).href + `?render=1&format=${format}&captions=${captions}&scale=${scale}${check ? '&check=1' : ''}`;
  await page.goto(url);
  await page.waitForFunction(() => document.body.dataset.ready === '1', null, { timeout: 120000 });
  page._errs = errs;
  return page;
}

export async function frameAt(page, t, mime = 'image/png') {
  const d = await page.evaluate(([t, mime]) => { window.__BF.renderAt(t); return document.getElementById('film').toDataURL(mime, 0.95); }, [t, mime]);
  return Buffer.from(d.slice(d.indexOf(',') + 1), 'base64');
}

const ts = (s) => { const ms = Math.round(s * 1000); const p = (n, k = 2) => String(n).padStart(k, '0'); return `${p(Math.floor(ms / 3600000))}:${p(Math.floor(ms / 60000) % 60)}:${p(Math.floor(ms / 1000) % 60)},${p(ms % 1000, 3)}`; };
export function srt(mode) {
  return CAPTIONS.map((c, i) => `${i + 1}\n${ts(c.start)} --> ${ts(c.end)}\n${mode === 'tr' ? c.tr : mode === 'en' ? c.en : c.tr + '\n' + c.en}\n`).join('\n');
}
export function narration() {
  const head = `${META.title} — ${META.code} ${META.outcome}\nSeslendirme notları / Narration notes (öğretmen için önerilen cümleler)\n\n`;
  return head + CAPTIONS.map((c) => `[${ts(c.start).slice(3, 8)}–${ts(c.end).slice(3, 8)}] Sahne ${c.scene}\n  Altyazı: ${c.tr}\n  Caption: ${c.en}\n  Seslendirme: ${c.note}`).join('\n\n') + '\n';
}

// Ses izini Node'da üretir (tarayıcıdaki oynatıcıyla aynı kod) → WAV yolu.
// index.html'deki betikler aynı sırayla yüklenir (yazı tipleri ve oynatıcı hariç).
export function loadFilmRuntime() {
  const g = globalThis;
  if (g.BF && g.BF.AUDIO && g.BF.scenes) return g.BF;
  g.BF = {};
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const srcs = [...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map((m) => m[1]);
  for (const f of srcs) {
    if (/fonts\.js|player\.js/.test(f)) continue;
    if (f === 'film.config.js') { g.BF.META = META; g.BF.SCENES = SCENES; continue; }
    if (f === 'captions.js') { g.BF.CAPTIONS = CAPTIONS; continue; }
    require(path.join(root, f));
  }
  return g.BF;
}
export function renderAudio(outPath) {
  const A = loadFilmRuntime().AUDIO;
  const { L, R, sr } = A.render(A.filmCues(), META.duration);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, Buffer.from(A.wav(L, R, sr)));
  return outPath;
}
