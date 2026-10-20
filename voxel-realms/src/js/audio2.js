'use strict';
/* =============================================================================
   VOXEL REALMS · som do mundo (15.9) — tudo sintetizado, sem arquivos
   - Mesa de som: efeitos, ambiente, clima e interface em canais separados, com
     compressor e reverb; o botão "Sons" no menu ajusta o volume.
   - Som espacial: tudo que acontece no mundo vem do lado certo (esquerda/direita),
     some com a distância e fica abafado de longe.
   - Passos por chão: grama, terra, pedra, madeira (pontes), areia, neve, lama,
     folhas secas, cascalho vulcânico, cristal, capim seco e água (rasa e funda);
     pé esquerdo/direito, mais forte correndo e quase mudo agachado; cota de malha
     e armadura de placas tilintam; cada montaria tem o seu andar; monstros grandes
     fazem o chão tremer; pulo e aterrissagem.
   - Voz de cada bicho: lobos uivam à noite e rosnam, hienas riem, javalis grunhem,
     ovelhas, cabras, vacas, cervos, raposas, sapos, abelhas, aranhas, escorpiões,
     caranguejos, esqueletos chacoalham, mortos-vivos gemem, slimes borbulham,
     golens rangem, fadas tilintam, diabretes gargalham, bandidos gritam, bruxas
     cacarejam, liches sussurram, Ignarok e o Rei Leão rugem. Parados, ao notar
     você, feridos e ao morrer.
   - Ambiente por bioma: vento, folhas, rio, ondas, lava, pássaros, pica-pau,
     corvos, gaivotas, cigarras, grilos, corujas, sapos, uivos distantes, cristais
     cantando, gelo rangendo, a forja da Helga; masmorras com gotas e correntes.
   - Clima com som: chuva (chiado + pingos), trovão perto e longe, vento, nevasca
     assobiando, tempestade de areia, brasas estalando.
   - Magias com som do elemento (fogo, gelo, raio, arcano, vento, natureza, sombra,
     ossos, almas, sangue, noite, aço).
   ============================================================================= */
const AU2={ok:0,vol:1,t:0,bt:0,vc:0,ev:0,bird:0};
try{const v=localStorage.getItem('vr11_sfx');if(v!=null)AU2.vol=+v}catch(e){}
function au2Init(){if(AU2.ok)return true;if(!au){try{au=new AudioContext()}catch(e){return false}}try{const a=au;
  AU2.master=a.createGain();AU2.master.gain.value=AU2.vol;const comp=a.createDynamicsCompressor();comp.threshold.value=-15;comp.ratio.value=4;comp.attack.value=.004;comp.release.value=.25;AU2.master.connect(comp);comp.connect(a.destination);
  const bus=v=>{const g=a.createGain();g.gain.value=v;g.connect(AU2.master);return g};AU2.sfx=bus(.95);AU2.amb=bus(.6);AU2.wx=bus(.7);AU2.ui=bus(.75);
  AU2.rev=a.createConvolver();AU2.rev.buffer=impulse(a,1.8,2.6);AU2.revG=a.createGain();AU2.revG.gain.value=.32;AU2.rev.connect(AU2.revG);AU2.revG.connect(AU2.master);
  const send=v=>{const g=a.createGain();g.gain.value=v;g.connect(AU2.rev);return g};AU2.sSfx=send(.18);AU2.sAmb=send(.35);AU2.sUi=send(.12);
  const n=a.sampleRate*2,w=a.createBuffer(1,n,a.sampleRate),b=a.createBuffer(1,n,a.sampleRate),dw=w.getChannelData(0),db=b.getChannelData(0);let l=0;for(let i=0;i<n;i++){dw[i]=Math.random()*2-1;l=(l+.02*dw[i])/1.02;db[i]=l*3.5}AU2.wn=w;AU2.bn=b;
  SFX.g=AU2.sfx;SFX.nz=w;
  const sh=a.createWaveShaper(),cu=new Float32Array(256);for(let i=0;i<256;i++){const x=i/128-1;cu[i]=Math.tanh(x*3)}sh.curve=cu;AU2.shp=cu;
  bedsInit();AU2.ok=1;return true}catch(e){console.warn('audio',e);return false}}
// ---------- blocos de síntese (todos aceitam um destino)
const aT=()=>au.currentTime;
function nz(out,t,dur,type,f0,f1,v,q,att,brown){const s=au.createBufferSource(),f=au.createBiquadFilter(),g=au.createGain();s.buffer=brown?AU2.bn:AU2.wn;f.type=type;f.Q.value=q||1;f.frequency.setValueAtTime(f0,t);if(f1)f.frequency.exponentialRampToValueAtTime(f1,t+dur);
  g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(Math.max(.0002,v),t+(att||Math.min(.012,dur*.3)));g.gain.exponentialRampToValueAtTime(.0001,t+dur);s.connect(f);f.connect(g);g.connect(out);s.start(t,Math.random()*1.5,dur+.05)}
function os(out,t,type,f0,f1,dur,v,att,vib,vibD){const o=au.createOscillator(),g=au.createGain();o.type=type;o.frequency.setValueAtTime(Math.max(20,f0),t);if(f1&&f1!=f0)o.frequency.exponentialRampToValueAtTime(Math.max(20,f1),t+dur);
  if(vib){const l=au.createOscillator(),lg=au.createGain();l.frequency.value=vib;lg.gain.value=vibD||f0*.03;l.connect(lg);lg.connect(o.frequency);l.start(t);l.stop(t+dur+.05)}
  g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(Math.max(.0002,v),t+(att||.008));g.gain.exponentialRampToValueAtTime(.0001,t+dur);o.connect(g);g.connect(out);o.start(t);o.stop(t+dur+.05)}
// voz com formantes: fonte serrilhada com caminho de altura + filtros de vogal
const VOW={a:[780,1180,2500],e:[480,1900,2600],i:[300,2300,3000],o:[480,820,2500],u:[330,700,2300],r:[520,1300,2400]};
function voice(out,t,pts,dur,v,vow,o){o=o||{};const src=au.createOscillator(),pre=au.createGain(),g=au.createGain();src.type=o.wave||'sawtooth';src.frequency.setValueAtTime(Math.max(30,pts[0][1]),t);for(const[k,f]of pts.slice(1))src.frequency.exponentialRampToValueAtTime(Math.max(30,f),t+k*dur);
  if(o.vib){const l=au.createOscillator(),lg=au.createGain();l.frequency.value=o.vib;lg.gain.value=o.vibD||pts[0][1]*.04;l.connect(lg);lg.connect(src.frequency);l.start(t);l.stop(t+dur+.05)}
  src.connect(pre);pre.gain.value=1;const F=VOW[vow]||VOW.a,fs=o.fs||1;for(let i=0;i<3;i++){const b=au.createBiquadFilter();b.type='bandpass';b.frequency.value=F[i]*fs;b.Q.value=o.q||(i?9:6);const bg=au.createGain();bg.gain.value=[1,.55,.25][i];pre.connect(b);b.connect(bg);bg.connect(g)}
  if(o.am){const l=au.createOscillator(),lg=au.createGain(),dc=au.createGain();l.frequency.value=o.am;lg.gain.value=.5;l.connect(lg);lg.connect(pre.gain);l.start(t);l.stop(t+dur+.05)}
  const a=o.att||.04;g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(Math.max(.0002,v),t+a);g.gain.setValueAtTime(Math.max(.0002,v),t+Math.max(a,dur*(o.hold||.6)));g.gain.exponentialRampToValueAtTime(.0001,t+dur);g.connect(out);src.start(t);src.stop(t+dur+.05);
  if(o.br)nz(out,t,dur,'bandpass',F[1]*fs,0,v*o.br,2,a)}
// som no mundo: pan pela câmera, volume e brilho pela distância ao herói
function spat(x,z,maxD,vol,out,rev){if(!AU2.ok)return null;const ld=hy(x-P.x,z-P.z);if(ld>maxD)return null;const cx=cam.position.x,cz=cam.position.z,fx=P.x-cx,fz=P.z-cz,fl=hy(fx,fz)||1,dx=x-cx,dz=z-cz,dl=hy(dx,dz)||1;
  const pan=cl((dx*-fz/fl+dz*fx/fl)/dl,-1,1)*.85,k=1-ld/maxD,g=au.createGain(),lp=au.createBiquadFilter();g.gain.value=vol*(.22+.78*k)/(1+ld*.015)*(out===AU2.amb?2.4:1);lp.type='lowpass';lp.frequency.value=1200+17000*Math.pow(k,1.5);g.connect(lp);
  let o=lp;if(au.createStereoPanner){const p=au.createStereoPanner();p.pan.value=pan;lp.connect(p);o=p}o.connect(out||AU2.sfx);if(rev!==0){const s=au.createGain();s.gain.value=(rev||.25)*(.5+(1-k));o.connect(s);s.connect(AU2.rev)}return g}

// ---------- interface e sons antigos (bipes viram tons suaves com reverb)
snd=function(f,d,t){if(!au2Init())return;const n=aT(),o=au.createOscillator(),g=au.createGain(),lp=au.createBiquadFilter();t=t||'square';o.type=t;o.frequency.value=f;lp.type='lowpass';lp.frequency.value=t=='square'||t=='sawtooth'?Math.min(3800,f*3.5):14000;
  g.gain.setValueAtTime(.0001,n);g.gain.exponentialRampToValueAtTime(.05,n+.006);g.gain.exponentialRampToValueAtTime(.0001,n+d);o.connect(lp);lp.connect(g);g.connect(AU2.ui);g.connect(AU2.sUi);o.start(n);o.stop(n+d+.03)};
sweep=function(f0,f1,d,t,v){if(!au2Init())return;const n=aT(),o=au.createOscillator(),g=au.createGain(),lp=au.createBiquadFilter();t=t||'square';o.type=t;o.frequency.setValueAtTime(Math.max(20,f0),n);o.frequency.exponentialRampToValueAtTime(Math.max(20,f1),n+d);
  lp.type='lowpass';lp.frequency.value=t=='square'||t=='sawtooth'?Math.min(4200,Math.max(f0,f1)*3):14000;g.gain.setValueAtTime(.0001,n);g.gain.exponentialRampToValueAtTime(Math.max(.0002,(v||.04)*1.1),n+.008);g.gain.exponentialRampToValueAtTime(.0001,n+d);
  o.connect(lp);lp.connect(g);g.connect(AU2.sfx);g.connect(AU2.sSfx);o.start(n);o.stop(n+d+.03)};
const _openWin159=openWin;openWin=function(id){_openWin159.apply(this,arguments);if(!au2Init())return;const t=aT();nz(AU2.ui,t,.12,'bandpass',1800,900,.12,1.2);nz(AU2.ui,t+.07,.1,'bandpass',2600,1200,.08,1.2)};
document.addEventListener('pointerdown',e=>{if(!AU2.ok)return;const b=e.target.closest&&e.target.closest('button,.ib,.gs,.gh');if(b){const t=aT();os(AU2.ui,t,'triangle',1250,980,.05,.05);nz(AU2.ui,t,.03,'highpass',4000,0,.04)}},true);

// ---------- passos
let STEPF=0;
stepKind=function(){if(P.mounted)return'hoof';const wd=waterDepth();if(wd>.05)return wd>.6?'wade':'water';if(onBridge(P.x,P.z))return'wood';const rid=REG[regionAt(P.x,P.z)].id,h=groundAt(P.x,P.z);
  if(roadD(P.x,P.z)<1.7||rid=='vila'&&hy(P.x,P.z)<19.5)return rid=='deserto'?'sand':'stone';if(typeof DST!='undefined'&&DST.on)return'stone';
  if(rid=='neve')return'snow';if(rid=='deserto'||rid=='costa'&&h<1.3||h<.6&&rid!='mang')return'sand';if(rid=='mang'&&h<1)return'mud';if(rid=='cald')return'gravel';if(rid=='cristal')return(hash2(P.x|0,P.z|0)>.6)?'crystal':'gravel';
  if(rid=='outono')return(hash2(P.x|0,P.z|0)>.4)?'leaves':'grass';if(rid=='savana')return'drygrass';return'grass'};
const STEPV={grass:2.6,snow:2.4,gravel:1.8,leaves:1.5,drygrass:1.6,water:1.8,sand:1.4,stone:.7,wood:1.2};
function stepAt(out,t,k,v){v*=STEPV[k]||1;const r=()=>.85+Math.random()*.3;
  switch(k){
    case'stone':nz(out,t,.05,'highpass',2400*r(),0,.22*v,.7);nz(out,t,.07,'bandpass',600*r(),0,.18*v,1.5);os(out,t,'sine',180*r(),110,.05,.06*v);break;
    case'wood':nz(out,t,.09,'bandpass',420*r(),280,.3*v,3);os(out,t,'triangle',150*r(),110,.1,.12*v);nz(out,t+.01,.04,'highpass',3000,0,.06*v);break;
    case'sand':nz(out,t,.16,'bandpass',2400*r(),1400,.16*v,.8,.03);nz(out,t+.03,.1,'highpass',5000,0,.05*v);break;
    case'snow':for(let i=0;i<4;i++)nz(out,t+i*.02+Math.random()*.01,.05,'bandpass',1200+Math.random()*1400,0,.15*v,3);nz(out,t,.14,'lowpass',500,0,.12*v);break;
    case'mud':nz(out,t,.18,'lowpass',500*r(),180,.32*v,1.5,.03,1);os(out,t+.05,'sine',90,60,.12,.08*v);nz(out,t+.08,.08,'bandpass',900,400,.1*v,4);break;
    case'leaves':for(let i=0;i<3;i++)nz(out,t+i*.03,.08,'bandpass',3000+Math.random()*2500,0,.11*v,1.5);nz(out,t,.09,'lowpass',600,0,.12*v);break;
    case'gravel':for(let i=0;i<3;i++)nz(out,t+i*.022,.04,'bandpass',1600+Math.random()*1800,0,.16*v,2);nz(out,t,.08,'lowpass',400,0,.14*v);break;
    case'crystal':nz(out,t,.05,'highpass',3000,0,.12*v);os(out,t,'sine',2600*r(),0,.25,.03*v);os(out,t+.01,'sine',3900*r(),0,.18,.015*v);break;
    case'drygrass':nz(out,t,.12,'bandpass',3600*r(),2000,.14*v,1.2);nz(out,t,.08,'lowpass',500,0,.1*v);break;
    case'water':nz(out,t,.22,'bandpass',900,2600,.24*v,1.4,.015);os(out,t+.02,'sine',420*r(),900,.1,.04*v);break;
    case'wade':nz(out,t,.42,'lowpass',1400,500,.32*v,1,.05);nz(out,t+.08,.3,'bandpass',700,1800,.18*v,1.2);os(out,t+.1,'sine',260,520,.15,.05*v);break;
    default:nz(out,t,.11,'lowpass',900*r(),300,.24*v,1,.006);nz(out,t+.015,.06,'bandpass',2200*r(),0,.06*v,1.2)}}
sfxStep=function(k,v){if(!au2Init())return;v=(v||1)*.9;const t=aT();STEPF^=1;const p=au.createStereoPanner?au.createStereoPanner():null,g=au.createGain();g.gain.value=1;g.connect(AU2.sfx);let out=g;if(p){p.pan.value=STEPF?-.12:.12;p.connect(g);out=p}
  if(k=='hoof'){const m=P.mountSel||'cavalo';v*={leao:2.5,javali:3,lobo:2.5,raptor:1.8}[m]||1;
    if(m=='cavalo'){for(const d of[0,.11]){nz(out,t+d,.06,'bandpass',900,0,.3*v,2);os(out,t+d,'sine',140,80,.08,.18*v)}}
    else if(m=='javali'){for(const d of[0,.06,.12])nz(out,t+d,.04,'bandpass',1200,0,.18*v,2)}
    else if(m=='raptor'){nz(out,t,.05,'highpass',3500,0,.16*v);os(out,t,'sine',110,60,.1,.16*v);nz(out,t+.03,.03,'bandpass',2600,0,.12*v,4)}
    else{nz(out,t,.12,'lowpass',400,0,.3*v,1,.01,1);os(out,t,'sine',90,55,.12,.15*v)}
    return}
  stepAt(out,t,k,v);
  // armadura no corpo
  const B=EQ.peito,vk=B&&B.vk;if(vk&&STEPF){if(/chain|tabard|scale/.test(vk))for(let i=0;i<4;i++)nz(out,t+.02+i*.018+Math.random()*.01,.035,'highpass',6000,0,.05*v);
    else if(/plate|drakeplate/.test(vk)){os(out,t+.02,'sine',1150+Math.random()*200,0,.12,.025*v);os(out,t+.02,'sine',2900,0,.08,.012*v);nz(out,t+.02,.04,'bandpass',3500,0,.06*v,3)}}};
// pulo e aterrissagem
let wasAir=0,airY=0;
function jumpLandUpd(){const a=!!P.air&&!P.mounted;if(a&&!wasAir){airY=P.y;if(AU2.ok){const t=aT();nz(AU2.sfx,t,.18,'bandpass',800,1800,.08,1)}}
  if(!a&&wasAir&&AU2.ok){const k=stepKind(),drop=Math.max(0,airY-P.y);const t=aT();stepAt(AU2.sfx,t,k,1.2+Math.min(1,drop*.15));if(drop>2)nz(AU2.sfx,t,.25,'lowpass',220,80,.3,1,.01,1)}
  if(a)airY=Math.max(airY,P.y);wasAir=a}

// ---------- vozes dos bichos
const VFAM={wolf:'wolf',dwolf:'wolf',redwolf:'wolf',swolf:'wolf',hyena:'hyena',fox:'fox',sfox:'fox',cfox:'fox',boar:'boar',yeti:'roar',juba:'lion',bee:'bee',rainha:'bee',spider:'bug',scorp:'bug',sarkhan:'bug',crab:'crab',pcrab:'crab',carapaca:'crab',
  frog:'frog',tfrog:'frog',croc:'croc',skel:'bone',skelwar:'bone',skelmage:'bone',iceskel:'bone',zombie:'undead',ghoul:'undead',zbrute:'undead',mummy:'undead',slime:'slime',lslime:'slime',golem:'golem',bgolem:'golem',cgolem:'crystal',totem:'totem',
  fairy:'fairy',imp:'imp',bandit:'human',bandarc:'human',bshield:'human',bbrute:'human',bshaman:'human',bassassin:'human',pirate:'human',cultist:'human',capitao:'human',sheep:'sheep',goat:'goat',cow:'cow',camel:'camel',deer:'deer',wdeer:'deer',antelope:'deer',rabbit:'small',
  anciao:'treant',bruxa:'witch',sylvara:'witch',vorn:'lich',nihil:'lich',ignarok:'dragon'};
const VOX={
  wolf(o,t,p,k){if(k=='idle'||k=='howl'){if(k=='howl'||NIGHT>.4&&Math.random()<.5)voice(o,t,[[0,380*p],[.25,560*p],[.7,520*p],[1,300*p]],2.2,.22,'u',{wave:'triangle',vib:5,vibD:12*p,att:.3,hold:.75,br:.15});else nz(o,t,.25,'bandpass',700*p,400,.14,2)}
    else if(k=='alert'){voice(o,t,[[0,90*p],[1,80*p]],.7,.28,'o',{am:28,att:.05,br:.6,fs:.8});for(const d of[.75,.95])voice(o,t+d,[[0,330*p],[1,210*p]],.13,.3,'a',{att:.008,br:.4})}
    else if(k=='hurt')voice(o,t,[[0,900*p],[.4,1300*p],[1,700*p]],.24,.26,'i',{att:.01,br:.2});else if(k=='die')voice(o,t,[[0,800*p],[1,280*p]],.9,.22,'u',{att:.02,vib:7})},
  hyena(o,t,p,k){if(k=='idle'||k=='alert'){const n=5+(Math.random()*3|0);for(let i=0;i<n;i++)voice(o,t+i*.13,[[0,700*p],[1,880*p]],.1,.2,'e',{att:.01,br:.3})}else VOX.wolf(o,t,p*1.1,k)},
  fox(o,t,p,k){if(k=='die'||k=='hurt')voice(o,t,[[0,1200*p],[1,700*p]],.3,.18,'i',{att:.01});else for(let i=0;i<2;i++)voice(o,t+i*.16,[[0,1000*p],[1,1400*p]],.1,.14,'e',{att:.01})},
  boar(o,t,p,k){if(k=='hurt'||k=='die'||k=='alert'&&Math.random()<.5)voice(o,t,[[0,700*p],[.5,1150*p],[1,(k=='die'?380:800)*p]],k=='die'?.9:.4,.24,'e',{att:.01,br:.5});
    else for(let i=0;i<2+(Math.random()*2|0);i++)voice(o,t+i*.18,[[0,110*p],[1,95*p]],.14,.24,'o',{att:.01,br:.7,am:22})},
  roar(o,t,p,k){const L=k=='die'?1.8:k=='alert'?1.3:k=='hurt'?.35:.5;if(k=='idle'){nz(o,t,.5,'lowpass',400*p,200,.2,1,.1,1);return}
    voice(o,t,[[0,80*p],[.3,115*p],[1,(k=='die'?45:70)*p]],L,.34,'a',{att:.06,br:.9,am:k=='hurt'?0:18,fs:.7});nz(o,t,L,'lowpass',300,1200*p,.25,1,.08,1)},
  lion(o,t,p,k){VOX.roar(o,t,p*1.15,k);if(k=='alert')nz(o,t,1.2,'bandpass',500,250,.2,2,.1)},
  dragon(o,t,p,k){VOX.roar(o,t,p*.55,k=='idle'?'alert':k);if(k!='hurt')nz(o,t+.1,2,'lowpass',160,60,.35,1,.2,1)},
  bee(o,t,p,k){const f=(k=='alert'?300:220)*p;os(o,t,'sawtooth',f,f*1.05,k=='die'?.8:.7,.05,.08,30,f*.04);nz(o,t,.6,'bandpass',f*3,0,.05,4,.1);if(k=='die')os(o,t,'sawtooth',f,f*.4,.8,.05)},
  bug(o,t,p,k){if(k=='hurt'||k=='die'){os(o,t,'sawtooth',1900*p,900*p,k=='die'?.5:.18,.06);nz(o,t,.2,'bandpass',3000,0,.15,3);return}
    if(k=='alert')nz(o,t,.45,'highpass',2600*p,0,.16,1,.05);for(let i=0;i<7;i++)nz(o,t+(k=='alert'?.4:0)+i*.035,.02,'highpass',3200*p,0,.12,2)},
  crab(o,t,p,k){for(let i=0;i<(k=='alert'?4:2);i++){nz(o,t+i*.12,.03,'bandpass',2600*p,0,.3,3);os(o,t+i*.12,'sine',1500*p,1100*p,.06,.06)}if(k=='die')nz(o,t,.4,'lowpass',800,200,.2,1)},
  frog(o,t,p,k){for(let i=0;i<2;i++)voice(o,t+i*.15,[[0,190*p],[1,150*p]],.1,.22,'o',{wave:'square',att:.01,am:45})},
  croc(o,t,p,k){if(k=='idle'||k=='alert')nz(o,t,.6,'bandpass',1800,900,.18,1,.05);voice(o,t+.1,[[0,70*p],[1,60*p]],.6,.22,'o',{am:24,br:.5})},
  bone(o,t,p,k){const n=k=='die'?18:k=='alert'?10:7;for(let i=0;i<n;i++)nz(o,t+i*.035+Math.random()*.02,.03,'bandpass',1100+Math.random()*1200,0,.22,6);if(k=='alert'||k=='hurt'){os(o,t,'square',420,180,.07,.05)}},
  undead(o,t,p,k){const d=k=='die'?1.6:k=='hurt'?.3:1.2;voice(o,t,[[0,(k=='alert'?120:95)*p],[.6,(k=='alert'?140:105)*p],[1,(k=='die'?60:80)*p]],d,.22,k=='hurt'?'u':'o',{att:.1,br:.6,vib:4})},
  slime(o,t,p,k){os(o,t,'sine',200*p,450*p,.12,.18);os(o,t+.12,'sine',450*p,150*p,.14,.14);nz(o,t,.2,'lowpass',600,200,.12,1);if(k=='die')nz(o,t,.4,'lowpass',900,100,.25,1)},
  golem(o,t,p,k){nz(o,t,k=='die'?1.4:.8,'lowpass',160,90,.32,1,.08,1);nz(o,t,.6,'bandpass',300*p,200,.18,3,.05,1)},
  crystal(o,t,p,k){VOX.golem(o,t,p,k);for(let i=0;i<3;i++)os(o,t+i*.08,'sine',1800+i*600,0,1,.04,.005)},
  totem(o,t){os(o,t,'sine',70,65,1.2,.12,.2)},
  fairy(o,t,p,k){const n=k=='die'?6:4;for(let i=0;i<n;i++)os(o,t+i*.07,'sine',k=='die'?2800-i*250:1800+i*320,0,.4,.05,.005)},
  imp(o,t,p,k){for(let i=0;i<4;i++)voice(o,t+i*.11,[[0,1100*p],[1,1300*p]],.09,.5,'e',{att:.01})},
  human(o,t,p,k){if(k=='alert')voice(o,t,[[0,170*p],[.3,235*p],[1,150*p]],.42,.3,'a',{att:.02,br:.35});else if(k=='hurt')voice(o,t,[[0,160*p],[1,120*p]],.17,.26,'u',{att:.01,br:.4});
    else if(k=='die')voice(o,t,[[0,210*p],[1,90*p]],.85,.26,'a',{att:.02,br:.4});else if(Math.random()<.4)voice(o,t,[[0,120*p],[1,110*p]],.3,.08,'u',{att:.05,br:.6})},
  witch(o,t,p,k){if(k=='hurt'||k=='die'){voice(o,t,[[0,700*p],[1,(k=='die'?250:900)*p]],k=='die'?1:.3,.22,'i',{att:.01});return}for(let i=0;i<6;i++)voice(o,t+i*.12,[[0,420*p],[1,520*p]],.1,.2,'a',{att:.01,br:.2})},
  lich(o,t,p,k){nz(o,t,.9,'bandpass',1500,700,.14,1.2,.2);voice(o,t,[[0,110*p],[1,95*p]],1,.14,'o',{att:.2,vib:3});if(k=='alert'||k=='die')os(o,t+.2,'sine',320,640,.9,.08,.2,6,15)},
  treant(o,t,p,k){for(let i=0;i<12;i++)nz(o,t+i*.05,.04,'bandpass',220*p,0,.22,8);voice(o,t,[[0,60*p],[1,50*p]],1.1,.2,'o',{att:.2,br:.5})},
  sheep(o,t,p){voice(o,t,[[0,400*p],[.5,420*p],[1,360*p]],.55,.2,'e',{vib:7,vibD:25*p,att:.05,br:.25})},
  goat(o,t,p){voice(o,t,[[0,520*p],[1,470*p]],.45,.18,'e',{vib:9,vibD:35*p,att:.04,br:.25})},
  cow(o,t,p){voice(o,t,[[0,115*p],[.6,108*p],[1,92*p]],1.3,.24,'u',{att:.15,br:.2,hold:.7})},
  camel(o,t,p){voice(o,t,[[0,90*p],[1,80*p]],.7,.2,'o',{am:20,br:.6})},
  deer(o,t,p,k){if(k=='alert')nz(o,t,.2,'bandpass',900,0,.2,2);else voice(o,t,[[0,650*p],[1,560*p]],.24,.14,'e',{att:.02,br:.2})},
  small(o,t){os(o,t,'sine',2200,2600,.05,.03)}};
function vocal(e,k){if(!AU2.ok||e.vgap>AU2.t&&k!='die')return;const fam=VFAM[e.type];if(!fam||!VOX[fam])return;if(AU2.vc>=6&&k!='die')return;
  const sc_=e.m&&e.m.g?e.m.g.scale.x:1,p=1/Math.max(.6,Math.min(2.6,sc_))*(e.el?.92:1)*(.94+Math.random()*.12),out=spat(e.x,e.z,k=='idle'&&fam=='wolf'&&NIGHT>.4?110:55,k=='die'?1.1:1,AU2.sfx,.3);if(!out)return;
  e.vgap=AU2.t+(k=='hurt'?.35:1.2);AU2.vc++;setTimeout(()=>AU2.vc--,1400);try{VOX[fam](out,aT(),p,k)}catch(er){}}
const _hurt159=hurtMob;hurtMob=function(e,d,c,src){const alive=e&&!e.dead,h0=e&&e.hp;const r=_hurt159.apply(this,arguments);if(alive&&AU2.ok){if(e.dead)vocal(e,'die');else if(e.hp<h0&&src!='dot')vocal(e,'hurt')}return r};
let crT=0;
function creaturesUpd(dt){crT-=dt;const scan=crT<=0;if(scan)crT=.25;
  for(const e of E){if(e.dead||!e.m)continue;const d=hy(e.x-P.x,e.z-P.z);if(d>60)continue;
    if(scan){const ch=e.st=='chase';if(ch&&!e._ch&&!e.t.passive)vocal(e,'alert');e._ch=ch;
      if(!ch){e._vt=(e._vt==null?3+Math.random()*10:e._vt)-.25;if(e._vt<=0){e._vt=(e.t.passive?9:7)+Math.random()*14;if(d<45&&(!WX.k.rain||Math.random()<.5))vocal(e,'idle')}}}
    // passos pesados dos grandes
    const big=e.boss||(e.t.r||0)>=1.1||(e.m.g.scale.x||1)>1.35;if(big&&d<34){const sp=hy(e.vx||0,e.vz||0)||(e.st=='chase'?e.sp:0);if(sp>.8){e._ft=(e._ft||0)-dt*Math.min(2.2,sp/2);if(e._ft<=0){e._ft=.55;const o=spat(e.x,e.z,34,e.boss?1:.7,AU2.sfx,.2);if(o){const t=aT();nz(o,t,.3,'lowpass',180,60,.4,1,.01,1);os(o,t,'sine',62,40,.25,.25)}}}}}}

// ---------- camadas de ambiente (laços de ruído filtrado)
const BED={},RW2=new Float32Array(REG.length);
function bedsInit(){const mk=(buf,type,f,q,out)=>{const s=au.createBufferSource();s.buffer=buf;s.loop=true;const fl=au.createBiquadFilter();fl.type=type;fl.frequency.value=f;fl.Q.value=q||.7;const g=au.createGain();g.gain.value=0;s.connect(fl);fl.connect(g);g.connect(out);s.start(0,Math.random()*1.5);return{s,f:fl,g}};
  const A=AU2.amb,W=AU2.wx,w=AU2.wn,b=AU2.bn;
  BED.wind=mk(b,'lowpass',380,.6,W);BED.leaves=mk(w,'bandpass',2600,.5,A);BED.rainH=mk(w,'highpass',3200,.5,W);BED.rainB=mk(w,'bandpass',1000,.6,W);BED.river=mk(w,'bandpass',650,.5,A);
  BED.waves=mk(b,'lowpass',520,.5,A);BED.lava=mk(b,'lowpass',120,.8,A);BED.sand=mk(w,'highpass',4500,.5,W);BED.whistle=mk(w,'bandpass',1100,9,W);BED.cave=mk(b,'lowpass',90,1,A);
  const o=au.createOscillator(),g=au.createGain();o.frequency.value=55;g.gain.value=0;o.connect(g);g.connect(A);o.start();BED.drone={g,f:{frequency:{setTargetAtTime(){}}}}}
const BWIND={vila:.1,plan:.16,flor:.1,mata:.08,mang:.06,cald:.1,outono:.14,neve:.42,savana:.24,deserto:.34,costa:.26,cristal:.12};
function setB(k,v,f){const B=BED[k];if(!B)return;const t=aT();B.g.gain.setTargetAtTime(Math.max(0,v),t,.4);if(f)B.f.frequency.setTargetAtTime(f,t,.4)}
function bedsUpd(){regW(P.x,P.z,RW2);const RW=RW2;const dng=typeof DST!='undefined'&&DST.on,k=WX.k,rid=WX.reg||'vila',t=AU2.t,gust=.5+.5*S(t*.23)*S(t*.071+1),out=!dng;
  setB('wind',out?((BWIND[rid]||.12)+k.wind*.32+Math.max(0,(P.y-8)/30)*.25)*(.7+.6*gust):0,250+450*gust+k.wind*300);
  const fol=(RW[0]+RW[1]+RW[3]+RW[6]+(RW[4]||0)*.5);setB('leaves',out?fol*(.04+k.wind*.1)*gust:0,2200+800*gust);
  setB('rainH',out?k.rain*.22:0);setB('rainB',out?k.rain*.16+k.storm*.05:0);
  const rd=riverD(P.x,P.z);setB('river',out?.22*(1-sstep(8,45,rd)):0,600+120*S(t*.7));
  let shore=0;if(out&&(rid=='costa'||rid=='mang')){let n=0;for(let i=0;i<6;i++){const a=i*1.047;if(groundAt(P.x+C(a)*18,P.z+S(a)*18)<-.3)n++}shore=n/6}const sw=.55+.45*S(t*.75);setB('waves',shore*.4*sw,380+260*sw);
  setB('lava',out?(RW[5]||0)*.22:0);setB('sand',out?k.sand*.24:0);setB('whistle',out?k.snow*k.wind*.12+(rid=='neve'?.012:0)*gust:0,800+600*gust);
  setB('cave',dng?.3:0);if(BED.drone)BED.drone.g.gain.setTargetAtTime(dng?.05:0,aT(),.6)}
// eventos do ambiente: pássaros, insetos, bichos distantes, lugares
function at(dmin,dmax){const a=Math.random()*TAU,r=dmin+Math.random()*(dmax-dmin);return[P.x+S(a)*r,P.z+C(a)*r]}
const AMBE={
  bird(){const[x,z]=at(8,30),o=spat(x,z,40,.9,AU2.amb,.3);if(!o)return;const t=aT(),sp=Math.random()*4|0,b=2400+Math.random()*1600;
    if(sp==0)for(let i=0;i<3;i++)os(o,t+i*.12,'sine',b,b*1.25,.08,.14);else if(sp==1){os(o,t,'sine',b*.8,b*1.3,.18,.14);os(o,t+.25,'sine',b*1.3,b*.8,.18,.14)}
    else if(sp==2)os(o,t,'sine',b,b*1.1,.5,.12,.01,22,b*.08);else for(let i=0;i<5;i++)os(o,t+i*.07,'triangle',b*(1+i*.06),b*(1.1+i*.06),.05,.1)},
  crow(){const[x,z]=at(15,40),o=spat(x,z,50,1,AU2.amb,.4);if(!o)return;const t=aT();for(let i=0;i<2+(Math.random()*2|0);i++)voice(o,t+i*.35,[[0,620],[1,520]],.28,.22,'a',{att:.01,br:.7})},
  woodpecker(){const[x,z]=at(15,35),o=spat(x,z,45,1,AU2.amb,.4);if(!o)return;const t=aT();for(let i=0;i<10;i++)nz(o,t+i*.055,.02,'bandpass',1100,0,.5,6)},
  gull(){const[x,z]=at(15,40),o=spat(x,z,50,1,AU2.amb,.35);if(!o)return;const t=aT();for(let i=0;i<3;i++)voice(o,t+i*.3,[[0,1500],[.4,1700],[1,1100]],.26,.4,'e',{wave:'triangle',att:.02})},
  cicada(){const[x,z]=at(6,25),o=spat(x,z,35,1,AU2.amb,.2);if(!o)return;const t=aT(),d=2.5+Math.random()*2;const s=au.createBufferSource(),f=au.createBiquadFilter(),g=au.createGain(),l=au.createOscillator(),lg=au.createGain();
    s.buffer=AU2.wn;f.type='bandpass';f.frequency.value=5200+Math.random()*900;f.Q.value=6;l.frequency.value=38+Math.random()*10;lg.gain.value=.5;l.connect(lg);lg.connect(g.gain);g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(.12,t+d*.4);g.gain.exponentialRampToValueAtTime(.0001,t+d);
    s.connect(f);f.connect(g);g.connect(o);s.start(t,0,d+.1);l.start(t);l.stop(t+d+.1)},
  cricket(){const[x,z]=at(4,22),o=spat(x,z,30,1,AU2.amb,.25);if(!o)return;const t=aT(),f=4200+Math.random()*700;for(let r=0;r<2;r++)for(let i=0;i<4;i++)os(o,t+r*.45+i*.045,'sine',f,0,.03,.08)},
  owl(){const[x,z]=at(15,40),o=spat(x,z,50,1,AU2.amb,.5);if(!o)return;const t=aT();voice(o,t,[[0,400],[1,370]],.32,.3,'u',{wave:'sine',att:.06});voice(o,t+.5,[[0,380],[1,340]],.5,.26,'u',{wave:'sine',att:.06})},
  frogs(){for(let i=0;i<1+(Math.random()*3|0);i++){const[x,z]=at(5,25),o=spat(x,z,32,1,AU2.amb,.3);if(o)VOX.frog(o,aT()+i*.3,.8+Math.random()*.5)}},
  howl(){const a=Math.random()*TAU,x=P.x+S(a)*100,z=P.z+C(a)*100,o=spat(x,z,140,1.4,AU2.amb,.7);if(o)VOX.wolf(o,aT(),.9+Math.random()*.2,'howl')},
  chime(){const[x,z]=at(6,25),o=spat(x,z,35,1,AU2.amb,.6);if(!o)return;const t=aT(),pen=[0,2,4,7,9,12,14];for(let i=0;i<3+(Math.random()*3|0);i++){const m=72+pen[Math.random()*7|0];os(o,t+i*.18,'sine',mtof(m),0,1.6,.1,.005)}},
  lavabub(){const[x,z]=at(5,25),o=spat(x,z,35,1,AU2.amb,.3);if(!o)return;const t=aT();for(let i=0;i<3;i++)os(o,t+i*.12,'sine',120+Math.random()*80,300+Math.random()*200,.09,.12);if(Math.random()<.2)nz(o,t,1.5,'lowpass',120,50,.3,1,.2,1)},
  ice(){const[x,z]=at(10,30),o=spat(x,z,40,1,AU2.amb,.5);if(!o)return;const t=aT();for(let i=0;i<14;i++)nz(o,t+i*.04,.035,'bandpass',300+i*15,0,.3,10)},
  bees(){const[x,z]=at(4,15),o=spat(x,z,22,1,AU2.amb,.1);if(o)os(o,aT(),'sawtooth',230+Math.random()*40,240,1.4,.07,.3,24,8)},
  hammer(){const o=spat(21,-18,40,1,AU2.amb,.4);if(!o)return;const t=aT();for(let i=0;i<2;i++){os(o,t+i*.42,'sine',1600+Math.random()*80,0,.5,.08,.002);os(o,t+i*.42,'sine',3900,0,.3,.04,.002);nz(o,t+i*.42,.04,'highpass',3000,0,.15)}},
  dog(){const[x,z]=at(15,35),o=spat(x,z,45,1,AU2.amb,.4);if(!o)return;const t=aT();for(const d of[0,.22])voice(o,t+d,[[0,420],[1,300]],.12,.18,'a',{att:.008,br:.4})},
  drip(){const o=spat(P.x+(Math.random()-.5)*20,P.z+(Math.random()-.5)*20,25,1,AU2.amb,1);if(!o)return;const t=aT(),f=900+Math.random()*700;os(o,t,'sine',f,f*.5,.06,.18)},
  chains(){const o=spat(P.x+(Math.random()-.5)*30,P.z+(Math.random()-.5)*30,30,1,AU2.amb,1);if(!o)return;const t=aT();for(let i=0;i<6;i++)nz(o,t+i*.06+Math.random()*.03,.05,'bandpass',3200,0,.2,2)}};
function ambEvents(dt){AU2.ev-=dt;if(AU2.ev>0)return;AU2.ev=.5+Math.random()*1.6;if(typeof UI!='undefined'&&UI.open)return;const dng=typeof DST!='undefined'&&DST.on,rid=WX.reg||'vila',k=WX.k,n=NIGHT>.5,wet=k.rain>.3||k.snow>.5||k.sand>.4;
  if(dng){Math.random()<.6?AMBE.drip():Math.random()<.3&&AMBE.chains();return}
  const L=[];const add=(f,w)=>{if(w>0)L.push([f,w])};
  if(!n&&!wet){const birdy={vila:3,plan:3,flor:3,mata:4,outono:3,costa:1,savana:1.5,mang:1,neve:.3}[rid]||0;add('bird',birdy);add('woodpecker',/mata|outono/.test(rid)?.5:0);add('crow',/outono|mata|plan/.test(rid)?.6:0);
    add('gull',rid=='costa'?2.5:0);add('cicada',/savana|deserto/.test(rid)?2:rid=='flor'?.5:0);add('bees',rid=='flor'?1.5:0);add('dog',rid=='vila'?.3:0);
    if(rid=='vila'&&hy(P.x-21,P.z+18)<40)add('hammer',3)}
  if(n&&!wet){add('cricket',/neve|deserto|cald|cristal/.test(rid)?0:4);add('owl',/mata|outono|vila|plan/.test(rid)?.8:0);add('howl',/mata|neve|outono|plan/.test(rid)?.25:0)}
  add('frogs',rid=='mang'?2.5:(n&&riverD(P.x,P.z)<30?1.5:0));add('chime',rid=='cristal'?2:0);add('lavabub',rid=='cald'?2.5:0);add('ice',rid=='neve'?.6:0);
  if(!L.length)return;let s=0;for(const[,w]of L)s+=w;let r=Math.random()*s;for(const[f,w]of L){r-=w;if(r<=0){try{AMBE[f]()}catch(e){}break}}}
// ---------- clima
rainSound=function(){};
thunder=function(r){if(!au2Init())return;const t=aT(),near=r<45,v=Math.max(.2,1-r/100);
  if(near){nz(AU2.wx,t,.18,'highpass',1800,600,.55*v,1,.003);nz(AU2.sAmb,t,.3,'highpass',1500,0,.4*v,1,.003)}
  for(let i=0;i<4;i++)nz(AU2.wx,t+.05+i*(.35+Math.random()*.4),1.6+Math.random()*1.4,'lowpass',near?260:160,60,(.45-i*.07)*v,1,.15,1);nz(AU2.sAmb,t+.1,3,'lowpass',200,60,.3*v,1,.3,1)};
function wxSfx(dt){if(!AU2.ok)return;const k=WX.k;if(typeof DST!='undefined'&&DST.on)return;
  if(k.rain>.05){AU2.drop=(AU2.drop||0)-dt*k.rain*18;while(AU2.drop<=0){AU2.drop+=1;const[x,z]=at(1,9),o=spat(x,z,12,.8,AU2.wx,0);if(o){const t=aT()+Math.random()*.05;nz(o,t,.02,'bandpass',2500+Math.random()*3000,0,.08,4);if(Math.random()<.3)os(o,t,'sine',1800+Math.random()*1200,900,.04,.02)}}}
  if((RW2[5]>.3||WX.type=='brasas')&&Math.random()<dt*3){const[x,z]=at(2,10),o=spat(x,z,14,1,AU2.wx,0);if(o)nz(o,aT(),.02,'highpass',3500,0,.1)}}
// ---------- magias com o som do elemento
const ELS={
  fogo(o,t){nz(o,t,.5,'lowpass',2400,300,.35,1,.02);for(let i=0;i<8;i++)nz(o,t+.05+Math.random()*.4,.02,'highpass',3000,0,.12);os(o,t,'sine',90,50,.4,.2)},
  gelo(o,t){for(let i=0;i<6;i++)os(o,t+i*.025,'sine',2600+Math.random()*2400,0,.5,.04,.002);nz(o,t,.4,'highpass',5000,2500,.18,1,.01)},
  raio(o,t){os(o,t,'sawtooth',2400,120,.25,.08);for(let i=0;i<6;i++)nz(o,t+Math.random()*.25,.03,'highpass',4000,0,.18)},
  arcano(o,t){os(o,t,'sine',880,1320,.45,.06,.02);os(o,t,'sine',886,1330,.45,.05,.02);nz(o,t,.4,'bandpass',3000,1500,.1,3,.05)},
  vento(o,t){nz(o,t,.5,'bandpass',600,2800,.22,1.5,.05)},
  natur(o,t){for(let i=0;i<4;i++)nz(o,t+i*.05,.12,'bandpass',2600+Math.random()*1500,0,.1,1.5);os(o,t+.1,'sine',2400,3200,.12,.03)},
  sombra(o,t){nz(o,t,.6,'lowpass',500,150,.3,1,.15,1);os(o,t,'sine',110,70,.6,.1,.1)},
  osso(o,t){nz(o,t,.08,'bandpass',1800,900,.4,2);for(let i=0;i<6;i++)nz(o,t+.05+i*.04,.03,'bandpass',1300+Math.random()*900,0,.15,6)},
  alma(o,t){os(o,t,'sine',500,820,.8,.06,.15,6,20);nz(o,t,.8,'bandpass',1800,900,.08,1.5,.2)},
  sangue(o,t){nz(o,t,.25,'lowpass',900,200,.35,1,.01);os(o,t+.05,'sine',60,40,.15,.25);os(o,t+.3,'sine',60,40,.15,.18)},
  noite(o,t){for(let i=0;i<10;i++)nz(o,t+i*.03,.03,'bandpass',1400+Math.random()*800,0,.1,3);os(o,t,'sine',300,220,.5,.04,.05)},
  aco(o,t){for(const[f,v]of[[1300,.05],[3300,.03],[5200,.015]])os(o,t,'sine',f,0,.5,v,.003);nz(o,t,.3,'bandpass',2000,600,.25,1.4)}};
ELS.vigor=ELS.aco;
const _skillHit159=skillHit;skillHit=function(){const a=P.act,id=a&&a.sk;const r=_skillHit159.apply(this,arguments);if(id&&SK[id]&&AU2.ok&&typeof skEl=='function'){const f=ELS[skEl(id)];if(f){const o=spat(P.x,P.z,10,1,AU2.sfx,.4);if(o)try{f(o,aT())}catch(e){}}}return r};
// ---------- laço
function au2Upd(dt){if(!run||document.hidden)return;if(!AU2.ok&&!au2Init())return;AU2.t+=dt;AU2.bt-=dt;if(AU2.bt<=0){AU2.bt=.1;bedsUpd()}ambEvents(dt);creaturesUpd(dt);jumpLandUpd();wxSfx(dt)}
const _feel159=feelUpd;feelUpd=function(dt){_feel159(dt);try{au2Upd(dt)}catch(e){}};
ambSndUpd=function(){};
// ---------- botão de volume no menu
{const b=document.createElement('button');b.className='ib';b.id='sndb';const lbl=()=>b.textContent='Sons: '+Math.round(AU2.vol*100)+'%';lbl();
  b.onclick=()=>{const L=[1,.7,.4,0],i=L.findIndex(v=>Math.abs(v-AU2.vol)<.05);AU2.vol=L[(i+1)%L.length];try{localStorage.setItem('vr11_sfx',AU2.vol)}catch(e){}if(AU2.ok)AU2.master.gain.setTargetAtTime(AU2.vol,aT(),.05);lbl()};
  const m=$('musb');if(m&&m.parentNode)m.parentNode.insertBefore(b,m.nextSibling)}

document.addEventListener('pointerdown',()=>{if(au&&au.state=='suspended'&&au.resume)au.resume()},true);
