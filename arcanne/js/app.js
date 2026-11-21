// ARCANNE · comportamento do site. Sem biblioteca, sem script inline (CSP script-src 'self').
(function () {
  'use strict';

  var raiz = document.documentElement;
  var corpo = document.body;
  var $ = function (s, el) { return (el || document).querySelector(s); };
  var $$ = function (s, el) { return Array.prototype.slice.call((el || document).querySelectorAll(s)); };
  var mqReduz = matchMedia('(prefers-reduced-motion: reduce)');
  var mqCelular = matchMedia('(max-width: 899px)');
  var economia = !!(navigator.connection && navigator.connection.saveData);
  var reduz = function () { return mqReduz.matches; };
  // Versões -m (verticais e mais leves) seguem a largura da tela, como as capas.
  var leve = function () { return mqCelular.matches; };
  var guarda = {
    ler: function (k, s) { try { return (s ? sessionStorage : localStorage).getItem(k); } catch (e) { return null; } },
    grava: function (k, v, s) { try { (s ? sessionStorage : localStorage).setItem(k, v); } catch (e) { /* sem armazenamento */ } },
  };
  var mmss = function (s) {
    s = Math.max(0, Math.floor(s || 0));
    return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
  };

  /* ---------- Layout completo na primeira interação (ver content-visibility no CSS) ---------- */
  function revela() {
    raiz.classList.add('tudo-visivel');
    ['pointerdown', 'keydown', 'wheel', 'touchstart', 'scroll'].forEach(function (t) { removeEventListener(t, revela, true); });
  }
  ['pointerdown', 'keydown', 'wheel', 'touchstart', 'scroll'].forEach(function (t) { addEventListener(t, revela, { capture: true, passive: true }); });
  addEventListener('load', function () {
    var ocioso = window.requestIdleCallback || function (f) { setTimeout(f, 1500); };
    ocioso(revela, { timeout: 4000 });
  });

  /* ---------- Idioma: a escolha manual fica guardada ---------- */
  $$('[data-idioma-para]').forEach(function (a) {
    a.addEventListener('click', function () {
      guarda.grava('arcanne:idioma', a.getAttribute('data-idioma-para') === 'en' ? 'en' : 'pt');
      if (location.hash) a.setAttribute('href', a.getAttribute('href').split('#')[0] + location.hash);
    });
  });

  /* ---------- Abertura (vídeo de 3,7 s feito no Remotion, sem som) ---------- */
  // Enquanto ela toca, os vídeos de fundo esperam: no celular, dois vídeos ao mesmo tempo pesam.
  var aberturaAtiva = false;
  var depoisDaAbertura = [];
  (function abertura() {
    var el = $('#abertura');
    if (!el) return;
    var params = new URLSearchParams(location.search);
    var pular = reduz() || economia || params.has('sem-abertura') || guarda.ler('arcanne:abertura', true) || (location.hash && location.hash !== '#inicio');
    if (pular) return;
    aberturaAtiva = true;
    var video = $('video', el);
    var retrato = innerHeight > innerWidth;
    var src = el.getAttribute(retrato ? 'data-src-v' : 'data-src');
    var fechado = false;
    var limite;
    function fechar() {
      if (fechado) return;
      fechado = true;
      clearTimeout(limite);
      guarda.grava('arcanne:abertura', '1', true);
      el.classList.add('saindo');
      aberturaAtiva = false;
      depoisDaAbertura.splice(0).forEach(function (f) { f(); });
      setTimeout(function () { el.hidden = true; video.removeAttribute('src'); video.load(); }, 750);
      ['keydown', 'wheel', 'touchmove'].forEach(function (t) { removeEventListener(t, fechar); });
    }
    el.hidden = false;
    video.src = src;
    video.addEventListener('ended', fechar);
    video.addEventListener('error', fechar);
    $('.abertura-pular', el).addEventListener('click', fechar);
    el.addEventListener('click', function (e) { if (e.target === el || e.target === video) fechar(); });
    ['keydown', 'wheel', 'touchmove'].forEach(function (t) { addEventListener(t, fechar, { passive: true }); });
    limite = setTimeout(fechar, 6000);
    var p = video.play();
    if (p && p.catch) p.catch(fechar);
  })();

  /* ---------- Topo: fundo ao rolar, menu no celular, seção atual ---------- */
  var topo = $('#topo');
  var menuBotao = $('.menu-botao');
  var menu = $('#menu');
  function marcaTopo() { topo.classList.toggle('topo--solido', scrollY > 40); }
  requestAnimationFrame(marcaTopo);

  function abreMenu(abrir) {
    menuBotao.setAttribute('aria-expanded', String(abrir));
    $('.sr', menuBotao).textContent = menuBotao.getAttribute(abrir ? 'data-fechar' : 'data-abrir');
    corpo.classList.toggle('menu-aberto', abrir);
    // O menu só fica focável depois de visível: espera um quadro.
    if (abrir) requestAnimationFrame(function () { setTimeout(function () { var a = $('a', menu); if (a) a.focus(); }, 30); });
  }
  menuBotao.addEventListener('click', function () { abreMenu(menuBotao.getAttribute('aria-expanded') !== 'true'); });
  $$('a', menu).forEach(function (a) { a.addEventListener('click', function () { if (corpo.classList.contains('menu-aberto')) abreMenu(false); }); });
  addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && corpo.classList.contains('menu-aberto')) { abreMenu(false); menuBotao.focus(); }
  });
  mqCelular.addEventListener('change', function () { if (!mqCelular.matches) abreMenu(false); });

  if ('IntersectionObserver' in window) {
    var links = {};
    $$('a', menu).forEach(function (a) { links[a.getAttribute('href').slice(1)] = a; });
    var ioSecao = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        var a = links[e.target.id];
        if (!a) return;
        if (e.isIntersecting) {
          Object.keys(links).forEach(function (k) { links[k].removeAttribute('aria-current'); });
          a.setAttribute('aria-current', 'true');
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    Object.keys(links).forEach(function (id) { var s = document.getElementById(id); if (s) ioSecao.observe(s); });
  }

  /* ---------- Vídeos de fundo: carregam perto da tela, pausam fora dela ---------- */
  var fundos = $$('video[data-src]');
  if (leve()) {
    fundos.forEach(function (v) { var pm = v.getAttribute('data-poster-m'); if (pm) v.setAttribute('poster', pm); });
  }
  function liga(v) {
    // Movimento reduzido ou economia de dados: ficam só as capas.
    if (reduz() || economia) return;
    if (!v.getAttribute('src')) {
      var src = leve() && v.getAttribute('data-src-m') ? v.getAttribute('data-src-m') : v.getAttribute('data-src');
      v.setAttribute('src', src);
      v.addEventListener('playing', function () { v.classList.add('tocando'); }, { once: true });
    }
    var p = v.play();
    if (p && p.catch) p.catch(function () { /* autoplay bloqueado: fica a capa */ });
  }
  function desliga(v) { if (!v.paused) v.pause(); }
  if ('IntersectionObserver' in window) {
    var ioVideo = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting && !document.hidden) liga(e.target);
        else desliga(e.target);
      });
    }, { rootMargin: '20% 0px 20% 0px' });
    var observaFundos = function () {
      if (aberturaAtiva) { depoisDaAbertura.push(observaFundos); return; }
      fundos.forEach(function (v) { ioVideo.observe(v); });
    };
    // O vídeo da primeira tela espera a página carregar, para não disputar banda com a capa.
    if (document.readyState === 'complete') setTimeout(observaFundos, 300);
    else addEventListener('load', function () { setTimeout(observaFundos, 300); });
  }
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) fundos.forEach(desliga);
    else fundos.forEach(function (v) {
      var r = v.getBoundingClientRect();
      if (r.bottom > 0 && r.top < innerHeight) liga(v);
    });
  });
  mqReduz.addEventListener('change', function () { if (reduz()) fundos.forEach(desliga); });

  /* ---------- Áudio: um tocador só para a faixa e os trechos ---------- */
  var audio = $('#audio');
  var faixas = $$('.faixa');
  var atual = null;
  var botaoSom = $('.som');
  var inicioNovo = $('.inicio-novo');
  var ctx = null, analisador = null, dadosFreq = null, rodando = false, suave = 0;

  function estadoSom() {
    var toca = !audio.paused && !audio.ended;
    botaoSom.setAttribute('aria-pressed', String(toca));
    $('.som-texto', botaoSom).textContent = botaoSom.getAttribute(toca ? 'data-desligar' : 'data-ligar');
    botaoSom.setAttribute('aria-label', botaoSom.getAttribute(toca ? 'data-desligar' : 'data-ligar') + ' · Odin on Acid');
    var destaqueToca = toca && atual && atual.getAttribute('data-faixa') === 'destaque';
    if (inicioNovo) inicioNovo.setAttribute('aria-pressed', String(!!destaqueToca));
    faixas.forEach(function (f) {
      var ativo = f === atual && toca;
      f.classList.toggle('faixa--tocando', ativo);
      var b = $('.faixa-play', f);
      b.classList.toggle('tocando-agora', ativo);
      b.setAttribute('aria-label', b.getAttribute(ativo ? 'data-rotulo-pausar' : 'data-rotulo-tocar'));
    });
  }

  function pintaPosicao(f, t, d) {
    var r = $('.faixa-pos', f);
    if (!r) return;
    var max = d || parseFloat(r.max) || 1;
    if (d && Math.abs(parseFloat(r.max) - d) > 0.5) r.max = d;
    r.value = t;
    r.style.setProperty('--pct', Math.min(100, (t / max) * 100) + '%');
    r.setAttribute('aria-valuetext', mmss(t) + ' / ' + mmss(max));
    var ag = $('.faixa-agora', f);
    if (ag) ag.textContent = mmss(t);
  }

  function preparaAnalisador() {
    if (ctx || reduz()) return;
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    try {
      ctx = new AC();
      var fonte = ctx.createMediaElementSource(audio);
      analisador = ctx.createAnalyser();
      analisador.fftSize = 1024;
      analisador.smoothingTimeConstant = 0.6;
      fonte.connect(analisador);
      analisador.connect(ctx.destination);
      dadosFreq = new Uint8Array(analisador.frequencyBinCount);
    } catch (e) { ctx = null; analisador = null; }
  }

  // Graves (até ~130 Hz) viram --pulso, de 0 a 1: o logo da primeira tela respira com o bumbo.
  function ciclo() {
    if (!rodando || !analisador) return;
    analisador.getByteFrequencyData(dadosFreq);
    var s = 0;
    for (var i = 1; i < 7; i++) s += dadosFreq[i];
    var v = Math.max(0, (s / 6 - 150) / 105);
    suave += (v - suave) * (v > suave ? 0.6 : 0.12);
    raiz.style.setProperty('--pulso', suave.toFixed(3));
    requestAnimationFrame(ciclo);
  }

  function tocar(f, desde) {
    if (atual !== f) {
      if (atual) atual.classList.remove('carregando');
      atual = f;
      audio.src = f.getAttribute('data-src');
      if (desde) audio.currentTime = desde;
    } else if (typeof desde === 'number') {
      audio.currentTime = desde;
    }
    preparaAnalisador();
    if (ctx && ctx.state === 'suspended') ctx.resume();
    $$('.player-palco video').forEach(function (v) { v.pause(); });
    var p = audio.play();
    if (p && p.catch) p.catch(function () { estadoSom(); });
  }

  faixas.forEach(function (f) {
    $('.faixa-play', f).addEventListener('click', function () {
      if (atual === f && !audio.paused) audio.pause();
      else tocar(f);
    });
    var r = $('.faixa-pos', f);
    r.addEventListener('input', function () {
      var t = parseFloat(r.value);
      pintaPosicao(f, t, atual === f ? audio.duration : 0);
      if (atual === f) audio.currentTime = t;
    });
    r.addEventListener('change', function () {
      if (atual !== f) tocar(f, parseFloat(r.value));
    });
  });

  var faixaDestaque = $('.faixa[data-faixa="destaque"]');
  function alternaDestaque() {
    if (!audio.paused && !audio.ended) audio.pause();
    else tocar(atual && atual !== faixaDestaque && audio.currentTime > 0 && !audio.ended ? atual : faixaDestaque);
  }
  botaoSom.addEventListener('click', alternaDestaque);
  if (inicioNovo) inicioNovo.addEventListener('click', function () {
    if (atual === faixaDestaque && !audio.paused) audio.pause();
    else tocar(faixaDestaque);
  });

  audio.addEventListener('play', function () { estadoSom(); });
  audio.addEventListener('playing', function () {
    if (atual) atual.classList.remove('carregando');
    estadoSom();
    if (analisador && !rodando) { rodando = true; requestAnimationFrame(ciclo); }
  });
  audio.addEventListener('waiting', function () { if (atual) atual.classList.add('carregando'); });
  audio.addEventListener('pause', function () {
    rodando = false;
    suave = 0;
    raiz.style.setProperty('--pulso', '0');
    estadoSom();
  });
  audio.addEventListener('timeupdate', function () { if (atual) pintaPosicao(atual, audio.currentTime, audio.duration); });
  audio.addEventListener('ended', function () {
    if (atual) pintaPosicao(atual, 0, audio.duration);
    estadoSom();
  });
  audio.addEventListener('error', function () {
    if (!atual) return;
    atual.classList.remove('carregando');
    var aviso = $('.faixa-erro', atual);
    if (!aviso) {
      aviso = document.createElement('p');
      aviso.className = 'nota faixa-erro';
      aviso.setAttribute('role', 'status');
      aviso.textContent = raiz.lang === 'en' ? "The audio couldn't be loaded." : 'Não deu para carregar o áudio.';
      $('.faixa-info', atual).appendChild(aviso);
    }
    estadoSom();
  });

  /* ---------- Player dos aftermovies ---------- */
  var player = $('#player');
  var palco = $('.player-palco', player);
  var nota = $('.player-nota', player);
  var origem = null;
  function fechaPlayer() {
    if (player.open) player.close();
  }
  player.addEventListener('close', function () {
    palco.innerHTML = '';
    nota.textContent = '';
    if (origem) origem.focus();
  });
  $('.player-fechar', player).addEventListener('click', fechaPlayer);
  player.addEventListener('click', function (e) { if (e.target === player) fechaPlayer(); });

  $$('[data-filme]').forEach(function (b) {
    b.addEventListener('click', function () {
      origem = b;
      var src = b.getAttribute('data-filme-src');
      var yt = b.getAttribute('data-youtube');
      var titulo = b.getAttribute('data-titulo');
      $('#player-t').textContent = 'Aftermovie · ' + titulo;
      palco.className = 'player-palco player-palco--' + b.getAttribute('data-formato');
      palco.innerHTML = '';
      nota.textContent = '';
      if (!audio.paused) audio.pause();
      if (src) {
        var v = document.createElement('video');
        v.controls = true;
        v.playsInline = true;
        v.preload = 'metadata';
        v.poster = b.getAttribute('data-filme-capa');
        v.src = src;
        v.setAttribute('aria-label', 'Aftermovie · ' + titulo);
        palco.appendChild(v);
        player.showModal();
        var p = v.play();
        if (p && p.catch) p.catch(function () { /* o visitante aperta o play */ });
      } else if (yt) {
        var f = document.createElement('iframe');
        f.src = 'https://www.youtube-nocookie.com/embed/' + encodeURIComponent(yt) + '?autoplay=1&rel=0&playsinline=1';
        f.title = 'Aftermovie · ' + titulo + ' · YouTube';
        f.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
        f.allowFullscreen = true;
        f.referrerPolicy = 'strict-origin-when-cross-origin';
        palco.appendChild(f);
        nota.textContent = nota.getAttribute('data-youtube-nota');
        var a = document.createElement('a');
        a.href = 'https://www.youtube.com/watch?v=' + encodeURIComponent(yt);
        a.target = '_blank';
        a.rel = 'noopener';
        a.textContent = nota.getAttribute('data-youtube-abrir');
        nota.appendChild(a);
        player.showModal();
      }
    });
  });

  /* ---------- Spotify só carrega quando pedem ---------- */
  $$('[data-carregar-spotify]').forEach(function (b) {
    b.addEventListener('click', function () {
      var bloco = b.closest('[data-spotify]');
      var id = bloco.getAttribute('data-spotify');
      var f = document.createElement('iframe');
      f.src = 'https://open.spotify.com/embed/track/' + encodeURIComponent(id) + '?utm_source=generator&theme=0';
      f.title = 'Spotify · ' + $('.spotify-faixa', bloco).textContent.trim();
      f.allow = 'autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture';
      f.loading = 'lazy';
      if (!audio.paused) audio.pause();
      b.replaceWith(f);
      f.focus();
    });
  });

  /* ---------- Copiar bio ---------- */
  function copia(texto) {
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(texto);
    return new Promise(function (ok, falha) {
      var t = document.createElement('textarea');
      t.value = texto;
      t.setAttribute('readonly', '');
      t.style.position = 'fixed';
      t.style.opacity = '0';
      corpo.appendChild(t);
      t.select();
      try { document.execCommand('copy') ? ok() : falha(); } catch (e) { falha(e); }
      t.remove();
    });
  }
  $$('[data-copiar]').forEach(function (b) {
    var original = b.textContent;
    b.addEventListener('click', function () {
      var alvo = $(b.getAttribute('data-copiar'));
      var texto = $$('p', alvo).map(function (p) { return p.textContent; }).join('\n\n');
      copia(texto).then(function () {
        b.textContent = b.getAttribute('data-ok');
        b.classList.add('ok');
        setTimeout(function () { b.textContent = original; b.classList.remove('ok'); }, 2200);
      }, function () {
        var r = document.createRange();
        r.selectNodeContents(alvo);
        var s = getSelection();
        s.removeAllRanges();
        s.addRange(r);
      });
    });
  });

  /* ---------- Pedido de booking: monta o texto e abre o canal confirmado ---------- */
  var pedido = $('.pedido');
  if (pedido) {
    pedido.addEventListener('submit', function (e) {
      e.preventDefault();
      var linhas = [pedido.getAttribute('data-ola')];
      $$('.campo', pedido).forEach(function (c) {
        var campo = $('input, textarea', c);
        var v = campo.value.trim();
        if (!v) return;
        if (campo.type === 'date') {
          var d = new Date(v + 'T12:00:00');
          if (!isNaN(d)) v = d.toLocaleDateString(raiz.lang, { day: '2-digit', month: 'long', year: 'numeric' });
        }
        linhas.push($('span', c).textContent + ': ' + v);
      });
      var texto = linhas.join('\n');
      var canal = pedido.getAttribute('data-canal');
      var status = $('.pedido-status', pedido);
      var pre = $('.pedido-texto', pedido);
      pre.textContent = texto;
      pre.hidden = false;
      var abre = function () {
        if (/^mailto:/.test(canal)) {
          location.href = canal + '?subject=' + encodeURIComponent('Booking · ARCANNE') + '&body=' + encodeURIComponent(texto);
        } else if (/^https:\/\/wa\.me\//.test(canal)) {
          window.open(canal + '?text=' + encodeURIComponent(texto), '_blank', 'noopener');
        } else if (canal) {
          window.open(canal, '_blank', 'noopener');
        }
      };
      // A conversa abre primeiro, ainda dentro do clique (depois disso o navegador trataria como
      // pop-up e bloquearia); a cópia sai em seguida, no mesmo instante. Se a cópia falhar,
      // o texto fica visível embaixo do botão.
      abre();
      var copiando = copia(texto);
      copiando.then(function () {
        status.textContent = pedido.getAttribute('data-ok');
      }, function () {
        status.textContent = pedido.getAttribute('data-ok-sem-copia');
      });
    });
  }

  /* ---------- Títulos que esticam ao entrar na tela ---------- */
  var esticaveis = $$('[data-esticar]');
  if (!('IntersectionObserver' in window) || reduz()) {
    esticaveis.forEach(function (el) { el.classList.add('esticado'); });
  } else {
    var ioEstica = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('esticado'); ioEstica.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -12% 0px' });
    esticaveis.forEach(function (el) { ioEstica.observe(el); });
  }

  /* ---------- Profundidade leve ao rolar (só desktop, sem movimento reduzido) ---------- */
  var camadas = $$('[data-prof]');
  var anel = $('.artista-anel');
  var fundosTexto = $$('.capitulo-fundo');
  var pedidoQuadro = false;
  function profundidade() {
    pedidoQuadro = false;
    marcaTopo();
    if (reduz() || mqCelular.matches) return;
    var h = innerHeight;
    camadas.forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (r.bottom < -200 || r.top > h + 200) return;
      var meio = r.top + r.height / 2 - h / 2;
      el.style.setProperty('--desloca', (meio * parseFloat(el.getAttribute('data-prof'))).toFixed(1) + 'px');
    });
    fundosTexto.forEach(function (el) {
      var r = el.parentNode.getBoundingClientRect();
      if (r.bottom < 0 || r.top > h) return;
      el.style.setProperty('--desloca', ((r.top + r.height / 2 - h / 2) * -0.18).toFixed(1) + 'px');
    });
    if (anel) {
      var ra = anel.parentNode.getBoundingClientRect();
      if (ra.bottom > 0 && ra.top < h) anel.style.setProperty('--giro', (ra.top * -0.03).toFixed(2) + 'deg');
    }
  }
  addEventListener('scroll', function () {
    if (!pedidoQuadro) { pedidoQuadro = true; requestAnimationFrame(profundidade); }
  }, { passive: true });
  addEventListener('resize', function () { requestAnimationFrame(profundidade); }, { passive: true });
  addEventListener('load', function () { requestAnimationFrame(profundidade); });
})();
