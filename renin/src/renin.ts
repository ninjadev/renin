import {
  CanvasTexture,
  Color,
  FloatType,
  LinearEncoding,
  NoToneMapping,
  OrthographicCamera,
  Scene,
  ShaderMaterial,
  sRGBEncoding,
  Texture,
  WebGLRenderer,
  WebGLRendererParameters,
  WebGLRenderTarget,
} from 'three';
import { AudioBar } from './ui/AudioBar';
import { Sync } from './sync';
import defaultVert from './default.vert.glsl';
import { clamp, lerp } from './interpolations';
import { colors } from './ui/colors';
import { getWindowHeight, getWindowWidth } from './utils';
import { ReninNode } from './ReninNode';
import { registerErrorOverlay } from './ui/error';
import { Music } from './music';
import { UIAnimation } from './ui/UIAnimation';
import { UIBox } from './ui/UIBox';
import screenShader from './ui/screenShader.glsl';
import performancePanelShader from './ui/performancePanel.glsl';
import { thirdsOverlayTexture } from './ui/thirdsOverlay';
import { performancePanelTexture } from './ui/performancePanelTexture';
import { ColorManagement } from 'three/src/math/ColorManagement';
import { getSetting, setSetting } from './ui/storedSettings';

/* otherwise it won't be added to the build */
export * as vite from './ui/vite';
export * as ReninNode from './ReninNode';
export * as render from './render';

export const defaultVertexShader = defaultVert;

const framePanelWidth = 128 + 32;
const framePanelHeight = 24 * 6;

/* Returns the largest possible ratio rectangle that fits within the given width and height. */
function fit(width: number, height: number, ratio: number) {
  const w = Math.min(width, height * ratio);
  const h = w / ratio;
  return { width: w, height: h };
}

registerErrorOverlay();

export interface Options {
  music: {
    src: string;
    bpm: number;
    subdivision: number;
    beatOffset: number;
    beatsPerBar: number;
  };
  root: typeof ReninNode;
  productionMode: boolean;
  rendererOptions?: WebGLRendererParameters;
  aspectRatio: number;
  maxWidth?: number;
  maxHeight?: number;
}

export class Renin {
  static instance: Renin;
  width: number = 1;
  height: number = 1;
  audioBar: AudioBar;
  music = new Music();
  sync: Sync;
  frame = 0;
  oldTime: number = 0;
  time: number = 0;
  dt: number = 0;
  cuePoints: number[] = [];
  uiNeedsRender: boolean = true;
  devicePixelRatio = window.devicePixelRatio;

  renderTimesCPU: number[] = [...new Array(128)].map(() => 0);
  renderTimesCPUIndex: number = 0;
  renderTimesGPU: number[] = [...new Array(128)].map(() => 0);
  renderTimesGPUIndex: number = 0;

  renderer: WebGLRenderer;
  screen = new UIBox({
    shadowSize: 16,
    customMaterial: new ShaderMaterial({
      fragmentShader: screenShader,
      vertexShader: defaultVertexShader,
      uniforms: {
        screen: { value: null },
        thirdsOverlay: { value: null },
        thirdsOverlayOpacity: { value: 0 },
      },
    }),
  });
  screenBackdrop = new UIBox({ shadowSize: 0 });
  framePanel = new UIBox({ shadowSize: 16 });
  performancePanel = new UIBox({
    shadowSize: 16,
    customMaterial: new ShaderMaterial({
      fragmentShader: performancePanelShader,
      vertexShader: defaultVertexShader,
      uniforms: {
        renderTimesGPU: { value: [] },
        renderTimesGPUIndex: { value: 0 },
        renderTimesCPU: { value: [] },
        renderTimesCPUIndex: { value: 0 },
        updateTimes: { value: [] },
        updateTimesIndex: { value: 0 },
        uiUpdateTimes: { value: [] },
        uiUpdateTimesIndex: { value: 0 },
        memoryPercentages: { value: [] },
        memoryPercentagesIndex: { value: 0 },
        totalJSHeapSize: { value: 0 },
        jsHeapSizeLimit: { value: 0 },
        overlay: { value: null },
      },
    }),
  });
  scene = new Scene();
  camera = new OrthographicCamera(-1, 1, 1, -1);
  root: ReninNode;
  screenRenderTarget: WebGLRenderTarget = new WebGLRenderTarget(640, 360, {
    type: FloatType,
  });
  isFullscreen: boolean = false;
  fullscreenAnimation = new UIAnimation();
  uiOldTime: number = Date.now() / 1000;
  uiTime: number = Date.now() / 1000;
  uiDt: number = 0;
  framePanelCanvas: HTMLCanvasElement;
  framePanelTexture: CanvasTexture;
  query: WebGLQuery | null = null;
  updateTimes: number[] = [...new Array(128)].map(() => 0);
  updateTimesIndex: number = 0;
  uiUpdateTimes: number[] = [...new Array(128)].map(() => 0);
  uiUpdateTimesIndex: number = 0;
  memoryPercentages: number[] = [...new Array(128)].map(() => 0);
  memoryPercentagesIndex: number = 0;
  queryIsActive: boolean = false;
  options: Options;
  needsSkipBecauseTabHasBeenInTheBackground = false;
  demoWidth: number = 640;
  demoHeight: number = 360;

  /* If there is a media recorder, we are recording a quick'n'dirty video capture
   * for easy sharing. This not the offline "perfect fps" recording feature that can
   * be used to make a full video capture of the demo for youtube. This is just intended
   * for short clips of a few seconds. */
  mediaRecorder: MediaRecorder | null = null;
  oldIsFullscreen: boolean = false;
  debugTexture: Texture | null;
  demoNeedsRender: boolean = true;

  constructor(options: Options) {
    Renin.instance = this;
    //@ts-ignore
    ColorManagement.legacyMode = false;
    this.options = options;
    this.isFullscreen = this.options.productionMode;
    this.renderer = new WebGLRenderer(options.rendererOptions);
    this.renderer.physicallyCorrectLights = true;
    this.renderer.outputEncoding = LinearEncoding;
    this.root = new options.root(this);
    this.audioBar = new AudioBar(this);

    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        this.needsSkipBecauseTabHasBeenInTheBackground = true;
      }
    });

    const body = document.getElementsByTagName('body')[0];
    body.appendChild(this.renderer.domElement);
    this.renderer.domElement.style.position = 'fixed';
    this.renderer.domElement.style.top = '0px';
    this.renderer.domElement.style.left = '0px';
    this.renderer.domElement.style.right = '0px';
    this.renderer.domElement.style.bottom = '0px';

    this.sync = new Sync(options.music);

    this.renderer.domElement.addEventListener('wheel', (e) => {
      e.preventDefault();
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        const deltaY = Math.max(0, 1 - e.deltaY / 1000);
        const x = e.screenX - 16;
        const width = window.innerWidth - 32; // There's a 16px padding around the audio bar
        this.audioBar.zoom(deltaY, clamp(0, x / width, 1));
      } else {
        const deltaX = e.deltaX / 1000;
        this.audioBar.pan(deltaX);
      }
      this.uiNeedsRender = true;
    });

    this.renderer.domElement.addEventListener('click', (e) => {
      if (this.isFullscreen) {
        return;
      }

      this.music.audioContext.resume();
      const screenHeight = getWindowHeight();
      const padding = 16;
      const screenWidth = getWindowWidth();

      let rows = 1;
      const recurse = (node: ReninNode) => {
        rows++;
        if ('children' in node && node.children) {
          for (const child of Object.values(node.children)) {
            recurse(child);
          }
        }
      };
      recurse(this.root);
      const trackHeight = 48 + rows * 48 + 8;

      const audioBarWidth = screenWidth - padding * 2;
      const x = (e.clientX - padding) / audioBarWidth;
      if (e.clientY > screenHeight - trackHeight - padding) {
        if (x >= 0 && x <= 1) {
          /* we click the bar! */
          const clickedFrame = this.audioBar.getClickedFrame(x);
          const period = this.sync.music.subdivision * (this.music.paused ? 1 : 4);
          const step = this.sync.stepForFrame(clickedFrame);
          let newStep = (((step + this.sync.music.subdivision) / period) | 0) * period;
          this.jumpToFrame(this.sync.frameForStep(newStep));
        }
      }
    });

    this.scene.add(this.screen.object3d);
    this.scene.add(this.framePanel.object3d);
    this.scene.add(this.performancePanel.object3d);
    this.scene.add(this.screenBackdrop.object3d);
    this.scene.add(this.camera);
    this.screen.object3d.scale.x = 640;
    this.screen.object3d.scale.y = 640 / this.options.aspectRatio;

    this.framePanelCanvas = document.createElement('canvas');
    this.framePanelTexture = new CanvasTexture(this.framePanelCanvas);
    this.framePanel.setTexture(this.framePanelTexture, true);
    this.framePanelTexture.encoding = sRGBEncoding;

    this.scene.add(this.audioBar.obj);

    this.music.setVolume(getSetting('volume'));

    (async () => {
      const response = await fetch(options.music.src);
      const data = await response.arrayBuffer();
      const buffer = await this.music.audioContext.decodeAudioData(data);
      this.music.setBuffer(buffer);
      this.audioBar.setMusic(this.music, buffer, options.music);

      /* Convenient way to rerender ui */
      this.resize(getWindowWidth(), getWindowHeight());
    })();

    this.camera.position.z = 100;
    this.resize(getWindowWidth(), getWindowHeight());

    window.addEventListener('resize', () => {
      this.uiNeedsRender = true;
      this.music.audioContext.resume();
      this.resize(getWindowWidth(), getWindowHeight());
    });

    document.addEventListener('keyup', (e) => {
      if (e.key === 'r' && this.mediaRecorder) {
        this.stopRealTimeScreenRecording();
      }
    });

    document.addEventListener('keydown', (e) => {
      this.uiNeedsRender = true;
      this.music.audioContext.resume();
      const backskipSlop = this.music.paused ? 0 : 20;

      if (e.key === 'r' && !e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey) {
        this.startRealTimeScreenRecording();
      }

      if (e.key === 's') {
        /* Copy current step number to clipboard */
        navigator.clipboard.writeText('' + this.sync.stepForFrame(this.frame));
      }
      if (e.key === 'f') {
        /* Copy current frame number to clipboard */
        navigator.clipboard.writeText('' + this.frame);
      }
      if (e.key === 'm') {
        const newVolume = this.music.getVolume() === 1 ? 0 : 1;
        setSetting('volume', newVolume);
        this.music.setVolume(newVolume);
      }
      if (e.key === 'o') {
        this.screen.getMaterial().uniforms.thirdsOverlayOpacity.value =
          this.screen.getMaterial().uniforms.thirdsOverlayOpacity.value === 1 ? 0 : 1;
      }
      if (e.key === 'Enter') {
        this.isFullscreen = !this.isFullscreen;
        this.resize(getWindowWidth(), getWindowHeight());
      }
      if (e.key === ' ') {
        if (!this.music.paused) {
          this.music.pause();
        } else {
          this.music.play();
        }
      }
      if (e.key === 'v') {
        if (this.cuePoints.length >= 2) {
          this.cuePoints = [];
          return;
        }
        /* repeat current beat */
        const step = this.sync.stepForFrame(this.frame);
        const bar = step - (step % this.sync.music.subdivision);
        this.cuePoints = [this.sync.frameForStep(bar), this.sync.frameForStep(bar + this.sync.music.subdivision)];
      }
      if (e.key === 'b') {
        if (this.cuePoints.length >= 2) {
          this.cuePoints = [];
          return;
        }
        /* repeat current bar */
        const step = this.sync.stepForFrame(this.frame);
        const bar = step - (step % (this.sync.music.subdivision * this.sync.music.beatsPerBar));
        this.cuePoints = [
          this.sync.frameForStep(bar),
          this.sync.frameForStep(bar + this.sync.music.subdivision * this.sync.music.beatsPerBar),
        ];
      }
      if (e.key === 'n') {
        if (this.cuePoints.length >= 2) {
          this.cuePoints = [];
          return;
        }
        /* repeat current 4 bars */
        const offset = this.options.music.beatOffset * this.sync.music.subdivision;
        const step = this.sync.stepForFrame(this.frame) - offset;
        const bar = step - (step % (this.sync.music.subdivision * this.sync.music.beatsPerBar * 4)) + offset;
        this.cuePoints = [
          this.sync.frameForStep(bar),
          this.sync.frameForStep(bar + this.sync.music.subdivision * this.sync.music.beatsPerBar * 4),
        ];
      }
      if (e.key === 'g') {
        const step = this.sync.stepForFrame(this.frame);
        const quantizedStep = step - (step % this.sync.music.subdivision);
        if (this.cuePoints.length < 2) {
          this.cuePoints.push(this.sync.frameForStep(quantizedStep));
          this.cuePoints = this.cuePoints.sort();
        } else {
          this.cuePoints = [];
        }
      }
      if (e.key === 'J') {
        if(this.frame > 0){
          this.jumpToFrame(this.frame - 1);
        }
      }
      if (e.key === 'K') {
        this.jumpToFrame(this.frame + 1);
      }
      if (e.key === 'h') {
        const period = this.sync.music.subdivision * 4;
        const step = this.sync.stepForFrame(this.frame - backskipSlop);
        let newStep = ((step / period) | 0) * period;
        if (newStep === step) {
          newStep -= period;
        }
        this.jumpToFrame(this.sync.frameForStep(newStep));
      }
      if (e.key === 'l') {
        const period = this.sync.music.subdivision * 4;
        const step = this.sync.stepForFrame(this.frame);
        let newStep = ((step / period) | 0) * period;
        newStep += period;
        if (newStep === step) {
          newStep += period;
        }
        this.jumpToFrame(this.sync.frameForStep(newStep));
      }
      if (e.key === 'j') {
        const period = this.sync.music.subdivision * 1;
        const step = this.sync.stepForFrame(this.frame - backskipSlop);
        let newStep = ((step / period) | 0) * period;
        if (newStep === step) {
          newStep -= period;
        }
        this.jumpToFrame(this.sync.frameForStep(newStep));
      }
      if (e.key === 'k') {
        const period = this.sync.music.subdivision * 1;
        const step = this.sync.stepForFrame(this.frame);
        let newStep = ((step / period) | 0) * period;
        newStep += period;
        if (newStep === step) {
          newStep += period;
        }
        this.jumpToFrame(this.sync.frameForStep(newStep));
      }
      if (e.key === 'H') {
        this.jumpToFrame(0);
      }

      const playbackRates: Record<string, number> = {
        '6': 0.25,
        '7': 0.5,
        '8': 2,
        '9': 4,
        '0': 1,
      };

      if (e.key in playbackRates) {
        this.music.setPlaybackRate(playbackRates[e.key]);
      }
    });
  }

  startRealTimeScreenRecording() {
    if (this.mediaRecorder) {
      return;
    }

    this.oldIsFullscreen = this.isFullscreen;
    this.isFullscreen = true;
    this.fullscreenAnimation.transition(1, 0, 0);
    this.fullscreenAnimation.value = 1;
    const ball = document.createElement('div');
    ball.style.width = '16px';
    ball.style.height = '16px';
    ball.style.borderRadius = '999px';
    ball.style.backgroundColor = 'white';
    ball.style.marginRight = '8px';
    ball.style.marginLeft = '-8px';
    const text = document.createElement('div');
    text.textContent = 'Recording';
    const recordingOverlay = document.createElement('div');
    recordingOverlay.appendChild(ball);
    recordingOverlay.style.position = 'fixed';
    recordingOverlay.style.top = '16px';
    recordingOverlay.style.left = '16px';
    recordingOverlay.style.padding = '8px 16px';
    recordingOverlay.style.backgroundColor = 'red';
    recordingOverlay.style.color = 'white';
    recordingOverlay.style.boxShadow = '0px 2px 4px rgba(0, 0, 0, 0.16)';
    recordingOverlay.style.fontFamily = 'Barlow, sans-serif';
    recordingOverlay.style.borderRadius = '999px';
    recordingOverlay.style.display = 'flex';
    recordingOverlay.style.alignItems = 'center';
    recordingOverlay.style.justifyContent = 'center';
    recordingOverlay.id = 'recording-overlay';
    recordingOverlay.style.fontWeight = 'bold';
    recordingOverlay.appendChild(ball);
    recordingOverlay.appendChild(text);
    document.body.appendChild(recordingOverlay);

    this.uiNeedsRender = true;
    const width = Math.min(getWindowWidth(), Math.max(1280, this.demoWidth));
    const height = Math.min(getWindowWidth(), Math.max(720, this.demoHeight));
    const fitted = fit(width, height, this.options.aspectRatio);
    this.resize(fitted.width, fitted.height);

    const horizontal = (getWindowWidth() - fitted.width) / 2;
    const vertical = (getWindowHeight() - fitted.height) / 2;
    this.renderer.domElement.style.top = `${vertical}px`;
    this.renderer.domElement.style.left = `${horizontal}px`;
    this.renderer.domElement.style.right = `${horizontal}px`;
    this.renderer.domElement.style.bottom = `${vertical}px`;

    const audioStreamNode = this.music.audioContext.createMediaStreamDestination();
    this.music.volumeNode.connect(audioStreamNode);

    this.mediaRecorder = new MediaRecorder(
      new MediaStream([
        this.renderer.domElement.captureStream(60).getVideoTracks()[0],
        audioStreamNode.stream.getAudioTracks()[0],
      ]),
      {
        mimeType: 'video/webm; codecs=vp9',
      }
    );
    this.mediaRecorder.start();
    const chunks = [];
    this.mediaRecorder.ondataavailable = (e) => {
      chunks.push(e.data);
    };
    this.mediaRecorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const now = new Date().toISOString().replace(/:/g, '-');
      a.download = `renin-${now}.webm`;
      a.click();
      URL.revokeObjectURL(url);
      this.mediaRecorder = null;
    };
  }

  stopRealTimeScreenRecording() {
    this.isFullscreen = this.oldIsFullscreen;
    this.fullscreenAnimation.transition(this.isFullscreen ? 1 : 0, 0, 0);
    this.mediaRecorder.stop();
    this.uiNeedsRender = true;
    this.resize(getWindowWidth(), getWindowHeight());
    this.renderer.domElement.style.top = '0px';
    this.renderer.domElement.style.left = '0px';
    this.renderer.domElement.style.right = '0px';
    this.renderer.domElement.style.bottom = '0px';
    const recordingOverlay = document.getElementById('recording-overlay');
    if (recordingOverlay) {
      document.body.removeChild(recordingOverlay);
    }
  }

  resize(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(this.devicePixelRatio);
    this.camera.left = -width / 2;

    this.camera.right = width / 2;
    this.camera.top = height / 2;
    this.camera.bottom = -height / 2;
    this.camera.updateProjectionMatrix();
    this.audioBar.resize(width, height);

    this.demoWidth = this.options.maxWidth ? Math.min(width, this.options.maxWidth) : width;
    this.demoHeight = this.demoWidth / this.options.aspectRatio;
    if (this.demoHeight > height) {
      this.demoHeight = this.options.maxHeight ? Math.min(height, this.options.maxHeight) : height;
      this.demoWidth = this.demoHeight * this.options.aspectRatio;
    }
    if (!this.isFullscreen) {
      this.demoWidth = 640;
      this.demoHeight = this.demoWidth / this.options.aspectRatio;
    }

    this.screenRenderTarget.setSize(this.demoWidth, this.demoHeight);
    this.fullscreenAnimation.transition(this.isFullscreen ? 1 : 0, 0.15, this.uiTime);
    this.root._resize(this.demoWidth, this.demoHeight);

    this.render();
    this.uiUpdate();
    this.uiRender();
  }

  /* for hmr */
  register(newNodeClass: typeof ReninNode) {
    const newNode = new newNodeClass(this);
    function recurse(node: ReninNode): ReninNode | null {
      if ('children' in node && node.children) {
        for (const [id, child] of Object.entries(node.children)) {
          const updated = recurse(child);
          if (updated) {
            node.children[id] = updated;
          }
        }
      }
      if (newNode.constructor.name === node.constructor.name) {
        newNode.children = node.children;
        return newNode;
      }
      return null;
    }
    const updated = recurse(this.root);
    if (updated) {
      this.root = updated;
    }
    newNode.resize(this.screenRenderTarget.width, this.screenRenderTarget.height);

    /* To rerender the current frame */
    setTimeout(() => this.jumpToFrame(this.frame), 0);
  }

  loop = () => {
    requestAnimationFrame(this.loop);
    this.oldTime = this.time;
    this.time = this.music.getCurrentTime();
    this.dt += this.time - this.oldTime;
    this.uiOldTime = this.uiTime;
    this.uiTime = Date.now() / 1000;
    this.uiDt += this.uiTime - this.uiOldTime;
    const frameLength = 1 / 60;

    if (this.needsSkipBecauseTabHasBeenInTheBackground) {
      this.needsSkipBecauseTabHasBeenInTheBackground = false;
      this.jumpToFrame((this.time * 60) | 0);
      this.dt = 0;
      this.uiDt %= frameLength;
    }

    while (this.dt >= frameLength) {
      this.dt -= frameLength;
      this.update(this.frame);
      this.frame++;
      this.demoNeedsRender = true;

      if (this.cuePoints.length === 2 && this.frame >= this.cuePoints[1]) {
        this.jumpToFrame(this.cuePoints[0]);
      }
    }
    while (this.uiDt >= frameLength) {
      this.uiDt -= frameLength;
      this.uiNeedsRender ||= this.uiUpdate();
    }
    if (this.demoNeedsRender) {
      this.render();
    }
    this.uiNeedsRender ||= this.demoNeedsRender;
    if (this.uiNeedsRender) {
      this.uiRender();
      this.uiNeedsRender = false;
    }
    this.demoNeedsRender = false;
  };

  jumpToFrame(frame: number) {
    this.frame = frame;
    this.music.setCurrentTime(frame / 60);
    this.time = frame / 60;
    this.oldTime = this.time;
    this.dt = 0;
    this.update(frame);
    this.uiUpdate();
    this.render();
    this.uiRender();
  }

  update(frame: number) {
    const time = performance.now();
    this.sync.update(frame);
    this.root._update(frame, this);
    const dt = performance.now() - time;
    if (!this.music.paused) {
      this.updateTimes[this.updateTimesIndex] = dt;
      this.updateTimesIndex = (this.updateTimesIndex + 1) % this.updateTimes.length;
    }
  }

  uiUpdate() {
    if (this.options.productionMode) {
      return false;
    }
    let needsRenderAfter = false;
    const time = performance.now();
    needsRenderAfter ||= this.fullscreenAnimation.update(this.uiTime);
    needsRenderAfter ||= this.audioBar.update(this.uiTime);

    let demoWidth = this.width;
    let demoHeight = demoWidth / this.options.aspectRatio;
    if (demoHeight > this.height) {
      demoHeight = this.height;
      demoWidth = demoHeight * this.options.aspectRatio;
    }

    const screenLeft = lerp(this.width - 640 - 16, (this.width - demoWidth) / 2, this.fullscreenAnimation.value);
    const screenRight = lerp(this.width - 16, demoWidth + (this.width - demoWidth) / 2, this.fullscreenAnimation.value);
    const screenTop = lerp(16, (this.height - demoHeight) / 2, this.fullscreenAnimation.value);
    const screenBottom = lerp(
      640 / this.options.aspectRatio + 16,
      demoHeight + (this.height - demoHeight) / 2,
      this.fullscreenAnimation.value
    );

    this.screen.setSize(
      lerp(640, screenRight - screenLeft, this.fullscreenAnimation.value),
      lerp(640 / this.options.aspectRatio, screenBottom - screenTop, this.fullscreenAnimation.value)
    );
    this.screen.object3d.position.x = lerp(
      this.width / 2 - this.screen.object3d.scale.x / 2 - 16,
      this.width / 2 - this.screen.object3d.scale.x / 2 - (this.width - screenRight),
      this.fullscreenAnimation.value
    );
    this.screen.object3d.position.y = lerp(
      this.height / 2 - this.screen.object3d.scale.y / 2 - 16,
      this.height / 2 - this.screen.object3d.scale.y / 2 - screenTop,
      this.fullscreenAnimation.value
    );
    this.screen.object3d.position.z = 90;
    this.screenBackdrop.object3d.position.z = 89;
    this.screenBackdrop.setSize(this.width * 2, this.height * 2);
    this.screenBackdrop.getMaterial().opacity = this.fullscreenAnimation.value ** 4;
    this.screenBackdrop.getMaterial().transparent = true;
    this.screenBackdrop.getMaterial().color.setRGB(0, 0, 0);
    this.screenBackdrop.getMaterial().needsUpdate = true;

    if (this.fullscreenAnimation.value > 0.9999) {
      return needsRenderAfter;
    }

    const dt = performance.now() - time;
    if (!this.music.paused) {
      needsRenderAfter = true;
      this.uiUpdateTimes[this.uiUpdateTimesIndex] = dt;
      this.uiUpdateTimesIndex = (this.uiUpdateTimesIndex + 1) % this.uiUpdateTimes.length;
    }

    return needsRenderAfter;
  }

  uiRender() {
    if (this.options.productionMode) {
      return;
    }

    this.framePanel.setSize(framePanelWidth, framePanelHeight);
    this.framePanel.object3d.position.x = -getWindowWidth() / 2 + 16 + framePanelWidth / 2;
    this.framePanel.object3d.position.y = getWindowHeight() / 2 - 16 - framePanelHeight / 2;
    this.framePanel.object3d.position.z = 50;

    this.performancePanel.setSize(360, 360);
    this.performancePanel.object3d.position.x = getWindowWidth() / 2 - 16 - 640 - 16 - 360 / 2;
    this.performancePanel.object3d.position.y = getWindowHeight() / 2 - 16 - 360 / 2;
    this.performancePanel.object3d.position.z = 50;

    const framePanelCtx = this.framePanelCanvas.getContext('2d');
    if (framePanelCtx) {
      const ctx = framePanelCtx;
      const canvas = this.framePanelCanvas;
      canvas.width = framePanelWidth * window.devicePixelRatio;
      canvas.height = framePanelHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      ctx.fillStyle = colors.slate._500;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      const step = this.sync.stepForFrame(this.frame);
      const musicTime = this.music.getCurrentTime();
      const items: [string, string | number][] = [
        ['Bar', (step / this.options.music.subdivision / this.options.music.beatsPerBar) | 0],
        ['Beat', (step / this.options.music.subdivision) | 0],
        ['Step', step],
        ['Frame', this.frame],
        ['Time', `${(musicTime / 60) | 0}m${(musicTime % 60 | 0).toString().padStart(2, '0')}s`],
      ];
      ctx.font = '16px Barlow';
      ctx.translate(0, framePanelHeight / 2);
      ctx.textBaseline = 'middle';
      for (let [i, [label, value]] of items.entries()) {
        const valueAsText = '' + value;
        const y = (i - (items.length - 1) / 2) * 24;
        ctx.textAlign = 'center';
        ctx.fillStyle = colors.slate._100;
        let offset = 0;
        for (let j = 0; j < valueAsText.length; j++) {
          const letter = valueAsText[valueAsText.length - j - 1];
          const letterWidth = letter === 'm' ? 16 : 9;
          ctx.fillText(letter, framePanelWidth - 16 - offset - letterWidth / 2, y);
          offset += letterWidth;
        }
        ctx.textAlign = 'left';
        ctx.fillStyle = colors.slate._300;
        ctx.fillText(label, 16, y);
      }
    }
    this.framePanelTexture.needsUpdate = true;

    this.screen.getMaterial().uniforms.screen.value = this.debugTexture ?? this.screenRenderTarget.texture;
    this.screen.getMaterial().uniforms.thirdsOverlay.value = thirdsOverlayTexture;
    this.screen.getMaterial().uniformsNeedUpdate = true;
    this.scene.background = new Color(colors.gray._700);

    if (this.fullscreenAnimation.value < 0.9999) {
      this.audioBar.render(this, this.cuePoints);
    }

    this.renderer.setRenderTarget(null);

    this.performancePanel.getMaterial().uniforms.renderTimesCPU.value = this.renderTimesCPU;
    this.performancePanel.getMaterial().uniforms.renderTimesCPUIndex.value = this.renderTimesCPUIndex;
    this.performancePanel.getMaterial().uniforms.updateTimes.value = this.updateTimes;
    this.performancePanel.getMaterial().uniforms.updateTimesIndex.value = this.updateTimesIndex;
    this.performancePanel.getMaterial().uniforms.uiUpdateTimes.value = this.uiUpdateTimes;
    this.performancePanel.getMaterial().uniforms.uiUpdateTimesIndex.value = this.uiUpdateTimesIndex;
    this.performancePanel.getMaterial().uniforms.memoryPercentages.value = this.memoryPercentages;
    this.performancePanel.getMaterial().uniforms.memoryPercentagesIndex.value = this.memoryPercentagesIndex;
    try {
      //@ts-expect-error
      this.performancePanel.getMaterial().uniforms.totalJSHeapSize.value = performance.memory.totalJSHeapSize;
      //@ts-expect-error
      this.performancePanel.getMaterial().uniforms.jsHeapSizeLimit.value = performance.memory.jsHeapSizeLimit;
    } catch {
      /* Non-standard memory API that is only supported in Blink, so just ignore if it doesn't work. */
    }
    this.performancePanel.getMaterial().uniforms.overlay.value = performancePanelTexture;
    this.performancePanel.getMaterial().uniformsNeedUpdate = true;
    const oldEncoding = this.renderer.outputEncoding;
    const oldToneMapping = this.renderer.toneMapping;
    const oldToneMappingExposure = this.renderer.toneMappingExposure;
    this.renderer.outputEncoding = sRGBEncoding;
    this.renderer.toneMapping = NoToneMapping;
    this.renderer.toneMappingExposure = 1;
    this.renderer.render(this.scene, this.camera);
    this.renderer.outputEncoding = oldEncoding;
    this.renderer.toneMapping = oldToneMapping;
    this.renderer.toneMappingExposure = oldToneMappingExposure;
  }

  render() {
    if (this.options.productionMode) {
      this.renderer.setRenderTarget(null);
      this.root._render(this.frame, this.renderer, this);
      return;
    }
    const time = performance.now();
    this.performancePanel.getMaterial().uniforms.renderTimesGPU.value = this.renderTimesGPU;
    this.performancePanel.getMaterial().uniforms.renderTimesGPUIndex.value = this.renderTimesGPUIndex;
    this.performancePanel.getMaterial().needsUpdate = true;

    const context = this.renderer.getContext() as WebGL2RenderingContext;
    const extension = context.getExtension('EXT_disjoint_timer_query_webgl2');
    if (extension) {
      if (this.query) {
        const available = context.getQueryParameter(this.query, context.QUERY_RESULT_AVAILABLE);

        if (available) {
          const elapsedNanos = context.getQueryParameter(this.query, context.QUERY_RESULT);
          this.renderTimesGPU[this.renderTimesGPUIndex] = elapsedNanos / 1_000_000;
          this.renderTimesGPUIndex = (this.renderTimesGPUIndex + 1) % this.renderTimesGPU.length;
          this.query = context.createQuery();
          if (this.query) {
            context.beginQuery(extension.TIME_ELAPSED_EXT, this.query);
            this.queryIsActive = true;
          }
        } else {
          // missed query!
        }
      } else {
        this.query = context.createQuery();
        if (this.query) {
          context.beginQuery(extension.TIME_ELAPSED_EXT, this.query);
          this.queryIsActive = true;
        }
      }
    }

    this.renderer.setRenderTarget(this.screenRenderTarget);
    this.root._render(this.frame, this.renderer, this);
    const dt = performance.now() - time;
    if (!this.music.paused) {
      this.renderTimesCPU[this.renderTimesCPUIndex] = dt;
      this.renderTimesCPUIndex = (this.renderTimesCPUIndex + 1) % this.renderTimesCPU.length;
    }

    try {
      //@ts-expect-error
      this.memoryPercentages[this.memoryPercentagesIndex] = performance.memory.usedJSHeapSize;
      this.memoryPercentagesIndex = (this.memoryPercentagesIndex + 1) % this.memoryPercentages.length;
    } catch {
      /* Non-standard memory API that is only supported in Blink, so just ignore if it doesn't work. */
    }
    if (this.query && this.queryIsActive) {
      context.endQuery(extension.TIME_ELAPSED_EXT);
      this.queryIsActive = false;
    }
  }
}
