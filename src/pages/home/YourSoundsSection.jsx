// 03  YOUR SOUNDS: what a visitor brings.
//
// One section, one scene: a seed head whose grains step aside for what a
// visitor might bring (an audio file, a bird, a handpan, Apple Music), one
// shape after another, round and round while the figure is on screen.
//
// Laid out like the sound section. Desktop (lg+): about one screen tall,
// the heading and the footnote in columns 1 to 5, the square "sounds"
// anchor in columns 6 to 12. Below lg: the heading, the figure, then the
// footnote, so the figure never ends the section.

import { memo, useEffect, useMemo, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import { GeometryAnchor, SceneTrigger } from '../../geometry/components';
import { onSceneChange } from '../../geometry/registry';
import { SOUND_SHAPES, SOUNDS, withCutout } from '../../geometry/scenes';
import { sounds as COPY, stage as STAGE } from '../../content/copy';
import Reveal from '../../components/landing/Reveal';
import SectionHeading from '../../components/landing/SectionHeading';
import { useMotionPaused } from '../../components/landing/useMotionPaused';

const CONTAINER = 'mx-auto w-full max-w-[1200px] px-4 lg:px-10 xl:px-16';
const MICRO = 'max-w-[46ch] text-pretty text-[13px] leading-5 text-white/55';

// Whether the field is showing this section's figure.
function useShowing() {
  const [showing, setShowing] = useState(false);
  useEffect(() => onSceneChange(({ config }) => setShowing(!!config && config.id === SOUNDS.id)), []);
  return showing;
}

// The seed head's loop: whole for a moment when the figure arrives, then one
// shape after another for as long as it is on screen. Pause motion holds the
// shape that is showing; reduced motion shows the first one.
const FIRST_SHAPE_MS = 1400;
const SHAPE_MS = 4600;

function useShapeLoop(run) {
  const reduce = useReducedMotion();
  const paused = useMotionPaused();
  const [index, setIndex] = useState(-1);

  useEffect(() => {
    if (!run || reduce || paused) return undefined;
    const id = window.setTimeout(
      () => setIndex((i) => (i + 1) % SOUND_SHAPES.length),
      index < 0 ? FIRST_SHAPE_MS : SHAPE_MS,
    );
    return () => window.clearTimeout(id);
  }, [run, reduce, paused, index]);

  // Leaving closes the seed head; the loop starts over next time.
  const [wasRunning, setWasRunning] = useState(run);
  if (wasRunning !== run) {
    setWasRunning(run);
    if (!run) setIndex(-1);
  }

  if (!run) return null;
  if (reduce) return SOUND_SHAPES[0];
  return index < 0 ? null : SOUND_SHAPES[index];
}

function YourSoundsSection() {
  const shape = useShapeLoop(useShowing());
  const scene = useMemo(() => withCutout(SOUNDS, shape), [shape]);

  return (
    <section id="your-sounds" aria-labelledby="your-sounds-title" className="relative z-10 overflow-clip">
      <SceneTrigger
        scene={scene}
        className={`${CONTAINER} flex min-h-[100svh] flex-col justify-center py-[10svh] lg:grid lg:grid-cols-12 lg:grid-rows-[1fr_auto_auto_1fr] lg:gap-x-6`}
      >
        <SectionHeading
          id="your-sounds-title"
          eyebrow={COPY.eyebrow}
          title={COPY.h2}
          body={COPY.body}
          className="lg:col-span-5 lg:row-start-2"
        />

        <div className="mt-10 lg:col-span-7 lg:col-start-6 lg:row-span-4 lg:row-start-1 lg:mt-0 lg:self-center">
          <GeometryAnchor
            name="sounds"
            aria-hidden="true"
            className="mx-auto aspect-square w-[min(100%-24px,44svh)] lg:w-[min(64svh,46vw,100%)]"
          />
        </div>

        <Reveal className="mt-10 lg:col-span-5 lg:row-start-3 lg:mt-8">
          <p className={MICRO}>{COPY.footnote}</p>
          <p className="sr-only">{STAGE.shapesAlt}</p>
        </Reveal>
      </SceneTrigger>
    </section>
  );
}

export default memo(YourSoundsSection);
