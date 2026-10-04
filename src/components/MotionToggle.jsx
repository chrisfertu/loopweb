import { useEffect, useState } from 'react';
import { isMotionPaused, setMotionPausedPref, subscribeMotion } from '../lib/motion';

// Header control: stops every time-driven motion (the geometry field, videos).
// The choice persists through src/lib/motion.js (localStorage, guarded).
const MotionToggle = ({ className = '' }) => {
  const [paused, setPaused] = useState(isMotionPaused);

  useEffect(() => {
    setPaused(isMotionPaused());
    const unsubscribe = subscribeMotion(setPaused);
    return () => {
      unsubscribe();
    };
  }, []);

  const label = paused ? 'Resume motion' : 'Pause motion';

  return (
    <button
      type="button"
      onClick={() => setMotionPausedPref(!paused)}
      aria-label={label}
      title={label}
      className={`inline-flex min-h-[44px] min-w-[44px] items-center justify-center gap-2 rounded-full px-2 text-white/70 transition-colors hover:text-white ${className}`}
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 14 14"
        fill="currentColor"
        aria-hidden="true"
        focusable="false"
      >
        {paused ? (
          <path d="M4 2.25v9.5L11.75 7z" />
        ) : (
          <>
            <rect x="3" y="2.5" width="2.5" height="9" rx="0.75" />
            <rect x="8.5" y="2.5" width="2.5" height="9" rx="0.75" />
          </>
        )}
      </svg>
      <span className="hidden font-courier text-[11px] font-bold uppercase leading-none tracking-[0.2em] lg:inline">
        {label}
      </span>
    </button>
  );
};

export default MotionToggle;
