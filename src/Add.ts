import { BoxGeometry, Mesh, OrthographicCamera, Scene, ShaderMaterial, WebGLRenderer } from 'three';
import { Renin, defaultVertexShader } from './renin/renin';
import addFragmentShader from './add.glsl';
import { SpinningCube } from './SpinningCube';
import { JumpingBox } from './JumpingBox';
import { ReninNode } from './renin/ReninNode';
import { children } from './renin/utils';

export class Add extends ReninNode {
  endFrame = 4000;
  scene = new Scene();
  camera = new OrthographicCamera(-1, 1, 1, -1);
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

  constructor() {
    super();
    this.scene.add(this.screen);
    this.scene.add(this.camera);
    this.camera.position.z = 10;
  }

  public render(frame: number, renderer: WebGLRenderer, _renin: Renin) {
    this.screen.material.uniforms.time.value = frame / 60;
    this.screen.material.uniforms.tA.value = this.children.spinningcube.renderTarget.texture;
    this.screen.material.uniforms.tB.value = this.children.jumpingbox.renderTarget.texture;
    this.screen.material.needsUpdate = true;
    renderer.render(this.scene, this.camera);
  }
}
