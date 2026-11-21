// Renderiza as peças de movimento do site do ARCANNE num processo só (o bundle sai uma vez).
// Uso: node render.mjs [stills|videos|tudo]   (padrão: tudo)
// Precisa das cópias de trabalho em public/ (ver LEIAME do site, seção "Remotion").
import { bundle } from '@remotion/bundler';
import { renderMedia, renderStill, selectComposition } from '@remotion/renderer';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';

const aqui = path.dirname(fileURLToPath(import.meta.url));
const modo = process.argv.slice(2).find((a) => !a.startsWith('--')) || 'tudo';
const out = path.join(aqui, 'out');
fs.mkdirSync(out, { recursive: true });

// Chrome para renderizar: REMOTION_CHROME aponta um executável (neste PC o Chrome baixado pelo
// Remotion não respondia; o chrome-headless-shell do Playwright funciona). Sem a variável, o Remotion usa o dele.
const browserExecutable = process.env.REMOTION_CHROME || null;
// O bundle leva minutos aqui: fica guardado em out/bundle.txt e é reaproveitado.
// Passe --novo-bundle depois de mudar algo em src/ ou public/.
const t0 = Date.now();
const marca = path.join(out, 'bundle.txt');
let serveUrl = !process.argv.includes('--novo-bundle') && fs.existsSync(marca) ? fs.readFileSync(marca, 'utf8').trim() : '';
if (!serveUrl || !fs.existsSync(serveUrl)) {
  serveUrl = await bundle({ entryPoint: path.join(aqui, 'src/index.jsx'), publicDir: path.join(aqui, 'public') });
  fs.writeFileSync(marca, serveUrl);
}
console.log('bundle', ((Date.now() - t0) / 1000).toFixed(0) + 's', serveUrl);

const pega = (id) => selectComposition({ serveUrl, id, browserExecutable, timeoutInMilliseconds: 120000 });

if (modo === 'stills' || modo === 'tudo') {
  const lista = [
    ['Abertura', [6, 20, 34, 48, 62, 80, 98]],
    ['AberturaVertical', [34, 62, 98]],
    ['Montagem', [10, 60, 200]],
    ['MontagemVertical', [10, 120]],
    ['Pulso', [0, 40]],
  ];
  for (const [id, quadros] of lista) {
    const composition = await pega(id);
    for (const frame of quadros) {
      const arq = path.join(out, `${id}-${frame}.jpg`);
      await renderStill({ composition, serveUrl, output: arq, frame, imageFormat: 'jpeg', jpegQuality: 80, scale: 0.4, browserExecutable, timeoutInMilliseconds: 120000 });
      console.log('still', path.basename(arq));
    }
  }
}

if (modo === 'videos' || modo === 'tudo') {
  for (const id of ['Abertura', 'AberturaVertical', 'Montagem', 'MontagemVertical', 'Pulso']) {
    const composition = await pega(id);
    const arq = path.join(out, `${id}.mp4`);
    const t = Date.now();
    await renderMedia({
      composition,
      serveUrl,
      codec: 'h264',
      crf: 16, // master; o site recebe uma versão recodificada e menor
      muted: true,
      outputLocation: arq,
      concurrency: 4,
      browserExecutable,
      timeoutInMilliseconds: 180000,
      onProgress: ({ progress }) => {
        if (Math.round(progress * 100) % 25 === 0) process.stdout.write(`${id} ${Math.round(progress * 100)}%\r`);
      },
    });
    console.log(`\nvideo ${id} ${((Date.now() - t) / 1000).toFixed(0)}s`);
  }
}
console.log('FIM', ((Date.now() - t0) / 1000).toFixed(0) + 's');
