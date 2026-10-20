'use strict';
/* =============================================================================
   VOXEL REALMS · inteligência dos monstros e fases dos chefes
   Esquiva de golpes e flechas, cerco em grupo (só 2 atacam, os outros rodeiam),
   ataque e recuo, retirada quando feridos, atiradores que mantêm distância.
   Chefes em duas fases: ao chegar na metade da vida ficam imunes por um instante,
   rugem, ganham força e velocidade e passam a usar novas habilidades.
   ============================================================================= */
let ENG=0;
const DG={wolf:.3,dwolf:.36,bandit:.3,bandarc:.38,spider:.3,fox:.4,imp:.42,fairy:.42,skel:.2,boar:.14,croc:.1,bee:.3,golem:.03,zombie:.04,ghoul:.14,slime:.02,lslime:.02,frog:.1};
const HR={wolf:1,dwolf:1,bandit:1,spider:1,fox:1,imp:1,bee:1}; // ataca e recua
const dgChance=e=>(DG[e.type]!=null?DG[e.type]:.12)+(e.el?.15:0)+(e.afx.includes('rapido')?.15:0);
function aiFrame(){let n=0;for(const e of E)if(!e.dead&&e.st=='chase'&&!e.boss&&!e.t.passive&&(e.act||hy(e.x-P.x,e.z-P.z)<e.t.rg+e.r+1.6))n++;ENG=n}
function startDodge(e,dx,dz,d){const s=Math.random()<.5?1:-1,sp=e.sp*3.4;e.ddx=-dz/d*s*sp;e.ddz=dx/d*s*sp;e.dd=.26;e.evade=.3;e.dcd=2.4+R()*2.4-(e.el?1:0);
  puff(e.x,e.y+.3,e.z,0xcdb894,.9);fx(e.x,e.y+.5,e.z,0xdde8ff,4,3,.1,.4,2)}
function dodgeCheck(e,d,dx,dz){if(e.boss||e.t.passive||e.t.ai=='hopper'||(e.dcd||0)>0||e.dd>0||e.stun>0||d<.5)return;
  const a=P.act;
  if(a&&a.t/a.dur<(a.hp||.5)&&d<4.6&&a.dgBy!==e&&Math.abs(angDiff(P.f,Math.atan2(e.x-P.x,e.z-P.z)))<1.1&&a.k!='shout'){a.dgBy=e;if(Math.random()<dgChance(e)){startDodge(e,dx,dz,d);return}}
  for(const p of PJ)if(p.l>0&&p.side=='p'&&p.dgBy!==e){const q=p.o.position,px=q.x-e.x,pz=q.z-e.z,pd=hy(px,pz);if(pd<6.5&&(p.v.x*px+p.v.z*pz)<0){p.dgBy=e;if(Math.random()<dgChance(e)+.1){const l=hy(p.v.x,p.v.z)||1;startDodge(e,p.v.z/l*d,-p.v.x/l*d,d)}else e.dcd=.8;return}}}
function circleMv(e,dx,dz,d,sp,want,k){e.fp=.2;if(!e.cs||(e.ct-=1/60)<0){e.cs=Math.random()<.5?1:-1;e.ct=1.5+R()*2}
  const tx=-dz/d*e.cs,tz=dx/d*e.cs,rad=cl((d-want)*.45,-.7,.7);return[(tx*k+dx/d*rad)*sp,(tz*k+dz/d*rad)*sp]}
function meleeMove(e,dt,d,dx,dz,sp,rg){aiStuck(e,dt,d);if(e.ut>0){e.ut-=dt;return[e.ux*sp,e.uz*sp]}
  if(e.ret>0){e.ret-=dt;e.fp=.2;return[-dx/d*sp*.85,-dz/d*sp*.85]}
  if(!e.rt&&!e.el&&e.hp<e.mx*.22&&Math.random()<dt*1.2){e.rt=1;e.rtt=3.2;if(d<14)pop('...',e.x,e.y+2.4,e.z,'#c8c8c8')}
  if(e.rtt>0){e.rtt-=dt;e.fp=.2;e.hp=Math.min(e.mx,e.hp+e.mx*.02*dt*4);return[-dx/d*sp*1.05,-dz/d*sp*1.05]}
  const near=d<rg+1.6;e.eng=near;
  if(d>rg){
    if(!near&&d<11&&ENG>=2&&!e.t.swarm)return circleMv(e,dx,dz,d,sp,5.4,.8);  // cerco: espera a vez
    const lead=Math.min(.3,d/(sp*6+1));let ax=dx+(P.vx||0)*lead,az=dz+(P.vz||0)*lead,al=hy(ax,az)||1;
    if(d<7&&HR[e.type]&&!e.act&&(e.sw=(e.sw||0)+dt)>1.1){const c=circleMv(e,dx,dz,d,sp,rg+.6,.9);if(e.sw>2){e.sw=0}return c}  // flanqueia antes do bote
    return[ax/al*sp,az/al*sp]}
  return[0,0]}
function rangedMove(e,dt,d,dx,dz,sp,T){aiStuck(e,dt,d);if(e.ut>0){e.ut-=dt;return[e.ux*sp,e.uz*sp]}const lo=T.rg*.45,hi=T.rg*.85;
  if(d<lo)return[-dx/d*sp*.9,-dz/d*sp*.9];if(d>hi)return[dx/d*sp,dz/d*sp];return circleMv(e,dx,dz,d,sp,(lo+hi)/2,.55)}
function aiAfterAct(e){if(HR[e.type]&&!e.boss)e.ret=.55+R()*.5}

// ---------- chefes: fase II
const BDUR={nova:1.4,spiral:2.6,quake:1.6,meteors:2.4,sweep:1.5,pools:1.4,phase:2.6},BCD={nova:8,spiral:10,quake:8,meteors:11,sweep:7,pools:12};
const BNAME={nova:'Anel de projéteis',spiral:'Espiral',quake:'Abalo',meteors:'Chuva de fogo',sweep:'Varredura',pools:'Poças'};
function bossPhase2(e){const T=e.t;e.ph=2;e.inv=2.6;e.act={k:'phase',t:0,dur:BDUR.phase};e.hp=Math.min(e.mx,e.hp+e.mx*.08);e.dmg=Math.round(e.dmg*1.22);e.sp*=1.18;
  for(const k of T.ab2||[])e.ab[k]=1.5+R()*3;for(const k in e.ab)e.ab[k]=Math.min(e.ab[k],4);
  $('boss').classList.add('p2');$('bph').textContent='FASE II';banner('FASE II');pop(T.n.split(',')[0]+' enfurece!',P.x,P.y+3.8,P.z,'#ff6a3a');
  snd(80,1.2,'sawtooth');sweep(220,50,1.4,'sawtooth',.07);SHK=.9;flash(e.x,e.y+2,e.z,0xff4a2a,12,.9);ring(e.x,e.z,9,0xff5a2a,.9);ring(e.x,e.z,5,0xffd060,.7);
  fx(e.x,e.y+1.5,e.z,0xff6a2a,50,12,.4,1.6);if(typeof MUS!='undefined')MUS.p2=1;
  if(T.sum&&!(e.t.fly&&false)){for(let i=0;i<2;i++){const a=R()*TAU,m=mkMob(T.sum,e.x+C(a)*5,e.z+S(a)*5,{lv:Math.max(1,e.lv-2),minion:1,ch:e.ch});m.st='chase'}}}
function bossPhaseTick(e,dt,p){ // durante o rugido: onda de choque que empurra o jogador
  if(!e.pw&&p>.55){e.pw=1;SHK=1;ring(e.x,e.z,12,0xff3a1a,.6);flash(e.x,e.y+1,e.z,0xffa040,14,.5);fx(e.x,e.y+.5,e.z,0xffd060,40,14,.3,1.4);if(hy(P.x-e.x,P.z-e.z)<11)hitPlayer(e.dmg*.5,{kb:9,src:e})}
  if(ev(3))fx(e.x+(R()-.5)*e.r*2,e.y+.4,e.z+(R()-.5)*e.r*2,0xff7a2a,1,2,.3,2.4,-2);if(p>=.99)e.pw=0}
function bossAura(e,t){ // brasas contínuas ao redor do chefe em fase II
  if(e.ph>=2&&ev(e.ph==3?2:4))fx(e.x+(R()-.5)*e.r*2,e.y+R()*2.6*(e.m.g.scale.y||1),e.z+(R()-.5)*e.r*2,0xff5a2a,1,1.4,.3,1.6,-1)}
function bossStart2(e,k,dx,dz,d){const T=e.t,c=T.pc||0xff5a2a;pop(BNAME[k]+'!',P.x,P.y+3.6,P.z,'#ffb070');
  if(k=='quake'){const a=Math.atan2(dx,dz);for(let i=1;i<=6;i++){const x=e.x+S(a)*i*3.2,z=e.z+C(a)*i*3.2;setTimeout(()=>{tele(x,z,2.4,.9,T2=>{SHK=Math.max(SHK,.3);fx(T2.x,groundAt(T2.x,T2.z)+.4,T2.z,0xb8a888,16,7,.25,1.2);puff(T2.x,groundAt(T2.x,T2.z)+.5,T2.z,0x8a7a68,1.6);if(hy(P.x-T2.x,P.z-T2.z)<2.5)hitPlayer(e.dmg*.8,{kb:4,src:e})},0xffa040)},i*170)}}
  else if(k=='meteors'){for(let i=0;i<8;i++)setTimeout(()=>{const x=P.x+(R()-.5)*(i<2?1:12),z=P.z+(R()-.5)*(i<2?1:12);tele(x,z,2.6,1.1,T2=>{const y=groundAt(T2.x,T2.z);flash(T2.x,y+1,T2.z,0xff8a30,6,.3);fx(T2.x,y+.5,T2.z,0xff6a1a,24,9,.3,1.5);ring(T2.x,T2.z,2.8,0xff8a30,.4);SHK=Math.max(SHK,.3);if(hy(P.x-T2.x,P.z-T2.z)<2.7)hitPlayer(e.dmg*.75,{brn:1})},0xff4a1a)},i*260)}
  else if(k=='sweep'){const r=e.r+5;tele(e.x,e.z,r,1.2,T2=>{ring(e.x,e.z,r+1,0xffd060,.5);flash(e.x,e.y+1,e.z,0xffe090,10,.35);fx(e.x,e.y+.6,e.z,0xffe090,34,12,.2,.6);SHK=.5;if(hy(P.x-e.x,P.z-e.z)<r)hitPlayer(e.dmg*1.2,{kb:7,src:e})},0xffc040)}
  else if(k=='pools'){for(let i=0;i<4;i++){const a=i/4*TAU+R(),r=i==0?0:2+R()*4,x=P.x+C(a)*r,z=P.z+S(a)*r;tele(x,z,2.4,1.2,T2=>{POOLS.push({x:T2.x,z:T2.z,r:2.4,t:6,tk:0,dm:e.dmg*.28,c,psn:T.proj=='orb'||e.type=='anciao'||e.type=='rainha',brn:e.type=='ignarok'||e.type=='capitao'})},c)}}
  else if(k=='spiral')snd(300,.3,'triangle')}
function bossAct2(e,dt,p,d,dx,dz){const a=e.act,T=e.t,c=T.pc||0xff7a2a,kind=T.proj=='arrow'?'arrow':'orb';
  if(a.k=='phase')bossPhaseTick(e,dt,p);
  else if(a.k=='nova'){if(!a.hit&&p>.45){a.hit=1;const n=18,g=Math.floor(R()*n);for(let i=0;i<n;i++){if(i==g||i==(g+1)%n)continue;const an=i/n*TAU;proj('m',kind,e.x,e.y+1.8,e.z,P,e.dmg*.5,{c,dir:new V3(S(an),0,C(an)),home:0,life:2.2})}ring(e.x,e.z,4,c,.5);flash(e.x,e.y+1.5,e.z,c,6,.3);snd(240,.25,'sawtooth')}}
  else if(a.k=='spiral'){a.tk=(a.tk||0)-dt;if(a.tk<=0&&p>.15&&p<.9){a.tk=.1;a.an=(a.an||0)+.62;for(const o of[0,Math.PI]){const an=a.an+o;proj('m',kind,e.x,e.y+1.8,e.z,P,e.dmg*.4,{c,dir:new V3(S(an),0,C(an)),home:0,life:2.4})}}}
  else if(a.k=='quake'||a.k=='meteors'||a.k=='sweep'||a.k=='pools'){a.mv=[0,0];e.f=angStep(e.f,Math.atan2(dx,dz),dt*(a.k=='sweep'?0:3))}}

// ---------- poças persistentes (fase II)
const POOLS=[];
function poolUpd(dt){for(let i=POOLS.length-1;i>=0;i--){const o=POOLS[i];o.t-=dt;o.tk-=dt;
    if(ev(5))fx(o.x+(R()-.5)*o.r*1.6,groundAt(o.x,o.z)+.15,o.z+(R()-.5)*o.r*1.6,o.c,1,1.2,.2,1.4,-1);
    if(o.tk<=0){o.tk=.5;if(!P.dead&&hy(P.x-o.x,P.z-o.z)<o.r&&P.dash<=0)hitPlayer(o.dm,{psn:o.psn,brn:o.brn})}
    if(o.t<=0)POOLS.splice(i,1)}}

// ---------- chefes sempre presentes no covil (o limite de monstros não pode impedir o chefe)
let bossCk=0;
function bossCheck(dt){bossCk-=dt;if(bossCk>0)return;bossCk=1.5;
  for(const b in BOSS){const B=BOSS[b];if(hy(P.x-B.x,P.z-B.z)>75)continue;if(!CHK.get(ckey(Math.floor(B.x/CS),Math.floor(B.z/CS))))continue;
    if(E.some(e=>e.type==b&&!e.dead)||!bossAvailable(b))continue;mkMob(b,B.x,B.z,{lv:Math.max(B.lv,P.lv),ch:ckey(Math.floor(B.x/CS),Math.floor(B.z/CS))})}}
// ---------- monstro preso (árvore, pedra, cerca): contorna; se continuar preso longe da vista, reposiciona
function aiStuck(e,dt,d){e.skT=(e.skT||0)+dt;if(e.skT<1.2)return null;e.skT=0;const mv=hy(e.x-(e.skx??e.x+9),e.z-(e.skz??e.z+9));e.skx=e.x;e.skz=e.z;
  if(e.st!='chase'||d<e.t.rg+e.r+1.2||e.act){e.skn=0;return null}
  if(mv<.6){e.skn=(e.skn||0)+1;const a=R()*TAU;e.ux=S(a);e.uz=C(a);e.ut=.9;
    if(e.skn>=3&&d>14){for(let i=0;i<8;i++){const a2=R()*TAU,r=3+R()*5,x=e.x+S(a2)*r,z=e.z+C(a2)*r;if(walkable(x,z,e.y)){e.x=x;e.z=z;e.y=groundAt(x,z);e.skn=0;break}}}}
  else e.skn=0;return null}
