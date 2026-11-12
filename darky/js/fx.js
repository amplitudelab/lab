/* Fundo vivo em WebGL, por cima da textura e do vídeo de cada universo.
   Um único shader com três climas que se misturam na passagem, mais a
   geometria tridimensional do Obskurial.
   Só é carregado em máquina que aguenta: no celular o cenário fica por conta
   da textura e do vídeo, que custam quase nada. */
import * as THREE from '../vendor/three.module.min.js';

const MODOS = ['darky', 'slowly', 'obskurial'];

const FRAG = /* glsl */`
precision mediump float;
uniform vec2 uRes; uniform float uT; uniform vec2 uM; uniform vec3 uW; // pesos: darky, slowly, obskurial
varying vec2 vUv;

float hash(vec2 p){ p = fract(p*vec2(123.34, 456.21)); p += dot(p, p+45.32); return fract(p.x*p.y); }
float noise(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
  return mix(mix(hash(i),hash(i+vec2(1,0)),f.x), mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x), f.y); }
float fbm(vec2 p){ float a=.5, s=0.; for(int i=0;i<OITAVAS;i++){ s+=a*noise(p); p=p*2.03+vec2(1.7,9.2); a*=.5; } return s; }

vec3 darky(vec2 uv, vec2 p){
  vec2 q = p*1.6; q.y -= uT*.06;
  float w = fbm(q + fbm(q*1.7 + uT*.05)*1.4);
  float veio = pow(smoothstep(.42,.9,w), 2.5);
  float m = smoothstep(.9, 0., length(p - (uM-.5)*vec2(uRes.x/uRes.y,1.)*1.2));
  vec3 c = vec3(.02,.012,.04);
  c += vec3(.3,.1,.66)*veio*.7;
  c += vec3(.72,.52,1.)*pow(veio,4.)*.45;
  c += vec3(.2,.07,.46)*m*.2*w;
  vec2 g = uv*vec2(uRes.x/uRes.y,1.)*24.; g.y -= uT*.9;
  vec2 id = floor(g); float h = hash(id);
  float s = step(.978,h)*smoothstep(.12,.0,length(fract(g)-.5-.3*vec2(sin(uT+h*40.),0.)));
  c += vec3(1.,.55,.95)*s*(.5+.5*sin(uT*3.+h*60.));
  return c*smoothstep(1.5,.2,length(p));
}
vec3 slowly(vec2 uv, vec2 p){
  float t = uT*.045;
  vec2 q = p*.75 + (uM-.5)*.18;
  float a = fbm(q + vec2(t, -t*.6));
  float b = fbm(q*1.3 - vec2(t*.7, t) + 4.);
  float d = fbm(q*.9 + vec2(-t*.4, t*.8) + 9.);
  vec3 c = vec3(.95,.92,.88);
  c = mix(c, vec3(1.,.74,.58), smoothstep(.38,.8,a)*.8);
  c = mix(c, vec3(.8,.72,1.), smoothstep(.45,.85,b)*.7);
  c = mix(c, vec3(.66,.94,.85), smoothstep(.5,.9,d)*.5);
  return c;
}
vec3 obsk(vec2 uv, vec2 p){
  float tt = floor(uT*9.)/9.;
  float faixa = floor(uv.y*26.);
  float trava = step(.93, hash(vec2(faixa, floor(uT*3.))));
  p.x += trava*(hash(vec2(faixa,tt))-.5)*.25;
  float r = length(p), a = atan(p.y,p.x);
  float n = fbm(vec2(a*2.2, r*3.-uT*.08));
  float linhas = abs(sin((r*44. + n*9.) - uT*.5));
  linhas = smoothstep(.985,1.,linhas);
  float crista = 1.-abs(fbm(p*5.+uT*.04)*2.-1.); crista = pow(crista,9.);
  vec3 c = vec3(.02,.006,.01);
  c += vec3(.72,.05,.09)*linhas*.5*smoothstep(1.3,.2,r);
  c += vec3(.52,.03,.06)*crista*.55;
  c += vec3(.9,.9,.95)*pow(crista,3.)*.1;
  c += (hash(uv*uRes + tt)-.5)*.03;
  return c;
}
void main(){
  vec2 p = (vUv-.5)*vec2(uRes.x/uRes.y, 1.)*2.;
  vec3 c = vec3(0.);
  if(uW.x>.001) c += uW.x*darky(vUv,p);
  if(uW.y>.001) c += uW.y*slowly(vUv,p);
  if(uW.z>.001) c += uW.z*obsk(vUv,p);
  gl_FragColor = vec4(c,1.);
}`;

const VERT_GEO = /* glsl */`
uniform float uT; uniform float uAmp;
varying float vD;
vec3 mod289(vec3 x){return x-floor(x*(1./289.))*289.;} vec4 mod289(vec4 x){return x-floor(x*(1./289.))*289.;}
vec4 permute(vec4 x){return mod289(((x*34.)+1.)*x);} vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-.85373472095314*r;}
float snoise(vec3 v){ const vec2 C=vec2(1./6.,1./3.); const vec4 D=vec4(0.,.5,1.,2.);
  vec3 i=floor(v+dot(v,C.yyy)); vec3 x0=v-i+dot(i,C.xxx); vec3 g=step(x0.yzx,x0.xyz); vec3 l=1.-g;
  vec3 i1=min(g.xyz,l.zxy); vec3 i2=max(g.xyz,l.zxy); vec3 x1=x0-i1+C.xxx; vec3 x2=x0-i2+C.yyy; vec3 x3=x0-D.yyy;
  i=mod289(i); vec4 p=permute(permute(permute(i.z+vec4(0.,i1.z,i2.z,1.))+i.y+vec4(0.,i1.y,i2.y,1.))+i.x+vec4(0.,i1.x,i2.x,1.));
  float n_=.142857142857; vec3 ns=n_*D.wyz-D.xzx; vec4 j=p-49.*floor(p*ns.z*ns.z);
  vec4 x_=floor(j*ns.z); vec4 y_=floor(j-7.*x_); vec4 x=x_*ns.x+ns.yyyy; vec4 y=y_*ns.x+ns.yyyy; vec4 h=1.-abs(x)-abs(y);
  vec4 b0=vec4(x.xy,y.xy); vec4 b1=vec4(x.zw,y.zw); vec4 s0=floor(b0)*2.+1.; vec4 s1=floor(b1)*2.+1.; vec4 sh=-step(h,vec4(0.));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy; vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x); vec3 p1=vec3(a0.zw,h.y); vec3 p2=vec3(a1.xy,h.z); vec3 p3=vec3(a1.zw,h.w);
  vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3))); p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
  vec4 m=max(.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.); m=m*m;
  return 42.*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3))); }
void main(){
  float d = snoise(normal*1.6 + uT*.18) * .34 + snoise(normal*5. - uT*.3)*.07;
  d = floor(d*9.)/9.;                         // degraus: facetas em vez de onda lisa
  vD = d;
  gl_Position = projectionMatrix*modelViewMatrix*vec4(position + normal*d*uAmp,1.);
  gl_PointSize = 2.2;
}`;
const FRAG_GEO = /* glsl */`
precision mediump float; uniform float uO; uniform vec3 uCor; varying float vD;
void main(){ vec3 c = mix(uCor*.55, vec3(1.,.86,.86), smoothstep(.12,.38,vD)); gl_FragColor = vec4(c, uO*(.35+.65*smoothstep(-.3,.35,vD))); }`;

export function criarFx(canvas, { calmo = false, leve = false } = {}) {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false, powerPreference: 'low-power', failIfMajorPerformanceCaveat: true });
  } catch { return null; }
  const DPR = Math.min(devicePixelRatio || 1, leve ? 1 : 1.5) * (leve ? 0.6 : 0.85);
  renderer.setPixelRatio(DPR);
  renderer.autoClear = false;

  const cenaF = new THREE.Scene(), camF = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const uni = { uRes: { value: new THREE.Vector2(1, 1) }, uT: { value: 0 }, uM: { value: new THREE.Vector2(.5, .5) }, uW: { value: new THREE.Vector3(1, 0, 0) } };
  cenaF.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({
    uniforms: uni,
    fragmentShader: `#define OITAVAS ${leve ? 3 : 5}\n` + FRAG,
    depthTest: false, depthWrite: false,
    vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.,1.); }',
  })));

  // geometria do Obskurial: icosaedro facetado, em arame e pontos
  const cena = new THREE.Scene(), cam = new THREE.PerspectiveCamera(38, 1, .1, 50);
  cam.position.z = 6;
  const grupo = new THREE.Group(); cena.add(grupo);
  const ug = { uT: uni.uT, uAmp: { value: 1 }, uO: { value: 0 }, uCor: { value: new THREE.Color('#d1121f') } };
  const mk = () => new THREE.ShaderMaterial({ uniforms: ug, vertexShader: VERT_GEO, fragmentShader: FRAG_GEO, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
  grupo.add(new THREE.LineSegments(new THREE.WireframeGeometry(new THREE.IcosahedronGeometry(1.7, 3)), mk()));
  grupo.add(new THREE.Points(new THREE.IcosahedronGeometry(1.7, leve ? 5 : 8), mk()));
  const anel = new THREE.LineLoop(
    new THREE.BufferGeometry().setFromPoints(Array.from({ length: 6 }, (_, i) => new THREE.Vector3(Math.cos(i * Math.PI / 3) * 2.6, Math.sin(i * Math.PI / 3) * 2.6, 0))),
    new THREE.LineBasicMaterial({ color: '#7a0d14', transparent: true, opacity: 0 }));
  grupo.add(anel);

  const pesos = { darky: 1, slowly: 0, obskurial: 0 };
  const alvoM = new THREE.Vector2(.5, .5);
  let rodando = false, t0 = performance.now(), visivel = true, ultimo = 0;
  const INTERVALO = leve ? 1000 / 30 : 0;                // em máquina fraca, 30 quadros bastam

  function tam() {
    const w = innerWidth, h = innerHeight;
    renderer.setSize(w, h, false);
    uni.uRes.value.set(w * DPR, h * DPR);
    cam.aspect = w / h; cam.updateProjectionMatrix();
    grupo.position.x = w > 900 ? -1.1 : 0;
    grupo.scale.setScalar(w > 900 ? 1 : .72);
  }
  function quadro() {
    const t = (performance.now() - t0) / 1000;
    uni.uT.value = t;
    uni.uM.value.lerp(alvoM, .04);
    uni.uW.value.set(pesos.darky, pesos.slowly, pesos.obskurial);
    renderer.clear();
    renderer.render(cenaF, camF);
    if (pesos.obskurial > .01) {
      ug.uO.value = pesos.obskurial * .9;
      anel.material.opacity = pesos.obskurial * .7;
      grupo.rotation.y = t * .12 + (uni.uM.value.x - .5) * .9;
      grupo.rotation.x = Math.sin(t * .2) * .25 + (uni.uM.value.y - .5) * -.6;
      anel.rotation.z = -t * .2;
      renderer.render(cena, cam);
    }
  }
  function laco(ts) {
    if (!rodando) return;
    if (!INTERVALO || ts - ultimo >= INTERVALO) { ultimo = ts; quadro(); }
    requestAnimationFrame(laco);
  }
  function ligar(sim) {
    const deve = sim && visivel && !calmo;
    if (deve && !rodando) { rodando = true; requestAnimationFrame(laco); }
    if (!deve) rodando = false;
  }
  addEventListener('resize', () => { tam(); if (!rodando) quadro(); });
  document.addEventListener('visibilitychange', () => { visivel = !document.hidden; ligar(true); });
  canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); rodando = false; document.documentElement.classList.remove('tem-fx'); });

  tam();
  ligar(true);
  if (calmo) quadro();

  return {
    modo(nome, direto = false) {
      if (!MODOS.includes(nome)) nome = 'darky';
      const alvo = Object.fromEntries(MODOS.map((m) => [m, m === nome ? 1 : 0]));
      if (direto || calmo) { Object.assign(pesos, alvo); quadro(); return; }
      window.gsap.to(pesos, {
        ...alvo,
        duration: nome === 'slowly' ? 1.4 : nome === 'obskurial' ? .35 : .7,
        ease: nome === 'obskurial' ? 'steps(4)' : 'power2.inOut', overwrite: true,
      });
    },
    ponteiro(x, y) { alvoM.set(x, y); },
  };
}
