// Ares (v1.4.3): cada unidade liga na sua vez (LED → aleta → fluxo nasce), tour da câmera no templo, Vista de cima, Pessoa, HA (hass falso), parado = 0.
// Uso: THREE_LOCAL=<three.module.min.js> OUT=<pasta> node tools/air_test.mjs <index.html> [cenas: tour,midia,top,pessoa,ha,reduzido,idle,off]
import { open } from './lib.mjs';
const [,, html, only = 'tour,midia,top,pessoa,ha,reduzido,idle,off'] = process.argv; const want = new Set(only.split(','));
const OUT = process.env.OUT || '.';
const t = await open(html, { w: +(process.env.W || 1200), h: +(process.env.H || 760) }); const { page, S, ev } = t; const R = {};
const C = (f, a) => page.evaluate(`(${f})(document.querySelector('igreja3d-card'), ${JSON.stringify(a === undefined ? null : a)})`);
const shot = (n) => page.screenshot({ path: `${OUT}/ac_${n}.png` });
const units = (k) => C((c, k) => c._items.get(k).airUnits.map((u) => ({ f: +u.f.toFixed(2), g: +u.g.toFixed(2), led: +u.led.toFixed(2) })), k);
const waitU = (k, i, prop, v, ms = 60000) => page.waitForFunction(([k, i, prop, v]) => document.querySelector('igreja3d-card')._items.get(k).airUnits[i][prop] >= v, [k, i, prop, v], { timeout: ms, polling: 50 });
const setOff = async (k) => { await ev((k) => window.demo.set(k, 'off'), k); await page.waitForTimeout(1500); await S(500); };
const frames = () => C((c) => c._renderer.info.render.frame);
const cam = () => C((c) => ({ pos: c._camera.position.toArray().map((v) => +v.toFixed(1)), tgt: c._orbit.targetGoal.toArray().map((v) => +v.toFixed(1)), top: c._topView, walk: c._walkOn, tour: !!c._airTour, focus: !!c._airFocus }));
await ev(() => document.querySelector('igreja3d-card')._setPanel(false)); await S(600);
R.load = { templo: await units('ac_templo') };   // ligado na carga: sem animação
if (want.has('tour')) {
  await setOff('ac_templo'); R.off = await units('ac_templo');
  await C((c) => c._toggleItem('ac_templo'));          // clique (demo: hass falso responde 220 ms depois)
  R.tourStart = null;
  for (const [i, tag] of [[0, '01_unidade1'], [2, '03_unidade3'], [4, '05_unidade5']]) {
    await waitU('ac_templo', i, 'g', 0.75); await shot('templo_' + tag); R['u' + i] = { units: await units('ac_templo'), cam: await cam() };
  }
  await page.waitForFunction(() => !document.querySelector('igreja3d-card')._airTour, null, { timeout: 60000 }); await S(1200);
  await shot('templo_06_final'); R.final = { units: await units('ac_templo'), cam: await cam() };
  // parado depois dos 8 s + foco: (mede em idle abaixo)
}
if (want.has('midia')) {
  await setOff('ac_midia'); await C((c) => c._resetView(false)); await S(500);
  await C((c) => c._toggleItem('ac_midia'));
  await waitU('ac_midia', 0, 'g', 0.35); await shot('midia_01_nascendo'); R.midia1 = await units('ac_midia');
  await waitU('ac_midia', 0, 'g', 1); await S(1200); await shot('midia_02_cheio'); R.midia2 = { u: await units('ac_midia'), cam: await cam() };
}
if (want.has('top')) {
  await setOff('ac_templo'); await setOff('ac_midia'); await C((c) => c._resetView(false)); await C((c) => c.setTopNav()); await S(800);
  await ev(() => document.querySelector('igreja3d-card')._setTopView(true)); await S(800);
  await C((c) => c._toggleItem('ac_midia'));
  await waitU('ac_midia', 0, 'g', 0.3); await shot('top_midia_01'); await S(800); R.topM = { cam: await cam(), nav: await C((c) => c.getTopNav().room && c.getTopNav().room.id) };
  await waitU('ac_midia', 0, 'g', 1); await S(800); await shot('top_midia_02');
  await C((c) => c._toggleItem('ac_templo'));
  await waitU('ac_templo', 1, 'led', 0.5); await shot('top_templo_01'); R.topT1 = await units('ac_templo');
  await waitU('ac_templo', 3, 'g', 0.6); await shot('top_templo_02'); R.topT2 = { u: await units('ac_templo'), cam: await cam(), nav: await C((c) => c.getTopNav().room && c.getTopNav().room.id) };
  await waitU('ac_templo', 4, 'g', 1); await S(1200); await shot('top_templo_03'); R.topT3 = { cam: await cam() };
  await ev(() => document.querySelector('igreja3d-card')._setTopView(false)); await S(500);
}
if (want.has('pessoa')) {
  await setOff('ac_templo');
  await C((c) => { c.setWalk(true); c.setWalkPose(4.2, 27.0, -Math.PI / 2 + 0.05); c._walk.update(0.02); });   // dentro do templo (olhando para +x: parede dos ares)
  await S(600); const c0 = await cam();
  await C((c) => c._toggleItem('ac_templo'));
  await waitU('ac_templo', 2, 'g', 0.7); await shot('pessoa_01'); R.pessoa = { units: await units('ac_templo'), before: c0, after: await cam() };
  await waitU('ac_templo', 4, 'g', 1); await S(800); await shot('pessoa_02');
  await C((c) => c.setWalk(false)); await S(800);
}
if (want.has('ha')) {
  // mudança vinda do HA (objeto hass falso, sem clique): ar da pastoral off → cool
  await ev(() => document.querySelector('igreja3d-card')._resetView(false)); await S(600);
  const before = await units('ac_pastoral');
  await C((c) => { const st = JSON.parse(JSON.stringify(c._hass.states)); st['climate.ar_sala_pastoral'].state = 'cool'; c.hass = { ...c._hass, states: st }; });
  await waitU('ac_pastoral', 0, 'g', 0.5); await shot('ha_pastoral_01'); R.ha = { before, u: await units('ac_pastoral'), cam: await cam() };
  // HA ligando o ar do templo (automação): tour também
  await setOff('ac_templo'); await C((c) => { c._airFocus = null; c._resetView(false); }); await S(400);
  await C((c) => { const st = JSON.parse(JSON.stringify(c._hass.states)); st['climate.ar_templo'].state = 'cool'; c.hass = { ...c._hass, states: st }; });
  await waitU('ac_templo', 0, 'g', 0.6); R.ha2 = { tour: (await cam()).tour }; await shot('ha_templo_01');
  // gesto do usuário interrompe o tour, mas as unidades restantes ligam
  await page.mouse.move(600, 380); await page.mouse.down(); await page.mouse.move(640, 380, { steps: 4 }); await page.mouse.up();
  await page.waitForTimeout(300); R.ha3 = { tour: (await cam()).tour, units: await units('ac_templo') };
  await waitU('ac_templo', 4, 'g', 1); R.ha4 = await units('ac_templo'); await shot('ha_templo_02_apos_gesto');
}
if (want.has('reduzido')) {
  // prefers-reduced-motion: sem tour (corte direto para o quadro final) e unidades acendem sem animação
  await setOff('ac_templo'); await C((c) => { c._airFocus = null; c._airTour = null; c._reduced = true; c._resetView(false); }); await S(500);
  await C((c) => c._toggleItem('ac_templo')); await page.waitForTimeout(2500);
  R.reduzido = { units: await units('ac_templo'), cam: await cam() }; await S(500); await shot('reduzido_templo');
  await C((c) => { c._reduced = false; });
}
if (want.has('idle')) {
  // parado (depois de a animação terminar): 0 redesenhos
  await C((c) => { for (const k of ['ac_templo', 'ac_midia', 'ac_pastoral', 'ac_voluntariado']) c._items.get(k).airUntil = 0; c._airFocus = null; c._airTour = null; }); await S(1500);
  const f0 = await frames(); await page.waitForTimeout(5000); R.idleFrames = (await frames()) - f0;
}
if (want.has('off')) {
  await C((c) => c._toggleItem('ac_templo')); await page.waitForTimeout(400); R.off1 = await units('ac_templo');
  await page.waitForTimeout(2500); await S(500); await page.waitForTimeout(2500); R.off2 = await units('ac_templo'); R.offVis = await C((c) => c._items.get('ac_templo').airMesh.visible);
  const f0 = await frames(); await page.waitForTimeout(4000); R.offIdle = (await frames()) - f0;
}
R.errs = t.errs;
console.log(JSON.stringify(R, null, 1));
await t.close();
