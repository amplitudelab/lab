import { Composition } from 'remotion';
import { Abertura, DURACAO } from './Abertura';
import { LOOP, Montagem } from './Montagem';
import { DURACAO_PULSO, Pulso } from './Pulso';

export const RemotionRoot = () => (
  <>
    <Composition id="Abertura" component={Abertura} durationInFrames={DURACAO} fps={30} width={1920} height={1080} />
    <Composition id="AberturaVertical" component={Abertura} durationInFrames={DURACAO} fps={30} width={1080} height={1920} />
    <Composition id="Montagem" component={Montagem} durationInFrames={LOOP} fps={30} width={1920} height={1080} />
    <Composition id="MontagemVertical" component={Montagem} durationInFrames={LOOP} fps={30} width={720} height={1280} />
    <Composition id="Pulso" component={Pulso} durationInFrames={DURACAO_PULSO} fps={30} width={900} height={900} />
  </>
);
