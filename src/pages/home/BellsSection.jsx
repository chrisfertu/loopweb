// 04  BELLS: interval bells.
//
// One section, one scene: a sit going round once with its interval bells on
// it (intervals.js); each bell sends a ripple out as the session reaches it.
// The visitor picks how often it rings (every 5, 10 or 15 minutes of a
// thirty minute sit) and can turn on "Hear it ring": the app's default bell
// then plays each time the figure reaches one (the field reports it,
// onFieldEvent). The other bells are only named, not played.
//
// Sound goes through ListenProvider (ring), so a bell and a Listen sound
// never play together; the tap on "Hear it ring" plays the bell once, which
// is also what lets the browser play it later. Hearing stops when the
// section leaves the viewport, when motion is paused, and when a /player
// session is running.
//
// Desktop (lg+): about one screen tall. Columns 1 to 5: the heading, three
// uses, the controls, the micro line. Columns 6 to 12: the square "bells"
// anchor with the example under it. Below lg: the heading, the figure, then
// the rest.

import { memo, useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { GeometryAnchor, SceneTrigger } from '../../geometry/components';
import { BELLS, withBells } from '../../geometry/scenes';
import { onFieldEvent } from '../../geometry/registry';
import { DEFAULT_BELL } from '../../content/media';
import { bells as COPY } from '../../content/copy';
import Reveal from '../../components/landing/Reveal';
import SectionHeading from '../../components/landing/SectionHeading';
import { useListen } from '../../components/landing/listen';
import { FOCUS_RING } from '../../components/landing/links';
import { useMotionPaused } from '../../components/landing/useMotionPaused';

const CONTAINER = 'mx-auto w-full max-w-[1200px] px-4 lg:px-10 xl:px-16';
const LABEL = 'font-courier text-[11px] font-bold uppercase leading-4 tracking-[0.2em] text-white/55';
const MICRO = 'max-w-[46ch] text-pretty text-[13px] leading-5 text-white/55';
const CHIP = 'inline-flex min-h-11 items-center rounded-full border px-3.5 font-courier text-[13px] font-bold leading-none transition-colors';
const CHIP_ON = 'border-opus-green/70 bg-opus-green/10 text-opus-green-dim';
const CHIP_OFF = 'border-white/[0.14] text-white/80 hover:border-white/30 hover:text-white';

function BellsSection() {
  const { ring, stop, sessionActive } = useListen();
  const id = useId();
  const sectionRef = useRef(null);
  const paused = useMotionPaused();

  const [every, setEvery] = useState(COPY.every[1]);
  const [hearing, setHearing] = useState(false);

  // One strike of the bell.
  const sound = useCallback(() => {
    if (!sessionActive) ring('bell', { file: DEFAULT_BELL, label: COPY.bellName, owner: id });
  }, [ring, id, sessionActive]);

  const onHear = () => {
    if (hearing) {
      setHearing(false);
      stop({ owner: id });
      return;
    }
    setHearing(true);
    sound();
  };

  // While hearing, each bell the figure reaches rings.
  useEffect(() => {
    if (!hearing) return undefined;
    return onFieldEvent((e) => {
      if (e.id === BELLS.id && e.type === 'bell') sound();
    });
  }, [hearing, sound]);

  // Hearing ends when motion is paused, when a session takes over the audio,
  // and once the section has left the viewport.
  useEffect(() => {
    if (paused || sessionActive) setHearing(false);
  }, [paused, sessionActive]);
  useEffect(() => {
    if (!hearing) return undefined;
    const target = sectionRef.current;
    if (!target || typeof IntersectionObserver === 'undefined') return undefined;
    const observer = new IntersectionObserver((entries) => {
      const entry = entries[entries.length - 1];
      if (entry && !entry.isIntersecting) {
        setHearing(false);
        stop({ owner: id });
      }
    });
    observer.observe(target);
    return () => observer.disconnect();
  }, [hearing, stop, id]);
  useEffect(() => () => stop({ owner: id }), [stop, id]);

  // Memoised: the field is re-targeted only when the interval changes.
  const scene = useMemo(() => withBells(BELLS, every.bells), [every]);

  return (
    <section ref={sectionRef} id="bells" aria-labelledby="bells-title" className="relative z-10 overflow-clip">
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

        <div className="mt-10 lg:col-span-7 lg:col-start-6 lg:row-span-4 lg:row-start-1 lg:mt-0 lg:self-center">
          <GeometryAnchor
            name="bells"
            aria-hidden="true"
            className="mx-auto aspect-square w-[min(100%,44svh)] lg:w-[min(68svh,48vw,100%)]"
          />
          <p className="mt-4 text-center font-courier text-[12px] leading-4 text-white/60">{COPY.example(every.minutes)}</p>
        </div>

        <Reveal stagger className="mt-10 lg:col-span-5 lg:row-start-3 lg:mt-10">
          <ul className="max-w-[46ch] space-y-2.5">
            {COPY.uses.map((use) => (
              <li key={use} className="flex gap-3 text-[15px] leading-6 text-white/85">
                <span aria-hidden="true" className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-opus-green" />
                {use}
              </li>
            ))}
          </ul>

          <div className="mt-8">
            <p className={LABEL}>{COPY.everyLabel}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {COPY.every.map((option) => (
                <button
                  key={option.minutes}
                  type="button"
                  aria-pressed={option === every}
                  onClick={() => setEvery(option)}
                  className={`${CHIP} ${option === every ? CHIP_ON : CHIP_OFF} ${FOCUS_RING}`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            aria-pressed={hearing}
            onClick={onHear}
            disabled={sessionActive}
            className={`mt-6 ${CHIP} ${hearing ? CHIP_ON : CHIP_OFF} disabled:opacity-40 ${FOCUS_RING}`}
          >
            {hearing ? COPY.hearing : COPY.hear}
          </button>

          <p className={`mt-6 ${MICRO}`}>{COPY.micro}</p>
        </Reveal>
      </SceneTrigger>
    </section>
  );
}

export default memo(BellsSection);
