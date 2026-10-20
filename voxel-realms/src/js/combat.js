'use strict';
/* =============================================================================
   VOXEL REALMS · combate
   habilidades do jogador, fúria, dano/crítico/armadura, saque no chão, orbes de
   vida, massacre, santuários, baús, morte e mecânicas dos chefes
   ============================================================================= */
let ST={};const BDEF={};let MASS={n:0,t:0,xp:0},METEOR=0;
const bow=()=>ST.wk=='bow'||ST.wk=='xbow',spear=()=>ST.wk=='spear';

function calcStats(){const s={dmin:2,dmax:4,dmg:0,hp:0,arm:0,crit:5,critd:50,ias:0,ms:0,regen:0,gold:0,cdr:0,fury:0,ls:0,mag:0,leg:new Set(),wk:'fist'};
  for(const k in EQ){const it=EQ[k];if(!it)continue;if(it.wd){s.dmin=it.wd[0];s.dmax=it.wd[1];s.wk=it.wk}s.arm+=it.arm||0;for(const a in it.aff)s[a]+=it.aff[a];if(it.leg)s.leg.add(it.leg)}
  if(s.leg.has('vampiro'))s.ls+=4;skPassive(s);s.arm=Math.round(s.arm);s.mx=Math.round((80+P.lv*20+s.hp)*(1+(s.hpP||0)/100));s.armor=s.arm+P.lv*3;s.cdr=Math.min(40,s.cdr);ST=s;P.hp=Math.min(P.hp,s.mx);
  const w=EQ.arma;weapon(P.m,w?(w.vk||w.wk):null,null,w&&w.rar>=3?RAR[w.rar].h:null,w&&RNG(w.wk)?P.m.hL:P.m.hR);if(!w||!RNG(w.wk))weapon(P.m,null,0,0,P.m.hL);if(w&&RNG(w.wk))weapon(P.m,null,0,0,P.m.hR);armorVis()}
function armorVis(){const m=P.m;for(const k of['elmo','peito','botas'])if(m['av_'+k]){[].concat(m['av_'+k]).forEach(g=>g.parent&&g.parent.remove(g));m['av_'+k]=null}
  const H=EQ.elmo,B=EQ.peito,F=EQ.botas,col=it=>it.rar>=3?0xd9a948:it.rar==2?0xb8c0cc:it.rar==1?0x8a9ab0:0x8a8a84;
  if(H){const g=part(m.head,0,0,0,k=>{if(H.vk=='hood')k.box(.92,.5,.92,0,.78,-.02,0x3a5a2a).box(.92,.8,.2,0,.4,-.42,0x3a5a2a);else{k.box(.94,.44,.94,0,.84,0,col(H)).box(.96,.12,.96,0,.66,0,0xd9a948).box(.12,.36,.08,0,.5,.44,0x7a808a);if(H.rar>=2)k.box(.14,.5,.62,0,1.2,-.05,0xc0202a)}});m.av_elmo=g}
  if(B){const g=part(m.torso,0,0,0,k=>{k.box(.98,.92,.56,0,.5,0,col(B)).box(.32,.32,.06,0,.62,.29,B.rar>=3?0xff8a1a:0xd9a948)});m.av_peito=g}
  if(F)m.av_botas=[m.kL,m.kR].map(kn=>part(kn,0,0,0,k=>k.box(.4,.3,.56,0,-.42,.06,col(F))))
  m.meshes=[];m.g.traverse(o=>{if(o.isMesh){m.meshes.push(o);if(!o.userData.mat)o.userData.mat=o.material}})}

// ---------- dano
function rollDmg(mult){const b=(ST.dmin+R()*(ST.dmax-ST.dmin))*(1+P.lv*.08)*(1+ST.dmg/100)*(P.buff.grito>0?1+(P.gritoK||.3):1)*(P.buff.pod>0?1.3:1)*vampDmg()*foodDmg()*mult,c=P.buff.pf>0||R()*100<ST.crit;if(c)delete P.buff.pf;return[c?b*(1+ST.critd/100):b,c]}
function hurtMob(e,d,crit,src){if(e.dead)return;if(src=='golpe'||src=='proj')d=backstab(e,d);if(e.inv>0){pop('Imune',e.x,e.y+2.6*e.m.g.scale.y,e.z,'#ffb070');return}if(e.evade>0&&src!='dot'&&src!='leg'&&!e.boss){e.evade=0;pop('Esquivou!',e.x,e.y+2.2*e.m.g.scale.y,e.z,'#9ae4ff');return}if(e.afx.includes('blindado'))d*=.6;if(e.stun>0)d*=1.25;d=Math.max(1,Math.round(d));e.hp-=d;
  if(crit)critFx(e);if((src=='golpe'||src=='proj')&&!e.t.passive)powProc(e,d,crit);pop((crit?'✦':'')+fmt(d),e.x,e.y+2.2*e.m.g.scale.y,e.z,crit?'#ffd84a':src=='merc'||src=='proj'&&!crit?'#ffe8c0':'#ffffff',crit);
  e.fl=.08;flashModel(e.m,true);e.hurt=1;if(!e.boss){const a=Math.atan2(e.x-P.x,e.z-P.z),kb=src=='giro'||src=='chama'?2.2:1.2;e.vx+=S(a)*kb*3;e.vz+=C(a)*kb*3}
  if(e.t.passive){e.flee=5}else if(e.st!='chase'){e.st='chase';alertPack(e)}if(src!='merc'&&src!='minion'){TGT=e;TGTt=4}
  if(ST.ls&&src!='merc'&&src!='minion'){const h=d*Math.min(P.cls=='vampiro'?15:100,ST.ls+(P.buff.fren2>0?5:0))/100;P.hp=Math.min(ST.mx,P.hp+h)}if(e.afx.includes('vampiro'))e.hp=Math.min(e.mx,e.hp+d*.08);
  if(crit&&ST.leg.has('trovao')&&R()<.5)setTimeout(()=>{if(!e.dead){flash(e.x,e.y+3,e.z,0x9ae4ff,4,.3);fx(e.x,e.y+1.5,e.z,0x9ae4ff,12,6,.15,1.5);hurtMob(e,d*1,0,'leg');snd(1400,.15,'sawtooth')}},80);
  if(e.hp<=0)killMob(e)}
function killMob(e){e.dead=1;e.dt=0;e.dfz=R()<.5?1:-1;flashModel(e.m,false);if(e.ring)e.ring.visible=false;const T=e.t,lv=e.lv;
  if(T.passive){gainXP(Math.round(T.xp*(1+.1*lv)));for(const mt of T.mats||[])if(R()<mt[1])dropMat(e.x,e.z,mt[0]);if(R()<.3)dropGold(e.x,e.z,1+(R()*lv|0));fx(e.x,e.y+.8,e.z,0x9a3a2a,8,4,.16,1);qEvent('kill',e.type,regionAt(e.x,e.z),e);return}
  let xp=T.xp*.8*(1+.22*(lv-1))*(e.el==1?3:e.el==2?4:1)*(e.minion?.6:1)*(P.buff.ilum>0?1.3:1);gainXP(Math.round(xp),e);P.kills++;P.st.kills++;
  MASS.n++;MASS.t=1.4;MASS.xp+=xp;if(ST.leg.has('vampiro'))heal(ST.mx*.03,1);
  if(ST.leg.has('meteoro')&&++METEOR>=12){METEOR=0;meteor(e.x,e.z)}
  deathFx(e);if(e.boss)bossVictory(e);
  // saque
  const gm=(1+ST.gold/100)*(P.buff.fort>0?1.6:1);if(R()<.55||e.el||e.boss)dropGold(e.x,e.z,Math.round((3+lv*2.5)*(.6+R())*(e.el?3:1)*(e.boss?12:1)*gm));
  if(R()<(e.el||e.boss?1:.14))dropGlobe(e.x,e.z);
  const ni=e.boss?2:e.el==2?1:e.el==1?(R()<.35?1:0):R()<.02?1:0;for(let i=0;i<ni;i++)dropItem(e.x,e.z,genItem(lv,e.boss?2.2:e.el?1:0,null,e.boss&&i==0&&R()<.4));
  if(T.split&&!e.minion)for(let i=0;i<2;i++){const s=mkMob(e.type,e.x+(R()-.5)*2,e.z+(R()-.5)*2,{lv,minion:1,ch:e.ch});s.m.g.scale.multiplyScalar(.6);s.st='chase'}
  if(e.boss){BDEF[e.type]=Date.now();bossOff(e);snd(120,.8,'sawtooth');banner(e.t.n+' derrotado!');SHK=1}
  qEvent('kill',e.type,regionAt(e.x,e.z),e);if(e.afx.includes('fundido'))tele(e.x,e.z,2.6,1.2,T2=>{if(hy(P.x-T2.x,P.z-T2.z)<2.7)hitPlayer(e.dmg,{brn:1});fx(T2.x,groundAt(T2.x,T2.z)+.5,T2.z,0xff6a1a,20,6,.25,1.4)},0xff6a1a);
  if(e.ch&&!E.some(o=>o!==e&&!o.dead&&o.ch==e.ch))CLEARED.set(e.ch,performance.now());if(TGT===e)TGTt=Math.min(TGTt,1)}
function hitPlayer(d,o){if(P.dead)return 0;o=o||{};if(P.dash>0||P.inv>0||P.leap){if(P.dash>0)perfectDodge();return 0}
  d=blockHit(d,o);if(d<=0)return 0;const red=ST.armor/(ST.armor+40+P.lv*12);d*=(1-Math.min(.75,red))*(P.buff.prot>0?.75:1)*(P.buff.grito>0&&ST.leg.has('guardiao')?.7:1);d=Math.max(1,Math.round(d));if(P.shield>0){const a=Math.min(P.shield,d);P.shield-=a;d-=a;fx(P.x,P.y+1.4,P.z,0xa88aff,4,3,.12);if(d<=0){pop('Absorvido',P.x,P.y+3,P.z,'#c8b0ff');return 0}}
  P.hp-=d;P.hurt=1;pop('-'+d,P.x,P.y+3,P.z,'#ff5a4a');$('fl').style.opacity=1;setTimeout(()=>$('fl').style.opacity=0,140);snd(90,.18,'sawtooth');SHK=Math.max(SHK,.15);
  if(o.psn){if(P.psn<=0)pop('Envenenado!',P.x,P.y+3.4,P.z,'#7dff6a');P.psn=4}if(o.brn)P.brn=Math.max(P.brn,2);
  if(o.kb&&o.src){const a=Math.atan2(P.x-o.src.x,P.z-o.src.z);P.vx+=S(a)*o.kb*4;P.vz+=C(a)*o.kb*4}
  if(P.hp<=0)die();return 1}
function heal(n,quiet){const a=Math.min(n,ST.mx-P.hp);if(a<=0)return;P.hp+=a;if(!quiet){pop('+'+Math.round(a),P.x,P.y+3.2,P.z,'#6fe07a');flash(P.x,P.y+1.4,P.z,0x6fe07a,2.5,.3)}}
function die(){P.hp=0;P.dead=1;P.act=null;P.psn=P.brn=0;$('dd').classList.add('on');snd(70,1,'sawtooth')}
function respawn(){if(P.rgE){const g=P.m.g;g.quaternion.set(0,0,0,1);g.scale.setScalar(P.rgE.rg.sc);P.rgE=null}const w=[...WP].filter(w=>w.on).sort((a,b)=>hy(a.x-P.x,a.z-P.z)-hy(b.x-P.x,b.z-P.z))[0]||WP[0];P.dead=0;P.hp=ST.mx;P.gold=Math.floor(P.gold*.9);$('dd').classList.remove('on');teleport(w.x,w.z+3);toast('🕯️','Você renasceu',w.n+' · perdeu 10% do ouro')}
function gainXP(n,src){if(P.lv>=40)return;P.xp+=n;while(P.xp>=XPN(P.lv)){P.xp-=XPN(P.lv);P.lv++;calcStats();P.hp=ST.mx;banner('NÍVEL '+P.lv);P.sp++;toast('✨','+1 ponto de habilidade','Abra ✨ Habilidades');flash(P.x,P.y+1.5,P.z,0xffe27a,7,.7);ring(P.x,P.z,5,0xffe27a,.8);fx(P.x,P.y+1,P.z,0xffe27a,30,8,.2,2);levelFx();
  shopRoll()}hud()}
function meteor(x,z){tele(x,z,4,1.1,T=>{SHK=.7;flash(T.x,groundAt(T.x,T.z)+1,T.z,0xff8a30,8,.4);fx(T.x,groundAt(T.x,T.z)+.5,T.z,0xff6a1a,40,12,.3,1.6);for(const e of E)if(!e.dead&&hy(e.x-T.x,e.z-T.z)<4.2)hurtMob(e,rollDmg(4)[0],1,'leg')},0xff8a30);toast('☄️','Couraça Estelar','Um meteoro cai!')}

// ---------- saque no chão (explode para fora, feixe de luz nos lendários)
const LOOT=[];
function lootMesh(c,s){const k=new Bake();k.box(s,s,s,0,0,0,c);const m=k.mesh(MV);m.castShadow=true;sc.add(m);return m}
function dropLoot(L,x,z){const a=R()*TAU,sp=1.5+R()*2.5;L.x=x;L.z=z;L.y=groundAt(x,z)+1.2;L.vx=C(a)*sp;L.vz=S(a)*sp;L.vy=6+R()*2;L.t=0;LOOT.push(L);return L}
function dropGold(x,z,n){if(n<1)return;const L=dropLoot({k:'gold',n,m:lootMesh(0xffd34a,.32)},x,z);L.sp=spr(0xffd34a,1,.5);sc.add(L.sp)}
function dropGlobe(x,z){const L=dropLoot({k:'globe',m:lootMesh(0xe8202a,.42)},x,z);L.sp=spr(0xff2a3a,1.8,.7);sc.add(L.sp)}
function dropItem(x,z,it){const c=it.slot=='mat'?0x9a6a3a:RAR[it.rar].h,L=dropLoot({k:'item',it,m:lootMesh(c,.5)},x,z);if(it.rar>=1){L.sp=spr(c,it.rar>=2?2.4:1.4,.7);sc.add(L.sp)}if(it.rar>=2)L.bm=beam(x,z,c);if(it.rar==3){snd(880,.4,'sine');setTimeout(()=>snd(1320,.5,'sine'),180);toast('🟧','Item lendário caiu!',it.n)}}
function lootUpd(dt,t){for(let i=LOOT.length-1;i>=0;i--){const L=LOOT[i];L.t+=dt;const g=groundAt(L.x,L.z)+.3;
  if(L.vy!=null){L.vy-=22*dt;L.x+=L.vx*dt;L.z+=L.vz*dt;L.y+=L.vy*dt;if(L.y<=g){L.y=g;if(Math.abs(L.vy)>3){L.vy*=-.35;L.vx*=.5;L.vz*=.5}else L.vy=null}}else L.y=g+S(t*3+i)*.08;
  L.m.position.set(L.x,L.y,L.z);L.m.rotation.y+=dt*2;if(L.sp)L.sp.position.set(L.x,L.y+.1,L.z);if(L.bm){L.bm.position.set(L.x,groundAt(L.x,L.z)+15,L.z);L.bm.material.opacity=.25+.12*S(t*4)}
  const d=hy(P.x-L.x,P.z-L.z);if(L.t>.5&&!P.dead){if(L.k!='item'&&d<3.2&&d>.3){L.x+=(P.x-L.x)/d*dt*9;L.z+=(P.z-L.z)/d*dt*9}
    if(d<1.3){let ok=true;if(L.k=='gold'){P.gold+=L.n;pop('+'+L.n+' 🪙',P.x,P.y+2.6,P.z,'#ffd34a');snd(1200,.05,'sine')}else if(L.k=='globe'){heal(ST.mx*.22)}else ok=pickItem(L.it);
      if(ok){sc.remove(L.m);L.m.geometry.dispose();if(L.sp)sc.remove(L.sp);if(L.bm)sc.remove(L.bm);LOOT.splice(i,1);hud()}}}
  if(L.t>240){sc.remove(L.m);if(L.sp)sc.remove(L.sp);if(L.bm)sc.remove(L.bm);LOOT.splice(i,1)}}}

// ---------- santuários e baús
function useShrine(s){if(s.used){toast('⛩️','Este santuário já foi usado','');return}s.used=1;const S_=SHRN[s.ty];P.buff[s.ty]=90;toast(S_.ic,S_.n,S_.d+' por 90 segundos');flash(s.x,groundAt(s.x,s.z)+3,s.z,S_.c,6,.6);ring(s.x,s.z,4,S_.c,.7);fx(s.x,groundAt(s.x,s.z)+3,s.z,S_.c,30,6,.2,1.5);snd(660,.3,'sine');qEvent('shrine',s.ty)}
function openChest(c){if(c.o){toast('🧰','Baú vazio','');return}c.o=1;snd(220,.3,'triangle');setTimeout(()=>snd(1320,.25,'sine'),250);flash(c.x,groundAt(c.x,c.z)+1,c.z,0xffd060,5,.6);ring(c.x,c.z,3,0xffe27a,.6);
  const lv=mobLv(regionAt(c.x,c.z));dropGold(c.x,c.z,Math.round((10+lv*8)*(.8+R()*.5)));for(let i=0;i<1+(R()<.4?1:0);i++)dropItem(c.x,c.z,genItem(lv,i==0?1.6:.6));if(R()<.5)dropGlobe(c.x,c.z);qEvent('chest',c.i);save()}

// ---------- ações do jogador
let TGT=null,TGTt=0;
function bestTarget(r,front){let b=null,bs=1e9;for(const e of E){if(e.dead||!e.m.g.visible||e.t.passive)continue;const dx=e.x-P.x,dz=e.z-P.z,d=hy(dx,dz)-e.r;if(d>r)continue;if(fpOn()&&d>1.2&&Math.abs(angDiff(P.f,Math.atan2(dx,dz)))>.5)continue;const s=d-(front?3.5*Math.max(0,C(angDiff(P.f,Math.atan2(dx,dz)))):0);if(s<bs){bs=s;b=e}}return b}
function canAct(){return!P.dead&&!P.act&&P.dash<=0&&!(P.roll>0)&&!P.leap&&P.stun<=0&&!UI.block()}
function attack(){if(!canAct()||P.block){if(P.act&&(P.act.sk=='golpe'||P.act.sk=='flecha'||P.act.sk=='orbe')&&P.act.t/P.act.dur>.3)P.buf=1;return}P.buf=0;dismount();if(P.sneak){P.bsT=1.2;P.sneak=0;$('snkb').classList.remove('on')}const sp=1+ST.ias/100+(P.buff.fren>0?.25:0)+(P.buff.fren2>0?.2+.1*rk('frenesi'):0);
  if(MANA()){const t=bestTarget(16,1);if(t)P.f=Math.atan2(t.x-P.x,t.z-P.z);P.act={k:'cast',t:0,dur:.5/sp,hp:.5,sk:'orbe',tg:t};return}
  if(bow()){const t=bestTarget(16,1);if(t)P.f=Math.atan2(t.x-P.x,t.z-P.z);P.act={k:'shoot',t:0,dur:(ST.wk=='xbow'?.95:.62)/sp,hp:.62,sk:'flecha',tg:t};sweep(140,320,.25,'triangle',.04);return}
  const t=bestTarget(8,1);P.lunge=0;if(t){P.f=Math.atan2(t.x-P.x,t.z-P.z);const d=hy(t.x-P.x,t.z-P.z)-t.r;if(d>1.6){P.lunge=Math.min(.22,(d-1.2)/16)}}
  P.combo=(P.cbt>0?(P.combo||0)%4:0)+1;P.cbt=1.2;const k=P.combo==4?'finisher':spear()?(P.combo==2?'slashB':'thrust'):P.combo==1?'slashA':P.combo==2?'slashB':'slam';P.lunge=Math.max(P.lunge,k=='finisher'?.16:.07);
  P.act={k,t:0,dur:(k=='finisher'?.8:k=='slam'?.62:.44)/sp,hp:k=='finisher'?.63:k=='slam'?.56:.5,sk:'golpe',tg:t};if(k=='finisher'){fx(P.x,P.y+.3,P.z,0xcdb894,6,4,.18,.6);sweep(300,900,.3,'triangle',.04)}sweep(k=='slam'?700:900,250,.12,'sawtooth',.03)}
function primaryHit(){const a=P.act,fin=a.k=='finisher',big=a.k=='slam'||fin;if(a.sk=='orbe'){const x=P.x+S(P.f)*.7,z=P.z+C(P.f)*.7;proj('p','orb',x,P.y+1.9,z,a.tg||{x:P.x+S(P.f)*20,z:P.z+C(P.f)*20,y:P.y},spellDmg(1.05)[0],{c:0xb08aff,aoe:1.6,dir:a.tg?null:new V3(S(P.f),0,C(P.f))});flash(x,P.y+1.9,z,0xb08aff,1.8,.15);sweep(700,1200,.12,'sine',.03);return}if(a.k=='shoot'){proj('p','arrow',P.x+S(P.f)*.6,P.y+1.7,P.z+C(P.f)*.6,a.tg||{x:P.x+S(P.f)*20,z:P.z+C(P.f)*20,y:P.y},rollDmg(ST.wk=='xbow'?1.55:1)[0],{pierce:ST.leg.has('perfura')||ST.wk=='xbow',aoe:EQ.arma&&EQ.arma.pw=='explosiva'?2.2:0,c:0xffa040,dir:a.tg?null:new V3(S(P.f),0,C(P.f))});powShoot(a);addFury(6+ST.fury);sweep(1200,300,.1,'square',.03);return}
  const th=a.k=='thrust',rr=fin?3.9:th?3.9:spear()?3.2:big?3.4:2.7,arc=fin?3.2:th?.5:1.25;let hit=0;for(const e of E){if(e.dead)continue;const dx=e.x-P.x,dz=e.z-P.z,d=hy(dx,dz)-e.r;if(d<rr&&(d<1.2||Math.abs(angDiff(P.f,Math.atan2(dx,dz)))<arc)){const[dm,c]=rollDmg(fin?2.3:big?1.6:1);hurtMob(e,dm,c,'golpe');hit++;impactFx(e,fin||big)}}if(fin)finisherFx();
  const fx_=P.x+S(P.f)*1.6,fz_=P.z+C(P.f)*1.6;if(hit){addFury((8+ST.fury)*Math.min(2,hit));HITSTOP=big?.07:.035;SHK=Math.max(SHK,big?.35:.12);snd(140,.08,'sawtooth')}
  slashFx(big);if(big){ring(fx_,fz_,2.6,0xffffff,.3);fx(fx_,P.y+.3,fz_,0xc8b898,10,5,.18,.6);puff(fx_,P.y+.3,fz_,0xd8c8a8,2)}
  if(hit&&ST.leg.has('crepusculo')&&R()<.2){flash(P.x,P.y+1,P.z,0xff8a30,6,.35);ring(P.x,P.z,3.4,0xff8a30,.4);for(const e of E)if(!e.dead&&hy(e.x-P.x,e.z-P.z)<3.6)hurtMob(e,rollDmg(.8)[0],0,'leg')}}
const SLM=new THREE.Mesh(new THREE.RingGeometry(.8,1.5,28,2,-1.15,2.3),new THREE.ShaderMaterial({uniforms:{c:{value:new THREE.Color()},o:{value:1}},transparent:true,side:2,depthWrite:false,blending:THREE.AdditiveBlending,
  vertexShader:'varying vec2 vU;void main(){vU=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
  fragmentShader:'uniform vec3 c;uniform float o;varying vec2 vU;void main(){vec2 p=vU*2.-1.;float r=(length(p)-.533)/.467,a=clamp((atan(p.y,p.x)+1.15)/2.3,0.,1.),e=smoothstep(0.,.8,r)*(1.-smoothstep(.88,1.,r)),tl=smoothstep(0.,.75,a)*(1.-smoothstep(.94,1.,a)),cr=smoothstep(.6,.88,r)*(1.-smoothstep(.88,1.,r));float k=e*tl*o;gl_FragColor=vec4(mix(c,vec3(1.),cr*.45)*k*1.15,k);}'}));SLM.rotation.order='YXZ';SLM.visible=false;sc.add(SLM);let SLT=0;
function slashFx(big){const c=trailCol();SLM.material.uniforms.c.value.setHex(c);SLM.position.set(P.x+S(P.f)*1.4,P.y+(P.combo==4?.9:1.6),P.z+C(P.f)*1.4);if(P.combo==4)SLM.rotation.set(-PI/2,0,P.f+PI/2);else SLM.rotation.set(0,P.f,P.combo==2?PI:P.combo==3?PI/2:-PI/2.6);SLM.scale.setScalar(P.combo==4?2.4:big?1.8:1.3);SLM.visible=true;SLT=.2;if(!FPV.on)flash(SLM.position.x,SLM.position.y,SLM.position.z,c,big?1.8:1.1,.12)}
function addFury(n){if(MANA())return;P.fury=Math.min(100,P.fury+n);P.ft=4}
function spinTick(){spinFx();for(const e of E){if(e.dead)continue;if(hy(e.x-P.x,e.z-P.z)-e.r<3.4){const[dm,c]=rollDmg(.9+.3*(rk('giro')-1));hurtMob(e,dm,c,'giro')}}fx(P.x,P.y+1,P.z,0xe8e8f0,6,7,.12,.3);ring(P.x,P.z,3.2,0xffffff,.25);snd(500,.08,'triangle')}
function landLeap(){const L=P.leap;P.leap=null;leapFx();SHK=.6;HITSTOP=.06;ring(P.x,P.z,4.6,0xffd8a0,.5);ring(P.x,P.z,2.6,0xffffff,.3);fx(P.x,P.y+.3,P.z,0xb8a888,30,10,.25,.8);flash(P.x,P.y+.5,P.z,0xffe0b0,6,.3);for(let i=0;i<6;i++)puff(P.x+C(i)*2,P.y+.3,P.z+S(i)*2,0xd8c8a8,2.4);snd(70,.5,'sawtooth');
  for(const e of E)if(!e.dead&&hy(e.x-P.x,e.z-P.z)-e.r<4.6){const[dm,c]=rollDmg(2.6+.6*(rk('salto')-1));hurtMob(e,dm,c,'salto');e.stun=Math.max(e.stun,1.4+.3*rk('salto'))}}
// ---------- atualização do jogador
function playerUpd(dt,t){for(const k in P.cd)P.cd[k]-=dt;for(const k in P.buff){P.buff[k]-=dt;if(P.buff[k]<=0)delete P.buff[k]}
  P.inv-=dt;P.hurt=Math.max(0,P.hurt-dt*4);P.stun-=dt;P.slow-=dt;P.cbt-=dt;P.ft-=dt;if(P.ft<=0&&!MANA())P.fury=Math.max(0,P.fury-dt*3);skillsUpd(dt);
  if(SLT>0){SLT-=dt;SLM.material.uniforms.o.value=Math.max(0,SLT/.2);SLM.scale.multiplyScalar(1+dt*2.4);if(SLT<=0)SLM.visible=false}
  MASS.t-=dt;if(MASS.t<=0&&MASS.n){if(MASS.n>=8){const b=Math.round(MASS.xp*.25*(MASS.n/8));gainXP(b);massacre(MASS.n,b)}MASS.n=0;MASS.xp=0}
  if(P.dead){if(!P.rgE){P.rgE={m:P.m,x:P.x,z:P.z,y:P.y,t:{},hero:1};ragInit(P.rgE);P.rgE.rg.life=1e9;RAG.n--}ragUpd(P.rgE,Math.max(dt,1/60));return}
  P.m.g.rotation.z=angTo(P.m.g.rotation.z,0,dt*8);
  if(!P.dead&&ST.mx){if(P.hp<ST.mx)P.hp=Math.min(ST.mx,P.hp+dt*(ST.regen+(P.buff.grito>0?ST.mx*.02:0)+(inCombat()?0:ST.mx*.01)))}
  P.ptk-=dt;if(P.ptk<=0){P.ptk=.6;if(P.psn>0){P.psn-=.6;hitDot(Math.max(1,ST.mx*.02),'#7dff6a')}if(P.brn>0){P.brn-=.6;hitDot(Math.max(1,ST.mx*.03),'#ff8a3a')}
    for(const e of E)if(e.burn>0&&!e.dead){e.burn-=.6;hurtMob(e,rollDmg(.35)[0],0,'dot')}}
  // lava
  if(regionAt(P.x,P.z)==5&&!P.leap){const c=CHK.get(ckey(Math.floor(P.x/CS),Math.floor(P.z/CS)));if(c&&c.lava.some(l=>Math.abs(l[0]-P.x)<.7&&Math.abs(l[1]-P.z)<.7)){if(P.brn<=0)pop('Lava!',P.x,P.y+3,P.z,'#ff8a3a');P.brn=Math.max(P.brn,1.2)}}
  blockUpd(dt);let[ix,iz]=inputDir(),runk=P.block?.45:P.sneak?.55:P.mounted?MOUNTS[P.mounted].sp:P.run&&!P.act?1.6:1,sp=5.2*runk*(1+ST.ms/100)*(P.slow>0?.55:1);{const wd=waterDepth();if(wd>0)sp*=1-Math.min(.5,wd*.42)}
  let dvx=ix*sp,dvz=iz*sp,turn=14;
  if(P.stun>0){dvx=dvz=0}
  if(P.dash>0){P.dash-=dt;const ds=P.dsp||(P.dive?16:21);dvx=P.rdx*ds;dvz=P.rdz*ds;turn=0;if(ev(2)){flash(P.x,P.y+1.3,P.z,0x9ae4ff,1.8,.22);fx(P.x,P.y+1,P.z,0xd8f0ff,2,1.5,.1,.2,0)}if(P.dash<=0&&(P.dive||P.dodge))diveLand()}
  else if(P.roll>0){P.roll-=dt;const k=Math.max(0,P.roll/(P.rollD||.34));dvx=P.rdx*(2+8*k);dvz=P.rdz*(2+8*k);turn=0;if(P.roll<=0)P.dive=0}
  if(P.leap){const L=P.leap;L.t+=dt;const k=Math.min(1,L.t/L.dur);P.x=lerp(L.x0,L.x1,k);P.z=lerp(L.z0,L.z1,k);P.y=lerp(L.y0,groundAt(P.x,P.z),k)+S(k*PI)*4;P.vx=P.vz=0;if(k>=1)landLeap()}
  else if(P.act){const a=P.act,sp_=1+ST.ias/100;a.t+=dt;const p=a.t/a.dur;
    if(a.k=='spin'){dvx*=.75;dvz*=.75;turn=0;P.f+=dt*16;if(a.t>=a.ticks*.22){a.ticks++;spinTick()}if(a.t>=a.dur)P.act=null}
    else{dvx*=.15;dvz*=.15;if(P.lunge>0&&p<.4){P.lunge-=dt;dvx=S(P.f)*14;dvz=C(P.f)*14}if(!a.hit&&p>=a.hp){a.hit=1;if(a.sk=='golpe'||a.sk=='flecha'||a.sk=='orbe')primaryHit();else skillHit()}if(a.t>=a.dur||P.buf&&a.hit&&a.sk=='golpe'&&p>=Math.min(.92,a.hp+.2)){P.act=null;if(UI.atkHeld||P.buf)attack()}}}
  else if(UI.atkHeld)attack();
  if(!P.leap){const v=moveEnt(P,dvx,dvz,dt,P.dash>0?30:12,turn,.5);P.v=v;if(v>4&&!P.act&&!P.mounted&&ev(v>7?4:7))puff(P.x-S(P.f)*.4,P.y+.2,P.z-C(P.f)*.4,P.y<0?0xd8ecff:0xcdb894,.8);if(P.y<-.1&&v>1&&ev(5))fx(P.x,0,P.z,0xd8ecff,2,2,.1,.6)}
  const g=P.m.g;g.position.set(P.x,P.y+mountY(),P.z);g.rotation.y=P.f;P.m.hips.rotation.x=0;
  const a=P.act;animate(P.m,dt,t,{dive:P.dash>0&&!!P.dive,roll:P.roll>0?1-P.roll/(P.rollD||.34):0,dk:P.dodge&&P.dodge.k,dv:P.dodge&&P.dodge.v,air:!!P.air&&!P.dash,sneak:!!P.sneak,block:P.block>0,v:P.mounted?0:P.v||0,torch:TCH.on&&!P.mounted&&!handsBusy()?(bow()?'R':'L'):0,two:ST.two&&!bow(),dual:!!ST.dual,sit:!!P.mounted,dash:P.dash>0,atk:a&&{k:a.k,p:Math.min(1,a.t/a.dur)},hurt:P.hurt,leap:!!P.leap,aim:bow()&&UI.atkHeld&&!a});
  trailUpd(dt,!FPV.on&&(!!a&&!bow()&&a.k!='cast'&&a.k!='shout'&&a.k!='summon'&&a.k!='palm'||!!P.leap||!!P.plunge),ST.dual&&a&&a.k=='slashB'?P.m.hL:P.m.hR,trailCol())}
function hitDot(n,c){if(P.dead)return;P.hp-=Math.round(n);pop('-'+Math.round(n),P.x,P.y+3,P.z,c);if(P.hp<=0)die()}
const inCombat=()=>E.some(e=>!e.dead&&e.st=='chase'&&hy(e.x-P.x,e.z-P.z)<20);

// ---------- chefes
let BOSSON=null;
function bossAvailable(b){return!BDEF[b]||Date.now()-BDEF[b]>300000}
function bossOff(e){if(BOSSON===e){BOSSON=null;$('boss').classList.remove('on')}}
function bossUpd(e,dt,t,d,dx,dz){const T=e.t,hd=hy(P.x-e.home[0],P.z-e.home[1]);
  if(!BOSSON&&hd<26&&!P.dead){BOSSON=e;e.st='chase';$('boss').classList.add('on');$('bn_').textContent=T.n;banner(T.n);snd(110,.8,'sawtooth');SHK=.5;qEvent('bossSeen',e.type)}
  if(BOSSON===e&&(hd>42||P.dead)){if(e.ph){e.ph=0;e.dmg=Math.round(e.dmg/1.22);e.sp/=1.18;e.inv=0;POOLS.length=0}$('boss').classList.remove('p2');bossOff(e);e.st='idle';e.hp=e.mx;e.x=e.home[0];e.z=e.home[1];e.flying=0}
  if(e.stun>0){animate(e.m,dt,t,{v:0,hurt:e.hurt});e.m.g.position.set(e.x,e.y,e.z);return}
  let dvx=0,dvz=0;const enr=e.ph==2?1.5:1;if(e.inv>0)e.inv-=dt;if(BOSSON===e&&!e.ph&&!e.act&&e.hp<=e.mx*.5&&e.hp>0)bossPhase2(e);if(BOSSON===e)bossAura(e,t);
  if(BOSSON===e){for(const k in e.ab)e.ab[k]-=dt*enr;
    if(e.act){e.act.t+=dt;const p=e.act.t/e.act.dur;bossAct(e,dt,p,d,dx,dz);if(e.act&&e.act.mv){dvx=e.act.mv[0];dvz=e.act.mv[1]}if(e.act&&e.act.t>=e.act.dur)e.act=null}
    else{const ready=(e.ph==2?T.ab.concat(T.ab2||[]):T.ab).find(k=>e.ab[k]<=0&&(k!='summon'||E.filter(o=>o.minion&&!o.dead).length<4));
      if(ready&&d<24){e.ab[ready]=({charge:7,spin:9,summon:16,volley:6,dive:8,roots:7,slam:6,blink:7,poison:8,breath:9,fireballs:10,geysers:8,fly:18,...BCD})[ready]+R()*2;e.act={k:ready,t:0,dur:({charge:1.6,spin:2,summon:1,volley:1,dive:2.2,roots:1.6,slam:1.2,blink:.6,poison:1.2,breath:2.2,fireballs:1.8,geysers:1.6,fly:5,...BDUR})[ready]};if(BDUR[ready]&&ready!='phase')bossStart2(e,ready,dx,dz,d);else bossStart(e,ready,dx,dz,d)}
      else{const rg=T.rg+e.r*.4;if(T.proj&&!T.fly){if(d>T.rg){dvx=dx/d*e.sp;dvz=dz/d*e.sp}else if(d<5){dvx=-dx/d*e.sp;dvz=-dz/d*e.sp}}else if(d>rg){dvx=dx/d*e.sp;dvz=dz/d*e.sp}
        e.f=angStep(e.f,Math.atan2(dx,dz),dt*5);if(e.cd<=0&&d<(T.proj?T.rg+2:rg+.6)){e.cd=T.cd;e.act={k:'basic',t:0,dur:T.proj?.8:.9}}}}}
  else{const dd=hy(e.home[0]-e.x,e.home[1]-e.z);if(dd>1){dvx=(e.home[0]-e.x)/dd*2;dvz=(e.home[1]-e.z)/dd*2}}
  const v=moveEnt(e,dvx,dvz,dt,6,e.act&&e.act.k=='charge'?2:5,e.r);let yo=0;if(T.fly)yo=1.2+S(t*2)*.3;if(e.flying)yo+=8*Math.min(1,e.flyK=(e.flyK||0)+dt);else if(e.flyK>0)yo+=8*(e.flyK=Math.max(0,e.flyK-dt*.8));
  e.m.g.position.set(e.x,e.y+yo,e.z);e.m.g.rotation.y=e.f;const a=e.act,ak=a?(a.k=='phase'||a.k=='nova'?'roar':a.k=='quake'||a.k=='sweep'||a.k=='pools'?'slam':a.k=='spiral'||a.k=='meteors'?'cast':a.k=='basic'?T.atk:a.k=='breath'?'breath':a.k=='summon'||a.k=='geysers'?'roar':a.k=='spin'?'spin':a.k=='slam'||a.k=='roots'?'slam':a.k=='volley'||a.k=='poison'||a.k=='fireballs'?'cast':T.atk):null;
  animate(e.m,dt,t,{v,atk:ak&&{k:ak,p:Math.min(1,a.t/a.dur)},hurt:e.hurt,fly:e.flying||T.fly});
  if(BOSSON===e){$('bf').style.width=Math.max(0,e.hp/e.mx*100)+'%';$('bph').textContent=e.ph==2?'FASE II':''}}
function bossStart(e,k,dx,dz,d){const T=e.t;if(k=='summon'){for(let i=0;i<3;i++){const a=R()*TAU;const m=mkMob(T.sum,e.x+C(a)*4,e.z+S(a)*4,{lv:e.lv-2,minion:1,ch:e.ch});m.st='chase';fx(m.x,m.y+.5,m.z,0x9a5aff,14,5,.2,1.4)}pop('Reforços!',P.x,P.y+3.4,P.z,'#ff9a6a')}
  if(k=='charge'){pop(T.n.split(',')[0]+' prepara uma investida!',P.x,P.y+3.6,P.z,'#ffb070')}
  if(k=='blink'){fx(e.x,e.y+1,e.z,0x5a3a7a,20,4,.3,1);const a=R()*TAU;e.x=e.home[0]+C(a)*9;e.z=e.home[1]+S(a)*9;e.y=groundAt(e.x,e.z);fx(e.x,e.y+1,e.z,0x9aff7a,20,4,.3,1);flash(e.x,e.y+1.5,e.z,0x9aff7a,4,.3)}
  if(k=='roots'||k=='geysers'||k=='poison'){const n=k=='roots'?6:4,c=k=='poison'?0x7dff6a:k=='roots'?0x8a6a3a:0xff6a1a;for(let i=0;i<n;i++){const a=i/n*TAU+R(),r=i==0?0:1.5+R()*4,x=P.x+C(a)*r,z=P.z+S(a)*r;tele(x,z,2.2,1.3,T2=>{if(hy(P.x-T2.x,P.z-T2.z)<2.3)hitPlayer(e.dmg*.9,{psn:k=='poison',brn:k=='geysers'});fx(T2.x,groundAt(T2.x,T2.z)+.4,T2.z,c,20,5,.28,k=='roots'?1.8:3);if(k=='roots')for(let j=0;j<3;j++)puff(T2.x,groundAt(T2.x,T2.z)+.5,T2.z,0x6a4a2a,1.6);SHK=Math.max(SHK,.25)},c)}}
  if(k=='dive'){e.flying=1;e.act.tx=P.x;e.act.tz=P.z;tele(P.x,P.z,3.6,1.8,T2=>{e.flying=0;e.flyK=0;e.x=T2.x;e.z=T2.z;e.y=groundAt(e.x,e.z);SHK=.7;fx(e.x,e.y+.5,e.z,0xffd84a,24,8,.25,1.2);if(hy(P.x-T2.x,P.z-T2.z)<3.8)hitPlayer(e.dmg*1.5,{psn:1,kb:4,src:e})},0xffaa2a)}
  if(k=='fly'){e.flying=1;pop('Ignarok alça voo!',P.x,P.y+3.6,P.z,'#ff8a3a')}
  if(k=='slam'){const x=e.x+S(e.f)*3,z=e.z+C(e.f)*3;tele(x,z,4,1,T2=>{SHK=.6;fx(T2.x,groundAt(T2.x,T2.z)+.4,T2.z,0xb8a888,26,8,.25,1);if(hy(P.x-T2.x,P.z-T2.z)<4.1)hitPlayer(e.dmg*1.4,{kb:5,src:e})},0xffa040)}
  if(k=='breath')sweep(300,80,2,'sawtooth',.05)}
function bossAct(e,dt,p,d,dx,dz){const a=e.act,T=e.t;if(BDUR[a.k]){bossAct2(e,dt,p,d,dx,dz);return}
  if(a.k=='basic'){if(!a.hit&&p>.55){a.hit=1;if(T.proj)proj('m',T.proj=='sting'?'orb':T.proj,e.x+S(e.f),e.y+2.5,e.z+C(e.f),P,e.dmg,{c:T.pc,psn:e.type=='rainha'||e.type=='bruxa'});else if(d<T.rg+e.r+.8)hitPlayer(e.dmg,{src:e,kb:2});if(!T.proj){fx(e.x+S(e.f)*2,e.y+1,e.z+C(e.f)*2,0xffffff,6,4,.15);SHK=Math.max(SHK,.2)}}}
  else if(a.k=='charge'){if(p<.4){e.f=angStep(e.f,Math.atan2(dx,dz),dt*6);a.mv=[0,0]}else{if(!a.dx){a.dx=S(e.f);a.dz=C(e.f)}a.mv=[a.dx*e.sp*4,a.dz*e.sp*4];if(ev(2))fx(e.x,e.y+.3,e.z,0x9a8a7a,3,4,.25,.5);if(!a.hd&&d<e.r+1.5){a.hd=1;hitPlayer(e.dmg*1.5,{src:e,kb:6})}}}
  else if(a.k=='spin'){e.f+=dt*14;a.mv=[dx/(d||1)*e.sp*.7,dz/(d||1)*e.sp*.7];a.tk=(a.tk||0)-dt;if(a.tk<=0){a.tk=.3;if(d<e.r+2.6)hitPlayer(e.dmg*.6,{src:e});fx(e.x,e.y+1.2,e.z,0xd8d8e0,5,7,.12,.2)}}
  else if(a.k=='volley'){if(!a.hit&&p>.5){a.hit=1;for(let i=-2;i<=2;i++){const an=Math.atan2(dx,dz)+i*.22;proj('m',T.proj=='arrow'?'arrow':'orb',e.x,e.y+2.4,e.z,P,e.dmg*.7,{c:T.pc||0xffd84a,dir:new V3(S(an),0,C(an)),home:0,psn:1})}}}
  else if(a.k=='breath'){e.f=angStep(e.f,Math.atan2(dx,dz),dt*1.5);if(p>.2){const hx=e.x+S(e.f)*6,hz=e.z+C(e.f)*6;for(let i=0;i<3;i++){const r=3+R()*8,an=e.f+(R()-.5)*.6;fx(e.x+S(an)*r,e.y+2+R(),e.z+C(an)*r,R()<.5?0xff6a1a:0xffd84a,1,2,.4,.3,-1)}
      a.tk=(a.tk||0)-dt;if(a.tk<=0){a.tk=.25;const an=Math.abs(angDiff(e.f,Math.atan2(dx,dz)));if(d<11&&an<.5){hitPlayer(e.dmg*.45,{brn:1})}}}}
  else if(a.k=='fireballs'||(a.k=='fly'&&e.flying)){a.tk=(a.tk||0)-dt;if(a.tk<=0&&p<.85){a.tk=a.k=='fly'?.45:.3;const x=P.x+(R()-.5)*8,z=P.z+(R()-.5)*8;tele(x,z,2.6,1.1,T2=>{flash(T2.x,groundAt(T2.x,T2.z)+1,T2.z,0xff8a30,5,.3);fx(T2.x,groundAt(T2.x,T2.z)+.5,T2.z,0xff6a1a,22,8,.3,1.4);SHK=Math.max(SHK,.3);if(hy(P.x-T2.x,P.z-T2.z)<2.7)hitPlayer(e.dmg*.8,{brn:1})},0xff4a1a)}
    if(a.k=='fly'&&p>=.98){e.flying=0}}}
function massacre(n,xp){const m=$('mas');m.innerHTML=`MASSACRE!<b>${n} abates · +${fmt(xp)} XP</b>`;m.classList.remove('on');void m.offsetWidth;m.classList.add('on');snd(440,.2,'square')}
