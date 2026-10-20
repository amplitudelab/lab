'use strict';
/* =============================================================================
   VOXEL REALMS · ambientação visual por bioma (14.0)
   Cada região tem sua "luz": saturação, cor das sombras e da névoa, lua e
   partículas. Floresta de outono com sombras azuis, mangue turquesa com lua
   verde, campos de lírio lilases, planície dourada, caldeira avermelhada.
   Funciona também no perfil LEVE (é feito nos materiais, não no pós-processo).
   ============================================================================= */
const LOOK=[ // na ordem de REG: vila, plan, flor, mata, mang, cald
  {sat:1.18,shd:[.02,.05,.11],fog:0xc8e4f8,fk:.1,fly:0xc8ff70},
  {sat:1.16,shd:[.07,.04,.0],fog:0xf4dca0,fk:.22,fly:0xffe070},
  {sat:1.24,shd:[.09,.02,.13],fog:0xd8b8f4,fk:.38,fly:0xe0a8ff},
  {sat:1.26,shd:[.0,.05,.16],fog:0x86a8e0,fk:.42,fly:0xffc860},
  {sat:1.14,shd:[.0,.1,.1],fog:0x4a9a90,fk:.5,fly:0x7affd0},
  {sat:1.2,shd:[.13,.02,.0],fog:0xd87848,fk:.32,fly:0xffa040}];
const _lc=new THREE.Color(),_lf=new THREE.Color(),_lt=new THREE.Color();
function lookUpd(){let sat=0,fk=0;const sh=SHU.uShd.value.setRGB(0,0,0);_lf.setRGB(0,0,0);_lt.setRGB(0,0,0);
  for(let i=0;i<LOOK.length;i++){const w=RW[i];if(w<.002)continue;const L=LOOK[i];sat+=L.sat*w;fk+=L.fk*w;sh.r+=L.shd[0]*w;sh.g+=L.shd[1]*w;sh.b+=L.shd[2]*w;_lf.add(_lc.setHex(L.fog).multiplyScalar(w));_lt.add(_lc.setHex(L.fly).multiplyScalar(w))}
  SHU.uSat.value=sat;sh.multiplyScalar(1-NIGHT*.35);
  // névoa e horizonte puxados para a cor do bioma (mais fraco à noite e com chuva/neblina)
  const k=fk*(1-NIGHT*.55)*(1-WXF*.5);_lf.multiplyScalar(1-NIGHT*.78);sc.fog.color.lerp(_lf,k);SKU.hor.value.lerp(_lf,k*.55);MTU.uHor.value.copy(SKU.hor.value);
  // mangue: lua verde e enorme, céu noturno esverdeado, luz ambiente turquesa
  const mg=RW[RI.mang];SKU.mc.value.setRGB(.85,.9,1).lerp(_lc.setRGB(.62,1,.42),mg);SKU.mg.value.setRGB(.3,.4,.8).lerp(_lc.setRGB(.22,.7,.3),mg);SKU.ms.value=.9984-mg*.0026;
  if(NIGHT>.01){HEM.color.lerp(_lc.setRGB(.25,.62,.58),mg*NIGHT*.45);SKU.top.value.lerp(_lc.setRGB(.02,.1,.07),mg*NIGHT*.6)}
  // partículas do ambiente na cor do bioma (vaga-lumes, pétalas lilases, folhas de outono)
  AMB.fly.m.material.color.copy(_lt);AMB.pet.m.material.color.setHex(0xffb8d8).lerp(_lc.setHex(0xd090ff),RW[RI.flor]);AMB.leaf.m.material.color.setHex(0xff9a2a);
  AMB.mist.m.material.color.lerp(_lc.setRGB(.45,.85,.8),mg*.5)}
