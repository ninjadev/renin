export declare class UIAnimation {
    private startTime;
    private endTime;
    private startValue;
    private endValue;
    value: number;
    transition(targetValue: number, duration: number, currentTime: number): void;
    update(time: number): boolean;
}
