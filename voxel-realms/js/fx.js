'use strict';
/* =============================================================================
   VOXEL REALMS · efeitos
   partículas instanciadas, brilhos, poeira, anéis e alertas no chão, feixes de
   saque, números de dano, rastro da arma, halos de lampiões e ambiente por região
   ============================================================================= */
let SHK=0,HITSTOP=0;
// ---------- cubinhos (1 chamada de desenho para todos)
const PN=Math.round(420*GFX.fx+80),PIM=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),new THREE.MeshBasicMaterial({vertexColors:false}),PN);PIM.frustumCulled=false;PIM.instanceMatrix.setUsage(THREE.DynamicDrawUsage);sc.add(PIM);
const PA=[];for(let i=0;i<PN;i++){PA.push({l:0,x:0,y:0,z:0,vx:0,vy:0,vz:0,s:.2,g:9,r:0});PIM.setColorAt(i,_col.setHex(0xffffff))}let pIx=0;
function fx(x,y,z,c,n,sp,sz,up,grav){n=Math.ceil(n*GFX.fx);for(let i=0;i<n;i++){const p=PA[pIx];PIM.setColorAt(pIx,_col.setHex(c));pIx=(pIx+1)%PN;p.l=p.m=.45+R()*.45;p.x=x;p.y=y;p.z=z;p.vx=(R()-.5)*sp;p.vy=R()*sp*(up==null?1:up)+1;p.vz=(R()-.5)*sp;p.s=sz||.2;p.g=grav==null?9:grav;p.r=R()*6}PIM.instanceColor.needsUpdate=true}
function fxUpdP(dt){for(let i=0;i<PN;i++){const p=PA[i];if(p.l<=0){if(p.s){p.s=0;_m4.makeScale(0,0,0);PIM.setMatrixAt(i,_m4)}continue}p.l-=dt;p.vy-=p.g*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.z+=p.vz*dt;
  const k=Math.max(0,Math.min(1,p.l*3)),s=p.s*k;p.r+=dt*4;_qu.setFromAxisAngle(_nv.set(.6,.8,0),p.r);_m4.compose(_pv.set(p.x,p.y,p.z),_qu,_sv.set(s,s,s));PIM.setMatrixAt(i,_m4);if(p.l<=0)p.s=1}PIM.instanceMatrix.needsUpdate=true}
// ---------- sprites: brilho aditivo e poeira
function spr(c,s,o,add){const m=new THREE.Sprite(new THREE.SpriteMaterial({map:SPR,color:c,transparent:true,depthWrite:false,opacity:o==null?1:o,blending:add===0?THREE.NormalBlending:THREE.AdditiveBlending}));m.scale.set(s,s,1);return m}
const FLS=[],PUF=[];for(let i=0;i<24;i++){const s=spr(0xffffff,1,1);s.visible=false;sc.add(s);FLS.push({s,l:0,m:1,z:1})}for(let i=0;i<30;i++){const s=spr(0xffffff,1,.5,0);s.visible=false;sc.add(s);PUF.push({s,l:0,m:1,z:1})}
let fli=0,pfi=0;
function flash(x,y,z,c,sz,l){const f=FLS[fli++%FLS.length];f.l=f.m=l||.25;f.z=sz||2;f.s.material.color.setHex(c);f.s.position.set(x,y,z);f.s.visible=true}
function puff(x,y,z,c,sz){const p=PUF[pfi++%PUF.length];p.l=p.m=.55+R()*.25;p.z=sz||1;p.s.material.color.setHex(c);p.s.position.set(x+(R()-.5)*.3,y,z+(R()-.5)*.3);p.s.visible=true}
// ---------- anéis, alertas de área (estilo Diablo) e feixes de saque
const RGG=new THREE.RingGeometry(.86,1,40),DSK=new THREE.CircleGeometry(1,40),RG=[];
function ring(x,z,r,c,t,grow){const m=new THREE.Mesh(RGG,new THREE.MeshBasicMaterial({color:c,transparent:true,side:2,depthWrite:false,blending:THREE.AdditiveBlending}));m.rotation.x=-PI/2;m.position.set(x,groundAt(x,z)+.12,z);sc.add(m);RG.push({m,t,mx:t,r,grow:grow!==0})}
const TEL=[];
function tele(x,z,r,t,cb,c){const g=new THREE.Group(),o=new THREE.Mesh(RGG,new THREE.MeshBasicMaterial({color:c||0xff3a1a,transparent:true,side:2,depthWrite:false})),f=new THREE.Mesh(DSK,new THREE.MeshBasicMaterial({color:c||0xff3a1a,transparent:true,opacity:.28,side:2,depthWrite:false}));
  g.add(o,f);g.rotation.x=-PI/2;g.position.set(x,groundAt(x,z)+.14,z);g.scale.setScalar(r);sc.add(g);const T={g,f,o,t,mx:t,cb,x,z,r};TEL.push(T);return T}
function fxUpdR(dt){for(let i=RG.length-1;i>=0;i--){const o=RG[i];o.t-=dt;const k=1-o.t/o.mx;o.m.scale.setScalar(o.grow?o.r*(.2+.8*easeOut(k)):o.r);o.m.material.opacity=1-k;if(o.t<=0){sc.remove(o.m);o.m.material.dispose();RG.splice(i,1)}}
  for(let i=TEL.length-1;i>=0;i--){const T=TEL[i];T.t-=dt;const k=1-T.t/T.mx;T.f.scale.setScalar(k);T.o.material.opacity=.5+.5*S(k*30);if(T.t<=0){sc.remove(T.g);T.f.material.dispose();T.o.material.dispose();TEL.splice(i,1);T.cb&&T.cb(T)}}}
const BEAMG=new THREE.CylinderGeometry(.35,.6,30,8,1,true);
function beam(x,z,c){const m=new THREE.Mesh(BEAMG,new THREE.MeshBasicMaterial({color:c,transparent:true,opacity:.35,depthWrite:false,blending:THREE.AdditiveBlending,side:2}));m.position.set(x,groundAt(x,z)+15,z);sc.add(m);return m}
// ---------- números de dano e textos flutuantes (DOM)
const PP=[];
function pop(t,x,y,z,c,big){let p=PP.find(p=>p.l<=0);if(!p){if(PP.length>=40)p=PP[0];else{const d=document.createElement('div');d.className='pp';document.body.appendChild(d);p={d,l:0};PP.push(p)}}
  p.d.textContent=t;p.d.style.color=c||'#fff';p.d.className='pp'+(big?' big':'');p.l=p.m=big?1.3:1;p.x=x+(R()-.5)*.5;p.y=y;p.z=z;p.vx=(R()-.5)*1.2;p.d.style.display='block'}
const _pp=new V3();
function popUpd(dt){for(const p of PP){if(p.l<=0)continue;p.l-=dt;p.y+=dt*(1.2+p.l);p.x+=p.vx*dt;_pp.set(p.x,p.y,p.z).project(cam);if(_pp.z>1||p.l<=0){p.d.style.display='none';p.l=0;continue}
  const sc_=p.l>p.m-.15?1.35:1;p.d.style.transform=`translate(${(_pp.x*.5+.5)*innerWidth}px,${(-_pp.y*.5+.5)*innerHeight}px) translate(-50%,-50%) scale(${sc_})`;p.d.style.opacity=Math.min(1,p.l*2.2)}}
// ---------- rastro da arma (fita aditiva)
const TRN=16,TRG=new THREE.BufferGeometry(),trP=new Float32Array(TRN*6),trA=new Float32Array(TRN*2),TRH=[];let trK=0;
{const ix=[];for(let i=0;i<TRN-1;i++){const a=i*2;ix.push(a,a+1,a+2,a+1,a+3,a+2)}TRG.setAttribute('position',new THREE.BufferAttribute(trP,3));TRG.setAttribute('a',new THREE.BufferAttribute(trA,1));TRG.setIndex(ix)}
const TRM=new THREE.ShaderMaterial({uniforms:{c:{value:new THREE.Color(0xfff2d0)}},vertexShader:'attribute float a;varying float va;void main(){va=a;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'uniform vec3 c;varying float va;void main(){gl_FragColor=vec4(c*va,va);}',transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide});
const TRL=new THREE.Mesh(TRG,TRM);TRL.frustumCulled=false;TRL.visible=false;sc.add(TRL);const _tb=new V3(),_tt=new V3();
function trailUpd(dt,on,hand,col){trK=on?1:Math.max(0,trK-dt*5);if(trK<=0||!hand){TRL.visible=false;TRH.length=0;return}
  hand.updateMatrixWorld(true);_tb.set(0,.3,0);_tt.set(0,1.7,0);const w=hand.children[0];if(!w){TRL.visible=false;return}w.localToWorld(_tb);w.localToWorld(_tt);TRH.unshift([_tb.x,_tb.y,_tb.z,_tt.x,_tt.y,_tt.z]);if(TRH.length>TRN)TRH.length=TRN;
  TRL.visible=true;TRM.uniforms.c.value.setHex(col);for(let i=0;i<TRN;i++){const h=TRH[Math.min(i,TRH.length-1)],k=i<TRH.length?(1-i/(TRN-1))*trK:0;trP.set(h,i*6);trA[i*2]=k*.12;trA[i*2+1]=k*.85}TRG.attributes.position.needsUpdate=TRG.attributes.a.needsUpdate=true}
// ---------- halos dos lampiões (reconstruídos quando novos lampiões carregam)
let HALO=null,haloN=-1;
function haloUpd(t){if(LAMPS.length!=haloN){haloN=LAMPS.length;if(HALO){sc.remove(HALO);HALO.geometry.dispose()}const a=new Float32Array(LAMPS.length*3),c=new Float32Array(LAMPS.length*3);LAMPS.forEach((l,i)=>{a.set([l[0],l[1],l[2]],i*3);_col.setHex(l[3]);c.set([_col.r,_col.g,_col.b],i*3)});
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(a,3));g.setAttribute('color',new THREE.BufferAttribute(c,3));HALO=new THREE.Points(g,new THREE.PointsMaterial({size:MOB?2.2:3,map:SPR,vertexColors:true,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending}));sc.add(HALO)}
  if(HALO)HALO.material.opacity=(.35+NIGHT*.6)*(.88+.08*S(t*11)+.05*S(t*29))}
// ---------- ambiente por região: pólen (dia), vaga-lumes (noite), pétalas, folhas, névoa, brasas
function pset(n,size,color,add,map,op){n=Math.max(8,Math.round(n*GFX.fx));const a=new Float32Array(n*3);for(let i=0;i<a.length;i++)a[i]=1e5;const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(a,3));
  const m=new THREE.Points(g,new THREE.PointsMaterial({size,color,map:map||SPR,transparent:true,opacity:op==null?1:op,depthWrite:false,blending:add?THREE.AdditiveBlending:THREE.NormalBlending}));m.frustumCulled=false;sc.add(m);return{a,g,m,n}}
const LEAFT=(()=>{const c=document.createElement('canvas');c.width=c.height=16;const x=c.getContext('2d');x.fillStyle='#fff';[[7,1,2,2],[5,3,6,2],[4,5,8,3],[5,8,6,2],[6,10,4,2],[7,12,2,3]].forEach(r=>x.fillRect(...r));const t=new THREE.CanvasTexture(c);t.magFilter=THREE.NearestFilter;return t})();
const AMB={mot:pset(120,.3,0xffe8a0,1),fly:pset(90,.55,0xc8ff70,1),pet:pset(80,.42,0xffb8d8,0,LEAFT,.95),leaf:pset(60,.5,0xd88a3a,0,LEAFT,.95),mist:pset(50,4.5,0xd8e4d0,0,null,.22),emb:pset(90,.42,0xff8a2a,1)};
const AMBW={mot:0,fly:0,pet:0,leaf:0,mist:0,emb:0};
function ambUpd(dt,t,px,pz){regW(px,pz,RW);const day=1-NIGHT;
  const wx=WX.k;AMBW.mot=day*(RW[0]+RW[1]+RW[2])*.9*(1-wx.rain);AMBW.fly=(NIGHT*(1-RW[5])+RW[4]*.5)*(1-wx.rain*.8);AMBW.pet=Math.min(1,RW[2]+(WX.type=='petalas'?.8:0));AMBW.leaf=Math.min(1,RW[3]+wx.wind*.4*(1-RW[5]));AMBW.mist=Math.min(1,RW[4]*.6+WXF*1.1);AMBW.emb=Math.min(1,RW[5]+wx.ash*.5);
  for(const k in AMB){const P_=AMB[k],a=P_.a,w=AMBW[k],act=Math.round(P_.n*w);P_.m.visible=act>0;if(!act)continue;
    for(let i=0;i<P_.n;i++){const j=i*3;if(i>=act){a[j+1]=1e5;continue}let x=a[j],y=a[j+1],z=a[j+2];const far=Math.abs(x-px)>24||Math.abs(z-pz)>24||y>1e4;
      if(k=='mot'){y+=dt*(.12+(i%7)*.04);x+=S(t*.7+i)*.008;if(far||y>groundAt(x,z)+8){x=px+(R()-.5)*44;z=pz+(R()-.5)*44;y=groundAt(x,z)+.3}}
      else if(k=='fly'){x+=S(t*.9+i)*.02;z+=C(t*1.1+i*1.3)*.02;y+=S(t*1.7+i)*.01;if(far){x=px+(R()-.5)*40;z=pz+(R()-.5)*40;y=groundAt(x,z)+.6+R()*2.5}}
      else if(k=='pet'||k=='leaf'){y-=dt*(.6+(i%5)*.12);x+=(S(t*.8+i)*.9+.5)*dt;z+=C(t+i*1.3)*.6*dt;if(far||y<groundAt(x,z)){x=px+(R()-.5)*40;z=pz+(R()-.5)*40;y=groundAt(x,z)+5+R()*6}}
      else if(k=='mist'){x+=dt*.4;const md=hy(x-px,z-pz);if(far||md<7){const an=R()*6.283,rr=10+R()*15;x=px+S(an)*rr;z=pz+C(an)*rr;y=Math.max(0,groundAt(x,z))+.6+R()*1.2}}
      else{y+=dt*(1.2+(i%5)*.3);x+=S(t*2+i)*.01;if(far||y>groundAt(x,z)+7){x=px+(R()-.5)*36;z=pz+(R()-.5)*36;y=groundAt(x,z)+.2}}
      a[j]=x;a[j+1]=y;a[j+2]=z}P_.g.attributes.position.needsUpdate=true}
  AMB.mist.m.material.color.copy(sc.fog.color).lerp(_cb.setHex(0xffffff),.3)}
// ---------- pássaros (bando que cruza o céu)
const BIRDS=[];{const m=new THREE.MeshBasicMaterial({color:0xf6f4ee});for(let i=0;i<9;i++){const g=new THREE.Group(),b=new THREE.Mesh(new THREE.BoxGeometry(.3,.25,.9),m);g.add(b);const w=[-1,1].map(s=>{const p=new THREE.Group(),q=new THREE.Mesh(new THREE.BoxGeometry(1.3,.08,.5),m);q.position.x=s*.65;p.add(q);g.add(p);return p});g.scale.setScalar(1.3);sc.add(g);BIRDS.push({g,w,a:R()*6,r:20+R()*25,y:22+R()*14,sp:.15+R()*.1,ox:0,oz:0})}}
function birdsUpd(dt,t,px,pz){for(const b of BIRDS){b.a+=dt*b.sp;b.ox+=(px-b.ox)*dt*.05;b.oz+=(pz-b.oz)*dt*.05;b.g.position.set(b.ox+C(b.a)*b.r,b.y+S(b.a*3)*1.5,b.oz+S(b.a)*b.r);b.g.rotation.y=Math.atan2(-S(b.a),C(b.a));const f=S(t*11+b.r)*.7;b.w[0].rotation.z=f;b.w[1].rotation.z=-f;b.g.visible=NIGHT<.6}}
function fxUpd(dt,rdt,t){fxUpdP(dt);fxUpdR(dt);popUpd(rdt);for(const f of FLS)if(f.l>0){f.l-=rdt;const k=Math.max(0,f.l/f.m);f.s.material.opacity=k;f.s.scale.setScalar(f.z*(1.25-.45*k));if(f.l<=0)f.s.visible=false}
  for(const p of PUF)if(p.l>0){p.l-=rdt;const k=Math.max(0,p.l/p.m);p.s.material.opacity=k*.45;p.s.scale.setScalar(p.z*(1.6-k));p.s.position.y+=rdt*.5;if(p.l<=0)p.s.visible=false}}
