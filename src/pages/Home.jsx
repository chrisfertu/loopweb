import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import FullscreenScroll from '../components/FullscreenScroll';
import PlayButton from '../components/PlayButton';
import StopButton from '../components/StopButton';
import SoundPicker, { DEFAULT_SOUND } from '../components/SoundPicker';
import { useAudioEngine } from '../hooks/useAudioEngine';
import { useTimer, formatTime } from '../hooks/useTimer';

// App Store URL
const APP_STORE_URL = 'https://apps.apple.com/app/opus-loop-meditation-timer/id6740513432';

// Video background component
const VideoBackground = ({ opacity = 0.35 }) => (
  <div className="absolute inset-0 overflow-hidden">
    <video
      autoPlay
      loop
      muted
      playsInline
      className="absolute inset-0 w-full h-full object-cover"
    >
      <source src="/videos/pastelmountains.mp4" type="video/mp4" />
    </video>
    <div
      className="absolute inset-0 bg-black"
      style={{ opacity: 1 - opacity }}
    />
  </div>
);

// Typing effect for noise types
const noiseTypes = ['brown', 'white', 'pink', 'dark'];

const useTypingEffect = () => {
  const [text, setText] = useState(noiseTypes[0]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (isDeleting) {
        if (text === '') {
          setIsDeleting(false);
          setCurrentIndex((prev) => (prev + 1) % noiseTypes.length);
        } else {
          setText((prev) => prev.slice(0, -1));
        }
      } else {
        const nextWord = noiseTypes[currentIndex];
        if (text === nextWord) {
          setTimeout(() => setIsDeleting(true), 1200);
        } else {
          setText(nextWord.slice(0, text.length + 1));
        }
      }
    }, isDeleting ? 80 : 120);

    return () => clearTimeout(timeout);
  }, [text, isDeleting, currentIndex]);

  return text;
};

// App Store Download Button
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

// Sound icon for the bottom bar
const SoundIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 18V5l12-2v13" />
    <circle cx="6" cy="18" r="3" />
    <circle cx="18" cy="16" r="3" />
  </svg>
);

// ---- SECTION 1: HERO (dual mode) ----
const HeroSection = ({ timerState, elapsedSeconds, selectedSound, showSoundPicker, customTrack, onPlayPause, onStop, onToggleSoundPicker, onSelectSound, onImportTrack, onToggleLoop }) => {
  const isActive = timerState === 'running' || timerState === 'paused';
  const isRunning = timerState === 'running';

  return (
    <section className="slide flex flex-col items-center justify-center relative">
      <VideoBackground opacity={0.6} />

      <div className="relative z-10 flex flex-col items-center text-center w-full h-full">
        {/* Main content area - vertically centered */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 max-w-2xl mx-auto w-full">

          {/* Logo */}
          <img
            src="/images/logo.svg"
            alt="OPUS Loop"
            className={`mb-4 transition-all duration-700 ease-in-out ${
              isActive ? 'w-10 h-10 opacity-40' : 'w-20 h-20 md:w-24 md:h-24'
            }`}
          />

          {/* App name */}
          <h2
            className={`font-courier tracking-[0.3em] uppercase mb-6 transition-all duration-700 ease-in-out ${
              isActive ? 'text-[10px] text-white/30' : 'text-sm md:text-base text-white/50'
            }`}
          >
            opus loop
          </h2>

          {/* IDLE LAYER - marketing copy */}
          <div
            className={`flex flex-col items-center transition-all duration-700 ease-in-out ${
              isActive ? 'opacity-0 h-0 overflow-hidden' : 'opacity-100'
            }`}
          >
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-semibold leading-tight mb-4 text-white">
              Your rituals, without the monthly sacrifice.
            </h1>
            <p className="text-lg md:text-xl text-white/50 mb-8 max-w-lg">
              For meditation, prayer, or whatever centers you.
            </p>
          </div>

          {/* ACTIVE LAYER - timer display */}
          <div
            className={`flex flex-col items-center transition-all duration-700 ease-in-out ${
              isActive ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden'
            }`}
          >
            <div className="timer-display">
              {formatTime(elapsedSeconds)}
            </div>
          </div>

          {/* App Store CTA - always visible */}
          <div className={`flex flex-col items-center mt-6 transition-opacity duration-700 ${isActive ? 'opacity-60' : 'opacity-100'}`}>
            <AppStoreButton />
            <p className="text-xs text-white/30 mt-3 font-courier">$4.99 · one-time purchase</p>
          </div>
        </div>

        {/* Bottom controls - always visible */}
        <div className="pb-8 md:pb-12 flex flex-col items-center gap-4 w-full px-6">
          {/* Play/Stop buttons */}
          <div className="flex items-center gap-4">
            <AnimatePresence>
              {isActive && (
                <StopButton onClick={onStop} />
              )}
            </AnimatePresence>
            <PlayButton isPlaying={isRunning} onClick={onPlayPause} />
          </div>

          {/* Sound selector bar */}
          <button
            onClick={onToggleSoundPicker}
            className="sound-bar"
          >
            <SoundIcon />
            <span className="font-courier text-sm">{selectedSound.label}</span>
          </button>
        </div>
      </div>

      {/* Sound Picker */}
      <SoundPicker
        isOpen={showSoundPicker}
        onClose={onToggleSoundPicker}
        selectedSound={selectedSound}
        onSelectSound={onSelectSound}
        customTrack={customTrack}
        onImportTrack={onImportTrack}
        onToggleLoop={onToggleLoop}
      />
    </section>
  );
};

// ---- SECTION 2: FEATURES ----
const FeaturesSection = () => {
  const noiseText = useTypingEffect();

  const features = [
    {
      title: 'Bring your own teacher.',
      description: 'Import guided meditations, mantras, or music from your files, iCloud Drive, or Apple Music.',
    },
    {
      title: (
        <span>
          Binaural beats and <span className="text-opus-green">{noiseText}</span> noise.
        </span>
      ),
      description: 'Procedurally generated soundscapes built in. No downloads. No extras.',
    },
    {
      title: 'Set it up your way. Keep it forever.',
      description: 'Unlimited presets, each with its own soundtrack, bells, background, and schedule.',
    },
    {
      title: 'Track your practice, not your spending.',
      description: 'Apple Health, Apple Watch, Live Activities, streaks, stats. Mind & Body mode with heart rate.',
    },
  ];

  return (
    <section className="slide flex items-center justify-center relative">
      <div className="ambient-bg" />

      <div className="relative z-10 w-full max-w-3xl mx-auto px-6">
        <motion.div
          className="text-center mb-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-2xl md:text-4xl font-semibold text-white mb-2">
            A tool, not a service.
          </h2>
          <p className="text-white/40 font-courier text-sm">Timer. Player. Nothing more.</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              className="feature-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 * index, duration: 0.6 }}
            >
              <h3 className="text-base md:text-lg font-medium text-white mb-2 leading-snug">
                {feature.title}
              </h3>
              <p className="text-sm text-white/40 leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>

        <motion.p
          className="text-center text-xs text-white/25 mt-8 font-courier"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.6 }}
        >
          No subscription. No &ldquo;Pro&rdquo; upgrade. No account. Everything included.
        </motion.p>
      </div>
    </section>
  );
};

// ---- SECTION 3: PHILOSOPHY + FOOTER ----
const PhilosophySection = () => (
  <section className="slide flex items-center justify-center relative">
    <VideoBackground opacity={0.5} />

    <div className="relative z-10 w-full max-w-2xl mx-auto px-6 text-center">
      <motion.div
        className="mb-12"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h2 className="text-2xl md:text-4xl font-semibold text-white mb-3">
          No account. No server. No tracking.
        </h2>
        <p className="text-white/40 text-base md:text-lg max-w-md mx-auto">
          Your practice stays yours. We don&rsquo;t know who you are, and we prefer it that way.
        </p>
      </motion.div>

      <motion.div
        className="mb-14"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.6 }}
      >
        <AppStoreButton />
        <p className="text-xs text-white/30 mt-3 font-courier">$4.99 · one-time purchase · refundable</p>
      </motion.div>

      <motion.div
        className="text-xs text-white/25 space-y-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.6 }}
      >
        <p className="font-courier">
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

        <div className="flex items-center justify-center gap-4 text-white/30">
          <Link to="/privacy" className="hover:text-white/50 transition-colors">Privacy</Link>
          <span className="text-white/15">·</span>
          <Link to="/terms" className="hover:text-white/50 transition-colors">Terms</Link>
          <span className="text-white/15">·</span>
          <Link to="/support" className="hover:text-white/50 transition-colors">Support</Link>
        </div>
      </motion.div>
    </div>
  </section>
);

// ---- HOME PAGE ----
const Home = () => {
  const [currentSection, setCurrentSection] = useState(0);
  const [selectedSound, setSelectedSound] = useState(DEFAULT_SOUND);
  const [showSoundPicker, setShowSoundPicker] = useState(false);
  const [customTrack, setCustomTrack] = useState(null);

  const timer = useTimer();
  const audio = useAudioEngine();

  const handlePlayPause = useCallback(() => {
    if (timer.timerState === 'idle') {
      timer.start();
      audio.play(selectedSound);
    } else if (timer.timerState === 'running') {
      timer.pause();
      audio.pause();
    } else if (timer.timerState === 'paused') {
      timer.resume();
      audio.resume();
    }
  }, [timer, audio, selectedSound]);

  const handleStop = useCallback(async () => {
    timer.stop();
    await audio.stop();
  }, [timer, audio]);

  const handleSelectSound = useCallback((sound) => {
    setSelectedSound(sound);
    // If currently playing, switch the sound live
    if (timer.timerState === 'running') {
      audio.play(sound);
    }
    setShowSoundPicker(false);
  }, [timer.timerState, audio]);

  const handleImportTrack = useCallback((file) => {
    const track = { name: file.name, file, loop: true };
    setCustomTrack(track);
    const sound = { type: 'custom', label: file.name, file, loop: true };
    setSelectedSound(sound);
    if (timer.timerState === 'running') {
      audio.play(sound);
    }
  }, [timer.timerState, audio]);

  const handleToggleLoop = useCallback(() => {
    if (!customTrack) return;
    const newLoop = !customTrack.loop;
    setCustomTrack({ ...customTrack, loop: newLoop });
    if (selectedSound.type === 'custom') {
      const updatedSound = { ...selectedSound, loop: newLoop };
      setSelectedSound(updatedSound);
      if (timer.timerState === 'running') {
        audio.play(updatedSound);
      }
    }
  }, [customTrack, selectedSound, timer.timerState, audio]);

  return (
    <FullscreenScroll onSectionChange={setCurrentSection} locked={false}>
      <HeroSection
        timerState={timer.timerState}
        elapsedSeconds={timer.elapsedSeconds}
        selectedSound={selectedSound}
        showSoundPicker={showSoundPicker}
        customTrack={customTrack}
        onPlayPause={handlePlayPause}
        onStop={handleStop}
        onToggleSoundPicker={() => setShowSoundPicker((v) => !v)}
        onSelectSound={handleSelectSound}
        onImportTrack={handleImportTrack}
        onToggleLoop={handleToggleLoop}
      />
      <FeaturesSection />
      <PhilosophySection />
    </FullscreenScroll>
  );
};

export default Home;
