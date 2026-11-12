/* DARKY · SLOWLY · OBSKURIAL — os três projetos de Bruno Martins.
   Roteador, montagem das vistas, passagens entre universos, formulário.
   O conteúdo editável fica em content.js. */
import { ARTISTA, CONTATO, REDES, PROJETOS, FOTOS_ARTISTA, ALT_ARTISTA, VIDEO_ARTISTA, PRESS, TIPOS_EVENTO } from './content.js';

const gsap = window.gsap;
const ScrollTrigger = window.ScrollTrigger;
gsap.registerPlugin(ScrollTrigger);

const RAIZ = new URL('..', import.meta.url);            // pasta do site
const BASE = RAIZ.pathname;                             // ex.: /lab/darky/
const A = (p) => new URL('assets/' + p, RAIZ).href;
const ROTAS = ['', 'slowly', 'obskurial'];              // '' é o Darky
const CALMO = matchMedia('(prefers-reduced-motion: reduce)').matches;
const FINO = matchMedia('(hover: hover) and (pointer: fine)').matches;

/* Perfil do aparelho. Define o peso do que entra: no celular e em máquinas
   fracas o fundo WebGL não roda (fica a textura), os vídeos vêm na versão
   pequena e as passagens usam menos peças. */
const MOVEL = matchMedia('(max-width: 860px)').matches || !FINO;
const NUCLEOS = navigator.hardwareConcurrency || 4;
const ECONOMIA = !!navigator.connection?.saveData || /2g/.test(navigator.connection?.effectiveType || '');
const FRACO = MOVEL || NUCLEOS <= 2 || ECONOMIA;
const COM_FX = !CALMO && !ECONOMIA && !FRACO;
const PECAS = FRACO ? 0.6 : 1;                          // fator de peças nas passagens

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const url = (rota) => BASE + (rota ? rota + '/' : '');
const chave = (rota) => (rota === '' ? 'darky' : rota);  // rota -> id do projeto
const vid = (p) => A(p) + (MOVEL ? '-m' : '') + '.mp4';

const TITULOS = {
  darky: 'DARKY — Bruno Martins',
  slowly: 'SLOWLY — projeto de Bruno Martins',
  obskurial: 'OBSKURIAL — projeto de Bruno Martins',
};
const TEMA = { darky: '#07040d', slowly: '#f4ece1', obskurial: '#070203' };

/* ---------- pequenos construtores ---------- */
/* No celular só entra a versão pequena: em telas de alta densidade o navegador
   escolheria a imagem grande pelo srcset e o peso dobraria sem ganho visível. */
function img(p, alt, { cls = '', sizes = '(max-width: 760px) 92vw, 46vw', eager = false, arrasta = false } = {}) {
  const fonte = MOVEL ? '' : ` srcset="${A(p)}-m.webp 900w, ${A(p)}.webp 1800w" sizes="${sizes}"`;
  return `<img class="${cls}" src="${A(p)}-m.webp"${fonte} alt="${esc(alt)}"${eager ? ' fetchpriority="high"' : ' loading="lazy"'} decoding="async"${arrasta ? '' : ' draggable="false"'}>`;
}
const tex = (p) => A(p) + (MOVEL ? '-m' : '') + '.webp';
function logo(p, alt, cls = '') {
  return `<img class="${cls}" src="${tex(p)}" alt="${esc(alt)}" loading="lazy" decoding="async" draggable="false">`;
}
function letras(txt, cls = 'l') {
  return [...txt].map((c, i) => `<span class="${cls}" style="--i:${i}">${c === ' ' ? '&nbsp;' : esc(c)}</span>`).join('');
}
function palavras(txt) {
  return txt.split(' ').map((w, i) => `<span class="w" style="--i:${i}">${esc(w)}</span>`).join(' ');
}
function clipe(v, extra = '') {
  return `<figure class="clipe clipe--${v.formato} ${extra}">
    <video muted loop playsinline preload="none" poster="${A(v.arquivo)}.webp" data-src="${vid(v.arquivo)}" data-auto aria-label="${esc(v.titulo)} (trecho sem som)"></video>
    <button class="clipe__botao" type="button" aria-label="Pausar ou tocar o trecho: ${esc(v.titulo)}" aria-pressed="false"><i></i></button>
    <figcaption>${esc(v.titulo)}</figcaption>
  </figure>`;
}

const GLIFOS = {
  darky: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2 4 20l4-2.5 4 4.5 4-4.5 4 2.5z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="miter"/><path d="M9.5 12.5h1.8M12.7 12.5h1.8" stroke="currentColor" stroke-width="1.6"/></svg>',
  slowly: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 20V11a7 7 0 0 1 14 0v9l-2.3-2-2.4 2-2.3-2-2.3 2-2.4-2z" fill="currentColor"/><circle cx="9.6" cy="11" r="1.3" fill="var(--glifo-olho,#fff)"/><circle cx="14.4" cy="11" r="1.3" fill="var(--glifo-olho,#fff)"/></svg>',
  obskurial: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 1.5 14.2 9.8 22.5 12l-8.3 2.2L12 22.5 9.8 14.2 1.5 12l8.3-2.2z" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="M12 8.2 15.8 12 12 15.8 8.2 12z" fill="currentColor"/></svg>',
};

/* ==========================================================================
   BLOCOS QUE APARECEM EM TODOS OS UNIVERSOS
   ========================================================================== */
function fundoVivo(p) {
  return `<div class="cenario" aria-hidden="true">
    <div class="cenario__tex" style="background-image:url('${tex(p.textura)}')"></div>
    ${p.fundo ? `<video class="cenario__v" muted loop playsinline preload="none" data-src="${vid(p.fundo)}" data-fundo></video>` : ''}
    <div class="cenario__veu"></div>
  </div>`;
}

function ficha(p) {
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

/* pulso: o BPM do projeto vira batida na tela. Só entra quando há BPM. */
function pulso(p) {
  if (!p.bpm) return '';
  const bpm = Math.round((p.bpmMin + p.bpmMax) / 2);
  const dur = (60 / bpm).toFixed(3);
  return `<section class="pulso pulso--${p.id}" aria-labelledby="t-pulso" style="--bat:${dur}s">
    <div class="pulso__lado">
      <p class="rot" id="t-pulso">Andamento</p>
      <p class="pulso__n">${esc(p.bpm)}<span>BPM</span></p>
      <p class="pulso__txt">${p.id === 'obskurial'
        ? 'A pista levada ao limite de velocidade: a batida acima acompanha o andamento do projeto.'
        : 'A batida acima acompanha o andamento em que o set acontece.'}</p>
    </div>
    <div class="pulso__campo" aria-hidden="true">${Array.from({ length: 28 }, (_, i) => `<i style="--i:${i}"></i>`).join('')}</div>
  </section>`;
}

/* galeria em roleta: clique e arraste gira; a foto não é selecionável */
function roletaHTML(p, fotos, alts, cls = '') {
  if (!fotos.length) return '';
  return `<section class="galeria galeria--${p.id} ${cls}" aria-labelledby="t-galeria">
    <header class="cab cab--linha">
      <p class="rot" id="t-galeria">Galeria</p>
      <p class="cab__dica"><span class="cab__maozinha" aria-hidden="true"></span>Clique e arraste para girar</p>
    </header>
    <div class="roleta" data-roleta tabindex="0" role="group" aria-label="Galeria de fotos — use as setas ou arraste">
      <div class="roleta__trilho">
        ${fotos.map((f, i) => `<figure class="roleta__i roleta__i--${i % 4}">${img(f, alts[i] || '', { sizes: '(max-width:760px) 62vw, 26vw' })}</figure>`).join('')}
      </div>
    </div>
    <div class="roleta__barra" aria-hidden="true"><i></i></div>
  </section>`;
}

function blocoAudiovisual(p) {
  if (!p.videos.length) return '';
  const h = p.videos.filter((v) => v.formato === 'h');
  const v = p.videos.filter((x) => x.formato === 'v');
  return `<section class="av" id="audiovisual" aria-labelledby="t-av">
    <header class="cab">
      <p class="rot">Audiovisual</p>
      <h2 id="t-av" data-rev="sobe">Imagem<br>em movimento.</h2>
      <p class="cab__nota">Trechos sem som, direto das pistas. Toque para pausar.</p>
    </header>
    ${h.length ? `<div class="av__clipes av__clipes--h">${h.map((x) => clipe(x)).join('')}</div>` : ''}
    ${v.length ? `<div class="av__clipes av__clipes--v">${v.map((x) => clipe(x)).join('')}</div>` : ''}
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
function blocoSom(p) {
  if (!p.som.length) return '';
  return `<section class="som" id="som" aria-labelledby="t-som">
    <header class="cab">
      <p class="rot">Sound</p>
      <h2 id="t-som" data-rev="sobe">Onde ouvir.</h2>
      <p class="cab__nota">Os players entram prontos, mas nada toca sozinho: o som só começa quando você manda.</p>
    </header>
    <div class="som__grade">${p.som.map(fachada).join('')}</div>
  </section>`;
}

/* ponte: os outros dois universos, sempre no fim da leitura */
function ponte(atual) {
  const outros = Object.values(PROJETOS).filter((p) => p.id !== atual);
  return `<section class="ponte" aria-labelledby="t-ponte">
    <header class="cab">
      <p class="rot">Os outros universos</p>
      <h2 id="t-ponte" data-rev="sobe">Um artista.<br>Três pistas diferentes.</h2>
    </header>
    <div class="ponte__grade">
      ${outros.map((p) => `<a class="pt pt--${p.id}" href="${url(p.rota)}" data-rota="${p.rota}" aria-label="Entrar no universo ${p.nome}">
        <span class="pt__fundo">${img(p.capa, '', { sizes: '(max-width:760px) 92vw, 46vw' })}</span>
        <span class="pt__veu"></span>
        <span class="pt__glifo">${GLIFOS[p.id]}</span>
        <span class="pt__nome">${p.nome}</span>
        ${p.chamada ? `<span class="pt__chamada">${esc(p.chamada)}</span>` : ''}
        ${p.resumo ? `<span class="pt__resumo">${esc(p.resumo)}</span>` : ''}
        <span class="pt__entrar">Entrar <i>→</i></span>
      </a>`).join('')}
    </div>
  </section>`;
}

const UFS = 'AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO'.split(' ');
function blocoBooking(atual) {
  const destino = CONTATO.whatsapp ? 'pelo WhatsApp' : CONTATO.email ? 'por e-mail' : `pela mensagem direta do Instagram @${CONTATO.instagram}`;
  const opcoes = Object.values(PROJETOS).map((p) => `
    <label class="escolha escolha--${p.id}">
      <input type="radio" name="projeto" value="${p.nome}" ${atual === p.id ? 'checked' : ''} required>
      <span class="escolha__c">${GLIFOS[p.id]}<b>${p.nome}</b>${p.vertentes?.length ? `<small>${esc(p.vertentes.join(' · '))}</small>` : ''}${p.bpm ? `<small>${esc(p.bpm)}${p.bpm === 'High BPM' ? '' : ' BPM'}</small>` : ''}</span>
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
      <div class="booking__redes">
        <h3 class="rot">Escute antes</h3>
        <ul>${REDES.filter((r) => r.rede !== 'YouTube').map((r) => `<li><a href="${esc(r.url)}" target="_blank" rel="noopener">${esc(r.rede)} ↗</a></li>`).join('')}</ul>
      </div>
      ${CONTATO.agencia ? `<div class="booking__agencia"><span class="rot">Agência</span>${logo(CONTATO.agencia.logo, 'Agência ' + CONTATO.agencia.nome)}</div>` : ''}
    </aside>
  </section>`;
}

function blocoPress() {
  const projetos = Object.values(PROJETOS).map((p) => {
    const linhas = [['Vertentes', p.vertentes?.join(', ')], ['BPM', p.bpm], ['Faixas', p.faixas?.join(', ')], ['Festivais', p.festivais?.join(', ')]].filter(([, v]) => v);
    return `<article class="pk-proj pk-proj--${p.id}">
      <header>${logo(p.logoLinha, 'Logo ' + p.nome)}<h4>${p.nome}</h4></header>
      ${p.release ? `<p>${esc(p.release)}</p>` : p.conceito.length ? `<p>${esc(p.conceito[0])}</p>` : ''}
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
    <div class="press__bio"><article><h3 class="rot">Biografia curta</h3><p>${esc(ARTISTA.bioCurta)}</p></article></div>
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
    <p class="rodape__marca">${Object.values(PROJETOS).map((p) => `<a class="rp rp--${p.id}" href="${url(p.rota)}" data-rota="${p.rota}">${p.nome}</a>`).join('<i aria-hidden="true">·</i>')}</p>
    <p class="rodape__assina">Três projetos independentes de ${esc(ARTISTA.nomeCompleto)}</p>
  </div>
  <div class="rodape__cols">
    <div><h3 class="rot">Navegação</h3><ul>
      <li><a href="#artista" data-ancora="artista">O artista</a></li>
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
   VISTAS
   ========================================================================== */
function vistaDarky() {
  const p = PROJETOS.darky;
  const faixa = (arr) => arr.map((f) => `<span>${esc(f)}</span><i aria-hidden="true">✕</i>`).join('');
  const cortes = ['a', 'b', 'c', 'd', 'e'];
  const extras = [['História', ARTISTA.historia], ['Influências', ARTISTA.influencias], ['Trajetória', ARTISTA.trajetoria], ['Filosofia musical', ARTISTA.filosofia], ['Experiência profissional', ARTISTA.experiencia]]
    .filter(([, v]) => v && v.length)
    .map(([t, v]) => `<div class="sobre__bloco" data-rev="sobe"><h3>${t}</h3>${[].concat(v).map((x) => `<p>${esc(x)}</p>`).join('')}</div>`).join('');

  return `
  <section class="d-hero" aria-label="Darky">
    <div class="d-hero__tipo" aria-hidden="true"><span>DARKY</span></div>
    <div class="d-hero__figura">
      <video class="d-hero__video" muted loop playsinline preload="none" poster="${A(p.heroVideo)}.webp" data-src="${vid(p.heroVideo)}" data-auto aria-label="Darky de capuz e pintura de caveira, com aura violeta em movimento"></video>
    </div>
    <div class="d-hero__tipo d-hero__tipo--contorno" aria-hidden="true"><span>DARKY</span></div>
    <h1 class="sr">Darky — projeto de Bruno Martins</h1>
    ${logo(p.logo, 'Logo Darky', 'd-hero__logo')}
    <dl class="d-hero__meta">
      <div><dt>Base</dt><dd>${esc(p.vertentes[0])}</dd></div>
      <div><dt>BPM</dt><dd>${esc(p.bpm)}</dd></div>
    </dl>
    <p class="d-hero__pe">Um artista · três projetos</p>
    <div class="brasas" aria-hidden="true">${Array.from({ length: Math.round(14 * PECAS) }, (_, i) => `<i style="--i:${i}"></i>`).join('')}</div>
  </section>

  <section class="d-conceito" aria-labelledby="t-dconceito">
    <div class="d-conceito__grito">
      <p class="rot">Conceito</p>
      <h2 class="d-grito" id="t-dconceito" aria-label="${esc(p.chamada)}"><span data-rev="corte">NÃO SER</span><span data-rev="corte" class="d-grito__2">ROTULADO.</span></h2>
    </div>
    <div class="d-conceito__texto">${p.conceito.map((t) => `<p data-rev="sobe">${esc(t)}</p>`).join('')}</div>
    ${ficha(p)}
    <figure class="d-conceito__foto" data-rev="mascara">${img('darky/skull-03', 'Darky de capuz e pintura de caveira, braços cruzados', { sizes: '(max-width:760px) 60vw, 26vw' })}</figure>
  </section>

  ${pulso(p)}

  <section class="artista" id="artista" aria-labelledby="t-artista">
    <header class="cab">
      <p class="rot">O artista</p>
      <h2 id="t-artista" data-rev="sobe">${esc(ARTISTA.nomeCompleto)}</h2>
    </header>
    <div class="artista__corpo">
      <figure class="artista__foto artista__foto--a" data-rev="mascara"><div data-px="-7">${img('artist/bruno-01', ALT_ARTISTA[0], { sizes: '(max-width:760px) 92vw, 36vw' })}</div></figure>
      <div class="artista__texto">
        ${ARTISTA.bioLonga.map((t) => `<p class="artista__p" data-rev="sobe">${esc(t)}</p>`).join('')}
        <ul class="fatos">${ARTISTA.fatos.map((f) => `<li data-rev="sobe"><b>${esc(f.valor)}</b><span>${esc(f.rotulo)}</span></li>`).join('')}</ul>
        ${extras}
        <p class="artista__cidade"><span class="rot">Base</span>${esc(ARTISTA.cidade)}</p>
      </div>
      <figure class="artista__foto artista__foto--b" data-rev="mascara"><div data-px="8">${img('artist/bruno-05', ALT_ARTISTA[4], { sizes: '(max-width:760px) 46vw, 22vw' })}</div></figure>
      ${clipe(VIDEO_ARTISTA, 'artista__clipe')}
    </div>
    <div class="tira" data-roleta data-auto-roleta>
      <div class="tira__trilho">${FOTOS_ARTISTA.concat(FOTOS_ARTISTA).map((f, i) => `<figure>${img(f, i < FOTOS_ARTISTA.length ? (ALT_ARTISTA[i] || '') : '', { sizes: '22vw' })}</figure>`).join('')}</div>
    </div>
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
    <figure class="d-fogo" data-rev="sobe"><div data-px="-9">${img('darky/skull-01', 'Darky de capuz e pintura de caveira, com fogo nas duas mãos', { sizes: '(max-width:760px) 86vw, 38vw' })}</div></figure>
    <p class="d-fotos__nota" data-rev="sobe">Cada projeto tem a sua pista, a sua velocidade e o seu público. O que não muda é quem está atrás do equipamento.</p>
    ${p.fotos.map((f, i) => `<figure class="d-foto d-foto--${cortes[i]}" data-rev="mascara"><div data-px="${[-6, 8, -9, 6, -5][i]}">${img(f, p.altFotos[i])}</div></figure>`).join('')}
  </section>`;
}

function vistaSlowly() {
  const p = PROJETOS.slowly;
  return `
  <section class="s-hero" aria-label="Slowly">
    <div class="s-bolhas" aria-hidden="true"><i></i><i></i><i></i><i></i></div>
    <h1 class="s-hero__titulo" aria-label="Slowly — projeto de Bruno Martins">${letras('Slowly', 'l')}</h1>
    <figure class="s-hero__foto bolha">${img('slowly/slowly-01', p.altFotos[0], { eager: true, sizes: '(max-width:760px) 76vw, 34vw' })}</figure>
    <figure class="s-hero__foto2 bolha bolha--b">${img('slowly/slowly-06', p.altFotos[4], { sizes: '(max-width:760px) 34vw, 16vw' })}</figure>
    <div class="s-hero__vidro"><p>${esc(p.chamada)}</p></div>
    ${logo(p.logo, 'Logo Slowly, com um fantasminha no lugar da letra o', 's-hero__logo')}
    <p class="s-hero__pe">Um dos três projetos de Bruno</p>
  </section>

  <section class="s-conceito" aria-labelledby="t-sconceito">
    <p class="rot" id="t-sconceito">Conceito</p>
    ${p.conceito.map((t) => `<p class="s-frase" data-rev="borra" aria-label="${esc(t)}">${palavras(t)}</p>`).join('')}
    <ul class="s-palavras" aria-hidden="true">${p.palavras.map((w, i) => `<li style="--i:${i}">${esc(w)}</li>`).join('')}</ul>
    <ul class="sr">${p.palavras.map((w) => `<li>${esc(w)}</li>`).join('')}</ul>
    ${ficha(p)}
  </section>

  <section class="s-onda" aria-hidden="true"><div class="s-onda__linhas">${Array.from({ length: Math.round(26 * PECAS) + 6 }, (_, i) => `<i style="--i:${i}"></i>`).join('')}</div></section>`;
}

function vistaObskurial() {
  const p = PROJETOS.obskurial;
  const tres = () => `<span class="glitch">${logo(p.logo, 'Logo Obskurial', 'g0')}${logo(p.logo, '', 'g1')}${logo(p.logo, '', 'g2')}</span>`;
  return `
  <section class="o-hero" aria-label="Obskurial">
    <div class="o-hero__lado" aria-hidden="true">Obskurial</div>
    <span class="o-num" aria-hidden="true">I</span>
    <h1 class="sr">Obskurial — projeto de Bruno Martins</h1>
    <div class="o-hero__figura">
      <video class="o-hero__video" muted loop playsinline preload="none" poster="${A(p.heroVideo)}.webp" data-src="${vid(p.heroVideo)}" data-auto aria-label="Ilustração do Obskurial: figura encapuzada com pintura de caveira estendendo a mão, com fumaça vermelha em movimento"></video>
    </div>
    <div class="o-hero__logo">${tres()}</div>
    <div class="o-linhas" aria-hidden="true"><i></i><i></i><i></i></div>
    <p class="o-hero__chamada">${esc(p.chamada)}</p>
    <p class="o-hero__pe">Um dos três projetos de Bruno</p>
  </section>

  <section class="o-conceito" aria-labelledby="t-oconceito">
    <span class="o-num" aria-hidden="true">II</span>
    <p class="rot" id="t-oconceito">Conceito</p>
    ${p.conceito.map((t) => `<p class="o-frase" data-rev="corte">${esc(t)}</p>`).join('')}
    ${ficha(p)}
  </section>

  ${pulso(p)}

  <section class="o-artes" aria-label="Artes do Obskurial">
    <span class="o-num" aria-hidden="true">III</span>
    <figure class="o-arte o-arte--a" data-rev="corte">
      <div class="o-arte__q" data-px="-7"><span class="glitch glitch--arte">${img(p.artes[0], p.altArtes[0], { cls: 'g0', sizes: '(max-width:760px) 86vw, 40vw' })}${img(p.artes[0], '', { cls: 'g1', sizes: '40vw' })}${img(p.artes[0], '', { cls: 'g2', sizes: '40vw' })}</span></div>
    </figure>
    <figure class="o-arte o-arte--b" data-rev="corte">
      <div class="o-arte__q" data-px="9">${img(p.artes[1], p.altArtes[1], { cls: 'g0', sizes: '(max-width:760px) 70vw, 30vw' })}</div>
    </figure>
    <div class="o-artes__selo" data-rev="sobe">${logo(p.logo, '')}</div>
    <svg class="o-geo" viewBox="0 0 400 400" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width=".6"><path d="M200 10 364 105v190L200 390 36 295V105z"/><path d="M200 10v380M36 105l328 190M364 105 36 295"/><path d="M200 70 312 135v130L200 330 88 265V135z"/><circle cx="200" cy="200" r="64"/><path d="M200 136 255 232H145z"/><path d="M200 264 145 168h110z"/></g></svg>
  </section>`;
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
      ${Object.values(PROJETOS).map((p, i) => `<li><a class="sel sel--${p.id}" href="${url(p.rota)}" data-rota="${p.rota}">
        <span class="sel__glifo">${GLIFOS[p.id]}</span><span class="sel__nome">${p.nome}</span>
        <span class="sel__tecla" aria-hidden="true">${i + 1}</span>
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
  document.documentElement.classList.toggle('trava', sim && MOVEL);
}
function marcarSeletor(id) {
  $$('.sel', seletor).forEach((a) => {
    const on = chave(a.dataset.rota) === id;
    a.classList.toggle('ativo', on);
    if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
  });
  $('.seletor__atual', seletor).innerHTML = `${GLIFOS[id]}<b>${PROJETOS[id].nome}</b>`;
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
  passagem.className = 'passagem passagem--' + dest + ' ativa';
  const tl = gsap.timeline({ onComplete: () => { passagem.className = 'passagem'; passagem.innerHTML = ''; } });
  const n = (x) => Math.max(3, Math.round(x * PECAS));

  if (dest === 'darky') {
    const q = n(6);
    passagem.innerHTML = Array.from({ length: q }, (_, i) => `<i class="lamina" style="--i:${i};--q:${q}"></i>`).join('') + `<img class="passagem__logo" src="${tex('logos/darky-branco')}" alt="">`;
    tl.fromTo('.lamina', { xPercent: 130 }, { xPercent: 0, duration: 0.46, ease: 'power4.in', stagger: 0.05 })
      .fromTo('.passagem__logo', { opacity: 0, scale: 1.4 }, { opacity: 1, scale: 1, duration: 0.18, ease: 'power2.out' }, '-=0.1')
      .add(troca)
      .to('.passagem__logo', { opacity: 0, scale: 0.92, duration: 0.2 }, '+=0.1')
      .to('.lamina', { xPercent: -140, duration: 0.5, ease: 'power4.out', stagger: 0.045 }, '<');
  } else if (dest === 'slowly') {
    const q = n(7);
    passagem.innerHTML = Array.from({ length: q }, (_, i) => `<i class="gota gota--${i}" style="--i:${i}"></i>`).join('') + `<img class="passagem__logo" src="${tex('logos/slowly-preto')}" alt="">`;
    tl.fromTo('.gota', { scale: 0, yPercent: 50 }, { scale: 1, yPercent: 0, duration: 0.9, ease: 'sine.inOut', stagger: 0.06 })
      .fromTo('.passagem__logo', { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.45, ease: 'sine.out' }, '-=0.45')
      .add(troca)
      .to('.passagem__logo', { opacity: 0, y: -18, duration: 0.45, ease: 'sine.in' }, '+=0.12')
      .to('.gota', { opacity: 0, scale: 1.2, duration: 0.8, ease: 'sine.inOut', stagger: 0.045 }, '<0.1');
  } else {
    const q = n(14);
    passagem.innerHTML = Array.from({ length: q }, (_, i) => `<i class="tira" style="--i:${i};--q:${q}"></i>`).join('') + '<b class="varredura"></b>' + `<img class="passagem__logo" src="${tex('logos/obskurial')}" alt="">`;
    tl.fromTo('.tira', { scaleX: 0 }, { scaleX: 1, duration: 0.3, ease: 'steps(5)', stagger: { each: 0.022, from: 'random' } })
      .fromTo('.varredura', { yPercent: -55 }, { yPercent: 55, duration: 0.46, ease: 'none' }, 0)
      .fromTo('.passagem__logo', { opacity: 0, skewX: 26 }, { opacity: 1, skewX: 0, duration: 0.16, ease: 'steps(3)' })
      .add(troca)
      .to('.passagem__logo', { opacity: 0, skewX: -26, duration: 0.14, ease: 'steps(3)' }, '+=0.16')
      .to('.tira', { scaleX: 0, transformOrigin: () => (Math.random() > 0.5 ? 'left' : 'right'), duration: 0.32, ease: 'steps(6)', stagger: { each: 0.018, from: 'random' } }, '<');
  }
  return tl;
}

/* ==========================================================================
   MONTAGEM
   ========================================================================== */
const vista = $('#vista'), comum = $('#comum'), cenario = $('#cenario');
let idAtual = null, ocupado = false, fx = null;
let observador = null, revelador = null, mouseAlvos = [];

function montar(id) {
  const p = PROJETOS[id];
  document.documentElement.dataset.universo = id;
  document.title = TITULOS[id];
  $('meta[name="theme-color"]').setAttribute('content', TEMA[id]);
  ScrollTrigger.getAll().forEach((t) => t.kill());
  gsap.killTweensOf($$('#conteudo *'));
  observador?.disconnect(); revelador?.disconnect();
  mouseAlvos = [];

  cenario.innerHTML = fundoVivo(p);
  vista.innerHTML = { darky: vistaDarky, slowly: vistaSlowly, obskurial: vistaObskurial }[id]();
  comum.innerHTML =
    (id === 'darky' ? '' : roletaHTML(p, p.fotos, p.altFotos)) +
    blocoAudiovisual(p) +
    blocoSom(p) +
    ponte(id) +
    blocoBooking(id) +
    (id === 'darky' ? blocoPress() : '');
  $('#rodape').innerHTML = rodape();

  // links do topo só aparecem quando a seção existe nesta vista
  $$('.topo__nav [data-ancora]').forEach((a) => {
    a.hidden = !document.getElementById(a.dataset.ancora) && !(a.dataset.ancora === 'press' && id !== 'darky');
  });
  $$('.rodape [data-ancora]').forEach((a) => {
    const alvo = a.dataset.ancora;
    a.closest('li').hidden = !document.getElementById(alvo) && !(id !== 'darky' && (alvo === 'press' || alvo === 'artista'));
  });

  marcarSeletor(id);
  fx?.modo(id);
  ligarVideos();
  ligarRoletas();
  ligarFormulario();
  agendarPlayers();
  const d = $('#form-booking [name="data"]'); if (d) d.min = new Date().toISOString().slice(0, 10);
  animar(id);
}

function animar(id) {
  if (CALMO) { $$('[data-rev]').forEach((e) => e.classList.add('visto')); return; }

  revelador = new IntersectionObserver((ents) => ents.forEach((en) => {
    if (en.isIntersecting) { en.target.classList.add('visto'); revelador.unobserve(en.target); }
  }), { rootMargin: '0px 0px -6% 0px', threshold: 0.04 });
  $$('[data-rev]').forEach((el) => revelador.observe(el));

  if (!FRACO) {
    $$('[data-px]').forEach((el) => {
      const f = parseFloat(el.dataset.px);
      gsap.fromTo(el, { yPercent: -f }, { yPercent: f, ease: 'none', scrollTrigger: { trigger: el.parentElement, start: 'top bottom', end: 'bottom top', scrub: 0.6 } });
    });
  }
  if (FINO && !FRACO) {
    mouseAlvos = $$('[data-mouse]').map((el) => ({
      f: parseFloat(el.dataset.mouse),
      x: gsap.quickTo(el, 'x', { duration: 0.9, ease: 'power3' }),
      y: gsap.quickTo(el, 'y', { duration: 0.9, ease: 'power3' }),
    }));
  }

  const e = { ease: 'power4.out' };
  if (id === 'darky') {
    gsap.from('.d-hero__tipo span', { scaleY: 0, transformOrigin: '50% 100%', duration: 0.7, ease: 'expo.out', stagger: 0.08 });
    gsap.from('.d-hero__figura', { yPercent: 10, opacity: 0, duration: 1, delay: 0.15, ease: 'power3.out' });
    gsap.from('.d-hero__logo', { opacity: 0, scale: 1.2, duration: 0.7, delay: 0.5, ease: 'power3.out' });
    gsap.from('.d-hero__meta > div', { x: -26, opacity: 0, duration: 0.6, stagger: 0.1, delay: 0.7, ...e });
    if (!FRACO) {
      gsap.to('.d-hero__tipo:not(.d-hero__tipo--contorno)', { yPercent: 24, ease: 'none', scrollTrigger: { trigger: '.d-hero', start: 'top top', end: 'bottom top', scrub: true } });
      gsap.to('.d-hero__figura', { scale: 1.07, ease: 'none', scrollTrigger: { trigger: '.d-hero', start: 'top top', end: 'bottom top', scrub: true } });
    }
  }
  if (id === 'slowly') {
    const s = { ease: 'sine.out' };
    gsap.from('.s-hero__titulo .l', { yPercent: 50, opacity: 0, duration: 1.4, stagger: 0.12, ...s });
    gsap.from('.s-hero__foto, .s-hero__foto2', { scale: 0.7, opacity: 0, duration: 1.6, stagger: 0.2, delay: 0.25, ease: 'sine.inOut' });
    gsap.from('.s-hero__vidro', { opacity: 0, y: 30, duration: 1.3, delay: 0.8, ...s });
    gsap.from('.s-hero__logo', { opacity: 0, duration: 1.3, delay: 1.1, ...s });
    if (!FRACO) gsap.to('.s-hero__titulo', { y: -120, ease: 'none', scrollTrigger: { trigger: '.s-hero', start: 'top top', end: 'bottom top', scrub: 1.2 } });
  }
  if (id === 'obskurial') {
    gsap.from('.o-hero__logo', { opacity: 0, duration: 0.45, ease: 'steps(4)', delay: 0.2 });
    gsap.from('.o-hero__figura', { opacity: 0, xPercent: 6, duration: 0.55, ease: 'steps(6)', delay: 0.3 });
    gsap.from('.o-hero__lado', { opacity: 0, duration: 1.1, delay: 0.45, ease: 'power2.out' });
    gsap.from('.o-linhas i', { scaleX: 0, duration: 0.85, stagger: 0.1, ease: 'power4.inOut', delay: 0.2 });
    if (!FRACO) gsap.to('.o-geo', { rotate: 110, ease: 'none', scrollTrigger: { trigger: '.o-artes', start: 'top bottom', end: 'bottom top', scrub: 1 } });
  }
  requestAnimationFrame(() => ScrollTrigger.refresh());

  /* Rede de segurança: as entradas acima partem de opacidade zero. Se o
     navegador congelar o relógio de quadros (aba em segundo plano, economia de
     bateria), elas nunca terminariam e o logo ficaria invisível. Passados uns
     segundos, o que não acabou vai direto para o estado final. */
  clearTimeout(seguro);
  seguro = setTimeout(() => {
    gsap.globalTimeline.getChildren(true, true, false).forEach((t) => {
      if (!t.scrollTrigger && t.duration() < 20 && t.progress() < 1) t.progress(1);
    });
  }, 5000);
}
let seguro;

/* ---------- vídeos ---------- */
function tocar(v) {
  if (!v.src) { v.src = v.dataset.src; v.load(); }
  const pr = v.play();
  if (pr && pr.catch) pr.catch(() => v.closest('.clipe')?.classList.add('parado'));
}
function ligarVideos() {
  const fundo = $('video[data-fundo]');
  if (fundo && !CALMO && !ECONOMIA) tocar(fundo);

  observador = new IntersectionObserver((ents) => {
    ents.forEach((en) => {
      const v = en.target;
      if (en.isIntersecting) { if (!CALMO && !v.dataset.pausado) tocar(v); }
      else if (!v.paused) v.pause();
    });
  }, { rootMargin: '200px 0px', threshold: 0.1 });
  $$('video[data-auto]').forEach((v) => observador.observe(v));

  $$('.clipe').forEach((c) => {
    const v = $('video', c), b = $('.clipe__botao', c);
    const pinta = () => { c.classList.toggle('tocando', !v.paused); b.setAttribute('aria-pressed', String(!v.paused)); };
    v.addEventListener('play', pinta); v.addEventListener('pause', pinta);
    v.addEventListener('error', () => c.classList.add('parado'));
    b.addEventListener('click', () => {
      if (v.paused) { delete v.dataset.pausado; c.classList.remove('parado'); tocar(v); }
      else { v.dataset.pausado = '1'; v.pause(); }
    });
  });
}

/* ---------- roleta: clique e arraste gira a galeria ---------- */
function ligarRoletas() {
  // as fotos da roleta ficam fora da janela na horizontal, e aí o navegador não
  // as busca sozinho: quando a roleta chega perto da tela, todas são pedidas
  const aquece = new IntersectionObserver((ents) => ents.forEach((en) => {
    if (!en.isIntersecting) return;
    aquece.unobserve(en.target);
    $$('img[loading="lazy"]', en.target).forEach((i) => { i.loading = 'eager'; });
  }), { rootMargin: '500px 0px' });

  $$('[data-roleta]').forEach((el) => {
    aquece.observe(el);
    const trilho = el.firstElementChild;
    let x = 0, alvo = 0, vel = 0, pego = false, px = 0, ultimo = 0, moveu = 0, raf = 0;
    const lim = () => Math.max(0, trilho.scrollWidth - el.clientWidth);
    const auto = el.hasAttribute('data-auto-roleta') && !CALMO ? (FRACO ? 0.25 : 0.35) : 0;

    const passo = () => {
      if (!pego) {
        alvo += vel + auto;
        vel *= 0.94;
        if (Math.abs(vel) < 0.02) vel = 0;
      }
      const L = lim();
      if (auto && L > 0) { if (alvo > L) alvo -= L / 2; if (alvo < 0) alvo += L / 2; }
      else alvo = Math.min(L, Math.max(0, alvo));
      x += (alvo - x) * 0.16;
      trilho.style.transform = `translate3d(${-x.toFixed(2)}px,0,0)`;
      const b = $('.roleta__barra i', el.parentElement) || null;
      if (b && L > 0) b.style.transform = `translateX(${(x / L * 100).toFixed(1)}%)`;
      raf = (Math.abs(alvo - x) > 0.2 || vel || auto || pego) ? requestAnimationFrame(passo) : 0;
    };
    const acorda = () => { if (!raf) raf = requestAnimationFrame(passo); };

    el.addEventListener('pointerdown', (e) => {
      if (e.button) return;
      pego = true; moveu = 0; vel = 0; px = e.clientX; ultimo = performance.now();
      el.setPointerCapture(e.pointerId);
      el.classList.add('pegando');
      acorda();
    });
    el.addEventListener('pointermove', (e) => {
      if (!pego) return;
      const d = e.clientX - px; px = e.clientX; moveu += Math.abs(d);
      const t = performance.now(), dt = Math.max(1, t - ultimo); ultimo = t;
      alvo -= d; x = alvo;
      vel = -d / dt * 14;
      trilho.style.transform = `translate3d(${-x.toFixed(2)}px,0,0)`;
    });
    const solta = (e) => {
      if (!pego) return;
      pego = false;
      el.classList.remove('pegando');
      try { el.releasePointerCapture(e.pointerId); } catch { /* o ponteiro já saiu */ }
      acorda();
    };
    el.addEventListener('pointerup', solta);
    el.addEventListener('pointercancel', solta);
    el.addEventListener('click', (e) => { if (moveu > 6) { e.preventDefault(); e.stopPropagation(); } }, true);
    el.addEventListener('dragstart', (e) => e.preventDefault());
    el.addEventListener('keydown', (e) => {
      const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (!d) return;
      e.preventDefault(); alvo += d * el.clientWidth * 0.6; acorda();
    });
    el.addEventListener('wheel', (e) => {
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
      e.preventDefault(); alvo += e.deltaX; acorda();
    }, { passive: false });
    acorda();
  });
}

/* ---------- players: entram prontos, sem travar a abertura ---------- */
const EMBED = {
  youtube: (id) => `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?rel=0`,
  spotify: (id) => `https://open.spotify.com/embed/artist/${encodeURIComponent(id)}`,
  soundcloud: (id) => `https://w.soundcloud.com/player/?url=${encodeURIComponent('https://soundcloud.com/' + id)}&auto_play=false&visual=true`,
};
function abrirPlayer(b) {
  if (!b.isConnected) return;
  const f = document.createElement('iframe');
  f.src = EMBED[b.dataset.embed](b.dataset.id);
  f.title = b.dataset.titulo;
  f.loading = 'lazy';
  f.allow = 'encrypted-media; picture-in-picture; fullscreen';
  f.referrerPolicy = 'strict-origin-when-cross-origin';
  b.replaceWith(f);
}
function agendarPlayers() {
  const botoes = $$('.player__abrir');
  if (!botoes.length) return;
  const ocioso = window.requestIdleCallback || ((fn) => setTimeout(fn, 300));
  if (!FRACO) {
    // desktop: carrega em fila assim que a máquina fica livre
    botoes.forEach((b, i) => ocioso(() => setTimeout(() => abrirPlayer(b), i * 450)));
    return;
  }
  // celular: carrega quando a seção está a uma tela de distância, para não pesar
  const io = new IntersectionObserver((ents) => ents.forEach((en) => {
    if (!en.isIntersecting) return;
    io.unobserve(en.target);
    $$('.player__abrir', en.target).forEach((b, i) => setTimeout(() => abrirPlayer(b), i * 500));
  }), { rootMargin: '600px 0px' });
  const som = $('#som'); if (som) io.observe(som);
}
document.addEventListener('click', (e) => {
  const b = e.target.closest('.player__abrir');
  if (b) abrirPlayer(b);
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
    $(`[data-erro="${n}"]`, form).textContent = msg;
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
    if (Object.keys(REGRAS).map(checar).includes(false)) {
      form.querySelector('[aria-invalid="true"]')?.focus();
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
  const id = chave(rota);
  abrirSeletor(false);
  if (id === idAtual) {
    if (ancora) { rolarPara(ancora); if (empurra) history.pushState({ rota }, '', url(rota) + '#' + ancora); }
    else scrollTo({ top: 0, behavior: CALMO ? 'auto' : 'smooth' });
    return;
  }
  ocupado = true;
  document.documentElement.classList.add('em-passagem');
  if (empurra) history.pushState({ rota }, '', url(rota) + (ancora ? '#' + ancora : ''));
  const tl = passar(id, () => {
    scrollTo(0, 0);
    idAtual = id;
    montar(id);
    if (ancora) rolarPara(ancora, false);
    if (projeto) marcarProjeto(projeto);
  });
  tl.eventCallback('onComplete', () => {
    passagem.className = 'passagem'; passagem.innerHTML = '';
    ocupado = false;
    document.documentElement.classList.remove('em-passagem');
    $('#conteudo').focus({ preventScroll: true });
    avisar(`Universo: ${PROJETOS[id].nome}`);
  });
}
function marcarProjeto(id) {
  const r = $(`#form-booking [name="projeto"][value="${PROJETOS[id].nome}"]`);
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
    history.pushState({ rota: PROJETOS[idAtual].rota }, '', url(PROJETOS[idAtual].rota) + '#' + alvo);
  } else ir('', { ancora: alvo });   // seção que só existe no Darky
});
addEventListener('popstate', () => {
  const r = rotaDaUrl(), h = location.hash.slice(1);
  if (chave(r) !== idAtual) ir(r, { ancora: h, empurra: false });
  else if (h) rolarPara(h); else scrollTo({ top: 0, behavior: CALMO ? 'auto' : 'smooth' });
});
addEventListener('keydown', (e) => {
  if (e.metaKey || e.ctrlKey || e.altKey || /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName)) return;
  if (/^[1-3]$/.test(e.key)) ir(ROTAS[+e.key - 1]);
});
document.addEventListener('click', (e) => { if (e.target.id === 'pk-imprimir') { document.documentElement.classList.add('imprimir-press'); print(); } });
addEventListener('afterprint', () => document.documentElement.classList.remove('imprimir-press'));
addEventListener('resize', () => idAtual && marcarSeletor(idAtual));

/* ---------- cursor e paralaxe do ponteiro ---------- */
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
  document.addEventListener('pointerover', (e) => {
    const alvo = e.target.closest('a,button,label,select,input,textarea,.clipe');
    c.classList.toggle('sobre', !!alvo);
    c.classList.toggle('arrasta', !!e.target.closest('[data-roleta]'));
  });
  document.addEventListener('pointerleave', () => c.classList.add('fora'));
  document.addEventListener('pointerenter', () => c.classList.remove('fora'));
}

/* ---------- topo: some ao descer, volta ao subir ---------- */
let ultimoY = 0;
addEventListener('scroll', () => {
  const y = scrollY;
  document.documentElement.classList.toggle('rolou', y > 40);
  document.documentElement.classList.toggle('descendo', y > ultimoY && y > 320);
  ultimoY = y;
}, { passive: true });

/* ==========================================================================
   ABERTURA: tela de carregamento com os três logos
   ========================================================================== */
function precarregar(id, aoAndar) {
  const p = PROJETOS[id];
  const imagens = [
    `${tex(p.textura)}`,
    `${A(p.capa)}-m.webp`,
    tex(p.logo),
    ...Object.values(PROJETOS).map((x) => tex(x.logo)),
    ...(id === 'darky'
      ? [`${A('artist/bruno-01')}-m.webp`, `${A('darky/skull-01')}-m.webp`, `${A('darky/skull-03')}-m.webp`]
      : id === 'slowly'
        ? [`${A('slowly/slowly-01')}-m.webp`, `${A('slowly/slowly-06')}-m.webp`]
        : [`${A('obskurial/art-01')}-m.webp`]),
  ];
  const videos = [p.fundo && vid(p.fundo), p.heroVideo && vid(p.heroVideo)].filter(Boolean);
  const total = imagens.length + videos.length;
  let feitos = 0;
  const anda = () => { feitos++; aoAndar(Math.min(1, feitos / total)); };

  const umaImagem = (src) => new Promise((ok) => {
    const i = new Image();
    i.onload = i.onerror = () => { anda(); ok(); };
    i.src = src;
  });
  const umVideo = (src) => new Promise((ok) => {
    const v = document.createElement('video');
    v.muted = true; v.preload = 'auto'; v.playsInline = true; v.src = src;
    const fim = () => { v.oncanplaythrough = v.onerror = null; anda(); ok(); };
    v.oncanplaythrough = fim; v.onerror = fim;
    setTimeout(fim, 7000);     // nunca segurar a abertura por causa de um vídeo
    v.load();
  });
  const tudo = Promise.all([...imagens.map(umaImagem), ...videos.map(umVideo)]);
  return Promise.race([tudo, new Promise((ok) => setTimeout(ok, 9000))]);
}

function abrir(id) {
  const tela = $('#abertura');
  const barra = $('#abertura-barra');
  const pct = $('#abertura-pct');
  let p = 0, mostrado = 0;
  const pinta = () => {
    mostrado += (p - mostrado) * 0.12;
    barra.style.transform = `scaleX(${mostrado.toFixed(3)})`;
    pct.textContent = Math.round(mostrado * 100) + '%';
    if (mostrado < 0.999) requestAnimationFrame(pinta);
  };
  requestAnimationFrame(pinta);

  const pronto = precarregar(id, (v) => { p = Math.max(p, v); });
  const minimo = new Promise((ok) => setTimeout(ok, CALMO ? 300 : 2100));  // deixa a animação dos logos acontecer

  return Promise.all([pronto, minimo]).then(() => {
    p = 1;
    document.documentElement.classList.add('pronto');
    montar(id);
    if (location.hash) requestAnimationFrame(() => rolarPara(location.hash.slice(1), false));
    // a saída é por CSS: funciona mesmo com a aba em segundo plano, onde o
    // relógio de quadros do navegador fica parado
    return new Promise((ok) => {
      barra.style.transform = 'scaleX(1)';
      pct.textContent = '100%';
      tela.classList.add('saindo');
      const fechar = () => {
        if (!tela.isConnected) return;
        tela.remove();
        document.documentElement.classList.add('aberto');
        ok();
      };
      tela.addEventListener('transitionend', fechar, { once: true });
      setTimeout(fechar, CALMO ? 250 : 1100);
    });
  });
}

/* ---------- partida ---------- */
montarSeletor();
idAtual = null;
const rotaInicial = rotaDaUrl();
history.replaceState({ rota: rotaInicial }, '', location.href);
document.documentElement.dataset.universo = chave(rotaInicial);
idAtual = chave(rotaInicial);

abrir(idAtual).then(() => {
  if (!COM_FX) { document.documentElement.classList.add('sem-fx'); return; }
  import('./fx.js').then((m) => {
    fx = m.criarFx($('#fx'), { calmo: CALMO, leve: FRACO });
    if (fx) { fx.modo(idAtual, true); document.documentElement.classList.add('tem-fx'); }
  }).catch(() => {});
});
document.fonts?.ready.then(() => idAtual && marcarSeletor(idAtual));
