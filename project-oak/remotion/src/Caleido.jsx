import { Video } from '@remotion/media';
import { AbsoluteFill, Sequence, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { GRADE } from './ritmo';

// Caleidoscópio de seis gomos (o hexágono do "O" do logo) feito com imagens das festas.
// Cada gomo mostra a mesma fatia da fonte; os ímpares vêm espelhados, então as emendas casam.
const Gomo = ({ i, n, src, at, giro, zoom, lado, W, H, rot }) => {
  const passo = 360 / n;
  // Cada gomo passa um pouco do limite, para não aparecer fresta entre eles.
  const a0 = ((i * passo + rot - 0.4) * Math.PI) / 180, a1 = (((i + 1) * passo + rot + 0.4) * Math.PI) / 180, am = (a0 + a1) / 2;
  const R = Math.hypot(W, H) * 1.3, cx = W / 2, cy = H / 2;
  const p = (a) => `${(cx + R * Math.cos(a)).toFixed(1)}px ${(cy + R * Math.sin(a)).toFixed(1)}px`;
  const impar = i % 2 === 1;
  return (
    <AbsoluteFill style={{ clipPath: `polygon(${cx}px ${cy}px, ${p(a0)}, ${p(am)}, ${p(a1)})` }}>
      <div
        style={{
          position: 'absolute', left: cx - lado / 2, top: cy - lado / 2, width: lado, height: lado,
          transform: impar ? `rotate(${(i + 1) * passo + rot}deg) scaleY(-1)` : `rotate(${i * passo + rot}deg)`,
        }}
      >
        <Video
          src={staticFile(src)}
          muted
          trimBefore={Math.round(at * 30)}
          objectFit="cover"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', filter: GRADE, transform: `rotate(${giro}deg) scale(${zoom})` }}
        />
      </div>
    </AbsoluteFill>
  );
};

// rot gira a mandala inteira (os gomos e o conteúdo juntos), sem mostrar canto do quadro.
export const Caleido = ({ src, at = 0, n = 6, giro = 0, zoom = 1, rot = 0, style }) => {
  const { width: W, height: H } = useVideoConfig();
  const lado = Math.hypot(W, H) * 1.05;
  return (
    <AbsoluteFill style={{ overflow: 'hidden', ...style }}>
      {Array.from({ length: n }, (_, i) => (
        <Gomo key={i} i={i} n={n} src={src} at={at} giro={giro} zoom={zoom} lado={lado} W={W} H={H} rot={rot} />
      ))}
    </AbsoluteFill>
  );
};

// Caleidoscópio com giro e respiração próprios, para usar dentro de uma Sequence.
export const CaleidoVivo = ({ src, at, n = 6, velocidade = 0.35, base = 1.15, style }) => {
  const f = useCurrentFrame();
  return <Caleido src={src} at={at} n={n} giro={f * velocidade} zoom={base + Math.sin(f / 40) * 0.06} style={style} />;
};

// Trecho simples (sem espelho) que começa no segundo `at` da fonte.
export const Trecho = ({ src, at, from, dur, name, style }) => {
  const { fps } = useVideoConfig();
  return (
    <Sequence from={from} durationInFrames={dur} name={name || `${src} @ ${at}s`} layout="none">
      <Video
        src={staticFile(src)}
        muted
        trimBefore={Math.round(at * fps)}
        objectFit="cover"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', filter: GRADE, ...style }}
      />
    </Sequence>
  );
};
