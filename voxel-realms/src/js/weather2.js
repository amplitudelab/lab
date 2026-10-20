'use strict';
/* =============================================================================
   VOXEL REALMS · climas por bioma (15.9)
   - 30 climas. Cada bioma tem a sua tabela: garoa, pólen dourado, brisa de
     pétalas, folhas ao vento, ventania, bruma da manhã, neblina, mormaço,
     esporos, vaga-lumes, chuva de cinzas, chuva de brasas, fumaça vulcânica,
     neve leve, nevasca, pó de diamante, aurora boreal, calor escaldante, vento
     de poeira, tempestade de areia, raios secos, brisa marinha, nevoeiro do mar,
     aurora prismática, chuva de cristais, tempestade arcana, arco-íris...
   - Chuva rara e curta: precipitação dura 40–100 s e depois o céu fica pelo menos
     4–7 minutos sem chover. Antes da chuva o céu fecha (frente de nuvens); depois,
     com sol, pode aparecer um arco-íris.
   - Mudar de região não sorteia outro clima: o atual continua se fizer sentido
     ali, ou vira o equivalente local (chuva vira neve nos Picos, some no deserto).
   - Só avisa na tela os climas marcantes; nas masmorras não há clima.
   ============================================================================= */
Object.assign(WX.k,{aur:0,bow:0,heat:0,tint:0,dust:0});
// k: canais (nuvem, chuva, tempestade, névoa, cinzas, neve, areia, vento, aurora, arco-íris, calor, tinta)
// d: duração [mín, máx] em s · p: precipitação · c: condição (dia, noite, manhã) · a: partículas do ambiente · t: cor da névoa · nt: avisa
const WX2={
  sol:{n:'Céu limpo',ic:'☀️',k:{cloud:.05},d:[240,480]},
  poucas:{n:'Poucas nuvens',ic:'🌤️',k:{cloud:.32,wind:.2},d:[200,400]},
  nublado:{n:'Nublado',ic:'☁️',k:{cloud:.7,wind:.3},d:[120,240]},
  garoa:{n:'Garoa',ic:'🌦️',k:{cloud:.75,rain:.25,wind:.2,fog:.15},d:[40,80],p:1,nt:1},
  chuva:{n:'Chuva',ic:'🌧️',k:{cloud:.9,rain:.7,wind:.5,fog:.2},d:[50,95],p:1,nt:1},
  tempestade:{n:'Tempestade',ic:'⛈️',k:{cloud:1,rain:1,storm:1,wind:1,fog:.25},d:[40,70],p:1,nt:1},
  ventania:{n:'Ventania',ic:'🌬️',k:{cloud:.45,wind:1},a:{leaf:1},d:[60,120],nt:1},
  brumamanha:{n:'Bruma da manhã',ic:'🌁',k:{cloud:.25,fog:.7},c:'manha',d:[90,180]},
  neblina:{n:'Neblina',ic:'🌫️',k:{cloud:.5,fog:1},d:[90,180],nt:1},
  mormaco:{n:'Mormaço',ic:'🌫️',k:{cloud:.5,fog:.45,heat:.4,tint:.5},t:0x8aa078,d:[90,180]},
  esporos:{n:'Esporos no ar',ic:'🍄',k:{cloud:.35,fog:.3},a:{fly:1,mot:.6},ac:{mot:0xb8ff9a,fly:0x9affc8},d:[90,180],nt:1},
  vagalumes:{n:'Noite de vaga-lumes',ic:'✨',k:{cloud:.1},a:{fly:1},c:'noite',d:[120,240],nt:1},
  polen:{n:'Pólen dourado',ic:'🌼',k:{cloud:.1,wind:.25},a:{mot:1},ac:{mot:0xffd860},c:'dia',d:[120,240],nt:1},
  petalas:{n:'Brisa de pétalas',ic:'🌸',k:{cloud:.1,wind:.7},a:{pet:1},d:[120,240],nt:1},
  folhas:{n:'Folhas ao vento',ic:'🍂',k:{cloud:.3,wind:.8},a:{leaf:1},d:[90,180],nt:1},
  cinzas:{n:'Chuva de cinzas',ic:'🌋',k:{cloud:.55,ash:1,wind:.4,tint:.5},t:0x5a4a44,d:[70,130],nt:1},
  brasas:{n:'Chuva de brasas',ic:'🔥',k:{cloud:.4,heat:.5,tint:.35},t:0xa0583a,a:{emb:1},d:[60,120],nt:1},
  fumaca:{n:'Fumaça vulcânica',ic:'💨',k:{cloud:.6,fog:.8,tint:.8},t:0x5a4840,d:[60,120],nt:1},
  neve:{n:'Neve',ic:'🌨️',k:{cloud:.7,snow:.45,wind:.2},d:[90,180],p:1,nt:1},
  nevasca:{n:'Nevasca',ic:'❄️',k:{cloud:.9,snow:1,wind:1,fog:.55,tint:.4},t:0xe8f0f8,d:[45,80],p:1,nt:1},
  diamante:{n:'Pó de diamante',ic:'💎',k:{cloud:.05},a:{mot:1},ac:{mot:0xf4fbff},c:'dia',d:[100,200],nt:1},
  aurora:{n:'Aurora boreal',ic:'🌌',k:{cloud:0,aur:1},c:'noite',d:[150,300],nt:1},
  calor:{n:'Calor escaldante',ic:'🥵',k:{cloud:0,heat:1,tint:.35},t:0xf0c890,c:'dia',d:[120,240],nt:1},
  poeira:{n:'Vento de poeira',ic:'🌪️',k:{cloud:.3,sand:.4,wind:.8,fog:.25,tint:.6},t:0xc8a070,d:[60,120],nt:1},
  areia:{n:'Tempestade de areia',ic:'🏜️',k:{cloud:.3,sand:1,wind:1,fog:.6,tint:.9},t:0xd09048,d:[40,70],p:1,nt:1},
  raiosecos:{n:'Raios secos',ic:'🌩️',k:{cloud:.8,storm:1,wind:.6},d:[40,70],p:1,nt:1},
  brisamar:{n:'Brisa marinha',ic:'🌊',k:{cloud:.2,wind:.5},d:[120,240]},
  nevoeiromar:{n:'Nevoeiro do mar',ic:'🌫️',k:{cloud:.5,fog:.9,tint:.5},t:0xa8b8c4,d:[80,160],nt:1},
  prisma:{n:'Aurora prismática',ic:'🌈',k:{cloud:.1,aur:.85},d:[120,240],nt:1},
  cristais:{n:'Chuva de cristais',ic:'💠',k:{cloud:.3},a:{pet:1,mot:.8},ac:{pet:0xb89aff,mot:0x9ae8ff},d:[60,120],nt:1},
  arcana:{n:'Tempestade arcana',ic:'🔮',k:{cloud:.9,storm:1,wind:.6,tint:.6},t:0x6a4aa0,d:[40,70],p:1,nt:1},
  estrelada:{n:'Céu estrelado',ic:'🌠',k:{cloud:0},c:'noite',d:[200,400]},
  arcoiris:{n:'Arco-íris',ic:'🌈',k:{cloud:.25,bow:1},c:'dia',d:[45,75],nt:1}};
for(const k in WX2)WXT[k]=Object.assign(WXT[k]||{},WX2[k],{k:WX2[k].k});
// tabelas por bioma (peso de cada clima)
const WXR2={vila:{sol:5,poucas:4,nublado:2,garoa:1,chuva:.6,tempestade:.2,ventania:.8,brumamanha:1.2,vagalumes:1},
  plan:{sol:5,poucas:4,nublado:1.5,garoa:.8,chuva:.5,tempestade:.3,ventania:1.5,polen:1.2,brumamanha:.8,vagalumes:.6},
  flor:{sol:4,poucas:3,petalas:2.5,polen:2,garoa:.8,chuva:.4,vagalumes:1.2,brumamanha:.6},
  mata:{sol:3,poucas:2,nublado:2,neblina:1.5,brumamanha:1.2,garoa:1,chuva:.6,tempestade:.3,folhas:1,vagalumes:1},
  mang:{nublado:2,neblina:2.5,mormaco:2,esporos:1.5,garoa:1,chuva:.7,tempestade:.4,vagalumes:1.5},
  cald:{cinzas:3,brasas:2.5,fumaca:2,sol:1,raiosecos:.5},
  outono:{sol:3,poucas:2.5,folhas:3,ventania:1,nublado:1.5,neblina:1,garoa:.8,chuva:.5,brumamanha:.8},
  neve:{sol:2,diamante:2,nublado:2,neve:2,nevasca:.8,neblina:1,aurora:2.5},
  savana:{sol:4,calor:3,poucas:2,poeira:1.5,raiosecos:.5,chuva:.35,vagalumes:.5,estrelada:1},
  deserto:{sol:4,calor:4,poeira:1,areia:.8,estrelada:2},
  costa:{sol:4,brisamar:3,poucas:2,nevoeiromar:1.2,garoa:.8,chuva:.5,tempestade:.3},
  cristal:{prisma:2.5,cristais:2,neblina:1.5,sol:1.5,nublado:1,arcana:.4}};
for(const k in WXR2)WXR[k]=WXR2[k];
// equivalentes ao entrar numa região onde o clima atual não existe
const WXMAP={neve:{chuva:'neve',garoa:'neve',tempestade:'nevasca',_:'nublado'},deserto:{chuva:'sol',garoa:'sol',tempestade:'areia',_:'sol'},cald:{chuva:'cinzas',garoa:'cinzas',tempestade:'raiosecos',_:'fumaca'},
  cristal:{chuva:'cristais',garoa:'cristais',tempestade:'arcana',_:'neblina'},savana:{garoa:'chuva',_:'poucas'}};
const W2={rain0:-300,front:null,last:'sol',clk:0};
const hourNow=()=>(DAY.t*24)%24;
function wxOk(type){const T=WXT[type];if(!T)return false;const h=hourNow(),c=T.c;if(c=='noite'&&NIGHT<.5)return false;if(c=='dia'&&NIGHT>.35)return false;if(c=='manha'&&!(h>=5&&h<9))return false;
  if(type=='arcoiris')return false;if(T.p){const cd=WX.reg=='neve'&&type=='neve'?150:240+((DAY.t*997)%1)*180;if(W2.clk-W2.rain0<cd)return false}return true}
wxPick=function(reg){const T=WXR[reg]||WXR.vila;let s=0;const L=[];for(const k in T)if(wxOk(k)){L.push(k);s+=T[k]}let r=R()*s;for(const k of L){r-=T[k];if(r<=0)return k}return'sol'};
wxSet=function(type,quiet){if(!WXT[type])return;const was=WX.type,T=WXT[type];if(WXT[was]&&WXT[was].p&&!T.p)W2.rain0=W2.clk;WX.type=type;const d=T.d||[90,200];WX.t=d[0]+R()*(d[1]-d[0]);
  if(!quiet&&run&&T.nt&&was!=type)toast(T.ic,T.n,'')};
// próximo clima: frente de nuvens antes da chuva e arco-íris (ou abertura) depois
function wxNext(){const cur=WXT[WX.type];if(cur&&cur.p)W2.rain0=W2.clk;if(W2.front){const f=W2.front;W2.front=null;wxSet(f);return}
  if(cur&&cur.p&&/chuva|garoa|tempestade/.test(WX.type)){W2.rain0=W2.clk;if(NIGHT<.25&&ELEV>.08&&ELEV<.65&&R()<.6&&!/neve|deserto|cald|cristal/.test(WX.reg)){wxSet('arcoiris');return}wxSet(R()<.5?'poucas':'nublado',1);WX.t=40+R()*40;return}
  const n=wxPick(WX.reg);if(WXT[n].p&&(WX.k.cloud<.6)&&/chuva|garoa|tempestade|neve|nevasca|raiosecos|arcana/.test(n)){W2.front=n;wxSet('nublado',1);WX.t=18+R()*14;return}wxSet(n)}
// ---------- arco-íris e aurora
const BOWM=new THREE.ShaderMaterial({uniforms:{uOp:{value:0}},transparent:true,depthWrite:false,fog:false,blending:THREE.AdditiveBlending,side:2,
  vertexShader:'varying vec2 vU;void main(){vU=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
  fragmentShader:'uniform float uOp;varying vec2 vU;vec3 hue(float h){return clamp(abs(mod(h*6.+vec3(0.,4.,2.),6.)-3.)-1.,0.,1.);}void main(){float a=sin(vU.y*3.14159)*smoothstep(0.,.1,vU.x)*smoothstep(1.,.9,vU.x);gl_FragColor=vec4(hue(.78*(1.-vU.y)),a*uOp*.5);}'});
const BOW=(()=>{const N=64,R0=118,W=13,p=[],u=[],ix=[];for(let i=0;i<=N;i++){const a=i/N*PI;for(const[j,r]of[[0,R0-W/2],[1,R0+W/2]]){p.push(C(a)*r,S(a)*r,0);u.push(i/N,j)}}for(let i=0;i<N;i++){const a=i*2;ix.push(a,a+1,a+2,a+1,a+3,a+2)}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(u,2));g.setIndex(ix);const m=new THREE.Mesh(g,BOWM);m.frustumCulled=false;m.renderOrder=-4;m.visible=false;sc.add(m);return m})();
const AURM=new THREE.ShaderMaterial({uniforms:{uOp:{value:0},uT:{value:0},uPr:{value:0}},transparent:true,depthWrite:false,fog:false,blending:THREE.AdditiveBlending,side:2,
  vertexShader:'uniform float uT;varying vec2 vU;void main(){vU=uv;vec3 p=position;float a=uv.x*6.2832;float w=sin(a*5.+uT*.3)*10.+sin(a*13.-uT*.2)*5.;p.x+=cos(a)*w;p.z+=sin(a)*w;gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}',
  fragmentShader:'uniform float uOp,uT,uPr;varying vec2 vU;vec3 hue(float h){return clamp(abs(mod(h*6.+vec3(0.,4.,2.),6.)-3.)-1.,0.,1.);}void main(){float a=vU.x*6.2832;float w=.5+.5*sin(a*9.+uT*.8+sin(a*4.-uT*.35)*2.4);float rays=.62+.38*sin(a*120.+uT*1.6);'+
    'float band=.35+.65*smoothstep(-.3,.6,sin(a*3.+uT*.12));float i=pow(1.-vU.y,1.6)*w*rays*band*smoothstep(0.,.1,vU.y);vec3 c=mix(vec3(.25,1.,.6),vec3(.68,.35,1.),clamp(vU.y*1.4+.25*(1.-w),0.,1.));c=mix(c,hue(fract(vU.x*3.+uT*.05+vU.y*.3)),uPr);gl_FragColor=vec4(c,i*uOp*.8);}'});
const AUR=(()=>{const o=new THREE.Group();for(const[r,y,h]of[[210,40,64],[250,58,58]]){const g=new THREE.CylinderGeometry(r,r,h,160,1,true);g.translate(0,y+h/2,0);const m=new THREE.Mesh(g,AURM);m.frustumCulled=false;m.renderOrder=-4;o.add(m)}o.visible=false;sc.add(o);return o})();
// ---------- partículas do ambiente por clima (usa os conjuntos de fx.js: pólen, vaga-lumes, pétalas, folhas, névoa, brasas)
const AMBC={mot:0xffe8a0,fly:0xc8ff70,pet:0xffb8d8,leaf:0xd88a3a,emb:0xff8a2a},LEAFR={outono:0xe0601e,mata:0xc8a040,plan:0xb8b840,vila:0x8ab84a,costa:0x6ab04a};
function wxAmb(W){if(typeof DST!='undefined'&&DST.on){for(const k in W)W[k]=0;return}const T=WXT[WX.type]||{},a=T.a||{},ac=T.ac||{},f=Math.min(1,W2.amb||0);
  for(const k in a)W[k]=Math.max(W[k]||0,a[k]*f*(k=='leaf'||k=='pet'?1:1));
  if(WX.k.rain>.3){W.mot*=.2;W.fly*=.2;W.pet*=.3}
  for(const k in AMBC){const m=AMB[k]&&AMB[k].m;if(!m)continue;const c=ac[k]||(k=='leaf'&&LEAFR[WX.reg])||AMBC[k];m.material.color.setHex(c)}}
// ---------- atualização
let lastReg=null;const _bowD=new V3();
wxUpd=function(dt,px,pz){const reg=REG[regionAt(px,pz)].id,inDng=typeof DST!='undefined'&&DST.on;W2.clk+=dt;
  if(reg!=WX.reg){WX.reg=reg;const tb=WXR[reg]||{};if(!(WX.type in tb)&&WX.type!='arcoiris'){const mp=WXMAP[reg]||{},cur=WX.type,alt=mp[cur]||(WXT[cur]&&WXT[cur].p?mp._||'nublado':null);
      if(alt&&alt in tb)wxSet(alt,1);else{const n=wxPick(reg);wxSet(WXT[n].p?'nublado':n,1)}W2.front=null}}
  WX.t-=dt;if(WX.t<=0)wxNext();
  const T=inDng?{}:WXT[WX.type].k;
  for(const k in WX.k){const tg=T[k]||0,rate=k=='cloud'?.12:k=='rain'||k=='snow'||k=='sand'?.2:k=='aur'||k=='bow'?.15:.25;WX.k[k]+=(tg-WX.k[k])*damp(rate,dt)}
  W2.amb=(W2.amb||0)+((inDng?0:1)-(W2.amb||0))*damp(.3,dt);
  if(!W2.tc)W2.tc=new THREE.Color(0x888888);if(WXT[WX.type].t)W2.tc.lerp(_cb.setHex(WXT[WX.type].t),damp(.3,dt));
  let fz=0;if(!inDng)for(const z of FOGZ){const d=hy(px-z.x,pz-z.z);if(d<z.r)fz=Math.max(fz,z.k*(1-sstep(z.r*.6,z.r,d))*(z.r<50?(.6+NIGHT*.4):1))}WXF+=(Math.max(fz,WX.k.fog)-WXF)*damp(.8,dt);
  if(WX.k.storm>.6&&!inDng){WX.lt-=dt;if(WX.lt<=0){WX.lt=(WX.type=='raiosecos'?2.5:3)+R()*(WX.type=='arcana'?6:9);BOLTM.color.setHex(WX.type=='arcana'?0xc890ff:0xe8f0ff);lightning(px,pz)}}
  WX.fl=Math.max(0,WX.fl-dt*4);if(boltT>0){boltT-=dt;BOLTM.opacity=Math.max(0,boltT/.22)*(R()<.7?1:.3);if(boltT<=0&&BOLT){sc.remove(BOLT);BOLT.geometry.dispose();BOLT=null}}
  SHU.uW.value=1+WX.k.wind*1.8;rainSound(WX.k.rain);rainUpd(dt,px,P.y,pz);
  AMB.mist.n&&(AMBW.mist=Math.max(AMBW.mist,WXF*1.2));
  // arco-íris: do lado oposto ao sol, só de dia
  const bo=WX.k.bow*(1-NIGHT)*sstep(.02,.12,ELEV);BOW.visible=bo>.01;if(BOW.visible){BOWM.uniforms.uOp.value=bo;_bowD.set(-SUND.x,0,-SUND.z).normalize();BOW.position.set(cam.position.x+_bowD.x*260,cam.position.y-30,cam.position.z+_bowD.z*260);BOW.lookAt(cam.position.x,cam.position.y-30,cam.position.z)}
  // aurora: ao norte, à noite (a prismática aparece um pouco também de dia)
  const pr=WX.type=='prisma'||WX.reg=='cristal'?1:0,ao=WX.k.aur*(pr?Math.max(.35,NIGHT):NIGHT);AUR.visible=ao>.01;if(AUR.visible){AURM.uniforms.uOp.value=ao;AURM.uniforms.uT.value=performance.now()/1000;AURM.uniforms.uPr.value+=(pr-AURM.uniforms.uPr.value)*damp(.5,dt);AUR.position.set(cam.position.x,cam.position.y,cam.position.z)}};
wxApply=function(){const k=WX.k,cv=Math.min(1,k.cloud),f=WXF;SKU.cv.value=cv;SKU.fl.value=WX.fl*.6;
  SUN.intensity*=(1-cv*.62)*(1+k.heat*.18);HEM.intensity*=(1-cv*.2)+WX.fl*.8;CLM.color.lerp(_cb.setHex(NIGHT>.5?0x2a3040:0x7a808a),cv*.7);
  sc.fog.color.lerp(_cb.setHex(0x8a929c).multiplyScalar(1-NIGHT*.7),cv*.5+f*.4);if(k.tint>.01&&W2.tc)sc.fog.color.lerp(_cb.copy(W2.tc).multiplyScalar(1-NIGHT*.6),Math.min(.85,k.tint));
  if(k.heat>.01)sc.fog.color.lerp(_cb.setHex(0xffe0b0).multiplyScalar(1-NIGHT),k.heat*.25*(1-NIGHT));
  const base=FOGR.far;sc.fog.far=Math.max(base*.5,base*(1-f*.5-k.rain*.18-k.snow*.22-k.sand*.35-k.heat*.06));sc.fog.near=Math.max(8,FOGR.near*(1-f*.6-k.rain*.2-k.sand*.5-k.snow*.3));
  SKU.hor.value.lerp(sc.fog.color,f*.6+k.tint*.3+k.sand*.4);MTU.uHor.value.copy(SKU.hor.value)};
WX.type='sol';WX.t=180+R()*120;
