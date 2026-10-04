// The web player: a free timer in the browser, drawn like the app.
//
// Behind it, the app's default background: the flowing spiral, drawn by
// the same geometry field as the landing page (PLAYER), turning a little
// faster and brighter while a session runs. In front, the app's timer
// screen: the duration wheel (rounded light digits, one value at a time,
// with its neighbours fading), the round glass play button, and under them
// the rail: the App Store, the sound and the interval bell, with the sound's
// name under it. In a session the wheel becomes the rolling clock and the
// play button becomes pause, mute and stop.

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, m as motion } from 'framer-motion';
import { useTimerContext } from '../contexts/TimerContext';
import { formatTime } from '../hooks/useTimer';
import GeometryField from '../geometry/GeometryField';
import { GeometryAnchor, SceneTrigger } from '../geometry/components';
import { PLAYER, withSession } from '../geometry/scenes';
import Digits from '../components/landing/stage/Digits';
import { BellIcon, MuteIcon, PauseIcon, PlayIcon, SoundIcon, StopIcon, UnmuteIcon } from '../components/landing/stage/icons';
import { APP_STORE_URL } from '../components/landing/links';
import { withBase } from '../lib/base';

const AppleIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
  </svg>
);

// ── Durations (minutes; null = no end), as on the app's wheel ──

const DURATION_OPTIONS = [
  { label: '∞', minutes: null },
  ...Array.from({ length: 60 }, (_, i) => ({ label: String(i + 1), minutes: i + 1 })),
  ...[75, 90, 105, 120, 150, 180].map((m) => ({ label: String(m), minutes: m })),
];
const DEFAULT_INDEX = 10; // ten minutes, the app's default preset

// One value at a time, as in the app; the ones above and below fade.
const ITEM_HEIGHT = 108;
const VISIBLE_ITEMS = 3;
const PADDING_ITEMS = Math.floor(VISIBLE_ITEMS / 2);

const DIGITS_SIZE = 'clamp(64px, 21vw, 104px)';
const SPRING = { type: 'spring', stiffness: 400, damping: 26 };

// ── Duration wheel ─────────────────────────────────────────

function DurationWheel({ selectedIndex, onSelect }) {
  const containerRef = useRef(null);
  const isScrollingRef = useRef(false);
  const scrollTimeoutRef = useRef(null);
  const rafRef = useRef(null);
  const [scrollTop, setScrollTop] = useState(selectedIndex * ITEM_HEIGHT);

  // Scroll to the selected value on mount and when it changes from outside.
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
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => setScrollTop(container.scrollTop));
    isScrollingRef.current = true;
    if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    scrollTimeoutRef.current = setTimeout(() => {
      const index = Math.max(0, Math.min(Math.round(container.scrollTop / ITEM_HEIGHT), DURATION_OPTIONS.length - 1));
      container.scrollTop = index * ITEM_HEIGHT;
      if (index !== selectedIndex) onSelect(index);
      isScrollingRef.current = false;
    }, 80);
  }, [selectedIndex, onSelect]);

  const centerIndex = scrollTop / ITEM_HEIGHT;

  return (
    <div className="duration-wheel-wrapper">
      <div
        ref={containerRef}
        className="duration-wheel-scroll"
        onScroll={handleScroll}
        role="listbox"
        aria-label="Duration in minutes"
        aria-activedescendant={`duration-${selectedIndex}`}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'ArrowUp') onSelect(Math.max(0, selectedIndex - 1));
          else if (e.key === 'ArrowDown') onSelect(Math.min(DURATION_OPTIONS.length - 1, selectedIndex + 1));
          else return;
          e.preventDefault();
        }}
        style={{ height: ITEM_HEIGHT * VISIBLE_ITEMS }}
      >
        {Array.from({ length: PADDING_ITEMS }).map((_, i) => (
          <div key={`pad-top-${i}`} style={{ height: ITEM_HEIGHT }} />
        ))}
        {DURATION_OPTIONS.map((opt, i) => {
          const off = Math.abs(i - centerIndex);
          return (
            <div
              key={opt.label}
              id={`duration-${i}`}
              role="option"
              aria-selected={i === selectedIndex}
              aria-label={opt.minutes ? `${opt.minutes} minutes` : 'No end'}
              className="duration-wheel-item"
              style={{
                height: ITEM_HEIGHT,
                opacity: Math.max(0, 1 - off * 0.9),
                transform: `scale(${Math.max(0.7, 1 - off * 0.18)})`,
              }}
              onClick={() => {
                onSelect(i);
                const container = containerRef.current;
                if (container) container.scrollTop = i * ITEM_HEIGHT;
              }}
            >
              <span className="stage-digits" style={{ fontSize: DIGITS_SIZE }}>
                {opt.label}
              </span>
            </div>
          );
        })}
        {Array.from({ length: PADDING_ITEMS }).map((_, i) => (
          <div key={`pad-bot-${i}`} style={{ height: ITEM_HEIGHT }} />
        ))}
      </div>
    </div>
  );
}

// A round glass button with one of the app's icons.
function RoundButton({ label, size, onClick, href, children, className = '' }) {
  const style = { width: size, height: size };
  const cls = `stage-btn shrink-0 transition-transform duration-100 active:scale-95 hover:bg-white/[0.12] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-opus-green ${className}`;
  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" aria-label={label} className={cls} style={style}>
        {children}
      </a>
    );
  }
  return (
    <button type="button" onClick={onClick} aria-label={label} className={cls} style={style}>
      {children}
    </button>
  );
}

// ── Player page ────────────────────────────────────────────

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

  const [durationIndex, setDurationIndex] = useState(DEFAULT_INDEX);
  const isActive = timerState === 'running' || timerState === 'paused';
  const isRunning = timerState === 'running';

  const scene = useMemo(() => withSession(PLAYER, isRunning), [isRunning]);

  const handlePlay = () => {
    const opt = DURATION_OPTIONS[durationIndex];
    onPlayPause(opt.minutes ? opt.minutes * 60 : null);
  };

  return (
    <div className="player-page">
      <GeometryField />
      <SceneTrigger scene={scene} className="absolute inset-0" aria-hidden="true">
        <GeometryAnchor name="player" className="player-anchor" />
      </SceneTrigger>

      <div className="relative z-10 flex h-full w-full flex-col items-center overflow-hidden">
        {/* Top bar */}
        <div className="flex w-full items-center justify-between px-6 pb-2 pt-[max(16px,env(safe-area-inset-top))]">
          <Link to="/" className="flex min-h-[44px] items-center gap-2 text-white/65 transition-colors hover:text-white/85">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M15 18l-6-6 6-6" />
            </svg>
            <span className="font-courier text-[11px] uppercase tracking-widest">Back</span>
          </Link>
          <img src={withBase('/images/logo.svg')} alt="Loop" className="h-7 w-7 opacity-50" />
          <div className="w-16" />
        </div>

        <div className="flex w-full flex-1 flex-col items-center px-8">
          <div className="flex-[3]" />

          {/* The wheel (idle) or the clock (in a session) */}
          <div className="flex items-center justify-center" style={{ minHeight: ITEM_HEIGHT * VISIBLE_ITEMS }}>
            <AnimatePresence mode="wait" initial={false}>
              {!isActive ? (
                <motion.div key="wheel" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
                  <DurationWheel selectedIndex={durationIndex} onSelect={setDurationIndex} />
                </motion.div>
              ) : (
                <motion.div key="clock" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.6 }}>
                  <Digits value={formatTime(displaySeconds)} style={{ fontSize: DIGITS_SIZE }} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex-[1]" />

          {/* Play, or pause, mute and stop */}
          <div className="flex min-h-[108px] items-center justify-center">
            <AnimatePresence mode="wait" initial={false}>
              {!isActive ? (
                <motion.div key="play" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.7 }} transition={SPRING}>
                  <RoundButton label="Start" size={108} onClick={handlePlay}>
                    <span className="block h-[46px] w-[46px]">
                      <PlayIcon />
                    </span>
                  </RoundButton>
                </motion.div>
              ) : (
                <motion.div
                  key="session"
                  className="flex items-center gap-5"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25 }}
                >
                  <RoundButton label={isRunning ? 'Pause' : 'Resume'} size={60} onClick={() => onPlayPause()}>
                    <span className="block h-7 w-7">{isRunning ? <PauseIcon /> : <PlayIcon />}</span>
                  </RoundButton>
                  <RoundButton label={isMuted ? 'Unmute' : 'Mute'} size={60} onClick={onToggleMute}>
                    <span className="block h-7 w-7">{isMuted ? <MuteIcon /> : <UnmuteIcon />}</span>
                  </RoundButton>
                  <RoundButton label="Stop" size={60} onClick={onStop}>
                    <span className="block h-7 w-7">
                      <StopIcon />
                    </span>
                  </RoundButton>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex-[1]" />
        </div>

        {/* The rail: the App Store, the sound, the interval bell */}
        <div className="flex w-full flex-col items-center gap-3 px-8 pb-[max(28px,env(safe-area-inset-bottom))] pt-4">
          <div className="flex items-center justify-center gap-[clamp(28px,12vw,64px)]">
            <RoundButton label="Get the app" size={52} href={APP_STORE_URL}>
              <AppleIcon size={18} />
            </RoundButton>
            <RoundButton label={`Sound: ${selectedSound.label}`} size={52} onClick={onToggleSoundPicker}>
              <span className="block h-6 w-6">
                <SoundIcon />
              </span>
            </RoundButton>
            <RoundButton label="Interval bells" size={52} onClick={onToggleBellPicker}>
              <span className="block h-[18px] w-[18px]">
                <BellIcon />
              </span>
            </RoundButton>
          </div>
          <p className="font-courier text-[14px] font-bold leading-5 text-muted">{selectedSound.label}</p>
        </div>
      </div>
    </div>
  );
};

export default Player;
