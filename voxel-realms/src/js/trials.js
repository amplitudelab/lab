'use strict';
/* =============================================================================
   VOXEL REALMS · missões mais complexas e difíceis (14.4)
   - Mais abates e coletas por missão e recompensas maiores.
   - Missões em etapas: depois de cumprir a primeira parte surge a próxima.
     Caçada: um inimigo de elite com nome aparece no local (com afixos).
     Defesa: fique perto do ponto e aguente 3 ondas; se fugir, a defesa recomeça.
   - Missão nova: O Cerco de Pedraverde (conversa, defesa do portão, caçada ao líder).
   ============================================================================= */
for(const q of QD){if((q.t=='kill'||q.t=='zone'||q.t=='elite')&&q.n_>1)q.n_=Math.round(q.n_*1.5);if(q.t=='collect'&&!q.pts&&q.n_>2)q.n_=Math.round(q.n_*1.25);
  if(q.rw){if(q.rw.xp)q.rw.xp=Math.round(q.rw.xp*1.3);if(q.rw.gold)q.rw.gold=Math.round(q.rw.gold*1.25)}}
QD.push({id:'s20',cat:'side',reg:'vila',n:'O Cerco de Pedraverde',d:'O Guarda Tomas, no portão sul da vila, tem notícias urgentes.',t:'talk',npc:'guarda',req:['m3'],rw:{xp:1100,gold:260,item:2},
  done:[['Guarda Tomas','Pedraverde resistiu, Guardião. O Corvo caiu e os bandidos fugiram para as colinas.','🛡️'],['Kael','Enquanto a Sombra existir, eles voltam. Mantenha o portão de pé.','🛡️']]});
QS.s20={st:0,p:0,got:[]};QIDX.s20=QD[QD.length-1];
const STG={
  m3:[{t:'hunt',mob:'boar',at:[46,140],nm:'Javali Alfa',d:'Um javali enorme lidera a manada. Encontre e abata o Javali Alfa perto do moinho.'}],
  m7:[{t:'hunt',mob:'dwolf',at:[-20,-150],nm:'Fenrir, o Lobo Negro',d:'O líder da alcateia ronda a floresta. Abata Fenrir.'}],
  m8:[{t:'defend',at:[-112,-78],r:11,mob:['zombie','ghoul','skel','skelwar','zbrute'],n_:3,d:'Os mortos atacam o portão do cemitério! Fique perto do portão e aguente 3 ondas.'}],
  s7:[{t:'hunt',mob:'spider',at:[-30,-160],nm:'Tecelã-Mãe',d:'Encontre a Tecelã-Mãe no coração do ninho e destrua-a.'}],
  s10:[{t:'hunt',mob:'croc',at:[-160,40],nm:'Mandíbula Velha',d:'O maior crocodilo do mangue espreita perto da cabana. Abata Mandíbula Velha.'}],
  s11:[{t:'defend',at:[150,-150],r:11,mob:['lslime','imp','skelmage'],n_:3,d:'Slimes de lava e diabretes atacam o altar de obsidiana. Aguente 3 ondas.'}],
  s20:[{t:'defend',at:[6,40],r:11,mob:['bandit','bandarc','bshield','bbrute','bshaman'],n_:3,d:'Bandidos atacam o portão sul de Pedraverde! Defenda o portão por 3 ondas.'},
    {t:'hunt',mob:'bbrute',at:[-38,172],nm:'Corvo, o Saqueador',d:'O líder do ataque fugiu para o acampamento dos bandidos. Acabe com o Corvo.'}]};
const SKEYS=['t','mob','n_','d','at','r','nm'];
for(const id in STG){const q=QIDX[id];if(!q)continue;const b={};for(const k of SKEYS)b[k]=q[k];q.stg=[b,...STG[id]];q.n0=q.n}
function applyStage(q,i){const st=q.stg[i];for(const k of SKEYS)q[k]=st[k];if(q.n_==null)q.n_=1;q.n=q.n0+' ('+(i+1)+'/'+q.stg.length+')'}
for(const id in STG)if(QIDX[id])applyStage(QIDX[id],0);
const _qCheck14=qCheck;qCheck=function(q){const s=QS[q.id];if(q.stg&&s.st==1&&s.p>=(q.n_||1)&&(s.stg||0)<q.stg.length-1){s.stg=(s.stg||0)+1;s.p=0;s.got=[];qObjClear(q);applyStage(q,s.stg);if(q.t=='collect'||q.t=='interact')qObjSpawn(q);
    toast('📜','Nova etapa: '+q.n,q.d);snd(660,.15,'sine');setTimeout(()=>snd(880,.2,'sine'),140);trackUpd();save();return}
  return _qCheck14(q)};
function stageRestore(){for(const q of QD)if(q.stg)applyStage(q,Math.min(q.stg.length-1,QS[q.id].stg||0))}
// ---------- caçada: alvo de elite com nome
const QH={};
const _qEvent14=qEvent;qEvent=function(ev,a,b,e){if(ev=='kill'&&e&&e.hunt){const q=QIDX[e.hunt],s=QS[e.hunt];if(q&&s&&s.st==1&&q.t=='hunt'){s.p=1;toast('🎯','Alvo abatido',q.nm);qCheck(q)}}return _qEvent14(ev,a,b,e)};
function huntSpot(at){for(let i=0;i<20;i++){const a=R()*TAU,r=R()*8,x=at[0]+C(a)*r,z=at[1]+S(a)*r;if(walkable(x,z)&&groundAt(x,z)>-.4)return[x,z]}return at}
function huntUpd(){for(const q of QD){if(q.t!='hunt'||!act(q.id))continue;const h=QH[q.id];if(h&&!h.dead&&E.includes(h))continue;if(hy(P.x-q.at[0],P.z-q.at[1])>65)continue;
    const[x,z]=huntSpot(q.at),reg=regionAt(x,z),e=mkMob(q.mob,x,z,{lv:mobLv(reg)+2,el:2,afx:[pick(Object.keys(AFF)),pick(Object.keys(AFF))],name:q.nm});e.hp=e.mx=e.mx*1.4;e.hunt=q.id;e.m.g.scale.multiplyScalar(1.15);QH[q.id]=e;
    column(x,z,0xffd34a,10,1.2,.8);if(hy(P.x-x,P.z-z)<40)toast('🎯',q.nm,'O alvo apareceu por perto.')}}
// ---------- defesa: aguentar ondas perto de um ponto
const DEF={q:null,w:0,live:[],t:0};
const DEFM=(()=>{const m=new THREE.Mesh(new THREE.RingGeometry(.94,1,64),new THREE.MeshBasicMaterial({color:0xffd34a,transparent:true,opacity:.5,depthWrite:false,side:2}));m.rotation.x=-PI/2;m.visible=false;sc.add(m);return m})();
function defUpd(dt,t){const q=QD.find(q=>q.t=='defend'&&act(q.id));if(!q){if(DEF.q){defStop();DEF.q=null}DEFM.visible=false;return}
  const d=hy(P.x-q.at[0],P.z-q.at[1]);DEFM.visible=d<60;if(DEFM.visible){DEFM.position.set(q.at[0],groundAt(q.at[0],q.at[1])+.15,q.at[1]);DEFM.scale.setScalar(q.r);DEFM.material.opacity=DEF.q?.35+.2*S(t*4):.3}
  if(DEF.q!==q){if(d<q.r&&!P.dead){DEF.q=q;DEF.w=QS[q.id].p||0;DEF.live=[];DEF.t=1.2;toast('🛡️','Defesa: '+q.n,'Fique dentro do círculo e aguente '+q.n_+' ondas.')}return}
  if(P.dead||d>q.r+10){toast('🛡️','Defesa abandonada','Volte ao círculo para recomeçar.');defStop();QS[q.id].p=0;DEF.q=null;trackUpd();return}
  if(DEF.live.length&&DEF.live.some(m=>!m.dead))return;
  if(DEF.live.length){DEF.live=[];DEF.w++;QS[q.id].p=DEF.w;trackUpd();if(DEF.w>=q.n_){DEF.q=null;qCheck(q);return}DEF.t=4;toast('🛡️','Onda '+DEF.w+' de '+q.n_+' vencida','Prepare-se!')}
  DEF.t-=dt;if(DEF.t>0)return;const n=4+DEF.w*2,reg=regionAt(q.at[0],q.at[1]);
  for(let i=0;i<n;i++){const a=i/n*TAU+R(),r=q.r+5+R()*4;let x=q.at[0]+C(a)*r,z=q.at[1]+S(a)*r;if(!walkable(x,z)){x=q.at[0]+C(a)*(q.r-2);z=q.at[1]+S(a)*(q.r-2)}
    const m=mkMob(pick(q.mob),x,z,{lv:mobLv(reg)+1,el:DEF.w==q.n_-1&&i==0?1:0,afx:DEF.w==q.n_-1&&i==0?[pick(Object.keys(AFF))]:[]});m.st='chase';m.home=[q.at[0],q.at[1]];DEF.live.push(m);puff(x,m.y+.5,z,0x5a4a3a,1.6)}
  banner('ONDA '+(DEF.w+1)+' DE '+q.n_);snd(200,.4,'sawtooth')}
function defStop(){for(const m of DEF.live)if(!m.dead){m.dead=1;m.hp=0}DEF.live=[]}
const _qPos14=qPos;qPos=function(q){if(q.t=='hunt'){const h=QH[q.id];return h&&!h.dead&&E.includes(h)?[h.x,h.z]:q.at}if(q.t=='defend')return q.at;return _qPos14(q)};
function trialsUpd(dt,t){if(!run)return;huntUpd();defUpd(dt,t)}
