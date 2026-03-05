import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import AppPreview from '../components/AppPreview';
import { useTimerContext } from '../contexts/TimerContext';
import { formatTime } from '../hooks/useTimer';

const APP_STORE_URL = 'https://apps.apple.com/app/opus-loop-meditation-timer/id6740513432';

// ────────────────────────────────────────────────────────────
// Shared components
// ────────────────────────────────────────────────────────────

const VideoBackground = ({ opacity = 0.35 }) => (
  <div className="absolute inset-0 overflow-hidden">
    <video autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover">
      <source src="/videos/pastelmountains.mp4" type="video/mp4" />
    </video>
    <div className="absolute inset-0 bg-black" style={{ opacity: 1 - opacity }} />
  </div>
);

const SoundIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 18V5l12-2v13" />
    <circle cx="6" cy="18" r="3" />
    <circle cx="18" cy="16" r="3" />
  </svg>
);

const AppStoreButton = ({ className = '' }) => (
  <a
    href={APP_STORE_URL}
    target="_blank"
    rel="noopener noreferrer"
    className={`app-store-btn ${className}`}
  >
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
    </svg>
    <span className="text-sm font-semibold">Download on the App Store</span>
  </a>
);

const SectionReveal = ({ children, className = '', delay = 0 }) => (
  <motion.div
    className={className}
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: '-80px' }}
    transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }}
  >
    {children}
  </motion.div>
);

const soundPhrases = [
  'brown noise',
  'binaural beats',
  'silence',
  'your favorite song on repeat',
  'pink noise',
  '4Hz theta waves',
  'white noise',
  'your own soundscapes',
  'dark noise',
  '20Hz focus beats',
  'that earworm, on loop',
  '10Hz alpha waves',
];

function shuffleArray(arr) {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

const useTypingEffect = () => {
  const [text, setText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [queue, setQueue] = useState(() => shuffleArray(soundPhrases));
  const [queueIndex, setQueueIndex] = useState(0);

  useEffect(() => {
    const currentPhrase = queue[queueIndex];

    const timeout = setTimeout(() => {
      if (isDeleting) {
        if (text === '') {
          setIsDeleting(false);
          const nextIndex = queueIndex + 1;
          if (nextIndex >= queue.length) {
            setQueue(shuffleArray(soundPhrases));
            setQueueIndex(0);
          } else {
            setQueueIndex(nextIndex);
          }
        } else {
          setText((prev) => prev.slice(0, -1));
        }
      } else {
        if (text === currentPhrase) {
          setTimeout(() => setIsDeleting(true), 1400);
        } else {
          setText(currentPhrase.slice(0, text.length + 1));
        }
      }
    }, isDeleting ? 40 : 70);

    return () => clearTimeout(timeout);
  }, [text, isDeleting, queue, queueIndex]);

  return text;
};

const ScrollChevron = () => (
  <motion.div
    className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ delay: 1.5, duration: 0.8 }}
  >
    <motion.svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="white"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="opacity-30"
      animate={{ y: [0, 6, 0] }}
      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
    >
      <path d="M6 9l6 6 6-6" />
    </motion.svg>
  </motion.div>
);

// ────────────────────────────────────────────────────────────
// Section 1: Hero
// ────────────────────────────────────────────────────────────

const controlBtnSpring = { type: 'spring', stiffness: 400, damping: 22 };

const ControlButton = ({ onClick, label, children, delay = 0 }) => (
  <motion.button
    onClick={onClick}
    className="control-btn"
    initial={{ opacity: 0, scale: 0.5 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.5 }}
    whileTap={{ scale: 0.88 }}
    whileHover={{ scale: 1.06 }}
    transition={{ ...controlBtnSpring, delay }}
    aria-label={label}
  >
    {children}
  </motion.button>
);

const PlayIcon = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="white">
    <path d="M8 5.14v14l11-7-11-7z" />
  </svg>
);

const PauseIcon = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="white">
    <rect x="6" y="4" width="4" height="16" rx="1" />
    <rect x="14" y="4" width="4" height="16" rx="1" />
  </svg>
);

const StopIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="white">
    <rect x="6" y="6" width="12" height="12" rx="2" />
  </svg>
);

const MuteIcon = ({ muted, size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    {muted ? (
      <>
        <path d="M11 5L6 9H2v6h4l5 4V5z" fill="white" stroke="none" />
        <line x1="23" y1="9" x2="17" y2="15" />
        <line x1="17" y1="9" x2="23" y2="15" />
      </>
    ) : (
      <>
        <path d="M11 5L6 9H2v6h4l5 4V5z" fill="white" stroke="none" />
        <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
        <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
      </>
    )}
  </svg>
);

const HeroSection = () => {
  const {
    timerState,
    elapsedSeconds,
    selectedSound,
    isMuted,
    onPlayPause,
    onStop,
    onToggleMute,
    onToggleSoundPicker,
  } = useTimerContext();

  const isActive = timerState === 'running' || timerState === 'paused';
  const isRunning = timerState === 'running';

  return (
    <section id="hero" className="relative w-full min-h-screen flex flex-col items-center justify-center overflow-hidden">
      <VideoBackground opacity={0.6} />

      <div className="relative z-10 flex flex-col items-center text-center w-full h-screen">
        <div className="flex-1 flex flex-col items-center justify-center px-8 max-w-2xl mx-auto w-full">
          <img
            src="/images/logo.svg"
            alt="OPUS Loop"
            className={`mb-4 transition-all duration-700 ease-in-out ${
              isActive ? 'w-10 h-10 opacity-40' : 'w-20 h-20 md:w-24 md:h-24'
            }`}
          />

          <h2
            className={`font-courier tracking-[0.3em] uppercase mb-6 transition-all duration-700 ease-in-out ${
              isActive ? 'text-[10px] text-white/30' : 'text-sm md:text-base text-white/50'
            }`}
          >
            opus loop
          </h2>

          {/* Idle: tagline */}
          <div className={`flex flex-col items-center transition-all duration-700 ease-in-out ${
            isActive ? 'opacity-0 h-0 overflow-hidden' : 'opacity-100'
          }`}>
            <h1 className="text-[1.75rem] md:text-5xl lg:text-6xl font-semibold leading-[1.2] tracking-[-0.02em] mb-5 text-white">
              Your rituals, without the monthly sacrifice.
            </h1>
            <p className="text-base md:text-lg text-white/40 mb-8 max-w-md leading-relaxed">
              A meditation timer you own forever. Try it right now.
            </p>
          </div>

          {/* Active: timer */}
          <div className={`flex flex-col items-center transition-all duration-700 ease-in-out ${
            isActive ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden'
          }`}>
            <div className="timer-display">
              {formatTime(elapsedSeconds)}
            </div>
          </div>
        </div>

        {/* Bottom controls */}
        <div className="pt-6 pb-8 md:pb-12 flex flex-col items-center gap-4 w-full px-8">
          <div className="flex flex-col items-center gap-3 min-h-[60px]">
            <AnimatePresence mode="wait">
              {!isActive ? (
                <motion.div key="play-wrapper" className="flex flex-col items-center gap-3">
                  <motion.button
                    onClick={onPlayPause}
                    className="play-button"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.6 }}
                    whileTap={{ scale: 0.93 }}
                    whileHover={{ scale: 1.03 }}
                    transition={controlBtnSpring}
                    aria-label="Play"
                  >
                    <PlayIcon size={36} />
                  </motion.button>
                  <motion.p
                    className="text-[11px] text-white/25 font-courier tracking-widest uppercase"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 2, duration: 1 }}
                  >
                    Press play
                  </motion.p>
                </motion.div>
              ) : (
                <motion.div
                  key="controls-active"
                  className="flex items-center gap-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ControlButton onClick={onPlayPause} label={isRunning ? 'Pause' : 'Resume'} delay={0}>
                    {isRunning ? <PauseIcon /> : <PlayIcon />}
                  </ControlButton>
                  <ControlButton onClick={onToggleMute} label={isMuted ? 'Unmute' : 'Mute'} delay={0.04}>
                    <MuteIcon muted={isMuted} />
                  </ControlButton>
                  <ControlButton onClick={onStop} label="Stop" delay={0.08}>
                    <StopIcon />
                  </ControlButton>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button onClick={onToggleSoundPicker} className="sound-bar">
            <SoundIcon />
            <span className="font-courier text-sm">{selectedSound.label}</span>
          </button>
        </div>
      </div>

      {!isActive && <ScrollChevron />}
    </section>
  );
};

// ────────────────────────────────────────────────────────────
// Section 2: The Tool (image LEFT, text right)
// ────────────────────────────────────────────────────────────

const ToolSection = () => {
  const typedSound = useTypingEffect();

  return (
    <section className="section-container">
      <div className="section-two-col">
        <SectionReveal className="flex justify-center" delay={0.1}>
          <AppPreview
            srcs={['/images/app/soundtracks.jpeg', '/images/app/playlist.jpeg']}
            crossfadeInterval={6000}
            alt="Meditation timer sound picker and audio import"
          />
        </SectionReveal>

        <SectionReveal className="flex flex-col justify-center gap-5 text-center md:text-left" delay={0.2}>
          <h2 className="section-heading">A tool, not a service.</h2>
          <p className="section-body">
            Set a duration. Choose a sound or silence. Tap play.
          </p>
          <p className="section-body">
            Import your own guided meditations, mantras, or music from your files or Apple Music.
          </p>
          <p className="section-body">
            No catalog to browse. No content you didn't choose. Just your practice, your way.
          </p>
          <p className="font-courier text-sm text-white/20 tracking-wide mt-1">
            Now playing: <span className="text-opus-green">{typedSound}</span><span className="typing-cursor text-opus-green/50">|</span>
          </p>
        </SectionReveal>
      </div>
    </section>
  );
};

// ────────────────────────────────────────────────────────────
// Section 3: Presets (text LEFT, image right)
// ────────────────────────────────────────────────────────────

const PresetsSection = () => (
  <section className="section-container">
    <div className="section-two-col section-two-col-reverse">
      <SectionReveal className="flex flex-col justify-center gap-5 text-center md:text-left" delay={0.1}>
        <h2 className="section-heading">Configure once. Unlimited presets. Yours forever.</h2>
        <p className="section-body">
          Each preset saves everything: duration, soundtrack, bells, background, and health settings. Meditation, prayer, deep work, sleep, movement. Every practice gets its own space.
        </p>
        <p className="section-body">
          Custom icons, video backgrounds, individual reminders. Set them up once, then switch with a swipe.
        </p>
      </SectionReveal>

      <SectionReveal className="flex justify-center" delay={0.2}>
        <AppPreview
          srcs={['/images/app/preset1.jpeg', '/images/app/preset2.jpeg', '/images/app/preset3.jpeg']}
          crossfadeInterval={5000}
          alt="Customizable meditation presets with backgrounds and settings"
        />
      </SectionReveal>
    </div>
  </section>
);

// ────────────────────────────────────────────────────────────
// Section 4: Use Cases (video interlude carousel)
// ────────────────────────────────────────────────────────────

const useCases = [
  'Five minutes of stillness before the day begins.',
  'Brown noise. All night. Every night.',
  'Your teacher\'s guided meditation, wrapped in twenty minutes of silence.',
  'That one song on repeat, for an hour.',
  'A phone set up with guided meditations for your mom.',
  'Ecstatic dance with heart rate tracking on Apple Watch.',
  'A Pomodoro timer that doesn\'t pretend to be a productivity app.',
];

const UseCasesSection = () => {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);

  const go = (next) => {
    setDirection(next > current ? 1 : -1);
    setCurrent(next);
  };

  const prev = () => go((current - 1 + useCases.length) % useCases.length);
  const next = () => go((current + 1) % useCases.length);

  useEffect(() => {
    const timer = setInterval(() => {
      setDirection(1);
      setCurrent((c) => (c + 1) % useCases.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [current]);

  const variants = {
    enter: (d) => ({ opacity: 0, y: d > 0 ? 24 : -24 }),
    center: { opacity: 1, y: 0 },
    exit: (d) => ({ opacity: 0, y: d > 0 ? -24 : 24 }),
  };

  return (
    <section className="relative py-24 md:py-32 overflow-hidden">
      <VideoBackground opacity={0.25} />

      <div className="relative z-10 flex flex-col items-center">
        <SectionReveal className="text-center mb-12 md:mb-16">
          <h2 className="section-heading">How people use it.</h2>
        </SectionReveal>

        <div
          className="w-full max-w-lg mx-auto px-8 relative"
          style={{ minHeight: '5rem' }}
        >
          <AnimatePresence mode="wait" custom={direction}>
            <motion.p
              key={current}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="font-courier text-lg md:text-xl text-white/50 leading-relaxed text-center"
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.15}
              onDragEnd={(_, info) => {
                if (info.offset.x < -40 || info.velocity.x < -200) next();
                else if (info.offset.x > 40 || info.velocity.x > 200) prev();
              }}
            >
              {useCases[current]}
            </motion.p>
          </AnimatePresence>
        </div>

        {/* Navigation */}
        <div className="flex items-center gap-6 mt-10">
          <button
            onClick={prev}
            className="w-9 h-9 rounded-full flex items-center justify-center bg-white/[0.06] hover:bg-white/[0.12] transition-colors"
            aria-label="Previous"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-50">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>

          <div className="flex items-center gap-1.5">
            {useCases.map((_, i) => (
              <button
                key={i}
                onClick={() => go(i)}
                className={`rounded-full transition-all duration-300 ${
                  i === current
                    ? 'w-5 h-1.5 bg-white/40'
                    : 'w-1.5 h-1.5 bg-white/15 hover:bg-white/25'
                }`}
                aria-label={`Slide ${i + 1}`}
              />
            ))}
          </div>

          <button
            onClick={next}
            className="w-9 h-9 rounded-full flex items-center justify-center bg-white/[0.06] hover:bg-white/[0.12] transition-colors"
            aria-label="Next"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-50">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </div>
      </div>
    </section>
  );
};

// ────────────────────────────────────────────────────────────
// Section 5: Apple Ecosystem (image LEFT, text right)
// ────────────────────────────────────────────────────────────

const HealthSection = () => (
  <section className="section-container">
    <div className="section-two-col">
      <SectionReveal className="flex justify-center" delay={0.1}>
        <AppPreview type="wide" alt="Apple Watch heart rate monitoring and Apple Health integration" />
      </SectionReveal>

      <SectionReveal className="flex flex-col justify-center gap-5 text-center md:text-left" delay={0.2}>
        <h2 className="section-heading">Built for the Apple ecosystem.</h2>
        <p className="section-body">
          Apple Watch companion with heart rate monitoring. Mindful minutes synced to Apple Health. Mind & Body mode for active sessions.
        </p>
        <p className="section-body">
          Live Activities on your Lock Screen. iCloud sync across all your devices. Everything included. Nothing to unlock.
        </p>
        <p className="text-[12px] text-white/20 mt-2 leading-relaxed">
          Not on Apple? Save this website to your home screen for a free PWA timer. Android is on the roadmap.
        </p>
      </SectionReveal>
    </div>
  </section>
);

// ────────────────────────────────────────────────────────────
// Section 6: Privacy (breather)
// ────────────────────────────────────────────────────────────

const PrivacySection = () => (
  <section className="w-full max-w-2xl mx-auto px-8 py-20 md:py-24 text-center">
    <SectionReveal>
      <h2 className="text-2xl md:text-3xl font-medium tracking-[-0.02em] text-white mb-4">
        No account. No tracking. No data collection.
      </h2>
      <p className="text-white/35 text-base md:text-lg leading-relaxed mb-2">
        Your practice stays on your device and your iCloud.
      </p>
      <p className="text-white/25 text-base md:text-lg leading-relaxed">
        We don't know who you are. We prefer it that way.
      </p>
    </SectionReveal>
  </section>
);

// ────────────────────────────────────────────────────────────
// Section 7: Closing (video bg, pricing card)
// ────────────────────────────────────────────────────────────

const ClosingSection = () => (
  <section className="relative py-28 md:py-36 overflow-hidden">
    <VideoBackground opacity={0.5} />

    <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'linear-gradient(177.3deg, rgba(12,14,12,0.7) 3.67%, rgba(17,18,17,0.7) 45.37%, rgba(14,21,16,0.7) 96.33%)' }} />
    <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 24% 6% at 50% 110%, rgba(35,26,151,0.18) 0%, rgba(0,168,107,0.06) 40%, transparent 70%)' }} />
    <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 16% 4% at 50% 100%, rgba(181,175,255,0.05) 0%, transparent 60%)' }} />
    <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-transparent pointer-events-none" style={{ backgroundSize: '100% 30%', backgroundRepeat: 'no-repeat' }} />

    <div className="relative z-10 w-full max-w-[600px] mx-auto px-6 text-center flex flex-col items-center gap-10">
      <SectionReveal className="w-full">
        <div className="rounded-[20px] border border-white/[0.07] bg-white/[0.04]">
          <div className="flex flex-col items-center gap-1.5 pt-9 px-10">
            <p className="text-[52px] font-semibold text-white tracking-[-2.5px] leading-none">$4.99</p>
            <p className="text-[13px] text-white/35 tracking-[0.2px]">One-time purchase. Every feature. Every update. Forever.</p>
          </div>

          <div className="h-px bg-white/[0.06] mx-10 mt-7 mb-7" />

          <div className="flex flex-col items-center gap-3.5 pb-9 px-10">
            <AppStoreButton />
            <div className="flex items-center gap-1.5 text-[12px]">
              <span className="text-white/30">
                {'Refundable through '}
                <a
                  href="https://reportaproblem.apple.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/45 underline underline-offset-2 hover:text-white/60 transition-colors"
                >
                  Apple
                </a>
              </span>
              <span className="text-white/15">·</span>
              <button
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="text-white/45 underline underline-offset-2 hover:text-white/60 transition-colors"
              >
                Try free on the web
              </button>
            </div>
          </div>
        </div>
      </SectionReveal>

      <SectionReveal delay={0.15} className="flex flex-col items-center gap-2">
        <p className="text-[10px] font-medium text-white/20 tracking-[1px] uppercase font-courier">Available in 14 languages</p>
        <p className="text-[12px] text-white/25 leading-relaxed max-w-[488px] font-courier">
          English · Deutsch · Español · Français · Nederlands · Norsk · Suomi · Filipino · Magyar · Română · Telugu · 日本語 · 简体中文 · 繁體中文
        </p>
      </SectionReveal>

      <SectionReveal delay={0.2}>
        <p className="text-[12px] text-white/20 italic tracking-[0.1px]">
          No philosophy imposed. No tradition assumed.
        </p>
      </SectionReveal>
    </div>
  </section>
);

// ────────────────────────────────────────────────────────────
// Footer
// ────────────────────────────────────────────────────────────

const Footer = () => (
  <footer className="py-10 px-8 text-center">
    <p className="text-xs text-white/20 font-courier mb-4">
      Made in Romania by{' '}
      <a
        href="https://www.opus.ro"
        target="_blank"
        rel="noopener noreferrer"
        className="text-white/35 hover:text-white/55 transition-colors underline underline-offset-2"
      >
        OPUS
      </a>
    </p>
    <div className="flex items-center justify-center gap-4 text-xs text-white/20">
      <Link to="/privacy" className="hover:text-white/45 transition-colors">Privacy</Link>
      <span className="text-white/10">·</span>
      <Link to="/terms" className="hover:text-white/45 transition-colors">Terms</Link>
      <span className="text-white/10">·</span>
      <Link to="/support" className="hover:text-white/45 transition-colors">Support</Link>
    </div>
  </footer>
);

// ────────────────────────────────────────────────────────────
// Home Page
// ────────────────────────────────────────────────────────────

const Home = () => {
  return (
    <div>
      <HeroSection />
      <ToolSection />
      <PresetsSection />
      <UseCasesSection />
      <HealthSection />
      <PrivacySection />
      <ClosingSection />
      <Footer />
    </div>
  );
};

export default Home;
