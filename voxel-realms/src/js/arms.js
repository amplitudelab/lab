'use strict';
/* =============================================================================
   VOXEL REALMS · arsenal refeito (15.5)
   Mais de 50 armas, inspiradas na folha de referência (lâminas coloridas,
   guardas ornamentadas, gemas e bordas que brilham), divididas em famílias.
   Cada família luta de um jeito, com combo e animações próprias:
     espada (equilíbrio) · adaga (estocadas rápidas e rajada) · machadinha (golpes de
     cima e redemoinho) · espadão 2M (varridas largas e giro) · martelo 2M (esmaga,
     atordoa e abala o chão) · katana 2M (saque rápido, cruzado, subida e corte em
     disparada) · machado grande 2M · maça · lança (estocadas longas e investida) ·
     foice 2M (ceifa larga e giro duplo) · garras (arranhões alternados e frenesi) ·
     rapieira (investida e rajada de estocadas) · cajados, varinhas, arcos e bestas.
   ============================================================================= */
const BLD=0xc8d0dc,DRK=0x2a2a32,GEM=c=>c;
// ---------- modelos novos (lâmina/haste em +y; empunhadura na origem)
Object.assign(WPN,{
  // espadas de uma mão
  broad:(k,c,g,e)=>{k.box(.24,1.08,.07,0,.92,0,c||STL).box(.04,1.04,.08,-.1,.92,0,STL2).box(.04,1.04,.08,.1,.92,0,STL2).box(.16,.16,.07,0,1.54,0,c||STL).box(.08,.08,.07,0,1.66,0,STL2);
    k.box(.7,.12,.18,0,.3,0,g||GLD).box(.12,.2,.2,-.38,.36,0,g||GLD).box(.12,.2,.2,.38,.36,0,g||GLD);grip(k,.36,0x6a2a1a,LTH2);k.box(.18,.14,.18,0,-.14,0,g||GLD);(e||k).box(.12,.12,.2,0,.3,0,0x4ad8ff).box(.08,.08,.19,0,-.14,0,0x4ad8ff)},
  runeblade:(k,c,g,e)=>{k.box(.18,1.2,.06,0,.96,0,0x3a4a6a).box(.03,1.14,.07,-.08,.96,0,0x8aa8d8).box(.03,1.14,.07,.08,.96,0,0x8aa8d8).box(.12,.14,.06,0,1.62,0,0x3a4a6a);for(let i=0;i<4;i++)(e||k).box(.06,.12,.075,0,.6+i*.26,0,0x7df0ff);
    k.box(.5,.1,.16,0,.32,0,0x9aa2ae).box(.1,.24,.16,-.26,.42,0,0x9aa2ae,{rz:-.4}).box(.1,.24,.16,.26,.42,0,0x9aa2ae,{rz:.4});grip(k,.36,0x1a2440,0x0e1428);k.box(.15,.12,.15,0,-.14,0,0x9aa2ae)},
  serrated:(k,c,g,e)=>{k.box(.16,1.1,.06,0,.92,0,0x2a1a1e);for(let i=0;i<6;i++)k.box(.08,.1,.06,.11,.45+i*.18,0,0x3a2228,{rz:-.6});(e||k).box(.03,1.04,.07,-.06,.92,0,0xff3a3a).box(.06,.16,.07,0,1.52,0,0xff6a5a);
    k.box(.52,.1,.16,0,.3,0,0x5a1a1e).box(.1,.22,.18,-.28,.26,0,0x5a1a1e,{rz:.5}).box(.1,.22,.18,.28,.26,0,0x5a1a1e,{rz:-.5});grip(k,.36,0x1a0a0e,0x5a1a1e);(e||k).box(.1,.1,.18,0,.3,0,0xff2a3a)},
  // espadões
  zwei:(k,c,g,e)=>{k.box(.22,2,.07,0,1.42,0,c||STL).box(.04,1.95,.08,-.09,1.42,0,STL2).box(.04,1.95,.08,.09,1.42,0,STL2).box(.14,.2,.07,0,2.48,0,c||STL);k.box(.16,.36,.09,0,.62,0,0x6a3a20);for(const s of[-1,1])k.box(.1,.12,.12,s*.14,.82,0,g||GLD);
    k.box(.9,.1,.16,0,.42,0,g||GLD).box(.12,.22,.18,-.48,.5,0,g||GLD,{rz:-.3}).box(.12,.22,.18,.48,.5,0,g||GLD,{rz:.3});grip(k,.58,0x3a2214,LTH2);k.box(.18,.18,.18,0,-.24,0,g||GLD);if(e)e.box(.03,1.6,.09,0,1.42,0,0xbfe8ff)},
  dragonblade:(k,c,g,e)=>{k.box(.28,1.9,.08,0,1.36,0,0x8a1a1a).box(.06,1.86,.09,-.12,1.36,0,0xd83a2a).box(.06,1.86,.09,.12,1.36,0,0xd83a2a).box(.2,.2,.08,0,2.36,0,0x8a1a1a).box(.1,.16,.08,0,2.52,0,0xff6a3a);
    for(let i=0;i<5;i++)k.box(.08,.14,.08,-.17,.7+i*.32,0,0xffc040,{rz:.5});(e||k).box(.06,1.6,.1,0,1.3,0,0xffb040);k.box(.8,.14,.2,0,.4,0,0xffc040).box(.2,.3,.2,-.42,.5,0,0x8a1a1a,{rz:-.6}).box(.2,.3,.2,.42,.5,0,0x8a1a1a,{rz:.6});grip(k,.56,0x2a0a0a,0xffc040);(e||k).box(.16,.16,.22,0,.4,0,0xff4a1a)},
  iceblade:(k,c,g,e)=>{k.box(.3,1.8,.08,0,1.3,0,0x3a78c8).box(.22,.26,.08,0,2.3,0,0x5a98e0).box(.12,.2,.08,0,2.5,0,0x8ac8ff);(e||k).box(.12,1.7,.09,0,1.3,0,0xbfefff).box(.06,.3,.1,0,2.32,0,0xffffff);
    k.box(.7,.12,.18,0,.4,0,0xd8e4f0).box(.14,.34,.18,-.34,.52,0,0xd8e4f0,{rz:-.5}).box(.14,.34,.18,.34,.52,0,0xd8e4f0,{rz:.5});grip(k,.56,0x2a3a6a,0xd8e4f0);(e||k).box(.14,.14,.2,0,.4,0,0x7df0ff)},
  // martelos
  warhammer:(k,c,g,e)=>{k.box(.12,1.45,.12,0,.6,0,0x3a2a1e);for(let i=0;i<4;i++)k.box(.15,.05,.15,0,.18+i*.16,0,0x8a8a92);k.box(.46,.5,.46,0,1.42,0,c||0x6a6e78).box(.5,.08,.5,0,1.2,0,0x3a3a42).box(.5,.08,.5,0,1.64,0,0x3a3a42).box(.32,.2,.2,0,1.42,.32,0x8a8e98).box(.14,.14,.26,0,1.42,-.34,0x9aa0aa).box(.08,.08,.2,0,1.42,-.5,0xc8ccd4);k.box(.16,.16,.16,0,-.12,0,0x3a3a42)},
  sunhammer:(k,c,g,e)=>{k.box(.12,1.4,.12,0,.58,0,0x8a5a2a);for(let i=0;i<4;i++)k.box(.15,.05,.15,0,.2+i*.18,0,GLD);k.box(.6,.5,.42,0,1.4,0,0xf0c040).box(.66,.08,.46,0,1.17,0,0x8a5a2a).box(.66,.08,.46,0,1.63,0,0x8a5a2a);
    (e||k).box(.34,.34,.06,0,1.4,.23,0xfff0a0).box(.12,.5,.06,0,1.4,.24,0xffd040).box(.5,.12,.06,0,1.4,.24,0xffd040);(e||k).box(.34,.34,.06,0,1.4,-.23,0xfff0a0);k.box(.16,.16,.16,0,-.12,0,GLD)},
  stonemaul:(k,c,g,e)=>{k.box(.14,1.45,.14,0,.6,0,0x5a4430);for(let i=0;i<3;i++)k.box(.17,.06,.17,0,.25+i*.22,0,0x2a6a6a);k.box(.62,.56,.5,0,1.44,0,0x6a6a66).box(.4,.3,.56,.1,1.62,0,0x7a7a74).box(.3,.2,.52,-.16,1.24,0,0x5a5a56);
    for(const s of[-1,1])(e||k).box(.06,.32,.05,s*.18,1.44,.26,0x40e8d8);(e||k).box(.2,.06,.05,0,1.5,.26,0x40e8d8);k.box(.18,.16,.18,0,-.12,0,0x2a6a6a)},
  // adagas
  kris:(k,c,g,e)=>{for(let i=0;i<5;i++)k.box(.12-i*.012,.15,.05,(i%2?.03:-.03),.32+i*.13,0,c||STL,{rz:i%2?.25:-.25});k.box(.06,.12,.05,0,.98,0,STL2);k.box(.34,.08,.12,0,.22,0,g||GLD);grip(k,.28,0x3a2a5a,GLD);(e||k).box(.08,.08,.13,0,.22,0,0xb07aff)},
  stiletto:(k,c,g,e)=>{k.box(.06,.78,.05,0,.6,0,c||STL).box(.03,.2,.05,0,1.06,0,STL2);k.box(.28,.06,.1,0,.22,0,g||GLD).box(.06,.14,.1,-.15,.26,0,g||GLD).box(.06,.14,.1,.15,.26,0,g||GLD);grip(k,.3,DRK,g||GLD);(e||k).box(.06,.06,.11,0,-.12,0,0x7df0ff)},
  // machadinhas
  hatchet:(k,c,g,e)=>{k.box(.09,1.0,.09,0,.38,0,0x7a5230);k.box(.08,.4,.32,0,.86,.18,c||0xc8d0dc).box(.06,.44,.06,0,.86,.36,STL2).box(.12,.18,.16,0,.86,0,0x4a3a2a);grip(k,.26)},
  tomahawk:(k,c,g,e)=>{k.box(.09,1.1,.09,0,.42,0,0x8a5a2a);for(let i=0;i<3;i++)k.box(.11,.05,.11,0,.15+i*.22,0,i%2?0xd84a2a:0x2a8a8a);k.box(.07,.34,.26,0,.96,.16,c||0xb8c0cc).box(.05,.38,.05,0,.96,.31,STL2);
    k.box(.04,.26,.08,.06,.66,-.06,0xf0e0c0,{rz:.3}).box(.04,.24,.08,-.06,.62,-.06,0xd84a2a,{rz:-.3})},
  cleaver:(k,c,g,e)=>{k.box(.08,.62,.42,0,.72,.14,c||0xb8c0cc).box(.06,.6,.05,0,.72,.36,STL2).box(.1,.1,.1,0,1.02,-.04,0x5a5a62);(e||k).box(.04,.04,.36,.05,.88,.14,0xff4a3a);grip(k,.36,0x3a2a1a,0x2a1a10)},
  // katanas
  nodachi:(k,c,g,e)=>{for(let i=0;i<9;i++)k.box(.08,.25,.04,0,.44+i*.22,i*i*.005,i==8?STL2:STL,{rx:-i*.016});(e||k).box(.02,1.8,.045,.035,1.28,.08,0xffd0d0);k.box(.28,.04,.28,0,.3,0,0xa02a2a);grip(k,.62,0xa02a2a,0x2a0a0a);k.box(.12,.08,.12,0,-.3,0,GLD)},
  moonblade:(k,c,g,e)=>{for(let i=0;i<8;i++)k.box(.1,.24,.04,0,.44+i*.21,i*i*.009,0xe8eef8,{rx:-i*.03});(e||k).box(.03,1.6,.05,.04,1.18,.13,0x7ac8ff);k.box(.3,.05,.3,0,.3,0,0x9aa8c8).box(.14,.14,.14,0,.3,.16,0x9aa8c8);grip(k,.56,0x1a2a4a,0x9aa8c8);(e||k).box(.1,.1,.1,0,-.28,0,0x7ac8ff)},
  // machado grande
  bardiche:(k,c,g,e)=>{k.box(.1,2.2,.1,0,.74,0,0x5a3a20);for(let i=0;i<3;i++)k.box(.13,.05,.13,0,-.1+i*.14,0,LTH2);k.box(.08,.9,.36,0,1.5,.2,c||0xb8c0cc).box(.06,.9,.05,0,1.5,.4,STL2).box(.08,.3,.2,0,1.86,.08,c||0xb8c0cc,{rx:.4});k.box(.14,.16,.14,0,1.12,0,g||GLD)},
  // maça
  morningstar:(k,c,g,e)=>{k.box(.1,1.1,.1,0,.46,0,0x4a3020);k.box(.38,.38,.38,0,1.14,0,c||0x6a6e78);for(const[a,b,d]of[[1,0,0],[-1,0,0],[0,1,0],[0,0,1],[0,0,-1],[0,-1,0]])k.box(.1,.1,.1,a*.26,1.14+b*.26,d*.26,STL2);
    for(const[a,d]of[[1,1],[1,-1],[-1,1],[-1,-1]])k.box(.08,.08,.08,a*.2,1.32,d*.2,STL2);grip(k,.3);k.box(.14,.14,.14,0,-.14,0,g||GLD)},
  // cajados e varinhas
  staffc:(k,c,g,e)=>{k.box(.1,2.4,.1,0,.52,0,0xe8e4f0);for(const y of[.3,1.1,1.55])k.box(.15,.06,.15,0,y,0,0x9a8ac8);k.box(.3,.08,.3,0,1.7,0,0x9a8ac8);for(let i=0;i<4;i++)k.box(.05,.34,.05,S(i*1.57)*.16,1.88,C(i*1.57)*.16,0x9a8ac8,{rz:S(i*1.57)*.3,rx:-C(i*1.57)*.3});
    (e||k).box(.18,.42,.18,0,2.02,0,0x9ae8ff,{ry:.785}).box(.1,.2,.1,.24,2.2,0,0xc8a8ff,{rz:.4}).box(.1,.2,.1,-.24,2.16,0,0x9ae8ff,{rz:-.4})},
  staffm:(k,c,g,e)=>{k.box(.1,2.3,.1,0,.5,0,0x2a2a4a);for(const y of[.2,1.2])k.box(.15,.06,.15,0,y,0,0xc8ccd8);for(let i=0;i<7;i++){const a=-1.2+i*.4;k.box(.1,.16,.08,S(a)*.32,1.9+C(a)*.32,0,0xd8dce8,{rz:-a})}(e||k).box(.16,.16,.16,0,1.92,0,0xbfe0ff).box(.08,.08,.08,0,1.92,.1,0xffffff)},
  staffo:(k,c,g,e)=>{k.box(.1,2.3,.1,0,.5,0,0x5a3a20);k.box(.2,.1,.2,0,1.62,0,GLD);for(let i=0;i<3;i++)k.box(.05,.5,.05,S(i*2.1)*.2,1.92,C(i*2.1)*.2,GLD,{rz:S(i*2.1)*.35,rx:-C(i*2.1)*.35});(e||k).box(.32,.32,.32,0,2.0,0,c||0xff5ab0,{rx:.785,ry:.785}).box(.16,.16,.16,0,2.0,0,0xffe0f0)},
  staffskull:(k,c,g,e)=>{k.box(.11,2.3,.11,0,.5,0,0x2a2420);for(const y of[.3,1])k.box(.15,.06,.15,0,y,0,0xd8d0c0);k.box(.4,.36,.38,0,1.86,0,0xe8e0cc).box(.3,.14,.3,0,1.64,.02,0xd8d0bc);(e||k).box(.1,.1,.05,-.09,1.9,.2,0x7dff9a).box(.1,.1,.05,.09,1.9,.2,0x7dff9a);
    for(const s of[-1,1])k.box(.08,.4,.08,s*.24,2.04,-.06,0xd8d0c0,{rz:s*-.5})},
  wandstar:(k,c,g,e)=>{k.box(.07,.95,.07,0,.38,0,0x3a2a5a);for(const y of[.12,.6])k.box(.11,.05,.11,0,y,0,GLD);(e||k).box(.22,.22,.08,0,1.0,0,0xffe060,{rz:.785}).box(.3,.08,.08,0,1.0,0,0xffe060).box(.08,.3,.08,0,1.0,0,0xffe060).box(.1,.1,.1,0,1.0,0,0xfff8d0)},
  wandfire:(k,c,g,e)=>{k.box(.08,.95,.08,0,.38,0,0x3a1a12);for(const y of[.12,.6,.82])k.box(.12,.05,.12,0,y,0,0xc84a1a);(e||k).box(.16,.2,.16,0,.98,0,0xff6a1a).box(.1,.18,.1,0,1.14,0,0xffb040).box(.05,.12,.05,0,1.26,0,0xffe080)},
  wandice:(k,c,g,e)=>{k.box(.08,.95,.08,0,.38,0,0xd8e4f0);for(const y of[.12,.6])k.box(.12,.05,.12,0,y,0,0x6a8ac8);(e||k).box(.12,.36,.12,0,1.02,0,0x9ae8ff,{ry:.785}).box(.06,.2,.06,.1,.94,0,0xd0f6ff,{rz:-.5}).box(.06,.2,.06,-.1,.94,0,0xd0f6ff,{rz:.5})},
  // arcos e besta
  bow5:(k,c,g,e)=>{arcLimbs(k,.8,.24,.11,0xe8b830,9,0xfff0a0,e,0xffe060);k.box(.14,.26,.14,0,0,.24,0x8a4a1a).box(.16,.05,.16,0,.14,.24,0xfff0a0).box(.16,.05,.16,0,-.14,.24,0xfff0a0);(e||k).box(.12,.12,.08,0,0,.34,0xffe060)},
  bow6:(k,c,g,e)=>{arcLimbs(k,.82,.26,.1,0x3a4a8a,9,0x9ae8ff,e,0x9ae8ff);k.box(.14,.26,.14,0,0,.24,0x1a2a4a);for(const s of[1,-1])(e||k).box(.05,.24,.05,0,s*.52,.12,0xe0f0ff,{rz:s*.4})},
  xbow3:(k,c,g,e)=>{k.box(.13,.15,.95,0,-.02,.12,0x5a3a20).box(.16,.2,.22,0,-.12,-.32,0x3a2414).box(.26,.22,.36,0,.16,.14,0x6a6e78).box(.2,.06,.3,0,.3,.14,0x3a3a42);arcLimbsX(k,.48,.16,.08,0x6a4424,6,GLD);k.box(.03,.03,.55,0,.1,.26,0xc8ccd0)},
  // lanças
  speartri:(k,c,g,e)=>{k.box(.09,2.3,.09,0,.75,0,0x2a5a6a);for(let i=0;i<3;i++)k.box(.12,.05,.12,0,-.1+i*.14,0,0x1a3a4a);k.box(.5,.08,.08,0,1.92,0,c||0x9aa8b8).box(.08,.5,.06,0,2.22,0,c||0x9aa8b8);for(const s of[-1,1])k.box(.07,.36,.06,s*.22,2.12,0,c||0x9aa8b8).box(.05,.12,.06,s*.22,2.34,0,STL2);(e||k).box(.08,.14,.07,0,2.5,0,0x7df0ff)},
  spearglaive:(k,c,g,e)=>{k.box(.09,2.2,.09,0,.72,0,0x5a2a1a);k.box(.14,.1,.14,0,1.86,0,g||GLD);for(let i=0;i<5;i++){const t=i/4;k.box(.08,.22,.2+.06*S(t*PI),0,2.0+i*.17,.06+.1*S(t*PI),c||STL,{rx:-.3+t*.5})}(e||k).box(.03,.7,.05,0,2.32,.24,0xf4f8fc)},
  spearhal:(k,c,g,e)=>{k.box(.1,2.35,.1,0,.78,0,0x3a2a1a);k.box(.07,.56,.34,0,2.0,.2,c||0xb8c0cc).box(.07,.2,.2,0,2.02,-.14,c||0xb8c0cc).box(.08,.5,.06,0,2.42,0,STL2).box(.14,.1,.14,0,1.66,0,g||GLD);(e||k).box(.03,.5,.04,0,2.0,.38,0xf4f8fc)},
  // foices
  scythe:(k,c,g,e)=>{k.box(.1,2.4,.1,0,.6,0,0x2a2224);for(let i=0;i<4;i++)k.box(.13,.05,.13,0,-.1+i*.4,0,0x6a5a7a);k.box(.16,.16,.16,0,1.8,0,0x3a3440);
    for(let i=0;i<7;i++){const t=i/6;k.box(.07,.14,.24,0,1.86+S(t*1.5)*.3,.18+t*.8,i==6?0xa8a0b8:0x4a4458,{rx:-1.2+t*.6})}(e||k).box(.04,.1,.7,0,2.02,.6,0xb07aff,{rx:-.2})},
  reaper:(k,c,g,e)=>{k.box(.1,2.4,.1,0,.6,0,0x1a1418);for(let i=0;i<3;i++)k.box(.14,.06,.14,0,.3+i*.5,0,0xd8d0c0);k.box(.3,.26,.28,0,1.84,0,0xe8e0cc);(e||k).box(.08,.08,.05,-.06,1.86,.15,0x7dff9a).box(.08,.08,.05,.06,1.86,.15,0x7dff9a);
    for(let i=0;i<8;i++){const t=i/7;k.box(.07,.14,.26,0,1.9+S(t*1.6)*.36,.2+t*.92,0x2a3a2e,{rx:-1.2+t*.65})}(e||k).box(.04,.12,.86,0,2.1,.66,0x7dff9a,{rx:-.2})},
  scytheb:(k,c,g,e)=>{for(let i=0;i<6;i++)k.box(.13,.4,.13,(i%2?.03:-.03),.0+i*.4,0,0xe8e0cc,{rz:i%2?.06:-.06});k.box(.32,.2,.3,0,2.3,0,0xd8d0bc);for(let i=0;i<6;i++){const t=i/5;k.box(.08,.14,.22,0,2.28+S(t*1.4)*.28,.2+t*.7,0xe8e0cc,{rx:-1.1+t*.55})}(e||k).box(.1,.1,.06,0,2.32,.16,0x7dff9a)},
  sickle:(k,c,g,e)=>{grip(k,.4,0x2a1a10,0x6a5a7a);for(let i=0;i<6;i++){const t=i/5;k.box(.06,.12,.18,0,.36+S(t*1.6)*.36,.06+t*.42,0x6a6478,{rx:-1+t*.7})}(e||k).box(.03,.1,.36,0,.72,.34,0xb07aff)},
  // garras e rapieiras
  claws:(k,c,g,e)=>{k.box(.28,.22,.3,0,-.02,0,0x3a2a2a).box(.3,.08,.32,0,.1,0,g||0x8a1a2a);for(let i=0;i<3;i++){const x=(i-1)*.1;k.box(.04,.5,.05,x,.38,.08,c||STL,{rx:-.25}).box(.03,.16,.05,x,.68,.16,STL2,{rx:-.5})}(e||k).box(.06,.06,.06,0,.14,.16,0xff2a3a)},
  claws2:(k,c,g,e)=>{k.box(.28,.24,.3,0,-.02,0,0x1a0a12).box(.32,.1,.34,0,.12,0,0x5a0a1a);for(let i=0;i<4;i++){const x=(i-1.5)*.08;k.box(.035,.6,.05,x,.44,.1,0x8a1a2a,{rx:-.3});(e||k).box(.02,.5,.055,x,.44,.12,0xff4a5a,{rx:-.3})}},
  rapier:(k,c,g,e)=>{k.box(.06,1.3,.04,0,1,0,c||STL).box(.03,.2,.045,0,1.72,0,STL2);for(let i=0;i<6;i++){const a=i/6*TAU;k.box(.03,.03,.03,S(a)*.16,.28+C(a)*.12,C(a)*.08,g||GLD)}k.box(.3,.04,.04,0,.34,0,g||GLD).box(.22,.18,.03,0,.24,.08,g||GLD);grip(k,.3,0x2a1a10,g||GLD);(e||k).box(.07,.07,.07,0,-.12,0,0x7df0ff)},
  rapier2:(k,c,g,e)=>{k.box(.07,1.36,.04,0,1.02,0,0x8a1a2a).box(.03,1.3,.045,0,1.02,0,0xd83a3a);k.box(.03,.22,.045,0,1.76,0,0xff6a6a);for(let i=0;i<8;i++){const a=i/8*TAU;k.box(.03,.03,.03,S(a)*.17,.28+C(a)*.13,C(a)*.08,0x2a0a0e)}k.box(.32,.05,.05,0,.34,0,0x2a0a0e);grip(k,.3,0x1a0a0a,0x8a1a2a);(e||k).box(.08,.08,.08,0,.34,0,0xff2a3a)}});
for(const b of['bow5','bow6','xbow3'])BOWS.add(b);
// ---------- catálogo (nome, ícone, família, modelo)
BASES.arma=[['Espada Longa','⚔️','sword','sword'],['Espada Larga','⚔️','sword','broad'],['Lâmina Rúnica','🗡️','sword','runeblade'],['Lâmina Flamejante','🗡️','sword','flame'],['Lâmina de Cristal','🗡️','sword','crystal'],['Espada Serrilhada','🗡️','sword','serrated'],
  ['Espadão','⚔️','gsword','gsword'],['Montante','⚔️','gsword','zwei'],['Lâmina do Dragão','⚔️','gsword','dragonblade'],['Espadão Glacial','⚔️','gsword','iceblade'],
  ['Martelo Estelar','🔨','hammer','hammer'],['Martelo de Guerra','🔨','hammer','warhammer'],['Martelo Solar','🔨','hammer','sunhammer'],['Marreta de Pedra','🔨','hammer','stonemaul'],
  ['Adaga Curva','🗡️','dagger','dagger'],['Kris Ondulado','🗡️','dagger','kris'],['Estilete','🗡️','dagger','stiletto'],['Presa Carmesim','🗡️','dagger','fang'],
  ['Machadinha','🪓','axe','hatchet'],['Machado de Guerra','🪓','axe','axe'],['Tomahawk','🪓','axe','tomahawk'],['Cutelo','🪓','axe','cleaver'],['Machado Rúnico','🪓','axe','raxe'],['Bardiche','🪓','axe','bardiche'],
  ['Katana do Vento','🗡️','katana','katana'],['Nodachi','🗡️','katana','nodachi'],['Lâmina Lunar','🗡️','katana','moonblade'],
  ['Maça Pesada','🔨','mace','mace'],['Estrela da Manhã','🔨','mace','morningstar'],
  ['Cajado Arcano','🪄','staff','staff'],['Cajado de Fogo','🪄','staff','staff2'],['Cajado de Carvalho','🪄','staff','staff3'],['Cajado de Cristal','🪄','staff','staffc'],['Cajado Lunar','🪄','staff','staffm'],['Cajado do Orbe','🪄','staff','staffo'],
  ['Varinha Rúnica','🪄','wand','wand'],['Varinha Estelar','🪄','wand','wandstar'],['Varinha de Brasa','🪄','wand','wandfire'],['Varinha de Gelo','🪄','wand','wandice'],
  ['Arco Curvo','🏹','bow','bow'],['Arco Élfico','🏹','bow','bow2'],['Arco Longo','🏹','bow','bow3'],['Arco de Osso','🏹','bow','bow4'],['Arco Solar','🏹','bow','bow5'],['Arco da Tempestade','🏹','bow','bow6'],
  ['Besta Pesada','🏹','xbow','xbow'],['Besta Sombria','🏹','xbow','xbow2'],['Besta de Repetição','🏹','xbow','xbow3'],
  ['Lança de Caça','🔱','spear','spear'],['Lança Dentada','🔱','spear','spear2'],['Tridente','🔱','spear','speartri'],['Glaive','🔱','spear','spearglaive'],['Alabarda','🔱','spear','spearhal'],
  ['Foice Sombria','🌙','scythe','scythe'],['Ceifadora de Almas','🌙','scythe','reaper'],['Foice de Ossos','🌙','scythe','scytheb'],['Foice Curta','🌙','axe','sickle'],['Cajado de Ossos','🦴','staff','nstaff'],['Cajado da Caveira','🦴','staff','staffskull'],
  ['Garras de Sangue','🩸','claws','claws'],['Garras Noturnas','🩸','claws','claws2'],['Rapieira','🗡️','rapier','rapier'],['Rapieira Carmesim','🗡️','rapier','rapier2']];
{const ix=v=>BASES.arma.findIndex(b=>b[3]==v);for(const l of LEG){if(l.id=='crepusculo')l.b=ix('flame');else if(l.id=='perfura')l.b=ix('bow3');else if(l.id=='trovao'&&l.slot=='arma')l.b=ix('staff')}}
Object.assign(CLS_WPN.guerreiro,{sword:9,gsword:8,hammer:7,katana:6,axe:8,mace:7,dagger:3,spear:1.5,scythe:.6,claws:.4,rapier:1});
Object.assign(CLS_WPN.mago,{gsword:.5,hammer:.5,katana:.5,scythe:.6,claws:.3,rapier:.6});
Object.assign(CLS_WPN.cacador,{dagger:3,rapier:2,katana:1.5,gsword:.5,hammer:.5,scythe:.5,claws:.6});
Object.assign(CLS_WPN.necromante,{scythe:9,staff:9,wand:6,dagger:1.5,gsword:.5,hammer:.5,katana:.5,claws:.4,rapier:.5});
Object.assign(CLS_WPN.vampiro,{claws:10,rapier:9,dagger:9,sword:2,scythe:1.2,gsword:.5,hammer:.4,katana:1});
for(const w of['gsword','hammer','katana','scythe','claws','rapier'])if(!ALLW.includes(w))ALLW.push(w);for(const w of['gsword','hammer','katana','scythe','claws','rapier'])POW.sangue.w.push(w);for(const w of['gsword','hammer','katana','scythe'])POW.eco.w.push(w);
for(const v of['zwei','dragonblade','iceblade','warhammer','sunhammer','stonemaul','katana','nodachi','moonblade','bardiche','scythe','reaper','scytheb','claws','claws2'])TWO_VK.add(v);
// família de luta pelo modelo (itens antigos continuam funcionando)
const WSOF={sword:'sword1',broad:'sword1',runeblade:'sword1',flame:'sword1',crystal:'sword1',serrated:'sword1',gsword:'gsword',zwei:'gsword',dragonblade:'gsword',iceblade:'gsword',
  hammer:'hammer',warhammer:'hammer',sunhammer:'hammer',stonemaul:'hammer',dagger:'dagger',kris:'dagger',stiletto:'dagger',fang:'dagger',hatchet:'axe1',axe:'axe1',tomahawk:'axe1',cleaver:'axe1',sickle:'axe1',
  raxe:'gaxe',bardiche:'gaxe',katana:'katana',nodachi:'katana',moonblade:'katana',mace:'mace1',morningstar:'mace1',spear:'spear',spear2:'spear',speartri:'spear',spearglaive:'spear',spearhal:'spear',
  scythe:'scythe',reaper:'scythe',scytheb:'scythe',claws:'claws',claws2:'claws',rapier:'rapier',rapier2:'rapier'};
const wsOf=it=>it&&it.slot=='arma'?WSOF[it.vk||it.wk]||(it.wk=='axe'?'axe1':it.wk=='mace'?'mace1':it.wk=='spear'?'spear':it.wk=='dagger'?'dagger':'sword1'):null;
// dano e ritmo por família
const WSDMG={dagger:[.85,1.25],claws:[.95,1.2],rapier:[.95,1.1],hammer:[1.15,.8],gsword:[1.05,.86],katana:[1,.95],scythe:[1.05,.88],gaxe:[1.1,.86]};
const _genItem16=genItem;genItem=function(){const it=_genItem16.apply(this,arguments);if(it&&it.slot=='arma'&&it.wd){const w=WSDMG[wsOf(it)];if(w){it.wd=it.wd.map(v=>Math.round(v*w[0]));it.spd=w[1]}}return it};
const _itemLines16=itemLines;itemLines=function(it){const L=_itemLines16(it);const s=it&&wsOf(it);if(s&&WSN[s])L.splice(1,0,`<span style="color:#bfe0ff">⚔ Estilo: ${WSN[s]}</span>`);return L};
const WSN={sword1:'Espada — equilíbrio e estocada',gsword:'Espadão — varridas largas e giro',hammer:'Martelo — esmaga, atordoa e abala o chão',dagger:'Adaga — estocadas rápidas e rajada',axe1:'Machadinha — golpes de cima e redemoinho',
  gaxe:'Machado grande — golpes pesados e giro',katana:'Katana — saque, cruzado, subida e corte em disparada',mace1:'Maça — pancadas que atordoam',spear:'Lança — alcance longo e investida',scythe:'Foice — ceifa larga e giro duplo',claws:'Garras — arranhões alternados e frenesi',rapier:'Rapieira — investida e rajada de estocadas'};
// ---------- combos: animação, duração, momento do golpe, alcance, ângulo, dano, avanço, atordoamento, acertos
const PROF={
  sword1:[{k:'slashA',d:.44,h:.5,r:2.8,a:1.25,m:1},{k:'slashB',d:.44,h:.5,r:2.8,a:1.25,m:1},{k:'thrust',d:.42,h:.48,r:3.6,a:.5,m:1.1,l:.12},{k:'finisher',d:.8,h:.63,r:3.9,a:3.2,m:2.3,l:.16,big:1}],
  dagger:[{k:'stab',d:.28,h:.45,r:2.3,a:.9,m:.8},{k:'stab2',d:.28,h:.45,r:2.3,a:1.1,m:.8,mir:1},{k:'stab',d:.3,h:.45,r:2.5,a:.8,m:.85},{k:'flurry',d:.62,h:.3,r:2.6,a:1.4,m:.6,multi:3,l:.1}],
  axe1:[{k:'chop',d:.48,h:.52,r:2.8,a:1,m:1.12},{k:'slashB',d:.46,h:.5,r:2.8,a:1.2,m:1.08},{k:'chop',d:.48,h:.52,r:2.8,a:1,m:1.16,mir:1},{k:'whirl',d:.8,h:.55,r:3.3,a:7,m:1.9,big:1}],
  gsword:[{k:'sweepL',d:.62,h:.52,r:3.5,a:1.7,m:1.3},{k:'sweepR',d:.62,h:.52,r:3.5,a:1.7,m:1.3},{k:'smash',d:.72,h:.56,r:3.6,a:.9,m:1.7,big:1},{k:'whirl',d:.95,h:.55,r:4.1,a:7,m:2.5,big:1}],
  hammer:[{k:'smash',d:.74,h:.58,r:3.1,a:.9,m:1.6,st:.6,big:1},{k:'sweepL',d:.66,h:.55,r:3.2,a:1.5,m:1.35},{k:'smash',d:.74,h:.58,r:3.1,a:.9,m:1.7,st:.6,big:1},{k:'quake',d:1.05,h:.62,r:4.6,a:7,m:2.7,st:1.2,big:1,aoe:1}],
  katana:[{k:'iaido',d:.36,h:.42,r:3.1,a:1.3,m:.9},{k:'xslash',d:.38,h:.45,r:3.1,a:1.3,m:.9},{k:'rise',d:.42,h:.48,r:3.1,a:1.1,m:1},{k:'dashcut',d:.7,h:.45,r:4.4,a:1,m:1.9,l:.34,big:1}],
  gaxe:[{k:'chop',d:.6,h:.55,r:3.2,a:1.1,m:1.45,big:1},{k:'sweepR',d:.6,h:.52,r:3.3,a:1.6,m:1.35},{k:'chop',d:.6,h:.55,r:3.2,a:1.1,m:1.5,big:1},{k:'whirl',d:.95,h:.55,r:3.9,a:7,m:2.4,big:1}],
  mace1:[{k:'chop',d:.48,h:.52,r:2.7,a:1,m:1.1,st:.25},{k:'slashB',d:.46,h:.5,r:2.7,a:1.2,m:1.05},{k:'chop',d:.48,h:.52,r:2.7,a:1,m:1.15,st:.25,mir:1},{k:'smash',d:.7,h:.58,r:3,a:1,m:2,st:.8,big:1}],
  spear:[{k:'thrust',d:.42,h:.48,r:3.9,a:.5,m:1.05,l:.1},{k:'thrust',d:.4,h:.48,r:3.9,a:.5,m:1.05},{k:'sweepR',d:.46,h:.5,r:3.3,a:1.4,m:1},{k:'lunge',d:.7,h:.5,r:4.6,a:.55,m:2,l:.3,big:1}],
  scythe:[{k:'reap',d:.6,h:.52,r:3.6,a:1.8,m:1.25},{k:'reap2',d:.6,h:.52,r:3.6,a:1.8,m:1.25},{k:'whirl',d:.85,h:.5,r:3.8,a:7,m:1.8},{k:'whirl2',d:1.1,h:.4,r:4,a:7,m:1.5,multi:2,big:1}],
  claws:[{k:'swipeR',d:.3,h:.45,r:2.4,a:1.3,m:.7},{k:'swipeL',d:.3,h:.45,r:2.4,a:1.3,m:.7},{k:'swipeX',d:.36,h:.5,r:2.5,a:1.4,m:.9},{k:'frenzy',d:.66,h:.25,r:2.6,a:1.5,m:.5,multi:4,l:.1}],
  rapier:[{k:'lunge',d:.42,h:.46,r:3.6,a:.55,m:1,l:.14},{k:'thrust',d:.36,h:.45,r:3.4,a:.5,m:.95},{k:'slashA',d:.4,h:.5,r:2.7,a:1.2,m:.9},{k:'flurry',d:.66,h:.3,r:3.6,a:.6,m:.6,multi:3,l:.1}]};
// estilo do que está na mão (para a animação e o golpe)
const _calc16=calcStats;calcStats=function(){_calc16();ST.ws=wsOf(EQ.arma)};
// ---------- ataque básico por família
const _attack16=attack;attack=function(){const ws=ST.ws;if(!ws||!PROF[ws]||MANA()||bow()||P.air)return _attack16();
  if(!canAct()||P.block){if(P.act&&P.act.sk=='golpe'&&P.act.t/P.act.dur>.3)P.buf=1;return}P.buf=0;dismount();if(P.sneak){P.bsT=1.2;P.sneak=0;$('snkb').classList.remove('on')}
  const sp=1+ST.ias/100+(P.buff.fren>0?.25:0)+(P.buff.fren2>0?.2+.1*rk('frenesi'):0),t=bestTarget(8,1);P.lunge=0;if(t){P.f=Math.atan2(t.x-P.x,t.z-P.z);const d=hy(t.x-P.x,t.z-P.z)-t.r;if(d>1.6)P.lunge=Math.min(.22,(d-1.2)/16)}
  P.combo=(P.cbt>0?(P.combo||0)%4:0)+1;P.cbt=1.25;const pf=PROF[ws][P.combo-1];P.lunge=Math.max(P.lunge,pf.l||.06);
  P.act={k:pf.k,t:0,dur:pf.d/sp,hp:pf.h,sk:'golpe',tg:t,pf,mir:!!(pf.mir&&ST.dual)};if(pf.big)fx(P.x,P.y+.3,P.z,0xcdb894,5,3,.16,.5)};
function styleHit(a,pf,extra){let hit=0;for(const e of E){if(e.dead)continue;const dx=e.x-P.x,dz=e.z-P.z,d=hy(dx,dz)-e.r;
    if(d<pf.r&&(d<1.2||pf.a>=6||Math.abs(angDiff(P.f,Math.atan2(dx,dz)))<pf.a)){const[dm,c]=rollDmg(pf.m);hurtMob(e,dm,c,'golpe');if(pf.st&&!e.boss)e.stun=Math.max(e.stun||0,pf.st);hit++;impactFx(e,!!pf.big&&!extra)}}
  if(hit){addFury((8+ST.fury)*Math.min(2,hit)*(extra?.4:1));HITSTOP=pf.big&&!extra?.07:.03;SHK=Math.max(SHK,pf.big?.35:.1)}
  if(!extra){slashFx(!!pf.big);const fx_=P.x+S(P.f)*1.6,fz_=P.z+C(P.f)*1.6;
    if(pf.aoe){ring(P.x,P.z,pf.r,0xffe0a0,.5);ring(P.x,P.z,pf.r*.6,0xffffff,.3);fx(P.x,P.y+.3,P.z,0xb8a888,24,10,.25,.8);for(let i=0;i<6;i++)puff(P.x+C(i)*2.4,P.y+.3,P.z+S(i)*2.4,0xd8c8a8,2);SHK=Math.max(SHK,.55);if(typeof debris=='function')debris(P.x,P.z,8)}
    else if(pf.big){ring(fx_,fz_,2.6,0xffffff,.3);fx(fx_,P.y+.3,fz_,0xc8b898,10,5,.18,.6);puff(fx_,P.y+.3,fz_,0xd8c8a8,2)}}
  if(hit&&ST.leg.has('crepusculo')&&R()<.2){flash(P.x,P.y+1,P.z,0xff8a30,6,.35);ring(P.x,P.z,3.4,0xff8a30,.4);for(const e of E)if(!e.dead&&hy(e.x-P.x,e.z-P.z)<3.6)hurtMob(e,rollDmg(.8)[0],0,'leg')}}
const _primaryHit16=primaryHit;primaryHit=function(){const a=P.act;if(!a||a.sk!='golpe'||!a.pf)return _primaryHit16();const pf=a.pf;styleHit(a,pf,0);if(pf.multi>1){a.mh=pf.multi-1;a.mt=a.t+a.dur*.16}};
// golpes extras (rajadas, frenesi, giro duplo) contados no tempo do jogo
const _playerUpd16=playerUpd;playerUpd=function(dt,t){_playerUpd16(dt,t);const a=P.act;if(a&&a.mh>0&&a.t>=a.mt&&!P.dead){a.mh--;a.mt+=a.dur*.16;styleHit(a,a.pf,1);if(typeof sfxWhoosh=='function')sfxWhoosh('light')}};
// giros: o corpo inteiro gira durante o golpe
const _heroPose16=heroPoseUpd;heroPoseUpd=function(){_heroPose16();const a=P.act;if(a&&(a.k=='whirl'||a.k=='whirl2')&&!P.dodge){const p=Math.min(1,a.t/a.dur);P.m.g.rotation.y=P.f+sstep(.12,.88,p)*TAU*(a.k=='whirl2'?2:1)}};
// ---------- garras nas duas mãos
const _gearModel16=gearModel;gearModel=function(){_gearModel16();const w=EQ.arma;if(w&&wsOf(w)=='claws'&&P.m)weapon(P.m,w.vk||'claws',null,w.rar>=3?RAR[w.rar].h:null,P.m.hL)};
