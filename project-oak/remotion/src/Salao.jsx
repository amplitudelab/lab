import { AbsoluteFill, interpolate, Sequence, useCurrentFrame } from 'remotion';
import { Caleido } from './Caleido';
import { b, bumbo, COR } from './ritmo';

// Fundo da primeira tela: as festas dele viradas mandala. Loop de 16 batidas sem emenda:
// os cortes caem a cada 4 batidas (o começo do loop é um desses cortes) e a mandala
// inteira gira 120° por volta, que é a simetria dela, então o fim encaixa no começo.
export const LOOP_SALAO = b(16);

const CENAS = [
  { src: 'dreamon.mp4', at: 1, name: 'Dream On · palco' },
  { src: 'infinity.mp4', at: 1, name: 'Infinity · lasers' },
  { src: 'horus.mp4', at: 1.5, name: 'Horus · pista' },
  { src: 'gg.mp4', at: 1, name: 'GG Showcase · lasers' },
];

const Cena = ({ src, at, k, rot }) => {
  const f = useCurrentFrame(); // local na cena
  const pulso = bumbo(f);
  return <Caleido src={src} at={at} zoom={1.18 + pulso * 0.035 + k * 0.02} giro={k * 17} rot={rot} />;
};

export const Salao = () => {
  const f = useCurrentFrame();
  const L = LOOP_SALAO;
  const giro = (f / L) * 120;
  const corte = Math.min(...[0, 1, 2, 3, 4].map((k) => Math.abs(f - b(k * 4))));
  const flash = interpolate(corte, [0, 4], [0.5, 0], { extrapolateRight: 'clamp' });
  return (
    <AbsoluteFill style={{ backgroundColor: COR.noite, overflow: 'hidden' }}>
      <AbsoluteFill>
        {CENAS.map((c, k) => (
          <Sequence key={k} from={b(k * 4)} durationInFrames={b((k + 1) * 4) - b(k * 4)} name={c.name}>
            <Cena {...c} k={k} rot={giro} />
          </Sequence>
        ))}
      </AbsoluteFill>
      <AbsoluteFill style={{ background: `rgba(243,210,154,${flash.toFixed(3)})`, mixBlendMode: 'overlay' }} />
      <AbsoluteFill style={{ background: 'radial-gradient(ellipse at center, rgba(11,10,8,.05) 20%, rgba(11,10,8,.7) 85%)' }} />
    </AbsoluteFill>
  );
};
