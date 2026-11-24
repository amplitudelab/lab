import { Composition } from 'remotion';
import { Abertura, DURACAO_ABERTURA } from './Abertura';
import { LOOP_SALAO, Salao } from './Salao';
import { DURACAO_TEASER, Teaser } from './Teaser';
import { LOOP_TUNEL, Tunel } from './Tunel';

export const RemotionRoot = () => (
  <>
    <Composition id="Abertura" component={Abertura} durationInFrames={DURACAO_ABERTURA} fps={30} width={1920} height={1080} />
    <Composition id="AberturaVertical" component={Abertura} durationInFrames={DURACAO_ABERTURA} fps={30} width={1080} height={1920} />
    <Composition id="Salao" component={Salao} durationInFrames={LOOP_SALAO} fps={30} width={1920} height={1080} />
    <Composition id="SalaoVertical" component={Salao} durationInFrames={LOOP_SALAO} fps={30} width={720} height={1280} />
    <Composition id="Tunel" component={Tunel} durationInFrames={LOOP_TUNEL} fps={30} width={1600} height={1000} />
    <Composition id="TunelVertical" component={Tunel} durationInFrames={LOOP_TUNEL} fps={30} width={720} height={1280} />
    <Composition id="Teaser" component={Teaser} durationInFrames={DURACAO_TEASER} fps={30} width={1080} height={1920} />
  </>
);
