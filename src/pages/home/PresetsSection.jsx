// 06  PRESETS: one setup for each thing you do.
//
// One section, one scene: seven circles (PRESETS), each holding a preset's
// icon (PresetStage). When the figure arrives, the presets come in one by
// one, the newest one on, with its name and what it is set to under the
// figure: first the one the app starts with, then six someone might make.
// After the last, the stage rests on it; a tap shows any of them. Leaving
// and coming back plays it again. Reduced motion or Pause motion: all seven
// at once, the first one on.
//
// Desktop (lg+): about one screen tall; the heading in columns 1 to 5, the
// figure with its caption in columns 7 to 12. Below lg: the heading, the
// figure and its caption, then the body.

import { memo, useEffect, useState } from 'react';
import { AnimatePresence, m as motion, useReducedMotion } from 'framer-motion';
import { GeometryAnchor, SceneTrigger } from '../../geometry/components';
import { onSceneChange } from '../../geometry/registry';
import { PRESETS } from '../../geometry/scenes';
import { presets as COPY } from '../../content/copy';
import Reveal from '../../components/landing/Reveal';
import SectionHeading from '../../components/landing/SectionHeading';
import PresetStage from '../../components/landing/stage/PresetStage';
import { useMotionPaused } from '../../components/landing/useMotionPaused';

const CONTAINER = 'mx-auto w-full max-w-[1200px] px-4 lg:px-10 xl:px-16';
const BODY = 'max-w-[52ch] text-pretty text-[16px] leading-[26px] text-muted sm:text-[17px] sm:leading-[28px]';

const EXAMPLES = COPY.examples;
// The first icon waits for the circles to land; then one every STEP_MS.
const FIRST_MS = 1300;
const STEP_MS = 1700;

const captionFade = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.45, ease: 'easeOut' } },
  exit: { opacity: 0, transition: { duration: 0.25, ease: 'easeIn' } },
};

// Whether the field is showing this section's figure.
function useShowing() {
  const [showing, setShowing] = useState(false);
  useEffect(() => onSceneChange(({ config }) => setShowing(!!config && config.id === PRESETS.id)), []);
  return showing;
}

// How many presets are in, while the figure is on screen: none, then one
// more every STEP_MS up to seven. Back to none when it leaves.
function useArrivals(showing, still) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!showing || still || count >= EXAMPLES.length) return undefined;
    const id = window.setTimeout(() => setCount((n) => n + 1), count === 0 ? FIRST_MS : STEP_MS);
    return () => window.clearTimeout(id);
  }, [showing, still, count]);

  const [wasShowing, setWasShowing] = useState(showing);
  if (wasShowing !== showing) {
    setWasShowing(showing);
    if (!showing) setCount(0);
  }
  return still ? EXAMPLES.length : count;
}

function PresetsSection() {
  const reduce = !!useReducedMotion();
  const paused = useMotionPaused();
  const showing = useShowing();
  const shown = useArrivals(showing, reduce || paused);
  const [picked, setPicked] = useState(null);

  // A tap shows that preset; a new arrival takes over from it.
  const [lastShown, setLastShown] = useState(shown);
  if (lastShown !== shown) {
    setLastShown(shown);
    setPicked(null);
  }
  const still = reduce || paused;
  const active = picked ?? (still ? 0 : Math.max(0, shown - 1));
  const preset = EXAMPLES[active];

  return (
    <section id="presets" aria-labelledby="presets-title" className="relative z-10 overflow-clip">
      <SceneTrigger
        scene={PRESETS}
        className={`${CONTAINER} flex min-h-[100svh] flex-col justify-center py-[10svh] lg:grid lg:grid-cols-12 lg:grid-rows-[1fr_auto_auto_1fr] lg:gap-x-6`}
      >
        <SectionHeading id="presets-title" eyebrow={COPY.eyebrow} title={COPY.h2} className="lg:col-span-5 lg:row-start-2" />

        {/* The six outer circles reach a quarter of the anchor's side past
            each edge, so the anchor is half the column and the caption sits
            below their reach. */}
        <div className="mt-[calc(min(56vw,30svh)*0.3_+_1.5rem)] flex flex-col items-center lg:col-span-6 lg:col-start-7 lg:row-span-4 lg:row-start-1 lg:mt-0 lg:self-center">
          <GeometryAnchor name="presets" className="relative aspect-square w-[min(56vw,30svh)] lg:w-[min(400px,46svh,28vw)]">
            <PresetStage shown={shown} active={shown ? active : -1} onChoose={setPicked} />
          </GeometryAnchor>
          <div
            aria-live="polite"
            className="relative mt-[calc(min(56vw,30svh)*0.3_+_1rem)] h-11 w-full text-center lg:mt-[calc(min(400px,46svh,28vw)*0.3_+_1.5rem)]"
          >
            <AnimatePresence initial={false}>
              {shown ? (
                <motion.p key={preset.key} className="absolute inset-x-0 top-0" {...captionFade}>
                  <span className="block font-courier text-[13px] font-bold leading-5 text-white/85">{preset.name}</span>
                  <span className="block font-courier text-[12px] leading-5 text-white/55">{preset.line}</span>
                </motion.p>
              ) : null}
            </AnimatePresence>
          </div>
        </div>

        <Reveal className="mt-8 lg:col-span-5 lg:row-start-3 lg:mt-5">
          <p className={BODY}>{COPY.body}</p>
        </Reveal>
      </SceneTrigger>
    </section>
  );
}

export default memo(PresetsSection);
