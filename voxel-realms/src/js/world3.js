'use strict';
/* =============================================================================
   VOXEL REALMS · terras novas, teleportes, eventos e grama que se mexe (15.2)
   O mundo ficou com área três vezes maior: um anel externo com Bosque Carmesim,
   Picos Gelados, Savana Rubra, Dunas de Âmbar, Costa das Conchas e Vale de
   Cristal — cada um com relevo, cores, árvores, detalhes, clima, monstros,
   animais, pedra de teleporte, construção marcante, NPC e missões próprias.
   Enquanto você explora acontecem eventos aleatórios (caravana atacada, tesouro
   enterrado, chuva de meteoros, santuário perdido, fera lendária).
   ============================================================================= */
// ---------- criaturas novas: variações recoloridas dos modelos existentes
function tintModel(m,hex,k,keep){const c=new THREE.Color(hex);m.g.traverse(o=>{if(!o.isMesh||!o.geometry.attributes.color)return;const a=o.geometry.attributes.color;
  for(let i=0;i<a.count;i++){const r=a.getX(i),g=a.getY(i),b=a.getZ(i),mx=Math.max(r,g,b);if(keep&&mx-Math.min(r,g,b)>.42&&mx>.5)continue;const l=Math.min(1,(r*.3+g*.59+b*.11)*1.7);a.setXYZ(i,lerp(r,c.r*l,k),lerp(g,c.g*l,k),lerp(b,c.b*l,k))}a.needsUpdate=true});return m}
const TV=(base,hex,k,keep,sc)=>(...a)=>{const m=tintModel(MDL[base](...a),hex,k,keep);if(sc)m.g.scale.multiplyScalar(sc);return m};
Object.assign(MDL,{swolf:TV('wolf',0xf4f8fc,.85,1),redwolf:TV('wolf',0xd0502a,.55,1),hyena:TV('wolf',0xc8a060,.6,1,.9),scorp:TV('spider',0xd8983a,.75,1,1.1),crab:TV('spider',0xe8503a,.8,1,.7),
  mummy:TV('zombie',0xe8dcb8,.75,1),yeti:TV('bbrute',0xf0f4fa,.8,1,1.1),pirate:TV('bandit',0x3a4a8a,.35,1),cgolem:TV('golem',0x9a8aff,.7,0,1.1),iceskel:TV('skelmage',0xbfeaff,.45,1),
  sfox:TV('fox',0xf8fafc,.85,1),goat:TV('sheep',0x9a8a7a,.55,1),antelope:TV('deer',0xd88a3a,.5,1),camel:TV('cow',0xd8b070,.75,1,1.15),pcrab:TV('spider',0xff6a4a,.85,1,.35),cfox:TV('fox',0xb8a8ff,.7,1)});
const MTV=(b,o)=>Object.assign({},MT[b],o);
Object.assign(MT,{swolf:MTV('wolf',{n:'Lobo da Neve',m:'swolf',hp:46,dmg:9,xp:16}),redwolf:MTV('wolf',{n:'Lobo Carmesim',m:'redwolf',hp:38,dmg:8,xp:14}),hyena:MTV('wolf',{n:'Hiena Risonha',m:'hyena',hp:30,sp:6.2,xp:12}),
  scorp:MTV('spider',{n:'Escorpião de Âmbar',m:'scorp',hp:56,dmg:12,xp:20}),crab:MTV('spider',{n:'Caranguejo Gigante',m:'crab',hp:48,dmg:10,psn:0,sp:4.2,xp:16}),mummy:MTV('zombie',{n:'Múmia',m:'mummy',hp:84,dmg:13,xp:20}),
  yeti:MTV('bbrute',{n:'Yeti',m:'yeti',w:null,hp:180,dmg:22,xp:40}),pirate:MTV('bandit',{n:'Pirata',m:'pirate',w:'sword',hp:50,xp:17}),cgolem:MTV('golem',{n:'Golem de Cristal',m:'cgolem',hp:200,dmg:23,xp:46}),iceskel:MTV('skelmage',{n:'Esqueleto Glacial',m:'iceskel',xp:24}),
  sfox:MTV('fox',{n:'Raposa do Ártico',m:'sfox'}),goat:MTV('sheep',{n:'Cabra-Montesa',m:'goat'}),antelope:MTV('deer',{n:'Antílope',m:'antelope'}),camel:MTV('cow',{n:'Camelo',m:'camel'}),pcrab:MTV('rabbit',{n:'Caranguejinho',m:'pcrab',r:.3}),cfox:MTV('fox',{n:'Raposa de Cristal',m:'cfox'})});
Object.assign(BESTD,{swolf:'Lobos brancos dos Picos Gelados. Somem na nevasca e atacam pelos lados.',redwolf:'Lobos do Bosque Carmesim, com pelo da cor das folhas.',hyena:'Riem enquanto cercam a presa na savana.',
  scorp:'Escorpiões do tamanho de carroças. O ferrão envenena.',crab:'Guardam a praia de pinças erguidas.',mummy:'Sacerdotes do Templo do Sol que não aceitaram morrer.',yeti:'O senhor das montanhas. Cada soco racha o gelo.',
  pirate:'Saqueadores que chegaram pelo mar e ficaram pela costa.',cgolem:'Cristais vivos que tomaram forma de gigante.',iceskel:'Magos antigos congelados no mosteiro. Lançam orbes de gelo.'});
Object.assign(SPAWN,{outono:['redwolf','spider','bandit','bassassin'],neve:['swolf','yeti','iceskel'],savana:['hyena','boar','bandit','bandarc'],deserto:['scorp','mummy','bandit','skelwar'],costa:['crab','pirate','pirate','slime'],cristal:['cgolem','imp','skelmage','cultist']});
Object.assign(NIGHTB,{outono:['redwolf','ghoul'],neve:['swolf','iceskel'],savana:['hyena','hyena'],deserto:['mummy','mummy'],costa:['pirate','crab'],cristal:['skelmage']});
Object.assign(FAUNA,{outono:['deer','fox','rabbit','wdeer'],neve:['sfox','goat','goat'],savana:['antelope','antelope','cow','rabbit'],deserto:['camel','camel'],costa:['pcrab','pcrab','rabbit'],cristal:['cfox']});
LOOK.push({sat:1.26,shd:[.1,.03,0],fog:0xe0905a,fk:.35,fly:0xffb060},{sat:1.05,shd:[0,.04,.14],fog:0xdce8f4,fk:.5,fly:0xe8f4ff},{sat:1.22,shd:[.12,.05,0],fog:0xf0c080,fk:.25,fly:0xffd070},
  {sat:1.15,shd:[.12,.06,0],fog:0xf4dcb0,fk:.3,fly:0xffe8a0},{sat:1.2,shd:[0,.06,.12],fog:0xbfe4f4,fk:.2,fly:0xc8ffd8},{sat:1.3,shd:[.08,0,.18],fog:0x9a88d8,fk:.45,fly:0xb8a8ff});
// ---------- horizonte (silhuetas) das terras novas
Object.assign(PLXDEF,{outono:[{r:330,n:20,haze:.45,f:k=>(a)=>PX.mount(k,a,330,50+R()*40,0x8a5a6a,0x9a6a78,0)},{r:215,n:50,haze:.3,f:k=>(a)=>PX.blossom(k,a,215+(R()-.5)*20,24+R()*16,R()<.5?0xc8282a:0xf08a1a,0xffb02a)}],
  neve:[{r:330,n:18,haze:.45,f:k=>(a)=>PX.mount(k,a,330,70+R()*60,0x9aa8c0,0xb0bcd0,0xffffff)},{r:215,n:44,haze:.32,f:k=>(a)=>R()<.6?PX.pine(k,a,215+(R()-.5)*20,28+R()*24,0x2a4a5a):PX.mount(k,a,215,30+R()*20,0xc8d4e4,0xdce6f2,0xffffff)}],
  savana:[{r:330,n:18,haze:.5,f:k=>(a)=>PX.hill(k,a,330,20+R()*18,0xb88a5a,0xc89a6a)},{r:215,n:30,haze:.3,f:k=>(a)=>R()<.5?PX.mangrove(k,a,215+(R()-.5)*20,24+R()*12,0x7a8a2a):PX.hill(k,a,215,8+R()*8,0xc8a24a,0xd4ae54)}],
  deserto:[{r:330,n:16,haze:.55,f:k=>(a)=>PX.hill(k,a,330,24+R()*30,0xe0b878,0xecc890)},{r:215,n:26,haze:.35,f:k=>(a)=>R()<.12?PX.tower(k,a,215,24):PX.hill(k,a,215,10+R()*12,0xe8c888,0xf0d498)}],
  costa:[{r:330,n:14,haze:.6,f:k=>(a)=>PX.hill(k,a,330,14+R()*14,0x6a8aa8,0x7a9ab8)},{r:215,n:30,haze:.35,f:k=>(a)=>R()<.5?PX.blossom(k,a,215+(R()-.5)*20,22+R()*12,0x3a9a3a,0x48aa42):PX.hill(k,a,215,6+R()*6,0x7ac85a,0x86d064)}],
  cristal:[{r:330,n:20,haze:.45,f:k=>(a)=>PX.mount(k,a,330,50+R()*50,0x4a3a6a,0x5a4a7a,0)},{r:215,n:36,haze:.3,f:k=>(a)=>PX.spike(k,a,215+(R()-.5)*20,16+R()*26)}]});
// ---------- clima: nevasca nos picos e tempestade de areia nas dunas
Object.assign(WXT,{nevasca:{n:'Nevasca',ic:'❄️',k:{cloud:.8,snow:1,wind:.5,fog:.45}},areia:{n:'Tempestade de areia',ic:'🏜️',k:{cloud:.3,sand:1,wind:1,fog:.55}}});WX.k.snow=0;WX.k.sand=0;
Object.assign(WXR,{outono:{sol:4,nublado:3,chuva:2,neblina:1},neve:{nevasca:5,nublado:3,neblina:2,sol:1},savana:{sol:7,nublado:2,tempestade:1},deserto:{sol:6,areia:3},costa:{sol:5,nublado:2,chuva:2,tempestade:1},cristal:{neblina:3,nublado:2,sol:2}});
Object.assign(POIICONS,{'Ruínas':'🏚️','Mosteiro':'⛩️','Aldeia':'⛺','Farol':'🗼','Obelisco':'💎'});

// ---------- construções marcantes
POI.push({n:'Ruínas Carmesim',x:-372.1,z:-356.7,r:16},{n:'Mosteiro Gelado',x:70.3,z:-547.5,r:18},{n:'Aldeia das Tendas',x:537.3,z:139.5,r:16},{n:'Templo do Sol',x:412.7,z:453,r:20},{n:'Farol da Costa',x:-122.3,z:562.4,r:14},{n:'Obelisco de Cristal',x:-503,z:399.1,r:16});
flat(-372.1,-356.7,15);addStr(-372.1,-356.7,0,(k,e,f)=>{const t=new TB(k,e,f,-372.1,-356.7,.3,null,1.3);t.b(9,.3,9,0,.15,0,0x8a8478,{g:1});
  for(let i=0;i<8;i++){const a=i/8*TAU,x=C(a)*5.4,z=S(a)*5.4,h=i%3==0?1.2:3.6;t.b(.9,h,.9,x,h/2,z,0x8a8478,{g:1});if(h>3)t.b(1.2,.4,1.2,x,h,z,0x9a948a);t.f_(.95,.25,.95,x,h*.6,z,0x5a8a3a);t.col(x,z,.6)}
  t.b(5.4,.6,1,0,4.2,-5.4,0x8a8478).b(1.6,1,1.2,0,.5,0,0x6a6458,{g:1});t.e_(1.2,.12,.8,0,1.06,0,0xff3a2a);for(let i=0;i<5;i++)t.f_(.5,.06,.4,(i-2)*1.4,.33,2+i%2,0xd0402a,{ry:i});t.col(0,0,1)});
flat(70.3,-547.5,16);addStr(70.3,-547.5,0,(k,e,f)=>{const t=new TB(k,e,f,70.3,-547.5,-.2,null,1.4);t.b(10,.4,8,0,.2,0,0x7a8090,{g:1}).b(8,4,6,0,2.4,0,0xd8d0c4,{g:1});for(const sx of[-1,1])for(const sz of[-1,1])t.b(.5,4.2,.5,sx*4,2.3,sz*3,0x8a2a2a);
  t.b(9.6,.4,7.6,0,4.6,0,0x2a4a5a).b(9.8,.25,7.8,0,4.85,0,0xf4f8fc).b(6.4,2.2,4.6,0,5.9,0,0xd8d0c4).b(7.6,.4,5.8,0,7.1,0,0x2a4a5a).b(7.8,.25,6,0,7.35,0,0xf4f8fc).b(3.4,1.6,2.6,0,8.2,0,0x8a2a2a).b(4.4,.3,3.6,0,9,0,0x2a4a5a);
  t.b(1.4,2.4,.2,0,1.6,3.05,0x4a2a1a);t.e_(.8,.8,.1,-2.4,2.8,3.05,0xffd080).e_(.8,.8,.1,2.4,2.8,3.05,0xffd080);t.b(1.2,1.2,1.2,5.6,.9,3.6,0xc8a040).b(.2,2.6,.2,5.6,2.4,3.6,0x4a2a1a);t.col(0,0,4.6)});
flat(537.3,139.5,15);addStr(537.3,139.5,0,(k,e,f)=>{const t=new TB(k,e,f,537.3,139.5,0,null,1.3);const tent=(x,z,c)=>{for(let i=0;i<4;i++)t.b(3.4-i*.8,.7,3-i*.7,x,.35+i*.7,z,i%2?c:shade(c,.85),{g:i==0});t.b(.12,3.4,.12,x,1.7,z,0x5a3a1a);t.b(.9,1.2,.1,x,.6,z+1.45,0x2a1a10);t.col(x,z,1.6)};
  tent(-5,-3,0xd85a2a);tent(4,-4,0xe8b040);tent(-4,5,0x3a8a8a);tent(5,4,0xb03a5a);t.b(1.6,.3,1.6,0,.15,0,0x4a4440);t.e_(.7,.7,.7,0,.6,0,0xff8a2a);for(let i=0;i<4;i++)t.b(.3,2.6,.3,C(i*1.57)*2.6,1.3,S(i*1.57)*2.6,0x7a4a2a).b(.6,.4,.3,C(i*1.57)*2.6,2.5,S(i*1.57)*2.6,[0xd8402a,0x3a8ad8,0xe8c040,0x7ad84a][i])});
flat(412.7,453,20);addStr(412.7,453,0,(k,e,f)=>{const t=new TB(k,e,f,412.7,453,.4,null,1.4);for(let i=0;i<6;i++)t.b(14-i*2.2,1.1,14-i*2.2,0,.55+i*1.1,0,i%2?0xe0c088:0xd0b070,{g:i==0});
  t.b(2,1.4,.2,0,7.3,0,0xc8a060).e_(2.4,2.4,.3,0,8.8,0,0xffc030).e_(1.4,1.4,.32,0,8.8,0,0xfff0a0);for(let i=-1;i<=1;i+=2)for(let j=0;j<3;j++)t.b(.8,4,.8,i*8.6,2,-4+j*4,0xe8d0a0,{g:1}).b(1.1,.4,1.1,i*8.6,4.1,-4+j*4,0xc8a060);
  for(let i=0;i<6;i++)t.b(1.4,.5,.9,-3+i*1.2,.25,7.6,0xe0c088);t.col(0,0,6.5)});
flat(-122.3,562.4,13);addStr(-122.3,562.4,0,(k,e,f)=>{const t=new TB(k,e,f,-122.3,562.4,0,null,1.35);for(let i=0;i<7;i++)t.b(3.2-i*.2,1.8,3.2-i*.2,0,.9+i*1.8,0,i%2?0xc83a2a:0xf4f2ea,{g:i==0});
  t.b(3.4,.3,3.4,0,12.75,0,0x3a3a40).e_(1.6,1.4,1.6,0,13.6,0,0xfff0a0).b(2,.3,2,0,14.45,0,0x3a3a40).b(.8,.8,.8,0,15,0,0xc83a2a);house(new TB(k,e,f,-82+6,334-2,-.6,null,1.4),4,3.6,0xe8e0d0,0x3a5a8a,0);
  for(let i=0;i<8;i++)t.b(1.2,.2,3,0+i*0,.1,6+i*1.1,0x8a6a42).b(.25,1.4,.25,.7,-.4,6+i*1.1,0x6a4a2a);t.col(0,0,1.8)});
flat(-503,399.1,14);addStr(-503,399.1,0,(k,e,f)=>{const t=new TB(k,e,f,-503,399.1,.5,null,1.4);t.b(6,.5,6,0,.25,0,0x2a2438,{g:1}).b(1.8,11,1.8,0,6,0,0x1a1622,{g:1}).b(1.2,1.6,1.2,0,12.3,0,0x1a1622);
  for(let i=0;i<3;i++)t.e_(2.2,.25,2.2,0,3+i*3,0,i%2?0xc08aff:0x6ad8ff);t.e_(.9,.9,.9,0,13.6,0,0xb8a8ff,{rx:.785,rz:.785});
  for(let i=0;i<6;i++){const a=i/6*TAU;t.b(.8,.5,.8,C(a)*4.2,.25,S(a)*4.2,0x2a2438);t.e_(.4,1.8+i%3,.4,C(a)*4.2,1.3+(i%3)*.5,S(a)*4.2,i%2?0x9ae8ff:0xd8a8ff,{rz:.2})}t.col(0,0,1.4)});
// ---------- NPCs das terras novas
Object.assign(MDL,{druida:()=>hum({skin:0xe8b090,hair:0xc83a1a,hairS:'long',shirt:0x6a2a1a,robe:0x8a3a1e,pants:0x3a2a1a,hat:'hood',hatC:0x6a2a12,trim:0xffb040}),
  monge:()=>hum({skin:0xe0b090,hair:0x2a2a2a,hairS:'bald',shirt:0xc87a2a,robe:0xd8862a,pants:0x8a3a1a,trim:0x8a2a2a,beard:0x9a9a9a}),
  yara:()=>hum({skin:0x9a6a4a,hair:0x1a1a1a,hairS:'long',shirt:0xb05a2a,vest:0x6a4a2a,pants:0x5a4a2a,belt:0x3a2a1a,hat:'ranger',hatC:0x8a6a3a,plume:0xd8402a}),
  nefra:()=>hum({skin:0xb88a5a,hair:0x1a1a1a,hairS:'long',shirt:0xf0e8d0,robe:0xf4ecd8,pants:0xe0d4b8,trim:0xffc030,hat:'crown'}),
  bento:()=>hum({skin:0xe0a878,hair:0xa0a0a0,beard:0xb8b8b8,shirt:0x2a3a6a,vest:0xe8c040,pants:0x3a3a4a,hat:'ranger',hatC:0x1a2a4a}),
  ixa:()=>hum({skin:0xc8b8e8,hair:0xe8e0ff,hairS:'long',shirt:0x3a2a6a,robe:0x2a1e5a,pants:0x2a1e4a,trim:0x9ae8ff,glasses:1,hat:'wizard',hatC:0x2a1e5a,gem:0x9ae8ff})});
const NPC3=[['druida','druida','Rúbia, a Druida','🍂',-367.1,-349.7],['monge','monge','Monge Tashi','⛩️',65.3,-537.5],['yara','yara','Yara, a Batedora','🏹',531.3,147.5],['nefra','nefra','Nefra, a Sacerdotisa','☀️',406.7,439],['bento','bento','Bento, o Faroleiro','🗼',-116.3,556.4],['ixa','ixa','Ixa, a Vidente','🔮',-497,390.1]];
const NPC3L={druida:'As folhas caem vermelhas desde que a Sombra passou por aqui. As ruínas lembram de tudo.',monge:'O frio ensina paciência. O Rei Sem Nome não tem nenhuma.',yara:'Na savana, quem corre primeiro come primeiro. Mantenha os olhos no capim.',
  nefra:'O Sol ainda guarda este templo. Os mortos lá dentro discordam.',bento:'Este farol guiou navios por cem anos. Agora só piratas aparecem.',ixa:'Os cristais cantam o que vai acontecer. Hoje cantam o seu nome.'};
const _spawnNPCs15=spawnNPCs;spawnNPCs=function(){_spawnNPCs15();for(const[id,mdl,nm,ic,x,z]of NPC3)mkNPC(id,mdl,x,z,{nm,ic,talk:id,still:1})};
const _talkTo15=talkTo;talkTo=function(n){if(NPC3L[n.talk]){const had=QD.some(x=>x.t=='talk'&&x.npc==n.id&&act(x.id));qEvent('talk',n.id);if(!had)say([[n.nm,NPC3L[n.talk],n.ic]]);return}return _talkTo15(n)};
// ---------- missões das terras novas (conversa → caça → coleta → alvo com nome)
Object.assign(QOC,{folha:[0xe0402a,'Folha Carmesim','🍁'],gelo:[0x9ae8ff,'Flor de Gelo','❄️'],pena:[0xff6a3a,'Pena de Abutre','🪶'],ambar:[0xffb030,'Âmbar Antigo','🟠'],concha:[0xffc0d8,'Concha Rara','🐚'],cantante:[0xc08aff,'Cristal Cantante','💜']});
const Q3=[['outono','druida','Rúbia, a Druida','🍂',[-372.1,-356.7],['redwolf','spider','bandit','bassassin'],'folha','Lobo Rubro, o Alfa','redwolf','O Bosque Carmesim','As Folhas que Choram','Rúbia precisa de 7 folhas carmesim caídas perto das ruínas.'],
  ['neve','monge','Monge Tashi','⛩️',[70.3,-547.5],['swolf','yeti','iceskel'],'gelo','Grunhido, o Yeti Ancião','yeti','O Mosteiro Gelado','Flores de Gelo','O monge Tashi pede 6 flores de gelo que só nascem perto do mosteiro.'],
  ['savana','yara','Yara, a Batedora','🏹',[537.3,139.5],['hyena','boar','bandit','bandarc'],'pena','Risada, a Matriarca','hyena','A Aldeia das Tendas','Penas para as Flechas','Yara precisa de 8 penas de abutre espalhadas pela savana.'],
  ['deserto','nefra','Nefra, a Sacerdotisa','☀️',[412.7,453],['scorp','mummy','skelwar'],'ambar','Ankhet, a Múmia-Rainha','mummy','O Templo do Sol','Lágrimas de Âmbar','Nefra quer 6 pedaços de âmbar antigo enterrados ao redor do templo.'],
  ['costa','bento','Bento, o Faroleiro','🗼',[-122.3,562.4],['crab','pirate','slime'],'concha','Barba-de-Sal, o Pirata','pirate','O Farol Apagado','Conchas para o Farol','Bento quer 7 conchas raras da praia para consertar a lente do farol.'],
  ['cristal','ixa','Ixa, a Vidente','🔮',[-503,399.1],['cgolem','skelmage','cultist','imp'],'cantante','O Colosso Prismático','cgolem','O Obelisco de Cristal','Cristais que Cantam','Ixa precisa de 6 cristais cantantes ao redor do obelisco.']];
for(const[rid,npc,nm,ic,at,mob,obj,hn,hm,t1,t2,d2]of Q3){const R_=REG[RI[rid]],lv=R_.lv,xp=Math.round(260+lv*70),gd=Math.round(60+lv*16),id='x_'+rid;
  QD.push({id:id+'1',cat:'side',reg:rid,n:t1,d:'Fale com '+nm+' em '+R_.n+'.',t:'talk',npc,disc:rid,rw:{xp:Math.round(xp*.4),gold:gd},done:[[nm,NPC3L[npc],ic],[nm,'Se quer ajudar, limpe a região. Os monstros estão mais ousados a cada noite.',ic]]},
    {id:id+'2',cat:'side',reg:rid,n:'Ameaças de '+R_.n,d:'Derrote 12 monstros em '+R_.n+'.',t:'kill',mob,n_:12,req:[id+'1'],rw:{xp,gold:gd,item:1}},
    {id:id+'3',cat:'side',reg:rid,n:t2,d:d2,t:'collect',obj,n_:obj=='pena'||obj=='folha'||obj=='concha'?7:6,at,spread:24,req:[id+'1'],rw:{xp:Math.round(xp*.9),gold:gd,item:1}},
    {id:id+'4',cat:'side',reg:rid,n:hn,d:'Um líder terrível ronda '+R_.n+'. Encontre e derrote '+hn+'.',t:'hunt',mob:hm,at:[at[0]+(at[0]>0?-24:24),at[1]+(at[1]>0?-22:22)],nm:hn,n_:1,req:[id+'2'],rw:{xp:Math.round(xp*1.6),gold:gd*2,item:2},
      done:[[nm,'Você conseguiu! '+R_.n+' respira de novo. Leve isto — é o melhor que temos.',ic]]})}
for(const q of QD)if(!QS[q.id]){QS[q.id]={st:0,p:0,got:[]};QIDX[q.id]=q}

// ---------- eventos aleatórios enquanto explora
const EV3={t:70,cur:null};
function ev3Spot(dmin,dmax){for(let i=0;i<16;i++){const a=R()*TAU,r=dmin+R()*(dmax-dmin),x=P.x+C(a)*r,z=P.z+S(a)*r;if(walkable(x,z)&&groundAt(x,z)>.2&&Math.abs(x)<WMAX-20&&Math.abs(z)<WMAX-20&&hy(x,z)>60)return[x,z]}return null}
function ev3Mark(x,z,c){const b=beam(x,z,c);b.position.set(x,groundAt(x,z)+15,z);return b}
function ev3End(msg){const v=EV3.cur;if(!v)return;if(v.bm)sc.remove(v.bm);if(v.mk){sc.remove(v.mk);v.mk.traverse(o=>o.geometry&&o.geometry.dispose())}if(msg)toast(v.ic,msg,'');EV3.cur=null;EV3.t=90+R()*90}
function ev3Start(){const reg=regionAt(P.x,P.z),rid=REG[reg].id,tb=SPAWN[rid]||['wolf','boar'],lv=mobLv(reg),k=pick(['caravana','tesouro','meteoros','santuario','fera','tesouro']);const sp=ev3Spot(22,36);if(!sp)return;const[x,z]=sp;
  const v={k,x,z,t:0,ic:'❗',lv,tb};EV3.cur=v;
  if(k=='caravana'){v.ic='🛒';v.w=0;v.live=[];v.mk=new THREE.Group();const kk=new Bake();kk.box(2.4,1,1.4,0,1,0,0x8a5a32).box(2.6,.15,1.6,0,1.55,0,0x6a4a2a).box(.25,.9,.9,-1.3,.6,.85,0x4a3020).box(.25,.9,.9,1.1,.6,.85,0x4a3020).box(.25,.9,.9,-1.3,.6,-.85,0x4a3020).box(.25,.9,.9,1.1,.6,-.85,0x4a3020).box(2.2,1,1.3,0,2.1,0,0xe8dcc0);v.mk.add(kk.mesh(MV));v.mk.position.set(x,groundAt(x,z),z);sc.add(v.mk);
    v.bm=ev3Mark(x,z,0xffb040);banner('CARAVANA ATACADA');toast('🛒','Caravana atacada!','Defenda os mercadores ali perto (marcado no mapa).')}
  else if(k=='tesouro'){v.ic='💰';v.mk=new THREE.Group();const kk=new Bake();kk.box(1.4,.08,.3,0,.05,0,0xff3a2a,{ry:.785}).box(1.4,.08,.3,0,.05,0,0xff3a2a,{ry:-.785});v.mk.add(kk.mesh(ME));v.mk.position.set(x,groundAt(x,z)+.02,z);sc.add(v.mk);v.bm=ev3Mark(x,z,0xffd34a);toast('🗺️','Mapa do tesouro!','Um X marca o lugar. Vá até ele para cavar.')}
  else if(k=='meteoros'){v.ic='☄️';v.n=0;banner('CHUVA DE METEOROS');toast('☄️','Chuva de meteoros!','Fragmentos arcanos caem do céu. Cuidado com os impactos!')}
  else if(k=='santuario'){v.ic='✨';v.mk=new THREE.Group();const kk=new Bake(),ee=new Bake();kk.box(1.6,.4,1.6,0,.2,0,0x8a8a84).box(.8,2.4,.8,0,1.6,0,0x9a9a94);ee.box(.9,.5,.9,0,3.1,0,0x9ae4ff,{rx:.785,rz:.785});v.mk.add(kk.mesh(MV),ee.mesh(ME));v.mk.position.set(x,groundAt(x,z),z);sc.add(v.mk);v.bm=ev3Mark(x,z,0x9ae4ff);toast('✨','Santuário perdido','Um santuário antigo apareceu por perto. Toque nele para receber uma bênção.')}
  else{v.ic='👑';const ty=pick(tb),nm=rareName(R),e=mkMob(ty,x,z,{lv:lv+3,el:2,afx:[pick(Object.keys(AFF)),pick(Object.keys(AFF))],name:nm+', a Fera Lendária'});e.hp=e.mx=e.mx*1.8;e.m.g.scale.multiplyScalar(1.3);v.e=e;v.bm=ev3Mark(x,z,0xff8a1a);banner('FERA LENDÁRIA');toast('👑','Fera lendária!',nm+' ronda por perto. Grande recompensa.')}}
function ev3Upd(dt){if(!run||P.dead||(typeof DST!='undefined'&&DST.on))return;const v=EV3.cur;
  if(!v){if(UI.open||hy(P.x,P.z)<70||inCombat())return;EV3.t-=dt;if(EV3.t<=0){EV3.t=20;if(R()<.6)ev3Start()}return}
  v.t+=dt;const d=hy(P.x-v.x,P.z-v.z);if(d>140||v.t>300){ev3End('O evento terminou sem você.');return}if(v.mk&&v.k!='caravana')v.mk.rotation.y+=dt;
  if(v.k=='caravana'){if(d<26&&!v.live.some(m=>!m.dead)){if(v.w>=2){dropGold(v.x,v.z,Math.round(80+v.lv*25));dropItem(v.x,v.z,genItem(P.lv+1,1.6));for(let i=0;i<2;i++)dropItem(v.x+(R()-.5)*2,v.z+(R()-.5)*2,potItem(v.lv>=12?'vida2':'vida1'));gainXP(Math.round(XPN(P.lv)*.08));ev3End('Caravana salva! Os mercadores deixaram presentes.');return}
      v.w++;v.live=[];for(let i=0;i<3+v.w*2;i++){const a=i/(3+v.w*2)*TAU,mx=v.x+C(a)*10,mz=v.z+S(a)*10;if(!walkable(mx,mz))continue;const m=mkMob(pick(v.tb),mx,mz,{lv:v.lv,el:v.w==2&&i==0?1:0,afx:v.w==2&&i==0?[pick(Object.keys(AFF))]:[]});m.st='chase';v.live.push(m)}banner('ONDA '+v.w+' DE 2')}}
  else if(v.k=='tesouro'){if(d<2.2){for(let i=0;i<8;i++)puff(v.x+(R()-.5)*1.6,groundAt(v.x,v.z)+.2,v.z+(R()-.5)*1.6,0x8a6a42,1.4);dropGold(v.x,v.z,Math.round(60+v.lv*30));dropItem(v.x,v.z,genItem(P.lv+1,R()<.3?2.5:1.4));if(R()<.5)dropItem(v.x,v.z,potItem(R()<.5?'vida2':'animo'));snd(660,.2,'sine');setTimeout(()=>snd(990,.3,'sine'),150);ev3End('Você desenterrou um tesouro!')}}
  else if(v.k=='meteoros'){v.mt=(v.mt||0)-dt;if(v.mt<=0&&v.n<8){v.mt=1.1;v.n++;const a=R()*TAU,r=4+R()*14,mx=P.x+C(a)*r,mz=P.z+S(a)*r;meteor(mx,mz,1.1,1);tele(mx,mz,2.4,1.1,T=>{boom(T.x,groundAt(T.x,T.z),T.z,1.1);if(hy(P.x-T.x,P.z-T.z)<2.5)hitPlayer(ST.mx*.12,{brn:1});for(let i=0;i<1+(R()*2|0);i++)dropMat(T.x+(R()-.5)*2,T.z+(R()-.5)*2,'fragmento')},0xff6a1a)}if(v.n>=8&&v.mt<-3)ev3End('A chuva de meteoros passou.')}
  else if(v.k=='santuario'){if(d<2.4){const b=pick(['fren','grito']);P.buff[b]=90;toast('✨','Bênção recebida',b=='fren'?'+25% de velocidade de ataque por 90 s.':'Regeneração forte por 90 s.');column(v.x,v.z,0x9ae4ff,8,1.2,.6);ring(v.x,v.z,4,0x9ae4ff,.6);snd(880,.4,'sine');ev3End()}}
  else if(v.e){v.x=v.e.x;v.z=v.e.z;if(v.bm)v.bm.position.set(v.x,groundAt(v.x,v.z)+15,v.z);if(v.e.dead){dropItem(v.x,v.z,genItem(P.lv+2,3,null,R()<.25));dropGold(v.x,v.z,Math.round(120+v.lv*40));ev3End('Fera lendária derrotada!')}}}
const _marks15=marks;marks=function(){const L=_marks15();const v=EV3.cur;if(v)L.push({x:v.x,z:v.z,ic:v.ic,c:'#ffb040',k:'q',n:'Evento',big:1});return L};
const _trials15=trialsUpd;trialsUpd=function(dt,t){_trials15(dt,t);ev3Upd(dt)};
// ---------- saves antigos: o mapa revelado muda de lugar porque o mundo cresceu (16 quadros)
function world3Load(){if(Math.abs(P.x)>WMAX-14||Math.abs(P.z)>WMAX-14){const w=WP[0];P.x=w.x;P.z=w.z+3}if(P.st.map152)return;P.st.map152=1;const o=[...FOG];FOG.clear();for(const k of o){const[a,b]=k.split(',').map(Number);FOG.add((a+16)+','+(b+16))}}
