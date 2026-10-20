'use strict';
/* =============================================================================
   VOXEL REALMS · Fada-Lume, a companheira de luz (16.1)
   - Novo pet do Tobias: uma fada pequena que voa perto do seu ombro, bate as
     asas, deixa um rastro de brilho e ilumina mais longe e mais forte que a
     tocha, sem ocupar as mãos. Com o livro aberto, ela paira sobre as páginas.
   - Ela usa a mesma luz calculada no shader que a tocha (SHU.uTP/uTC/uTR).
   ============================================================================= */
PETS.fada={n:'Fada-Lume',ic:'🧚',price:780,d:'Voa ao seu lado e ilumina mais longe que a tocha, com as mãos livres. +4% de crítico.',mdl:()=>{
  const m=hum({skin:0xffe2cc,hair:0xffd0f4,hairS:'long',shirt:0xc8f6ff,pants:0xa8e8ff,robe:0xe8fdff,wings:0x9af0ff,glowEyes:0x9af0ff,scale:.3});
  const gl=spr(0xbff4ff,2.4,.55);gl.position.y=.95;m.g.add(gl);const core=spr(0xffffff,.7,.9);core.position.y=.95;m.g.add(core);m.fglow=gl;m.fcore=core;m.fairy=1;return m}};
const _petPassive161=petPassive;petPassive=function(s){_petPassive161(s);if(P.pet=='fada')s.crit+=4};
const FAD={t:0,ang:0,lk:0};
const _petUpd161=petUpd;petUpd=function(dt,t){if(!PETO||P.pet!='fada')return _petUpd161(dt,t);fairyUpd(dt,t)};
// com o jogo pausado (inventário ou livro aberto) a fada continua voando
const _feel161f=feelUpd;feelUpd=function(dt){_feel161f(dt);if(PETO&&P.pet=='fada'&&UI.open&&run)fairyUpd(0,performance.now()/1000)};
function fairyUpd(_dt,t){const now=performance.now(),dt=Math.min(.05,(now-(FAD.n||now))/1000);FAD.n=now;const o=PETO,m=o.m;FAD.t+=dt;FAD.ang+=dt*.7;const rd_=BOOK3&&BOOK3.k>.05,side=rd_?0:1;
  const fx_=S(P.f),fz=C(P.f),rx=fz,rz=-fx_,wob=S(FAD.ang)*.35;
  const tx=P.x+(rd_?fx_*.5+rx*.85:-fx_*.55+rx*(.95+wob)*side),tz=P.z+(rd_?fz*.5+rz*.85:-fz*.55+rz*(.95+wob)*side),ty=P.y+(rd_?2.55:2.55)+S(t*2.3)*.14;
  const d=hy(tx-o.x,tz-o.z);if(d>30||!isFinite(o.y)){o.x=tx;o.z=tz;o.y=ty;fx(o.x,o.y,o.z,0xbff4ff,14,3,.1,1.2,-.5)}
  const k=1-Math.exp(-dt*(d>4?6:3.5));o.x+=(tx-o.x)*k;o.z+=(tz-o.z)*k;o.y+=(ty-o.y)*k;
  const mv=hy(o.x-(o.px??o.x),o.z-(o.pz??o.z));o.px=o.x;o.pz=o.z;const want=mv>.004?Math.atan2(tx-o.x,tz-o.z):Math.atan2(P.x-o.x,P.z-o.z);o.f=angStep(o.f||0,want,dt*5);
  m.g.position.set(o.x,o.y,o.z);m.g.rotation.y=o.f;m.g.rotation.z=S(t*1.7)*.08;m.g.visible=true;
  animate(m,Math.max(dt,.016),t,{v:0,fly:1});if(m.wL)m.wL.rotation.y=.5+S(t*28)*.55;if(m.wR)m.wR.rotation.y=-.5-S(t*28)*.55;
  const pu=.85+.15*S(t*5.3)+.05*S(t*13);if(m.fglow){m.fglow.material.opacity=.4+.2*pu;m.fglow.scale.setScalar(2.2+.4*pu)}
  FAD.lk=pu;if(!UI.open&&ev(5))fx(o.x+(R()-.5)*.3,o.y+.6+(R()-.5)*.3,o.z+(R()-.5)*.3,R()<.5?0xbff4ff:0xffd0f4,1,.25,.05,.9,.4)}
// luz: mais forte e mais longe que a tocha (as duas se somam)
const _torchU161f=torchUpd;torchUpd=function(dt,t){_torchU161f(dt,t);if(!PETO||P.pet!='fada'||!run||P.dead)return;const o=PETO;
  const base=.32+NIGHT*2.7+WX.k.rain*.4,k=base*(.92+FAD.lk*.12)*1.15,tc=SHU.uTC.value,hasT=tc.r+tc.g+tc.b>.01;
  SHU.uTP.value.set(o.x,o.y+.9,o.z);SHU.uTC.value.setRGB(.82*k+(hasT?tc.r*.45:0),.95*k+(hasT?tc.g*.45:0),1*k+(hasT?tc.b*.45:0));SHU.uTR.value=26};
