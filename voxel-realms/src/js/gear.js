'use strict';
/* =============================================================================
   VOXEL REALMS · equipamento e progressão (14.2)
   - O que você equipa aparece no herói (elmo troca o chapéu da classe, peitoral
     muda a roupa, luvas e botas mudam de cor), sem peças sobrepostas.
   - Qualidade por nível do item: Rústico, de Ferro, de Aço, de Mithril e do
     Dragão; cada faixa tem cor própria e dá um pouco mais de dano/armadura.
     Itens pedem nível mínimo (nível do item − 2).
   - Mão esquerda: escudo (bloqueio melhor), grimório de bolso (Poder Mágico) ou
     uma segunda arma de uma mão (duas armas: +12% de velocidade e metade do
     dano da segunda arma). Armas de duas mãos (arcos, bestas, cajados, lanças,
     martelos, machados rúnicos, espadões) ocupam as duas mãos e batem mais forte.
   - Desmanchar itens dá Fragmentos Arcanos; na bancada do Durin dá para
     ascender a raridade do que está equipado.
   - Segunda árvore: o Eremita Ulric ensina a árvore de outra classe; trocar
     reinicia a segunda árvore do zero (pontos devolvidos).
   ============================================================================= */
const TIERS=[{n:'Rústico',suf:'',lv:1,met:0xb07c42,lea:0x6a4a2a,clo:0x6a6258,acc:0xc89a5a},
  {n:'de Ferro',suf:'de Ferro',lv:5,met:0x8e959e,lea:0x5a3a22,clo:0x3a4a6a,acc:0xc8ccd4},
  {n:'de Aço',suf:'de Aço',lv:10,met:0xc4ccd8,lea:0x4a2a1a,clo:0x4a2a6a,acc:0xf0d070},
  {n:'de Mithril',suf:'de Mithril',lv:15,met:0x9adcea,lea:0x2a3a4a,clo:0x2a5a8a,acc:0x7df0ff},
  {n:'do Dragão',suf:'do Dragão',lv:20,met:0x6a1a26,lea:0x3a1010,clo:0x6a1020,acc:0xff6a2a}];
const tierOf=it=>{let t=0;for(let i=0;i<TIERS.length;i++)if((it.ilvl||1)>=TIERS[i].lv)t=i;return t};
const reqOf=it=>it&&it.slot!='mat'?Math.max(1,(it.ilvl||1)-2):1;
const TWO_WK=new Set(['bow','xbow','staff','spear']),TWO_VK=new Set(['hammer','raxe','gsword']);
const isTwo=it=>!!it&&it.slot=='arma'&&(TWO_WK.has(it.wk)||TWO_VK.has(it.vk));
MAT.fragmento={n:'Fragmento Arcano',ic:'💠',p:6,d:'Sobra de um item desmanchado. O Durin usa para ascender equipamentos.'};

// ---------- bases novas (cada uma com um visual próprio no herói)
BASES.arma.push(['Espadão','⚔️','sword','gsword']);
BASES.elmo=[['Elmo de Ferro','🪖','helm'],['Capuz do Caçador','🎩','hood'],['Elmo com Chifres','🪖','horn'],['Chapéu de Mago','🎩','wizard'],['Chapéu de Patrulha','🎩','ranger'],['Elmo Fechado','🪖','greathelm'],['Coroa de Ossos','👑','bonecrown']];
BASES.peito=[['Couraça','🛡️','plate'],['Cota de Malha','🥋','chain'],['Gibão de Couro','🥋','leather'],['Manto Arcano','🥋','robe'],['Armadura de Ossos','🦴','bones']];
BASES.luvas=[['Manoplas','🧤','gaunt'],['Luvas de Couro','🧤','lglove']];
BASES.botas=[['Botas de Couro','🥾','lboot'],['Grevas','🥾','greaves']];
BASES.mao2=[['Escudo Redondo','🛡️','rshield'],['Escudo Torre','🛡️','tshield'],['Broquel','🛡️','buckler'],['Grimório de Bolso','📕','tome']];
const CLS_GEAR={guerreiro:{helm:4,horn:3,greathelm:3,plate:5,chain:3,gaunt:3,greaves:3,rshield:3,tshield:3,buckler:1},
  mago:{wizard:5,hood:2,robe:6,lglove:2,lboot:2,tome:6},cacador:{ranger:5,hood:4,leather:5,chain:2,lglove:3,lboot:3,buckler:3},
  necromante:{bonecrown:4,hood:4,bones:5,robe:4,tome:5},vampiro:{hood:4,horn:1,leather:4,chain:2,lglove:2,lboot:2,buckler:2}};
const _pickBase14=pickBase;pickBase=function(slot,bl){if(slot=='arma')return _pickBase14(slot,bl);const W=CLS_GEAR[P.cls]||{};return wpick(bl,b=>W[b[2]]||1)};
SLOTS.splice(1,0,['mao2','Mão Esquerda','✋']);SLN.mao2=SLOTS[1];EQ.mao2=null;
// conserta a variante visual da arma (o gerador antigo perdia o "vk") e aplica a qualidade
function fixItem(it){if(!it||it.slot=='mat')return it;const bl=BASES[it.slot];if(bl&&!it.vk){const b=bl.find(x=>x[0]==it.base);if(b)it.vk=it.slot=='arma'?b[3]||b[2]:b[2]}if(it.slot=='arma')it.two=isTwo(it);return it}
function tierItem(it){const t=tierOf(it),T=TIERS[t];it.tier=t;if(it.rar<=1&&T.suf&&!it.n.includes(T.suf))it.n=it.n.replace(it.base,it.base+' '+T.suf);
  const k=1+.06*t;if(it.wd){let m=k;if(it.two&&it.wk!='bow'&&it.wk!='xbow'&&it.wk!='staff'){m*=1.28;it.spd=Math.min(it.spd||1,.86)}it.wd=it.wd.map(v=>Math.round(v*m))}if(it.arm)it.arm=Math.round(it.arm*k);return it}
function genOff(ilvl,bonus){bonus=bonus||0;const r=R(),rar=r<.04+bonus*.1?2:r<.24+bonus*.14?1:0,bl=BASES.mao2,b=bl[pickBase('mao2',bl)];
  const it={id:iid++,slot:'mao2',rar,ilvl,base:b[0],ic:b[1],vk:b[2],aff:{}},rm=[1,1.12,1.28][rar];
  if(b[2]=='tome')it.aff.mag=Math.round(10*(1+ilvl*.03)*rm);else{it.arm=Math.round((3+ilvl*1.1)*rm*(b[2]=='tshield'?1.5:b[2]=='buckler'?.7:1.1));it.blk=b[2]=='tshield'?16:b[2]=='buckler'?8:12}
  const na=[0,1+(R()<.5?1:0),3][rar],pool=AFX.filter(a=>!a.slot||a.slot.includes('anel'));for(let i=0;i<na&&pool.length;i++){const a=pool.splice(pickAff(pool),1)[0];it.aff[a.k]=(it.aff[a.k]||0)+Math.max(1,Math.round(lerp(a.r[0],a.r[1],R())*(a.flat?1+ilvl*.09:1+ilvl*.015)))}
  const A=k=>AFX.find(a=>a.k==k),ks=Object.keys(it.aff).filter(k=>A(k));if(rar==2)it.n=pick(RARE_N);else if(rar==1){const pre=ks.map(A).find(a=>a.pre),suf=ks.map(A).find(a=>a.suf);it.n=it.base+(pre?' '+pre.pre:'')+(suf?' '+suf.suf:'')}else it.n=it.base;
  it.price=Math.round([6,16,45][rar]*(1+ilvl*.12));return it}
const _genItem14=genItem;genItem=function(ilvl,bonus,slot,forceLeg){if(!slot&&!forceLeg)slot=R()<.09?'mao2':pick(SLOTS.filter(s=>s[0]!='mao2'))[0];const it=slot=='mao2'?genOff(ilvl,bonus):_genItem14(ilvl,bonus,slot,forceLeg);fixItem(it);return tierItem(it)};
const _itemLines14=itemLines;itemLines=function(it){const L=_itemLines14(it);if(it.slot=='mat')return L;const t=it.tier!=null?it.tier:tierOf(it),req=reqOf(it);
  L.unshift(`<span style="color:#${TIERS[t].acc.toString(16).padStart(6,'0')}">Qualidade: ${TIERS[t].n}</span>${it.slot=='arma'?` · <span style="color:#d8c8b0">${isTwo(it)?'Duas mãos':'Uma mão (pode ir na mão esquerda)'}</span>`:''}`);
  if(it.blk)L.push(`<span class="af">+${it.blk}% de bloqueio com escudo</span>`);if(P.lv<req)L.push(`<span style="color:#ff6a5a">🔒 Requer nível ${req}</span>`);return L};
const _itemScore14=itemScore;itemScore=function(it){return it?_itemScore14(it)+(it.blk||0)*1.5+(it.two&&it.wd?(it.wd[0]+it.wd[1])*.3:0):0};

// ---------- equipar: nível mínimo, duas mãos e mão esquerda
function handsBusy(){return!!(ST.dual||ST.sh||ST.tome||(ST.two&&!bow()))}
const _equip14=equip;equip=function(i,quiet,off){const it=INV[i];if(!it||it.slot=='mat')return _equip14(i,quiet);fixItem(it);
  if(P.lv<reqOf(it)){if(!quiet)toast('🔒','Requer nível '+reqOf(it),it.n);return}
  if(off||it.slot=='mao2'){if(off&&(it.slot!='arma'||isTwo(it)))return;if(EQ.arma&&isTwo(EQ.arma)){if(!quiet)toast('✋','Arma de duas mãos','Troque a arma principal para usar a mão esquerda.');return}
    const old=EQ.mao2;EQ.mao2=it;INV[i]=old||null;calcStats();if(!quiet){sweep(300,700,.15,'triangle',.05);flash(P.x,P.y+1.6,P.z,RAR[it.rar].h,2.4,.25)}hud();save();return}
  _equip14(i,quiet);if(it.slot=='arma'&&isTwo(it)&&EQ.mao2){const j=INV.indexOf(null),o=EQ.mao2;EQ.mao2=null;if(j>=0)INV[j]=o;else dropItem(P.x,P.z,o);if(!quiet)toast('✋','Duas mãos','A mão esquerda foi liberada.');calcStats();hud();save()}};
// ---------- atributos com a mão esquerda
const _calc14=calcStats;
calcStats=function(){const off=EQ.mao2,two=isTwo(EQ.arma),wd=off&&off.wd;if(off&&two)EQ.mao2=null;else if(wd)off.wd=null; // a 2ª arma soma afixos, mas não troca o dano da principal
  _calc14();EQ.mao2=off;if(wd)off.wd=wd;const s=ST;s.two=two;s.dual=0;s.sh=0;s.tome=0;
  if(off&&!two){if(wd){s.dual=1;s.dmin+=Math.round(wd[0]*.5);s.dmax+=Math.round(wd[1]*.5);s.ias+=12}else if(off.vk=='tome')s.tome=1;else s.sh=off.blk||10}
  gearModel()};
function armorVis(){} // o equipamento agora faz parte do próprio modelo do herói (sem peças por cima)
// ---------- aparência do herói montada a partir do equipamento
function gearLook(o){const H=EQ.elmo,B=EQ.peito,G=EQ.luvas,F=EQ.botas,T=it=>TIERS[it.tier!=null?it.tier:tierOf(it)],acc=it=>it.rar>=3?0xffb040:it.rar==2?0xffe14a:T(it).acc;
  if(H){fixItem(H);const t=T(H),v=H.vk||'helm';o.hat=v=='hood'?'hood':v=='horn'?'horn':v=='wizard'?'wizard':v=='ranger'?'ranger':v=='greathelm'?'greathelm':v=='bonecrown'?'bonecrown':'helm';
    o.hatC=v=='hood'||v=='wizard'?t.clo:v=='ranger'?t.lea:t.met;o.plume=H.rar>=2?acc(H):null;o.gem=acc(H);if(o.hat=='hood')o.mask=null}
  if(B){fixItem(B);const t=T(B),v=B.vk||'plate';delete o.vest;delete o.plate;delete o.chainC;
    if(v=='plate'){o.plate=t.met;o.shoulders=t.met;o.emblem=acc(B)}else if(v=='chain'){o.chainC=shade(t.met,.9);o.shirt=shade(t.met,.8);o.shoulders=t.lea}
    else if(v=='leather'){o.vest=t.lea;o.shoulders=0;o.belt=shade(t.lea,.7)}else if(v=='robe'){o.robe=t.clo;o.shirt=t.clo;o.trim=acc(B);o.shoulders=0}else if(v=='bones'){o.bones=0xd8d0c0;o.shirt=shade(t.clo,.6);o.shoulders=0xe0d8c4}
    if(B.rar>=2)o.capeE=acc(B)}
  if(G){fixItem(G);const t=T(G);o.gloves=G.vk=='gaunt'?t.met:t.lea}
  if(F){fixItem(F);const t=T(F);o.boots=F.vk=='greaves'?t.met:t.lea}return o}
const gearSig=()=>['elmo','peito','luvas','botas'].map(k=>EQ[k]?EQ[k].id:0).join(',')+'|'+P.cls;
let GEARSIG='';
const _heroModel14=heroModel;heroModel=function(cls){const c=CLS[cls]||CLS.guerreiro,o=gearLook(Object.assign({skin:0xe0a878,hair:0x4a2a18,shirt:0x6d7684,pants:0x4a3a2e,boots:0x3a2a1e,cape:0xb3202a,capeE:0xd9a948,belt:0x5a3a20,shoulders:0x8a93a2},c.mdl));GEARSIG=gearSig();return hum(o)};
// reconstrói o herói quando muda a armadura (um modelo só, desenhado de uma vez) e coloca as armas nas mãos
function gearModel(){if(gearSig()!==GEARSIG&&P.m){const old=P.m;if(TCH.g&&TCH.g.parent)TCH.g.parent.remove(TCH.g);const m=heroModel(P.cls);m.g.position.copy(old.g.position);m.g.rotation.y=old.g.rotation.y;m.g.visible=old.g.visible;P.m=m;dropModel(old);if(typeof FPV!='undefined')FPV.cls=''}
  const m=P.m,w=EQ.arma,off=EQ.mao2,rng=w&&RNG(w.wk),mt=w?tierOf(w):1,col=w&&w.wd&&!rng&&(mt==0||mt>=3)?TIERS[mt].met:null;
  weapon(m,w?(w.vk||w.wk):null,col,w&&w.rar>=3?RAR[w.rar].h:null,rng?m.hL:m.hR);
  if(rng)weapon(m,null,0,0,m.hR);else if(off&&off.wd&&!ST.two){const ot=tierOf(off);weapon(m,off.vk||off.wk,ot==0||ot>=3?TIERS[ot].met:null,off.rar>=3?RAR[off.rar].h:null,m.hL)}
  else if(off&&off.vk=='tome'&&!ST.two)weapon(m,'book',TIERS[tierOf(off)].clo,null,m.hL);else weapon(m,null,0,0,m.hL);
  shieldVis(m,off&&!off.wd&&off.vk!='tome'&&!ST.two?off:null);m.meshes=[];m.g.traverse(o=>{if(o.isMesh){m.meshes.push(o);if(!o.userData.mat)o.userData.mat=o.material}})}
function shieldVis(m,it){if(m.shG){m.shG.parent&&m.shG.parent.remove(m.shG);m.shG.traverse(o=>o.geometry&&o.geometry.dispose());m.shG=null}if(!it)return;const t=TIERS[tierOf(it)],a=it.rar>=2?0xffe14a:t.acc,v=it.vk;
  const g=part(m.eL,-.2,-.24,.02,k=>{if(v=='tshield'){k.box(.1,1.25,.8,0,0,0,t.lea).box(.12,1.3,.1,0,0,.38,t.met).box(.12,1.3,.1,0,0,-.38,t.met).box(.12,.1,.82,0,.6,0,t.met).box(.12,.1,.82,0,-.6,0,t.met).box(.14,.34,.3,-.02,.1,0,a)}
    else if(v=='buckler'){k.box(.1,.56,.56,0,0,0,t.met).box(.12,.4,.4,-.01,0,0,shade(t.met,.8)).box(.14,.14,.14,-.03,0,0,a)}
    else{k.box(.1,.9,.9,0,0,0,t.lea,{rx:.785}).box(.1,.86,.62,0,0,0,t.lea).box(.1,.62,.86,0,0,0,t.lea).box(.12,.92,.1,-.01,0,0,t.met).box(.12,.1,.92,-.01,0,0,t.met).box(.15,.2,.2,-.03,0,0,a)}});
  g.rotation.y=.7;g.children.forEach(o=>{if(o.isMesh)o.castShadow=true});m.shG=g}
// ---------- desmanchar e ascender (bancada do Durin)
function salvage(i){const it=INV[i];if(!it||it.slot=='mat')return;const n=Math.round([1,3,8,20][it.rar]*(1+.5*tierOf(it)));INV[i]=null;
  const s=INV.find(o=>o&&o.mid=='fragmento');if(s)s.q=(s.q||1)+n;else{const j=INV.indexOf(null);INV[j]={id:iid++,slot:'mat',mid:'fragmento',rar:0,ilvl:1,n:MAT.fragmento.n,ic:MAT.fragmento.ic,price:MAT.fragmento.p,d:MAT.fragmento.d,q:n,aff:{}}}
  fx(P.x,P.y+1.4,P.z,0x7df0ff,12,4,.1,1.2,6);snd(1400,.08,'square');toast('💠','Desmanchado: '+it.n,'+'+n+' Fragmentos Arcanos');hud();save()}
const FRAG=()=>{const s=INV.find(o=>o&&o.mid=='fragmento');return s?s.q||1:0};
function fragUse(n){const s=INV.find(o=>o&&o.mid=='fragmento');if(!s)return;s.q-=n;if(s.q<=0)INV[INV.indexOf(s)]=null}
const ascCost=it=>({f:Math.round(8*(it.rar+1)*(1+tierOf(it)*.6)),g:Math.round(60*(it.rar+1)*(1+it.ilvl*.12))});
function ascend(slot){const it=EQ[slot];if(!it||it.rar>=2)return;const c=ascCost(it);if(FRAG()<c.f||P.gold<c.g){toast('⚒️','Faltam recursos',c.f+' 💠 e '+c.g+' ouro');return}
  fragUse(c.f);P.gold-=c.g;it.rar++;const pool=AFX.filter(a=>!it.aff[a.k]&&(!a.slot||a.slot.includes(slot=='mao2'?'anel':slot)));const add=it.rar==2?2:1;
  for(let i=0;i<add&&pool.length;i++){const a=pool.splice(pickAff(pool),1)[0];it.aff[a.k]=Math.max(1,Math.round(lerp(a.r[0],a.r[1],.6+R()*.4)*(a.flat?1+it.ilvl*.09:1+it.ilvl*.015)))}
  if(it.wd)it.wd=it.wd.map(v=>Math.round(v*1.1));if(it.arm)it.arm=Math.round(it.arm*1.12);if(it.rar==2)it.n=pick(RARE_N);it.price=Math.round(it.price*2.4);
  calcStats();ring(P.x,P.z,2.6,RAR[it.rar].h,.6);column(P.x,P.z,RAR[it.rar].h,6,1,.6);fx(P.x,P.y+1.2,P.z,RAR[it.rar].h,24,6,.1,1.4,4);snd(880,.2,'sine');setTimeout(()=>snd(1320,.25,'sine'),140);
  toast('✨','Ascendido: '+it.n,RAR[it.rar].n);forgeRender();hud();save()}
const _forgeRender14=forgeRender;forgeRender=function(){_forgeRender14();const L=$('frgl');if(!L)return;let h='<p class="ihint" style="margin-top:10px">Ascender raridade (gasta 💠 Fragmentos Arcanos, que vêm de desmanchar itens no inventário). Você tem '+FRAG()+' 💠.</p>';
  for(const[s,n]of SLOTS.map(x=>[x[0],x[1]])){const it=EQ[s];if(!it||it.rar>=2)continue;const c=ascCost(it);h+=`<button class="ib" data-asc="${s}">${it.ic} ${it.n}: ${RAR[it.rar].n} → ${RAR[it.rar+1].n} · ${c.f}💠 + ${c.g}🪙</button>`}L.insertAdjacentHTML('beforeend',h)};
$('frg')&&$('frg').addEventListener('click',e=>{const b=e.target.closest('[data-asc]');if(b){ascend(b.dataset.asc);e.stopImmediatePropagation()}},true);
// ---------- inventário: mão esquerda, desmanchar e poder do equipamento
const gearPower=()=>Math.round(Object.values(EQ).reduce((s,it)=>s+itemScore(it),0));
const _invRender14=invRender;invRender=function(){_invRender14();if(UI.open!='inv')return;const s=$('ivS');if(s&&!s.querySelector('.gp'))s.insertAdjacentHTML('beforeend',`<span class="chip gp">⭐ Poder ${gearPower()}</span>`);
  const it=typeof ISEL=='number'?INV[ISEL]:null,b=document.querySelector('#ivD .ibt');if(!it||!b||it.slot=='mat')return;let h='';
  if(it.slot=='arma'&&!isTwo(it))h+='<button class="ib" data-a="eq2">Mão esquerda</button>';h+='<button class="ib off" data-a="salv">Desmanchar 💠</button>';b.insertAdjacentHTML('beforeend',h)};
$('inv').addEventListener('click',e=>{const b=e.target.closest('[data-a]');if(!b)return;const a=b.dataset.a;if(a!='eq2'&&a!='salv')return;e.stopImmediatePropagation();
  if(a=='eq2')equip(ISEL,0,1);else salvage(ISEL);ISEL=null;invRender()},true);
// ---------- segunda árvore (ensinada pelo Eremita Ulric)
P.sub=null;
const SUBCOST=()=>Math.round(250+P.lv*45);
treeOrder=function(){const f=CLS_TREE[P.cls]||'guerra',a=[TREE.find(t=>t.id==f)];if(P.sub&&P.sub!=f){const t=TREE.find(t=>t.id==P.sub);if(t)a.push(t)}return a};
skillPurge=function(){const ok=new Set(treeOrder().map(t=>t.id));let n=0;for(const k in P.sk){if(!SK[k]||!ok.has(SK[k].t)){n+=P.sk[k]|0;delete P.sk[k]}}P.bar=P.bar.map(k=>k&&P.sk[k]?k:null);if(n){P.sp+=n;toast('✨','Árvores do personagem',n+' ponto'+(n>1?'s':'')+' devolvido'+(n>1?'s':'')+' para aprender de novo.')}calcStats();hud()};
function setSub(id){const f=CLS_TREE[P.cls]||'guerra';if(id==f||id==P.sub)return;const c=SUBCOST();if(P.gold<c){toast('🪙','Ouro insuficiente','O Eremita pede '+c+' moedas.');return}
  P.gold-=c;const old=P.sub;P.sub=id;skillPurge();const T=TREE.find(t=>t.id==id);toast(T.ic,'Segunda árvore: '+T.n,old?'A anterior foi esquecida e os pontos voltaram.':'Abra o grimório (📖) para aprender.');
  column(P.x,P.z,0x9a7aff,8,1.2,.8);ring(P.x,P.z,3,0xc8a8ff,.8);fx(P.x,P.y+1,P.z,0xc8a8ff,30,5,.12,1.6,-1);snd(520,.4,'sine');setTimeout(()=>snd(780,.5,'sine'),200);subRender();hud();save()}
function openSub(){if(!run)return;openWin('subw');subRender()}
function subRender(){const f=CLS_TREE[P.cls]||'guerra',c=SUBCOST();$('subl').innerHTML=`<p class="ihint">"Toda classe aprende com as outras, Guardião. Escolha uma segunda árvore de habilidades. Se mudar de ideia, eu ensino outra — mas a anterior será esquecida e seus pontos voltam para você."</p>`+
  TREE.filter(t=>t.id!=f&&Object.values(CLS_TREE).includes(t.id)).map(t=>`<button class="ib ${P.sub==t.id?'':'off'}" data-sub="${t.id}" style="display:block;width:100%;text-align:left;margin:4px 0">${t.ic} ${t.n}${P.sub==t.id?' · sua segunda árvore':` · ${c}🪙`}</button>`).join('')}
$('subw').addEventListener('click',e=>{const b=e.target.closest('[data-sub]');if(b)setSub(b.dataset.sub)});
const _talk14=talkTo;talkTo=function(n){if(n&&n.id=='eremita'&&!act('m11')){openSub();return}return _talk14(n)};
const _closeAll14=closeAll;closeAll=function(){_closeAll14();$('subw').classList.remove('on')};
