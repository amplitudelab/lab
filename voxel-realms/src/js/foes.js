'use strict';
/* =============================================================================
   VOXEL REALMS · inimigos (14.3)
   Classes de inimigo com comportamento próprio:
     Escudeiro (bloqueia golpes pela frente; finalização, golpe aéreo ou atacar
     pelas costas quebram a guarda) · Brutamontes (marreta em área com aviso no
     chão) · Xamã (cura aliados feridos) · Assassino (fica invisível ao se
     aproximar e o primeiro golpe dói mais) · Feiticeiro de gelo (círculo de
     gelo que congela) · Cultista (ergue esqueletos arqueiros).
   Variações: cores e tamanhos diferentes e Veteranos (+60% de vida).
   Ignarok, o Dragão de Brasa, refeito: modelo novo (pescoço em 3 partes, asas
   com dedos e membranas, cauda em 4 partes, garras) e combate em 3 fases com
   mordida, garra, cauda, pisão, sopro de fogo em cone, voo com rasantes de fogo,
   chuva de bolas de fogo, pouso com impacto, gêiseres de lava e meteoros.
   ============================================================================= */
// ---------- modelos novos (cores sorteadas a cada inimigo)
Object.assign(MDL,{
  bshield:()=>hum({skin:pick([0xd8a070,0xc08060,0xe8b890]),hair:pick([0x2a1a10,0x5a3a20]),shirt:pick([0x6a4a3a,0x5a3a3a,0x4a4a3a]),vest:0x6a6a70,pants:0x3a3028,hat:'helm',hatC:pick([0x7a7a80,0x6a6050]),belt:0x2a1a1a,shoulders:0x6a6a70,bulk:1.1}),
  bbrute:()=>hum({skin:pick([0xc89060,0xb07a50,0xd8a070]),hair:0x2a1a1a,beard:pick([0x2a1a1a,0x6a3a1a]),shirt:0x4a2a1a,vest:0x2a1a1a,pants:0x3a2a20,shoulders:0x5a5a5a,belt:0x1a1a1a,gloves:0x3a2a1a,bulk:1.5,scale:1.35}),
  bshaman:()=>hum({skin:0xc89070,shirt:0x3a5a2a,robe:0x2e4a22,hat:'hood',hatC:pick([0x2a3a1a,0x3a2a1a]),mask:0xe8e0cc,trim:0x9aff7a,belt:0x5a3a20,beard:0x6a6a5a}),
  bassassin:()=>hum({skin:0xd8a070,shirt:0x1a1a22,vest:0x2a2a34,pants:0x1a1a22,hat:'hood',hatC:0x101018,mask:0x101018,belt:0x5a1a1a,boots:0x101014,bulk:.9}),
  skelwar:()=>hum({skin:0xe6e1d3,shirt:0xcfc9b8,pants:0xd8d3c4,boots:0xcfc9b8,bones:0x8a8474,eyes:0x111111,mouth:0x222222,glowEyes:0x7dff6a,bulk:.85,hat:'helm',hatC:pick([0x6a6a60,0x7a5a3a]),plume:0x5a1a1a}),
  skelmage:()=>hum({skin:0xe6e1d3,shirt:0x2a3a5a,robe:0x22304a,pants:0xd8d3c4,bones:0x8a8474,eyes:0x111111,glowEyes:0x9ae4ff,hat:'hood',hatC:0x22304a,bulk:.8,trim:0x9ae4ff}),
  zbrute:()=>hum({skin:0x6a8a4a,shirt:0x4a4a5a,torn:0x6a8a4a,pants:0x2a2a3a,arm:0x6a8a4a,zombie:1,glowEyes:0xe8ff8a,bulk:1.6,scale:1.45}),
  cultist:()=>hum({skin:0xc8b0a0,shirt:0x2a0a2a,robe:0x3a0a3a,hat:'hood',hatC:0x2a0a2a,mask:0x1a0a1a,trim:0xc04aff,glowEyes:0xc04aff,cape:0x2a0a2a,capeE:0xc04aff}),
  wolf:()=>quad({c:0x77797f,mane:0x8a8c90,hc:0x6a6c72,ears:1,teeth:1,fur:1,len:1.5,h:.75,wid:.55,tl:.8,run:7}),
  dwolf:()=>quad({c:0x3a3048,mane:0x2a2236,hc:0x2e2640,ears:1,teeth:1,fur:1,eye:0xff3a2a,len:1.6,h:.8,wid:.58,tl:.9,run:7.5,back:0x6a3a9a}),
  ignarok:()=>dragon2({c:0xa82a22,c2:0xe0a030,c3:0x5a1410,wc:0x8a2434,hz:0xeadfc4,gl:0xffa030,scale:1.35})});
Object.assign(MT,{
  bshield:{n:'Bandido Escudeiro',m:'bshield',w:'sword',hp:70,dmg:9,sp:3.2,rg:1.9,cd:1.5,xp:20,ai:'melee',atk:'slashA',role:'shield'},
  bbrute:{n:'Brutamontes',m:'bbrute',w:'hammer',hp:120,dmg:17,sp:2.7,rg:2.4,cd:2.8,xp:28,ai:'melee',atk:'slam',role:'brute',r:.9},
  bshaman:{n:'Xamã Bandido',m:'bshaman',w:'staff',hp:40,dmg:7,sp:3.2,rg:11,cd:2.6,xp:22,ai:'ranged',proj:'orb',pc:0x9aff7a,atk:'cast',role:'healer'},
  bassassin:{n:'Assassino',m:'bassassin',w:'dagger',hp:38,dmg:12,sp:5.4,rg:1.7,cd:1.1,xp:22,ai:'melee',atk:'thrust',role:'assassin'},
  skelwar:{n:'Esqueleto Guerreiro',m:'skelwar',w:'sword',hp:60,dmg:11,sp:3.4,rg:1.9,cd:1.4,xp:22,ai:'melee',atk:'slashA',role:'shield'},
  skelmage:{n:'Esqueleto Feiticeiro',m:'skelmage',w:'staff',hp:36,dmg:10,sp:3,rg:12,cd:2.6,xp:22,ai:'ranged',proj:'orb',pc:0x9ae4ff,atk:'cast',role:'frost'},
  zbrute:{n:'Zumbi Gigante',m:'zbrute',hp:150,dmg:19,sp:1.9,rg:2.4,cd:2.6,xp:30,ai:'melee',atk:'slam',role:'brute',r:1},
  cultist:{n:'Cultista da Sombra',m:'cultist',w:'staff',hp:48,dmg:9,sp:3,rg:11,cd:2.8,xp:26,ai:'ranged',proj:'orb',pc:0xc04aff,atk:'cast',role:'summoner'}});
SPAWN.plan.push('bshield','bassassin','bbrute','bshaman');SPAWN.mata.push('skelwar','skelmage','cultist');SPAWN.mang.push('zbrute');SPAWN.cald.push('skelmage');
Object.assign(DG,{bassassin:.45,bshield:.05,bbrute:.03,zbrute:.02,skelmage:.3,bshaman:.3,cultist:.25,skelwar:.15});HR.bassassin=1;
// ---------- variações: tamanho, Veteranos e escudos
const _mkMob14=mkMob;mkMob=function(type,x,z,o){const e=_mkMob14(type,x,z,o);if(e.boss||e.t.passive)return e;
  e.m.g.scale.multiplyScalar(.92+R()*.16);
  if(!e.el&&!(o&&o.minion)&&R()<.16){e.vet=1;e.hp*=1.6;e.mx*=1.6;e.dmg*=1.2;e.m.g.scale.multiplyScalar(1.08);e.name+=/^[^ ]+a\b/.test(e.name)?' Veterana':' Veterano'}
  if(e.t.role=='shield'&&typeof shieldVis=='function'){shieldVis(e.m,{vk:e.type=='skelwar'?'buckler':'rshield',ilvl:e.type=='skelwar'?8:4,rar:0});e.m.meshes=[];e.m.g.traverse(q=>{if(q.isMesh){e.m.meshes.push(q);if(!q.userData.mat)q.userData.mat=q.material}})}
  return e};
// ---------- papéis no combate
const _hurt14=hurtMob;hurtMob=function(e,d,crit,src){
  if(e&&!e.dead&&e.boss&&e.air&&src=='golpe'){if(!e.ooT||performance.now()-e.ooT>1500){e.ooT=performance.now();pop('Fora de alcance',e.x,P.y+3.2,e.z,'#ffb070')}return}
  if(e&&!e.dead&&e.t.role=='shield'&&e.stun<=0&&(src=='golpe'||src=='proj')&&!(e.gbT>0)&&Math.abs(angDiff(e.f,Math.atan2(P.x-e.x,P.z-e.z)))<1.1){
    const heavy=P.heavyHit||P.act&&(P.act.k=='finisher'||P.act.k=='slam');const hx=e.x+S(e.f)*.8,hz=e.z+C(e.f)*.8,hy_=e.y+1.4*e.m.g.scale.y;
    if(heavy){e.stun=Math.max(e.stun,1.4);e.gbT=1.6;pop('Guarda quebrada!',e.x,e.y+2.8,e.z,'#ffb070',1);star(hx,hy_,hz,0xffd060,2.6,.2);fx(hx,hy_,hz,0xffd060,12,6,.08,.6,8);snd(300,.15,'square')}
    else{d*=.25;if(!e.blT||performance.now()-e.blT>600){e.blT=performance.now();pop('Bloqueou',e.x,e.y+2.6,e.z,'#c8d4e0')}fx(hx,hy_,hz,0xfff0c0,6,5,.07,.4,6);flash(hx,hy_,hz,0xffffff,1.3,.1);snd(1300,.05,'square')}}
  return _hurt14(e,d,crit,src)};
function healBeam(a,b){const n=8;for(let i=0;i<=n;i++){const k=i/n;setTimeout(()=>fx(lerp(a.x,b.x,k),lerp(a.y+2,b.y+1.4,k)+S(k*PI)*.8,lerp(a.z,b.z,k),0x7dff8a,2,.6,.12,.4,0),i*25)}column(b.x,b.z,0x7dff8a,4,.9,.5);fx(b.x,b.y+1,b.z,0x9affa8,10,3,.1,1.6,-1)}
function roleUpd(e,dt,d){const r=e.t.role;if(!r)return;e.gbT=Math.max(0,(e.gbT||0)-dt);
  if(r=='healer'){e.hT=(e.hT==null?2+R()*3:e.hT)-dt;if(e.hT<=0&&!e.act&&e.stun<=0){e.hT=6+R()*2;let b=null,bk=.78;for(const o of E){if(o.dead||o.t.passive||o.boss||o===e||hy(o.x-e.x,o.z-e.z)>14)continue;const k=o.hp/o.mx;if(k<bk){bk=k;b=o}}
      if(b){const h=b.mx*.22;b.hp=Math.min(b.mx,b.hp+h);healBeam(e,b);pop('+'+Math.round(h),b.x,b.y+2.6*b.m.g.scale.y,b.z,'#7dff8a');e.act={k:'castUp',t:0,dur:.8,hp:2};snd(660,.2,'sine')}}}
  else if(r=='assassin'){if(e.st=='chase'&&d>5.5&&!e.act&&e.stun<=0){if(!e.hid){e.hid=1;puff(e.x,e.y+1,e.z,0x2a2a3a,1.6)}e.m.g.visible=false;if(e.ring)e.ring.visible=false;if(ev(10))fx(e.x,e.y+1,e.z,0x6a6a8a,1,.6,.08,.5,-1)}
    else if(e.hid){e.hid=0;e.amb=1;puff(e.x,e.y+1,e.z,0x2a2a3a,1.8);fx(e.x,e.y+1.2,e.z,0xb07aff,8,3,.1,1,0);pop('!',e.x,e.y+2.8,e.z,'#c79bff',1)}}
  else if(r=='summoner'){e.sT=(e.sT==null?3+R()*3:e.sT)-dt;if(e.sT<=0&&!e.act&&e.stun<=0){e.sT=12+R()*4;e.sums=(e.sums||[]).filter(o=>!o.dead);if(e.sums.length<3&&aliveN()<MAXE){e.act={k:'summon',t:0,dur:.9,hp:2};
      for(let i=0;i<2;i++){const a=R()*TAU,x=e.x+C(a)*2.5,z=e.z+S(a)*2.5;if(!walkable(x,z))continue;const m=mkMob('skel',x,z,{lv:e.lv,ch:e.ch,minion:1});m.st='chase';e.sums.push(m);column(x,z,0xc04aff,4,.8,.5);fx(x,groundAt(x,z)+.3,z,0xc04aff,12,3,.14,1.6,-1)}sweep(300,90,.5,'sawtooth',.04)}}}
  else if(r=='frost'){e.fT=(e.fT==null?4+R()*3:e.fT)-dt;if(e.fT<=0&&d<14&&!e.act&&e.stun<=0){e.fT=7+R()*3;e.act={k:'castUp',t:0,dur:.8,hp:2};
      tele(P.x,P.z,2.6,1.3,T=>{fx(T.x,groundAt(T.x,T.z)+.5,T.z,0xbfe8ff,22,6,.16,1.2,8);ring(T.x,T.z,2.8,0x9ae4ff,.4);if(hy(P.x-T.x,P.z-T.z)<2.7&&!P.dead){hitPlayer(e.dmg*.9,{src:e});P.slow=Math.max(P.slow,2.5);pop('Congelado!',P.x,P.y+3,P.z,'#9ae4ff')}},0x9ae4ff)}}
  else if(r=='brute'&&e.act&&e.act.k=='slam'&&!e.act.tl){e.act.tl=1;const x=e.x+S(e.f)*2.2,z=e.z+C(e.f)*2.2;e.act.tx=x;e.act.tz=z;tele(x,z,2.8,e.act.dur*e.act.hp,null,0xff7a3a)}}
const _affix14=affixUpd;affixUpd=function(e,dt,d){_affix14(e,dt,d);roleUpd(e,dt,d)};
const _strike14=mobStrike;mobStrike=function(e,d){const r=e.t.role;
  if(r=='brute'&&e.act.k=='slam'&&e.act.tx!=null){const x=e.act.tx,z=e.act.tz;ring(x,z,3,0xffa050,.4);fx(x,groundAt(x,z)+.3,z,0xb8a888,16,7,.22,1,9);for(let i=0;i<3;i++)puff(x+(R()-.5)*2,groundAt(x,z)+.4,z+(R()-.5)*2,0xd8c8a8,2);SHK=Math.max(SHK,.35);snd(70,.3,'sawtooth');
    if(e.tgm&&MIN.includes(e.tgm)&&hy(e.tgm.x-x,e.tgm.z-z)<3)minionHurt(e.tgm,e.dmg);if(hy(P.x-x,P.z-z)<2.9&&!P.air)hitPlayer(e.dmg,{src:e,kb:4});return}
  if(e.amb){e.amb=0;const d0=e.dmg;e.dmg*=1.7;_strike14(e,d);e.dmg=d0;return}
  return _strike14(e,d)};
// acampamentos e cemitério com as novas classes
{const _st=spawnTable;spawnTable=function(x,z){const r=_st(x,z);for(const p of POI)if(hy(x-p.x,z-p.z)<p.r+16){if(p.n.startsWith('Cemit'))r.tbl=['zombie','zombie','ghoul','skel','skelwar','zbrute','cultist'];if(p.n.startsWith('Acamp'))r.tbl=['bandit','bandarc','bshield','bbrute','bshaman','bassassin']}return r}}

// =============================================================================
// Ignarok — modelo
function dragon2(o){const m={kind:'drg2',g:new THREE.Group(),o},c=o.c,c2=o.c2,c3=o.c3||shade(o.c,.62),hz=o.hz||0xeadfc4,gl=o.gl||0xffa030,wc=o.wc;
  const GM=new THREE.MeshBasicMaterial({vertexColors:true}),glow=(par,fn)=>{const k=new Bake();fn(k);const ms=k.mesh(GM);if(ms)par.add(ms)};
  m.body=part(m.g,0,3.3,0,k=>{k.box(3.3,2.5,3.2,0,.05,1.2,c).box(3.6,1,1.6,0,.95,1.5,shade(c,1.08)).box(3,2.3,3.4,0,-.05,-1.7,c).box(2.5,.8,5.8,0,-1.2,-.2,c2);
    for(let i=0;i<6;i++)k.box(2.6,.16,.5,0,-1.62,2.2-i*.9,shade(c2,1.12));for(let i=0;i<8;i++)k.box(.3,.75-Math.abs(i-3.5)*.07,.6,0,1.55,2.7-i*.78,c3,{rx:-.35});
    for(const s of[-1,1])for(let i=0;i<4;i++)k.box(.12,.5,.7,s*1.66,.2-i*.05,1.8-i*1.1,shade(c,.86))});
  glow(m.body,k=>{for(const s of[-1,1])for(let i=0;i<4;i++)k.box(.06,.12,.9,s*1.69,-.3+(i%2)*.4,1.4-i*1.15,gl);k.box(1.6,.06,3.6,0,-1.67,.3,shade(gl,.8))});
  m.n1=part(m.body,0,.55,2.75,k=>{k.box(1.75,1.6,1.8,0,.3,.75,c).box(1.3,.5,1.6,0,-.45,.75,c2).box(.28,.6,.5,0,1.25,.6,c3,{rx:-.35})});
  m.n2=part(m.n1,0,.45,1.55,k=>{k.box(1.5,1.4,1.7,0,.25,.75,c).box(1.1,.45,1.5,0,-.4,.75,c2).box(.26,.55,.45,0,1.1,.6,c3,{rx:-.35})});
  m.n3=part(m.n2,0,.4,1.45,k=>{k.box(1.3,1.2,1.5,0,.2,.65,c).box(.95,.4,1.3,0,-.35,.65,c2).box(.24,.5,.4,0,.95,.5,c3,{rx:-.35})});
  m.head=part(m.n3,0,.25,1.35,k=>{k.box(1.95,1.3,1.8,0,.2,.5,c).box(1.5,.9,1.7,0,0,2,c).box(1.6,.26,1.5,0,.55,1.9,shade(c,1.12)).box(2.1,.34,.6,0,.85,.65,c3);
    for(const s of[-1,1]){k.box(.3,.2,.2,s*.45,.35,2.86,0x1a0a08).box(.36,.36,1.4,s*.72,1.05,-.55,hz,{rx:.55,ry:s*.25}).box(.28,.28,1.1,s*.8,1.5,-1.5,hz,{rx:.95,ry:s*.3}).box(.2,.2,.7,s*.84,2.05,-2.1,shade(hz,1.12),{rx:1.35});
      k.box(.12,.6,.55,s*1.05,.1,.2,c3,{rz:s*.5}).box(.1,.45,.4,s*1.1,-.25,.5,c3,{rz:s*.7});for(let i=0;i<4;i++)k.box(.1,.24,.1,s*(.22+i*.14),-.5,2.65-i*.32,0xf4ecd8)}});
  glow(m.head,k=>{for(const s of[-1,1])k.box(.32,.2,.08,s*.72,.5,1.42,0xffe060);k.box(.5,.08,.1,0,.28,2.92,gl)});
  m.jaw=part(m.head,0,-.5,.55,k=>{k.box(1.35,.38,2.4,0,-.1,1.2,c2).box(1.2,.16,2.2,0,.12,1.25,0x5a0a0a);for(const s of[-1,1])for(let i=0;i<4;i++)k.box(.09,.2,.09,s*(.2+i*.12),.22,2.25-i*.32,0xf4ecd8)});
  m.wg=[];for(const s of[-1,1]){const w=part(m.body,s*1.55,1.25,1.4,k=>{k.box(3.2,.32,.4,s*1.6,0,0,c).box(3.1,.1,2.6,s*1.6,0,-1.4,wc)});
    const w2=part(w,s*3.2,0,0,k=>{k.box(3,.28,.34,s*1.5,0,0,c).box(.34,.34,.34,s*3,0,0,hz);for(let i=0;i<3;i++)k.box(.16,.16,3.6-i*.5,s*(1.2+i*.6),0,-1.7+i*.2,c3,{ry:s*(-.5-i*.42)});k.box(2.8,.08,3,s*1.5,0,-1.6,wc).box(2.2,.08,1.6,s*2.6,0,-3,shade(wc,.9))});m.wg.push([w,w2,s])}
  let par=m.body,z0=-3.35;m.tl=[];[[1.8,1.6,2.4],[1.4,1.25,2.3],[1.05,.95,2.2],[.75,.7,2.1]].forEach(([w,h,l],i)=>{const sg=part(par,0,i?0:-.15,z0,k=>{k.box(w,h,l,0,0,-l/2,c).box(w*.75,h*.3,l*.9,0,-h*.38,-l/2,c2).box(.24,.5-i*.08,.45,0,h*.6,-l/2,c3,{rx:-.35});if(i==3)k.box(1.6,.16,1.1,0,0,-l-.4,c3,{ry:.785}).box(.9,.14,.9,0,0,-l-.1,shade(c3,1.15))});m.tl.push(sg);par=sg;z0=-l});
  m.lg=[];for(const[sx,sz]of[[-1,1],[1,1],[-1,-1],[1,-1]]){const th=part(m.body,sx*1.55,-.55,sz*1.75,k=>{k.box(1.15,1.9,1.4,0,-.75,0,c).box(1.2,.9,1.45,0,.05,0,shade(c,1.06))});
    const sh=part(th,0,-1.6,0,k=>k.box(.85,1.5,.95,0,-.6,.12,c));const ft=part(sh,0,-1.3,.15,k=>{k.box(1.05,.42,1.4,0,-.05,.35,c3);for(const q of[-.32,0,.32])k.box(.18,.18,.5,q,-.12,1.15,hz,{rx:.3})});m.lg.push([th,sh,ft,sx,sz])}
  m.g.scale.setScalar(o.scale||1);finish(m);m.gm=SKM.get(GM)||GM;return m}
function animDragon2(m,dt,t,s){const A=m.A,fly=!!s.fly,v=s.v||0,a=s.atk,p=a?a.p:0,k=a?a.k:'';sm(A,'fl',fly?1:0,dt,3);sm(A,'w',cl(v/4,0,1.2),dt,6);const F=A.fl,W=A.w*(1-F);A.ph+=dt*(1.6+v*.9)*(W>.04?1:0);
  // asas: dobradas no chão, batendo no ar, abertas no rugido
  const fp=S(t*(fly?4.2:1.3));let L=lerp(.75+fp*.03,fp*.85,F),SW=lerp(1,.05,F),FL=lerp(1.9,0,F),TP=lerp(-.25,fp*.45,F);if(k=='roar'||k=='takeoff'){const u=sstep(0,.3,p)*(1-sstep(.8,1,p));L=lerp(L,.45,u);SW=lerp(SW,.15,u);FL=lerp(FL,.25,u)}
  for(const[w,w2,sd]of m.wg){sm(w.rotation,'z',sd*L,dt,10);sm(w.rotation,'y',sd*SW,dt,8);sm(w2.rotation,'y',sd*FL,dt,8);sm(w2.rotation,'z',sd*TP,dt,10)}
  // pescoço em S, cabeça e mandíbula
  let n1=-.32+S(t*1.1)*.04,n2=-.1,n3=.3,hx=.2,jw=.06,by=0,bx=0;
  if(k=='bite'){const u=seq(p,0,-.35,.5,.4,.55);n1+=u;n3+=u*.4;hx+=u*.3;jw=seq(p,0,.9,0,.4,.55)}
  else if(k=='breath'){const w=p<.25;n1=w?-.75:-.08;n2=w?-.1:0;n3=w?.3:.15;hx=w?-.1:.05;jw=w?.3:.75+S(t*30)*.05}
  else if(k=='roar'||k=='phase'||k=='takeoff'){const u=sstep(0,.25,p);n1=lerp(n1,-.85,u);hx=lerp(hx,-.35,u);jw=.9*u}
  else if(k=='claw'){bx=seq(p,0,-.12,.08,.4,.55);n1-=.1}else if(k=='stomp'){bx=seq(p,0,-.38,.12,.45,.6)}else if(k=='tail'){by=seq(p,0,-.35,.45,.4,.6)}
  if(fly){n1=lerp(n1,-.1,F*.7);n2=lerp(n2,0,F);n3=lerp(n3,.18,F);hx=lerp(hx,.1,F)}if(s.hurt>0)n1-=.2*s.hurt;
  sm(m.n1.rotation,'x',n1,dt,9);sm(m.n2.rotation,'x',n2,dt,9);sm(m.n3.rotation,'x',n3,dt,9);sm(m.head.rotation,'x',hx,dt,10);sm(m.jaw.rotation,'x',jw,dt,16);
  sm(m.n1.rotation,'y',S(t*.7)*.12,dt,4);sm(m.body.rotation,'x',bx+(fly?.06:0),dt,8);sm(m.body.rotation,'y',by,dt,8);
  // cauda ondulando (golpe de cauda varre forte)
  m.tl.forEach((sg,i)=>{let y=S(t*1.3-i*.7)*(.14+i*.04)*(fly?.6:1);if(k=='tail')y+=seq(p,0,-.7,.8,.4,.6)*(1+i*.2);sm(sg.rotation,'y',y,dt,10);sm(sg.rotation,'x',(fly?.08:-.06)+S(t*1.1-i*.5)*.04,dt,6)});
  // pernas: passada, patada, recolhidas no voo
  m.lg.forEach(([th,sh,ft,sx,sz],i)=>{const q=A.ph+(i==0||i==3?0:PI);let a1=S(q)*.5*W,a2=Math.max(0,-C(q))*.6*W,a3=-a1*.4;
    if(k=='claw'&&sz>0&&sx>0){a1=seq(p,0,-1.4,.7,.4,.55);a2=seq(p,0,1,.1,.4,.55)}if(k=='stomp'&&sz>0){a1=seq(p,0,-.9,.2,.45,.6);a2=seq(p,0,.9,0,.45,.6)}
    a1=lerp(a1,.75,F);a2=lerp(a2,1,F);a3=lerp(a3,.6,F);sm(th.rotation,'x',a1,dt,10);sm(sh.rotation,'x',a2,dt,10);sm(ft.rotation,'x',a3,dt,10)});
  m.body.position.y=3.3+S(t*1.6)*.05+(fly?S(t*4.2)*.25:0)+Math.abs(S(A.ph))*.08*W;
  if(m.gm){const g=.8+.15*S(t*3)+(k=='breath'&&p>.25?.5:0)+(s.ph>1?.25:0);m.gm.color.setRGB(g,g,g)}}
const _animate14=animate;animate=function(m,dt,t,s){if(m.kind=='drg2')return animDragon2(m,dt,t,s);return _animate14(m,dt,t,s)};

// =============================================================================
// Ignarok — combate
const CONE=(()=>{const g=new THREE.Group(),m=new THREE.Mesh(new THREE.CircleGeometry(1,24,-.5,1),new THREE.MeshBasicMaterial({color:0xff4a1a,transparent:true,opacity:.3,depthWrite:false,side:2}));m.rotation.x=-PI/2;g.add(m);g.visible=false;sc.add(g);g.userData.m=m;return g})();
const LINE=(()=>{const m=new THREE.Mesh(new THREE.PlaneGeometry(1,1),new THREE.MeshBasicMaterial({color:0xff4a1a,transparent:true,opacity:.3,depthWrite:false,side:2}));m.rotation.order='YXZ';m.visible=false;sc.add(m);return m})();
function dSay(t,c){pop(t,P.x,P.y+3.6,P.z,c||'#ffb070',1)}
function dHit(e,mul,o){if(P.dead)return;hitPlayer(e.dmg*mul,Object.assign({src:e},o||{}))}
function dragonReset(e){e.act=null;e.air=0;e.yo=0;e.dph=1;e.q=[];CONE.visible=false;LINE.visible=false;e.ph=0;$('boss').classList.remove('p2');bossOff(e);e.st='idle';e.hp=e.mx;e.x=e.home[0];e.z=e.home[1];e.y=groundAt(e.x,e.z)}
function dStart(e,k,o){e.act=Object.assign({k,t:0},o||{});const a=e.act;
  if(k=='roar'){a.dur=1.6;snd(70,1.2,'sawtooth');sweep(200,60,1,'sawtooth',.06)}
  else if(k=='bite'){a.dur=1}else if(k=='claw'){a.dur=1.1;sweep(900,200,.2,'sawtooth',.03)}
  else if(k=='tail'){a.dur=1.4;const bx=e.x-S(e.f)*6,bz=e.z-C(e.f)*6;tele(bx,bz,5,.75,null,0xff7a3a)}
  else if(k=='stomp'){a.dur=1.25;tele(e.x,e.z,7.5,.72,null,0xffa040)}
  else if(k=='breath'){a.dur=e.dph==3?3.2:2.6;a.sw=e.dph==3?(R()<.5?1:-1):0;CONE.visible=true;sweep(300,80,2,'sawtooth',.05)}
  else if(k=='geysers'){a.dur=1.4;for(let i=0;i<(e.dph==3?6:4);i++){const an=i*1.7+R(),r=i?2+R()*5:0,x=P.x+C(an)*r,z=P.z+S(an)*r;tele(x,z,2.3,1.3+i*.12,T=>{column(T.x,T.z,0xff6a1a,7,1.1,.6);boom(T.x,groundAt(T.x,T.z),T.z,1.1);if(hy(P.x-T.x,P.z-T.z)<2.4&&!P.air)dHit(e,.75,{brn:1})},0xff5a1a)}}
  else if(k=='takeoff'){a.dur=1.5;dSay('Ignarok alça voo!');for(let i=0;i<6;i++)puff(e.x+C(i)*4,e.y+.5,e.z+S(i)*4,0xb8a888,3);ring(e.x,e.z,9,0xd8c8a8,.6)}
  else if(k=='strafe'){a.dur=3.3;const an=R()*TAU;a.dx=S(an);a.dz=C(an);a.sx=P.x-a.dx*22;a.sz=P.z-a.dz*22;a.ex=P.x+a.dx*22;a.ez=P.z+a.dz*22;a.x0=e.x;a.z0=e.z}
  else if(k=='barrage'){a.dur=2.4;dSay('Chuva de fogo!');for(let i=0;i<(e.dph==3?8:6);i++){const an=R()*TAU,r=i?1.5+R()*6:0,x=P.x+C(an)*r,z=P.z+S(an)*r;setTimeout(()=>{if(BOSSON!==e)return;tele(x,z,2.2,1.1,T=>{boom(T.x,groundAt(T.x,T.z),T.z,1);if(hy(P.x-T.x,P.z-T.z)<2.3)dHit(e,.6,{brn:1})},0xff6a1a);meteor(x,z,1.1,.8)},i*180)}}
  else if(k=='land'){a.dur=1.6;const an=R()*TAU;a.tx=P.x+C(an)*3;a.tz=P.z+S(an)*3;if(!walkable(a.tx,a.tz)){a.tx=e.home[0];a.tz=e.home[1]}a.x0=e.x;a.z0=e.z;tele(a.tx,a.tz,5.5,1.4,null,0xff7a3a)}
  else if(k=='meteors'){a.dur=1.2;dSay('Meteoros!','#ff6a3a');for(let i=0;i<9;i++){const an=R()*TAU,r=Math.sqrt(R())*18,x=e.home[0]+C(an)*r,z=e.home[1]+S(an)*r;setTimeout(()=>{if(BOSSON!==e)return;meteor(x,z,1.2,1.1);tele(x,z,2.6,1.2,T=>{boom(T.x,groundAt(T.x,T.z),T.z,1.3);if(hy(P.x-T.x,P.z-T.z)<2.7)dHit(e,.7,{brn:1})},0xff4a1a)},i*220)}}}
function dAct(e,dt,d,dx,dz){const a=e.act,p=a.t/a.dur,k=a.k,fa=Math.abs(angDiff(e.f,Math.atan2(dx,dz)));let mv=null;
  if(k=='roar'){if(!a.hit&&p>.3){a.hit=1;ring(e.x,e.z,9,0xffa040,.6);ring(e.x,e.z,5,0xffffff,.35);SHK=Math.max(SHK,.7);if(d<9){dHit(e,.25,{kb:7})}}}
  else if(k=='bite'){if(p<.4)e.f=angStep(e.f,Math.atan2(dx,dz),dt*3);if(!a.hit&&p>.5){a.hit=1;const hx=e.x+S(e.f)*6.5,hz=e.z+C(e.f)*6.5;fx(hx,e.y+2,hz,0xffffff,6,4,.14,.6,8);SHK=Math.max(SHK,.3);if(d<8&&fa<.75)dHit(e,1,{kb:3})}}
  else if(k=='claw'){if(!a.hit&&p>.55){a.hit=1;const hx=e.x+S(e.f)*4.5,hz=e.z+C(e.f)*4.5;ring(hx,hz,3.4,0xffc080,.3);fx(hx,e.y+1.4,hz,0xffd8a0,8,6,.12,.6,8);if(d<7.5&&fa<1.5)dHit(e,.85,{kb:4})}}
  else if(k=='tail'){if(!a.hit&&p>.55){a.hit=1;const bx=e.x-S(e.f)*6,bz=e.z-C(e.f)*6;ring(bx,bz,5,0xffa050,.4);fx(bx,groundAt(bx,bz)+.4,bz,0xb8a888,14,7,.2,.8,8);SHK=Math.max(SHK,.35);if(hy(P.x-bx,P.z-bz)<5.2&&!P.air)dHit(e,.95,{kb:6})}}
  else if(k=='stomp'){if(!a.hit&&p>.58){a.hit=1;ring(e.x,e.z,7.5,0xffa040,.5);ring(e.x,e.z,4,0xffffff,.3);fx(e.x,e.y+.3,e.z,0xb8a888,24,10,.25,1,10);for(let i=0;i<6;i++)puff(e.x+C(i)*5,e.y+.4,e.z+S(i)*5,0xd8c8a8,2.6);SHK=Math.max(SHK,.6);if(d<7.8&&!P.air)dHit(e,.9,{kb:6})}}
  else if(k=='breath'){if(p<.25){e.f=angStep(e.f,Math.atan2(dx,dz),dt*2.5)}else{e.f=a.sw?e.f+a.sw*dt*1.1:angStep(e.f,Math.atan2(dx,dz),dt*.8);
      const R0=15;for(let i=0;i<4;i++){const r=3+R()*R0,an=e.f+(R()-.5)*.8*(r/R0);fx(e.x+S(an)*r,e.y+1.6+R()*1.2,e.z+C(an)*r,R()<.4?0xffd860:R()<.6?0xff7a1a:0xff4a1a,1,2.5,.3+R()*.2,.4,-1.4)}
      if(ev(3))puff(e.x+S(e.f)*(6+R()*8),e.y+2,e.z+C(e.f)*(6+R()*8),0x3a2a22,2.2);a.tk=(a.tk||0)-dt;if(a.tk<=0){a.tk=.22;if(d<15.5&&fa<.42)dHit(e,.32,{brn:1})}}
    CONE.position.set(e.x,groundAt(e.x,e.z)+.15,e.z);CONE.rotation.y=e.f-PI/2;CONE.scale.setScalar(15.5);CONE.userData.m.material.opacity=p<.25?.18+.15*S(a.t*20):.12;if(p>.97)CONE.visible=false}
  else if(k=='geysers'){}
  else if(k=='takeoff'){e.yo=sstep(.25,1,p)*11;if(p>.98){e.air=1;e.q=e.dph==3?['strafe','barrage','strafe','strafe','land']:e.dph==2?['strafe','barrage','strafe','land']:['strafe','barrage','land']}}
  else if(k=='strafe'){const ph0=.25,ph1=.5;if(p<ph0){const u=p/ph0;e.x=lerp(a.x0,a.sx,u);e.z=lerp(a.z0,a.sz,u);e.f=Math.atan2(a.ex-a.sx,a.ez-a.sz)}
    else if(p<ph1){if(!a.tl){a.tl=1;LINE.visible=true;LINE.position.set((a.sx+a.ex)/2,groundAt(P.x,P.z)+.2,(a.sz+a.ez)/2);LINE.rotation.set(-PI/2,0,0);LINE.rotation.y=Math.atan2(a.dx,a.dz);LINE.scale.set(5,44,1)}LINE.material.opacity=.16+.14*S(a.t*20)}
    else{LINE.visible=false;const u=(p-ph1)/(1-ph1);e.x=lerp(a.sx,a.ex,u);e.z=lerp(a.sz,a.ez,u);e.yo=lerp(e.yo,7,dt*3);const gy=groundAt(e.x,e.z);
      for(let i=0;i<3;i++)fx(e.x+(R()-.5)*2.5,gy+.4+R()*3,e.z+(R()-.5)*2.5,R()<.5?0xff7a1a:0xffd060,1,2,.35,.6,-1);if(ev(4)&&typeof decal=='function')decal(e.x,e.z,1.6,0x2a1a10,6,.5);
      if(!a.hd&&hy(P.x-e.x,P.z-e.z)<2.8){a.hd=1;dHit(e,.7,{brn:1})}}}
  else if(k=='land'){const u=sstep(0,1,p/.85);e.x=lerp(a.x0,a.tx,u);e.z=lerp(a.z0,a.tz,u);e.yo=lerp(8,0,u);e.f=angStep(e.f,Math.atan2(dx,dz),dt*3);
    if(!a.hit&&p>.85){a.hit=1;e.air=0;e.yo=0;e.y=groundAt(e.x,e.z);boom(e.x,e.y,e.z,2.4,0xffa040);ring(e.x,e.z,6,0xffd060,.6);SHK=Math.max(SHK,.9);HITSTOP=Math.max(HITSTOP,.06);if(hy(P.x-e.x,P.z-e.z)<5.6&&!P.air)dHit(e,1.1,{kb:7})}}
  return mv}
function dragonUpd(e,dt,t,d,dx,dz){const T=e.t,hd=hy(P.x-e.home[0],P.z-e.home[1]);e.yo=e.yo||0;
  if(!BOSSON&&hd<28&&!P.dead){BOSSON=e;e.st='chase';e.dph=1;e.q=[];e.cds={};$('boss').classList.add('on');$('bn_').textContent=T.n;banner(T.n);SHK=.6;qEvent('bossSeen',e.type);dStart(e,'roar')}
  if(BOSSON===e&&(hd>48||P.dead)){dragonReset(e)}
  let v=0;
  if(BOSSON===e){const k=e.hp/e.mx;if(e.dph==1&&k<=.6){e.dph=2;e.ph=2;$('boss').classList.add('p2');if(!e.air){dStart(e,'roar');dSay('Ignarok se enfurece!','#ff6a3a')}}else if(e.dph==2&&k<=.25){e.dph=3;e.sp*=1.2;if(!e.air){dStart(e,'roar');dSay('Fúria final de Ignarok!','#ff4a2a')}}
    const spd=e.dph==3?1.3:e.dph==2?1.12:1;for(const q in e.cds)e.cds[q]-=dt*spd;const cd=q=>(e.cds[q]||0)<=0,set=(q,s)=>e.cds[q]=s+R()*2;
    if(e.stun>0&&!e.air)e.stun=Math.min(e.stun,.4);
    if(e.act){e.act.t+=dt*spd;dAct(e,dt,d,dx,dz);if(e.act&&e.act.t>=e.act.dur){const was=e.act.k;e.act=null;if(was=='breath')CONE.visible=false;if(e.air&&e.q.length)dStart(e,e.q.shift());else if(e.air&&!e.q.length)dStart(e,'land')}}
    else if(e.air){dStart(e,e.q.length?e.q.shift():'land')}
    else{const fa=Math.abs(angDiff(e.f,Math.atan2(dx,dz)));
      if(cd('fly')&&(e.cds.fly!=null||k<.85)&&d<30){set('fly',e.dph==3?18:24);dStart(e,'takeoff')}
      else if(e.dph>=2&&cd('geysers')&&d<20){set('geysers',e.dph==3?7:10);dStart(e,'geysers')}
      else if(e.dph==3&&cd('meteors')){set('meteors',14);dStart(e,'meteors')}
      else if(fa>2.1&&d<10&&cd('tail')){set('tail',4.5);dStart(e,'tail')}
      else if(d<6.5&&cd('stomp')){set('stomp',8);dStart(e,'stomp')}
      else if(d>5&&d<15&&fa<.6&&cd('breath')){set('breath',e.dph==3?6:8);dStart(e,'breath')}
      else if(d<8&&fa<.75&&cd('bite')){set('bite',2.2);dStart(e,'bite')}
      else if(d<7.5&&fa<1.5&&cd('claw')){set('claw',3.4);dStart(e,'claw')}
      else{e.f=angStep(e.f,Math.atan2(dx,dz),dt*2.2);if(d>7.5){v=moveEnt(e,dx/d*e.sp*spd,dz/d*e.sp*spd,dt,4,0,e.r)}}}
    $('bf').style.width=Math.max(0,e.hp/e.mx*100)+'%';$('bph').textContent=e.dph==3?'FASE III':e.dph==2?'FASE II':''}
  else{const dd=hy(e.home[0]-e.x,e.home[1]-e.z);if(dd>1){v=moveEnt(e,(e.home[0]-e.x)/dd*2,(e.home[1]-e.z)/dd*2,dt,4,4,e.r)}}
  if(!e.air&&!(e.act&&(e.act.k=='land'||e.act.k=='takeoff')))e.y=groundAt(e.x,e.z);
  e.m.g.position.set(e.x,e.y+e.yo,e.z);e.m.g.rotation.y=e.f;const a=e.act;
  animate(e.m,dt,t,{v,fly:e.air||a&&(a.k=='takeoff'&&a.t/a.dur>.25||a.k=='land'&&a.t/a.dur<.85),atk:a&&{k:a.k=='phase'?'roar':a.k,p:Math.min(1,a.t/a.dur)},hurt:e.hurt,ph:e.dph})}
const _bossUpd14=bossUpd;bossUpd=function(e,dt,t,d,dx,dz){if(e.type=='ignarok')return dragonUpd(e,dt,t,d,dx,dz);return _bossUpd14(e,dt,t,d,dx,dz)};
// os avisos de cone/linha nunca ficam no chão quando o dragão para, troca de golpe ou morre
const _fxUpd14=fxUpd;fxUpd=function(dt,rdt,t){_fxUpd14(dt,rdt,t);if(CONE.visible||LINE.visible){const b=BOSSON,k=b&&!b.dead&&b.type=='ignarok'&&b.act&&b.act.k;if(k!='breath')CONE.visible=false;if(k!='strafe')LINE.visible=false}};
