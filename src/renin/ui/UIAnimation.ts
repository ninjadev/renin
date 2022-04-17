import { clamp, easeOut } from '../interpolations';

export class UIAnimation {
  private startTime: number = 0;
  private endTime: number = 0;
  private startValue: number = 0;
  private endValue: number = 0;
  value: number = 0;

  transition(targetValue: number, duration: number, currentTime: number) {
    this.startTime = currentTime;
    this.endTime = currentTime + duration;
    this.startValue = this.value;
    this.endValue = targetValue;
  }

  update(time: number) {
    const oldValue = this.value;
    const t = clamp(0, (time - this.startTime) / (this.endTime - this.startTime), 1);
    this.value = easeOut(this.startValue, this.endValue, t);
    return oldValue !== this.value;
  }
}
