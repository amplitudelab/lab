'use strict';
/* =============================================================================
   VOXEL REALMS · efeitos das habilidades
   Espirais, colunas de luz, estilhaços, meteoro caindo, rastros de projéteis.
   Tudo reaproveita as mesmas partículas instanciadas e poucos meshes em pool,
   então o custo é baixo mesmo em aparelhos medianos.
   ============================================================================= */
const VF=[];
function vfxAdd(t,fn,end){VF.push({t,mx:t,fn,end})}
function vfxUpd(dt){for(let i=VF.length-1;i>=0;i--){const v=VF[i];v.t-=dt;v.fn(1-Math.max(0,v.t)/v.mx,dt);if(v.t<=0){v.end&&v.end();VF.splice(i,1)}}}
// espiral que sobe (n braços, sobe 'up' metros)
function swirl(get,r,c,t,n,up,sp){vfxAdd(t,k=>{const o=get(),y=o.y+.2;for(let i=0;i<n;i++){const a=k*(sp||12)+i*TAU/n,rr=r*(1-k*.35);fx(o.x+C(a)*rr,y+k*up,o.z+S(a)*rr,c,1,.25,.1,.3,-.4)}})}
// coluna de luz (pool de 6 cilindros)
const COLG=new THREE.CylinderGeometry(1,1,1,10,1,true),COLP=[];
function column(x,z,c,h,w,t,y0){let m=COLP.find(q=>!q.visible);if(!m){if(COLP.length>=6)return;m=new THREE.Mesh(COLG,new THREE.MeshBasicMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,side:2}));m.frustumCulled=false;sc.add(m);COLP.push(m)}
  m.material.color.setHex(c);m.visible=true;const y=(y0==null?groundAt(x,z):y0)+h/2;m.position.set(x,y,z);
  vfxAdd(t,k=>{m.material.opacity=(1-k)*.55;m.scale.set(w*(1-k*.7),h,w*(1-k*.7))},()=>{m.visible=false})}
// meteoro de verdade (esfera de brasa + rastro)
const MTG=new THREE.IcosahedronGeometry(1,0),MTP=[];
function meteor(x,z,t,r){let m=MTP.find(q=>!q.visible);if(!m){m=new THREE.Mesh(MTG,new THREE.MeshBasicMaterial({color:0xff7a2a}));m.frustumCulled=false;const s=new THREE.Sprite(new THREE.SpriteMaterial({map:SPR,color:0xff9a40,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,opacity:.8}));s.scale.set(5,5,1);m.add(s);sc.add(m);MTP.push(m)}
  const y1=groundAt(x,z),ax=x+10,az=z-8,ay=y1+32;m.visible=true;m.scale.setScalar(r||1.3);
  vfxAdd(t,k=>{const e=k*k;m.position.set(lerp(ax,x,e),lerp(ay,y1,e),lerp(az,z,e));m.rotation.x+=.3;m.rotation.y+=.2;fx(m.position.x,m.position.y,m.position.z,k<.7?0xff8a1a:0xffd060,2,1.2,.3,.2,0);if(ev(2))puff(m.position.x,m.position.y,m.position.z,0x3a2a22,1.6)},()=>{m.visible=false})}
// rastro dos projéteis (inimigos e jogador)
function projTrail(p,q){const k=p.k;
  if(k=='fire'){fx(q.x,q.y,q.z,R()<.5?0xff7a1a:0xffc040,1,.7,.2,.4,-1);if(ev(4))puff(q.x,q.y,q.z,0x3a2e2a,.9)}
  else if(k=='orb'){fx(q.x,q.y,q.z,p.c,1,.5,.11,.3,0);if(ev(3))fx(q.x,q.y,q.z,0xffffff,1,1.2,.05,.2,0)}
  else if(k=='arrow')fx(q.x,q.y,q.z,0xfff2c0,1,.2,.05,0,0);
  else fx(q.x,q.y,q.z,p.c,1,.3,.14,0,0)}
// ---------- habilidades (visual extra por cima do que já existe)
function skillFx(id,a,r,fx0,fz0){const pl=()=>({x:P.x,y:P.y,z:P.z});
  if(id=='grito'){column(P.x,P.z,0xffd34a,10,1.4,.6);ring(P.x,P.z,9,0xffe08a,.8);setTimeout(()=>ring(P.x,P.z,5,0xffffff,.5),120);fx(P.x,P.y+1.2,P.z,0xffe08a,30,13,.14,.2,0);swirl(pl,2.4,0xffd34a,.7,3,2.4,9)}
  else if(id=='chama'){swirl(pl,4.8,0xff7a1a,.9,4,2.2,10);for(let i=0;i<6;i++)setTimeout(()=>{const an=i/6*TAU,x=P.x+C(an)*4.6,z=P.z+S(an)*4.6;column(x,z,0xff6a1a,5,.9,.45);fx(x,groundAt(x,z)+.3,z,0xff8a1a,10,3,.3,3,-2);flash(x,groundAt(x,z)+1,z,0xff7a20,3,.25)},i*70)}
  else if(id=='gelo'){fx(P.x,P.y+.6,P.z,0xbfe8ff,34,15,.24,1.1,14);fx(P.x,P.y+.6,P.z,0xffffff,14,9,.12,1.6,6);ring(P.x,P.z,6,0x9ae4ff,1.6,0);ring(P.x,P.z,7.4,0xd8f4ff,.7);column(P.x,P.z,0x9ae4ff,5,.8,.5);swirl(pl,4,0xe8f8ff,1.2,3,3,6)}
  else if(id=='escudo'){ring(P.x,P.z,2.6,0xb8a0ff,.7);vfxAdd(1.4,k=>{for(let i=0;i<3;i++){const an=k*11+i*2.09;fx(P.x+C(an)*1.35,P.y+1.1+S(an*2)*.45,P.z+S(an)*1.35,0xb8a0ff,1,.1,.11,0,0)}});column(P.x,P.z,0xa88aff,4.5,.9,.5)}
  else if(id=='cura'){column(P.x,P.z,0x7dff8a,6,1,.8);swirl(pl,1.3,0x9affa8,1.3,2,3.2,8);vfxAdd(1,()=>{if(ev(3))fx(P.x+(R()-.5)*1.6,P.y+.4,P.z+(R()-.5)*1.6,0xffffff,1,.4,.09,1.2,-1)});ring(P.x,P.z,4,0x7dff8a,.8)}
  else if(id=='bolafogo'){ring(fx0,fz0,1.6,0xff8a30,.3);fx(fx0,P.y+1.8,fz0,0xffc040,12,5,.14,.6,0);flash(fx0,P.y+1.8,fz0,0xffd060,3,.2)}
  else if(id=='meteoro'){const t=a.tg,x=t?t.x:P.x+S(P.f)*9,z=t?t.z:P.z+C(P.f)*9;meteor(x,z,1.05,1.5);setTimeout(()=>{column(x,z,0xff8a30,16,2.4,.7);ring(x,z,7,0xff5a1a,.9);ring(x,z,3.5,0xffd060,.5);for(let i=0;i<6;i++)puff(x+(R()-.5)*4,groundAt(x,z)+.5,z+(R()-.5)*4,0x4a3a32,3);fx(x,groundAt(x,z)+.5,z,0x3a2a22,12,12,.34,1.6,10)},1050)}}
function boltFx(b){column(b.x,b.z,0xc8e0ff,Math.max(6,16-(b.y-groundAt(b.x,b.z))),.45,.3,b.y);fx(b.x,groundAt(b.x,b.z)+.2,b.z,0xe8f4ff,8,7,.1,.4,10)}
function spinFx(){const c=EQ.arma&&EQ.arma.rar>=2?RAR[EQ.arma.rar].h:0xe8ecff;for(let i=0;i<3;i++){const a=P.f+i*2.09;fx(P.x+S(a)*2.5,P.y+1.2,P.z+C(a)*2.5,c,2,3,.11,.2,0)}fx(P.x,P.y+.2,P.z,0xcdb894,3,6,.16,.3,2)}
function leapFx(){column(P.x,P.z,0xffd8a0,6,1.8,.45);fx(P.x,P.y+.4,P.z,0xb8a888,16,13,.26,1.2,12);fx(P.x,P.y+.4,P.z,0xffe0b0,10,8,.14,1.6,8)}
function sombraFx(x0,z0,x1,z1){for(let i=0;i<10;i++){const k=i/9,x=lerp(x0,x1,k),z=lerp(z0,z1,k);fx(x,groundAt(x,z)+1+R(),z,i%2?0x9a5acf:0x4a2a6a,2,1.5,.2,.8,-1)}fx(x0,P.y+1,z0,0x7a4aaa,14,6,.2,1,0);fx(x1,groundAt(x1,z1)+1,z1,0xb07aff,14,6,.2,1,0);ring(x1,z1,2.2,0xb07aff,.4)}

// ---------- 13.1: impacto, finalização, rastro por poder e círculo mágico
const PWC={brasa:0xff8a2a,geada:0x9ae4ff,trovao2:0x9ac8ff,eco:0xc8a8ff,sangue:0xff4a5a,multi:0xffe08a,explosiva:0xffa040};
function trailCol(){const w=EQ.arma;if(!w)return 0xfff0d0;if(w.pw&&PWC[w.pw])return PWC[w.pw];return w.rar>=2?RAR[w.rar].h:0xfff0d0}
function impactFx(e,big){const y=e.y+1.1*(e.m.g.scale.y||1),c=trailCol(),dx=e.x-P.x,dz=e.z-P.z,l=hy(dx,dz)||1;
  for(let i=0;i<(big?7:4);i++){const sp=4+R()*5;fx(e.x-dx/l*.4,y,e.z-dz/l*.4,i%2?0xffffff:c,1,1.5,.07+R()*.05,.6,8)}flash(e.x-dx/l*.5,y,e.z-dz/l*.5,c,big?2.4:1.4,.12);if(big)ring(e.x,e.z,1.6,c,.25)}
function finisherFx(){const x=P.x+S(P.f)*1.6,z=P.z+C(P.f)*1.6,c=trailCol();ring(x,z,4,c,.5);ring(x,z,2.2,0xffffff,.3);column(x,z,c,4,1.2,.35);fx(x,groundAt(x,z)+.3,z,0xb8a888,14,9,.24,1,10);for(let i=0;i<5;i++)puff(x+(R()-.5)*3,groundAt(x,z)+.4,z+(R()-.5)*3,0xcdb894,2);SHK=Math.max(SHK,.5);HITSTOP=Math.max(HITSTOP,.08);snd(80,.35,'sawtooth')}
// círculo de runas sob os pés ao conjurar
const MCV=document.createElement('canvas');MCV.width=MCV.height=128;{const x=MCV.getContext('2d');x.strokeStyle='#fff';x.fillStyle='#fff';x.lineWidth=3;x.beginPath();x.arc(64,64,60,0,7);x.stroke();x.lineWidth=2;x.beginPath();x.arc(64,64,46,0,7);x.stroke();
  for(let i=0;i<6;i++){const a=i/6*6.283,b=a+2.094;x.beginPath();x.moveTo(64+Math.cos(a)*46,64+Math.sin(a)*46);x.lineTo(64+Math.cos(b)*46,64+Math.sin(b)*46);x.stroke()}x.font='bold 11px serif';x.textAlign='center';x.textBaseline='middle';const R_='ᚠᚢᚦᚨᚱᚲᚷᚹᚺᚾᛁᛃ';for(let i=0;i<12;i++){const a=i/12*6.283;x.save();x.translate(64+Math.cos(a)*53,64+Math.sin(a)*53);x.rotate(a+1.57);x.fillText(R_[i],0,0);x.restore()}}
const MCT=new THREE.CanvasTexture(MCV),MCM=new THREE.Mesh(new THREE.PlaneGeometry(1,1),new THREE.MeshBasicMaterial({map:MCT,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending}));MCM.rotation.x=-PI/2;MCM.visible=false;MCM.renderOrder=2;sc.add(MCM);
let MCt=0;function magicCircle(c,t){MCM.material.color.setHex(c);MCt=t;MCM.userData.mx=t;MCM.visible=true}
function magicUpd(dt){if(MCt<=0){MCM.visible=false;return}MCt-=dt;const k=MCt/MCM.userData.mx;MCM.position.set(P.x,groundAt(P.x,P.z)+.09,P.z);MCM.rotation.z+=dt*1.6;MCM.scale.setScalar(3.4*(1.15-k*.15));MCM.material.opacity=Math.min(1,k*3)*.85}
