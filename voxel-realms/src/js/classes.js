'use strict';
/* =============================================================================
   VOXEL REALMS · classes, montarias e o Mercante Sombrio
   Guerreiro, Mago e Caçador (visual, arma inicial, bônus e habilidade inicial);
   montarias compradas na forja (a primeira é o Leão Dourado); Mercante Sombrio
   que vende itens misteriosos (aposta, como no Diablo)
   ============================================================================= */
const CLS={
  guerreiro:{n:'Guerreiro',ic:'⚔️',d:'Mestre do corpo a corpo. +20% de vida e +10 de armadura. Usa Fúria, que enche ao bater.',sk:'giro',
    wpn:{base:'Espada Curta',n:'Espada do Guardião',ic:'⚔️',wk:'sword',wd:[6,9]},mdl:{}},
  mago:{n:'Mago',ic:'🔮',d:'Domina fogo, gelo e raio. +20% de Poder Mágico e Mana mais rápida. Ataca com orbes arcanos.',sk:'bolafogo',
    wpn:{base:'Cajado Arcano',n:'Cajado do Aprendiz',ic:'🪄',wk:'staff',wd:[5,8],aff:{mag:15}},mdl:{shirt:0x34346e,cape:0x2a3f9a,capeE:0xc0d0ff,hat:'wizard',hatC:0x2a3a8a,robe:0x2a3a7a,shoulders:0,beard:0x8a8a8a,hair:0x8a8a8a}},
  cacador:{n:'Caçador',ic:'🏹',d:'Ataca de longe com o arco. +10% de velocidade e +5% de chance crítica. Começa com Chuva de Flechas.',sk:'flechas',
    wpn:{base:'Arco Curvo',n:'Arco do Batedor',ic:'🏹',wk:'bow',wd:[5,8]},mdl:{shirt:0x3d6a2a,vest:0x2f4a20,cape:0x2f5a24,capeE:0x8a6a3a,hat:'hood',hatC:0x2f5a24,shoulders:0,gloves:0x5a3a20}}};
function heroModel(cls){const c=CLS[cls]||CLS.guerreiro;return hum(Object.assign({skin:0xe0a878,hair:0x4a2a18,shirt:0x6d7684,pants:0x4a3a2e,boots:0x3a2a1e,cape:0xb3202a,capeE:0xd9a948,belt:0x5a3a20,shoulders:0x8a93a2},c.mdl))}
function setClass(cls){P.cls=CLS[cls]?cls:'guerreiro';const old=P.m;P.m=heroModel(P.cls);P.m.g.position.copy(old.g.position);P.m.g.rotation.y=old.g.rotation.y;dropModel(old);calcStats()}
function clsPassive(s){if(P.cls=='guerreiro'){s.hpP=(s.hpP||0)+20;s.arm+=10}else if(P.cls=='mago'){s.mag+=20;s.mreg=(s.mreg||8)+3}else if(P.cls=='cacador'){s.ms+=10;s.crit+=5}}
function startClass(cls){setClass(cls);const c=CLS[cls],w=c.wpn;EQ.arma={id:iid++,slot:'arma',rar:0,ilvl:1,base:w.base,n:w.n,ic:w.ic,wk:w.wk,aff:Object.assign({},w.aff||{}),wd:w.wd.slice(),spd:1,price:5};
  P.sk[c.sk]=1;P.bar[0]=c.sk;calcStats();P.hp=ST.mx;P.fury=cls=='mago'?100:0;hud()}
// Chuva de Flechas (habilidade inicial do Caçador, ramo Sobrevivência)
SK.flechas={t:'sobrev',n:'Chuva de Flechas',ic:'🎯',lv:1,cost:20,cd:4,d:r=>`Uma chuva de flechas cai na área do alvo (${160+40*(r-1)}% de dano) e deixa os inimigos lentos.`};
function extraSkill(id,a,r){if(id!='flechas')return;const t=a.tg,x=t?t.x:P.x+S(P.f)*9,z=t?t.z:P.z+C(P.f)*9;sweep(1300,300,.2,'square',.04);
  tele(x,z,3.6,.55,T=>{const y=groundAt(T.x,T.z);for(let i=0;i<12;i++)setTimeout(()=>{const ax=T.x+(R()-.5)*6,az=T.z+(R()-.5)*6;fx(ax,y+.3,az,0xfff2c0,4,2,.08,.4);puff(ax,y+.2,az,0xcdb894,.7)},i*35);
    snd(500,.15,'square');for(const e of E)if(!e.dead&&hy(e.x-T.x,e.z-T.z)-e.r<3.6){const[dm,c]=rollDmg(1.6+.4*(r-1));hurtMob(e,dm,c,'flechas');e.slow=2}},0xffe08a)}

// ---------- montarias
const MOUNTS={leao:{n:'Leão Dourado',ic:'🦁',price:450,sp:2.4,d:'Juba dourada e passos de trovão. Corre muito mais rápido que você a pé.'}};
MDL.lion=()=>quad({c:0xd8a040,c2:0xe8c070,mane:0x8a4a1a,hc:0xd8a040,snout:0x6a4a2a,ears:1,teeth:1,len:2.3,h:1.15,wid:.95,bh:.7,hl:.7,tl:1.3,tw:.18,tc:0xd8a040,lc:0xc89030,run:12,scale:1.2,tailUp:.2});
P.mounts=[];P.mounted=null;let MNT=null;const MOUNT_Y=1.45;
function mount(){if(P.dead||UI.block())return;if(P.mounted){dismount();return}if(!P.mounts.length){toast('🦁','Você não tem montaria','Compre o Leão Dourado na Forja da Helga.');return}
  P.mounted=P.mounts[0];P.act=null;if(!MNT){MNT=MDL.lion();MNT.meshes.forEach(m=>m.castShadow=true)}MNT.g.visible=true;MNT.g.position.set(P.x,P.y,P.z);MNT.g.rotation.y=P.f;
  puff(P.x,P.y+.4,P.z,0xcdb894,2.4);sweep(160,70,.5,'sawtooth',.06);setTimeout(()=>sweep(220,90,.4,'sawtooth',.05),180);$('mntb').classList.add('on');toast(MOUNTS[P.mounted].ic,MOUNTS[P.mounted].n,'Atacar ou usar habilidade desmonta.')}
function dismount(){if(!P.mounted)return;P.mounted=null;if(MNT)MNT.g.visible=false;puff(P.x,P.y+.4,P.z,0xcdb894,1.8);$('mntb').classList.remove('on')}
function mountUpd(dt,t){if(!MNT)return;if(!P.mounted){MNT.g.visible=false;return}MNT.g.position.set(P.x,P.y,P.z);MNT.g.rotation.y=P.f;animate(MNT,dt,t,{v:P.v||0});if((P.v||0)>8&&ev(3))puff(P.x-S(P.f)*1.2,P.y+.2,P.z-C(P.f)*1.2,0xcdb894,1.1)}
function buyMount(id){const M=MOUNTS[id];if(P.mounts.includes(id))return;if(P.gold<M.price){toast('🪙','Ouro insuficiente','Faltam '+(M.price-P.gold)+' moedas');return}P.gold-=M.price;P.mounts.push(id);$('mntb').style.display='';snd(220,.4,'sawtooth');toast(M.ic,'Montaria comprada: '+M.n,'Toque em '+M.ic+' (ou R) para montar.');hud();save()}

// ---------- Mercante Sombrio (fora da paliçada, na estrada do oeste)
MDL.sombrio=()=>hum({skin:0x5a4a6a,shirt:0x1a1222,pants:0x140e1a,robe:0x1e1428,hat:'hood',hatC:0x1a1222,mask:0x0a0a10,glowEyes:0xb07aff,cape:0x2a1a3a,capeE:0x7a4aaa,scale:1.12,noFace:1});
const GMB={x:-66,z:18};flat(GMB.x,GMB.z,7);
addStr(GMB.x,GMB.z,0,(k,e,f)=>{const t=new TB(k,e,f,GMB.x,GMB.z,1.2,null,1.4);tent(t,0,-2.2,0,0x2a1a3a);t.b(2.2,.8,1,0,.4,1.4,0x2a1e2a,{g:1});t.e_(.3,.3,.3,-.6,.95,1.4,0xb07aff).e_(.3,.3,.3,.6,.95,1.4,0x7dff9a);
  for(const s of[-1,1]){lamp(t,s*2.6,1.6,0xb07aff)}for(let i=0;i<5;i++)t.b(.3,.3,.3,-1.6+i*.15,1,-.6+i*.3,0x6a5a7a);t.col(0,-2.2,1.8)});
function spawnExtras(){const n=mkNPC('sombrio','sombrio',GMB.x+1.4,GMB.z+2.6,{nm:'Mercante Sombrio',ic:'🌑',still:1,w:'staff'});
  inter({x:n.x,z:n.z,r:3,npc:n,ic:'🌑',label:()=>'Negociar com o Mercante Sombrio',act:()=>{say([['Mercante Sombrio',pick(['Hehehe... o destino está embrulhado, Guardião. Quer abrir um?','Ouro por mistério. Às vezes lixo... às vezes lenda.','Eu vendo o que os mortos esqueceram. Escolha com cuidado.','Shhh. A vila não precisa saber que você esteve aqui.']),'🌑']],openGamble)},kind:'npc'})}
const gPrice=s=>Math.round((30+P.lv*12)*(s=='arma'?1.5:s=='anel'||s=='amuleto'?2:1));
function openGamble(){openWin('gmb');gmbRender()}
function gmbRender(){$('gmg').textContent='🪙 '+fmt(P.gold);$('gml').innerHTML=SLOTS.map(([k,n,ic])=>`<button class="shi gm" data-g="${k}"><i>${ic}</i><div><b>${n} misterioso</b><small>Item mágico ou melhor, com chance de lendário</small></div><em class="${P.gold<gPrice(k)?'no':''}">${gPrice(k)}🪙</em></button>`).join('')}
function gamble(slot){const p=gPrice(slot);if(P.gold<p){toast('🪙','Ouro insuficiente','');return}if(INV.indexOf(null)<0){toast('🎒','Inventário cheio','');return}P.gold-=p;const it=genItem(P.lv+1,1.6,slot);if(it.rar<1){it.rar=1;it.price=Math.round(it.price*2)}
  flash(P.x,P.y+1.6,P.z,RAR[it.rar].h,4,.5);fx(P.x,P.y+1.4,P.z,0xb07aff,24,4,.15,1.5);sweep(200,900,.4,'triangle',.05);pickItem(it);toast(it.ic,`<span style="color:${RAR[it.rar].c}">${it.n}</span>`,RAR[it.rar].n+' · do Mercante Sombrio');gmbRender();hud();save()}
// tela de escolha de classe (novo jogo)
function openClassPick(cb){const el=$('cls');el.innerHTML='<h2>Escolha sua classe</h2><div class="clsr">'+Object.keys(CLS).map(k=>{const c=CLS[k];return`<button class="clsc" data-c="${k}"><i>${c.ic}</i><b>${c.n}</b><span>${c.d}</span><small>Começa com: ${c.wpn.n} · ${SK[c.sk].ic} ${SK[c.sk].n}</small></button>`}).join('')+'</div>';
  el.classList.add('on');el.onclick=e=>{const b=e.target.closest('[data-c]');if(!b)return;el.classList.remove('on');cb(b.dataset.c)}}
