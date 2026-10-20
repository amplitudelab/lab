'use strict';
/* =============================================================================
   VOXEL REALMS · economia (15.3)
   Itens bons ficaram mais raros nos monstros e nos baús, e vender rende menos;
   em troca a Forja da Helga vende peças melhores (sempre mágicas ou raras, um
   nível acima) e as masmorras pagam bem: raro garantido, fragmentos arcanos,
   poções e mais ouro a cada vitória.
   ============================================================================= */
const _genItem15=genItem;genItem=function(){const it=_genItem15.apply(this,arguments);if(it&&it.price)it.price=Math.max(1,Math.round(it.price*.55));return it};
function rollRare(lv,b,minR){let it=genItem(lv,b);for(let i=0;i<20&&it.rar<minR;i++)it=genItem(lv,b+.6+i*.1);return it}
shopRoll=function(){SHOP=[];for(let i=0;i<8;i++){const it=rollRare(P.lv+2,1.4,i<2?2:1);if(it.rar==3){it.rar=2;it.n=pick(RARE_N);it.leg=null}it.price=Math.round([60,100,260,0][it.rar]*(1+it.ilvl*.15));SHOP.push(it)}};
// comprar devolve o preço de venda normal ao item (vender o que comprou não dá lucro)
const _buyItem15=buyItem;buyItem=function(j){const it=SHOP[j];if(!it)return _buyItem15(j);const p=it.price;_buyItem15(j);if(!SHOP.includes(it))it.price=Math.max(1,Math.round(p*.25))};
// masmorras: raro garantido, fragmentos, poções e ouro extra
const _dngWin15=dngWin;dngWin=function(D){_dngWin15(D);const x=D.at[0],z=D.at[1]-11;setTimeout(()=>{dropItem(x+2,z,rollRare(P.lv+1,2,2));for(let i=0;i<6+(R()*5|0);i++)dropMat(x+(R()-.5)*4,z+(R()-.5)*4,'fragmento');
  for(let i=0;i<2;i++)dropItem(x-2+i,z+1,potItem(P.lv>=14?'vida3':P.lv>=6?'vida2':'vida1'));dropGold(x,z+2,Math.round(80+P.lv*30));toast('🏆','Tesouro da masmorra','Raro garantido, fragmentos arcanos e poções.')},1400)};
