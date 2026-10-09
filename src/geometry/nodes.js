// Centres of the device graph (13 circles): 0 is the centre, 1 to 6 the
// inner ring and 7 to 12 the outer ring, clockwise from 30 degrees.
// Plate units, y up. Kept apart from shapes.js so labels can be placed
// without loading the shape library.

export const METATRON_NODES = (() => {
  const d = 0.4;
  const nodes = [[0, 0]];
  for (let ring = 1; ring <= 2; ring++) {
    for (let k = 0; k < 6; k++) {
      const a = (30 + 60 * k) * (Math.PI / 180);
      nodes.push([d * ring * Math.sin(a), d * ring * Math.cos(a)]);
    }
  }
  return nodes;
})();

// The privacy figure's dotted lines: each comes in, meets the outer circle
// and turns away at the same angle. Three, from different sides. Angles are
// clockwise from 12 o'clock. Returns [{ from, hit, to }] in plate units for
// legs `len` long.
const RICOCHETS = [
  { at: 60, spread: 50 },
  { at: 185, spread: -45 },
  { at: 295, spread: 55 },
];

export const ENCLOSURE_R = 0.9;

export function ricochets(len = 1.2) {
  const r = ENCLOSURE_R + 0.025;
  return RICOCHETS.map(({ at, spread }) => {
    const a = (at * Math.PI) / 180;
    const s = (spread * Math.PI) / 180;
    const hit = [r * Math.sin(a), r * Math.cos(a)];
    const leg = (d) => [hit[0] + len * Math.sin(d), hit[1] + len * Math.cos(d)];
    return { from: leg(a - s), hit, to: leg(a + s) };
  });
}

// The presets figure: circles of radius 0.5 on a hexagonal lattice, the
// scene turned 30 degrees. A preset's icon sits at the centre of a circle:
// the first at the middle, the next six on its rim, clockwise from 60
// degrees past 12 o'clock (the order the figure adds circles in). Plate
// units, y up. PRESET_ICON_R is the radius of the ring drawn round an icon.
export const PRESET_ICON_R = 0.135;

export function presetSlot(i, r = 0.5) {
  if (i === 0) return [0, 0];
  const a = (i * Math.PI) / 3;
  return [r * Math.sin(a), r * Math.cos(a)];
}

// The play triangle at the centre of the hero's mark: the radius of the
// circle through its corners, in plate units (the petals start at 0.22).
export const LOGO_PLAY_R = 0.105;
