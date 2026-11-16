#!/usr/bin/env node
// Prévias temporárias e privadas da Amplitude Lab (pasta previa/).
//
// O repositório é público, então nenhuma prévia fica legível nele: a página do
// cliente vai cifrada (AES-256-GCM) em previa/<id>/dados.bin, e a chave só existe
// no link, depois do "#". O navegador nunca manda o que vem depois do "#" para o
// servidor, então nem o GitHub nem quem olha o repositório consegue abrir a prévia.
// Cada prévia tem data de validade: depois dela a página não abre mais, e a rotina
// .github/workflows/previas.yml fica vermelha até a pasta ser apagada.
//
// Uso (na raiz do repositório):
//   node previa/previa.js criar <pasta-fonte> [--dias 7] [--idioma pt|en]
//   node previa/previa.js atualizar "<link>" <pasta-fonte>
//   node previa/previa.js abrir "<link>" <pasta-saida>
//   node previa/previa.js prorrogar <id> <dias>
//   node previa/previa.js lista
//   node previa/previa.js conferir      (erro se houver prévia vencida)
//   node previa/previa.js limpar        (apaga as pastas vencidas)
//
// A pasta-fonte tem um index.html e os arquivos que ele usa (fontes, imagens,
// CSS). Regras: scripts só dentro do próprio index.html (nada de <script src>
// local), nenhum onclick= e afins, e nada de link interno que troque o "#" por
// conta própria (os links "#secao" são tratados aqui).
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const SITE = 'https://amplitudelab.github.io/lab/previa/';
const RAIZ = __dirname;
const MAX_BYTES = 15 * 1024 * 1024;
const TIPOS = {
  '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json',
  '.svg': 'image/svg+xml', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.avif': 'image/avif', '.ico': 'image/x-icon',
  '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf', '.otf': 'font/otf',
  '.mp4': 'video/mp4', '.webm': 'video/webm', '.mp3': 'audio/mpeg', '.m4a': 'audio/mp4',
  '.txt': 'text/plain', '.md': 'text/plain', '.pdf': 'application/pdf',
};
// Players que a prévia pode embutir (só carregam quando a página pede).
const FRAMES = [
  'https://w.soundcloud.com', 'https://www.youtube-nocookie.com', 'https://www.youtube.com',
  'https://player-widget.mixcloud.com', 'https://www.mixcloud.com', 'https://open.spotify.com',
  'https://embed.music.apple.com',
];

// ---------- scripts que vão para o navegador (o texto exato entra no hash da CSP) ----------

// Abre a prévia: confere a validade, busca dados.bin, decifra com a chave do "#",
// troca os caminhos dos arquivos por endereços blob: e escreve a página.
const ABRIDOR = `(async()=>{
const d=document.documentElement,pt=d.dataset.idioma!=='en',id=d.dataset.id,m=document.getElementById('m');
const T=pt?{falta:'Este link está incompleto. Peça o link completo a quem enviou a prévia.',venceu:'Esta prévia saiu do ar em ',erro:'Não foi possível abrir esta prévia. Confira se o link está completo.',rede:'Não foi possível carregar a prévia. Tente de novo em instantes.',faixa:'Prévia privada · no ar até '}:{falta:'This preview link is incomplete. Ask the person who sent it for the full link.',venceu:'This preview went offline on ',erro:'This preview could not be opened. Check that the link is complete.',rede:'The preview could not be loaded. Please try again in a moment.',faixa:'Private preview · online until '};
const avisar=t=>{m.textContent=t};
const fim=new Date(d.dataset.expira);
const quando=fim.toLocaleDateString(pt?'pt-BR':'en-US',pt?{day:'2-digit',month:'2-digit',year:'numeric',timeZone:'America/Sao_Paulo'}:{month:'short',day:'numeric',year:'numeric',timeZone:'America/Sao_Paulo'});
if(!(Date.now()<=fim.getTime())){avisar(T.venceu+quando+'.');return}
const chave='previa:'+id;let k=location.hash.slice(1);
if(!k){try{k=sessionStorage.getItem(chave)||''}catch(e){}}
if(!/^[A-Za-z0-9_-]{43}$/.test(k)){avisar(T.falta);return}
const bytes=s=>Uint8Array.from(atob(s.replace(/-/g,'+').replace(/_/g,'/')+'='),c=>c.charCodeAt(0));
let buf;try{const r=await fetch('dados.bin?v='+d.dataset.versao);if(!r.ok)throw 0;buf=await r.arrayBuffer()}catch(e){avisar(T.rede);return}
let claro;try{const ch=await crypto.subtle.importKey('raw',bytes(k),'AES-GCM',false,['decrypt']);claro=new Uint8Array(await crypto.subtle.decrypt({name:'AES-GCM',iv:new Uint8Array(buf,0,12)},ch,new Uint8Array(buf,12)))}catch(e){avisar(T.erro);return}
try{sessionStorage.setItem(chave,k)}catch(e){}
const txt=new TextDecoder(),n=new DataView(claro.buffer,claro.byteOffset).getUint32(0),man=JSON.parse(txt.decode(claro.subarray(4,4+n)));
let pos=4+n;const arq={};for(const a of man.arquivos){arq[a.caminho]={tipo:a.tipo,b:claro.subarray(pos,pos+a.tamanho)};pos+=a.tamanho}
const url={},ref=/(["'(])(?:\\.\\/)?([^"'()<>\\s]+?)([?#][^"'()<>\\s]*)?(?=["')])/g;
const trocar=s=>s.replace(ref,(x,a,p,q)=>url[p]?a+url[p]+(q||''):x).replace(/(\\s(?:srcset|imagesrcset)=")([^"]*)"/g,(x,a,v)=>a+v.split(',').map(p=>p.trim().replace(/^(?:\\.\\/)?(\\S+)/,(y,c)=>url[c]||y)).join(', ')+'"');
const blob=(b,t)=>URL.createObjectURL(new Blob([b],{type:t}));
for(const p in arq)if(p!==man.entrada&&arq[p].tipo!=='text/css')url[p]=blob(arq[p].b,arq[p].tipo);
for(const p in arq)if(p!==man.entrada&&arq[p].tipo==='text/css')url[p]=blob(trocar(txt.decode(arq[p].b)),'text/css');
let h=txt.decode(arq[man.entrada].b).split(/(<script\\b[^>]*>[\\s\\S]*?<\\/script>)/i).map((p,i)=>i%2?p:trocar(p)).join('');
const cab='<meta name="robots" content="noindex,nofollow,noarchive"><meta name="referrer" content="no-referrer">';
h=/<head[^>]*>/i.test(h)?h.replace(/<head[^>]*>/i,x=>x+cab):cab+h;
const faixa='<div style="position:fixed;left:10px;bottom:10px;z-index:2147483647;pointer-events:none;font:500 11px/1.2 system-ui,sans-serif;letter-spacing:.04em;color:#fff;background:rgba(0,0,0,.72);border:1px solid rgba(255,255,255,.18);padding:6px 10px;border-radius:999px">'+T.faixa+quando+'</div><script>'+d.dataset.ajudante+'<\\/script>';
const f=h.lastIndexOf('</body>');h=f<0?h+faixa:h.slice(0,f)+faixa+h.slice(f);
document.open();document.write(h);document.close();
})();`;

// Vai junto com a página da prévia: links "#secao" rolam sem apagar a chave do endereço.
const AJUDANTE = `document.addEventListener('click',e=>{const a=e.target.closest&&e.target.closest('a[href^="#"]');if(!a)return;e.preventDefault();const id=decodeURIComponent(a.getAttribute('href').slice(1));const alvo=id&&document.getElementById(id);if(alvo)alvo.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'})},true);`;

// ---------- utilidades ----------

const sha = s => "'sha256-" + crypto.createHash('sha256').update(s, 'utf8').digest('base64') + "'";
const sair = msg => { console.error(msg); process.exit(1); };
const esc = s => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

function novoId() {
  const alfabeto = 'abcdefghijkmnpqrstuvwxyz23456789'; // 32 letras, sem as que se confundem
  return [...crypto.randomBytes(16)].map(b => alfabeto[b & 31]).join(''); // 80 bits
}

function hojeEmBrasilia() {
  return new Date(Date.now() - 3 * 3600e3).toISOString().slice(0, 10);
}
function somarDias(dataISO, dias) {
  const d = new Date(dataISO.slice(0, 10) + 'T12:00:00Z');
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10) + 'T23:59:59-03:00';
}

function lerLink(link) {
  const m = /previa\/([a-z0-9]{16})\/?#([A-Za-z0-9_-]{43})\s*$/.exec(link || '');
  if (!m) sair('Link inválido. Use o link completo: ' + SITE + '<id>/#<chave>');
  return { id: m[1], chave: m[2] };
}

function lerFonte(pasta) {
  pasta = path.resolve(pasta);
  if (!fs.existsSync(path.join(pasta, 'index.html'))) sair('A pasta-fonte precisa ter um index.html: ' + pasta);
  const arquivos = [];
  (function andar(dir) {
    for (const nome of fs.readdirSync(dir).sort()) {
      if (nome.startsWith('.') || nome === 'Thumbs.db') continue;
      const p = path.join(dir, nome);
      if (fs.statSync(p).isDirectory()) { andar(p); continue; }
      const caminho = path.relative(pasta, p).split(path.sep).join('/');
      arquivos.push({ caminho, tipo: TIPOS[path.extname(nome).toLowerCase()] || 'application/octet-stream', dados: fs.readFileSync(p) });
    }
  })(pasta);
  const total = arquivos.reduce((s, a) => s + a.dados.length, 0);
  if (total > MAX_BYTES) sair(`A prévia tem ${(total / 1048576).toFixed(1)} MB; o limite é ${MAX_BYTES / 1048576} MB. Comprima imagens e vídeos.`);
  const html = arquivos.find(a => a.caminho === 'index.html').dados.toString('utf8');
  const local = [...html.matchAll(/<script\b[^>]*\bsrc\s*=\s*["']?(?!https?:|\/\/)([^"'\s>]+)/gi)].map(m => m[1]);
  if (local.length) sair('Coloque estes scripts dentro do index.html (a CSP só aceita script inline com hash): ' + local.join(', '));
  if (/<script\b[^>]*\bsrc\s*=/i.test(html)) sair('Scripts de fora (CDN) não são aceitos na prévia: copie o código para dentro do index.html.');
  const eventos = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '').match(/\son[a-z]+\s*=/gi);
  if (eventos) sair('Tire os atributos ' + [...new Set(eventos.map(e => e.trim()))].join(' ') + ' do HTML: a CSP bloqueia. Use addEventListener no script.');
  // O navegador troca CRLF por LF antes de calcular o hash; aqui também.
  const hashes = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].map(m => sha(m[1].replace(/\r\n?/g, '\n')));
  return { arquivos, hashes };
}

function empacotar(arquivos) {
  const manifesto = Buffer.from(JSON.stringify({
    v: 1, entrada: 'index.html',
    arquivos: arquivos.map(a => ({ caminho: a.caminho, tipo: a.tipo, tamanho: a.dados.length })),
  }), 'utf8');
  const n = Buffer.alloc(4); n.writeUInt32BE(manifesto.length);
  return Buffer.concat([n, manifesto, ...arquivos.map(a => a.dados)]);
}

function cifrar(claro, chave) {
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv('aes-256-gcm', Buffer.from(chave, 'base64url'), iv);
  return Buffer.concat([iv, c.update(claro), c.final(), c.getAuthTag()]);
}

function decifrar(dados, chave) {
  const d = crypto.createDecipheriv('aes-256-gcm', Buffer.from(chave, 'base64url'), dados.subarray(0, 12));
  d.setAuthTag(dados.subarray(dados.length - 16));
  try { return Buffer.concat([d.update(dados.subarray(12, dados.length - 16)), d.final()]); }
  catch { sair('A chave não confere com esta prévia.'); }
}

function paginaAbridora({ id, expira, idioma, versao, hashes }) {
  const pt = idioma !== 'en';
  const csp = [
    "default-src 'none'",
    'script-src ' + [sha(ABRIDOR), sha(AJUDANTE), ...new Set(hashes)].join(' '),
    "style-src 'unsafe-inline' blob:",
    'img-src data: blob:',
    'font-src data: blob:',
    'media-src blob:',
    "connect-src 'self'",
    'frame-src ' + FRAMES.join(' '),
    "base-uri 'none'",
    "form-action 'none'",
  ].join('; ');
  return `<!doctype html>
<html lang="${pt ? 'pt-BR' : 'en'}" data-id="${id}" data-expira="${esc(expira)}" data-idioma="${pt ? 'pt' : 'en'}" data-versao="${versao}" data-ajudante="${esc(AJUDANTE)}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow,noarchive">
<meta name="referrer" content="no-referrer">
<meta http-equiv="Content-Security-Policy" content="${csp}">
<title>${pt ? 'Prévia' : 'Preview'}</title>
<style>html{color-scheme:dark}body{margin:0;min-height:100vh;display:grid;place-items:center;padding:24px;box-sizing:border-box;background:#0b0b0d;color:#e9e9ee;font:16px/1.5 system-ui,-apple-system,"Segoe UI",sans-serif;text-align:center}p{max-width:34ch;margin:0}small{display:block;margin-top:14px;color:#8a8a96;font-size:12px;letter-spacing:.08em;text-transform:uppercase}</style>
</head>
<body>
<main><p id="m">${pt ? 'Abrindo a prévia…' : 'Opening preview…'}</p><small>${pt ? 'Prévia privada' : 'Private preview'} · Amplitude Lab</small></main>
<noscript><p>${pt ? 'Ative o JavaScript para ver a prévia.' : 'Turn on JavaScript to see the preview.'}</p></noscript>
<script>${ABRIDOR}</script>
</body>
</html>
`;
}

function gravar(id, chave, fonte, expira, idioma) {
  const { arquivos, hashes } = lerFonte(fonte);
  const dados = cifrar(empacotar(arquivos), chave);
  const versao = crypto.createHash('sha256').update(dados).digest('hex').slice(0, 10);
  const dir = path.join(RAIZ, id);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'dados.bin'), dados);
  fs.writeFileSync(path.join(dir, 'index.html'), paginaAbridora({ id, expira, idioma, versao, hashes }));
  return { bytes: dados.length, arquivos: arquivos.length };
}

function lerPrevia(id) {
  const f = path.join(RAIZ, id, 'index.html');
  if (!fs.existsSync(f)) return null;
  const h = fs.readFileSync(f, 'utf8');
  const attr = n => (new RegExp(`data-${n}="([^"]*)"`).exec(h) || [])[1];
  return { id, arquivo: f, html: h, expira: attr('expira'), idioma: attr('idioma') };
}

function todas() {
  return fs.readdirSync(RAIZ)
    .filter(n => /^[a-z0-9]{16}$/.test(n) && fs.statSync(path.join(RAIZ, n)).isDirectory())
    .map(lerPrevia).filter(Boolean)
    .map(p => ({ ...p, vencida: !(Date.now() <= new Date(p.expira).getTime()) }));
}

const dataBR = iso => new Date(iso).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', dateStyle: 'short', timeStyle: 'short' });

// ---------- comandos ----------

const [cmd, ...args] = process.argv.slice(2);
const opcao = (nome, padrao) => { const i = args.indexOf('--' + nome); return i < 0 ? padrao : args.splice(i, 2)[1]; };

if (cmd === 'criar') {
  const dias = +opcao('dias', 7), idioma = opcao('idioma', 'pt');
  if (!args[0]) sair('Uso: node previa/previa.js criar <pasta-fonte> [--dias 7] [--idioma pt|en]');
  if (!(dias >= 1 && dias <= 30)) sair('--dias vai de 1 a 30.');
  const id = novoId(), chave = crypto.randomBytes(32).toString('base64url');
  const expira = somarDias(hojeEmBrasilia(), dias);
  const r = gravar(id, chave, args[0], expira, idioma);
  console.log(`Prévia criada: previa/${id}/ (${r.arquivos} arquivos, ${(r.bytes / 1024).toFixed(0)} KB cifrados)`);
  console.log(`No ar até: ${dataBR(expira)} (horário de Brasília)`);
  console.log(`Link: ${SITE}${id}/#${chave}`);
  console.log('A chave só existe nesse link. Entregue pelo chat e guarde no histórico do lead no CRM; não grave no repositório.');
} else if (cmd === 'atualizar') {
  const { id, chave } = lerLink(args[0]);
  const p = lerPrevia(id); if (!p) sair('Prévia não encontrada: previa/' + id);
  decifrar(fs.readFileSync(path.join(RAIZ, id, 'dados.bin')), chave); // confere a chave antes de trocar
  if (!args[1]) sair('Uso: node previa/previa.js atualizar "<link>" <pasta-fonte>');
  const r = gravar(id, chave, args[1], p.expira, p.idioma);
  console.log(`Prévia atualizada: previa/${id}/ (${r.arquivos} arquivos). Continua no ar até ${dataBR(p.expira)}. O link não muda.`);
} else if (cmd === 'abrir') {
  const { id, chave } = lerLink(args[0]);
  if (!args[1]) sair('Uso: node previa/previa.js abrir "<link>" <pasta-saida>');
  const claro = decifrar(fs.readFileSync(path.join(RAIZ, id, 'dados.bin')), chave);
  const n = claro.readUInt32BE(0), man = JSON.parse(claro.subarray(4, 4 + n).toString('utf8'));
  let pos = 4 + n;
  const saida = path.resolve(args[1]);
  for (const a of man.arquivos) {
    const destino = path.resolve(saida, a.caminho);
    if (!destino.startsWith(saida + path.sep)) sair('Caminho fora da pasta: ' + a.caminho);
    fs.mkdirSync(path.dirname(destino), { recursive: true });
    fs.writeFileSync(destino, claro.subarray(pos, pos + a.tamanho)); pos += a.tamanho;
  }
  console.log(`${man.arquivos.length} arquivos da prévia ${id} em ${saida}`);
} else if (cmd === 'prorrogar') {
  const [id, dias] = args;
  const p = lerPrevia(id || ''); if (!p) sair('Uso: node previa/previa.js prorrogar <id> <dias>');
  if (!(+dias >= 1 && +dias <= 30)) sair('Dias vai de 1 a 30.');
  const nova = somarDias(new Date(new Date(p.expira).getTime() - 3 * 3600e3).toISOString(), +dias);
  fs.writeFileSync(p.arquivo, p.html.replace(/data-expira="[^"]*"/, `data-expira="${nova}"`));
  console.log(`previa/${id}/ agora fica no ar até ${dataBR(nova)}.`);
} else if (cmd === 'lista' || cmd === 'conferir') {
  const ps = todas();
  if (!ps.length) console.log('Nenhuma prévia no ar.');
  for (const p of ps) console.log(`${p.vencida ? 'VENCIDA ' : 'no ar   '} ${p.id}  até ${dataBR(p.expira)}`);
  const v = ps.filter(p => p.vencida);
  if (cmd === 'conferir' && v.length) {
    for (const p of v) console.log(`::error::Prévia vencida ainda no repositório: previa/${p.id}/ (venceu em ${dataBR(p.expira)}). Rode "node previa/previa.js limpar" e abra um PR.`);
    process.exit(1);
  }
} else if (cmd === 'limpar') {
  const v = todas().filter(p => p.vencida);
  for (const p of v) { fs.rmSync(path.join(RAIZ, p.id), { recursive: true, force: true }); console.log('Apagada: previa/' + p.id + '/'); }
  if (!v.length) console.log('Nenhuma prévia vencida.');
  else console.log('Agora faça o commit da remoção e abra o PR.');
} else {
  console.log(fs.readFileSync(__filename, 'utf8').split('\n').slice(1, 23).map(l => l.replace(/^\/\/ ?/, '')).join('\n'));
}
