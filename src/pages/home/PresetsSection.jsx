// 06  PRESETS: one setup for each thing you do.
//
// A pinned stage. The figure grows as the visitor scrolls: one circle (the
// app's default preset), two, seven, then nineteen (PRESETS_ENTRY, then
// PRESETS_STEPS). The first seven circles each hold a preset's icon
// (PresetStage), so the figure shows presets being added; the nineteen say
// there is room for more. Beside it the heading stays and one line changes
// with each step, crossfading on the clock like the figure.
//
// Under the figure, the preset that is on: its name and what it could be
// set to. With one or two icons it is the newest one; with seven, the stage
// moves from one to the next by itself while it is on screen (not with
// reduced motion or Pause motion), until a tap chooses one. Apart from the
// first, which the app starts with, these are examples of what a person
// might make.
//
// Desktop (lg+): copy in columns 1 to 5, the figure centred in columns 7 to
// 12, small enough that the nineteen circles (a quarter of the anchor's
// side beyond each edge) stay clear of the copy. Phones: the figure at the
// top of the stage with its caption, then the heading and the line; the
// stage is a size container and the figure gives way first on short screens.

import { memo, useEffect, useState } from 'react';
import { AnimatePresence, m as motion, useReducedMotion } from 'framer-motion';
import { GeometryAnchor, PinnedStage } from '../../geometry/components';
import { PRESETS_ENTRY, PRESETS_STEPS } from '../../geometry/scenes';
import { presets as COPY } from '../../content/copy';
import SectionHeading from '../../components/landing/SectionHeading';
import PresetStage from '../../components/landing/stage/PresetStage';
import { useMotionPaused } from '../../components/landing/useMotionPaused';

const EXAMPLES = COPY.examples;
const AUTO_MS = 2800;

// How many icons each step shows: one, two, then seven.
const SHOWN = [1, 2, 7, 7];

const LINE =
  'text-balance text-[length:clamp(1.125rem,3.2cqh,1.375rem)] font-medium leading-[1.3] tracking-[-0.015em] text-white/90 lg:text-[length:clamp(1.5rem,1rem+1.4vw,2.125rem)] lg:leading-[1.2]';

// Out in 0.3s; in over 0.45s, once the other has gone.
const IN = 'opacity-100 delay-300 duration-[450ms]';
const OUT = 'pointer-events-none opacity-0 duration-300';

const captionFade = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.45, ease: 'easeOut' } },
  exit: { opacity: 0, transition: { duration: 0.25, ease: 'easeIn' } },
};

// The preset that is on, for `stage` (0 to 3): the newest while there are
// one or two; with seven, one after another until a tap chooses.
function useActive(stage, moving) {
  const [auto, setAuto] = useState(2);
  const [picked, setPicked] = useState(null);

  const cycling = stage >= 2 && picked == null && moving;
  useEffect(() => {
    if (!cycling) return undefined;
    const id = window.setInterval(() => setAuto((i) => (i + 1) % EXAMPLES.length), AUTO_MS);
    return () => window.clearInterval(id);
  }, [cycling]);

  if (stage < 2) return [stage, setPicked];
  return [picked ?? auto, setPicked];
}

const Stage = memo(function Stage({ stage }) {
  const reduce = !!useReducedMotion();
  const paused = useMotionPaused();
  const [active, choose] = useActive(stage, !reduce && !paused);
  const preset = EXAMPLES[active];

  return (
    <div className="mx-auto flex h-full w-full max-w-[1200px] flex-col px-4 pb-[4cqh] pt-[calc(56px_+_env(safe-area-inset-top)_+_3cqh)] lg:grid lg:grid-cols-12 lg:gap-x-6 lg:px-10 lg:py-0 xl:px-16">
      {/* The figure. On phones the one part of the column that may shrink;
          the nineteen circles reach a quarter of its side past each edge. */}
      <div className="flex min-h-0 flex-col items-center justify-center [container-type:inline-size] lg:col-span-6 lg:col-start-7 lg:row-start-1 lg:pt-14">
        <div className="relative mt-[6cqh] aspect-square h-[min(60vw,34cqh)] lg:mt-0 lg:h-auto lg:w-[min(440px,52cqh,62cqw)]">
          <GeometryAnchor name="presets" className="absolute inset-0">
            <PresetStage shown={SHOWN[stage]} active={active} onChoose={choose} />
          </GeometryAnchor>
        </div>
        <div aria-live="polite" className="relative mt-[calc(min(60vw,34cqh)*0.3)] h-11 w-full text-center lg:mt-[min(130px,16cqh)]">
          <AnimatePresence initial={false}>
            <motion.p key={preset.key} className="absolute inset-x-0 top-0" {...captionFade}>
              <span className="block font-courier text-[13px] font-bold leading-5 text-white/85">{preset.name}</span>
              <span className="block font-courier text-[12px] leading-5 text-white/55">{preset.line}</span>
            </motion.p>
          </AnimatePresence>
        </div>
      </div>

      <div className="mt-[4cqh] shrink-0 lg:col-span-5 lg:col-start-1 lg:row-start-1 lg:my-0 lg:flex lg:flex-col lg:justify-center lg:pt-14">
        <SectionHeading
          id="presets-title"
          eyebrow={COPY.eyebrow}
          title={COPY.h2}
          body={COPY.body}
          bodyClassName="[@media(max-height:740px)]:hidden lg:[@media(max-height:740px)]:block"
        />
        <ol className="mt-[3cqh] grid lg:mt-10">
          {COPY.steps.map((line, i) => (
            <li
              key={line}
              className={`col-start-1 row-start-1 transition-opacity ease-out ${i === stage ? IN : OUT} ${LINE}`}
            >
              {line}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
});

function PresetsSection() {
  return (
    <PinnedStage
      entry={PRESETS_ENTRY}
      steps={PRESETS_STEPS}
      lead={10}
      stepHeight={45}
      aria-labelledby="presets-title"
      className="relative z-10 overflow-clip"
      stageClassName="[container-type:size]"
    >
      {(step) => <Stage stage={step + 1} />}
    </PinnedStage>
  );
}

export default memo(PresetsSection);
