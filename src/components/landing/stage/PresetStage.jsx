// PresetStage: preset icons on the presets figure. It fills the square
// "presets" anchor, where the field draws circles of radius 0.5 and, at the
// centre of each of the first seven, the rim of an icon (presetSlot and
// PRESET_ICON_R in nodes.js).
//
// Each icon is a black disc inside its rim, showing the icon of a preset
// (presets.examples): the one the app starts with, then six someone might
// make: focus, sleep, walk, dance, breathe, evening. The first `shown` icons
// are on the figure (the section brings them in one by one); the others
// wait, unseen.
//
// One preset is "on" at a time (`active`, -1 for none): bright, with its
// name and what it is set to in the caption under the figure (rendered by
// the section). A tap calls onChoose with that preset.
//
// Props: shown (number of icons), active (index), onChoose(i), className.

import { m as motion } from 'framer-motion';
import { presets as COPY } from '../../../content/copy';
import { presetSlot, PRESET_ICON_R } from '../../../geometry/nodes';
import { FOCUS_RING } from '../links';
import { PRESET_ICONS } from './icons';

const EXAMPLES = COPY.examples;

// The disc sits just inside the rim the field draws.
const DISC = `${(PRESET_ICON_R * 100 * 0.94).toFixed(2)}%`;

const at = (i) => {
  const [x, y] = presetSlot(i);
  return { left: `${50 + x * 50}%`, top: `${50 - y * 50}%` };
};

export default function PresetStage({ shown, active, onChoose, className = '' }) {
  return (
    <ul aria-label={COPY.listLabel} className={`absolute inset-0 m-0 list-none p-0 ${className}`}>
      {EXAMPLES.map((p, i) => {
        const Icon = PRESET_ICONS[p.icon];
        const visible = i < shown;
        const on = i === active;
        return (
          <motion.li
            key={p.key}
            className="absolute"
            style={{ ...at(i), width: `max(44px, ${DISC})`, aspectRatio: '1', x: '-50%', y: '-50%' }}
            initial={false}
            animate={{ opacity: visible ? 1 : 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          >
            <button
              type="button"
              onClick={() => onChoose(i)}
              aria-label={COPY.showLabel(p.name)}
              aria-pressed={on}
              tabIndex={visible ? undefined : -1}
              className={`group absolute inset-0 flex items-center justify-center rounded-full ${FOCUS_RING} ${
                visible ? '' : 'pointer-events-none'
              }`}
            >
              <span
                className="flex aspect-square items-center justify-center rounded-full bg-black"
                style={{ width: `min(100%, max(36px, ${DISC}))` }}
              >
                <span
                  aria-hidden="true"
                  className={`block h-[52%] w-[52%] transition-colors duration-500 ${
                    on ? 'text-white' : 'text-white/45 group-hover:text-white/75'
                  }`}
                >
                  {Icon ? <Icon /> : null}
                </span>
              </span>
            </button>
          </motion.li>
        );
      })}
    </ul>
  );
}
