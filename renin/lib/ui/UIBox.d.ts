import { BufferGeometry, Material, MeshBasicMaterial, Object3D, Texture } from 'three';
interface UIBoxOptions<MaterialType> {
    shadowSize: number;
    shadowOpacity: number;
    customMaterial?: MaterialType;
}
export declare function makeRoundedRectangleBufferGeometry(width: number, height: number, radiusX: number, radiusY: number, smoothness: number): BufferGeometry;
export declare class UIBox<MaterialType extends Material = MeshBasicMaterial> {
    object3d: Object3D<import("three").Event>;
    private mesh;
    private shadow;
    options: UIBoxOptions<MaterialType>;
    constructor(options: Partial<UIBoxOptions<MaterialType>>);
    getMaterial(): MaterialType;
    setTexture(texture: Texture, needsUpdate?: boolean): void;
    setSize(width: number, height: number): void;
}
export {};
