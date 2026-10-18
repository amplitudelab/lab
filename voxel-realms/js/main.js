'use strict';
/* =============================================================================
   VOXEL REALMS · principal
   carregamento, tela de título, laço do jogo, salvar/carregar
   ============================================================================= */
const SK_SAVE='vr11_save',SV=1;
function save(){if(!run)return;try{localStorage.setItem(SK_SAVE,JSON.stringify({v:SV,t:Date.now(),P:{x:P.x,z:P.z,f:P.f,lv:P.lv,xp:P.xp,gold:P.gold,hp:P.hp,disc:[...P.disc],merc:P.merc&&P.merc.merc},
  INV,EQ,iid,QS,BOUNTY:BOUNTY.q,WP:WP.filter(w=>w.on).map(w=>w.id),CH:CHESTS.map(c=>c.o),LORE:[...LORE_FOUND],BEST,DAY:DAY.t,FOG:[...FOG],BDEF,SHOP}))}catch(e){}}
function hasSave(){try{const s=JSON.parse(localStorage.getItem(SK_SAVE)||'null');return!!(s&&s.P)}catch(e){return false}}
function load(){try{const s=JSON.parse(localStorage.getItem(SK_SAVE)||'null');if(!s||!s.P)return 0;const p=s.P;for(const k of['x','z','f','lv','xp','gold','hp'])if(typeof p[k]=='number'&&isFinite(p[k]))P[k]=p[k];
  P.lv=cl(P.lv|0,1,40);(p.disc||[]).forEach(d=>P.disc.add(d));if(Array.isArray(s.INV))s.INV.slice(0,30).forEach((it,i)=>INV[i]=it&&it.slot?it:null);if(s.EQ)for(const k in EQ)if(s.EQ[k]&&s.EQ[k].slot==k)EQ[k]=s.EQ[k];iid=s.iid||1000;
  if(s.QS)for(const k in s.QS)if(QS[k]){QS[k].st=s.QS[k].st|0;QS[k].p=s.QS[k].p|0;QS[k].got=Array.isArray(s.QS[k].got)?s.QS[k].got:[]}BOUNTY.q=s.BOUNTY||null;
  (s.WP||[]).forEach(id=>{const w=WP.find(w=>w.id==id);if(w)w.on=1});(s.CH||[]).forEach((o,i)=>{if(o&&CHESTS[i]){CHESTS[i].o=1;CHESTS[i].lid.rotation.x=-1.95}});(s.LORE||[]).forEach(l=>LORE_FOUND.add(l));Object.assign(BEST,s.BEST||{});Object.assign(BDEF,s.BDEF||{});
  if(typeof s.DAY=='number')DAY.t=s.DAY;(s.FOG||[]).forEach(f=>FOG.add(f));if(Array.isArray(s.SHOP)&&s.SHOP.length)SHOP=s.SHOP;
  for(const q of QD)if(QS[q.id].st==1&&(q.t=='collect'||q.t=='interact'))qObjSpawn(q);
  P.x=cl(P.x,-WMAX,WMAX);P.z=cl(P.z,-WMAX,WMAX);calcStats();if(P.hp<=0)P.hp=ST.mx;if(p.merc){const n=NPC.find(n=>n.merc==p.merc);if(n){P.merc=n;n.follow=1;n.still=0}}return 1}catch(e){console.warn('save inválido',e);return 0}}
setInterval(save,15000);addEventListener('pagehide',save);document.addEventListener('visibilitychange',()=>{if(document.hidden)save()});

// ---------- som (osciladores simples)
let au=null;
function snd(f,d,t){try{au=au||new AudioContext();const o=au.createOscillator(),g=au.createGain();o.type=t||'square';o.frequency.value=f;g.gain.value=.045;o.connect(g);g.connect(au.destination);o.start();g.gain.exponentialRampToValueAtTime(.001,au.currentTime+d);o.stop(au.currentTime+d)}catch(e){}}
function sweep(f0,f1,d,t,v){try{au=au||new AudioContext();const o=au.createOscillator(),g=au.createGain();o.type=t||'square';o.frequency.setValueAtTime(f0,au.currentTime);o.frequency.exponentialRampToValueAtTime(f1,au.currentTime+d);g.gain.value=v||.04;o.connect(g);g.connect(au.destination);o.start();g.gain.exponentialRampToValueAtTime(.001,au.currentTime+d);o.stop(au.currentTime+d)}catch(e){}}

// ---------- início
spawnNPCs();calcStats();shopRoll();P.hp=ST.mx;bindInput();bindWindows();
const HS=hasSave();let LOADING=true,mapG=mapGen(),mapP=0,needN=0;
P.y=groundAt(P.x,P.z);CAMS.cx=P.x;CAMS.cz=P.z;CAMS.cy=P.y;
$('gfx').textContent='GRÁFICOS: '+GFX.n;$('gfx').onclick=()=>{try{localStorage.setItem('vr11_gfx',String((GL+1)%3))}catch(e){}location.reload()};
if(HS){$('ct').style.display='';$('ng').textContent='NOVO JOGO'}
$('ct').onclick=()=>{load();begin(false)};let ngc=0;$('ng').onclick=()=>{if(HS&&!ngc){ngc=1;$('ng').textContent='TOQUE DE NOVO P/ APAGAR O SAVE';return}try{localStorage.removeItem(SK_SAVE)}catch(e){}begin(true)};
function goFull(){try{const d=document.documentElement,f=d.requestFullscreen||d.webkitRequestFullscreen;if(!f||!MOB)return;const p=f.call(d);const lk=()=>{try{screen.orientation&&screen.orientation.lock&&screen.orientation.lock('landscape').catch(()=>{})}catch(e){}};if(p&&p.then)p.then(lk).catch(()=>{});else lk()}catch(e){}}
function begin(fresh){if(run)return;document.activeElement&&document.activeElement.blur&&document.activeElement.blur();$('title').classList.add('off');document.body.classList.add('run');run=1;goFull();try{au=au||new AudioContext();au.resume&&au.resume()}catch(e){}snd(440,.1,'sine');
  teleport(P.x,P.z);P.y=groundAt(P.x,P.z);calcStats();hud();trackUpd();regionUpd();qAvail();
  if(fresh){EQ.arma={id:iid++,slot:'arma',rar:0,ilvl:1,base:'Espada Curta',n:'Espada do Guardião',ic:'⚔️',wk:'sword',aff:{},wd:[6,9],spd:1,price:5};calcStats();P.hp=ST.mx;hud();qStart(QIDX.m1,1);say([['Narrador','Aldoria, cem anos depois da Guerra das Brasas. O dragão Ignarok dorme selado sob a Caldeira, ao nordeste.','📜'],['Narrador','Esta noite, a Estátua de Aldor rachou. Uma Sombra se espalha pelas colmeias, florestas, cemitérios e pântanos.','🌑'],['Narrador','Você é Kael, o novo Guardião de Pedraverde. O Ancião Bram espera por você na vila.',KA],['Dica','Mova-se com o joystick, segure ⚔️ para atacar e use as habilidades da barra. Toque em 💬 perto das pessoas para conversar.','💡']],()=>{trackUpd()})}
  else toast('💾','Bem-vindo de volta',REG[regionAt(P.x,P.z)].n);save()}
// ---------- laço
let last=performance.now(),hT=0,hfT=0,mmT=0,rT=0,shT=0,fN=0,fT=0,lowF=0;
function frame(now){requestAnimationFrame(frame);const raw=Math.min(.1,(now-last)/1000);last=now;const rdt=Math.min(.05,raw),t=now/1000;let dt=run&&!UI.block()?rdt:0;if(HITSTOP>0){HITSTOP-=rdt;dt*=.15}
  // carregamento inicial (gera o mapa e os pedaços em fatias)
  if(LOADING){worldUpd(P.x,P.z,MOB?40:60);if(!needN)needN=BQ.length||1;if(mapP<1){const r=mapG.next();mapP=r.done?1:r.value}const k=(1-BQ.length/needN)*.6+mapP*.4;$('ldb').style.width=(k*100)+'%';
    if(!BQ.length&&mapP>=1){LOADING=false;$('ld').classList.add('off');$('tbtn').classList.add('on')}}
  else worldUpd(P.x,P.z,MOB?4:7);
  fN++;fT+=raw;if(fT>2){const f=fN/fT;fN=fT=0;if(run&&f<22&&!LOADING){if(++lowF>=3&&PO.on){PO.on=false;toast('⚙️','Efeitos reduzidos','Para manter o jogo fluido.')}}else lowF=0}
  dayUpd(run?rdt:rdt*4);
  if(run){playerUpd(dt,t);mobsUpd(dt,t);npcUpd(dt,t);animalsUpd(dt,t);projUpd(dt);lootUpd(dt,t);qObjUpd(dt,t);interUpd();wpUpd()}
  else{CAMS.yawT+=rdt*.06;npcUpd(rdt,t);animalsUpd(rdt,t)}
  placesUpd(rdt,t);fxUpd(dt,rdt,t);ambUpd(rdt,t,P.x,P.z);birdsUpd(rdt,t,P.x,P.z);haloUpd(t);cloudsUpd(rdt,P.x,P.z);waterUpd(P.x,P.z,t);SHU.uT.value=t;SKU.t.value=t;
  INV_OPEN.k+=((UI.open=='inv'?1:0)-INV_OPEN.k)*damp(6,rdt);if(!run)P.m.g.position.set(P.x,P.y,P.z);if(!run)animate(P.m,rdt,t,{v:0});
  camUpd(rdt);dlgUpd(raw);
  if(run){hfT-=rdt;if(hfT<=0){hfT=.1;hudFast()}hT-=rdt;if(hT<=0){hT=.5;hud();regionUpd()}mmT-=rdt;if(mmT<=0){mmT=.15;minimap()}npcLabels();
    const tg=qTarget();if(tg&&hy(tg[0]-P.x,tg[1]-P.z)>14){QBEAM.visible=true;QBEAM.position.set(tg[0],groundAt(tg[0],tg[1])+15,tg[1]);QBEAM.material.opacity=.14+.06*S(t*3)}else QBEAM.visible=false;
    if(UI.open=='map'){rT-=rdt;if(rT<=0){rT=.5;mapRender()}}}
  if(!rd.shadowMap.autoUpdate){shT-=rdt;if(shT<=0){shT=1/15;rd.shadowMap.needsUpdate=true}}
  render()}
requestAnimationFrame(frame);
