// Herói 3D: campo de partículas em onda (a "amplitude" da marca). As ondas
// sobem com a energia do ponteiro, o mouse levanta o campo onde passa e cada
// toque solta uma onda em anel. Poeira luminosa sobe devagar por cima.
import * as THREE from 'three';

const MAX_RIPPLES = 4;

const fieldVert = /* glsl */`
  uniform float uTime, uEnergy, uMouseOn, uPixel;
  uniform vec3 uMouse;
  uniform vec4 uRipples[${MAX_RIPPLES}];
  attribute float aRand;
  varying float vH;
  varying float vA;
  void main() {
    vec3 p = position;
    float t = uTime;
    float h = sin(p.x * 0.34 + t * 0.9) * 0.55
            + sin(p.z * 0.58 - t * 1.15 + p.x * 0.16) * 0.38
            + sin((p.x + p.z) * 0.92 + t * 1.7) * 0.12;
    h *= 0.65 + uEnergy * 1.7;
    float d = distance(p.xz, uMouse.xz);
    h += uMouseOn * exp(-d * d * 0.32) * (1.0 + uEnergy * 1.2);
    for (int i = 0; i < ${MAX_RIPPLES}; i++) {
      vec4 r = uRipples[i];
      float age = t - r.z;
      if (age > 0.0 && age < 4.0) {
        float dist = distance(p.xz, r.xy);
        float front = age * 5.5;
        float w = exp(-pow(dist - front, 2.0) * 0.9) * (1.0 - age / 4.0) * r.w;
        h += sin((dist - front) * 2.6) * w * 1.3;
      }
    }
    p.y += h;
    vH = h;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    float depth = -mv.z;
    gl_PointSize = uPixel * (1.2 + aRand * 1.5 + max(h, 0.0) * 1.3) * (13.0 / depth);
    // some nas bordas e no fundo, para o campo não ter cantos duros
    float side = smoothstep(17.0, 9.0, abs(position.x));
    float back = smoothstep(-13.0, -5.0, position.z);
    float front = smoothstep(5.5, 2.5, position.z);
    vA = side * back * front * (0.55 + aRand * 0.45);
  }
`;
const fieldFrag = /* glsl */`
  uniform vec3 uLow, uMid, uHigh;
  varying float vH;
  varying float vA;
  void main() {
    float r = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.0, r);
    float k = clamp(vH * 0.5 + 0.5, 0.0, 1.0);
    vec3 col = mix(uLow, uMid, k);
    col = mix(col, uHigh, smoothstep(0.75, 1.5, vH));
    gl_FragColor = vec4(col, a * vA);
  }
`;
const dustVert = /* glsl */`
  uniform float uTime, uPixel, uEnergy;
  attribute float aRand;
  varying float vA;
  void main() {
    vec3 p = position;
    float speed = 0.25 + aRand * 0.5;
    p.y = mod(p.y + uTime * speed * (1.0 + uEnergy * 2.0) + 1.0, 8.0) - 1.0;
    p.x += sin(uTime * 0.4 + aRand * 30.0) * 0.4;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = uPixel * (1.0 + aRand * 2.2) * (10.0 / -mv.z);
    vA = smoothstep(-1.0, 1.0, p.y) * smoothstep(7.0, 4.0, p.y) * (0.25 + aRand * 0.5);
  }
`;
const dustFrag = /* glsl */`
  varying float vA;
  void main() {
    float r = length(gl_PointCoord - 0.5);
    gl_FragColor = vec4(0.75, 0.84, 1.0, smoothstep(0.5, 0.0, r) * vA);
  }
`;

export function mount(canvas, { reduced = false, mobile = false } = {}) {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: true, powerPreference: 'high-performance' });
  } catch (e) {
    return null;
  }
  const dpr = Math.min(window.devicePixelRatio || 1, mobile ? 1.5 : 2);
  renderer.setPixelRatio(dpr);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
  camera.position.set(0, 2.7, 9.5);
  camera.lookAt(0, -0.4, -2);

  // Campo: grade de pontos no plano XZ
  const NX = mobile ? 120 : 220, NZ = mobile ? 52 : 92;
  const W = 34, Z0 = -13, Z1 = 5.5;
  const pos = new Float32Array(NX * NZ * 3);
  const rnd = new Float32Array(NX * NZ);
  for (let iz = 0, k = 0; iz < NZ; iz++) {
    for (let ix = 0; ix < NX; ix++, k++) {
      const jitter = () => (Math.random() - 0.5) * 0.06;
      pos[k * 3] = (ix / (NX - 1) - 0.5) * W + jitter();
      pos[k * 3 + 1] = 0;
      pos[k * 3 + 2] = Z0 + (iz / (NZ - 1)) * (Z1 - Z0) + jitter();
      rnd[k] = Math.random();
    }
  }
  const fGeo = new THREE.BufferGeometry();
  fGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  fGeo.setAttribute('aRand', new THREE.BufferAttribute(rnd, 1));
  const ripples = Array.from({ length: MAX_RIPPLES }, () => new THREE.Vector4(0, 0, -99, 0));
  const uniforms = {
    uTime: { value: 0 }, uEnergy: { value: 0 }, uMouseOn: { value: 0 }, uPixel: { value: dpr },
    uMouse: { value: new THREE.Vector3(0, 0, -2) }, uRipples: { value: ripples },
    uLow: { value: new THREE.Color(0x17339a) }, uMid: { value: new THREE.Color(0x5b8cff) }, uHigh: { value: new THREE.Color(0xeaf0ff) },
  };
  const field = new THREE.Points(fGeo, new THREE.ShaderMaterial({
    uniforms, vertexShader: fieldVert, fragmentShader: fieldFrag,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  }));
  field.position.y = -1.6;
  scene.add(field);

  // Poeira
  const ND = mobile ? 260 : 600;
  const dPos = new Float32Array(ND * 3), dRnd = new Float32Array(ND);
  for (let i = 0; i < ND; i++) {
    dPos[i * 3] = (Math.random() - 0.5) * 30;
    dPos[i * 3 + 1] = Math.random() * 8 - 1;
    dPos[i * 3 + 2] = -12 + Math.random() * 15;
    dRnd[i] = Math.random();
  }
  const dGeo = new THREE.BufferGeometry();
  dGeo.setAttribute('position', new THREE.BufferAttribute(dPos, 3));
  dGeo.setAttribute('aRand', new THREE.BufferAttribute(dRnd, 1));
  const dust = new THREE.Points(dGeo, new THREE.ShaderMaterial({
    uniforms: { uTime: uniforms.uTime, uPixel: uniforms.uPixel, uEnergy: uniforms.uEnergy },
    vertexShader: dustVert, fragmentShader: dustFrag,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  }));
  dust.position.y = -1.6;
  scene.add(dust);

  // Ponteiro → ponto no plano do campo
  const ray = new THREE.Raycaster();
  const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 1.6);
  const ndc = new THREE.Vector2();
  const hit = new THREE.Vector3();
  function toField(clientX, clientY) {
    const r = canvas.getBoundingClientRect();
    if (!r.width || clientY < r.top || clientY > r.bottom) return null;
    ndc.set(((clientX - r.left) / r.width) * 2 - 1, -((clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    return ray.ray.intersectPlane(plane, hit) ? hit : null;
  }

  let energy = 0, mouseOn = 0, mouseTarget = 0, scroll = 0, nextRipple = 0;
  let time = 0, last = performance.now(), running = false, raf = 0;
  const camBase = camera.position.clone();
  const look = new THREE.Vector3(0, -0.4, -2);
  const parallax = { x: 0, y: 0 };

  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // no celular a câmera recua para o campo caber na largura
    camera.position.z = camBase.z = w < 700 ? 13 : 9.5;
    camera.updateProjectionMatrix();
  }

  function frame(now) {
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    if (!reduced) time += dt;
    uniforms.uTime.value = time;
    uniforms.uEnergy.value += (energy - uniforms.uEnergy.value) * Math.min(1, dt * 6);
    mouseOn += (mouseTarget - mouseOn) * Math.min(1, dt * 5);
    uniforms.uMouseOn.value = mouseOn;
    camera.position.x = camBase.x + parallax.x * 0.8;
    camera.position.y = camBase.y + parallax.y * 0.4 + scroll * 1.6;
    camera.lookAt(look.x, look.y - scroll * 1.2, look.z);
    field.rotation.y = reduced ? 0 : Math.sin(time * 0.08) * 0.05;
    renderer.render(scene, camera);
    if (running) raf = requestAnimationFrame(frame);
  }
  function start() { if (running) return; running = true; last = performance.now(); raf = requestAnimationFrame(frame); }
  function stop() { running = false; cancelAnimationFrame(raf); }

  const ro = new ResizeObserver(resize);
  ro.observe(canvas);
  resize();
  const io = new IntersectionObserver(([e]) => (e.isIntersecting && !reduced ? start() : stop()));
  io.observe(canvas);
  frame(performance.now());

  return {
    setPointer(clientX, clientY, nx, ny) {
      parallax.x = nx; parallax.y = -ny;
      const p = toField(clientX, clientY);
      if (p) { uniforms.uMouse.value.copy(p); mouseTarget = 1; } else mouseTarget = 0;
    },
    leave() { mouseTarget = 0; },
    ripple(clientX, clientY, strength = 1) {
      const p = toField(clientX, clientY);
      if (!p) return;
      ripples[nextRipple].set(p.x, p.z, time, strength);
      nextRipple = (nextRipple + 1) % MAX_RIPPLES;
      if (!running) frame(performance.now());
    },
    setEnergy(e) { energy = e; },
    setScroll(s) { scroll = s; },
    dispose() { stop(); ro.disconnect(); io.disconnect(); renderer.dispose(); },
  };
}
