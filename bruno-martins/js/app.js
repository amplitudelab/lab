/* BRUNO — Darky · Slowly · Obskurial
   Roteador, montagem das vistas, passagens entre universos, formulário.
   O conteúdo editável fica em content.js. */
import { ARTISTA, CONTATO, REDES, PROJETOS, VIDEOS_GERAIS, FOTOS_ARTISTA, PRESS, TIPOS_EVENTO } from './content.js';

const gsap = window.gsap;
const ScrollTrigger = window.ScrollTrigger;
gsap.registerPlugin(ScrollTrigger);

const RAIZ = new URL('..', import.meta.url);            // pasta do site
const BASE = RAIZ.pathname;                             // ex.: /lab/bruno-martins/
const A = (p) => new URL('assets/' + p, RAIZ).href;
const ROTAS = ['', 'darky', 'slowly', 'obskurial'];
const CALMO = matchMedia('(prefers-reduced-motion: reduce)').matches;
const FINO = matchMedia('(hover: hover) and (pointer: fine)').matches;
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const url = (rota) => BASE + (rota ? rota + '/' : '');

const NOMES = { '': 'BRUNO', darky: 'DARKY', slowly: 'SLOWLY', obskurial: 'OBSKURIAL' };
const TITULOS = {
  '': 'BRUNO — Darky · Slowly · Obskurial',
  darky: 'DARKY — projeto de Bruno',
  slowly: 'SLOWLY — projeto de Bruno',
  obskurial: 'OBSKURIAL — projeto de Bruno',
};
const TEMA = { '': '#08080a', darky: '#07040d', slowly: '#f4ece1', obskurial: '#070203' };

/* ---------- pequenos construtores ---------- */
function img(p, alt, { cls = '', sizes = '(max-width: 760px) 90vw, 45vw', eager = false, attrs = '' } = {}) {
  return `<img class="${cls}" src="${A(p)}-m.webp" srcset="${A(p)}-m.webp 900w, ${A(p)}.webp 1800w" sizes="${sizes}" alt="${esc(alt)}" ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async" ${attrs}>`;
}
function logo(p, alt, cls = '') {
  return `<img class="${cls}" src="${A(p)}.webp" alt="${esc(alt)}" loading="lazy" decoding="async">`;
}
function letras(txt, cls = 'l') {
  return [...txt].map((c, i) => `<span class="${cls}" style="--i:${i}">${c === ' ' ? '&nbsp;' : esc(c)}</span>`).join('');
}
function palavras(txt) {
  return txt.split(' ').map((w, i) => `<span class="w" style="--i:${i}">${esc(w)}</span>`).join(' ');
}
function clipe(v, extra = '') {
  return `<figure class="clipe clipe--${v.formato} ${extra}" data-rev="mascara">
    <video muted loop playsinline preload="none" poster="${A(v.arquivo)}.webp" data-src="${A(v.arquivo)}.mp4" data-auto aria-label="${esc(v.titulo)} (trecho sem som)"></video>
    <button class="clipe__botao" type="button" aria-label="Pausar ou tocar o trecho: ${esc(v.titulo)}" aria-pressed="false"><i></i></button>
    <figcaption>${esc(v.titulo)}</figcaption>
  </figure>`;
}

const GLIFOS = {
  '': '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.4"/><circle cx="12" cy="6.5" r="1.6" fill="currentColor"/><circle cx="7.2" cy="15" r="1.6" fill="currentColor"/><circle cx="16.8" cy="15" r="1.6" fill="currentColor"/></svg>',
  darky: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2 4 20l4-2.5 4 4.5 4-4.5 4 2.5z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="miter"/><path d="M9.5 12.5h1.8M12.7 12.5h1.8" stroke="currentColor" stroke-width="1.6"/></svg>',
  slowly: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 20V11a7 7 0 0 1 14 0v9l-2.3-2-2.4 2-2.3-2-2.3 2-2.4-2z" fill="currentColor"/><circle cx="9.6" cy="11" r="1.3" fill="var(--glifo-olho,#fff)"/><circle cx="14.4" cy="11" r="1.3" fill="var(--glifo-olho,#fff)"/></svg>',
  obskurial: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 1.5 14.2 9.8 22.5 12l-8.3 2.2L12 22.5 9.8 14.2 1.5 12l8.3-2.2z" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="M12 8.2 15.8 12 12 15.8 8.2 12z" fill="currentColor"/></svg>',
};

/* ==========================================================================
   VISTAS
   ========================================================================== */
function vistaHome() {
  const portais = ['darky', 'slowly', 'obskurial'].map((id, i) => {
    const capa = { darky: 'darky/skull-02', slowly: 'slowly/slowly-01', obskurial: 'obskurial/art-01' }[id];
    return `<a class="portal portal--${id}" href="${url(id)}" data-rota="${id}">
      <span class="portal__img">${img(capa, '', { sizes: '(max-width:760px) 30vw, 12vw' })}</span>
      <span class="portal__n">0${i + 1}</span>
      <span class="portal__nome">${NOMES[id]}</span>
    </a>`;
  }).join('');

  const tri = ['darky', 'slowly', 'obskurial'].map((id) => {
    const p = PROJETOS[id];
    const capa = { darky: 'darky/darky-01', slowly: 'slowly/slowly-02', obskurial: 'obskurial/art-02' }[id];
    return `<a class="tri tri--${id}" href="${url(id)}" data-rota="${id}" aria-label="Entrar no universo ${p.nome}">
      <span class="tri__fundo">${img(capa, '', { sizes: '(max-width:760px) 100vw, 50vw' })}</span>
      <span class="tri__veu"></span>
      <span class="tri__glifo">${GLIFOS[id]}</span>
      <span class="tri__nome">${p.nome}</span>
      ${p.chamada ? `<span class="tri__chamada">${esc(p.chamada)}</span>` : ''}
      <span class="tri__entrar">Entrar <i>→</i></span>
    </a>`;
  }).join('');

  const extras = [['História', ARTISTA.historia], ['Influências', ARTISTA.influencias], ['Trajetória', ARTISTA.trajetoria], ['Filosofia musical', ARTISTA.filosofia], ['Experiência profissional', ARTISTA.experiencia]]
    .filter(([, v]) => v && v.length)
    .map(([t, v]) => `<div class="sobre__bloco" data-rev="sobe"><h3>${t}</h3>${[].concat(v).map((x) => `<p>${esc(x)}</p>`).join('')}</div>`).join('');

  return `
  <section class="h-hero" aria-label="Abertura">
    <div class="h-hero__tipo" aria-hidden="true" data-mouse="-14">${letras('BRUNO')}</div>
    <figure class="h-hero__foto" data-mouse="10">${img('artist/bruno-01', 'Bruno de blazer preto, ajustando os óculos escuros', { eager: true, sizes: '(max-width:760px) 100vw, 46vw' })}</figure>
    <div class="h-hero__tipo h-hero__tipo--frente" aria-hidden="true" data-mouse="-14">${letras('BRUNO')}</div>
    <div class="h-hero__texto">
      <h1><span class="sr">Bruno — </span>Um artista.<br><em>Três projetos independentes.</em></h1>
      <p class="h-hero__sub">DJ · ${esc(ARTISTA.cidade)}</p>
    </div>
    <div class="h-hero__portais" aria-label="Os três projetos">${portais}</div>
    <a class="h-hero__desce" href="#universos" data-ancora="universos"><span>Explorar</span><i></i></a>
  </section>

  <section class="h-tri" id="universos" aria-labelledby="t-universos">
    <header class="cab">
      <p class="rot">Os projetos</p>
      <h2 id="t-universos" data-rev="sobe">Três universos,<br>a mesma pessoa.</h2>
    </header>
    <div class="h-tri__grade">${tri}</div>
  </section>

  <section class="h-sobre" id="sobre" aria-labelledby="t-sobre">
    <figure class="h-sobre__foto" data-rev="mascara"><div data-px="-8">${img('artist/bruno-02', 'Retrato de Bruno em fundo preto, de blazer, segurando os óculos')}</div></figure>
    <div class="h-sobre__texto">
      <p class="rot">Sobre</p>
      <h2 id="t-sobre" data-rev="sobe">${esc(ARTISTA.nomeCompleto)}</h2>
      <p class="h-sobre__bio" data-rev="sobe">${esc(ARTISTA.bioCurta)}</p>
      <ul class="fatos">${ARTISTA.fatos.map((f) => `<li data-rev="sobe"><b>${esc(f.valor)}</b><span>${esc(f.rotulo)}</span></li>`).join('')}</ul>
      ${extras}
    </div>
    <figure class="h-sobre__foto2" data-rev="mascara"><div data-px="10">${img('artist/bruno-05', 'Bruno de camiseta azul e óculos azuis, mãos cruzadas', { sizes: '(max-width:760px) 60vw, 24vw' })}</div></figure>
  </section>`;
}

function fichaProjeto(p) {
  const linhas = [
    ['Vertentes', p.vertentes?.join(' · ')],
    ['Influências', p.influencias?.join(' · ')],
    ['BPM', p.bpm],
    ['Duração do set', p.duracaoSet],
    ['Formatos', p.formatos && [].concat(p.formatos).join(' · ')],
    ['Rider técnico', p.rider],
  ].filter(([, v]) => v);
  if (!linhas.length) return '';
  return `<dl class="ficha">${linhas.map(([k, v]) => `<div data-rev="sobe"><dt>${k}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>`;
}

function chamadaBooking(p) {
  return `<section class="contrate contrate--${p.id}" aria-label="Contratar ${p.nome}">
    <p class="rot">Booking</p>
    <h2 data-rev="sobe">Leve <b>${p.nome}</b> para a sua pista.</h2>
    <a class="botao botao--forte" href="#booking" data-ancora="booking" data-projeto="${p.id}">Contratar ${p.nome}</a>
  </section>`;
}

function vistaDarky() {
  const p = PROJETOS.darky;
  const faixa = (arr) => arr.map((f) => `<span>${esc(f)}</span><i aria-hidden="true">✕</i>`).join('');
  const cortes = ['a', 'b', 'c', 'd', 'e'];
  return `
  <section class="d-hero" aria-label="Darky">
    <div class="d-hero__tipo" aria-hidden="true" data-mouse="-18"><span>DARKY</span></div>
    <div class="d-hero__figura" data-mouse="8">
      <video class="d-hero__video" muted loop playsinline preload="none" poster="${A('generated/darky-aura')}.webp" data-src="${A('generated/darky-aura')}.mp4" data-auto aria-label="Darky de capuz e pintura de caveira, com aura violeta em movimento"></video>
    </div>
    <div class="d-hero__tipo d-hero__tipo--contorno" aria-hidden="true" data-mouse="-26"><span>DARKY</span></div>
    <h1 class="sr">Darky</h1>
    ${logo(p.logo, 'Logo Darky', 'd-hero__logo')}
    <dl class="d-hero__meta">
      <div><dt>Base</dt><dd>${esc(p.vertentes[0])}</dd></div>
      <div><dt>BPM</dt><dd>${esc(p.bpm)}</dd></div>
    </dl>
    <div class="brasas" aria-hidden="true">${Array.from({ length: 14 }, (_, i) => `<i style="--i:${i}"></i>`).join('')}</div>
  </section>

  <section class="d-conceito" aria-labelledby="t-dconceito">
    <p class="rot">Conceito</p>
    <h2 class="d-grito" id="t-dconceito" aria-label="${esc(p.chamada)}"><span data-rev="corte">NÃO SER</span><span data-rev="corte" class="d-grito__2">ROTULADO.</span></h2>
    <div class="d-conceito__texto">${p.conceito.map((t) => `<p data-rev="sobe">${esc(t)}</p>`).join('')}</div>
    ${fichaProjeto(p)}
  </section>

  <section class="d-faixas" aria-labelledby="t-dfaixas">
    <h2 class="rot" id="t-dfaixas">Faixas autorais</h2>
    <div class="esteira" aria-hidden="true"><div class="esteira__trilho">${faixa(p.faixas)}${faixa(p.faixas)}</div></div>
    <div class="esteira esteira--volta" aria-hidden="true"><div class="esteira__trilho">${faixa([...p.faixas].reverse())}${faixa([...p.faixas].reverse())}</div></div>
    <ul class="sr">${p.faixas.map((f) => `<li>${esc(f)}</li>`).join('')}</ul>
    <div class="d-fest">
      <h3 class="rot">Festivais em que as faixas tocaram</h3>
      <ul>${p.festivais.map((f, i) => `<li data-rev="sobe"><span>${String(i + 1).padStart(2, '0')}</span>${esc(f)}</li>`).join('')}</ul>
    </div>
  </section>

  <section class="d-fotos" aria-label="Fotografias do Darky">
    <figure class="d-fogo" data-rev="sobe"><div data-px="-10">${img('darky/skull-01', 'Darky de capuz e pintura de caveira, com fogo nas duas mãos', { sizes: '(max-width:760px) 90vw, 40vw' })}</div></figure>
    ${p.fotos.map((f, i) => `<figure class="d-foto d-foto--${cortes[i]}" data-rev="mascara"><div data-px="${[-6, 8, -9, 6, -5][i]}">${img(f, ['Darky estendendo a mão tatuada em direção à câmera', 'Darky de sobretudo preto, de perfil', 'Darky de óculos escuros, braços abertos, com luz ao fundo', 'Darky de sobretudo, com a mão na nuca', 'Darky de óculos escuros, abrindo o casaco'][i])}</div></figure>`).join('')}
  </section>`;
}

function vistaSlowly() {
  const p = PROJETOS.slowly;
  return `
  <section class="s-hero" aria-label="Slowly">
    <div class="s-bolhas" aria-hidden="true"><i></i><i></i><i></i><i></i></div>
    <h1 class="s-hero__titulo" aria-label="Slowly">${letras('Slowly', 'l')}</h1>
    <figure class="s-hero__foto bolha" data-mouse="10">${img('slowly/slowly-01', 'Slowly de camiseta branca, sorrindo de leve com o punho erguido', { eager: true, sizes: '(max-width:760px) 80vw, 36vw' })}</figure>
    <figure class="s-hero__foto2 bolha bolha--b" data-mouse="-16">${img('slowly/slowly-06', 'Perfil de Slowly de óculos escuros e cabelo preso', { sizes: '(max-width:760px) 40vw, 18vw' })}</figure>
    <div class="s-hero__vidro" data-mouse="-8"><p>${esc(p.chamada)}</p></div>
    ${logo(p.logo, 'Logo Slowly, com um fantasminha no lugar da letra o', 's-hero__logo')}
  </section>

  <section class="s-conceito" aria-labelledby="t-sconceito">
    <p class="rot" id="t-sconceito">Conceito</p>
    ${p.conceito.map((t) => `<p class="s-frase" data-rev="borra" aria-label="${esc(t)}">${palavras(t)}</p>`).join('')}
    <ul class="s-palavras" aria-hidden="true">${p.palavras.map((w, i) => `<li style="--i:${i}">${esc(w)}</li>`).join('')}</ul>
    ${fichaProjeto(p)}
  </section>

  <section class="s-fotos" aria-label="Fotografias do Slowly">
    <div class="s-fotos__trilho">
      ${p.fotos.map((f, i) => `<figure class="bolha bolha--${'abc'[i % 3]} s-fotos__item s-fotos__item--${i % 4}">${img(f, ['Slowly com o punho erguido', 'Slowly dançando de braço levantado', 'Slowly fazendo sinal com as duas mãos', 'Slowly de camiseta vinho, ajustando os óculos escuros', 'Perfil de Slowly de óculos escuros', 'Slowly de braços abertos, camiseta estampada', 'Slowly de perfil fazendo o sinal de paz'][i], { sizes: '(max-width:760px) 60vw, 26vw' })}</figure>`).join('')}
    </div>
  </section>`;
}

function vistaObskurial() {
  const p = PROJETOS.obskurial;
  const tres = (cls) => `<span class="glitch ${cls}">${logo(p.logo, 'Logo Obskurial', 'g0')}${logo(p.logo, '', 'g1')}${logo(p.logo, '', 'g2')}</span>`;
  return `
  <section class="o-hero" aria-label="Obskurial">
    <div class="o-hero__lado" aria-hidden="true">Obskurial</div>
    <span class="o-num" aria-hidden="true">I</span>
    <h1 class="sr">Obskurial</h1>
    <div class="o-hero__figura" data-mouse="12">
      <video class="o-hero__video" muted loop playsinline preload="none" poster="${A('generated/obskurial-fumaca')}.webp" data-src="${A('generated/obskurial-fumaca')}.mp4" data-auto aria-label="Ilustração do Obskurial: figura encapuzada com pintura de caveira estendendo a mão, com fumaça vermelha em movimento"></video>
    </div>
    <div class="o-hero__logo" data-mouse="-10">${tres('')}</div>
    <div class="o-linhas" aria-hidden="true"><i></i><i></i><i></i></div>
    ${p.chamada ? `<p class="o-hero__chamada">${esc(p.chamada)}</p>` : ''}
  </section>

  ${p.conceito.length ? `<section class="o-conceito"><span class="o-num" aria-hidden="true">·</span>${p.conceito.map((t) => `<p data-rev="corte">${esc(t)}</p>`).join('')}${fichaProjeto(p)}</section>` : ''}

  <section class="o-artes" aria-label="Artes do Obskurial">
    <span class="o-num" aria-hidden="true">II</span>
    <figure class="o-arte o-arte--a" data-rev="corte">
      <div class="o-arte__q" data-px="-8"><span class="glitch glitch--arte">${img(p.artes[0], 'Ilustração: figura de capuz preto forrado de vermelho, rosto pintado de caveira, mão estendida para a frente', { cls: 'g0' })}${img(p.artes[0], '', { cls: 'g1' })}${img(p.artes[0], '', { cls: 'g2' })}</span></div>
    </figure>
    <figure class="o-arte o-arte--b" data-rev="corte">
      <div class="o-arte__q" data-px="10">${img(p.artes[1], 'Ilustração: figura de capuz marrom com meia pintura de caveira, segurando uma chama na mão', { cls: 'g0' })}</div>
    </figure>
    <div class="o-artes__selo" data-rev="sobe">${logo(p.logo, '', '')}</div>
    <svg class="o-geo" viewBox="0 0 400 400" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width=".6"><path d="M200 10 364 105v190L200 390 36 295V105z"/><path d="M200 10v380M36 105l328 190M364 105 36 295"/><path d="M200 70 312 135v130L200 330 88 265V135z"/><circle cx="200" cy="200" r="64"/><path d="M200 136 255 232H145z"/><path d="M200 264 145 168h110z"/></g></svg>
  </section>`;
}

/* ---------- blocos comuns ---------- */
function blocoAudiovisual(rota) {
  if (rota) {
    const p = PROJETOS[rota];
    if (!p.videos.length) return '';
    return `<section class="av" id="audiovisual" aria-labelledby="t-av">
      <header class="cab"><p class="rot">Audiovisual</p><h2 id="t-av" data-rev="sobe">Registros de pista</h2></header>
      <div class="av__clipes av__clipes--${p.videos[0].formato}">${p.videos.map((v) => clipe(v)).join('')}</div>
    </section>`;
  }
  const todos = [...PROJETOS.darky.videos, ...PROJETOS.slowly.videos, ...VIDEOS_GERAIS];
  const h = todos.filter((v) => v.formato === 'h'), v = todos.filter((x) => x.formato === 'v');
  const fotos = FOTOS_ARTISTA.slice(2, 12);
  const alts = ['Bruno de blazer, braços cruzados', 'Bruno de blazer, olhando o relógio', 'Bruno de camiseta azul e óculos azuis', 'Bruno de camiseta azul, mão no queixo', 'Bruno de perfil, camiseta azul', 'Bruno ajustando os óculos azuis', 'Bruno de blazer e camisa estampada, ajustando os óculos', 'Bruno de blazer e camisa estampada', 'Bruno segurando os óculos ao lado do rosto', 'Bruno ajustando o punho do blazer'];
  return `<section class="av" id="audiovisual" aria-labelledby="t-av">
    <header class="cab"><p class="rot">Experiência audiovisual</p><h2 id="t-av" data-rev="sobe">Imagem<br>em movimento.</h2></header>
    <div class="av__clipes av__clipes--h">${h.map((x) => clipe(x)).join('')}</div>
    <div class="av__clipes av__clipes--v">${v.map((x) => clipe(x)).join('')}</div>
    <div class="mosaico">${fotos.map((f, i) => `<figure class="mosaico__i mosaico__i--${i}" data-rev="mascara"><div data-px="${i % 2 ? 7 : -7}">${img(f, alts[i], { sizes: '(max-width:760px) 50vw, 25vw' })}</div></figure>`).join('')}</div>
  </section>`;
}

function fachada(s) {
  const nome = { youtube: 'YouTube', spotify: 'Spotify', soundcloud: 'SoundCloud' }[s.tipo];
  return `<article class="player player--${s.tipo}">
    <div class="player__quadro">
      <button type="button" class="player__abrir" data-embed="${s.tipo}" data-id="${esc(s.id)}" data-titulo="${esc(s.titulo)}">
        <i aria-hidden="true"></i><span>Carregar player do ${nome}</span>
      </button>
    </div>
    <div class="player__pe"><h4>${esc(s.titulo)}</h4><a href="${esc(s.url)}" target="_blank" rel="noopener">Abrir no ${nome} ↗</a></div>
  </article>`;
}
function blocoSom(rota) {
  const lista = (rota ? [PROJETOS[rota]] : Object.values(PROJETOS)).filter((p) => p.som.length);
  if (!lista.length) return '';
  return `<section class="som" id="som" aria-labelledby="t-som">
    <header class="cab"><p class="rot">Sound</p><h2 id="t-som" data-rev="sobe">Onde ouvir.</h2>
    <p class="cab__nota">Nada toca sozinho: o player só carrega quando você pede.</p></header>
    ${lista.map((p) => `<div class="som__grupo som__grupo--${p.id}">
      <h3 class="som__projeto">${p.nome}</h3>
      <div class="som__grade">${p.som.map(fachada).join('')}</div>
    </div>`).join('')}
  </section>`;
}

const UFS = 'AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO'.split(' ');
function blocoBooking(rota) {
  const destino = CONTATO.whatsapp ? 'pelo WhatsApp' : CONTATO.email ? 'por e-mail' : `pela mensagem direta do Instagram @${CONTATO.instagram}`;
  const opcoes = Object.values(PROJETOS).map((p) => `
    <label class="escolha escolha--${p.id}">
      <input type="radio" name="projeto" value="${p.nome}" ${rota === p.id ? 'checked' : ''} required>
      <span class="escolha__c">${GLIFOS[p.id]}<b>${p.nome}</b>${p.vertentes?.length ? `<small>${esc(p.vertentes.join(' · '))}</small>` : ''}${p.bpm ? `<small>${esc(p.bpm)} BPM</small>` : ''}</span>
    </label>`).join('');
  return `<section class="booking" id="booking" aria-labelledby="t-booking">
    <header class="cab">
      <p class="rot">Booking · contratação</p>
      <h2 id="t-booking" data-rev="sobe">Três projetos.<br>Três contratações independentes.</h2>
      <p class="cab__nota">Para festivais, clubes, produtores, festas independentes e eventos privados. Conte sobre o evento e escolha o projeto: o pedido segue ${destino}.</p>
    </header>
    <form class="form" id="form-booking" novalidate>
      <fieldset class="form__projetos">
        <legend>Projeto desejado</legend>
        <div class="escolhas">${opcoes}</div>
        <p class="erro" data-erro="projeto"></p>
      </fieldset>
      <div class="form__grade">
        <label class="campo"><span>Nome do contratante</span><input name="nome" type="text" autocomplete="name" required maxlength="80"><em class="erro" data-erro="nome"></em></label>
        <label class="campo"><span>Nome do evento</span><input name="evento" type="text" required maxlength="80"><em class="erro" data-erro="evento"></em></label>
        <label class="campo"><span>Cidade</span><input name="cidade" type="text" autocomplete="address-level2" required maxlength="60"><em class="erro" data-erro="cidade"></em></label>
        <label class="campo campo--curto"><span>Estado</span><select name="uf" required><option value="">UF</option>${UFS.map((u) => `<option>${u}</option>`).join('')}<option value="Exterior">Exterior</option></select><em class="erro" data-erro="uf"></em></label>
        <label class="campo"><span>Data pretendida</span><input name="data" type="date" required><em class="erro" data-erro="data"></em></label>
        <label class="campo"><span>Tipo de evento</span><select name="tipo" required><option value="">Selecione</option>${TIPOS_EVENTO.map((t) => `<option>${t}</option>`).join('')}</select><em class="erro" data-erro="tipo"></em></label>
        <label class="campo campo--largo"><span>Seu contato (WhatsApp com DDD ou e-mail)</span><input name="contato" type="text" inputmode="email" autocomplete="email" required maxlength="80"><em class="erro" data-erro="contato"></em></label>
        <label class="campo campo--largo"><span>Mensagem</span><textarea name="mensagem" rows="4" maxlength="800" placeholder="Horário, estrutura, público esperado…"></textarea><em class="erro" data-erro="mensagem"></em></label>
      </div>
      <div class="form__pe">
        <button class="botao botao--forte" type="submit">Montar pedido de booking</button>
        <p class="form__nota">Os dados ficam só no seu aparelho até você enviar a mensagem.</p>
      </div>
      <div class="form__saida" id="form-saida" hidden tabindex="-1"></div>
    </form>
    <aside class="booking__lado">
      <h3 class="rot">Contato comercial</h3>
      <ul class="booking__contatos">
        ${CONTATO.whatsapp ? `<li><a href="https://wa.me/${CONTATO.whatsapp}" target="_blank" rel="noopener">WhatsApp ↗</a></li>` : ''}
        ${CONTATO.email ? `<li><a href="mailto:${CONTATO.email}">${esc(CONTATO.email)}</a></li>` : ''}
        <li><a href="https://www.instagram.com/${CONTATO.instagram}/" target="_blank" rel="noopener">Instagram @${CONTATO.instagram} ↗</a></li>
      </ul>
      ${CONTATO.agencia ? `<div class="booking__agencia"><span class="rot">Agência</span>${logo(CONTATO.agencia.logo, 'Agência ' + CONTATO.agencia.nome)}</div>` : ''}
    </aside>
  </section>`;
}

function blocoPress() {
  const projetos = Object.values(PROJETOS).map((p) => {
    const linhas = [['Vertentes', p.vertentes?.join(', ')], ['BPM', p.bpm], ['Faixas', p.faixas?.join(', ')], ['Festivais', p.festivais?.join(', ')]].filter(([, v]) => v);
    return `<article class="pk-proj pk-proj--${p.id}">
      <header>${logo(p.logoLinha, 'Logo ' + p.nome)}<h4>${p.nome}</h4></header>
      ${p.release ? `<p>${esc(p.release)}</p>` : ''}
      ${linhas.length ? `<dl>${linhas.map(([k, v]) => `<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>` : ''}
    </article>`;
  }).join('');
  return `<section class="press" id="press" aria-labelledby="t-press">
    <header class="cab">
      <p class="rot">Press kit digital</p>
      <h2 id="t-press" data-rev="sobe">Material oficial<br>para imprensa e produção.</h2>
      <div class="press__acoes">
        ${PRESS.pdf ? `<a class="botao botao--forte" href="${A(PRESS.pdf)}" download>Baixar press kit (PDF)</a>` : ''}
        <button class="botao" type="button" id="pk-imprimir">Salvar esta seção em PDF</button>
      </div>
    </header>
    <div class="press__bio">
      <article><h3 class="rot">Biografia curta</h3><p>${esc(ARTISTA.bioCurta)}</p></article>
    </div>
    <h3 class="rot press__t">Os projetos</h3>
    <div class="press__projetos">${projetos}</div>
    <h3 class="rot press__t">Fotografias oficiais</h3>
    <ul class="press__fotos">${PRESS.fotos.map((f) => `<li><a href="${A(f.arquivo)}" download title="Baixar ${esc(f.rotulo)} em alta">${img(f.previa, 'Foto oficial ' + f.rotulo, { sizes: '(max-width:760px) 45vw, 14vw' })}<span>${esc(f.rotulo)}${f.credito ? ` · foto ${esc(f.credito)}` : ''}<b>JPG ↓</b></span></a></li>`).join('')}</ul>
    <h3 class="rot press__t">Logos</h3>
    <ul class="press__logos">${PRESS.logos.map((l) => `<li class="fundo-${l.fundo}"><a href="${A(l.arquivo)}" download title="Baixar ${esc(l.rotulo)}">${logo(l.previa, 'Logo ' + l.rotulo)}<span>${esc(l.rotulo)}<b>PNG ↓</b></span></a></li>`).join('')}</ul>
    <h3 class="rot press__t">Links oficiais</h3>
    <ul class="press__links">${REDES.map((r) => `<li><a href="${esc(r.url)}" target="_blank" rel="noopener"><b>${esc(r.rede)}</b><span>${esc(r.rotulo)}</span><i>↗</i></a></li>`).join('')}</ul>
  </section>`;
}

function rodape() {
  const redes = [...new Map(REDES.filter((r) => r.rede !== 'YouTube').map((r) => [r.url, r])).values()];
  return `<div class="rodape__topo">
    <a class="rodape__marca" href="${url('')}" data-rota="">BRUNO</a>
    <ul class="rodape__projetos">${['darky', 'slowly', 'obskurial'].map((id) => `<li><a class="rp rp--${id}" href="${url(id)}" data-rota="${id}">${GLIFOS[id]}${NOMES[id]}</a></li>`).join('')}</ul>
  </div>
  <div class="rodape__cols">
    <div><h3 class="rot">Navegação</h3><ul>
      <li><a href="#sobre" data-ancora="sobre">Sobre</a></li>
      <li><a href="#som" data-ancora="som">Som</a></li>
      <li><a href="#audiovisual" data-ancora="audiovisual">Audiovisual</a></li>
      <li><a href="#press" data-ancora="press">Press kit</a></li>
      <li><a href="#booking" data-ancora="booking">Contratar</a></li>
    </ul></div>
    <div><h3 class="rot">Redes</h3><ul>${redes.map((r) => `<li><a href="${esc(r.url)}" target="_blank" rel="noopener">${esc(r.rede)} · ${esc(r.rotulo)} ↗</a></li>`).join('')}</ul></div>
    <div><h3 class="rot">Contato comercial</h3><ul>
      ${CONTATO.whatsapp ? `<li><a href="https://wa.me/${CONTATO.whatsapp}" target="_blank" rel="noopener">WhatsApp ↗</a></li>` : ''}
      ${CONTATO.email ? `<li><a href="mailto:${CONTATO.email}">${esc(CONTATO.email)}</a></li>` : ''}
      <li><a href="#booking" data-ancora="booking">Pedido de booking</a></li>
      <li><a href="https://www.instagram.com/${CONTATO.instagram}/" target="_blank" rel="noopener">Instagram @${CONTATO.instagram} ↗</a></li>
    </ul>${CONTATO.agencia ? `<div class="rodape__agencia">${logo(CONTATO.agencia.logo, 'Agência ' + CONTATO.agencia.nome)}</div>` : ''}</div>
  </div>
  <p class="rodape__credito">Direção e desenvolvimento: <a href="https://amplitudelab.github.io/lab/" target="_blank" rel="noopener">AMPLITUDE LAB</a> — Laboratório de Experiências Digitais</p>`;
}

/* ==========================================================================
   SELETOR DE UNIVERSOS
   ========================================================================== */
const seletor = $('#seletor');
function montarSeletor() {
  seletor.innerHTML = `
    <button class="seletor__alca" type="button" aria-expanded="false" aria-controls="seletor-lista">
      <span class="seletor__atual"></span><span class="seletor__trocar">universos</span>
    </button>
    <ul id="seletor-lista" class="seletor__lista">
      ${ROTAS.map((r) => `<li><a class="sel sel--${r || 'home'}" href="${url(r)}" data-rota="${r}">
        <span class="sel__glifo">${GLIFOS[r]}</span><span class="sel__nome">${NOMES[r]}</span>
        <span class="sel__tecla" aria-hidden="true">${ROTAS.indexOf(r)}</span>
      </a></li>`).join('')}
      <li class="seletor__marca" aria-hidden="true"></li>
    </ul>`;
  const alca = $('.seletor__alca', seletor);
  alca.addEventListener('click', () => abrirSeletor(alca.getAttribute('aria-expanded') !== 'true'));
  seletor.addEventListener('keydown', (e) => {
    const links = $$('.sel', seletor);
    const i = links.indexOf(document.activeElement);
    if (e.key === 'Escape') { abrirSeletor(false); alca.focus(); }
    if (i < 0) return;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); links[(i + 1) % links.length].focus(); }
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); links[(i + links.length - 1) % links.length].focus(); }
  });
}
function abrirSeletor(sim) {
  seletor.classList.toggle('aberto', sim);
  $('.seletor__alca', seletor).setAttribute('aria-expanded', String(sim));
  document.documentElement.classList.toggle('trava', sim && innerWidth <= 760);
}
function marcarSeletor(rota) {
  $$('.sel', seletor).forEach((a) => {
    const on = a.dataset.rota === rota;
    a.classList.toggle('ativo', on);
    if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
  });
  $('.seletor__atual', seletor).innerHTML = `${GLIFOS[rota]}<b>${NOMES[rota]}</b>`;
  const ativo = $('.sel.ativo', seletor), marca = $('.seletor__marca', seletor);
  if (ativo && marca) requestAnimationFrame(() => {
    marca.style.setProperty('--x', ativo.offsetLeft + 'px');
    marca.style.setProperty('--w', ativo.offsetWidth + 'px');
    marca.style.setProperty('--y', ativo.offsetTop + 'px');
    marca.style.setProperty('--h', ativo.offsetHeight + 'px');
  });
}

/* ==========================================================================
   PASSAGENS — cada destino tem a sua
   ========================================================================== */
const passagem = $('#passagem');
function passar(dest, troca) {
  if (CALMO) {
    return gsap.timeline()
      .to('#conteudo', { opacity: 0, duration: 0.15 })
      .add(troca)
      .to('#conteudo', { opacity: 1, duration: 0.2 });
  }
  passagem.className = 'passagem passagem--' + (dest || 'home') + ' ativa';
  const tl = gsap.timeline({ onComplete: () => { passagem.className = 'passagem'; passagem.innerHTML = ''; } });

  if (dest === 'darky') {
    // lâminas rasgando a tela na diagonal
    passagem.innerHTML = Array.from({ length: 6 }, (_, i) => `<i class="lamina" style="--i:${i}"></i>`).join('') + `<img class="passagem__logo" src="${A('logos/darky-branco')}.webp" alt="">`;
    tl.fromTo('.lamina', { xPercent: 130, skewX: -18 }, { xPercent: 0, skewX: -18, duration: 0.5, ease: 'power4.in', stagger: 0.045 })
      .fromTo('.passagem__logo', { opacity: 0, scale: 1.5 }, { opacity: 1, scale: 1, duration: 0.18, ease: 'power2.out' }, '-=0.1')
      .add(troca)
      .to('.passagem__logo', { opacity: 0, scale: 0.9, duration: 0.2 }, '+=0.12')
      .to('.lamina', { xPercent: -140, duration: 0.55, ease: 'power4.out', stagger: 0.04 }, '<');
  } else if (dest === 'slowly') {
    // bolhas subindo devagar até cobrir tudo, depois se desfazem
    passagem.innerHTML = Array.from({ length: 7 }, (_, i) => `<i class="gota" style="--i:${i}"></i>`).join('') + `<img class="passagem__logo" src="${A('logos/slowly-preto')}.webp" alt="">`;
    tl.fromTo('.gota', { scale: 0, yPercent: 60 }, { scale: 1, yPercent: 0, duration: 1.0, ease: 'sine.inOut', stagger: 0.07 })
      .fromTo('.passagem__logo', { opacity: 0, y: 30, filter: 'blur(14px)' }, { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.5, ease: 'sine.out' }, '-=0.5')
      .add(troca)
      .to('.passagem__logo', { opacity: 0, y: -20, filter: 'blur(10px)', duration: 0.5, ease: 'sine.in' }, '+=0.15')
      .to('.gota', { opacity: 0, scale: 1.25, duration: 0.9, ease: 'sine.inOut', stagger: 0.05 }, '<0.1');
  } else if (dest === 'obskurial') {
    // faixas de interferência travando a imagem, com varredura vermelha
    passagem.innerHTML = Array.from({ length: 14 }, (_, i) => `<i class="tira" style="--i:${i}"></i>`).join('') + '<b class="varredura"></b>' + `<img class="passagem__logo" src="${A('logos/obskurial')}.webp" alt="">`;
    tl.fromTo('.tira', { scaleX: 0, xPercent: () => gsap.utils.random(-30, 30) }, { scaleX: 1, xPercent: 0, duration: 0.34, ease: 'steps(5)', stagger: { each: 0.025, from: 'random' } })
      .fromTo('.varredura', { yPercent: -55 }, { yPercent: 55, duration: 0.5, ease: 'none' }, 0)
      .fromTo('.passagem__logo', { opacity: 0, skewX: 30 }, { opacity: 1, skewX: 0, duration: 0.16, ease: 'steps(3)' })
      .add(troca)
      .to('.passagem__logo', { opacity: 0, skewX: -30, duration: 0.14, ease: 'steps(3)' }, '+=0.18')
      .to('.tira', { scaleX: 0, transformOrigin: () => (Math.random() > 0.5 ? 'left' : 'right'), duration: 0.36, ease: 'steps(6)', stagger: { each: 0.02, from: 'random' } }, '<');
  } else {
    // volta ao centro: íris neutra
    passagem.innerHTML = '<i class="iris"></i><span class="passagem__nome">BRUNO</span>';
    tl.fromTo('.iris', { clipPath: 'circle(0% at 50% 50%)' }, { clipPath: 'circle(75% at 50% 50%)', duration: 0.6, ease: 'power3.inOut' })
      .fromTo('.passagem__nome', { opacity: 0, letterSpacing: '0.6em' }, { opacity: 1, letterSpacing: '0.2em', duration: 0.3 }, '-=0.25')
      .add(troca)
      .to('.passagem__nome', { opacity: 0, duration: 0.2 }, '+=0.1')
      .to('.iris', { opacity: 0, duration: 0.5, ease: 'power2.out' }, '<');
  }
  return tl;
}

/* ==========================================================================
   MONTAGEM E ANIMAÇÕES DE CADA VISTA
   ========================================================================== */
const vista = $('#vista'), comum = $('#comum');
let rotaAtual = null, ocupado = false, fx = null, mm = null;

function montar(rota) {
  document.documentElement.dataset.universo = rota || 'home';
  document.title = TITULOS[rota];
  $('meta[name="theme-color"]').setAttribute('content', TEMA[rota]);
  ScrollTrigger.getAll().forEach((t) => t.kill());
  gsap.killTweensOf($$('#conteudo *'));
  mouseAlvos = [];
  observador?.disconnect();

  const p = PROJETOS[rota];
  vista.innerHTML = { '': vistaHome, darky: vistaDarky, slowly: vistaSlowly, obskurial: vistaObskurial }[rota]();
  comum.innerHTML = blocoAudiovisual(rota) + blocoSom(rota) + (rota ? chamadaBooking(p) : '') + blocoBooking(rota) + (rota ? '' : blocoPress());
  $('#rodape').innerHTML = rodape();

  // links do topo que não têm destino nesta vista somem
  $$('.topo__nav [data-ancora]').forEach((a) => { a.hidden = !rota ? !document.getElementById(a.dataset.ancora) : (a.dataset.ancora !== 'press' && !document.getElementById(a.dataset.ancora)); });
  $$('.rodape [data-ancora]').forEach((a) => { const alvo = a.dataset.ancora; a.closest('li').hidden = !document.getElementById(alvo) && !(rota && (alvo === 'press' || alvo === 'sobre')); });

  marcarSeletor(rota);
  fx?.modo(rota || 'home');
  ligarVideos();
  ligarFormulario();
  const d = $('#form-booking [name="data"]'); if (d) d.min = new Date().toISOString().slice(0, 10);
  animar(rota);
}

function animar(rota) {
  if (CALMO) { $$('[data-rev]').forEach((e) => e.classList.add('visto')); return; }

  // revelações ao rolar
  revelador?.disconnect();
  revelador = new IntersectionObserver((ents) => ents.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('visto'); revelador.unobserve(en.target); } }), { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
  $$('[data-rev]').forEach((el) => revelador.observe(el));
  // paralaxe de rolagem
  $$('[data-px]').forEach((el) => {
    const f = parseFloat(el.dataset.px);
    gsap.fromTo(el, { yPercent: -f }, { yPercent: f, ease: 'none', scrollTrigger: { trigger: el.parentElement, start: 'top bottom', end: 'bottom top', scrub: 0.6 } });
  });
  // paralaxe do cursor
  if (FINO) {
    const alvos = $$('[data-mouse]').map((el) => ({ f: parseFloat(el.dataset.mouse), x: gsap.quickTo(el, 'x', { duration: 0.9, ease: 'power3' }), y: gsap.quickTo(el, 'y', { duration: 0.9, ease: 'power3' }) }));
    mouseAlvos = alvos;
  }

  const e = { ease: 'power4.out' };
  if (rota === '') {
    gsap.from('.h-hero__tipo .l', { yPercent: 110, rotate: 6, duration: 1.2, stagger: 0.07, ...e });
    gsap.from('.h-hero__foto img', { clipPath: 'inset(100% 0 0 0)', scale: 1.18, duration: 1.5, ease: 'power3.out', delay: 0.15 });
    gsap.from('.h-hero__texto > *', { y: 30, opacity: 0, duration: 0.9, stagger: 0.12, delay: 0.7, ...e });
    gsap.from('.portal', { y: 60, opacity: 0, duration: 0.9, stagger: 0.1, delay: 0.9, ...e });
    gsap.to('.h-hero__foto', { yPercent: 14, ease: 'none', scrollTrigger: { trigger: '.h-hero', start: 'top top', end: 'bottom top', scrub: true } });
    gsap.to('.h-hero__tipo', { yPercent: -22, ease: 'none', scrollTrigger: { trigger: '.h-hero', start: 'top top', end: 'bottom top', scrub: true } });
    gsap.from('.tri', { yPercent: 18, opacity: 0, duration: 1, stagger: 0.12, ...e, scrollTrigger: { trigger: '.h-tri__grade', start: 'top 80%' } });
  }
  if (rota === 'darky') {
    gsap.from('.d-hero__tipo span', { scaleY: 0, transformOrigin: '50% 100%', duration: 0.7, ease: 'expo.out', stagger: 0.08 });
    gsap.from('.d-hero__figura', { yPercent: 12, opacity: 0, duration: 1.1, delay: 0.15, ease: 'power3.out' });
    gsap.from('.d-hero__logo', { opacity: 0, scale: 1.25, filter: 'blur(12px)', duration: 0.8, delay: 0.55, ease: 'power3.out' });
    gsap.from('.d-hero__meta > div', { x: -30, opacity: 0, duration: 0.6, stagger: 0.1, delay: 0.8, ...e });
    gsap.to('.d-hero__tipo:not(.d-hero__tipo--contorno)', { yPercent: 30, ease: 'none', scrollTrigger: { trigger: '.d-hero', start: 'top top', end: 'bottom top', scrub: true } });
    gsap.to('.d-hero__figura', { scale: 1.08, ease: 'none', scrollTrigger: { trigger: '.d-hero', start: 'top top', end: 'bottom top', scrub: true } });
  }
  if (rota === 'slowly') {
    const s = { ease: 'sine.out' };
    gsap.from('.s-hero__titulo .l', { yPercent: 60, opacity: 0, filter: 'blur(18px)', duration: 1.8, stagger: 0.14, ...s });
    gsap.from('.s-hero__foto, .s-hero__foto2', { scale: 0.6, opacity: 0, duration: 2, stagger: 0.25, delay: 0.3, ease: 'sine.inOut' });
    gsap.from('.s-hero__vidro', { opacity: 0, y: 40, duration: 1.6, delay: 1, ...s });
    gsap.from('.s-hero__logo', { opacity: 0, duration: 1.6, delay: 1.3, ...s });
    gsap.to('.s-hero__titulo', { y: -140, ease: 'none', scrollTrigger: { trigger: '.s-hero', start: 'top top', end: 'bottom top', scrub: 1.5 } });
    const trilho = $('.s-fotos__trilho');
    if (trilho) gsap.to(trilho, { x: () => -(trilho.scrollWidth - innerWidth + 40), ease: 'none', scrollTrigger: { trigger: '.s-fotos', start: 'top 70%', end: 'bottom 20%', scrub: 1.8, invalidateOnRefresh: true } });
  }
  if (rota === 'obskurial') {
    gsap.from('.o-hero__logo', { opacity: 0, duration: 0.5, ease: 'steps(4)', delay: 0.2 });
    gsap.from('.o-hero__figura', { opacity: 0, xPercent: 8, duration: 0.6, ease: 'steps(6)', delay: 0.35 });
    gsap.from('.o-hero__lado', { opacity: 0, duration: 1.2, delay: 0.5, ease: 'power2.out' });
    gsap.from('.o-linhas i', { scaleX: 0, duration: 0.9, stagger: 0.12, ease: 'power4.inOut', delay: 0.2 });
    gsap.to('.o-geo', { rotate: 120, ease: 'none', scrollTrigger: { trigger: '.o-artes', start: 'top bottom', end: 'bottom top', scrub: 1 } });
    gsap.to('.o-hero__figura', { yPercent: 10, ease: 'none', scrollTrigger: { trigger: '.o-hero', start: 'top top', end: 'bottom top', scrub: true } });
  }
  requestAnimationFrame(() => ScrollTrigger.refresh());
}

/* ---------- vídeos: só carregam e tocam quando entram na tela ---------- */
let observador = null, revelador = null;
function ligarVideos() {
  const vids = $$('video[data-auto]');
  observador = new IntersectionObserver((ents) => {
    ents.forEach((en) => {
      const v = en.target;
      if (en.isIntersecting) {
        if (!v.src) v.src = v.dataset.src;
        if (!CALMO && !v.dataset.pausado) v.play().catch(() => {});
      } else if (!v.paused) v.pause();
    });
  }, { rootMargin: '120px 0px', threshold: 0.15 });
  vids.forEach((v) => observador.observe(v));
  $$('.clipe').forEach((c) => {
    const v = $('video', c), b = $('.clipe__botao', c);
    const pinta = () => { c.classList.toggle('tocando', !v.paused); b.setAttribute('aria-pressed', String(!v.paused)); };
    v.addEventListener('play', pinta); v.addEventListener('pause', pinta);
    b.addEventListener('click', () => {
      if (!v.src) v.src = v.dataset.src;
      if (v.paused) { delete v.dataset.pausado; v.play().catch(() => {}); } else { v.dataset.pausado = '1'; v.pause(); }
    });
  });
}

/* ---------- players: o iframe só entra quando a pessoa pede ---------- */
const EMBED = {
  youtube: (id) => `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?rel=0`,
  spotify: (id) => `https://open.spotify.com/embed/artist/${encodeURIComponent(id)}`,
  soundcloud: (id) => `https://w.soundcloud.com/player/?url=${encodeURIComponent('https://soundcloud.com/' + id)}&auto_play=false&visual=true`,
};
document.addEventListener('click', (e) => {
  const b = e.target.closest('.player__abrir');
  if (!b) return;
  const f = document.createElement('iframe');
  f.src = EMBED[b.dataset.embed](b.dataset.id);
  f.title = b.dataset.titulo;
  f.loading = 'lazy';
  f.allow = 'encrypted-media; picture-in-picture; fullscreen';
  f.referrerPolicy = 'strict-origin-when-cross-origin';
  b.replaceWith(f);
});

/* ==========================================================================
   FORMULÁRIO DE BOOKING
   ========================================================================== */
const REGRAS = {
  projeto: (v) => (v ? '' : 'Escolha um dos três projetos.'),
  nome: (v) => (v.trim().length >= 2 ? '' : 'Informe o nome de quem contrata.'),
  evento: (v) => (v.trim().length >= 2 ? '' : 'Informe o nome do evento.'),
  cidade: (v) => (v.trim().length >= 2 ? '' : 'Informe a cidade.'),
  uf: (v) => (v ? '' : 'Escolha o estado.'),
  data: (v) => {
    if (!v) return 'Informe a data pretendida.';
    return v < new Date().toISOString().slice(0, 10) ? 'A data precisa ser de hoje em diante.' : '';
  },
  tipo: (v) => (v ? '' : 'Escolha o tipo de evento.'),
  contato: (v) => {
    const t = v.trim();
    const email = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(t);
    const fone = t.replace(/\D/g, '').length >= 10 && /^[\d\s()+-]+$/.test(t);
    return email || fone ? '' : 'Informe um WhatsApp com DDD ou um e-mail válido.';
  },
  mensagem: () => '',
};
function ligarFormulario() {
  const form = $('#form-booking');
  if (!form) return;
  const valor = (n) => (n === 'projeto' ? (form.querySelector('[name="projeto"]:checked')?.value || '') : form.elements[n].value);
  const checar = (n) => {
    const msg = REGRAS[n](valor(n));
    const alvo = $(`[data-erro="${n}"]`, form);
    alvo.textContent = msg;
    const campos = n === 'projeto' ? $$('[name="projeto"]', form) : [form.elements[n]];
    campos.forEach((c) => c.setAttribute('aria-invalid', String(!!msg)));
    return !msg;
  };
  Object.keys(REGRAS).forEach((n) => {
    const campos = n === 'projeto' ? $$('[name="projeto"]', form) : [form.elements[n]];
    campos.forEach((c) => {
      c.addEventListener('blur', () => { if (c.dataset.tocado) checar(n); });
      c.addEventListener('input', () => { c.dataset.tocado = '1'; if (c.getAttribute('aria-invalid') === 'true') checar(n); });
      c.addEventListener('change', () => { c.dataset.tocado = '1'; checar(n); });
    });
  });
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const ok = Object.keys(REGRAS).map(checar);
    if (ok.includes(false)) {
      const primeiro = form.querySelector('[aria-invalid="true"]');
      primeiro?.focus();
      return;
    }
    const [a, m, d] = valor('data').split('-');
    const texto = [
      `Pedido de booking — ${valor('projeto')}`,
      '',
      `Contratante: ${valor('nome').trim()}`,
      `Evento: ${valor('evento').trim()}`,
      `Local: ${valor('cidade').trim()} / ${valor('uf')}`,
      `Data pretendida: ${d}/${m}/${a}`,
      `Tipo de evento: ${valor('tipo')}`,
      `Contato: ${valor('contato').trim()}`,
      ...(valor('mensagem').trim() ? ['', `Mensagem: ${valor('mensagem').trim()}`] : []),
    ].join('\n');
    enviarPedido(texto, valor('projeto'));
  });
}
async function enviarPedido(texto, projeto) {
  const saida = $('#form-saida');
  let link, rotulo, nota;
  if (CONTATO.whatsapp) {
    link = `https://wa.me/${CONTATO.whatsapp}?text=${encodeURIComponent(texto)}`;
    rotulo = 'Enviar pelo WhatsApp ↗'; nota = 'O WhatsApp abre com o pedido já escrito. É só enviar.';
  } else if (CONTATO.email) {
    link = `mailto:${CONTATO.email}?subject=${encodeURIComponent('Booking ' + projeto)}&body=${encodeURIComponent(texto)}`;
    rotulo = 'Enviar por e-mail ↗'; nota = 'Seu programa de e-mail abre com o pedido já escrito.';
  } else {
    link = `https://ig.me/m/${CONTATO.instagram}`;
    rotulo = `Abrir mensagem para @${CONTATO.instagram} ↗`;
    nota = 'Cole o pedido na conversa do Instagram e envie.';
  }
  let copiado = false;
  try { await navigator.clipboard.writeText(texto); copiado = true; } catch { /* sem permissão: a pessoa copia pelo botão */ }
  saida.hidden = false;
  saida.innerHTML = `
    <h3>${copiado ? 'Pedido montado e copiado.' : 'Pedido montado.'}</h3>
    <p>${nota}</p>
    <textarea readonly rows="9" aria-label="Texto do pedido">${esc(texto)}</textarea>
    <div class="form__saida-acoes">
      <a class="botao botao--forte" href="${link}" target="_blank" rel="noopener">${rotulo}</a>
      <button class="botao" type="button" id="copiar-pedido">Copiar texto</button>
    </div>`;
  $('#copiar-pedido').addEventListener('click', async () => {
    const t = $('textarea', saida);
    try { await navigator.clipboard.writeText(t.value); avisar('Pedido copiado.'); }
    catch { t.select(); avisar('Selecionei o texto: use Ctrl+C para copiar.'); }
  });
  saida.focus();
  saida.scrollIntoView({ behavior: CALMO ? 'auto' : 'smooth', block: 'center' });
}
let avisoT;
function avisar(msg) {
  const a = $('#aviso');
  a.textContent = msg; a.classList.add('on');
  clearTimeout(avisoT); avisoT = setTimeout(() => a.classList.remove('on'), 2600);
}

/* ==========================================================================
   ROTEADOR
   ========================================================================== */
function rotaDaUrl() {
  const resto = location.pathname.slice(BASE.length).replace(/index\.html$/, '').replace(/\/+$/, '');
  return ROTAS.includes(resto) ? resto : '';
}
function rolarPara(id, suave = true) {
  const el = document.getElementById(id);
  if (!el) return false;
  el.scrollIntoView({ behavior: suave && !CALMO ? 'smooth' : 'auto', block: 'start' });
  return true;
}
function ir(rota, { ancora = '', empurra = true, projeto = '' } = {}) {
  if (ocupado) return;
  abrirSeletor(false);
  if (rota === rotaAtual) {
    if (ancora) { rolarPara(ancora); if (empurra) history.pushState({ rota }, '', url(rota) + '#' + ancora); }
    else scrollTo({ top: 0, behavior: CALMO ? 'auto' : 'smooth' });
    return;
  }
  ocupado = true;
  document.documentElement.classList.add('em-passagem');
  if (empurra) history.pushState({ rota }, '', url(rota) + (ancora ? '#' + ancora : ''));
  const tl = passar(rota, () => {
    scrollTo(0, 0);
    rotaAtual = rota;
    montar(rota);
    if (ancora) rolarPara(ancora, false);
    if (projeto) marcarProjeto(projeto);
  });
  tl.eventCallback('onComplete', () => {
    passagem.className = 'passagem'; passagem.innerHTML = '';
    ocupado = false;
    document.documentElement.classList.remove('em-passagem');
    $('#conteudo').focus({ preventScroll: true });
    avisar(`Universo: ${NOMES[rota]}`);
  });
}
function marcarProjeto(id) {
  const r = $(`#form-booking [name="projeto"][value="${NOMES[id]}"]`);
  if (r) { r.checked = true; r.dispatchEvent(new Event('change', { bubbles: true })); }
}

document.addEventListener('click', (e) => {
  if (e.defaultPrevented || e.button || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  const a = e.target.closest('a[data-rota], a[data-ancora]');
  if (!a) return;
  e.preventDefault();
  if (a.dataset.rota !== undefined) return ir(a.dataset.rota);
  const alvo = a.dataset.ancora;
  if (a.dataset.projeto) marcarProjeto(a.dataset.projeto);
  if (document.getElementById(alvo)) {
    rolarPara(alvo);
    history.pushState({ rota: rotaAtual }, '', url(rotaAtual) + '#' + alvo);
  } else ir('', { ancora: alvo });   // seção que só existe na página inicial
});
addEventListener('popstate', () => {
  const r = rotaDaUrl(), h = location.hash.slice(1);
  if (r !== rotaAtual) ir(r, { ancora: h, empurra: false });
  else if (h) rolarPara(h); else scrollTo({ top: 0, behavior: CALMO ? 'auto' : 'smooth' });
});
// atalhos: 0 a 3 trocam de universo (fora de campos de texto)
addEventListener('keydown', (e) => {
  if (e.metaKey || e.ctrlKey || e.altKey || /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName)) return;
  if (/^[0-3]$/.test(e.key)) ir(ROTAS[+e.key]);
});
document.addEventListener('click', (e) => { if (e.target.id === 'pk-imprimir') { document.documentElement.classList.add('imprimir-press'); print(); } });
addEventListener('afterprint', () => document.documentElement.classList.remove('imprimir-press'));
addEventListener('resize', () => marcarSeletor(rotaAtual));
new ResizeObserver(() => rotaAtual !== null && marcarSeletor(rotaAtual)).observe(seletor);

/* ---------- cursor e paralaxe do ponteiro ---------- */
let mouseAlvos = [];
if (FINO && !CALMO) {
  const c = $('#cursor');
  document.documentElement.classList.add('tem-cursor');
  const cx = gsap.quickTo(c, 'x', { duration: 0.25, ease: 'power3' }), cy = gsap.quickTo(c, 'y', { duration: 0.25, ease: 'power3' });
  addEventListener('pointermove', (e) => {
    cx(e.clientX); cy(e.clientY);
    const nx = e.clientX / innerWidth - 0.5, ny = e.clientY / innerHeight - 0.5;
    mouseAlvos.forEach((a) => { a.x(nx * a.f * 2); a.y(ny * a.f * 2); });
    fx?.ponteiro(e.clientX / innerWidth, 1 - e.clientY / innerHeight);
  }, { passive: true });
  document.addEventListener('pointerover', (e) => c.classList.toggle('sobre', !!e.target.closest('a,button,label,select,input,textarea,.clipe')));
  document.addEventListener('pointerleave', () => c.classList.add('fora'));
  document.addEventListener('pointerenter', () => c.classList.remove('fora'));
}

/* ---------- topo: some ao descer, volta ao subir ---------- */
let ultimoY = 0;
addEventListener('scroll', () => {
  const y = scrollY;
  document.documentElement.classList.toggle('rolou', y > 40);
  document.documentElement.classList.toggle('descendo', y > ultimoY && y > 300);
  ultimoY = y;
}, { passive: true });

/* ---------- partida ---------- */
montarSeletor();
rotaAtual = rotaDaUrl();
history.replaceState({ rota: rotaAtual }, '', location.href);
montar(rotaAtual);
if (location.hash) requestAnimationFrame(() => rolarPara(location.hash.slice(1), false));
document.documentElement.classList.add('pronto');
document.fonts?.ready.then(() => marcarSeletor(rotaAtual));

// o fundo WebGL entra depois, sem segurar a primeira pintura
const fraco = (navigator.hardwareConcurrency || 4) <= 2 || navigator.connection?.saveData;
if (!fraco) {
  import('./fx.js').then((m) => {
    fx = m.criarFx($('#fx'), { calmo: CALMO });
    if (fx) { fx.modo(rotaAtual || 'home', true); document.documentElement.classList.add('tem-fx'); }
  }).catch(() => {});
}
