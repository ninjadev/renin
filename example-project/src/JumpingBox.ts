import { defaultVertexShader, Renin } from 'renin/lib/renin';
import { ReninNode } from 'renin/lib/ReninNode';
import { easeIn, easeOut } from 'renin/lib/interpolations';
import {
  AmbientLight,
  BackSide,
  BoxGeometry,
  Color,
  DirectionalLight,
  DoubleSide,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  RawShaderMaterial,
  Scene,
  ShaderMaterial,
  WebGLRenderer,
  WebGLRenderTarget,
} from 'three';
import plasma from './plasma.glsl';

export class JumpingBox extends ReninNode {
  startFrame = 0;
  endFrame = 3157;
  scene = new Scene();
  camera = new PerspectiveCamera();
  renderTarget = new WebGLRenderTarget(640, 360);
  cube: Mesh<BoxGeometry, RawShaderMaterial>;
  skybox: Mesh<BoxGeometry, RawShaderMaterial>;
  beam: Mesh<BoxGeometry, MeshBasicMaterial>;

  constructor() {
    super();
    this.cube = new Mesh(
      new BoxGeometry(),
      new ShaderMaterial({
        uniforms: {
          time: { value: 0 },
          color: { value: new Color(0) },
        },
        fragmentShader: plasma,
        vertexShader: defaultVertexShader,
        side: DoubleSide,
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

    this.skybox = new Mesh(new BoxGeometry(100, 100, 100), this.cube.material.clone());
    this.scene.add(this.skybox);
    this.cube.material.uniforms.color.value = new Color('#ddaa88');
    this.skybox.material.uniforms.color.value = new Color('#558899');

    this.beam = new Mesh(
      new BoxGeometry(2, 100, 1),
      new MeshBasicMaterial({ color: 0xffffaa, transparent: true, opacity: 0.5 })
    );
    this.scene.add(this.beam);
  }

  public resize(width: number, height: number) {
    this.renderTarget.setSize(width, height);
  }

  public render(frame: number, renderer: WebGLRenderer, renin: Renin) {
    let angle = ((frame * renin.sync.music.bpm) / 60 / 60) % 4;
    angle = (angle | 0) + easeIn(0, 1, angle % 1) ** 2;
    angle *= (Math.PI * 2) / 4;
    const radius = 1.5;
    this.cube.position.x = radius * Math.sin(angle);
    this.beam.position.x = radius * Math.sin(angle) * 1.5;
    this.beam.material.opacity = easeOut(1, 0.5, renin.sync.flash(frame, 12));
    this.beam.position.z = -5;
    this.cube.position.y = 0.5 * radius * Math.cos(angle);
    this.cube.rotation.z = angle;
    this.cube.rotation.y = frame * 0.05;

    const scale = easeOut(1.3, 1, renin.sync.flash(frame, 12));
    this.cube.scale.set(scale, scale, scale);

    this.cube.material.uniforms.time.value = frame / 60;
    this.skybox.material.uniforms.time.value = frame / 60;
    renderer.setRenderTarget(this.renderTarget);
    renderer.render(this.scene, this.camera);
  }
}
