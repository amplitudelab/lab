// Renderiza as peças do site do Oak num processo só (o bundle sai uma vez).
// Uso: node render.mjs [stills|videos|tudo] [--so=Id1,Id2] [--novo-bundle]
// Precisa dos trechos em public/ (ver ../LEIAME.md, seção "Vídeos").
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

// Se o Chrome que vem com o renderizador não abrir, aponte outro em REMOTION_CHROME.
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
    ['Abertura', [8, 20, 40, 60, 80, 100, 115, 130, 145]],
    ['AberturaVertical', [60, 120]],
    ['Salao', [10, 70]],
    ['SalaoVertical', [70]],
    ['Tunel', [0, 60]],
    ['Teaser', [200, 300, 400, 470, 520]],
  ];
  for (const [id, quadros] of lista) {
    if (!quer(id)) continue;
    const composition = await pega(id);
    for (const frame of quadros) {
      const arq = path.join(out, `${id}-${frame}.jpg`);
      await renderStill({ composition, serveUrl, output: arq, frame, imageFormat: 'jpeg', jpegQuality: 80, scale: 0.4, browserExecutable, timeoutInMilliseconds: 120000 });
      console.log('still', path.basename(arq));
    }
  }
}

if (modo === 'videos' || modo === 'tudo') {
  for (const id of ['Abertura', 'AberturaVertical', 'Salao', 'SalaoVertical', 'Tunel', 'TunelVertical', 'Teaser']) {
    if (!quer(id)) continue;
    const composition = await pega(id);
    const arq = path.join(out, `${id}.mp4`);
    const t = Date.now();
    await renderMedia({
      composition, serveUrl, codec: 'h264', crf: 16, muted: id !== 'Teaser', outputLocation: arq, concurrency: Number(process.env.CONCORRENCIA || 2), browserExecutable,
      timeoutInMilliseconds: 600000,
      onProgress: ({ progress }) => process.stdout.write(`${id} ${Math.round(progress * 100)}%   \r`),
    });
    console.log(`\nvideo ${id} ${((Date.now() - t) / 1000).toFixed(0)}s`);
  }
}
console.log('FIM', ((Date.now() - t0) / 1000).toFixed(0) + 's');
