// Reveal: time-driven text reveal, once, when the block is 30% in view.
// Opacity 0 to 1 and y 16 to 0 over 700ms, cubic-bezier(0.22, 1, 0.36, 1).
// Reduced motion: opacity only, 200ms. Never scroll-scrubbed.
//
// Props
// - as: element to render ('div' by default). A string tag, or a component
//   that forwards its ref.
// - children
// - delay: before the reveal starts. Seconds, or milliseconds when above 5
//   (delay={0.16} and delay={160} are the same).
// - stagger: reveal each child as its own line. true = 80ms apart, or a
//   number (seconds or ms, as for delay). Plain elements keep their tag
//   (an <li> stays an <li>); components and text are wrapped in a block.
// - amount: fraction in view that triggers it (default 0.3).
// - className, ...rest: passed to the rendered element.

import { Children, Fragment, isValidElement, useMemo, useRef } from 'react';
import { m as motion, useReducedMotion } from 'framer-motion';
import {
  REVEAL_DURATION,
  REVEAL_EASE,
  REVEAL_REDUCED_DURATION,
  REVEAL_STAGGER,
  toSeconds,
  useRevealOnce,
} from './revealTiming';

function flatten(children) {
  const out = [];
  Children.toArray(children).forEach((child) => {
    if (isValidElement(child) && child.type === Fragment) {
      out.push(...flatten(child.props.children));
    } else {
      out.push(child);
    }
  });
  return out;
}

function renderLine(child, index, variants) {
  const key = `line-${index}`;
  if (typeof child === 'string' || typeof child === 'number') {
    return (
      <motion.span key={key} className="block" variants={variants}>
        {child}
      </motion.span>
    );
  }
  if (isValidElement(child) && typeof child.type === 'string') {
    const Line = motion[child.type];
    return <Line key={key} {...child.props} ref={child.ref} variants={variants} />;
  }
  return (
    <motion.div key={key} variants={variants}>
      {child}
    </motion.div>
  );
}

export default function Reveal({
  as = 'div',
  children,
  delay = 0,
  stagger = false,
  amount = 0.3,
  className,
  ...rest
}) {
  const ref = useRef(null);
  const shown = useRevealOnce(ref, amount);
  const reduce = useReducedMotion();
  const Tag = useMemo(() => (typeof as === 'string' ? motion[as] : motion.create(as)), [as]);

  const start = toSeconds(delay, 0);
  const step = stagger ? toSeconds(stagger, REVEAL_STAGGER) : 0;

  const line = reduce
    ? {
        hidden: { opacity: 0 },
        shown: { opacity: 1, transition: { duration: REVEAL_REDUCED_DURATION, ease: 'linear' } },
      }
    : {
        hidden: { opacity: 0, y: 16 },
        shown: { opacity: 1, y: 0, transition: { duration: REVEAL_DURATION, ease: REVEAL_EASE } },
      };

  const animate = shown ? 'shown' : 'hidden';

  if (!stagger) {
    const variants = {
      hidden: line.hidden,
      shown: { ...line.shown, transition: { ...line.shown.transition, delay: start } },
    };
    return (
      <Tag ref={ref} className={className} variants={variants} initial="hidden" animate={animate} {...rest}>
        {children}
      </Tag>
    );
  }

  const container = {
    hidden: {},
    shown: { transition: { delayChildren: start, staggerChildren: step } },
  };

  return (
    <Tag ref={ref} className={className} variants={container} initial="hidden" animate={animate} {...rest}>
      {flatten(children).map((child, i) => renderLine(child, i, line))}
    </Tag>
  );
}
