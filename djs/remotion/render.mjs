// Renderiza as peças da página para DJs num processo só (o bundle sai uma vez).
// Uso: node render.mjs [stills|videos|tudo] [--so=Id1,Id2] [--novo-bundle]
// Precisa das gravações em public/cap/ (ver ../LEIAME.md, seção "Remotion").
import { bundle } from '@remotion/bundler';
import { renderMedia, renderStill, selectComposition } from '@remotion/renderer';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';

const aqui = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const modo = args.find((a) => !a.startsWith('--')) || 'tudo';
const so = (args.find((a) => a.startsWith('--so=')) || '').slice(5).split(',').filter(Boolean);
const out = path.join(aqui, 'out');
fs.mkdirSync(out, { recursive: true });

// Neste PC o Chrome que o Remotion baixa não abre; o chrome-headless-shell do Playwright funciona.
const browserExecutable = process.env.REMOTION_CHROME || null;
const t0 = Date.now();
const marca = path.join(out, 'bundle.txt');
let serveUrl = !args.includes('--novo-bundle') && fs.existsSync(marca) ? fs.readFileSync(marca, 'utf8').trim() : '';
if (!serveUrl || !fs.existsSync(serveUrl)) {
  serveUrl = await bundle({ entryPoint: path.join(aqui, 'src/index.jsx'), publicDir: path.join(aqui, 'public') });
  fs.writeFileSync(marca, serveUrl);
}
console.log('bundle', ((Date.now() - t0) / 1000).toFixed(0) + 's');

const pega = (id) => selectComposition({ serveUrl, id, browserExecutable, timeoutInMilliseconds: 120000 });
const quer = (id) => !so.length || so.includes(id);

if (modo === 'stills' || modo === 'tudo') {
  const lista = [
    ['Palco', [0, 37, 140]],
    ['PalcoVertical', [37]],
    ['Vitrine', [20, 100, 160, 400]],
    ['VitrineVertical', [100, 400]],
  ];
  for (const [id, quadros] of lista) {
    if (!quer(id)) continue;
    const composition = await pega(id);
    for (const frame of quadros) {
      const arq = path.join(out, `${id}-${frame}.jpg`);
      await renderStill({ composition, serveUrl, output: arq, frame, imageFormat: 'jpeg', jpegQuality: 80, scale: 0.5, browserExecutable, timeoutInMilliseconds: 120000 });
      console.log('still', path.basename(arq));
    }
  }
}

if (modo === 'videos' || modo === 'tudo') {
  for (const id of ['Palco', 'PalcoVertical', 'Vitrine', 'VitrineVertical']) {
    if (!quer(id)) continue;
    const composition = await pega(id);
    const arq = path.join(out, `${id}.mp4`);
    const t = Date.now();
    await renderMedia({
      composition, serveUrl, codec: 'h264', crf: 16, muted: true, outputLocation: arq, concurrency: 4, browserExecutable,
      timeoutInMilliseconds: 180000,
      onProgress: ({ progress }) => process.stdout.write(`${id} ${Math.round(progress * 100)}%   \r`),
    });
    console.log(`\nvideo ${id} ${((Date.now() - t) / 1000).toFixed(0)}s`);
  }
}
console.log('FIM', ((Date.now() - t0) / 1000).toFixed(0) + 's');
