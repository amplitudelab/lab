// Fundo da primeira tela: um palco de pista em loop sem emenda (16 batidas a 120 BPM = 8 s).
// Chão em grade correndo para a câmera, lasers varrendo, anel do bumbo e equalizador espelhado.
// Sem texto: o título fica no HTML, para poder trocar de idioma.
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import { BATIDA, COR, bumbo, onda } from './ritmo';

export const LOOP_PALCO = 16 * BATIDA; // 240

const Chao = ({ w, h, horizonte }) => {
  const frame = useCurrentFrame();
  // A grade anda uma linha a cada 2 batidas; 240 é múltiplo de 30, então o loop fecha.
  const passo = (frame % (2 * BATIDA)) / (2 * BATIDA);
  const linhas = [];
  for (let i = 0; i < 22; i++) {
    const z = i + 1 - passo;
    const y = horizonte + (h - horizonte) * (1.4 / (z + 0.4)) ** 1.15;
    if (y > h + 4) continue;
    linhas.push(<line key={'h' + i} x1={0} x2={w} y1={y} y2={y} stroke={COR.azul} strokeWidth={Math.max(1, 3 / z)} opacity={Math.min(0.9, 1.2 / z)} />);
  }
  const fuga = w / 2;
  const verticais = [];
  for (let i = -18; i <= 18; i++) {
    const xb = fuga + i * (w / 9);
    verticais.push(<line key={'v' + i} x1={fuga + i * 6} y1={horizonte} x2={xb} y2={h} stroke={COR.azul} strokeWidth={1.5} opacity={0.5} />);
  }
  return (
    <svg width={w} height={h} style={{ position: 'absolute', inset: 0 }}>
      <defs>
        <linearGradient id="chao-fade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={COR.fundo} stopOpacity="1" />
          <stop offset="0.35" stopColor={COR.fundo} stopOpacity="0" />
        </linearGradient>
        <clipPath id="chao-clip"><rect x="0" y={horizonte} width={w} height={h - horizonte} /></clipPath>
      </defs>
      <g clipPath="url(#chao-clip)">
        {verticais}
        {linhas}
        <rect x="0" y={horizonte} width={w} height={h - horizonte} fill="url(#chao-fade)" />
      </g>
    </svg>
  );
};

// Feixes saindo do alto, com a abertura mudando a cada 4 batidas.
const Lasers = ({ w, h, horizonte }) => {
  const frame = useCurrentFrame();
  const k = bumbo(frame);
  const compasso = Math.floor(frame / (4 * BATIDA)) % 4; // 0..3
  const cores = [COR.azul, COR.verde, COR.violeta, COR.azulClaro];
  const fontes = [w * 0.18, w * 0.5, w * 0.82];
  const comp = Math.hypot(w, h) * 1.3;
  const feixes = [];
  fontes.forEach((x, fi) => {
    const n = compasso % 2 === 0 ? 5 : 3;
    for (let j = 0; j < n; j++) {
      const abre = (j - (n - 1) / 2) * (compasso >= 2 ? 11 : 7);
      const varre = onda(frame, LOOP_PALCO, 2, fi * 2.1) * 26 + onda(frame, LOOP_PALCO, 1, j) * 6;
      const ang = 90 + abre + varre * (fi === 1 ? 0.5 : 1) * (fi === 2 ? -1 : 1);
      const cor = cores[(fi + j + compasso) % 4];
      const op = (0.3 + 0.6 * k) * (fi === 1 && compasso === 1 ? 0.4 : 1);
      feixes.push(
        <g key={fi + '-' + j} transform={`translate(${x} ${-20}) rotate(${ang - 90})`}>
          <polygon points={`-1.5,0 1.5,0 ${10 + 8 * k},${comp} ${-10 - 8 * k},${comp}`} fill={`url(#feixe-${(fi + j + compasso) % 4})`} opacity={op} style={{ mixBlendMode: 'screen' }} />
          <line x1="0" y1="0" x2="0" y2={comp} stroke={cor} strokeWidth={2.2} opacity={Math.min(1, op + 0.3)} />
        </g>,
      );
    }
  });
  return (
    <svg width={w} height={h} style={{ position: 'absolute', inset: 0, filter: 'blur(0.6px)' }}>
      <defs>
        {cores.map((c, i) => (
          <linearGradient key={i} id={`feixe-${i}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={c} stopOpacity="0.9" />
            <stop offset="0.6" stopColor={c} stopOpacity="0.18" />
            <stop offset="1" stopColor={c} stopOpacity="0" />
          </linearGradient>
        ))}
      </defs>
      {feixes}
      <rect x="0" y={horizonte - 2} width={w} height={3} fill={COR.azulClaro} opacity={0.35 + 0.4 * k} />
    </svg>
  );
};

// Anéis que nascem no bumbo e abrem até a próxima batida.
const Aneis = ({ w, h, horizonte }) => {
  const frame = useCurrentFrame();
  const t = (frame % BATIDA) / BATIDA;
  const base = Math.min(w, h);
  return (
    <svg width={w} height={h} style={{ position: 'absolute', inset: 0 }}>
      {[0, 1, 2].map((i) => {
        const tt = (t + i) / 3;
        return <ellipse key={i} cx={w / 2} cy={horizonte} rx={base * (0.05 + tt * 0.75)} ry={base * (0.05 + tt * 0.75) * 0.32} fill="none" stroke={i === 0 ? COR.verde : COR.azul} strokeWidth={3 * (1 - tt)} opacity={(1 - tt) * 0.85} />;
      })}
      <circle cx={w / 2} cy={horizonte} r={base * (0.02 + 0.012 * bumbo(frame))} fill={COR.branco} opacity={0.9} />
    </svg>
  );
};

// Equalizador espelhado no horizonte; as alturas fecham o loop (frequências inteiras).
const Equalizador = ({ w, h, horizonte }) => {
  const frame = useCurrentFrame();
  const k = bumbo(frame);
  const n = w > h ? 64 : 36;
  const larg = (w * (w > h ? 0.62 : 0.9)) / n;
  const x0 = (w - larg * n) / 2;
  const alt = h * (w > h ? 0.2 : 0.13);
  const barras = [];
  for (let i = 0; i < n; i++) {
    const centro = 1 - Math.abs(i - (n - 1) / 2) / (n / 2);
    const v = 0.5 + 0.25 * onda(frame, LOOP_PALCO, 4 + (i % 5), i * 1.7) + 0.25 * onda(frame, LOOP_PALCO, 8 + (i % 3), i * 0.6);
    const a = alt * (0.08 + v * (0.35 + 0.65 * k) * (0.35 + 0.65 * centro));
    const cor = i % 7 === 0 ? COR.verde : COR.azulClaro;
    barras.push(<rect key={i} x={x0 + i * larg + larg * 0.18} y={horizonte - a} width={larg * 0.64} height={a} rx={larg * 0.3} fill={cor} opacity={0.85} />);
    barras.push(<rect key={'r' + i} x={x0 + i * larg + larg * 0.18} y={horizonte + 4} width={larg * 0.64} height={a * 0.55} rx={larg * 0.3} fill={cor} opacity={0.18} />);
  }
  return (
    <svg width={w} height={h} style={{ position: 'absolute', inset: 0 }}>
      {barras}
    </svg>
  );
};

const Luz = () => {
  const frame = useCurrentFrame();
  const k = bumbo(frame);
  // Estrobo leve na cabeça de cada 8 batidas.
  const estrobo = frame % (8 * BATIDA) < 2 ? 0.16 : 0;
  return (
    <>
      <AbsoluteFill style={{ background: `radial-gradient(60% 45% at 50% 58%, rgba(91,140,255,${0.18 + 0.2 * k}) 0%, rgba(163,107,255,0.08) 45%, transparent 75%)` }} />
      <AbsoluteFill style={{ background: 'radial-gradient(120% 90% at 50% 50%, transparent 55%, rgba(0,0,0,0.75) 100%)' }} />
      <AbsoluteFill style={{ backgroundColor: COR.branco, opacity: estrobo }} />
    </>
  );
};

export const Palco = () => {
  const { width: w, height: h } = useVideoConfig();
  const horizonte = h * (w > h ? 0.6 : 0.55);
  return (
    <AbsoluteFill style={{ backgroundColor: COR.fundo }}>
      <Lasers w={w} h={h} horizonte={horizonte} />
      <Chao w={w} h={h} horizonte={horizonte} />
      <Aneis w={w} h={h} horizonte={horizonte} />
      <Equalizador w={w} h={h} horizonte={horizonte} />
      <Luz />
    </AbsoluteFill>
  );
};
