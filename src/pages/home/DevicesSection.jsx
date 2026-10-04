// 05  THE APPLE ECOSYSTEM: mind and body on the Watch, then everywhere a
// session shows.
//
// Two scene triggers in the copy column, one figure for each:
//   Beat A, the Watch: a pulse traced round a circle, with a heart at the
//   centre and the session as a ring around it (pulse.js). While it is the
//   figure on screen, it moves through sitting, walking and dancing: the
//   heart speeds up and slows down with each, and each is a session of its
//   own, its ring filling over the time the figure stays with it. A caption
//   under it says which; a click on the figure moves on to the next.
//   Beat B, everywhere: the outlines of the places a session shows, one
//   after another (the Dynamic Island, the Lock Screen, Control Center,
//   Siri, Shortcuts, an Apple Watch), each named under it, with arrows
//   either side of the name.
// On desktop both figures sit on one sticky square centred in columns 6 to
// 12; on phones each beat has its own square between its paragraph and
// what follows it.
//
// Nothing moves on by itself with reduced motion or Pause motion; a click
// or an arrow still does.
//
// The scene listener comes from geometry/registry, so this section does not
// pull the WebGL engine into the entry chunk.

import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, m as motion, useReducedMotion } from 'framer-motion';
import { GeometryAnchor, SceneTrigger } from '../../geometry/components';
import { DEVICES_EVERYWHERE, DEVICES_WATCH, SURFACES, withPulse, withSurface } from '../../geometry/scenes';
import { onSceneChange } from '../../geometry/registry';
import { devices as COPY } from '../../content/copy';
import SectionHeading from '../../components/landing/SectionHeading';
import Reveal from '../../components/landing/Reveal';
import { FOCUS_RING } from '../../components/landing/links';
import { useMotionPaused } from '../../components/landing/useMotionPaused';

const CONTAINER = 'mx-auto w-full max-w-[1200px] px-4 lg:px-10 xl:px-16';
const MICRO = 'font-courier text-[11px] leading-4 text-white/55';

// The pulse for each activity (a heart rate range, in beats per minute),
// and how long the figure stays with it.
const STAY = { sit: 11000, walk: 6500, dance: 6500 };
const PACE = {
  sit: { bpm: [55, 60], amp: 0.55, session: 'sit', seconds: STAY.sit / 1000 },
  walk: { bpm: [80, 90], amp: 0.8, session: 'walk', seconds: STAY.walk / 1000 },
  dance: { bpm: [110, 130], amp: 1, session: 'dance', seconds: STAY.dance / 1000 },
};
const SURFACE_MS = 3600;

const ACTIVITIES = COPY.watch.activities;

const captionFade = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.5, ease: 'easeOut' } },
  exit: { opacity: 0, transition: { duration: 0.3, ease: 'easeIn' } },
};

// Which of the section's two figures the field is showing (null: neither).
function useShowing() {
  const [showing, setShowing] = useState(null);
  useEffect(() => {
    const off = onSceneChange(({ config }) => {
      const id = config && config.id;
      setShowing(id === DEVICES_WATCH.id ? 'watch' : id === DEVICES_EVERYWHERE.id ? 'everywhere' : null);
    });
    return () => {
      off();
    };
  }, []);
  return showing;
}

// One of `count` states while `active`, back to the first when it is not.
// With `auto`, it moves on by itself after `stayFor(i)` ms. step(d) moves d
// states on (or back) and starts that state's time over.
function useCycle(active, auto, count, stayFor) {
  const [i, setI] = useState(0);
  const [wasActive, setWasActive] = useState(active);
  if (wasActive !== active) {
    setWasActive(active);
    if (!active) setI(0);
  }
  useEffect(() => {
    if (!active || !auto) return undefined;
    const id = window.setTimeout(() => setI((n) => (n + 1) % count), stayFor(i));
    return () => window.clearTimeout(id);
  }, [active, auto, count, stayFor, i]);
  const step = useCallback((d) => setI((n) => (n + d + count) % count), [count]);
  return [i, step];
}

const stayActivity = (i) => STAY[ACTIVITIES[i].key];
const staySurface = () => SURFACE_MS;

function Arrow({ back, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white/60 transition-colors hover:text-white ${FOCUS_RING}`}
    >
      <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
        <path d={back ? 'M10 3 5 8l5 5' : 'm6 3 5 5-5 5'} />
      </svg>
    </button>
  );
}

// The word under a figure: what it shows now. With onStep, arrows either
// side move to the previous and next.
function Caption({ title, onStep, className = '' }) {
  const word = (
    <div aria-hidden="true" className="pointer-events-none relative h-6 w-44 text-center">
      <AnimatePresence initial={false}>
        <motion.p key={title} className="absolute inset-x-0 top-0 font-courier text-[13px] font-bold leading-5 text-white/85" {...captionFade}>
          {title}
        </motion.p>
      </AnimatePresence>
    </div>
  );
  if (!onStep) return <div className={`flex justify-center ${className}`}>{word}</div>;
  return (
    <div className={`-mt-2.5 flex items-center justify-center ${className}`}>
      <Arrow back label={COPY.everywhere.prevLabel} onClick={() => onStep(-1)} />
      {word}
      <Arrow label={COPY.everywhere.nextLabel} onClick={() => onStep(1)} />
    </div>
  );
}

// The figure itself as a button: a click moves it on.
function FigureButton({ label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={`absolute inset-[8%] cursor-pointer rounded-full ${FOCUS_RING}`}
    />
  );
}

function DevicesSection() {
  const reduce = !!useReducedMotion();
  const paused = useMotionPaused();
  const showing = useShowing();
  const moving = !reduce && !paused;

  const [a, stepA] = useCycle(showing === 'watch', moving, ACTIVITIES.length, stayActivity);
  const [b, stepB] = useCycle(showing === 'everywhere', moving, SURFACES, staySurface);
  const activity = ACTIVITIES[a];

  const watch = useMemo(() => withPulse(DEVICES_WATCH, PACE[activity.key]), [activity]);
  const everywhere = useMemo(() => withSurface(DEVICES_EVERYWHERE, b), [b]);

  const watchCaption = <Caption title={activity.name} />;
  const placeCaption = <Caption title={COPY.everywhere.surfaces[b]} onStep={stepB} />;
  const nextActivity = () => stepA(1);
  const nextPlace = () => stepB(1);

  return (
    <section aria-labelledby="devices-watch-title" className="relative z-10 overflow-clip">
      {/* On phones the last figure sits low in its beat: the room after it
          keeps the next section's figure from arriving while it is on screen. */}
      <div className={`${CONTAINER} pb-[28svh] lg:pb-20`}>
        <div className="lg:grid lg:grid-cols-12 lg:gap-x-6">
          <div className="pt-16 lg:col-span-5 lg:pt-[14svh]">
            {/* Beat A: the Watch */}
            <SceneTrigger scene={watch}>
              <div className="lg:flex lg:min-h-[86svh] lg:flex-col lg:justify-center lg:pb-[8svh]">
                <SectionHeading
                  id="devices-watch-title"
                  eyebrow={COPY.watch.eyebrow}
                  title={COPY.watch.h2}
                  body={COPY.watch.body}
                />
                <div className="mt-8 lg:hidden">
                  <GeometryAnchor
                    name="devices-watch"
                    className="relative mx-auto aspect-square w-full max-w-[min(100%,44svh,520px)]"
                  >
                    <FigureButton label={COPY.watch.nextLabel} onClick={nextActivity} />
                  </GeometryAnchor>
                  {watchCaption}
                </div>
              </div>
            </SceneTrigger>

            {/* Beat B: everywhere */}
            <SceneTrigger scene={everywhere} className="mt-20 lg:mt-0">
              <div className="lg:flex lg:min-h-[100svh] lg:flex-col lg:justify-center">
                <SectionHeading title={COPY.everywhere.h2} body={COPY.everywhere.body} />
                <div className="mt-8 lg:hidden">
                  <GeometryAnchor
                    name="devices-everywhere"
                    className="relative mx-auto aspect-square w-full max-w-[min(100%,44svh,520px)]"
                  >
                    <FigureButton label={COPY.everywhere.nextLabel} onClick={nextPlace} />
                  </GeometryAnchor>
                  {placeCaption}
                </div>
                <Reveal className="mt-8">
                  <p className={MICRO}>{COPY.everywhere.requirements}</p>
                </Reveal>
              </div>
            </SceneTrigger>
          </div>

          {/* The sticky figure, centred in its columns, with its caption. */}
          <div className="hidden lg:col-span-7 lg:col-start-6 lg:block">
            <div className="sticky top-0 flex h-[100svh] flex-col items-center justify-center pt-14">
              <GeometryAnchor name="devices" className="relative aspect-square w-[min(600px,66svh,100%)] shrink-0">
                {showing ? (
                  <FigureButton
                    label={showing === 'everywhere' ? COPY.everywhere.nextLabel : COPY.watch.nextLabel}
                    onClick={showing === 'everywhere' ? nextPlace : nextActivity}
                  />
                ) : null}
              </GeometryAnchor>
              {/* Only while one of the section's figures is the one on screen. */}
              <div className={`mt-6 w-full transition-opacity duration-500 ${showing ? 'opacity-100' : 'pointer-events-none opacity-0'}`}>
                {showing === 'everywhere' ? placeCaption : watchCaption}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default memo(DevicesSection);
