/* Fundo vivo em WebGL puro (sem biblioteca): fitas de som que ondulam sobre uma
   pista em perspectiva. A batida (estado.k) acende a grade e estica as ondas; a
   rolagem (estado.rolagem) leva a cor do rosa para a brasa e depois para o azul.
   Só roda em máquina que aguenta; no celular fica o fundo em CSS. */

const VERT = `attribute vec2 p; void main(){ gl_Position = vec4(p,0.,1.); }`;

const FRAG = `
precision mediump float;
uniform vec2 uRes; uniform float uT; uniform float uK; uniform float uL; uniform float uS; uniform vec2 uM;

float hash(vec2 p){ p=fract(p*vec2(123.34,456.21)); p+=dot(p,p+45.32); return fract(p.x*p.y); }
float noise(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
  return mix(mix(hash(i),hash(i+vec2(1,0)),f.x), mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x), f.y); }

vec3 paleta(float s){
  vec3 rosa=vec3(1.,.25,.69), brasa=vec3(1.,.48,.18), azul=vec3(.18,.42,1.);
  vec3 a = mix(rosa, brasa, smoothstep(.15,.5,s));
  return mix(a, azul, smoothstep(.5,.85,s));
}

void main(){
  vec2 uv = gl_FragCoord.xy/uRes;
  vec2 p = (gl_FragCoord.xy - .5*uRes)/uRes.y;
  p += (uM-.5)*vec2(.06,.04);
  float t = uT;
  vec3 cor = paleta(uS);
  vec3 cor2 = paleta(fract(uS+.45));

  // céu
  vec3 c = mix(vec3(.027,.012,.043), vec3(.07,.02,.09), smoothstep(-.4,.6,p.y));

  // horizonte e pista em perspectiva
  float hz = -.12;
  if(p.y < hz){
    float d = hz - p.y;
    float z = .35/d;
    vec2 g = vec2(p.x*z, z + t*(1.2 + uK*1.5));
    vec2 f = abs(fract(g*vec2(1.,.6))-.5);
    float linha = smoothstep(.04*z,.0,min(f.x,f.y*1.4)*1.);
    float fade = smoothstep(0.,.5,d)*smoothstep(9.,1.2,z);
    c += mix(cor2,cor,.5)*linha*fade*(.35+uK*.9);
  }
  // brilho do horizonte
  c += cor*.55*exp(-abs(p.y-hz)*14.)*(.6+uK*.8);

  // fitas de som
  for(int i=0;i<6;i++){
    float fi=float(i);
    float amp = .05 + .03*fi + uK*.06 + uL*.12;
    float fase = t*(.35+fi*.07) + fi*1.7;
    float y = .1 + fi*.055
      + sin(p.x*(2.2+fi*.6) + fase)*amp
      + (noise(vec2(p.x*1.5+fi*3., t*.25))-.5)*.18;
    float w = .0025 + .002*fi*.3;
    float dd = abs(p.y - y);
    float l = w/(dd+.002);
    vec3 ci = mix(cor, cor2, fi/5.);
    c += ci*l*.07*(.7+uK*.6);
  }

  // estrelas
  vec2 sg = uv*vec2(uRes.x/uRes.y,1.)*40.;
  vec2 id = floor(sg); float h = hash(id);
  float st = step(.985,h)*smoothstep(.08,.0,length(fract(sg)-.5));
  c += vec3(1.,.85,.95)*st*(.4+.6*sin(t*2.+h*50.))*step(hz,p.y);

  // vinheta e grão
  c *= smoothstep(1.35,.3,length(p*vec2(.8,1.)));
  c += (hash(gl_FragCoord.xy+fract(t))-.5)*.035;
  gl_FragColor = vec4(c,1.);
}`;

export function criarFx(canvas, estado, { leve = false } = {}) {
  const gl = canvas.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'default', failIfMajorPerformanceCaveat: true });
  if (!gl) return null;
  // GPU por software (SwiftShader, llvmpipe) não aguenta o shader em tela cheia
  const info = gl.getExtension('WEBGL_debug_renderer_info');
  const placa = info ? String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL)) : '';
  if (/swiftshader|llvmpipe|software|basic render/i.test(placa)) return null;
  const sh = (tipo, src) => { const s = gl.createShader(tipo); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { console.warn(gl.getShaderInfoLog(s)); return null; } return s; };
  const vs = sh(gl.VERTEX_SHADER, VERT), fs = sh(gl.FRAGMENT_SHADER, FRAG);
  if (!vs || !fs) return null;
  const prog = gl.createProgram(); gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null;
  gl.useProgram(prog);
  const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const u = Object.fromEntries(['uRes', 'uT', 'uK', 'uL', 'uS', 'uM'].map((n) => [n, gl.getUniformLocation(prog, n)]));

  // resolução baixa de propósito: o fundo é difuso, e o canvas é esticado pelo CSS
  const MAX_PX = leve ? 250e3 : 520e3;
  function tam() {
    const k = Math.min(1, Math.sqrt(MAX_PX / (innerWidth * innerHeight)));
    canvas.width = Math.round(innerWidth * k); canvas.height = Math.round(innerHeight * k);
    gl.viewport(0, 0, canvas.width, canvas.height);
  }
  tam(); addEventListener('resize', tam);

  const t0 = performance.now();
  const m = { x: .5, y: .5 };

  // teste de custo: desenha alguns quadros esperando a GPU terminar. Se a placa não
  // dá conta com folga, nem liga (fica o fundo em CSS) em vez de travar a página.
  const desenhar = (tt) => {
    gl.uniform2f(u.uRes, canvas.width, canvas.height); gl.uniform1f(u.uT, tt);
    gl.uniform1f(u.uK, .5); gl.uniform1f(u.uL, .1); gl.uniform1f(u.uS, 0); gl.uniform2f(u.uM, .5, .5);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };
  desenhar(0); gl.finish();                       // aquecimento (compilação preguiçosa)
  const ini = performance.now();
  for (let i = 1; i <= 3; i++) desenhar(i);
  gl.finish();
  const custo = (performance.now() - ini) / 3;
  if (custo > 8) { console.info('linnx: fundo WebGL desligado, GPU lenta (' + custo.toFixed(1) + ' ms/quadro)'); gl.getExtension('WEBGL_lose_context')?.loseContext(); return null; }
  let perdeu = false;
  // guarda: se a página ficar lenta depois (outra aba pesada, economia de bateria), desliga
  let lentos = 0, antes = 0;
  document.addEventListener('visibilitychange', () => { antes = 0; });
  canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); perdeu = true; document.documentElement.classList.remove('tem-fx'); });

  return {
    quadro() {
      if (perdeu) return;
      const agora = performance.now();
      if (antes) {
        const dt = agora - antes;
        lentos = dt > 50 ? lentos + 1 : Math.max(0, lentos - .25);
        if (lentos > 20) { perdeu = true; document.documentElement.classList.remove('tem-fx'); canvas.remove(); return; }
      }
      antes = agora;
      m.x += (estado.mx - m.x) * .05; m.y += (estado.my - m.y) * .05;
      gl.uniform2f(u.uRes, canvas.width, canvas.height);
      gl.uniform1f(u.uT, (performance.now() - t0) / 1000);
      gl.uniform1f(u.uK, estado.k);
      gl.uniform1f(u.uL, estado.nivel);
      gl.uniform1f(u.uS, estado.rolagem);
      gl.uniform2f(u.uM, m.x, 1 - m.y);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    },
  };
}
