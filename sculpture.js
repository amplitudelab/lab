// Escultura 3D do manifesto: o frasco do logo em vidro iridescente com brilho
// de borda, líquido azul em onda, anéis de amplitude, um halo de partículas
// girando em volta e bolhas subindo.
import * as THREE from 'three';
import { RoomEnvironment } from './vendor/RoomEnvironment.js';

// Perfil do frasco (raio, altura), girado em torno do eixo Y
const FLASK = [
  [0, -11], [6.8, -11], [8.6, -10.4], [9.5, -9.2], [9.6, -8.4],
  [2.5, 5.8], [2.4, 11.2], [3.3, 11.6], [3.4, 12.4], [2.6, 12.6],
];
const LIQUID_TOP = -2.2;
// Raio interno do cone na altura y (entre a base larga e o gargalo)
const coneR = (y) => 9.6 - ((y + 8.4) / 14.2) * 7.1;

export function mount(canvas, { reduced = false, mobile = false } = {}) {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: !mobile, alpha: true, powerPreference: 'high-performance' });
  } catch (e) {
    return null;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mobile ? 1.5 : 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.3;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 400);
  camera.position.set(0, 0, 92);

  const root = new THREE.Group();
  const pulse = new THREE.Group();
  root.add(pulse);
  scene.add(root);

  // Vidro: transparência com reflexo do ambiente (previsível em qualquer GPU)
  const glass = new THREE.MeshPhysicalMaterial({
    color: 0xcfdcff, metalness: 0, roughness: 0.04, transparent: true, opacity: 0.2,
    clearcoat: 1, clearcoatRoughness: 0.04, envMapIntensity: 2.2, side: THREE.DoubleSide, depthWrite: false,
    iridescence: 0.7, iridescenceIOR: 1.35, iridescenceThicknessRange: [180, 520],
  });
  const chrome = new THREE.MeshPhysicalMaterial({ color: 0xf2f4fa, metalness: 1, roughness: 0.1, clearcoat: 1, clearcoatRoughness: 0.05, envMapIntensity: 1.6 });
  const liquidMat = new THREE.MeshPhysicalMaterial({
    color: 0x3d6cf5, metalness: 0.1, roughness: 0.18, clearcoat: 1, clearcoatRoughness: 0.1,
    emissive: 0x1a3fd0, emissiveIntensity: 0.55, envMapIntensity: 1.2,
  });

  // Frasco
  const flaskGeo = new THREE.LatheGeometry(FLASK.map(([r, y]) => new THREE.Vector2(r, y)), 96);
  const flask = new THREE.Mesh(flaskGeo, glass);
  flask.renderOrder = 2;
  pulse.add(flask);
  // Brilho de borda (fresnel) por fora do vidro
  const rimMat = new THREE.ShaderMaterial({
    uniforms: { uColor: { value: new THREE.Color(0x8fb0ff) }, uStrength: { value: 0.9 } },
    vertexShader: `varying vec3 vN; varying vec3 vV;
      void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.0); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `uniform vec3 uColor; uniform float uStrength; varying vec3 vN; varying vec3 vV;
      void main(){ float f = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), 2.6); gl_FragColor = vec4(uColor, f * uStrength); }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  });
  const rimShell = new THREE.Mesh(flaskGeo, rimMat);
  rimShell.scale.setScalar(1.025);
  rimShell.renderOrder = 3;
  pulse.add(rimShell);
  // Aro cromado na boca do frasco
  const lip = new THREE.Mesh(new THREE.TorusGeometry(3.15, 0.42, 20, 64), chrome);
  lip.rotation.x = Math.PI / 2;
  lip.position.y = 12.3;
  pulse.add(lip);

  // Líquido: corpo girado + superfície em onda
  const lPts = [[0, -10.5], [6.4, -10.5], [8.2, -9.9], [9.0, -8.6]];
  for (let y = -8.2; y <= LIQUID_TOP + 0.001; y += 1.2) lPts.push([coneR(y) - 0.5, y]);
  lPts.push([coneR(LIQUID_TOP) - 0.5, LIQUID_TOP], [0, LIQUID_TOP]);
  const liquid = new THREE.Mesh(new THREE.LatheGeometry(lPts.map(([r, y]) => new THREE.Vector2(r, y)), 96), liquidMat);
  pulse.add(liquid);
  const surfR = coneR(LIQUID_TOP) - 0.5;
  // Disco com vários anéis de vértices para a onda ficar suave
  const surfDense = new THREE.RingGeometry(0.001, surfR, 72, 10);
  surfDense.rotateX(-Math.PI / 2);
  const surface = new THREE.Mesh(surfDense, liquidMat);
  surface.position.y = LIQUID_TOP;
  pulse.add(surface);
  const sPos = surfDense.attributes.position;
  const sBase = Float32Array.from(sPos.array);

  // Anéis de amplitude: linhas em volta do frasco que ondulam
  const rings = [];
  const ringDefs = [
    { r: 15, k: 6, amp: 1.4, col: 0x5b8cff, tilt: 0.42, sp: 0.5 },
    { r: 18.5, k: 4, amp: 1.8, col: 0xc5cbd9, tilt: -0.28, sp: -0.35 },
    { r: 22, k: 9, amp: 1.0, col: 0xa9c4ff, tilt: 0.12, sp: 0.25 },
  ];
  const SEG = 256;
  for (const d of ringDefs) {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(SEG * 3), 3));
    const line = new THREE.LineLoop(g, new THREE.LineBasicMaterial({ color: d.col, transparent: true, opacity: 0.85 }));
    const holder = new THREE.Group();
    holder.rotation.x = d.tilt;
    holder.add(line);
    pulse.add(holder);
    // Pontos brilhantes nos anéis
    const dots = new THREE.Points(g, new THREE.PointsMaterial({ color: d.col, size: 0.45, transparent: true, opacity: 0.9 }));
    holder.add(dots);
    rings.push({ d, g, holder });
  }

  // Bolhas subindo dentro e em volta do frasco
  const N = mobile ? 170 : 380;
  const pos = new Float32Array(N * 3);
  const speed = new Float32Array(N);
  const inside = new Uint8Array(N);
  function seed(i, fresh) {
    inside[i] = i % 3 === 0 ? 1 : 0;
    if (inside[i]) {
      const y = fresh ? -10 + Math.random() * (LIQUID_TOP + 10) : -10;
      const r = Math.random() * (coneR(y) - 1.2);
      const a = Math.random() * Math.PI * 2;
      pos[i * 3] = Math.cos(a) * r; pos[i * 3 + 1] = y; pos[i * 3 + 2] = Math.sin(a) * r;
      speed[i] = 1.5 + Math.random() * 3;
    } else {
      pos[i * 3] = (Math.random() - 0.5) * 80;
      pos[i * 3 + 1] = fresh ? (Math.random() - 0.5) * 70 : -36;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 40 - 6;
      speed[i] = 1.5 + Math.random() * 4;
    }
  }
  for (let i = 0; i < N; i++) seed(i, true);
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const sprite = (() => {
    const c = document.createElement('canvas');
    c.width = c.height = 64;
    const x = c.getContext('2d');
    const gr = x.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, 'rgba(235,242,255,1)');
    gr.addColorStop(0.3, 'rgba(140,175,255,.6)');
    gr.addColorStop(1, 'rgba(60,100,240,0)');
    x.fillStyle = gr;
    x.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(c);
  })();
  const bubbles = new THREE.Points(pGeo, new THREE.PointsMaterial({
    size: 0.9, map: sprite, transparent: true, opacity: 0.8, depthWrite: false, blending: THREE.AdditiveBlending,
  }));
  root.add(bubbles);

  // Halo: partículas em espiral girando em volta do frasco
  const NH = mobile ? 700 : 1600;
  const hPos = new Float32Array(NH * 3), hCol = new Float32Array(NH * 3);
  const hBase = new Float32Array(NH * 3); // raio, ângulo, altura
  const cA = new THREE.Color(0x5b8cff), cB = new THREE.Color(0xeaf0ff), tmp = new THREE.Color();
  for (let i = 0; i < NH; i++) {
    const band = Math.random();
    const r = 13 + Math.pow(band, 0.6) * 20;
    hBase[i * 3] = r;
    hBase[i * 3 + 1] = Math.random() * Math.PI * 2;
    hBase[i * 3 + 2] = (Math.random() - 0.5) * (4 + band * 10);
    tmp.copy(cA).lerp(cB, Math.random() * 0.7);
    hCol[i * 3] = tmp.r; hCol[i * 3 + 1] = tmp.g; hCol[i * 3 + 2] = tmp.b;
  }
  const hGeo = new THREE.BufferGeometry();
  hGeo.setAttribute('position', new THREE.BufferAttribute(hPos, 3));
  hGeo.setAttribute('color', new THREE.BufferAttribute(hCol, 3));
  const halo = new THREE.Points(hGeo, new THREE.PointsMaterial({
    size: 0.55, map: sprite, vertexColors: true, transparent: true, opacity: 0.85, depthWrite: false, blending: THREE.AdditiveBlending,
  }));
  halo.rotation.x = 0.32;
  root.add(halo);
  function updateHalo() {
    const a = hPos;
    const spread = 1 + levelS * 0.35;
    for (let i = 0; i < NH; i++) {
      const r = hBase[i * 3] * spread;
      // as partículas de dentro giram mais rápido, como um redemoinho
      const th = hBase[i * 3 + 1] + time * (0.9 - r / 60);
      a[i * 3] = Math.cos(th) * r;
      a[i * 3 + 1] = hBase[i * 3 + 2] + Math.sin(th * 3 + time) * 0.6 * (1 + levelS * 3);
      a[i * 3 + 2] = Math.sin(th) * r;
    }
    hGeo.attributes.position.needsUpdate = true;
  }

  // Luzes de recorte azul e branca por cima do ambiente
  const blue = new THREE.PointLight(0x5b8cff, 2600, 0, 2);
  blue.position.set(-34, 18, 30);
  scene.add(blue);
  const rim = new THREE.DirectionalLight(0xffffff, 2.2);
  rim.position.set(20, 30, -20);
  scene.add(rim);
  const under = new THREE.PointLight(0x2450d6, 1800, 0, 2);
  under.position.set(10, -30, 20);
  scene.add(under);
  const key = new THREE.DirectionalLight(0xffffff, 1.2);
  key.position.set(0, 10, 60);
  scene.add(key);

  // Estado
  let progress = 0, level = 0, levelS = 0;
  const pointer = { x: 0, y: 0 }, pointerS = { x: 0, y: 0 };
  let rotY = 0;
  let running = false, raf = 0, last = performance.now(), time = 0;

  function resize() {
    const w = canvas.clientWidth || canvas.parentElement.clientWidth;
    const h = canvas.clientHeight || canvas.parentElement.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // Recua a câmera até caber ~50 unidades de largura e ~60 de altura
    const k = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    camera.position.z = Math.max(60 / k, 50 / (camera.aspect * k));
    camera.updateProjectionMatrix();
  }
  const baseY = () => (canvas.clientWidth < 760 ? 4 : 2);
  root.position.y = baseY();

  function updateRings() {
    const boost = 1 + levelS * 2.6;
    for (const { d, g } of rings) {
      const a = g.attributes.position.array;
      for (let i = 0; i < SEG; i++) {
        const th = (i / SEG) * Math.PI * 2;
        const wob = Math.sin(th * d.k + time * 2.2 * (d.sp > 0 ? 1 : -1)) * d.amp * boost;
        const rr = d.r + Math.sin(th * 3 - time) * 0.3;
        a[i * 3] = Math.cos(th) * rr;
        a[i * 3 + 1] = wob;
        a[i * 3 + 2] = Math.sin(th) * rr;
      }
      g.attributes.position.needsUpdate = true;
    }
  }

  function updateSurface() {
    const a = sPos.array;
    const amp = 0.25 + levelS * 1.2;
    for (let i = 0; i < a.length; i += 3) {
      const x = sBase[i], z = sBase[i + 2];
      a[i + 1] = Math.sin(x * 0.9 + time * 2.4) * amp * 0.6 + Math.cos(z * 0.8 - time * 1.9) * amp * 0.5;
    }
    sPos.needsUpdate = true;
    surfDense.computeVertexNormals();
  }

  function frame(now) {
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    if (!reduced) time += dt;
    levelS += (level - levelS) * Math.min(1, dt * 8);
    pointerS.x += (pointer.x - pointerS.x) * Math.min(1, dt * 4);
    pointerS.y += (pointer.y - pointerS.y) * Math.min(1, dt * 4);

    const idle = reduced ? 0 : Math.sin(time * 0.5) * 0.18;
    const target = -0.3 + progress * Math.PI * 1.6 + idle + pointerS.x * 0.35;
    rotY += (target - rotY) * Math.min(1, dt * 5);
    root.rotation.y = rotY;
    root.rotation.x = 0.12 + pointerS.y * 0.16 + (reduced ? 0 : Math.sin(time * 0.7) * 0.04);
    root.rotation.z = reduced ? 0 : Math.sin(time * 1.3) * 0.03 * (1 + levelS * 3);
    root.position.y += (baseY() + (reduced ? 0 : Math.sin(time * 0.9) * 0.8) - root.position.y) * 0.08;

    pulse.scale.setScalar(1 + levelS * 0.05);
    liquidMat.emissiveIntensity = 0.55 + levelS * 1.6;
    rings.forEach(({ d, holder }) => { holder.rotation.y += dt * d.sp * (1 + levelS * 2); });
    updateRings();
    updateSurface();
    updateHalo();
    rimMat.uniforms.uStrength.value = 0.8 + levelS * 1.4;

    if (!reduced) {
      const a = pGeo.attributes.position.array;
      for (let i = 0; i < N; i++) {
        a[i * 3 + 1] += speed[i] * dt * (1 + levelS * 2);
        if (inside[i]) {
          if (a[i * 3 + 1] > LIQUID_TOP - 0.3) seed(i, false);
        } else {
          a[i * 3] += Math.sin(time + i) * dt * 0.6;
          if (a[i * 3 + 1] > 38) a[i * 3 + 1] = -36;
        }
      }
      pGeo.attributes.position.needsUpdate = true;
    }

    renderer.render(scene, camera);
    if (running) raf = requestAnimationFrame(frame);
  }

  function start() {
    if (running) return;
    running = true;
    last = performance.now();
    raf = requestAnimationFrame(frame);
  }
  function stop() {
    running = false;
    cancelAnimationFrame(raf);
  }

  const ro = new ResizeObserver(resize);
  ro.observe(canvas);
  resize();
  updateRings();
  updateSurface();
  updateHalo();
  const io = new IntersectionObserver(([e]) => (e.isIntersecting ? start() : stop()), { rootMargin: '100px' });
  io.observe(canvas);
  renderer.render(scene, camera);

  return {
    setProgress(p) { progress = p; if (!running) frame(performance.now()); },
    setPointer(x, y) { pointer.x = x; pointer.y = y; },
    setLevel(l) { level = l; },
    dispose() {
      stop(); ro.disconnect(); io.disconnect();
      renderer.dispose();
    },
  };
}
