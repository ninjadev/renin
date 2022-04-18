import { defaultVertexShader, Renin } from 'renin/lib/renin';
import { ReninNode } from 'renin/lib/ReninNode';
import { children } from 'renin/lib/utils';
import { BoxGeometry, Mesh, OrthographicCamera, Scene, ShaderMaterial, WebGLRenderer } from 'three';
import { SceneSwitcher } from './SceneSwitcher';
import postfxFragmentShader from './postfx.glsl';

export class PostFx extends ReninNode {
  scene = new Scene();
  camera = new OrthographicCamera(-1, 1, 1, -1);
  screen = new Mesh(
    new BoxGeometry(2, 2, 2),
    new ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        tDiffuse: { value: null },
      },
      fragmentShader: postfxFragmentShader,
      vertexShader: defaultVertexShader,
    })
  );

  children = children<{
    switcher: SceneSwitcher;
  }>({
    switcher: SceneSwitcher,
  });

  constructor() {
    super();
    this.scene.add(this.screen);
    this.scene.add(this.camera);
    this.camera.position.z = 10;
  }

  public render(frame: number, renderer: WebGLRenderer, _renin: Renin) {
    this.screen.material.uniforms.time.value = frame / 60;
    this.screen.material.uniforms.tDiffuse.value = this.children.switcher.renderTarget.texture;
    this.screen.material.needsUpdate = true;
    renderer.render(this.scene, this.camera);
  }
}
