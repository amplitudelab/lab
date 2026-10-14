/* AMPLITUDE LAB: animações (GSAP + ScrollTrigger + SplitText), frasco com
   líquido em onda, demos interativas no celular, calculadora de orçamento e
   envio pelo WhatsApp. */
(() => {
  'use strict';

  // ── Configuração: edite aqui ─────────────────────────────────────────────
  const CONFIG = {
    // WhatsApp com DDI + DDD + número, só dígitos (ex.: "5511999999999").
    whatsapp: '5511952182016',
    instagram: 'amplitude_lab', // usuário sem @
    currency: 'R$',
    maintenance: 49,             // valor mensal da manutenção
  };

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const fontsReady = document.fonts ? document.fonts.ready : Promise.resolve();
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const isMobile = () => innerWidth < 760;

  gsap.registerPlugin(ScrollTrigger, SplitText);
  // Personalidade de movimento: energética nas interações, premium nas revelações
  gsap.defaults({ ease: 'expo.out', duration: 0.45 });

  const fmt = (n) => n.toLocaleString('pt-BR');
  const money = (n) => `${CONFIG.currency} ${fmt(n)}`;
  $('[data-year]').textContent = new Date().getFullYear();

  // ── Contatos ─────────────────────────────────────────────────────────────
  const waLink = (text) => `https://wa.me/${CONFIG.whatsapp}${text ? '?text=' + encodeURIComponent(text) : ''}`;
  $('[data-wa-direct]').href = waLink('Olá, Amplitude Lab! Quero dar mais amplitude para a minha marca.');

  // ── Toast ────────────────────────────────────────────────────────────────
  const toastEl = $('[data-toast]');
  let toastTl;
  function toast(msg) {
    $('[data-toast-text]').textContent = msg;
    toastTl && toastTl.kill();
    toastTl = gsap.timeline()
      .fromTo(toastEl, { yPercent: 140 }, { yPercent: 0, duration: 0.5, ease: 'back.out(1.6)' })
      .fromTo($('path', toastEl), { strokeDashoffset: 24 }, { strokeDashoffset: 0, duration: 0.35, ease: 'power2.out' }, '-=0.2')
      .to(toastEl, { yPercent: 140, duration: 0.3, ease: 'power3.in', delay: 2.2 });
  }
  gsap.set(toastEl, { xPercent: -50, yPercent: 140 });

  // ════════════════════════════════════════════════════════════════════════
  // ENERGIA: velocidade do ponteiro + agitar o frasco. Move ondas e escultura.
  // ════════════════════════════════════════════════════════════════════════
  const pointer = { x: innerWidth / 2, y: innerHeight * 0.4, nx: 0, ny: 0 };
  let energy = 0, energyTarget = 0, slosh = 0;
  let lastMove = performance.now();
  addEventListener('pointermove', (e) => {
    const now = performance.now();
    const dt = Math.max(16, now - lastMove);
    const speed = Math.hypot(e.clientX - pointer.x, e.clientY - pointer.y) / dt; // px/ms
    lastMove = now;
    pointer.x = e.clientX; pointer.y = e.clientY;
    pointer.nx = (e.clientX / innerWidth) * 2 - 1; pointer.ny = (e.clientY / innerHeight) * 2 - 1;
    energyTarget = Math.min(1, Math.max(energyTarget, speed / 3));
  }, { passive: true });
  const kick = (v = 0.6) => { slosh = Math.min(1.4, slosh + v); };
  gsap.ticker.add(() => {
    energyTarget *= 0.94;
    slosh *= 0.965;
    energy += (Math.min(1, energyTarget + slosh * 0.6) - energy) * 0.08;
  });

  // ════════════════════════════════════════════════════════════════════════
  // FRASCO: líquido com duas ondas desenhadas a cada quadro
  // ════════════════════════════════════════════════════════════════════════
  function wavePath(base, amp, phase, k) {
    let d = `M-4 ${base.toFixed(2)}`;
    for (let x = -4; x <= 196; x += 4) {
      const y = base + Math.sin((x / 192) * Math.PI * 2 * k + phase) * amp;
      d += ` L${x} ${y.toFixed(2)}`;
    }
    return d + ' L196 200 L-4 200 Z';
  }
  function makeFlask(svg) {
    const back = $('[data-wave-back]', svg), front = $('[data-wave-front]', svg);
    const st = { level: 112, amp: 4, t: 0 };
    function draw() {
      const a = st.amp;
      back.setAttribute('d', wavePath(st.level - 3, a * 0.8, -st.t * 1.3 + 1.2, 1.6));
      front.setAttribute('d', wavePath(st.level, a, st.t * 1.7, 2.1));
    }
    draw();
    return { st, draw };
  }

  const heroFlask = makeFlask($('[data-flask="hero"]'));
  const loaderFlask = makeFlask($('[data-flask="loader"]'));
  loaderFlask.st.level = 186;
  loaderFlask.draw();

  // Bolhas subindo dentro do frasco
  (function bubbles() {
    const g = $('[data-bubbles]');
    if (reduced) return;
    const NS = 'http://www.w3.org/2000/svg';
    for (let i = 0; i < 9; i++) {
      const c = document.createElementNS(NS, 'circle');
      g.appendChild(c);
      const rise = () => {
        const r = 1.4 + Math.random() * 3.2;
        const cx = 70 + Math.random() * 52;
        c.setAttribute('r', r.toFixed(1));
        c.setAttribute('cx', cx.toFixed(1));
        c.setAttribute('cy', '168');
        gsap.fromTo(c, { opacity: 0.55 },
          {
            attr: { cy: heroFlask.st.level + 6, cx: cx + (Math.random() - 0.5) * 16 }, opacity: 0,
            duration: 2.4 + Math.random() * 2.6, ease: 'sine.in', delay: Math.random() * 2.4, onComplete: rise,
          });
      };
      rise();
    }
  })();

  // Agitar: clique, toque ou Enter no frasco do herói
  const stage = $('.flask-stage');
  function agitate() {
    kick(0.9);
    if (reduced) return;
    gsap.timeline()
      .to(stage, { rotation: -9, duration: 0.12, ease: 'power2.out' })
      .to(stage, { rotation: 7, duration: 0.16, ease: 'power2.inOut' })
      .to(stage, { rotation: 0, duration: 0.9, ease: 'elastic.out(1, 0.35)' });
  }
  stage.addEventListener('click', agitate);
  stage.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); agitate(); } });

  const ampOut = $('[data-amp]');
  let ampShown = -1;
  gsap.ticker.add((time, dt) => {
    const s = heroFlask.st;
    if (!reduced) s.t += dt / 1000 * (1.2 + energy * 3);
    s.amp = 3.5 + energy * 9 + slosh * 6;
    heroFlask.draw();
    stage.style.setProperty('--glow', (0.45 + energy * 0.5).toFixed(3));
    const pct = Math.round(42 + energy * 58);
    if (pct !== ampShown) { ampShown = pct; ampOut.textContent = String(pct).padStart(3, '0'); }
  });

  // ════════════════════════════════════════════════════════════════════════
  // PRELOADER + INTRO DO HERÓI
  // ════════════════════════════════════════════════════════════════════════
  function heroIntro() {
    if (reduced) { gsap.set(['[data-hero]', '[data-hero-logo]'], { opacity: 1 }); return; }
    // Divide o título só depois das fontes; o degradê vai para cada letra
    const heroTitle = $('[data-hero-title]');
    const split = SplitText.create(heroTitle.querySelectorAll('.line'), { type: 'words,chars', charsClass: 'ch' });
    split.chars.forEach((c) => {
      c.classList.add(c.closest('.line').classList.contains('volt-text') ? 'volt-text' : 'chrome-text');
    });
    heroTitle.querySelectorAll('.line').forEach((l) => l.classList.remove('chrome-text', 'volt-text'));
    gsap.timeline({ defaults: { ease: 'expo.out' } })
      .fromTo('[data-hero-logo]', { scale: 0.8, opacity: 0, filter: 'blur(16px) brightness(2)' },
        { scale: 1, opacity: 1, filter: 'blur(0px) brightness(1)', duration: 1.2, clearProps: 'filter' })
      .fromTo(split.chars, { yPercent: 110, rotate: 6, opacity: 0 },
        { yPercent: 0, rotate: 0, opacity: 1, duration: 0.9, stagger: 0.025 }, 0.3)
      .fromTo('[data-hero]', { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, stagger: 0.08 }, 0.5)
      .add(() => kick(0.8), 0.4);
  }

  function runLoader() {
    const loader = $('.loader');
    if (reduced) {
      loader.remove();
      return Promise.resolve();
    }
    const bars = $$('.loader-meter i', loader);
    const count = $('[data-count]', loader);
    const meter = gsap.to(bars, {
      scaleY: () => 0.3 + Math.random() * 0.7, duration: 0.18, ease: 'sine.inOut',
      stagger: { each: 0.04, repeat: -1, yoyo: true }, repeatRefresh: true,
    });
    // O frasco do preloader enche junto com o contador
    const lf = loaderFlask.st;
    const tick = (time, dt) => { lf.t += dt / 1000 * 2.4; lf.amp = 5; loaderFlask.draw(); };
    gsap.ticker.add(tick);
    const ready = Promise.all([fontsReady, new Promise((r) => setTimeout(r, 1200))]);
    const prog = { v: 0 };
    const show = () => {
      count.textContent = String(Math.round(prog.v)).padStart(3, '0');
      lf.level = 186 - (186 - 70) * (prog.v / 100);
    };
    return new Promise((resolve) => {
      gsap.timeline()
        .to(prog, { v: 82, duration: 1.1, ease: 'power2.out', onUpdate: show })
        .add(() => {
          ready.then(() => {
            gsap.timeline({ onComplete: () => { meter.kill(); gsap.ticker.remove(tick); loader.remove(); } })
              .to(prog, { v: 100, duration: 0.35, ease: 'power2.out', onUpdate: show })
              .to('.loader-inner', { scale: 1.08, opacity: 0, duration: 0.35, ease: 'power3.in' })
              .add(resolve)
              .to('.loader-half.top', { yPercent: -100, duration: 0.9, ease: 'expo.inOut' }, '<0.1')
              .to('.loader-half.bottom', { yPercent: 100, duration: 0.9, ease: 'expo.inOut' }, '<');
          });
        });
    });
  }

  // ════════════════════════════════════════════════════════════════════════
  // NAV, MENU, CURSOR, BOTÕES MAGNÉTICOS
  // ════════════════════════════════════════════════════════════════════════
  const nav = $('[data-nav]');
  let menuOpen = false;
  ScrollTrigger.create({
    start: 0, end: 'max',
    onUpdate(self) {
      const y = self.scroll();
      nav.classList.toggle('is-solid', y > 40);
      if (menuOpen) return;
      nav.classList.toggle('is-hidden', self.direction === 1 && y > 400);
    },
  });
  $$('.nav-links a').forEach((a) => {
    const sec = $(a.getAttribute('href'));
    if (!sec) return;
    ScrollTrigger.create({ trigger: sec, start: 'top 50%', end: 'bottom 50%', toggleClass: { targets: a, className: 'is-active' } });
  });

  const burger = $('.nav-burger');
  const menu = $('#menu');
  const menuTl = gsap.timeline({ paused: true })
    .set(menu, { visibility: 'visible' })
    .fromTo(menu, { clipPath: 'inset(0 0 100% 0)' }, { clipPath: 'inset(0 0 0% 0)', duration: 0.6, ease: 'expo.inOut' })
    .fromTo($$('a span', menu), { yPercent: 110 }, { yPercent: 0, duration: 0.6, stagger: 0.05 }, '-=0.25')
    .fromTo('.menu-foot', { opacity: 0 }, { opacity: 1, duration: 0.3 }, '-=0.3');
  function setMenu(open) {
    menuOpen = open;
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
    menu.setAttribute('aria-hidden', String(!open));
    nav.classList.remove('is-hidden');
    document.body.style.overflow = open ? 'hidden' : '';
    if (open) menuTl.timeScale(1).play(); else menuTl.timeScale(1.6).reverse();
  }
  burger.addEventListener('click', () => setMenu(!menuOpen));
  $$('a', menu).forEach((a) => a.addEventListener('click', () => setMenu(false)));
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && menuOpen) setMenu(false); });
  addEventListener('resize', () => { if (menuOpen && innerWidth >= 1000) setMenu(false); });

  if (finePointer && !reduced) {
    const dot = $('.cursor'), ring = $('.cursor-ring');
    const dx = gsap.quickTo(dot, 'x', { duration: 0.08, ease: 'power3' });
    const dy = gsap.quickTo(dot, 'y', { duration: 0.08, ease: 'power3' });
    const rx = gsap.quickTo(ring, 'x', { duration: 0.4, ease: 'power3' });
    const ry = gsap.quickTo(ring, 'y', { duration: 0.4, ease: 'power3' });
    addEventListener('pointermove', (e) => { dx(e.clientX); dy(e.clientY); rx(e.clientX); ry(e.clientY); }, { passive: true });
    document.addEventListener('pointerover', (e) => {
      const lab = e.target.closest('[data-cursor]');
      const hov = e.target.closest('a, button, input, select, textarea, label, summary');
      ring.classList.toggle('is-label', !!lab);
      ring.classList.toggle('is-hover', !lab && !!hov);
      if (lab) $('span', ring).textContent = lab.dataset.cursor;
    });
    document.documentElement.addEventListener('mouseleave', () => gsap.to([dot, ring], { opacity: 0, duration: 0.2 }));
    document.documentElement.addEventListener('mouseenter', () => gsap.to([dot, ring], { opacity: 1, duration: 0.2 }));

    $$('.magnetic').forEach((el) => {
      const xTo = gsap.quickTo(el, 'x', { duration: 0.5, ease: 'elastic.out(1, 0.4)' });
      const yTo = gsap.quickTo(el, 'y', { duration: 0.5, ease: 'elastic.out(1, 0.4)' });
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        xTo((e.clientX - r.left - r.width / 2) * 0.28);
        yTo((e.clientY - r.top - r.height / 2) * 0.38);
      });
      el.addEventListener('pointerleave', () => { xTo(0); yTo(0); });
    });
  }

  // Brilho que segue o mouse nos cards de serviço
  $$('.svc').forEach((card) => {
    card.addEventListener('pointermove', (e) => {
      const r = card.getBoundingClientRect();
      card.style.setProperty('--mx', `${e.clientX - r.left}px`);
      card.style.setProperty('--my', `${e.clientY - r.top}px`);
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // OSCILOSCÓPIO DO HERÓI (canvas 2D)
  // ════════════════════════════════════════════════════════════════════════
  (function heroViz() {
    const cv = $('.hero-viz');
    const cx = cv.getContext('2d');
    let w = 0, h = 0, visible = true, t = 0, lvl = 0;
    function size() {
      const dpr = Math.min(devicePixelRatio || 1, 2);
      w = cv.clientWidth; h = cv.clientHeight;
      cv.width = w * dpr; cv.height = h * dpr;
      cx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    size(); addEventListener('resize', size);
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(cv);
    const layers = [
      { a: 50, f: 1.4, sp: 1.0, col: 'rgba(91,140,255,0.85)', lw: 2 },
      { a: 34, f: 2.2, sp: -0.7, col: 'rgba(197,203,217,0.32)', lw: 1.2 },
      { a: 24, f: 3.3, sp: 1.4, col: 'rgba(169,196,255,0.28)', lw: 1 },
    ];
    function draw() {
      if (!visible) return;
      t += reduced ? 0 : 0.012;
      lvl += (energy - lvl) * 0.15;
      cx.clearRect(0, 0, w, h);
      const mid = h * 0.6;
      for (const L of layers) {
        cx.beginPath();
        for (let x = 0; x <= w; x += 6) {
          const u = x / w;
          const env = Math.sin(u * Math.PI);
          const near = Math.max(0, 1 - Math.hypot(x - pointer.x, mid - pointer.y) / 380);
          const amp = L.a * (0.45 + near * 1.2 + lvl * 2.2) * env;
          const y = mid + Math.sin(u * Math.PI * 2 * L.f + t * 3 * L.sp) * amp * Math.cos(u * 7 + t * L.sp);
          x ? cx.lineTo(x, y) : cx.moveTo(x, y);
        }
        cx.strokeStyle = L.col; cx.lineWidth = L.lw; cx.stroke();
      }
      // Barras de nível no rodapé do herói
      const bars = Math.floor(w / 9);
      cx.fillStyle = 'rgba(91,140,255,0.16)';
      for (let i = 0; i < bars; i++) {
        const u = i / bars;
        const v = (Math.sin(u * 22 + t * 4) * 0.5 + 0.5) * (0.22 + lvl * 0.6) * Math.sin(u * Math.PI);
        const bh = v * h * 0.22;
        cx.fillRect(i * 9, h - bh, 5, bh);
      }
    }
    if (reduced) { draw(); addEventListener('resize', draw); } else gsap.ticker.add(draw);
  })();

  // ════════════════════════════════════════════════════════════════════════
  // MARQUEE com velocidade ligada à rolagem
  // ════════════════════════════════════════════════════════════════════════
  $$('[data-marquee]').forEach((mq) => {
    const track = $('.marquee-track', mq);
    const group = $('.marquee-group', track);
    while (track.scrollWidth < innerWidth * 2.2) track.appendChild(group.cloneNode(true));
    if (reduced) return;
    const dir = Number(mq.dataset.marquee);
    let x = 0, boost = 0;
    const setX = gsap.quickSetter(track, 'x', 'px');
    gsap.ticker.add((time, dt) => {
      const gw = group.offsetWidth;
      x -= (0.06 + boost) * dt * dir;
      x = gsap.utils.wrap(-gw, 0, x);
      setX(x);
      boost *= 0.92;
    });
    ScrollTrigger.create({ trigger: mq, start: 'top bottom', end: 'bottom top', onUpdate: (s) => { boost = Math.min(0.9, Math.abs(s.getVelocity()) / 4000) * Math.sign(s.getVelocity() || 1); } });
  });

  // ════════════════════════════════════════════════════════════════════════
  // REVELAÇÕES NA ROLAGEM
  // ════════════════════════════════════════════════════════════════════════
  const mm = gsap.matchMedia();
  mm.add({ motion: '(prefers-reduced-motion: no-preference)', desktop: '(min-width: 960px)' }, (ctx) => {
    const { motion, desktop } = ctx.conditions;
    if (!motion) return;

    // Títulos: linhas sobem de dentro da máscara; ao terminar, o HTML original volta
    gsap.set('[data-split]', { opacity: 0 });
    fontsReady.then(() => {
      $$('[data-split]').forEach((el) => {
        const split = SplitText.create(el, { type: 'lines', mask: 'lines', linesClass: 'ln' });
        gsap.set(el, { opacity: 1 });
        gsap.from(split.lines, {
          yPercent: 115, duration: 0.9, stagger: 0.08, ease: 'expo.out',
          scrollTrigger: { trigger: el, start: 'top 85%', once: true },
          onComplete: () => split.revert(),
        });
      });
      ScrollTrigger.refresh();
    });

    gsap.set('[data-reveal]', { y: 40, opacity: 0 });
    ScrollTrigger.batch('[data-reveal]', {
      start: 'top 88%', once: true,
      onEnter: (els) => gsap.to(els, { y: 0, opacity: 1, duration: 0.8, stagger: 0.08, overwrite: true }),
    });

    gsap.set('[data-card]', { y: 60, opacity: 0, rotateX: -8, transformPerspective: 900, transformOrigin: '50% 100%' });
    ScrollTrigger.batch('[data-card]', {
      start: 'top 90%', once: true, interval: 0.1,
      onEnter: (els) => gsap.to(els, {
        y: 0, opacity: 1, rotateX: 0, duration: 0.9, stagger: 0.07, overwrite: true,
        clearProps: 'transform,transformPerspective',
      }),
    });

    // Contadores dos preços
    $$('[data-num]').forEach((el) => {
      const end = Number(el.dataset.num);
      const o = { v: 0 };
      el.textContent = '0';
      gsap.to(o, {
        v: end, duration: 1.2, ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 92%', once: true },
        onUpdate: () => { el.textContent = fmt(Math.round(o.v)); },
      });
    });

    // Processo: rolagem horizontal fixada no desktop
    const proc = $('#processo');
    if (desktop) {
      proc.classList.add('is-horizontal');
      const trackEl = $('.process-track', proc);
      const dist = () => Math.max(0, trackEl.scrollWidth - innerWidth);
      const tween = gsap.to(trackEl, {
        x: () => -dist(), ease: 'none',
        scrollTrigger: {
          trigger: proc, start: 'top top', end: () => '+=' + dist(), pin: true, scrub: 0.6,
          invalidateOnRefresh: true, anticipatePin: 1,
        },
      });
      gsap.to('.process-progress b', {
        scaleX: 1, ease: 'none',
        scrollTrigger: { trigger: proc, start: 'top top', end: () => '+=' + dist(), scrub: true, invalidateOnRefresh: true },
      });
      $$('.step', proc).forEach((st) => {
        gsap.fromTo($('.step-bar', st), { scaleX: 0 }, {
          scaleX: 1, ease: 'none',
          scrollTrigger: { trigger: st, containerAnimation: tween, start: 'left 85%', end: 'right 60%', scrub: true },
        });
        gsap.from($('.step-num', st), {
          xPercent: 40, opacity: 0, duration: 0.8,
          scrollTrigger: { trigger: st, containerAnimation: tween, start: 'left 80%', toggleActions: 'play none none reverse' },
        });
      });
      return () => { proc.classList.remove('is-horizontal'); };
    }
    $$('.step', proc).forEach((st) => {
      gsap.fromTo($('.step-bar', st), { scaleX: 0 }, {
        scaleX: 1, ease: 'none', scrollTrigger: { trigger: st, start: 'top 85%', end: 'bottom 60%', scrub: true },
      });
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // MANIFESTO + ESCULTURA 3D
  // ════════════════════════════════════════════════════════════════════════
  (function manifesto() {
    const sec = $('#manifesto');
    const lines = $$('.m-line', sec);
    const bars = $$('.manifesto-progress b', sec);
    const canvas = $('.sculpture', sec);
    let sculpture = null, lastP = 0;

    if (reduced) {
      $('.manifesto-lines', sec).classList.add('no-js-lines');
      bars.forEach((b) => gsap.set(b, { scaleX: 1 }));
    } else {
      gsap.set(lines, { yPercent: 40, opacity: 0, filter: 'blur(10px)' });
      const tl = gsap.timeline({
        defaults: { ease: 'power2.inOut', duration: 1 },
        scrollTrigger: {
          trigger: sec, start: 'top top', end: 'bottom bottom', scrub: 0.6,
          onUpdate: (s) => { lastP = s.progress; sculpture && sculpture.setProgress(s.progress); },
        },
      });
      lines.forEach((ln, i) => {
        tl.to(ln, { yPercent: 0, opacity: 1, filter: 'blur(0px)', ease: 'expo.out' }, i * 2)
          .to(bars[i], { scaleX: 1, ease: 'none', duration: 2 }, i * 2);
        if (i < lines.length - 1) tl.to(ln, { yPercent: -40, opacity: 0, filter: 'blur(10px)', ease: 'power3.in', duration: 0.7 }, i * 2 + 1.25);
      });
      tl.to({}, { duration: 0.6 });
    }

    // Three.js só carrega quando a seção se aproxima
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      import('./sculpture.js')
        .then((m) => {
          sculpture = m.mount(canvas, { reduced, mobile: isMobile() });
          if (!sculpture) throw new Error('webgl');
          sculpture.setProgress(lastP);
          gsap.ticker.add(() => {
            sculpture.setPointer(pointer.nx, pointer.ny);
            sculpture.setLevel(energy);
          });
          gsap.from(canvas, { opacity: 0, scale: 0.92, duration: 1.4, ease: 'expo.out' });
        })
        .catch(() => { sec.classList.add('no-webgl'); });
    }, { rootMargin: '600px 0px' });
    io.observe(sec);
  })();

  // ════════════════════════════════════════════════════════════════════════
  // LABORATÓRIO DE DEMOS (celular interativo)
  // ════════════════════════════════════════════════════════════════════════
  (function lab() {
    const root = $('[data-lab]');
    const tabs = $$('.demo-btn', root);
    const screens = tabs.map((t) => $('#' + t.getAttribute('aria-controls')));
    const phone = $('.phone', root);
    let cur = 0;

    // Avisos dentro do celular
    const pt = $('[data-ptoast]', root);
    let ptTimer;
    const ptoast = (msg) => {
      pt.textContent = msg; pt.classList.add('on');
      clearTimeout(ptTimer); ptTimer = setTimeout(() => pt.classList.remove('on'), 2600);
      kick(0.3);
    };
    $$('.demo-act', root).forEach((b) => b.addEventListener('click', () => ptoast(b.dataset.msg)));

    function show(i, focus) {
      const next = (i + tabs.length) % tabs.length;
      if (next === cur && screens[cur].classList.contains('on')) { if (focus) tabs[cur].focus(); return; }
      const from = screens[cur], to = screens[next];
      cur = next;
      tabs.forEach((t, k) => { t.setAttribute('aria-selected', String(k === cur)); t.tabIndex = k === cur ? 0 : -1; });
      if (focus) tabs[cur].focus();
      const d = tabs[cur].dataset;
      $('[data-spec]', root).textContent = `Amostra ${String(cur + 1).padStart(2, '0')} / ${String(tabs.length).padStart(2, '0')}`;
      $('[data-out-ideal]', root).textContent = d.ideal;
      $('[data-out-acesso]', root).textContent = d.acesso;
      const title = $('[data-out-title]', root), meta = $('[data-out-meta]', root), desc = $('[data-out-desc]', root);
      pt.classList.remove('on');
      if (reduced) {
        from.classList.remove('on'); to.classList.add('on');
        title.textContent = d.title; meta.textContent = d.meta; desc.textContent = d.desc;
        return;
      }
      gsap.timeline()
        .to([title, meta, desc], { yPercent: -30, opacity: 0, duration: 0.15, ease: 'power3.in', onComplete: () => { title.textContent = d.title; meta.textContent = d.meta; desc.textContent = d.desc; } })
        .fromTo([title, meta, desc], { yPercent: 40, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.45, stagger: 0.05 });
      gsap.timeline()
        .to(from, { opacity: 0, y: -14, duration: 0.18, ease: 'power3.in', onComplete: () => { from.classList.remove('on'); gsap.set(from, { clearProps: 'all' }); } })
        .add(() => { to.classList.add('on'); to.scrollTop = 0; })
        .fromTo(to, { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.5, clearProps: 'transform' });
      gsap.fromTo(phone, { scale: 0.985 }, { scale: 1, duration: 0.6, ease: 'back.out(2)' });
    }
    tabs.forEach((t, i) => {
      t.tabIndex = i === 0 ? 0 : -1;
      t.addEventListener('click', () => show(i));
      t.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowDown' || e.key === 'ArrowRight') { e.preventDefault(); show(cur + 1, true); }
        if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') { e.preventDefault(); show(cur - 1, true); }
      });
    });
    $('[data-next]', root).addEventListener('click', () => show(cur + 1));
    $('[data-prev]', root).addEventListener('click', () => show(cur - 1));

    // ── Agendamento ──
    const book = { svc: 'Corte', dur: '40 min', day: 0, slot: null };
    const wd = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const mo = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
    const days = [];
    for (let d = new Date(), i = 0; days.length < 6 && i < 14; i++) {
      const x = new Date(d.getFullYear(), d.getMonth(), d.getDate() + i + 1);
      if (x.getDay() !== 0) days.push(x);
    }
    const daysEl = $('[data-days]', root), slotsEl = $('[data-slots]', root), conf = $('[data-confirm]', root);
    const hours = ['09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00', '17:00'];
    const taken = (di, hi) => ((di * 7 + hi * 3) % 5) === 0;
    function renderDays() {
      daysEl.innerHTML = '';
      days.forEach((d, i) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.setAttribute('aria-pressed', String(book.day === i));
        b.setAttribute('aria-label', `${wd[d.getDay()]}, ${d.getDate()} de ${mo[d.getMonth()]}`);
        b.innerHTML = `${wd[d.getDay()]}<b>${d.getDate()}</b>`;
        b.onclick = () => { book.day = i; book.slot = null; renderDays(); renderSlots(); };
        daysEl.appendChild(b);
      });
    }
    function renderSlots() {
      slotsEl.innerHTML = '';
      hours.forEach((h, hi) => {
        const b = document.createElement('button');
        b.type = 'button'; b.textContent = h;
        b.disabled = taken(book.day, hi);
        if (b.disabled) b.setAttribute('aria-label', h + ', ocupado');
        b.setAttribute('aria-pressed', String(book.slot === h));
        b.onclick = () => { book.slot = h; renderSlots(); kick(0.2); };
        slotsEl.appendChild(b);
      });
      conf.disabled = !book.slot;
      conf.textContent = book.slot ? `Confirmar ${book.slot}` : 'Escolha um horário';
    }
    $$('.svc-list button', root).forEach((b) => b.addEventListener('click', () => {
      $$('.svc-list button', root).forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      book.svc = b.dataset.svc; book.dur = b.dataset.dur;
    }));
    conf.addEventListener('click', () => {
      const d = days[book.day];
      const tk = $('[data-ticket]', root);
      tk.innerHTML = '';
      [['Serviço', book.svc], ['Duração', book.dur], ['Quando', `${wd[d.getDay()]}, ${d.getDate()} ${mo[d.getMonth()]} · ${book.slot}`]].forEach(([k, v]) => {
        const row = document.createElement('div');
        const a = document.createElement('span'); a.textContent = k;
        const b = document.createElement('b'); b.textContent = v;
        row.append(a, b); tk.appendChild(row);
      });
      $('[data-book-form]', root).hidden = true;
      const done = $('[data-book-done]', root);
      done.hidden = false;
      kick(0.6);
      if (!reduced) gsap.from($$('.chk, h3, p, .ticket, .link-btn', done), { y: 16, opacity: 0, duration: 0.5, stagger: 0.06 });
    });
    $('[data-book-again]', root).addEventListener('click', () => {
      book.slot = null; renderDays(); renderSlots();
      $('[data-book-form]', root).hidden = false; $('[data-book-done]', root).hidden = true;
    });
    renderDays(); renderSlots();

    // ── Cardápio ──
    const MENU = [
      ['Pizzas', [
        ['Margherita', 'Tomate, muçarela de búfala e manjericão', 52, '#e9b16b,#b4381f'],
        ['Calabresa', 'Calabresa artesanal e cebola roxa', 48, '#d98a4e,#7b1e10'],
        ['Quatro queijos', 'Muçarela, gorgonzola, parmesão e provolone', 56, '#f0d39a,#c08a3e'],
      ]],
      ['Massas', [
        ['Carbonara', 'Spaghetti, guanciale, ovo e pecorino', 46, '#f3e1b0,#c99a45'],
        ['Lasanha da nonna', 'Ragu de carne e bechamel', 54, '#e08a5a,#8f2e18'],
        ['Nhoque ao sugo', 'Nhoque de batata com molho de tomate', 42, '#f2c48e,#c2502a'],
      ]],
      ['Bebidas', [
        ['Limonada siciliana', 'Feita na hora', 14, '#f6f0a8,#c9c25a'],
        ['Soda italiana', 'Maçã verde ou frutas vermelhas', 16, '#bfe7c2,#d0566b'],
        ['Vinho da casa', 'Taça de tinto ou branco', 24, '#a3304a,#4a0f1f'],
      ]],
    ];
    const cart = { n: 0, total: 0 };
    const catsEl = $('[data-cats]', root), dishesEl = $('[data-dishes]', root), cartEl = $('[data-cart]', root);
    function renderDishes(c) {
      dishesEl.innerHTML = '';
      MENU[c][1].forEach(([name, desc, price, grad]) => {
        const li = document.createElement('li');
        li.innerHTML = `<i class="pic" style="background:linear-gradient(150deg,${grad})"></i><div><b></b><small></small><span class="pr"></span></div><button type="button">+</button>`;
        $('b', li).textContent = name;
        $('small', li).textContent = desc;
        $('.pr', li).textContent = money(price);
        const add = $('button', li);
        add.setAttribute('aria-label', `Adicionar ${name}`);
        add.addEventListener('click', () => {
          cart.n++; cart.total += price;
          $('[data-cart-count]', root).textContent = `Ver pedido · ${cart.n} ${cart.n === 1 ? 'item' : 'itens'}`;
          $('[data-cart-total]', root).textContent = money(cart.total);
          cartEl.classList.add('on');
          kick(0.25);
          if (!reduced) gsap.fromTo(add, { scale: 0.8 }, { scale: 1, duration: 0.45, ease: 'back.out(3)' });
        });
        dishesEl.appendChild(li);
      });
    }
    MENU.forEach(([cat], i) => {
      const b = document.createElement('button');
      b.type = 'button'; b.setAttribute('role', 'tab'); b.textContent = cat;
      b.setAttribute('aria-selected', String(i === 0));
      b.addEventListener('click', () => {
        $$('button', catsEl).forEach((x) => x.setAttribute('aria-selected', String(x === b)));
        renderDishes(i);
      });
      catsEl.appendChild(b);
    });
    renderDishes(0);

    // ── Evento ──
    const stages = [
      [['16:00', 'Coletivo Maré', 'Abertura · house'], ['17:30', 'Duna Rosa', 'Indie eletrônico'], ['19:00', 'Kairo', 'Ao vivo · synth'], ['21:00', 'Vértice', 'Headliner · techno']],
      [['16:30', 'Lia Moraes', 'Voz e violão'], ['18:00', 'Os Tropicais', 'Samba-rock'], ['19:45', 'Banda Faro', 'Rock alternativo'], ['21:30', 'Neon Baile', 'Encerramento · funk']],
    ];
    const live = [2, 1];
    const lu = $('[data-lineup]', root);
    function renderLineup(s) {
      lu.innerHTML = '';
      stages[s].forEach((a, i) => {
        const li = document.createElement('li');
        li.innerHTML = '<time></time><div><b></b><small></small></div><span></span>';
        $('time', li).textContent = a[0]; $('b', li).textContent = a[1]; $('small', li).textContent = a[2];
        if (i === live[s]) { const n = $('span', li); n.className = 'now-badge'; n.textContent = 'AGORA'; }
        lu.appendChild(li);
      });
      if (!reduced) gsap.from(lu.children, { x: -10, opacity: 0, duration: 0.4, stagger: 0.05 });
    }
    $$('.stage-tabs button', root).forEach((b) => b.addEventListener('click', () => {
      $$('.stage-tabs button', root).forEach((x) => x.setAttribute('aria-selected', String(x === b)));
      renderLineup(Number(b.dataset.stage));
    }));
    renderLineup(0);
  })();

  // ════════════════════════════════════════════════════════════════════════
  // ORÇAMENTO: cards de preço + calculadora + formulário
  // ════════════════════════════════════════════════════════════════════════
  (function quote() {
    const items = $$('.price[data-id]').map((el) => ({
      id: el.dataset.id,
      kind: el.dataset.kind,
      name: el.dataset.name,
      price: Number(el.dataset.price),
      desc: $('.price-desc', el).textContent.trim(),
    }));
    items.push({ id: 'manutencao', kind: 'monthly', name: 'Manutenção mensal', price: CONFIG.maintenance, desc: 'Até 2 alterações por mês e suporte' });
    const byId = Object.fromEntries(items.map((s) => [s.id, s]));
    const state = Object.fromEntries(items.map((s) => [s.id, false]));

    // O que cada pacote já inclui e quantos meses de manutenção dá de brinde
    const PKG = {
      pulso: { covers: ['cartao'], months: 0 },
      frequencia: { covers: ['cartao', 'agendamento'], months: 1, core: ['agendamento'] },
      amplitude: { covers: ['cartao', 'remake', 'kit', 'agendamento|display'], months: 2, core: ['remake', 'agendamento|display'] },
    };
    const pkgIds = Object.keys(PKG);
    const currentPkg = () => pkgIds.find((p) => state[p]) || null;

    // Itens cobertos (por um pacote, ou o kit pelo remake) → { id: motivo }
    function coveredBy(st, pkg) {
      const out = {};
      if (pkg) {
        for (const c of PKG[pkg].covers) {
          if (c.includes('|')) {
            const hit = c.split('|').find((x) => st[x]);
            if (hit) out[hit] = byId[pkg].name;
          } else if (st[c]) out[c] = byId[pkg].name;
        }
      }
      if (!out.kit && st.kit && st.remake) out.kit = 'Remake visual';
      return out;
    }

    // ── Linhas da calculadora ──
    const opts = $('[data-opts]');
    const groups = [['Pacotes', 'pkg'], ['Avulsos', 'item'], ['Mensal', 'monthly']];
    groups.forEach(([label, kind]) => {
      const h = document.createElement('p');
      h.className = 'opt-group'; h.textContent = label;
      opts.appendChild(h);
      const box = document.createElement('div');
      box.className = 'opts';
      items.filter((s) => s.kind === kind).forEach((s) => {
        const row = document.createElement('div');
        row.className = 'opt';
        row.dataset.id = s.id;
        row.innerHTML = `<input type="checkbox" id="o-${s.id}"><label class="opt-name" for="o-${s.id}"></label><span class="opt-price"></span>`;
        const lab = $('.opt-name', row);
        lab.textContent = s.name;
        const sub = document.createElement('span');
        sub.className = 'opt-sub'; sub.textContent = s.desc;
        lab.appendChild(sub);
        $('.opt-price', row).textContent = s.kind === 'monthly' ? `${money(s.price)}/mês` : money(s.price);
        $('input', row).addEventListener('change', (e) => set(s.id, e.target.checked));
        box.appendChild(row);
      });
      opts.appendChild(box);
    });

    const totalEl = $('[data-total]');
    const shown = { v: 0 };

    function set(id, on, quiet) {
      if (on && PKG[id]) pkgIds.forEach((p) => { if (p !== id) state[p] = false; });
      state[id] = on;
      render(quiet);
    }

    function compute() {
      const pkg = currentPkg();
      const cov = coveredBy(state, pkg);
      const lines = [];
      let total = 0;
      if (pkg) { lines.push({ label: byId[pkg].name, value: money(byId[pkg].price) }); total += byId[pkg].price; }
      items.filter((s) => s.kind === 'item' && state[s.id]).forEach((s) => {
        if (cov[s.id]) lines.push({ label: s.name, value: 'incluso', inc: true, why: cov[s.id] });
        else { lines.push({ label: s.name, value: money(s.price) }); total += s.price; }
      });
      const months = pkg ? PKG[pkg].months : 0;
      if (state.manutencao) lines.push({ label: 'Manutenção', value: `${money(CONFIG.maintenance)}/mês`, monthly: true });
      return { pkg, cov, lines, total, months };
    }

    // Melhor pacote para o que foi escolhido avulso
    function suggestion() {
      if (currentPkg()) return null;
      const chosen = items.filter((s) => s.kind === 'item' && state[s.id]).map((s) => s.id);
      if (!chosen.length) return null;
      let best = null;
      for (const p of pkgIds) {
        const def = PKG[p];
        if (!def.core) continue;
        const coreOk = def.core.every((c) => c.split('|').some((x) => state[x]));
        if (!coreOk) continue;
        const sim = { ...state, [p]: true };
        const cov = coveredBy(sim, p);
        const covIds = Object.keys(cov).filter((id) => cov[id] === byId[p].name);
        // O kit coberto pelo remake já não era cobrado
        const nowCov = coveredBy(state, null);
        const before = covIds.reduce((a, id) => a + (nowCov[id] ? 0 : byId[id].price), 0);
        const after = byId[p].price;
        // O que o pacote dá além do que a pessoa escolheu
        const gains = def.covers.filter((c) => !c.includes('|') && !state[c] && !(c === 'kit' && state.remake)).map((c) => byId[c]);
        if (def.covers.some((c) => c === 'agendamento|display') && !covIds.some((id) => id === 'agendamento' || id === 'display')) gains.push(byId.agendamento);
        const gainValue = gains.reduce((a, s) => a + s.price, 0) + def.months * CONFIG.maintenance;
        const diff = after - before;
        if (diff < 0 || diff < gainValue) {
          const score = gainValue - diff;
          if (!best || score > best.score) best = { p, covIds, diff, gains, months: def.months, score };
        }
      }
      return best;
    }

    function render(quiet) {
      const { pkg, cov, lines, total, months } = compute();
      $$('.opt', opts).forEach((row) => {
        const id = row.dataset.id;
        row.classList.toggle('is-on', state[id]);
        row.classList.toggle('is-covered', !!cov[id]);
        $('input', row).checked = state[id];
        const pr = $('.opt-price', row);
        const s = byId[id];
        pr.textContent = cov[id] ? 'incluso' : s.kind === 'monthly' ? `${money(s.price)}/mês` : money(s.price);
      });
      $$('[data-add]').forEach((b) => {
        const on = state[b.dataset.add];
        b.classList.toggle('is-added', on);
        b.textContent = on ? 'No orçamento ✓' : 'Adicionar';
      });

      const ul = $('[data-lines]');
      ul.innerHTML = '';
      if (!lines.length) {
        const li = document.createElement('li'); li.className = 'sum-empty'; li.textContent = 'Nenhum item escolhido ainda.'; ul.appendChild(li);
      } else {
        lines.forEach((l) => {
          const li = document.createElement('li');
          if (l.inc) li.className = 'is-inc';
          const a = document.createElement('span'); a.textContent = l.label;
          const b = document.createElement('span'); b.textContent = l.value;
          li.append(a, b); ul.appendChild(li);
        });
        if (!quiet && !reduced) gsap.from(ul.children, { x: -8, opacity: 0, duration: 0.3, stagger: 0.03 });
      }
      const count = lines.length;
      $('[data-count-items]').textContent = `${count} ${count === 1 ? 'item' : 'itens'}`;

      const notes = [];
      if (months) notes.push(`O ${byId[pkg].name} inclui ${months === 1 ? 'o 1º mês' : `${months} meses`} de manutenção grátis.`);
      if (state.manutencao) notes.push(`Manutenção: ${money(CONFIG.maintenance)} por mês${months ? ', começando depois do período grátis' : ''}.`);
      if (cov.kit === 'Remake visual') notes.push('O remake visual já inclui o kit para redes.');
      const extra = $('[data-extra]');
      extra.hidden = !notes.length; extra.textContent = notes.join(' ');

      gsap.to(shown, {
        v: total, duration: reduced ? 0 : 0.6, ease: 'power3.out', overwrite: true,
        onUpdate: () => { totalEl.textContent = fmt(Math.round(shown.v)); },
      });
      if (!quiet && !reduced && total) gsap.fromTo('.sum-value', { scale: 1.06 }, { scale: 1, duration: 0.4, ease: 'back.out(2)', overwrite: true });

      const sug = $('[data-suggest]');
      const best = suggestion();
      if (best) {
        const name = byId[best.p].name;
        const extras = best.gains.map((s) => s.name.toLowerCase());
        if (best.months) extras.push(best.months === 1 ? '1 mês de manutenção' : `${best.months} meses de manutenção`);
        const list = extras.length > 1 ? extras.slice(0, -1).join(', ') + ' e ' + extras[extras.length - 1] : extras[0];
        $('[data-suggest-text]').textContent = best.diff < 0
          ? `Isso cabe no ${name}: economize ${money(-best.diff)}${list ? ` e ganhe ${list}` : ''}.`
          : best.diff === 0
            ? `Pelo mesmo valor, o ${name} ainda inclui ${list}.`
            : `Por + ${money(best.diff)}, o ${name} inclui também ${list}.`;
        sug.dataset.p = best.p;
        sug.dataset.cov = best.covIds.join(',');
        if (sug.hidden) { sug.hidden = false; if (!reduced) gsap.from(sug, { y: 12, opacity: 0, duration: 0.45 }); }
      } else sug.hidden = true;
    }

    $('[data-suggest-apply]').addEventListener('click', () => {
      const sug = $('[data-suggest]');
      const p = sug.dataset.p;
      sug.dataset.cov.split(',').filter(Boolean).forEach((id) => { state[id] = false; });
      if (state.kit && state.remake) state.kit = false;
      set(p, true);
      toast(`Trocado pelo ${byId[p].name}.`);
    });

    $$('[data-add]').forEach((b) => b.addEventListener('click', () => {
      const id = b.dataset.add;
      const was = state[id];
      set(id, !was);
      if (!was) {
        toast(`${byId[id].name} no orçamento.`);
        if (!reduced) gsap.fromTo(b, { scale: 0.94 }, { scale: 1, duration: 0.45, ease: 'back.out(3)' });
      }
    }));

    // Mensagem do pedido
    const form = $('[data-form]');
    function buildMessage() {
      const f = new FormData(form);
      const { lines, total, months, pkg } = compute();
      const out = ['*Pedido de orçamento: Amplitude Lab*', ''];
      out.push(`Nome: ${f.get('nome').trim()}`);
      if (f.get('negocio').trim()) out.push(`Empresa/projeto: ${f.get('negocio').trim()}`);
      out.push(`Segmento: ${f.get('segmento')}`);
      out.push('', '*Itens*');
      lines.forEach((l) => out.push(`• ${l.label}: ${l.inc ? `incluso (${l.why})` : l.value}`));
      out.push('', `*Total único: ${money(total)}*`);
      if (months) out.push(`${byId[pkg].name} com ${months === 1 ? '1 mês' : `${months} meses`} de manutenção grátis`);
      out.push('', `Prazo: ${f.get('prazo')}`);
      if (f.get('mensagem').trim()) out.push('', f.get('mensagem').trim());
      return out.join('\n');
    }
    function validate() {
      const msg = $('[data-form-msg]');
      msg.textContent = '';
      const nome = $('#f-nome');
      const field = nome.closest('.field');
      field.classList.toggle('is-error', !nome.value.trim());
      if (!compute().lines.length) {
        msg.textContent = 'Escolha pelo menos um item acima.';
        if (!reduced) gsap.fromTo('[data-opts]', { x: -10 }, { x: 0, duration: 0.4, ease: 'elastic.out(1, 0.3)' });
        return false;
      }
      if (!nome.value.trim()) {
        if (!reduced) gsap.fromTo(field, { x: -10 }, { x: 0, duration: 0.4, ease: 'elastic.out(1, 0.3)' });
        nome.focus();
        return false;
      }
      return true;
    }
    $('#f-nome').addEventListener('input', (e) => { if (e.target.value.trim()) e.target.closest('.field').classList.remove('is-error'); });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!validate()) return;
      const url = waLink(buildMessage());
      const win = window.open(url, '_blank', 'noopener');
      if (!win) location.href = url;
      $('[data-form-msg]').textContent = 'Pedido pronto! Finalize o envio no WhatsApp.';
      toast('Abrindo o WhatsApp com o seu pedido…');
    });
    $('[data-copy]').addEventListener('click', async () => {
      if (!validate()) return;
      const text = buildMessage();
      try {
        await navigator.clipboard.writeText(text);
      } catch (err) {
        const ta = document.createElement('textarea');
        ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
        document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove();
      }
      toast('Pedido copiado.');
    });

    // Link direto para um pacote: index.html?pacote=frequencia#monte
    const pre = new URLSearchParams(location.search).get('pacote');
    if (pre && byId[pre]) state[pre] = true;
    render(true);
  })();

  // ── Início ───────────────────────────────────────────────────────────────
  runLoader().then(() => {
    fontsReady.then(heroIntro);
    ScrollTrigger.refresh();
  });
  fontsReady.then(() => ScrollTrigger.refresh());
})();
