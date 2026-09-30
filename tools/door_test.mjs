// Portas do modo Pessoa (v1.4.5): abrem sozinhas na frente da pessoa, fecham depois, clique/toque/Enter, prefers-reduced-motion, sem redesenho parado.
// Uso: THREE_LOCAL=<three.module.min.js> OUT=<pasta-dos-png> node tools/door_test.mjs <index.html>
// O tempo da animação é simulado (_doorsTick com dt fixo); só o atraso de 2,5 s para fechar usa o relógio real.
import { open, proj } from './lib.mjs';
const [,, html] = process.argv; const OUT = process.env.OUT || '.';
const t = await open(html); const { page, S, ev } = t; const R = {};
const C = (f, a) => page.evaluate(`(${f})(document.querySelector('igreja3d-card'), ${JSON.stringify(a)})`);
const shot = (n) => page.screenshot({ path: `${OUT}/door_${n}.png` });
const dinfo = (axis, c, a) => C((k, [ax, cc, aa]) => { const d = k._doors.find((q) => q.axis === ax && Math.abs(q.c - cc) < 0.02 && Math.abs(q.a - aa) < 0.02); return d && { kind: d.kind, q: +d.q.toFixed(3), p: +d.p.toFixed(3), target: d.target, side: d.side, open: +d.open.toFixed(3), slide: +d.slideLen.toFixed(2), max: d.max, dist: +d.dist.toFixed(2), moving: d.moving }; }, [axis, c, a]);
// põe a pessoa em (x, z, yaw), roda o walker 1 quadro e `sec` segundos de portas (dt fixo)
const at = (x, z, yaw, sec = 0) => C((k, [x, z, yaw, sec]) => { k.setWalkPose(x, z, yaw); k._walk.update(0.001); let mv = false; for (let i = 0; i < Math.round(sec * 30); i++) mv = k._doorsTick(1 / 30) || mv; return mv; }, [x, z, yaw, sec]);
const tick = (sec) => C((k, s) => { let mv = false; for (let i = 0; i < Math.round(s * 30); i++) mv = k._doorsTick(1 / 30) || mv; return mv; }, sec);
const draw = () => C((k) => { k._walk.update(0.001); k._orbit.dirty = true; k._frame(); });
await ev(() => document.querySelector('igreja3d-card')._setPanel(false)); await S(600);
await ev(() => document.querySelector('igreja3d-card')._stop());
// (a) inventário: instâncias por material, matrizes fechadas guardadas para comparar depois
R.a = await C((k) => {
  const D = k._doors.filter((d) => d.kind !== 'main');
  k.__closed = k._doorMeshes.map((m) => Array.from(m.instanceMatrix.array));
  const kinds = {}; for (const d of D) kinds[d.kind] = (kinds[d.kind] || 0) + 1;
  return { total: k._doors.length, kinds, main: k._doors.filter((d) => d.kind === 'main').length, meshes: k._doorMeshes.length, inst: k._doorMeshes.map((m) => m.count),
    lowMax: D.filter((d) => d.kind === 'swing' || d.kind === 'double').filter((d) => Math.max(d.max[-1], d.max[1]) < 0.87).map((d) => [d.axis, d.c, d.a, +d.max[-1].toFixed(2), +d.max[1].toFixed(2)]),
    slides: D.filter((d) => d.kind === 'slide').map((d) => [d.axis, d.c, d.a, +d.slideLen.toFixed(2)]) };
});
R.calls0 = await C((k) => { k._renderer.info.reset(); k._orbit.dirty = true; k._frame(); return k._renderer.info.render.calls; });
await shot('00_normal');
// (b) porta de madeira (z = 9,25, x 11,8–12,6): a pessoa vem do hall (z maior) para a sala da recepção
await C((k) => k.setWalk(true));
await at(12.2, 11.4, 0, 0.5); R.b0 = await dinfo('x', 9.25, 11.8);   // 2,15 m: longe
await draw(); await shot('01_madeira_fechada');
await at(12.2, 10.6, 0, 0.35); R.b1 = await dinfo('x', 9.25, 11.8);
await draw(); await shot('02_madeira_abrindo');
await tick(1); R.b2 = await dinfo('x', 9.25, 11.8);
await draw(); await shot('03_madeira_aberta');
await at(12.2, 8.4, 0, 0.5); R.b3 = await dinfo('x', 9.25, 11.8);   // atravessou: fica aberta (ela está do outro lado, a 0,85 m)
await draw(); await shot('04_madeira_atravessando');
await at(12.2, 5.5, 0, 0.2); await page.waitForTimeout(2700); await tick(0.2);   // longe: espera o atraso real e a porta começa a fechar
R.b4 = await dinfo('x', 9.25, 11.8);
await draw(); await shot('05_madeira_fechando');
await tick(1.2); R.b5 = await dinfo('x', 9.25, 11.8);
await draw(); await shot('06_madeira_fechada_depois');
// (c) porta preta de correr do templo (x = 16,05, z 34,2–35,1): a pessoa vem do templo
await at(14.4, 34.65, -Math.PI / 2, 0.2); R.c0 = await dinfo('z', 16.05, 34.2);
await draw(); await shot('07_correr_fechada');
await at(14.6, 34.65, -Math.PI / 2, 0.45); R.c1 = await dinfo('z', 16.05, 34.2);
await draw(); await shot('08_correr_abrindo');
await tick(1); R.c2 = await dinfo('z', 16.05, 34.2);
await draw(); await shot('09_correr_aberta');
// (d) porta preta de 2 folhas do templo para o hall (z = 44, x 10,6–13,1)
await at(11.85, 42.2, Math.PI, 0.2);
await tick(1.3); R.d1 = await dinfo('x', 44.0, 10.6);
await draw(); await shot('10_duasfolhas_aberta');
await at(11.85, 45.5, 0, 0.2); await tick(1.3);   // do outro lado, olhando de volta
await draw(); await shot('11_duasfolhas_de_tras');
// (e) porta principal de vidro (z = 49,65)
await at(12.0, 52.0, 0, 0.5); R.e0 = await C((k) => ({ pOpen: k._items.get('porta').pOpen || 0, rot: k._items.get('porta').leaves.map((l) => +l.g.rotation.y.toFixed(3)) }));
await draw(); await shot('12_principal_fechada');
await at(12.0, 51.0, 0, 0.35); await draw(); await shot('13_principal_abrindo');
await tick(1); await draw(); await shot('14_principal_aberta');
R.e1 = await C((k) => { const rt = k._items.get('porta'); return { pOpen: +(rt.pOpen || 0).toFixed(3), rot: rt.leaves.map((l) => +l.g.rotation.y.toFixed(3)), entity: k._state.porta && k._state.porta.state, level: rt.level }; });
// (f) clique na folha (madeira) + Enter/F
await at(12.2, 12.5, 0, 0.1);
await page.waitForTimeout(2700); await tick(3); R.f0 = await dinfo('x', 9.25, 11.8);
await C((k) => { k.__d = k._doors.find((q) => q.axis === 'x' && Math.abs(q.c - 9.25) < 0.02 && Math.abs(q.a - 11.8) < 0.02); });
await C((k) => { k.setWalkPose(12.2, 10.9, 0); k._walk.update(0.001); k._doorsTick(0.001); k.__d.suppress = true; k._camera.updateMatrixWorld(); });   // 1,65 m, de frente: suprimida para não abrir sozinha
const [px, py] = await proj(page, 12.2, 1.0, 9.25);
await draw(); await shot('15_antes_do_clique');
await page.mouse.move(px, py); await page.mouse.down(); await page.mouse.up(); await page.waitForTimeout(300);
R.f1 = await dinfo('x', 9.25, 11.8);   // clique em porta fechada: abre
await tick(1); R.f2 = await dinfo('x', 9.25, 11.8);
await page.mouse.move(px, py); await page.mouse.down(); await page.mouse.up(); await page.waitForTimeout(300);   // clique de novo: fecha
await tick(1.2); R.f3 = await dinfo('x', 9.25, 11.8);
await C((k) => { k.setWalkPose(12.2, 10.5, 0); k._walk.update(0.001); k._doorsTick(0.001); k.__d.suppress = true; });
await page.keyboard.press('Enter'); await tick(1); R.f4 = await dinfo('x', 9.25, 11.8);   // Enter abre
await page.keyboard.press('KeyF'); await tick(1.2); R.f5 = await dinfo('x', 9.25, 11.8);   // F fecha
// (g) reduced-motion: abre instantâneo
await C((k) => { k._reduced = true; k.__d.suppress = false; });
await at(12.2, 10.5, 0, 0.05); R.g1 = await dinfo('x', 9.25, 11.8);
await C((k) => { k._reduced = false; });
// (h) sem redesenho parado: com tudo assentado, as portas não pedem quadros
await tick(1); await page.waitForTimeout(2700); await tick(3);
R.h = await C((k) => { k._doors.forEach((d) => { d.suppress = false; }); k._walk.update(0.001); const mv = k._doorsTick(1 / 30); return { moving: mv, open: k._doors.filter((d) => d.q > 0).length }; });
// (i) sair: tudo fechado e idêntico ao original
await at(12.2, 10.5, 0, 0.6);
R.i0 = await C((k) => k._doors.filter((d) => d.q > 0).length);
await page.keyboard.press('Escape');
R.i = await C((k) => ({ walkOn: k._walkOn, open: k._doors.filter((d) => d.q > 0 || d.target).length, same: k._doorMeshes.every((m, i) => { const a = m.instanceMatrix.array, b = k.__closed[i]; for (let j = 0; j < a.length; j++) if (Math.abs(a[j] - b[j]) > 1e-6) return false; return true; }), pOpen: k._items.get('porta').pOpen }));
// (j) todas as portas de giro: na abertura máxima, a folha não cruza parede (planta)
R.j = await C((k) => {
  const bad = [];
  for (const d of k._doors) {
    if (d.kind !== 'swing' && d.kind !== 'double') continue;
    for (const s of [-1, 1]) for (const l of d.leaves) {
      const th = d.max[s]; if (th <= 0) continue;
      const P = (r) => (d.axis === 'x' ? [l.u + l.dirU * Math.cos(th) * r, d.c + s * Math.sin(th) * r] : [d.c - s * Math.sin(th) * r, l.u + l.dirU * Math.cos(th) * r]);
      const p0 = P(0.05), p1 = P(l.len);
      for (const w of k._walls) {
        if (w.axis === d.axis && Math.abs(w.c - d.c) < 0.02) continue;
        const bx0 = w.axis === 'x' ? w.a0 : w.c - w.t / 2, bx1 = w.axis === 'x' ? w.a1 : w.c + w.t / 2, bz0 = w.axis === 'x' ? w.c - w.t / 2 : w.a0, bz1 = w.axis === 'x' ? w.c + w.t / 2 : w.a1;
        for (let f = 0; f <= 1; f += 0.05) { const x = p0[0] + (p1[0] - p0[0]) * f, z = p0[1] + (p1[1] - p0[1]) * f; if (x > bx0 + 0.01 && x < bx1 - 0.01 && z > bz0 + 0.01 && z < bz1 - 0.01) { bad.push([d.axis, d.c, d.a, s, w.axis, w.c]); break; } }
      }
    }
  }
  return { n: k._doors.length, badN: bad.length, bad: bad.slice(0, 8) };
});
R.errs = t.errs; R.logs = t.logs; console.log(JSON.stringify(R, null, 1)); await t.close();
