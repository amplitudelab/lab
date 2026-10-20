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
function walkP(x,z,fromY){if(Math.abs(x)>WMAX||Math.abs(z)>WMAX)return false;if(onBridge(x,z))return true;const h=groundAt(x,z);return h>-2.4&&(fromY==null||h-Math.max(fromY,WADE_Y)<1.3)}
const waterDepth=()=>onBridge(P.x,P.z)?0:Math.max(0,WATER_Y-Math.max(groundAt(P.x,P.z),WADE_Y)+.05);
// altura do herói: degraus suaves no chão, gravidade no ar, pés no fundo raso da água (meio corpo submerso)
function playerY(dt){const g=groundAt(P.x,P.z),fl=Math.max(g,WADE_Y);
  if(P.air){P.vy-=(P.plunge?62:26)*dt;P.y+=P.vy*dt;if(P.y<=fl){P.y=fl;landJump(P.vy)}}
  else if(fl<P.y-.75&&!P.leap){P.air=1;P.vy=0}
  else P.y+=(fl-P.y)*damp(fl>P.y?16:10,dt)}
function jump(){if(P.dead||P.air||P.leap||P.dash>0||P.roll>0||UI.block()||P.stun>0)return;dismount();if(P.sneak)sneakSet(0);const wd=waterDepth();P.air=1;P.vy=wd>.6?7:10.5;
  sweep(260,620,.12,'triangle',.03);if(wd>0)splash(P.x,P.z,1.2);else puff(P.x,P.y+.2,P.z,0xcdb894,1.1)}
function landJump(vy){P.air=0;P.vy=0;const wd=waterDepth();
  if(P.plunge){P.plunge=0;P.act=null;const x=P.x+S(P.f)*.6,z=P.z+C(P.f)*.6;SHK=Math.max(SHK,.5);HITSTOP=Math.max(HITSTOP,.06);ring(x,z,3.4,trailCol(),.4);ring(x,z,1.8,0xffffff,.25);star(x,P.y+.6,z,0xffffff,2.6,.18);
    fx(x,P.y+.3,z,0xb8a888,16,9,.22,1,10);for(let i=0;i<4;i++)puff(x+C(i*1.6)*1.6,P.y+.3,z+S(i*1.6)*1.6,0xd8c8a8,2);if(wd>0)splash(x,z,2.4);snd(70,.35,'sawtooth');
    let h=0;for(const e of E)if(!e.dead&&!e.t.passive&&hy(e.x-x,e.z-z)-e.r<3.4){const[dm,c]=rollDmg(1.9);hurtMob(e,dm,c,'golpe');e.stun=Math.max(e.stun,.7);impactFx(e,1);h++}if(h)addFury(10*Math.min(3,h));return}
  if(vy<-9){puff(P.x,P.y+.2,P.z,0xcdb894,1.4);SHK=Math.max(SHK,.12);snd(120,.08,'square')}if(wd>0)splash(P.x,P.z,1.4)}
// golpe aéreo: atacar no ar (com altura) mergulha a arma no chão
function plunge(){P.plunge=1;P.vy=-18;P.act={k:'slam',t:.12,dur:.5,hp:9,sk:'aereo'};sweep(900,200,.2,'sawtooth',.04)}
const _attack14=attack;attack=function(){if(P.air&&!P.plunge&&!P.act&&!P.dead&&!UI.block()&&!MANA()&&!bow()&&P.y-Math.max(groundAt(P.x,P.z),WADE_Y)>.8){plunge();return}return _attack14()};
// mergulho com cambalhota (no lugar do dash): voa baixo para a frente, rola e levanta
const _dash14=dash;dash=function(){if(P.air&&P.y-groundAt(P.x,P.z)>1.4)return;const was=P.cd.dash;_dash14();if(P.dash>0&&P.cd.dash!==was){P.dash=.26;P.dive=1;P.roll=0;P.air=0;P.vy=0;P.inv=Math.max(P.inv,.5)}};
function diveLand(){P.roll=.34;const wd=waterDepth();if(wd>0)splash(P.x,P.z,1.6);else{puff(P.x,P.y+.2,P.z,0xcdb894,1.6);fx(P.x,P.y+.2,P.z,0xb8a888,5,3,.14,.5,8)}snd(140,.1,'square')}
// pose do corpo inteiro no mergulho e na cambalhota (gira em volta do centro, perto do chão)
function heroPoseUpd(){const g=P.m.g;if(g.rotation.order!='YXZ')g.rotation.order='YXZ';let ax=0,H=0;
  if(P.dash>0&&P.dive){const u=1-P.dash/.26;ax=lerp(.25,1.4,Math.min(1,u*2));H=lerp(.95,.42,u)+S(u*PI)*.55}
  else if(P.roll>0){const u=1-P.roll/.34;ax=1.4+sstep(0,1,u)*(TAU-1.4);H=lerp(.42,.95,sstep(.45,1,u))}
  if(!ax){if(g.rotation.x)g.rotation.x=0;return}const hp=.95;g.rotation.x=ax;const fy=H-hp*C(ax),ff=-hp*S(ax);g.position.x+=S(P.f)*ff;g.position.z+=C(P.f)*ff;g.position.y+=fy}
// ---------- água: respingos e ondas na superfície
function splash(x,z,k){k=k||1;ring(x,z,1.2*k,0xd8f0ff,.5,1,WATER_Y+.03);fx(x,WATER_Y+.1,z,0xd8f0ff,Math.round(6*k),3.5*k,.1,1.4,9);fx(x,WATER_Y+.1,z,0x9ad8ff,Math.round(3*k),2.5,.14,1,9)}
let wkT=0;
function feelUpd(dt){if(!run)return;heroPoseUpd();if(innerWidth!==RSW||innerHeight!==RSH)rs();
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
