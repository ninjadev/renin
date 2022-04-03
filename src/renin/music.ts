export class Music {
  audioContext: AudioContext | null = null;
  volumeNode: GainNode | null = null;
  currentLocalTime: number = 0;
  globalTimeOffset: number = 0;
  playbackRate: number = 1;
  paused = true;
  buffer: AudioBuffer | null = null;
  loaded = false;
  bufferSource: AudioBufferSourceNode | null = null;
  audioContextPromise: Promise<AudioContext>;
  audioContextPromiseResolve: ((context: AudioContext) => void) | null = null;

  constructor() {
    this.audioContextPromise = new Promise((resolve) => {
      this.audioContextPromiseResolve = resolve;
    });
  }

  initAudioContext() {
    if (!this.audioContext) {
      this.audioContext = new AudioContext();
      this.volumeNode = this.audioContext.createGain();
      this.volumeNode.gain.value = 1;
      this.volumeNode.connect(this.audioContext.destination);
      this.audioContextPromiseResolve!(this.audioContext);
    }
  }

  setBuffer(buffer: AudioBuffer) {
    this.buffer = buffer;
    this.loaded = true;
  }

  setCurrentTime(currentTime: number) {
    this.currentLocalTime = currentTime;
    if (!this.paused) {
      this.play();
    }
  }

  setPlaybackRate(playbackRate: number) {
    const shouldPlay = !this.paused;
    this.pause();
    this.playbackRate = playbackRate;
    if (shouldPlay) {
      this.play();
    }
  }

  getCurrentTime() {
    const context = this.audioContext;
    if (context === null) {
      return 0;
    }
    let currentTime = this.currentLocalTime;
    if (!this.paused) {
      currentTime = this.currentLocalTime + (context.currentTime - this.globalTimeOffset) * this.playbackRate;
    }
    currentTime = Math.min(currentTime, this.getDuration());
    return currentTime;
  }

  setVolume(value: number) {
    if (this.volumeNode) {
      this.volumeNode.gain.value = value;
    }
  }

  getVolume() {
    return this.volumeNode?.gain.value ?? 0;
  }

  play() {
    if (!this.loaded) {
      return;
    }

    if (!this.audioContext) {
      return;
    }

    if (!this.volumeNode) {
      return;
    }

    this.globalTimeOffset = this.audioContext.currentTime;
    if (!this.paused) {
      this.bufferSource?.stop(0);
      this.bufferSource?.disconnect(this.volumeNode);
    }

    this.paused = false;
    this.bufferSource = this.audioContext.createBufferSource();
    this.bufferSource.buffer = this.buffer;
    this.bufferSource.connect(this.volumeNode);
    this.bufferSource.playbackRate.value = this.playbackRate;
    this.bufferSource.start(0, this.currentLocalTime);
  }

  getDuration() {
    return this.buffer?.duration ?? 0;
  }

  pause() {
    this.setCurrentTime(this.getCurrentTime());
    this.paused = true;
    this.bufferSource?.stop(0);
    if (this.volumeNode) {
      this.bufferSource?.disconnect(this.volumeNode);
    }
  }
}
