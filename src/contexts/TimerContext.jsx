import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { useAudioEngine } from '../hooks/useAudioEngine';
import { useTimer, formatTime } from '../hooks/useTimer';
import { DEFAULT_SOUND } from '../components/SoundPicker';

const TimerContext = createContext(null);

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
  const audio = useAudioEngine();

  const handlePlayPause = useCallback((durationSeconds = null) => {
    if (timer.timerState === 'idle') {
      lastBellRef.current = 0;
      timer.start(durationSeconds, async () => {
        // countdown completed — stop audio
        await audio.stop();
        setIsMuted(false);
      });
      audio.play(selectedSound);
      setIsMuted(false);
    } else if (timer.timerState === 'running') {
      timer.pause();
      audio.pause();
      setIsMuted(false);
    } else if (timer.timerState === 'paused') {
      timer.resume();
      audio.resume();
      setIsMuted(false);
    }
  }, [timer, audio, selectedSound]);

  const handleStop = useCallback(async () => {
    timer.stop();
    await audio.stop();
    setIsMuted(false);
    lastBellRef.current = 0;
  }, [timer, audio]);

  const handleSelectSound = useCallback((sound) => {
    setSelectedSound(sound);
    if (timer.timerState === 'running') {
      audio.play(sound);
    }
    setShowSoundPicker(false);
  }, [timer.timerState, audio]);

  const handleImportTrack = useCallback((file) => {
    const track = { name: file.name, file, loop: true };
    setCustomTrack(track);
    const sound = { type: 'custom', label: file.name, file, loop: true };
    setSelectedSound(sound);
    if (timer.timerState === 'running') {
      audio.play(sound);
    }
  }, [timer.timerState, audio]);

  const handleToggleLoop = useCallback(() => {
    if (!customTrack) return;
    const newLoop = !customTrack.loop;
    setCustomTrack({ ...customTrack, loop: newLoop });
    if (selectedSound.type === 'custom') {
      const updatedSound = { ...selectedSound, loop: newLoop };
      setSelectedSound(updatedSound);
      if (timer.timerState === 'running') {
        audio.play(updatedSound);
      }
    }
  }, [customTrack, selectedSound, timer.timerState, audio]);

  const handleToggleMute = useCallback(() => {
    if (timer.timerState !== 'running') return;
    if (isMuted) {
      audio.resume();
      setIsMuted(false);
    } else {
      audio.pause();
      setIsMuted(true);
    }
  }, [timer.timerState, audio, isMuted]);

  const toggleSoundPicker = useCallback(() => {
    setShowSoundPicker((v) => !v);
  }, []);

  const toggleBellPicker = useCallback(() => {
    setShowBellPicker((v) => !v);
  }, []);

  const handleSetBellEnabled = useCallback((enabled) => {
    setBellEnabled(enabled);
  }, []);

  const handleSetBellInterval = useCallback((minutes) => {
    setBellInterval(minutes);
  }, []);

  // Play bell at interval during active timer
  useEffect(() => {
    if (timer.timerState !== 'running' || !bellEnabled || !bellInterval) return;
    const intervalSec = bellInterval * 60;
    const elapsed = timer.elapsedSeconds;
    if (elapsed > 0 && elapsed % intervalSec === 0 && elapsed !== lastBellRef.current) {
      lastBellRef.current = elapsed;
      audio.playBell();
    }
  }, [timer.elapsedSeconds, timer.timerState, bellEnabled, bellInterval, audio]);

  const value = {
    timerState: timer.timerState,
    elapsedSeconds: timer.elapsedSeconds,
    displaySeconds: timer.displaySeconds,
    duration: timer.duration,
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
  };

  return (
    <TimerContext.Provider value={value}>
      {children}
    </TimerContext.Provider>
  );
}

export function useTimerContext() {
  const context = useContext(TimerContext);
  if (!context) {
    throw new Error('useTimerContext must be used within a TimerProvider');
  }
  return context;
}
