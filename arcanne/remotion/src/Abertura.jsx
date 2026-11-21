import { AbsoluteFill, Easing, Img, interpolate, Sequence, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { Trecho } from './Cena';
import { b, COR } from './ritmo';

// Abertura do site (3,7 s, sem som). Os três anéis do logo aparecem um por batida, de dentro
// para fora, como onda; no anel do meio passam três cenas, uma de cada festa; o nome entra
// pela esquerda; e o anel central abre como íris até a imagem tomar a tela.
export const DURACAO = b(8) + 9;

const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' };
const mola = Easing.bezier(0.16, 1, 0.3, 1);
const iris = Easing.bezier(0.7, 0, 0.2, 1);

const Aneis = ({ R, cx, cy }) => {
  const f = useCurrentFrame();
  // Raio de recorte de cada anel, em fração do raio do logo.
  const corte = interpolate(f, [0, b(0.5), b(1), b(1.5), b(2), b(2.6)], [0, 0.26, 0.26, 0.5, 0.5, 0.75], { ...clamp, easing: mola });
  const soco = interpolate(f % Math.round(b(1)), [0, 6], [1.045, 1], clamp);
  const fuga = interpolate(f, [b(5), b(7.6)], [1, 3.4], { ...clamp, easing: iris });
  const some = interpolate(f, [b(6.2), b(7.4)], [1, 0], clamp);
  return (
    <Img
      src={staticFile('anel.webp')}
      style={{
        position: 'absolute',
        width: R * 2,
        height: R * 2,
        left: cx - R,
        top: cy - R,
        objectFit: 'contain',
        clipPath: `circle(${(corte * 100).toFixed(2)}% at 50% 50%)`,
        scale: String((f < b(3) ? soco : 1) * fuga),
        rotate: `${interpolate(f, [0, b(3)], [-14, 0], { ...clamp, easing: mola })}deg`,
        opacity: some,
      }}
    />
  );
};

const Iris = ({ R, cx, cy, W, H }) => {
  const f = useCurrentFrame();
  const r0 = R * 0.2;
  const rMax = Math.hypot(Math.max(cx, W - cx), Math.max(cy, H - cy));
  const r = interpolate(f, [b(2), b(2.4), b(5), b(7.4)], [0, r0, r0, rMax], { ...clamp, easing: iris });
  return (
    <AbsoluteFill style={{ clipPath: `circle(${r.toFixed(1)}px at ${cx}px ${cy}px)` }}>
      <Trecho src="arcadia.mp4" at={44} from={b(2)} dur={b(1)} name="Arcadia 2023 · bandeira" />
      <Trecho src="ricks.mp4" at={51} from={b(3)} dur={b(1)} name="Rick's Experiment · pista" />
      <Trecho src="neelix.mp4" at={14} from={b(4)} dur={DURACAO - b(4)} name="Neelix & Friends 2026 · Bremen" />
      <AbsoluteFill style={{ background: `radial-gradient(circle at ${cx}px ${cy}px, transparent 30%, rgba(11,11,12,.55) 100%)` }} />
    </AbsoluteFill>
  );
};

const Nome = ({ W, H, cy, R, retrato }) => {
  const f = useCurrentFrame();
  const largura = retrato ? W * 0.82 : Math.min(W * 0.5, R * 3.4);
  const abre = interpolate(f, [b(3), b(4.2)], [100, 0], { ...clamp, easing: mola });
  const sobe = interpolate(f, [b(6), b(7.6)], [0, -0.06 * H], { ...clamp, easing: iris });
  const some = interpolate(f, [b(6.6), b(7.6)], [1, 0], clamp);
  return (
    <Img
      src={staticFile('palavra.webp')}
      style={{
        position: 'absolute',
        width: largura,
        left: (W - largura) / 2,
        top: cy + R * 1.12,
        clipPath: `inset(0 ${abre.toFixed(2)}% 0 0)`,
        translate: `0px ${sobe.toFixed(1)}px`,
        opacity: some,
      }}
    />
  );
};

export const Abertura = () => {
  const { width: W, height: H } = useVideoConfig();
  const retrato = H > W;
  const R = Math.min(W, H) * (retrato ? 0.3 : 0.2);
  const cx = W / 2;
  const cy = H * (retrato ? 0.4 : 0.38);
  return (
    <AbsoluteFill style={{ backgroundColor: COR.tinta }}>
      <Sequence name="Íris com as festas" layout="none">
        <Iris R={R} cx={cx} cy={cy} W={W} H={H} />
      </Sequence>
      <Sequence name="Anéis" layout="none">
        <Aneis R={R} cx={cx} cy={cy} />
      </Sequence>
      <Sequence name="Nome" layout="none">
        <Nome W={W} H={H} cy={cy} R={R} retrato={retrato} />
      </Sequence>
    </AbsoluteFill>
  );
};
