'use strict';
/* =============================================================================
   VOXEL REALMS · núcleo
   utilidades, ruído, perfil gráfico, renderer, materiais, céu com ciclo
   dia/noite, nuvens, montanhas distantes e pós-processamento
   ============================================================================= */
const V3=THREE.Vector3,PI=Math.PI,TAU=PI*2,S=Math.sin,C=Math.cos,hy=Math.hypot,R=Math.random;
const cl=(v,a,b)=>v<a?a:v>b?b:v,lerp=(a,b,t)=>a+(b-a)*t;
const sstep=(a,b,x)=>{const t=cl((x-a)/(b-a),0,1);return t*t*(3-2*t)};
const damp=(k,dt)=>1-Math.exp(-k*dt);
const angDiff=(a,b)=>(((b-a)%TAU)+TAU*1.5)%TAU-PI;
const angTo=(a,b,t)=>a+angDiff(a,b)*Math.min(1,t);
const angStep=(a,b,m)=>a+cl(angDiff(a,b),-m,m);
const easeOut=t=>1-(1-t)*(1-t)*(1-t),easeIn=t=>t*t*t;
const $=id=>document.getElementById(id);
const fmt=n=>n>=1e6?(n/1e6).toFixed(1)+'M':n>=1e4?(n/1e3).toFixed(1)+'k':Math.round(n)+'';
const pick=(a,r)=>a[((r||R)()*a.length)|0];
function hash2(x,z){let h=(Math.imul(x|0,374761393)+Math.imul(z|0,668265263))|0;h=Math.imul(h^(h>>>13),1274126177);return((h^(h>>>16))>>>0)/4294967296}
function rng(seed){let s=(seed>>>0)||1;return()=>{s^=s<<13;s^=s>>>17;s^=s<<5;s>>>=0;return s/4294967296}}
function vnoise(x,z){const xi=Math.floor(x),zi=Math.floor(z),xf=x-xi,zf=z-zi,u=xf*xf*(3-2*xf),v=zf*zf*(3-2*zf);
  return lerp(lerp(hash2(xi,zi),hash2(xi+1,zi),u),lerp(hash2(xi,zi+1),hash2(xi+1,zi+1),u),v)}
function fbm(x,z,o){let s=0,a=.5,f=1,n=0;for(let i=0;i<(o||4);i++){s+=a*vnoise(x*f+i*17.3,z*f-i*9.1);n+=a;f*=2.03;a*=.5}return s/n}

// ---------- perfil gráfico (LEVE no celular; troca no menu recarrega a página)
const MOB=matchMedia('(pointer:coarse)').matches||/Android|iPhone|iPad|Mobi/i.test(navigator.userAgent);
let GL=(()=>{try{const g=localStorage.getItem('vr11_gfx');if(g!=null&&g!=='')return cl(+g|0,0,2)}catch(e){}return MOB?0:(navigator.hardwareConcurrency||4)>=6?2:1})();
const GFX=[{n:'LEVE',pr:1,view:2,post:0,shafts:0,shadow:1024,fx:.5},{n:'MÉDIO',pr:1.25,view:2,post:1,shafts:0,shadow:1536,fx:.75},{n:'ALTO',pr:1.6,view:3,post:1,shafts:1,shadow:2048,fx:1}][GL];

// ---------- renderer, cena e câmera
const rd=new THREE.WebGLRenderer({antialias:!GFX.post,powerPreference:MOB?'default':'high-performance'});
rd.setPixelRatio(Math.min(devicePixelRatio||1,GFX.pr));rd.shadowMap.enabled=true;rd.shadowMap.type=GL==2?THREE.PCFSoftShadowMap:THREE.PCFShadowMap;if(GL==0)rd.shadowMap.autoUpdate=false;
document.body.prepend(rd.domElement);
rd.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();const d=document.createElement('div');d.className='lost';d.textContent='A placa de vídeo reiniciou. Recarregando no modo leve...';document.body.appendChild(d);try{if(typeof save=='function')save();localStorage.setItem('vr11_gfx','0')}catch(_){}setTimeout(()=>location.reload(),1400)});
const sc=new THREE.Scene(),cam=new THREE.PerspectiveCamera(52,1,.5,900);
sc.fog=new THREE.Fog(0xc0dcf0,GFX.view*14,GFX.view*32+24);

// ---------- texturas procedurais
const NT=(()=>{const c=document.createElement('canvas');c.width=c.height=8;const x=c.getContext('2d');for(let i=0;i<8;i++)for(let j=0;j<8;j++){const v=R()<.14?200+R()*22:226+R()*29|0;x.fillStyle=`rgb(${v|0},${v|0},${v|0})`;x.fillRect(i,j,1,1)}const t=new THREE.CanvasTexture(c);t.magFilter=t.minFilter=THREE.NearestFilter;t.wrapS=t.wrapT=THREE.RepeatWrapping;return t})();
const SPR=(()=>{const c=document.createElement('canvas');c.width=c.height=64;const x=c.getContext('2d'),g=x.createRadialGradient(32,32,0,32,32,32);g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(.22,'rgba(255,255,255,.75)');g.addColorStop(.55,'rgba(255,255,255,.2)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(0,0,64,64);return new THREE.CanvasTexture(c)})();

// ---------- materiais com contraluz (rim light) e vento na folhagem; alfa = máscara de bloom
const SHU={uSunV:{value:new V3(0,0,-1)},uT:{value:0},uW:{value:1},uRim:{value:new THREE.Color(0xffd0a0)},uCam:{value:new V3()},uPl:{value:new V3()}};
// a malha com vento recebe só folhagem (copas, grama, flores): todo vértice balança, com fase pela posição
const WIND='\n{vec4 wp=modelMatrix*vec4(transformed,1.);float ph=wp.x*.37+wp.z*.29;transformed.x+=sin(uT*1.6*(.7+uW*.3)+ph)*.06*uW;transformed.z+=cos(uT*1.25+ph*1.31)*.045*uW;}\n';
// "raio-x": o que fica entre a câmera e o herói vira pontilhado (como as paredes no Diablo)
const XRAY='{vec3 ab=uPl-uCam;float L=length(ab);vec3 dd=ab/L;float tt=dot(vWP-uCam,dd);if(tt>0.&&tt<L-1.4){float rr=mix(.8,2.6,tt/L),r=length(vWP-uCam-dd*tt);if(r<rr){float th=mod(floor(gl_FragCoord.x)+floor(gl_FragCoord.y)*2.,4.)*.25;if(th<(1.-r/rr)*1.6)discard;}}}';
function obc(s,w){Object.assign(s.uniforms,SHU);
  s.vertexShader=s.vertexShader.replace('#include <common>','#include <common>\nuniform float uT,uW;varying vec3 vRN;varying vec3 vRV;varying vec3 vWP;').replace('#include <begin_vertex>','#include <begin_vertex>'+(w?WIND:'')).replace('#include <project_vertex>','#include <project_vertex>\nvRN=normalize(transformedNormal);vRV=-mvPosition.xyz;vWP=(modelMatrix*vec4(transformed,1.)).xyz;');
  s.fragmentShader=s.fragmentShader.replace('#include <common>','#include <common>\nuniform vec3 uSunV,uRim,uCam,uPl;varying vec3 vRN;varying vec3 vRV;varying vec3 vWP;').replace('#include <fog_fragment>',XRAY+'{vec3 V=normalize(vRV),N=normalize(vRN);float up=abs((vec4(N,0.)*viewMatrix).y),fr=pow(1.-clamp(abs(dot(N,V)),0.,1.),3.)*(1.-up*.9),bk=.25+.75*max(dot(-V,uSunV),0.);gl_FragColor.rgb+=uRim*fr*bk*(.35+.65*diffuseColor.rgb)*.8;gl_FragColor.a*=.4;}\n#include <fog_fragment>')}
const OBC=s=>obc(s,0),OBW=s=>obc(s,1);function enh(m,w){m.onBeforeCompile=w?OBW:OBC;return m}
const MV=enh(new THREE.MeshLambertMaterial({vertexColors:true,map:NT})),MW=enh(new THREE.MeshLambertMaterial({vertexColors:true,map:NT}),1);
const ME=new THREE.MeshBasicMaterial({vertexColors:true}),MFL=new THREE.MeshBasicMaterial({color:0xffffff});
const MC={},matc=c=>MC[c]||(MC[c]=enh(new THREE.MeshLambertMaterial({color:c,map:NT})));

// ---------- "Bake": junta caixas coloridas numa única malha (poucas chamadas de desenho)
const UB=(()=>{const g=new THREE.BoxGeometry(1,1,1);return{p:g.attributes.position.array,n:g.attributes.normal.array,u:g.attributes.uv.array,i:g.index.array}})();
const _m4=new THREE.Matrix4(),_eu=new THREE.Euler(),_qu=new THREE.Quaternion(),_pv=new V3(),_sv=new V3(),_nv=new V3(),_col=new THREE.Color(),_n3=new THREE.Matrix3();
class Bake{constructor(){this.p=[];this.n=[];this.c=[];this.u=[];this.i=[];this.k=0}
  box(w,h,d,x,y,z,col,o){const rx=o&&o.rx||0,ry=o&&o.ry||0,rz=o&&o.rz||0,g=o&&o.g,b=this.k;
    _eu.set(rx,ry,rz);_qu.setFromEuler(_eu);_m4.compose(_pv.set(x,y,z),_qu,_sv.set(w,h,d));_n3.getNormalMatrix(_m4);_col.setHex(col);
    for(let v=0;v<24;v++){const ly=UB.p[v*3+1];_pv.set(UB.p[v*3],ly,UB.p[v*3+2]).applyMatrix4(_m4);this.p.push(_pv.x,_pv.y,_pv.z);
      const nx=UB.n[v*3],ny=UB.n[v*3+1];_nv.set(nx,ny,UB.n[v*3+2]).applyMatrix3(_n3).normalize();this.n.push(_nv.x,_nv.y,_nv.z);
      const f=v>>2;let u=UB.u[v*2],t=UB.u[v*2+1];if(f<2){u*=d;t*=h}else if(f<4){u*=w;t*=d}else{u*=w;t*=h}this.u.push(u,t);
      let k=ny>.5?1:ny<-.5?.6:(Math.abs(nx)>.5?.86:.94);if(ny<.5&&ny>-.5&&ly<0)k*=g?.62:.8;this.c.push(_col.r*k,_col.g*k,_col.b*k)}
    for(let j=0;j<36;j++)this.i.push(UB.i[j]+b);this.k+=24;return this}
  quad(a,b,c,d,n,col,sh,uw,uh){const k=this.k;this.p.push(...a,...b,...c,...d);for(let i=0;i<4;i++)this.n.push(n[0],n[1],n[2]);_col.setHex(col);
    for(let i=0;i<4;i++){const s=sh?sh[i]:1;this.c.push(_col.r*s,_col.g*s,_col.b*s)}this.u.push(0,0,uw||1,0,uw||1,uh||1,0,uh||1);this.i.push(k,k+1,k+2,k,k+2,k+3);this.k+=4;return this}
  geo(){if(!this.k)return null;const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(this.p,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(this.n,3));g.setAttribute('color',new THREE.Float32BufferAttribute(this.c,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(this.u,2));g.setIndex(this.k>65000?new THREE.Uint32BufferAttribute(this.i,1):new THREE.Uint16BufferAttribute(this.i,1));g.computeBoundingSphere();return g}
  mesh(m){const g=this.geo();return g?new THREE.Mesh(g,m||MV):null}}

// ---------- luzes e ciclo dia / pôr do sol / noite
const HEM=new THREE.HemisphereLight(0xbfdcff,0x5a7a3a,.78);sc.add(HEM);
const SUN=new THREE.DirectionalLight(0xffffff,1.15);SUN.castShadow=true;SUN.shadow.mapSize.set(GFX.shadow,GFX.shadow);SUN.shadow.bias=-.0006;SUN.shadow.normalBias=.035;
{const s=SUN.shadow.camera;s.left=s.bottom=-30;s.right=s.top=30;s.near=1;s.far=170;s.updateProjectionMatrix()}sc.add(SUN,SUN.target);
const FILL=new THREE.DirectionalLight(0x9aa8ff,.22);FILL.position.set(.4,.5,.8);sc.add(FILL);
const TORCH=new THREE.PointLight(0xffa050,0,18,2);sc.add(TORCH);
const DAY={t:.36,len:720};const SUND=new V3(),MOOND=new V3(),LD=new V3(.4,.7,-.5).normalize();let ELEV=1,NIGHT=0,GOLD=0;
const PAL={day:{top:0x2a6ad4,mid:0x5a9be6,hor:0xc4e0f4,horS:0xfff2d6,sun:0xfff0d8,si:1.15,hs:0xc4dcff,hg:0x5a7a3a,hi:.8,fog:0xbcd8ee,rim:0xffe6c0,cl:0xffffff},
  gold:{top:0x231c5c,mid:0x7a4f9e,hor:0xe9a993,horS:0xffb468,sun:0xffb469,si:1.25,hs:0xb9a6ff,hg:0x5a6a30,hi:.8,fog:0xe2a68e,rim:0xffa860,cl:0xffc8b0},
  night:{top:0x02071a,mid:0x0a1534,hor:0x1a2848,horS:0x26325c,sun:0x8aa0ff,si:.42,hs:0x4a5aa0,hg:0x1a2030,hi:.5,fog:0x1a2642,rim:0x7088ff,cl:0x384664}};
const _ca=new THREE.Color(),_cb=new THREE.Color();
function palC(k,out){_ca.setHex(PAL.day[k]).lerp(_cb.setHex(PAL.gold[k]),GOLD);return out.copy(_ca).lerp(_cb.setHex(PAL.night[k]),NIGHT)}
function palS(k){return lerp(lerp(PAL.day[k],PAL.gold[k],GOLD),PAL.night[k],NIGHT)}
const SKU={top:{value:new THREE.Color()},mid:{value:new THREE.Color()},hor:{value:new THREE.Color()},horS:{value:new THREE.Color()},sunC:{value:new THREE.Color()},sd:{value:SUND},md:{value:MOOND},nf:{value:0},t:{value:0},cv:{value:0},fl:{value:0}};
const SKY=new THREE.Mesh(new THREE.SphereGeometry(600,32,16),new THREE.ShaderMaterial({uniforms:SKU,side:THREE.BackSide,depthWrite:false,depthTest:false,fog:false,
  vertexShader:'varying vec3 vP;void main(){vP=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
  fragmentShader:`uniform vec3 top,mid,hor,horS,sunC,sd,md;uniform float nf,t,cv,fl;varying vec3 vP;
void main(){vec3 d=normalize(vP);float h=d.y,s=max(dot(d,sd),0.),m=max(dot(d,md),0.),sv=smoothstep(-.12,.03,sd.y);
float az=pow(max(dot(normalize(d.xz+1e-4),normalize(sd.xz+1e-4)),0.),2.)*sv;
vec3 hz=mix(hor,horS,az*.8+pow(s,4.)*.35*sv),up=mix(mid,top,smoothstep(.15,.75,h));
vec3 c=mix(hz,up,smoothstep(0.,.4,max(h,0.)));c=mix(c,hor*.85,1.-smoothstep(-.15,0.,h));
float b=sin(d.x*9.+d.z*3.+t*.02)*sin(d.z*7.-d.x*2.)*.5+.5;c=mix(c,mix(hor,vec3(1.),.5),smoothstep(.6,.95,b)*smoothstep(.05,.16,h)*(1.-smoothstep(.22,.5,h))*.22*(1.-nf));
float gr=dot(c,vec3(.3,.59,.11));c=mix(c,vec3(gr)*mix(vec3(.9,.93,.98),vec3(.4,.45,.55),nf),cv*.78);sv*=1.-cv*.85;
c+=sunC*(pow(s,6.)*.3+pow(s,48.)*.5)*sv+vec3(1.,.97,.88)*smoothstep(.9966,.9986,s)*1.4*sv;
c+=(vec3(.85,.9,1.)*smoothstep(.9984,.9991,m)*1.3+vec3(.3,.4,.8)*pow(m,24.)*.35)*nf*(1.-cv*.8);
if(nf>.01&&h>0.){vec3 q=floor(d*170.);float n=fract(sin(dot(q,vec3(12.99,78.23,37.72)))*4375.85);c+=vec3(step(.9965,n)*smoothstep(.04,.5,h)*nf*.95*(1.-cv));}
c+=vec3(.8,.85,1.)*fl;
gl_FragColor=vec4(c,clamp(pow(s,12.)*1.3*sv+smoothstep(.9984,.9991,m)*nf,0.,1.));}`}));
SKY.renderOrder=-10;SKY.frustumCulled=false;sc.add(SKY);
// nuvens voxel instanciadas (1 chamada), tingidas pela hora do dia
const CLD=[],CLM=new THREE.MeshBasicMaterial({fog:false,opacity:.3});
for(let i=0;i<26;i++){const a=R()*TAU,r=150+R()*260,s=i<14?1:1.7,w=(12+R()*14)*s,d=(8+R()*8)*s;CLD.push({x:S(a)*r,y:(i<14?40:70)+R()*20,z:C(a)*r,sp:(i<14?1.2:.4)+R(),b:[[0,0,0,w,3*s,d,0xf2f6fa],[R()*w*.2,2.6*s,0,w*.7,3*s,d*.8,0xffffff],[-w*.25,4.4*s,R()*2,w*.35,2.6*s,d*.5,0xffffff],[w*.25,4*s,-R()*2,w*.3,2.2*s,d*.55,0xfafcff],[0,-1.4*s,0,w*.8,1,d*.85,0xc8d4e2]]})}
const CIM=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),CLM,CLD.length*5);CIM.frustumCulled=false;{let i=0;for(const c of CLD)for(const b of c.b)CIM.setColorAt(i++,_col.setHex(b[6]));CIM.instanceColor.needsUpdate=true}sc.add(CIM);
function cloudsUpd(dt,cx,cz){let i=0;for(const c of CLD){c.x+=c.sp*dt;if(c.x-cx>440)c.x-=880;for(const b of c.b){_m4.compose(_pv.set(c.x+b[0]+cx*.5,c.y+b[1],c.z+b[2]+cz*.5),_qu.set(0,0,0,1),_sv.set(b[3],b[4],b[5]));CIM.setMatrixAt(i++,_m4)}}CIM.instanceMatrix.needsUpdate=true}
// montanhas distantes (anel com paralaxe), cor misturada ao horizonte no shader
const MTU={uHor:{value:new THREE.Color()},uTint:{value:new THREE.Color(1,1,1)}};
const MTN=[]; // camadas de paralaxe (preenchidas em parallax.js)

function dayUpd(dt){DAY.t=(DAY.t+dt/DAY.len*(ELEV>0?.75:1.7))%1;const a=TAU*(DAY.t-.25);SUND.set(C(a)*.8,S(a),-.55).normalize();MOOND.set(-SUND.x,-SUND.y,SUND.z).normalize();ELEV=SUND.y;
  NIGHT=sstep(.02,-.16,ELEV);GOLD=(1-sstep(.06,.34,ELEV))*(1-NIGHT);
  palC('top',SKU.top.value);palC('mid',SKU.mid.value);palC('hor',SKU.hor.value);palC('horS',SKU.horS.value);palC('sun',SKU.sunC.value);SKU.nf.value=NIGHT;
  palC('sun',SUN.color);palC('hs',HEM.color);palC('hg',HEM.groundColor);HEM.intensity=palS('hi');palC('rim',SHU.uRim.value);palC('cl',CLM.color);
  SUN.intensity=palS('si')*(.3+.7*sstep(0,.1,Math.abs(ELEV+.03)));
  LD.copy(ELEV>-.04?SUND:MOOND);if(LD.y<.34){const l=hy(LD.x,LD.z)||1;LD.x*=.94/l;LD.z*=.94/l;LD.y=.34;LD.normalize()}
  palC('fog',sc.fog.color);MTU.uHor.value.copy(SKU.hor.value);MTU.uTint.value.setRGB(1,1,1).lerp(_cb.setHex(0x6a7aa8),NIGHT*.8).lerp(_cb.setHex(0xffc8b0),GOLD*.5);if(typeof wxApply=='function')wxApply()}

// ---------- pós-processamento: bloom (máscara no alfa), raios de luz com oclusão por profundidade, gradação e FXAA
const PO={on:!!GFX.post},FS=new THREE.Scene(),FC=new THREE.OrthographicCamera(-1,1,1,-1,0,1),FQ=new THREE.Mesh(new THREE.PlaneGeometry(2,2));FQ.frustumCulled=false;FS.add(FQ);
const RTO={minFilter:THREE.LinearFilter,magFilter:THREE.LinearFilter,format:THREE.RGBAFormat},RTQ={...RTO,depthBuffer:false};
const RTM=new THREE.WebGLRenderTarget(8,8,RTO);RTM.depthTexture=new THREE.DepthTexture();RTM.depthTexture.type=rd.capabilities.isWebGL2?THREE.UnsignedIntType:THREE.UnsignedShortType;
const RA=new THREE.WebGLRenderTarget(8,8,RTQ),RB=new THREE.WebGLRenderTarget(8,8,RTQ),RS=new THREE.WebGLRenderTarget(8,8,RTQ);
const VQ='varying vec2 vU;void main(){vU=uv;gl_Position=vec4(position.xy,0.,1.);}',smat=(u,f)=>new THREE.ShaderMaterial({uniforms:u,vertexShader:VQ,fragmentShader:'varying vec2 vU;'+f,depthTest:false,depthWrite:false});
const MBR=smat({t:{value:null},px:{value:new THREE.Vector2()}},'uniform sampler2D t;uniform vec2 px;vec3 bp(vec2 u){vec4 s=texture2D(t,u);return s.rgb*smoothstep(.62,1.,max(s.r,max(s.g,s.b)))*s.a;}void main(){gl_FragColor=vec4((bp(vU-px)+bp(vU+px)+bp(vU+vec2(px.x,-px.y))+bp(vU+vec2(-px.x,px.y)))*.25,1.);}');
const MBL=smat({t:{value:null},d:{value:new THREE.Vector2()}},'uniform sampler2D t;uniform vec2 d;void main(){vec3 c=texture2D(t,vU).rgb*.227027;c+=(texture2D(t,vU+d*1.3846).rgb+texture2D(t,vU-d*1.3846).rgb)*.316216;c+=(texture2D(t,vU+d*3.2308).rgb+texture2D(t,vU-d*3.2308).rgb)*.07027;gl_FragColor=vec4(c,1.);}');
const MSO=smat({t:{value:null},dp:{value:null}},'uniform sampler2D t,dp;void main(){vec4 s=texture2D(t,vU);gl_FragColor=vec4(s.rgb*s.a*step(.99995,texture2D(dp,vU).r),1.);}');
const MSH=smat({t:{value:null},sp:{value:new THREE.Vector2(.5,.5)},asp:{value:1}},'uniform sampler2D t;uniform vec2 sp;uniform float asp;void main(){vec2 dl=(vU-sp)/24.*.95,u=vU;float w=1.;vec3 c=vec3(0.);for(int i=0;i<24;i++){u-=dl;vec2 q=(u-sp)*vec2(asp,1.);c+=texture2D(t,u).rgb*w*(1.-smoothstep(0.,.65,length(q)));w*=.95;}gl_FragColor=vec4(c/24.*3.,1.);}');
const MCO=smat({t:{value:null},b:{value:null},s:{value:null},dp:{value:null},px:{value:new THREE.Vector2()},bi:{value:.85},si:{value:0},hv:{value:0},nf:{value:0}},
 'uniform sampler2D t,b,s,dp;uniform vec2 px;uniform float bi,si,hv,nf;float hs(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}'+
 'vec3 fx(vec2 u){vec3 L=vec3(.299,.587,.114),nw=texture2D(t,u-px).rgb,ne=texture2D(t,u+vec2(px.x,-px.y)).rgb,sw=texture2D(t,u+vec2(-px.x,px.y)).rgb,se=texture2D(t,u+px).rgb,m=texture2D(t,u).rgb;'+
 'float a=dot(nw,L),b2=dot(ne,L),c=dot(sw,L),d=dot(se,L),e=dot(m,L),lo=min(e,min(min(a,b2),min(c,d))),hi=max(e,max(max(a,b2),max(c,d)));vec2 dir=vec2(-((a+b2)-(c+d)),(a+c)-(b2+d));'+
 'float r=1./(min(abs(dir.x),abs(dir.y))+max((a+b2+c+d)*.03125,.0078125));dir=clamp(dir*r,-8.,8.)*px;vec3 A=.5*(texture2D(t,u+dir*(-1./6.)).rgb+texture2D(t,u+dir*(1./6.)).rgb);'+
 'vec3 B=A*.5+.25*(texture2D(t,u-dir*.5).rgb+texture2D(t,u+dir*.5).rgb);float lb=dot(B,L);return(lb<lo||lb>hi)?A:B;}'+
 'void main(){float sky=step(.99995,texture2D(dp,vU).r);vec3 c=fx(vU)+texture2D(b,vU).rgb*bi+texture2D(s,vU).rgb*si*mix(.3,1.,sky)*vec3(1.,.82,.58);c=clamp(c,0.,1.);float l=dot(c,vec3(.2126,.7152,.0722));c=mix(vec3(l),c,1.1);'+
 'c*=mix(vec3(.94,.92,1.05),vec3(1.04,1.,.94),smoothstep(.05,.75,l));c=clamp(c,0.,1.);c=mix(c,c*c*(3.-2.*c),.2);vec2 q=vU-.5;float v=clamp(1.-dot(q,q)*1.,0.,1.);c*=mix(mix(vec3(.55,.45,.6),vec3(.3,.35,.55),nf),vec3(1.),v);c+=(hs(gl_FragCoord.xy+hv)-.5)/255.;gl_FragColor=vec4(c,1.);}');
let SUNV=0,PSZ=[1,1];const SUNP=new THREE.Vector2(.5,.5),_ds=new THREE.Vector2();
function postSize(){rd.getDrawingBufferSize(_ds);const w=Math.max(1,_ds.x|0),h=Math.max(1,_ds.y|0),qw=Math.max(1,w>>2),qh=Math.max(1,h>>2);RTM.setSize(w,h);RA.setSize(qw,qh);RB.setSize(qw,qh);RS.setSize(qw,qh);MBR.uniforms.px.value.set(1/w,1/h);MCO.uniforms.px.value.set(1/w,1/h);MSH.uniforms.asp.value=w/h;PSZ=[qw,qh]}
function pass(m,o){FQ.material=m;rd.setRenderTarget(o);rd.render(FS,FC)}
let frameN=0;
function render(){SHU.uSunV.value.copy(ELEV>-.04?SUND:MOOND).transformDirection(cam.matrixWorldInverse);frameN++;
  if(!PO.on){rd.setRenderTarget(null);rd.render(sc,cam);return}
  try{rd.setRenderTarget(RTM);rd.render(sc,cam);MBR.uniforms.t.value=RTM.texture;pass(MBR,RA);
    const si=GFX.shafts?SUNV*(1-NIGHT*.6):0;if(si>.01){MSO.uniforms.t.value=RTM.texture;MSO.uniforms.dp.value=RTM.depthTexture;pass(MSO,RB);MSH.uniforms.t.value=RB.texture;MSH.uniforms.sp.value.copy(SUNP);pass(MSH,RS)}
    const u=MBL.uniforms;for(let i=1;i<(GL==2?3:2);i++){u.t.value=RA.texture;u.d.value.set(i/PSZ[0],0);pass(MBL,RB);u.t.value=RB.texture;u.d.value.set(0,i/PSZ[1]);pass(MBL,RA)}
    const c=MCO.uniforms;c.t.value=RTM.texture;c.b.value=RA.texture;c.s.value=RS.texture;c.dp.value=RTM.depthTexture;c.si.value=si>.01?si:0;c.hv.value=frameN%64;c.nf.value=NIGHT;c.bi.value=.75+NIGHT*.35;pass(MCO,null)}
  catch(e){console.warn('pós desligado',e);PO.on=false}}
function rs(){rd.setSize(innerWidth,innerHeight);cam.aspect=innerWidth/innerHeight;cam.fov=innerHeight>innerWidth?60:52;cam.updateProjectionMatrix();postSize()}
addEventListener('resize',rs);addEventListener('orientationchange',()=>setTimeout(rs,300));rs();
