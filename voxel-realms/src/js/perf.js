'use strict';
/* =============================================================================
   VOXEL REALMS · otimizações sem mudar o visual (16.3)
   - A atualização de matrizes da cena (feita a cada quadro pelo renderizador)
     pula os grupos invisíveis: monstros, moradores e efeitos fora da vista não
     custam nada até voltarem a aparecer. Chamadas explícitas a
     updateMatrixWorld/updateWorldMatrix continuam iguais (usam o original).
   - Ver também: world.js (alturas e decoração em etapas), entities.js (monstros
     nascem um por quadro), minimap2.js (mapa em alta nos momentos ociosos).
   ============================================================================= */
{const O3=THREE.Object3D.prototype.updateMatrixWorld;
  const upd=(o,force)=>{if(o.matrixAutoUpdate)o.updateMatrix();if(o.matrixWorldNeedsUpdate||force){if(o.parent===null)o.matrixWorld.copy(o.matrix);else o.matrixWorld.multiplyMatrices(o.parent.matrixWorld,o.matrix);o.matrixWorldNeedsUpdate=false;force=true}
    const ch=o.children;for(let i=0,n=ch.length;i<n;i++){const c=ch[i];if(c.updateMatrixWorld!==O3){c.updateMatrixWorld(force);continue}if(c.visible)upd(c,force);else if(force)c.matrixWorldNeedsUpdate=true}};
  sc.updateMatrixWorld=function(force){upd(this,force)}}
