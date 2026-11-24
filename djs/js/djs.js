/* Página para DJs · Amplitude Lab
   - Idioma: português (no HTML) e inglês (EN abaixo), revisados. Outros idiomas pelo
     Google Tradutor, que só carrega quando alguém escolhe um deles.
   - Vídeos: só carregam perto da tela e pausam fora dela; no celular entram as versões verticais.
   - O ponto verde do topo e do BPM pisca no tempo do fundo (120 BPM, o andamento dos vídeos). */
(function () {
  'use strict';

  var EN = {
    pular: 'Skip to the showreel',
    m_vitrine: 'Showreel', m_noar: 'Live sites', m_entrega: 'What you get', m_refs: 'References',
    m_gigs: 'More gigs', m_ouvintes: 'Listeners', m_booking: 'Booking', m_faq: 'FAQ',
    gig_sobre: 'Why a website if I already have Instagram?',
    gig_t: 'It is not a page. It is your gig machine.',
    gig_sub: 'Instagram shows your day. A website closes the date. It works for two audiences at once, and every part of the page exists to move one of them to the next step.',
    pub_a_t: 'For the people who book you', pub_a_q: 'Promoters, clubs, festivals, agencies and private events',
    pub_a_1: '<b>Decide in 30 seconds:</b> a set video on the first screen, genres, cities and parties you have already played.',
    pub_a_2: '<b>Grab the material themselves:</b> bio, hi-res photos, logos and rider in one click, without waiting for a DM reply.',
    pub_a_3: '<b>Check if the date is free:</b> an always up-to-date calendar shows where you will be.',
    pub_a_4: '<b>Request in a few taps:</b> date, city, event type, set length and budget land together in your WhatsApp.',
    pub_b_t: 'For the people who listen', pub_b_q: 'Fans, people who left your party and people who found you through a set',
    pub_b_1: '<b>Listen without leaving:</b> sets and tracks playing on the page, with visuals that pulse with the bass.',
    pub_b_2: '<b>Join the party:</b> request tracks and vote on the queue from their phone, even through a QR code on the screen.',
    pub_b_3: '<b>Confirm attendance:</b> "I\'m going" on every date and a reminder before the party.',
    pub_b_4: '<b>Become a community:</b> join your list and hear about parties before everyone else.',
    gig_ponte: 'An audience that shows up and joins in becomes a sales argument: a packed room is the best press kit.',
    nv_gen: 'Interactive demo · fictional artist',
    nv_1: 'Hit play: the background, the logo and the player react to the sound in real time.',
    nv_2: 'Track requests with voting, "I\'m going" on dates and a community list.',
    nv_3: 'Booking that builds the message and opens WhatsApp. Go ahead and test it: everything is fake except the form.',
    abrir_demo: 'Try the demo',
    noar_aviso: 'Projects still in preview appear here only under a fictional name, to protect those who are still deciding.',
    cam_sobre: 'The path to the gig', cam_t: 'Every click leads to a booking request.',
    cam_sub: 'This is how a promoter goes from your story to your WhatsApp with the date in hand.',
    c1_t: 'Discovers', c1_d: 'Bio link, QR code on the flyer and on the screen, a set on SoundCloud, a referral from another promoter.',
    c2_t: 'Gets convinced', c2_d: 'A packed-floor video on the first screen, genres, line-ups and numbers from your career.',
    c3_t: 'Takes the material', c3_d: 'Downloads bio, photos and rider to make the flyer and show their partner.',
    c4_t: 'Asks for the date', c4_d: 'A short form: date, city, event, set length and budget.',
    c5_t: 'You close it', c5_d: 'The request lands ready in your WhatsApp. Just reply with your fee.',
    ouv_sobre: 'For listeners', ouv_t: 'A place your audience comes back to, not just visits.',
    ouv_sub: 'Every feature below can go on your site. Pick the ones that fit your sound and your parties.',
    o1_t: 'Player and sets', o1_d: 'SoundCloud, Mixcloud, Spotify and YouTube playing inside the site, with your latest set up front.',
    o2_t: 'Track requests', o2_d: 'The crowd requests and votes from their phones during the party; you see the queue ready.',
    o3_t: '"I\'m going" on dates', o3_d: 'Attendance confirmation for every date and a count of who is coming.',
    o4_t: 'Community list', o4_d: 'WhatsApp or email of people who want to hear first: guest list, presale, new set.',
    o5_t: 'Visuals that pulse', o5_d: 'Background, logo and lights react to the bass when the visitor turns the sound on.',
    o6_t: 'Party gallery', o6_d: 'Photos and an aftermovie of each night, so those who went can tag themselves and those who didn\'t regret it.',
    o7_t: 'QR code on the floor', o7_d: 'From the screen straight to requesting a track, following and joining the list, no typing.',
    o8_t: 'Releases', o8_d: 'A countdown to the new track and a button to save it on Spotify on release day.',
    ouv_demo: 'Want to feel it? The NOVA VOLTZ demo has a working player, requests, dates and list.',
    ouv_demo_b: 'Open the interactive demo',
    bk_sobre: 'Booking straight to WhatsApp', bk_t: 'Try the form that goes on your site.',
    bk_sub: 'Bookers fill it in under a minute and WhatsApp opens with everything written. On your site, the number is yours: it is one line of setup. Here, with no number, WhatsApp opens so you can choose who to send it to.',
    bk_p1: 'Works in Portuguese and English, following the page language.',
    bk_p2: 'Nothing goes through a server: the message goes from the booker\'s phone to yours.',
    bk_p3: 'Only the essential fields are required, so nobody gives up halfway.',
    f_nome: 'Name', f_data: 'Event date', f_cidade: 'City', f_local: 'Venue / event type', f_local_ph: 'Club, festival, wedding…',
    f_duracao: 'Set length', f_aberto: 'To be discussed', f_orc: 'Budget', f_orc_ph: 'E.g. US$ 800',
    f_contato: 'Your contact', f_contato_ph: 'WhatsApp or email', f_enviar: 'Send request via WhatsApp',
    faq_sobre: 'Questions', faq_t: 'Everything explained, no fine print.',
    q1: 'I already have Instagram and Linktree. Why a website?',
    a1: 'Instagram is great for showing your day-to-day, but bookers need something else: material to download, dates, a set video and a fast way to request a date. The site puts it all at one address that replaces Linktree in your bio. And it is yours: no algorithm in the way.',
    q2: 'How much does it cost?',
    a2: 'It depends on what goes on the site. A showcase page starts at R$ 600; a full site is R$ 1,200 to R$ 2,500 (Brazilian reais). Half on approval, half on delivery. The monthly plan (R$ 79 or R$ 199) is optional, for those who want us to keep dates, sets and photos updated. Build yours in the quote tool and see the price right away.',
    q3: 'How long does it take?', a3: '5 to 10 days after the material arrives. Within a few days you get a private preview to see it working and ask for changes.',
    q4: 'What do I need to send?', a4: 'Photos (the best you have), set or crowd videos, links to your tracks and sets, a text about you (or we write it with you), upcoming dates and your booking contact. If something is missing, the site launches with what exists and grows later.',
    q5: 'How does WhatsApp booking work?', a5: 'The form gathers name, date, city, event type, set length, budget and contact into a ready message and opens the booker\'s WhatsApp with it already written to your number. They just hit send. Nothing is stored on a server.',
    q6: 'Do track requests and "I\'m going" really work?', a6: 'In the demo, they stay only in the tester\'s browser. On your site, we connect them to a database so you see the request queue and confirmations in real time. It is an extra feature, agreed in the quote.',
    q7: 'Will the site be in English too?', a7: 'Yes. Portuguese and English written and reviewed by us, switching instantly. For other languages, a button uses Google\'s automatic translation, just like this page.',
    q8: 'Can I use my own domain?', a8: 'Yes. The site is ready to move to your address (for example, yourname.com). You own the domain registration, and we connect it.',
    q9: 'What if I want to change something later?', a9: 'Dates, sets, photos and copy are kept apart from the design, so changes are quick. Ask on the monthly plan or one-off.',
    q10: 'Won\'t the videos make the site heavy?', a10: 'No. Background videos are short, silent and compressed; they only load when they appear on screen, and phones get smaller versions. Visitors who prefer less motion see still images.',
    outros_rotulo: 'Other languages (automatic translation)', outros_op: '🌐 +',
    nota_trad: 'Portuguese and English are written by us. Other languages use Google Translate.',
    cta_topo: 'I want mine',
    hero_sobre: 'Amplitude Lab · websites for DJs',
    hero_t: 'Your sound fills the floor.<br>Your website should <em>hit just as hard.</em>',
    hero_lead: 'Not just a page: the tool that turns people who discover you into booking requests and people who listen into a loyal crowd. Video intro, press kit, tour dates, track requests and booking straight to WhatsApp.',
    hero_b1: 'See the live sites', hero_b2: 'I want mine',
    vit_sobre: 'Showreel · 28 seconds',
    vit_t: 'The sites, actually running.',
    vit_sub: 'We recorded every site on a laptop and a phone and cut it all together right on the beat.',
    vit_play: 'Pause the showreel', vit_play_on: 'Play the showreel',
    vit_cap: 'Silent video showing the ARCANNE, LINNX, BRUXO, DARKY and Bruno Zampieri websites and the NOVA VOLTZ demo on a laptop and a phone.',
    noar_sobre: 'Live now',
    noar_t: 'Every artist gets their own universe.',
    noar_sub: 'No template with a different photo. Open them and click around: these are the real sites.',
    abrir: 'Open the site',
    arc_1: 'Intro and backgrounds on video, cut to the BPM of the single (140).',
    arc_2: 'Portuguese and English, with the language picked on arrival.',
    arc_3: 'Aftermovies, discography and a downloadable press kit.',
    lin_1: 'The first screen is her latest set, in clips that rotate on their own.',
    lin_2: 'With sound on, the WebGL background pulses with the bass of the set.',
    lin_3: 'Enter with sound or in silence: the visitor decides.',
    bru_1: 'The background BPM rises as you scroll: from 136 at the start to 190 at the climax.',
    bru_2: 'A particle field in time with the music, with a pause button.',
    bru_3: 'Gallery, original tracks and booking contact.',
    dar_1: 'Three projects by the same artist in one site, each with its own address.',
    dar_2: 'Roulette gallery, animated transitions and a WebGL background.',
    dar_3: 'On phones, the site measures the device and serves a lighter version.',
    bz_gen: 'Content creator · drone · lifestyle',
    bz_1: 'Drone footage in the background and immersive photo and video sequences.',
    bz_2: 'Each line of work has its own section and a direct contact.',
    bz_3: 'The same language works for a DJ with aftermovies and tour dates.',
    ent_sobre: 'What goes on your site',
    ent_t: 'Everything a booker looks for, on one page.',
    i1_t: 'Video intro', i1_d: 'Made with your footage, cut to the BPM of your track.',
    i2_t: 'Your players', i2_d: 'SoundCloud, Spotify, Mixcloud, YouTube and Apple Music, without leaving the site.',
    i3_t: 'Tour dates', i3_d: 'Upcoming gigs with venue, city and ticket link.',
    i4_t: 'Press kit', i4_d: 'Bio, hi-res photos, logos and rider, one click to download.',
    i5_t: 'Booking', i5_d: 'A form with date, city and event type that lands ready in your WhatsApp or inbox.',
    i6_t: 'Two languages', i6_d: 'Reviewed Portuguese and English, plus automatic translation for the rest of the world.',
    i7_t: 'Visuals that listen', i7_d: 'Backgrounds and logos that pulse with the bass when the visitor turns the sound on.',
    i8_t: 'Light on mobile', i8_d: 'The site measures the device and serves videos and effects at the right size.',
    ref_sobre: 'International references',
    ref_t: 'The level we chase.',
    ref_sub: 'Sites from artists and brands of the global scene that we study. Each one nails one thing, and we take the idea, not a copy.',
    r1: 'The name becomes the logo, the portrait fills the screen and there is almost no color: a strong identity with few elements.',
    r2: 'The first screen is a moving visual piece, and the menu stays short: music, tour, videos, press.',
    r3: 'A cinematic visual world, with the tour treated as the main product of the site.',
    r4: 'The current release is the hero of the page, with a scrolling marquee and a direct listen button.',
    r5: 'The live set as the showcase: events, video and audio side by side.',
    r6: 'A collective with dates, releases and a radio show in the same menu.',
    r7: 'Every platform at the top of the page: visitors pick where to listen.',
    ref_aviso: 'Links to the official sites, as market references only. Amplitude Lab has no affiliation with these artists.',
    pro_sobre: 'How it works',
    pro_t: 'From your material to a live site in 5 to 10 days.',
    p1_t: 'Talk and material', p1_d: 'Photos, set videos, tracks, bio and the dates coming up.',
    p2_t: 'Private preview', p2_d: 'Within a few days you get a link of your own to see the site running.',
    p3_t: 'Adjustments', p3_d: 'Copy, order, colors, video intro: we tune it until it feels like you.',
    p4_t: 'Live', p4_d: 'Published, fast and ready for your own domain and your Instagram bio.',
    ct_t: 'Ready to put your sound online?',
    ct_d: 'Tell us your style and send what you already have. We reply with the idea for the site and a quote.',
    ct_b1: 'Build my quote', ct_b2: 'Message us on WhatsApp',
    rod_1: 'Websites for artists and businesses · São Paulo, Brazil',
    rod_2: 'Full portfolio',
    _title: 'Websites for DJs · Amplitude Lab',
    _desc: 'Custom DJ websites: video intro, players, tour dates, press kit and booking, fast on mobile and in two languages. See the sites Amplitude Lab has already launched.',
    _whats: 'Hi! I saw the Amplitude Lab page about websites for DJs',
  };
  var PT_EXTRA = { vit_play: 'Pausar a vitrine', vit_play_on: 'Tocar a vitrine', _whats: 'Oi! Vi a página de sites para DJs da Amplitude Lab' };

  var CHAVE = 'djs:idioma';
  var guarda = function (v) { try { if (v === undefined) return localStorage.getItem(CHAVE); localStorage.setItem(CHAVE, v); } catch (e) { return null; } };
  var reduz = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var celular = window.matchMedia('(max-width: 820px)').matches;
  var PT = {};
  var idioma = 'pt';

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
    var t = lang === 'en' ? EN : PT_EXTRA;
    document.documentElement.lang = lang === 'en' ? 'en' : 'pt-BR';
    if (!PT._title) { PT._title = document.title; PT._desc = document.querySelector('meta[name=description]').content; }
    document.title = lang === 'en' ? EN._title : PT._title;
    document.querySelector('meta[name=description]').content = lang === 'en' ? EN._desc : PT._desc;
    var w = document.getElementById('whats');
    if (w) w.href = 'https://wa.me/5511952182016?text=' + encodeURIComponent(t._whats);
    rotuloPlay();
    document.querySelectorAll('.idioma [data-lang]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-lang') === lang)); });
  }

  function escolhe(lang) {
    guarda(lang);
    if (googAtual()) { googCookie(''); location.reload(); return; }
    aplica(lang);
  }

  function carregaGoogle(lang) {
    var caixa = document.createElement('div'); caixa.id = 'gt-caixa'; document.body.appendChild(caixa);
    window.djsGoogleInit = function () {
      new window.google.translate.TranslateElement({ pageLanguage: 'pt', autoDisplay: false }, 'gt-caixa');
    };
    var s = document.createElement('script');
    s.src = 'https://translate.google.com/translate_a/element.js?cb=djsGoogleInit';
    document.body.appendChild(s);
    var sel = document.getElementById('outros'); if (sel) sel.value = lang;
    document.querySelectorAll('.idioma [data-lang]').forEach(function (b) { b.setAttribute('aria-pressed', 'false'); });
  }

  function iniciaIdioma() {
    var q = (location.search.match(/[?&]lang=([\w-]+)/) || [])[1];
    var goog = googAtual();
    var salvo = guarda();
    if (q === 'pt' || q === 'en') { guarda(q); if (goog) { googCookie(''); goog = ''; } }
    if (goog) { aplica('pt'); carregaGoogle(goog); }
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
      guarda(sel.value);
      googCookie(sel.value);
      // ?lang=pt|en no link venceria o cookie na volta: tira o parâmetro antes de recarregar.
      var limpo = location.href.replace(/([?&])lang=[\w-]+&?/, '$1').replace(/[?&](#|$)/, '$1');
      if (limpo !== location.href) location.replace(limpo); else location.reload();
    });
  }

  /* ---------- vídeos ---------- */
  function fonte(v) {
    if (celular && v.dataset.srcM) { if (v.dataset.posterM) v.poster = v.dataset.posterM; return v.dataset.srcM; }
    return v.dataset.src;
  }
  var reelPausado = false;
  function toca(v) {
    if (reduz || (v.classList.contains('reel-video') && reelPausado)) return;
    if (!v.src) { v.src = fonte(v); }
    var p = v.play(); if (p && p.catch) p.catch(function () {});
  }
  function iniciaVideos() {
    var vids = document.querySelectorAll('video[data-src]');
    vids.forEach(function (v) { if (celular && v.dataset.posterM) v.poster = v.dataset.posterM; });
    if (!('IntersectionObserver' in window)) { vids.forEach(toca); return; }
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) toca(e.target); else if (!e.target.paused) e.target.pause(); });
    }, { rootMargin: '200px 0px' });
    vids.forEach(function (v) { io.observe(v); });
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) vids.forEach(function (v) { if (!v.paused) v.pause(); });
    });
    var bt = document.querySelector('.reel-play'), reel = document.querySelector('.reel-video');
    if (reduz) { reelPausado = true; }
    if (bt && reel) bt.addEventListener('click', function () {
      reelPausado = !reelPausado;
      if (reelPausado) reel.pause(); else { if (!reel.src) reel.src = fonte(reel); reel.play().catch(function () {}); }
      rotuloPlay();
    });
    rotuloPlay();
  }
  function rotuloPlay() {
    var bt = document.querySelector('.reel-play'); if (!bt) return;
    var t = idioma === 'en' ? EN : PT_EXTRA;
    bt.setAttribute('aria-pressed', String(reelPausado));
    bt.setAttribute('aria-label', reelPausado ? t.vit_play_on : t.vit_play);
  }

  /* ---------- pulso no tempo do fundo ---------- */
  function iniciaPulso() {
    if (reduz) return;
    var hero = document.querySelector('.hero-video'), raiz = document.documentElement.style, t0 = performance.now();
    function quadro(agora) {
      var s = hero && !hero.paused && hero.currentTime > 0 ? hero.currentTime : (agora - t0) / 1000;
      var k = Math.exp(-((s % 0.5) / 0.5) * 5); // 120 BPM = uma batida a cada 0,5 s
      raiz.setProperty('--pulso', k.toFixed(3));
      requestAnimationFrame(quadro);
    }
    requestAnimationFrame(quadro);
  }

  /* ---------- topo e entradas ---------- */
  function iniciaTopo() {
    var topo = document.getElementById('topo');
    var marca = function () { topo.classList.toggle('rolou', scrollY > 40); };
    addEventListener('scroll', marca, { passive: true }); marca();
    if (reduz || !('IntersectionObserver' in window)) return;
    var alvos = document.querySelectorAll('.cab, .site, .itens, .refs, .passos, .reel, .publico, .trilha, .recursos, .faq, .bk');
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('visto'); io.unobserve(e.target); } });
    }, { threshold: 0.12 });
    alvos.forEach(function (a) { a.classList.add('revela'); io.observe(a); });
  }

  function inicia() { iniciaIdioma(); iniciaVideos(); iniciaPulso(); iniciaTopo(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', inicia); else inicia();
})();
