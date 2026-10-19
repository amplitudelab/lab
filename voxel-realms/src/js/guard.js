'use strict';
/* =============================================================================
   VOXEL REALMS · bloqueio, árvore só da classe e visão dos inimigos
   Bloquear (🛡️ ou Z): segura a guarda; golpes e projéteis pela frente perdem
   70% do dano (40% com arco/besta). Bloquear no último instante (0,25 s) é um
   Aparo Perfeito: anula o golpe, atordoa o atacante e o próximo golpe é crítico.
   ============================================================================= */
P.block=0;P.blkT=0;
function blockSet(v){if(P.dead||UI.block()||P.mounted){P.block=0;return}if(v&&!P.block){P.blkT=0;P.act=null;UI.atkHeld=0;snd(380,.05,'square')}P.block=v?1:0;$('blkb').classList.toggle('on',!!P.block)}
function blockUpd(dt){if(P.block){P.blkT+=dt;if(P.dash>0||P.dead||UI.block())blockSet(0)}}
const _bs=new V3();
function blockHit(d,o){if(!P.block)return d;const s=o.src;if(!s)return d;const sx=s.x!=null?s.x:s.o&&s.o.position.x,sz=s.z!=null?s.z:s.o&&s.o.position.z;if(sx==null)return d;
  if(Math.abs(angDiff(P.f,Math.atan2(sx-P.x,sz-P.z)))>1.35)return d; // pelas costas não bloqueia
  const hx=P.x+S(P.f)*.9,hz=P.z+C(P.f)*.9,hy_=P.y+1.5;
  if(P.blkT<.25){HITSTOP=.16;SHK=Math.max(SHK,.35);P.buff.pf=2;pop('APARO PERFEITO!',P.x,P.y+3.6,P.z,'#ffe08a',1);flash(hx,hy_,hz,0xffe8a0,4,.3);fx(hx,hy_,hz,0xffe08a,16,8,.08,.6,6);ring(P.x,P.z,2.4,0xffe08a,.35);
    snd(1800,.08,'square');snd(900,.2,'triangle');if(s.t&&!s.boss){s.stun=Math.max(s.stun||0,1.2);s.vx=(s.vx||0)+S(P.f)*6;s.vz=(s.vz||0)+C(P.f)*6}else if(s.boss)s.stun=Math.max(s.stun||0,.35);return 0}
  fx(hx,hy_,hz,0xfff0c0,8,6,.07,.5,6);flash(hx,hy_,hz,0xffffff,1.6,.15);snd(1200,.06,'square');pop('Bloqueado',P.x,P.y+3,P.z,'#d8e0f0');SHK=Math.max(SHK,.12);
  return Math.max(1,Math.round(d*(bow()||MANA()?.6:.3)))}

// ---------- árvore só da classe: devolve pontos de habilidades de outras classes
const CLS_TREE={guerreiro:'guerra',mago:'arcano',cacador:'arco'};
Object.assign(SK.vital,{t:'guerra'});Object.assign(SK.agil,{t:'arco'});Object.assign(SK.sombra,{t:'arco'});Object.assign(SK.cura,{t:'arcano'});Object.assign(SK.chama,{t:'arcano'});
function treeOrder(){const f=CLS_TREE[P.cls]||'guerra';return[TREE.find(t=>t.id==f)]}
function skillPurge(){const f=CLS_TREE[P.cls]||'guerra';let n=0;for(const k in P.sk){if(!SK[k]||SK[k].t!=f){n+=P.sk[k]|0;delete P.sk[k]}}P.bar=P.bar.map(k=>k&&P.sk[k]?k:null);if(n){P.sp+=n;toast('✨','Árvore da sua classe',n+' ponto'+(n>1?'s':'')+' devolvido'+(n>1?'s':'')+' para aprender de novo.')}calcStats();hud()}

// ---------- visão e audição dos inimigos
const KEEN={wolf:1,dwolf:1,spider:1,croc:1,fox:1,imp:1};
function losClear(x0,z0,x1,z1){const d=hy(x1-x0,z1-z0),n=Math.floor(d/2.2);for(let i=1;i<n;i++){const k=i/n,x=lerp(x0,x1,k),z=lerp(z0,z1,k),c=CHK.get(ckey(Math.floor(x/CS),Math.floor(z/CS)));
    if(c&&c.col)for(const o of c.col){if(Math.abs(x-o[0])<o[2]*.75&&Math.abs(z-o[1])<o[2]*.75)return false}
    for(const o of STRC){if(Math.abs(x-o[0])<o[2]*.85&&Math.abs(z-o[1])<o[2]*.85)return false}}return true}
function aiSees(e,d,dt){if(P.dead)return false;if(d<7)return true;                      // perto: ouve e percebe sempre
  const T=e.t,noisy=P.run&&(P.v||0)>6||P.mounted;if(noisy&&d<20)return true;              // correr/montaria fazem barulho
  const crouch=P.sneak?.55:1,R_=(T.ai=='ranged'?28:24)*(KEEN[e.type]&&NIGHT>.5?1.2:1)*crouch;if(d>R_)return false;
  e.lsT=(e.lsT||R()*.4)-dt;if(e.lsT>0)return false;e.lsT=.35;
  const fv=Math.abs(angDiff(e.f,Math.atan2(P.x-e.x,P.z-e.z)))<1.6||d<12;                  // de costas enxergam menos
  return fv&&losClear(e.x,e.z,P.x,P.z)}
// animações das magias do mago e do guerreiro
Object.assign(SK.meteoro,{anim:'castUp',dur:.75});Object.assign(SK.cura,{anim:'castUp',dur:.6});Object.assign(SK.escudo,{anim:'castUp',dur:.55});
Object.assign(SK.gelo,{anim:'stomp',dur:.6,hp:.56});Object.assign(SK.chama,{anim:'stomp',dur:.6,hp:.56});Object.assign(SK.raio,{anim:'palm',dur:.5,hp:.5});
