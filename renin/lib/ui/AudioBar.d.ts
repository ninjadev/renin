import { Mesh, BoxGeometry, MeshBasicMaterial, Object3D, ShaderMaterial } from 'three';
import { Music } from '../music';
import { Options, Renin } from '../renin';
import { UIBox } from './UIBox';
export declare const barHeight = 48;
export declare class AudioBar {
    music: Music | null;
    width: number;
    nodeContainer: Object3D<import("three").Event>;
    cuePoints: Mesh[];
    renin: Renin;
    audioBar: UIBox<ShaderMaterial>;
    zoomStartFrame: number;
    zoomEndFrame: number;
    zoomAmount: number;
    getClickedFrame(xInPercent: number): number;
    zoom(delta: number): void;
    pan(delta: number): void;
    render(renin: Renin, cuePoints: number[]): void;
    resize(width: number, height: number): void;
    setMusic(music: Music, buffer: AudioBuffer, options: Options['music']): void;
    audioTrack: Mesh<BoxGeometry, MeshBasicMaterial>;
    obj: Object3D<import("three").Event>;
    constructor(renin: Renin);
}
