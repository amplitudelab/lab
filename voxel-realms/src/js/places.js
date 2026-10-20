'use strict';
/* =============================================================================
   VOXEL REALMS · lugares
   vila, pedras de teleporte, pontos de interesse, livros de lore, placas,
   santuários e baús. Tudo é registrado antes do primeiro pedaço ser gerado.
   ============================================================================= */
const INTER=[]; // objetos com que o jogador interage {x,z,r,ic,label,act,on()}
function inter(o){o.r=o.r||2.6;INTER.push(o);return o}

// ---------- códice: a história do mundo espalhada em livros, lápides e placas
const LORE=[
 {id:'aldor',t:'A Estátua de Aldor',x:0,z:-13.5,txt:'"Aqui jaz a memória de Aldor, o Primeiro Guardião. Há cem anos ele selou Ignarok sob a Caldeira com o Cristal-Selo e ergueu Pedraverde sobre as cinzas da Guerra das Brasas. Enquanto houver um Guardião, a vila não cairá."'},
 {id:'quadro',t:'Quadro de Avisos',x:8,z:-10.5,txt:'"PROCURA-SE: o Capitão Rasgado, líder dos bandidos da Planície. Recompensa: 200 moedas. — Também: quem tiver visto o filho do moleiro, fale com a guarda."'},
 {id:'moleiro',t:'Diário do Moleiro',x:57.3,z:227.8,txt:'"Dia 12. As pás giram sozinhas à noite. Ouço passos no celeiro e o trigo apodrece em fileiras retas, como se algo andasse por baixo da terra. Mandei o menino dormir na vila."'},
 {id:'ordens',t:'Ordens do Capitão',x:-27,z:280.8,txt:'"Rapazes: o homem de capuz negro paga em ouro antigo. Ele quer as pétalas lunares dos Campos de Lírio e quer a estrada vazia. Quem fugir, eu mesmo enterro. — R."'},
 {id:'templo',t:'Inscrição do Templo',x:260.4,z:-15.1,txt:'"Às fadas de Lírio coube guardar a Luz das flores. Quando a Sombra vier, ela começará pelo que é doce: o mel, o pólen, as canções."'},
 {id:'apicultora',t:'Notas da Apicultora',x:305,z:45.5,txt:'"A Rainha cresceu três vezes desde a lua passada. As operárias não voltam mais à colmeia de madeira; voam em círculos sobre a árvore gigante, zumbindo em tom grave. Os olhos delas estão vermelhos."'},
 {id:'torre',t:'Crônica da Torre',x:-52.6,z:-242.3,txt:'"A Torre de Vigia caiu na primeira noite da Sombra. O capitão Doran viu luzes verdes no Cemitério Esquecido e mandou dez homens. Nenhum voltou vivo — mas todos voltaram."'},
 {id:'lapide',t:'Lápide Sem Nome',x:-119.3,z:-219.2,txt:'"Aqui repousa aquele que não deve ser nomeado. Que a terra o segure, que o ferro o prenda, que o esquecimento o vença." — A cova está aberta. De dentro, a terra foi cavada de baixo para cima.'},
 {id:'bosque',t:'Canção do Ancião',x:-3.3,z:-297.7,txt:'"Raiz que bebe, folha que sonha, o Ancião do Bosque ouve o mundo inteiro. Se ele adoece, adoece a floresta; se ele se cala, as árvores andam."'},
 {id:'eremita',t:'Bilhete do Eremita',x:-263.2,z:12.6,txt:'"Se encontrar isto, Guardião, a bruxa Morgra não é a causa — é serva. Ela colhe almas no lodo para alguém maior, que espera no norte gelado. Corte as raízes da Sombra uma por uma."'},
 {id:'grimorio',t:'Grimório de Morgra',x:-308.6,z:62.2,txt:'"Quatro raízes: o mel, a seiva, a carne morta e o lodo. Quando as quatro beberem, o dragão desperta, o selo se parte, e o Rei Sem Nome caminha de novo por Aldoria."'},
 {id:'escamas',t:'Escamas de Ignarok',x:253.5,z:-284.6,txt:'Escamas do tamanho de escudos cobrem o chão, ainda quentes. Gravado na rocha, em letras antigas: "O que Aldor prendeu, só um Guardião pode prender outra vez."'},
 {id:'placa_n',t:'Placa do Norte',x:-3,z:-60,txt:'↑ Floresta Ancestral  ·  ↖ Cemitério Esquecido (perigo!)',sign:1},
 {id:'placa_s',t:'Placa do Sul',x:5,z:60,txt:'↓ Planície Dourada · Moinho de Hollow  ·  → Campos de Lírio  ·  ← Mangue Sombrio',sign:1},
 {id:'placa_l',t:'Placa do Leste',x:280.8,z:-12.7,txt:'↑ Caldeira de Brasas (só para Guardiões experientes)  ·  ← Vila Pedraverde',sign:1}];
const LORE_FOUND=new Set();

// ---------- construções reutilizáveis
const CHIM=[],HOUSES=[]; // chaminés (fumaça) e portas (aldeões se recolhem à noite)
function house(t,w,d,wc,rc,two){const P=0x4a3020;t.b(w,3,d,0,1.5,0,wc,{g:1});for(const sx of[-1,1])for(const sz of[-1,1])t.b(.28,3.1,.28,sx*w/2,1.55,sz*d/2,P);t.b(w+.2,.22,d+.2,0,3.05,0,P);
  let y=3.2;if(two){t.b(w+.4,2.6,d+.4,0,4.4,0,0xeee2c8);t.b(w+.6,.22,d+.6,0,5.8,0,P);t.e_(.7,.7,.12,-w*.25,4.5,d/2+.26,0xffcf5a).e_(.7,.7,.12,w*.25,4.5,d/2+.26,0xffcf5a);y=5.9}
  for(let i=0;i<5;i++)t.b(w+.8-i*(w+.8)/5.5,.55,d+.9,0,y+.27+i*.5,0,i%2?rc:((rc&0xfefefe)>>1)+(rc>>2&0x3f3f3f));
  t.b(.62,3,.62,w*.28,y+1.7,-d*.18,0x6a5e56).b(.82,.22,.82,w*.28,y+3.25,-d*.18,0x4a4440);if(!(CUR_S&&CUR_S.cd)){const[cx,cz]=t.w(w*.28,-d*.18);CHIM.push([cx,t.y+(y+3.5)*t.m,cz,R()*3]);const[dx,dz]=t.w(0,d/2+1.2);HOUSES.push([dx,dz])}
  t.b(1.15,2.15,.14,0,1.08,d/2+.05,0x3b281b).b(.2,.2,.08,.35,1.05,d/2+.14,0xd9a948);t.e_(.7,.7,.12,-w*.3,1.9,d/2+.06,0xffcf5a).e_(.7,.7,.12,w*.3,1.9,d/2+.06,0xffcf5a);
  t.b(.85,2.2,.85,w*.28,y+2,-d*.18,0x77706a);t.b(1,.2,1,w*.28,y+3.1,-d*.18,0x5a5a56);t.col(0,0,Math.max(w,d)*.6);if(w>5.5)t.col(w*.3,0,d*.5),t.col(-w*.3,0,d*.5)}
function lamp(t,x,z,col){t.b(.22,2.6,.22,x,1.3,z,0x3a2a1a,{g:1}).b(.5,.12,.5,x,2.65,z,0x2a2a2a);t.e_(.42,.42,.42,x,2.9,z,col||0xffc860);t.b(.56,.1,.56,x,3.15,z,0x2a2a2a);if(!CUR_S||!CUR_S.cd)LAMPS.push([t.w(x,z)[0],t.y+2.9*t.m,t.w(x,z)[1],col||0xffc860])}
const LAMPS=[];
function crate(t,x,z,s){t.b(.8*s,.8*s,.8*s,x,.4*s,z,0x8a6a3a,{g:1}).b(.84*s,.1,.84*s,x,.78*s,z,0x6a4a24)}
function barrel(t,x,z){t.b(.7,.9,.7,x,.45,z,0x7a5030,{g:1}).b(.74,.08,.74,x,.25,z,0x3a3a3a).b(.74,.08,.74,x,.7,z,0x3a3a3a)}
function tent(t,x,z,ry,c){for(let i=0;i<4;i++)t.b(3.2-i*.75,.6,3.6,x,.3+i*.6,z,i%2?c:((c&0xfefefe)>>1),{ry});t.b(.15,2.8,.15,x,1.4,z+1.7,0x5a3a20)}
function bookStand(t,x,z,id){t.b(.5,1,.5,x,.5,z,0x6a6a66,{g:1}).b(.7,.12,.5,x,1.05,z,0x5a3a20,{rx:-.3});t.e_(.55,.08,.4,x,1.13,z,0xfff0c0,{rx:-.3})}

// ---------- VILA PEDRAVERDE (centro do mapa)
flat(0,0,66,1.5);
const VILLAGE_R=36,GATES=ROADS.filter(r=>r[0][0]==0&&r[0][1]==0).map(r=>Math.atan2(r[1][1],r[1][0]));
addStr(0,0,0,(k,e,f)=>{const t=new TB(k,e,f,0,0,0,1.5,1.5);
  // poço da praça
  for(let i=0;i<10;i++){const a=i/10*TAU;t.b(.9,.9,.5,C(a)*1.3,.45,S(a)*1.3,0x8a8a84,{ry:-a,g:1})}t.b(2,.1,2,0,.1,0,0x2a6aa0);for(const s of[-1,1])t.b(.2,2.6,.2,s*1.2,1.3,0,0x5a3a20);t.b(3,.2,1.6,0,2.65,0,0x8a3a2a,{rz:0}).b(2.6,.4,1.2,0,2.95,0,0x7a3020);t.col(0,0,1.7);
  // estátua de Aldor
  t.b(2.2,1,2.2,0,.5,-9,0x8a8a84,{g:1}).b(1.6,.4,1.6,0,1.2,-9,0x9a9a94);t.b(.8,1.2,.5,0,2.3,-9,0xb8b8b0).b(.6,.6,.6,0,3.2,-9,0xc0c0b8).b(.25,2,.25,.55,2.6,-8.8,0xd0d0c8).b(.7,.12,.12,.55,2.5,-8.8,0xd9a948);t.col(0,-9,1.4);
  // quadro de avisos
  t.b(.2,2,.2,5.2,1,-7,0x5a3a20).b(.2,2,.2,6.8,1,-7,0x5a3a20).b(2,1.2,.12,6,1.6,-7,0x8a6a3a).b(.5,.6,.04,5.6,1.7,-6.92,0xf0e8d0).b(.4,.5,.04,6.4,1.5,-6.92,0xf0e8d0);t.col(6,-7,1);
  // barracas do mercado
  for(const[x,z,c]of[[8,8,0xc0302a],[-8,8,0x2a6ac0],[10,-1,0xd9a030]]){const ry=Math.atan2(-x,-z);const s=new TB(k,e,f,x*1.5,z*1.5,ry,1.5,1.5);s.b(2.6,.9,1.4,0,.45,0,0x8a6a3a,{g:1});for(const a of[-1,1])for(const b of[-1,1])s.b(.15,2.4,.15,a*1.2,1.2,b*.65,0x5a3a20);for(let i=0;i<4;i++)s.b(3,.12,.45,0,2.45-i*.08,-.6+i*.42,i%2?c:0xf0e8d8);s.b(.3,.3,.3,-.6,1,0,0xe04a3a).b(.3,.3,.3,0,1,0,0xffd84a).b(.3,.3,.3,.6,1,0,0x6ac050);t.col(x,z,1.6)}
  // casas (portas viradas para a praça)
  const HS=[[-17,-15,7,6,0xeee2c8,0x8a3a2a,1],[-8,-27,6,5,0xe8dcc0,0x5a3a8a,1],[9,-28,5,4,0xd8c8a8,0x3b4a6a,0],[-27,-9,5,4,0xe0d4b8,0x7a3a2a,0],[27,-9,5,5,0xd8ccb0,0x3b4a6a,0],[-17,17,5,5,0xe8dcc0,0x7a3a2a,0],[17,17,5,4,0xd8c8a8,0x8a3a2a,1],[-26,16,4,4,0xe0d4b8,0x3b4a6a,0]];
  for(const[x,z,w,d,wc,rc,two]of HS)house(new TB(k,e,f,x*1.5,z*1.5,Math.atan2(-x,-z),1.5,1.65),w,d,wc,rc,two);
  // forja da ferreira (aberta, brasas brilhando)
  {const s=new TB(k,e,f,25.5,-22.5,Math.atan2(-17,15),1.5,1.6);s.b(6,.3,5,0,.15,0,0x6a6a66,{g:1});for(const a of[-1,1])for(const b of[-1,1])s.b(.3,3.2,.3,a*2.8,1.6,b*2.3,0x4a3020);for(let i=0;i<4;i++)s.b(6.8-i*1.6,.5,5.6,0,3.4+i*.45,0,i%2?0x5a5a56:0x4a4a46);
   s.b(1.6,1.2,1.6,-1.6,.6,-1,0x5a5a56,{g:1});s.e_(1.1,.2,1.1,-1.6,1.25,-1,0xff7a1a);s.b(.8,2.6,.8,-1.6,2.5,-1.6,0x5a5a56);s.b(1,.5,.5,1,.75,.5,0x3a3a3c).b(.5,.4,.4,1,.3,.5,0x2a2a2a);for(let i=0;i<4;i++)s.b(.12,1.4,.08,2.2,1,-1.8+i*.4,0xcfd6dc,{rz:.1});t.col(17,-15,3)}
  // taverna "O Javali Dourado" (contrata mercenários): placa pendurada
  {const s=new TB(k,e,f,-25.5,-22.5,Math.atan2(17,15),1.5,1.65);s.b(.15,.15,1.4,2.2,3,3.6,0x4a3020).b(1.2,.8,.1,2.2,2.5,4.2,0xd9a948)}
  // paliçada com portões nas estradas
  for(let i=0;i<190;i++){const a=i/190*TAU;if(GATES.some(g=>Math.abs(angDiff(a,g))<.12))continue;const x=C(a)*VILLAGE_R,z=S(a)*VILLAGE_R,h=2.4+hash2(i,7)*.8;t.b(.6,h,.6,x,h/2,z,i%2?0x6a4a2a:0x5a3e22,{ry:-a,g:1});t.b(.3,.4,.3,x,h+.15,z,0x7a5a32,{ry:.78});if(i%3==0)t.col(x,z,.55)}
  for(const g of GATES)for(const s of[-1,1]){const a=g+s*.14,x=C(a)*VILLAGE_R,z=S(a)*VILLAGE_R;t.b(1.4,5,1.4,x,2.5,z,0x5a3e22,{g:1}).b(1.8,.4,1.8,x,5.1,z,0x4a3020);t.e_(.4,.4,.4,x,4.4,z+(z>0?-.8:.8),0xffc860);t.col(x,z,.9)}
  // lampiões, feno, caixotes, cercado das galinhas
  for(let i=0;i<8;i++){const a=i/8*TAU+.2;lamp(t,C(a)*12.5,S(a)*12.5)}for(const g of GATES)for(let r of[18,27]){const x=C(g)*r,z=S(g)*r;lamp(t,x-S(g)*2.4,z+C(g)*2.4)}
  for(const[x,z]of[[-12,-6],[13,5],[-6,-19],[22,-3],[-23,4]]){crate(t,x,z,1);barrel(t,x+1,z+.6);t.col(x,z,.8)}
  for(let i=0;i<6;i++)t.b(.5,.9,2.4,-30+i*1.2,.45,-20,0xd9b83a,{g:1});
  for(let i=0;i<14;i++){const a=i/14*TAU;t.b(.18,1,.18,24+C(a)*3,.5,24+S(a)*3,0x6b4524)}t.b(1.8,1.2,1.4,24,.6,24,0x8a5a30,{g:1})});

// ---------- PEDRAS DE TELEPORTE (uma por região)
const WP=[{id:'vila',n:'Praça de Pedraverde',x:-6,z:11},{id:'plan',n:'Planície Dourada',x:25.3,z:247.8},{id:'flor',n:'Campos de Lírio',x:274.8,z:5.3},{id:'mata',n:'Floresta Ancestral',x:-3.3,z:-261.7},{id:'mang',n:'Mangue Sombrio',x:-277,z:30.3},{id:'cald',n:'Caldeira de Brasas',x:255.5,z:-264.6},
  {id:'outono',n:'Bosque Carmesim',x:-350.1,z:-330.7},{id:'neve',n:'Picos Gelados',x:40.3,z:-521.5},{id:'savana',n:'Savana Rubra',x:521.3,z:159.5},{id:'deserto',n:'Dunas de Âmbar',x:380.7,z:421},{id:'costa',n:'Costa das Conchas',x:-90.3,z:528.4},{id:'cristal',n:'Vale de Cristal',x:-473,z:371.1}];
for(const w of WP){if(w.id!='vila')flat(w.x,w.z,RI[w.id]>=6?13:8);w.on=w.id=='vila';
  addStr(w.x,w.z,0,(k,e,f)=>{const t=new TB(k,e,f,w.x,w.z,0,null,1.3);t.b(5,.3,5,0,.15,0,0x8a8a84,{g:1}).b(4,.3,4,0,.4,0,0x9a9a94);for(let i=0;i<6;i++){const a=i/6*TAU;t.b(.5,1.4,.5,C(a)*2.3,.9,S(a)*2.3,0x7a7a74)}
    t.b(.8,2.6,.8,0,1.8,0,0x6a6a7a);t.e_(.86,.25,.86,0,2.2,0,0x58c8ff).e_(.86,.25,.86,0,1.2,0,0x58c8ff);t.col(0,0,.8)});
  inter({x:w.x,z:w.z,r:3.2,ic:'🌀',label:()=>'Pedra de Teleporte',act:()=>openMap(true),kind:'wp',wp:w})}
const WPCRY=[];{const g=new THREE.OctahedronGeometry(.55),m=new THREE.MeshBasicMaterial({color:0x8fe8ff});for(const w of WP){const c=new THREE.Mesh(g,m);c.scale.y=1.6;c.userData.w=w;sc.add(c);WPCRY.push(c)}}

// ---------- PONTOS DE INTERESSE
// Moinho de Hollow (pás giram)
flat(53.3,231.8,17);let MILL=null;
addStr(53.3,231.8,0,(k,e,f)=>{const t=new TB(k,e,f,53.3,231.8,-.4,null,1.35);for(let i=0;i<6;i++)t.b(6-i*.5,1.5,6-i*.5,0,.75+i*1.5,0,i%2?0xd8ccb0:0xc8bca0,{g:i==0});t.b(4.4,1.4,4.4,0,9.6,0,0x8a5a30);for(let i=0;i<3;i++)t.b(4-i*1.2,.5,4.6,0,10.5+i*.5,0,0x6a3a24);
  t.b(1,1.8,.14,0,.9,3.05,0x3b281b);t.e_(.6,.6,.12,1.2,4,2.6,0xffcf5a);t.col(0,0,3.4);house(new TB(k,e,f,46+10,122+4,-1.2,null,1.6),4,4,0xd8c8a8,0x8a3a2a,0);bookStand(new TB(k,e,f,57.3,227.8,0),0,0);
  for(let i=0;i<10;i++)t.b(.18,1,.18,-6+i*1.3,.5,-6,0x6b4524).b(1.3,.12,.1,-5.35+i*1.3,.8,-6,0x6b4524)});
{const g=new THREE.Group(),k=new Bake();k.box(.6,.6,.8,0,0,0,0x5a3a20);for(let i=0;i<4;i++){const a=i/4*TAU;k.box(.35,5.8,.12,C(a)*3,S(a)*3,0,0x6a4a2a,{rz:a+PI/2});k.box(1.4,4.4,.06,C(a)*3.4+C(a+PI/2)*.7,S(a)*3.4+S(a+PI/2)*.7,.05,0xf0e8d8,{rz:a+PI/2})}
  const m=k.mesh(MV);m.castShadow=true;g.add(m);const y=qh(rawH(53.3,231.8));g.position.set(53.3+S(-.4)*4.9,y+13,231.8+C(-.4)*4.9);g.rotation.y=-.4;g.scale.setScalar(1.35);sc.add(g);MILL=g}
// Acampamento dos Bandidos
flat(-30.7,287.8,21);
addStr(-30.7,287.8,0,(k,e,f)=>{const t=new TB(k,e,f,-30.7,287.8,.3,null,1.4);[[-5,-4,.5,0x8a2a2a],[5,-3,-.4,0x6a5a3a],[-4,5,2.6,0x5a4a3a],[6,5,-2.4,0x8a2a2a]].forEach(([x,z,ry,c])=>{tent(t,x,z,ry,c);t.col(x,z,1.8)});
  for(let i=0;i<8;i++){const a=i/8*TAU;t.b(.5,.4,.5,C(a)*1.1,.2,S(a)*1.1,0x6a6a66)}t.e_(1,.3,1,0,.25,0,0xff8a2a);crate(t,2,-7,1);crate(t,3,-7.3,.8);barrel(t,-7,0);bookStand(t,4,-4);
  for(let i=0;i<22;i++){const a=i/22*TAU;if(Math.abs(angDiff(a,1.9))<.4)continue;t.b(.5,2.2,.5,C(a)*12,1.1,S(a)*12,0x5a3e22,{g:1})}t.b(.15,4,.15,0,2,-2.5,0x3a2a1a).b(1.6,1,.08,.8,3.4,-2.5,0x1a1a1a).b(.5,.5,.1,.8,3.4,-2.45,0xc0302a)});
// Colmeia Real (árvore gigante com a colmeia)
flat(312.8,53.3,20);
addStr(312.8,53.3,0,(k,e,f)=>{const t=new TB(k,e,f,312.8,53.3,0,null,1.3);t.b(2.6,12,2.6,0,6,0,0x5a3a2a,{g:1});for(let i=0;i<10;i++){const a=i/10*TAU;t.f_(5,2.6,5,C(a)*4.5,12+(i%3),S(a)*4.5,[0xf4a6c8,0xffc4dc,0xe890b8][i%3])}t.f_(7,3,7,0,14.4,0,0xffc4dc);
  for(let i=0;i<7;i++){const w=4.2-Math.abs(i-3)*.9;t.b(w,1,w,3.2,9.5-i,0,i%2?0xd9a030:0xc08a20)}t.e_(.8,.8,.2,3.2,7,2.1,0xffb020);for(let i=0;i<5;i++)t.e_(.25,.6,.25,1.6+i*.7,4.6-(i%2)*.4,0,0xffc840);t.col(0,0,1.8);bookStand(t,-6,-6)});
// Templo de Lírio (colunas de mármore)
flat(258.8,-22.7,17);
addStr(258.8,-22.7,0,(k,e,f)=>{const t=new TB(k,e,f,258.8,-22.7,.2,null,1.3),W=0xf6f2ea,W2=0xe2ddd2,G=0xdcb04a;
  // 14.0: templo branco de mármore com degraus, colunata, telhado escalonado e cristal violeta (referência do bosque lilás)
  t.b(15,.5,15,0,.25,0,0xd6d0c4,{g:1}).b(13,.5,13,0,.75,0,W2).b(11,.5,11,0,1.25,0,W);
  for(let i=0;i<8;i++){const a=i/8*TAU+PI/8,x=C(a)*4.6,z=S(a)*4.6,br=0;t.b(1.3,.4,1.3,x,1.7,z,W2).b(.9,br?2.6:5.2,.9,x,br?3:4.3,z,W);if(!br)t.b(1.3,.45,1.3,x,7.1,z,W2);t.col(x,z,.65)}
  for(let i=0;i<8;i++){const m=i/8*TAU+PI/4,r=4.6*C(PI/8);t.b(3.9,.6,1.1,C(m)*r,7.6,S(m)*r,W,{ry:-m-PI/2})}
  t.b(11.2,.15,11.2,0,7.95,0,G).b(10.6,.5,10.6,0,8.2,0,W2).b(9.2,.6,9.2,0,8.75,0,W,{ry:PI/4}).b(7.4,.6,7.4,0,9.3,0,W2).b(5.2,.6,5.2,0,9.85,0,W,{ry:PI/4}).b(3,.6,3,0,10.4,0,W2).b(.45,1.4,.45,0,11.4,0,G);t.e_(.7,.7,.7,0,12.4,0,0xffe8a0);
  t.b(1.8,1.2,1.8,0,2.1,0,W2).b(2.2,.3,2.2,0,2.85,0,G);t.e_(.75,1,.75,0,3.6,0,0xc890ff);t.e_(.4,.4,.4,0,4.45,0,0xffffff);
  for(const s_ of[-1,1])t.b(1.1,2.6,.1,s_*1.9,5.6,C(PI/8)*4.6-.1,0x8a3ac8).b(1.1,.3,.12,s_*1.9,6.9,C(PI/8)*4.6-.1,G);
  for(let i=0;i<10;i++){const a=i/10*TAU;t.f_(.3,.32,.3,C(a)*6.1,1.66,S(a)*6.1,FLL[i%FLL.length])}bookStand(t,0,6)});
// Torre Arruinada
flat(-55.3,-247.7,14);
addStr(-55.3,-247.7,0,(k,e,f)=>{const t=new TB(k,e,f,-55.3,-247.7,0,null,1.35);for(let y=0;y<12;y++)for(let i=0;i<12;i++){const a=i/12*TAU;if(y>6&&hash2(i,y)<.4+y*.04)continue;if(i==3&&y<2)continue;t.b(1.4,1,1,C(a)*3,.5+y,S(a)*3,y%2?0x8a8a84:0x7a7a74,{ry:-a})}
  for(let i=0;i<10;i++)t.b(.8+hash2(i,1),.6,.8,(hash2(i,2)-.5)*12,.3,(hash2(i,3)-.5)*12,0x7a7a74,{ry:i});t.col(0,0,3.4);bookStand(t,2,4)});
// Cemitério Esquecido (zumbis!)
flat(-119.3,-211.7,28);
addStr(-119.3,-211.7,0,(k,e,f)=>{const t=new TB(k,e,f,-119.3,-211.7,0,null,1.25);for(let i=0;i<64;i++){const s=i>>4,j=(i%16)/16*28-14;const x=s==0?j:s==1?14:s==2?-j:-14,z=s==0?-14:s==1?j:s==2?14:-j;if(s==2&&Math.abs(j)<2.5)continue;t.b(.14,1.8,.14,x,.9,z,0x2a2a2e,{g:1}).b(.22,.22,.22,x,1.9,z,0x3a3a40);t.col(x,z,.35);if(i%2)t.b(1.8,.1,.1,x+(s%2?0:.9),1.4,z+(s%2?.9:0),0x2a2a2e)}
  for(let i=0;i<24;i++){const x=-10+(i%6)*4+(hash2(i,1)-.5),z=-9+((i/6)|0)*4.6,tp=hash2(i,4);t.b(1.1,.3,2,x,.15,z+1,0x4a3a2a,{g:1});t.col(x,z,.5);if(tp<.5)t.b(.9,1.3,.25,x,.65,z,0x8a8a8a,{g:1}).b(.6,.2,.26,x,1.4,z,0x9a9a9a);else{t.b(.2,1.6,.2,x,.8,z,0x9a9a9a).b(.9,.2,.2,x,1.2,z,0x9a9a9a)}}
  t.b(6,4.5,5,0,2.25,-11,0x5a5a5e,{g:1});for(let i=0;i<4;i++)t.b(7-i*1.6,.6,6-i*1,0,4.8+i*.6,-11,0x4a4a4e);t.b(1.6,2.4,.2,0,1.2,-8.4,0x1a1a1e);t.e_(.4,.4,.4,-1.4,2.6,-8.3,0x7dff6a).e_(.4,.4,.4,1.4,2.6,-8.3,0x7dff6a);t.col(0,-11,3.2);
  for(const[x,z]of[[-12,12],[12,12],[-12,-12],[12,-12]]){t.b(.2,2.4,.2,x,1.2,z,0x2a2a2a);t.e_(.4,.4,.4,x,2.6,z,0x7dff6a)}bookStand(t,0,-6)});
// Bosque do Ancião (arena do chefe)
flat(4.7,-305.7,22);
addStr(4.7,-305.7,0,(k,e,f)=>{const t=new TB(k,e,f,4.7,-305.7,0);for(let i=0;i<12;i++){const a=i/12*TAU;t.b(1.2,2.4,.8,C(a)*15,1.2,S(a)*15,0x7a7a74,{ry:-a,g:1});t.col(C(a)*15,S(a)*15,.8)}
  for(let i=0;i<6;i++){const a=i/6*TAU+.26;oak(k,f,t.w(C(a)*19,S(a)*19)[0],t.y,t.w(C(a)*19,S(a)*19)[1],3.3);t.col(C(a)*19,S(a)*19,2.6)}bookStand(t,-8,8)});
// Cabana da Bruxa (palafita no mangue)
flat(-311,70.3,13,.6);
addStr(-311,70.3,0,(k,e,f)=>{const t=new TB(k,e,f,-311,70.3,.5,.6,1.5);for(const a of[-1,1])for(const b of[-1,1])t.b(.4,3,.4,a*2.2,0,b*2,0x3a2a1a);t.b(5.4,.3,5,0,1.4,0,0x5a4030);t.b(4.6,3,4.2,0,3,0,0x4a3a2a);for(let i=0;i<5;i++)t.b(5.4-i*1.1,.6,5.2-i*.6,0,4.8+i*.55,0,i%2?0x3a4a2a:0x2a3a1e);
  t.b(1.6,.9,1.6,0,.45,5.4,0x2a2a2a,{g:1});t.e_(1.2,.2,1.2,0,.95,5.4,0x7dff6a);for(let i=0;i<5;i++)t.b(.3,.3,.3,-2.6+i*.4,1.7,2.4,0xe8e0d0);t.e_(.5,.5,.12,1.4,3.2,2.12,0x9aff7a);t.col(0,0,2.8);bookStand(t,4,-4)});
// Toca do Eremita
flat(-261,6.3,10,.7);
addStr(-261,6.3,0,(k,e,f)=>{const t=new TB(k,e,f,-261,6.3,-.8,.7,1.5);for(const a of[-1,1])for(const b of[-1,1])t.b(.34,3.6,.34,a*1.6,.35,b*1.6,0x3a2a1a);t.b(4,.2,4,0,2.05,0,0x5a4430).b(4.2,.12,.12,0,2.2,2.05,0x3a2a1a);for(let i=0;i<6;i++)t.b(.9,.08,.1,0,-.6+i*.45,2.35,0x4a3420);t.b(.1,3,.1,-.42,.55,2.35,0x3a2a1a).b(.1,3,.1,.42,.55,2.35,0x3a2a1a);house(new TB(k,e,f,-261,6.3,-.8,.7+2*1.5,1.5),3.4,3.4,0x8a7a5a,0x4a5a30,0);bookStand(t,2,4)});
// Covil de Ignarok
flat(265.5,-296.6,26,3);
addStr(265.5,-296.6,0,(k,e,f)=>{const t=new TB(k,e,f,265.5,-296.6,0,3);for(let i=0;i<30;i++){const a=i/30*TAU;if(Math.abs(angDiff(a,2.2))<.25)continue;const h=4+hash2(i,9)*5;t.b(3.4,h,3.4,C(a)*24,h/2-.5,S(a)*24,[0x3a2e2a,0x4a3a34][i%2],{g:1});t.col(C(a)*24,S(a)*24,2)}
  for(let i=0;i<6;i++){const a=i/6*TAU+.5;t.e_(3+hash2(i,2)*2,.2,3,C(a)*13,-.3,S(a)*13,0xff6a1a)}for(let i=0;i<10;i++)t.b(.5,.14,.14,(hash2(i,5)-.5)*30,.07,(hash2(i,6)-.5)*30,0xe8e0d0,{ry:i});bookStand(t,-12,12)});
// livros e placas viram interações
for(const L of LORE){if(!L.sign&&!['aldor','quadro'].includes(L.id)){}inter({x:L.x,z:L.z,r:2.6,ic:L.sign?'🪧':L.id=='lapide'?'🪦':L.id=='aldor'?'🗿':'📖',label:()=>L.t,act:()=>readLore(L),kind:'lore'})}
for(const L of LORE)if(L.sign)addStr(L.x,L.z,0,(k,e,f)=>{const t=new TB(k,e,f,L.x,L.z,0,null,1.4);t.b(.2,2,.2,0,1,0,0x5a3a20,{g:1}).b(1.8,.5,.1,.5,1.7,0,0x8a6a3a,{ry:.3}).b(1.6,.45,.1,-.4,1.2,0,0x7a5a32,{ry:-.4})});

// ---------- SANTUÁRIOS (bônus temporários, como no Diablo)
const SHRN={prot:{n:'Santuário da Proteção',d:'-25% de dano recebido',c:0x6ab0ff,ic:'🛡️'},fort:{n:'Santuário da Fortuna',d:'+60% de ouro',c:0xffd84a,ic:'🪙'},fren:{n:'Santuário do Frenesi',d:'+25% de velocidade de ataque',c:0xff6a4a,ic:'⚡'},ilum:{n:'Santuário da Iluminação',d:'+30% de experiência',c:0xb07aff,ic:'✨'},pod:{n:'Santuário do Poder',d:'+30% de dano',c:0xff9a2a,ic:'💪'}};
const SHRINES=[['fort',37.3,205.8],['pod',-52.7,259.8],['fren',240.8,67.3],['ilum',320.8,-2.7],['prot',-47.3,-205.7],['pod',52.7,-265.7],['fren',-273,88.3],['ilum',-243,-21.7],['prot',233.5,-238.6],['fort',-82.7,259.8]].map(([ty,x,z])=>{flat(x,z,4);const s={ty,x,z,used:0};
  addStr(x,z,0,(k,e,f)=>{const t=new TB(k,e,f,x,z,0,null,1.3);t.b(2.4,.4,2.4,0,.2,0,0x9a9a94,{g:1}).b(1,2.6,1,0,1.7,0,0xd8d4cc);t.e_(.7,.7,.7,0,3.4,0,SHRN[ty].c);t.col(0,0,.8)});
  inter({x,z,r:2.6,ic:SHRN[ty].ic,label:()=>s.used?'Santuário (esgotado)':SHRN[ty].n,act:()=>useShrine(s),kind:'shrine',s});return s});
// ---------- BAÚS (saque raro garantido, uma vez por jogo)
const CHESTS=[[22,30,'vila'],[-22.7,279.8,'plan'],[67.3,219.8,'plan'],[316.8,37.3,'flor'],[250.8,-32.7,'flor'],[-63.3,-243.7,'mata'],[-111.3,-225.7,'mata'],[12.7,-315.7,'mata'],[-303,78.3,'mang'],[-253,-1.7,'mang'],[273.5,-308.6,'cald']].map(([x,z,reg],i)=>{const c={i,x,z,reg,o:0,lid:null};flat(x,z,2.6);
  addStr(x,z,0,(k,e,f)=>{const t=new TB(k,e,f,x,z,Math.atan2(-x,-z),null,1.2);t.b(1.3,.66,.86,0,.33,0,0x7a4a22,{g:1}).b(1.34,.1,.9,0,.08,0,0xd9a948).b(.1,.68,.9,-.45,.34,0,0xd9a948).b(.1,.68,.9,.45,.34,0,0xd9a948);for(let j=0;j<5;j++)t.b(.22,.1,.22,C(j*1.3)*1.2,.05,S(j*1.3)*1.2,0xf2c230);t.col(0,0,.8)});
  inter({x,z,r:2.2,ic:'🧰',label:()=>c.o?'Baú vazio':'Abrir baú',act:()=>openChest(c),kind:'chest',c});return c});
const LIDS=[];{for(const c of CHESTS){const g=new THREE.Group(),k=new Bake();k.box(1.32,.34,.88,0,.17,.44,0x8a5a2a).box(1.1,.12,.64,0,.38,.44,0x9a6a32).box(.1,.36,.9,-.45,.17,.44,0xd9a948).box(.1,.36,.9,.45,.17,.44,0xd9a948).box(.22,.26,.08,0,0,.9,0xffd84a);g.add(k.mesh(MV));const ry=Math.atan2(-c.x,-c.z);g.rotation.y=ry;g.position.set(c.x-S(ry)*.52,cellH(Math.floor(c.x),Math.floor(c.z))+.79,c.z-C(ry)*.52);g.scale.setScalar(1.2);sc.add(g);c.lid=g;LIDS.push(g)}}

function placesUpd(dt,t){if(MILL)MILL.children[0].rotation.z+=dt*.7;for(const c of WPCRY){const w=c.userData.w;c.visible=hy(w.x-P.x,w.z-P.z)<90;if(!c.visible)continue;c.position.set(w.x,groundAt(w.x,w.z)+4.2+S(t*1.6+w.x)*.25,w.z);c.rotation.y+=dt*1.4;c.material.color.setHex(w.on?0x8fe8ff:0x58607a)}
  for(const c of CHESTS)if(c.o&&c.lid.rotation.x>-1.9)c.lid.rotation.x=Math.max(-1.95,c.lid.rotation.x-dt*5)}
