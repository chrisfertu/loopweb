// Geometry field controller.
//
// Sections register scenes: a trigger element plus a declarative config.
// Scenes are ordered by their trigger's position in the page. A scene arrives
// when its trigger's top crosses a line (the middle of its `window`, 70% of
// the way down the viewport by default); the field then morphs into it on
// the clock, easing out over a couple of seconds, whatever the scroll does next. So for nearly
// all of the scroll the figure on screen is a finished one, and scrolling
// back across the line morphs back the same way.
//
// A scene can be placed on an anchor element (registerAnchor): one plate unit
// maps to half the anchor's shorter side, so figures sit exactly beside the
// copy, including inside sticky and pinned stages.
//
// Numeric parameters ease toward their targets, and oscillator phases are
// accumulated here rather than derived from absolute time, so changing a
// frequency (picking 16 Hz instead of 2 Hz) never makes the figure jump.

import { GeometryEngine, SCENE_VEC4 } from './engine';
import { buildShape, buildSeeds, DUST_FRACTION } from './shapes';
import { clockState, layoutClock, writeClock } from './clock';
import { writeSpiral } from './flowspiral';
import { intervalsState, layoutIntervals, writeIntervals } from './intervals';
import { layoutPulse, pulseState, writePulse } from './pulse';
import { SCENE_DEFAULTS, emitEvent, registry } from './registry';

export { BREATH, SCENE_DEFAULTS, registerScene, updateScene, unregisterScene, registerAnchor, strike, setMotionPaused, onSceneChange } from './registry';

// Matches Tailwind `lg`: sections show desktop anchors (`hidden lg:block`) from
// 1024px and mobile anchors (`lg:hidden`) below it.
const MOBILE_BREAKPOINT = 1024;
const TAU = Math.PI * 2;
const { scenes, anchors, listeners, pendingStrikes } = registry;
const V = SCENE_VEC4 * 4;
const BODY_FRAC = 1 - DUST_FRACTION;

const hexToRgb = (hex) => {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.replace(/(.)/g, '$1$1') : h, 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
};

// Keys set to undefined (listening() on a scene without `wave`, say) keep
// their defaults instead of wiping them.
function resolve(config, mobile) {
  const merged = { ...SCENE_DEFAULTS };
  const apply = (o) => {
    for (const k of Object.keys(o)) if (o[k] !== undefined) merged[k] = o[k];
  };
  apply(config);
  if (mobile && config.mobile) apply(config.mobile);
  return merged;
}

function targetVector(c) {
  const [r1, g1, b1] = hexToRgb(c.colors[0]);
  const [r2, g2, b2] = hexToRgb(c.colors[1] || c.colors[0]);
  const v = new Float32Array(V);
  v.set([
    c.scale, c.rotation, c.offset[0], c.offset[1],
    c.tilt[0], c.tilt[1], c.thickness, c.size,
    c.breathe[0], 0, c.ripple[0], c.ripple[1],
    0, c.wave[0], c.wave[1], c.wave[2],
    0, c.shimmer[0], 0, c.wobble[0],
    c.wobble[1], c.wobble[2], 0, c.colorMode,
    r1, g1, b1, c.opacity,
    r2, g2, b2, c.glow,
    c.select, 1, c.spectral[0], c.heart[0],
    0, 0, c.groupScale, 0,
    c.dash[0], 0, c.revealSets, c.farLight,
    c.ether[0], c.ether[1], c.ether[2], 0,
  ]);
  return v;
}

// ── Controller ─────────────────────────────────────────────

const clamp01 = (x) => Math.min(1, Math.max(0, x));

// How the field moves from one scene to the next: it eases out. Off at once
// (a tenth of a second to get going), then slower and slower, the last grains
// taking a few seconds to find their place.
const EASE_START = 10;
const EASE_RATE = 1.7;
// The grains set off well apart in time, so they trail in.
const STAGGER = 1.1;
// Close enough to its scene for that scene to count as landed.
const LANDED = 0.03;
// Seconds for a figure that comes in by itself: the hero's mark on load
// ('intro'), which eases out, and a scene that draws itself each time it
// arrives ('arrive').
const INTRO_SECONDS = 8;
const ARRIVE_SECONDS = 2.6;

// Ease an angle toward 0 the short way round.
const upright = (angle, k) => {
  const a = Math.atan2(Math.sin(angle), Math.cos(angle));
  return Math.abs(a) < 1e-4 ? 0 : a * (1 - k);
};

function pickTier() {
  const narrow = window.innerWidth < MOBILE_BREAKPOINT;
  const cores = navigator.hardwareConcurrency || 4;
  const memory = navigator.deviceMemory || 8;
  const fine = window.matchMedia?.('(pointer: fine)').matches;
  if (memory <= 2 || cores <= 2) return { count: 4500, size: 2.6 };
  if (fine && !narrow && cores >= 8) return { count: 14000, size: 2.2 };
  return { count: 8000, size: 2.3 };
}

export function startField(canvas, { reducedMotion = false, onFail } = {}) {
  const tier = pickTier();
  const { count } = tier;
  const seeds = buildSeeds(count);

  let engine;
  try {
    engine = new GeometryEngine(canvas, { count, seeds });
  } catch (err) {
    if (onFail) onFail(err);
    return () => {};
  }

  let running = true;
  let raf = 0;
  let last = performance.now();
  let clock = 0; // motion time: stops while motion is paused
  let wall = 0; // always runs: transitions, intro, pointer
  let fade = reducedMotion ? 1 : 0;
  let lostContext = false;
  let dirty = true;
  let lastScrollY = -1;
  let lastVersion = -1;
  let mobile = window.innerWidth < MOBILE_BREAKPOINT;
  let cssW = canvas.clientWidth || window.innerWidth;
  let cssH = canvas.clientHeight || window.innerHeight;
  let Ts = -1; // the field's place between scenes, moving toward the one that has arrived
  let Tx = -1; // what it chases: the arrived scene, a moment late
  let frameNo = 0;
  let jump = null; // { phase: 'out' | 'in', t, target }
  let dominantId = 0;
  let measuredAt = -1;
  let ordered = [];
  let shownA = null; // the two scenes drawn in the last frame
  let shownB = null;
  let shownLead = null; // ...and the one that carried more weight
  let settling = false; // a drawn scene is still easing, morphing or fading a selection
  const introSkipped = window.scrollY > window.innerHeight * 0.3;

  const pointer = { x: 0, y: 0, strength: 0, target: 0, lastMove: -1e9 };
  const strikeU = [0, 0, -1e9, 0];

  const dprFor = () => Math.min(window.devicePixelRatio || 1, mobile ? 1.75 : 2);

  const measure = () => {
    const sy = window.scrollY;
    ordered = [];
    scenes.forEach((s) => {
      if (!s.el || !s.el.isConnected) return;
      s.docTop = s.el.getBoundingClientRect().top + sy;
      ordered.push(s);
    });
    ordered.sort((a, b) => a.docTop - b.docTop);
    measuredAt = wall;
  };

  const resize = () => {
    const w = canvas.clientWidth || window.innerWidth;
    const h = canvas.clientHeight || window.innerHeight;
    // Ignore small height-only changes (mobile address bar).
    if (w === cssW && Math.abs(h - cssH) < 120 && engine.width > 1) {
      dirty = true;
      return;
    }
    cssW = w;
    cssH = h;
    mobile = window.innerWidth < MOBILE_BREAKPOINT;
    engine.resize(cssW, cssH, dprFor());
    scenes.forEach((s) => {
      s.resolved = null;
    });
    measure();
    dirty = true;
  };
  engine.resize(cssW, cssH, dprFor());
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);
  ro.observe(document.body);

  const onPointer = (e) => {
    if (e.pointerType !== 'mouse') return;
    pointer.x = e.clientX;
    pointer.y = e.clientY;
    pointer.target = 1;
    pointer.lastMove = wall;
  };
  const onLeave = () => {
    pointer.target = 0;
  };
  window.addEventListener('pointermove', onPointer, { passive: true });
  document.addEventListener('pointerleave', onLeave);

  // Browsers stop requestAnimationFrame in background tabs, so the loop
  // pauses itself there. Resetting `last` on return avoids one giant step.
  const onVisibility = () => {
    last = performance.now();
  };
  document.addEventListener('visibilitychange', onVisibility);

  const onLost = (e) => {
    e.preventDefault();
    lostContext = true;
    if (onFail) onFail(new Error('WebGL context lost'));
  };
  canvas.addEventListener('webglcontextlost', onLost);

  const onScroll = () => {
    dirty = true;
  };
  window.addEventListener('scroll', onScroll, { passive: true });

  // Warm shape caches during idle time so the first morph into a heavy
  // shape (logo path sampling) does not stall a scroll.
  const idle = window.requestIdleCallback || ((fn) => setTimeout(fn, 300));
  // A scene that swaps figures over time lists them in `preload`.
  const warm = () => {
    const keys = new Set();
    scenes.forEach((s) => {
      keys.add(s.shapeKey);
      (s.config.preload || []).forEach((k) => keys.add(k));
    });
    keys.forEach((k) => buildShape(k, count));
  };
  const warmHandle = idle(warm);

  // A live figure is redrawn every frame it is on screen: the clock with the
  // time since it landed, the flowing spiral at its own pace, the interval
  // bells with the time since they landed (reporting each bell reached), the
  // pulse at the pace its scene asks for.
  const sinceLanded = (live) => (live.start == null ? 0 : clock - live.start);
  const LIVE = {
    clock: {
      layout: layoutClock,
      state: clockState,
      write: (live) => writeClock(live.shape.pos, live.shape.meta, live.layout, sinceLanded(live), live.state),
    },
    flowspiral: {
      write: (live, s) => writeSpiral(live.shape.pos, live.shape.meta, live.shape.body, s.phase.pace),
    },
    intervals: {
      layout: layoutIntervals,
      state: (s) => intervalsState(s.resolved.bells),
      write: (live, s, dt) => {
        const { pos, meta } = live.shape;
        const reached = writeIntervals(pos, meta, live.layout, sinceLanded(live), s.resolved.bells, live.state, dt);
        if (live.start != null && !frozen()) reached.forEach((index) => emitEvent({ id: s.config.id, type: 'bell', index }));
      },
    },
    pulse: {
      layout: layoutPulse,
      state: pulseState,
      write: (live, s, dt) => writePulse(live.shape.pos, live.shape.meta, live.layout, live.state, s.resolved.pulse, frozen() ? 0 : dt),
    },
  };

  const liveShape = (s, base, dt) => {
    const kind = LIVE[s.shapeKey];
    if (!s.live || s.live.key !== s.shapeKey) {
      s.live = {
        key: s.shapeKey,
        shape: { pos: Float32Array.from(base.pos), meta: Float32Array.from(base.meta), gain: base.gain, body: base.body },
        layout: kind.layout ? kind.layout(base.body) : null,
        state: kind.state ? kind.state(s) : null,
        start: null,
        frame: -1,
      };
    }
    const live = s.live;
    if (live.frame !== frameNo) {
      live.frame = frameNo;
      kind.write(live, s, dt);
    }
    live.shape.live = true;
    return live.shape;
  };

  const shapeFor = (s, dt) => {
    const target = buildShape(s.shapeKey, count);
    if (!s.shapeFrom) return LIVE[s.shapeKey] && !reducedMotion ? liveShape(s, target, dt) : target;
    if (s.shapeStart < 0) s.shapeStart = wall;
    const dur = reducedMotion ? 0.001 : s.resolved.morph;
    const t = Math.min(1, (wall - s.shapeStart) / dur);
    // A scene changes shape the way it arrives: quickly at first, then
    // slower and slower.
    const e = 1 - Math.pow(1 - t, 3);
    if (t >= 1) {
      s.shapeFrom = null;
      s.fromSnap = null;
      return target;
    }
    const from = s.fromSnap || buildShape(s.shapeFrom, count);
    if (!s.transient) {
      s.transient = { pos: new Float32Array(count * 3), meta: new Float32Array(count * 2) };
    }
    const { pos, meta } = s.transient;
    for (let i = 0; i < count; i++) {
      let d = clamp01(e * 1.5 - seeds[i * 4 + 1] * 0.5);
      d = d * d * d * (d * (d * 6 - 15) + 10);
      const i3 = i * 3;
      pos[i3] = from.pos[i3] + (target.pos[i3] - from.pos[i3]) * d;
      pos[i3 + 1] = from.pos[i3 + 1] + (target.pos[i3 + 1] - from.pos[i3 + 1]) * d;
      pos[i3 + 2] = from.pos[i3 + 2] + (target.pos[i3 + 2] - from.pos[i3 + 2]) * d;
      meta[i * 2] = d < 0.5 ? from.meta[i * 2] : target.meta[i * 2];
      meta[i * 2 + 1] = from.meta[i * 2 + 1] + (target.meta[i * 2 + 1] - from.meta[i * 2 + 1]) * d;
    }
    s.transient.live = true;
    s.transient.gain = from.gain + (target.gain - from.gain) * e;
    return s.transient;
  };

  const frozen = () => reducedMotion || registry.paused();

  const advanceScene = (s, dt) => {
    if (!s.resolved) {
      s.resolved = resolve(s.config, mobile);
      s.target = targetVector(s.resolved);
      // The shape comes from the resolved config, so `mobile: { shape }`
      // overrides apply. A change to a figure on screen morphs; one off
      // screen (or any, with reduced motion) just changes, so it never
      // replays a stale morph later.
      const key = s.resolved.shape || SCENE_DEFAULTS.shape;
      if (key !== s.shapeKey) {
        if (s.cur && !reducedMotion && (s === shownA || s === shownB)) {
          // Mid-morph (a second tap): start from where the points are now.
          const midway = s.shapeFrom && s.shapeStart >= 0 && s.transient;
          s.fromSnap = midway
            ? { pos: s.transient.pos.slice(), meta: s.transient.meta.slice(), gain: s.transient.gain }
            : null;
          s.shapeFrom = s.shapeKey;
          s.shapeStart = -1; // stamped on the next frame
        } else {
          s.shapeFrom = null;
          s.fromSnap = null;
        }
        s.shapeKey = key;
      }
      if (!s.cur) s.cur = Float32Array.from(s.target);
    }
    const c = s.resolved;
    const k = reducedMotion ? 1 : 1 - Math.exp(-dt * 3.2);
    for (let i = 0; i < V; i++) s.cur[i] += (s.target[i] - s.cur[i]) * k;

    // Selection (a device node, a noise ring): the old one fades out before
    // the new one fades in, so the light never sweeps across the groups
    // between them.
    const want = c.select >= 0 ? c.select : -1;
    if (reducedMotion) {
      s.sel = want;
      s.selAmt = want >= 0 ? 1 : 0;
    } else if (s.sel !== want) {
      s.selAmt = Math.max(0, s.selAmt - dt * 5);
      if (s.selAmt <= 0) s.sel = want;
    } else if (want >= 0) {
      s.selAmt = Math.min(1, s.selAmt + dt * 3);
    }

    // A figure that does not spin stands upright. A scene can take over
    // another figure (Listen), so an angle gathered while it span eases away.
    if (!c.spin && s.angle) s.angle = upright(s.angle, k);
    if (!c.spin3 && s.angle3) s.angle3 = upright(s.angle3, k);
    if (!frozen()) {
      s.angle += c.spin * dt;
      s.angle3 += c.spin3 * dt;
      s.phase.breathe += c.breathe[1] * dt;
      s.phase.ripple += c.ripple[2] * dt;
      s.phase.wave += c.wave[3] * dt;
      s.phase.shimmer += c.shimmer[1] * dt;
      s.phase.wobble += c.wobble[3] * dt;
      s.phase.spectral += c.spectral[1] * dt;
      s.phase.heart += (c.heart[1] / 60) * dt;
      s.phase.dash += c.dash[1] * dt;
      s.phase.ether += c.ether[3] * dt;
      s.phase.pace += c.pace * dt;
      for (const key of Object.keys(s.phase)) s.phase[key] %= TAU * 1000;
      s.angle %= TAU;
      s.angle3 %= TAU;
    }
  };

  // Plate placement: anchor rect (live) or viewport offset.
  const place = (s, v) => {
    const c = s.resolved;
    if (!c.anchor) return;
    const el = anchors.get(c.anchor);
    if (!el || !el.isConnected) return;
    const r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) return;
    const unitCss = (Math.min(r.width, r.height) / 2) * c.scale;
    const cx = r.left + r.width / 2 + c.dx * unitCss;
    const cy = r.top + r.height / 2 - c.dy * unitCss;
    v[0] = (unitCss * engine.dpr) / engine.unit;
    v[2] = (cx - cssW / 2) / (cssW / 2);
    v[3] = (cssH / 2 - cy) / (cssH / 2);
  };

  const revealFor = (s) => {
    const mode = s.resolved.reveal;
    let p = 1;
    if (mode === 'intro') {
      if (reducedMotion || introSkipped || registry.paused()) p = 1;
      else p = 1 - Math.pow(1 - clamp01((wall - 0.3) / INTRO_SECONDS), 2.6);
    } else if (mode === 'arrive') {
      // Drawn once the scene has arrived; undrawn again when it has left.
      if (reducedMotion || registry.paused()) p = 1;
      else p = s.arrivedAt == null ? 0 : clamp01((wall - s.arrivedAt) / ARRIVE_SECONDS);
    } else if (typeof mode === 'number') {
      p = mode;
    }
    return p * BODY_FRAC + (p >= 1 ? 0.07 : 0);
  };

  const pack = (s, gain) => {
    const v = Float32Array.from(s.cur);
    place(s, v);
    v[1] += s.angle;
    v[5] += s.angle3;
    v[9] = s.phase.breathe;
    v[12] = s.phase.ripple;
    v[16] = s.phase.wave;
    v[18] = s.phase.shimmer;
    v[22] = s.phase.wobble;
    v[27] *= gain;
    v[32] = s.sel;
    v[33] = revealFor(s);
    v[36] = s.phase.heart;
    v[37] = s.phase.spectral;
    v[39] = s.selAmt * s.selAmt * (3 - 2 * s.selAmt);
    v[41] = s.phase.dash;
    v[47] = s.phase.ether;
    return v;
  };

  // Still easing toward its config, morphing, or fading a selection: keep
  // drawing even while motion is paused, so a tap always lands.
  const unsettled = (s) => {
    if (s.shapeFrom) return true;
    const want = s.resolved.select >= 0 ? s.resolved.select : -1;
    if (s.sel !== want || (want >= 0 && s.selAmt < 1)) return true;
    if ((!s.resolved.spin && s.angle) || (!s.resolved.spin3 && s.angle3)) return true;
    for (let i = 0; i < V; i++) if (Math.abs(s.target[i] - s.cur[i]) > 1e-3) return true;
    return false;
  };

  const emit = (s) => {
    if (!s || s.id === dominantId) return;
    dominantId = s.id;
    const [r, g, b] = hexToRgb(s.resolved.colors[0]);
    document.documentElement.style.setProperty('--field-tint', `${Math.round(r * 255)} ${Math.round(g * 255)} ${Math.round(b * 255)}`);
    listeners.forEach((fn) => fn({ sceneId: s.id, config: s.config }));
  };

  function frame(now) {
    raf = running ? requestAnimationFrame(frame) : 0;
    if (lostContext) return;

    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;

    const scrollY = window.scrollY;
    const moving = !frozen() || jump || pendingStrikes.length;
    const changed = dirty || scrollY !== lastScrollY || registry.version() !== lastVersion;
    if (reducedMotion && !changed && !settling && !pendingStrikes.length) return;
    if (!moving && !changed && !settling && fade >= 1) return;

    frameNo += 1;
    wall += dt;
    if (!frozen()) clock += dt;
    fade = reducedMotion ? 1 : Math.min(1, fade + dt / 1.6);
    if (registry.version() !== lastVersion || wall - measuredAt > 1 || measuredAt < 0) measure();
    lastScrollY = scrollY;
    lastVersion = registry.version();
    dirty = false;

    if (!ordered.length) return;
    ordered.forEach((s) => advanceScene(s, dt));

    // Scenes that show one figure together (`sync`) share its motion, so a
    // blend between two of them holds still. The scene on screen leads.
    const leaders = new Map();
    for (const s of [shownLead, shownA, shownB, ...ordered]) {
      const group = s && s.resolved && s.resolved.sync;
      if (!group) continue;
      const lead = leaders.get(group);
      if (!lead) leaders.set(group, s);
      else if (lead !== s) {
        s.angle = lead.angle;
        s.angle3 = lead.angle3;
        Object.assign(s.phase, lead.phase);
      }
    }

    // The scene that has arrived: the last one whose trigger is past its line.
    const vh = window.innerHeight;
    let T = 0;
    for (let k = 1; k < ordered.length; k++) {
      const s = ordered[k];
      const [w0, w1] = s.resolved.window;
      if (s.docTop - scrollY <= ((w0 + w1) / 2) * vh) T = k;
    }
    if (Ts < 0) {
      Ts = T;
      Tx = T;
    }

    // Move toward it on the clock. A jump of more than one scene fades out
    // and back in instead of morphing through the ones between.
    let jumpFade = 1;
    if (!jump && Math.abs(T - Ts) > 1.5 && !reducedMotion) jump = { phase: 'out', t: 0 };
    if (jump) {
      jump.t += dt;
      if (jump.phase === 'out') {
        jumpFade = 1 - clamp01(jump.t / 0.15);
        if (jump.t >= 0.15) {
          Ts = T;
          jump = { phase: 'in', t: 0 };
        }
      } else {
        jumpFade = clamp01(jump.t / 0.25);
        Ts = T;
        if (jump.t >= 0.25) jump = null;
      }
    } else if (reducedMotion) {
      Ts = T;
    } else {
      Tx += (T - Tx) * (1 - Math.exp(-dt * EASE_START));
      Ts += (Tx - Ts) * (1 - Math.exp(-dt * EASE_RATE));
      if (Math.abs(T - Ts) < 1.5e-3) Ts = T;
    }
    if (jump || reducedMotion) Tx = Ts;

    const from = Math.min(ordered.length - 1, Math.max(0, Math.floor(Ts)));
    const to = Math.min(ordered.length - 1, from + 1);
    const mix = to === from ? 0 : clamp01(Ts - from);
    const a = ordered[from];
    const b = ordered[to];
    shownA = a;
    shownB = b;
    shownLead = mix < 0.5 ? a : b;
    // A morph belongs to a figure on screen: a scene that is no longer drawn
    // finishes at once, so it can never replay later.
    for (const s of ordered) {
      if (s === a || s === b) continue;
      if (s.shapeFrom) {
        s.shapeFrom = null;
        s.fromSnap = null;
      }
      // A scene that has left starts over when it comes back.
      s.arrivedAt = null;
      if (s.live) {
        s.live.start = null;
        const kind = LIVE[s.live.key];
        s.live.state = kind && kind.state ? kind.state(s) : null;
      }
    }
    // The scene the field rests on has landed: its drawing and its clock start.
    const landed = Math.abs(T - Ts) < LANDED ? ordered[Math.min(ordered.length - 1, T)] : null;
    if (landed) {
      if (landed.arrivedAt == null) landed.arrivedAt = wall;
      if (landed.live && landed.live.start == null) landed.live.start = clock;
    }

    const shapeA = shapeFor(a, dt);
    const shapeB = shapeFor(b, dt);
    engine.setShape('A', shapeA, !!shapeA.live);
    engine.setShape('B', shapeB, !!shapeB.live);
    if (shapeA.live) shapeA.live = false;
    if (shapeB.live && shapeB !== shapeA) shapeB.live = false;

    const vA = pack(a, shapeA.gain ?? 1);
    const vB = pack(b, shapeB.gain ?? 1);
    settling = unsettled(a) || unsettled(b) || Ts !== T;

    const dominant = mix < 0.5 ? a : b;
    emit(dominant);

    const dpr = engine.dpr;
    const unit = engine.unit;
    const centre = (v) => [v[2] * engine.width * 0.5, v[3] * engine.height * 0.5];
    const domV = mix < 0.5 ? vA : vB;

    // Pointer, in device pixels relative to the canvas centre (y up)
    pointer.target = wall - pointer.lastMove < 2 ? pointer.target : 0;
    pointer.strength += (pointer.target - pointer.strength) * (1 - Math.exp(-dt * 4));
    const px = (pointer.x - cssW / 2) * dpr;
    const py = (cssH / 2 - pointer.y) * dpr;

    // Strikes: on arrival (scrolling down), periodic, or requested
    const dom = dominant.resolved;
    if (!frozen()) {
      if (b.resolved.strikeOnEnter && mix > 0.5 && T > Ts - 0.01 && clock - b.lastStrike > 6) {
        b.lastStrike = clock;
        pendingStrikes.push({ amp: 1 });
      }
      if (dom.strikeEvery > 0 && clock - dominant.lastStrike > dom.strikeEvery) {
        dominant.lastStrike = clock;
        pendingStrikes.push({ amp: 0.8 });
      }
    }
    while (pendingStrikes.length) {
      const p = pendingStrikes.shift();
      if (frozen()) continue;
      const [sx, sy] = p.clientX == null ? centre(domV) : [(p.clientX - cssW / 2) * dpr, (cssH / 2 - p.clientY) * dpr];
      strikeU[0] = sx;
      strikeU[1] = sy;
      strikeU[2] = clock;
      strikeU[3] = p.amp;
    }

    const lerp = (x, y) => x + (y - x) * mix;

    // How far the figure travels in this morph, in units of its own size.
    const [ax, ay] = centre(vA);
    const [bx, by] = centre(vB);
    const size = unit * Math.max(0.2, (vA[0] + vB[0]) / 2);
    const travel = Math.hypot(bx - ax, by - ay) / size;
    const dip = reducedMotion ? 0 : Math.min(0.85, Math.max(0, (travel - 0.5) / 1.2));
    // Two scenes holding one figure together: nothing is in flight.
    const held = !!a.resolved.sync && a.resolved.sync === b.resolved.sync;

    engine.draw({
      sceneA: vA,
      sceneB: vB,
      mix,
      time: frozen() ? 12 : clock,
      stagger: reducedMotion ? 0 : STAGGER,
      swirl: reducedMotion || held ? 0 : 0.4 * (1 - dip * 0.7),
      dip: held ? 0 : dip,
      reduced: reducedMotion,
      baseSize: tier.size,
      fade: fade * jumpFade,
      dust: mobile ? 0.35 : 0.5,
      pointer: [px, py, frozen() ? 0 : pointer.strength, 0.11 * (unit / dpr)],
      strike: strikeU,
      aura: {
        x: lerp(vA[2], vB[2]),
        y: lerp(vA[3], vB[3]),
        radius: lerp(vA[0], vB[0]) * 1.15,
        r: lerp(vA[24], vB[24]),
        g: lerp(vA[25], vB[25]),
        b: lerp(vA[26], vB[26]),
        intensity: lerp(vA[31], vB[31]),
      },
    });
  }

  raf = requestAnimationFrame(frame);

  return () => {
    running = false;
    cancelAnimationFrame(raf);
    ro.disconnect();
    window.removeEventListener('pointermove', onPointer);
    document.removeEventListener('pointerleave', onLeave);
    document.removeEventListener('visibilitychange', onVisibility);
    window.removeEventListener('scroll', onScroll);
    canvas.removeEventListener('webglcontextlost', onLost);
    if (window.cancelIdleCallback && typeof warmHandle === 'number') window.cancelIdleCallback(warmHandle);
    engine.destroy();
  };
}
