// Built-in sounds of the web player, in picker order. They mirror the iOS
// app: binaural beats at 2/6/10/16 Hz on a 216 Hz carrier, four noise colors
// and silence. Labels are the app's picker labels, verbatim.
//
// Shape: { type, label, subtitle, group, frequency? }
//   type: 'silence' | 'binaural' | 'white' | 'pink' | 'brown' | 'dark'
//   group: 'default' | 'binaural' | 'noise' (picker sections)
//   frequency: the binaural beat in Hz (binaural only)
// The object is passed as-is to useAudioEngine().play(sound).

export const SOUNDS = [
  { type: 'silence', label: 'Silence', subtitle: null, group: 'default' },
  { type: 'binaural', label: '2Hz - Sleep', subtitle: null, frequency: 2, group: 'binaural' },
  { type: 'binaural', label: '6Hz - Meditation', subtitle: null, frequency: 6, group: 'binaural' },
  { type: 'binaural', label: '10Hz - Relax', subtitle: null, frequency: 10, group: 'binaural' },
  { type: 'binaural', label: '16Hz - Focus', subtitle: null, frequency: 16, group: 'binaural' },
  { type: 'white', label: 'White Noise', subtitle: null, group: 'noise' },
  { type: 'pink', label: 'Pink Noise', subtitle: null, group: 'noise' },
  { type: 'brown', label: 'Brown Noise', subtitle: null, group: 'noise' },
  { type: 'dark', label: 'Dark Noise', subtitle: null, group: 'noise' },
];

export const DEFAULT_SOUND = SOUNDS[0]; // Silence
