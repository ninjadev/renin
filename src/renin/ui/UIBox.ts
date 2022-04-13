import {
  BoxBufferGeometry,
  Material,
  Mesh,
  MeshBasicMaterial,
  Object3D,
  RawShaderMaterial,
  ShaderMaterial,
  Texture,
} from 'three';
import { defaultVertexShader } from './../renin';
import shadowShader from './shadowShader.glsl';

interface UIBoxOptions<MaterialType> {
  shadowSize: number;
  shadowOpacity: number;
  customMaterial?: MaterialType;
}

const geometry = new BoxBufferGeometry();

export class UIBox<MaterialType extends Material = MeshBasicMaterial> {
  object3d = new Object3D();
  private mesh: Mesh<BoxBufferGeometry, MaterialType>;
  private shadow: Mesh<BoxBufferGeometry, RawShaderMaterial>;
  options: UIBoxOptions<MaterialType>;

  constructor(options: Partial<UIBoxOptions<MaterialType>>) {
    this.options = {
      shadowSize: options.shadowSize ?? 16,
      shadowOpacity: options.shadowOpacity ?? 0.25,
      //@ts-ignore
      customMaterial: options.customMaterial ?? new MeshBasicMaterial({}),
    };
    this.mesh = new Mesh(geometry, this.options.customMaterial);
    this.object3d.add(this.mesh);
    this.shadow = new Mesh(
      geometry,
      new ShaderMaterial({
        fragmentShader: shadowShader,
        vertexShader: defaultVertexShader,
        uniforms: {
          width: { value: 0 },
          height: { value: 0 },
          shadowSize: { value: 0 },
          shadowOpacity: { value: 0 },
        },
        transparent: true,
      })
    );
    this.object3d.add(this.shadow);
  }

  getMaterial() {
    return this.mesh.material;
  }

  setTexture(texture: Texture, needsUpdate: boolean = false) {
    //@ts-ignore
    this.mesh.material.map = texture;
    this.mesh.material.needsUpdate = needsUpdate;
  }

  setSize(width: number, height: number) {
    this.object3d.scale.x = width;
    this.object3d.scale.y = height;
    const size = this.options.shadowSize;
    this.shadow.scale.x = 1 + size / width;
    this.shadow.scale.y = 1 + size / height;
    this.shadow.position.y = -size / height / 8;
    this.shadow.position.z = -0.5;
    this.shadow.material.uniforms.width.value = width;
    this.shadow.material.uniforms.height.value = height;
    this.shadow.material.uniforms.shadowSize.value = size;
    this.shadow.material.uniforms.shadowOpacity.value = this.options.shadowOpacity;
  }
}
