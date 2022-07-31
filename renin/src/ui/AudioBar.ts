import {
  Mesh,
  BoxGeometry,
  MeshBasicMaterial,
  Object3D,
  CanvasTexture,
  Texture,
  RepeatWrapping,
  ShaderMaterial,
  BoxBufferGeometry,
} from 'three';
import { colors } from './colors';
import { Music } from '../music';
import { defaultVertexShader, Options, Renin } from '../renin';
import { ReninNode } from '../ReninNode';
import { makeRoundedRectangleBufferGeometry, UIBox } from './UIBox';
import { getWindowHeight, gradientCanvas } from '../utils';
import audioBarShader from './audioBarShader.glsl';
import { lerp } from '../interpolations';

export const barHeight = 48;
const boxHeight = 40;
const boxPadding = 8;
const glowSize = 12;

const boxBufferGeometry = new BoxBufferGeometry();

const uiboxStore: { [key: string]: UIBox } = {};
const getUIBox = (name: string) => {
  if (name in uiboxStore) {
    return uiboxStore[name];
  }
  const box = new UIBox({ shadowSize: 8, shadowOpacity: 0.06 });
  uiboxStore[name] = box;
  box.setTexture(getNodeTexture(name));
  return box;
};

const fallbackTexture = new Texture();
const store: { [key: string]: Texture } = {};
const getNodeTexture = (name: string) => {
  if (name in store) {
    return store[name];
  } else {
    const canvas = document.createElement('canvas');
    canvas.width = 1024 * window.devicePixelRatio;
    canvas.height = boxHeight * window.devicePixelRatio;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return fallbackTexture;
    }
    ctx.fillStyle = colors.slate._500;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    ctx.fillStyle = colors.slate._300;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    ctx.font = '16px Barlow';
    ctx.fillText(name, 16, boxHeight / 2);
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
  audioBar: UIBox<ShaderMaterial>;
  zoomStartFrame: number = 0;
  zoomEndFrame: number = 0;
  zoomAmount: number = 1;

  getClickedFrame(xInPercent: number): number {
    if (!this.music) {
      return 0;
    }
    return lerp(this.zoomStartFrame, this.zoomEndFrame, xInPercent);
  }

  zoom(delta: number) {
    if (!this.music) {
      return;
    }
    this.zoomAmount = Math.max(1, this.zoomAmount * delta);
    const maxFrame = (this.music.getDuration() * 60) | 0;
    if (this.zoomAmount === 1) {
      this.zoomStartFrame = 0;
      this.zoomEndFrame = maxFrame;
      return;
    }
    const currentFrame = this.renin.frame;
    const currentFramePercentage = (currentFrame - this.zoomStartFrame) / (this.zoomEndFrame - this.zoomStartFrame);
    const newFrameWidth = maxFrame / this.zoomAmount;
    this.zoomStartFrame = currentFrame - currentFramePercentage * newFrameWidth;
    this.zoomEndFrame = currentFrame + (1 - currentFramePercentage) * newFrameWidth;
  }

  pan(delta: number) {
    this.zoomStartFrame += delta * this.zoomAmount * 100;
    this.zoomEndFrame += delta * this.zoomAmount * 100;
  }

  render(renin: Renin, cuePoints: number[]) {
    if (!this.music) {
      return;
    }

    /* First, we make the obj the correct scale. */
    const maxFrame = (this.music.getDuration() * 60) | 0;
    const scale = (this.zoomEndFrame - this.zoomStartFrame) / maxFrame;
    this.obj.scale.x = 1 / scale;
    this.audioTrack.scale.x = scale * 16;
    this.cuePoints[0].scale.x = scale * 2;
    this.cuePoints[1].scale.x = scale * 2;

    this.audioBar.getMaterial().uniforms.width.value = this.width / scale;

    /* Then we move things into the right place */
    const center = (-0.5 + (this.zoomEndFrame + this.zoomStartFrame) / maxFrame / 2) * (this.width - 32);
    this.obj.position.x = -center / scale;

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
    this.audioTrack.position.x = 16 + audioProgress * (this.width - 32) - this.width / 2 - (glowSize / 2) * scale;

    for (const child of this.nodeContainer.children) {
      this.nodeContainer.remove(child);
    }
    this.obj.add(this.nodeContainer);
    let deepestDepth = 0;
    let index = 0;
    const recurse = (node: ReninNode, depth = 0, startFrameBound: number, endFrameBound: number) => {
      const thisIndex = index++;
      const startFrame = Math.max(node.startFrame, startFrameBound);
      const endFrame = Math.min(node.endFrame === -1 ? endFrameBound : node.endFrame, endFrameBound);
      deepestDepth = Math.max(depth, deepestDepth);
      if ('children' in node && node.children) {
        let i = 0;
        for (const child of Object.values(node.children)) {
          recurse(child, depth + ++i, startFrame, endFrame);
        }
      }
      const box = getUIBox(node.constructor.name);
      const size = (endFrame - startFrame) / 60 / renin.music.getDuration();
      box.setSize(size * (this.width - 32), boxHeight);
      box.object3d.position.x =
        (startFrame / 60 / renin.music.getDuration()) * (this.width - 32) -
        (this.width - 32) / 2 +
        box.object3d.scale.x / 2;
      box.object3d.position.z = 2;
      box.object3d.position.y = (boxHeight + boxPadding) * thisIndex;
      const windowSizeIndependentMagicScaleNumber = ((this.width - 32) / 1024) * this.zoomAmount;
      box.getMaterial().map!.repeat.set(windowSizeIndependentMagicScaleNumber * size, 1);
      this.nodeContainer.add(box.object3d);

      if ((node as any).renderTarget || (node as any).screen) {
        const renderTarget = (node as any).renderTarget || this.renin.screenRenderTarget;
        const width = ((boxHeight / 9) * 16) / this.zoomAmount;
        const height = boxHeight;
        const preview = new Mesh(
          makeRoundedRectangleBufferGeometry(1, 1, 4 / width, 4 / height, 32),
          new MeshBasicMaterial({ map: renderTarget.texture })
        );
        preview.position.z = 5;
        preview.position.x = box.object3d.position.x + box.object3d.scale.x / 2 - width / 2;
        preview.position.y = box.object3d.position.y;
        preview.scale.x = width;
        preview.scale.y = height;
        this.nodeContainer.add(preview);
      }
    };
    recurse(
      renin.root,
      0,
      renin.root.startFrame,
      renin.root.endFrame === -1 ? renin.music.getDuration() * 60 : renin.root.endFrame
    );
    const trackHeight = barHeight + (index + 1) * (boxHeight + boxPadding) + boxPadding;
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
    this.audioBar.getMaterial().uniforms.width.value = width;
    this.audioBar.getMaterial().uniforms.height.value = barHeight;
    this.audioBar.object3d.position.y = -height / 2 + barHeight / 2 + 16;
    this.audioTrack.position.y = -height / 2 + barHeight / 2 + 16;
    this.cuePoints[0].position.y = -height / 2 + barHeight / 2 + 16;
    this.cuePoints[1].position.y = -height / 2 + barHeight / 2 + 16;
    this.nodeContainer.position.y = -height / 2 + barHeight + boxHeight + boxPadding;
    this.zoom(1);
  }
  setMusic(music: Music, buffer: AudioBuffer, options: Options['music']) {
    this.music = music;

    const audioData = buffer.getChannelData(0);
    const beats = ((options.bpm / 60) * audioData.length) / music.audioContext.sampleRate;
    const bucketCount = beats;
    const bucketWidth = audioData.length / bucketCount;
    const beatBins = [];
    for (let i = 0; i < bucketCount; i++) {
      const group = [];
      for (let j = 0; j < bucketWidth; j++) {
        const sample = audioData[(i * bucketWidth + j) | 0];
        group.push(Math.abs(sample));
      }
      const s = (group.reduce((a, b) => a + b, 0) / group.length) * 2;
      beatBins.push(s);
    }

    const audioBarShaderMaterial = this.audioBar.getMaterial();
    audioBarShaderMaterial.uniforms.beatBins.value = beatBins;
    audioBarShaderMaterial.uniforms.bpm.value = options.bpm;
    audioBarShaderMaterial.uniforms.beats.value = beats;
    audioBarShaderMaterial.uniforms.beatOffset.value = options.beatOffset;
    this.zoom(1);
  }
  audioTrack: Mesh<BoxGeometry, MeshBasicMaterial>;
  obj = new Object3D();
  constructor(renin: Renin) {
    this.renin = renin;
    this.audioBar = new UIBox<ShaderMaterial>({
      shadowSize: 8,
      shadowOpacity: 0.16,
      customMaterial: new ShaderMaterial({
        fragmentShader: audioBarShader,
        vertexShader: defaultVertexShader,
        uniforms: {
          width: { value: 0 },
          height: { value: 0 },
          shadowSize: { value: 0 },
          shadowOpacity: { value: 0 },
          beatBins: { value: [] },
          bpm: { value: 0 },
          beats: { value: 0 },
          beatOffset: { value: 0 },
        },
        transparent: true,
      }),
    });
    this.audioBar.setSize(1, barHeight);
    this.obj.add(this.audioBar.object3d);
    this.audioTrack = new Mesh(
      boxBufferGeometry,
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
    const line = new Mesh(boxBufferGeometry, new MeshBasicMaterial({ color: colors.green._500 }));
    line.position.x = 0.5;
    line.scale.x = 2 / glowSize;
    this.audioTrack.add(line);
    this.cuePoints = [
      new Mesh(
        boxBufferGeometry,
        new MeshBasicMaterial({
          color: colors.orange._500,
        })
      ),
      new Mesh(
        boxBufferGeometry,
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
