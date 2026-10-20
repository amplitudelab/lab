'use strict';
/* =============================================================================
   VOXEL REALMS · paralaxe por bioma
   duas camadas de cenário em anel (longe e perto) que acompanham a câmera em
   velocidades diferentes. Cada região tem seu próprio horizonte, trocado com
   transição suave quando o jogador muda de região.
   ============================================================================= */
function plxMat(haze){return new THREE.ShaderMaterial({uniforms:{uHor:MTU.uHor,uTint:MTU.uTint,uOp:{value:0},uHz:{value:Math.min(.85,haze+.25)}},fog:false,vertexColors:true,transparent:true,depthWrite:false,
  vertexShader:'varying vec3 vC;varying float vH;void main(){vC=color;vH=position.y;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
  fragmentShader:'uniform vec3 uHor,uTint;uniform float uOp,uHz;varying vec3 vC;varying float vH;void main(){float g=max(vC.r,max(vC.g,vC.b))>1.?1.:0.;vec3 c=mix(vC*uTint,uHor,uHz-clamp(vH/90.,0.,1.)*.22);gl_FragColor=vec4(mix(c,vC*.6,g),uOp);}'})}
// formas de silhueta (todas montadas a partir de caixas)
const PX={
  mount(k,a,r,H,c1,c2,snow){const bw=H*(.9+R()*.6),x=S(a)*r,z=C(a)*r;for(let s=0;s<5;s++){const w=bw*(1-s/5*.82),hh=H/5;k.box(w,hh+.5,w*(.8+R()*.3),x+(R()-.5)*bw*.08,-6+hh*s+hh/2,z,s==4&&snow?snow:s%2?c2:c1,{ry:a})}},
  hill(k,a,r,H,c1,c2){const w=H*3+R()*20,x=S(a)*r,z=C(a)*r;k.box(w,H,w*.6,x,-4+H/2,z,c1,{ry:a});k.box(w*.6,H*.5,w*.4,x,-4+H*1.2,z,c2,{ry:a})},
  pine(k,a,r,H,c){const x=S(a)*r,z=C(a)*r;k.box(H*.06,H*.3,H*.06,x,-4+H*.15,z,0x2a1e14);for(let i=0;i<4;i++){const w=H*(.42-i*.09);k.box(w,H*.2,w,x,-4+H*(.3+i*.17),z,c,{ry:a+i})}},
  blossom(k,a,r,H,c,c2){const x=S(a)*r,z=C(a)*r;k.box(H*.08,H*.5,H*.08,x,-4+H*.25,z,0x5a3a2a);for(let i=0;i<5;i++)k.box(H*.4,H*.25,H*.4,x+C(i*1.3)*H*.2,-4+H*(.55+(i%2)*.12),z+S(i*1.3)*H*.2,i%2?c:(c2||0xffd0e4),{ry:a})},
  mangrove(k,a,r,H,c){const x=S(a)*r,z=C(a)*r;for(let i=0;i<4;i++)k.box(H*.04,H*.35,H*.04,x+C(i*1.6)*H*.12,-4+H*.15,z+S(i*1.6)*H*.12,0x2a2a1e,{rz:C(i*1.6)*.4,rx:S(i*1.6)*.4});k.box(H*.07,H*.4,H*.07,x,-4+H*.45,z,0x2a2a1e);k.box(H*.7,H*.14,H*.5,x,-4+H*.68,z,c,{ry:a})},
  mill(k,a,r,H){const x=S(a)*r,z=C(a)*r;k.box(H*.18,H*.6,H*.18,x,-4+H*.3,z,0x9a8a70,{ry:a});k.box(H*.04,H*.7,H*.03,x,-4+H*.62,z,0x6a5a48,{ry:a,rz:.7});k.box(H*.04,H*.7,H*.03,x,-4+H*.62,z,0x6a5a48,{ry:a,rz:-.7})},
  volcano(k,a,r,H){const x=S(a)*r,z=C(a)*r;for(let s=0;s<6;s++){const w=H*(1.6-s*.25);k.box(w,H/6+.5,w*.8,x,-6+s*H/6+H/12,z,s%2?0x3a2420:0x2e1c1a,{ry:a})}k.box(H*.12,H*.9,H*.04,x+C(a)*H*.3,-6+H*.45,z-S(a)*H*.3,0xffb050,{ry:a});k.box(H*.2,H*.04,H*.2,x,-6+H+.3,z,0xffd060)},
  spike(k,a,r,H){const x=S(a)*r,z=C(a)*r;k.box(H*.18,H,H*.18,x,-4+H/2,z,0x1a1418,{ry:a,rz:(R()-.5)*.3})},
  tower(k,a,r,H){const x=S(a)*r,z=C(a)*r;k.box(H*.16,H,H*.16,x,-4+H/2,z,0x8a8a94,{ry:a});k.box(H*.22,H*.15,H*.22,x,-4+H*1.05,z,0x4b3c9a,{ry:a})}};
// cada região: [camada longe, camada perto], com névoa (haze) própria
const PLXDEF={
  vila:[{r:330,n:20,haze:.5,f:k=>(a)=>PX.mount(k,a,330,55+R()*55,0x6f86a8,0x7d93b3,R()<.6?0xf4f6fa:0)},{r:230,n:26,haze:.35,f:k=>(a)=>R()<.15?PX.tower(k,a,230,30):PX.hill(k,a,230,14+R()*14,0x4a7a44,0x5a8a50)}],
  plan:[{r:330,n:18,haze:.5,f:k=>(a)=>PX.mount(k,a,330,45+R()*40,0x8a86a8,0x9a96b3,R()<.5?0xf4f6fa:0)},{r:220,n:26,haze:.32,f:k=>(a)=>R()<.2?PX.mill(k,a,220,28):PX.hill(k,a,220,10+R()*10,0xc8b860,0xb0a050)}],
  flor:[{r:330,n:22,haze:.45,f:k=>(a)=>PX.hill(k,a,330,30+R()*25,0x9a88d0,0xb4a0e4)},{r:220,n:34,haze:.28,f:k=>(a)=>R()<.65?PX.blossom(k,a,220,20+R()*14,R()<.7?0xb858e0:0xf4a6c8,0xe090f4):PX.hill(k,a,220,8+R()*8,0x5cbc7a,0x6ac888)}],
  mata:[{r:330,n:20,haze:.5,f:k=>(a)=>PX.mount(k,a,330,60+R()*50,0x46659a,0x5676aa,R()<.4?0xe8eef4:0)},{r:210,n:60,haze:.3,f:k=>(a)=>R()<.45?PX.pine(k,a,210+(R()-.5)*20,30+R()*30,R()<.5?0x1e5a5a:0x24666a):PX.blossom(k,a,210+(R()-.5)*20,24+R()*16,R()<.5?0xf08a1a:0xe0601e,0xffc030)}],
  mang:[{r:320,n:24,haze:.7,f:k=>(a)=>PX.hill(k,a,320,10+R()*12,0x2e5a58,0x386a66)},{r:200,n:40,haze:.6,f:k=>(a)=>PX.mangrove(k,a,200+(R()-.5)*16,22+R()*14,R()<.5?0x2a5a8a:0x346aa0)}],
  cald:[{r:330,n:12,haze:.4,f:k=>(a)=>PX.volcano(k,a,330,60+R()*50)},{r:220,n:40,haze:.28,f:k=>(a)=>PX.spike(k,a,220+(R()-.5)*20,14+R()*22)}]};
const PLX={};let plxCur=null;
function plxBuild(id){if(PLX[id])return PLX[id];const L=PLXDEF[id].map((d,i)=>{const k=new Bake(),fn=d.f(k);for(let j=0;j<d.n;j++)fn(j/d.n*TAU+R()*.12);
    // cores > 1 marcam lava brilhante (ignora a névoa)
    if(id=='cald'){const c=k.c;for(let q=0;q<c.length;q+=3)if(c[q]>.9&&c[q+1]>.5){c[q]*=1.6;c[q+1]*=1.4}}
    const m=k.mesh(plxMat(d.haze));m.frustumCulled=false;m.renderOrder=-5;m.visible=false;sc.add(m);const o={m,f:i?.5:.75,op:0};MTN.push(o);return o});PLX[id]=L;return L}
function plxUpd(dt,px,pz){regW(px,pz,RW);let b=0;for(let i=1;i<REG.length;i++)if(RW[i]>RW[b])b=i;const id=REG[b].id;if(id!=plxCur){plxCur=id;plxBuild(id)}
  for(const k in PLX)for(const o of PLX[k]){const tgt=k==plxCur?1:0;o.op+=(tgt-o.op)*damp(1.2,dt);if(Math.abs(o.op-tgt)<.01)o.op=tgt;o.m.visible=o.op>0;o.m.material.uniforms.uOp.value=o.op;o.m.material.depthWrite=o.op>=1}}
