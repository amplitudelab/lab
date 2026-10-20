'use strict';
/* =============================================================================
   VOXEL REALMS · morte com ragdoll (15.1)
   O corpo é arremessado na direção do golpe (mais longe com golpe pesado), tomba
   girando pelos pés, quica no chão e os membros balançam soltos (molas frouxas)
   até assentar. Nenhuma parte atravessa o chão: o ponto mais baixo do corpo é
   mantido em cima do terreno. O corpo fica caído ~10 s (no máximo 14 corpos ao
   mesmo tempo) e então se desfaz em poeira e luz, sem sumir de uma vez.
   ============================================================================= */
const RAG={n:0,max:14},_rq=new THREE.Quaternion(),_rq2=new THREE.Quaternion(),_rv=new V3(),_rup=new V3(0,1,0),_rp=new V3();
// pontos usados para achar o ponto mais baixo de cada tipo de corpo
const RPTS={quad:[['body',0,-.35,.7],['body',0,-.35,-.7],['body',.4,.1,0],['body',-.4,.1,0],['body',0,.45,0],['neck',0,0,.6]],
  spider:[['body',0,-.3,.3],['body',0,-.3,-.9],['body',.7,.2,-.7],['body',-.7,.2,-.7],['body',0,.8,-.7]]};
function ragLow(e){const m=e.m;if(m.kind=='hum'){const[lo]=heroSpan(m);return lo}m.g.updateMatrixWorld(true);let lo=1e9;const L=RPTS[m.kind];
  if(L){for(const p of L){const b=m[p[0]];if(!b)continue;_rp.set(p[1],p[2],p[3]).applyMatrix4(b.matrixWorld);lo=Math.min(lo,_rp.y)}
    if(m.legs)for(const l of m.legs){const lo2=l[1];if(lo2){_rp.set(0,-.6,0).applyMatrix4(lo2.matrixWorld);lo=Math.min(lo,_rp.y)}}return lo}
  m.g.traverse(o=>{if(o.isBone||o.type=='Object3D'||o.isGroup){o.getWorldPosition(_rp);lo=Math.min(lo,_rp.y-.15)}});return lo}
function ragInit(e){const m=e.m,dx=e.hero?-S(P.f):e.x-P.x,dz=e.hero?-C(P.f):e.z-P.z,d=hy(dx,dz)||1,ux=dx/d,uz=dz/d,big=e.boss||(e.t&&(e.t.r||.5)>1.1),k=big?.3:1,hv=e.rgHeavy?1.7:1;
  const r={t:0,vx:ux*(2.4+R()*2)*k*hv,vz:uz*(2.4+R()*2)*k*hv,vy:big?.5:(1.5+R()*1.8)*hv,y:e.y,a:0,av:(1.4+R()*1.4)*(big?.6:1),ax:new V3(uz,0,-ux),yaw:m.g.rotation.y,j:[],life:9+R()*3,end:0,sc:m.g.scale.x,fl:e.y};
  r.ax.applyAxisAngle(_rup,(R()-.5)*.9);
  const J=(o,key,tgt,imp)=>{if(o)r.j.push({o,key,a:o.rotation[key],v:(R()-.5)*imp,tgt})};
  if(m.kind=='hum'){J(m.sL,'x',-1.6+R()*2.4,12);J(m.sR,'x',-1.6+R()*2.4,12);J(m.sL,'z',-.9-R()*.7,9);J(m.sR,'z',.9+R()*.7,9);J(m.eL,'x',-R()*1.1,9);J(m.eR,'x',-R()*1.1,9);
    J(m.tL,'x',-.7+R()*1,7);J(m.tR,'x',-.7+R()*1,7);J(m.kL,'x',R()*1.2,7);J(m.kR,'x',R()*1.2,7);J(m.head,'x',-.6+R()*1.1,7);J(m.head,'y',(R()-.5)*1.3,7);J(m.head,'z',(R()-.5)*.6,5);
    J(m.torso,'x',-.25+R()*.5,4);J(m.torso,'y',(R()-.5)*.5,4);J(m.torso,'z',(R()-.5)*.4,4);J(m.hips,'y',0,3);if(m.cape)J(m.cape,'x',.2,6)}
  else if(m.kind=='quad'){const s=R()<.5?1:-1;r.ax.set(S(r.yaw)*s,0,C(r.yaw)*s);r.vy*=.5;for(const[u,lo]of m.legs){J(u,'x',(R()-.5)*1.3,9);J(lo,'x',.3+R()*1,9)}
    J(m.neck,'x',.2+R()*.5,6);J(m.neck,'y',(R()-.5)*1.4,6);J(m.jaw,'x',.45,6);if(m.tail)J(m.tail,'y',(R()-.5)*.9,5);if(m.tail2)J(m.tail2,'y',(R()-.5)*.9,5)}
  else if(m.kind=='spider'){r.av=0;r.vy=1.2;for(const L of m.legs){J(L[0],'z',L[2]*.9,7);J(L[1],'x',0,5);J(L[1],'z',-L[2]*1.1,7)}} // aranha morta: pernas se fecham
  else if(m.kind=='slime'){r.av=0;r.vy=0}
  else if(m.kind=='frog'){r.ax.set(S(r.yaw),0,C(r.yaw));r.av=6;r.vy=3}
  else if(m.kind=='bee'){r.av=2.5;r.vy=0}
  else if(m.kind=='drg'||m.kind=='drg2'){r.ax.set(S(r.yaw),0,C(r.yaw));r.vy=0;r.av=.7;r.vx*=.3;r.vz*=.3;r.life=20}
  e.rg=r;RAG.n++}
// por quadro: devolve true quando o corpo terminou de se desfazer
function ragUpd(e,dt){const m=e.m,g=m.g;if(!e.rg)ragInit(e);const r=e.rg;r.t+=dt;
  const gnd=Math.max(groundAt(e.x,e.z),-.75),air=r.y>gnd+.02||r.vy>0;
  // deslize e quique
  if(air){r.vy-=24*dt;r.y+=r.vy*dt}if(r.y<=gnd){r.y=gnd;if(r.vy<-3){r.vy=-r.vy*.28;puff(e.x,gnd+.2,e.z,0xb8a888,1.1)}else r.vy=0}
  const fr=air?.2:4.5;r.vx*=Math.max(0,1-fr*dt);r.vz*=Math.max(0,1-fr*dt);const nx=e.x+r.vx*dt,nz=e.z+r.vz*dt;if(walkable(nx,nz,r.y)){e.x=nx;e.z=nz}else{r.vx*=-.3;r.vz*=-.3}
  // tomba pelos pés: acelera como uma prancha caindo e quica ao bater no chão
  const tgt=m.kind=='slime'||m.kind=='spider'?0:m.kind=='frog'?PI:PI/2;
  if(tgt){r.av+=(m.kind=='frog'?0:7.5*S(Math.max(.15,r.a)))*dt;r.a+=r.av*dt;if(r.a>=tgt){r.a=tgt;if(r.av>1.2){r.av=-r.av*.3;SHK=Math.max(SHK,e.boss?.4:0)}else r.av=0}}
  _rq.setFromAxisAngle(r.ax,r.a);_rq2.setFromAxisAngle(_rup,r.yaw);g.quaternion.copy(_rq).multiply(_rq2);
  if(m.kind=='slime'){const q=Math.min(1,r.t*3);g.scale.set(r.sc*(1+.5*q),r.sc*(1-.65*q),r.sc*(1+.5*q))}
  // membros soltos (molas frouxas que endurecem com o tempo)
  const st=18+Math.min(60,r.t*40),dm=3.5+r.t*3;for(const j of r.j){j.v+=((j.tgt-j.a)*st-j.v*dm)*dt;j.a+=j.v*dt;j.o.rotation[j.key]=j.a}
  // nada atravessa o chão
  g.position.set(e.x,r.y,e.z);if(r.t<3||!r.low){const lo=ragLow(e);r.low=r.y-lo}g.position.y=r.y+Math.max(0,r.low+.02);
  // desfazer: no fim da vida (ou antes, se houver corpos demais)
  if(!r.end&&(r.t>r.life||(RAG.n>RAG.max&&r.t>2.5))){r.end=r.t;RAG.n--;fx(e.x,r.y+.6,e.z,e.t&&e.t.undead?0x9ae4ff:0xd8c8a8,10,2,.2,1.2,0)}
  if(r.end){const k=Math.min(1,(r.t-r.end)/.8),s=r.sc*(1-k*k);g.scale.setScalar(Math.max(.001,s));if(R()<.4)fx(e.x+(R()-.5),r.y+.4,e.z+(R()-.5),0xe8dcc0,1,1.2,.12,.8,0);if(k>=1)return true}
  return false}
// golpe pesado (pancada no chão, finalização) arremessa mais longe
const _kill16=killMob;killMob=function(e){e.rgHeavy=!!(P.heavyHit||(P.act&&/slam|finisher/.test(P.act.k)));return _kill16.apply(this,arguments)};
