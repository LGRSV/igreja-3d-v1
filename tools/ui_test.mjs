// Menu ☰ Opções e painel lateral (v1.6.0): abre/fecha (clique, Esc, clique fora, teclado), Esc do menu não sai da Pessoa nem volta na Vista de cima,
// cada item funciona e mostra o estado, painel abre/recolhe/reabre, cena enquadrada à esquerda do painel, gaveta do celular (véu, arrastar com o dedo
// via CDP: 1:1, decisão pela velocidade, rubber band, agarrar no meio da mola), sem rolagem horizontal, nada importante sobreposto, sem erros de JS.
// Uso: THREE_LOCAL=<three.module.min.js> OUT=<pasta-dos-png> node tools/ui_test.mjs <index.html>   (imprime o JSON; `pass` = tudo passou)
import { open, proj } from './lib.mjs';
const [,, html] = process.argv; const OUT = process.env.OUT || '.';
const R = {}, ok = {};
const hit = (a, b) => !!(a && b && a.w && b.w && a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h);
const near = (a, b, d) => Math.abs(a - b) <= d;

// ---------------- desktop 1400 × 900 ----------------
{
  const t = await open(html); const { page, S } = t;
  const C = (f, a) => page.evaluate(`(${f})(document.querySelector('igreja3d-card'), ${JSON.stringify(a === undefined ? null : a)})`);
  const rect = (sel) => C((c, s) => { const e = c.shadowRoot.querySelector(s); if (!e || e.hidden) return null; const r = e.getBoundingClientRect(); return r.width ? { x: r.x, y: r.y, w: r.width, h: r.height } : null; }, sel);
  const card = page.locator('igreja3d-card'), mbtn = card.locator('.menubtn');
  const item = (label) => card.locator('.menu button', { hasText: new RegExp('^' + label + '[↺›]?$') }).first();   // ações de um disparo têm o atalho ↺/› à direita
  const st = () => C((c) => ({ open: !!c._menuOn, vis: !c._menu.hidden, exp: c._menuBtn.getAttribute('aria-expanded'), walk: !!c._walkOn, top: !!c._topView, lvl: c.getTopNav().level, panel: !!c._panelOpen, act: (c.shadowRoot.activeElement || {}).className || '' }));
  const settle = () => page.waitForFunction(() => { const c = document.querySelector('igreja3d-card'); return !c._dockRaf; }, null, { timeout: 30000 });
  await C((c) => { c._setTopView(false); c._setPanel(true); }); await settle(); await S(300);   // v1.6.1: o cartão abre na Vista de cima
  // (a) abre no clique, fecha no Esc, no clique fora (canvas) e de novo no botão; aria-haspopup/expanded
  R.a0 = { ...(await st()), haspopup: await C((c) => c._menuBtn.getAttribute('aria-haspopup')), controls: await C((c) => !!c.shadowRoot.getElementById(c._menuBtn.getAttribute('aria-controls'))) };
  await mbtn.click(); R.a1 = await st();
  await page.keyboard.press('Escape'); R.a2 = await st();
  await mbtn.click(); await page.mouse.click(300, 450); R.a3 = await st();
  await mbtn.click(); await mbtn.click(); R.a4 = await st();
  ok.a = R.a0.haspopup === 'true' && R.a0.controls && R.a1.open && R.a1.vis && R.a1.exp === 'true' && !R.a2.open && !R.a2.vis && R.a2.exp === 'false' && !R.a3.open && !R.a4.open;
  // (b) teclado: Enter no botão abre com o foco no 1º item, ↓ anda, End vai ao último, Esc fecha e devolve o foco ao botão
  await C((c) => c._menuBtn.focus()); await page.keyboard.press('Enter');
  R.b1 = { ...(await st()), first: await C((c) => c.shadowRoot.activeElement === c._modeBtns.auto) };
  await page.keyboard.press('ArrowDown'); R.b2 = await C((c) => c.shadowRoot.activeElement === c._modeBtns.day);
  await page.keyboard.press('End'); R.b3 = await C((c) => c.shadowRoot.activeElement === c._panelBtn);
  await page.keyboard.press('Escape'); R.b4 = { ...(await st()), back: await C((c) => c.shadowRoot.activeElement === c._menuBtn) };
  ok.b = R.b1.open && R.b1.first && R.b2 && R.b3 && !R.b4.open && R.b4.back;
  // (c) cada item funciona e mostra o estado (aria-pressed e aria-checked)
  const pr = (k) => C((c, k) => { const b = c[k]; return [b.getAttribute('aria-pressed'), b.getAttribute('aria-checked')]; }, k);
  await mbtn.click();
  await item('Noite').click(); R.c1 = { mode: await C((c) => c._mode), night: await C((c) => [c._modeBtns.night.getAttribute('aria-pressed'), c._modeBtns.night.getAttribute('aria-checked'), c._modeBtns.auto.getAttribute('aria-checked')]) };
  const nv0 = await C((c) => c._nightVision); await item('Visão noturna').click(); R.c2 = { before: nv0, after: await C((c) => c._nightVision), pr: await pr('_nvBtn') };
  await item('Visão noturna').click(); await item('Dia').click(); R.c3 = { mode: await C((c) => c._mode), nvDisabled: await C((c) => c._nvBtn.disabled) }; await item('Auto').click();
  const lb0 = await C((c) => c._labelsOn); await item('Rótulos').click(); R.c4 = { before: lb0, after: await C((c) => c._labelsOn), pr: await pr('_labelsBtn') }; await item('Rótulos').click();
  await item('Fachada').click(); R.c5 = { roof: await C((c) => !!c._roofOn), pr: await pr('_roofBtn') }; await item('Fachada').click();
  await item('Vista de cima').click(); await S(); R.c6 = { top: await C((c) => !!c._topView), pr: await pr('_topBtn'), menuOpen: (await st()).open };
  await item('Recentrar').click(); await S(); R.c7 = { top: await C((c) => !!c._topView), lvl: (await st()).lvl, menuOpen: (await st()).open };   // v1.6.1: Recentrar = Vista de cima, nível 0
  await C((c) => c._setTopView(false)); await settle();   // sair da Vista de cima devolve o painel lateral
  await mbtn.click(); await item('Painel lateral').click(); await settle(); R.c8 = { panel: await C((c) => c._panelOpen), pr: await pr('_panelBtn'), dockHidden: await C((c) => c._dock.hidden) };
  await item('Painel lateral').click(); await settle(); R.c8b = { panel: await C((c) => c._panelOpen), pr: await pr('_panelBtn'), dockHidden: await C((c) => c._dock.hidden) };
  await item('Ir para um ambiente…').click(); R.c9 = { goto: await C((c) => !c._gotoPanel.hidden), menuOpen: (await st()).open }; await C((c) => c._toggleGoto(false));
  await mbtn.click(); await item('Pessoa').click(); await S(); R.c10 = { ...(await st()), pr: await pr('_walkBtn'), gotoBtn: await C((c) => !c._gotoBtn.hidden), peg: await C((c) => !c._pegBtn.hidden) };
  ok.c = R.c1.mode === 'night' && R.c1.night.join() === 'true,true,false' && R.c2.before !== R.c2.after && R.c2.pr[0] === R.c2.pr[1] && R.c3.mode === 'day' && R.c3.nvDisabled
    && R.c4.before !== R.c4.after && R.c4.pr[0] === String(R.c4.after) && R.c4.pr[1] === R.c4.pr[0] && R.c5.roof && R.c5.pr.join() === 'true,true'
    && R.c6.top && R.c6.pr.join() === 'true,true' && R.c6.menuOpen && R.c7.top && R.c7.lvl === 0 && !R.c7.menuOpen && !R.c8.panel && R.c8.pr.join() === 'false,false' && R.c8.dockHidden && R.c8b.panel && R.c8b.pr.join() === 'true,true' && !R.c8b.dockHidden
    && R.c9.goto && !R.c9.menuOpen && R.c10.walk && !R.c10.open && R.c10.pr.join() === 'true,true' && R.c10.gotoBtn && !R.c10.peg;
  // (d) Esc com o menu aberto: na Pessoa só fecha o menu (o 2º Esc sai); na Vista de cima (nível 2) só fecha o menu (o 2º Esc volta um nível)
  await C((c) => { c._canvas.focus(); c._menuSet(true); }); await page.keyboard.press('Escape'); R.d1 = await st();
  await C((c) => c._canvas.focus()); await page.keyboard.press('Escape'); await S(); R.d2 = await st();
  await C((c) => c.setTopNav('ala', 'midia')); await S(); await C((c) => { c._canvas.focus(); c._menuSet(true); }); await page.keyboard.press('Escape'); R.d3 = await st();
  await page.keyboard.press('Escape'); await S(); R.d4 = await st();
  ok.d = R.d1.walk && !R.d1.open && !R.d2.walk && R.d3.top && R.d3.lvl === 2 && !R.d3.open && R.d4.lvl === 1;
  // (e) painel: recolher (→), aba de reabrir na borda direita com o número de luzes acesas, reabrir
  await C((c) => c._setTopView(false)); await C((c) => c._setPanel(true)); await settle(); await S(300);
  await card.locator('.phead .collapse').click(); await settle(); await page.waitForTimeout(800);   // a aba entra deslizando (~0,3 s)
  R.e1 = { panel: await C((c) => c._panelOpen), hidden: await C((c) => c._dock.hidden), reopen: await rect('.reopen'), rn: await C((c) => c._reopen.querySelector('.rn').textContent), lights: await C((c) => Object.entries(c._state).filter(([k, s]) => s.on && c._tiles[k] && c._tiles[k].it.kind === 'light').length) };
  await card.locator('.reopen').click(); await settle(); await S(400);
  R.e2 = { panel: await C((c) => c._panelOpen), x: await C((c) => c._dockX), reopenHidden: await C((c) => c._reopen.hidden) };
  ok.e = !R.e1.panel && R.e1.hidden && R.e1.reopen && near(R.e1.reopen.x + R.e1.reopen.w, 1400, 1) && R.e1.rn === String(R.e1.lights) && R.e2.panel && R.e2.x === 0 && R.e2.reopenHidden;
  // (f) cena enquadrada à esquerda do painel: o centro da igreja e da planta caem fora da coluna (painel fechado: perto do meio da tela)
  const dock = await rect('.dock');
  R.f1 = { dockX: dock.x, center: (await proj(page, 10, 0, 30)).map(Math.round) };
  await C((c) => c._setTopView(true)); await S(); R.f2 = (await proj(page, 7, 0, 28.2)).map(Math.round);
  R.f3 = await C((c) => c._panelOpen);   // v1.6.1: na Vista de cima o painel lateral recolhe (o do cômodo fica à esquerda)
  await C((c) => c._setTopView(false)); await C((c) => c._setPanel(false)); await settle(); await S(); R.f4 = (await proj(page, 10, 0, 30)).map(Math.round);
  ok.f = R.f1.center[0] < dock.x - 40 && near(R.f2[0], 700, 60) && !R.f3 && Math.abs(R.f4[0] - 700) < 140 && R.f1.center[0] < R.f4[0] - 80;
  await page.screenshot({ path: `${OUT}/ui_desk_fechado.png` });
  // (g) sobreposições: botão ☰ × título × trilha; menu aberto × título; trilha × painel; "Ir para…" × painel; sem rolagem horizontal
  await C((c) => c._setPanel(true)); await settle(); await C((c) => c.setTopNav('ala', 'midia')); await S();
  const G = { title: await rect('.title'), btns: await rect('.btns'), nav: await rect('.nav'), dock: await rect('.dock'), room: await rect('.room') };
  await mbtn.click(); G.menu = await rect('.menu'); await page.screenshot({ path: `${OUT}/ui_desk_menu_planta.png` }); await page.keyboard.press('Escape');
  await C((c) => { c._setTopView(false); c.setWalk(true); c._toggleGoto(true); }); await S();
  await page.waitForTimeout(500);
  G.goto = await rect('.goto'); G.joy = await rect('.joy'); G.walkPanel = await C((c) => c._panelOpen);
  await page.screenshot({ path: `${OUT}/ui_desk_pessoa_goto.png` });
  G.scroll = await C((c) => ({ doc: document.documentElement.scrollWidth - window.innerWidth, panes: [...c.shadowRoot.querySelectorAll('.pane')].map((p) => p.scrollWidth - p.clientWidth), menu: c._menu.scrollWidth - c._menu.clientWidth }));
  R.g = G;
  ok.g = !hit(G.btns, G.title) && !hit(G.btns, G.nav) && !hit(G.menu, G.title) && !hit(G.menu, G.nav) && !hit(G.nav, G.dock) && !hit(G.goto, G.dock) && G.room && !hit(G.room, G.nav) && G.walkPanel
    && G.joy && !hit(G.goto, G.joy) && G.scroll.doc <= 0 && G.scroll.panes.every((d) => d <= 0) && G.scroll.menu <= 0;
  await C((c) => { c._toggleGoto(false); c.setWalk(false); }); await S();
  R.errsDesk = t.errs; ok.errsDesk = !t.errs.length;
  await t.close();
}

// ---------------- celular 390 × 844 (toque) ----------------
{
  const t = await open(html, { w: 390, h: 844, touch: true }); const { page, S } = t;
  const C = (f, a) => page.evaluate(`(${f})(document.querySelector('igreja3d-card'), ${JSON.stringify(a === undefined ? null : a)})`);
  const rect = (sel) => C((c, s) => { const e = c.shadowRoot.querySelector(s); if (!e || e.hidden) return null; const r = e.getBoundingClientRect(); return r.width ? { x: r.x, y: r.y, w: r.width, h: r.height } : null; }, sel);
  const settle = () => page.waitForFunction(() => !document.querySelector('igreja3d-card')._dockRaf, null, { timeout: 30000 });
  const cdp = await page.context().newCDPSession(page);
  // toque via CDP com a hora de cada evento explícita (dt em ms): a velocidade do gesto não depende da lentidão do SwiftShader
  let T = Date.now() / 1000; const touch = (type, x, y, dt = 16) => { T += dt / 1000; return cdp.send('Input.dispatchTouchEvent', { type, timestamp: T, touchPoints: type === 'touchEnd' ? [] : [{ x, y, id: 1 }] }); };
  const X = () => C((c) => +(c._dockX || 0).toFixed(1));
  // (h) começa recolhido (a gaveta cobriria a cena); a aba "Painel" abre; o véu cobre a cena e tocar nele fecha; câmera sem deslocamento lateral
  R.h0 = { panel: await C((c) => c._panelOpen), drawer: await C((c) => c._wrap.classList.contains('drawer')), reopen: await rect('.reopen') };
  await page.locator('igreja3d-card').locator('.reopen').tap(); await settle(); await S(300);
  R.h1 = { panel: await C((c) => c._panelOpen), dock: await rect('.dock'), scrim: await rect('.scrim'), hud: await rect('.hud.top'),
    view: await C((c) => { const v = c._camera.view; return v && v.enabled ? [v.fullWidth, v.offsetX] : null; }) };
  await page.screenshot({ path: `${OUT}/ui_mob_gaveta.png` });
  await page.touchscreen.tap(20, 600); await settle();
  R.h2 = { panel: await C((c) => c._panelOpen), dockHidden: await C((c) => c._dock.hidden), scrimHidden: await C((c) => c._scrim.hidden) };
  ok.h = !R.h0.panel && R.h0.drawer && R.h0.reopen && R.h1.panel && R.h1.dock && R.h1.dock.w <= 360 && R.h1.dock.x + R.h1.dock.w <= 390 && R.h1.scrim && near(R.h1.dock.y, R.h1.hud.y + R.h1.hud.h, 2)
    && (!R.h1.view || R.h1.view[0] === 390) && !R.h2.panel && R.h2.dockHidden && R.h2.scrimHidden;
  // o laço de quadros para (SwiftShader): o rAF da mola fica a 60 Hz e dá para pegar a gaveta no meio
  await C((c) => c._stop());
  // (i) arrastar para a direita segue o dedo 1:1 (depois dos ~10 px de limiar); devagar e soltando perto: volta aberta (mola)
  await C((c) => c._setPanel(true)); await settle(); const W = await C((c) => c._dockW());
  await touch('touchStart', 200, 500); const xs = [];
  for (let k = 1; k <= 8; k++) { await touch('touchMove', 200 + k * 10, 500, 60); xs.push(await X()); }
  await touch('touchMove', 281, 500, 250); await touch('touchEnd', 0, 0, 250);   // dedo quase parado antes de soltar
  R.i1 = { xs, after: await X() }; await settle(); R.i2 = { panel: await C((c) => c._panelOpen), x: await X() };
  const steps = xs.slice(2).map((x, k) => +(x - xs[k + 1]).toFixed(1));
  ok.i = xs[0] === 0 && steps.every((d) => near(d, 10, 0.6)) && R.i2.panel && R.i2.x === 0;
  // (j) decisão pela velocidade: um peteleco curto e rápido para a direita fecha; arrastar longe e devolver rápido para a esquerda mantém aberta
  await touch('touchStart', 200, 500); for (let k = 1; k <= 4; k++) await touch('touchMove', 200 + k * 18, 500); await touch('touchEnd');
  R.j1 = { panel: await C((c) => c._panelOpen) }; await settle(); R.j1.hidden = await C((c) => c._dock.hidden);
  await C((c) => c._setPanel(true)); await settle();
  await touch('touchStart', 60, 500); for (let k = 1; k <= 15; k++) await touch('touchMove', 60 + k * 20, 500, 40);
  for (let k = 1; k <= 4; k++) await touch('touchMove', 360 - k * 14, 500);
  R.j2 = { xBefore: await X() }; await touch('touchEnd'); await settle(); R.j2.panel = await C((c) => c._panelOpen); R.j2.x = await X();
  ok.j = !R.j1.panel && R.j1.hidden && R.j2.xBefore > W / 2 && R.j2.panel && R.j2.x === 0;
  // (k) além do aberto (para a esquerda) resiste: rubberband
  await touch('touchStart', 300, 500); for (let k = 1; k <= 10; k++) await touch('touchMove', 300 - k * 12, 500);
  R.k = { x: await X() }; await touch('touchMove', 181, 500, 300); await touch('touchEnd', 0, 0, 300); await settle(); R.k.end = await X();
  ok.k = R.k.x < -10 && R.k.x > -70 && R.k.end === 0;
  // (l) agarrar no meio da mola: interrompe onde está (sem pulo), segue o dedo dali, e soltar puxando para a esquerda reabre
  await C((c) => c._setPanel(false)); await page.waitForTimeout(70);
  await touch('touchStart', 330, 500); const xg = await X(); await page.waitForTimeout(200); const xg2 = await X();
  await touch('touchMove', 318, 500); await touch('touchMove', 306, 500); const xm = await X();
  for (let k = 1; k <= 4; k++) await touch('touchMove', 306 - k * 16, 500);
  await touch('touchEnd'); R.l = { xg, xg2, xm, raf: null }; await settle(); R.l.panel = await C((c) => c._panelOpen); R.l.x = await X(); R.l.hidden = await C((c) => c._dock.hidden);
  ok.l = R.l.xg > 5 && R.l.xg < W - 5 && near(R.l.xg, R.l.xg2, 0.5) && near(R.l.xm, R.l.xg - 12, 1) && R.l.panel && R.l.x === 0 && !R.l.hidden;
  await C((c) => c._start());
  // (m) menu no celular: ocupa a largura (10 px de cada lado) e rola; botões do topo não cobrem o título; sem rolagem horizontal
  await page.locator('igreja3d-card').locator('.menubtn').tap(); await page.waitForTimeout(800);   // o menu nasce com escala 0,96 → 1
  R.m = { menu: await rect('.menu'), title: await rect('.title'), btns: await rect('.btns'), over: await C((c) => getComputedStyle(c._menu).overflowY),
    scroll: await C((c) => ({ doc: document.documentElement.scrollWidth - window.innerWidth, menu: c._menu.scrollWidth - c._menu.clientWidth, panes: [...c.shadowRoot.querySelectorAll('.pane')].map((p) => p.scrollWidth - p.clientWidth) })) };
  await page.screenshot({ path: `${OUT}/ui_mob_menu.png` });
  await page.touchscreen.tap(200, 600); R.m.closed = await C((c) => !c._menuOn);
  ok.m = near(R.m.menu.x, 10, 1) && near(R.m.menu.x + R.m.menu.w, 380, 1) && R.m.menu.y + R.m.menu.h <= 844 && R.m.over === 'auto' && !hit(R.m.btns, R.m.title) && R.m.scroll.doc <= 0 && R.m.scroll.menu <= 0 && R.m.scroll.panes.every((d) => d <= 0) && R.m.closed;
  // (n) Pessoa no celular: a gaveta fecha, "Ir para…" à vista e a lista sem gaveta por cima
  await C((c) => c._setPanel(true)); await settle(); await C((c) => c.setWalk(true)); await S(); await C((c) => c._toggleGoto(true)); await page.waitForTimeout(300);
  R.n = { panel: await C((c) => c._panelOpen), gotoBtn: await rect('.btns > button:not(.peg):not(.menubtn)'), goto: await rect('.goto'), joy: await rect('.joy'), dock: await rect('.dock') };
  await page.screenshot({ path: `${OUT}/ui_mob_pessoa.png` });
  ok.n = !R.n.panel && R.n.gotoBtn && R.n.goto && !R.n.dock && !hit(R.n.goto, R.n.joy);
  R.errsMob = t.errs; ok.errsMob = !t.errs.length;
  await t.close();
}
R.ok = ok; R.pass = Object.values(ok).every(Boolean);
console.log(JSON.stringify(R, null, 1));
