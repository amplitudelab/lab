'use strict';
/* =============================================================================
   VOXEL REALMS · biomas 3× maiores (15.7)
   - Cada bioma ocupa 3× a área: os centros das regiões e a borda do mundo foram
     afastados √3 vezes; tudo o que existia (vilas, chefes, baús, santuários,
     missões) foi transladado junto com a sua região (reescrita feita no código).
   - Saves antigos: a posição do herói e o mapa revelado seguem a região onde estavam.
   - 12 Pedras de Teleporte novas nos confins de cada região.
   - 6 marcos novos (Fazenda Abandonada, Forte da Estrada, Círculo das Fadas, Pedras
     dos Druidas, Vila Afogada, Forja dos Anões) e 6 covis com chefes únicos nas terras
     de fora, cada um com mecânicas próprias.
   - Habilidades novas de chefe: onda de choque (pule ou desvie), escudo de cristais
     (destrua os pilares), maré (três faixas) e estouro (três investidas).
   - 14 missões principais novas (os Seis Fragmentos do Selo antes de Ignarok) e
     30 secundárias (relíquias, zonas, alvos com nome).
   ============================================================================= */
// ---------- saves antigos: o mundo cresceu
const F157=Math.sqrt(3),OLDC=REG.map(r=>[r.c[0]/F157,r.c[1]/F157]);
function regionOld(x,z){const wx=x+(fbm(x*.008+11,z*.008,3)-.5)*90,wz=z+(fbm(x*.008,z*.008+5,3)-.5)*90;let b=0,mn=1e9;for(let i=0;i<REG.length;i++){const d=hy(wx-OLDC[i][0],wz-OLDC[i][1])*REG[i].k;if(d<mn){mn=d;b=i}}return b}
function remapOld(x,z){const i=regionOld(x,z);return[x+(F157-1)*OLDC[i][0],z+(F157-1)*OLDC[i][1]]}
const _startClass157=startClass;startClass=function(){P.st.map152=1;P.st.map157=1;return _startClass157.apply(this,arguments)};
const _w3l157=world3Load;world3Load=function(){const ox=P.x,oz=P.z,mig=!P.st.map157;_w3l157();if(!mig)return;P.st.map157=1;
  if(Math.abs(ox)>358||Math.abs(oz)>358){const w=WP[0];P.x=w.x;P.z=w.z+3}else[P.x,P.z]=remapOld(ox,oz);
  const o=[...FOG];FOG.clear();for(const k of o){const[a,b]=k.split(',').map(Number),[nx,nz]=remapOld(a*10-375,b*10-375);FOG.add(Math.floor((nx+WMH)/10)+','+Math.floor((nz+WMH)/10))}};

// ---------- lugares novos (marcos nas regiões de dentro, covis nas de fora)
const W4=[
  {r:'vila',k:'farm',n:'Fazenda Abandonada',x:-122,z:-44,wp:['vila2','Colina dos Pastores',71,-84]},
  {r:'plan',k:'fort',n:'Forte da Estrada',x:152,z:421,wp:['plan2','Trigais do Leste',247,260]},
  {r:'flor',k:'fairy',n:'Círculo das Fadas',x:462,z:-131,wp:['flor2','Prado das Fadas',493,-58]},
  {r:'mata',k:'druid',n:'Pedras dos Druidas',x:-133,z:-412,wp:['mata2','Clareira das Corujas',98,-136]},
  {r:'mang',k:'drown',n:'Vila Afogada',x:-439,z:-133,wp:['mang2','Charco Profundo',-363,241]},
  {r:'cald',k:'forge',n:'Forja dos Anões',x:485,z:-359,wp:['cald2','Fendas de Magma',308,-507]},
  {r:'outono',k:'lair_out',n:'Trono de Sylvara',x:-503,z:-162,wp:['outono2','Vale das Folhas',-554,-223],boss:'sylvara'},
  {r:'neve',k:'lair_neve',n:'Cripta Gélida de Vorn',x:-183,z:-573,wp:['neve2','Passo do Vento',-173,-495],boss:'vorn'},
  {r:'savana',k:'lair_sav',n:'Pedra do Rei',x:597,z:352,wp:['savana2','Poço das Manadas',568,-62],boss:'juba'},
  {r:'deserto',k:'lair_des',n:'Ninho do Imperador',x:191,z:548,wp:['deserto2','Oásis Perdido',173,471],boss:'sarkhan'},
  {r:'costa',k:'lair_cos',n:'Recife do Colosso',x:135,z:540,wp:['costa2','Enseada dos Naufrágios',-312,579],boss:'carapaca'},
  {r:'cristal',k:'lair_cri',n:'Fenda do Vazio',x:-564,z:165,wp:['cristal2','Geodo Cantante',-370,580],boss:'nihil'}];
// construções (cada uma com cara própria)
const W4B={
  farm(t){house(t,5.5,4.5,0xd8c8a8,0x8a3a2a);t.b(4,3,3.4,-8,1.5,1,0x8a5a2a,{g:1}).b(4.6,.35,4,-8,3.1,1,0x6a3a20).b(1.6,2,.12,-8,1,2.75,0x4a2a14);t.col(-8,1,2.4);
    for(let i=-4;i<=4;i++)t.b(.16,1,.16,i*2,.5,8,0x6a4a2a,{g:1});t.b(16.2,.12,.1,0,.7,8,0x7a5a32).b(16.2,.12,.1,0,.35,8,0x7a5a32);
    for(let r=0;r<4;r++)for(let c=0;c<6;c++)t.b(.9,.45+(c%2)*.2,.9,-6+c*2.4,.25,-7-r*1.7,r%2?0xc8a040:0x9ab84a);for(const[x,z]of[[5,3],[6.4,1.4],[-4,5]])t.b(1.3,1,1.3,x,.5,z,0xe8c860,{g:1});
    t.b(.5,4,.5,7,2,-3,0x5a3a20,{g:1}).b(2.2,.2,.2,7,3.6,-3,0x5a3a20);crate(t,4,-1,1);barrel(t,3,1);bookStand(t,3,4)},
  fort(t){const S_=0x9a9488,D=0x7a746a;for(const[x,z,w,d]of[[0,-11,22,1.6],[-11,0,1.6,22],[11,0,1.6,22],[-7,11,8,1.6],[7,11,8,1.6]]){t.b(w,4.5,d,x,2.25,z,S_,{g:1});for(let i=0;i<Math.max(w,d)/2;i++)t.b(w>d?.9:d>w?1.8:.9,.8,w>d?1.8:.9,x+(w>d?-w/2+1+i*2:0),4.9,z+(d>w?-d/2+1+i*2:0),D);t.col(x,z,Math.max(w,d)*.18)}
    for(const[x,z]of[[-11,-11],[11,-11],[-11,11],[11,11]]){t.b(3.6,7,3.6,x,3.5,z,D,{g:1}).b(4.2,.6,4.2,x,7.3,z,S_);t.col(x,z,2)}
    t.b(.2,5,.2,-11,9.8,-11,0x5a3a20).b(1.6,1,.08,-10.2,11.5,-11,0xc0302a);t.b(.2,5,.2,11,9.8,11,0x5a3a20).b(1.6,1,.08,11.8,11.5,11,0xc0302a);tent(t,-4,-5,.4,0x8a2a2a);crate(t,5,-6,1);crate(t,6,-4.6,.8);barrel(t,4,4);lamp(t,-3,9,0xffb050);lamp(t,3,9,0xffb050);bookStand(t,0,-7)},
  fairy(t){for(let i=0;i<9;i++){const a=i/9*TAU,x=C(a)*10,z=S(a)*10;t.b(1.2,2.6+(i%3)*.5,1,x,1.3,z,0xc8c4bc,{g:1,ry:a});t.e_(.5,.5,.5,x,3.4+(i%3)*.5,z,i%2?0xffa8e0:0xa8f0ff);t.col(x,z,.8)}
    for(let i=0;i<14;i++){const a=i*1.7,r=4+(i%4)*1.4;t.b(.25,.5,.25,C(a)*r,.25,S(a)*r,0xe8e0d0);t.e_(.7,.3,.7,C(a)*r,.6,S(a)*r,i%2?0xff7ad0:0x9ae8ff)}t.b(2,1,2,0,.5,0,0xd8d0c0,{g:1});t.e_(1,1,1,0,1.6,0,0xfff0a0,{rx:.785,rz:.785});bookStand(t,2.4,1.6)},
  druid(t){for(let i=0;i<6;i++){const a=i/6*TAU,x=C(a)*9,z=S(a)*9,x2=C(a+.42)*9,z2=S(a+.42)*9;t.b(1.4,5,1.2,x,2.5,z,0x8a8a80,{g:1,ry:a});t.b(1.4,5,1.2,x2,2.5,z2,0x8a8a80,{g:1,ry:a});t.b(4.4,1.1,1.4,(x+x2)/2,5.5,(z+z2)/2,0x7a7a70,{ry:-a-.21+PI/2});t.col(x,z,.9);t.col(x2,z2,.9)}
    t.b(3.2,1,2,0,.5,0,0x6a6a62,{g:1});t.e_(.5,.08,.5,0,1.05,0,0x7dffb0);for(let i=0;i<5;i++)t.f_(1.6,1,1.6,C(i*1.3)*13,.5,S(i*1.3)*13,0x3a8a3a);bookStand(t,-2.4,-1.6)},
  forge(t){t.b(12,.4,10,0,.2,0,0x5a5048,{g:1});t.b(4,4,3,-3,2,-3,0x4a403a,{g:1}).b(2.4,1.2,.2,-3,1.2,-1.45,0x1a1010);t.e_(2,.9,.3,-3,1,-1.4,0xff6a1a);t.b(1,5,1,-4.4,6,-3.6,0x3a3430);t.col(-3,-3,2.2);
    t.b(2,1,1,3,1,1,0x3a3a40,{g:1}).b(1,.8,.7,3,.4,1,0x2a2a30).b(2.6,.3,1.2,3,1.6,1,0x4a4a52);t.col(3,1,1.2);for(let i=0;i<4;i++)t.e_(1.6,.15,1.6,-6+i*3.6,.42,5,0xff5a1a);
    for(const[x,z]of[[-6,-5],[6,-5],[-6,4.5],[6,4.5]]){t.b(1.2,6,1.2,x,3,z,0x5a5048,{g:1});t.col(x,z,.8)}t.b(13,.6,1.4,0,6.3,-5,0x4a4038);barrel(t,5,-3);crate(t,6,-1,1);bookStand(t,0,3)},
  lair_out(t){for(let i=0;i<10;i++){const a=i/10*TAU,x=C(a)*15,z=S(a)*15;t.b(1.6,3+(i%3),1.6,x,1.5,z,0x5a3020,{g:1});t.f_(3.6,2.4,3.6,x,4.6+(i%3),z,i%2?0xe0501a:0xff8a2a);t.col(x,z,1.2)}
    t.b(5,1,3,0,.5,-17,0x4a2a18,{g:1}).b(5,5,1,0,3,-18.4,0x5a3020).b(1.2,4,1.2,-2.6,2.5,-17,0x5a3020).b(1.2,4,1.2,2.6,2.5,-17,0x5a3020);t.f_(6,2,3,0,6,-18,0xe0401a);t.col(0,-17.6,2.6);
    for(let i=0;i<30;i++)t.b(.8,.06,.6,C(i*2.3)*(3+i%9),.03,S(i*2.3)*(3+i%9),[0xe0601a,0xc83a1a,0xffa030][i%3],{ry:i});bookStand(t,4,-15)},
  lair_neve(t){for(let i=0;i<10;i++){const a=i/10*TAU,x=C(a)*15,z=S(a)*15;t.b(1.4,5+(i%3)*1.5,1.4,x,2.5+(i%3)*.75,z,0xcfe8f4,{g:1,ry:a});t.e_(.6,1.4,.6,x,6+(i%3)*1.5,z,0x9ae8ff,{ry:a});t.col(x,z,1)}
    t.b(5,1.4,3,0,.7,-17,0xbfdcec,{g:1}).b(5,6,1,0,3.4,-18.4,0xa8cce0).b(1,5,1,-2.6,2.6,-17,0xa8cce0).b(1,5,1,2.6,2.6,-17,0xa8cce0);t.e_(1.2,1.2,1.2,0,6.9,-18.4,0x7df0ff,{rx:.785,rz:.785});t.col(0,-17.6,2.6);
    for(let i=0;i<8;i++)t.e_(.5,1.4+(i%3)*.6,.5,C(i*.9)*7,.7,S(i*.9)*7,0xbff4ff,{rz:.3});bookStand(t,4,-15)},
  lair_sav(t){t.b(16,4,10,0,2,-16,0x9a6a3a,{g:1}).b(10,3,7,-2,5.5,-17,0xa87a4a).b(6,2,5,-4,8,-18,0xb08a52).b(5,.8,3,-6,9.4,-15,0xb08a52);t.col(-4,-16,5.5);t.col(4,-15,4);
    for(let i=0;i<12;i++){const a=i*1.3,r=6+(i%5)*2;t.b(.25,.25,1.4,C(a)*r,.12,S(a)*r,0xf0e8d8,{ry:a})}for(const[x,z]of[[12,4],[-13,6],[9,-9]]){t.b(.5,4,.5,x,2,z,0x6a4a2a,{g:1});t.f_(5,.8,5,x,4.3,z,0x7a8a2a);t.col(x,z,.5)}bookStand(t,6,-9)},
  lair_des(t){for(let i=0;i<8;i++){const a=i/8*TAU+.2,x=C(a)*15,z=S(a)*15,h=4+(i%3)*2;t.b(1.6,h,1.6,x,h/2-1,z,0xd8b878,{g:1,rz:(i%2?.12:-.1)});t.b(1.2,1.2,1.2,x,h-.6,z,0xe8c888,{rx:.785,rz:.785});t.col(x,z,1.1)}
    for(let i=0;i<4;i++)t.b(10-i*2,1,6-i,0,.5+i,-18,i%2?0xd0b070:0xc8a868,{g:!i});t.e_(1,1,.2,0,4.6,-15.4,0xffc030);t.col(0,-18,4);for(let i=0;i<14;i++)t.b(.9,.4,.9,C(i*2.1)*(5+i%7),.2,S(i*2.1)*(5+i%7),0xe8d098,{ry:i});bookStand(t,5,-12)},
  lair_cos(t){t.b(3,3,14,-10,1,-4,0x5a3a22,{g:1,rz:.35}).b(.4,8,.4,-10,5,-4,0x4a3020,{rz:.35}).b(5,3,.1,-9,6.4,-4,0xe8dcc0,{rz:.35});for(let i=0;i<5;i++)t.b(3.2,.3,.4,-10,.6+i*.55,-10+i*3,0x6a4a2a,{rz:.35});t.col(-10,-4,2.8);t.col(-10,2,2.4);
    for(let i=0;i<9;i++){const a=i/9*TAU,x=C(a)*16,z=S(a)*16;t.b(3+(i%3),2+(i%2)*1.6,2.6,x,1,z,0x6a6e74,{g:1,ry:a});t.col(x,z,1.6)}for(let i=0;i<16;i++)t.b(.4,.2,.4,C(i*1.9)*(4+i%8),.1,S(i*1.9)*(4+i%8),[0xffc0d8,0xf0e8d8,0xffa080][i%3]);bookStand(t,6,-12)},
  lair_cri(t){for(let i=0;i<12;i++){const a=i/12*TAU,x=C(a)*15,z=S(a)*15,h=4+(i%4)*1.6;t.b(1.2,h,1.2,x,h/2,z,0x3a3058,{g:1,ry:a});t.e_(.7,h*.8,.7,x+.2,h*.55,z,i%2?0xc08aff:0x9ae8ff,{ry:a,rz:.15});t.col(x,z,1)}
    t.b(4,1,4,0,.5,-16,0x2a2440,{g:1});t.e_(2,2,2,0,2.6,-16,0x1a0a2a,{rx:.785,rz:.785});t.e_(2.6,.2,2.6,0,1.1,-16,0xb07aff);t.col(0,-16,2.4);for(let i=0;i<10;i++)t.e_(.4,.9,.4,C(i*1.4)*(4+i%6),.45,S(i*1.4)*(4+i%6),0xd8a8ff,{rz:.3});bookStand(t,5,-12)}};
// Vila Afogada: casas sobre palafitas meio submersas e passarelas
W4B.drown=t=>{for(const[x,z,ry]of[[-6,-4,.3],[5,-5,-.5],[0,6,.2]]){for(const sx of[-1,1])for(const sz of[-1,1])t.b(.3,3.4,.3,x+sx*2.1,.6,z+sz*1.7,0x4a3a2a,{g:1});t.b(4.6,2.6,3.6,x,3.4,z,0x6a5a48,{ry});t.b(5.2,.5,4.2,x,4.9,z,0x3a4a3a,{ry});t.b(5.4,.2,4.4,x,2.05,z,0x5a4a34,{ry});t.col(x,z,2.6)}
  for(let i=0;i<8;i++)t.b(1.2,.15,3,-2+i*.4,1.6,-1+i*.9,0x6a5038,{ry:.8});lamp(t,-3,1,0x9aff7a);lamp(t,3,2,0x9aff7a);bookStand(t,1.5,-1)};
for(const L of W4){const lair=L.k.startsWith('lair');flat(L.x,L.z,lair?26:18);
  addStr(L.x,L.z,0,(k,e,f)=>W4B[L.k](new TB(k,e,f,L.x,L.z,0,null,lair?1.25:1.3)));POI.push({n:L.n,x:L.x,z:L.z,r:lair?24:18})}
// pedras de teleporte novas
for(const L of W4){const[id,n,x,z]=L.wp,w={id,n:REG[RI[L.r]].n+' · '+n,x,z,on:0};WP.push(w);flat(x,z,RI[L.r]>=6?13:9);
  addStr(x,z,0,(k,e,f)=>{const t=new TB(k,e,f,x,z,0,null,1.3);t.b(5,.3,5,0,.15,0,0x8a8a84,{g:1}).b(4,.3,4,0,.4,0,0x9a9a94);for(let i=0;i<6;i++){const a=i/6*TAU;t.b(.5,1.4,.5,C(a)*2.3,.9,S(a)*2.3,0x7a7a74)}
    t.b(.8,2.6,.8,0,1.8,0,0x6a6a7a);t.e_(.86,.25,.86,0,2.2,0,0x58c8ff).e_(.86,.25,.86,0,1.2,0,0x58c8ff);t.col(0,0,.8)});
  inter({x,z,r:3.2,ic:'🌀',label:()=>'Pedra de Teleporte',act:()=>openMap(true),kind:'wp',wp:w});
  {const c=new THREE.Mesh(WPCRY[0].geometry,WPCRY[0].material);c.scale.y=1.6;c.userData.w=w;sc.add(c);WPCRY.push(c)}}
// estradas até os lugares novos (só onde não cruzam o rio)
{const cross=(a,b)=>{const L=hy(b[0]-a[0],b[1]-a[1]);for(let t=0;t<=L;t+=2)if(riverD(a[0]+(b[0]-a[0])*t/L,a[1]+(b[1]-a[1])*t/L)<10)return true;return false};
  for(const L of W4){if(L.r=='vila')continue;const c=REG[RI[L.r]].c;for(const p of[[L.x,L.z],[L.wp[2],L.wp[3]]]){if(!cross(c,p))ROADS.push([[c[0],c[1]],p])}}}
// diários nos lugares novos
const W4LORE={farm:'"Os lobos vieram três noites seguidas. Tocamos os sinos e ninguém veio. Levamos as ovelhas para a vila e deixamos o resto." — Família Alves',
  fort:'"Forte da Estrada, ano 3 depois da Guerra das Brasas: os bandidos tomaram a torre leste. Erguemos os estandartes para pedir reforço. Nenhum chegou."',
  fairy:'"Quando os cogumelos lunares se apagam, as fadas esquecem o caminho de casa. Acenda-os e elas lembram." — escrito em letra miúda, quase luz',
  druid:'"Seis pedras, seis runas. Quem as despertar ouvirá o que a floresta lembra da Sombra." — Círculo dos Druidas',
  drown:'"A água subiu numa única noite. Os lampiões ainda acendem sozinhos, chamando quem se afogou." — placa meio podre',
  forge:'"Aqui forjamos a corrente que prendeu Ignarok. Se os foles apagarem, a corrente esfria e enfraquece." — gravado em rúnico anão',
  lair_out:'"Sylvara cuidava do bosque. A Sombra lhe prometeu folhas que nunca caem — e ela aceitou. Agora tudo cai, menos ela." — Rúbia',
  lair_neve:'"Vorn guardava o fragmento do selo no mosteiro. Morreu de frio esperando ajuda e voltou para guardá-lo de todos." — Monge Tashi',
  lair_sav:'"O Rei Juba-de-Fogo nunca perdeu uma caçada. Desde que o fragmento caiu na sua pedra, ele caça tudo o que se move." — Yara',
  lair_des:'"Sarkhan dorme sob a areia com o fragmento do selo preso no ferrão. Nenhuma caravana passa mais pelo oásis." — Nefra',
  lair_cos:'"O caranguejo que engoliu o navio do meu pai tem uma luz azul na carapaça. É o fragmento. Eu sei que é." — Bento',
  lair_cri:'"Nihil não é um homem. É o que sobra quando um cristal canta o nome de ninguém. Ele guarda o último fragmento." — Ixa'};
for(const L of W4){const off={farm:[3,4],fort:[0,-7],fairy:[2.4,1.6],druid:[-2.4,-1.6],drown:[1.5,-1],forge:[0,3],lair_out:[4,-15],lair_neve:[4,-15],lair_sav:[6,-9],lair_des:[5,-12],lair_cos:[6,-12],lair_cri:[5,-12]}[L.k],m=L.k.startsWith('lair')?1.25:1.3;
  const lo={id:'w4_'+L.k,t:L.n,x:L.x+off[0]*m,z:L.z+off[1]*m,txt:W4LORE[L.k]};LORE.push(lo);inter({x:lo.x,z:lo.z,r:2.6,ic:'📖',label:()=>lo.t,act:()=>readLore(lo),kind:'lore'})}

// ---------- chefes novos
Object.assign(MDL,{b_sylvara:()=>hum({skin:0xd8a080,hair:0xc83a1a,hairS:'long',shirt:0x6a1a12,robe:0x8a2a14,pants:0x3a1a10,trim:0xffb040,branches:1,leaf:0xe0501a,glowEyes:0xffa040})});
const mtA=k=>MT[k]&&MT[k].atk||'slashA';
Object.assign(BOSS,{
  sylvara:{n:'Sylvara, a Dríade Carmesim',m:'b_sylvara',w:'staff',hp:2000,dmg:24,sp:3.6,rg:11,cd:1.7,xp:1600,x:-503,z:-162,lv:11,ab:['roots','volley','blink','summon'],ab2:['pools','spiral','shield','frostring'],sum:'redwolf',proj:'orb',pc:0xff7a2a,r:1,sc:1.5,atk:'cast'},
  vorn:{n:'Vorn, o Lich do Gelo',m:'iceskel',w:'staff',hp:3600,dmg:36,sp:3.2,rg:11,cd:1.8,xp:3400,x:-183,z:-573,lv:20,ab:['volley','blink','summon','frostring'],ab2:['nova','spiral','shield','pools'],sum:'iceskel',proj:'orb',pc:0x9ae8ff,r:1.2,sc:1.9,atk:mtA('iceskel')},
  juba:{n:'Juba-de-Fogo, o Rei da Savana',m:'lion',hp:1700,dmg:22,sp:5,rg:3.4,cd:1.4,xp:1400,x:597,z:352,lv:10,ab:['charge','slam','summon'],ab2:['stampede','sweep','quake','frostring'],sum:'hyena',r:2,sc:1.7,atk:mtA('hyena')},
  sarkhan:{n:'Sarkhan, o Escorpião-Imperador',m:'scorp',hp:3000,dmg:31,sp:4,rg:3.6,cd:1.6,xp:2700,x:191,z:548,lv:17,ab:['charge','poison','summon'],ab2:['tidal','pools','sweep','shield'],sum:'scorp',pc:0xffb030,r:2.4,sc:2.6,atk:mtA('scorp')},
  carapaca:{n:'Carapaça, o Caranguejo Colossal',m:'crab',hp:2400,dmg:27,sp:3.8,rg:3.6,cd:1.6,xp:2100,x:135,z:540,lv:13,ab:['charge','slam','summon'],ab2:['tidal','stampede','sweep','nova'],sum:'crab',pc:0x5ab8ff,r:2.6,sc:3,atk:mtA('crab')},
  nihil:{n:'Nihil, o Arauto do Vazio',m:'skelmage',w:'staff',hp:4200,dmg:40,sp:3.4,rg:12,cd:1.7,xp:4200,x:-564,z:165,lv:22,ab:['volley','blink','summon','poison'],ab2:['spiral','nova','shield','frostring','meteors'],sum:'skelmage',proj:'orb',pc:0xc08aff,r:1.2,sc:1.9,atk:'cast'}});
// os chefes antigos também ganham golpes novos na fase II
BOSS.capitao.ab2.push('stampede');BOSS.rainha.ab2.push('tidal');BOSS.anciao.ab2.push('shield');BOSS.bruxa.ab2.push('shield');BOSS.ignarok.ab2.push('frostring');
const _mkMob157=mkMob;mkMob=function(type){const e=_mkMob157.apply(this,arguments);const B=BOSS[type];if(e&&B&&B.sc&&!e.minion)e.m.g.scale.multiplyScalar(B.sc);return e};
Object.assign(BDUR,{frostring:1.9,shield:1.2,tidal:2.2,stampede:3.6});Object.assign(BCD,{frostring:9,shield:38,tidal:10,stampede:12});
Object.assign(BNAME,{frostring:'Onda de choque — pule!',shield:'Escudo de pilares',tidal:'Maré',stampede:'Estouro'});
const _bossStart2_157=bossStart2;bossStart2=function(e,k,dx,dz,d){const T=e.t,c=T.pc||0xff7a2a;
  if(k=='shield'){if(e.shT&&e.shT.some(t=>!t.dead)){e.act=null;return}pop('Escudo de pilares! Destrua os pilares',P.x,P.y+3.6,P.z,'#c8a8ff',1);e.shT=[];
    for(let i=0;i<3;i++){const a=i/3*TAU+R(),x=e.home[0]+C(a)*10,z=e.home[1]+S(a)*10;const t=mkMob('totem',x,z,{lv:e.lv,minion:1,ch:e.ch,name:'Pilar do '+T.n.split(',')[0]});t.hp=t.mx=Math.max(60,e.mx*.045);t.st='chase';t.hx=x;t.hz=z;t.cd=1e9;e.shT.push(t);
      column(x,z,c,8,1,.6);bolt({x:e.x,y:e.y+2,z:e.z},{x,y:groundAt(x,z)+2,z})}e.inv=2;snd(160,.8,'sawtooth');return}
  if(k=='frostring'){pop(BNAME.frostring,P.x,P.y+3.6,P.z,'#ffd070',1);ring(e.x,e.z,3,c,.5);flash(e.x,e.y+1,e.z,c,6,.4);snd(120,.6,'sawtooth');return}
  if(k=='tidal'){pop('Maré!',P.x,P.y+3.6,P.z,'#9ae4ff');const an=Math.atan2(dx,dz),px=C(an),pz=-S(an);for(const lane of[-5,0,5])for(let i=1;i<=7;i++){const x=e.x+S(an)*i*3+px*lane,z=e.z+C(an)*i*3+pz*lane;
      tele(x,z,2.2,.8+i*.12,T2=>{fx(T2.x,groundAt(T2.x,T2.z)+.4,T2.z,c,12,6,.22,.9);puff(T2.x,groundAt(T2.x,T2.z)+.5,T2.z,0xd8ecff,1.4);if(hy(P.x-T2.x,P.z-T2.z)<2.3)hitPlayer(e.dmg*.7,{kb:3,src:e})},c)}return}
  if(k=='stampede'){pop('Estouro! Três investidas',P.x,P.y+3.6,P.z,'#ffb070');e.act.hs=[0,0,0];return}
  return _bossStart2_157.apply(this,arguments)};
const _bossAct2_157=bossAct2;bossAct2=function(e,dt,p,d,dx,dz){const a=e.act,T=e.t,c=T.pc||0xff7a2a;
  if(a.k=='frostring'){a.mv=[0,0];a.vt=(a.vt||0)-dt;const waves=e.ph>=3?[p,p-.32]:[p];for(let w=0;w<waves.length;w++){const q=waves[w];if(q<0||q>1)continue;const r=2+q*18;
      if(a.vt<=0)ring(e.x,e.z,r,c,.14,0);const dd=hy(P.x-e.x,P.z-e.z);a.hit=a.hit||[];if(!a.hit[w]&&Math.abs(dd-r)<1.1&&!P.air&&!(P.dash>0)&&!(P.roll>0)){a.hit[w]=1;hitPlayer(e.dmg*.9,{kb:4,src:e})}}if(a.vt<=0)a.vt=.07;return}
  if(a.k=='shield'){a.mv=[0,0];return}
  if(a.k=='tidal'){a.mv=[0,0];e.f=angStep(e.f,Math.atan2(dx,dz),dt*3);return}
  if(a.k=='stampede'){const s=Math.min(2,Math.floor(p*3)),q=p*3-s;if(q<.35){a.mv=[0,0];e.f=angStep(e.f,Math.atan2(dx,dz),dt*8);a.dx=0}else{if(!a.dx){a.dx=S(e.f);a.dz=C(e.f);ring(e.x,e.z,2,0xffb070,.3)}a.mv=[a.dx*e.sp*4.6,a.dz*e.sp*4.6];if(ev(2))fx(e.x,e.y+.3,e.z,0x9a8a7a,3,4,.25,.5);
      if(!a.hs[s]&&d<e.r+1.6){a.hs[s]=1;hitPlayer(e.dmg*1.2,{src:e,kb:6})}}return}
  return _bossAct2_157.apply(this,arguments)};
// escudo: enquanto houver pilar de pé o chefe fica imune; ao cair o último, fica atordoado e vulnerável
const _bossUpd157=bossUpd;bossUpd=function(e,dt,t,d,dx,dz){if(e.shT){const alive=e.shT.filter(q=>!q.dead);if(alive.length){e.inv=Math.max(e.inv||0,.5);if(ev(4)){ring(e.x,e.z,e.r+1.6,e.t.pc||0xc08aff,.2);for(const q of alive)if(ev(3))bolt({x:q.x,y:q.y+2,z:q.z},{x:e.x,y:e.y+2,z:e.z})}
    if(BOSSON===e)e.hp=Math.min(e.mx,e.hp+e.mx*.006*dt)}
  else{e.shT=null;e.inv=0;e.stun=Math.max(e.stun||0,4);e.vul=6;e.vulK=.5;banner('ESCUDO QUEBRADO!');pop('Vulnerável!',e.x,e.y+4,e.z,'#ffe08a',1);flash(e.x,e.y+2,e.z,0xffffff,8,.4);ring(e.x,e.z,8,0xffe08a,.6);SHK=Math.max(SHK,.6)}}
  return _bossUpd157.apply(this,arguments)};

// ---------- missões
Object.assign(QOC,{sino:[0xffd060,'Sino da Fazenda','🔔'],feno:[0xe8c860,'Fardo de Feno','🌾'],estandarte:[0xd8402a,'Estandarte do Forte','🚩'],cogumelo:[0xff9ae0,'Cogumelo Lunar','🍄'],runa:[0x7dffb0,'Runa Druídica','🔷'],
  lampiao:[0x9aff7a,'Lampião Afogado','🏮'],fole:[0xff8a2a,'Fole Anão','🔥'],semente:[0xff6a2a,'Semente Rubra','🌰'],braseiro:[0xffb040,'Braseiro Votivo','🔥'],totemcaca:[0xd8a040,'Totem da Caça','🪶'],
  urna:[0xffd070,'Urna Solar','⚱️'],ancora:[0x5ab8ff,'Âncora de Sinal','⚓'],prisma:[0xc08aff,'Prisma Partido','💎']});
const BRB=typeof BR!='undefined'?BR:'Ancião Bram',BIB=typeof BI!='undefined'?BI:'🧙';
const rel=(L,n,rad)=>{const o=[];for(let i=0;i<n;i++){const a=i/n*TAU+.6;o.push([Math.round(L.x+C(a)*rad),Math.round(L.z+S(a)*rad)])}return o};
const W4Q=[];
// principais: os Seis Fragmentos do Selo
W4Q.push({id:'mf0',cat:'main',reg:'vila',n:'Os Fragmentos do Selo',d:'Morgra caiu, mas Ignarok desperta. Volte à vila e fale com o Ancião Bram.',t:'talk',npc:'bram',req:['m12'],rw:{xp:900,gold:200},
  done:[[BRB,'Kael, o selo de Aldor tinha seis fragmentos. A Sombra os espalhou pelas terras de fora e corrompeu quem os guardava.',BIB],[BRB,'Enquanto os fragmentos estiverem nas mãos deles, nenhuma lâmina fere Ignarok. Reúna os seis. As Pedras de Teleporte dos confins vão te ajudar.',BIB]]});
const FRAG4=[['outono','sylvara','druida','Rúbia'],['savana','juba','yara','Yara'],['costa','carapaca','bento','Bento'],['deserto','sarkhan','nefra','Nefra'],['neve','vorn','monge','Tashi'],['cristal','nihil','ixa','Ixa']];
for(const[rid,b,npc,nn]of FRAG4){const L=W4.find(q=>q.r==rid),R_=REG[RI[rid]],lv=BOSS[b].lv,xp=Math.round(800+lv*160),gd=Math.round(150+lv*30);
  W4Q.push({id:'mf_'+rid+'1',cat:'main',reg:rid,n:'Confins: '+L.wp[1],d:'Atravesse '+R_.n+' até a Pedra de Teleporte '+L.wp[1]+', nos confins da região.',t:'wp',wp:L.wp[0],req:['mf0'],rw:{xp:Math.round(xp*.35),gold:gd},
    done:[[KN,'Daqui dá para ver '+L.n+'. É lá que está o fragmento.',KA]]},
    {id:'mf_'+rid+'2',cat:'main',reg:rid,n:BOSS[b].n.split(',')[0]+': o Fragmento',d:'Derrote '+BOSS[b].n+' em '+L.n+' e recupere o fragmento do selo.',t:'boss',boss:b,req:['mf_'+rid+'1'],rw:{xp,gold:gd*2,item:2},
      done:[['Narrador','O fragmento do selo se solta e flutua até a sua mão, morno como brasa.','✨'],[nn,'Você libertou '+R_.n+'. Leve o fragmento ao Ancião Bram quando tiver os seis.',NPC3.find(q=>q[0]==npc)?NPC3.find(q=>q[0]==npc)[3]:'❗']]})}
W4Q.push({id:'mselo',cat:'main',reg:'vila',n:'O Selo Restaurado',d:'Leve os seis fragmentos ao Ancião Bram, em Pedraverde.',t:'talk',npc:'bram',req:FRAG4.map(f=>'mf_'+f[0]+'2'),rw:{xp:3000,gold:800,item:2},
  done:[[BRB,'Os seis! O selo de Aldor brilha como no primeiro dia.',BIB],[BRB,'Agora Ignarok pode sangrar. Suba até a Caldeira de Brasas — e volte vivo, Guardião.',BIB]]});
// secundárias: relíquias, zona e alvo com nome em cada lugar novo
const SIDE={vila:['sino','Os Sinos dos Alves','Toque os 3 sinos de alarme da Fazenda Abandonada.','feno','Feno para o Inverno','Junte 6 fardos de feno espalhados pela fazenda.','wolf','Dente-Cinza, o Lobo da Fazenda'],
  plan:['estandarte','Estandartes Caídos','Erga os 3 estandartes do Forte da Estrada.',null,'Retomar o Forte','Derrote 14 inimigos em volta do Forte da Estrada.','bbrute','Mão-de-Ferro, o Carcereiro'],
  flor:['cogumelo','Luz das Fadas','Acenda os 3 cogumelos lunares do Círculo das Fadas.',null,'Pragas no Prado','Derrote 14 inimigos perto do Círculo das Fadas.','golem','Musgo-Antigo, o Golem Florido'],
  mata:['runa','O Que a Floresta Lembra','Desperte as 3 runas das Pedras dos Druidas.',null,'Guardiões das Pedras','Derrote 14 inimigos perto das Pedras dos Druidas.','spider','Viúva-Pálida'],
  mang:['lampiao','Lampiões dos Afogados','Apague os 3 lampiões que chamam os afogados.',null,'Lodo Vivo','Derrote 14 inimigos na Vila Afogada.','zbrute','Glutão do Pântano'],
  cald:['fole','Foles da Corrente','Reacenda os 3 foles da Forja dos Anões.',null,'Brasas Rebeldes','Derrote 14 inimigos perto da Forja dos Anões.','imp','Pavio, o Diabrete Ancestral'],
  outono:['semente','Sementes Rubras','Plante de volta as 3 sementes rubras no Vale das Folhas.',null,'O Vale das Folhas','Derrote 14 inimigos perto do Vale das Folhas.'],
  neve:['braseiro','Braseiros do Passo','Acenda os 3 braseiros votivos do Passo do Vento.',null,'Nevasca de Garras','Derrote 14 inimigos perto do Passo do Vento.'],
  savana:['totemcaca','Totens da Caça','Desperte os 3 totens de caça do Poço das Manadas.',null,'Rondas no Poço','Derrote 14 inimigos perto do Poço das Manadas.'],
  deserto:['urna','Urnas do Oásis','Abra as 3 urnas solares do Oásis Perdido.',null,'Areia e Ferrões','Derrote 14 inimigos perto do Oásis Perdido.'],
  costa:['ancora','Âncoras de Sinal','Ice as 3 âncoras de sinal da Enseada dos Naufrágios.',null,'Saqueadores da Enseada','Derrote 14 inimigos perto da Enseada dos Naufrágios.'],
  cristal:['prisma','Prismas Partidos','Junte os 3 prismas partidos do Geodo Cantante.',null,'O Geodo Desperto','Derrote 14 inimigos perto do Geodo Cantante.']};
for(const L of W4){const s=SIDE[L.r],R_=REG[RI[L.r]],lv=R_.lv,xp=Math.round(300+lv*80),gd=Math.round(60+lv*18),outer=RI[L.r]>=6,ax=outer?L.wp[2]:L.x,az=outer?L.wp[3]:L.z,id='s4_'+L.r;
  const disc=L.r=='vila'?undefined:L.r;
  W4Q.push({id:id+'a',cat:'side',reg:L.r,n:s[1],d:s[2],t:'interact',obj:s[0],n_:3,pts:rel({x:ax,z:az},3,outer?16:13),disc,req:L.r=='vila'?['m1']:undefined,rw:{xp,gold:gd,item:1}});
  if(s[3])W4Q.push({id:id+'b',cat:'side',reg:L.r,n:s[4],d:s[5],t:'collect',obj:s[3],n_:6,at:[ax,az],spread:18,req:['m1'],rw:{xp:Math.round(xp*.8),gold:gd}});
  else W4Q.push({id:id+'b',cat:'side',reg:L.r,n:s[4],d:s[5],t:'zone',at:[ax,az],r:34,n_:14,disc,rw:{xp:Math.round(xp*1.1),gold:gd,item:1}});
  if(s[6])W4Q.push({id:id+'c',cat:'side',reg:L.r,n:s[7],d:'Um inimigo terrível ronda '+L.n+'. Encontre e derrote '+s[7]+'.',t:'hunt',mob:s[6],at:[Math.round(L.x+12),Math.round(L.z+10)],nm:s[7],n_:1,req:[id+'a'],rw:{xp:Math.round(xp*1.6),gold:gd*2,item:2}})}
for(const q of W4Q){for(const k in q)if(q[k]===undefined)delete q[k];QD.push(q)}
QIDX.m13.req=['mselo'];QIDX.m13.d='Com o selo restaurado, suba até a Caldeira de Brasas (nordeste) e derrote Ignarok antes que ele alcance Pedraverde.';
for(const q of QD)if(!QS[q.id]){QS[q.id]={st:0,p:0,got:[]};QIDX[q.id]=q}
