'use strict';
/* =============================================================================
   VOXEL REALMS · entidades
   jogador, mercenário contratado, aldeões, animais e monstros (normais,
   campeões, raros e chefes); movimento com aceleração e curvas suaves
   ============================================================================= */
// ---------- jogador
const P={x:-6,z:20,y:1.5,vx:0,vz:0,f:PI,lv:1,xp:0,gold:30,hp:100,fury:0,dead:0,act:null,cd:{},roll:0,rdx:0,rdz:0,inv:0,hurt:0,buff:{},kills:0,stun:0,slow:0,psn:0,brn:0,ptk:0,leap:null,merc:null,disc:new Set(),pot:0};
P.m=MDL.hero();
const XPN=l=>Math.round(170*Math.pow(l,1.85)); // curva mais íngreme: cada nível custa mais // experiência para o próximo nível

// ---------- movimento comum: aceleração, curva suave, chão em degraus, colisão
function moveEnt(o,dvx,dvz,dt,acc,turn,r){o.vx+=(dvx-o.vx)*damp(acc,dt);o.vz+=(dvz-o.vz)*damp(acc,dt);const sp=hy(o.vx,o.vz),hp=o===P,W=hp?walkP:walkable,e=hp?.34:0;
  if(sp>.01){const nx=o.x+o.vx*dt,nz=o.z+o.vz*dt;if(W(nx,o.z,o.y)&&(!e||W(nx+Math.sign(o.vx)*e,o.z,o.y)))o.x=nx;else o.vx*=.2;if(W(o.x,nz,o.y)&&(!e||W(o.x,nz+Math.sign(o.vz)*e,o.y)))o.z=nz;else o.vz*=.2}
  if(sp>.35&&turn)o.f=angStep(o.f,Math.atan2(o.vx,o.vz),turn*dt);collide(o,r||.5);if(hp){playerY(dt);return sp}
  const g=Math.max(footY(o.x,o.z,o.y,(r||.5)*.55),-.75);if(g>o.y)o.y=Math.max(o.y+(g-o.y)*damp(26,dt),g-.12);else o.y+=(g-o.y)*damp(10,dt);return sp}

// ---------- tipos de monstro (por região) e chefes
const MT={
  boar:{n:'Javali Raivoso',m:'boar',hp:38,dmg:7,sp:3.6,rg:1.7,cd:1.7,xp:12,ai:'charger',r:.8,atk:'bite'},
  wolf:{n:'Lobo Cinzento',m:'wolf',hp:32,dmg:6,sp:5.4,rg:1.7,cd:1.2,xp:12,ai:'melee',r:.7,atk:'bite'},
  bandit:{n:'Bandido',m:'bandit',w:'dagger',hp:44,dmg:8,sp:3.8,rg:1.8,cd:1.3,xp:15,ai:'melee',atk:'thrust'},
  bandarc:{n:'Bandido Arqueiro',m:'bandarc',w:'bow',wh:'L',hp:30,dmg:7,sp:3.3,rg:12,cd:2.4,xp:15,ai:'ranged',proj:'arrow',atk:'shoot'},
  bee:{n:'Abelha Corrompida',m:'bee',hp:22,dmg:5,sp:5.8,rg:1.6,cd:1.1,xp:10,ai:'melee',psn:1,fly:1,atk:'sting'},
  golem:{n:'Golem de Lírio',m:'golem',hp:120,dmg:15,sp:2.3,rg:2.5,cd:2.4,xp:34,ai:'melee',atk:'slam',r:1.1},
  fairy:{n:'Fada Sombria',m:'fairy',hp:26,dmg:8,sp:4.2,rg:10,cd:2.6,xp:18,ai:'ranged',proj:'orb',pc:0xd06aff,atk:'cast',hover:1.2},
  dwolf:{n:'Lobo das Sombras',m:'dwolf',hp:50,dmg:10,sp:6,rg:1.8,cd:1.1,xp:18,ai:'melee',r:.75,atk:'bite'},
  spider:{n:'Aranha Tecelã',m:'spider',hp:36,dmg:8,sp:5.6,rg:1.6,cd:1.1,xp:14,ai:'melee',psn:1,atk:'bite'},
  skel:{n:'Esqueleto Arqueiro',m:'skeleton',w:'bow',wh:'L',hp:34,dmg:9,sp:3.2,rg:13,cd:2.4,xp:16,ai:'ranged',proj:'arrow',atk:'shoot'},
  zombie:{n:'Zumbi',m:'zombie',hp:62,dmg:11,sp:1.7,rg:1.8,cd:1.7,xp:16,ai:'melee',atk:'claw'},
  ghoul:{n:'Carniçal',m:'ghoul',hp:44,dmg:9,sp:4.8,rg:1.7,cd:1.1,xp:16,ai:'melee',atk:'claw'},
  croc:{n:'Crocodilo do Lodo',m:'croc',hp:90,dmg:14,sp:3.4,rg:2.4,cd:1.8,xp:26,ai:'melee',atk:'bite',r:1.1},
  frog:{n:'Sapo Peçonhento',m:'pfrog',hp:30,dmg:8,sp:5,rg:1.9,cd:1.6,xp:13,ai:'hopper',psn:1},
  slime:{n:'Lodo Vivo',m:'slime',hp:46,dmg:9,sp:2.7,rg:1.7,cd:1.4,xp:14,ai:'melee',atk:'squash',split:1},
  lslime:{n:'Slime de Lava',m:'lslime',hp:52,dmg:11,sp:2.9,rg:1.7,cd:1.4,xp:16,ai:'melee',atk:'squash',brn:1},
  // animais (passivos: fogem e deixam materiais)
  sheep:{n:'Ovelha',m:'sheep',hp:18,dmg:0,sp:3.2,rg:1,cd:9,xp:2,ai:'animal',passive:1,r:.6,mats:[['la',.8],['carne',.5]]},
  cow:{n:'Vaca',m:'cow',hp:30,dmg:0,sp:2.6,rg:1,cd:9,xp:3,ai:'animal',passive:1,r:.8,mats:[['couro',.7],['carne',.8]]},
  wdeer:{n:'Cervo Branco',m:'wdeer',hp:30,dmg:0,sp:8,rg:1,cd:9,xp:8,ai:'animal',passive:1,r:.6,mats:[['chifre',.8],['couro',.6]]},
  deer:{n:'Cervo',m:'deer',hp:22,dmg:0,sp:7.5,rg:1,cd:9,xp:4,ai:'animal',passive:1,r:.6,mats:[['chifre',.5],['couro',.6]]},
  rabbit:{n:'Coelho',m:'rabbit',hp:8,dmg:0,sp:6.5,rg:1,cd:9,xp:1,ai:'animal',passive:1,r:.35,mats:[['coelho',.4],['carne',.3]]},
  fox:{n:'Raposa',m:'fox',hp:14,dmg:0,sp:7,rg:1,cd:9,xp:3,ai:'animal',passive:1,r:.45,mats:[['raposa',.7]]},
  tfrog:{n:'Sapo do Brejo',m:'frog',hp:6,dmg:0,sp:4,rg:1,cd:9,xp:1,ai:'animal',passive:1,r:.35,mats:[['perna',.6]]},
  imp:{n:'Diabrete de Brasa',m:'imp',w:'club',hp:34,dmg:10,sp:5,rg:9,cd:2.2,xp:16,ai:'ranged',proj:'fire',pc:0xff7a1a,atk:'cast'}};
const BOSS={
  capitao:{n:'Capitão Rasgado',m:'capitao',w:'axe',hp:620,dmg:16,sp:4,rg:2.6,cd:1.6,xp:420,x:-38,z:174,lv:3,ab:['charge','spin','summon'],ab2:['quake','sweep','nova'],sum:'bandit',r:1.1,atk:'slashA'},
  rainha:{n:'Rainha da Colmeia',m:'queen',hp:1000,dmg:18,sp:4.2,rg:3,cd:1.5,xp:700,x:192,z:56,lv:6,ab:['volley','summon','dive'],ab2:['nova','spiral','pools'],sum:'bee',proj:'sting',pc:0xffd84a,fly:1,r:1.6,atk:'sting'},
  anciao:{n:'Ancião Corrompido',m:'treant',hp:1900,dmg:26,sp:2.3,rg:4,cd:2,xp:1100,x:12,z:-190,lv:9,ab:['roots','slam','summon'],ab2:['quake','pools','sweep'],sum:'spider',r:2.2,atk:'slam'},
  bruxa:{n:'Morgra, a Bruxa do Mangue',m:'witch',w:'staff',hp:2300,dmg:28,sp:3.6,rg:12,cd:1.8,xp:1500,x:-186,z:60,lv:12,ab:['blink','poison','summon','volley'],ab2:['spiral','meteors','pools'],sum:'frog',proj:'orb',pc:0x9aff7a,r:1,atk:'cast'},
  ignarok:{n:'Ignarok, o Dragão de Brasa',m:'ignarok',hp:4600,dmg:34,sp:3.6,rg:6.5,cd:2.2,xp:3200,x:152,z:-178,lv:15,ab:['breath','fireballs','charge','geysers','fly'],ab2:['meteors','sweep','quake','nova'],r:3.6,atk:'bite'}};
const SPAWN={plan:['boar','wolf','bandit','bandarc'],flor:['bee','golem','fairy','wolf'],mata:['dwolf','spider','skel'],mang:['croc','frog','slime','zombie'],cald:['lslime','imp','skel']};
// à noite, feras agressivas se somam aos monstros da região
const NIGHTB={plan:['wolf','wolf','boar'],flor:['wolf','dwolf'],mata:['dwolf','dwolf','spider'],mang:['croc','croc'],cald:['imp']};
const FAUNA={vila:[],plan:['sheep','cow','rabbit','deer'],flor:['rabbit','deer','fox'],mata:['deer','wdeer','fox','rabbit','wdeer'],mang:['tfrog'],cald:[]};
const AFF={rapido:{n:'Rápido'},blindado:{n:'Blindado'},vampiro:{n:'Vampírico'},fundido:{n:'Fundido'},gelido:{n:'Gélido'},peconha:{n:'Peçonhento'},vortice:{n:'Vórtice'}};
const E=[],ANI=[],NPC=[],CLEARED=new Map();let eid=0;

function mobLv(reg){return Math.max(REG[reg].lv,Math.floor(P.lv*.85))}
function mkMob(type,x,z,o){o=o||{};const t=BOSS[type]||MT[type],lv=o.lv||1,boss=!!BOSS[type],el=o.el||0;
  const hpM=t.passive?1+.08*lv:(boss?.85:.62)*(1+.3*(lv-1))*(el==1?3:el==2?4.2:1)*(o.minion?1.4:1),m=MDL[t.m]();
  if(t.w)weapon(m,t.w,null,null,t.wh=='L'?m.hL:m.hR);
  if(el)m.g.scale.multiplyScalar(1.18);
  const e={id:eid++,type,t,boss,el,afx:o.afx||[],minion:o.minion,x,z,y:groundAt(x,z),vx:0,vz:0,f:R()*TAU,hp:t.hp*hpM,mx:t.hp*hpM,lv,dmg:t.dmg*(1+.2*(lv-1))*(el?1.3:1),sp:t.sp*(o.afx&&o.afx.includes('rapido')?1.45:1),
    m,st:'idle',home:[x,z],ch:o.ch,cd:1+R(),act:null,hurt:0,stun:0,slow:0,dt:0,wt:R()*3,tx:x,tz:z,r:(t.r||.6)*(el?1.15:1),ab:{},hop:0,name:o.name||t.n};
  if(boss){e.st='idle';e.home=[t.x,t.z];for(const a of t.ab)e.ab[a]=4+R()*4}
  if(el){e.ring=new THREE.Mesh(RGG,new THREE.MeshBasicMaterial({color:el==1?0x6a9cff:0xffd84a,transparent:true,opacity:.7,depthWrite:false,side:2,blending:THREE.AdditiveBlending}));e.ring.rotation.x=-PI/2;e.ring.scale.setScalar(1.3);sc.add(e.ring)}
  m.g.position.set(x,e.y,z);E.push(e);return e}
function dropMob(e){dropModel(e.m);if(e.ring)sc.remove(e.ring);const i=E.indexOf(e);if(i>=0)E.splice(i,1)}

// ---------- geração por pedaço: bandos de monstros, animais e baús são ligados ao pedaço
function onChunkReady(c){const k=ckey(c.cx,c.cz),cx=c.cx*CS+CS/2,cz=c.cz*CS+CS/2;if(hy(cx,cz)<75)return;if(typeof DNG!='undefined'&&DNG.some(D=>hy(cx-D.at[0],cz-D.at[1])<46))return;const cl_=CLEARED.get(k);if(cl_&&performance.now()-cl_<90000)return;if(aliveN()>=MAXE)return;
  const r=rng(c.cx*92821^c.cz*68917^((performance.now()/90000)|0)),reg=regionAt(cx,cz),rid=REG[reg].id;
  let tbl=SPAWN[rid]||[];for(const p of POI)if(hy(cx-p.x,cz-p.z)<p.r+16){if(p.n.startsWith('Cemit'))tbl=['zombie','zombie','ghoul','skel'];if(p.n.startsWith('Acamp'))tbl=['bandit','bandarc'];if(p.n.startsWith('Colmeia'))tbl=['bee','bee','fairy']}
  const nt=NIGHT>.5;if(nt&&!tbl.some(t=>t=='zombie'||t=='bandit'&&tbl.length==2))tbl=tbl.concat(NIGHTB[rid]||[]);
  const packs=tbl.length?(r()<([0,.66,.7,.76,.74,.8,.74,.78,.7,.76,.72,.8][reg]||.75)?1:0)+(r()<(nt?.38:.26)?1:0):0;
  for(let p=0;p<packs;p++){let x=0,z=0,ok=false;for(let a=0;a<8&&!ok;a++){x=c.cx*CS+4+r()*(CS-8);z=c.cz*CS+4+r()*(CS-8);ok=walkable(x,z)&&groundAt(x,z)>(rid=='mang'?-.5:.2)}if(!ok)continue;
    const lv=mobLv(reg),roll=r(),el=roll<.06?2:roll<.14?1:0,afx=[];if(el){const ks=Object.keys(AFF);while(afx.length<el){const a=pick(ks,r);if(!afx.includes(a))afx.push(a)}}
    const t1=pick(tbl,r),n=el==1?3:el==2?1:2+(r()*3|0);
    for(let i=0;i<n;i++){const ty=el==2||i<n-1||r()<.5?t1:pick(tbl,r),e=mkMob(ty,x+(r()-.5)*5,z+(r()-.5)*5,{lv,el,afx,ch:k,name:el==2?rareName(r):null});e.pack=p}
    if(el==2)for(let i=0;i<3;i++)mkMob(t1,x+(r()-.5)*5,z+(r()-.5)*5,{lv,ch:k,minion:1})}
  // animais
  const fa=FAUNA[rid]||[];for(let i=0;i<(fa.length?(nt?(r()<.4?1:0):2+(r()*2|0)):0);i++){const x=c.cx*CS+r()*CS,z=c.cz*CS+r()*CS;if(!walkable(x,z)||groundAt(x,z)<(rid=='mang'?-.4:.3))continue;const ty=pick(fa,r),nn=ty=='sheep'||ty=='cow'?2+(r()*2|0):1;for(let j=0;j<nn;j++){const a=mkMob(ty,x+(r()-.5)*4,z+(r()-.5)*4,{lv:REG[reg].lv,ch:k});if(ty=='tfrog')a.m.g.scale.setScalar(.55)}}
  // chefes nos covis
  for(const b in BOSS){const B=BOSS[b];if(Math.floor(B.x/CS)==c.cx&&Math.floor(B.z/CS)==c.cz&&!E.some(e=>e.type==b)&&bossAvailable(b))mkMob(b,B.x,B.z,{lv:Math.max(B.lv,P.lv),ch:k})}}
function onChunkDrop(c){const k=ckey(c.cx,c.cz);for(let i=E.length-1;i>=0;i--){const e=E[i];if(e.ch==k&&e.st!='chase'&&!e.boss&&!e.dead)dropMob(e)}for(let i=ANI.length-1;i>=0;i--){const a=ANI[i];if(a.ch==k){dropModel(a.m);ANI.splice(i,1)}}}
const RN1=['Grar','Vex','Morth','Ulda','Kesh','Brann','Zul','Ottra','Fenn','Skar'],RN2=['o Faminto','Dente-Negro','a Peste','Olho-Rubro','o Podre','Garra-Fria','o Silencioso','Pele-de-Pedra'];
function rareName(r){return pick(RN1,r)+' '+pick(RN2,r)}

// ---------- animais: pastam, passeiam e fogem do jogador
function mkAnimal(ty,x,z,ch){const m=MDL[ty](),a={ty,m,x,z,y:groundAt(x,z),vx:0,vz:0,f:R()*TAU,ch,tx:x,tz:z,t:R()*3,hx:x,hz:z,hop:0,hp:1};if(ty=='frog')m.g.scale.setScalar(.55);m.g.position.set(x,a.y,z);ANI.push(a);return a}
function animalsUpd(dt,t){for(const a of ANI){const dx=a.x-P.x,dz=a.z-P.z,d=hy(dx,dz);a.m.g.visible=d<70&&!invHide(d);if(d>70)continue;
  const flee=d<(a.ty=='cow'||a.ty=='sheep'?4:8)&&!P.dead;let tx=a.tx,tz=a.tz,sp=0;
  if(flee){tx=a.x+dx/(d||1)*6;tz=a.z+dz/(d||1)*6;sp=a.ty=='deer'||a.ty=='wdeer'||a.ty=='fox'?7:a.ty=='rabbit'?6:3}else{a.t-=dt;if(a.t<=0){a.t=3+R()*5;a.tx=a.hx+(R()-.5)*16;a.tz=a.hz+(R()-.5)*16}const dd=hy(a.tx-a.x,a.tz-a.z);sp=dd>.6?(a.ty=='cow'?1:1.4):0}
  const dd=hy(tx-a.x,tz-a.z)||1;if(a.ty=='frog'){a.hop=Math.max(0,a.hop-dt*1.8);if(a.hop<=0&&sp>0&&R()<.03)a.hop=1;sp*=a.hop>0?1.4:0}
  moveEnt(a,sp?(tx-a.x)/dd*sp:0,sp?(tz-a.z)/dd*sp:0,dt,6,6,.4);a.m.g.position.set(a.x,a.y,a.z);a.m.g.rotation.y=a.f;animate(a.m,dt,t,{v:hy(a.vx,a.vz),hop:a.hop})}}

// ---------- NPCs da vila (com rotina) e mercenários
function mkNPC(id,mdl,x,z,o){const m=MDL[mdl](rng(id.length*977)),n={id,m,x,z,y:groundAt(x,z),vx:0,vz:0,f:Math.atan2(-x,-z),hx:x,hz:z,tx:x,tz:z,t:R()*4,...o};m.g.position.set(x,n.y,z);if(o&&o.w)weapon(m,o.w,null,null,o.wh=='L'?m.hL:m.hR);NPC.push(n);return n}
const MERC={lyra:{n:'Lyra',cls:'Arqueira',mdl:'lyra',w:'bow',wh:'L',price:60,rng:9,d:'Atira flechas à distância e marca os inimigos.',ic:'🏹'},
  mirela:{n:'Mirela',cls:'Maga',mdl:'mirela',w:'staff',price:90,rng:9,d:'Lança orbes arcanos que explodem em área.',ic:'🔮'},
  borin:{n:'Borin',cls:'Guerreiro anão',mdl:'borin',w:'axe',price:70,rng:1.6,d:'Luta na linha de frente e atrai os golpes.',ic:'🪓'}};
function spawnNPCs(){mkNPC('bram','bram',-10,-33,{nm:'Ancião Bram',ic:'🧙',talk:'bram',still:1});mkNPC('helga','helga',21,-18,{nm:'Helga, a Ferreira',ic:'⚒️',talk:'helga',still:1});
  mkNPC('guarda','guard',6,48,{nm:'Guarda Tomas',ic:'🛡️',talk:'guarda',still:1,w:'sword'});mkNPC('eremita','eremita',-136,-8,{nm:'Eremita Ulric',ic:'🧓',talk:'eremita',still:1});
  [['lyra',-17,-14],['mirela',-20,-12.5],['borin',-23,-13]].forEach(([id,x,z])=>{const M=MERC[id];mkNPC(id,M.mdl,x,z,{nm:M.n+' · '+M.cls,ic:M.ic,merc:id,w:M.w,wh:M.wh,still:1})});
  for(let i=0;i<6;i++){const a=i/6*TAU+.4,r=15+R()*20;mkNPC('aldeao'+i,'villager',C(a)*r,S(a)*r,{nm:pick(['Aldeã','Aldeão','Lavrador','Mercadora','Pescador','Criança']),wander:1,talk:'aldeao'})}
  for(const n of NPC)if(n.talk||n.merc)inter({x:0,z:0,r:2.6,npc:n,ic:n.ic||'💬',label:()=>n.merc?(P.merc&&P.merc.id==n.merc?'Dispensar '+MERC[n.merc].n:'Contratar '+n.nm+' ('+MERC[n.merc].price+' ouro)'):'Falar com '+n.nm,act:()=>n.merc?hireMerc(n):talkTo(n),kind:'npc'})}
const invHide=d=>INV_OPEN.k>.2&&d<8;
function npcUpd(dt,t){for(const n of NPC){const d=hy(n.x-P.x,n.z-P.z);n.m.g.visible=d<(MOB?50:80)&&!n.hidden&&!invHide(d);if(!n.m.g.visible)continue;let sp=0;
  if(n.follow){const M=n.follow;sp=mercUpd(n,dt,t);}
  else if(n.wander){n.t-=dt;if(n.t<=0){n.t=4+R()*6;if(R()<.6){const a=R()*TAU,r=8+R()*30;n.tx=C(a)*r;n.tz=S(a)*r}}const dd=hy(n.tx-n.x,n.tz-n.z);if(dd>.8&&d>2.5){sp=1.5;moveEnt(n,(n.tx-n.x)/dd*sp,(n.tz-n.z)/dd*sp,dt,5,5,.45)}else moveEnt(n,0,0,dt,8,0,.45)}
  else{const dh=hy(n.hx-n.x,n.hz-n.z);if(dh>.5){sp=2;moveEnt(n,(n.hx-n.x)/dh*sp,(n.hz-n.z)/dh*sp,dt,6,6,.45)}else{n.vx=n.vz=0;if(d<6)n.f=angStep(n.f,Math.atan2(P.x-n.x,P.z-n.z),dt*3)}}
  for(const it of INTER)if(it.npc===n){it.x=n.x;it.z=n.z}
  n.m.g.position.set(n.x,n.y,n.z);n.m.g.rotation.y=n.f;if(!n.follow)animate(n.m,dt,t,{v:hy(n.vx,n.vz),atk:n.act&&{k:n.act.k,p:n.act.t/n.act.dur},sit:n.sit})}}
// mercenário: segue o jogador e luta
function mercUpd(n,dt,t){const M=MERC[n.merc];n.cd-=dt;n.tt=(n.tt||0)-dt;if(n.act){n.act.t+=dt;if(!n.act.hit&&n.act.t>=n.act.dur*.5){n.act.hit=1;mercHit(n)}if(n.act.t>=n.act.dur)n.act=null}
  if(n.tt<=0){n.tt=.4;if(!(n.tg&&!n.tg.dead&&hy(n.tg.x-P.x,n.tg.z-P.z)<16)){n.tg=null;let bd=12;for(const e of E){if(e.dead||e.t.passive)continue;const dd=hy(e.x-n.x,e.z-n.z);if(dd<bd&&hy(e.x-P.x,e.z-P.z)<14){bd=dd;n.tg=e}}}}
  let tx=n.x,tz=n.z,sp=0;const tg=P.dead?null:n.tg;
  if(tg){const dx=tg.x-n.x,dz=tg.z-n.z,d=hy(dx,dz)-tg.r;if(d>M.rng){tx=tg.x;tz=tg.z;sp=6}else{if(M.rng>3&&d<M.rng-4){tx=n.x-dx;tz=n.z-dz;sp=3.5}n.f=angStep(n.f,Math.atan2(dx,dz),dt*10);if(n.cd<=0&&!n.act){n.cd=M.rng>3?1.6:1.15;n.act={k:n.merc=='lyra'?'shoot':n.merc=='mirela'?'cast':'slashA',t:0,dur:.55,tg}}}}
  else{const a=S(P.f),b=C(P.f);tx=P.x-a*2.4+b*1.8;tz=P.z-b*2.4-a*1.8;const d=hy(tx-n.x,tz-n.z);sp=d>8?9:d>.8?Math.max(2.5,Math.min(6.5,d*2)):0}
  if(hy(P.x-n.x,P.z-n.z)>34){n.x=P.x-1.5;n.z=P.z-1.5;n.y=groundAt(n.x,n.z);fx(n.x,n.y+1,n.z,0xffffff,10,3,.15,1)}
  const dd=hy(tx-n.x,tz-n.z)||1;moveEnt(n,sp?(tx-n.x)/dd*sp:0,sp?(tz-n.z)/dd*sp:0,dt,8,9,.5);const v=hy(n.vx,n.vz);
  n.m.g.position.set(n.x,n.y,n.z);n.m.g.rotation.y=n.f;animate(n.m,dt,t,{v,atk:n.act&&{k:n.act.k,p:n.act.t/n.act.dur},aim:n.merc=='lyra'&&!!tg&&!n.act});if(v>5&&ev(9))puff(n.x,n.y+.2,n.z,0xcdb894,.6);return v}
function mercHit(n){const tg=n.act.tg;if(!tg||tg.dead)return;const lvM=1+P.lv*.18,M=MERC[n.merc];
  if(n.merc=='borin'){if(hy(tg.x-n.x,tg.z-n.z)-tg.r<2.4){hurtMob(tg,(6+P.lv*2.2)*lvM*(.9+R()*.2),0,'merc');fx(tg.x,tg.y+1.2,tg.z,0xffffff,5,4,.14);flash(tg.x,tg.y+1.3,tg.z,0xffe0b0,1.4,.12);snd(160,.06,'square')}}
  else proj('p',n.merc=='lyra'?'arrow':'orb',n.x+S(n.f)*.6,n.y+(n.merc=='lyra'?1.8:2.6),n.z+C(n.f)*.6,tg,(n.merc=='lyra'?5+P.lv*1.8:7+P.lv*2.3)*lvM*(.9+R()*.2),n.merc=='mirela'?{aoe:2.6,c:0xc07aff}:{})}
function hireMerc(n){if(P.merc&&P.merc.merc==n.merc){dismiss();return}const M=MERC[n.merc];
  say([[n.nm,n.merc=='lyra'?'Minhas flechas são suas por '+M.price+' moedas. Nunca erro duas vezes.':n.merc=='mirela'?'Magia de verdade custa '+M.price+' moedas. Arcanos não comem promessas.':'Por '+M.price+' moedas eu racho qualquer coisa que tenha cabeça. Feito?',M.ic]],()=>{
    if(P.gold<M.price){toast('🪙','Ouro insuficiente','Você precisa de '+M.price+' moedas.');return}P.gold-=M.price;if(P.merc)dismiss(1);P.merc=n;n.follow=1;n.still=0;n.tg=null;n.cd=1;
    toast(M.ic,M.n+' se juntou a você','Só um mercenário por vez.');qEvent('hire',n.merc);hud();save()},{yes:'Contratar ('+M.price+' ouro)',no:'Agora não'})}
function dismiss(silent){const n=P.merc;if(!n)return;n.follow=0;n.still=1;n.act=null;n.x=n.hx;n.z=n.hz;n.y=groundAt(n.x,n.z);P.merc=null;if(!silent)toast(MERC[n.merc].ic,MERC[n.merc].n+' voltou para a taverna','');hud();save()}

// ---------- projéteis (do jogador, do mercenário e dos monstros)
const PJ=[],_pv2=new V3();
function arrowMesh(){const k=new Bake();k.box(.05,.05,1.1,0,0,0,0x9a7a4a).box(.1,.1,.2,0,0,.6,0xcfd6dc).box(.02,.22,.22,0,0,-.5,0xe04a3a).box(.22,.02,.22,0,0,-.5,0xe04a3a);return k.mesh(MV)}
for(let i=0;i<34;i++){const s=spr(0xffffff,1.1,1);s.visible=false;sc.add(s);const a=arrowMesh();a.visible=false;sc.add(a);PJ.push({s,a,o:null,l:0,v:new V3,tg:null,dm:0,k:'',side:''})}
function proj(side,kind,x,y,z,tg,dm,o){o=o||{};const p=PJ.find(p=>p.l<=0);if(!p)return;Object.assign(p,{lh:o.lh,side,k:kind,tg,dm,l:o.life||2.4,aoe:o.aoe||0,c:o.c||0xffffff,pierce:o.pierce,hits:[],psn:o.psn,brn:o.brn,home:o.home==null?(side=='p'?1:0):o.home});
  p.ml=p.l;p.o=kind=='arrow'?p.a:p.s;p.o.visible=true;p.o.position.set(x,y,z);if(kind!='arrow'){p.s.material.color.setHex(p.c);p.s.scale.setScalar(kind=='fire'?1.6:1.2)}
  const sp=kind=='arrow'?28:kind=='orb'?14:16;if(o.dir)p.v.copy(o.dir).multiplyScalar(sp);else p.v.set(tg.x-x,(tg.y||0)+(tg===P?1.3:1.1)-y,tg.z-z).normalize().multiplyScalar(sp);if(kind=='orb'&&side=='p')p.v.y+=3;p.sp=sp}
function projUpd(dt){stickUpd(dt);for(const p of PJ){if(p.l<=0)continue;p.l-=dt;const q=p.o.position,t=p.tg;
  if(t&&!t.dead&&p.home>0){_pv2.set(t.x-q.x,(t.y||0)+(t===P?1.3:1.1)-q.y,t.z-q.z);const d=_pv2.length();_pv2.multiplyScalar(p.sp/(d||1));p.v.lerp(_pv2,Math.min(1,dt*6*p.home))}
  if(p.k=='arrow'&&p.l<p.ml*.55&&!(t&&t.mx&&!t.dead)){p.home=0;p.v.y-=26*dt}
  q.addScaledVector(p.v,dt);if(p.k=='arrow')p.o.lookAt(q.x+p.v.x,q.y+p.v.y,q.z+p.v.z);else p.o.scale.setScalar((p.k=='fire'?1.6:1.15)+S(T60*.5)*.15);
  if(ev(2))projTrail(p,q);
  if(p.side=='p'){for(const e of E){if(e.dead||p.hits.includes(e))continue;if(hy(e.x-q.x,e.z-q.z)<e.r+.5&&Math.abs(q.y-(e.y+1.2*(e.boss?2:1)))<2.4*(e.boss?2:1)){hitProj(p,e);if(!p.pierce){p.l=0;break}}}}
  else if(!P.dead&&hy(P.x-q.x,P.z-q.z)<.75&&Math.abs(q.y-P.y-1.2)<1.6){hitPlayer(p.dm,{psn:p.psn,brn:p.brn,src:p});fx(q.x,q.y,q.z,p.c,6,4,.14);p.l=0}
  if(q.y<groundAt(q.x,q.z)+.05){if(p.aoe)hitProj(p,null);else{fx(q.x,q.y+.1,q.z,0xc8a060,4,3,.1);if(p.k=='arrow')stickArrow(p.o)}p.l=0}
  else if(p.l<=0&&p.k=='arrow'&&!p.hitEnd){p.l=.6;p.hitEnd=1;p.v.y=Math.min(p.v.y,-4)} // no fim do alcance a flecha cai em vez de sumir no ar
  if(p.l<=0){p.o.visible=false;p.hitEnd=0}}}
// flechas cravadas no chão (pool próprio, somem devagar)
const STK=[];let stkI=0;
function stickArrow(o){let a=STK[stkI%14];if(!a){a=arrowMesh();sc.add(a);STK.push(a)}stkI++;a.position.copy(o.position);a.quaternion.copy(o.quaternion);a.visible=true;a.userData.t=4;a.scale.setScalar(1)}
function stickUpd(dt){for(const a of STK){if(!a.visible)continue;a.userData.t-=dt;if(a.userData.t<.5)a.scale.setScalar(Math.max(.01,a.userData.t*2));if(a.userData.t<=0)a.visible=false}}
function hitProj(p,e){const q=p.o.position;if(e){p.hits.push(e);hurtMob(e,p.dm,0,'proj');if(p.lh)heal(p.dm*.1,1)}if(p.aoe){for(const o of E)if(o!==e&&!o.dead&&hy(o.x-q.x,o.z-q.z)<p.aoe)hurtMob(o,p.dm*.6,0,'proj');fx(q.x,q.y,q.z,p.c,14,6,.18,1.2);flash(q.x,q.y,q.z,p.c,3.5,.3);ring(q.x,q.z,p.aoe,p.c,.35);if(p.k=='fire'||p.aoe>=2.2)boom(q.x,Math.max(groundAt(q.x,q.z),q.y-1),q.z,p.aoe/2.4,p.k=='fire'?0xff7a1a:p.c);snd(300,.12,'sine')}else{fx(q.x,q.y,q.z,0xffe9a0,5,4,.12);flash(q.x,q.y,q.z,0xfff0b0,1.1,.12)}}

// ---------- IA dos monstros
function mobsUpd(dt,t){
  // separação: monstros não se sobrepõem
  aiFrame();poolUpd(dt);
  for(let i=0;i<E.length;i++){const a=E[i];if(a.dead||a.boss&&a.flying)continue;for(let j=i+1;j<E.length;j++){const b=E[j];if(b.dead)continue;const dx=b.x-a.x,dz=b.z-a.z,m=a.r+b.r;if(Math.abs(dx)>m||Math.abs(dz)>m)continue;const d=hy(dx,dz);if(d<m&&d>1e-3){const k=(m-d)*.5/d;a.x-=dx*k;a.z-=dz*k;b.x+=dx*k;b.z+=dz*k}}}
  for(let i=E.length-1;i>=0;i--){const e=E[i];e.tgm=e.st=='chase'&&!e.boss?minionTarget(e):null;const tgx=e.tgm?e.tgm.x:P.x,tgz=e.tgm?e.tgm.z:P.z,dx=tgx-e.x,dz=tgz-e.z,d=hy(dx,dz),T=e.t;
    if(e.dead){e.dt+=dt;if(ragUpd(e,dt))dropMob(e);continue}
    const vis=d<VISD||e.boss&&d<70;e.m.g.visible=vis&&!invHide(d);if(vis){const sh=d<SHD;if(sh!==e.sh){e.sh=sh;for(const o of e.m.meshes)o.castShadow=sh}}if(e.ring)e.ring.visible=vis;if(!vis&&e.st!='chase')continue;
    e.hurt=Math.max(0,e.hurt-dt*4);e.stun-=dt;e.slow-=dt;e.cd-=dt;e.dcd-=dt;e.evade-=dt;if(e.fl>0){e.fl-=dt;if(e.fl<=0)flashModel(e.m,false)}
    let dvx=0,dvz=0,sp=e.sp*(e.slow>0?.5:1);
    if(e.boss){bossUpd(e,dt,t,d,dx,dz);continue}
    if(T.passive){e.flee-=dt;const sc_=d<(T.sp>5?7:3.5)&&!P.dead;if(e.flee>0||sc_){const k=e.flee>0?1:.7;dvx=-dx/(d||1)*e.sp*k;dvz=-dz/(d||1)*e.sp*k;if(e.flee>0&&ev(6))puff(e.x,e.y+.2,e.z,0xcdb894,.6)}else{e.wt-=dt;if(e.wt<=0){e.wt=3+R()*5;e.tx=e.home[0]+(R()-.5)*14;e.tz=e.home[1]+(R()-.5)*14}const dd=hy(e.tx-e.x,e.tz-e.z);if(dd>.8){dvx=(e.tx-e.x)/dd*1.3;dvz=(e.tz-e.z)/dd*1.3}}
      if(T.m=='frog'){e.hop=Math.max(0,e.hop-dt*1.8);if(e.hop<=0&&hy(dvx,dvz)>.5)e.hop=1;if(e.hop<=0){dvx*=.1;dvz*=.1}}}
    else if(e.stun>0){if(ev(8))fx(e.x,e.y+e.m.g.scale.y*2.4,e.z,0xffe27a,1,1.5,.14,.4,0)}
    else if(e.dd>0){e.dd-=dt;dvx=e.ddx;dvz=e.ddz;if(ev(2))puff(e.x,e.y+.3,e.z,0xcdb894,.6)}
    else if(e.act){e.act.t+=dt;const p=e.act.t/e.act.dur;if(!e.act.hit&&p>=e.act.hp){e.act.hit=1;mobStrike(e,d)}if(e.act.t>=e.act.dur){e.act=null;aiAfterAct(e)}if(e.act&&e.act.k=='charge'){dvx=e.act.dx*sp*3;dvz=e.act.dz*sp*3}}
    else{
      if(e.st=='idle'){e.wt-=dt;if(e.wt<=0){e.wt=2+R()*4;e.tx=e.home[0]+(R()-.5)*12;e.tz=e.home[1]+(R()-.5)*12}const dd=hy(e.tx-e.x,e.tz-e.z);if(dd>.8){dvx=(e.tx-e.x)/dd*sp*.35;dvz=(e.tz-e.z)/dd*sp*.35}
        if(aiSees(e,d,dt)){e.st='chase';alertPack(e);if(d>9){pop('!',e.x,e.y+2.6*(e.m.g.scale.y||1),e.z,'#ff5a4a',1)}}}
      else if(e.st=='chase'){if(P.dead||d>42||hy(e.x-e.home[0],e.z-e.home[1])>60){e.st='idle';e.hp=Math.min(e.mx,e.hp+e.mx*.3);if(!P.dead){e.tx=P.x;e.tz=P.z;e.wt=6}}
        else if(T.ai=='ranged'){dodgeCheck(e,d,dx,dz);const mv=rangedMove(e,dt,d,dx,dz,sp,T);dvx=mv[0];dvz=mv[1];e.f=angStep(e.f,Math.atan2(dx,dz),dt*8);if(e.cd<=0&&d<T.rg+2){e.cd=T.cd*(.8+R()*.4);e.act={k:T.atk||'cast',t:0,dur:.8,hp:.62}}}
        else if(T.ai=='hopper'){e.hop=Math.max(0,e.hop-dt*1.6);if(e.hop<=0&&e.cd<=0){e.hop=1;e.cd=T.cd;e.hx=dx/d;e.hz=dz/d;e.hitd=0}if(e.hop>0){dvx=e.hx*sp*1.6;dvz=e.hz*sp*1.6;if(!e.hitd&&e.hop<.5&&d<T.rg+.3){e.hitd=1;hitPlayer(e.dmg,{psn:T.psn,src:e})}}e.f=angStep(e.f,Math.atan2(dx,dz),dt*8)}
        else{const rg=T.rg+e.r*.5;dodgeCheck(e,d,dx,dz);const mv=meleeMove(e,dt,d,dx,dz,sp,rg);dvx=mv[0];dvz=mv[1];if(d<=rg)e.f=angStep(e.f,Math.atan2(dx,dz),dt*10);
          if(T.ai=='charger'&&d<9&&d>3.5&&e.cd<=0){e.cd=T.cd*2;e.act={k:'charge',t:0,dur:.75,hp:.95,dx:dx/d,dz:dz/d};sweep(180,60,.3,'sawtooth',.04)}
          else if(d<rg+.4&&e.cd<=0){e.cd=T.cd*(.85+R()*.3);e.act={k:T.atk||'bite',t:0,dur:T.atk=='slam'?.95:.6,hp:T.atk=='slam'?.55:.5}}}
        affixUpd(e,dt,d)}}
    const v=moveEnt(e,dvx,dvz,dt,T.ai=='charger'||T.fly?5:7,e.act?3:9,e.r);if(e.fp>0){e.fp-=dt;e.f=angStep(e.f,Math.atan2(dx,dz),dt*9)}
    if(e.act&&e.act.k=='charge'&&!e.act.hd&&d<e.r+1.1){e.act.hd=1;hitPlayer(e.dmg*1.4,{src:e,kb:4})}
    e.m.g.position.set(e.x,e.y+(T.hover?T.hover+S(t*2+e.id)*.25:0),e.z);e.m.g.rotation.y=e.f;if(e.ring)e.ring.position.set(e.x,e.y+.1,e.z);
    const sc_=e.m.g.scale;animate(e.m,dt,t,{v,atk:e.act&&e.act.k!='charge'?{k:e.act.k,p:e.act.t/e.act.dur}:e.act&&{k:'charge',p:.5},hurt:e.hurt,hop:e.hop})}}
function alertPack(e){for(const o of E)if(!o.dead&&!o.t.passive&&o.st=='idle'&&hy(o.x-e.x,o.z-e.z)<16)o.st='chase'}
function mobStrike(e,d){const T=e.t,k=e.act.k;
  if(T.proj||k=='cast'||k=='shoot'){proj('m',T.proj||'orb',e.x+S(e.f)*.8,e.y+1.6*(e.m.g.scale.y),e.z+C(e.f)*.8,P,e.dmg,{c:T.pc||0xffffff,psn:T.psn,brn:T.brn});if(T.proj=='arrow')sweep(1100,400,.1,'triangle',.02);return}
  const reach=T.rg+e.r*.5+1;if(e.tgm&&MIN.includes(e.tgm)){if(d<reach+e.tgm.D.r)minionHurt(e.tgm,e.dmg)}else if(d<reach){const a=Math.abs(angDiff(e.f,Math.atan2(P.x-e.x,P.z-e.z)));if(a<1.3||d<1.4)hitPlayer(e.dmg,{psn:T.psn,brn:T.brn,src:e,kb:k=='slam'?3:0})}
  if(k=='slam'){ring(e.x+S(e.f)*1.5,e.z+C(e.f)*1.5,2.4,0xd8c8a8,.35);fx(e.x+S(e.f)*1.5,e.y+.3,e.z+C(e.f)*1.5,0xb8a888,10,5,.2,.6);SHK=Math.max(SHK,.25)}}
// afixos de elite
function affixUpd(e,dt,d){if(!e.afx.length)return;e.ab.t=(e.ab.t||0)-dt;if(e.ab.t>0)return;e.ab.t=4+R()*2;
  for(const a of e.afx){if(a=='fundido'){const x=e.x,z=e.z;tele(x,z,1.6,1.5,T=>{if(hy(P.x-T.x,P.z-T.z)<1.8)hitPlayer(e.dmg*.6,{brn:1})},0xff6a1a)}
    else if(a=='gelido'&&d<14){const x=P.x+(R()-.5)*2,z=P.z+(R()-.5)*2;tele(x,z,2.4,1.4,T=>{if(hy(P.x-T.x,P.z-T.z)<2.5){hitPlayer(e.dmg*.8,{});P.slow=2.5;pop('Congelado!',P.x,P.y+3,P.z,'#9ae4ff')}fx(T.x,groundAt(T.x,T.z)+.5,T.z,0x9ae4ff,16,5,.2,1.2)},0x9ae4ff)}
    else if(a=='peconha'&&d<14){tele(P.x,P.z,2.2,1.3,T=>{if(hy(P.x-T.x,P.z-T.z)<2.3)hitPlayer(e.dmg*.5,{psn:1});fx(T.x,groundAt(T.x,T.z)+.3,T.z,0x7dff6a,14,3,.2,.6)},0x7dff6a)}
    else if(a=='vortice'&&d<14&&d>3){P.x=e.x+(P.x-e.x)/d*2.2;P.z=e.z+(P.z-e.z)/d*2.2;ring(P.x,P.z,2,0xb07aff,.4);pop('Puxado!',P.x,P.y+3,P.z,'#c79bff')}}}
