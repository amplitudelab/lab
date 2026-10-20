'use strict';
/* =============================================================================
   VOXEL REALMS · mochila, poções e inventário completo (15.0)
   - Poções não são mais infinitas: são itens que se compram na Forja da Helga
     (ou se acham com monstros e baús). Cada poção ocupa um espaço da mochila.
     O botão 🧪 bebe a menor poção de vida que cobre o que falta (ou a maior).
   - Todo herói usa uma mochila nas costas (no lugar da capa). Mochilas maiores,
     vendidas pela Helga, dão mais espaços.
   - Inventário no estilo de painel: retrato do herói ao vivo com armas e joias
     nos cantos, atributos, grade da mochila com ícones 3D dos próprios itens,
     coluna de equipamento (cabeça, peito, costas, luvas, botas) e medidores.
   ============================================================================= */
const POT={vida1:{n:'Poção de Vida Menor',sh:'Vida P',heal:.3,p:28,lv:1,c:0xe0383a,d:'Cura 30% da vida.'},
  vida2:{n:'Poção de Vida',sh:'Vida',heal:.5,p:70,lv:6,c:0xff2a50,d:'Cura 50% da vida.'},
  vida3:{n:'Poção de Vida Maior',sh:'Vida G',heal:.8,p:165,lv:14,c:0xff5a9a,d:'Cura 80% da vida.'},
  anti:{n:'Antídoto',sh:'Antídoto',heal:.12,p:22,lv:1,c:0x7dff6a,d:'Tira veneno e queimadura, protege deles por 8 s e cura 12% da vida.'},
  animo:{n:'Elixir de Ânimo',sh:'Ânimo',p:60,lv:4,c:0x6aa0ff,d:'Recupera 60 de Fúria, Mana, Almas ou Sangue.'}};
const HPOT=['vida1','vida2','vida3'];
const BAGS={bolsa:{n:'Bolsa Velha',cap:6,p:0,lv:1,c:0x7a5232},viaj:{n:'Mochila de Viajante',cap:12,p:320,lv:4,c:0x6a4a2a},
  aven:{n:'Mochila de Aventureiro',cap:18,p:1150,lv:10,c:0x5a3a22},real:{n:'Mochila Real',cap:24,p:3400,lv:18,c:0x6a1a26}};
const INVB=24;
SKX.pocao.cd=4;EQ.costas=null;SLN.costas=['costas','Costas','🎒'];SLN.pot=['pot','Poção','🧪'];
function potItem(k){const D=POT[k];return{id:iid++,slot:'pot',pid:k,n:D.n,ic:'🧪',rar:0,ilvl:D.lv,price:Math.round(D.p*.35),aff:{},d:D.d}}
function bagItem(v){const B=BAGS[v];return{id:iid++,slot:'costas',vk:v,n:B.n,ic:'🎒',rar:v=='real'?2:v=='aven'?1:0,ilvl:B.lv+2,cap:B.cap,price:Math.round(B.p*.4),aff:v=='real'?{gold:20,hp:30}:v=='aven'?{gold:10}:{}}}
const bagCap=()=>INVB+(EQ.costas?EQ.costas.cap||0:0);
// ajusta o tamanho da mochila: cresce com espaços vazios; ao diminuir, puxa os itens do fim para os buracos
function bagFit(){const cap=bagCap();while(INV.length<cap)INV.push(null);
  for(let i=cap;i<INV.length;i++)if(INV[i]){const j=INV.indexOf(null);if(j>=0&&j<cap){INV[j]=INV[i];INV[i]=null}}
  while(INV.length>cap&&!INV[INV.length-1])INV.length--}
const invUsed=()=>INV.reduce((n,x)=>n+(x?1:0),0);
function invGive(it){const i=INV.indexOf(null);if(i<0)return false;INV[i]=it;return true}

// ---------- beber
const potCount=()=>INV.reduce((n,it)=>n+(it&&it.slot=='pot'&&HPOT.includes(it.pid)?1:0),0);
potion=function(){if(P.dead||P.cd.pocao>0||UI.block())return;const miss=1-P.hp/ST.mx;if(miss<.005){pop('Vida cheia',P.x,P.y+3,P.z,'#fff');return}
  const L=[];INV.forEach((it,i)=>{if(it&&it.slot=='pot'&&HPOT.includes(it.pid))L.push([POT[it.pid].heal,i])});
  if(!L.length){pop('Sem poções!',P.x,P.y+3,P.z,'#ff8a5a');toast('🧪','Sem poções de vida','A Helga vende na Forja, na vila. Monstros e baús às vezes deixam cair.');snd(200,.12,'square');return}
  L.sort((a,b)=>a[0]-b[0]);const c=L.find(x=>x[0]>=miss*.85)||L[L.length-1];drinkAt(c[1])};
function drinkAt(i){const it=INV[i];if(!it||it.slot!='pot'||P.dead)return;const D=POT[it.pid];
  if(D.heal&&HPOT.includes(it.pid)&&P.hp>=ST.mx){pop('Vida cheia',P.x,P.y+3,P.z,'#fff');return}
  if(it.pid=='animo'&&P.fury>=100){pop('Já está cheio',P.x,P.y+3,P.z,'#fff');return}
  INV[i]=null;P.cd.pocao=SKX.pocao.cd;if(D.heal)heal(ST.mx*D.heal);
  if(it.pid=='anti'){P.psn=0;P.brn=0;P.buff.anti=8;pop('Protegido!',P.x,P.y+3.4,P.z,'#7dff6a')}
  if(it.pid=='animo'){P.fury=Math.min(100,P.fury+60);pop('+60',P.x,P.y+3.4,P.z,'#9ac8ff')}
  fx(P.x,P.y+1,P.z,D.c,16,3,.15,2);ring(P.x,P.z,1.6,D.c,.35);sweep(300,900,.18,'sine',.05);setTimeout(()=>snd(1200,.06,'sine'),140);hud();save();if(UI.open=='inv')invRender()}
// antídoto: não pega veneno nem queimadura enquanto durar
const _hitP15=hitPlayer;hitPlayer=function(d,o){if(o&&P.buff.anti>0){o=Object.assign({},o);o.psn=0;o.brn=0}return _hitP15(d,o)};
// poções caem às vezes de monstros (mais de elites e chefes)
const _kill15=killMob;killMob=function(e){const r=_kill15.apply(this,arguments);if(!e.t||e.t.passive||e.minion)return r;
  const ch=e.boss?1:e.el==2?.3:e.el?.14:.03;if(R()<ch){const lv=e.lv||1;dropItem(e.x+(R()-.5)*1.5,e.z+(R()-.5)*1.5,potItem(lv>=16&&R()<.4?'vida3':lv>=8&&R()<.5?'vida2':R()<.15?'anti':'vida1'))}return r};

// ---------- equipar mochila / beber pelo inventário
const _equip15=equip;equip=function(i,quiet,off){const it=INV[i];if(it&&it.slot=='pot'){drinkAt(i);return}
  if(it&&it.slot=='costas'){if(P.lv<reqOf(it)){if(!quiet)toast('🔒','Requer nível '+reqOf(it),it.n);return}const nc=INVB+(it.cap||0),used=invUsed()-1+(EQ.costas?1:0);
    if(used>nc){toast('🎒','Não cabe','Esvazie '+(used-nc)+' espaço'+(used-nc>1?'s':'')+' antes de trocar por uma mochila menor.');return}
    const old=EQ.costas;EQ.costas=it;INV[i]=old||null;bagFit();calcStats();if(!quiet){sweep(220,520,.2,'triangle',.05);toast('🎒',it.n,nc+' espaços na mochila')}hud();save();return}
  return _equip15(i,quiet,off)};
const _unequip15=unequip;unequip=function(slot){if(slot=='costas'){toast('🎒','A mochila fica','Troque por outra mochila para tirar esta.');return}return _unequip15(slot)};
const _itemLines15=itemLines;itemLines=function(it){if(!it)return[];if(it.slot=='pot')return[`<span class="af">${POT[it.pid].d}</span>`,`<small>Beba pelo botão 🧪 (Q) ou aqui. Ocupa 1 espaço.</small>`];
  if(it.slot=='costas'){const L=[`<b class="big">${INVB+it.cap}</b> espaços na mochila (+${it.cap})`];for(const k in it.aff){const a=AFX.find(x=>x.k==k);if(a)L.push('<span class="af">'+a.f(it.aff[k])+'</span>')}if(P.lv<reqOf(it))L.push(`<span style="color:#ff6a5a">🔒 Requer nível ${reqOf(it)}</span>`);return L}
  return _itemLines15(it)};
// todo herói começa com uma bolsa e 3 poções; saves antigos ganham o mesmo uma vez
const _startClass15=startClass;startClass=function(c){_startClass15(c);EQ.costas=bagItem('bolsa');bagFit();for(let i=0;i<3;i++)invGive(potItem('vida1'));invGive(potItem('anti'));P.st.pot15=1;calcStats()};
function bagLoad(){if(!EQ.costas||EQ.costas.slot!='costas')EQ.costas=bagItem('bolsa');bagFit();if(!P.st.pot15){P.st.pot15=1;for(let i=0;i<3;i++)invGive(potItem('vida1'));invGive(potItem('anti'))}}
// herói: mochila nas costas no lugar da capa
const _gearLook15=gearLook;gearLook=function(o){_gearLook15(o);const b=EQ.costas;o.cape=null;o.capeE=null;o.pack=b?b.vk:'bolsa';o.packC=BAGS[o.pack]?BAGS[o.pack].c:0x6a4a2a;return o};

// ---------- loja da Helga: poções e mochilas sempre à venda
const _shopR15=shopRender;shopRender=function(){_shopR15();ICR.budget=24;const g=P.gold;
  const ph='<h4 class="shh">🧪 Poções (uma por espaço)</h4>'+Object.keys(POT).map(k=>{const D=POT[k],lk=P.lv<D.lv;return`<div class="shi r0 pt" data-pt="${k}"><i>${icTag({slot:'pot',pid:k},'🧪')}</i><div><b>${D.n}</b><small>${D.d}</small></div><em class="${lk||g<D.p?'no':''}">${lk?'🔒 Nv '+D.lv:D.p+'🪙'}</em></div>`}).join('');
  const bh='<h4 class="shh">🎒 Mochilas</h4>'+Object.keys(BAGS).filter(k=>BAGS[k].p).map(k=>{const B=BAGS[k],lk=P.lv<B.lv,own=EQ.costas&&EQ.costas.vk==k;return`<div class="shi r${k=='real'?2:k=='aven'?1:0} pt" data-bg="${k}"><i>${icTag({slot:'costas',vk:k},'🎒')}</i><div><b>${B.n}</b><small>${INVB+B.cap} espaços${k=='aven'?' · +10% de ouro':k=='real'?' · +20% de ouro e +30 de vida':''}</small></div><em class="${own?'':lk||g<B.p?'no':''}">${own?'✔ Em uso':lk?'🔒 Nv '+B.lv:B.p+'🪙'}</em></div>`}).join('');
  $('shl').insertAdjacentHTML('afterbegin',ph+bh)};
$('shop').addEventListener('click',e=>{const p_=e.target.closest('[data-pt]'),b_=e.target.closest('[data-bg]');if(!p_&&!b_)return;e.stopImmediatePropagation();
  if(p_){const k=p_.dataset.pt,D=POT[k];if(P.lv<D.lv){toast('🔒','Requer nível '+D.lv,D.n);return}if(P.gold<D.p){toast('🪙','Ouro insuficiente','Faltam '+(D.p-P.gold)+' moedas');return}if(!invGive(potItem(k))){toast('🎒','Mochila cheia','Cada poção ocupa um espaço.');return}P.gold-=D.p;snd(990,.08,'sine')}
  else{const k=b_.dataset.bg,B=BAGS[k];if(EQ.costas&&EQ.costas.vk==k)return;if(P.lv<B.lv){toast('🔒','Requer nível '+B.lv,B.n);return}if(P.gold<B.p){toast('🪙','Ouro insuficiente','Faltam '+(B.p-P.gold)+' moedas');return}
    const it=bagItem(k),cur=EQ.costas;P.gold-=B.p;EQ.costas=it;if(cur&&!invGive(cur))dropItem(P.x,P.z,cur);bagFit();calcStats();toast('🎒','Comprada: '+B.n,(INVB+B.cap)+' espaços. A mochila antiga foi para o inventário.');snd(990,.1,'sine')}
  hud();save();shopRender()},true);

// ---------- ícones 3D dos itens (renderizados uma vez e guardados)
const ICR={cache:new Map(),N:96};
function icInit(){if(ICR.sc)return;const s=ICR;s.rt=new THREE.WebGLRenderTarget(s.N,s.N);s.sc=new THREE.Scene();s.sc.add(new THREE.HemisphereLight(0xfff2dc,0x40304a,1.05));
  const d=new THREE.DirectionalLight(0xffffff,.95);d.position.set(-1.2,2,3);s.sc.add(d);const d2=new THREE.DirectionalLight(0x9ab8ff,.35);d2.position.set(2,-.5,-1);s.sc.add(d2);
  s.cam=new THREE.PerspectiveCamera(26,1,.05,60);s.cv=document.createElement('canvas');s.cv.width=s.cv.height=s.N;s.px=new Uint8Array(s.N*s.N*4);
  s.mat=new THREE.MeshLambertMaterial({vertexColors:true});s.emat=new THREE.MeshBasicMaterial({vertexColors:true});s.cc=new THREE.Color()}
const icKey=it=>it.slot=='pot'?'p'+it.pid:it.slot=='mat'?'m'+it.mid:it.slot=='costas'?'c'+it.vk:[it.slot,it.vk||it.wk,it.tier!=null?it.tier:tierOf(it),Math.min(it.rar||0,3)].join('|');
// peças do item (mesmas do herói quando possível)
function itemBake(it,k,e){const t=TIERS[it.tier!=null?it.tier:tierOf(it)]||TIERS[0],acc=it.rar>=3?0xffb040:it.rar==2?0xffe14a:t.acc;let rot=[0,0,0];
  const wpn=(type)=>{const rng=RNG(it.wk),col=it.wd&&!rng&&(t===TIERS[0]||tierOf(it)>=3)?t.met:null;if(WPN[type])WPN[type](k,col,type=='sword'||type=='axe'||type=='mace'?null:0,e);let x0=0,x1=0,z0=0,z1=0;for(let i=0;i<k.p.length;i+=3){x0=Math.min(x0,k.p[i]);x1=Math.max(x1,k.p[i]);z0=Math.min(z0,k.p[i+2]);z1=Math.max(z1,k.p[i+2])}rot=[0,z1-z0>(x1-x0)*1.1?PI/2:0,-.78,'ZYX']};
  switch(it.slot){
    case 'arma':wpn(it.vk||it.wk);break;
    case 'mao2':if(it.wd){wpn(it.vk||it.wk);break}if(it.vk=='tome'){WPN.book(k,t.clo,0,e);rot=[.5,.5,0];break}
      {const v=it.vk;if(v=='tshield')k.box(.1,1.25,.8,0,0,0,t.lea).box(.12,1.3,.1,0,0,.38,t.met).box(.12,1.3,.1,0,0,-.38,t.met).box(.12,.1,.82,0,.6,0,t.met).box(.12,.1,.82,0,-.6,0,t.met).box(.14,.34,.3,.02,.1,0,acc);
        else if(v=='buckler')k.box(.1,.56,.56,0,0,0,t.met).box(.12,.4,.4,.01,0,0,shade(t.met,.8)).box(.14,.14,.14,.03,0,0,acc);
        else k.box(.1,.9,.9,0,0,0,t.lea,{rx:.785}).box(.1,.86,.62,0,0,0,t.lea).box(.1,.62,.86,0,0,0,t.lea).box(.12,.92,.1,.01,0,0,t.met).box(.12,.1,.92,.01,0,0,t.met).box(.15,.2,.2,.03,0,0,acc);rot=[0,-PI/2+.35,0]}break;
    case 'elmo':{const v=it.vk||'helm',o={hat:v,hatC:v=='hood'||v=='wizard'?t.clo:v=='ranger'?t.lea:t.met,plume:it.rar>=2?acc:null,gem:acc};k.box(.7,.6,.7,0,.4,0,0x2a2228);hatBake(k,o);rot=[.25,.6,0];break}
    case 'peito':{const v=it.vk||'plate',o={shirt:0x6d7684};if(v=='plate'){o.plate=t.met;o.shoulders=t.met;o.emblem=acc}else if(v=='chain'){o.chainC=shade(t.met,.9);o.shirt=shade(t.met,.8);o.shoulders=t.lea}
      else if(v=='leather'){o.vest=t.lea;o.belt=shade(t.lea,.7)}else if(v=='robe'){o.shirt=t.clo;o.robe=t.clo;o.trim=acc;k.box(1.02,.7,.68,0,-.3,0,t.clo).box(1.04,.08,.7,0,-.62,0,acc)}else if(v=='bones'){o.bones=0xd8d0c0;o.shirt=shade(t.clo,.6);o.shoulders=0xe0d8c4}
      torsoBake(k,o,1);if(o.shoulders)k.box(.36,.32,.46,-.6,.86,0,o.shoulders).box(.36,.32,.46,.6,.86,0,o.shoulders);rot=[.1,.5,0];break}
    case 'luvas':{const c=it.vk=='gaunt'?t.met:t.lea;for(const s of[-1,1])k.box(.3,.22,.32,s*.24,.2,0,shade(c,.85)).box(.28,.3,.3,s*.24,-.04,0,c).box(.1,.14,.1,s*.24-s*.17,0,.08,c).box(.3,.06,.08,s*.24,-.16,.12,shade(c,1.2));if(it.vk=='gaunt')k.box(.32,.06,.34,-.24,.1,0,acc).box(.32,.06,.34,.24,.1,0,acc);rot=[.3,.35,0];break}
    case 'botas':{const c=it.vk=='greaves'?t.met:t.lea;for(const s of[-1,1])k.box(.32,.46,.34,s*.24,.24,0,c).box(.34,.2,.52,s*.24,-.1,.08,c).box(.36,.06,.54,s*.24,-.22,.08,shade(c,.5)).box(.36,.1,.38,s*.24,.42,0,shade(c,1.25));if(it.vk=='greaves')k.box(.34,.08,.36,-.24,.18,0,acc).box(.34,.08,.36,.24,.18,0,acc);rot=[.25,.65,0];break}
    case 'anel':{const g=t.acc,j=it.rar>=1?RAR[it.rar].h:0xc0f0ff;k.box(.5,.1,.12,0,.25,0,g).box(.5,.1,.12,0,-.25,0,g).box(.1,.5,.12,-.25,0,0,g).box(.1,.5,.12,.25,0,0,g).box(.26,.2,.2,0,.34,0,g);e.box(.2,.16,.16,0,.44,.02,j);rot=[.3,.3,0];break}
    case 'amuleto':{const g=t.acc,j=it.rar>=1?RAR[it.rar].h:0xc0f0ff;for(let i=0;i<5;i++){const a=-.9+i*.45;k.box(.08,.08,.08,S(a)*.5,.5-C(a)*.0+Math.abs(S(a))*-.25,0,g)}k.box(.4,.48,.12,0,-.12,0,g).box(.3,.38,.13,0,-.12,0,shade(g,.7));e.box(.18,.22,.14,0,-.12,.02,j);rot=[.1,.2,0];break}
    case 'costas':packBake(k,it.vk||'bolsa',(BAGS[it.vk]||BAGS.bolsa).c,1);rot=[.15,PI+.6,0];break;
    case 'pot':{const D=POT[it.pid]||POT.vida1,gl=0xdff4f8;k.box(.48,.08,.48,0,.28,0,gl).box(.2,.22,.2,0,.42,0,gl).box(.16,.12,.16,0,.58,0,0x8a5a32).box(.3,.16,.02,0,.02,.25,0xf0e2c0).box(.06,.32,.02,-.16,.04,.25,0xffffff);e.box(.46,.5,.46,0,0,0,D.c);rot=[.15,.5,0];break}
    default:return null}
  return rot}
function itemGroup(it,mat,emat){const k=new Bake(),e=new Bake(),rot=itemBake(it,k,e);if(!rot)return null;const g=new THREE.Group(),a=k.mesh(mat),b=e.mesh(emat);if(a)g.add(a);if(b)g.add(b);g.rotation.set(rot[0],rot[1],rot[2],rot[3]||'XYZ');g.userData.rot=rot;return g}
// material: emoji desenhado pequeno e ampliado sem suavizar (vira pixel art)
function emojiPix(ch){const c=document.createElement('canvas');c.width=c.height=20;const x=c.getContext('2d');x.font='16px sans-serif';x.textAlign='center';x.textBaseline='middle';x.fillText(ch,10,11);
  const o=document.createElement('canvas');o.width=o.height=80;const y=o.getContext('2d');y.imageSmoothingEnabled=false;y.drawImage(c,0,0,80,80);return o.toDataURL()}
function itemIcon(it){if(!it)return null;const key=icKey(it);if(ICR.cache.has(key))return ICR.cache.get(key);
  if(it.slot=='mat'){const u=emojiPix(it.ic||'🟫');ICR.cache.set(key,u);return u}
  if(ICR.budget<=0)return null;ICR.budget--;icInit();const s=ICR,g=itemGroup(it,s.mat,s.emat);if(!g){ICR.cache.set(key,null);return null}
  s.sc.add(g);g.updateMatrixWorld(true);const bb=new THREE.Box3().setFromObject(g),c=bb.getCenter(new V3()),r=Math.max(.3,bb.getSize(new V3()).length()*.5);g.position.sub(c);
  const d=r/Math.sin(s.cam.fov*PI/360)*.92;s.cam.position.set(0,r*.15,d);s.cam.lookAt(0,0,0);s.cam.near=d-r*2;s.cam.far=d+r*2;s.cam.updateProjectionMatrix();
  const pc=rd.getClearColor(s.cc).getHex(),pa=rd.getClearAlpha(),prt=rd.getRenderTarget();rd.setRenderTarget(s.rt);rd.setClearColor(0,0);rd.clear();rd.render(s.sc,s.cam);rd.readRenderTargetPixels(s.rt,0,0,s.N,s.N,s.px);rd.setRenderTarget(prt);rd.setClearColor(pc,pa);
  s.sc.remove(g);g.traverse(o=>{if(o.geometry)o.geometry.dispose()});
  const x=s.cv.getContext('2d'),im=x.createImageData(s.N,s.N),N=s.N;for(let y=0;y<N;y++)im.data.set(s.px.subarray((N-1-y)*N*4,(N-y)*N*4),y*N*4);x.putImageData(im,0,0);
  const u=s.cv.toDataURL();ICR.cache.set(key,u);return u}
ICR.budget=1e9;
const icTag=(it,fb)=>{const u=itemIcon(it);return u?`<img src="${u}" alt="">`:fb||it.ic||'❔'};

// ---------- inventário: painéis
const EQCOL=[['elmo','Cabeça','🪖'],['peito','Peito','🛡️'],['costas','Costas','🎒'],['luvas','Luvas','🧤'],['botas','Botas','🥾']],
  EQCOR=[['amuleto','Amuleto','📿','tl'],['anel','Anel','💍','tr'],['arma','Arma','⚔️','bl'],['mao2','Mão esq.','✋','br']];
const resN=()=>MANA()?['Mana','💧']:P.cls=='necromante'?['Almas','👻']:P.cls=='vampiro'?['Sangue','🩸']:['Fúria','🔥'];
const shortN=it=>it.slot=='pot'?(POT[it.pid]||{}).sh||'Poção':it.slot=='mat'?(MAT[it.mid]?MAT[it.mid].n:it.n).split(' ')[0]:it.slot=='costas'?'Mochila':(it.base||it.n||'').split(' ')[0];
const upOf=it=>it.slot!='mat'&&it.slot!='pot'&&it.slot!='costas'&&itemScore(it)>itemScore(EQ[it.slot]);
const lockOf=it=>it.slot!='mat'&&P.lv<(it.slot=='pot'?1:reqOf(it));
function ivCell(it,i){if(!it)return`<div class="is e" data-x="${i}"></div>`;return`<div class="is r${it.rar||0}${ISEL===i?' sel':''}${lockOf(it)?' lk':''}" data-i="${i}">${icTag(it,'<i>'+it.ic+'</i>')}${upOf(it)?'<s>▲</s>':''}${it.q>1?`<em>${it.q}</em>`:''}${lockOf(it)?'<u>🔒</u>':''}<b>${shortN(it)}</b></div>`}
function eqCell([s,n,ic,pos]){const it=EQ[s];return`<div class="es${pos?' '+pos:''}"><small>${n}</small>${it?`<div class="is r${it.rar||0}${ISEL===s?' sel':''}" data-e="${s}">${icTag(it,'<i>'+it.ic+'</i>')}</div>`:`<div class="is e g"><i>${ic}</i></div>`}</div>`}
function attrRows(){const s=ST,dm=Math.round((s.dmin+s.dmax)/2*(1+P.lv*.08)*(1+(s.dmg||0)/100)),R_=[['⚔️','Dano',dm,`${s.dmin}–${s.dmax} da arma${s.dmg?` · +${s.dmg}%`:''}`],['🛡️','Armadura',s.armor,s.sh?'escudo: +'+s.sh+'% bloqueio':''],['❤️','Vida',s.mx,s.regen?`+${s.regen}/s`:''],
  ['🎯','Crítico',(s.crit||0)+'%',`+${50+(s.critd||0)}% de dano`],['⚡','Vel. de ataque','+'+(s.ias||0)+'%',s.dual?'duas armas':s.two?'duas mãos':''],['👟','Movimento','+'+(s.ms||0)+'%','']];
  if(s.ls)R_.push(['🩸','Roubo de vida',s.ls+'%','']);if(s.mag)R_.push(['✨','Poder mágico','+'+s.mag+'%','']);if(s.cdr)R_.push(['⏳','Recarga','-'+s.cdr+'%','']);if(s.gold)R_.push(['🪙','Ouro extra','+'+s.gold+'%','']);
  return R_.map(r=>`<div class="ar"><i>${r[0]}</i><div><b>${r[1]}</b><small>${r[3]}</small></div><em>${r[2]}</em></div>`).join('')}
function gauge(ic,n,f,v){return`<div class="gg"><span class="gr" style="--p:${Math.round(cl(f,0,1)*100)}"><i>${ic}</i></span><div><b>${n}</b><small>${v}</small></div></div>`}
invRender=function(){if(UI.open!='inv')return;ICR.budget=12;bagFit();const cap=INV.length,used=invUsed();
  $('ivNm').textContent=nameTag();$('ivCl').textContent=(CLS[P.cls]?CLS[P.cls].n:'')+' · Nível '+P.lv;
  $('ivG').innerHTML=INV.map((it,i)=>ivCell(it,i)).join('');$('ivCap').textContent=used+'/'+cap;$('ivg').textContent='🪙 '+fmt(P.gold);
  $('eqW').innerHTML=EQCOR.map(eqCell).join('');$('ivEq').innerHTML='<div class="ivh"><b>Equipado</b></div>'+EQCOL.map(eqCell).join('');
  $('ivS').innerHTML=attrRows();$('ivPw').textContent='⭐ '+gearPower();const[rn,ri]=resN(),xp=P.xp/XPN(P.lv);
  $('ivSt').innerHTML=gauge('❤️','Vida',P.hp/ST.mx,Math.ceil(P.hp)+'/'+ST.mx)+gauge(ri,rn,P.fury/100,Math.floor(P.fury)+'/100')+gauge('⭐','Nível '+P.lv,xp,Math.floor(xp*100)+'%')+gauge('🎒','Carga',used/cap,used+'/'+cap)+gauge('🧪','Poções',Math.min(1,potCount()/8),potCount()+' de vida');
  const d=$('ivD'),it=typeof ISEL=='number'?INV[ISEL]:ISEL?EQ[ISEL]:null;d.classList.toggle('on',!!it);if(!it){d.innerHTML='';if(ICR.budget<=0)requestAnimationFrame(invRender);return}
  const eq=typeof ISEL=='string',cur=it.slot!='pot'&&it.slot!='mat'?EQ[it.slot]:null,diff=eq||!cur?0:itemScore(it)-itemScore(cur),sub=it.slot=='mat'?'Material':it.slot=='pot'?'Poção':SLN[it.slot]?SLN[it.slot][1]:'';
  let bt='';if(eq){if(it.slot!='costas')bt+='<button class="ib" data-a="un">Remover</button>'}
  else if(it.slot=='pot')bt+='<button class="ib" data-a="eq">Beber</button>';else if(it.slot!='mat'){bt+='<button class="ib" data-a="eq">Equipar</button>';if(it.slot=='arma'&&!isTwo(it))bt+='<button class="ib" data-a="eq2">Mão esquerda</button>';if(it.slot!='costas')bt+='<button class="ib off" data-a="salv">Desmanchar 💠</button>'}
  if(!eq)bt+=`<button class="ib off" data-a="sell">Vender ${it.price*(it.q||1)}🪙</button><button class="ib off" data-a="drop">Largar</button>`;
  d.innerHTML=`<button class="wx ivx">✕</button><div class="dI">${icTag(it,'<i>'+it.ic+'</i>')}</div><div class="tip r${it.rar||0}"><b style="color:${RAR[it.rar||0].c}">${it.n}${it.q>1?' ×'+it.q:''}</b><small>${RAR[it.rar||0].n} · ${sub}${it.slot!='mat'&&it.slot!='pot'?' · nível '+it.ilvl:''}</small>${it.slot=='mat'?`<div>${it.d||''}</div>`:itemLines(it).map(l=>`<div>${l}</div>`).join('')}${cur&&!eq?`<div class="cmp ${diff>=0?'up':'dn'}">${diff>=0?'▲ Melhor':'▼ Pior'} que ${cur.n}</div>`:''}</div><div class="ibt">${bt}</div>`;
  if(ICR.budget<=0)requestAnimationFrame(invRender)};
// organizar: equipamento por tipo e raridade, depois poções e materiais
function invSort(){const L=INV.filter(x=>x),ord={arma:0,mao2:1,elmo:2,peito:3,luvas:4,botas:5,anel:6,amuleto:7,costas:8,pot:9,mat:10};L.sort((a,b)=>(ord[a.slot]??11)-(ord[b.slot]??11)||(b.rar||0)-(a.rar||0)||(b.ilvl||0)-(a.ilvl||0)||String(a.pid||a.mid||'').localeCompare(String(b.pid||b.mid||'')));
  for(let i=0;i<INV.length;i++)INV[i]=L[i]||null;ISEL=null;invRender();snd(640,.05,'sine')}
// toques: tocar de novo no item selecionado faz a ação principal (equipar ou beber); largar devolve ao chão
$('inv').addEventListener('click',e=>{const x=e.target.closest('.ivx');if(x){e.stopImmediatePropagation();ISEL=null;invRender();return}
  if(e.target.closest('#ivSort')){e.stopImmediatePropagation();invSort();return}
  const b=e.target.closest('[data-a]');if(b){const a=b.dataset.a;if(a=='drop'&&typeof ISEL=='number'){e.stopImmediatePropagation();const it=INV[ISEL];if(it){INV[ISEL]=null;dropItem(P.x+S(P.f)*1.2,P.z+C(P.f)*1.2,it);snd(300,.08,'triangle')}ISEL=null;invRender();save()}return}
  const c=e.target.closest('[data-i]');if(c&&+c.dataset.i===ISEL){e.stopImmediatePropagation();const it=INV[ISEL];if(it&&it.slot!='mat'){equip(ISEL);ISEL=null;invRender()}}},true);
// abrir: o herói aparece ao vivo dentro do retrato (câmera centrada no quadro)
openInv=function(){if(!run||DLG)return;openWin('inv');document.body.classList.add('invo');$('bagb').classList.remove('nw');ISEL=null;invRender();
  requestAnimationFrame(()=>{const r=$('ivPor').getBoundingClientRect(),cx=(r.left+r.right)/2,cy=(r.top+r.bottom)/2+8,f=cam.fov*PI/180;INV_OPEN.off=.5-cx/innerWidth;INV_OPEN.oy=.5-cy/innerHeight;
    INV_OPEN.dd=cl(3.1*innerHeight/(.6*Math.max(120,r.height))/(2*Math.tan(f/2)),3.2,11)})};
// medidor de poções no botão 🧪
const _hudFast15=hudFast;hudFast=function(){_hudFast15();const n=potCount(),b=$('potb');if(b.dataset.n!=n){b.dataset.n=n;const c=b.querySelector('.pc');if(c)c.textContent=n;b.classList.toggle('none',!n)}};
