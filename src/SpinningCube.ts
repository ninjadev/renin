import {
  AmbientLight,
  BoxGeometry,
  Color,
  DirectionalLight,
  Mesh,
  MeshStandardMaterial,
  PerspectiveCamera,
  Scene,
  WebGLRenderer,
  WebGLRenderTarget,
} from "three";
import { colors } from "./color";
import { renin, ReninNode } from "./renin";

export class SpinningCube implements ReninNode {
  id = "spinningcube";
  scene = new Scene();
  camera = new PerspectiveCamera();
  renderTarget = new WebGLRenderTarget(640, 360);
  cube = new Mesh(new BoxGeometry(), new MeshStandardMaterial());

  constructor() {
    this.scene.add(this.cube);
    this.scene.add(new AmbientLight(0.5));
    const dl = new DirectionalLight("red");
    dl.position.set(1, 1, 1);
    this.scene.add(dl);
    this.scene.add(this.camera);
    this.camera.position.z = 10;
    this.scene.background = new Color(colors.primary);
    this.camera.fov = 22;
    this.camera.aspect = 16 / 9;
    this.camera.updateProjectionMatrix();
  }

  public render(renderer: WebGLRenderer) {
    this.cube.rotation.x = renin.audio.currentTime;
    renderer.setRenderTarget(this.renderTarget);
    renderer.render(this.scene, this.camera);
  }
}
