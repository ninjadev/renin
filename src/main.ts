import { Renin } from './renin/renin';
import './renin/style.css';
import music from './music.ogg';
import { Add } from './Add';
import { ACESFilmicToneMapping } from 'three';

export const renin = new Renin({
  music: {
    src: music,
    bpm: 114,
    subdivision: 12,
    beatOffset: 4,
  },
  root: new Add(),
  productionMode: import.meta.env.PROD,
  rendererOptions: {
    powerPreference: 'high-performance',
  },
  toneMapping: ACESFilmicToneMapping,
});

renin.renderer.physicallyCorrectLights = true;

renin.loop();
