/* AMPLITUDE LAB: animações (GSAP + ScrollTrigger + SplitText), frasco com
   líquido em onda, campo de partículas 3D no herói, modelos por segmento
   rodando dentro do celular, calculadora de orçamento e envio pelo WhatsApp. */
(() => {
  'use strict';

  // ── Configuração: edite aqui ─────────────────────────────────────────────
  const CONFIG = {
    // WhatsApp com DDI + DDD + número, só dígitos (ex.: "5511999999999").
    whatsapp: '5511952182016',
    // Cada orçamento enviado entra no CRM como lead e proposta
    crm: { url: 'https://ozregdgphaxkxumsujys.supabase.co/functions/v1/site-quote', slug: 'amplitudelab' },
    instagram: 'amplitude_lab', // usuário sem @
    currency: 'R$',
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
  // Todo botão com data-wa abre o WhatsApp com a mensagem pronta
  $$('[data-wa]').forEach((a) => { a.href = waLink(a.dataset.wa); });

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
  let hero3d = null;
  function agitate() {
    kick(0.9);
    if (hero3d) { const r = stage.getBoundingClientRect(); hero3d.ripple(r.left + r.width / 2, r.bottom + 40, 1.5); }
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
  $$('.nav-links a[href^="#"]').forEach((a) => {
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
    const heroEl = $('.hero');
    function draw() {
      if (!visible || heroEl.classList.contains('gl-on')) return;
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
  // MODELOS POR SEGMENTO: o site de cada modelo roda dentro do celular
  // ════════════════════════════════════════════════════════════════════════
  (function lab() {
    const root = $('[data-lab]');
    const MODELS = [
      { slug: 'barbearia', seg: 'Barbearia', brand: 'Navalha Nobre', pkg: 'Site completo', from: 1200, prazo: '5 a 10 dias', ph: '1836983', who: 'uma barbearia',
        acao: 'Agenda serviço, barbeiro e horário', desc: 'Tabela de preços, agendamento em cinco passos, equipe, galeria de cortes e localização com horários.' },
      { slug: 'tatuagem', seg: 'Estúdio de tatuagem', brand: 'Roberto', pkg: 'Site completo', from: 1200, prazo: '5 a 10 dias', ph: '6593479', who: 'um estúdio de tatuagem',
        acao: 'Pede orçamento com ideia, local e tamanho', desc: 'Estilos de traço, portfólio na pele, agenda com guest spots e orçamento guiado com mapa do corpo.' },
      { slug: 'hamburgueria', seg: 'Hamburgueria', brand: 'Brasa Burger', pkg: 'Site completo', from: 1200, prazo: '5 a 10 dias', ph: '18713424', who: 'uma hamburgueria',
        acao: 'Monta o lanche e envia o pedido', desc: 'Cardápio com fotos e combos, lanche com adicionais, sacola com entrega ou retirada e links para iFood, 99 e Keeta.' },
      { slug: 'moda', seg: 'Loja de roupas', brand: 'Maré', pkg: 'Loja virtual', from: 2500, prazo: '15 a 30 dias', ph: '19684582', who: 'uma loja de roupas',
        acao: 'Escolhe cor e tamanho e compra', desc: 'Coleções, categorias, busca, cores e tamanhos, favoritos, sacola com frete e checkout ou WhatsApp.' },
      { slug: 'decoracao', seg: 'Quadros e decoração', brand: 'Parede Viva', pkg: 'Site completo', from: 1200, prazo: '5 a 10 dias', ph: '4857768', who: 'uma loja de quadros e decoração',
        acao: 'Vê o quadro na parede e pede orçamento', desc: 'Simulador do quadro em escala real na sala, quarto ou escritório, com medida, moldura e lista de orçamento.' },
    ];
    const list = $('[data-demos]', root);
    MODELS.forEach((m, i) => {
      const li = document.createElement('li');
      li.innerHTML = `<button class="demo-btn" type="button" role="tab" id="t-${m.slug}" aria-controls="lab-screen" aria-selected="${i === 0}">` +
        `<img class="demo-ph" src="modelos/img/${m.ph}-p.webp" alt="" loading="lazy" decoding="async">` +
        `<span><span class="demo-name"></span><span class="demo-meta"></span></span>` +
        '<span class="demo-eq" aria-hidden="true"><i></i><i></i><i></i><i></i></span></button>';
      $('.demo-name', li).textContent = m.seg;
      $('.demo-meta', li).textContent = `${m.brand} · ${m.pkg}`;
      list.appendChild(li);
    });
    const tabs = $$('.demo-btn', root);
    const screen = $('[data-screen]', root), load = $('[data-load]', root), phone = $('.phone', root);
    const frames = {};
    let cur = 0, started = false;

    // O site é desenhado em 390 px de largura e reduzido para caber na tela do celular
    function fit(f) {
      const w = screen.clientWidth, h = screen.clientHeight;
      if (!w) return;
      const k = w / 390;
      f.style.width = '390px';
      f.style.height = `${h / k}px`;
      f.style.transform = `scale(${k})`;
    }
    new ResizeObserver(() => Object.values(frames).forEach(fit)).observe(screen);

    function frameFor(m) {
      if (frames[m.slug]) return frames[m.slug];
      const f = document.createElement('iframe');
      f.title = `Modelo ${m.brand} (${m.seg})`;
      f.loading = 'eager';
      f.addEventListener('load', () => { f.dataset.ready = '1'; if (MODELS[cur] === m) load.classList.add('off'); });
      f.src = `modelos/${m.slug}/fotos/`;
      screen.appendChild(f);
      fit(f);
      frames[m.slug] = f;
      return f;
    }
    function paint() {
      const m = MODELS[cur];
      const f = frameFor(m);
      Object.values(frames).forEach((x) => { x.style.visibility = x === f ? 'visible' : 'hidden'; });
      load.classList.toggle('off', !!f.dataset.ready);
    }

    function details() {
      const m = MODELS[cur];
      $('[data-spec]', root).textContent = `Modelo ${String(cur + 1).padStart(2, '0')} / ${String(MODELS.length).padStart(2, '0')}`;
      $('[data-out-pkg]', root).textContent = `${m.pkg} · a partir de ${money(m.from)}`;
      $('[data-out-prazo]', root).textContent = m.prazo;
      $('[data-out-acao]', root).textContent = m.acao;
      $('[data-open]', root).href = `modelos/${m.slug}/fotos/`;
      $('[data-lab-wa]', root).dataset.orcSeg = m.seg === 'Hamburgueria' ? 'Lanchonete ou hamburgueria' : m.seg;
    }

    function show(i, focus) {
      const next = (i + tabs.length) % tabs.length;
      if (next === cur && started) { if (focus) tabs[cur].focus(); return; }
      cur = next;
      tabs.forEach((t, k) => { t.setAttribute('aria-selected', String(k === cur)); t.tabIndex = k === cur ? 0 : -1; });
      if (focus) tabs[cur].focus();
      tabs[cur].scrollIntoView({ block: 'nearest', inline: 'center', behavior: reduced ? 'auto' : 'smooth' });
      const m = MODELS[cur];
      details();
      started = true;
      paint();
      kick(0.3);
      const title = $('[data-out-title]', root), meta = $('[data-out-meta]', root), desc = $('[data-out-desc]', root);
      const write = () => { title.textContent = m.brand; meta.textContent = `${m.seg} · ${m.pkg}`; desc.textContent = m.desc; };
      if (reduced) { write(); return; }
      gsap.timeline()
        .to([title, meta, desc], { yPercent: -30, opacity: 0, duration: 0.15, ease: 'power3.in', onComplete: write })
        .fromTo([title, meta, desc], { yPercent: 40, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.45, stagger: 0.05 });
      gsap.fromTo(phone, { scale: 0.97, rotateY: -8, transformPerspective: 1000 }, { scale: 1, rotateY: 0, duration: 0.8, ease: 'back.out(1.6)' });
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
    details();

    // O primeiro site só carrega quando a seção se aproxima
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      if (!started) { started = true; paint(); }
    }, { rootMargin: '500px 0px' });
    io.observe(root);

    // Cards de segmento levam direto ao modelo
    $$('[data-demo-go]').forEach((b) => b.addEventListener('click', () => {
      show(Number(b.dataset.demoGo));
      $('#demos').scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
    }));
  })();

  // ════════════════════════════════════════════════════════════════════════
  // ORÇAMENTO: segmento + o que o site faz → tamanho recomendado → WhatsApp
  // ════════════════════════════════════════════════════════════════════════
  (function quote() {
    // Faixas do plano de negócio (valores de partida)
    const PKGS = [
      { id: 'vitrine', name: 'Página vitrine', lo: 600, hi: 1200, prazo: '2 a 4 dias', desc: 'Uma página com serviços, galeria, localização e WhatsApp' },
      { id: 'completo', name: 'Site completo', lo: 1200, hi: 2500, prazo: '5 a 10 dias', desc: 'Várias seções, agendamento, orçamento ou pedidos e domínio próprio' },
      { id: 'loja', name: 'Loja virtual', lo: 2500, hi: 5000, plus: true, prazo: '15 a 30 dias', desc: 'Catálogo, carrinho, checkout e pagamento online' },
    ];
    const MNT = [
      { id: 'nenhum', name: 'Sem plano', price: 0, desc: 'Ajustes avulsos quando você precisar' },
      { id: 'basico', name: 'Básico', price: 79, desc: 'Hospedagem acompanhada, ajustes de conteúdo e suporte' },
      { id: 'completo-mensal', name: 'Completo', price: 199, desc: 'Ajustes e novidades sem custo extra, dentro de um limite de horas' },
    ];
    const FEATS = [
      { id: 'whats', name: 'WhatsApp, localização e horários', tier: 0 },
      { id: 'galeria', name: 'Galeria de fotos ou portfólio', tier: 0 },
      { id: 'agenda', name: 'Agendamento de horários', tier: 1 },
      { id: 'orcamento', name: 'Pedido de orçamento guiado', tier: 1 },
      { id: 'cardapio', name: 'Cardápio com pedido no WhatsApp', tier: 1 },
      { id: 'equipe', name: 'Equipe, depoimentos e várias seções', tier: 1 },
      { id: 'carrinho', name: 'Catálogo com carrinho e frete', tier: 2 },
      { id: 'pagamento', name: 'Pagamento online (Pix e cartão)', tier: 2 },
    ];
    // O que cada segmento costuma precisar (o cliente pode mudar)
    const SEG_FEATS = {
      'Barbearia': ['whats', 'galeria', 'agenda', 'equipe'],
      'Estúdio de tatuagem': ['whats', 'galeria', 'orcamento'],
      'Lanchonete ou hamburgueria': ['whats', 'cardapio'],
      'Loja de roupas': ['whats', 'carrinho', 'pagamento'],
      'Quadros e decoração': ['whats', 'galeria', 'orcamento'],
      'Outro': ['whats'],
    };
    const state = { seg: null, feats: new Set(), pkg: null, manual: false, mnt: 'nenhum' };
    const pkgById = Object.fromEntries(PKGS.map((p) => [p.id, p]));
    const mntById = Object.fromEntries(MNT.map((m) => [m.id, m]));
    const range = (p) => `${money(p.lo)} a ${money(p.hi)}${p.plus ? ' ou mais' : ''}`;

    function row(type, name, id, title, sub, right) {
      const r = document.createElement('div');
      r.className = 'opt';
      r.dataset.id = id;
      r.innerHTML = `<input type="${type}" name="${name}" id="o-${id}"><label class="opt-name" for="o-${id}"></label><span class="opt-price"></span>`;
      const lab = $('.opt-name', r);
      lab.textContent = title;
      if (sub) { const s2 = document.createElement('span'); s2.className = 'opt-sub'; s2.textContent = sub; lab.appendChild(s2); }
      $('.opt-price', r).textContent = right;
      return r;
    }
    const featBox = $('[data-feats]'), pkgBox = $('[data-pkgs]'), mntBox = $('[data-mnt]');
    FEATS.forEach((f) => {
      const r = row('checkbox', 'feat', f.id, f.name, '', PKGS[f.tier].name);
      $('input', r).addEventListener('change', (e) => { e.target.checked ? state.feats.add(f.id) : state.feats.delete(f.id); render(); });
      featBox.appendChild(r);
    });
    PKGS.forEach((p) => {
      const r = row('radio', 'pkg', p.id, p.name, `${p.desc} · ${p.prazo}`, `${money(p.lo)} a ${fmt(p.hi)}${p.plus ? '+' : ''}`);
      $('input', r).addEventListener('change', () => { state.pkg = p.id; state.manual = true; render(); });
      pkgBox.appendChild(r);
    });
    MNT.forEach((m) => {
      const r = row('radio', 'mnt', m.id, m.name, m.desc, m.price ? `${money(m.price)}/mês` : '—');
      $('input', r).addEventListener('change', () => { state.mnt = m.id; render(); });
      mntBox.appendChild(r);
    });
    $$('[data-seg]').forEach((c) => c.addEventListener('click', () => {
      state.seg = c.dataset.seg;
      state.feats = new Set(SEG_FEATS[state.seg]);
      state.manual = false;
      render();
      kick(0.25);
    }));

    const recommended = () => PKGS[Math.max(0, ...[...state.feats].map((id) => FEATS.find((f) => f.id === id).tier))];
    const currentPkg = () => (state.manual && state.pkg ? pkgById[state.pkg] : recommended());

    const totalEl = $('[data-total]');
    const shown = { v: 0 };
    function render(quiet) {
      const rec = recommended(), pkg = currentPkg();
      const touched = state.seg || state.feats.size || state.manual;
      $$('[data-seg]').forEach((c) => c.setAttribute('aria-checked', String(c.dataset.seg === state.seg)));
      $$('.opt', featBox).forEach((r) => { const on = state.feats.has(r.dataset.id); r.classList.toggle('is-on', on); $('input', r).checked = on; });
      $$('.opt', pkgBox).forEach((r) => { const on = touched && r.dataset.id === pkg.id; r.classList.toggle('is-on', on); $('input', r).checked = on; });
      $$('.opt', mntBox).forEach((r) => { const on = r.dataset.id === state.mnt; r.classList.toggle('is-on', on); $('input', r).checked = on; });

      const recEl = $('[data-rec]');
      recEl.hidden = !state.feats.size;
      if (state.feats.size) {
        recEl.innerHTML = '';
        const b = document.createElement('b'); b.textContent = rec.name;
        if (PKGS.indexOf(pkg) < PKGS.indexOf(rec)) recEl.append('Para o que você marcou, o tamanho indicado é ', b, '. O escolhido pode não comportar tudo.');
        else recEl.append('Indicado para o que você marcou: ', b, '.');
      }

      const lines = [];
      if (state.seg) lines.push(['Segmento', state.seg]);
      if (touched) lines.push([pkg.name, range(pkg)]);
      const feats = FEATS.filter((f) => state.feats.has(f.id));
      if (feats.length) lines.push(['Recursos', `${feats.length} ${feats.length === 1 ? 'item' : 'itens'}`]);
      if (state.mnt !== 'nenhum') lines.push([`Plano ${mntById[state.mnt].name}`, `${money(mntById[state.mnt].price)}/mês`]);
      const ul = $('[data-lines]');
      ul.innerHTML = '';
      if (!lines.length) {
        const li = document.createElement('li'); li.className = 'sum-empty'; li.textContent = 'Escolha o segmento e o que o site precisa fazer.'; ul.appendChild(li);
      } else {
        lines.forEach(([a, b]) => {
          const li = document.createElement('li');
          const x = document.createElement('span'); x.textContent = a;
          const y = document.createElement('span'); y.textContent = b;
          li.append(x, y); ul.appendChild(li);
        });
        if (!quiet && !reduced) gsap.from(ul.children, { x: -8, opacity: 0, duration: 0.3, stagger: 0.03 });
      }
      $('[data-count-items]').textContent = `${lines.length} ${lines.length === 1 ? 'item' : 'itens'}`;
      $('[data-range]').textContent = touched ? range(pkg) : 'escolha o segmento';
      const notes = [];
      if (touched) notes.push(`Prazo: ${pkg.prazo}. Pagamento: 50% na aprovação e 50% na entrega.`);
      if (state.mnt !== 'nenhum') notes.push(`Plano mensal ${mntById[state.mnt].name}: ${money(mntById[state.mnt].price)} por mês, cancele quando quiser.`);
      const extra = $('[data-extra]');
      extra.hidden = !notes.length; extra.textContent = notes.join(' ');

      const total = touched ? pkg.lo : 0;
      gsap.to(shown, {
        v: total, duration: reduced ? 0 : 0.6, ease: 'power3.out', overwrite: true,
        onUpdate: () => { totalEl.textContent = fmt(Math.round(shown.v)); },
      });
      if (!quiet && !reduced && total) gsap.fromTo('.sum-value', { scale: 1.06 }, { scale: 1, duration: 0.4, ease: 'back.out(2)', overwrite: true });

      $$('[data-add]').forEach((b) => {
        const id = b.dataset.add;
        const on = pkgById[id] ? touched && pkg.id === id : state.mnt === id;
        b.classList.toggle('is-added', on);
        b.textContent = on ? 'No orçamento ✓' : (pkgById[id] ? 'Simular no orçamento' : 'Simular');
      });
    }

    // Botões dos cards de preço levam a escolha para o orçamento
    $$('[data-add]').forEach((b) => b.addEventListener('click', () => {
      const id = b.dataset.add;
      if (pkgById[id]) { state.pkg = id; state.manual = true; } else state.mnt = id;
      render();
      toast(`${pkgById[id] ? pkgById[id].name : 'Plano ' + mntById[id].name} no orçamento.`);
      $('#monte').scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
    }));

    // Botões de orçamento levam ao formulário com a escolha marcada. O WhatsApp só abre no envio.
    document.addEventListener('click', (e) => {
      const a = e.target.closest('[data-orc]');
      if (!a) return;
      e.preventDefault();
      const { orcSeg, orcPkg, orcMnt } = a.dataset;
      if (orcSeg) { state.seg = orcSeg; state.feats = new Set(SEG_FEATS[orcSeg] || []); state.manual = false; }
      if (orcPkg) { state.pkg = orcPkg; state.manual = true; }
      if (orcMnt) state.mnt = orcMnt;
      render();
      $('#monte').scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
    });

    // Mensagem do pedido
    const form = $('[data-form]');
    function buildMessage() {
      const f = new FormData(form);
      const pkg = currentPkg();
      const out = ['*Pedido de orçamento: Amplitude Lab*', ''];
      out.push(`Nome: ${f.get('nome').trim()}`);
      out.push(`WhatsApp: ${f.get('whatsapp').trim()}`);
      if (f.get('negocio').trim()) out.push(`Negócio: ${f.get('negocio').trim()}`);
      if (f.get('instagram').trim()) out.push(`Instagram: ${f.get('instagram').trim()}`);
      out.push(`Segmento: ${state.seg || 'não informado'}`);
      out.push('', `*${pkg.name}*: ${range(pkg)} · ${pkg.prazo}`);
      const feats = FEATS.filter((x) => state.feats.has(x.id));
      if (feats.length) { out.push('', '*O site precisa de*'); feats.forEach((x) => out.push(`• ${x.name}`)); }
      if (state.mnt !== 'nenhum') out.push('', `Plano mensal: ${mntById[state.mnt].name} (${money(mntById[state.mnt].price)}/mês)`);
      out.push('', `Para quando: ${f.get('prazo')}`);
      if (f.get('mensagem').trim()) out.push('', f.get('mensagem').trim());
      return out.join('\n');
    }
    function validate() {
      const msg = $('[data-form-msg]');
      msg.textContent = '';
      const nome = $('#f-nome');
      const field = nome.closest('.field');
      field.classList.toggle('is-error', !nome.value.trim());
      if (!state.seg) {
        msg.textContent = 'Escolha o seu segmento lá em cima.';
        if (!reduced) gsap.fromTo('[data-segs]', { x: -10 }, { x: 0, duration: 0.4, ease: 'elastic.out(1, 0.3)' });
        return false;
      }
      if (!nome.value.trim()) {
        if (!reduced) gsap.fromTo(field, { x: -10 }, { x: 0, duration: 0.4, ease: 'elastic.out(1, 0.3)' });
        nome.focus();
        return false;
      }
      const zap = $('#f-zap');
      const zapDigits = zap.value.replace(/\D/g, '');
      const zapOk = zapDigits.length >= 10 && zapDigits.length <= 13;
      zap.closest('.field').classList.toggle('is-error', !zapOk);
      if (!zapOk) {
        if (!reduced) gsap.fromTo(zap.closest('.field'), { x: -10 }, { x: 0, duration: 0.4, ease: 'elastic.out(1, 0.3)' });
        zap.focus();
        return false;
      }
      return true;
    }
    $('#f-nome').addEventListener('input', (e) => { if (e.target.value.trim()) e.target.closest('.field').classList.remove('is-error'); });

    // Envia em segundo plano: não segura a abertura do WhatsApp, mesmo se a internet falhar.
    function sendLead() {
      const f = new FormData(form);
      const body = {
        slug: CONFIG.crm.slug, nome: f.get('nome'), whatsapp: f.get('whatsapp'), negocio: f.get('negocio'), instagram: f.get('instagram'),
        segmento: state.seg, pacote: currentPkg().id, plano: state.mnt, prazo: f.get('prazo'), mensagem: f.get('mensagem'), website: f.get('website'),
        recursos: FEATS.filter((x) => state.feats.has(x.id)).map((x) => x.name),
      };
      fetch(CONFIG.crm.url, { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: JSON.stringify(body), keepalive: true }).catch(() => {});
    }
    $('#f-zap').addEventListener('input', (e) => { if (e.target.value.replace(/\D/g, '').length >= 10) e.target.closest('.field').classList.remove('is-error'); });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!validate()) return;
      sendLead();
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

    // Link direto para um pacote: index.html?pacote=completo#monte
    const pre = new URLSearchParams(location.search).get('pacote');
    if (pre && pkgById[pre]) { state.pkg = pre; state.manual = true; }
    render(true);
  })();

  // ════════════════════════════════════════════════════════════════════════
  // INTERAÇÕES: barra de rolagem, WhatsApp flutuante, cards 3D, faíscas
  // ════════════════════════════════════════════════════════════════════════
  const bar = $('.scroll-bar b');
  ScrollTrigger.create({ start: 0, end: 'max', onUpdate: (s) => gsap.set(bar, { scaleX: s.progress }) });
  const waFloat = $('.wa-float');
  ScrollTrigger.create({ start: () => innerHeight * 0.5, end: 'max', onToggle: (s) => waFloat.classList.toggle('on', s.isActive) });

  if (finePointer && !reduced) {
    $$('[data-tilt]').forEach((el) => {
      const glare = document.createElement('span');
      glare.className = 'tilt-glare';
      el.prepend(glare);
      const rx = gsap.quickTo(el, 'rotationX', { duration: 0.5, ease: 'power3' });
      const ry = gsap.quickTo(el, 'rotationY', { duration: 0.5, ease: 'power3' });
      el.addEventListener('pointerenter', () => gsap.set(el, { transformPerspective: 900 }));
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        rx((0.5 - y) * 7); ry((x - 0.5) * 9);
        el.style.setProperty('--gx', `${x * 100}%`);
        el.style.setProperty('--gy', `${y * 100}%`);
      });
      el.addEventListener('pointerleave', () => { rx(0); ry(0); });
    });
  }

  // Faíscas azuis quando alguém clica para falar com a gente
  if (!reduced) {
    document.addEventListener('click', (e) => {
      const b = e.target.closest('[data-wa], [data-orc], .btn-volt');
      if (!b) return;
      for (let i = 0; i < 14; i++) {
        const sp = document.createElement('i');
        sp.className = 'spark';
        document.body.appendChild(sp);
        const a = Math.random() * Math.PI * 2, d = 40 + Math.random() * 70;
        gsap.fromTo(sp, { x: e.clientX, y: e.clientY, scale: 1, opacity: 1 },
          { x: e.clientX + Math.cos(a) * d, y: e.clientY + Math.sin(a) * d, scale: 0, opacity: 0, duration: 0.6 + Math.random() * 0.4, ease: 'power3.out', onComplete: () => sp.remove() });
      }
      kick(0.4);
    });
  }

  // ════════════════════════════════════════════════════════════════════════
  // HERÓI 3D: campo de partículas (carrega depois da abertura)
  // ════════════════════════════════════════════════════════════════════════
  function heroGL() {
    const heroEl = $('.hero');
    import('./hero3d.js')
      .then((m) => {
        hero3d = m.mount($('.hero-gl'), { reduced, mobile: isMobile() });
        if (!hero3d) return;
        heroEl.classList.add('gl-on');
        addEventListener('pointermove', (e) => hero3d.setPointer(e.clientX, e.clientY, pointer.nx, pointer.ny), { passive: true });
        heroEl.addEventListener('pointerleave', () => hero3d.leave());
        heroEl.addEventListener('pointerdown', (e) => {
          if (e.target.closest('a, button, .flask-stage')) return;
          hero3d.ripple(e.clientX, e.clientY, 1.1);
          kick(0.35);
        });
        gsap.ticker.add(() => hero3d.setEnergy(energy));
        ScrollTrigger.create({ trigger: heroEl, start: 'top top', end: 'bottom top', onUpdate: (s) => hero3d.setScroll(s.progress) });
        // onda de boas-vindas saindo do frasco
        setTimeout(() => { const r = stage.getBoundingClientRect(); hero3d.ripple(r.left + r.width / 2, r.bottom + 40, 1.4); }, 400);
      })
      .catch(() => {});
  }

  // ── Início ───────────────────────────────────────────────────────────────
  runLoader().then(() => {
    fontsReady.then(heroIntro);
    heroGL();
    ScrollTrigger.refresh();
  });
  fontsReady.then(() => ScrollTrigger.refresh());
})();
