// Small pictures of the sound figures, for the sound section's choices.
// Each is drawn for the web after the figure it stands for: a horizon for
// silence, a cloud of grains for noise, two waves for binaural beats, and,
// for each beat, its own mandala (one petal per hertz). Decorative
// (aria-hidden): the button around it has the name.
//
// Props: color (CSS colour; currentColor by default), className.

const BOX = 40;
const C = BOX / 2;
const LINE = { fill: 'none', strokeWidth: 1.6, strokeLinecap: 'round', strokeLinejoin: 'round' };

function Svg({ className, children }) {
  return (
    <svg viewBox={`0 0 ${BOX} ${BOX}`} width="100%" height="100%" aria-hidden="true" focusable="false" className={className}>
      {children}
    </svg>
  );
}

// A sine wave across the box: `cycles` across it, amplitude `amp`, centred
// on `y`.
function wave(cycles, amp, y, from = 5, to = BOX - 5) {
  const steps = 48;
  let d = '';
  for (let i = 0; i <= steps; i++) {
    const x = from + ((to - from) * i) / steps;
    const v = y - amp * Math.sin((i / steps) * cycles * Math.PI * 2);
    d += `${i ? 'L' : 'M'}${x.toFixed(2)} ${v.toFixed(2)}`;
  }
  return d;
}

// Grains in a soft round cloud, densest in the middle. Fixed positions, so
// every render draws the same cloud.
const GRAINS = Array.from({ length: 64 }, (_, i) => {
  const jitter = 0.5 + 0.5 * Math.sin(i * 12.9898);
  const r = 13 * Math.sqrt((i + 0.5) / 64) * (0.78 + 0.3 * jitter);
  const a = i * 2.39996;
  return [C + r * Math.cos(a), C + r * Math.sin(a), 0.65 + 0.55 * (1 - r / 16), 0.45 + 0.55 * (1 - r / 16)];
});

export function NoiseCloud({ color = 'currentColor', className }) {
  return (
    <Svg className={className}>
      {GRAINS.map(([x, y, size, alpha], i) => (
        <circle key={i} cx={x.toFixed(2)} cy={y.toFixed(2)} r={size.toFixed(2)} fill={color} opacity={alpha.toFixed(2)} />
      ))}
    </Svg>
  );
}

export function SilenceIcon({ color = 'currentColor', className }) {
  return (
    <Svg className={className}>
      <path d={`M5 ${C + 3}H${BOX - 5}`} stroke={color} {...LINE} />
      <path d={`M12 ${C - 4}H${BOX - 12}`} stroke={color} {...LINE} opacity="0.35" />
    </Svg>
  );
}

export function BinauralIcon({ color = 'currentColor', className }) {
  return (
    <Svg className={className}>
      <path d={wave(2, 6, C)} stroke={color} {...LINE} />
      <path d={wave(2.5, 6, C)} stroke={color} {...LINE} opacity="0.5" />
    </Svg>
  );
}

// One petal, a pointed lens from `inner` to `outer` (in units of the
// icon's radius) along angle `a`, `width` at its widest.
function petal(a, inner, outer, width) {
  const [sx, sy] = [Math.sin(a), -Math.cos(a)];
  const [nx, ny] = [-sy, sx];
  const p = (t, side) => {
    const along = (inner + (outer - inner) * t) * MANDALA_R;
    const half = width * MANDALA_R * Math.sin(Math.PI * t) * side;
    return `${(C + sx * along + nx * half).toFixed(2)} ${(C + sy * along + ny * half).toFixed(2)}`;
  };
  return `M${p(0, 1)}Q${p(0.5, 2)} ${p(1, 1)}Q${p(0.5, -2)} ${p(0, 1)}Z`;
}

const MANDALA_R = 17;

// A beat's own figure, the mandala the field draws for it (mandala:n in
// shapes.js): one petal per hertz, smaller petals between them, a dot at
// each tip, a circle at the centre and a ring around it all.
export function BeatIcon({ beat, color = 'currentColor', className }) {
  const n = beat;
  const gap = Math.PI / n;
  const outerW = Math.min(0.3, 0.66 * Math.sin(gap));
  const innerW = Math.min(0.2, 0.5 * Math.sin(gap));
  const thin = n > 8 ? 0.7 : 1;
  const parts = [];
  for (let i = 0; i < n; i++) {
    const a = (i * Math.PI * 2) / n;
    parts.push(<path key={`o${i}`} d={petal(a, 0.2, 0.86, outerW)} stroke={color} {...LINE} strokeWidth={1.1 * thin} />);
    parts.push(<path key={`i${i}`} d={petal(a + gap, 0.2, 0.58, innerW)} stroke={color} {...LINE} strokeWidth={0.9 * thin} opacity="0.7" />);
    if (n <= 10) {
      parts.push(
        <circle key={`t${i}`} cx={(C + Math.sin(a) * 0.95 * MANDALA_R).toFixed(2)} cy={(C - Math.cos(a) * 0.95 * MANDALA_R).toFixed(2)} r="0.9" fill={color} />,
      );
    }
  }
  return (
    <Svg className={className}>
      {parts}
      <circle cx={C} cy={C} r={0.2 * MANDALA_R} stroke={color} {...LINE} strokeWidth="1" />
    </Svg>
  );
}
