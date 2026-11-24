/* Oak · comportamento da página.
   - Idioma: português no HTML (data-i), inglês no objeto EN abaixo, outros pelo Google Tradutor.
   - Abertura em vídeo (uma vez por sessão), vídeos que só carregam perto da tela.
   - Som: os trechos do press kit tocam num <audio>; um AnalyserNode lê os graves e escreve
     --pulso (0 a 1) no <html>. Sem som, um pulso de 138 BPM faz o mesmo papel.
   - Noites: a rolagem vertical anda o corredor de festas na horizontal. */
(function () {
  'use strict';

  var EN = {
    _title: 'Oak · High-class psychedelia',
    _desc: 'Oak is the project of João Victor Carvalho: dark progressive, techno, psytechno and jazz in a cinematic, psychedelic atmosphere. Music, nights, aftermovies, press kit and booking.',
    pular_conteudo: 'Skip to content',
    m_som: 'Music', m_noites: 'Nights', m_aovivo: 'Aftermovies', m_historia: 'Story', m_press: 'Press kit', m_booking: 'Booking',
    som_liga: 'Sound on', som_desliga: 'Sound off',
    outros_rotulo: 'Other languages (automatic translation)', outros_op: '🌐 +', menu: 'Menu',
    nota_trad: 'Portuguese and English were written for this site. Other languages use Google Translate.',
    in_rotulo: 'DJ and producer · since 2022', in_lema: 'High-class psychedelia', in_ouvir: 'Listen', in_booking: 'Booking', in_role: 'Scroll',
    hi_rotulo: 'The story', hi_titulo: 'The story of Oak',
    hi_1: '<span class="notranslate" translate="no">João Victor Carvalho</span> is the mind behind Oak.',
    hi_2: 'He has always been in love with the psychedelic scene, and in 2022 he started the project with a unique, original vision.',
    hi_3: 'His productions draw on dark progressive, techno, psytechno and jazz.',
    hi_4: 'Immersive, hypnotic sounds meet explosive, danceable ones. Every set tells a story, in a cinematic and psychedelic atmosphere.',
    hi_5: 'Organizer of <span class="notranslate" translate="no">Green Garden pvt</span> and <span class="notranslate" translate="no">Progstyle</span>, and partner at <span class="notranslate" translate="no">Green Garden Festival</span>.',
    so_rotulo: 'Music', so_titulo: 'This is not jazz.',
    so_intro: 'Four excerpts he picked for his press kit. Press play: the whole page follows the beat.',
    fx_1: 'Press kit excerpt · Oak’s favorite', fx_2: 'Press kit excerpt', fx_3: 'Press kit excerpt', fx_4: 'Press kit excerpt',
    sp_rotulo: 'On Spotify', sp_abre: 'Open the Spotify player', sp_nota: 'The player belongs to Spotify and only loads when you ask for it.',
    no_rotulo: 'Nights', no_titulo: 'Where Oak has played',
    av_rotulo: 'Aftermovies', av_titulo: 'Watch up close', av_intro: 'Tap a film to watch it in full, with sound.',
    av_principal: 'Main aftermovie', av_ver: 'Watch with sound', av_outro: 'Another angle', av_fechar: 'Close',
    re_titulo: 'Portraits',
    re_a1: 'Oak in the booth, lit by psychedelic projections', re_a2: 'Oak in a black shirt on a road at night',
    re_a3: 'Oak playing with headphones and round sunglasses', re_a4: 'View from the booth to the dance floor of an open-air festival',
    re_a5: 'Oak among pine trees, wearing the logo T-shirt', re_a6: 'Oak in a top hat, smiling',
    bk_rotulo: 'Booking', bk_titulo: 'Bring Oak to your night',
    bk_intro: 'Fill this in and the request goes straight to Oak’s WhatsApp, ready to send. Festival, club, private or open air.',
    f_nome: 'Your name', f_contato: 'Contact (WhatsApp or email)', f_data: 'Date', f_cidade: 'City',
    f_local: 'Venue / event type', f_local_ph: 'Festival, club, private, open air…', f_duracao: 'Set length',
    f_dur_0: 'To be discussed', f_dur_1: '1 hour', f_dur_2: '1h30', f_dur_3: '2 hours', f_dur_4: 'More than 2 hours',
    f_orcamento: 'Budget', f_orc_ph: 'Optional', f_enviar: 'Send via WhatsApp',
    pr_rotulo: 'Press kit', pr_titulo: 'For promoters and press',
    pr_zip: 'Full press kit', pr_zip_d: 'Bio, five high-res photos and the Oak and Bantuh Records logos (ZIP)',
    pr_logo_b: 'White logo (PNG)', pr_logo_p: 'Black logo (PNG)',
    ro_selo: 'Label', ro_topo: 'Back to top ↑',
  };
  var PT_EXTRA = { som_liga: 'Ligar som', som_desliga: 'Desligar som' };

  var CHAVE = 'oak:idioma';
  var BPM = 138;
  var guarda = function (k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } };
  var reduz = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var celular = window.matchMedia('(max-width: 820px)').matches;
  var retrato = window.innerHeight > window.innerWidth;
  var raiz = document.documentElement;
  var PT = {};
  var idioma = 'pt';
  var traduzindo = false;

  /* ---------- idioma ---------- */
  function googAtual() { var m = document.cookie.match(/googtrans=\/pt\/([\w-]+)/); return m ? m[1] : ''; }
  function googCookie(lang) {
    var h = location.hostname, passado = ';expires=Thu, 01 Jan 1970 00:00:00 GMT';
    var dom = h.indexOf('.') > 0 ? ';domain=' + h : '';
    if (!lang) {
      document.cookie = 'googtrans=;path=/' + passado;
      if (dom) document.cookie = 'googtrans=;path=/' + dom + passado;
    } else {
      document.cookie = 'googtrans=/pt/' + lang + ';path=/';
      if (dom) document.cookie = 'googtrans=/pt/' + lang + ';path=/' + dom;
    }
  }

  function aplica(lang) {
    idioma = lang;
    var dic = lang === 'en' ? EN : null;
    document.querySelectorAll('[data-i]').forEach(function (el) {
      var k = el.getAttribute('data-i');
      if (!(k in PT)) PT[k] = el.innerHTML;
      el.innerHTML = dic && dic[k] != null ? dic[k] : PT[k];
    });
    document.querySelectorAll('[data-i-ph]').forEach(function (el) {
      var k = el.getAttribute('data-i-ph'), kp = 'ph:' + k;
      if (!(kp in PT)) PT[kp] = el.placeholder;
      el.placeholder = dic && dic[k] != null ? dic[k] : PT[kp];
    });
    document.querySelectorAll('[data-i-alt]').forEach(function (el) {
      var k = el.getAttribute('data-i-alt'), ka = 'alt:' + k;
      if (!(ka in PT)) PT[ka] = el.alt;
      el.alt = dic && dic[k] != null ? dic[k] : PT[ka];
    });
    raiz.lang = lang === 'en' ? 'en' : 'pt-BR';
    if (!PT._title) { PT._title = document.title; PT._desc = document.querySelector('meta[name=description]').content; }
    document.title = lang === 'en' ? EN._title : PT._title;
    document.querySelector('meta[name=description]').content = lang === 'en' ? EN._desc : PT._desc;
    document.querySelectorAll('.idioma [data-lang]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-lang') === lang)); });
    rotuloSom();
    parteFrases();
  }
  function texto(k) { return (idioma === 'en' ? EN : PT_EXTRA)[k]; }

  function escolhe(lang) {
    guarda(CHAVE, lang);
    if (googAtual()) { googCookie(''); location.reload(); return; }
    aplica(lang);
  }

  function carregaGoogle(lang) {
    traduzindo = true;
    var caixa = document.createElement('div'); caixa.id = 'gt-caixa'; caixa.hidden = true; document.body.appendChild(caixa);
    window.oakGoogleInit = function () {
      new window.google.translate.TranslateElement({ pageLanguage: 'pt', autoDisplay: false }, 'gt-caixa');
    };
    var s = document.createElement('script');
    s.src = 'https://translate.google.com/translate_a/element.js?cb=oakGoogleInit';
    document.body.appendChild(s);
    var sel = document.getElementById('outros'); if (sel) sel.value = lang;
    document.querySelectorAll('.idioma [data-lang]').forEach(function (b) { b.setAttribute('aria-pressed', 'false'); });
  }

  function iniciaIdioma() {
    var q = (location.search.match(/[?&]lang=([\w-]+)/) || [])[1];
    var goog = googAtual();
    var salvo = guarda(CHAVE);
    if (q === 'pt' || q === 'en') { guarda(CHAVE, q); if (goog) { googCookie(''); goog = ''; } }
    if (goog) { traduzindo = true; aplica('pt'); carregaGoogle(goog); }
    else {
      var lang = q === 'pt' || q === 'en' ? q : (salvo === 'pt' || salvo === 'en' ? salvo : ((navigator.language || 'pt').toLowerCase().indexOf('pt') === 0 ? 'pt' : 'en'));
      aplica(lang);
    }
    document.querySelectorAll('.idioma [data-lang]').forEach(function (b) {
      b.addEventListener('click', function () { escolhe(b.getAttribute('data-lang')); });
    });
    var sel = document.getElementById('outros');
    if (sel) sel.addEventListener('change', function () {
      if (!sel.value) return;
      guarda(CHAVE, sel.value);
      googCookie(sel.value);
      var limpo = location.href.replace(/([?&])lang=[\w-]+&?/, '$1').replace(/[?&](#|$)/, '$1');
      if (limpo !== location.href) location.replace(limpo); else location.reload();
    });
  }

  /* ---------- frases que acendem palavra por palavra ---------- */
  var frases = [];
  function parteFrases() {
    frases = [];
    if (reduz || traduzindo) return; // a tradução automática traduz melhor a frase inteira
    document.querySelectorAll('[data-revela]').forEach(function (el) {
      var andar = function (no) {
        Array.prototype.slice.call(no.childNodes).forEach(function (n) {
          if (n.nodeType === 3) {
            var frag = document.createDocumentFragment();
            n.textContent.split(/(\s+)/).forEach(function (p) {
              if (!p) return;
              if (/^\s+$/.test(p)) { frag.appendChild(document.createTextNode(p)); return; }
              var s = document.createElement('span'); s.className = 'p'; s.textContent = p; frag.appendChild(s);
            });
            no.replaceChild(frag, n);
          } else if (n.nodeType === 1 && !n.classList.contains('p')) andar(n);
        });
      };
      andar(el);
      frases.push({ el: el, pal: el.querySelectorAll('.p') });
    });
  }

  /* ---------- vídeos ---------- */
  function fonte(v) {
    var m = (celular || retrato) && v.dataset.srcM;
    return m ? v.dataset.srcM : v.dataset.src;
  }
  function toca(v) {
    if (reduz) return;
    if (!v.getAttribute('src')) v.src = fonte(v);
    var p = v.play(); if (p && p.catch) p.catch(function () {});
  }
  var observaVideo;
  function iniciaVideos() {
    var vids = document.querySelectorAll('video[data-src]:not(.abertura-video)');
    vids.forEach(function (v) { if ((celular || retrato) && v.dataset.posterM) v.poster = v.dataset.posterM; });
    if (!('IntersectionObserver' in window)) { vids.forEach(toca); return; }
    observaVideo = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        var v = e.target;
        if (v.closest('.noite')) return; // o corredor decide quem toca
        if (e.isIntersecting) toca(v); else if (!v.paused) v.pause();
      });
    }, { rootMargin: '200px 0px' });
    vids.forEach(function (v) { observaVideo.observe(v); });
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) vids.forEach(function (v) { if (!v.paused) v.pause(); });
    });
  }

  /* ---------- abertura ---------- */
  // Toca sempre, sem botões, muda (para o navegador deixar tocar sozinha), e no fim entra no
  // site. Se o vídeo der erro, for bloqueado ou não começar em 4 s, entra no site do mesmo
  // jeito; e nunca passa de 9 s (o vídeo tem 5,4 s), para ninguém ficar preso.
  // Fica de fora só com prefers-reduced-motion e com ?semabertura no endereço (testes).
  function iniciaAbertura() {
    var ab = document.getElementById('abertura');
    var pular = /[?&]semabertura/.test(location.search);
    if (!ab || reduz || pular) return;
    var v = ab.querySelector('video');
    ab.hidden = false;
    raiz.classList.add('com-abertura');
    var fim = false, comecou = false;
    function fecha() {
      if (fim) return; fim = true;
      ab.classList.add('sai');
      raiz.classList.remove('com-abertura');
      setTimeout(function () { ab.hidden = true; v.removeAttribute('src'); v.load(); }, 1000);
    }
    v.src = retrato ? v.dataset.srcM : v.dataset.src;
    v.addEventListener('playing', function () { comecou = true; });
    v.addEventListener('ended', fecha);
    v.addEventListener('error', fecha);
    var p = v.play(); if (p && p.catch) p.catch(fecha);
    setTimeout(function () { if (!comecou) fecha(); }, 4000);
    setTimeout(fecha, 9000);
  }

  /* ---------- som ---------- */
  var audio = new Audio();
  audio.preload = 'none';
  var ctx = null, analisador = null, dados = null;
  var faixaAtual = null;
  var botoes = [];

  function preparaAnalise() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    try {
      ctx = new AC();
      var fonteAudio = ctx.createMediaElementSource(audio);
      analisador = ctx.createAnalyser();
      analisador.fftSize = 512;
      analisador.smoothingTimeConstant = 0.3;
      dados = new Uint8Array(analisador.frequencyBinCount);
      fonteAudio.connect(analisador);
      analisador.connect(ctx.destination);
    } catch (e) { ctx = null; analisador = null; }
  }

  function tocaFaixa(bt) {
    if (faixaAtual === bt && !audio.paused) { audio.pause(); return; }
    if (faixaAtual !== bt) {
      faixaAtual = bt;
      audio.src = bt.getAttribute('data-audio');
    }
    preparaAnalise();
    var p = audio.play(); if (p && p.catch) p.catch(function () {});
  }
  function ligaSom() { tocaFaixa(faixaAtual || botoes[0]); }
  function rotuloSom() {
    var b = document.getElementById('som-botao'); if (!b) return;
    var on = !audio.paused;
    b.setAttribute('aria-pressed', String(on));
    var r = b.querySelector('.som-rotulo'); if (r) r.textContent = texto(on ? 'som_desliga' : 'som_liga');
    botoes.forEach(function (x) { x.setAttribute('aria-pressed', String(on && x === faixaAtual)); });
  }
  function iniciaSom() {
    botoes = Array.prototype.slice.call(document.querySelectorAll('.faixa'));
    botoes.forEach(function (bt) { bt.setAttribute('aria-pressed', 'false'); bt.addEventListener('click', function () { tocaFaixa(bt); }); });
    document.getElementById('som-botao').addEventListener('click', function () { if (!audio.paused) audio.pause(); else ligaSom(); });
    ['play', 'pause', 'ended'].forEach(function (ev) { audio.addEventListener(ev, rotuloSom); });
    audio.addEventListener('ended', function () {
      var i = botoes.indexOf(faixaAtual);
      tocaFaixa(botoes[(i + 1) % botoes.length]);
    });
    audio.addEventListener('timeupdate', function () {
      if (!faixaAtual || !audio.duration) return;
      faixaAtual.querySelector('.faixa-barra i').style.width = (audio.currentTime / audio.duration * 100).toFixed(1) + '%';
    });
    document.addEventListener('visibilitychange', function () { if (document.hidden && !audio.paused) audio.pause(); });
  }

  /* ---------- Spotify (só quando pedem) ---------- */
  function iniciaSpotify() {
    var bt = document.getElementById('spotify-abre');
    if (!bt) return;
    bt.addEventListener('click', function () {
      var caixa = document.getElementById('spotify-player');
      var f = document.createElement('iframe');
      f.src = 'https://open.spotify.com/embed/artist/17uBCYbpAJ6UASKXs4gxyP?utm_source=generator&theme=0';
      f.title = 'Oak no Spotify';
      f.loading = 'lazy';
      f.allow = 'autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture';
      caixa.innerHTML = ''; caixa.appendChild(f); caixa.classList.add('aberto');
      if (!audio.paused) audio.pause();
    });
  }

  /* ---------- aftermovies ---------- */
  function iniciaCinema() {
    var dlg = document.getElementById('cinema');
    if (!dlg || typeof dlg.showModal !== 'function') return;
    var v = dlg.querySelector('video');
    document.querySelectorAll('.filme').forEach(function (bt) {
      bt.addEventListener('click', function () {
        if (!audio.paused) audio.pause();
        v.poster = bt.getAttribute('data-poster');
        v.src = bt.getAttribute('data-filme');
        dlg.showModal();
        var p = v.play(); if (p && p.catch) p.catch(function () {});
      });
    });
    function fecha() { v.pause(); v.removeAttribute('src'); v.load(); if (dlg.open) dlg.close(); }
    document.getElementById('cinema-fecha').addEventListener('click', fecha);
    dlg.addEventListener('cancel', function () { v.pause(); v.removeAttribute('src'); v.load(); });
    dlg.addEventListener('click', function (e) { if (e.target === dlg) fecha(); });
  }

  /* ---------- topo, menu, luz ---------- */
  function iniciaTopo() {
    var topo = document.getElementById('topo');
    var marca = function () { topo.classList.toggle('rolou', scrollY > 40); };
    addEventListener('scroll', marca, { passive: true }); marca();
    var bt = document.getElementById('menu-abre'), menu = document.getElementById('menu');
    var muda = function (abre) { bt.setAttribute('aria-expanded', String(abre)); menu.classList.toggle('aberto', abre); raiz.style.overflow = abre ? 'hidden' : ''; };
    bt.addEventListener('click', function () { muda(bt.getAttribute('aria-expanded') !== 'true'); });
    menu.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', function () { muda(false); }); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && menu.classList.contains('aberto')) muda(false); });
    var inicio = document.getElementById('inicio');
    if (!reduz && window.matchMedia('(pointer: fine)').matches) {
      inicio.addEventListener('pointermove', function (e) {
        var r = inicio.getBoundingClientRect();
        raiz.style.setProperty('--luz-x', ((e.clientX - r.left) / r.width * 100).toFixed(1) + '%');
        raiz.style.setProperty('--luz-y', ((e.clientY - r.top) / r.height * 100).toFixed(1) + '%');
      });
    }
    if (reduz || !('IntersectionObserver' in window)) return;
    var alvos = document.querySelectorAll('.secao-cab, .faixas, .spotify, .filmes li, .mosaico figure, .bk, .booking-texto, .press-grade, .rodape-in');
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('visto'); io.unobserve(e.target); } });
    }, { threshold: 0.12 });
    alvos.forEach(function (a) { a.classList.add('revela'); io.observe(a); });
  }

  /* ---------- imagens de celular ---------- */
  function iniciaImagens() {
    if (!celular) return;
    document.querySelectorAll('img[data-src-m]').forEach(function (im) { im.src = im.getAttribute('data-src-m'); });
  }

  /* ---------- quadro a quadro: pulso, frases, corredor, parallax ---------- */
  function iniciaQuadro() {
    var noites = document.getElementById('noites');
    var trilho = document.getElementById('noites-trilho');
    var cards = Array.prototype.slice.call(trilho.children);
    var contador = document.getElementById('noite-atual');
    var foto = document.querySelector('.historia-foto');
    var mosaico = Array.prototype.slice.call(document.querySelectorAll('.mosaico img'));
    var hero = document.querySelector('.inicio-fundo');
    var ativa = -1;
    var t0 = performance.now();
    var pulsoAntes = -1;

    // Com som: o grave de música eletrônica fica alto o tempo todo, então o pulso mede o quanto
    // ele sobe acima da própria média (o bumbo) e cai devagar até a próxima batida.
    var media = 0, ultimo = 0;
    function pulso(agora) {
      if (analisador && !audio.paused) {
        analisador.getByteFrequencyData(dados);
        var s = 0; for (var i = 1; i < 4; i++) s += dados[i];
        var g = s / 3;
        media += (g - media) * 0.05;
        var alvo = Math.max(0, Math.min(1, (g - media) / 18));
        ultimo = Math.max(alvo, ultimo * 0.86);
        return ultimo;
      }
      if (reduz) return 0;
      // Sem som: 138 BPM, no tempo do vídeo de fundo quando ele está tocando.
      var seg = hero && !hero.paused && hero.currentTime > 0 ? hero.currentTime : (agora - t0) / 1000;
      var batida = 60 / BPM;
      return Math.exp(-((seg % batida) / batida) * 5) * 0.8;
    }

    function corredor(vh) {
      if (reduz) return;
      var r = noites.getBoundingClientRect();
      var curso = r.height - vh;
      var p = curso > 0 ? Math.max(0, Math.min(1, -r.top / curso)) : 0;
      var falta = trilho.scrollWidth - trilho.parentElement.clientWidth;
      trilho.style.setProperty('--trilho', (-falta * p).toFixed(1) + 'px');
      var visivel = r.top < vh && r.bottom > 0;
      var meio = trilho.parentElement.clientWidth / 2, melhor = 0, dist = 1e9;
      cards.forEach(function (c, i) {
        var cr = c.getBoundingClientRect(); var d = Math.abs(cr.left + cr.width / 2 - meio);
        if (d < dist) { dist = d; melhor = i; }
      });
      if (!visivel) melhor = -1;
      if (melhor !== ativa) {
        ativa = melhor;
        cards.forEach(function (c, i) {
          var v = c.querySelector('video');
          var perto = melhor >= 0 && Math.abs(i - melhor) <= 1;
          c.classList.toggle('ativa', i === melhor);
          if (perto) toca(v); else if (!v.paused) v.pause();
        });
        if (melhor >= 0) contador.textContent = ('0' + (melhor + 1)).slice(-2);
      }
    }

    function frasesAcende(vh) {
      frases.forEach(function (f) {
        var r = f.el.getBoundingClientRect();
        if (r.bottom < -vh || r.top > vh * 1.5) return;
        var p = (vh * 0.88 - r.top) / (r.height + vh * 0.3);
        var n = Math.round(Math.max(0, Math.min(1, p)) * f.pal.length);
        for (var i = 0; i < f.pal.length; i++) f.pal[i].classList.toggle('acesa', i < n);
      });
    }

    // O que depende da rolagem roda no evento de rolagem e também a cada quadro.
    function rolagem() {
      var vh = window.innerHeight;
      frasesAcende(vh);
      corredor(vh);
      if (!reduz && foto) {
        var fr = foto.getBoundingClientRect();
        foto.style.setProperty('--rolagem-foto', Math.max(0, Math.min(1, 1 - fr.top / vh)).toFixed(3));
      }
      if (!reduz) mosaico.forEach(function (im) {
        var r = im.parentElement.getBoundingClientRect();
        if (r.bottom < 0 || r.top > vh) return;
        im.style.setProperty('--desloca', (((r.top + r.height / 2) - vh / 2) * -0.06).toFixed(1));
      });
    }

    function quadro(agora) {
      var k = pulso(agora);
      if (Math.abs(k - pulsoAntes) > 0.01) { raiz.style.setProperty('--pulso', k.toFixed(3)); pulsoAntes = k; }
      rolagem();
      requestAnimationFrame(quadro);
    }
    addEventListener('scroll', rolagem, { passive: true });
    addEventListener('resize', rolagem);
    rolagem();
    requestAnimationFrame(quadro);
  }

  function inicia() {
    iniciaIdioma();
    iniciaImagens();
    iniciaSom();
    iniciaAbertura();
    iniciaVideos();
    iniciaSpotify();
    iniciaCinema();
    iniciaTopo();
    iniciaQuadro();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', inicia); else inicia();
})();
