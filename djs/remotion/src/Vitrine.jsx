// Vitrine: os sites que a Amplitude já pôs no ar, rodando dentro de notebook e celular.
// Cada site dura 8 batidas (4 s a 120 BPM); os cortes caem na cabeça do compasso.
// As gravações (public/cap/<site>-d.webm e -m.webm) saem de tools/captura.js (ver LEIAME).
import { Video } from '@remotion/media';
import { loadFont as unbounded } from '@remotion/google-fonts/Unbounded';
import { loadFont as plexMono } from '@remotion/google-fonts/IBMPlexMono';
import { AbsoluteFill, Easing, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { BATIDA, COR, b, bumbo } from './ritmo';

const { fontFamily: TITULO } = unbounded('normal', { weights: ['400', '800'], subsets: ['latin'] });
const { fontFamily: MONO } = plexMono('normal', { weights: ['500'], subsets: ['latin'] });

// Só nomes e gêneros: palavras que não precisam de tradução.
export const SITES = [
  { id: 'arcanne', nome: 'ARCANNE', tag: 'PSY-TRANCE · TECHNO', cor: '#ff5a1f' },
  { id: 'linnx', nome: 'LINNX', tag: 'PROGRESSIVE TRANCE', cor: '#ff3fb4' },
  { id: 'bruxo', nome: 'BRUXO', tag: 'PROGRESSIVE · HARD · HI-TECH', cor: '#e2b04a' },
  { id: 'darky', nome: 'DARKY', tag: 'DARKY · SLOWLY · OBSKURIAL', cor: '#8a6bff' },
  { id: 'bruno-zampieri', nome: 'BRUNO ZAMPIERI', tag: 'CREATOR · DRONE · LIFESTYLE', cor: '#ff9a3c' },
  // Demo interativa com artista fictício (djs/demo/): prévias de clientes nunca entram com o nome real.
  { id: 'demo', nome: 'NOVA VOLTZ', tag: 'DEMO · OPEN FORMAT', cor: '#c6ff3d' },
];

const SEG = b(8);
const ABRE = b(4);
const FECHA = b(4);
export const DURACAO_VITRINE = ABRE + SITES.length * SEG + FECHA;

const Notebook = ({ src, largura }) => {
  const altura = largura * 0.625; // tela 16:10
  return (
    <div style={{ width: largura, filter: 'drop-shadow(0 40px 60px rgba(0,0,0,.6))' }}>
      <div style={{ background: '#0d1018', borderRadius: largura * 0.018, padding: largura * 0.014, border: '1px solid rgba(169,196,255,.25)' }}>
        <div style={{ width: '100%', height: altura, overflow: 'hidden', borderRadius: largura * 0.006, background: '#000' }}>
          <Video src={src} muted trimBefore={2.8 * 30} objectFit="cover" style={{ width: '100%', height: '100%' }} />
        </div>
      </div>
      <div style={{ height: largura * 0.022, margin: `0 -${largura * 0.05}px`, background: 'linear-gradient(#2a3042,#141824)', borderRadius: `0 0 ${largura * 0.02}px ${largura * 0.02}px` }} />
    </div>
  );
};

const Celular = ({ src, largura }) => (
  <div style={{ width: largura, background: '#0b0d14', borderRadius: largura * 0.16, padding: largura * 0.045, border: '1px solid rgba(169,196,255,.3)', filter: 'drop-shadow(0 30px 50px rgba(0,0,0,.7))' }}>
    <div style={{ width: '100%', height: largura * 2.07, overflow: 'hidden', borderRadius: largura * 0.12, background: '#000' }}>
      <Video src={src} muted trimBefore={2.8 * 30} objectFit="cover" style={{ width: '100%', height: '100%' }} />
    </div>
  </div>
);

const Nome = ({ site, deitado }) => {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();
  const entra = spring({ frame, fps, config: { damping: 14, mass: 0.6 } });
  const k = bumbo(frame);
  const tam = deitado ? width * 0.062 : (site.nome.length > 8 ? width * 0.11 : width * 0.13);
  return (
    <div style={{ position: 'absolute', left: deitado ? width * 0.06 : 0, right: deitado ? undefined : 0, top: deitado ? '50%' : '7%', translate: deitado ? '0 -50%' : undefined, textAlign: deitado ? 'left' : 'center', maxWidth: deitado ? width * 0.4 : undefined }}>
      <div style={{ fontFamily: MONO, fontSize: tam * 0.2, letterSpacing: '0.22em', color: site.cor, opacity: interpolate(frame, [4, 12], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }), marginBottom: tam * 0.18 }}>
        {site.tag}
      </div>
      <div style={{ position: 'relative', fontFamily: TITULO, fontWeight: 800, fontSize: tam, lineHeight: 0.92, letterSpacing: '-0.03em', color: COR.branco, scale: interpolate(entra, [0, 1], [1.35, 1]), opacity: entra }}>
        <span style={{ position: 'absolute', inset: 0, color: 'transparent', WebkitTextStroke: `2px ${site.cor}`, translate: `${4 + 10 * k}px ${-3 - 6 * k}px`, opacity: 0.9 }}>{site.nome}</span>
        <span style={{ position: 'relative' }}>{site.nome}</span>
      </div>
    </div>
  );
};

const Cena = ({ site }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const deitado = width > height;
  const sobe = spring({ frame, fps, config: { damping: 18 } });
  const cel = spring({ frame: frame - BATIDA, fps, config: { damping: 16 } });
  const flash = interpolate(frame, [0, 6], [0.85, 0], { extrapolateRight: 'clamp' });
  const empurra = interpolate(frame, [0, SEG], [1, 1.05], { easing: Easing.out(Easing.quad) });
  const d = staticFile(`cap/${site.id}-d.webm`);
  const m = staticFile(`cap/${site.id}-m.webm`);
  return (
    <AbsoluteFill style={{ backgroundColor: COR.fundo, overflow: 'hidden' }}>
      <AbsoluteFill style={{ background: `radial-gradient(70% 60% at ${deitado ? '68%' : '50%'} 55%, ${site.cor}40 0%, transparent 70%)`, opacity: 0.6 + 0.4 * bumbo(frame) }} />
      <AbsoluteFill style={{ scale: empurra }}>
        {deitado ? (
          <>
            <div style={{ position: 'absolute', right: width * 0.1, top: height * 0.16, translate: `0 ${interpolate(sobe, [0, 1], [height * 0.5, 0])}px` }}>
              <Notebook src={d} largura={width * 0.46} />
            </div>
            <div style={{ position: 'absolute', right: width * 0.035, top: height * 0.36, translate: `${interpolate(cel, [0, 1], [width * 0.4, 0])}px 0`, rotate: `${interpolate(cel, [0, 1], [14, 4])}deg` }}>
              <Celular src={m} largura={width * 0.12} />
            </div>
          </>
        ) : (
          <>
            <div style={{ position: 'absolute', left: width * 0.04, top: height * 0.34, translate: `0 ${interpolate(sobe, [0, 1], [height * 0.6, 0])}px` }}>
              <Notebook src={d} largura={width * 0.78} />
            </div>
            <div style={{ position: 'absolute', right: width * 0.06, top: height * 0.44, translate: `${interpolate(cel, [0, 1], [width * 0.8, 0])}px 0`, rotate: `${interpolate(cel, [0, 1], [10, 3])}deg` }}>
              <Celular src={m} largura={width * 0.4} />
            </div>
          </>
        )}
      </AbsoluteFill>
      <Nome site={site} deitado={deitado} />
      <AbsoluteFill style={{ backgroundColor: COR.branco, opacity: flash }} />
    </AbsoluteFill>
  );
};

const Abertura = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const tam = Math.min(width * 0.13, height * 0.2);
  const a = spring({ frame, fps, config: { damping: 12 } });
  const x = spring({ frame: frame - BATIDA * 2, fps, config: { damping: 10, mass: 0.5 } });
  const sai = interpolate(frame, [ABRE - 6, ABRE], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return (
    <AbsoluteFill style={{ backgroundColor: COR.fundo, alignItems: 'center', justifyContent: 'center', opacity: sai }}>
      {[0, 1, 2, 3].map((i) => {
        const t = ((frame + i * BATIDA) % (4 * BATIDA)) / (4 * BATIDA);
        return <div key={i} style={{ position: 'absolute', width: tam * 6 * t, height: tam * 6 * t, borderRadius: '50%', border: `2px solid ${i % 2 ? COR.verde : COR.azul}`, opacity: 1 - t }} />;
      })}
      <div style={{ fontFamily: MONO, fontSize: tam * 0.16, letterSpacing: '0.4em', color: COR.azulClaro, opacity: a, marginBottom: tam * 0.2 }}>AMPLITUDE LAB</div>
      <div style={{ fontFamily: TITULO, fontWeight: 800, fontSize: tam, color: COR.branco, letterSpacing: '-0.03em', scale: interpolate(x, [0, 1], [2.2, 1]), opacity: x }}>
        <span style={{ color: COR.verde }}>×</span> DJS
      </div>
    </AbsoluteFill>
  );
};

const Fecho = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const tam = Math.min(width * 0.06, height * 0.09);
  const a = spring({ frame, fps, config: { damping: 14 } });
  return (
    <AbsoluteFill style={{ backgroundColor: COR.fundo, alignItems: 'center', justifyContent: 'center', gap: tam * 0.4 }}>
      <div style={{ fontFamily: TITULO, fontWeight: 800, fontSize: tam * 1.6, color: COR.branco, letterSpacing: '-0.03em', scale: interpolate(a, [0, 1], [0.7, 1]), opacity: a, textAlign: 'center' }}>
        LIVE<span style={{ color: COR.verde }}>.</span>
      </div>
      <div style={{ fontFamily: MONO, fontSize: tam * 0.36, letterSpacing: '0.14em', color: COR.azulClaro, opacity: interpolate(frame, [10, 20], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }), textAlign: 'center', padding: '0 5%' }}>
        amplitudelab.github.io/lab/djs
      </div>
      <AbsoluteFill style={{ backgroundColor: COR.branco, opacity: interpolate(frame, [0, 6], [0.8, 0], { extrapolateRight: 'clamp' }) }} />
    </AbsoluteFill>
  );
};

export const Vitrine = () => (
  <AbsoluteFill style={{ backgroundColor: COR.fundo }}>
    <Sequence durationInFrames={ABRE} name="Abertura">
      <Abertura />
    </Sequence>
    {SITES.map((s, i) => (
      <Sequence key={s.id} from={ABRE + i * SEG} durationInFrames={SEG} name={s.nome} premountFor={30}>
        <Cena site={s} />
      </Sequence>
    ))}
    <Sequence from={ABRE + SITES.length * SEG} durationInFrames={FECHA} name="Fecho">
      <Fecho />
    </Sequence>
  </AbsoluteFill>
);
