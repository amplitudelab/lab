import { useWindowedAudioData, visualizeAudio } from '@remotion/media-utils';
import { AbsoluteFill, Img, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { b } from './ritmo';

// Fundo da seção de música: os anéis do logo pulsando com o próprio "Odin on Acid".
// Lê o WAV do artista no render e mede graves, médios e agudos quadro a quadro.
// Fundo branco e traço preto: no site o vídeo entra com mix-blend-mode: multiply,
// então o branco some no fundo claro da seção e só o traço fica.
export const INICIO = 56.25; // começo da parte mais cheia da faixa (energia medida a cada 4 s)
export const DURACAO_PULSO = b(32);

const Anel = ({ s, giro, opacidade, base }) => (
  <Img
    src={staticFile('anel.webp')}
    style={{
      position: 'absolute',
      width: base,
      height: base,
      left: `calc(50% - ${base / 2}px)`,
      top: `calc(50% - ${base / 2}px)`,
      objectFit: 'contain',
      filter: 'invert(1)',
      scale: String(s),
      rotate: `${giro}deg`,
      opacity: opacidade,
    }}
  />
);

export const Pulso = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const t = frame + Math.round(INICIO * fps);
  const { audioData, dataOffsetInSeconds } = useWindowedAudioData({ src: staticFile('odin.wav'), frame: t, fps, windowInSeconds: 10 });
  if (!audioData) return <AbsoluteFill style={{ backgroundColor: '#fff' }} />;
  const freq = visualizeAudio({ fps, frame: t, audioData, numberOfSamples: 64, optimizeFor: 'speed', dataOffsetInSeconds, smoothing: true });
  const media = (a, z) => freq.slice(a, z).reduce((x, v) => x + v, 0) / (z - a);
  const grave = Math.min(1, media(0, 3) * 2.2);
  const meio = Math.min(1, media(6, 18) * 5);
  const agudo = Math.min(1, media(24, 64) * 14);
  const base = Math.min(width, height) * 0.62;
  return (
    <AbsoluteFill style={{ backgroundColor: '#fff' }}>
      <Anel base={base} s={1.55 + agudo * 0.18} giro={frame * 0.25} opacidade={0.16 + agudo * 0.2} />
      <Anel base={base} s={1.18 + meio * 0.12} giro={-frame * 0.4} opacidade={0.3 + meio * 0.25} />
      <Anel base={base} s={0.86 + grave * 0.16} giro={frame * 0.15} opacidade={0.92} />
    </AbsoluteFill>
  );
};
