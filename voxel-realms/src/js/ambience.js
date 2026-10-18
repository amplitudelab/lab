'use strict';
/* =============================================================================
   VOXEL REALMS · ambientação
   spawn dinâmico (as missões nunca travam), ciclo dia/noite da fauna,
   fumaça nas chaminés, aldeões que se recolhem à noite, saudações e sons
   ambientes (pássaros de dia, grilos à noite, sapos no mangue)
   ============================================================================= */
// ---------- spawn dinâmico em volta do jogador
const SPW={t:4,a:6};
const hostile=e=>!e.dead&&!e.t.passive&&!e.boss&&!e.minion;
function spawnTable(x,z){const reg=regionAt(x,z),rid=REG[reg].id;let tbl=(SPAWN[rid]||[]).slice();
  for(const p of POI)if(hy(x-p.x,z-p.z)<p.r+16){if(p.n.startsWith('Cemit'))return{reg,rid,tbl:['zombie','zombie','ghoul','skel']};if(p.n.startsWith('Acamp'))return{reg,rid,tbl:['bandit','bandarc']};if(p.n.startsWith('Colmeia'))return{reg,rid,tbl:['bee','bee','fairy']}}
  if(NIGHT>.5)tbl=tbl.concat(NIGHTB[rid]||[],NIGHTB[rid]||[]);
  // missões de abate ativas puxam os monstros certos para perto
  for(const q of QD)if(QS[q.id].st==1&&q.t=='kill'&&(q.reg==rid||(SPAWN[rid]||[]).some(m=>q.mob.includes(m))||(NIGHTB[rid]||[]).some(m=>q.mob.includes(m)))){const ok=q.mob.filter(m=>(SPAWN[rid]||[]).includes(m)||(NIGHTB[rid]||[]).includes(m)||q.reg==rid);for(const m of ok)tbl.push(m,m,m)}
  return{reg,rid,tbl}}
function spawnSpot(dmin,dmax){for(let i=0;i<10;i++){const a=R()*TAU,r=dmin+R()*(dmax-dmin),x=P.x+S(a)*r,z=P.z+C(a)*r;if(hy(x,z)<62||Math.abs(x)>WMAX-4||Math.abs(z)>WMAX-4)continue;if(!CHK.get(ckey(Math.floor(x/CS),Math.floor(z/CS))))continue;
    if(walkable(x,z)&&groundAt(x,z)>(regionAt(x,z)==RI.mang?-.5:.2))return[x,z]}return null}
function spawnUpd(dt){SPW.t-=dt;SPW.a-=dt;if(P.dead||hy(P.x,P.z)<70||aliveN()>=MAXE)return;
  if(SPW.t<=0){SPW.t=9+R()*5;const near=E.filter(e=>hostile(e)&&hy(e.x-P.x,e.z-P.z)<46).length,want=NIGHT>.5?10:7;
    if(near<want&&!E.some(e=>e.boss&&!e.dead&&hy(e.x-P.x,e.z-P.z)<40)){const sp=spawnSpot(26,38);if(sp){const{reg,tbl}=spawnTable(sp[0],sp[1]);if(tbl.length){
      const lv=mobLv(reg),t1=pick(tbl),n=Math.min(want-near,2+(R()*3|0)),ch=ckey(Math.floor(sp[0]/CS),Math.floor(sp[1]/CS)),el=R()<.07?1:0,afx=el?[pick(Object.keys(AFF))]:[];
      for(let i=0;i<n;i++)mkMob(i==0||R()<.6?t1:pick(tbl),sp[0]+(R()-.5)*5,sp[1]+(R()-.5)*5,{lv,ch,el:i==0?el:0,afx:i==0?afx:[]})}}}}
  // fauna: mais animais passivos de dia, poucos à noite
  if(SPW.a<=0){SPW.a=14+R()*8;const pas=E.filter(e=>!e.dead&&e.t.passive&&hy(e.x-P.x,e.z-P.z)<50).length,want=NIGHT>.5?1:5;
    if(pas<want){const sp=spawnSpot(24,40);if(sp){const reg=regionAt(sp[0],sp[1]),fa=FAUNA[REG[reg].id]||[];if(fa.length){const ty=pick(fa),nn=ty=='sheep'||ty=='cow'?2+(R()*2|0):1,ch=ckey(Math.floor(sp[0]/CS),Math.floor(sp[1]/CS));
      for(let j=0;j<nn;j++){const a=mkMob(ty,sp[0]+(R()-.5)*4,sp[1]+(R()-.5)*4,{lv:REG[reg].lv,ch});if(ty=='tfrog')a.m.g.scale.setScalar(.55)}}}}}}

// ---------- fumaça das chaminés
const SMK=[];let smI=0;
function ambInit(){for(let i=0;i<(GL?36:20);i++){const s=spr(0xcfc8c0,1,0,0);s.visible=false;sc.add(s);SMK.push({s,l:0,m:1,vx:0})}}
function smokeUpd(dt,t){const lit=.55+.45*(1-NIGHT);for(const c of CHIM){if(hy(c[0]-P.x,c[2]-P.z)>70)continue;c[3]-=dt;if(c[3]<=0){c[3]=.45+R()*.4;const p=SMK[smI++%SMK.length];p.l=p.m=4.5+R()*2;p.s.position.set(c[0]+(R()-.5)*.3,c[1],c[2]+(R()-.5)*.3);p.vx=.25+WX.k.wind*.8;p.s.visible=true}}
  for(const p of SMK){if(p.l<=0)continue;p.l-=dt;const k=1-p.l/p.m;p.s.position.y+=dt*(1.1-k*.5);p.s.position.x+=dt*p.vx*(.4+k);p.s.position.z+=dt*.15;const z=.9+k*3.6;p.s.scale.set(z,z,1);
    p.s.material.opacity=Math.min(1,k*6)*(1-k)*.55;p.s.material.color.setRGB(.78*lit,.75*lit,.72*lit);if(p.l<=0)p.s.visible=false}}

// ---------- rotina dos aldeões e saudações
const GREET={dia:['Bom dia, Guardião!','Que o sol guie sua lâmina.','As colheitas vão bem, graças a você.','Cuidado na estrada do leste.','Dizem que a Helga forjou algo novo.'],
  tarde:['Boa tarde! O céu está dourado hoje.','O sino da taverna já vai tocar.','Volte antes do anoitecer, viu?'],
  noite:['Boa noite... não ande sozinho por aí.','Ouvi uivos perto da paliçada.','Os mortos do cemitério andam inquietos.','Tranque bem a porta esta noite.']};
let grT=0;
function villagersUpd(dt){grT-=dt;const nt=NIGHT>.6,day=NIGHT<.3;
  for(const n of NPC){if(!n.wander)continue;n.gt=(n.gt||0)-dt;
    if(nt&&!n.hidden&&HOUSES.length){if(!n.door){let b=null,bd=1e9;for(const h of HOUSES){const d=hy(h[0]-n.x,h[1]-n.z);if(d<bd){bd=d;b=h}}n.door=b}n.tx=n.door[0];n.tz=n.door[1];n.t=5;
      if(hy(n.x-n.door[0],n.z-n.door[1])<1.4){n.hidden=1;if(hy(n.x-P.x,n.z-P.z)<30)snd(180,.08,'square')}}
    else if(day&&n.hidden){n.hidden=0;n.t=0;n.door=null}
    else if(day&&n.door){n.door=null;n.t=0}
    if(!n.hidden&&grT<=0&&n.gt<=0&&hy(n.x-P.x,n.z-P.z)<4.2){n.gt=30;grT=7;const k=NIGHT>.5?'noite':GOLD>.4?'tarde':'dia';pop(pick(GREET[k]),n.x,n.y+3.4,n.z,'#f6e8c4')}}}

// ---------- sons ambientes (sintetizados, bem baixinhos)
let asT=3;
function chirp(){const b=2600+R()*1800,n=2+(R()*4|0);for(let i=0;i<n;i++)setTimeout(()=>sweep(b,b*(1.2+R()*.3),.07,'sine',.012),i*(90+R()*60))}
function cricket(){const f=4300+R()*500;for(let i=0;i<6;i++)setTimeout(()=>snd(f,.025,'triangle'),i*45)}
function croak(){sweep(150+R()*40,90,.18,'square',.02);setTimeout(()=>sweep(140,80,.15,'square',.016),200)}
function owl(){sweep(420,380,.35,'sine',.025);setTimeout(()=>sweep(400,360,.5,'sine',.022),450)}
function ambSndUpd(dt){if(!au||!run||document.hidden||(typeof MUS!='undefined'&&MUS.mode=='combat'))return;asT-=dt;if(asT>0)return;asT=1.5+R()*3;
  const rid=REG[regionAt(P.x,P.z)].id,rain=WX.k.rain>.4;if(rid=='cald'||rain)return;
  if(rid=='mang'&&R()<.6){croak();return}
  if(NIGHT>.5){if(R()<.85)cricket();else if(rid=='mata'||rid=='flor')owl()}else if(R()<.7)chirp()}

function ambienceUpd(dt,t){smokeUpd(dt,t);if(!run)return;villagersUpd(dt);ambSndUpd(dt)}
