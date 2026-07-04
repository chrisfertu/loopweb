import { useState, useEffect, useRef, useCallback } from 'react';
import {
  motion,
  AnimatePresence,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  useMotionValue,
} from 'framer-motion';
import { Link } from 'react-router-dom';
import PhoneFrame from '../components/PhoneFrame';
import SpiralRings from '../components/SpiralRings';

const APP_STORE_URL = 'https://apps.apple.com/ro/app/loop-meditation-focus/id6756740657';

const EASE = [0.16, 1, 0.3, 1];

// ────────────────────────────────────────────────────────────
// Presets — real app captures that cycle through the hero
// and power the "make it yours" switcher.
// ────────────────────────────────────────────────────────────

const MandalaIcon = ({ size = 15 }) => (
  <img src="/images/logo.svg" alt="" width={size} height={size} className="opacity-90" />
);

const TomatoIcon = ({ size = 15 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <circle cx="12" cy="12" r="9" />
    <path d="M12 3.5c0 4-2 6-2 8.5s2 4.5 2 8.5" strokeLinecap="round" />
    <circle cx="8.6" cy="9" r="0.4" fill="currentColor" />
    <circle cx="8.2" cy="14.6" r="0.4" fill="currentColor" />
    <circle cx="15.4" cy="9.2" r="0.4" fill="currentColor" />
    <circle cx="15.8" cy="14.8" r="0.4" fill="currentColor" />
  </svg>
);

const SpiralIcon = ({ size = 15 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <path d="M12 12m-1.5 0a1.5 1.5 0 1 0 3 0 3.2 3.2 0 1 0-6.4 0 5.4 5.4 0 1 0 10.8 0 7.6 7.6 0 1 0-15.2 0 9.8 9.8 0 1 0 19.6 0" />
  </svg>
);

const InfinityIcon = ({ size = 15 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
    <path d="M18.5 8.5a3.5 3.5 0 1 1 0 7c-3.5 0-2.5-7-9-7a3.5 3.5 0 1 0 0 7c3.4 0 4-3.5 4.5-3.5" />
  </svg>
);

const PRESETS = [
  {
    id: 'meditation',
    name: 'meditation',
    src: '/images/app/preset-meditation.webp',
    sound: 'Guided Meditation',
    Icon: MandalaIcon,
  },
  {
    id: 'pomodoro',
    name: 'pomodoro',
    src: '/images/app/preset-pomodoro.webp',
    sound: 'Victory Lap — Fred again..',
    Icon: TomatoIcon,
  },
  {
    id: 'sleep',
    name: 'sleep',
    src: '/images/app/preset-sleep.webp',
    sound: 'Pink Noise',
    Icon: SpiralIcon,
  },
  {
    id: 'noise',
    name: 'brown noise',
    src: '/images/app/preset-infinity.webp',
    sound: 'Brown Noise',
    Icon: InfinityIcon,
  },
];

// ────────────────────────────────────────────────────────────
// Shared primitives
// ────────────────────────────────────────────────────────────

const Reveal = ({ children, className = '', delay = 0, y = 28 }) => (
  <motion.div
    className={className}
    initial={{ opacity: 0, y, filter: 'blur(6px)' }}
    whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
    viewport={{ once: true, margin: '-90px' }}
    transition={{ duration: 0.9, delay, ease: EASE }}
  >
    {children}
  </motion.div>
);

// Monospace movement label with a line that draws itself in.
const Movement = ({ numeral, title }) => (
  <div className="flex items-center gap-4 mb-6">
    <span className="font-courier text-[11px] tracking-[0.35em] uppercase text-opus-green whitespace-nowrap">
      Mvt. {numeral}
    </span>
    <motion.span
      className="block h-px flex-1 max-w-[72px] bg-white/20 origin-left"
      initial={{ scaleX: 0 }}
      whileInView={{ scaleX: 1 }}
      viewport={{ once: true, margin: '-90px' }}
      transition={{ duration: 1.1, delay: 0.2, ease: EASE }}
    />
    <span className="font-courier text-[11px] tracking-[0.35em] uppercase text-white/35 whitespace-nowrap">
      {title}
    </span>
  </div>
);

// Buttons drift a few pixels toward the cursor — barely there, but alive.
const Magnetic = ({ children, className = '' }) => {
  const ref = useRef(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 260, damping: 18 });
  const sy = useSpring(y, { stiffness: 260, damping: 18 });
  const prefersReduced = useReducedMotion();

  const onMove = useCallback((e) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    x.set(((e.clientX - rect.left) / rect.width - 0.5) * 10);
    y.set(((e.clientY - rect.top) / rect.height - 0.5) * 8);
  }, [x, y]);

  const onLeave = useCallback(() => {
    x.set(0);
    y.set(0);
  }, [x, y]);

  if (prefersReduced) return <div className={className}>{children}</div>;

  return (
    <motion.div
      ref={ref}
      className={className}
      style={{ x: sx, y: sy }}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
    >
      {children}
    </motion.div>
  );
};

const AppStoreBadge = () => (
  <Magnetic>
    <a
      href={APP_STORE_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="group inline-flex items-center gap-3 pl-5 pr-6 py-3 rounded-full bg-white text-black transition-colors duration-300 hover:bg-opus-green hover:text-white"
    >
      <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
      </svg>
      <span className="flex flex-col leading-tight text-left">
        <span className="text-[10px] font-normal opacity-70">Download on the</span>
        <span className="text-[15px] font-semibold -mt-0.5">App Store</span>
      </span>
    </a>
  </Magnetic>
);

const WebPlayerLink = () => (
  <Magnetic>
    <Link
      to="/player"
      className="group inline-flex items-center gap-2.5 px-6 py-3.5 rounded-full text-sm border border-white/15 text-white/70 transition-colors duration-300 hover:border-white/35 hover:text-white hover:bg-white/[0.05]"
    >
      <span className="relative flex w-4 h-4 items-center justify-center">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:scale-110">
          <path d="M8 5.14v13.72L19 12 8 5.14z" />
        </svg>
      </span>
      Try the web player
    </Link>
  </Magnetic>
);

// ────────────────────────────────────────────────────────────
// Hero — the app, alive, cycling through real presets
// ────────────────────────────────────────────────────────────

const HeroPhone = () => {
  const prefersReduced = useReducedMotion();
  const [index, setIndex] = useState(0);
  const pausedRef = useRef(false);

  useEffect(() => {
    PRESETS.forEach(({ src }) => { new Image().src = src; });
    const timer = setInterval(() => {
      if (!pausedRef.current) setIndex((i) => (i + 1) % PRESETS.length);
    }, 4200);
    return () => clearInterval(timer);
  }, []);

  const preset = PRESETS[index];

  return (
    <div
      className="relative flex flex-col items-center"
      onMouseEnter={() => { pausedRef.current = true; }}
      onMouseLeave={() => { pausedRef.current = false; }}
    >
      <div className="phone-halo" />

      <motion.div
        animate={prefersReduced ? undefined : { y: [0, -10, 0] }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
        className="relative"
      >
        <PhoneFrame className="w-[240px] md:w-[290px]">
          <AnimatePresence mode="sync">
            <motion.img
              key={preset.id}
              src={preset.src}
              alt={`OPUS Loop — ${preset.name} preset`}
              className="absolute inset-0 w-full h-full object-cover"
              initial={{ opacity: 0, scale: 1.04 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.1, ease: 'easeInOut' }}
            />
          </AnimatePresence>
        </PhoneFrame>
      </motion.div>

      {/* Preset readout, synced with the screen */}
      <div className="mt-7 flex flex-col items-center gap-3">
        <div className="h-4 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.span
              key={preset.id}
              className="block font-courier text-[12px] tracking-[0.3em] text-white/45"
              initial={{ y: 14, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -14, opacity: 0 }}
              transition={{ duration: 0.45, ease: EASE }}
            >
              {preset.name}
            </motion.span>
          </AnimatePresence>
        </div>
        <div className="flex items-center gap-2">
          {PRESETS.map((p, i) => (
            <button
              key={p.id}
              onClick={() => setIndex(i)}
              aria-label={`Show ${p.name} preset`}
              className={`rounded-full transition-all duration-500 ${
                i === index ? 'w-5 h-1 bg-white/50' : 'w-1 h-1 bg-white/15 hover:bg-white/30'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

const HeroSection = () => {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const phoneY = useTransform(scrollYProgress, [0, 1], [0, 90]);
  const copyOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  return (
    <section ref={ref} className="relative w-full min-h-screen flex items-center overflow-hidden grain">
      <SpiralRings opacity={0.07} />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 60% 45% at 70% 45%, rgba(0,168,107,0.05) 0%, transparent 65%)' }}
      />

      <div className="relative z-10 w-full max-w-6xl mx-auto px-7 md:px-10 pt-28 pb-16 md:py-24">
        <div className="grid grid-cols-1 md:grid-cols-[1.05fr,0.95fr] gap-14 md:gap-8 items-center">

          {/* Copy */}
          <motion.div style={{ opacity: copyOpacity }} className="flex flex-col items-center md:items-start text-center md:text-left">
            <motion.div
              className="flex items-center gap-3 mb-8"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: EASE }}
            >
              <img src="/images/logo.svg" alt="" className="w-8 h-8" />
              <span className="font-courier tracking-[0.35em] uppercase text-[11px] text-white/45">
                opus loop
              </span>
            </motion.div>

            <h1 className="text-[2.6rem] md:text-[3.6rem] lg:text-[4.2rem] font-bold leading-[1.04] tracking-[-0.03em] text-white">
              {['Stillness,', 'on loop.'].map((line, i) => (
                <span key={line} className="block overflow-hidden pb-1 -mb-1">
                  <motion.span
                    className="block"
                    initial={{ y: '105%' }}
                    animate={{ y: 0 }}
                    transition={{ duration: 0.9, delay: 0.15 + i * 0.12, ease: EASE }}
                  >
                    {i === 1 ? (<>on <span className="text-opus-green">loop</span>.</>) : line}
                  </motion.span>
                </span>
              ))}
            </h1>

            <motion.p
              className="mt-6 text-base md:text-lg text-white/50 max-w-md leading-relaxed"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5, ease: EASE }}
            >
              Set a duration, choose a sound, press play. A timer for
              meditation, focus, prayer, and sleep — set up once,
              yours forever.
            </motion.p>

            <motion.div
              className="mt-9 flex flex-col sm:flex-row items-center gap-3.5"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.65, ease: EASE }}
            >
              <AppStoreBadge />
              <WebPlayerLink />
            </motion.div>

            <motion.p
              className="mt-7 font-courier text-[11px] tracking-[0.22em] uppercase text-white/30"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.9 }}
            >
              free · no account · no subscription
            </motion.p>
          </motion.div>

          {/* Phone */}
          <motion.div
            style={{ y: phoneY }}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.1, delay: 0.3, ease: EASE }}
            className="flex justify-center"
          >
            <HeroPhone />
          </motion.div>
        </div>
      </div>

      {/* Scroll cue */}
      <motion.div
        className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10 hidden md:block"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.8, duration: 1 }}
      >
        <motion.div
          className="w-px h-12 bg-gradient-to-b from-transparent via-white/25 to-transparent"
          animate={{ scaleY: [1, 0.6, 1] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
        />
      </motion.div>
    </section>
  );
};

// ────────────────────────────────────────────────────────────
// Movement I — Set the time (living duration wheel)
// ────────────────────────────────────────────────────────────

const WHEEL_STOPS = ['1', '5', '10', '25', '45', '90', '∞'];
const WHEEL_ITEM_H = 72;

const DurationWheelDemo = () => {
  const prefersReduced = useReducedMotion();
  const [stop, setStop] = useState(2); // rests on "10"

  useEffect(() => {
    if (prefersReduced) return undefined;
    const timer = setInterval(() => setStop((s) => (s + 1) % WHEEL_STOPS.length), 2600);
    return () => clearInterval(timer);
  }, [prefersReduced]);

  return (
    <div className="relative w-[240px] mx-auto select-none" aria-hidden="true">
      {/* selection lines, like the app */}
      <div className="absolute left-6 right-6 pointer-events-none z-10" style={{ top: `calc(50% - ${WHEEL_ITEM_H / 2}px)`, height: WHEEL_ITEM_H }}>
        <div className="absolute top-0 left-0 right-0 h-px bg-white/12" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-white/12" />
      </div>

      <div
        className="overflow-hidden"
        style={{
          height: WHEEL_ITEM_H * 5,
          maskImage: 'linear-gradient(to bottom, transparent, rgba(0,0,0,0.4) 18%, black 38%, black 62%, rgba(0,0,0,0.4) 82%, transparent)',
          WebkitMaskImage: 'linear-gradient(to bottom, transparent, rgba(0,0,0,0.4) 18%, black 38%, black 62%, rgba(0,0,0,0.4) 82%, transparent)',
        }}
      >
        <motion.div
          animate={{ y: WHEEL_ITEM_H * 2 - stop * WHEEL_ITEM_H }}
          transition={{ type: 'spring', stiffness: 90, damping: 16 }}
        >
          {WHEEL_STOPS.map((label, i) => (
            <div key={label} className="flex items-baseline justify-center gap-2" style={{ height: WHEEL_ITEM_H }}>
              <motion.span
                className="font-courier font-bold text-white"
                animate={{ opacity: i === stop ? 1 : 0.25, scale: i === stop ? 1 : 0.82 }}
                transition={{ duration: 0.5, ease: EASE }}
                style={{ fontSize: 44, lineHeight: `${WHEEL_ITEM_H}px` }}
              >
                {label}
              </motion.span>
              {label !== '∞' && (
                <motion.span
                  className="font-courier text-sm text-white/35"
                  animate={{ opacity: i === stop ? 1 : 0 }}
                  transition={{ duration: 0.4 }}
                >
                  min
                </motion.span>
              )}
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
};

const SetTimeSection = () => (
  <section className="relative w-full max-w-6xl mx-auto px-7 md:px-10 py-24 md:py-36">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-14 md:gap-20 items-center">
      <Reveal className="order-2 md:order-1">
        <div className="relative rounded-[32px] border border-white/[0.07] bg-white/[0.015] py-10 overflow-hidden">
          <SpiralRings opacity={0.05} />
          <div className="relative">
            <DurationWheelDemo />
          </div>
          <p className="relative text-center font-courier text-[11px] tracking-[0.25em] uppercase text-white/30 mt-2">
            one minute — three hours — ∞
          </p>
        </div>
      </Reveal>

      <Reveal className="order-1 md:order-2 text-center md:text-left" delay={0.12}>
        <Movement numeral="I" title="Set the time" />
        <h2 className="text-[1.9rem] md:text-[2.5rem] font-bold tracking-[-0.02em] leading-[1.12] text-white mb-5">
          One dial.<br />All the time you need.
        </h2>
        <p className="text-[15px] md:text-base text-white/50 leading-[1.75] max-w-md mx-auto md:mx-0">
          Spin the wheel to anywhere between a single minute and three hours —
          or choose ∞ and let the session breathe with no end at all.
        </p>
        <p className="text-[15px] md:text-base text-white/50 leading-[1.75] max-w-md mx-auto md:mx-0 mt-4">
          Interval bells can mark the passage every few minutes, so you stay
          with your breath instead of the clock.
        </p>
      </Reveal>
    </div>
  </section>
);

// ────────────────────────────────────────────────────────────
// Movement II — Choose the sound (coverflow + Apple Music)
// ────────────────────────────────────────────────────────────

const SoundSection = () => {
  const prefersReduced = useReducedMotion();

  return (
    <section className="relative w-full max-w-6xl mx-auto px-7 md:px-10 py-24 md:py-36">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-14 md:gap-20 items-center">
        <Reveal className="text-center md:text-left" delay={0.12}>
          <Movement numeral="II" title="Choose the sound" />
          <h2 className="text-[1.9rem] md:text-[2.5rem] font-bold tracking-[-0.02em] leading-[1.12] text-white mb-5">
            Bring your own teacher.
          </h2>
          <p className="text-[15px] md:text-base text-white/50 leading-[1.75] max-w-md mx-auto md:mx-0">
            Binaural beats, colored noise, a bell every five minutes — or
            nothing at all. Import guided meditations from your own files, or
            stream anything in your Apple Music library.*
          </p>
          <p className="font-courier text-lg italic text-white/60 mt-7">
            A <span className="text-opus-green not-italic">tool</span>, not a service.
          </p>
          <p className="text-[15px] md:text-base text-white/50 leading-[1.75] max-w-md mx-auto md:mx-0 mt-3">
            No catalog to browse. No content you didn&apos;t choose. The sounds
            that already center you, inside the timer.
          </p>
          <p className="text-[11px] text-white/30 mt-7 leading-relaxed">
            * Streaming requires an active Apple Music subscription.
          </p>
        </Reveal>

        <Reveal className="relative flex justify-center" delay={0.05}>
          <div className="relative">
            <div className="phone-halo" />
            <PhoneFrame className="w-[240px] md:w-[270px]">
              <img
                src="/images/app/sound-coverflow.webp"
                alt="Choosing a soundtrack in OPUS Loop"
                className="w-full h-full object-cover"
                loading="lazy"
                decoding="async"
              />
            </PhoneFrame>

            {/* Floating Apple Music import card */}
            <motion.div
              className="absolute -right-10 sm:-right-16 md:-right-24 bottom-6 w-[150px] md:w-[180px]"
              initial={{ opacity: 0, y: 24, rotate: 6 }}
              whileInView={{ opacity: 1, y: 0, rotate: 3 }}
              viewport={{ once: true, margin: '-90px' }}
              transition={{ duration: 0.9, delay: 0.35, ease: EASE }}
            >
              <motion.div
                className="rounded-2xl overflow-hidden border border-white/12 shadow-[0_20px_60px_rgba(0,0,0,0.6)]"
                animate={prefersReduced ? undefined : { y: [0, -6, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
              >
                <img
                  src="/images/app/import-apple-music.webp"
                  alt="Importing a track from Apple Music"
                  className="w-full h-auto"
                  style={{ objectFit: 'cover', aspectRatio: '9/13', objectPosition: '50% 42%' }}
                  loading="lazy"
                  decoding="async"
                />
              </motion.div>
            </motion.div>
          </div>
        </Reveal>
      </div>
    </section>
  );
};

// ────────────────────────────────────────────────────────────
// Movement III — Press play (session running)
// ────────────────────────────────────────────────────────────

const PlaySection = () => (
  <section className="relative w-full max-w-6xl mx-auto px-7 md:px-10 py-24 md:py-36">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-14 md:gap-20 items-center">
      <Reveal className="order-2 md:order-1 flex justify-center">
        <div className="relative">
          <div className="phone-halo" />
          <PhoneFrame className="w-[240px] md:w-[270px]">
            <img
              src="/images/app/session-running.webp"
              alt="A running session in OPUS Loop"
              className="w-full h-full object-cover"
              loading="lazy"
              decoding="async"
            />
          </PhoneFrame>
        </div>
      </Reveal>

      <Reveal className="order-1 md:order-2 text-center md:text-left" delay={0.12}>
        <Movement numeral="III" title="Press play" />
        <h2 className="text-[1.9rem] md:text-[2.5rem] font-bold tracking-[-0.02em] leading-[1.12] text-white mb-5">
          Press play.<br />Disappear.
        </h2>
        <p className="text-[15px] md:text-base text-white/50 leading-[1.75] max-w-md mx-auto md:mx-0">
          The interface recedes into a living backdrop — or a photo of your
          own. A bell opens the session, a bell closes it. In between, there is
          nothing to look at and nothing to do.
        </p>
        <p className="text-[15px] md:text-base text-white/50 leading-[1.75] max-w-md mx-auto md:mx-0 mt-4">
          Your mindful minutes sync quietly to Apple Health, with heart rate
          from your Watch if you wear one.
        </p>
      </Reveal>
    </div>
  </section>
);

// ────────────────────────────────────────────────────────────
// Interlude — privacy manifesto, revealed word by word
// ────────────────────────────────────────────────────────────

const MANIFESTO = [
  { text: 'No account.' },
  { text: 'No tracking.' },
  { text: 'No catalog.' },
  { text: 'No streak', break: true },
  { text: 'to keep alive.' },
  { text: 'Your practice stays on', break: true },
  { text: 'your device,', accent: true },
  { text: 'and we prefer it that way.' },
];

const ManifestoSection = () => {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 0.85', 'start 0.3'] });

  // flatten into words, tracking accent + line breaks
  const words = [];
  MANIFESTO.forEach((seg, si) => {
    seg.text.split(' ').forEach((w, wi) => {
      words.push({ w, accent: seg.accent, break: seg.break && wi === 0, key: `${si}-${wi}` });
    });
  });

  return (
    <section className="relative w-full py-32 md:py-44 overflow-hidden grain">
      <SpiralRings opacity={0.045} />
      <div ref={ref} className="relative z-10 max-w-3xl mx-auto px-8 text-center">
        <p className="font-courier text-[11px] tracking-[0.35em] uppercase text-white/30 mb-10">
          — interlude —
        </p>
        <p className="font-courier text-xl md:text-[1.7rem] leading-[1.9] text-white">
          {words.map((word, i) => (
            <ManifestoWord
              key={word.key}
              progress={scrollYProgress}
              range={[i / words.length, Math.min(1, (i + 1.4) / words.length)]}
              accent={word.accent}
              lineBreak={word.break}
            >
              {word.w}
            </ManifestoWord>
          ))}
        </p>
      </div>
    </section>
  );
};

const ManifestoWord = ({ children, progress, range, accent, lineBreak }) => {
  const opacity = useTransform(progress, range, [0.13, 1]);
  return (
    <>
      {lineBreak && <br />}
      <motion.span
        style={{ opacity }}
        className={`inline-block mr-[0.45em] ${accent ? 'text-opus-green' : ''}`}
      >
        {children}
      </motion.span>
    </>
  );
};

// ────────────────────────────────────────────────────────────
// Movement IV — Make it yours (interactive preset switcher)
// ────────────────────────────────────────────────────────────

const PresetsSection = () => {
  const [active, setActive] = useState(0);
  const preset = PRESETS[active];

  return (
    <section className="relative w-full max-w-6xl mx-auto px-7 md:px-10 py-24 md:py-36">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-14 md:gap-20 items-center">
        <Reveal className="text-center md:text-left" delay={0.12}>
          <Movement numeral="IV" title="Make it yours" />
          <h2 className="text-[1.9rem] md:text-[2.5rem] font-bold tracking-[-0.02em] leading-[1.12] text-white mb-5">
            One app.<br />Every ritual.
          </h2>
          <p className="text-[15px] md:text-base text-white/50 leading-[1.75] max-w-md mx-auto md:mx-0">
            Name your sessions, give them icons and living backgrounds, then
            swipe between them like presets on an instrument. Morning
            stillness, deep work, wind-down — each remembers its own
            duration, sound, and bells.
          </p>
          <p className="text-[15px] md:text-base text-white/50 leading-[1.75] max-w-md mx-auto md:mx-0 mt-4">
            Try one below — this is the actual app.
          </p>

          {/* Preset chips */}
          <div className="mt-8 flex flex-wrap justify-center md:justify-start gap-2.5">
            {PRESETS.map((p, i) => {
              const ActiveIcon = p.Icon;
              const isActive = i === active;
              return (
                <button
                  key={p.id}
                  onClick={() => setActive(i)}
                  className={`relative inline-flex items-center gap-2 pl-3.5 pr-4 py-2 rounded-full font-courier text-[12px] tracking-[0.12em] transition-colors duration-300 border ${
                    isActive
                      ? 'text-white border-transparent'
                      : 'text-white/40 border-white/10 hover:text-white/70 hover:border-white/25'
                  }`}
                >
                  {isActive && (
                    <motion.span
                      layoutId="preset-chip"
                      className="absolute inset-0 rounded-full bg-white/[0.1] border border-white/25"
                      transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                    />
                  )}
                  <span className="relative flex items-center gap-2">
                    <ActiveIcon size={14} />
                    {p.name}
                  </span>
                </button>
              );
            })}
          </div>
        </Reveal>

        <Reveal className="flex flex-col items-center" delay={0.05}>
          <div className="relative">
            <div className="phone-halo" />
            <PhoneFrame className="w-[240px] md:w-[280px]">
              <AnimatePresence mode="sync">
                <motion.img
                  key={preset.id}
                  src={preset.src}
                  alt={`OPUS Loop — ${preset.name} preset`}
                  className="absolute inset-0 w-full h-full object-cover"
                  initial={{ opacity: 0, scale: 1.05 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.7, ease: 'easeInOut' }}
                  loading="lazy"
                  decoding="async"
                />
              </AnimatePresence>
            </PhoneFrame>
          </div>
          <div className="h-4 mt-6 overflow-hidden" aria-hidden="true">
            <AnimatePresence mode="wait">
              <motion.span
                key={preset.id}
                className="block font-courier text-[11px] tracking-[0.25em] text-white/35"
                initial={{ y: 14, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -14, opacity: 0 }}
                transition={{ duration: 0.4, ease: EASE }}
              >
                ♪ {preset.sound}
              </motion.span>
            </AnimatePresence>
          </div>
        </Reveal>
      </div>
    </section>
  );
};

// ────────────────────────────────────────────────────────────
// Ecosystem
// ────────────────────────────────────────────────────────────

const EcosystemSection = () => (
  <section className="relative w-full max-w-6xl mx-auto px-7 md:px-10 py-24 md:py-36">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-14 md:gap-20 items-center">
      <Reveal className="order-2 md:order-1 flex justify-center">
        <img
          src="/images/mockup-ecosystem.png"
          alt="OPUS Loop on iPad, iPhone, and Apple Watch"
          className="w-full max-w-lg"
          loading="lazy"
          decoding="async"
        />
      </Reveal>

      <Reveal className="order-1 md:order-2 text-center md:text-left" delay={0.12}>
        <p className="font-courier text-[11px] tracking-[0.35em] uppercase text-opus-green mb-6">
          Everywhere you are
        </p>
        <h2 className="text-[1.9rem] md:text-[2.5rem] font-bold tracking-[-0.02em] leading-[1.12] text-white mb-5">
          At home in the<br />Apple ecosystem.
        </h2>
        <ul className="text-[15px] md:text-base text-white/50 leading-[1.75] max-w-md mx-auto md:mx-0 space-y-3 text-left">
          {[
            ['Apple Watch', 'a full companion app, with heart rate during sessions'],
            ['Apple Health', 'mindful minutes and Mind & Body workouts, synced'],
            ['Live Activities', 'your session, quietly on the Lock Screen'],
            ['iCloud', 'presets follow you across iPhone, iPad, and Mac'],
          ].map(([title, desc]) => (
            <li key={title} className="flex gap-3 items-baseline">
              <span className="w-1 h-1 rounded-full bg-opus-green flex-shrink-0 translate-y-[-2px]" />
              <span>
                <span className="text-white/85">{title}</span>
                <span className="text-white/45"> — {desc}</span>
              </span>
            </li>
          ))}
        </ul>
      </Reveal>
    </div>
  </section>
);

// ────────────────────────────────────────────────────────────
// Finale — pricing + closing CTA
// ────────────────────────────────────────────────────────────

const LANGUAGES = 'English · Deutsch · Español · Français · Nederlands · Norsk · Suomi · Filipino · Magyar · Română · Telugu · 日本語 · 简体中文 · 繁體中文 · ';

const FinaleSection = () => (
  <section className="relative w-full overflow-hidden grain">
    {/* ambient video, held way back */}
    <div className="absolute inset-0 overflow-hidden">
      <video autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover opacity-[0.22]">
        <source src="/videos/pastelmountains.mp4" type="video/mp4" />
      </video>
      <div className="absolute inset-0 bg-gradient-to-b from-black via-black/70 to-black" />
    </div>

    <div className="relative z-10 max-w-4xl mx-auto px-7 md:px-10 py-28 md:py-40 text-center">
      <Reveal>
        <p className="font-courier text-[11px] tracking-[0.35em] uppercase text-opus-green mb-6">
          — finale —
        </p>
        <h2 className="text-[2.2rem] md:text-[3.2rem] font-bold tracking-[-0.03em] leading-[1.08] text-white">
          Free to download.<br />Yours to keep.
        </h2>
        <p className="mt-6 text-base md:text-lg text-white/50 leading-relaxed max-w-xl mx-auto">
          The timer, the sounds, the imports, the Watch app — free, with no
          trial and no limits. If OPUS Loop earns a place in your life, a
          one-time <span className="text-white/85">$4.99</span> unlocks
          unlimited saved presets.
        </p>
        <p className="mt-3 font-courier text-[13px] text-white/35 italic">
          That&apos;s the whole business model.
        </p>
      </Reveal>

      <Reveal delay={0.15} className="mt-11 flex flex-col sm:flex-row items-center justify-center gap-3.5">
        <AppStoreBadge />
        <WebPlayerLink />
      </Reveal>

      <Reveal delay={0.25} className="mt-20">
        <p className="font-courier text-[10px] tracking-[0.3em] uppercase text-white/25 mb-5">
          Available in 14 languages
        </p>
        <div className="marquee-mask overflow-hidden">
          <div className="marquee-track inline-flex whitespace-nowrap font-courier text-[12px] text-white/35">
            <span>{LANGUAGES}</span>
            <span aria-hidden="true">{LANGUAGES}</span>
          </div>
        </div>
        <p className="mt-10 text-[12px] text-white/25 italic tracking-[0.1px]">
          No philosophy imposed. No tradition assumed.
        </p>
      </Reveal>
    </div>
  </section>
);

// ────────────────────────────────────────────────────────────
// Footer
// ────────────────────────────────────────────────────────────

const Footer = () => (
  <footer className="py-12 px-8 text-center border-t border-white/[0.05]">
    <p className="text-xs text-white/25 font-courier mb-4 inline-flex items-center gap-2">
      <span className="pulse-dot inline-block w-1.5 h-1.5 rounded-full bg-opus-green" />
      Made in Romania by{' '}
      <a
        href="https://opus.ro"
        target="_blank"
        rel="noopener noreferrer"
        className="text-white/35 hover:text-white/55 transition-colors underline underline-offset-2"
      >
        OPUS
      </a>
    </p>
    <div className="flex items-center justify-center gap-4 text-xs text-white/25">
      <Link to="/player" className="hover:text-white/45 transition-colors">Web Player</Link>
      <span className="text-white/10">·</span>
      <Link to="/support" className="hover:text-white/45 transition-colors">Help</Link>
      <span className="text-white/10">·</span>
      <Link to="/privacy" className="hover:text-white/45 transition-colors">Privacy</Link>
      <span className="text-white/10">·</span>
      <Link to="/terms" className="hover:text-white/45 transition-colors">Terms</Link>
    </div>
  </footer>
);

// ────────────────────────────────────────────────────────────
// Home Page
// ────────────────────────────────────────────────────────────

const Home = () => {
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 30, restDelta: 0.001 });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="relative">
      {/* Scroll progress hairline */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-[2px] z-[70] origin-left bg-gradient-to-r from-opus-green/60 to-opus-green"
        style={{ scaleX: progress }}
      />

      <HeroSection />
      <SetTimeSection />
      <SoundSection />
      <PlaySection />
      <ManifestoSection />
      <PresetsSection />
      <EcosystemSection />
      <FinaleSection />
      <Footer />
    </div>
  );
};

export default Home;
