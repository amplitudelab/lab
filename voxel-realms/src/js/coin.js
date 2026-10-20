'use strict';
/* =============================================================================
   VOXEL REALMS · moeda de ouro (15.8)
   - Ícone em pixel art: moeda dourada com aro, brilho e um V cunhado no centro.
     Substitui o emoji 🪙 em toda a interface (HUD, loja, inventário, avisos,
     números flutuantes): um observador troca o caractere pelo ícone assim que
     o texto entra na página.
   - Ouro no chão: pilha de moedas octogonais e uma moeda de pé com o V.
   ============================================================================= */
const VCOIN=(()=>{const N=16,c=document.createElement('canvas');c.width=c.height=N;const x=c.getContext('2d'),im=x.createImageData(N,N),d=im.data;
  const hex=h=>[h>>16&255,h>>8&255,h&255],put=(X,Y,h)=>{const j=(Y*N+X)*4,q=hex(h);d[j]=q[0];d[j+1]=q[1];d[j+2]=q[2];d[j+3]=255};
  const seg=(px,py,ax,ay,bx,by)=>{const vx=bx-ax,vy=by-ay,t=Math.max(0,Math.min(1,((px-ax)*vx+(py-ay)*vy)/(vx*vx+vy*vy)));return Math.hypot(px-ax-vx*t,py-ay-vy*t)};
  const isV=(px,py)=>seg(px,py,5,4.6,8,11.4)<.95||seg(px,py,11,4.6,8,11.4)<.95;
  for(let Y=0;Y<N;Y++)for(let X=0;X<N;X++){const px=X+.5,py=Y+.5,dx=px-8,dy=py-8,r=Math.hypot(dx,dy),s=dx+dy;if(r>7.7)continue;
    if(r>6.8)put(X,Y,0x5a3206);else if(r>5.7)put(X,Y,s<-1?0xffe27a:s>3?0xb87812:0xe8a826);
    else if(isV(px,py))put(X,Y,0x8a4e08);else if(isV(px+1,py+1))put(X,Y,0xfff4b8);
    else put(X,Y,s<-5?0xfff0a0:s>5?0xe0a020:0xffcc33)}
  x.putImageData(im,0,0);return c.toDataURL()})();
document.head.insertAdjacentHTML('beforeend',`<style>vr-c{display:inline-block;width:1.08em;height:1.08em;vertical-align:-.18em;background:url(${VCOIN}) center/contain no-repeat;image-rendering:pixelated;filter:drop-shadow(0 1px 0 rgba(0,0,0,.45))}.gl vr-c{width:1.25em;height:1.25em;vertical-align:-.25em}</style>`);
function vcFix(root){if(!root)return;const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode:n=>n.nodeValue.indexOf('🪙')>=0?1:2}),L=[];while(w.nextNode())L.push(w.currentNode);
  for(const n of L){if(!n.parentNode)continue;const f=document.createDocumentFragment();n.nodeValue.split('🪙').forEach((s,i)=>{if(i)f.appendChild(document.createElement('vr-c'));if(s)f.appendChild(document.createTextNode(s))});n.parentNode.replaceChild(f,n)}}
new MutationObserver(ms=>{for(const m of ms){if(m.type=='characterData'){const t=m.target;if(t.nodeValue&&t.nodeValue.indexOf('🪙')>=0)vcFix(t.parentNode)}
  else for(const a of m.addedNodes){if(a.nodeType==3){if(a.nodeValue.indexOf('🪙')>=0)vcFix(a.parentNode)}else if(a.nodeType==1&&a.textContent.indexOf('🪙')>=0)vcFix(a)}}}).observe(document.body,{childList:true,subtree:true,characterData:true});
vcFix(document.body);
// ouro no chão: moedas de verdade
dropGold=function(x,z,n){if(n<1)return;const k=new Bake(),q=Math.min(6,2+Math.floor(Math.log10(n+1)*1.5)),G=0xffcc33,G2=0xeeb026,D=0x8a4e08;
  for(let i=0;i<q;i++){const ry=R()*.8,ox=(R()-.5)*.1,oz=(R()-.5)*.1;k.box(.34,.06,.34,ox,i*.065,oz,i%2?G:G2,{ry}).box(.34,.06,.34,ox,i*.065,oz,i%2?G2:G,{ry:ry+.785}).box(.36,.02,.36,ox,i*.065+.035,oz,0xffe27a,{ry:ry+.39})}
  const sx=.24,sy=.21;k.box(.38,.38,.06,sx,sy,0,G).box(.38,.38,.06,sx,sy,0,G2,{rz:.785}).box(.3,.3,.065,sx,sy,0,0xffe27a,{rz:.39});
  k.box(.05,.22,.08,sx-.05,sy,0,D,{rz:.42}).box(.05,.22,.08,sx+.05,sy,0,D,{rz:-.42});
  const inner=new THREE.Group();inner.add(k.mesh(MV));const L=dropLoot({k:'gold',n,m:lootGroup(inner,.5,null)},x,z);L.sp=spr(0xffd34a,1,.5);sc.add(L.sp)};
