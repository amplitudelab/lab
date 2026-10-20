'use strict';
/* =============================================================================
   VOXEL REALMS · missões e história
   Ato I — "A Sombra sobre Aldoria". Missões principais em cadeia, secundárias
   por região, recompensas repetíveis do quadro da vila, diálogos, bestiário
   ============================================================================= */
const BR='Ancião Bram',BI='🧙',KA='🛡️',KN='Kael';
const QD=[
 // ---------------- PRINCIPAL (Ato I)
 {id:'m1',cat:'main',reg:'vila',n:'O Despertar do Guardião',d:'Fale com o Ancião Bram, perto da casa de telhado roxo, ao norte da praça.',t:'talk',npc:'bram',rw:{xp:60,gold:25},
  done:[[BR,'Kael! A Estátua de Aldor rachou esta noite. O Cristal-Selo que prende Ignarok está enfraquecendo.',BI],[BR,'Algo o alimenta: uma Sombra com quatro raízes — no mel das colmeias, na seiva do Ancião do Bosque, na carne dos mortos e no lodo do mangue.',BI],[BR,'Corte as quatro raízes e o selo se fortalece. Comece pelo sul: os bandidos da Planície Dourada sabem mais do que dizem.',BI],[KN,'Vou ao sul. E se a Sombra tiver um dono?',KA],[BR,'Então que Aldor nos proteja. Leve ouro: na taverna há mercenários dispostos a lutar ao seu lado.',BI]]},
 {id:'m2',cat:'main',reg:'plan',n:'Ao Sul, a Planície',d:'Ative a Pedra de Teleporte da Planície Dourada (atravesse a ponte ao sul da vila).',t:'wp',wp:'plan',req:['m1'],rw:{xp:80}},
 {id:'m3',cat:'main',reg:'plan',n:'Javalis Raivosos',d:'Os javalis da Planície ficaram violentos. Abata 6 deles.',t:'kill',mob:['boar'],n_:6,req:['m2'],rw:{xp:120,gold:40}},
 {id:'m4',cat:'main',reg:'plan',n:'O Capitão Rasgado',d:'Derrote o Capitão Rasgado no Acampamento dos Bandidos, a sudoeste da Planície.',t:'boss',boss:'capitao',req:['m3'],rw:{xp:250,gold:120,item:2},
  done:[['Narrador','No cinto do Capitão, um bilhete: "O homem de capuz paga pelas Pétalas Lunares de Lírio. A Sombra precisa de luz para apodrecer."','📜'],[KN,'Pétalas Lunares... nos Campos de Lírio, a leste.',KA]]},
 {id:'m5',cat:'main',reg:'flor',n:'Pétalas Lunares',d:'Colete 5 Pétalas Lunares brilhantes perto do Templo de Lírio, antes que os servos da Sombra as levem.',t:'collect',obj:'petala',n_:5,at:[258.8,-22.7],spread:24,req:['m4'],rw:{xp:300,gold:60}},
 {id:'m6',cat:'main',reg:'flor',n:'A Rainha da Colmeia',d:'A Raiz do Mel pulsa na Colmeia Real. Derrote a Rainha corrompida.',t:'boss',boss:'rainha',req:['m5'],rw:{xp:450,gold:160,item:2},
  done:[['Narrador','A Rainha tomba e o mel negro escorre para a terra, sem força. A primeira raiz da Sombra foi cortada.','🍯'],[KN,'Uma de quatro. A floresta ao norte é a próxima.',KA]]},
 {id:'m7',cat:'main',reg:'mata',n:'Uivos na Floresta',d:'Lobos das Sombras rondam a Floresta Ancestral. Abata 8 deles.',t:'kill',mob:['dwolf'],n_:8,req:['m6'],rw:{xp:420,gold:80}},
 {id:'m8',cat:'main',reg:'mata',n:'Os Mortos Não Descansam',d:'Zumbis se levantam no Cemitério Esquecido (noroeste da floresta). Destrua 12 mortos-vivos.',t:'kill',mob:['zombie','ghoul','skel'],n_:12,req:['m7'],rw:{xp:500,gold:90}},
 {id:'m9',cat:'main',reg:'mata',n:'O Coração Pútrido',d:'Destrua o Coração Pútrido diante da cripta do cemitério.',t:'interact',obj:'coracao',n_:1,pts:[[-119.3,-220.2]],req:['m8'],rw:{xp:520,item:1},
  done:[['Narrador','O coração estoura em fumaça verde. Os mortos caem de joelhos e não se levantam mais. Segunda raiz cortada.','💚']]},
 {id:'m10',cat:'main',reg:'mata',n:'O Ancião Corrompido',d:'A Raiz da Seiva prende o Ancião do Bosque, no extremo norte. Liberte-o à força.',t:'boss',boss:'anciao',req:['m9'],rw:{xp:900,gold:240,item:2},
  done:[['Ancião do Bosque','...obrigado, pequeno guardião. A bruxa do lodo me envenenou. Ela serve a alguém do norte gelado.','🌳'],[KN,'Então o mangue é o próximo.',KA]]},
 {id:'m11',cat:'main',reg:'mang',n:'A Toca do Eremita',d:'Encontre o Eremita Ulric no Mangue Sombrio, a oeste. Ele conhece a bruxa.',t:'talk',npc:'eremita',req:['m10'],rw:{xp:500},
  done:[['Eremita Ulric','Você é o Guardião? Então ouça: Morgra colhe almas no lodo para o Rei Sem Nome, que dormia sob o Cemitério.','🧓'],['Eremita Ulric','A cabana dela fica sobre palafitas, ao noroeste do mangue. Cuidado com os sapos — e com o veneno.','🧓']]},
 {id:'m12',cat:'main',reg:'mang',n:'Morgra, a Bruxa do Mangue',d:'Derrote Morgra em sua cabana sobre palafitas.',t:'boss',boss:'bruxa',req:['m11'],rw:{xp:1300,gold:320,item:2},
  done:[['Morgra','Hihihi... tarde demais, Guardião. As quatro raízes já beberam. Ignarok desperta!','🧹'],['Narrador','O chão treme. Ao nordeste, a Caldeira de Brasas solta uma coluna de fogo.','🌋']]},
 {id:'m13',cat:'main',reg:'cald',n:'O Despertar de Ignarok',d:'Suba até a Caldeira de Brasas (nordeste) e derrote Ignarok antes que ele alcance Pedraverde.',t:'boss',boss:'ignarok',req:['m12'],rw:{xp:2600,gold:600,item:3}},
 {id:'m14',cat:'main',reg:'vila',n:'Retorno do Guardião',d:'Leve a notícia ao Ancião Bram.',t:'talk',npc:'bram',req:['m13'],rw:{xp:800,gold:300},
  done:[[BR,'Você conseguiu, Kael! O selo de Aldor brilha de novo. Pedraverde canta seu nome.',BI],[BR,'Mas o Eremita falou do Rei Sem Nome... a cova dele está vazia. Ele marcha para as Terras Geladas do norte.',BI],[BR,'Descanse, Guardião. Quando a neve cair sobre Aldoria, o Ato II começa.',BI]]},
 // ---------------- SECUNDÁRIAS
 {id:'s1',cat:'side',reg:'vila',n:'A Forja de Helga',d:'Visite Helga, a Ferreira, na forja a leste da praça.',t:'talk',npc:'helga',req:['m1'],rw:{xp:40,item:1},
  done:[['Helga, a Ferreira','Então você é o novo Guardião. Pegue isto — e volte quando tiver ouro. Minha forja vende coisa boa e compra qualquer sucata.','⚒️']]},
 {id:'s2',cat:'side',reg:'vila',n:'Companhia de Viagem',d:'Contrate um mercenário na taverna O Javali Dourado (oeste da praça). Só um pode seguir você.',t:'hire',req:['m1'],rw:{xp:40,gold:20}},
 {id:'s12',cat:'side',reg:'vila',n:'Leitor de Ruínas',d:'Encontre e leia 6 livros, lápides ou inscrições antigas espalhados por Aldoria.',t:'lore',n_:6,req:['m1'],rw:{xp:400,item:2}},
 {id:'s13',cat:'side',reg:'vila',n:'Caçador de Elites',d:'Derrote 5 monstros campeões (azuis) ou raros (amarelos).',t:'elite',n_:5,req:['m2'],rw:{xp:600,item:2}},
 {id:'s3',cat:'side',reg:'plan',n:'O Moinho Assombrado',d:'Algo ronda o Moinho de Hollow. Elimine 10 inimigos perto do moinho.',t:'zone',at:[53.3,231.8],r:28,n_:10,disc:'plan',rw:{xp:200,gold:60}},
 {id:'s4',cat:'side',reg:'plan',n:'Colheita Dourada',d:'O moleiro fugiu. Recolha 6 feixes de trigo nos campos ao redor do moinho.',t:'collect',obj:'trigo',n_:6,at:[47.3,221.8],spread:20,disc:'plan',rw:{xp:180,gold:50}},
 {id:'s5',cat:'side',reg:'flor',n:'A Fada Aprisionada',d:'Uma fada está presa numa gaiola de espinhos no Templo de Lírio. Liberte-a.',t:'interact',obj:'gaiola',n_:1,pts:[[254.8,-28.7]],disc:'flor',rw:{xp:260,item:1},
  done:[['Lili, a Fada','Livre! Livre! Obrigada, Guardião. As fadas sombrias são minhas irmãs corrompidas... quebre a Colmeia e elas voltam a si.','🧚']]},
 {id:'s6',cat:'side',reg:'flor',n:'Mel Real',d:'Colete 4 favos de mel dourado perto da Colmeia Real, a leste.',t:'collect',obj:'favo',n_:4,at:[306.8,47.3],spread:16,disc:'flor',rw:{xp:240,gold:70}},
 {id:'s7',cat:'side',reg:'mata',n:'Ninho das Tecelãs',d:'Aranhas tecelãs infestam a floresta. Elimine 10.',t:'kill',mob:['spider'],n_:10,disc:'mata',rw:{xp:380,gold:90}},
 {id:'s8',cat:'side',reg:'mata',n:'Cristais de Mana',d:'Cristais azuis brotaram perto da Torre Arruinada. Colete 8.',t:'collect',obj:'cristal',n_:8,at:[-55.3,-247.7],spread:26,disc:'mata',rw:{xp:400,item:1}},
 {id:'s9',cat:'side',reg:'mang',n:'Lanternas do Pântano',d:'Acenda as 3 lanternas apagadas do mangue para guiar os viajantes.',t:'interact',obj:'lanterna',n_:3,pts:[[-273,18.3],[-293,50.3],[-251,48.3]],disc:'mang',rw:{xp:500,gold:120}},
 {id:'s10',cat:'side',reg:'mang',n:'Mandíbulas no Lodo',d:'Crocodilos atacam quem atravessa o mangue. Abata 6.',t:'kill',mob:['croc'],n_:6,disc:'mang',rw:{xp:560,item:1}},
 {id:'s11',cat:'side',reg:'cald',n:'Coração de Magma',d:'Os slimes de lava se multiplicam. Destrua 12 na Caldeira.',t:'kill',mob:['lslime'],n_:12,disc:'cald',rw:{xp:900,item:2}}];
const QS={},QIDX={};QD.forEach(q=>{QIDX[q.id]=q;QS[q.id]={st:0,p:0,got:[]}});
const done=id=>QS[id]&&QS[id].st==2,act=id=>QS[id]&&QS[id].st==1;
const BOUNTY={q:null};const BEST={};// monstros abatidos por tipo
const BESTD={boar:'Javalis da planície. A Sombra os deixou cegos de raiva: atacam em investidas — desvie para o lado.',wolf:'Lobos cinzentos caçam em bando. Um uivo chama os outros.',bandit:'Desertores e ladrões a serviço do Capitão Rasgado.',bandarc:'Atiram de longe e recuam quando você se aproxima. Role para desviar das flechas.',
  bee:'Operárias da Colmeia Real, corrompidas pelo mel negro. A picada envenena.',golem:'Flores e raízes que ganharam corpo. Lentos, mas cada golpe esmaga o chão.',fairy:'Fadas de Lírio tomadas pela Sombra. Lançam orbes violeta de longe.',dwolf:'Lobos que beberam da Sombra; mais rápidos e mais fortes que os cinzentos.',
  spider:'Tecelãs gigantes da Floresta Ancestral. Veneno lento, mordida rápida.',skel:'Arqueiros que serviram na Torre de Vigia — e continuam de guarda depois de mortos.',zombie:'Os mortos do Cemitério Esquecido. Lentos, resistentes e sempre em grupo.',ghoul:'Mortos famintos e ágeis. Correm até você de braços estendidos.',
  croc:'Donos do lodo do mangue. A mordida arranca pedaços.',frog:'Sapos roxos e peçonhentos que saltam sobre a presa.',slime:'Lodo vivo que se divide em dois quando morre.',lslime:'Rocha fundida com vontade própria. Queima quem toca.',imp:'Diabretes nascidos das brasas de Ignarok. Atiram bolas de fogo.',
  capitao:'Líder dos bandidos. Gira o machado e investe contra quem o desafia.',rainha:'A Rainha da Colmeia cresceu com o mel negro. Mergulha do alto e convoca o enxame.',anciao:'O guardião da floresta, preso pela Raiz da Seiva. Raízes brotam do chão onde você pisa.',bruxa:'Morgra, serva do Rei Sem Nome. Teleporta, envenena e chama seus sapos.',ignarok:'O dragão que Aldor selou há cem anos. Sopro de fogo, chuva de brasas e investidas.'};

// ---------- objetos de missão no mundo (aparecem só com a missão ativa)
const QOBJ=[];const QOC={petala:[0xc8f0ff,'Pétala Lunar','🌸'],trigo:[0xe8c860,'Feixe de Trigo','🌾'],favo:[0xffc020,'Favo de Mel','🍯'],cristal:[0x58c8ff,'Cristal de Mana','💎'],gaiola:[0x9a5aff,'Gaiola de Espinhos','🕸️'],lanterna:[0xffc860,'Lanterna Apagada','🏮'],coracao:[0x7dff6a,'Coração Pútrido','💚']};
function qObjSpawn(q){const s=QS[q.id];let pts=q.pts;if(!pts){pts=[];const r=rng(q.id.charCodeAt(1)*991+q.id.length);for(let i=0;i<60&&pts.length<q.n_+2;i++){const a=r()*TAU,d=4+r()*q.spread,x=q.at[0]+C(a)*d,z=q.at[1]+S(a)*d;if(walkable(x,z)&&cellH(Math.floor(x),Math.floor(z))>.2)pts.push([x,z])}}
  pts.forEach((p,i)=>{if(s.got.includes(i))return;const[c,n,ic]=QOC[q.obj],g=new THREE.Group(),k=new Bake();
    if(q.obj=='gaiola'){for(let j=0;j<8;j++)k.box(.1,1.8,.1,C(j/8*TAU)*.7,.9,S(j/8*TAU)*.7,0x3a2a3a);k.box(1.6,.12,1.6,0,1.85,0,0x3a2a3a)}else if(q.obj=='lanterna'){k.box(.2,2.2,.2,0,1.1,0,0x3a2a1a).box(.5,.5,.5,0,2.3,0,0x4a4a4a)}else if(q.obj=='coracao'){k.box(1,1,1,0,.8,0,0x3a5a2a).box(1.2,.2,1.2,0,.2,0,0x2a2a2a)}else if(q.obj=='trigo'){for(let j=0;j<5;j++)k.box(.1,1.1,.1,(j-2)*.12,.55,0,0xe8c860,{rz:(j-2)*.12})}else k.box(.5,.7,.5,0,.5,0,c,{ry:.7});
    g.add(k.mesh(MV));const sp_=spr(c,q.obj=='gaiola'?2.2:1.6,.8);sp_.position.y=q.obj=='lanterna'?2.3:1;g.add(sp_);if(q.obj=='gaiola'){const f=spr(0xd08aff,.8,1);f.position.y=1;g.add(f)}
    const y=groundAt(p[0],p[1]);g.position.set(p[0],y,p[1]);sc.add(g);const o={q,i,x:p[0],z:p[1],g,bm:q.t=='interact'?beam(p[0],p[1],c):null};QOBJ.push(o);
    if(q.t=='interact')o.it=inter({x:p[0],z:p[1],r:2.6,ic,label:()=>q.obj=='lanterna'?'Acender lanterna':q.obj=='gaiola'?'Libertar a fada':'Destruir o Coração Pútrido',act:()=>qObjTake(o),kind:'quest'})})}
function qObjTake(o){const q=o.q,s=QS[q.id];if(s.st!=1||s.got.includes(o.i))return;s.got.push(o.i);s.p++;sc.remove(o.g);if(o.bm)sc.remove(o.bm);if(o.it){const i=INTER.indexOf(o.it);if(i>=0)INTER.splice(i,1)}QOBJ.splice(QOBJ.indexOf(o),1);
  const[c,n,ic]=QOC[q.obj];flash(o.x,groundAt(o.x,o.z)+1,o.z,c,3,.4);fx(o.x,groundAt(o.x,o.z)+1,o.z,c,16,4,.15,1.6);snd(880,.12,'sine');pop(n+' '+s.p+'/'+q.n_,P.x,P.y+3,P.z,'#ffe08a');
  if(q.obj=='lanterna'){LAMPS.push([o.x,groundAt(o.x,o.z)+2.3,o.z,0xffc860]);const k=new Bake();k.box(.2,2.2,.2,0,1.1,0,0x3a2a1a);const m=k.mesh(MV);m.position.set(o.x,groundAt(o.x,o.z),o.z);sc.add(m)}
  qCheck(q);trackUpd()}
function qObjUpd(dt,t){for(let i=QOBJ.length-1;i>=0;i--){const o=QOBJ[i];o.g.rotation.y+=dt*(o.q.t=='collect'?1.5:0);if(o.q.t=='collect'){o.g.position.y=groundAt(o.x,o.z)+.2+S(t*2+i)*.15;if(hy(P.x-o.x,P.z-o.z)<1.6&&!P.dead)qObjTake(o)}if(o.bm)o.bm.position.y=groundAt(o.x,o.z)+15}}
function qObjClear(q){for(let i=QOBJ.length-1;i>=0;i--){const o=QOBJ[i];if(o.q===q){sc.remove(o.g);if(o.bm)sc.remove(o.bm);if(o.it){const j=INTER.indexOf(o.it);if(j>=0)INTER.splice(j,1)}QOBJ.splice(i,1)}}}

// ---------- ciclo das missões
function qStart(q,silent){const s=QS[q.id];if(s.st)return;s.st=1;s.p=s.p||0;if(q.t=='collect'||q.t=='interact')qObjSpawn(q);if(q.t=='wp'&&WP.find(w=>w.id==q.wp).on){s.p=1}if(q.t=='lore')s.p=Math.min(q.n_,LORE.filter(l=>!l.sign&&LORE_FOUND.has(l.id)).length)
  if(!silent){toast(q.cat=='main'?'📜':'❕',q.cat=='main'?'NOVA MISSÃO':'Missão secundária',q.n);snd(660,.15,'sine')}trackUpd();if(!silent)qCheck(q)}
function qAvail(){for(const q of QD){const s=QS[q.id];if(s.st)continue;if((q.req||[]).every(done)&&(!q.disc||P.disc.has(q.disc))&&(!q.cls||q.cls==P.cls))qStart(q)}}
function qCheck(q){const s=QS[q.id];if(s.st!=1)return;const need=q.n_||1;if(s.p<need)return;s.st=2;qObjClear(q);
  const fin=()=>{grant(q.rw);toast('✔','MISSÃO CONCLUÍDA',q.n);snd(784,.25,'sine');setTimeout(()=>snd(1046,.3,'sine'),160);qAvail();trackUpd();save()};
  if(q.done)say(q.done,fin);else fin()}
function grant(rw){if(!rw)return;if(rw.gold){P.gold+=rw.gold;pop('+'+rw.gold+' 🪙',P.x,P.y+3,P.z,'#ffd34a')}if(rw.xp)gainXP(rw.xp);if(rw.item){const it=genItem(P.lv+1,rw.item>=3?3:rw.item*1.2,null,rw.item>=3);if(rw.item==2&&it.rar<2){it.rar=2;it.n=pick(RARE_N)}pickItem(it)||dropItem(P.x,P.z,it)}hud()}
function qEvent(ev,a,b,e){for(const q of QD){const s=QS[q.id];if(s.st!=1)continue;let inc=0;
    if(ev=='kill'){if(q.t=='kill'&&q.mob.includes(a))inc=1;if(q.t=='boss'&&q.boss==a)inc=1;if(q.t=='zone'&&e&&hy(e.x-q.at[0],e.z-q.at[1])<q.r)inc=1;if(q.t=='elite'&&e&&(e.el==2||e.el==1&&!e.minion))inc=1}
    else if(ev=='talk'&&q.t=='talk'&&q.npc==a)inc=1;else if(ev=='dungeon'&&q.t=='dungeon')inc=1;else if(ev=='wp'&&q.t=='wp'&&q.wp==a)inc=1;else if(ev=='hire'&&q.t=='hire')inc=1;else if(ev=='lore'&&q.t=='lore')inc=1;
    if(inc){s.p=Math.min(q.n_||1,s.p+inc);if(q.n_>1&&(ev=='kill'))pop(q.n+' '+s.p+'/'+q.n_,P.x,P.y+3.6,P.z,'#ffe08a');qCheck(q)}}
  if(ev=='kill'){BEST[a]=(BEST[a]||0)+1;const B=BOUNTY.q;if(B&&!B.ok&&b==RI[B.reg]){B.p++;if(B.p>=B.n){B.ok=1;toast('📋','Recompensa cumprida!','Volte ao Quadro de Recompensas na vila.')}}}
  trackUpd()}

// ---------- quadro de recompensas (repetível)
inter({x:11,z:-9.5,r:2.6,ic:'📋',label:()=>'Quadro de Recompensas',act:()=>openBounty(),kind:'board'});
function bountyGen(reg){const R_=REG[RI[reg]];return{reg,n:15,p:0,ok:0,gold:Math.round(60+R_.lv*25),xp:Math.round(150+R_.lv*60),txt:'Abata 15 monstros em '+R_.n}}

// ---------- conversas com NPCs
const RUMOR=['Dizem que à noite os mortos andam no Cemitério Esquecido. Não vá sem luz.','Meu primo viu uma abelha do tamanho de um cavalo nos Campos de Lírio!','A Helga vende armas melhores a cada vez que você volta mais forte.','Os santuários de pedra dão força por um tempo. Procure as pedras que brilham.','Monstros de nome azul andam em bando; os de nome amarelo trazem lacaios. Eles carregam tesouros!','Quando uma luz laranja sobe do chão, é um item lendário. Corra pegar!','Se estiver cercado, role! Ninguém acerta um Guardião que rola.','O moleiro de Hollow sumiu faz uma semana. O moinho gira sozinho.','Lá no mangue mora um velho eremita. Fala com os sapos, dizem.','Nunca vi o céu tão vermelho quanto no dia em que a Caldeira acordou.'];
function talkTo(n){const q=n.talk,had=QD.some(x=>x.t=='talk'&&x.npc==n.id&&act(x.id));qEvent('talk',n.id);if(had)return;if(q=='bram'){if(act('m1')||act('m14'))return;const cur=QD.find(x=>x.cat=='main'&&act(x.id));say([[BR,cur?'Seu próximo passo: '+cur.d:'Pedraverde está segura graças a você, Kael.',BI]]);return}
  if(q=='helga'){if(QS.s1.st==2)openShop();return}
  if(q=='eremita'){if(!act('m11'))say([['Eremita Ulric','O lodo guarda segredos, Guardião. Volte quando a bruxa cair... ou antes, se tiver coragem.','🧓']]);return}
  if(q=='guarda'){say([['Guarda Tomas',pick(['Ao sul fica a Planície. Siga a estrada e atravesse a ponte.','Bandidos estão roubando carroças na estrada do sul. Tenha cuidado.','Os portões fecham ao anoitecer — mas Guardiões entram quando quiserem.']),'🛡️']]);return}
  say([[n.nm,pick(RUMOR),'💬']])}
function readLore(L){const first=!LORE_FOUND.has(L.id);LORE_FOUND.add(L.id);say([[L.t,L.txt,L.sign?'🪧':'📖']],()=>{if(first&&!L.sign){gainXP(25+P.lv*5);toast('📖','Códice atualizado',L.t);qEvent('lore',L.id);save()}})}
