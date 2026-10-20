'use strict';
/* =============================================================================
   VOXEL REALMS · arsenal (estética das referências: lâminas coloridas, guardas
   ornamentadas, gemas e bordas que brilham). Cada arma tem o modelo em k (luz
   normal) e as partes que brilham em e (gemas, núcleos, runas).
   Lâmina/haste ao longo de +y, empunhadura na origem.
   ============================================================================= */
const GLD=0xd9a948,GLD2=0xf0c860,STL=0xd8dee6,STL2=0xf4f8fc,LTH=0x5b3822,LTH2=0x3a2414;
function grip(k,len,col,wrap){k.box(.1,len,.1,0,len/2-.18,0,col||LTH);for(let i=0;i<3;i++)k.box(.12,.04,.12,0,-.12+i*len/3.2,0,wrap||LTH2)}
// arco: segmentos ao longo de uma curva (barriga para a frente, pontas para trás), corda reta
function arcLimbs(k,L,D,th,col,seg,tipCol,e,glow){for(let i=-seg;i<=seg;i++){if(!i)continue;const t=i/seg,y=t*L,z=D*(1-t*t)-(Math.abs(t)>.82?(Math.abs(t)-.82)*.5:0),rx=Math.atan2(-2*D*t+(Math.abs(t)>.82?-Math.sign(t)*.5:0),L)*1;
    const w=th*(1-Math.abs(t)*.45);k.box(w,L/seg*1.12,w*1.1,0,y,z,Math.abs(t)>.86&&tipCol?tipCol:col,{rx});if(e&&glow&&Math.abs(t)<.8&&i%2==0)e.box(w*.45,L/seg*.9,w*.5,0,y,z+w*.5,glow,{rx})}
  k.box(.022,2*L*.97,.022,0,0,-.03,0xf5eed0)}
Object.assign(WPN,{
  sword:(k,c,g,e)=>{k.box(.17,1.18,.06,0,.95,0,c||STL).box(.035,1.12,.065,-.075,.95,0,STL2).box(.035,1.12,.065,.075,.95,0,STL2).box(.045,.98,.07,0,.9,0,0x8a94a2).box(.12,.12,.06,0,1.6,0,c||STL).box(.06,.1,.06,0,1.7,0,STL2);
    k.box(.56,.1,.16,0,.3,0,g||GLD).box(.11,.18,.17,-.3,.32,0,g||GLD).box(.11,.18,.17,.3,.32,0,g||GLD);grip(k,.36);k.box(.16,.12,.16,0,-.14,0,g||GLD);(e||k).box(.1,.1,.18,0,.3,0,0xe0304a).box(.07,.07,.17,0,-.14,0,0xe0304a)},
  crystal:(k,c,g,e)=>{k.box(.22,1.12,.08,0,.94,0,0x3a64c8).box(.16,.16,.08,0,1.56,0,0x3a64c8).box(.08,.12,.08,0,1.68,0,0x5a8ae0);(e||k).box(.1,1.02,.09,0,.92,0,0x9ae4ff).box(.06,.14,.09,0,1.55,0,0xd0f6ff).box(.12,.12,.18,0,.3,0,0x7df0ff);
    k.box(.5,.1,.16,0,.3,0,0xc8d0dc).box(.12,.26,.16,-.3,.38,0,0xc8d0dc,{rz:.35}).box(.12,.26,.16,.3,.38,0,0xc8d0dc,{rz:-.35});grip(k,.36,0x2a3a6a,0x1a2440);k.box(.15,.12,.15,0,-.14,0,0xc8d0dc)},
  flame:(k,c,g,e)=>{k.box(.22,.86,.07,0,.78,0,0xb8301a).box(.16,.3,.07,.03,1.3,0,0xd8481a,{rz:-.2}).box(.1,.22,.07,-.03,1.55,0,0xe8601a,{rz:.25});(e||k).box(.1,.76,.08,0,.8,0,0xffb040).box(.06,.28,.08,.03,1.32,0,0xffe080,{rz:-.2}).box(.1,.1,.17,0,.3,0,0xff6a1a);
    k.box(.44,.12,.16,0,.3,0,0x3a2a2a).box(.1,.2,.16,-.24,.36,0,0x5a2a1a).box(.1,.2,.16,.24,.36,0,0x5a2a1a);grip(k,.36,0x2a1a14,0x5a2a1a);k.box(.14,.12,.14,0,-.14,0,0x3a2a2a)},
  katana:(k,c,g,e)=>{for(let i=0;i<7;i++)k.box(.08,.25,.04,0,.42+i*.22,i*i*.006,i==6?STL2:STL,{rx:-i*.018});(e||k).box(.02,1.4,.045,.035,1.06,.07,0xeaf6ff);k.box(.26,.04,.26,0,.28,0,GLD);grip(k,.5,0x5a3a8a,0x2a1a4a);k.box(.12,.08,.12,0,-.24,0,GLD)},
  axe:(k,c,g,e)=>{k.box(.11,1.55,.11,0,.6,0,0x6a4424);for(let i=0;i<5;i++){const t=(i-2)/2;k.box(.08,.18,.2,0,1.2+t*.32,.3+.12*(1-t*t),c||0xcfd6dc,{rx:-t*.5})}k.box(.09,.66,.12,0,1.2,.16,c||0xa8b0bc).box(.13,.22,.22,0,1.2,0,g||GLD).box(.08,.2,.22,0,1.2,-.18,0x8a909a);(e||k).box(.03,.6,.04,0,1.2,.46,0xf4f8fc);grip(k,.3)},
  raxe:(k,c,g,e)=>{k.box(.11,1.6,.11,0,.62,0,0x2a2a32);for(const s of[1,-1])for(let i=0;i<5;i++){const t=(i-2)/2;k.box(.09,.18,.22,0,1.25+t*.36,s*(.3+.14*(1-t*t)),0x3a3a44,{rx:s*-t*.55})}k.box(.14,.28,.24,0,1.25,0,0x1a1a22);(e||k).box(.04,.5,.05,0,1.25,.47,0xff4a3a).box(.04,.5,.05,0,1.25,-.47,0xff4a3a).box(.1,.1,.26,0,1.25,0,0xff6a3a);k.box(.1,.3,.1,0,1.62,0,0x3a3a44)},
  mace:(k,c,g,e)=>{k.box(.1,1.2,.1,0,.5,0,0x5a3a20).box(.4,.4,.4,0,1.2,0,c||0x8a8f99).box(.12,.12,.6,0,1.2,0,c||0x8a8f99).box(.6,.12,.12,0,1.2,0,c||0x8a8f99).box(.12,.6,.12,0,1.2,0,c||0x8a8f99).box(.44,.07,.44,0,1.02,0,g||GLD).box(.44,.07,.44,0,1.38,0,g||GLD);grip(k,.3);k.box(.14,.14,.14,0,-.14,0,g||GLD);if(e)e.box(.1,.1,.42,0,1.2,0,0xffe070)},
  hammer:(k,c,g,e)=>{k.box(.12,1.35,.12,0,.55,0,0x2a2a32);for(let i=0;i<4;i++)k.box(.14,.05,.14,0,.2+i*.18,0,0xa02a2a);k.box(.68,.44,.44,0,1.32,0,0x3a9a3a).box(.72,.08,.48,0,1.12,0,GLD).box(.72,.08,.48,0,1.52,0,GLD).box(.1,.5,.5,-.36,1.32,0,GLD).box(.1,.5,.5,.36,1.32,0,GLD);
    (e||k).box(.2,.2,.05,0,1.32,.24,0xffe060).box(.08,.32,.05,0,1.32,.245,0xffe060).box(.32,.08,.05,0,1.32,.245,0xffe060);k.box(.16,.14,.16,0,-.12,0,GLD)},
  bow:(k,c,g,e)=>{arcLimbs(k,.72,.22,.1,c||0x8a5a2b,8,GLD);k.box(.13,.24,.13,0,0,.22,LTH2).box(.15,.05,.15,0,.13,.22,GLD).box(.15,.05,.15,0,-.13,.22,GLD)},
  bow2:(k,c,g,e)=>{arcLimbs(k,.74,.26,.11,0x1f6a4a,9,GLD2,e,0x7dffb0);k.box(.08,1.0,.03,0,0,.31,GLD);k.box(.14,.26,.14,0,0,.26,0x2a1a10);(e||k).box(.12,.14,.1,0,0,.35,0x7dffb0)},
  bow3:(k,c,g,e)=>{arcLimbs(k,.86,.22,.1,0xe8eef4,10,0xb0c8e0,e,0x9ae4ff);k.box(.14,.26,.14,0,0,.22,0x3a4a6a).box(.16,.05,.16,0,.14,.22,0xc8d0dc).box(.16,.05,.16,0,-.14,.22,0xc8d0dc);(e||k).box(.08,.08,.1,0,.3,.26,0x7df0ff).box(.08,.08,.1,0,-.3,.26,0x7df0ff)},
  bow4:(k,c,g,e)=>{arcLimbs(k,.7,.24,.12,0xe8dcc0,8,0xc8b898);for(const s of[1,-1])k.box(.15,.05,.15,0,s*.34,.2,0xa0202a).box(.15,.05,.15,0,s*.5,.12,0xa0202a);k.box(.14,.24,.14,0,0,.24,0x5a1a1a);(e||k).box(.07,.07,.1,0,.04,.32,0xff3a3a)},
  staff:(k,c,g,e)=>{k.box(.11,2.5,.11,0,.55,0,0x5a3a20);for(const y of[.2,1.2,1.6])k.box(.15,.06,.15,0,y,0,0xc8d0dc);k.box(.36,.08,.36,0,1.72,0,GLD);for(const[a,b]of[[1,0],[-1,0],[0,1],[0,-1]])k.box(.05,.4,.05,a*.15,1.95,b*.15,GLD);(e||k).box(.24,.24,.24,0,1.95,0,c||0xb08aff).box(.12,.12,.12,0,1.95,0,0xf0e0ff)},
  staff2:(k,c,g,e)=>{k.box(.11,2.4,.11,0,.5,0,0x3a2418);k.box(.32,.07,.32,0,1.66,0,GLD);for(let i=0;i<4;i++)k.box(.06,.3,.06,S(i*1.57)*.2,1.82,C(i*1.57)*.2,GLD,{rz:S(i*1.57)*.4,rx:-C(i*1.57)*.4});
    (e||k).box(.26,.26,.26,0,1.9,0,0xff7a1a).box(.16,.3,.16,0,2.06,0,0xffb040).box(.08,.18,.08,0,2.24,0,0xffe080)},
  staff3:(k,c,g,e)=>{for(let i=0;i<6;i++)k.box(.13,.42,.13,(i%2?.04:-.04),.05+i*.38,0,0x5a4024,{rz:i%2?.08:-.08});k.box(.16,.5,.12,.12,2.3,0,0x5a4024,{rz:-.5}).box(.16,.4,.12,-.1,2.25,0,0x5a4024,{rz:.6});
    for(let i=0;i<5;i++)k.box(.28,.16,.28,S(i*1.26)*.22,2.35+(i%2)*.12,C(i*1.26)*.22,i%2?0x4a9a3a:0x6ab84a);(e||k).box(.14,.14,.14,0,2.15,0,0x7dff8a)},
  wand:(k,c,g,e)=>{k.box(.08,.95,.08,0,.38,0,0x2a1a3a);for(const y of[.1,.5,.8])k.box(.12,.05,.12,0,y,0,GLD);k.box(.18,.06,.18,0,.9,0,GLD);(e||k).box(.15,.18,.15,0,1.02,0,c||0xc8a0ff)}});
Object.assign(WPN,{
  lantern:(k,c,g,e)=>{k.box(.06,.5,.06,0,.25,0,0x3a2a1a).box(.34,.06,.34,0,.02,0,0x3a3a3a).box(.34,.06,.34,0,-.42,0,0x3a3a3a).box(.06,.06,.4,0,.08,0,0x3a3a3a);for(const[a,b]of[[1,1],[1,-1],[-1,1],[-1,-1]])k.box(.04,.42,.04,a*.15,-.2,b*.15,0x3a3a3a);(e||k).box(.24,.32,.24,0,-.2,0,0xffd060)},
  gsword:(k,c,g,e)=>{k.box(.24,1.85,.07,0,1.3,0,c||STL).box(.05,1.8,.08,-.1,1.3,0,STL2).box(.05,1.8,.08,.1,1.3,0,STL2).box(.06,1.6,.09,0,1.2,0,0x8a94a2).box(.18,.18,.07,0,2.28,0,c||STL).box(.08,.12,.07,0,2.42,0,STL2).box(.62,.1,.16,0,.36,0,g||GLD).box(.12,.12,.2,-.3,.4,0,g||GLD).box(.12,.12,.2,.3,.4,0,g||GLD);grip(k,.52);k.box(.16,.16,.16,0,-.22,0,g||GLD);if(e)e.box(.04,1.5,.1,0,1.3,0,0xbfe8ff)},
  book:(k,c,g,e)=>{k.box(.42,.08,.56,0,.3,0,c||0x7a2a2a).box(.38,.06,.52,0,.36,0,0xf0e6c8).box(.42,.04,.56,0,.4,0,c||0x7a2a2a).box(.08,.18,.56,-.21,.35,0,shade(c||0x7a2a2a,.7));(e||k).box(.1,.02,.1,0,.43,0,0xffd060)}});
const BOWS=new Set(['bow','bow2','bow3','bow4']);
// brilho das armas raras/lendárias: sem exagero — partes que brilham + faísca de vez em quando na ponta
let wgT=0;
function wglowUpd(dt){const w=EQ.arma;if(!w||w.rar<2||!P.m.wtip||P.dead)return;wgT-=dt;if(wgT>0)return;wgT=w.rar==3?.22:.5;
  P.m.wtip.updateWorldMatrix(true,false);P.m.wtip.getWorldPosition(_tv);if(typeof fpOn=='function'&&fpOn())return;fx(_tv.x+(R()-.5)*.2,_tv.y,_tv.z+(R()-.5)*.2,RAR[w.rar].h,1,.4,.06,1.2,-1)}
// ---------- poderes das armas raras e lendárias
const ALLW=['sword','axe','mace','staff','wand','bow','xbow','spear'];
const POW={brasa:{n:'Brasa',ic:'🔥',d:'25% de chance de incendiar o alvo.',w:ALLW},geada:{n:'Geada',ic:'❄️',d:'20% de chance de congelar o alvo.',w:ALLW},
  trovao2:{n:'Trovão',ic:'⚡',d:'15% de chance de um raio saltar entre 3 inimigos.',w:ALLW},eco:{n:'Eco Arcano',ic:'🌀',d:'A cada 5 acertos, uma onda de choque atinge tudo ao redor.',w:['sword','axe','mace','staff','wand']},
  sangue:{n:'Sede de Sangue',ic:'🩸',d:'Acertos críticos curam 4% da vida.',w:['sword','axe','mace','spear']},multi:{n:'Rajada',ic:'🎯',d:'30% de chance de disparar 2 flechas extras.',w:['bow','xbow']},
  explosiva:{n:'Flecha Explosiva',ic:'💥',d:'As flechas explodem em área.',w:['bow','xbow']}};
const powFor=wk=>pick(Object.keys(POW).filter(k=>POW[k].w.includes(wk)));
function powProc(e,d,crit){const w=EQ.arma;if(!w||!w.pw||e.dead)return;const k=w.pw,y=e.y+1.2*(e.m.g.scale.y||1);
  if(k=='brasa'&&R()<.25){e.burn=3;fx(e.x,y,e.z,0xff7a1a,8,3,.16,1.6,-1)}
  else if(k=='geada'&&R()<.2){e.stun=Math.max(e.stun,.8);e.slow=2.5;fx(e.x,y,e.z,0xbfe8ff,10,5,.14,1,8);ring(e.x,e.z,1.6,0x9ae4ff,.4)}
  else if(k=='trovao2'&&R()<.15){let s={x:e.x,y,z:e.z};const hit=[e];for(let i=0;i<3;i++){let b=null,bd=7;for(const o of E){if(o.dead||hit.includes(o)||o.t.passive)continue;const dd=hy(o.x-s.x,o.z-s.z);if(dd<bd){bd=dd;b=o}}if(!b)break;hit.push(b);bolt(s,{x:b.x,y:b.y+1.2,z:b.z});hurtMob(b,rollDmg(.7)[0],0,'pow');s={x:b.x,y:b.y+1.2,z:b.z}}if(hit.length>1)snd(1600,.15,'sawtooth')}
  else if(k=='eco'){P.eco=(P.eco||0)+1;if(P.eco>=5){P.eco=0;ring(P.x,P.z,4.2,0xb08aff,.5);flash(P.x,P.y+1,P.z,0xb08aff,4,.3);fx(P.x,P.y+.6,P.z,0xc8a8ff,16,9,.12,.4,0);for(const o of E)if(!o.dead&&!o.t.passive&&hy(o.x-P.x,o.z-P.z)<4.2)hurtMob(o,rollDmg(1.2)[0],0,'pow')}}
  else if(k=='sangue'&&crit){heal(ST.mx*.04);fx(P.x,P.y+1.4,P.z,0xff4a5a,6,2,.1,1.4,-1)}}
function powShoot(a){const w=EQ.arma;if(!w||w.pw!='multi'||R()>.3)return;for(const s of[-1,1]){const an=P.f+s*.14;proj('p','arrow',P.x+S(an)*.6,P.y+1.7,P.z+C(an)*.6,{x:P.x+S(an)*20,z:P.z+C(an)*20,y:P.y},rollDmg(.8)[0],{dir:new V3(S(an),0,C(an)),home:0})}}
// ---------- bestas e lanças (Caçador)
Object.assign(WPN,{
  xbow:(k,c,g,e)=>{k.box(.12,.14,.9,0,-.02,.12,0x6a4424).box(.14,.18,.2,0,-.12,-.3,0x4a2e18).box(.06,.24,.08,0,-.2,-.05,LTH2);arcLimbsX(k,.46,.14,.08,c||0x8a5a2b,6,GLD);k.box(.1,.1,.12,0,0,.55,GLD).box(.03,.03,.55,0,.08,.26,0xc8ccd0).box(.06,.06,.1,0,.08,.55,0xe0e4ea)},
  xbow2:(k,c,g,e)=>{k.box(.13,.15,.95,0,-.02,.12,0x2a2a32).box(.16,.2,.22,0,-.12,-.32,0x1a1a22).box(.22,.16,.3,0,.12,.1,0x3a3a44);arcLimbsX(k,.5,.16,.09,0x3a3a44,6,0xa0202a);(e||k).box(.05,.05,.3,.09,.12,.1,0xff4a3a);k.box(.03,.03,.55,0,.1,.26,0xc8ccd0)},
  spear:(k,c,g,e)=>{k.box(.09,2.3,.09,0,.75,0,0x6a4424);for(let i=0;i<3;i++)k.box(.12,.05,.12,0,-.1+i*.14,0,LTH2);k.box(.14,.08,.14,0,1.9,0,g||GLD).box(.16,.42,.05,0,2.15,0,c||STL).box(.1,.2,.06,0,2.42,0,STL2);(e||k).box(.05,.36,.06,0,2.16,0,0xf4f8fc)},
  spear2:(k,c,g,e)=>{k.box(.1,2.4,.1,0,.78,0,0x2a1a3a);k.box(.16,.1,.16,0,1.98,0,0xa0202a).box(.18,.5,.05,0,2.28,0,0x9aa2ae).box(.32,.08,.05,0,2.08,0,0x9aa2ae,{rz:.5}).box(.32,.08,.05,0,2.08,0,0x9aa2ae,{rz:-.5}).box(.1,.22,.06,0,2.6,0,0xc8d0dc);(e||k).box(.06,.42,.06,0,2.28,0,0xff6a5a)}});
function arcLimbsX(k,L,D,th,col,seg,tip){for(let i=-seg;i<=seg;i++){if(!i)continue;const t=i/seg;k.box(L/seg*1.12,th*(1-Math.abs(t)*.4),th,t*L,0,.5-D*t*t,Math.abs(t)>.8?tip:col,{ry:2*D*t/L})}k.box(2*L*.96,.02,.02,0,0,.5-D-.02,0xf5eed0)}
BOWS.add('xbow');BOWS.add('xbow2');
const RNG=k=>k=='bow'||k=='xbow';
// arco: a empunhadura fica na mão (o modelo é deslocado para trás), a curva aponta para o alvo
const BOWZ=t=>t=='xbow'||t=='xbow2'?0:-.22;
// flecha encaixada no arco (aparece ao mirar/atirar)
function nockArrow(type){const a=arrowMesh();a.userData.keep=1;a.position.set(.07,0,type.startsWith('xbow')?.26:.3);a.visible=false;return a}
