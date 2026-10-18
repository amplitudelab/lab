'use strict';
/* =============================================================================
   VOXEL REALMS · modelos e animação
   esqueletos articulados (ombro/cotovelo, quadril/joelho) feitos de caixas
   assadas por osso; animação procedural com suavização em todas as juntas
   ============================================================================= */
function part(parent,x,y,z,fn){const g=new THREE.Group();g.position.set(x,y,z);parent.add(g);if(fn){const k=new Bake();fn(k);const m=k.mesh(MV);if(m){m.castShadow=true;g.add(m)}}return g}
function finish(m){try{skinModel(m)}catch(e){console.warn('skin',e)}m.meshes=[];m.g.traverse(o=>{if(o.isMesh){m.meshes.push(o);o.userData.mat=o.material}});m.A={w:0,ph:R()*6,look:0,lookT:0,lt:0,aw:0,fl:0};sc.add(m.g);return m}
function flashModel(m,on){if(!!m.fl==on)return;m.fl=on;for(const o of m.meshes)o.material=on?(o.isSkinnedMesh?MFLS:MFL):o.userData.mat}
// ---------- modelo numa malha só: cada parte (cabeça, braço, perna...) vira um "osso" e o corpo inteiro é
// desenhado de uma vez (SkinnedMesh). A animação continua mexendo nos mesmos grupos, mas o custo cai de
// ~15 chamadas de desenho por personagem para 1 ou 2.
const MFLS=new THREE.MeshBasicMaterial({color:0xffffff,skinning:true}),SKM=new Map(),_mi=new THREE.Matrix4(),_m3=new THREE.Matrix3(),_v3=new V3();
function skinMat(mt){let s=SKM.get(mt);if(!s){s=mt.clone();s.skinning=true;if(mt.onBeforeCompile)s.onBeforeCompile=mt.onBeforeCompile;SKM.set(mt,s)}return s}
function skinModel(m){const root=m.g,list=[];root.updateMatrixWorld(true);
  root.traverse(o=>{if(o.isMesh&&!o.isSkinnedMesh&&o.geometry&&o.geometry.attributes.position)list.push(o)});if(list.length<3)return;
  _mi.copy(root.matrixWorld).invert();const groups=new Map();
  for(const o of list){const k=o.material;if(!groups.has(k))groups.set(k,[]);groups.get(k).push(o)}
  const bones=[],bi=new Map();
  for(const o of list){const b=new THREE.Object3D();b.position.copy(o.position);b.quaternion.copy(o.quaternion);b.scale.copy(o.scale);o.parent.add(b);while(o.children.length)b.add(o.children[0]);o.parent.remove(o);bi.set(o,bones.length);bones.push(b)}
  root.updateMatrixWorld(true);const skel=new THREE.Skeleton(bones);
  for(const[mt,arr]of groups){let nv=0,ni=0;for(const o of arr){const g=o.geometry;nv+=g.attributes.position.count;ni+=g.index?g.index.count:g.attributes.position.count}
    const P_=new Float32Array(nv*3),N=new Float32Array(nv*3),Cc=new Float32Array(nv*3),U=new Float32Array(nv*2),SI=new Float32Array(nv*4),SW=new Float32Array(nv*4),I=new (nv>65535?Uint32Array:Uint16Array)(ni);let vo=0,io=0;
    for(const o of arr){const g=o.geometry,pa=g.attributes.position,na=g.attributes.normal,ca=g.attributes.color,ua=g.attributes.uv,n=pa.count,b=bi.get(o);
      const M=new THREE.Matrix4().multiplyMatrices(_mi,o.matrixWorld);_m3.getNormalMatrix(M);
      for(let i=0;i<n;i++){_v3.fromBufferAttribute(pa,i).applyMatrix4(M);P_.set([_v3.x,_v3.y,_v3.z],(vo+i)*3);
        if(na){_v3.fromBufferAttribute(na,i).applyMatrix3(_m3).normalize();N.set([_v3.x,_v3.y,_v3.z],(vo+i)*3)}
        if(ca){Cc[(vo+i)*3]=ca.getX(i);Cc[(vo+i)*3+1]=ca.getY(i);Cc[(vo+i)*3+2]=ca.getZ(i)}else{Cc[(vo+i)*3]=Cc[(vo+i)*3+1]=Cc[(vo+i)*3+2]=1}
        if(ua){U[(vo+i)*2]=ua.getX(i);U[(vo+i)*2+1]=ua.getY(i)}SI[(vo+i)*4]=b;SW[(vo+i)*4]=1}
      if(g.index){const ix=g.index.array;for(let i=0;i<ix.length;i++)I[io+i]=ix[i]+vo;io+=ix.length}else{for(let i=0;i<n;i++)I[io+i]=vo+i;io+=n}
      vo+=n;g.dispose()}
    const G=new THREE.BufferGeometry();G.setAttribute('position',new THREE.BufferAttribute(P_,3));G.setAttribute('normal',new THREE.BufferAttribute(N,3));G.setAttribute('color',new THREE.BufferAttribute(Cc,3));G.setAttribute('uv',new THREE.BufferAttribute(U,2));
    G.setAttribute('skinIndex',new THREE.BufferAttribute(SI,4));G.setAttribute('skinWeight',new THREE.BufferAttribute(SW,4));G.setIndex(new THREE.BufferAttribute(I,1));G.computeBoundingSphere();G.boundingSphere.radius*=1.5;
    const sk=new THREE.SkinnedMesh(G,skinMat(mt));sk.castShadow=arr.some(o=>o.castShadow);sk.receiveShadow=arr.some(o=>o.receiveShadow);root.add(sk);sk.updateMatrixWorld(true);sk.bind(skel,sk.matrixWorld.clone())}}
function dropModel(m){sc.remove(m.g);m.g.traverse(o=>{if(o.isMesh)o.geometry.dispose()})}
const sm=(o,k,v,dt,sp)=>{o[k]+=(v-o[k])*damp(sp,dt)};

// ---------- armas (eixo +y = lâmina; a mão gira para apontar para frente)
const WPN={
  sword:(k,c,g)=>{k.box(.12,1.35,.06,0,.95,0,c||0xdfe8f0).box(.05,.24,.05,0,1.75,0,c||0xf0f6fa).box(.55,.1,.14,0,.26,0,g||0xd9a948).box(.1,.32,.1,0,.08,0,0x5b3822).box(.15,.12,.15,0,-.12,0,g||0xd9a948)},
  axe:(k,c,g)=>{k.box(.1,1.5,.1,0,.6,0,0x6a4424).box(.08,.62,.55,0,1.15,.24,c||0xcfd6dc).box(.1,.2,.2,0,1.15,0,g||0xd9a948)},
  mace:(k,c,g)=>{k.box(.1,1.2,.1,0,.5,0,0x5a3a20).box(.4,.4,.4,0,1.2,0,c||0x8a8f99).box(.12,.12,.55,0,1.2,0,c||0x8a8f99).box(.55,.12,.12,0,1.2,0,c||0x8a8f99).box(.14,.14,.14,0,-.08,0,g||0xd9a948)},
  bow:(k,c)=>{k.box(.1,.75,.1,0,.36,.12,c||0x8a5a2b,{rx:.35}).box(.1,.75,.1,0,-.36,.12,c||0x8a5a2b,{rx:-.35}).box(.03,1.32,.03,0,0,-.02,0xf5eed0)},
  staff:(k,c)=>{k.box(.11,2.6,.11,0,.5,0,0x5a3a20).box(.24,.24,.24,0,1.85,0,c||0xd9a948).box(.36,.1,.36,0,1.65,0,0xd9a948)},
  wand:(k,c)=>{k.box(.08,1,.08,0,.4,0,0x3a2a4a).box(.16,.16,.16,0,.95,0,c||0xc8a0ff).box(.12,.06,.12,0,.1,0,0xd9a948)},
  dagger:(k,c)=>{k.box(.08,.6,.05,0,.42,0,c||0xc8ccd0).box(.3,.08,.1,0,.12,0,0x4a3a2a).box(.08,.2,.08,0,0,0,0x3a2a1a)},
  club:(k,c)=>{k.box(.14,1.1,.14,0,.45,0,0x6a4424).box(.3,.5,.3,0,1,0,c||0x5a3a20)},
  shield:(k,c)=>{k.box(.12,.9,.8,0,0,0,c||0x8a8f99).box(.14,.32,.32,0,0,0,0xd9a948)}};
function weapon(m,type,col,glowCol,hand){const h=hand||m.hR;for(let i=h.children.length-1;i>=0;i--)if(!h.children[i].userData.keep)h.remove(h.children[i]);if(!type)return;const g=new THREE.Group();g.rotation.x=PI/2*.9;h.add(g);
  const k=new Bake();WPN[type](k,col,type=='sword'||type=='axe'||type=='mace'?null:0);const ms=k.mesh(MV);ms.castShadow=true;g.add(ms);
  if(glowCol){const s=new THREE.Sprite(new THREE.SpriteMaterial({map:SPR,color:glowCol,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,opacity:.6}));s.scale.set(1.1,1.1,1);s.position.y=type=='staff'?1.85:type=='wand'?.95:1;g.add(s)}
  if(type=='shield'){g.rotation.set(0,0,0);ms.position.set(-.1,0,0)}
  m.meshes=[];m.g.traverse(o=>{if(o.isMesh){m.meshes.push(o);if(!o.userData.mat)o.userData.mat=o.material}});return g}

// ---------- humanoide
// tom mais claro/escuro de uma cor (detalhes de roupa no estilo das referências: barras, golas, solas)
const shade=(c,f)=>{const r=Math.min(255,((c>>16)&255)*f)|0,g=Math.min(255,((c>>8)&255)*f)|0,b=Math.min(255,(c&255)*f)|0;return(r<<16)|(g<<8)|b};
function hum(o){const B=o.bulk||1,m={kind:'hum',g:new THREE.Group(),o},TR=o.trim||0xd9a948;
  m.hips=part(m.g,0,1.02,0,k=>{k.box(.86*B,.32,.5*B,0,0,0,o.pants);if(o.belt){k.box(.9*B,.14,.54*B,0,.12,0,o.belt).box(.16,.13,.04,0,.12,.28*B,0xe8c060).box(.08,.07,.05,0,.12,.29*B,shade(o.belt,.6))}if(o.robe){k.box(1.02*B,.95,.68*B,0,-.42,0,o.robe).box(1.04*B,.09,.7*B,0,-.86,0,TR).box(.09,.86,.02,0,-.42,.35*B,TR)}});
  m.torso=part(m.hips,0,.12,0,k=>{k.box(.9*B,.96,.5*B,0,.48,0,o.shirt).box(.92*B,.09,.52*B,0,.06,0,shade(o.shirt,.72)).box(.54*B,.1,.54*B,0,.93,0,shade(o.shirt,1.25));if(!o.vest&&!o.bones)k.box(.07,.07,.03,0,.7,.26*B,shade(o.shirt,.6)).box(.07,.07,.03,0,.5,.26*B,shade(o.shirt,.6));if(o.vest)k.box(.06,.6,.03,0,.45,.28*B,shade(o.vest,.7)).box(.07,.07,.04,.1,.6,.28*B,0xe8c060).box(.07,.07,.04,.1,.36,.28*B,0xe8c060);if(o.vest)k.box(.94*B,.7,.54*B,0,.45,0,o.vest);if(o.shoulders)k.box(1.24*B,.3,.62*B,0,.9,0,o.shoulders);if(o.bones)for(let i=0;i<3;i++)k.box(.96*B,.07,.54*B,0,.3+i*.22,0,o.bones);if(o.torn)k.box(.3,.3,.52*B,.2,.3,0,o.torn);if(o.emblem)k.box(.3,.3,.06,0,.6,.26*B,o.emblem)});
  m.head=part(m.torso,0,1.0,0,k=>{k.box(.78,.78,.78,0,.4,0,o.skin);const ey=o.eyes||0x1a1a2a;
    if(!o.noFace){const ic=o.eyeC||(o.eyes?o.eyes:0x3a6ab0),br=o.brow||shade(o.hair||0x3a2a1a,.8);
      for(const s of[-1,1]){k.box(.18,.2,.03,s*.17,.44,.395,0xf4f0ea).box(.11,.15,.035,s*.15,.43,.4,ic).box(.06,.08,.04,s*.14,.42,.405,shade(ic,.35)).box(.045,.045,.045,s*.18,.48,.41,0xffffff);
        k.box(.2,.05,.04,s*.17,.585,.405,br,{rz:s*-.12});k.box(.1,.05,.02,s*.27,.31,.395,o.blush||0xe88a7a);k.box(.07,.16,.14,s*.41,.42,.02,o.ears=='elf'?o.skin:shade(o.skin,.92));if(o.ears=='elf')k.box(.06,.12,.1,s*.47,.52,-.02,o.skin,{rz:s*-.5})}
      k.box(.09,.1,.05,0,.34,.41,shade(o.skin,.88)).box(.16,.04,.03,0,.23,.4,o.mouth||0x7a3a32)}
    if(o.hair&&o.hairS!='bald'){k.box(.84,.24,.84,0,.76,0,o.hair).box(.84,.6,.2,0,.5,-.34,o.hair).box(.84,.13,.1,0,.69,.38,o.hair).box(.22,.12,.1,-.26,.62,.39,shade(o.hair,.85)).box(.1,.4,.34,-.4,.5,.12,o.hair).box(.1,.4,.34,.4,.5,.12,o.hair);if(o.hairS=='long')k.box(.84,.9,.18,0,.2,-.36,o.hair).box(.18,.5,.6,-.38,.4,-.1,o.hair).box(.18,.5,.6,.38,.4,-.1,o.hair)}
    if(o.beard)k.box(.72,.5,.2,0,.06,.42,o.beard).box(.3,.3,.2,0,-.2,.44,o.beard);
    if(o.hat=='ranger'){k.box(1.36,.08,1.3,0,.82,0,o.hatC).box(.86,.36,.86,0,1.02,0,o.hatC).box(.88,.09,.88,0,.9,0,shade(o.hatC,.55)).box(.06,.56,.14,.4,1.12,-.1,o.plume||0xc0302a,{rz:-.35}).box(.04,.3,.1,.47,1.32,-.12,0xf0e0c0,{rz:-.35})}
    if(o.hat=='wizard'){k.box(1.4,.12,1.4,0,.86,0,o.hatC).box(.88,.5,.88,0,1.14,0,o.hatC).box(.9,.12,.9,0,.96,0,0xd9a948).box(.14,.14,.06,0,.97,.46,o.gem||0x7df0ff).box(.6,.45,.6,0,1.56,-.08,o.hatC).box(.36,.42,.36,0,1.94,-.2,o.hatC).box(.2,.32,.2,0,2.26,-.36,o.hatC)}
    if(o.hat=='helm'){k.box(.94,.44,.94,0,.84,0,o.hatC||0x9aa2ae).box(.96,.12,.96,0,.66,0,0xd9a948).box(.12,.36,.08,0,.5,.44,0x7a808a);if(o.plume)k.box(.14,.5,.62,0,1.2,-.05,o.plume)}
    if(o.hat=='horn'){k.box(.94,.42,.94,0,.84,0,o.hatC||0x9aa0aa);k.box(.14,.46,.14,-.55,1,0,0xeee0b0).box(.14,.46,.14,.55,1,0,0xeee0b0)}
    if(o.hat=='hood'){k.box(.92,.5,.92,0,.78,-.02,o.hatC).box(.92,.8,.2,0,.4,-.42,o.hatC).box(.2,.7,.7,-.44,.4,-.05,o.hatC).box(.2,.7,.7,.44,.4,-.05,o.hatC);if(o.mask)k.box(.8,.3,.06,0,.2,.41,o.mask)}
    if(o.hat=='witch'){k.box(1.5,.1,1.5,0,.84,0,o.hatC).box(.8,.6,.8,0,1.15,0,o.hatC).box(.5,.5,.5,0,1.65,-.15,o.hatC).box(.28,.5,.28,0,2.1,-.35,o.hatC).box(.82,.1,.82,0,.92,0,0x7dff6a)}
    if(o.hat=='crown')k.box(.86,.2,.86,0,.86,0,0xffd34a).box(.14,.2,.14,-.3,1.02,.3,0xffd34a).box(.14,.2,.14,.3,1.02,.3,0xffd34a).box(.14,.24,.14,0,1.04,.32,0xff3a5a);
    if(o.branches){k.box(.2,1.2,.2,-.3,1.2,0,0x5a3a2a,{rz:.4}).box(.2,1,.2,.35,1.1,.1,0x5a3a2a,{rz:-.5});for(let i=0;i<5;i++)k.box(.7,.5,.7,(i-2)*.35,1.7+(i%2)*.3,(i%3-1)*.2,o.leaf||0x3d8b3d)}});
  if(o.glowEyes){const k=new Bake();k.box(.15,.15,.05,-.17,.44,.41,o.glowEyes).box(.15,.15,.05,.17,.44,.41,o.glowEyes);m.head.add(k.mesh(ME))}
  const arm=(sx)=>{const sh=part(m.torso,sx*(.45*B+.15),.86,0,k=>{k.box(.3*B,.52,.3*B,0,-.24,0,o.sleeve||o.shirt);if(o.shoulders)k.box(.42*B,.3,.44*B,0,0,0,o.shoulders)});
    const el=part(sh,0,-.5,0,k=>{k.box(.27*B,.46,.28*B,0,-.21,0,o.arm||o.skin).box(.31*B,.09,.32*B,0,-.02,0,shade(o.sleeve||o.shirt,.75));if(o.gloves)k.box(.3*B,.2,.3*B,0,-.36,0,o.gloves)});
    const hd=part(el,0,-.46,0,k=>k.box(.24*B,.22,.24*B,0,-.06,0,o.gloves||o.skin));return[sh,el,hd]};
  [m.sL,m.eL,m.hL]=arm(-1);[m.sR,m.eR,m.hR]=arm(1);m.hR=part(m.hR,0,-.12,.02);m.hL=part(m.hL,0,-.12,.02);
  const leg=(sx)=>{const t=part(m.hips,sx*.23*B,-.05,0,k=>k.box(.34*B,.5,.38*B,0,-.25,0,o.pants));const kn=part(t,0,-.5,0,k=>{k.box(.32*B,.42,.36*B,0,-.2,0,o.pants);k.box(.36*B,.22,.5*B,0,-.45,.06,o.boots||0x3a2a1e).box(.38*B,.06,.52*B,0,-.55,.06,shade(o.boots||0x3a2a1e,1.6)).box(.37*B,.1,.4*B,0,-.31,.02,shade(o.boots||0x3a2a1e,1.3))});return[t,kn]};
  [m.tL,m.kL]=leg(-1);[m.tR,m.kR]=leg(1);
  if(o.cape){m.cape=part(m.torso,0,.96,-.28,k=>{k.box(1*B,1.45,.1,0,-.72,0,o.cape);if(o.capeE)k.box(.3,.5,.12,0,-.72,-.06,o.capeE);k.box(1.02*B,.1,.12,0,-1.4,0,TR)})}
  if(o.wings){m.wL=part(m.torso,-.2,.7,-.3,k=>k.box(.06,.8,1.1,-.3,.2,-.4,o.wings,{rz:.5}));m.wR=part(m.torso,.2,.7,-.3,k=>k.box(.06,.8,1.1,.3,.2,-.4,o.wings,{rz:-.5}))}
  m.head.scale.setScalar(o.headS||1.16); // cabeça grande, proporção das referências
  m.g.scale.setScalar(o.scale||1);return finish(m)}
// pose alvo + suavização
const _T={};
function seq(p,rest,wind,strike,a,b){const u1=easeOut(cl(p/a,0,1)),u2=easeOut(cl((p-a)/(b-a),0,1)),u3=sstep(b,1,p);return lerp(lerp(lerp(rest,wind,u1),strike,u2),rest,u3)}
function animHum(m,dt,t,s){const A=m.A,o=m.o,T=_T,v=s.v||0,zb=o.zombie;
  sm(A,'w',cl(v/(zb?2.4:4.6),0,1.3),dt,8);const W=A.w;A.ph+=dt*(zb?1.6:2+v*1.55)*(W>.04?1:.0);const sp=S(A.ph),cp=C(A.ph);
  A.lt-=dt;if(A.lt<=0){A.lt=2+R()*3;A.lookT=(R()-.5)*1.1}sm(A,'look',A.lookT*(1-cl(W*2,0,1)),dt,3);
  T.hy=1.02+(Math.abs(sp)*.08-.04)*W;T.hry=sp*.14*W;T.hrx=0;T.trx=(zb?.25:.1*W*W);T.try=-sp*.2*W;T.trz=zb?S(t*1.3)*.08:0;T.hdx=zb?.25:0;T.hdy=A.look;T.hdz=zb?.2:0;
  T.tL=-sp*.75*W;T.tR=sp*.75*W;T.kL=Math.max(0,cp)*1.15*W+.03;T.kR=Math.max(0,-cp)*1.15*W+.03;
  T.sLx=sp*.65*W;T.sRx=-sp*.65*W;T.sLz=-.07-S(t*1.8)*.025*(1-W);T.sRz=.07+S(t*1.8)*.025*(1-W);T.sLy=0;T.sRy=0;T.eL=-(.18+.55*W);T.eR=-(.18+.55*W);
  T.brs=1+S(t*2.2)*.012*(1-W);
  // corrida: passada longa, braços dobrados bombeando, tronco inclinado, quique maior
  const rk_=cl((v-6)/2.5,0,1);if(rk_>0&&!zb){T.tL*=1+.35*rk_;T.tR*=1+.35*rk_;T.kL+=Math.max(0,cp)*.6*rk_;T.kR+=Math.max(0,-cp)*.6*rk_;T.sLx=sp*(.65+.45*rk_)*W;T.sRx=-sp*(.65+.45*rk_)*W;T.eL=T.eR=-(.7+.8*rk_);T.sLz=-.15;T.sRz=.15;T.trx=.1+.28*rk_;T.hy+=Math.abs(sp)*.05*rk_;T.hdx=-.12*rk_}
  if(s.dash){T.trx=.55;T.sLx=T.sRx=1;T.sLz=-.3;T.sRz=.3;T.eL=T.eR=-.2;T.tL=-.7;T.tR=.6;T.kL=.4;T.kR=1.2;T.hdx=-.3}
  if(zb){T.sLx=-1.35+sp*.15;T.sRx=-1.45-sp*.15;T.eL=T.eR=-.1;T.sLz=-.1;T.sRz=.1}
  if(s.aim){const pl=s.pull||0;T.sLx=-1.55;T.sLz=0;T.eL=-.05;T.sRx=-1.55;T.sRz=.1;T.eR=-.4-1.5*pl;T.try=-.45;T.hdy=.45}
  if(s.block){T.sLx=-1.2;T.eL=-1.2;T.sLz=-.3}
  let k=s.dash?30:14;const a=s.atk;
  if(a){const p=a.p;k=28;switch(a.k){
    case 'slashA':T.sRx=seq(p,T.sRx,-2.55,-.25,.3,.5);T.sRz=seq(p,T.sRz,.5,-.35,.3,.5);T.eR=seq(p,T.eR,-.7,-.1,.3,.5);T.try=seq(p,T.try,.5,-.55,.3,.5);T.hry=seq(p,T.hry,.2,-.25,.3,.5);T.sLx=seq(p,T.sLx,.3,-.4,.3,.5);break;
    case 'slashB':T.sRx=seq(p,T.sRx,-1.45,-1.45,.3,.5);T.sRz=seq(p,T.sRz,1.35,-.7,.3,.5);T.sRy=seq(p,0,.4,-.6,.3,.5);T.eR=-.15;T.try=seq(p,T.try,.75,-.85,.3,.5);T.hry=seq(p,T.hry,.3,-.3,.3,.5);T.sLz=seq(p,T.sLz,-.6,-.2,.3,.5);break;
    case 'slam':{const x=seq(p,T.sRx,-2.95,-.55,.38,.55);T.sRx=T.sLx=x;T.sLz=-.15;T.sRz=.15;T.eL=T.eR=seq(p,T.eR,-.35,-.05,.38,.55);T.trx=seq(p,T.trx,-.3,.55,.38,.55);T.hy=seq(p,1.02,1.08,.82,.38,.55);T.tL=T.tR=seq(p,0,0,-.55,.38,.55);T.kL=T.kR=seq(p,.03,.1,.9,.38,.55);break}
    case 'spin':T.sRx=-1.5;T.sRz=1.4;T.sLx=-1.5;T.sLz=-1.4;T.eL=T.eR=-.1;T.trx=.1;break;
    case 'cast':T.sLx=T.sRx=seq(p,T.sRx,-2.1,-1.45,.4,.55);T.sLz=-.25;T.sRz=.25;T.eL=T.eR=seq(p,-.2,-.9,-.05,.4,.55);T.trx=seq(p,0,-.2,.15,.4,.55);break;
    case 'shout':T.sLx=T.sRx=seq(p,0,-2.7,-2.4,.35,.5);T.sLz=seq(p,0,-.7,-.9,.35,.5);T.sRz=-T.sLz;T.hdx=seq(p,0,-.45,-.5,.35,.5);T.trx=seq(p,0,-.25,-.3,.35,.5);break;
    case 'thrust':T.sRx=seq(p,T.sRx,-.6,-1.65,.3,.45);T.eR=seq(p,T.eR,-1.6,0,.3,.45);T.try=seq(p,0,.4,-.35,.3,.45);T.trx=seq(p,0,-.05,.25,.3,.45);break;
    case 'claw':{const x=seq(p,T.sRx,-2.2,-.9,.35,.5);T.sRx=x;T.sLx=seq(p,T.sLx,-2.2,-.9,.42,.58);T.eL=T.eR=-.3;T.trx=seq(p,T.trx,-.2,.45,.35,.5);break}
    case 'shoot':{const pl=cl(p/.6,0,1),rel=p>.6;T.sLx=-1.55;T.sLz=0;T.eL=-.05;T.sRx=-1.55;T.sRz=.1;T.eR=rel?-.2:-.4-1.5*pl;T.try=-.45;T.hdy=.45;break}}}
  if(s.leap){T.tL=T.tR=-1.1;T.kL=T.kR=1.7;T.sLx=T.sRx=-2.7;T.eL=T.eR=-.3;T.trx=.3}
  if(s.hurt>0){T.trx-=.4*s.hurt;T.hdx-=.3*s.hurt;T.sLz-=.3*s.hurt;T.sRz+=.3*s.hurt}
  if(s.dead){k=6;T.sLx=-.4;T.sRx=-.3;T.eL=T.eR=-.4;T.tL=.3;T.tR=-.2;T.kL=T.kR=.4;T.hdx=.3}
  if(s.sit){T.tL=T.tR=-1.5;T.kL=T.kR=1.5;T.hy=.55}
  const h=m.hips,tr=m.torso;sm(h.position,'y',T.hy,dt,k);sm(h.rotation,'y',T.hry,dt,k);sm(tr.rotation,'x',T.trx,dt,k);sm(tr.rotation,'y',T.try,dt,k);sm(tr.rotation,'z',T.trz,dt,k);tr.scale.y=T.brs;
  sm(m.head.rotation,'x',T.hdx,dt,k);sm(m.head.rotation,'y',T.hdy,dt,8);sm(m.head.rotation,'z',T.hdz,dt,k);
  sm(m.tL.rotation,'x',T.tL,dt,k);sm(m.tR.rotation,'x',T.tR,dt,k);sm(m.kL.rotation,'x',T.kL,dt,k);sm(m.kR.rotation,'x',T.kR,dt,k);
  sm(m.sL.rotation,'x',T.sLx,dt,k);sm(m.sR.rotation,'x',T.sRx,dt,k);sm(m.sL.rotation,'z',T.sLz,dt,k);sm(m.sR.rotation,'z',T.sRz,dt,k);sm(m.sL.rotation,'y',T.sLy,dt,k);sm(m.sR.rotation,'y',T.sRy,dt,k);
  sm(m.eL.rotation,'x',T.eL,dt,k);sm(m.eR.rotation,'x',T.eR,dt,k);
  if(m.cape)sm(m.cape.rotation,'x',.1+W*.6+S(t*5+A.ph)*.05*(.3+W)+(s.leap?.8:0),dt,8);
  if(m.wL){const f=S(t*30)*.6;m.wL.rotation.y=-.3-f;m.wR.rotation.y=.3+f}}

// ---------- quadrúpede (javali, lobo, cervo, ovelha, vaca, raposa, crocodilo)
function quad(o){const m={kind:'quad',g:new THREE.Group(),o},L=o.len||1.4,H=o.h||.7,W=o.wid||.6;
  m.body=part(m.g,0,H+.15,0,k=>{k.box(W,o.bh||.62,L,0,0,0,o.c);if(o.c2)k.box(W*1.02,(o.bh||.62)*.4,L*.6,0,-(o.bh||.62)*.25,0,o.c2);if(o.mane)k.box(W*1.12,(o.bh||.62)*.9,L*.4,0,.1,L*.25,o.mane);if(o.wool)k.box(W*1.2,(o.bh||.62)*1.2,L*1.05,0,.05,0,o.wool);if(o.spots)for(let i=0;i<4;i++)k.box(W*1.03,.22,.3,0,.05,(i-1.5)*L*.22,o.spots);if(o.back)for(let i=0;i<4;i++)k.box(.18,.2,.25,0,(o.bh||.62)*.55,(i-1.5)*L*.22,o.back)});
  m.neck=part(m.body,0,.12,L/2,k=>{k.box(W*.7,.5,.5,0,.05,.12,o.c)});
  m.head=part(m.neck,0,.15,.38,k=>{const hl=o.hl||.55;k.box(W*.78,.5,hl,0,0,hl/2,o.hc||o.c);k.box(W*.5,.26,.26,0,-.08,hl+.08,o.snout||0x3a2a2a);k.box(.12,.12,.04,-W*.28,.1,hl*.75,o.eye||0x1a1a1a).box(.12,.12,.04,W*.28,.1,hl*.75,o.eye||0x1a1a1a);
    if(o.ears)k.box(.14,.3,.1,-W*.25,.34,hl*.3,o.c).box(.14,.3,.1,W*.25,.34,hl*.3,o.c);if(o.tusk)k.box(.07,.26,.07,-.16,-.12,hl+.1,0xf0e8d0).box(.07,.26,.07,.16,-.12,hl+.1,0xf0e8d0);
    if(o.antler)for(const s of[-1,1]){k.box(.08,.7,.08,s*.2,.6,.2,0x8a6a4a,{rz:-s*.3}).box(.08,.4,.08,s*.42,.85,.25,0x8a6a4a,{rz:-s*.9}).box(.08,.35,.08,s*.3,.95,.05,0x8a6a4a,{rx:.5})}
    if(o.horn)k.box(.12,.4,.12,-.2,.35,.25,0xe8dcc0,{rz:.3}).box(.12,.4,.12,.2,.35,.25,0xe8dcc0,{rz:-.3})});
  m.jaw=part(m.head,0,-.2,.1,k=>{k.box(W*.66,.14,(o.hl||.55)*.95,0,0,(o.hl||.55)*.5,o.jc||o.hc||o.c);if(o.teeth)k.box(W*.6,.08,.05,0,.08,(o.hl||.55)*.95,0xf0f0e0)});
  m.tail=part(m.body,0,.15,-L/2,k=>{const tl=o.tl||.5;k.box(o.tw||.16,o.tw||.16,tl,0,0,-tl/2,o.tc||o.c)});
  m.legs=[];for(const[sx,sz]of[[-1,1],[1,1],[-1,-1],[1,-1]]){const u=part(m.body,sx*(W/2-.1),-.15,sz*L*.36,k=>k.box(.22,H*.6,.26,0,-H*.28,0,o.lc||o.c));const lo=part(u,0,-H*.55,0,k=>{k.box(.2,H*.5,.22,0,-H*.24,0,o.lc||o.c);k.box(.22,.12,.26,0,-H*.5,.03,o.hoof||0x2a2018)});m.legs.push([u,lo])}
  if(o.wings){m.wL=part(m.body,-W/2,.3,0,k=>k.box(2.4,.1,1.4,-1.2,0,0,o.wings));m.wR=part(m.body,W/2,.3,0,k=>k.box(2.4,.1,1.4,1.2,0,0,o.wings))}
  m.g.scale.setScalar(o.scale||1);return finish(m)}
function animQuad(m,dt,t,s){const A=m.A,v=s.v||0,o=m.o;sm(A,'w',cl(v/(o.run||5),0,1.4),dt,7);const W=A.w;A.ph+=dt*(3+v*2.2)*(W>.04?1:0);
  let k=12;const ph=A.ph,off=[0,PI,PI,0];
  for(let i=0;i<4;i++){const[u,lo]=m.legs[i],q=ph+off[i];sm(u.rotation,'x',S(q)*.7*W,dt,k);sm(lo.rotation,'x',Math.max(0,C(q))*.9*W,dt,k)}
  sm(m.body.position,'y',(o.h||.7)+.15+Math.abs(S(ph))*.06*W,dt,k);sm(m.body.rotation,'x',S(ph*2)*.03*W,dt,k);
  A.lt-=dt;if(A.lt<=0){A.lt=2+R()*4;A.lookT=(R()-.5)*1.2;A.graze=o.grazer&&R()<.45}
  let nx=.0,hy_=A.lookT*(1-cl(W*2,0,1)),jaw=0;if(A.graze&&W<.1)nx=.9;
  const a=s.atk;if(a){k=26;const p=a.p;if(a.k=='bite'){nx=seq(p,0,-.4,.35,.35,.5);jaw=seq(p,0,.7,0,.35,.5)}else if(a.k=='charge'){nx=.35}else if(a.k=='roar'){nx=-.5;jaw=.8}}
  if(s.hurt>0)nx-=.3*s.hurt;sm(m.neck.rotation,'x',nx,dt,k);sm(m.neck.rotation,'y',hy_,dt,4);sm(m.jaw.rotation,'x',jaw,dt,k*1.2);
  sm(m.tail.rotation,'y',S(t*(o.wag||5)+ph)*.5*(.4+W),dt,10);sm(m.tail.rotation,'x',o.tailUp||-.3,dt,6);
  if(m.wL){const f=S(t*(s.fly?6:2))*(s.fly?.7:.15);m.wL.rotation.z=f;m.wR.rotation.z=-f}}

// ---------- aranha
function spider(o){const m={kind:'spider',g:new THREE.Group(),o};
  m.body=part(m.g,0,.65,0,k=>{k.box(.9,.5,.9,0,0,.3,o.c);k.box(1.3,.9,1.3,0,.2,-.7,o.c2||o.c);if(o.mark)k.box(.5,.1,.5,0,.66,-.7,o.mark);k.box(.12,.12,.06,-.2,.1,.76,0xff2a2a).box(.12,.12,.06,.2,.1,.76,0xff2a2a).box(.08,.25,.08,-.12,-.2,.78,0x1a1220).box(.08,.25,.08,.12,-.2,.78,0x1a1220)});
  m.legs=[];for(let i=0;i<8;i++){const sx=i<4?-1:1,j=i%4,u=part(m.body,sx*.4,0,.5-j*.32,k=>k.box(.9,.1,.1,sx*.45,.15,0,o.c,{rz:sx*-.35}));u.rotation.y=sx*(j-1.5)*.32;const lo=part(u,sx*.85,.3,0,k=>k.box(.1,.8,.1,0,-.4,0,o.c));m.legs.push([u,lo,sx])}
  m.g.scale.setScalar(o.scale||1);return finish(m)}
function animSpider(m,dt,t,s){const A=m.A,v=s.v||0;sm(A,'w',cl(v/5,0,1.3),dt,8);A.ph+=dt*(4+v*3)*(A.w>.04?1:0);
  m.legs.forEach(([u,lo,sx],i)=>{const q=A.ph+(i%2?PI:0)+(i>3?PI/2:0);u.rotation.z=sx*(S(q)*.25*A.w+(s.atk?-.3:0));u.rotation.x=C(q)*.25*A.w});
  m.body.position.y=.65+S(A.ph*2)*.04*A.w+(s.atk?seq(s.atk.p,0,.25,-.1,.3,.5):0)}

// ---------- abelha / fada (voadores)
function bee(o){const m={kind:'bee',g:new THREE.Group(),o};
  m.body=part(m.g,0,1.6,0,k=>{k.box(.7,.6,.6,0,0,.35,o.c2||0x2a1a10);for(let i=0;i<3;i++)k.box(.82,.74,.32,0,-.05,-.1-i*.32,i%2?0x2a1a10:o.c);k.box(.12,.12,.4,0,-.15,-1.05,0x2a2a2a);k.box(.14,.14,.05,-.18,.08,.66,0xff2a2a).box(.14,.14,.05,.18,.08,.66,0xff2a2a);k.box(.05,.4,.05,-.15,.4,.6,0x2a1a10,{rx:-.4}).box(.05,.4,.05,.15,.4,.6,0x2a1a10,{rx:-.4})});
  const wm=new THREE.MeshBasicMaterial({color:0xe8f4ff,transparent:true,opacity:.55,depthWrite:false});
  m.wL=part(m.body,-.3,.3,.1);m.wR=part(m.body,.3,.3,.1);for(const[w,s]of[[m.wL,-1],[m.wR,1]]){const q=new THREE.Mesh(new THREE.BoxGeometry(1,.04,.6),wm);q.position.x=s*.5;w.add(q)}
  m.g.scale.setScalar(o.scale||1);return finish(m)}
function animBee(m,dt,t,s){const f=S(t*42)*.9;m.wL.rotation.z=f;m.wR.rotation.z=-f;m.body.position.y=1.6+S(t*3+m.A.ph)*.2+(s.atk?seq(s.atk.p,0,.3,-.7,.4,.55):0);m.body.rotation.x=s.atk?seq(s.atk.p,0,-.3,.6,.4,.55):(s.v||0)*.04}

// ---------- slime e sapo
function slime(o){const m={kind:'slime',g:new THREE.Group(),o};m.body=part(m.g,0,0,0,k=>{k.box(1.3,1.1,1.3,0,.55,0,o.c);k.box(1.1,.25,1.1,0,1.12,0,o.c2||o.c);k.box(.18,.22,.06,-.25,.78,.66,0x1a0a05).box(.18,.22,.06,.25,.78,.66,0x1a0a05);if(o.core)k.box(.6,.5,.06,0,.42,.66,o.core)});
  if(o.glow){const k=new Bake();k.box(1.36,.2,1.36,0,.1,0,o.glow);m.body.add(k.mesh(ME))}m.g.scale.setScalar(o.scale||1);return finish(m)}
function animSlime(m,dt,t,s){const q=S(t*7+m.A.ph)*.1*(1+(s.v||0)*.2),a=s.atk?seq(s.atk.p,0,-.25,.3,.35,.5):0;m.body.scale.set(1+q-a*.5,1-q+a,1+q-a*.5);m.body.position.y=(s.v>.3?Math.abs(S(t*6+m.A.ph))*.45:0)}
function frog(o){const m={kind:'frog',g:new THREE.Group(),o};m.body=part(m.g,0,.4,0,k=>{k.box(.9,.5,1,0,.1,0,o.c);k.box(.86,.2,.9,0,-.12,.05,o.c2||0xe8e0a0);k.box(.26,.26,.26,-.28,.42,.32,o.c).box(.26,.26,.26,.28,.42,.32,o.c);k.box(.14,.14,.05,-.28,.44,.46,0x1a1a1a).box(.14,.14,.05,.28,.44,.46,0x1a1a1a);if(o.spots)k.box(.5,.06,.5,0,.36,-.1,o.spots)});
  m.legs=[];for(const s of[-1,1]){const u=part(m.body,s*.45,-.05,-.3,k=>k.box(.2,.2,.6,s*.05,0,-.15,o.c));const lo=part(u,0,0,-.4,k=>k.box(.24,.12,.5,s*.08,-.1,.1,o.c));m.legs.push([u,lo])}m.g.scale.setScalar(o.scale||1);return finish(m)}
function animFrog(m,dt,t,s){const j=s.hop||0;m.body.rotation.x=-j*.35;m.legs.forEach(([u,lo])=>{u.rotation.x=j*.9;lo.rotation.x=-j*.6});m.body.position.y=.4+Math.sin(j*PI)*1.1}

// ---------- dragão
function dragon(o){const m={kind:'drg',g:new THREE.Group(),o},c=o.c,c2=o.c2;
  m.body=part(m.g,0,2.4,0,k=>{k.box(3,2.5,6,0,0,0,c);k.box(2.2,.8,4,0,-1.2,.4,c2);for(let i=0;i<5;i++)k.box(.35,.6,.6,0,1.5,2-i*1.6,c2)});
  m.neck=part(m.body,0,.8,2.8,k=>{k.box(1.3,1.3,2.4,0,.4,1,c);k.box(.3,.5,.5,0,1.2,.6,c2)});
  m.head=part(m.neck,0,.8,2.2,k=>{k.box(1.8,1.3,2.2,0,0,.9,c);k.box(.3,.3,.06,-.6,.35,1.98,0xffcf5a).box(.3,.3,.06,.6,.35,1.98,0xffcf5a);k.box(.3,1,.3,-.6,.9,.2,0xeee0b0,{rx:-.4}).box(.3,1,.3,.6,.9,.2,0xeee0b0,{rx:-.4})});
  m.jaw=part(m.head,0,-.55,.2,k=>{k.box(1.5,.4,2,0,0,.95,c2);k.box(1.3,.16,.1,0,.25,1.9,0xf0e8d0)});
  m.tail=part(m.body,0,-.2,-3,k=>k.box(1.2,1.1,3.4,0,0,-1.6,c));m.tail2=part(m.tail,0,0,-3.3,k=>{k.box(.8,.8,3,0,0,-1.4,c);k.box(.9,.5,.9,0,.4,-2.8,c2)});
  m.wL=part(m.body,-1.4,1,0);m.wR=part(m.body,1.4,1,0);for(const[w,s]of[[m.wL,-1],[m.wR,1]]){part(w,0,0,0,k=>{k.box(3.6,.2,.4,s*1.8,0,1,c);k.box(3.6,.12,3.4,s*1.8,0,-.6,o.wc)});const w2=part(w,s*3.6,0,0,k=>{k.box(3.4,.18,.36,s*1.7,0,.9,c);k.box(3.4,.1,3,s*1.7,0,-.5,o.wc)});w.userData.w2=w2}
  m.legs=[];for(const[sx,sz]of[[-1,1],[1,1],[-1,-1],[1,-1]]){const u=part(m.body,sx*1.2,-1,sz*1.8,k=>k.box(.8,1.4,.9,0,-.6,0,c));m.legs.push(u)}
  m.g.scale.setScalar(o.scale||1);return finish(m)}
function animDragon(m,dt,t,s){const fly=s.fly,sp=fly?6:2.4,f=S(t*sp);m.wL.rotation.z=f*(fly?.7:.15)+(fly?0:.6);m.wR.rotation.z=-m.wL.rotation.z;m.wL.userData.w2.rotation.z=f*(fly?.5:.1)+(fly?0:-1.2);m.wR.userData.w2.rotation.z=-m.wL.userData.w2.rotation.z;
  const a=s.atk;let jaw=.05,nx=0;if(a){if(a.k=='breath'){jaw=.6;nx=.25}else if(a.k=='bite'){jaw=seq(a.p,0,.7,0,.35,.5);nx=seq(a.p,0,-.3,.3,.35,.5)}else if(a.k=='roar'){jaw=.8;nx=-.5}}
  sm(m.jaw.rotation,'x',jaw,dt,14);sm(m.neck.rotation,'x',nx+S(t*1.2)*.06,dt,8);m.tail.rotation.y=S(t*1.5)*.3;m.tail2.rotation.y=S(t*1.5-1)*.4;
  m.body.position.y=2.4+(fly?S(t*sp)*.3:0);m.legs.forEach((l,i)=>{l.rotation.x=fly?.8:S(m.A.ph+(i%2?PI:0))*.4*(s.v>.3?1:0)});m.A.ph+=dt*(s.v||0)}

function animate(m,dt,t,s){switch(m.kind){case 'hum':return animHum(m,dt,t,s);case 'quad':return animQuad(m,dt,t,s);case 'spider':return animSpider(m,dt,t,s);case 'bee':return animBee(m,dt,t,s);case 'slime':return animSlime(m,dt,t,s);case 'frog':return animFrog(m,dt,t,s);case 'drg':return animDragon(m,dt,t,s)}}

// ---------- catálogo de modelos (heróis, aldeões, animais e monstros)
const MDL={
  hero:()=>hum({skin:0xe0a878,hair:0x4a2a18,shirt:0x6d7684,pants:0x4a3a2e,boots:0x3a2a1e,cape:0xb3202a,capeE:0xd9a948,belt:0x5a3a20,shoulders:0x8a93a2}),
  lyra:()=>hum({skin:0xf0c49a,hair:0xf0c040,hairS:'long',shirt:0x3d7a2a,vest:0x2f5a24,pants:0x5a3a20,boots:0x4a3020,belt:0x5a3a20,gloves:0x5a3a20}),
  mirela:()=>hum({skin:0xf0c49a,hair:0x7a4a2a,hairS:'long',shirt:0x5a2a8a,pants:0x3a1a5a,robe:0x4a2276,cape:0x3a1a6a,hat:'wizard',hatC:0x3a1a6a,belt:0xd9a948}),
  borin:()=>hum({skin:0xe0a878,hair:0xc0602a,beard:0xc0602a,shirt:0x8a8f99,pants:0x4a3a2e,shoulders:0x9aa0aa,hat:'horn',belt:0x5a3a20,scale:.84,bulk:1.15}),
  bram:()=>hum({skin:0xd8b080,hair:0xe8e8e8,beard:0xf0f0f0,shirt:0x5a3a8a,pants:0x3a2a4a,robe:0x4a2a7a,hat:'wizard',hatC:0x4a2a7a}),
  helga:()=>hum({skin:0xe8b890,hair:0xb8402a,hairS:'long',shirt:0x7a5a3a,vest:0x3a3a3a,pants:0x4a3a2e,gloves:0x3a2a1a,bulk:1.1,arm:0xe8b890}),
  guard:()=>hum({skin:0xe0a878,hair:0x3a2a1a,shirt:0x2a4fa8,vest:0x9aa2ae,pants:0x3a3a4a,hat:'helm',hatC:0x9aa2ae,plume:0x2a4fa8,emblem:0xd9a948}),
  villager:(r)=>hum({skin:pick([0xe0a878,0xc8906a,0xf0c49a,0x9a6a4a],r),hair:pick([0x3a2a1a,0x7a4a2a,0xd8b04a,0x1a1a1a,0xa0a0a0],r),hairS:r()<.5?'long':'short',shirt:pick([0x8a3a2a,0x3a6a3a,0x6a5a3a,0x3a4a7a,0x9a7a4a],r),pants:pick([0x4a3a2e,0x3a3a4a,0x5a4a3a],r),robe:r()<.3?0x6a4a3a:0}),
  eremita:()=>hum({skin:0xc8a07a,hair:0x9a9a9a,beard:0xb0b0b0,shirt:0x5a5a3a,pants:0x3a3a2a,hat:'hood',hatC:0x4a4a2e,robe:0x4a4a2e}),
  bandit:()=>hum({skin:0xd8a070,shirt:0x6a4a3a,vest:0x3a2a1a,pants:0x3a3028,hat:'hood',hatC:0x5a2020,mask:0x2a1a1a,belt:0x2a1a1a}),
  bandarc:()=>hum({skin:0xd8a070,shirt:0x4a5a3a,pants:0x3a3028,hat:'hood',hatC:0x3a4a2a,mask:0x2a1a1a,belt:0x2a1a1a}),
  capitao:()=>hum({skin:0xc89060,hair:0x2a1a1a,beard:0x2a1a1a,shirt:0x7a2020,vest:0x2a1a1a,pants:0x2a2a2a,shoulders:0x5a5a5a,belt:0xd9a948,cape:0x1a1a1a,eyes:0xff3a2a,scale:1.45,bulk:1.15}),
  skeleton:()=>hum({skin:0xe6e1d3,shirt:0xcfc9b8,pants:0xd8d3c4,boots:0xcfc9b8,bones:0x8a8474,eyes:0x111111,mouth:0x222222,glowEyes:0x7dff6a,bulk:.8}),
  zombie:()=>hum({skin:0x7a9a5a,hair:0x3a3a2a,hairS:'short',shirt:0x5a5a6a,torn:0x7a9a5a,pants:0x3a3a4a,arm:0x7a9a5a,eyes:0xd0d0a0,mouth:0x3a1a1a,zombie:1,glowEyes:0xe8ff8a}),
  ghoul:()=>hum({skin:0x6a7a8a,shirt:0x3a3a4a,pants:0x2a2a3a,arm:0x6a7a8a,zombie:1,glowEyes:0x9ae4ff,bulk:.9,scale:1.05}),
  golem:()=>hum({skin:0x6a8a4a,shirt:0x5a7a3a,pants:0x4a6a2e,boots:0x3a5a2a,shoulders:0xf4a6c8,arm:0x6a8a4a,eyes:0x2a1a0a,glowEyes:0xffd84a,bulk:1.6,scale:1.3,noFace:1,branches:1,leaf:0xffc4dc}),
  fairy:()=>hum({skin:0xd8b0e0,hair:0x3a1a5a,hairS:'long',shirt:0x5a2a7a,pants:0x3a1a5a,robe:0x4a1a6a,wings:0xc07aff,glowEyes:0xff6aff,scale:.62}),
  treant:()=>hum({skin:0x6a4a2a,shirt:0x5a3a20,pants:0x4a3018,boots:0x3a2410,arm:0x5a3a20,shoulders:0x3d7a2e,noFace:1,glowEyes:0xff6a1a,branches:1,leaf:0x3a6a2a,bulk:1.5,scale:2.3}),
  witch:()=>hum({skin:0x9ab07a,hair:0x1a1a1a,hairS:'long',shirt:0x2a1a3a,pants:0x1a1a2a,robe:0x2a1a3a,hat:'witch',hatC:0x1a1a2a,cape:0x3a1a4a,glowEyes:0x9aff7a,scale:1.25}),
  imp:()=>hum({skin:0xc0402a,shirt:0xa0301a,pants:0x6a1a10,arm:0xc0402a,glowEyes:0xffd84a,scale:.75,hat:'horn',hatC:0xc0402a}),
  boar:()=>quad({c:0x6a4a32,mane:0x4a3020,hc:0x5a3a28,tusk:1,ears:1,len:1.4,h:.55,wid:.7,run:6}),
  wolf:()=>quad({c:0x77797f,mane:0x8a8c90,hc:0x6a6c72,ears:1,teeth:1,len:1.5,h:.75,wid:.55,tl:.8,run:7}),
  dwolf:()=>quad({c:0x3a3048,mane:0x2a2236,hc:0x2e2640,ears:1,teeth:1,eye:0xff3a2a,len:1.6,h:.8,wid:.58,tl:.9,run:7.5,back:0x6a3a9a}),
  deer:()=>quad({c:0x9a6a3a,c2:0xe8d8c0,ears:1,antler:1,len:1.5,h:1.05,wid:.55,hl:.6,grazer:1,run:7,tl:.25,tc:0xffffff,tailUp:.4}),
  sheep:()=>quad({c:0x3a3a3a,wool:0xf0f0ea,hc:0x2a2a2a,len:1.1,h:.45,wid:.6,grazer:1,run:4,tl:.2}),
  cow:()=>quad({c:0xf0f0ea,spots:0x2a2a2a,hc:0xf0f0ea,snout:0xe8a0a0,horn:1,ears:1,len:1.8,h:.75,wid:.85,grazer:1,run:3.5,tl:.7,tw:.1}),
  fox:()=>quad({c:0xe0702a,c2:0xffffff,ears:1,len:1,h:.42,wid:.4,tl:.8,tw:.28,tc:0xe0702a,run:7}),
  rabbit:()=>quad({c:0xc8b8a0,ears:1,len:.55,h:.22,wid:.35,hl:.3,tl:.1,tc:0xffffff,run:6,scale:.9}),
  croc:()=>quad({c:0x4a6a3a,c2:0x8a9a6a,back:0x3a5a2a,len:2.4,h:.32,wid:.85,bh:.45,hl:1.1,jc:0x5a7a4a,teeth:1,tl:2,tw:.4,tailUp:0,run:4.5,eye:0xd8c040}),
  spider:()=>spider({c:0x2a1f38,c2:0x1f1830,mark:0xc02a2a}),
  bee:()=>bee({c:0xe8b020}),queen:()=>bee({c:0xd04a8a,scale:2.4}),
  frog:()=>frog({c:0x4a8a3a,spots:0x2a5a2a}),pfrog:()=>frog({c:0x7a3aa8,c2:0xe8c040,spots:0xffd84a,scale:1.2}),
  slime:()=>slime({c:0x4a8a3a,c2:0x6aaa4a,core:0x2a5a2a}),lslime:()=>slime({c:0xe8501a,c2:0xffa040,core:0xffc04a,glow:0xff8a2a}),
  ignarok:()=>dragon({c:0xb02a22,c2:0xe0a030,wc:0x8a2a3a,scale:1.15})};
const ANIMK={hum:1,quad:1,spider:1,bee:1,slime:1,frog:1,drg:1};
