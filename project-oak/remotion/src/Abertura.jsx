import { AbsoluteFill, Easing, Img, interpolate, Sequence, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { CaleidoVivo, Trecho } from './Caleido';
import { b, BATIDA, COR, GRAVATA, LOGO_PROP, PECAS } from './ritmo';

// Abertura do site (sem som, 12 batidas a 138 BPM).
// 1. Um fio de latão corta o escuro.  2. O, A e K entram um por batida, com a cor separada.
// 3. A cartola cai e assenta na batida 4.  4. As letras viram janelas para a festa (caleidoscópio).
// 5. A câmera entra pela gravata, que é vazada no logo, e do outro lado está a pista.
export const DURACAO_ABERTURA = b(12) + 6;

const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' };
const mola = Easing.bezier(0.16, 1, 0.3, 1);
const mergulho = Easing.bezier(0.75, 0, 0.9, 0.35);

const geometria = (W, H) => {
  const retrato = H > W;
  const lw = retrato ? W * 0.78 : Math.min(W * 0.5, 980);
  const lh = lw * LOGO_PROP;
  return { lw, lh, lx: (W - lw) / 2, ly: (H - lh) / 2 - (retrato ? H * 0.02 : 0) };
};

// Uma peça do logo: recorte, entrada com escala e franja de cor que se desfaz.
const Peca = ({ recorte, entra, g, desce = false }) => {
  const f = useCurrentFrame();
  const t = f - entra;
  const vis = t >= 0 ? 1 : 0;
  const s = interpolate(t, [0, 8], [1.28, 1], { ...clamp, easing: mola });
  const franja = interpolate(t, [0, 10], [g.lw * 0.012, 0], clamp);
  const queda = desce ? interpolate(t, [0, 9, 13, 16], [-g.lh * 0.9, g.lh * 0.03, -g.lh * 0.015, 0], { ...clamp, easing: Easing.bezier(0.5, 0, 0.75, 0) }) : 0;
  const giro = desce ? interpolate(t, [0, 9, 13], [-28, 4, 0], clamp) : 0;
  return (
    <Img
      src={staticFile('logo-4x.png')}
      style={{
        position: 'absolute', left: 0, top: 0, width: '100%', height: '100%',
        clipPath: recorte, opacity: vis,
        scale: String(desce ? 1 : s),
        translate: `0px ${queda.toFixed(1)}px`,
        rotate: `${giro}deg`,
        transformOrigin: desce ? '14% 30%' : '50% 60%',
        filter: franja > 0.3 ? `drop-shadow(${franja.toFixed(1)}px 0 0 #ff2d6f) drop-shadow(${(-franja).toFixed(1)}px 0 0 #2de6ff)` : 'none',
      }}
    />
  );
};

const Fio = ({ W, H }) => {
  const f = useCurrentFrame();
  const larg = interpolate(f, [0, b(0.8), b(1)], [0, 0.62, 0], { ...clamp, easing: mola });
  const brilho = interpolate(f, [0, b(1)], [0.4, 1], clamp);
  return (
    <div style={{ position: 'absolute', left: (W * (1 - larg)) / 2, top: H / 2, width: W * larg, height: 2, background: `linear-gradient(90deg, transparent, ${COR.lataoClaro}, transparent)`, opacity: brilho, boxShadow: `0 0 24px ${COR.latao}` }} />
  );
};

// Fumaça e luz de palco: gradientes que respiram (no lugar de partículas, pesa pouco no vídeo).
const Atmosfera = ({ W, H }) => {
  const f = useCurrentFrame();
  const acende = interpolate(f, [b(4), b(4) + 3, b(5)], [0, 1, 0.55], clamp);
  const puff = interpolate(f, [b(4), b(6)], [0, 1], { ...clamp, easing: mola });
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ background: `radial-gradient(ellipse 38% 70% at 50% -10%, rgba(243,210,154,${(0.05 + acende * 0.22).toFixed(3)}), transparent 70%)` }} />
      <AbsoluteFill style={{ opacity: (1 - puff) * 0.6, background: `radial-gradient(circle at 30% 30%, rgba(236,230,218,.18), transparent ${(10 + puff * 40).toFixed(1)}%)` }} />
      <AbsoluteFill style={{ opacity: 0.35, background: `radial-gradient(ellipse 60% 40% at ${50 + Math.sin(f / 23) * 8}% 78%, rgba(139,92,255,.16), transparent 70%)` }} />
    </AbsoluteFill>
  );
};

// Brilho de latão que atravessa as letras.
const Reflexo = ({ g }) => {
  const f = useCurrentFrame();
  const x = interpolate(f, [b(5), b(7)], [-40, 140], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  return (
    <div
      style={{
        position: 'absolute', inset: 0,
        background: `linear-gradient(105deg, transparent ${x - 18}%, rgba(243,210,154,.9) ${x}%, transparent ${x + 18}%)`,
        maskImage: `url(${staticFile('logo-4x.png')})`, maskSize: '100% 100%', WebkitMaskImage: `url(${staticFile('logo-4x.png')})`, WebkitMaskSize: '100% 100%',
        mixBlendMode: 'screen',
      }}
    />
  );
};

const Janelas = ({ g }) => {
  const f = useCurrentFrame();
  const abre = interpolate(f, [b(4.5), b(6)], [0, 1], clamp);
  const mask = { maskImage: `url(${staticFile('logo-4x.png')})`, maskSize: '100% 100%', WebkitMaskImage: `url(${staticFile('logo-4x.png')})`, WebkitMaskSize: '100% 100%' };
  return (
    <div style={{ position: 'absolute', inset: 0, opacity: abre, ...mask }}>
      <div style={{ position: 'absolute', left: -g.lw * 0.25, top: -g.lh * 0.25, width: g.lw * 1.5, height: g.lh * 1.5 }}>
        <Sequence from={b(4)} layout="none">
          <CaleidoVivo src="dreamon.mp4" at={2} velocidade={0.5} base={1.3} />
        </Sequence>
      </div>
    </div>
  );
};

export const Abertura = () => {
  const f = useCurrentFrame();
  const { width: W, height: H } = useVideoConfig();
  const g = geometria(W, H);
  const zoom = interpolate(f, [b(8), b(11.2)], [1, 70], { ...clamp, easing: mergulho });
  const ox = g.lx + g.lw * GRAVATA.x, oy = g.ly + g.lh * GRAVATA.y;
  // A pista do outro lado entra pela gravata; o resto do quadro é o palco escuro.
  const mascara = {
    maskImage: `url(${staticFile('gravata-4x.png')}), linear-gradient(#000, #000)`,
    WebkitMaskImage: `url(${staticFile('gravata-4x.png')}), linear-gradient(#000, #000)`,
    maskSize: `${g.lw}px ${g.lh}px, 100% 100%`, WebkitMaskSize: `${g.lw}px ${g.lh}px, 100% 100%`,
    maskPosition: `${g.lx}px ${g.ly}px, 0 0`, WebkitMaskPosition: `${g.lx}px ${g.ly}px, 0 0`,
    maskRepeat: 'no-repeat', WebkitMaskRepeat: 'no-repeat',
    maskComposite: 'exclude', WebkitMaskComposite: 'xor',
  };
  const brancoLetras = interpolate(f, [b(4.5), b(6.5)], [1, 0.18], clamp);
  const pista = interpolate(f, [b(7), b(8)], [0, 1], clamp);
  // No mergulho as letras escurecem: o que brilha é a gravata, a porta para a pista.
  const apaga = interpolate(f, [b(8.4), b(10)], [1, 0.22], clamp);
  return (
    <AbsoluteFill style={{ backgroundColor: COR.noite }}>
      {/* Do outro lado da gravata: a pista. */}
      <AbsoluteFill style={{ opacity: pista }}>
        <Trecho src="gg.mp4" at={1} from={b(6)} dur={b(7)} name="GG Showcase · lasers" />
        <AbsoluteFill style={{ background: 'radial-gradient(ellipse at center, transparent 40%, rgba(11,10,8,.55) 100%)' }} />
      </AbsoluteFill>
      <AbsoluteFill style={{ scale: String(zoom), transformOrigin: `${ox}px ${oy}px` }}>
        <AbsoluteFill style={{ backgroundColor: COR.noite, ...mascara }}>
          <Atmosfera W={W} H={H} />
          <Fio W={W} H={H} />
        </AbsoluteFill>
        <div style={{ position: 'absolute', left: g.lx, top: g.ly, width: g.lw, height: g.lh, opacity: apaga }}>
          <Janelas g={g} />
          <div style={{ position: 'absolute', inset: 0, opacity: brancoLetras }}>
            <Peca recorte={PECAS.o} entra={b(1)} g={g} />
            <Peca recorte={PECAS.a} entra={b(2)} g={g} />
            <Peca recorte={PECAS.k} entra={b(3)} g={g} />
          </div>
          <Peca recorte={PECAS.cartola} entra={b(3.3)} g={g} desce />
          <Reflexo g={g} />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
