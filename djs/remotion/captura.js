// Grava cada site rolando (notebook e celular) com o Playwright, para a vitrine e os clipes da página.
// Uso: node captura.js <pasta-saida> [site1,site2]   (repositório servido em localhost:8099)
// Precisa de playwright-core na versão do navegador instalado (npm i playwright-core fora do repo).
const { chromium } = require('playwright-core');
const fs = require('fs'), path = require('path');
const OUT = process.argv[2];
const EXE = process.env.REMOTION_CHROME; // o mesmo chrome-headless-shell do render
const sites = (process.argv[3] || 'bruno-zampieri,arcanne,linnx,bruxo,darky').split(',');
const URL = { arcanne: 'arcanne/?idioma=fixo', demo: 'djs/demo/?lang=pt' };
(async () => {
  const b = await chromium.launch({ executablePath: EXE, args: ['--autoplay-policy=no-user-gesture-required', '--enable-gpu-rasterization', '--ignore-gpu-blocklist'] });
  for (const s of sites) for (const [tipo, vw, vh, dsf] of [['d', 1440, 900, 1], ['m', 390, 844, 2]]) {
    if (process.env.SO_M && tipo === 'd') continue; // SO_M=1 refaz só o celular
    const dir = path.join(OUT, s + '-' + tipo); fs.rmSync(dir, { recursive: true, force: true });
    const ctx = await b.newContext({ viewport: { width: vw, height: vh }, deviceScaleFactor: dsf, isMobile: tipo === 'm', hasTouch: tipo === 'm', recordVideo: { dir, size: { width: vw, height: vh } } });
    const p = await ctx.newPage();
    const erros = []; p.on('pageerror', (e) => erros.push(e.message));
    await p.goto('http://localhost:8099/' + (URL[s] || s + '/'), { waitUntil: 'load' });
    if (s === 'linnx') { await p.waitForTimeout(2500); await p.getByText(/silêncio/i).first().click(); }
    if (s === 'demo') { await p.waitForTimeout(800); await p.locator('.hero-acoes [data-tocar]').click(); }
    await p.waitForTimeout(3500);
    // rola suave por ~4 telas em 9 s
    await p.evaluate(() => new Promise((res) => {
      const alvo = Math.min(document.documentElement.scrollHeight - innerHeight, innerHeight * 4.2), t0 = performance.now(), D = 9000;
      const f = (t) => { const k = Math.min(1, (t - t0) / D); const e = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2; scrollTo(0, alvo * e); k < 1 ? requestAnimationFrame(f) : res(); };
      requestAnimationFrame(f);
    }));
    await p.waitForTimeout(1500);
    await p.screenshot({ path: path.join(OUT, s + '-' + tipo + '-fim.jpg'), quality: 80, type: 'jpeg' });
    await p.evaluate(() => scrollTo(0, 0)); await p.waitForTimeout(800);
    await p.screenshot({ path: path.join(OUT, s + '-' + tipo + '-topo.jpg'), quality: 85, type: 'jpeg' });
    await ctx.close();
    const v = fs.readdirSync(dir).find((f) => f.endsWith('.webm'));
    fs.renameSync(path.join(dir, v), path.join(OUT, s + '-' + tipo + '.webm')); fs.rmSync(dir, { recursive: true });
    console.log(s, tipo, erros.length ? 'ERROS: ' + erros.join(' | ') : 'ok');
  }
  await b.close();
})();
