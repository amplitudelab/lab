'use strict';
/* =============================================================================
   VOXEL REALMS · HUD imersiva e ajustável (14.6)
   - Leque ✦ com correr, furtivo, tocha e montaria (fecha sozinho).
   - Gaveta ☰ com mapa, diário, primeira pessoa, HUD e menu.
   - Minimapa: toque muda o zoom; segure para abrir o mapa.
   - Fora de combate a HUD esmaece; correr empurrando o joystick até a borda.
   - Painel 🎛️: tamanho da interface, tamanho dos botões, opacidade, o que aparece
     e modo de mover botões e painéis (não deixa soltar em cima de outro).
   ============================================================================= */
const HUDDEF={hs:1,bs:1,op:1,fade:1,joy:1,quest:'min',mm:1,dmg:1,jmp:1,blk:1,pos:{}};
let HUDS=Object.assign({},HUDDEF,{pos:{}});try{const s=JSON.parse(localStorage.getItem('vr11_hud')||'null');if(s)HUDS=Object.assign(HUDS,s,{pos:s.pos||{}})}catch(e){}
const hudSave=()=>{try{localStorage.setItem('vr11_hud',JSON.stringify(HUDS))}catch(e){}};
const HMV=['tl','qp','mw','tbar','jb','bar','atk','rolb','jmpb','blkb','qkb'];
let hudCalm=0,hudCT=0,qkT=0;
// fora de combate os botões esmaecem mais que os painéis de informação
function hudOp(){const r=document.documentElement.style;r.setProperty('--ho',HUDS.op);r.setProperty('--hc',hudCalm?.45:1);r.setProperty('--hi',hudCalm?.75:1)}
function hudApply(){const r=document.documentElement.style;hudOp();
  $('qp').classList.toggle('min',HUDS.quest=='min');$('qp').style.display=HUDS.quest=='off'?'none':'';
  $('mw').style.display=$('rg').style.display=HUDS.mm?'':'none';document.body.classList.toggle('nomm',!HUDS.mm);
  $('jmpb').style.display=HUDS.jmp?'':'none';$('blkb').style.display=HUDS.blk?'':'none';
  for(const id of HMV){const e=$(id),p=HUDS.pos[id];if(e)e.style.translate=p?`${p[0]}px ${p[1]}px`:''}$('qk').style.translate=$('qkb').style.translate;
  // tamanho escolhido, reduzido aos poucos só nesta tela se algo encostar em outra coisa
  const set=k=>{r.setProperty('--hs',(HUDS.hs*k).toFixed(3));r.setProperty('--bs',(HUDS.bs*k).toFixed(3))};HUDF=1;
  for(;;){set(HUDF);if(!hudClash())break;if(Math.min(HUDS.hs,HUDS.bs)*HUDF<=.66){HUDF=1;set(1);break}HUDF-=.05}hudFitTxt()}
function hudFitTxt(){const n=$('hudfit');if(n)n.textContent=HUDF<1?'Nesta tela a HUD foi reduzida para '+Math.round(HUDF*100)+'% do tamanho escolhido, para nada ficar por cima de nada.':''}
// ---------- caixas dos elementos e teste de sobreposição (botões redondos contam como círculo)
const FANS=['runb','snkb','torb','mntb'],HRND=new Set(['atk','rolb','jmpb','blkb','qkb','jb','mw',...FANS]),HFIX=['rg','ts','boss','tf'];let HUDF=1;
function hudBox(id){const e=$(id);if(!e)return null;const cs=getComputedStyle(e),fan=FANS.includes(id);if(cs.display=='none'||(cs.visibility=='hidden'&&!fan))return null;
  // o leque anima com escala: mede pela posição de layout (sem a animação) dentro do contêiner
  if(fan){const q=$('qk').getBoundingClientRect(),x=q.left+e.offsetLeft,y=q.top+e.offsetTop;return{id,x0:x,y0:y,x1:x+e.offsetWidth,y1:y+e.offsetHeight,r:true}}
  const b=e.getBoundingClientRect();if(b.width<2)return null;return{id,x0:b.left,y0:b.top,x1:b.right,y1:b.bottom,r:HRND.has(id)}}
function hudHit(a,b){const ox=Math.min(a.x1,b.x1)-Math.max(a.x0,b.x0),oy=Math.min(a.y1,b.y1)-Math.max(a.y0,b.y0);if(ox<=2||oy<=2)return false;if(!a.r&&!b.r)return true;
  const c=o=>[(o.x0+o.x1)/2,(o.y0+o.y1)/2,(o.x1-o.x0)/2];if(a.r&&b.r){const A=c(a),B=c(b);return hy(A[0]-B[0],A[1]-B[1])<A[2]+B[2]-1}
  const[o,q]=a.r?[a,b]:[b,a],C=c(o),nx=Math.max(q.x0,Math.min(C[0],q.x1)),ny=Math.max(q.y0,Math.min(C[1],q.y1));return hy(C[0]-nx,C[1]-ny)<C[2]-1}
const hudOut=a=>a.x0<-1||a.y0<-1||a.x1>innerWidth+1||a.y1>innerHeight+1;
function hudClash(){const L=HMV.concat(['rg'],FANS).map(hudBox).filter(Boolean);for(let i=0;i<L.length;i++){if(hudOut(L[i]))return true;for(let j=i+1;j<L.length;j++)if(hudHit(L[i],L[j]))return true}return false}
{let t=0;const f=()=>{clearTimeout(t);t=setTimeout(hudApply,150)};addEventListener('resize',f);if(window.visualViewport)visualViewport.addEventListener('resize',f)}
// ---------- leque de ações rápidas e gaveta
function qkToggle(v){const o=$('qk'),on=v==null?!o.classList.contains('open'):!!v;o.classList.toggle('open',on);$('qkb').classList.toggle('on',on);qkT=on?6:0;if(v==null)snd(on?820:520,.04,'sine')}
$('qkb').onpointerdown=e=>{e.stopPropagation();qkToggle()};
for(const id of['runb','snkb','torb','mntb'])$(id).addEventListener('pointerdown',()=>{qkT=1.4});
function drwToggle(v){const d=$('drw'),on=v==null?!d.classList.contains('on'):!!v;d.classList.toggle('on',on);$('mnub').classList.toggle('on',on)}
$('mnub').onclick=()=>{drwToggle();snd(700,.04,'sine')};
$('drw').addEventListener('click',e=>{if(e.target.closest('button'))drwToggle(0)});
$('hudb').onclick=()=>openHud();$('hudm').onclick=()=>openHud();
rd.domElement.addEventListener('pointerdown',()=>{drwToggle(0);if(qkT>1.4)qkToggle(0)});
$('ui').addEventListener('pointerdown',()=>{hudCT=0;if(hudCalm){hudCalm=0;hudOp()}},true);
$('qh').addEventListener('click',()=>{HUDS.quest=$('qp').classList.contains('min')?'min':'full';hudSave()});
// ---------- minimapa: toque = zoom, segurar = mapa
{let lp=0,tm=null;const mw=$('mw');mw.onpointerdown=e=>{e.stopPropagation();lp=0;tm=setTimeout(()=>{lp=1;openMap(false)},520)};
  mw.onpointerup=mw.onpointercancel=()=>{clearTimeout(tm);if(lp||document.body.classList.contains('hudedit'))return;mmZi=(mmZi+1)%MMZ.length;try{localStorage.setItem('vr11_mmz',String(mmZi))}catch(e){}snd(700+mmZi*80,.04,'sine');minimap()}}
// ---------- números de dano opcionais
const _pop16=pop;pop=function(t,x,y,z,c,big){if(!HUDS.dmg&&/^[✦+\-]?[\d.,]+[kM]?$/.test(String(t)))return;return _pop16(t,x,y,z,c,big)};
// ---------- esmaecer fora de combate e correr pelo joystick
function hudUpd(dt){if(qkT>0){qkT-=dt;if(qkT<=0)qkToggle(0)}if(!run)return;
  const busy=!!UI.open||!!P.act||!!BOSSON||P.hp<ST.mx*.6||inCombat();hudCT=busy?0:hudCT+dt;const c=HUDS.fade&&hudCT>4?1:0;if(c!==hudCalm){hudCalm=c;hudOp()}
  if(HUDS.joy&&!UI.block()){const m=hy(jx,jy);if(m>.95&&!P.run&&!P.sneak&&!P.block&&!P.mounted){toggleRun(1);P.autoRun=1}else if(P.autoRun&&m<.7){toggleRun(0);P.autoRun=0}}}
// ---------- painel 🎛️
function openHud(){if(!run)return;openWin('hudw');hudRender()}
function hudRender(){const pc=v=>Math.round(v*100)+'%',SL=(k,n,a,b,st)=>`<div class="hrow"><span>${n}</span><input type="range" min="${a}" max="${b}" step="${st}" value="${HUDS[k]}" data-hk="${k}"><b>${pc(HUDS[k])}</b></div>`,
    T=(k,n,v)=>`<button class="${(v!=null?HUDS[k]==v:HUDS[k])?'on':''}" data-ht="${k}"${v!=null?` data-hv="${v}"`:''}>${n}</button>`;
  $('hudl').innerHTML=SL('hs','Tamanho da interface',.8,1.25,.05)+SL('bs','Tamanho dos botões',.8,1.25,.05)+SL('op','Opacidade',.35,1,.05)+'<p id="hudfit" class="ihint" style="color:#9ae4ff"></p>'+
    '<div class="htg">'+T('fade','Esmaecer fora de combate')+T('joy','Correr pelo joystick')+T('mm','Minimapa')+T('dmg','Números de dano')+T('jmp','Botão pular')+T('blk','Botão bloquear')+'</div>'+
    '<div class="htg"><span style="font:700 12px var(--fn);color:#cbb88a;align-self:center">Missões:</span>'+T('quest','Compactas','min')+T('quest','Completas','full')+T('quest','Ocultas','off')+'</div>'+
    '<div class="htg"><button class="on" data-hx="move">✥ Mover botões e painéis</button><button data-hx="reset">↺ Restaurar padrão</button></div>'+
    '<p class="ihint">No leque ✦ ficam correr, furtivo, tocha e montaria. No ☰ ficam mapa, diário, primeira pessoa, HUD e menu. Toque no minimapa para mudar o zoom; segure para abrir o mapa. Empurrar o joystick até a borda faz correr.</p>';hudFitTxt()}
$('hudl').addEventListener('input',e=>{const k=e.target.dataset.hk;if(!k)return;HUDS[k]=+e.target.value;e.target.nextElementSibling.textContent=Math.round(HUDS[k]*100)+'%';hudApply();hudSave()});
$('hudl').addEventListener('click',e=>{const t=e.target.closest('[data-ht]');if(t){const k=t.dataset.ht;HUDS[k]=t.dataset.hv!=null?t.dataset.hv:HUDS[k]?0:1;hudApply();hudSave();hudRender();snd(760,.04,'sine');return}
  const x=e.target.closest('[data-hx]');if(!x)return;if(x.dataset.hx=='reset'){HUDS=Object.assign({},HUDDEF,{pos:{}});hudApply();hudSave();hudRender();toast('🎛️','HUD restaurada','')}else hudEdit(1)});
const _closeAll16=closeAll;closeAll=function(){_closeAll16();$('hudw').classList.remove('on')};
// ---------- mover botões e painéis
let HE=null;
function hudEdit(on){if(on){closeAll();qkToggle(0);drwToggle(0);document.body.classList.add('hudedit');UI.open='hudedit';for(const id of HMV){const e=$(id);if(e)e.classList.add('hmv')}}
  else{document.body.classList.remove('hudedit');for(const id of HMV){const e=$(id);if(e)e.classList.remove('hmv','bad')}if(UI.open=='hudedit')UI.open=null;hudSave();toast('🎛️','HUD salva','')}}
function hudBad(el){const mv=el.id=='qkb'?['qkb',...FANS]:[el.id],A=mv.map(hudBox).filter(Boolean);if(A.some(hudOut))return true;
  const O=HMV.concat(HFIX,FANS).filter(id=>!mv.includes(id)&&(!HFIX.includes(id)||id=='rg'||$(id).classList.contains('on'))).map(hudBox).filter(Boolean);
  return A.some(a=>O.some(o=>hudHit(a,o)))}
addEventListener('pointerdown',e=>{if(!document.body.classList.contains('hudedit'))return;const el=e.target.closest('.hmv');if(!el)return;e.stopPropagation();e.preventDefault();const p0=HUDS.pos[el.id]||[0,0];HE={el,x:e.clientX,y:e.clientY,p0,p:p0.slice(),pid:e.pointerId};try{el.setPointerCapture(e.pointerId)}catch(_){}},true);
addEventListener('pointermove',e=>{if(!HE||e.pointerId!==HE.pid)return;e.stopPropagation();HE.p=[Math.round(HE.p0[0]+e.clientX-HE.x),Math.round(HE.p0[1]+e.clientY-HE.y)];HE.el.style.translate=`${HE.p[0]}px ${HE.p[1]}px`;if(HE.el.id=='qkb')$('qk').style.translate=HE.el.style.translate;HE.el.classList.toggle('bad',hudBad(HE.el))},true);
addEventListener('pointerup',e=>{if(!HE||e.pointerId!==HE.pid)return;e.stopPropagation();const el=HE.el;
  if(hudBad(el)){el.style.translate=HE.p0[0]||HE.p0[1]?`${HE.p0[0]}px ${HE.p0[1]}px`:'';if(el.id=='qkb')$('qk').style.translate=el.style.translate;el.classList.remove('bad');toast('✥','Sem espaço aí','Voltou para onde estava.');snd(200,.1,'square')}else{HUDS.pos[el.id]=HE.p;snd(900,.04,'sine')}HE=null},true);
addEventListener('click',e=>{if(document.body.classList.contains('hudedit')&&e.target.closest('.hmv')){e.stopPropagation();e.preventDefault()}},true);
$('hudok').onclick=()=>hudEdit(0);$('hudrs').onclick=()=>{HUDS.pos={};hudApply();for(const id of HMV){const e=$(id);if(e)e.classList.remove('bad')}snd(600,.06,'sine')};
hudApply();
