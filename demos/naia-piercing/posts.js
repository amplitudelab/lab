// Vitrine do Instagram: carrossel 3D com reflexo, filtros e o post aberto com o embed oficial.
//
// PARA ADICIONAR UM POST: copie o código do link (instagram.com/p/CODIGO/) e acrescente uma linha
// em POSTS. A foto local em img/ig/CODIGO.jpg é opcional: sem ela, o card mostra o post pelo embed.
// Sem código (só foto local), o card abre a foto grande e o link do perfil.
const PERFIL = 'naia_piercing';
const POSTS = [
  { code: 'DeuGGzGRWLD', cat: ['trabalhos', 'orelha'], titulo: 'Daith e conch no mesmo dia', texto: 'Argola big no daith: a parte de fora é mais grossa que a de dentro, então as pedras nunca passam pela perfuração.', data: '2026-10-20' },
  { code: 'Dc11d6gBlEZ', reel: true, cat: ['trabalhos', 'orelha'], titulo: 'Finalmente: argola no conch', texto: 'Na cicatrização vai a joia certa. A argola chega depois, quando o furo está pronto para ela.', data: '2026-09-03' },
  { code: 'DGgudnJvc1M', cat: ['trabalhos', 'orelha'], titulo: 'Tragus', texto: 'Um ponto de luz no tragus, alinhado com o desenho da orelha.' },
  { code: 'DcWL5xBEcn1', cat: ['trabalhos', 'rosto'], titulo: 'Microdermal de ágata vermelha', texto: 'Topo de ágata vermelha, aplicado com agulha americana 14g.', data: '2026-08-22' },
  { code: 'DdZu8xLkhIu', cat: ['trabalhos', 'rosto'], titulo: 'Spikes no projeto simétrico', texto: 'Diâmetros e comprimentos diferentes, valorizando cada perfuração.', data: '2026-09-17' },
  { code: 'DdFIDxsSAe-', reel: true, cat: ['trabalhos', 'rosto'], titulo: 'O septo da amiga', texto: 'Ela chorou antes da perfuração. O resultado está no fim do vídeo.', data: '2026-09-09' },
  { img: 'img/p1.jpg', cat: ['trabalhos', 'orelha'], titulo: 'Constelação dourada', texto: 'Projeto de orelha com argolas, flor de pedras e pontos dourados do lóbulo ao helix.' },
  { img: 'img/p3.jpg', cat: ['trabalhos', 'orelha'], titulo: 'Daith cravejado', texto: 'Daith com argola cravejada, conch com pedra e helix com argola fina.' },
  { img: 'img/p4.jpg', cat: ['trabalhos', 'rosto'], titulo: 'Linha vertical', texto: 'Dois microdermais alinhados na frente da orelha e dois pontos no lóbulo.' },
  { img: 'img/p2.jpg', cat: ['trabalhos', 'orelha'], titulo: 'Subida de luz', texto: 'Três pontos de pedra subindo pelo helix, trio no lóbulo e argola.' },
  { code: 'DeKaG8qGlKG', cat: ['trabalhos', 'bastidores'], titulo: 'A família toda furando junto', texto: 'O lóbulo do Guilherme, que fez 12 anos, e pontos de luz combinando para a Érica.', data: '2026-10-06' },
  { code: 'DbbgtyRMMqP', cat: ['dicas'], titulo: 'Confira o aperto da sua joia', texto: 'Joia de rosca afrouxa com o dia a dia. Aperte no sentido horário, solte no anti-horário.', data: '2026-07-30' },
  { code: 'DduE6rAGulK', cat: ['dicas', 'orelha'], titulo: 'Cuidando do piercing recente', texto: 'Você não passa pela cicatrização sozinha: a Naiá acompanha e tira as dúvidas junto com você.', data: '2026-09-25' },
  { code: 'Da6KNN-ElRo', cat: ['dicas'], titulo: 'O que eu não vou fazer', texto: 'Algumas coisas que eu não faço, e são para o seu próprio bem.', data: '2026-07-17' },
  { code: 'DerpeiiR0qv', reel: true, cat: ['bastidores', 'dicas'], titulo: 'RCP em adultos, passo a passo', texto: 'Local seguro, chamar, conferir a respiração: o básico que todo mundo deveria saber.', data: '2026-10-19' },
  { code: 'Dee3ibsxW3d', cat: ['bastidores'], titulo: 'Curso de primeiros socorros', texto: 'Estudando primeiros socorros para atender sempre preparada.', data: '2026-10-14' },
];
const FILTROS = { todos: 'Todos', trabalhos: 'Trabalhos', orelha: 'Orelha', rosto: 'Rosto', dicas: 'Dicas', bastidores: 'Bastidores' };

(function () {
  const root = document.getElementById('instagram');
  if (!root) return;
  const track = root.querySelector('.ig-track'), chips = root.querySelector('.ig-filters');
  const cap = root.querySelector('.ig-cap'), dlg = document.getElementById('ig-modal');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const url = (p) => (p.code ? `https://www.instagram.com/${p.reel ? 'reel' : 'p'}/${p.code}/` : `https://www.instagram.com/${PERFIL}/`);
  const thumb = (p) => p.img || `img/ig/${p.code}.jpg`;
  const fmt = (d) => (d ? new Date(d + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }) : '');
  let items = POSTS, pos = 0, target = 0, cards = [];

  chips.innerHTML = Object.entries(FILTROS).map(([id, n], i) => `<button data-f="${id}" aria-pressed="${!i}">${n}</button>`).join('');

  function render() {
    track.innerHTML = items.map((p, i) => `
      <button class="ig-card" data-i="${i}" aria-label="${p.titulo}${p.reel ? ' (vídeo)' : ''}">
        <img src="${thumb(p)}" alt="" loading="lazy" decoding="async" onerror="this.closest('.ig-card').classList.add('noimg')">
        ${p.reel ? '<span class="ig-badge"><svg viewBox="0 0 24 24"><path fill="currentColor" d="M8 5v14l11-7z"/></svg></span>' : ''}
        <span class="ig-shine"></span>
      </button>`).join('');
    cards = [...track.children];
    pos = target = Math.min(target, items.length - 1);
    layout(); caption();
  }

  // cada card se posiciona pela distância até o centro (pos pode ser fracionário durante o arraste)
  function layout() {
    const w = track.clientWidth, step = Math.min(240, Math.max(130, w * 0.2));
    cards.forEach((c, i) => {
      const o = i - pos, a = Math.abs(o), s = Math.sign(o);
      const x = s * (Math.min(a, 1) * step + Math.max(0, a - 1) * step * 0.62);
      c.style.transform = `translate(-50%,-50%) translateX(${x}px) translateZ(${-a * 140}px) rotateY(${-s * Math.min(a, 1) * 42}deg)`;
      c.style.zIndex = String(100 - Math.round(a * 10));
      c.style.opacity = a > 3.6 ? '0' : String(1 - Math.max(0, a - 2.6));
      c.style.filter = `brightness(${1 - Math.min(a, 2) * 0.22})`;
      c.classList.toggle('on', Math.round(pos) === i);
      c.tabIndex = Math.round(pos) === i ? 0 : -1;
    });
  }
  function caption() {
    const p = items[Math.round(target)];
    if (!p) return;
    cap.querySelector('b').textContent = p.titulo;
    cap.querySelector('p').textContent = p.texto;
    cap.querySelector('small').textContent = [p.reel ? 'Vídeo' : 'Post', fmt(p.data), `${Math.round(target) + 1} de ${items.length}`].filter(Boolean).join(' · ');
    cap.querySelector('a').href = url(p);
  }
  let raf = 0;
  function go(i) {
    target = Math.max(0, Math.min(items.length - 1, i));
    caption();
    if (reduce) { pos = target; layout(); return; }
    if (!raf) raf = requestAnimationFrame(function step() {
      pos += (target - pos) * 0.16;
      if (Math.abs(target - pos) < 0.002) { pos = target; raf = 0; layout(); return; }
      layout(); raf = requestAnimationFrame(step);
    });
  }

  // arrastar / deslizar
  let down = null, moved = false;
  track.addEventListener('pointerdown', (e) => { down = { x: e.clientX, p: pos }; moved = false; });
  addEventListener('pointermove', (e) => {
    if (!down) return;
    const dx = e.clientX - down.x;
    if (Math.abs(dx) > 6) moved = true;
    if (!moved) return;
    pos = target = Math.max(-0.4, Math.min(items.length - 0.6, down.p - dx / 170));
    layout();
  });
  const release = () => { if (down && moved) go(Math.round(pos)); down = null; };
  addEventListener('pointerup', release);
  addEventListener('pointercancel', release); // o navegador assumiu a rolagem vertical
  track.addEventListener('click', (e) => {
    const c = e.target.closest('.ig-card');
    if (!c || (moved && e.detail !== 0)) return; // Enter do teclado sempre passa
    const i = +c.dataset.i;
    i === Math.round(target) ? open(items[i], c) : go(i);
  });
  root.querySelector('.ig-prev').addEventListener('click', () => go(Math.round(target) - 1));
  root.querySelector('.ig-next').addEventListener('click', () => go(Math.round(target) + 1));
  track.addEventListener('keydown', (e) => {
    const d = { ArrowLeft: -1, ArrowRight: 1 }[e.key];
    if (!d) return;
    e.preventDefault(); go(Math.round(target) + d);
    requestAnimationFrame(() => cards[Math.round(target)]?.focus());
  });
  // trackpad manda dezenas de eventos por gesto: acumula e anda um card a cada 70px
  let wheelAcc = 0;
  track.addEventListener('wheel', (e) => {
    if (Math.abs(e.deltaX) < Math.abs(e.deltaY)) return;
    e.preventDefault();
    wheelAcc += e.deltaX;
    if (Math.abs(wheelAcc) < 70) return;
    go(Math.round(target) + Math.sign(wheelAcc));
    wheelAcc = 0;
  }, { passive: false });
  chips.addEventListener('click', (e) => {
    const b = e.target.closest('[data-f]');
    if (!b) return;
    chips.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', x === b));
    items = b.dataset.f === 'todos' ? POSTS : POSTS.filter((p) => p.cat.includes(b.dataset.f));
    target = 0; render();
  });
  new ResizeObserver(layout).observe(track);

  // modal: embed oficial (carrega a legenda e o vídeo de verdade); sem código, foto grande
  let opener = null;
  function open(p, from) {
    opener = from;
    const body = dlg.querySelector('.ig-body');
    body.innerHTML = p.code
      ? `<iframe src="https://www.instagram.com/${p.reel ? 'reel' : 'p'}/${p.code}/embed/captioned/" title="${p.titulo} no Instagram" loading="lazy" allowtransparency="true" allow="encrypted-media; picture-in-picture" referrerpolicy="strict-origin-when-cross-origin"></iframe>`
      : `<img src="${thumb(p)}" alt="${p.titulo}">`;
    dlg.querySelector('h3').textContent = p.titulo;
    dlg.querySelector('a').href = url(p);
    dlg.showModal();
  }
  dlg.addEventListener('close', () => { dlg.querySelector('.ig-body').innerHTML = ''; opener?.focus(); });
  dlg.addEventListener('click', (e) => { if (e.target === dlg || e.target.closest('.ig-close')) dlg.close(); });

  render();
  // entra girando quando aparece na tela
  if (!reduce) {
    pos = items.length - 1; layout();
    new IntersectionObserver(([e], io) => { if (e.isIntersecting) { go(0); io.disconnect(); } }, { threshold: 0.3 }).observe(track);
  }
})();
