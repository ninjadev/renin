import { Renin } from 'renin/lib/renin';
import { ReninNode } from 'renin/lib/ReninNode';
import { CanvasTexture, WebGLRenderer } from 'three';

export class FlatLand extends ReninNode {
  /* The frame range this node will be active. */
  startFrame = 3157;
  endFrame = 6000;

  /* The output texture for this node. */
  canvas = document.createElement('canvas');
  texture = new CanvasTexture(this.canvas);
  ctx = this.canvas.getContext('2d');

  /* When the window resizes, we must take care to resize
   * any assets or resources that depend on the screen size. */
  public resize(width: number, height: number) {
    this.canvas.width = width;
    this.canvas.height = height;
    console.log(width, height);
  }

  public render(frame: number, _renderer: WebGLRenderer, renin: Renin) {
    if (!this.ctx) {
      return;
    }
    const ctx = this.ctx;
    let GU = 1;
    if (this.canvas.width / this.canvas.height > 16 / 9) {
      GU = this.canvas.height / 9;
    } else {
      GU = this.canvas.width / 16;
    }
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.save();
    ctx.scale(GU, GU);
    ctx.fillStyle = 'red';
    ctx.fillRect(1, 1, 14, 7);
    ctx.fillStyle = 'orange';
    ctx.fillRect(2, 2, 12, 5);
    ctx.fillStyle = 'white';
    ctx.fillRect(4, 3.5 - Math.sin(frame * 0.1) * 0.5, 8, 2 + Math.sin(frame * 0.1));
    ctx.restore();

    this.texture.needsUpdate = true;
  }
}
