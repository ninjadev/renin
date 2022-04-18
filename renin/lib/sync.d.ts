import { Options } from "./renin";
export declare class Sync {
    step: number;
    beat: boolean;
    readonly framesPerSubdivision: number;
    music: {
        src: string;
        bpm: number;
        subdivision: number;
    };
    constructor(music: Options["music"]);
    flash(frame: number, stepStride: number, stepOffset?: number): number;
    stepForFrame(frame: number): number;
    frameForStep(step: number): number;
    update(frame: number): void;
}
