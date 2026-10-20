'use strict';
/* =============================================================================
   VOXEL REALMS · vila maior, construções pelo mapa e baús de chefe (16.0)
   - Baús espalhados pelo mundo saíram: agora um baú só aparece quando um chefe
     cai, no lugar da luta, com saque garantido (raro ou melhor, poções,
     fragmentos e ouro). Some depois de aberto.
   - Pedraverde cresceu para fora da paliçada: Bairro dos Artesãos, Quartel da
     Guarda (pátio de treino, alvos e torre), Templo de Aldor (capela com sino e
     cemitério), Fazendas do Sul (celeiros, moinho, lavouras, espantalho) e a Rua
     do Mercado na saída leste. Caminhos de terra, lampiões e 15 moradores novos.
   - 55 construções novas pelo mapa (5 por bioma) com o estilo de cada lugar:
     sítios, moinhos, poços, torres de vigia, acampamentos, ruínas, cabanas,
     palafitas, cais de pesca, oratórios, forjas abandonadas e obeliscos.
   ============================================================================= */
// ---------- baús só dos chefes
const BCH=[];
function bossChest(e){if(!e)return;let x=e.x,z=e.z;for(let i=0;i<8&&!walkable(x,z);i++){x=e.x+(R()-.5)*6;z=e.z+(R()-.5)*6}const y=groundAt(x,z),ry=Math.atan2(P.x-x,P.z-z);
  const g=new THREE.Group(),k=new Bake(),lk=new Bake(),gd=0xffd34a;k.box(1.5,.8,1,0,.4,0,0x6a3a1a).box(1.54,.1,1.04,0,.08,0,gd).box(.1,.82,1.04,-.55,.41,0,gd).box(.1,.82,1.04,.55,.41,0,gd).box(.26,.3,.06,0,.55,.52,gd);
  lk.box(1.54,.34,1.04,0,.17,-.52,0x7a4a22).box(1.58,.08,1.08,0,.34,-.52,gd).box(.12,.36,1.08,-.55,.17,-.52,gd).box(.12,.36,1.08,.55,.17,-.52,gd);
  g.add(k.mesh(MV));const lid=new THREE.Group();lid.add(lk.mesh(MV));lid.position.set(0,.8,.52);g.add(lid);g.position.set(x,y,z);g.rotation.y=ry;g.scale.setScalar(1.35);g.traverse(o=>{if(o.isMesh)o.castShadow=true});sc.add(g);
  const c={x,z,g,lid,o:0,t:0,lv:e.lv||P.lv,boss:e.type,bm:beam(x,z,0xffd34a)};c.bm.position.set(x,y+14,z);c.it=inter({x,z,r:2.6,ic:'🧰',label:()=>c.o?'Baú vazio':'Abrir o baú do chefe',act:()=>openBossChest(c),kind:'chest'});BCH.push(c);
  column(x,z,0xffd34a,10,1.4,.8);ring(x,z,3,0xffe27a,.8);toast('🧰','Baú do chefe!','Abra o baú para pegar o saque.')}
function openBossChest(c){if(c.o)return;c.o=1;c.t=0;snd(220,.3,'triangle');setTimeout(()=>snd(1320,.25,'sine'),250);setTimeout(()=>snd(1760,.3,'sine'),420);flash(c.x,groundAt(c.x,c.z)+1.2,c.z,0xffd060,6,.6);ring(c.x,c.z,4,0xffe27a,.7);
  const lv=c.lv,n=2+(R()<.45?1:0);dropGold(c.x,c.z,Math.round((60+lv*45)*(.9+R()*.4)));for(let i=0;i<n;i++){let it=genItem(lv+1,i==0?2.4:1.4,null,i==0&&R()<.08);for(let j=0;i==0&&it.rar<2&&j<60;j++)it=genItem(lv+1,2.4);dropItem(c.x+(R()-.5)*1.4,c.z+(R()-.5)*1.4,it)}
  for(let i=0;i<2;i++)dropItem(c.x+(R()-.5)*1.4,c.z+(R()-.5)*1.4,potItem(lv>=14?'vida3':lv>=6?'vida2':'vida1'));for(let i=0;i<2+(R()*3|0);i++)dropMat(c.x+(R()-.5)*1.6,c.z+(R()-.5)*1.6,'fragmento');dropGlobe(c.x,c.z);qEvent('chest',-1);save()}
function bossChestUpd(dt){for(let i=BCH.length-1;i>=0;i--){const c=BCH[i];c.t+=dt;if(c.o){c.lid.rotation.x=Math.max(-1.95,c.lid.rotation.x-dt*5);if(c.bm){sc.remove(c.bm);c.bm=null}
      if(c.t>45){const s=1-Math.min(1,(c.t-45)/2);c.g.scale.setScalar(1.35*Math.max(.01,s));if(c.t>47){sc.remove(c.g);c.g.traverse(o=>o.geometry&&o.geometry.dispose());const j=INTER.indexOf(c.it);if(j>=0)INTER.splice(j,1);BCH.splice(i,1)}}}
    else if(c.t>600){sc.remove(c.g);if(c.bm)sc.remove(c.bm);const j=INTER.indexOf(c.it);if(j>=0)INTER.splice(j,1);BCH.splice(i,1)}}}
const _bossVictory160=bossVictory;bossVictory=function(e){_bossVictory160.apply(this,arguments);setTimeout(()=>bossChest(e),1300)};
const _feel1601=feelUpd;feelUpd=function(dt){_feel1601(dt);if(run)bossChestUpd(dt)};
// os baús antigos do mundo ficam escondidos (os salvos continuam funcionando)
for(const c of CHESTS){c.vis=false;const j=INTER.findIndex(q=>q.c===c);if(j>=0)INTER.splice(j,1)}
{const keep=new Set(CHESTS.map(c=>c.x+','+c.z));for(let i=STR.length-1;i>=0;i--){const s=STR[i];if(keep.has(s.x+','+s.z)&&!WP.some(w=>w.x==s.x&&w.z==s.z))STR.splice(i,1)}
  for(let i=FZ.length-1;i>=0;i--){const f=FZ[i];if(keep.has(f.x+','+f.z)&&f.r<3)FZ.splice(i,1)}for(const L of LIDS||[])L.visible=false}

// ---------- Pedraverde maior
const VY=1.5,VW=0x4a3020;
flat(52,-52,24,VY);flat(-55,-50,24,VY);flat(-60,38,22,VY);flat(56,46,26,VY);flat(76,6,20,VY);
for(const r of[[[56,4],[52,-46]],[[-3,-56],[-48,-50]],[[-56,8],[-60,30]],[[4,56],[48,46]]])ROADS.push(r);
const VPOI=[{n:'Bairro dos Artesãos',x:52,z:-52,r:18},{n:'Quartel da Guarda',x:-55,z:-50,r:18},{n:'Templo de Aldor',x:-60,z:38,r:16},{n:'Fazendas do Sul',x:56,z:46,r:20},{n:'Rua do Mercado',x:76,z:6,r:14}];POI.push(...VPOI);
Object.assign(POIICONS,{'Bairro':'🔨','Quart':'🛡️','Fazen':'🌾','Rua d':'🛒'});
const sub=(t,x,z,ry,m)=>new TB(t.k,t.e,t.f,x,z,ry||0,VY,m||1);
function fence(t,x0,z0,x1,z1,c){const L=hy(x1-x0,z1-z0),n=Math.max(2,Math.round(L/1.6)),a=Math.atan2(z1-z0,x1-x0);for(let i=0;i<=n;i++){const u=i/n;t.b(.16,1,.16,x0+(x1-x0)*u,.5,z0+(z1-z0)*u,c||0x6b4524,{g:1})}
  t.b(L,.1,.08,(x0+x1)/2,.75,(z0+z1)/2,c||0x7a5432,{ry:-a}).b(L,.1,.08,(x0+x1)/2,.4,(z0+z1)/2,c||0x7a5432,{ry:-a})}
function stoneTower(t,x,z,h,c,c2,lit){const[wx,wz]=t.w(x,z),s=new TB(t.k,t.e,t.f,wx,wz,t.ry,t.y,t.m);for(let i=0;i<h;i++)s.b(3.4-(i%2)*.2,1,3.4-(i%2)*.2,0,.5+i,0,i%2?c:c2,{g:i==0});s.b(4,.4,4,0,h+.2,0,c2);for(const[a,b]of[[-1.7,-1.7],[1.7,-1.7],[-1.7,1.7],[1.7,1.7]])s.b(.7,.8,.7,a,h+.8,b,c);if(lit)s.e_(.5,.5,.5,0,h+.9,0,lit);s.col(0,0,2)}
addStr(52,-52,0,(k,e,f)=>{const t=new TB(k,e,f,52,-52,0,VY,1); // Bairro dos Artesãos
  [[-9,-7,.4,0xe8dcc0,0x8a3a2a,1],[9,-8,-.5,0xd8c8a8,0x3b4a6a,0],[-10,8,2.6,0xe0d4b8,0x5a3a8a,0],[10,9,-2.5,0xeee2c8,0x7a3a2a,1]].forEach(([x,z,ry,wc,rc,two])=>house(sub(t,52+x,-52+z,ry,1.55),5,4,wc,rc,two));
  t.b(6,.2,4,0,.1,0,0x6a5a48,{g:1});for(const[a,b]of[[-2.8,-1.8],[2.8,-1.8],[-2.8,1.8],[2.8,1.8]])t.b(.3,3,.3,a,1.5,b,VW);t.b(6.6,.3,4.6,0,3.1,0,0x7a4a2a);t.col(0,0,2.2);
  for(let i=0;i<5;i++)t.b(3.2,.45,.45,-1,.25+i*.45,-1.2+(i%2)*.2,0x8a5a32,{ry:.1*i});t.b(1.6,.8,.5,1.8,.6,.8,0x6a4a2a).b(.2,.8,.2,1.2,.4,.6,0x4a3020).b(.2,.8,.2,2.4,.4,1,0x4a3020);
  for(const[a,b]of[[0,-6],[0,6],[-6,0],[6,0]])lamp(t,a,b);crate(t,4,-3,1);barrel(t,-4,3)});
addStr(-55,-50,0,(k,e,f)=>{const t=new TB(k,e,f,-55,-50,0,VY,1); // Quartel da Guarda
  const S_=0x8a8a84,S2=0x6e6e68;t.b(14,4.5,6,0,2.25,-8,S_,{g:1});t.b(14.6,.4,6.6,0,4.7,-8,S2);for(let i=0;i<4;i++)t.b(14.8-i*1.6,.5,6.8,0,5.1+i*.45,-8,i%2?0x5a3a2a:0x4a2a1a);for(let i=0;i<4;i++)t.e_(.8,.8,.1,-5+i*3.3,2.4,-4.95,0xffcf5a);t.b(1.6,2.6,.2,0,1.3,-4.9,0x3b281b);t.col(-4.5,-8,3.2);t.col(0,-8,3.2);t.col(4.5,-8,3.2);
  for(let i=0;i<4;i++){const x=-6+i*4;t.b(.25,2.2,.25,x,1.1,3,0x6b4524,{g:1}).b(1,1,.6,x,1.6,3,0xd8b860).b(.6,.6,.6,x,2.4,3,0xd8b860);t.col(x,3,.5)}
  for(const x of[-7,7]){t.b(.2,2.4,.2,x,1.2,8,0x6b4524,{g:1}).b(1.6,1.6,.15,x,2,8,0xf0e8d8);t.b(1.1,1.1,.17,x,2,8,0xd8402a).b(.6,.6,.19,x,2,8,0xf0e8d8).b(.25,.25,.2,x,2,8,0xd8402a)}
  t.b(2.6,.2,.4,0,1.6,7,0x5a3a20).b(.2,2,.2,-1.2,1,7,0x5a3a20).b(.2,2,.2,1.2,1,7,0x5a3a20);for(let i=0;i<4;i++)t.b(.08,1.6,.08,-.9+i*.6,1.1,7.2,0xcfd6dc,{rz:.08});
  stoneTower(t,-9,-10,10,S_,S2,0xffc860);for(const x of[-5,5])t.b(.2,6,.2,x,3,-3.8,0x5a3a20).b(1.2,1.8,.06,x+.6,5,-3.8,0x2a5aa0)});
addStr(-60,38,0,(k,e,f)=>{const t=new TB(k,e,f,-60,38,0,VY,1); // Templo de Aldor e cemitério
  const W=0xd8d0c0,R_=0x5a4a6a;t.b(8,5,12,0,2.5,-3,W,{g:1});for(let i=0;i<6;i++)t.b(8.8-i*1.4,.6,12.8,0,5.3+i*.6,-3,i%2?R_:shade(R_,.8));t.b(3,10,3,0,5,-10,W,{g:1}).b(3.6,.4,3.6,0,10.2,-10,shade(W,.8));
  t.b(1.2,1.2,1.2,0,9.2,-10,0xd9a948);for(let i=0;i<4;i++)t.b(3.4-i*.8,.7,3.4-i*.8,0,10.8+i*.7,-10,R_);t.e_(.9,1.6,.1,0,2.6,3.05,0xffd8a0).e_(.9,1.6,.1,-2.6,2.6,3.05,0xc8a0ff).e_(.9,1.6,.1,2.6,2.6,3.05,0xa0c8ff);
  t.b(1.6,2.6,.2,0,1.3,3.05,0x5a3a20);t.col(0,-3,4.5);t.col(0,-9,2.2);
  for(let i=0;i<8;i++){const x=8+(i%4)*2.2,z=-4+(i>>2)*3.2;t.b(.8,1.1,.25,x,.55,z,0x9a9a94,{g:1}).b(.9,.2,.3,x,1.15,z,0x8a8a84)}fence(t,6.5,-6,16,-6);fence(t,16,-6,16,2);fence(t,6.5,2,16,2);
  for(let i=0;i<6;i++)t.f_(1.2,.5,1.2,-7+(i%3)*1.6,.3,4+(i>>1)*.8,[0xff8ab8,0xffd84a,0xb878ff][i%3]);lamp(t,-3,5);lamp(t,3,5)});
addStr(56,46,0,(k,e,f)=>{const t=new TB(k,e,f,56,46,0,VY,1); // Fazendas do Sul
  for(const[x,z,ry]of[[-12,-6,.2],[12,-8,-.3]]){const s=sub(t,56+x,46+z,ry,1);s.b(7,4,5,0,2,0,0x9a3a2a,{g:1});s.b(7.4,.3,5.4,0,4.1,0,0x6a2a1a);for(let i=0;i<4;i++)s.b(7.6-i*1.7,.6,5.6,0,4.5+i*.55,0,0x5a3a2a);s.b(2.4,2.8,.15,0,1.4,2.55,0x3a2010).b(2.6,.12,.18,0,1.4,2.6,0xf0e8d8,{rz:.8}).b(2.6,.12,.18,0,1.4,2.6,0xf0e8d8,{rz:-.8});s.col(0,0,3)}
  const F=[[-14,8,0xd9b83a],[-4,10,0x5aa83a],[6,10,0xe0802a],[16,7,0xd9b83a]];for(const[x,z,c]of F){for(let r=0;r<4;r++)for(let q=0;q<6;q++)t.b(.6,.4+(c==0xe0802a?.1:0),.6,x-3.2+q*1.25,.25,z-2+r*1.3,c==0xe0802a&&(q+r)%2?0x4a8a3a:c);fence(t,x-4,z-2.8,x+4,z-2.8);fence(t,x-4,z+2.8,x+4,z+2.8)}
  {const s=sub(t,56+2,46-12,0,1.2);for(let i=0;i<5;i++)s.b(2.8-i*.35,1.6,2.8-i*.35,0,.8+i*1.6,0,i%2?0xd8ccb0:0xc8bca0,{g:i==0});s.b(2.4,1.2,2.4,0,8.6,0,0x8a5a30);s.b(.2,6,.3,0,9,1.4,0x6a4a2a,{rz:.7}).b(.2,6,.3,0,9,1.4,0x6a4a2a,{rz:-.7});s.col(0,0,1.8)}
  t.b(.15,2.2,.15,0,1.1,16,0x6b4524,{g:1}).b(1.6,.15,.15,0,1.7,16,0x6b4524).b(.6,.6,.6,0,2.4,16,0xd8b860).b(.9,.2,.9,0,2.8,16,0x5a3a20);for(const[x,z]of[[-6,-1],[-5,-.5],[7,0]])t.b(1.4,1.1,1.4,x,.55,z,0xe8c860,{g:1})});
addStr(76,6,0,(k,e,f)=>{const t=new TB(k,e,f,76,6,0,VY,1); // Rua do Mercado
  const cols=[0xc0302a,0x2a6ac0,0xd9a030,0x3a9a4a,0x8a3aa0,0xe06a2a];for(let i=0;i<6;i++){const x=-11+(i>>1)*9,z=(i%2?7:-7),ry=i%2?PI:0,s=sub(t,76+x,6+z,ry,1.3);s.b(2.6,.9,1.4,0,.45,0,0x8a6a3a,{g:1});for(const a of[-1,1])for(const b of[-1,1])s.b(.15,2.4,.15,a*1.2,1.2,b*.65,0x5a3a20);
    for(let j=0;j<4;j++)s.b(3,.12,.45,0,2.45-j*.08,-.6+j*.42,j%2?cols[i]:0xf0e8d8);for(let j=0;j<3;j++)s.b(.3,.3,.3,-.6+j*.6,1,0,[0xe04a3a,0xffd84a,0x6ac050,0x8a5a32,0xd8c8a8][(i+j)%5]);t.col(x,z,1.8)}
  tent(sub(t,76+16,6-9,.4,1),0,0,0,0x8a2a6a);t.col(16,-9,2);for(const x of[-14,0,14])for(const z of[-3.6,3.6])lamp(t,x,z,0xffb860);for(let i=0;i<5;i++){crate(t,-6+i*3,(i%2?10:-10),.9);barrel(t,-5+i*3,(i%2?10.6:-10.6))}});
// moradores novos
const _spawnNPCs160=spawnNPCs;spawnNPCs=function(){_spawnNPCs160();const L=[['Carpinteiro',52,-46],['Tecelã',46,-58],['Aprendiz de Ferreiro',58,-56],['Lavradora',50,52],['Pastor',62,40],['Fazendeiro',44,40],['Sacerdotisa',-60,40],['Jardineiro',-66,44],['Mercador',72,1],['Comerciante',82,12],['Criança',-50,30],['Pescador',30,70]];
  L.forEach(([nm,x,z],i)=>{const n=mkNPC('morador'+i,'villager',x,z,{nm,wander:1,wr:9,talk:'aldeao'});inter({x:0,z:0,r:2.6,npc:n,ic:'💬',label:()=>'Falar com '+n.nm,act:()=>talkTo(n),kind:'npc'})});
  [['Sargento Brask',-55,-44],['Recruta Ivo',-50,-43],['Sentinela',-64,-56]].forEach(([nm,x,z],i)=>{const n=mkNPC('guarda'+(i+2),'guard',x,z,{nm,ic:'🛡️',still:1,w:'sword',talk:'aldeao'});inter({x:0,z:0,r:2.6,npc:n,ic:'🛡️',label:()=>'Falar com '+n.nm,act:()=>talkTo(n),kind:'npc'})})};

// ---------- construções pelo mapa (5 por bioma, no estilo de cada lugar)
const W5=[["plan",-213,319,'casa'],["plan",-129,165,'moinho'],["plan",11,403,'poco'],["plan",137,137,'torre'],["plan",109,319,'acamp'],["flor",361,193,'casa'],["flor",179,151,'moinho'],["flor",445,39,'santo'],["flor",347,-87,'poco'],["flor",193,-101,'ruina'],
  ["mata",109,-367,'cabana'],["mata",-17,-409,'torre'],["mata",-185,-297,'santo'],["mata",25,-185,'ruina'],["mata",123,-213,'acamp'],["mang",-473.0,-4.3,'palafita',6.28],["mang",-209.9,169.8,'palafita',5.23],["mang",-244.4,-153.6,'cais',4.19],["mang",-591,-73,'santo'],["mang",-283,193,'cabana'],
  ["cald",599,-605,'forja'],["cald",459,-521,'torre'],["cald",599,-241,'ruina'],["cald",137,-381,'acamp'],["cald",585,-465,'obelisco'],["outono",-605,-605,'casa'],["outono",-395,-591,'cabana'],["outono",-605,-409,'torre'],["outono",-283,-185,'santo'],["outono",-465,-465,'ruina'],
  ["neve",501,-605,'cabana'],["neve",137,-409,'torre'],["neve",221,-605,'santo'],["neve",-45,-605,'acamp'],["neve",361,-591,'cabana'],["savana",403,263,'acamp'],["savana",599,-199,'poco'],["savana",599,235,'torre'],["savana",417,151,'acamp'],["savana",599,53,'santo'],
  ["deserto",599,599,'acamp'],["deserto",347,599,'ruina'],["deserto",375,291,'obelisco'],["deserto",277,389,'poco'],["deserto",529,473,'ruina'],["costa",-183.0,361.0,'cais',1.05],["costa",-45,417,'casa'],["costa",11,571,'torre'],["costa",-255,473,'acamp'],["costa",53,459,'cabana'],
  ["cristal",-605,599,'ruina'],["cristal",-255,389,'obelisco'],["cristal",-605,305,'santo'],["cristal",-381,445,'torre'],["cristal",-465,263,'ruina']];
const W5P={plan:[0x8a5a32,0x9a948a,0x8a3a2a,0xffc860],flor:[0xa07a52,0xd8d0c0,0x5a3a8a,0xffc8f0],mata:[0x5a3a20,0x7a7a70,0x3a5a3a,0xffc860],mang:[0x4a3a2a,0x5a5a50,0x3a4a3a,0x9aff7a],cald:[0x3a2a24,0x4a403a,0x2a2a2a,0xff6a1a],outono:[0x6a3a1e,0x8a7a6a,0x8a2a1a,0xffb050],
  neve:[0x6a4a32,0xc8d4e0,0xf0f4fa,0x9ae8ff],savana:[0x9a6a3a,0xb8986a,0xc8a050,0xffc860],deserto:[0xc8a060,0xd8b878,0xe8d0a0,0xffd060],costa:[0x8a6a42,0xb0a898,0x2a4a6a,0xffe8a0],cristal:[0x3a3058,0x4a4068,0x6a4ab0,0xb07aff]};
const W5B={
  casa(t,p){house(t,5,4,shade(p[1],1.15),p[2],0);for(const[a,b,c,d]of[[-6,-6,6,-6],[6,-6,6,6],[-6,6,6,6]])fence(t,a,b,c,d,p[0]);for(let r=0;r<3;r++)for(let q=0;q<4;q++)t.b(.7,.45,.7,-4+q*1.4,.25,-9+r*1.2,r%2?0xd9b83a:0x6aa84a);t.b(1.3,1,1.3,5,.5,4,0xe8c860,{g:1})},
  moinho(t,p){for(let i=0;i<5;i++)t.b(3-i*.35,1.6,3-i*.35,0,.8+i*1.6,0,i%2?shade(p[1],1.1):p[1],{g:i==0});t.b(2.6,1.2,2.6,0,8.6,0,p[2]);t.b(.2,6,.3,0,9,1.5,p[0],{rz:.7}).b(.2,6,.3,0,9,1.5,p[0],{rz:-.7});t.b(1.2,2,.15,0,1,1.6,0x3a2010);t.col(0,0,1.9)},
  poco(t,p){for(let i=0;i<10;i++){const a=i/10*TAU;t.b(.9,.9,.5,C(a)*1.3,.45,S(a)*1.3,p[1],{ry:-a,g:1})}t.b(2,.1,2,0,.15,0,0x2a6aa0);for(const s of[-1,1])t.b(.2,2.6,.2,s*1.2,1.3,0,p[0]);t.b(3,.2,1.6,0,2.65,0,p[2]).b(2.6,.4,1.2,0,2.95,0,shade(p[2],.85));t.b(.4,.4,.4,.4,1.6,0,0x6a4a2a);t.col(0,0,1.7);barrel(t,2.4,.5);crate(t,-2.4,-.6,.8)},
  torre(t,p){stoneTower(t,0,0,9,p[1],shade(p[1],.82),p[3]);for(let i=0;i<5;i++)t.b(.7,.5,.7,2.6+i*.4,.25,1.6-i*.3,p[1],{ry:i})},
  acamp(t,p){tent(t,-3,-2,.4,p[2]);tent(t,3,-1.5,-.5,shade(p[2],.8));t.col(-3,-2,1.8);t.col(3,-1.5,1.8);t.b(1.2,.2,1.2,0,.1,3,0x3a3030);t.e_(.6,.5,.6,0,.4,3,0xff8a2a);for(const a of[0,1.6,3.2])t.b(1.8,.35,.35,C(a)*2,.18,3+S(a)*2,p[0],{ry:a});crate(t,-5,2,1);barrel(t,5,2.5)},
  ruina(t,p){for(let i=0;i<7;i++){const a=i/7*TAU,h=1+((i*37)%5);t.b(1.2,h,1.2,C(a)*6,h/2,S(a)*6,i%2?p[1]:shade(p[1],.85),{g:1});t.col(C(a)*6,S(a)*6,.8)}t.b(1.2,4,1.2,-1.6,2,-6,p[1],{g:1}).b(1.2,4,1.2,1.6,2,-6,p[1],{g:1}).b(4.4,1,1.3,0,4.5,-6,shade(p[1],.9));
    for(let i=0;i<5;i++)t.b(1.3,.6,.8,-3+i*1.6,.3,2+(i%2),shade(p[1],.75),{ry:i*.7});t.b(4,.3,4,0,.15,0,shade(p[1],.7))},
  cabana(t,p){t.b(6,3,5,0,1.5,0,p[0],{g:1});for(let i=0;i<5;i++)t.b(6.2,.2,5.2,0,.3+i*.6,0,shade(p[0],.8));for(let i=0;i<4;i++)t.b(6.8-i*1.6,.5,5.6,0,3.2+i*.45,0,i%2?p[2]:shade(p[2],.85));t.b(.8,3.2,.8,2,4.2,-1.4,p[1]);t.b(1.2,2,.12,0,1,2.55,0x3a2010);t.e_(.7,.7,.12,-1.8,1.8,2.55,0xffcf5a);t.col(0,0,3.2);
    for(let i=0;i<6;i++)t.b(1.6,.35,.35,-4.2,.2+(i>>1)*.36,-1+(i%2)*.4,0x7a5232)},
  palafita(t,p){for(const a of[-1,1])for(const b of[-1,1])t.b(.3,6,.3,a*2.2,-.8,b*1.8,0x3a2a1a,{g:1});t.b(5,.3,4.2,0,2.2,0,p[0]);t.b(4.2,2.4,3.4,0,3.5,0,shade(p[0],1.2));for(let i=0;i<3;i++)t.b(5-i*1.3,.5,4.4,0,4.9+i*.45,0,p[2]);
    for(let i=0;i<4;i++)t.b(1,.15,.6,0,1.8-i*.45,2.6+i*.6,p[0]);t.col(0,0,2.8);t.e_(.4,.5,.4,2.4,2.8,2,p[3])},
  cais(t,p){t.b(3.6,2.4,3,0,1.2,-3,p[0],{g:1});for(let i=0;i<3;i++)t.b(4-i*1.1,.5,3.6,0,2.6+i*.45,-3,p[2]);t.col(0,-3,2);for(let i=0;i<8;i++)t.b(1.8,.15,1,0,.6,-.5+i*1.05,0x8a6a42);for(let i=0;i<4;i++)for(const s of[-1,1])t.b(.2,1.4,.2,s*.9,0,.5+i*2,0x4a3020);
    t.b(1.2,.4,3,2.2,.2,5,0x6a4a2a,{ry:.2}).b(.08,1.8,.08,2.2,1.1,5,0xd8d0c0)},
  santo(t,p){t.b(2.2,.4,2.2,0,.2,0,p[1],{g:1}).b(1.4,.5,1.4,0,.65,0,shade(p[1],.9));t.b(.7,1.6,.5,0,1.7,0,shade(p[1],1.15)).b(.6,.6,.6,0,2.8,0,shade(p[1],1.2));for(const[a,b]of[[-.8,.8],[.8,.8],[0,1]])t.b(.12,.3,.12,a,.55,b,0xf0e8d0);for(const[a,b]of[[-.8,.8],[.8,.8],[0,1]])t.e_(.06,.1,.06,a,.75,b,p[3]);t.col(0,0,1.1)},
  forja(t,p){t.b(8,.3,6,0,.15,0,p[1],{g:1});t.b(3,3,2.6,-2,1.5,-1.4,shade(p[1],.8),{g:1}).b(1.6,1,.2,-2,.8,-.05,0x1a1010);t.e_(1.4,.7,.3,-2,.7,0,0xff6a1a);t.b(.9,4,.9,-3,4.5,-2,shade(p[1],.7));t.b(1.6,.8,.8,2,.8,1,0x2a2a30).b(.8,.6,.6,2,.3,1,0x1a1a20);t.col(-2,-1.4,1.8);
    for(let i=0;i<3;i++)t.e_(1.2,.12,1.2,-3+i*3,.32,2.4,0xff5a1a)},
  obelisco(t,p){t.b(3,.6,3,0,.3,0,p[1],{g:1}).b(2,.6,2,0,.9,0,shade(p[1],.9));t.b(1.2,7,1.2,0,4.6,0,p[1]).b(.8,1,.8,0,8.6,0,shade(p[1],1.1),{rx:.785,rz:.785});for(let i=0;i<4;i++)t.e_(.15,.6,1.25,0,2.6+i*1.4,0,p[3]);t.col(0,0,1.2);
    for(let i=0;i<4;i++){const a=i/4*TAU+.4;t.b(.6,1+i%2,.6,C(a)*4,.5,S(a)*4,shade(p[1],.85),{g:1})}}};
for(const[rid,x,z,ty,ry]of W5){const p=W5P[rid]||W5P.plan,r=ty=='casa'||ty=='acamp'||ty=='ruina'?12:ty=='cais'?7:9;if(ty!='palafita'&&ty!='cais')flat(x,z,r);NOTREE.push({x,z,r:r*.8+5});
  addStr(x,z,0,(k,e,f)=>W5B[ty](new TB(k,e,f,x,z,ry!=null?ry:hash2(x|0,z|0)*TAU,ty=='palafita'?Math.max(-.3,groundAt(x,z)):null,1.25),p))}
