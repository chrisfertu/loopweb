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

  // Scroll to selected index on mount and when selection changes externally
  useEffect(() => {
    const container = containerRef.current;
    if (!container || isScrollingRef.current) return;
    // Use requestAnimationFrame to ensure DOM is ready (avoids browser scroll restoration)
    requestAnimationFrame(() => {
      container.scrollTop = selectedIndex * ITEM_HEIGHT;
    });
  }, [selectedIndex]);

  const handleScroll = useCallback(() => {
    if (disabled) return;
    isScrollingRef.current = true;

    if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    scrollTimeoutRef.current = setTimeout(() => {
      const container = containerRef.current;
      if (!container) return;
      const index = Math.round(container.scrollTop / ITEM_HEIGHT);
      const clampedIndex = Math.max(0, Math.min(index, DURATION_OPTIONS.length - 1));
      // Snap
      container.scrollTop = clampedIndex * ITEM_HEIGHT;
      if (clampedIndex !== selectedIndex) {
        onSelect(clampedIndex);
      }
      isScrollingRef.current = false;
    }, 80);
  }, [selectedIndex, onSelect, disabled]);

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
          const isSelected = i === selectedIndex;
          return (
            <div
              key={opt.label}
              className={`duration-wheel-item ${isSelected ? 'selected' : ''}`}
              style={{ height: ITEM_HEIGHT }}
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
      <div className="relative z-10 flex flex-col items-center h-full w-full">

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
                className="flex flex-col items-center"
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
                className="flex flex-col items-center"
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
