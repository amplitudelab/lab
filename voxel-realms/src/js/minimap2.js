'use strict';
/* =============================================================================
   VOXEL REALMS · minimapa e mapa em alta definição (16.0)
   - O minimapa é desenhado na densidade real da tela (nítido em celular).
   - Camada de detalhe feita do terreno de verdade: relevo sombreado, água com
     profundidade e espuma na margem, estradas, pontes, copas das árvores e as
     construções. Fica guardada em ladrilhos de 64 m.
   - Cores: vermelho = hostil (anel dourado = raro, branco = campeão, maior =
     chefe), azul = animal passivo, verde = aliado (mercenário e mascote),
     branco = pessoas da vila, laranja = jogadores (você e, no futuro, quem
     entrar pela rede: MPL).
   - Moldura com bússola (N, L, S, O) e marcas de direção.
   - O mapa-múndi ganha uma versão 768×768 com relevo, gerada aos poucos em
     segundo plano, e é desenhado na densidade da tela.
   ============================================================================= */
const MPL=[]; // jogadores remotos {x,z,f,n} (multijogador futuro)
const MMC={hostil:'#ff3b30',passivo:'#3fa4ff',aliado:'#5cff7a',npc:'#ffffff',jogador:'#ff9a1f'};
const MM2={tiles:new Map(),T:64,PX:2,max:70};
const MMCAN=[0x3f9a34,0x8ab838,0xb050d0,0x24666a,0x2e6aa6,0x4a3020,0xe0601e,0x24666a,0x7a8a2a,0x6a8a3a,0x3a9a3a,0x9a6ad8];
const hexRGB2=h=>[parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)],REGRGB=REG.map(r=>hexRGB2(r.map));
const chReady=(cx,cz)=>{const c=CHK.get(ckey(cx,cz));return c&&c.ready};
function mmBuild(tx,tz){const T=MM2.T,K=MM2.PX,N=T*K,x0=tx*T,z0=tz*T,cx0=Math.floor((x0-1)/CS),cz0=Math.floor((z0-1)/CS),cx1=Math.floor((x0+T)/CS),cz1=Math.floor((z0+T)/CS);
  for(let a=cx0;a<=cx1;a++)for(let b=cz0;b<=cz1;b++)if(!chReady(a,b))return null;
  const cv=document.createElement('canvas');cv.width=cv.height=N;const x=cv.getContext('2d'),img=x.createImageData(N,N),d=img.data;
  // cores das regiões numa grade de 8 m, misturadas suavemente
  const G=T/8+1,RC=[];for(let j=0;j<G;j++)for(let i=0;i<G;i++)RC.push(REGRGB[regionAt(x0+i*8,z0+j*8)]);
  const segs=ROADS.filter(r=>segD(x0+T/2,z0+T/2,r[0],r[1])<T*.75+4);
  const H=new Float32Array((T+1)*(T+1));for(let j=0;j<=T;j++)for(let i=0;i<=T;i++)H[i+j*(T+1)]=groundAt(x0+i-.5,z0+j-.5);
  for(let j=0;j<T;j++)for(let i=0;i<T;i++){const h=H[i+1+(j+1)*(T+1)],hn=H[i+j*(T+1)],wx=x0+i+.5,wz=z0+j+.5;let c;
    if(h<-.25){const dp=cl(-h/2.2,0,1);c=[70-dp*35,150-dp*50,205-dp*40];if(hn>=-.25)c=[c[0]+70,c[1]+60,c[2]+40]}
    else{const gi=i/8,gj=j/8,i0=Math.min(G-2,gi|0),j0=Math.min(G-2,gj|0),fx=gi-i0,fz=gj-j0,a=RC[i0+j0*G],b=RC[i0+1+j0*G],e=RC[i0+(j0+1)*G],f=RC[i0+1+(j0+1)*G];
      c=[0,1,2].map(q=>(a[q]*(1-fx)+b[q]*fx)*(1-fz)+(e[q]*(1-fx)+f[q]*fx)*fz);let road=false;for(const r of segs)if(segD(wx,wz,r[0],r[1])<1.6){road=true;break}if(road)c=[176,146,96];
      const sh=cl(1+(hn-h)*.2,.7,1.3)*(.86+cl(h,0,14)*.02);c=c.map(v=>v*sh)}
    for(let u=0;u<K;u++)for(let v=0;v<K;v++){const o=((j*K+v)*N+i*K+u)*4;d[o]=c[0];d[o+1]=c[1];d[o+2]=c[2];d[o+3]=255}}
  x.putImageData(img,0,0);
  // pontes, árvores e construções
  const P2=(wx,wz)=>[(wx-x0)*K,(wz-z0)*K];
  for(const b of BRIDGES){const[px,pz]=P2(b.x,b.z);if(px<-40||pz<-40||px>N+40||pz>N+40)continue;x.save();x.translate(px,pz);x.rotate(Math.atan2(b.uz,b.ux));x.fillStyle='#8a6038';x.fillRect(-b.len*K/2,-b.w*K,b.len*K,b.w*K*2);x.fillStyle='#5a3a1e';for(let s=-b.len/2;s<b.len/2;s+=1.2)x.fillRect(s*K,-b.w*K,1,b.w*K*2);x.restore()}
  for(let a=cx0;a<=cx1;a++)for(let b=cz0;b<=cz1;b++){const ch=CHK.get(ckey(a,b));if(!ch)continue;for(const[tx_,tz_,tr]of ch.col){if(tx_<x0-3||tz_<z0-3||tx_>x0+T+3||tz_>z0+T+3)continue;const[px,pz]=P2(tx_,tz_),r=Math.max(1.6,tr*1.25*K),cc=MMCAN[regionAt(tx_,tz_)]||0x3f9a34;
    x.fillStyle='rgba(0,0,0,.28)';x.beginPath();x.arc(px+1,pz+1.4,r,0,7);x.fill();x.fillStyle='#'+shade(cc,.82).toString(16).padStart(6,'0');x.beginPath();x.arc(px,pz,r,0,7);x.fill();x.fillStyle='#'+shade(cc,1.18).toString(16).padStart(6,'0');x.beginPath();x.arc(px-r*.3,pz-r*.3,r*.45,0,7);x.fill()}}
  for(const s of STRC){if(s[0]<x0-4||s[1]<z0-4||s[0]>x0+T+4||s[1]>z0+T+4)continue;const[px,pz]=P2(s[0],s[1]),w=Math.max(2.4,s[2]*1.5*K);x.fillStyle='rgba(0,0,0,.35)';x.fillRect(px-w/2+1,pz-w/2+1.5,w,w);x.fillStyle=s[2]>1.6?'#9a5a3a':'#9a948a';x.fillRect(px-w/2,pz-w/2,w,w);
    x.fillStyle=s[2]>1.6?'#c07a4e':'#c8c2b6';x.fillRect(px-w/2,pz-w/2,w,Math.max(1,w*.35))}
  return cv}
function mmTile(tx,tz,build){const k=tx+','+tz;let t=MM2.tiles.get(k);if(t){t.u=performance.now();return t}if(!build)return null;const cv=mmBuild(tx,tz);if(!cv)return null;t={cv,u:performance.now()};MM2.tiles.set(k,t);
  if(MM2.tiles.size>MM2.max){let ok=null,ou=1e18;for(const[kk,v]of MM2.tiles)if(v.u<ou){ou=v.u;ok=kk}MM2.tiles.delete(ok)}return t}
// ---------- minimapa
const MMROT=[['N',0],['L',PI/2],['S',PI],['O',-PI/2]];
minimap=function(){const cv=$('mc'),css=cv.clientWidth||110,dpr=Math.min(2.5,devicePixelRatio||1),N=Math.max(160,Math.round(css*dpr));if(cv.width!=N){cv.width=cv.height=N}
  const c=mm,W=160,M=80,s=MMZ[mmZi],X=x=>M+(x-P.x)*s,Z=z=>M+(z-P.z)*s,sc_=N/W;c.setTransform(sc_,0,0,sc_,0,0);c.clearRect(0,0,W,W);c.save();c.beginPath();c.arc(M,M,M-5,0,7);c.clip();c.fillStyle='#16201a';c.fillRect(0,0,W,W);
  const src=MM2.hi||MAPC,q=src.width/(2*WMH),px=(P.x+WMH)*q,pz=(P.z+WMH)*q,span=W/s*q;c.imageSmoothingEnabled=true;c.drawImage(src,px-span/2,pz-span/2,span,span,0,0,W,W);
  // ladrilhos de detalhe (no máximo um novo por desenho)
  c.imageSmoothingEnabled=false;const T=MM2.T,rv=W/2/s,t0=Math.floor((P.x-rv)/T),t1=Math.floor((P.x+rv)/T),u0=Math.floor((P.z-rv)/T),u1=Math.floor((P.z+rv)/T);let built=0;
  const L=[];for(let a=t0;a<=t1;a++)for(let b=u0;b<=u1;b++)L.push([a,b,hy((a+.5)*T-P.x,(b+.5)*T-P.z)]);L.sort((p,q)=>p[2]-q[2]);
  for(const[a,b]of L){const t=mmTile(a,b,built<1);if(!t){if(!MM2.tiles.has(a+','+b))built++;continue}c.drawImage(t.cv,X(a*T),Z(b*T),T*s+.5,T*s+.5)}
  const dot=(x,z,col,r,ring)=>{const xx=X(x),zz=Z(z);if(hy(xx-M,zz-M)>M-6)return;c.fillStyle='rgba(0,0,0,.55)';c.beginPath();c.arc(xx,zz,r+1.1,0,7);c.fill();c.fillStyle=col;c.beginPath();c.arc(xx,zz,r,0,7);c.fill();if(ring){c.strokeStyle=ring;c.lineWidth=1.2;c.beginPath();c.arc(xx,zz,r+2,0,7);c.stroke()}};
  c.font='bold 11px Georgia';c.textAlign='center';c.textBaseline='middle';
  for(const w of WP){const xx=X(w.x),zz=Z(w.z);if(hy(xx-M,zz-M)>M-6)continue;c.fillStyle='rgba(0,0,0,.6)';c.fillText('◆',xx+.6,zz+.8);c.fillStyle=w.on?'#8fe8ff':'#6a7290';c.fillText('◆',xx,zz)}
  for(const s_ of SHRINES)if(!s_.used)dot(s_.x,s_.z,'#'+SHRN[s_.ty].c.toString(16).padStart(6,'0'),2);
  if(typeof CHESTS!='undefined')for(const ch of CHESTS)if(!ch.o&&ch.vis!==false){const xx=X(ch.x),zz=Z(ch.z);if(hy(xx-M,zz-M)<M-6){c.fillStyle='#000';c.fillRect(xx-3,zz-3,6,6);c.fillStyle='#ffd34a';c.fillRect(xx-2.2,zz-2.2,4.4,4.4)}}
  if(typeof BCH!='undefined')for(const ch of BCH)if(!ch.o){const xx=X(ch.x),zz=Z(ch.z);if(hy(xx-M,zz-M)<M-6){c.fillStyle='#000';c.fillRect(xx-4,zz-3.4,8,6.8);c.fillStyle='#ffd34a';c.fillRect(xx-3,zz-2.4,6,4.8);c.fillStyle='#8a4e08';c.fillRect(xx-3,zz-.5,6,1)}}
  for(const n of NPC)if(!n.hidden)dot(n.x,n.z,n.merc||n.follow?MMC.aliado:MMC.npc,1.9);
  if(typeof PETO!='undefined'&&PETO&&PETO.x!=null)dot(PETO.x,PETO.z,MMC.aliado,1.7);
  for(const e of E){if(e.dead)continue;if(e.t.passive){dot(e.x,e.z,MMC.passivo,1.9);continue}if(e.minion&&e.ally){dot(e.x,e.z,MMC.aliado,1.9);continue}
    if(e.boss){const xx=X(e.x),zz=Z(e.z);if(hy(xx-M,zz-M)<M-6){dot(e.x,e.z,MMC.hostil,4.6,'#ffd34a');c.fillStyle='#fff';c.font='bold 7px Georgia';c.fillText('☠',xx,zz+.5)}continue}
    dot(e.x,e.z,MMC.hostil,e.el?2.7:2.1,e.el==2?'#ffd34a':e.el==1?'#ffffff':null)}
  if(typeof MIN!='undefined')for(const o of MIN)if(o&&o.x!=null)dot(o.x,o.z,MMC.aliado,1.7);
  drawMarks(c,X,Z,M);
  const tg=qTarget();if(tg){let tx=X(tg[0]),tz=Z(tg[1]);const dx=tx-M,dz=tz-M,l=hy(dx,dz);if(l>M-15){tx=M+dx/l*(M-15);tz=M+dz/l*(M-15)}c.fillStyle='#ffd34a';c.strokeStyle='#000';c.lineWidth=1.4;c.beginPath();c.moveTo(tx,tz-7.5);c.lineTo(tx+5.5,tz);c.lineTo(tx,tz+7.5);c.lineTo(tx-5.5,tz);c.closePath();c.fill();c.stroke();c.fillStyle='#000';c.font='bold 10px Georgia';c.fillText('!',tx,tz+1)}
  const arrow=(x,z,f,col,sz)=>{c.save();c.translate(X(x),Z(z));c.rotate(PI-f);c.fillStyle=col;c.strokeStyle='#1a0a00';c.lineWidth=1.6;c.beginPath();c.moveTo(0,-7.5*sz);c.lineTo(5.5*sz,6*sz);c.lineTo(0,2.8*sz);c.lineTo(-5.5*sz,6*sz);c.closePath();c.fill();c.stroke();c.restore()};
  for(const o of MPL)if(hy(X(o.x)-M,Z(o.z)-M)<M-8)arrow(o.x,o.z,o.f||0,MMC.jogador,.85);
  // campo de visão da câmera e o herói (laranja = jogador)
  c.save();c.translate(M,M);const cy=Math.atan2(P.x-cam.position.x,P.z-cam.position.z);c.rotate(PI-cy);const g=c.createRadialGradient(0,0,2,0,0,34);g.addColorStop(0,'rgba(255,240,200,.28)');g.addColorStop(1,'rgba(255,240,200,0)');c.fillStyle=g;c.beginPath();c.moveTo(0,0);c.arc(0,0,34,-PI/2-.5,-PI/2+.5);c.closePath();c.fill();c.restore();
  arrow(P.x,P.z,P.f,MMC.jogador,1);c.restore();
  // moldura com bússola
  const rg=c.createLinearGradient(0,0,W,W);rg.addColorStop(0,'#f6dc8a');rg.addColorStop(.5,'#b8862e');rg.addColorStop(1,'#f0cc70');c.lineWidth=5.5;c.strokeStyle=rg;c.beginPath();c.arc(M,M,M-3.5,0,7);c.stroke();
  c.lineWidth=1.4;c.strokeStyle='#2a1606';c.beginPath();c.arc(M,M,M-6.6,0,7);c.stroke();c.beginPath();c.arc(M,M,M-.8,0,7);c.stroke();
  for(let i=0;i<16;i++){const a=i/16*TAU,L2=i%4==0?0:i%2?2.2:3.6;if(!L2)continue;c.strokeStyle='#3a2208';c.lineWidth=1;c.beginPath();c.moveTo(M+S(a)*(M-6.6),M-C(a)*(M-6.6));c.lineTo(M+S(a)*(M-6.6-L2),M-C(a)*(M-6.6-L2));c.stroke()}
  for(const[l,a]of MMROT){const x_=M+S(a)*(M-3.5),z_=M-C(a)*(M-3.5);c.fillStyle='#2a1606';c.beginPath();c.arc(x_,z_,6.3,0,7);c.fill();c.strokeStyle='#f0cc70';c.lineWidth=1;c.stroke();c.fillStyle=l=='N'?'#ff6a4a':'#fff3d0';c.font='bold 8px Georgia';c.fillText(l,x_,z_+.5)}
  c.setTransform(1,0,0,1,0,0)};
// ---------- mapa-múndi em alta definição (gerado aos poucos)
MM2.hiGen=(function*(){const S2=768,cv=document.createElement('canvas');cv.width=cv.height=S2;const x=cv.getContext('2d'),img=x.createImageData(S2,S2),d=img.data,k=2*WMH/S2;let prev=new Float32Array(S2),row=new Float32Array(S2);
  for(let j=0;j<S2;j++){for(let i=0;i<S2;i++){const wx=-WMH+i*k+k/2,wz=-WMH+j*k+k/2,h=rawH(wx,wz),r=regionAt(wx,wz);row[i]=h;let c;
      if(h<-.3){const dp=cl(-h/2.5,0,1);c=r==4?[62,80,58]:[70-dp*30,148-dp*45,205-dp*35]}else if(Math.max(Math.abs(wx),Math.abs(wz))>WMAX-9)c=[132,128,120];else if(roadD(wx,wz)<2.2)c=[176,146,96];
      else{c=REGRGB[r].slice();const hn=j?prev[Math.max(0,i-1)]:h,sh=cl(1+(hn-h)*.12,.72,1.3)*(.86+cl(h,0,14)*.02);c=c.map(v=>v*sh)}
      const o=(i+j*S2)*4;d[o]=c[0];d[o+1]=c[1];d[o+2]=c[2];d[o+3]=255;if((i&63)==63)yield 0}const t=prev;prev=row;row=t;if(j%48==47){x.putImageData(img,0,0,0,j-47,S2,48);yield 0}}
  x.fillStyle='#d9a948';const q=S2/(2*WMH);for(const b of BRIDGES)x.fillRect((b.x+WMH)*q-2.5,(b.z+WMH)*q-2.5,5,5);MM2.hi=cv;return 1})();
// 16.3: gera nos momentos ociosos do navegador e, no máximo, 1,5 ms por quadro (antes eram 4 ms)
if(window.requestIdleCallback){const idl=d=>{if(MM2.hi||!MM2.hiGen)return;if(!LOADING){try{while(d.timeRemaining()>2){const r=MM2.hiGen.next();if(r.done){MM2.hiGen=null;return}}}catch(e){MM2.hiGen=null;return}}requestIdleCallback(idl)};requestIdleCallback(idl)}
function mmHiUpd(){if(MM2.hi||!MM2.hiGen||LOADING)return;const t0=performance.now();while(performance.now()-t0<1.5){const r=MM2.hiGen.next();if(r.done){MM2.hiGen=null;break}}}
const _feel160=feelUpd;feelUpd=function(dt){_feel160(dt);try{mmHiUpd()}catch(e){MM2.hiGen=null}};
// ---------- mapa-múndi: maior, com zoom (botões, pinça, roda e arrastar) e o detalhe do terreno de perto
const MZ={z:1,cx:0,cz:0,wm:0,pts:new Map(),moved:0,d0:null,raf:0,wph:''};
const VPN=new Set(typeof VPOI!='undefined'?VPOI.map(p=>p.n):[]);
const _marks160=marks;marks=function(){const L=_marks160();return MZ.wm&&MZ.z<2.2?L.filter(m=>!(m.k=='p'&&VPN.has(m.n))):L};
function mzClamp(){const h=WMH/MZ.z;MZ.cx=cl(MZ.cx,-WMH+h,WMH-h);MZ.cz=cl(MZ.cz,-WMH+h,WMH-h)}
function mzDraw(){if(!MZ.raf)MZ.raf=requestAnimationFrame(()=>{MZ.raf=0;if(UI.open=='map')mapRender()})}
function mzSet(z,fx,fz){const z0=MZ.z;z=cl(z,1,8);if(fx!=null){MZ.cx=fx-(fx-MZ.cx)*z0/z;MZ.cz=fz-(fz-MZ.cz)*z0/z}MZ.z=z;mzClamp();$('mzo').classList.toggle('off',z<=1.01);$('mzi').classList.toggle('off',z>=7.99);mzDraw()}
mapRender=function(){const c=$('wm'),css=c.clientWidth||440,N=Math.min(1600,Math.round(css*Math.min(2.5,devicePixelRatio||1)));if(css>100&&Math.abs(c.width-N)>4)c.width=c.height=N;
  const x=c.getContext('2d'),dp=c.width/css,S_=css,z=MZ.z;mzClamp();const k=S_/(2*WMH)*z,ox=S_/2-(MZ.cx+WMH)*k,oz=S_/2-(MZ.cz+WMH)*k,SX=v=>(v+WMH)*k+ox,SZ=v=>(v+WMH)*k+oz;
  x.setTransform(dp,0,0,dp,0,0);x.fillStyle='#0a0612';x.fillRect(0,0,S_,S_);x.imageSmoothingEnabled=false;
  const src=MM2.hi||MAPC,q=src.width/(2*WMH);x.drawImage(src,(MZ.cx-WMH/z+WMH)*q,(MZ.cz-WMH/z+WMH)*q,2*WMH/z*q,2*WMH/z*q,0,0,S_,S_);
  if(z>=2){const T=MM2.T;for(const[key,t]of MM2.tiles){const ab=key.split(','),px=SX(+ab[0]*T),pz=SZ(+ab[1]*T),w=T*k;if(px>S_||pz>S_||px+w<0||pz+w<0)continue;x.drawImage(t.cv,px,pz,w+.5,w+.5)}}
  // névoa sobre o que ainda não foi explorado
  const FN=Math.ceil(2*WMH/10);if(!MZ.fog||MZ.fogN!=FOG.size){const fc=MZ.fog||document.createElement('canvas');fc.width=fc.height=FN;const g=fc.getContext('2d'),im=g.createImageData(FN,FN);
    for(let i=0;i<FN;i++)for(let j=0;j<FN;j++)if(!FOG.has(i+','+j)){const o=(i+j*FN)*4;im.data[o]=10;im.data[o+1]=6;im.data[o+2]=18;im.data[o+3]=204}g.putImageData(im,0,0);MZ.fog=fc;MZ.fogN=FOG.size}
  x.imageSmoothingEnabled=true;x.drawImage(MZ.fog,ox,oz,FN*10*k,FN*10*k);
  x.font='bold '+Math.round(cl(11*Math.sqrt(z),11,19))+'px Cinzel,Georgia';x.textAlign='center';x.textBaseline='alphabetic';x.fillStyle='#fff';x.strokeStyle='#000';x.lineWidth=3;x.globalAlpha=z>=3?.6:1;
  for(const r of REG){if(!P.disc.has(r.id))continue;const px=SX(r.c[0]),pz=SZ(r.c[1])-6-(z>=2?24:0);if(px<-60||px>S_+60||pz<-20||pz>S_+20)continue;x.strokeText(r.n,px,pz);x.fillText(r.n,px,pz)}x.globalAlpha=1;
  MZ.wm=1;try{x.save();x.translate(ox,oz);drawWorldMarks(x,k);x.restore()}finally{MZ.wm=0}mapLegend();
  for(const ch of BCH)if(!ch.o){const px=SX(ch.x),pz=SZ(ch.z);x.fillStyle='#000';x.fillRect(px-6,pz-5,12,10);x.fillStyle='#ffd34a';x.fillRect(px-4.5,pz-3.5,9,7);x.fillStyle='#8a4e08';x.fillRect(px-4.5,pz-.7,9,1.4)}
  const arrow=(px,pz,f,s)=>{x.save();x.translate(px,pz);x.rotate(PI-f);x.fillStyle=MMC.jogador;x.strokeStyle='#000';x.lineWidth=2;x.beginPath();x.moveTo(0,-10*s);x.lineTo(7*s,7*s);x.lineTo(0,3*s);x.lineTo(-7*s,7*s);x.closePath();x.fill();x.stroke();x.restore()};
  for(const o of MPL)arrow(SX(o.x),SZ(o.z),o.f||0,.85);arrow(SX(P.x),SZ(P.z),P.f,1);
  const h=WP.map(w=>{const px=SX(w.x),pz=SZ(w.z);if(px<-4||pz<-4||px>S_+4||pz>S_+4)return'';return`<button class="wpb ${w.on?'':'off'}" data-w="${w.id}" ${w.on?'':'disabled'} style="left:${(px/S_*100).toFixed(2)}%;top:${(pz/S_*100).toFixed(2)}%">◆${w.on||z>=3?`<span>${w.n.split(' · ').pop()}</span>`:''}</button>`}).join('');
  if(h!=MZ.wph){MZ.wph=h;$('wpl').innerHTML=h}
  $('mph').textContent=inCombat()?'Não dá para viajar em combate.':'Toque numa pedra ◆ azul para viajar. Arraste e use + − para ver de perto.'};
{const W=document.querySelector('#map .mapw');W.insertAdjacentHTML('beforeend','<div class="mzc"><button id="mzi">+</button><button id="mzo" class="off">−</button><button id="mzh" title="Centralizar">⌖</button></div>');
  $('mzi').onclick=e=>{e.stopPropagation();mzSet(MZ.z*1.7)};$('mzo').onclick=e=>{e.stopPropagation();mzSet(MZ.z/1.7)};
  $('mzh').onclick=e=>{e.stopPropagation();MZ.cx=P.x;MZ.cz=P.z;mzSet(Math.max(MZ.z,3))};
  const rel=(W_,cx,cy)=>{const r=W_.getBoundingClientRect(),mpp=2*WMH/MZ.z/r.width;return[MZ.cx+(cx-r.left-r.width/2)*mpp,MZ.cz+(cy-r.top-r.height/2)*mpp,mpp]};
  W.addEventListener('pointerdown',e=>{if(e.target.closest('.mzc'))return;MZ.pts.set(e.pointerId,[e.clientX,e.clientY]);if(MZ.pts.size==1)MZ.moved=0;MZ.d0=null});
  W.addEventListener('pointermove',e=>{const p=MZ.pts.get(e.pointerId);if(!p)return;const dx=e.clientX-p[0],dy=e.clientY-p[1];p[0]=e.clientX;p[1]=e.clientY;if(!dx&&!dy)return;
    if(MZ.pts.size==1){const mpp=rel(W,0,0)[2];MZ.moved+=Math.abs(dx)+Math.abs(dy);if(MZ.moved>6&&MZ.z>1){MZ.cx-=dx*mpp;MZ.cz-=dy*mpp;mzClamp();mzDraw()}}
    else if(MZ.pts.size==2){const[a,b]=[...MZ.pts.values()],d=hy(a[0]-b[0],a[1]-b[1]);MZ.moved=99;if(MZ.d0){const f=rel(W,(a[0]+b[0])/2,(a[1]+b[1])/2);mzSet(MZ.z*d/MZ.d0,f[0],f[1])}MZ.d0=d}});
  const up=e=>{MZ.pts.delete(e.pointerId);MZ.d0=null};W.addEventListener('pointerup',up);W.addEventListener('pointercancel',up);W.addEventListener('pointerleave',up);
  W.addEventListener('click',e=>{if(MZ.moved>6&&!e.target.closest('.mzc')){e.stopPropagation();e.preventDefault()}},true);
  W.addEventListener('wheel',e=>{e.preventDefault();const f=rel(W,e.clientX,e.clientY);mzSet(MZ.z*(e.deltaY<0?1.25:.8),f[0],f[1])},{passive:false});
  const _om=openMap;openMap=function(fromWp){MZ.wph='';if(MZ.z>1){MZ.cx=P.x;MZ.cz=P.z}_om.apply(this,arguments)}}
// legenda de cores no mapa-múndi
const _mapLegend160=mapLegend;mapLegend=function(){_mapLegend160();$('mleg').insertAdjacentHTML('beforeend',`<span class="mlk"><i style="background:${MMC.hostil}"></i>Hostil<i style="background:${MMC.passivo}"></i>Animal<i style="background:${MMC.aliado}"></i>Aliado<i style="background:${MMC.jogador}"></i>Jogador</span>`)};
document.head.insertAdjacentHTML('beforeend',`<style>.mlk{display:inline-flex;align-items:center;gap:4px;margin-left:6px;font:11px Georgia;color:#e8dcc0}.mlk i{width:9px;height:9px;border-radius:50%;display:inline-block;border:1px solid #000;margin-left:5px}
#map .mapw{overflow:hidden;touch-action:none;border-radius:4px}#wpl{position:absolute;inset:0}.wpb span{font-size:9.5px}
.mzc{position:absolute;right:6px;top:6px;display:flex;flex-direction:column;gap:6px;z-index:2}.mzc button{width:32px;height:32px;border-radius:50%;border:2px solid var(--g);background:radial-gradient(#4a3020,#140c08);color:#ffe08a;font:900 18px Georgia;padding:0;box-shadow:0 2px 6px rgba(0,0,0,.6)}.mzc button.off{opacity:.4}
@media (orientation:landscape){#map .mapbox{display:grid;width:auto;max-width:96vw;grid-template-columns:minmax(140px,190px) auto 34px;grid-template-rows:auto auto 1fr;gap:8px 12px;align-items:start}
  #map .mapbox>.wh{display:contents}#map .wh .ttl{grid-column:1;grid-row:1}#map .wh .wx{grid-column:3;grid-row:1}#map #mph{grid-column:1;grid-row:3;align-self:end;font-size:10.5px;line-height:1.35}
  #map #mleg{grid-column:1;grid-row:2;flex-direction:column;align-items:stretch;justify-content:flex-start;margin:0}#map .mlc{text-align:left}
  #map .mapw{grid-column:2;grid-row:1/4;width:calc(92vh - 34px);margin:0}
  #map .mlk{display:grid;grid-template-columns:14px 1fr;gap:5px 4px;margin:8px 0 0 4px}#map .mlk i{margin:0}}</style>`);
