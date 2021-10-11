import {
  BoxGeometry,
  CanvasTexture,
  Mesh,
  MeshBasicMaterial,
  OrthographicCamera,
  Scene,
  WebGLRenderer,
  WebGLRenderTarget,
} from "three";

export interface ReninNode {
  id: string;
  update?: () => void;
  render?: (renderer: WebGLRenderer) => void;
}

export const nodeRegistry: { [key: string]: ReninNode } = {};

const barHeight = 64;

interface Options {
  music: {
    src: string;
    bpm: number;
    subdivision: number;
  };
}

class Renin {
  width: number = 1;
  height: number = 1;
  audioBar: Mesh<BoxGeometry, MeshBasicMaterial>;
  audioContext: AudioContext;
  musicSource: MediaElementAudioSourceNode | null = null;
  audioTrack: Mesh<BoxGeometry, MeshBasicMaterial>;
  audio = new Audio();
  isPlaying = false;
  register(node: ReninNode) {
    nodeRegistry[node.id] = node;
  }
  renderer = new WebGLRenderer();
  demoRenderTarget = new WebGLRenderTarget(640, 360);
  screen = new Mesh(
    new BoxGeometry(),
    new MeshBasicMaterial({ color: "white" })
  );
  nodes: Node[] = [];
  scene = new Scene();
  camera = new OrthographicCamera(-1, 1, 1, -1);
  id: number;

  constructor() {
    this.id = Math.random();
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

    this.audioBar = new Mesh(new BoxGeometry(), new MeshBasicMaterial());
    this.scene.add(this.audioBar);
    this.audioBar.scale.y = barHeight;

    this.audioTrack = new Mesh(
      new BoxGeometry(),
      new MeshBasicMaterial({
        color: "orange",
      })
    );
    this.audioTrack.scale.set(2, barHeight, 1);
    this.scene.add(this.audioTrack);

    this.camera.position.z = 10;
    this.resize(window.innerWidth, window.innerHeight);
    this.audioContext = new AudioContext();

    window.addEventListener("resize", () => {
      this.resize(window.innerWidth, window.innerHeight);
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === " ") {
        if (this.isPlaying) {
          this.isPlaying = false;
          this.audio.pause();
        } else {
          this.isPlaying = true;
          this.audioContext.resume();
          this.audio.play();
        }
      }
    });
  }

  async configure(options: Options) {
    const response = await fetch(options.music.src);
    const audio = this.audio;
    const blob = await response.blob();
    audio.src = window.URL.createObjectURL(blob);
    this.musicSource = this.audioContext.createMediaElementSource(audio);
    this.musicSource.connect(this.audioContext.destination);
    const audioData = (
      await this.audioContext.decodeAudioData(await blob.arrayBuffer())
    ).getChannelData(0);
    const canvas = document.createElement("canvas");
    canvas.width = 1024 * 4;
    canvas.height = 128;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const bucketWidth = audioData.length / canvas.width;
    ctx.save();
    ctx.translate(0, canvas.height / 2);
    ctx.scale(1, canvas.height);
    ctx.fillStyle = "red";
    for (let i = 0; i < canvas.width; i++) {
      let min = 0;
      let max = 0;
      for (let j = 0; j < bucketWidth; j++) {
        const sample = audioData[(i * bucketWidth + j) | 0];
        min = Math.min(min, sample);
        max = Math.max(max, sample);
      }
      ctx.fillRect(i, min, 1, max - min);
    }
    const beats =
      ((options.music.bpm / 60) * audioData.length) /
      this.audioContext.sampleRate /
      4;
    ctx.fillStyle = "white";
    for (let i = 0; i < beats; i++) {
      const x = ((canvas.width * i) / beats) | 0;
      ctx.fillRect(x - 1, -1, 3, 2);
    }
    ctx.restore();
    this.audioBar.material.map = new CanvasTexture(canvas);
    this.audioBar.material.needsUpdate = true;
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
    this.audioBar.scale.x = width - 32;
    this.audioBar.position.y = -height / 2 + barHeight / 2 + 16;
    this.audioTrack.position.y = -height / 2 + barHeight / 2 + 16;
  }

  loop = () => {
    requestAnimationFrame(this.loop);
    this.update();
    this.render();
  };

  update() {
    for (const node of Object.values(nodeRegistry)) {
      node.update?.();
    }
  }

  render() {
    for (const node of Object.values(nodeRegistry)) {
      node.render?.(this.renderer);
    }
    if (nodeRegistry.spinningcube) {
      //@ts-expect-error
      const texture = nodeRegistry.spinningcube.renderTarget.texture;
      this.screen.material.map = texture;
      this.screen.material.needsUpdate = true;
    }

    const audioProgress = this.audio.currentTime / this.audio.duration;
    this.audioTrack.position.z = 2;
    this.audioTrack.position.x =
      16 + audioProgress * (this.width - 32) - this.width / 2;
    this.renderer.setRenderTarget(null);
    this.renderer.render(this.scene, this.camera);
  }
}

export const renin = new Renin();
