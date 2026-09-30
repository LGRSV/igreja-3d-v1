// Animações (v1.5.x): maçaneta gira antes da porta abrir e volta, porta assenta, lâmpadas sobem/descem e terminam, ar liga/desliga e termina, reduced-motion.
// Uso: THREE_LOCAL=<three.module.min.js> node tools/anim_test.mjs <index.html>
import { open } from './lib.mjs';
const [,, html] = process.argv;
const t = await open(html); const { page, S, ev } = t; const R = {}, ok = {};
const C = (f, a) => page.evaluate(`(${f})(document.querySelector('igreja3d-card'), ${JSON.stringify(a === undefined ? null : a)})`);
await ev(() => document.querySelector('igreja3d-card')._setPanel(false)); await S(400);
// (a) porta de madeira: a maçaneta desce (hs → 1) antes da folha sair, solta, a folha abre com um tico de passada e tudo assenta (sem quadros pendentes)
R.a = await C((k) => {
  k.setWalk(true); k._stop(); k.setWalkPose(12.2, 10.6, 0); k._walk.update(0.001);
  const d = k._doors.find((q) => q.axis === 'x' && Math.abs(q.c - 9.25) < 0.02 && Math.abs(q.a - 11.8) < 0.02);
  const lev = d.leaves[0].parts.find((p) => p.lever), a0 = Array.from(lev.mesh.instanceMatrix.array.slice(lev.idx * 16, lev.idx * 16 + 16));
  let maxHs = 0, hsWhenMoved = -1, maxP = 0, moved = false, moving = true, n = 0, leverMoved = false;
  for (let i = 0; i < 150; i++) {
    moving = k._doorsTick(1 / 30); n++;
    maxHs = Math.max(maxHs, d.hs); maxP = Math.max(maxP, d.p);
    if (!moved && d.q > 0.03) { moved = true; hsWhenMoved = d.hs; }
    const a = lev.mesh.instanceMatrix.array; if (d.hs > 0.9) for (let j = 0; j < 16; j++) if (Math.abs(a[lev.idx * 16 + j] - a0[j]) > 1e-3) leverMoved = true;
  }
  return { maxHs: +maxHs.toFixed(2), hsWhenMoved: +hsWhenMoved.toFixed(2), maxP: +maxP.toFixed(3), hsEnd: d.hs, q: d.q, moving, leverMoved };
});
ok.a = R.a.maxHs > 0.95 && R.a.hsWhenMoved > 0.9 && R.a.maxP > 1.01 && R.a.maxP < 1.08 && R.a.hsEnd === 0 && R.a.q === 1 && R.a.moving === false && R.a.leverMoved;
// fecha: a maçaneta desce de novo perto do batente e volta
R.b = await C((k) => {
  k.setWalkPose(12.2, 5.5, 0); k._walk.update(0.001);
  const d = k._doors.find((q) => q.axis === 'x' && Math.abs(q.c - 9.25) < 0.02 && Math.abs(q.a - 11.8) < 0.02);
  d.awayAt = performance.now() - 3000; let maxHs = 0, moving = true;
  for (let i = 0; i < 150; i++) { moving = k._doorsTick(1 / 30); maxHs = Math.max(maxHs, d.hs); }
  return { maxHs: +maxHs.toFixed(2), hs: d.hs, q: d.q, target: d.target, moving };
});
ok.b = R.b.q === 0 && R.b.target === 0 && R.b.hs === 0 && R.b.moving === false && R.b.maxHs > 0.3;
// (c) reduced-motion: abre direto, sem maçaneta
R.c = await C((k) => {
  k._reduced = true; k.setWalkPose(12.2, 10.6, 0); k._walk.update(0.001); k._doorsTick(1 / 30);
  const d = k._doors.find((q) => q.axis === 'x' && Math.abs(q.c - 9.25) < 0.02 && Math.abs(q.a - 11.8) < 0.02); const r = { q: d.q, hs: d.hs }; k._reduced = false; return r;
});
ok.c = R.c.q === 1 && R.c.hs === 0;
await C((k) => { k.setWalk(false); k._stop(); });
// relógio falso + render vazio: dirige o _frame() com passos de 1/30 s, sem depender da velocidade do SwiftShader
await C((k) => { window.__ft = performance.now(); performance.now = () => window.__ft; k._clock.start(); k._renderer.render = () => {}; window.__adv = (sec) => { for (let i = 0; i < Math.round(sec * 30); i++) { window.__ft += 1000 / 30; k._frame(); } }; });
// (d) lâmpadas: sobem e descem até o fim; tubo tem partida tremida (lv abaixo do nível no começo); lâmpada quente começa alaranjada; RGB faz cross-fade
R.d = await C((k) => {
  for (const q of ['cozinha', 'hall', 'palco']) window.demo.set(q, 'off'); window.__adv(4);
  const rc = k._items.get('cozinha'), rh = k._items.get('hall'), rp = k._items.get('palco'); let minRatio = 1, sawWarm = false, sawFade = false;
  window.demo.set('cozinha', 'on'); window.demo.set('hall', 'on'); window.demo.set('palco', 'on', { rgb_color: [255, 0, 0] });
  window.__adv(3);   // palco vermelho aceso
  window.demo.set('palco', 'on', { rgb_color: [0, 0, 255] });
  for (let i = 0; i < 40; i++) { window.__adv(1 / 30); if (rp.cshow.r > 0.1 && rp.cshow.b > 0.1) sawFade = true; }
  window.__adv(3);
  // liga de novo, agora amostrando quadro a quadro
  for (const q of ['cozinha', 'hall']) window.demo.set(q, 'off'); window.__adv(4);
  window.demo.set('cozinha', 'on'); window.demo.set('hall', 'on');
  for (let i = 0; i < 20; i++) { window.__adv(1 / 30); if (rc.level > 0.05) minRatio = Math.min(minRatio, rc.lv / rc.level); if (rh.level > 0.05 && rh.level < 0.6 && rh.cshow.g < rh.color.g - 0.05) sawWarm = true; }
  window.__adv(4);
  return { minRatio: +minRatio.toFixed(2), sawWarm, sawFade, lvC: rc.lv, lvH: rh.lv, cshowEnd: rh.cshow.getHexString(), colEnd: rh.color.getHexString(), palcoEnd: rp.cshow.getHexString() };
});
ok.d = R.d.minRatio < 0.9 && R.d.sawWarm && R.d.sawFade && R.d.lvC === 1 && R.d.lvH === 1 && R.d.cshowEnd === R.d.colEnd && R.d.palcoEnd === '0000ff';
// (e) ar: liga (LED pisca, aleta com passada, fluxo, névoa) e desliga; ao fim tudo assenta
R.e = await C((k) => {
  window.demo.set('ac_pastoral', 'off'); window.__adv(4);
  const rt = k._items.get('ac_pastoral'), u = rt.airUnits[0]; let ptsSeen = false, blink = false, flapMax = 0, ledLow = 9;
  window.demo.set('ac_pastoral', 'cool');
  for (let i = 0; i < 150; i++) {
    window.__adv(1 / 30); if (rt.airPts.visible) ptsSeen = true; flapMax = Math.max(flapMax, rt.flaps[0].rotation.x);
    const age = u.ign ? (performance.now() - u.ign) / 1000 : 9; if (age < 0.6 && age > 0.05) ledLow = Math.min(ledLow, rt.ledMats[0].emissiveIntensity);
  }
  return { ptsSeen, ledLow: +ledLow.toFixed(2), flapMax: +flapMax.toFixed(2), f: u.f, g: u.g, led: u.led, ledI: rt.ledMats[0].emissiveIntensity };
});
ok.e = R.e.ptsSeen && R.e.ledLow < 0.5 && R.e.flapMax > 0.9 && R.e.f === 1 && R.e.g === 1 && R.e.led === 1;
R.f = await C((k) => {
  window.demo.set('ac_pastoral', 'off'); window.__adv(4);
  const rt = k._items.get('ac_pastoral'), u = rt.airUnits[0]; return { f: u.f, g: u.g, led: u.led, vis: rt.airPts.visible, flap: rt.flaps[0].visible };
});
ok.f = R.f.f === 0 && R.f.g === 0 && R.f.led === 0 && !R.f.vis && !R.f.flap;
// (g) parado: com tudo assentado o cartão não pede quadro (dirty = false)
R.g = await C((k) => { let n = 0; k._renderer.render = () => { n++; }; window.__adv(2); return { renders: n }; });
ok.g = R.g.renders === 0;
R.errs = t.errs; ok.errs = t.errs.length === 0; R.ok = ok; R.pass = Object.values(ok).every(Boolean);
console.log(JSON.stringify(R, null, 1)); await t.close();
