import {
  BoxGeometry,
  Color,
  Mesh,
  MeshBasicMaterial,
  OrthographicCamera,
  Scene,
  WebGLRenderer,
  WebGLRenderTarget,
} from 'three';
import { AudioBar } from './AudioBar';
import { Sync } from './sync';
import defaultVert from './default.vert.glsl';
import { lerp } from '../interpolations';
import { colors } from './colors';
import { getWindowHeight, getWindowWidth } from './utils';
import { ReninNode } from './ReninNode';
import { registerErrorOverlay } from './error';
import { Music } from './music';
import { UIAnimation } from './animation';

export const defaultVertexShader = defaultVert;

registerErrorOverlay();

export interface Options {
  music: {
    src: string;
    bpm: number;
    subdivision: number;
  };
  root: ReninNode;
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

  renderer = new WebGLRenderer();
  demoRenderTarget = new WebGLRenderTarget(640, 360);
  screen = new Mesh(new BoxGeometry(), new MeshBasicMaterial({ color: 'white' }));
  scene = new Scene();
  camera = new OrthographicCamera(-1, 1, 1, -1);
  root: ReninNode;
  screenRenderTarget: WebGLRenderTarget = new WebGLRenderTarget(640, 360);
  isFullscreen: boolean = false;
  fullscreenAnimation = new UIAnimation();
  uiOldTime: number = Date.now() / 1000;
  uiTime: number = Date.now() / 1000;
  uiDt: number = 0;

  constructor(options: Options) {
    Renin.instance = this;
    this.root = options.root;

    this.audioBar = new AudioBar(this);

    const body = document.getElementsByTagName('body')[0];
    body.appendChild(this.renderer.domElement);
    this.renderer.domElement.style.position = 'fixed';
    this.renderer.domElement.style.top = '0px';
    this.renderer.domElement.style.left = '0px';
    this.renderer.domElement.style.right = '0px';
    this.renderer.domElement.style.bottom = '0px';

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
          this.jumpToFrame((x * this.music.getDuration() * 60) | 0);
        }
      }
    });

    this.scene.add(this.screen);
    this.scene.add(this.camera);
    this.screen.scale.x = 640;
    this.screen.scale.y = 360;
    this.sync = new Sync(options.music);

    this.scene.add(this.audioBar.obj);

    (async () => {
      const response = await fetch(options.music.src);
      const data = await response.arrayBuffer();
      const buffer = await this.music.audioContext.decodeAudioData(data);
      this.music.setBuffer(buffer);
      //@ts-expect-error
      this.audioBar.setMusic(this.music, buffer, options.music);
    })();

    this.camera.position.z = 10;
    this.resize(getWindowWidth(), getWindowHeight());

    window.addEventListener('resize', () => {
      this.music.audioContext.resume();
      this.resize(getWindowWidth(), getWindowHeight());
    });

    document.addEventListener('keydown', (e) => {
      this.music.audioContext.resume();
      console.log(e.key);
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
        const step = this.sync.stepForFrame(this.frame);
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
        const step = this.sync.stepForFrame(this.frame);
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
    const frameLength = 1 / 60;
    while (this.dt >= frameLength) {
      this.dt -= frameLength;
      this.update(this.frame);
      this.frame++;

      if (this.cuePoints.length === 2 && this.frame >= this.cuePoints[1]) {
        this.jumpToFrame(this.cuePoints[0]);
      }
    }
    while (this.uiDt >= frameLength) {
      this.uiDt -= frameLength;
      this.uiUpdate();
    }
    this.render();
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
    this.sync.update(frame);
    this.root._update(frame);
  }

  uiUpdate() {
    this.fullscreenAnimation.update(this.uiTime);
    this.screen.scale.x = lerp(640, getWindowWidth(), this.fullscreenAnimation.value);
    this.screen.scale.y = lerp(360, (getWindowWidth() / 16) * 9, this.fullscreenAnimation.value);
    this.screen.position.x = lerp(
      getWindowWidth() / 2 - this.screen.scale.x / 2 - 16,
      getWindowWidth() / 2 - this.screen.scale.x / 2,
      this.fullscreenAnimation.value
    );
    this.screen.position.y = lerp(
      getWindowHeight() / 2 - this.screen.scale.y / 2 - 16,
      getWindowHeight() / 2 - this.screen.scale.y / 2,
      this.fullscreenAnimation.value
    );
  }

  render() {
    const frame = (this.music.getCurrentTime() * 60) | 0;
    this.renderer.setRenderTarget(this.screenRenderTarget);
    this.root._render(frame, this.renderer, this);
    this.screen.material.map = this.screenRenderTarget.texture;
    this.screen.material.needsUpdate = true;
    this.scene.background = new Color(colors.gray._700);

    this.audioBar.render(this, this.cuePoints);
    this.renderer.setRenderTarget(null);
    this.renderer.render(this.scene, this.camera);
  }
}
