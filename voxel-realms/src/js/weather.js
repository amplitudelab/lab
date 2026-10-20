'use strict';
/* =============================================================================
   VOXEL REALMS · clima
   céu limpo, nublado, chuva, tempestade (raios e trovões), neblina e chuva de
   cinzas. O clima muda com o tempo e depende da região; neblina fixa em lugares
   como o Cemitério e o Mangue. As partículas existem só ao redor do jogador.
   ============================================================================= */
const WXT={sol:{n:'Céu limpo',ic:'☀️',k:{cloud:.05}},nublado:{n:'Nublado',ic:'☁️',k:{cloud:.65}},chuva:{n:'Chuva',ic:'🌧️',k:{cloud:.85,rain:.7,wind:.6}},
  tempestade:{n:'Tempestade',ic:'⛈️',k:{cloud:1,rain:1,storm:1,wind:1}},neblina:{n:'Neblina',ic:'🌫️',k:{cloud:.5,fog:1}},cinzas:{n:'Chuva de cinzas',ic:'🌋',k:{cloud:.55,ash:1,wind:.4}},
  petalas:{n:'Brisa de pétalas',ic:'🌸',k:{cloud:.1,wind:.7}}};
// chance de cada clima por região
const WXR={vila:{sol:5,nublado:3,chuva:2,tempestade:1},plan:{sol:6,nublado:2,chuva:2,tempestade:1.5},flor:{sol:5,petalas:3,nublado:1,chuva:1.5},
  mata:{sol:3,nublado:2,chuva:3,neblina:2.5,tempestade:1.5},mang:{chuva:3,neblina:4,tempestade:2,nublado:1},cald:{cinzas:6,sol:1,tempestade:2}};
const FOGZ=[{x:-119.3,z:-211.7,r:46,k:.85},{x:-293,z:48.3,r:70,k:.4},{x:4.7,z:-305.7,r:30,k:.3}];
const WX={type:'sol',t:60,k:{cloud:0,rain:0,storm:0,fog:0,ash:0,wind:0},lt:6,fl:0,reg:'vila'};
function wxPick(reg){const T=WXR[reg]||WXR.vila;let s=0;for(const k in T)s+=T[k];let r=R()*s;for(const k in T){r-=T[k];if(r<=0)return k}return'sol'}
function wxSet(type,quiet){if(WX.type==type)return;WX.type=type;WX.t=90+R()*120;if(!quiet&&run)toast(WXT[type].ic,WXT[type].n,'')}
// ---------- chuva / cinzas: caixinhas instanciadas num volume ao redor da câmera
const RN=Math.round(GFX.fx*300+60),RIM=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),new THREE.MeshBasicMaterial({color:0xc8dcf0,transparent:true,opacity:.45,depthWrite:false}),RN);RIM.frustumCulled=false;RIM.instanceMatrix.setUsage(THREE.DynamicDrawUsage);sc.add(RIM);
const RD=[];for(let i=0;i<RN;i++)RD.push({x:0,y:-999,z:0,v:0,on:0});
const _wq=new THREE.Quaternion(),_wv=new V3(),_ws=new V3();
function rainUpd(dt,px,py,pz){const k=WX.k,sn=k.snow||0,sa=k.sand||0,amt=Math.max(k.rain,k.ash,sn,sa),n=Math.round(RN*amt),ash=Math.max(k.ash,sn,sa)>k.rain,wind=k.wind;RIM.visible=n>0;if(!n)return;
  RIM.material.color.setHex(ash?(sn>.3?0xf4f8ff:sa>.3?0xd8b880:0x6a5a54):NIGHT>.5?0x8a9ab8:0xc8dcf0);RIM.material.opacity=ash?(sn>.3?.9:.75):.42;
  _wq.setFromAxisAngle(_wv.set(1,0,0),ash?0:wind*.35);
  for(let i=0;i<RN;i++){const d=RD[i];if(i>=n){if(d.on){d.on=0;_m4.makeScale(0,0,0);RIM.setMatrixAt(i,_m4)}continue}
    if(!d.on||d.y<groundAt(d.x,d.z)-.2||Math.abs(d.x-px)>18||Math.abs(d.z-pz)>18){if(d.on&&!ash&&R()<.25&&hy(d.x-px,d.z-pz)<10)fx(d.x,groundAt(d.x,d.z)+.05,d.z,0xd8e8ff,1,1.2,.06,.6,4);d.on=1;d.x=px+(R()-.5)*34;d.z=pz+(R()-.5)*34;d.y=py+6+R()*14;d.v=ash?(sa>.3?.5+R()*.4:sn>.3?1.6+R():1.2+R()):18+R()*6}
    d.y-=d.v*dt;d.z+=wind*(ash?(sa>.3?11:sn>.3?2.4:1.5):6)*dt;if(ash)d.x+=S(d.y+i)*.02;
    _m4.compose(_ws.set(d.x,d.y,d.z),_wq,ash?_wv.set(.12,.12,.12):_wv.set(.035,.9,.035));RIM.setMatrixAt(i,_m4)}RIM.instanceMatrix.needsUpdate=true}
// ---------- raios
const BOLTM=new THREE.MeshBasicMaterial({color:0xe8f0ff,transparent:true,opacity:1,depthWrite:false,blending:THREE.AdditiveBlending});let BOLT=null,boltT=0;
function lightning(px,pz){const a=R()*TAU,r=25+R()*45,x=px+C(a)*r,z=pz+S(a)*r,k=new Bake();let y=60,cx=x,cz=z;const gy=groundAt(x,z);
  while(y>gy){const ny=y-4-R()*4,nx=cx+(R()-.5)*5,nz=cz+(R()-.5)*5,L=hy(nx-cx,ny-y,nz-cz);k.box(.35,L,.35,(cx+nx)/2,(y+ny)/2,(cz+nz)/2,0xffffff,{rz:Math.atan2(nx-cx,y-ny),rx:-Math.atan2(nz-cz,y-ny)});cx=nx;cz=nz;y=ny}
  if(BOLT){sc.remove(BOLT);BOLT.geometry.dispose()}BOLT=new THREE.Mesh(k.geo(),BOLTM);sc.add(BOLT);boltT=.22;WX.fl=1;$('lt').classList.remove('on');void $('lt').offsetWidth;$('lt').classList.add('on');
  const dist=r/340;setTimeout(()=>thunder(r),dist*1000+100);if(r<35)fx(cx,gy+.5,cz,0xe8f0ff,20,8,.2,1.5)}
function thunder(r){try{au=au||new AudioContext();const n=au.sampleRate*2.2,b=au.createBuffer(1,n,au.sampleRate),d=b.getChannelData(0);let v=0;for(let i=0;i<n;i++){v=v*.97+(R()*2-1)*.03;d[i]=v*Math.pow(1-i/n,2)*(i<n*.08?i/(n*.08):1)*6}
  const s=au.createBufferSource(),f=au.createBiquadFilter(),g=au.createGain();f.type='lowpass';f.frequency.value=260;g.gain.value=Math.max(.15,.9-r/90);s.buffer=b;s.connect(f);f.connect(g);g.connect(au.destination);s.start()}catch(e){}}
// ---------- som de chuva contínuo (ruído filtrado)
let RAINS=null;
function rainSound(k){try{if(!au||!run)return;if(!RAINS){const n=au.sampleRate*2,b=au.createBuffer(1,n,au.sampleRate),d=b.getChannelData(0);for(let i=0;i<n;i++)d[i]=R()*2-1;const s=au.createBufferSource(),f=au.createBiquadFilter(),g=au.createGain();s.buffer=b;s.loop=true;f.type='bandpass';f.frequency.value=1800;f.Q.value=.6;g.gain.value=0;s.connect(f);f.connect(g);g.connect(au.destination);s.start();RAINS=g}
  RAINS.gain.value+=(k*.07-RAINS.gain.value)*.05}catch(e){}}
// ---------- atualização e aplicação no céu, luz e névoa
let WXF=0;
function wxUpd(dt,px,pz){const reg=REG[regionAt(px,pz)].id;if(reg!=WX.reg){WX.reg=reg;WX.t=Math.min(WX.t,6+R()*6)}
  WX.t-=dt;if(WX.t<=0)wxSet(wxPick(WX.reg));const T=WXT[WX.type].k;
  for(const k in WX.k){WX.k[k]+=((T[k]||0)-WX.k[k])*damp(.25,dt)}
  let fz=0;for(const z of FOGZ){const d=hy(px-z.x,pz-z.z);if(d<z.r)fz=Math.max(fz,z.k*(1-sstep(z.r*.6,z.r,d))*(z.r<50?(.6+NIGHT*.4):1))}WXF+=(Math.max(fz,WX.k.fog)-WXF)*damp(.8,dt);
  if(WX.k.storm>.6){WX.lt-=dt;if(WX.lt<=0){WX.lt=3+R()*9;lightning(px,pz)}}
  WX.fl=Math.max(0,WX.fl-dt*4);if(boltT>0){boltT-=dt;BOLTM.opacity=Math.max(0,boltT/.22)*(R()<.7?1:.3);if(boltT<=0&&BOLT){sc.remove(BOLT);BOLT.geometry.dispose();BOLT=null}}
  SHU.uW.value=1+WX.k.wind*1.8;rainSound(WX.k.rain);rainUpd(dt,px,P.y,pz);
  AMB.mist.n&&(AMBW.mist=Math.max(AMBW.mist,WXF*1.2))}
function wxApply(){const k=WX.k,cv=Math.min(1,k.cloud),f=WXF;SKU.cv.value=cv;SKU.fl.value=WX.fl*.6;
  SUN.intensity*=1-cv*.62;HEM.intensity*=(1-cv*.2)+WX.fl*.8;CLM.color.lerp(_cb.setHex(NIGHT>.5?0x2a3040:0x7a808a),cv*.7);
  const fogC=_ca.copy(sc.fog.color);sc.fog.color.lerp(_cb.setHex(0x8a929c).multiplyScalar(1-NIGHT*.7),cv*.5+f*.4);
  const base=GFX.view*32+24;sc.fog.far=Math.max(62,base*(1-f*.5-k.rain*.22));sc.fog.near=Math.max(14,GFX.view*14*(1-f*.6-k.rain*.25));
  SKU.hor.value.lerp(sc.fog.color,f*.6);MTU.uHor.value.copy(SKU.hor.value)}
const wxIcon=()=>WXT[WX.type].ic;
