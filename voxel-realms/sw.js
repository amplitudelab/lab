// rede primeiro (sempre pega a versão nova do jogo); sem rede, usa a cópia guardada
const C='vr-cache';
self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));
self.addEventListener('fetch',e=>{const r=e.request;if(r.method!=='GET'||!r.url.startsWith(self.location.origin))return;
  e.respondWith((r.mode==='navigate'?fetch(r):fetch(r.url,{cache:'no-cache'})).then(res=>{if(res.ok&&res.type==='basic'){const cp=res.clone();caches.open(C).then(c=>c.put(r,cp))}return res}).catch(()=>caches.match(r).then(m=>m||caches.match(r,{ignoreSearch:true}))))});
