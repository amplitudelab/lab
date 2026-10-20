'use strict';
/* =============================================================================
   VOXEL REALMS · mecânicas dos chefes explicadas (16.1)
   - Cada golpe especial, escudo ou fase de um chefe tem um nome e uma
     descrição de como reagir. Na primeira vez que você vê a mecânica (e na
     segunda), um cartão aparece à esquerda da tela durante a luta.
   - O que você já viu fica registrado no Bestiário (P.st.bmk[chefe][mecânica]).
   ============================================================================= */
const BMECH={
  charge:{n:'Investida',ic:'🐗',e:'aco',d:'Abaixa a cabeça e dispara em linha reta. Saia da frente para o lado ou role no último instante — ele passa direto e fica exposto.'},
  spin:{n:'Redemoinho',ic:'🌀',e:'aco',d:'Gira a arma em volta de si por dois segundos. Afaste-se até o giro acabar e volte para punir.'},
  summon:{n:'Reforços',ic:'📯',e:'sombra',d:'Chama lacaios para a luta. Derrube os reforços rápido ou puxe o chefe para longe deles.'},
  volley:{n:'Rajada',ic:'🏹',e:'vento',d:'Dispara uma série de projéteis na sua direção. Corra de lado, em círculo em volta dele, e eles erram.'},
  dive:{n:'Mergulho',ic:'🐝',e:'natur',d:'Sobe e cai sobre a marca no chão com um ferrão venenoso. Saia do círculo antes do impacto.'},
  roots:{n:'Raízes',ic:'🌿',e:'natur',d:'Raízes brotam embaixo de você e em volta. Fique de olho nas marcas no chão e saia delas.'},
  slam:{n:'Pancada',ic:'🔨',e:'aco',d:'Um golpe pesado à frente que marca o chão. Saia da área marcada; quem fica é arremessado.'},
  blink:{n:'Teleporte',ic:'✨',e:'arcano',d:'Some e reaparece em outro ponto da arena. Procure o brilho e feche a distância antes da próxima magia.'},
  poison:{n:'Chuva de Veneno',ic:'☠️',e:'alma',d:'Poças de veneno caem perto de você. Saia das marcas verdes; o veneno continua ferindo por alguns segundos.'},
  breath:{n:'Sopro de Fogo',ic:'🔥',e:'fogo',d:'Um cone de fogo na frente da boca. Fique atrás ou ao lado dele; na fase final o sopro varre de um lado ao outro.'},
  fireballs:{n:'Bolas de Fogo',ic:'☄️',e:'fogo',d:'Bolas de fogo vêm em sequência. Continue andando de lado e não pare para atacar.'},
  geysers:{n:'Gêiseres',ic:'🌋',e:'fogo',d:'Colunas de fogo irrompem das marcas no chão. Saia delas antes que estourem — pular não ajuda.'},
  fly:{n:'Voo',ic:'🪽',e:'vento',d:'Levanta voo e fica fora do alcance das armas. Use ataques à distância ou espere ele pousar.'},
  nova:{n:'Anel de Projéteis',ic:'💥',e:'arcano',d:'Solta projéteis em todas as direções. Fique colado nele ou bem longe, nos espaços entre eles.'},
  spiral:{n:'Espiral',ic:'🌀',e:'arcano',d:'Projéteis saem girando por alguns segundos. Ande no mesmo sentido do giro para ficar entre os braços da espiral.'},
  quake:{n:'Abalo',ic:'🪨',e:'aco',d:'Bate no chão e a onda se espalha em anel. Pule na hora em que a onda chega ou afaste-se dela.'},
  meteors:{n:'Chuva de Fogo',ic:'☄️',e:'fogo',d:'Meteoros caem nas marcas em volta de você. Continue andando; parar dentro de uma marca é queimadura certa.'},
  sweep:{n:'Varredura',ic:'⚔️',e:'aco',d:'Um golpe largo em arco à frente. Recue ou role para trás dele; não dá para bloquear de lado.'},
  pools:{n:'Poças',ic:'🫧',e:'alma',d:'Deixa poças que ferem quem pisa. Puxe a luta para fora delas.'},
  frostring:{n:'Onda de Choque',ic:'⭕',e:'gelo',d:'Um anel se expande a partir do chefe. Pule quando o anel chegar até você para passar por cima.'},
  shield:{n:'Escudo de Pilares',ic:'🛡️',e:'arcano',d:'Três pilares surgem na arena e deixam o chefe imune. Destrua os pilares: o escudo quebra e ele fica atordoado e vulnerável (+50% de dano) por 6 s.'},
  tidal:{n:'Maré',ic:'🌊',e:'gelo',d:'Três trilhas de ondas avançam na sua direção. Fique no espaço entre as trilhas ou saia para o lado.'},
  stampede:{n:'Estouro',ic:'🐃',e:'aco',d:'Três investidas seguidas, uma atrás da outra. Desvie de cada uma; depois da última ele fica parado por um instante.'},
  vul:{n:'Escudo Quebrado',ic:'💢',e:'vigor',d:'Os pilares caíram: o chefe fica atordoado e recebe 50% a mais de dano por 6 segundos. Use suas melhores habilidades agora.'},
  phase2:{n:'Fase II',ic:'⚠️',e:'vigor',d:'Abaixo de metade da vida o chefe ruge: fica imune por um instante, recupera um pouco de vida, bate 22% mais forte, fica mais rápido e ganha golpes novos.'},
  phase3:{n:'Fase III',ic:'💀',e:'sangue',d:'Quase derrotado, entra em fúria: mais um pouco de vida, 25% mais dano, golpes especiais sem descanso. Aguente firme — falta pouco.'},
  d_bite:{n:'Mordida e Garras',ic:'🦷',e:'fogo',d:'De perto ele morde e golpeia com as garras. Ataque pelos flancos e role quando ele recuar a cabeça.'},
  d_tail:{n:'Rabada',ic:'🦎',e:'fogo',d:'Se você ficar atrás dele, a cauda varre tudo. Ataque pelas laterais.'},
  d_stomp:{n:'Pisão',ic:'🦶',e:'fogo',d:'Pisa forte e uma onda corre pelo chão. Pule na hora do impacto.'},
  d_takeoff:{n:'Voo Rasante',ic:'🐉',e:'fogo',d:'Alça voo, passa rasante cuspindo fogo em linha e solta uma chuva de bolas de fogo antes de pousar. Saia da linha marcada e continue andando.'},
  d_roar:{n:'Rugido',ic:'📣',e:'fogo',d:'Um rugido que anuncia a próxima fase. Afaste-se: o que vem depois é mais rápido e mais forte.'},
  d_phase2:{n:'Ignarok se Enfurece',ic:'⚠️',e:'fogo',d:'Abaixo de 60% de vida: voa mais vezes, os gêiseres ficam maiores e o sopro dura mais.'},
  d_phase3:{n:'Fúria do Dragão',ic:'💀',e:'sangue',d:'Abaixo de 25%: mais rápido, sopro que varre de um lado ao outro, três rasantes por voo e mais meteoros.'},
  d_lock:{n:'Protegido pelo Selo Partido',ic:'🔒',e:'fogo',d:'Enquanto as missões principais não terminarem, Ignarok não pode ser ferido e qualquer golpe dele é fatal. Volte quando o selo estiver restaurado.'},
  enr:{n:'Enfurecido',ic:'😡',e:'sangue',d:'Campeões e raros, ao chegar à metade da vida, ficam imunes por meio segundo, batem mais forte e ficam mais rápidos.'},
  dph:{n:'Fases do Guardião',ic:'🏰',e:'sombra',d:'Os chefes de masmorra mudam de fase em 66% e 33% da vida: empurram quem está perto, ficam mais fortes e chamam reforços.'}};
// mecânicas fixas de cada chefe (as do dragão são próprias)
const BMKEYS=k=>{const B=BOSS[k];if(!B)return[];if(k=='ignarok')return['d_lock','d_bite','d_tail','d_stomp','breath','geysers','d_takeoff','meteors','d_roar','d_phase2','d_phase3'];
  const L=[...B.ab.filter(a=>BMECH[a]),'phase2',...(B.ab2||[]).filter(a=>BMECH[a]&&!B.ab.includes(a))];if(L.includes('shield'))L.push('vul');L.push('phase3');return[...new Set(L)]};
P.st.bmk=P.st.bmk||{};
const MCQ=[];let MCTM=0;
function mechSeen(type,k){const b=P.st.bmk||(P.st.bmk={});const o=b[type]||(b[type]={});o[k]=(o[k]||0)+1;return o[k]}
function mechCard(e,k){const M=BMECH[k];if(!M||!e)return;e.mseen=e.mseen||{};if(e.mseen[k])return;e.mseen[k]=1;const type=e.boss||e.type=='ignarok'?e.type:(e.dngBoss?'_dng':'_elite'),n=mechSeen(type,k);
  if(n>2)return;MCQ.push({e,k,nm:e.boss?(e.name||e.t.n).split(',')[0]:e.dngBoss?'Chefe da masmorra':'Campeão'});if(!MCTM)mechNext()}
function mechNext(){const c=$('mech');const it=MCQ.shift();if(!it){c.classList.remove('on');MCTM=0;return}const M=BMECH[it.k],u=typeof pixIcon=='function'?pixIcon(M.ic,M.e,1):null;
  c.innerHTML=`<div class="mci">${u?`<img class="px" src="${u}" alt="">`:`<i>${M.ic}</i>`}</div><div class="mct"><small>${it.nm} · mecânica</small><b>${M.n}</b><p>${M.d}</p></div><u></u>`;
  c.classList.remove('on');void c.offsetWidth;c.classList.add('on');snd(520,.12,'triangle');setTimeout(()=>snd(780,.1,'sine'),90);MCTM=setTimeout(mechNext,7200)}
$('ui').insertAdjacentHTML('beforeend','<div id="mech" class="wd"></div>');
$('mech').addEventListener('pointerdown',e=>{e.stopPropagation();clearTimeout(MCTM);mechNext()});
// ganchos
const _bossStart161=bossStart;bossStart=function(e,k){mechCard(e,k);return _bossStart161.apply(this,arguments)};
const _bossStart2_161=bossStart2;bossStart2=function(e,k){mechCard(e,k);return _bossStart2_161.apply(this,arguments)};
const _bossPh2_161=bossPhase2;bossPhase2=function(e){mechCard(e,'phase2');return _bossPh2_161.apply(this,arguments)};
const _bossPh3_161=bossPhase3;bossPhase3=function(e){mechCard(e,'phase3');return _bossPh3_161.apply(this,arguments)};
const _phaseUp161=phaseUp;phaseUp=function(e,ph,tot){if(tot==3)mechCard(e,'dph');else mechCard(e,'enr');return _phaseUp161.apply(this,arguments)};
const DMK={bite:'d_bite',claw:'d_bite',tail:'d_tail',stomp:'d_stomp',breath:'breath',geysers:'geysers',takeoff:'d_takeoff',barrage:'meteors',meteors:'meteors',roar:'d_roar'};
const _dStart161=dStart;dStart=function(e,k){if(DMK[k]&&BOSSON===e)mechCard(e,DMK[k]);return _dStart161.apply(this,arguments)};
const _bossUpd161=bossUpd;bossUpd=function(e,dt,t,d,dx,dz){const sh=!!e.shT,r=_bossUpd161.apply(this,arguments);if(sh&&!e.shT&&e.vul>0)mechCard(e,'vul');return r};
const _dragonUpd161=dragonUpd;dragonUpd=function(e){const ph=e.dph,r=_dragonUpd161.apply(this,arguments);if(BOSSON===e){if(!dragonReady())mechCard(e,'d_lock');if(e.dph==2&&ph==1)mechCard(e,'d_phase2');if(e.dph==3&&ph==2)mechCard(e,'d_phase3')}return r};
document.head.insertAdjacentHTML('beforeend',`<style>
#mech{position:absolute;left:var(--m,10px);top:calc(var(--m,8px) + var(--u,40px) + 14px);width:min(310px,38vw);display:flex;gap:9px;align-items:flex-start;padding:8px 10px 10px;box-sizing:border-box;z-index:6;pointer-events:auto;
  background:linear-gradient(#ecdcae,#d9c28a);border:3px solid #2a1206;border-radius:6px;box-shadow:0 0 0 2px #b8862e,0 8px 18px rgba(0,0,0,.6);color:#3a2010;opacity:0;transform:translateX(-120%);transition:transform .35s cubic-bezier(.2,.9,.3,1.2),opacity .3s}
#mech.on{opacity:1;transform:none}#mech .mci{flex:none;width:42px;height:42px}#mech .mci img{width:100%;height:100%;display:block}#mech .mci i{font-size:32px;font-style:normal}
#mech .mct{flex:1;min-width:0}#mech small{display:block;font:700 9.5px var(--px,Georgia);color:#8a3a10;text-transform:uppercase;letter-spacing:1px}#mech b{display:block;font:700 15px var(--fn);color:#2a1206;margin:1px 0 2px}
#mech p{margin:0;font:12px/1.32 Georgia,serif;color:#3a2412}#mech u{position:absolute;left:6px;right:6px;bottom:3px;height:3px;background:#8a3a10;transform-origin:left;text-decoration:none}#mech.on u{animation:mcu 7.2s linear forwards}@keyframes mcu{to{transform:scaleX(0)}}
@media (max-height:430px){#mech{width:min(270px,34vw);padding:6px 8px 8px}#mech p{font-size:11px}#mech b{font-size:13.5px}#mech .mci{width:34px;height:34px}}</style>`);
