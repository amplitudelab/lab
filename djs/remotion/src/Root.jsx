import { Composition } from 'remotion';
import { LOOP_PALCO, Palco } from './Palco';
import { DURACAO_VITRINE, Vitrine } from './Vitrine';

export const RemotionRoot = () => (
  <>
    <Composition id="Palco" component={Palco} durationInFrames={LOOP_PALCO} fps={30} width={1920} height={1080} />
    <Composition id="PalcoVertical" component={Palco} durationInFrames={LOOP_PALCO} fps={30} width={720} height={1280} />
    <Composition id="Vitrine" component={Vitrine} durationInFrames={DURACAO_VITRINE} fps={30} width={1920} height={1080} />
    <Composition id="VitrineVertical" component={Vitrine} durationInFrames={DURACAO_VITRINE} fps={30} width={1080} height={1920} />
  </>
);
