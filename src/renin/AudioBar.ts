import {
  Mesh,
  BoxGeometry,
  MeshBasicMaterial,
  Object3D,
  CanvasTexture,
  Raycaster,
  Vector2,
} from "three";
import { Options, Renin } from "./renin";

export const barHeight = 64;

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

export class AudioBar {
  music: Music | null = null;
  width: number = 1;
  render() {
    if (!this.music) {
      return;
    }
    const audioProgress =
      this.music.audioElement.currentTime / this.music.audioElement.duration;
    this.audioTrack.position.z = 2;
    this.audioTrack.position.x =
      16 + audioProgress * (this.width - 32) - this.width / 2;
  }
  resize(width: number, height: number) {
    this.width = width;
    this.audioBar.scale.x = width - 32;
    this.audioBar.position.y = -height / 2 + barHeight / 2 + 16;
    this.audioTrack.position.y = -height / 2 + barHeight / 2 + 16;
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
      ((options.bpm / 60) * audioData.length) /
      music.audioContext.sampleRate /
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
        color: "orange",
      })
    );
    this.audioTrack.scale.set(2, barHeight, 1);
    this.obj.add(this.audioTrack);
  }
}
