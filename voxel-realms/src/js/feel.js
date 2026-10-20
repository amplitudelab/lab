'use strict';
/* =============================================================================
   VOXEL REALMS · movimento e sensação (14.1)
   Pulo (⤒ ou F) com golpe aéreo (atacar no ar mergulha no chão com impacto),
   mergulho com cambalhota no estilo Helldivers no lugar do dash, água que dá
   para atravessar (o herói afunda até a cintura e anda mais devagar),
   colisão pela borda do corpo, campo de visão configurável e aviso de
   inventário cheio sem repetir.
   ============================================================================= */
P.air=0;P.vy=0;P.roll=0;P.dive=0;P.plunge=0;
const WATER_Y=-.2,WADE_Y=-1.45;
// o herói pode entrar em qualquer água (o leito do rio fica a ~1,7 de fundo), mas não sobe paredes
function walkP(x,z,fromY){if((Math.abs(x)>WMAX||Math.abs(z)>WMAX)&&!(typeof DST!='undefined'&&DST.on))return false;if(onBridge(x,z))return true;const h=groundAt(x,z);return h>-2.4&&(fromY==null||h-Math.max(fromY,WADE_Y)<1.3)}
const waterDepth=()=>onBridge(P.x,P.z)?0:Math.max(0,WATER_Y-Math.max(groundAt(P.x,P.z),WADE_Y)+.05);
// altura do herói: degraus suaves no chão, gravidade no ar, pés no fundo raso da água (meio corpo submerso)
function playerY(dt){const g=footY(P.x,P.z,P.y,.3),fl=Math.max(g,WADE_Y);
  if(P.air){P.vy-=(P.plunge?62:26)*dt;P.y+=P.vy*dt;if(P.y<=fl){P.y=fl;landJump(P.vy)}}
  else if(fl<P.y-.75&&!P.leap){P.air=1;P.vy=0}
  else if(fl>P.y)P.y=Math.max(P.y+(fl-P.y)*damp(26,dt),fl-.12);else P.y+=(fl-P.y)*damp(10,dt)}
function jump(){if(P.dead||P.air||P.leap||P.dash>0||P.roll>0||UI.block()||P.stun>0)return;dismount();if(P.sneak)sneakSet(0);const wd=waterDepth();P.air=1;P.vy=wd>.6?7:10.5;
  sweep(260,620,.12,'triangle',.03);if(wd>0)splash(P.x,P.z,1.2);else puff(P.x,P.y+.2,P.z,0xcdb894,1.1)}
function landJump(vy){P.air=0;P.vy=0;const wd=waterDepth();
  if(P.plunge){P.plunge=0;P.act=null;const x=P.x+S(P.f)*.6,z=P.z+C(P.f)*.6;SHK=Math.max(SHK,.5);HITSTOP=Math.max(HITSTOP,.06);ring(x,z,3.4,trailCol(),.4);ring(x,z,1.8,0xffffff,.25);star(x,P.y+.6,z,0xffffff,2.6,.18);
    fx(x,P.y+.3,z,0xb8a888,16,9,.22,1,10);for(let i=0;i<4;i++)puff(x+C(i*1.6)*1.6,P.y+.3,z+S(i*1.6)*1.6,0xd8c8a8,2);if(wd>0)splash(x,z,2.4);snd(70,.35,'sawtooth');
    let h=0;P.heavyHit=1;for(const e of E)if(!e.dead&&!e.t.passive&&hy(e.x-x,e.z-z)-e.r<3.4){const[dm,c]=rollDmg(1.9);hurtMob(e,dm,c,'golpe');e.stun=Math.max(e.stun,.7);impactFx(e,1);h++}P.heavyHit=0;if(h)addFury(10*Math.min(3,h));return}
  if(vy<-9){puff(P.x,P.y+.2,P.z,0xcdb894,1.4);SHK=Math.max(SHK,.12);snd(120,.08,'square')}if(wd>0)splash(P.x,P.z,1.4)}
// golpe aéreo: atacar no ar (com altura) mergulha a arma no chão
function plunge(){P.plunge=1;P.vy=-18;P.act={k:'slam',t:.12,dur:.5,hp:9,sk:'aereo'};sweep(900,200,.2,'sawtooth',.04)}
const _attack14=attack;attack=function(){if(P.air&&!P.plunge&&!P.act&&!P.dead&&!UI.block()&&!MANA()&&!bow()&&P.y-Math.max(groundAt(P.x,P.z),WADE_Y)>.8){plunge();return}return _attack14()};
// 15.0 · desvio com variações (no lugar do dash):
//  para a frente → mergulho com cambalhota encolhida (ou deslizando de barriga e levantando com as mãos);
//  para os lados (perto de inimigo) → rolamento lateral sem tirar os olhos do alvo; para trás → salto para trás.
// O corpo gira em volta do próprio centro e é empurrado para cima até nenhum ponto (cabeça, pés, mãos,
// mochila) ficar abaixo do chão — nada mais atravessa o terreno.
function dodgeFoe(){let b=null,bd=9;for(const e of E){if(e.dead||e.t.passive||e.st!='chase')continue;const d=hy(e.x-P.x,e.z-P.z);if(d<bd){bd=d;b=e}}return b}
const _dash14=dash;dash=function(){if(P.air&&P.y-groundAt(P.x,P.z)>1.4)return;const was=P.cd.dash,foe=dodgeFoe(),[ix,iz]=inputDir();_dash14();if(!(P.dash>0&&P.cd.dash!==was))return;
  let k='dive',dir=0,ff=P.f;if(foe&&(ix||iz)){const fa=Math.atan2(foe.x-P.x,foe.z-P.z),rel=Math.atan2(ix,iz)-fa,ra=Math.atan2(S(rel),C(rel));
    if(Math.abs(ra)>2.2)k='back';else if(Math.abs(ra)>.75){k='side';dir=ra>0?1:-1}if(k!='dive'){ff=fa;P.f=fa}}
  P.air=0;P.vy=0;P.roll=0;P.inv=Math.max(P.inv,.5);P.dodge={k,v:k=='dive'&&R()<.35?1:0,dir,f:ff};
  if(k=='dive'){P.dash=.26;P.dive=1;P.dsp=16}else if(k=='side'){P.dash=.16;P.dive=0;P.dsp=15}else{P.dash=.24;P.dive=0;P.dsp=12.5;puff(P.x,P.y+.3,P.z,0xcdb894,1.2)}};
// fim da primeira fase: cai rolando, deslizando ou agachado
function diveLand(){const D=P.dodge;if(!D){P.dive=0;return}const wd=waterDepth();P.rollD=D.k=='back'?.16:D.k=='side'?.32:D.v?.5:.36;P.roll=P.rollD;
  if(wd>0)splash(P.x,P.z,D.k=='dive'?1.6:1);else if(D.k!='back'){puff(P.x,P.y+.2,P.z,0xcdb894,1.6);fx(P.x,P.y+.2,P.z,0xb8a888,5,3,.14,.5,8)}snd(D.k=='back'?220:140,.1,'square')}
const HPTS=[['head',0,1,0],['head',0,.45,.5],['head',0,.45,-.5],['head',.45,.45,0],['head',-.45,.45,0],['torso',0,1,-.62],['torso',0,1.05,.3],['torso',.55,.9,0],['torso',-.55,.9,0],['torso',0,.15,-.35],['hips',0,-.2,.28],
  ['kL',0,-.56,.34],['kR',0,-.56,.34],['kL',0,-.56,-.22],['kR',0,-.56,-.22],['kL',0,0,.2],['kR',0,0,.2],['hL',0,-.14,0],['hR',0,-.14,0],['eL',0,0,0],['eR',0,0,0]];
const _hpv=new V3();
// ponto mais baixo do corpo e centro (no mundo) depois de posar e girar
function heroSpan(m){m.g.updateMatrixWorld(true);let lo=1e9,cx=0,cz=0,n=0;for(const p of HPTS){const b=m[p[0]];if(!b)continue;_hpv.set(p[1],p[2],p[3]).applyMatrix4(b.matrixWorld);if(_hpv.y<lo)lo=_hpv.y;cx+=_hpv.x;cz+=_hpv.z;n++}return[lo,cx/n,cz/n]}
function heroPoseUpd(){const m=P.m,g=m.g,D=P.dodge;if(g.rotation.order!='YXZ')g.rotation.order='YXZ';if(INV_OPEN.k>.01)g.rotation.y=P.f+(INV_OPEN.rot||0)*INV_OPEN.k;
  if(!D||P.dead||(!(P.dash>0)&&!(P.roll>0))){if(D&&!(P.dash>0)&&!(P.roll>0)){P.dodge=null;P.dive=0;P.dsp=0}if(g.rotation.x||g.rotation.z){g.rotation.x=0;g.rotation.z=0}return}
  let ax=0,az=0,lift=0,touch=0;const ph1=P.dash>0,u=ph1?1-P.dash/(D.k=='dive'?.26:D.k=='side'?.16:.24):1-P.roll/(P.rollD||.34);
  if(D.k=='dive'){if(ph1){ax=lerp(.12,1.45,sstep(0,.85,u));lift=S(u*PI)*.75}else if(!D.v){ax=1.45+sstep(0,1,u)*(TAU-1.45);touch=1}else{ax=u<.55?1.5:lerp(1.5,0,sstep(.55,1,u));touch=1}}
  else if(D.k=='side'){az=-D.dir*(ph1?.7*u:.7+sstep(0,1,u)*(TAU-.7));lift=ph1?S(u*PI*.5)*.35:0;touch=ph1?0:1}
  else{ax=ph1?-.22*S(u*PI):0;lift=ph1?S(u*PI)*.55:0}
  g.rotation.x=ax;g.rotation.z=az;g.rotation.y=D.k=='dive'?P.f:D.f;
  const wr=Math.min(1,Math.abs(S((ax+az)/2))*2.2),fl=P.y;g.position.y+=lift;const[lo,cx,cz]=heroSpan(m);
  g.position.x+=(P.x-cx)*wr;g.position.z+=(P.z-cz)*wr;const gap=fl+.03-lo;g.position.y+=gap>0?gap:touch?gap*Math.max(wr,.35):0}
// ---------- água: respingos e ondas na superfície
function splash(x,z,k){k=k||1;ring(x,z,1.2*k,0xd8f0ff,.5,1,WATER_Y+.03);fx(x,WATER_Y+.1,z,0xd8f0ff,Math.round(6*k),3.5*k,.1,1.4,9);fx(x,WATER_Y+.1,z,0x9ad8ff,Math.round(3*k),2.5,.14,1,9)}
let wkT=0;
// o herói não atravessa os inimigos (nem entra no corpo deles na primeira pessoa)
function mobPush(){if(P.dash>0||P.roll>0||P.leap)return;for(const e of E){if(e.dead||e.t.passive||e.air)continue;const dx=P.x-e.x,dz=P.z-e.z,m=e.r+.45;if(Math.abs(dx)>m||Math.abs(dz)>m)continue;const d=hy(dx,dz);if(d<m&&d>1e-3&&Math.abs(P.y-e.y)<2.2){const k=(m-d)/d;P.x+=dx*k*.8;P.z+=dz*k*.8;e.x-=dx*k*.2;e.z-=dz*k*.2;if(P.lunge>0)P.lunge=0}}}
function feelUpd(dt){if(!run)return;mobPush();heroPoseUpd();if(innerWidth!==RSW||innerHeight!==RSH)rs();
  const wd=waterDepth();wkT-=dt;if(wd>.08&&(P.v||0)>1&&wkT<=0){wkT=.28;ring(P.x-S(P.f)*.3,P.z-C(P.f)*.3,1.1,0xd8f0ff,.6,1,WATER_Y+.03);if(R()<.6)fx(P.x,WATER_Y+.1,P.z,0xd8f0ff,2,2,.08,.8,9)}}
// ---------- inventário cheio: avisa uma vez ao passar por cima (com intervalo), sem repetir a mensagem
let invFullT=0;const _pick14=pickItem;
pickItem=function(it){const stack=it.slot=='mat'&&INV.some(o=>o&&o.mid==it.mid);if(!stack&&INV.indexOf(null)<0){const n=performance.now();if(!it.fullT||n-it.fullT>8000){if(n-invFullT>2500){pop('Inventário cheio!',P.x,P.y+3,P.z,'#ff8a5a');invFullT=n}}it.fullT=n;return false}return _pick14(it)};
// ---------- campo de visão (menu)
const FOVS=[56,62,70,78,86];
function fovLbl(){const b=$('fovb');if(b)b.textContent='Campo de visão: '+FOVB+'°'}
function fovNext(){const i=FOVS.indexOf(FOVB);FOVB=FOVS[(i+1)%FOVS.length];try{localStorage.setItem('vr11_fov',String(FOVB))}catch(e){}rs();fovLbl()}
// ---------- botões
{const b=$('jmpb');b.onpointerdown=e=>{e.stopPropagation();b.setPointerCapture(e.pointerId);jump()};const f=$('fovb');if(f){f.onclick=fovNext;fovLbl()}}
// ---------- 14.5: escada de desempenho — se mesmo na resolução mínima o jogo continuar lento,
// desliga a textura/chanfro dos voxels e depois reduz as partículas (avisa uma vez)
const PERF={lv:0,n:0,t:0};
const _drs15=drsUpd;drsUpd=function(raw){_drs15(raw);if(!run||LOADING||document.hidden)return;PERF.n++;PERF.t+=raw;if(PERF.t<4)return;const fps=PERF.n/PERF.t;PERF.n=PERF.t=0;
  const want=(FPSC||60)*.7;if(DRS.s<=DRS.min+.01&&fps<want&&PERF.lv<2){PERF.lv++;if(PERF.lv==1)SHU.uBv.value=0;else GFX.fx*=.6;if(PERF.lv==1)toast('⚙️','Detalhes reduzidos','Para manter o jogo fluido neste aparelho.')}};
