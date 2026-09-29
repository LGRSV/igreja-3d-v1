// Governador de qualidade (v1.4): escala de resolução em movimento, UM quadro nítido ao parar, parado = 0 redesenhos.
// Uso: THREE_LOCAL=<three.module.min.js> node tools/gov_test.mjs <index.html> [segundos de arrasto] ["JS antes do arrasto"]
// Para forçar um nível, use uma cópia do index.html com `quality: 'leve'` (etc.) no lugar de `quality: 'auto'`.
import { open } from './lib.mjs';
const [,, html, drag = '6', pre = ''] = process.argv;
const t = await open(html); const { page } = t;
if (pre) await page.evaluate(pre);
await page.evaluate(() => { const c = document.querySelector('igreja3d-card'), r = c._renderer, o = r.render.bind(r); window.__r = []; r.render = (s, cam) => { window.__r.push([Math.round(performance.now()), +r.getPixelRatio().toFixed(3), c._orbit.moving ? 1 : 0]); return o(s, cam); }; });
const q = () => page.evaluate(() => { const c = document.querySelector('igreja3d-card'); return { ...c.getQuality(), pr: +c._renderer.getPixelRatio().toFixed(3), dprFull: c._dprFull, frame: c._renderer.info.render.frame }; });
const out = { tier: (await q()).tier, start: await q(), samples: [] };
const t0 = Date.now(); let i = 0;
await page.mouse.move(700, 450); await page.mouse.down();
while (Date.now() - t0 < +drag * 1000) {
  i++; await page.mouse.move(700 + (i % 2 ? 60 : -60) + (i % 7), 450 + (i % 3) * 8, { steps: 2 }); await page.waitForTimeout(50);
  if (i % 8 === 0) { const s = await q(); out.samples.push([Math.round((Date.now() - t0) / 100) / 10, s.moveScale && +s.moveScale.toFixed(3), s.pr, s.rung]); }
}
out.during = await q();
await page.mouse.up(); const upAt = await page.evaluate(() => Math.round(performance.now()));
// espera a câmera assentar (a suavização leva vários quadros no SwiftShader) e o quadro nítido
await page.waitForFunction(() => !document.querySelector('igreja3d-card')._orbit.moving, null, { timeout: 120000, polling: 100 });
await page.waitForFunction(() => !document.querySelector('igreja3d-card')._lowRes, null, { timeout: 60000, polling: 50 });
await page.waitForTimeout(400); out.after400 = await q();
await page.waitForTimeout(2500); const a = await q(); out.settled = a;
await page.waitForTimeout(4000); out.idleFramesAfter4s = (await q()).frame - a.frame;
out.sharpFrames = (await page.evaluate(() => window.__r)).filter((r) => r[0] >= upAt && r[2] === 0 && r[1] >= 0.8 * a.dprFull * Math.min(1, a.idleScale + 0.3)).length;
out.logs = t.logs; out.errs = t.errs;
console.log(JSON.stringify(out)); await t.close();
