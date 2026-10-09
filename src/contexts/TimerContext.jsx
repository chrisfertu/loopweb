import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
  useLayoutEffect,
  useMemo,
} from 'react';
import { useAudioEngine } from '../hooks/useAudioEngine';
import { useTimer, formatTime } from '../hooks/useTimer';
import { DEFAULT_SOUND } from '../content/sounds';

// Two contexts over one provider:
// - TimerStateContext: selection, pickers, handlers and timerState. Memoised,
//   so it only changes when one of those changes (never on a tick).
// - TimerTickContext: the same object plus the per-second fields
//   (elapsedSeconds, displaySeconds). Only the Player and MiniPlayer read it.
const TimerStateContext = createContext(null);
const TimerTickContext = createContext(null);

export function TimerProvider({ children }) {
  const [selectedSound, setSelectedSound] = useState(DEFAULT_SOUND);
  const [showSoundPicker, setShowSoundPicker] = useState(false);
  const [customTrack, setCustomTrack] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [bellEnabled, setBellEnabled] = useState(false);
  const [bellInterval, setBellInterval] = useState(5);
  const [showBellPicker, setShowBellPicker] = useState(false);
  const lastBellRef = useRef(0);

  const timer = useTimer();
  const audio = useAudioEngine(); // stable object
  const { timerState, elapsedSeconds, displaySeconds, duration } = timer;

  // useTimer returns a new object every tick; the handlers read the latest one
  // through this ref so they (and the state context) stay stable.
  const timerRef = useRef(timer);
  useLayoutEffect(() => {
    timerRef.current = timer;
  });

  const unmute = useCallback(() => {
    audio.setMuted(false);
    setIsMuted(false);
  }, [audio]);

  const handlePlayPause = useCallback((durationSeconds = null) => {
    const t = timerRef.current;
    // Ignore anything that is not a positive number (e.g. a click event).
    const seconds = typeof durationSeconds === 'number' && durationSeconds > 0 ? durationSeconds : null;
    if (t.timerState === 'idle') {
      lastBellRef.current = 0;
      t.start(seconds, async () => {
        // countdown completed - stop audio
        await audio.stop();
        unmute();
      });
      unmute();
      audio.play(selectedSound);
    } else if (t.timerState === 'running') {
      t.pause();
      audio.pause();
      unmute();
    } else if (t.timerState === 'paused') {
      t.resume();
      audio.resume();
      unmute();
    }
  }, [audio, selectedSound, unmute]);

  const handleStop = useCallback(async () => {
    timerRef.current.stop();
    lastBellRef.current = 0;
    await audio.stop();
    unmute();
  }, [audio, unmute]);

  const handleSelectSound = useCallback((sound) => {
    setSelectedSound(sound);
    if (timerRef.current.timerState === 'running') {
      audio.play(sound);
    }
    setShowSoundPicker(false);
  }, [audio]);

  const handleImportTrack = useCallback((file) => {
    const track = { name: file.name, file, loop: true };
    setCustomTrack(track);
    const sound = { type: 'custom', label: file.name, file, loop: true };
    setSelectedSound(sound);
    if (timerRef.current.timerState === 'running') {
      audio.play(sound);
    }
  }, [audio]);

  const handleToggleLoop = useCallback(() => {
    if (!customTrack) return;
    const newLoop = !customTrack.loop;
    setCustomTrack({ ...customTrack, loop: newLoop });
    if (selectedSound.type === 'custom') {
      const updatedSound = { ...selectedSound, loop: newLoop };
      setSelectedSound(updatedSound);
      if (timerRef.current.timerState === 'running') {
        audio.play(updatedSound);
      }
    }
  }, [customTrack, selectedSound, audio]);

  const handleToggleMute = useCallback(() => {
    if (timerRef.current.timerState !== 'running') return;
    const next = !isMuted;
    audio.setMuted(next);
    setIsMuted(next);
  }, [audio, isMuted]);

  const toggleSoundPicker = useCallback(() => {
    setShowSoundPicker((v) => !v);
    setShowBellPicker(false);
  }, []);

  const toggleBellPicker = useCallback(() => {
    setShowBellPicker((v) => !v);
    setShowSoundPicker(false);
  }, []);

  const closePickers = useCallback(() => {
    setShowSoundPicker(false);
    setShowBellPicker(false);
  }, []);

  const handleSetBellEnabled = useCallback((enabled) => {
    setBellEnabled(enabled);
  }, []);

  const handleSetBellInterval = useCallback((minutes) => {
    setBellInterval(minutes);
  }, []);

  // Interval bell. lastBellRef counts the intervals already rung (reset to 0
  // on start and stop), so a skipped or late tick still rings the bell once,
  // never twice. Turning the bell on or changing the interval mid-session
  // starts counting from the current interval, so nothing rings at once.
  // (Declared before the ringing effect so it runs first.)
  useEffect(() => {
    const minutes = bellInterval;
    lastBellRef.current = minutes ? Math.floor(timerRef.current.elapsedSeconds / (minutes * 60)) : 0;
  }, [bellEnabled, bellInterval]);

  useEffect(() => {
    if (timerState !== 'running' || !bellEnabled || !bellInterval) return;
    const intervalSec = bellInterval * 60;
    const due = Math.floor(elapsedSeconds / intervalSec);
    if (due > lastBellRef.current) {
      lastBellRef.current = due;
      audio.playBell();
    }
  }, [elapsedSeconds, timerState, bellEnabled, bellInterval, audio]);

  const stateValue = useMemo(() => ({
    timerState,
    duration,
    selectedSound,
    showSoundPicker,
    customTrack,
    isMuted,
    formatTime,
    onPlayPause: handlePlayPause,
    onStop: handleStop,
    onSelectSound: handleSelectSound,
    onImportTrack: handleImportTrack,
    onToggleLoop: handleToggleLoop,
    onToggleMute: handleToggleMute,
    onToggleSoundPicker: toggleSoundPicker,
    bellEnabled,
    bellInterval,
    showBellPicker,
    onToggleBellPicker: toggleBellPicker,
    onSetBellEnabled: handleSetBellEnabled,
    onSetBellInterval: handleSetBellInterval,
    onClosePickers: closePickers,
  }), [
    timerState,
    duration,
    selectedSound,
    showSoundPicker,
    customTrack,
    isMuted,
    handlePlayPause,
    handleStop,
    handleSelectSound,
    handleImportTrack,
    handleToggleLoop,
    handleToggleMute,
    toggleSoundPicker,
    bellEnabled,
    bellInterval,
    showBellPicker,
    toggleBellPicker,
    handleSetBellEnabled,
    handleSetBellInterval,
    closePickers,
  ]);

  const tickValue = useMemo(
    () => ({ ...stateValue, elapsedSeconds, displaySeconds }),
    [stateValue, elapsedSeconds, displaySeconds],
  );

  return (
    <TimerStateContext.Provider value={stateValue}>
      <TimerTickContext.Provider value={tickValue}>
        {children}
      </TimerTickContext.Provider>
    </TimerStateContext.Provider>
  );
}

/**
 * Everything, including the per-second fields. Re-renders every second while
 * a session runs: only for the Player and the MiniPlayer.
 */
export function useTimerContext() {
  const context = useContext(TimerTickContext);
  if (!context) {
    throw new Error('useTimerContext must be used within a TimerProvider');
  }
  return context;
}

/**
 * The same object without elapsedSeconds/displaySeconds. It does not change
 * on ticks, so landing components and the app shell use this one.
 */
export function useTimerState() {
  const context = useContext(TimerStateContext);
  if (!context) {
    throw new Error('useTimerState must be used within a TimerProvider');
  }
  return context;
}
