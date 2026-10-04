// ParticleFrame: a pill's outline drawn in grains, like the figures in the
// geometry field. It fills its parent (absolute, inset 0), measures it, and
// scatters small dots along the parent's rounded-full edge, a little off the
// line, with a few loose grains drifting outside it. Decorative.
//
// Props
// - tone: 'bright' (denser, the field's glow green, with a soft halo) or
//   'soft' (sparser and dimmer, same green).
// - seed: number, so each frame has its own fixed scatter.
//
// The grains never move; a hover or focus on the parent (class `group`)
// brings them up a little.

import { useEffect, useMemo, useRef, useState } from 'react';

const TONES = {
  bright: { spacing: 1.35, jitter: 0.9, loose: 0.08, alpha: [0.45, 1], color: '#64D262', core: '#14E468', halo: 'drop-shadow(0 0 3px rgba(100, 210, 98, 0.55))' },
  soft: { spacing: 2.1, jitter: 0.8, loose: 0.05, alpha: [0.25, 0.75], color: '#64D262', core: '#9CC27A', halo: 'none' },
};

// A small deterministic random source.
function random(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), a | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// A point `s` px along a pill w x h (clockwise from the top left of its
// straight part) and the outward normal there.
function along(s, w, h) {
  const r = h / 2;
  const straight = Math.max(0, w - h);
  const half = Math.PI * r;
  if (s < straight) return [r + s, 0, 0, -1];
  s -= straight;
  if (s < half) {
    const a = -Math.PI / 2 + s / r;
    return [w - r + r * Math.cos(a), r + r * Math.sin(a), Math.cos(a), Math.sin(a)];
  }
  s -= half;
  if (s < straight) return [w - r - s, h, 0, 1];
  s -= straight;
  const a = Math.PI / 2 + s / r;
  return [r + r * Math.cos(a), r + r * Math.sin(a), Math.cos(a), Math.sin(a)];
}

export default function ParticleFrame({ tone = 'bright', seed = 1 }) {
  const ref = useRef(null);
  const [size, setSize] = useState(null);

  useEffect(() => {
    const el = ref.current && ref.current.parentElement;
    if (!el) return undefined;
    const measure = () => setSize([el.offsetWidth, el.offsetHeight]);
    measure();
    if (typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const t = TONES[tone] || TONES.bright;
  const grains = useMemo(() => {
    if (!size) return [];
    const [w, h] = size;
    const perimeter = 2 * Math.max(0, w - h) + Math.PI * h;
    const count = Math.round(perimeter / t.spacing);
    const rand = random(seed * 7919 + count);
    const out = [];
    for (let i = 0; i < count; i++) {
      const [x, y, nx, ny] = along(((i + rand()) / count) * perimeter, w, h);
      const loose = rand() < t.loose;
      // Mostly on the line; a few drift outward and fade.
      const off = loose ? 1.5 + rand() * 4 : (rand() + rand() - 1) * t.jitter;
      const [a0, a1] = t.alpha;
      out.push({
        x: x + nx * off,
        y: y + ny * off,
        r: loose ? 0.4 + rand() * 0.3 : 0.45 + rand() * 0.55,
        o: loose ? a0 * 0.6 * rand() : a0 + (a1 - a0) * rand(),
        core: !loose && rand() < 0.18,
      });
    }
    return out;
  }, [size, seed, t]);

  return (
    <svg
      ref={ref}
      aria-hidden="true"
      focusable="false"
      className="pointer-events-none absolute inset-0 h-full w-full overflow-visible opacity-85 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100"
      style={{ filter: t.halo }}
    >
      {grains.map((g, i) => (
        <circle key={i} cx={g.x.toFixed(2)} cy={g.y.toFixed(2)} r={g.r.toFixed(2)} fill={g.core ? t.core : t.color} opacity={g.o.toFixed(2)} />
      ))}
    </svg>
  );
}
