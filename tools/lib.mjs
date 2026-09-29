// Utilidades dos testes headless da v1.4 (Chromium + SwiftShader). THREE_LOCAL=/caminho/three.module.min.js serve o Three.js sem rede;
// PLAYWRIGHT=/caminho/playwright/index.mjs indica o Playwright (padrão: o pacote `playwright` do Node).
import { readFileSync, existsSync } from 'fs'; import { resolve } from 'path'; import { pathToFileURL } from 'url';
const pwPath = process.env.PLAYWRIGHT || (existsSync('/opt/node22/lib/node_modules/playwright/index.mjs') ? '/opt/node22/lib/node_modules/playwright/index.mjs' : 'playwright');
const { chromium } = await import(pwPath.startsWith('/') ? pathToFileURL(pwPath).href : pwPath);
export async function open(html, { w = 1400, h = 900, touch = false, settle = true } = {}) {
  const THREE_JS = readFileSync(process.env.THREE_LOCAL);
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, hasTouch: touch, isMobile: touch, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  const errs = [], logs = [];
  page.on('pageerror', (e) => errs.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); else if (/governador|PC lento|malhas/.test(m.text())) logs.push(m.text()); });
  await page.route(/cdn\.jsdelivr\.net\/npm\/three@/, (r) => r.fulfill({ body: THREE_JS, contentType: 'text/javascript' }));
  await page.route(/api\.open-meteo\.com/, (r) => r.fulfill({ body: '{}', contentType: 'application/json' }));
  await page.goto('file://' + resolve(html));
  await page.waitForFunction(() => { const c = document.querySelector('igreja3d-card'); return c && c._renderer && c._renderer.info.render.frame > 0; }, null, { timeout: 180000 });
  const S = async (ms = 400) => { await page.waitForTimeout(500); await page.waitForFunction(() => { const c = document.querySelector('igreja3d-card'); return !c._busy && !c._orbit.moving && !c._lowRes && !(c._walk && c._walkOn && c._walk.moving); }, null, { timeout: 240000, polling: 200 }); await page.waitForTimeout(ms); };
  if (settle) await S(1500);
  const ev = (f, a) => page.evaluate(f, a);
  return { browser, page, errs, logs, S, ev, close: () => browser.close() };
}
// projeta um ponto do mundo para a tela (px)
export const proj = (page, x, y, z) => page.evaluate(([x, y, z]) => {
  const c = document.querySelector('igreja3d-card'), cam = c._camera; cam.updateMatrixWorld();
  const v = cam.position.clone().set(x, y, z).project(cam), r = c._canvas.getBoundingClientRect();
  return [(v.x + 1) / 2 * r.width + r.left, (1 - v.y) / 2 * r.height + r.top];
}, [x, y, z]);
export async function clickAt(page, x, y, z) { const [px, py] = await proj(page, x, y, z); await page.mouse.move(px, py); await page.mouse.down(); await page.mouse.up(); return [px, py]; }
