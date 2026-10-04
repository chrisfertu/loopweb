// Negative-space figures for the sounds stage: a disc of seeds whose grains
// step aside to leave a shape empty. Every figure is the same disc (Vogel's
// model, the golden angle), so from figure to figure only the displaced
// grains move.
//
// A silhouette is { cut: [inside tests], keep: [inside tests] }: a grain is
// moved when it falls in any `cut` region and in no `keep` region (an island
// of grains left inside the empty shape: the note on the file, the eye of the
// bird). Units are plate units; the disc has radius DISC_R.

const TAU = Math.PI * 2;
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));

export const DISC_R = 0.94;

// In shape keys the figure is a number: 'cutout:1' is the bird.
export const CUTOUTS = ['file', 'bird', 'handpan', 'music'];

// ── Inside tests ───────────────────────────────────────────
// Each test carries its bounding box, so most of the grid is skipped.

const boxed = (test, x0, y0, x1, y1) => (x, y) => x >= x0 && x <= x1 && y >= y0 && y <= y1 && test(x, y);

const turn = (x, y, a) => {
  const c = Math.cos(a);
  const s = Math.sin(a);
  return [x * c + y * s, -x * s + y * c];
};

// a: counter-clockwise rotation in degrees.
const ellipse = (cx, cy, rx, ry, a = 0) => {
  const rad = (a * Math.PI) / 180;
  const r = Math.max(rx, ry);
  return boxed(
    (x, y) => {
      const [u, v] = turn(x - cx, y - cy, rad);
      return (u * u) / (rx * rx) + (v * v) / (ry * ry) <= 1;
    },
    cx - r,
    cy - r,
    cx + r,
    cy + r,
  );
};

const disc = (cx, cy, r) => ellipse(cx, cy, r, r);

const ring = (cx, cy, r, t) =>
  boxed((x, y) => Math.abs(Math.hypot(x - cx, y - cy) - r) <= t / 2, cx - r - t, cy - r - t, cx + r + t, cy + r + t);

const roundRect = (cx, cy, w, h, r = 0) =>
  boxed(
    (x, y) => {
      const qx = Math.abs(x - cx) - (w / 2 - r);
      const qy = Math.abs(y - cy) - (h / 2 - r);
      return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) <= r;
    },
    cx - w / 2,
    cy - h / 2,
    cx + w / 2,
    cy + h / 2,
  );

// A rounded square's outline, t thick.
const roundFrame = (cx, cy, w, r, t) => {
  const outer = roundRect(cx, cy, w + t, w + t, r + t / 2);
  const inner = roundRect(cx, cy, w - t, w - t, Math.max(0, r - t / 2));
  return (x, y) => outer(x, y) && !inner(x, y);
};

// A thick line with round ends.
const capsule = (ax, ay, bx, by, r) => {
  const dx = bx - ax;
  const dy = by - ay;
  const len = dx * dx + dy * dy || 1;
  return boxed(
    (x, y) => {
      const t = Math.min(1, Math.max(0, ((x - ax) * dx + (y - ay) * dy) / len));
      return Math.hypot(x - ax - dx * t, y - ay - dy * t) <= r;
    },
    Math.min(ax, bx) - r,
    Math.min(ay, by) - r,
    Math.max(ax, bx) + r,
    Math.max(ay, by) + r,
  );
};

const polygon = (pts) => {
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  pts.forEach(([x, y]) => {
    x0 = Math.min(x0, x);
    y0 = Math.min(y0, y);
    x1 = Math.max(x1, x);
    y1 = Math.max(y1, y);
  });
  return boxed(
    (x, y) => {
      let inside = false;
      for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
        const [xi, yi] = pts[i];
        const [xj, yj] = pts[j];
        if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
      }
      return inside;
    },
    x0,
    y0,
    x1,
    y1,
  );
};

// A closed smooth outline through `pts` (Catmull-Rom), as a polygon.
const blob = (pts, steps = 10) => {
  const out = [];
  const n = pts.length;
  const at = (a, b, c, d, t) => {
    const t2 = t * t;
    const t3 = t2 * t;
    return 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
  };
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n];
    const p1 = pts[i];
    const p2 = pts[(i + 1) % n];
    const p3 = pts[(i + 2) % n];
    for (let s = 0; s < steps; s++) {
      const t = s / steps;
      out.push([at(p0[0], p1[0], p2[0], p3[0], t), at(p0[1], p1[1], p2[1], p3[1], t)]);
    }
  }
  return polygon(out);
};

// ── Parts ──────────────────────────────────────────────────

// Two beamed eighth notes, about 1 wide and 1.1 tall at scale 1.
const beamedNotes = (cx, cy, s) => {
  const P = (x, y) => [cx + x * s, cy + y * s];
  return [
    ellipse(...P(-0.3, -0.4), 0.2 * s, 0.145 * s, 20),
    ellipse(...P(0.3, -0.27), 0.2 * s, 0.145 * s, 20),
    capsule(...P(-0.16, -0.38), ...P(-0.16, 0.36), 0.045 * s),
    capsule(...P(0.44, -0.25), ...P(0.44, 0.49), 0.045 * s),
    polygon([P(-0.205, 0.4), P(0.485, 0.545), P(0.485, 0.33), P(-0.205, 0.185)]),
  ];
};

// One eighth note with its flag.
const note = (cx, cy, s) => {
  const P = (x, y) => [cx + x * s, cy + y * s];
  return [
    ellipse(...P(-0.1, -0.36), 0.2 * s, 0.145 * s, 20),
    capsule(...P(0.06, -0.34), ...P(0.06, 0.42), 0.045 * s),
    blob([P(0.03, 0.47), P(0.2, 0.34), P(0.36, 0.16), P(0.34, -0.06), P(0.27, 0.06), P(0.14, 0.18), P(0.03, 0.22)], 8),
  ];
};

// ── Silhouettes ────────────────────────────────────────────

const SILHOUETTES = {
  // An audio file: a sheet with its corner folded, and a note on it.
  file: () => {
    const w = 0.84;
    const h = 1.1;
    const fold = 0.28;
    const x0 = -w / 2;
    const x1 = w / 2;
    const y0 = -h / 2;
    const y1 = h / 2;
    const sheet = polygon([
      [x0, y0],
      [x1, y0],
      [x1, y1 - fold],
      [x1 - fold, y1],
      [x0, y1],
    ]);
    const corners = roundRect(0, 0, w, h, 0.07);
    return {
      cut: [(x, y) => sheet(x, y) && corners(x, y)],
      keep: [
        ...note(-0.02, -0.12, 0.62),
        // The folded corner: a triangle of grains just inside the cut.
        polygon([
          [x1 - fold - 0.005, y1 - 0.06],
          [x1 - fold - 0.005, y1 - fold - 0.005],
          [x1 - 0.06, y1 - fold - 0.005],
        ]),
      ],
    };
  },

  // A songbird on a branch, facing right.
  bird: () => {
    const k = 0.9;
    const P = (x, y) => [(x + 0.05) * k, (y + 0.1) * k];
    const Ps = (list) => list.map(([x, y]) => P(x, y));
    const wingOuter = blob(Ps([[0.1, 0.12], [-0.12, 0.02], [-0.42, -0.16], [-0.2, -0.24], [0.06, -0.2], [0.22, -0.04]]));
    const wingInner = blob(Ps([[0.08, 0.06], [-0.1, -0.02], [-0.32, -0.15], [-0.18, -0.19], [0.04, -0.15], [0.17, -0.03]]));
    return {
      cut: [
        // body and head, one outline, from the brow round by the back
        blob(
          Ps([
            [0.56, 0.3],
            [0.45, 0.43],
            [0.27, 0.4],
            [0.08, 0.24],
            [-0.2, 0.06],
            [-0.5, -0.12],
            [-0.45, -0.24],
            [-0.18, -0.36],
            [0.12, -0.4],
            [0.38, -0.28],
            [0.52, -0.06],
            [0.58, 0.14],
          ]),
        ),
        polygon(Ps([[0.55, 0.32], [0.84, 0.2], [0.56, 0.12]])), // beak
        polygon(Ps([[-0.4, -0.06], [-0.92, -0.3], [-0.88, -0.43], [-0.74, -0.4], [-0.36, -0.26]])), // tail
        capsule(...P(0.0, -0.36), ...P(-0.04, -0.58), 0.022 * k), // legs
        capsule(...P(0.16, -0.37), ...P(0.14, -0.58), 0.022 * k),
        capsule(...P(-0.62, -0.6), ...P(0.62, -0.6), 0.03 * k), // branch
      ],
      keep: [
        disc(...P(0.47, 0.27), 0.04 * k), // eye
        (x, y) => wingOuter(x, y) && !wingInner(x, y), // wing, a crescent of grains
      ],
    };
  },

  // A handpan from above: the centre note and eight tone fields around it.
  handpan: () => {
    const cut = [disc(0, 0, 0.2), ring(0, 0, 0.85, 0.045)];
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * TAU + TAU / 16;
      // Bigger fields for the low notes, as on the instrument.
      const size = 1 - 0.035 * Math.min(k, 8 - k);
      cut.push(ellipse(Math.sin(a) * 0.55, Math.cos(a) * 0.55, 0.16 * size, 0.122 * size, -((a * 180) / Math.PI)));
    }
    return { cut, keep: [] };
  },

  // Apple Music: two beamed notes on a rounded square.
  music: () => ({
    cut: [roundFrame(0, 0, 1.14, 0.27, 0.05), ...beamedNotes(-0.06, -0.02, 0.74)],
    keep: [],
  }),
};

// ── Carving ────────────────────────────────────────────────

const GRID = 256;
const SPAN = 1.06; // the grid covers [-SPAN, SPAN] on both axes
const CELL = (2 * SPAN) / GRID;
const MARGIN = 0.012; // how far past the edge a moved grain lands, at least
const BAND = 0.06; // ...and at most this much further

const carved = new Map();

function carve(name) {
  if (carved.has(name)) return carved.get(name);
  const make = SILHOUETTES[name];
  if (!make) return null;
  const { cut, keep } = make();
  const test = (x, y) => cut.some((f) => f(x, y)) && !keep.some((f) => f(x, y));
  const grid = new Uint8Array(GRID * GRID);
  for (let j = 0; j < GRID; j++) {
    for (let i = 0; i < GRID; i++) {
      grid[j * GRID + i] = test(-SPAN + (i + 0.5) * CELL, -SPAN + (j + 0.5) * CELL) ? 1 : 0;
    }
  }
  // Edge cells: outside the shape, touching it.
  const edge = [];
  for (let j = 1; j < GRID - 1; j++) {
    for (let i = 1; i < GRID - 1; i++) {
      if (grid[j * GRID + i]) continue;
      if (grid[j * GRID + i - 1] || grid[j * GRID + i + 1] || grid[(j - 1) * GRID + i] || grid[(j + 1) * GRID + i]) {
        edge.push(-SPAN + (i + 0.5) * CELL, -SPAN + (j + 0.5) * CELL);
      }
    }
  }
  const inside = (x, y) => {
    const i = Math.floor((x + SPAN) / CELL);
    const j = Math.floor((y + SPAN) / CELL);
    return i >= 0 && j >= 0 && i < GRID && j < GRID && grid[j * GRID + i] === 1;
  };
  const out = { inside, edge: Float32Array.from(edge) };
  carved.set(name, out);
  return out;
}

// The disc with figure `index` (into CUTOUTS) left empty: n points as
// [x, y, 0, group]. Grains that fall in the shape move to the nearest edge
// and a little past it, so the empty shape gets a bright rim. `rand` is a
// seeded generator (0..1). An unknown index returns the plain disc.
export function cutoutDisc(n, index, rand, group = 1) {
  const shape = carve(CUTOUTS[index]);
  const out = [];
  for (let i = 0; i < n; i++) {
    const r = DISC_R * Math.sqrt((i + 0.5) / n);
    const a = i * GOLDEN_ANGLE;
    let x = Math.sin(a) * r;
    let y = Math.cos(a) * r;
    const jitter = rand();
    if (shape && shape.inside(x, y)) {
      const { edge } = shape;
      let best = -1;
      let bestD = Infinity;
      for (let k = 0; k < edge.length; k += 2) {
        const dx = edge[k] - x;
        const dy = edge[k + 1] - y;
        const d = dx * dx + dy * dy;
        if (d < bestD) {
          bestD = d;
          best = k;
        }
      }
      if (best >= 0) {
        const ex = edge[best];
        const ey = edge[best + 1];
        const d = Math.sqrt(bestD) || 1;
        const push = MARGIN + BAND * jitter * jitter;
        const tx = ex + ((ex - x) / d) * push;
        const ty = ey + ((ey - y) / d) * push;
        // A thin part of the shape may be on the other side: stay on the edge.
        const ok = !shape.inside(tx, ty) && Math.hypot(tx, ty) <= DISC_R + 0.04;
        x = ok ? tx : ex;
        y = ok ? ty : ey;
      }
    }
    out.push([x, y, 0, group]);
  }
  return out;
}
