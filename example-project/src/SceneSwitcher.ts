import { BoxGeometry, Mesh, OrthographicCamera, Scene, ShaderMaterial, WebGLRenderer, WebGLRenderTarget } from 'three';
import addFragmentShader from './add.glsl';
import { SpinningCube } from './SpinningCube';
import { JumpingBox } from './JumpingBox';
import { ReninNode } from 'renin/lib/ReninNode';
import { defaultVertexShader, Renin } from 'renin/lib/renin';
import { children } from 'renin/lib/utils';

export class SceneSwitcher extends ReninNode {
  scene = new Scene();
  camera = new OrthographicCamera(-1, 1, 1, -1);
  renderTarget = new WebGLRenderTarget(640, 360);
  screen = new Mesh(
    new BoxGeometry(2, 2, 2),
    new ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        tA: { value: null },
        tB: { value: null },
      },
      fragmentShader: addFragmentShader,
      vertexShader: defaultVertexShader,
    })
  );

  children = children<{
    spinningcube: SpinningCube;
    jumpingbox: JumpingBox;
  }>({
    spinningcube: SpinningCube,
    jumpingbox: JumpingBox,
  });
  public resize(width: number, height: number) {
    this.renderTarget.setSize(width, height);
  }

  constructor() {
    super();
    this.scene.add(this.screen);
    this.scene.add(this.camera);
    this.camera.position.z = 10;
  }

  public render(frame: number, renderer: WebGLRenderer, _renin: Renin) {
    this.screen.material.uniforms.time.value = frame / 60;
    this.screen.material.uniforms.tA.value = this.children.spinningcube.isActive
      ? this.children.spinningcube.renderTarget.texture
      : null;
    this.screen.material.uniforms.tB.value = this.children.jumpingbox.isActive
      ? this.children.jumpingbox.renderTarget.texture
      : null;
    this.screen.material.needsUpdate = true;
    renderer.setRenderTarget(this.renderTarget);
    renderer.render(this.scene, this.camera);
  }
}
