class Sync {
    step = 0;
    beat = false;
    framesPerSubdivision;
    music;
    constructor(music) {
        const stepsPerMinute = music.bpm * music.subdivision;
        const stepsPerSecond = stepsPerMinute / 60;
        const framesPerSecond = 60;
        this.framesPerSubdivision = framesPerSecond / stepsPerSecond;
        this.music = music;
    }
    flash(frame, stepStride, stepOffset = 0) {
        const step = this.stepForFrame(frame);
        const startStep = (((step - stepOffset) / stepStride) | 0) * stepStride;
        const startFrame = this.frameForStep(startStep);
        const endFrame = this.frameForStep(startStep + stepStride);
        return (frame - startFrame) / (endFrame - startFrame);
    }
    stepForFrame(frame) {
        return ((frame + 1.5) / this.framesPerSubdivision) | 0;
    }
    frameForStep(step) {
        return (step * this.framesPerSubdivision - 0.5) | 0;
    }
    update(frame) {
        this.beat = false;
        const n = ((frame + 1.5) / this.framesPerSubdivision) | 0;
        const m = ((frame + 0.5) / this.framesPerSubdivision) | 0;
        if (n > m) {
            this.beat = true;
        }
        this.step = ((frame + 1.5) / this.framesPerSubdivision) | 0;
    }
}

export { Sync };
