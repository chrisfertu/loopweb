import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTimerContext } from '../contexts/TimerContext';
import { formatTime } from '../hooks/useTimer';

const MiniPlayer = () => {
  const {
    timerState,
    elapsedSeconds,
    selectedSound,
    onPlayPause,
    onStop,
    onToggleSoundPicker,
  } = useTimerContext();

  const location = useLocation();
  const navigate = useNavigate();
  const isHome = location.pathname === '/' || location.pathname === '/clip';
  const [heroVisible, setHeroVisible] = useState(true);

  useEffect(() => {
    if (!isHome) {
      setHeroVisible(false);
      return;
    }

    const handleScroll = () => {
      setHeroVisible(window.scrollY < window.innerHeight * 0.6);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isHome]);

  const isActive = timerState === 'running' || timerState === 'paused';
  const isRunning = timerState === 'running';
  const shouldShow = isActive && !heroVisible;

  const handleTimerTap = () => {
    if (isHome) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      navigate('/');
    }
  };

  return (
    <AnimatePresence>
      {shouldShow && (
        <motion.div
          className="miniplayer"
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        >
          <div className="flex items-center justify-between w-full max-w-6xl mx-auto px-4">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <button
                onClick={onPlayPause}
                className="miniplayer-btn flex-shrink-0"
                aria-label={isRunning ? 'Pause' : 'Resume'}
              >
                {isRunning ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                    <rect x="6" y="4" width="4" height="16" rx="1" />
                    <rect x="14" y="4" width="4" height="16" rx="1" />
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                    <path d="M8 5.14v14l11-7-11-7z" />
                  </svg>
                )}
              </button>

              <button
                onClick={handleTimerTap}
                className="font-courier text-sm text-white/80 tabular-nums tracking-wide hover:text-white transition-colors"
              >
                {formatTime(elapsedSeconds)}
              </button>

              <span className="text-white/20 text-xs">·</span>

              <button
                onClick={onToggleSoundPicker}
                className="text-[13px] text-white/40 hover:text-white/60 transition-colors truncate min-w-0"
              >
                {selectedSound.label}
              </button>
            </div>

            <button
              onClick={onStop}
              className="miniplayer-btn flex-shrink-0 ml-3"
              aria-label="Stop"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
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
