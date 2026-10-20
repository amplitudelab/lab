'use strict';
/* =============================================================================
   VOXEL REALMS · trilhas de batalha e efeitos sonoros (15.3)
   Música: cada luta escolhe um tema pelo lugar e pelo inimigo —
     Choque de Aço (padrão), Fúria Selvagem (feras), Dança Macabra (mortos-vivos),
     Tempestade Gélida (neve e cristal), Maré Pirata (costa e bandidos) e
     Coração de Brasa (Ignarok). Cada tema tem andamento, harmonia, tambores e
     riff próprios.
   Efeitos (sintetizados, sem arquivos): golpes cortam o ar conforme a arma
   (leve, pesada, mágica), acertos soam como metal, osso ou carne, arco estala a
   corda, escudo ressoa, equipar faz o som da peça (metal, malha, couro, tecido,
   joia, mochila), poções borbulham, moedas tilintam e os passos mudam com o chão
   (grama, pedra, areia, neve, água) e com a montaria.
   ============================================================================= */
// ---------- temas de batalha
Object.assign(PROG,{fera:[CH(52,'m'),CH(48,'M'),CH(50,'M'),CH(47,'m')],morto:[CH(50,'m'),CH(49,'d'),CH(46,'M'),CH(45,'M')],gelo:[CH(45,'m'),CH(41,'M'),CH(48,'M'),CH(43,'M')],
  mar:[CH(45,'m'),CH(43,'M'),CH(41,'M'),CH(40,'M')],brasa:[CH(50,'m'),CH(51,'M'),CH(48,'M'),CH(49,'M')]});
MODES.combat.fight=1;MODES.boss.fight=1;
Object.assign(MODES,{combat2:{bpm:134,p:'fera',pad:.4,str:.8,horn:.55,choir:0,drum:1,pluck:.55,flute:.65,fight:1,riff:'fera'},
  combat3:{bpm:104,p:'morto',pad:.75,str:.9,horn:.5,choir:.95,drum:.8,pluck:.45,flute:0,fight:1,riff:'morto'},
  combat4:{bpm:120,p:'gelo',pad:.85,str:1,horn:.6,choir:.75,drum:.75,pluck:.6,flute:.45,fight:1,riff:'gelo'},
  combat5:{bpm:128,p:'mar',pad:.4,str:.8,horn:.9,choir:.2,drum:.9,pluck:.85,flute:.55,fight:1,riff:'mar'},
  boss2:{bpm:140,p:'brasa',pad:.85,str:1,horn:1,choir:1,drum:1,pluck:0,flute:0,fight:1,riff:'brasa'}});
Object.assign(DR,{combat2:[1,0,.6,0,.8,.5,0,.6,1,0,.6,0,.8,.5,.6,.6],combat3:[1,0,0,0,0,0,.7,0,1,0,0,0,.5,0,.7,0],combat4:[1,0,0,.4,0,0,.8,0,1,0,0,.4,0,.5,.8,0],
  combat5:[1,0,0,.6,0,.6,1,0,0,.6,1,0,0,.6,.8,.4],boss2:[1,.5,.8,.5,1,.5,.9,.6,1,.5,.8,.5,1,.8,1,1]});
Object.assign(SN,{combat2:[0,.3,0,.3,0,.3,.6,.3,0,.3,0,.3,0,.3,.6,.5],combat3:[0,0,0,0,.4,0,0,0,0,0,0,0,.4,0,0,.3],combat4:[0,0,.5,0,0,0,.5,0,0,0,.5,0,0,.2,.5,.2],combat5:[0,0,.5,0,0,0,.6,0,0,0,.5,0,0,.4,.6,.4],boss2:[0,.3,.7,.3,0,.3,.7,.5,0,.3,.7,.3,.3,.6,.7,.8]});
// riffs dos metais (em 8 batidas por acorde): [início, nota, duração]
const RIFF={combat:(R_,c)=>[[0,R_,.75],[.75,R_,.25],[1,R_+c.t,1],[2,R_+c.f,2],[4,R_+5,.75],[4.75,R_+5,.25],[5,R_+c.f,1],[6,R_+c.t,2]],
  fera:(R_,c)=>[[0,R_,.5],[.5,R_+c.f,.5],[1,R_+12,1],[2.5,R_+c.f,.5],[3,R_+c.t,.5],[4,R_,1],[5.5,R_-2,.5],[6,R_,.5],[6.5,R_+c.t,.5],[7,R_+c.f,1]],
  morto:(R_,c)=>[[0,R_+c.f,2],[2,R_+c.f-1,2],[4,R_+c.t,2],[6,R_+c.t-1,2]],
  gelo:(R_,c)=>[[0,R_+12,1.5],[1.5,R_+c.f,.5],[2,R_+c.t+12,2],[4,R_+c.f+12,1.5],[5.5,R_+c.t,.5],[6,R_+12,2]],
  mar:(R_,c)=>[[0,R_,.66],[.66,R_+c.t,.34],[1,R_+c.f,1],[2,R_+c.f,.66],[2.66,R_+c.t,.34],[3,R_,1],[4,R_+5,1],[5,R_+c.f,1],[6,R_+c.t,1],[7,R_,1]],
  brasa:(R_,c)=>[[0,R_,.25],[.25,R_,.25],[.5,R_+1,.5],[1,R_,.5],[1.5,R_+7,.5],[2,R_+6,1],[4,R_,.25],[4.25,R_,.25],[4.5,R_+1,.5],[5,R_+3,1],[6,R_+1,2]]};
RIFF.boss=RIFF.combat;
musBeat=function(t){const M=MODES[MUS.mode],spb=60/(M.bpm*(MUS.p2&&/boss/.test(MUS.mode)?1.12:1)),pr=PROG[M.p],b=MUS.beat%8,F=!!M.fight;
  if(b==0){MUS.ci=(MUS.ci+(MUS.beat?1:0))%pr.length;if(MUS.ci==0&&MUS.beat)MUS.cyc++}
  const c=pr[MUS.ci];
  if(b==0){if(M.pad)iPad(t,c,8*spb);if(M.choir&&(MUS.mode=='night'||/boss|combat3|combat4/.test(MUS.mode)||MUS.ci%2==0))iChoir(t,c,8*spb);if(MUS.ci==pr.length-1&&M.drum>.3)iCymbal(t+5*spb,3*spb)}
  const mel=MEL[M.p],ph=MUS.cyc%3;if(mel&&!F){for(const[o,m,d]of mel[MUS.ci])if(o>=b&&o<b+1){const tt=t+(o-b)*spb;
    if(MUS.mode=='vila'||MUS.mode=='night'){if(ph!=2&&M.flute)iFlute(tt,m+(MUS.mode=='night'?0:12)*(ph==1?1:0),d*spb*.95);else if(M.horn&&MUS.mode=='night')iHorn(tt,m-12,d*spb*.95,.6)}
    else if(ph==0&&M.horn)iHorn(tt,m-12,d*spb*.95);else if(ph==1&&M.str)iStr(tt,m,d*spb*.95,.07)}}
  else if(F&&M.horn){const pat=(RIFF[M.riff||MUS.mode]||RIFF.combat)(c.r+12,c);for(const[o,m,d]of pat)if(o>=b&&o<b+1){const tt=t+(o-b)*spb;
    if(M.riff=='gelo'&&ph==1&&M.flute)iFlute(tt,m+12,d*spb*.9);else if((M.riff=='fera'||M.riff=='mar')&&ph==2&&M.flute)iFlute(tt,m+12,d*spb*.9);else iHorn(tt,m,d*spb*.9,/boss/.test(MUS.mode)?1.1:.9)}}
  const arp=[c.r+12,c.r+12+c.t,c.r+12+c.f,c.r+24],ord=M.riff=='morto'?[0,2,1,2,3,2,1,2]:[0,1,2,1,3,1,2,1];
  for(let h=0;h<2;h++){const tt=t+h*spb/2,i=(b*2+h)%8;
    if(M.str&&F)iStr(tt,arp[ord[i]]+(M.riff=='gelo'?12:0),spb*.45,.045+(h?0:.02));
    else if(M.str&&h==0&&MUS.mode!='vila'&&ph!=1)iStr(tt,arp[ord[i]]-12,spb*.9,.03);
    if(M.pluck)iPluck(tt,arp[ord[(i+b)%8]]+(MUS.mode=='vila'?0:12),h?.6:1);
    const dv=(DR[MUS.mode]||[])[(b*2+h)%16];if(dv&&M.drum)iTaiko(tt,dv);const sv=(SN[MUS.mode]||[])[(b*2+h)%16];if(sv)iSnare(tt,sv)}
  MUS.next=t+spb;MUS.beat++};
musUpd=function(dt){if(!MUS.started||!MUS.on||!MUS.ac)return;const a=MUS.ac;if(a.state!='running')return;
  musCk-=dt;if(musCk<=0){musCk=.5;MUS.want=musPickMode()}
  if(MUS.next<a.currentTime-.2)MUS.next=a.currentTime+.05;
  let n=0;while(MUS.next<a.currentTime+.3&&n++<4){
    if(MUS.want!=MUS.mode){const urgent=!!(MODES[MUS.want]||{}).fight,b=MUS.beat%8;if(b==0||urgent&&b%4==0){const wasCalm=!(MODES[MUS.mode]||{}).fight;MUS.mode=MUS.want;MUS.beat=0;MUS.ci=0;MUS.cyc=0;musLayers(urgent?.25:1.6);if(urgent&&wasCalm){iTaiko(MUS.next,1);iCymbal(MUS.next,.05)}}}
    musBeat(MUS.next)}};
// escolhe o tema da luta pelo inimigo mais perto e pela região
const UNDEAD=/zombie|ghoul|skel|mummy|cultist|zbrute|lich|iceskel/,BEAST=/wolf|boar|hyena|croc|spider|scorp|crab|bee|frog|redwolf|swolf|yeti/;
const _musPick15=musPickMode;musPickMode=function(){const m=_musPick15();if(m=='boss'){const b=E.find(e=>e.boss&&!e.dead&&e.st=='chase');return b&&b.type=='ignarok'?'boss2':'boss'}
  if(m!='combat')return m;if(MUS.fightK&&MUS.mode==MUS.fightK)return MUS.fightK;
  let n=null,bd=1e9;for(const e of E){if(e.dead||e.t.passive||e.st!='chase')continue;const d=hy(e.x-P.x,e.z-P.z);if(d<bd){bd=d;n=e}}const rid=REG[regionAt(P.x,P.z)].id,ty=n?n.type:'';
  const k=UNDEAD.test(ty)?'combat3':rid=='neve'||rid=='cristal'?'combat4':rid=='costa'||/pirate|bandit|bandarc|bshield|bbrute|bshaman|bassassin/.test(ty)&&rid!='plan'?'combat5':BEAST.test(ty)?'combat2':'combat';MUS.fightK=k;return k};

// ---------- efeitos sonoros
const SFX={g:null,last:{}};
function sfxOut(){try{au=au||new AudioContext()}catch(e){return null}if(!SFX.g){SFX.g=au.createGain();SFX.g.gain.value=.55;SFX.g.connect(au.destination);const n=au.sampleRate,b=au.createBuffer(1,n,n),d=b.getChannelData(0);for(let i=0;i<n;i++)d[i]=Math.random()*2-1;SFX.nz=b}return SFX.g}
const sfxGap=(k,ms)=>{const n=performance.now();if(SFX.last[k]&&n-SFX.last[k]<ms)return false;SFX.last[k]=n;return true};
function sNoise(t,dur,type,f0,f1,v,q){const o=sfxOut();if(!o)return;const s=au.createBufferSource(),f=au.createBiquadFilter(),g=au.createGain();s.buffer=SFX.nz;f.type=type;f.Q.value=q||1;f.frequency.setValueAtTime(f0,t);if(f1)f.frequency.exponentialRampToValueAtTime(f1,t+dur);
  g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(v,t+Math.min(.02,dur*.3));g.gain.exponentialRampToValueAtTime(.0001,t+dur);s.connect(f);f.connect(g);g.connect(o);s.start(t,Math.random()*.5,dur+.05)}
function sTone(t,type,f0,f1,dur,v){const o=sfxOut();if(!o)return;const s=au.createOscillator(),g=au.createGain();s.type=type;s.frequency.setValueAtTime(f0,t);if(f1)s.frequency.exponentialRampToValueAtTime(f1,t+dur);g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.0001,t+dur);s.connect(g);g.connect(o);s.start(t);s.stop(t+dur+.02)}
const sNow=()=>{sfxOut();return au?au.currentTime:0};
// golpes cortando o ar
function sfxWhoosh(kind){const t=sNow();if(!au)return;if(kind=='heavy'){sNoise(t,.42,'bandpass',900,180,.5,1.4);sTone(t,'sine',90,45,.3,.08)}else if(kind=='magic'){sNoise(t,.3,'bandpass',2400,900,.25,3);sTone(t,'sine',660,1320,.25,.05);sTone(t+.05,'sine',990,1980,.2,.04)}else sNoise(t,.24,'bandpass',2600,500,.45,1.6)}
// acertos: metal, osso, carne, flecha
function sfxHit(mat,crit){const t=sNow();if(!au)return;if(mat=='metal'){for(const[f,v,d]of[[820,.09,.5],[2263,.05,.35],[4428,.03,.22],[7300,.015,.15]])sTone(t,'sine',f*(.95+Math.random()*.1),0,d,v);sNoise(t,.06,'highpass',3000,0,.3)}
  else if(mat=='bone'){sNoise(t,.08,'bandpass',1800,900,.5,2);sTone(t,'square',420,180,.07,.05)}else if(mat=='arrow'){sNoise(t,.05,'highpass',2500,0,.25);sTone(t,'sine',220,90,.12,.12)}
  else{sTone(t,'sine',140,55,.18,.22);sNoise(t,.12,'lowpass',900,300,.4)}if(crit){sTone(t+.02,'triangle',1320,1760,.18,.05);sNoise(t,.15,'bandpass',4000,8000,.15,4)}}
function sfxClang(){const t=sNow();if(!au)return;for(const[f,v,d]of[[520,.12,.7],[1347,.07,.5],[2802,.04,.35],[4210,.02,.25]])sTone(t,'sine',f,0,d,v);sNoise(t,.08,'highpass',2500,0,.35)}
function sfxTwang(){const t=sNow();if(!au)return;sTone(t,'triangle',240,150,.25,.14);sTone(t,'sawtooth',480,300,.08,.03);sNoise(t+.02,.25,'bandpass',3500,1500,.12,2)}
// equipar: cada peça tem seu som
function sfxEquip(it){const t=sNow();if(!au||!it)return;const v=it.vk||it.wk||'';
  if(it.slot=='arma'||(it.slot=='mao2'&&it.wd)){sNoise(t,.35,'bandpass',4000,1600,.3,3);sTone(t+.25,'sine',1560,0,.5,.04)}
  else if(it.slot=='mao2'){sTone(t,'sine',160,70,.2,.18);sfxClang()}
  else if(it.slot=='anel'||it.slot=='amuleto'){for(let i=0;i<3;i++)sTone(t+i*.07,'sine',1800+i*420,0,.4,.05)}
  else if(it.slot=='costas'){for(let i=0;i<2;i++)sNoise(t+i*.14,.16,'bandpass',520,380,.35,6)}
  else if(v=='chain'){for(let i=0;i<7;i++)sNoise(t+i*.035+Math.random()*.02,.05,'highpass',5000,0,.18)}
  else if(/plate|helm|greathelm|horn|gaunt|greaves/.test(v)){sfxClang();sNoise(t+.08,.1,'highpass',4000,0,.15)}
  else sNoise(t,.3,'lowpass',1400,500,.3)}
function sfxGulp(){const t=sNow();if(!au)return;for(let i=0;i<3;i++){sTone(t+i*.16,'sine',220-i*20,120,.12,.16);sNoise(t+i*.16+.05,.08,'bandpass',700,400,.15,5)}}
function sfxCoin(){if(!sfxGap('coin',70))return;const t=sNow();if(!au)return;sTone(t,'sine',2100,0,.18,.06);sTone(t+.06,'sine',2800,0,.22,.05)}
// passos conforme o chão
function sfxStep(k,v){const t=sNow();if(!au)return;v=v||1;
  if(k=='stone'){sNoise(t,.05,'highpass',2200,0,.18*v);sTone(t,'sine',260,140,.05,.05*v)}else if(k=='sand'){sNoise(t,.14,'bandpass',2800,1600,.12*v,1.2)}
  else if(k=='snow'){for(let i=0;i<3;i++)sNoise(t+i*.025,.06,'bandpass',1500+Math.random()*800,0,.14*v,4)}else if(k=='water'){sNoise(t,.22,'bandpass',900,2600,.22*v,1.5);sTone(t,'sine',300,600,.12,.04*v)}
  else if(k=='hoof'){sTone(t,'sine',120,60,.1,.2*v);sNoise(t,.05,'highpass',1800,0,.12*v)}else sNoise(t,.12,'lowpass',700,300,.2*v)}
function stepKind(){if(P.mounted)return'hoof';if(waterDepth()>.05)return'water';const rid=REG[regionAt(P.x,P.z)].id,h=groundAt(P.x,P.z);
  if(roadD(P.x,P.z)<1.7||rid=='vila'&&hy(P.x,P.z)<19.5||onBridge(P.x,P.z))return'stone';if(rid=='neve')return'snow';if(rid=='deserto'||h<.6&&rid!='mang')return'sand';return'grass'}
let stepT=0,lastGold=null;
function sfxUpd(dt){if(!run)return;if(lastGold!=null&&P.gold>lastGold&&UI.open!='shop')sfxCoin();lastGold=P.gold;
  const v=P.v||0;if(v>1.2&&!P.air&&!P.dead&&!(P.dash>0)&&!(P.roll>0)){stepT-=dt*Math.min(2.2,v/3.6)*(P.mounted?1.6:1);if(stepT<=0){stepT=.5;sfxStep(stepKind(),P.sneak?.35:P.run?1.2:.8)}}else stepT=Math.min(stepT,.15)}
// ---------- ganchos
const _attack15=attack;attack=function(){const before=P.act;const r=_attack15();const a=P.act;if(a&&a!==before){const w=EQ.arma,v=w?(w.vk||w.wk):'';
    if(a.k=='shoot'||a.k=='shootUp')setTimeout(sfxTwang,Math.max(0,a.dur*.6*1000-30));else if(/staff|wand/.test(v)||a.sk=='orbe')sfxWhoosh('magic');else sfxWhoosh(/axe|mace|hammer|raxe|gsword|club/.test(v)||/gsword|hammer|gaxe|scythe/.test(ST.ws||'')||a.pf&&a.pf.big||a.k=='slam'||a.k=='finisher'?'heavy':'light')}return r};
const _hurtMob15=hurtMob;hurtMob=function(e,d,crit,src){const was=e.hp;const r=_hurtMob15.apply(this,arguments);if(!e.dead&&e.hp>=was&&!(e.hp<=0))return r;
  if((src=='golpe'||src=='proj'||src=='flecha')&&sfxGap('hit',55)){const ty=e.type||'',mat=src!='golpe'?'arrow':UNDEAD.test(ty)?'bone':/golem|cgolem|totem|bshield|skelwar|knight|yeti/.test(ty)||e.t.r>1?'metal':'flesh';sfxHit(mat,crit)}return r};
const _dash15=dash;dash=function(){const was=P.dash;_dash15();if(P.dash>0&&!(was>0))sfxWhoosh('light')};
const _equip16=equip;equip=function(i,quiet,off){const it=INV[i];const r=_equip16(i,quiet,off);if(it&&!quiet&&!INV.includes(it)&&it.slot!='pot')sfxEquip(it);return r};
const _drink15=drinkAt;drinkAt=function(i){const it=INV[i];_drink15(i);if(it&&!INV[i])sfxGulp()};
const _hitP16=hitPlayer;hitPlayer=function(d,o){const blk=P.block>0;const r=_hitP16(d,o);if(blk&&r!==0&&sfxGap('blk',90))sfxClang();return r};
const _feel15=feelUpd;feelUpd=function(dt){_feel15(dt);sfxUpd(dt)};
