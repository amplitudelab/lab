'use strict';
/* =============================================================================
   VOXEL REALMS · armaduras, elmos e acessórios (15.5)
   - 11 elmos novos (viseira, crista, nasal, dracônico, coroa de guerra, diadema,
     capuz sombrio, chapéu emplumado, elmo de caveira, tricorne, bandana) e os
     antigos redesenhados com aba, fivela, rebites, chifres curvos e plumas.
   - 7 peitorais novos (brigantina, escamas, tabardo, sobretudo, manto sombrio,
     túnica de batalha, couraça dracônica) com gola, placas, correias, faixas.
   - Ombreiras, punhos de luva, joelheiras e canos de bota por tipo, assados no
     próprio modelo do herói (sem peças soltas por cima).
   - Anéis e amuletos com formatos próprios; o amuleto aparece no peito.
   - Cada base tem armadura própria e um bônus fixo pequeno (pesadas protegem
     mais; leves dão Poder Mágico, crítico ou velocidade).
   ============================================================================= */
const mixC=(a,b,t)=>{const f=(s)=>Math.round(((a>>s)&255)*(1-t)+((b>>s)&255)*t);return(f(16)<<16)|(f(8)<<8)|f(0)};
// ---------- bases novas (no fim da lista: os lendários antigos continuam apontando para a mesma base)
BASES.elmo.push(['Elmo de Viseira','🪖','visor'],['Elmo de Crista','🪖','crest'],['Elmo Nasal','🪖','nasal'],['Elmo Dracônico','🪖','drakehelm'],['Coroa de Guerra','👑','crownk'],['Diadema Arcano','👑','circlet'],
  ['Capuz Sombrio','🎩','cowl'],['Chapéu Emplumado','🎩','feathercap'],['Elmo de Caveira','💀','skullhelm'],['Tricorne','🎩','tricorne'],['Bandana','🎩','bandana']);
BASES.peito.push(['Brigantina','🥋','brig'],['Armadura de Escamas','🛡️','scale'],['Cota com Tabardo','🛡️','tabard'],['Sobretudo de Caçador','🥋','coat'],['Manto Sombrio','🥋','mantle'],['Túnica de Batalha','🥋','battlerobe'],['Couraça Dracônica','🛡️','drakeplate']);
BASES.luvas.push(['Braçadeiras','🧤','bracer'],['Luvas de Seda','🧤','silk'],['Manoplas Cravejadas','🧤','spiked']);
BASES.botas.push(['Sapatos de Placa','🥾','sabatons'],['Botas de Cano Dobrado','🥾','cuffboot'],['Sandálias Arcanas','🥾','sandal'],['Botas Sombrias','🥾','shadowboot']);
BASES.anel=[['Anel','💍','band'],['Anel de Sinete','💍','signet'],['Anel Rúnico','💍','rune'],['Anel de Garra','💍','claw']];
BASES.amuleto=[['Amuleto','📿','medal'],['Colar de Presas','📿','fang'],['Pingente de Cristal','📿','crystal'],['Talismã Solar','📿','sun'],['Relicário de Caveira','📿','skull']];
Object.assign(CLS_GEAR.guerreiro,{visor:4,crest:3,nasal:3,drakehelm:1.5,crownk:1,brig:3,scale:4,tabard:4,drakeplate:1.5,spiked:3,sabatons:3,cuffboot:1.5,signet:2,medal:2,sun:1});
Object.assign(CLS_GEAR.mago,{circlet:5,feathercap:1,battlerobe:5,mantle:2,silk:5,sandal:4,rune:3,crystal:3,sun:2});
Object.assign(CLS_GEAR.cacador,{feathercap:4,bandana:4,tricorne:2,coat:5,brig:3,bracer:5,cuffboot:4,claw:2,fang:3});
Object.assign(CLS_GEAR.necromante,{skullhelm:5,cowl:5,mantle:4,battlerobe:2,silk:3,shadowboot:4,sandal:2,rune:3,skull:4});
Object.assign(CLS_GEAR.vampiro,{tricorne:4,cowl:4,crownk:1.5,mantle:5,coat:3,bracer:2,silk:2,shadowboot:5,cuffboot:2,signet:3,fang:3,skull:2});
// armadura por base e bônus fixo (cresce um pouco com o nível do item)
const ARMK={helm:1,greathelm:1.15,visor:1.12,crest:1.06,nasal:1,horn:1.05,drakehelm:1.2,crownk:.9,circlet:.55,wizard:.6,hood:.7,cowl:.72,ranger:.75,feathercap:.7,skullhelm:.95,bonecrown:.8,tricorne:.7,bandana:.55,
  plate:1.15,drakeplate:1.25,scale:1.1,tabard:1.05,chain:1,brig:.95,leather:.85,coat:.85,bones:.95,mantle:.8,robe:.7,battlerobe:.75,
  gaunt:1.15,spiked:1.2,bracer:.9,lglove:.85,silk:.6,greaves:1.15,sabatons:1.2,lboot:.85,cuffboot:.9,sandal:.6,shadowboot:.85};
const IMPL={circlet:{mag:8},wizard:{mag:6},battlerobe:{mag:10},robe:{mag:8},silk:{mag:5},sandal:{mag:4},skullhelm:{mag:5},mantle:{ls:1},cowl:{crit:2},bandana:{crit:2},feathercap:{crit:2},
  tricorne:{critd:6},coat:{ms:3},cuffboot:{ms:3},shadowboot:{ms:4},bracer:{ias:3},spiked:{dmg:3},drakeplate:{hp:20},drakehelm:{hp:10},crownk:{fury:2},tabard:{hp:10},scale:{arm:2},
  signet:{gold:6},rune:{cdr:3},claw:{crit:2},fang:{ls:1},crystal:{mag:6},sun:{regen:2},skull:{dmg:3}};
const _genItem155=genItem;genItem=function(){const it=_genItem155.apply(this,arguments);if(!it||!it.slot||it.slot=='arma'||it.slot=='mao2')return it;fixItem(it);const v=it.vk;
  if(it.arm&&ARMK[v])it.arm=Math.max(1,Math.round(it.arm*ARMK[v]));const im=IMPL[v];if(im)for(const k in im)it.aff[k]=(it.aff[k]||0)+Math.max(1,Math.round(im[k]*(AFX.find(a=>a.k==k)&&AFX.find(a=>a.k==k).flat?1+(it.ilvl||1)*.09:1+(it.ilvl||1)*.03)));return it};

// ---------- elmos
const HATS=new Set(['helm','hood','horn','wizard','ranger','greathelm','bonecrown','visor','crest','nasal','drakehelm','crownk','circlet','cowl','feathercap','skullhelm','tricorne','bandana']);
const _hatBake155=hatBake;
hatBake=function(k,o){const h=o.hat;if(!HATS.has(h))return _hatBake155(k,o);const c=o.hatC||0x9aa2ae,d=shade(c,.68),l=shade(c,1.22),a=o.gem||0xd9a948,pl=o.plume,b=(w,y,z,x,yy,zz,cc,r)=>k.box(w,y,z,x,yy,zz,cc,r),DK=0x141218,BN=0xd8d0c0;
  const dome=y0=>{b(.96,.36,.96,0,y0,0,c);b(.84,.14,.84,0,y0+.24,0,c);b(.6,.08,.6,0,y0+.34,0,l)};
  const plume=(y,z)=>{if(pl){b(.12,.4,.62,0,y,z,pl);b(.1,.22,.3,0,y-.1,z-.42,shade(pl,.78));b(.14,.08,.2,0,y-.24,z+.2,d)}};
  const horn=(s,col,back)=>{const P=back?[[.16,s*.42,.98,.05,0],[.14,s*.46,1.08,-.14,-.5],[.12,s*.47,1.16,-.34,-.8],[.1,s*.46,1.2,-.54,-1.1],[.07,s*.44,1.2,-.7,-1.4]]
    :[[.17,s*.52,.86,0,0],[.15,s*.66,.97,.02,-s*.5],[.13,s*.76,1.13,.06,-s*.25],[.11,s*.8,1.3,.1,0],[.08,s*.78,1.45,.14,s*.3]];
    P.forEach((q,i)=>b(q[0],.2,q[0],q[1],q[2],q[3],i>2?shade(col,.82):col,back?{rx:q[4]}:{rz:q[4]}))};
  switch(h){
    case 'helm':dome(.8);b(.99,.09,.99,0,.64,0,a);b(.1,.4,.07,0,.44,.46,d);b(.08,.1,.7,0,1.14,0,l);for(const s of[-1,1]){b(.09,.32,.42,s*.47,.44,.1,c);b(.06,.06,.04,s*.3,.64,.5,l);b(.04,.06,.06,s*.5,.64,.25,l)}plume(1.3,-.05);break;
    case 'greathelm':b(.98,.98,.98,0,.42,0,c);b(.86,.12,.86,0,.96,0,c);b(1,.1,1,0,.62,0,d);b(1.02,.08,1.02,0,-.05,0,a);b(.64,.07,.06,0,.5,.5,DK);b(.07,.34,.06,0,.3,.5,DK);
      for(let i=0;i<3;i++)for(const s of[-1,1])b(.04,.04,.03,s*(.2+i*.07),.26,.5,DK);for(const s of[-1,1])b(.06,.06,.04,s*.42,.62,.5,a);if(pl)plume(1.18,-.05);else b(.12,.26,.8,0,1.1,-.05,shade(c,1.2));break;
    case 'visor':dome(.82);b(.99,.08,.99,0,.66,0,a);b(.8,.4,.14,0,.44,.46,c);b(.56,.3,.14,0,.42,.58,c);b(.3,.2,.12,0,.42,.68,l);b(.5,.05,.03,0,.52,.665,DK);for(let i=0;i<3;i++)b(.04,.04,.03,-.12+i*.12,.34,.655,DK);
      for(const s of[-1,1]){b(.1,.36,.4,s*.47,.42,.12,c);b(.08,.08,.08,s*.5,.56,.22,a)}b(1,.14,1,0,.06,-.02,shade(c,.8));plume(1.3,-.05);break;
    case 'crest':{dome(.8);for(const s of[-1,1]){b(.3,.5,.08,s*.26,.36,.46,c);b(.1,.5,.42,s*.47,.4,.18,c)}b(.9,.13,.08,0,.66,.46,c);b(.1,.28,.08,0,.5,.47,c);b(.99,.06,.99,0,.6,0,a);
      const cr=pl||0xb82a2a;for(let i=0;i<8;i++){const an=(i/7-.5)*2.5;b(.13,.32,.22,0,1.02+C(an)*.28,S(an)*.62,i%2?shade(cr,.85):cr,{rx:an})}break}
    case 'nasal':b(.96,.3,.96,0,.78,0,c);b(.78,.2,.78,0,.98,0,c);b(.5,.14,.5,0,1.13,0,l);b(.22,.1,.22,0,1.23,0,l);b(.06,.3,.98,0,.78,0,a);b(.98,.3,.06,0,.78,0,a);b(.99,.08,.99,0,.64,0,a);b(.1,.42,.07,0,.44,.47,c);
      for(const s of[-1,1]){b(.24,.05,.05,s*.17,.6,.47,c);b(.05,.14,.05,s*.29,.53,.47,c);b(.06,.06,.04,s*.4,.64,.5,l)}plume(1.34,-.05);break;
    case 'horn':dome(.8);b(.99,.09,.99,0,.64,0,a);b(.1,.38,.07,0,.45,.46,d);for(const s of[-1,1])horn(s,0xeee0b0);plume(1.3,-.1);break;
    case 'drakehelm':dome(.8);b(.99,.08,.99,0,.64,0,shade(c,.7));b(.14,.42,.12,0,.6,.5,d,{rx:.2});b(.56,.06,.05,0,.52,.5,a);for(const s of[-1,1]){b(.1,.36,.44,s*.47,.42,.12,c);b(.04,.3,.42,s*.52,.86,-.1,d,{rx:-.4});horn(s,0x3a2a2a,1)}
      for(let i=0;i<4;i++)b(.08,.16-.02*i,.08,0,1.2-.03*i,.2-i*.2,shade(c,.55));break;
    case 'crownk':b(.92,.22,.92,0,.84,0,c);b(.94,.05,.94,0,.96,0,l);b(.8,.14,.8,0,.94,0,0x8a1a2a);for(const[x,z]of[[0,.44],[0,-.44],[.44,0],[-.44,0],[.44,.44],[-.44,.44],[.44,-.44],[-.44,-.44]])b(.12,z==.44&&x==0?.34:.24,.12,x,z==.44&&x==0?1.1:1.05,z,c);
      b(.14,.14,.06,0,.86,.47,0xc02040);for(const s of[-1,1])b(.08,.08,.05,s*.24,.84,.47,0x3a6ad8);break;
    case 'circlet':b(.86,.07,.86,0,.62,0,c);b(.18,.18,.05,0,.66,.44,c,{rz:.785});b(.1,.1,.06,0,.66,.46,a,{rz:.785});for(const s of[-1,1]){b(.06,.06,.04,s*.25,.62,.44,a);b(.04,.12,.18,s*.44,.68,.2,c,{rx:-.4})}break;
    case 'wizard':b(1.46,.08,1.46,0,.84,0,c);b(1.5,.04,.36,0,.81,.6,d);b(.92,.14,.92,0,.95,0,shade(c,.55));b(.22,.18,.05,0,.95,.47,a);b(.12,.1,.06,0,.95,.48,shade(c,.55));
      b(.86,.32,.86,0,1.17,0,c);b(.68,.3,.68,0,1.45,-.04,c);b(.5,.28,.5,0,1.7,-.12,c,{rx:-.12});b(.34,.26,.34,0,1.92,-.25,c,{rx:-.3});b(.22,.22,.22,0,2.06,-.42,l,{rx:-.6});b(.14,.16,.14,0,2.08,-.6,l,{rx:-1.1});
      b(.12,.12,.03,.16,1.42,.305,a,{rz:.785});b(.08,.08,.03,-.14,1.68,.15,a,{rz:.785});b(.1,.1,.08,0,2.04,-.7,a,{rz:.785});break;
    case 'ranger':b(1.36,.07,1.3,0,.82,0,c);for(const s of[-1,1])b(.08,.18,1.1,s*.66,.88,0,c,{rz:-s*.5});b(.86,.34,.86,0,1.02,0,c);b(.6,.06,.5,0,1.2,0,d);b(.88,.09,.88,0,.9,0,shade(c,.55));
      b(.06,.6,.14,.4,1.14,-.1,pl||0xc0302a,{rz:-.35});b(.04,.32,.1,.48,1.36,-.12,0xf0e0c0,{rz:-.35});break;
    case 'feathercap':b(.86,.32,.9,0,.92,-.02,c);b(.7,.14,.6,0,1.12,-.06,c);b(.6,.08,.3,0,.8,.5,c,{rx:-.25});b(.3,.08,.2,0,.84,.68,c,{rx:-.35});b(.92,.24,.1,0,.88,-.48,shade(c,.85),{rx:-.3});b(.9,.07,.94,0,.8,-.02,shade(c,.6));
      b(.05,.12,.8,.44,1.0,-.25,pl||0xd04030,{rx:.35});b(.03,.08,.5,.46,1.1,-.55,0xf4e8c8,{rx:.5});break;
    case 'hood':b(.94,.5,.94,0,.8,-.02,c);b(.5,.3,.3,0,1.0,-.38,c,{rx:.5});b(.26,.2,.24,0,1.06,-.6,c,{rx:.9});for(const s of[-1,1]){b(.2,.72,.72,s*.45,.4,-.05,c);b(.05,.64,.06,s*.36,.5,.33,d)}b(.94,.82,.2,0,.4,-.43,c);b(.96,.08,.1,0,1.0,.4,d);
      if(o.mask)b(.8,.3,.06,0,.2,.41,o.mask);break;
    case 'cowl':b(1.02,.5,1.02,0,.82,0,c);b(1.02,.14,.24,0,.98,.44,c);b(.8,.1,.06,0,.86,.4,DK);for(const s of[-1,1]){b(.24,.84,.84,s*.48,.38,0,c);b(.04,.8,.06,s*.37,.4,.42,a)}b(1.02,.95,.24,0,.38,-.47,c);
      b(.5,.36,.3,0,.98,-.52,c,{rx:.7});b(.3,.26,.26,0,.86,-.74,c,{rx:1.1});if(o.mask)b(.8,.3,.06,0,.2,.41,o.mask);break;
    case 'skullhelm':b(.96,.42,.96,0,.82,-.02,BN);b(.8,.14,.8,0,1.06,-.02,0xe0d8c8);b(.84,.34,.12,0,.86,.44,0xe8e0cc);for(const s of[-1,1]){b(.2,.14,.04,s*.18,.9,.505,0x1a1418);b(.08,.06,.03,s*.18,.9,.52,a);b(.1,.3,.1,s*.4,1.1,-.1,0x8a7a6a,{rz:s*.5,rx:-.3})}
      b(.08,.08,.04,0,.78,.505,0x1a1418);for(let i=0;i<5;i++)b(.06,.08,.04,-.16+i*.08,.68,.5,0xf4ecd8);break;
    case 'bonecrown':b(.9,.16,.9,0,.82,0,BN);for(let i=0;i<5;i++)b(.1,.34-Math.abs(i-2)*.05,.1,(i-2)*.2,1.04,.4-Math.abs(i-2)*.04,0xe8e0cc,{rz:(i-2)*.15});for(const s of[-1,1]){b(.1,.28,.1,s*.44,1.0,0,0xe8e0cc,{rz:s*.3});b(.1,.24,.1,s*.44,.98,-.32,0xe8e0cc,{rz:s*.3});b(.1,.26,.1,s*.2,1.0,-.44,0xe8e0cc)}
      b(.18,.16,.08,0,.86,.48,0xe8e0cc);for(const s of[-1,1])b(.04,.04,.02,s*.04,.88,.52,0x1a1418);b(.08,.08,.04,0,1.24,.42,a);break;
    case 'tricorne':b(.8,.3,.8,0,.98,0,c);b(1.04,.06,1.04,0,.84,0,c);b(.98,.24,.06,0,.94,-.48,c);b(1.2,.24,.06,-.245,.94,.07,c,{ry:-1.15});b(1.2,.24,.06,.245,.94,.07,c,{ry:1.15});
      b(1,.04,.08,0,1.06,-.48,a);b(1.22,.04,.08,-.245,1.06,.07,a,{ry:-1.15});b(1.22,.04,.08,.245,1.06,.07,a,{ry:1.15});b(.12,.12,.05,.32,.98,.26,pl||shade(c,.5));if(pl)b(.06,.4,.12,.36,1.2,.22,pl,{rz:-.4});break;
    case 'bandana':b(.84,.22,.84,0,.68,0,c);b(.82,.18,.82,0,.84,-.02,c);b(.6,.08,.6,0,.95,-.04,shade(c,.9));for(let i=0;i<4;i++)b(.06,.06,.02,-.27+i*.18,.7,.43,l);b(.18,.16,.12,0,.66,-.46,d);
      b(.1,.34,.04,-.08,.48,-.5,c,{rz:.25});b(.1,.3,.04,.1,.5,-.5,c,{rz:-.3});break}};
const hatCol=(v,t)=>v=='hood'||v=='cowl'||v=='wizard'||v=='bandana'?t.clo:v=='ranger'||v=='feathercap'||v=='tricorne'?t.lea:v=='circlet'?t.acc:v=='crownk'?mixC(t.met,0xe8b830,.6):v=='bonecrown'||v=='skullhelm'?0xd8d0c0:v=='drakehelm'?mixC(t.met,0x7a1a22,.55):t.met;

// ---------- peitorais (detalhes por cima do tronco base)
const ARMV={plate:'plate',drakeplate:'drake',scale:'round',tabard:'round',chain:'round',leather:'pad',brig:'pad',coat:'pad',robe:'cloth',battlerobe:'cloth',mantle:'cloth',bones:'bone'};
function chestLook(o,v,t,a){for(const q of['vest','plate','chainC','robe','bones','emblem','tab','stud','coat','scaleC','sash','lin'])delete o[q];o.av=v;o.avA=a;o.shoulders=0;let pc=t.lea;
  switch(v){case 'plate':o.plate=t.met;o.emblem=a;pc=t.met;break;
    case 'drakeplate':{const c=mixC(t.met,0x7a1a22,.55);o.plate=c;o.shirt=shade(c,.6);pc=c;break}
    case 'scale':o.shirt=shade(t.met,.55);o.scaleC=t.met;pc=t.met;break;
    case 'chain':o.chainC=shade(t.met,.9);o.shirt=shade(t.met,.8);break;
    case 'tabard':o.chainC=shade(t.met,.9);o.shirt=shade(t.met,.8);o.tab=t.clo;pc=t.met;break;
    case 'leather':o.vest=t.lea;o.belt=shade(t.lea,.7);break;
    case 'brig':o.vest=shade(t.lea,1.1);o.stud=t.met;o.belt=shade(t.lea,.7);break;
    case 'coat':o.vest=t.lea;o.coat=shade(t.lea,1.05);o.shirt=0xd8ccb4;break;
    case 'robe':o.robe=t.clo;o.shirt=t.clo;o.trim=a;o.sash=shade(t.clo,.6);pc=t.clo;break;
    case 'battlerobe':o.robe=t.clo;o.shirt=shade(t.clo,1.1);o.trim=a;o.sash=0x3a2414;pc=t.clo;break;
    case 'mantle':o.robe=shade(t.clo,.6);o.shirt=shade(t.clo,.5);o.trim=a;o.lin=0x8a1020;pc=shade(t.clo,.6);break;
    case 'bones':o.bones=0xd8d0c0;o.shirt=shade(t.clo,.6);pc=0xe0d8c4;break}
  o.pv=ARMV[v]||'pad';o.pc=pc}
function armorBake(k,o,B){const v=o.av,a=o.avA||0xd9a948,F=.25*B,b=(w,h,d,x,y,z,c,r)=>k.box(w,h,d,x,y,z,c,r),GD=0xe8c060;
  switch(v){
    case 'plate':case 'drakeplate':{const c=o.plate;b(.62*B,.14,.54*B,0,.98,0,shade(c,.82));b(.06,.4,.04,0,.66,F+.08,shade(c,1.3));for(let i=0;i<3;i++)b((.92-.05*i)*B,.07,.05,0,.22-i*.085,F+.03,shade(c,.9-.08*i));
      for(const s of[-1,1]){b(.05,.05,.03,s*.2,.8,F+.08,a);b(.05,.05,.03,s*.2,.48,F+.08,a)}
      if(v=='drakeplate'){for(let i=0;i<4;i++)b(.1,.22,.1,0,.32+i*.18,-F-.06,shade(c,.5),{rx:-.6});b(.22,.22,.04,0,.64,F+.1,a,{rz:.785});b(.05,.17,.05,0,.64,F+.12,0x141010);
        for(let i=0;i<2;i++)for(let j=-2;j<=2;j++)b(.13,.09,.04,j*.15+(i?.07:0),.38-i*.08,F+.06,j%2?shade(c,.75):shade(c,.6))}break}
    case 'scale':{const c=o.scaleC;for(let i=0;i<6;i++)for(let j=-3;j<=3;j++){const x=(j+(i%2?.5:0))*.13;if(Math.abs(x)>.42)continue;b(.14,.13,.05,x,.3+i*.11,F+.02,(i+j)%2?c:shade(c,.82),{rx:-.2})}
      b(.6*B,.12,.54*B,0,.98,0,shade(c,.8));b(.94*B,.09,.56*B,0,.16,0,0x3a2414);b(.12,.11,.04,0,.16,F+.05,GD);break}
    case 'chain':b(.66*B,.16,.58*B,0,.98,0,o.chainC);b(.06,.5,.03,0,.5,F+.02,shade(o.chainC,.7));b(.94*B,.08,.56*B,0,.14,0,0x4a2a1a);b(.1,.1,.04,0,.14,F+.05,GD);break;
    case 'tabard':{const t=o.tab;b(.66*B,.16,.58*B,0,.98,0,o.chainC);for(const z of[F+.04,-F-.04])b(.5*B,1.06,.04,0,.38,z,t);for(const s of[-1,1])b(.04,1.06,.05,s*.25*B,.38,F+.045,a);b(.52*B,.05,.05,0,-.15,F+.045,a);
      b(.2,.2,.04,0,.62,F+.07,a,{rz:.785});b(.1,.1,.05,0,.62,F+.08,shade(t,.6),{rz:.785});b(.94*B,.09,.56*B,0,.14,0,0x4a2a1a);b(.12,.11,.04,0,.14,F+.07,GD);break}
    case 'leather':{const c=o.vest;b(.09,1,.03,0,.5,F+.04,shade(c,.55),{rz:.62});b(.1,.1,.04,-.06,.55,F+.06,GD);b(.18,.2,.12,-.38*B,.14,F-.02,shade(c,.8));b(.19,.07,.13,-.38*B,.24,F-.02,shade(c,.6));b(.6*B,.1,.54*B,0,.97,0,shade(c,.85));
      for(let i=0;i<4;i++)b(.03,.03,.02,.16,.78-i*.12,F+.02,shade(c,.55));break}
    case 'brig':{const c=o.vest;for(const s of[-1,1]){b(.3,.24,.04,s*.2,.7,F+.04,o.stud);for(const y of[.62,.78])b(.04,.04,.03,s*.2+s*.1,y,F+.07,shade(o.stud,1.3))}
      for(let i=0;i<2;i++)for(let j=-2;j<=2;j++)b(.05,.05,.03,j*.17,.3+i*.15,F+.04,o.stud);b(.6*B,.1,.54*B,0,.97,0,shade(c,.8));break}
    case 'coat':{const c=o.coat;for(const s of[-1,1]){b(.18,.36,.06,s*.17,.78,F+.04,shade(c,.7),{rz:s*.35});b(.26,.8,.05,s*.33*B,-.26,F+.01,c)}b(.92*B,.85,.06,0,-.28,-F-.02,c);
      for(let i=0;i<3;i++)b(.06,.06,.04,.12,.7-i*.16,F+.04,GD);b(.9*B,.24,.1,0,1.02,-F+.04,shade(c,.85));b(.94*B,.09,.56*B,0,.18,0,shade(c,.55));b(.1,.1,.04,0,.18,F+.05,GD);break}
    case 'robe':case 'battlerobe':case 'mantle':{const c=o.robe,sh=o.sash||shade(c,.6);b(.08,.92,.03,0,.48,F+.02,a);b(.7*B,.14,.56*B,0,.98,0,v=='mantle'?c:a);b(.94*B,.12,.56*B,0,.14,0,sh);b(.1,.42,.04,.18,-.12,F+.03,sh,{rz:-.1});b(.1,.36,.04,.28,-.1,F+.03,sh,{rz:.12});
      if(v=='robe')for(let i=0;i<3;i++)b(.06,.06,.04,0,.75-i*.2,F+.04,GD);
      if(v=='battlerobe'){b(.12,1.02,.04,0,.48,F+.04,a,{rz:-.6});for(const s of[-1,1])b(.1,.1,.03,s*.24,.76,F+.03,a)}
      if(v=='mantle'){for(const s of[-1,1]){b(.14,.55,.52,s*.44*B,1.1,-.06,c,{rz:s*.32});b(.03,.48,.46,s*.38*B,1.08,-.06,o.lin,{rz:s*.32});b(.08,.08,.04,s*.17,.86,F+.04,0xc02040)}
        b(.92*B,.55,.1,0,1.12,-F-.02,c);b(.8*B,.48,.03,0,1.1,-F+.04,o.lin);b(.34,.04,.03,0,.86,F+.03,a);b(.22,.4,.03,0,.72,F+.015,shade(c,.5))}break}
    case 'bones':b(.1,.72,.04,0,.5,F+.04,0xe8e0cc);b(.1,.8,.06,0,.5,-F-.04,0xd8d0c0);b(.16,.14,.06,0,.14,F+.05,0xe8e0cc);for(const s of[-1,1])b(.04,.04,.02,s*.04,.16,F+.085,0x1a1418);break}
  if(o.mantleC){b(1.0*B,.18,.62*B,0,.92,0,o.mantleC);b(.7*B,.24,.05,0,.82,F+.06,o.mantleC);b(.4*B,.16,.05,0,.66,F+.06,o.mantleC)}
  if(o.amu)amuBake(k,o.amu,o.plate||v=='scale'||v=='tabard'?F+.11:F+.06)}
function amuBake(k,A,z){const g=A.g,j=A.j,b=(w,h,d,x,y,zz,c,r)=>k.box(w,h,d,x,y,zz,c,r);b(.03,.3,.03,-.1,.82,z-.01,g,{rz:-.55});b(.03,.3,.03,.1,.82,z-.01,g,{rz:.55});
  switch(A.v){case 'fang':for(let i=0;i<3;i++)b(.05,.14,.04,(i-1)*.07,.64,z,0xf4ecd8,{rz:(i-1)*.3});b(.06,.06,.05,0,.74,z,j);break;
    case 'crystal':b(.13,.13,.06,0,.65,z,j,{rz:.785});b(.06,.06,.04,0,.76,z,g);break;
    case 'sun':b(.16,.16,.04,0,.66,z,g);b(.04,.3,.03,0,.66,z,g);b(.3,.04,.03,0,.66,z,g);b(.24,.04,.03,0,.66,z,g,{rz:.785});b(.24,.04,.03,0,.66,z,g,{rz:-.785});b(.08,.08,.05,0,.66,z+.01,j);break;
    case 'skull':b(.14,.12,.06,0,.67,z,0xe8e0cc);b(.1,.05,.06,0,.6,z,0xd8d0c0);for(const s of[-1,1])b(.035,.035,.02,s*.035,.68,z+.035,j);break;
    default:b(.16,.16,.04,0,.66,z,g);b(.08,.08,.05,0,.66,z+.01,j)}}
const _torso155=torsoBake;torsoBake=function(k,o,B){_torso155(k,o,B);if(o.av||o.amu||o.mantleC)armorBake(k,o,B)};
// ---------- ombreiras, punhos e botas (assados nas juntas do modelo)
function paulBake(k,v,c,a,sx,B,X,Y,Z){const b=(w,h,d,x,y,z,cc,r)=>k.box(w,h,d,x+X,y+Y,z+Z,cc,r);
  if(v=='plate'||v=='drake'){b(.5*B,.2,.52*B,0,.1,0,c);b(.54*B,.05,.56*B,0,0,0,a);b(.52*B,.08,.54*B,0,-.08,0,shade(c,.86));b(.48*B,.08,.5*B,0,-.17,0,shade(c,.74));b(.06,.06,.06,sx*.26*B,.06,0,a);b(.06,.08,.5*B,sx*.04,.22,0,shade(c,1.2));
    if(v=='drake'){b(.08,.26,.08,sx*.12,.32,-.06,shade(c,.5),{rz:-sx*.45});b(.07,.2,.07,sx*.2,.26,.12,shade(c,.5),{rz:-sx*.6})}}
  else if(v=='round'){b(.46*B,.16,.48*B,0,.08,0,c);b(.48*B,.07,.5*B,0,-.04,0,shade(c,.8));b(.05,.05,.05,sx*.24*B,.08,0,a)}
  else if(v=='cloth'){b(.48*B,.1,.52*B,0,.1,0,c);b(.5*B,.04,.54*B,0,.04,0,a)}
  else if(v=='bone'){b(.4*B,.24,.42*B,0,.1,0,0xe0d8c4);b(.08,.3,.08,sx*.1,.32,0,0xe8e0cc,{rz:-sx*.35});for(const z of[.08,-.08])b(.03,.07,.07,sx*.205*B,.12,z,0x1a1418)}
  else{b(.44*B,.12,.46*B,0,.08,0,c);b(.46*B,.04,.12,0,.02,0,shade(c,.55));b(.05,.05,.05,sx*.23*B,.06,0,0xe8c060)}}
function gloveBake(k,v,c,a,sx,B,X,Y,Z){const b=(w,h,d,x,y,z,cc,r)=>k.box(w,h,d,x+X,y+Y,z+Z,cc,r);
  if(v=='gaunt'||v=='spiked'){b(.38*B,.16,.38*B,0,-.22,0,c);b(.4*B,.04,.4*B,0,-.14,0,a);b(.2,.14,.12,0,0,-.16*B,c);if(v=='spiked')for(let i=0;i<2;i++)b(.16,.05,.05,sx*.24*B,-.2-i*.09,0,0xd8dce0)}
  else if(v=='bracer'){b(.33*B,.3,.33*B,0,-.26,0,c);for(const y of[-.17,-.34])b(.35*B,.04,.35*B,0,y,0,shade(c,.55));b(.06,.06,.04,0,-.26,.17*B,0xe8c060)}
  else if(v=='silk'){b(.32*B,.07,.32*B,0,-.3,0,a);b(.07,.07,.04,0,-.3,.165*B,0x9ae8ff)}
  else b(.33*B,.1,.33*B,0,-.28,0,shade(c,1.15))}
function bootBake(k,v,c,a,B,X,Y,Z){const b=(w,h,d,x,y,z,cc,r)=>k.box(w,h,d,x+X,y+Y,z+Z,cc,r);
  if(v=='greaves'||v=='sabatons'){b(.32*B,.16,.14,0,-.02,.17*B,c);b(.34*B,.03,.15,0,-.1,.18*B,a);b(.3*B,.28,.06,0,-.24,.2*B,shade(c,1.1));if(v=='sabatons'){b(.37*B,.07,.18,0,-.43,.26,c);b(.35*B,.07,.16,0,-.49,.34,shade(c,.9))}}
  else if(v=='cuffboot'){b(.42*B,.14,.44*B,0,-.24,0,shade(c,1.25));b(.4*B,.05,.42*B,0,-.42,.06,shade(c,.5));b(.1,.07,.04,0,-.42,.28,0xe8c060)}
  else if(v=='sandal'){for(let i=0;i<3;i++)b(.34*B,.035,.4*B,0,-.08-i*.1,0,c,{rz:i%2?.18:-.18});b(.38*B,.06,.44*B,0,-.36,.04,shade(c,.7))}
  else if(v=='shadowboot'){b(.22,.1,.22,0,-.5,.36,c,{ry:.785});b(.08,.08,.1,0,-.45,.47,c,{rx:-.6});b(.06,.06,.14,0,-.42,-.25,a);b(.4*B,.16,.42*B,0,-.26,0,shade(c,.7));for(const s of[-1,1])b(.06,.14,.06,s*.15,-.16,-.18,shade(c,.5),{rx:.5})}
  else for(let i=0;i<3;i++)b(.16,.03,.03,0,-.37-i*.04,.31,shade(c,1.5))}
// ---------- aparência do herói
const _gearLook155=gearLook;gearLook=function(o){_gearLook155(o);const H=EQ.elmo,Bd=EQ.peito,G=EQ.luvas,Ft=EQ.botas,Am=EQ.amuleto,T=it=>TIERS[it.tier!=null?it.tier:tierOf(it)],acc=it=>it.rar>=3?0xffb040:it.rar==2?0xffe14a:T(it).acc;
  if(H){const t=T(H),v=H.vk||'helm';o.hat=HATS.has(v)?v:'helm';o.hatC=hatCol(v,t);if(v=='hood'||v=='cowl'){o.mask=null;o.mantleC=o.hatC}}
  if(Bd){chestLook(o,Bd.vk||'plate',T(Bd),acc(Bd));o.xS=(k,sx,B)=>paulBake(k,o.pv,o.pc,o.avA,sx,B,0,0,0)}
  if(G){const t=T(G),v=G.vk||'lglove';o.gloves=v=='gaunt'||v=='spiked'?t.met:v=='silk'?t.clo:t.lea;o.xE=(k,sx,B)=>gloveBake(k,v,o.gloves,acc(G),sx,B,0,0,0)}
  if(Ft){const t=T(Ft),v=Ft.vk||'lboot';o.boots=v=='greaves'||v=='sabatons'?t.met:v=='sandal'?t.clo:v=='shadowboot'?shade(t.lea,.6):t.lea;o.xK=(k,sx,B)=>bootBake(k,v,o.boots,acc(Ft),B,0,0,0)}
  if(Am)o.amu={v:Am.vk||'medal',g:T(Am).acc,j:Am.rar>=1?RAR[Am.rar].h:0xc0f0ff};
  return o};
// o amuleto não entra na assinatura antiga do equipamento: força a reconstrução quando ele muda
const _equip155=equip;equip=function(i){const it=INV[i];const r=_equip155.apply(this,arguments);if(it&&it.slot=='amuleto'&&EQ.amuleto===it){GEARSIG='';gearModel()}return r};
if(typeof unequip=='function'){const _uneq155=unequip;unequip=function(s){const r=_uneq155.apply(this,arguments);if(s=='amuleto'){GEARSIG='';gearModel()}return r}}
// ---------- ícones
const _itemBake155=itemBake;itemBake=function(it,k,e){const s=it.slot;if(!/elmo|peito|luvas|botas|anel|amuleto/.test(s))return _itemBake155(it,k,e);
  const t=TIERS[it.tier!=null?it.tier:tierOf(it)]||TIERS[0],acc=it.rar>=3?0xffb040:it.rar==2?0xffe14a:t.acc,v=it.vk;
  switch(s){
    case 'elmo':{const h=HATS.has(v)?v:'helm';k.box(.7,.6,.7,0,.4,0,0x2a2228);hatBake(k,{hat:h,hatC:hatCol(h,t),plume:it.rar>=2?acc:null,gem:acc});return[.25,.6,0]}
    case 'peito':{const o={shirt:0x6d7684},w=v||'plate';chestLook(o,w,t,acc);if(o.robe)k.box(1.02,.7,.68,0,-.3,0,o.robe).box(1.04,.08,.7,0,-.62,0,acc);torsoBake(k,o,1);for(const sx of[-1,1])paulBake(k,o.pv,o.pc,acc,sx,1,sx*.6,.86,0);return[.1,.5,0]}
    case 'luvas':{const w=v||'lglove',c=w=='gaunt'||w=='spiked'?t.met:w=='silk'?t.clo:t.lea;for(const sx of[-1,1]){const x=sx*.26;k.box(.3,.42,.3,x,.14,0,shade(c,.85)).box(.28,.26,.3,x,-.18,0,c).box(.1,.14,.1,x-sx*.17,-.14,.08,c);gloveBake(k,w,c,acc,sx,1,x,.36,0)}return[.3,.35,0]}
    case 'botas':{const w=v||'lboot',c=w=='greaves'||w=='sabatons'?t.met:w=='sandal'?t.clo:w=='shadowboot'?shade(t.lea,.6):t.lea;for(const sx of[-1,1]){const x=sx*.25;k.box(.32,.42,.34,x,.24,0,c).box(.34,.2,.5,x,-.08,.06,c).box(.36,.06,.52,x,-.19,.06,shade(c,.5));bootBake(k,w,c,acc,1,x,.37,0)}return[.25,.65,0]}
    case 'anel':{const g=t.acc,j=it.rar>=1?RAR[it.rar].h:0xc0f0ff;k.box(.5,.1,.12,0,.25,0,g).box(.5,.1,.12,0,-.25,0,g).box(.1,.5,.12,-.25,0,0,g).box(.1,.5,.12,.25,0,0,g);
      if(v=='signet'){k.box(.36,.12,.3,0,.34,0,g).box(.26,.04,.22,0,.41,0,shade(g,.7));e.box(.12,.03,.1,0,.43,0,j)}
      else if(v=='rune'){k.box(.24,.18,.18,0,.34,0,g);for(const[x,y]of[[-.25,.1],[.25,-.1],[0,-.25]])e.box(.06,.12,.13,x,y,.01,j);e.box(.16,.16,.16,0,.44,0,j)}
      else if(v=='claw'){k.box(.2,.14,.2,0,.32,0,g);for(const x of[-1,1])k.box(.04,.18,.04,x*.1,.44,.06,g,{rz:-x*.3});e.box(.16,.16,.16,0,.46,0,j)}
      else{k.box(.26,.2,.2,0,.34,0,g);e.box(.2,.16,.16,0,.44,.02,j)}return[.3,.3,0]}
    case 'amuleto':{const g=t.acc,j=it.rar>=1?RAR[it.rar].h:0xc0f0ff;for(let i=0;i<7;i++){const an=-1.2+i*.4;k.box(.07,.07,.07,S(an)*.48,.5-Math.abs(S(an))*.3,0,g)}
      if(v=='fang'){for(let i=0;i<3;i++)k.box(.1,.32,.08,(i-1)*.15,-.08,0,0xf4ecd8,{rz:(i-1)*.3});e.box(.12,.12,.1,0,.14,0,j)}
      else if(v=='crystal'){e.box(.3,.3,.14,0,-.1,0,j,{rz:.785});k.box(.12,.1,.1,0,.16,0,g)}
      else if(v=='sun'){k.box(.36,.36,.08,0,-.1,0,g).box(.08,.62,.06,0,-.1,0,g).box(.62,.08,.06,0,-.1,0,g).box(.5,.08,.06,0,-.1,0,g,{rz:.785}).box(.5,.08,.06,0,-.1,0,g,{rz:-.785});e.box(.18,.18,.1,0,-.1,.02,j)}
      else if(v=='skull'){k.box(.34,.3,.14,0,-.06,0,0xe8e0cc).box(.24,.12,.14,0,-.24,0,0xd8d0c0);for(const x of[-1,1])e.box(.08,.08,.04,x*.08,-.04,.06,j)}
      else{k.box(.4,.48,.12,0,-.12,0,g).box(.3,.38,.13,0,-.12,0,shade(g,.7));e.box(.18,.22,.14,0,-.12,.02,j)}return[.1,.2,0]}}};
