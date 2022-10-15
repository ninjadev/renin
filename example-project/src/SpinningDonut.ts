import { ReninNode } from 'renin/lib/ReninNode';
import envMap from './envMap.jpg';
import {
  BufferGeometry,
  EquirectangularReflectionMapping,
  FloatType,
  LinearEncoding,
  Mesh,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  PerspectiveCamera,
  Scene,
  sRGBEncoding,
  TextureLoader,
  TorusBufferGeometry,
  WebGLRenderer,
  WebGLRenderTarget,
} from 'three';
import { Renin } from 'renin/lib/renin';

export class SpinningDonut extends ReninNode {
  /* The frame range this node will be active. */
  startFrame = 6000;

  /* Some basic setup for a 3D scene. */
  scene = new Scene();
  camera = new PerspectiveCamera();
  cube: Mesh<BufferGeometry, MeshStandardMaterial>;

  /* The renderTarget for this node. */
  renderTarget = new WebGLRenderTarget(640, 360, {
    type: FloatType,
  });

  /* In the constructor we set up our scene. */
  constructor(renin: Renin) {
    super(renin);

    /* Here load an image that we will use as an envMap. In renin,
     * we can load images by just using THREE's built-in TextureLoader
     * (or any other strategy). There is no bespoke asset loading pipeline
     * in renin yet. */
    const loader = new TextureLoader();
    const envMapTexture = loader.load(envMap);
    envMapTexture.mapping = EquirectangularReflectionMapping;
    envMapTexture.encoding = sRGBEncoding;

    this.cube = new Mesh(
      new TorusBufferGeometry(2, 1, 64, 64),
      new MeshPhysicalMaterial({
        clearcoat: 1,
        envMap: envMapTexture,
      })
    );
    this.scene.background = envMapTexture;
    this.scene.add(this.cube);
    this.camera.position.z = -10;
    this.camera.fov = 75;
    this.camera.aspect = 16 / 9;
    this.camera.updateProjectionMatrix();
  }

  /* When the window resizes, we must take care to resize
   * any assets or resources that depend on the screen size. */
  public resize(width: number, height: number) {
    this.renderTarget.setSize(width, height);
  }

  public render(frame: number, renderer: WebGLRenderer) {
    /* Since these animation updates are not stateful, we do
     * them "on-demand" in the render method. If they were stateful,
     * (e.g. have something like this.variable++, or this.physics.update()
     * or similar), it would have to belong in the update method, that
     * guarantees that it will be called exactly 60 times per second. */
    this.camera.position.x = 10 * Math.sin(frame * 0.001);
    this.camera.position.z = 10 * Math.cos(frame * 0.001);
    this.camera.lookAt(this.cube.position);
    this.cube.rotation.x = frame * 0.01;
    this.cube.rotation.y = frame * 0.02;

    /* At the end of our render implementation, we finally render
     * to the renderTarget, making the output available to the parent node. */

    renderer.setRenderTarget(this.renderTarget);
    renderer.outputEncoding = LinearEncoding;
    renderer.render(this.scene, this.camera);
  }
}
