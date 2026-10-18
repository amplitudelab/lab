'use strict';
/* =============================================================================
   VOXEL REALMS · itens
   raridades (Comum, Mágico, Raro, Lendário), afixos aleatórios, poderes
   lendários, comparação com o equipado, inventário e loja da ferreira
   ============================================================================= */
const MAT={couro:{n:'Couro',ic:'🟫',p:4,d:'Couro curtido de animal. A ferreira paga bem.'},la:{n:'Lã de Ovelha',ic:'🧶',p:3,d:'Macia e quente.'},chifre:{n:'Chifre de Cervo',ic:'🦌',p:9,d:'Usado em arcos e amuletos.'},raposa:{n:'Pele de Raposa',ic:'🦊',p:8,d:'Pelagem laranja muito procurada.'},carne:{n:'Carne Crua',ic:'🥩',p:2,d:'Os aldeões compram para o ensopado.'},perna:{n:'Perna de Sapo',ic:'🐸',p:3,d:'Ingrediente de poções duvidosas.'},coelho:{n:'Pata de Coelho',ic:'🐇',p:5,d:'Dizem que dá sorte.'}};
const RAR=[{n:'Comum',c:'#e2ddd2',h:0xe2ddd2,h2:0xdfe8f0},{n:'Mágico',c:'#6aa0ff',h:0x6aa0ff,h2:0xb8d4ff},{n:'Raro',c:'#ffe14a',h:0xffe14a,h2:0xfff2b0},{n:'Lendário',c:'#ff8a1a',h:0xff8a1a,h2:0xffc890}];
const SLOTS=[['arma','Arma','⚔️'],['elmo','Elmo','🪖'],['peito','Peitoral','🛡️'],['luvas','Luvas','🧤'],['botas','Botas','🥾'],['anel','Anel','💍'],['amuleto','Amuleto','📿']];
const SLN={mat:['mat','Material','🟫']};SLOTS.forEach(s=>SLN[s[0]]=s);
const BASES={arma:[['Espada Longa','⚔️','sword'],['Machado de Guerra','🪓','axe'],['Maça Pesada','🔨','mace'],['Arco Curvo','🏹','bow'],['Cajado Arcano','🪄','staff'],['Varinha Rúnica','🪄','wand']],elmo:[['Elmo de Ferro','🪖','helm'],['Capuz do Caçador','🎩','hood']],peito:[['Couraça','🛡️'],['Cota de Malha','🥋']],luvas:[['Manoplas','🧤']],botas:[['Botas de Couro','🥾']],anel:[['Anel','💍']],amuleto:[['Amuleto','📿']]};
const AFX=[{k:'dmg',f:v=>`+${v}% de Dano`,r:[4,12],pre:'Feroz'},{k:'hp',f:v=>`+${v} de Vida`,r:[12,34],flat:1,suf:'do Urso'},{k:'arm',f:v=>`+${v} de Armadura`,r:[4,11],flat:1,suf:'da Rocha'},
  {k:'crit',f:v=>`+${v}% de Chance Crítica`,r:[2,6],pre:'Preciso'},{k:'critd',f:v=>`+${v}% de Dano Crítico`,r:[10,35],pre:'Cruel'},{k:'ias',f:v=>`+${v}% de Velocidade de Ataque`,r:[3,9],pre:'Veloz'},
  {k:'ms',f:v=>`+${v}% de Velocidade de Movimento`,r:[3,9],suf:'do Vento',slot:['botas','amuleto','anel']},{k:'regen',f:v=>`+${v} de Vida por segundo`,r:[1,3],flat:1,suf:'da Fênix'},
  {k:'gold',f:v=>`+${v}% de Ouro encontrado`,r:[10,30],suf:'do Mercador'},{k:'cdr',f:v=>`-${v}% de Recarga`,r:[3,8],pre:'Arcano'},{k:'fury',f:v=>`+${v} de Fúria por golpe`,r:[1,3],pre:'Furioso'},{k:'ls',f:v=>`${v}% de Roubo de Vida`,r:[1,3],suf:'do Vampiro',slot:['arma','anel','amuleto']},{k:'mag',f:v=>`+${v}% de Poder Mágico`,r:[6,16],pre:'Rúnico',slot:['arma','elmo','anel','amuleto','luvas']}];
const LEG=[{id:'crepusculo',n:'Lâmina do Crepúsculo',slot:'arma',b:0,d:'Golpes têm 20% de chance de liberar uma onda de chamas.'},{id:'perfura',n:'Arco do Vendaval',slot:'arma',b:3,d:'Flechas atravessam os inimigos.'},{id:'trovao',n:'Cajado das Tempestades',slot:'arma',b:4,d:'Acertos críticos podem invocar um raio no alvo.'},
  {id:'trovao',n:'Coração do Trovão',slot:'amuleto',d:'Acertos críticos podem invocar um raio no alvo.'},{id:'furia',n:'Manoplas do Berserker',slot:'luvas',d:'O Turbilhão custa 40% menos Fúria.'},
  {id:'sismo',n:'Passos do Gigante',slot:'botas',d:'Salto Sísmico recarrega 50% mais rápido.'},{id:'guardiao',n:'Elmo de Aldor',slot:'elmo',b:0,d:'O Grito de Guerra também reduz o dano recebido em 30%.'},
  {id:'meteoro',n:'Couraça Estelar',slot:'peito',d:'A cada 12 abates, um meteoro cai sobre os inimigos.'},{id:'vampiro',n:'Anel de Sangue',slot:'anel',d:'+4% de Roubo de Vida e cura ao matar.'}];
const RARE_N=['Rasga-Sombras','Juramento de Ferro','Presa Cinzenta','Vigia de Pedraverde','Brasa Antiga','Lamento do Lodo','Eco de Aldor','Fúria do Norte','Raiz Partida','Canção de Lírio','Guarda do Moinho','Olho do Corvo'];
let iid=1;
function genItem(ilvl,bonus,slot,forceLeg){bonus=bonus||0;const r=R();let rar=forceLeg||r<.004+bonus*.025?3:r<.04+bonus*.1?2:r<.24+bonus*.14?1:0;
  let leg=null;if(rar==3){leg=pick(slot?LEG.filter(l=>l.slot==slot):LEG)||pick(LEG);slot=leg.slot}
  slot=slot||pick(SLOTS)[0];const bl=BASES[slot],bi=leg&&leg.b!=null?leg.b:(R()*bl.length)|0,b=bl[bi];
  const it={id:iid++,slot,rar,ilvl,base:b[0],ic:b[1],wk:slot=='arma'?b[2]:null,vk:slot=='elmo'?b[2]:null,aff:{},leg:leg&&leg.id};
  const rm=[1,1.12,1.28,1.5][rar];
  if(slot=='arma'){const bow=it.wk=='bow',mg=it.wk=='staff'||it.wk=='wand',base=(6+ilvl*2.4)*rm*(bow?.85:mg?.9:it.wk=='mace'?1.12:it.wk=='axe'?1.06:1);it.wd=[Math.round(base*.8),Math.round(base*1.2)];it.spd=it.wk=='mace'?.92:it.wk=='axe'?.97:1;if(mg)it.aff.mag=Math.round((it.wk=='staff'?20:12)*(1+ilvl*.02))}
  else if(slot!='anel'&&slot!='amuleto')it.arm=Math.round((3+ilvl*1.1)*rm*({elmo:1,peito:1.6,luvas:.7,botas:.8}[slot]));
  const na=[0,1+(R()<.5?1:0),3+(R()<.4?1:0),4][rar],pool=AFX.filter(a=>!a.slot||a.slot.includes(slot));
  for(let i=0;i<na&&pool.length;i++){const a=pool.splice((R()*pool.length)|0,1)[0];const sc_=a.flat?1+ilvl*.09:1+ilvl*.015;it.aff[a.k]=Math.max(1,Math.round(lerp(a.r[0],a.r[1],R())*sc_*(rar>=2?1.15:1)))}
  const ks=Object.keys(it.aff),A=k=>AFX.find(a=>a.k==k);
  if(rar==3)it.n=leg.n;else if(rar==2)it.n=pick(RARE_N);else if(rar==1){const pre=ks.map(A).find(a=>a.pre),suf=ks.map(A).find(a=>a.suf);it.n=it.base+(pre?' '+pre.pre:'')+(suf?' '+suf.suf:'')}else it.n=it.base;
  it.price=Math.round([6,16,45,140][rar]*(1+ilvl*.12));return it}
function itemLines(it){const L=[];if(it.wd)L.push(`<b class="big">${it.wd[0]}–${it.wd[1]}</b> de Dano${it.spd&&it.spd!=1?` · ${it.spd<1?'lenta':'rápida'}`:''}`);if(it.arm)L.push(`<b class="big">${it.arm}</b> de Armadura`);
  for(const k in it.aff)L.push('<span class="af">'+AFX.find(a=>a.k==k).f(it.aff[k])+'</span>');if(it.leg)L.push('<span class="lg">'+LEG.find(l=>l.id==it.leg).d+'</span>');return L}
// pontuação simples para a seta verde/vermelha de comparação
function itemScore(it){if(!it)return 0;const a=it.aff;let s=(it.wd?(it.wd[0]+it.wd[1])*2:0)+(it.arm||0)*1.2+(a.hp||0)*.6+(a.dmg||0)*2.2+(a.crit||0)*3+(a.critd||0)*.8+(a.ias||0)*2+(a.ms||0)*1.5+(a.regen||0)*4+(a.cdr||0)*2+(a.fury||0)*4+(a.ls||0)*4+(a.arm||0)*1.2+(a.gold||0)*.3;return s+(it.leg?25:0)}
// ---------- inventário (30 espaços) e equipamento
const INV=new Array(30).fill(null),EQ={arma:null,elmo:null,peito:null,luvas:null,botas:null,anel:null,amuleto:null};
function dropMat(x,z,k){const M=MAT[k];dropItem(x,z,{id:iid++,slot:'mat',mid:k,rar:0,ilvl:1,n:M.n,ic:M.ic,price:M.p,d:M.d,q:1,aff:{}})}
function pickItem(it){if(it.slot=='mat'){const s=INV.find(o=>o&&o.mid==it.mid);if(s){s.q=(s.q||1)+1;pop('+1 '+it.n,P.x,P.y+3,P.z,'#e8dcc0');return true}}const i=INV.indexOf(null);if(i<0){pop('Inventário cheio!',P.x,P.y+3,P.z,'#ff8a5a');return false}INV[i]=it;pop(it.n,P.x,P.y+3.2,P.z,RAR[it.rar].c,it.rar>=2);
  if(it.rar>=2&&it.slot!='mat')toast(it.ic,`<span style="color:${RAR[it.rar].c}">${it.n}</span>`,RAR[it.rar].n+(itemScore(it)>itemScore(EQ[it.slot])?' · melhor que o seu ▲':''));snd(it.rar>=2?990:700,.08,'sine');
  if(it.slot!='mat'&&!EQ[it.slot]){equip(i,1)}$('bagb').classList.add('nw');return true}
function equip(i,quiet){const it=INV[i];if(!it)return;const old=EQ[it.slot];EQ[it.slot]=it;INV[i]=old||null;calcStats();if(!quiet){sweep(300,700,.15,'triangle',.05);flash(P.x,P.y+1.6,P.z,RAR[it.rar].h,2.4,.25)}hud();save()}
function unequip(slot){const it=EQ[slot];if(!it)return;const i=INV.indexOf(null);if(i<0){toast('🎒','Inventário cheio','');return}INV[i]=it;EQ[slot]=null;calcStats();hud();save()}
function sellItem(i){const it=INV[i];if(!it)return;P.gold+=it.price*(it.q||1);INV[i]=null;toast('🪙','Vendido: '+it.n,'+'+it.price+' ouro');snd(1200,.08,'sine');hud();save()}
// ---------- loja da Helga (renova a cada nível)
let SHOP=[];function shopRoll(){SHOP=[];for(let i=0;i<8;i++){const it=genItem(P.lv+1,.9,i<4?SLOTS[i%7][0]:null);if(it.rar==3){it.rar=2;it.n=pick(RARE_N);it.leg=null}it.price=Math.round(it.price*3.5);SHOP.push(it)}}
function buyItem(j){const it=SHOP[j];if(!it)return;if(P.gold<it.price){toast('🪙','Ouro insuficiente','Faltam '+(it.price-P.gold)+' moedas');return}const i=INV.indexOf(null);if(i<0){toast('🎒','Inventário cheio','');return}P.gold-=it.price;it.price=Math.round(it.price/3.5);INV[i]=it;SHOP.splice(j,1);snd(990,.1,'sine');toast(it.ic,'Comprado: '+it.n,'');hud();save()}
