export declare class Music {
    audioContext: AudioContext;
    volumeNode: GainNode;
    currentLocalTime: number;
    globalTimeOffset: number;
    playbackRate: number;
    paused: boolean;
    buffer: AudioBuffer | null;
    loaded: boolean;
    bufferSource: AudioBufferSourceNode | null;
    constructor();
    setBuffer(buffer: AudioBuffer): void;
    setCurrentTime(currentTime: number): void;
    setPlaybackRate(playbackRate: number): void;
    getCurrentTime(): number;
    setVolume(value: number): void;
    getVolume(): number;
    play(): void;
    getDuration(): number;
    pause(): void;
}
