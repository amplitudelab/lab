'use strict';
/* =============================================================================
   VOXEL REALMS · painel de diagnóstico de desempenho (16.2)
   - Liga pelo Menu (📊 Diagnóstico) ou F3. Mostra FPS, tempo de cada quadro,
     travadas, tempo de CPU por sistema do jogo, tempo de render, GPU (quando o
     aparelho permite medir), chamadas de desenho, triângulos, memória e o que
     está carregado no mundo.
   - "Teste 20 s": grava 20 segundos jogando e gera um relatório com veredito
     (GPU, CPU, terreno ou travadas de memória). "Copiar" copia o texto para
     mandar no chat.
   - Desligado, cada sistema medido custa só uma verificação de booleano.
   ============================================================================= */
const DIAG={on:false,bench:0,t0:0,sys:{},frames:[],cpu:[],rend:[],gpu:[],last:0,fn:0,rep:'',gq:null,gx:null,gpend:[]};
// sistemas medidos (nome no jogo -> rótulo)
const DIAGS={worldUpd:'Terreno (geração/streaming)',playerUpd:'Herói',feelUpd:'Pose/fada/livro',mobsUpd:'Monstros (IA)',npcUpd:'Moradores',animalsUpd:'Animais',projUpd:'Projéteis',minionsUpd:'Lacaios',
  petUpd:'Pet',spawnUpd:'Spawns',lootUpd:'Saque',qObjUpd:'Objetos de missão',fxUpd:'Partículas',ambUpd:'Ambiente (fx)',ambienceUpd:'Ambiente (bichos)',birdsUpd:'Pássaros',torchUpd:'Luz da tocha/fada',
  wxUpd:'Clima',plxUpd:'Montanhas ao fundo',cloudsUpd:'Nuvens',waterUpd:'Água',placesUpd:'Lugares',world2Upd:'Eventos',trialsUpd:'Caçadas',hudUpd:'HUD',hud:'HUD (lento)',hudFast:'HUD (rápido)',minimap:'Minimapa',
  camUpd:'Câmera',vfxUpd:'Efeitos de magia',magicUpd:'Magias',decalUpd:'Marcas no chão',musUpd:'Música',interUpd:'Interações',regionUpd:'Região',drsUpd:'Resolução dinâmica',lookUpd:'Cor por bioma',dayUpd:'Dia e noite',
  wglowUpd:'Brilho das armas',haloUpd:'Halos',vmUpd:'Câmera 1ª pessoa',dlgUpd:'Diálogos',mountUpd:'Montaria',vampUpd:'Vampiro',wpUpd:'Teleportes',npcLabels:'Nomes'};
for(const k in DIAGS){let f;try{f=eval(k)}catch(e){continue}if(typeof f!='function')continue;
  const w=function(){if(!DIAG.on)return f.apply(this,arguments);const t=performance.now();try{return f.apply(this,arguments)}finally{const d=performance.now()-t,s=DIAG.sys[k]||(DIAG.sys[k]={t:0,mx:0,n:0});s.t+=d;s.n++;if(d>s.mx)s.mx=d}};
  try{eval(k+'=w')}catch(e){}}
// render (CPU de envio) e GPU via timer query quando existe
{const gl=rd.getContext();DIAG.gx=gl.getExtension&&gl.getExtension('EXT_disjoint_timer_query_webgl2');const _render=render;
  render=function(){if(!DIAG.on)return _render();const t=performance.now();let q=null;if(DIAG.gx&&!DIAG.gq){q=gl.createQuery();gl.beginQuery(DIAG.gx.TIME_ELAPSED_EXT,q);DIAG.gq=q}
    _render();if(q){gl.endQuery(DIAG.gx.TIME_ELAPSED_EXT);DIAG.gpend.push(q);DIAG.gq=null}DIAG.cur.r=performance.now()-t;
    for(let i=DIAG.gpend.length-1;i>=0;i--){const p=DIAG.gpend[i];if(gl.getQueryParameter(p,gl.QUERY_RESULT_AVAILABLE)){if(!gl.getParameter(DIAG.gx.GPU_DISJOINT_EXT))DIAG.gpu.push(gl.getQueryParameter(p,gl.QUERY_RESULT)/1e6);gl.deleteQuery(p);DIAG.gpend.splice(i,1)}}}}
// quadro inteiro (CPU do laço) e intervalo entre quadros
DIAG.cur={r:0};const _frameDG=frame;frame=function(now){if(!DIAG.on)return _frameDG(now);const fn=frameN,t=performance.now();_frameDG(now);if(frameN===fn)return;const cpu=performance.now()-t;
  if(DIAG.last){const iv=now-DIAG.last;DIAG.frames.push(iv);DIAG.cpu.push(cpu);DIAG.rend.push(DIAG.cur.r)}DIAG.last=now;
  const cap=DIAG.bench?6000:240;for(const a of[DIAG.frames,DIAG.cpu,DIAG.rend,DIAG.gpu])if(a.length>cap)a.splice(0,a.length-cap)};
// estatísticas
const dgAvg=a=>a.length?a.reduce((s,v)=>s+v,0)/a.length:0,dgPct=(a,p)=>{if(!a.length)return 0;const s=a.slice().sort((x,y)=>x-y);return s[Math.min(s.length-1,Math.floor(s.length*p))]};
function dgGPUName(){try{const gl=rd.getContext(),e=gl.getExtension('WEBGL_debug_renderer_info');return e?gl.getParameter(e.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER)}catch(e){return'?'}}
function dgSnap(){const F=DIAG.frames,ft=dgAvg(F),fps=ft?1000/ft:0,low=dgPct(F,.99),hi=F.length?Math.max(...F):0,hitch=F.filter(v=>v>50).length,cpu=dgAvg(DIAG.cpu),rnd=dgAvg(DIAG.rend),gpu=DIAG.gpu.length?dgAvg(DIAG.gpu):null;
  const nf=Math.max(1,F.length),sys=Object.entries(DIAG.sys).map(([k,s])=>({k,n:DIAGS[k]||k,ms:s.t/nf,mx:s.mx})).sort((a,b)=>b.ms-a.ms);
  const I=rd.info,alive=E.filter(e=>!e.dead).length,vis=E.filter(e=>!e.dead&&e.m.g.visible).length,parts=PA.reduce((s,p)=>s+(p.l>0?1:0),0),mem=performance.memory?Math.round(performance.memory.usedJSHeapSize/1048576):null;
  const cv=rd.domElement,dpr=rd.getPixelRatio(),qbuild=typeof BQ!='undefined'?BQ.length:0,chk=typeof CHK!='undefined'?CHK.size:0;
  let ver='Sem dados suficientes ainda.';if(F.length>20){const idle=ft-cpu;
    if(hitch>F.length*.04&&sys[0]&&sys[0].mx>40)ver=`Travadas: ${hitch} quadros acima de 50 ms. O maior pico veio de "${sys[0].n}" (${sys[0].mx.toFixed(0)} ms).`;
    else if(gpu!=null&&gpu>cpu*1.2&&gpu>12)ver=`Gargalo na GPU (${gpu.toFixed(1)} ms por quadro). Reduzir resolução, sombras, pós-processamento e distância deve ajudar mais.`;
    else if(gpu==null&&idle>cpu*1.1&&ft>18)ver=`Provável gargalo na GPU: o jogo gasta ${cpu.toFixed(1)} ms de CPU, mas o quadro leva ${ft.toFixed(1)} ms. Reduzir resolução/sombras/efeitos deve ajudar mais.`;
    else if(cpu>14)ver=`Gargalo na CPU (${cpu.toFixed(1)} ms por quadro). Os sistemas mais caros estão na lista acima.`;
    else ver='Desempenho dentro do esperado neste trecho.'}
  return{fps,ft,low,hi,hitch,cpu,rnd,gpu,sys,I,alive,vis,parts,mem,cv,dpr,qbuild,chk,ver,n:F.length}}
function dgText(s,full){const L=[];const gp=s.gpu!=null?s.gpu.toFixed(1)+' ms':'não mede neste aparelho';
  L.push(`FPS ${s.fps.toFixed(0)} · quadro ${s.ft.toFixed(1)} ms · 1% pior ${s.low.toFixed(0)} ms · pico ${s.hi.toFixed(0)} ms · travadas>50ms ${s.hitch}`);
  L.push(`CPU do jogo ${s.cpu.toFixed(1)} ms (render ${s.rnd.toFixed(1)}) · GPU ${gp}`);
  L.push(`Chamadas ${s.I.render.calls} · triângulos ${(s.I.render.triangles/1000).toFixed(0)}k · geometrias ${s.I.memory.geometries} · texturas ${s.I.memory.textures} · shaders ${s.I.programs?s.I.programs.length:'?'}`);
  L.push(`Tela ${s.cv.width}×${s.cv.height} (pixel ${s.dpr.toFixed(2)}, DRS ${(typeof DRS!='undefined'?DRS.s:1).toFixed(2)}) · gráficos ${GFX.n} · pós ${PO.on?'sim':'não'} · sombra ${GFX.shadow} · FOV ${FOVB}°`);
  L.push(`Pedaços ${s.chk} (fila ${s.qbuild}) · monstros ${s.vis}/${s.alive} visíveis · partículas ${s.parts} · NPCs ${NPC.length}${s.mem!=null?' · memória JS '+s.mem+' MB':''}`);
  const top=s.sys.slice(0,full?14:6).map(o=>`${o.n} ${o.ms.toFixed(2)}${full?' (pico '+o.mx.toFixed(0)+')':''}`).join(' · ');L.push('Mais caros (ms/quadro): '+top);
  L.push('➜ '+s.ver);return L}
function dgReport(s){const L=['VOXEL REALMS '+VR_VERSION+' · relatório de desempenho ('+(s.n)+' quadros)','Aparelho: '+navigator.userAgent,'GPU: '+dgGPUName()+' · tela '+innerWidth+'×'+innerHeight+' ×'+(devicePixelRatio||1),
  'Lugar: '+(REG[REGC]?REG[REGC].n:'?')+' ('+Math.round(P.x)+', '+Math.round(P.z)+') · '+(NIGHT>.5?'noite':'dia')+' · clima '+(WX.type||'?'),...dgText(s,1)];return L.join('\n')}
// painel
document.body.insertAdjacentHTML('beforeend',`<div id="dgp"><div class="dgh"><b>📊 Diagnóstico</b><button id="dgB">Teste 20 s</button><button id="dgC">Copiar</button><button id="dgX">✕</button></div><pre id="dgT"></pre></div>`);
function dgToggle(v){DIAG.on=v==null?!DIAG.on:v;$('dgp').classList.toggle('on',DIAG.on);if(DIAG.on){for(const k in DIAG.sys)delete DIAG.sys[k];DIAG.frames.length=DIAG.cpu.length=DIAG.rend.length=DIAG.gpu.length=0;DIAG.last=0}try{localStorage.setItem('vr16_dg',DIAG.on?'1':'0')}catch(e){}}
function dgBench(){if(DIAG.bench)return;dgToggle(true);DIAG.bench=1;DIAG.t0=performance.now();$('dgB').textContent='Gravando… 20';toast('📊','Teste de 20 segundos','Jogue normalmente: ande, lute, vire a câmera.');
  const tick=()=>{const left=20-(performance.now()-DIAG.t0)/1000;if(left>0){$('dgB').textContent='Gravando… '+Math.ceil(left);setTimeout(tick,250);return}
    DIAG.bench=0;const s=dgSnap();DIAG.rep=dgReport(s);$('dgB').textContent='Teste 20 s';$('dgT').textContent='RELATÓRIO DO TESTE\n'+DIAG.rep;DIAG.hold=performance.now()+60000;snd(880,.12,'sine');toast('📊','Teste concluído','Toque em Copiar e mande o texto.')};setTimeout(tick,250)}
function dgCopy(){const s=DIAG.rep||dgReport(dgSnap());const ok=()=>toast('📋','Relatório copiado','Cole no chat.');
  if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(s).then(ok,()=>dgCopy2(s,ok));else dgCopy2(s,ok)}
function dgCopy2(s,ok){const t=document.createElement('textarea');t.value=s;t.style.cssText='position:fixed;left:-999px;top:0';document.body.appendChild(t);t.select();try{document.execCommand('copy');ok()}catch(e){}t.remove()}
$('dgB').onclick=e=>{e.stopPropagation();dgBench()};$('dgC').onclick=e=>{e.stopPropagation();dgCopy()};$('dgX').onclick=e=>{e.stopPropagation();dgToggle(false)};
setInterval(()=>{if(!DIAG.on||DIAG.bench||(DIAG.hold&&performance.now()<DIAG.hold))return;DIAG.rep='';$('dgT').textContent=dgText(dgSnap(),0).join('\n')},500);
addEventListener('keydown',e=>{if(e.code=='F3'){e.preventDefault();dgToggle()}});
$('sav').insertAdjacentHTML('beforebegin','<button class="ib" id="dgm">📊 Diagnóstico</button>');$('dgm').onclick=()=>{closeAll();dgToggle(true)};
try{if(localStorage.getItem('vr16_dg')=='1')dgToggle(true)}catch(e){}
document.head.insertAdjacentHTML('beforeend',`<style>#dgp{position:fixed;left:50%;top:max(4px,env(safe-area-inset-top,0px));transform:translateX(-50%);z-index:30;width:min(640px,calc(100vw - 16px));display:none;
  background:rgba(8,6,12,.82);border:1px solid #d9a948;border-radius:8px;color:#e8f0e0;font:10.5px/1.35 ui-monospace,Menlo,Consolas,monospace;box-shadow:0 4px 14px rgba(0,0,0,.6);pointer-events:auto}
#dgp.on{display:block}.dgh{display:flex;align-items:center;gap:6px;padding:4px 6px;border-bottom:1px solid rgba(217,169,72,.4)}.dgh b{flex:1;font:700 11px var(--fn);color:#ffe08a}
.dgh button{border:1px solid #d9a948;background:#2a1a10;color:#ffe08a;border-radius:5px;font:700 10.5px var(--fn);padding:3px 8px;cursor:pointer}#dgT{margin:0;padding:5px 8px;white-space:pre-wrap;max-height:42vh;overflow:auto}</style>`);
