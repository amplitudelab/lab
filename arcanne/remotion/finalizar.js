// Leva os masters do Remotion (out/*.mp4) para o site, em tamanho de web, e tira as capas.
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

// [master, saída, largura, crf, teto de bitrate]
const pecas = [
  ['Abertura.mp4', 'abertura.mp4', 1920, 24, '4M'],
  ['AberturaVertical.mp4', 'abertura-v.mp4', 720, 25, '2.5M'],
  ['Montagem.mp4', 'montagem.mp4', 1600, 27, '2.6M'],
  ['MontagemVertical.mp4', 'montagem-m.mp4', 540, 29, '1.1M'],
  ['Pulso.mp4', 'pulso.mp4', 720, 30, '600k'],
];

for (const [ent, sai, w, crf, teto] of pecas) {
  const e = path.join(OUT, ent);
  if (!fs.existsSync(e)) { console.log('falta', ent); continue; }
  const s = path.join(V, sai);
  ff(['-i', e, '-an', '-vf', `scale=${w}:-2`, '-c:v', 'libx264', '-preset', 'slow', '-crf', String(crf), '-maxrate', teto, '-bufsize', '6M',
    '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-g', '60', '-movflags', '+faststart', s]);
  console.log(sai, kb(s));
}

// Capas da primeira tela: o primeiro quadro de cada montagem (a imagem que aparece antes do vídeo).
for (const [ent, sai, w] of [['Montagem.mp4', 'montagem.jpg', 1920], ['MontagemVertical.mp4', 'montagem-m.jpg', 720]]) {
  const e = path.join(OUT, ent);
  if (!fs.existsSync(e)) continue;
  const s = path.join(IMG, sai);
  ff(['-ss', '0.1', '-i', e, '-frames:v', '1', '-vf', `scale=${w}:-2`, '-q:v', '5', '-update', '1', s]);
  console.log(sai, kb(s));
}
