'use strict';
/* =============================================================================
   VOXEL REALMS · tocha, pets, marcações do mapa, zoom do minimapa e
   qualidade adaptativa (resolução dinâmica para aparelhos medianos)
   ============================================================================= */
// ---------- tocha: item que todo personagem tem; equipa e desequipa
const TCH={on:true,g:null,fm:null,sp:null,acc:0,sm:0,fk:0,lv:0};
try{TCH.on=localStorage.getItem('vr11_torch')!='0'}catch(e){}
const _tv=new V3();
function torchBuild(){const g=new THREE.Group(),k=new Bake();
  k.box(.1,.82,.1,0,.2,0,0x6b4423).box(.17,.24,.17,0,.62,0,0x2a1a10).box(.23,.08,.23,0,.5,0,0x4a3220).box(.04,.56,.04,.075,.34,0,0x3a2a1c);
  g.add(k.mesh(MV));
  const f=new Bake();f.box(.19,.22,.19,0,.84,0,0xff7a1a).box(.12,.2,.12,0,1,0,0xffc040).box(.06,.12,.06,0,1.12,0,0xfff0b0);
  TCH.fm=f.mesh(ME);g.add(TCH.fm);
  const s=new THREE.Sprite(new THREE.SpriteMaterial({map:SPR,color:0xff9a40,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,opacity:.5}));s.scale.set(1.5,1.5,1);s.position.y=.98;g.add(s);TCH.sp=s;
  g.rotation.x=.55;g.position.set(0,-.1,.05);g.userData.keep=1;TCH.g=g}
function torchToggle(v){if(P.dead||UI.block())return;TCH.on=v==null?!TCH.on:v;try{localStorage.setItem('vr11_torch',TCH.on?'1':'0')}catch(e){}
  const b=$('torb');if(b)b.classList.toggle('on',TCH.on);sweep(TCH.on?260:420,TCH.on?900:140,.25,'sawtooth',.03);
  if(TCH.on&&TCH.g){TCH.g.updateWorldMatrix(true,false);_tv.set(0,1.05,0);TCH.g.localToWorld(_tv);fx(_tv.x,_tv.y,_tv.z,0xffb040,14,3,.1,2,-1);flash(_tv.x,_tv.y,_tv.z,0xff9a40,2.6,.3)}
  else if(TCH.g){TCH.g.updateWorldMatrix(true,false);_tv.set(0,1.05,0);TCH.g.localToWorld(_tv);puff(_tv.x,_tv.y,_tv.z,0x777777,.9);puff(_tv.x,_tv.y+.3,_tv.z,0x666666,.7)}}
function torchUpd(dt,t){if(!TCH.g)torchBuild();const hand=bow()?P.m.hR:P.m.hL,show=TCH.on&&!P.dead&&run;
  if(TCH.g.parent!==hand)hand.add(TCH.g);TCH.g.visible=show;TCH.fk+=dt;
  const fl=.5+.3*S(TCH.fk*13)+.2*S(TCH.fk*23+1);TCH.lv+=(fl-TCH.lv)*Math.min(1,dt*14);
  const night=NIGHT,base=show?(.2+night*2.1+WX.k.rain*.3):night*.2;
  TCH.sm+=dt;
  if(show){TCH.fm.scale.set(1+TCH.lv*.15,.8+TCH.lv*.55,1+TCH.lv*.15);TCH.sp.scale.setScalar(1.25+TCH.lv*.6);TCH.sp.material.opacity=.38+TCH.lv*.3;
    TCH.g.updateWorldMatrix(true,false);_tv.set(0,1.08,0);TCH.g.localToWorld(_tv);
    TCH.acc+=dt*20*GFX.fx;while(TCH.acc>=1){TCH.acc--;fx(_tv.x+(R()-.5)*.06,_tv.y,_tv.z+(R()-.5)*.06,R()<.5?0xff7a1a:R()<.6?0xffb040:0xffe090,1,.45,.07+R()*.05,1.3,-1.6)}
    if(TCH.sm>.55){TCH.sm=0;puff(_tv.x,_tv.y+.25,_tv.z,0x555555,.45);if(R()<.4)fx(_tv.x,_tv.y,_tv.z,0xfff0b0,1,1.6,.05,2.4,-.5)}
    SHU.uTP.value.set(_tv.x+S(P.f)*.9,_tv.y+.3,_tv.z+C(P.f)*.9)}
  else SHU.uTP.value.set(P.x,P.y+2.5,P.z);
  const k=show?base*(.85+TCH.lv*.3)*.8:base*.6;SHU.uTC.value.setRGB(1*k,.62*k,.3*k);SHU.uTR.value=show?13:7}

// ---------- pets (comprados com o Mercador Tobias)
const PETS={lobo:{n:'Filhote de Lobo',ic:'🐺',price:260,d:'Companheiro leal. +6% de dano.',mdl:()=>quad({c:0x8a8c92,mane:0xa4a6ac,hc:0x7a7c82,ears:1,len:.9,h:.4,wid:.38,tl:.6,run:8,scale:1.15})},
  gato:{n:'Gato da Sorte',ic:'🐱',price:340,d:'Encontra moedas. +15% de ouro.',mdl:()=>quad({c:0xd0a060,c2:0xf2e4c8,ears:1,len:.72,h:.3,wid:.28,tl:.9,tw:.14,tc:0xd0a060,run:9,tailUp:.7,scale:1.05})},
  raposa:{n:'Raposa Veloz',ic:'🦊',price:420,d:'Ágil e esperta. +7% de velocidade.',mdl:()=>{const m=MDL.fox();m.g.scale.setScalar(.95);return m}},
  ovelha:{n:'Ovelhinha Fofa',ic:'🐑',price:520,d:'Lã que protege. +10% de vida.',mdl:()=>{const m=MDL.sheep();m.g.scale.setScalar(.85);return m}}};
P.pets=[];P.pet=null;let PETO=null;
function petPassive(s){const p=P.pet;if(p=='lobo')s.dmg+=6;else if(p=='gato')s.gold+=15;else if(p=='raposa')s.ms+=7;else if(p=='ovelha')s.hpP=(s.hpP||0)+10}
function petSet(id){if(PETO){sc.remove(PETO.m.g);dropModel(PETO.m);PETO=null}P.pet=id&&PETS[id]?id:null;
  if(P.pet){const m=PETS[P.pet].mdl();m.meshes&&m.meshes.forEach(o=>o.castShadow=true);sc.add(m.g);PETO={m,x:P.x-1.5,z:P.z-1.5,y:P.y,vx:0,vz:0,f:P.f};m.g.position.set(PETO.x,PETO.y,PETO.z);puff(PETO.x,PETO.y+.4,PETO.z,0xffffff,1.6);fx(PETO.x,PETO.y+.8,PETO.z,0xffd0e0,10,3,.14,1.6,-.5)}
  calcStats();hud()}
function petUpd(dt,t){if(!PETO)return;const o=PETO,tx=P.x-S(P.f)*2.4+C(P.f)*1.4,tz=P.z-C(P.f)*2.4-S(P.f)*1.4,dx=tx-o.x,dz=tz-o.z,d=hy(dx,dz);
  if(d>38){o.x=tx;o.z=tz;o.y=groundAt(o.x,o.z);puff(o.x,o.y+.4,o.z,0xffffff,1.4)}
  else{const spd=d>1.2?Math.min(11,Math.max(4,d*2.2+(P.v||0)*.5)):0;moveEnt(o,spd?dx/d*spd:0,spd?dz/d*spd:0,dt,8,8,.3)}
  o.m.g.position.set(o.x,o.y,o.z);o.m.g.rotation.y=o.f;animate(o.m,dt,t,{v:hy(o.vx,o.vz)});o.m.g.visible=!invHide(hy(o.x-P.x,o.z-P.z))}
function buyPet(id){const p=PETS[id];if(!p)return;if(P.pets.includes(id)){petSet(P.pet==id?null:id);petRender();save();return}
  if(P.gold<p.price){toast('🪙','Ouro insuficiente','Faltam '+(p.price-P.gold)+' moedas');return}P.gold-=p.price;P.pets.push(id);snd(660,.3,'triangle');toast(p.ic,'Novo pet: '+p.n,p.d);petSet(id);petRender();save()}
function openPets(){openWin('pets');petRender()}
function petRender(){$('ptg').textContent='🪙 '+fmt(P.gold);$('ptl').innerHTML=Object.keys(PETS).map(k=>{const p=PETS[k],own=P.pets.includes(k);return`<button class="shi gm pt ${P.pet==k?'on':''}" data-p="${k}"><i>${p.ic}</i><div><b>${p.n}</b><small>${p.d}</small></div><em class="${own?'':P.gold<p.price?'no':''}">${own?(P.pet==k?'✔ Com você':'Chamar'):p.price+'🪙'}</em></button>`}).join('')}
MDL.tobias=()=>hum({skin:0xe0a878,hair:0x7a4a2a,beard:0x7a4a2a,shirt:0x2f6a3a,vest:0x8a5a2a,pants:0x4a3a2e,boots:0x3a2a1e,hat:'hood',hatC:0x8a5a2a,belt:0xd9a948,bulk:1.08});
function spawnTobias(){let best=[13,9];for(const[x,z]of[[13,9],[15,6],[12,12],[16,10],[10,14],[17,3],[-13,9],[-15,6]]){if(STRC.every(c=>hy(c[0]-x,c[1]-z)>c[2]+1.6)){best=[x,z];break}}
  const n=mkNPC('tobias','tobias',best[0],best[1],{nm:'Tobias, o Mercador',ic:'🐾',still:1});TOBIAS={x:n.x,z:n.z};
  inter({x:n.x,z:n.z,r:3,npc:n,ic:'🐾',label:()=>'Ver os pets de Tobias',act:()=>say([['Tobias',pick(['Pets de verdade, Guardião! Leais, limpos e quase sempre educados.','Uma jornada perigosa fica mais leve com um amigo ao lado.','Tenho lobinhos, gatos, raposas... escolha com o coração!'])+' ','🐾']],openPets),kind:'npc'})}
let TOBIAS=null;
// com a vila gerada, procura um ponto livre de construções perto da praça
function placeTobias(){const n=NPC.find(n=>n.id=='tobias');if(!n)return;for(const[x,z]of[[13,9],[15,6],[12,12],[16,10],[10,14],[17,3],[-13,9],[-15,6],[8,16],[-8,14]]){if(STRC.every(c=>hy(c[0]-x,c[1]-z)>c[2]+1.8)){n.x=n.hx=x;n.z=n.hz=z;n.y=groundAt(x,z);TOBIAS={x,z};return}}}

// ---------- marcações do mapa e do minimapa
const MK={q:1,p:1,s:1,b:1};try{Object.assign(MK,JSON.parse(localStorage.getItem('vr11_mk')||'{}'))}catch(e){}
const POIICONS={'Cemit':'⚰️','Acamp':'⛺','Moinho':'🌾','Colme':'🐝','Templo':'🏛️','Torre ':'🗼','Bosque':'🌳','Cabana':'🧪','Toca d':'🔥','Covil ':'🐉'};
const poiIc=n=>{for(const k in POIICONS)if(n.startsWith(k))return POIICONS[k];return'📍'};
function marks(){const L=[];
  if(MK.q)for(const q of QD)if(act(q.id)){const p=qPos(q);if(p)L.push({x:p[0],z:p[1],ic:q.cat=='main'?'❗':'❔',c:q.cat=='main'?'#ffd34a':'#7ab4ff',k:'q',n:q.n,big:q.cat=='main'})}
  if(MK.p)for(const p of POI)if(P.disc.has(REG[regionAt(p.x,p.z)].id))L.push({x:p.x,z:p.z,ic:poiIc(p.n),c:'#e8dcc0',k:'p',n:p.n});
  if(MK.s){L.push({x:21,z:-18,ic:'⚒️',c:'#ffd0a0',k:'s',n:'Forja da Helga'},{x:-10,z:-33,ic:'🧙',c:'#d0b0ff',k:'s',n:'Ancião Bram'},{x:11,z:-9.5,ic:'📋',c:'#ffe08a',k:'s',n:'Quadro de Recompensas'},{x:-20,z:-13,ic:'🍺',c:'#ffd070',k:'s',n:'Taverna (mercenários)'});
    if(TOBIAS)L.push({x:TOBIAS.x,z:TOBIAS.z,ic:'🐾',c:'#ffb8d0',k:'s',n:'Tobias, o Mercador (pets)'});if(typeof GMB!='undefined')L.push({x:GMB.x,z:GMB.z,ic:'🌑',c:'#c9a4ff',k:'s',n:'Mercante Sombrio'})}
  if(MK.b)for(const b in BOSS){const B=BOSS[b];if(P.disc.has(REG[regionAt(B.x,B.z)].id)&&bossAvailable(b))L.push({x:B.x,z:B.z,ic:'☠️',c:'#ff6a5a',k:'b',n:B.n})}
  return L}
const MMZ=[.7,1.1,1.9,3.2,5];let mmZi=2;try{mmZi=cl(+localStorage.getItem('vr11_mmz')||2,0,4)}catch(e){}
function mmZoom(d){mmZi=cl(mmZi+d,0,4);try{localStorage.setItem('vr11_mmz',String(mmZi))}catch(e){}snd(d>0?900:600,.05,'sine');$('zmi').classList.toggle('off',mmZi>=4);$('zmo').classList.toggle('off',mmZi<=0);minimap()}
function drawMarks(c,X,Z,M){c.font='13px serif';c.textAlign='center';c.textBaseline='middle';const lim=M-12;
  for(const m of marks()){let x=X(m.x),z=Z(m.z);const dx=x-M,dz=z-M,l=hy(dx,dz);let edge=false;if(l>lim){x=M+dx/l*lim;z=M+dz/l*lim;edge=true}
    if(edge&&m.k!='q'&&m.k!='b')continue;                       // locais distantes só aparecem quando entram no raio
    c.save();c.globalAlpha=edge?.9:1;c.fillStyle='rgba(8,4,12,.75)';c.beginPath();c.arc(x,z,m.big?8:6.5,0,7);c.fill();c.strokeStyle=m.c;c.lineWidth=1.5;c.stroke();c.fillStyle='#fff';c.font=(m.big?'11px':'10px')+' serif';c.fillText(m.ic,x,z+.5);c.restore()}}
function drawWorldMarks(x,k){x.textAlign='center';x.textBaseline='middle';
  for(const m of marks()){const px=(m.x+220)*k,pz=(m.z+220)*k,r=m.big?11:9;x.fillStyle='rgba(8,4,12,.82)';x.beginPath();x.arc(px,pz,r,0,7);x.fill();x.strokeStyle=m.c;x.lineWidth=2;x.stroke();x.font=(m.big?15:13)+'px serif';x.fillStyle='#fff';x.fillText(m.ic,px,pz+1)}
  x.textBaseline='alphabetic'}
function mapLegend(){$('mleg').innerHTML=[['q','❗ Missões'],['p','📍 Locais'],['s','⚒️ Serviços'],['b','☠️ Chefes']].map(([k,n])=>`<button class="mlc ${MK[k]?'on':''}" data-mk="${k}">${n}</button>`).join('')}

// ---------- qualidade adaptativa: resolução dinâmica para manter a fluidez
const DRS={s:1,t:0,n:0,ok:0,min:MOB?.6:.7,cap:1,lock:0};
function drsUpd(raw){if(!run||LOADING||document.hidden)return;DRS.t+=raw;DRS.n++;DRS.lock-=raw;if(DRS.t<2)return;const ms=DRS.t/DRS.n*1000;DRS.t=DRS.n=0;
  const tgt=1000/((FPSC||(HZ>=100?90:60))*.92);
  const slow=ms>Math.max(tgt*1.25,24),fast=ms<Math.max(tgt*.75,12);
  if(slow){DRS.ok=0;if(DRS.s>DRS.min&&DRS.lock<=0){DRS.cap=Math.min(DRS.cap,DRS.s);DRS.s=Math.max(DRS.min,+(DRS.s-.15).toFixed(2));DRS.lock=5;drsApply()}}
  else if(fast){if(++DRS.ok>=30&&DRS.cap<1){DRS.cap=Math.min(1,DRS.cap+.1);DRS.ok=8}if(DRS.ok>=8&&DRS.s<DRS.cap-.01&&DRS.lock<=0){DRS.s=Math.min(DRS.cap-.05,+(DRS.s+.1).toFixed(2));DRS.ok=0;DRS.lock=10;drsApply()}}else DRS.ok=0}
function drsApply(){rd.setPixelRatio(Math.min(devicePixelRatio||1,GFX.pr)*DRS.s);rs()}
