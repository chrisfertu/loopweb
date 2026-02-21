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
        <div className="flex-1 flex flex-col items-center justify-center px-6 max-w-2xl mx-auto w-full">
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
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-semibold leading-tight mb-4 text-white">
              Your rituals, without the monthly sacrifice.
            </h1>
            <p className="text-lg md:text-xl text-white/50 mb-8 max-w-lg">
              For meditation, prayer, or whatever centers you.
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
        <div className="pt-6 pb-8 md:pb-12 flex flex-col items-center gap-4 w-full px-6">
          <div className="flex items-center justify-center gap-5 min-h-[60px]">
            <AnimatePresence mode="wait">
              {!isActive ? (
                <motion.button
                  key="play-big"
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

    </section>
  );
};

// ────────────────────────────────────────────────────────────
// Section 2: What It Is
// ────────────────────────────────────────────────────────────

const WhatItIsSection = () => (
  <section className="section-container">
    <SectionReveal className="text-center mb-12 md:mb-16">
      <h2 className="section-heading">A tool, not a service.</h2>
      <p className="font-courier text-sm text-white/30 tracking-wide">Timer. Player. Nothing more.</p>
    </SectionReveal>

    <div className="section-two-col">
      <SectionReveal className="flex justify-center" delay={0.1}>
        <AppPreview src="/images/app/timer.m4v" alt="Timer screen" />
      </SectionReveal>

      <SectionReveal className="flex flex-col justify-center" delay={0.2}>
        <p className="text-white/50 text-base leading-relaxed mb-4">
          You set a duration, choose a soundtrack or silence, and tap play. That's it.
        </p>
        <p className="text-white/50 text-base leading-relaxed mb-4">
          Underneath that simplicity: unlimited presets, each with its own soundtrack, bell
          configuration, background visuals, and reminder schedule. Set them up once. Switch
          between them with a swipe.
        </p>
        <p className="text-white/50 text-base leading-relaxed">
          No locked features. No tiers. No upsells. You get the whole thing.
        </p>
      </SectionReveal>
    </div>
  </section>
);

// ────────────────────────────────────────────────────────────
// Section 3: Presets
// ────────────────────────────────────────────────────────────

const PresetsSection = () => (
  <section className="section-container">
    <SectionReveal className="text-center mb-12 md:mb-16">
      <h2 className="section-heading">Set it up your way. Keep it forever.</h2>
    </SectionReveal>

    <div className="section-two-col section-two-col-reverse">
      <SectionReveal className="flex flex-col justify-center" delay={0.1}>
        <p className="text-white/50 text-base leading-relaxed mb-4">
          Each preset saves everything: duration, soundtrack, bells, background, and health toggles.
          One for morning meditation, one for deep work, one for prayer. Your call.
        </p>
        <p className="text-white/50 text-base leading-relaxed mb-4">
          Custom icons, video or image backgrounds, individual reminder schedules. Make each one feel
          like its own app.
        </p>
        <p className="text-white/50 text-base leading-relaxed">
          Set it up once, then it's one tap.
        </p>
      </SectionReveal>

      <SectionReveal className="flex justify-center" delay={0.2}>
        <AppPreview
          srcs={['/images/app/preset1.jpeg', '/images/app/preset2.jpeg', '/images/app/preset3.jpeg']}
          crossfadeInterval={2000}
          alt="Presets"
        />
      </SectionReveal>
    </div>
  </section>
);

// ────────────────────────────────────────────────────────────
// Section 4: Sounds
// ────────────────────────────────────────────────────────────

const SoundsSection = () => {
  const typedSound = useTypingEffect();

  return (
    <section className="section-container">
      <SectionReveal className="text-center mb-12 md:mb-16">
        <h2 className="section-heading">Bring your own teacher.</h2>
        <p className="font-courier text-sm text-white/30 tracking-wide">
          Or try <span className="text-opus-green">{typedSound}</span><span className="typing-cursor text-opus-green/50">|</span>
        </p>
      </SectionReveal>

      <div className="section-two-col">
      <SectionReveal className="flex justify-center" delay={0.1}>
        <AppPreview
          srcs={['/images/app/soundtracks.jpeg', '/images/app/playlist.jpeg']}
          crossfadeInterval={3000}
          alt="Sound picker"
        />
      </SectionReveal>

        <SectionReveal className="flex flex-col justify-center" delay={0.2}>
          <p className="text-white/50 text-base leading-relaxed mb-4">
            Import guided meditations, mantras, or music from your files or iCloud Drive.
            Use Apple Music. Or use the built-in procedural soundscapes: binaural beats,
            white noise, pink noise, brown noise, dark noise.
          </p>
          <p className="text-white/50 text-base leading-relaxed mb-4">
            Imported tracks can loop or play once. Switch sounds mid-session without
            stopping the timer.
          </p>
          <p className="text-white/50 text-base leading-relaxed">
            Or just sit in silence. The app doesn't mind.
          </p>
        </SectionReveal>
      </div>
    </section>
  );
};

// ────────────────────────────────────────────────────────────
// Section 5: Use Cases (rhythm break)
// ────────────────────────────────────────────────────────────

const useCases = [
  '5 minutes of guided breathing before a meeting.',
  'Brown noise on repeat for the entire night.',
  'A 25-minute interval bell for deep work sessions.',
  'Your favorite song from Apple Music, on loop, for an hour.',
  'A 3-minute guided meditation inside a 20-minute silent session.',
  'Ecstatic dance with heart rate tracking and active calories.',
  'Set up a phone with guided meditations for your mom.',
  'A silent timer that lets your podcast keep playing.',
];

const UseCasesSection = () => (
  <section className="section-container">
    <SectionReveal className="text-center mb-10 md:mb-14">
      <p className="font-courier text-xs text-white/25 tracking-[0.2em] uppercase">One app, many practices</p>
    </SectionReveal>

    <div className="max-w-xl mx-auto">
      {useCases.map((line, i) => (
        <SectionReveal key={i} delay={0.05 * i}>
          <p className="font-courier text-sm md:text-base text-white/40 py-3 border-b border-white/[0.04] last:border-b-0">
            {line}
          </p>
        </SectionReveal>
      ))}
    </div>
  </section>
);

// ────────────────────────────────────────────────────────────
// Section 6: Health, Watch, Live Activities
// ────────────────────────────────────────────────────────────

const HealthSection = () => (
  <section className="section-container">
    <SectionReveal className="text-center mb-12 md:mb-16">
      <h2 className="section-heading">Track your practice, not your spending.</h2>
    </SectionReveal>

    <div className="section-two-col section-two-col-reverse">
      <SectionReveal className="flex flex-col justify-center" delay={0.1}>
        <p className="text-white/50 text-base leading-relaxed mb-4">
          Sessions sync to Apple Health as mindful minutes. Automatically. No extra steps.
        </p>
        <p className="text-white/50 text-base leading-relaxed mb-4">
          Apple Watch companion with heart rate monitoring. Start, pause, and track sessions
          from your wrist. Mind & Body mode turns any session into a workout.
        </p>
        <p className="text-white/50 text-base leading-relaxed mb-4">
          Live Activities put your session on the Lock Screen. Your presets, soundtracks,
          and history sync across devices through iCloud.
        </p>
        <p className="text-white/50 text-base leading-relaxed">
          All of this is included. There's nothing to unlock.
        </p>
      </SectionReveal>

      <SectionReveal className="flex justify-center" delay={0.2}>
        <AppPreview type="wide" alt="Apple Watch" />
      </SectionReveal>
    </div>
  </section>
);

// ────────────────────────────────────────────────────────────
// Section 7: Closing (Privacy + Pricing + CTA)
// ────────────────────────────────────────────────────────────

const ClosingSection = () => (
  <section className="relative py-24 md:py-32 overflow-hidden">
    <VideoBackground opacity={0.5} />

    <div className="relative z-10 w-full max-w-2xl mx-auto px-6 text-center">
      <SectionReveal>
        <h2 className="text-2xl md:text-4xl font-semibold text-white mb-3">
          No account. No server. No tracking.
        </h2>
        <p className="text-white/40 text-base md:text-lg max-w-md mx-auto mb-16">
          Your practice stays yours. We don't know who you are, and we prefer it that way.
        </p>
      </SectionReveal>

      <SectionReveal delay={0.15}>
        <p className="text-5xl md:text-6xl font-semibold text-white mb-2">$4.99</p>
        <p className="text-white/40 text-base mb-8">One-time. Everything included.</p>
        <AppStoreButton />
        <p className="text-xs text-white/25 mt-4 font-courier">
          Refundable through{' '}
          <a
            href="https://reportaproblem.apple.com"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-white/40 transition-colors"
          >
            Apple
          </a>
          {' · '}
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="underline underline-offset-2 hover:text-white/40 transition-colors"
          >
            Try free on the web
          </button>
        </p>
      </SectionReveal>

      <SectionReveal delay={0.25} className="mt-16">
        <p className="text-[11px] text-white/25 font-courier mb-1">Available in 14 languages</p>
        <p className="text-xs text-white/15 font-courier leading-relaxed">
          English · Deutsch · Español · Français · Nederlands · Norsk · Suomi · Filipino · Magyar · Română · Telugu · 日本語 · 简体中文 · 繁體中文
        </p>
      </SectionReveal>

      <SectionReveal delay={0.3} className="mt-2">
        <p className="text-xs text-white/20 italic">
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
  <footer className="py-10 px-6 text-center">
    <p className="text-xs text-white/25 font-courier mb-4">
      Made in Romania by{' '}
      <a
        href="https://www.opus.ro"
        target="_blank"
        rel="noopener noreferrer"
        className="text-white/40 hover:text-white/60 transition-colors underline underline-offset-2"
      >
        OPUS
      </a>
    </p>
    <div className="flex items-center justify-center gap-4 text-xs text-white/25">
      <Link to="/privacy" className="hover:text-white/50 transition-colors">Privacy</Link>
      <span className="text-white/10">·</span>
      <Link to="/terms" className="hover:text-white/50 transition-colors">Terms</Link>
      <span className="text-white/10">·</span>
      <Link to="/support" className="hover:text-white/50 transition-colors">Support</Link>
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
      <WhatItIsSection />
      <PresetsSection />
      <SoundsSection />
      <UseCasesSection />
      <HealthSection />
      <ClosingSection />
      <Footer />
    </div>
  );
};

export default Home;
