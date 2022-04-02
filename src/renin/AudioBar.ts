import {
  Mesh,
  BoxGeometry,
  MeshBasicMaterial,
  Object3D,
  CanvasTexture,
  Raycaster,
  Vector2,
  Texture,
} from "three";
import { colors } from "./colors";
import { Options, Renin, ReninNode } from "./renin";

export const barHeight = 48;

export class Music {
  audioContext = new AudioContext();
  musicSource: MediaElementAudioSourceNode | null = null;
  audioElement = new Audio();
  isPlaying = false;
  constructor() {
    this.musicSource = this.audioContext.createMediaElementSource(
      this.audioElement
    );
    this.musicSource.connect(this.audioContext.destination);
  }
}

const fallbackTexture = new Texture();
const store: { [key: string]: Texture } = {};
const getNodeTexture = (name: string) => {
  if (name in store) {
    return store[name];
  } else {
    const canvas = document.createElement("canvas");
    canvas.width = 1024 * 2;
    canvas.height = 128;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return fallbackTexture;
    }
    ctx.fillStyle = colors.slate._500;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "white";
    ctx.textBaseline = "middle";
    ctx.textAlign = "left";
    ctx.font = "60px Arial";
    ctx.fillText(name, 16, canvas.height / 2);
    const texture = new CanvasTexture(canvas);
    store[name] = texture;
    return texture;
  }
};

export class AudioBar {
  music: Music | null = null;
  width: number = 1;
  nodeContainer = new Object3D();
  cuePoints: Mesh[];
  render(renin: Renin, cuePoints: number[]) {
    if (!this.music) {
      return;
    }

    for (const [i, mesh] of this.cuePoints.entries()) {
      mesh.visible = cuePoints[i] !== undefined;
      const progress = cuePoints[i] / 60 / this.music.audioElement.duration;
      mesh.position.z = 1.5;
      mesh.position.x = 16 + progress * (this.width - 32) - this.width / 2 - 1;
    }

    const audioProgress =
      this.music.audioElement.currentTime / this.music.audioElement.duration;
    this.audioTrack.position.z = 2;
    this.audioTrack.position.x =
      16 + audioProgress * (this.width - 32) - this.width / 2 - 1;

    const geometry = new BoxGeometry();
    for (const child of this.nodeContainer.children) {
      this.nodeContainer.remove(child);
    }
    this.obj.add(this.nodeContainer);
    let deepestDepth = 0;
    const recurse = (
      node: ReninNode,
      depth = 0,
      startFrameBound: number,
      endFrameBound: number
    ) => {
      const startFrame = Math.max(node.startFrame, startFrameBound);
      const endFrame = Math.min(
        node.endFrame === -1 ? endFrameBound : node.endFrame,
        endFrameBound
      );
      deepestDepth = Math.max(depth, deepestDepth);
      if ("children" in node && node.children) {
        let i = 0;
        for (const child of Object.values(node.children)) {
          recurse(child, depth + ++i, startFrame, endFrame);
        }
      }
      const box = new Mesh(
        geometry,
        new MeshBasicMaterial({ map: getNodeTexture(node.constructor.name) })
      );
      box.scale.y = 24;
      const size =
        (endFrame - startFrame) / 60 / renin.music.audioElement.duration;
      box.scale.x = size * (this.width - 32);
      box.position.x =
        (startFrame / 60 / renin.music.audioElement.duration) *
          (this.width - 32) -
        (this.width - 32) / 2 +
        box.scale.x / 2;
      box.position.z = 2;
      box.position.y = (24 + 8) * depth;
      const windowSizeIndependantMagicScaleNumber =
        (window.innerWidth / 1024) * 2.5;
      box.material.map!.repeat.set(
        windowSizeIndependantMagicScaleNumber * size,
        1
      );
      this.nodeContainer.add(box);
    };
    recurse(
      renin.root,
      0,
      renin.root.startFrame,
      renin.root.endFrame === -1
        ? renin.music.audioElement.duration * 60
        : renin.root.endFrame
    );
    this.audioTrack.scale.y = 64 + deepestDepth * 24;
    this.cuePoints[0].scale.y = 64 + deepestDepth * 24;
    this.cuePoints[1].scale.y = 64 + deepestDepth * 24;
  }

  resize(width: number, height: number) {
    this.width = width;
    this.audioBar.scale.x = width - 32;
    this.audioBar.position.y = -height / 2 + barHeight / 2 + 16;
    this.audioTrack.position.y = -height / 2 + barHeight / 2 + 16;
    this.cuePoints[0].position.y = -height / 2 + barHeight / 2 + 16;
    this.cuePoints[1].position.y = -height / 2 + barHeight / 2 + 16;
    this.nodeContainer.position.y = -height / 2 + barHeight + 28 + 8;
  }
  async setMusic(
    renin: Renin,
    music: Music,
    blob: Blob,
    options: Options["music"]
  ) {
    renin.renderer.domElement.addEventListener("click", (e) => {
      const raycaster = new Raycaster();
      const point = new Vector2(e.clientX, e.clientY);
      raycaster.setFromCamera(point, renin.camera);
      const intersections = raycaster.intersectObjects([this.audioBar]);
      if (intersections.length > 0) {
        console.log(intersections[0]);
      }
    });
    this.music = music;
    const audioData = (
      await music.audioContext.decodeAudioData(await blob.arrayBuffer())
    ).getChannelData(0);
    const canvas = document.createElement("canvas");
    canvas.width = 1024 * 4;
    canvas.height = 128;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }
    ctx.fillStyle = colors.slate._800;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const bucketWidth = audioData.length / canvas.width;
    ctx.save();
    ctx.translate(0, canvas.height / 2);
    ctx.scale(1, canvas.height);
    ctx.fillStyle = colors.slate._500;
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
      ((options.bpm / 60) * audioData.length) / music.audioContext.sampleRate;
    ctx.fillStyle = colors.slate._300;
    for (let i = 0; i < beats; i++) {
      ctx.fillStyle = i % 4 === 0 ? colors.slate._300 : colors.slate._500;
      const x = ((canvas.width * i) / beats) | 0;
      ctx.fillRect(x - 1, -1, 3, 2);
    }
    ctx.restore();
    this.audioBar.material.map = new CanvasTexture(canvas);
    this.audioBar.material.needsUpdate = true;
  }
  audioBar: Mesh<BoxGeometry, MeshBasicMaterial>;
  audioTrack: Mesh<BoxGeometry, MeshBasicMaterial>;
  obj = new Object3D();
  constructor() {
    this.audioBar = new Mesh(new BoxGeometry(), new MeshBasicMaterial());
    this.audioBar.scale.y = barHeight;
    this.obj.add(this.audioBar);
    this.audioTrack = new Mesh(
      new BoxGeometry(),
      new MeshBasicMaterial({
        color: colors.orange._500,
      })
    );
    this.audioTrack.scale.set(3, barHeight, 1);
    this.cuePoints = [
      new Mesh(
        new BoxGeometry(),
        new MeshBasicMaterial({
          color: colors.green._500,
        })
      ),
      new Mesh(
        new BoxGeometry(),
        new MeshBasicMaterial({
          color: colors.green._300,
        })
      ),
    ];
    this.audioTrack.scale.set(3, barHeight, 1);
    this.cuePoints[0].scale.set(3, barHeight, 1);
    this.cuePoints[1].scale.set(3, barHeight, 1);
    this.obj.add(this.audioTrack);
    this.obj.add(this.cuePoints[0]);
    this.obj.add(this.cuePoints[1]);
  }
}
