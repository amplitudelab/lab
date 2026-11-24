// Leva os masters do Remotion (out/*.mp4) para a página, em tamanho de web, e tira as capas.
// Uso: node finalizar.js   (depois de node render.mjs videos)
'use strict';
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const FF = path.join(__dirname, 'node_modules/@remotion/compositor-win32-x64-msvc/ffmpeg.exe');
const OUT = path.join(__dirname, 'out');
const V = path.join(__dirname, '../assets/video');
const IMG = path.join(__dirname, '../assets/img');
const ff = (a) => execFileSync(FF, ['-v', 'error', '-y', ...a], { stdio: 'inherit' });
const kb = (f) => Math.round(fs.statSync(f).size / 1024) + ' KB';
fs.mkdirSync(V, { recursive: true });
fs.mkdirSync(IMG, { recursive: true });

// [master, saída, largura, crf, teto de bitrate, segundo da capa]
const pecas = [
  ['Palco.mp4', 'palco', 1600, 30, '1.2M', 1.2],
  ['PalcoVertical.mp4', 'palco-v', 720, 31, '800k', 1.2],
  ['Vitrine.mp4', 'vitrine', 1280, 28, '1.4M', 4.6],
  ['VitrineVertical.mp4', 'vitrine-v', 720, 29, '1.1M', 4.6],
];

for (const [ent, sai, w, crf, teto, capa] of pecas) {
  const e = path.join(OUT, ent);
  if (!fs.existsSync(e)) { console.log('falta', ent); continue; }
  const s = path.join(V, sai + '.mp4');
  ff(['-i', e, '-an', '-vf', `scale=${w}:-2`, '-c:v', 'libx264', '-preset', 'slow', '-crf', String(crf), '-maxrate', teto, '-bufsize', '4M',
    '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-g', '60', '-movflags', '+faststart', s]);
  const j = path.join(IMG, sai + '.jpg');
  ff(['-ss', String(capa), '-i', e, '-frames:v', '1', '-vf', `scale=${w}:-2`, '-q:v', '6', '-update', '1', j]);
  console.log(sai, kb(s), '| capa', kb(j));
}
