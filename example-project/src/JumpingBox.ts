import { defaultVertexShader, Renin } from 'renin/lib/renin';
import { ReninNode } from 'renin/lib/ReninNode';
import {
  AmbientLight,
  BoxGeometry,
  DirectionalLight,
  Mesh,
  PerspectiveCamera,
  RawShaderMaterial,
  Scene,
  ShaderMaterial,
  WebGLRenderer,
  WebGLRenderTarget,
} from 'three';
import plasma from './plasma.glsl';

export class JumpingBox extends ReninNode {
  scene = new Scene();
  camera = new PerspectiveCamera();
  renderTarget = new WebGLRenderTarget(640, 360);
  cube: Mesh<BoxGeometry, RawShaderMaterial>;

  constructor() {
    super();
    this.cube = new Mesh(
      new BoxGeometry(),
      new ShaderMaterial({
        uniforms: {
          time: { value: 0 },
        },
        fragmentShader: plasma,
        vertexShader: defaultVertexShader,
      })
    );
    this.scene.add(this.cube);
    this.scene.add(new AmbientLight(0.5));
    const dl = new DirectionalLight('red');
    dl.position.set(1, 1, 1);
    this.scene.add(dl);

    this.scene.add(this.camera);
    this.camera.position.z = 10;
    this.camera.fov = 22;
    this.camera.aspect = 16 / 9;
    this.camera.updateProjectionMatrix();
  }

  public resize(width: number, height: number) {
    this.renderTarget.setSize(width, height);
  }

  public render(frame: number, renderer: WebGLRenderer, renin: Renin) {
    this.cube.position.x = 2;
    this.cube.position.y = Math.sin(frame * 0.1) * 2;
    this.cube.scale.x = 2 - renin.sync.flash(frame, 24) ** 0.5;

    this.cube.material.uniforms.time.value = frame / 60;
    renderer.setRenderTarget(this.renderTarget);
    renderer.render(this.scene, this.camera);
  }
}
