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
 * Simple count-up timer hook.
 * States: idle, running, paused.
 */
export function useTimer() {
  const [timerState, setTimerState] = useState('idle'); // 'idle' | 'running' | 'paused'
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const intervalRef = useRef(null);

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const start = useCallback(() => {
    clearTimer();
    setElapsedSeconds(0);
    setTimerState('running');
    intervalRef.current = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
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
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
  }, [clearTimer]);

  const stop = useCallback(() => {
    clearTimer();
    const finalSeconds = 0;
    setTimerState('idle');
    setElapsedSeconds(0);
    return finalSeconds;
  }, [clearTimer]);

  return {
    timerState,
    elapsedSeconds,
    start,
    pause,
    resume,
    stop,
    formatTime,
  };
}
