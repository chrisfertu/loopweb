// 05  APPLE WATCH: on your wrist, then everywhere a session shows.
//
// Two scene triggers in the copy column, one figure for each:
//   Beat A, the Watch: a pulse traced round a circle, with a heart at the
//   centre and the mindful minutes as a ring around it (pulse.js). While it
//   is the figure on screen, it moves through sitting, walking and dancing:
//   the heart speeds up and slows down with each, and the minutes fill
//   while sitting. A caption under it says which.
//   Beat B, everywhere: the outlines of the places a session shows, one
//   after another (the Dynamic Island, the Lock Screen, Control Center, an
//   Apple Watch), each named under it.
// On desktop both figures sit on one sticky square centred in columns 6 to
// 12; on phones each beat has its own square above its words.
//
// Nothing moves on by itself with reduced motion or Pause motion: the pulse
// stays at rest and the outlines stay on the first one.
//
// The scene listener comes from geometry/registry, so this section does not
// pull the WebGL engine into the entry chunk.

import { memo, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, m as motion, useReducedMotion } from 'framer-motion';
import { GeometryAnchor, SceneTrigger } from '../../geometry/components';
import { DEVICES_EVERYWHERE, DEVICES_WATCH, SURFACES, withPulse, withSurface } from '../../geometry/scenes';
import { onSceneChange } from '../../geometry/registry';
import { devices as COPY } from '../../content/copy';
import SectionHeading from '../../components/landing/SectionHeading';
import Reveal from '../../components/landing/Reveal';
import { useMotionPaused } from '../../components/landing/useMotionPaused';

const CONTAINER = 'mx-auto w-full max-w-[1200px] px-4 lg:px-10 xl:px-16';
const MICRO = 'font-courier text-[11px] leading-4 text-white/55';

// The pulse for each activity (a heart rate range, in beats per minute),
// and how long the figure stays with it.
const PACE = {
  sit: { bpm: [55, 60], amp: 0.55, filling: true },
  walk: { bpm: [80, 90], amp: 0.8, filling: false },
  dance: { bpm: [110, 130], amp: 1, filling: false },
};
const STAY = { sit: 11000, walk: 6500, dance: 6500 };
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

// Steps through `count` states while `running`, staying `stayFor(i)` ms on
// each; back to the first when it stops.
function useCycle(running, count, stayFor) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (!running) {
      setI(0);
      return undefined;
    }
    const id = window.setTimeout(() => setI((n) => (n + 1) % count), stayFor(i));
    return () => window.clearTimeout(id);
  }, [running, count, stayFor, i]);
  return i;
}

const stayActivity = (i) => STAY[ACTIVITIES[i].key];
const staySurface = () => SURFACE_MS;

// The words under a figure: what it shows now.
function Caption({ title, note, className = '' }) {
  return (
    <div aria-hidden="true" className={`pointer-events-none relative h-10 text-center ${className}`}>
      <AnimatePresence initial={false}>
        <motion.p key={title} className="absolute inset-x-0 top-0" {...captionFade}>
          <span className="block font-courier text-[13px] font-bold leading-5 text-white/85">{title}</span>
          {note ? <span className="block font-courier text-[11px] leading-4 text-white/50">{note}</span> : null}
        </motion.p>
      </AnimatePresence>
    </div>
  );
}

function DevicesSection() {
  const reduce = !!useReducedMotion();
  const paused = useMotionPaused();
  const showing = useShowing();
  const moving = !reduce && !paused;

  const a = useCycle(moving && showing === 'watch', ACTIVITIES.length, stayActivity);
  const b = useCycle(moving && showing === 'everywhere', SURFACES, staySurface);
  const activity = ACTIVITIES[a];

  const watch = useMemo(() => withPulse(DEVICES_WATCH, PACE[activity.key]), [activity]);
  const everywhere = useMemo(() => withSurface(DEVICES_EVERYWHERE, b), [b]);

  const watchCaption = <Caption title={activity.name} note={activity.note} />;
  const placeCaption = <Caption title={COPY.everywhere.surfaces[b]} />;

  return (
    <section aria-labelledby="devices-watch-title" className="relative z-10 overflow-clip">
      <div className={`${CONTAINER} pb-16 lg:pb-20`}>
        <div className="lg:grid lg:grid-cols-12 lg:gap-x-6">
          <div className="pt-16 lg:col-span-5 lg:pt-[14svh]">
            {/* Beat A: the Watch */}
            <SceneTrigger scene={watch}>
              <div className="lg:flex lg:min-h-[86svh] lg:flex-col lg:justify-center lg:pb-[8svh]">
                <div className="mb-10 lg:hidden">
                  <GeometryAnchor
                    name="devices-watch"
                    aria-hidden="true"
                    className="mx-auto aspect-square w-full max-w-[min(100%,48svh,520px)]"
                  />
                  {watchCaption}
                </div>
                <SectionHeading
                  id="devices-watch-title"
                  eyebrow={COPY.watch.eyebrow}
                  title={COPY.watch.h2}
                  body={COPY.watch.body}
                />
                <Reveal stagger className="mt-6 space-y-1">
                  {COPY.watch.finePrint.map((line) => (
                    <p key={line} className={MICRO}>
                      {line}
                    </p>
                  ))}
                </Reveal>
              </div>
            </SceneTrigger>

            {/* Beat B: everywhere */}
            <SceneTrigger scene={everywhere} className="mt-20 lg:mt-0">
              <div className="lg:flex lg:min-h-[100svh] lg:flex-col lg:justify-center">
                <div className="mb-10 lg:hidden">
                  <GeometryAnchor
                    name="devices-everywhere"
                    aria-hidden="true"
                    className="mx-auto aspect-square w-full max-w-[min(100%,48svh,520px)]"
                  />
                  {placeCaption}
                </div>
                <SectionHeading title={COPY.everywhere.h2} body={COPY.everywhere.body}>
                  <p className={MICRO}>{COPY.everywhere.requirements}</p>
                </SectionHeading>
              </div>
            </SceneTrigger>
          </div>

          {/* The sticky figure, centred in its columns, with its caption. */}
          <div className="hidden lg:col-span-7 lg:col-start-6 lg:block">
            <div className="sticky top-0 flex h-[100svh] flex-col items-center justify-center pt-14">
              <GeometryAnchor name="devices" className="relative aspect-square w-[min(600px,66svh,100%)] shrink-0" />
              {/* Only while one of the section's figures is the one on screen. */}
              <div className={`mt-6 w-full transition-opacity duration-500 ${showing ? 'opacity-100' : 'opacity-0'}`}>
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
