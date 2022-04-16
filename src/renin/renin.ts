import {
  CanvasTexture,
  Color,
  OrthographicCamera,
  Scene,
  ShaderMaterial,
  WebGLRenderer,
  WebGLRenderTarget,
} from 'three';
import { AudioBar } from './ui/AudioBar';
import { Sync } from './sync';
import defaultVert from './default.vert.glsl';
import { lerp } from './interpolations';
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

export const defaultVertexShader = defaultVert;

const framePanelHeight = 24 * 5;

registerErrorOverlay();

export interface Options {
  music: {
    src: string;
    bpm: number;
    subdivision: number;
    beatOffset: number;
  };
  root: ReninNode;
  productionMode: boolean;
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

  renderTimesCPU: number[] = [...new Array(128)].map(() => 0);
  renderTimesCPUIndex: number = 0;
  renderTimesGPU: number[] = [...new Array(128)].map(() => 0);
  renderTimesGPUIndex: number = 0;

  renderer = new WebGLRenderer();
  demoRenderTarget = new WebGLRenderTarget(640, 360);
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
      },
    }),
  });
  scene = new Scene();
  camera = new OrthographicCamera(-1, 1, 1, -1);
  root: ReninNode;
  screenRenderTarget: WebGLRenderTarget = new WebGLRenderTarget(640, 360);
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

  constructor(options: Options) {
    Renin.instance = this;
    this.options = options;
    this.root = options.root;

    this.audioBar = new AudioBar(this);

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
        this.audioBar.zoom(deltaY);
      } else {
        const deltaX = e.deltaX / 1000;
        this.audioBar.pan(deltaX);
        this.audioBar.zoom(1);
      }
    });

    this.renderer.domElement.addEventListener('click', (e) => {
      this.music.audioContext.resume();
      const screenHeight = getWindowHeight();
      const padding = 16;
      const audioBarHeight = 64;
      const screenWidth = getWindowWidth();

      const audioBarWidth = screenWidth - padding * 2;
      const x = (e.clientX - padding) / audioBarWidth;
      if (e.clientY > screenHeight - audioBarHeight - padding) {
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
    this.scene.add(this.camera);
    this.screen.object3d.scale.x = 640;
    this.screen.object3d.scale.y = 360;

    this.framePanelCanvas = document.createElement('canvas');
    this.framePanelTexture = new CanvasTexture(this.framePanelCanvas);
    this.framePanel.setTexture(this.framePanelTexture, true);

    this.scene.add(this.audioBar.obj);

    (async () => {
      const response = await fetch(options.music.src);
      const data = await response.arrayBuffer();
      const buffer = await this.music.audioContext.decodeAudioData(data);
      this.music.setBuffer(buffer);
      //@ts-expect-error
      this.audioBar.setMusic(this.music, buffer, options.music);
    })();

    this.camera.position.z = 100;
    this.resize(getWindowWidth(), getWindowHeight());

    window.addEventListener('resize', () => {
      this.music.audioContext.resume();
      this.resize(getWindowWidth(), getWindowHeight());
    });

    document.addEventListener('keydown', (e) => {
      this.music.audioContext.resume();
      const backskipSlop = this.music.paused ? 0 : 20;
      console.log(e.key);
      if (e.key === 'm') {
        this.music.setVolume(this.music.getVolume() === 1 ? 0 : 1);
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
        const bar = step - (step % (this.sync.music.subdivision * 4));
        this.cuePoints = [this.sync.frameForStep(bar), this.sync.frameForStep(bar + this.sync.music.subdivision * 4)];
      }
      if (e.key === 'n') {
        if (this.cuePoints.length >= 2) {
          this.cuePoints = [];
          return;
        }
        /* repeat current 4 bars */
        const step = this.sync.stepForFrame(this.frame);
        const bar = step - (step % (this.sync.music.subdivision * 4 * 4));
        this.cuePoints = [
          this.sync.frameForStep(bar),
          this.sync.frameForStep(bar + this.sync.music.subdivision * 4 * 4),
        ];
      }
      if (e.key === 'g') {
        const step = this.sync.stepForFrame(this.frame);
        const quantizedStep = step - (step % this.sync.music.subdivision);
        if (this.cuePoints.length < 2) {
          this.cuePoints.push(this.sync.frameForStep(quantizedStep));
        } else {
          this.cuePoints = [];
        }
      }
      if (e.key === 'J') {
        this.jumpToFrame(this.frame - 1);
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

  resize(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.camera.left = -width / 2;

    this.camera.right = width / 2;
    this.camera.top = height / 2;
    this.camera.bottom = -height / 2;
    this.camera.updateProjectionMatrix();
    this.audioBar.resize(width, height);

    if (this.isFullscreen) {
      this.screenRenderTarget.setSize(width, height);
      this.fullscreenAnimation.transition(1, 0.15, this.uiTime);
    } else {
      this.screenRenderTarget.setSize(640, 360);
      this.fullscreenAnimation.transition(0, 0.15, this.uiTime);
    }

    this.root._resize(width, height);
  }

  /* for hmr */
  register(newNode: ReninNode) {
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
  }

  loop = () => {
    requestAnimationFrame(this.loop);
    this.oldTime = this.time;
    this.time = this.music.getCurrentTime();
    this.dt += this.time - this.oldTime;
    this.uiOldTime = this.uiTime;
    this.uiTime = Date.now() / 1000;
    this.uiDt += this.uiTime - this.uiOldTime;
    let needsRender = false;
    const frameLength = 1 / 60;
    if (this.dt >= 10 * frameLength) {
      /* give up and skip! */
      this.dt %= frameLength;
    }
    if (this.uiDt >= 10 * frameLength) {
      /* give up and skip! */
      this.uiDt %= frameLength;
    }
    while (this.dt >= frameLength) {
      this.dt -= frameLength;
      this.update(this.frame);
      this.frame++;
      needsRender = true;

      if (this.cuePoints.length === 2 && this.frame >= this.cuePoints[1]) {
        this.jumpToFrame(this.cuePoints[0]);
      }
    }
    while (this.uiDt >= frameLength) {
      this.uiDt -= frameLength;
      this.uiUpdate();
      needsRender = true;
    }
    if (needsRender) {
      this.render();
    }
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
  }

  update(frame: number) {
    const time = performance.now();
    this.sync.update(frame);
    this.root._update(frame);
    const dt = performance.now() - time;
    if (!this.music.paused) {
      this.updateTimes[this.updateTimesIndex] = dt;
      this.updateTimesIndex = (this.updateTimesIndex + 1) % this.updateTimes.length;
    }
  }

  uiUpdate() {
    if (this.options.productionMode) {
      return;
    }
    const time = performance.now();
    this.fullscreenAnimation.update(this.uiTime);
    this.screen.setSize(
      lerp(640, getWindowWidth(), this.fullscreenAnimation.value),
      lerp(360, (getWindowWidth() / 16) * 9, this.fullscreenAnimation.value)
    );
    this.screen.object3d.position.x = lerp(
      getWindowWidth() / 2 - this.screen.object3d.scale.x / 2 - 16,
      getWindowWidth() / 2 - this.screen.object3d.scale.x / 2,
      this.fullscreenAnimation.value
    );
    this.screen.object3d.position.y = lerp(
      getWindowHeight() / 2 - this.screen.object3d.scale.y / 2 - 16,
      getWindowHeight() / 2 - this.screen.object3d.scale.y / 2,
      this.fullscreenAnimation.value
    );
    this.screen.object3d.position.z = 90;

    if (this.fullscreenAnimation.value > 0.9999) {
      return;
    }

    this.framePanel.setSize(128 + 32, framePanelHeight);
    this.framePanel.object3d.position.x = -getWindowWidth() / 2 + 16 + (128 + 32) / 2;
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
      canvas.width = (128 + 32) * window.devicePixelRatio;
      canvas.height = framePanelHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      ctx.fillStyle = colors.slate._500;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      const step = this.sync.stepForFrame(this.frame);
      const items: [string, number][] = [
        ['Bar', (step / this.options.music.subdivision / 4) | 0],
        ['Beat', (step / this.options.music.subdivision) | 0],
        ['Step', step],
        ['Frame', this.frame],
      ];
      ctx.font = '100 20px Barlow';
      ctx.translate(0, canvas.height / 4);
      ctx.textBaseline = 'middle';
      for (let [i, [label, value]] of items.entries()) {
        const y = (i - (items.length - 1) / 2) * 24;
        ctx.textAlign = 'right';
        ctx.fillStyle = colors.slate._100;
        ctx.fillText('' + value, canvas.width / 2 - 16, y);
        ctx.textAlign = 'left';
        ctx.fillStyle = colors.slate._300;
        ctx.fillText(label, 16, y);
      }
    }
    this.framePanelTexture.needsUpdate = true;

    const dt = performance.now() - time;
    if (!this.music.paused) {
      this.uiUpdateTimes[this.uiUpdateTimesIndex] = dt;
      this.uiUpdateTimesIndex = (this.uiUpdateTimesIndex + 1) % this.uiUpdateTimes.length;
    }
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

    this.renderer.setRenderTarget(this.screenRenderTarget);
    this.root._render(this.frame, this.renderer, this);
    this.screen.getMaterial().uniforms.screen.value = this.screenRenderTarget.texture;
    this.screen.getMaterial().uniforms.thirdsOverlay.value = thirdsOverlayTexture;
    this.screen.getMaterial().uniformsNeedUpdate = true;
    this.scene.background = new Color(colors.gray._700);

    if (this.fullscreenAnimation.value < 0.9999) {
      this.audioBar.render(this, this.cuePoints);
    }

    this.renderer.setRenderTarget(null);

    const dt = performance.now() - time;
    if (!this.music.paused) {
      this.renderTimesCPU[this.renderTimesCPUIndex] = dt;
      this.renderTimesCPUIndex = (this.renderTimesCPUIndex + 1) % this.renderTimesCPU.length;
    }
    this.performancePanel.getMaterial().uniforms.renderTimesCPU.value = this.renderTimesCPU;
    this.performancePanel.getMaterial().uniforms.renderTimesCPUIndex.value = this.renderTimesCPUIndex;
    this.performancePanel.getMaterial().uniforms.updateTimes.value = this.updateTimes;
    this.performancePanel.getMaterial().uniforms.updateTimesIndex.value = this.updateTimesIndex;
    this.performancePanel.getMaterial().uniforms.uiUpdateTimes.value = this.uiUpdateTimes;
    this.performancePanel.getMaterial().uniforms.uiUpdateTimesIndex.value = this.uiUpdateTimesIndex;
    this.performancePanel.getMaterial().uniforms.memoryPercentages.value = this.memoryPercentages;
    this.performancePanel.getMaterial().uniforms.memoryPercentagesIndex.value = this.memoryPercentagesIndex;
    //@ts-expect-error
    this.performancePanel.getMaterial().uniforms.totalJSHeapSize.value = performance.memory.totalJSHeapSize;
    //@ts-expect-error
    this.performancePanel.getMaterial().uniforms.jsHeapSizeLimit.value = performance.memory.jsHeapSizeLimit;
    this.performancePanel.getMaterial().uniformsNeedUpdate = true;

    try {
      //@ts-expect-error
      this.memoryPercentages[this.memoryPercentagesIndex] = performance.memory.usedJSHeapSize;
      this.memoryPercentagesIndex = (this.memoryPercentagesIndex + 1) % this.memoryPercentages.length;
    } catch {
      /* Non-standard memory API that is only supported in Blink, so just ignore if it doesn't work. */
    }

    this.renderer.render(this.scene, this.camera);

    if (this.query && this.queryIsActive) {
      context.endQuery(extension.TIME_ELAPSED_EXT);
      this.queryIsActive = false;
    }
  }
}
