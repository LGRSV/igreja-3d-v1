// Visão de pessoa (v1.4): colisão nas paredes, portas, arrastar, toque, joystick, voo do ar ignorado, Esc.
// Uso: THREE_LOCAL=<three.module.min.js> node tools/walk_test.mjs <index.html>  (o tempo é simulado com _walk.update para não depender da velocidade do SwiftShader)
import { open, proj } from './lib.mjs';
const [,, html] = process.argv;
const t = await open(html); const { page, S, ev } = t; const R = {};
const C = (f, a) => page.evaluate(`(${f})(document.querySelector('igreja3d-card'), ${JSON.stringify(a)})`);
const pose = () => C((c) => { const p = c.getWalkPose(); return p && { x: +p.x.toFixed(3), y: +p.y.toFixed(3), z: +p.z.toFixed(3), yaw: +p.yaw.toFixed(3), pitch: +p.pitch.toFixed(3) }; });
const step = (sec, dt = 1 / 30) => C((c, a) => { for (let i = 0; i < Math.round(a[0] / a[1]); i++) c._walk.update(a[1]); }, [sec, dt]);
await ev(() => { const c = document.querySelector('igreja3d-card'); c._setPanel(false); });
await S(600);
await ev(() => document.querySelector('igreja3d-card')._stop());
// (a)
await C((c) => c.setWalk(true));
R.a = await C((c) => ({ walkOn: c._walkOn, topView: c._topView, orbitEnabled: c._orbit.enabled, joyVisible: !c._joy.hidden, focus: c.shadowRoot.activeElement === c._canvas, y: c._camera.position.y, near: c._camera.near }));
R.a.pose = await pose();
// (b)
await page.keyboard.down('KeyW'); await step(1); R.b1 = await pose();
await step(6); R.b2 = await pose();
R.b_door = await C((c) => c._state.porta && c._state.porta.state);
await page.keyboard.up('KeyW'); await step(0.6); R.b3 = await pose(); R.b_vel = await C((c) => c._walk.vel.length());
// (c) paredes
const walkTo = async (x, z, yaw, sec) => { await C((c, a) => c.setWalkPose(a[0], a[1], a[2]), [x, z, yaw]); await page.keyboard.down('KeyW'); await step(sec); await page.keyboard.up('KeyW'); await step(0.6); return pose(); };
R.c1 = await walkTo(15.0, 25.0, -Math.PI / 2, 4);          // x = 16,05 (parede da mídia/ala): não passa
R.c2 = await walkTo(2.0, 45.2, 0, 3);                       // z = 44,0 fora da porta
R.c3 = await walkTo(11.8, 45.0, 0, 3);                      // porta preta de 2 folhas do templo
R.c4 = await walkTo(5.0, 44.85, Math.PI / 2, 2);            // porta do WC (0,9 m)
R.c5 = await walkTo(18.0, 35.0, Math.PI / 2, 2);            // porta de 0,8 m do depósito
R.c6 = await walkTo(12.0, 52.0, 0, 2.5);                    // entra pela porta de vidro
// (d) arrastar
await ev(() => { const c = document.querySelector('igreja3d-card'); c.setWalkPose(9, 47.5, 0); c._walk.update(0.01); });
const y0 = (await pose()).yaw; const st0 = await C((c) => JSON.stringify(c._state));
await page.mouse.move(700, 450); await page.mouse.down(); await page.mouse.move(900, 450, { steps: 10 }); await page.mouse.up();
R.d1 = { dyaw: +((await pose()).yaw - y0).toFixed(3), stateSame: st0 === await C((c) => JSON.stringify(c._state)) };
await C((c) => { c.setWalkPose(9, 47.5, 1.135, 0.585); c._walk.update(0.01); c._camera.updateMatrixWorld(); });
const [px, py] = await proj(page, 7.5, 2.7, 46.8);
const h0 = await C((c) => c._state.hall.on);
await page.mouse.move(px, py); await page.mouse.down(); await page.mouse.up(); await page.waitForTimeout(1200);
R.d2 = { px: Math.round(px), py: Math.round(py), before: h0, after: await C((c) => c._state.hall.on) };
// (e) joystick
await C((c) => c.setWalkPose(12, 40, 0));
const jr = await C((c) => { const r = c._joy.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; });
await page.mouse.move(jr[0], jr[1]); await page.mouse.down(); await page.mouse.move(jr[0], jr[1] - 40, { steps: 4 });
const zj0 = (await pose()).z; await step(1); R.e1 = { dz: +(zj0 - (await pose()).z).toFixed(3) };
await page.mouse.up(); R.e_knob = await C((c) => c._joy.firstElementChild.style.transform); await step(0.5); R.e_vel = await C((c) => c._walk.vel.length());
// (g) voo do ar ignorado; sair
const p0 = await pose(); await C((c) => c._flyToAir('ac_midia')); R.g1 = { same: JSON.stringify(p0) === JSON.stringify(await pose()), walkOn: await C((c) => c._walkOn) };
R.h = await C((c) => ({ walls: c._walls.length, bad: c._walls.filter((w) => !(w.a1 - w.a0 > 0)).length }));
await page.keyboard.press('Escape'); R.esc = await C((c) => ({ walkOn: c._walkOn, orbit: c._orbit.enabled, near: c._camera.near, joy: !c._joy.hidden }));
await ev(() => document.querySelector('igreja3d-card')._start()); await S(1500);
R.g2 = await C((c) => ({ near: c._camera.near, dist: +c._camera.position.distanceTo(c._walkSaved.pos).toFixed(2), panel: c._panelOpen }));
R.errs = t.errs; console.log(JSON.stringify(R, null, 1)); await t.close();
