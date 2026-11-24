/* Demo NOVA VOLTZ (artista fictício) · Amplitude Lab
   - Som: groove sintetizado na hora com Web Audio (nada de música de terceiros). Só toca quando
     alguém aperta play. Um AnalyserNode move o fundo (canvas) e a variável --pulso.
   - Pedidos, "Eu vou" e votos ficam só no localStorage deste navegador: é uma demo.
   - Booking: js/booking.js (formulário → WhatsApp). */
(function () {
  'use strict';

  var EN = {
    faixa: 'Amplitude Lab demo · fictional artist · nothing here is sent anywhere, except booking, which opens your WhatsApp',
    voltar: '← back', n_sets: 'Sets', n_agenda: 'Dates', n_pedidos: 'Requests', n_booking: 'Booking',
    hero_sub: 'From the first track until the lights come on. Hit play: the whole site reacts to the sound.',
    ouvir: 'Listen now', contratar: 'Book', num_1: 'parties played', num_2: 'countries', num_3: 'average booking reply',
    ficticio: 'Sample numbers and dates.',
    sets_t: 'Sets', sets_sub: 'On a real site, your SoundCloud, Mixcloud or YouTube sets go here. In this demo, a groove generated on the fly shows how the page reacts.',
    set_1: 'Opening the floor, round low end', set_2: 'Peak hour, claps on 2 and 4', set_3: 'Fast closing',
    agenda_t: 'Dates', agenda_sub: 'Tap "I\'m going": fans confirm and the DJ sees who is coming to each party.',
    mes_dez: 'dec', mes_jan: 'jan', vou: 'I\'m going',
    ped_t: 'Floor requests', ped_sub: 'The crowd requests and votes from their phones, even through a QR code on the screen. The DJ sees the queue live.',
    ped_musica: 'Track', ped_artista: 'Artist', ped_enviar: 'Request',
    com_t: 'Join the list', com_sub: 'Members hear about parties first, get on the guest list and receive new sets.',
    com_rot: 'WhatsApp or email', com_ph: 'WhatsApp or email', com_b: 'I\'m in',
    pk_t: 'Press kit', pk_1: 'Bio', pk_2: 'Hi-res photos', pk_4: 'Tech rider',
    bk_t: 'Booking', bk_sub: 'Fill it in and the request lands ready on WhatsApp. This demo has no number set: WhatsApp opens so you can pick the contact.',
    f_nome: 'Name', f_data: 'Date', f_cidade: 'City', f_local: 'Venue / event type', f_local_ph: 'Club, festival, wedding…',
    f_duracao: 'Set length', f_aberto: 'To be discussed', f_orc: 'Budget', f_orc_ph: 'E.g. US$ 800', f_contato: 'Contact', f_contato_ph: 'WhatsApp or email',
    f_enviar: 'Send via WhatsApp',
    rod: 'DJ website demo made by Amplitude Lab. NOVA VOLTZ is a fictional artist.', rod_l: 'I want a site like this',
    _pausar: 'Pause', _tocar: 'Play', _pk: 'In the real site, this downloads the file.', _com: 'In the real site, this joins the DJ\'s list. Nothing was saved here.',
    _ped: 'Request added to the queue.', _seeds: [['Sunrise Edit', 'Demo'], ['Bassline 04', 'Demo'], ['Late Train', 'Demo']],
  };
  var PT_X = { _pausar: 'Pausar', _tocar: 'Tocar', _pk: 'No site real, aqui baixa o arquivo.', _com: 'No site real, isso entra na lista do DJ. Nada foi salvo aqui.',
    _ped: 'Pedido entrou na fila.', _seeds: [['Sunrise Edit', 'Demo'], ['Bassline 04', 'Demo'], ['Late Train', 'Demo']] };

  var PT = {}, idioma = 'pt';
  var reduz = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var raiz = document.documentElement;
  function guarda(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }
  function X() { return idioma === 'en' ? EN : PT_X; }

  /* ---------- idioma (mesma chave da página para DJs) ---------- */
  function aplica(l) {
    idioma = l;
    document.querySelectorAll('[data-i]').forEach(function (el) {
      var k = el.getAttribute('data-i'); if (!(k in PT)) PT[k] = el.innerHTML;
      el.innerHTML = l === 'en' && EN[k] != null ? EN[k] : PT[k];
    });
    document.querySelectorAll('[data-i-ph]').forEach(function (el) {
      var k = el.getAttribute('data-i-ph'); if (!(('ph_' + k) in PT)) PT['ph_' + k] = el.placeholder;
      el.placeholder = l === 'en' && EN[k] != null ? EN[k] : PT['ph_' + k];
    });
    raiz.lang = l === 'en' ? 'en' : 'pt-BR';
    document.querySelectorAll('.lang [data-lang]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.lang === l)); });
    desenhaFila();
    rotuloDock();
  }
  function iniciaIdioma() {
    var q = (location.search.match(/[?&]lang=(pt|en)\b/) || [])[1];
    var s = guarda('djs:idioma');
    aplica(q || (s === 'pt' || s === 'en' ? s : ((navigator.language || 'pt').toLowerCase().indexOf('pt') === 0 ? 'pt' : 'en')));
    document.querySelectorAll('.lang [data-lang]').forEach(function (b) {
      b.addEventListener('click', function () { guarda('djs:idioma', b.dataset.lang); aplica(b.dataset.lang); });
    });
  }

  /* ---------- aviso ---------- */
  var tt;
  function aviso(msg) {
    var t = document.getElementById('toast'); t.textContent = msg; t.hidden = false;
    clearTimeout(tt); tt = setTimeout(function () { t.hidden = true; }, 2800);
  }

  /* ---------- som ---------- */
  var SETS = [
    { nome: 'Warm-up', bpm: 118, palma: false, baixo: [0, 0, 7, 0, 0, 0, 5, 0] },
    { nome: 'Peak time', bpm: 126, palma: true, baixo: [0, 0, 0, 12, 0, 0, 10, 0] },
    { nome: 'Closing', bpm: 132, palma: true, baixo: [0, 7, 0, 7, 0, 5, 0, 3] },
  ];
  var ctx = null, mestre, analisador, ruido, atual = -1, tocando = false, prox = 0, passo = 0, timer = null, inicioSet = 0;

  function montaAudio() {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    mestre = ctx.createGain(); mestre.gain.value = 0.55;
    analisador = ctx.createAnalyser(); analisador.fftSize = 256; analisador.smoothingTimeConstant = 0.75;
    mestre.connect(analisador); analisador.connect(ctx.destination);
    ruido = ctx.createBuffer(1, ctx.sampleRate * 0.5, ctx.sampleRate);
    var d = ruido.getChannelData(0); for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  function bumbo(t) {
    var o = ctx.createOscillator(), g = ctx.createGain();
    o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(45, t + 0.12);
    g.gain.setValueAtTime(1, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
    o.connect(g); g.connect(mestre); o.start(t); o.stop(t + 0.36);
  }
  function chiado(t, dur, freq, vol) {
    var s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = ruido; f.type = 'highpass'; f.frequency.value = freq;
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    s.connect(f); f.connect(g); g.connect(mestre); s.start(t); s.stop(t + dur + 0.01);
  }
  function grave(t, semitom, dur) {
    var o = ctx.createOscillator(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    o.type = 'sawtooth'; o.frequency.value = 55 * Math.pow(2, semitom / 12);
    f.type = 'lowpass'; f.frequency.setValueAtTime(900, t); f.frequency.exponentialRampToValueAtTime(160, t + dur);
    g.gain.setValueAtTime(0.28, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(f); f.connect(g); g.connect(mestre); o.start(t); o.stop(t + dur + 0.02);
  }
  function agenda() {
    var s = SETS[atual], seg = 60 / s.bpm / 4; // semicolcheia
    while (prox < ctx.currentTime + 0.12) {
      var p = passo % 16;
      if (p % 4 === 0) bumbo(prox);
      if (p % 4 === 2) chiado(prox, 0.05, 7000, 0.35);
      if (p % 2 === 1) chiado(prox, 0.02, 9000, 0.12);
      if (s.palma && (p === 4 || p === 12)) chiado(prox, 0.12, 1500, 0.5);
      var nota = s.baixo[(p >> 1) % 8];
      if (p % 2 === 0 && p % 4 !== 0) grave(prox, nota, seg * 1.8);
      prox += seg; passo++;
    }
  }
  function toca(i) {
    if (!ctx) montaAudio();
    if (ctx.state === 'suspended') ctx.resume();
    if (tocando && atual === i) { para(); return; }
    atual = i; tocando = true; passo = 0; prox = ctx.currentTime + 0.05; inicioSet = ctx.currentTime;
    clearInterval(timer); timer = setInterval(agenda, 25); agenda();
    var dock = document.getElementById('dock'); dock.hidden = false;
    document.getElementById('dock-nome').textContent = SETS[i].nome;
    document.getElementById('dock-bpm').textContent = SETS[i].bpm + ' BPM';
    marcaSets(); rotuloDock();
  }
  function para() { tocando = false; clearInterval(timer); marcaSets(); rotuloDock(); }
  function marcaSets() {
    document.querySelectorAll('.set').forEach(function (b) { b.setAttribute('aria-pressed', String(tocando && +b.dataset.tocar === atual)); });
    document.querySelectorAll('.hero-acoes [data-tocar] .ic').forEach(function (ic) { ic.textContent = tocando ? '❚❚' : '▶'; });
  }
  function rotuloDock() {
    var b = document.getElementById('dock-play'); if (!b) return;
    b.setAttribute('aria-label', tocando ? X()._pausar : X()._tocar);
    b.firstElementChild.textContent = tocando ? '❚❚' : '▶';
  }

  /* ---------- fundo que reage ---------- */
  function iniciaViz() {
    var cv = document.querySelector('.viz'), g = cv.getContext('2d'), dados = new Uint8Array(128), t0 = performance.now();
    function tam() { var r = cv.getBoundingClientRect(), dpr = Math.min(2, devicePixelRatio || 1); cv.width = r.width * dpr; cv.height = r.height * dpr; }
    tam(); addEventListener('resize', tam);
    function quadro(agora) {
      var w = cv.width, h = cv.height, grave = 0;
      if (tocando && analisador) { analisador.getByteFrequencyData(dados); grave = (dados[1] + dados[2] + dados[3]) / 765; }
      else if (!reduz) { var s = (agora - t0) / 1000; grave = 0.15 * Math.exp(-((s % 0.5) / 0.5) * 5); for (var k = 0; k < 128; k++) dados[k] = 40 + 30 * Math.sin(s * 2 + k * 0.3); }
      raiz.style.setProperty('--pulso', grave.toFixed(3));
      g.clearRect(0, 0, w, h);
      var n = 48, lx = w / n;
      for (var i = 0; i < n; i++) {
        var v = dados[Math.floor(i * 1.6) + 1] / 255;
        var a = h * (0.08 + v * 0.62);
        g.fillStyle = i % 6 === 0 ? 'rgba(255,122,41,.55)' : 'rgba(198,255,61,' + (0.12 + v * 0.35) + ')';
        g.fillRect(i * lx + lx * 0.2, h - a, lx * 0.6, a);
      }
      var r = Math.min(w, h) * (0.22 + grave * 0.12);
      g.strokeStyle = 'rgba(198,255,61,' + (0.25 + grave * 0.6) + ')'; g.lineWidth = 2 * (devicePixelRatio || 1);
      g.beginPath(); g.arc(w * 0.72, h * 0.42, r, 0, Math.PI * 2); g.stroke();
      g.beginPath(); g.arc(w * 0.72, h * 0.42, r * 0.62, 0, Math.PI * 2); g.stroke();
      if (atual >= 0 && tocando) {
        var prog = ((ctx.currentTime - inicioSet) % 60) / 60;
        var barra = document.querySelector('.set[data-tocar="' + atual + '"] .barra i'); if (barra) barra.style.width = (prog * 100).toFixed(1) + '%';
      }
      if (!reduz || tocando) requestAnimationFrame(quadro); else setTimeout(function () { requestAnimationFrame(quadro); }, 500);
    }
    requestAnimationFrame(quadro);
  }

  /* ---------- pedidos da pista ---------- */
  var fila = null;
  function carregaFila() {
    try { fila = JSON.parse(guarda('nv:fila') || 'null'); } catch (e) { fila = null; }
    if (!Array.isArray(fila)) fila = X()._seeds.map(function (s, i) { return { m: s[0], a: s[1], v: 9 - i * 3, eu: false }; });
  }
  function salvaFila() { guarda('nv:fila', JSON.stringify(fila.slice(0, 12))); }
  function desenhaFila() {
    var ol = document.getElementById('fila'); if (!ol || !fila) return;
    fila.sort(function (a, b) { return b.v - a.v; });
    ol.textContent = '';
    fila.slice(0, 8).forEach(function (p) {
      var li = document.createElement('li'), d = document.createElement('div'), b = document.createElement('b'), s = document.createElement('span'), v = document.createElement('button');
      b.textContent = p.m; s.textContent = p.a || '—'; d.appendChild(b); d.appendChild(s);
      v.type = 'button'; v.className = 'votar'; v.setAttribute('aria-pressed', String(p.eu));
      v.setAttribute('aria-label', (idioma === 'en' ? 'Vote for ' : 'Votar em ') + p.m);
      v.textContent = '▲ ' + p.v;
      v.addEventListener('click', function () { p.eu = !p.eu; p.v += p.eu ? 1 : -1; salvaFila(); desenhaFila(); });
      li.appendChild(d); li.appendChild(v); ol.appendChild(li);
    });
  }
  function iniciaPedidos() {
    carregaFila(); desenhaFila();
    document.getElementById('ped-form').addEventListener('submit', function (e) {
      e.preventDefault();
      var m = this.elements.musica.value.trim(), a = this.elements.artista.value.trim();
      if (!m) { this.elements.musica.focus(); return; }
      fila.push({ m: m.slice(0, 60), a: a.slice(0, 40), v: 1, eu: true }); salvaFila(); desenhaFila(); this.reset(); aviso(X()._ped);
    });
  }

  /* ---------- eu vou ---------- */
  function iniciaVou() {
    document.querySelectorAll('.vou').forEach(function (b) {
      var k = 'nv:vou:' + b.dataset.festa, base = +b.dataset.base;
      function marca() { var eu = guarda(k) === '1'; b.setAttribute('aria-pressed', String(eu)); b.querySelector('.cont').textContent = base + (eu ? 1 : 0); }
      b.addEventListener('click', function () { guarda(k, guarda(k) === '1' ? '0' : '1'); marca(); });
      marca();
    });
  }

  function inicia() {
    iniciaIdioma(); iniciaViz(); iniciaPedidos(); iniciaVou();
    document.querySelectorAll('[data-tocar]').forEach(function (b) {
      b.addEventListener('click', function () { toca(tocando && b.closest('.hero-acoes') ? atual : +b.dataset.tocar); });
    });
    document.getElementById('dock-play').addEventListener('click', function () { if (tocando) para(); else toca(Math.max(0, atual)); });
    document.querySelectorAll('[data-demo]').forEach(function (b) { b.addEventListener('click', function () { aviso(X()._pk); }); });
    document.getElementById('com-form').addEventListener('submit', function (e) { e.preventDefault(); this.reset(); aviso(X()._com); });
    document.addEventListener('visibilitychange', function () { if (document.hidden && tocando) para(); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', inicia); else inicia();
})();
