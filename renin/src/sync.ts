import { Options } from './renin';

export class Sync {
  step = 0;
  beat = false;
  readonly framesPerSubdivision: number;
  music: { src: string; bpm: number; subdivision: number; beatsPerBar: number };

  constructor(music: Options['music']) {
    const stepsPerMinute = music.bpm * music.subdivision;
    const stepsPerSecond = stepsPerMinute / 60;
    const framesPerSecond = 60;
    this.framesPerSubdivision = framesPerSecond / stepsPerSecond;
    this.music = music;
  }

  /**
   * Outputs a number between 0 and 1, signifying the progress between two "flashes", synced to the music.
   * "stepStride" denotes the number of steps (subdivisions of a beat) between each flash
   * "stepOffset" offsets the flashes from the start of a beat.
   */
  flash(frame: number, stepStride: number, stepOffset: number = 0) {
    const step = this.stepForFrame(frame);
    const startStep = (((step - stepOffset) / stepStride) | 0) * stepStride + stepOffset;
    const startFrame = this.frameForStep(startStep);
    const endFrame = this.frameForStep(startStep + stepStride);
    return (frame - startFrame) / (endFrame - startFrame);
  }

  stepForFrame(frame: number) {
    return ((frame + 1.5) / this.framesPerSubdivision) | 0;
  }

  frameForStep(step: number) {
    return (step * this.framesPerSubdivision - 0.5) | 0;
  }

  update(frame: number) {
    this.beat = false;
    const n = ((frame + 1.5) / this.framesPerSubdivision) | 0;
    const m = ((frame + 0.5) / this.framesPerSubdivision) | 0;
    if (n > m) {
      this.beat = true;
    }
    this.step = ((frame + 1.5) / this.framesPerSubdivision) | 0;
  }
}
