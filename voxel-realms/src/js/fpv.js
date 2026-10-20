'use strict';
/* =============================================================================
   VOXEL REALMS · visão em primeira pessoa (opcional)
   Câmera nos olhos do herói, braços com a arma e a tocha na tela, mira no centro.
   O corpo some da tela mas continua fazendo sombra. Arrastar o dedo gira e olha
   para cima/baixo; o joystick anda na direção do olhar. Botão 👁️ ou tecla X.
   ============================================================================= */
const FPV={on:false,k:0,pitch:-.08,ph:0,vm:null,wk:'',cls:'',tt:null,armR:null,armL:null,tilt:0};
try{FPV.on=localStorage.getItem('vr11_fp')=='1'}catch(e){}
sc.add(cam);
const fpOn=()=>FPV.k>.5&&INV_OPEN.k<.1;
function fpvToggle(v){FPV.on=v==null?!FPV.on:v;try{localStorage.setItem('vr11_fp',FPV.on?'1':'0')}catch(e){}$('fpvb').classList.toggle('on',FPV.on);
  if(FPV.on){FPV.pitch=-.08;toast('👁️','Primeira pessoa','Arraste para olhar. Toque em 👁️ (ou X) para voltar.')}snd(FPV.on?700:500,.08,'sine')}
// ---------- braços e arma na tela
const VMM=new THREE.MeshLambertMaterial({vertexColors:true,map:NT}),VME=new THREE.MeshBasicMaterial({vertexColors:true});
function vmPart(parent,fn,mat){const k=new Bake();fn(k);const m=k.mesh(mat||VMM);m.frustumCulled=false;m.renderOrder=5;parent.add(m);return m}
function vmBuild(){if(FPV.vm){cam.remove(FPV.vm);FPV.vm.traverse(o=>{if(o.isMesh)o.geometry.dispose()})}
  const o=P.m.o,sl=o.sleeve||o.shirt||0x6d7684,sk=o.gloves||o.skin||0xe0a878,wk=EQ.arma?(EQ.arma.vk||EQ.arma.wk):'fist',g=new THREE.Group();g.scale.setScalar(.6);cam.add(g);FPV.vm=g;FPV.wk=wk;FPV.cls=P.cls;
  const arm=(sx)=>{const a=new THREE.Group();a.position.set(sx*.36,-.4,-.62);g.add(a);vmPart(a,k=>{k.box(.15,.15,.46,0,0,.12,sl).box(.17,.07,.17,0,0,-.1,shade(sl,.75)).box(.13,.13,.14,0,0,-.17,sk)});return a};
  FPV.armR=arm(1);FPV.armL=arm(-1);FPV.tt=null;
  const hold=new THREE.Group();hold.position.set(0,0,-.2);FPV.armR.add(hold);
  const bw=BOWS.has(wk);if(wk!='fist'&&!bw&&WPN[wk]){const w=new THREE.Group();w.rotation.x=-1.25;w.position.set(0,-.02,0);w.scale.setScalar(.34);hold.add(w);const eb=new Bake();vmPart(w,k=>WPN[wk](k,null,null,eb));const em=eb.mesh(VME);if(em){em.frustumCulled=false;em.renderOrder=5;w.add(em)}}
  FPV.off=EQ.mao2&&!ST.two?EQ.mao2.id:0;FPV.offW=null;const off=FPV.off?EQ.mao2:null;
  if(off&&off.wd&&WPN[off.vk||off.wk]){const hl=new THREE.Group();hl.position.set(0,0,-.2);FPV.armL.add(hl);const w=new THREE.Group();w.rotation.x=-1.25;w.position.set(0,-.02,0);w.scale.setScalar(.34);hl.add(w);const eb=new Bake();vmPart(w,k=>WPN[off.vk||off.wk](k,null,null,eb));const em=eb.mesh(VME);if(em){em.frustumCulled=false;em.renderOrder=5;w.add(em)}FPV.offW=hl}
  else if(off&&off.vk=='tome'){const t=new THREE.Group();t.position.set(0,.05,-.25);t.scale.setScalar(.5);FPV.armL.add(t);vmPart(t,k=>WPN.book(k,0x5a2a7a))}
  else if(off){const t=TIERS[tierOf(off)];vmPart(FPV.armL,k=>{k.box(.06,.62,.56,-.12,.06,-.18,t.lea).box(.07,.64,.07,-.12,.06,.1,t.met).box(.07,.64,.07,-.12,.06,-.46,t.met).box(.09,.16,.16,-.14,.06,-.18,t.acc)})}
  FPV.nock=null;if(bw){const b=new THREE.Group();b.position.set(wk.startsWith('xbow')?.3:0,.02,-.22);b.rotation.set(0,PI,wk.startsWith('xbow')?0:.25);b.scale.setScalar(.6);FPV.armL.add(b);const inner=new THREE.Group();inner.position.z=BOWZ(wk);b.add(inner);const eb=new Bake();vmPart(inner,k=>WPN[wk](k,null,null,eb));const em=eb.mesh(VME);if(em){em.frustumCulled=false;inner.add(em)}
    const n=nockArrow(wk);n.traverse(o=>{if(o.isMesh){o.frustumCulled=false;o.renderOrder=5;o.material=VMM}});b.add(n);FPV.nock=n;FPV.nockXb=wk.startsWith('xbow')}
  else if(!off&&!(ST.two&&!bw)){const t=new THREE.Group();t.position.set(0,.02,-.2);t.rotation.x=-.3;t.scale.setScalar(.36);FPV.armL.add(t);
    vmPart(t,k=>k.box(.1,.82,.1,0,.2,0,0x6b4423).box(.17,.24,.17,0,.62,0,0x2a1a10).box(.23,.08,.23,0,.5,0,0x4a3220));
    FPV.fl=vmPart(t,k=>k.box(.19,.22,.19,0,.84,0,0xff7a1a).box(.12,.2,.12,0,1,0,0xffc040).box(.06,.12,.06,0,1.12,0,0xfff0b0),VME);
    const s=new THREE.Sprite(new THREE.SpriteMaterial({map:SPR,color:0xff9a40,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,opacity:.5}));s.scale.set(.9,.9,1);s.position.y=.98;s.renderOrder=6;t.add(s);FPV.fs=s;FPV.tt=new THREE.Object3D();FPV.tt.position.y=1.1;t.add(FPV.tt);FPV.tg=t}}
function vmUpd(dt,t){const show=fpOn()&&run&&!P.dead;if(!show){if(FPV.vm)FPV.vm.visible=false;return}
  if(!FPV.vm||FPV.wk!=(EQ.arma?(EQ.arma.vk||EQ.arma.wk):'fist')||FPV.cls!=P.cls||FPV.off!==(EQ.mao2&&!ST.two?EQ.mao2.id:0))vmBuild();const g=FPV.vm;g.visible=true;
  FPV.sv=(FPV.sv||0)+(Math.min(1,(P.v||0)/7)-(FPV.sv||0))*Math.min(1,dt*5);const v=FPV.sv;FPV.ph+=dt*(1.5+v*7);const bx=C(FPV.ph*.5)*.01*v,by=-Math.abs(S(FPV.ph*.5))*.014*v+S(t*1.6)*.004;g.position.set(bx*.6,by*.6-(P.dash>0?.07:0),0);
  const R_=FPV.armR,L=FPV.armL,a=P.act;let rx=0,ry=0,rz=0,pz=-.62,px=.36,py=-.4;
  if(a){const p=Math.min(1,a.t/a.dur),k=a.k;
    if(k=='slashA'||k=='slashB'){const s=k=='slashA'?1:-1;ry=seq(p,0,s*.9,-s*1.1,.35,.6);rx=seq(p,0,.5,-.6,.35,.6);px=.36-seq(p,0,-.05,.35,.35,.6)*s}
    else if(k=='slam'){rx=seq(p,0,1.2,-1.1,.4,.6);py=-.4+seq(p,0,.15,-.12,.4,.6)}
    else if(k=='spin'){ry=-p*6.28*1.5;px=.2}
    else if(k=='finisher'){rx=seq(p,0,1.5,-1.3,.45,.62);py=-.4+seq(p,0,.25,-.18,.45,.62);px=.2;pz=-.62-seq(p,0,0,.15,.45,.62)}
    else if(k=='thrust'){pz=-.62-seq(p,0,-.12,.42,.3,.46);rx=seq(p,0,.15,-.25,.3,.46);px=.3}
    else if(k=='shoot'){pz=-.62+seq(p,0,.18,-.05,.55,.65)}
    else{pz=-.62-seq(p,0,.0,.25,.4,.55);rx=-seq(p,0,0,.3,.4,.55)}}
  const bw=bow(),two=ST.two&&!bw,dl=ST.dual&&a&&a.k=='slashB';L.visible=bw||TCH.on&&!handsBusy()||!!FPV.off||two;
  if(dl){R_.position.set(.36,-.4,-.62);R_.rotation.set(0,0,0);L.position.set(-px,py,pz);L.rotation.set(rx,-ry,-rz)}
  else{R_.position.set(px,py,pz);R_.rotation.set(rx,ry,rz);if(two){L.position.set(px*.2-.12,py-.04,pz+.08);L.rotation.set(rx,ry*.6,rz)}else{L.position.set(-.36,-.38+(bw?.06:0),-.62);L.rotation.set(bw?.05:.08,0,0)}}
  if(P.block>0&&ST.sh){L.position.set(-.2,-.24,-.5);L.rotation.set(.1,.5,0)}
  if(FPV.nock){const sh=a&&a.k=='shoot',pl=sh?cl(a.t/a.dur/.6,0,1):UI.atkHeld?.8:0;FPV.nock.visible=sh?a.t/a.dur<.62:UI.atkHeld||!a;FPV.nock.position.z=(FPV.nockXb?.26:.3)-pl*(FPV.nockXb?0:.4)}
  if(P.block>0){R_.position.set(.12,-.28,-.5);R_.rotation.set(.3,.9,.4)}
  if(FPV.fl){const f=.5+.3*S(t*13)+.2*S(t*23+1);FPV.fl.scale.set(1+f*.08,.9+f*.22,1+f*.08);FPV.fs.scale.setScalar(.75+f*.35);FPV.fs.material.opacity=.25+f*.2}}
// ---------- corpo invisível na tela, mas com sombra
const GHM=new Map();
function ghostMat(m){let g=GHM.get(m);if(!g){g=m.clone();if(m.onBeforeCompile)g.onBeforeCompile=m.onBeforeCompile;g.colorWrite=false;g.depthWrite=false;GHM.set(m,g)}return g}
function heroGhost(on){P.m.g.traverse(o=>{if(o.isSprite){if(on&&!o.userData.gh){o.userData.gh=1;o.userData.gv=o.visible;o.visible=false}else if(!on&&o.userData.gh){o.userData.gh=0;o.visible=o.userData.gv}return}
    if(!o.isMesh)return;if(on&&!o.userData.gh){o.userData.gh=1;o.userData.gm=o.material;o.material=ghostMat(o.material)}else if(!on&&o.userData.gh){o.userData.gh=0;o.material=o.userData.gm}})}
// ---------- câmera
const _fq=new THREE.Quaternion(),_fe=new THREE.Euler(0,0,0,'YXZ'),_fpo=new V3();
function fpvCam(dt){const tgt=FPV.on&&run?1:0;FPV.k+=(tgt-FPV.k)*Math.min(1,dt*7);if(Math.abs(FPV.k-tgt)<.002)FPV.k=tgt;
  const k=FPV.k*(1-INV_OPEN.k);heroGhost(k>.6&&run);$('xh').classList.toggle('on',k>.8&&run&&!UI.block());
  if(k<.001){if(cam.near!==.5){cam.near=.5;cam.updateProjectionMatrix()}return}
  if(run&&!P.dead&&!P.leap)P.f=CAMS.yaw+PI;                 // o corpo acompanha o olhar (andar de lado funciona)
  const v=FPV.sv||0,bob=S(FPV.ph)*.016*v;FPV.tilt+=((P.dash>0?.06:0)-FPV.tilt)*Math.min(1,dt*10);
  FPV.kick=Math.max(0,(FPV.kick||0)-dt*.5);_fpo.set(P.x,P.y+2.5+mountY()+bob-(P.dash>0&&P.dive?1.2:P.roll>0?1.1*S((1-P.roll/(P.rollD||.34))*PI)+.3:0),P.z);_fe.set(FPV.pitch+FPV.kick,CAMS.yaw,FPV.tilt+C(FPV.ph*.5)*.004*v);_fq.setFromEuler(_fe);
  cam.position.lerp(_fpo,k);cam.quaternion.slerp(_fq,k);if(SHK>.01)cam.position.add(_fpo.set((R()-.5)*SHK*.3,(R()-.5)*SHK*.3,0));
  const nf=lerp(.5,.12,k);if(Math.abs(cam.near-nf)>.01){cam.near=nf;cam.updateProjectionMatrix()}
  const ff=lerp(cam.fov,fovT()+22+(P.run&&P.v>6?5:0)+(P.dash>0?6:0),k);if(Math.abs(ff-cam.fov)>.05){cam.fov=ff;cam.updateProjectionMatrix()}
  cam.updateMatrixWorld();SHU.uCam.value.copy(cam.position);SKY.position.copy(cam.position)}

// ---------- 14.5: hack and slash em primeira pessoa — arco do corte na tela e coice da câmera ao acertar
const FSL=new THREE.Mesh(SLM.geometry,SLM.material.clone());FSL.material.depthTest=false;FSL.renderOrder=7;FSL.visible=false;FSL.frustumCulled=false;cam.add(FSL);let FSLT=0;
const _slashFx15=slashFx;slashFx=function(big){_slashFx15(big);if(!fpOn())return;SLM.visible=false;const c=trailCol(),cb=P.combo,dl=ST.dual&&cb==2;FSL.material.uniforms.c.value.setHex(c);
  FSL.position.set(dl?-.15:.15,-.18,-1.45);FSL.rotation.set(0,0,cb==4||cb==3?-PI/2+(cb==4?0:.25):dl||cb==2?PI-.55:-.55);FSL.scale.setScalar(cb==4?1.35:big?1.2:1);FSL.visible=true;FSLT=.18}
const _impact15=impactFx;impactFx=function(e,big){_impact15(e,big);if(fpOn()){FPV.kick=Math.min(.09,(FPV.kick||0)+(big?.05:.025))}};
const _vmUpd15=vmUpd;vmUpd=function(dt,t){_vmUpd15(dt,t);if(FSLT>0){FSLT-=dt;FSL.material.uniforms.o.value=Math.max(0,FSLT/.18);FSL.scale.multiplyScalar(1+dt*2.2);if(FSLT<=0||!fpOn())FSL.visible=false}};
