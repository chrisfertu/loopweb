// Digits: the app's odometer. Each character sits in a fixed cell (0.591em,
// the colon narrower) so the face never shifts as digits change. When a
// digit changes, the old one rolls up and out while the new one rises from
// below (0.5s ease in-out, 72/88 of the font size, fading along the way);
// unchanged digits stay. A cell that appears or disappears (9 to 10) grows
// or shrinks in width, so the face stays centred. ∞ and the colon crossfade.
//
// Props
// - value: the string to show, e.g. "10", "09:59", "1:30", "∞".
// - className, style: for the row (set the font size here; the cells and
//   the roll are in em).
//
// Reduced motion, or Pause motion: a plain swap.

import { AnimatePresence, m as motion, useReducedMotion } from 'framer-motion';
import { useMotionPaused } from '../useMotionPaused';

const CELL = 52 / 88;
const ROLL = 72 / 88;
const DIGIT = /^[0-9]$/;
const ROLL_TRANSITION = { duration: 0.5, ease: 'easeInOut' };

const widthOf = (ch) => {
  if (DIGIT.test(ch)) return CELL;
  if (ch === ':') return 0.34;
  return 1.08;
};

function Glyph({ ch, reduce }) {
  if (reduce) return <span className="stage-digits__glyph">{ch}</span>;
  const rolls = DIGIT.test(ch);
  return (
    <AnimatePresence initial={false}>
      <motion.span
        key={ch}
        className="stage-digits__glyph"
        initial={{ y: rolls ? `${ROLL}em` : '0em', opacity: 0 }}
        animate={{ y: '0em', opacity: 1 }}
        exit={{ y: rolls ? `${-ROLL}em` : '0em', opacity: 0 }}
        transition={ROLL_TRANSITION}
      >
        {ch}
      </motion.span>
    </AnimatePresence>
  );
}

export default function Digits({ value, className = '', style }) {
  const reducedMotion = !!useReducedMotion();
  const motionPaused = useMotionPaused();
  const reduce = reducedMotion || motionPaused;
  const chars = String(value).split('');
  // Cells are keyed by their distance from the right, so "09:59" and "09:58"
  // share cells and only the last one rolls.
  return (
    <span className={`stage-digits ${className}`} style={style}>
      <AnimatePresence initial={false}>
        {chars.map((ch, i) => (
          <motion.span
            key={chars.length - i}
            className="stage-digits__cell"
            initial={reduce ? false : { width: '0em', opacity: 0 }}
            animate={{ width: `${widthOf(ch)}em`, opacity: 1 }}
            exit={reduce ? undefined : { width: '0em', opacity: 0 }}
            transition={ROLL_TRANSITION}
          >
            <Glyph ch={ch} reduce={reduce} />
          </motion.span>
        ))}
      </AnimatePresence>
    </span>
  );
}
