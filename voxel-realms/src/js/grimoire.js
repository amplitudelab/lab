'use strict';
/* =============================================================================
   VOXEL REALMS · grimório (14.0)
   A árvore de habilidades vira um livro de magia aberto: página da esquerda com
   o selo do elemento, a grade de habilidades e os atalhos; página da direita com
   o detalhe (DANO, MANA/FÚRIA, RECARGA). As abas na lateral filtram por elemento.
   Os ícones são pixel art gerada a partir dos emojis e recolorida na paleta do
   elemento (rampa de 6 tons, contorno escuro, luz vinda de cima à esquerda).
   ============================================================================= */
const ELM={
  aco:{n:'Aço',t:'ARTE DA LÂMINA',ic:'⚔️',r:['#140a04','#4a2610','#94501c','#e09a3a','#ffd88a','#fff8e0']},
  vigor:{n:'Vigor',t:'CORAÇÃO DE GUERRA',ic:'🛡️',r:['#160406','#4e0e12','#a0261e','#ec6a3a','#ffc08a','#fff2e0']},
  fogo:{n:'Fogo',t:'MAGIA DE FOGO',ic:'🔥',r:['#1a0604','#5a1408','#b8360c','#ff7a1a','#ffd060','#fff4c0']},
  gelo:{n:'Gelo',t:'MAGIA DE GELO',ic:'❄️',r:['#04101e','#0c3a6a','#1a78c0','#4ac8f0','#a8f0ff','#ffffff']},
  raio:{n:'Raio',t:'MAGIA DO TROVÃO',ic:'⚡',r:['#0a0a24','#24308a','#4a6aff','#8ab8ff','#e0ecff','#fffbe0']},
  arcano:{n:'Arcano',t:'MAGIA ARCANA',ic:'🔮',r:['#12061e','#3a1260','#7a2ab8','#c060ff','#f0a8ff','#fff0ff']},
  vento:{n:'Vento',t:'MAGIA DO VENTO',ic:'🌪️',r:['#061418','#0e3a48','#1e7a8a','#4ac8c8','#b0fff0','#ffffff']},
  natur:{n:'Natureza',t:'CHAMADO DA MATA',ic:'🌿',r:['#06140a','#14421c','#2e8a34','#7ad84a','#d0ff8a','#fffbe0']},
  sombra:{n:'Sombra',t:'PASSOS DA SOMBRA',ic:'🌑',r:['#08060e','#221838','#4a3a7a','#8a7ac8','#cfc4ff','#ffffff']},
  osso:{n:'Ossos',t:'LIVRO DOS OSSOS',ic:'💀',r:['#0c0a06','#36301e','#7a7052','#c8bc96','#f0e8cc','#ffffff']},
  alma:{n:'Almas',t:'CÂNTICO DAS ALMAS',ic:'👻',r:['#04100a','#0e3a24','#1e7a4a','#4ad888','#b8ffcc','#f4fff0']},
  sangue:{n:'Sangue',t:'MAGIA DE SANGUE',ic:'🩸',r:['#120204','#4a0610','#8a1020','#d0303a','#ff8a8a','#ffe0d8']},
  noite:{n:'Noite',t:'FILHOS DA NOITE',ic:'🦇',r:['#0a040e','#2a0a2e','#5a1a4e','#a03a7a','#e888c0','#ffe0f0']}};
const SKEL={giro:'aco',salto:'aco',brutal:'aco',grito:'vigor',pele:'vigor',vital:'vigor',
  bolafogo:'fogo',meteoro:'fogo',chama:'fogo',gelo:'gelo',raio:'raio',escudo:'arcano',mente:'arcano',cura:'arcano',
  flechas:'vento',multi:'vento',perfura:'vento',tempestade:'vento',aguia:'vento',aljava:'vento',falcao:'natur',agil:'natur',armadilha:'gelo',recuo:'sombra',sombra:'sombra',
  esqueleto:'osso',lancaossos:'osso',arqueiroesq:'osso',golemossos:'osso',explosao:'osso',senhor:'alma',colheita:'alma',pacto:'alma',
  garra:'sangue',lancacarmesim:'sangue',sede:'sangue',sifao:'sangue',chuvasangue:'sangue',frenesi:'sangue',nevoa:'noite',noturno:'noite'};
const TREL={guerra:'aco',arcano:'arcano',arco:'vento',necro:'osso',sangue:'sangue'};
const skEl=k=>SKEL[k]||TREL[SK[k]&&SK[k].t]||'aco';
const resName=()=>MANA()?(P.cls=='necromante'?'ALMAS':'MANA'):P.cls=='vampiro'?'SANGUE':'FÚRIA';

// ---------- ícones em pixel art (cache por emoji + elemento)
const ICC={},_icv=document.createElement('canvas');_icv.width=_icv.height=20;const _icx=_icv.getContext('2d',{willReadFrequently:true});
const hexRGB=h=>[parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)];
// silhueta (máscara) e luz (luminância normalizada) do emoji desenhado em 20×20
function glyph(ch){const N=20,x=_icx;x.clearRect(0,0,N,N);x.fillStyle='#fff';x.textAlign='center';x.textBaseline='middle';
  x.font='15px "Noto Color Emoji","Apple Color Emoji","Segoe UI Emoji","Segoe UI Symbol",sans-serif';x.fillText(ch,N/2,N/2+1);
  const p=x.getImageData(0,0,N,N).data,M=new Uint8Array(N*N),L=new Float32Array(N*N);let n=0,lo=1,hi=0;
  for(let i=0;i<N*N;i++)if(p[i*4+3]>110){M[i]=1;n++;const l=(p[i*4]*.3+p[i*4+1]*.59+p[i*4+2]*.11)/255;L[i]=l;if(l<lo)lo=l;if(l>hi)hi=l}
  if(n<8)return null;const sp=hi-lo;for(let i=0;i<N*N;i++)if(M[i])L[i]=sp>.08?(L[i]-lo)/sp:.72;return{M,L,N}}
// tile=1: quadro escuro com moldura chanfrada (grimório); tile=0: só o desenho com contorno (atalhos do HUD)
function pixIcon(ch,ek,tile){const key=ch+'|'+ek+'|'+(tile?1:0);if(key in ICC)return ICC[key];let g=null;try{g=glyph(ch)}catch(e){}if(!g)return ICC[key]=null;
  const N=g.N,O=tile?24:22,o=tile?2:1,c=document.createElement('canvas');c.width=c.height=O;const x=c.getContext('2d'),rp=(ELM[ek]||ELM.aco).r.map(hexRGB),img=x.createImageData(O,O),d=img.data,K=[10,5,8];
  const put=(X,Y,q)=>{if(X<0||Y<0||X>=O||Y>=O)return;const j=(Y*O+X)*4;d[j]=q[0];d[j+1]=q[1];d[j+2]=q[2];d[j+3]=255};
  if(tile){for(let Y=0;Y<O;Y++)for(let X=0;X<O;X++){const dx=(X-O/2+.5)/(O/2),dy=(Y-O/2+.5)/(O/2),r=Math.sqrt(dx*dx+dy*dy);put(X,Y,rp[r<.5?1:r<.78?((X+Y)&1):0])}
    for(let i=0;i<O;i++){put(i,0,K);put(i,O-1,K);put(0,i,K);put(O-1,i,K)}for(let i=1;i<O-1;i++){put(i,1,rp[3]);put(1,i,rp[3]);put(i,O-2,rp[1]);put(O-2,i,rp[1])}}
  const at=(X,Y)=>X>=0&&Y>=0&&X<N&&Y<N&&g.M[Y*N+X]===1;
  for(let Y=-1;Y<=N;Y++)for(let X=-1;X<=N;X++){
    if(at(X,Y)){let l=g.L[Y*N+X];if(!at(X-1,Y-1))l+=.2;if(!at(X+1,Y+1))l-=.25;const edge=!at(X-1,Y)||!at(X+1,Y)||!at(X,Y-1)||!at(X,Y+1);
      let i=1+Math.round(cl(l,0,1)*4);if(edge)i=Math.max(1,i-1);put(X+o,Y+o,rp[cl(i,1,5)])}
    else if(at(X-1,Y)||at(X+1,Y)||at(X,Y-1)||at(X,Y+1))put(X+o,Y+o,K)}
  x.putImageData(img,0,0);return ICC[key]=c.toDataURL()}
const skIcon=(k,tile)=>SK[k]?pixIcon(SK[k].ic,skEl(k),tile):null;
const icoH=(k,tile)=>{const u=skIcon(k,tile);return u?`<img class="px" src="${u}" alt="">`:`<i class="emo">${SK[k].ic}</i>`};

// ---------- livro
let GTAB='all';
function treeKeys(){const T=treeOrder()[0];return Object.keys(SK).filter(k=>SK[k].t==T.id).sort((a,b)=>SK[a].lv-SK[b].lv||(SK[a].pas?1:0)-(SK[b].pas?1:0))}
function treeRender(){if(UI.open!='tree')return;const T=treeOrder()[0],keys=treeKeys(),els=[...new Set(keys.map(skEl))];if(GTAB!='all'&&!els.includes(GTAB))GTAB='all';
  const ek=GTAB=='all'?TREL[T.id]||els[0]:GTAB,E_=ELM[ek],show=keys.filter(k=>GTAB=='all'||skEl(k)==GTAB);if(!TSEL||!SK[TSEL]||!keys.includes(TSEL))TSEL=show[0]||null;
  const w=$('tree');E_.r.forEach((c,i)=>w.style.setProperty('--e'+i,c));
  const sg=pixIcon(GTAB=='all'?T.ic:E_.ic,ek,1);$('bkSig').innerHTML=sg?`<img class="px" src="${sg}" alt="">`:T.ic;
  $('bkT').textContent=GTAB=='all'?'GRIMÓRIO · '+T.n.toUpperCase():E_.t;$('tpts').textContent=P.sp+' ponto'+(P.sp==1?'':'s')+' para gastar';
  let g=show.map(k=>{const S_=SK[k],r=rk(k),can=r<3&&P.sp>0&&P.lv>=reqLv(k,r);
    return`<button class="gs${r?' on':''}${can?' can':''}${TSEL==k?' sel':''}${S_.pas?' pas':''}" data-k="${k}" title="${S_.n}">${icoH(k,1)}<em>${[0,1,2].map(i=>`<b${i<r?' class="f"':''}></b>`).join('')}</em>${P.lv<S_.lv?`<u>Nv ${S_.lv}</u>`:''}</button>`}).join('');
  for(let i=show.length;i<Math.max(10,Math.ceil(show.length/5)*5);i++)g+='<span class="gs emp"></span>';$('bkG').innerHTML=g;
  $('bkTabs').innerHTML=['all',...els].map(e=>{const u=pixIcon(e=='all'?T.ic:ELM[e].ic,e=='all'?TREL[T.id]||'aco':e,0);return`<button class="gtab${GTAB==e?' on':''}" data-tab="${e}" title="${e=='all'?'Todas':ELM[e].n}">${u?`<img class="px" src="${u}" alt="">`:(e=='all'?T.ic:ELM[e].ic)}</button>`}).join('');
  $('bkHb').innerHTML='<i>ATALHOS</i>'+[0,1,2,3].map(i=>{const k=P.bar[i];return`<button class="gh${k&&k==TSEL?' on':''}" data-s="${i}">${k&&SK[k]?icoH(k,0):''}<u>${i+1}</u></button>`}).join('');
  const d=$('gdet');if(!TSEL){d.innerHTML='<p class="ihint">Você ganha 1 ponto a cada nível.</p>';return}
  const S_=SK[TSEL],r=rk(TSEL),nr=Math.min(3,r+1),need=reqLv(TSEL,r),el=ELM[skEl(TSEL)],ds=S_.d(Math.max(1,r)),dm=(ds.match(/\([^)]*?(\d+)%/)||[])[1],ef=S_.pas&&(ds.match(/\+(\d+)%/)||[])[1];
  d.innerHTML=`<div class="gd-h">${icoH(TSEL,1)}<div><b>${S_.n}</b><small>${S_.pas?'Passiva':'Ativa'} · ${el.n}</small></div></div>
    <div class="gd-st">${S_.pas?(ef?`<span><i>EFEITO</i><b>+${ef}%</b></span>`:''):`<span class="dm"><i>DANO</i><b>${dm?dm+'%':'—'}</b></span>`}${S_.cost?`<span><i>${resName()}</i><b>${S_.cost}</b></span>`:''}${S_.cd>1?`<span><i>RECARGA</i><b>${S_.cd}s</b></span>`:''}<span><i>NÍVEL</i><b>${r}/3</b></span></div>
    <p>${ds}</p>${r&&r<3?`<p class="nx">Próximo nível: ${S_.d(nr)}</p>`:''}${!r&&P.lv<need?`<p class="nx">Liberada no nível ${need}.</p>`:''}
    <div class="tb">${r<3?`<button class="ib ${P.sp>0&&P.lv>=need?'':'off'}" data-l="1">${r?'Melhorar':'Aprender'} (1 ponto${P.lv<need?` · nível ${need}`:''})</button>`:''}</div>
    ${r&&!S_.pas?'<p class="gtip">Toque num atalho (1–4) para colocar esta habilidade nele.</p>':''}`}
function bindTree(){$('tree').onclick=e=>{if(e.target===$('tree')){closeAll();return}
  const tb=e.target.closest('[data-tab]');if(tb){GTAB=tb.dataset.tab;TSEL=null;treeRender();sweep(900,500,.08,'triangle',.02);return}
  const n=e.target.closest('[data-k]');if(n){TSEL=n.dataset.k;treeRender();snd(700,.04,'sine');return}
  const l=e.target.closest('[data-l]');if(l){if(!learn(TSEL))toast('✨','Não dá ainda',P.sp<1?'Sem pontos: suba de nível.':'Nível insuficiente.');else{const b=document.querySelector('.gs.sel');if(b){b.classList.remove('lrn');void b.offsetWidth;b.classList.add('lrn')}}treeRender();return}
  const s=e.target.closest('[data-s]');if(s){if(!TSEL||!rk(TSEL)||SK[TSEL].pas){toast('✨','Atalho',!TSEL||!rk(TSEL)?'Aprenda a habilidade primeiro.':'Passivas funcionam sozinhas, sem atalho.');return}
    const i=+s.dataset.s,o=P.bar.indexOf(TSEL);if(o>=0)P.bar[o]=P.bar[i];P.bar[i]=TSEL;hud();treeRender();save();snd(880,.05,'sine')}}}
const _openTree0=openTree;openTree=function(){_openTree0();if(UI.open=='tree')sweep(300,1400,.18,'triangle',.02)};

// ---------- atalhos do HUD com os mesmos ícones
const _hud14=hud;hud=function(){_hud14();if(!ST.mx)return;P.bar.forEach((k,i)=>{const b=$('sk'+i),ic=b&&b.querySelector('i');if(!ic)return;const u=k&&SK[k]?skIcon(k,0):null;if(u)ic.textContent='';const tag=(k||'')+(u?'1':'0');if(ic.dataset.k===tag)return;ic.dataset.k=tag;
  if(u){ic.classList.add('px');ic.style.backgroundImage=`url(${u})`;b.style.setProperty('--ec',ELM[skEl(k)].r[3])}else{ic.classList.remove('px');ic.style.backgroundImage='';b.style.removeProperty('--ec')}})};
