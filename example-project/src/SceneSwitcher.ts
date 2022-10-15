import {
  BoxGeometry,
  Mesh,
  MeshBasicMaterial,
  OrthographicCamera,
  Scene,
  WebGLRenderer,
  WebGLRenderTarget,
} from 'three';
import { SpinningDonut } from './SpinningDonut';
import { JumpingBox } from './JumpingBox';
import { ReninNode } from 'renin/lib/ReninNode';
import { Renin } from 'renin/lib/renin';
import { children } from 'renin/lib/utils';
import { FlatLand } from './FlatLand';

export class SceneSwitcher extends ReninNode {
  scene = new Scene();
  camera = new OrthographicCamera(-1, 1, 1, -1);
  renderTarget = new WebGLRenderTarget(640, 360);
  screen = new Mesh(new BoxGeometry(2, 2, 2), new MeshBasicMaterial());
  public resize(width: number, height: number) {
    this.renderTarget.setSize(width, height);
  }

  constructor(renin: Renin) {
    super(renin);

    this.children = children<{
      spinningcube: SpinningDonut;
      flatland: FlatLand;
      jumpingbox: JumpingBox;
    }>({
      spinningcube: new SpinningDonut(renin),
      flatland: new FlatLand(renin),
      jumpingbox: new JumpingBox(renin),
    });
    this.scene.add(this.screen);
    this.scene.add(this.camera);
    this.camera.position.z = 10;
  }

  public render(frame: number, renderer: WebGLRenderer) {
    this.screen.material.map = null;
    if (this.children?.jumpingbox.isActive) {
      //@ts-ignore
      this.screen.material.map = this.children.jumpingbox.renderTarget.texture;
    }
    if (this.children?.flatland.isActive) {
      //@ts-ignore
      this.screen.material.map = this.children.flatland.texture;
    }
    if (this.children?.spinningcube.isActive) {
      this.screen.material.map =
        //@ts-ignore
        this.children.spinningcube.renderTarget.texture;
    }
    this.screen.material.needsUpdate = true;
    renderer.setRenderTarget(this.renderTarget);
    renderer.render(this.scene, this.camera);
  }
}
