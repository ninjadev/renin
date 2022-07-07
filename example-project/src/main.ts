import music from './music.ogg';
import { ACESFilmicToneMapping } from 'three';
import { Renin } from 'renin/lib/renin';
import { PostFx } from './PostFx';

export const renin = new Renin({
  music: {
    src: music,
    bpm: 114,
    subdivision: 12,
    beatOffset: 4,
  },
  root: PostFx,
  productionMode: import.meta.env.PROD,
  rendererOptions: {
    powerPreference: 'high-performance',
  },
  toneMapping: ACESFilmicToneMapping,
});

renin.loop();
