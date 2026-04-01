import { useState, useRef, useCallback } from 'react';

/**
 * Format seconds into mm:ss or h:mm:ss.
 */
export function formatTime(totalSeconds) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;

  const mm = String(m).padStart(2, '0');
  const ss = String(s).padStart(2, '0');

  if (h > 0) {
    return `${h}:${mm}:${ss}`;
  }
  return `${mm}:${ss}`;
}

/**
 * Timer hook with count-up and countdown modes.
 * States: idle, running, paused.
 *
 * start()          — infinite count-up (default)
 * start(duration)  — countdown from duration seconds to 0
 */
export function useTimer() {
  const [timerState, setTimerState] = useState('idle'); // 'idle' | 'running' | 'paused'
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [duration, setDuration] = useState(null); // null = infinite count-up
  const intervalRef = useRef(null);
  const onCompleteRef = useRef(null);

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const start = useCallback((durationSeconds = null, onComplete = null) => {
    clearTimer();
    setElapsedSeconds(0);
    setDuration(durationSeconds);
    setTimerState('running');
    onCompleteRef.current = onComplete;
    intervalRef.current = setInterval(() => {
      setElapsedSeconds((prev) => {
        const next = prev + 1;
        // Check if countdown is done
        if (durationSeconds && next >= durationSeconds) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
          setTimerState('idle');
          setElapsedSeconds(0);
          setDuration(null);
          if (onCompleteRef.current) onCompleteRef.current();
          return 0;
        }
        return next;
      });
    }, 1000);
  }, [clearTimer]);

  const pause = useCallback(() => {
    clearTimer();
    setTimerState('paused');
  }, [clearTimer]);

  const resume = useCallback(() => {
    clearTimer();
    setTimerState('running');
    intervalRef.current = setInterval(() => {
      setElapsedSeconds((prev) => {
        const next = prev + 1;
        if (duration && next >= duration) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
          setTimerState('idle');
          setElapsedSeconds(0);
          setDuration(null);
          if (onCompleteRef.current) onCompleteRef.current();
          return 0;
        }
        return next;
      });
    }, 1000);
  }, [clearTimer, duration]);

  const stop = useCallback(() => {
    clearTimer();
    setTimerState('idle');
    setElapsedSeconds(0);
    setDuration(null);
    onCompleteRef.current = null;
    return 0;
  }, [clearTimer]);

  // Display seconds: for countdown, show remaining; for count-up, show elapsed
  const displaySeconds = duration ? Math.max(0, duration - elapsedSeconds) : elapsedSeconds;

  return {
    timerState,
    elapsedSeconds,
    displaySeconds,
    duration,
    start,
    pause,
    resume,
    stop,
    formatTime,
  };
}
