'use strict';
/* =============================================================================
   VOXEL REALMS · 13.3
   Furtividade e ataque pelas costas · Masmorras (cripta, caverna, ruína) com
   ondas, chefe e baú · Culinária (Marta) e Forja (Durin) · Missões de classe ·
   Conquistas e títulos · Eventos de mundo (invasão noturna e chefe errante)
   ============================================================================= */
P.sneak=0;P.bsT=0;P.ach=new Set();P.title='';P.st={kills:0,dng:[],inv:0,err:0,cook:0,back:0,parry:0,forge:0};
// ---------- furtividade
function sneakSet(v){if(P.dead||UI.block()||P.mounted){v=0}P.sneak=v==null?(P.sneak?0:1):v;$('snkb').classList.toggle('on',!!P.sneak);if(P.sneak){P.run=0;$('runb').classList.remove('on');toast('🥷','Furtivo','Inimigos te veem de mais perto. Ataque pelas costas causa dano triplo.')}}
function backstab(e,d){if(P.bsT>0&&e.st!='chase'&&!e.t.passive&&!e.boss){P.bsT=0;P.st.back++;pop('PELAS COSTAS!',e.x,e.y+2.8,e.z,'#c8a8ff',1);flash(e.x,e.y+1.2,e.z,0xb08aff,3,.25);fx(e.x,e.y+1.2,e.z,0xb08aff,12,6,.1,.6,6);HITSTOP=.08;return d*3}return d}

// ---------- masmorras: arenas fechadas com ondas, chefe e baú
const DNG=[{id:'cripta',n:'Cripta Esquecida',ic:'⚰️',ent:[-106,-90],at:[-196,-196],mob:['zombie','ghoul','skel'],boss:'ghoul',c:0x7dff9a,wall:0x4a4a52,floor:0x3a3a40},
  {id:'caverna',n:'Caverna das Tecelãs',ic:'🕸️',ent:[-44,-126],at:[-196,196],mob:['spider','spider','dwolf'],boss:'spider',c:0xb07aff,wall:0x3a3028,floor:0x2e2620},
  {id:'ruina',n:'Ruína do Templo',ic:'🏛️',ent:[132,-24],at:[196,196],mob:['golem','fairy','imp'],boss:'golem',c:0xffd060,wall:0xd8ccb0,floor:0xb8ac90}];
const DST={on:null,w:0,live:[],t:0,boss:null,done:0};
for(const D of DNG){flat(D.at[0],D.at[1],24,1.5);
  addStr(D.at[0],D.at[1],0,(k,e,f)=>{const t=new TB(k,e,f,D.at[0],D.at[1],0,1.5,1);const n=36,R_=19;
    for(let i=0;i<n;i++){const a=i/n*TAU,x=C(a)*R_,z=S(a)*R_;t.b(3.4,5+(i%3)*.8,1.2,x,2.5,z,i%5==0?shade(D.wall,.75):D.wall,{ry:-a+PI/2});if(i%3==0)t.col(x,z,1.9)}
    for(let i=0;i<8;i++){const a=i/8*TAU+.2,x=C(a)*13,z=S(a)*13;t.b(1.2,4.2,1.2,x,2.1,z,shade(D.wall,1.15)).b(1.6,.4,1.6,x,4.3,z,shade(D.wall,.8));t.e_(.4,.4,.4,x,4.7,z,D.c);t.col(x,z,.8)}
    t.b(26,.12,26,0,.06,0,D.floor);for(let i=0;i<6;i++)t.e_(.5,.08,2.8,C(i*1.05)*5,.13,S(i*1.05)*5,D.c)});
  inter({x:D.ent[0],z:D.ent[1],r:3,ic:D.ic,label:()=>DST.on?'Masmorra em andamento':'Entrar: '+D.n+(P.st.dng.includes(D.id)?' (concluída)':''),act:()=>dngEnter(D)});
  addStr(D.ent[0],D.ent[1],0,(k,e,f)=>{const t=new TB(k,e,f,D.ent[0],D.ent[1],0,null,1.3);t.b(.8,3.4,.8,-1.4,1.7,0,D.wall).b(.8,3.4,.8,1.4,1.7,0,D.wall).b(3.6,.8,.9,0,3.6,0,shade(D.wall,.8));t.e_(2,2.6,.2,0,1.5,0,D.c);t.col(-1.4,0,.6);t.col(1.4,0,.6)})}
function dngEnter(D){if(DST.on)return;if(inCombat()){toast('⚔️','Em combate','Afaste-se dos inimigos para entrar.');return}DST.on=D;DST.w=0;DST.live=[];DST.t=2.5;DST.boss=null;DST.done=0;DST.back=[P.x,P.z];
  teleport(D.at[0],D.at[1]+10);banner(D.n);toast(D.ic,D.n,'3 ondas de inimigos e um chefe. Vença para abrir o baú.');snd(110,.8,'sawtooth')}
function dngWave(){const D=DST.on,lv=Math.max(P.lv,3),n=4+DST.w*2;DST.live=[];
  for(let i=0;i<n;i++){const a=i/n*TAU+R(),x=D.at[0]+C(a)*12,z=D.at[1]+S(a)*12,m=mkMob(pick(D.mob),x,z,{lv,ch:'dng',el:DST.w==2&&i==0?1:0,afx:DST.w==2&&i==0?[pick(Object.keys(AFF))]:[]});m.st='chase';m.home=[D.at[0],D.at[1]];DST.live.push(m);column(x,z,D.c,4,.8,.5)}
  toast(D.ic,'Onda '+(DST.w+1)+' de 3','');snd(220,.3,'sawtooth')}
function dngUpd(dt){const D=DST.on;if(!D)return;if(P.dead){DST.on=null;for(const m of DST.live)m.dead=1;if(DST.boss)DST.boss.dead=1;return}
  if(hy(P.x-D.at[0],P.z-D.at[1])>22){P.x=D.at[0];P.z=D.at[1]+8}
  if(DST.done)return;DST.t-=dt;if(DST.t>0)return;
  if(DST.boss){if(DST.boss.dead){DST.done=1;dngWin(D)}return}
  if(DST.live.length&&DST.live.some(m=>!m.dead))return;
  if(DST.w<3){dngWave();DST.w++;DST.t=1.5;return}
  const b=mkMob(D.boss,D.at[0],D.at[1]-8,{lv:Math.max(P.lv,3)+2,ch:'dng',el:2,afx:[pick(Object.keys(AFF)),pick(Object.keys(AFF))],name:'Guardião da '+D.n.split(' ').slice(-1)[0]});b.hp=b.mx=b.mx*2.2;b.m.g.scale.multiplyScalar(1.35);b.st='chase';b.home=[D.at[0],D.at[1]];DST.boss=b;
  banner('CHEFE DA MASMORRA');column(b.x,b.z,D.c,10,1.6,.9);SHK=.6;snd(80,.9,'sawtooth')}
function dngWin(D){banner('MASMORRA CONCLUÍDA');const x=D.at[0],z=D.at[1];column(x,z,0xffd060,16,2,1.2);ring(x,z,8,0xffd060,1);fx(x,groundAt(x,z)+1,z,0xffd34a,40,10,.2,2,8);
  const first=!P.st.dng.includes(D.id);if(first)P.st.dng.push(D.id);for(let i=0;i<3;i++)setTimeout(()=>dropItem(x+(R()-.5)*3,z+(R()-.5)*3,genItem(P.lv+1,i==0?2.5:1.2,null,first&&i==0)),300+i*200);dropGold(x,z,Math.round(80+P.lv*30));gainXP(Math.round(XPN(P.lv)*.35));
  qEvent('dungeon',D.id);inter({x,z:z+6,r:3,ic:'🌀',label:()=>'Sair da masmorra',act:function(){const i=INTER.indexOf(this);if(i>=0)INTER.splice(i,1);DST.on=null;teleport(DST.back[0],DST.back[1]+3);toast('🌀','De volta ao mundo','')}});save()}

// ---------- culinária (Marta) e forja (Durin)
const MATN=k=>INV.reduce((s,it)=>s+(it&&it.slot=='mat'&&it.mid==k?(it.q||1):0),0);
function matUse(k,n){for(let i=0;i<INV.length&&n>0;i++){const it=INV[i];if(!it||it.slot!='mat'||it.mid!=k)continue;const u=Math.min(n,it.q||1);it.q=(it.q||1)-u;n-=u;if(it.q<=0)INV[i]=null}}
const FOOD={ensopado:{n:'Ensopado de Carne',ic:'🍲',need:{carne:2},b:'ens',t:240,d:'Recupera 1% da vida por segundo.'},assado:{n:'Assado com Ervas',ic:'🍖',need:{carne:1,perna:1},b:'ass',t:240,d:'+12% de dano.'},
  torta:{n:'Torta de Coelho',ic:'🥧',need:{coelho:1,la:1},b:'tor',t:240,d:'+12% de velocidade de movimento.'},cha:{n:'Chá de Chifre',ic:'🍵',need:{chifre:1},b:'cha',t:240,d:'-10% de recarga das habilidades.'}};
function foodPassive(s){if(P.buff.tor>0)s.ms+=12;if(P.buff.cha>0)s.cdr+=10}
const foodDmg=()=>P.buff.ass>0?1.12:1;
let foodPrev='';function foodUpd(dt){if(P.buff.ens>0&&!P.dead)P.hp=Math.min(ST.mx,P.hp+ST.mx*.01*dt);const k=(P.buff.tor>0?'t':'')+(P.buff.cha>0?'c':'');if(k!=foodPrev){foodPrev=k;calcStats()}}
function cook(id){const F=FOOD[id];for(const k in F.need)if(MATN(k)<F.need[k]){toast('🍳','Faltam ingredientes',Object.keys(F.need).map(k=>F.need[k]+'× '+MAT[k].n).join(', '));return}
  for(const k in F.need)matUse(k,F.need[k]);P.buff[F.b]=F.t;P.st.cook++;calcStats();toast(F.ic,F.n,F.d+' (4 min)');fx(P.x,P.y+1.4,P.z,0xffd080,12,3,.12,1.6,-1);snd(660,.2,'sine');cookRender();hud();save()}
function cookRender(){$('cookl').innerHTML=Object.keys(FOOD).map(k=>{const F=FOOD[k],ok=Object.keys(F.need).every(m=>MATN(m)>=F.need[m]);return`<button class="shi gm" data-ck="${k}"><i>${F.ic}</i><div><b>${F.n}</b><small>${F.d} · ${Object.keys(F.need).map(m=>`${MAT[m].ic}${MATN(m)}/${F.need[m]}`).join(' ')}</small></div><em class="${ok?'':'no'}">${ok?'Cozinhar':'Faltam'}</em></button>`}).join('')}
const upCost=w=>{const u=(w.up||0)+1;return{g:Math.round(60*u*(1+w.ilvl*.12)),m:u<=2?'couro':u<=4?'raposa':'chifre',q:u}};
function forgeUp(){const w=EQ.arma;if(!w){toast('⚒️','Equipe uma arma','');return}if((w.up||0)>=5){toast('⚒️','Arma no máximo (+5)','');return}const c=upCost(w);
  if(P.gold<c.g||MATN(c.m)<c.q){toast('⚒️','Faltam recursos',c.g+' ouro e '+c.q+'× '+MAT[c.m].n);return}P.gold-=c.g;matUse(c.m,c.q);w.up=(w.up||0)+1;w.wd=w.wd.map(v=>Math.round(v*1.09));w.n=w.n.replace(/ \+\d$/,'')+' +'+w.up;P.st.forge=Math.max(P.st.forge,w.up);
  calcStats();ring(P.x,P.z,2.5,0xffa040,.5);fx(P.x+S(P.f),P.y+1.2,P.z+C(P.f),0xffc060,24,8,.08,1,10);snd(1200,.1,'square');setTimeout(()=>snd(900,.1,'square'),120);toast('⚒️','Arma aprimorada: +'+w.up,w.n);forgeRender();hud();save()}
function forgeRender(){const w=EQ.arma;if(!w){$('frgl').innerHTML='<p class="ihint">Equipe uma arma para aprimorar.</p>';return}const c=upCost(w);
  $('frgl').innerHTML=`<div class="shi"><i>${w.ic}</i><div><b style="color:${RAR[w.rar].c}">${w.n}</b><small>${w.wd[0]}–${w.wd[1]} de dano · aprimoramento ${w.up||0}/5</small></div></div>`+((w.up||0)>=5?'<p class="ihint">Esta arma já está no máximo.</p>':`<button class="ib" data-fu="1">Aprimorar para +${(w.up||0)+1} (+9% de dano): ${c.g}🪙 + ${c.q}× ${MAT[c.m].ic} ${MAT[c.m].n} (${MATN(c.m)})</button>`)}

// ---------- missões de classe (conversa, caçada, masmorra) com recompensa lendária
const CQ={guerreiro:{npc:'anao',nm:'Durin Engrenagem',ic:'⚙️',mob:['bandit','bandarc'],mn:'bandidos',reg:'plan'},mago:{npc:'arquimago',nm:'Arquimago Eldrin',ic:'📘',mob:['fairy','golem'],mn:'criaturas do bosque de lírios',reg:'flor'},
  cacador:{npc:'cozinha',nm:'Marta, a Cozinheira',ic:'🍲',mob:['wolf','dwolf'],mn:'lobos',reg:'mata'},necromante:{npc:'sombrio',nm:'Mercante Sombrio',ic:'🌑',mob:['zombie','ghoul','skel'],mn:'mortos-vivos',reg:'mata'},
  vampiro:{npc:'nobre',nm:'Lorde Ambrósio',ic:'🎩',mob:['bandit','croc'],mn:'bandidos e crocodilos',reg:'mang'}};
const CQT={guerreiro:['A Forja do Guerreiro','Durin quer ver sua força: derrote 12 bandidos.','Prove seu valor numa masmorra.'],mago:['O Códice Perdido','Eldrin precisa de essência arcana: derrote 12 criaturas do bosque.','Encontre o fragmento do Códice numa masmorra.'],
  cacador:['A Grande Caçada','Marta pede carne fresca e menos lobos: derrote 12 lobos.','Cace a fera-mãe numa masmorra.'],necromante:['Almas à Venda','O Mercante quer almas: destrua 12 mortos-vivos.','Traga a alma de um guardião de masmorra.'],
  vampiro:['Sangue Nobre','Ambrósio revela que é um vampiro antigo: derrote 12 bandidos ou crocodilos.','Beba o sangue de um guardião de masmorra.']};
for(const c in CQ){const Q=CQ[c],T=CQT[c],a={id:'c_'+c+'1',cat:'side',cls:c,reg:'vila',n:T[0]+' (I)',d:'Fale com '+Q.nm+' na vila.',t:'talk',npc:Q.npc,rw:{xp:120,gold:60}},
    b={id:'c_'+c+'2',cat:'side',cls:c,reg:Q.reg,n:T[0]+' (II)',d:T[1],t:'kill',mob:Q.mob,n_:12,req:[a.id],rw:{xp:400,gold:120}},
    d={id:'c_'+c+'3',cat:'side',cls:c,reg:'vila',n:T[0]+' (III)',d:T[2]+' Complete qualquer masmorra (entradas no cemitério, na torre e no templo).',t:'dungeon',req:[b.id],rw:{xp:900,gold:300,item:3}};
  for(const q of[a,b,d]){QD.push(q);QIDX[q.id]=q;QS[q.id]={st:0,p:0,got:[]}}}

// ---------- conquistas e títulos
const ACH=[{id:'sangue',n:'Primeiro Sangue',t:'o Novato',d:'Derrote um inimigo.',c:()=>P.st.kills>=1},{id:'cem',n:'Caçador',t:'Caçador de Feras',d:'Derrote 100 inimigos.',c:()=>P.st.kills>=100},{id:'qui',n:'Implacável',t:'o Implacável',d:'Derrote 500 inimigos.',c:()=>P.st.kills>=500},
  {id:'chefe',n:'Matador de Chefes',t:'Matador de Chefes',d:'Derrote um chefe.',c:()=>Object.keys(BOSS).some(b=>BEST[b])},{id:'lenda',n:'Lenda de Aldoria',t:'Lenda de Aldoria',d:'Derrote os 5 chefes.',c:()=>Object.keys(BOSS).every(b=>BEST[b])},
  {id:'n10',n:'Veterano',t:'o Veterano',d:'Chegue ao nível 10.',c:()=>P.lv>=10},{id:'n20',n:'Herói',t:'o Herói',d:'Chegue ao nível 20.',c:()=>P.lv>=20},{id:'rico',n:'Magnata',t:'o Magnata',d:'Junte 5000 de ouro.',c:()=>P.gold>=5000},
  {id:'dng1',n:'Explorador',t:'Explorador de Masmorras',d:'Conclua uma masmorra.',c:()=>P.st.dng.length>=1},{id:'dng3',n:'Senhor das Profundezas',t:'Senhor das Profundezas',d:'Conclua as 3 masmorras.',c:()=>P.st.dng.length>=3},
  {id:'inv',n:'Defensor',t:'Defensor de Pedraverde',d:'Repila uma invasão noturna.',c:()=>P.st.inv>=1},{id:'err',n:'Caçador de Errantes',t:'Caçador de Errantes',d:'Derrote um chefe errante.',c:()=>P.st.err>=1},
  {id:'cook',n:'Mestre Cuca',t:'Mestre Cuca',d:'Cozinhe 5 pratos.',c:()=>P.st.cook>=5},{id:'forge',n:'Mestre Ferreiro',t:'Mestre Ferreiro',d:'Aprimore uma arma até +5.',c:()=>P.st.forge>=5},
  {id:'back',n:'Sombra Silenciosa',t:'a Sombra',d:'Acerte 10 ataques pelas costas.',c:()=>P.st.back>=10},{id:'parry',n:'Muralha',t:'a Muralha',d:'Faça 10 aparos perfeitos.',c:()=>P.st.parry>=10}];
let achT=0;function achUpd(dt){achT-=dt;if(achT>0)return;achT=2;for(const a of ACH)if(!P.ach.has(a.id)&&a.c()){P.ach.add(a.id);banner('CONQUISTA');toast('🏆',a.n,'Título liberado: “'+a.t+'” (escolha no Diário)');snd(880,.2,'sine');setTimeout(()=>snd(1320,.3,'sine'),150);save()}}
function nameTag(){return'Kael'+(P.title?', '+P.title:'')}

// ---------- eventos de mundo
const EVT={night:0,inv:null,invW:0,errT:240+R()*240,err:null};
function startInvasion(){EVT.inv=[];EVT.invW=0;banner('INVASÃO NOTURNA!');toast('🧟','Os mortos atacam Pedraverde!','Defenda a vila: 3 ondas vêm pelo portão.');snd(90,1,'sawtooth');EVT.invT=3}
function eventsUpd(dt){if(!run||P.dead||DST.on)return;
  // invasão noturna à vila (uma chance por noite, se o jogador estiver por perto)
  if(NIGHT>.6&&!EVT.night){EVT.night=1;if(hy(P.x,P.z)<110&&R()<.4&&P.lv>=3)startInvasion()}
  if(NIGHT<.3)EVT.night=0;
  if(EVT.inv){EVT.invT-=dt;if(EVT.invT<=0&&!EVT.inv.some(m=>!m.dead)){if(EVT.invW>=3){EVT.inv=null;P.st.inv++;banner('VILA DEFENDIDA');dropGold(P.x,P.z,Math.round(60+P.lv*20));dropItem(P.x,P.z,genItem(P.lv+1,2));gainXP(Math.round(XPN(P.lv)*.2));save()}
      else{EVT.invW++;EVT.invT=2;const lv=Math.max(2,P.lv-1),n=4+EVT.invW*2;for(let i=0;i<n;i++){const a=-PI/2+(R()-.5)*.8,r=58+R()*6,x=C(a)*r,z=S(a)*r+60*0,m=mkMob(pick(['zombie','zombie','ghoul','skel']),x,z,{lv,ch:'evt'});m.st='chase';m.home=[0,0];EVT.inv.push(m)}toast('🧟','Onda '+EVT.invW+' de 3','')}}}
  // chefe errante
  EVT.errT-=dt;if(EVT.errT<=0&&!EVT.err&&P.lv>=4){EVT.errT=6;const a=R()*TAU,r=55+R()*30,x=cl(P.x+C(a)*r,-200,200),z=cl(P.z+S(a)*r,-200,200);if(walkable(x,z)&&hy(x,z)>80){const reg=regionAt(x,z),tb=SPAWN[REG[reg].id]||['wolf'];
      const m=mkMob(pick(tb),x,z,{lv:Math.max(mobLv(reg),P.lv)+3,el:2,afx:[pick(Object.keys(AFF)),pick(Object.keys(AFF))],name:'Errante '+rareName(rng(Date.now()%9973))});m.hp=m.mx=m.mx*1.8;m.m.g.scale.multiplyScalar(1.25);m.errante=1;EVT.err=m;EVT.errT=420+R()*240;
      const dir=['norte','nordeste','leste','sudeste','sul','sudoeste','oeste','noroeste'][(Math.round((Math.atan2(x-P.x,-(z-P.z))/TAU)*8)+8)%8];toast('👑','Um chefe errante surgiu!','Ele vaga ao '+dir+'. Marcado no minimapa.');snd(150,.6,'sawtooth')}}
  if(EVT.err&&EVT.err.dead){if(!EVT.err.counted){EVT.err.counted=1;P.st.err++;dropItem(EVT.err.x,EVT.err.z,genItem(P.lv+1,2.5));toast('👑','Errante derrotado!','')}EVT.err=null}}
function world2Upd(dt){dngUpd(dt);foodUpd(dt);achUpd(dt);eventsUpd(dt);if(P.bsT>0)P.bsT-=dt}
