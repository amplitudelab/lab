import { AbsoluteFill, useVideoConfig } from 'remotion';
import { Painel } from './Cena';
import { b, COR } from './ritmo';

// Fundo da primeira tela. No desktop, um tríptico: Arcadia 2023 (dia, na mata), Neelix & Friends
// 2026 (salão em Bremen) e Rick's Experiment (noite, ao ar livre). Os dois primeiros foram
// gravados na vertical, por isso cada festa ganha uma coluna em vez de ser cortada para 16:9.
// Os cortes caem a cada 4 batidas de 140 BPM e correm da esquerda para a direita, uma batida
// de diferença entre colunas.
const DUR = b(4);
const N = 8;
export const LOOP = DUR * N;

const ARCADIA = [44, 88, 20, 92, 52.5, 76, 8, 64].map((at) => ({ src: 'arcadia.mp4', at }));
const NEELIX = [15, 33, 47.5, 25, 10, 57, 30, 18.5].map((at) => ({ src: 'neelix.mp4', at }));
const RICKS = [51, 65, 10.5, 34, 85, 27.5, 3.5, 57.5].map((at) => ({ src: 'ricks.mp4', at }));
// No celular, uma coluna só, alternando as três festas.
const VERTICAL = [
  { src: 'neelix.mp4', at: 15 },
  { src: 'arcadia.mp4', at: 44 },
  { src: 'ricks.mp4', at: 51 },
  { src: 'neelix.mp4', at: 33 },
  { src: 'arcadia.mp4', at: 88 },
  { src: 'ricks.mp4', at: 34 },
  { src: 'neelix.mp4', at: 47.5 },
  { src: 'arcadia.mp4', at: 92 },
];

export const Montagem = () => {
  const { width, height } = useVideoConfig();
  if (height > width) {
    return (
      <AbsoluteFill style={{ backgroundColor: COR.tinta }}>
        <Painel cenas={VERTICAL} dur={DUR} L={LOOP} />
      </AbsoluteFill>
    );
  }
  const col = width / 3;
  const fenda = 3;
  return (
    <AbsoluteFill style={{ backgroundColor: COR.tinta }}>
      {[ARCADIA, NEELIX, RICKS].map((cenas, i) => (
        <Painel
          key={i}
          cenas={cenas}
          dur={DUR}
          off={b(i)}
          L={LOOP}
          style={{ left: i * col + (i ? fenda / 2 : 0), width: col - (i === 1 ? fenda : fenda / 2), right: 'auto' }}
        />
      ))}
    </AbsoluteFill>
  );
};
