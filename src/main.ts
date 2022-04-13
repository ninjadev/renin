import { Renin } from './renin/renin';
import './style.css';
import music from './music.mp3';
import { Add } from './Add';

export const renin = new Renin({
  music: {
    src: music,
    bpm: 114,
    subdivision: 12,
    beatOffset: 4,
  },
  root: new Add(),
  productionMode: import.meta.env.PROD,
});

renin.loop();
