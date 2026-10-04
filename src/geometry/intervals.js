// The interval bells figure: a sit going round once, with its bells on it.
//
//   ring     the session, a circle drawn clockwise from 12 o'clock. What has
//            passed is lit; what is still to come is faint.
//   head     a bright point where the session is now, going round once in
//            SESSION seconds, then resting a moment on the full ring.
//   bells    up to MAX_BELLS small rings on the circle, spaced evenly from 12
//            o'clock (where the session starts and ends). When the head
//            reaches one, it rings: a ripple leaves it and fades.
//
// The number of bells comes from the scene (`bells`); when it changes, the
// rings slide to their new places. The figure is live (redrawn every frame by
// the field) and reports each bell it reaches, so a page can ring it too.
//
// Every grain belongs to LIVE_GROUP and carries its own brightness.
// Units: plate units, radius 1 = half the anchor's shorter side.

import { LIVE_GROUP } from './clock';

const TAU = Math.PI * 2;

export const MAX_BELLS = 6;

const R = 0.8; // the ring
const SESSION = 24; // seconds for the session to go round
const HOLD = 3; // seconds it rests, complete, before it starts again
const BELL_R = 0.05; // a bell's ring...
const START_R = 0.075; // ...and the one at 12 o'clock, where it starts and ends
const RIPPLE_SECONDS = 2.4;
const RIPPLE_REACH = 0.3; // how far a ripple spreads from its bell
const SLIDE = 3; // how quickly the bells move to new places (per second)
const FAINT = 0.18; // the part of the session still to come

const smooth = (x) => {
  const t = Math.min(1, Math.max(0, x));
  return t * t * (3 - 2 * t);
};

// Where each kind of grain sits in a body of `body` points.
export function layoutIntervals(body) {
  const head = Math.round(body * 0.04);
  const perBell = Math.floor((body * 0.14) / MAX_BELLS);
  const perRipple = Math.floor((body * 0.26) / MAX_BELLS);
  const bells = head;
  const ripples = bells + perBell * MAX_BELLS;
  const ring = ripples + perRipple * MAX_BELLS;
  return { body, head, perBell, perRipple, bells, ripples, ring, ringCount: body - ring };
}

// The figure's memory: where each bell is (an angle, easing toward its
// place), when each last rang, and the bells reached in this lap.
export const intervalsState = (bells = 3) => ({
  angles: Array.from({ length: MAX_BELLS }, (_, k) => (k < bells ? (k / bells) * TAU : 0)),
  rang: Array(MAX_BELLS).fill(-1e9),
  lap: -1,
  passed: 0,
});

// Write the figure at `elapsed` seconds; returns the bells reached since the
// last call (0 is the one at 12 o'clock).
export function writeIntervals(pos, meta, layout, elapsed, bells, state, dt = 0) {
  const { head, perBell, perRipple, bells: bellsAt, ripples, ring, ringCount } = layout;
  const n = Math.max(1, Math.min(MAX_BELLS, bells | 0));
  const put = (i, x, y, a) => {
    pos[i * 3] = x;
    pos[i * 3 + 1] = y;
    pos[i * 3 + 2] = 0;
    meta[i * 2] = LIVE_GROUP;
    meta[i * 2 + 1] = a;
  };
  const at = (a, r) => [r * Math.sin(a), r * Math.cos(a)];

  // Where the session is.
  const period = SESSION + HOLD;
  const lap = Math.floor(elapsed / period);
  const inLap = elapsed - lap * period;
  const done = Math.min(1, inLap / SESSION);
  const headAngle = done * TAU;
  // As a new lap begins, the lit ring fades back to faint.
  const restart = lap > 0 ? smooth(inLap / 0.8) : 1;

  // The bells: slide toward their places; ring when the head reaches them.
  const reached = [];
  if (lap !== state.lap) {
    state.lap = lap;
    state.passed = 0;
  }
  for (let k = 0; k < MAX_BELLS; k++) {
    const want = k < n ? (k / n) * TAU : state.angles[Math.max(0, n - 1)];
    state.angles[k] += (want - state.angles[k]) * (1 - Math.exp(-dt * SLIDE));
  }
  // Bell k rings when the head passes k / n of the way round; the one at
  // 12 o'clock rings at the start and again at the end.
  const due = done >= 1 ? n + 1 : Math.floor(done * n) + 1;
  while (state.passed < due) {
    const k = state.passed % n;
    reached.push(k);
    state.rang[k] = elapsed;
    state.passed += 1;
  }

  // Head
  const [hx, hy] = at(headAngle, R);
  for (let j = 0; j < head; j++) {
    const a = (j / head) * TAU * 7.3;
    const rr = 0.028 * Math.sqrt((j + 0.5) / head);
    put(j, hx + rr * Math.sin(a), hy + rr * Math.cos(a), done >= 1 ? 0.5 : 1);
  }

  // Bells and their ripples
  for (let k = 0; k < MAX_BELLS; k++) {
    const on = k < n ? 1 : 0;
    const [cx, cy] = at(state.angles[k], R);
    const since = elapsed - state.rang[k];
    const glow = on * (0.55 + 0.45 * Math.exp(-Math.max(0, since) * 1.4));
    const br = k === 0 ? START_R : BELL_R;
    for (let j = 0; j < perBell; j++) {
      const a = (j / perBell) * TAU;
      put(bellsAt + k * perBell + j, cx + br * Math.sin(a), cy + br * Math.cos(a), glow);
    }
    const t = since / RIPPLE_SECONDS;
    const live = on && t >= 0 && t < 1;
    const rr = br + RIPPLE_REACH * (1 - (1 - t) * (1 - t));
    const fade = live ? (1 - t) * (1 - t) * 1.3 : 0;
    for (let j = 0; j < perRipple; j++) {
      const a = (j / perRipple) * TAU;
      put(ripples + k * perRipple + j, cx + (live ? rr : br) * Math.sin(a), cy + (live ? rr : br) * Math.cos(a), fade);
    }
  }

  // The session's ring: lit behind the head, faint ahead of it.
  for (let j = 0; j < ringCount; j++) {
    const u = (j + 0.5) / ringCount;
    const a = u * TAU;
    const behind = smooth((headAngle - a) / 0.05 + 0.5);
    const lit = FAINT + (0.9 - FAINT) * behind * restart;
    const [x, y] = at(a, R);
    put(ring + j, x, y, lit);
  }

  return reached;
}
