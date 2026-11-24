import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import { b, bumbo, COR } from './ritmo';

// Fundo da seção de som: um túnel de hexágonos (o "O" do logo é um hexágono) que avança
// um anel a cada 4 batidas. Traço claro em fundo preto: no site entra com mix-blend-mode: screen.
// Loop de 16 batidas: em 4 anéis o túnel volta exatamente ao desenho do começo.
export const LOOP_TUNEL = b(16);
const ANEIS = 16;
const RAZAO = 1.32;

const hex = (r, giro) => Array.from({ length: 6 }, (_, i) => {
  const a = ((i * 60 + 30 + giro) * Math.PI) / 180;
  return `${(Math.cos(a) * r).toFixed(1)},${(Math.sin(a) * r).toFixed(1)}`;
}).join(' ');

export const Tunel = () => {
  const f = useCurrentFrame();
  const { width: W, height: H } = useVideoConfig();
  const L = LOOP_TUNEL;
  const avanco = (f / L) * 4; // anéis andados
  const pulso = bumbo(f);
  const base = Math.min(W, H) * 0.035;
  const aneis = [];
  const frac = avanco % 1, inteiro = Math.floor(avanco);
  for (let k = -1; k < ANEIS; k++) {
    // O anel na posição k tem identidade j; giro e destaque dependem só de j, então ao fim do
    // loop (4 anéis) j anda 4: giro +60° (mesmo hexágono) e destaque a cada 4 (mesmo padrão).
    const j = k - inteiro;
    const e = k + frac;
    const r = base * Math.pow(RAZAO, e);
    const perto = Math.max(0, e) / ANEIS;
    const forte = ((j % 4) + 4) % 4 === 0;
    aneis.push(
      <polygon
        key={j}
        points={hex(r * (1 + pulso * 0.04 * perto), j * 15)}
        fill="none"
        stroke={forte ? COR.lataoClaro : COR.fumaca}
        strokeWidth={Math.max(0.6, perto * 3.2) * (forte ? 1.6 : 1)}
        opacity={Math.min(1, 0.15 + perto * 0.9) * (forte ? 0.95 : 0.55) * (0.75 + pulso * 0.25) * Math.min(1, e + 1)}
      />,
    );
  }
  const raios = Array.from({ length: 6 }, (_, i) => {
    const a = ((i * 60 + 30) * Math.PI) / 180;
    const R = Math.hypot(W, H);
    return <line key={i} x1={0} y1={0} x2={Math.cos(a) * R} y2={Math.sin(a) * R} stroke={COR.latao} strokeWidth={1} opacity={0.18 + pulso * 0.12} />;
  });
  return (
    <AbsoluteFill style={{ backgroundColor: '#000' }}>
      <svg width={W} height={H} viewBox={`${-W / 2} ${-H / 2} ${W} ${H}`}>
        <defs>
          <radialGradient id="nucleo">
            <stop offset="0%" stopColor={COR.latao} stopOpacity={0.35 + pulso * 0.35} />
            <stop offset="100%" stopColor="#000" stopOpacity={0} />
          </radialGradient>
        </defs>
        <circle cx={0} cy={0} r={Math.min(W, H) * 0.22} fill="url(#nucleo)" />
        {raios}
        {aneis}
      </svg>
    </AbsoluteFill>
  );
};
