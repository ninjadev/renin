import { clamp, easeOut } from '../interpolations.mjs';

class UIAnimation {
    startTime = 0;
    endTime = 0;
    startValue = 0;
    endValue = 0;
    value = 0;
    transition(targetValue, duration, currentTime) {
        this.startTime = currentTime;
        this.endTime = currentTime + duration;
        this.startValue = this.value;
        this.endValue = targetValue;
    }
    update(time) {
        const oldValue = this.value;
        const t = clamp(0, (time - this.startTime) / (this.endTime - this.startTime), 1);
        this.value = easeOut(this.startValue, this.endValue, t);
        return oldValue !== this.value;
    }
}

export { UIAnimation };
