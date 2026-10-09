import { useState, useRef, useCallback, useEffect } from 'react';

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
 * start()          - infinite count-up (default)
 * start(duration)  - countdown from duration seconds to 0
 *
 * Time is measured on the wall clock, not by counting ticks: a hidden tab is
 * throttled (to about one timer a minute when it is silent), so ticks only
 * refresh the display. The clock is `since` (when the current run began),
 * `banked` (milliseconds from earlier runs, before a pause) and `limit` (the
 * countdown length in seconds, or null to count up).
 */
const freshClock = (limit = null) => ({ since: 0, banked: 0, limit });

export function useTimer() {
  const [timerState, setTimerState] = useState('idle'); // 'idle' | 'running' | 'paused'
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [duration, setDuration] = useState(null); // null = infinite count-up
  const intervalRef = useRef(null);
  const onCompleteRef = useRef(null);
  const clock = useRef(freshClock());

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // The countdown reached zero. Side effects run here, never inside a state
  // updater, so onComplete runs once (StrictMode replays updaters).
  const finish = useCallback(() => {
    clearTimer();
    clock.current = freshClock();
    setTimerState('idle');
    setElapsedSeconds(0);
    setDuration(null);
    const done = onCompleteRef.current;
    onCompleteRef.current = null;
    if (done) done();
  }, [clearTimer]);

  const tick = useCallback(() => {
    const c = clock.current;
    const secs = Math.floor((c.banked + Date.now() - c.since) / 1000);
    if (c.limit && secs >= c.limit) {
      finish();
      return;
    }
    // Four ticks a second; setting the same value does not re-render.
    setElapsedSeconds(secs);
  }, [finish]);

  const run = useCallback(() => {
    clearTimer();
    clock.current.since = Date.now();
    intervalRef.current = setInterval(tick, 250);
  }, [clearTimer, tick]);

  const start = useCallback((durationSeconds = null, onComplete = null) => {
    clock.current = freshClock(durationSeconds);
    onCompleteRef.current = onComplete;
    setElapsedSeconds(0);
    setDuration(durationSeconds);
    setTimerState('running');
    run();
  }, [run]);

  const pause = useCallback(() => {
    if (intervalRef.current) {
      const c = clock.current;
      c.banked += Date.now() - c.since;
      clearTimer();
      const secs = Math.floor(c.banked / 1000);
      if (c.limit && secs >= c.limit) {
        finish();
        return;
      }
      setElapsedSeconds(secs);
    }
    setTimerState('paused');
  }, [clearTimer, finish]);

  const resume = useCallback(() => {
    // Already running: keep the current run (restarting it would lose time).
    if (intervalRef.current) return;
    setTimerState('running');
    run();
  }, [run]);

  const stop = useCallback(() => {
    clearTimer();
    clock.current = freshClock();
    setTimerState('idle');
    setElapsedSeconds(0);
    setDuration(null);
    onCompleteRef.current = null;
    return 0;
  }, [clearTimer]);

  // Coming back to the tab catches the display up at once (and completes a
  // countdown that ran out while the tab was hidden).
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === 'visible' && intervalRef.current) tick();
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [tick]);

  useEffect(() => clearTimer, [clearTimer]);

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
