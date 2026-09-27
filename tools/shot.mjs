// Screenshot da demo com Playwright (Chromium + SwiftShader) — para conferir o cartão sem GPU.
//
// Uso:   node tools/shot.mjs <index.html> <saida.png> [largura altura] ["JS avaliado depois de carregar"]
// Ex.:   node tools/shot.mjs index.html /tmp/vista.png 1400 900 'document.querySelector("igreja3d-card").setFachada(true)'
//
// Variáveis de ambiente:
//   THREE_LOCAL=/caminho/three.module.min.js  → serve esse arquivo no lugar do CDN (máquina sem acesso ao jsdelivr).
//                                               Sem ela, o three.js vem normalmente da rede.
//   WAIT=8000                                 → espera (ms) depois do JS extra (padrão 2500; SwiftShader é lento).
//   PLAYWRIGHT=/caminho/playwright/index.mjs  → onde está o Playwright (padrão: o pacote `playwright` do Node).
// Imprime o console da página ([pageerror] = exceção não tratada) e grava o PNG.
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import { pathToFileURL } from 'url';
const pwPath = process.env.PLAYWRIGHT || (existsSync('/opt/node22/lib/node_modules/playwright/index.mjs') ? '/opt/node22/lib/node_modules/playwright/index.mjs' : 'playwright');
const { chromium } = await import(pwPath.startsWith('/') ? pathToFileURL(pwPath).href : pwPath);
const [,, html, out, w = '1400', h = '900', extra = ''] = process.argv;
if (!html || !out) { console.error('uso: node tools/shot.mjs <index.html> <saida.png> [w h] [js]'); process.exit(2); }
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: +w, height: +h } });
const logs = [];
page.on('console', (m) => logs.push(`[${m.type()}] ${m.text()}`));
page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}`));
if (process.env.THREE_LOCAL) {
  const THREE_JS = readFileSync(process.env.THREE_LOCAL);
  await page.route(/cdn\.jsdelivr\.net\/npm\/three@/, (r) => r.fulfill({ body: THREE_JS, contentType: 'text/javascript' }));
  // sem rede externa: clima simulado
  await page.route(/api\.open-meteo\.com/, (r) => r.fulfill({ body: '{"current":{"temperature_2m":31,"apparent_temperature":33,"weather_code":1,"wind_speed_10m":8,"is_day":1}}', contentType: 'application/json' }));
}
await page.goto(pathToFileURL(resolve(html)).href);
await page.waitForTimeout(4000);
if (extra) { await page.evaluate(extra); await page.waitForTimeout(+(process.env.WAIT || 2500)); }
await page.screenshot({ path: out, timeout: 120000 });
console.log(logs.join('\n'));
await browser.close();
