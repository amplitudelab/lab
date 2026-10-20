'use strict';
/* =============================================================================
   VOXEL REALMS · assinatura visual de cada elemento (15.1)
   Por cima dos efeitos de cada habilidade, todo elemento ganha marcas próprias:
   - círculo rúnico pintado no chão com o símbolo do elemento (chama, floco, raio,
     olho arcano, espiral de vento, folha, lua, caveira, alma, gota, espadas, escudo);
   - fogo: línguas de chama e brasas; gelo/ossos/sangue/arcano: cristais que brotam
     do chão e se partem; raio: descargas em zigue-zague vindas do céu;
     almas/ossos/noite/sombra: espíritos em espiral; aço/vigor: meia-lua dourada e
     pedregulhos voando; vento/natureza: lâminas de vento e folhas.
   ============================================================================= */
const SIG={tex:{},rc:[],sh:[],bl:[],fl:[],wi:[],cr:[],db:[]};
const elC=(ek,i)=>new THREE.Color((ELM[ek]||ELM.aco).r[i]).getHex();
// ---------- textura do círculo rúnico por elemento (desenhada uma vez)
function sigTex(ek){if(SIG.tex[ek])return SIG.tex[ek];const N=256,c=document.createElement('canvas');c.width=c.height=N;const x=c.getContext('2d'),h=N/2;x.translate(h,h);x.strokeStyle='#fff';x.fillStyle='#fff';x.lineCap='round';x.lineJoin='round';
  const circ=(r,w,a)=>{x.globalAlpha=a||1;x.lineWidth=w;x.beginPath();x.arc(0,0,r,0,TAU);x.stroke()};circ(122,5);circ(110,2,.8);circ(70,3);circ(62,1.5,.6);
  // runas: traços curtos entre os anéis
  x.globalAlpha=.9;x.lineWidth=3;for(let i=0;i<20;i++){const a=i/20*TAU;x.save();x.rotate(a);const t=i%4;x.beginPath();if(t==0){x.moveTo(0,-100);x.lineTo(0,-82);x.moveTo(-6,-92);x.lineTo(6,-92)}else if(t==1){x.moveTo(-6,-100);x.lineTo(0,-82);x.lineTo(6,-100)}else if(t==2){x.arc(0,-91,7,0,TAU)}else{x.moveTo(-5,-98);x.lineTo(5,-84);x.moveTo(5,-98);x.lineTo(-5,-84)}x.stroke();x.restore()}
  // estrela de 6 pontas ligando o anel interno
  x.lineWidth=2;x.globalAlpha=.7;x.beginPath();for(let i=0;i<7;i++){const a=i/6*TAU*2;x[i?'lineTo':'moveTo'](S(a)*62,-C(a)*62)}x.stroke();
  // símbolo do elemento no centro
  x.globalAlpha=1;x.lineWidth=5;x.beginPath();const P_=(pts)=>{pts.forEach((p,i)=>x[i?'lineTo':'moveTo'](p[0],p[1]))};
  switch(ek){case 'fogo':P_([[0,-38],[16,-8],[10,8],[22,2],[16,28],[0,40],[-16,28],[-22,2],[-10,8],[-16,-8],[0,-38]]);x.fill();break;
    case 'gelo':for(let i=0;i<6;i++){x.save();x.rotate(i/6*TAU);x.moveTo(0,0);x.lineTo(0,-40);x.moveTo(-10,-28);x.lineTo(0,-20);x.lineTo(10,-28);x.restore()}x.stroke();break;
    case 'raio':P_([[8,-42],[-14,4],[2,4],[-8,42],[16,-6],[0,-6],[8,-42]]);x.fill();break;
    case 'arcano':x.ellipse(0,0,36,18,0,0,TAU);x.stroke();x.beginPath();x.arc(0,0,9,0,TAU);x.fill();break;
    case 'vento':for(let i=0;i<3;i++){x.moveTo(-34,-16+i*16);x.bezierCurveTo(-8,-30+i*16,12,-2+i*16,34,-16+i*16)}x.stroke();break;
    case 'natur':P_([[0,40],[0,-6]]);x.stroke();x.beginPath();x.ellipse(0,-14,16,28,0,0,TAU);x.stroke();break;
    case 'sombra':case 'noite':x.arc(0,0,32,0,TAU);x.fill();x.globalCompositeOperation='destination-out';x.beginPath();x.arc(14,-8,28,0,TAU);x.fill();x.globalCompositeOperation='source-over';break;
    case 'osso':x.arc(0,-8,24,0,TAU);x.fill();x.globalCompositeOperation='destination-out';x.beginPath();x.arc(-9,-10,7,0,TAU);x.arc(9,-10,7,0,TAU);x.fill();x.globalCompositeOperation='source-over';x.fillRect(-14,12,28,12);break;
    case 'alma':x.arc(0,-10,20,PI,0);x.lineTo(20,30);x.lineTo(10,22);x.lineTo(0,30);x.lineTo(-10,22);x.lineTo(-20,30);x.closePath();x.stroke();break;
    case 'sangue':P_([[0,-38],[18,6],[14,24],[0,32],[-14,24],[-18,6],[0,-38]]);x.fill();break;
    case 'vigor':P_([[0,-36],[28,-24],[24,14],[0,36],[-24,14],[-28,-24],[0,-36]]);x.stroke();break;
    default:x.save();x.rotate(.7);x.fillRect(-4,-40,8,80);x.restore();x.save();x.rotate(-.7);x.fillRect(-4,-40,8,80);x.restore()}
  const t=new THREE.CanvasTexture(c);SIG.tex[ek]=t;return t}
const _sgPlane=new THREE.PlaneGeometry(1,1);
function sigPool(arr,mk){let o=arr.find(q=>!q.visible);if(!o){if(arr.length>=24)return null;o=mk();arr.push(o);sc.add(o)}o.visible=true;return o}
// ---------- círculo rúnico no chão (gira, cresce e some)
function runeCircle(x,z,ek,r,t,y){const m=sigPool(SIG.rc,()=>{const q=new THREE.Mesh(_sgPlane,new THREE.MeshBasicMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,side:2}));q.rotation.x=-PI/2;q.renderOrder=2;return q});if(!m)return;
  m.material.map=sigTex(ek);m.material.color.setHex(elC(ek,4));m.material.needsUpdate=true;m.position.set(x,(y==null?groundAt(x,z):y)+.07,z);m.userData={t:0,l:t||1.2,r:r||3,sp:(R()<.5?1:-1)*1.2}}
// ---------- cristais que brotam do chão (gelo, ossos, sangue, arcano, natureza)
const _shG=(()=>{const g=new THREE.ConeGeometry(.22,1,4);g.translate(0,.5,0);return g})();
function shards(x,z,ek,n,r,h){const c1=elC(ek,3),c2=elC(ek,5);for(let i=0;i<n;i++){const m=sigPool(SIG.sh,()=>new THREE.Mesh(_shG,new THREE.MeshLambertMaterial({emissive:0x000000})));if(!m)return;const a=i/n*TAU+R()*.5,d=r*(.35+R()*.65);
    m.material.color.setHex(i%3?c1:c2);m.material.emissive.setHex(elC(ek,2));m.position.set(x+C(a)*d,groundAt(x+C(a)*d,z+S(a)*d)-.1,z+S(a)*d);m.rotation.set((R()-.5)*.6,R()*TAU,(R()-.5)*.6);m.userData={t:-i*.02,l:.9+R()*.3,h:(h||1.3)*(.6+R()*.7)};m.scale.set(1,.01,1)}}
// ---------- descarga elétrica em zigue-zague (do céu até o alvo, com galhos)
const _blG=new THREE.BoxGeometry(1,1,1);
function bolt(x0,y0,z0,x1,y1,z1,c,w){const pts=[[x0,y0,z0]],n=7;for(let i=1;i<n;i++){const k=i/n;pts.push([lerp(x0,x1,k)+(R()-.5)*1.2,lerp(y0,y1,k)+(R()-.5)*.6,lerp(z0,z1,k)+(R()-.5)*1.2])}pts.push([x1,y1,z1]);
  for(let i=0;i<pts.length-1;i++){const a=pts[i],b=pts[i+1],m=sigPool(SIG.bl,()=>new THREE.Mesh(_blG,new THREE.MeshBasicMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending})));if(!m)return;
    const dx=b[0]-a[0],dy=b[1]-a[1],dz=b[2]-a[2],L=Math.hypot(dx,dy,dz);m.material.color.setHex(c);m.position.set((a[0]+b[0])/2,(a[1]+b[1])/2,(a[2]+b[2])/2);m.scale.set(w||.12,L,w||.12);m.quaternion.setFromUnitVectors(_rup,_rv.set(dx/L,dy/L,dz/L));m.userData={t:0,l:.22+R()*.08,o:1}}
  if(R()<.8&&pts.length>3){const a=pts[3];bolt(a[0],a[1],a[2],a[0]+(R()-.5)*3,a[1]-1.5-R(),a[2]+(R()-.5)*3,c,(w||.12)*.6)}}
// ---------- língua de chama (sprite que sobe, estica e apaga)
const FIRET=(()=>{const c=document.createElement('canvas');c.width=32;c.height=64;const x=c.getContext('2d'),g=x.createRadialGradient(16,46,2,16,40,26);g.addColorStop(0,'rgba(255,255,230,1)');g.addColorStop(.3,'rgba(255,200,90,.9)');g.addColorStop(.7,'rgba(255,90,20,.5)');g.addColorStop(1,'rgba(120,20,0,0)');
  x.fillStyle=g;x.beginPath();x.moveTo(16,2);x.bezierCurveTo(30,26,30,58,16,62);x.bezierCurveTo(2,58,2,26,16,2);x.fill();return new THREE.CanvasTexture(c)})();
function flames(x,z,n,r,c){for(let i=0;i<n;i++){const s=sigPool(SIG.fl,()=>new THREE.Sprite(new THREE.SpriteMaterial({map:FIRET,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending})));if(!s)return;const a=R()*TAU,d=R()*r;
    s.material.color.setHex(c||0xffffff);s.position.set(x+C(a)*d,groundAt(x+C(a)*d,z+S(a)*d)+.4,z+S(a)*d);s.userData={t:-R()*.25,l:.55+R()*.35,w:.6+R()*.5,vy:1.5+R()*2}}}
// ---------- espíritos em espiral (almas, ossos, noite, sombra)
function wisps(x,y,z,c,n,up){for(let i=0;i<n;i++){const s=sigPool(SIG.wi,()=>new THREE.Sprite(new THREE.SpriteMaterial({map:SPR,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending})));if(!s)return;
    s.material.color.setHex(c);s.userData={t:-i*.05,l:1.1+R()*.5,x,y,z,a:R()*TAU,r:.6+R()*1.2,up:up==null?3:up,sp:(R()<.5?1:-1)*(4+R()*3)};s.scale.setScalar(.01)}}
// ---------- meia-lua de impacto (aço, vigor, vento, noite)
const _crG=new THREE.RingGeometry(.8,1,28,1,0,PI);
function crescent(x,y,z,f,c,r){const m=sigPool(SIG.cr,()=>new THREE.Mesh(_crG,new THREE.MeshBasicMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,side:2})));if(!m)return;
  m.material.color.setHex(c);m.position.set(x,y,z);m.rotation.order='YXZ';m.rotation.set(-PI/2+(R()-.5)*.6,f+PI,0);m.userData={t:0,l:.35,r:r||2.4}}
// ---------- pedregulhos voando (golpes pesados)
const _dbG=new THREE.BoxGeometry(.22,.22,.22);
function debris(x,z,n,c){for(let i=0;i<n;i++){const m=sigPool(SIG.db,()=>new THREE.Mesh(_dbG,new THREE.MeshLambertMaterial()));if(!m)return;const a=R()*TAU,s=2+R()*4;m.material.color.setHex(c||0x7a6a52);
    m.position.set(x,groundAt(x,z)+.2,z);m.userData={t:0,l:1.1,vx:C(a)*s,vz:S(a)*s,vy:5+R()*5,av:(R()-.5)*14};m.scale.setScalar(.6+R()*.8)}}
// ---------- quadro a quadro
function sigUpd(dt){
  for(const m of SIG.rc)if(m.visible){const u=m.userData;u.t+=dt;const k=u.t/u.l;if(k>=1){m.visible=false;continue}const e=easeOut(Math.min(1,k*3));m.scale.set(u.r*2*e,u.r*2*e,1);m.rotation.z+=u.sp*dt;m.material.opacity=Math.min(1,(1-k)*2.2)*.95}
  for(const m of SIG.sh)if(m.visible){const u=m.userData;u.t+=dt;if(u.t<0)continue;const k=u.t/u.l;if(k>=1){m.visible=false;continue}const up=easeOut(Math.min(1,k*6)),dn=k>.7?(k-.7)/.3:0;m.scale.set(1-dn*.7,Math.max(.01,u.h*up*(1-dn)),1-dn*.7);
    if(k>.7&&R()<.2)fx(m.position.x,m.position.y+.4,m.position.z,m.material.color.getHex(),2,2.5,.1,.8,8)}
  for(const m of SIG.bl)if(m.visible){const u=m.userData;u.t+=dt;if(u.t>=u.l){m.visible=false;continue}m.material.opacity=(1-u.t/u.l)*(R()<.3?.5:1)}
  for(const s of SIG.fl)if(s.visible){const u=s.userData;u.t+=dt;if(u.t<0){s.scale.setScalar(.01);continue}const k=u.t/u.l;if(k>=1){s.visible=false;continue}s.position.y+=u.vy*dt;const w=u.w*S(Math.min(1,k*1.4)*PI*.5+.2)*(1-k*.4);s.scale.set(w,w*1.9*(1+k*.6),1);s.material.opacity=1-k}
  for(const s of SIG.wi)if(s.visible){const u=s.userData;u.t+=dt;if(u.t<0)continue;const k=u.t/u.l;if(k>=1){s.visible=false;continue}const a=u.a+u.sp*u.t,r=u.r*(1-k*.6);s.position.set(u.x+C(a)*r,u.y+u.up*k+.4,u.z+S(a)*r);s.scale.setScalar(.55*S(k*PI)+.05);s.material.opacity=S(k*PI)}
  for(const m of SIG.cr)if(m.visible){const u=m.userData;u.t+=dt;const k=u.t/u.l;if(k>=1){m.visible=false;continue}const s=u.r*(.4+easeOut(k)*.9);m.scale.set(s,s,1);m.material.opacity=1-k}
  for(const m of SIG.db)if(m.visible){const u=m.userData;u.t+=dt;if(u.t>=u.l){m.visible=false;continue}u.vy-=22*dt;m.position.x+=u.vx*dt;m.position.z+=u.vz*dt;m.position.y=Math.max(groundAt(m.position.x,m.position.z)+.1,m.position.y+u.vy*dt);m.rotation.x+=u.av*dt;m.rotation.z+=u.av*.7*dt;if(u.t>.8)m.scale.multiplyScalar(.9)}}
const _fxUpd16=fxUpd;fxUpd=function(dt,rdt,t){_fxUpd16(dt,rdt,t);sigUpd(dt)};
// ---------- assinatura por elemento: no lançamento e no impacto
function sigCast(id){const ek=skEl(id);if(['aco','vigor'].includes(ek)&&id!='grito')return;runeCircle(P.x,P.z,ek,id=='grito'?4:2.2,.9)}
function sigHit(id,x,z){const ek=skEl(id),y=groundAt(x,z),c3=elC(ek,3),c4=elC(ek,4);
  switch(ek){case 'fogo':flames(x,z,14,2.2);runeCircle(x,z,ek,2.6,.8);break;
    case 'gelo':shards(x,z,ek,9,2.6,1.5);runeCircle(x,z,ek,3,1);break;
    case 'raio':for(let i=0;i<3;i++)setTimeout(()=>{bolt(x+(R()-.5)*2,y+12,z+(R()-.5)*2,x+(R()-.5),y+.3,z+(R()-.5),c4,.14);flash(x,y+1,z,0xe0ecff,4,.15)},i*70);break;
    case 'arcano':runeCircle(x,z,ek,2.8,1.1);shards(x,z,ek,5,1.6,1.1);wisps(x,y,z,c4,6,2);break;
    case 'vento':for(let i=0;i<3;i++)crescent(x,y+.6+i*.5,z,P.f+i*.6,c4,2+i*.6);fx(x,y+.6,z,0x8ad84a,8,6,.1,.6,2);break;
    case 'natur':shards(x,z,ek,6,1.8,1);fx(x,y+.6,z,0x7ad84a,10,5,.12,.8,4);break;
    case 'sombra':case 'noite':wisps(x,y,z,c4,10,1.5);crescent(x,y+1,z,P.f,c3,2.2);break;
    case 'osso':shards(x,z,ek,8,2.2,1.2);wisps(x,y,z,0x7dff9a,5,2.4);break;
    case 'alma':wisps(x,y,z,c4,12,3.2);runeCircle(x,z,ek,2.4,1);break;
    case 'sangue':shards(x,z,ek,7,2,1.1);wisps(x,y,z,c3,6,1.2);break;
    case 'vigor':crescent(x,y+.8,z,P.f,c4,3);debris(x,z,5,0x8a7a62);break;
    default:crescent(x,y+.9,z,P.f,0xffe08a,2.6);debris(x,z,6)}}
const _useSkill16=useSkill;useSkill=function(slot){const id=P.bar[slot],was=P.act,cd=id&&P.cd[id];_useSkill16(slot);if(id&&P.cd[id]!==cd&&P.cd[id]>0)sigCast(id)};
// habilidades em volta do herói acontecem nele; as de alvo esperam o projétil chegar
const SIGSELF=new Set(['grito','pele','vital','gelo','chama','escudo','cura','mente','frenesi','nevoa','senhor','pacto','aljava','agil','sede','noturno','colheita']);
const _skillHit16=skillHit;skillHit=function(){const a=P.act,id=a&&a.sk;const r=_skillHit16.apply(this,arguments);if(id&&SK[id]){
  if(SIGSELF.has(id))sigHit(id,P.x,P.z);else{const t=a.tg&&!a.tg.dead?a.tg:null,d=t?hy(t.x-P.x,t.z-P.z):0;if(t&&d>3)setTimeout(()=>sigHit(id,t.x,t.z),Math.min(900,d/22*1000));else sigHit(id,t?t.x:P.x+S(P.f)*2.6,t?t.z:P.z+C(P.f)*2.6)}}return r};
