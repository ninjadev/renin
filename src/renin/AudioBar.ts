import { Mesh, BoxGeometry, MeshBasicMaterial, Object3D, CanvasTexture, Texture, RepeatWrapping } from 'three';
import { colors } from './colors';
import { Music } from './music';
import { Options, Renin } from './renin';
import { ReninNode } from './ReninNode';
import { UIBox } from './uibox';
import { getWindowHeight, getWindowWidth, gradientCanvas } from './utils';

export const barHeight = 48;
const glowSize = 12;

const fallbackTexture = new Texture();
const store: { [key: string]: Texture } = {};
const getNodeTexture = (name: string) => {
  if (name in store) {
    return store[name];
  } else {
    const canvas = document.createElement('canvas');
    canvas.width = 1024 * 2;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return fallbackTexture;
    }
    ctx.fillStyle = colors.slate._500;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = colors.slate._100;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    ctx.font = '60px Barlow';
    ctx.fillText(name, 32, canvas.height / 2);
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
  renin: Renin;
  audioBar: UIBox;

  render(renin: Renin, cuePoints: number[]) {
    if (!this.music) {
      return;
    }

    this.audioTrack.material.opacity = this.music.paused ? 0 : 0.3;
    this.audioTrack.material.needsUpdate = true;

    for (const [i, mesh] of this.cuePoints.entries()) {
      mesh.visible = cuePoints[i] !== undefined;
      const progress = cuePoints[i] / 60 / this.music.getDuration();
      mesh.position.z = 1.5;
      mesh.position.x = 16 + progress * (this.width - 32) - this.width / 2;
    }

    const audioProgress = this.music.getCurrentTime() / this.music.getDuration();
    this.audioTrack.position.z = 10;
    this.audioTrack.position.x = 16 + audioProgress * (this.width - 32) - this.width / 2 - glowSize / 2;

    const geometry = new BoxGeometry();
    for (const child of this.nodeContainer.children) {
      this.nodeContainer.remove(child);
    }
    this.obj.add(this.nodeContainer);
    let deepestDepth = 0;
    const recurse = (node: ReninNode, depth = 0, startFrameBound: number, endFrameBound: number) => {
      const startFrame = Math.max(node.startFrame, startFrameBound);
      const endFrame = Math.min(node.endFrame === -1 ? endFrameBound : node.endFrame, endFrameBound);
      deepestDepth = Math.max(depth, deepestDepth);
      if ('children' in node && node.children) {
        let i = 0;
        for (const child of Object.values(node.children)) {
          recurse(child, depth + ++i, startFrame, endFrame);
        }
      }
      const box = new UIBox({ shadowSize: 8, shadowOpacity: 0.06 });
      box.setTexture(getNodeTexture(node.constructor.name));
      const size = (endFrame - startFrame) / 60 / renin.music.getDuration();
      box.setSize(size * (this.width - 32), 24);
      box.object3d.position.x =
        (startFrame / 60 / renin.music.getDuration()) * (this.width - 32) -
        (this.width - 32) / 2 +
        box.object3d.scale.x / 2;
      box.object3d.position.z = 2;
      box.object3d.position.y = (24 + 8) * depth;
      const windowSizeIndependantMagicScaleNumber = (getWindowWidth() / 1024) * 2.5;
      box.getMaterial().map!.repeat.set(windowSizeIndependantMagicScaleNumber * size, 1);
      this.nodeContainer.add(box.object3d);

      if ((node as any).renderTarget || (node as any).screen) {
        const renderTarget = (node as any).renderTarget || this.renin.screenRenderTarget;
        const preview = new Mesh(geometry, new MeshBasicMaterial({ map: renderTarget.texture }));
        preview.position.z = 5;
        preview.position.x = box.object3d.position.x + box.object3d.scale.x / 2 - 16;
        preview.position.y = box.object3d.position.y;
        preview.scale.x = 32;
        preview.scale.y = 24;
        this.nodeContainer.add(preview);
      }
    };
    recurse(
      renin.root,
      0,
      renin.root.startFrame,
      renin.root.endFrame === -1 ? renin.music.getDuration() * 60 : renin.root.endFrame
    );
    const trackHeight = barHeight + (deepestDepth + 1) * 32;
    this.audioTrack.scale.y = trackHeight;
    this.audioTrack.position.y = -getWindowHeight() / 2 + trackHeight / 2 + 16;
    this.cuePoints[0].scale.y = trackHeight;
    this.cuePoints[1].scale.y = trackHeight;
    this.cuePoints[0].position.y = this.audioTrack.position.y;
    this.cuePoints[1].position.y = this.audioTrack.position.y;
  }

  resize(width: number, height: number) {
    this.width = width;
    this.audioBar.setSize(width - 32, barHeight);
    this.audioBar.object3d.position.y = -height / 2 + barHeight / 2 + 16;
    this.audioTrack.position.y = -height / 2 + barHeight / 2 + 16;
    this.cuePoints[0].position.y = -height / 2 + barHeight / 2 + 16;
    this.cuePoints[1].position.y = -height / 2 + barHeight / 2 + 16;
    this.nodeContainer.position.y = -height / 2 + barHeight + 28 + 8;
  }
  async setMusic(music: Music, buffer: AudioBuffer, options: Options['music']) {
    this.music = music;
    const audioData = buffer.getChannelData(0);
    const canvas = document.createElement('canvas');
    canvas.width = 1024 * 4;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }
    ctx.fillStyle = colors.slate._800;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const bucketScale = 1;
    const bucketWidth = (audioData.length / canvas.width) * bucketScale;
    ctx.save();
    ctx.translate(0, canvas.height / 2);
    ctx.scale(1, canvas.height);
    ctx.fillStyle = colors.slate._500;
    for (let i = 0; i < canvas.width; i++) {
      const group = [];
      for (let j = 0; j < bucketWidth; j++) {
        const sample = audioData[(i * bucketWidth + j) | 0];
        group.push(Math.abs(sample));
      }
      const s = (group.reduce((a, b) => a + b, 0) / group.length) * 2;
      const min = -s;
      const max = s;
      ctx.fillRect(i * bucketScale, min, bucketScale, max - min);
    }
    const beats = ((options.bpm / 60) * audioData.length) / music.audioContext.sampleRate;
    ctx.fillStyle = colors.slate._300;
    for (let i = 0; i < beats; i++) {
      ctx.fillStyle = i % 4 === 0 ? colors.slate._300 : colors.slate._500;
      const x = ((canvas.width * i) / beats) | 0;
      ctx.fillRect(x - 1, -1, 3, 2);
    }
    ctx.restore();
    this.audioBar.setTexture(new CanvasTexture(canvas), true);
  }
  audioTrack: Mesh<BoxGeometry, MeshBasicMaterial>;
  obj = new Object3D();
  constructor(renin: Renin) {
    this.renin = renin;
    this.audioBar = new UIBox({ shadowSize: 8, shadowOpacity: 0.16 });
    this.audioBar.setSize(1, barHeight);
    this.obj.add(this.audioBar.object3d);
    this.audioTrack = new Mesh(
      new BoxGeometry(),
      new MeshBasicMaterial({
        map: new CanvasTexture(gradientCanvas),
        color: colors.green._500,
      })
    );
    if (this.audioTrack.material.map) {
      this.audioTrack.material.map.needsUpdate = true;
      this.audioTrack.material.needsUpdate = true;
      this.audioTrack.material.transparent = true;
      this.audioTrack.material.opacity = 0.5;
      this.audioTrack.material.map.repeat.set(-1, 1);
      this.audioTrack.material.map.wrapS = RepeatWrapping;
    }
    const line = new Mesh(new BoxGeometry(), new MeshBasicMaterial({ color: colors.green._500 }));
    line.position.x = 0.5;
    line.scale.x = 2 / glowSize;
    this.audioTrack.add(line);
    this.cuePoints = [
      new Mesh(
        new BoxGeometry(),
        new MeshBasicMaterial({
          color: colors.orange._500,
        })
      ),
      new Mesh(
        new BoxGeometry(),
        new MeshBasicMaterial({
          color: colors.orange._300,
        })
      ),
    ];
    this.audioTrack.scale.set(glowSize, barHeight, 1);
    this.cuePoints[0].scale.set(2, barHeight, 1);
    this.cuePoints[1].scale.set(2, barHeight, 1);
    this.obj.add(this.audioTrack);
    this.obj.add(this.cuePoints[0]);
    this.obj.add(this.cuePoints[1]);
  }
}
