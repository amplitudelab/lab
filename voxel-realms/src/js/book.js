'use strict';
/* =============================================================================
   VOXEL REALMS · Livro de Missões e Bestiário (16.1)
   - Livros em pixel art desenhados aqui mesmo (BKD): capas inclinadas com
     espessura, páginas, fitas e enfeites, no estilo das referências.
   - O livro abre na tela com a capa girando sobre a lombada; as páginas viram
     com animação (setas, deslizar o dedo ou o sumário).
   - Seções: Missões Principais (por capítulo), Missões Secundárias (por região),
     Bestiário (uma criatura por página, com retrato 3D e mecânicas dos chefes),
     Conquistas e Códice. Uma missão por página, com contexto (QCTX).
   - Enquanto o livro está aberto, o herói segura o livro aberto no mundo e a
     câmera o enquadra ao lado (mesmo mecanismo do inventário).
   ============================================================================= */
// ---------- pixel art dos livros
const BKH=(x,y,s)=>{const n=Math.sin(x*127.1+y*311.7+(s||0)*74.7)*43758.5453;return n-Math.floor(n)};
const BKD={
  main:{n:'Crônicas de Aldoria',base:0x8a5228,dark:0x4a2410,page:0xf2e4c4,rib:0xc03030,clasp:1,el:'aco',
    f(u,v,X,Y,hw,hh){const cx=(u-.5)*hw*2,cy=(v-.56)*hh*2,r=Math.hypot(cx,cy);
      for(const[a,b]of[[0,0],[1,0],[0,1],[1,1]]){const du=Math.abs(u-a),dv=Math.abs(v-b);if(du<.2&&dv<.16&&du/.2+dv/.16<1)return du<.07||dv<.05?0xffe08a:0xd9a43a}
      if(Math.abs(u-.08)<.025&&v>.12&&v<.88&&(Y&1)||Math.abs(u-.92)<.025&&v>.12&&v<.88&&(Y&1))return 0xc89a50;
      for(const[gu,c]of[[.3,0xd02a2a],[.5,0x3a6ae0],[.7,0xf0c020]]){const gx=(u-gu)*hw*2,gy=(v-.2)*hh*2;if(Math.abs(gx)+Math.abs(gy)<1.8)return gx<0&&gy<0?0xffffff:c}
      if(r<5.2){if(r>4.2)return 0xd9a43a;const L=[[0,-1.6],[-1.5,.2],[1.5,.2]];for(const[lx,ly]of L)if(Math.hypot(cx-lx,cy-ly)<1.35)return lx<0||ly<0?0x7ad84a:0x5fb83a;if(Math.abs(cx)<.6&&cy>.5&&cy<3)return 0x3a7a2a;return 0x3a1e0c}
      return null}},
  side:{n:'Andanças',base:0x6a4020,dark:0x3a2010,page:0xf2e6c8,rib:0x3a9a3a,el:'natur',
    f(u,v,X,Y){if(u<.09||u>.91||v<.07||v>.93)return(X+Y)&1?0x7a4a24:0x6a4020;const rv=.22+.62*u+.07*Math.sin(u*10),d=Math.abs(v-rv);
      if(d<.085)return BKH(X,Y,1)>.78?0x9ad0ff:d<.04?0x3a7ad0:0x4a8ae0;if(d<.12)return 0xc8b070;if(v<.2&&u>.55&&BKH(X,Y,2)>.5)return 0x9ad0f0;
      return BKH(X,Y,3)>.8?0x8ad860:v>rv?0x3f8a34:0x4f9a3a}},
  best:{n:'Bestiário',base:0x3f7a3a,dark:0x1e3a1a,page:0xece0bc,rib:0xa02020,el:'natur',
    f(u,v,X,Y,hw,hh){if(u<.16){return(Y%4==0)?0xc8a060:((X+Y)&1?0x6a4020:0x5a3418)}
      const ex=(u-.56)*hw*2,ey=(v-.5)*hh*2,rx=hw*.62,ry=hh*.42,e=ex*ex/(rx*rx)+ey*ey/(ry*ry);
      if(e<1){if(e>.78)return 0x1e3a1a;const ir=Math.hypot(ex/(ry*.95),ey/(ry*.95));if(ir<1){if(Math.abs(ex)<.9&&Math.abs(ey)<ry*.78)return 0x140808;if(ex<-1.5&&ex>-3&&ey<-1&&ey>-2.6)return 0xfff2c0;return ir<.45?0xffd040:ir<.75?0xf07a20:0xc02a10}return 0xe8d8a0}
      const sx=u*7+(Math.floor(v*8)&1)*.5,sy=v*8,fy=sy-Math.floor(sy),fx=sx-Math.floor(sx);if(fy>.78||Math.abs(fx-.5)>.44&&fy>.4)return 0x2a5a2a;return fy<.3?0x6aa84a:null}},
  ach:{n:'Conquistas',base:0x5a3418,dark:0x2e180a,page:0xf0e0c0,rib:0xc03030,clasp:1,el:'vigor',
    f(u,v,X,Y,hw,hh){for(const b of[.22,.5,.78]){const d=(v-b)*hh*2;if(Math.abs(d)<1.6){for(const r of[.22,.42,.62,.82])if(Math.abs((u-r)*hw*2)<1.1)return d<0?0xff8a7a:0xc03030;return d<-.6?0xffe08a:0xd9a43a}}
      return BKH(X,Y,4)>.86?0x6a4020:null}},
  codex:{n:'Códice',base:0x24308a,dark:0x101848,page:0xece4cc,rib:0xd9a43a,el:'raio',swirl:0xd9a43a,
    f(u,v,X,Y,hw,hh){if(u<.07||u>.93||v<.06||v>.94)return(X+Y)&1?0xd9a43a:0xb8862e;const mx=(u-.5)*hw*2,my=(v-.52)*hh*2,r=Math.hypot(mx,my);
      if(r<hw*.52){const cr=BKH(Math.round(mx/1.5),Math.round(my/1.5),5);return cr>.82?0x9a9aa8:mx>r*.45?0xa8a8b8:0xd8d8e4}if(r<hw*.6)return 0x4a5ab0;
      return BKH(X,Y,6)>.92?0xe8f0ff:BKH(X,Y,7)>.97?0x9ad0ff:null}},
  grim:{n:'Grimório',base:0x6a3a9a,dark:0x341a50,page:0xf0e2c8,rib:0xe0408a,el:'arcano',swirl:0xe0408a,
    f(u,v,X,Y,hw,hh){const mx=(u-.55)*hw*2,my=(v-.5)*hh*2,r=Math.hypot(mx,my),a=Math.atan2(my,mx);if(u<.12)return Y%5==0?0xd9a43a:0x4a2470;
      if(r<hw*.8&&Math.abs(Math.sin(a*1.5+r*.55))<.16)return r<hw*.25?0xffd0f0:0xd070c0;return BKH(X,Y,8)>.9?0x7a4aaa:null}}};
const hx3=h=>[h>>16&255,h>>8&255,h&255],shd=(h,k)=>{const c=hx3(h);return(Math.min(255,c[0]*k)<<16)|(Math.min(255,c[1]*k)<<8)|Math.min(255,c[2]*k)};
const BKC={};
// livro inclinado com espessura, páginas, fita e contorno
function bookArt(key){if(BKC[key])return BKC[key];const D=BKD[key],W=46,H=54,cv=document.createElement('canvas');cv.width=W;cv.height=H;const x=cv.getContext('2d'),im=x.createImageData(W,H),d=im.data;
  const cx=22.5,cy=22,hw=13.5,hh=17,a=.2,ca=Math.cos(a),sa=Math.sin(a),T=[-1.6,5],uv=(px,py)=>{const dx=px-cx,dy=py-cy;return[((dx*ca+dy*sa)/hw+1)/2,((-dx*sa+dy*ca)/hh+1)/2]},ins=q=>q[0]>=0&&q[0]<=1&&q[1]>=0&&q[1]<=1;
  const C=new Array(W*H).fill(-1),put=(X,Y,h)=>{if(X>=0&&Y>=0&&X<W&&Y<H)C[Y*W+X]=h};
  for(let Y=0;Y<H;Y++)for(let X=0;X<W;X++){const px=X+.5,py=Y+.5,q=uv(px,py);
    if(ins(q)){const[u,v]=q;let c=D.f(u,v,X,Y,hw,hh);if(c==null){c=D.base;const n=BKH(X,Y,9);if(n>.8)c=shd(c,1.1);else if(n<.15)c=shd(c,.9)}
      const e=Math.min(u*hw*2,v*hh*2,(1-u)*hw*2,(1-v)*hh*2);if(e<1){c=v*hh*2<1||u*hw*2<1?shd(c,1.3):shd(c,.7)}C[Y*W+X]=c;continue}
    for(let t=.12;t<=1.001;t+=.12){const q2=uv(px-T[0]*t,py-T[1]*t);if(!ins(q2))continue;if(q[0]<0)C[Y*W+X]=(Y%6<1)?0xd9a43a:shd(D.base,.62);else if(t>.82)C[Y*W+X]=D.dark;else C[Y*W+X]=(Math.round(t*7)&1)?D.page:shd(D.page,.86);break}}
  // fita marcadora saindo por baixo das páginas e fecho dourado
  const bot=(u)=>{const lx=(u*2-1)*hw,ly=hh;return[cx+lx*ca-ly*sa+T[0],cy+lx*sa+ly*ca+T[1]]};
  {const[bx,by]=bot(.62);for(let i=0;i<7;i++){put(Math.round(bx),Math.round(by)+i,D.rib);put(Math.round(bx)+1,Math.round(by)+i,shd(D.rib,.75))}put(Math.round(bx)-0,Math.round(by)+7,D.rib);put(Math.round(bx)+1,Math.round(by)+7,-1)}
  if(D.clasp){const[bx,by]=bot(.4);for(let i=0;i<3;i++)put(Math.round(bx),Math.round(by)+i,0xd9a43a);for(const[ox,oy]of[[-1,3],[1,3],[-1,4],[1,4],[0,5],[0,6],[1,6]])put(Math.round(bx)+ox,Math.round(by)+oy,oy==3?0xffe08a:0xd9a43a)}
  if(D.swirl){const hi=shd(D.swirl,1.35);for(let i=0;i<44;i++){const t=i/43,sx=2+t*10+Math.sin(t*9)*2.5,sy=4+t*16;put(Math.round(sx),Math.round(sy),D.swirl);put(Math.round(sx)+1,Math.round(sy),hi);const s2=W-3-t*8-Math.sin(t*8)*2,s2y=2+t*9;put(Math.round(s2),Math.round(s2y),D.swirl);put(Math.round(s2)-1,Math.round(s2y),hi)}}
  // contorno escuro
  const O=C.slice();for(let Y=0;Y<H;Y++)for(let X=0;X<W;X++){if(C[Y*W+X]>=0)continue;let n=0;for(const[ox,oy]of[[1,0],[-1,0],[0,1],[0,-1]]){const X2=X+ox,Y2=Y+oy;if(X2>=0&&Y2>=0&&X2<W&&Y2<H&&C[Y2*W+X2]>=0)n=1}if(n)O[Y*W+X]=0x1a0d08}
  for(let i=0;i<W*H;i++)if(O[i]>=0){const c=hx3(O[i]);d[i*4]=c[0];d[i*4+1]=c[1];d[i*4+2]=c[2];d[i*4+3]=255}
  x.putImageData(im,0,0);return BKC[key]={cv,url:cv.toDataURL()}}
// capa reta (para a animação de abrir)
function bookFlat(key){const k='f_'+key;if(BKC[k])return BKC[k];const D=BKD[key],W=60,H=78,cv=document.createElement('canvas');cv.width=W;cv.height=H;const x=cv.getContext('2d'),im=x.createImageData(W,H),dd=im.data,hw=W/2,hh=H/2;
  for(let Y=0;Y<H;Y++)for(let X=0;X<W;X++){const u=(X+.5)/W,v=(Y+.5)/H;let c=D.f(u,v,X,Y,hw*.62,hh*.62);if(c==null){c=D.base;const n=BKH(X,Y,9);if(n>.8)c=shd(c,1.1);else if(n<.15)c=shd(c,.9)}
    if(X<2||Y<2)c=shd(c,1.25);if(X>W-3||Y>H-3)c=shd(c,.65);const q=hx3(c),j=(Y*W+X)*4;dd[j]=q[0];dd[j+1]=q[1];dd[j+2]=q[2];dd[j+3]=255}
  x.putImageData(im,0,0);return BKC[k]={cv,url:cv.toDataURL()}}

// ---------- retratos 3D das criaturas (renderizados uma vez e guardados)
const PTK='vr16_pt_'+VR_VERSION,PTC={},PTQ=[];let PTRT=null,PTCAM=null,PTS={};try{PTS=JSON.parse(localStorage.getItem(PTK)||'{}');Object.assign(PTC,PTS);for(let i=localStorage.length-1;i>=0;i--){const k=localStorage.key(i);if(k&&k.startsWith('vr16_pt_')&&k!=PTK)localStorage.removeItem(k)}}catch(e){}
function portrait(type,sil){const key=type+(sil?'#s':'');if(PTC[key])return PTC[key];if(!PTQ.includes(key))PTQ.push(key);return null}
function ptRender(key){const sil=key.endsWith('#s'),type=key.replace('#s',''),t=BOSS[type]||MT[type];if(!t||!MDL[t.m])return PTC[key]='';
  const N=168;if(!PTRT){PTRT=new THREE.WebGLRenderTarget(N,N);PTCAM=new THREE.PerspectiveCamera(30,1,.1,60)}
  let m;try{m=MDL[t.m]();if(t.w)weapon(m,t.w,null,null,t.wh=='L'?m.hL:m.hR);animate(m,.016,1,{v:0});animate(m,.3,1.3,{v:0})}catch(e){return PTC[key]=''}
  const g=m.g,Y0=-600;g.position.set(0,Y0,0);g.rotation.y=.55;sc.add(g);g.updateMatrixWorld(true);const bb=new THREE.Box3().setFromObject(g),sz=new THREE.Vector3(),ct=new THREE.Vector3();bb.getSize(sz);bb.getCenter(ct);
  const r=Math.max(sz.x,sz.y*1.05,sz.z)*.66,dist=r/Math.tan(15*PI/180);PTCAM.position.set(ct.x+dist*.18,ct.y+dist*.16,ct.z+dist);PTCAM.lookAt(ct);PTCAM.near=dist*.3;PTCAM.far=dist*3;PTCAM.updateProjectionMatrix();
  const sv={si:SUN.intensity,hi:HEM.intensity,hc:HEM.color.getHex(),hg:HEM.groundColor.getHex(),fi:FILL.intensity,sp:SUN.position.clone(),st:SUN.target.position.clone(),au:rd.shadowMap.autoUpdate,cc:rd.getClearColor(new THREE.Color()).getHex(),ca:rd.getClearAlpha(),fog:sc.fog,tc:SHU.uTC.value.clone()};
  SUN.intensity=1.15;HEM.intensity=.9;HEM.color.setHex(0xdfeaff);HEM.groundColor.setHex(0x6a5a40);FILL.intensity=.35;SUN.position.set(ct.x+30,Y0+60,ct.z+40);SUN.target.position.copy(ct);SUN.target.updateMatrixWorld();rd.shadowMap.autoUpdate=false;sc.fog=null;SHU.uTC.value.setRGB(0,0,0);
  const vis=[];for(const o of sc.children)if(o!==g&&o.visible&&!o.isLight){vis.push(o);o.visible=false}
  rd.setRenderTarget(PTRT);rd.setClearColor(0,0);rd.clear();try{rd.render(sc,PTCAM)}catch(e){}const px=new Uint8Array(N*N*4);rd.readRenderTargetPixels(PTRT,0,0,N,N,px);rd.setRenderTarget(null);
  for(const o of vis)o.visible=true;SUN.intensity=sv.si;HEM.intensity=sv.hi;HEM.color.setHex(sv.hc);HEM.groundColor.setHex(sv.hg);FILL.intensity=sv.fi;SUN.position.copy(sv.sp);SUN.target.position.copy(sv.st);SUN.target.updateMatrixWorld();rd.shadowMap.autoUpdate=sv.au;rd.setClearColor(sv.cc,sv.ca);sc.fog=sv.fog;SHU.uTC.value.copy(sv.tc);
  sc.remove(g);g.traverse(o=>{if(o.isMesh&&o.geometry)o.geometry.dispose()});
  // recorta pelo desenho e reduz para 56 px (pixel art) com contorno escuro
  let x0=N,y0=N,x1=-1,y1=-1;for(let Y=0;Y<N;Y++)for(let X=0;X<N;X++)if(px[(Y*N+X)*4+3]>40){if(X<x0)x0=X;if(X>x1)x1=X;if(Y<y0)y0=Y;if(Y>y1)y1=Y}
  if(x1<0)return PTC[key]='';const side=Math.max(x1-x0,y1-y0)*1.08+2,mx=(x0+x1)/2,my=(y0+y1)/2,sx0=mx-side/2,sy0=my-side/2;
  const S2=56,cv=document.createElement('canvas');cv.width=cv.height=S2;const x=cv.getContext('2d'),im=x.createImageData(S2,S2),d=im.data,A=new Uint8Array(S2*S2),st=side/S2;
  for(let Y=0;Y<S2;Y++)for(let X=0;X<S2;X++){let r_=0,g_=0,b_=0,a_=0,n_=0;for(let j=0;j<2;j++)for(let i=0;i<2;i++){const qx=Math.floor(sx0+(X+.25+i*.5)*st),qy=Math.floor(sy0+(Y+.25+j*.5)*st);n_++;if(qx<0||qy<0||qx>=N||qy>=N)continue;const o=(qy*N+qx)*4;if(px[o+3]>40){r_+=px[o];g_+=px[o+1];b_+=px[o+2];a_++}}
    if(a_>=2){const o=((S2-1-Y)*S2+X)*4;A[(S2-1-Y)*S2+X]=1;if(sil){d[o]=58;d[o+1]=34;d[o+2]=20}else{d[o]=Math.min(255,r_/a_*1.08);d[o+1]=Math.min(255,g_/a_*1.08);d[o+2]=Math.min(255,b_/a_*1.08)}d[o+3]=255}}
  for(let Y=0;Y<S2;Y++)for(let X=0;X<S2;X++){if(A[Y*S2+X])continue;if(A[Y*S2+X-1]&&X>0||A[Y*S2+X+1]&&X<S2-1||Y>0&&A[(Y-1)*S2+X]||Y<S2-1&&A[(Y+1)*S2+X]){const o=(Y*S2+X)*4;d[o]=26;d[o+1]=13;d[o+2]=8;d[o+3]=255}}
  x.putImageData(im,0,0);const u=cv.toDataURL();try{PTS[key]=u;localStorage.setItem(PTK,JSON.stringify(PTS))}catch(e){}return PTC[key]=u}
function ptPump(){if(!PTQ.length||!run)return;const key=PTQ.shift();if(PTC[key]!=null)return;let u='';try{u=ptRender(key)}catch(e){PTC[key]=''}document.querySelectorAll(`img[data-pt="${key}"]`).forEach(im=>{if(u)im.src=u;else im.replaceWith(Object.assign(document.createElement('i'),{className:'emo',textContent:'❔'}))})}

// descrições que faltavam no bestiário
for(const[k,v]of Object.entries({sheep:'Ovelhas das fazendas da Planície. Fogem de qualquer barulho e dão lã e carne.',cow:'Vacas mansas que pastam perto das fazendas. Marta faz o melhor guisado de Aldoria com a carne delas.',
  wdeer:'Raro e arisco, o Cervo Branco só aparece nas clareiras mais antigas da floresta. Dizem que dá sorte vê-lo.',deer:'Cervos ágeis que saltam entre as árvores ao menor sinal de perigo.',rabbit:'Coelhos rápidos que se escondem no capim. Difíceis de pegar, fáceis de assustar.',
  fox:'Raposas curiosas que seguem viajantes de longe, de olho no que cai das mochilas.',tfrog:'Sapinhos inofensivos do brejo. Coaxam em coro quando a chuva vem.',totem:'Pilar de pedra entalhado pela Sombra. Não ataca, mas protege quem o ergueu — destrua-o primeiro.',
  bshield:'Bandido de escudo largo que bloqueia golpes de frente. Ataque pelos lados ou quebre a guarda com golpes pesados.',bbrute:'O maior dos bandidos: lento, mas cada pancada derruba. Desvie e contra-ataque.',
  bshaman:'Feiticeiro dos bandidos. Cura os aliados e lança maldições de longe — derrube-o antes dos outros.',bassassin:'Some nas sombras e aparece pelas costas com adagas envenenadas. Fique de olho no próprio rastro.',
  skelwar:'Soldados mortos que ainda lembram como empunhar espada e escudo. Batem forte e não sentem dor.',skelmage:'Esqueletos que guardam restos de magia antiga. Lançam orbes de longe e se teleportam quando cercados.',
  zbrute:'Zumbi do tamanho de uma porta. Lento, mas o soco abala o chão em volta.',cultist:'Servos encapuzados da Sombra — os homens de capuz negro que pagam em ouro antigo. Invocam ajuda e lançam magia sombria.',
  sfox:'Raposa branca dos Picos Gelados, quase invisível na neve.',goat:'Cabras-montesas que escalam os penhascos gelados sem escorregar.',antelope:'Antílopes velozes da Savana Rubra. Correm em manadas ao entardecer.',
  camel:'Camelos das Dunas de Âmbar. Aguentam dias sem água e carregam as caravanas.',pcrab:'Caranguejinhos da praia que andam de lado e somem na areia.',cfox:'Raposa de pelo cristalino que brilha à luz da lua no Vale de Cristal.',
  sylvara:'A antiga guardiã das árvores rubras. Desde que a Sombra a tocou, fala com a voz das folhas que caem e protege o fragmento do selo com pilares.',
  vorn:'O primeiro servo do Rei Sem Nome. O Lich do Gelo mantém a Cripta Gélida congelada e seus esqueletos de pé com o poder do fragmento.',
  juba:'Rei da Savana Rubra, de juba em chamas desde que o fragmento do selo se prendeu nela. Investe em estouros e chama as hienas.',
  sarkhan:'O Escorpião-Imperador envenena a areia por onde passa e esconde o fragmento do selo na ponta da cauda.',
  carapaca:'Caranguejo do tamanho de uma casa que arrastou um fragmento do selo para o fundo do recife. Suas marés derrubam quem fica parado.',
  nihil:'O Arauto do Vazio, voz do Rei Sem Nome em Aldoria. Abriu uma fenda para o nada e guarda ali o último fragmento do selo.'}))if(!BESTD[k])BESTD[k]=v;
// ---------- dados do livro
const QBS=[{k:'main',n:'Missões Principais',bk:'main'},{k:'side',n:'Missões Secundárias',bk:'side'},{k:'best',n:'Bestiário',bk:'best'},{k:'ach',n:'Conquistas',bk:'ach'},{k:'codex',n:'Códice',bk:'codex'}];
const QB={s:'main',p:0,pages:[],flip:0};
const QIC={talk:'💬',wp:'🌀',kill:'⚔️',boss:'☠️',collect:'🧺',interact:'✋',hire:'🍺',lore:'📖',elite:'⭐',zone:'📍',dungeon:'🏰',hunt:'🎯'};
const REGEL={vila:'aco',plan:'vigor',flor:'arcano',mata:'natur',mang:'alma',cald:'fogo',outono:'sangue',neve:'gelo',savana:'vigor',deserto:'aco',costa:'vento',cristal:'arcano'};
const AIDESC={charger:'Investe em linha reta quando você está a média distância. Desvie para o lado.',melee:'Luta corpo a corpo e cerca a presa com o bando.',ranged:'Ataca de longe e recua quando você se aproxima. Feche a distância.',hopper:'Salta sobre a presa. Recue quando ele pular.',animal:'Pacífico: foge quando é atacado. Rende carne e couro para a cozinha.'};
const qName=q=>q.n.replace(/\s*\(\d+\/\d+\)$/,'');
const regN=id=>{const r=REG.find(r=>r.id==id);return r?r.n:''},regC=id=>{const r=REG.find(r=>r.id==id);return r?r.map:'#888'};
const npcN=id=>{const n=NPC.find(n=>n.id==id);return n?n.nm.replace(' · ',', '):''};
function qGiver(q){if(QGIV[q.id])return QGIV[q.id];if(q.npc)return q.npc;const m=q.id.match(/^(x_[a-z]+|c_[a-z]+)\d$/);if(m){const f=QD.find(o=>o.id==m[1]+'1');if(f&&f.npc)return f.npc}return null}
function qMobT(q){const m=Array.isArray(q.mob)?q.mob[0]:q.mob;return q.t=='boss'?q.boss:(MT[m]||BOSS[m])?m:null}
const esc=s=>String(s).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'})[c]);
function ptImg(type,sil,cls){const key=type+(sil?'#s':''),u=PTC[key];return u?`<img class="px ${cls||''}" src="${u}" alt="">`:`<img class="px ${cls||''}" data-pt="${key}" alt="">`}
function qIcon(q){const t=qMobT(q);if(t&&(q.t=='kill'||q.t=='boss'||q.t=='hunt'))return ptImg(t,0,'qpi');const u=pixIcon(QIC[q.t]||'📜',REGEL[q.reg]||'aco',1);return u?`<img class="px qpi" src="${u}" alt="">`:`<i class="emo qpi">${QIC[q.t]||'📜'}</i>`}
function qStageTxt(q){const s=QS[q.id];if(!q.stg||!q.stg.length)return'';return`<small class="qstg">Etapa ${Math.min(q.stg.length,(s.stg|0)+1)} de ${q.stg.length}</small>`}
function questPage(q,chap){const s=QS[q.id],ok=s.st==2,giv=qGiver(q),rw=q.rw||{},pr=q.n_>1&&!ok?Math.min(1,s.p/q.n_):ok?1:0;
  return`<div class="qpg"><div class="qtop">${chap?`<span>${chap}</span>`:`<span style="color:${regC(q.reg)}">◆ ${regN(q.reg)}</span>`}<em class="${ok?'ok':'on'}">${ok?'✓ Concluída':'● Ativa'}</em></div>
    <div class="qph">${qIcon(q)}<div><b>${esc(qName(q))}</b><small>${q.cat=='main'?'Missão principal':'Missão secundária'} · ${regN(q.reg)}</small>${qStageTxt(q)}</div></div>
    <p class="qctx">${esc(QCTX[q.id]||q.d)}</p>
    <div class="qobj"><b>${ok?'Feito':'Objetivo'}</b><p>${esc(q.d)}</p>${q.n_>1?`<div class="qbar"><i style="width:${pr*100}%"></i><span>${ok?q.n_:s.p}/${q.n_}</span></div>`:''}</div>
    <div class="qmeta">${giv&&npcN(giv)?`<span>👤 ${esc(npcN(giv))}</span>`:''}<span>📍 ${regN(q.reg)}</span></div>
    <div class="qrw"><b>Recompensa</b>${rw.xp?`<span>✨ ${rw.xp} XP</span>`:''}${rw.gold?`<span>🪙 ${rw.gold}</span>`:''}${rw.item?'<span>🎁 Equipamento</span>':''}${q.cat=='main'?'<span>⭐ +1 ponto de habilidade</span>':''}</div>
    ${!ok&&typeof qPos=='function'&&qPos(q)?`<button class="qmap" data-qm="${q.id}">🗺️ Ver no mapa</button>`:''}</div>`}
// onde cada criatura aparece
function bestWhere(k){const L=[];for(const r of REG){const id=r.id;if((SPAWN[id]||[]).includes(k)||(FAUNA[id]||[]).includes(k)||(typeof NIGHTB!='undefined'&&(NIGHTB[id]||[]).includes(k)&&!L.includes(r.n)))L.push(r.n)}
  if(BOSS[k])L.push(regN(REG[regionAt(BOSS[k].x,BOSS[k].z)].id));if(typeof DNG!='undefined')for(const D of DNG)if((D.mob||[]).includes(k)||D.boss==k)L.push(D.n);return[...new Set(L)]}
function bestOrder(){const L=[],add=k=>{if((MT[k]||BOSS[k])&&!L.includes(k))L.push(k)};
  for(const r of REG){for(const k of SPAWN[r.id]||[])add(k);for(const k of FAUNA[r.id]||[])add(k);for(const b in BOSS)if(REG[regionAt(BOSS[b].x,BOSS[b].z)].id==r.id&&b!='ignarok')add(b)}
  for(const k in MT)add(k);add('ignarok');return L}
const bestSeen=k=>(BEST[k]||0)>0||!!(BOSS[k]&&P.st.bmk&&P.st.bmk[k]);
function bestPage(k){const t=MT[k]||BOSS[k],seen=bestSeen(k),n=BEST[k]||0,boss=!!BOSS[k],W=bestWhere(k);
  if(!seen)return`<div class="qpg bpg"><div class="qtop"><span>${boss?'☠ Chefe':t.passive?'🐾 Animal':'⚔ Criatura'}</span><em class="lk">Não registrado</em></div><div class="bph">${ptImg(k,1,'bpi')}</div><b class="bnm">???</b>
    <p class="qctx">${W.length?'Visto em: '+W.join(', ')+'. ':''}${boss?'Enfrente este chefe para registrar suas mecânicas.':'Derrote esta criatura para registrá-la no bestiário.'}</p></div>`;
  let h=`<div class="qpg bpg"><div class="qtop"><span>${boss?'☠ Chefe':t.passive?'🐾 Animal':'⚔ Criatura'}</span><em class="ok">${n} abatido${n==1?'':'s'}</em></div><div class="bph">${ptImg(k,0,'bpi')}</div><b class="bnm">${esc(t.n)}</b>
    <small class="bwh">${W.length?'📍 '+W.join(' · '):''}</small><p class="qctx">${esc(BESTD[k]||'')}</p>
    <div class="bst"><span>❤️ ${Math.round(t.hp)}</span>${t.dmg?`<span>⚔️ ${Math.round(t.dmg)}</span>`:''}<span>💨 ${(+t.sp).toFixed(1)}</span>${t.xp?`<span>✨ ${t.xp} XP</span>`:''}</div>`;
  if(!boss)h+=`<p class="bai">${AIDESC[t.passive?'animal':t.ai]||AIDESC.melee}</p>`;
  else{const seenM=(P.st.bmk||{})[k]||{};h+='<div class="bmk"><b>Mecânicas</b>'+BMKEYS(k).map(m=>{const M=BMECH[m];return seenM[m]?`<p><u>${M.ic} ${M.n}</u> — ${M.d}</p>`:`<p class="lk"><u>❔ ???</u> — ainda não visto</p>`}).join('')+'</div>'}
  return h+'</div>'}
function idxPage(title,sub,lines){return`<div class="qpg qidx"><div class="qih"><b>${title}</b>${sub?`<small>${sub}</small>`:''}</div><div class="qil">${lines.join('')}</div></div>`}
function chunkIdx(title,sub,lines,per){const P_=[];for(let i=0;i<Math.max(1,lines.length);i+=per)P_.push(idxPage(i?title+' (cont.)':title,i?'':sub,lines.slice(i,i+per)));return P_}
function qbBuild(){const s=QB.s,pages=[];
  if(s=='main'){const L=[],QP=[];let pn=0;const all=QCHAP.flatMap(c=>c.ids);const extra=QD.filter(q=>q.cat=='main'&&!all.includes(q.id));
    const chs=QCHAP.map(c=>({...c,qs:c.ids.map(id=>QIDX[id]).filter(Boolean)}));if(extra.length)chs.push({n:'Outras',d:'',qs:extra});
    for(const c of chs){const vis=c.qs.filter(q=>QS[q.id].st);L.push(`<h5>${c.n}</h5>`);if(!vis.length){L.push('<p class="qil-lk">🔒 Ainda não começou</p>');continue}for(const q of vis){QP.push([q,c.n]);L.push(`<p class="qil-q ${QS[q.id].st==2?'ok':''}" data-go="Q${q.id}">${QS[q.id].st==2?'✓':'◆'} ${esc(qName(q))}</p>`)}}
    const idx=chunkIdx('Crônicas de Aldoria','Ato I — A Sombra sobre Aldoria',L,15);pages.push(...idx.map(h=>({h})));for(const[q,c]of QP)pages.push({h:questPage(q,c),id:'Q'+q.id})}
  else if(s=='side'){const L=[],QP=[];const side=QD.filter(q=>q.cat=='side'&&QS[q.id].st&&(!q.cls||q.cls==P.cls));
    const ord=[...side.filter(q=>QS[q.id].st==1),...side.filter(q=>QS[q.id].st==2)];
    for(const r of REG){const L2=ord.filter(q=>q.reg==r.id);if(!L2.length)continue;L.push(`<h5 style="color:${r.map}">${r.n}</h5>`);for(const q of L2)L.push(`<p class="qil-q ${QS[q.id].st==2?'ok':''}" data-go="Q${q.id}">${QS[q.id].st==2?'✓':'◆'} ${esc(qName(q))}</p>`)}
    if(!ord.length)L.push('<p class="qil-lk">Nenhuma missão secundária ainda. Converse com os moradores e explore as regiões: quem precisa de ajuda tem um ❗ sobre a cabeça.</p>');
    pages.push(...chunkIdx('Andanças','Missões secundárias · '+ord.filter(q=>QS[q.id].st==2).length+'/'+ord.length+' concluídas',L,15).map(h=>({h})));for(const q of ord)pages.push({h:questPage(q,''),id:'Q'+q.id})}
  else if(s=='best'){const ks=bestOrder(),L=[];let cur='';const known=ks.filter(bestSeen).length;
    for(const k of ks){const t=MT[k]||BOSS[k],sn=bestSeen(k);L.push(`<p class="qil-q ${sn?'':'lk'}" data-go="B${k}">${BOSS[k]?'☠':t.passive?'🐾':'⚔'} ${sn?esc(t.n):'???'}${sn&&BEST[k]?` <i>×${BEST[k]}</i>`:''}</p>`)}
    pages.push(...chunkIdx('Bestiário',known+'/'+ks.length+' criaturas registradas',L,15).map(h=>({h})));for(const k of ks)pages.push({h:bestPage(k),id:'B'+k})}
  else if(s=='ach'){const A=ACH.map(a=>{const ok=P.ach.has(a.id);return`<div class="qach ${ok?'ok':'lk'}" ${ok?`data-ti="${esc(a.t)}"`:''}><b>${ok?'🏆':'🔒'} ${esc(a.n)}</b><small>título “${esc(a.t)}”${P.title==a.t?' · em uso':ok?' · toque para usar':''}</small><p>${esc(a.d)}</p></div>`});
    for(let i=0;i<A.length;i+=5)pages.push({h:`<div class="qpg qidx"><div class="qih"><b>Conquistas${i?' (cont.)':''}</b>${i?'':`<small>${P.ach.size}/${ACH.length} · título: ${esc(P.title||'nenhum')}</small>`}</div>${A.slice(i,i+5).join('')}</div>`})}
  else{const F=LORE.filter(l=>LORE_FOUND.has(l.id)),L=LORE.map(l=>LORE_FOUND.has(l.id)?`<p class="qil-q" data-go="L${l.id}">📖 ${esc(l.t)}</p>`:'<p class="qil-q lk">🔒 ???</p>');
    pages.push(...chunkIdx('Códice',F.length+'/'+LORE.length+' registros da história de Aldoria',L,15).map(h=>({h})));for(const l of F)pages.push({h:`<div class="qpg"><div class="qtop"><span>📖 Registro</span></div><div class="qph"><img class="px qpi" src="${pixIcon('📜','raio',1)||''}" alt=""><div><b>${esc(l.t)}</b><small>${regN(REG[regionAt(l.x,l.z)].id)}</small></div></div><p class="qctx lore">${esc(l.txt)}</p></div>`,id:'L'+l.id})}
  if(pages.length%2)pages.push({h:'<div class="qpg qend"><i>✦</i></div>'});QB.pages=pages;QB.p=Math.min(QB.p,pages.length-2);if(QB.p<0)QB.p=0;QB.p-=QB.p%2}
function qbPaint(){const L=QB.pages[QB.p],R_=QB.pages[QB.p+1];$('qbL').innerHTML=(L?L.h:'')+`<u class="qpn">${QB.p+1}</u>`;$('qbR').innerHTML=(R_?R_.h:'')+`<u class="qpn">${QB.p+2}</u>`;
  for(const im of document.querySelectorAll('#qbook img[data-pt]')){const k=im.dataset.pt;if(PTC[k])im.src=PTC[k];else if(PTC[k]==null&&!PTQ.includes(k))PTQ.unshift(k)}
  $('qbPrev').classList.toggle('off',QB.p<=0);$('qbNext').classList.toggle('off',QB.p+2>=QB.pages.length);const S=QBS.find(s=>s.k==QB.s),D=BKD[S.bk];
  const b=$('qbk');b.style.setProperty('--lc','#'+D.base.toString(16).padStart(6,'0'));b.style.setProperty('--ld','#'+D.dark.toString(16).padStart(6,'0'));
  $('qbTabs').innerHTML=QBS.map(s=>`<button class="qtab ${s.k==QB.s?'on':''}" data-s="${s.k}" title="${s.n}"><img class="px" src="${bookArt(s.bk).url}" alt=""><span>${s.n}</span></button>`).join('')}
function qbRender(){if(UI.open!='qbook')return;qbBuild();qbPaint()}
function qbGo(id){const i=QB.pages.findIndex(p=>p.id==id);if(i<0)return;const t=i-(i%2);if(t==QB.p)return;qbFlip(t>QB.p?1:-1,t)}
function qbFlip(dir,target){if(QB.flip)return;const np=target!=null?target:QB.p+2*dir;if(np<0||np>=QB.pages.length)return;QB.flip=1;snd(dir>0?900:760,.06,'triangle');setTimeout(()=>snd(420,.05,'sine'),70);BOOK3.fl=1;
  const out=$(dir>0?'qbR':'qbL'),inn=$(dir>0?'qbL':'qbR');out.style.transformOrigin=dir>0?'left center':'right center';inn.style.transformOrigin=dir>0?'right center':'left center';
  const done=()=>{QB.flip=0;out.style.transform=inn.style.transform=''};
  const a=out.animate([{transform:'rotateY(0deg)',filter:'brightness(1)'},{transform:`rotateY(${dir>0?-90:90}deg)`,filter:'brightness(.6)'}],{duration:170,easing:'ease-in'});
  a.onfinish=()=>{QB.p=np;qbPaint();const b=inn.animate([{transform:`rotateY(${dir>0?90:-90}deg)`,filter:'brightness(.6)'},{transform:'rotateY(0deg)',filter:'brightness(1)'}],{duration:210,easing:'ease-out'});b.onfinish=done;b.oncancel=done};a.oncancel=done}
function qbSec(k){if(k==QB.s)return;QB.s=k;QB.p=0;qbBuild();if(k=='main'||k=='side'){const q=QD.find(q=>q.cat==k&&act(q.id)&&(!q.cls||q.cls==P.cls));if(q){const i=QB.pages.findIndex(p=>p.id=='Q'+q.id);if(i>=0)QB.p=i-(i%2)}}
  qbPaint();const b=$('qbk');b.classList.remove('sw');void b.offsetWidth;b.classList.add('sw');BOOK3.key=QBS.find(s=>s.k==k).bk;BOOK3.dirty=1;snd(520,.08,'triangle')}
// ---------- abrir / fechar
function openQBook(sec){if(!run||DLG)return;if(sec)QB.s=sec;openWin('qbook');document.body.classList.add('invo');qbBuild();
  if(!sec&&(QB.s=='main'||QB.s=='side')){const q=QD.find(q=>q.cat==QB.s&&act(q.id)&&(!q.cls||q.cls==P.cls));if(q){const i=QB.pages.findIndex(p=>p.id=='Q'+q.id);if(i>=0)QB.p=i-(i%2)}}
  qbPaint();const S=QBS.find(s=>s.k==QB.s);bookOpenFx($('qbk'),S.bk);BOOK3.key=S.bk;BOOK3.dirty=1;INV_OPEN.rot=0;
  requestAnimationFrame(()=>heroFrame($('qbStage'),.72))}
// enquadra o herói inteiro dentro de um elemento da tela (altura real do modelo)
function heroFrame(el,fill){const r=el.getBoundingClientRect();if(r.height<40)return;const g=P.m.g,ry=g.rotation.y;g.updateMatrixWorld(true);const bb=new THREE.Box3().setFromObject(g),Hh=Math.max(1.6,bb.max.y-bb.min.y),mid=(bb.max.y+bb.min.y)/2-P.y;
  const f=cam.fov*PI/180,d=cl(Hh*innerHeight/(fill*r.height*2*Math.tan(f/2)),2.6,14),Vh=2*d*Math.tan(f/2),cx=(r.left+r.right)/2,cy=(r.top+r.bottom)/2;
  INV_OPEN.dd=d;INV_OPEN.off=.5-cx/innerWidth;INV_OPEN.oy=.5-cy/innerHeight+(1.6-mid)/Vh*.85}
function bookOpenFx(el,key){const c=el.querySelector('.qcov');if(!c)return;c.style.backgroundImage=`url(${bookFlat(key).url})`;el.classList.remove('op');void el.offsetWidth;el.classList.add('op');
  sweep(260,900,.35,'triangle',.025);setTimeout(()=>{snd(300,.08,'square');snd(180,.1,'triangle')},320);setTimeout(()=>sweep(1200,500,.18,'sine',.02),520)}
openJournal=function(){openQBook()};
// ---------- janela
document.body.insertAdjacentHTML('beforeend',`<div id="qbook" class="win"><div class="qbw"><div id="qbStage"><p class="qbh">📖 Lendo…</p></div>
  <div id="qbk" class="qbk"><div class="pg bk-l" id="qbL"></div><div class="pg bk-r" id="qbR"></div><div class="qcov"></div>
  <button id="qbPrev" class="qbn">◀</button><button id="qbNext" class="qbn">▶</button><div id="qbTabs"></div><button class="wx">✕</button></div></div></div>`);
{const W=$('qbook');W.addEventListener('click',e=>{if(e.target===W||e.target.classList.contains('qbw')||e.target.closest('.wx')){closeAll();return}
    const t=e.target.closest('[data-s]');if(t){qbSec(t.dataset.s);return}if(e.target.closest('#qbPrev')){qbFlip(-1);return}if(e.target.closest('#qbNext')){qbFlip(1);return}
    const g=e.target.closest('[data-go]');if(g){qbGo(g.dataset.go);return}
    const m=e.target.closest('[data-qm]');if(m){const q=QIDX[m.dataset.qm],p=q&&qPos(q);if(p){closeAll();openMap(false);if(typeof MZ!='undefined'){MZ.cx=p[0];MZ.cz=p[1];mzSet(3.2)}}return}
    const ti=e.target.closest('[data-ti]');if(ti){P.title=P.title==ti.dataset.ti?'':ti.dataset.ti;hud();qbRender();save();return}});
  let sx=null,sy=0;const bk=$('qbk');bk.addEventListener('pointerdown',e=>{sx=e.clientX;sy=e.clientY});bk.addEventListener('pointerup',e=>{if(sx==null)return;const dx=e.clientX-sx,dy=e.clientY-sy;sx=null;if(Math.abs(dx)>50&&Math.abs(dx)>Math.abs(dy)*1.4)qbFlip(dx<0?1:-1)})}
const _closeAll161=closeAll;closeAll=function(){const was=UI.open;_closeAll161();$('qbook').classList.remove('on');if(was=='qbook'||was=='tree')snd(240,.1,'triangle')};
addEventListener('keydown',e=>{if(UI.open!='qbook')return;if(e.code=='ArrowRight'||e.code=='KeyD')qbFlip(1);else if(e.code=='ArrowLeft'||e.code=='KeyA')qbFlip(-1)});
// ---------- botões do HUD com livros animados
$('treeb').insertAdjacentHTML('afterend',`<button id="qbkb" title="Livro de Missões (J)"><img class="px bkic" src="${bookArt('main').url}" alt=""></button>`);
{const tb=$('treeb');tb.innerHTML=`<img class="px bkic" src="${bookArt('grim').url}" alt="">`;const jb=$('jrnb');if(jb)jb.innerHTML=`<i><img class="px" src="${bookArt('main').url}" alt="" style="width:1.3em;height:1.3em;vertical-align:middle"></i>Livro de Missões`}
const bkPop=b=>{if(!b)return;b.classList.remove('pop');void b.offsetWidth;b.classList.add('pop')};
$('qbkb').addEventListener('click',e=>{e.stopPropagation();bkPop($('qbkb'));openQBook()});
const _openTree161=openTree;openTree=function(){_openTree161.apply(this,arguments);if(UI.open!='tree')return;bkPop($('treeb'));const b=document.querySelector('#tree .book');if(b){if(!b.querySelector('.qcov'))b.insertAdjacentHTML('beforeend','<div class="qcov"></div>');bookOpenFx(b,'grim')}BOOK3.key='grim';BOOK3.dirty=1};
// avisa no botão quando uma missão muda
const _qCheck161=qCheck;qCheck=function(q){const was=QS[q.id]&&QS[q.id].st,r=_qCheck161.apply(this,arguments);if(QS[q.id]&&QS[q.id].st!=was)$('qbkb').classList.add('nw');return r};
$('qbkb').addEventListener('click',()=>$('qbkb').classList.remove('nw'));

// ---------- o herói segura o livro aberto
const BOOK3={g:null,key:'main',dirty:1,k:0,fl:0,pg:null,hid:[]};
function book3Build(){const D=BKD[BOOK3.key];if(BOOK3.g){BOOK3.g.parent&&BOOK3.g.parent.remove(BOOK3.g);BOOK3.g.traverse(o=>o.geometry&&o.geometry.dispose())}
  const g=new THREE.Group(),k=new Bake(),cb=D.base,cd=D.dark,pg=D.page,gd=0xd9a43a;
  for(const s of[-1,1]){k.box(.36,.035,.5,s*.19,0,0,cb,{rz:s*.16}).box(.37,.04,.04,s*.19,.005,.25,gd,{rz:s*.16}).box(.37,.04,.04,s*.19,.005,-.25,gd,{rz:s*.16});k.box(.33,.06,.46,s*.175,.045,0,pg,{rz:s*.12});for(let i=0;i<3;i++)k.box(.22,.012,.012,s*(.12+i*.03),.08,-.12+i*.1,0x9a8a6a,{rz:s*.12})}
  for(const s of[-1,1])k.box(.15,.014,.15,s*.2,-.024,0,D.rib==0xd9a43a?0xffe08a:0xd9a43a,{rz:s*.16}).box(.08,.016,.08,s*.2,-.03,0,D.rib,{rz:s*.16});k.box(.05,.05,.5,0,-.01,0,cd).box(.03,.12,.03,.08,-.06,.24,D.rib).box(.03,.05,.03,.08,-.13,.25,D.rib);
  g.add(k.mesh(MV));const pk=new Bake();pk.box(.32,.01,.44,.16,0,0,shd(pg,.95));const pv=new THREE.Group();pv.add(pk.mesh(MV));pv.position.set(0,.08,0);g.add(pv);BOOK3.pg=pv;
  g.traverse(o=>{if(o.isMesh)o.castShadow=true});BOOK3.g=g;BOOK3.dirty=0}
function bookPose(){const now=performance.now(),dt=Math.min(.05,(now-(BOOK3.t||now))/1000);BOOK3.t=now;const want=(UI.open=='qbook'||UI.open=='tree')&&run&&!P.dead;BOOK3.k=cl(BOOK3.k+(want?dt*4:-dt*5),0,1);const m=P.m;
  if(BOOK3.k<=0){if(BOOK3.g&&BOOK3.g.parent){BOOK3.g.parent.remove(BOOK3.g);for(const o of BOOK3.hid)o.visible=true;BOOK3.hid=[]}return}
  if(!BOOK3.g||BOOK3.dirty){const par=BOOK3.g&&BOOK3.g.parent;book3Build();if(par)par.add(BOOK3.g)}if(BOOK3.g.parent!==m.torso){m.torso.add(BOOK3.g);for(const h of[m.hL,m.hR])for(const o of h.children)if(o.visible){o.visible=false;BOOK3.hid.push(o)}if(typeof TCH!='undefined'&&TCH.g&&TCH.g.visible){TCH.g.visible=false;BOOK3.hid.push(TCH.g)}}
  const k=sstep(0,1,BOOK3.k),g=BOOK3.g;g.position.set(0,.46,.56+.08*(1-k));g.rotation.set(-.55,0,0);g.scale.setScalar((.15+.85*k)*1.45);
  if(BOOK3.fl>0){BOOK3.fl=Math.max(0,BOOK3.fl-dt*2.6);BOOK3.pg.rotation.z=PI*sstep(0,1,1-BOOK3.fl)}else BOOK3.pg.rotation.z=0;
  const a=k;m.sL.rotation.x=lerp(m.sL.rotation.x,-1.05,a);m.sR.rotation.x=lerp(m.sR.rotation.x,-1.05,a);m.sL.rotation.z=lerp(m.sL.rotation.z,.42,a);m.sR.rotation.z=lerp(m.sR.rotation.z,-.42,a);m.sL.rotation.y=lerp(m.sL.rotation.y,0,a);m.sR.rotation.y=lerp(m.sR.rotation.y,0,a);
  m.eL.rotation.x=lerp(m.eL.rotation.x,-.72,a);m.eR.rotation.x=lerp(m.eR.rotation.x,-.72,a);m.head.rotation.x=lerp(m.head.rotation.x,.32,a);
  if(BOOK3.k>.9&&run&&ev(20))fx(P.x+S(P.f)*.6,P.y+1.9,P.z+C(P.f)*.6,0xfff0c0,1,.4,.05,1.2,-.3)}
const _torchU161=torchUpd;torchUpd=function(dt,t){if(BOOK3.k>.05&&typeof TCH!='undefined'){TCH.acc=-5;TCH.sm=0}else if(TCH.acc<0)TCH.acc=0;_torchU161(dt,t);if(BOOK3.k>.05&&TCH.g){TCH.g.visible=false;if(TCH.sp)TCH.sp.visible=false}};
const _feel161=feelUpd;feelUpd=function(dt){_feel161(dt);try{bookPose()}catch(e){}if(UI.open=='qbook'||UI.open=='tree')ptPump()};
// a câmera enquadra o herói também com o livro aberto (main.js usa INV_OPEN quando UI.open é 'inv' ou 'qbook')

document.head.insertAdjacentHTML('beforeend',`<style>
#qbook{padding:0;background:linear-gradient(90deg,rgba(8,4,12,0) 0,rgba(8,4,12,.05) 26%,rgba(8,4,12,.55) 40%,rgba(8,4,12,.7))}
.qbw{position:absolute;inset:0;display:flex;align-items:center;justify-content:flex-end;gap:10px;padding:8px 44px 8px max(8px,env(safe-area-inset-left,0px))}
#qbStage{align-self:stretch;flex:0 0 clamp(170px,27vw,320px);position:relative;pointer-events:none}.qbh{position:absolute;left:0;right:0;bottom:6px;margin:0;text-align:center;font:700 11px var(--fn);color:rgba(255,240,200,.75);text-shadow:0 1px 3px #000}
.qbk{position:relative;display:grid;grid-template-columns:1fr 1fr;flex:0 1 760px;height:min(430px,calc(100vh - 16px));padding:10px 12px 14px;box-sizing:border-box;perspective:1400px;
  background:radial-gradient(ellipse at 25% 15%,rgba(255,220,160,.16),transparent 55%),linear-gradient(135deg,var(--lc,#6e3c1e),var(--ld,#2a1208));border-radius:9px 13px 13px 9px;
  box-shadow:0 0 0 3px #1a0a04,0 0 0 5px #b8862e,0 0 0 7px #1a0a04,0 16px 34px rgba(0,0,0,.75),inset 0 0 0 2px rgba(255,210,140,.14);transition:background .3s}
.qbk:after{content:'';position:absolute;left:50%;top:6px;bottom:8px;width:6px;margin-left:-3px;z-index:2;background:linear-gradient(90deg,rgba(40,18,6,0),rgba(40,18,6,.75),rgba(40,18,6,0));pointer-events:none}
.qbk .pg{overflow:hidden;backface-visibility:hidden;padding:9px 12px 16px}.qbk .pg:before{content:'';position:absolute;inset:0;pointer-events:none;background:radial-gradient(ellipse at 50% 120%,rgba(120,70,20,.18),transparent 60%)}
.qbk>.wx{position:absolute;right:-16px;top:-14px;z-index:5}
.qbn{position:absolute;bottom:-14px;z-index:5;width:40px;height:30px;border:2px solid #1a0a04;border-radius:6px;background:linear-gradient(#f0e0b4,#c8a868);color:#3a1a08;font:900 14px var(--fn);box-shadow:0 3px 0 rgba(0,0,0,.45);cursor:pointer}
#qbPrev{left:18px}#qbNext{right:18px}.qbn.off{opacity:.35;pointer-events:none}.qbn:active{transform:translateY(2px)}
#qbTabs{position:absolute;right:-41px;top:22px;display:flex;flex-direction:column;gap:6px;z-index:1}
.qtab{position:relative;width:40px;height:44px;padding:3px 6px 3px 2px;border:2px solid #1a0a04;border-left:0;border-radius:0 9px 9px 0;background:linear-gradient(90deg,#4a2612,#7a4422);box-shadow:2px 3px 0 rgba(0,0,0,.45);cursor:pointer;transition:width .15s}
.qtab img{width:30px;height:35px;display:block}.qtab span{display:none}.qtab.on{width:50px;background:linear-gradient(90deg,#d8c08a,#f0e0b4)}.qtab.on img{animation:bkBob 1.6s ease-in-out infinite}
@keyframes bkBob{50%{transform:translateY(-2px) rotate(-4deg);filter:drop-shadow(0 0 4px #ffe08a)}}
.qpn{position:absolute;bottom:3px;left:0;right:0;text-align:center;font:700 10px var(--px,Georgia);color:#9a7040;text-decoration:none}
.qcov{position:absolute;top:10px;bottom:14px;left:50%;right:12px;z-index:4;background:center/cover no-repeat;image-rendering:pixelated;border-radius:2px 8px 8px 2px;box-shadow:inset 0 0 0 3px rgba(0,0,0,.35),inset 0 0 0 5px rgba(217,169,72,.5);transform-origin:left center;opacity:0;pointer-events:none;backface-visibility:hidden}
.op .qcov{animation:qcOpen .78s cubic-bezier(.5,0,.3,1) forwards}.op{animation:qbIn .32s cubic-bezier(.2,.9,.3,1.25)}.op>.pg{animation:qbPg .7s ease-out}
@keyframes qcOpen{0%{opacity:1;transform:rotateY(0)}35%{opacity:1;transform:rotateY(0)}99%{opacity:1;transform:rotateY(-178deg)}100%{opacity:0;transform:rotateY(-180deg)}}
@keyframes qbIn{from{transform:scale(.55) rotate(-4deg);opacity:0}}@keyframes qbPg{0%,30%{opacity:0}100%{opacity:1}}
.qbk.sw>.pg{animation:qbPg .35s ease-out}
#tree .book .qcov{top:11px;bottom:15px;right:13px}#tree .book{perspective:1400px}
.qpg{display:flex;flex-direction:column;gap:6px;height:100%;font:12.5px/1.36 Georgia,serif;color:#3a2412}
.qtop{display:flex;justify-content:space-between;align-items:center;font:700 10px var(--px,Georgia);letter-spacing:.5px;text-transform:uppercase;color:#8a4a1a;border-bottom:1px dashed rgba(90,50,20,.35);padding-bottom:3px}
.qtop em{font-style:normal;padding:1px 6px;border-radius:3px;border:1px solid}.qtop em.on{color:#8a5a08;border-color:#c8962e;background:rgba(255,210,90,.25)}.qtop em.ok{color:#2a6a2a;border-color:#5a9a4a;background:rgba(120,200,100,.2)}.qtop em.lk{color:#7a6a5a;border-color:#a89a80}
.qph{display:flex;gap:10px;align-items:center}.qpi{width:54px;height:54px;flex:none;filter:drop-shadow(0 3px 0 rgba(60,30,10,.3))}i.qpi{font-size:38px;font-style:normal;text-align:center}
.qph b{display:block;font:700 16px/1.15 var(--fn);color:#2a1206}.qph small{display:block;font:400 10px var(--px,Georgia);color:#8a4a1a;letter-spacing:.5px;text-transform:uppercase;margin-top:2px}.qstg{color:#1e4a7a!important}
.qctx{margin:0;font-style:italic;color:#4a2e18;flex:0 1 auto;overflow:auto}.qctx.lore{font-size:13.5px}
.qobj{border-left:3px solid #b8862e;padding:3px 7px;background:rgba(255,230,160,.22)}.qobj b{font:700 10.5px var(--px,Georgia);text-transform:uppercase;color:#8a4a1a}.qobj p{margin:2px 0}
.qbar{position:relative;height:12px;border:2px solid #2a1206;border-radius:3px;background:#3a2412;margin-top:3px}.qbar i{position:absolute;left:0;top:0;bottom:0;background:linear-gradient(#ffe08a,#d9a43a)}.qbar span{position:relative;display:block;text-align:center;font:700 9px/8px var(--px,Georgia);color:#fff;text-shadow:0 1px 1px #000}
.qmeta{display:flex;flex-wrap:wrap;gap:4px 10px;font-size:11.5px;color:#5a3a20}
.qrw{display:flex;flex-wrap:wrap;gap:4px;align-items:center}.qrw b{font:700 10.5px var(--px,Georgia);text-transform:uppercase;color:#8a4a1a;margin-right:2px}.qrw span{padding:1px 6px;border-radius:3px;background:linear-gradient(#2e1c10,#1a0e06);color:#ffe08a;font:700 11px Georgia;border:1px solid #120804}
.qmap{align-self:flex-start;margin-top:auto;border:2px solid #2a1206;border-radius:5px;background:linear-gradient(#f0e0b4,#c8a868);color:#2a1206;font:700 11.5px var(--fn);padding:4px 10px;cursor:pointer;box-shadow:0 2px 0 rgba(0,0,0,.35)}
.qidx .qih{border-bottom:2px solid rgba(90,50,20,.32);padding-bottom:4px}.qih b{display:block;font:700 17px var(--fn);color:#2a1206}.qih small{display:block;font:400 10.5px var(--px,Georgia);color:#8a4a1a;text-transform:uppercase;letter-spacing:.5px}
.qil{flex:1;min-height:0;overflow:hidden}.qil h5{margin:5px 0 1px;font:700 12px var(--fn);color:#6a2a0a}.qil p{margin:0;padding:1px 4px;font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.qil-q{cursor:pointer;border-radius:3px}.qil-q:active,.qil-q:hover{background:rgba(217,169,72,.25)}.qil-q.ok{color:#2a6a2a}.qil-q.lk,.qil-lk{color:#9a8a70;cursor:default}.qil-q i{font-style:normal;color:#8a4a1a;font-size:10.5px}
.qach{padding:4px 6px;border-bottom:1px dashed rgba(90,50,20,.3)}.qach b{display:block;font:700 12.5px var(--fn)}.qach small{color:#8a4a1a;font-size:10.5px}.qach p{margin:1px 0 0;font-size:11.5px}.qach.ok{cursor:pointer}.qach.lk{opacity:.6}
.bpg{align-items:center;text-align:center}.bpg .qtop{align-self:stretch}.bph{width:100%;display:flex;justify-content:center;background:radial-gradient(ellipse at 50% 60%,rgba(255,240,200,.6),transparent 65%)}.bpi{width:112px;height:112px;filter:drop-shadow(0 4px 0 rgba(60,30,10,.25))}
.bnm{font:700 17px var(--fn);color:#2a1206}.bwh{font-size:10.5px;color:#7a4a20}.bst{display:flex;gap:5px;justify-content:center;flex-wrap:wrap}.bst span{padding:1px 6px;border-radius:3px;background:linear-gradient(#2e1c10,#1a0e06);color:#ffe08a;font:700 11px Georgia}
.bai{margin:0;font-size:11.5px;color:#5a3a20}.bmk{align-self:stretch;text-align:left;overflow:auto;min-height:0;flex:1}.bmk>b{font:700 10.5px var(--px,Georgia);text-transform:uppercase;color:#8a4a1a}.bmk p{margin:2px 0;font-size:11px;line-height:1.3}.bmk u{text-decoration:none;font-weight:700;color:#2a1206}.bmk p.lk{color:#9a8a70}
.qbk .qpi,.qbk .bpi{animation:qpIn .5s cubic-bezier(.2,.9,.3,1.4)}.qbk .bpi{animation:qpIn .5s cubic-bezier(.2,.9,.3,1.4),bkFl 3.2s ease-in-out .5s infinite}@keyframes qpIn{from{transform:scale(.55) rotate(-10deg);opacity:0}}@keyframes bkFl{50%{transform:translateY(-4px)}}
.qend{align-items:center;justify-content:center;color:#b89a6a;font-size:28px}.qend i{font-style:normal}
#qbkb,#treeb{position:relative}.bkic{width:30px;height:35px;display:block;margin:auto;pointer-events:none;filter:drop-shadow(0 2px 0 rgba(0,0,0,.5))}
#qbkb.pop .bkic,#treeb.pop .bkic{animation:bkPop .6s cubic-bezier(.2,.9,.3,1.4)}@keyframes bkPop{0%{transform:scale(1)}30%{transform:translateY(-6px) rotate(-12deg) scale(1.3);filter:drop-shadow(0 0 8px #ffe08a)}60%{transform:rotate(8deg) scale(1.1)}100%{transform:none}}
#qbkb.nw:after{content:'!';position:absolute;right:-2px;top:-3px;width:15px;height:15px;border-radius:50%;background:#d0302a;border:1px solid #ffd0a0;color:#fff;font:900 11px/14px var(--fn);text-align:center;animation:gsP 1.2s infinite}
#qbkb.nw .bkic{animation:bkBob 1.4s ease-in-out infinite}
@media (max-height:430px){.qpg{font-size:11.5px;gap:4px}.qph b{font-size:14px}.qpi{width:44px;height:44px}.bpi{width:92px;height:92px}.qctx.lore{font-size:12px}.qil p{font-size:11px}.qil h5{font-size:11px;margin-top:3px}.qbk .pg{padding:7px 10px 14px}}
@media (orientation:portrait){#qbStage{display:none}.qbw{justify-content:center;padding-right:46px}}</style>`);
