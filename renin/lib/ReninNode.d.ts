import { WebGLRenderer } from 'three';
import { Renin } from './renin';
export declare class ReninNode {
    startFrame: number;
    endFrame: number;
    children?: {
        [key: string]: ReninNode;
    };
    id: string;
    update(frame: number): void;
    render(frame: number, renderer: WebGLRenderer, renin: Renin): void;
    resize(width: number, height: number): void;
    constructor();
    _update(frame: number): void;
    _render(frame: number, renderer: WebGLRenderer, renin: Renin): void;
    _resize(width: number, height: number): void;
}
