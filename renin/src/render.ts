import { Renin } from './renin';
interface RenderOptions {
  encoder: {
    addFrame: (bitmap: ImageBitmap, frame: number) => Promise<void>;
    end: () => Promise<ArrayBuffer>;
  };
  width: number;
  height: number;
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function render(renin: Renin, options: RenderOptions) {
  const { width, height, encoder } = options;

  renin.jumpToFrame(0);
  renin.isFullscreen = true;
  renin.resize(width, height);

  /* Drive the UI a little bit to make sure all animations have settled :D */
  for (let i = 0; i < 300; i++) {
    await delay(1);
    renin.uiTime = Date.now() / 1000;
    renin.uiUpdate();
    renin.uiRender();
  }
  window.innerWidth = width;
  window.innerHeight = height;
  renin.resize(width, height);
  renin.renderer.setPixelRatio(1);

  const extraPaddingAtTheEnd = 60;
  const numberOfFramesToRender = renin.music.getDuration() * 60 + extraPaddingAtTheEnd;

  for (let i = 0; i < numberOfFramesToRender; i++) {
    await delay(1);
    renin.jumpToFrame(i);
    const bitmap = await createImageBitmap(renin.renderer.domElement);
    await encoder.addFrame(bitmap, i);
  }

  const buffer = await encoder.end();
  const url = URL.createObjectURL(new Blob([buffer], { type: 'video/mp4' }));

  const a = document.createElement('a');
  a.style.display = 'none';
  document.body.appendChild(a);
  a.href = url;
  a.download = 'render.mp4';
  a.click();
  URL.revokeObjectURL(url);
}
