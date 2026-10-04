// 04  INTERVAL BELLS
//
// One section, one scene: a sit going round once with its interval bells on
// it (intervals.js); each bell sends a ripple out as the session reaches it.
// In the middle of the ring, how often it rings ("Every 10 minutes" of a
// thirty minute sit, so from thirty bells down to two), with - and + on
// either side. Under the figure, one use at a time, with that interval in
// it, changing every few seconds (not with reduced motion or Pause motion).
//
// Desktop (lg+): about one screen tall. Columns 1 to 5: the heading and the
// micro line. Columns 6 to 12: the square "bells" anchor with the uses
// under it. Below lg: the heading, the figure, then the micro line.

import { memo, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, m as motion, useReducedMotion } from 'framer-motion';
import { GeometryAnchor, SceneTrigger } from '../../geometry/components';
import { BELLS, withBells } from '../../geometry/scenes';
import { bells as COPY } from '../../content/copy';
import Reveal from '../../components/landing/Reveal';
import SectionHeading from '../../components/landing/SectionHeading';
import { FOCUS_RING } from '../../components/landing/links';
import { useMotionPaused } from '../../components/landing/useMotionPaused';

const CONTAINER = 'mx-auto w-full max-w-[1200px] px-4 lg:px-10 xl:px-16';
const LABEL = 'font-courier text-[11px] font-bold uppercase leading-4 tracking-[0.2em] text-white/60';
const MICRO = 'max-w-[46ch] text-pretty text-[13px] leading-5 text-white/55';

// The interval shown first: every 10 minutes.
const FIRST = 2;

const USE_MS = 3000;

const fade = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.5, ease: 'easeOut' } },
  exit: { opacity: 0, transition: { duration: 0.3, ease: 'easeIn' } },
};

// - or +, either side of the interval.
function Step({ more, disabled, onStep }) {
  return (
    <button
      type="button"
      onClick={onStep}
      disabled={disabled}
      aria-label={more ? COPY.longer : COPY.shorter}
      className={`flex h-[max(44px,13cqw)] w-[max(44px,13cqw)] shrink-0 items-center justify-center rounded-full border border-white/[0.16] bg-black/40 text-white/85 transition-[border-color,color,opacity] hover:border-white/40 hover:text-white disabled:pointer-events-none disabled:opacity-25 ${FOCUS_RING}`}
    >
      <svg viewBox="0 0 20 20" className="h-[40%] w-[40%]" aria-hidden="true" focusable="false">
        <path d={more ? 'M3 10h14M10 3v14' : 'M3 10h14'} stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    </button>
  );
}

// The interval, in the middle of the ring: "Every", the minutes, "minutes".
function Interval({ index, onIndex }) {
  const { minutes, below } = COPY.every[index];
  return (
    <div role="group" aria-label={COPY.everyLabel} className="absolute inset-0 flex items-center justify-center gap-[5cqw]">
      <Step disabled={index === 0} onStep={() => onIndex(index - 1)} />
      <p aria-live="polite" aria-atomic="true" className="flex w-[30cqw] flex-col items-center text-center">
        <span className={LABEL}>{COPY.everyAbove}</span>
        <span className="my-[1.5cqw] font-rounded text-[clamp(52px,22cqw,128px)] font-light leading-none tabular-nums text-white">
          {minutes}
        </span>
        <span className={LABEL}>{below}</span>
      </p>
      <Step more disabled={index === COPY.every.length - 1} onStep={() => onIndex(index + 1)} />
    </div>
  );
}

// Under the figure: one use after another, with the interval in each.
function Uses({ minutes, moving }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (!moving) return undefined;
    const id = window.setInterval(() => setI((n) => (n + 1) % COPY.uses.length), USE_MS);
    return () => window.clearInterval(id);
  }, [moving]);

  return (
    <>
      <div aria-hidden="true" className="relative mx-auto mt-5 h-12 max-w-[40ch]">
        <AnimatePresence initial={false}>
          <motion.p
            key={i}
            className="absolute inset-x-0 top-0 text-balance text-center text-[15px] leading-6 text-white/85"
            {...fade}
          >
            {COPY.uses[i](minutes)}
          </motion.p>
        </AnimatePresence>
      </div>
      <ul className="sr-only">
        {COPY.uses.map((use, n) => (
          <li key={n}>{use(minutes)}</li>
        ))}
      </ul>
    </>
  );
}

function BellsSection() {
  const paused = useMotionPaused();
  const reduce = useReducedMotion();
  const [everyIndex, setEveryIndex] = useState(FIRST);
  const every = COPY.every[everyIndex];

  // Memoised: the field is re-targeted only when the interval changes.
  const scene = useMemo(() => withBells(BELLS, every.bells), [every]);

  return (
    <section id="bells" aria-labelledby="bells-title" className="relative z-10 overflow-clip">
      <SceneTrigger
        scene={scene}
        className={`${CONTAINER} flex min-h-[100svh] flex-col justify-center py-[10svh] lg:grid lg:grid-cols-12 lg:grid-rows-[1fr_auto_auto_1fr] lg:gap-x-6`}
      >
        <SectionHeading
          id="bells-title"
          eyebrow={COPY.eyebrow}
          title={COPY.h2}
          body={COPY.body}
          className="lg:col-span-5 lg:row-start-2"
        />

        <div className="mt-8 lg:col-span-7 lg:col-start-6 lg:row-span-4 lg:row-start-1 lg:mt-0 lg:self-center">
          <GeometryAnchor
            name="bells"
            className="relative mx-auto aspect-square w-[min(100%,40svh)] [container-type:inline-size] lg:w-[min(64svh,46vw,100%)]"
          >
            <Interval index={everyIndex} onIndex={setEveryIndex} />
          </GeometryAnchor>
          <Uses minutes={every.minutes} moving={!reduce && !paused} />
        </div>

        <Reveal className="mt-6 lg:col-span-5 lg:row-start-3 lg:mt-8">
          <p className={MICRO}>{COPY.micro}</p>
        </Reveal>
      </SceneTrigger>
    </section>
  );
}

export default memo(BellsSection);
