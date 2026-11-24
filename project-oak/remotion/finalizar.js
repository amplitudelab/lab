// Leva os masters do render (out/*.mp4) para o site, em tamanho de web, e tira as capas.
// Uso: node finalizar.js [saida1,saida2]   (depois de node render.mjs videos; sem lista, faz todas)
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

// [master, saída, largura, crf, teto de bitrate, segundo da capa (null = sem capa)]
const pecas = [
  ['Abertura.mp4', 'abertura', 1600, 27, '2.2M', null],
  ['AberturaVertical.mp4', 'abertura-v', 720, 28, '1.6M', null],
  ['Salao.mp4', 'salao', 1600, 29, '1.8M', 0.6],
  ['SalaoVertical.mp4', 'salao-v', 720, 29, '1.1M', 0.6],
  ['Tunel.mp4', 'tunel', 1440, 30, '900k', 1.0],
  ['TunelVertical.mp4', 'tunel-v', 720, 30, '600k', 1.0],
];

const so = (process.argv[2] || '').split(',').filter(Boolean);
for (const [ent, sai, w, crf, teto, capa] of pecas) {
  if (so.length && !so.includes(sai)) continue;
  const e = path.join(OUT, ent);
  if (!fs.existsSync(e)) { console.log('falta', ent); continue; }
  const s = path.join(V, sai + '.mp4');
  ff(['-i', e, '-an', '-vf', `scale=${w}:-2:in_range=pc:out_range=tv`, '-color_range', 'tv', '-c:v', 'libx264', '-preset', 'slow', '-crf', String(crf), '-maxrate', teto, '-bufsize', '4M',
    '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-g', '60', '-movflags', '+faststart', s]);
  let linha = `${sai} ${kb(s)}`;
  if (capa != null) {
    const j = path.join(IMG, sai + '.jpg');
    ff(['-ss', String(capa), '-i', e, '-frames:v', '1', '-vf', `scale=${w}:-2`, '-q:v', '6', '-update', '1', j]);
    linha += ` | capa ${kb(j)}`;
  }
  console.log(linha);
}

// Teaser de divulgação: fica fora do site (vai para o artista), com som.
const t = path.join(OUT, 'Teaser.mp4');
if (fs.existsSync(t) && (!so.length || so.includes('teaser'))) {
  const s = path.join(OUT, 'oak-teaser.mp4');
  ff(['-i', t, '-vf', 'scale=in_range=pc:out_range=tv', '-color_range', 'tv', '-c:v', 'libx264', '-preset', 'slow', '-crf', '22', '-maxrate', '6M', '-bufsize', '8M', '-pix_fmt', 'yuv420p', '-profile:v', 'high',
    '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', s]);
  console.log('teaser', kb(s));
}
