// Shape library for the geometry field.
//
// Every shape is the same number of points, sampled evenly along its strokes
// (by arc length) in stroke order. Because point i of one shape and point i of
// another sit at similar positions along their drawings, interpolating by
// index makes any form flow into any other.
//
// Coordinates are "plate units": the figure's main radius is 1, and the
// controller maps 1 unit onto half of the scene's anchor element.
//
// A shape is { pos: Float32Array(N*3), meta: Float32Array(N*2), gain }.
//   pos  = x, y, z
//   meta = [group, u]. group picks per-stroke behaviour (binaural lanes, noise
//          rings, device nodes), u is the 0..1 position along the stroke.
//          Group 900 is ambient dust and never moves.
//
// Keys are strings, e.g. 'logo:1', 'clock', 'lotus:16', 'bell:8,2,0'.
// 'clock', 'flowspiral', 'intervals' and 'pulse' are live: the field redraws
// them every frame.

import ringSvg from './logo/ring.svg?raw';
import chevronsSvg from './logo/chevrons.svg?raw';
import bracketsSvg from './logo/brackets.svg?raw';
import coreSvg from './logo/core.svg?raw';
import { ENCLOSURE_R, LOGO_PLAY_R, METATRON_NODES, PRESET_ICON_R, ricochet } from './nodes';
import { cutoutDisc } from './cutouts';
import { layoutClock, writeClock } from './clock';
import { writeSpiral } from './flowspiral';
import { intervalsState, layoutIntervals, writeIntervals } from './intervals';
import { layoutPulse, pulseState, writePulse } from './pulse';

export { METATRON_NODES };

const TAU = Math.PI * 2;
const PHI = (1 + Math.sqrt(5)) / 2;
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));

// The rim of a preset's icon on the presets figure (nodes.js places the icons).
const ICON_RIM = PRESET_ICON_R;

export const DUST_GROUP = 900;
export const DUST_FRACTION = 0.07;

// Brightness for cloud-heavy shapes; stroke shapes derive theirs from length.
const GAIN = { point: 0.22, plate: 1.2, brownian: 1.4, dust: 1.6, phyllotaxis: 1.3, cutout: 1.3, clock: 1.1, flowspiral: 4.2, intervals: 1.3, pulse: 1.4 };

// mulberry32: small deterministic PRNG so shapes are identical on every load.
export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ── Stroke primitives ──────────────────────────────────────
// Angles are measured clockwise from 12 o'clock: x = r·sin a, y = r·cos a.

const polar = (r, a) => [r * Math.sin(a), r * Math.cos(a), 0];

const arc = (cx, cy, r, a0, a1, { group = 0, w = 1, segs } = {}) => {
  const n = segs || Math.max(24, Math.ceil(Math.abs(a1 - a0) * r * 60));
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const a = a0 + ((a1 - a0) * i) / n;
    pts.push([cx + r * Math.sin(a), cy + r * Math.cos(a), 0]);
  }
  return { pts, group, w };
};

// Full circle, drawn clockwise from `start` (12 o'clock by default).
const circle = (cx, cy, r, opts = {}) => {
  const start = opts.start ?? 0;
  return arc(cx, cy, r, start, start + TAU, opts);
};

const line = (a, b, { group = 0, w = 1 } = {}) => ({
  pts: [
    [a[0], a[1], a[2] || 0],
    [b[0], b[1], b[2] || 0],
  ],
  group,
  w,
});

const poly = (pts, { group = 0, w = 1 } = {}) => ({ pts, group, w });

// A rounded rectangle centred on the origin, drawn clockwise from the top
// middle.
const roundedRect = (w, h, rad, { group = 0, w: weight = 1 } = {}) => {
  const hw = w / 2;
  const hh = h / 2;
  const r = Math.min(rad, hw, hh);
  const pts = [[0, hh, 0]];
  const corner = (cx, cy, a0) => {
    for (let i = 0; i <= 12; i++) {
      const a = a0 + (i / 12) * (TAU / 4);
      pts.push([cx + r * Math.sin(a), cy + r * Math.cos(a), 0]);
    }
  };
  corner(hw - r, hh - r, 0);
  corner(hw - r, -hh + r, TAU / 4);
  corner(-hw + r, -hh + r, TAU / 2);
  corner(-hw + r, hh - r, (3 * TAU) / 4);
  pts.push([0, hh, 0]);
  return { pts, group, w: weight };
};

// ── Sampling ───────────────────────────────────────────────

function strokeLength(s) {
  let l = 0;
  for (let i = 1; i < s.pts.length; i++) {
    const a = s.pts[i - 1];
    const b = s.pts[i];
    l += Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
  }
  return l;
}

// Sample `count` points evenly by (length × weight) across strokes, in order.
// Returns the total drawn length, used to normalise brightness.
function sampleStrokes(strokes, count, pos, meta, offset) {
  const lens = strokes.map(strokeLength);
  const weighted = strokes.map((s, i) => lens[i] * (s.w ?? 1));
  const total = weighted.reduce((x, y) => x + y, 0) || 1;

  // Largest-remainder rounding so counts sum exactly.
  const raw = weighted.map((l) => (l / total) * count);
  const counts = raw.map(Math.floor);
  let rest = count - counts.reduce((x, y) => x + y, 0);
  raw
    .map((r, i) => [r - Math.floor(r), i])
    .sort((a, b) => b[0] - a[0])
    .forEach(([, i]) => {
      if (rest > 0) {
        counts[i]++;
        rest--;
      }
    });

  let written = 0;
  strokes.forEach((s, si) => {
    const n = counts[si];
    if (n <= 0) return;
    const cum = [0];
    for (let i = 1; i < s.pts.length; i++) {
      const a = s.pts[i - 1];
      const b = s.pts[i];
      cum.push(cum[i - 1] + Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]));
    }
    const L = cum[cum.length - 1] || 1;
    let seg = 1;
    for (let k = 0; k < n; k++) {
      const u = n === 1 ? 0.5 : k / (n - 1);
      const target = u * L;
      while (seg < cum.length - 1 && cum[seg] < target) seg++;
      const a = s.pts[Math.max(0, seg - 1)];
      const b = s.pts[Math.min(seg, s.pts.length - 1)];
      const segLen = cum[seg] - cum[seg - 1] || 1;
      const f = Math.min(1, Math.max(0, (target - cum[seg - 1]) / segLen));
      const idx = offset + written + k;
      pos[idx * 3] = a[0] + (b[0] - a[0]) * f;
      pos[idx * 3 + 1] = a[1] + (b[1] - a[1]) * f;
      pos[idx * 3 + 2] = a[2] + (b[2] - a[2]) * f;
      meta[idx * 2] = s.group || 0;
      meta[idx * 2 + 1] = u;
    }
    written += n;
  });
  return lens.reduce((x, y) => x + y, 0);
}

function writeCloud(points, pos, meta, offset) {
  points.forEach((p, i) => {
    const idx = offset + i;
    pos[idx * 3] = p[0];
    pos[idx * 3 + 1] = p[1];
    pos[idx * 3 + 2] = p[2] || 0;
    meta[idx * 2] = p[3] ?? 0;
    meta[idx * 2 + 1] = points.length > 1 ? i / (points.length - 1) : 0;
  });
}

// ── Clouds ─────────────────────────────────────────────────

// Gaussian cluster with a sparse halo: one glowing seed.
function seedCloud(n, sigma = 0.02, halo = 0.22, group = 0, seed = 5) {
  const rand = rng(seed);
  const out = [];
  for (let i = 0; i < n; i++) {
    const g = Math.sqrt(-2 * Math.log(Math.max(1e-6, rand())));
    const isHalo = rand() < halo;
    const r = isHalo ? sigma * 1.5 + sigma * 12 * Math.pow(rand(), 2.2) : sigma * g;
    const a = i * GOLDEN_ANGLE;
    out.push([Math.sin(a) * r, Math.cos(a) * r, 0, group]);
  }
  return out;
}

// Fibonacci (Vogel) disk: the sunflower, in index order.
function vogelDisk(n, radius, { cx = 0, cy = 0, group = 0, rot = 0 } = {}) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const r = radius * Math.sqrt((i + 0.5) / n);
    const a = rot + i * GOLDEN_ANGLE;
    out.push([cx + Math.sin(a) * r, cy + Math.cos(a) * r, 0, group]);
  }
  return out;
}

// ── Bessel zeros j_{m,k}: nodal circles of a round plate ───

const BESSEL_ZEROS = {
  0: [2.4048, 5.5201, 8.6537, 11.7915],
  1: [3.8317, 7.0156, 10.1735, 13.3237],
  2: [5.1356, 8.4172, 11.6198, 14.796],
  3: [6.3802, 9.761, 13.0152, 16.2235],
  6: [9.9361, 13.5893, 17.0038, 20.3208],
  8: [12.2251, 16.0378, 19.5545, 22.9452],
};

// ── Device graph (13 circles, 78 lines) ────────────────────



// ── Figures: return { sets: [{ strokes, share }], clouds: [{ points, share }] }
// or a plain array of strokes. Shares are fractions of the shape's body.

const figures = {
  circle: (r = 1) => [circle(0, 0, r)],

  // A seed head: each new seed 137.5° from the last.
  phyllotaxis: () => ({
    clouds: [{ share: 1, make: (n) => vogelDisk(n, 0.94, { group: 1 }) }],
  }),

  // The same seed head with a shape left empty (see cutouts.js): the grains
  // that were in the way sit along its edge. `index` picks the shape.
  cutout: (index = 0) => ({
    clouds: [{ share: 1, make: (n) => cutoutDisc(n, index, rng(11), 1) }],
  }),

  // Two circles, each drawn through the other's centre, and the two
  // equilateral triangles that construct them (Euclid I.1), faint.
  vesica: () => {
    const r = 0.55;
    const h = (r * Math.sqrt(3)) / 2;
    const L = [-r / 2, 0];
    const R = [r / 2, 0];
    return {
      sets: [
        { share: 0.94, strokes: [circle(-r / 2, 0, r, { start: TAU * 0.25 }), circle(r / 2, 0, r, { start: TAU * 0.75, group: 1 })] },
        {
          share: 0.06,
          strokes: [line(L, R, { group: 2 }), line(R, [0, h], { group: 2 }), line([0, h], L, { group: 2 }), line(R, [0, -h], { group: 2 }), line([0, -h], L, { group: 2 })],
        },
      ],
    };
  },

  // Three lanes the shader bends into the left tone, the right tone and their
  // sum. Group 0 = left, 1 = right, 2 = sum.
  binaural: () => ({
    sets: [
      { share: 0.3, strokes: [line([-1.2, 0.34], [1.2, 0.34], { group: 0 })] },
      { share: 0.4, strokes: [line([-1.2, 0], [1.2, 0], { group: 2 })] },
      { share: 0.3, strokes: [line([-1.2, -0.34], [1.2, -0.34], { group: 1 })] },
    ],
  }),

  // Petals as pointed lenses, like the brainwave covers in the app:
  // 2 petals (with a waveform), 6, 8, and 16 in two layers.
  lotus: (petals = 6) => {
    const petalSet = [];
    const layer = (n, inner, outer, width, rot, group) => {
      for (let i = 0; i < n; i++) {
        const a = rot + (i * TAU) / n;
        const pts = [];
        const steps = 72;
        for (let s = 0; s <= steps * 2; s++) {
          const up = s <= steps;
          const t = up ? s / steps : 2 - s / steps;
          const along = inner + (outer - inner) * t;
          const half = width * Math.pow(Math.sin(Math.PI * t), 0.8) * (up ? 1 : -1);
          const [px, py] = [Math.sin(a) * along, Math.cos(a) * along];
          pts.push([px + Math.cos(a) * half, py - Math.sin(a) * half, 0]);
        }
        petalSet.push(poly(pts, { group }));
      }
    };
    const extras = [];
    if (petals === 2) {
      layer(2, 0.14, 0.86, 0.22, 0, 0);
      const wave = [];
      for (let i = 0; i <= 240; i++) {
        const x = -1 + (2 * i) / 240;
        const env = Math.exp(-Math.pow(x / 0.55, 2));
        wave.push([x, 0.1 * env * Math.sin(x * 38), 0]);
      }
      extras.push(poly(wave, { group: 2 }));
    } else if (petals === 16) {
      layer(8, 0.14, 0.92, 0.2, 0, 0);
      layer(8, 0.14, 0.7, 0.17, TAU / 16, 2);
      // Interleave outer and inner petals (outer 0, inner 0, outer 1, ...), so
      // in index order each petal of the 8-petal figure splits into two
      // neighbours here instead of half its points crossing the figure.
      const outer = petalSet.splice(0, 8);
      const inner = petalSet.splice(0, 8);
      outer.forEach((o, k) => petalSet.push(o, inner[k]));
    } else {
      layer(petals, 0.14, 0.9, Math.min(0.26, 0.9 * Math.sin(Math.PI / petals) * 0.95), 0, 0);
    }
    const ticks = [];
    const tickCount = Math.max(24, petals * 6);
    for (let i = 0; i < tickCount; i++) {
      const a = (i * TAU) / tickCount;
      ticks.push(line(polar(1.05, a), polar(i % 3 === 0 ? 1.12 : 1.08, a), { group: 1 }));
    }
    return {
      sets: [
        { share: 0.66, strokes: [...petalSet, ...extras] },
        { share: 0.2, strokes: [circle(0, 0, 0.14, { group: 1 }), circle(0, 0, 1, { group: 1 })] },
        { share: 0.14, strokes: ticks },
      ],
    };
  },

  // Four clouds of grains (white, pink, brown, dark), in a row or a 2×2
  // grid, with no outline. The shader moves each cloud with its own spectrum,
  // by its group. Dark is a little smaller and sits low.
  noiseclouds: (grid = 0) => {
    const centers = grid ? [[-0.5, 0.5], [0.5, 0.5], [-0.5, -0.5], [0.5, -0.5]] : [[-3, 0], [-1, 0], [1, 0], [3, 0]];
    const r0 = grid ? 0.4 : 0.78;
    return {
      clouds: centers.map(([cx, cy], g) => ({
        share: 0.25,
        make: (n) =>
          vogelDisk(n, r0 * (g === 3 ? 0.82 : 0.95), { cx, cy: g === 3 ? cy - r0 * 0.15 : cy, group: g, rot: g }),
      })),
    };
  },

  // Silence: a horizon, densest in the middle, and a sun rising behind it.
  horizon: (span = 7.2) => {
    const pts = [];
    const n = 400;
    for (let i = 0; i <= n; i++) {
      // inverse-Gaussian-ish warp: more samples near the centre
      const u = i / n - 0.5;
      const x = Math.sign(u) * Math.pow(Math.abs(u) * 2, 1.8) * (span / 2);
      pts.push([x, -0.1, 0]);
    }
    return {
      sets: [
        { share: 0.9, strokes: [poly(pts, { group: 0 })] },
        { share: 0.1, strokes: [arc(0, -0.1, 0.6, -TAU / 4, TAU / 4, { group: 1 })] },
      ],
    };
  },

  // The round plate before it rings: sand evenly spread, and its rim.
  plate: () => ({
    sets: [{ share: 0.06, strokes: [circle(0, 0, 0.92, { group: 1 })] }],
    clouds: [{ share: 0.94, make: (n) => vogelDisk(n, 0.9, { group: 0 }) }],
  }),

  // Where a round plate stays still while it rings: m nodal diameters and
  // nodal circles at the zeros of the Bessel function J_m. Loose sand stays.
  bell: (m = 8, n = 2, rotDeg = 0) => {
    const rot = (rotDeg * Math.PI) / 180;
    const strokes = [];
    for (let j = 0; j < m; j++) {
      const a = rot + (j * Math.PI) / m;
      strokes.push(line(polar(-1, a), polar(1, a), { group: 0 }));
    }
    const zeros = BESSEL_ZEROS[m] || BESSEL_ZEROS[0];
    for (let k = 0; k < n - 1; k++) {
      strokes.push(circle(0, 0, zeros[k] / zeros[n - 1], { group: 0 }));
    }
    strokes.push(circle(0, 0, 1, { group: 1 }));
    return {
      sets: [{ share: 0.88, strokes }],
      clouds: [
        {
          share: 0.12,
          make: (count) => {
            const rand = rng(m * 17 + n);
            const out = [];
            for (let i = 0; i < count; i++) {
              const a = rand() * TAU;
              const r = Math.sqrt(rand()) * 0.95;
              out.push([Math.sin(a) * r, Math.cos(a) * r, 0, 2]);
            }
            return out;
          },
        },
      ],
    };
  },

  // A ring whose edge ripples: the wrist tap.
  wavering: () => {
    const pts = [];
    for (let i = 0; i <= 720; i++) {
      const a = (i / 720) * TAU;
      const r = 0.6 * (1 + 0.025 * Math.sin(24 * a));
      pts.push(polar(r, a));
    }
    return [poly(pts)];
  },

  // Circles of radius r on a hexagonal lattice. Slots beyond `count` are
  // parked on their parent circle, so when the count grows new circles split
  // off old ones. Every count of one family (same r and rings) morphs well.
  // The first `icons` slots also get a small ring at their centre (group 3),
  // the rim of a preset's icon.
  lattice: (count = 19, r = 0.3, rings = 5, icons = 0) => {
    const slots = hexSlots(rings, r);
    const strokes = slots.map((s, i) => {
      const [x, y] = i < count ? s.pos : slots[s.parent].parkedPos(count, slots);
      const w = Math.exp(-Math.pow(s.dist / (2.6 * r), 2)) + 0.15;
      return circle(x, y, r, { group: i === 0 ? 1 : 0, w, segs: 90, start: s.angle });
    });
    const boundR = count <= 7 ? 2 * r : count <= 19 ? 3 * r : 0.001;
    strokes.push(circle(0, 0, boundR, { group: 2, w: count > 19 ? 0.001 : 0.35 }));
    if (!icons) return strokes;
    // Rims for up to seven icons; those not shown wait, unseen, inside the
    // centre's (a rim of no size).
    const rims = [];
    for (let i = 0; i < 7; i++) {
      const [x, y] = i < icons ? slots[i].pos : [0, 0];
      rims.push(circle(x, y, i < icons ? ICON_RIM : 0.001, { group: 3, segs: 48, w: 1 }));
    }
    return { sets: [{ share: 0.8, strokes }, { share: 0.2, strokes: rims }] };
  },

  // Morning: a horizon and a circle rising over it, with rays.
  sunrise: () => {
    const rays = [];
    for (let k = 0; k < 5; k++) {
      const a = ((-60 + 30 * k) * Math.PI) / 180;
      rays.push(line([0.05 + Math.sin(a) * 0.46, 0.05 + Math.cos(a) * 0.46], [Math.sin(a) * 0.66, 0.05 + Math.cos(a) * 0.66], { group: 1 }));
    }
    return {
      sets: [
        { share: 0.42, strokes: [line([-1.2, 0], [1.2, 0], { group: 2 })] },
        { share: 0.43, strokes: [arc(0, 0.05, 0.32, -TAU / 4 - 0.05, TAU / 4 + 0.05, { group: 1 }), arc(0, 0.05, 0.32, TAU / 4 + 0.2, TAU * 0.75 - 0.2, { group: 1, w: 0.25 })] },
        { share: 0.15, strokes: rays },
      ],
    };
  },

  // Nine bells on one circle: the {9/4} star.
  star: (p = 9, q = 4) => {
    const verts = [];
    for (let k = 0; k < p; k++) verts.push(polar(1, (k * TAU) / p));
    const edges = [];
    let k = 0;
    for (let i = 0; i < p; i++) {
      const next = (k + q) % p;
      edges.push(line(verts[k], verts[next]));
      k = next;
    }
    return {
      sets: [
        { share: 0.62, strokes: edges },
        { share: 0.26, strokes: [circle(0, 0, 1, { group: 1 })] },
      ],
      clouds: [
        {
          share: 0.12,
          make: (n) => {
            const per = Math.floor(n / p);
            const out = [];
            for (let i = 0; i < p; i++) {
              const c = seedCloud(i === 0 ? n - per * (p - 1) : per, i === 0 ? 0.03 : 0.018, 0.1, 2, 40 + i);
              c.forEach((pt) => out.push([pt[0] + verts[i][0], pt[1] + verts[i][1], 0, 2]));
            }
            return out;
          },
        },
      ],
    };
  },

  // A small circle rolling inside a larger one.
  hypotrochoid: () => {
    const pts = [];
    const n = 1400;
    for (let i = 0; i <= n; i++) {
      const t = (i / n) * 6 * Math.PI;
      pts.push([(2 * Math.cos(t) + 5 * Math.cos((2 * t) / 3)) / 7, (2 * Math.sin(t) - 5 * Math.sin((2 * t) / 3)) / 7, 0]);
    }
    return [poly(pts)];
  },

  // Logarithmic (golden) spiral arms, like the app's default background.
  spiral: (arms = 6) => {
    const b = Math.log(PHI) / (Math.PI / 2);
    const strokes = [];
    for (let k = 0; k < arms; k++) {
      const pts = [];
      const rot = (k * TAU) / arms;
      for (let t = 0; t <= 1; t += 1 / 260) {
        const th = t * 3.4 * Math.PI;
        const r = 0.024 * Math.exp(b * th);
        if (r > 1.02) break;
        pts.push(polar(r, -(th + rot)));
      }
      strokes.push(poly(pts, { group: k % 2 }));
    }
    return strokes;
  },

  // Twenty-four circles, all through the centre: the body, breathing.
  circletorus: (count = 24) => {
    const rho = 0.5;
    const strokes = [];
    for (let c = 0; c < count; c++) {
      const a = (c / count) * TAU;
      strokes.push(circle(rho * Math.sin(a), rho * Math.cos(a), rho, { start: a + Math.PI, group: c % 2 }));
    }
    return strokes;
  },

  // Thirteen circles, every centre joined to every other: 78 lines. Groups
  // encode the nodes (0 to 12 for circles, 13 + a·13 + b for lines) so the
  // shader can light up one node's connections.
  metatron: () => {
    const nodes = METATRON_NODES;
    const circles = nodes.map(([x, y], i) => circle(x, y, 0.2, { group: i, segs: 96 }));
    const lines = [];
    for (let a = 0; a < nodes.length; a++) {
      for (let b = a + 1; b < nodes.length; b++) {
        lines.push({ l: Math.hypot(nodes[a][0] - nodes[b][0], nodes[a][1] - nodes[b][1]), s: line(nodes[a], nodes[b], { group: 13 + a * 13 + b }) });
      }
    }
    lines.sort((p, q) => p.l - q.l); // shortest first: they are drawn first
    return {
      sets: [
        { share: 0.45, strokes: circles },
        { share: 0.55, strokes: lines.map((x) => x.s) },
      ],
    };
  },

  // Where Loop shows a session, as outlines: 0 the Dynamic Island, 1 a Live
  // Activity on the Lock Screen, 2 a Control Center button, 3 a complication
  // on an Apple Watch. Outlines are group 0, what moves in them (the time
  // left, as an arc or a bar) group 1.
  surface: (kind = 0) => {
    const rect = (w, h, rad, opts) => roundedRect(w, h, rad, opts);
    const ring = (x, y, rad, frac, opts) => arc(x, y, rad, 0, TAU * frac, opts);
    const play = (x, y, size, opts) => {
      const pts = [0, 120, 240, 0].map((deg) => [x + size * Math.cos((deg * Math.PI) / 180), y + size * Math.sin((deg * Math.PI) / 180), 0]);
      return poly(pts, opts);
    };
    if (kind === 1) {
      return {
        sets: [
          { share: 0.62, strokes: [rect(1.84, 0.92, 0.24, { group: 0 }), circle(-0.6, 0.1, 0.13, { group: 0 })] },
          { share: 0.1, strokes: [line([-0.38, 0.18], [0.2, 0.18], { group: 0 }), line([-0.38, 0.02], [0.02, 0.02], { group: 0 })] },
          { share: 0.08, strokes: [line([-0.72, -0.24], [0.72, -0.24], { group: 0 })] },
          { share: 0.2, strokes: [line([-0.72, -0.24], [0.2, -0.24], { group: 1 }), play(0.56, 0.1, 0.09, { group: 1 })] },
        ],
      };
    }
    if (kind === 2) {
      return {
        sets: [
          { share: 0.7, strokes: [rect(1.1, 1.1, 0.3, { group: 0 })] },
          { share: 0.3, strokes: [play(0.04, 0, 0.22, { group: 1 })] },
        ],
      };
    }
    if (kind === 3) {
      return {
        sets: [
          { share: 0.5, strokes: [rect(1.32, 1.56, 0.42, { group: 0 })] },
          { share: 0.18, strokes: [circle(0, 0, 0.42, { group: 0, w: 0.4 })] },
          { share: 0.32, strokes: [ring(0, 0, 0.42, 0.7, { group: 1 }), play(0.02, 0, 0.1, { group: 1 })] },
        ],
      };
    }
    return {
      sets: [
        { share: 0.66, strokes: [rect(1.76, 0.5, 0.25, { group: 0 })] },
        { share: 0.1, strokes: [circle(-0.6, 0, 0.11, { group: 0 })] },
        { share: 0.24, strokes: [circle(0.6, 0, 0.11, { group: 0, w: 0.35 }), ring(0.6, 0, 0.11, 0.7, { group: 1 })] },
      ],
    };
  },

  // Privacy: your device inside your iCloud, closed. A line comes in, meets
  // the circle and leaves again (nodes.js). It is drawn whole here; the
  // scene's `dash` cuts it into dashes that travel along it.
  enclosure: (len = 1.2) => {
    const { from, hit, to } = ricochet(len);
    return {
      sets: [
        { share: 0.3, strokes: [circle(0, 0, 0.45)] },
        { share: 0.5, strokes: [circle(0, 0, ENCLOSURE_R, { group: 1 })] },
        { share: 0.2, strokes: [poly([from, hit, to].map(([x, y]) => [x, y, 0]), { group: 2 })] },
      ],
    };
  },
};

// Hexagonal lattice slots in spiral order (ring by ring, clockwise), each
// with a parent one ring inward.
function hexSlots(rings, r) {
  const axial = [];
  for (let q = -rings; q <= rings; q++) {
    for (let s = -rings; s <= rings; s++) {
      const t = -q - s;
      const ring = Math.max(Math.abs(q), Math.abs(s), Math.abs(t));
      if (ring > rings) continue;
      const x = r * (q + s / 2);
      const y = r * ((s * Math.sqrt(3)) / 2);
      let ang = Math.atan2(x, y);
      if (ang < 0) ang += TAU;
      axial.push({ q, s, ring, pos: [x, y], angle: ang, dist: Math.hypot(x, y) });
    }
  }
  axial.sort((a, b) => a.ring - b.ring || a.angle - b.angle);
  axial.forEach((slot, i) => {
    if (slot.ring === 0) {
      slot.parent = 0;
    } else {
      let best = 0;
      let bestD = Infinity;
      axial.forEach((o, j) => {
        if (o.ring !== slot.ring - 1) return;
        const d = Math.hypot(o.pos[0] - slot.pos[0], o.pos[1] - slot.pos[1]);
        if (d < bestD - 1e-9) {
          bestD = d;
          best = j;
        }
      });
      slot.parent = best;
    }
    slot.index = i;
    // A parked slot sits on its nearest visible ancestor.
    slot.parkedPos = function parkedPos(count, all) {
      let cur = this;
      while (cur.index >= count && cur.index !== 0) cur = all[cur.parent];
      return cur.pos;
    };
  });
  return axial;
}

// ── Logo (sampled from the app icon's layer SVGs) ──────────
// The mark is five sets of shapes, mirrored four ways: the eight segments of
// the ring, four chevrons, four brackets, four petals and the centre.
//
//   logo     the mark as it is, from the centre outward (two circles first).
//   logo:1   the hero's mark: a play triangle in place of the two circles,
//            and each set its own group (0 centre ... 4 ring), so the field
//            can bring it in set by set.

function logoStrokes(hero = 0) {
  if (typeof document === 'undefined') return [circle(0, 0, 1)];
  const ns = 'http://www.w3.org/2000/svg';
  const host = document.createElementNS(ns, 'svg');
  host.setAttribute('width', '0');
  host.setAttribute('height', '0');
  host.style.position = 'absolute';
  host.style.visibility = 'hidden';
  document.body.appendChild(host);

  // From the centre outward.
  const layers = [
    { svg: coreSvg, group: 0, set: 1 },
    { svg: bracketsSvg, group: 1, set: 2 },
    { svg: chevronsSvg, group: 0, set: 3 },
    { svg: ringSvg, group: 1, set: 4 },
  ];
  const strokes = [];
  let maxR = 0;
  const parser = new DOMParser();
  layers.forEach(({ svg, group, set }) => {
    const doc = parser.parseFromString(svg, 'image/svg+xml');
    doc.querySelectorAll('path').forEach((src) => {
      const d = src.getAttribute('d') || '';
      d.split(/(?=M)/).forEach((sub) => {
        const p = document.createElementNS(ns, 'path');
        p.setAttribute('d', sub);
        host.appendChild(p);
        const len = p.getTotalLength();
        const steps = Math.max(8, Math.round(len / 4));
        const pts = [];
        for (let i = 0; i <= steps; i++) {
          const q = p.getPointAtLength((i / steps) * len);
          const x = (q.x - 512) / 512;
          const y = -(q.y - 512) / 512;
          maxR = Math.max(maxR, Math.hypot(x, y));
          pts.push([x, y, 0]);
        }
        strokes.push({ pts, group: hero ? set : group, w: 1 });
      });
    });
  });
  document.body.removeChild(host);
  const k = maxR > 0 ? 1 / maxR : 1;
  strokes.forEach((s) => s.pts.forEach((p) => {
    p[0] *= k;
    p[1] *= k;
  }));

  if (!hero) {
    // The centre dot (r 44 of 1024) goes first.
    const dotR = (44 / 512) * k;
    return [circle(0, 0, dotR, { group: 2 }), circle(0, 0, dotR * 0.5, { group: 2 }), ...strokes];
  }

  // The play triangle, pointing right. Its centroid sits a little left of
  // the mark's centre: that is where it looks centred between the petals.
  const tr = LOGO_PLAY_R;
  const tx = -tr * 0.12;
  const corner = (deg) => [tx + tr * Math.cos((deg * Math.PI) / 180), tr * Math.sin((deg * Math.PI) / 180)];
  const [a, b, c] = [corner(0), corner(120), corner(240)];
  const fill = (n) => {
    const rand = rng(31);
    const out = [];
    for (let i = 0; i < n; i++) {
      let u = rand();
      let v = rand();
      if (u + v > 1) {
        u = 1 - u;
        v = 1 - v;
      }
      out.push([a[0] + (b[0] - a[0]) * u + (c[0] - a[0]) * v, a[1] + (b[1] - a[1]) * u + (c[1] - a[1]) * v, 0, 0]);
    }
    return out;
  };
  return {
    clouds: [{ share: 0.035, first: true, make: fill }],
    sets: [
      { share: 0.025, strokes: [poly([a, b, c, a].map(([x, y]) => [x, y, 0]), { group: 0 })] },
      { share: 0.94, strokes },
    ],
  };
}

// ── Builder ────────────────────────────────────────────────

const cache = new Map();

function parseKey(key) {
  const [name, arg] = key.split(':');
  const args = arg ? arg.split(',').map(Number) : [];
  return { name, args };
}

function normalise(fig) {
  if (Array.isArray(fig)) return { sets: [{ share: 1, strokes: fig }], clouds: [] };
  return { sets: fig.sets || [], clouds: fig.clouds || [] };
}

export function buildShape(key, count) {
  const cacheKey = `${key}@${count}`;
  if (cache.has(cacheKey)) return cache.get(cacheKey);

  const pos = new Float32Array(count * 3);
  const meta = new Float32Array(count * 2);
  const dust = Math.floor(count * DUST_FRACTION);
  const body = count - dust;

  const { name, args } = parseKey(key);
  let length = 0;
  let cloudShare = 0;

  if (name === 'point') {
    writeCloud(seedCloud(body, 0.02, 0.22, 1), pos, meta, 0);
    cloudShare = 1;
  } else if (name === 'brownian' || name === 'dust') {
    writeCloud(name === 'brownian' ? brownianWalk(body) : dustCloud(body), pos, meta, 0);
    cloudShare = 1;
  } else if (name === 'clock') {
    // The clock at zero; the field redraws it every frame (clock.js).
    writeClock(pos, meta, layoutClock(body));
    cloudShare = 1;
  } else if (name === 'flowspiral') {
    // The spiral at rest; the field redraws it every frame (flowspiral.js).
    writeSpiral(pos, meta, body);
    cloudShare = 1;
  } else if (name === 'intervals') {
    // Three bells, the session a third of the way round (intervals.js).
    writeIntervals(pos, meta, layoutIntervals(body), 5.5, args[0] || 3, intervalsState(args[0] || 3));
    cloudShare = 1;
  } else if (name === 'pulse') {
    // A calm pulse (pulse.js).
    const state = pulseState();
    state.beats = 0.6;
    writePulse(pos, meta, layoutPulse(body), state);
    cloudShare = 1;
  } else {
    const make = name === 'logo' ? logoStrokes : figures[name] || figures.circle;
    const { sets, clouds } = normalise(make(...args));
    const totalShare = [...sets, ...clouds].reduce((a, s) => a + s.share, 0) || 1;
    let offset = 0;
    // Strokes first, then clouds (a cloud marked `first` goes before them).
    const parts = [...clouds.filter((c) => c.first), ...sets, ...clouds.filter((c) => !c.first)];
    parts.forEach((part, i) => {
      const isLast = i === parts.length - 1;
      const n = isLast ? body - offset : Math.round((part.share / totalShare) * body);
      if (n <= 0) return;
      if (part.make) {
        writeCloud(part.make(n), pos, meta, offset);
        cloudShare += n / body;
      } else {
        length += sampleStrokes(part.strokes, n, pos, meta, offset);
      }
      offset += n;
    });
  }

  // Ambient dust lives in screen space (x, y in -1..1), identical in every shape.
  const rand = rng(1234);
  for (let i = body; i < count; i++) {
    pos[i * 3] = rand() * 2 - 1;
    pos[i * 3 + 1] = rand() * 2 - 1;
    pos[i * 3 + 2] = rand();
    meta[i * 2] = DUST_GROUP;
    meta[i * 2 + 1] = rand();
  }

  // Longer drawings spread the same points thinner; brighten them so every
  // figure reads at a similar intensity.
  const strokeGain = Math.min(3.4, Math.max(0.8, length / 6.5));
  const gain = GAIN[name] ?? (cloudShare > 0.6 ? 1.2 : strokeGain);

  const shape = { pos, meta, gain, body };
  cache.set(cacheKey, shape);
  return shape;
}

function brownianWalk(n) {
  const rand = rng(7);
  const out = [];
  let x = 0;
  let y = 0;
  let vx = 0;
  let vy = 0;
  for (let i = 0; i < n; i++) {
    vx = vx * 0.92 + (rand() - 0.5) * 0.016;
    vy = vy * 0.92 + (rand() - 0.5) * 0.016;
    x += vx;
    y += vy;
    const r = Math.hypot(x, y);
    if (r > 0.95) {
      x *= 0.95 / r;
      y *= 0.95 / r;
      vx *= -0.5;
      vy *= -0.5;
    }
    out.push([x, y, 0]);
  }
  return out;
}

function dustCloud(n) {
  const rand = rng(33);
  const out = [];
  for (let i = 0; i < n; i++) {
    const a = rand() * TAU;
    const r = 1.4 * Math.sqrt(rand());
    out.push([Math.sin(a) * r, Math.cos(a) * r, 0]);
  }
  return out;
}

// Per-point seeds shared by all shapes: [index fraction, r1, r2, r3].
export function buildSeeds(count) {
  const rand = rng(99);
  const seeds = new Float32Array(count * 4);
  for (let i = 0; i < count; i++) {
    seeds[i * 4] = i / count;
    seeds[i * 4 + 1] = rand();
    seeds[i * 4 + 2] = rand();
    seeds[i * 4 + 3] = rand();
  }
  return seeds;
}
