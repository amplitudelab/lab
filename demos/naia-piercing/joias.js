// Joias 3D da Naiá: constelação simétrica no hero e vitrine giratória (Three.js, sem CDN)
import * as THREE from 'three';
import { RoomEnvironment } from '../../vendor/RoomEnvironment.js';

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const mobile = matchMedia('(max-width: 760px), (pointer: coarse)').matches;

/* ---------- materiais ---------- */
const TONES = {
  ouro:  [1.00, 0.76, 0.42],
  prata: [0.80, 0.80, 0.82],
  rose:  [0.98, 0.62, 0.52],
};
function metal(tone = 'ouro', rough = 0.18) {
  const m = new THREE.MeshPhysicalMaterial({ metalness: 1, roughness: rough, envMapIntensity: 1.6 });
  m.color.setRGB(...TONES[tone]);
  return m;
}
// pedra: facetada e iridescente, brilha como cristal sem custo de transmissão
function stone(tint = [0.96, 0.98, 1]) {
  const m = new THREE.MeshPhysicalMaterial({
    metalness: 0.9, roughness: 0.03, flatShading: true, envMapIntensity: 3.4,
    iridescence: 1, iridescenceIOR: 1.8, iridescenceThicknessRange: [180, 720],
    clearcoat: 1, clearcoatRoughness: 0, specularIntensity: 1,
  });
  m.color.setRGB(...tint);
  m.emissive.setRGB(0.08, 0.08, 0.1); // pedra nunca apaga, mesmo refletindo o fundo escuro
  return m;
}

/* ---------- geometrias ---------- */
const G = {};
function brilliant() {
  if (!G.br) {
    const p = [[0.001, -0.82], [1, 0], [1, 0.07], [0.6, 0.36], [0.001, 0.36]].map(([x, y]) => new THREE.Vector2(x, y));
    G.br = new THREE.LatheGeometry(p, 10).rotateX(Math.PI / 2); // mesa virada para a câmera (+z)
  }
  return G.br;
}
const sphere = () => (G.sp ||= new THREE.SphereGeometry(1, 32, 20));

function gem(r, mat, x = 0, y = 0, z = 0, sx = 1, sy = 1) {
  const m = new THREE.Mesh(brilliant(), mat);
  m.scale.set(r * sx, r * sy, r);
  m.position.set(x, y, z);
  return m;
}
function ball(r, mat, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(sphere(), mat);
  m.scale.setScalar(r);
  m.position.set(x, y, z);
  return m;
}
function post(len, r, mat) { // pino que entra na pele (vai para trás, -z)
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 16), mat);
  m.rotation.x = Math.PI / 2;
  m.position.z = -len / 2;
  return m;
}

// argola clicker cravejada (como o daith do portfólio)
function clicker(R, tone, n = 13) {
  const g = new THREE.Group(), gold = metal(tone, 0.1), st = stone();
  const tube = R * 0.072;
  g.add(new THREE.Mesh(new THREE.TorusGeometry(R, tube, 28, 160), gold));
  // pedras na metade de baixo, na frente da argola, com garras de bolinha
  for (let i = 0; i < n; i++) {
    const a = -Math.PI * (0.12 + 0.76 * (i / (n - 1)));
    const x = Math.cos(a) * R, y = Math.sin(a) * R;
    const s = gem(tube * 0.92, st, x, y, tube * 0.72);
    s.rotation.z = a;
    g.add(s);
    if (i < n - 1) {
      const b = a - (Math.PI * 0.76) / (n - 1) / 2;
      g.add(ball(tube * 0.22, gold, Math.cos(b) * R, Math.sin(b) * R, tube * 0.95));
    }
  }
  // dobradiça do clicker no topo
  const hinge = new THREE.Mesh(new THREE.CylinderGeometry(tube * 1.35, tube * 1.35, tube * 2.4, 24), gold);
  hinge.rotation.z = Math.PI / 2; hinge.position.y = R;
  g.add(hinge);
  return g;
}

// flor de marquises (labret de flat/helix, estilo dos projetos dourados)
function flower(s, tone, mirror = 1) {
  const g = new THREE.Group(), gold = metal(tone), st = stone([1, 0.97, 0.92]);
  for (let i = 0; i < 3; i++) {
    const a = Math.PI / 2 + mirror * (i - 1) * 0.72;
    const p = new THREE.Group();
    const frame = new THREE.Mesh(new THREE.TorusGeometry(s * 0.33, s * 0.035, 8, 40), gold);
    frame.scale.set(0.52, 1.5, 1);
    frame.position.set(0, s * 0.62, 0);
    p.add(gem(s * 0.32, st, 0, s * 0.62, 0.05 * s, 0.5, 1.45), frame);
    p.rotation.z = a - Math.PI / 2;
    g.add(p);
  }
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(s * 0.045, s * 0.03, s * 0.9, 10), gold);
  stem.position.set(0, -s * 0.36, 0); stem.rotation.z = mirror * 0.25;
  g.add(stem, ball(s * 0.14, gold, mirror * 0.32 * s, -s * 0.12, 0.05 * s));
  g.add(gem(s * 0.16, stone(), 0, 0, s * 0.08));
  g.add(post(s * 1.2, s * 0.05, metal('prata', 0.25)));
  return g;
}

// topo de microdermal: base âncora + pedra em bezel
function dermal(s, tone) {
  const g = new THREE.Group(), gold = metal(tone, 0.26), ti = metal('prata', 0.3);
  gold.side = THREE.DoubleSide;
  const bezel = new THREE.Mesh(new THREE.CylinderGeometry(s * 0.56, s * 0.5, s * 0.28, 40, 1, true), gold);
  bezel.rotation.x = Math.PI / 2;
  const back = new THREE.Mesh(new THREE.CircleGeometry(s * 0.5, 40), gold);
  back.position.z = -s * 0.14; back.rotation.y = Math.PI;
  g.add(bezel, back, gem(s * 0.5, stone(), 0, 0, s * 0.05));
  const p = post(s * 0.55, s * 0.12, ti); p.position.z = -s * 0.4; g.add(p);
  // âncora (placa com dois furos)
  const shape = new THREE.Shape();
  shape.absarc(-s * 0.55, 0, s * 0.26, Math.PI / 2, Math.PI * 1.5, false);
  shape.absarc(s * 0.55, 0, s * 0.26, -Math.PI / 2, Math.PI / 2, false);
  for (const hx of [-0.55, 0.55]) { const h = new THREE.Path(); h.absarc(hx * s, 0, s * 0.11, 0, Math.PI * 2, true); shape.holes.push(h); }
  const plate = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth: s * 0.06, bevelEnabled: true, bevelSize: s * 0.02, bevelThickness: s * 0.02, bevelSegments: 2, curveSegments: 20 }), ti);
  plate.position.z = -s * 0.72;
  g.add(plate);
  return g;
}

// trindade: três bolinhas em triângulo (o "trio" dos lóbulos)
function trinity(s, tone) {
  const g = new THREE.Group(), gold = metal(tone, 0.22);
  for (let i = 0; i < 3; i++) {
    const a = Math.PI / 2 + (i * Math.PI * 2) / 3;
    g.add(ball(s * 0.3, gold, Math.cos(a) * s * 0.36, Math.sin(a) * s * 0.36, 0));
  }
  g.add(post(s, s * 0.06, metal('prata', 0.25)));
  return g;
}

// barbell (industrial / transversal)
function barbell(len, tone) {
  const g = new THREE.Group(), ti = metal(tone === 'ouro' ? 'prata' : tone, 0.2), gold = metal(tone, 0.1);
  const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, len, 16), ti);
  bar.rotation.z = Math.PI / 2;
  g.add(bar, ball(0.13, gold, -len / 2 - 0.08, 0, 0), gem(0.16, stone(), len / 2 + 0.1, 0, 0.02));
  g.children[2].rotation.y = Math.PI / 2;
  return g;
}

// argola fina lisa (segment ring)
function hoop(R, tone) {
  return new THREE.Mesh(new THREE.TorusGeometry(R, R * 0.07, 20, 96), metal(tone, 0.12));
}

/* ---------- brilho de poeira dourada ---------- */
function sparkTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const x = c.getContext('2d');
  const r = x.createRadialGradient(32, 32, 0, 32, 32, 32);
  r.addColorStop(0, 'rgba(255,240,210,1)'); r.addColorStop(0.18, 'rgba(255,220,160,.55)'); r.addColorStop(1, 'rgba(255,200,140,0)');
  x.fillStyle = r; x.fillRect(0, 0, 64, 64);
  x.fillStyle = 'rgba(255,245,225,.9)';
  x.fillRect(31, 4, 2, 56); x.fillRect(4, 31, 56, 2); // cruz de reflexo
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
function dust(count, spread, tex) {
  // pares espelhados no eixo x: a poeira também é simétrica
  const pos = new Float32Array(count * 3), seed = new Float32Array(count);
  let s = 7;
  const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < count; i += 2) {
    const x = (0.15 + rnd()) * spread.x, y = (rnd() - 0.5) * spread.y, z = -rnd() * spread.z;
    pos.set([x, y, z, -x, y, z], i * 3);
    seed[i] = seed[i + 1] = rnd() * 6.28;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('seed', new THREE.BufferAttribute(seed, 1));
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { map: { value: tex }, t: { value: 0 }, px: { value: Math.min(devicePixelRatio, 2) } },
    vertexShader: `attribute float seed;uniform float t,px;varying float a;
      void main(){vec4 mv=modelViewMatrix*vec4(position,1.);a=pow(.5+.5*sin(t*1.3+seed*3.),6.);
      gl_PointSize=(14.+30.*a)*px/-mv.z;gl_Position=projectionMatrix*mv;}`,
    fragmentShader: `uniform sampler2D map;varying float a;
      void main(){gl_FragColor=texture2D(map,gl_PointCoord)*vec4(1.,1.,1.,.25+.75*a);}`,
  });
  return new THREE.Points(geo, mat);
}

/* ---------- base comum ---------- */
function stage(canvas, dprMax) {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  } catch (e) { return null; }
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, dprMax));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.45;
  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  pmrem.dispose();
  const key = new THREE.DirectionalLight(0xffe2b8, 2.2); key.position.set(3, 4, 5);
  const rim = new THREE.DirectionalLight(0xb9a6ff, 1.4); rim.position.set(-4, -1, -3);
  scene.add(key, rim);
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 60);
  return { renderer, scene, camera };
}

// roda o loop só enquanto o canvas está na tela e a aba está visível
function loop(el, frame) {
  let raf = 0, seen = false;
  const tick = (now) => { raf = requestAnimationFrame(tick); frame(now / 1000); };
  const sync = () => {
    const on = seen && !document.hidden;
    if (on && !raf) raf = requestAnimationFrame(tick);
    if (!on && raf) { cancelAnimationFrame(raf); raf = 0; }
  };
  new IntersectionObserver(([e]) => { seen = e.isIntersecting; sync(); }, { rootMargin: '80px' }).observe(el);
  document.addEventListener('visibilitychange', sync);
}

/* ---------- hero: constelação simétrica ---------- */
function hero() {
  const canvas = document.getElementById('gl');
  if (!canvas) return;
  const st = stage(canvas, mobile ? 1.5 : 1.75);
  if (!st) return document.documentElement.classList.add('no-webgl');
  const { renderer, scene, camera } = st;
  const world = new THREE.Group(); scene.add(world);
  const heroEl = canvas.closest('.hero'), nameEl = heroEl.querySelector('.name b');

  // a argola emoldura o nome; as outras peças vêm em pares espelhados no eixo central
  // posições relativas ao centro da argola: [x, y, z] no desktop e no celular (null = some no celular)
  const ring = clicker(1.3, 'ouro', 15);
  const pieces = [{ obj: ring, center: true, phase: 0 }];
  const pair = (make, desk, mob, rz, phase, ms = 1) => {
    for (const side of [-1, 1]) pieces.push({ obj: make(side), desk, mob, rz: rz * side, phase, side, ms });
  };
  pair((m) => flower(0.62, 'ouro', m), [2.75, 0.75, -0.4], [1.62, 1.15, -0.6], 0.35, 0.4, 0.62);
  pair(() => trinity(0.36, 'ouro'), [1.95, 1.5, -0.9], null, 0, 3.1);
  pair(() => dermal(0.42, 'ouro'), [2.45, -1.5, 0.2], null, 0, 1.6);
  pair(() => hoop(0.42, 'prata'), [3.75, -0.45, -1.2], null, 0.6, 2.4);
  pair(() => barbell(0.9, 'ouro'), [3.75, 1.2, -2.2], null, 0.5, 4.2);
  for (const p of pieces) world.add(p.obj);

  const motes = dust(mobile ? 60 : 120, { x: 6, y: 7, z: 6 }, sparkTexture());
  motes.position.z = -1;
  world.add(motes);

  const target = { x: 0, y: 0 }, look = { x: 0, y: 0 };
  let compact = false, scroll = 0, ringY = 0, ringS = 1;
  addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    target.x = (e.clientX / innerWidth) * 2 - 1;
    target.y = (e.clientY / innerHeight) * 2 - 1;
  }, { passive: true });
  // celular: inclinar o aparelho move as joias
  addEventListener('deviceorientation', (e) => {
    if (e.gamma == null) return;
    target.x = Math.max(-1, Math.min(1, e.gamma / 30));
    target.y = Math.max(-1, Math.min(1, (e.beta - 45) / 40));
  }, { passive: true });

  const onScroll = () => { scroll = Math.min(1, Math.max(0, scrollY / (heroEl.offsetHeight || 1))); };
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    compact = camera.aspect < 0.9;
    camera.position.set(0, 0, compact ? 12.5 : 9.6);
    camera.fov = compact ? 38 : 32;
    camera.updateProjectionMatrix();
    // centro da argola = centro do nome na tela; raio cabe na largura e na altura
    const halfH = camera.position.z * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    const unit = h / (2 * halfH);
    // a argola cabe entre a linha de cima e o texto de baixo, sem cobrir nenhum dos dois
    const r = heroEl.getBoundingClientRect(), n = nameEl.getBoundingClientRect();
    const eb = heroEl.querySelector('.eyebrow').getBoundingClientRect();
    const low = heroEl.querySelector('.hero-low').getBoundingClientRect();
    const cy = n.top + n.height * 0.52 - r.top;
    const room = Math.min(cy - (eb.bottom - r.top) - 16, low.top - r.top - cy + 6);
    const px = Math.max(90, Math.min(room, compact ? w * 0.44 : 300));
    ringY = (0.5 - cy / h) * 2 * halfH;
    ringS = px / (1.42 * unit);
    heroEl.style.setProperty('--ring-top', `${Math.max(0, cy - px)}px`);
  }
  addEventListener('resize', resize); resize();
  document.fonts?.ready.then(resize);

  const t0 = performance.now() / 1000;
  const frame = (now) => {
    const t = reduce ? 1.2 : now - t0;
    look.x += (target.x - look.x) * 0.05;
    look.y += (target.y - look.y) * 0.05;
    world.rotation.y = look.x * 0.2;
    world.rotation.x = look.y * 0.1;
    const open = 1 + scroll * 0.7;
    for (const p of pieces) {
      const bob = Math.sin(t * 0.7 + p.phase) * 0.08;
      if (p.center) {
        p.obj.position.set(0, ringY + bob * 0.5 + scroll * 0.8, -scroll * 2);
        p.obj.rotation.set(Math.sin(t * 0.3) * 0.08, Math.sin(t * 0.25) * 0.42, 0);
        p.obj.scale.setScalar(ringS);
        continue;
      }
      const at = compact ? p.mob : p.desk;
      p.obj.visible = !!at;
      if (!at) continue;
      const k = compact ? p.ms : 1;
      p.obj.scale.setScalar(k);
      p.obj.position.set(p.side * Math.abs(at[0]) * open, ringY + at[1] + bob, at[2] + scroll * 1.5);
      // rotação espelhada: os dois lados giram em sentidos opostos, como um reflexo
      p.obj.rotation.set(Math.sin(t * 0.5 + p.phase) * 0.25, p.side * (0.35 + Math.sin(t * 0.4 + p.phase) * 0.45), p.rz);
    }
    motes.material.uniforms.t.value = t;
    renderer.render(scene, camera);
  };
  loop(canvas, reduce ? () => {} : frame);
  frame(performance.now() / 1000);
  if (reduce) addEventListener('resize', () => frame(0));
  canvas.classList.add('on');
}

/* ---------- vitrine: uma peça grande, gira com o dedo ---------- */
function vitrine() {
  const canvas = document.getElementById('vitrine-gl');
  if (!canvas) return;
  const st = stage(canvas, mobile ? 1.75 : 2);
  if (!st) return;
  const { renderer, scene, camera } = st;
  camera.position.set(0, 0, 7);

  const makers = {
    clicker: (t) => clicker(1.25, t, 13),
    flor: (t) => { const g = flower(1.3, t); g.position.y = -0.1; return g; },
    dermal: (t) => { const g = dermal(1.35, t); g.rotation.x = -0.35; return g; },
    trio: (t) => trinity(1.7, t),
  };
  let kind = 'clicker', tone = 'ouro', piece = null;
  const holder = new THREE.Group(); scene.add(holder);
  function build() {
    if (piece) {
      holder.remove(piece);
      piece.traverse((o) => { if (o.isMesh && o.geometry !== G.br && o.geometry !== G.sp) o.geometry.dispose(); });
    }
    piece = makers[kind](tone);
    holder.add(piece);
    draw();
  }

  const motes = dust(40, { x: 3.4, y: 4, z: 3 }, sparkTexture());
  motes.position.z = -1.5; scene.add(motes);

  // arrastar para girar, com inércia
  let rotY = 0.5, rotX = 0.15, vel = 0.004, dragging = false, lx = 0, ly = 0, idle = 0;
  canvas.addEventListener('pointerdown', (e) => { dragging = true; lx = e.clientX; ly = e.clientY; canvas.setPointerCapture(e.pointerId); });
  canvas.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const dx = e.clientX - lx, dy = e.clientY - ly; lx = e.clientX; ly = e.clientY;
    vel = dx * 0.0035; rotY += dx * 0.009; rotX = Math.max(-0.7, Math.min(0.7, rotX + dy * 0.006));
    idle = 0; draw();
  });
  const up = () => { dragging = false; };
  canvas.addEventListener('pointerup', up); canvas.addEventListener('pointercancel', up);

  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
    draw();
  }
  let last = 0;
  function draw(now = last) {
    holder.rotation.set(rotX, rotY, 0);
    motes.material.uniforms.t.value = now;
    renderer.render(scene, camera);
  }
  const frame = (now) => {
    const dt = Math.min(0.05, now - (last || now)); last = now;
    if (!dragging) {
      idle += dt;
      vel += ((idle > 1.5 ? 0.005 : 0) - vel) * 0.04; // volta a girar sozinha depois de solta
      rotY += vel;
      rotX += (0.15 - rotX) * 0.02;
    }
    draw(now);
  };
  loop(canvas, reduce ? () => {} : frame);

  document.querySelectorAll('[data-piece]').forEach((b) => b.addEventListener('click', () => { kind = b.dataset.piece; build(); }));
  document.querySelectorAll('[data-tone]').forEach((b) => b.addEventListener('click', () => { tone = b.dataset.tone; build(); }));
  addEventListener('resize', resize);
  build(); resize();
  canvas.classList.add('on');
}

hero();
vitrine();
