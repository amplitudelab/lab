#!/usr/bin/env node
// Gera as duas versões do site do ARCANNE a partir de dados.json e locales/*.json:
//   arcanne/index.html (português) e arcanne/en/index.html (inglês),
//   mais sitemap.xml e robots.txt.
// Rode de novo sempre que mudar dados, textos ou este arquivo:  node arcanne/gerar.js
'use strict';
const fs = require('fs');
const path = require('path');

const RAIZ = __dirname;
const D = JSON.parse(fs.readFileSync(path.join(RAIZ, 'dados.json'), 'utf8'));
// O script de idioma roda antes de tudo: vai embutido no <head> e a CSP libera só o hash dele.
const IDIOMA_JS = fs.readFileSync(path.join(RAIZ, 'js/idioma.js'), 'utf8').trim();
const IDIOMA_HASH = require('crypto').createHash('sha256').update(IDIOMA_JS, 'utf8').digest('base64');
const IDIOMAS = ['pt-BR', 'en'].map((l) => JSON.parse(fs.readFileSync(path.join(RAIZ, 'locales', l + '.json'), 'utf8')));

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const existe = (rel) => fs.existsSync(path.join(RAIZ, rel));
const tamanho = (rel) => {
  if (!existe(rel)) return '';
  const b = fs.statSync(path.join(RAIZ, rel)).size;
  return b > 1048576 ? (b / 1048576).toFixed(1).replace('.', ',') + ' MB' : Math.round(b / 1024) + ' KB';
};
const mmss = (s) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}`;
const spotifyAlbum = (id) => `https://open.spotify.com/album/${id}`;
const spotifyTrack = (id) => `https://open.spotify.com/track/${id}`;
const fora = (t) => `target="_blank" rel="noopener" data-fora`;

// Dimensões das imagens (lidas do cabeçalho WebP/PNG/JPG) para o width/height evitarem CLS.
function dimensoes(rel) {
  const f = path.join(RAIZ, rel);
  if (!fs.existsSync(f)) return [0, 0];
  const b = fs.readFileSync(f);
  if (b.toString('ascii', 0, 4) === 'RIFF') {
    const tipo = b.toString('ascii', 12, 16);
    if (tipo === 'VP8X') return [1 + b.readUIntLE(24, 3), 1 + b.readUIntLE(27, 3)];
    if (tipo === 'VP8 ') return [b.readUInt16LE(26) & 0x3fff, b.readUInt16LE(28) & 0x3fff];
    if (tipo === 'VP8L') { const n = b.readUInt32LE(21); return [1 + (n & 0x3fff), 1 + ((n >> 14) & 0x3fff)]; }
  }
  if (b[0] === 0x89) return [b.readUInt32BE(16), b.readUInt32BE(20)];
  if (b[0] === 0xff) {
    let i = 2;
    while (i < b.length) {
      const m = b[i + 1], len = b.readUInt16BE(i + 2);
      if (m >= 0xc0 && m <= 0xc3) return [b.readUInt16BE(i + 7), b.readUInt16BE(i + 5)];
      i += 2 + len;
    }
  }
  return [0, 0];
}

// <img> responsivo: versão de celular (-m) e versão cheia, com largura real de cada uma.
function img(R, base, alt, cls = '', tam = '100vw', extra = '') {
  const g = `assets/img/${base}.webp`, m = `assets/img/${base}-m.webp`;
  const [w, h] = dimensoes(g);
  const [wm] = existe(m) ? dimensoes(m) : [0];
  const srcset = wm && wm !== w ? ` srcset="${R}${m} ${wm}w, ${R}${g} ${w}w" sizes="${tam}"` : '';
  return `<img class="${cls}" src="${R}${g}"${srcset} width="${w}" height="${h}" alt="${esc(alt)}" loading="lazy" decoding="async"${extra}>`;
}

const ICONE = {
  play: '<svg class="i i-play" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4.5v15l13-7.5z"/></svg>',
  pausa: '<svg class="i i-pausa" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 4h4.5v16H6zM13.5 4H18v16h-4.5z"/></svg>',
  seta: '<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h12M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2"/></svg>',
  baixar: '<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v11M7 10l5 5 5-5M5 20h14" fill="none" stroke="currentColor" stroke-width="2"/></svg>',
  fora: '<svg class="i i-fora" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5h10v10M19 5 6 18" fill="none" stroke="currentColor" stroke-width="2"/></svg>',
  fechar: '<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" fill="none" stroke="currentColor" stroke-width="2"/></svg>',
};

const BARRAS = '<span class="barras" aria-hidden="true"><i></i><i></i><i></i><i></i></span>';

function faixa(L, R, { id, titulo, sub, audio, duracao, grande }) {
  return `<div class="faixa${grande ? ' faixa--grande' : ''}" data-faixa="${esc(id)}" data-src="${R}${audio}" data-duracao="${duracao}" data-titulo="${esc(titulo)}">
          <button class="faixa-play" type="button" aria-label="${esc(L.ui.tocar)}: ${esc(titulo)}" data-rotulo-tocar="${esc(L.ui.tocar)}: ${esc(titulo)}" data-rotulo-pausar="${esc(L.ui.pausar)}: ${esc(titulo)}">${ICONE.play}${ICONE.pausa}</button>
          <div class="faixa-info">
            ${grande ? '' : `<p class="faixa-titulo">${esc(titulo)}${sub ? ` <span class="faixa-sub">${sub}</span>` : ''}</p>`}
            <div class="faixa-linha">
              <input class="faixa-pos" type="range" min="0" max="${duracao}" step="0.1" value="0" aria-label="${esc(L.ui.posicao)}: ${esc(titulo)}" aria-valuetext="0:00">
              <span class="faixa-tempo" aria-hidden="true"><span class="faixa-agora">0:00</span> / ${mmss(duracao)}</span>
            </div>
          </div>
        </div>`;
}

function pagina(L) {
  const R = L.caminho ? '../' : '';
  const url = D.site.base + L.caminho;
  const outro = IDIOMAS.find((x) => x !== L);
  const ano = (s) => (s ? String(s) : '');
  const discoPorAno = {};
  for (const [a, t, id] of D.discografia.itens) (discoPorAno[a] ||= []).push([t, id]);
  const anos = Object.keys(discoPorAno).sort((a, b) => b - a);
  const contato = D.contato;
  const nomePais = (c) => (c ? L.aovivo.paises[c] || c : '');

  const ld = {
    '@context': 'https://schema.org',
    '@type': 'MusicGroup',
    name: 'ARCANNE',
    url,
    image: D.site.base + 'assets/img/compartilhar.jpg',
    logo: D.site.base + 'assets/img/icone-512.png',
    description: L.meta.descricao,
    genre: ['Psytrance', 'Techno'],
    member: { '@type': 'Person', name: 'Rodolfo Carvalho' },
    sameAs: D.redes.map((r) => r.url),
    album: { '@type': 'MusicAlbum', name: D.album.titulo, datePublished: D.album.lancamento, byArtist: { '@type': 'MusicGroup', name: 'ARCANNE' } },
    track: { '@type': 'MusicRecording', name: D.destaque.titulo, datePublished: D.destaque.data, url: spotifyTrack(D.destaque.spotify_track) },
  };

  const capitulos = D.aovivo.map((c, i) => {
    const meta = [c.lugar, nomePais(c.pais), `aftermovie · ${c.duracao < 60 ? c.duracao + ' ' + L.aovivo.s : Math.round(c.duracao / 60) + ' ' + L.aovivo.min}`, c.credito ? `${L.aovivo.filmado_por} ${c.credito}` : ''].filter(Boolean).join(' · ');
    const yt = c.youtube ? `https://www.youtube.com/watch?v=${c.youtube}` : '';
    return `
      <article class="capitulo capitulo--${c.formato}${i % 2 ? ' capitulo--dir' : ''}" id="aovivo-${c.id}" aria-labelledby="cap-${c.id}">
        <div class="capitulo-midia">
          <video class="cena-video" muted loop playsinline preload="none" aria-hidden="true" tabindex="-1"
            poster="${R}${c.capa}" data-poster-m="${R}${c.capa_m}" data-src="${R}${c.loop}" data-src-m="${R}${c.loop_m}"></video>
        </div>
        <div class="capitulo-fundo" aria-hidden="true">${esc(ano(c.ano) || c.titulo.split(' ')[0])}</div>
        <div class="capitulo-texto">
          <p class="capitulo-n">0${i + 1} / 0${D.aovivo.length}</p>
          <h3 class="capitulo-titulo" id="cap-${c.id}">${esc(c.titulo)}${c.ano ? ` <span class="capitulo-ano">${c.ano}</span>` : ''}</h3>
          <p class="capitulo-meta">${esc(meta)}</p>
          <div class="acoes">
            <button class="botao botao--claro" type="button" data-filme="${c.id}" data-filme-src="${c.filme ? R + c.filme : ''}" data-filme-capa="${R}${c.filme_capa}" data-youtube="${esc(c.youtube)}" data-formato="${c.formato}" data-titulo="${esc(c.titulo + (c.ano ? ' ' + c.ano : ''))}">${ICONE.play}<span>${esc(L.aovivo.assistir)}</span></button>
            ${yt ? `<a class="link" href="${yt}" ${fora()}>YouTube${ICONE.fora}<span class="sr">(${esc(L.ui.abrir_nova)})</span></a>` : ''}
          </div>
        </div>
      </article>`;
  }).join('');

  const fotosPress = D.fotos.map((f) => {
    const [w, h] = dimensoes(f.arquivo);
    const altKey = { 'estudio-ficha': 'alt_ficha', 'estudio-grito': 'alt_grito', 'estudio-caixa': 'alt_caixa', 'palco-dia': 'alt_palco', cabine: 'alt_cabine', 'cabine-letreiro': 'alt_letreiro', clube: 'alt_clube' }[f.id];
    return `<li class="press-foto${f.recorte ? ' press-foto--recorte' : ''}">
            <a href="${R}${f.arquivo}" download>
              ${img(R, f.id, L.artista[altKey], 'press-foto-img', '(min-width: 900px) 22vw, 45vw')}
              <span class="press-foto-dados">${ICONE.baixar}<span>${f.recorte ? esc(L.press.recorte) : 'JPG'} · ${w}×${h} · ${tamanho(f.arquivo)}</span></span>
            </a>
          </li>`;
  }).join('\n          ');

  const logosPress = D.logos.map((l) => `<li class="press-logo press-logo--${l.id.endsWith('branco') ? 'branco' : 'preto'}">
            <a href="${R}${l.arquivo}" download>
              <img src="${R}${l.arquivo}" alt="" loading="lazy" decoding="async" width="${dimensoes(l.arquivo)[0]}" height="${dimensoes(l.arquivo)[1]}">
              <span class="press-logo-nome">${esc(L.press.logo_nomes[l.id])}</span>
              <span class="press-foto-dados">${ICONE.baixar}<span>PNG · ${tamanho(l.arquivo)}</span></span>
            </a>
          </li>`).join('\n          ');

  const trechos = D.trechos.map((t, i) => {
    const sub = t.original ? `${esc(t.versao === 'remix' ? '' : '(' + t.versao + ')')} · ${esc(L.musica.remix_de)} ${esc(t.original)}` : '';
    return `<li class="trecho"><span class="trecho-n">${String(i + 1).padStart(2, '0')}</span>
        ${faixa(L, R, { id: 'trecho-' + i, titulo: t.titulo, sub: sub.replace(/^ · /, ''), audio: t.audio, duracao: t.duracao })}
        ${t.spotify_album ? `<a class="trecho-spotify" href="${spotifyAlbum(t.spotify_album)}" ${fora()} aria-label="${esc(t.titulo)} · Spotify (${esc(L.ui.abrir_nova)})">Spotify${ICONE.fora}</a>` : '<span class="trecho-spotify" aria-hidden="true"></span>'}
      </li>`;
  }).join('\n      ');

  const contatos = [
    contato.email && `<a class="botao botao--tinta" href="mailto:${esc(contato.email)}" data-canal="email">${esc(L.booking.email)}${ICONE.seta}</a>`,
    contato.whatsapp && `<a class="botao botao--tinta" href="https://wa.me/${esc(contato.whatsapp.replace(/\D/g, ''))}" ${fora()} data-canal="whatsapp">${esc(L.booking.whatsapp)}${ICONE.seta}</a>`,
    contato.instagram_dm && `<a class="botao botao--tinta" href="${esc(contato.instagram_dm)}" ${fora()} data-canal="instagram">${esc(L.booking.instagram)}${ICONE.fora}<span class="sr">(${esc(L.ui.abrir_nova)})</span></a>`,
  ].filter(Boolean).join('\n          ');
  const canalPrincipal = contato.email ? `mailto:${contato.email}` : contato.whatsapp ? `https://wa.me/${contato.whatsapp.replace(/\D/g, '')}` : contato.instagram_dm;

  const redes = D.redes.map((r) => `<li><a href="${esc(r.url)}" ${fora()}><span class="rede-nome">${esc(r.nome)}</span><span class="rede-rotulo">${esc(r.rotulo)}</span>${ICONE.fora}<span class="sr">(${esc(L.ui.abrir_nova)})</span></a></li>`).join('\n          ');

  const csp = [
    "default-src 'self'",
    `script-src 'self' 'sha256-${IDIOMA_HASH}'`,
    "style-src 'self'",
    "img-src 'self' data:",
    "media-src 'self'",
    "font-src 'self'",
    "connect-src 'self'",
    'frame-src https://www.youtube-nocookie.com https://open.spotify.com',
    "object-src 'none'",
    "base-uri 'none'",
    "form-action 'none'",
  ].join('; ');

  return `<!doctype html>
<html lang="${L.lang}" data-idioma="${L.lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta http-equiv="Content-Security-Policy" content="${csp}">
<script>${IDIOMA_JS}</script>
<meta name="referrer" content="strict-origin-when-cross-origin">
<title>${esc(L.meta.titulo)}</title>
<meta name="description" content="${esc(L.meta.descricao)}">
${D.site.indexar ? '' : '<meta name="robots" content="noindex, nofollow">\n'}<link rel="canonical" href="${url}">
${IDIOMAS.map((x) => `<link rel="alternate" hreflang="${x.lang}" href="${D.site.base + x.caminho}">`).join('\n')}
<link rel="alternate" hreflang="x-default" href="${D.site.base}">
<meta name="theme-color" content="#0b0b0c">
<meta name="color-scheme" content="dark light">
<meta property="og:type" content="profile">
<meta property="og:site_name" content="ARCANNE">
<meta property="og:title" content="${esc(L.meta.titulo)}">
<meta property="og:description" content="${esc(L.meta.descricao)}">
<meta property="og:url" content="${url}">
<meta property="og:locale" content="${L.og_locale}">
<meta property="og:locale:alternate" content="${outro.og_locale}">
<meta property="og:image" content="${D.site.base}assets/img/compartilhar.jpg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${esc(L.meta.og_alt)}">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="${R}assets/img/favicon.png" type="image/png" sizes="48x48">
<link rel="apple-touch-icon" href="${R}assets/img/icone-180.png">
<link rel="preload" href="${R}fonts/Archivo-VF.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" as="image" href="${R}assets/img/logo.webp" imagesrcset="${R}assets/img/logo-m.webp 720w, ${R}assets/img/logo.webp 1400w" imagesizes="(max-width: 899px) 84vw, 780px" fetchpriority="high">
<link rel="stylesheet" href="${R}css/site.css">
<script type="application/ld+json">${JSON.stringify(ld)}</script>
</head>
<body>
<a class="pular sr-foco" href="#conteudo">${esc(L.ui.pular_conteudo)}</a>

<div class="abertura" id="abertura" hidden data-src="${R}${D.midia.abertura}" data-src-v="${R}${D.midia.abertura_v}">
  <video class="abertura-video" muted playsinline preload="none" aria-hidden="true" tabindex="-1"></video>
  <button class="abertura-pular" type="button">${esc(L.ui.pular)}${ICONE.seta}</button>
</div>

<header class="topo" id="topo">
  <a class="topo-marca" href="#inicio" aria-label="ARCANNE · ${esc(L.ui.topo)}"><img src="${R}assets/img/logo-linha-p.webp" width="${dimensoes('assets/img/logo-linha.webp')[0]}" height="${dimensoes('assets/img/logo-linha.webp')[1]}" alt=""></a>
  <nav class="topo-nav" id="menu" aria-label="${esc(L.ui.nav_aria)}">
    <ul>
      <li><a href="#artista">${esc(L.nav.artista)}</a></li>
      <li><a href="#aovivo">${esc(L.nav.aovivo)}</a></li>
      <li><a href="#musica">${esc(L.nav.musica)}</a></li>
      <li><a href="#press">${esc(L.nav.press)}</a></li>
      <li><a href="#booking">${esc(L.nav.booking)}</a></li>
    </ul>
  </nav>
  <div class="topo-acoes">
    <button class="som" type="button" aria-pressed="false" aria-label="${esc(L.ui.som_ligar)} · Odin on Acid" data-ligar="${esc(L.ui.som_ligar)}" data-desligar="${esc(L.ui.som_desligar)}" data-faixa-alvo="destaque">${BARRAS}<span class="som-texto">${esc(L.ui.som_ligar)}</span></button>
    <div class="idiomas" role="group" aria-label="${esc(L.ui.idioma_aria)}">
      ${IDIOMAS.map((x) => x === L ? `<span class="idioma idioma--atual" aria-current="true" lang="${x.lang}">${x.lang === 'en' ? 'EN' : 'PT'}</span>` : `<a class="idioma" href="${R}${x.caminho}" hreflang="${x.lang}" lang="${x.lang}" data-idioma-para="${x.lang}" aria-label="${x.lang === 'en' ? 'EN · English' : 'PT · Português'}">${x.lang === 'en' ? 'EN' : 'PT'}</a>`).join('<span class="idioma-sep" aria-hidden="true">/</span>')}
    </div>
    <button class="menu-botao" type="button" aria-expanded="false" aria-controls="menu" data-abrir="${esc(L.ui.menu)}" data-fechar="${esc(L.ui.fechar_menu)}"><span class="menu-botao-linhas" aria-hidden="true"></span><span class="sr">${esc(L.ui.menu)}</span></button>
  </div>
</header>

<main id="conteudo">

  <section class="inicio" id="inicio" aria-labelledby="inicio-t">
    <div class="cena" aria-hidden="true">
      <picture><source media="(max-width: 899px)" srcset="${R}${D.midia.inicio_capa_m}" width="720" height="1280"><img class="cena-capa" src="${R}${D.midia.inicio_capa}" width="1920" height="1080" alt="" fetchpriority="high" decoding="async"></picture>
      <video class="cena-video" muted loop playsinline preload="none" tabindex="-1" data-src="${R}${D.midia.inicio}" data-src-m="${R}${D.midia.inicio_m}" data-agora></video>
    </div>
    <div class="inicio-corpo">
      <p class="rotulo">${esc(L.inicio.rotulo)}</p>
      <h1 class="inicio-titulo" id="inicio-t"><span class="sr">ARCANNE</span><img class="inicio-logo" src="${R}assets/img/logo.webp" srcset="${R}assets/img/logo-m.webp 720w, ${R}assets/img/logo.webp 1400w" sizes="(max-width: 899px) 84vw, 780px" width="${dimensoes('assets/img/logo.webp')[0]}" height="${dimensoes('assets/img/logo.webp')[1]}" alt="" fetchpriority="high"></h1>
      <p class="inicio-linha">${esc(L.inicio.linha)}</p>
      <div class="acoes">
        <a class="botao botao--sinal" href="#musica">${esc(L.inicio.ouvir)}${ICONE.seta}</a>
        <a class="botao botao--vidro" href="#aovivo">${esc(L.inicio.aovivo)}</a>
        <a class="botao botao--vidro" href="#booking">${esc(L.inicio.booking)}</a>
      </div>
    </div>
    <button class="inicio-novo" type="button" data-tocar="destaque">
      <span class="inicio-novo-rotulo">${esc(L.inicio.novo)} · 2026</span>
      <span class="inicio-novo-titulo">Odin on Acid</span>
      <span class="inicio-novo-play">${ICONE.play}${ICONE.pausa}<span class="sr">${esc(L.inicio.novo_acao)}</span></span>
    </button>
    <p class="inicio-rolar" aria-hidden="true">${esc(L.inicio.rolar)}</p>
  </section>

  <section class="artista" id="artista" aria-labelledby="artista-t">
    <img class="artista-anel" src="${R}assets/img/anel.webp" alt="" aria-hidden="true" loading="lazy" decoding="async" width="${dimensoes('assets/img/anel.webp')[0]}" height="${dimensoes('assets/img/anel.webp')[1]}">
    <header class="secao-cab">
      <p class="rotulo">${esc(L.artista.rotulo)}</p>
      <h2 class="secao-titulo" id="artista-t">${esc(L.artista.titulo)}</h2>
    </header>
    <p class="manchete" data-esticar>${esc(L.artista.citacao)}</p>
    <div class="artista-grade">
      <figure class="foto foto--ficha" data-prof="-0.06">
        ${img(R, 'estudio-ficha', L.artista.alt_ficha, 'foto-img', '(min-width: 900px) 36vw, 88vw')}
      </figure>
      <dl class="ficha" aria-label="${esc(L.artista.ficha_titulo)}">
        <div class="ficha-topo" aria-hidden="true"><span>#N</span><span>PD</span><span>Ref</span></div>
        ${L.artista.ficha.map(([k, v]) => `<div class="ficha-linha"><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('\n        ')}
      </dl>
      <div class="bio">
        ${L.artista.bio.map((p) => `<p>${esc(p)}</p>`).join('\n        ')}
      </div>
      <figure class="foto foto--grito" data-prof="0.12">
        ${img(R, 'estudio-grito', L.artista.alt_grito, 'foto-img', '(min-width: 900px) 28vw, 70vw')}
      </figure>
      <figure class="foto foto--caixa" data-prof="0.05">
        ${img(R, 'estudio-caixa', L.artista.alt_caixa, 'foto-img', '(min-width: 900px) 48vw, 96vw')}
      </figure>
    </div>
    <ul class="tira" aria-label="${esc(L.aovivo.titulo)}">
      <li>${img(R, 'palco-dia', L.artista.alt_palco, 'tira-img', '(min-width: 900px) 24vw, 70vw')}</li>
      <li>${img(R, 'cabine-letreiro', L.artista.alt_letreiro, 'tira-img', '(min-width: 900px) 24vw, 70vw')}</li>
      <li>${img(R, 'clube', L.artista.alt_clube, 'tira-img', '(min-width: 900px) 24vw, 70vw')}</li>
      <li>${img(R, 'cabine', L.artista.alt_cabine, 'tira-img', '(min-width: 900px) 24vw, 70vw')}</li>
    </ul>
  </section>

  <section class="aovivo" id="aovivo" aria-labelledby="aovivo-t">
    <header class="secao-cab">
      <p class="rotulo">${esc(L.aovivo.rotulo)}</p>
      <h2 class="secao-titulo" id="aovivo-t">${esc(L.aovivo.titulo)}</h2>
      <p class="secao-intro">${esc(L.aovivo.intro)}</p>
    </header>
    ${capitulos}
    <div class="passagens">
      <h3 class="sub-titulo">${esc(L.aovivo.passagens_titulo)}</h3>
      <ol class="passagens-lista">
        ${D.passagens.map(([n, c, p], i) => `<li class="passagem"><span class="passagem-n">${String(i + 1).padStart(2, '0')}</span><span class="passagem-nome" data-esticar>${esc(n)}</span><span class="passagem-lugar">${esc(c)} · ${esc(nomePais(p))}</span></li>`).join('\n        ')}
      </ol>
      <p class="nota">${esc(L.aovivo.passagens_nota)}</p>
    </div>
  </section>

  <section class="musica" id="musica" aria-labelledby="musica-t">
    <video class="musica-pulso" muted loop playsinline preload="none" aria-hidden="true" tabindex="-1" data-src="${R}${D.midia.pulso}"></video>
    <header class="secao-cab">
      <p class="rotulo">${esc(L.musica.rotulo)}</p>
      <h2 class="secao-titulo" id="musica-t">${esc(L.musica.titulo)}</h2>
    </header>
    <div class="destaque">
      <p class="rotulo">${esc(L.musica.destaque_rotulo)}</p>
      <h3 class="destaque-titulo" data-esticar>${esc(D.destaque.titulo)}</h3>
      ${faixa(L, R, { id: 'destaque', titulo: D.destaque.titulo, audio: D.destaque.audio, duracao: D.destaque.duracao, grande: true })}
      <p class="nota">${esc(L.musica.destaque_nota)} · ${D.destaque.bpm} BPM</p>
      <a class="link" href="${spotifyTrack(D.destaque.spotify_track)}" ${fora()}>${esc(L.musica.ouvir_spotify)}${ICONE.fora}<span class="sr">(${esc(L.ui.abrir_nova)})</span></a>
    </div>

    <div class="trechos">
      <h3 class="sub-titulo">${esc(L.musica.trechos_titulo)}</h3>
      <p class="nota">${esc(L.musica.trechos_nota)}</p>
      <ol class="trechos-lista">
      ${trechos}
      </ol>
    </div>

    <div class="spotify" data-spotify="${esc(D.spotify_embed.track)}">
      <h3 class="sub-titulo">${esc(L.musica.spotify_titulo)}</h3>
      <p class="spotify-faixa">${esc(D.spotify_embed.titulo)} <span>· ${D.spotify_embed.ano}</span></p>
      <div class="spotify-caixa">
        <button class="botao botao--tinta" type="button" data-carregar-spotify>${ICONE.play}<span>${esc(L.musica.spotify_carregar)}</span></button>
        <p class="nota">${esc(L.musica.spotify_aviso)} <a href="${spotifyTrack(D.spotify_embed.track)}" ${fora()}>open.spotify.com${ICONE.fora}<span class="sr">(${esc(L.ui.abrir_nova)})</span></a></p>
      </div>
    </div>

    <div class="album">
      <h3 class="sub-titulo">${esc(L.musica.album_titulo)}</h3>
      <p class="album-nome" data-esticar>${esc(D.album.titulo)}</p>
      <p>${esc(L.musica.album_texto)}</p>
    </div>

    <div class="disco">
      <h3 class="sub-titulo">${esc(L.musica.disco_titulo)}</h3>
      <p class="nota">${esc(L.musica.disco_nota.replace('{n}', D.discografia.itens.length))}</p>
      <div class="disco-anos">
        ${anos.map((a) => `<div class="disco-ano"><h4>${a}</h4><ul>${discoPorAno[a].map(([t, id]) => `<li><a href="${spotifyAlbum(id)}" ${fora()}>${esc(t)}<span class="sr"> · Spotify (${esc(L.ui.abrir_nova)})</span></a></li>`).join('')}</ul></div>`).join('\n        ')}
      </div>
    </div>

    <div class="onde">
      <h3 class="sub-titulo">${esc(L.musica.plataformas_titulo)}</h3>
      <ul class="onde-lista">
        ${D.redes.filter((r) => ['spotify', 'soundcloud', 'beatport', 'youtube'].includes(r.id)).map((r) => `<li><a href="${esc(r.url)}" ${fora()}>${esc(r.nome)}${ICONE.fora}<span class="sr">(${esc(L.ui.abrir_nova)})</span></a></li>`).join('\n        ')}
        ${D.playlists.map((p) => `<li><a href="${esc(p.url)}" ${fora()}><span class="onde-tipo">${esc(L.musica.playlists_titulo)}</span>${esc(p.titulo)}${ICONE.fora}<span class="sr">(${esc(L.ui.abrir_nova)})</span></a></li>`).join('\n        ')}
      </ul>
    </div>
  </section>

  <section class="press" id="press" aria-labelledby="press-t">
    <header class="secao-cab">
      <p class="rotulo">${esc(L.press.rotulo)}</p>
      <h2 class="secao-titulo" id="press-t">${esc(L.press.titulo)}</h2>
    </header>
    ${existe(D.presskit_zip) ? `<a class="press-zip" href="${R}${D.presskit_zip}" download>
      <span class="press-zip-texto"><span class="press-zip-titulo">${esc(L.press.zip)}</span><span class="press-zip-inclui">${esc(L.press.zip_inclui)}</span></span>
      <span class="press-zip-dados">${ICONE.baixar}ZIP · ${tamanho(D.presskit_zip)}</span>
    </a>` : ''}
    <div class="press-bios">
      ${[['curta', L.press.bio_curta], ['completa', L.press.bio_completa]].map(([tipo, titulo]) => `<div class="press-bio press-bio--${tipo}">
        <h3 class="sub-titulo">${esc(titulo)}</h3>
        ${[['pt', L.press.lingua_pt, IDIOMAS[0]], ['en', L.press.lingua_en, IDIOMAS[1]]].map(([lg, nome, LX]) => {
          const texto = tipo === 'curta' ? [L.press['curta_' + lg]] : LX.artista.bio;
          return `<div class="press-texto" lang="${LX.lang}">
          <div class="press-texto-cab"><span class="rotulo">${esc(nome)}</span><button class="copiar" type="button" data-copiar="#bio-${tipo}-${lg}" data-ok="${esc(L.ui.copiado)}">${esc(L.ui.copiar)}</button></div>
          <div class="press-texto-corpo" id="bio-${tipo}-${lg}"${tipo === 'completa' ? ` tabindex="0" role="region" aria-label="${esc(titulo)} · ${esc(nome)}"` : ''}>${texto.map((p) => `<p>${esc(p)}</p>`).join('')}</div>
        </div>`;
        }).join('\n        ')}
      </div>`).join('\n      ')}
    </div>
    <div class="press-bloco">
      <h3 class="sub-titulo">${esc(L.press.fotos_titulo)}</h3>
      <p class="nota">${esc(L.press.fotos_nota)}</p>
      <ul class="press-fotos">
          ${fotosPress}
      </ul>
    </div>
    <div class="press-bloco">
      <h3 class="sub-titulo">${esc(L.press.logos_titulo)}</h3>
      <p class="nota">${esc(L.press.logos_nota)}</p>
      <ul class="press-logos">
          ${logosPress}
      </ul>
    </div>
  </section>

  <section class="booking" id="booking" aria-labelledby="booking-t">
    <header class="secao-cab">
      <p class="rotulo">${esc(L.booking.rotulo)}</p>
      <h2 class="booking-titulo" id="booking-t" data-esticar>${esc(L.booking.titulo)}</h2>
    </header>
    <div class="booking-grade">
      <div class="booking-texto">
        <p class="booking-lead">${esc(L.booking.texto)}</p>
        <div class="acoes">
          ${contatos}
          <a class="botao botao--linha" href="#press">${esc(L.booking.press)}</a>
        </div>
        <p class="nota">${esc(L.booking.extra)}</p>
      </div>
      <form class="pedido" data-canal="${esc(canalPrincipal)}" data-ola="${esc(L.booking.msg_ola)}" data-ok="${esc(L.booking.enviado)}" data-ok-sem-copia="${esc(L.booking.enviado_sem_copia)}" novalidate>
        <h3 class="sub-titulo">${esc(L.booking.form_titulo)}</h3>
        <p class="nota">${esc(L.booking.form_nota)}</p>
        <div class="campos">
          <label class="campo"><span>${esc(L.booking.campo_nome)}</span><input name="nome" autocomplete="name" maxlength="80"></label>
          <label class="campo"><span>${esc(L.booking.campo_evento)}</span><input name="evento" maxlength="120"></label>
          <label class="campo"><span>${esc(L.booking.campo_cidade)}</span><input name="cidade" autocomplete="address-level2" maxlength="80"></label>
          <label class="campo"><span>${esc(L.booking.campo_data)}</span><input name="data" type="date"></label>
          <label class="campo campo--largo"><span>${esc(L.booking.campo_msg)}</span><textarea name="msg" rows="3" maxlength="800"></textarea></label>
        </div>
        <button class="botao botao--tinta" type="submit">${esc(L.booking.enviar)}${ICONE.seta}</button>
        <p class="pedido-status" role="status" aria-live="polite"></p>
        <pre class="pedido-texto" hidden></pre>
      </form>
    </div>
  </section>
</main>

<footer class="rodape">
  <img class="rodape-logo" src="${R}assets/img/logo-linha.webp" srcset="${R}assets/img/logo-linha-p.webp 480w, ${R}assets/img/logo-linha.webp 1800w" sizes="(max-width: 700px) 88vw, 620px" alt="ARCANNE" loading="lazy" decoding="async" width="${dimensoes('assets/img/logo-linha.webp')[0]}" height="${dimensoes('assets/img/logo-linha.webp')[1]}">
  <ul class="rodape-redes">
          ${redes}
  </ul>
  <div class="rodape-fim">
    <p>${esc(L.rodape.direitos)}</p>
    <p class="rodape-ass">${esc(L.rodape.feito)} Amplitude Lab</p>
  </div>
</footer>

<dialog class="player" id="player" aria-labelledby="player-t">
  <div class="player-cab">
    <p class="player-titulo" id="player-t">${esc(L.aovivo.player_titulo)}</p>
    <button class="player-fechar" type="button" aria-label="${esc(L.ui.fechar)}">${ICONE.fechar}</button>
  </div>
  <div class="player-palco"></div>
  <p class="player-nota" data-youtube-nota="${esc(L.aovivo.player_youtube)}" data-youtube-abrir="${esc(L.aovivo.player_abrir_youtube)}"></p>
</dialog>

<audio id="audio" preload="none"></audio>
<script src="${R}js/app.js" defer></script>
</body>
</html>
`;
}

for (const L of IDIOMAS) {
  const dest = path.join(RAIZ, L.caminho, 'index.html');
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, pagina(L));
  console.log('ok', path.relative(process.cwd(), dest));
}

const hoje = new Date().toISOString().slice(0, 10);
fs.writeFileSync(path.join(RAIZ, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${IDIOMAS.map((L) => `  <url>
    <loc>${D.site.base + L.caminho}</loc>
    <lastmod>${hoje}</lastmod>
${IDIOMAS.map((x) => `    <xhtml:link rel="alternate" hreflang="${x.lang}" href="${D.site.base + x.caminho}"/>`).join('\n')}
    <xhtml:link rel="alternate" hreflang="x-default" href="${D.site.base}"/>
  </url>`).join('\n')}
</urlset>
`);
// O robots.txt só vale na raiz do domínio. Em amplitudelab.github.io/lab ele não é lido;
// fica pronto para quando o site for para o domínio do artista.
fs.writeFileSync(path.join(RAIZ, 'robots.txt'), D.site.indexar
  ? `User-agent: *\nAllow: /\n\nSitemap: ${D.site.base}sitemap.xml\n`
  : `# Site em endereço provisório: fora dos buscadores até ir para o domínio do artista.\nUser-agent: *\nDisallow: /\n`);
console.log('ok sitemap.xml, robots.txt');
