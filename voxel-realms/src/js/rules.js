'use strict';
/* =============================================================================
   VOXEL REALMS · regras de combate e progressão (15.4)
   - Sem primeira pessoa: o olho 👁️ troca o campo de visão (fica no lugar do
     botão de correr; correr é pelo joystick ou Shift).
   - Tocha só com uma mão livre; o herói tira da cintura e acende na mão; luz mais forte.
   - Segunda classe (Eremita): habilidades dela causam 30% menos dano e recarregam
     30% mais devagar; itens de classe caem 60% da principal e 40% da segunda.
   - Monstros acompanham o nível do herói (campeões e raros ficam mais comuns).
   - Fases: chefes de verdade têm 3 (masmorra: 66% e 33%; chefes do mundo: 50% e 22%),
     elites têm 2 (fúria aos 50%), errantes têm 1.
   - Ignarok é a luta final: invulnerável e mata com um golpe até todas as missões
     principais anteriores estarem concluídas; ficou bem mais forte.
   - Barra de vida flutuante sobre errantes, elites e chefes.
   ============================================================================= */
// ---------- olho = campo de visão
FPV.on=false;try{localStorage.setItem('vr11_fp','0')}catch(e){}
function eyeLbl(){const b=$('eyeb');if(b)b.querySelector('em').textContent=FOVB+'°'}
fpvToggle=function(){FPV.on=false;fovNext();eyeLbl();toast('👁️','Campo de visão: '+FOVB+'°','');snd(700+FOVS.indexOf(FOVB)*90,.05,'sine')};
$('eyeb').addEventListener('pointerdown',e=>{e.stopPropagation();fpvToggle()});eyeLbl();
// ---------- tocha: só com uma mão livre, sai da cintura e acende na mão
const freeHand=()=>!EQ.mao2&&!(EQ.arma&&isTwo(EQ.arma))&&!bow();
const _torchT15=torchToggle;torchToggle=function(v){const on=v==null?!TCH.on:!!v;if(on&&!freeHand()){toast('🔥','Precisa de uma mão livre','Tire o escudo, a segunda arma ou a arma de duas mãos para segurar a tocha.');snd(200,.1,'square');return}
  if(on&&!TCH.on)TCH.draw=.55;_torchT15(v)};
const _torchU15=torchUpd;torchUpd=function(dt,t){if(TCH.on&&run&&!P.dead&&!freeHand()){TCH.on=false;const b=$('torb');if(b)b.classList.remove('on');toast('🔥','Tocha guardada','As duas mãos estão ocupadas.')}
  _torchU15(dt,t);if(!TCH.g)return;const show=TCH.on&&!P.dead&&run;
  if(show){SHU.uTR.value=18;SHU.uTC.value.multiplyScalar(1.35)}
  if(TCH.draw>0&&show){TCH.draw-=dt;const u=1-TCH.draw/.55,m=P.m;
    if(u<.5){if(TCH.g.parent!==m.hips)m.hips.add(TCH.g);TCH.g.position.set(-.5,-.1,.12);TCH.g.rotation.set(0,0,.15);TCH.fm.visible=false;TCH.sp.visible=false;m.sL.rotation.x=.35;m.sL.rotation.z=-.4;m.eL.rotation.x=-.3}
    else{TCH.fm.visible=true;TCH.sp.visible=true;const k=(u-.5)*2;TCH.fm.scale.multiplyScalar(.3+.7*k);if(!TCH.lit){TCH.lit=1;TCH.g.updateWorldMatrix(true,false);_tv.set(0,1.05,0);TCH.g.localToWorld(_tv);flash(_tv.x,_tv.y,_tv.z,0xffb040,3,.3);fx(_tv.x,_tv.y,_tv.z,0xffb040,12,3,.1,2,-1);sweep(180,620,.3,'sawtooth',.04)}}}
  else{TCH.lit=0;if(TCH.fm)TCH.fm.visible=true}};
// ---------- segunda classe: mais fraca e cara
const SUBCLS=()=>{for(const c in CLS_TREE)if(CLS_TREE[c]==P.sub)return c;return null};
const isSub=id=>!!(P.sub&&SK[id]&&SK[id].t==P.sub);
let SUBCTX=0;
const _cdOf15=cdOf;cdOf=function(id){return _cdOf15(id)*(isSub(id)?1.3:1)};
const _rollDmg15=rollDmg;rollDmg=function(m){const r=_rollDmg15(m);if(SUBCTX>0)r[0]*=.7;return r};
const _useSkill17=useSkill;useSkill=function(slot){const id=P.bar[slot];if(isSub(id))SUBCTX++;try{return _useSkill17(slot)}finally{if(isSub(id))SUBCTX--}};
const _skillHit17=skillHit;skillHit=function(){const id=P.act&&P.act.sk,sb=isSub(id);if(sb)SUBCTX++;try{return _skillHit17.apply(this,arguments)}finally{if(sb)SUBCTX--}};
const _pickBase15=pickBase;pickBase=function(slot,bl){const sc=P.sub&&R()<.4?SUBCLS():null;if(!sc)return _pickBase15(slot,bl);const c=P.cls;P.cls=sc;try{return _pickBase15(slot,bl)}finally{P.cls=c}};
// ---------- monstros acompanham o nível do herói
mobLv=function(reg){return Math.max(REG[reg].lv,P.lv)};
// ---------- Ignarok: luta final
Object.assign(BOSS.ignarok,{hp:7600,dmg:44,lv:20});
const dragonReady=()=>QD.filter(q=>q.cat=='main'&&q.id!='m13'&&q.id!='m14').every(q=>done(q.id));
let drgWarn=0;
const _hurtMob17=hurtMob;hurtMob=function(e,d,crit,src){if(e.type=='ignarok'&&!dragonReady()){const n=performance.now();if(n-drgWarn>1500){drgWarn=n;pop('INVULNERÁVEL',e.x,e.y+6,e.z,'#ff5a3a',1);toast('🐉','Ignarok não pode ser ferido','Conclua todas as missões principais antes da luta final.')}return}
  const r=_hurtMob17.apply(this,arguments);phaseCheck(e);return r};
const _dHit15=dHit;dHit=function(e,mul,o){if(e&&e.type=='ignarok'&&!dragonReady()){if(P.dead)return;hitPlayer(ST.mx*50,Object.assign({src:e},o||{}));return}return _dHit15(e,mul,o)};
// ---------- fases de elites (2) e chefes de masmorra (3); errantes têm uma só
function phaseUp(e,ph,tot){e.eph=ph;e.dmg*=1.22;e.sp*=1.14;e.inv=Math.max(e.inv||0,.6);e.enr=1;const big=tot==3;
  ring(e.x,e.z,big?7:4,0xff3a2a,.6);flash(e.x,e.y+1.5,e.z,0xff5a2a,big?8:4,.4);fx(e.x,e.y+1,e.z,0xff5a2a,big?30:14,big?9:5,.25,1.4);SHK=Math.max(SHK,big?.6:.25);sweep(160,60,.6,'sawtooth',.05);
  if(hy(P.x-e.x,P.z-e.z)<(big?6:3.5))hitPlayer(e.dmg*.35,{kb:7,src:e});
  if(big){banner((ph==2?'FASE II':'FASE III')+' · '+(e.name||e.t.n));const D=DST.on;if(D)for(let i=0;i<ph;i++){const a=R()*TAU,m=dngMob?dngMob(pick(D.mob),e.x+C(a)*6,e.z+S(a)*6,{}):null;if(m)m.st='chase'}}
  else pop('Enfurecido!',e.x,e.y+3,e.z,'#ff6a3a')}
function phaseCheck(e){if(!e||e.dead||e.boss||e.errante||e.minion)return;const k=e.hp/e.mx;
  if(e.dngBoss){if(!e.eph&&k<=.66)phaseUp(e,2,3);else if(e.eph==2&&k<=.33)phaseUp(e,3,3)}else if(e.el&&!e.eph&&k<=.5)phaseUp(e,2,2)}
const _dngBoss15=dngBoss;dngBoss=function(){const r=_dngBoss15.apply(this,arguments);if(DST.boss)DST.boss.dngBoss=1;return r};
// chefes do mundo: terceira fase aos 22%
function bossPhase3(e){const T=e.t;e.ph=3;e.inv=2.6;e.act={k:'phase',t:0,dur:BDUR.phase};e.hp=Math.min(e.mx,e.hp+e.mx*.06);e.dmg=Math.round(e.dmg*1.25);e.sp*=1.12;for(const k in e.ab)e.ab[k]=Math.min(e.ab[k],2);
  $('boss').classList.add('p2','p3');$('bph').textContent='FASE III';banner('FASE III');pop(T.n.split(',')[0]+': fúria final!',P.x,P.y+3.8,P.z,'#ff3a6a');
  snd(60,1.4,'sawtooth');sweep(260,40,1.6,'sawtooth',.08);SHK=1.1;flash(e.x,e.y+2,e.z,0xff2a6a,14,1);ring(e.x,e.z,11,0xff2a6a,1);ring(e.x,e.z,6,0xffd060,.8);fx(e.x,e.y+1.5,e.z,0xff3a6a,60,14,.4,1.8);
  if(T.sum)for(let i=0;i<3;i++){const a=R()*TAU,m=mkMob(T.sum,e.x+C(a)*6,e.z+S(a)*6,{lv:Math.max(1,e.lv-1),minion:1,ch:e.ch,el:i==0?1:0});m.st='chase'}}
const _bossUpd15=bossUpd;bossUpd=function(e,dt,t,d,dx,dz){const r=_bossUpd15(e,dt,t,d,dx,dz);if(e.type!='ignarok'&&BOSSON===e&&e.ph==2&&!e.act&&e.hp>0&&e.hp<=e.mx*.22)bossPhase3(e);return r};
// aura das elites enfurecidas
const _mobsUpd15=mobsUpd;mobsUpd=function(dt,t){_mobsUpd15(dt,t);for(const e of E)if(e.enr&&!e.dead&&ev(3))fx(e.x+(R()-.5)*e.r*2,e.y+R()*1.8,e.z+(R()-.5)*e.r*2,0xff4a2a,1,1.2,.18,1.4,-1);hpbUpd()};
// ---------- barra de vida flutuante (errantes, elites e chefes)
const HPB=new Map();
const hpbNeed=e=>!e.dead&&(e.boss||e.el||e.errante||e.dngBoss)&&!e.t.passive;
function hpbMake(e){const cv=document.createElement('canvas');cv.width=200;cv.height=44;const tx=new THREE.CanvasTexture(cv),sp=new THREE.Sprite(new THREE.SpriteMaterial({map:tx,transparent:true,depthWrite:false}));sp.renderOrder=6;
  e.m.g.updateMatrixWorld(true);const bb=new THREE.Box3().setFromObject(e.m.g),h=Math.max(1.6,bb.max.y-e.m.g.position.y);const w=e.boss?3.4:e.dngBoss?3:2.3;sp.scale.set(w,w*.22,1);sc.add(sp);return{sp,cv,tx,h:h+.45,last:-1}}
function hpbDraw(b,e){const x=b.cv.getContext('2d'),k=Math.max(0,e.hp/e.mx),col=e.boss?'#ff3a2a':e.dngBoss?'#c060ff':e.errante?'#ffb040':e.el==2?'#ffd34a':'#6aa0ff';x.clearRect(0,0,200,44);
  x.font='bold 15px Cinzel,Georgia';x.textAlign='center';x.lineWidth=4;x.strokeStyle='rgba(0,0,0,.85)';const nm=(e.name||e.t.n).split(',')[0].slice(0,24);x.strokeText(nm,100,15);x.fillStyle=col;x.fillText(nm,100,15);
  x.fillStyle='rgba(10,4,8,.85)';x.fillRect(8,22,184,16);x.strokeStyle='#d9a948';x.lineWidth=2;x.strokeRect(8,22,184,16);const g=x.createLinearGradient(0,24,0,36);g.addColorStop(0,'#fff');g.addColorStop(.25,col);g.addColorStop(1,'#300');x.fillStyle=g;x.fillRect(11,25,178*k,10);
  const ticks=e.boss?(e.type=='ignarok'?[.6,.25]:[.5,.22]):e.dngBoss?[.66,.33]:e.errante?[]:[.5];x.fillStyle='#fff';for(const p of ticks)x.fillRect(11+178*p-1,23,2,14);b.tx.needsUpdate=true}
function hpbUpd(){for(const e of E){if(!hpbNeed(e))continue;const d=hy(e.x-P.x,e.z-P.z);let b=HPB.get(e);if(d>48||!e.m.g.visible){if(b)b.sp.visible=false;continue}
    if(!b){b=hpbMake(e);HPB.set(e,b)}const k=Math.round(e.hp/e.mx*200);if(k!==b.last){b.last=k;hpbDraw(b,e)}b.sp.visible=true;b.sp.position.set(e.m.g.position.x,e.m.g.position.y+b.h,e.m.g.position.z)}
  for(const[e,b]of HPB)if(e.dead||!E.includes(e)){sc.remove(b.sp);b.tx.dispose();b.sp.material.dispose();HPB.delete(e)}}
