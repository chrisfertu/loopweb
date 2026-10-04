// The timer figure: a running clock drawn in grains.
//
//   digits   MM:SS in the middle, counting up from 00:00, in wide round
//            figures of one width. Each digit is one light stroke; when a
//            digit changes its grains travel to the new one.
//   marks    sixty second marks round the edge (every fifth one longer). As
//            the clock runs, the mark of each second dissolves; it comes back
//            thirty seconds later, so half the ring is always away.
// Every grain belongs to LIVE_GROUP: its brightness is its second meta value,
// so a mark can fade grain by grain. The static shape (`writeClock`
// at zero seconds) is what other figures morph to and from; the field then
// redraws it every frame through `tickClock`.
//
// Units: plate units, radius 1 = half the anchor's shorter side.

const TAU = Math.PI * 2;

export const LIVE_GROUP = 901;

// ── Digits ─────────────────────────────────────────────────
// Glyphs live in a cell 0.7 wide and 1 tall (origin bottom left, y up), all
// of one width, with round bowls: the zero is a full, soft oval.

const CELL_W = 0.7;

const seg = (...pts) => pts;

// Part of an ellipse, from a0 to a1 degrees (counter-clockwise from 3 o'clock).
const sweep = (cx, cy, rx, ry, a0, a1) => {
  const n = Math.max(8, Math.ceil(Math.abs(a1 - a0) / 6));
  const out = [];
  for (let i = 0; i <= n; i++) {
    const a = ((a0 + ((a1 - a0) * i) / n) * Math.PI) / 180;
    out.push([cx + rx * Math.cos(a), cy + ry * Math.sin(a)]);
  }
  return out;
};

// A closed oval that is fuller than an ellipse (a superellipse, power 2.5).
const oval = (cx, cy, rx, ry) => {
  const out = [];
  for (let i = 0; i <= 72; i++) {
    const a = (i / 72) * TAU + TAU / 4;
    const c = Math.cos(a);
    const sn = Math.sin(a);
    out.push([cx + rx * Math.sign(c) * Math.abs(c) ** 0.8, cy + ry * Math.sign(sn) * Math.abs(sn) ** 0.8]);
  }
  return out;
};

// A quadratic curve from a to b, pulled toward c.
const curve = (a, c, b) => {
  const out = [];
  for (let i = 0; i <= 14; i++) {
    const t = i / 14;
    const u = 1 - t;
    out.push([u * u * a[0] + 2 * u * t * c[0] + t * t * b[0], u * u * a[1] + 2 * u * t * c[1] + t * t * b[1]]);
  }
  return out;
};

const SIX = [[...curve([0.55, 1], [0.13, 0.84], [0.04, 0.36]), ...sweep(0.35, 0.31, 0.31, 0.31, 172, -188)]];

const GLYPHS = {
  0: [oval(0.35, 0.5, 0.31, 0.5)],
  1: [seg([0.12, 0.76], [0.38, 1], [0.38, 0]), seg([0.12, 0], [0.64, 0])],
  2: [[...sweep(0.35, 0.7, 0.3, 0.3, 165, -40), [0.05, 0], [0.66, 0]]],
  3: [[...sweep(0.33, 0.745, 0.27, 0.255, 150, -90), ...sweep(0.33, 0.25, 0.31, 0.25, 90, -150)]],
  4: [seg([0.53, 0], [0.53, 1], [0.03, 0.3], [0.67, 0.3])],
  5: [[[0.6, 1], [0.15, 1], [0.1, 0.56], ...sweep(0.33, 0.31, 0.33, 0.31, 125, -150)]],
  6: SIX,
  7: [seg([0.04, 1], [0.66, 1], [0.26, 0])],
  8: [[...sweep(0.35, 0.755, 0.255, 0.245, -90, 270), ...sweep(0.35, 0.265, 0.31, 0.265, 90, -270)]],
  // A six turned upside down.
  9: SIX.map((stroke) => stroke.map(([x, y]) => [CELL_W - x, 1 - y])),
};

// `n` points along a glyph's strokes, evenly by length: [x0, y0, x1, y1, ...].
function sampleGlyph(strokes, n) {
  const segs = [];
  let total = 0;
  strokes.forEach((pts) => {
    for (let i = 1; i < pts.length; i++) {
      const len = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
      if (len > 0) segs.push([pts[i - 1], pts[i], total, len]);
      total += len;
    }
  });
  const out = new Float32Array(n * 2);
  let k = 0;
  for (let i = 0; i < n; i++) {
    const at = ((i + 0.5) / n) * total;
    while (k < segs.length - 1 && segs[k][2] + segs[k][3] < at) k++;
    const [a, b, start, len] = segs[k];
    const f = Math.min(1, Math.max(0, (at - start) / len));
    out[i * 2] = a[0] + (b[0] - a[0]) * f;
    out[i * 2 + 1] = a[1] + (b[1] - a[1]) * f;
  }
  return out;
}

// ── Layout ─────────────────────────────────────────────────

const DIGIT_H = 0.26; // height of a digit
const DIGIT_GAP = 0.2; // between cells, in digit heights
const COLON_W = 0.22; // the colon's cell, in digit heights
const COLON_R = 0.045; // its two dots, in digit heights

const MARKS = 60;
const MARK_AWAY = 30; // seconds a mark stays away
const MARK_FADE = 0.9; // seconds to dissolve, and to come back

const DIGIT_MORPH = 0.3; // seconds for a digit's grains to reach the next one

// x of each digit cell's left edge (plate units), and of the colon's centre.
const CELLS = (() => {
  const w = CELL_W * DIGIT_H;
  const gap = DIGIT_GAP * DIGIT_H;
  const colon = COLON_W * DIGIT_H;
  const total = 4 * w + colon + 4 * gap;
  const x0 = -total / 2;
  return {
    digits: [x0, x0 + w + gap, x0 + 2 * w + 3 * gap + colon, x0 + 3 * w + 4 * gap + colon],
    colon: x0 + 2 * w + 2 * gap + colon / 2,
    y0: -DIGIT_H / 2,
  };
})();

// Where each kind of grain sits in a body of `body` points: the digits and
// the colon take two fifths, the sixty marks the rest.
export function layoutClock(body) {
  const perDigit = Math.round(body * 0.095);
  const colon = Math.round(body * 0.02);
  const colonAt = perDigit * 4;
  const marks = colonAt + colon;
  const perMark = Math.floor((body - marks) / MARKS);
  return { body, perDigit, colon, colonAt, perMark, marks, end: marks + perMark * MARKS };
}

const glyphCache = new Map();
function glyph(d, n) {
  const key = `${d}@${n}`;
  if (!glyphCache.has(key)) glyphCache.set(key, sampleGlyph(GLYPHS[d], n));
  return glyphCache.get(key);
}

// Deterministic 0..1 for grain i (stream k).
const noise = (i, k) => {
  const x = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453;
  return x - Math.floor(x);
};

const smooth = (x) => {
  const t = Math.min(1, Math.max(0, x));
  return t * t * (3 - 2 * t);
};

const digitsOf = (seconds) => {
  const s = Math.floor(seconds) % 6000;
  const m = Math.floor(s / 60);
  const r = s % 60;
  return [Math.floor(m / 10), m % 10, Math.floor(r / 10), r % 10];
};

// How present mark k is (0 away, 1 there) at `elapsed` seconds. The mark of
// second s leaves at s and returns at s + MARK_AWAY.
function markLevel(k, elapsed) {
  if (elapsed < 1) return 1;
  // The latest second at or before now whose mark is k.
  const left = Math.floor(elapsed) - ((((Math.floor(elapsed) - k) % MARKS) + MARKS) % MARKS);
  if (left < 1) return 1;
  const since = elapsed - left;
  if (since < MARK_AWAY) return 1 - smooth(since / MARK_FADE);
  return smooth((since - MARK_AWAY) / MARK_FADE);
}

// Write the whole figure at `elapsed` seconds on the clock. `state`
// (optional) remembers each digit so a change can travel:
// { shown: [d, d, d, d], from: [d, d, d, d], since: [t, t, t, t] }.
export function writeClock(pos, meta, layout, elapsed = 0, state = null) {
  const { body, perDigit, colon, colonAt, perMark, marks, end } = layout;
  const put = (i, x, y, a) => {
    pos[i * 3] = x;
    pos[i * 3 + 1] = y;
    pos[i * 3 + 2] = 0;
    meta[i * 2] = LIVE_GROUP;
    meta[i * 2 + 1] = a;
  };

  // Digits
  const now = digitsOf(elapsed);
  for (let c = 0; c < 4; c++) {
    let from = now[c];
    let f = 1;
    if (state) {
      if (state.shown[c] !== now[c]) {
        state.from[c] = state.shown[c];
        state.shown[c] = now[c];
        state.since[c] = Math.floor(elapsed);
      }
      from = state.from[c];
      f = smooth((elapsed - state.since[c]) / DIGIT_MORPH);
    }
    const to = glyph(now[c], perDigit);
    const src = f < 1 ? glyph(from, perDigit) : to;
    const x0 = CELLS.digits[c];
    for (let i = 0; i < perDigit; i++) {
      // Grains leave a little apart, so a change reads as a pour, not a slide.
      const g = f >= 1 ? 1 : smooth(f * 1.4 - noise(i, c) * 0.4);
      const gx = src[i * 2] + (to[i * 2] - src[i * 2]) * g;
      const gy = src[i * 2 + 1] + (to[i * 2 + 1] - src[i * 2 + 1]) * g;
      put(c * perDigit + i, x0 + gx * DIGIT_H, CELLS.y0 + gy * DIGIT_H, 1);
    }
  }

  // Colon: two small rings
  for (let i = 0; i < colon; i++) {
    const top = i % 2 === 0;
    const a = (i / colon) * TAU;
    const r = COLON_R * DIGIT_H;
    put(colonAt + i, CELLS.colon + Math.cos(a) * r, (top ? 0.2 : -0.2) * DIGIT_H + Math.sin(a) * r, 1);
  }

  // Second marks: as it leaves, a mark's grains loosen outward.
  for (let k = 0; k < MARKS; k++) {
    const a = (k / MARKS) * TAU;
    const sin = Math.sin(a);
    const cos = Math.cos(a);
    const r1 = k % 5 === 0 ? 1.14 : 1.09;
    const level = markLevel(k, elapsed);
    const away = 1 - level;
    for (let j = 0; j < perMark; j++) {
      const i = marks + k * perMark + j;
      const r = 1.05 + ((r1 - 1.05) * (j + 0.5)) / perMark + away * (0.03 + 0.09 * noise(i, 1));
      const side = away * (noise(i, 2) - 0.5) * 0.07;
      put(i, sin * r + cos * side, cos * r - sin * side, level);
    }
  }

  // The few grains left over rest, unseen, at the centre.
  for (let i = end; i < body; i++) put(i, 0, 0, 0);
}

// A fresh memory of the digits (all zero).
export const clockState = () => ({ shown: [0, 0, 0, 0], from: [0, 0, 0, 0], since: [-1e9, -1e9, -1e9, -1e9] });
