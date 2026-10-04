import { useLayoutEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { m as motion, AnimatePresence } from 'framer-motion';
import { useTimerContext } from '../contexts/TimerContext';
import { formatTime } from '../hooks/useTimer';
import { usePath } from '../hooks/usePath';

// Bottom bar for a web session that is running or paused, on every route but
// /player, at any scroll position. It reads the tick context (the countdown),
// so it is the only thing outside /player that re-renders every second.
const MiniPlayer = () => {
  const {
    timerState,
    displaySeconds,
    selectedSound,
    onPlayPause,
    onStop,
    onToggleSoundPicker,
  } = useTimerContext();

  const path = usePath();
  const navigate = useNavigate();
  const barRef = useRef(null);

  const isActive = timerState === 'running' || timerState === 'paused';
  const isRunning = timerState === 'running';
  const visible = isActive && path !== '/player';

  // Publish the bar's height as --mini-h so #root pads the page above it.
  useLayoutEffect(() => {
    const root = document.documentElement;
    const bar = barRef.current;
    if (!visible || !bar) {
      root.style.setProperty('--mini-h', '0px');
      return undefined;
    }
    const publish = () => root.style.setProperty('--mini-h', `${bar.offsetHeight}px`);
    publish();
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(publish) : null;
    observer?.observe(bar);
    return () => {
      observer?.disconnect();
      root.style.setProperty('--mini-h', '0px');
    };
  }, [visible]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          ref={barRef}
          className="miniplayer"
          role="region"
          aria-label="Session"
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        >
          <div className="mx-auto flex w-full max-w-[1200px] items-center justify-between gap-3 px-4 lg:px-10 xl:px-16">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <button
                type="button"
                onClick={() => onPlayPause()}
                className="miniplayer-btn"
                aria-label={isRunning ? 'Pause' : 'Resume'}
              >
                {isRunning ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="white" aria-hidden="true">
                    <rect x="6" y="4" width="4" height="16" rx="1" />
                    <rect x="14" y="4" width="4" height="16" rx="1" />
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="white" aria-hidden="true">
                    <path d="M8 5.14v14l11-7-11-7z" />
                  </svg>
                )}
              </button>

              <button
                type="button"
                onClick={() => navigate('/player')}
                title="Open the player"
                className="min-h-[44px] rounded-md px-1 font-rounded text-xl font-light tabular-nums leading-none text-white transition-colors hover:text-white/80"
              >
                <span className="sr-only">Open the player, </span>
                {formatTime(displaySeconds)}
              </button>

              <span className="text-white/40" aria-hidden="true">·</span>

              <button
                type="button"
                onClick={onToggleSoundPicker}
                className="min-h-[44px] min-w-0 truncate rounded-md px-1 text-left font-courier text-sm font-bold text-white/70 transition-colors hover:text-white"
              >
                <span className="sr-only">Change sound, </span>
                {selectedSound.label}
              </button>
            </div>

            <button
              type="button"
              onClick={() => onStop()}
              className="miniplayer-btn"
              aria-label="Stop"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="white" aria-hidden="true">
                <rect x="6" y="6" width="12" height="12" rx="2" />
              </svg>
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default MiniPlayer;
