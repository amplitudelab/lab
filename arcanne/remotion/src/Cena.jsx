import { Video } from '@remotion/media';
import { AbsoluteFill, Sequence, staticFile, useVideoConfig } from 'remotion';
import { GRADE } from './ritmo';

// Um trecho de aftermovie que começa no segundo `at` da fonte.
export const Trecho = ({ src, at, from, dur, name }) => {
  const { fps } = useVideoConfig();
  return (
    <Sequence from={from} durationInFrames={dur} name={name || `${src} @ ${at}s`} layout="none">
      <Video
        src={staticFile(src)}
        muted
        trimBefore={Math.round(at * fps)}
        objectFit="cover"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', filter: GRADE }}
      />
    </Sequence>
  );
};

// Painel em loop: cada cena dura `dur` quadros, o painel começa deslocado `off` quadros e o loop
// fecha em `L`. A cena que atravessa o fim do loop continua no começo, então a emenda não aparece.
export const Painel = ({ cenas, dur, off = 0, L, style }) => {
  const pedacos = [];
  cenas.forEach((c, k) => {
    const ini = (off + k * dur) % L;
    if (ini + dur <= L) {
      pedacos.push(<Trecho key={k} {...c} from={ini} dur={dur} />);
    } else {
      const a = L - ini;
      pedacos.push(<Trecho key={k + 'a'} {...c} from={ini} dur={a} />);
      pedacos.push(<Trecho key={k + 'b'} {...c} at={c.at + a / 30} from={0} dur={dur - a} />);
    }
  });
  return <AbsoluteFill style={{ overflow: 'hidden', ...style }}>{pedacos}</AbsoluteFill>;
};
