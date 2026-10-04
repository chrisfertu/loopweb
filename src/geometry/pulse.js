// The heart figure: a pulse traced round a circle, a heart at its centre and
// the mindful minutes as a ring around it.
//
//   trace    a heart monitor bent into a circle: a point sweeps clockwise
//            once every LAP seconds and leaves a fading line behind it, which
//            swells outward at each beat (a strong rise, then a softer one). The faster the heart, the closer the
//            beats; the harder it works, the taller they are.
//   heart    a small cloud at the centre that swells at each beat.
//   minutes  an outer ring, faint, that fills clockwise from 12 o'clock while
//            the scene says the time counts (`filling`), and empties after.
//
// The scene sets the pace with `pulse: { bpm, amp, filling }`, where bpm is
// a number or a range [low, high] that the heart wanders through slowly; the
// figure eases to a new pace, so the heart speeds up and calms down as it
// would.
// It is live: the field redraws it every frame. Every grain belongs to
// LIVE_GROUP and carries its own brightness.
//
// Units: plate units, radius 1 = half the anchor's shorter side.

import { LIVE_GROUP } from './clock';

const TAU = Math.PI * 2;

const TRACE_R = 0.58;
const BEAT_HEIGHT = 0.16; // a full beat's reach, outward from the trace
const LAP = 4.2; // seconds for the sweep to go round
const TRAIL = 0.93; // how much of the circle the line behind the sweep covers
const MINUTES_R = 0.9;
const HEART_R = 0.1;
const FILL_SECONDS = 9; // to fill the minutes ring
const EASE = 0.9; // how quickly the pace follows the scene (per second)
const WANDER = 9; // seconds for the heart to wander across its range and back

export const PULSE_REST = { bpm: [55, 60], amp: 0.55, filling: false };

// The rate the heart is heading for, `t` seconds in.
function targetBpm(bpm, t) {
  if (!Array.isArray(bpm)) return bpm;
  const [low, high] = bpm;
  return low + (high - low) * (0.5 - 0.5 * Math.cos((t / WANDER) * TAU));
}

const bump = (f, at, width) => Math.exp(-(((f - at) / width) ** 2));

// One beat, for f in 0..1: the two sounds of a heartbeat, a strong one and
// a softer one just after, each a smooth rise and fall.
function beat(f) {
  return bump(f, 0.08, 0.045) + 0.55 * bump(f, 0.24, 0.05);
}

// Where each kind of grain sits in a body of `body` points.
export function layoutPulse(body) {
  const trace = Math.round(body * 0.56);
  const heart = Math.round(body * 0.1);
  return { body, trace, heart, heartAt: trace, minutes: trace + heart, minutesCount: body - trace - heart };
}

export const pulseState = () => ({ bpm: targetBpm(PULSE_REST.bpm, 0), amp: PULSE_REST.amp, t: 0, beats: 0, fill: 0.35, sweep: 0 });

// Write the figure, `dt` seconds after the last call (0 to hold still).
export function writePulse(pos, meta, layout, state, pace = PULSE_REST, dt = 0) {
  const { trace, heart, heartAt, minutes, minutesCount } = layout;
  const put = (i, x, y, a) => {
    pos[i * 3] = x;
    pos[i * 3 + 1] = y;
    pos[i * 3 + 2] = 0;
    meta[i * 2] = LIVE_GROUP;
    meta[i * 2 + 1] = a;
  };

  // Follow the pace, then move on.
  const k = 1 - Math.exp(-dt * EASE);
  state.t += dt;
  state.bpm += (targetBpm(pace.bpm ?? PULSE_REST.bpm, state.t) - state.bpm) * k;
  state.amp += ((pace.amp ?? PULSE_REST.amp) - state.amp) * k;
  state.beats += (state.bpm / 60) * dt;
  state.sweep = (state.sweep + dt / LAP) % 1;
  state.fill = pace.filling ? Math.min(1, state.fill + dt / FILL_SECONDS) : Math.max(0, state.fill - dt * 0.35);

  // The trace: grain j is u of the way back along the line behind the sweep.
  const head = state.sweep * TAU;
  for (let j = 0; j < trace; j++) {
    const u = (j + 0.5) / trace;
    const a = head - u * TRAIL * TAU;
    const back = u * TRAIL * LAP; // seconds ago
    let f = (state.beats - (state.bpm / 60) * back) % 1;
    if (f < 0) f += 1;
    const r = TRACE_R + BEAT_HEIGHT * state.amp * beat(f);
    put(j, r * Math.sin(a), r * Math.cos(a), Math.pow(1 - u, 1.4));
  }

  // The heart: swells at the spike of each beat.
  const now = state.beats % 1;
  const swell = 1 + 0.45 * state.amp * beat(now);
  for (let j = 0; j < heart; j++) {
    const a = j * 2.39996;
    const rr = HEART_R * swell * Math.sqrt((j + 0.5) / heart);
    put(heartAt + j, rr * Math.sin(a), rr * Math.cos(a), 0.55 + 0.45 * (swell - 1) * 2);
  }

  // The minutes ring.
  for (let j = 0; j < minutesCount; j++) {
    const u = (j + 0.5) / minutesCount;
    const a = u * TAU;
    const lit = u < state.fill ? 0.95 : 0.12;
    put(minutes + j, MINUTES_R * Math.sin(a), MINUTES_R * Math.cos(a), lit);
  }
}
