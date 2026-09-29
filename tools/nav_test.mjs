// Vista de cima navegável (v1.4): planta → bloco → cômodo → aparelho, trilha, Voltar/Esc, redimensionar, setTopNav, parado = 0.
// Uso: THREE_LOCAL=<three.module.min.js> [OUT=pasta-dos-png] node tools/nav_test.mjs <index.html>  (use uma cópia com quality: 'min' para ir mais rápido)
import { open, proj, clickAt } from './lib.mjs';
const [,, html, tag = 'nav'] = process.argv;
const t = await open(html); const { page, S, ev } = t; const R = {};
const nav = () => ev(() => { const c = document.querySelector('igreja3d-card'); const n = c.getTopNav(); return { ...n, dist: +c._orbit.camera.position.distanceTo(c._orbit.targetGoal).toFixed(2), tgt: c._orbit.targetGoal.toArray().map((v) => +v.toFixed(2)), crumbs: c._navCrumbs.textContent, top: c._topView, pressed: c._topBtn.getAttribute('aria-pressed') }; });
const shot = (n) => page.screenshot({ path: (process.env.OUT || '.') + `/int_${n}.png` });
await ev(() => document.querySelector('igreja3d-card')._setPanel(false)); await S(600);
await ev(() => document.querySelector('igreja3d-card')._setTopView(true)); await S();
R.a = await nav(); await shot('01_planta');
await clickAt(page, 18, 0.05, 25.6); await S(); R.b1 = await nav(); await shot('02_bloco');
await clickAt(page, 18, 0.05, 25.6); await S(); R.b2 = await nav(); await shot('03_comodo');
const on0 = await ev(() => document.querySelector('igreja3d-card')._state.midia.on);
await clickAt(page, 17.5, 2.7, 25.6); await page.waitForTimeout(1500); await S();
R.b3 = { before: on0, after: await ev(() => document.querySelector('igreja3d-card')._state.midia.on) }; await shot('04_aparelho');
const ac0 = await ev(() => document.querySelector('igreja3d-card')._state.ac_midia.on);
await page.click('igreja3d-card >> css=.nav .chip[data-key=ac_midia]'); await page.waitForTimeout(1500); await S();
R.b4 = { before: ac0, after: await ev(() => document.querySelector('igreja3d-card')._state.ac_midia.on), state: await ev(() => document.querySelector('igreja3d-card')._state.ac_midia.state) }; await shot('05_ar_ligado');
// (d) redimensionar no nível 2
const before = await nav();
await page.setViewportSize({ width: 900, height: 1300 }); await page.waitForTimeout(800); await S(); const after = await nav(); R.d = { before: before.tgt, after: after.tgt, room: after.room }; await shot('06_retrato');
await page.setViewportSize({ width: 1400, height: 900 }); await page.waitForTimeout(800); await S();
// (f) parado 4 s
const f0 = await ev(() => document.querySelector('igreja3d-card')._renderer.info.render.frame); await page.waitForTimeout(4000);
R.f = (await ev(() => document.querySelector('igreja3d-card')._renderer.info.render.frame)) - f0;
// (c) voltar
await page.click('igreja3d-card >> css=.nav .back'); await S(); R.c1 = await nav();
await ev(() => document.querySelector('igreja3d-card')._canvas.focus()); await page.keyboard.press('Escape'); await S(); R.c2 = await nav();
await page.keyboard.press('Escape'); await S(); R.c3 = await nav();
// (e)
await ev(() => document.querySelector('igreja3d-card').setTopNav('templo', 'palco')); await S(); R.e1 = await nav(); await shot('07_palco');
await ev(() => document.querySelector('igreja3d-card')._setRoof(true)); await S(); R.e2 = await nav();
await ev(() => document.querySelector('igreja3d-card')._setRoof(false));
R.errs = t.errs;
console.log(JSON.stringify(R, null, 1));
await t.close();
