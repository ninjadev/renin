import { defaultVertexShader, Renin } from 'renin/lib/renin';
import { ReninNode } from 'renin/lib/ReninNode';
import { easeIn, easeOut } from 'renin/lib/interpolations';
import {
  BoxGeometry,
  Color,
  DoubleSide,
  FloatType,
  LinearEncoding,
  Mesh,
  MeshBasicMaterial,
  NoToneMapping,
  PerspectiveCamera,
  RawShaderMaterial,
  Scene,
  ShaderMaterial,
  WebGLRenderer,
  WebGLRenderTarget,
} from 'three';
import plasma from './plasma.glsl';

export class JumpingBox extends ReninNode {
  /* The frame range this node will be active. */
  startFrame = 0;
  endFrame = 3157;

  /* Some basic setup for a 3D scene. */
  scene = new Scene();
  camera = new PerspectiveCamera();
  cube: Mesh<BoxGeometry, RawShaderMaterial>;
  skybox: Mesh<BoxGeometry, RawShaderMaterial>;
  beam: Mesh<BoxGeometry, MeshBasicMaterial>;

  /* The renderTarget for this node. */
  renderTarget = new WebGLRenderTarget(640, 360, {
    type: FloatType,
  });

  /* In the constructor we set up our scene. */
  constructor(renin: Renin) {
    super(renin);
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

  /* When the window resizes, we must take care to resize
   * any assets or resources that depend on the screen size. */
  public resize(width: number, height: number) {
    this.renderTarget.setSize(width, height);
  }

  public render(frame: number, renderer: WebGLRenderer, renin: Renin) {
    /* Since these animation updates are not stateful, we do
     * them "on-demand" in the render method. If they were stateful,
     * (e.g. have something like this.variable++, or this.physics.update()
     * or similar), it would have to belong in the update method, that
     * guarantees that it will be called exactly 60 times per second. */

    /* Here, we access information about the bpm of the music,
     * and use our knowledge that the demo runs at 60 fps to
     * calculate an angle animation that is in sync with the music. */
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

    /* Utils from renin.sync contains several goodies to make
     * it easier to code synced animations. */
    const scale = easeOut(1.3, 1, renin.sync.flash(frame, 12));
    this.cube.scale.set(scale, scale, scale);

    this.cube.material.uniforms.time.value = frame / 60;
    this.skybox.material.uniforms.time.value = frame / 60;

    /* At the end of our render implementation, we finally render
     * to the renderTarget, making the output available to the parent node. */
    renderer.setRenderTarget(this.renderTarget);
    renderer.toneMapping = NoToneMapping;
    renderer.outputEncoding = LinearEncoding;
    renderer.render(this.scene, this.camera);
  }
}
