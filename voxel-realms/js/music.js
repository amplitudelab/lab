'use strict';
/* =============================================================================
   VOXEL REALMS · trilha sonora épica (procedural, Web Audio)
   Orquestra sintetizada em tempo real, sem arquivos de áudio: cordas, metais,
   coral, flauta, alaúde e tambores taiko, com reverb de catedral.
   Temas: Título · Dia (Tema de Aldoria) · Vila · Noite · Combate · Chefe.
   A música troca de tema no compasso certo e as camadas entram e saem suaves.
   ============================================================================= */
const MUS={on:true,ac:null,mode:'title',want:'title',beat:0,next:0,ci:0,cyc:0,G:{},nz:null,lfo:null};
try{MUS.on=localStorage.getItem('vr11_mus')!='0'}catch(e){}
const mtof=m=>440*Math.pow(2,(m-69)/12);
// acordes: r = fundamental (MIDI), q = m (menor), M (maior), d (diminuto)
const CH=(r,q)=>({r,q,t:q=='M'?4:3,f:q=='d'?6:7});
const PROG={
  day:[CH(50,'m'),CH(46,'M'),CH(53,'M'),CH(48,'M')],        // Dm  Bb  F   C
  vila:[CH(53,'M'),CH(48,'M'),CH(50,'m'),CH(46,'M')],       // F   C   Dm  Bb
  night:[CH(50,'m'),CH(55,'m'),CH(46,'M'),CH(45,'M')],      // Dm  Gm  Bb  A
  combat:[CH(50,'m'),CH(46,'M'),CH(48,'M'),CH(45,'M')],     // Dm  Bb  C   A
  boss:[CH(50,'m'),CH(51,'M'),CH(50,'m'),CH(49,'d')]};      // Dm  Eb  Dm  C#°
// melodias (por acorde: [batida, nota, duração] em 8 batidas)
const MEL={
  day:[[[0,69,2],[2,74,1],[3,76,1],[4,77,3],[7,76,1]],[[0,74,2],[2,77,1],[3,74,1],[4,70,4]],[[0,72,2],[2,77,1],[3,79,1],[4,81,3],[7,79,1]],[[0,77,2],[2,76,1],[3,72,1],[4,74,4]]],
  vila:[[[0,72,1],[1,74,1],[2,76,2],[4,77,1],[5,76,1],[6,74,2]],[[0,72,2],[2,67,2],[4,72,1],[5,74,1],[6,76,2]],[[0,74,2],[2,72,1],[3,74,1],[4,77,3],[7,76,1]],[[0,74,2],[2,72,2],[4,70,1],[5,69,1],[6,72,2]]],
  night:[[[0,74,4],[4,72,2],[6,70,2]],[[0,67,4],[4,69,2],[6,70,2]],[[0,65,3],[3,67,1],[4,69,2],[6,74,2]],[[0,73,6],[6,69,2]]]};
// modos: andamento, progressão e volume de cada camada
const MODES={
  title:{bpm:70,p:'day',pad:1,str:.45,horn:1,choir:.6,drum:.45,pluck:0,flute:0},
  day:{bpm:74,p:'day',pad:.75,str:.35,horn:.6,choir:.25,drum:.25,pluck:.25,flute:0},
  vila:{bpm:86,p:'vila',pad:.45,str:0,horn:0,choir:0,drum:.2,pluck:.85,flute:.7},
  night:{bpm:62,p:'night',pad:.7,str:0,horn:.25,choir:.85,drum:.18,pluck:0,flute:.6},
  combat:{bpm:116,p:'combat',pad:.55,str:1,horn:.9,choir:.35,drum:1,pluck:0,flute:0},
  boss:{bpm:126,p:'boss',pad:.7,str:1,horn:1,choir:1,drum:1,pluck:0,flute:0}};
// tambores (16 colcheias por acorde): taiko e caixa
const DR={title:[.7,0,0,0,0,0,0,0,.45,0,0,0,0,0,.3,0],day:[.6,0,0,0,0,0,0,0,.4,0,0,0,0,0,0,0],vila:[0,0,.3,0,0,0,.3,0,0,0,.3,0,0,0,.3,.2],night:[.45,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  combat:[1,0,0,.5,1,0,.6,0,1,0,0,.5,1,.4,.7,.5],boss:[1,.35,.6,.35,1,.35,.8,.5,1,.35,.6,.35,1,.6,.8,.9]};
const SN={combat:[0,0,.5,0,0,0,.5,0,0,0,.5,0,0,0,.5,.3],boss:[0,0,.6,0,0,0,.6,0,0,0,.6,0,0,.3,.6,.5]};

function impulse(a,sec,dec){const n=a.sampleRate*sec|0,b=a.createBuffer(2,n,a.sampleRate);for(let c=0;c<2;c++){const d=b.getChannelData(c);for(let i=0;i<n;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/n,dec)}return b}
function musInit(){if(MUS.ac)return true;try{au=au||new AudioContext()}catch(e){return false}const a=MUS.ac=au;
  const out=a.createGain();out.gain.value=0;const comp=a.createDynamicsCompressor();comp.threshold.value=-16;comp.ratio.value=3.5;comp.attack.value=.01;comp.release.value=.3;out.connect(comp);comp.connect(a.destination);MUS.out=out;
  const rv=a.createConvolver();rv.buffer=impulse(a,3.2,2.4);const rvG=a.createGain();rvG.gain.value=.5;rv.connect(rvG);rvG.connect(out);
  for(const k of['pad','str','horn','choir','drum','pluck','flute']){const g=a.createGain();g.gain.value=0;g.connect(out);const s=a.createGain();s.gain.value=k=='drum'?.18:k=='pluck'?.35:.55;g.connect(s);s.connect(rv);MUS.G[k]=g}
  const nb=a.createBuffer(1,a.sampleRate,a.sampleRate),d=nb.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;MUS.nz=nb;
  const lfo=a.createOscillator(),lg=a.createGain();lfo.frequency.value=5.2;lg.gain.value=9;lfo.connect(lg);lfo.start();MUS.lfo=lg;return true}
function musStart(){if(!MUS.on)return;if(!musInit())return;if(MUS.ac.state=='suspended')MUS.ac.resume&&MUS.ac.resume();if(!MUS.started){MUS.started=1;MUS.next=MUS.ac.currentTime+.15;MUS.out.gain.setTargetAtTime(.38,MUS.ac.currentTime,1.5);musLayers(0)}}
function musToggle(){MUS.on=!MUS.on;try{localStorage.setItem('vr11_mus',MUS.on?'1':'0')}catch(e){}if(MUS.on)musStart();if(MUS.out)MUS.out.gain.setTargetAtTime(MUS.on?.38:0,MUS.ac.currentTime,.4)}

// ---------- instrumentos
function env(g,t,a,v,hold,r){g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+a);g.gain.setValueAtTime(v,t+Math.max(a,hold));g.gain.linearRampToValueAtTime(0,t+hold+r)}
function osc(type,f,t,end,dst,det){const o=MUS.ac.createOscillator();o.type=type;o.frequency.value=f;if(det)o.detune.value=det;o.connect(dst);o.start(t);o.stop(end);return o}
function filt(type,f,q){const b=MUS.ac.createBiquadFilter();b.type=type;b.frequency.value=f;b.Q.value=q||.7;return b}
// cordas sustentadas (pad): serras desafinadas atrás de um passa-baixa que "respira"
function iPad(t,c,dur){const a=MUS.ac,f=filt('lowpass',500),g=a.createGain();f.frequency.setValueAtTime(420,t);f.frequency.linearRampToValueAtTime(1300,t+dur*.45);f.frequency.linearRampToValueAtTime(560,t+dur);env(g,t,dur*.3,.07,dur*.75,dur*.35);f.connect(g);g.connect(MUS.G.pad);
  for(const m of[c.r-12,c.r,c.r+c.f,c.r+12+c.t])for(const d of[-8,8])osc('sawtooth',mtof(m),t,t+dur*1.15,f,d)}
// cordas em ostinato (colcheias de arpejo)
function iStr(t,m,dur,v){const a=MUS.ac,f=filt('lowpass',2400),g=a.createGain();env(g,t,.012,v,dur*.5,dur*.6);f.connect(g);g.connect(MUS.G.str);osc('sawtooth',mtof(m),t,t+dur*1.2,f,-5);osc('sawtooth',mtof(m),t,t+dur*1.2,f,6)}
// metais: o filtro abre com o sopro, vibrato depois do ataque
function iHorn(t,m,dur,v){const a=MUS.ac,f=filt('lowpass',400,1.2),g=a.createGain();f.frequency.setValueAtTime(380,t);f.frequency.linearRampToValueAtTime(1700,t+Math.min(.18,dur*.4));f.frequency.linearRampToValueAtTime(900,t+dur);
  env(g,t,Math.min(.08,dur*.3),.11*(v||1),dur*.85,.25);f.connect(g);g.connect(MUS.G.horn);for(const d of[-6,6]){const o=osc('sawtooth',mtof(m),t,t+dur+.35,f,d);MUS.lfo.connect(o.detune)}osc('square',mtof(m-12),t,t+dur+.35,f).detune.value=3}
// coral: "aah" com duas formantes
function iChoir(t,c,dur){const a=MUS.ac,g=a.createGain(),f1=filt('bandpass',720,4),f2=filt('bandpass',1180,5);env(g,t,dur*.35,.18,dur*.7,dur*.4);f1.connect(g);f2.connect(g);g.connect(MUS.G.choir);
  for(const m of[c.r+12,c.r+12+c.t,c.r+12+c.f,c.r+24])for(const d of[-11,9]){const o=osc('sawtooth',mtof(m),t,t+dur*1.15,f1,d);o.connect(f2);MUS.lfo.connect(o.detune)}}
// flauta: seno + um pouco de sopro
function iFlute(t,m,dur){const a=MUS.ac,g=a.createGain(),f=filt('lowpass',3200);env(g,t,.06,.09,dur*.85,.2);f.connect(g);g.connect(MUS.G.flute);const o=osc('sine',mtof(m),t,t+dur+.3,f);MUS.lfo.connect(o.detune);osc('triangle',mtof(m+12),t,t+dur+.3,f).detune.value=4;
  const n=a.createBufferSource(),nf=filt('bandpass',mtof(m)*2,8),ng=a.createGain();n.buffer=MUS.nz;ng.gain.value=.012;n.connect(nf);nf.connect(ng);ng.connect(g);n.start(t,R()*.5,dur+.2)}
// alaúde dedilhado
function iPluck(t,m,v){const a=MUS.ac,g=a.createGain(),f=filt('lowpass',2600);f.frequency.setValueAtTime(3400,t);f.frequency.exponentialRampToValueAtTime(700,t+.5);g.gain.setValueAtTime(v*.1,t);g.gain.exponentialRampToValueAtTime(.0008,t+.9);f.connect(g);g.connect(MUS.G.pluck);osc('triangle',mtof(m),t,t+1,f);osc('square',mtof(m),t,t+1,f,7).frequency.value=mtof(m)}
// taiko: corpo grave com queda de afinação + estalo de pele
function iTaiko(t,v){const a=MUS.ac,o=a.createOscillator(),g=a.createGain();o.type='sine';o.frequency.setValueAtTime(150,t);o.frequency.exponentialRampToValueAtTime(44,t+.28);g.gain.setValueAtTime(.55*v,t);g.gain.exponentialRampToValueAtTime(.001,t+.75);o.connect(g);g.connect(MUS.G.drum);o.start(t);o.stop(t+.8);
  const n=a.createBufferSource(),nf=filt('lowpass',900),ng=a.createGain();n.buffer=MUS.nz;ng.gain.setValueAtTime(.25*v,t);ng.gain.exponentialRampToValueAtTime(.001,t+.12);n.connect(nf);nf.connect(ng);ng.connect(MUS.G.drum);n.start(t,R()*.5,.15)}
function iSnare(t,v){const a=MUS.ac,n=a.createBufferSource(),f=filt('highpass',1800),g=a.createGain();n.buffer=MUS.nz;g.gain.setValueAtTime(.16*v,t);g.gain.exponentialRampToValueAtTime(.001,t+.14);n.connect(f);f.connect(g);g.connect(MUS.G.drum);n.start(t,R()*.5,.16)}
function iCymbal(t,dur){const a=MUS.ac,n=a.createBufferSource(),f=filt('highpass',5200),g=a.createGain();n.buffer=MUS.nz;n.loop=true;g.gain.setValueAtTime(.001,t);g.gain.exponentialRampToValueAtTime(.12,t+dur);g.gain.exponentialRampToValueAtTime(.001,t+dur+1.4);n.connect(f);f.connect(g);g.connect(MUS.G.drum);n.start(t);n.stop(t+dur+1.5)}

// ---------- sequenciador
function musLayers(tc){const M=MODES[MUS.mode],a=MUS.ac;for(const k in MUS.G)MUS.G[k].gain.setTargetAtTime(M[k]||0,a.currentTime,tc==null?1.2:tc)}
function musPickMode(){if(!run)return'title';if(P.dead)return'night';
  if(E.some(e=>e.boss&&!e.dead&&e.st=='chase'&&hy(e.x-P.x,e.z-P.z)<45))return'boss';
  if(inCombat()&&E.filter(e=>!e.dead&&!e.t.passive&&e.st=='chase'&&hy(e.x-P.x,e.z-P.z)<22).length>=2||MUS.mode=='combat'&&inCombat())return'combat';
  const rid=REG[regionAt(P.x,P.z)].id;if(NIGHT>.55||rid=='cald')return'night';if(hy(P.x,P.z)<60)return'vila';return'day'}
function musBeat(t){const M=MODES[MUS.mode],spb=60/M.bpm,pr=PROG[M.p],b=MUS.beat%8;
  if(b==0){MUS.ci=(MUS.ci+(MUS.beat?1:0))%pr.length;if(MUS.ci==0&&MUS.beat)MUS.cyc++}
  const c=pr[MUS.ci];
  if(b==0){if(M.pad)iPad(t,c,8*spb);if(M.choir&&(MUS.mode=='night'||MUS.mode=='boss'||MUS.ci%2==0))iChoir(t,c,8*spb);if(MUS.ci==pr.length-1&&M.drum>.3)iCymbal(t+5*spb,3*spb)}
  // melodia: alterna metais, cordas agudas e respiro (só acordes) a cada volta
  const mel=MEL[M.p],ph=MUS.cyc%3;if(mel){for(const[o,m,d]of mel[MUS.ci])if(o>=b&&o<b+1){const tt=t+(o-b)*spb;
    if(MUS.mode=='vila'||MUS.mode=='night'){if(ph!=2&&M.flute)iFlute(tt,m+(MUS.mode=='night'?0:12)*(ph==1?1:0),d*spb*.95);else if(M.horn&&MUS.mode=='night')iHorn(tt,m-12,d*spb*.95,.6)}
    else if(ph==0&&M.horn)iHorn(tt,m-12,d*spb*.95);else if(ph==1&&M.str)iStr(tt,m,d*spb*.95,.07)}}
  else if(M.horn&&(MUS.mode=='combat'||MUS.mode=='boss')){const R_=c.r+12,pat=[[0,R_,.75],[.75,R_,.25],[1,R_+c.t,1],[2,R_+c.f,2],[4,R_+5,.75],[4.75,R_+5,.25],[5,R_+c.f,1],[6,R_+c.t,2]];
    for(const[o,m,d]of pat)if(o>=b&&o<b+1)iHorn(t+(o-b)*spb,m,d*spb*.9,MUS.mode=='boss'?1.1:.9)}
  // ostinato de cordas / dedilhado
  const arp=[c.r+12,c.r+12+c.t,c.r+12+c.f,c.r+24],ord=[0,1,2,1,3,1,2,1];
  for(let h=0;h<2;h++){const tt=t+h*spb/2,i=(b*2+h)%8;
    if(M.str&&(MUS.mode=='combat'||MUS.mode=='boss'))iStr(tt,arp[ord[i]],spb*.45,.045+(h?0:.02));
    else if(M.str&&h==0&&MUS.mode!='vila'&&ph!=1)iStr(tt,arp[ord[i]]-12,spb*.9,.03);
    if(M.pluck)iPluck(tt,arp[ord[(i+b)%8]]+(MUS.mode=='vila'?0:12),h?.6:1);
    const dv=(DR[MUS.mode]||[])[(b*2+h)%16];if(dv&&M.drum)iTaiko(tt,dv);const sv=(SN[MUS.mode]||[])[(b*2+h)%16];if(sv)iSnare(tt,sv)}
  MUS.next=t+spb;MUS.beat++}
let musCk=0;
function musUpd(dt){if(!MUS.started||!MUS.on||!MUS.ac)return;const a=MUS.ac;if(a.state!='running')return;
  musCk-=dt;if(musCk<=0){musCk=.5;MUS.want=musPickMode()}
  if(MUS.next<a.currentTime-.2)MUS.next=a.currentTime+.05;
  let n=0;while(MUS.next<a.currentTime+.3&&n++<4){
    // troca de tema: combate/chefe entra no próximo compasso, o resto espera o fim do acorde
    if(MUS.want!=MUS.mode){const urgent=MUS.want=='combat'||MUS.want=='boss',b=MUS.beat%8;if(b==0||urgent&&b%4==0){const wasCalm=MUS.mode!='combat'&&MUS.mode!='boss';MUS.mode=MUS.want;MUS.beat=0;MUS.ci=0;MUS.cyc=0;musLayers(urgent?.25:1.6);if(urgent&&wasCalm){iTaiko(MUS.next,1);iCymbal(MUS.next,.05)}}}
    musBeat(MUS.next)}}
