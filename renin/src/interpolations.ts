export function lerp(a: number, b: number, t: number) {
  t = clamp(0, t, 1);
  return b * t + a * (1 - t);
}

export function clamp(a: number, v: number, b: number) {
  return Math.min(b, Math.max(v, a));
}

export function smoothstep(a: number, b: number, t: number) {
  t = clamp(0, t, 1);
  var v = t * t * t * (t * (t * 6.0 - 15.0) + 10.0);
  return b * v + a * (1 - v);
}

export function easeIn(a: number, b: number, t: number) {
  return lerp(a, b, t * t * t);
}

export function easeOut(a: number, b: number, t: number) {
  t = --t * t * t + 1;
  return lerp(a, b, t);
}

export function elasticOut(b: number, c: number, d: number, t: number) {
  t = clamp(0, t, 1);
  const ts = (t /= d) * t;
  const tc = ts * t;
  return b + c * (33 * tc * ts + -106 * ts * ts + 126 * tc + -67 * ts + 15 * t);
}

/**
 * Transition from 0 to 1 from a specific startFrame for duration duration.
 * @param frame The current frame
 * @param duration How many frames the transition takes
 * @param startFrame  What frame to start the transition at
 * @returns value in [0, 1) representing the progression into the interval.
 */
export function transitionFromFrame(frame: number, duration: number, startFrame: number) {
  return lerp(0, 1, (frame - startFrame) / duration);
}
