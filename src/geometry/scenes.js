// The score: every figure the field takes on the landing page, in order.
//
// Sections pass these configs to <SceneTrigger> / <PinnedStage>. Keep them
// module constants so React re-renders never re-target the field. Interactive
// sections (Listen, bell chips, device nodes) derive a modified copy with
// useMemo, and the field animates to it.
//
// Units: plate units, radius 1 = half the anchor's shorter side.
// Angles and speeds: radians and radians per second.


const TAU = Math.PI * 2;

// Palette (see design spec 1.2). Luminous greens are for geometry only.
export const TINT = {
  glow: '#64D262',
  core: '#14E468',
  paper: '#E8E6E1',
  accent: '#7A9B58',
  hz2: '#8FA8E8',
  hz6: '#9CC27A',
  hz10: '#8ECDF7',
  hz16: '#A98BFF',
  white: '#EEF1F3',
  pinkish: '#F2B6C8',
  brown: '#C08A5E',
  dark: '#6E7A70',
  teal: '#7FD8C8',
};

const still = [0, 0];

// How many times its anchor's radius the hero's mark reaches (desktop, phones).
export const HERO_SCALE = 1.9;
export const HERO_SCALE_MOBILE = 1.9;

// ── Hero and timer (the device column) ─────────────────────

// The app's mark, much larger than its anchor: it runs under the copy and
// past the edges of the screen. It appears on load from the centre out, one
// set of shapes after another (the play triangle, petals, brackets, chevrons,
// ring), each set fading in whole. From the brackets outward the mark
// loosens: grains sit off their lines, dim, and drift away.
export const HERO = {
  id: 'hero',
  shape: 'logo:1',
  anchor: 'device',
  scale: HERO_SCALE,
  mobile: { anchor: 'device-hero', scale: HERO_SCALE_MOBILE },
  reveal: 'intro',
  revealSets: 5,
  ether: [0.42, 0.05, 0.13, 0.05],
  farLight: 0.22,
  colors: [TINT.core, TINT.glow],
  opacity: 0.8,
  size: 1.2,
  glow: 0.05,
};

// A clock that starts counting when it lands (clock.js): the digits in the
// middle near white, the second marks in green.
export const TIMER = {
  id: 'timer',
  shape: 'clock',
  anchor: 'device',
  mobile: { anchor: 'device-timer' },
  breathe: still,
  colors: [TINT.paper, TINT.glow],
  opacity: 0.62,
  thickness: 0.004,
  glow: 0.07,
};

// ── Sound: silence, noise, binaural beats ──────────────────
// One square anchor ("sound"); the section shows the figure of the sound
// that is chosen: a horizon for silence, four clouds for the noises, two
// mandalas for binaural beats (one petal per hertz: 2, 6, 10, 16).
//
// The section is a screen tall with its figure in the middle, so on desktop
// its figures arrive late (the section's top a fifth of the way down the
// screen), when the figure's place is on screen. The your-sounds and bells
// sections are laid out the same way.
const LATE = { window: [0.3, 0.1], mobile: { window: [0.9, 0.5] } };

export const SOUND_SILENCE = {
  id: 'sound',
  ...LATE,
  shape: 'horizon:2.2',
  anchor: 'sound',
  breathe: still,
  colorMode: 1,
  groupScale: 1,
  colors: [TINT.paper, '#F4E7C9'],
  opacity: 0.5,
  glow: 0.02,
};

export const SOUND_NOISE = {
  id: 'sound',
  ...LATE,
  shape: 'noiseclouds:1',
  anchor: 'sound',
  breathe: still,
  spectral: [0.022, 1.7],
  listen: { spectral: [0.028, 2.2] },
  colorMode: 1,
  groupScale: 1 / 3,
  colors: [TINT.white, '#A98466'],
  opacity: 0.85,
  glow: 0.03,
};

// The clouds of the noiseclouds shape, in group order.
export const NOISE_CLOUDS = ['white', 'pink', 'brown', 'dark'];

// While one noise plays, its cloud lights up and moves more; the others dim
// and calm down (the shader's selection).
export function withCloud(scene, type) {
  const cloud = NOISE_CLOUDS.indexOf(type);
  return cloud < 0 ? scene : { ...listening(scene), select: cloud };
}

// While a beat plays (Listen), `listen` replaces its vibration layers. The
// petals ripple out from the centre, sooner for a faster beat; the tempo
// stays far below the beat itself (never a flicker).
const heard = (beat) => ({ ripple: [0.022, TAU * 1.5, TAU * (0.35 + beat * 0.1)] });

// A beat's mandala: one petal per hertz, wobbling gently with as many folds.
const tone = (beat, light, tint, glow) => ({
  id: 'sound',
  ...LATE,
  beat,
  anchor: 'sound',
  shape: `mandala:${beat}`,
  spin: TAU / 360,
  wobble: [0.01, beat, 1, TAU * (0.3 + beat * 0.04)],
  listen: { ...heard(beat), wobble: [0.025, beat, 1, TAU * (0.3 + beat * 0.04)] },
  colors: [light, tint],
  opacity: 0.6,
  glow,
});

export const SOUND_TONES = [
  tone(2, '#DCE5FF', TINT.hz2, 0.06),
  tone(6, '#C8E3B2', TINT.hz6, 0.07),
  tone(10, '#DDF0FD', TINT.hz10, 0.07),
  tone(16, '#E4DCFF', TINT.hz16, 0.08),
];

// ── Your sounds: a seed head ───────────────────────────────
// The shapes the seed head leaves empty, one after another: what a visitor
// might bring. Same order as CUTOUTS in cutouts.js (the list is repeated
// here so this module does not load the shape code).
export const SOUND_SHAPES = ['file', 'bird', 'handpan', 'music'];

// The seed head stands upright (no spin), so the empty shapes do too. Laid
// out like the sound section, so it arrives late too.
export const SOUNDS = {
  id: 'sounds',
  ...LATE,
  shape: 'phyllotaxis',
  anchor: 'sounds',
  // The rim of the seed head never quite settles: its grains keep leaving
  // outward and fading.
  ether: [0.7, 0.03, 0.24, 0.07],
  farLight: 0.45,
  colors: [TINT.glow, TINT.glow],
  opacity: 0.7,
  size: 1.35,
  glow: 0.08,
  morph: 2.4,
  preload: SOUND_SHAPES.map((_, i) => `cutout:${i}`),
};

// The seed head with one of SOUND_SHAPES left empty (any other name: whole).
export function withCutout(scene, name) {
  const index = SOUND_SHAPES.indexOf(name);
  return index < 0 ? scene : { ...scene, shape: `cutout:${index}` };
}

// While a scene's sound plays (Listen): its `listen` layers, and a little
// more glow.
export function listening(scene) {
  return { ...scene, ...scene.listen, glow: (scene.glow || 0.06) * 1.6 };
}

// ── Bells: a sit, and the bells that mark it ───────────────
// A session going round once, with its interval bells on it (intervals.js).
// The bell's own figure is not drawn.

export const BELLS = {
  id: 'bells',
  ...LATE,
  shape: 'intervals',
  bells: 3,
  anchor: 'bells',
  breathe: still,
  colors: [TINT.paper, TINT.glow],
  opacity: 0.62,
  glow: 0.05,
};

// A session with `n` interval bells on it.
export const withBells = (scene, n) => ({ ...scene, bells: n });

// ── Apple Watch: a heart, then the places a session shows ──

// The pulse (pulse.js). The section sets the pace (withPulse) as it moves
// between sitting, walking and dancing.
export const DEVICES_WATCH = {
  id: 'devices.watch',
  shape: 'pulse',
  anchor: 'devices',
  mobile: { anchor: 'devices-watch' },
  breathe: still,
  colorMode: 0,
  colors: [TINT.paper, TINT.glow],
  opacity: 0.6,
  glow: 0.06,
};

export const withPulse = (scene, pulse) => ({ ...scene, pulse });

// Where a session shows, as outlines, one after another: the Dynamic
// Island, the Lock Screen, Control Center, Siri, Shortcuts and the Apple
// Watch, in that order (the outlines are `surface:k`, k from this list).
const SURFACE_KINDS = [0, 1, 2, 4, 5, 3];
export const SURFACES = SURFACE_KINDS.length;

export const DEVICES_EVERYWHERE = {
  id: 'devices.everywhere',
  shape: 'surface:0',
  anchor: 'devices',
  mobile: { anchor: 'devices-everywhere' },
  breathe: still,
  colorMode: 1,
  groupScale: 1,
  colors: [TINT.paper, TINT.glow],
  opacity: 0.6,
  glow: 0.04,
  morph: 2.2,
  preload: SURFACE_KINDS.map((k) => `surface:${k}`),
};

// The i-th place in that order.
export const withSurface = (scene, i) => ({ ...scene, shape: `surface:${SURFACE_KINDS[i]}` });

// ── Presets: seven circles ─────────────────────────────────
// Circles of radius 0.5, so the centre one is half the anchor wide and the
// six around it have their centres on its rim. Turned 30 degrees. Each
// circle holds a preset's icon (the field draws its rim; presetSlot in
// nodes.js places the icon, and the section brings the icons in one by one).
export const PRESETS = {
  id: 'presets',
  shape: 'lattice:7,0.5,2,7',
  anchor: 'presets',
  rotation: TAU / 12,
  colorMode: 1,
  groupScale: 1 / 3,
  colors: [TINT.glow, TINT.paper],
  opacity: 0.5,
  glow: 0.06,
};

// ── Privacy, free, and the loop ────────────────────────────

// You, your device and a closed double wall; dotted lines come in from
// three sides, meet the wall and turn away. The dashes travel along the
// lines, in and then out.
export const PRIVACY = {
  id: 'privacy',
  shape: 'enclosure:0.8',
  anchor: 'privacy',
  dash: [11, TAU * 0.6],
  // Shorter legs on phones, where the figure reaches near the screen's edge.
  mobile: { shape: 'enclosure:0.42', dash: [5, TAU * 0.6] },
  colorMode: 1,
  groupScale: 0.5,
  colors: [TINT.paper, '#9CC27A'],
  opacity: 0.5,
  glow: 0.03,
};

export const FREE = {
  id: 'free',
  shape: 'logo',
  anchor: 'free',
  colors: [TINT.core, TINT.glow],
  opacity: 0.6,
  glow: 0.12,
};

// ── The web player ─────────────────────────────────────────
// The app's default background, the flowing spiral, behind the player. At
// rest it turns slowly and dimly; in a session it turns a little faster and
// brighter (withSession), as in the app.
export const PLAYER = {
  id: 'player',
  shape: 'flowspiral',
  anchor: 'player',
  pace: 0.7,
  breathe: still,
  colors: [TINT.paper, TINT.glow],
  opacity: 0.5,
  glow: 0.02,
};

export const withSession = (scene, running) => (running ? { ...scene, pace: 1.1, opacity: 0.64, glow: 0.035 } : scene);

