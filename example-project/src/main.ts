import music from './music.ogg';
import { Renin } from 'renin/lib/renin';
import { PostFx } from './PostFx';

export const renin = new Renin({
  // @ts-ignore
  music: {
    src: music,
    bpm: 114,
    subdivision: 12,
    beatOffset: 4,
  },
      // @ts-ignore
  root: PostFx,
  productionMode: import.meta.env.PROD,
  rendererOptions: {
    powerPreference: 'high-performance',
  },
  aspectRatio: 16.0/9,
});

var enableStartupOverlay = true;
if(enableStartupOverlay) {
  // This enables an overlay, so that when you run in production/release mode (by starting a http server in the dist folder),
  // you get a screen showing a start button demo enjoyers can click, instead of them having to know to press space to run.
  // You also get goodies like fullscreen being automatically set, and some more production info showing up at the start while it's warming up!
  const overlay = document.createElement("div");
  overlay.style.position = "absolute";
  overlay.style.left = "0px";
  overlay.style.right = "0px";
  overlay.style.top = "0px";
  overlay.style.bottom = "0px";
  overlay.style.background = "#f2de8d"; // This is the background of the splash screen
  overlay.style.display = "flex";
  overlay.style.alignItems = "center";
  overlay.style.justifyContent = "center";
  document.body.appendChild(overlay);

  if (import.meta.env.PROD) {
    // @ts-ignore
    const aspectRatio = renin.aspectRatio; // Would probably be more efficient to just write 1.7778, but this happens only once, is cheap, and more readable this way

    var demoName = "Example Project";
    var crew = "Demo Group";
    var party = "Demo Party";
    var releasedTime = "Now!";

    const delay = (ms: number) =>
      new Promise((resolve) => setTimeout(resolve, ms));
    (async () => {
      overlay.innerHTML = `
  <div style="line-height:1.3;text-align:center;color:#1f1502;width:100%;max-width:500px;
  font-size:20px;
  font-weight: 100;
  font-family: -apple-system, BlinkMacSystemFont, avenir next, avenir, segoe ui, helvetica neue, helvetica, Cantarell, Ubuntu, roboto, noto, arial, sans-serif;"
  >
  <div style="font-size:64px;margin-bottom:32px;
  font-family: Iowan Old Style, Apple Garamond, Baskerville, Times New Roman, Droid Serif, Times, Source Serif Pro, serif, Apple Color Emoji, Segoe UI Emoji, Segoe UI Symbol;
  "><div style="font-size:24px">${demoName}</div></div>
  <div style=margin-bottom:32px>by</div>
  <div style=margin-bottom:64px>${crew}</div>

  <button style="visibility:hidden; padding: 4px 16px; font-size:48px;
  font-family: Iowan Old Style, Apple Garamond, Baskerville, Times New Roman, Droid Serif, Times, Source Serif Pro, serif, Apple Color Emoji, Segoe UI Emoji, Segoe UI Symbol;
  ">Start</button>
  <div id=loading>Loading, please wait... (could take a while, hang in there!)</div>


  <div style="bottom:16px;position:absolute;bottom:16px;left:0;right:0">Released at ${party} ${releasedTime}.</div>
  </div>
      `;
      await delay(50);
      renin.isFullscreen = true;
      let width = window.innerWidth * 2;
      let height = window.innerHeight * 2;
      if (width / height >= aspectRatio) {
        width = height * aspectRatio;
      } else {
        height = width / aspectRatio;
      }
      renin.resize(width, height);

      var warmupScenes = false;
      if(warmupScenes)
      {
        // This is awesome for performance when running the final built version of your demo, but wrecks everything if your scenes are stateful.
        // Enable with care!

        for (let i = 0; i < 150 * 4; i++) {
          await delay(1);
          renin.jumpToFrame(i * 25);
          renin.update(i * 25);
          renin.render();
          console.log("warmup", i);
        }

        // Put special frames you know you want warmed up, like scene transitions, here.
        const specialFrames = [
          0,
        ];
        for (const frame of specialFrames) {
          await delay(1);
          renin.jumpToFrame(frame);
          renin.update(frame);
          renin.render();
          console.log("special warmup", frame);
        }

        await delay(100);
      }

      renin.jumpToFrame(0);

      await delay(100);
      renin.resize(width, height);
      const loading = document.querySelector("#loading");
      // @ts-ignore
      loading.style.visibility = "hidden";
      const button = document.querySelector("button");
      button?.addEventListener("click", async () => {
        document.body.requestFullscreen();
        delay(1000);
        let width = window.innerWidth;
        let height = window.innerHeight;
        if (width / height >= aspectRatio) {
          width = height * aspectRatio;
        } else {
          height = width / aspectRatio;
        }
        renin.renderer.domElement.width = width;
        renin.renderer.domElement.height = height;

        renin.renderer.domElement.style.width = width + "px";
        renin.renderer.domElement.style.height = height + "px";

        /* position domElement in the center of the screen */
        renin.renderer.domElement.style.position = "absolute";
        renin.renderer.domElement.style.left = "50%";
        renin.renderer.domElement.style.top = "50%";
        renin.renderer.domElement.style.transform = "translate(-50%, -50%)";

        renin.resize(width, height);
        renin.renderer.setPixelRatio(1);
        const subtitleValue = document.querySelector("select")?.value;
        //@ts-ignore
        renin.subtitlePlacement = subtitleValue;
        await delay(200);
        for (let i = 0; i < 100; i++) {
          await delay(1);
          // @ts-ignore
          overlay.style.opacity = 1 - i / 100;
        }
        overlay.remove();
        await delay(1500);
        overlay.remove();
        renin.music.play();
      });
      // @ts-ignore
      button.style.visibility = "visible";
    })();
  } else {
    overlay.remove();
  }
}

renin.loop();
