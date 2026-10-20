'use strict';
/* =============================================================================
   VOXEL REALMS · inventário com o herói em destaque (16.1)
   - O herói aparece inteiro e grande na coluna da esquerda; o equipamento fica
     em duas colunas ao lado dele e o menu (atributos e mochila) abre à direita.
   - Arraste sobre o herói para girá-lo (com inércia).
   ============================================================================= */
const _openInv161=openInv;openInv=function(){_openInv161.apply(this,arguments);if(UI.open!='inv')return;requestAnimationFrame(()=>{if(innerWidth>innerHeight)heroFrame($('ivPor'),.8)})};
{const el=$('ivPor');let id=null,lx=0,vr=0,lt=0;
  el.addEventListener('pointerdown',e=>{if(e.target.closest('.es'))return;id=e.pointerId;lx=e.clientX;lt=performance.now();vr=0;el.setPointerCapture(id)});
  el.addEventListener('pointermove',e=>{if(e.pointerId!==id)return;const dx=e.clientX-lx,n=performance.now();lx=e.clientX;INV_OPEN.rot=(INV_OPEN.rot||0)+dx*.014;vr=dx*.014/Math.max(.008,(n-lt)/1000);lt=n});
  const up=e=>{if(e.pointerId!==id)return;id=null;const spin=()=>{if(id!==null||UI.open!='inv'||Math.abs(vr)<.05)return;INV_OPEN.rot+=vr/60;vr*=.92;requestAnimationFrame(spin)};requestAnimationFrame(spin)};
  el.addEventListener('pointerup',up);el.addEventListener('pointercancel',up)}
