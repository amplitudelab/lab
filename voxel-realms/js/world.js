'use strict';
/* =============================================================================
   VOXEL REALMS · mundo
   regiões (biomas), relevo em voxels, rio, estradas, pontes, estruturas,
   vegetação e carregamento de pedaços (chunks) conforme o jogador anda
   ============================================================================= */
const CS=32,WMAX=214; // tamanho do pedaço e limite andável do mundo (±)
const REG=[
  {id:'vila',n:'Vila Pedraverde',lv:1,c:[0,0],k:2.0,top:[0x6aa84a,0x62a044,0x72ae50],side:0x7a5a3a,map:'#86b85e',amb:'Pedraverde, a última vila livre de Aldoria.'},
  {id:'plan',n:'Planície Dourada',lv:2,c:[10,150],k:1,top:[0xa6bc4c,0xb2c656,0x9ab246,0xbcc660],side:0x8a6a3a,map:'#c0c460',amb:'Trigais e moinhos — e bandidos nas estradas.'},
  {id:'flor',n:'Campos de Lírio',lv:5,c:[165,10],k:1,top:[0x74c656,0x6abc4e,0x80cc60],side:0x7a5a3a,map:'#94d66e',amb:'Flores sem fim. Algo corrompeu as colmeias.'},
  {id:'mata',n:'Floresta Ancestral',lv:8,c:[-10,-158],k:1,top:[0x3f8a38,0x357a30,0x478f3c],side:0x5a4428,map:'#3d7636',amb:'Árvores mais velhas que o reino guardam segredos.'},
  {id:'mang',n:'Mangue Sombrio',lv:11,c:[-168,25],k:1,top:[0x5f6e3a,0x55623a,0x687840],side:0x4a3a28,map:'#58683e',amb:'Lodo, névoa e a cabana da bruxa.'},
  {id:'cald',n:'Caldeira de Brasas',lv:14,c:[155,-162],k:1.15,top:[0x4a3a34,0x3e302c,0x55443c],side:0x2e2420,map:'#6a3a2e',amb:'Onde Ignarok dorme sob a rocha fundida.'}];
const RI={};REG.forEach((r,i)=>RI[r.id]=i);
// pontos de interesse com nome próprio dentro das regiões
const POI=[{n:'Cemitério Esquecido',x:-112,z:-96,r:24},{n:'Acampamento dos Bandidos',x:-38,z:178,r:18},{n:'Moinho de Hollow',x:46,z:122,r:14},{n:'Colmeia Real',x:192,z:46,r:18},
  {n:'Templo de Lírio',x:138,z:-30,r:14},{n:'Torre Arruinada',x:-48,z:-132,r:14},{n:'Bosque do Ancião',x:12,z:-190,r:20},{n:'Cabana da Bruxa',x:-188,z:52,r:16},{n:'Toca do Eremita',x:-138,z:-12,r:10},{n:'Covil de Ignarok',x:152,z:-178,r:24}];

// ---------- relevo
const RW=new Float32Array(REG.length),_rd=new Float32Array(REG.length);
function regW(x,z,o){const wx=x+(fbm(x*.008+11,z*.008,3)-.5)*90,wz=z+(fbm(x*.008,z*.008+5,3)-.5)*90;let mn=1e9;
  for(let i=0;i<REG.length;i++){const r=REG[i];_rd[i]=hy(wx-r.c[0],wz-r.c[1])*r.k;if(_rd[i]<mn)mn=_rd[i]}
  let s=0;for(let i=0;i<REG.length;i++){const w=Math.exp(-(_rd[i]-mn)/9);o[i]=w;s+=w}for(let i=0;i<REG.length;i++)o[i]/=s;return o}
function regionAt(x,z){regW(x,z,RW);let b=0;for(let i=1;i<REG.length;i++)if(RW[i]>RW[b])b=i;return b}
function hReg(i,x,z){switch(i){
  case 0:return 1.3+(fbm(x*.05,z*.05,2)-.5)*1.2;
  case 1:return 1.6+(fbm(x*.018,z*.018,3)-.5)*8;
  case 2:return 2+(fbm(x*.028,z*.028,3)-.5)*10;
  case 3:return 3+(fbm(x*.03,z*.03,4)-.5)*14;
  case 4:return .15+(fbm(x*.05,z*.05,3)-.5)*3.4;
  default:return 2.6+(fbm(x*.035,z*.035,4)-.5)*16+(fbm(x*.1,z*.1,2)>.64?3:0)}}
const riverZ=x=>48+30*S(x*.017)+12*S(x*.041+1),riverD=(x,z)=>Math.abs(z-riverZ(x));
// estradas: da vila até cada região, e da região das flores até a caldeira
const ROADS=[[[0,0],[10,150]],[[0,0],[165,10]],[[0,0],[-10,-158]],[[0,0],[-168,25]],[[165,10],[155,-162]],[[-10,-158],[-112,-96]],[[10,150],[-38,178]]];
function segD(x,z,a,b){const dx=b[0]-a[0],dz=b[1]-a[1],t=cl(((x-a[0])*dx+(z-a[1])*dz)/(dx*dx+dz*dz),0,1);return hy(x-a[0]-dx*t,z-a[1]-dz*t)}
function roadD(x,z){let m=1e9;for(const r of ROADS){const d=segD(x,z,r[0],r[1]);if(d<m)m=d}return m+(vnoise(x*.3,z*.3)-.5)*1.2}
const FZ=[]; // zonas aplainadas para estruturas {x,z,r,h}
function rawH0(x,z){regW(x,z,RW);let h=0,s=0;for(let i=0;i<REG.length;i++)if(RW[i]>.01){h+=RW[i]*hReg(i,x,z);s+=RW[i]}h/=s;
  const rv=riverD(x,z);if(rv<11)h=Math.min(h,lerp(-1.7,h,sstep(2.4,10,rv)));
  const e=Math.max(Math.abs(x),Math.abs(z));if(e>200)h+=(e-200)*1.35*(.55+fbm(x*.05,z*.05,2)*.9);return h}
function rawH(x,z){let h=rawH0(x,z);for(const f of FZ){const dx=x-f.x,dz=z-f.z;if(Math.abs(dx)<f.r&&Math.abs(dz)<f.r){const d=hy(dx,dz);if(d<f.r)h=lerp(h,f.h,1-sstep(f.r*.55,f.r,d))}}return h}
const qh=h=>Math.round(h*2)/2,cellH=(ix,iz)=>qh(rawH(ix+.5,iz+.5));
function flat(x,z,r,h){FZ.push({x,z,r,h:h==null?Math.max(.8,qh(rawH0(x,z))):h})}

// ---------- pontes onde as estradas cruzam o rio
const BRIDGES=[];
for(const r of ROADS){const[a,b]=r,L=hy(b[0]-a[0],b[1]-a[1]);let s0=-1,s1=-1;for(let t=0;t<=L;t+=.5){const x=a[0]+(b[0]-a[0])*t/L,z=a[1]+(b[1]-a[1])*t/L;if(riverD(x,z)<8.5){if(s0<0)s0=t;s1=t}}
  if(s0>=0){const tm=(s0+s1)/2,ux=(b[0]-a[0])/L,uz=(b[1]-a[1])/L;BRIDGES.push({x:a[0]+ux*tm,z:a[1]+uz*tm,ux,uz,len:s1-s0+6,w:2.4,y:1.2})}}
function onBridge(x,z){for(const b of BRIDGES){const dx=x-b.x,dz=z-b.z,al=dx*b.ux+dz*b.uz,ac=-dx*b.uz+dz*b.ux;if(Math.abs(al)<b.len/2&&Math.abs(ac)<b.w)return b}return null}

// ---------- pedaços (chunks)
const CHK=new Map(),BQ=[];
const ckey=(cx,cz)=>cx+','+cz;
function chunkHeights(cx,cz){const h=new Float32Array(34*34),x0=cx*CS-1,z0=cz*CS-1;for(let j=0;j<34;j++)for(let i=0;i<34;i++)h[i+j*34]=cellH(x0+i,z0+j);return h}
function groundAt(x,z){const b=onBridge(x,z);const ix=Math.floor(x),iz=Math.floor(z),cx=Math.floor(ix/CS),cz=Math.floor(iz/CS),c=CHK.get(ckey(cx,cz));
  const h=c?c.h[(ix-cx*CS+1)+(iz-cz*CS+1)*34]:cellH(ix,iz);return b?Math.max(h,b.y):h}
// pode ficar de pé aqui? (água funda e penhascos bloqueiam)
function walkable(x,z,fromY){if(Math.abs(x)>WMAX||Math.abs(z)>WMAX)return false;if(onBridge(x,z))return true;const h=groundAt(x,z);return h>-.8&&(fromY==null||h-fromY<1.3)}
const STRC=[]; // colisores fixos das estruturas [x,z,r]
function collide(o,r){const cx=Math.floor(o.x/CS),cz=Math.floor(o.z/CS);
  for(let dz=-1;dz<=1;dz++)for(let dx=-1;dx<=1;dx++){const c=CHK.get(ckey(cx+dx,cz+dz));if(c)pushOut(o,r,c.col)}pushOut(o,r,STRC)}
function pushOut(o,r,L){for(const k of L){const dx=o.x-k[0],dz=o.z-k[1];if(Math.abs(dx)>k[2]+r||Math.abs(dz)>k[2]+r)continue;const d=hy(dx,dz),m=k[2]+r;if(d<m&&d>1e-4){o.x=k[0]+dx/d*m;o.z=k[1]+dz/d*m}}}

// ---------- ajudante de estruturas: caixas em coordenadas locais (girado e assentado no chão)
class TB{constructor(k,e,f,x,z,ry,y){this.k=k;this.e=e;this.f=f;this.x=x;this.z=z;this.ry=ry||0;this.y=y==null?groundAt(x,z):y;this.c=C(this.ry);this.s=S(this.ry)}
  w(lx,lz){return[this.x+lx*this.c+lz*this.s,this.z-lx*this.s+lz*this.c]}
  b(w,h,d,lx,ly,lz,col,o,tgt){const[x,z]=this.w(lx,lz),oo=Object.assign({},o||{});oo.ry=(oo.ry||0)+this.ry;(tgt||this.k).box(w,h,d,x,this.y+ly,z,col,oo);return this}
  e_(w,h,d,lx,ly,lz,col,o){return this.b(w,h,d,lx,ly,lz,col,o,this.e)}
  f_(w,h,d,lx,ly,lz,col,o){return this.b(w,h,d,lx,ly,lz,col,o,this.f)}
  col(lx,lz,r){if(CUR_S&&CUR_S.cd)return;const[x,z]=this.w(lx,lz);STRC.push([x,z,r])}}
let CUR_S=null; // estrutura sendo construída (colisores e lampiões só são registrados na primeira vez)
const STR=[]; // {x,z,fn(k,e,f)} construídas dentro do pedaço que contém o centro
const DYN=[]; // objetos animados das estruturas (pás do moinho, cristais)
function addStr(x,z,r,fn,h){if(r)flat(x,z,r,h);STR.push({x,z,fn,cx:Math.floor(x/CS),cz:Math.floor(z/CS)})}

// ---------- vegetação e pedras (k: sólido, f: folhagem com vento, e: emissivo)
function oak(k,f,x,y,z,s,leaf){leaf=leaf||[0x245f2b,0x2f7835,0x3d8b3d,0x4f9b45];k.box(.9*s,3.8*s,.9*s,x,y+1.9*s,z,0x51351c,{g:1});k.box(1.6*s,.4*s,1.6*s,x,y+.2,z,0x5a3b20,{g:1});
  for(const[bx,bz,by]of[[-.7,.2,3],[.65,.25,3.35],[-.45,.65,4.2]])k.box(.28*s,1.6*s,.28*s,x+bx*s,y+by*s,z+bz*s,0x5a3b20);
  for(let i=0;i<7;i++){const a=i/7*TAU+hash2(x*7+i,z)*.4,r=(1.4+hash2(i,x*3+z)*1.2)*s;f.box((1.9+hash2(x+i,z*2)*1.1)*s,(1.2+hash2(z+i,x)*.8)*s,(1.9+hash2(i*3,z+x)*1.1)*s,x+C(a)*r*.55,y+(4+hash2(i,z*5)*2)*s,z+S(a)*r*.55,leaf[i%leaf.length])}
  f.box(2.1*s,1.1*s,2.1*s,x,y+4.8*s,z,leaf[2]||leaf[0])}
function pine(k,f,x,y,z,s,snow){k.box(.6*s,2*s,.6*s,x,y+1*s,z,0x4a3018,{g:1});for(let i=0;i<4;i++){const w=(3.4-i*.75)*s;f.box(w,1.2*s,w,x,y+(1.8+i*1.15)*s,z,i%2?0x2a5a32:0x23502c,{ry:i*.4})}
  f.box(.5*s,1*s,.5*s,x,y+6.6*s,z,0x2a5a32);if(snow)k.box(1.4*s,.25*s,1.4*s,x,y+6.1*s,z,0xf2f6fa)}
function birch(k,f,x,y,z,s){k.box(.6*s,4.4*s,.6*s,x,y+2.2*s,z,0xe8e4d8,{g:1});for(let i=0;i<4;i++)k.box(.62*s,.12*s,.3*s,x,y+(.8+i*.9)*s,z+.16*s,0x2a2a2a);
  for(let i=0;i<5;i++){const a=i/5*TAU;f.box(1.6*s,1.4*s,1.6*s,x+C(a)*.9*s,y+(4.2+(i%2)*.7)*s,z+S(a)*.9*s,i%2?0x8ccc5a:0x9ad664)}f.box(1.8*s,1.2*s,1.8*s,x,y+5.2*s,z,0xa6dc70)}
function blossom(k,f,x,y,z,s){k.box(.8*s,3*s,.8*s,x,y+1.5*s,z,0x5a3a2a,{g:1});k.box(.3*s,1.4*s,.3*s,x+.5*s,y+3*s,z,0x5a3a2a,{rz:-.5});k.box(.3*s,1.4*s,.3*s,x-.5*s,y+3*s,z,0x5a3a2a,{rz:.5});
  const P=[0xf4a6c8,0xffc4dc,0xe890b8,0xffd8e8];for(let i=0;i<8;i++){const a=i/8*TAU;f.box(1.8*s,1.1*s,1.8*s,x+C(a)*1.5*s,y+(3.4+(i%3)*.5)*s,z+S(a)*1.5*s,P[i%4])}f.box(2.4*s,1.3*s,2.4*s,x,y+4.4*s,z,P[1])}
function mangrove(k,f,x,y,z,s){for(let i=0;i<6;i++){const a=i/6*TAU+.3;k.box(.22*s,2.2*s,.22*s,x+C(a)*.9*s,y+.9*s,z+S(a)*.9*s,0x4a3a26,{rx:S(a)*.45,rz:-C(a)*.45})}
  k.box(.7*s,3*s,.7*s,x,y+3.2*s,z,0x4a3a26);for(let i=0;i<6;i++){const a=i/6*TAU;f.box(2.6*s,.9*s,2.6*s,x+C(a)*1.7*s,y+4.8*s+(i%2)*.3,z+S(a)*1.7*s,i%2?0x3a5a2a:0x4a6a30)}f.box(2.8*s,1*s,2.8*s,x,y+5.3*s,z,0x557538);
  for(let i=0;i<3;i++)f.box(.12,1.4,.12,x+(hash2(x+i,z)-.5)*3*s,y+3.9*s,z+(hash2(z+i,x)-.5)*3*s,0x6a7a4a)}
function deadTree(k,x,y,z,s){k.box(.7*s,4*s,.7*s,x,y+2*s,z,0x2a1e1a,{g:1});k.box(.25*s,1.8*s,.25*s,x+.6*s,y+3.4*s,z,0x2a1e1a,{rz:-.7});k.box(.25*s,1.6*s,.25*s,x-.5*s,y+2.8*s,z+.2,0x2a1e1a,{rz:.8});k.box(.2*s,1.2*s,.2*s,x,y+4.4*s,z+.4*s,0x2a1e1a,{rx:.6})}
function rock(k,x,y,z,s,col,moss){k.box(1.3*s,.9*s,1.1*s,x,y+.4*s,z,col,{g:1,ry:x});k.box(.8*s,.6*s,.8*s,x+.3*s,y+.9*s,z-.2*s,col,{ry:z});if(moss)k.box(1.1*s,.15*s,.9*s,x,y+.92*s,z,0x4f8a3a)}
const FLC=[0xff5a7a,0xffd84a,0xb07aff,0xffffff,0xff8a3a,0x6ab0ff,0xff9ad0];
function flower(f,x,y,z,c,t){f.box(.1,.38*t,.1,x,y+.19*t,z,0x3d8b3d).box(.26,.2,.26,x,y+.42*t,z,c)}
function grass(f,x,y,z,c){f.box(.1,.55,.1,x,y+.27,z,c).box(.1,.42,.1,x+.18,y+.21,z+.1,c).box(.1,.38,.1,x-.13,y+.19,z-.14,c)}

// ---------- construção de um pedaço (gerador: trabalha em fatias para não travar o quadro)
function decorate(ch,k,f,e,lod){const x0=ch.cx*CS,z0=ch.cz*CS,r=rng(ch.cx*73856093^ch.cz*19349663^0x5bd1e995),col=ch.col;
  const nearStr=(x,z)=>{for(const s of FZ)if(Math.abs(x-s.x)<s.r*.8&&Math.abs(z-s.z)<s.r*.8&&hy(x-s.x,z-s.z)<s.r*.8)return true;return false};
  const spot=(minH)=>{const x=x0+r()*CS,z=z0+r()*CS,ix=Math.floor(x)-x0,iz=Math.floor(z)-z0,h=ch.h[(ix+1)+(iz+1)*34];if(h<(minH==null?.25:minH)||roadD(x,z)<2.4||nearStr(x,z)||onBridge(x,z))return null;regW(x,z,RW);let b=0;for(let i=1;i<REG.length;i++)if(RW[i]>RW[b])b=i;return{x,z,h,b}};
  const N=[[3,0,1,40,20],[4,0,4,70,16],[5,0,2,40,150],[18,0,4,40,14],[10,0,3,10,6],[5,0,9,0,0]]; // árvores, -, pedras, grama, flores por região
  const db=regionAt(x0+CS/2,z0+CS/2);
  for(let i=0;i<N[db][0]*1.5;i++){const p=spot(-.6);if(!p)continue;const s=.85+r()*.6;
    if(p.b==0){if(p.h<.3)continue;oak(k,f,p.x,p.h,p.z,s);col.push([p.x,p.z,.9*s])}
    else if(p.b==1){if(p.h<.3)continue;oak(k,f,p.x,p.h,p.z,s,[0x3a7a30,0x4a8a38,0x5a9a40]);col.push([p.x,p.z,.9*s])}
    else if(p.b==2){if(p.h<.3)continue;r()<.6?blossom(k,f,p.x,p.h,p.z,s):birch(k,f,p.x,p.h,p.z,s);col.push([p.x,p.z,.8*s])}
    else if(p.b==3){if(p.h<.3)continue;const big=r()<.15?1.6:1;r()<.5?pine(k,f,p.x,p.h,p.z,s*big):oak(k,f,p.x,p.h,p.z,s*big);col.push([p.x,p.z,.9*s*big])}
    else if(p.b==4){if(p.h<-.7)continue;mangrove(k,f,p.x,Math.max(p.h,-.3),p.z,s);col.push([p.x,p.z,1.1*s])}
    else{if(p.h<.3)continue;deadTree(k,p.x,p.h,p.z,s);col.push([p.x,p.z,.6*s])}}
  // pedras
  for(let i=0;i<N[db][2]+1;i++){const p=spot();if(!p)continue;const s=.7+r()*1.1;rock(k,p.x,p.h,p.z,s,p.b==5?0x2a2224:p.b==4?0x5a5a4a:0x8a8a84,p.b==3||p.b==4);if(s>1.1)col.push([p.x,p.z,.7*s]);
    if(p.b==5&&r()<.6){k.box(.5,2.5+r()*2,.5,p.x+1.4,p.h+1.2,p.z,0x1a1418,{rz:.3,ry:r()*3});}}
  if(lod>1)return;
  // detalhes pequenos (só perto): grama, flores, cogumelos, juncos, trigo, vitórias-régias
  for(let i=0;i<160;i++){const p=spot(-.5);if(!p)continue;const n=N[p.b],t=r();
    if(p.b==4){if(p.h<-.05){if(t<.35){k.box(.9,.04,.9,p.x,.03,p.z,0x4a8a3a,{ry:r()*3});if(r()<.25)f.box(.22,.16,.22,p.x,.1,p.z,0xff9ad0)}}
      else if(t<.5){f.box(.08,1.6,.08,p.x,p.h+.8,p.z,0x6a8a3a).box(.14,.4,.14,p.x,p.h+1.5,p.z,0x5a3a20).box(.08,1.3,.08,p.x+.2,p.h+.65,p.z+.1,0x7a9a4a)}else if(t<.6){k.box(.14,.3,.14,p.x,p.h+.15,p.z,0xe8e0d0).box(.4,.16,.4,p.x,p.h+.36,p.z,0x9a6a3a)}continue}
    if(p.h<.3)continue;
    if(p.b==2){if(t<.75)flower(f,p.x,p.h,p.z,FLC[(r()*FLC.length)|0],1+r()*.4);else if(t<.82){f.box(.12,1.8,.12,p.x,p.h+.9,p.z,0x4a8a3a).box(.6,.6,.18,p.x,p.h+1.9,p.z,0xffcc22).box(.25,.25,.2,p.x,p.h+1.9,p.z+.05,0x5a3a1a)}else grass(f,p.x,p.h,p.z,0x6ac050);continue}
    if(p.b==1&&t<.22){for(let a=0;a<6;a++){const xx=p.x+(a%3)*.35,zz=p.z+((a/3)|0)*.35;f.box(.08,1.1,.08,xx,p.h+.55,zz,0xd8b84a).box(.12,.3,.12,xx,p.h+1.15,zz,0xe8c860)}continue}
    if(p.b==3&&t<.12){k.box(.18,.4,.18,p.x,p.h+.2,p.z,0xeee8d8).box(.55,.22,.55,p.x,p.h+.48,p.z,r()<.6?0xd03a2a:0x9a6a3a);continue}
    if(p.b==3&&t<.3){for(let a=0;a<4;a++)f.box(.5,.08,.16,p.x+C(a*1.6)*.25,p.h+.3,p.z+S(a*1.6)*.25,0x3a7a2a,{ry:a*1.6,rz:.4});continue}
    if(p.b==5){if(t<.2)k.box(.6,.12,.14,p.x,p.h+.07,p.z,0xe8e0d0,{ry:r()*3});continue}
    if(i>n[3]+n[4])continue;
    if(t<n[4]/(n[3]+n[4]+1))flower(f,p.x,p.h,p.z,FLC[(r()*FLC.length)|0],1);else grass(f,p.x,p.h,p.z,[0x5aa94a,0x6cb44f,0x4f9b45][(r()*3)|0])}}
function* genChunk(ch){const lod=ch.lod,x0=ch.cx*CS,z0=ch.cz*CS,H=ch.h,k=new Bake(),f=new Bake(),e=new Bake(),n=CS/lod;
  const hAt=(i,j)=>{if(lod==1)return H[(i+1)+(j+1)*34];const ii=i*2,jj=j*2;let m=-99;for(let a=0;a<2;a++)for(let b=0;b<2;b++){const v=H[cl(ii+a+1,0,33)+cl(jj+b+1,0,33)*34];if(v>m)m=v}return m};
  for(let j=0;j<n;j++){for(let i=0;i<n;i++){const ix=x0+i*lod,iz=z0+j*lod,h=hAt(i,j),cx=ix+lod*.5,cz=iz+lod*.5;regW(cx,cz,RW);
      let b=0,acc=0;const rr=hash2(ix*3+1,iz*5+2);for(let q=0;q<REG.length;q++){acc+=RW[q];if(rr<=acc){b=q;break}}
      const g=REG[b],v=hash2(ix,iz);let c=g.top[(v*g.top.length)|0],sc=g.side,emi=0;
      const e2=Math.max(Math.abs(cx),Math.abs(cz));
      if(h<-.25)c=b==4?0x3e3626:h<-1?0x8a7a58:0xb0a070;else if(h<.6&&b!=4&&b!=5)c=v<.5?0xd8c890:0xcfbf86;
      else if(e2>205){c=h>13?0xf2f4f8:v<.5?0x7a7a76:0x6a6a66;sc=0x5a5a56}
      else if(roadD(cx,cz)<1.7){c=v<.5?0xa08458:0x94784e;sc=0x7a5a3a}
      else if(b==0&&hy(cx,cz)<13){c=[0x9a9a92,0x8a8a84,0xa8a8a0][(v*3)|0];sc=0x7a7a74}
      else if(b==5&&RW[5]>.6&&fbm(cx*.07,cz*.07,2)>.63){emi=1;c=v<.3?0xffd84a:v<.7?0xff7a1a:0xff5a10}
      const x1=ix+lod,z1=iz+lod,sh=.94+v*.1;
      if(emi){e.quad([ix,h-.25,z1],[x1,h-.25,z1],[x1,h-.25,iz],[ix,h-.25,iz],[0,1,0],c,null,lod,lod);ch.lava.push([cx,cz])}
      else k.quad([ix,h,z1],[x1,h,z1],[x1,h,iz],[ix,h,iz],[0,1,0],c,[sh,sh,sh,sh],lod,lod);
      // laterais onde o vizinho é mais baixo (oclusão nas bases)
      const sides=[[1,0],[-1,0],[0,1],[0,-1]];for(const[dx,dz]of sides){const nh=hAt(i+dx,j+dz);if(nh>=h)continue;const lo=Math.max(nh,-2.5),H2=h-lo,sc2=H2>2.2?0x6a6a64:sc,top=.9,bot=H2>1?.55:.7;
        if(dx==1)k.quad([x1,lo,z1],[x1,lo,iz],[x1,h,iz],[x1,h,z1],[1,0,0],sc2,[bot,bot,top,top],lod,H2);
        else if(dx==-1)k.quad([ix,lo,iz],[ix,lo,z1],[ix,h,z1],[ix,h,iz],[-1,0,0],sc2,[bot*.92,bot*.92,top*.92,top*.92],lod,H2);
        else if(dz==1)k.quad([ix,lo,z1],[x1,lo,z1],[x1,h,z1],[ix,h,z1],[0,0,1],sc2,[bot*.96,bot*.96,top*.96,top*.96],lod,H2);
        else k.quad([x1,lo,iz],[ix,lo,iz],[ix,h,iz],[x1,h,iz],[0,0,-1],sc2,[bot*.88,bot*.88,top*.88,top*.88],lod,H2)}}
    if(j%8==7)yield 0}
  decorate(ch,k,f,e,lod);yield 0;
  for(const s of STR)if(s.cx==ch.cx&&s.cz==ch.cz){CUR_S=s;s.fn(k,e,f);s.cd=1;CUR_S=null}
  for(const b of BRIDGES)if(Math.floor(b.x/CS)==ch.cx&&Math.floor(b.z/CS)==ch.cz)bridgeMesh(k,b);
  const ms=[k.mesh(MV),f.mesh(MW),e.mesh(ME)];for(let i=0;i<3;i++){const m=ms[i];if(!m)continue;m.matrixAutoUpdate=false;m.receiveShadow=i<2;m.castShadow=i<2&&lod==1;ch.ms.push(m)}}
function bridgeMesh(k,b){const a=Math.atan2(b.ux,b.uz),n=Math.ceil(b.len/.7);for(let i=0;i<n;i++){const t=-b.len/2+i*.7+.35,x=b.x+b.ux*t,z=b.z+b.uz*t;k.box(b.w*2,.22,.62,x,b.y-.11,z,i%2?0x8a5a30:0x7a4e2a,{ry:a})}
  for(const sd of[-1,1]){const ox=-b.uz*b.w*sd,oz=b.ux*b.w*sd;k.box(.2,.2,b.len,b.x+ox,b.y+.9,b.z+oz,0x5a3a20,{ry:a});for(let t=-b.len/2;t<=b.len/2;t+=2.2){k.box(.24,1,.24,b.x+b.ux*t+ox,b.y+.4,b.z+b.uz*t+oz,0x5a3a20);k.box(.4,3,.4,b.x+b.ux*t+ox*.9,b.y-1.6,b.z+b.uz*t+oz*.9,0x4a3020)}}}

function chunkNew(cx,cz,lod){const c={cx,cz,lod,h:chunkHeights(cx,cz),ms:[],col:[],lava:[],gen:null,ready:false,old:null};c.gen=genChunk(c);return c}
function chunkDrop(c){for(const m of c.ms){sc.remove(m);m.geometry.dispose()}c.ms.length=0}
let lastCX=1e9,lastCZ=1e9;
function worldUpd(px,pz,budget){const cx=Math.floor(px/CS),cz=Math.floor(pz/CS),V=GFX.view;
  if(cx!=lastCX||cz!=lastCZ){lastCX=cx;lastCZ=cz;
    for(let dz=-V;dz<=V;dz++)for(let dx=-V;dx<=V;dx++){const ring=Math.max(Math.abs(dx),Math.abs(dz)),lod=ring>=2?2:1,k=ckey(cx+dx,cz+dz),c=CHK.get(k);
      if(!c){const n=chunkNew(cx+dx,cz+dz,lod);CHK.set(k,n);BQ.push(n)}else if(c.lod!=lod&&!c.gen){const n=chunkNew(cx+dx,cz+dz,lod);n.old=c;n.spawned=c.spawned;CHK.set(k,n);BQ.push(n)}}
    for(const[k,c]of CHK){if(Math.max(Math.abs(c.cx-cx),Math.abs(c.cz-cz))>V+1){chunkDrop(c);if(c.old)chunkDrop(c.old);CHK.delete(k);onChunkDrop(c)}}
    BQ.sort((a,b)=>hy(a.cx-cx,a.cz-cz)-hy(b.cx-cx,b.cz-cz))}
  const t0=performance.now();
  while(BQ.length&&performance.now()-t0<budget){const c=BQ[0];if(CHK.get(ckey(c.cx,c.cz))!==c){BQ.shift();continue}
    const r=c.gen.next();if(r.done){BQ.shift();c.gen=null;c.ready=true;if(c.old){chunkDrop(c.old);c.old=null}for(const m of c.ms)sc.add(m);if(!c.spawned){c.spawned=true;onChunkReady(c)}}}}
// carrega tudo ao redor de uma vez (início do jogo e teleporte)
function worldLoadAll(px,pz){lastCX=1e9;worldUpd(px,pz,0);while(BQ.length)worldUpd(px,pz,1e9)}

// ---------- água (plano que acompanha o jogador) com reflexo do céu e brilhos
const WTEX=(()=>{const c=document.createElement('canvas');c.width=c.height=64;const x=c.getContext('2d');x.fillStyle='#2f8fd5';x.fillRect(0,0,64,64);for(let i=0;i<46;i++){x.fillStyle=R()<.5?'#6cc3f2':'#2478b8';x.fillRect(R()*64,R()*64,4+R()*10,2)}const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;return t})();
const WMAT=new THREE.ShaderMaterial({transparent:true,depthWrite:false,fog:true,uniforms:THREE.UniformsUtils.merge([THREE.UniformsLib.fog,{map:{value:null},uT:{value:0},sky:{value:new THREE.Color()},sunC:{value:new THREE.Color()},sd:{value:new V3()},murk:{value:0},nf:{value:0}}]),
  vertexShader:'#include <fog_pars_vertex>\nvarying vec3 vW;void main(){vec4 w=modelMatrix*vec4(position,1.);vW=w.xyz;vec4 mvPosition=viewMatrix*w;gl_Position=projectionMatrix*mvPosition;\n#include <fog_vertex>\n}',
  fragmentShader:'#include <fog_pars_fragment>\nuniform sampler2D map;uniform float uT,murk,nf;uniform vec3 sky,sunC,sd;varying vec3 vW;void main(){vec2 u=vW.xz*.12;vec3 a=texture2D(map,u+vec2(uT*.03,uT*.02)).rgb,b=texture2D(map,u*vec2(.7,1.3)+vec2(-uT*.02,uT*.035)).rgb,w=mix(a,b,.5)*vec3(.7,.85,1.05);w=mix(w,vec3(.25,.3,.12),murk);vec3 V=normalize(cameraPosition-vW);float fr=.25+.6*pow(1.-max(V.y,0.),2.);vec3 R=reflect(-V,vec3(0.,1.,0.));float sp=max(dot(R,sd),0.);vec3 c=mix(w,sky,fr*(1.-murk*.5))+sunC*pow(sp,24.)*.6;float n=fract(sin(dot(floor(vW.xz*5.)+floor(uT*3.),vec2(12.9898,78.233)))*43758.5453);c+=sunC*step(.976,n)*(.3+pow(sp,3.)*1.2)*(1.-nf*.6);c*=1.-nf*.55;gl_FragColor=vec4(c,.86);\n#include <fog_fragment>\n}'});
WMAT.uniforms.map.value=WTEX;
const WATER=new THREE.Mesh(new THREE.PlaneGeometry(400,400),WMAT);WATER.rotation.x=-PI/2;WATER.position.y=-.2;WATER.renderOrder=1;sc.add(WATER);
function waterUpd(px,pz,t){WATER.position.x=Math.round(px/8)*8;WATER.position.z=Math.round(pz/8)*8;const u=WMAT.uniforms;u.uT.value=t;u.sky.value.copy(SKU.hor.value).lerp(SKU.mid.value,.3);u.sunC.value.copy(SKU.sunC.value);u.sd.value.copy(SUND);u.nf.value=NIGHT;regW(px,pz,RW);u.murk.value+=(RW[RI.mang]*.75-u.murk.value)*.05}
