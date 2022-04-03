import { Renin } from './renin/renin';
import { SpinningCube } from './SpinningCube';
import './style.css';
import music from './music.mp3';
import { JumpingBox } from './JumpingBox';
import { Add } from './Add';

export const renin = new Renin({
  music: {
    src: music,
    bpm: 114,
    subdivision: 12,
  },
  root: new Add(),
});

renin.loop();
