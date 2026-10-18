'use strict';
/* =============================================================================
   VOXEL REALMS · árvore do Arqueiro e saque por classe
   Habilidades de arco (leque de flechas, flecha perfurante, salto evasivo,
   armadilha de gelo, falcão caçador, tempestade de flechas e passivas).
   Os drops seguem a classe escolhida: armas e atributos da sua classe aparecem
   bem mais, mas ainda pode cair arma de outra classe.
   ============================================================================= */
TREE.push({id:'arco',n:'Arqueiro',c:'#ffd070',ic:'🏹'});
Object.assign(SK.flechas,{t:'arco',bow:1});
Object.assign(SK,{
  multi:{t:'arco',n:'Tiro Múltiplo',ic:'🎐',lv:2,cost:18,cd:1.2,bow:1,d:r=>`Dispara ${5+r} flechas em leque (${70+15*(r-1)}% de dano cada) que atravessam os inimigos.`},
  aguia:{t:'arco',n:'Olho de Águia',ic:'👁️',lv:3,pas:1,d:r=>`Passiva: com arco, +${3*r}% de chance crítica e +${6*r}% de dano.`},
  recuo:{t:'arco',n:'Salto Evasivo',ic:'🦘',lv:3,cost:10,cd:6,bow:1,d:r=>`Salta 7 m para trás, fica intocável no salto e dispara ${2+r} flechas (${90+20*(r-1)}% cada).`},
  perfura:{t:'arco',n:'Flecha Perfurante',ic:'➹',lv:4,cost:15,cd:4,bow:1,d:r=>`Uma flecha carregada atravessa tudo em linha reta (${300+60*(r-1)}% de dano) e empurra os inimigos.`},
  aljava:{t:'arco',n:'Aljava Leve',ic:'🪶',lv:5,pas:1,d:r=>`Passiva: com arco, +${8*r}% de velocidade de ataque.`},
  armadilha:{t:'arco',n:'Armadilha de Gelo',ic:'🧊',lv:6,cost:20,cd:9,d:r=>`Arma uma armadilha que explode quando um inimigo pisa (${200+40*(r-1)}% de dano) e congela por ${(1.2+.3*r).toFixed(1)} s. Até 3 armadas.`},
  falcao:{t:'arco',n:'Falcão Caçador',ic:'🦅',lv:8,cost:25,cd:16,d:r=>`Um falcão mergulha sobre os inimigos por ${8+2*r} s (${80+20*(r-1)}% de dano por mergulho).`},
  tempestade:{t:'arco',n:'Tempestade de Flechas',ic:'🌧️',lv:10,cost:45,cd:15,bow:1,d:r=>`Flechas caem do céu por 2,5 s numa área grande (${45+10*(r-1)}% por flecha).`}});
// colunas da árvore: a da sua classe primeiro
const CLS_TREE={guerreiro:'guerra',mago:'arcano',cacador:'arco'};
function treeOrder(){const f=CLS_TREE[P.cls]||'guerra';return[TREE.find(t=>t.id==f),...TREE.filter(t=>t.id!=f)]}
function archerPassive(s){if(!(EQ.arma&&EQ.arma.wk=='bow'))return;s.crit+=3*rk('aguia');s.dmg+=6*rk('aguia');s.ias+=8*rk('aljava')}
// mais flechas no pool (tempestade e tiro múltiplo)
for(let i=0;i<26;i++){const s=spr(0xffffff,1.1,1);s.visible=false;sc.add(s);const a=arrowMesh();a.visible=false;sc.add(a);PJ.push({s,a,o:null,l:0,v:new V3,tg:null,dm:0,k:'',side:''})}

function archerSkill(id,a,r){const t=a.tg,f=t?Math.atan2(t.x-P.x,t.z-P.z):P.f,ox=P.x+S(f)*.6,oz=P.z+C(f)*.6,oy=P.y+1.7;P.f=f;
  if(id=='flechas'){extraSkill(id,a,r);return}
  if(id=='multi'){const n=5+r;for(let i=0;i<n;i++){const an=f+(i-(n-1)/2)*.12;proj('p','arrow',ox,oy,oz,{x:P.x+S(an)*20,z:P.z+C(an)*20,y:P.y},rollDmg(.7+.15*(r-1))[0],{dir:new V3(S(an),0,C(an)),pierce:1,home:0,life:1.1})}
    sweep(1000,300,.22,'triangle',.05);fx(ox,oy,oz,0xfff2c0,12,5,.08,.5,0);flash(ox,oy,oz,0xffe08a,2.2,.15);ring(P.x,P.z,1.8,0xffe08a,.3);return}
  if(id=='perfura'){const L=18,x1=P.x+S(f)*L,z1=P.z+C(f)*L;SHK=.25;HITSTOP=.04;sweep(200,1400,.3,'sawtooth',.06);flash(ox,oy,oz,0xffffff,3,.2);
    for(let i=0;i<26;i++){const k=i/25,x=lerp(ox,x1,k),z=lerp(oz,z1,k);fx(x,oy-.1,z,i%3?0xffe08a:0xffffff,1,.4,.13,.2,0)}column(ox,oz,0xffe08a,3,.4,.25,oy-1.5);
    for(const e of E)if(!e.dead&&segD(e.x,e.z,[P.x,P.z],[x1,z1])<e.r+.9){const[dm,c]=rollDmg(3+.6*(r-1));hurtMob(e,dm,c,'perfura');if(!e.boss){e.vx+=S(f)*12;e.vz+=C(f)*12}fx(e.x,e.y+1.2,e.z,0xffe08a,8,6,.12,.6)}return}
  if(id=='recuo'){P.act=null;P.rdx=-S(f);P.rdz=-C(f);P.dash=.33;P.inv=Math.max(P.inv,.45);puff(P.x,P.y+.4,P.z,0xd8d0e0,1.8);fx(P.x,P.y+.4,P.z,0xcdb894,10,6,.16,.8);sweep(600,1500,.18,'triangle',.05);
    const n=2+r;for(let i=0;i<n;i++)setTimeout(()=>{const tg=bestTarget(16,1),an=tg?Math.atan2(tg.x-P.x,tg.z-P.z):f+(i-(n-1)/2)*.15;proj('p','arrow',P.x+S(an)*.6,P.y+1.7,P.z+C(an)*.6,tg||{x:P.x+S(an)*20,z:P.z+C(an)*20,y:P.y},rollDmg(.9+.2*(r-1))[0],{dir:tg?null:new V3(S(an),0,C(an))})},120+i*90);return}
  if(id=='armadilha'){const x=t?t.x:P.x+S(f)*3,z=t?t.z:P.z+C(f)*3;trapPlace(x,z,r);return}
  if(id=='falcao'){falconCall(r);return}
  if(id=='tempestade'){const x=t?t.x:P.x+S(f)*9,z=t?t.z:P.z+C(f)*9;ring(x,z,6,0xffe08a,.6);tele(x,z,6,.5,null,0xffd070);sweep(300,900,.5,'triangle',.05);let acc=0;
    vfxAdd(2.5,(k,dt)=>{acc+=dt;while(acc>.06){acc-=.06;const a_=R()*TAU,rr=Math.sqrt(R())*6,px=x+C(a_)*rr,pz=z+S(a_)*rr,gy=groundAt(px,pz);proj('p','arrow',px+.8,gy+11,pz-.8,{x:px,z:pz,y:gy},rollDmg(.45+.1*(r-1))[0],{dir:new V3(-.07,-1,.07).normalize(),home:0,life:.7})}});return}}

// armadilhas de gelo
const TRAPS=[];
function trapPlace(x,z,r){if(TRAPS.length>=3){const o=TRAPS.shift();sc.remove(o.g)}const g=new THREE.Group(),k=new Bake();k.box(1.1,.12,1.1,0,.06,0,0x5a6a7a);for(let i=0;i<4;i++){const a=i/4*TAU+.4;k.box(.12,.4,.12,C(a)*.4,.25,S(a)*.4,0xbfe8ff,{rz:.3})}g.add(k.mesh(MV));
  const s=new THREE.Sprite(new THREE.SpriteMaterial({map:SPR,color:0x9ae4ff,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,opacity:.6}));s.scale.set(1.8,1.8,1);s.position.y=.3;g.add(s);
  const y=groundAt(x,z);g.position.set(x,y,z);sc.add(g);TRAPS.push({g,s,x,z,r,arm:.7,t:30});puff(x,y+.3,z,0xd8f4ff,1.2);snd(1200,.1,'triangle')}
function trapUpd(dt,t){for(let i=TRAPS.length-1;i>=0;i--){const o=TRAPS[i];o.t-=dt;o.arm-=dt;o.s.material.opacity=o.arm>0?.25:.45+.25*S(t*6);
    let hit=o.t<=0;if(o.arm<=0&&!hit)for(const e of E)if(!e.dead&&!e.t.passive&&hy(e.x-o.x,e.z-o.z)<e.r+1.4){hit=true;break}
    if(!hit)continue;sc.remove(o.g);TRAPS.splice(i,1);if(o.t<=0)continue;const y=groundAt(o.x,o.z);
    ring(o.x,o.z,4,0x9ae4ff,.6);ring(o.x,o.z,2.2,0xffffff,.4);flash(o.x,y+1,o.z,0x9ae4ff,6,.4);fx(o.x,y+.5,o.z,0xbfe8ff,26,12,.22,1.2,12);column(o.x,o.z,0x9ae4ff,4,.7,.4);snd(1500,.3,'triangle');SHK=Math.max(SHK,.2);
    for(const e of E)if(!e.dead&&hy(e.x-o.x,e.z-o.z)-e.r<4){const[dm,c]=rollDmg(2+.4*(o.r-1));hurtMob(e,dm,c,'armadilha');e.stun=Math.max(e.stun,1.2+.3*o.r);e.slow=3}}}

// falcão caçador
let FALC=null;
function falconMesh(){const g=new THREE.Group(),b=new Bake();b.box(.26,.24,.62,0,0,0,0x7a5a3a).box(.22,.22,.22,0,.08,.36,0xe8e0d0).box(.08,.08,.12,0,.04,.52,0xffc040).box(.2,.06,.3,0,-.02,-.42,0x5a3a22);g.add(b.mesh(MV));
  const w=s=>part(g,s*.12,.04,0,k=>k.box(.62,.05,.34,s*.32,0,0,0x6a4a2a));g.wL=w(-1);g.wR=w(1);g.scale.setScalar(1.3);return g}
function falconCall(r){if(!FALC){FALC={g:falconMesh()};sc.add(FALC.g)}Object.assign(FALC,{t:8+2*r,r,st:'orb',an:0,cd:.4,x:P.x,y:P.y+4.5,z:P.z,tg:null,k:0});FALC.g.visible=true;
  flash(P.x,P.y+4.5,P.z,0xffe08a,3,.4);fx(P.x,P.y+4.5,P.z,0xd8c8a8,12,4,.1,1);sweep(1800,1200,.25,'sine',.05);setTimeout(()=>sweep(1700,1100,.2,'sine',.04),220)}
function falconUpd(dt,t){const F=FALC;if(!F||!F.g.visible)return;F.t-=dt;F.cd-=dt;const g=F.g;
  if(F.t<=0||P.dead){g.visible=false;fx(F.x,F.y,F.z,0xd8c8a8,10,4,.1,1);return}
  if(F.st=='orb'){F.an+=dt*1.8;const tx=P.x+C(F.an)*3,tz=P.z+S(F.an)*3,ty=P.y+4.5+S(t*2)*.3;F.x+=(tx-F.x)*Math.min(1,dt*4);F.y+=(ty-F.y)*Math.min(1,dt*4);F.z+=(tz-F.z)*Math.min(1,dt*4);
    if(F.cd<=0){let b=null,bd=15;for(const e of E){if(e.dead||e.t.passive)continue;const d=hy(e.x-P.x,e.z-P.z);if(d<bd){bd=d;b=e}}if(b){F.st='dive';F.tg=b;F.k=0;F.sx=F.x;F.sy=F.y;F.sz=F.z;sweep(2200,900,.3,'sine',.04)}else F.cd=.5}}
  else if(F.st=='dive'){const e=F.tg;F.k+=dt/.38;const k=Math.min(1,F.k);if(e.dead){F.st='orb';F.cd=.3}else{F.x=lerp(F.sx,e.x,k);F.y=lerp(F.sy,e.y+1.2,k*k);F.z=lerp(F.sz,e.z,k);if(ev(2))fx(F.x,F.y,F.z,0xe8e0d0,1,.3,.08,.2,0);
      if(k>=1){const[dm,c]=rollDmg(.8+.2*(F.r-1));hurtMob(e,dm,c,'falcao');fx(e.x,e.y+1.4,e.z,0x8a6a4a,8,5,.1,1.2,6);flash(e.x,e.y+1.4,e.z,0xffe8c0,2,.15);snd(900,.08,'square');F.st='up';F.k=0;F.sx=F.x;F.sy=F.y;F.sz=F.z}}}
  else{F.k+=dt/.45;const k=Math.min(1,F.k);F.y=lerp(F.sy,P.y+5,k);F.x+=(P.x-F.x)*dt*1.5;F.z+=(P.z-F.z)*dt*1.5;if(k>=1){F.st='orb';F.cd=.9;F.an=Math.atan2(F.z-P.z,F.x-P.x)}}
  const px=g.position.x,pz=g.position.z;g.position.set(F.x,F.y,F.z);if(Math.abs(F.x-px)+Math.abs(F.z-pz)>.001)g.rotation.y=Math.atan2(F.x-px,F.z-pz);g.rotation.x=F.st=='dive'?.6:F.st=='up'?-.4:0;
  const fl=S(t*(F.st=='dive'?6:16))*.7;g.wL.rotation.z=fl;g.wR.rotation.z=-fl}
function archerUpd(dt,t){trapUpd(dt,t);falconUpd(dt,t)}

// ---------- saque por classe
// pesos das armas por classe (o resto ainda pode cair, só que bem menos)
const CLS_WPN={guerreiro:{sword:9,axe:8,mace:8,bow:1.2,staff:1,wand:1},mago:{staff:10,wand:9,sword:1.2,axe:1,mace:1,bow:1},cacador:{bow:14,sword:1.5,axe:1,mace:1,staff:1,wand:1}};
const CLS_AFX={guerreiro:{dmg:3,hp:3,arm:3,fury:3,ls:2.5,crit:1.5},mago:{mag:4,cdr:3,crit:2,hp:1.5,critd:1.5},cacador:{crit:3,critd:3,ias:3,ms:2.5,dmg:2.5}};
const CLS_HELM={guerreiro:'helm',mago:'hood',cacador:'hood'};
const CLS_LEG={guerreiro:['crepusculo','furia','sismo','guardiao'],mago:['trovao','meteoro'],cacador:['perfura','vampiro']};
function wpick(L,w){let tot=0;for(const x of L)tot+=w(x);let v=R()*tot;for(let i=0;i<L.length;i++){v-=w(L[i]);if(v<=0)return i}return L.length-1}
function pickBase(slot,bl){const c=P.cls||'guerreiro';
  if(slot=='arma'){const W=CLS_WPN[c];return wpick(bl,b=>W[b[2]]||1)}
  if(slot=='elmo'){const pref=CLS_HELM[c];return wpick(bl,b=>b[2]==pref?3:1)}
  return(R()*bl.length)|0}
function pickAff(pool){const W=CLS_AFX[P.cls||'guerreiro']||{};return wpick(pool,a=>W[a.k]||1)}
function pickLeg(slot){const L=slot?LEG.filter(l=>l.slot==slot):LEG;if(!L.length)return pick(LEG);const pref=CLS_LEG[P.cls||'guerreiro']||[];
  return L[wpick(L,l=>pref.includes(l.id)?4:l.slot=='arma'&&l.b!=null&&(CLS_WPN[P.cls||'guerreiro'][BASES.arma[l.b][2]]||1)<2?.4:1)]}
const WPN_CLS={sword:'guerreiro',axe:'guerreiro',mace:'guerreiro',staff:'mago',wand:'mago',bow:'cacador'};
function clsTag(it){if(it.slot!='arma'||!it.wk)return'';const c=WPN_CLS[it.wk];return c==P.cls?'<span style="color:#7df08a">★ Arma da sua classe</span>':`<span style="color:#c8a888">Arma de ${CLS[c].n}</span>`}
