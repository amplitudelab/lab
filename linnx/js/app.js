/* LINNX — interações, motion e som.
   O som da página é o fim do set dela no Comic Festival 2026 (assets/audio): quando
   ligado, um analisador lê os graves e é isso que faz o fundo, o logo e o visualizador
   pulsarem. Sem som, um
   pulso sintético em 140 BPM mantém tudo vivo (só animação, não é dado da artista). */
import { criarFx } from './fx.js';

// ---------------------------------------------------------------------------
// Contatos de booking. Campo vazio não aparece na página: nada é inventado.
// whatsapp: só números com DDI e DDD (ex.: 5511999999999)
// instagram: o @ sem a arroba
const CONTATO = {
  whatsapp: '',
  email: '',
  instagram: '',
  soundcloud: '',   // endereço completo
  spotify: '',      // endereço completo
};
// ---------------------------------------------------------------------------

const gsap = window.gsap, ST = window.ScrollTrigger;
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const raiz = document.documentElement;

const calmo = matchMedia('(prefers-reduced-motion: reduce)').matches;
const celular = matchMedia('(max-width: 760px)').matches;
const fraco = celular || (navigator.hardwareConcurrency || 8) <= 2 || (navigator.deviceMemory || 8) <= 2 || navigator.connection?.saveData;
const ponteiroFino = matchMedia('(hover: hover) and (pointer: fine)').matches;

const estado = { k: 0, nivel: 0, rolagem: 0, mx: .5, my: .5, som: false };

if (gsap && ST) gsap.registerPlugin(ST);

// ---------- aviso ----------
let avisoT;
function avisar(txt) {
  const a = $('#aviso'); a.textContent = txt; a.classList.add('on');
  clearTimeout(avisoT); avisoT = setTimeout(() => a.classList.remove('on'), 2600);
}
async function copiar(txt) {
  try { await navigator.clipboard.writeText(txt); return true; } catch {
    const t = document.createElement('textarea'); t.value = txt; t.setAttribute('readonly', ''); t.style.position = 'fixed'; t.style.opacity = '0';
    document.body.appendChild(t); t.select(); let ok = false; try { ok = document.execCommand('copy'); } catch {} t.remove(); return ok;
  }
}

// ---------- trilha: o fim do set da Comic ----------
const trilha = $('#trilha');

// ---------- vídeo ao vivo (sempre mudo): versão leve no celular ----------
const video = $('#video-vivo');
const fonte = video.querySelector('source');
fonte.src = fraco ? fonte.dataset.srcM : fonte.dataset.src;
video.load();

// ---------- fundo WebGL ----------
let fx = null;
if (!fraco && !calmo && !/[?&]semfx/.test(location.search)) {
  fx = criarFx($('#fx'), estado, { leve: false });
  if (fx) raiz.classList.add('tem-fx');
}

// ---------- som ----------
let ctx, analisador, dadosFreq;
function prepararAnalisador() {
  if (analisador || !window.AudioContext) return;
  try {
    ctx = new AudioContext();
    const src = ctx.createMediaElementSource(trilha);
    analisador = ctx.createAnalyser();
    analisador.fftSize = 256; analisador.smoothingTimeConstant = .7;
    src.connect(analisador); analisador.connect(ctx.destination);
    dadosFreq = new Uint8Array(analisador.frequencyBinCount);
  } catch (e) { analisador = null; }
}
function marcarSom() {
  $$('[data-som]').forEach((b) => b.setAttribute('aria-pressed', String(estado.som)));
  $$('[data-som-rot]').forEach((s) => { s.textContent = s.closest('.hud') ? (estado.som ? 'Som on' : 'Som off') : (estado.som ? 'Desligar o som' : 'Ligar o som'); });
  $('.hud__som').setAttribute('aria-label', estado.som ? 'Desligar o som do set da Comic' : 'Ligar o som do set da Comic');
}
async function ligarSom(on) {
  estado.som = on;
  if (on) {
    prepararAnalisador();
    try { await ctx?.resume(); } catch {}
    if (trilha.preload === 'none') trilha.preload = 'auto';
    try { await trilha.play(); } catch { estado.som = false; avisar('Toque de novo para ligar o som'); }
  } else {
    trilha.pause();
  }
  marcarSom();
}
$$('[data-som]').forEach((b) => b.addEventListener('click', () => ligarSom(!estado.som)));

new IntersectionObserver(([e]) => {
  if (e.isIntersecting) video.play().catch(() => {}); else video.pause();
}, { threshold: .15 }).observe(video);

// ---------- última passagem: cortes do set da Comic ----------
const CORTES = $$('[data-corte]').map((b) => ({
  btn: b, seg: +b.dataset.seg,
  nome: b.querySelector('.corte__nome').textContent, tc: b.querySelector('.corte__tc').textContent,
}));
const telaComic = $('#comic-tela');
const vidsComic = $$('.comic__video', telaComic);
const arqCorte = (i) => `./assets/comic/corte-${String(i + 1).padStart(2, '0')}${fraco ? '-m' : ''}.mp4`;
const quadroCorte = (i) => `./assets/comic/quadro-${String(i + 1).padStart(2, '0')}${fraco ? '-m' : ''}.webp`;
const temCorte = (v, i) => v.src.endsWith(arqCorte(i).slice(1));
let corteAtual = -1, comicVisivel = false, comicAberto = false, reserva;
function mostrarCorte(i, { tocar = true } = {}) {
  i = (i + CORTES.length) % CORTES.length;
  const ativo = vidsComic.find((v) => v.classList.contains('is-on'));
  const proximo = corteAtual === -1 ? ativo : vidsComic.find((v) => v !== ativo);
  corteAtual = i;
  const c = CORTES[i];
  $('#comic-n').textContent = String(i + 1).padStart(2, '0');
  $('#comic-tc').textContent = c.tc;
  $('#comic-nome').textContent = c.nome;
  CORTES.forEach((x, k) => { x.btn.classList.toggle('ativo', k === i); x.btn.setAttribute('aria-current', k === i ? 'true' : 'false'); });
  proximo.poster = quadroCorte(i);
  if (!temCorte(proximo, i)) { proximo.src = arqCorte(i); proximo.preload = 'auto'; }
  const trocar = () => {
    vidsComic.forEach((v) => v.classList.toggle('is-on', v === proximo));
    if (proximo !== ativo) ativo.pause();
  };
  if (!tocar || calmo) { trocar(); return; }
  proximo.currentTime = 0;
  proximo.play().then(trocar).catch(trocar);
  // reinicia a barrinha do corte
  const barra = c.btn.querySelector('.corte__barra'); barra.style.animation = 'none'; void barra.offsetWidth; barra.style.animation = '';
  clearTimeout(reserva); reserva = setTimeout(() => { if (comicVisivel && !comicAberto) mostrarCorte(corteAtual + 1); }, 7000);
}
vidsComic.forEach((v) => {
  v.addEventListener('ended', () => { if (v.classList.contains('is-on') && comicVisivel && !comicAberto) mostrarCorte(corteAtual + 1); });
  // perto do fim, o outro vídeo já começa a carregar o próximo corte
  v.addEventListener('timeupdate', () => {
    if (!v.classList.contains('is-on') || v.currentTime < 3.5) return;
    const outro = vidsComic.find((x) => x !== v), prox = (corteAtual + 1) % CORTES.length;
    if (!temCorte(outro, prox)) { outro.src = arqCorte(prox); outro.preload = 'auto'; outro.poster = quadroCorte(prox); }
  });
});
CORTES.forEach((c, i) => c.btn.addEventListener('click', () => { if (comicAberto) fecharSet(); mostrarCorte(i); }));
new IntersectionObserver(([e]) => {
  comicVisivel = e.isIntersecting;
  if (comicAberto) return;
  if (comicVisivel) { if (corteAtual === -1) mostrarCorte(0, { tocar: !calmo }); else if (!calmo) vidsComic.find((v) => v.classList.contains('is-on')).play().catch(() => {}); }
  else { vidsComic.forEach((v) => v.pause()); clearTimeout(reserva); }
}, { threshold: .25 }).observe(telaComic);

// set completo no YouTube (sem cookies), só quando a pessoa pede
const yt = $('#comic-yt');
function abrirSet() {
  comicAberto = true; clearTimeout(reserva);
  vidsComic.forEach((v) => v.pause());
  if (estado.som) ligarSom(false);
  const inicio = corteAtual >= 0 ? CORTES[corteAtual].seg : 0;
  yt.replaceChildren();
  const fr = document.createElement('iframe');
  fr.src = `https://www.youtube-nocookie.com/embed/O3xTPJZGzeo?autoplay=1&rel=0&playsinline=1&start=${inicio}`;
  fr.title = 'Linnx DjSet @ Comic Festival 2026 (set completo)';
  fr.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
  fr.referrerPolicy = 'strict-origin-when-cross-origin';
  const fechar = document.createElement('button');
  fechar.type = 'button'; fechar.className = 'comic__fechar'; fechar.textContent = 'Fechar o set';
  fechar.addEventListener('click', fecharSet);
  yt.append(fr, fechar); yt.hidden = false; telaComic.classList.add('com-yt');
  fechar.focus({ preventScroll: true });
}
function fecharSet() {
  comicAberto = false; yt.hidden = true; yt.replaceChildren(); telaComic.classList.remove('com-yt');
  if (comicVisivel && !calmo) mostrarCorte(corteAtual);
  $('#comic-full').focus({ preventScroll: true });
}
$('#comic-full').addEventListener('click', abrirSet);

// vídeo de fundo da viagem
const vViagem = $('.viagem__video');
if (calmo) vViagem.remove();
else new IntersectionObserver(([e]) => {
  if (e.isIntersecting) { if (vViagem.preload === 'none') vViagem.preload = 'auto'; vViagem.play().catch(() => {}); } else vViagem.pause();
}).observe($('.viagem'));

// ---------- pulso: lê os graves ou bate sozinho ----------
const pulsantes = [$('.hero__logo'), $('.aovivo__palco'), ...$$('.ponto')].filter(Boolean);
const hudNivel = $('#hud-nivel');
const barras = $$('.barras rect'), raios = $$('.raios circle');
const vis = $('#vis'), vctx = vis.getContext('2d');
let visVisivel = false;
new IntersectionObserver(([e]) => { visVisivel = e.isIntersecting; }).observe($('.aovivo'));
let barrasVisiveis = false, raiosVisiveis = false;
new IntersectionObserver(([e]) => { barrasVisiveis = e.isIntersecting; }).observe($('.cena--2'));
new IntersectionObserver(([e]) => { raiosVisiveis = e.isIntersecting; }).observe($('.cena--3'));

const BPM = 140;
const t0 = performance.now();
let graveAnt = 0, ultimoQuadro = 0;
const espectro = new Float32Array(48);

function pulso(agora) {
  const t = (agora - t0) / 1000;
  if (estado.som && analisador && !trilha.paused) {
    analisador.getByteFrequencyData(dadosFreq);
    let g = 0; for (let i = 1; i < 6; i++) g += dadosFreq[i]; g /= 5 * 255;
    let tot = 0; for (let i = 0; i < 64; i++) tot += dadosFreq[i]; tot /= 64 * 255;
    const subida = g - graveAnt; graveAnt = g;
    estado.k = Math.max(estado.k * .86, subida > .025 ? Math.min(1, .55 + subida * 6) : 0, Math.pow(g, 3) * .8);
    estado.nivel += (tot - estado.nivel) * .2;
    for (let i = 0; i < espectro.length; i++) espectro[i] += (dadosFreq[2 + i * 2] / 255 - espectro[i]) * .35;
  } else {
    const fase = (t * BPM / 60) % 1;
    estado.k = calmo ? 0 : Math.exp(-fase * 6) * .8;
    estado.nivel += (.12 - estado.nivel) * .05;
    for (let i = 0; i < espectro.length; i++) {
      const alvo = calmo ? .15 : (.18 + .5 * estado.k * Math.exp(-i / 14)) * (.6 + .4 * Math.sin(t * 2 + i * .7) ** 2);
      espectro[i] += (alvo - espectro[i]) * .25;
    }
  }
  return t;
}

function laco(agora) {
  requestAnimationFrame(laco);
  if (document.hidden) return;
  if (fraco && agora - ultimoQuadro < 1000 / 30) return;   // 30 quadros bastam no aparelho fraco
  ultimoQuadro = agora;
  const t = pulso(agora);
  const kk = estado.k.toFixed(3);
  for (const el of pulsantes) el.style.setProperty('--k', kk);
  hudNivel.style.transform = `scaleX(${Math.min(1, estado.nivel * 2.2 + estado.k * .3).toFixed(3)})`;
  if (fx) fx.quadro();
  if (barrasVisiveis && !calmo) barras.forEach((b, i) => { b.style.transform = `scaleY(${(.35 + .65 * Math.abs(Math.sin(t * 3 + i * .9)) * (.5 + estado.k)).toFixed(3)})`; });
  if (raiosVisiveis && !calmo) raios.forEach((c, i) => { const f = ((t * BPM / 60 + i * .25) % 1); c.style.transform = `scale(${(.4 + f * 1.1).toFixed(3)})`; c.style.opacity = (1 - f).toFixed(2); });
  if (visVisivel) desenharVis(t);
}

function desenharVis(t) {
  const r = vis.getBoundingClientRect();
  const dpr = Math.min(devicePixelRatio || 1, 2);
  const w = Math.round(r.width * dpr), h = Math.round(r.height * dpr);
  if (vis.width !== w || vis.height !== h) { vis.width = w; vis.height = h; }
  vctx.clearRect(0, 0, w, h);
  // equalizador espelhado: graves no centro (atrás da tela do vídeo), agudos nas pontas
  const cx = w / 2, cy = h / 2;
  const passo = 14 * dpr, larg = 6 * dpr;
  const n = Math.ceil(cx / passo);
  for (let i = 0; i < n; i++) {
    const v = espectro[Math.min(espectro.length - 1, Math.floor((i / n) * espectro.length))];
    const onda = .5 + .5 * Math.sin(t * 1.5 - i * .25);
    const alt = (.06 + v * .8 * (.75 + .25 * onda)) * h * (1 - i / n * .45);
    const mix = i / n;
    vctx.fillStyle = `rgba(${Math.round(255 - mix * 208)},${Math.round(63 + mix * 44)},${Math.round(176 + mix * 79)},${(.75 - mix * .5).toFixed(2)})`;
    for (const lado of [-1, 1]) {
      const x = cx + lado * (i * passo + passo / 2) - larg / 2;
      vctx.fillRect(x, cy - alt / 2, larg, alt);
    }
  }
}

requestAnimationFrame(laco);

// ---------- rolagem global ----------
const topo = $('#topo'), hud = $('#hud');
let yAnt = 0;
function rolou() {
  const y = scrollY, max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
  estado.rolagem = y / max;
  topo.classList.toggle('solido', y > 40);
  topo.classList.toggle('escondido', y > 300 && y > yAnt && $('#menu').hidden);
  hud.classList.toggle('on', y > innerHeight * .5);
  yAnt = y;
}
addEventListener('scroll', rolou, { passive: true });
// o HUD sai da frente quando os botões do formulário estão na tela
new IntersectionObserver(([e]) => hud.classList.toggle('longe', e.isIntersecting)).observe($('#form-envio'));
rolou();

addEventListener('pointermove', (e) => { estado.mx = e.clientX / innerWidth; estado.my = e.clientY / innerHeight; }, { passive: true });

// ---------- menu do celular ----------
const menuBtn = $('#menu-btn'), menu = $('#menu');
function abrirMenu(abrir) {
  menu.hidden = !abrir; menuBtn.setAttribute('aria-expanded', String(abrir));
  menuBtn.textContent = abrir ? 'Fechar' : 'Menu';
  document.body.classList.toggle('travado', abrir);
  if (abrir && !calmo) gsap?.from($$('a', menu), { y: 40, opacity: 0, stagger: .05, duration: .5, ease: 'power3.out' });
}
menuBtn.addEventListener('click', () => abrirMenu(menu.hidden));
$$('a', menu).forEach((a) => a.addEventListener('click', () => abrirMenu(false)));
addEventListener('keydown', (e) => { if (e.key === 'Escape' && !menu.hidden) { abrirMenu(false); menuBtn.focus(); } });

// ---------- texto embaralhado no menu do topo ----------
const SIMB = 'LINX✕/#*01<>';
$$('[data-scramble]').forEach((a) => {
  const orig = a.textContent; let id;
  a.addEventListener('mouseenter', () => {
    if (calmo) return; let n = 0; clearInterval(id);
    id = setInterval(() => {
      a.textContent = orig.split('').map((c, i) => (i < n ? c : c === ' ' ? ' ' : SIMB[Math.floor(Math.random() * SIMB.length)])).join('');
      n += .5; if (n > orig.length) { clearInterval(id); a.textContent = orig; }
    }, 28);
  });
});

// ---------- cursor e botões magnéticos ----------
if (ponteiroFino && !calmo) {
  raiz.classList.add('com-cursor');
  const cur = $('#cursor'), txt = $('#cursor-txt');
  let cx = innerWidth / 2, cy = innerHeight / 2, x = cx, y = cy;
  addEventListener('pointermove', (e) => { x = e.clientX; y = e.clientY; }, { passive: true });
  (function anda() { cx += (x - cx) * .2; cy += (y - cy) * .2; cur.style.transform = `translate3d(${cx}px,${cy}px,0)`; requestAnimationFrame(anda); })();
  document.addEventListener('pointerover', (e) => {
    const alvo = e.target.closest('a,button,[data-tilt],#tela');
    cur.classList.toggle('grande', !!alvo);
    txt.textContent = !alvo ? '' : alvo.id === 'tela' ? (estado.som ? 'ao vivo' : 'som?') : alvo.matches('[download]') ? 'baixar' : '';
  });
  $$('.magnet').forEach((b) => {
    b.addEventListener('pointermove', (e) => {
      const r = b.getBoundingClientRect();
      gsap.to(b, { x: (e.clientX - r.left - r.width / 2) * .3, y: (e.clientY - r.top - r.height / 2) * .4, duration: .4, ease: 'power3.out' });
    });
    b.addEventListener('pointerleave', () => gsap.to(b, { x: 0, y: 0, duration: .7, ease: 'elastic.out(1,.4)' }));
  });
  // clicar na tela do vídeo liga o som
  $('#tela').addEventListener('click', (e) => { if (!e.target.closest('[data-som]')) ligarSom(!estado.som); });
}

// ---------- retrato: duotone e inclinação ----------
const DUO = {
  rosa: ['0.03 1', '0.01 0.25', '0.06 0.69'],
  azul: ['0.02 0.56', '0.01 0.69', '0.08 1'],
  brasa: ['0.06 1', '0.01 0.48', '0.03 0.18'],
};
$$('[data-duo]').forEach((b) => b.addEventListener('click', () => {
  const nome = b.dataset.duo;
  $$('[data-duo]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
  const img = $('#duo-img');
  if (nome === 'original') { img.classList.add('original'); return; }
  img.classList.remove('original');
  const [r, g, bb] = DUO[nome];
  $('#duo-r').setAttribute('tableValues', r); $('#duo-g').setAttribute('tableValues', g); $('#duo-b').setAttribute('tableValues', bb);
}));
if (ponteiroFino && !calmo) $$('[data-tilt]').forEach((q) => {
  q.addEventListener('pointermove', (e) => {
    const r = q.getBoundingClientRect(), px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
    q.style.transform = `perspective(900px) rotateY(${(px - .5) * 10}deg) rotateX(${(.5 - py) * 8}deg)`;
    q.style.setProperty('--mx', `${px * 100}%`); q.style.setProperty('--my', `${py * 100}%`);
  });
  q.addEventListener('pointerleave', () => { q.style.transform = ''; });
});

// ---------- press kit ----------
$('#copiar-release').addEventListener('click', async () => {
  const txt = $$('#release-texto p').map((p) => p.textContent.trim()).join('\n\n');
  avisar((await copiar(txt)) ? 'Release copiado' : 'Não deu para copiar. Selecione o texto.');
});

// ---------- booking ----------
const form = $('#form'), envio = $('#form-envio'), avisoForm = $('#form-aviso');
function pedido() {
  const d = Object.fromEntries(new FormData(form));
  const data = d.data ? new Date(d.data + 'T12:00').toLocaleDateString('pt-BR') : '';
  return [
    'Olá, Linnx! Quero te levar para tocar.',
    '',
    `Nome: ${d.nome.trim()}`,
    `Evento: ${d.evento.trim()}`,
    d.cidade.trim() && `Cidade: ${d.cidade.trim()}`,
    data && `Data: ${data}`,
    d.msg.trim() && `\n${d.msg.trim()}`,
  ].filter(Boolean).join('\n');
}
function valido() {
  let ok = true;
  for (const n of ['nome', 'evento']) {
    const el = form.elements[n]; const v = el.value.trim().length > 1;
    el.setAttribute('aria-invalid', String(!v)); if (!v && ok) { el.focus(); ok = false; }
  }
  if (!ok) avisoForm.textContent = 'Preencha seu nome e o evento.';
  return ok;
}
function botao(rot, fn, classe = 'btn--rosa') {
  const b = document.createElement('button'); b.type = 'button'; b.className = `btn ${classe}`; b.textContent = rot;
  b.addEventListener('click', () => { if (valido()) { avisoForm.textContent = ''; fn(); } });
  envio.appendChild(b);
}
if (CONTATO.whatsapp) botao('Enviar pelo WhatsApp', () => open(`https://wa.me/${CONTATO.whatsapp}?text=${encodeURIComponent(pedido())}`, '_blank', 'noopener'));
if (CONTATO.email) botao('Enviar por e-mail', () => { location.href = `mailto:${CONTATO.email}?subject=${encodeURIComponent('Booking · Linnx')}&body=${encodeURIComponent(pedido())}`; }, CONTATO.whatsapp ? 'btn--linha' : 'btn--rosa');
botao(CONTATO.whatsapp || CONTATO.email ? 'Copiar pedido' : 'Copiar pedido de booking', async () => {
  const ok = await copiar(pedido());
  avisar(ok ? 'Pedido copiado. Agora é só colar na conversa com a Linnx.' : 'Não deu para copiar.');
}, CONTATO.whatsapp || CONTATO.email ? 'btn--linha' : 'btn--rosa');
form.addEventListener('submit', (e) => e.preventDefault());
form.addEventListener('input', (e) => { if (e.target.getAttribute('aria-invalid') === 'true' && e.target.value.trim().length > 1) e.target.setAttribute('aria-invalid', 'false'); });

const redes = [
  CONTATO.instagram && ['Instagram', `https://instagram.com/${CONTATO.instagram}`, `@${CONTATO.instagram}`],
  CONTATO.soundcloud && ['SoundCloud', CONTATO.soundcloud, 'SoundCloud'],
  CONTATO.spotify && ['Spotify', CONTATO.spotify, 'Spotify'],
  CONTATO.whatsapp && ['WhatsApp', `https://wa.me/${CONTATO.whatsapp}`, 'WhatsApp'],
  CONTATO.email && ['E-mail', `mailto:${CONTATO.email}`, CONTATO.email],
].filter(Boolean);
const ulRedes = $('#redes');
if (!redes.length) ulRedes.remove();
else redes.forEach(([nome, href, rot]) => {
  const li = document.createElement('li'), a = document.createElement('a');
  a.href = href; a.textContent = rot; a.setAttribute('aria-label', `${nome}: ${rot}`);
  if (!href.startsWith('mailto')) { a.target = '_blank'; a.rel = 'noopener'; }
  li.appendChild(a); ulRedes.appendChild(li);
});

// ---------- motion de rolagem ----------
function quebrarPalavras(el) {
  const DEST = /^(linnx,?|progressive|trance|acelerado\.?)$/i;
  el.innerHTML = el.textContent.trim().split(/\s+/).map((w) => `<span class="w${DEST.test(w) ? ' hl' : ''}">${w}</span>`).join(' ');
  return $$('.w', el);
}
function quebrarLetras(el) {
  const t = el.textContent; el.setAttribute('aria-label', t);
  el.innerHTML = t.split(' ').map((p) => `<span class="pal" aria-hidden="true">${p.split('').map((c) => `<span style="display:inline-block">${c}</span>`).join('')}</span>`).join(' ');
  return $$('.pal > span', el);
}

function motion() {
  if (!gsap || !ST || calmo) return;
  const mm0 = gsap.matchMedia();

  // hero: rolar afasta a foto e aproxima o logo
  gsap.to('.hero__foto', { yPercent: 18, scale: 1.08, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
  gsap.to('.hero__texto', { yPercent: -25, opacity: .2, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
  gsap.to('.hero__anel', { rotate: 120, scale: 1.3, opacity: 0, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
  gsap.fromTo('.faixa', { xPercent: 4 }, { xPercent: -4, ease: 'none', scrollTrigger: { trigger: '.faixa', start: 'top bottom', end: 'bottom top', scrub: true } });

  // última passagem: o título entra linha a linha e a tela abre até a borda
  gsap.from('.comic__linha', { yPercent: 110, opacity: 0, stagger: .12, duration: 1.1, ease: 'power4.out', scrollTrigger: { trigger: '.comic', start: 'top 75%' } });
  gsap.from('.comic__lede', { y: 30, opacity: 0, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: '.comic', start: 'top 70%' } });
  mm0.add('(min-width: 761px)', () => {
    gsap.fromTo('#comic-tela', { clipPath: 'inset(7% 9% 7% 9% round 32px)' }, { clipPath: 'inset(0% 0% 0% 0% round 0px)', ease: 'none',
      scrollTrigger: { trigger: '.comic__pin', start: 'top 85%', end: 'top 10%', scrub: .6 } });
    gsap.fromTo('.comic__video', { scale: 1.12 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: '.comic__pin', start: 'top bottom', end: 'bottom top', scrub: true } });
  });
  gsap.from('.comic__cortes li', { y: 40, opacity: 0, stagger: .05, duration: .7, ease: 'power3.out', scrollTrigger: { trigger: '.comic__cortes', start: 'top 92%' } });

  // sobre: as palavras acendem conforme a leitura
  const palavras = quebrarPalavras($('[data-palavras]'));
  gsap.to(palavras, { opacity: 1, stagger: .1, ease: 'none', scrollTrigger: { trigger: '.sobre__frase', start: 'top 80%', end: 'bottom 45%', scrub: .6 } });
  $$('[data-revela]').forEach((el) => gsap.from(el, { y: 50, opacity: 0, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 85%' } }));
  gsap.from('.sobre__tags li', { y: 30, opacity: 0, stagger: .07, duration: .7, ease: 'back.out(2)', scrollTrigger: { trigger: '.sobre__tags', start: 'top 90%' } });

  // viagem: no computador o trilho anda de lado, preso na tela
  const mm = gsap.matchMedia();
  mm.add('(min-width: 761px)', () => {
    const trilho = $('#viagem-trilho');
    const dist = () => Math.max(0, trilho.scrollWidth - innerWidth);
    const anda = gsap.to(trilho, { x: () => -dist(), ease: 'none', scrollTrigger: {
      trigger: '.viagem', start: 'top top', end: () => `+=${dist()}`, pin: '.viagem__pin', scrub: .8, invalidateOnRefresh: true,
      onUpdate: (s) => { $('#viagem-prog').style.transform = `scaleX(${s.progress})`; },
    } });
    $$('.cena').forEach((c) => {
      gsap.from(c, { rotateY: -25, rotateZ: 3, opacity: .25, scale: .9, transformPerspective: 1000, ease: 'none', scrollTrigger: { trigger: c, containerAnimation: anda, start: 'left 100%', end: 'left 55%', scrub: true } });
    });
    gsap.to('.onda', { strokeDashoffset: 0, ease: 'none', scrollTrigger: { trigger: '.cena--1', containerAnimation: anda, start: 'left 90%', end: 'left 20%', scrub: true } });
    gsap.to('.x', { strokeDashoffset: 0, ease: 'none', scrollTrigger: { trigger: '.cena--4', containerAnimation: anda, start: 'left 95%', end: 'left 50%', scrub: true } });
  });
  mm.add('(max-width: 760px)', () => {
    $$('.cena').forEach((c) => gsap.from(c, { y: 70, opacity: 0, duration: .9, ease: 'power3.out', scrollTrigger: { trigger: c, start: 'top 88%' } }));
    gsap.to('.onda', { strokeDashoffset: 0, duration: 2, ease: 'power2.out', scrollTrigger: { trigger: '.cena--1', start: 'top 80%' } });
    gsap.to('.x', { strokeDashoffset: 0, duration: 1.2, ease: 'power3.out', scrollTrigger: { trigger: '.cena--4', start: 'top 80%' } });
  });

  // ao vivo: a tela gira para frente e cresce ao entrar
  gsap.fromTo('#tela', { scale: .72, rotate: -8, y: 80 }, { scale: 1, rotate: 0, y: 0, ease: 'none', scrollTrigger: { trigger: '.aovivo', start: 'top bottom', end: 'center center', scrub: .8 } });
  gsap.from('.aovivo__titulo h2', { xPercent: -20, opacity: 0, ease: 'none', scrollTrigger: { trigger: '.aovivo', start: 'top 80%', end: 'top 20%', scrub: true } });
  gsap.from('.aovivo__legenda', { y: 40, opacity: 0, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: '.aovivo__legenda', start: 'top 90%' } });

  // retrato, press e booking
  gsap.from('.retrato__quadro--a', { clipPath: 'inset(100% 0 0 0 round 28px)', duration: 1.3, ease: 'power4.inOut', scrollTrigger: { trigger: '.retrato', start: 'top 70%' } });
  gsap.from('.retrato__quadro--b', { clipPath: 'inset(0 100% 0 0 round 28px)', duration: 1.3, ease: 'power4.inOut', scrollTrigger: { trigger: '.retrato__quadro--b', start: 'top 85%' } });
  gsap.from('.retrato__chamada', { y: 40, opacity: 0, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: '.retrato__chamada', start: 'top 85%' } });
  gsap.from('.press__lista li', { y: 40, opacity: 0, stagger: .06, duration: .7, ease: 'power3.out', scrollTrigger: { trigger: '.press__lista', start: 'top 85%' } });
  gsap.from('.booking__x', { rotate: -90, scale: .4, opacity: 0, ease: 'none', scrollTrigger: { trigger: '.booking', start: 'top bottom', end: 'center center', scrub: true } });
  $$('.press h2, .booking h2').forEach((h) => gsap.from(h, { yPercent: 60, opacity: 0, duration: 1, ease: 'power4.out', scrollTrigger: { trigger: h, start: 'top 88%' } }));

  // as fontes e imagens mexem na altura: recalcula quando tudo chegar
  addEventListener('load', () => ST.refresh());
}

function criarIntro() {
  if (!gsap || calmo) return null;
  const letras = $$('[data-kin]').flatMap(quebrarLetras);
  const tl = gsap.timeline({ paused: true, defaults: { ease: 'power4.out' } });
  tl.from('.hero__foto', { yPercent: 25, opacity: 0, scale: 1.1, duration: 1.6 }, 0)
    .from('.hero__logo', { clipPath: 'inset(0 100% 0 0)', duration: 1.3, ease: 'power3.inOut' }, .15)
    .from('.hero__rot', { y: 20, opacity: 0, duration: .8 }, .4)
    .from(letras, { yPercent: 110, opacity: 0, rotate: 8, stagger: .018, duration: .8 }, .7)
    .from('.hero__linha b', { scale: 0, rotate: -180, duration: .8, ease: 'back.out(3)' }, .9)
    .from('.hero__acoes .btn', { y: 30, opacity: 0, stagger: .1, duration: .8 }, 1.1)
    .from('.hero__anel', { opacity: 0, scale: .6, duration: 1.8 }, .3)
    .from('.topo', { yPercent: -100, opacity: 0, duration: .8 }, .6);
  return tl;
}
const intro = criarIntro();

// ---------- abertura ----------
const abertura = $('#abertura');
const preciso = ['./assets/img/logo-rosa.webp', fraco ? './assets/img/linnx-chapeu-m.webp' : './assets/img/linnx-chapeu.webp', './assets/img/logo-branco.webp'];
let feitos = 0, pct = 0;
const pctEl = $('#ab-pct'), barraEl = $('#ab-barra'), logoAb = $('.abertura__logo');
function progresso() {
  const alvo = Math.round((feitos / (preciso.length + 1)) * 100);
  if (gsap && !calmo) {
    const o = { v: pct };
    gsap.to(o, { v: alvo, duration: .6, ease: 'power2.out', onUpdate: () => { pctEl.textContent = String(Math.round(o.v)).padStart(3, '0'); } });
    gsap.to(barraEl, { scaleX: alvo / 100, duration: .6, ease: 'power2.out' });
    gsap.to(logoAb, { clipPath: `inset(0 ${100 - alvo}% 0 0)`, duration: .8, ease: 'power2.out' });
  } else { pctEl.textContent = String(alvo).padStart(3, '0'); barraEl.style.transform = `scaleX(${alvo / 100})`; logoAb.style.clipPath = 'none'; }
  pct = alvo;
}
const carregar = (src) => new Promise((ok) => { const i = new Image(); i.onload = i.onerror = () => { feitos++; progresso(); ok(); }; i.src = src; });
const prontos = Promise.all([...preciso.map(carregar), (document.fonts?.ready || Promise.resolve()).then(() => { feitos++; progresso(); })]);
const limite = new Promise((ok) => setTimeout(ok, 7000));

document.body.classList.add('travado');
Promise.race([prontos, limite]).then(() => {
  feitos = preciso.length + 1; progresso();
  setTimeout(() => {
    const ent = $('#ab-entrar'); ent.hidden = false;
    if (gsap && !calmo) gsap.from(ent.children, { y: 20, opacity: 0, stagger: .08, duration: .6, ease: 'power3.out' });
    ent.querySelector('button').focus({ preventScroll: true });
  }, calmo ? 0 : 500);
});

function entrar(comSom) {
  if (abertura.classList.contains('saindo')) return;
  if (comSom) ligarSom(true);
  document.body.classList.remove('travado');
  abertura.classList.add('saindo');
  let saiu = false;
  const fim = () => { if (saiu) return; saiu = true; abertura.remove(); $('#conteudo').focus({ preventScroll: true }); };
  setTimeout(() => { intro?.play(); fim(); }, 2500);   // garantia em aparelho lento: a abertura nunca fica presa
  if (gsap && !calmo) {
    gsap.timeline({ onComplete: fim })
      .to('.abertura__logo', { scale: 1.6, opacity: 0, filter: 'blur(12px)', duration: .7, ease: 'power3.in' }, 0)
      .to(['.abertura__info', '.abertura__barra', '#ab-entrar'], { opacity: 0, y: -20, duration: .4 }, 0)
      .to(abertura, { clipPath: 'circle(0% at 50% 50%)', duration: .9, ease: 'power4.inOut' }, .3);
    gsap.delayedCall(.55, () => intro?.play());
  } else { intro?.progress(1); fim(); }
}
$$('[data-entrar]').forEach((b) => b.addEventListener('click', () => entrar(b.dataset.entrar === 'som')));
// "Pular para o conteúdo" e links com âncora também abrem a página
if (location.hash && location.hash.length > 1) entrar(false);

motion();
marcarSom();
