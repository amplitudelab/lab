'use strict';
/* =============================================================================
   VOXEL REALMS · efeitos no estilo Diablo e economia
   Pedaços voando quando um monstro morre, manchas no chão, crítico com estrela,
   subida de nível com coluna de luz, e a vitória contra chefes: câmera lenta,
   chuva de ouro, saque garantido e subida de nível garantida.
   ============================================================================= */
// manchas no chão (sangue, queimado, gelo) — pool, somem devagar
const DCL=[],DCG=new THREE.CircleGeometry(1,10);
function decal(x,z,r,c,t,op){let d=DCL.find(o=>!o.visible);if(!d){if(DCL.length>=(MOB?14:24))d=DCL.reduce((a,b)=>a.userData.t<b.userData.t?a:b);else{d=new THREE.Mesh(DCG,new THREE.MeshBasicMaterial({transparent:true,depthWrite:false}));d.rotation.x=-PI/2;d.renderOrder=1;sc.add(d);DCL.push(d)}}
  d.material.color.setHex(c);d.userData.t=t||8;d.userData.mx=d.userData.t;d.userData.op=op||.55;d.position.set(x,groundAt(x,z)+.07,z);d.scale.setScalar(r);d.rotation.z=R()*6;d.visible=true}
function decalUpd(dt){for(const d of DCL){if(!d.visible)continue;d.userData.t-=dt;const k=d.userData.t/d.userData.mx;d.material.opacity=d.userData.op*Math.min(1,k*3);if(d.userData.t<=0)d.visible=false}}
// cor do "sangue"/pedaços de cada tipo de criatura
const GORE={skel:0xe8e0c8,zombie:0x5a7a3a,ghoul:0x5a7a3a,golem:0x8a8a84,slime:0x7dff6a,lslime:0xff7a1a,bee:0xffd84a,fairy:0xd8a0ff,imp:0xff5a2a,spider:0x3a2a4a};
function deathFx(e){if(e.t.passive){decal(e.x,e.z,.8,0x6a1a14,10,.45);return}
  const c=GORE[e.type]||0x8a1a14,h=e.m.g.scale.y||1;fx(e.x,e.y+1.1*h,e.z,c,MOB?8:14,7,.26,1.6,16);fx(e.x,e.y+1*h,e.z,shade(c,1.5),MOB?4:8,5,.14,2,12);
  decal(e.x,e.z,(e.boss?3.5:1.2)*(.8+R()*.4),c==0x8a1a14?0x5a0e0a:shade(c,.6),e.boss?20:10,.5);if(e.el){ring(e.x,e.z,3,e.el==2?0xffe14a:0x6a9cff,.5);column(e.x,e.z,e.el==2?0xffe14a:0x6a9cff,5,.7,.5)}}
function critFx(e){const y=e.y+1.4*(e.m.g.scale.y||1);flash(e.x,y,e.z,0xffffff,2.6,.18);fx(e.x,y,e.z,0xffe08a,MOB?6:10,9,.08,.5,0);ring(e.x,e.z,1.4,0xffd060,.25)}
function levelFx(){column(P.x,P.z,0xffe27a,18,2.2,1.4);ring(P.x,P.z,7,0xffe27a,1);setTimeout(()=>ring(P.x,P.z,4,0xffffff,.7),200);swirl(()=>({x:P.x,y:P.y,z:P.z}),1.6,0xffe27a,1.6,3,4,9);
  [523,659,784,1047].forEach((f,i)=>setTimeout(()=>snd(f,.35,'triangle'),i*110))}
// vitória contra chefe: câmera lenta, chuva de ouro, saque e subida de nível garantidos
const BOSSGOLD=b=>Math.round(60+b.lv*35);
function bossVictory(e){const first=!BEST[e.type];HITSTOP=.9;SHK=1.2;flash(e.x,e.y+3,e.z,0xffe8a0,14,.9);column(e.x,e.z,0xffd060,24,3,1.6);ring(e.x,e.z,12,0xffd060,1.2);ring(e.x,e.z,7,0xffffff,.8);
  fx(e.x,e.y+2,e.z,0xffd34a,MOB?30:60,12,.22,2.4,10);for(let i=0;i<10;i++)setTimeout(()=>dropGold(e.x+(R()-.5)*5,e.z+(R()-.5)*5,Math.round(BOSSGOLD(e)/10)),200+i*70);
  if(first)setTimeout(()=>{dropItem(e.x,e.z,genItem(e.lv+1,3,null,true));toast('🏆','Primeira vitória!','Um item lendário caiu.')},700);
  [262,330,392,523,659].forEach((f,i)=>setTimeout(()=>{snd(f,.6,'sawtooth');snd(f*1.5,.6,'triangle')},300+i*140));
  setTimeout(()=>{if(P.lv<40){const need=XPN(P.lv)-P.xp;gainXP(Math.max(need+1,1))}},1300)}
