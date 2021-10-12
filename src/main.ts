import { Renin } from "./renin/renin";
import { SpinningCube } from "./SpinningCube";
import "./style.css";
import music from "./music.mp3";

// REGISTER ERROR OVERLAY
const showErrorOverlay = (err) => {
  // must be within function call because that's when the element is defined for sure.
  const ErrorOverlay = customElements.get("vite-error-overlay");
  // don't open outside vite environment
  if (!ErrorOverlay) {
    return;
  }
  console.log(err);
  const overlay = new ErrorOverlay(err);
  document.body.appendChild(overlay);
};

window.addEventListener("error", showErrorOverlay);
window.addEventListener("unhandledrejection", ({ reason }) =>
  showErrorOverlay(reason)
);

export const renin = new Renin({
  music: {
    src: music,
    bpm: 115,
    subdivision: 12,
  },
  nodes: {
    spinningcube: {
      instance: new SpinningCube(),
      inputs: {},
    },
  },
});

renin.loop();
