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

        {/* Main area — three equal sections: spacer, wheel/timer, controls */}
        <div className="flex-1 flex flex-col items-center w-full px-8">

          {/* Top spacer — pushes wheel/timer toward center */}
          <div className="flex-[2]" />

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

          {/* Controls — centered between wheel and sound bar */}
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

        {/* Sound bar — pinned to bottom */}
        <div className="pb-[max(32px,env(safe-area-inset-bottom))] pt-4 flex flex-col items-center w-full px-8">
          <button onClick={onToggleSoundPicker} className="sound-bar">
            <SoundIcon />
            <span className="font-courier text-sm">{selectedSound.label}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Player;
