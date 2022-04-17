import {
  BoxBufferGeometry,
  BufferAttribute,
  BufferGeometry,
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

/* Adapted from https://discourse.threejs.org/t/roundedrectangle/28645 */
function makeRoundedRectangleBufferGeometry(
  width: number,
  height: number,
  radiusX: number,
  radiusY: number,
  smoothness: number
) {
  // helper const's
  const wi = width / 2 - radiusX; // inner width
  const hi = height / 2 - radiusY; // inner height
  const w2 = width / 2; // half width
  const h2 = height / 2; // half height
  const ul = radiusX / width; // u left
  const ur = (width - radiusX) / width; // u right
  const vl = radiusY / height; // v low
  const vh = (height - radiusY) / height; // v high

  let positions = [wi, hi, 0, -wi, hi, 0, -wi, -hi, 0, wi, -hi, 0];

  let uvs = [ur, vh, ul, vh, ul, vl, ur, vl];

  let n = [
    3 * (smoothness + 1) + 3,
    3 * (smoothness + 1) + 4,
    smoothness + 4,
    smoothness + 5,
    2 * (smoothness + 1) + 4,
    2,
    1,
    2 * (smoothness + 1) + 3,
    3,
    4 * (smoothness + 1) + 3,
    4,
    0,
  ];

  let indices = [
    n[0],
    n[1],
    n[2],
    n[0],
    n[2],
    n[3],
    n[4],
    n[5],
    n[6],
    n[4],
    n[6],
    n[7],
    n[8],
    n[9],
    n[10],
    n[8],
    n[10],
    n[11],
  ];

  let phi, cos, sin, xc, yc, uc, vc, idx;

  for (let i = 0; i < 4; i++) {
    xc = i < 1 || i > 2 ? wi : -wi;
    yc = i < 2 ? hi : -hi;

    uc = i < 1 || i > 2 ? ur : ul;
    vc = i < 2 ? vh : vl;

    for (let j = 0; j <= smoothness; j++) {
      phi = (Math.PI / 2) * (i + j / smoothness);
      cos = Math.cos(phi);
      sin = Math.sin(phi);

      positions.push(xc + radiusX * cos, yc + radiusY * sin, 0);

      uvs.push(uc + ul * cos, vc + vl * sin);

      if (j < smoothness) {
        idx = (smoothness + 1) * i + j + 4;
        indices.push(i, idx, idx + 1);
      }
    }
  }

  const geometry = new BufferGeometry();
  geometry.setIndex(new BufferAttribute(new Uint32Array(indices), 1));
  geometry.setAttribute('position', new BufferAttribute(new Float32Array(positions), 3));
  geometry.setAttribute('uv', new BufferAttribute(new Float32Array(uvs), 2));
  return geometry;
}

const geometry = new BoxBufferGeometry();

export class UIBox<MaterialType extends Material = MeshBasicMaterial> {
  object3d = new Object3D();
  private mesh: Mesh<BufferGeometry, MaterialType>;
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
    const radius = 4;
    this.mesh.geometry = makeRoundedRectangleBufferGeometry(1, 1, radius / width, radius / height, 4);
    this.mesh.position.z = 1;
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
