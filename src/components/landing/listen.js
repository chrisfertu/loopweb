import { createContext, useContext } from 'react';

// Listen: the landing page's "hear it" buttons and its bells (spec 5.1).
// ListenProvider owns the audio; sections read it through
// useListen().

export const ListenContext = createContext(null);

// A stable key for a sound: 'binaural:6', 'noise:pink'.
export function soundKey(sound) {
  if (!sound) return null;
  if (typeof sound === 'string') return sound;
  if (sound.type === 'binaural') return `binaural:${sound.frequency}`;
  return `noise:${sound.type}`;
}

const noop = () => {};
const INERT = {
  available: false,
  playingKey: null,
  isPlaying: () => false,
  toggle: noop,
  start: noop,
  stop: noop,
  owner: null,
  ring: noop,
  ringingKey: null,
  hintSeen: true,
  sessionActive: false,
};

// { playingKey, isPlaying(keyOrSound), ... }. isPlaying accepts a key from
// soundKey() or the sound object itself. Sections use it to intensify their
// figure (listening(scene)) while a sound plays. ring(key, { file, label,
// owner }) plays a bell's recording and ringingKey is the bell that rings,
// or null.
// Outside a ListenProvider it returns an inert value (nothing ever plays).
export function useListen() {
  return useContext(ListenContext) || INERT;
}
