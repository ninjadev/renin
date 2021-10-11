import { renin } from "./renin/renin";
import { SpinningCube } from "./SpinningCube";
import "./style.css";
import music from "./music.mp3";

renin.configure({
  music: {
    src: music,
    bpm: 115,
    subdivision: 12,
  },
});
renin.loop();

renin.register(new SpinningCube());
