'use strict';
/* =============================================================================
   VOXEL REALMS · mundo
   regiões (biomas), relevo em voxels, rio, estradas, pontes, estruturas,
   vegetação e carregamento de pedaços (chunks) conforme o jogador anda
   ============================================================================= */
const CS=32,WMAX=645,WMH=WMAX+8; // tamanho do pedaço, limite andável do mundo (±) e meia largura do mapa (15.2: área 3× maior; 15.7: cada bioma 3× maior)
const REG=[
  {id:'vila',n:'Vila Pedraverde',lv:1,c:[0,0],k:1.5,top:[0x62b44a,0x5aaa44,0x6cbc52],side:0x7a5a3a,map:'#86b85e',amb:'Pedraverde, a última vila livre de Aldoria.'},
  {id:'plan',n:'Planície Dourada',lv:2,c:[17.3,259.8],k:1,top:[0xa6bc4c,0xb2c656,0x9ab246,0xbcc660],side:0x8a6a3a,map:'#c0c460',amb:'Trigais e moinhos — e bandidos nas estradas.'},
  {id:'flor',n:'Campos de Lírio',lv:5,c:[285.8,17.3],k:1,top:[0x5cbc74,0x54b06c,0x68c47e],side:0x7a5a3a,map:'#7ccc8e',amb:'Flores sem fim. Algo corrompeu as colmeias.'},
  {id:'mata',n:'Floresta Ancestral',lv:8,c:[-17.3,-273.7],k:1,top:[0x4a8a68,0x427e60,0x529470],side:0x5a4428,map:'#c8782e',amb:'Árvores mais velhas que o reino guardam segredos.'},
  {id:'mang',n:'Mangue Sombrio',lv:11,c:[-291,43.3],k:1,top:[0x3e6650,0x375c48,0x467058],side:0x3e3a2e,map:'#3e6a66',amb:'Lodo, névoa e a cabana da bruxa.'},
  {id:'cald',n:'Caldeira de Brasas',lv:14,c:[268.5,-280.6],k:1.15,top:[0x4a3a34,0x3e302c,0x55443c],side:0x2e2420,map:'#6a3a2e',amb:'Onde Ignarok dorme sob a rocha fundida.'},
  // 15.2 · anel externo: seis terras novas
  {id:'outono',n:'Bosque Carmesim',lv:9,c:[-355.1,-337.7],k:1,top:[0xb8642a,0xc87a30,0xa85424,0xd08a3a],side:0x5a3a22,map:'#c8642e',amb:'Folhas vermelhas caem o ano inteiro. Ruínas antigas dormem sob elas.'},
  {id:'neve',n:'Picos Gelados',lv:18,c:[43.3,-533.5],k:1,top:[0xf0f4fa,0xe4ecf6,0xf8fbff,0xdce6f2],side:0x8a96a8,map:'#e8eef6',amb:'Vento cortante, gelo eterno e um mosteiro esquecido.'},
  {id:'savana',n:'Savana Rubra',lv:8,c:[528.3,164.5],k:1,top:[0xc8a24a,0xd4ae54,0xbc943e,0xdcb860],side:0x8a5a2e,map:'#d2a850',amb:'Capim alto, acácias e manadas sob um sol vermelho.'},
  {id:'deserto',n:'Dunas de Âmbar',lv:15,c:[389.7,433],k:1,top:[0xe8c888,0xf0d498,0xdcbc7a,0xf4dca8],side:0xc8a060,map:'#ecd09a',amb:'Areia sem fim e um templo do sol meio enterrado.'},
  {id:'costa',n:'Costa das Conchas',lv:11,c:[-95.3,540.4],k:1,top:[0x7ac85a,0x86d064,0x6cbc50],side:0x8a6a3a,map:'#9ad478',amb:'Praias, coqueiros e um farol que ninguém acende há anos.'},
  {id:'cristal',n:'Vale de Cristal',lv:20,c:[-485,381.1],k:1,top:[0x6a5a9a,0x5e4e8e,0x7a68aa,0x56488a],side:0x3a3058,map:'#7a6ab0',amb:'Cristais vivos cantam no escuro. Nada aqui é o que parece.'}];
const RI={};REG.forEach((r,i)=>RI[r.id]=i);
// pontos de interesse com nome próprio dentro das regiões
const POI=[{n:'Cemitério Esquecido',x:-119.3,z:-211.7,r:24},{n:'Acampamento dos Bandidos',x:-30.7,z:287.8,r:18},{n:'Moinho de Hollow',x:53.3,z:231.8,r:14},{n:'Colmeia Real',x:312.8,z:53.3,r:18},
  {n:'Templo de Lírio',x:258.8,z:-22.7,r:14},{n:'Torre Arruinada',x:-55.3,z:-247.7,r:14},{n:'Bosque do Ancião',x:4.7,z:-305.7,r:20},{n:'Cabana da Bruxa',x:-311,z:70.3,r:16},{n:'Toca do Eremita',x:-261,z:6.3,r:10},{n:'Covil de Ignarok',x:265.5,z:-296.6,r:24}];

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
  case 5:return 2.6+(fbm(x*.035,z*.035,4)-.5)*16+(fbm(x*.1,z*.1,2)>.64?3:0);
  case 6:return 2.4+(fbm(x*.03,z*.03,4)-.5)*12;
  case 7:return 4.5+(fbm(x*.022,z*.022,4)-.5)*22+Math.max(0,fbm(x*.06,z*.06,2)-.55)*18;
  case 8:return 1.5+(fbm(x*.016,z*.016,3)-.5)*5;
  case 9:return 1.6+S(x*.07+fbm(x*.01,z*.01,2)*6)*1.3+(fbm(x*.02,z*.02,3)-.5)*5;
  case 10:return .5+(fbm(x*.03,z*.03,3)-.5)*4.2;
  default:return 2.2+(fbm(x*.03,z*.03,4)-.5)*11+(fbm(x*.09,z*.09,2)>.66?2.5:0)}}
const RVF=Math.sqrt(3),riverZ=x=>RVF*(48+30*S(x/RVF*.017)+12*S(x/RVF*.041+1)),riverD=(x,z)=>Math.abs(z-riverZ(x)); // 15.7: o rio cresce junto com o mundo
// estradas: da vila até cada região, e da região das flores até a caldeira
const ROADS=[[[0,0],[17.3,259.8]],[[0,0],[285.8,17.3]],[[0,0],[-17.3,-273.7]],[[0,0],[-291,43.3]],[[285.8,17.3],[268.5,-280.6]],[[-17.3,-273.7],[-119.3,-211.7]],[[17.3,259.8],[-30.7,287.8]],
  [[-17.3,-273.7],[-355.1,-337.7]],[[-17.3,-273.7],[43.3,-525.5]],[[285.8,17.3],[523.3,161.5]],[[17.3,259.8],[384.7,428]],[[-30.7,287.8],[-95.3,533.4]],[[-291,43.3],[-480,376.1]]];
function segD(x,z,a,b){const dx=b[0]-a[0],dz=b[1]-a[1],t=cl(((x-a[0])*dx+(z-a[1])*dz)/(dx*dx+dz*dz),0,1);return hy(x-a[0]-dx*t,z-a[1]-dz*t)}
function roadD(x,z){let m=1e9;for(const r of ROADS){const d=segD(x,z,r[0],r[1]);if(d<m)m=d}return m+(vnoise(x*.3,z*.3)-.5)*1.2}
const FZ=[]; // zonas aplainadas para estruturas {x,z,r,h}
function rawH0(x,z){regW(x,z,RW);let h=0,s=0;for(let i=0;i<REG.length;i++)if(RW[i]>.01){h+=RW[i]*hReg(i,x,z);s+=RW[i]}h/=s;
  const rv=riverD(x,z);if(rv<11)h=Math.min(h,lerp(-1.7,h,sstep(2.4,10,rv)));
  const e=Math.max(Math.abs(x),Math.abs(z));if(e>WMAX-14)h+=(e-WMAX+14)*1.35*(.55+fbm(x*.05,z*.05,2)*.9);return h}
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
// 15.0 · chão sob a pegada inteira (centro + 4 pontas): na beira de um degrau o corpo fica em cima dele
// em vez de metade enterrada; paredes altas demais (degrau > 1,3) não contam
function footY(x,z,cur,r){let h=groundAt(x,z);for(let i=0;i<4;i++){const g=groundAt(x+(i<2?(i?r:-r):0),z+(i>1?(i>2?r:-r):0));if(g>h&&(cur==null||g-cur<1.3))h=g}return h}
// pode ficar de pé aqui? (água funda e penhascos bloqueiam)
function walkable(x,z,fromY){if((Math.abs(x)>WMAX||Math.abs(z)>WMAX)&&!(typeof DST!='undefined'&&DST.on))return false;if(onBridge(x,z))return true;const h=groundAt(x,z);return h>-.8&&(fromY==null||h-fromY<1.3)}
const STRC=[]; // colisores fixos das estruturas [x,z,r]
function collide(o,r){const cx=Math.floor(o.x/CS),cz=Math.floor(o.z/CS);
  for(let dz=-1;dz<=1;dz++)for(let dx=-1;dx<=1;dx++){const c=CHK.get(ckey(cx+dx,cz+dz));if(c)pushOut(o,r,c.col)}pushOut(o,r,STRC)}
function pushOut(o,r,L){for(const k of L){const dx=o.x-k[0],dz=o.z-k[1];if(Math.abs(dx)>k[2]+r||Math.abs(dz)>k[2]+r)continue;const d=hy(dx,dz),m=k[2]+r;if(d<m&&d>1e-4){o.x=k[0]+dx/d*m;o.z=k[1]+dz/d*m}}}

// ---------- ajudante de estruturas: caixas em coordenadas locais (girado e assentado no chão)
// m = escala da construção (casas e prédios ficam proporcionais ao herói, que tem ~2,9 de altura)
class TB{constructor(k,e,f,x,z,ry,y,m){this.k=k;this.e=e;this.f=f;this.x=x;this.z=z;this.ry=ry||0;this.y=y==null?groundAt(x,z):y;this.c=C(this.ry);this.s=S(this.ry);this.m=m||1}
  w(lx,lz){lx*=this.m;lz*=this.m;return[this.x+lx*this.c+lz*this.s,this.z-lx*this.s+lz*this.c]}
  b(w,h,d,lx,ly,lz,col,o,tgt){const[x,z]=this.w(lx,lz),oo=Object.assign({},o||{}),m=this.m;oo.ry=(oo.ry||0)+this.ry;(tgt||this.k).box(w*m,h*m,d*m,x,this.y+ly*m,z,col,oo);
    if(!tgt&&CUR_S&&!CUR_S.cd&&h*m>=1.3&&ly-h/2<.8&&Math.max(w,d)*m<=2.6&&Math.min(w,d)*m>=.16)STRC.push([x,z,Math.max(w,d)*m*.48]);return this}
  e_(w,h,d,lx,ly,lz,col,o){return this.b(w,h,d,lx,ly,lz,col,o,this.e)}
  f_(w,h,d,lx,ly,lz,col,o){return this.b(w,h,d,lx,ly,lz,col,o,this.f)}
  col(lx,lz,r){if(CUR_S&&CUR_S.cd)return;const[x,z]=this.w(lx,lz);STRC.push([x,z,r*this.m])}}
let CUR_S=null; // estrutura sendo construída (colisores e lampiões só são registrados na primeira vez)
const STR=[]; // {x,z,fn(k,e,f)} construídas dentro do pedaço que contém o centro
const DYN=[]; // objetos animados das estruturas (pás do moinho, cristais)
function addStr(x,z,r,fn,h){if(r)flat(x,z,r,h);STR.push({x,z,fn,cx:Math.floor(x/CS),cz:Math.floor(z/CS)})}

// ---------- vegetação e pedras (k: sólido, f: folhagem com vento, e: emissivo)
// 14.0 · copas arredondadas feitas de voxels: discos em cruz empilhados (largos no meio, claros em cima),
// folhinhas soltas na borda e pingentes embaixo. Nos pedaços distantes (lod 2) só os discos.
const hr=(x,z,i)=>hash2((x*13.7+i*7.1)|0,(z*17.3-i*3.9)|0);
function blob(f,x,y,z,r,h,c,lod,sd){const P_=[.74,1,.6],sh=[.78,1,1.16],lh=h/3;sd=sd||0;
  for(let j=0;j<3;j++){const rr=r*P_[j],yy=y-h/2+lh*(j+.5),cc=shade(c,sh[j]),ry=sd*2.3+j*.5;f.box(rr*2,lh,rr*1.3,x,yy,z,cc,{ry});f.box(rr*1.3,lh,rr*2,x,yy,z,cc,{ry})}
  if(lod>1)return;
  for(let i=0;i<5;i++){const a=sd*7+i*1.26+hr(x,z,i)*.5,q=r*(.2+hr(z,x,i)*.12),rr=r*(.9+hr(x,z,i+9)*.2);f.box(q,q,q,x+C(a)*rr,y+(hr(x,z,i+3)-.45)*h*.55,z+S(a)*rr,shade(c,.86+hr(z,x,i+5)*.4),{ry:a})}
  for(let i=0;i<2;i++){const a=sd*5+i*3.1,q=r*.2;f.box(q,q*1.3,q,x+C(a)*r*.55,y-h/2-q*.5,z+S(a)*r*.55,shade(c,.8))}}
const LEAF={vila:[0x3f9a34,0x4cae3c,0x5cc046,0x6fd052],plan:[0x8ab838,0xa8c040,0xd8a830,0xe8b838],
  outono:[0xf08a1a,0xffb02a,0xe0601e,0xffd040,0xd84a22,0xf0a028],roxo:[0xb050d0,0xd070e8,0x9a48c8,0xe890f0,0xc860d8],
  rosa:[0xf4a6c8,0xffc4dc,0xe890b8,0xffd8e8],azul:[0x2e6aa6,0x3a7cba,0x2a5e98,0x4a8ed0],pinho:[0x1e5a5a,0x24666a,0x2a6e66],
  rubro:[0xc8282a,0xe03a2a,0xa81e24,0xf05a32,0xd8401e],savana:[0x7a8a2a,0x8a9a32,0x6a7a24],palma:[0x3a9a3a,0x48aa42,0x2e8a34],gelo:[0x2a4a5a,0x2e5866,0x34606a]};
// 15.2 · árvores e objetos das terras novas
function acacia(k,f,x,y,z,s){const sd=hr(x,z,12),c=LEAF.savana[(sd*3)|0];k.box(.5*s,2.8*s,.5*s,x,y+1.4*s,z,0x6a4a2a,{g:1,rz:.12}).box(.32*s,1.8*s,.32*s,x+.55*s,y+2.9*s,z+.1*s,0x6a4a2a,{rz:-.55}).box(.3*s,1.5*s,.3*s,x-.45*s,y+2.8*s,z-.1*s,0x6a4a2a,{rz:.6});
  f.box(4.6*s,.45*s,3.8*s,x+.3*s,y+3.7*s,z,c,{ry:sd*3}).box(3.2*s,.4*s,2.8*s,x+.5*s,y+4.1*s,z+.2*s,shade(c,1.15),{ry:sd*3+.4}).box(2.4*s,.35*s,2*s,x-.9*s,y+3.5*s,z-.4*s,shade(c,.9),{ry:sd*3+1})}
function palm(k,f,x,y,z,s){const sd=hr(x,z,13),bx=C(sd*6)*.3*s,bz=S(sd*6)*.3*s;for(let i=0;i<6;i++)k.box(.42*s,.85*s,.42*s,x+bx*i*i*.12,y+(.42+i*.8)*s,z+bz*i*i*.12,i%2?0x8a6a42:0x7a5a38,{g:i==0?1:0});
  const tx=x+bx*3,tz=z+bz*3,ty=y+5*s;for(let i=0;i<7;i++){const a=i/7*TAU+sd,c=LEAF.palma[i%3];f.box(.5*s,.1*s,2.6*s,tx+S(a)*1.2*s,ty-.25*s,tz+C(a)*1.2*s,c,{ry:a,rx:.35});f.box(.36*s,.08*s,1.2*s,tx+S(a)*2.4*s,ty-.75*s,tz+C(a)*2.4*s,shade(c,.9),{ry:a,rx:.8})}
  k.box(.3*s,.3*s,.3*s,tx+.25*s,ty-.4*s,tz,0x5a3a1a).box(.3*s,.3*s,.3*s,tx-.2*s,ty-.45*s,tz+.2*s,0x5a3a1a)}
function cactus(k,x,y,z,s){const sd=hr(x,z,14),h=(2+sd*1.4)*s,g=0x4a8a3a,d=shade(g,.82);k.box(.7*s,h,.7*s,x,y+h/2,z,g).box(.74*s,h*.96,.2*s,x,y+h/2,z,d).box(.2*s,h*.96,.74*s,x,y+h/2,z,d);
  if(sd>.3)k.box(.7*s,.45*s,.45*s,x+.55*s,y+h*.45,z,g).box(.45*s,1.1*s,.45*s,x+.85*s,y+h*.45+.6*s,z,g);if(sd>.55)k.box(.6*s,.4*s,.4*s,x-.5*s,y+h*.6,z,g).box(.4*s,.9*s,.4*s,x-.75*s,y+h*.6+.5*s,z,g);if(sd>.7)k.box(.3*s,.2*s,.3*s,x,y+h+.1*s,z,0xff7ab0)}
function crystalSpire(k,e,x,y,z,s){const sd=hr(x,z,15),cs=[0x8ae8ff,0xc08aff,0x6ad8ff,0xe0a8ff];k.box(1.6*s,.5*s,1.4*s,x,y+.2*s,z,0x2e2640,{g:1});
  for(let i=0;i<4;i++){const a=sd*6+i*1.7,h=(1.4+((sd*7+i)%1)*2.6)*s;e.box(.45*s,h,.45*s,x+C(a)*.45*s,y+h/2,z+S(a)*.45*s,cs[i],{rx:C(a)*.25,rz:S(a)*.25})}}
function bush(f,x,y,z,c,s){s=s||1;f.box(1*s,.6*s,.9*s,x,y+.3*s,z,c).box(.7*s,.45*s,.7*s,x+.2*s,y+.7*s,z-.1*s,shade(c,1.12)).box(.5*s,.35*s,.5*s,x-.3*s,y+.55*s,z+.25*s,shade(c,.92))}
function oak(k,f,x,y,z,s,leaf,lift,lod){lift=lift||0;leaf=leaf||LEAF.vila;const sd=hr(x,z,1),c=leaf[(sd*leaf.length)|0],c2=leaf[((sd*leaf.length)|0)+1]||leaf[0];
  k.box(.9*s,(3.8+lift)*s,.9*s,x,y+(1.9+lift/2)*s,z,0x5a3b20,{g:1});k.box(1.5*s,.45*s,1.5*s,x,y+.22*s,z,0x4e331b,{g:1,ry:sd});y+=lift*s;
  k.box(.3*s,1.7*s,.3*s,x-.62*s,y+3.2*s,z+.2*s,0x5a3b20,{rz:.6});k.box(.3*s,1.6*s,.3*s,x+.6*s,y+3.5*s,z-.15*s,0x5a3b20,{rz:-.55});
  blob(f,x,y+4.9*s,z,1.85*s,2.5*s,c,lod,sd);if(lod<2)blob(f,x+(sd-.5)*2.2*s,y+3.9*s,z+(hr(z,x,2)-.5)*2.2*s,1.15*s,1.5*s,c2,2,sd+1)}
function pine(k,f,x,y,z,s,snow,lift,lod,cols){lift=lift||0;cols=cols||LEAF.pinho;k.box(.6*s,(2+lift)*s,.6*s,x,y+(1+lift/2)*s,z,0x4a3018,{g:1});y+=lift*s;const sd=hr(x,z,4);
  for(let i=0;i<4;i++){const w=(3.4-i*.72)*s,c=shade(cols[i%cols.length],.85+i*.08),yy=y+(1.8+i*1.15)*s;f.box(w,1.1*s,w*.66,x,yy,z,c,{ry:i*.4+sd});f.box(w*.66,1.1*s,w,x,yy,z,c,{ry:i*.4+sd});
    if(lod<2&&i<3){const a=sd*6+i*2.1;f.box(.45*s,.45*s,.45*s,x+C(a)*w*.5,yy-.5*s,z+S(a)*w*.5,shade(c,1.15))}}
  f.box(.5*s,1*s,.5*s,x,y+6.5*s,z,shade(cols[0],1.2));if(snow)k.box(1.4*s,.25*s,1.4*s,x,y+6.1*s,z,0xf2f6fa)}
function birch(k,f,x,y,z,s,lod,cols){cols=cols||LEAF.roxo;const sd=hr(x,z,6),c=cols[(sd*cols.length)|0];k.box(.55*s,5*s,.55*s,x,y+2.5*s,z,0xf0ece2,{g:1});
  for(let i=0;i<3;i++)k.box(.57*s,.14*s,.32*s,x,y+(.9+i*1.2+sd*.4)*s,z+.14*s*(i%2?-1:1),0x2a2a30);k.box(.22*s,1.2*s,.22*s,x+.45*s,y+4*s,z,0xf0ece2,{rz:-.6});
  blob(f,x,y+5.6*s,z,1.45*s,2.6*s,c,lod,sd);if(lod<2)blob(f,x+.95*s,y+4.4*s,z+(sd-.5)*1.4*s,.95*s,1.3*s,cols[((sd*cols.length)|0)+1]||cols[0],2,sd+2)}
function blossom(k,f,x,y,z,s,lod){const sd=hr(x,z,8);k.box(.8*s,3*s,.8*s,x,y+1.5*s,z,0x5a3a2a,{g:1});k.box(.3*s,1.4*s,.3*s,x+.5*s,y+3*s,z,0x5a3a2a,{rz:-.5});k.box(.3*s,1.4*s,.3*s,x-.5*s,y+3*s,z,0x5a3a2a,{rz:.5});
  blob(f,x,y+4.3*s,z,2.1*s,2.2*s,LEAF.rosa[(sd*4)|0],lod,sd)}
function mangrove(k,f,x,y,z,s,lod,e){const sd=hr(x,z,10),c=LEAF.azul[(sd*4)|0];for(let i=0;i<6;i++){const a=i/6*TAU+.3;k.box(.22*s,2.2*s,.22*s,x+C(a)*.9*s,y+.9*s,z+S(a)*.9*s,0x3a3430,{rx:S(a)*.45,rz:-C(a)*.45})}
  k.box(.7*s,4.9*s,.7*s,x,y+2.25*s,z,0x3e3830).box(1.1*s,.5*s,1.1*s,x,y+1.85*s,z,0x34302a).box(1.3*s,.4*s,1.3*s,x,y+.1*s,z,0x34302a);
  blob(f,x,y+5.1*s,z,2.5*s,1.6*s,c,lod,sd);
  for(let i=0;i<3;i++){const a=sd*4+i*2.1;f.box(.14,1.6,.14,x+C(a)*1.9*s,y+3.9*s,z+S(a)*1.9*s,0x3aa89a)}
  if(e&&lod<2)for(let i=0;i<2;i++){const a=sd*9+i*2.6;e.box(.26,.34,.26,x+C(a)*1.5*s,y+4.1*s,z+S(a)*1.5*s,i?0x7affea:0x9affc8)}}
function deadTree(k,x,y,z,s){k.box(.7*s,4*s,.7*s,x,y+2*s,z,0x2a1e1a,{g:1});k.box(.25*s,1.8*s,.25*s,x+.6*s,y+3.4*s,z,0x2a1e1a,{rz:-.7});k.box(.25*s,1.6*s,.25*s,x-.5*s,y+2.8*s,z+.2,0x2a1e1a,{rz:.8});k.box(.2*s,1.2*s,.2*s,x,y+4.4*s,z+.4*s,0x2a1e1a,{rx:.6})}
function rock(k,x,y,z,s,col,moss){k.box(1.3*s,.9*s,1.1*s,x,y+.4*s,z,col,{g:1,ry:x});k.box(.8*s,.6*s,.8*s,x+.3*s,y+.9*s,z-.2*s,col,{ry:z});if(moss)k.box(1.1*s,.15*s,.9*s,x,y+.92*s,z,0x4f8a3a)}
const FLL=[0xb07aff,0xd090ff,0xffffff,0xff9ad0,0x8a6aff,0xe0b0ff,0xffd84a];
const FLC=[0xff5a7a,0xffd84a,0xb07aff,0xffffff,0xff8a3a,0x6ab0ff,0xff9ad0];
function flower(f,x,y,z,c,t){f.box(.1,.38*t,.1,x,y+.19*t,z,0x3d8b3d).box(.26,.2,.26,x,y+.42*t,z,c)}
function grass(f,x,y,z,c){f.box(.1,.55,.1,x,y+.27,z,c).box(.1,.42,.1,x+.18,y+.21,z+.1,c).box(.1,.38,.1,x-.13,y+.19,z-.14,c)}

// ---------- construção de um pedaço (gerador: trabalha em fatias para não travar o quadro)
// escala local para detalhes (grama, flores...) ao redor do ponto onde nascem
class SB{constructor(k,ox,oy,oz,m){this.k=k;this.o=[ox,oy,oz];this.m=m}box(w,h,d,x,y,z,c,o){const m=this.m,O=this.o;this.k.box(w*m,h*m,d*m,O[0]+(x-O[0])*m,O[1]+(y-O[1])*m,O[2]+(z-O[2])*m,c,o);return this}}
const TREE_S=1.6,ROCK_S=1.5,PROP_S=1.4; // árvores e objetos proporcionais ao herói (~2,9 de altura)
function decorate(ch,k,f,e,lod){const x0=ch.cx*CS,z0=ch.cz*CS,r=rng(ch.cx*73856093^ch.cz*19349663^0x5bd1e995),col=ch.col;
  const nearStr=(x,z)=>{for(const s of FZ)if(Math.abs(x-s.x)<s.r*.8&&Math.abs(z-s.z)<s.r*.8&&hy(x-s.x,z-s.z)<s.r*.8)return true;return false};
  const spot=(minH)=>{const x=x0+r()*CS,z=z0+r()*CS,ix=Math.floor(x)-x0,iz=Math.floor(z)-z0,h=ch.h[(ix+1)+(iz+1)*34];if(h<(minH==null?.25:minH)||roadD(x,z)<2.4||nearStr(x,z)||onBridge(x,z))return null;regW(x,z,RW);let b=0;for(let i=1;i<REG.length;i++)if(RW[i]>RW[b])b=i;return{x,z,h,b}};
  const N=[[3,0,1,40,20],[4,0,4,70,16],[5,0,2,40,150],[18,0,4,40,14],[10,0,3,10,6],[5,0,9,0,0],[14,0,3,40,16],[7,0,6,10,0],[2,0,2,80,10],[1.6,0,3,4,0],[3,0,2,30,10],[4,0,5,8,4]]; // árvores, -, pedras, grama, flores por região
  const db=regionAt(x0+CS/2,z0+CS/2);
  for(let i=0;i<N[db][0]*1.5;i++){const p=spot(-.6);if(!p)continue;const s=(.85+r()*.6)*TREE_S;
    if(p.b==0){if(p.h<.3)continue;oak(k,f,p.x,p.h,p.z,s,LEAF.vila,0,lod);col.push([p.x,p.z,.9*s])}
    else if(p.b==1){if(p.h<.3)continue;oak(k,f,p.x,p.h,p.z,s,LEAF.plan,.6,lod);col.push([p.x,p.z,.9*s])}
    else if(p.b==2){if(p.h<.3)continue;r()<.3?blossom(k,f,p.x,p.h,p.z,s,lod):birch(k,f,p.x,p.h,p.z,s,lod);col.push([p.x,p.z,.8*s])}
    else if(p.b==3){if(p.h<.3)continue;const big=r()<.15?1.6:1;r()<.35?pine(k,f,p.x,p.h,p.z,s*big,0,1.6,lod):oak(k,f,p.x,p.h,p.z,s*big,LEAF.outono,1.2,lod);col.push([p.x,p.z,.9*s*big])}
    else if(p.b==4){if(p.h<-.7)continue;mangrove(k,f,p.x,p.h,p.z,s,lod,e);col.push([p.x,p.z,1.1*s])}
    else if(p.b==5){if(p.h<.3)continue;deadTree(k,p.x,p.h,p.z,s);col.push([p.x,p.z,.6*s])}
    else if(p.b==6){if(p.h<.3)continue;const big=r()<.18?1.5:1;r()<.4?oak(k,f,p.x,p.h,p.z,s*big,LEAF.rubro,1,lod):oak(k,f,p.x,p.h,p.z,s*big,LEAF.outono,.8,lod);col.push([p.x,p.z,.9*s*big])}
    else if(p.b==7){if(p.h<.3)continue;r()<.82?pine(k,f,p.x,p.h,p.z,s*(1+r()*.5),1,.8,lod,LEAF.gelo):deadTree(k,p.x,p.h,p.z,s);col.push([p.x,p.z,.9*s])}
    else if(p.b==8){if(p.h<.3)continue;acacia(k,f,p.x,p.h,p.z,s);col.push([p.x,p.z,.6*s])}
    else if(p.b==9){if(p.h<.3)continue;cactus(k,p.x,p.h,p.z,s*.8);col.push([p.x,p.z,.5*s])}
    else if(p.b==10){if(p.h<.3)continue;p.h<1.6?palm(k,f,p.x,p.h,p.z,s*.9):oak(k,f,p.x,p.h,p.z,s,LEAF.vila,0,lod);col.push([p.x,p.z,.6*s])}
    else{if(p.h<.3)continue;r()<.6?crystalSpire(k,e,p.x,p.h,p.z,s*.8):deadTree(k,p.x,p.h,p.z,s);col.push([p.x,p.z,.7*s])}}
  // pedras
  for(let i=0;i<N[db][2]+1;i++){const p=spot();if(!p)continue;const s=(.7+r()*1.1)*ROCK_S;rock(k,p.x,p.h,p.z,s,[0x8a8a84,0x8a8a84,0x8a8a84,0x8a8a84,0x5a5a4a,0x2a2224,0x7a6a5a,0xa8b4c4,0x9a6a4a,0xc8a070,0x8a8a84,0x3a3050][p.b],p.b==3||p.b==4||p.b==6);col.push([p.x,p.z,.6*s]);if(p.b==7)k.box(1.2*s,.22*s,1*s,p.x,p.h+1.1*s,p.z,0xf4f8fc);if(p.b==11&&r()<.7)e.box(.3*s,1.4*s,.3*s,p.x+.5*s,p.h+.9*s,p.z,0x9ae8ff,{rz:.3});
    if(p.b==5&&r()<.6){k.box(.5,2.5+r()*2,.5,p.x+1.4,p.h+1.2,p.z,0x1a1418,{rz:.3,ry:r()*3});}}
  if(lod>1)return;
  // detalhes pequenos (só perto): grama, flores, cogumelos, juncos, trigo, vitórias-régias
  const K0=k,F0=f;for(let i=0;i<220;i++){const p=spot(-.5);if(!p)continue;const n=N[p.b],t=r(),sm_=p.h<-.05?1:PROP_S,k=new SB(K0,p.x,p.h,p.z,sm_),f=new SB(F0,p.x,p.h,p.z,sm_),g=new SB(e,p.x,p.h,p.z,sm_);
    if(p.b==4){if(p.h<-.05){if(t<.35){k.box(.9,.04,.9,p.x,.03,p.z,0x3a8a6a,{ry:r()*3});if(r()<.3)g.box(.22,.16,.22,p.x,.1,p.z,r()<.5?0xff9ad0:0x8affe8)}}
      else if(t<.5){f.box(.08,1.6,.08,p.x,p.h+.8,p.z,0x6a8a3a).box(.14,.4,.14,p.x,p.h+1.5,p.z,0x5a3a20).box(.08,1.3,.08,p.x+.2,p.h+.65,p.z+.1,0x7a9a4a)}else if(t<.62){const gc=r()<.6?0x40ffd8:0x6ac8ff;for(let a=0;a<3;a++){const ox=(a-1)*.32,oz=(a%2)*.25,hh=.25+a%2*.18;k.box(.12,hh,.12,p.x+ox,p.h+hh/2,p.z+oz,0xd8e8e0);g.box(.34-a*.04,.12,.34-a*.04,p.x+ox,p.h+hh+.05,p.z+oz,gc)}}continue}
    if(p.h<.3)continue;
    if(p.b==2){if(t<.75)flower(f,p.x,p.h,p.z,FLL[(r()*FLL.length)|0],1+r()*.4);else if(t<.82){f.box(.12,1.8,.12,p.x,p.h+.9,p.z,0x4a8a3a).box(.6,.6,.18,p.x,p.h+1.9,p.z,0xffcc22).box(.25,.25,.2,p.x,p.h+1.9,p.z+.05,0x5a3a1a)}else grass(f,p.x,p.h,p.z,0x6ac050);continue}
    if(p.b==1&&t<.22){for(let a=0;a<6;a++){const xx=p.x+(a%3)*.35,zz=p.z+((a/3)|0)*.35;f.box(.08,1.1,.08,xx,p.h+.55,zz,0xd8b84a).box(.12,.3,.12,xx,p.h+1.15,zz,0xe8c860)}continue}
    if(p.b==3&&t<.4&&t>=.3){const lc=[0xff8a1a,0xffb02a,0xe0601e,0xffd040];for(let a=0;a<3;a++)k.box(.36,.035,.28,p.x+(r()-.5)*1.4,p.h+.02,p.z+(r()-.5)*1.4,lc[(r()*4)|0],{ry:r()*3});continue}
    if(p.b==3&&t>.985){k.box(.14,.34,.14,p.x,p.h+.17,p.z,0xd8e0f0);g.box(.42,.16,.42,p.x,p.h+.4,p.z,0x5ab8ff);continue}
    if(p.b==3&&t<.12){k.box(.18,.4,.18,p.x,p.h+.2,p.z,0xeee8d8).box(.55,.22,.55,p.x,p.h+.48,p.z,r()<.6?0xd03a2a:0x9a6a3a);continue}
    if(p.b==3&&t<.3){for(let a=0;a<4;a++)f.box(.5,.08,.16,p.x+C(a*1.6)*.25,p.h+.3,p.z+S(a*1.6)*.25,0x3a7a2a,{ry:a*1.6,rz:.4});continue}
    if(p.b==5){if(t<.2)k.box(.6,.12,.14,p.x,p.h+.07,p.z,0xe8e0d0,{ry:r()*3});continue}
    if(p.b==6){if(t<.35){const lc=LEAF.rubro.concat(LEAF.outono);for(let a=0;a<4;a++)k.box(.36,.035,.28,p.x+(r()-.5)*1.6,p.h+.02,p.z+(r()-.5)*1.6,lc[(r()*lc.length)|0],{ry:r()*3})}else if(t<.42)k.box(.18,.4,.18,p.x,p.h+.2,p.z,0xeee8d8).box(.55,.22,.55,p.x,p.h+.48,p.z,0xd03a2a);else if(t<.5)bush(f,p.x,p.h,p.z,0xc0402a,.9);else if(t<.53){k.box(2.6,.5,.5,p.x,p.h+.25,p.z,0x5a3a22,{ry:r()*3}).box(1.2,.12,.52,p.x,p.h+.52,p.z,0x4a7a2a)}else grass(f,p.x,p.h,p.z,[0xc87a30,0xb8642a,0xd89040][(r()*3)|0]);continue}
    if(p.b==7){if(t<.3)k.box(.9+r()*.8,.3,.8+r()*.6,p.x,p.h+.12,p.z,0xf4f8fc,{ry:r()*3});else if(t<.36)g.box(.25,.9+r()*.6,.25,p.x,p.h+.45,p.z,0xbfeaff,{rz:(r()-.5)*.5});else if(t<.5)grass(f,p.x,p.h,p.z,0xc8d4dc);continue}
    if(p.b==8){if(t<.62){for(let a=0;a<3;a++)f.box(.1,1.1+r()*.6,.1,p.x+(r()-.5)*.6,p.h+.6,p.z+(r()-.5)*.6,[0xd8b85a,0xc8a04a,0xe0c46a][a])}else if(t<.64)k.box(.8,1.8,.8,p.x,p.h+.9,p.z,0x9a6a3a).box(.5,.6,.5,p.x,p.h+2,p.z,0x8a5a32);else if(t<.7)flower(f,p.x,p.h,p.z,0xff7a2a,1);else if(t<.74)bush(f,p.x,p.h,p.z,0x8a9a3a,.8);continue}
    if(p.b==9){if(t<.14){for(let a=0;a<4;a++)k.box(.06,.5,.06,p.x+(r()-.5)*.5,p.h+.25,p.z+(r()-.5)*.5,0x8a6a42,{rz:(r()-.5)*.8})}else if(t<.19){k.box(.5,.42,.5,p.x,p.h+.2,p.z,0xeee4cc).box(.12,.12,.06,p.x-.1,p.h+.26,p.z+.25,0x2a2018).box(.12,.12,.06,p.x+.1,p.h+.26,p.z+.25,0x2a2018)}else if(t<.27)cactus(k,p.x,p.h,p.z,.35);continue}
    if(p.b==10){if(p.h<1&&t<.45){k.box(.22,.08,.18,p.x,p.h+.04,p.z,r()<.5?0xffe8e0:0xffb0c0,{ry:r()*3});if(r()<.3)k.box(.3,.05,.3,p.x+.4,p.h+.03,p.z,0xff8a3a,{ry:.785})}else if(t<.6)grass(f,p.x,p.h,p.z,0x8ac860);else if(t<.66)bush(f,p.x,p.h,p.z,0x4aa040,.8);else if(t<.72)flower(f,p.x,p.h,p.z,FLC[(r()*FLC.length)|0],1);continue}
    if(p.b==11){if(t<.35)g.box(.16,.5+r()*.5,.16,p.x,p.h+.3,p.z,r()<.5?0x9ae8ff:0xd8a8ff,{rz:(r()-.5)*.6});else if(t<.45){k.box(.14,.34,.14,p.x,p.h+.17,p.z,0xd8e0f0);g.box(.42,.16,.42,p.x,p.h+.4,p.z,0x6af0ff)}else if(t<.6)grass(f,p.x,p.h,p.z,0x8a7ac8);continue}
    if(t>.93&&p.b<4){bush(f,p.x,p.h,p.z,[0x4a9a3a,0x8ab03a,0x9a5ac8,0x3a7a3a][p.b]);continue}
    if(t>.915&&t<=.93&&(p.b==0||p.b==3)){k.box(2.6,.5,.5,p.x,p.h+.25,p.z,0x5a3a22,{ry:r()*3}).box(1.4,.12,.52,p.x,p.h+.52,p.z,0x4a8a3a);continue}
    if(i>n[3]+n[4])continue;
    if(t<n[4]/(n[3]+n[4]+1))flower(f,p.x,p.h,p.z,FLC[(r()*FLC.length)|0],1);else grass(f,p.x,p.h,p.z,[0x5aa94a,0x6cb44f,0x4f9b45][(r()*3)|0])}}
function* genChunk(ch){const lod=ch.lod,x0=ch.cx*CS,z0=ch.cz*CS,H=ch.h,k=new Bake(),f=new Bake(),e=new Bake(),n=CS/lod;
  const hAt=(i,j)=>{if(lod==1)return H[(i+1)+(j+1)*34];const ii=i*2,jj=j*2;let m=-99;for(let a=0;a<2;a++)for(let b=0;b<2;b++){const v=H[cl(ii+a+1,0,33)+cl(jj+b+1,0,33)*34];if(v>m)m=v}return m};
  for(let j=0;j<n;j++){for(let i=0;i<n;i++){const ix=x0+i*lod,iz=z0+j*lod,h=hAt(i,j),cx=ix+lod*.5,cz=iz+lod*.5;regW(cx,cz,RW);
      let b=0,acc=0;const rr=hash2(ix*3+1,iz*5+2);for(let q=0;q<REG.length;q++){acc+=RW[q];if(rr<=acc){b=q;break}}
      const g=REG[b],v=hash2(ix,iz);let c=g.top[(v*g.top.length)|0],sc=g.side,emi=0,gt=b!=5&&b!=7&&b!=9&&b!=11;
      const e2=Math.max(Math.abs(cx),Math.abs(cz));
      if(h<-.25){c=b==4?0x3e3626:h<-1?0x8a7a58:0xb0a070;gt=0}else if(h<.6&&b!=4&&b!=5&&b!=7&&b!=11){c=v<.5?0xd8c890:0xcfbf86;gt=0}
      else if(e2>WMAX-9){c=h>13?0xf2f4f8:v<.5?0x7a7a76:0x6a6a66;sc=0x5a5a56;gt=0}
      else if(roadD(cx,cz)<1.7){c=v<.5?0xa08458:0x94784e;sc=0x7a5a3a;gt=0}
      else if(b==0&&hy(cx,cz)<19.5){c=[0x9a9a92,0x8a8a84,0xa8a8a0][(v*3)|0];sc=0x7a7a74;gt=0}
      else if(b==5&&RW[5]>.6&&fbm(cx*.07,cz*.07,2)>.63){emi=1;gt=0;c=v<.3?0xffd84a:v<.7?0xff7a1a:0xff5a10}
      else if(b==11&&RW[11]>.6&&fbm(cx*.08,cz*.08,2)>.68){emi=2;gt=0;c=v<.5?0x6ad8ff:0xb88aff}
      else if(b==7&&h<2.2&&fbm(cx*.05,cz*.05,2)>.6){c=v<.5?0xbfe0f0:0xa8d0e8;gt=0}
      const x1=ix+lod,z1=iz+lod,sh=.94+v*.1;
      if(emi){e.quad([ix,h-(emi==1?.25:0),z1],[x1,h-(emi==1?.25:0),z1],[x1,h-(emi==1?.25:0),iz],[ix,h-(emi==1?.25:0),iz],[0,1,0],c,null,lod,lod);if(emi==1)ch.lava.push([cx,cz])}
      else{const ao=(px,pz)=>{const sx=px?1:-1,sz=pz?1:-1,a=hAt(i+sx,j)>h+.1,bb=hAt(i,j+sz)>h+.1,cc=hAt(i+sx,j+sz)>h+.1;return AOK[a&&bb?3:(a?1:0)+(bb?1:0)+(cc?1:0)]};k.quad([ix,h,z1],[x1,h,z1],[x1,h,iz],[ix,h,iz],[0,1,0],c,[sh*ao(0,1),sh*ao(1,1),sh*ao(1,0),sh*ao(0,0)],lod,lod)}
      // laterais onde o vizinho é mais baixo (oclusão nas bases)
      const sides=[[1,0],[-1,0],[0,1],[0,-1]];for(const[dx,dz]of sides){const nh=hAt(i+dx,j+dz);if(nh>=h)continue;const lo=Math.max(nh,-2.5),H2=h-lo,sc2=H2>2.2?0x6a6a64:sc,top=.9,bot=H2>1?.55:.7;
        if(dx==1)k.quad([x1,lo,z1],[x1,lo,iz],[x1,h,iz],[x1,h,z1],[1,0,0],sc2,[bot,bot,top,top],lod,H2);
        else if(dx==-1)k.quad([ix,lo,iz],[ix,lo,z1],[ix,h,z1],[ix,h,iz],[-1,0,0],sc2,[bot*.92,bot*.92,top*.92,top*.92],lod,H2);
        else if(dz==1)k.quad([ix,lo,z1],[x1,lo,z1],[x1,h,z1],[ix,h,z1],[0,0,1],sc2,[bot*.96,bot*.96,top*.96,top*.96],lod,H2);
        else k.quad([x1,lo,iz],[ix,lo,iz],[ix,h,iz],[x1,h,iz],[0,0,-1],sc2,[bot*.88,bot*.88,top*.88,top*.88],lod,H2);
        if(gt&&H2>.2&&lod==1)grassFringe(k,dx,dz,ix,iz,x1,z1,h,Math.min(.24,H2),c,hash2(ix*5+dx,iz*7+dz))}}
    if(j%8==7)yield 0}
  decorate(ch,k,f,e,lod);yield 0;
  for(const s of STR)if(s.cx==ch.cx&&s.cz==ch.cz){CUR_S=s;s.fn(k,e,f);s.cd=1;CUR_S=null}
  for(const b of BRIDGES)if(Math.floor(b.x/CS)==ch.cx&&Math.floor(b.z/CS)==ch.cz)bridgeMesh(k,b);
  const ms=[k.mesh(MV),f.mesh(MW),e.mesh(ME)];for(let i=0;i<3;i++){const m=ms[i];if(!m)continue;m.matrixAutoUpdate=false;m.receiveShadow=i<2;m.castShadow=i<2&&lod==1;ch.ms.push(m)}}
const AOK=[1,.84,.72,.62];
// franja de grama: faixa no alto da lateral de terra com "pingos" irregulares (lado de bloco de grama dos jogos de voxel)
function grassFringe(k,dx,dz,ix,iz,x1,z1,h,fh,c,r){const o=.012,cs=shade(c,.92),cd=shade(c,.8),d=fh+.12+r*.1,u=.15+r*.55;
  if(dx==1){k.quad([x1+o,h-fh,z1],[x1+o,h-fh,iz],[x1+o,h,iz],[x1+o,h,z1],[1,0,0],cs,[.85,.85,.95,.95],1,fh);k.quad([x1+o,h-d,iz+u+.22],[x1+o,h-d,iz+u],[x1+o,h-fh,iz+u],[x1+o,h-fh,iz+u+.22],[1,0,0],cd,null,.22,d-fh)}
  else if(dx==-1){k.quad([ix-o,h-fh,iz],[ix-o,h-fh,z1],[ix-o,h,z1],[ix-o,h,iz],[-1,0,0],cs,[.8,.8,.9,.9],1,fh);k.quad([ix-o,h-d,iz+u],[ix-o,h-d,iz+u+.22],[ix-o,h-fh,iz+u+.22],[ix-o,h-fh,iz+u],[-1,0,0],cd,null,.22,d-fh)}
  else if(dz==1){k.quad([ix,h-fh,z1+o],[x1,h-fh,z1+o],[x1,h,z1+o],[ix,h,z1+o],[0,0,1],cs,[.84,.84,.94,.94],1,fh);k.quad([ix+u,h-d,z1+o],[ix+u+.22,h-d,z1+o],[ix+u+.22,h-fh,z1+o],[ix+u,h-fh,z1+o],[0,0,1],cd,null,.22,d-fh)}
  else{k.quad([x1,h-fh,iz-o],[ix,h-fh,iz-o],[ix,h,iz-o],[x1,h,iz-o],[0,0,-1],cs,[.78,.78,.88,.88],1,fh);k.quad([ix+u+.22,h-d,iz-o],[ix+u,h-d,iz-o],[ix+u,h-fh,iz-o],[ix+u+.22,h-fh,iz-o],[0,0,-1],cd,null,.22,d-fh)}}
function bridgeMesh(k,b){const a=Math.atan2(b.ux,b.uz),n=Math.ceil(b.len/.7);for(let i=0;i<n;i++){const t=-b.len/2+i*.7+.35,x=b.x+b.ux*t,z=b.z+b.uz*t;k.box(b.w*2,.22,.62,x,b.y-.11,z,i%2?0x8a5a30:0x7a4e2a,{ry:a})}
  for(const sd of[-1,1]){const ox=-b.uz*b.w*sd,oz=b.ux*b.w*sd;k.box(.2,.2,b.len,b.x+ox,b.y+.9,b.z+oz,0x5a3a20,{ry:a});for(let t=-b.len/2;t<=b.len/2;t+=2.2){k.box(.24,1,.24,b.x+b.ux*t+ox,b.y+.4,b.z+b.uz*t+oz,0x5a3a20);k.box(.4,3,.4,b.x+b.ux*t+ox*.9,b.y-1.6,b.z+b.uz*t+oz*.9,0x4a3020)}}}

function chunkNew(cx,cz,lod){const c={cx,cz,lod,h:chunkHeights(cx,cz),ms:[],col:[],lava:[],gen:null,ready:false,old:null};c.gen=genChunk(c);return c}
function chunkDrop(c){for(const m of c.ms){sc.remove(m);m.geometry.dispose()}c.ms.length=0}
let lastCX=1e9,lastCZ=1e9;
const chD=(px,pz,X,Z)=>hy(Math.max(X*CS-px,0,px-(X+1)*CS),Math.max(Z*CS-pz,0,pz-(Z+1)*CS));let lastPX=1e9,lastPZ=1e9;
function worldUpd(px,pz,budget){const cx=Math.floor(px/CS),cz=Math.floor(pz/CS),RL=FOGR.load,V=Math.ceil(RL/CS)+1,L1=FOGR.far*.62,L2=FOGR.far*.7;
  if(cx!=lastCX||cz!=lastCZ||hy(px-lastPX,pz-lastPZ)>4){lastCX=cx;lastCZ=cz;lastPX=px;lastPZ=pz;
    for(let dz=-V;dz<=V;dz++)for(let dx=-V;dx<=V;dx++){const X=cx+dx,Z=cz+dz,d=chD(px,pz,X,Z);if(d>RL)continue;const k=ckey(X,Z),c=CHK.get(k);
      let lod=d<L1?1:2;if(c&&c.lod==1&&d<L2)lod=1;
      if(!c){const n=chunkNew(X,Z,lod);CHK.set(k,n);BQ.push(n)}else if(c.lod!=lod&&!c.gen){const n=chunkNew(X,Z,lod);n.old=c;n.spawned=c.spawned;CHK.set(k,n);BQ.push(n)}}
    for(const[k,c]of CHK){const d=chD(px,pz,c.cx,c.cz);if(d>RL+CS){chunkDrop(c);if(c.old)chunkDrop(c.old);CHK.delete(k);onChunkDrop(c)}else{const v=d<=RL+4;for(const m of c.ms)m.visible=v;c.hid=!v}}
    BQ.sort((a,b)=>chD(px,pz,a.cx,a.cz)-chD(px,pz,b.cx,b.cz))}
  const t0=performance.now();
  while(BQ.length&&performance.now()-t0<budget){const c=BQ[0];if(CHK.get(ckey(c.cx,c.cz))!==c){BQ.shift();continue}
    const r=c.gen.next();if(r.done){BQ.shift();c.gen=null;c.ready=true;if(c.old){chunkDrop(c.old);c.old=null}for(const m of c.ms)sc.add(m);if(!c.spawned){c.spawned=true;onChunkReady(c)}}}}
// carrega tudo ao redor de uma vez (início do jogo e teleporte)
function worldLoadAll(px,pz){lastCX=1e9;lastPX=1e9;worldUpd(px,pz,0);while(BQ.length)worldUpd(px,pz,1e9)}

// ---------- água (plano que acompanha o jogador) com reflexo do céu e brilhos
const WTEX=(()=>{const c=document.createElement('canvas');c.width=c.height=64;const x=c.getContext('2d');x.fillStyle='#2f8fd5';x.fillRect(0,0,64,64);for(let i=0;i<46;i++){x.fillStyle=R()<.5?'#6cc3f2':'#2478b8';x.fillRect(R()*64,R()*64,4+R()*10,2)}const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;return t})();
const WMAT=new THREE.ShaderMaterial({transparent:true,depthWrite:false,fog:true,uniforms:THREE.UniformsUtils.merge([THREE.UniformsLib.fog,{map:{value:null},uT:{value:0},sky:{value:new THREE.Color()},sunC:{value:new THREE.Color()},sd:{value:new V3()},murk:{value:0},nf:{value:0}}]),
  vertexShader:'#include <fog_pars_vertex>\nvarying vec3 vW;void main(){vec4 w=modelMatrix*vec4(position,1.);vW=w.xyz;vec4 mvPosition=viewMatrix*w;gl_Position=projectionMatrix*mvPosition;\n#include <fog_vertex>\n}',
  fragmentShader:'#include <fog_pars_fragment>\nuniform sampler2D map;uniform float uT,murk,nf;uniform vec3 sky,sunC,sd;varying vec3 vW;void main(){vec2 u=vW.xz*.12;vec3 a=texture2D(map,u+vec2(uT*.03,uT*.02)).rgb,b=texture2D(map,u*vec2(.7,1.3)+vec2(-uT*.02,uT*.035)).rgb,w=mix(a,b,.5)*vec3(.7,.85,1.05);w=mix(w,vec3(.06,.3,.28),murk);vec3 V=normalize(cameraPosition-vW);float fr=.25+.6*pow(1.-max(V.y,0.),2.);vec3 R=reflect(-V,vec3(0.,1.,0.));float sp=max(dot(R,sd),0.);vec3 c=mix(w,sky,fr*(1.-murk*.5))+sunC*pow(sp,24.)*.6;float n=fract(sin(dot(floor(vW.xz*5.)+floor(uT*3.),vec2(12.9898,78.233)))*43758.5453);c+=sunC*step(.976,n)*(.3+pow(sp,3.)*1.2)*(1.-nf*.6);c*=1.-nf*.55;c+=vec3(.05,.42,.36)*murk*(.35+nf*.65)*(.75+.25*sin(uT*1.3+vW.x*.4+vW.z*.3));gl_FragColor=vec4(c,.86);\n#include <fog_fragment>\n}'});
WMAT.uniforms.map.value=WTEX;
const WATER=new THREE.Mesh(new THREE.PlaneGeometry(400,400),WMAT);WATER.rotation.x=-PI/2;WATER.position.y=-.2;WATER.renderOrder=1;sc.add(WATER);
function waterUpd(px,pz,t){WATER.position.x=Math.round(px/8)*8;WATER.position.z=Math.round(pz/8)*8;const u=WMAT.uniforms;u.uT.value=t;u.sky.value.copy(SKU.hor.value).lerp(SKU.mid.value,.3);u.sunC.value.copy(SKU.sunC.value);u.sd.value.copy(SUND);u.nf.value=NIGHT;regW(px,pz,RW);u.murk.value+=(RW[RI.mang]*.75-u.murk.value)*.05}
