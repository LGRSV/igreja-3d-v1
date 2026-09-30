// Modo Pessoa "tipo Street View" (v1.4.6): clique no piso caminha (A* com colisão), escada e mezanino (subir/descer andando e pelo clique),
// marcador sob o cursor, bonequinho arrastável (mouse e toque), "Entrar aqui" na Vista de cima, "Ir para…", portas do WC Feminino e do pátio (v1.5.1).
// Uso: THREE_LOCAL=<three.module.min.js> OUT=<pasta-dos-png> node tools/street_test.mjs <index.html>   (imprime o JSON com os resultados; `ok` = tudo passou)
import { open, proj } from './lib.mjs';
const [,, html] = process.argv; const OUT = process.env.OUT || '.';
const t = await open(html); const { page, ev, S } = t; const R = {}; const ok = {};
const C = (f, a) => page.evaluate(`(${f})(document.querySelector('igreja3d-card'), ${JSON.stringify(a === undefined ? null : a)})`);
const pose = () => C((c) => { const p = c.getWalkPose(); return p && { x: +p.x.toFixed(2), y: +p.y.toFixed(2), z: +p.z.toFixed(2), up: p.up, walking: p.walking }; });
const step = (sec) => C((c, s) => { for (let i = 0; i < Math.round(s * 30); i++) { c._walk.update(1 / 30); c._doorsTick(1 / 30); } c._orbit.dirty = true; }, sec);
const near = (p, x, z, r = 0.3) => p && Math.hypot(p.x - x, p.z - z) < r;
await ev(() => { const c = document.querySelector('igreja3d-card'); c._setPanel(false); c._stop(); });
await page.waitForTimeout(45000);   // o SwiftShader compila shaders ~30–40 s depois da carga
const exitWalk = async () => { await page.keyboard.press('Escape'); await C((c) => c._start()); await page.waitForFunction(() => document.querySelector('igreja3d-card')._camera.position.y > 8, null, { timeout: 90000 }); await S(300); await C((c) => c._stop()); };   // o laço de quadros fica parado nos testes; volta só para a câmera voar de volta
// (a) caminhar até um ponto do piso: sai da rua, entra pela porta principal e chega ao ponto
await C((c) => { c.setWalkPose(12, 52, 0, 0); c._walk.update(0.05); c.walkTo(9.0, 46.0); });
await step(20); R.a = await pose(); ok.a = near(R.a, 9.0, 46.0, 0.2) && !R.a.walking;
// (b) escada: clique no mezanino sobe até lá (y dos olhos 3,05 + 1,6)
await C((c) => c.walkTo(2.0, 46.5, true)); await step(2); R.b0 = await pose(); await step(25); R.b = await pose();
ok.b = R.b.up === true && Math.abs(R.b.y - 4.65) < 0.02 && near(R.b, 2.0, 46.5, 0.2);
// (c) do mezanino, clique no piso do hall desce pela escada
await C((c) => c.walkTo(6.0, 46.0)); await step(30); R.c = await pose(); ok.c = R.c.up === false && Math.abs(R.c.y - 1.6) < 0.02 && near(R.c, 6.0, 46.0, 0.25);
// (d) subir/descer andando pelo teclado (W): a altura acompanha a escada e o guarda-corpo segura no mezanino
await C((c) => { c.setWalkPose(10.4, 48.8, Math.PI / 2, 0); c._walk.update(0.05); });
await page.keyboard.down('KeyW'); await step(2.5); R.d1 = await pose(); await step(3); R.d2 = await pose(); await step(3); R.d3 = await pose(); await page.keyboard.up('KeyW');
ok.d = R.d1.y > 1.6 && R.d2.y > R.d1.y && R.d3.up === true && R.d3.y > 4.5;
await C((c) => { c.setWalkPose(3.0, 46.0, -Math.PI / 2, 0, true); c._walk.update(0.05); });   // contra o guarda-corpo (x 4,06)
await page.keyboard.down('KeyW'); await step(3); await page.keyboard.up('KeyW'); R.d4 = await pose(); ok.d4 = R.d4.up && R.d4.x < 3.9 && R.d4.x > 3.6;
await C((c) => { c.setWalkPose(2.0, 45.0, Math.PI, 0, true); c._walk.update(0.05); });    // contra a parede z = 49,65 do mezanino
await page.keyboard.down('KeyW'); await step(6); await page.keyboard.up('KeyW'); R.d5 = await pose(); ok.d5 = R.d5.up && R.d5.z < 49.4;
// (e) ponto inalcançável: vai até o mais perto (não fica parado nem atravessa parede)
await C((c) => { c.setWalkPose(12, 46, 0, 0); c._walk.update(0.05); c.walkTo(15.0, 5.0); });   // o pátio dos fundos está fechado por vidro fixo
await step(90); R.e = await pose(); ok.e = R.e && !R.e.walking && Math.hypot(R.e.x - 15, R.e.z - 5) < 12;
// (f) o teclado assume o comando e cancela a caminhada
await C((c) => { c.setWalkPose(12, 48, 0, 0); c._walk.update(0.05); c.walkTo(5.0, 46.5); }); await step(0.5);
await page.keyboard.down('KeyD'); await step(0.2); await page.keyboard.up('KeyD'); R.f = await pose(); ok.f = R.f.walking === false;
// (g) mouse: passar o mouse mostra o marcador, o clique caminha, clicar no aparelho continua ligando/desligando
await C((c) => { c.setWalkPose(12.0, 48.0, 1.2, -0.3); c._walk.update(0.05); });
const [hx, hy] = await proj(page, 8.6, 0, 46.2);
await page.mouse.move(hx, hy); await page.waitForTimeout(500); await step(0.05);
R.g1 = await C((c) => ({ mk: c._mk.visible, x: +c._mk.position.x.toFixed(2), z: +c._mk.position.z.toFixed(2) }));
await page.mouse.down(); await page.mouse.up(); await page.waitForTimeout(200); await step(8); R.g2 = await pose();
ok.g = R.g1.mk && Math.abs(R.g1.x - 8.6) < 0.1 && near(R.g2, 8.6, 46.2, 0.25);
await C((c) => { c.setWalkPose(9, 47.5, 1.135, 0.585); c._walk.update(0.05); c._camera.updateMatrixWorld(); });
const [px, py] = await proj(page, 7.5, 2.7, 46.8); const h0 = await C((c) => c._state.hall.on);
await page.mouse.move(px, py); await page.mouse.down(); await page.mouse.up(); await page.waitForTimeout(800);
R.g3 = { before: h0, after: await C((c) => c._state.hall.on) }; ok.g3 = R.g3.before !== R.g3.after;
// (h) arrastar (girar a cabeça) não caminha
await C((c) => { c.setWalkPose(9, 47.5, 0, 0); c._walk.update(0.05); }); const y0 = (await C((c) => c.getWalkPose())).yaw;
await page.mouse.move(700, 450); await page.mouse.down(); await page.mouse.move(900, 450, { steps: 10 }); await page.mouse.up();
R.h = { dyaw: +((await C((c) => c.getWalkPose())).yaw - y0).toFixed(2), walking: (await pose()).walking }; ok.h = R.h.dyaw > 0.5 && !R.h.walking;
// (i) bonequinho: arrasta até o hall, realça e mostra o nome; soltar no HUD cancela
await exitWalk();
const peg = () => C((c) => { const r = c._pegBtn.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; });
let [bx, by] = await peg(); const [tx, ty] = await proj(page, 11.3, 0, 46.8);
await page.mouse.move(bx, by); await page.mouse.down(); await page.mouse.move(bx - 80, by + 100, { steps: 4 }); await page.mouse.move(tx, ty, { steps: 6 }); await page.waitForTimeout(500);
R.i1 = await C((c) => ({ tip: c._pegTip.textContent, ghost: !c._pegGhost.hidden, hl: c._hl.visible })); await page.screenshot({ path: `${OUT}/street_bonequinho.png` });
await page.mouse.up(); await page.waitForTimeout(800); R.i2 = await C((c) => ({ walk: c._walkOn, pose: c.getWalkPose(), free: c._navFree(c._walk.pos.x, c._walk.pos.z) }));
ok.i = R.i1.tip === 'Hall de entrada' && R.i1.ghost && R.i2.walk && R.i2.free && R.i2.pose.x > 4 && R.i2.pose.x < 16 && R.i2.pose.z > 44;
await exitWalk();
[bx, by] = await peg(); await page.mouse.move(bx, by); await page.mouse.down(); await page.mouse.move(bx - 200, by + 4, { steps: 5 }); await page.mouse.move(700, 30, { steps: 4 }); await page.mouse.up(); await page.waitForTimeout(400);
R.i3 = await C((c) => ({ walk: c._walkOn, ghost: !c._pegGhost.hidden })); ok.i3 = !R.i3.walk && !R.i3.ghost;
// (j) toque (eventos de ponteiro do tipo touch): arrasta o bonequinho até a plateia (a mira fica acima do dedo)
R.j = await C((c, [x, y]) => {
  const b = c._pegBtn, r = b.getBoundingClientRect(), o = { pointerId: 7, pointerType: 'touch', isPrimary: true, bubbles: true, composed: true, cancelable: true, button: 0 };
  b.dispatchEvent(new PointerEvent('pointerdown', { ...o, clientX: r.left + 10, clientY: r.top + 10 }));
  b.dispatchEvent(new PointerEvent('pointermove', { ...o, clientX: r.left - 60, clientY: r.top + 80 }));
  b.dispatchEvent(new PointerEvent('pointermove', { ...o, clientX: x, clientY: y + 56 }));
  const tip = c._pegTip.textContent;
  b.dispatchEvent(new PointerEvent('pointerup', { ...o, clientX: x, clientY: y + 56 }));
  return { tip, walk: c._walkOn, pose: c.getWalkPose() };
}, await proj(page, 10.5, 0, 20.0));
ok.j = R.j.walk && R.j.tip === 'Plateia' && R.j.pose.x > 5 && R.j.pose.x < 16 && R.j.pose.z > 12.4 && R.j.pose.z < 44;
// (k) Vista de cima → cômodo → "Entrar aqui"
await exitWalk();
await C((c) => c.setTopNav('ala', 'wc_fem')); await page.waitForTimeout(4000);
R.k1 = await C((c) => ({ enter: !c._enterBtn.hidden, mezz: c._mezz.visible })); await C((c) => c._enterBtn.click()); await page.waitForTimeout(1000);
R.k2 = await C((c) => ({ walk: c._walkOn, pose: c.getWalkPose(), free: c._navFree(c._walk.pos.x, c._walk.pos.z), room: (c._roomAt(c._walk.pos.x, c._walk.pos.z, false) || {}).id }));
ok.k = R.k1.enter && !R.k1.mezz && R.k2.walk && R.k2.free && R.k2.room === 'wc_fem';
await C((c) => c.setTopNav('ala')); await page.waitForTimeout(800); R.k3 = await C((c) => ({ enterHidden: c._enterBtn.hidden })); ok.k3 = R.k3.enterHidden === true;
// (l) "Ir para…" dentro do modo Pessoa: lista os cômodos e leva à salinha do mezanino
await exitWalk(); await C((c) => c.setWalk(true)); await page.waitForTimeout(500);
R.l1 = await C((c) => { c._gotoBtn.click(); return { open: !c._gotoPanel.hidden, n: c._gotoPanel.querySelectorAll('.grow button').length, mezz: [...c._gotoPanel.querySelectorAll('button')].some((b) => /Mezanino/.test(b.textContent)) }; });
await C((c) => { [...c._gotoPanel.querySelectorAll('button')].find((b) => /Mezanino/.test(b.textContent)).click(); }); await page.waitForTimeout(500);
R.l2 = await C((c) => ({ pose: c.getWalkPose(), open: !c._gotoPanel.hidden }));
ok.l = R.l1.open && R.l1.mezz && R.l1.n >= 20 && R.l2.pose.up && Math.abs(R.l2.pose.y - 4.65) < 0.02 && !R.l2.open;
await C((c) => { [...c._gotoBtn.parentNode.querySelectorAll('button')]; c._gotoBtn.click(); [...c._gotoPanel.querySelectorAll('button')].find((b) => /^Plateia/.test(b.textContent)).click(); }); await page.waitForTimeout(400);
R.l3 = await C((c) => ({ pose: c.getWalkPose(), free: c._navFree(c._walk.pos.x, c._walk.pos.z) })); ok.l3 = !R.l3.pose.up && R.l3.pose.x > 5 && R.l3.pose.x < 16 && R.l3.free;
// (m) v1.5.1: porta do WC Feminino de volta na parede do hall dos banheiros (z = 44,3); a parede do hall de entrada (x = 16,05, z 48,35) é lisa;
//     a porta PM01 do pátio foi para a parede x = 16,05 (z 11,25–12,15) e a parede z = 11 ficou lisa; ela abre para a pessoa
R.m = await C((c) => {
  const f = (ax, cc, a) => c._doors.find((d) => d.axis === ax && Math.abs(d.c - cc) < 0.02 && Math.abs(d.a - a) < 0.02);
  const wc = f('x', 44.3, 16.25), hall = f('z', 16.05, 48.35), pm = f('z', 16.05, 11.25), old = f('x', 11.0, 16.15), ex = f('x', 44.0, 13.4);
  return { wc: wc && wc.kind, hall: !!hall, pm: pm && pm.kind, old: !!old, exitDoor: !!ex };
});
ok.m = R.m.wc === 'swing' && !R.m.hall && R.m.pm === 'swing' && !R.m.old && !R.m.exitDoor;
await C((c) => { c.setWalkPose(16.7, 43.6, Math.PI, 0); c._walk.update(0.05); }); await step(2.5); R.m2 = await C((c) => { const d = c._doors.find((q) => q.axis === 'x' && Math.abs(q.c - 44.3) < 0.02 && Math.abs(q.a - 16.25) < 0.02); return { q: +d.q.toFixed(2) }; }); ok.m2 = R.m2.q > 0.5;
await C((c) => { c.setWalkPose(15.35, 11.7, -Math.PI / 2, 0); c._walk.update(0.05); }); await step(2.5); R.m3 = await C((c) => { const d = c._doors.find((q) => q.axis === 'z' && Math.abs(q.c - 16.05) < 0.02 && Math.abs(q.a - 11.25) < 0.02); return { q: +d.q.toFixed(2) }; }); ok.m3 = R.m3.q > 0.5;
// (n) Vista de cima esconde o mezanino; Pessoa/órbita mostram
R.n = await C((c) => { c.setWalk(false); c._start(); return null; }); await page.waitForFunction(() => document.querySelector('igreja3d-card')._camera.position.y > 8, null, { timeout: 90000 }); await S(300);
R.n1 = await C((c) => { c._setTopView(true, true); return c._mezz.visible; }); R.n2 = await C((c) => { c._setTopView(false, true); return c._mezz.visible; }); ok.n = R.n1 === false && R.n2 === true;
R.errs = t.errs; ok.errs = t.errs.length === 0; R.ok = ok; R.pass = Object.values(ok).every(Boolean);
console.log(JSON.stringify(R, null, 1)); await t.close();
