// Joias 3D da Naiá: lapidação brilhante facetada, metais com reflexo de estúdio, bloom e cintilação.
// Three.js r170 fica em ./vendor (só desta demo), o resto do site continua no r160.
import * as THREE from 'three';
import { EffectComposer } from './vendor/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from './vendor/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from './vendor/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from './vendor/jsm/postprocessing/OutputPass.js';

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const mobile = matchMedia('(max-width: 760px), (pointer: coarse)').matches;
const TAU = Math.PI * 2;
const PHONE = document.body.dataset.phone || '5511934707496';
const wa = (t) => `https://wa.me/${PHONE}?text=${encodeURIComponent(t)}`;

/* ==========================================================================
   EDITE AQUI: metais, pedras e catálogo do ateliê
   ========================================================================== */
// cor = refletância do metal (espaço linear); css = bolinha do seletor
export const METAIS = {
  ouro:   { nome: 'Ouro amarelo',  cor: [1.0, 0.766, 0.336], rough: 0.13, css: 'linear-gradient(135deg,#fff3cf,#e2b25f 50%,#8a6331)' },
  branco: { nome: 'Ouro branco',   cor: [0.9, 0.89, 0.87],   rough: 0.1,  css: 'linear-gradient(135deg,#ffffff,#c9ccd2 50%,#6d7079)' },
  rose:   { nome: 'Ouro rosé',     cor: [0.96, 0.6, 0.5],    rough: 0.13, css: 'linear-gradient(135deg,#ffe4d8,#e2a18e 50%,#9a5d4f)' },
  preto:  { nome: 'Titânio preto', cor: [0.075, 0.075, 0.085], rough: 0.2, css: 'linear-gradient(135deg,#6b6b72,#1c1c20 55%,#050506)' },
};
// tint = cor da pedra, fire = dispersão (arco-íris), aurora = brilho furta-cor
export const PEDRAS = {
  cristal:   { nome: 'Cristal',         tint: [1, 1, 1],          fire: 1.0, css: 'radial-gradient(circle at 35% 30%,#fff,#dfe8ff 45%,#9aa6c4)' },
  aurora:    { nome: 'Aurora boreal',   tint: [1, 1, 1],          fire: 2.6, aurora: 1, css: 'conic-gradient(from 30deg,#ffd1f0,#c9f7ff,#fff3b8,#d8c8ff,#ffd1f0)' },
  rubi:      { nome: 'Ágata vermelha',  tint: [1, 0.12, 0.18],    fire: 0.5, gain: 1.35, css: 'radial-gradient(circle at 35% 30%,#ffb3b8,#e0263b 50%,#5c0612)' },
  esmeralda: { nome: 'Esmeralda',       tint: [0.15, 0.92, 0.45], fire: 0.5, gain: 1.3, css: 'radial-gradient(circle at 35% 30%,#c8ffd9,#1fae5a 50%,#04401d)' },
  safira:    { nome: 'Safira',          tint: [0.22, 0.42, 1],    fire: 0.5, gain: 1.35, css: 'radial-gradient(circle at 35% 30%,#c9d8ff,#2b57e0 50%,#071a5c)' },
  rosa:      { nome: 'Quartzo rosa',    tint: [1, 0.5, 0.7],      fire: 0.8, gain: 1.15, css: 'radial-gradient(circle at 35% 30%,#ffe0ec,#f08bb3 50%,#8c3157)' },
  onix:      { nome: 'Ônix',            tint: [0.05, 0.05, 0.06], fire: 0,   gain: 1, css: 'radial-gradient(circle at 35% 30%,#7a7a80,#111114 55%,#000)' },
};
export const CATEGORIAS = { orelha: 'Orelha', nariz: 'Nariz', corpo: 'Rosto e corpo' };

/* ---------- ambiente de estúdio: softboxes sobre fundo escuro ---------- */
// é o que aparece refletido no metal e refratado nas pedras
function studio() {
  const s = new THREE.Scene();
  const room = new THREE.Mesh(new THREE.SphereGeometry(30, 32, 16), new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false,
    vertexShader: 'varying vec3 p;void main(){p=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    // chão quente, teto frio: os metais nunca refletem preto puro
    fragmentShader: 'varying vec3 p;void main(){float y=p.y;vec3 c=mix(vec3(.055,.04,.03),vec3(.02,.02,.026),smoothstep(-.4,.5,y));c+=vec3(.09,.07,.05)*smoothstep(.2,-.9,y);gl_FragColor=vec4(c,1.);}',
  }));
  s.add(room);
  const panel = (w, h, k, hex, pos, round = false) => {
    const m = new THREE.Mesh(round ? new THREE.CircleGeometry(w, 32) : new THREE.PlaneGeometry(w, h),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(hex).multiplyScalar(k), side: THREE.DoubleSide }));
    m.position.set(...pos); m.lookAt(0, 0, 0); s.add(m);
  };
  panel(12, 4, 7, 0xfff1dc, [0, 12, 4]);       // softbox de cima
  panel(2.2, 14, 5, 0xffffff, [-11, 1, 3]);    // faixa esquerda
  panel(2.2, 14, 4, 0xffe4c4, [11, 0, -1]);    // faixa direita, quente
  panel(9, 1.2, 9, 0xffffff, [0, -3, 12]);     // faixa baixa na frente: acende a coroa das pedras
  panel(4, 4, 3, 0xd9c8ff, [-7, -7, -8]);      // contraluz lilás
  panel(4, 4, 3, 0xa8ece4, [8, -6, -7]);       // contraluz verde-água
  panel(3.2, 0, 6, 0xfff6ea, [6, 7, 10], true); // janela redonda: reflexo de joalheria
  // anel de luz atrás da câmera: o brilho circular das fotos de joia
  const ring = new THREE.Mesh(new THREE.TorusGeometry(5, 0.22, 12, 96), new THREE.MeshBasicMaterial({ color: new THREE.Color(0xffffff).multiplyScalar(6) }));
  ring.position.set(0, 1, 16); ring.lookAt(0, 0, 0); s.add(ring);
  // lâmpadas pequenas espalhadas: viram as faíscas nas facetas
  let seed = 3; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const bulb = new THREE.SphereGeometry(0.35, 12, 8);
  for (let i = 0; i < 22; i++) {
    const a = rnd() * TAU, e = (rnd() - 0.35) * 2.2, r = 14;
    const m = new THREE.Mesh(bulb, new THREE.MeshBasicMaterial({ color: new THREE.Color().setHSL(0.1 + rnd() * 0.05, 0.4, 0.8).multiplyScalar(5 + rnd() * 6) }));
    m.position.set(Math.cos(a) * r * Math.cos(e * 0.5), Math.sin(e) * r * 0.7, Math.sin(a) * r * Math.cos(e * 0.5));
    s.add(m);
  }
  return s;
}

/* ---------- material de diamante ---------- */
// refração por canal (r, g, b com índices diferentes = fogo do diamante), um reflexo interno
// por faceta e reflexo de Fresnel na superfície; as facetas planas fazem cada uma acender sozinha
const DIAMOND_VS = `
varying vec3 vWN; varying vec3 vWP; varying vec3 vON;
void main(){
  vON = normal;
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vWP = wp.xyz;
  vWN = normalize(mat3(modelMatrix) * normal);
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;
const DIAMOND_FS = `
uniform samplerCube envMap; uniform vec3 tint; uniform float fire, aurora, gain, envRot;
varying vec3 vWN; varying vec3 vWP; varying vec3 vON;
vec3 rotY(vec3 d){ float c = cos(envRot), s = -sin(envRot); // mesmo sentido do scene.environmentRotation return vec3(c*d.x + s*d.z, d.y, -s*d.x + c*d.z); }
vec3 env(vec3 d){ return textureCube(envMap, rotY(d)).rgb; }
vec3 hash3(vec3 p){ p = fract(p * vec3(.1031, .1030, .0973)); p += dot(p, p.yxz + 33.33); return fract((p.xxy + p.yxx) * p.zyx) * 2.0 - 1.0; }
float chan(vec3 v, vec3 n, vec3 bn, vec3 bn2, float ior, int c){
  vec3 r = refract(v, n, 1.0 / ior);
  vec3 b = reflect(r, bn);
  vec3 o = refract(b, -bn2, ior);
  if (dot(o, o) < 0.01) o = reflect(b, bn2);
  vec3 e = env(o);
  return c == 0 ? e.r : (c == 1 ? e.g : e.b);
}
void main(){
  vec3 n = normalize(vWN);
  vec3 v = normalize(vWP - cameraPosition);
  vec3 h = hash3(floor(vON * 9.0) + 0.5);
  vec3 bn = normalize(-n * 0.55 + h * 0.85 + vec3(0.0, -0.3, 0.0));
  vec3 bn2 = normalize(n + h.yzx * 0.7);
  vec3 ior = 2.42 + vec3(-0.035, 0.0, 0.04) * fire;
  vec3 refr = vec3(chan(v, n, bn, bn2, ior.r, 0), chan(v, n, bn, bn2, ior.g, 1), chan(v, n, bn, bn2, ior.b, 2));
  float F = 0.17 + 0.83 * pow(1.0 - clamp(dot(-v, n), 0.0, 1.0), 5.0);
  vec3 refl = env(reflect(v, n));
  // luz difusa vinda de dentro da pedra (mip borrado do ambiente): o cinza-prata entre as faíscas
  vec3 fill = textureCube(envMap, rotY(reflect(v, bn2)), 5.0).rgb * vec3(1.6, 1.75, 2.0) + 0.03;
  float facet = fract(h.z * 3.7 + envRot * 0.6 + dot(n, vec3(0.31, 0.17, 0.23)) * 2.0); // cada faceta num tom de cinza, muda ao girar
  vec3 body = (refr * 1.4 + fill * (0.08 + 1.1 * facet * facet)) * tint * mix(vec3(1.0), tint, 0.6);
  vec3 iri = 0.65 + 0.35 * cos(6.2831 * (dot(n, -v) * 1.6 + h.x * 0.3 + vec3(0.0, 0.33, 0.67)));
  body *= mix(vec3(1.0), iri * 1.25, aurora);
  vec3 col = mix(body, refl, F) * gain;
  col = min(pow(col, vec3(1.3)) * 1.05, vec3(3.0)); // mais contraste: preto entre as faíscas, só as facetas acesas estouram
  gl_FragColor = vec4(col, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;

/* ---------- textura de opala: manchas de cor sobre leitoso ---------- */
function opalTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const x = c.getContext('2d');
  x.fillStyle = '#dfe8f2'; x.fillRect(0, 0, 256, 256);
  let s = 11; const r = () => (s = (s * 16807) % 2147483647) / 2147483647;
  const hues = [160, 190, 210, 120, 30, 320, 270];
  for (let i = 0; i < 70; i++) {
    const px = r() * 256, py = r() * 256, rad = 8 + r() * 34, hue = hues[(r() * hues.length) | 0];
    const g = x.createRadialGradient(px, py, 0, px, py, rad);
    g.addColorStop(0, `hsla(${hue},95%,62%,.95)`); g.addColorStop(1, `hsla(${hue},95%,62%,0)`);
    x.fillStyle = g; x.fillRect(px - rad, py - rad, rad * 2, rad * 2);
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/* ---------- kit de materiais (um por canvas/contexto WebGL) ---------- */
function kit(renderer) {
  const env = studio();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envTex = pmrem.fromScene(env, 0.02).texture;
  pmrem.dispose();
  const cubeRT = new THREE.WebGLCubeRenderTarget(256, { type: THREE.HalfFloatType, generateMipmaps: true, minFilter: THREE.LinearMipmapLinearFilter });
  new THREE.CubeCamera(0.1, 80, cubeRT).update(renderer, env);
  const envRot = { value: 0 }, cache = new Map();
  const memo = (key, make) => cache.get(key) || (cache.set(key, make()), cache.get(key));
  return {
    envTex, envRot,
    metal: (tone = 'ouro', rough) => memo(`m${tone}${rough}`, () => {
      const t = METAIS[tone] || METAIS.ouro;
      const m = new THREE.MeshPhysicalMaterial({ metalness: 1, roughness: rough ?? t.rough, envMapIntensity: 1.3, specularIntensity: 1 });
      m.color.setRGB(...t.cor);
      if (tone === 'preto') { m.clearcoat = 1; m.clearcoatRoughness = 0.06; }
      return m;
    }),
    gem: (stone = 'cristal') => memo(`g${stone}`, () => {
      const p = PEDRAS[stone] || PEDRAS.cristal;
      return new THREE.ShaderMaterial({
        vertexShader: DIAMOND_VS, fragmentShader: DIAMOND_FS,
        uniforms: {
          envMap: { value: cubeRT.texture }, envRot,
          tint: { value: new THREE.Color().setRGB(...p.tint) },
          fire: { value: p.fire }, aurora: { value: p.aurora || 0 }, gain: { value: p.gain || 1 },
        },
      });
    }),
    opal: () => memo('opal', () => {
      const map = opalTexture();
      return new THREE.MeshPhysicalMaterial({
        color: 0xffffff, map, emissive: 0xffffff, emissiveMap: map, emissiveIntensity: 0.28,
        roughness: 0.12, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.03,
        iridescence: 1, iridescenceIOR: 1.7, iridescenceThicknessRange: [120, 820], envMapIntensity: 1.4,
      });
    }),
    pearl: () => memo('pearl', () => new THREE.MeshPhysicalMaterial({
      color: 0xf7efe4, roughness: 0.26, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.12,
      sheen: 1, sheenColor: new THREE.Color(0xffd6e4), sheenRoughness: 0.35,
      iridescence: 0.55, iridescenceIOR: 1.5, iridescenceThicknessRange: [220, 420], envMapIntensity: 1.2,
    })),
  };
}

/* ==========================================================================
   Lapidação: brilhante redonda com 57 facetas e formas derivadas
   ========================================================================== */
// contorno polar: para cada ângulo, a distância até a borda da pedra
function polar(pts) {
  const N = 720, tab = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    const th = (i / N) * TAU, dx = Math.cos(th), dy = Math.sin(th);
    let best = 0;
    for (let j = 0; j < pts.length; j++) {
      const [ax, ay] = pts[j], [bx, by] = pts[(j + 1) % pts.length];
      const ex = bx - ax, ey = by - ay, den = dx * ey - dy * ex;
      if (Math.abs(den) < 1e-9) continue;
      const t = (ax * ey - ay * ex) / den, u = (ax * dy - ay * dx) / den;
      if (t > 0 && u >= 0 && u <= 1 && t > best) best = t;
    }
    tab[i] = best;
  }
  return (th) => tab[((Math.round((th / TAU) * N) % N) + N) % N];
}
const curve = (n, f) => Array.from({ length: n }, (_, i) => f(i / n));
// no espaço da pedra, z vira o "para baixo" da tela (a mesa fica virada para a câmera)
const CUTS = {
  round: () => 1,
  oval: polar(curve(96, (u) => [0.72 * Math.cos(u * TAU), 1.0 * Math.sin(u * TAU)])),
  marquise: polar([
    ...curve(40, (u) => { const t = -1 + 2 * u; return [0.5 * (1 - t * t) ** 0.8, 1.45 * t]; }), [0, 1.45],
    ...curve(40, (u) => { const t = 1 - 2 * u; return [-0.5 * (1 - t * t) ** 0.8, 1.45 * t]; }), [0, -1.45],
  ]),
  // gota com a ponta para cima na tela
  pear: polar(curve(120, (u) => {
    const a = u * TAU, s = Math.sin(a);
    return [0.78 * Math.cos(a), 0.22 + 0.78 * s * (s < 0 ? 1 + 0.78 * (-s) ** 2.2 : 1)];
  })),
  heart: polar(curve(180, (u) => {
    const t = u * TAU, x = 16 * Math.sin(t) ** 3, y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
    return [x / 15, -(y + 2.5) / 15];
  })),
  princess: polar([[-0.8, -0.8], [0.8, -0.8], [0.8, 0.8], [-0.8, 0.8]]),
};
// ângulo na tela -> ângulo no espaço da pedra
const edge = (cut, phi) => CUTS[cut](-phi);

function brilliantTris() {
  const v = (x, y, z) => new THREE.Vector3(x, y, z);
  const T = [], C = [], Gt = [], Gb = [], P = [];
  for (let k = 0; k < 8; k++) {
    const a = ((k + 0.5) * Math.PI) / 4, b = (k * Math.PI) / 4;
    T.push(v(Math.cos(a) * 0.56, 0.36, Math.sin(a) * 0.56));  // mesa
    C.push(v(Math.cos(b) * 0.82, 0.2, Math.sin(b) * 0.82));   // pontas das estrelas
    P.push(v(Math.cos(b) * 0.48, -0.5, Math.sin(b) * 0.48));  // pavilhão
  }
  for (let j = 0; j < 16; j++) {
    const a = (j * Math.PI) / 8;
    Gt.push(v(Math.cos(a), 0.025, Math.sin(a))); Gb.push(v(Math.cos(a), -0.025, Math.sin(a))); // cintura
  }
  const top = v(0, 0.36, 0), cul = v(0, -0.86, 0), tris = [];
  const m8 = (i) => (i + 8) % 8, m16 = (i) => (i + 16) % 16;
  for (let k = 0; k < 8; k++) {
    tris.push([top, T[k], T[m8(k + 1)]]);                                   // mesa
    tris.push([T[m8(k - 1)], T[k], C[k]]);                                  // estrela
    tris.push([T[k], C[k], Gt[2 * k + 1]], [T[k], Gt[2 * k + 1], C[m8(k + 1)]]); // coroa (kite)
    tris.push([C[k], Gt[2 * k], Gt[2 * k + 1]], [C[k], Gt[m16(2 * k - 1)], Gt[2 * k]]); // cintura superior
    tris.push([Gb[2 * k], Gb[2 * k + 1], P[k]], [Gb[2 * k + 1], Gb[m16(2 * k + 2)], P[m8(k + 1)]], [Gb[2 * k + 1], P[m8(k + 1)], P[k]]); // cintura inferior
    tris.push([P[k], P[m8(k + 1)], cul]);                                   // pavilhão
  }
  for (let j = 0; j < 16; j++) tris.push([Gt[j], Gb[j], Gb[m16(j + 1)]], [Gt[j], Gb[m16(j + 1)], Gt[m16(j + 1)]]);
  // orienta as faces para fora antes de deformar (a deformação preserva a orientação)
  const ab = new THREE.Vector3(), ac = new THREE.Vector3(), c = new THREE.Vector3();
  return tris.map(([a, b, d]) => {
    ab.subVectors(b, a); ac.subVectors(d, a); ab.cross(ac);
    c.copy(a).add(b).add(d);
    return ab.dot(c) < 0 ? [a, d, b] : [a, b, d];
  });
}
const geos = new Map();
const once = (k, f) => geos.get(k) || (geos.set(k, f()), geos.get(k));
function gemGeo(cut) {
  return once(`gem-${cut}`, () => {
    const R = CUTS[cut], pos = [];
    for (const tri of brilliantTris()) for (const p of tri) {
      const r = R(Math.atan2(p.z, p.x));
      pos.push(p.x * r, p.y, p.z * r);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.computeVertexNormals(); // sem índice: cada faceta fica com a própria normal
    g.rotateX(Math.PI / 2);   // mesa para +z (para a câmera)
    return g;
  });
}
const sphereG = () => once('sphere', () => new THREE.SphereGeometry(1, 28, 18));
const prongG = () => once('prong', () => new THREE.TubeGeometry(new THREE.CatmullRomCurve3([
  new THREE.Vector3(0.5, 0, -0.78), new THREE.Vector3(1.0, 0, -0.12), new THREE.Vector3(1.05, 0, 0.12), new THREE.Vector3(0.86, 0, 0.3),
]), 16, 0.06, 8));

/* ---------- peças básicas (frente = +z, haste vai para -z) ---------- */
function mesh(g, m, x = 0, y = 0, z = 0, s = 1) {
  const o = new THREE.Mesh(g, m);
  o.position.set(x, y, z);
  typeof s === 'number' ? o.scale.setScalar(s) : o.scale.set(...s);
  return o;
}
const ball = (m, r, x, y, z) => mesh(sphereG(), m, x, y, z, r);
function gem(k, cut, size, stone) {
  const m = mesh(gemGeo(cut), k.gem(stone), 0, 0, 0, size);
  m.userData.gem = true;
  return m;
}
const PRONGS = {
  round: [45, 135, 225, 315], oval: [40, 140, 220, 320], princess: [45, 135, 225, 315],
  marquise: [90, 270, 25, 155, 205, 335], pear: [90, 205, 335], heart: [270, 30, 150],
};
// pedra em garras, com cesto por baixo
function prong(k, cut, size, stone, au, six = false) {
  const g = new THREE.Group();
  g.add(gem(k, cut, size, stone));
  const angles = six && cut === 'round' ? [0, 60, 120, 180, 240, 300] : PRONGS[cut];
  for (const d of angles) {
    const phi = (d * Math.PI) / 180, r = edge(cut, phi);
    const p = mesh(prongG(), au, 0, 0, 0, [size * r, size, size]);
    p.rotation.z = phi;
    g.add(p, ball(au, size * 0.08, Math.cos(phi) * r * size * 0.86, Math.sin(phi) * r * size * 0.86, size * 0.31));
  }
  const basket = new THREE.Mesh(once('basket', () => new THREE.TorusGeometry(0.62, 0.05, 8, 48)), au);
  basket.scale.set(size * edge(cut, 0), size * edge(cut, Math.PI / 2), size);
  basket.position.z = -size * 0.42;
  g.add(basket);
  return g;
}
// pedra em aro fechado (bezel)
function bezel(k, cut, size, stone, au, beads = false) {
  const g = new THREE.Group();
  g.add(gem(k, cut, size, stone));
  const ring = new THREE.Mesh(once(`bezel-${cut}`, () => {
    const out = new THREE.Shape(), hole = new THREE.Path(), n = 72;
    for (let i = 0; i <= n; i++) {
      const phi = (i / n) * TAU, r = edge(cut, phi);
      const f = i ? 'lineTo' : 'moveTo';
      out[f](Math.cos(phi) * r * 1.14, Math.sin(phi) * r * 1.14);
      hole[f](Math.cos(phi) * r * 0.97, Math.sin(phi) * r * 0.97);
    }
    out.holes.push(hole);
    return new THREE.ExtrudeGeometry(out, { depth: 0.36, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.04, bevelSegments: 3, curveSegments: 48 }).translate(0, 0, -0.26);
  }), au);
  ring.scale.setScalar(size);
  g.add(ring);
  const back = mesh(once('disc', () => new THREE.CylinderGeometry(1, 1, 1, 48).rotateX(Math.PI / 2)), au, 0, 0, -size * 0.28, [size * edge(cut, 0), size * edge(cut, Math.PI / 2), size * 0.08]);
  g.add(back);
  if (beads) { // milgrain: bolinhas em volta do aro
    const n = 28;
    for (let i = 0; i < n; i++) {
      const phi = (i / n) * TAU, r = edge(cut, phi) * 1.2 * size;
      g.add(ball(au, size * 0.065, Math.cos(phi) * r, Math.sin(phi) * r, size * 0.1));
    }
  }
  return g;
}
const rodG = () => once('rod', () => new THREE.CylinderGeometry(1, 1, 1, 20).rotateX(Math.PI / 2));
// haste de labret com disco no fundo
function labret(k, len = 1.9, r = 0.085, disc = true) {
  const ti = k.metal('branco', 0.22), g = new THREE.Group();
  g.add(mesh(rodG(), ti, 0, 0, -len / 2, [r, r, len]));
  if (disc) g.add(mesh(rodG(), ti, 0, 0, -len, [r * 4.8, r * 4.8, r * 1.1]));
  return g;
}
function tube(points, r, m, closed = false, seg = 64, radial = 12) {
  return new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)), closed), seg, r, radial, closed), m);
}
// libera as geometrias próprias da peça (as do cache são compartilhadas e ficam)
function dispose(obj) {
  const shared = new Set(geos.values());
  obj.traverse((o) => { if (o.isMesh && !shared.has(o.geometry)) o.geometry.dispose(); });
}
const torus = (R, r, m, arc = TAU) => new THREE.Mesh(new THREE.TorusGeometry(R, r, 24, 160, arc), m);
// pedras em fileira na frente de uma argola (de a0 até a1, em radianos)
function pave(g, k, R, size, stone, au, a0, a1, n, z) {
  for (let i = 0; i < n; i++) {
    const a = a0 + (a1 - a0) * (i / (n - 1));
    const s = gem(k, 'round', size, stone);
    s.position.set(Math.cos(a) * R, Math.sin(a) * R, z);
    g.add(s);
    if (i < n - 1) {
      const b = a + (a1 - a0) / (n - 1) / 2;
      g.add(ball(au, size * 0.26, Math.cos(b) * R, Math.sin(b) * R, z + size * 0.2));
    }
  }
}

/* ==========================================================================
   Catálogo: cada peça é uma função (kit, {tom, pedra}) -> grupo 3D
   ========================================================================== */
export const CATALOGO = [
  { id: 'ponto-luz', nome: 'Ponto de luz', cat: 'orelha', onde: 'Lóbulo · tragus · helix · flat',
    desc: 'O clássico: uma pedra brilhante presa em quatro garras, que deixam a luz entrar por todos os lados.',
    tipo: 'Labret · rosca interna ou push pin', pedra: true,
    make: (k, o) => { const g = new THREE.Group(), au = k.metal(o.tom); g.add(prong(k, 'round', 0.78, o.pedra, au), labret(k)); return g; } },

  { id: 'clicker', nome: 'Clicker cravejado', cat: 'orelha', onde: 'Daith · helix · lóbulo',
    desc: 'Argola com pedras em linha que abraça a curva da cartilagem. Brilho contínuo e fecho de clique firme.',
    tipo: 'Argola clicker · dobradiça', pedra: true,
    make: (k, o) => {
      const g = new THREE.Group(), au = k.metal(o.tom), R = 1.2, t = 0.09;
      g.add(torus(R, t, au));
      pave(g, k, R, t * 0.95, o.pedra, au, -Math.PI * 0.1, -Math.PI * 0.9, 15, t * 0.75);
      g.add(mesh(rodG(), au, 0, R, 0, [t * 1.35, t * 1.35, t * 2.6]));
      g.children.at(-1).rotation.y = Math.PI / 2;
      return g;
    } },

  { id: 'flor', nome: 'Flor de marquises', cat: 'orelha', onde: 'Flat · helix · conch',
    desc: 'Cinco pétalas de pedra em garras ao redor de um ponto de luz. A peça que vira assinatura do projeto.',
    tipo: 'Threadless · pino sem rosca', pedra: true,
    make: (k, o) => {
      const g = new THREE.Group(), au = k.metal(o.tom);
      for (let i = 0; i < 5; i++) {
        const a = Math.PI / 2 + (i * TAU) / 5, p = prong(k, 'marquise', 0.36, o.pedra, au);
        p.position.set(Math.cos(a) * 0.66, Math.sin(a) * 0.66, -0.05);
        p.rotation.z = a - Math.PI / 2;
        g.add(p);
      }
      g.add(bezel(k, 'round', 0.26, o.pedra, au), labret(k, 1.6, 0.06, false));
      return g;
    } },

  { id: 'coracao', nome: 'Coração', cat: 'orelha', onde: 'Lóbulo · helix · conch',
    desc: 'Pedra lapidada em coração, presa em três garras. Delicada sozinha, perfeita para compor com pontos de luz.',
    tipo: 'Labret · rosca interna', pedra: true,
    make: (k, o) => { const g = new THREE.Group(), au = k.metal(o.tom); g.add(prong(k, 'heart', 0.8, o.pedra, au), labret(k)); return g; } },

  { id: 'cluster', nome: 'Cluster de luz', cat: 'orelha', onde: 'Helix · flat · forward helix',
    desc: 'Pedras de tamanhos diferentes em meia-lua, como uma pequena constelação presa num só furo.',
    tipo: 'Threadless · pino sem rosca', pedra: true,
    make: (k, o) => {
      const g = new THREE.Group(), au = k.metal(o.tom);
      const set = [['round', 0.42, -0.1, 0.05], ['marquise', 0.26, 0.62, 0.45, -0.7], ['round', 0.24, 0.55, -0.42], ['pear', 0.26, -0.48, 0.7, 0.5], ['round', 0.18, -0.72, -0.18], ['round', 0.15, 0.12, -0.75]];
      const pts = [];
      for (const [cut, s, x, y, rz = 0] of set) { const p = prong(k, cut, s, o.pedra, au); p.position.set(x, y, 0); p.rotation.z = rz; g.add(p); pts.push([x, y, -s * 0.5]); }
      g.add(tube([pts[3], pts[0], pts[1]], 0.035, au), tube([pts[4], pts[0], pts[2], pts[5]], 0.035, au), labret(k, 1.6, 0.06, false));
      return g;
    } },

  { id: 'trindade', nome: 'Trindade de ouro', cat: 'orelha', onde: 'Lóbulo · tragus · helix',
    desc: 'Três esferas polidas em triângulo. Pequena, delicada e fácil de combinar com qualquer projeto.',
    tipo: 'Labret · rosca interna', pedra: false,
    make: (k, o) => {
      const g = new THREE.Group(), au = k.metal(o.tom, (METAIS[o.tom] || METAIS.ouro).rough * 0.6);
      for (let i = 0; i < 3; i++) { const a = Math.PI / 2 + (i * TAU) / 3; g.add(ball(au, 0.38, Math.cos(a) * 0.46, Math.sin(a) * 0.46, 0)); }
      g.add(labret(k)); return g;
    } },

  { id: 'opala', nome: 'Opala', cat: 'orelha', onde: 'Tragus · conch · lóbulo',
    desc: 'Cabochão de opala com fogo colorido que muda a cada movimento, em aro com bordinha granulada.',
    tipo: 'Labret · rosca interna', pedra: false,
    make: (k, o) => {
      const g = new THREE.Group(), au = k.metal(o.tom);
      const dome = mesh(once('dome', () => new THREE.SphereGeometry(1, 64, 32, 0, TAU, 0, Math.PI / 2).rotateX(Math.PI / 2)), k.opal(), 0, 0, -0.02, [0.62, 0.62, 0.36]);
      const b = bezel(k, 'round', 0.62, 'cristal', au, true); b.remove(b.children[0]); // aro sem a pedra de cristal
      g.add(b, dome, labret(k)); return g;
    } },

  { id: 'perola', nome: 'Pérola', cat: 'orelha', onde: 'Lóbulo · helix · tragus',
    desc: 'Pérola com brilho acetinado e reflexo rosado. Clássica, mas nunca óbvia.',
    tipo: 'Labret · rosca interna', pedra: false,
    make: (k, o) => {
      const g = new THREE.Group(), au = k.metal(o.tom);
      g.add(ball(k.pearl(), 0.64, 0, 0, 0.2), mesh(once('cup', () => new THREE.CylinderGeometry(0.3, 0.16, 0.22, 32).rotateX(Math.PI / 2)), au, 0, 0, -0.42), labret(k));
      return g;
    } },

  { id: 'argola', nome: 'Argola lisa', cat: 'orelha', onde: 'Helix · rook · conch · nostril',
    desc: 'Argola segmentada polida, sem emenda aparente. O metal faz todo o trabalho de luz.',
    tipo: 'Argola segmentada', pedra: false,
    make: (k, o) => { const g = new THREE.Group(); g.add(torus(1.05, 0.09, k.metal(o.tom, 0.06))); return g; } },

  { id: 'torcida', nome: 'Argola torcida', cat: 'orelha', onde: 'Helix · lóbulo · daith',
    desc: 'Três fios trançados em espiral. Cada volta pega a luz num ângulo diferente.',
    tipo: 'Argola clicker', pedra: false,
    make: (k, o) => {
      const g = new THREE.Group(), au = k.metal(o.tom, 0.08), R = 1.05, a = 0.07, n = 26;
      for (let s = 0; s < 3; s++) {
        const pts = curve(200, (u) => { const th = u * TAU, ph = th * n + (s * TAU) / 3; const rr = R + Math.cos(ph) * a; return [Math.cos(th) * rr, Math.sin(th) * rr, Math.sin(ph) * a]; });
        g.add(tube(pts, 0.052, au, true, 420, 8));
      }
      return g;
    } },

  { id: 'conch-duo', nome: 'Argola dupla cravejada', cat: 'orelha', onde: 'Conch · lóbulo',
    desc: 'Duas fileiras de pedras numa argola só. Volume e brilho para o conch, sem precisar de dois furos.',
    tipo: 'Argola clicker larga', pedra: true,
    make: (k, o) => {
      const g = new THREE.Group(), au = k.metal(o.tom);
      for (const R of [1.12, 0.94]) { g.add(torus(R, 0.07, au)); pave(g, k, R, 0.068, o.pedra, au, -Math.PI * 0.08, -Math.PI * 0.92, 17, 0.06); }
      for (const a of [0.2, 0.5, 0.8]) { const t = -Math.PI * a; g.add(mesh(rodG(), au, Math.cos(t) * 1.03, Math.sin(t) * 1.03, -0.04, [0.04, 0.04, 0.12])); }
      return g;
    } },

  { id: 'estrela', nome: 'Estrela', cat: 'orelha', onde: 'Flat · helix · lóbulo',
    desc: 'Estrela de metal com uma pedra no centro. Pequena peça, muito brilho.',
    tipo: 'Threadless · pino sem rosca', pedra: true,
    make: (k, o) => {
      const g = new THREE.Group(), au = k.metal(o.tom);
      const star = new THREE.Mesh(once('star', () => {
        const s = new THREE.Shape();
        for (let i = 0; i <= 10; i++) { const a = Math.PI / 2 + (i * Math.PI) / 5, r = i % 2 ? 0.42 : 0.98; s[i ? 'lineTo' : 'moveTo'](Math.cos(a) * r, Math.sin(a) * r); }
        return new THREE.ExtrudeGeometry(s, { depth: 0.14, bevelEnabled: true, bevelThickness: 0.06, bevelSize: 0.05, bevelSegments: 4 }).translate(0, 0, -0.14);
      }), au);
      g.add(star, bezel(k, 'round', 0.3, o.pedra, au), labret(k, 1.6, 0.06, false));
      g.children[1].position.z = 0.1;
      return g;
    } },

  { id: 'septo', nome: 'Septo ornamentado', cat: 'nariz', onde: 'Septo',
    desc: 'Clicker de septo com marquises e bordinha de bolinhas. Aparece na medida certa, logo abaixo do nariz.',
    tipo: 'Clicker de septo', pedra: true,
    make: (k, o) => {
      const g = new THREE.Group(), au = k.metal(o.tom), R = 0.95;
      g.add(torus(R, 0.068, au));
      const front = new THREE.Group(); front.position.set(0, -R - 0.08, 0.1); g.add(front);
      front.add(bezel(k, 'round', 0.24, o.pedra, au));
      for (const sx of [-1, 1]) { const m = prong(k, 'marquise', 0.17, o.pedra, au); m.position.set(sx * 0.46, 0.06, 0); m.rotation.z = sx * Math.PI / 2.4; front.add(m); }
      for (let i = 0; i < 13; i++) { const a = -Math.PI * (0.2 + 0.6 * (i / 12)); g.add(ball(au, 0.05, Math.cos(a) * (R + 0.16), Math.sin(a) * (R + 0.16) - 0.04, 0.05)); }
      g.add(mesh(rodG(), au, 0, R, 0, [0.09, 0.09, 0.2]));
      g.children.at(-1).rotation.y = Math.PI / 2;
      return g;
    } },

  { id: 'ferradura', nome: 'Ferradura', cat: 'nariz', onde: 'Septo · lábio · rook',
    desc: 'Barra circular aberta com esferas nas pontas. Dá para virar para cima e esconder quando quiser.',
    tipo: 'Circular barbell · rosca', pedra: false,
    make: (k, o) => {
      const g = new THREE.Group(), au = k.metal(o.tom, 0.07), R = 0.95, gap = 0.36, a0 = Math.PI / 2 + gap;
      const t = torus(R, 0.075, au, TAU - gap * 2); t.rotation.z = a0; g.add(t);
      for (const a of [a0, a0 + TAU - gap * 2]) g.add(ball(au, 0.18, Math.cos(a) * R, Math.sin(a) * R, 0));
      return g;
    } },

  { id: 'nostril', nome: 'Nostril com pedra', cat: 'nariz', onde: 'Nostril · high nostril',
    desc: 'Ponto de luz miudinho em aro fechado, com haste curva que segura firme dentro da narina.',
    tipo: 'Nostril · haste curva', pedra: true,
    make: (k, o) => {
      const g = new THREE.Group(), au = k.metal(o.tom);
      g.add(bezel(k, 'round', 0.42, o.pedra, au), tube([[0, 0, -0.1], [0, 0, -0.9], [0.08, -0.2, -1.25], [0.32, -0.26, -1.15], [0.42, -0.1, -0.95]], 0.07, k.metal('branco', 0.22)));
      return g;
    } },

  { id: 'umbigo', nome: 'Umbigo com gota', cat: 'corpo', onde: 'Umbigo',
    desc: 'Barra curva com pedra em cima, pedra maior embaixo e uma gota pendente que balança com o corpo.',
    tipo: 'Barra curva (banana)', pedra: true,
    make: (k, o) => {
      const g = new THREE.Group(), au = k.metal(o.tom);
      g.add(tube([[0, 1.45, -0.05], [0, 1.15, -0.55], [0, 0.45, -0.62], [0, -0.05, -0.12]], 0.065, k.metal('branco', 0.22)));
      const top = bezel(k, 'round', 0.2, o.pedra, au); top.position.set(0, 1.5, 0); g.add(top);
      const mid = bezel(k, 'round', 0.42, o.pedra, au); mid.position.set(0, -0.12, 0.05); g.add(mid);
      const jr = torus(0.12, 0.03, au); jr.rotation.y = Math.PI / 2; jr.position.set(0, -0.68, 0); g.add(jr);
      const drop = prong(k, 'pear', 0.42, o.pedra, au); drop.position.set(0, -1.18, 0); g.add(drop);
      drop.name = 'swing'; // a gota balança
      return g;
    } },

  { id: 'microdermal', nome: 'Microdermal', cat: 'corpo', onde: 'Rosto · colo · nuca · dedos',
    desc: 'Uma pedra que parece flutuar na pele. A base fica por baixo, só o brilho aparece.',
    tipo: 'Topo de microdermal · âncora', pedra: true,
    make: (k, o) => {
      const g = new THREE.Group(), au = k.metal(o.tom), ti = k.metal('branco', 0.3);
      g.add(bezel(k, 'round', 0.6, o.pedra, au));
      g.add(mesh(rodG(), ti, 0, 0, -0.5, [0.13, 0.13, 0.4]));
      const shape = new THREE.Shape();
      shape.absarc(-0.62, 0, 0.3, Math.PI / 2, Math.PI * 1.5, false);
      shape.absarc(0.62, 0, 0.3, -Math.PI / 2, Math.PI / 2, false);
      for (const hx of [-0.62, 0.62]) { const h = new THREE.Path(); h.absarc(hx, 0, 0.12, 0, TAU, true); shape.holes.push(h); }
      g.add(mesh(new THREE.ExtrudeGeometry(shape, { depth: 0.07, bevelEnabled: true, bevelSize: 0.02, bevelThickness: 0.02, bevelSegments: 2, curveSegments: 24 }), ti, 0, 0, -0.78));
      return g;
    } },

  { id: 'spike', nome: 'Spike', cat: 'corpo', onde: 'Rosto · lábio · helix',
    desc: 'Cone polido de ponta fina. Usado em tamanhos diferentes, monta projetos simétricos marcantes.',
    tipo: 'Labret · rosca interna', pedra: false,
    make: (k, o) => {
      const g = new THREE.Group(), au = k.metal(o.tom, 0.06);
      g.add(mesh(once('cone', () => new THREE.ConeGeometry(0.34, 1.0, 64, 1).rotateX(Math.PI / 2)), au, 0, 0, 0.5), mesh(rodG(), au, 0, 0, -0.03, [0.36, 0.36, 0.08]), labret(k));
      return g;
    } },

  { id: 'industrial', nome: 'Barra industrial', cat: 'orelha', onde: 'Industrial · transversal',
    desc: 'Uma barra só ligando dois furos no alto da orelha, com esfera numa ponta e pedra na outra.',
    tipo: 'Barbell longo · rosca', pedra: true,
    make: (k, o) => {
      const g = new THREE.Group(), au = k.metal(o.tom), ti = k.metal('branco', 0.2);
      const bar = mesh(rodG(), ti, 0, 0, 0, [0.07, 0.07, 3.2]); bar.rotation.y = Math.PI / 2; g.add(bar);
      g.add(ball(au, 0.2, -1.72, 0, 0));
      const p = prong(k, 'round', 0.28, o.pedra, au); p.position.set(1.74, 0, 0.12); g.add(p);
      g.rotation.z = 0.22;
      return g;
    } },
];

/* ---------- cintilação: estrelas de luz que acendem sobre as pedras ---------- */
function starTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const x = c.getContext('2d');
  const g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.08, 'rgba(255,246,230,.9)'); g.addColorStop(0.3, 'rgba(255,225,180,.18)'); g.addColorStop(1, 'rgba(255,220,170,0)');
  x.fillStyle = g; x.fillRect(0, 0, 128, 128);
  const ray = (w, a) => {
    x.save(); x.translate(64, 64); x.rotate(a);
    const l = x.createLinearGradient(-64, 0, 64, 0);
    l.addColorStop(0, 'rgba(255,255,255,0)'); l.addColorStop(0.5, `rgba(255,255,255,${w})`); l.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = l; x.fillRect(-64, -1.2, 128, 2.4); x.restore();
  };
  ray(1, 0); ray(1, Math.PI / 2); ray(0.45, Math.PI / 4); ray(0.45, -Math.PI / 4);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
function glints(max) {
  const pos = new Float32Array(max * 3), size = new Float32Array(max), seed = new Float32Array(max);
  for (let i = 0; i < max; i++) seed[i] = Math.random() * 100;
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('size', new THREE.BufferAttribute(size, 1));
  geo.setAttribute('seed', new THREE.BufferAttribute(seed, 1));
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending,
    uniforms: { map: { value: starTexture() }, t: { value: 0 }, vh: { value: 800 } },
    vertexShader: `attribute float size, seed; uniform float t, vh; varying float a;
      void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.0);
        float s = max(0.0, sin(t * 1.9 + seed * 7.1) * sin(t * 0.71 + seed * 3.3));
        a = pow(s, 12.0);
        gl_PointSize = size * (0.4 + 1.3 * a) * projectionMatrix[1][1] * vh * 0.5 / -mv.z;
        gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `uniform sampler2D map; varying float a;
      void main(){ if (a < 0.01) discard; gl_FragColor = texture2D(map, gl_PointCoord) * vec4(1.6, 1.5, 1.4, a); }`,
  });
  const points = new THREE.Points(geo, mat);
  points.frustumCulled = false;
  const v = new THREE.Vector3(), cam = new THREE.Vector3(), dir = new THREE.Vector3();
  return {
    points,
    // acompanha as pedras do grupo; as estrelas ficam um pouco à frente da mesa
    update(gems, camera, t) {
      camera.getWorldPosition(cam);
      const n = Math.min(max, gems.length);
      for (let i = 0; i < max; i++) {
        if (i >= n) { size[i] = 0; continue; }
        const m = gems[Math.floor((i * gems.length) / n)];
        let vis = true;
        for (let o = m; o; o = o.parent) if (!o.visible) { vis = false; break; } // peça escondida no celular
        const r = m.matrixWorld.getMaxScaleOnAxis();
        v.setFromMatrixPosition(m.matrixWorld);
        v.addScaledVector(dir.subVectors(cam, v).normalize(), r * 0.5);
        pos[i * 3] = v.x; pos[i * 3 + 1] = v.y; pos[i * 3 + 2] = v.z;
        size[i] = vis ? r * 2.2 : 0;
      }
      geo.attributes.position.needsUpdate = true;
      geo.attributes.size.needsUpdate = true;
      mat.uniforms.t.value = t;
    },
  };
}
const gemsOf = (o) => { const a = []; o.traverse((m) => { if (m.userData.gem) a.push(m); }); return a; };

/* ---------- poeira dourada ao fundo (pares espelhados, como tudo na Naiá) ---------- */
function dust(count, spread) {
  const pos = new Float32Array(count * 3), seed = new Float32Array(count);
  let s = 7; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
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
    uniforms: { t: { value: 0 }, px: { value: Math.min(devicePixelRatio, 2) } },
    vertexShader: `attribute float seed; uniform float t, px; varying float a;
      void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.0); a = pow(0.5 + 0.5 * sin(t * 1.3 + seed * 3.0), 6.0);
        gl_PointSize = (10.0 + 26.0 * a) * px / -mv.z; gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `varying float a;
      void main(){ vec2 p = gl_PointCoord - 0.5; float d = length(p);
        float g = exp(-d * d * 60.0) + 0.5 * exp(-abs(p.x) * 40.0) * exp(-abs(p.y) * 6.0) + 0.5 * exp(-abs(p.y) * 40.0) * exp(-abs(p.x) * 6.0);
        gl_FragColor = vec4(vec3(1.0, 0.86, 0.62) * g, g * (0.2 + 0.8 * a)); }`,
  });
  return new THREE.Points(geo, mat);
}

/* ---------- palco: renderer + bloom ---------- */
// o canvas é opaco (preto) e entra na página com mix-blend-mode: screen,
// assim o bloom brilha por cima do fundo sem perder a transparência
function stage(canvas, { dpr = 1.75, bloom = 0.55, threshold = 0.92, radius = 0.5 } = {}) {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false, powerPreference: 'high-performance' });
    if (!renderer.capabilities.isWebGL2) throw new Error('webgl2');
  } catch (e) { return null; }
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, dpr));
  renderer.setClearColor(0x000000, 1);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  const k = kit(renderer);
  const scene = new THREE.Scene();
  scene.environment = k.envTex;
  const key = new THREE.DirectionalLight(0xfff0dc, 1.4); key.position.set(2, 4, 6);
  const rim = new THREE.DirectionalLight(0xc9b6ff, 0.8); rim.position.set(-4, -1, -3);
  scene.add(key, rim);
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 80);
  const composer = new EffectComposer(renderer, new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: 2 }));
  composer.addPass(new RenderPass(scene, camera));
  const bloomPass = new UnrealBloomPass(new THREE.Vector2(1, 1), bloom, radius, threshold);
  composer.addPass(bloomPass);
  composer.addPass(new OutputPass());
  const gl = glints(mobile ? 28 : 56);
  scene.add(gl.points);
  return {
    renderer, scene, camera, k, composer, gl,
    size(w, h) {
      renderer.setSize(w, h, false);
      composer.setSize(w, h);
      camera.aspect = w / h; camera.updateProjectionMatrix();
      gl.points.material.uniforms.vh.value = h * renderer.getPixelRatio();
    },
    render() { composer.render(); },
  };
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
  new IntersectionObserver(([e]) => { seen = e.isIntersecting; sync(); }, { rootMargin: '120px' }).observe(el);
  document.addEventListener('visibilitychange', sync);
}

// centraliza a peça e escala para caber numa esfera de raio r
function fit(obj, r) {
  obj.updateMatrixWorld(true);
  const sph = new THREE.Box3().setFromObject(obj).getBoundingSphere(new THREE.Sphere());
  const w = new THREE.Group();
  obj.position.sub(sph.center);
  w.add(obj);
  w.scale.setScalar(r / (sph.radius || 1));
  return w;
}
const build = (k, id, o) => (CATALOGO.find((c) => c.id === id) || CATALOGO[0]).make(k, o);

/* ==========================================================================
   Hero: constelação simétrica em volta do nome
   ========================================================================== */
function hero() {
  const canvas = document.getElementById('gl');
  if (!canvas) return;
  const st = stage(canvas, { dpr: 1.5, bloom: 0.32, threshold: 1.1, radius: 0.35 });
  if (!st) return document.documentElement.classList.add('no-webgl');
  const { scene, camera, k } = st;
  const world = new THREE.Group(); scene.add(world);
  const heroEl = canvas.closest('.hero'), nameEl = heroEl.querySelector('.name b');

  // a argola cravejada emoldura o nome; as outras peças vêm em pares espelhados
  const ring = (() => {
    const g = new THREE.Group(), au = k.metal('ouro'), R = 1.3, t = 0.075;
    g.add(torus(R, t, au));
    pave(g, k, R, t * 0.95, 'cristal', au, -Math.PI * 0.08, -Math.PI * 0.92, 21, t * 0.72);
    const h = mesh(rodG(), au, 0, R, 0, [t * 1.4, t * 1.4, t * 2.6]); h.rotation.y = Math.PI / 2; g.add(h);
    return g;
  })();
  const pieces = [{ obj: ring, center: true, phase: 0 }];
  // [id, tom, pedra, raio, posição desktop, posição celular (null = some), giro z, fase]
  const SLOTS = [
    ['flor', 'ouro', 'cristal', 0.62, [2.8, 0.7, -0.4], [1.55, 1.25, -0.6], 0.25, 0.4],
    ['ponto-luz', 'branco', 'aurora', 0.36, [2.0, 1.6, -0.9], [1.25, -1.55, -0.4], 0, 3.1],
    ['coracao', 'rose', 'rosa', 0.42, [2.45, -1.45, 0.2], null, 0, 1.6],
    ['torcida', 'ouro', 'cristal', 0.5, [3.85, -0.4, -1.2], null, 0.6, 2.4],
    ['opala', 'ouro', 'cristal', 0.34, [3.7, 1.35, -2.0], null, 0, 4.2],
    ['estrela', 'ouro', 'cristal', 0.3, [1.35, -2.05, -0.6], null, 0.2, 5.1],
  ];
  for (const [id, tom, pedra, r, desk, mob, rz, phase] of SLOTS) {
    for (const side of [-1, 1]) {
      const obj = fit(build(k, id, { tom, pedra }), r);
      pieces.push({ obj, desk, mob, rz: rz * side, phase, side });
    }
  }
  for (const p of pieces) world.add(p.obj);
  const gems = gemsOf(world);
  const motes = dust(mobile ? 60 : 130, { x: 6, y: 7, z: 6 });
  motes.position.z = -1; world.add(motes);

  const target = { x: 0, y: 0 }, look = { x: 0, y: 0 };
  let compact = false, scroll = 0, ringY = 0, ringS = 1;
  addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    target.x = (e.clientX / innerWidth) * 2 - 1;
    target.y = (e.clientY / innerHeight) * 2 - 1;
  }, { passive: true });
  addEventListener('deviceorientation', (e) => {
    if (e.gamma == null) return;
    target.x = Math.max(-1, Math.min(1, e.gamma / 30));
    target.y = Math.max(-1, Math.min(1, (e.beta - 45) / 40));
  }, { passive: true });
  const onScroll = () => { scroll = Math.min(1, Math.max(0, scrollY / (heroEl.offsetHeight || 1))); };
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    compact = w / h < 0.9;
    camera.position.set(0, 0, compact ? 12.5 : 9.6);
    camera.fov = compact ? 38 : 32;
    st.size(w, h);
    // a argola cabe entre a linha de cima e o texto de baixo, centrada no nome
    const halfH = camera.position.z * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    const unit = h / (2 * halfH);
    const r = heroEl.getBoundingClientRect(), n = nameEl.getBoundingClientRect();
    const eb = heroEl.querySelector('.eyebrow').getBoundingClientRect();
    const low = heroEl.querySelector('.hero-low').getBoundingClientRect();
    const cy = n.top + n.height * 0.52 - r.top;
    const room = Math.min(cy - (eb.bottom - r.top) - 16, low.top - r.top - cy + 6);
    const px = Math.max(90, Math.min(room, compact ? w * 0.44 : 300));
    ringY = (0.5 - cy / h) * 2 * halfH;
    ringS = px / (1.42 * unit);
    heroEl.style.setProperty('--ring-top', `${Math.max(0, cy - px)}px`);
    if (reduce && ready) frame(0); // sem animação: redesenha a cada mudança de tamanho
  }
  let ready = false;
  new ResizeObserver(resize).observe(canvas); resize();
  document.fonts?.ready.then(resize);
  // o texto entra subindo 16px: mede de novo quando a animação termina
  heroEl.querySelector('.hero-low').addEventListener('animationend', resize, { once: true });

  const t0 = performance.now() / 1000;
  const frame = (now) => {
    const t = reduce ? 1.2 : now - t0;
    look.x += (target.x - look.x) * 0.05;
    look.y += (target.y - look.y) * 0.05;
    world.rotation.y = look.x * 0.2;
    world.rotation.x = look.y * 0.1;
    k.envRot.value = t * 0.12 + look.x * 0.6;          // a luz do estúdio passeia pelas joias
    scene.environmentRotation.y = k.envRot.value;
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
      p.obj.position.set(p.side * Math.abs(at[0]) * open, ringY + at[1] + bob, at[2] + scroll * 1.5);
      // os dois lados giram em sentidos opostos, como um reflexo
      p.obj.rotation.set(Math.sin(t * 0.5 + p.phase) * 0.25, p.side * (0.35 + Math.sin(t * 0.4 + p.phase) * 0.45), p.rz);
    }
    motes.material.uniforms.t.value = t;
    world.updateMatrixWorld(true);
    st.gl.update(gems, camera, t);
    st.render();
  };
  ready = true;
  loop(canvas, reduce ? () => {} : frame);
  frame(performance.now() / 1000);
  canvas.classList.add('on');
}

/* ==========================================================================
   Ateliê: catálogo, tom do metal, cor da pedra e peça grande girando
   ========================================================================== */
function atelie() {
  const root = document.getElementById('atelie');
  if (!root) return;
  const $ = (s) => root.querySelector(s);
  const list = $('#at-list'), cats = $('#at-cats'), metals = $('#at-metals'), stones = $('#at-stones');
  const state = { id: CATALOGO[0].id, tom: 'ouro', pedra: 'cristal', cat: 'todas' };

  // interface (funciona mesmo sem WebGL)
  cats.innerHTML = [['todas', 'Todas'], ...Object.entries(CATEGORIAS)].map(([id, n]) => `<button data-cat="${id}" aria-pressed="${id === 'todas'}">${n}</button>`).join('');
  list.innerHTML = CATALOGO.map((c, i) => `<li><button data-id="${c.id}" data-cat="${c.cat}" aria-pressed="${!i}"><span>${String(i + 1).padStart(2, '0')}</span><b>${c.nome}</b><i>${c.onde.split(' · ')[0]}</i></button></li>`).join('');
  metals.innerHTML = Object.entries(METAIS).map(([id, m]) => `<button class="sw" data-tom="${id}" aria-pressed="${id === state.tom}" aria-label="${m.nome}" title="${m.nome}"><i style="background:${m.css}"></i></button>`).join('');
  stones.innerHTML = Object.entries(PEDRAS).map(([id, p]) => `<button class="sw" data-pedra="${id}" aria-pressed="${id === state.pedra}" aria-label="${p.nome}" title="${p.nome}"><i style="background:${p.css}"></i></button>`).join('');

  let rebuild = () => {};
  function paint() {
    const c = CATALOGO.find((x) => x.id === state.id);
    $('#at-num').textContent = `${String(CATALOGO.indexOf(c) + 1).padStart(2, '0')} / ${CATALOGO.length}`;
    $('#at-name').textContent = c.nome;
    $('#at-desc').textContent = c.desc;
    $('#at-where').textContent = c.onde;
    $('#at-type').textContent = c.tipo;
    $('#at-metal-name').textContent = METAIS[state.tom].nome;
    $('#at-stone-name').textContent = c.pedra ? PEDRAS[state.pedra].nome : '';
    $('#at-stone-row').hidden = !c.pedra;
    root.querySelectorAll('[data-id]').forEach((b) => b.setAttribute('aria-pressed', b.dataset.id === state.id));
    root.querySelectorAll('[data-tom]').forEach((b) => b.setAttribute('aria-pressed', b.dataset.tom === state.tom));
    root.querySelectorAll('[data-pedra]').forEach((b) => b.setAttribute('aria-pressed', b.dataset.pedra === state.pedra));
    const pedra = c.pedra ? `, pedra ${PEDRAS[state.pedra].nome.toLowerCase()}` : '';
    $('#at-cta').href = wa(`Olá, Naiá! Vi no ateliê do seu site e gostei desta joia: ${c.nome} (${METAIS[state.tom].nome.toLowerCase()}${pedra}). Onde ela ficaria bem em mim?`);
  }
  root.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.cat && b.closest('#at-cats')) {
      state.cat = b.dataset.cat;
      cats.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', x === b));
      list.querySelectorAll('li').forEach((li) => { li.hidden = state.cat !== 'todas' && li.firstChild.dataset.cat !== state.cat; });
      return;
    }
    if (b.dataset.id) state.id = b.dataset.id;
    else if (b.dataset.tom) state.tom = b.dataset.tom;
    else if (b.dataset.pedra) state.pedra = b.dataset.pedra;
    else return;
    paint(); rebuild();
  });
  paint();

  const canvas = $('#at-gl');
  const st = stage(canvas, { dpr: mobile ? 1.75 : 2, bloom: 0.28, threshold: 1.15, radius: 0.3 });
  if (!st) { root.classList.add('no-gl'); return; }
  const { scene, camera, k } = st;
  const FLOOR = -1.85;
  camera.position.set(0, 0.55, 7.4);
  camera.lookAt(0, -0.25, 0);

  // peça + reflexo no "vidro" da vitrine (cópia espelhada que some no escuro)
  const holder = new THREE.Group(), mirrorOut = new THREE.Group(), mirrorIn = new THREE.Group();
  mirrorOut.position.y = FLOOR * 2; mirrorOut.scale.y = -1;
  mirrorOut.add(mirrorIn); scene.add(holder, mirrorOut);
  const fadeTex = (() => {
    const c = document.createElement('canvas'); c.width = c.height = 128;
    const x = c.getContext('2d'), g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, '#5a5a5a'); g.addColorStop(0.55, '#c8c8c8'); g.addColorStop(1, '#ffffff');
    x.fillStyle = g; x.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(c);
  })();
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(16, 16).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, alphaMap: fadeTex, opacity: 0.97 }));
  glass.position.y = FLOOR; glass.renderOrder = 1; scene.add(glass);
  // anel de luz no chão, como a base de uma vitrine
  const halo = new THREE.Mesh(new THREE.RingGeometry(1.75, 1.79, 128).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: new THREE.Color(0xd9b77f).multiplyScalar(0.9), transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending, depthWrite: false }));
  halo.position.y = FLOOR + 0.002; halo.renderOrder = 2; scene.add(halo);
  const motes = dust(36, { x: 3.4, y: 4, z: 3 }); motes.position.z = -1.5; scene.add(motes);

  let piece = null, mirror = null, gems = [], swing = [];
  rebuild = () => {
    if (piece) { holder.remove(piece); mirrorIn.remove(mirror); dispose(piece); }
    piece = fit(build(k, state.id, { tom: state.tom, pedra: state.pedra }), 1.5);
    mirror = piece.clone(); // compartilha geometrias e materiais com a peça
    swing = [piece.getObjectByName('swing'), mirror.getObjectByName('swing')].filter(Boolean);
    holder.add(piece); mirrorIn.add(mirror);
    gems = gemsOf(piece);
    draw();
  };

  // arrastar para girar, com inércia; volta a girar sozinha
  let rotY = 0.5, rotX = 0.12, vel = 0.004, dragging = false, lx = 0, ly = 0, idle = 0, last = 0;
  canvas.addEventListener('pointerdown', (e) => { dragging = true; lx = e.clientX; ly = e.clientY; canvas.setPointerCapture(e.pointerId); });
  canvas.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const dx = e.clientX - lx, dy = e.clientY - ly; lx = e.clientX; ly = e.clientY;
    vel = dx * 0.0035; rotY += dx * 0.009; rotX = Math.max(-0.5, Math.min(0.6, rotX + dy * 0.006));
    idle = 0; draw();
  });
  const up = () => { dragging = false; };
  canvas.addEventListener('pointerup', up); canvas.addEventListener('pointercancel', up);
  canvas.addEventListener('keydown', (e) => {
    const d = { ArrowLeft: -0.25, ArrowRight: 0.25 }[e.key];
    if (d) { rotY += d; idle = 0; vel = 0; draw(); e.preventDefault(); }
  });

  function draw(now = last) {
    holder.rotation.set(rotX, rotY, 0);
    mirrorIn.rotation.copy(holder.rotation);
    for (const s of swing) s.rotation.z = Math.sin(now * 1.6) * 0.12;
    k.envRot.value = now * 0.1;
    scene.environmentRotation.y = k.envRot.value;
    motes.material.uniforms.t.value = now;
    scene.updateMatrixWorld(true);
    st.gl.update(gems, camera, now);
    st.render();
  }
  const frame = (now) => {
    const dt = Math.min(0.05, now - (last || now)); last = now;
    if (!dragging) {
      idle += dt;
      vel += ((idle > 1.5 ? 0.005 : 0) - vel) * 0.04;
      rotY += vel;
      rotX += (0.12 - rotX) * 0.02;
    }
    draw(now);
  };
  new ResizeObserver(() => { const w = canvas.clientWidth, h = canvas.clientHeight; if (w && h) { st.size(w, h); draw(); } }).observe(canvas);
  loop(canvas, reduce ? () => {} : frame);
  rebuild();
  canvas.classList.add('on');
}

// cada parte isolada: um erro no hero não derruba o ateliê
for (const part of [hero, atelie]) {
  try { part(); } catch (e) { console.error(e); }
}
