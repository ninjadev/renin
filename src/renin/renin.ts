import {
  BoxGeometry,
  CanvasTexture,
  Color,
  Mesh,
  MeshBasicMaterial,
  OrthographicCamera,
  Scene,
  Vector3,
  WebGLRenderer,
  WebGLRenderTarget,
} from "three";
import { AudioBar, Music } from "./AudioBar";
import { Sync } from "./sync";
import defaultVert from "./default.vert.glsl";
import { lerp } from "../interpolations";

export const defaultVertexShader = defaultVert;

export function children<T>(spec: any): T {
  const store: any = {};
  return new Proxy(spec, {
    set: (target, prop, value) => {
      store[prop] = value;
      return true;
    },
    get: (_target, prop) => {
      if (store[prop]) {
        return store[prop];
      } else {
        store[prop] = new spec[prop]();
        return store[prop];
      }
    },
  });
}

export class ReninNode {
  startFrame: number = 0;
  endFrame: number = -1;
  children?: { [key: string]: ReninNode };
  id: string;
  update(frame: number): void {}
  render(frame: number, renderer: WebGLRenderer, renin: Renin): void {}

  constructor() {
    this.id = this.constructor.name + "-" + ((1000000 * Math.random()) | 0);
    console.log("new", this.id);
  }
  public _update(frame: number) {
    if (
      frame < this.startFrame ||
      (frame >= this.endFrame && this.endFrame !== -1)
    ) {
      return;
    }
    if ("children" in this) {
      for (const child of Object.values(this.children || {})) {
        child._update(frame);
      }
    }
    this.update?.(frame);
  }

  public _render(frame: number, renderer: WebGLRenderer, renin: Renin) {
    if (
      frame < this.startFrame ||
      (frame >= this.endFrame && this.endFrame !== -1)
    ) {
      return;
    }
    if ("children" in this) {
      for (const child of Object.values(this.children || {})) {
        child._render(frame, renderer, renin);
      }
    }
    const oldRenderTarget = renderer.getRenderTarget();
    this.render?.(frame, renderer, renin);
    renderer.setRenderTarget(oldRenderTarget);
  }
}

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
  audioBar = new AudioBar();
  music = new Music();
  sync: Sync;
  frame = 0;
  oldTime: number = 0;
  time: number = 0;
  dt: number = 0;

  renderer = new WebGLRenderer();
  demoRenderTarget = new WebGLRenderTarget(640, 360);
  screen = new Mesh(
    new BoxGeometry(),
    new MeshBasicMaterial({ color: "white" })
  );
  scene = new Scene();
  camera = new OrthographicCamera(-1, 1, 1, -1);
  root: ReninNode;
  screenRenderTarget: WebGLRenderTarget = new WebGLRenderTarget(640, 360);
  isFullscreen: boolean = false;
  screenTargetScale = new Vector3(640, 360, 1);
  uiOldTime: number = Date.now() / 1000;
  uiTime: number = Date.now() / 1000;
  uiDt: number = 0;

  constructor(options: Options) {
    Renin.instance = this;
    this.root = options.root;

    const body = document.getElementsByTagName("body")[0];
    body.appendChild(this.renderer.domElement);
    this.renderer.domElement.style.position = "fixed";
    this.renderer.domElement.style.top = "0px";
    this.renderer.domElement.style.left = "0px";
    this.renderer.domElement.style.right = "0px";
    this.renderer.domElement.style.bottom = "0px";
    this.scene.add(this.screen);
    this.scene.add(this.camera);
    this.screen.scale.x = 640;
    this.screen.scale.y = 360;
    this.sync = new Sync(options.music);

    this.scene.add(this.audioBar.obj);

    (async () => {
      const response = await fetch(options.music.src);
      const audio = this.music.audioElement;
      const blob = await response.blob();
      audio.src = window.URL.createObjectURL(blob);
      this.audioBar.setMusic(this, this.music, blob, options.music);
    })();

    this.camera.position.z = 10;
    this.resize(window.innerWidth, window.innerHeight);

    window.addEventListener("resize", () => {
      this.resize(window.innerWidth, window.innerHeight);
    });

    document.addEventListener("keydown", (e) => {
      console.log(e.key);
      if (e.key === "Enter") {
        this.isFullscreen = !this.isFullscreen;
        this.resize(window.innerWidth, window.innerHeight);
      }
      if (e.key === " ") {
        if (this.music.isPlaying) {
          this.music.isPlaying = false;
          this.music.audioElement.pause();
        } else {
          this.music.isPlaying = true;
          this.music.audioContext.resume();
          this.music.audioElement.play();
        }
      }
    });
  }

  resize(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.renderer.setSize(width, height);
    this.camera.left = -width / 2;

    this.camera.right = width / 2;
    this.camera.top = height / 2;
    this.camera.bottom = -height / 2;
    this.camera.updateProjectionMatrix();
    this.audioBar.resize(width, height);

    if (this.isFullscreen) {
      this.screenRenderTarget.setSize(width, height);
      this.screenTargetScale.set(width, (width / 16) * 9, 1);
    } else {
      this.screenRenderTarget.setSize(640, 360);
      this.screenTargetScale.set(640, 360, 1);
    }
  }

  /* for hmr */
  register(newNode: ReninNode) {
    function recurse(node: ReninNode): ReninNode | null {
      if ("children" in node && node.children) {
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
    this.time = this.music.audioElement.currentTime;
    this.dt += this.time - this.oldTime;
    this.uiOldTime = this.uiTime;
    this.uiTime = Date.now() / 1000;
    this.uiDt += this.uiTime - this.uiOldTime;
    const frameLength = 1 / 60;
    while (this.dt >= frameLength) {
      this.dt -= frameLength;
      this.update();
      this.frame++;
    }
    while (this.uiDt >= frameLength) {
      this.uiDt -= frameLength;
      this.uiUpdate();
    }
    this.render();
  };

  update() {
    const frame = (this.music.audioElement.currentTime * 60) | 0;
    this.sync.update(frame);
    this.root._update(frame);
  }

  uiUpdate() {
    this.screen.scale.x = lerp(
      this.screen.scale.x,
      this.screenTargetScale.x,
      0.5
    );
    this.screen.scale.y = lerp(
      this.screen.scale.y,
      this.screenTargetScale.y,
      0.5
    );
  }

  render() {
    const frame = (this.music.audioElement.currentTime * 60) | 0;
    this.renderer.setRenderTarget(this.screenRenderTarget);
    this.root._render(frame, this.renderer, this);
    this.screen.material.map = this.screenRenderTarget.texture;
    this.screen.material.needsUpdate = true;
    this.scene.background = new Color(0x222222);

    this.audioBar.render(this);
    this.renderer.setRenderTarget(null);
    this.renderer.render(this.scene, this.camera);
  }
}
