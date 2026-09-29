// Convivência (v1.4): Pessoa × Vista de cima × Recentrar × Fachada × painel × voo do ar × governador.
// Uso: THREE_LOCAL=<three.module.min.js> node tools/integ_test.mjs <index.html>
import { open, proj } from './lib.mjs';
const [,, html] = process.argv;
const t = await open(html); const { page, S, ev } = t; const R = {};
const C = (f, a) => page.evaluate(`(${f})(document.querySelector('igreja3d-card'), ${JSON.stringify(a)})`);
const st = () => C((c) => ({ top: !!c._topView, lvl: c.getTopNav().level, room: c.getTopNav().room, walk: !!c._walkOn, navVisible: !c._navRow.hidden, joy: !c._joy.hidden, panel: c._panelOpen, orbit: c._orbit.enabled, roof: !!c._roofOn }));
const btn = (label) => page.locator('igreja3d-card').locator('.hud button', { hasText: new RegExp('^' + label + '$') }).first().click();
// (h) painel aberto + Pessoa
R.h0 = await st();
await btn('Pessoa'); await S(); R.h1 = await st();
await page.keyboard.press('Escape'); await S(); R.h2 = await st();
// (a) planta nível 2 → Pessoa → Esc
await C((c) => { c._setPanel(false); c.setTopNav('ala', 'midia'); }); await S(); R.a0 = await st();
await btn('Pessoa'); await S(); R.a1 = await st();
await page.keyboard.press('Escape'); await S(); R.a2 = await st();
// (b) Pessoa → Vista de cima
await btn('Pessoa'); await S(); await btn('Vista de cima'); await S(); R.b = await st();
// (c) Pessoa → Recentrar
await btn('Pessoa'); await S(); await btn('Recentrar'); await S(); R.c = await st();
// (f) Fachada em nível 2 e em Pessoa
await C((c) => c.setTopNav('ala', 'midia')); await S(); await btn('Fachada'); await S(); R.f1 = await st(); await btn('Fachada'); await S();
await btn('Pessoa'); await S(); await btn('Fachada'); await S(); R.f2 = await st(); await btn('Fachada'); await S();
// (g) voo do ar: na Pessoa não move; fora dela voa e desfaz a planta
const p0 = await C((c) => c.getWalkPose()); await C((c) => c._flyToAir('ac_midia')); R.g1 = { same: JSON.stringify(p0) === JSON.stringify(await C((c) => c.getWalkPose())), walk: (await st()).walk };
await page.keyboard.press('Escape'); await S(); await C((c) => c.setTopNav('ala', 'midia')); await S();
const cam0 = await C((c) => c._orbit.targetGoal.toArray()); await C((c) => c._flyToAir('ac_midia')); await S(); R.g2 = { top: (await st()).top, moved: JSON.stringify(cam0) !== JSON.stringify(await C((c) => c._orbit.targetGoal.toArray())) };
// (e) chips do ar em nível 2 (selo)
await C((c) => c.setTopNav('ala', 'midia')); await S();
const a0 = await C((c) => c._state.ac_midia.on); await page.locator('igreja3d-card').locator('.nav .chip[data-key=ac_midia]').click(); await page.waitForTimeout(1500); await S();
R.e = { before: a0, after: await C((c) => c._state.ac_midia.on), top: (await st()).top, badge: await C((c) => (c._items.get('ac_midia').badges || []).some((b) => b.visible)) };
await C((c) => c._setTopView(false)); await S();
// (d) andar em tempo real: governador reage; ao parar, exatamente 1 quadro nítido
await C((c) => { c.setWalk(true); const r = c._renderer, o = r.render.bind(r); window.__r = []; r.render = (s, cam) => { window.__r.push([Math.round(performance.now()), +r.getPixelRatio().toFixed(3), c._orbit.moving ? 1 : 0]); return o(s, cam); }; });
await S(800); const f0 = await C((c) => ({ ...c.getQuality(), frame: c._renderer.info.render.frame }));
await page.keyboard.down('KeyW'); await page.waitForTimeout(5000); const mid = await C((c) => ({ ...c.getQuality(), pr: c._renderer.getPixelRatio(), low: c._lowRes, moving: c._orbit.moving }));
await page.keyboard.up('KeyW'); const up = await C(() => Math.round(performance.now())); await S(800); await page.waitForTimeout(600);
const rs = (await C(() => window.__r)).filter((r) => r[0] >= up);
R.d = { f0: f0.moveScale, mid, sharpAfter: rs.filter((r) => r[2] === 0 && r[1] >= 0.8).length };
const fr0 = await C((c) => c._renderer.info.render.frame); await page.waitForTimeout(4000); R.d.idleFrames = (await C((c) => c._renderer.info.render.frame)) - fr0;
R.errs = t.errs; console.log(JSON.stringify(R)); await t.close();
