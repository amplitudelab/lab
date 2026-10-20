'use strict';
/* =============================================================================
   VOXEL REALMS · interface
   HUD estilo Diablo (orbes de vida e fúria, barra de habilidades), alvo, chefe,
   minimapa, mapa-múndi com teleporte, diário, inventário, loja, recompensas,
   diálogos, avisos, controles de toque/teclado e câmera
   ============================================================================= */
const UI={atkHeld:0,open:null,block(){return!!this.open||!!DLG||!run}};let run=0;
// ---------- câmera
const CAMS={yaw:0,yawT:0,pit:.62,pitT:.62,dist:13,dT:13,cx:0,cz:0,cy:0,shk:0};const LTV=new V3(),_cd=new V3();
function camUpd(dt){const c=CAMS;c.yaw+=angDiff(c.yaw,c.yawT)*damp(12,dt);c.pit+=(c.pitT-c.pit)*damp(10,dt);c.dist+=(c.dT-c.dist)*damp(6,dt);
  c.cx+=(P.x-c.cx)*damp(10,dt);c.cz+=(P.z-c.cz)*damp(10,dt);c.cy+=(P.y-c.cy)*damp(8,dt);
  let d=c.dist+(BOSSON?3:0);const sy=S(c.yaw)*C(c.pit),cz=C(c.yaw)*C(c.pit),sp=S(c.pit);
  let x=c.cx+sy*d,z=c.cz+cz*d,y=c.cy+1.6+sp*d;const g=groundAt(x,z)+1.2;if(y<g)y=g;
  if(INV_OPEN.k>.002){const k=INV_OPEN.k*INV_OPEN.k*(3-2*INV_OPEN.k),a=c.yaw+angDiff(c.yaw,P.f)*k,dd=lerp(d*C(c.pit),INV_OPEN.dd||5.6,k);x=P.x+S(a)*dd;z=P.z+C(a)*dd;y=lerp(y,P.y+2.3,k);LTV.set(lerp(c.cx,P.x,k),lerp(c.cy+1.4,P.y+1.6,k),lerp(c.cz,P.z,k));cam.setViewOffset(innerWidth,innerHeight,innerWidth*INV_OPEN.off*k,innerHeight*(INV_OPEN.oy||0)*k,innerWidth,innerHeight)}
  else{LTV.set(c.cx,c.cy+1.4,c.cz);if(cam.view&&cam.view.enabled)cam.clearViewOffset()}
  const tf=fovT()+(P.run&&P.v>6?6:0)+(P.dash>0?6:0)+(P.air?3:0);if(Math.abs(tf-cam.fov)>.05){cam.fov+=(tf-cam.fov)*damp(5,dt);cam.updateProjectionMatrix()}
  const tq=performance.now()/1000,sk=SHK*.42;cam.position.set(x+(S(tq*41)+S(tq*23.7+1.7)*.6)*sk,y+(S(tq*37.1+.6)+S(tq*19.3+2.1)*.6)*sk,z+(S(tq*29.3+3.3)+S(tq*45.9)*.5)*sk);SHK*=Math.pow(.02,dt);cam.lookAt(LTV);cam.updateMatrixWorld();SHU.uCam.value.copy(cam.position);SHU.uPl.value.set(P.x,P.y+1.4,P.z);
  SKY.position.copy(cam.position);for(const l of MTN)l.m.position.set(cam.position.x,Math.max(0,P.y-4)*.6,cam.position.z);
  cam.getWorldDirection(_cd);const fc=_cd.dot(SUND);_pp.copy(SUND).multiplyScalar(400).add(cam.position).project(cam);SUNV=_pp.z<1&&fc>.05&&ELEV>-.05?cl((fc-.05)*1.6,0,1):0;SUNP.set(_pp.x*.5+.5,_pp.y*.5+.5);
  const t=SHU.uT.value;SUN.target.position.set(P.x,P.y,P.z);SUN.position.copy(SUN.target.position).addScaledVector(LD,70);}
const INV_OPEN={k:0,off:.27};
// ---------- entrada: joystick, botões, teclado, arrastar para girar a câmera
let jx=0,jy=0,jid=null;const kd={};
function inputDir(){if(UI.block())return[0,0];const x=jx+(kd.KeyD||kd.ArrowRight?1:0)-(kd.KeyA||kd.ArrowLeft?1:0),y=jy+(kd.KeyW||kd.ArrowUp?1:0)-(kd.KeyS||kd.ArrowDown?1:0),m=hy(x,y);if(m<.12)return[0,0];const k=Math.min(1,m)/m,yw=CAMS.yaw;return[(-S(yw)*y+C(yw)*x)*k,(-C(yw)*y-S(yw)*x)*k]}
function bindInput(){const jb=$('jb'),jk=$('jk');
  const jm=e=>{const r=jb.getBoundingClientRect(),R_=r.width*.36;let dx=e.clientX-r.left-r.width/2,dy=e.clientY-r.top-r.height/2;const l=hy(dx,dy);if(l>R_){dx*=R_/l;dy*=R_/l}jx=dx/R_;jy=-dy/R_;jk.style.transform=`translate(calc(-50% + ${dx}px),calc(-50% + ${dy}px))`};
  jb.onpointerdown=e=>{jid=e.pointerId;jb.setPointerCapture(jid);jm(e)};jb.onpointermove=e=>{if(e.pointerId==jid)jm(e)};jb.onpointerup=jb.onpointercancel=e=>{if(e.pointerId==jid){jid=null;jx=jy=0;jk.style.transform=''}};
  const cv=rd.domElement;let cid=null,lx=0,ly=0;cv.onpointerdown=e=>{if(cid!=null)return;cid=e.pointerId;lx=e.clientX;ly=e.clientY;cv.setPointerCapture(cid);if(DLG)dlgNext()};
  cv.onpointermove=e=>{if(e.pointerId!=cid)return;const k=900/Math.max(600,innerWidth);if(INV_OPEN.k>.5)INV_OPEN.rot=(INV_OPEN.rot||0)+(e.clientX-lx)*.012;else if(FPV.on){CAMS.yawT-=(e.clientX-lx)*.0075*k;CAMS.yaw=CAMS.yawT;FPV.pitch=cl(FPV.pitch-(e.clientY-ly)*.0055*k,-1.2,1.15)}else{CAMS.yawT-=(e.clientX-lx)*.0065*k;CAMS.pitT=cl(CAMS.pitT+(e.clientY-ly)*.003*k,.22,1.15)}lx=e.clientX;ly=e.clientY};cv.onpointerup=cv.onpointercancel=e=>{if(e.pointerId==cid)cid=null};
  cv.addEventListener('wheel',e=>{CAMS.dT=cl(CAMS.dT+e.deltaY*.01,6,22)},{passive:true});
  const hold=(id,fn,up)=>{const b=$(id);b.onpointerdown=e=>{e.stopPropagation();b.setPointerCapture(e.pointerId);fn()};if(up)b.onpointerup=b.onpointercancel=up};
  hold('atk',()=>{UI.atkHeld=1;attack()},()=>UI.atkHeld=0);hold('rolb',dash);hold('runb',()=>toggleRun());hold('mntb',mount);hold('torb',()=>torchToggle());hold('blkb',()=>blockSet(1),()=>blockSet(0));hold('snkb',()=>sneakSet());$('zmi').onclick=()=>mmZoom(1);$('zmo').onclick=()=>mmZoom(-1);hold('potb',potion);hold('itb',()=>INTN&&INTN.act());
  [0,1,2,3].forEach(i=>hold('sk'+i,()=>useSkill(i)));$('treeb').onclick=()=>openTree();
  $('bagb').onclick=()=>openInv();$('mapb').onclick=()=>openMap(false);$('jrnb').onclick=()=>openJournal();$('menb').onclick=()=>openMenu();$('fpvb').onclick=()=>fpvToggle();$('fpvb').classList.toggle('on',FPV.on);$('qh').onclick=()=>$('qp').classList.toggle('min');
  addEventListener('keydown',e=>{if(e.repeat)return;kd[e.code]=1;if(!run)return;const c=e.code;
    if(DLG){if(c=='Enter'||c=='Space'||c=='KeyE')dlgNext();return}
    if(c=='Escape'){if(UI.open)closeAll();else openMenu();return}if(c=='KeyI'||c=='KeyB'){UI.open=='inv'?closeAll():openInv();return}if(c=='KeyM'){UI.open=='map'?closeAll():openMap(false);return}if(c=='KeyK'||c=='KeyT'){UI.open=='tree'?closeAll():openTree();return}if(c=='KeyJ'||c=='KeyL'){UI.open=='jrn'?closeAll():openJournal();return}
    if(UI.open)return;if(c=='Space'){UI.atkHeld=1;attack()}if(/Digit[1-4]/.test(c))useSkill(+c[5]-1);if(c=='KeyQ')potion();if(c=='ShiftLeft'||c=='ShiftRight')toggleRun(1);if(c=='KeyC'||c=='ControlLeft'||c=='KeyV')dash();if(c=='KeyE')INTN&&INTN.act();if(c=='KeyF')jump();if(c=='KeyR')mount();if(c=='KeyG')torchToggle();if(c=='KeyZ')blockSet(1);if(c=='KeyN')sneakSet();if(c=='KeyX'||c=='F5'){e.preventDefault();fpvToggle()}if(c=='Equal'||c=='NumpadAdd')mmZoom(1);if(c=='Minus'||c=='NumpadSubtract')mmZoom(-1)});
  addEventListener('keyup',e=>{kd[e.code]=0;if(e.code=='KeyZ')blockSet(0);if(e.code=='Space')UI.atkHeld=0;if(e.code=='ShiftLeft'||e.code=='ShiftRight')toggleRun(0)});
  addEventListener('blur',()=>{for(const k in kd)kd[k]=0;UI.atkHeld=0})}
// ---------- avisos e faixas
const TQ=[];let tBusy=0;
function toast(ic,h,b){TQ.push([ic,h,b]);if(TQ.length>4)TQ.shift();toastNext()}
function toastNext(){if(tBusy||!TQ.length)return;tBusy=1;const[ic,h,b]=TQ.shift(),t=$('ts');t.innerHTML=`<i>${ic}</i><b>${h}</b>${b?`<span>${b}</span>`:''}`;t.classList.add('on');setTimeout(()=>{t.classList.remove('on');setTimeout(()=>{tBusy=0;toastNext()},350)},2600)}
function banner(t){const b=$('bn');b.textContent=t;b.classList.remove('on');void b.offsetWidth;b.classList.add('on')}
// ---------- diálogo (com escrita animada e escolhas)
let DLG=null;const DQ=[];
function say(lines,cb,choice){if(DLG){DQ.push([lines,cb,choice]);return}DLG={lines,i:0,cb,choice,txt:'',k:0};$('dlg').classList.add('on');document.body.classList.add('cine');jx=jy=0;UI.atkHeld=0;dlgShow()}
function dlgShow(){const[w,t,ic]=DLG.lines[DLG.i];$('dn').textContent=w;$('di').textContent=ic||'📜';DLG.txt=t;DLG.k=0;$('dt').textContent='';$('dch').innerHTML=''}
function dlgNext(){if(!DLG)return;if(DLG.k<DLG.txt.length){DLG.k=DLG.txt.length;$('dt').textContent=DLG.txt;dlgChoice();return}if($('dch').childElementCount)return;if(++DLG.i<DLG.lines.length)return dlgShow();dlgEnd(true)}
function dlgChoice(){if(DLG.choice&&DLG.i==DLG.lines.length-1&&!$('dch').childElementCount){$('dch').innerHTML=`<button class="ib" id="dy">${DLG.choice.yes}</button><button class="ib off" id="dno">${DLG.choice.no}</button>`;$('dy').onclick=e=>{e.stopPropagation();dlgEnd(true)};$('dno').onclick=e=>{e.stopPropagation();dlgEnd(false)}}}
function dlgEnd(ok){const cb=DLG.cb;DLG=null;$('dlg').classList.remove('on');document.body.classList.remove('cine');if(ok&&cb)cb();if(!DLG&&DQ.length){const[l,c,ch]=DQ.shift();say(l,c,ch)}}
function dlgUpd(rdt){if(DLG&&DLG.k<DLG.txt.length){DLG.k=Math.min(DLG.txt.length,DLG.k+rdt*52);$('dt').textContent=DLG.txt.slice(0,DLG.k|0);if(DLG.k>=DLG.txt.length)dlgChoice()}}
// ---------- HUD
function hud(){if(!ST.mx)return;const hp=cl(P.hp/ST.mx,0,1);$('hpo').style.setProperty('--f',hp);$('hpt').textContent=Math.ceil(P.hp)+'/'+ST.mx;$('fuo').style.setProperty('--f',P.fury/100);$('fut').textContent=Math.floor(P.fury);
  $('xpf').style.width=(P.xp/XPN(P.lv)*100)+'%';$('lvl').textContent=P.lv;$('gold').textContent=fmt(P.gold);$('lvn').textContent=nameTag()+' · Nível '+P.lv;
  P.bar.forEach((k,i)=>{const b=$('sk'+i),S_=k&&SK[k];b.classList.toggle('lock',!S_);b.querySelector('i').textContent=S_?S_.ic:'＋';b.querySelector('em').textContent=S_?(S_.cost||''):'';b.title=S_?S_.n:'Escolher habilidade'});
  $('fuo').classList.toggle('mana',MANA()&&P.cls!='necromante');$('fuo').classList.toggle('soul',MANA()&&P.cls=='necromante');$('fuo').classList.toggle('blood',!MANA()&&P.cls=='vampiro');$('treeb').classList.toggle('nw',P.sp>0);
  $('atk').querySelector('i').textContent=bow()?'🏹':EQ.arma?EQ.arma.ic:'👊';$('rolb').querySelector('i').textContent='💨';$('mrc').textContent=P.merc?MERC[P.merc.merc].ic+' '+MERC[P.merc.merc].n:'';
  $('buffs').innerHTML=Object.keys(P.buff).map(k=>`<span title="${(SHRN[k]||{}).n||(k=='pf'?'Crítico garantido':'Grito de Guerra')}">${k=='grito'?'📯':k=='pf'?'✦':(SHRN[k]||{ic:'✨'}).ic}<em>${Math.ceil(P.buff[k])}</em></span>`).join('')}
function hudFast(){const cdEl=(id,v,mx)=>$(id).style.setProperty('--c',mx?cl(v/mx,0,1):0);P.bar.forEach((k,i)=>cdEl('sk'+i,k?P.cd[k]||0:0,k?cdOf(k):0));cdEl('potb',P.cd.pocao||0,SKX.pocao.cd);cdEl('rolb',P.cd.dash||0,cdOf('dash'));
  $('hpo').style.setProperty('--f',cl(P.hp/ST.mx,0,1));$('hpt').textContent=Math.ceil(P.hp)+'/'+ST.mx;$('fuo').style.setProperty('--f',P.fury/100);$('fut').textContent=Math.floor(P.fury);$('hpo').classList.toggle('psn',P.psn>0);$('hpo').classList.toggle('low',P.hp<ST.mx*.3);
  const tf=$('tf');TGTt-=.1;if(TGT&&!TGT.dead&&TGTt>0&&!TGT.boss&&hy(TGT.x-P.x,TGT.z-P.z)<30){tf.classList.add('on');$('tfn').textContent=TGT.name+(TGT.el?'':'')+' · Nv '+TGT.lv;$('tfn').style.color=TGT.el==2?'#ffe14a':TGT.el==1?'#8ab4ff':'#f4ead2';$('tfa').textContent=TGT.afx.map(a=>AFF[a].n).join(' · ');$('tfb').style.width=Math.max(0,TGT.hp/TGT.mx*100)+'%'}else tf.classList.remove('on')}
// ---------- região atual
let REGC=-1,POIC='';
function regionUpd(){const r=regionAt(P.x,P.z),p=POI.find(p=>hy(P.x-p.x,P.z-p.z)<p.r),nm=p?p.n:REG[r].n;$('rn').textContent=nm;$('rl').textContent='Nível '+mobLv(r)+' · '+clockStr()+' '+wxIcon();
  if(r!=REGC||nm!=POIC){if(REGC>=0||r){const R_=REG[r];$('zt').innerHTML=`<b>${nm}</b><span>${p?R_.n:R_.amb}</span>`;$('zt').classList.remove('on');void $('zt').offsetWidth;$('zt').classList.add('on')}REGC=r;POIC=nm;if(!P.disc.has(REG[r].id)){P.disc.add(REG[r].id);qAvail()}}
  const gx=Math.floor((P.x+WMH)/10),gz=Math.floor((P.z+WMH)/10);for(let a=-2;a<=2;a++)for(let b=-2;b<=2;b++)FOG.add((gx+a)+','+(gz+b))}
const clockStr=()=>{const h=(DAY.t*24)%24;return(h|0).toString().padStart(2,'0')+':'+(((h%1)*60)|0).toString().padStart(2,'0')+(NIGHT>.5?' 🌙':ELEV<.3?' 🌅':' ☀️')};
// ---------- mapa do mundo pré-desenhado (usado no minimapa e no mapa-múndi)
const MAPS=384,MAPQ=MAPS/(2*WMH),MAPC=document.createElement('canvas');MAPC.width=MAPC.height=MAPS;const MAPX=MAPC.getContext('2d'),FOG=new Set();
function* mapGen(){const img=MAPX.createImageData(MAPS,MAPS),d=img.data,k=2*WMH/MAPS;for(let j=0;j<MAPS;j++){for(let i=0;i<MAPS;i++){const x=-WMH+i*k+k/2,z=-WMH+j*k+k/2,h=rawH(x,z),r=regionAt(x,z);let c;
    if(h<-.3)c=r==4?[62,74,52]:[52,128,196];else if(Math.max(Math.abs(x),Math.abs(z))>WMAX-9)c=[120,118,112];else if(roadD(x,z)<2)c=[168,140,92];else{const hx=REG[r].map;c=[parseInt(hx.slice(1,3),16),parseInt(hx.slice(3,5),16),parseInt(hx.slice(5,7),16)];const sh=.85+cl(h,0,12)*.025;c=c.map(v=>v*sh)}
    if(hy(x,z)<54.5&&hy(x,z)>52.5)c=[110,80,50];const o=(i+j*MAPS)*4;d[o]=c[0];d[o+1]=c[1];d[o+2]=c[2];d[o+3]=255}if(j%6==5)yield j/MAPS}MAPX.putImageData(img,0,0);
  MAPX.fillStyle='#d9a948';for(const b of BRIDGES){MAPX.fillRect((b.x+WMH)*MAPQ-2,(b.z+WMH)*MAPQ-2,4,4)}yield 1}
const mm=$('mc').getContext('2d');
function minimap(){const c=mm,W=160,M=80,s=MMZ[mmZi],X=x=>M+(x-P.x)*s,Z=z=>M+(z-P.z)*s;c.save();c.clearRect(0,0,W,W);c.beginPath();c.arc(M,M,M-4,0,7);c.clip();c.fillStyle='#1a2a1a';c.fillRect(0,0,W,W);
  c.imageSmoothingEnabled=false;const px=(P.x+WMH)*MAPQ,pz=(P.z+WMH)*MAPQ,span=W/s*MAPQ;c.drawImage(MAPC,px-span/2,pz-span/2,span,span,0,0,W,W);
  const dot=(x,z,col,r)=>{c.fillStyle=col;c.beginPath();c.arc(X(x),Z(z),r,0,7);c.fill()};
  for(const w of WP){c.fillStyle=w.on?'#8fe8ff':'#58607a';c.font='12px serif';c.textAlign='center';c.textBaseline='middle';c.fillText('◆',X(w.x),Z(w.z))}
  for(const s_ of SHRINES)if(!s_.used)dot(s_.x,s_.z,'#'+SHRN[s_.ty].c.toString(16).padStart(6,'0'),2.5);for(const ch of CHESTS)if(!ch.o){c.fillStyle='#ffd34a';c.fillRect(X(ch.x)-2.5,Z(ch.z)-2.5,5,5)}
  for(const n of NPC)if(!n.hidden)dot(n.x,n.z,n.merc?'#9ae4ff':'#fff',2);for(const e of E)if(!e.dead)dot(e.x,e.z,e.boss?'#ff3030':e.el==2?'#ffe14a':e.el==1?'#6a9cff':'#e33',e.boss?5:e.el?3.2:2.2);
  drawMarks(c,X,Z,M);
  const tg=qTarget();if(tg){let tx=X(tg[0]),tz=Z(tg[1]);const dx=tx-M,dz=tz-M,l=hy(dx,dz);if(l>M-14){tx=M+dx/l*(M-14);tz=M+dz/l*(M-14)}c.fillStyle='#ffd34a';c.strokeStyle='#000';c.lineWidth=1.5;c.beginPath();c.moveTo(tx,tz-8);c.lineTo(tx+6,tz);c.lineTo(tx,tz+8);c.lineTo(tx-6,tz);c.closePath();c.fill();c.stroke();c.fillStyle='#000';c.font='bold 11px Georgia';c.fillText('!',tx,tz+1)}
  c.translate(M,M);c.rotate(PI-P.f);c.fillStyle='#ffd34a';c.strokeStyle='#000';c.beginPath();c.moveTo(0,-8);c.lineTo(6,6);c.lineTo(0,3);c.lineTo(-6,6);c.closePath();c.fill();c.stroke();c.restore();
  c.lineWidth=6;c.strokeStyle='#d9a948';c.beginPath();c.arc(M,M,M-4,0,7);c.stroke();c.lineWidth=2;c.strokeStyle='#2a1a0a';c.beginPath();c.arc(M,M,M-8,0,7);c.stroke()}
// ---------- alvo da missão (para minimapa, rastreador e feixe no mundo)
function qTarget(){const q=QD.find(q=>q.cat=='main'&&act(q.id))||QD.find(q=>act(q.id)&&q.reg==REG[REGC]?.id);return q?qPos(q):null}
function qPos(q){const s=QS[q.id];if(q.t=='talk'){const n=NPC.find(n=>n.id==q.npc);return n&&[n.x,n.z]}if(q.t=='wp'){const w=WP.find(w=>w.id==q.wp);return[w.x,w.z]}if(q.t=='boss'){const b=BOSS[q.boss];return[b.x,b.z]}
  if(q.t=='collect'||q.t=='interact'){let b=null,bd=1e9;for(const o of QOBJ)if(o.q===q){const d=hy(o.x-P.x,o.z-P.z);if(d<bd){bd=d;b=[o.x,o.z]}}return b}if(q.t=='zone')return q.at;if(q.t=='hire')return[-20,-13];
  if(q.t=='dungeon'){let b=DNG[0].ent,bd=1e9;for(const D of DNG){const d=hy(D.ent[0]-P.x,D.ent[1]-P.z);if(d<bd){bd=d;b=D.ent}}return b}
  if(q.t=='kill'){const p={dwolf:[-17.3,-255.7],zombie:[-119.3,-211.7],ghoul:[-119.3,-211.7],skel:[-119.3,-211.7],spider:[-37.3,-275.7],boar:[17.3,259.8],croc:[-291,43.3],lslime:[268.5,-268.6]}[q.mob[0]];return p}return null}
const QBEAM=beam(0,0,0xffd34a);QBEAM.material.opacity=.18;
function trackUpd(){const L=[];for(const q of QD)if(act(q.id)&&q.cat=='main')L.push(q);const reg=REG[Math.max(0,REGC)]?.id;for(const q of QD)if(act(q.id)&&q.cat=='side'&&q.reg==reg)L.push(q);for(const q of QD)if(act(q.id)&&q.cat=='side'&&!L.includes(q))L.push(q);
  if(BOUNTY.q)L.push({id:'_b',cat:'bounty',n:'Recompensa',d:BOUNTY.q.ok?'Volte ao quadro da vila.':BOUNTY.q.txt,n_:BOUNTY.q.n,_p:BOUNTY.q.p});
  $('ql').innerHTML=L.slice(0,3).map(q=>{const s=QS[q.id]||{p:q._p},need=q.n_||1;return`<div class="q ${q.cat}"><b>${q.cat=='main'?'◆ ':q.cat=='bounty'?'📋 ':''}${q.n}</b>${q.cat=='main'?`<span class="qd">${q.d}</span>`:''}${need>1?`<div class="qr"><div class="qb"><i style="width:${s.p/need*100}%"></i></div><span>${s.p}/${need}</span></div>`:''}</div>`}).join('')||'<div class="q"><span class="qd">Explore Aldoria.</span></div>'}
// ---------- interação de contexto (botão "E")
let INTN=null;
function interUpd(){let b=null,bd=1e9;if(!UI.block())for(const o of INTER){if(o.npc&&o.npc.hidden)continue;const d=hy(o.x-P.x,o.z-P.z);if(d<o.r&&d<bd){bd=d;b=o}}if(b!==INTN){INTN=b;const el=$('itb');if(b){el.innerHTML=`<i>${b.ic}</i>${b.label()}`;el.classList.add('on')}else el.classList.remove('on')}else if(b)$('itb').lastChild.textContent=b.label()}
// waypoint ativa ao chegar perto
function wpUpd(){for(const w of WP)if(!w.on&&hy(w.x-P.x,w.z-P.z)<4){w.on=1;toast('🌀','Pedra de Teleporte ativada',w.n);flash(w.x,groundAt(w.x,w.z)+4,w.z,0x8fe8ff,6,.6);ring(w.x,w.z,4,0x8fe8ff,.7);snd(880,.3,'sine');qEvent('wp',w.id);save()}}
// rótulos sobre NPCs com missão ("!") e nomes
const NL=[];
function npcLabels(){let i=0;for(const n of NPC){if(n.hidden||!n.m.g.visible)continue;const d=hy(n.x-P.x,n.z-P.z);if(d>16)continue;const has=QD.some(q=>act(q.id)&&q.t=='talk'&&q.npc==n.id);_pp.set(n.x,n.y+3.4*(n.m.g.scale.y),n.z).project(cam);if(_pp.z>1)continue;
  let el=NL[i];if(!el){el=document.createElement('div');el.className='nl';document.body.appendChild(el);NL.push(el)}i++;el.style.display='block';el.innerHTML=(has?'<i>!</i>':'')+(d<9?n.nm:'');el.style.transform=`translate(${(_pp.x*.5+.5)*innerWidth}px,${(-_pp.y*.5+.5)*innerHeight}px) translate(-50%,-100%)`}for(;i<NL.length;i++)NL[i].style.display='none'}

// ---------- janelas
function closeAll(){UI.open=null;for(const id of['inv','map','jrn','shop','menu','bty','tree','gmb','pets','cook','frg'])$(id).classList.remove('on');document.body.classList.remove('invo')}
function openWin(id){closeAll();UI.open=id;$(id).classList.add('on');jx=jy=0;UI.atkHeld=0;snd(520,.06,'sine')}
// inventário (herói em 3D à esquerda)
let ISEL=null;
function openInv(){if(!run||DLG)return;openWin('inv');document.body.classList.add('invo');$('bagb').classList.remove('nw');invRender();requestAnimationFrame(()=>{const r=$('ivP').getBoundingClientRect();INV_OPEN.off=.5-(r.left/2)/innerWidth})}
function invRender(){if(UI.open!='inv')return;let h='';for(let i=0;i<30;i++){const it=INV[i];h+=it?`<div class="is r${it.rar}${ISEL===i?' sel':''}" data-i="${i}"><i>${it.ic}</i>${it.slot!='mat'&&itemScore(it)>itemScore(EQ[it.slot])?'<s>▲</s>':''}${it.q>1?`<em>${it.q}</em>`:''}</div>`:'<div class="is e"></div>'}$('ivG').innerHTML=h;
  const eh=([s,n,ic])=>{const it=EQ[s];return it?`<div class="is r${it.rar}${ISEL===s?' sel':''}" data-e="${s}"><i>${it.ic}</i><b>${n}</b></div>`:`<div class="is e g"><i>${ic}</i><b>${n}</b></div>`};
  $('eqA').innerHTML=SLOTS.slice(0,4).map(eh).join('');$('eqB').innerHTML=SLOTS.slice(4).map(eh).join('');$('ivg').textContent='🪙 '+fmt(P.gold);
  $('ivS').innerHTML=`<span class="chip">❤️ ${ST.mx}</span><span class="chip">⚔️ ${Math.round((ST.dmin+ST.dmax)/2*(1+P.lv*.08)*(1+ST.dmg/100))}</span><span class="chip">🛡️ ${ST.armor}</span><span class="chip">🎯 ${ST.crit}%</span>${ST.ms?`<span class="chip">👟 +${ST.ms}%</span>`:''}`;
  const d=$('ivD'),it=typeof ISEL=='number'?INV[ISEL]:ISEL?EQ[ISEL]:null;if(!it){d.innerHTML='<p class="ihint">Toque num item para ver detalhes e comparar com o equipado. Arraste o herói para girá-lo.</p>';return}
  const eq=typeof ISEL=='string',cur=EQ[it.slot],diff=eq?0:itemScore(it)-itemScore(cur);
  if(it.slot=='mat'){d.innerHTML=`<div class="tip"><b>${it.ic} ${it.n}${it.q>1?' ×'+it.q:''}</b><small>Material · vende por ${it.price} cada</small><div>${it.d||''}</div></div><div class="ibt"><button class="ib off" data-a="sell">Vender ${it.price*(it.q||1)}🪙</button></div>`;return}
  d.innerHTML=`<div class="tip r${it.rar}"><b style="color:${RAR[it.rar].c}">${it.n}</b><small>${RAR[it.rar].n} · ${SLN[it.slot][1]} · nível ${it.ilvl}</small>${itemLines(it).map(l=>`<div>${l}</div>`).join('')}${!eq&&cur?`<div class="cmp ${diff>=0?'up':'dn'}">${diff>=0?'▲ Melhor':'▼ Pior'} que ${cur.n}</div>`:''}</div>
   <div class="ibt">${eq?'<button class="ib" data-a="un">Remover</button>':'<button class="ib" data-a="eq">Equipar</button><button class="ib off" data-a="sell">Vender '+it.price+'🪙</button>'}</div>`}
// mapa-múndi (teleporte)
let MAPTP=false;
function openMap(fromWp){if(!run||DLG)return;MAPTP=fromWp;openWin('map');mapRender()}
function mapRender(){const c=$('wm'),x=c.getContext('2d'),S_=c.width;x.imageSmoothingEnabled=false;x.drawImage(MAPC,0,0,S_,S_);const k=S_/(2*WMH),FN=Math.ceil(2*WMH/10);x.fillStyle='rgba(10,6,18,.78)';
  for(let i=0;i<FN;i++)for(let j=0;j<FN;j++)if(!FOG.has(i+','+j))x.fillRect(i*10*k,j*10*k,10*k+1,10*k+1);
  x.font='bold '+Math.max(11,Math.round(11*k*3.2))+'px Cinzel,Georgia';x.textAlign='center';x.fillStyle='#fff';x.strokeStyle='#000';x.lineWidth=3;for(const r of REG){if(!P.disc.has(r.id))continue;x.strokeText(r.n,(r.c[0]+WMH)*k,(r.c[1]+WMH)*k-14*k);x.fillText(r.n,(r.c[0]+WMH)*k,(r.c[1]+WMH)*k-14*k)}
  drawWorldMarks(x,k);mapLegend();
  x.save();x.translate((P.x+WMH)*k,(P.z+WMH)*k);x.rotate(PI-P.f);x.fillStyle='#ffd34a';x.strokeStyle='#000';x.lineWidth=2;x.beginPath();x.moveTo(0,-10);x.lineTo(7,7);x.lineTo(0,3);x.lineTo(-7,7);x.closePath();x.fill();x.stroke();x.restore();
  $('wpl').innerHTML=WP.map(w=>`<button class="wpb ${w.on?'':'off'}" data-w="${w.id}" ${w.on?'':'disabled'} style="left:${(w.x+WMH)/(2*WMH)*100}%;top:${(w.z+WMH)/(2*WMH)*100}%">◆<span>${w.n}</span></button>`).join('');$('mph').textContent=inCombat()?'Não dá para viajar em combate.':'Toque numa pedra de teleporte ativada (◆ azul) para viajar.'}
function teleport(x,z){P.x=x;P.z=z;worldLoadAll(x,z);P.y=groundAt(x,z);CAMS.cx=x;CAMS.cz=z;CAMS.cy=P.y;if(P.merc){P.merc.x=x-1.5;P.merc.z=z-1.5;P.merc.y=groundAt(P.merc.x,P.merc.z)}flash(x,P.y+1.5,z,0x8fe8ff,6,.6);ring(x,z,4,0x8fe8ff,.7)}
// diário: principal, secundárias, recompensas, códice, bestiário
let JTAB='main';
function openJournal(){if(!run||DLG)return;openWin('jrn');jrnRender()}
function jrnRender(){const tabs=[['main','Principal'],['side','Secundárias'],['ach','Conquistas'],['codex','Códice'],['best','Bestiário']];$('jtabs').innerHTML=tabs.map(([k,n])=>`<button class="jt ${JTAB==k?'on':''}" data-t="${k}">${n}</button>`).join('');let h='';
  if(JTAB=='main'||JTAB=='side'){for(const r of REG){const L=QD.filter(q=>q.cat==JTAB&&q.reg==r.id&&QS[q.id].st);if(!L.length)continue;h+=`<h4 style="color:${r.map}">${r.n}</h4>`;for(const q of L){const s=QS[q.id];h+=`<div class="jq ${s.st==2?'ok':''}"><b>${s.st==2?'✓ ':'◆ '}${q.n}</b><p>${q.d}</p>${s.st==1&&q.n_>1?`<small>${s.p}/${q.n_}</small>`:''}</div>`}}
    if(!h)h='<p class="ihint">Nenhuma missão ainda.</p>';if(JTAB=='main')h='<p class="jact">Ato I — A Sombra sobre Aldoria</p>'+h}
  else if(JTAB=='ach'){h=`<p class="jact">${P.ach.size}/${ACH.length} conquistas · Título: ${P.title||'nenhum'}</p>`+ACH.map(a=>{const ok=P.ach.has(a.id);return`<div class="jq ${ok?'ok':'lock'}" ${ok?`data-ti="${a.t}" style="cursor:pointer"`:''}><b>${ok?'🏆':'🔒'} ${a.n} <small>· título “${a.t}”${P.title==a.t?' (em uso)':ok?' — toque para usar':''}</small></b><p>${a.d}</p></div>`}).join('')}
  else if(JTAB=='codex'){const L=LORE.filter(l=>LORE_FOUND.has(l.id));h=L.length?L.map(l=>`<div class="jq"><b>📖 ${l.t}</b><p>${l.txt}</p></div>`).join(''):'<p class="ihint">Leia livros, lápides e placas para registrar a história de Aldoria.</p>';h=`<p class="jact">${L.length}/${LORE.length} registros</p>`+h}
  else{const ks=[...Object.keys(MT),...Object.keys(BOSS)];h=ks.map(k=>{const n=BEST[k]||0,t=MT[k]||BOSS[k];return n?`<div class="jq"><b>${BOSS[k]?'☠ ':''}${t.n} <small>· ${n} abatido${n>1?'s':''}</small></b><p>${BESTD[k]||''}</p></div>`:`<div class="jq lock"><b>???</b><p>Derrote esta criatura para registrá-la.</p></div>`}).join('')}
  $('jbody').innerHTML=h}
// loja da Helga
function openShop(){openWin('shop');shopRender()}
function shopRender(){$('shg').textContent='🪙 '+fmt(P.gold);$('shl').innerHTML=SHOP.map((it,j)=>`<div class="shi r${it.rar}" data-b="${j}"><i>${it.ic}</i><div><b style="color:${RAR[it.rar].c}">${it.n}</b><small>${SLN[it.slot][1]} · ${itemLines(it).slice(0,2).join(' · ').replace(/<[^>]+>/g,'')}</small></div><em class="${P.gold<it.price?'no':''}">${it.price}🪙</em></div>`).join('')||'<p class="ihint">A Helga está forjando peças novas. Volte quando subir de nível.</p>';
  $('shl').insertAdjacentHTML('afterbegin','<h4 class="shh">🐾 Montarias</h4>'+Object.keys(MOUNTS).map(k=>{const M=MOUNTS[k],own=P.mounts.includes(k),sel=own&&(P.mountSel||P.mounts[0])==k;return`<div class="shi r3 mt" data-mt="${k}"><i>${M.ic}</i><div><b style="color:#ffb347">${M.n}</b><small>${M.d} Velocidade ${Math.round(M.sp/1.6*100)}% da corrida.</small></div><em class="${own?'':P.gold<M.price?'no':''}">${sel?'✔ Em uso':own?'Usar':M.price+'🪙'}</em></div>`}).join('')+'<h4 class="shh">⚒️ Peças da forja</h4>')}
// recompensas
function openBounty(){openWin('bty');btyRender()}
function btyRender(){const B=BOUNTY.q;let h='';if(B){h=`<div class="jq"><b>📋 ${B.txt}</b><p>Progresso: ${B.p}/${B.n}</p><p>Recompensa: ${B.gold} ouro · ${B.xp} XP · item raro</p></div>`+(B.ok?'<button class="ib" data-bt="claim">Receber recompensa</button>':'<button class="ib off" data-bt="drop">Abandonar</button>')}
  else{h='<p class="ihint">Escolha uma região. Cada contrato pede 15 monstros abatidos lá.</p>'+REG.filter(r=>r.id!='vila'&&P.disc.has(r.id)).map(r=>`<button class="ib bq" data-bt="${r.id}">${r.n} <small>Nv ${r.lv}+</small></button>`).join('')}$('btyb').innerHTML=h}
function openMenu(){if(!run)return;openWin('menu');$('gfx2').textContent='Gráficos: '+GFX.n;$('dayl').textContent='Hora em Aldoria: '+clockStr();$('menuVer').textContent='Versão '+VR_VERSION}
function bindWindows(){
  $('inv').onclick=e=>{const b=e.target.closest('[data-a]');if(b){const a=b.dataset.a;if(a=='eq'){equip(ISEL);ISEL=null}else if(a=='un'){unequip(ISEL);ISEL=null}else if(a=='sell'){sellItem(ISEL);ISEL=null}invRender();return}const s=e.target.closest('[data-i],[data-e]');if(s){ISEL=s.dataset.i!=null?+s.dataset.i:s.dataset.e;invRender();snd(700,.04,'sine')}};
  $('map').onclick=e=>{const b=e.target.closest('[data-w]');if(!b)return;if(inCombat()){toast('⚔️','Em combate','Afaste-se dos inimigos para viajar.');return}const w=WP.find(w=>w.id==b.dataset.w);closeAll();teleport(w.x,w.z+3);toast('🌀','Viagem',w.n)};
  $('jrn').onclick=e=>{const ti=e.target.closest('[data-ti]');if(ti){P.title=P.title==ti.dataset.ti?'':ti.dataset.ti;hud();jrnRender();save();return}const b=e.target.closest('[data-t]');if(b){JTAB=b.dataset.t;jrnRender()}};
  $('shop').onclick=e=>{const m=e.target.closest('[data-mt]');if(m){buyMount(m.dataset.mt);shopRender();return}const b=e.target.closest('[data-b]');if(b){buyItem(+b.dataset.b);shopRender()}};
  $('bty').onclick=e=>{const b=e.target.closest('[data-bt]');if(!b)return;const k=b.dataset.bt;if(k=='claim'){const B=BOUNTY.q;BOUNTY.q=null;grant({gold:B.gold,xp:B.xp,item:2});toast('📋','Contrato concluído','')}else if(k=='drop')BOUNTY.q=null;else BOUNTY.q=bountyGen(k);btyRender();trackUpd();save()};
  document.querySelectorAll('.wx').forEach(b=>b.onclick=closeAll);
  $('gfx2').onclick=()=>{try{localStorage.setItem('vr11_gfx',String((GL+1)%3))}catch(e){}save();location.reload()};$('sav').onclick=()=>{save();toast('💾','Jogo salvo','')};$('ret').onclick=()=>{save();location.reload()};
  $('rv').onclick=respawn;
  $('pets').onclick=e=>{const b=e.target.closest('[data-p]');if(b)buyPet(b.dataset.p)};$('mleg').onclick=e=>{const b=e.target.closest('[data-mk]');if(!b)return;const k=b.dataset.mk;MK[k]=MK[k]?0:1;try{localStorage.setItem('vr11_mk',JSON.stringify(MK))}catch(e){}mapRender();minimap()};
  $('cook').onclick=e=>{const b=e.target.closest('[data-ck]');if(b)cook(b.dataset.ck)};$('frg').onclick=e=>{if(e.target.closest('[data-fu]'))forgeUp()};
  $('gmb').onclick=e=>{const b=e.target.closest('[data-g]');if(b)gamble(b.dataset.g)};
  $('fpsb').onclick=()=>{FPSC=FPSC==0?60:FPSC==60?30:0;try{localStorage.setItem('vr11_fps',String(FPSC))}catch(e){}fpsLbl()};fpsLbl();
  $('musb').onclick=()=>{musToggle();$('musb').textContent='Música: '+(MUS.on?'ligada':'desligada')};$('musb').textContent='Música: '+(MUS.on?'ligada':'desligada')}
function fpsLbl(){$('fpsb').textContent='Quadros: '+(FPSC?FPSC+' fps':'Máx. da tela ('+(HZ>=100?Math.round(HZ/10)*10+' Hz':'auto')+')')}
