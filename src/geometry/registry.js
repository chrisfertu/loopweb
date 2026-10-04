// Scene registry for the geometry field.
//
// Sections register scenes (trigger element + config) and anchors here. This
// module is tiny and has no WebGL, so pages that only register scenes, strike
// the plate or pause motion do not pull the engine into the main bundle; the
// controller (field.js) and the renderer load lazily with the canvas.

const TAU = Math.PI * 2;

// A slow breath: about ten seconds per cycle.
export const BREATH = [0.015, TAU * 0.1];

export const SCENE_DEFAULTS = {
  shape: 'circle',
  anchor: null, // name of a registered anchor, or null for viewport placement
  scale: 1, // plate-unit multiplier (with an anchor), or fraction of min(w, h)/2
  dx: 0, // offset in plate units (with an anchor)
  dy: 0,
  offset: [0, 0], // figure centre in viewport NDC when there is no anchor
  rotation: 0, // radians, clockwise
  spin: 0, // radians per second, clockwise
  tilt: [0, 0], // x / y tilt for 3D forms, radians
  spin3: 0, // radians per second around the vertical axis
  breathe: BREATH, // [amplitude, radians per second]
  ripple: [0, 0, 0], // [amplitude, wavenumber, radians per second]
  wave: [0, 0, 0, 0], // [amplitude, k left, k right, radians per second]
  shimmer: [0, 0], // [amplitude, radians per second]
  wobble: [0, 0, 0, 0], // [amplitude, n-fold, radial k, radians per second]
  spectral: [0, 0], // [amplitude, radians per second] (noise clouds)
  heart: [0, 64], // [amplitude, beats per minute]
  dash: [0, 0], // [dashes along the group 2 stroke, radians per second (TAU = one dash a second)]
  preload: null, // shape keys this scene will switch to, built ahead during idle time
  colors: ['#64D262', '#14E468'],
  colorMode: 0, // 0 radial, 1 by stroke group, 2 along stroke
  groupScale: 0.5, // colour mode 1: group g takes colour mix clamp(g × groupScale)
  opacity: 0.6,
  size: 1,
  thickness: 0.006,
  glow: 0.08,
  reveal: 1, // 1, a number, 'intro' (appears once on load) or 'arrive' (each time the scene arrives)
  revealSets: 0, // n: the figure's groups 0..n-1 fade in whole, one after another, instead of being drawn on
  ether: [0.5, 0, 0, 0], // past [radius] the figure loosens: [, how far grains sit off their line, how far they drift out, journeys per second]
  farLight: 1, // brightness at the figure's edge, when it has an ether
  pace: 1, // how fast a live figure's own motion runs (the flowing spiral)
  bells: 3, // interval bells: how many on the session ('intervals')
  pulse: null, // the pulse figure's pace: { bpm (or [low, high]), amp, filling } ('pulse')
  morph: 1.6, // seconds for a change of shape within the scene
  select: -1, // group to light up: a device graph node, a noise cloud
  window: [0.9, 0.5], // the scene arrives when its trigger's top crosses the middle of this range (in viewport heights)
  strikeOnEnter: false, // ring the plate when this scene arrives (scrolling down)
  strikeEvery: 0, // seconds; rings periodically while this scene dominates
  sync: null, // scenes with the same key share angle and phases (one figure, several triggers)
  mobile: null, // partial overrides below 1024px (MOBILE_BREAKPOINT)
};

// ── Registry ───────────────────────────────────────────────

const scenes = new Map();
const anchors = new Map();
const listeners = new Set();
const pendingStrikes = [];
let nextId = 1;
let registryVersion = 0;
let motionPaused = false;

export function registerScene(el, config) {
  const id = nextId++;
  scenes.set(id, {
    id,
    el,
    config,
    resolved: null,
    target: null,
    cur: null,
    docTop: 0,
    angle: 0,
    angle3: 0,
    phase: { breathe: 0, ripple: 0, wave: 0, shimmer: 0, wobble: 0, spectral: 0, heart: 0, dash: 0, ether: 0, pace: 0 },
    shapeKey: config.shape || SCENE_DEFAULTS.shape,
    shapeFrom: null,
    fromSnap: null,
    shapeStart: 0,
    lastStrike: -1e9,
    transient: null,
    sel: -1,
    selAmt: 0,
    arrivedAt: null,
    live: null,
  });
  registryVersion++;
  return id;
}

export function updateScene(id, config) {
  const s = scenes.get(id);
  if (!s) return;
  s.config = config;
  s.resolved = null; // the shape is re-read (with mobile overrides) on the next frame
  registryVersion++;
}

export function unregisterScene(id) {
  scenes.delete(id);
  registryVersion++;
}

export function registerAnchor(name, el) {
  anchors.set(name, el);
  registryVersion++;
  return () => {
    if (anchors.get(name) === el) anchors.delete(name);
    registryVersion++;
  };
}

// Ring the field. With no coordinates it rings from the current figure's centre.
export function strike(amp = 1, clientX = null, clientY = null) {
  pendingStrikes.push({ amp, clientX, clientY });
}

export function setMotionPaused(paused) {
  motionPaused = paused;
  registryVersion++;
}

// Called with { id, type, index } when a live figure has something to say:
// the interval bells figure reports each bell it reaches ({ type: 'bell' }).
const events = new Set();

export function onFieldEvent(fn) {
  events.add(fn);
  return () => events.delete(fn);
}

export function emitEvent(event) {
  events.forEach((fn) => fn(event));
}

// Called with { sceneId, config } whenever the dominant scene changes.
export function onSceneChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

// Internal access for the controller in field.js.
export const registry = {
  scenes,
  anchors,
  listeners,
  pendingStrikes,
  version: () => registryVersion,
  paused: () => motionPaused,
};
