import {
  AmbientLight,
  BoxGeometry,
  Color,
  DirectionalLight,
  Mesh,
  MeshStandardMaterial,
  PerspectiveCamera,
  RawShaderMaterial,
  Scene,
  ShaderMaterial,
  Uniform,
  WebGLRenderer,
  WebGLRenderTarget,
} from "three";
import { colors } from "./color";
import { Renin, ReninNode, defaultVertexShader } from "./renin/renin";
import plasma from "./plasma.glsl";

export class SpinningCube implements ReninNode {
  scene = new Scene();
  camera = new PerspectiveCamera();
  renderTarget = new WebGLRenderTarget(640, 360);
  cube: Mesh<BoxGeometry, RawShaderMaterial>;

  constructor() {
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
    console.log(this.cube);
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

  public render(renderer: WebGLRenderer, renin: Renin) {
    this.cube.rotation.x = renin.music.audioElement.currentTime;
    this.cube.rotation.y = renin.music.audioElement.currentTime * 1.37;

    this.cube.material.uniforms.time.value =
      renin.music.audioElement.currentTime;
    renderer.setRenderTarget(this.renderTarget);
    renderer.render(this.scene, this.camera);
  }
}
