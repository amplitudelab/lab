'use strict';
/* =============================================================================
   VOXEL REALMS · árvore de talentos (15.6)
   - Cada árvore tem 5 círculos (I a V, pelo nível da habilidade). Para aprender
     no círculo II é preciso ter 3 pontos gastos nessa árvore; III pede 7,
     IV pede 12 e V (a habilidade suprema) pede 18.
   - Escolhas exclusivas: pares de passivas rivais; aprender uma tranca a outra
     (dá para trocar no grimório pagando moedas).
   - Sinergias: habilidades ganham dano por nível de outras da mesma árvore.
   - 41 habilidades novas no total (ativas, passivas e uma suprema por classe).
   - Cada missão principal concluída dá +1 ponto de habilidade.
   ============================================================================= */
const ROMAN=['','I','II','III','IV','V'],TPTS=[0,0,3,7,12,18];
const skTier=id=>{const l=SK[id]?SK[id].lv:1;return l<5?1:l<10?2:l<15?3:l<20?4:5};
const ptsIn=t=>{let n=0;for(const k in P.sk)if(SK[k]&&SK[k].t==t)n+=P.sk[k]|0;return n};
const isNight=()=>{const h=(DAY.t*24)%24;return h<6||h>=19};
const healP=h=>{if(h>0&&!P.dead)P.hp=Math.min(ST.mx,P.hp+h)};
// ---------- habilidades novas
// eng: k = tipo (golpe em área, investida, fissura, execução, projétil, zona, bênção, piscar, dreno, exército)
Object.assign(SK,{
  // Guerreiro
  investida:{t:'guerra',n:'Investida',ic:'🐂',lv:3,cost:15,cd:7,anim:'lunge',dur:.9,hp:.45,eng:{k:'dash',r:3,a:1.2,m:r=>1.8+.3*(r-1),st:.8,c:0xffc070},d:r=>`Avança como um touro e acerta tudo à frente (${180+30*(r-1)}% de dano), atordoando por 0,8 s.`},
  fissura:{t:'guerra',n:'Golpe Telúrico',ic:'🌋',lv:8,cost:30,cd:10,anim:'smash',dur:.85,hp:.6,eng:{k:'line',len:13,w:2.2,n:6,m:r=>2.4+.4*(r-1),st:1,c:0xffa040},d:r=>`Racha o chão numa linha de 13 m: cada fenda causa ${240+40*(r-1)}% de dano e atordoa.`},
  laminagir:{t:'guerra',n:'Lâmina Bumerangue',ic:'💫',lv:11,cost:20,cd:5,anim:'slashA',dur:.5,hp:.5,eng:{k:'boomer',len:10,r:1.7,m:r=>1.2+.25*(r-1),c:0xe0e8ff},d:r=>`Arremessa uma lâmina giratória que vai e volta, cortando tudo no caminho (${120+25*(r-1)}% por passagem).`},
  execucao:{t:'guerra',n:'Execução',ic:'⚰️',lv:15,cost:35,cd:12,anim:'chop',dur:.75,hp:.55,eng:{k:'exec',r:3.4,a:.8,m:r=>3.5+.5*(r-1),c:0xff4a3a},d:r=>`Golpe brutal (${350+50*(r-1)}%). Dano dobrado em inimigos com menos de 30% de vida; se matar, a recarga zera.`},
  avatar:{t:'guerra',n:'Avatar da Guerra',ic:'👑',lv:20,cost:50,cd:60,ult:1,anim:'shout',dur:.8,hp:.45,eng:{k:'buff',b:'avatar',dur:r=>10+2*r,c:0xffd34a},d:r=>`SUPREMA: por ${10+2*r} s você causa +40% de dano, recebe −30% de dano e cada golpe solta uma onda de choque.`},
  baluarte:{t:'guerra',n:'Baluarte',ic:'🧱',lv:7,pas:1,d:r=>`Passiva: recebe ${4*r}% menos dano. (Exclusiva com Fúria Sanguinária)`},
  furiasang:{t:'guerra',n:'Fúria Sanguinária',ic:'💢',lv:7,pas:1,d:r=>`Passiva: abaixo de 50% de vida, +${10*r}% de dano e ${5*r}% do dano vira vida. (Exclusiva com Baluarte)`},
  mestrearmas:{t:'guerra',n:'Mestre de Armas',ic:'⚔️',lv:13,pas:1,d:r=>`Passiva: +${4*r}% de velocidade de ataque e +${3*r}% de chance crítica. (Exclusiva com Colosso)`},
  colosso:{t:'guerra',n:'Colosso',ic:'⛰️',lv:13,pas:1,d:r=>`Passiva: +${10*r}% de vida e de armadura, mas −3% de velocidade. (Exclusiva com Mestre de Armas)`},
  ira:{t:'guerra',n:'Ira Inesgotável',ic:'🔥',lv:17,pas:1,d:r=>`Passiva: habilidades custam ${8*r}% menos fúria e cada golpe gera +${2*r} de fúria.`},
  // Mago
  piscar:{t:'arcano',n:'Piscar',ic:'✨',lv:6,cost:15,cd:6,mag:1,anim:'castUp',dur:.4,hp:.3,eng:{k:'blink',len:8,r:3.5,m:r=>.8+.2*(r-1),sl:3,c:0x9ae4ff},d:r=>`Teleporta 8 m para a frente e deixa uma explosão gélida (${80+20*(r-1)}%) que deixa lentos.`},
  orbegelo:{t:'arcano',n:'Orbe Glacial',ic:'🧊',lv:12,cost:35,cd:9,mag:1,eng:{k:'zone',mv:2.2,dur:4,tick:.4,r:3.5,m:r=>.5+.1*(r-1),sl:2,c:0x9ae4ff,vis:'ice'},d:r=>`Um orbe de gelo avança devagar disparando estilhaços ao redor (${50+10*(r-1)}% a cada 0,4 s) e deixando lentos.`},
  tormenta:{t:'arcano',n:'Tormenta Elétrica',ic:'🌩️',lv:14,cost:40,cd:14,mag:1,anim:'castUp',eng:{k:'zone',at:1,dur:5,tick:.45,r:5.5,m:r=>1.1+.2*(r-1),c:0x8ab8ff,vis:'storm'},d:r=>`Uma nuvem de tempestade sobre o alvo solta raios em inimigos dentro dela (${110+20*(r-1)}% cada) por 5 s.`},
  singular:{t:'arcano',n:'Singularidade',ic:'🕳️',lv:20,cost:60,cd:50,mag:1,ult:1,anim:'castUp',dur:.75,eng:{k:'zone',at:1,dur:4,tick:.5,r:7,pull:5,m:r=>1.2+.2*(r-1),end:r=>3+.5*(r-1),c:0xb07aff,vis:'void'},d:r=>`SUPREMA: abre um buraco negro no alvo que puxa os inimigos (${120+20*(r-1)}% a cada 0,5 s) e explode no fim (${300+50*(r-1)}%).`},
  combustao:{t:'arcano',n:'Combustão',ic:'♨️',lv:9,pas:1,d:r=>`Passiva: inimigos em chamas recebem +${8*r}% de dano. (Exclusiva com Hipotermia)`},
  hipotermia:{t:'arcano',n:'Hipotermia',ic:'🥶',lv:9,pas:1,d:r=>`Passiva: inimigos lentos ou congelados recebem +${8*r}% de dano. (Exclusiva com Combustão)`},
  canalizar:{t:'arcano',n:'Canalização',ic:'💠',lv:15,pas:1,d:r=>`Passiva: recargas ${5*r}% mais rápidas. (Exclusiva com Sobrecarga)`},
  sobrecarga:{t:'arcano',n:'Sobrecarga',ic:'💥',lv:15,pas:1,d:r=>`Passiva: +${4*r}% de chance crítica e +${12*r}% de dano crítico. (Exclusiva com Canalização)`},
  fluxo:{t:'arcano',n:'Fluxo Arcano',ic:'🌊',lv:17,pas:1,d:r=>`Passiva: +${4*r} de mana por segundo e magias custam ${5*r}% menos.`},
  // Caçador
  explosiva:{t:'arco',n:'Flecha Explosiva',ic:'💣',lv:12,cost:25,cd:6,bow:1,eng:{k:'proj',pk:'arrow',m:r=>2.5+.4*(r-1),aoe:3.5,brn:1,c:0xff8a30},d:r=>`Flecha que explode no impacto (${250+40*(r-1)}% em área) e incendeia.`},
  rede:{t:'arco',n:'Rede de Caça',ic:'🕸️',lv:9,cost:15,cd:10,eng:{k:'proj',pk:'orb',m:r=>.6+.1*(r-1),aoe:3,st:r=>1.6+.3*r,c:0xd8c8a0},d:r=>`Lança uma rede que prende os inimigos na área por ${(1.6+.3*r).toFixed(1)} s (${60+10*(r-1)}% de dano).`},
  chuvaestelar:{t:'arco',n:'Chuva Estelar',ic:'🌠',lv:20,cost:50,cd:55,ult:1,anim:'shootUp',dur:.7,eng:{k:'zone',follow:1,dur:6,tick:.22,r:13,m:r=>1.4+.2*(r-1),c:0xfff0a0,vis:'stars'},d:r=>`SUPREMA: por 6 s, flechas de luz caem do céu nos inimigos ao seu redor (${140+20*(r-1)}% cada).`},
  franco:{t:'arco',n:'Franco-Atirador',ic:'🎯',lv:7,pas:1,d:r=>`Passiva: +${6*r}% de dano em inimigos a mais de 9 m. (Exclusiva com Escaramuça)`},
  escaramuca:{t:'arco',n:'Escaramuça',ic:'🏃',lv:7,pas:1,d:r=>`Passiva: +${6*r}% de dano em inimigos a menos de 6 m e +${3*r}% de velocidade. (Exclusiva com Franco-Atirador)`},
  predador:{t:'arco',n:'Predador',ic:'🐺',lv:14,pas:1,d:r=>`Passiva: +${8*r}% de dano em elites, errantes e chefes. (Exclusiva com Hemorragia)`},
  hemorragia:{t:'arco',n:'Hemorragia',ic:'🩸',lv:14,pas:1,d:r=>`Passiva: seus acertos fazem sangrar ${10*r}% do dano em 3 s. (Exclusiva com Predador)`},
  instinto:{t:'arco',n:'Instinto Selvagem',ic:'🦅',lv:16,pas:1,d:r=>`Passiva: +${3*r}% de chance crítica, +${8*r}% de dano crítico e desvio ${5*r}% mais rápido.`},
  // Necromante
  maldicao:{t:'necro',n:'Maldição da Fraqueza',ic:'🕯️',lv:7,cost:20,cd:12,mag:1,eng:{k:'curse',r:5,vul:r=>.2+.05*r,dur:8,c:0x7dff9a},d:r=>`Amaldiçoa a área do alvo por 8 s: inimigos recebem +${20+5*r}% de dano e causam menos.`},
  prisao:{t:'necro',n:'Prisão Óssea',ic:'🦴',lv:12,cost:30,cd:11,mag:1,anim:'stomp',dur:.6,hp:.56,eng:{k:'burst',at:1,r:4,m:r=>1.5+.3*(r-1),st:2,c:0xe8e0cc,vis:'bones'},d:r=>`Costelas brotam do chão no alvo (${150+30*(r-1)}%) e prendem os inimigos por 2 s.`},
  nuvem:{t:'necro',n:'Nuvem Pestilenta',ic:'☠️',lv:15,cost:30,cd:10,mag:1,eng:{k:'zone',at:1,dur:5,tick:.5,r:4.5,m:r=>.45+.1*(r-1),sl:1.5,c:0x8adf5a,vis:'gas'},d:r=>`Nuvem venenosa no alvo por 5 s (${45+10*(r-1)}% a cada 0,5 s) que deixa os inimigos lentos.`},
  exercito:{t:'necro',n:'Exército dos Mortos',ic:'👻',lv:20,cost:60,cd:55,mag:1,ult:1,anim:'summon',dur:.8,eng:{k:'army',len:16,w:3.4,m:r=>3+.5*(r-1),st:1.5,c:0x7dff9a},d:r=>`SUPREMA: uma legião espectral marcha 16 m à frente (${300+50*(r-1)}% em cada inimigo) e os deixa aterrorizados.`},
  legiao:{t:'necro',n:'Legião',ic:'💀',lv:9,pas:1,d:r=>`Passiva: seus servos causam +${12*r}% de dano. (Exclusiva com Ceifador)`},
  ceifador:{t:'necro',n:'Ceifador',ic:'⚔️',lv:9,pas:1,d:r=>`Passiva: suas magias causam +${10*r}% de dano; servos −10%. (Exclusiva com Legião)`},
  medula:{t:'necro',n:'Medula Profana',ic:'🩻',lv:14,pas:1,d:r=>`Passiva: +${6*r}% de Poder Mágico e recargas ${2*r}% mais rápidas.`},
  sudario:{t:'necro',n:'Sudário',ic:'🕸️',lv:17,pas:1,d:r=>`Passiva: com um servo vivo, você recebe ${5*r}% menos dano.`},
  // Vampiro
  morcegos:{t:'sangue',n:'Enxame de Morcegos',ic:'🦇',lv:7,cost:20,cd:10,anim:'castUp',eng:{k:'zone',follow:1,dur:5,tick:.5,r:4,m:r=>.5+.1*(r-1),heal:.1,c:0x8a2a5a,vis:'bats'},d:r=>`Morcegos giram ao seu redor por 5 s (${50+10*(r-1)}% a cada 0,5 s); 10% do dano vira vida.`},
  abraco:{t:'sangue',n:'Abraço Sombrio',ic:'🧛',lv:12,cost:25,cd:9,anim:'palm',eng:{k:'drain',rg:7,n:4,m:r=>.8+.15*(r-1),heal:.4,c:0xd0303a},d:r=>`Prende o alvo e drena sua vida (4× ${80+15*(r-1)}%), curando 40% do dano.`},
  lorde:{t:'sangue',n:'Senhor da Noite',ic:'🌑',lv:20,cost:50,cd:60,ult:1,anim:'castUp',dur:.7,eng:{k:'buff',b:'lorde',dur:r=>10+2*r,c:0xa03a7a},d:r=>`SUPREMA: por ${10+2*r} s, 25% de todo dano vira vida, +25% de velocidade e um enxame de morcegos te acompanha.`},
  hemofilia:{t:'sangue',n:'Hemofilia',ic:'💉',lv:9,pas:1,d:r=>`Passiva: seus acertos fazem sangrar ${8*r}% do dano em 3 s. (Exclusiva com Pacto Carmesim)`},
  carmesim:{t:'sangue',n:'Pacto Carmesim',ic:'🍷',lv:9,pas:1,d:r=>`Passiva: acima de 80% de vida, +${8*r}% de dano. (Exclusiva com Hemofilia)`},
  predadornot:{t:'sangue',n:'Predador Noturno',ic:'🌙',lv:14,pas:1,d:r=>`Passiva: à noite, +${10*r}% de dano e +${5*r}% de velocidade. (Exclusiva com Sangue Nobre)`},
  aristocrata:{t:'sangue',n:'Sangue Nobre',ic:'🩸',lv:14,pas:1,d:r=>`Passiva: +${4*r}% de roubo de vida. (Exclusiva com Predador Noturno)`},
  imortal:{t:'sangue',n:'Imortalidade',ic:'⚱️',lv:17,pas:1,d:r=>`Passiva: um golpe fatal te deixa com ${15*r}% da vida em vez de morrer (uma vez a cada 90 s).`}});
Object.assign(SKEL,{investida:'aco',fissura:'vigor',laminagir:'aco',execucao:'aco',avatar:'vigor',baluarte:'vigor',furiasang:'vigor',mestrearmas:'aco',colosso:'vigor',ira:'vigor',
  piscar:'arcano',orbegelo:'gelo',tormenta:'raio',singular:'arcano',combustao:'fogo',hipotermia:'gelo',canalizar:'arcano',sobrecarga:'raio',fluxo:'arcano',
  explosiva:'fogo',rede:'natur',chuvaestelar:'vento',franco:'vento',escaramuca:'natur',predador:'natur',hemorragia:'natur',instinto:'natur',
  maldicao:'alma',prisao:'osso',nuvem:'alma',exercito:'alma',legiao:'osso',ceifador:'alma',medula:'osso',sudario:'alma',
  morcegos:'noite',abraco:'sangue',lorde:'noite',hemofilia:'sangue',carmesim:'sangue',predadornot:'noite',aristocrata:'sangue',imortal:'noite'});
// escolhas exclusivas
const EXO={};for(const[a,b]of[['baluarte','furiasang'],['mestrearmas','colosso'],['combustao','hipotermia'],['canalizar','sobrecarga'],['franco','escaramuca'],['predador','hemorragia'],['legiao','ceifador'],['hemofilia','carmesim'],['predadornot','aristocrata']]){EXO[a]=b;EXO[b]=a}
// sinergias: % de dano por nível de outra habilidade
const SYN={investida:[['brutal',6]],fissura:[['salto',8],['giro',4]],laminagir:[['giro',8]],execucao:[['brutal',8]],giro:[['laminagir',5]],salto:[['fissura',6]],
  bolafogo:[['chama',8],['meteoro',6]],meteoro:[['bolafogo',10]],chama:[['bolafogo',8]],raio:[['tormenta',8],['mente',4]],gelo:[['orbegelo',8]],orbegelo:[['gelo',10]],tormenta:[['raio',10]],piscar:[['gelo',6]],singular:[['meteoro',6],['raio',6]],
  flechas:[['tempestade',6]],multi:[['aljava',6]],tempestade:[['flechas',8]],explosiva:[['armadilha',8],['multi',4]],rede:[['armadilha',6]],chuvaestelar:[['tempestade',8]],
  lancaossos:[['explosao',6],['prisao',4]],explosao:[['lancaossos',6]],prisao:[['lancaossos',8]],nuvem:[['colheita',6]],exercito:[['esqueleto',6],['golemossos',6]],
  garra:[['frenesi',6]],lancacarmesim:[['sifao',6]],chuvasangue:[['lancacarmesim',8]],morcegos:[['nevoa',8]],abraco:[['sifao',8]],avatar:[],lorde:[['morcegos',6]]};
const synList=id=>(SYN[id]||[]).filter(([o])=>SK[o]&&SK[o].t==SK[id].t);
const synMul=id=>{let p=0;for(const[o,v]of synList(id))p+=rk(o)*v;return 1+p/100};

// ---------- regras de aprendizado
function skBlock(id){const S_=SK[id];if(!S_)return'?';const r=rk(id);if(r>=3)return'max';if(r)return null;const tr=skTier(id),need=TPTS[tr],have=ptsIn(S_.t);
  if(have<need)return`Círculo ${ROMAN[tr]}: gaste ${need} pontos nesta árvore (você tem ${have}).`;const x=EXO[id];if(x&&rk(x))return`Escolha exclusiva: você já aprendeu ${SK[x].n}.`;return null}
const _learn156=learn;learn=function(id){const b=skBlock(id);if(b&&b!='max')return false;return _learn156(id)};
// troca de escolha exclusiva (devolve os pontos da outra)
const swapCost=id=>Math.round(250+skTier(id)*200);
function skSwap(id){const x=EXO[id];if(!x||!rk(x))return;const c=swapCost(id);if(P.gold<c){toast('🪙','Moedas insuficientes',`Trocar custa ${c} moedas.`);return}
  P.gold-=c;P.sp+=rk(x);delete P.sk[x];P.bar=P.bar.map(k=>k==x?null:k);calcStats();hud();save();toast('🔁','Escolha liberada',`${SK[x].n} foi esquecida (+pontos devolvidos).`);sweep(900,300,.3,'triangle',.04)}
// missões principais dão +1 ponto
const _qCheck156=qCheck;qCheck=function(q){const s=QS[q.id],was=s&&s.st;_qCheck156(q);if(was==1&&s.st==2&&q.cat=='main'){P.sp++;setTimeout(()=>toast('✨','+1 ponto de habilidade','Recompensa da missão principal.'),900)}};

// ---------- passivas
const _skp156=skPassive;skPassive=function(s){_skp156(s);const q=rk;
  s.ias+=4*q('mestrearmas');s.crit+=3*q('mestrearmas');if(q('colosso')){s.hpP=(s.hpP||0)+10*q('colosso');s.arm*=1+.1*q('colosso');s.ms-=3}
  s.fury=(s.fury||0)+2*q('ira');s.cdr+=5*q('canalizar')+2*q('medula');s.crit+=4*q('sobrecarga')+3*q('instinto');s.critd+=12*q('sobrecarga')+8*q('instinto');
  s.mreg=(s.mreg||8)+4*q('fluxo');s.ms+=3*q('escaramuca');s.mag=(s.mag||0)+6*q('medula');s.ls+=4*q('aristocrata');
  if(q('predadornot')&&isNight())s.ms+=5*q('predadornot');if(P.buff&&P.buff.lorde>0)s.ms+=25;if(P.buff&&P.buff.avatar>0)s.arm*=1.3};
const _cdOf156=cdOf;cdOf=function(id){return _cdOf156(id)*(id=='dash'?1-.05*rk('instinto'):1)};
let SKC2=null;
const _roll156=rollDmg;rollDmg=function(mult){let m=mult;if(SKC2&&SK[SKC2]&&!SK[SKC2].eng)m*=synMul(SKC2);if(P.buff.avatar>0)m*=1.4;
  if(rk('furiasang')&&P.hp<ST.mx*.5)m*=1+.1*rk('furiasang');if(rk('carmesim')&&P.hp>ST.mx*.8)m*=1+.08*rk('carmesim');if(rk('predadornot')&&isNight())m*=1+.1*rk('predadornot');return _roll156(m)};
const _hurt156=hurtMob;hurtMob=function(e,d,c,src){if(!e||e.dead)return _hurt156.apply(this,arguments);
  if(d>0&&src!='dot'){let k=1;if(e.burn>0)k+=.08*rk('combustao');if(e.slow>0||e.stun>0)k+=.08*rk('hipotermia');if(e.vul>0)k+=e.vulK||.2;const dd=hy(e.x-P.x,e.z-P.z);
    if(dd>9)k+=.06*rk('franco');if(dd<6)k+=.06*rk('escaramuca');if(e.boss||e.el||e.dngBoss)k+=.08*rk('predador');
    if(src=='minion')k+=.12*rk('legiao')-(rk('ceifador')?.1:0);else if(src!='merc'&&P.cls=='necromante')k+=.1*rk('ceifador');d*=k}
  const was=e.hp,r_=_hurt156.call(this,e,d,c,src),dealt=Math.max(0,was-Math.max(0,e.hp));
  if(dealt>0&&src!='dot'&&src!='minion'&&src!='merc'){const hb=rk('hemorragia')*.1+rk('hemofilia')*.08;if(hb&&!e.dead){e.bld=(e.bld||0)+dealt*hb;e.bldT=.5}
    if(P.buff.lorde>0)healP(dealt*.25);if(rk('furiasang')&&P.hp<ST.mx*.5)healP(dealt*.05*rk('furiasang'))}return r_};
const _hitP156=hitPlayer;hitPlayer=function(d,o){let k=1-.04*rk('baluarte');if(P.buff.avatar>0)k*=.7;if(rk('sudario')&&typeof MIN!='undefined'&&MIN.length)k*=1-.05*rk('sudario');return _hitP156.call(this,typeof d=='number'?d*k:d,o)};
const _die156=die;die=function(){const q=rk('imortal'),drg=typeof dragonReady=='function'&&!dragonReady()&&E.some(e=>!e.dead&&e.type=='ignarok'&&hy(e.x-P.x,e.z-P.z)<40);if(q&&!(P.imCd>0)&&!drg){P.imCd=90;P.hp=Math.max(1,Math.round(ST.mx*.15*q));pop('IMORTAL!',P.x,P.y+3.6,P.z,'#ff6a8a',1);flash(P.x,P.y+1.4,P.z,0xa03a7a,6,.5);ring(P.x,P.z,3,0xff6a8a,.5);
    fx(P.x,P.y+1,P.z,0xa03a7a,24,8,.2,.8);snd(220,.6,'sine');return}return _die156()};
// custo menor (Ira e Fluxo devolvem parte do que foi gasto)
const _useSkill156=useSkill;useSkill=function(slot){const id=P.bar[slot],f0=P.fury,a0=P.act;const r=_useSkill156.apply(this,arguments);
  if(id&&P.fury<f0){const back=(f0-P.fury)*(.08*rk('ira')+.05*rk('fluxo'));P.fury=Math.min(100,P.fury+back)}
  const a=P.act;if(a&&a!==a0&&a.sk==id&&SK[id]&&SK[id].eng&&SK[id].eng.k=='dash')P.lunge=.36;return r};
const _skillHit156=skillHit;skillHit=function(){const a=P.act;SKC2=a&&a.sk;try{return _skillHit156.apply(this,arguments)}finally{SKC2=null}};

// ---------- motor das habilidades novas
const ZN=[];
function hitArea(x,z,rad,f,arc,id,m,G,mag,once){let n=0;const S_=SK[id]||{};for(const e of E){if(e.dead||e.t.passive||once&&once.has(e))continue;const dx=e.x-x,dz=e.z-z,d=hy(dx,dz)-e.r;
    if(d<rad&&(!arc||d<1||Math.abs(angDiff(f,Math.atan2(dx,dz)))<arc)){const[dm,c]=(mag||S_.mag?spellDmg:rollDmg)(m);hurtMob(e,dm,c,id);n++;if(once)once.add(e);
      if(G){const st=typeof G.st=='function'?G.st(rk(id)):G.st;if(st)e.stun=Math.max(e.stun||0,e.boss?st*.35:st);if(G.sl)e.slow=Math.max(e.slow||0,G.sl);if(G.brn)e.burn=3}}}return n}
function zoneTarget(a,max){const t=a.tg;if(t&&!t.dead&&hy(t.x-P.x,t.z-P.z)<max)return{x:t.x,z:t.z};return{x:P.x+S(P.f)*Math.min(8,max),z:P.z+C(P.f)*Math.min(8,max)}}
function engCast(id,a,r){const S_=SK[id],G=S_.eng,t=a.tg,f=t&&!t.dead?Math.atan2(t.x-P.x,t.z-P.z):P.f;P.f=f;const m=G.m?G.m(r)*synMul(id):0,c=G.c||0xffd070,fx_=P.x+S(f)*1.6,fz_=P.z+C(f)*1.6;
  switch(G.k){
    case 'dash':{const n=hitArea(P.x+S(f)*.8,P.z+C(f)*.8,G.r,f,G.a,id,m,G);ring(fx_,fz_,G.r,c,.4);fx(fx_,P.y+.4,fz_,0xcdb894,16,8,.2,.6);puff(fx_,P.y+.3,fz_,0xd8c8a8,2.2);if(n){SHK=Math.max(SHK,.4);HITSTOP=.06}snd(110,.25,'sawtooth');break}
    case 'line':{for(let i=0;i<G.n;i++){const L=2+i*(G.len-2)/(G.n-1),x=P.x+S(f)*L,z=P.z+C(f)*L;ZN.push({k:'delay',t:i*.07,cb:()=>{const y=groundAt(x,z);hitArea(x,z,G.w,0,0,id,m,G);ring(x,z,G.w,c,.45);flash(x,y+.5,z,c,3,.25);
      fx(x,y+.3,z,0xb8a888,10,7,.22,.7);if(typeof debris=='function')debris(x,z,3);SHK=Math.max(SHK,.3);if(i%2==0)snd(80+i*10,.2,'sawtooth')}})}break}
    case 'exec':{let best=null,bs=1e9;for(const e of E){if(e.dead||e.t.passive)continue;const dx=e.x-P.x,dz=e.z-P.z,d=hy(dx,dz)-e.r;if(d<G.r&&(d<1||Math.abs(angDiff(f,Math.atan2(dx,dz)))<G.a)&&e.hp<bs){bs=e.hp;best=e}}
      ring(fx_,fz_,2.4,c,.4);flash(fx_,P.y+1,fz_,c,4,.3);SHK=Math.max(SHK,.45);HITSTOP=.09;if(!best)break;const low=best.hp<best.mx*.3,[dm,cr]=rollDmg(m*(low?2:1));hurtMob(best,dm,cr,id);impactFx(best,true);
      if(low)pop('EXECUÇÃO!',best.x,best.y+3,best.z,'#ff5a4a',1);if(best.dead){P.cd[id]=0;flash(P.x,P.y+1.6,P.z,0xffd34a,3,.3)}break}
    case 'proj':{const tg=t&&!t.dead?t:null;proj('p',G.pk,P.x+S(f)*.7,P.y+1.7,P.z+C(f)*.7,tg||{x:P.x+S(f)*20,z:P.z+C(f)*20,y:P.y},(S_.mag?spellDmg:rollDmg)(m)[0],{aoe:G.aoe,c:c,brn:G.brn?1:0,dir:tg?null:new V3(S(f),0,C(f)),sk:id});
      flash(P.x+S(f)*.8,P.y+1.7,P.z+C(f)*.8,c,2,.2);sweep(1000,300,.15,'square',.03);break}
    case 'zone':{const p=G.follow?{x:P.x,z:P.z}:G.at?zoneTarget(a,14):{x:P.x+S(f)*1.5,z:P.z+C(f)*1.5};ZN.push({k:'zone',id,x:p.x,z:p.z,t:0,tt:.05,G,m,r,f,vx:G.mv?S(f)*G.mv:0,vz:G.mv?C(f)*G.mv:0});ring(p.x,p.z,G.r,c,.5);flash(p.x,groundAt(p.x,p.z)+1,p.z,c,4,.3);break}
    case 'boomer':ZN.push({k:'boomer',id,x:P.x,z:P.z,t:0,G,m,f,once:new Set(),back:0});snd(600,.3,'triangle');break;
    case 'blink':{let L=0;for(let d=.5;d<=G.len;d+=.5){const x=P.x+S(f)*d,z=P.z+C(f)*d;if(!walkable(x,z))break;L=d}const ox=P.x,oz=P.z;flash(ox,P.y+1.2,oz,c,4,.3);fx(ox,P.y+1,oz,c,16,6,.15,.6);
      P.x+=S(f)*L;P.z+=C(f)*L;P.y=Math.max(P.y,groundAt(P.x,P.z));hitArea(P.x,P.z,G.r,0,0,id,m,G);ring(P.x,P.z,G.r,c,.5);ring(P.x,P.z,G.r*.55,0xffffff,.3);flash(P.x,P.y+1,P.z,c,6,.4);fx(P.x,P.y+.6,P.z,0xd8f4ff,24,10,.18,.7);snd(1500,.25,'triangle');break}
    case 'burst':{const p=G.at?zoneTarget(a,14):{x:P.x,z:P.z},y=groundAt(p.x,p.z);hitArea(p.x,p.z,G.r,0,0,id,m,G);ring(p.x,p.z,G.r,c,.5);flash(p.x,y+1,p.z,c,5,.35);
      if(G.vis=='bones')for(let i=0;i<9;i++){const an=i/9*TAU,rr=G.r*.7;column(p.x+S(an)*rr,p.z+C(an)*rr,0xe8e0cc,2.2,.35,.9)}fx(p.x,y+.5,p.z,c,20,8,.2,.8);snd(160,.35,'square');SHK=Math.max(SHK,.3);break}
    case 'curse':{const p=zoneTarget(a,14),v=G.vul(r);let n=0;for(const e of E)if(!e.dead&&!e.t.passive&&hy(e.x-p.x,e.z-p.z)-e.r<G.r){e.vul=G.dur;e.vulK=v;n++;fx(e.x,e.y+2,e.z,c,6,3,.12,.8)}
      ring(p.x,p.z,G.r,c,.8);ring(p.x,p.z,G.r*.6,0x2a6a3a,.6);flash(p.x,groundAt(p.x,p.z)+1,p.z,c,5,.5);pop(n?'MALDIÇÃO':'',p.x,groundAt(p.x,p.z)+3,p.z,'#7dff9a');snd(140,.6,'sine');break}
    case 'drain':{let tg=t&&!t.dead&&hy(t.x-P.x,t.z-P.z)<G.rg?t:null;if(!tg){tg=bestTarget(G.rg,1);if(!tg)break}tg.stun=Math.max(tg.stun||0,tg.boss?.4:G.n*.4);ZN.push({k:'drain',id,e:tg,t:0,tt:.1,n:G.n,G,m});break}
    case 'buff':{const d=G.dur(r);P.buff[G.b]=d;calcStats();flash(P.x,P.y+1.6,P.z,c,7,.5);ring(P.x,P.z,5,c,.6);ring(P.x,P.z,3,0xffffff,.35);column(P.x,P.z,c,6,1.4,.6);fx(P.x,P.y+1,P.z,c,30,10,.22,1);
      SHK=Math.max(SHK,.4);snd(G.b=='avatar'?150:300,.7,'sawtooth');banner(S_.n.toUpperCase());if(G.b=='lorde')ZN.push({k:'zone',id:'lorde',x:P.x,z:P.z,t:0,tt:.3,G:{follow:1,dur:d,tick:.5,r:4,m:()=>.5,heal:0,c:0x8a2a5a,vis:'bats'},m:.5*synMul('lorde'),r});break}
    case 'army':ZN.push({k:'army',id,x:P.x,z:P.z,t:0,G,m,f,once:new Set(),fxT:0});snd(90,1,'sawtooth');SHK=Math.max(SHK,.5);break}}
const _newSkill156=newSkill;newSkill=function(id,a,r){if(SK[id]&&SK[id].eng){engCast(id,a,r);return true}return _newSkill156(id,a,r)};
// zonas, atrasos e efeitos contínuos (no tempo do jogo)
function zoneVis(Z,G,y){const c=G.c;switch(G.vis){
  case 'ice':flash(Z.x,y+1.4,Z.z,0xd8f4ff,2.4,.25);for(let i=0;i<4;i++){const an=Z.t*3+i*1.57;star(Z.x+S(an)*1.2,y+1.3,Z.z+C(an)*1.2,0xbfefff,1,.2)}break;
  case 'storm':flash(Z.x,y+7,Z.z,0x4a5a8a,6,.5);break;
  case 'void':flash(Z.x,y+1.4,Z.z,0x2a0a4a,5,.4);flash(Z.x,y+1.4,Z.z,c,2.4,.3);fx(Z.x,y+1.2,Z.z,c,8,-6,.15,.6);break;
  case 'gas':for(let i=0;i<3;i++)puff(Z.x+(R()-.5)*G.r*1.4,y+.6,Z.z+(R()-.5)*G.r*1.4,c,2.4);break;
  case 'bats':for(let i=0;i<5;i++){const an=Z.t*5+i*1.26;star(Z.x+S(an)*2.2,y+1.6+S(Z.t*7+i)*.4,Z.z+C(an)*2.2,0x3a0a2a,1.2,.22)}break;
  default:ring(Z.x,Z.z,G.r,c,.25)}}
function znUpd(dt){for(let i=ZN.length-1;i>=0;i--){const Z=ZN[i];Z.t+=dt;
  if(Z.k=='delay'){if(Z.t>=0){ZN.splice(i,1);try{Z.cb()}catch(e){console.warn(e)}}else continue;continue}
  if(Z.k=='zone'){const G=Z.G;if(G.follow){Z.x=P.x;Z.z=P.z}if(Z.vx||Z.vz){const nx=Z.x+Z.vx*dt,nz=Z.z+Z.vz*dt;if(walkable(nx,nz)){Z.x=nx;Z.z=nz}}const y=groundAt(Z.x,Z.z);
    if(G.pull)for(const e of E){if(e.dead||e.boss||e.t.passive)continue;const dx=Z.x-e.x,dz=Z.z-e.z,d=hy(dx,dz);if(d<G.r&&d>.6){const s=Math.min(d-.5,G.pull*dt);e.x+=dx/d*s;e.z+=dz/d*s}}
    Z.tt-=dt;if(Z.tt<=0){Z.tt+=G.tick;zoneVis(Z,G,y);
      if(G.vis=='storm'||G.vis=='stars'){const pool=E.filter(e=>!e.dead&&!e.t.passive&&hy(e.x-Z.x,e.z-Z.z)<G.r);if(pool.length){const e=pool[R()*pool.length|0],ey=e.y+1;
          if(G.vis=='storm')bolt({x:e.x+(R()-.5)*2,y:ey+9,z:e.z+(R()-.5)*2},{x:e.x,y:ey,z:e.z});else{column(e.x,e.z,0xfff0a0,7,.5,.35);star(e.x,ey+.6,e.z,0xffffff,2,.2)}
          flash(e.x,ey,e.z,G.c,2.4,.2);hitArea(e.x,e.z,1.6,0,0,Z.id,Z.m,G)}}
      else{const was=G.heal?E.reduce((s,e)=>s+(e.dead?0:e.hp),0):0;hitArea(Z.x,Z.z,G.r,0,0,Z.id,Z.m,G);if(G.heal){const now=E.reduce((s,e)=>s+(e.dead?0:e.hp),0);healP((was-now)*G.heal)}}}
    if(Z.t>=G.dur){ZN.splice(i,1);if(G.end){const em=G.end(Z.r)*synMul(Z.id);hitArea(Z.x,Z.z,G.r,0,0,Z.id,em,G);boom(Z.x,y,Z.z,2.4,G.c);ring(Z.x,Z.z,G.r,G.c,.6);ring(Z.x,Z.z,G.r*.5,0xffffff,.4);SHK=Math.max(SHK,.7);HITSTOP=.08;snd(60,.8,'sawtooth')}}continue}
  if(Z.k=='boomer'){const G=Z.G,h=.5,u=Z.t<h?Z.t/h:Math.max(0,1-(Z.t-h)/h),L=G.len*Math.sin(u*PI/2);if(Z.t>=h&&!Z.back){Z.back=1;Z.once.clear()}
    const bx=Z.back?P.x:Z.x,bz=Z.back?P.z:Z.z;Z.cx=bx+S(Z.f)*L;Z.cz=bz+C(Z.f)*L;if(!Z.back){Z.x=P.x;Z.z=P.z}const y=groundAt(Z.cx,Z.cz)+1.2;
    star(Z.cx,y,Z.cz,0xe0e8ff,1.6,.12);flash(Z.cx,y,Z.cz,G.c,1.4,.1);hitArea(Z.cx,Z.cz,G.r,0,0,Z.id,Z.m,G,0,Z.once);if(Z.t>=2*h){ZN.splice(i,1)}continue}
  if(Z.k=='drain'){const e=Z.e;Z.tt-=dt;if(e.dead||Z.n<=0){ZN.splice(i,1);continue}if(Z.tt<=0){Z.tt=.4;Z.n--;const was=e.hp,[dm,c]=rollDmg(Z.m);hurtMob(e,dm,c,Z.id);healP(Math.max(0,was-e.hp)*Z.G.heal);
      bolt({x:e.x,y:e.y+1.4,z:e.z},{x:P.x,y:P.y+1.4,z:P.z});flash(e.x,e.y+1.2,e.z,Z.G.c,2.4,.25);fx(P.x,P.y+1.2,P.z,0xff3a4a,6,3,.1,.5)}continue}
  if(Z.k=='army'){const G=Z.G,sp=10,L=Math.min(G.len,Z.t*sp),x=Z.x+S(Z.f)*L,z=Z.z+C(Z.f)*L;Z.fxT-=dt;if(Z.fxT<=0){Z.fxT=.08;const y=groundAt(x,z);for(let k=-1;k<=1;k++){const px=x+C(Z.f)*k*G.w*.6,pz=z-S(Z.f)*k*G.w*.6;column(px,pz,G.c,3,.5,.3);puff(px,y+.6,pz,0x2a6a3a,1.6)}}
    hitArea(x,z,G.w,0,0,Z.id,Z.m,G,1,Z.once);if(L>=G.len){ZN.splice(i,1)}continue}}}
// sangramento, maldição, avatar, Senhor da Noite, recarga da Imortalidade
let bldT=0,avT=0,lordeOn=0;
const _playerUpd156=playerUpd;playerUpd=function(dt,t){_playerUpd156(dt,t);if(!dt)return;znUpd(dt);if(P.imCd>0)P.imCd-=dt;
  bldT-=dt;if(bldT<=0){bldT=.5;for(const e of E){if(e.dead)continue;if(e.vul>0)e.vul-=.5;if(e.bld>0){const a=Math.max(1,e.bld*.17);e.bld=Math.max(0,e.bld-a);if(e.bld<1)e.bld=0;hurtMob(e,a,0,'dot');if(ev(2))fx(e.x,e.y+1.2,e.z,0xb0101a,4,2,.08,.5)}}}
  if(P.buff.avatar>0){avT-=dt;if(avT<=0){avT=.25;flash(P.x,P.y+.3,P.z,0xffd34a,2.4,.25);fx(P.x,P.y+.6,P.z,0xffd34a,4,4,.1,.6)}}
  const lo=P.buff.lorde>0||P.buff.avatar>0?1:0;if(lo!=lordeOn){lordeOn=lo;calcStats()}};
// Avatar: cada golpe básico solta uma onda de choque
const _primaryHit156=primaryHit;primaryHit=function(){const a=P.act;_primaryHit156.apply(this,arguments);if(P.buff.avatar>0&&a&&a.sk=='golpe'){const x=P.x+S(P.f)*2,z=P.z+C(P.f)*2;hitArea(x,z,2.6,0,0,'avatar',.6,null);ring(x,z,2.6,0xffd34a,.35)}};
// projéteis com controle (rede prende os inimigos na área do impacto)
const _proj156=proj;proj=function(side,kind,x,y,z,tg,dm,o){const p=PJ.find(q=>q.l<=0);_proj156.apply(this,arguments);if(p)p.sk=o&&o.sk||null};
const _hitProj156=hitProj;hitProj=function(p,e){const r=_hitProj156.apply(this,arguments);if(p&&p.sk=='rede'){const q=p.o.position,G=SK.rede.eng;let n=0;
  for(const m of E)if(!m.dead&&!m.t.passive&&hy(m.x-q.x,m.z-q.z)-m.r<G.aoe){m.stun=Math.max(m.stun||0,m.boss?.6:G.st(rk('rede')));n++}ring(q.x,q.z,G.aoe,0xd8c8a0,.6);if(n)pop('PRESOS!',q.x,q.y+2,q.z,'#e8d8a0');p.sk=null}return r};
// ---------- grimório com círculos, escolhas e sinergias
function treeRender(){if(UI.open!='tree')return;const TO=treeOrder(),T=curTree(),keys=treeKeys().sort((a,b)=>skTier(a)-skTier(b)||SK[a].lv-SK[b].lv||(SK[a].pas?1:0)-(SK[b].pas?1:0)),els=[...new Set(keys.map(skEl))];if(GTAB!='all'&&!els.includes(GTAB))GTAB='all';
  const ek=GTAB=='all'?TREL[T.id]||els[0]:GTAB,E_=ELM[ek],show=keys.filter(k=>GTAB=='all'||skEl(k)==GTAB);if(!TSEL||!SK[TSEL]||!keys.includes(TSEL))TSEL=show[0]||null;
  const w=$('tree');E_.r.forEach((c,i)=>w.style.setProperty('--e'+i,c));const pts=ptsIn(T.id);
  const sg=pixIcon(GTAB=='all'?T.ic:E_.ic,ek,1);$('bkSig').innerHTML=sg?`<img class="px" src="${sg}" alt="">`:T.ic;
  $('bkT').textContent=GTAB=='all'?'GRIMÓRIO · '+T.n.toUpperCase():E_.t;$('tpts').textContent=P.sp+' ponto'+(P.sp==1?'':'s')+' · '+pts+' nesta árvore';
  $('bkBooks').innerHTML=TO.map((t,i)=>`<button class="gbk${i==GBOOK?' on':''}" data-book="${i}" title="${t.n}${i?' (2ª árvore)':''}">${t.ic}</button>`).join('')+(TO.length<2?'<button class="gbk add" data-book="add" title="Segunda árvore">＋</button>':'');
  let g='',lt=0;for(const k of show){const tr=skTier(k);if(tr!=lt){lt=tr;const lk=pts<TPTS[tr];g+=`<div class="gtier${lk?' lk':''}"><b>${ROMAN[tr]}</b><span>${lk?`🔒 ${TPTS[tr]} pontos nesta árvore`:tr==5?'Círculo supremo':'Círculo '+ROMAN[tr]}</span></div>`}
    const S_=SK[k],r=rk(k),bl=skBlock(k),can=!bl&&P.sp>0&&P.lv>=reqLv(k,r),lk=bl&&bl!='max'&&!r;
    g+=`<button class="gs${r?' on':''}${can?' can':''}${TSEL==k?' sel':''}${S_.pas?' pas':''}${lk?' lk':''}${S_.ult?' ult':''}${EXO[k]?' ex':''}" data-k="${k}" title="${S_.n}">${icoH(k,1)}<em>${[0,1,2].map(i=>`<b${i<r?' class="f"':''}></b>`).join('')}</em>${P.lv<S_.lv?`<u>Nv ${S_.lv}</u>`:''}${EXO[k]?'<s>⇄</s>':''}</button>`}
  $('bkG').innerHTML=g;
  $('bkTabs').innerHTML=['all',...els].map(e=>{const u=pixIcon(e=='all'?T.ic:ELM[e].ic,e=='all'?TREL[T.id]||'aco':e,0);return`<button class="gtab${GTAB==e?' on':''}" data-tab="${e}" title="${e=='all'?'Todas':ELM[e].n}">${u?`<img class="px" src="${u}" alt="">`:(e=='all'?T.ic:ELM[e].ic)}</button>`}).join('');
  $('bkHb').innerHTML='<i>ATALHOS</i>'+[0,1,2,3].map(i=>{const k=P.bar[i];return`<button class="gh${k&&k==TSEL?' on':''}" data-s="${i}">${k&&SK[k]?icoH(k,0):''}<u>${i+1}</u></button>`}).join('');
  const d=$('gdet');if(!TSEL){d.innerHTML='<p class="ihint">Você ganha 1 ponto a cada nível e a cada missão principal.</p>';return}
  const S_=SK[TSEL],r=rk(TSEL),nr=Math.min(3,r+1),need=reqLv(TSEL,r),el=ELM[skEl(TSEL)],ds=S_.d(Math.max(1,r)),dm=(ds.match(/\([^)]*?(\d+)%/)||[])[1],ef=S_.pas&&(ds.match(/\+(\d+)%/)||[])[1],bl=skBlock(TSEL),x=EXO[TSEL],sl=synList(TSEL);
  const syn=sl.length?`<p class="gsyn"><b>Sinergias</b> ${sl.map(([o,v])=>`+${v}% por nível de ${SK[o].n} (${rk(o)})`).join(' · ')} → <b>+${Math.round((synMul(TSEL)-1)*100)}%</b></p>`:'';
  const can=!bl&&P.sp>0&&P.lv>=need;
  d.innerHTML=`<div class="gd-h">${icoH(TSEL,1)}<div><b>${S_.n}</b><small>${S_.ult?'Suprema':S_.pas?'Passiva':'Ativa'} · ${el.n} · Círculo ${ROMAN[skTier(TSEL)]}</small></div></div>
    <div class="gd-st">${S_.pas?(ef?`<span><i>EFEITO</i><b>+${ef}%</b></span>`:''):`<span class="dm"><i>DANO</i><b>${dm?dm+'%':'—'}</b></span>`}${S_.cost?`<span><i>${resName()}</i><b>${S_.cost}</b></span>`:''}${S_.cd>1?`<span><i>RECARGA</i><b>${S_.cd}s</b></span>`:''}<span><i>NÍVEL</i><b>${r}/3</b></span></div>
    <p>${ds}</p>${r&&r<3?`<p class="nx">Próximo nível: ${S_.d(nr)}</p>`:''}${syn}${bl&&bl!='max'?`<p class="nx gblk">${bl}</p>`:''}${!r&&P.lv<need?`<p class="nx">Liberada no nível ${need}.</p>`:''}
    <div class="tb">${r<3?`<button class="ib ${can?'':'off'}" ${can?'data-l="1"':'data-l2="1"'}>${r?'Melhorar':'Aprender'} (1 ponto${P.lv<need?` · nível ${need}`:''})</button>`:''}${x&&rk(x)&&!r?`<button class="ib" data-sw="1">Trocar ${SK[x].n} por esta (${swapCost(TSEL)} 🪙)</button>`:''}</div>
    ${r&&!S_.pas?'<p class="gtip">Toque num atalho (1–4) para colocar esta habilidade nele.</p>':''}`}
{const tw=$('tree');if(tw)tw.addEventListener('click',e=>{if(e.target.closest('[data-sw]')){skSwap(TSEL);treeRender();return}
  if(e.target.closest('[data-l2]')){const b=skBlock(TSEL),r=rk(TSEL);toast('✨','Não dá ainda',b&&b!='max'?b:P.sp<1?'Sem pontos: suba de nível ou conclua missões principais.':P.lv<reqLv(TSEL,r)?'Nível insuficiente.':'Já está no máximo.')}})}
