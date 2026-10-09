// A flowing spiral drawn in grains, as in the app's spiral background.
//
// Four logarithmic arms, r = inner · e^(b·φ), grains spaced evenly in log
// radius, every other arm fainter. The whole spiral turns clockwise once a
// minute while its grains drift outward along the arms. It comes up slowly
// out of a dark centre, is brightest at about three quarters of the radius,
// and from there loosens: its ends run on past the radius, scattering and
// fading to nothing.
//
// Like the clock, the figure is redrawn every frame (`writeSpiral` with the
// motion clock), and every grain belongs to LIVE_GROUP, so each one carries
// its own brightness.
//
// Units: plate units, radius 1 = half the anchor's shorter side.

import { LIVE_GROUP } from './clock';

const TAU = Math.PI * 2;

const ARMS = 4;
const INNER = 0.3;
const OUTER = 1.55;
const TURNS = -1.75; // counter-clockwise, from the middle outward
const TURN_SECONDS = 60; // one clockwise turn
const FLOW_SECONDS = 110; // a grain's journey from the middle to the edge
const SPREAD = 0.26; // how far the loosened ends scatter, in plate units
const QUIET_ARM = 0.5; // brightness of every other arm

// Deterministic 0..1 for grain i (stream k).
const noise = (i, k) => {
  const x = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453;
  return x - Math.floor(x);
};

const smooth = (x) => {
  const t = Math.min(1, Math.max(0, x));
  return t * t * (3 - 2 * t);
};

// Write `count` grains at `seconds` on the motion clock.
export function writeSpiral(pos, meta, count, seconds = 0) {
  const logRange = Math.log(OUTER / INNER);
  const spin = -(seconds / TURN_SECONDS) * TAU; // clockwise on screen
  const phase = seconds / FLOW_SECONDS;
  for (let i = 0; i < count; i++) {
    const arm = i % ARMS;
    let sigma = (i + noise(i, 3)) / count + phase;
    sigma -= Math.floor(sigma);
    const r = INNER * Math.exp(sigma * logRange);
    // Turning clockwise means the angle from 12 o'clock grows.
    const phi = (arm * TAU) / ARMS + sigma * TURNS * TAU - spin;
    // Out of the dark at the centre.
    const rise = smooth((sigma - 0.18) / 0.42);
    // Further out the arm loosens: its grains wander off the line and fade.
    const far = smooth((sigma - 0.62) / 0.38);
    const loose = far * far * SPREAD;
    pos[i * 3] = r * Math.sin(phi) + (noise(i, 4) - 0.5) * 2 * loose;
    pos[i * 3 + 1] = r * Math.cos(phi) + (noise(i, 5) - 0.5) * 2 * loose;
    pos[i * 3 + 2] = 0;
    meta[i * 2] = LIVE_GROUP;
    meta[i * 2 + 1] = rise * (1 - far * far) * (arm % 2 ? QUIET_ARM : 1);
  }
}
