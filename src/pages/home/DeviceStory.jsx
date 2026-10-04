// DeviceStory: the first three beats of Home, all drawn by the field.
//
//   hero    the app's mark, far larger than its anchor, appearing from the
//           centre out; the play triangle at its centre leads to the timer
//   timer   a clock in grains inside sixty second marks, counting up from
//           the moment it lands
//   sounds  a seed head whose grains step aside for what a visitor brings:
//           an audio file, a bird, a handpan, Apple Music, round and round
//
// Desktop (lg+): a 12-column grid. Columns 1 to 5 hold three blocks with
// their copy centred: the hero at least one screen tall, the timer and
// sounds blocks at least 0.72 of a screen. Each block is a SceneTrigger.
// Columns 6 to 12 hold one sticky square anchor ("device") for all three
// figures.
//
// Mobile (< lg): each block has its own in-flow anchor ("device-hero",
// "device-timer", "device-sounds"), never last in its block: above the
// hero's title, and between the paragraphs of the other two.
//
// No props, no timer subscription: memoised so nothing above re-renders it.

import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { m as motion, useReducedMotion } from 'framer-motion';
import { GeometryAnchor, SceneTrigger } from '../../geometry/components';
import { LOGO_PLAY_R } from '../../geometry/nodes';
import { HERO, HERO_SCALE, HERO_SCALE_MOBILE, SOUND_SHAPES, SOUNDS, TIMER, withCutout } from '../../geometry/scenes';
import { hero as HERO_COPY, sounds as SOUNDS_COPY, stage as STAGE, timer as TIMER_COPY } from '../../content/copy';
import CtaRow from '../../components/landing/CtaRow';
import { FOCUS_RING } from '../../components/landing/links';
import SectionHeading from '../../components/landing/SectionHeading';
import { useMotionPaused } from '../../components/landing/useMotionPaused';
import Wordmark from '../../components/brand/Wordmark';

// ── Sizes ──────────────────────────────────────────────────
// The clock's second marks reach past the anchor, out to 1.14 of the radius
// (7% of the side beyond each edge), and the seed head stays inside it. The
// hero's mark is drawn several times the anchor's size (HERO_SCALE): it runs
// under the copy and off the screen, thinner and dimmer toward its edge.
//
// Desktop: a square of side min(560px, 62svh, 86% of the column); the column
// is a size container, so 86cqw is 86% of its width and the marks stay
// inside it. Centred in the space under the 56px header.
const DESKTOP_VARS = {
  '--side': 'min(560px, 62svh, 86cqw)',
  top: 'calc(50svh + 28px - var(--side) / 2)',
};

// Mobile: the hero's anchor is small enough to leave the title and the
// buttons on the first screen (the mark spreads past it, under them); the
// clock and the seed head are as wide as the screen allows (the clock a
// little less, for its marks).
const M_HERO = { width: 'min(56vw, 30svh)', height: 'min(56vw, 30svh)' };
const M_TIMER_SIDE = 'min(100vw - 88px, 44svh)';
const M_TIMER = {
  width: M_TIMER_SIDE,
  height: M_TIMER_SIDE,
  marginTop: `calc(${M_TIMER_SIDE} * 0.07 + 8px)`,
  marginBottom: `calc(${M_TIMER_SIDE} * 0.07 + 2.5rem)`,
};
const M_SOUNDS = { width: 'min(100vw - 56px, 44svh)', height: 'min(100vw - 56px, 44svh)', marginBottom: '2.5rem' };

// The timer block's id: where the hero's play triangle leads.
const TIMER_ID = 'timer';

// "Micro" lines: small, at least 55% white (brief: contrast).
const MICRO = 'text-[13px] leading-5 text-white/55 max-w-[46ch] text-pretty';
const BODY_LINE = 'max-w-[52ch] text-pretty text-[16px] leading-[26px] text-white sm:text-[17px] sm:leading-[28px]';

// ── Hooks ──────────────────────────────────────────────────

// The block that covers a thin line at 55% of the viewport height. Blocks
// are contiguous, so exactly one covers it while the story is on screen;
// outside it the last one stays active. The line sits just above the point
// where a block's figure has arrived, so what belongs to a block (the play
// link, the loop of shapes) follows its figure. Returns [active, ...probe
// refs] (one per block).
function useActiveBlock() {
  const hero = useRef(null);
  const timer = useRef(null);
  const sounds = useRef(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const els = [hero.current, timer.current, sounds.current];
    if (els.some((el) => !el) || typeof IntersectionObserver === 'undefined') return undefined;
    const inBand = new Set();
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          const i = els.indexOf(e.target);
          if (i < 0) return;
          if (e.isIntersecting) inBand.add(i);
          else inBand.delete(i);
        });
        if (inBand.size) setActive(Math.max(...inBand));
      },
      { rootMargin: '-55% 0px -44% 0px', threshold: 0 },
    );
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return [active, hero, timer, sounds];
}

// The seed head's loop: whole for a moment when the block arrives, then one
// shape after another for as long as the block is the one on screen. Pause
// motion holds the shape that is showing; reduced motion shows the first one.
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

  // Leaving the block closes the seed head; the loop starts over next time.
  const [wasRunning, setWasRunning] = useState(run);
  if (wasRunning !== run) {
    setWasRunning(run);
    if (!run) setIndex(-1);
  }

  if (!run) return null;
  if (reduce) return SOUND_SHAPES[0];
  return index < 0 ? null : SOUND_SHAPES[index];
}

// ── Pieces ─────────────────────────────────────────────────

// The play triangle at the centre of the mark: the grains draw it, this
// makes it a link down to the timer, the next beat. `live` is false while
// another block's figure is on the anchor. The target is the triangle's
// circle, a little generous, and never under 44px.
const PLAY_SIZE = { desktop: LOGO_PLAY_R * HERO_SCALE * 130, mobile: LOGO_PLAY_R * HERO_SCALE_MOBILE * 130 };

function PlayLink({ live = true, mobile = false }) {
  const reduce = useReducedMotion();
  const size = `max(44px, ${(mobile ? PLAY_SIZE.mobile : PLAY_SIZE.desktop).toFixed(1)}%)`;

  const onClick = (e) => {
    const next = document.getElementById(TIMER_ID);
    if (!next) return;
    e.preventDefault();
    next.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  };

  return (
    <a
      href={`#${TIMER_ID}`}
      onClick={onClick}
      aria-label={STAGE.play}
      tabIndex={live ? undefined : -1}
      aria-hidden={live ? undefined : true}
      style={{ width: size, height: size }}
      className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full ${FOCUS_RING} ${
        live ? '' : 'pointer-events-none'
      }`}
    />
  );
}

// A 1px line under the hero copy, 48px long. It grows on each inhale and
// retracts on each exhale (the field breathes about once every ten seconds)
// and fades away after the first scroll. Decorative.
function ScrollCue() {
  const reduce = useReducedMotion();
  const paused = useMotionPaused();
  const [gone, setGone] = useState(() => typeof window !== 'undefined' && window.scrollY > 4);

  useEffect(() => {
    if (gone) return undefined;
    const onScroll = () => {
      if (window.scrollY > 4) setGone(true);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [gone]);

  const still = reduce || paused;
  let animate;
  let transition;
  if (gone) {
    animate = { opacity: 0 };
    transition = { duration: 0.4, ease: 'easeOut' };
  } else if (still) {
    animate = { opacity: 1, scaleY: 1 };
    transition = { duration: 0.2 };
  } else {
    animate = { opacity: 1, scaleY: [0.3, 1, 0.3] };
    transition = { opacity: { duration: 0.6 }, scaleY: { duration: 10, ease: 'easeInOut', repeat: Infinity } };
  }

  return (
    <motion.span
      aria-hidden="true"
      className="mt-14 hidden h-12 w-px origin-top bg-gradient-to-b from-white/60 to-white/0 lg:[@media(min-height:801px)]:block"
      initial={{ opacity: 0, scaleY: 0.3 }}
      animate={animate}
      transition={transition}
    />
  );
}

// ── The story ──────────────────────────────────────────────

function DeviceStory() {
  const [active, heroProbe, timerProbe, soundsProbe] = useActiveBlock();
  const shape = useShapeLoop(active === 2);
  const soundsScene = useMemo(() => withCutout(SOUNDS, shape), [shape]);

  // Desktop blocks: copy centred (heights set per block). Phones: natural height.
  const block = 'relative flex flex-col px-4 lg:justify-center lg:px-0';
  const probe = 'pointer-events-none absolute inset-0';

  return (
    <div className="relative z-10 overflow-x-clip">
      <div className="mx-auto max-w-[1200px] lg:grid lg:grid-cols-12 lg:gap-x-6 lg:px-10 xl:px-16">
        <div className="lg:col-span-5 lg:col-start-1 lg:row-start-1">
          {/* 2.1 hero */}
          <SceneTrigger
            scene={HERO}
            as="section"
            aria-labelledby="ds-hero-title"
            className={`${block} pt-[calc(56px_+_1.75rem)] lg:min-h-[100svh] lg:pb-10 lg:pt-14`}
          >
            <span ref={heroProbe} aria-hidden="true" className={probe} />
            <GeometryAnchor name="device-hero" className="relative mx-auto mb-8 lg:hidden" style={M_HERO}>
              <PlayLink mobile />
            </GeometryAnchor>
            <SectionHeading
              as="h1"
              id="ds-hero-title"
              eyebrow={<Wordmark title={HERO_COPY.eyebrow} className="h-9 w-auto text-paper lg:h-11" />}
              title={HERO_COPY.h1}
              titleClassName="lg:[@media(max-height:800px)]:text-[clamp(2.25rem,1rem+3.4vw,3.5rem)]"
              body={HERO_COPY.body}
            >
              <CtaRow />
              <p className={`mt-5 ${MICRO}`}>{HERO_COPY.micro}</p>
            </SectionHeading>
            <ScrollCue />
          </SceneTrigger>

          {/* 2.2 timer */}
          <SceneTrigger
            scene={TIMER}
            as="section"
            id={TIMER_ID}
            aria-labelledby="ds-timer-title"
            className={`${block} pt-20 lg:min-h-[72svh] lg:py-16`}
          >
            <span ref={timerProbe} aria-hidden="true" className={probe} />
            <SectionHeading id="ds-timer-title" eyebrow={TIMER_COPY.eyebrow} title={TIMER_COPY.h2} body={TIMER_COPY.body}>
              <GeometryAnchor name="device-timer" aria-hidden="true" className="mx-auto lg:hidden" style={M_TIMER} />
              <p className={`${BODY_LINE} lg:-mt-4`}>{TIMER_COPY.line}</p>
              <p className="sr-only">{STAGE.timerAlt}</p>
            </SectionHeading>
          </SceneTrigger>

          {/* 2.3 sounds */}
          <SceneTrigger
            scene={soundsScene}
            as="section"
            aria-labelledby="ds-sounds-title"
            className={`${block} pb-8 pt-20 lg:min-h-[72svh] lg:py-16`}
          >
            <span ref={soundsProbe} aria-hidden="true" className={probe} />
            <SectionHeading id="ds-sounds-title" eyebrow={SOUNDS_COPY.eyebrow} title={SOUNDS_COPY.h2} body={SOUNDS_COPY.body}>
              <GeometryAnchor name="device-sounds" aria-hidden="true" className="mx-auto lg:hidden" style={M_SOUNDS} />
              <p className={MICRO}>{SOUNDS_COPY.micro}</p>
              <p className={`mt-3 ${MICRO}`}>{SOUNDS_COPY.footnote}</p>
              <p className="sr-only">{STAGE.shapesAlt}</p>
            </SectionHeading>
          </SceneTrigger>
        </div>

        {/* Desktop: the sticky anchor, beside all three blocks. */}
        <div className="hidden [container-type:inline-size] lg:col-span-7 lg:col-start-6 lg:row-start-1 lg:block">
          <div className="sticky pb-[calc(var(--side)*0.07_+_2rem)]" style={DESKTOP_VARS}>
            <GeometryAnchor name="device" className="relative mx-auto h-[var(--side)] w-[var(--side)]">
              <PlayLink live={active === 0} />
            </GeometryAnchor>
          </div>
        </div>
      </div>
    </div>
  );
}

export default memo(DeviceStory);
