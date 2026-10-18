'use strict';
/* =============================================================================
   VOXEL REALMS · habilidades
   árvore de habilidades (Guerreiro, Arcano, Sobrevivência) com pontos por nível,
   magias, passivas, barra de 4 atalhos, recurso (Fúria com armas, Mana com
   cajados/varinhas), dash com esquiva perfeita e corrida
   ============================================================================= */
const SK={
  // Guerreiro
  giro:{t:'guerra',n:'Turbilhão',ic:'🌀',lv:2,cost:30,cd:.5,d:r=>`Gira a arma 3 vezes acertando todos ao redor (${90+30*(r-1)}% de dano por giro).`},
  salto:{t:'guerra',n:'Salto Sísmico',ic:'💥',lv:4,cost:10,cd:9,d:r=>`Salta até o alvo e esmaga o chão (${260+60*(r-1)}% de dano), atordoando por ${(1.4+.3*r).toFixed(1)} s.`},
  grito:{t:'guerra',n:'Grito de Guerra',ic:'📯',lv:6,cost:0,cd:20,d:r=>`+${25+5*r}% de dano e regeneração por 10 s. Atordoa quem estiver perto.`},
  pele:{t:'guerra',n:'Pele de Ferro',ic:'🛡️',lv:3,pas:1,d:r=>`Passiva: +${15*r}% de Armadura.`},
  brutal:{t:'guerra',n:'Brutalidade',ic:'🪓',lv:5,pas:1,d:r=>`Passiva: +${6*r}% de dano e +${2*r}% de chance crítica.`},
  // Arcano (magias)
  bolafogo:{t:'arcano',n:'Bola de Fogo',ic:'☄️',lv:1,cost:15,cd:.9,mag:1,d:r=>`Lança uma bola de fogo que explode em área (${180+40*(r-1)}% de dano mágico) e incendeia.`},
  gelo:{t:'arcano',n:'Nova Gélida',ic:'❄️',lv:3,cost:25,cd:8,mag:1,d:r=>`Explosão de gelo ao redor (${120+30*(r-1)}%): congela por 1 s e deixa lentos por 3 s.`},
  raio:{t:'arcano',n:'Raio em Cadeia',ic:'⚡',lv:5,cost:20,cd:2.5,mag:1,d:r=>`Raio que salta entre ${3+r} inimigos (${140+30*(r-1)}% cada).`},
  escudo:{t:'arcano',n:'Escudo Arcano',ic:'🔮',lv:7,cost:30,cd:18,mag:1,d:r=>`Bolha que absorve ${20+10*r}% da sua vida máxima em dano por 8 s.`},
  meteoro:{t:'arcano',n:'Meteoro',ic:'🌠',lv:10,cost:45,cd:12,mag:1,d:r=>`Um meteoro cai no alvo após 1 s (${400+80*(r-1)}% de dano mágico) e deixa o chão em chamas.`},
  mente:{t:'arcano',n:'Mente Arcana',ic:'🧠',lv:4,pas:1,d:r=>`Passiva: +${12*r}% de Poder Mágico e +${3*r}% de Mana por segundo.`},
  // Sobrevivência
  cura:{t:'sobrev',n:'Toque Restaurador',ic:'💚',lv:2,cost:20,cd:14,mag:1,d:r=>`Cura ${20+6*r}% da vida, remove veneno e cura também o mercenário.`},
  sombra:{t:'sobrev',n:'Passo Sombrio',ic:'🌑',lv:5,cost:15,cd:6,d:r=>`Teleporta até 9 m atravessando inimigos (${150+40*(r-1)}% de dano em quem estiver no caminho).`},
  chama:{t:'sobrev',n:'Explosão de Chamas',ic:'🔥',lv:8,cost:25,cd:6,mag:1,d:r=>`Onda de fogo ao redor (${220+40*(r-1)}%) que incendeia os inimigos.`},
  agil:{t:'sobrev',n:'Pés Ligeiros',ic:'👟',lv:3,pas:1,d:r=>`Passiva: +${5*r}% de velocidade e o dash recarrega ${10*r}% mais rápido.`},
  vital:{t:'sobrev',n:'Vitalidade',ic:'❤️',lv:6,pas:1,d:r=>`Passiva: +${8*r}% de vida máxima.`}};
const TREE=[{id:'guerra',n:'Guerreiro',c:'#ff8a5a',ic:'⚔️'},{id:'arcano',n:'Arcano',c:'#a88aff',ic:'🔮'},{id:'sobrev',n:'Sobrevivência',c:'#7ad88a',ic:'🌿'}];
const SKX={pocao:{n:'Poção de Vida',ic:'🧪',cd:18},dash:{n:'Dash',ic:'💨',cd:.75}};
P.sk={};P.sp=1;P.bar=[null,null,null,null];P.run=0;P.dash=0;P.shield=0;
const rk=id=>P.sk[id]||0,reqLv=(id,r)=>SK[id].lv+(r>0?r*3:0);
const MANA=()=>ST.wk=='staff'||ST.wk=='wand';
function skPassive(s){s.arm*=1+.15*rk('pele');s.dmg+=6*rk('brutal');s.crit+=2*rk('brutal');s.mag=(s.mag||0)+12*rk('mente');s.ms+=5*rk('agil');s.hpP=8*rk('vital');s.mreg=8+3*rk('mente');if(typeof clsPassive=='function')clsPassive(s);if(typeof petPassive=='function')petPassive(s);if(typeof archerPassive=='function')archerPassive(s);if(typeof mountPassive=='function')mountPassive(s)}
function learn(id){const r=rk(id);if(r>=3||P.sp<1||P.lv<reqLv(id,r))return false;P.sk[id]=r+1;P.sp--;if(!r&&!SK[id].pas){const i=P.bar.indexOf(null);if(i>=0)P.bar[i]=id}calcStats();snd(880,.12,'sine');flash(P.x,P.y+1.6,P.z,0xc8a0ff,3,.3);hud();save();return true}
function spellDmg(m){return rollDmg(m*(1+(ST.mag||0)/100))}
function cdOf(id){return(SK[id]?SK[id].cd||0:SKX[id].cd)*(1-ST.cdr/100)*(id=='salto'&&ST.leg.has('sismo')?.5:1)*(id=='dash'?1-.1*rk('agil'):1)}
function useSkill(slot){const id=P.bar[slot];if(!id){openTree();return}dismount();const S_=SK[id],r=rk(id);if(!canAct()||!r)return;if(S_.bow&&!bow()){pop('Requer arco',P.x,P.y+3,P.z,'#ffd070');sweep(200,120,.1,'square',.03);return}
  if(P.cd[id]>0)return;const cost=(S_.cost||0)*(id=='giro'&&ST.leg.has('furia')?.6:1);if(P.fury<cost){pop(MANA()?'Mana insuficiente':'Fúria insuficiente',P.x,P.y+3,P.z,MANA()?'#7ab4ff':'#ff8a5a');sweep(200,120,.1,'square',.03);return}
  P.fury-=cost;P.cd[id]=cdOf(id);const t=bestTarget(14,1);if(t&&id!='giro'&&id!='grito'&&id!='escudo'&&id!='cura')P.f=Math.atan2(t.x-P.x,t.z-P.z);
  if(id=='giro'){P.act={k:'spin',t:0,dur:.75,hp:2,sk:'giro',ticks:0};sweep(300,900,.5,'triangle',.05)}
  else if(id=='salto'){let tx,tz;if(t){tx=t.x-S(P.f)*.5;tz=t.z-C(P.f)*.5}else{tx=P.x+S(P.f)*8;tz=P.z+C(P.f)*8}if(!walkable(tx,tz)){tx=P.x;tz=P.z}P.leap={x0:P.x,z0:P.z,y0:P.y,x1:tx,z1:tz,t:0,dur:.6};sweep(200,700,.3,'triangle',.05)}
  else if(id=='grito')P.act={k:'shout',t:0,dur:.7,hp:.4,sk:id};
  else if(id=='sombra'){shadowStep(t)}
  else P.act={k:S_.bow?'shoot':'cast',t:0,dur:id=='meteoro'?.7:S_.bow?.45:.5,hp:S_.bow?.6:.5,sk:id,tg:t};hud()}
function skillHit(){const a=P.act,id=a.sk,r=rk(id),m=1+.3*(r-1)*0;const fx0=P.x+S(P.f),fz0=P.z+C(P.f);skillFx(id,a,r,fx0,fz0);
  if(SK[id].t=='arco'){archerSkill(id,a,r);return}
  if(id=='grito'){P.buff.grito=10;P.gritoK=.25+.05*r;addFury(40);ring(P.x,P.z,6,0xffd34a,.6);flash(P.x,P.y+2,P.z,0xffd34a,6,.5);snd(220,.5,'sawtooth');sweep(180,90,.6,'square',.05);SHK=.3;for(const e of E)if(!e.dead&&!e.t.passive&&hy(e.x-P.x,e.z-P.z)<6)e.stun=Math.max(e.stun,.6);return}
  if(id=='chama'){ring(P.x,P.z,6.5,0xff7a1a,.6);flash(P.x,P.y+1,P.z,0xff7a20,9,.45);fx(P.x,P.y+.5,P.z,0xff8a1a,40,14,.28,1.2);snd(70,.4,'sawtooth');SHK=.35;
    for(const e of E)if(!e.dead&&hy(e.x-P.x,e.z-P.z)-e.r<6.5){const[dm,c]=spellDmg(2.2+.4*(r-1));hurtMob(e,dm,c,'chama');e.burn=3}return}
  if(id=='bolafogo'){proj('p','fire',fx0,P.y+1.8,fz0,a.tg||{x:P.x+S(P.f)*20,z:P.z+C(P.f)*20,y:P.y},spellDmg(1.8+.4*(r-1))[0],{aoe:3,c:0xff7a1a,brn:1,dir:a.tg?null:new V3(S(P.f),0,C(P.f))});sweep(400,120,.35,'sawtooth',.04);flash(fx0,P.y+1.8,fz0,0xff8a30,2.4,.2);return}
  if(id=='gelo'){ring(P.x,P.z,6,0x9ae4ff,.6);ring(P.x,P.z,3.5,0xffffff,.4);flash(P.x,P.y+1,P.z,0x9ae4ff,8,.45);fx(P.x,P.y+.6,P.z,0xd8f4ff,40,12,.2,.8);snd(1400,.4,'triangle');
    for(const e of E)if(!e.dead&&hy(e.x-P.x,e.z-P.z)-e.r<6){const[dm,c]=spellDmg(1.2+.3*(r-1));hurtMob(e,dm,c,'gelo');e.stun=Math.max(e.stun,1);e.slow=3}return}
  if(id=='raio'){let src={x:P.x,y:P.y+1.6,z:P.z},hit=[],n=3+r;for(let i=0;i<n;i++){let b=null,bd=i?7:12;for(const e of E){if(e.dead||hit.includes(e))continue;const d=hy(e.x-src.x,e.z-src.z);if(d<bd){bd=d;b=e}}if(!b)break;hit.push(b);bolt(src,{x:b.x,y:b.y+1.2,z:b.z});const[dm,c]=spellDmg(1.4+.3*(r-1));hurtMob(b,dm,c,'raio');src={x:b.x,y:b.y+1.2,z:b.z}}
    if(!hit.length)bolt({x:P.x,y:P.y+1.6,z:P.z},{x:fx0+S(P.f)*7,y:P.y+1,z:fz0+C(P.f)*7});snd(1600,.2,'sawtooth');return}
  if(id=='escudo'){P.shield=ST.mx*(.2+.1*r);P.shT=8;snd(520,.4,'sine');flash(P.x,P.y+1.4,P.z,0xa88aff,4,.4);return}
  if(id=='meteoro'){const t=a.tg,x=t?t.x:P.x+S(P.f)*9,z=t?t.z:P.z+C(P.f)*9;tele(x,z,5,1.05,T=>{SHK=.8;HITSTOP=.08;const y=groundAt(T.x,T.z);flash(T.x,y+1,T.z,0xff8a30,10,.5);fx(T.x,y+.5,T.z,0xff6a1a,50,14,.32,1.8);ring(T.x,T.z,5,0xffa040,.5);snd(60,.7,'sawtooth');
      for(const e of E)if(!e.dead&&hy(e.x-T.x,e.z-T.z)-e.r<5){const[dm,c]=spellDmg(4+.8*(r-1));hurtMob(e,dm,c,'meteoro');e.burn=4}},0xff8a30);
    for(let i=0;i<8;i++)setTimeout(()=>fx(x+(R()-.5),groundAt(x,z)+20-i*2.4,z+(R()-.5),0xff8a30,3,1,.4,0,0),i*110);return}
  if(id=='cura'){const h=ST.mx*(.2+.06*r);heal(h);P.psn=0;fx(P.x,P.y+1,P.z,0x7dff8a,24,4,.16,2);ring(P.x,P.z,3,0x7dff8a,.5);snd(660,.3,'sine');setTimeout(()=>snd(990,.3,'sine'),120);return}}
// raio visual: segmentos em zigue-zague
const BLM=new THREE.MeshBasicMaterial({color:0xc8e0ff,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending}),BLS=[];
function bolt(a,b){const k=new Bake();let p=[a.x,a.y,a.z];const n=6;for(let i=1;i<=n;i++){const t=i/n,q=[lerp(a.x,b.x,t)+(i<n?(R()-.5)*1.2:0),lerp(a.y,b.y,t)+(i<n?(R()-.5)*1.2:0),lerp(a.z,b.z,t)+(i<n?(R()-.5)*1.2:0)];
  const dx=q[0]-p[0],dy=q[1]-p[1],dz=q[2]-p[2],L=Math.hypot(dx,dy,dz);_pv.set(dx,dy,dz).normalize();_qu.setFromUnitVectors(_nv.set(0,1,0),_pv);_eu.setFromQuaternion(_qu);k.box(.12,L,.12,(p[0]+q[0])/2,(p[1]+q[1])/2,(p[2]+q[2])/2,0xffffff,{rx:_eu.x,ry:_eu.y,rz:_eu.z});p=q}
  const m=new THREE.Mesh(k.geo(),BLM);sc.add(m);BLS.push({m,t:.18});flash(b.x,b.y,b.z,0x9ac8ff,2.2,.2);fx(b.x,b.y,b.z,0xc8e0ff,6,5,.1,1);boltFx(b)}
function boltUpd(dt){for(let i=BLS.length-1;i>=0;i--){const b=BLS[i];b.t-=dt;b.m.visible=R()<.8;if(b.t<=0){sc.remove(b.m);b.m.geometry.dispose();BLS.splice(i,1)}}}
function shadowStep(t){let tx,tz;if(t){tx=t.x+S(P.f)*1.5;tz=t.z+C(P.f)*1.5}else{tx=P.x+S(P.f)*9;tz=P.z+C(P.f)*9}const n=12,x0=P.x,z0=P.z;let lx=x0,lz=z0;
  for(let i=1;i<=n;i++){const x=lerp(x0,tx,i/n),z=lerp(z0,tz,i/n);if(!walkable(x,z))break;lx=x;lz=z;puff(x,groundAt(x,z)+1,z,0x2a1a3a,1.6)}
  const r=rk('sombra');for(const e of E)if(!e.dead&&segD(e.x,e.z,[x0,z0],[lx,lz])<e.r+1){const[dm,c]=rollDmg(1.5+.4*(r-1));hurtMob(e,dm,c,'sombra')}
  flash(x0,P.y+1.4,z0,0x7a4aaa,3,.3);P.x=lx;P.z=lz;P.inv=Math.max(P.inv,.3);flash(lx,groundAt(lx,lz)+1.4,lz,0xb07aff,3,.3);sweep(900,200,.25,'sawtooth',.04);sombraFx(x0,z0,lx,lz)}
// ---------- dash (esquiva) e corrida
function dash(){if(P.dead||P.dash>0||P.cd.dash>0||P.leap||UI.block())return;dismount();P.act=null;P.cd.dash=cdOf('dash');P.dash=.22;P.inv=Math.max(P.inv,.34);P.pfd=0;
  const[x,z]=inputDir();if(x||z){P.rdx=x;P.rdz=z;P.f=Math.atan2(x,z)}else{P.rdx=S(P.f);P.rdz=C(P.f)}sweep(500,1600,.14,'triangle',.05);puff(P.x,P.y+.4,P.z,0xd8d0e0,1.6);flash(P.x,P.y+1.3,P.z,0x9ae4ff,2.4,.2)}
const roll=dash;
function perfectDodge(){if(P.pfd)return;P.pfd=1;HITSTOP=.22;P.buff.pf=2;pop('ESQUIVA PERFEITA!',P.x,P.y+3.6,P.z,'#9ae4ff',1);ring(P.x,P.z,3,0x9ae4ff,.4);flash(P.x,P.y+1.4,P.z,0x9ae4ff,4,.4);snd(1500,.18,'sine')}
function toggleRun(v){P.run=v==null?!P.run:v;$('runb').classList.toggle('on',!!P.run)}
function potion(){if(P.dead||P.cd.pocao>0||UI.block())return;if(P.hp>=ST.mx){pop('Vida cheia',P.x,P.y+3,P.z,'#fff');return}P.cd.pocao=SKX.pocao.cd;P.psn=0;heal(ST.mx*.45);snd(660,.15,'sine');fx(P.x,P.y+1,P.z,0x6fe07a,14,3,.15,2)}
// bolha do escudo arcano
const SHB=spr(0xa88aff,3.2,.35);SHB.visible=false;sc.add(SHB);
function skillsUpd(dt){boltUpd(dt);archerUpd(dt,performance.now()/1000);if(P.shT>0){P.shT-=dt;if(P.shT<=0)P.shield=0}SHB.visible=P.shield>0;if(SHB.visible){SHB.position.set(P.x,P.y+1.4,P.z);SHB.material.opacity=.25+.08*S(T60*.2)}
  if(MANA())P.fury=Math.min(100,P.fury+dt*(ST.mreg||8))}

// ---------- janela da árvore de habilidades
let TSEL=null;
function openTree(){if(!run||DLG)return;openWin('tree');treeRender()}
function treeRender(){if(UI.open!='tree')return;$('tpts').textContent=P.sp+' ponto'+(P.sp==1?'':'s');
  $('tcols').innerHTML=treeOrder().map(T=>`<div class="tcol"><h4 style="color:${T.c}">${T.ic} ${T.n}</h4>${Object.keys(SK).filter(k=>SK[k].t==T.id).sort((a,b)=>SK[a].lv-SK[b].lv).map(k=>{const S_=SK[k],r=rk(k),can=r<3&&P.sp>0&&P.lv>=reqLv(k,r);
    return`<button class="tn ${r?'on':''} ${can?'can':''} ${TSEL==k?'sel':''}" data-k="${k}"><i>${S_.ic}</i><span>${S_.n}${S_.pas?' <small>(passiva)</small>':''}</span><em>${'●'.repeat(r)}${'○'.repeat(3-r)}</em>${P.lv<S_.lv?`<u>Nv ${S_.lv}</u>`:''}</button>`}).join('')}</div>`).join('');
  const d=$('tdet');if(!TSEL){d.innerHTML='<p class="ihint">Você ganha 1 ponto a cada nível. Toque numa habilidade para aprender ou melhorar, e escolha em qual dos 4 atalhos ela fica.</p>';return}
  const S_=SK[TSEL],r=rk(TSEL),nr=Math.min(3,r+1),need=reqLv(TSEL,r);
  d.innerHTML=`<b>${S_.ic} ${S_.n}</b><small>${TREE.find(t=>t.id==S_.t).n} · nível ${r}/3${S_.cost?` · custo ${S_.cost}`:''}${S_.cd>1?` · recarga ${S_.cd}s`:''}</small><p>${S_.d(Math.max(1,r))}</p>${r<3?`<p class="nx">Próximo nível: ${S_.d(nr)}</p>`:''}
   <div class="tb">${r<3?`<button class="ib ${P.sp>0&&P.lv>=need?'':'off'}" data-l="1">${r?'Melhorar':'Aprender'} (1 ponto${P.lv<need?` · nível ${need}`:''})</button>`:''}${r&&!S_.pas?[0,1,2,3].map(i=>`<button class="ib ${P.bar[i]==TSEL?'':'off'}" data-s="${i}">Atalho ${i+1}</button>`).join(''):''}</div>`}
function bindTree(){$('tree').onclick=e=>{const n=e.target.closest('[data-k]');if(n){TSEL=n.dataset.k;treeRender();snd(700,.04,'sine');return}
  const l=e.target.closest('[data-l]');if(l){if(!learn(TSEL))toast('✨','Não dá ainda',P.sp<1?'Sem pontos: suba de nível.':'Nível insuficiente.');treeRender();return}
  const s=e.target.closest('[data-s]');if(s){const i=+s.dataset.s,o=P.bar.indexOf(TSEL);if(o>=0)P.bar[o]=P.bar[i];P.bar[i]=TSEL;hud();treeRender();save()}}}
