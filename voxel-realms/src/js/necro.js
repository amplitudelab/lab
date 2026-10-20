'use strict';
/* =============================================================================
   VOXEL REALMS · Necromante e Vampiro
   Necromante: invoca servos (esqueletos, arqueiros, golem de ossos) que lutam
   por ele; corpo frágil, recurso Almas (mana verde).
   Vampiro: combate próximo com roubo de vida e magias com a mão; recurso Sangue
   (enche ao bater e esvazia parado), roubo de vida com teto de 15%, fraco a fogo.
   ============================================================================= */
Object.assign(CLS,{
  necromante:{n:'Necromante',ic:'💀',d:'Invoca esqueletos e um golem de ossos que lutam por você. Corpo frágil: -15% de vida, +15% de Poder Mágico. Usa Almas.',sk:'esqueleto',
    wpn:{base:'Cajado de Ossos',n:'Cajado do Acólito',ic:'🦴',wk:'staff',vk:'nstaff',wd:[5,8],aff:{mag:12}},
    mdl:{skin:0xc8ccc0,hair:0x2a2a2a,shirt:0x1e2e22,pants:0x1a221c,robe:0x16261a,trim:0x7dff9a,hat:'hood',hatC:0x16261a,belt:0x2a1a1a,cape:0x0e1a12,capeE:0x7dff9a,shoulders:0xd8d0c0,eyeC:0x4aff8a}},
  vampiro:{n:'Vampiro',ic:'🩸',d:'Luta de perto e se cura com o sangue dos inimigos. +10% de velocidade de ataque e roubo de vida. Usa Sangue. Fraco contra fogo.',sk:'garra',
    wpn:{base:'Adaga Carmesim',n:'Presa do Iniciado',ic:'🗡️',wk:'dagger',vk:'fang',wd:[5,8]},
    mdl:{skin:0xece0e0,hair:0x1a1a22,shirt:0x7a1020,vest:0x1a1018,pants:0x1a1018,boots:0x120a10,cape:0x5a0a14,capeE:0x1a0a0a,belt:0xd9a948,eyeC:0xff2a3a,trim:0xd9a948,shoulders:0x2a0a12,blush:0xd88a9a}}});
Object.assign(CLS_TREE,{necromante:'necro',vampiro:'sangue'});
TREE.push({id:'necro',n:'Necromante',c:'#7dff9a',ic:'💀'},{id:'sangue',n:'Vampiro',c:'#ff4a5a',ic:'🩸'});
// armas novas
Object.assign(WPN,{
  nstaff:(k,c,g,e)=>{k.box(.11,2.4,.11,0,.5,0,0x2a2420);for(const y of[.3,1,1.4])k.box(.15,.06,.15,0,y,0,0xd8d0c0);k.box(.36,.32,.34,0,1.86,0,0xe8e0cc).box(.3,.12,.2,0,1.72,.06,0xd8d0c0).box(.08,.18,.08,-.17,2.04,0,0xd8d0c0,{rz:.4}).box(.08,.18,.08,.17,2.04,0,0xd8d0c0,{rz:-.4});(e||k).box(.08,.08,.04,-.08,1.9,.18,0x7dff9a).box(.08,.08,.04,.08,1.9,.18,0x7dff9a)},
  fang:(k,c,g,e)=>{for(let i=0;i<5;i++)k.box(.12-i*.015,.2,.05,0,.36+i*.17,i*i*.012,i==4?0xff6a7a:0xb01a2a,{rx:-i*.06});(e||k).box(.03,.8,.055,.04,.68,.05,0xff4a5a);k.box(.34,.07,.12,0,.24,0,0x2a0a12).box(.1,.1,.14,0,.24,0,0xd9a948);grip(k,.3,0x1a0a10,0x5a0a14)},
  dagger:(k,c,g,e)=>{k.box(.12,.62,.05,0,.56,0,c||STL).box(.06,.14,.05,0,.92,0,STL2).box(.36,.07,.12,0,.24,0,g||GLD);grip(k,.28);(e||k).box(.07,.07,.13,0,.24,0,0xe0304a)}});
BASES.arma.push(['Adaga Curva','🗡️','dagger'],['Presa Carmesim','🗡️','dagger','fang'],['Cajado de Ossos','🦴','staff','nstaff']);
Object.assign(CLS_WPN,{necromante:{staff:10,wand:7,sword:.8,axe:.6,mace:.8,bow:.6,dagger:1},vampiro:{dagger:12,sword:2.5,wand:1.5,staff:.6,axe:.6,mace:.6,bow:.6,spear:.6}});
for(const c of['guerreiro','mago','cacador'])CLS_WPN[c].dagger=c=='guerreiro'?1.2:.8;
Object.assign(CLS_AFX,{necromante:{mag:4,cdr:3,hp:2,regen:2},vampiro:{ls:4,ias:3,crit:2.5,dmg:2.5,critd:2}});Object.assign(CLS_HELM,{necromante:'hood',vampiro:'hood'});Object.assign(CLS_LEG,{necromante:['trovao','meteoro'],vampiro:['vampiro','crepusculo']});
WPN_CLS.dagger='vampiro';ALLW.push('dagger');POW.sangue.w.push('dagger');
// marca de classe: “da sua classe” se a classe dá preferência a esse tipo de arma
function clsTag(it){if(it.slot!='arma'||!it.wk)return'';const w=(CLS_WPN[P.cls]||{})[it.wk]||1;if(w>=5)return'<span style="color:#7df08a">★ Arma da sua classe</span>';const c=Object.keys(CLS_WPN).find(k=>CLS_WPN[k][it.wk]>=5);return c?`<span style="color:#c8a888">Arma de ${CLS[c].n}</span>`:''}
const _clsP=clsPassive;
clsPassive=function(s){_clsP(s);if(P.cls=='necromante'){s.mag+=10;s.hpP=(s.hpP||0)-15;s.mreg=(s.mreg||8)+1}else if(P.cls=='vampiro'){s.ias+=10;s.ls+=6;s.hpP=(s.hpP||0)+12;s.arm+=8}}; // 14.1: Vampiro mais resistente, Necromante com menos poder

// ---------- habilidades do Necromante
Object.assign(SK,{
  esqueleto:{t:'necro',n:'Erguer Esqueleto',ic:'💀',lv:1,cost:24,cd:3,mag:1,anim:'summon',dur:.6,hp:.55,d:r=>`Ergue um esqueleto guerreiro que luta por você por ${30+10*r} s (${45+11*(r-1)}% do seu dano por golpe).`},
  lancaossos:{t:'necro',n:'Lança de Ossos',ic:'🦴',lv:2,cost:12,cd:.8,mag:1,anim:'palm',d:r=>`Dispara uma lança de ossos que atravessa os inimigos (${150+35*(r-1)}% de dano mágico).`},
  arqueiroesq:{t:'necro',n:'Arqueiro Esquelético',ic:'🏹',lv:3,cost:25,cd:3,mag:1,anim:'summon',dur:.6,hp:.55,d:r=>`Ergue um esqueleto arqueiro por ${30+10*r} s que atira de longe (${42+11*(r-1)}% do seu dano).`},
  senhor:{t:'necro',n:'Senhor dos Mortos',ic:'👑',lv:4,pas:1,d:r=>`Passiva: servos com +${15*r}% de vida e dano.${r>=3?' Limite de servos +1.':' No nível 3: limite de servos +1.'}`},
  colheita:{t:'necro',n:'Colheita de Almas',ic:'🌫️',lv:5,cost:0,cd:10,mag:1,anim:'castUp',dur:.6,d:r=>`Drena as almas ao redor (${120+30*(r-1)}% de dano), cura seus servos e devolve Almas por inimigo atingido.`},
  pacto:{t:'necro',n:'Pacto Sombrio',ic:'📜',lv:6,pas:1,d:r=>`Passiva: +${10*r}% de Poder Mágico e Almas voltam ${2*r} por segundo mais rápido.`},
  golemossos:{t:'necro',n:'Golem de Ossos',ic:'🗿',lv:8,cost:45,cd:20,mag:1,anim:'summon',dur:.8,hp:.6,d:r=>`Ergue um golem de ossos enorme por ${45+15*r} s que atrai os inimigos e esmaga o chão (${110+28*(r-1)}% do seu dano).`},
  explosao:{t:'necro',n:'Explosão de Cadáver',ic:'💥',lv:10,cost:30,cd:12,mag:1,anim:'stomp',dur:.55,hp:.56,d:r=>`Seus servos explodem em ossos e chamas verdes (${190+45*(r-1)}% de dano em área cada).`}});
// ---------- habilidades do Vampiro
Object.assign(SK,{
  garra:{t:'sangue',n:'Garra de Sangue',ic:'🩸',lv:1,cost:0,cd:.7,anim:'claw',dur:.5,hp:.45,d:r=>`Rasga à sua frente (${150+30*(r-1)}% de dano) e cura ${18+4*r}% do dano causado. Enche Sangue.`},
  lancacarmesim:{t:'sangue',n:'Lança Carmesim',ic:'🔻',lv:2,cost:20,cd:2,anim:'palm',d:r=>`Arremessa sangue cristalizado que atravessa (${170+35*(r-1)}% de dano) e cura um pouco por inimigo.`},
  sede:{t:'sangue',n:'Sede Eterna',ic:'🦇',lv:3,pas:1,d:r=>`Passiva: +${3*r}% de roubo de vida (o total nunca passa de 15%).`},
  nevoa:{t:'sangue',n:'Névoa Rubra',ic:'🌫️',lv:3,cost:15,cd:4,d:r=>`Vira névoa e atravessa 9 m intocável, ferindo quem estiver no caminho (${140+40*(r-1)}%).`},
  frenesi:{t:'sangue',n:'Frenesi',ic:'💢',lv:5,cost:30,cd:16,anim:'shout',dur:.6,hp:.4,d:r=>`Por 8 s: +${20+10*r}% de velocidade de ataque e +5% de roubo de vida.`},
  noturno:{t:'sangue',n:'Filho da Noite',ic:'🌙',lv:5,pas:1,d:r=>`Passiva: à noite, +${8*r}% de dano e regeneração de vida.`},
  sifao:{t:'sangue',n:'Sifão Vital',ic:'🫀',lv:6,cost:25,cd:9,anim:'palm',dur:.5,d:r=>`Puxa a vida do inimigo mais próximo por 1,5 s (${200+40*(r-1)}% no total) e cura metade.`},
  chuvasangue:{t:'sangue',n:'Chuva de Sangue',ic:'🌧️',lv:9,cost:45,cd:14,anim:'castUp',dur:.7,d:r=>`Sangue cai numa área grande por 3 s (${50+10*(r-1)}% por pulso), deixa lentos e cura um pouco por pulso.`}});
// ---------- passivas novas
const _skp=skPassive;
skPassive=function(s){_skp(s);s.mag+=10*rk('pacto');s.mreg=(s.mreg||8)+2*rk('pacto');s.ls+=3*rk('sede');foodPassive(s);if(P.cls=='vampiro')s.ls=Math.min(15,s.ls)};
// vampiro: frenesi e noite aplicados em tempo real (sem recalcular o modelo)
function vampUpd(dt){if(P.cls!='vampiro'||P.dead)return;if(NIGHT>.5&&rk('noturno'))P.hp=Math.min(ST.mx,P.hp+(1+P.lv*.3)*rk('noturno')*dt)}
const vampDmg=()=>P.cls=='vampiro'&&NIGHT>.5?1+.08*rk('noturno'):1;
const MINCAP=()=>2+(rk('senhor')>=3?1:0),MINK=()=>1+.15*rk('senhor'); // 14.1: servos mais fracos (o Necromante estava fácil demais)

// ---------- servos
const MIN=[];
const MINDEF={guerreiro:{mdl:'skeleton',w:'sword',hp:42,sp:5.2,rg:1.8,cd:1.2,mul:.45,r:.5},arqueiro:{mdl:'skeleton',w:'bow',hp:30,sp:4.8,rg:11,cd:1.8,mul:.42,ranged:1,r:.5},golem:{mdl:'bgolem',hp:160,sp:3.6,rg:2.6,cd:2,mul:1.1,r:1.1,big:1}};
MDL.bgolem=()=>hum({skin:0xd8d0c0,shirt:0xe0d8c4,pants:0xc8c0ae,boots:0xb8b0a0,shoulders:0x7dff9a,bones:0x8a8474,arm:0xd8d0c0,eyes:0x111111,glowEyes:0x7dff9a,bulk:1.6,scale:1.35,noFace:1});
function summon(kind,r){const D=MINDEF[kind];if(kind=='golem'){for(const m of MIN)if(m.kind=='golem')minionDie(m,1)}
  const others=MIN.filter(m=>m.kind!='golem');if(kind!='golem'&&others.length>=MINCAP())minionDie(others[0],1);
  const a=P.f+(R()-.5)*1.6,x=P.x+S(a)*2,z=P.z+C(a)*2,m=MDL[D.mdl]();if(D.w)weapon(m,D.w,null,null,D.ranged?m.hL:m.hR);m.meshes.forEach(o=>o.castShadow=true);
  const o={kind,D,m,x,z,y:groundAt(x,z)-2,vx:0,vz:0,f:P.f,hp:D.hp*(1+P.lv*.15)*MINK(),mx:0,t:(kind=='golem'?45+15*r:30+10*r),cd:.5,act:null,rise:1,r};o.mx=o.hp;MIN.push(o);
  const gy=groundAt(x,z);ring(x,z,1.8,0x7dff9a,.6);column(x,z,0x7dff9a,4,.9,.6);fx(x,gy+.3,z,0x7dff9a,16,4,.16,2,-1);fx(x,gy+.3,z,0x8a7a5a,10,5,.2,.8,6);snd(110,.4,'sawtooth');sweep(400,90,.5,'triangle',.04)}
function minionDie(o,quiet){const i=MIN.indexOf(o);if(i<0)return;MIN.splice(i,1);sc.remove(o.m.g);dropModel(o.m);if(!quiet){}fx(o.x,o.y+1,o.z,0xe8e0cc,14,6,.18,1,12);fx(o.x,o.y+1,o.z,0x7dff9a,8,3,.12,1.5,-1);puff(o.x,o.y+.5,o.z,0x8a8474,1.6)}
function minionHurt(o,d){o.hp-=d;o.hurt=1;pop('-'+Math.round(d),o.x,o.y+2.6,o.z,'#c8ffd0');if(o.hp<=0)minionDie(o)}
function minionTarget(e){if(!MIN.length)return null;let b=null,bd=1e9;for(const o of MIN){const d=hy(o.x-e.x,o.z-e.z)-(o.D.big?3:0);if(d<bd){bd=d;b=o}}
  const dp=hy(P.x-e.x,P.z-e.z);if(e.boss||e.el)return b&&bd<dp-4&&bd<6?b:null;if(e.tgS==null)e.tgS=R();return b&&e.tgS<.6&&bd<dp-2.5&&bd<10?b:null}
function minionsUpd(dt,t){for(let i=MIN.length-1;i>=0;i--){const o=MIN[i],D=o.D;o.t-=dt;o.cd-=dt;o.hurt=Math.max(0,(o.hurt||0)-dt*4);if(o.t<=0||P.dead){minionDie(o);continue}
    if(o.rise>0){o.rise=Math.max(0,o.rise-dt*1.6)}
    // alvo: o que o jogador ataca, ou o inimigo mais perto do jogador
    let tg=(TGT&&!TGT.dead&&hy(TGT.x-o.x,TGT.z-o.z)<18)?TGT:null;if(!tg){let bd=14;for(const e of E){if(e.dead||e.t.passive)continue;const d=hy(e.x-P.x,e.z-P.z);if(d<bd){bd=d;tg=e}}}
    let dvx=0,dvz=0;if(o.act){o.act.t+=dt;const p=o.act.t/o.act.dur;if(!o.act.hit&&p>=.5){o.act.hit=1;const e=o.act.e;if(e&&!e.dead){const dm=rollDmg(D.mul*(1+.25*(o.r-1)))[0]*MINK();
          if(D.ranged)proj('p','arrow',o.x+S(o.f)*.6,o.y+1.6,o.z+C(o.f)*.6,e,dm,{c:0x7dff9a});
          else if(hy(e.x-o.x,e.z-o.z)<D.rg+e.r+.8){hurtMob(e,dm,0,'minion');if(D.big){ring(o.x+S(o.f)*1.5,o.z+C(o.f)*1.5,2.6,0x7dff9a,.35);SHK=Math.max(SHK,.15);for(const e2 of E)if(e2!==e&&!e2.dead&&hy(e2.x-o.x,e2.z-o.z)<3.4)hurtMob(e2,dm*.5,0,'minion')}}}}
      if(o.act.t>=o.act.dur)o.act=null}
    else if(tg){const dx=tg.x-o.x,dz=tg.z-o.z,d=hy(dx,dz);o.f=angStep(o.f,Math.atan2(dx,dz),dt*8);if(d>D.rg+tg.r){dvx=dx/d*D.sp;dvz=dz/d*D.sp}else if(o.cd<=0){o.cd=D.cd*(.85+R()*.3);o.act={k:D.ranged?'shoot':D.big?'slam':R()<.5?'slashA':'slashB',t:0,dur:D.ranged?.8:.6,e:tg}}}
    else{const k=MIN.indexOf(o),a=P.f+PI+(k-1)*.9,tx=P.x+S(a)*2.6,tz=P.z+C(a)*2.6,d=hy(tx-o.x,tz-o.z);if(d>25){o.x=tx;o.z=tz}else if(d>1){const sp=Math.min(D.sp*1.3,d*2);dvx=(tx-o.x)/d*sp;dvz=(tz-o.z)/d*sp}}
    const v=moveEnt(o,dvx,dvz,dt,8,o.act?4:9,D.r);const gy=o.y;o.m.g.position.set(o.x,gy-o.rise*2.2,o.z);o.m.g.rotation.y=o.f;
    animate(o.m,dt,t,{v,atk:o.act&&{k:o.act.k,p:o.act.t/o.act.dur},hurt:o.hurt||0});if(o.t<3&&ev(6))fx(o.x,o.y+1,o.z,0x7dff9a,1,1,.1,1,-1)}}

// ---------- efeitos das habilidades novas
function newSkill(id,a,r){const t=a.tg,f=t?Math.atan2(t.x-P.x,t.z-P.z):P.f,ox=P.x+S(f)*.8,oz=P.z+C(f)*.8;P.f=f;
  if(id=='esqueleto'){summon('guerreiro',r);return true}
  if(id=='arqueiroesq'){summon('arqueiro',r);return true}
  if(id=='golemossos'){summon('golem',r);return true}
  if(id=='lancaossos'){proj('p','arrow',ox,P.y+1.7,oz,t||{x:P.x+S(f)*20,z:P.z+C(f)*20,y:P.y},spellDmg(1.5+.35*(r-1))[0],{pierce:1,c:0xe8e0cc,dir:t?null:new V3(S(f),0,C(f)),home:0});fx(ox,P.y+1.7,oz,0xe8e0cc,8,4,.12,.6,0);flash(ox,P.y+1.7,oz,0x7dff9a,2,.15);sweep(300,700,.2,'square',.04);return true}
  if(id=='colheita'){ring(P.x,P.z,6.5,0x7dff9a,.7);column(P.x,P.z,0x7dff9a,7,1.2,.6);let n=0;for(const e of E)if(!e.dead&&!e.t.passive&&hy(e.x-P.x,e.z-P.z)-e.r<6.5){const[dm,c]=spellDmg(1.2+.3*(r-1));hurtMob(e,dm,c,'colheita');n++;
      for(let i=0;i<4;i++)setTimeout(()=>fx(lerp(e.x,P.x,i/4),P.y+1.4,lerp(e.z,P.z,i/4),0x7dff9a,2,1,.12,.5,0),i*60)}
    P.fury=Math.min(100,P.fury+8*n);for(const o of MIN){o.hp=Math.min(o.mx,o.hp+o.mx*.35);fx(o.x,o.y+1.4,o.z,0x7dff9a,6,2,.1,1.6,-1)}snd(220,.5,'sine');return true}
  if(id=='explosao'){if(!MIN.length){pop('Sem servos',P.x,P.y+3,P.z,'#c8ffd0');return true}for(const o of MIN.slice()){const x=o.x,z=o.z;ring(x,z,4,0x7dff9a,.5);flash(x,o.y+1,z,0x7dff9a,6,.35);boom(x,o.y,z,1.4,0x7dff9a);fx(x,o.y+1,z,0xe8e0cc,18,10,.2,1.2,12);fx(x,o.y+1,z,0x7dff9a,14,8,.18,1.4,0);
      for(const e of E)if(!e.dead&&hy(e.x-x,e.z-z)-e.r<4){const[dm,c]=spellDmg(1.9+.45*(r-1));hurtMob(e,dm,c,'explosao')}minionDie(o,1)}SHK=Math.max(SHK,.5);snd(70,.5,'sawtooth');return true}
  if(id=='garra'){let h=0;for(const e of E){if(e.dead)continue;const dx=e.x-P.x,dz=e.z-P.z,d=hy(dx,dz)-e.r;if(d<3&&(d<1.2||Math.abs(angDiff(f,Math.atan2(dx,dz)))<1.1)){const[dm,c]=rollDmg(1.5+.3*(r-1));hurtMob(e,dm,c,'garra');h+=dm;impactFx(e,1);fx(e.x,e.y+1.2,e.z,0xb01a2a,6,4,.12,1,8)}}
    if(h){heal(h*(.18+.04*r));addFury(16)}for(let i=0;i<3;i++){const an=f-.6+i*.6;fx(P.x+S(an)*1.8,P.y+1.4,P.z+C(an)*1.8,0xff3a4a,3,2,.1,.3,0)}ring(ox,oz,1.6,0xff3a4a,.25);sweep(900,300,.12,'sawtooth',.04);return true}
  if(id=='lancacarmesim'){proj('p','arrow',ox,P.y+1.6,oz,t||{x:P.x+S(f)*20,z:P.z+C(f)*20,y:P.y},rollDmg(1.7+.35*(r-1))[0],{pierce:1,c:0xff3a4a,dir:t?null:new V3(S(f),0,C(f)),home:0,lh:1});flash(ox,P.y+1.6,oz,0xff3a4a,2.4,.15);fx(ox,P.y+1.6,oz,0xff3a4a,8,3,.1,.5,0);sweep(500,200,.2,'sawtooth',.05);return true}
  if(id=='nevoa'){const sx=P.x,sz=P.z;let tx=P.x+S(f)*9,tz=P.z+C(f)*9;for(let i=0;i<9;i++){const x=lerp(sx,tx,i/8),z=lerp(sz,tz,i/8);if(!walkable(x,z)){tx=lerp(sx,tx,(i-1)/8);tz=lerp(sz,tz,(i-1)/8);break}puff(x,groundAt(x,z)+1,z,0x8a1020,1.8);fx(x,groundAt(x,z)+1,z,0xff3a4a,2,1.5,.15,.6,-1)}
    for(const e of E)if(!e.dead&&segD(e.x,e.z,[sx,sz],[tx,tz])<e.r+1){const[dm,c]=rollDmg(1.4+.4*(r-1));hurtMob(e,dm,c,'nevoa')}P.x=tx;P.z=tz;P.inv=Math.max(P.inv,.4);sweep(800,150,.3,'sawtooth',.04);return true}
  if(id=='frenesi'){P.buff.fren2=8;calcStats();ring(P.x,P.z,3,0xff3a4a,.5);column(P.x,P.z,0xff3a4a,5,1,.5);fx(P.x,P.y+1,P.z,0xff3a4a,20,6,.14,1.4,-1);snd(160,.5,'sawtooth');return true}
  if(id=='sifao'){let b=null,bd=12;for(const e of E){if(e.dead||e.t.passive)continue;const d=hy(e.x-P.x,e.z-P.z);if(d<bd){bd=d;b=e}}if(!b){pop('Sem alvo',P.x,P.y+3,P.z,'#ffb0b8');return true}
    let k=0;vfxAdd(1.5,(q,dt)=>{if(b.dead)return;k+=dt;for(let i=0;i<3;i++){const u=R();fx(lerp(b.x,P.x,u),lerp(b.y+1.2,P.y+1.4,u),lerp(b.z,P.z,u),0xff3a4a,1,.3,.1,0,0)}if(k>=.25){k=0;const[dm]=rollDmg((2+.4*(r-1))/6);hurtMob(b,dm,0,'sifao');heal(dm*.5)}});snd(200,1.5,'sine');return true}
  if(id=='chuvasangue'){const x=t?t.x:P.x+S(f)*8,z=t?t.z:P.z+C(f)*8;ring(x,z,6,0xff3a4a,.6);let k=0,n=0;vfxAdd(3,(q,dt)=>{for(let i=0;i<3;i++){const a=R()*TAU,rr=Math.sqrt(R())*6;fx(x+C(a)*rr,groundAt(x,z)+6,z+S(a)*rr,0xb01a2a,1,.3,.12,-6,10)}k+=dt;if(k>=.5){k=0;n++;ring(x,z,6,0xff3a4a,.3,0);let hh=0;for(const e of E)if(!e.dead&&!e.t.passive&&hy(e.x-x,e.z-z)-e.r<6){const[dm]=rollDmg(.5+.1*(r-1));hurtMob(e,dm,0,'chuva');e.slow=1;hh+=dm}if(hh)heal(Math.min(hh*.1,ST.mx*.03))}});snd(150,.6,'sawtooth');return true}
  return false}
// vampiro é fraco contra fogo
const _hp0=hitPlayer;
hitPlayer=function(d,o){if(P.cls=='vampiro'&&o&&o.brn)d*=1.1;return _hp0(d,o)};
