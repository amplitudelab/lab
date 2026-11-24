import { Audio } from '@remotion/media';
import { loadFont as bodoni } from '@remotion/google-fonts/BodoniModa';
import { loadFont as sans } from '@remotion/google-fonts/InstrumentSans';
import { AbsoluteFill, Easing, Img, interpolate, Sequence, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { Abertura } from './Abertura';
import { CaleidoVivo, Trecho } from './Caleido';
import { b, bumbo, COR } from './ritmo';
import { Tunel } from './Tunel';

// Teaser de divulgação (vertical, com som). A faixa é a preferida do press kit, a 138 BPM
// com a primeira batida em 0 s; o drop cai na batida 52 (22,6 s). O áudio começa 12 batidas
// antes, então o drop acerta o fim da abertura, quando a câmera atravessa a gravata.
export const DURACAO_TEASER = b(40);
const INICIO_AUDIO = (40 * 60) / 138; // 17,39 s

const { fontFamily: serif } = bodoni('italic', { weights: ['600'], subsets: ['latin'] });
const { fontFamily: grot } = sans('normal', { weights: ['600'], subsets: ['latin'] });
const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' };

// Oito cortes de 2 batidas; os pares viram mandala.
const CORTES = [
  { src: 'fogo.mp4', at: 1 },
  { src: 'dreamon.mp4', at: 4, cal: true },
  { src: 'horus.mp4', at: 3 },
  { src: 'reveillon.mp4', at: 2, cal: true },
  { src: 'sintetika.mp4', at: 2 },
  { src: 'infinity.mp4', at: 4, cal: true },
  { src: 'noite.mp4', at: 1.5 },
  { src: 'gg.mp4', at: 5, cal: true },
];

const Flash = () => {
  const f = useCurrentFrame();
  return <AbsoluteFill style={{ background: COR.lataoClaro, opacity: interpolate(f % b(2), [0, 3], [0.35, 0], clamp), mixBlendMode: 'overlay' }} />;
};

const Montagem = () => (
  <AbsoluteFill>
    {CORTES.map((c, k) => (
      <Sequence key={k} from={b(k * 2)} durationInFrames={b(k * 2 + 2) - b(k * 2)} name={c.src}>
        {c.cal ? <CaleidoVivo src={c.src} at={c.at} velocidade={0.8} base={1.25} /> : <Trecho src={c.src} at={c.at} from={0} dur={b(2) + 1} />}
      </Sequence>
    ))}
    <Flash />
    <AbsoluteFill style={{ background: 'radial-gradient(ellipse at center, transparent 45%, rgba(11,10,8,.6) 100%)' }} />
  </AbsoluteFill>
);

const LogoPulsa = () => {
  const f = useCurrentFrame();
  const { width: W } = useVideoConfig();
  const s = 1 + bumbo(f) * 0.06;
  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
      <Img src={staticFile('logo-4x.png')} style={{ width: W * 0.62, scale: String(s), filter: `drop-shadow(0 0 ${20 + bumbo(f) * 30}px rgba(217,163,91,.55))` }} />
    </AbsoluteFill>
  );
};

const Fecho = () => {
  const f = useCurrentFrame();
  const { width: W, height: H } = useVideoConfig();
  const entra = (d) => ({ opacity: interpolate(f, [d, d + 8], [0, 1], clamp), translate: `0px ${interpolate(f, [d, d + 10], [24, 0], { ...clamp, easing: Easing.bezier(0.16, 1, 0.3, 1) })}px` });
  return (
    <AbsoluteFill style={{ backgroundColor: COR.noite, alignItems: 'center', justifyContent: 'center', gap: H * 0.025, padding: W * 0.08 }}>
      <AbsoluteFill style={{ background: 'radial-gradient(ellipse 60% 40% at 50% 45%, rgba(217,163,91,.16), transparent 70%)' }} />
      <Img src={staticFile('logo-4x.png')} style={{ width: W * 0.58, ...entra(0) }} />
      <div style={{ fontFamily: serif, fontStyle: 'italic', fontWeight: 600, fontSize: W * 0.075, color: COR.fumaca, textAlign: 'center', lineHeight: 1.05, ...entra(b(1)) }}>
        Psicodelia de<br />alta classe
      </div>
      <div style={{ width: W * 0.2, height: 2, background: COR.latao, ...entra(b(2)) }} />
      <div style={{ fontFamily: grot, fontWeight: 600, fontSize: W * 0.036, letterSpacing: '0.28em', color: COR.latao, ...entra(b(3)) }}>BOOKING</div>
      <div style={{ fontFamily: grot, fontWeight: 600, fontSize: W * 0.034, color: COR.fumaca, opacity: 0.85, ...entra(b(3.5)) }}>amplitudelab.github.io/lab/project-oak</div>
      <Img src={staticFile('bantuh.png')} style={{ position: 'absolute', bottom: H * 0.06, width: W * 0.14, opacity: 0.7, ...entra(b(4)) }} />
    </AbsoluteFill>
  );
};

export const Teaser = () => {
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ backgroundColor: COR.noite }}>
      <Audio
        src={staticFile('faixa.wav')}
        trimBefore={Math.round(INICIO_AUDIO * fps)}
        volume={(f) => interpolate(f, [0, 6, b(38), b(40)], [0, 1, 1, 0], clamp)}
      />
      <Sequence durationInFrames={b(12) + 2} name="Abertura">
        <Abertura />
      </Sequence>
      <Sequence from={b(12)} durationInFrames={b(28) - b(12)} name="Montagem">
        <Montagem />
      </Sequence>
      <Sequence from={b(28)} durationInFrames={b(32) - b(28)} name="Túnel">
        <Tunel />
        <LogoPulsa />
      </Sequence>
      <Sequence from={b(32)} name="Fecho">
        <Fecho />
      </Sequence>
    </AbsoluteFill>
  );
};
