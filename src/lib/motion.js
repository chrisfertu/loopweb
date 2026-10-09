// The visitor's "Pause motion" choice (header toggle). Persisted in
// localStorage when available; the geometry field and every video listen.

import { setMotionPaused } from '../geometry/registry';

const KEY = 'loop.motionPaused';
const listeners = new Set();

let paused = (() => {
  try {
    return window.localStorage.getItem(KEY) === '1';
  } catch {
    return false;
  }
})();

setMotionPaused(paused);

export function isMotionPaused() {
  return paused;
}

export function setMotionPausedPref(next) {
  paused = !!next;
  try {
    window.localStorage.setItem(KEY, paused ? '1' : '0');
  } catch {
    // Private mode or blocked storage: the choice lasts for this page only.
  }
  setMotionPaused(paused);
  listeners.forEach((fn) => fn(paused));
}

export function subscribeMotion(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
