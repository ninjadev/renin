import { WebGLRenderer } from 'three';
import { Renin } from './renin';

/* The base class that all Nodes in the Renin graph must extend. */
export class ReninNode {
  /* The frame range this node will be active. */
  startFrame: number = 0;
  endFrame: number = -1;

  /* The children of this node. Children update and render before this
   * node, and this node will abe able to access public properties of
   * its children after the children have updated. */
  children?: { [key: string]: ReninNode };

  /* The unique node id of this node. */
  id: string;

  /* Subclasses can implement this if they need code to happen in the
   * update stage. Update is guaranteed to be called exactly 60 times
   * per second. */
  // @ts-ignore
  update(frame: number): void {}

  /* Subclasses can implement this if they need code to happen in the
   * render stage. Render tried to be called as often as needed, but has
   * no guarantees. If the computer is fast enough, render will
   * typically be called after each update. */
  // @ts-ignore
  render(frame: number, renderer: WebGLRenderer, renin: Renin): void {}

  /* Subclasses can implement this if they need to respond to resize events. */
  // @ts-ignore
  resize(width: number, height: number): void {}

  constructor() {
    this.id = this.constructor.name + '-' + ((1000000 * Math.random()) | 0);
    console.log('new', this.id);
  }

  /* The actual update function. Subclasses don't need to override this. */
  public _update(frame: number) {
    if (frame < this.startFrame || (frame >= this.endFrame && this.endFrame !== -1)) {
      return;
    }
    if ('children' in this) {
      for (const child of Object.values(this.children || {})) {
        child._update(frame);
      }
    }
    this.update(frame);
  }

  /* The actual render function. Subclasses don't need to override this,
   * unless they have complex rendering requirements. */
  public _render(frame: number, renderer: WebGLRenderer, renin: Renin) {
    if (frame < this.startFrame || (frame >= this.endFrame && this.endFrame !== -1)) {
      return;
    }
    if ('children' in this) {
      for (const child of Object.values(this.children || {})) {
        child._render(frame, renderer, renin);
      }
    }
    const oldRenderTarget = renderer.getRenderTarget();
    this.render(frame, renderer, renin);
    renderer.setRenderTarget(oldRenderTarget);
  }

  /* The actual resize function. Subclasses don't need to override this. */
  public _resize(width: number, height: number) {
    if ('children' in this) {
      for (const child of Object.values(this.children || {})) {
        child._resize(width, height);
      }
    }
    this.resize(width, height);
  }
}
