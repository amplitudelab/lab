'use strict';
/* =============================================================================
   VOXEL REALMS · itens no chão mostram o próprio item (15.1)
   Armas, armaduras, poções, mochilas e joias caem com o modelo 3D delas girando
   devagar sobre um círculo de luz na cor da raridade; materiais viram trouxinhas
   (couro, lã, carne, cristal...), ouro é uma pilha de moedas e o globo de vida é
   uma esfera vermelha brilhante.
   ============================================================================= */
const MATC={couro:[0x7a4a2a,0x5a3218],la:[0xf0ece0,0xc8c0b0],chifre:[0xe8dcc0,0xb8a888],raposa:[0xe07a2a,0xfff0e0],carne:[0xc83a3a,0xf0c0b0],perna:[0x6ab04a,0xd8e0a0],coelho:[0xe8e0d8,0xf0b0b0],fragmento:[0x7df0ff,0x2a8aa8]};
// trouxinha de material (ou cristal arcano)
function matBake(it,k,e){const c=MATC[it.mid]||[0x9a6a3a,0x6a4a2a];if(it.mid=='fragmento'){e.box(.28,.5,.28,0,.1,0,c[0],{rx:.4,rz:.3});e.box(.18,.32,.18,.2,-.05,.1,c[0],{rz:-.5});k.box(.36,.08,.36,0,-.2,0,c[1]);return}
  k.box(.5,.34,.42,0,0,0,c[0]).box(.42,.14,.34,0,.22,0,c[1]).box(.52,.06,.08,0,.1,0,0x8a6a3a).box(.08,.06,.44,0,.1,0,0x8a6a3a)}
const _ringG=new THREE.RingGeometry(.28,.62,28);
function dropRing(c){const m=new THREE.Mesh(_ringG,new THREE.MeshBasicMaterial({color:c,transparent:true,opacity:.45,depthWrite:false,blending:THREE.AdditiveBlending,side:2}));m.rotation.x=-PI/2;return m}
function lootGroup(inner,fit,c){const g=new THREE.Group(),h=new THREE.Group();h.add(inner);g.add(h);inner.updateMatrixWorld(true);const bb=new THREE.Box3().setFromObject(inner),sz=bb.getSize(new V3()),ct=bb.getCenter(new V3()),k=fit/Math.max(.2,sz.x,sz.y,sz.z);
  h.scale.setScalar(k);inner.position.sub(ct);h.position.y=.32;if(c!=null){const r=dropRing(c);r.position.y=-.26;g.add(r);g.userData.ring=r}
  g.traverse(o=>{if(o.isMesh&&o.material!==(g.userData.ring&&g.userData.ring.material))o.castShadow=true});g.geometry={dispose:()=>g.traverse(o=>{if(o.isMesh&&o.geometry!==_ringG)o.geometry.dispose()})};sc.add(g);return g}
function itemLoot(it){let inner=null;if(it.slot=='mat'){const k=new Bake(),e=new Bake();matBake(it,k,e);inner=new THREE.Group();const a=k.mesh(MV),b=e.mesh(ME);if(a)inner.add(a);if(b)inner.add(b)}
  else inner=itemGroup(it,MV,ME);if(!inner)return lootMesh(RAR[it.rar||0].h,.5);const long=it.slot=='arma'||(it.slot=='mao2'&&it.wd);return lootGroup(inner,long?1.15:it.slot=='pot'||it.slot=='anel'?.55:.8,it.slot=='mat'?0xd8c8a0:RAR[it.rar||0].h)}
dropItem=function(x,z,it){const c=it.slot=='mat'?0x9a6a3a:RAR[it.rar||0].h,L=dropLoot({k:'item',it,m:itemLoot(it)},x,z);if(it.rar>=1){L.sp=spr(c,it.rar>=2?2.4:1.4,.7);sc.add(L.sp)}if(it.rar>=2)L.bm=beam(x,z,c);
  if(it.rar==3){snd(880,.4,'sine');setTimeout(()=>snd(1320,.5,'sine'),180);toast('🟧','Item lendário caiu!',it.n)}};
// ouro: pilha de moedas; globo de vida: esfera
dropGold=function(x,z,n){if(n<1)return;const k=new Bake(),q=Math.min(5,2+Math.floor(Math.log10(n+1)*1.4));for(let i=0;i<q;i++)k.box(.36,.07,.36,(R()-.5)*.12,i*.075,(R()-.5)*.12,i%2?0xffd34a:0xf0c040,{ry:R()});k.box(.36,.36,.07,.24,.12,0,0xffe070,{rz:.3});
  const inner=new THREE.Group();inner.add(k.mesh(MV));const L=dropLoot({k:'gold',n,m:lootGroup(inner,.5,null)},x,z);L.sp=spr(0xffd34a,1,.5);sc.add(L.sp)};
const _globeG=new THREE.IcosahedronGeometry(.22,1);
dropGlobe=function(x,z){const inner=new THREE.Group(),o=new THREE.Mesh(_globeG,new THREE.MeshBasicMaterial({color:0xe8202a})),hl=new THREE.Mesh(_globeG,new THREE.MeshBasicMaterial({color:0xffb0b0}));hl.scale.setScalar(.35);hl.position.set(-.08,.08,.12);inner.add(o,hl);
  const g=lootGroup(inner,.45,0xff3040);g.geometry={dispose(){}};const L=dropLoot({k:'globe',m:g},x,z);L.sp=spr(0xff2a3a,1.8,.7);sc.add(L.sp)};
// o círculo de luz pulsa e fica sempre deitado
const _lootUpd16=lootUpd;lootUpd=function(dt,t){_lootUpd16(dt,t);for(const L of LOOT){const r=L.m.userData&&L.m.userData.ring;if(r){r.rotation.z=-L.m.rotation.y;r.material.opacity=.3+.15*S(t*3+L.x)}}};
