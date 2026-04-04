import { useState, useRef, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTimerContext } from '../contexts/TimerContext';
import { formatTime } from '../hooks/useTimer';
import {
  ControlButton,
  PlayIcon,
  PauseIcon,
  StopIcon,
  MuteIcon,
  SoundIcon,
} from '../components/PlayerControls';

const APP_STORE_URL = 'https://apps.apple.com/ro/app/loop-meditation-focus/id6756740657';

const isApple = typeof navigator !== 'undefined' &&
  /Mac|iPhone|iPad|iPod/.test(navigator.platform || navigator.userAgent);

const AppleIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
  </svg>
);

const BellIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);

// ────────────────────────────────────────────────────────────
// Duration options (in minutes, null = infinite)
// ────────────────────────────────────────────────────────────

const DURATION_OPTIONS = [
  { label: '∞', minutes: null },
  ...Array.from({ length: 60 }, (_, i) => ({
    label: String(i + 1),
    minutes: i + 1,
  })),
  { label: '75', minutes: 75 },
  { label: '90', minutes: 90 },
  { label: '105', minutes: 105 },
  { label: '120', minutes: 120 },
  { label: '150', minutes: 150 },
  { label: '180', minutes: 180 },
];

const ITEM_HEIGHT = 56;
const VISIBLE_ITEMS = 5;
const PADDING_ITEMS = Math.floor(VISIBLE_ITEMS / 2);

// ────────────────────────────────────────────────────────────
// Duration Wheel (iOS-style barrel picker)
// ────────────────────────────────────────────────────────────

const DurationWheel = ({ selectedIndex, onSelect, disabled }) => {
  const containerRef = useRef(null);
  const isScrollingRef = useRef(false);
  const scrollTimeoutRef = useRef(null);
  const rafRef = useRef(null);
  const [scrollTop, setScrollTop] = useState(selectedIndex * ITEM_HEIGHT);

  // Scroll to selected index on mount and when selection changes externally
  useEffect(() => {
    const container = containerRef.current;
    if (!container || isScrollingRef.current) return;
    requestAnimationFrame(() => {
      container.scrollTop = selectedIndex * ITEM_HEIGHT;
    });
  }, [selectedIndex]);

  const handleScroll = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    // Throttled scroll position tracking for visual effects
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      setScrollTop(container.scrollTop);
    });

    if (disabled) return;
    isScrollingRef.current = true;

    if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    scrollTimeoutRef.current = setTimeout(() => {
      if (!container) return;
      const index = Math.round(container.scrollTop / ITEM_HEIGHT);
      const clampedIndex = Math.max(0, Math.min(index, DURATION_OPTIONS.length - 1));
      container.scrollTop = clampedIndex * ITEM_HEIGHT;
      if (clampedIndex !== selectedIndex) {
        onSelect(clampedIndex);
      }
      isScrollingRef.current = false;
    }, 80);
  }, [selectedIndex, onSelect, disabled]);

  // Compute the floating-point center index from scroll position
  const centerIndex = scrollTop / ITEM_HEIGHT;

  return (
    <div className="duration-wheel-wrapper">
      {/* Selection highlight */}
      <div className="duration-wheel-highlight" />

      <div
        ref={containerRef}
        className="duration-wheel-scroll"
        onScroll={handleScroll}
        style={{
          height: ITEM_HEIGHT * VISIBLE_ITEMS,
        }}
      >
        {/* Top padding */}
        {Array.from({ length: PADDING_ITEMS }).map((_, i) => (
          <div key={`pad-top-${i}`} style={{ height: ITEM_HEIGHT }} />
        ))}

        {DURATION_OPTIONS.map((opt, i) => {
          const centerOffset = Math.abs(i - centerIndex);
          const opacity = Math.max(0.15, 1 - centerOffset * 0.3);
          const scale = centerOffset < 0.1 ? 1.08 : Math.max(0.88, 1 - centerOffset * 0.06);

          return (
            <div
              key={opt.label}
              className="duration-wheel-item"
              style={{
                height: ITEM_HEIGHT,
                opacity,
                transform: `scale(${scale})`,
              }}
              onClick={() => {
                if (!disabled) {
                  onSelect(i);
                  const container = containerRef.current;
                  if (container) container.scrollTop = i * ITEM_HEIGHT;
                }
              }}
            >
              <span className="duration-wheel-number">{opt.label}</span>
            </div>
          );
        })}

        {/* Bottom padding */}
        {Array.from({ length: PADDING_ITEMS }).map((_, i) => (
          <div key={`pad-bot-${i}`} style={{ height: ITEM_HEIGHT }} />
        ))}
      </div>
    </div>
  );
};

// ────────────────────────────────────────────────────────────
// Player Page
// ────────────────────────────────────────────────────────────

const Player = () => {
  const {
    timerState,
    displaySeconds,
    selectedSound,
    isMuted,
    onPlayPause,
    onStop,
    onToggleMute,
    onToggleSoundPicker,
    onToggleBellPicker,
  } = useTimerContext();

  const [durationIndex, setDurationIndex] = useState(0); // 0 = infinite

  const isActive = timerState === 'running' || timerState === 'paused';
  const isRunning = timerState === 'running';

  const handlePlay = () => {
    const opt = DURATION_OPTIONS[durationIndex];
    const durationSeconds = opt.minutes ? opt.minutes * 60 : null;
    onPlayPause(durationSeconds);
  };

  const handlePlayPause = () => {
    if (timerState === 'idle') {
      handlePlay();
    } else {
      onPlayPause();
    }
  };

  return (
    <div className="player-page">
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden">
        <video autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover">
          <source src="/videos/square-spiral.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-black/60" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center h-full w-full overflow-hidden">

        {/* Top bar */}
        <div className="w-full flex items-center justify-between px-6 pt-[max(16px,env(safe-area-inset-top))] pb-2">
          <Link to="/" className="flex items-center gap-2 text-white/40 hover:text-white/60 transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
            <span className="text-[11px] font-courier tracking-widest uppercase">Back</span>
          </Link>
          <img src="/images/logo.svg" alt="OPUS Loop" className="w-8 h-8 opacity-40" />
          <div className="w-16" /> {/* Spacer for centering */}
        </div>

        {/* Main area - three equal sections: spacer, wheel/timer, controls */}
        <div className="flex-1 flex flex-col items-center w-full px-8">

          {/* Top spacer - pushes wheel/timer toward center */}
          <div className="flex-[3]" />

          {/* Duration wheel (idle) / Timer display (active) */}
          <AnimatePresence mode="wait">
            {!isActive ? (
              <motion.div
                key="duration"
                className="flex flex-col items-center justify-center"
                style={{ minHeight: ITEM_HEIGHT * VISIBLE_ITEMS }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                {isApple && (
                  <a
                    href={APP_STORE_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.05] border border-white/[0.06] text-white/40 hover:bg-white/[0.08] hover:text-white/60 transition-colors mb-6 text-xs tracking-wide"
                  >
                    <AppleIcon size={14} />
                    <span>Get the app</span>
                  </a>
                )}
                <DurationWheel
                  selectedIndex={durationIndex}
                  onSelect={setDurationIndex}
                  disabled={false}
                />
              </motion.div>
            ) : (
              <motion.div
                key="timer"
                className="flex flex-col items-center justify-center"
                style={{ minHeight: ITEM_HEIGHT * VISIBLE_ITEMS }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="timer-display">
                  {formatTime(displaySeconds)}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Middle spacer */}
          <div className="flex-[1]" />

          {/* Controls - centered between wheel and sound bar */}
          <div className="flex flex-col items-center gap-3 min-h-[60px]">
            <AnimatePresence mode="wait">
              {!isActive ? (
                <motion.div key="play-wrapper" className="flex flex-col items-center gap-3">
                  <motion.button
                    onClick={handlePlay}
                    className="play-button"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.6 }}
                    whileTap={{ scale: 0.93 }}
                    whileHover={{ scale: 1.03 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 22 }}
                    aria-label="Play"
                  >
                    <PlayIcon size={36} />
                  </motion.button>
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
                  <ControlButton onClick={handlePlayPause} label={isRunning ? 'Pause' : 'Resume'} delay={0}>
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

          {/* Bottom spacer */}
          <div className="flex-[1]" />
        </div>

        {/* Bottom toolbar */}
        <div className="pb-[max(32px,env(safe-area-inset-bottom))] pt-4 flex items-center justify-center gap-6 w-full px-8">
          <a
            href={APP_STORE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="toolbar-circle-btn"
            aria-label="Get the app"
          >
            <AppleIcon size={16} />
          </a>

          <button onClick={onToggleSoundPicker} className="sound-bar">
            <SoundIcon />
            <span className="font-courier text-sm">{selectedSound.label}</span>
          </button>

          <button
            onClick={onToggleBellPicker}
            className="toolbar-circle-btn"
            aria-label="Interval bells"
          >
            <BellIcon size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Player;
